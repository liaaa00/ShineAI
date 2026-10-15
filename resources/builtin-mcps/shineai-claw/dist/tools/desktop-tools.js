/**
 * Desktop automation tools for ShineAI Claw.
 * Uses PersistentShell for all PowerShell operations (single process, pre-loaded DLLs).
 * All coordinates are physical pixels — the PersistentShell process is Per-Monitor-V2 DPI aware,
 * so GDI screenshots, UIA BoundingRectangle and SendInput share one un-virtualized physical-pixel
 * space (no DPI conversion needed). See get_screen_info for the effective DPI-awareness mode.
 *
 * === TOOL PRIORITY GUIDE (embedded in tool descriptions for AI) ===
 *
 * CLICK WORKFLOW (most common):
 *   1. screenshot(annotate=true)     → See the full screen with numbered elements
 *   2. click_element(number)          → Click a numbered element (MOST PRECISE)
 *   3. zoom_screenshot(x,y,w,h)      → If target not annotated, zoom in for detail
 *   4. screenshot_click(percentX/Y)   → Fallback: click by position in screenshot
 *   5. mouse_click(x,y)              → Last resort: raw coordinate click
 *
 * OBSERVATION:
 *   - screenshot    → Full screen overview
 *   - zoom_screenshot → Detail view of specific area
 *   - get_screen_info → Resolution and DPI info
 *
 * INTERACTION:
 *   - click_element  → Best way to click (uses annotated element coordinates)
 *   - keyboard_type / keyboard_press / keyboard_hotkey → Text input and shortcuts
 *   - mouse_scroll   → Scroll content
 *
 * WINDOW MANAGEMENT:
 *   - window_list / window_focus / window_close
 *
 * ADVANCED (rarely needed):
 *   - uia_find_element / uia_get_tree → Direct UIA queries for native apps
 */
import { existsSync, mkdirSync } from 'fs';
import { writeFile, mkdir, stat } from 'fs/promises';
import { dirname, resolve, join } from 'path';
import { fileURLToPath } from 'url';
import { registerTool } from './registry.js';
import { visionLocate } from './vision-grounding.js';
import { renderHud } from './hud-renderer.js';
import { inferElementCapability } from '../computer-use/providers/windows/uia-mapper.js';
import { activationEvidenceMatches, classifyForegroundResult, interpretActivatableHidVerify, interpretActivatableSelectVerify, isActivatableSelectionItem, NEAR_MONO_MAX_LUMINANCE_VARIANCE, NEAR_MONO_MAX_UNIQUE, resolveCaptureBlankDecision, resolveHidClickTypeForActivatable, resolveScreenshotCaptureMode, shouldFallbackClickAfterUia, SUSPICIOUS_BLANK_MAX_LUMINANCE_VARIANCE, SUSPICIOUS_BLANK_MAX_UNIQUE, } from './desktop-action-guards.js';
import { formatSendMouseCommand, isUiaElementCandidate, matchesExpectText, parseAnnotatedSource, scoreSearchAmbiguity, } from './click-accuracy.js';
import { AUTO_SCALE_MAX_LONG_EDGE, AUTO_SCALE_MAX_PIXELS, getScreenshotMeta, setScreenshotMeta, } from './screenshot-meta.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// OCR worker script path (runs in separate STA process for WinRT async compatibility)
const OCR_WORKER_PS1 = join(__dirname, '..', 'scripts', 'ocr-worker.ps1');
import { shell } from '../helpers/PersistentShell.js';
import { PolicyEngine } from '../security/PolicyEngine.js';
import { presenceHide, presenceMark } from '../helpers/presence-overlay.js';
import { imageContentFromFile } from '../helpers/SoMRenderer.js';
const sn = PolicyEngine.sanitizeNumber.bind(PolicyEngine);
const sp = PolicyEngine.sanitizeForPowerShell.bind(PolicyEngine);
// Screenshot metadata store — maps normalized file path to capture region info
// Used by screenshot_click / click_element; miss path hydrates sibling .meta.json
const screenshotMetaMap = new Map();
let lastScreenshotPath = '';
let lastAnnotatedPath = '';
let lastActionableElement = null;
// Attach the image itself to the tool result: providers whose file tool can't view images
// (e.g. read_file) previously only got a PNG path and acted blind.
const INLINE_IMAGE_MAX_BYTES = 3_500_000;
const TEXT_ONLY_HINT = 'Text-only model? Do NOT open the image file with a file/Read tool — rely on the element/OCR list and hit-target text.';
async function loadInlineImage(filePath, enabled = true) {
    if (!enabled || !filePath)
        return { note: `Image not attached (includeImage=false). ${TEXT_ONLY_HINT}` };
    try {
        const { size } = await stat(filePath);
        if (size > INLINE_IMAGE_MAX_BYTES) {
            return { note: `Image not attached (${size} bytes > ${INLINE_IMAGE_MAX_BYTES}); use zoom_screenshot or a smaller maxWidth. ${TEXT_ONLY_HINT}` };
        }
        return { block: await imageContentFromFile(filePath), note: `The image is attached to this result — look at it before acting. If you cannot see it: ${TEXT_ONLY_HINT}` };
    }
    catch (err) {
        return { note: `Image not attached (${err instanceof Error ? err.message : String(err)}). ${TEXT_ONLY_HINT}` };
    }
}
function getMouseClickFlags(button, clickType) {
    switch (button) {
        case 'right': return clickType === 'double' ? '0x0008;0x0010;0x0008;0x0010' : '0x0008;0x0010';
        case 'middle': return clickType === 'double' ? '0x0020;0x0040;0x0020;0x0040' : '0x0020;0x0040';
        default: return clickType === 'double' ? '0x0002;0x0004;0x0002;0x0004' : '0x0002;0x0004';
    }
}
// Rank an annotated element by how confidently it can be acted on natively.
// Reuses the computer-use capability inference so the screenshot workflow and the
// (currently unwired) UIA runtime agree on what "actionable" means.
function elementActionabilityScore(el) {
    const cap = inferElementCapability({
        source: el.source === 'OCR' ? 'ocr' : 'uia', // OCR_UIA → uia
        controlType: el.controlType,
        className: el.className,
        patterns: el.patterns,
        isEnabled: el.isEnabled,
    });
    let score = 0;
    if (cap.supportedActions.some(a => a !== 'focus' && a !== 'clickFallback'))
        score += 100;
    if (cap.backgroundInvoke)
        score += 20;
    if (cap.backgroundType)
        score += 10;
    if (el.isEnabled === false)
        score -= 40;
    if (el.name && el.name.trim())
        score += 5;
    // P3.15: same-label local session > network "search the web" chrome
    score += scoreSearchAmbiguity(el);
    return score;
}
// Stable sort that surfaces natively-actionable elements first while preserving the
// original badge numbers (image annotations and click_element() lookups stay valid).
function sortElementsForDisplay(elements) {
    return elements
        .map((el, i) => ({ el, i, s: elementActionabilityScore(el) }))
        .sort((a, b) => b.s - a.s || a.i - b.i)
        .map(x => x.el);
}
function formatElementLine(e) {
    const ct = e.controlType.replace('ControlType.', '');
    const disabledTag = e.isEnabled === false ? ' [disabled]' : '';
    const patTag = e.patterns && e.patterns.length > 0 ? ` {${e.patterns.join(',')}}` : '';
    return `  [${e.number}] "${e.name}" (${ct})${disabledTag}${patTag}`;
}
// Parse uia_find_element's ConvertTo-Json output, annotate each hit with its inferred
// capability, and rank actionable/on-screen/enabled hits first so ambiguous queries
// surface the element a caller most likely wants instead of a raw unordered dump.
function rankUiaFindResults(stdout) {
    const raw = stdout.trim();
    if (!raw)
        return '[]';
    let parsed;
    try {
        parsed = JSON.parse(raw);
    }
    catch {
        return raw; // not JSON (e.g. PS error text) — pass through unchanged
    }
    const items = (Array.isArray(parsed) ? parsed : [parsed]).filter(Boolean);
    const annotated = items.map((it) => {
        const patterns = Array.isArray(it.Patterns)
            ? it.Patterns.map(String)
            : it.Patterns
                ? [String(it.Patterns)]
                : [];
        const cap = inferElementCapability({
            source: 'uia',
            controlType: typeof it.ControlType === 'string' ? it.ControlType : undefined,
            className: typeof it.ClassName === 'string' ? it.ClassName : undefined,
            patterns,
            isEnabled: it.IsEnabled !== false,
        });
        const actionable = cap.supportedActions.some(a => a !== 'focus' && a !== 'clickFallback');
        let score = 0;
        if (actionable)
            score += 100;
        if (it.IsOffscreen === true)
            score -= 50;
        if (it.IsEnabled === false)
            score -= 40;
        // P3.15: uia_find_element same-name hits prefer local/session over network search
        score += scoreSearchAmbiguity({
            name: typeof it.Name === 'string' ? it.Name : undefined,
            className: typeof it.ClassName === 'string' ? it.ClassName : undefined,
            automationId: typeof it.AutomationId === 'string' ? it.AutomationId : undefined,
            controlType: typeof it.ControlType === 'string' ? it.ControlType : undefined,
        });
        return { ...it, Patterns: patterns, supportedActions: cap.supportedActions, actionable, _score: score };
    });
    annotated.sort((a, b) => b._score - a._score);
    const cleaned = annotated.map(({ _score, ...rest }) => rest);
    return JSON.stringify(cleaned, null, 2);
}
function parseUiaActionResult(stdout) {
    const marker = '__SHINEAI_UIA_JSON__';
    const line = stdout
        .split('\n')
        .map(l => l.trim())
        .filter(Boolean)
        .reverse()
        .find(l => l.startsWith(marker));
    if (!line) {
        return { ok: false, method: '', reason: 'uia_no_result', screenX: 0, screenY: 0, rectW: 0, rectH: 0, clickX: 0, clickY: 0 };
    }
    const payload = line.slice(marker.length);
    try {
        const parsed = JSON.parse(payload);
        const screenX = typeof parsed.screenX === 'number' && Number.isFinite(parsed.screenX) ? parsed.screenX : 0;
        const screenY = typeof parsed.screenY === 'number' && Number.isFinite(parsed.screenY) ? parsed.screenY : 0;
        const clickX = typeof parsed.clickX === 'number' && Number.isFinite(parsed.clickX) ? parsed.clickX : screenX;
        const clickY = typeof parsed.clickY === 'number' && Number.isFinite(parsed.clickY) ? parsed.clickY : screenY;
        return {
            ok: parsed.ok === true,
            method: typeof parsed.method === 'string' ? parsed.method : '',
            reason: typeof parsed.reason === 'string' ? parsed.reason : '',
            screenX,
            screenY,
            rectW: typeof parsed.rectW === 'number' && Number.isFinite(parsed.rectW) ? parsed.rectW : 0,
            rectH: typeof parsed.rectH === 'number' && Number.isFinite(parsed.rectH) ? parsed.rectH : 0,
            clickX,
            clickY,
            verify: typeof parsed.verify === 'string' ? parsed.verify : '',
            detail: typeof parsed.detail === 'string' ? parsed.detail : '',
            beforeTitle: typeof parsed.beforeTitle === 'string' ? parsed.beforeTitle : '',
            afterTitle: typeof parsed.afterTitle === 'string' ? parsed.afterTitle : '',
            foregroundTitle: typeof parsed.foregroundTitle === 'string' ? parsed.foregroundTitle : '',
        };
    }
    catch {
        return { ok: false, method: '', reason: 'uia_result_parse_failed', screenX: 0, screenY: 0, rectW: 0, rectH: 0, clickX: 0, clickY: 0 };
    }
}
async function tryUiaAction(element, action, text) {
    if (!isUiaElementCandidate(element)) {
        return { ok: false, method: '', reason: 'uia_metadata_not_available', screenX: element.screenX, screenY: element.screenY, rectW: element.rectW ?? 0, rectH: element.rectH ?? 0, clickX: element.screenX, clickY: element.screenY };
    }
    const processId = element.processId != null ? sn(element.processId) : 0;
    const rectX = element.rectX != null ? sn(element.rectX) : sn(element.screenX);
    const rectY = element.rectY != null ? sn(element.rectY) : sn(element.screenY);
    const rectW = element.rectW != null ? sn(element.rectW) : 0;
    const rectH = element.rectH != null ? sn(element.rectH) : 0;
    try {
        presenceMark(action === 'setValue' ? 'type' : 'click', element.screenX, element.screenY);
    }
    catch { /* overlay must never fail UIA */ }
    const script = `
$meta = @{
  Name = '${sp(element.name || '')}'
  AutomationId = '${sp(element.automationId || '')}'
  ClassName = '${sp(element.className || '')}'
  ControlType = '${sp(element.controlType || '')}'
  ProcessId = ${processId}
  CenterX = ${sn(element.screenX)}
  CenterY = ${sn(element.screenY)}
  RectX = ${rectX}
  RectY = ${rectY}
  RectW = ${rectW}
  RectH = ${rectH}
}
$actionKind = '${action}'
$targetText = '${sp(text || '')}'
$result = @{ ok = $false; method = ''; reason = ''; screenX = [int]$meta.CenterX; screenY = [int]$meta.CenterY; rectW = [int]$meta.RectW; rectH = [int]$meta.RectH; clickX = [int]$meta.CenterX; clickY = [int]$meta.CenterY; verify = ''; detail = ''; beforeTitle = ''; afterTitle = ''; foregroundTitle = '' }
$isActivatableItem = $meta.ControlType -match 'ListItem|TreeItem|TabItem|MenuItem'

# Read element-local UIA state for before/after comparison (post-action verification).
function Read-ElementState {
  param([Windows.Automation.AutomationElement]$el)
  $s = @{ Alive = $true; Toggle = ''; Expand = ''; Selected = ''; Value = ''; Focus = '' }
  try {
    $o = $null
    if ($el.TryGetCurrentPattern([Windows.Automation.TogglePattern]::Pattern, [ref]$o)) { $s.Toggle = "$(([Windows.Automation.TogglePattern]$o).Current.ToggleState)" }
    $o = $null
    if ($el.TryGetCurrentPattern([Windows.Automation.ExpandCollapsePattern]::Pattern, [ref]$o)) { $s.Expand = "$(([Windows.Automation.ExpandCollapsePattern]$o).Current.ExpandCollapseState)" }
    $o = $null
    if ($el.TryGetCurrentPattern([Windows.Automation.SelectionItemPattern]::Pattern, [ref]$o)) { $s.Selected = "$(([Windows.Automation.SelectionItemPattern]$o).Current.IsSelected)" }
    $o = $null
    if ($el.TryGetCurrentPattern([Windows.Automation.ValuePattern]::Pattern, [ref]$o)) { $s.Value = "$(([Windows.Automation.ValuePattern]$o).Current.Value)" }
    $s.Focus = "$($el.Current.HasKeyboardFocus)"
  } catch { $s.Alive = $false }
  return $s
}

# Cheap activation probe: owning window title + same-process foreground title.
function Read-ActivationTitles {
  param([Windows.Automation.AutomationElement]$el)
  $s = @{ WindowTitle = ''; ForegroundTitle = '' }
  try {
    $walker = [Windows.Automation.TreeWalker]::ControlViewWalker
    $cur = $el
    $window = $null
    while ($null -ne $cur) {
      try {
        if ($cur.Current.ControlType -eq [Windows.Automation.ControlType]::Window) { $window = $cur; break }
      } catch { break }
      $cur = $walker.GetParent($cur)
    }
    if ($null -eq $window -and $roots.Count -gt 0) { $window = $roots[0] }
    if ($null -ne $window) {
      try { $s.WindowTitle = [string]$window.Current.Name } catch {}
    }
    try {
      $pid = 0
      if ($null -ne $el) { $pid = [int]$el.Current.ProcessId }
      elseif ($meta.ProcessId -gt 0) { $pid = [int]$meta.ProcessId }
      if ($pid -gt 0) {
        $p = Get-Process -Id $pid -ErrorAction SilentlyContinue
        if ($p -and $p.MainWindowTitle) { $s.ForegroundTitle = [string]$p.MainWindowTitle }
      }
    } catch {}
  } catch {}
  return $s
}

function Add-Candidate {
  param([Windows.Automation.AutomationElement]$el)
  if ($null -eq $el) { return }
  try {
    $cur = $el.Current
    $rect = $cur.BoundingRectangle
    if ($rect.IsEmpty -or $rect.Width -le 1 -or $rect.Height -le 1) { return }
    $key = "$($cur.ProcessId)|$($cur.AutomationId)|$($cur.ClassName)|$([int]$rect.X)|$([int]$rect.Y)|$([int]$rect.Width)|$([int]$rect.Height)"
    if ($script:seen.ContainsKey($key)) { return }
    $script:seen[$key] = $true
    $script:candidates += $el
  } catch {}
}

function Find-ByCondition {
  param([Windows.Automation.AutomationElement]$root, [Windows.Automation.Condition]$cond, [int]$maxCount = 120)
  if ($null -eq $root -or $null -eq $cond) { return }
  try {
    $found = $root.FindAll([Windows.Automation.TreeScope]::Descendants, $cond)
    $limit = [Math]::Min($found.Count, $maxCount)
    for ($i = 0; $i -lt $limit; $i++) {
      Add-Candidate $found.Item($i)
    }
  } catch {}
}

try {
  $roots = @()
  if ($meta.ProcessId -gt 0) {
    try {
      $pidCond = New-Object Windows.Automation.PropertyCondition([Windows.Automation.AutomationElement]::ProcessIdProperty, [int]$meta.ProcessId)
      $pidWindows = [Windows.Automation.AutomationElement]::RootElement.FindAll([Windows.Automation.TreeScope]::Children, $pidCond)
      for ($i = 0; $i -lt $pidWindows.Count; $i++) { $roots += $pidWindows.Item($i) }
    } catch {}
  }

  if ($roots.Count -eq 0) {
    try {
      $pt = New-Object System.Windows.Point($meta.CenterX, $meta.CenterY)
      $hit = [Windows.Automation.AutomationElement]::FromPoint($pt)
      if ($hit) {
        $walker = [Windows.Automation.TreeWalker]::ControlViewWalker
        $cur = $hit
        $window = $null
        while ($cur -ne $null -and $cur -ne [Windows.Automation.AutomationElement]::RootElement) {
          if ($cur.Current.ControlType -eq [Windows.Automation.ControlType]::Window) { $window = $cur; break }
          $cur = $walker.GetParent($cur)
        }
        if ($window) { $roots += $window }
      }
    } catch {}
  }

  if ($roots.Count -eq 0) { $roots = @([Windows.Automation.AutomationElement]::RootElement) }

  $script:candidates = @()
  $script:seen = @{}

  $hasAid = -not [string]::IsNullOrWhiteSpace($meta.AutomationId)
  $hasName = -not [string]::IsNullOrWhiteSpace($meta.Name)
  $hasClass = -not [string]::IsNullOrWhiteSpace($meta.ClassName)

  $aidCond = $null
  $nameCond = $null
  $classCond = $null
  $pidCondAny = $null

  if ($hasAid) {
    $aidCond = New-Object Windows.Automation.PropertyCondition([Windows.Automation.AutomationElement]::AutomationIdProperty, $meta.AutomationId)
  }
  if ($hasName) {
    $nameCond = New-Object Windows.Automation.PropertyCondition([Windows.Automation.AutomationElement]::NameProperty, $meta.Name)
  }
  if ($hasClass) {
    $classCond = New-Object Windows.Automation.PropertyCondition([Windows.Automation.AutomationElement]::ClassNameProperty, $meta.ClassName)
  }
  if ($meta.ProcessId -gt 0) {
    $pidCondAny = New-Object Windows.Automation.PropertyCondition([Windows.Automation.AutomationElement]::ProcessIdProperty, [int]$meta.ProcessId)
  }

  foreach ($root in $roots) {
    if ($hasAid -and $pidCondAny) {
      Find-ByCondition $root (New-Object Windows.Automation.AndCondition($aidCond, $pidCondAny)) 50
    }
    if ($hasAid -and $hasName) {
      Find-ByCondition $root (New-Object Windows.Automation.AndCondition($aidCond, $nameCond)) 80
    }
    if ($hasAid) {
      Find-ByCondition $root $aidCond 120
    }
    if ($hasName -and $hasClass) {
      Find-ByCondition $root (New-Object Windows.Automation.AndCondition($nameCond, $classCond)) 80
    }
    if ($hasName) {
      Find-ByCondition $root $nameCond 120
    }
    if ($hasClass) {
      Find-ByCondition $root $classCond 80
    }
  }

  if ($script:candidates.Count -eq 0) {
    try {
      $pt = New-Object System.Windows.Point($meta.CenterX, $meta.CenterY)
      Add-Candidate ([Windows.Automation.AutomationElement]::FromPoint($pt))
    } catch {}
  }

  if ($script:candidates.Count -eq 0) {
    $result.reason = 'uia_element_not_found'
  } else {
    $best = $null
    $bestScore = -999999.0
    foreach ($candidate in $script:candidates) {
      try {
        $cur = $candidate.Current
        if ($meta.ProcessId -gt 0 -and $cur.ProcessId -ne [int]$meta.ProcessId) { continue }
        $rect = $cur.BoundingRectangle
        if ($rect.IsEmpty -or $rect.Width -le 1 -or $rect.Height -le 1) { continue }

        $score = 0.0
        if ($hasAid -and $cur.AutomationId -eq $meta.AutomationId) { $score += 90.0 }
        if ($hasName -and $cur.Name -eq $meta.Name) { $score += 45.0 }
        if ($hasClass -and $cur.ClassName -eq $meta.ClassName) { $score += 30.0 }
        if (-not [string]::IsNullOrWhiteSpace($meta.ControlType) -and $cur.ControlType.ProgrammaticName -eq $meta.ControlType) { $score += 20.0 }
        if ($meta.ProcessId -gt 0 -and $cur.ProcessId -eq [int]$meta.ProcessId) { $score += 15.0 }

        $cx = $rect.X + ($rect.Width / 2)
        $cy = $rect.Y + ($rect.Height / 2)
        $dx = $cx - $meta.CenterX
        $dy = $cy - $meta.CenterY
        $dist = [Math]::Sqrt(($dx * $dx) + ($dy * $dy))
        $score += [Math]::Max(0.0, 35.0 - ($dist / 8.0))

        if ($meta.RectW -gt 0 -and $meta.RectH -gt 0) {
          $dw = [Math]::Abs($rect.Width - $meta.RectW)
          $dh = [Math]::Abs($rect.Height - $meta.RectH)
          $score += [Math]::Max(0.0, 15.0 - (($dw + $dh) / 20.0))
        }

        if ($score -gt $bestScore) {
          $bestScore = $score
          $best = $candidate
        }
      } catch {}
    }

    if ($null -eq $best) {
      $result.reason = 'uia_element_not_match'
    } else {
      try {
        $bestRect = $best.Current.BoundingRectangle
        $result.screenX = [int]($bestRect.X + ($bestRect.Width / 2))
        $result.screenY = [int]($bestRect.Y + ($bestRect.Height / 2))
        $result.rectW = [int]$bestRect.Width
        $result.rectH = [int]$bestRect.Height
        # Prefer GetClickablePoint for HID fallback; rect centre if unavailable.
        $result.clickX = $result.screenX
        $result.clickY = $result.screenY
        try {
          $cp = New-Object System.Windows.Point
          if ($best.GetClickablePoint([ref]$cp)) {
            $result.clickX = [int]$cp.X
            $result.clickY = [int]$cp.Y
          }
        } catch {}
      } catch {}

      $beforeState = Read-ElementState $best
      $beforeTitles = @{ WindowTitle = ''; ForegroundTitle = '' }
      if ($isActivatableItem) {
        $beforeTitles = Read-ActivationTitles $best
        $result.beforeTitle = [string]$beforeTitles.WindowTitle
        if (-not $result.beforeTitle) { $result.beforeTitle = [string]$beforeTitles.ForegroundTitle }
      }

      if ($actionKind -eq 'setValue') {
        try { $best.SetFocus() } catch {}
        $valuePatternObj = $null
        if ($best.TryGetCurrentPattern([Windows.Automation.ValuePattern]::Pattern, [ref]$valuePatternObj)) {
          try {
            ([Windows.Automation.ValuePattern]$valuePatternObj).SetValue($targetText)
            $result.ok = $true
            $result.method = 'uiaValue'
          } catch {
            $result.reason = 'uia_value_set_failed:' + $_.Exception.Message
          }
        } else {
          $result.reason = 'uia_value_pattern_unavailable'
        }
      } else {
        function Try-InvokePattern {
          param([Windows.Automation.AutomationElement]$el)
          $obj = $null
          if ($el.TryGetCurrentPattern([Windows.Automation.InvokePattern]::Pattern, [ref]$obj)) {
            ([Windows.Automation.InvokePattern]$obj).Invoke()
            return $true
          }
          return $false
        }
        function Try-TogglePattern {
          param([Windows.Automation.AutomationElement]$el)
          $obj = $null
          if ($el.TryGetCurrentPattern([Windows.Automation.TogglePattern]::Pattern, [ref]$obj)) {
            ([Windows.Automation.TogglePattern]$obj).Toggle()
            return $true
          }
          return $false
        }
        function Try-SelectionPattern {
          param([Windows.Automation.AutomationElement]$el)
          $obj = $null
          if ($el.TryGetCurrentPattern([Windows.Automation.SelectionItemPattern]::Pattern, [ref]$obj)) {
            ([Windows.Automation.SelectionItemPattern]$obj).Select()
            return $true
          }
          return $false
        }
        function Try-ExpandCollapsePattern {
          param([Windows.Automation.AutomationElement]$el)
          $obj = $null
          if ($el.TryGetCurrentPattern([Windows.Automation.ExpandCollapsePattern]::Pattern, [ref]$obj)) {
            $pattern = [Windows.Automation.ExpandCollapsePattern]$obj
            $state = $pattern.Current.ExpandCollapseState
            if ($state -eq [Windows.Automation.ExpandCollapseState]::Collapsed -or $state -eq [Windows.Automation.ExpandCollapseState]::PartiallyExpanded) {
              $pattern.Expand()
            } else {
              $pattern.Collapse()
            }
            return $true
          }
          return $false
        }

        # Invoke first for clickable controls; selection items fall through Select then HID if no activation evidence.
        $preferInvoke = $meta.ControlType -match 'Button|Hyperlink|MenuItem|SplitButton'
        try {
          if ($preferInvoke -and (Try-InvokePattern $best)) {
            $result.ok = $true
            $result.method = 'uiaInvoke'
          }
          if (-not $result.ok -and (Try-TogglePattern $best)) {
            $result.ok = $true
            $result.method = 'uiaToggle'
          }
          if (-not $result.ok -and (Try-SelectionPattern $best)) {
            $result.ok = $true
            $result.method = 'uiaSelect'
          }
          if (-not $result.ok -and (Try-ExpandCollapsePattern $best)) {
            $result.ok = $true
            $result.method = 'uiaExpandCollapse'
          }
          if (-not $result.ok -and -not $preferInvoke -and (Try-InvokePattern $best)) {
            $result.ok = $true
            $result.method = 'uiaInvoke'
          }
          if (-not $result.ok) {
            try {
              $best.SetFocus()
              $result.ok = $true
              $result.method = 'uiaFocus'
            } catch {
              $result.reason = 'uia_focus_failed:' + $_.Exception.Message
            }
          }
        } catch {
          if (-not $result.reason) {
            $result.reason = 'uia_pattern_failed:' + $_.Exception.Message
          }
        }
      }

      if ($result.ok) {
        Start-Sleep -Milliseconds 40
        $afterState = Read-ElementState $best
        if (-not $afterState.Alive) {
          if ($isActivatableItem) {
            # Gone-alone ≠ activated (search/popup close). Still probe titles/outsideName.
            $afterTitles = Read-ActivationTitles $best
            $result.afterTitle = [string]$afterTitles.WindowTitle
            $result.foregroundTitle = [string]$afterTitles.ForegroundTitle
            if (-not $result.afterTitle) { $result.afterTitle = $result.foregroundTitle }
            $targetName = [string]$meta.Name
            $outsideName = $false
            if ($targetName -and $roots.Count -gt 0) {
              try {
                foreach ($root in $roots) {
                  $desc = $root.FindAll([Windows.Automation.TreeScope]::Descendants, [Windows.Automation.Condition]::TrueCondition)
                  $limit = [Math]::Min($desc.Count, 500)
                  for ($i = 0; $i -lt $limit; $i++) {
                    try {
                      $el = $desc.Item($i)
                      $nm = [string]$el.Current.Name
                      # Keep aligned with activationOutsideNameHit: exact name only (Contains hits search chrome).
                      if (-not $nm -or ($nm.Trim() -ne $targetName.Trim())) { continue }
                      $ctShort = ([string]$el.Current.ControlType.ProgrammaticName) -replace '^ControlType\\.', ''
                      # Keep aligned with isActivationOutsideNameControl: exclude selection + query containers.
                      if ($ctShort -notmatch '^(ListItem|TreeItem|TabItem|MenuItem|Edit|Document|ComboBox)$') { $outsideName = $true; break }
                    } catch {}
                  }
                  if ($outsideName) { break }
                }
              } catch {}
            }
            $activated = $false
            if ($outsideName) { $activated = $true }
            elseif ($targetName -and (($result.afterTitle -and $result.afterTitle.Contains($targetName)) -or ($result.foregroundTitle -and $result.foregroundTitle.Contains($targetName)))) { $activated = $true }
            elseif ($result.beforeTitle -and $result.afterTitle -and ($result.beforeTitle -ne $result.afterTitle)) { $activated = $true }
            elseif ($result.beforeTitle -and $result.foregroundTitle -and ($result.beforeTitle -ne $result.foregroundTitle)) { $activated = $true }
            if ($activated) {
              $result.verify = 'verified'
              $result.detail = "elementGone=true;beforeTitle=$($result.beforeTitle);afterTitle=$($result.afterTitle);fgTitle=$($result.foregroundTitle);outsideName=$outsideName"
            } else {
              $result.ok = $false
              $result.verify = 'state_not_changed'
              $result.reason = 'needs_fallback_click'
              $result.detail = "elementGone=true;beforeTitle=$($result.beforeTitle);afterTitle=$($result.afterTitle);fgTitle=$($result.foregroundTitle);target=$targetName;outsideName=$outsideName"
            }
          } else {
            $result.verify = 'needs_resnapshot'
          }
        } elseif ($actionKind -eq 'setValue') {
          if ($afterState.Value -eq $targetText) { $result.verify = 'verified' } else { $result.verify = 'state_not_changed' }
          $result.detail = "value=$($afterState.Value);focus=$($afterState.Focus)"
        } elseif ($isActivatableItem) {
          # selected/focus-only ≠ activated. Cheap evidence: Toggle/Expand/Value, title, or non-selection/non-query Name hit.
          $afterTitles = Read-ActivationTitles $best
          $result.afterTitle = [string]$afterTitles.WindowTitle
          $result.foregroundTitle = [string]$afterTitles.ForegroundTitle
          if (-not $result.afterTitle) { $result.afterTitle = $result.foregroundTitle }
          $targetName = [string]$meta.Name
          # Keep Selected/Focus flips out of local activation signal (Select false positives).
          $localChanged = ($beforeState.Toggle -ne $afterState.Toggle) -or ($beforeState.Expand -ne $afterState.Expand) -or ($beforeState.Value -ne $afterState.Value)
          $outsideName = $false
          if ($targetName -and $roots.Count -gt 0) {
            try {
              foreach ($root in $roots) {
                $desc = $root.FindAll([Windows.Automation.TreeScope]::Descendants, [Windows.Automation.Condition]::TrueCondition)
                $limit = [Math]::Min($desc.Count, 500)
                for ($i = 0; $i -lt $limit; $i++) {
                  try {
                    $el = $desc.Item($i)
                    $nm = [string]$el.Current.Name
                    # Keep aligned with activationOutsideNameHit: exact name only (Contains hits search chrome).
                    if (-not $nm -or ($nm.Trim() -ne $targetName.Trim())) { continue }
                    $ctShort = ([string]$el.Current.ControlType.ProgrammaticName) -replace '^ControlType\\.', ''
                    # Keep aligned with isActivationOutsideNameControl: exclude selection + query containers.
                    if ($ctShort -notmatch '^(ListItem|TreeItem|TabItem|MenuItem|Edit|Document|ComboBox)$') { $outsideName = $true; break }
                  } catch {}
                }
                if ($outsideName) { break }
              }
            } catch {}
          }
          $activated = $false
          if ($localChanged) { $activated = $true }
          elseif ($outsideName) { $activated = $true }
          elseif ($targetName -and (($result.afterTitle -and $result.afterTitle.Contains($targetName)) -or ($result.foregroundTitle -and $result.foregroundTitle.Contains($targetName)))) { $activated = $true }
          elseif ($result.beforeTitle -and $result.afterTitle -and ($result.beforeTitle -ne $result.afterTitle)) { $activated = $true }
          elseif ($result.beforeTitle -and $result.foregroundTitle -and ($result.beforeTitle -ne $result.foregroundTitle)) { $activated = $true }
          if ($activated) {
            $result.verify = 'verified'
            $result.detail = "selected=$($afterState.Selected);beforeTitle=$($result.beforeTitle);afterTitle=$($result.afterTitle);fgTitle=$($result.foregroundTitle);outsideName=$outsideName"
          } else {
            # Do not keep spinning on Select — force one HID (may escalate to double) click.
            $result.ok = $false
            $result.verify = 'state_not_changed'
            $result.reason = 'needs_fallback_click'
            $result.detail = "selected=$($afterState.Selected);beforeTitle=$($result.beforeTitle);afterTitle=$($result.afterTitle);fgTitle=$($result.foregroundTitle);target=$targetName;outsideName=$outsideName"
          }
        } else {
          $changed = ($beforeState.Toggle -ne $afterState.Toggle) -or ($beforeState.Expand -ne $afterState.Expand) -or ($beforeState.Selected -ne $afterState.Selected) -or ($beforeState.Value -ne $afterState.Value)
          if ($result.method -eq 'uiaToggle' -or $result.method -eq 'uiaExpandCollapse' -or $result.method -eq 'uiaSelect') {
            if ($changed -or $afterState.Selected -eq 'True') { $result.verify = 'verified' } else { $result.verify = 'state_not_changed' }
          } elseif ($result.method -eq 'uiaFocus') {
            if ($afterState.Focus -eq 'True') { $result.verify = 'verified' } else { $result.verify = 'uncertain' }
          } else {
            if ($changed) { $result.verify = 'verified' } else { $result.verify = 'uncertain' }
          }
          $result.detail = "toggle=$($afterState.Toggle);expand=$($afterState.Expand);selected=$($afterState.Selected);focus=$($afterState.Focus)"
        }
      }
    }
  }
} catch {
  $result.reason = 'uia_unexpected:' + $_.Exception.Message
}
Write-Output "__SHINEAI_UIA_JSON__$($result | ConvertTo-Json -Compress)"
`;
    const execResult = await shell.exec(script, action === 'setValue' ? 4500 : 3500);
    if (execResult.exitCode !== 0) {
        return {
            ok: false,
            method: '',
            reason: `uia_exec_failed:${execResult.stderr || 'unknown'}`,
            screenX: element.screenX,
            screenY: element.screenY,
            rectW: element.rectW ?? 0,
            rectH: element.rectH ?? 0,
            clickX: element.screenX,
            clickY: element.screenY,
        };
    }
    const parsed = parseUiaActionResult(execResult.stdout);
    if (!parsed.ok && !parsed.reason) {
        parsed.reason = 'uia_action_failed';
    }
    // Defense in depth: activatable Select/Invoke without verified activation evidence must not stay ok.
    if (action === 'click' && isActivatableSelectionItem(element)) {
        const activatedAfter = parsed.ok && parsed.verify === 'verified';
        const interpreted = interpretActivatableSelectVerify({ activatedAfter });
        if (!interpreted.ok) {
            parsed.ok = false;
            parsed.verify = interpreted.verify;
            parsed.reason = interpreted.reason;
        }
    }
    if (parsed.screenX === 0 && parsed.screenY === 0) {
        parsed.screenX = element.screenX;
        parsed.screenY = element.screenY;
    }
    if ((parsed.clickX == null || (parsed.clickX === 0 && parsed.clickY === 0)) && (parsed.screenX || parsed.screenY)) {
        parsed.clickX = parsed.screenX;
        parsed.clickY = parsed.screenY;
    }
    if (parsed.rectW === 0 && element.rectW != null)
        parsed.rectW = element.rectW;
    if (parsed.rectH === 0 && element.rectH != null)
        parsed.rectH = element.rectH;
    return parsed;
}
export async function registerDesktopTools() {
    // Platform branch: use macOS implementation on Darwin
    if (process.platform === 'darwin') {
        const { registerDarwinDesktopTools } = await import('./desktop-tools-darwin.js');
        registerDarwinDesktopTools();
        return;
    }
    // 1. screenshot — save to file, return path for AI to read natively
    // Grid labels show ABSOLUTE screen coordinates so AI can pass them directly to mouse_click.
    registerTool('screenshot', '★ STEP 1: Take a FULL screenshot at native resolution. Always start here.\n\n' +
        'Returns the image itself (attached to the result) + file path + auto-detected UI elements. LOOK at the attached image first — understand the full layout before acting. Never click coordinates you have not seen in a screenshot/zoom.\n\n' +
        'WORKFLOW (follow strictly):\n' +
        '1. screenshot() → look at the attached image → understand layout, identify target area\n' +
        '2. If target has a numbered marker → click_element(number) — DONE\n' +
        '3. If target is NOT annotated (icons, images, web app buttons) → zoom_screenshot(x,y,w,h) on that area → read grid coordinates → mouse_click(x,y)\n\n' +
        'IMPORTANT: Inspect the image carefully to identify exactly where your target is before zooming.', {
        type: 'object',
        properties: {
            x: { type: 'number', description: 'Left X coordinate (logical pixels)' },
            y: { type: 'number', description: 'Top Y coordinate (logical pixels)' },
            width: { type: 'number', description: 'Width of capture region (logical pixels)' },
            height: { type: 'number', description: 'Height of capture region (logical pixels)' },
            maxWidth: { type: 'number', description: 'Output image sizing. OMIT (default) → auto-downscale to fit the model vision limits (long edge ≤1568px, ~1.15M px) with high-quality interpolation so grid labels/small text stay readable; image pixels then differ from screen coordinates. Set 0 → keep NATIVE resolution (no scaling). Set a positive value (e.g. 1568) → scale by that max width.' },
            quality: { type: 'number', description: 'JPEG compression quality 1-100. Default: 95 (high quality for accurate AI analysis)' },
            savePath: { type: 'string', description: 'File path to save screenshot. Default: auto-generated temp file (.png)' },
            allScreens: { type: 'boolean', description: 'Capture all monitors as one image (virtual screen). Default: false' },
            monitor: { type: 'number', description: 'Monitor index (0-based). Default: 0 (primary). Ignored if allScreens=true. When set, disables follow* window screen capture.' },
            followForeground: { type: 'boolean', description: 'When no x/y/width/height, allScreens, or monitor is set: capture the foreground window (fallback to its screen, then primary if unresolved).' },
            followHandle: { type: 'number', description: 'Capture this HWND window (fallback to its screen). Only used when region/allScreens/monitor are unset.' },
            followWindowTitle: { type: 'string', description: 'Capture the first top-level window whose title contains this text (fallback to its screen). Only used when region/allScreens/monitor are unset.' },
            followProcessId: { type: 'number', description: 'Capture the main window of this process id (fallback to its screen). Only used when region/allScreens/monitor are unset.' },
            grid: { type: 'boolean', description: 'Overlay coordinate grid. Default: false' },
            annotate: { type: 'boolean', description: 'Auto-detect interactive elements via UIA and draw numbered markers. Use click_element(number) to click. Default: true' },
            includeImage: { type: 'boolean', description: 'Attach the image to the tool result. Default: true. Set false only if your model cannot accept images.' },
        },
        additionalProperties: false,
    }, async (args) => {
        const quality = args.quality != null ? Math.max(1, Math.min(100, sn(args.quality))) : 95;
        // maxWidth omitted → auto-scale to model vision limits; =0 → native; >0 → width scale.
        const maxWidthProvided = args.maxWidth != null;
        const maxWidth = maxWidthProvided ? sn(args.maxWidth) : 0;
        const autoScale = !maxWidthProvided;
        const allScreens = args.allScreens === true;
        const monitorExplicit = args.monitor != null;
        const monitorIdx = monitorExplicit ? sn(args.monitor) : 0;
        const grid = args.grid === true;
        const annotate = args.annotate !== false; // default ON
        const followForeground = args.followForeground === true;
        const followHandle = args.followHandle != null ? sn(args.followHandle) : null;
        const followWindowTitle = typeof args.followWindowTitle === 'string' ? args.followWindowTitle : null;
        const followProcessId = args.followProcessId != null ? sn(args.followProcessId) : null;
        // Determine save path
        let outPath;
        if (args.savePath) {
            outPath = resolve(args.savePath);
            const dir = dirname(outPath);
            if (!existsSync(dir))
                mkdirSync(dir, { recursive: true });
        }
        else {
            outPath = ''; // Will be set by PowerShell
        }
        try {
            presenceHide();
        }
        catch { /* overlay must never fail screenshot */ }
        const saveLine = outPath
            ? `$outFile = '${sp(outPath.replace(/\\/g, '\\\\'))}'`
            : `$outFile = [System.IO.Path]::Combine([System.IO.Path]::GetTempPath(), "shineai_ss_$(Get-Date -Format 'yyyyMMdd_HHmmss_fff').png")`;
        const captureMode = resolveScreenshotCaptureMode({
            hasExplicitRegion: args.x != null || args.y != null || args.width != null || args.height != null,
            allScreens,
            monitorExplicit,
            followForeground,
            followHandle,
            followWindowTitle,
            followProcessId,
        });
        // Shared HWND resolve for follow* / PrintWindow blank fallback (any capture mode).
        const titleEsc = followWindowTitle ? sp(followWindowTitle) : '';
        const handleLit = followHandle != null ? String(followHandle) : '0';
        const pidLit = followProcessId != null ? String(followProcessId) : '0';
        const useFg = followForeground ? '$true' : '$false';
        const allowPwFallback = captureMode === 'followWindow' ||
            followForeground ||
            (followHandle != null && followHandle !== 0) ||
            (followProcessId != null && followProcessId !== 0) ||
            Boolean(followWindowTitle && followWindowTitle.trim());
        const allowPwLit = allowPwFallback ? '$true' : '$false';
        const hwndResolve = `
$hwndCapture = [IntPtr]::Zero
$allowPwFallback = ${allowPwLit}
if (-not ("CaptureHwnd38" -as [type])) {
  Add-Type @"
using System;
using System.Runtime.InteropServices;
public class CaptureHwnd38 {
  [StructLayout(LayoutKind.Sequential)]
  public struct RECT { public int Left; public int Top; public int Right; public int Bottom; }
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);
  [DllImport("user32.dll")] public static extern bool PrintWindow(IntPtr hwnd, IntPtr hdcBlt, uint nFlags);
  [DllImport("user32.dll")] public static extern bool IsWindow(IntPtr hWnd);
  public static int[] TryRect(IntPtr h) {
    RECT r;
    if (h == IntPtr.Zero || !IsWindow(h) || !GetWindowRect(h, out r)) return null;
    return new int[] { r.Left, r.Top, r.Right, r.Bottom };
  }
}
"@
}
if (${handleLit} -ne 0) { $hwndCapture = [IntPtr]::new(${handleLit}) }
if ($hwndCapture -eq [IntPtr]::Zero -and ${pidLit} -ne 0) {
  $pCap = Get-Process -Id ${pidLit} -ErrorAction SilentlyContinue
  if ($pCap -and $pCap.MainWindowHandle -ne [IntPtr]::Zero) { $hwndCapture = $pCap.MainWindowHandle }
}
if ($hwndCapture -eq [IntPtr]::Zero -and '${titleEsc}' -ne '') {
  $pCap = Get-Process | Where-Object { $_.MainWindowTitle -like '*${titleEsc}*' -and $_.MainWindowHandle -ne [IntPtr]::Zero } | Select-Object -First 1
  if ($pCap) { $hwndCapture = $pCap.MainWindowHandle }
}
if ($hwndCapture -eq [IntPtr]::Zero -and ${useFg}) {
  $hwndCapture = [CaptureHwnd38]::GetForegroundWindow()
}
`;
        // Build capture region script
        let captureRegion;
        if (captureMode === 'explicit') {
            const rx = args.x != null ? sn(args.x) : 0;
            const ry = args.y != null ? sn(args.y) : 0;
            captureRegion = `
$captureX = ${rx}
$captureY = ${ry}
$captureW = ${args.width != null ? sn(args.width) : 0}
$captureH = ${args.height != null ? sn(args.height) : 0}
if ($captureW -le 0) { $captureW = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds.Width - $captureX }
if ($captureH -le 0) { $captureH = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds.Height - $captureY }
`;
        }
        else if (captureMode === 'allScreens') {
            captureRegion = `
$captureX = [System.Windows.Forms.SystemInformation]::VirtualScreen.X
$captureY = [System.Windows.Forms.SystemInformation]::VirtualScreen.Y
$captureW = [System.Windows.Forms.SystemInformation]::VirtualScreen.Width
$captureH = [System.Windows.Forms.SystemInformation]::VirtualScreen.Height
`;
        }
        else if (captureMode === 'followWindow') {
            // Prefer GetWindowRect crop; invalid HWND/rect → that window's Screen; else primary.
            captureRegion = `
$primary = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
$captureX = $primary.X; $captureY = $primary.Y; $captureW = $primary.Width; $captureH = $primary.Height
if ($hwndCapture -ne [IntPtr]::Zero) {
  $rw = [CaptureHwnd38]::TryRect($hwndCapture)
  $usedWindowRect = $false
  if ($rw -ne $null -and $rw.Length -ge 4) {
    $ww = [Math]::Max(0, $rw[2] - $rw[0])
    $wh = [Math]::Max(0, $rw[3] - $rw[1])
    if ($ww -gt 0 -and $wh -gt 0) {
      $captureX = $rw[0]; $captureY = $rw[1]; $captureW = $ww; $captureH = $wh
      $usedWindowRect = $true
    }
  }
  if (-not $usedWindowRect) {
    $mon = [System.Windows.Forms.Screen]::FromHandle($hwndCapture)
    if ($mon -and $mon.Bounds.Width -gt 0 -and $mon.Bounds.Height -gt 0) {
      $captureX = $mon.Bounds.X; $captureY = $mon.Bounds.Y; $captureW = $mon.Bounds.Width; $captureH = $mon.Bounds.Height
    }
  }
}
`;
        }
        else {
            // primary or explicit monitor index (legacy default monitor=0)
            captureRegion = `
$screens = [System.Windows.Forms.Screen]::AllScreens
$monIdx = ${monitorIdx}
if ($monIdx -ge $screens.Length) { $monIdx = 0 }
$mon = $screens[$monIdx]
$captureX = $mon.Bounds.X
$captureY = $mon.Bounds.Y
$captureW = $mon.Bounds.Width
$captureH = $mon.Bounds.Height
`;
        }
        // Near-mono → PrintWindow; thresholds mirror desktop-action-guards constants.
        const blankProbe = `
function Get-CaptureColorStats([System.Drawing.Bitmap]$b) {
  $sampleN = 32
  $uniq = @{}
  $sum = 0.0; $sumSq = 0.0; $n = 0
  if ($b.Width -le 0 -or $b.Height -le 0) { return @{ uniqueColors = 0; variance = 0.0 } }
  for ($sy = 0; $sy -lt $sampleN; $sy++) {
    $py = [Math]::Min($b.Height - 1, [int](($sy + 0.5) * $b.Height / $sampleN))
    for ($sx = 0; $sx -lt $sampleN; $sx++) {
      $px = [Math]::Min($b.Width - 1, [int](($sx + 0.5) * $b.Width / $sampleN))
      $c = $b.GetPixel($px, $py)
      $key = ($c.R -shl 16) -bor ($c.G -shl 8) -bor $c.B
      $uniq[$key] = $true
      $lum = 0.299 * $c.R + 0.587 * $c.G + 0.114 * $c.B
      $sum += $lum; $sumSq += ($lum * $lum); $n++
    }
  }
  $mean = if ($n -gt 0) { $sum / $n } else { 0.0 }
  $var = if ($n -gt 0) { ($sumSq / $n) - ($mean * $mean) } else { 0.0 }
  return @{ uniqueColors = [int]$uniq.Count; variance = [double]$var }
}
$captureSignal = 'ok'
$pwTried = 0
$stats = Get-CaptureColorStats $bmp
# near-mono OR follow-path suspicious near-gray (uniq≈149 after tray restore).
$nearBlank = ($stats.uniqueColors -le ${NEAR_MONO_MAX_UNIQUE}) -or ($stats.variance -le ${NEAR_MONO_MAX_LUMINANCE_VARIANCE})
$suspiciousBlank = $nearBlank -or (
  ($stats.uniqueColors -le ${SUSPICIOUS_BLANK_MAX_UNIQUE}) -and ($stats.variance -le ${SUSPICIOUS_BLANK_MAX_LUMINANCE_VARIANCE})
)
# Only blank-detect / PrintWindow when caller asked to follow a window (avoid false fail on solid wallpapers).
if ($allowPwFallback -and $suspiciousBlank -and $hwndCapture -ne [IntPtr]::Zero) {
  $rw = [CaptureHwnd38]::TryRect($hwndCapture)
  if ($rw -ne $null -and $rw.Length -ge 4) {
    $pwW = [Math]::Max(1, $rw[2] - $rw[0])
    $pwH = [Math]::Max(1, $rw[3] - $rw[1])
    $pwBmp = New-Object System.Drawing.Bitmap($pwW, $pwH)
    $pwG = [System.Drawing.Graphics]::FromImage($pwBmp)
    $hdc = $pwG.GetHdc()
    $pwOk = [CaptureHwnd38]::PrintWindow($hwndCapture, $hdc, 2) # PW_RENDERFULLCONTENT
    $pwG.ReleaseHdc($hdc)
    $pwG.Dispose()
    $pwTried = 1
    if ($pwOk) {
      $bmp.Dispose()
      $bmp = $pwBmp
      $captureX = $rw[0]; $captureY = $rw[1]; $captureW = $pwW; $captureH = $pwH
      $stats = Get-CaptureColorStats $bmp
      $nearBlank = ($stats.uniqueColors -le ${NEAR_MONO_MAX_UNIQUE}) -or ($stats.variance -le ${NEAR_MONO_MAX_LUMINANCE_VARIANCE})
      $suspiciousBlank = $nearBlank -or (
        ($stats.uniqueColors -le ${SUSPICIOUS_BLANK_MAX_UNIQUE}) -and ($stats.variance -le ${SUSPICIOUS_BLANK_MAX_LUMINANCE_VARIANCE})
      )
    } else {
      $pwBmp.Dispose()
    }
  }
}
# Hard-fail only on true near-mono after optional PrintWindow; suspicious band only triggers PW try.
if ($allowPwFallback -and $nearBlank) { $captureSignal = 'capture_blank' }
elseif ($pwTried -eq 1 -and -not $nearBlank) { $captureSignal = 'printwindow' }
`;
        const script = `
${hwndResolve}
${captureRegion}
${saveLine}
$bmp = New-Object System.Drawing.Bitmap($captureW, $captureH)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.CopyFromScreen($captureX, $captureY, 0, 0, (New-Object System.Drawing.Size($captureW, $captureH)))
$g.Dispose()
${blankProbe}
$maxW = ${maxWidth}
$autoScale = ${autoScale ? '$true' : '$false'}
$maxLongEdge = ${AUTO_SCALE_MAX_LONG_EDGE}
$maxPixels = ${AUTO_SCALE_MAX_PIXELS}
$newW = 0; $newH = 0
if ($autoScale -and $bmp.Width -gt 0 -and $bmp.Height -gt 0) {
    # scale = min(1, maxLongEdge/longEdge, sqrt(maxPixels/(w*h))) — matches computeAutoScale()
    $longEdge = [Math]::Max($bmp.Width, $bmp.Height)
    $scaleF = [Math]::Min(1.0, [Math]::Min($maxLongEdge / $longEdge, [Math]::Sqrt($maxPixels / ([double]$bmp.Width * $bmp.Height))))
    if ($scaleF -lt 1.0) {
        $newW = [Math]::Max(1, [int][Math]::Round($bmp.Width * $scaleF))
        $newH = [Math]::Max(1, [int][Math]::Round($bmp.Height * $scaleF))
    }
} elseif ($maxW -gt 0 -and $bmp.Width -gt $maxW) {
    $ratio = $maxW / $bmp.Width
    $newW = [int]($bmp.Width * $ratio)
    $newH = [int]($bmp.Height * $ratio)
}
if ($newW -gt 0 -and $newH -gt 0) {
    $resized = New-Object System.Drawing.Bitmap($newW, $newH)
    $g2 = [System.Drawing.Graphics]::FromImage($resized)
    $g2.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g2.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g2.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g2.DrawImage($bmp, 0, 0, $newW, $newH)
    $g2.Dispose()
    $bmp.Dispose()
    $bmp = $resized
}
if (${grid ? '$true' : '$false'}) {
    $origW = $captureW
    $origH = $captureH
    $scaleRatio = $bmp.Width / $origW
    $gd = [System.Drawing.Graphics]::FromImage($bmp)
    $gd.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    # Adaptive grid step: smaller regions get finer grids
    $step = 100
    if ($origW -le 600 -or $origH -le 600) { $step = 50 }
    if ($origW -le 300 -or $origH -le 300) { $step = 25 }
    $gridPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(60, 0, 180, 255), 1)
    $majorPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(100, 0, 120, 255), 1)
    $fontSize = 9
    if ($step -le 50) { $fontSize = 8 }
    if ($step -le 25) { $fontSize = 7 }
    $font = New-Object System.Drawing.Font('Arial', $fontSize)
    $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(220, 0, 80, 220))
    $bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(180, 255, 255, 255))
    # ABSOLUTE coordinates: add captureX/Y offset so labels match screen coordinates directly
    $startX = [int]([Math]::Ceiling($captureX / $step) * $step)
    for ($absX = $startX; $absX -lt ($captureX + $origW); $absX += $step) {
        $relX = $absX - $captureX
        $px = [int]($relX * $scaleRatio)
        $pen = if (($absX % ($step * 2)) -eq 0) { $majorPen } else { $gridPen }
        $gd.DrawLine($pen, $px, 0, $px, $bmp.Height)
        $lbl = "$absX"
        $sz = $gd.MeasureString($lbl, $font)
        $gd.FillRectangle($bgBrush, $px + 2, 2, $sz.Width, $sz.Height)
        $gd.DrawString($lbl, $font, $brush, ($px + 2), 2)
    }
    $startY = [int]([Math]::Ceiling($captureY / $step) * $step)
    for ($absY = $startY; $absY -lt ($captureY + $origH); $absY += $step) {
        $relY = $absY - $captureY
        $py = [int]($relY * $scaleRatio)
        $pen = if (($absY % ($step * 2)) -eq 0) { $majorPen } else { $gridPen }
        $gd.DrawLine($pen, 0, $py, $bmp.Width, $py)
        $lbl = "$absY"
        $sz = $gd.MeasureString($lbl, $font)
        $gd.FillRectangle($bgBrush, 2, $py + 2, $sz.Width, $sz.Height)
        $gd.DrawString($lbl, $font, $brush, 2, ($py + 2))
    }
    # Origin marker at top-left showing the absolute start coordinate
    $originLbl = "($captureX,$captureY)"
    $osz = $gd.MeasureString($originLbl, $font)
    $gd.FillRectangle($bgBrush, 0, 0, $osz.Width + 4, $osz.Height + 2)
    $gd.DrawString($originLbl, $font, $brush, 2, 1)
    $gridPen.Dispose(); $majorPen.Dispose(); $font.Dispose(); $brush.Dispose(); $bgBrush.Dispose(); $gd.Dispose()
}
if ($outFile -match '\\.png$') {
    $bmp.Save($outFile, [System.Drawing.Imaging.ImageFormat]::Png)
} else {
    $encParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
    $encParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]${quality})
    $bmp.Save($outFile, $global:jpegCodec, $encParams)
}
$info = Get-Item $outFile
$imgCheck = [System.Drawing.Image]::FromFile($outFile)
$imgW = $imgCheck.Width
$imgH = $imgCheck.Height
$imgCheck.Dispose()
$bmp.Dispose()
$hwndOut = if ($hwndCapture -ne [IntPtr]::Zero) { $hwndCapture.ToInt64() } else { 0 }
"$($outFile)|$($info.Length)|$($captureW)x$($captureH)|$($captureX)|$($captureY)|$($imgW)|$($imgH)|$($captureSignal)|$($stats.uniqueColors)|$($pwTried)|$($hwndOut)"
`;
        const result = await shell.exec(script, 20000);
        if (result.exitCode !== 0) {
            return { isError: true, content: [{ type: 'text', text: `Screenshot failed: ${result.stderr}` }] };
        }
        const parts = result.stdout.trim().split('|');
        const filePath = parts[0];
        const fileSize = parts[1] || '?';
        const capturedSize = parts[2] || '?';
        const originX = parseInt(parts[3] || '0', 10);
        const originY = parseInt(parts[4] || '0', 10);
        const imageW = parseInt(parts[5] || '0', 10);
        const imageH = parseInt(parts[6] || '0', 10);
        const captureSignal = parts[7] || 'ok';
        const uniqueColors = parseInt(parts[8] || '-1', 10);
        const pwTried = parseInt(parts[9] || '0', 10) === 1;
        const hwndOut = parseInt(parts[10] || '0', 10);
        const [capW, capH] = capturedSize.split('x').map(Number);
        const blankDecision = allowPwFallback
            ? resolveCaptureBlankDecision({
                isNearBlank: captureSignal === 'capture_blank',
                targetHwnd: hwndOut || null,
                printWindowTried: pwTried || captureSignal === 'printwindow',
                stillBlankAfterPrintWindow: captureSignal === 'capture_blank' && pwTried,
            })
            : 'ok';
        // Follow-target near-mono after optional PrintWindow → explicit failure (do not annotate as success).
        if (allowPwFallback && (captureSignal === 'capture_blank' || blankDecision === 'capture_blank')) {
            return {
                isError: true,
                content: [{
                        type: 'text',
                        text: `Screenshot capture_blank: near-monochrome capture (uniqueColors=${Number.isFinite(uniqueColors) ? uniqueColors : '?'}).` +
                            ` PrintWindow tried=${pwTried ? 'yes' : 'no'}, hwnd=${hwndOut || 0}.` +
                            ` File kept for debug: ${filePath}. Target window may not have painted yet — refocus/repaint and retry.`,
                    }],
            };
        }
        // Store metadata for screenshot_click
        const meta = {
            captureX: originX, captureY: originY,
            captureW: capW || imageW, captureH: capH || imageH,
            imageW, imageH,
        };
        setScreenshotMeta(screenshotMetaMap, filePath, meta);
        lastScreenshotPath = filePath;
        // UIA annotation: detect interactive elements and draw numbered markers
        let elementListText = '';
        if (annotate) {
            try {
                const cw = meta.captureW, ch = meta.captureH;
                const cx = meta.captureX, cy = meta.captureY;
                const imgPathEscaped = sp(filePath.replace(/\\/g, '\\\\'));
                const annotateScript = `
$captureX = ${cx}; $captureY = ${cy}; $captureW = ${cw}; $captureH = ${ch}
$imgPath = '${imgPathEscaped}'

# ====== Phase 0: Force Chrome/Electron accessibility tree ======
$chromeForced = $false
try {
    $centerPt = New-Object System.Windows.Point(($captureX + $captureW/2), ($captureY + $captureH/2))
    $targetEl = [Windows.Automation.AutomationElement]::FromPoint($centerPt)
    $window = $null
    $walker = [Windows.Automation.TreeWalker]::ControlViewWalker
    $cur = $targetEl
    while ($cur -ne $null -and $cur -ne [Windows.Automation.AutomationElement]::RootElement) {
        if ($cur.Current.ControlType -eq [Windows.Automation.ControlType]::Window) { $window = $cur; break }
        $cur = $walker.GetParent($cur)
    }
    if (-not $window) { $window = [Windows.Automation.AutomationElement]::RootElement }

    # Detect Chrome/Electron/Edge — check ClassName of the window
    $winClass = $window.Current.ClassName
    $isChromeApp = ($winClass -match 'Chrome_WidgetWin' -or $winClass -match 'Electron')
    if ($isChromeApp) {
        $winHandle = $window.Current.NativeWindowHandle
        if ($winHandle -ne 0) {
            $hwnd = [IntPtr]::new($winHandle)
            # Find Chrome_RenderWidgetHostHWND child and force IAccessible
            $found = [Win32]::FindChromeRenderWidget($hwnd)
            if ($found) {
                $forceResult = [Win32]::ForceAccessibility([Win32]::chromeRenderHwnd)
                $chromeForced = $forceResult
                if ($forceResult) {
                    Start-Sleep -Milliseconds 150  # Give Chrome time to build accessibility tree
                }
            }
        }
    }
} catch {
    Write-Output "CHROME_FORCE_ERR:$($_.Exception.Message)"
}

# ====== Phase 1: UIA element detection ======
$filtered = @()
# Actionable UIA elements (have a control pattern) kept for OCR neighbourhood anchoring,
# including unlabeled ones that never make it into $filtered.
$uiaActionable = @()
$idx = 1
try {
    if (-not $window) {
        $centerPt = New-Object System.Windows.Point(($captureX + $captureW/2), ($captureY + $captureH/2))
        $targetEl = [Windows.Automation.AutomationElement]::FromPoint($centerPt)
        $window = $null
        $walker = [Windows.Automation.TreeWalker]::ControlViewWalker
        $cur = $targetEl
        while ($cur -ne $null -and $cur -ne [Windows.Automation.AutomationElement]::RootElement) {
            if ($cur.Current.ControlType -eq [Windows.Automation.ControlType]::Window) { $window = $cur; break }
            $cur = $walker.GetParent($cur)
        }
        if (-not $window) { $window = [Windows.Automation.AutomationElement]::RootElement }
    }

    # If Chrome was forced, re-fetch the window element to get updated tree
    if ($chromeForced) {
        try {
            $window = [Windows.Automation.AutomationElement]::FromHandle([IntPtr]::new($window.Current.NativeWindowHandle))
        } catch {}
    }

    # Offscreen elements are skipped below anyway; filtering provider-side keeps long Chrome pages from blowing the 45s exec timeout.
    $onScreenCond = New-Object Windows.Automation.PropertyCondition([Windows.Automation.AutomationElement]::IsOffscreenProperty, $false)
    $allEls = $window.FindAll([Windows.Automation.TreeScope]::Descendants, $onScreenCond)
    $uiaSw = [System.Diagnostics.Stopwatch]::StartNew()
    $uiaTotal = 0
    foreach ($el in $allEls) {
        if ($uiaSw.ElapsedMilliseconds -gt 15000) { Write-Output "UIA_ERROR:element scan exceeded 15s budget, partial results"; break }
        $uiaTotal++
        $rect = $el.Current.BoundingRectangle
        if ($rect.IsEmpty -or $rect.Width -le 2 -or $rect.Height -le 2) { continue }
        if ($rect.Width -gt $captureW -or $rect.Height -gt $captureH) { continue }
        $elCx = [int]($rect.X + $rect.Width / 2)
        $elCy = [int]($rect.Y + $rect.Height / 2)
        if ($elCx -lt $captureX -or $elCx -ge ($captureX + $captureW)) { continue }
        if ($elCy -lt $captureY -or $elCy -ge ($captureY + $captureH)) { continue }
        # Skip elements that are reported off-screen (occluded / scrolled out)
        $isOffscreen = $false
        try { $isOffscreen = [bool]$el.Current.IsOffscreen } catch {}
        if ($isOffscreen) { continue }
        $isEnabled = $true
        try { $isEnabled = [bool]$el.Current.IsEnabled } catch {}
        $name = $el.Current.Name
        $aid = $el.Current.AutomationId
        $ct = $el.Current.ControlType.ProgrammaticName
        # Probe key control patterns (semantic actionability signal reused by TS scoring)
        $pats = @()
        $patDummy = $null
        try { if ($el.TryGetCurrentPattern([Windows.Automation.InvokePattern]::Pattern, [ref]$patDummy)) { $pats += 'Invoke' } } catch {}
        try { if ($el.TryGetCurrentPattern([Windows.Automation.TogglePattern]::Pattern, [ref]$patDummy)) { $pats += 'Toggle' } } catch {}
        try { if ($el.TryGetCurrentPattern([Windows.Automation.SelectionItemPattern]::Pattern, [ref]$patDummy)) { $pats += 'SelectionItem' } } catch {}
        try { if ($el.TryGetCurrentPattern([Windows.Automation.ExpandCollapsePattern]::Pattern, [ref]$patDummy)) { $pats += 'ExpandCollapse' } } catch {}
        try { if ($el.TryGetCurrentPattern([Windows.Automation.ValuePattern]::Pattern, [ref]$patDummy)) { $pats += 'Value' } } catch {}
        $patStr = ($pats -join ';')
        if ($pats.Count -gt 0) {
            $uiaActionable += @{X=[int]$rect.X; Y=[int]$rect.Y; W=[int]$rect.Width; H=[int]$rect.Height; CX=$elCx; CY=$elCy; CT=$ct; PAT=$patStr; EN=$isEnabled}
        }
        # Accept elements with name, automationId, or actionable control types even without name
        $label = if ($name) { $name } elseif ($aid) { $aid } else { '' }
        $isClickable = ($ct -match 'Button|Hyperlink|MenuItem|TabItem|ListItem|CheckBox|RadioButton|ComboBox|Slider|Image')
        # Empty name + no pattern + not clickable → skip/de-rank noise
        if (-not $label -and -not $isClickable -and $pats.Count -eq 0) { continue }
        if (-not $label -and -not $isClickable) { continue }
        # Pure Image with no actionable pattern is decorative — skip to cut noise
        if (-not $name -and -not $aid -and $ct -match 'Image' -and $pats.Count -eq 0) { continue }
        if (-not $label) { $label = $ct -replace 'ControlType\\.', '' }
        # Dedup same-name same-bounds parent/child: keep the one with patterns
        $dupKey = "$label|$([int]$rect.X)|$([int]$rect.Y)|$([int]$rect.Width)|$([int]$rect.Height)"
        $dupIdx = -1
        for ($di = 0; $di -lt $filtered.Count; $di++) {
            $prev = $filtered[$di]
            if ("$($prev.Name)|$($prev.X)|$($prev.Y)|$($prev.W)|$($prev.H)" -eq $dupKey) { $dupIdx = $di; break }
        }
        if ($dupIdx -ge 0) {
            $prevPatCount = if ($filtered[$dupIdx].PAT) { @($filtered[$dupIdx].PAT -split ';' | Where-Object { $_ }).Count } else { 0 }
            if ($pats.Count -gt $prevPatCount) {
                $filtered[$dupIdx] = @{N=$filtered[$dupIdx].N; Name=$label; CT=$ct; CX=$elCx; CY=$elCy; W=[int]$rect.Width; H=[int]$rect.Height; X=[int]$rect.X; Y=[int]$rect.Y; AID=$aid; CLS=$el.Current.ClassName; PID=$el.Current.ProcessId; Src='UIA'; EN=$isEnabled; OFF=$isOffscreen; PAT=$patStr}
            }
            continue
        }
        $filtered += @{N=$idx; Name=$label; CT=$ct; CX=$elCx; CY=$elCy; W=[int]$rect.Width; H=[int]$rect.Height; X=[int]$rect.X; Y=[int]$rect.Y; AID=$aid; CLS=$el.Current.ClassName; PID=$el.Current.ProcessId; Src='UIA'; EN=$isEnabled; OFF=$isOffscreen; PAT=$patStr}
        $idx++
        if ($idx -gt 80) { break }
    }
    Write-Output "UIA_STATS:total=$uiaTotal,filtered=$($filtered.Count),actionable=$($uiaActionable.Count),chromeForced=$chromeForced"
} catch {
    Write-Output "UIA_ERROR:$($_.Exception.Message)"
}

# ====== Phase 2: OCR fallback if actionable UIA is sparse ======
# WinRT async requires STA thread. PersistentShell runs MTA (STA blocks ReadLine).
# Solution: run external ocr-worker.ps1 in a separate powershell.exe -STA process.
# Threshold: actionable (pattern-bearing) count, not raw filtered.Count.
if ($uiaActionable.Count -lt 5) {
    try {
        $ocrWorker = '${OCR_WORKER_PS1.replace(/\\/g, '\\\\')}'.Replace('\\\\','\\')
        $ocrImgPath = $imgPath.Replace('\\\\','\\')
        $ocrOut = [System.IO.Path]::Combine([System.IO.Path]::GetTempPath(), "shineai_ocr_$(Get-Date -Format 'yyyyMMdd_HHmmss_fff').txt")

        $psi = New-Object System.Diagnostics.ProcessStartInfo
        $psi.FileName = 'powershell.exe'
        $psi.Arguments = '-NoProfile -STA -ExecutionPolicy Bypass -File "' + $ocrWorker + '" -ImgPath "' + $ocrImgPath + '" -CaptureX ' + $captureX + ' -CaptureY ' + $captureY + ' -CaptureW ' + $captureW + ' -CaptureH ' + $captureH + ' -OutFile "' + $ocrOut + '"'
        $psi.UseShellExecute = $false
        $psi.CreateNoWindow = $true
        $psi.RedirectStandardError = $true
        $proc = [System.Diagnostics.Process]::Start($psi)
        $stderrTask = $proc.StandardError.ReadToEndAsync()
        if (-not $proc.WaitForExit(8000)) { try { $proc.Kill(); $proc.WaitForExit(1000) | Out-Null } catch {} }
        $stderr = if ($stderrTask.Wait(1000)) { $stderrTask.Result } else { '' }
        if ($proc.ExitCode -ne 0) { Write-Output "OCR_PROC_ERR:exit=$($proc.ExitCode),stderr=$stderr" }

        $ocrExists = Test-Path $ocrOut
        $ocrSize = if ($ocrExists) { (Get-Item $ocrOut).Length } else { 0 }
        if ($ocrExists -and $ocrSize -gt 0) {
            $ocrLines = Get-Content $ocrOut -Encoding UTF8
            $ocrCount = 0
            foreach ($ol in $ocrLines) {
                $parts = $ol.Split('|')
                if ($parts.Count -ge 5) {
                    $ocrW = [int]$parts[3]
                    $ocrH = [int]$parts[4]
                    $ocrCx = [int]$parts[1]
                    $ocrCy = [int]$parts[2]
                    $ocrX = $ocrCx - [int]($ocrW / 2)
                    $ocrY = $ocrCy - [int]($ocrH / 2)
                    # Anchor OCR→UIA: centre-in-bounds OR distance ≤ max(24, min(edge)*0.3)
                    $anchor = $null
                    $bestDist = [double]::PositiveInfinity
                    foreach ($cand in $uiaActionable) {
                        $inside = ($ocrCx -ge $cand.X -and $ocrCx -le ($cand.X + $cand.W) -and $ocrCy -ge $cand.Y -and $ocrCy -le ($cand.Y + $cand.H))
                        if ($inside) { $anchor = $cand; break }
                        $nx = [Math]::Max($cand.X, [Math]::Min($ocrCx, $cand.X + $cand.W))
                        $ny = [Math]::Max($cand.Y, [Math]::Min($ocrCy, $cand.Y + $cand.H))
                        $dist = [Math]::Sqrt(($ocrCx - $nx) * ($ocrCx - $nx) + ($ocrCy - $ny) * ($ocrCy - $ny))
                        $edge = [Math]::Min($cand.W, $cand.H)
                        $thresh = [Math]::Max(24, $edge * 0.3)
                        if ($dist -le $thresh -and $dist -lt $bestDist) { $bestDist = $dist; $anchor = $cand }
                    }
                    if ($anchor) {
                        $filtered += @{N=$idx; Name=$parts[0]; CT=$anchor.CT; CX=$anchor.CX; CY=$anchor.CY; W=$anchor.W; H=$anchor.H; X=$anchor.X; Y=$anchor.Y; AID=''; CLS=''; PID=0; Src='OCR_UIA'; EN=$anchor.EN; OFF=$false; PAT=$anchor.PAT}
                    } else {
                        $filtered += @{N=$idx; Name=$parts[0]; CT='OCR.Text'; CX=$ocrCx; CY=$ocrCy; W=$ocrW; H=$ocrH; X=$ocrX; Y=$ocrY; AID=''; CLS=''; PID=0; Src='OCR'; EN=$true; OFF=$false; PAT=''}
                    }
                    $idx++
                    $ocrCount++
                    if ($idx -gt 80) { break }
                }
            }
            Write-Output "OCR_DEBUG:words=$ocrCount,lines=$($ocrLines.Count),size=$ocrSize"
        } else {
            Write-Output "OCR_DIAG:exists=$ocrExists,size=$ocrSize,exit=$($proc.ExitCode),stderr=$stderr,outpath=$ocrOut,imgpath=$imgPath,worker=$ocrWorker"
        }
        Remove-Item $ocrOut -ErrorAction SilentlyContinue
    } catch {
        Write-Output "OCR_ERROR:$($_.Exception.Message)"
    }
}

# ====== Phase 3: Draw annotations on image ======
if ($filtered.Count -gt 0) {
    # Load image via stream to avoid file locking (GDI+ locks file when loading from path)
    $fileBytes = [System.IO.File]::ReadAllBytes($imgPath)
    $ms = New-Object System.IO.MemoryStream(,$fileBytes)
    $bmp = [System.Drawing.Bitmap]::new($ms)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $font = New-Object System.Drawing.Font('Arial', 9, [System.Drawing.FontStyle]::Bold)
    $labelFont = New-Object System.Drawing.Font('Arial', 7)
    $redBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(230, 230, 30, 30))
    $greenBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(230, 30, 150, 30))
    $whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $borderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(180, 255, 255, 0), 2)
    $ocrPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(180, 0, 255, 100), 2)
    $scaleX = $bmp.Width / $captureW
    $scaleY = $bmp.Height / $captureH

    foreach ($el in $filtered) {
        $imgPx = [int](($el.CX - $captureX) * $scaleX)
        $imgPy = [int](($el.CY - $captureY) * $scaleY)
        $elImgW = [Math]::Max([int]($el.W * $scaleX), 20)
        $elImgH = [Math]::Max([int]($el.H * $scaleY), 20)
        $isOcr = $el.Src -eq 'OCR'
        $pen = if ($isOcr) { $ocrPen } else { $borderPen }
        $bg = if ($isOcr) { $greenBrush } else { $redBrush }

        # Bounding box
        $g.DrawRectangle($pen, ($imgPx - $elImgW/2), ($imgPy - $elImgH/2), $elImgW, $elImgH)
        # Number badge
        $r = 10
        $g.FillEllipse($bg, ($imgPx - $r), ($imgPy - $elImgH/2 - $r*2 - 2), ($r * 2), ($r * 2))
        $lbl = "$($el.N)"
        $sz = $g.MeasureString($lbl, $font)
        $g.DrawString($lbl, $font, $whiteBrush, ($imgPx - $sz.Width/2), ($imgPy - $elImgH/2 - $r*2 - 2 + ($r - $sz.Height/2)))
        # Name label
        $nameLbl = $el.Name
        if ($nameLbl.Length -gt 15) { $nameLbl = $nameLbl.Substring(0, 12) + '...' }
        $nsz = $g.MeasureString($nameLbl, $labelFont)
        $g.FillRectangle((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(180,0,0,0))), ($imgPx - $nsz.Width/2), ($imgPy + $elImgH/2 + 2), $nsz.Width, $nsz.Height)
        $g.DrawString($nameLbl, $labelFont, $whiteBrush, ($imgPx - $nsz.Width/2), ($imgPy + $elImgH/2 + 2))
    }
    $font.Dispose(); $labelFont.Dispose(); $redBrush.Dispose(); $greenBrush.Dispose()
    $whiteBrush.Dispose(); $borderPen.Dispose(); $ocrPen.Dispose(); $g.Dispose()
    $bmp.Save($imgPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    $ms.Dispose()
}

# Output element list
foreach ($el in $filtered) { Write-Output "$($el.N)|$($el.Name)|$($el.CT)|$($el.CX)|$($el.CY)|$($el.AID)|$($el.CLS)|$($el.PID)|$($el.X)|$($el.Y)|$($el.W)|$($el.H)|$($el.Src)|$($el.EN)|$($el.OFF)|$($el.PAT)" }
`;
                const annotateResult = await shell.exec(annotateScript, 45000);
                const elements = [];
                const rawLines = annotateResult.stdout.trim().split('\n');
                const debugLines = [];
                const parseNum = (v) => {
                    const n = parseInt(v ?? '', 10);
                    return Number.isFinite(n) ? n : 0;
                };
                for (const line of rawLines) {
                    const trimmed = line.trim();
                    if (trimmed.startsWith('UIA_ERROR:') || trimmed.startsWith('UIA_STATS:') || trimmed.startsWith('CHROME_FORCE_ERR:') || trimmed.startsWith('OCR_ERROR:') || trimmed.startsWith('OCR_DEBUG:') || trimmed.startsWith('OCR_DIAG:') || trimmed.startsWith('OCR_PROC_ERR:')) {
                        debugLines.push(trimmed);
                        continue;
                    }
                    const p = trimmed.split('|');
                    if (p.length >= 5 && p[0] && p[3] && p[4]) {
                        const number = parseNum(p[0]);
                        if (!Number.isFinite(number) || number <= 0)
                            continue;
                        const rectW = parseNum(p[10]);
                        const rectH = parseNum(p[11]);
                        elements.push({
                            number,
                            name: p[1] || '',
                            controlType: p[2] || '',
                            screenX: parseNum(p[3]),
                            screenY: parseNum(p[4]),
                            automationId: p[5] || '',
                            className: p[6] || '',
                            processId: parseNum(p[7]),
                            rectX: parseNum(p[8]),
                            rectY: parseNum(p[9]),
                            rectW,
                            rectH,
                            source: parseAnnotatedSource(p[12]),
                            isEnabled: p[13] === undefined || p[13] === '' ? undefined : p[13] === 'True',
                            isOffscreen: p[14] === 'True',
                            patterns: p[15] ? p[15].split(';').filter(Boolean) : [],
                        });
                    }
                }
                if (elements.length > 0) {
                    meta.elements = elements;
                    setScreenshotMeta(screenshotMetaMap, filePath, meta);
                    lastAnnotatedPath = filePath;
                }
                const uiaCount = elements.filter(e => e.source === 'UIA' || e.source === 'OCR_UIA').length;
                const ocrCount = elements.filter(e => e.source === 'OCR').length;
                const debugSuffix = debugLines.length > 0 ? `\n[debug: ${debugLines.join('; ')}]` : '';
                elementListText = elements.length > 0
                    ? `\n\nDetected ${uiaCount} UI elements + ${ocrCount} OCR texts (use click_element to click by number, most actionable first):\n` +
                        sortElementsForDisplay(elements).map(formatElementLine).join('\n') + debugSuffix
                    : `\n\nAnnotation: exitCode=${annotateResult.exitCode}, stdoutLen=${annotateResult.stdout.length}, rawLines=${rawLines.length}` +
                        (debugLines.length > 0 ? `\nInfo: ${debugLines.join('; ')}` : '') +
                        (annotateResult.stderr ? `\nStderr: ${annotateResult.stderr.substring(0, 300)}` : '');
            }
            catch (annotateErr) {
                const errMsg = annotateErr instanceof Error ? annotateErr.message : String(annotateErr);
                elementListText = `\n\nAnnotation exception: ${errMsg}`;
            }
        }
        // Persist ScreenshotMeta to disk for trace analysis (P1/P2).
        // Wrapped in try/catch — persistence failure must not affect screenshot return.
        try {
            const metaOut = filePath.replace(/\.[^.]+$/, '.meta.json');
            const metaDir = dirname(metaOut);
            await mkdir(metaDir, { recursive: true });
            const metaPayload = JSON.stringify({
                capturedAt: Date.now(),
                screenshotPath: filePath,
                captureX: meta.captureX,
                captureY: meta.captureY,
                captureW: meta.captureW,
                captureH: meta.captureH,
                imageW: meta.imageW,
                imageH: meta.imageH,
                elementCount: meta.elements?.length ?? 0,
                elements: (meta.elements ?? []).map(e => ({
                    number: e.number,
                    name: e.name,
                    controlType: e.controlType,
                    screenX: e.screenX,
                    screenY: e.screenY,
                    rectX: e.rectX,
                    rectY: e.rectY,
                    rectW: e.rectW,
                    rectH: e.rectH,
                    source: e.source,
                })),
            }, null, 2);
            await writeFile(metaOut, metaPayload, 'utf8');
        }
        catch {
            // meta persistence failure does not affect screenshot result
        }
        const wasScaled = imageW > 0 && capW > 0 && (imageW !== capW || imageH !== capH);
        const scalingNotice = wasScaled
            ? `SCALED: image=${imageW}x${imageH} downscaled from capture ${capW}x${capH}. IMAGE PIXELS ≠ SCREEN COORDINATES. To click: prefer click_element(number); or screenshot_click(imageX,imageY) which auto-converts image pixels back to screen; or read a grid label (absolute screen coords) and pass it to mouse_click(x,y). Grid labels and numbered markers already use absolute screen coordinates.`
            : '';
        const inline = await loadInlineImage(filePath, args.includeImage !== false);
        return {
            content: [{
                    type: 'text',
                    text: [
                        `Screenshot saved: ${filePath}`,
                        `Capture region: origin=(${originX},${originY}), size=${capturedSize}, image=${imageW}x${imageH}, file=${fileSize} bytes`,
                        scalingNotice,
                        `NEXT: ${inline.note}`,
                        annotate && meta.elements && meta.elements.length > 0
                            ? `Found ${meta.elements.length} annotated elements. Use click_element(number) for any numbered element. If your target is NOT numbered, use zoom_screenshot(x,y,w,h) on that area → read grid coordinates → mouse_click(x,y).`
                            : `No annotated elements found (common for web/Electron apps). Use zoom_screenshot(x,y,w,h) on the area of interest → read grid coordinates → mouse_click(x,y). Do NOT use screenshot_click.`,
                    ].filter(Boolean).join('\n') + elementListText,
                }, ...(inline.block ? [inline.block] : [])],
        };
    }, { title: 'Screenshot', readOnlyHint: true, destructiveHint: false });
    // 1b. screenshot_click — click at image pixel position, auto-converts to screen coordinates
    registerTool('screenshot_click', '⚠️ LOW PRIORITY — avoid this tool. Use click_element(number) or mouse_click(x,y) instead.\n\n' +
        'This tool clicks by percentage position in the last screenshot. It is IMPRECISE and should only be used as a last resort.\n' +
        'Preferred workflow: screenshot → zoom_screenshot → read grid coordinates → mouse_click(x,y).\n\n' +
        'Modes: percentX+percentY (e.g. 90,50 = 90% from left, 50% from top) or imageX+imageY (pixel position).', {
        type: 'object',
        properties: {
            percentX: { type: 'number', description: 'X position as percentage of image width (0-100). E.g., 50 = center, 90 = near right edge. Recommended over imageX.' },
            percentY: { type: 'number', description: 'Y position as percentage of image height (0-100). E.g., 50 = center, 10 = near top.' },
            imageX: { type: 'number', description: 'X pixel position in the screenshot image (0 = left edge). Use percentX instead for better accuracy.' },
            imageY: { type: 'number', description: 'Y pixel position in the screenshot image (0 = top edge). Use percentY instead for better accuracy.' },
            screenshotPath: { type: 'string', description: 'Path to the screenshot file. If omitted, uses the most recent screenshot.' },
            button: { type: 'string', enum: ['left', 'right', 'middle'], description: 'Mouse button. Default: left' },
            clickType: { type: 'string', enum: ['single', 'double'], description: 'Click type. Default: single' },
            expectText: { type: 'string', description: 'Optional safety guard. If set, the click only fires when this text (case-insensitive substring) appears in the UIA element under the cursor or up to 3 of its ancestors. Otherwise the click is refused and the actual target is returned so you can re-locate. Use for toggle buttons (like/follow) to avoid mis-clicks.' },
        },
        additionalProperties: false,
    }, async (args) => {
        const ssPath = args.screenshotPath || lastScreenshotPath;
        if (!ssPath) {
            return { isError: true, content: [{ type: 'text', text: 'No screenshot taken yet. Take a screenshot first.' }] };
        }
        const meta = getScreenshotMeta(screenshotMetaMap, ssPath);
        if (!meta) {
            return { isError: true, content: [{ type: 'text', text: `No metadata found for screenshot: ${ssPath}. Take a new screenshot first.` }] };
        }
        // Support both percentage and pixel mode
        let imageX, imageY;
        if (args.percentX != null && args.percentY != null) {
            // Percentage mode: convert to pixel position
            imageX = Math.round((sn(args.percentX) / 100) * meta.imageW);
            imageY = Math.round((sn(args.percentY) / 100) * meta.imageH);
        }
        else if (args.imageX != null && args.imageY != null) {
            imageX = sn(args.imageX);
            imageY = sn(args.imageY);
        }
        else {
            return { isError: true, content: [{ type: 'text', text: 'Provide either percentX+percentY or imageX+imageY.' }] };
        }
        // Convert image pixel position → screen coordinate
        const screenX = Math.round(meta.captureX + (imageX / meta.imageW) * meta.captureW);
        const screenY = Math.round(meta.captureY + (imageY / meta.imageH) * meta.captureH);
        const button = (args.button === 'right' || args.button === 'middle') ? args.button : 'left';
        const clickType = args.clickType === 'double' ? 'double' : 'single';
        const clickFlags = getMouseClickFlags(button, clickType);
        // Pre-click UIA hit-test: always report, and gate on expectText when provided.
        const expectText = args.expectText || '';
        const hit = await hitTestUnderPoint(screenX, screenY);
        const hitTargetText = formatHitTarget(hit);
        if (expectText.trim() && !matchesExpectText([hit.name, ...hit.ancestors], expectText)) {
            return {
                isError: true,
                content: [{
                        type: 'text',
                        text: `Click refused: expectText="${expectText}" not found under cursor at screen(${screenX},${screenY}).\n${hitTargetText}\nRe-locate the target (screenshot + click_element or zoom_screenshot → mouse_click) and retry.`,
                    }],
            };
        }
        lastActionableElement = null; // focus moves here; keyboard_type must not re-click a stale target
        try {
            presenceMark('click', screenX, screenY);
        }
        catch { /* overlay must never fail click */ }
        const script = `
${formatSendMouseCommand(screenX, screenY, clickFlags)}
Start-Sleep -Milliseconds 100
# Capture a small region around click point to verify (clamped to virtual desktop)
${verifyCropPs(screenX, screenY, 200)}
$vBmp = New-Object System.Drawing.Bitmap($vw, $vh)
$vg = [System.Drawing.Graphics]::FromImage($vBmp)
$vg.CopyFromScreen($vx, $vy, 0, 0, (New-Object System.Drawing.Size($vw, $vh)))
# Draw crosshair at click position
$cx = $px
$cy = $py
$crossPen = New-Object System.Drawing.Pen([System.Drawing.Color]::Red, 3)
$vg.DrawLine($crossPen, ($cx - 20), $cy, ($cx + 20), $cy)
$vg.DrawLine($crossPen, $cx, ($cy - 20), $cx, ($cy + 20))
$vg.DrawEllipse($crossPen, ($cx - 12), ($cy - 12), 24, 24)
$crossPen.Dispose()
# Label with coordinates
$lFont = New-Object System.Drawing.Font('Arial', 10, [System.Drawing.FontStyle]::Bold)
$lBg = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(200,0,0,0))
$lFg = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::Yellow)
$label = "Click@(${screenX},${screenY})"
$lsz = $vg.MeasureString($label, $lFont)
$vg.FillRectangle($lBg, 4, 4, $lsz.Width + 4, $lsz.Height + 2)
$vg.DrawString($label, $lFont, $lFg, 6, 4)
$lFont.Dispose(); $lBg.Dispose(); $lFg.Dispose(); $vg.Dispose()
$vPath = [System.IO.Path]::Combine([System.IO.Path]::GetTempPath(), "shineai_click_verify_$(Get-Date -Format 'yyyyMMdd_HHmmss_fff').png")
$vBmp.Save($vPath, [System.Drawing.Imaging.ImageFormat]::Png)
$vBmp.Dispose()
Write-Output "clicked|$vPath"
`;
        const result = await shell.exec(script, 8000);
        if (result.exitCode !== 0) {
            return { isError: true, content: [{ type: 'text', text: `Click failed: ${result.stderr}` }] };
        }
        const parts = result.stdout.trim().split('|');
        const verifyPath = parts[1] || '';
        const verify = await loadInlineImage(verifyPath);
        return {
            content: [{
                    type: 'text',
                    text: `Clicked ${button} at screen(${screenX},${screenY}) — mapped from image pixel(${imageX},${imageY}) in ${ssPath}\n${hitTargetText}\nCapture region: origin=(${meta.captureX},${meta.captureY}), image=${meta.imageW}x${meta.imageH}, screen=${meta.captureW}x${meta.captureH}\n\nVerification image saved to: ${verifyPath}\nThis image shows the click point with a RED crosshair marking the exact click position (crop clamped to the virtual desktop). Confirm the click hit the right target. ${verify.note}`,
                }, ...(verify.block ? [verify.block] : [])],
        };
    }, { title: 'Screenshot Click', destructiveHint: true });
    // ---- Verify-crop + pre-click hit-test helpers (shared by click tools) ----
    /**
     * Emit PowerShell that computes a verify-crop rect clamped to the virtual
     * desktop (VirtualScreen.Left/Top can be negative for monitors above/left of
     * primary). Mirrors clampCropRect() in click-accuracy.ts. After running,
     * $vx,$vy,$vw,$vh hold the crop origin/size and $px,$py the crosshair position
     * relative to that origin. cx/cy are physical pixels.
     */
    function verifyCropPs(cx, cy, half) {
        return `$vsInfo = [System.Windows.Forms.SystemInformation]::VirtualScreen
$half = ${half}
$full = $half * 2
$vw = [Math]::Min($full, $vsInfo.Width)
$vh = [Math]::Min($full, $vsInfo.Height)
$vx = [Math]::Round(${cx} - $half)
$vy = [Math]::Round(${cy} - $half)
$vx = [Math]::Max($vsInfo.Left, [Math]::Min($vx, $vsInfo.Right - $vw))
$vy = [Math]::Max($vsInfo.Top, [Math]::Min($vy, $vsInfo.Bottom - $vh))
$px = ${cx} - $vx
$py = ${cy} - $vy`;
    }
    /**
     * UIA hit-test the element under a screen point (physical px) via
     * AutomationElement.FromPoint, plus up to 3 ancestor Names. Best-effort:
     * any failure returns ok=false and never blocks the caller's click.
     */
    async function hitTestUnderPoint(x, y) {
        const empty = { ok: false, name: '', controlType: '', className: '', processName: '', ancestors: [] };
        const script = `
$out = @{ ok = $false; name = ''; controlType = ''; className = ''; processName = ''; ancestors = @() }
try {
  Add-Type -AssemblyName WindowsBase -ErrorAction SilentlyContinue
  Add-Type -AssemblyName UIAutomationClient -ErrorAction SilentlyContinue
  Add-Type -AssemblyName UIAutomationTypes -ErrorAction SilentlyContinue
  $pt = New-Object System.Windows.Point(${Math.round(x)}, ${Math.round(y)})
  $el = [System.Windows.Automation.AutomationElement]::FromPoint($pt)
  if ($el -ne $null) {
    $out.ok = $true
    try { $out.name = [string]$el.Current.Name } catch {}
    try { $out.controlType = [string]$el.Current.ControlType.ProgrammaticName } catch {}
    try { $out.className = [string]$el.Current.ClassName } catch {}
    try {
      $p = Get-Process -Id $el.Current.ProcessId -ErrorAction SilentlyContinue
      if ($p) { $out.processName = [string]$p.ProcessName }
    } catch {}
    try {
      $walker = [System.Windows.Automation.TreeWalker]::ControlViewWalker
      $anc = @()
      $cur = $walker.GetParent($el)
      $depth = 0
      while ($cur -ne $null -and $depth -lt 3) {
        try { $anc += [string]$cur.Current.Name } catch { $anc += '' }
        $cur = $walker.GetParent($cur)
        $depth++
      }
      $out.ancestors = @($anc)
    } catch {}
  }
} catch {}
Write-Output "__SHINEAI_HIT_JSON__$($out | ConvertTo-Json -Compress)"
`;
        try {
            const result = await shell.exec(script, 3000);
            const marker = '__SHINEAI_HIT_JSON__';
            const line = result.stdout
                .split('\n')
                .map(l => l.trim())
                .filter(Boolean)
                .reverse()
                .find(l => l.startsWith(marker));
            if (!line)
                return empty;
            const parsed = JSON.parse(line.slice(marker.length));
            const rawAnc = parsed.ancestors;
            const ancestors = Array.isArray(rawAnc)
                ? rawAnc.map(a => String(a ?? ''))
                : rawAnc != null ? [String(rawAnc)] : [];
            return {
                ok: Boolean(parsed.ok),
                name: parsed.name || '',
                controlType: parsed.controlType || '',
                className: parsed.className || '',
                processName: parsed.processName || '',
                ancestors,
            };
        }
        catch {
            return empty;
        }
    }
    /** One-line "Target under cursor: ..." summary of a hit-test result. */
    function formatHitTarget(h) {
        if (!h.ok)
            return 'Target under cursor: <unknown> (UIA hit-test unavailable)';
        const parts = [`name="${h.name || ''}"`];
        if (h.controlType)
            parts.push(h.controlType.replace(/^ControlType\./, ''));
        if (h.className)
            parts.push(`class=${h.className}`);
        if (h.processName)
            parts.push(`proc=${h.processName}`);
        const anc = h.ancestors.filter(Boolean);
        const ancText = anc.length ? ` | ancestors: ${anc.map(a => `"${a}"`).join(' < ')}` : '';
        return `Target under cursor: ${parts.join(', ')}${ancText}`;
    }
    // ---- Vision-grounding HID click helper (shared by click_element fallback & vision_click) ----
    /**
     * Perform a HID mouse click at (cx, cy) and capture a verification screenshot.
     * Returns { verifyImgPath } on success, throws on shell failure.
     * label is shown in the verification image overlay.
     */
    async function hidClickAndVerify(cx, cy, button, clickType, label) {
        const clickFlags = getMouseClickFlags(button, clickType);
        // Pre-click hit-test (report only; never blocks the HID click).
        const hit = await hitTestUnderPoint(cx, cy);
        const hitLabel = hit.ok && hit.name ? `${label} | under:${hit.name.slice(0, 40)}` : label;
        try {
            presenceMark('click', cx, cy);
        }
        catch { /* overlay must never fail HID click */ }
        const script = `
${formatSendMouseCommand(cx, cy, clickFlags)}
Start-Sleep -Milliseconds 80
${verifyCropPs(cx, cy, 150)}
$vBmp = New-Object System.Drawing.Bitmap($vw, $vh)
$vg = [System.Drawing.Graphics]::FromImage($vBmp)
$vg.CopyFromScreen($vx, $vy, 0, 0, (New-Object System.Drawing.Size($vw, $vh)))
$crossPen = New-Object System.Drawing.Pen([System.Drawing.Color]::Red, 3)
$vg.DrawLine($crossPen, ($px - 15), $py, ($px + 15), $py)
$vg.DrawLine($crossPen, $px, ($py - 15), $px, ($py + 15))
$vg.DrawEllipse($crossPen, ($px - 10), ($py - 10), 20, 20)
$crossPen.Dispose()
$lFont = New-Object System.Drawing.Font('Arial', 9, [System.Drawing.FontStyle]::Bold)
$lBg = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(200,0,0,0))
$lFg = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::Yellow)
$label = '${hitLabel.replace(/'/g, "''")}'
$lsz = $vg.MeasureString($label, $lFont)
$vg.FillRectangle($lBg, 4, 4, $lsz.Width + 4, $lsz.Height + 2)
$vg.DrawString($label, $lFont, $lFg, 6, 4)
$lFont.Dispose(); $lBg.Dispose(); $lFg.Dispose(); $vg.Dispose()
$vPath = [System.IO.Path]::Combine([System.IO.Path]::GetTempPath(), "shineai_click_verify_$(Get-Date -Format 'yyyyMMdd_HHmmss_fff').png")
$vBmp.Save($vPath, [System.Drawing.Imaging.ImageFormat]::Png)
$vBmp.Dispose()
Write-Output "clicked|$vPath"
`;
        const result = await shell.exec(script, 5000);
        if (result.exitCode !== 0) {
            throw new Error(`HID click failed: ${result.stderr}`);
        }
        const parts = result.stdout.trim().split('|');
        return parts[1] || '';
    }
    /** Cheap activation titles for a process: main window + foreground title. */
    async function readActivationTitles(processId) {
        const pid = processId != null ? sn(processId) : 0;
        const script = `
$out = @{ windowTitle = ''; foregroundTitle = '' }
try {
  if (${pid} -gt 0) {
    $p = Get-Process -Id ${pid} -ErrorAction SilentlyContinue
    if ($p) {
      try { $out.windowTitle = [string]$p.MainWindowTitle } catch {}
    }
  }
  if (-not ("FgTitleProbe" -as [type])) {
Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;
public class FgTitleProbe {
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);
  public static string Title() { var sb = new StringBuilder(512); GetWindowText(GetForegroundWindow(), sb, sb.Capacity); return sb.ToString(); }
}
"@
  }
  try { $out.foregroundTitle = [FgTitleProbe]::Title() } catch {}
} catch {}
Write-Output "__SHINEAI_ACT_JSON__$($out | ConvertTo-Json -Compress)"
`;
        const result = await shell.exec(script, 2500);
        const marker = '__SHINEAI_ACT_JSON__';
        const line = result.stdout
            .split('\n')
            .map(l => l.trim())
            .filter(Boolean)
            .reverse()
            .find(l => l.startsWith(marker));
        if (!line)
            return { windowTitle: '', foregroundTitle: '' };
        try {
            const parsed = JSON.parse(line.slice(marker.length));
            return {
                windowTitle: typeof parsed.windowTitle === 'string' ? parsed.windowTitle : '',
                foregroundTitle: typeof parsed.foregroundTitle === 'string' ? parsed.foregroundTitle : '',
            };
        }
        catch {
            return { windowTitle: '', foregroundTitle: '' };
        }
    }
    /**
     * Cheap local activation probe after HID click when window title may stay unchanged:
     * - original selection row gone from tree
     * - target name appears on a non-selection control in the same process
     */
    async function probeActivationLocalEvidence(element) {
        const processId = element.processId != null ? sn(element.processId) : 0;
        const rectX = element.rectX != null ? sn(element.rectX) : sn(element.screenX);
        const rectY = element.rectY != null ? sn(element.rectY) : sn(element.screenY);
        const rectW = element.rectW != null ? sn(element.rectW) : 0;
        const rectH = element.rectH != null ? sn(element.rectH) : 0;
        const script = `
$meta = @{
  Name = '${sp(element.name || '')}'
  ControlType = '${sp(element.controlType || '')}'
  ProcessId = ${processId}
  CenterX = ${sn(element.screenX)}
  CenterY = ${sn(element.screenY)}
  RectX = ${rectX}
  RectY = ${rectY}
  RectW = ${rectW}
  RectH = ${rectH}
}
$out = @{ elementGone = $false; targetNameOutsideSelection = $false }
try {
  $roots = @()
  if ($meta.ProcessId -gt 0) {
    try {
      $pidCond = New-Object Windows.Automation.PropertyCondition([Windows.Automation.AutomationElement]::ProcessIdProperty, [int]$meta.ProcessId)
      $pidWindows = [Windows.Automation.AutomationElement]::RootElement.FindAll([Windows.Automation.TreeScope]::Children, $pidCond)
      for ($i = 0; $i -lt $pidWindows.Count; $i++) { $roots += $pidWindows.Item($i) }
    } catch {}
  }
  if ($roots.Count -eq 0) {
    try {
      $pt = New-Object System.Windows.Point($meta.CenterX, $meta.CenterY)
      $hit = [Windows.Automation.AutomationElement]::FromPoint($pt)
      if ($hit) {
        $walker = [Windows.Automation.TreeWalker]::ControlViewWalker
        $cur = $hit
        while ($null -ne $cur -and $cur -ne [Windows.Automation.AutomationElement]::RootElement) {
          if ($cur.Current.ControlType -eq [Windows.Automation.ControlType]::Window) { $roots += $cur; break }
          $cur = $walker.GetParent($cur)
        }
      }
    } catch {}
  }
  if ($roots.Count -eq 0) { $roots = @([Windows.Automation.AutomationElement]::RootElement) }

  $targetName = [string]$meta.Name
  $wantCt = ([string]$meta.ControlType) -replace '^ControlType\\.', ''
  $foundOriginal = $false
  $outsideHit = $false
  foreach ($root in $roots) {
    try {
      $desc = $root.FindAll([Windows.Automation.TreeScope]::Descendants, [Windows.Automation.Condition]::TrueCondition)
      $limit = [Math]::Min($desc.Count, 500)
      for ($i = 0; $i -lt $limit; $i++) {
        try {
          $el = $desc.Item($i)
          $cur = $el.Current
          $nm = [string]$cur.Name
          $ct = [string]$cur.ControlType.ProgrammaticName
          $ctShort = $ct -replace '^ControlType\\.', ''
          $rect = $cur.BoundingRectangle
          if (-not $foundOriginal -and $targetName -and $nm -eq $targetName) {
            $ctOk = (-not $wantCt) -or ($ctShort -eq $wantCt) -or ($ct -eq $meta.ControlType)
            if ($ctOk -and -not $rect.IsEmpty) {
              $cx = $rect.X + ($rect.Width / 2)
              $cy = $rect.Y + ($rect.Height / 2)
              $dx = $cx - $meta.CenterX
              $dy = $cy - $meta.CenterY
              $dist = [Math]::Sqrt(($dx * $dx) + ($dy * $dy))
              $sizeOk = $true
              if ($meta.RectW -gt 0 -and $meta.RectH -gt 0) {
                $dw = [Math]::Abs($rect.Width - $meta.RectW)
                $dh = [Math]::Abs($rect.Height - $meta.RectH)
                if (($dw + $dh) -gt 80) { $sizeOk = $false }
              }
              if ($dist -le 48 -and $sizeOk) { $foundOriginal = $true }
            }
          }
          # Keep aligned with activationOutsideNameHit: exact name only (Contains hits search chrome).
          if (-not $outsideHit -and $targetName -and $nm -and ($nm.Trim() -eq $targetName.Trim())) {
            # Keep aligned with isActivationOutsideNameControl: exclude selection + query containers (Edit residual ≠ activate).
            if ($ctShort -notmatch '^(ListItem|TreeItem|TabItem|MenuItem|Edit|Document|ComboBox)$') {
              $outsideHit = $true
            }
          }
          if ($foundOriginal -and $outsideHit) { break }
        } catch {}
      }
    } catch {}
    if ($foundOriginal -and $outsideHit) { break }
  }
  # Only claim gone when we had a concrete name to re-find; empty-name rows stay unknown.
  $out.elementGone = ($targetName -and -not $foundOriginal)
  $out.targetNameOutsideSelection = $outsideHit
} catch {}
Write-Output "__SHINEAI_ACT_LOCAL_JSON__$($out | ConvertTo-Json -Compress)"
`;
        try {
            const result = await shell.exec(script, 3500);
            const marker = '__SHINEAI_ACT_LOCAL_JSON__';
            const line = result.stdout
                .split('\n')
                .map(l => l.trim())
                .filter(Boolean)
                .reverse()
                .find(l => l.startsWith(marker));
            if (!line)
                return { elementGone: false, targetNameOutsideSelection: false };
            const parsed = JSON.parse(line.slice(marker.length));
            return {
                elementGone: parsed.elementGone === true,
                targetNameOutsideSelection: parsed.targetNameOutsideSelection === true,
            };
        }
        catch {
            return { elementGone: false, targetNameOutsideSelection: false };
        }
    }
    /**
     * P0-3: ensure target HWND is foreground + visible + non-minimized.
     * Fail-fast with target_occluded / focus_failed; does not minimize ShineAI by default.
     */
    async function ensureTargetForeground(opts) {
        let findWindow;
        if (opts.handle != null) {
            findWindow = `$hwnd = [IntPtr]::new(${sn(opts.handle)})`;
        }
        else if (opts.title) {
            const escaped = sp(opts.title);
            findWindow = `
$procs = Get-Process | Where-Object { $_.MainWindowTitle -like '*${escaped}*' -and $_.MainWindowHandle -ne [IntPtr]::Zero } | Select-Object -First 1
if (-not $procs) { $hwnd = [IntPtr]::Zero } else { $hwnd = $procs.MainWindowHandle }`;
        }
        else {
            return { ok: false, reason: 'focus_failed:window_not_found', detail: 'title or handle required' };
        }
        const script = `
if (-not ("FocusProbe38" -as [type])) {
Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;
public class FocusProbe38 {
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
  [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern bool SetFocus(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern bool BringWindowToTop(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);
  [DllImport("user32.dll")] public static extern IntPtr GetWindowThreadProcessId(IntPtr hWnd, out uint pid);
  [DllImport("user32.dll")] public static extern bool AttachThreadInput(uint idAttach, uint idAttachTo, bool fAttach);
  [DllImport("kernel32.dll")] public static extern uint GetCurrentThreadId();
  [DllImport("user32.dll")] public static extern bool InvalidateRect(IntPtr hWnd, IntPtr lpRect, bool bErase);
  [DllImport("user32.dll")] public static extern bool RedrawWindow(IntPtr hWnd, IntPtr lprcUpdate, IntPtr hrgnUpdate, uint flags);
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);
  // RDW_INVALIDATE|RDW_ERASE|RDW_FRAME|RDW_ALLCHILDREN|RDW_UPDATENOW
  const uint RDW_AFTER_RESTORE = 0x0001 | 0x0004 | 0x0400 | 0x0080 | 0x0100;
  public static string TitleOf(IntPtr h) {
    var sb = new StringBuilder(512);
    GetWindowText(h, sb, sb.Capacity);
    return sb.ToString();
  }
  public static void RepaintAfterRestore(IntPtr hWnd) {
    InvalidateRect(hWnd, IntPtr.Zero, true);
    RedrawWindow(hWnd, IntPtr.Zero, IntPtr.Zero, RDW_AFTER_RESTORE);
    System.Threading.Thread.Sleep(80); // ≤120ms first-frame wait
  }
  public static bool ForceForeground(IntPtr hWnd) {
    if (hWnd == IntPtr.Zero) return false;
    // Restore minimized OR tray/hidden (visible=false, often non-iconic); never SW_SHOW(5) on already-visible.
    bool didRestore = false;
    if (IsIconic(hWnd) || !IsWindowVisible(hWnd)) { ShowWindow(hWnd, 9); didRestore = true; }
    if (didRestore) RepaintAfterRestore(hWnd);
    IntPtr fg = GetForegroundWindow();
    if (fg == hWnd) return true;
    uint fgPid; uint fgTid = (uint)GetWindowThreadProcessId(fg, out fgPid);
    uint cur = GetCurrentThreadId();
    bool attached = false;
    if (fgTid != 0 && fgTid != cur) attached = AttachThreadInput(cur, fgTid, true);
    try {
      SetForegroundWindow(hWnd);
      SetFocus(hWnd);
    } finally {
      if (attached) AttachThreadInput(cur, fgTid, false);
    }
    if (GetForegroundWindow() == hWnd) return true;
    // Foreground lock (ShineAI owns foreground): only the process with the last input event may switch.
    // Tap ALT so this process owns it, then retry. ponytail: same trick AutoHotkey uses; upgrade to SendInput if needed.
    keybd_event(0x12, 0, 0, UIntPtr.Zero);
    keybd_event(0x12, 0, 2, UIntPtr.Zero);
    SetForegroundWindow(hWnd);
    BringWindowToTop(hWnd);
    return GetForegroundWindow() == hWnd;
  }
}
"@
}
${findWindow}
$probe = @{
  targetHwnd = 0
  foregroundHwnd = 0
  visible = $false
  iconic = $false
  foregroundTitle = ''
  targetTitle = ''
  setForegroundOk = $false
}
if ($hwnd -ne [IntPtr]::Zero) {
  $probe.targetHwnd = $hwnd.ToInt64()
  $probe.iconic = [FocusProbe38]::IsIconic($hwnd)
  $probe.visible = [FocusProbe38]::IsWindowVisible($hwnd)
  $probe.targetTitle = [FocusProbe38]::TitleOf($hwnd)
  # ponytail: restore→repaint mirrors shouldRepaintAfterFocusShow('restore')
  $probe.setForegroundOk = [FocusProbe38]::ForceForeground($hwnd)
  Start-Sleep -Milliseconds 80
  $fg = [FocusProbe38]::GetForegroundWindow()
  $probe.foregroundHwnd = $fg.ToInt64()
  $probe.foregroundTitle = [FocusProbe38]::TitleOf($fg)
  $probe.visible = [FocusProbe38]::IsWindowVisible($hwnd)
  $probe.iconic = [FocusProbe38]::IsIconic($hwnd)
}
Write-Output "__SHINEAI_FOCUS_JSON__$($probe | ConvertTo-Json -Compress)"
`;
        const result = await shell.exec(script, 8000);
        const marker = '__SHINEAI_FOCUS_JSON__';
        const line = result.stdout
            .split('\n')
            .map(l => l.trim())
            .filter(Boolean)
            .reverse()
            .find(l => l.startsWith(marker));
        if (!line) {
            return { ok: false, reason: 'focus_failed:no_probe', detail: result.stderr || result.stdout || '' };
        }
        let probe;
        try {
            probe = JSON.parse(line.slice(marker.length));
        }
        catch {
            return { ok: false, reason: 'focus_failed:probe_parse', detail: line };
        }
        const classified = classifyForegroundResult({
            targetHwnd: Number(probe.targetHwnd || 0),
            foregroundHwnd: Number(probe.foregroundHwnd || 0),
            visible: probe.visible === true,
            iconic: probe.iconic === true,
            foregroundTitle: typeof probe.foregroundTitle === 'string' ? probe.foregroundTitle : '',
        });
        const detail = `target=${probe.targetTitle || ''};fg=${probe.foregroundTitle || ''};targetHwnd=${probe.targetHwnd};fgHwnd=${probe.foregroundHwnd};visible=${probe.visible};iconic=${probe.iconic}`;
        return { ok: classified.ok, reason: classified.reason, detail };
    }
    // 1c. click_element — click annotated element by number (100% precise)
    registerTool('click_element', '★ STEP 2 (BEST): Click an annotated element by its NUMBER from screenshot. This is the MOST PRECISE click method — uses exact element center coordinates, zero estimation.\n\nTake a screenshot first, then use the element number shown on the image.\nUses UIA native action first (Invoke/Toggle/Selection/ExpandCollapse/Focus), and falls back to HID click + verification screenshot if native action is not applicable or fails.', {
        type: 'object',
        properties: {
            number: { type: 'number', description: 'Element number from the annotated screenshot (e.g., 1, 2, 3...)' },
            screenshotPath: { type: 'string', description: 'Path to annotated screenshot. Default: last annotated screenshot.' },
            button: { type: 'string', enum: ['left', 'right', 'middle'], description: 'Mouse button. Default: left' },
            clickType: { type: 'string', enum: ['single', 'double'], description: 'Click type. Default: single' },
        },
        required: ['number'],
        additionalProperties: false,
    }, async (args) => {
        const elemNum = sn(args.number);
        const requestedPath = typeof args.screenshotPath === 'string' ? args.screenshotPath.trim() : '';
        let ssPath = requestedPath || lastAnnotatedPath;
        let usedLastAnnotated = false;
        if (!ssPath) {
            return { isError: true, content: [{ type: 'text', text: 'No annotated screenshot available. Take a screenshot with annotate=true first.' }] };
        }
        let meta = getScreenshotMeta(screenshotMetaMap, ssPath);
        // Last resort: requested path miss, but session lastAnnotated still has elements.
        // Prefer hydrate of the requested path; do not silently click a different image unless noted.
        if ((!meta || !meta.elements || meta.elements.length === 0) && requestedPath && lastAnnotatedPath) {
            const lastMeta = getScreenshotMeta(screenshotMetaMap, lastAnnotatedPath);
            if (lastMeta?.elements && lastMeta.elements.length > 0) {
                meta = lastMeta;
                ssPath = lastAnnotatedPath;
                usedLastAnnotated = true;
            }
        }
        if (!meta || !meta.elements || meta.elements.length === 0) {
            return { isError: true, content: [{ type: 'text', text: `No annotated elements found for: ${ssPath}. Take a new screenshot with annotate=true, then click by element number. For a text-only target (Canvas/Electron/RDP with no UIA tree), use vision_click.` }] };
        }
        const usedLastAnnotatedNote = usedLastAnnotated ? ' usedLastAnnotated=true' : '';
        const element = meta.elements.find(e => e.number === elemNum);
        if (!element) {
            const available = meta.elements.map(e => `[${e.number}] "${e.name}"`).join(', ');
            return { isError: true, content: [{ type: 'text', text: `Element #${elemNum} not found. Available: ${available}. Take a new screenshot with annotate=true if the UI changed.` }] };
        }
        let clickX = element.screenX;
        let clickY = element.screenY;
        const button = (args.button === 'right' || args.button === 'middle') ? args.button : 'left';
        const clickType = args.clickType === 'double' ? 'double' : 'single';
        lastActionableElement = element;
        const activatableItem = isActivatableSelectionItem(element);
        const beforeTitles = activatableItem
            ? await readActivationTitles(element.processId).catch(() => ({ windowTitle: '', foregroundTitle: '' }))
            : { windowTitle: '', foregroundTitle: '' };
        // Fail-fast: refuse to click when owning process window is not usable foreground.
        if (element.processId) {
            try {
                const pid = sn(element.processId);
                if (pid > 0) {
                    const focusScript = `
$p = Get-Process -Id ${pid} -ErrorAction SilentlyContinue
if (-not $p -or $p.MainWindowHandle -eq [IntPtr]::Zero) { Write-Output '__SHINEAI_FOCUS_JSON__{"targetHwnd":0,"foregroundHwnd":0,"visible":false,"iconic":false,"foregroundTitle":""}'; return }
$hwnd = $p.MainWindowHandle
if (-not ("FocusProbePid38" -as [type])) {
Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;
public class FocusProbePid38 {
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
  [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern bool InvalidateRect(IntPtr hWnd, IntPtr lpRect, bool bErase);
  [DllImport("user32.dll")] public static extern bool RedrawWindow(IntPtr hWnd, IntPtr lprcUpdate, IntPtr hrgnUpdate, uint flags);
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);
  const uint RDW_AFTER_RESTORE = 0x0001 | 0x0004 | 0x0400 | 0x0080 | 0x0100;
  public static string TitleOf(IntPtr h) { var sb = new StringBuilder(512); GetWindowText(h, sb, sb.Capacity); return sb.ToString(); }
  public static void RepaintAfterRestore(IntPtr hWnd) {
    InvalidateRect(hWnd, IntPtr.Zero, true);
    RedrawWindow(hWnd, IntPtr.Zero, IntPtr.Zero, RDW_AFTER_RESTORE);
    System.Threading.Thread.Sleep(80);
  }
}
"@
}
$didRestorePid = $false
# Restore iconic OR tray/hidden (!IsWindowVisible); do not SW_SHOW(5) already-visible windows.
if ([FocusProbePid38]::IsIconic($hwnd) -or -not [FocusProbePid38]::IsWindowVisible($hwnd)) {
  [FocusProbePid38]::ShowWindow($hwnd, 9) | Out-Null
  $didRestorePid = $true
}
if ($didRestorePid) { [FocusProbePid38]::RepaintAfterRestore($hwnd) }
[FocusProbePid38]::SetForegroundWindow($hwnd) | Out-Null
Start-Sleep -Milliseconds 40
$fg = [FocusProbePid38]::GetForegroundWindow()
$probe = @{
  targetHwnd = $hwnd.ToInt64()
  foregroundHwnd = $fg.ToInt64()
  visible = [bool]([FocusProbePid38]::IsWindowVisible($hwnd))
  iconic = [bool]([FocusProbePid38]::IsIconic($hwnd))
  foregroundTitle = [FocusProbePid38]::TitleOf($fg)
}
Write-Output "__SHINEAI_FOCUS_JSON__$($probe | ConvertTo-Json -Compress)"
`;
                    const focusOut = await shell.exec(focusScript, 4000);
                    const marker = '__SHINEAI_FOCUS_JSON__';
                    const line = focusOut.stdout.split('\n').map(l => l.trim()).filter(Boolean).reverse().find(l => l.startsWith(marker));
                    if (line) {
                        try {
                            const probe = JSON.parse(line.slice(marker.length));
                            const classified = classifyForegroundResult({
                                targetHwnd: Number(probe.targetHwnd || 0),
                                foregroundHwnd: Number(probe.foregroundHwnd || 0),
                                visible: probe.visible === true,
                                iconic: probe.iconic === true,
                                foregroundTitle: typeof probe.foregroundTitle === 'string' ? probe.foregroundTitle : '',
                            });
                            if (!classified.ok) {
                                return {
                                    isError: true,
                                    content: [{
                                            type: 'text',
                                            text: `Click aborted: ${classified.reason}. Target window is not usable foreground (refusing to click occluded/wrong surface). fgTitle=${probe.foregroundTitle || ''}`,
                                        }],
                                };
                            }
                        }
                        catch { /* ignore probe parse; continue */ }
                    }
                }
            }
            catch { /* focus probe best-effort */ }
        }
        let uiaFallbackReason = '';
        let uiaTitleDetail = '';
        // Trusted UIA / OCR_UIA element: stay on UIA→HID path; do not divert to vision first.
        if (button === 'left' && clickType === 'single' && isUiaElementCandidate(element)) {
            try {
                const uiaResult = await tryUiaAction(element, 'click');
                // Prefer GetClickablePoint for any subsequent HID fallback.
                if (typeof uiaResult.clickX === 'number' && typeof uiaResult.clickY === 'number') {
                    clickX = uiaResult.clickX;
                    clickY = uiaResult.clickY;
                }
                else if (uiaResult.screenX || uiaResult.screenY) {
                    clickX = uiaResult.screenX || clickX;
                    clickY = uiaResult.screenY || clickY;
                }
                const needFallback = shouldFallbackClickAfterUia(uiaResult, activatableItem);
                if (!needFallback && uiaResult.ok) {
                    lastActionableElement = {
                        ...element,
                        screenX: uiaResult.screenX || element.screenX,
                        screenY: uiaResult.screenY || element.screenY,
                        rectW: uiaResult.rectW || element.rectW,
                        rectH: uiaResult.rectH || element.rectH,
                    };
                    const verifyText = uiaResult.verify
                        ? ` verify=${uiaResult.verify}${uiaResult.detail ? ` (${uiaResult.detail})` : ''}`
                        : '';
                    return {
                        content: [{
                                type: 'text',
                                text: `Clicked [${elemNum}] "${element.name}" via method=${uiaResult.method} (native UIA, cursor unchanged).${verifyText}${usedLastAnnotatedNote}`,
                            }],
                    };
                }
                uiaFallbackReason = uiaResult.reason || uiaResult.verify || 'uia_action_failed';
                if (uiaResult.beforeTitle || uiaResult.afterTitle || uiaResult.foregroundTitle) {
                    uiaTitleDetail = ` beforeTitle=${uiaResult.beforeTitle || ''} afterTitle=${uiaResult.afterTitle || ''} fgTitle=${uiaResult.foregroundTitle || ''}`;
                }
            }
            catch (err) {
                uiaFallbackReason = `uia_exception:${err instanceof Error ? err.message : String(err)}`;
            }
        }
        else if (button !== 'left' || clickType !== 'single') {
            uiaFallbackReason = 'uia_not_applicable_for_non_left_single';
        }
        else {
            uiaFallbackReason = 'uia_metadata_not_available';
        }
        // Activatable selection rows: one HID short path (left-single escalates to double). Still no evidence → hard fail.
        const hidClickType = resolveHidClickTypeForActivatable({
            isActivatable: activatableItem,
            button,
            clickType,
        });
        let verifyImgPath;
        try {
            verifyImgPath = await hidClickAndVerify(clickX, clickY, button, hidClickType, `[${elemNum}] @(${clickX},${clickY})`);
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            return { isError: true, content: [{ type: 'text', text: `Click failed: ${msg}${uiaTitleDetail}` }] };
        }
        // After one HID center click on activatable selection items, re-check activation evidence. No second same-path spin.
        if (activatableItem) {
            const beforeHint = uiaTitleDetail || ` beforeTitle=${beforeTitles.windowTitle || beforeTitles.foregroundTitle || ''}`;
            let after = { windowTitle: '', foregroundTitle: '' };
            try {
                after = await readActivationTitles(element.processId);
            }
            catch { /* ignore */ }
            let localProbe = { elementGone: false, targetNameOutsideSelection: false };
            try {
                localProbe = await probeActivationLocalEvidence(element);
            }
            catch { /* ignore */ }
            const activated = activationEvidenceMatches({
                targetName: element.name || '',
                beforeTitle: beforeTitles.windowTitle || beforeTitles.foregroundTitle || '',
                afterTitle: after.windowTitle,
                foregroundTitle: after.foregroundTitle,
                elementGone: localProbe.elementGone,
                targetNameOutsideSelection: localProbe.targetNameOutsideSelection,
            });
            const hidVerify = interpretActivatableHidVerify({ activatedAfter: activated });
            if (!hidVerify.ok) {
                return {
                    isError: true,
                    content: [{
                            type: 'text',
                            text: `Click did not activate: ${hidVerify.verify} (selected≠activated). target="${element.name}" beforeTitle=${beforeTitles.windowTitle || beforeTitles.foregroundTitle || ''} afterTitle=${after.windowTitle} fgTitle=${after.foregroundTitle} elementGone=${localProbe.elementGone} outsideName=${localProbe.targetNameOutsideSelection} method=hidMouse (${button} ${hidClickType}) reason=${hidVerify.reason} uiaFallback=${uiaFallbackReason}${beforeHint}\nVerification image: ${verifyImgPath}`,
                        }],
                };
            }
            const fallbackReasonText = uiaFallbackReason ? `, uiaFallback=${uiaFallbackReason}` : '';
            return {
                content: [{
                        type: 'text',
                        text: `Clicked [${elemNum}] "${element.name}" at screen(${clickX},${clickY}) — method=hidMouse (${button} ${hidClickType}${fallbackReasonText}) verify=verified (afterTitle=${after.windowTitle};fgTitle=${after.foregroundTitle};elementGone=${localProbe.elementGone};outsideName=${localProbe.targetNameOutsideSelection})${beforeHint}${usedLastAnnotatedNote}\n\nVerification image: ${verifyImgPath}`,
                    }],
            };
        }
        const fallbackReasonText = uiaFallbackReason ? `, uiaFallback=${uiaFallbackReason}` : '';
        const verify = await loadInlineImage(verifyImgPath);
        return {
            content: [{
                    type: 'text',
                    text: `Clicked [${elemNum}] "${element.name}" at screen(${clickX},${clickY}) — method=hidMouse (${button} ${clickType}${fallbackReasonText})${uiaTitleDetail}${usedLastAnnotatedNote}\n\nVerification image: ${verifyImgPath}\nShows 300x300 region centered on click with RED crosshair. Confirm it hit the right target. ${verify.note}`,
                }, ...(verify.block ? [verify.block] : [])],
        };
    }, { title: 'Click Element', destructiveHint: true });
    // 1d. vision_click — explicit vision-grounding click (for when UIA is fully unavailable)
    registerTool('vision_click', 'Click a UI element located by visible text using OCR/vision grounding. Use this when UIA element tree is unavailable (Canvas, Electron, games, RDP). Takes a screenshot, runs OCR, matches text, then clicks the center of the matched word/phrase.\n\nRequires visible text on screen. Confidence < 0.4 will not click. Returns method=vision-fallback and confidence in result.', {
        type: 'object',
        properties: {
            text: { type: 'string', description: 'Visible text to find and click (case-insensitive, partial match supported)' },
            near: {
                type: 'object',
                description: 'Approximate screen coordinates to disambiguate multiple text matches',
                properties: {
                    x: { type: 'number' },
                    y: { type: 'number' },
                },
                required: ['x', 'y'],
                additionalProperties: false,
            },
            screenshotPath: { type: 'string', description: 'Path to an existing screenshot to use. Default: last annotated screenshot or takes a fresh one.' },
            button: { type: 'string', enum: ['left', 'right', 'middle'], description: 'Mouse button. Default: left' },
            clickType: { type: 'string', enum: ['single', 'double'], description: 'Click type. Default: single' },
        },
        required: ['text'],
        additionalProperties: false,
    }, async (args) => {
        const targetText = args.text || '';
        if (!targetText.trim()) {
            return { isError: true, content: [{ type: 'text', text: 'text parameter is required and must be non-empty.' }] };
        }
        const button = (args.button === 'right' || args.button === 'middle') ? args.button : 'left';
        const clickType = args.clickType === 'double' ? 'double' : 'single';
        // Determine screenshot to use
        let ssPath = args.screenshotPath || lastAnnotatedPath || lastScreenshotPath;
        if (!ssPath) {
            // Take a fresh screenshot
            try {
                try {
                    presenceHide();
                }
                catch { /* overlay must never fail screenshot */ }
                const freshScript = `
$outPath = [System.IO.Path]::Combine([System.IO.Path]::GetTempPath(), "shineai_vclick_ss_$(Get-Date -Format 'yyyyMMdd_HHmmss_fff').png")
$screen = [System.Windows.Forms.Screen]::PrimaryScreen
$bmp = New-Object System.Drawing.Bitmap($screen.Bounds.Width, $screen.Bounds.Height)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.CopyFromScreen(0, 0, 0, 0, (New-Object System.Drawing.Size($screen.Bounds.Width, $screen.Bounds.Height)))
$g.Dispose()
$bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Output $outPath
`;
                const ssResult = await shell.exec(freshScript, 10000);
                if (ssResult.exitCode !== 0 || !ssResult.stdout.trim()) {
                    return { isError: true, content: [{ type: 'text', text: 'vision_click: could not take a screenshot. Use screenshot() first.' }] };
                }
                ssPath = ssResult.stdout.trim();
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                return { isError: true, content: [{ type: 'text', text: `vision_click: screenshot failed: ${msg}` }] };
            }
        }
        // Capture region is required for correct OCR→screen coordinate mapping.
        // Without it we cannot reliably map matched text back to screen coordinates.
        const meta = getScreenshotMeta(screenshotMetaMap, ssPath);
        if (!meta) {
            return { isError: true, content: [{ type: 'text', text: `vision_click: no capture metadata for ${ssPath}, cannot map OCR coordinates to screen. Take a screenshot() first so its capture region is recorded, then retry.` }] };
        }
        const captureRegion = { x: meta.captureX, y: meta.captureY, w: meta.captureW, h: meta.captureH };
        const near = args.near;
        let loc;
        try {
            loc = await visionLocate({ text: targetText, near }, ssPath, captureRegion);
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            return { isError: true, content: [{ type: 'text', text: `vision_click: OCR error: ${msg}` }] };
        }
        if (!loc) {
            return { isError: true, content: [{ type: 'text', text: `vision_click: no OCR match found for text "${targetText}" in ${ssPath}` }] };
        }
        if (loc.confidence < 0.4) {
            return { isError: true, content: [{ type: 'text', text: `vision_click: match confidence ${loc.confidence.toFixed(2)} is below threshold 0.4 (matched "${loc.matchedText}" at ${loc.x},${loc.y}). Specify more specific text or use near to disambiguate.` }] };
        }
        let verifyImg;
        lastActionableElement = null;
        try {
            verifyImg = await hidClickAndVerify(loc.x, loc.y, button, clickType, `vision:"${targetText}"@(${loc.x},${loc.y})`);
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            return { isError: true, content: [{ type: 'text', text: `vision_click: HID click failed: ${msg}` }] };
        }
        const verify = await loadInlineImage(verifyImg);
        return {
            content: [{
                    type: 'text',
                    text: `vision_click: clicked "${targetText}" → matched "${loc.matchedText}" at screen(${loc.x},${loc.y}) confidence=${loc.confidence.toFixed(2)} method=vision-fallback button=${button} ${clickType}\n\nVerification image: ${verifyImg}\nShows 300x300 region centered on click with RED crosshair. Confirm it hit the right target. ${verify.note}`,
                }, ...(verify.block ? [verify.block] : [])],
        };
    }, { title: 'Vision Click', destructiveHint: true });
    // 2. get_screen_info
    registerTool('get_screen_info', 'Get physical resolution, per-monitor bounds + scale factor, and the process DPI-awareness mode.', { type: 'object', properties: {}, additionalProperties: false }, async () => {
        const script = `
$mode = try { [Win32]::DpiAwarenessMode } catch { 'unknown' }
# Per-monitor DPI helper (kept out of the hot bootstrap; defined once, then cached in-process).
if (-not ('ClawMon.Dpi' -as [type])) {
  Add-Type -Namespace ClawMon -Name Dpi -MemberDefinition @'
[StructLayout(LayoutKind.Sequential)] public struct POINT { public int X; public int Y; public POINT(int x, int y){X=x;Y=y;} }
[DllImport("user32.dll")] public static extern IntPtr MonitorFromPoint(POINT pt, uint dwFlags);
[DllImport("shcore.dll")] public static extern int GetDpiForMonitor(IntPtr hmonitor, int dpiType, out uint dpiX, out uint dpiY);
'@
}
$mons = @()
foreach ($s in [System.Windows.Forms.Screen]::AllScreens) {
  $b = $s.Bounds
  $dpiX = 96; $dpiY = 96
  try {
    $hMon = [ClawMon.Dpi]::MonitorFromPoint([ClawMon.Dpi+POINT]::new(($b.X + [int]($b.Width / 2)), ($b.Y + [int]($b.Height / 2))), 2)
    $dx = [uint32]0; $dy = [uint32]0
    if ([ClawMon.Dpi]::GetDpiForMonitor($hMon, 0, [ref]$dx, [ref]$dy) -eq 0) { $dpiX = [int]$dx; $dpiY = [int]$dy }
  } catch {}
  $mons += [ordered]@{
    Primary = $s.Primary
    X = $b.X; Y = $b.Y; Width = $b.Width; Height = $b.Height
    DpiX = $dpiX; DpiY = $dpiY; ScaleFactor = [math]::Round($dpiX / 96.0, 4)
  }
}
$prim = $mons | Where-Object { $_.Primary } | Select-Object -First 1
if (-not $prim) { $prim = $mons[0] }
[ordered]@{
  DpiAwareness = $mode
  Width = $prim.Width
  Height = $prim.Height
  DpiX = $prim.DpiX
  DpiY = $prim.DpiY
  ScaleFactor = $prim.ScaleFactor
  Monitors = $mons
} | ConvertTo-Json -Depth 4
`;
        const result = await shell.exec(script);
        if (result.exitCode !== 0) {
            return { isError: true, content: [{ type: 'text', text: `Screen info failed: ${result.stderr}` }] };
        }
        return { content: [{ type: 'text', text: result.stdout.trim() }] };
    }, { title: 'Get Screen Info', readOnlyHint: true, destructiveHint: false, idempotentHint: true });
    // 3. mouse_click — coordinates are physical pixels (process Per-Monitor-V2 DPI aware); used as-is
    registerTool('mouse_click', '★ STEP 3: Click at exact screen coordinates. Best used AFTER zoom_screenshot.\n\n' +
        'Read the grid coordinate labels from the zoomed image, then pass those exact X,Y numbers here.\n' +
        'Returns a verification screenshot with red crosshair showing where the click landed.\n' +
        'Only click ONCE — many UI buttons toggle state (like/unlike), clicking twice cancels the action.\n' +
        'NEVER guess coordinates you have not seen in a screenshot/zoom (blind clicks land in the wrong app). When you know the target label, pass expectText.', {
        type: 'object',
        properties: {
            x: { type: 'number', description: 'X coordinate (logical pixels)' },
            y: { type: 'number', description: 'Y coordinate (logical pixels)' },
            button: { type: 'string', enum: ['left', 'right', 'middle'], description: 'Mouse button' },
            clickType: { type: 'string', enum: ['single', 'double'], description: 'Click type' },
            expectText: { type: 'string', description: 'Optional safety guard. If set, the click only fires when this text (case-insensitive substring) appears in the UIA element under the cursor or up to 3 of its ancestors. Otherwise the click is refused and the actual target is returned so you can re-locate. Use for toggle buttons (like/follow) to avoid mis-clicks.' },
        },
        required: ['x', 'y'],
        additionalProperties: false,
    }, async (args) => {
        const px = sn(args.x);
        const py = sn(args.y);
        const button = (args.button === 'right' || args.button === 'middle') ? args.button : 'left';
        const clickType = args.clickType === 'double' ? 'double' : 'single';
        const flags = getMouseClickFlags(button, clickType);
        // Pre-click UIA hit-test: always report, and gate on expectText when provided.
        const expectText = args.expectText || '';
        const hit = await hitTestUnderPoint(px, py);
        const hitTargetText = formatHitTarget(hit);
        if (expectText.trim() && !matchesExpectText([hit.name, ...hit.ancestors], expectText)) {
            return {
                isError: true,
                content: [{
                        type: 'text',
                        text: `Click refused: expectText="${expectText}" not found under cursor at screen(${px},${py}).\n${hitTargetText}\nRe-locate the target (screenshot + click_element or zoom_screenshot) and retry with correct coordinates.`,
                    }],
            };
        }
        lastActionableElement = null; // focus moves here; keyboard_type must not re-click a stale target
        try {
            presenceMark('click', px, py);
        }
        catch { /* overlay must never fail click */ }
        const script = `
${formatSendMouseCommand(px, py, flags)}
Start-Sleep -Milliseconds 100
# Capture verification region around click (clamped to virtual desktop)
${verifyCropPs(px, py, 150)}
$vBmp = New-Object System.Drawing.Bitmap($vw, $vh)
$vg = [System.Drawing.Graphics]::FromImage($vBmp)
$vg.CopyFromScreen($vx, $vy, 0, 0, (New-Object System.Drawing.Size($vw, $vh)))
$cx = $px; $cy = $py
$crossPen = New-Object System.Drawing.Pen([System.Drawing.Color]::Red, 3)
$vg.DrawLine($crossPen, ($cx - 15), $cy, ($cx + 15), $cy)
$vg.DrawLine($crossPen, $cx, ($cy - 15), $cx, ($cy + 15))
$vg.DrawEllipse($crossPen, ($cx - 10), ($cy - 10), 20, 20)
$crossPen.Dispose()
$lFont = New-Object System.Drawing.Font('Arial', 9, [System.Drawing.FontStyle]::Bold)
$lBg = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(200,0,0,0))
$lFg = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::Yellow)
$label = "Click@(${px},${py})"
$lsz = $vg.MeasureString($label, $lFont)
$vg.FillRectangle($lBg, 4, 4, $lsz.Width + 4, $lsz.Height + 2)
$vg.DrawString($label, $lFont, $lFg, 6, 4)
$lFont.Dispose(); $lBg.Dispose(); $lFg.Dispose(); $vg.Dispose()
$vPath = [System.IO.Path]::Combine([System.IO.Path]::GetTempPath(), "shineai_click_verify_$(Get-Date -Format 'yyyyMMdd_HHmmss_fff').png")
$vBmp.Save($vPath, [System.Drawing.Imaging.ImageFormat]::Png)
$vBmp.Dispose()
Write-Output "clicked|$vPath"
`;
        const result = await shell.exec(script, 8000);
        if (result.exitCode !== 0) {
            return { isError: true, content: [{ type: 'text', text: `Click failed: ${result.stderr}` }] };
        }
        const clickParts = result.stdout.trim().split('|');
        const verifyImg = clickParts[1] || '';
        const verify = await loadInlineImage(verifyImg);
        return {
            content: [{
                    type: 'text',
                    text: `Clicked ${button} at screen(${px},${py})\n${hitTargetText}\n\nVerification image: ${verifyImg}\nShows the click point with RED crosshair (crop clamped to the virtual desktop). Confirm the click hit the correct target. ${verify.note}`,
                }, ...(verify.block ? [verify.block] : [])],
        };
    }, { title: 'Mouse Click', destructiveHint: true });
    // 4. mouse_move
    registerTool('mouse_move', 'Move the mouse cursor to the specified coordinates (logical pixels).', {
        type: 'object',
        properties: {
            x: { type: 'number', description: 'X coordinate (logical pixels)' },
            y: { type: 'number', description: 'Y coordinate (logical pixels)' },
        },
        required: ['x', 'y'],
        additionalProperties: false,
    }, async (args) => {
        const px = sn(args.x);
        const py = sn(args.y);
        try {
            presenceMark('move', px, py);
        }
        catch { /* overlay must never fail move */ }
        const script = `
[Win32]::SendMove(${px}, ${py})
Write-Output "moved to ${px},${py}"
`;
        const result = await shell.exec(script, 5000);
        if (result.exitCode !== 0) {
            return { isError: true, content: [{ type: 'text', text: `Move failed: ${result.stderr}` }] };
        }
        return { content: [{ type: 'text', text: result.stdout.trim() }] };
    }, { title: 'Mouse Move', destructiveHint: false });
    // 5. mouse_scroll
    registerTool('mouse_scroll', 'Scroll the mouse wheel at the current or specified position.', {
        type: 'object',
        properties: {
            x: { type: 'number', description: 'X coordinate (optional, logical pixels)' },
            y: { type: 'number', description: 'Y coordinate (optional, logical pixels)' },
            delta: { type: 'number', description: 'Scroll amount (positive=up, negative=down)' },
        },
        required: ['delta'],
        additionalProperties: false,
    }, async (args) => {
        const delta = sn(args.delta) * 120;
        let scrollCmd = `[Win32]::SendWheelCurrent(${delta})`;
        if (args.x != null && args.y != null) {
            try {
                presenceMark('scroll', sn(args.x), sn(args.y));
            }
            catch { /* overlay must never fail scroll */ }
            scrollCmd = `[Win32]::SendWheel(${sn(args.x)}, ${sn(args.y)}, ${delta})`;
        }
        else {
            try {
                presenceMark('scroll');
            }
            catch { /* overlay must never fail scroll */ }
        }
        const script = `
${scrollCmd}
Write-Output "scrolled"
`;
        const result = await shell.exec(script, 5000);
        if (result.exitCode !== 0) {
            return { isError: true, content: [{ type: 'text', text: `Scroll failed: ${result.stderr}` }] };
        }
        return { content: [{ type: 'text', text: result.stdout.trim() }] };
    }, { title: 'Mouse Scroll', destructiveHint: false });
    // 6. keyboard_type
    registerTool('keyboard_type', 'Type text (supports Unicode). Tries UIA ValuePattern.SetValue first when a target input element is known, then falls back to SendInput KEYEVENTF_UNICODE (IME-independent, CJK-safe) into the focused control.', {
        type: 'object',
        properties: {
            text: { type: 'string', description: 'Text to type' },
            number: { type: 'number', description: 'Optional element number from annotated screenshot to target ValuePattern.SetValue.' },
            screenshotPath: { type: 'string', description: 'Optional annotated screenshot path used with number. Default: last annotated screenshot.' },
        },
        required: ['text'],
        additionalProperties: false,
    }, async (args) => {
        const text = args.text;
        let targetElement = null;
        if (args.number != null) {
            const targetNum = sn(args.number);
            const ssPath = args.screenshotPath || lastAnnotatedPath;
            if (!ssPath) {
                return { isError: true, content: [{ type: 'text', text: 'No annotated screenshot available for keyboard target. Take screenshot(annotate=true) first or click_element before typing.' }] };
            }
            const meta = getScreenshotMeta(screenshotMetaMap, ssPath);
            if (!meta?.elements || meta.elements.length === 0) {
                return { isError: true, content: [{ type: 'text', text: `No annotated elements found for: ${ssPath}` }] };
            }
            targetElement = meta.elements.find(e => e.number === targetNum) || null;
            if (!targetElement) {
                const available = meta.elements.map(e => `[${e.number}] "${e.name}"`).join(', ');
                return { isError: true, content: [{ type: 'text', text: `Element #${targetNum} not found. Available: ${available}` }] };
            }
        }
        else if (lastActionableElement) {
            targetElement = lastActionableElement;
        }
        let uiaFallbackReason = '';
        if (targetElement && isUiaElementCandidate(targetElement)) {
            try {
                const uiaResult = await tryUiaAction(targetElement, 'setValue', text);
                if (uiaResult.ok && uiaResult.verify === 'verified') {
                    lastActionableElement = {
                        ...targetElement,
                        screenX: uiaResult.screenX || targetElement.screenX,
                        screenY: uiaResult.screenY || targetElement.screenY,
                        rectW: uiaResult.rectW || targetElement.rectW,
                        rectH: uiaResult.rectH || targetElement.rectH,
                    };
                    const verifyText = uiaResult.detail ? ` verify=verified (${uiaResult.detail})` : ' verify=verified';
                    return {
                        content: [{
                                type: 'text',
                                text: `typed ${text.length} chars via method=uiaValue${targetElement ? ` on [${targetElement.number}] "${targetElement.name}"` : ''}${verifyText}`,
                            }],
                    };
                }
                uiaFallbackReason = uiaResult.reason || uiaResult.verify || 'uia_value_failed';
            }
            catch (err) {
                uiaFallbackReason = `uia_exception:${err instanceof Error ? err.message : String(err)}`;
            }
        }
        else if (targetElement) {
            uiaFallbackReason = 'uia_metadata_not_available';
        }
        else {
            uiaFallbackReason = 'uia_target_not_set';
        }
        // Fallback: focus known target via center click (cheap) + SendInput unicode (IME-proof).
        try {
            if (targetElement)
                presenceMark('type', targetElement.screenX, targetElement.screenY);
            else
                presenceMark('type');
        }
        catch { /* overlay must never fail type */ }
        const focusClick = targetElement
            ? `${formatSendMouseCommand(sn(targetElement.screenX), sn(targetElement.screenY), getMouseClickFlags('left', 'single'))}\n`
            : '';
        const script = `
${focusClick}${targetElement ? 'Start-Sleep -Milliseconds 80\n' : ''}Write-Output ([Win32]::SendUnicode('${sp(text)}'))
`;
        const result = await shell.exec(script, 3500);
        if (result.exitCode !== 0) {
            return { isError: true, content: [{ type: 'text', text: `Type failed: ${result.stderr}` }] };
        }
        if (text.length > 0 && result.stdout.trim() === '0') {
            return { isError: true, content: [{ type: 'text', text: 'Type failed: SendInput injected 0 events (target may be elevated / secure desktop).' }] };
        }
        const fallbackText = uiaFallbackReason ? ` uiaFallback=${uiaFallbackReason}` : '';
        const focusHint = targetElement ? ` focus=centerClick on [${targetElement.number}] "${targetElement.name}"` : ' focus=current';
        return {
            content: [{
                    type: 'text',
                    text: `typed ${text.length} chars via method=sendInputUnicode${fallbackText}${focusHint}`,
                }],
        };
    }, { title: 'Keyboard Type', destructiveHint: true });
    // 7. keyboard_press
    registerTool('keyboard_press', 'Press a single key (e.g., Enter, Tab, Escape, F1-F12, Delete, a-z, 0-9, etc.).', {
        type: 'object',
        properties: {
            key: { type: 'string', description: 'Key name (e.g., Enter, Tab, Escape, F1, Delete) or a single letter/digit' },
        },
        required: ['key'],
        additionalProperties: false,
    }, async (args) => {
        const key = args.key;
        const keyMap = {
            enter: '{ENTER}', tab: '{TAB}', escape: '{ESC}', esc: '{ESC}',
            backspace: '{BACKSPACE}', delete: '{DELETE}', del: '{DELETE}',
            home: '{HOME}', end: '{END}', pageup: '{PGUP}', pagedown: '{PGDN}',
            up: '{UP}', down: '{DOWN}', left: '{LEFT}', right: '{RIGHT}',
            space: ' ', insert: '{INSERT}',
            f1: '{F1}', f2: '{F2}', f3: '{F3}', f4: '{F4}', f5: '{F5}', f6: '{F6}',
            f7: '{F7}', f8: '{F8}', f9: '{F9}', f10: '{F10}', f11: '{F11}', f12: '{F12}',
            capslock: '{CAPSLOCK}', numlock: '{NUMLOCK}', scrolllock: '{SCROLLLOCK}',
            printscreen: '{PRTSC}', pause: '{BREAK}',
        };
        // Single letters/digits have no special meaning in SendKeys, pass them through as-is
        const sendKey = /^[a-z0-9]$/i.test(key) ? key : keyMap[key.toLowerCase()];
        if (!sendKey) {
            return { isError: true, content: [{ type: 'text', text: `Unknown key: ${key}` }] };
        }
        try {
            presenceMark(`key ${key}`);
        }
        catch { /* overlay must never fail key */ }
        const script = `
$wsh = New-Object -ComObject WScript.Shell
$wsh.SendKeys('${sendKey}')
Write-Output "pressed"
`;
        const result = await shell.exec(script, 5000);
        if (result.exitCode !== 0) {
            return { isError: true, content: [{ type: 'text', text: `Key press failed: ${result.stderr}` }] };
        }
        return { content: [{ type: 'text', text: `pressed ${key}` }] };
    }, { title: 'Keyboard Press', destructiveHint: true });
    // 8. keyboard_hotkey
    registerTool('keyboard_hotkey', 'Press a keyboard shortcut/hotkey combination (e.g., Ctrl+C, Alt+F4, Ctrl+Shift+S).', {
        type: 'object',
        properties: {
            keys: {
                type: 'array',
                items: { type: 'string' },
                description: 'Array of key names to press together, e.g. ["ctrl", "c"]',
            },
        },
        required: ['keys'],
        additionalProperties: false,
    }, async (args) => {
        const keys = args.keys;
        let prefix = '';
        let mainKey = '';
        const modifierMap = { ctrl: '^', control: '^', shift: '+', alt: '%' };
        const keyMap = {
            enter: '{ENTER}', tab: '{TAB}', escape: '{ESC}', esc: '{ESC}',
            delete: '{DELETE}', backspace: '{BACKSPACE}',
            f1: '{F1}', f2: '{F2}', f3: '{F3}', f4: '{F4}', f5: '{F5}', f6: '{F6}',
            f7: '{F7}', f8: '{F8}', f9: '{F9}', f10: '{F10}', f11: '{F11}', f12: '{F12}',
            up: '{UP}', down: '{DOWN}', left: '{LEFT}', right: '{RIGHT}',
            home: '{HOME}', end: '{END}', pageup: '{PGUP}', pagedown: '{PGDN}',
            space: ' ', insert: '{INSERT}',
        };
        for (const k of keys) {
            const lower = k.toLowerCase();
            if (modifierMap[lower]) {
                prefix += modifierMap[lower];
            }
            else {
                mainKey = keyMap[lower] || lower;
            }
        }
        if (mainKey.length > 1 && !mainKey.startsWith('{')) {
            return { isError: true, content: [{ type: 'text', text: `Invalid key: ${mainKey}` }] };
        }
        const combo = `${prefix}${mainKey}`;
        try {
            presenceMark(`hotkey ${keys.join('+')}`);
        }
        catch { /* overlay must never fail hotkey */ }
        const script = `
$wsh = New-Object -ComObject WScript.Shell
$wsh.SendKeys('${sp(combo)}')
Write-Output "hotkey"
`;
        const result = await shell.exec(script, 5000);
        if (result.exitCode !== 0) {
            return { isError: true, content: [{ type: 'text', text: `Hotkey failed: ${result.stderr}` }] };
        }
        return { content: [{ type: 'text', text: `hotkey ${keys.join('+')}` }] };
    }, { title: 'Keyboard Hotkey', destructiveHint: true });
    // 9. uia_find_element
    registerTool('uia_find_element', 'Advanced: Find UI elements by name/automationId/className via Windows UI Automation. Returns coordinates and state. Note: For Chrome/Electron web content, prefer screenshot + click_element instead.', {
        type: 'object',
        properties: {
            name: { type: 'string', description: 'Element name to search for' },
            automationId: { type: 'string', description: 'Automation ID to search for' },
            className: { type: 'string', description: 'Class name to search for' },
            processId: { type: 'number', description: 'Limit search to a specific process ID' },
        },
        additionalProperties: false,
    }, async (args) => {
        const conditions = [];
        const condVarNames = [];
        if (args.name) {
            conditions.push(`$nameCondition = New-Object Windows.Automation.PropertyCondition([Windows.Automation.AutomationElement]::NameProperty, '${sp(args.name)}')`);
            condVarNames.push('$nameCondition');
        }
        if (args.automationId) {
            conditions.push(`$idCondition = New-Object Windows.Automation.PropertyCondition([Windows.Automation.AutomationElement]::AutomationIdProperty, '${sp(args.automationId)}')`);
            condVarNames.push('$idCondition');
        }
        if (args.className) {
            conditions.push(`$classCondition = New-Object Windows.Automation.PropertyCondition([Windows.Automation.AutomationElement]::ClassNameProperty, '${sp(args.className)}')`);
            condVarNames.push('$classCondition');
        }
        if (conditions.length === 0) {
            return { isError: true, content: [{ type: 'text', text: 'At least one search criterion required (name, automationId, or className)' }] };
        }
        const finalCondition = condVarNames.length === 1
            ? condVarNames[0]
            : `New-Object Windows.Automation.AndCondition(${condVarNames.join(', ')})`;
        const pid = args.processId != null ? sn(args.processId) : null;
        const pidFilter = pid != null ? `if ($item.ProcessId -eq ${pid}) { $results += $item }` : '$results += $item';
        const script = `
${conditions.join('\n')}
$condition = ${finalCondition}
$root = [Windows.Automation.AutomationElement]::RootElement
$elements = $root.FindAll([Windows.Automation.TreeScope]::Descendants, $condition)
$results = @()
foreach ($el in $elements) {
  $rect = $el.Current.BoundingRectangle
  $pats = @()
  $patDummy = $null
  try { if ($el.TryGetCurrentPattern([Windows.Automation.InvokePattern]::Pattern, [ref]$patDummy)) { $pats += 'Invoke' } } catch {}
  try { if ($el.TryGetCurrentPattern([Windows.Automation.TogglePattern]::Pattern, [ref]$patDummy)) { $pats += 'Toggle' } } catch {}
  try { if ($el.TryGetCurrentPattern([Windows.Automation.SelectionItemPattern]::Pattern, [ref]$patDummy)) { $pats += 'SelectionItem' } } catch {}
  try { if ($el.TryGetCurrentPattern([Windows.Automation.ExpandCollapsePattern]::Pattern, [ref]$patDummy)) { $pats += 'ExpandCollapse' } } catch {}
  try { if ($el.TryGetCurrentPattern([Windows.Automation.ValuePattern]::Pattern, [ref]$patDummy)) { $pats += 'Value' } } catch {}
  $item = @{
    Name = $el.Current.Name
    AutomationId = $el.Current.AutomationId
    ClassName = $el.Current.ClassName
    ControlType = $el.Current.ControlType.ProgrammaticName
    ProcessId = $el.Current.ProcessId
    BoundingRectangle = @{ X = $rect.X; Y = $rect.Y; Width = $rect.Width; Height = $rect.Height }
    IsEnabled = $el.Current.IsEnabled
    IsOffscreen = $el.Current.IsOffscreen
    Patterns = @($pats)
  }
  ${pidFilter}
}
$results | ConvertTo-Json -Depth 3
`;
        const result = await shell.exec(script, 15000);
        if (result.exitCode !== 0) {
            return { isError: true, content: [{ type: 'text', text: `UIA find failed: ${result.stderr}` }] };
        }
        const ranked = rankUiaFindResults(result.stdout);
        return { content: [{ type: 'text', text: ranked }] };
    }, { title: 'UIA Find Element', readOnlyHint: true });
    // 10. uia_get_tree
    registerTool('uia_get_tree', 'Advanced: Get the full UI element tree for a window via UIA. Useful for understanding native app layout. For web apps, screenshot annotation is more reliable.', {
        type: 'object',
        properties: {
            processId: { type: 'number', description: 'Process ID to get tree for' },
            depth: { type: 'number', description: 'Max depth to traverse (default: 3, max: 10)' },
        },
        additionalProperties: false,
    }, async (args) => {
        const depth = Math.min(Math.max(sn(args.depth, 3), 1), 10);
        const pid = args.processId != null ? sn(args.processId) : null;
        const processFilter = pid != null ? `$el.Current.ProcessId -eq ${pid}` : '$true';
        const jsonDepth = depth + 5;
        const script = `
function Get-UIATree($element, $currentDepth, $maxDepth) {
  if ($currentDepth -gt $maxDepth) { return $null }
  $rect = $element.Current.BoundingRectangle
  $node = @{
    Name = $element.Current.Name
    AutomationId = $element.Current.AutomationId
    ClassName = $element.Current.ClassName
    ControlType = $element.Current.ControlType.ProgrammaticName
    ProcessId = $element.Current.ProcessId
    # Offscreen/virtual elements report Rect.Empty (X/Y = Infinity) — [int]∞ throws and kills the whole tree.
    Rect = if ($rect.IsEmpty) { 'empty' } else { "$([int]$rect.X),$([int]$rect.Y),$([int]$rect.Width),$([int]$rect.Height)" }
    Children = @()
  }
  if ($currentDepth -lt $maxDepth) {
    $children = $element.FindAll([Windows.Automation.TreeScope]::Children, [Windows.Automation.Condition]::TrueCondition)
    foreach ($child in $children) {
      $childNode = Get-UIATree $child ($currentDepth + 1) $maxDepth
      if ($childNode) { $node.Children += $childNode }
    }
  }
  return $node
}
$root = [Windows.Automation.AutomationElement]::RootElement
$windows = $root.FindAll([Windows.Automation.TreeScope]::Children, [Windows.Automation.Condition]::TrueCondition)
$trees = @()
foreach ($w in $windows) {
  $el = $w
  if (${processFilter}) {
    $trees += (Get-UIATree $w 0 ${depth})
  }
}
$trees | ConvertTo-Json -Depth ${jsonDepth}
`;
        const result = await shell.exec(script, 30000);
        if (result.exitCode !== 0) {
            return { isError: true, content: [{ type: 'text', text: `UIA tree failed: ${result.stderr}` }] };
        }
        return { content: [{ type: 'text', text: result.stdout.trim() || '[]' }] };
    }, { title: 'UIA Get Tree', readOnlyHint: true });
    // 11. window_list — uses pre-loaded Win32 class
    registerTool('window_list', 'List all visible windows with their titles, handles, and positions. A browser window title only shows its ACTIVE tab — use window_tabs to see every open tab.', { type: 'object', properties: {}, additionalProperties: false }, async () => {
        const script = `
[Win32]::ListWindows()
[Win32]::windows | ForEach-Object { $_ } | ConvertTo-Json -Depth 2
`;
        const result = await shell.exec(script, 10000);
        if (result.exitCode !== 0) {
            return { isError: true, content: [{ type: 'text', text: `Window list failed: ${result.stderr}` }] };
        }
        return { content: [{ type: 'text', text: result.stdout.trim() || '[]' }] };
    }, { title: 'Window List', readOnlyHint: true });
    // 11b. window_tabs — read the desktop browser tab strip via UIA (works on minimized windows)
    registerTool('window_tabs', 'List ALL open tabs of the user\'s EXTERNAL desktop browser windows (Chrome/Edge/other Chromium) via UI Automation — no screenshot, no CDP, works even when minimized. NOT for web browsing/search: use browser_* (ShineAI built-in browser) unless the user explicitly asks to operate their external browser.\n' +
        'Use this to find which window holds a page before acting. activate="<tab title substring>" switches that tab (UIA select, no mouse); then window_focus(handle) to bring the window up, and e.g. keyboard_hotkey ctrl+r to refresh it.', {
        type: 'object',
        properties: {
            handle: { type: 'number', description: 'Only this browser window (HWND from window_list / a previous window_tabs result)' },
            title: { type: 'string', description: 'Only browser windows whose title contains this text' },
            activate: { type: 'string', description: 'Switch to the first tab whose title contains this text (case-insensitive)' },
        },
        additionalProperties: false,
    }, async (args) => {
        const handle = args.handle != null ? sn(args.handle) : 0;
        const titleFilter = typeof args.title === 'string' ? sp(args.title) : '';
        const activate = typeof args.activate === 'string' ? sp(args.activate) : '';
        const script = `
$root = [Windows.Automation.AutomationElement]::RootElement
if (${handle} -ne 0) {
  $wins = @([Windows.Automation.AutomationElement]::FromHandle([IntPtr]::new(${handle})))
} else {
  $wins = @($root.FindAll([Windows.Automation.TreeScope]::Children, [Windows.Automation.Condition]::TrueCondition) | Where-Object { $_.Current.ClassName -eq 'Chrome_WidgetWin_1' })
}
# Walk the browser's own UI only: pruning Document subtrees skips web content, which is both slow
# (Electron apps are all web content) and full of in-page "tabs" that aren't browser tabs.
$walker = [Windows.Automation.TreeWalker]::ControlViewWalker
function Find-BrowserTabs($el, $depth) {
  if ($depth -gt 15) { return }
  $c = $walker.GetFirstChild($el)
  while ($c) {
    $ct = $c.Current.ControlType
    if ($ct -eq [Windows.Automation.ControlType]::TabItem) { $script:found += $c }
    elseif ($ct -ne [Windows.Automation.ControlType]::Document) { Find-BrowserTabs $c ($depth + 1) }
    $c = $walker.GetNextSibling($c)
  }
}
$out = @()
$activated = ''
$US = [char]31  # field separator: tab titles may contain '|'
foreach ($w in $wins) {
  $wTitle = $w.Current.Name
  if ('${titleFilter}' -and $wTitle.IndexOf('${titleFilter}', [StringComparison]::OrdinalIgnoreCase) -lt 0) { continue }
  $script:found = @()
  try { Find-BrowserTabs $w 0 } catch { continue }
  $list = @()
  foreach ($t in $script:found) {
    $sel = $null; $isSel = $false
    try { if ($t.TryGetCurrentPattern([Windows.Automation.SelectionItemPattern]::Pattern, [ref]$sel)) { $isSel = $sel.Current.IsSelected } } catch {}
    $name = $t.Current.Name
    if ('${activate}' -and -not $activated -and $name.IndexOf('${activate}', [StringComparison]::OrdinalIgnoreCase) -ge 0) {
      try { $sel.Select(); $isSel = $true; $activated = "selected$US$($w.Current.NativeWindowHandle)$US$name" } catch {
        try { $t.GetCurrentPattern([Windows.Automation.InvokePattern]::Pattern).Invoke(); $isSel = $true; $activated = "invoked$US$($w.Current.NativeWindowHandle)$US$name" } catch { $activated = "failed$US$($w.Current.NativeWindowHandle)$US$name$US$($_.Exception.Message)" }
      }
    }
    $list += [pscustomobject]@{ title = $name; selected = $isSel }
  }
  if ($list.Count -gt 0) {
    $out += [pscustomobject]@{ handle = $w.Current.NativeWindowHandle; processId = $w.Current.ProcessId; windowTitle = $wTitle; tabs = $list }
  }
}
[pscustomobject]@{ activated = $activated; windows = $out } | ConvertTo-Json -Depth 5 -Compress
`;
        const result = await shell.exec(script, 20000);
        if (result.exitCode !== 0) {
            return { isError: true, content: [{ type: 'text', text: `window_tabs failed: ${result.stderr}` }] };
        }
        let parsed;
        try {
            parsed = JSON.parse(result.stdout.trim() || '{}');
        }
        catch {
            return { isError: true, content: [{ type: 'text', text: `window_tabs: unparseable output: ${result.stdout.slice(0, 500)}` }] };
        }
        // PowerShell collapses single-element arrays; Chrome hover cards append " - Memory usage - 121 MB".
        const asArray = (v) => (Array.isArray(v) ? v : v ? [v] : []);
        const cleanTitle = (s) => String(s ?? '').replace(/ - [^-]{1,24} - [\d.,]+ ?[KMG]B$/, '');
        const [status, hwnd, rawName, ...errParts] = (parsed.activated || '').split('\u001f');
        const switched = status === 'selected' || status === 'invoked';
        const activatedTitle = cleanTitle(rawName);
        const windows = asArray(parsed.windows).map(w => ({
            ...w,
            tabs: asArray(w.tabs).map((t) => {
                const title = cleanTitle(t.title);
                // Selection states were read mid-loop; after a switch only the activated tab is selected.
                return { title, selected: switched && String(w.handle) === hwnd ? title === activatedTitle : t.selected };
            }),
        }));
        const lines = [];
        if (activate) {
            lines.push(!status ? `activate: no tab matching "${args.activate}" — nothing switched.`
                : status === 'failed' ? `activate FAILED on "${activatedTitle}" (window ${hwnd}): ${errParts.join(' ')}`
                    : `activate: switched to "${activatedTitle}" in window ${hwnd} (${status}). Next: window_focus(handle=${hwnd}) if it must be in front.`);
        }
        lines.push(windows.length > 0 ? JSON.stringify(windows, null, 2) : 'No browser tab strips found (no Chromium browser window open, or filters matched nothing).');
        return { content: [{ type: 'text', text: lines.join('\n') }], ...(status === 'failed' ? { isError: true } : {}) };
    }, { title: 'Window Tabs', destructiveHint: false });
    // 12. window_focus — success = foreground + visible + non-minimized (P0-3)
    registerTool('window_focus', 'Bring a window to the foreground by title or handle. Do not use it to drive the user\'s external Chrome/Edge for web tasks — use browser_* (ShineAI built-in browser) unless the user explicitly asks. Success requires the target HWND to be foreground, visible, and not minimized. Returns target_occluded / focus_failed instead of claiming success from SetForeground alone.', {
        type: 'object',
        properties: {
            title: { type: 'string', description: 'Window title (partial match)' },
            handle: { type: 'number', description: 'Window handle (HWND)' },
        },
        additionalProperties: false,
    }, async (args) => {
        if (!args.title && !args.handle) {
            return { isError: true, content: [{ type: 'text', text: 'Provide either title or handle' }] };
        }
        lastActionableElement = null;
        const focusResult = await ensureTargetForeground({
            title: typeof args.title === 'string' ? args.title : undefined,
            handle: args.handle != null ? sn(args.handle) : undefined,
        });
        if (!focusResult.ok) {
            return {
                isError: true,
                content: [{
                        type: 'text',
                        text: `Focus failed: ${focusResult.reason}. ${focusResult.detail}`,
                    }],
            };
        }
        return {
            content: [{
                    type: 'text',
                    text: `focused window (${focusResult.detail})`,
                }],
        };
    }, { title: 'Window Focus', destructiveHint: false });
    // 13. window_close
    registerTool('window_close', 'Close a window by title or handle.', {
        type: 'object',
        properties: {
            title: { type: 'string', description: 'Window title (partial match)' },
            handle: { type: 'number', description: 'Window handle (HWND)' },
        },
        additionalProperties: false,
    }, async (args) => {
        if (!args.title && !args.handle) {
            return { isError: true, content: [{ type: 'text', text: 'Provide either title or handle' }] };
        }
        let script;
        if (args.handle) {
            const h = sn(args.handle);
            script = `
[Win32]::SendMessage([IntPtr]::new(${h}), 0x0010, [IntPtr]::Zero, [IntPtr]::Zero)
Write-Output "closed window"
`;
        }
        else {
            const escaped = sp(args.title);
            script = `
$procs = Get-Process | Where-Object { $_.MainWindowTitle -like '*${escaped}*' -and $_.MainWindowHandle -ne [IntPtr]::Zero }
if (-not $procs) { Write-Error 'Window not found'; exit 1 }
foreach ($p in $procs) { $p.CloseMainWindow() | Out-Null }
Write-Output "closed window(s)"
`;
        }
        const result = await shell.exec(script);
        if (result.exitCode !== 0) {
            return { isError: true, content: [{ type: 'text', text: `Close failed: ${result.stderr}` }] };
        }
        return { content: [{ type: 'text', text: result.stdout.trim() }] };
    }, { title: 'Window Close', destructiveHint: true });
    // 14. zoom_screenshot — native-resolution region capture for precise element identification
    registerTool('zoom_screenshot', '★ STEP 2 (after screenshot): Zoom into a region at NATIVE resolution with COORDINATE GRID.\n\n' +
        'HOW TO USE:\n' +
        '1. From the full screenshot, identify the AREA where your target is\n' +
        '2. Call zoom_screenshot(x, y, width, height) on that area — use generous size (200-400px) to ensure target is captured\n' +
        '3. Look at the zoomed image (attached to the result) — the GRID LABELS show absolute screen coordinates\n' +
        '4. Find your target element, read the nearest grid label numbers for its center X,Y\n' +
        '5. Call mouse_click(x, y) with those EXACT coordinates — ONE shot, do NOT repeat\n\n' +
        'GRID LABELS = absolute screen coordinates. Pass them directly to mouse_click. No math or estimation needed.\n' +
        'Also auto-detects elements via UIA + OCR. If numbered elements appear, use click_element(number) instead.\n' +
        'Just checking a result (e.g. what got typed into an input box)? Pass annotate:false — skips UIA/OCR, much faster.', {
        type: 'object',
        properties: {
            x: { type: 'number', description: 'Left X coordinate of zoom region (screen pixels)' },
            y: { type: 'number', description: 'Top Y coordinate of zoom region (screen pixels)' },
            width: { type: 'number', description: 'Width of zoom region. Default: 400' },
            height: { type: 'number', description: 'Height of zoom region. Default: 400' },
            scale: { type: 'number', description: 'Upscale factor for tiny regions (2 = 2x zoom). Default: 1 (native). Max: 4' },
            grid: { type: 'boolean', description: 'Overlay coordinate grid with absolute screen coordinates. Default: true' },
            annotate: { type: 'boolean', description: 'Auto-detect elements via UIA + OCR. Default: true. Set false for pure visual verification.' },
            includeImage: { type: 'boolean', description: 'Attach the image to the tool result. Default: true. Set false only if your model cannot accept images.' },
        },
        required: ['x', 'y'],
        additionalProperties: false,
    }, async (args) => {
        const zx = sn(args.x);
        const zy = sn(args.y);
        const zw = args.width != null ? sn(args.width) : 400;
        const zh = args.height != null ? sn(args.height) : 400;
        const scale = args.scale != null ? Math.max(1, Math.min(4, sn(args.scale))) : 1;
        const grid = args.grid !== false; // default ON
        const annotate = args.annotate !== false;
        try {
            presenceHide();
        }
        catch { /* overlay must never fail screenshot */ }
        const script = `
$zx = ${zx}; $zy = ${zy}; $zw = ${zw}; $zh = ${zh}; $scale = ${scale}
$outFile = [System.IO.Path]::Combine([System.IO.Path]::GetTempPath(), "shineai_zoom_$(Get-Date -Format 'yyyyMMdd_HHmmss_fff').png")

# Capture at native resolution
$bmp = New-Object System.Drawing.Bitmap($zw, $zh)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.CopyFromScreen($zx, $zy, 0, 0, (New-Object System.Drawing.Size($zw, $zh)))
$g.Dispose()

# Optional upscale for tiny regions
if ($scale -gt 1) {
    $newW = [int]($zw * $scale)
    $newH = [int]($zh * $scale)
    $scaled = New-Object System.Drawing.Bitmap($newW, $newH)
    $gs = [System.Drawing.Graphics]::FromImage($scaled)
    $gs.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
    $gs.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
    $gs.DrawImage($bmp, 0, 0, $newW, $newH)
    $gs.Dispose()
    $bmp.Dispose()
    $bmp = $scaled
}

# Final safety cap: keep output within model vision limits (long edge / total pixels) so the
# API does not re-compress it and blur the grid. Same math as computeAutoScale().
$maxLongEdge = ${AUTO_SCALE_MAX_LONG_EDGE}
$maxPixels = ${AUTO_SCALE_MAX_PIXELS}
if ($bmp.Width -gt 0 -and $bmp.Height -gt 0) {
    $longEdge = [Math]::Max($bmp.Width, $bmp.Height)
    $capF = [Math]::Min(1.0, [Math]::Min($maxLongEdge / $longEdge, [Math]::Sqrt($maxPixels / ([double]$bmp.Width * $bmp.Height))))
    if ($capF -lt 1.0) {
        $capW = [Math]::Max(1, [int][Math]::Round($bmp.Width * $capF))
        $capH = [Math]::Max(1, [int][Math]::Round($bmp.Height * $capF))
        $capped = New-Object System.Drawing.Bitmap($capW, $capH)
        $gc = [System.Drawing.Graphics]::FromImage($capped)
        $gc.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $gc.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
        $gc.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $gc.DrawImage($bmp, 0, 0, $capW, $capH)
        $gc.Dispose(); $bmp.Dispose(); $bmp = $capped
    }
}

# OCR must read the clean capture, otherwise the grid labels come back as OCR text
$rawFile = ''
if (${grid && annotate ? '$true' : '$false'}) {
    $rawFile = $outFile -replace '\\.png$', '_raw.png'
    $bmp.Save($rawFile, [System.Drawing.Imaging.ImageFormat]::Png)
}

# Draw fine coordinate grid with ABSOLUTE screen coordinates
if (${grid ? '$true' : '$false'}) {
    $gd = [System.Drawing.Graphics]::FromImage($bmp)
    $gd.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $scaleRatio = $bmp.Width / $zw
    # Adaptive grid step based on region size
    $step = 50
    if ($zw -le 300 -or $zh -le 300) { $step = 25 }
    if ($zw -le 150 -or $zh -le 150) { $step = 10 }
    if ($zw -gt 600) { $step = 100 }
    $gridPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(80, 0, 200, 255), 1)
    $majorPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(120, 0, 150, 255), 1)
    $fontSize = 9
    if ($step -le 25) { $fontSize = 8 }
    if ($step -le 10) { $fontSize = 7 }
    $font = New-Object System.Drawing.Font('Arial', $fontSize, [System.Drawing.FontStyle]::Bold)
    $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(230, 0, 100, 230))
    $bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(200, 255, 255, 255))
    # Vertical lines (X coordinates)
    $startX = [int]([Math]::Ceiling($zx / $step) * $step)
    for ($absX = $startX; $absX -lt ($zx + $zw); $absX += $step) {
        $relX = $absX - $zx
        $px = [int]($relX * $scaleRatio)
        $pen = if (($absX % ($step * 2)) -eq 0) { $majorPen } else { $gridPen }
        $gd.DrawLine($pen, $px, 0, $px, $bmp.Height)
        $lbl = "$absX"
        $sz = $gd.MeasureString($lbl, $font)
        $gd.FillRectangle($bgBrush, ($px + 1), 1, $sz.Width, $sz.Height)
        $gd.DrawString($lbl, $font, $brush, ($px + 1), 1)
    }
    # Horizontal lines (Y coordinates)
    $startY = [int]([Math]::Ceiling($zy / $step) * $step)
    for ($absY = $startY; $absY -lt ($zy + $zh); $absY += $step) {
        $relY = $absY - $zy
        $py = [int]($relY * $scaleRatio)
        $pen = if (($absY % ($step * 2)) -eq 0) { $majorPen } else { $gridPen }
        $gd.DrawLine($pen, 0, $py, $bmp.Width, $py)
        $lbl = "$absY"
        $sz = $gd.MeasureString($lbl, $font)
        $gd.FillRectangle($bgBrush, 1, ($py + 1), $sz.Width, $sz.Height)
        $gd.DrawString($lbl, $font, $brush, 1, ($py + 1))
    }
    # Origin marker
    $originLbl = "($zx,$zy)"
    $osz = $gd.MeasureString($originLbl, $font)
    $gd.FillRectangle($bgBrush, 0, 0, $osz.Width + 4, $osz.Height + 2)
    $gd.DrawString($originLbl, $font, $brush, 2, 1)
    $gridPen.Dispose(); $majorPen.Dispose(); $font.Dispose(); $brush.Dispose(); $bgBrush.Dispose(); $gd.Dispose()
}

$bmp.Save($outFile, [System.Drawing.Imaging.ImageFormat]::Png)
$imgW = $bmp.Width; $imgH = $bmp.Height
$bmp.Dispose()
Write-Output "$outFile|$imgW|$imgH|$rawFile"
`;
        const captureResult = await shell.exec(script, 10000);
        if (captureResult.exitCode !== 0) {
            return { isError: true, content: [{ type: 'text', text: `Zoom capture failed: ${captureResult.stderr}` }] };
        }
        const capParts = captureResult.stdout.trim().split('|');
        const filePath = capParts[0];
        const imageW = parseInt(capParts[1] || '0', 10);
        const imageH = parseInt(capParts[2] || '0', 10);
        const ocrSourcePath = capParts[3] || filePath;
        // Store metadata for screenshot_click
        const meta = {
            captureX: zx, captureY: zy,
            captureW: zw, captureH: zh,
            imageW, imageH,
        };
        setScreenshotMeta(screenshotMetaMap, filePath, meta);
        lastScreenshotPath = filePath;
        let elementListText = '';
        if (annotate) {
            try {
                const annotateScript = `
$captureX = ${zx}; $captureY = ${zy}; $captureW = ${zw}; $captureH = ${zh}
$imgPath = '${sp(filePath.replace(/\\/g, '\\\\'))}'
$ocrSrcPath = '${sp(ocrSourcePath.replace(/\\/g, '\\\\'))}'

# Force Chrome accessibility if needed
try {
    $centerPt = New-Object System.Windows.Point(($captureX + $captureW/2), ($captureY + $captureH/2))
    $targetEl = [Windows.Automation.AutomationElement]::FromPoint($centerPt)
    $window = $null
    $walker = [Windows.Automation.TreeWalker]::ControlViewWalker
    $cur = $targetEl
    while ($cur -ne $null -and $cur -ne [Windows.Automation.AutomationElement]::RootElement) {
        if ($cur.Current.ControlType -eq [Windows.Automation.ControlType]::Window) { $window = $cur; break }
        $cur = $walker.GetParent($cur)
    }
    if (-not $window) { $window = [Windows.Automation.AutomationElement]::RootElement }
    $winClass = $window.Current.ClassName
    if ($winClass -match 'Chrome_WidgetWin|Electron') {
        $wh = $window.Current.NativeWindowHandle
        if ($wh -ne 0) {
            $found = [Win32]::FindChromeRenderWidget([IntPtr]::new($wh))
            if ($found) { [Win32]::ForceAccessibility([Win32]::chromeRenderHwnd); Start-Sleep -Milliseconds 150 }
        }
    }
} catch {}

# UIA detection
$filtered = @()
$uiaActionable = @()
$idx = 1
try {
    if (-not $window) { $window = [Windows.Automation.AutomationElement]::RootElement }
    # Offscreen elements are skipped below anyway; filtering provider-side keeps long Chrome pages from blowing the 45s exec timeout.
    $onScreenCond = New-Object Windows.Automation.PropertyCondition([Windows.Automation.AutomationElement]::IsOffscreenProperty, $false)
    $allEls = $window.FindAll([Windows.Automation.TreeScope]::Descendants, $onScreenCond)
    $uiaSw = [System.Diagnostics.Stopwatch]::StartNew()
    foreach ($el in $allEls) {
        if ($uiaSw.ElapsedMilliseconds -gt 15000) { Write-Output "UIA_ERROR:element scan exceeded 15s budget, partial results"; break }
        $rect = $el.Current.BoundingRectangle
        if ($rect.IsEmpty -or $rect.Width -le 2 -or $rect.Height -le 2) { continue }
        if ($rect.Width -gt $captureW -or $rect.Height -gt $captureH) { continue }
        $elCx = [int]($rect.X + $rect.Width / 2)
        $elCy = [int]($rect.Y + $rect.Height / 2)
        if ($elCx -lt $captureX -or $elCx -ge ($captureX + $captureW)) { continue }
        if ($elCy -lt $captureY -or $elCy -ge ($captureY + $captureH)) { continue }
        $isOffscreen = $false
        try { $isOffscreen = [bool]$el.Current.IsOffscreen } catch {}
        if ($isOffscreen) { continue }
        $isEnabled = $true
        try { $isEnabled = [bool]$el.Current.IsEnabled } catch {}
        $name = $el.Current.Name
        $aid = $el.Current.AutomationId
        $ct = $el.Current.ControlType.ProgrammaticName
        $pats = @()
        $patDummy = $null
        try { if ($el.TryGetCurrentPattern([Windows.Automation.InvokePattern]::Pattern, [ref]$patDummy)) { $pats += 'Invoke' } } catch {}
        try { if ($el.TryGetCurrentPattern([Windows.Automation.TogglePattern]::Pattern, [ref]$patDummy)) { $pats += 'Toggle' } } catch {}
        try { if ($el.TryGetCurrentPattern([Windows.Automation.SelectionItemPattern]::Pattern, [ref]$patDummy)) { $pats += 'SelectionItem' } } catch {}
        try { if ($el.TryGetCurrentPattern([Windows.Automation.ExpandCollapsePattern]::Pattern, [ref]$patDummy)) { $pats += 'ExpandCollapse' } } catch {}
        try { if ($el.TryGetCurrentPattern([Windows.Automation.ValuePattern]::Pattern, [ref]$patDummy)) { $pats += 'Value' } } catch {}
        $patStr = ($pats -join ';')
        if ($pats.Count -gt 0) {
            $uiaActionable += @{X=[int]$rect.X; Y=[int]$rect.Y; W=[int]$rect.Width; H=[int]$rect.Height; CX=$elCx; CY=$elCy; CT=$ct; PAT=$patStr; EN=$isEnabled}
        }
        $label = if ($name) { $name } elseif ($aid) { $aid } else { '' }
        $isClickable = ($ct -match 'Button|Hyperlink|MenuItem|TabItem|ListItem|CheckBox|RadioButton|ComboBox|Image')
        if (-not $label -and -not $isClickable -and $pats.Count -eq 0) { continue }
        if (-not $label -and -not $isClickable) { continue }
        if (-not $name -and -not $aid -and $ct -match 'Image' -and $pats.Count -eq 0) { continue }
        if (-not $label) { $label = $ct -replace 'ControlType\\.', '' }
        $dupKey = "$label|$([int]$rect.X)|$([int]$rect.Y)|$([int]$rect.Width)|$([int]$rect.Height)"
        $dupIdx = -1
        for ($di = 0; $di -lt $filtered.Count; $di++) {
            $prev = $filtered[$di]
            if ("$($prev.Name)|$($prev.X)|$($prev.Y)|$($prev.W)|$($prev.H)" -eq $dupKey) { $dupIdx = $di; break }
        }
        if ($dupIdx -ge 0) {
            $prevPatCount = if ($filtered[$dupIdx].PAT) { @($filtered[$dupIdx].PAT -split ';' | Where-Object { $_ }).Count } else { 0 }
            if ($pats.Count -gt $prevPatCount) {
                $filtered[$dupIdx] = @{N=$filtered[$dupIdx].N; Name=$label; CT=$ct; CX=$elCx; CY=$elCy; W=[int]$rect.Width; H=[int]$rect.Height; X=[int]$rect.X; Y=[int]$rect.Y; AID=$aid; CLS=$el.Current.ClassName; PID=$el.Current.ProcessId; Src='UIA'; EN=$isEnabled; OFF=$isOffscreen; PAT=$patStr}
            }
            continue
        }
        $filtered += @{N=$idx; Name=$label; CT=$ct; CX=$elCx; CY=$elCy; W=[int]$rect.Width; H=[int]$rect.Height; X=[int]$rect.X; Y=[int]$rect.Y; AID=$aid; CLS=$el.Current.ClassName; PID=$el.Current.ProcessId; Src='UIA'; EN=$isEnabled; OFF=$isOffscreen; PAT=$patStr}
        $idx++
        if ($idx -gt 60) { break }
    }
} catch {}

# OCR fallback: only when actionable UIA is sparse (<5 with patterns)
if ($uiaActionable.Count -lt 5) {
    try {
        $ocrWorker = '${OCR_WORKER_PS1.replace(/\\/g, '\\\\')}'.Replace('\\\\','\\')
        $ocrImgPath = $ocrSrcPath.Replace('\\\\','\\')
        $ocrOut = [System.IO.Path]::Combine([System.IO.Path]::GetTempPath(), "shineai_ocr_$(Get-Date -Format 'yyyyMMdd_HHmmss_fff').txt")
        $psi = New-Object System.Diagnostics.ProcessStartInfo
        $psi.FileName = 'powershell.exe'
        $psi.Arguments = '-NoProfile -STA -ExecutionPolicy Bypass -File "' + $ocrWorker + '" -ImgPath "' + $ocrImgPath + '" -CaptureX ' + $captureX + ' -CaptureY ' + $captureY + ' -CaptureW ' + $captureW + ' -CaptureH ' + $captureH + ' -OutFile "' + $ocrOut + '"'
        $psi.UseShellExecute = $false
        $psi.CreateNoWindow = $true
        $psi.RedirectStandardError = $true
        $proc = [System.Diagnostics.Process]::Start($psi)
        $stderrTask = $proc.StandardError.ReadToEndAsync()
        if (-not $proc.WaitForExit(8000)) { try { $proc.Kill(); $proc.WaitForExit(1000) | Out-Null } catch {} }
        $stderr = if ($stderrTask.Wait(1000)) { $stderrTask.Result } else { '' }
        if ((Test-Path $ocrOut) -and (Get-Item $ocrOut).Length -gt 0) {
            foreach ($ol in (Get-Content $ocrOut -Encoding UTF8)) {
                $parts = $ol.Split('|')
                if ($parts.Count -ge 5) {
                    $ocrW = [int]$parts[3]
                    $ocrH = [int]$parts[4]
                    $ocrCx = [int]$parts[1]
                    $ocrCy = [int]$parts[2]
                    $ocrX = $ocrCx - [int]($ocrW / 2)
                    $ocrY = $ocrCy - [int]($ocrH / 2)
                    $anchor = $null
                    $bestDist = [double]::PositiveInfinity
                    foreach ($cand in $uiaActionable) {
                        $inside = ($ocrCx -ge $cand.X -and $ocrCx -le ($cand.X + $cand.W) -and $ocrCy -ge $cand.Y -and $ocrCy -le ($cand.Y + $cand.H))
                        if ($inside) { $anchor = $cand; break }
                        $nx = [Math]::Max($cand.X, [Math]::Min($ocrCx, $cand.X + $cand.W))
                        $ny = [Math]::Max($cand.Y, [Math]::Min($ocrCy, $cand.Y + $cand.H))
                        $dist = [Math]::Sqrt(($ocrCx - $nx) * ($ocrCx - $nx) + ($ocrCy - $ny) * ($ocrCy - $ny))
                        $edge = [Math]::Min($cand.W, $cand.H)
                        $thresh = [Math]::Max(24, $edge * 0.3)
                        if ($dist -le $thresh -and $dist -lt $bestDist) { $bestDist = $dist; $anchor = $cand }
                    }
                    if ($anchor) {
                        $filtered += @{N=$idx; Name=$parts[0]; CT=$anchor.CT; CX=$anchor.CX; CY=$anchor.CY; W=$anchor.W; H=$anchor.H; X=$anchor.X; Y=$anchor.Y; AID=''; CLS=''; PID=0; Src='OCR_UIA'; EN=$anchor.EN; OFF=$false; PAT=$anchor.PAT}
                    } else {
                        $filtered += @{N=$idx; Name=$parts[0]; CT='OCR.Text'; CX=$ocrCx; CY=$ocrCy; W=$ocrW; H=$ocrH; X=$ocrX; Y=$ocrY; AID=''; CLS=''; PID=0; Src='OCR'; EN=$true; OFF=$false; PAT=''}
                    }
                    $idx++
                    if ($idx -gt 80) { break }
                }
            }
        }
        Remove-Item $ocrOut -ErrorAction SilentlyContinue
    } catch {}
}
if ($ocrSrcPath -ne $imgPath) { Remove-Item $ocrSrcPath.Replace('\\\\','\\') -ErrorAction SilentlyContinue }

# Draw annotations
if ($filtered.Count -gt 0) {
    $fileBytes = [System.IO.File]::ReadAllBytes($imgPath)
    $ms = New-Object System.IO.MemoryStream(,$fileBytes)
    $bmp = [System.Drawing.Bitmap]::new($ms)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $font = New-Object System.Drawing.Font('Arial', 10, [System.Drawing.FontStyle]::Bold)
    $labelFont = New-Object System.Drawing.Font('Arial', 8)
    $redBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(230, 230, 30, 30))
    $greenBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(230, 30, 150, 30))
    $whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $borderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(200, 255, 255, 0), 2)
    $ocrPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(200, 0, 255, 100), 2)
    $scaleX = $bmp.Width / $captureW
    $scaleY = $bmp.Height / $captureH
    foreach ($el in $filtered) {
        $imgPx = [int](($el.CX - $captureX) * $scaleX)
        $imgPy = [int](($el.CY - $captureY) * $scaleY)
        $elImgW = [Math]::Max([int]($el.W * $scaleX), 20)
        $elImgH = [Math]::Max([int]($el.H * $scaleY), 20)
        $isOcr = $el.Src -eq 'OCR'
        $pen = if ($isOcr) { $ocrPen } else { $borderPen }
        $bg = if ($isOcr) { $greenBrush } else { $redBrush }
        $g.DrawRectangle($pen, ($imgPx - $elImgW/2), ($imgPy - $elImgH/2), $elImgW, $elImgH)
        $r = 11
        $g.FillEllipse($bg, ($imgPx - $r), ($imgPy - $elImgH/2 - $r*2 - 2), ($r * 2), ($r * 2))
        $lbl = "$($el.N)"
        $sz = $g.MeasureString($lbl, $font)
        $g.DrawString($lbl, $font, $whiteBrush, ($imgPx - $sz.Width/2), ($imgPy - $elImgH/2 - $r*2 - 2 + ($r - $sz.Height/2)))
        $nameLbl = $el.Name
        if ($nameLbl.Length -gt 20) { $nameLbl = $nameLbl.Substring(0, 17) + '...' }
        $nsz = $g.MeasureString($nameLbl, $labelFont)
        $g.FillRectangle((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(180,0,0,0))), ($imgPx - $nsz.Width/2), ($imgPy + $elImgH/2 + 2), $nsz.Width, $nsz.Height)
        $g.DrawString($nameLbl, $labelFont, $whiteBrush, ($imgPx - $nsz.Width/2), ($imgPy + $elImgH/2 + 2))
    }
    $font.Dispose(); $labelFont.Dispose(); $redBrush.Dispose(); $greenBrush.Dispose()
    $whiteBrush.Dispose(); $borderPen.Dispose(); $ocrPen.Dispose(); $g.Dispose()
    $bmp.Save($imgPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose(); $ms.Dispose()
}
foreach ($el in $filtered) { Write-Output "$($el.N)|$($el.Name)|$($el.CT)|$($el.CX)|$($el.CY)|$($el.AID)|$($el.CLS)|$($el.PID)|$($el.X)|$($el.Y)|$($el.W)|$($el.H)|$($el.Src)|$($el.EN)|$($el.OFF)|$($el.PAT)" }
`;
                const annotateResult = await shell.exec(annotateScript, 45000);
                const elements = [];
                const parseNum = (v) => {
                    const n = parseInt(v ?? '', 10);
                    return Number.isFinite(n) ? n : 0;
                };
                for (const line of annotateResult.stdout.trim().split('\n')) {
                    const p = line.trim().split('|');
                    if (p.length >= 5 && p[0] && p[3] && p[4]) {
                        const number = parseNum(p[0]);
                        if (!Number.isFinite(number) || number <= 0)
                            continue;
                        const rectW = parseNum(p[10]);
                        const rectH = parseNum(p[11]);
                        elements.push({
                            number,
                            name: p[1] || '',
                            controlType: p[2] || '',
                            screenX: parseNum(p[3]),
                            screenY: parseNum(p[4]),
                            automationId: p[5] || '',
                            className: p[6] || '',
                            processId: parseNum(p[7]),
                            rectX: parseNum(p[8]),
                            rectY: parseNum(p[9]),
                            rectW,
                            rectH,
                            source: parseAnnotatedSource(p[12]),
                            isEnabled: p[13] === undefined || p[13] === '' ? undefined : p[13] === 'True',
                            isOffscreen: p[14] === 'True',
                            patterns: p[15] ? p[15].split(';').filter(Boolean) : [],
                        });
                    }
                }
                if (elements.length > 0) {
                    meta.elements = elements;
                    setScreenshotMeta(screenshotMetaMap, filePath, meta);
                    lastAnnotatedPath = filePath;
                }
                const uiaCount = elements.filter(e => e.source === 'UIA' || e.source === 'OCR_UIA').length;
                const ocrCount = elements.filter(e => e.source === 'OCR').length;
                elementListText = elements.length > 0
                    ? `\n\nDetected ${uiaCount} UI elements + ${ocrCount} OCR texts (most actionable first):\n` +
                        sortElementsForDisplay(elements).map(formatElementLine).join('\n')
                    : '';
            }
            catch (err) {
                const errMsg = err instanceof Error ? err.message : String(err);
                elementListText = `\n\nAnnotation error: ${errMsg}`;
            }
        }
        const inline = await loadInlineImage(filePath, args.includeImage !== false);
        return {
            content: [{
                    type: 'text',
                    text: [
                        `Zoom screenshot saved: ${filePath}`,
                        `Region: (${zx},${zy}) ${zw}x${zh}, image=${imageW}x${imageH}${scale > 1 ? `, scale=${scale}x` : ''}`,
                        imageW > 0 && imageW !== zw
                            ? `NOTE: image pixels ≠ screen coordinates (output resized to fit model vision limits). Rely on the GRID labels below (absolute screen coords) or click_element(number), not raw image pixels.`
                            : '',
                        grid ? `GRID: Shows absolute screen coordinates. Read the X,Y numbers from grid lines near your target, then use mouse_click(x,y) directly — ONE shot, no estimation.` : '',
                        `Use click_element(number) for annotated elements, or read grid coordinates and use mouse_click(x,y).`,
                        inline.note,
                    ].filter(Boolean).join('\n') + elementListText,
                }, ...(inline.block ? [inline.block] : [])],
        };
    }, { title: 'Zoom Screenshot', readOnlyHint: true });
    // 15. render_hud — sci-fi HUD overlay visualization (P4)
    registerTool('render_hud', 'Render a sci-fi HUD (heads-up display) overlay onto a screenshot.\n\n' +
        'Draws GDI+ glow borders, scanlines, number badges, info panels and optional pulse/flash ' +
        'highlight onto the screenshot image without modifying the real desktop.\n' +
        'Returns the new HUD image (attached to the result) and its PNG path.\n\n' +
        'Typical use: after screenshot(annotate=true), call render_hud(screenshotPath) to get a ' +
        'sci-fi-styled version. Use highlightNumber to emphasize the element you just clicked.', {
        type: 'object',
        properties: {
            screenshotPath: {
                type: 'string',
                description: 'Absolute path to the source screenshot PNG (from a previous screenshot call).',
            },
            highlightNumber: {
                type: 'number',
                description: 'Element number to highlight with glow/pulse effect. 0 = no specific highlight.',
            },
            glowColor: {
                type: 'string',
                description: 'Glow color as "R,G,B" integers. Default: "0,200,255" (cyan).',
            },
            highlightMode: {
                type: 'string',
                enum: ['glow', 'pulse', 'flash'],
                description: 'Highlight rendering style. Default: "glow".',
            },
        },
        required: ['screenshotPath'],
        additionalProperties: false,
    }, async (args) => {
        const screenshotPath = typeof args.screenshotPath === 'string' ? args.screenshotPath.trim() : '';
        if (!screenshotPath) {
            return { isError: true, content: [{ type: 'text', text: 'screenshotPath is required' }] };
        }
        if (!existsSync(screenshotPath)) {
            return { isError: true, content: [{ type: 'text', text: `File not found: ${screenshotPath}` }] };
        }
        const meta = getScreenshotMeta(screenshotMetaMap, screenshotPath);
        const elements = meta?.elements ?? [];
        const highlightNumber = args.highlightNumber != null ? sn(args.highlightNumber) : 0;
        const glowColor = typeof args.glowColor === 'string' && args.glowColor.trim()
            ? args.glowColor.trim()
            : '0,200,255';
        const highlightMode = (args.highlightMode === 'pulse' || args.highlightMode === 'flash')
            ? args.highlightMode
            : 'glow';
        try {
            const hudPath = await renderHud({
                imagePath: screenshotPath,
                elements,
                highlightNumber,
                glowColor,
                highlightMode,
            });
            const inline = await loadInlineImage(hudPath);
            return {
                content: [{
                        type: 'text',
                        text: [
                            `HUD image saved: ${hudPath}`,
                            `Elements overlaid: ${elements.length}`,
                            highlightNumber > 0 ? `Highlighted element: #${highlightNumber} (mode: ${highlightMode})` : '',
                            inline.note,
                        ].filter(Boolean).join('\n'),
                    }, ...(inline.block ? [inline.block] : [])],
            };
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            return { isError: true, content: [{ type: 'text', text: `render_hud failed: ${msg}` }] };
        }
    }, { title: 'HUD Renderer', readOnlyHint: true });
}
