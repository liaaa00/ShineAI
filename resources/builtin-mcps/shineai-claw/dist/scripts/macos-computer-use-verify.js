#!/usr/bin/env node
import { createMacOSAccessibilityProvider, } from '../computer-use/providers/macos/index.js';
function parseArgs(argv) {
    const args = {
        text: 'ShineAI macOS AX verification',
        maxDepth: 6,
        maxCount: 160,
        runActions: false,
        allowFirstActionable: false,
    };
    for (let i = 0; i < argv.length; i += 1) {
        const token = argv[i];
        const next = argv[i + 1];
        const take = () => {
            if (next == null || next.startsWith('--'))
                throw new Error(`${token} requires a value`);
            i += 1;
            return next;
        };
        switch (token) {
            case '--bundle-id':
            case '--bundleId':
                args.bundleId = take();
                break;
            case '--process-name':
            case '--processName':
                args.processName = take();
                break;
            case '--pid':
                args.pid = Number(take());
                break;
            case '--window-title':
            case '--windowTitle':
                args.windowTitle = take();
                break;
            case '--selector-json':
                args.selector = JSON.parse(take());
                break;
            case '--press-selector-json':
                args.pressSelector = JSON.parse(take());
                break;
            case '--setvalue-selector-json':
            case '--set-value-selector-json':
                args.setValueSelector = JSON.parse(take());
                break;
            case '--text':
                args.text = take();
                break;
            case '--max-depth':
                args.maxDepth = Number(take());
                break;
            case '--max-count':
                args.maxCount = Number(take());
                break;
            case '--run-actions':
                args.runActions = true;
                break;
            case '--allow-first-actionable':
                args.allowFirstActionable = true;
                break;
            case '--help':
                printUsageAndExit();
                break;
            default:
                if (token.startsWith('--'))
                    throw new Error(`Unknown argument: ${token}`);
        }
    }
    return args;
}
function printUsageAndExit() {
    console.log(`Usage:
  node dist/scripts/macos-computer-use-verify.js [options]

Read-only smoke:
  node dist/scripts/macos-computer-use-verify.js --processName Finder

Find selector:
  node dist/scripts/macos-computer-use-verify.js --processName TextEdit --selector-json '{"AXRole":"AXTextArea"}'

Action smoke; requires explicit selectors and macOS permissions:
  node dist/scripts/macos-computer-use-verify.js --processName TextEdit --run-actions \\
    --setvalue-selector-json '{"AXRole":"AXTextArea"}' --text 'ShineAI verification'

Options:
  --bundle-id, --process-name, --pid, --window-title
  --selector-json              selector for findElement coverage
  --press-selector-json        selector used for press/invoke when --run-actions is set
  --setvalue-selector-json     selector used for setValue when --run-actions is set
  --allow-first-actionable     allow press fallback to first actionable element; off by default to avoid accidental clicks
  --max-depth, --max-count
`);
    process.exit(0);
}
function baseSelector(args) {
    const selector = {};
    if (args.bundleId)
        selector.bundleId = args.bundleId;
    if (args.processName)
        selector.processName = args.processName;
    if (args.pid != null && Number.isFinite(args.pid))
        selector.pid = args.pid;
    if (args.windowTitle)
        selector.windowTitle = args.windowTitle;
    return selector;
}
function mergeSelector(base, extra) {
    return { ...base, ...(extra ?? {}) };
}
function summarizeElement(element) {
    if (!element)
        return null;
    return {
        id: element.id,
        role: element.role,
        label: element.label,
        title: element.title,
        identifier: element.identifier,
        path: element.path,
        bounds: element.bounds,
        actionable: element.actionable,
    };
}
function summarizeTree(tree) {
    const firstActionable = tree.flatElements.find((el) => el.actionable);
    const firstText = tree.flatElements.find((el) => ['AXTextField', 'AXTextArea', 'AXSearchField', 'AXComboBox'].includes(el.role));
    return {
        snapshotId: tree.snapshotId,
        app: tree.app,
        window: tree.window,
        elementCount: tree.flatElements.length,
        warningCount: tree.warnings.length,
        firstActionable: summarizeElement(firstActionable),
        firstText: summarizeElement(firstText),
        warnings: tree.warnings,
    };
}
async function pushStage(stages, name, expected, fn) {
    try {
        const detail = await fn();
        stages.push({ name, status: 'pass', expected, detail });
        return detail;
    }
    catch (error) {
        stages.push({
            name,
            status: 'fail',
            expected,
            error: error instanceof Error ? error.message : String(error),
            hints: hintsForFailure(error),
        });
        return null;
    }
}
function hintsForFailure(error) {
    const message = error instanceof Error ? error.message : String(error);
    const lower = message.toLowerCase();
    const hints = [];
    if (lower.includes('permission') || lower.includes('not authorized') || lower.includes('denied')) {
        hints.push('Check Accessibility, Screen Recording, and Automation grants for the launching terminal/helper.');
    }
    if (lower.includes('daemon') || lower.includes('socket') || lower.includes('connect')) {
        hints.push('Start or rebuild the Swift daemon/helper; verify build: npm run build:swift on macOS.');
    }
    if (lower.includes('not found')) {
        hints.push('Confirm the target app is running and the selector matches visible AX attributes.');
    }
    if (hints.length === 0)
        hints.push('See docs/computer-use-macos-tcc-runbook.md failure mapping.');
    return hints;
}
function ensureOk(result, label) {
    if (!result.ok)
        throw new Error(`${label}: ${result.error}`);
    return result.data;
}
async function main() {
    const args = parseArgs(process.argv.slice(2));
    const provider = createMacOSAccessibilityProvider();
    const stages = [];
    const capability = await provider.getCapabilityReport();
    stages.push({
        name: 'capability-report',
        status: provider.isSupported() ? 'pass' : 'skip',
        expected: provider.isSupported()
            ? 'supported=true and permission statuses are readable or unknown'
            : 'non-macOS returns supported=false without touching darwin-only APIs',
        detail: capability,
    });
    if (!provider.isSupported()) {
        console.log(JSON.stringify({
            ok: true,
            mode: 'unsupported-platform',
            platform: process.platform,
            stages,
            expectedOutput: {
                supported: false,
                unsupportedSafePath: true,
            },
        }, null, 2));
        return;
    }
    const targetSelector = baseSelector(args);
    const apps = await pushStage(stages, 'list-apps', 'running regular apps are returned', async () => {
        const result = await provider.listApps();
        const data = ensureOk(result, 'listApps');
        return { count: data.length, active: data.find(app => app.isActive), targetMatches: data.filter(app => {
                if (targetSelector.pid != null && app.pid !== targetSelector.pid)
                    return false;
                if (targetSelector.bundleId && app.bundleId !== targetSelector.bundleId)
                    return false;
                if (targetSelector.processName && !app.processName.toLowerCase().includes(targetSelector.processName.toLowerCase()))
                    return false;
                return true;
            }) };
    });
    const selectedApp = targetSelector.pid || targetSelector.bundleId || targetSelector.processName
        ? apps?.targetMatches?.[0]
        : apps?.active;
    const effectiveSelector = mergeSelector(targetSelector, selectedApp ? { pid: selectedApp.pid, processName: selectedApp.processName, bundleId: selectedApp.bundleId } : {});
    await pushStage(stages, 'list-windows', 'target app windows are readable via CGWindow/AX metadata', async () => {
        const result = await provider.listWindows(effectiveSelector);
        const data = ensureOk(result, 'listWindows');
        return { count: data.length, windows: data.slice(0, 5) };
    });
    const tree = await pushStage(stages, 'read-ax-tree', 'AX tree returns snapshotId and flatElements without requiring screenshot-only targeting', async () => {
        const result = await provider.readTree(effectiveSelector, { maxDepth: args.maxDepth, maxCount: args.maxCount, includeVisionFallback: false });
        const data = ensureOk(result, 'readTree');
        return summarizeTree(data);
    });
    const findSelector = mergeSelector(effectiveSelector, args.selector);
    if (args.selector) {
        await pushStage(stages, 'find-ax-selector', 'explicit selector resolves to a semantic ElementNode or reports not found', async () => {
            const result = await provider.findElement(findSelector, { maxDepth: args.maxDepth, maxCount: args.maxCount });
            const data = ensureOk(result, 'findElement');
            return { found: Boolean(data), element: summarizeElement(data?.element), snapshotId: data?.snapshot.snapshotId };
        });
    }
    else if (tree?.firstActionable) {
        stages.push({
            name: 'find-ax-selector',
            status: 'skip',
            expected: 'pass --selector-json to validate a known selector; fixture uses firstActionable only as an example',
            detail: { suggestedSelector: tree.firstActionable },
        });
    }
    if (!args.runActions) {
        stages.push({
            name: 'focus-press-setvalue-actions',
            status: 'skip',
            expected: 'pass --run-actions plus explicit selectors to execute focus/press/setValue and post-action verification',
            detail: {
                safeDefault: 'read-only mode avoids accidental clicks or text edits',
                setValueExample: '--processName TextEdit --run-actions --setvalue-selector-json {"AXRole":"AXTextArea"}',
            },
        });
    }
    else {
        await runActionStages(stages, provider, effectiveSelector, args, tree);
    }
    const failed = stages.some(stage => stage.status === 'fail');
    console.log(JSON.stringify({
        ok: !failed,
        mode: args.runActions ? 'macos-action-verification' : 'macos-readonly-verification',
        platform: process.platform,
        targetSelector: effectiveSelector,
        stages,
    }, null, 2));
    if (failed)
        process.exitCode = 1;
}
async function runActionStages(stages, provider, base, args, treeSummary) {
    await pushStage(stages, 'focus-window-or-app', 'focus action returns window-state verification or unknown without throwing', async () => {
        const focusAction = { name: 'focus', selector: base, verify: true };
        const result = await provider.executeAction(focusAction);
        const data = ensureOk(result, 'focus');
        return data;
    });
    const pressSelector = args.pressSelector
        ? mergeSelector(base, args.pressSelector)
        : args.allowFirstActionable && treeSummary?.firstActionable
            ? mergeSelector(base, { path: treeSummary.firstActionable.path, AXRole: treeSummary.firstActionable.role })
            : null;
    if (pressSelector) {
        await pushStage(stages, 'press-or-invoke', 'press executes through AXPress when possible and reports post-action verification', async () => {
            const action = { name: 'press', selector: pressSelector, verify: true };
            const result = await provider.executeAction(action);
            const data = ensureOk(result, 'press');
            return summarizeAction(data);
        });
    }
    else {
        stages.push({
            name: 'press-or-invoke',
            status: 'skip',
            expected: 'pass --press-selector-json or --allow-first-actionable to execute press; explicit selector is recommended',
            hints: ['Avoid pressing unknown buttons in production apps. Use TextEdit/Finder fixture commands from the runbook.'],
        });
    }
    const setValueSelector = args.setValueSelector ? mergeSelector(base, args.setValueSelector) : null;
    if (setValueSelector) {
        await pushStage(stages, 'set-value-or-type', 'setValue reports AX value verification or HID fallback with warning', async () => {
            const action = {
                name: 'setValue',
                selector: setValueSelector,
                value: args.text,
                clearExisting: true,
                verify: true,
            };
            const result = await provider.executeAction(action);
            const data = ensureOk(result, 'setValue');
            return summarizeAction(data);
        });
    }
    else {
        stages.push({
            name: 'set-value-or-type',
            status: 'skip',
            expected: 'pass --setvalue-selector-json to execute text setting against a known text field',
            hints: ['TextEdit is the safest manual fixture: --processName TextEdit --setvalue-selector-json {"AXRole":"AXTextArea"}.'],
        });
    }
}
function summarizeAction(action) {
    return {
        ok: action.ok,
        action: action.action,
        method: action.method,
        requiresForeground: action.requiresForeground,
        visionFallbackNeeded: action.visionFallbackNeeded,
        verification: action.verification,
        target: summarizeElement(action.target),
        warnings: action.warnings,
    };
}
main().catch(error => {
    console.error(JSON.stringify({
        ok: false,
        error: error instanceof Error ? error.message : String(error),
        hints: hintsForFailure(error),
    }, null, 2));
    process.exitCode = 1;
});
