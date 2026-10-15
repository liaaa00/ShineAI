/**
 * macOS desktop tools — thin bridge to the persistent Swift daemon.
 * All operations route through DaemonClient Unix socket IPC.
 */
import { registerTool } from './registry.js';
import { toolSchemas, jsonSchemaOf } from './tool-contracts.js';
import { getDaemonClient } from '../helpers/DarwinHelper.js';
import { embedAnnotatedScreenshot, imageContentFromFile } from '../helpers/SoMRenderer.js';
import { DaemonError } from '../helpers/ipc/protocol.js';
function textContent(text) {
    return { type: 'text', text };
}
function errorResult(message) {
    return { isError: true, content: [textContent(message)] };
}
async function tryCall(client, op, params, timeoutMs) {
    try {
        return await client.call(op, params, timeoutMs);
    }
    catch (err) {
        if (err instanceof DaemonError && err.code === 'eOpUnsupported') {
            return null;
        }
        throw err;
    }
}
async function handleDescribeScreen(client, args) {
    const detectParams = {};
    if (args.target?.window_id)
        detectParams.windowId = args.target.window_id;
    if (args.target?.app_name)
        detectParams.appName = args.target.app_name;
    if (args.target?.app_bundle_id)
        detectParams.bundleId = args.target.app_bundle_id;
    if (args.display_index != null)
        detectParams.displayIndex = args.display_index;
    if (args.allow_web_focus != null)
        detectParams.allowWebFocus = args.allow_web_focus;
    if (args.mode)
        detectParams.mode = args.mode;
    const detectResult = await tryCall(client, 'detectElements', detectParams);
    if (detectResult) {
        const uiElements = (detectResult.elements ?? []).map((el) => ({
            id: el.id,
            role: el.role,
            label: el.label || el.title || el.description || '',
            is_actionable: el.isActionable ?? false,
            source: el.id?.startsWith('vis_') ? 'vis' : el.id?.startsWith('cdp_') ? 'cdp' : 'ax',
        }));
        const content = await embedAnnotatedScreenshot({
            rawPath: detectResult.screenshotPath,
            annotatedPath: detectResult.annotatedPath || undefined,
            uiElements,
            applicationName: detectResult.applicationName || undefined,
            windowTitle: detectResult.windowTitle || undefined,
            snapshotId: detectResult.snapshotId,
            warnings: detectResult.warnings || [],
            includeImage: args.annotated !== false,
        });
        return { content };
    }
    const captureParams = {};
    if (args.display_index != null)
        captureParams.displayIndex = args.display_index;
    if (args.capture_area) {
        const area = args.capture_area;
        const areaResult = await client.call('captureArea', {
            x: area.x,
            y: area.y,
            width: area.width,
            height: area.height,
        });
        const img = await imageContentFromFile(areaResult.path);
        return {
            content: [
                textContent('Screen captured (element detection unavailable — T6 in progress).\n' +
                    `Dimensions: ${areaResult.width}x${areaResult.height}`),
                img,
            ],
        };
    }
    const captureResult = await client.call('captureScreen', captureParams);
    const img = await imageContentFromFile(captureResult.path);
    return {
        content: [
            textContent('Screen captured (element detection unavailable — T6 in progress).\n' +
                `Dimensions: ${captureResult.width}x${captureResult.height}\n` +
                'Use x/y coordinate mode for click operations.'),
            img,
        ],
    };
}
async function handleClick(client, args) {
    const button = args.button ?? 'left';
    const clickCount = args.click_type === 'double' ? 2 : 1;
    const modifiers = args.modifiers ?? [];
    if (args.element_id && args.snapshot_id) {
        const snapshotResult = await tryCall(client, 'getSnapshot', { snapshotId: args.snapshot_id });
        if (!snapshotResult) {
            return errorResult('Snapshot APIs not yet implemented (T6 in progress). Use x/y coordinate mode.');
        }
        const element = (snapshotResult.elements ?? []).find((el) => el.id === args.element_id);
        if (!element) {
            return errorResult(`Element "${args.element_id}" not found in snapshot "${args.snapshot_id}".`);
        }
        const result = await client.call('click', {
            snapshotId: args.snapshot_id,
            elementId: args.element_id,
            button,
            clickCount,
            modifiers,
        });
        const method = result.method ? ` via ${result.method}` : '';
        return {
            content: [
                textContent(`Clicked element [${args.element_id}] (${element.role}) at (${result.clickedAt.x}, ${result.clickedAt.y})${method}.`),
            ],
        };
    }
    if (args.query && args.snapshot_id) {
        const waitResult = await tryCall(client, 'waitForElement', {
            snapshotId: args.snapshot_id,
            query: args.query,
            timeoutMs: 3000,
        });
        if (!waitResult) {
            return errorResult('Element query APIs not yet implemented (T6 in progress). Use x/y coordinate mode.');
        }
        if (!waitResult.found || !waitResult.element) {
            return errorResult(`Element matching query not found in snapshot "${args.snapshot_id}".`);
        }
        const el = waitResult.element;
        const result = await client.call('click', {
            snapshotId: args.snapshot_id,
            elementId: el.id,
            button,
            clickCount,
            modifiers,
        });
        const method = result.method ? ` via ${result.method}` : '';
        return {
            content: [
                textContent(`Clicked element [${el.id}] (${el.role}) at (${result.clickedAt.x}, ${result.clickedAt.y})${method}.`),
            ],
        };
    }
    if (args.x != null && args.y != null) {
        const result = await client.call('click', {
            x: args.x,
            y: args.y,
            button,
            clickCount,
            modifiers,
        });
        const method = result.method ? ` via ${result.method}` : '';
        const content = [
            textContent(`Clicked at (${result.clickedAt.x}, ${result.clickedAt.y})${method}.`),
        ];
        try {
            const verifyCapture = await client.call('captureArea', {
                x: args.x - 150,
                y: args.y - 150,
                width: 300,
                height: 300,
            });
            const verifyImg = await imageContentFromFile(verifyCapture.path);
            content.push(verifyImg);
        }
        catch {
            // verification screenshot optional
        }
        return { content };
    }
    return errorResult('click requires element_id+snapshot_id, query+snapshot_id, or x+y coordinates.');
}
async function handleTypeText(client, args) {
    const params = {
        text: args.text,
    };
    if (args.clear_existing)
        params.clearExisting = args.clear_existing;
    if (args.delay_ms_per_char)
        params.delayMsPerChar = args.delay_ms_per_char;
    if (args.snapshot_id)
        params.snapshotId = args.snapshot_id;
    if (args.element_id)
        params.elementId = args.element_id;
    const result = await client.call('type', params);
    const method = result.method ? ` via ${result.method}` : '';
    return {
        content: [textContent(`Typed ${result.typedChars} character(s)${method}.`)],
    };
}
async function handleHotkey(client, args) {
    const params = { keys: args.keys };
    if (args.hold_ms != null)
        params.holdMs = args.hold_ms;
    await client.call('hotkey', params);
    return {
        content: [textContent(`Pressed hotkey: ${args.keys.join('+')}.`)],
    };
}
async function handleScroll(client, args) {
    const params = {
        direction: args.direction,
        amount: args.amount,
    };
    if (args.x != null)
        params.x = args.x;
    if (args.y != null)
        params.y = args.y;
    await client.call('scroll', params);
    return {
        content: [textContent(`Scrolled ${args.direction} by ${args.amount}.`)],
    };
}
async function handleListApps(client) {
    const result = await client.call('listApplications', {});
    const apps = (result.applications ?? []).map((app) => ({
        pid: app.pid,
        bundle_id: app.bundleId,
        name: app.name,
        is_active: app.isActive,
    }));
    return {
        content: [
            textContent(`Found ${apps.length} running application(s):\n` +
                apps
                    .map((a) => `• ${a.name} (${a.bundle_id}) pid=${a.pid}${a.is_active ? ' [active]' : ''}`)
                    .join('\n')),
        ],
    };
}
async function handleActivateApp(client, args) {
    const params = {};
    if (args.bundle_id)
        params.bundleId = args.bundle_id;
    if (args.name) {
        const listResult = await client.call('listApplications', {});
        const match = (listResult.applications ?? []).find((app) => app.name.toLowerCase() === args.name.toLowerCase());
        if (match) {
            params.pid = match.pid;
        }
        else if (!args.bundle_id) {
            return errorResult(`Application "${args.name}" not found in running applications.`);
        }
    }
    await client.call('activateApplication', params);
    return {
        content: [textContent(`Activated application${args.name ? ` "${args.name}"` : ''}.`)],
    };
}
function makeHandler(name) {
    return async (rawArgs) => {
        const parsed = toolSchemas[name].input.safeParse(rawArgs);
        if (!parsed.success) {
            const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
            return errorResult(`Invalid arguments:\n${issues.join('\n')}`);
        }
        const args = parsed.data;
        const client = await getDaemonClient();
        try {
            switch (name) {
                case 'describe_screen':
                    return await handleDescribeScreen(client, args);
                case 'click':
                    return await handleClick(client, args);
                case 'type_text':
                    return await handleTypeText(client, args);
                case 'hotkey':
                    return await handleHotkey(client, args);
                case 'scroll':
                    return await handleScroll(client, args);
                case 'list_apps':
                    return await handleListApps(client);
                case 'activate_app':
                    return await handleActivateApp(client, args);
                default:
                    return errorResult(`Unhandled tool: ${name}`);
            }
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            return errorResult(`${name} failed: ${msg}`);
        }
    };
}
const TOOL_ANNOTATIONS = {
    describe_screen: { readOnlyHint: true },
    list_apps: { readOnlyHint: true },
    click: { destructiveHint: false },
    type_text: { destructiveHint: false },
    hotkey: { destructiveHint: false },
    scroll: { destructiveHint: false },
    activate_app: { destructiveHint: false },
};
export async function registerDarwinDesktopTools() {
    const names = Object.keys(toolSchemas);
    for (const name of names) {
        const { description } = toolSchemas[name];
        const schema = jsonSchemaOf(name);
        registerTool(name, description, schema, makeHandler(name), TOOL_ANNOTATIONS[name]);
    }
}
