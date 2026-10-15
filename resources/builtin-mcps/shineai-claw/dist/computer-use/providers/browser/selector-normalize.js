const LOCATOR_KINDS = new Set(['css', 'xpath', 'text', 'role', 'aria-label', 'ariaLabel', 'testId', 'bounds', 'elementId']);
const LOCATOR_FIELD_KEYS = [
    'css',
    'xpath',
    'text',
    'role',
    'ariaLabel',
    'aria-label',
    'testId',
    'elementId',
    'shineaiId',
    'bounds',
];
function nonEmptyString(value) {
    return typeof value === 'string' && value.trim().length > 0;
}
/** Agent 常传 {type,value}/{kind,value}；内部只认扁平 css|xpath|text|... */
export function normalizeBrowserSelector(input) {
    if (input == null || typeof input !== 'object' || Array.isArray(input))
        return undefined;
    const raw = { ...input };
    if (raw['aria-label'] != null && raw.ariaLabel == null) {
        raw.ariaLabel = raw['aria-label'];
    }
    const kindRaw = raw.kind ?? raw.type;
    const kind = typeof kindRaw === 'string' ? kindRaw.trim() : '';
    if (kind && raw.value != null && String(raw.value).trim().length > 0) {
        applyKindValue(raw, kind, raw.value);
    }
    else if (kind && LOCATOR_KINDS.has(kind)) {
        if (raw.kind == null)
            raw.kind = normalizeKind(kind);
    }
    const out = {};
    if (typeof raw.kind === 'string' && raw.kind)
        out.kind = normalizeKind(raw.kind);
    if (typeof raw.css === 'string')
        out.css = raw.css;
    if (typeof raw.xpath === 'string')
        out.xpath = raw.xpath;
    if (typeof raw.text === 'string')
        out.text = raw.text;
    if (typeof raw.role === 'string')
        out.role = raw.role;
    if (typeof raw.ariaLabel === 'string')
        out.ariaLabel = raw.ariaLabel;
    if (typeof raw.testId === 'string')
        out.testId = raw.testId;
    if (typeof raw.testIdAttribute === 'string')
        out.testIdAttribute = raw.testIdAttribute;
    if (Array.isArray(raw.framePath))
        out.framePath = raw.framePath.map(String);
    if (typeof raw.urlIncludes === 'string')
        out.urlIncludes = raw.urlIncludes;
    if (typeof raw.titleIncludes === 'string')
        out.titleIncludes = raw.titleIncludes;
    if (typeof raw.url === 'string')
        out.url = raw.url;
    if (raw.bounds && typeof raw.bounds === 'object' && !Array.isArray(raw.bounds)) {
        out.bounds = raw.bounds;
    }
    if (typeof raw.index === 'number' && Number.isFinite(raw.index))
        out.index = raw.index;
    if (typeof raw.visible === 'boolean')
        out.visible = raw.visible;
    if (typeof raw.elementId === 'string')
        out.elementId = raw.elementId;
    if (typeof raw.shineaiId === 'string')
        out.shineaiId = raw.shineaiId;
    return out;
}
export function hasSpecificLocatorIntent(input) {
    if (input == null || typeof input !== 'object' || Array.isArray(input))
        return false;
    const raw = input;
    if (hasResolvedLocatorFields(raw))
        return true;
    // Key present but empty/whitespace still counts as specific-but-unresolved (find must not DEFAULT).
    for (const key of LOCATOR_FIELD_KEYS) {
        if (Object.prototype.hasOwnProperty.call(raw, key))
            return true;
    }
    const kind = raw.kind ?? raw.type;
    if (typeof kind === 'string' && kind.trim())
        return true;
    if (raw.value != null && String(raw.value).trim().length > 0)
        return true;
    return false;
}
export function hasResolvedLocatorFields(selector) {
    if (!selector || typeof selector !== 'object')
        return false;
    const s = selector;
    return Boolean(nonEmptyString(s.css) ||
        nonEmptyString(s.xpath) ||
        nonEmptyString(s.text) ||
        nonEmptyString(s.role) ||
        nonEmptyString(s.ariaLabel) ||
        nonEmptyString(s['aria-label']) ||
        nonEmptyString(s.testId) ||
        nonEmptyString(s.elementId) ||
        nonEmptyString(s.shineaiId) ||
        (s.bounds && typeof s.bounds === 'object'));
}
function applyKindValue(raw, kind, value) {
    const text = typeof value === 'string' ? value : value == null ? '' : String(value);
    switch (kind) {
        case 'css':
            if (raw.css == null)
                raw.css = text;
            raw.kind = 'css';
            break;
        case 'xpath':
            if (raw.xpath == null)
                raw.xpath = text;
            raw.kind = 'xpath';
            break;
        case 'text':
            if (raw.text == null)
                raw.text = text;
            raw.kind = 'text';
            break;
        case 'role':
            if (raw.role == null)
                raw.role = text;
            raw.kind = 'role';
            break;
        case 'aria-label':
        case 'ariaLabel':
            if (raw.ariaLabel == null)
                raw.ariaLabel = text;
            raw.kind = 'aria-label';
            break;
        case 'testId':
            if (raw.testId == null)
                raw.testId = text;
            raw.kind = 'testId';
            break;
        case 'elementId':
            if (raw.elementId == null)
                raw.elementId = text;
            raw.kind = 'elementId';
            break;
        case 'bounds':
            if (raw.bounds == null && value && typeof value === 'object' && !Array.isArray(value)) {
                raw.bounds = value;
            }
            raw.kind = 'bounds';
            break;
        default:
            break;
    }
}
function normalizeKind(kind) {
    switch (kind) {
        case 'css':
        case 'xpath':
        case 'text':
        case 'role':
        case 'aria-label':
        case 'testId':
        case 'bounds':
        case 'elementId':
            return kind;
        case 'ariaLabel':
            return 'aria-label';
        default:
            return undefined;
    }
}
