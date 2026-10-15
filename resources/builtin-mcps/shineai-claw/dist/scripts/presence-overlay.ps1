# ShineAI Claw — click-through presence overlay (Windows PowerShell 5.1)
# Stdin commands: MARK <x> <y> <label> | BADGE <label> | HIDE | QUIT
# EOF on stdin also quits (parent-death watchdog).
# Coordinates match the Claw pipeline: physical pixels (process Per-Monitor-V2 DPI aware),
# same space as PersistentShell screenshot/click/SendInput. Awareness is set below BEFORE any
# WinForms / VirtualScreen call so the overlay window is positioned in true physical pixels.
#
# ponytail: stdin is polled from the WinForms timer via BaseStream.BeginRead.
# A dedicated Thread + ReadLine deadlocks against Application.Run in PS 5.1.

$ErrorActionPreference = 'Continue'
$ProgressPreference = 'SilentlyContinue'

# Per-Monitor-V2 DPI awareness — must run before WinForms loads any window / queries VirtualScreen.
# Already-set (e.g. by manifest) → setter returns false; not an error, fall through to weaker mode.
Add-Type -Namespace ClawDpi -Name Native -MemberDefinition @'
[DllImport("user32.dll")] public static extern bool SetProcessDpiAwarenessContext(IntPtr value);
[DllImport("shcore.dll")] public static extern int SetProcessDpiAwareness(int awareness);
[DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
'@
try {
    if (-not [ClawDpi.Native]::SetProcessDpiAwarenessContext([IntPtr](-4))) {
        try { [void][ClawDpi.Native]::SetProcessDpiAwareness(2) } catch { try { [void][ClawDpi.Native]::SetProcessDPIAware() } catch {} }
    }
} catch {
    try { [void][ClawDpi.Native]::SetProcessDpiAwareness(2) } catch { try { [void][ClawDpi.Native]::SetProcessDPIAware() } catch {} }
}

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

Add-Type -ReferencedAssemblies @('System.Windows.Forms.dll','System.Drawing.dll','System.dll') -TypeDefinition @"
using System;
using System.Drawing;
using System.Windows.Forms;

public class PresenceOverlayForm : Form {
    public PresenceOverlayForm() {
        this.FormBorderStyle = FormBorderStyle.None;
        this.ShowInTaskbar = false;
        this.TopMost = true;
        this.StartPosition = FormStartPosition.Manual;
        this.ControlBox = false;
        this.MinimizeBox = false;
        this.MaximizeBox = false;
        this.BackColor = Color.FromArgb(255, 0, 255);
        this.TransparencyKey = this.BackColor;
        this.SetStyle(
            ControlStyles.AllPaintingInWmPaint |
            ControlStyles.UserPaint |
            ControlStyles.OptimizedDoubleBuffer |
            ControlStyles.ResizeRedraw,
            true);
        this.UpdateStyles();
    }

    protected override bool ShowWithoutActivation {
        get { return true; }
    }

    protected override CreateParams CreateParams {
        get {
            CreateParams cp = base.CreateParams;
            cp.ExStyle |= 0x00000080; // WS_EX_TOOLWINDOW  (no Alt-Tab / taskbar)
            cp.ExStyle |= 0x00080000; // WS_EX_LAYERED
            cp.ExStyle |= 0x00000020; // WS_EX_TRANSPARENT (click-through)
            cp.ExStyle |= 0x08000000; // WS_EX_NOACTIVATE
            return cp;
        }
    }

    protected override void WndProc(ref Message m) {
        const int WM_MOUSEACTIVATE = 0x0021;
        const int MA_NOACTIVATE = 3;
        if (m.Msg == WM_MOUSEACTIVATE) {
            m.Result = (IntPtr)MA_NOACTIVATE;
            return;
        }
        base.WndProc(ref m);
    }
}
"@

$vs = [System.Windows.Forms.SystemInformation]::VirtualScreen
$script:vsX = [int]$vs.X
$script:vsY = [int]$vs.Y
$script:vsW = [int]$vs.Width
$script:vsH = [int]$vs.Height

$script:hasRing = $false
$script:ringX = 0
$script:ringY = 0
$script:label = ''
$script:shownAt = [datetime]::UtcNow
$script:pulseT = 0.0
$script:idleMs = 1800
$script:fadeMs = 300

# ASCII-safe "操作中" so PS 5.1 -File (no BOM) does not mojibake.
$script:badgePrefix = 'ShineAI Claw ' + [char]0x64CD + [char]0x4F5C + [char]0x4E2D

$script:pending = New-Object 'System.Collections.Generic.Queue[string]'
$script:stdinStream = $null
$script:stdinBuf = New-Object System.Text.StringBuilder
$script:stdinChunk = New-Object byte[] 1024
$script:stdinPending = $null
$script:stdinEof = $false

$script:font = $null
try {
    $script:font = New-Object System.Drawing.Font('Microsoft YaHei UI', 11, [System.Drawing.FontStyle]::Bold)
} catch {
    try {
        $script:font = New-Object System.Drawing.Font('Segoe UI', 11, [System.Drawing.FontStyle]::Bold)
    } catch {
        $script:font = New-Object System.Drawing.Font([System.Drawing.FontFamily]::GenericSansSerif, 11, [System.Drawing.FontStyle]::Bold)
    }
}

$form = New-Object PresenceOverlayForm
$form.Location = New-Object System.Drawing.Point($script:vsX, $script:vsY)
$form.Size = New-Object System.Drawing.Size($script:vsW, $script:vsH)
$form.Opacity = 1
$script:form = $form

# Always-on pump: 30fps while visible, slow drain while hidden so MARK/QUIT
# still arrive after Hide() without a fragile BeginInvoke marshal.
$timer = New-Object System.Windows.Forms.Timer
$timer.Interval = 200
$script:timer = $timer

function Request-Quit {
    try { [System.Windows.Forms.Application]::Exit() } catch {}
    [Environment]::Exit(0)
}

function Enqueue-PresenceCommand([string]$line) {
    if ($null -eq $line) {
        Request-Quit
        return
    }
    $head = $line.Trim()
    if ($head.Length -ge 4 -and $head.Substring(0, 4).ToUpperInvariant() -eq 'QUIT') {
        Request-Quit
        return
    }
    $script:pending.Enqueue($line)
}

function Hide-Overlay {
    try { $script:form.Hide() } catch {}
    try { $script:form.Opacity = 1 } catch {}
    try { $script:timer.Interval = 200 } catch {}
    $script:hasRing = $false
}

function Show-Overlay {
    $script:shownAt = [datetime]::UtcNow
    $script:pulseT = 0.0
    try { $script:form.Opacity = 1 } catch {}
    try {
        if (-not $script:form.Visible) { $script:form.Show() }
        $script:form.TopMost = $true
    } catch {}
    try { $script:timer.Interval = 33 } catch {}
    try { if (-not $script:timer.Enabled) { $script:timer.Start() } } catch {}
    try { $script:form.Invalidate() } catch {}
}

function Invoke-PresenceCommand([string]$line) {
    if ($null -eq $line) {
        Request-Quit
        return
    }
    $trim = $line.Trim()
    if ($trim.Length -eq 0) { return }

    $spIdx = $trim.IndexOf(' ')
    $cmd = $trim
    $rest = ''
    if ($spIdx -ge 0) {
        $cmd = $trim.Substring(0, $spIdx)
        $rest = $trim.Substring($spIdx + 1).Trim()
    }
    $cmdU = $cmd.ToUpperInvariant()

    if ($cmdU -eq 'QUIT') {
        Request-Quit
        return
    }
    if ($cmdU -eq 'HIDE') {
        Hide-Overlay
        return
    }
    if ($cmdU -eq 'BADGE') {
        $script:hasRing = $false
        $script:label = $rest
        Show-Overlay
        return
    }
    if ($cmdU -eq 'MARK') {
        $parts = $rest -split '\s+', 3
        if ($parts.Count -ge 2) {
            $x = 0
            $y = 0
            $okX = [int]::TryParse($parts[0], [ref]$x)
            $okY = [int]::TryParse($parts[1], [ref]$y)
            if ($okX -and $okY) {
                $script:hasRing = $true
                $script:ringX = $x
                $script:ringY = $y
                if ($parts.Count -ge 3) { $script:label = $parts[2] } else { $script:label = '' }
                Show-Overlay
            }
        }
        return
    }
}

function Drain-Commands {
    while ($script:pending.Count -gt 0) {
        Invoke-PresenceCommand ($script:pending.Dequeue())
    }
}

function Kick-StdinRead {
    if ($script:stdinEof) { return }
    if ($null -eq $script:stdinStream) { return }
    if ($null -ne $script:stdinPending) { return }
    try {
        $script:stdinPending = $script:stdinStream.BeginRead($script:stdinChunk, 0, $script:stdinChunk.Length, $null, $null)
    } catch {
        $script:stdinEof = $true
        Request-Quit
    }
}

function Poll-Stdin {
    if ($script:stdinEof) { return }
    if ($null -eq $script:stdinStream) { return }
    Kick-StdinRead
    if ($null -eq $script:stdinPending) { return }
    if (-not $script:stdinPending.IsCompleted) { return }
    try {
        $n = $script:stdinStream.EndRead($script:stdinPending)
        $script:stdinPending = $null
        if ($n -le 0) {
            $script:stdinEof = $true
            Request-Quit
            return
        }
        $text = [System.Text.Encoding]::UTF8.GetString($script:stdinChunk, 0, $n)
        $i = 0
        while ($i -lt $text.Length) {
            $ch = $text[$i]
            if ($ch -eq "`n") {
                $line = $script:stdinBuf.ToString().TrimEnd("`r")
                $script:stdinBuf.Length = 0
                Enqueue-PresenceCommand $line
            } else {
                [void]$script:stdinBuf.Append($ch)
            }
            $i++
        }
        Kick-StdinRead
    } catch {
        $script:stdinEof = $true
        Request-Quit
    }
}

function Draw-Presence([System.Drawing.Graphics]$g) {
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.Clear($script:form.BackColor)

    $cyan = [System.Drawing.Color]::FromArgb(0, 200, 255)
    $white = [System.Drawing.Color]::FromArgb(240, 255, 255, 255)

    if ($script:hasRing) {
        $cx = $script:ringX - $script:vsX
        $cy = $script:ringY - $script:vsY
        $t = $script:pulseT
        $i = 0
        while ($i -lt 3) {
            $phase = ($t + ($i * 0.33)) % 1
            $radius = 14 + ($phase * 38)
            $penW = 3.0 - ($i * 0.6)
            if ($penW -lt 1.2) { $penW = 1.2 }
            $pen = New-Object System.Drawing.Pen($cyan, $penW)
            $d = [int]($radius * 2)
            $g.DrawEllipse($pen, [int]($cx - $radius), [int]($cy - $radius), $d, $d)
            $pen.Dispose()
            $i++
        }
        $core = New-Object System.Drawing.SolidBrush($cyan)
        $g.FillEllipse($core, ($cx - 5), ($cy - 5), 10, 10)
        $core.Dispose()
        $dot = New-Object System.Drawing.SolidBrush($white)
        $g.FillEllipse($dot, ($cx - 2), ($cy - 2), 4, 4)
        $dot.Dispose()
    }

    $text = $script:badgePrefix
    if ($script:label -and $script:label.Trim().Length -gt 0) {
        $text = $text + ' · ' + $script:label.Trim()
    }
    $sz = $g.MeasureString($text, $script:font)
    $bw = [int]([Math]::Ceiling($sz.Width) + 24)
    $bh = [int]([Math]::Ceiling($sz.Height) + 12)
    $pad = 16
    $primaryBounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
    $bx = [int]($primaryBounds.X - $script:vsX + $primaryBounds.Width - $bw - $pad)
    $by = [int]($primaryBounds.Y - $script:vsY + $pad)
    if ($bx -lt $pad) { $bx = $pad }

    $bg = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 16, 24, 36))
    $g.FillRectangle($bg, $bx, $by, $bw, $bh)
    $bg.Dispose()
    $border = New-Object System.Drawing.Pen($cyan, 1.5)
    $g.DrawRectangle($border, $bx, $by, $bw, $bh)
    $border.Dispose()
    $fg = New-Object System.Drawing.SolidBrush($cyan)
    $g.DrawString($text, $script:font, $fg, ($bx + 10), ($by + 5))
    $fg.Dispose()
}

$form.add_Paint({
    param($sender, $e)
    try { Draw-Presence $e.Graphics } catch {}
})

$timer.add_Tick({
    try {
        Poll-Stdin
        Drain-Commands
        if (-not $script:form.Visible) { return }
        $script:pulseT = $script:pulseT + 0.045
        if ($script:pulseT -gt 1) { $script:pulseT = $script:pulseT - 1 }

        $age = ([datetime]::UtcNow - $script:shownAt).TotalMilliseconds
        if ($age -ge $script:idleMs) {
            $over = $age - $script:idleMs
            $fade = $over / $script:fadeMs
            if ($fade -ge 1) {
                Hide-Overlay
                return
            }
            $op = 1.0 - $fade
            if ($op -lt 0.05) { $op = 0.05 }
            $script:form.Opacity = $op
        } else {
            $script:form.Opacity = 1
        }
        $script:form.Invalidate()
    } catch {}
})

$form.add_HandleCreated({
    try { if (-not $script:timer.Enabled) { $script:timer.Start() } } catch {}
})
$form.add_Load({
    try { $script:form.Hide() } catch {}
    try { if (-not $script:timer.Enabled) { $script:timer.Start() } } catch {}
})
$form.add_FormClosed({
    try { $script:timer.Stop() } catch {}
    try { if ($script:font) { $script:font.Dispose() } } catch {}
    [Environment]::Exit(0)
})

try {
    $script:stdinStream = [Console]::OpenStandardInput()
    Kick-StdinRead
} catch {}

try { $null = $form.Handle } catch {}
try { $timer.Start() } catch {}

[System.Windows.Forms.Application]::Run($form)
Request-Quit
