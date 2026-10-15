/**
 * Persistent PowerShell process — spawn once, reuse for all commands.
 * Pre-loads assemblies and C# helper classes at startup.
 * Uses base64-encoded command protocol with marker-based output delimiting.
 */
import { spawn } from 'child_process';
const MARKER = '<<<SHINEAI_DONE>>>';
const ERR_PREFIX = '<<<SHINEAI_ERR:';
const ERR_SUFFIX = '>>>';
/** All Win32 helpers consolidated into one C# class, loaded once */
const BOOTSTRAP_CSHARP = `
Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;
using System.Collections.Generic;

public class Win32 {
    // Mouse & Cursor
    [DllImport("user32.dll")] public static extern bool SetCursorPos(int X, int Y);
    [DllImport("user32.dll")] public static extern void mouse_event(uint dwFlags, uint dx, uint dy, uint dwData, UIntPtr dwExtraInfo);

    // Window management
    [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
    [DllImport("user32.dll")] public static extern IntPtr SendMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);
    [DllImport("user32.dll")] public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);
    [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern int GetWindowTextLength(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);
    [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);
    [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint processId);

    // Child window enumeration (for finding Chrome render widget)
    [DllImport("user32.dll")] public static extern bool EnumChildWindows(IntPtr hWnd, EnumWindowsProc lpEnumFunc, IntPtr lParam);
    [DllImport("user32.dll", CharSet = CharSet.Auto)] public static extern int GetClassName(IntPtr hWnd, StringBuilder lpClassName, int nMaxCount);

    // Accessibility forcing (triggers Chrome/Electron to build accessibility tree)
    [DllImport("oleacc.dll")]
    public static extern int AccessibleObjectFromWindow(IntPtr hwnd, uint dwId, ref Guid riid, [MarshalAs(UnmanagedType.IUnknown)] out object ppvObject);

    public static readonly Guid IID_IAccessible = new Guid("618736E0-3C3D-11CF-810C-00AA00389B71");
    public const uint OBJID_CLIENT = 0xFFFFFFFC;

    // Find Chrome_RenderWidgetHostHWND child and force accessibility
    public static IntPtr chromeRenderHwnd = IntPtr.Zero;
    public static bool FindChromeRenderWidget(IntPtr parentHwnd) {
        chromeRenderHwnd = IntPtr.Zero;
        EnumChildWindows(parentHwnd, (hWnd, _) => {
            var sb = new StringBuilder(256);
            GetClassName(hWnd, sb, 256);
            string cls = sb.ToString();
            if (cls == "Chrome_RenderWidgetHostHWND" || cls == "Intermediate D3D Window") {
                chromeRenderHwnd = hWnd;
                return false; // stop
            }
            return true;
        }, IntPtr.Zero);
        return chromeRenderHwnd != IntPtr.Zero;
    }

    public static bool ForceAccessibility(IntPtr hwnd) {
        try {
            object acc;
            Guid iid = IID_IAccessible;
            int hr = AccessibleObjectFromWindow(hwnd, OBJID_CLIENT, ref iid, out acc);
            return hr == 0 && acc != null;
        } catch { return false; }
    }

    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);
    [StructLayout(LayoutKind.Sequential)] public struct RECT { public int Left, Top, Right, Bottom; }

    public static List<object> windows = new List<object>();
    public static void ListWindows() {
        windows.Clear();
        EnumWindows((hWnd, _) => {
            if (!IsWindowVisible(hWnd)) return true;
            int len = GetWindowTextLength(hWnd);
            if (len == 0) return true;
            var sb = new StringBuilder(len + 1);
            GetWindowText(hWnd, sb, sb.Capacity);
            RECT r; GetWindowRect(hWnd, out r);
            uint pid; GetWindowThreadProcessId(hWnd, out pid);
            windows.Add(new { Handle = hWnd.ToInt64(), Title = sb.ToString(), ProcessId = pid,
                              X = r.Left, Y = r.Top, Width = r.Right - r.Left, Height = r.Bottom - r.Top });
            return true;
        }, IntPtr.Zero);
    }

    // ---- Input injection: SendInput absolute (one atomic call, no cursor round-trip) ----
    public const int SM_XVIRTUALSCREEN = 76;
    public const int SM_YVIRTUALSCREEN = 77;
    public const int SM_CXVIRTUALSCREEN = 78;
    public const int SM_CYVIRTUALSCREEN = 79;
    public const uint MOUSEEVENTF_MOVE = 0x0001;
    public const uint MOUSEEVENTF_WHEEL = 0x0800;
    public const uint MOUSEEVENTF_ABSOLUTE = 0x8000;
    public const uint MOUSEEVENTF_VIRTUALDESK = 0x4000;

    [StructLayout(LayoutKind.Sequential)]
    public struct MOUSEINPUT {
        public int dx; public int dy; public uint mouseData; public uint dwFlags; public uint time; public IntPtr dwExtraInfo;
    }
    [StructLayout(LayoutKind.Sequential)]
    public struct INPUT { public uint type; public MOUSEINPUT mi; }

    [DllImport("user32.dll", SetLastError = true)]
    public static extern uint SendInput(uint nInputs, INPUT[] pInputs, int cbSize);
    [DllImport("user32.dll")]
    public static extern int GetSystemMetrics(int nIndex);

    // Per-Monitor-V2 DPI awareness: set ONCE at process start, before any GDI/UIA/window call, so
    // screenshots, UIA BoundingRectangle and SendInput share one un-virtualized physical-pixel space.
    [DllImport("user32.dll")] static extern bool SetProcessDpiAwarenessContext(IntPtr value);
    [DllImport("shcore.dll")] static extern int SetProcessDpiAwareness(int awareness);
    [DllImport("user32.dll")] static extern bool SetProcessDPIAware();
    public static string DpiAwarenessMode = "unset";
    public static string InitDpiAwareness() {
        // Setters fail (ACCESS_DENIED) when awareness is already set; not an error.
        try { if (SetProcessDpiAwarenessContext(new IntPtr(-4))) return (DpiAwarenessMode = "PerMonitorV2"); } catch {}
        try { if (SetProcessDpiAwareness(2) == 0) return (DpiAwarenessMode = "PerMonitor"); } catch {}
        try { if (SetProcessDPIAware()) return (DpiAwarenessMode = "System"); } catch {}
        return (DpiAwarenessMode = "preset_or_unaware");
    }

    // Map a virtual-desktop pixel into the 0..65535 normalized space SendInput expects.
    // Divisor is (span - 1): normalized 65535 must map to the last addressable pixel, not one past it
    // (MOUSEEVENTF_VIRTUALDESK absolute-coordinate convention), else edges drift ~1px on hi-dpi.
    public static int Normalize(int value, int origin, int span) {
        if (span <= 1) return 0;
        long v = ((long)(value - origin) * 65535L) / (span - 1);
        if (v < 0) v = 0;
        if (v > 65535) v = 65535;
        return (int)v;
    }
    static INPUT MouseInput(int x, int y) {
        int nx = Normalize(x, GetSystemMetrics(SM_XVIRTUALSCREEN), GetSystemMetrics(SM_CXVIRTUALSCREEN));
        int ny = Normalize(y, GetSystemMetrics(SM_YVIRTUALSCREEN), GetSystemMetrics(SM_CYVIRTUALSCREEN));
        return new INPUT { type = 0, mi = new MOUSEINPUT { dx = nx, dy = ny, dwFlags = MOUSEEVENTF_MOVE | MOUSEEVENTF_ABSOLUTE | MOUSEEVENTF_VIRTUALDESK } };
    }
    public static uint[] ParseFlags(string csv) {
        if (String.IsNullOrEmpty(csv)) return new uint[0];
        var parts = csv.Split(new char[] { ';', ',' });
        var list = new List<uint>();
        foreach (var p in parts) { var t = p.Trim(); if (t.Length == 0) continue; list.Add(Convert.ToUInt32(t, 16)); }
        return list.ToArray();
    }

    // Absolute move + button events in ONE SendInput call. Falls back to the legacy
    // SetCursorPos + mouse_event path when injection is refused (e.g. secured desktop).
    public static void SendMouse(int x, int y, string flagCsv) {
        var flags = ParseFlags(flagCsv);
        var inputs = new INPUT[flags.Length + 1];
        inputs[0] = MouseInput(x, y);
        for (int i = 0; i < flags.Length; i++) { inputs[i + 1] = new INPUT { type = 0, mi = new MOUSEINPUT { dwFlags = flags[i] } }; }
        uint sent = SendInput((uint)inputs.Length, inputs, Marshal.SizeOf(typeof(INPUT)));
        if (sent != inputs.Length) {
            SetCursorPos(x, y);
            foreach (var f in flags) mouse_event(f, 0, 0, 0, UIntPtr.Zero);
        }
    }
    public static void SendMove(int x, int y) {
        var inputs = new INPUT[1] { MouseInput(x, y) };
        uint sent = SendInput(1, inputs, Marshal.SizeOf(typeof(INPUT)));
        if (sent != 1) SetCursorPos(x, y);
    }
    public static void SendWheel(int x, int y, int delta) {
        var inputs = new INPUT[2];
        inputs[0] = MouseInput(x, y);
        inputs[1] = new INPUT { type = 0, mi = new MOUSEINPUT { mouseData = unchecked((uint)delta), dwFlags = MOUSEEVENTF_WHEEL } };
        uint sent = SendInput(2, inputs, Marshal.SizeOf(typeof(INPUT)));
        if (sent != 2) { SetCursorPos(x, y); mouse_event(MOUSEEVENTF_WHEEL, 0, 0, unchecked((uint)delta), UIntPtr.Zero); }
    }
    // Keyboard INPUT: KEYBDINPUT padded to MOUSEINPUT's size so Marshal.SizeOf matches the native union (x86 and x64).
    [StructLayout(LayoutKind.Sequential)]
    public struct KEYBDINPUT { public ushort wVk; public ushort wScan; public uint dwFlags; public uint time; public IntPtr dwExtraInfo; public uint pad1; public uint pad2; }
    [StructLayout(LayoutKind.Sequential)]
    public struct KINPUT { public uint type; public KEYBDINPUT ki; }
    [DllImport("user32.dll", EntryPoint = "SendInput", SetLastError = true)]
    static extern uint SendKeyInput(uint nInputs, KINPUT[] pInputs, int cbSize);

    // Type text as VK_PACKET (KEYEVENTF_UNICODE): bypasses keyboard layout and IME, so CJK and
    // symbols arrive verbatim (SendKeys goes through the active IME and mangles them). Newline → Enter.
    public static uint SendUnicode(string text) {
        var list = new List<KINPUT>();
        foreach (char c in text) {
            if (c == '\\r') continue;
            ushort vk = 0, scan = c; uint flags = 0x0004;
            if (c == '\\n') { vk = 0x0D; scan = 0; flags = 0; }
            list.Add(new KINPUT { type = 1, ki = new KEYBDINPUT { wVk = vk, wScan = scan, dwFlags = flags } });
            list.Add(new KINPUT { type = 1, ki = new KEYBDINPUT { wVk = vk, wScan = scan, dwFlags = flags | 0x0002 } });
        }
        if (list.Count == 0) return 0;
        return SendKeyInput((uint)list.Count, list.ToArray(), Marshal.SizeOf(typeof(KINPUT)));
    }
    public static void SendWheelCurrent(int delta) {
        var inputs = new INPUT[1];
        inputs[0] = new INPUT { type = 0, mi = new MOUSEINPUT { mouseData = unchecked((uint)delta), dwFlags = MOUSEEVENTF_WHEEL } };
        uint sent = SendInput(1, inputs, Marshal.SizeOf(typeof(INPUT)));
        if (sent != 1) mouse_event(MOUSEEVENTF_WHEEL, 0, 0, unchecked((uint)delta), UIntPtr.Zero);
    }
}
"@
`;
/** Bootstrap script: pre-load assemblies, define helpers, enter command loop */
const BOOTSTRAP_SCRIPT = `
$ErrorActionPreference = 'Continue'
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Pre-load .NET assemblies (one-time cost)
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes
Add-Type -AssemblyName PresentationCore
Add-Type -AssemblyName 'System.Runtime.WindowsRuntime'
$null = [Windows.Media.Ocr.OcrEngine, Windows.Foundation.UniversalApiContract, ContentType=WindowsRuntime]
$null = [Windows.Graphics.Imaging.BitmapDecoder, Windows.Foundation.UniversalApiContract, ContentType=WindowsRuntime]
$null = [Windows.Graphics.Imaging.SoftwareBitmap, Windows.Foundation.UniversalApiContract, ContentType=WindowsRuntime]
$null = [Windows.Storage.StorageFile, Windows.Foundation.UniversalApiContract, ContentType=WindowsRuntime]
$null = [Windows.Storage.Streams.IRandomAccessStream, Windows.Foundation.UniversalApiContract, ContentType=WindowsRuntime]

# Pre-load consolidated Win32 helpers
${BOOTSTRAP_CSHARP}

# Set Per-Monitor-V2 DPI awareness before any screenshot/UIA/SendInput call so every
# coordinate is a physical pixel (see desktop-tools.ts header). Result is read by get_screen_info.
$global:ClawDpiMode = [Win32]::InitDpiAwareness()

# Pre-cache JPEG codec
$global:jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }

# Signal ready
[Console]::Out.WriteLine('READY')
[Console]::Out.Flush()

# Command loop: read base64-encoded scripts from stdin
while ($true) {
    $line = [Console]::In.ReadLine()
    if ($line -eq $null -or $line -eq 'EXIT') { break }
    try {
        $bytes = [Convert]::FromBase64String($line)
        $script = [System.Text.Encoding]::UTF8.GetString($bytes)
        $block = [ScriptBlock]::Create($script)
        $output = & $block 2>&1 | Out-String
        [Console]::Out.Write($output)
        [Console]::Out.WriteLine('${MARKER}')
        [Console]::Out.Flush()
    } catch {
        [Console]::Out.WriteLine('${ERR_PREFIX}' + $_.Exception.Message + '${ERR_SUFFIX}')
        [Console]::Out.WriteLine('${MARKER}')
        [Console]::Out.Flush()
    }
}
`;
const START_TIMEOUT_MS = 30000;
const PING_FAIL_THRESHOLD = 2;
/** Machine-readable unhealthy prefix for callers / probes */
export const PS_UNHEALTHY = 'PS_UNHEALTHY';
export class PersistentShell {
    proc = null;
    ready = false;
    starting = null;
    stdoutBuf = '';
    pendingResolve = null;
    pendingReject = null;
    pendingTimer = null;
    /** Serial queue: at most one script in-flight (ponytail: chain, no PriorityQueue). */
    queue = Promise.resolve();
    consecutivePingFails = 0;
    /** Generation guard so stale exit/error handlers cannot wipe a newer proc. */
    generation = 0;
    /** Start the persistent PowerShell process (idempotent; awaits in-flight start). */
    async start() {
        if (this.ready && this.proc && !this.proc.killed)
            return;
        if (this.starting)
            return this.starting;
        this.starting = this.spawnAndWaitReady().finally(() => {
            this.starting = null;
        });
        return this.starting;
    }
    /** Explicit cold start after kill/hang. */
    async restart() {
        this.kill();
        await this.start();
    }
    forceKill(proc) {
        if (proc.killed)
            return;
        const pid = proc.pid;
        try {
            proc.kill('SIGTERM');
        }
        catch {
            /* ignore */
        }
        // Windows: SIGTERM often leaves powershell.exe alive and blocks Node exit
        if (process.platform === 'win32' && pid) {
            try {
                spawn('taskkill', ['/pid', String(pid), '/t', '/f'], {
                    stdio: 'ignore',
                    windowsHide: true,
                });
            }
            catch {
                /* ignore */
            }
        }
    }
    async spawnAndWaitReady() {
        if (this.proc) {
            this.kill();
        }
        this.ready = false;
        this.stdoutBuf = '';
        const generation = ++this.generation;
        await new Promise((resolveReady, rejectReady) => {
            let settled = false;
            const finish = (fn) => {
                if (settled)
                    return;
                settled = true;
                clearTimeout(startTimer);
                fn();
            };
            const startTimer = setTimeout(() => {
                this.kill();
                finish(() => rejectReady(new Error(`${PS_UNHEALTHY}: bootstrap timed out after ${START_TIMEOUT_MS}ms`)));
            }, START_TIMEOUT_MS);
            const proc = spawn('powershell.exe', [
                '-NoProfile', '-NoLogo', '-NonInteractive', '-Command', '-',
            ], {
                stdio: ['pipe', 'pipe', 'pipe'],
                windowsHide: true,
            });
            this.proc = proc;
            proc.stdout.setEncoding('utf-8');
            proc.stderr.setEncoding('utf-8');
            proc.stdout.on('data', (chunk) => {
                if (this.generation !== generation || this.proc !== proc)
                    return;
                if (!this.ready) {
                    this.stdoutBuf += chunk;
                    if (this.stdoutBuf.includes('READY')) {
                        this.ready = true;
                        this.stdoutBuf = '';
                        // PowerShell `-Command -` can read-ahead and swallow the FIRST command sent right after
                        // READY (a nondeterministic stdin race). Warm up with retrying pings so callers never
                        // lose their first exec; only resolve start() once the command loop provably responds.
                        this.warmup().then(() => finish(() => resolveReady()), (err) => finish(() => rejectReady(err)));
                    }
                    return;
                }
                this.stdoutBuf += chunk;
                this.tryResolve();
            });
            proc.stderr.on('data', () => { });
            proc.on('exit', (code) => {
                if (this.generation !== generation || this.proc !== proc)
                    return;
                const wasReady = this.ready;
                this.ready = false;
                this.proc = null;
                if (this.pendingReject) {
                    this.pendingReject(new Error(`PowerShell exited unexpectedly (code ${code})`));
                    this.pendingReject = null;
                    this.pendingResolve = null;
                    this.clearTimer();
                }
                if (!wasReady) {
                    finish(() => rejectReady(new Error(`${PS_UNHEALTHY}: exited during bootstrap (code ${code})`)));
                }
            });
            proc.on('error', (err) => {
                if (this.generation !== generation || this.proc !== proc)
                    return;
                this.ready = false;
                if (this.pendingReject) {
                    this.pendingReject(err);
                    this.pendingReject = null;
                    this.pendingResolve = null;
                    this.clearTimer();
                }
                finish(() => rejectReady(new Error(`${PS_UNHEALTHY}: spawn failed: ${err.message}`)));
            });
            try {
                proc.stdin.write(BOOTSTRAP_SCRIPT + '\n');
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                finish(() => rejectReady(new Error(`${PS_UNHEALTHY}: stdin write failed: ${msg}`)));
            }
        });
    }
    async ensureReady() {
        // Wait out an in-flight start (incl. its warmup) before trusting `ready`, otherwise a caller
        // could slip an exec in during warmup and collide with the warmup ping on pendingResolve.
        if (this.starting)
            await this.starting.catch(() => undefined);
        if (this.ready && this.proc && !this.proc.killed)
            return;
        try {
            await this.start();
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            throw new Error(msg.startsWith(PS_UNHEALTHY)
                ? msg
                : `${PS_UNHEALTHY}: PowerShell process not available: ${msg}`);
        }
        if (!this.proc || !this.ready) {
            throw new Error(`${PS_UNHEALTHY}: PowerShell process not available: failed to become ready`);
        }
    }
    tryResolve() {
        const markerIdx = this.stdoutBuf.indexOf(MARKER);
        if (markerIdx === -1)
            return;
        const output = this.stdoutBuf.substring(0, markerIdx);
        this.stdoutBuf = this.stdoutBuf.substring(markerIdx + MARKER.length).replace(/^\r?\n/, '');
        const errMatch = output.match(new RegExp(ERR_PREFIX.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(.+?)' + ERR_SUFFIX.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
        if (this.pendingResolve) {
            this.clearTimer();
            if (errMatch) {
                this.pendingResolve({ stdout: '', stderr: errMatch[1], exitCode: 1 });
            }
            else {
                this.pendingResolve({ stdout: output.trimEnd(), stderr: '', exitCode: 0 });
            }
            this.pendingResolve = null;
            this.pendingReject = null;
        }
    }
    clearTimer() {
        if (this.pendingTimer) {
            clearTimeout(this.pendingTimer);
            this.pendingTimer = null;
        }
    }
    /**
     * Confirm the command loop is reading stdin before start() resolves. The first line written right
     * after READY can be swallowed by PowerShell's `-Command -` read-ahead, so retry a cheap ping
     * (without killing the process on a swallowed try) until one echoes back.
     */
    async warmup() {
        for (let attempt = 0; attempt < 6; attempt++) {
            try {
                const r = await this.execUnlocked("Write-Output 'CLAW_WARM'", 1500, false);
                if (r.exitCode === 0 && r.stdout.includes('CLAW_WARM'))
                    return;
            }
            catch {
                /* swallowed / timed out → retry */
            }
        }
        throw new Error(`${PS_UNHEALTHY}: command loop unresponsive after warmup`);
    }
    execUnlocked(script, timeout, killOnTimeout = true) {
        return new Promise((resolve, reject) => {
            this.pendingResolve = resolve;
            this.pendingReject = reject;
            this.pendingTimer = setTimeout(() => {
                this.pendingResolve = null;
                this.pendingReject = null;
                // Kill on timeout; next exec/restart cold-starts. Warmup pings opt out (killOnTimeout=false)
                // so a swallowed first command can simply be retried without tearing down the process.
                if (killOnTimeout)
                    this.kill();
                reject(new Error(`PowerShell command timed out after ${timeout}ms`));
            }, timeout);
            try {
                const b64 = Buffer.from(script, 'utf-8').toString('base64');
                this.proc.stdin.write(b64 + '\n');
            }
            catch (err) {
                this.clearTimer();
                this.pendingResolve = null;
                this.pendingReject = null;
                this.kill();
                const msg = err instanceof Error ? err.message : String(err);
                reject(new Error(`${PS_UNHEALTHY}: PowerShell process not available: ${msg}`));
            }
        });
    }
    /** Execute a script in the persistent process (serialized). */
    async exec(script, timeout = 30000) {
        const run = this.queue.then(async () => {
            await this.ensureReady();
            return this.execUnlocked(script, timeout);
        });
        // Keep queue alive after failures so later callers still serialize
        this.queue = run.then(() => undefined, () => undefined);
        return run;
    }
    /**
     * Lightweight liveness probe. Consecutive failures yield PS_UNHEALTHY and attempt restart.
     */
    async ping(timeout = 5000) {
        try {
            const result = await this.exec("Write-Output 'PONG'", timeout);
            if (result.exitCode !== 0 || !result.stdout.includes('PONG')) {
                throw new Error('unexpected ping result');
            }
            this.consecutivePingFails = 0;
            return result;
        }
        catch (err) {
            this.consecutivePingFails += 1;
            const fails = this.consecutivePingFails;
            if (fails >= PING_FAIL_THRESHOLD) {
                await this.restart().catch(() => undefined);
            }
            const msg = err instanceof Error ? err.message : String(err);
            throw new Error(`${PS_UNHEALTHY}: consecutive_ping_failures=${fails}: ${msg}`);
        }
    }
    /** Kill the persistent process (next exec will cold-start). */
    kill() {
        this.clearTimer();
        const proc = this.proc;
        this.proc = null;
        this.ready = false;
        this.stdoutBuf = '';
        this.generation += 1;
        if (this.pendingReject) {
            this.pendingReject(new Error(`${PS_UNHEALTHY}: PowerShell process killed`));
            this.pendingReject = null;
            this.pendingResolve = null;
        }
        else {
            this.pendingResolve = null;
        }
        if (proc)
            this.forceKill(proc);
    }
}
/** Singleton instance */
export const shell = new PersistentShell();
