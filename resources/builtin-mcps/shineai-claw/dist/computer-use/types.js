import { z } from 'zod';
export const ComputerUseProviderKindSchema = z.enum([
    'browser',
    'os-accessibility',
    'app-bridge',
    'vision-ocr',
    'hid',
    'mock',
]);
export const ComputerUsePlatformSchema = z.enum([
    'windows',
    'macos',
    'linux',
    'browser',
    'cross-platform',
    'unknown',
]);
export const ElementSourceSchema = z.enum([
    'dom',
    'cdp',
    'uia',
    'win32',
    'iaccessible',
    'ax',
    'applescript',
    'jxa',
    'app-bridge',
    'vision',
    'ocr',
    'hid',
    'snapshot',
    'unknown',
]);
export const ActionKindSchema = z.enum([
    'readState',
    'invoke',
    'click',
    'setValue',
    'typeText',
    'select',
    'selectMenu',
    'scroll',
    'hotkey',
    'focus',
]);
export const VerificationModeSchema = z.enum([
    'none',
    'read',
    'compare',
    'visible-state',
    'dom-tree',
]);
export const RectSchema = z.object({
    x: z.number(),
    y: z.number(),
    width: z.number().nonnegative(),
    height: z.number().nonnegative(),
});
export const PointSchema = z.object({
    x: z.number(),
    y: z.number(),
});
export const AppTargetSchema = z.object({
    appId: z.string().optional(),
    pid: z.number().int().positive().optional(),
    bundleId: z.string().optional(),
    executablePath: z.string().optional(),
    name: z.string().optional(),
    windowId: z.union([z.string(), z.number()]).optional(),
    browserContextId: z.string().optional(),
    tabId: z.union([z.string(), z.number()]).optional(),
    url: z.string().optional(),
});
export const WindowStateSchema = z.object({
    id: z.union([z.string(), z.number()]),
    appId: z.string().optional(),
    pid: z.number().int().positive().optional(),
    title: z.string().optional(),
    url: z.string().optional(),
    bounds: RectSchema.optional(),
    zIndex: z.number().optional(),
    isFocused: z.boolean().optional(),
    isFrontmost: z.boolean().optional(),
    isMinimized: z.boolean().optional(),
    isModal: z.boolean().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
});
export const ElementSelectorSchema = z.object({
    providerId: z.string().optional(),
    source: ElementSourceSchema.optional(),
    app: AppTargetSchema.optional(),
    windowId: z.union([z.string(), z.number()]).optional(),
    elementId: z.string().optional(),
    role: z.string().optional(),
    name: z.string().optional(),
    label: z.string().optional(),
    title: z.string().optional(),
    value: z.string().optional(),
    description: z.string().optional(),
    automationId: z.string().optional(),
    identifier: z.string().optional(),
    css: z.string().optional(),
    xpath: z.string().optional(),
    text: z.string().optional(),
    textRegex: z.string().optional(),
    axPath: z.array(z.number()).optional(),
    uiaPath: z.array(z.number()).optional(),
    domPath: z.array(z.union([z.string(), z.number()])).optional(),
    bounds: RectSchema.optional(),
    ordinal: z.number().int().nonnegative().optional(),
    confidenceThreshold: z.number().min(0).max(1).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
});
export const ElementNodeSchema = z.lazy(() => z.object({
    id: z.string(),
    providerId: z.string().optional(),
    source: ElementSourceSchema.default('unknown'),
    role: z.string().optional(),
    subrole: z.string().optional(),
    name: z.string().optional(),
    label: z.string().optional(),
    title: z.string().optional(),
    value: z.union([z.string(), z.number(), z.boolean(), z.null()]).optional(),
    description: z.string().optional(),
    identifier: z.string().optional(),
    automationId: z.string().optional(),
    className: z.string().optional(),
    cssPath: z.string().optional(),
    xpath: z.string().optional(),
    text: z.string().optional(),
    keyboardShortcut: z.string().optional(),
    bounds: RectSchema.optional(),
    isEnabled: z.boolean().optional(),
    isVisible: z.boolean().optional(),
    isFocused: z.boolean().optional(),
    isSelected: z.boolean().optional(),
    isEditable: z.boolean().optional(),
    isActionable: z.boolean().optional(),
    supportedActions: z.array(ActionKindSchema).optional(),
    children: z.array(ElementNodeSchema).optional(),
    parentId: z.string().optional(),
    selectorHints: z.array(ElementSelectorSchema).optional(),
    nativeRef: z.record(z.string(), z.unknown()).optional(),
    confidence: z.number().min(0).max(1).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
}));
export const AppStateSchema = z.object({
    appId: z.string(),
    providerId: z.string(),
    providerKind: ComputerUseProviderKindSchema,
    platform: ComputerUsePlatformSchema,
    pid: z.number().int().positive().optional(),
    name: z.string().optional(),
    bundleId: z.string().optional(),
    executablePath: z.string().optional(),
    url: z.string().optional(),
    isRunning: z.boolean().optional(),
    isActive: z.boolean().optional(),
    windows: z.array(WindowStateSchema).default([]),
    root: ElementNodeSchema.optional(),
    snapshotId: z.string().optional(),
    capturedAt: z.number().default(() => Date.now()),
    metadata: z.record(z.string(), z.unknown()).optional(),
});
export const VerificationExpectationSchema = z.object({
    selector: ElementSelectorSchema.optional(),
    exists: z.boolean().optional(),
    visible: z.boolean().optional(),
    enabled: z.boolean().optional(),
    value: z.union([z.string(), z.number(), z.boolean(), z.null()]).optional(),
    text: z.string().optional(),
    state: z.record(z.string(), z.unknown()).optional(),
});
export const VerificationRequestSchema = z.object({
    mode: VerificationModeSchema.default('visible-state'),
    expectation: VerificationExpectationSchema.optional(),
    timeoutMs: z.number().int().positive().default(2_000),
    retries: z.number().int().nonnegative().default(0),
});
export const VerificationResultSchema = z.object({
    ok: z.boolean(),
    mode: VerificationModeSchema,
    checkedAt: z.number(),
    providerId: z.string().optional(),
    element: ElementNodeSchema.optional(),
    state: AppStateSchema.optional(),
    message: z.string().optional(),
    details: z.record(z.string(), z.unknown()).optional(),
});
const CommonActionFields = z.object({
    id: z.string().optional(),
    app: AppTargetSchema.optional(),
    verify: VerificationRequestSchema.optional(),
    timeoutMs: z.number().int().positive().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
});
export const InvokeActionSchema = CommonActionFields.extend({
    type: z.literal('invoke'),
    target: ElementSelectorSchema,
});
export const ClickActionSchema = CommonActionFields.extend({
    type: z.literal('click'),
    target: ElementSelectorSchema,
    button: z.enum(['left', 'right', 'middle']).default('left'),
    clickCount: z.number().int().positive().default(1),
});
export const SetValueActionSchema = CommonActionFields.extend({
    type: z.literal('setValue'),
    target: ElementSelectorSchema,
    value: z.union([z.string(), z.number(), z.boolean(), z.null()]),
    append: z.boolean().default(false),
});
export const TypeTextActionSchema = CommonActionFields.extend({
    type: z.literal('typeText'),
    target: ElementSelectorSchema.optional(),
    text: z.string(),
    clearExisting: z.boolean().default(false),
    delayMsPerChar: z.number().int().nonnegative().default(0),
});
export const SelectActionSchema = CommonActionFields.extend({
    type: z.literal('select'),
    target: ElementSelectorSchema,
    value: z.string().optional(),
    index: z.number().int().nonnegative().optional(),
});
export const SelectMenuActionSchema = CommonActionFields.extend({
    type: z.literal('selectMenu'),
    menuPath: z.array(z.string()).min(1),
});
export const ScrollActionSchema = CommonActionFields.extend({
    type: z.literal('scroll'),
    target: ElementSelectorSchema.optional(),
    direction: z.enum(['up', 'down', 'left', 'right']),
    amount: z.number().positive(),
});
export const HotkeyActionSchema = CommonActionFields.extend({
    type: z.literal('hotkey'),
    keys: z.array(z.string()).min(1),
});
export const FocusActionSchema = CommonActionFields.extend({
    type: z.literal('focus'),
    target: ElementSelectorSchema,
});
export const ReadStateActionSchema = CommonActionFields.extend({
    type: z.literal('readState'),
});
export const ComputerUseActionSchema = z.discriminatedUnion('type', [
    InvokeActionSchema,
    ClickActionSchema,
    SetValueActionSchema,
    TypeTextActionSchema,
    SelectActionSchema,
    SelectMenuActionSchema,
    ScrollActionSchema,
    HotkeyActionSchema,
    FocusActionSchema,
    ReadStateActionSchema,
]);
export const ActionResultSchema = z.object({
    ok: z.boolean(),
    actionId: z.string().optional(),
    actionType: ActionKindSchema.optional(),
    providerId: z.string().optional(),
    providerKind: ComputerUseProviderKindSchema.optional(),
    method: z.string().optional(),
    targetElement: ElementNodeSchema.optional(),
    changed: z.boolean().optional(),
    requiresForeground: z.boolean().optional(),
    usedForeground: z.boolean().optional(),
    usedFallback: z.boolean().optional(),
    fallbackSuggested: z.boolean().optional(),
    fallbackReason: z.string().optional(),
    verification: VerificationResultSchema.optional(),
    data: z.record(z.string(), z.unknown()).optional(),
    error: z.object({
        code: z.string(),
        message: z.string(),
        details: z.record(z.string(), z.unknown()).optional(),
    }).optional(),
    warnings: z.array(z.string()).default([]),
});
export const CapabilityReportSchema = z.object({
    providerId: z.string(),
    providerKind: ComputerUseProviderKindSchema,
    platform: ComputerUsePlatformSchema,
    source: z.array(ElementSourceSchema).default([]),
    priority: z.number().default(0),
    backgroundRead: z.boolean(),
    backgroundInvoke: z.boolean(),
    backgroundType: z.boolean(),
    requiresForeground: z.boolean(),
    visionFallbackNeeded: z.boolean(),
    supportedActions: z.array(ActionKindSchema),
    verificationSupport: z.array(VerificationModeSchema),
    supportsElementTree: z.boolean().default(false),
    supportsSelectorLookup: z.boolean().default(false),
    supportsWindowState: z.boolean().default(false),
    permissions: z.array(z.string()).default([]),
    limitations: z.array(z.string()).default([]),
    confidence: z.number().min(0).max(1).default(1),
    target: AppTargetSchema.optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
});
export const CanonicalStatusSchema = z.enum(['success', 'failure', 'partial', 'skipped']);
export const CanonicalReportSchema = z.object({
    ok: z.boolean(),
    status: CanonicalStatusSchema,
    phase: z.enum(['route', 'read', 'execute', 'verify', 'capability']),
    providerId: z.string().optional(),
    providerKind: ComputerUseProviderKindSchema.optional(),
    action: ComputerUseActionSchema.optional(),
    target: AppTargetSchema.optional(),
    result: ActionResultSchema.optional(),
    state: AppStateSchema.optional(),
    capabilities: z.array(CapabilityReportSchema).default([]),
    verification: VerificationResultSchema.optional(),
    route: z.array(z.object({
        providerId: z.string(),
        providerKind: ComputerUseProviderKindSchema,
        priority: z.number(),
        reason: z.string(),
    })).default([]),
    fallbackSuggested: z.boolean().default(false),
    fallbackProviders: z.array(z.string()).default([]),
    error: z.object({
        code: z.string(),
        message: z.string(),
        details: z.record(z.string(), z.unknown()).optional(),
    }).optional(),
    warnings: z.array(z.string()).default([]),
    timestamp: z.number().default(() => Date.now()),
    // Optional execution trace attached when tracing is enabled (P1/P2)
    trace: z.unknown().optional(),
});
export const DEFAULT_PROVIDER_KIND_PRIORITY = [
    'browser',
    'os-accessibility',
    'app-bridge',
    'vision-ocr',
    'hid',
    'mock',
];
export function actionToCapability(action) {
    return action.type;
}
export function isFallbackProviderKind(kind) {
    return kind === 'vision-ocr' || kind === 'hid';
}
