param(
    [string]$ImagePath,
    [string]$ElementsJson,
    [int]$HighlightNumber = 0,
    [string]$GlowColor = "0,200,255",
    [string]$HighlightMode = "glow",
    [string]$OutputPath = ""
)

# ShineAI Claw — HUD Drawing Script (GDI+)
# Renders sci-fi overlay: glow borders, scanlines, pulse circles, info panels
# Draws at ORIGINAL image resolution to avoid coordinate offset from scaling

Add-Type -AssemblyName System.Drawing

# ──────────────────────────────────────────────
# Parse glow color (R,G,B)
# ──────────────────────────────────────────────
function Parse-GlowColor {
    param([string]$ColorStr)
    $parts = $ColorStr.Trim().Split(',')
    if ($parts.Count -eq 3) {
        try {
            return @{
                R = [int]$parts[0]
                G = [int]$parts[1]
                B = [int]$parts[2]
            }
        } catch {}
    }
    return @{ R = 0; G = 200; B = 255 }
}

# ──────────────────────────────────────────────
# Draw-GlowRectangle
# Multi-layer decreasing-alpha outline to simulate neon glow
# ──────────────────────────────────────────────
function Draw-GlowRectangle {
    param(
        [System.Drawing.Graphics]$G,
        [int]$X,
        [int]$Y,
        [int]$W,
        [int]$H,
        [hashtable]$Color,
        [int]$Layers = 4,
        [float]$LineWidth = 2.0
    )
    # Outer glow layers (large spread, low alpha)
    for ($i = $Layers; $i -ge 1; $i--) {
        $spread = $i * 3
        $alpha = [int](40 + ($Layers - $i) * 30)
        if ($alpha -gt 200) { $alpha = 200 }
        $pen = New-Object System.Drawing.Pen(
            [System.Drawing.Color]::FromArgb($alpha, $Color.R, $Color.G, $Color.B),
            ($LineWidth + $spread * 0.5)
        )
        $pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
        $rx = $X - $spread
        $ry = $Y - $spread
        $rw = $W + $spread * 2
        $rh = $H + $spread * 2
        if ($rw -gt 0 -and $rh -gt 0) {
            $G.DrawRectangle($pen, $rx, $ry, $rw, $rh)
        }
        $pen.Dispose()
    }
    # Core bright line
    $corePen = New-Object System.Drawing.Pen(
        [System.Drawing.Color]::FromArgb(240, $Color.R, $Color.G, $Color.B),
        $LineWidth
    )
    $corePen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
    if ($W -gt 0 -and $H -gt 0) {
        $G.DrawRectangle($corePen, $X, $Y, $W, $H)
    }
    $corePen.Dispose()

    # Corner accent marks (short bright ticks)
    $accentLen = [Math]::Min(12, [Math]::Min($W, $H) / 4)
    $accentPen = New-Object System.Drawing.Pen(
        [System.Drawing.Color]::FromArgb(255, 255, 255, 255),
        ($LineWidth + 0.5)
    )
    # TL
    $G.DrawLine($accentPen, $X, $Y, $X + $accentLen, $Y)
    $G.DrawLine($accentPen, $X, $Y, $X, $Y + $accentLen)
    # TR
    $G.DrawLine($accentPen, $X + $W, $Y, $X + $W - $accentLen, $Y)
    $G.DrawLine($accentPen, $X + $W, $Y, $X + $W, $Y + $accentLen)
    # BL
    $G.DrawLine($accentPen, $X, $Y + $H, $X + $accentLen, $Y + $H)
    $G.DrawLine($accentPen, $X, $Y + $H, $X, $Y + $H - $accentLen)
    # BR
    $G.DrawLine($accentPen, $X + $W, $Y + $H, $X + $W - $accentLen, $Y + $H)
    $G.DrawLine($accentPen, $X + $W, $Y + $H, $X + $W, $Y + $H - $accentLen)
    $accentPen.Dispose()
}

# ──────────────────────────────────────────────
# Draw-ScanlineEffect
# Horizontal semi-transparent stripes across a region
# ──────────────────────────────────────────────
function Draw-ScanlineEffect {
    param(
        [System.Drawing.Graphics]$G,
        [int]$X,
        [int]$Y,
        [int]$W,
        [int]$H,
        [int]$Alpha = 25,
        [int]$Step = 4
    )
    $brush = New-Object System.Drawing.SolidBrush(
        [System.Drawing.Color]::FromArgb($Alpha, 0, 0, 0)
    )
    $row = $Y
    while ($row -lt ($Y + $H)) {
        $G.FillRectangle($brush, $X, $row, $W, 1)
        $row += $Step
    }
    $brush.Dispose()
}

# ──────────────────────────────────────────────
# Draw-PulseCircle
# Concentric rings with decreasing alpha (pulse/ripple effect)
# ──────────────────────────────────────────────
function Draw-PulseCircle {
    param(
        [System.Drawing.Graphics]$G,
        [int]$CX,
        [int]$CY,
        [int]$Radius,
        [hashtable]$Color,
        [int]$Rings = 3
    )
    for ($i = $Rings; $i -ge 1; $i--) {
        $r = $Radius + ($i - 1) * 6
        $alpha = [int](200 / $i)
        $pen = New-Object System.Drawing.Pen(
            [System.Drawing.Color]::FromArgb($alpha, $Color.R, $Color.G, $Color.B),
            (3.0 / $i)
        )
        $G.DrawEllipse($pen, ($CX - $r), ($CY - $r), ($r * 2), ($r * 2))
        $pen.Dispose()
    }
    # Center dot
    $dotBrush = New-Object System.Drawing.SolidBrush(
        [System.Drawing.Color]::FromArgb(230, $Color.R, $Color.G, $Color.B)
    )
    $G.FillEllipse($dotBrush, ($CX - 3), ($CY - 3), 6, 6)
    $dotBrush.Dispose()
}

# ──────────────────────────────────────────────
# Draw-InfoPanel
# Semi-transparent dark panel with left-edge color bar + text
# ──────────────────────────────────────────────
function Draw-InfoPanel {
    param(
        [System.Drawing.Graphics]$G,
        [int]$X,
        [int]$Y,
        [string]$Label,
        [string]$SubText,
        [hashtable]$Color,
        [int]$MaxWidth = 160
    )
    $font = New-Object System.Drawing.Font('Consolas', 8, [System.Drawing.FontStyle]::Bold)
    $subFont = New-Object System.Drawing.Font('Consolas', 7)

    $labelSz = $G.MeasureString($Label, $font)
    $subSz   = if ($SubText) { $G.MeasureString($SubText, $subFont) } else { [System.Drawing.SizeF]::new(0,0) }

    $panelW = [Math]::Min($MaxWidth, [Math]::Max([int]$labelSz.Width, [int]$subSz.Width) + 14)
    $panelH = [int]$labelSz.Height + $(if ($SubText) { [int]$subSz.Height } else { 0 }) + 6

    # Background panel
    $bgBrush = New-Object System.Drawing.SolidBrush(
        [System.Drawing.Color]::FromArgb(180, 0, 8, 20)
    )
    $G.FillRectangle($bgBrush, $X, $Y, $panelW, $panelH)
    $bgBrush.Dispose()

    # Left accent bar
    $barBrush = New-Object System.Drawing.SolidBrush(
        [System.Drawing.Color]::FromArgb(220, $Color.R, $Color.G, $Color.B)
    )
    $G.FillRectangle($barBrush, $X, $Y, 3, $panelH)
    $barBrush.Dispose()

    # Panel border
    $borderPen = New-Object System.Drawing.Pen(
        [System.Drawing.Color]::FromArgb(100, $Color.R, $Color.G, $Color.B),
        1.0
    )
    $G.DrawRectangle($borderPen, $X, $Y, $panelW - 1, $panelH - 1)
    $borderPen.Dispose()

    # Text
    $textBrush = New-Object System.Drawing.SolidBrush(
        [System.Drawing.Color]::FromArgb(255, $Color.R, $Color.G, $Color.B)
    )
    $subTextBrush = New-Object System.Drawing.SolidBrush(
        [System.Drawing.Color]::FromArgb(200, 180, 240, 255)
    )
    $G.DrawString($Label, $font, $textBrush, ($X + 5), ($Y + 3))
    if ($SubText) {
        $G.DrawString($SubText, $subFont, $subTextBrush, ($X + 5), ($Y + 3 + [int]$labelSz.Height))
    }
    $textBrush.Dispose()
    $subTextBrush.Dispose()
    $font.Dispose()
    $subFont.Dispose()
}

# ──────────────────────────────────────────────
# Main rendering
# ──────────────────────────────────────────────

if (-not (Test-Path $ImagePath)) {
    Write-Error "Image not found: $ImagePath"
    exit 1
}

# Parse elements JSON
$elements = @()
if ($ElementsJson -and $ElementsJson.Trim() -ne '') {
    try {
        $elements = $ElementsJson | ConvertFrom-Json
    } catch {
        Write-Error "Failed to parse ElementsJson: $_"
        exit 1
    }
}

# Parse glow color
$glowColor = Parse-GlowColor -ColorStr $GlowColor

# Determine output path
if (-not $OutputPath -or $OutputPath.Trim() -eq '') {
    $dir  = [System.IO.Path]::GetDirectoryName($ImagePath)
    $base = [System.IO.Path]::GetFileNameWithoutExtension($ImagePath)
    $OutputPath = [System.IO.Path]::Combine($dir, "${base}_hud.png")
}

# Load image via MemoryStream (avoid GDI+ file lock)
$fileBytes = [System.IO.File]::ReadAllBytes($ImagePath)
$ms = New-Object System.IO.MemoryStream(,$fileBytes)
$bmp = [System.Drawing.Bitmap]::new($ms)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

$imgW = $bmp.Width
$imgH = $bmp.Height

# ── Draw scanline over entire image (subtle CRT effect) ──
Draw-ScanlineEffect -G $g -X 0 -Y 0 -W $imgW -H $imgH -Alpha 18 -Step 4

# ── Draw all elements (non-highlight) ──
$dimColor = @{ R = 0; G = 140; B = 180 }
$highlightColor = Parse-GlowColor -ColorStr $GlowColor

foreach ($el in $elements) {
    # Determine element bounding box in image space
    # Elements carry rectX/rectY/rectW/rectH (screen coords) or screenX/screenY fallback
    $hasRect = ($null -ne $el.rectX -and $null -ne $el.rectY -and $null -ne $el.rectW -and $null -ne $el.rectH)
    if ($hasRect) {
        $ex = [int]$el.rectX
        $ey = [int]$el.rectY
        $ew = [int]$el.rectW
        $eh = [int]$el.rectH
    } else {
        # Fall back to center-based bbox with minimum size
        $cx = if ($null -ne $el.screenX) { [int]$el.screenX } else { 0 }
        $cy = if ($null -ne $el.screenY) { [int]$el.screenY } else { 0 }
        $ew = 60; $eh = 24
        $ex = $cx - $ew / 2
        $ey = $cy - $eh / 2
    }

    $isHighlight = ($HighlightNumber -gt 0 -and [int]$el.number -eq $HighlightNumber)
    $color = if ($isHighlight) { $highlightColor } else { $dimColor }
    $lineW = if ($isHighlight) { 2.5 } else { 1.5 }
    $layers = if ($isHighlight) { 5 } else { 2 }

    # Draw glow rectangle
    Draw-GlowRectangle -G $g -X $ex -Y $ey -W $ew -H $eh `
        -Color $color -Layers $layers -LineWidth $lineW

    # Pulse circle on highlighted element center
    if ($isHighlight -and ($HighlightMode -eq 'pulse' -or $HighlightMode -eq 'flash')) {
        $cx2 = $ex + $ew / 2
        $cy2 = $ey + $eh / 2
        $radius = [Math]::Max(8, [Math]::Min($ew, $eh) / 3)
        Draw-PulseCircle -G $g -CX $cx2 -CY $cy2 -Radius $radius -Color $color -Rings 3
    }

    # Number badge + info panel
    $numStr  = "#$($el.number)"
    $nameStr = if ($el.name) { $el.name } else { '' }
    if ($nameStr.Length -gt 18) { $nameStr = $nameStr.Substring(0, 15) + '...' }

    # Badge circle above top-left corner
    $badgeFont = New-Object System.Drawing.Font('Consolas', 8, [System.Drawing.FontStyle]::Bold)
    $badgeSz   = $g.MeasureString($numStr, $badgeFont)
    $badgeR    = [Math]::Max(10, [int]($badgeSz.Width / 2) + 4)
    $badgeCX   = $ex
    $badgeCY   = $ey - $badgeR - 2
    if ($badgeCY - $badgeR -lt 0) { $badgeCY = $ey + $badgeR + 2 }

    $badgeBg = New-Object System.Drawing.SolidBrush(
        [System.Drawing.Color]::FromArgb(200, 0, [Math]::Min(255, $color.G / 2), [Math]::Min(255, $color.B / 2))
    )
    $g.FillEllipse($badgeBg, ($badgeCX - $badgeR), ($badgeCY - $badgeR), ($badgeR * 2), ($badgeR * 2))
    $badgeBg.Dispose()
    $badgeBorderPen = New-Object System.Drawing.Pen(
        [System.Drawing.Color]::FromArgb(220, $color.R, $color.G, $color.B), 1.5
    )
    $g.DrawEllipse($badgeBorderPen, ($badgeCX - $badgeR), ($badgeCY - $badgeR), ($badgeR * 2), ($badgeR * 2))
    $badgeBorderPen.Dispose()
    $badgeTextBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $g.DrawString($numStr, $badgeFont, $badgeTextBrush,
        ($badgeCX - $badgeSz.Width / 2),
        ($badgeCY - $badgeSz.Height / 2))
    $badgeTextBrush.Dispose()
    $badgeFont.Dispose()

    # Info panel below bottom-right (only for highlighted or if enough room)
    if ($isHighlight -or $nameStr -ne '') {
        $panelX = $ex
        $panelY = $ey + $eh + 3
        if ($panelY + 30 -gt $imgH) { $panelY = $ey - 30 - 3 }
        Draw-InfoPanel -G $g -X $panelX -Y $panelY `
            -Label $numStr -SubText $nameStr -Color $color -MaxWidth 160
    }
}

# ── HUD frame border (thin edge glow around entire image) ──
$framePen = New-Object System.Drawing.Pen(
    [System.Drawing.Color]::FromArgb(60, $highlightColor.R, $highlightColor.G, $highlightColor.B),
    2.0
)
$g.DrawRectangle($framePen, 1, 1, $imgW - 2, $imgH - 2)
$framePen.Dispose()

# ── Save output ──
$g.Dispose()
$bmp.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
$ms.Dispose()

Write-Output "HUD_OUTPUT:$OutputPath"
