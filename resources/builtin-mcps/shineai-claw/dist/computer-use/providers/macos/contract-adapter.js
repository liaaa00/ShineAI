import { createMacOSAccessibilityProvider } from './provider.js';
import { MACOS_AX_CORE_PROVIDER_ID, } from './schema.js';
export class MacOSCoreProviderAdapter {
    id = MACOS_AX_CORE_PROVIDER_ID;
    provider;
    readOptions;
    constructor(options = {}) {
        this.provider = options.provider ?? createMacOSAccessibilityProvider();
        this.readOptions = options.readOptions ?? { maxDepth: 10, maxCount: 300, allowWebFocus: true, includeVisionFallback: false };
    }
    async getCapabilities() {
        const report = await this.provider.getCapabilityReport();
        const warnings = report.reason ? [report.reason] : [];
        return {
            providerId: MACOS_AX_CORE_PROVIDER_ID,
            platform: report.platform,
            supported: report.supported,
            blockedReason: report.supported ? undefined : report.reason,
            permissions: report.permissionsRequired.map(permission => ({
                name: permission.name,
                state: permission.status,
                required: permission.required,
                requiredFor: permission.requiredFor,
                remediation: permission.notes,
            })),
            operations: mapCapabilityOperations(report),
            warnings,
        };
    }
    async listApps() {
        const result = await this.provider.listApps();
        if (!result.ok)
            return [];
        return result.data.map(mapApp);
    }
    async getAppState(selector = {}) {
        const [appsResult, windowsResult] = await Promise.all([
            this.provider.listApps(),
            this.provider.listWindows(selector),
        ]);
        if (!appsResult.ok) {
            return {
                providerId: MACOS_AX_CORE_PROVIDER_ID,
                app: null,
                windows: [],
                activeWindow: null,
                blocked: true,
                blockedReason: appsResult.error,
                warnings: appsResult.warnings,
            };
        }
        if (!windowsResult.ok) {
            return {
                providerId: MACOS_AX_CORE_PROVIDER_ID,
                app: selectApp(appsResult.data, selector) ? mapApp(selectApp(appsResult.data, selector)) : null,
                windows: [],
                activeWindow: null,
                blocked: true,
                blockedReason: windowsResult.error,
                warnings: windowsResult.warnings,
            };
        }
        const app = selectApp(appsResult.data, selector);
        const windows = windowsResult.data.map(mapWindow);
        return {
            providerId: MACOS_AX_CORE_PROVIDER_ID,
            app: app ? mapApp(app) : null,
            windows,
            activeWindow: windows.find(window => window.isFrontmost) ?? windows[0] ?? null,
            blocked: false,
            warnings: [...appsResult.warnings, ...windowsResult.warnings],
        };
    }
    async getAppTree(selector = {}) {
        const result = await this.provider.readTree(selector, this.readOptions);
        if (!result.ok) {
            return {
                providerId: MACOS_AX_CORE_PROVIDER_ID,
                snapshotId: '',
                app: { pid: null, name: null, bundleId: selector.bundleId ?? selector.app?.bundleId },
                window: { title: selector.windowTitle ?? null, bounds: null, windowId: selector.windowId },
                screenshotPath: null,
                annotatedPath: null,
                elements: [],
                flatElements: [],
                warnings: [...result.warnings, result.error],
            };
        }
        return mapTree(result.data);
    }
    async findElement(selector) {
        const result = await this.provider.findElement(selector, this.readOptions);
        if (!result.ok || !result.data)
            return null;
        return mapElement(result.data.element);
    }
    async invokeElement(selector) {
        const result = await this.provider.executeAction({ name: 'invoke', selector });
        return mapActionResult(result, 'invoke', selector);
    }
    async setValue(selector, value, options = {}) {
        const result = await this.provider.executeAction({
            name: 'setValue',
            selector,
            value,
            clearExisting: options.clearExisting ?? true,
        });
        return mapActionResult(result, 'setValue', selector);
    }
    async selectMenu(request) {
        const selector = {
            pid: request.pid,
            bundleId: request.bundleId,
            processName: request.processName,
        };
        const result = await this.provider.executeAction({
            name: 'selectMenu',
            selector,
            pid: request.pid,
            bundleId: request.bundleId,
            processName: request.processName,
            menuPath: request.path,
        });
        return mapActionResult(result, 'selectMenu', { path: request.path });
    }
}
export function createMacOSCoreProvider(options = {}) {
    return new MacOSCoreProviderAdapter(options);
}
export function registerMacOSCoreProvider(registry, provider = createMacOSCoreProvider()) {
    registry.register(provider);
    return provider;
}
function mapCapabilityOperations(report) {
    return {
        listApps: mapOperation(report, 'listApps', 'state-read'),
        getAppState: mapOperation(report, 'listWindows', 'state-read'),
        getAppTree: mapOperation(report, 'readTree', 'ax-tree'),
        findElement: mapOperation(report, 'findElement', 'ax-tree'),
        invokeElement: mapOperation(report, 'press', 'ax-tree'),
        setValue: mapOperation(report, 'setValue', 'state-read'),
        selectMenu: mapOperation(report, 'selectMenu', 'state-read'),
        getCapabilities: {
            supported: true,
            backgroundCapable: true,
            requiresForeground: false,
            fallback: 'none',
            verification: 'none',
            notes: 'Pure provider capability synthesis; safe in Windows contract tests with fake provider source.',
        },
    };
}
function mapOperation(report, localName, verification) {
    const operation = report.operations[localName];
    return {
        supported: operation?.supported ?? false,
        backgroundCapable: operation?.backgroundCapable ?? false,
        requiresForeground: operation?.requiresForeground ?? true,
        fallback: mapFallbackKind(operation?.fallback),
        verification,
        notes: operation?.notes ?? `No local capability entry for ${String(localName)}`,
    };
}
function mapFallbackKind(value) {
    switch (value) {
        case 'hid':
            return 'hid';
        case 'vision':
        case 'browser-cdp':
            return 'vision';
        case 'jxa':
            return 'jxa';
        case 'none':
            return 'none';
        default:
            return 'manual';
    }
}
function mapApp(app) {
    return {
        providerId: MACOS_AX_CORE_PROVIDER_ID,
        pid: app.pid,
        bundleId: app.bundleId,
        name: app.processName,
        isActive: app.isActive,
    };
}
function mapWindow(window) {
    return {
        providerId: MACOS_AX_CORE_PROVIDER_ID,
        windowId: window.windowId,
        pid: window.pid,
        title: window.title,
        bounds: window.bounds,
        isMinimized: window.isMinimized,
        isFrontmost: window.isFrontmost,
    };
}
function mapTree(tree) {
    return {
        providerId: MACOS_AX_CORE_PROVIDER_ID,
        snapshotId: tree.snapshotId,
        app: {
            pid: tree.app.pid,
            bundleId: tree.app.bundleId,
            name: tree.app.processName,
        },
        window: tree.window,
        screenshotPath: tree.screenshotPath,
        annotatedPath: tree.annotatedPath,
        elements: tree.elements.map(mapElement),
        flatElements: tree.flatElements.map(mapElement),
        warnings: tree.warnings,
    };
}
function mapElement(element) {
    return {
        providerId: MACOS_AX_CORE_PROVIDER_ID,
        id: element.id,
        role: normalizeRole(element.role),
        nativeRole: element.role,
        name: element.label || element.title || element.description || element.value || element.identifier || '',
        title: element.title,
        value: element.value,
        description: element.description,
        identifier: element.identifier,
        bounds: element.bounds,
        enabled: element.enabled,
        actionable: element.actionable,
        parentId: element.parentId,
        path: element.path,
        selector: element.selector,
        children: element.children.map(mapElement),
    };
}
function mapActionResult(result, action, fallbackTarget) {
    if (!result.ok) {
        return {
            providerId: MACOS_AX_CORE_PROVIDER_ID,
            status: result.unsupported ? 'blocked' : 'failed',
            action,
            method: 'none',
            target: fallbackTarget,
            verification: {
                ok: false,
                strategy: 'none',
                message: result.error,
            },
            fallback: {
                used: false,
                kind: 'none',
                requiresForeground: false,
                requiresScreenRecording: false,
                reason: 'Provider rejected before action execution.',
            },
            warnings: result.warnings,
            message: result.error,
        };
    }
    const data = result.data;
    const fallback = inferFallback(data);
    return {
        providerId: MACOS_AX_CORE_PROVIDER_ID,
        status: data.ok ? 'success' : data.target ? 'failed' : 'not-found',
        action,
        method: data.method,
        target: data.target ? mapElement(data.target) : fallbackTarget,
        verification: mapVerification(data),
        fallback,
        warnings: [...result.warnings, ...data.warnings],
        message: data.ok ? `${action} completed via ${data.method}` : `${action} failed via ${data.method}`,
        raw: data.raw,
    };
}
function mapVerification(data) {
    return {
        ok: data.verification.status !== 'failure',
        strategy: data.verification.strategy === 'ax-value' ? 'state-read' : data.verification.strategy,
        message: data.verification.reason ?? data.verification.checks.join('; '),
        observed: data.verification.observed,
    };
}
function inferFallback(data) {
    const method = data.method;
    const used = method === 'daemon.hidClick' || method === 'daemon.hidType' || method === 'jxa.systemEventsMenu' || data.visionFallbackNeeded;
    const kind = method === 'jxa.systemEventsMenu'
        ? 'jxa'
        : data.visionFallbackNeeded
            ? 'vision'
            : method === 'daemon.hidClick' || method === 'daemon.hidType'
                ? 'hid'
                : 'none';
    return {
        used,
        kind,
        requiresForeground: data.requiresForeground,
        requiresScreenRecording: kind === 'vision',
        reason: used ? `Local provider reported ${method} / visionFallbackNeeded=${data.visionFallbackNeeded}` : 'Native semantic path completed without fallback.',
    };
}
function selectApp(apps, selector) {
    const pid = selector.pid ?? selector.app?.pid;
    const bundleId = selector.bundleId ?? selector.app?.bundleId;
    const processName = selector.processName ?? selector.app?.processName;
    return apps.find(app => {
        if (pid != null && app.pid === pid)
            return true;
        if (bundleId && app.bundleId === bundleId)
            return true;
        if (processName && app.processName.toLowerCase() === processName.toLowerCase())
            return true;
        return false;
    }) ?? apps.find(app => app.isActive) ?? apps[0] ?? null;
}
function normalizeRole(role) {
    return role.startsWith('AX')
        ? role.slice(2).replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
        : role.replace(/\s+/g, '-').toLowerCase();
}
// Compile-time guard: the real provider-local class can be wrapped by this adapter.
const _realProviderAssignable = createMacOSAccessibilityProvider({ platform: 'darwin' });
void _realProviderAssignable;
