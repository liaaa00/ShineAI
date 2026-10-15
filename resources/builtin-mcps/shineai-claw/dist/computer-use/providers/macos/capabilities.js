function statusOf(value, platform) {
    if (platform !== 'darwin')
        return 'not-applicable';
    if (value == null)
        return 'unknown';
    return value ? 'granted' : 'missing';
}
export function createMacOSCapabilityReport(platform = process.platform, permissions = {}) {
    const supported = platform === 'darwin';
    const accessibilityGranted = permissions.accessibility !== false;
    const screenRecordingGranted = permissions.screenRecording !== false;
    const permissionsRequired = [
        {
            name: 'Accessibility',
            required: true,
            status: statusOf(permissions.accessibility, platform),
            requiredFor: [
                'AXUIElement tree reads',
                'AXPress / AXSetValue semantic actions',
                'System Events UI scripting',
                'CGEvent HID fallback posting',
            ],
            notes: 'Grant to the signed helper or terminal host that launches shineai-claw. Without it, AX reads/actions fail with TCC permission errors.',
        },
        {
            name: 'Screen Recording',
            required: false,
            status: statusOf(permissions.screenRecording, platform),
            requiredFor: [
                'ScreenCaptureKit / CGWindow screenshot fallback',
                'vision/OCR fallback verification',
                'annotated screenshot reports',
            ],
            notes: 'Needed when AX tree is incomplete, when a visual fallback is requested, or when post-action verification needs a snapshot.',
        },
        {
            name: 'Automation',
            required: false,
            status: statusOf(permissions.automation, platform),
            requiredFor: [
                'osascript/JXA System Events menu selection',
                'AppleScript/JXA application process inspection',
            ],
            notes: 'macOS may prompt per target app when System Events or osascript controls another app. This is not fully preflightable from Node.',
        },
        {
            name: 'Input Monitoring',
            required: false,
            status: statusOf(permissions.inputMonitoring, platform),
            requiredFor: [
                'future low-level keyboard observation',
                'diagnostics around HID fallback',
            ],
            notes: 'Not required for the current semantic AX path; listed as a future helper boundary for richer event verification.',
        },
    ];
    return {
        provider: 'macos-ax',
        platform,
        supported,
        reason: supported ? undefined : 'macOS Accessibility provider is only available on process.platform === "darwin".',
        backgroundRead: supported && accessibilityGranted,
        backgroundInvoke: supported && accessibilityGranted,
        backgroundType: supported && accessibilityGranted,
        requiresForeground: !supported,
        visionFallbackNeeded: supported && !screenRecordingGranted,
        permissionsRequired,
        operations: {
            listApps: {
                supported,
                backgroundCapable: supported,
                requiresForeground: false,
                fallback: 'none',
                notes: 'Uses NSWorkspace via the Swift daemon; does not require the target app to be frontmost.',
            },
            listWindows: {
                supported,
                backgroundCapable: supported,
                requiresForeground: false,
                fallback: 'none',
                notes: 'Uses CGWindowList and AX window metadata; minimized/off-screen windows may expose less state.',
            },
            readTree: {
                supported,
                backgroundCapable: supported && accessibilityGranted,
                requiresForeground: false,
                fallback: 'vision',
                notes: 'AXUIElement can read many background apps. WebViews, Electron apps, secure fields, and virtualized canvases may need CDP or vision fallback.',
            },
            findElement: {
                supported,
                backgroundCapable: supported && accessibilityGranted,
                requiresForeground: false,
                fallback: 'vision',
                notes: 'Matches bundleId/processName/windowTitle/AXRole/AXIdentifier/AXTitle/AXDescription/path/bounds against the latest AX snapshot.',
            },
            focus: {
                supported,
                backgroundCapable: false,
                requiresForeground: true,
                fallback: 'hid',
                notes: 'Application/window focus necessarily changes the foreground app. Element focus via AXFocused is a future Swift helper operation.',
            },
            press: {
                supported,
                backgroundCapable: supported && accessibilityGranted,
                requiresForeground: false,
                fallback: 'hid',
                notes: 'The daemon first attempts AXPress with axPath validation; if unsupported/stale it falls back to center-point HID click, which requires foreground correctness.',
            },
            setValue: {
                supported,
                backgroundCapable: supported && accessibilityGranted,
                requiresForeground: false,
                fallback: 'hid',
                notes: 'AXSetValue can update text controls without activating the app. Secure fields and custom editors usually require foreground HID typing.',
            },
            selectMenu: {
                supported,
                backgroundCapable: false,
                requiresForeground: true,
                fallback: 'jxa',
                notes: 'System menu selection is prototyped with osascript/JXA and System Events. It usually requires the app/menu bar to be frontmost plus Automation permission.',
            },
            visionFallback: {
                supported,
                backgroundCapable: false,
                requiresForeground: true,
                fallback: 'vision',
                notes: 'ScreenCaptureKit/CGWindow snapshots are fallback inputs for visual/OCR selectors and post-action verification when AX cannot prove state.',
            },
        },
    };
}
export const MACOS_AX_BACKGROUND_BOUNDARIES = {
    canStayBackground: [
        'list running apps with NSWorkspace',
        'list windows with CGWindowList',
        'read most AX trees by pid/window without activation',
        'AXPress on controls exposing kAXPressAction',
        'AXSetValue on AXTextField/AXTextArea/AXSearchField/AXComboBox when AXValue is settable',
    ],
    needsForeground: [
        'activate/focus application or window',
        'HID click/type/scroll fallback because events go to the active session',
        'menu-bar selection through System Events/JXA',
        'controls that only materialize children after focus/hover',
    ],
    needsVisionFallback: [
        'canvas/custom-drawn UI without meaningful AX nodes',
        'secure text fields where AXValue is hidden or not settable',
        'web content without enough AX exposure and without Browser/CDP provider access',
        'post-action verification when AX state does not expose a changed value/selection',
    ],
};
