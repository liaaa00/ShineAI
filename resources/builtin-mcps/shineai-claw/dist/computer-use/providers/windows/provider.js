import { shell } from '../../../helpers/PersistentShell.js';
import { PolicyEngine } from '../../../security/PolicyEngine.js';
import { WINDOWS_PROVIDER_ID, } from './types.js';
import { canUseActionInBackground, findElementsInTree, mapUiaTree } from './uia-mapper.js';
const JSON_MARKER = '__SHINEAI_WINDOWS_PROVIDER_JSON__';
const sn = PolicyEngine.sanitizeNumber.bind(PolicyEngine);
const sp = PolicyEngine.sanitizeForPowerShell.bind(PolicyEngine);
function asArray(value) {
    if (value == null)
        return [];
    return Array.isArray(value) ? value : [value];
}
function numberOrZero(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}
function stringOrEmpty(value) {
    return typeof value === 'string' ? value : value == null ? '' : String(value);
}
function psString(value) {
    return sp(value || '');
}
function psBool(value) {
    return value ? '$true' : '$false';
}
function parseMarkedJson(stdout) {
    const line = stdout
        .split(/\r?\n/)
        .map(item => item.trim())
        .filter(Boolean)
        .reverse()
        .find(item => item.startsWith(JSON_MARKER));
    if (!line) {
        throw new Error(`windows_provider_no_json:${stdout.slice(0, 500)}`);
    }
    return JSON.parse(line.slice(JSON_MARKER.length));
}
function extractProcessName(path) {
    if (!path)
        return undefined;
    const parts = path.split(/[\\/]/);
    return parts[parts.length - 1] || path;
}
function toWindowRef(raw) {
    const handle = numberOrZero(raw.Handle ?? raw.handle ?? raw.windowId);
    const processId = numberOrZero(raw.ProcessId ?? raw.processId ?? raw.pid);
    const x = numberOrZero(raw.X ?? raw.x);
    const y = numberOrZero(raw.Y ?? raw.y);
    const width = numberOrZero(raw.Width ?? raw.width);
    const height = numberOrZero(raw.Height ?? raw.height);
    return {
        platform: 'windows',
        windowId: String(handle),
        handle,
        processId,
        title: stringOrEmpty(raw.Title ?? raw.title),
        bounds: { x, y, width, height },
        isVisible: true,
    };
}
function failure(code, reason, fallbackSuggested, capability) {
    return { code, reason, fallbackSuggested, capability };
}
function selectorFromElement(element) {
    return {
        id: element.id,
        automationId: element.automationId,
        name: element.name,
        controlType: element.controlType,
        className: element.className,
        processId: element.processId,
        windowId: element.windowId,
        path: element.path,
        bounds: element.bounds,
    };
}
function normalizeDepth(depth, fallback = 4) {
    return Math.min(Math.max(Math.trunc(sn(depth, fallback)), 1), 10);
}
function normalizeMaxNodes(maxNodes, fallback = 500) {
    return Math.min(Math.max(Math.trunc(sn(maxNodes, fallback)), 1), 5000);
}
function withTreeResultCompat(nodes, warnings = []) {
    Object.defineProperty(nodes, 'nodes', { value: nodes, enumerable: false, configurable: true });
    Object.defineProperty(nodes, 'warnings', { value: warnings, enumerable: false, configurable: true });
    return nodes;
}
function hasSelectorWrapper(value) {
    return value != null && typeof value === 'object' && 'selector' in value && value.selector != null;
}
function normalizeFindElementOptions(input) {
    if (hasSelectorWrapper(input)) {
        const selector = input.selector;
        return {
            ...input,
            processId: input.processId ?? selector.processId,
            windowId: input.windowId ?? selector.windowId,
            maxDepth: input.maxDepth ?? selector.maxDepth,
        };
    }
    return {
        processId: input.processId,
        windowId: input.windowId,
        maxDepth: input.maxDepth,
        selector: input,
    };
}
function toLegacyActionMethod(method, action) {
    if (!method)
        return method;
    const normalized = method.toLowerCase();
    if (normalized.includes('valuepattern'))
        return 'uiaValue';
    if (normalized.includes('wm_settext'))
        return 'win32SetText';
    if (normalized.includes('invokepattern'))
        return 'uiaInvoke';
    if (normalized.includes('bm_click'))
        return 'win32BmClick';
    if (normalized.includes('selectionitempattern'))
        return 'uiaSelect';
    if (normalized.includes('togglepattern'))
        return 'uiaToggle';
    if (normalized.includes('expandcollapsepattern'))
        return 'uiaExpandCollapse';
    if (action === 'select' && normalized.includes('setfocus'))
        return 'uiaSelect';
    if (normalized.includes('setfocus'))
        return 'uiaFocus';
    if (normalized.includes('mouse_event'))
        return 'hidMouseEvent';
    if (action === 'select' && normalized.includes('invoke'))
        return 'uiaSelect';
    return method;
}
function actionMatrix() {
    return [
        {
            action: 'invoke',
            background: true,
            requiresForeground: false,
            primaryMechanism: 'UIA InvokePattern',
            fallbackMechanisms: ['UIA TogglePattern', 'UIA SelectionItemPattern', 'UIA ExpandCollapsePattern', 'Win32 BM_CLICK', 'HID click when explicitly allowed'],
        },
        {
            action: 'click',
            background: true,
            requiresForeground: false,
            primaryMechanism: 'UIA semantic pattern dispatch',
            fallbackMechanisms: ['Win32 BM_CLICK', 'clickFallback/HID when explicitly allowed'],
        },
        {
            action: 'clickFallback',
            background: false,
            requiresForeground: true,
            primaryMechanism: 'HID mouse_event at element bounds center',
            fallbackMechanisms: ['vision/OCR selector refresh'],
        },
        {
            action: 'setValue',
            background: true,
            requiresForeground: false,
            primaryMechanism: 'UIA ValuePattern.SetValue',
            fallbackMechanisms: ['Win32 WM_SETTEXT for HWND-backed edit controls', 'foreground SendKeys via legacy keyboard_type path'],
        },
        {
            action: 'type',
            background: true,
            requiresForeground: false,
            primaryMechanism: 'UIA ValuePattern.SetValue or Win32 WM_SETTEXT',
            fallbackMechanisms: ['foreground SendKeys when explicitly allowed'],
        },
        {
            action: 'select',
            background: true,
            requiresForeground: false,
            primaryMechanism: 'UIA SelectionItemPattern.Select',
            fallbackMechanisms: ['UIA focus', 'HID click when explicitly allowed'],
        },
        {
            action: 'focus',
            background: true,
            requiresForeground: false,
            primaryMechanism: 'UIA AutomationElement.SetFocus',
            fallbackMechanisms: ['window_focus foreground activation'],
        },
        {
            action: 'hotkey',
            background: false,
            requiresForeground: true,
            primaryMechanism: 'foreground WScript.Shell.SendKeys',
            fallbackMechanisms: [],
            unsupportedReason: 'Windows global hotkeys target foreground focus; background hotkey is intentionally not faked.',
        },
        {
            action: 'toggle',
            background: true,
            requiresForeground: false,
            primaryMechanism: 'UIA TogglePattern.Toggle',
            fallbackMechanisms: ['UIA InvokePattern', 'HID click when explicitly allowed'],
        },
        {
            action: 'expandCollapse',
            background: true,
            requiresForeground: false,
            primaryMechanism: 'UIA ExpandCollapsePattern.Expand/Collapse',
            fallbackMechanisms: ['UIA InvokePattern', 'HID click when explicitly allowed'],
        },
    ];
}
export class WindowsComputerUseProvider {
    id = WINDOWS_PROVIDER_ID;
    platform = 'windows';
    async listApps() {
        if (process.platform !== 'win32')
            return [];
        const script = `
$items = @()
Get-Process | Where-Object { $_.MainWindowHandle -ne [IntPtr]::Zero -and $_.MainWindowTitle } | ForEach-Object {
  $path = $null
  try { $path = $_.Path } catch {}
  $items += @{
    ProcessId = $_.Id
    Name = $_.ProcessName
    ExecutablePath = $path
    WindowTitle = $_.MainWindowTitle
  }
}
$json = if ($items.Count -eq 0) { '[]' } else { $items | ConvertTo-Json -Depth 4 -Compress }
Write-Output ('${JSON_MARKER}' + $json)
`;
        const result = await shell.exec(script, 10000);
        if (result.exitCode !== 0)
            throw new Error(`windows_list_apps_failed:${result.stderr}`);
        return asArray(parseMarkedJson(result.stdout)).map(item => ({
            platform: 'windows',
            processId: numberOrZero(item.ProcessId),
            name: stringOrEmpty(item.Name) || extractProcessName(stringOrEmpty(item.ExecutablePath)),
            executablePath: stringOrEmpty(item.ExecutablePath) || undefined,
            windowTitle: stringOrEmpty(item.WindowTitle) || undefined,
        }));
    }
    async listWindows() {
        if (process.platform !== 'win32')
            return [];
        const script = `
[Win32]::ListWindows()
$items = @([Win32]::windows | ForEach-Object { $_ })
$json = if ($items.Count -eq 0) { '[]' } else { $items | ConvertTo-Json -Depth 4 -Compress }
Write-Output ('${JSON_MARKER}' + $json)
`;
        const result = await shell.exec(script, 10000);
        if (result.exitCode !== 0)
            throw new Error(`windows_list_windows_failed:${result.stderr}`);
        return asArray(parseMarkedJson(result.stdout)).map(toWindowRef);
    }
    async getAppState(options = {}) {
        const apps = await this.listApps();
        const windows = await this.listWindows();
        const tree = options.includeTree ? await this.readTree(options) : undefined;
        return {
            provider: WINDOWS_PROVIDER_ID,
            platform: 'windows',
            apps,
            windows,
            tree,
            capabilityReport: this.getCapabilityReport(),
        };
    }
    async readTree(options = {}) {
        if (process.platform !== 'win32')
            return withTreeResultCompat([], ['windows_provider_unavailable']);
        const depth = normalizeDepth(options.depth ?? options.maxDepth, 4);
        const maxNodes = normalizeMaxNodes(options.maxNodes, 500);
        const processId = options.processId != null ? Math.trunc(sn(options.processId)) : 0;
        const hwnd = options.windowId != null ? Math.trunc(sn(options.windowId)) : 0;
        const jsonDepth = depth + 8;
        const script = this.buildReadTreeScript({ depth, maxNodes, processId, hwnd, jsonDepth });
        const result = await shell.exec(script, 30000);
        if (result.exitCode !== 0)
            throw new Error(`windows_read_tree_failed:${result.stderr}`);
        const rawTree = parseMarkedJson(result.stdout);
        return withTreeResultCompat(mapUiaTree(rawTree, hwnd ? String(hwnd) : undefined));
    }
    async getAppTree(options = {}) {
        return this.readTree(options);
    }
    async findElement(input) {
        const options = normalizeFindElementOptions(input);
        const tree = await this.readTree(options);
        const matches = findElementsInTree(tree, options.selector);
        return matches[0] ?? null;
    }
    async invokeElement(selectorOrElement, options = {}) {
        if ('provider' in selectorOrElement) {
            return this.executeAction({ ...options, action: 'invoke', element: selectorOrElement });
        }
        return this.executeAction({ ...options, action: 'invoke', selector: selectorOrElement });
    }
    async setValue(selectorOrElement, value, options = {}) {
        if ('provider' in selectorOrElement) {
            return this.executeAction({ ...options, action: 'setValue', element: selectorOrElement, value });
        }
        return this.executeAction({ ...options, action: 'setValue', selector: selectorOrElement, value });
    }
    async selectElement(selectorOrElement, options = {}) {
        if ('provider' in selectorOrElement) {
            return this.executeAction({ ...options, action: 'select', element: selectorOrElement });
        }
        return this.executeAction({ ...options, action: 'select', selector: selectorOrElement });
    }
    dispose() {
        shell.kill();
    }
    getCapabilities(element) {
        return this.getCapabilityReport(element);
    }
    getCapabilityReport(element) {
        const supportsWindows = process.platform === 'win32';
        return {
            provider: WINDOWS_PROVIDER_ID,
            platform: 'windows',
            available: supportsWindows,
            backgroundRead: supportsWindows && (element ? element.capabilities.backgroundRead : true),
            backgroundInvoke: supportsWindows && (element ? element.capabilities.backgroundInvoke : true),
            backgroundType: supportsWindows && (element ? element.capabilities.backgroundType : true),
            requiresForeground: element ? element.capabilities.requiresForeground : false,
            visionFallbackNeeded: element ? element.capabilities.visionFallbackNeeded : false,
            supportsUia: supportsWindows,
            supportsWin32Semantic: supportsWindows,
            supportsIAccessibleWake: supportsWindows,
            supportsHidFallback: supportsWindows,
            actionMatrix: actionMatrix(),
            limitations: supportsWindows ? [
                'UIA Pattern actions are preferred and can run without moving the mouse when the target exposes Invoke/Value/Toggle/SelectionItem/ExpandCollapse.',
                'Win32 BM_CLICK and WM_SETTEXT are only used for HWND-backed controls and return unsupported when no native handle is available.',
                'foreground SendKeys, raw mouse_event and OCR/vision remain explicit fallbacks and are not reported as background-safe.',
                'Elevated or integrity-isolated applications may block UIA/Win32 messages and will return requires_foreground or capability failure.',
            ] : ['Windows provider is unavailable on non-win32 platforms.'],
            generatedAt: new Date().toISOString(),
        };
    }
    async executeAction(options) {
        if (process.platform !== 'win32') {
            return {
                ok: false,
                action: options.action,
                capabilityReport: this.getCapabilityReport(),
                failure: failure('unsupported', 'Windows provider is only available on win32.', undefined),
            };
        }
        if (options.action === 'hotkey')
            return this.executeHotkey(options);
        const element = await this.resolveElement(options);
        if (!element) {
            return {
                ok: false,
                action: options.action,
                capabilityReport: this.getCapabilityReport(),
                failure: failure('not_found', 'No UIA element matched selector.', 'vision'),
            };
        }
        const backgroundSafe = canUseActionInBackground(element, options.action);
        if (options.requireBackground && !backgroundSafe) {
            return {
                ok: false,
                action: options.action,
                element,
                capabilityReport: this.getCapabilityReport(element),
                failure: failure('requires_foreground', `Action ${options.action} is not background-safe for this element.`, element.capabilities.visionFallbackNeeded ? 'vision' : 'foreground', element.capabilities),
            };
        }
        if (!this.isActionSupported(element, options.action) && options.action !== 'clickFallback') {
            if (!(options.allowFallback && element.bounds && (options.action === 'click' || options.action === 'invoke' || options.action === 'select'))) {
                return {
                    ok: false,
                    action: options.action,
                    element,
                    capabilityReport: this.getCapabilityReport(element),
                    failure: failure('capability', `Element does not support ${options.action}.`, element.capabilities.visionFallbackNeeded ? 'vision' : 'foreground', element.capabilities),
                };
            }
        }
        const before = options.verify === false ? undefined : element;
        const raw = await this.executeElementAction(element, options);
        const method = toLegacyActionMethod(raw.method, options.action);
        if (!raw.ok) {
            const code = raw.requiresForeground ? 'requires_foreground' : raw.visionFallbackNeeded ? 'vision_fallback_needed' : raw.unsupportedReason ? 'unsupported' : 'execution_failed';
            return {
                ok: false,
                action: options.action,
                method,
                message: raw.reason || raw.unsupportedReason || 'Windows provider action failed.',
                element,
                target: element,
                capabilityReport: this.getCapabilityReport(element),
                failure: failure(code, raw.reason || raw.unsupportedReason || 'Windows provider action failed.', raw.visionFallbackNeeded ? 'vision' : raw.requiresForeground ? 'foreground' : undefined, element.capabilities),
                raw,
            };
        }
        const verification = options.verify === false
            ? { attempted: false, passed: true, method: 'disabled' }
            : await this.verifyAction(options, element, before);
        if (!verification.passed && this.mustStrictlyVerify(options.action)) {
            return {
                ok: false,
                action: options.action,
                method,
                message: verification.reason || 'Post-action UIA verification failed.',
                element,
                target: element,
                verification,
                capabilityReport: this.getCapabilityReport(element),
                failure: failure('verification_failed', verification.reason || 'Post-action UIA verification failed.', 'foreground', element.capabilities),
                raw,
            };
        }
        return {
            ok: true,
            action: options.action,
            method,
            message: options.action + ' completed via ' + (method ?? 'unknown'),
            element,
            target: element,
            verification,
            capabilityReport: this.getCapabilityReport(element),
            raw,
        };
    }
    async resolveElement(options) {
        if (options.element)
            return options.element;
        if (!options.selector)
            return null;
        return this.findElement({
            ...options.treeOptions,
            processId: options.treeOptions?.processId ?? options.selector.processId,
            windowId: options.treeOptions?.windowId ?? options.selector.windowId,
            selector: options.selector,
        });
    }
    isActionSupported(element, action) {
        if (action === 'clickFallback')
            return Boolean(element.bounds);
        if (action === 'click')
            return element.supportedActions.includes('click') || element.supportedActions.includes('invoke');
        if (action === 'type')
            return element.supportedActions.includes('type') || element.supportedActions.includes('setValue');
        return element.supportedActions.includes(action);
    }
    mustStrictlyVerify(action) {
        return action === 'setValue' || action === 'type' || action === 'select' || action === 'focus' || action === 'toggle' || action === 'expandCollapse';
    }
    async verifyAction(options, element, before) {
        if (options.action === 'invoke' || options.action === 'click' || options.action === 'clickFallback') {
            return { attempted: true, passed: true, method: 'dispatch_only', reason: 'Invoke/click may intentionally change or close UI; caller should read state again for scenario-specific assertion.', before };
        }
        try {
            const selector = options.selector ?? selectorFromElement(element);
            const after = await this.findElement({
                ...options.treeOptions,
                processId: options.treeOptions?.processId ?? element.processId,
                windowId: options.treeOptions?.windowId ?? element.windowId,
                selector,
            });
            if (!after) {
                return { attempted: true, passed: false, method: 'uia_tree_reread', reason: 'element_not_found_after_action', before };
            }
            if (options.action === 'setValue' || options.action === 'type') {
                const expected = options.value ?? options.text ?? '';
                const actual = after.value ?? after.text ?? after.name ?? '';
                return { attempted: true, passed: expected === '' || actual === expected || actual.includes(expected), method: 'uia_value_reread', reason: actual ? undefined : 'value_not_observable', expectedValue: expected, actualValue: actual, before, after };
            }
            if (options.action === 'select') {
                return { attempted: true, passed: after.isSelected === true || after.hasKeyboardFocus === true, method: 'uia_selection_reread', reason: after.isSelected || after.hasKeyboardFocus ? undefined : 'selection_state_not_confirmed', selected: after.isSelected === true || after.hasKeyboardFocus === true, before, after };
            }
            if (options.action === 'focus') {
                return { attempted: true, passed: after.hasKeyboardFocus === true, method: 'uia_focus_reread', reason: after.hasKeyboardFocus ? undefined : 'focus_state_not_confirmed', before, after };
            }
            if (options.action === 'toggle') {
                return { attempted: true, passed: before?.toggleState == null || after.toggleState == null || before.toggleState !== after.toggleState, method: 'uia_toggle_reread', reason: 'toggle_state_unchanged_or_unobservable', before, after };
            }
            if (options.action === 'expandCollapse') {
                return { attempted: true, passed: before?.expandCollapseState == null || after.expandCollapseState == null || before.expandCollapseState !== after.expandCollapseState, method: 'uia_expandcollapse_reread', reason: 'expand_collapse_state_unchanged_or_unobservable', before, after };
            }
            return { attempted: true, passed: true, method: 'uia_tree_reread', before, after };
        }
        catch (err) {
            return { attempted: true, passed: false, method: 'uia_tree_reread', reason: err instanceof Error ? err.message : String(err), before };
        }
    }
    async executeHotkey(options) {
        if (options.requireBackground) {
            return {
                ok: false,
                action: 'hotkey',
                capabilityReport: this.getCapabilityReport(),
                failure: failure('requires_foreground', 'Hotkey dispatch targets the foreground window on Windows; background hotkey is unsupported.', 'foreground'),
            };
        }
        const keys = options.keys || [];
        if (keys.length === 0) {
            return { ok: false, action: 'hotkey', failure: failure('invalid_selector', 'hotkey action requires keys[].') };
        }
        const sendKeys = this.toSendKeys(keys);
        if (!sendKeys) {
            return { ok: false, action: 'hotkey', failure: failure('unsupported', `Unsupported hotkey: ${keys.join('+')}`) };
        }
        const script = `
$wsh = New-Object -ComObject WScript.Shell
$wsh.SendKeys('${sp(sendKeys)}')
Write-Output ('${JSON_MARKER}' + (@{ ok = $true; method = 'sendKeysForeground'; action = 'hotkey' } | ConvertTo-Json -Compress))
`;
        const result = await shell.exec(script, 5000);
        if (result.exitCode !== 0) {
            return { ok: false, action: 'hotkey', failure: failure('execution_failed', result.stderr || 'hotkey failed', 'foreground') };
        }
        const raw = parseMarkedJson(result.stdout);
        return {
            ok: raw.ok === true,
            action: 'hotkey',
            method: raw.method,
            verification: { attempted: false, passed: true, method: 'foreground_sendkeys' },
            capabilityReport: this.getCapabilityReport(),
            raw,
        };
    }
    toSendKeys(keys) {
        let prefix = '';
        let mainKey = '';
        const modifierMap = { ctrl: '^', control: '^', shift: '+', alt: '%' };
        const keyMap = {
            enter: '{ENTER}', tab: '{TAB}', escape: '{ESC}', esc: '{ESC}', delete: '{DELETE}', backspace: '{BACKSPACE}',
            f1: '{F1}', f2: '{F2}', f3: '{F3}', f4: '{F4}', f5: '{F5}', f6: '{F6}', f7: '{F7}', f8: '{F8}', f9: '{F9}', f10: '{F10}', f11: '{F11}', f12: '{F12}',
            up: '{UP}', down: '{DOWN}', left: '{LEFT}', right: '{RIGHT}', home: '{HOME}', end: '{END}', pageup: '{PGUP}', pagedown: '{PGDN}', space: ' ', insert: '{INSERT}',
        };
        for (const key of keys) {
            const lower = key.toLowerCase();
            if (modifierMap[lower])
                prefix += modifierMap[lower];
            else
                mainKey = keyMap[lower] || lower;
        }
        if (!mainKey)
            return null;
        if (mainKey.length > 1 && !mainKey.startsWith('{'))
            return null;
        return `${prefix}${mainKey}`;
    }
    async executeElementAction(element, options) {
        const bounds = element.bounds;
        const centerX = bounds ? Math.trunc(bounds.x + bounds.width / 2) : 0;
        const centerY = bounds ? Math.trunc(bounds.y + bounds.height / 2) : 0;
        const text = options.value ?? options.text ?? '';
        const pathItems = element.path.map(item => `[int]${Math.trunc(item)}`).join(',');
        const allowFallback = options.allowFallback === true;
        const script = `
if (-not ('Win32Semantic' -as [type])) {
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class Win32Semantic {
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern IntPtr SendMessage(IntPtr hWnd, UInt32 Msg, IntPtr wParam, string lParam);
  [DllImport("user32.dll")] public static extern bool PostMessage(IntPtr hWnd, UInt32 Msg, IntPtr wParam, IntPtr lParam);
}
"@
}
$meta = @{
  Name = '${psString(element.name)}'
  AutomationId = '${psString(element.automationId)}'
  ClassName = '${psString(element.className)}'
  ControlType = '${psString(element.controlType)}'
  ProcessId = ${Math.trunc(sn(element.processId, 0))}
  NativeWindowHandle = ${Math.trunc(sn(element.nativeWindowHandle, 0))}
  CenterX = ${centerX}
  CenterY = ${centerY}
  RectX = ${Math.trunc(sn(bounds?.x, 0))}
  RectY = ${Math.trunc(sn(bounds?.y, 0))}
  RectW = ${Math.trunc(sn(bounds?.width, 0))}
  RectH = ${Math.trunc(sn(bounds?.height, 0))}
  Path = @(${pathItems})
}
$actionKind = '${options.action}'
$targetText = '${psString(text)}'
$allowFallback = ${psBool(allowFallback)}
$result = @{ ok = $false; method = ''; reason = ''; action = $actionKind; requiresForeground = $false; visionFallbackNeeded = $false; unsupportedReason = '' }

function Add-Candidate {
  param([Windows.Automation.AutomationElement]$el)
  if ($null -eq $el) { return }
  try {
    $cur = $el.Current
    $rect = $cur.BoundingRectangle
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
    for ($i = 0; $i -lt $limit; $i++) { Add-Candidate $found.Item($i) }
  } catch {}
}

function Try-Pattern {
  param([Windows.Automation.AutomationElement]$el, $patternId)
  $obj = $null
  if ($el -and $el.TryGetCurrentPattern($patternId, [ref]$obj)) { return $obj }
  return $null
}

function Resolve-Target {
  $roots = @()
  if ($meta.NativeWindowHandle -gt 0) {
    try {
      $hwndRoot = [Windows.Automation.AutomationElement]::FromHandle([IntPtr]::new($meta.NativeWindowHandle))
      if ($hwndRoot) { $roots += $hwndRoot; Add-Candidate $hwndRoot }
    } catch {}
  }
  if ($meta.ProcessId -gt 0) {
    try {
      $pidCond = New-Object Windows.Automation.PropertyCondition([Windows.Automation.AutomationElement]::ProcessIdProperty, [int]$meta.ProcessId)
      $pidWindows = [Windows.Automation.AutomationElement]::RootElement.FindAll([Windows.Automation.TreeScope]::Children, $pidCond)
      for ($i = 0; $i -lt $pidWindows.Count; $i++) { $roots += $pidWindows.Item($i) }
    } catch {}
  }
  if ($roots.Count -eq 0 -and $meta.CenterX -ne 0 -and $meta.CenterY -ne 0) {
    try {
      $pt = New-Object System.Windows.Point($meta.CenterX, $meta.CenterY)
      $hit = [Windows.Automation.AutomationElement]::FromPoint($pt)
      Add-Candidate $hit
      if ($hit) {
        $walker = [Windows.Automation.TreeWalker]::ControlViewWalker
        $cur = $hit
        while ($cur -ne $null -and $cur -ne [Windows.Automation.AutomationElement]::RootElement) {
          if ($cur.Current.ControlType -eq [Windows.Automation.ControlType]::Window) { $roots += $cur; break }
          $cur = $walker.GetParent($cur)
        }
      }
    } catch {}
  }
  if ($roots.Count -eq 0) { $roots = @([Windows.Automation.AutomationElement]::RootElement) }

  $hasAid = -not [string]::IsNullOrWhiteSpace($meta.AutomationId)
  $hasName = -not [string]::IsNullOrWhiteSpace($meta.Name)
  $hasClass = -not [string]::IsNullOrWhiteSpace($meta.ClassName)
  $aidCond = if ($hasAid) { New-Object Windows.Automation.PropertyCondition([Windows.Automation.AutomationElement]::AutomationIdProperty, $meta.AutomationId) } else { $null }
  $nameCond = if ($hasName) { New-Object Windows.Automation.PropertyCondition([Windows.Automation.AutomationElement]::NameProperty, $meta.Name) } else { $null }
  $classCond = if ($hasClass) { New-Object Windows.Automation.PropertyCondition([Windows.Automation.AutomationElement]::ClassNameProperty, $meta.ClassName) } else { $null }
  foreach ($root in $roots) {
    if ($hasAid) { Find-ByCondition $root $aidCond 120 }
    if ($hasName) { Find-ByCondition $root $nameCond 120 }
    if ($hasClass) { Find-ByCondition $root $classCond 80 }
  }

  $best = $null
  $bestScore = -999999.0
  foreach ($candidate in $script:candidates) {
    try {
      $cur = $candidate.Current
      if ($meta.ProcessId -gt 0 -and $cur.ProcessId -ne [int]$meta.ProcessId) { continue }
      $rect = $cur.BoundingRectangle
      $score = 0.0
      if ($hasAid -and $cur.AutomationId -eq $meta.AutomationId) { $score += 100 }
      if ($hasName -and $cur.Name -eq $meta.Name) { $score += 70 }
      if ($hasClass -and $cur.ClassName -eq $meta.ClassName) { $score += 30 }
      if ($meta.ControlType -and $cur.ControlType.ProgrammaticName -like "*$($meta.ControlType)") { $score += 25 }
      if ($meta.NativeWindowHandle -gt 0 -and $cur.NativeWindowHandle -eq [int]$meta.NativeWindowHandle) { $score += 40 }
      if ($meta.CenterX -ne 0 -and $meta.CenterY -ne 0) {
        $cx = $rect.X + ($rect.Width / 2); $cy = $rect.Y + ($rect.Height / 2)
        $dist = [Math]::Sqrt([Math]::Pow($cx - $meta.CenterX, 2) + [Math]::Pow($cy - $meta.CenterY, 2))
        $score += [Math]::Max(0, 35 - ($dist / 8))
      }
      if ($score -gt $bestScore) { $bestScore = $score; $best = $candidate }
    } catch {}
  }
  return $best
}

try {
  $script:candidates = @()
  $script:seen = @{}
  $best = Resolve-Target
  if ($null -eq $best) {
    $result.reason = 'uia_element_not_found'
  } elseif ($actionKind -eq 'setValue' -or $actionKind -eq 'type') {
    $valuePatternObj = Try-Pattern $best ([Windows.Automation.ValuePattern]::Pattern)
    if ($valuePatternObj) {
      try {
        ([Windows.Automation.ValuePattern]$valuePatternObj).SetValue($targetText)
        $result.ok = $true; $result.method = 'uiaValuePattern.SetValue'
      } catch { $result.reason = 'uia_value_set_failed:' + $_.Exception.Message }
    }
    if (-not $result.ok -and $meta.NativeWindowHandle -gt 0) {
      try {
        [void][Win32Semantic]::SendMessage([IntPtr]::new($meta.NativeWindowHandle), 0x000C, [IntPtr]::Zero, $targetText)
        $result.ok = $true; $result.method = 'win32.WM_SETTEXT'
      } catch { $result.reason = 'win32_wm_settext_failed:' + $_.Exception.Message }
    }
    if (-not $result.ok) { $result.requiresForeground = $true; if (-not $result.reason) { $result.reason = 'background_type_unavailable' } }
  } elseif ($actionKind -eq 'focus') {
    try { $best.SetFocus(); $result.ok = $true; $result.method = 'uia.SetFocus' } catch { $result.requiresForeground = $true; $result.reason = 'uia_focus_failed:' + $_.Exception.Message }
  } else {
    $tryOrder = @()
    if ($actionKind -eq 'select') { $tryOrder = @('SelectionItem','Invoke','Focus') }
    elseif ($actionKind -eq 'toggle') { $tryOrder = @('Toggle','Invoke') }
    elseif ($actionKind -eq 'expandCollapse') { $tryOrder = @('ExpandCollapse','Invoke') }
    else { $tryOrder = @('Invoke','Toggle','SelectionItem','ExpandCollapse') }

    foreach ($kind in $tryOrder) {
      if ($result.ok) { break }
      try {
        if ($kind -eq 'Invoke') {
          $p = Try-Pattern $best ([Windows.Automation.InvokePattern]::Pattern)
          if ($p) { ([Windows.Automation.InvokePattern]$p).Invoke(); $result.ok = $true; $result.method = 'uia.InvokePattern' }
        } elseif ($kind -eq 'Toggle') {
          $p = Try-Pattern $best ([Windows.Automation.TogglePattern]::Pattern)
          if ($p) { ([Windows.Automation.TogglePattern]$p).Toggle(); $result.ok = $true; $result.method = 'uia.TogglePattern' }
        } elseif ($kind -eq 'SelectionItem') {
          $p = Try-Pattern $best ([Windows.Automation.SelectionItemPattern]::Pattern)
          if ($p) { ([Windows.Automation.SelectionItemPattern]$p).Select(); $result.ok = $true; $result.method = 'uia.SelectionItemPattern' }
        } elseif ($kind -eq 'Focus') {
          try { $best.SetFocus(); $result.ok = $true; $result.method = 'uia.SetFocus' } catch { if (-not $result.reason) { $result.reason = 'uia_focus_failed:' + $_.Exception.Message } }
        } elseif ($kind -eq 'ExpandCollapse') {
          $p = Try-Pattern $best ([Windows.Automation.ExpandCollapsePattern]::Pattern)
          if ($p) {
            $ep = [Windows.Automation.ExpandCollapsePattern]$p
            $state = $ep.Current.ExpandCollapseState
            if ($state -eq [Windows.Automation.ExpandCollapseState]::Collapsed -or $state -eq [Windows.Automation.ExpandCollapseState]::PartiallyExpanded) { $ep.Expand() } else { $ep.Collapse() }
            $result.ok = $true; $result.method = 'uia.ExpandCollapsePattern'
          }
        }
      } catch { if (-not $result.reason) { $result.reason = 'uia_pattern_failed:' + $_.Exception.Message } }
    }

    if (-not $result.ok -and $meta.NativeWindowHandle -gt 0 -and ($actionKind -eq 'invoke' -or $actionKind -eq 'click')) {
      try {
        [void][Win32]::SendMessage([IntPtr]::new($meta.NativeWindowHandle), 0x00F5, [IntPtr]::Zero, [IntPtr]::Zero)
        $result.ok = $true; $result.method = 'win32.BM_CLICK'
      } catch { $result.reason = 'win32_bm_click_failed:' + $_.Exception.Message }
    }

    if (-not $result.ok -and ($actionKind -eq 'clickFallback' -or $allowFallback) -and $meta.CenterX -ne 0 -and $meta.CenterY -ne 0) {
      [Win32]::SetCursorPos($meta.CenterX, $meta.CenterY)
      Start-Sleep -Milliseconds 30
      [Win32]::mouse_event(0x0002, 0, 0, 0, [UIntPtr]::Zero)
      [Win32]::mouse_event(0x0004, 0, 0, 0, [UIntPtr]::Zero)
      $result.ok = $true; $result.method = 'hid.mouse_event'; $result.requiresForeground = $true
    }
    if (-not $result.ok) {
      $result.requiresForeground = $true
      if (-not $result.reason) { $result.reason = 'background_invoke_unavailable' }
    }
  }
} catch {
  $result.reason = 'windows_provider_unexpected:' + $_.Exception.Message
}
Write-Output ('${JSON_MARKER}' + ($result | ConvertTo-Json -Compress))
`;
        const result = await shell.exec(script, 10000);
        if (result.exitCode !== 0) {
            return { ok: false, action: options.action, reason: result.stderr || 'PowerShell action failed', method: '', requiresForeground: false };
        }
        return parseMarkedJson(result.stdout);
    }
    buildReadTreeScript(params) {
        return `
$maxDepth = ${params.depth}
$maxNodes = ${params.maxNodes}
$targetProcessId = ${params.processId}
$targetHwnd = ${params.hwnd}
$script:nodeCount = 0

function Convert-Bounds($rect) {
  if ($rect.IsEmpty) { return @{ X = 0; Y = 0; Width = 0; Height = 0 } }
  return @{ X = [int]$rect.X; Y = [int]$rect.Y; Width = [int]$rect.Width; Height = [int]$rect.Height }
}

function Add-PatternName($el, $pattern, $name, [System.Collections.ArrayList]$list) {
  try {
    $obj = $null
    if ($el.TryGetCurrentPattern($pattern, [ref]$obj)) { [void]$list.Add($name) }
  } catch {}
}

function Get-PatternNames($el) {
  $patterns = New-Object System.Collections.ArrayList
  Add-PatternName $el ([Windows.Automation.InvokePattern]::Pattern) 'Invoke' $patterns
  Add-PatternName $el ([Windows.Automation.ValuePattern]::Pattern) 'Value' $patterns
  Add-PatternName $el ([Windows.Automation.TogglePattern]::Pattern) 'Toggle' $patterns
  Add-PatternName $el ([Windows.Automation.SelectionItemPattern]::Pattern) 'SelectionItem' $patterns
  Add-PatternName $el ([Windows.Automation.ExpandCollapsePattern]::Pattern) 'ExpandCollapse' $patterns
  Add-PatternName $el ([Windows.Automation.RangeValuePattern]::Pattern) 'RangeValue' $patterns
  Add-PatternName $el ([Windows.Automation.ScrollItemPattern]::Pattern) 'ScrollItem' $patterns
  return @($patterns)
}

function Get-OptionalPatternState($el) {
  $state = @{}
  try {
    $obj = $null
    if ($el.TryGetCurrentPattern([Windows.Automation.ValuePattern]::Pattern, [ref]$obj)) {
      $vp = [Windows.Automation.ValuePattern]$obj
      $state.Value = $vp.Current.Value
      $state.IsReadOnly = $vp.Current.IsReadOnly
    }
  } catch {}
  try {
    $obj = $null
    if ($el.TryGetCurrentPattern([Windows.Automation.SelectionItemPattern]::Pattern, [ref]$obj)) {
      $sp = [Windows.Automation.SelectionItemPattern]$obj
      $state.IsSelected = $sp.Current.IsSelected
    }
  } catch {}
  try {
    $obj = $null
    if ($el.TryGetCurrentPattern([Windows.Automation.TogglePattern]::Pattern, [ref]$obj)) {
      $tp = [Windows.Automation.TogglePattern]$obj
      $state.ToggleState = $tp.Current.ToggleState.ToString()
    }
  } catch {}
  try {
    $obj = $null
    if ($el.TryGetCurrentPattern([Windows.Automation.ExpandCollapsePattern]::Pattern, [ref]$obj)) {
      $ep = [Windows.Automation.ExpandCollapsePattern]$obj
      $state.ExpandCollapseState = $ep.Current.ExpandCollapseState.ToString()
    }
  } catch {}
  return $state
}

function Wake-AccessibilityIfNeeded($root) {
  try {
    $hwnd = $root.Current.NativeWindowHandle
    $class = $root.Current.ClassName
    if ($hwnd -ne 0 -and ($class -like '*Chrome*' -or $class -like '*Electron*')) {
      if ([Win32]::FindChromeRenderWidget([IntPtr]::new($hwnd))) { [void][Win32]::ForceAccessibility([Win32]::chromeRenderHwnd) }
    }
  } catch {}
}

function Get-UIANode($element, $currentDepth, $maxDepth) {
  if ($null -eq $element -or $currentDepth -gt $maxDepth -or $script:nodeCount -ge $maxNodes) { return $null }
  $script:nodeCount++
  try {
    $cur = $element.Current
    $rect = $cur.BoundingRectangle
    $state = Get-OptionalPatternState $element
    $node = @{
      Name = $cur.Name
      AutomationId = $cur.AutomationId
      ClassName = $cur.ClassName
      FrameworkId = $cur.FrameworkId
      HelpText = $cur.HelpText
      ControlType = $cur.ControlType.ProgrammaticName
      ProcessId = $cur.ProcessId
      NativeWindowHandle = $cur.NativeWindowHandle
      BoundingRectangle = Convert-Bounds $rect
      IsEnabled = $cur.IsEnabled
      IsOffscreen = $cur.IsOffscreen
      IsKeyboardFocusable = $cur.IsKeyboardFocusable
      HasKeyboardFocus = $cur.HasKeyboardFocus
      Patterns = Get-PatternNames $element
      Source = 'uia'
      Children = @()
    }
    foreach ($key in $state.Keys) { $node[$key] = $state[$key] }
    if ($currentDepth -lt $maxDepth) {
      $children = $element.FindAll([Windows.Automation.TreeScope]::Children, [Windows.Automation.Condition]::TrueCondition)
      foreach ($child in $children) {
        $childNode = Get-UIANode $child ($currentDepth + 1) $maxDepth
        if ($null -ne $childNode) { $node.Children += $childNode }
        if ($script:nodeCount -ge $maxNodes) { break }
      }
    }
    return $node
  } catch {
    return $null
  }
}

$roots = @()
if ($targetHwnd -gt 0) {
  try {
    $root = [Windows.Automation.AutomationElement]::FromHandle([IntPtr]::new($targetHwnd))
    if ($root) { Wake-AccessibilityIfNeeded $root; $roots += $root }
  } catch {}
}
if ($roots.Count -eq 0 -and $targetProcessId -gt 0) {
  try {
    $pidCond = New-Object Windows.Automation.PropertyCondition([Windows.Automation.AutomationElement]::ProcessIdProperty, [int]$targetProcessId)
    $windows = [Windows.Automation.AutomationElement]::RootElement.FindAll([Windows.Automation.TreeScope]::Children, $pidCond)
    for ($i = 0; $i -lt $windows.Count; $i++) { Wake-AccessibilityIfNeeded $windows.Item($i); $roots += $windows.Item($i) }
  } catch {}
}
if ($roots.Count -eq 0) {
  $desktop = [Windows.Automation.AutomationElement]::RootElement
  $windows = $desktop.FindAll([Windows.Automation.TreeScope]::Children, [Windows.Automation.Condition]::TrueCondition)
  for ($i = 0; $i -lt $windows.Count; $i++) { $roots += $windows.Item($i) }
}

$trees = @()
foreach ($root in $roots) {
  $node = Get-UIANode $root 0 $maxDepth
  if ($null -ne $node) { $trees += $node }
  if ($script:nodeCount -ge $maxNodes) { break }
}
$json = if ($trees.Count -eq 0) { '[]' } else { $trees | ConvertTo-Json -Depth ${params.jsonDepth} -Compress }
Write-Output ('${JSON_MARKER}' + $json)
`;
    }
}
export const windowsComputerUseProvider = new WindowsComputerUseProvider();
