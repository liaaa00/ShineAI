#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { registerTool, listTools, callTool } from './tools/registry.js';
import { registerDesktopTools } from './tools/desktop-tools.js';
import { registerShellTools } from './tools/shell-tools.js';
import { registerFileTools } from './tools/file-tools.js';
import { registerBrowserComputerUseTools } from './computer-use/providers/browser/index.js';
import { shell } from './helpers/PersistentShell.js';
const server = new Server({ name: 'shineai-claw', version: '0.1.0' }, { capabilities: { tools: {} } });
// Register built-in ping tool for connectivity verification
registerTool('ping', 'Connectivity check — returns pong', {
    type: 'object',
    properties: {},
    additionalProperties: false,
}, async () => ({
    content: [{ type: 'text', text: JSON.stringify({ status: 'pong', timestamp: Date.now() }) }],
}), { title: 'Ping', readOnlyHint: true, destructiveHint: false, idempotentHint: true });
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: listTools() };
});
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    return await callTool(name, (args ?? {}));
});
async function main() {
    // Register all tool modules (desktop tools is async for cross-platform dynamic import)
    await registerDesktopTools();
    registerShellTools();
    registerFileTools();
    registerBrowserComputerUseTools();
    // Only bootstrap PersistentShell on Windows — macOS uses DarwinHelper instead
    if (process.platform === 'win32') {
        shell.start().catch(() => { });
    }
    const transport = new StdioServerTransport();
    await server.connect(transport);
}
main().catch((error) => {
    console.error('[shineai-claw] Fatal:', error);
    process.exit(1);
});
