#!/usr/bin/env node
import { createMacOSAccessibilityProvider } from '../computer-use/providers/macos/index.js';
async function main() {
    const provider = createMacOSAccessibilityProvider();
    const capability = await provider.getCapabilityReport();
    const report = {
        provider: provider.id,
        platform: process.platform,
        supported: provider.isSupported(),
        capability,
    };
    if (!provider.isSupported()) {
        report.smoke = {
            ok: true,
            mode: 'unsupported-platform',
            note: 'macOS AX provider loaded successfully and returned unsupported without touching darwin-only APIs.',
        };
        console.log(JSON.stringify(report, null, 2));
        return;
    }
    const apps = await provider.listApps();
    report.apps = apps;
    const activeApp = apps.ok ? apps.data.find(app => app.isActive) ?? apps.data[0] : undefined;
    if (activeApp) {
        report.windows = await provider.listWindows({ pid: activeApp.pid });
        report.tree = await provider.readTree({ pid: activeApp.pid }, { maxDepth: 4, maxCount: 80 });
    }
    console.log(JSON.stringify(report, null, 2));
}
main().catch(error => {
    console.error(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }, null, 2));
    process.exitCode = 1;
});
