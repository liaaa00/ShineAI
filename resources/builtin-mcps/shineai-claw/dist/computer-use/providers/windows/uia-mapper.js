import { WINDOWS_PROVIDER_ID, } from './types.js';
const CONTROL_TYPE_PREFIX = 'ControlType.';
function asRecord(value) {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}
function asString(value) {
    if (typeof value === 'string')
        return value.trim() || undefined;
    if (typeof value === 'number' || typeof value === 'boolean')
        return String(value);
    return undefined;
}
function asNumber(value) {
    if (typeof value === 'number' && Number.isFinite(value))
        return value;
    if (typeof value === 'string' && value.trim()) {
        const parsed = Number(value);
        if (Number.isFinite(parsed))
            return parsed;
    }
    return undefined;
}
function asBoolean(value) {
    if (typeof value === 'boolean')
        return value;
    if (typeof value === 'string') {
        if (value.toLowerCase() === 'true')
            return true;
        if (value.toLowerCase() === 'false')
            return false;
    }
    return undefined;
}
function normalizeText(value) {
    return asString(value)?.toLowerCase() ?? '';
}
function normalizeControlType(controlType) {
    if (!controlType)
        return 'unknown';
    return controlType.startsWith(CONTROL_TYPE_PREFIX) ? controlType.slice(CONTROL_TYPE_PREFIX.length) : controlType;
}
function sanitizeIdPart(value) {
    return (value || 'element').replace(/[^a-zA-Z0-9_.:-]+/g, '_').slice(0, 80);
}
function parseBounds(value) {
    if (!value)
        return undefined;
    if (typeof value === 'string') {
        const parts = value.split(',').map(part => Number(part.trim()));
        if (parts.length === 4 && parts.every(Number.isFinite)) {
            return { x: parts[0], y: parts[1], width: parts[2], height: parts[3] };
        }
    }
    const record = asRecord(value);
    const x = asNumber(record.X ?? record.x ?? record.Left ?? record.left);
    const y = asNumber(record.Y ?? record.y ?? record.Top ?? record.top);
    const width = asNumber(record.Width ?? record.width);
    const height = asNumber(record.Height ?? record.height);
    const right = asNumber(record.Right ?? record.right);
    const bottom = asNumber(record.Bottom ?? record.bottom);
    if (x != null && y != null && width != null && height != null) {
        return { x, y, width, height };
    }
    if (x != null && y != null && right != null && bottom != null) {
        return { x, y, width: Math.max(0, right - x), height: Math.max(0, bottom - y) };
    }
    return undefined;
}
function normalizePatterns(value) {
    if (!Array.isArray(value))
        return [];
    const seen = new Set();
    const patterns = [];
    for (const item of value) {
        const pattern = asString(item);
        if (!pattern)
            continue;
        const normalized = pattern.replace(/PatternIdentifiers\.|Pattern$/g, '');
        if (!seen.has(normalized)) {
            seen.add(normalized);
            patterns.push(normalized);
        }
    }
    return patterns;
}
function hasPattern(patterns, pattern) {
    return patterns.some(p => p.toLowerCase() === pattern.toLowerCase() || p.toLowerCase() === `${pattern.toLowerCase()}pattern`);
}
function isLikelyWin32Invokable(controlType, className) {
    const type = controlType.toLowerCase();
    const cls = (className || '').toLowerCase();
    return type.includes('button') || type.includes('menuitem') || cls === 'button' || cls.includes('button');
}
function isLikelyWin32Editable(controlType, className) {
    const type = controlType.toLowerCase();
    const cls = (className || '').toLowerCase();
    return type.includes('edit') || type.includes('document') || cls === 'edit' || cls.includes('richedit');
}
export function inferElementCapability(input) {
    const source = input.source || 'uia';
    const controlType = input.controlType || 'unknown';
    const patterns = input.patterns || [];
    const isEnabled = input.isEnabled !== false;
    const hasHwnd = input.nativeWindowHandle != null && input.nativeWindowHandle !== 0;
    const canInvoke = isEnabled && (hasPattern(patterns, 'Invoke') || hasPattern(patterns, 'Toggle') || hasPattern(patterns, 'SelectionItem') || hasPattern(patterns, 'ExpandCollapse'));
    const canType = isEnabled && hasPattern(patterns, 'Value');
    const canWin32Invoke = isEnabled && hasHwnd && isLikelyWin32Invokable(controlType, input.className);
    const canWin32Type = isEnabled && hasHwnd && isLikelyWin32Editable(controlType, input.className);
    const isLikelySelectable = /^(listitem|treeitem|tabitem|menuitem)$/i.test(controlType) || controlType.toLowerCase().includes('item');
    const supportedActions = [];
    if (canInvoke || canWin32Invoke)
        supportedActions.push('invoke');
    if (hasPattern(patterns, 'Invoke') || canWin32Invoke)
        supportedActions.push('click');
    if (hasPattern(patterns, 'Toggle'))
        supportedActions.push('toggle');
    if (hasPattern(patterns, 'SelectionItem') || isLikelySelectable)
        supportedActions.push('select');
    if (hasPattern(patterns, 'ExpandCollapse'))
        supportedActions.push('expandCollapse');
    if (canType || canWin32Type) {
        supportedActions.push('setValue');
        supportedActions.push('type');
    }
    if (input.isFocusable || isEnabled)
        supportedActions.push('focus');
    if (input.bounds)
        supportedActions.push('clickFallback');
    const requiresForeground = !canInvoke && !canType && !canWin32Invoke && !canWin32Type;
    const visionFallbackNeeded = source === 'ocr' || (!input.bounds && supportedActions.length === 0);
    const unsupportedReasons = [];
    if (!isEnabled)
        unsupportedReasons.push('element_disabled');
    if (!canInvoke && !canWin32Invoke)
        unsupportedReasons.push('background_invoke_unavailable');
    if (!canType && !canWin32Type)
        unsupportedReasons.push('background_type_unavailable');
    if (requiresForeground)
        unsupportedReasons.push('requires_foreground_or_hid_fallback');
    if (visionFallbackNeeded)
        unsupportedReasons.push('vision_fallback_needed');
    return {
        backgroundRead: source === 'uia' || source === 'win32' || source === 'iaccessible',
        backgroundInvoke: canInvoke || canWin32Invoke,
        backgroundType: canType || canWin32Type,
        requiresForeground,
        visionFallbackNeeded,
        supportedActions: [...new Set(supportedActions)],
        unsupportedReasons,
    };
}
export function mapUiaNode(rawValue, index = 0, path = [index], windowId) {
    const raw = asRecord(rawValue);
    const name = asString(raw.Name ?? raw.name);
    const automationId = asString(raw.AutomationId ?? raw.automationId);
    const className = asString(raw.ClassName ?? raw.className);
    const frameworkId = asString(raw.FrameworkId ?? raw.frameworkId);
    const helpText = asString(raw.HelpText ?? raw.helpText);
    const controlTypeRaw = asString(raw.ControlType ?? raw.controlType);
    const controlType = normalizeControlType(controlTypeRaw);
    const processId = asNumber(raw.ProcessId ?? raw.processId);
    const nativeWindowHandle = asNumber(raw.NativeWindowHandle ?? raw.nativeWindowHandle ?? raw.Handle ?? raw.handle);
    const bounds = parseBounds(raw.BoundingRectangle ?? raw.Rect ?? raw.Bounds ?? raw.bounds);
    const value = asString(raw.Value ?? raw.value);
    const text = asString(raw.Text ?? raw.text ?? value ?? name);
    const patterns = normalizePatterns(raw.Patterns ?? raw.AvailablePatterns ?? raw.patterns);
    const source = asString(raw.Source ?? raw.source)?.toLowerCase() || 'uia';
    const isEnabled = asBoolean(raw.IsEnabled ?? raw.isEnabled);
    const isOffscreen = asBoolean(raw.IsOffscreen ?? raw.isOffscreen);
    const isFocusable = asBoolean(raw.IsKeyboardFocusable ?? raw.isKeyboardFocusable ?? raw.IsFocusable ?? raw.isFocusable);
    const hasKeyboardFocus = asBoolean(raw.HasKeyboardFocus ?? raw.hasKeyboardFocus);
    const isSelected = asBoolean(raw.IsSelected ?? raw.isSelected);
    const toggleState = asString(raw.ToggleState ?? raw.toggleState);
    const expandCollapseState = asString(raw.ExpandCollapseState ?? raw.expandCollapseState);
    const capabilities = inferElementCapability({
        source,
        controlType,
        className,
        patterns,
        isEnabled,
        isFocusable,
        nativeWindowHandle,
        bounds,
    });
    const id = `win:${processId ?? 0}:${path.join('.')}:${sanitizeIdPart(automationId || name || className || controlType)}`;
    const childValues = Array.isArray(raw.Children ?? raw.children) ? raw.Children ?? raw.children : [];
    const children = childValues.map((child, childIndex) => mapUiaNode(child, childIndex, [...path, childIndex], windowId));
    return {
        id,
        provider: WINDOWS_PROVIDER_ID,
        source,
        role: controlType,
        controlType,
        name,
        label: name,
        text,
        value,
        automationId,
        className,
        frameworkId,
        helpText,
        processId,
        nativeWindowHandle,
        windowId,
        bounds,
        path,
        depth: Math.max(0, path.length - 1),
        index,
        isEnabled,
        isOffscreen,
        isFocusable,
        hasKeyboardFocus,
        isSelected,
        toggleState,
        expandCollapseState,
        patterns,
        supportedActions: capabilities.supportedActions,
        capabilities,
        children,
        raw,
    };
}
export function mapUiaTree(rawValue, windowId) {
    const rawNodes = Array.isArray(rawValue) ? rawValue : [rawValue];
    return rawNodes.filter(Boolean).map((node, index) => mapUiaNode(node, index, [index], windowId));
}
export function flattenElements(nodes) {
    const result = [];
    const visit = (node) => {
        result.push(node);
        for (const child of node.children)
            visit(child);
    };
    for (const node of nodes)
        visit(node);
    return result;
}
function pathEquals(nodePath, selectorPath) {
    const wanted = typeof selectorPath === 'string'
        ? selectorPath.split(/[./]/).filter(Boolean).map(part => Number(part))
        : selectorPath;
    return wanted.length === nodePath.length && wanted.every((part, index) => part === nodePath[index]);
}
function boundsMatch(bounds, expected) {
    if (!bounds)
        return false;
    const tolerance = 2;
    if (expected.x != null && Math.abs(bounds.x - expected.x) > tolerance)
        return false;
    if (expected.y != null && Math.abs(bounds.y - expected.y) > tolerance)
        return false;
    if (expected.width != null && Math.abs(bounds.width - expected.width) > tolerance)
        return false;
    if (expected.height != null && Math.abs(bounds.height - expected.height) > tolerance)
        return false;
    return true;
}
export function scoreElementSelector(element, selector) {
    let score = 0;
    if (selector.id && element.id === selector.id)
        score += 200;
    if (selector.processId != null && element.processId === selector.processId)
        score += 20;
    if (selector.windowId && element.windowId === selector.windowId)
        score += 20;
    if (selector.path && pathEquals(element.path, selector.path))
        score += 120;
    if (selector.automationId && normalizeText(element.automationId) === selector.automationId.toLowerCase())
        score += 100;
    if (selector.name && normalizeText(element.name) === selector.name.toLowerCase())
        score += 80;
    if (selector.text && normalizeText(element.text) === selector.text.toLowerCase())
        score += 80;
    if (selector.containsText) {
        const needle = selector.containsText.toLowerCase();
        if (normalizeText(element.text).includes(needle) || normalizeText(element.name).includes(needle) || normalizeText(element.value).includes(needle))
            score += 50;
    }
    if (selector.role && normalizeText(element.role) === selector.role.toLowerCase())
        score += 40;
    if (selector.controlType && normalizeText(element.controlType) === normalizeControlType(selector.controlType).toLowerCase())
        score += 40;
    if (selector.className && normalizeText(element.className) === selector.className.toLowerCase())
        score += 30;
    if (selector.frameworkId && normalizeText(element.frameworkId) === selector.frameworkId.toLowerCase())
        score += 20;
    if (selector.bounds && boundsMatch(element.bounds, selector.bounds))
        score += 25;
    if (score > 0 && element.isEnabled !== false)
        score += 5;
    if (score > 0 && element.isOffscreen !== true)
        score += 5;
    return score;
}
export function elementMatchesSelector(element, selector) {
    if (selector.id && element.id !== selector.id)
        return false;
    if (selector.processId != null && element.processId !== selector.processId)
        return false;
    if (selector.windowId && element.windowId !== selector.windowId)
        return false;
    if (selector.path && !pathEquals(element.path, selector.path))
        return false;
    if (selector.automationId && normalizeText(element.automationId) !== selector.automationId.toLowerCase())
        return false;
    if (selector.name && normalizeText(element.name) !== selector.name.toLowerCase())
        return false;
    if (selector.text && normalizeText(element.text) !== selector.text.toLowerCase())
        return false;
    if (selector.containsText) {
        const needle = selector.containsText.toLowerCase();
        if (!normalizeText(element.text).includes(needle) && !normalizeText(element.name).includes(needle) && !normalizeText(element.value).includes(needle))
            return false;
    }
    if (selector.role && normalizeText(element.role) !== selector.role.toLowerCase())
        return false;
    if (selector.controlType && normalizeText(element.controlType) !== normalizeControlType(selector.controlType).toLowerCase())
        return false;
    if (selector.className && normalizeText(element.className) !== selector.className.toLowerCase())
        return false;
    if (selector.frameworkId && normalizeText(element.frameworkId) !== selector.frameworkId.toLowerCase())
        return false;
    if (selector.bounds && !boundsMatch(element.bounds, selector.bounds))
        return false;
    return true;
}
export function findElementsInTree(nodes, selector) {
    return flattenElements(nodes)
        .map(element => ({ element, score: scoreElementSelector(element, selector) }))
        .filter(item => item.score > 0 && elementMatchesSelector(item.element, selector))
        .sort((a, b) => b.score - a.score)
        .map(item => item.element);
}
export function canUseActionInBackground(element, action) {
    if (action === 'invoke' || action === 'click' || action === 'toggle' || action === 'select' || action === 'expandCollapse') {
        return element.capabilities.backgroundInvoke;
    }
    if (action === 'setValue' || action === 'type')
        return element.capabilities.backgroundType;
    if (action === 'focus')
        return true;
    return false;
}
