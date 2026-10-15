const tools = new Map();
export function registerTool(name, description, inputSchema, handler, annotations) {
    if (tools.has(name)) {
        throw new Error(`Tool already registered: ${name}`);
    }
    tools.set(name, {
        definition: { name, description, inputSchema, annotations },
        handler,
    });
}
export function listTools() {
    return Array.from(tools.values()).map(t => t.definition);
}
export async function callTool(name, args) {
    const tool = tools.get(name);
    if (!tool) {
        return {
            isError: true,
            content: [{ type: 'text', text: `Unknown tool: ${name}` }],
        };
    }
    try {
        return await tool.handler(args);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
            isError: true,
            content: [{ type: 'text', text: message }],
        };
    }
}
export function getToolCount() {
    return tools.size;
}
