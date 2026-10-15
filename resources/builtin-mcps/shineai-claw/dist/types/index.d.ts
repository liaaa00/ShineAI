export interface ToolDefinition {
    name: string;
    description: string;
    annotations?: {
        title?: string;
        readOnlyHint?: boolean;
        destructiveHint?: boolean;
        idempotentHint?: boolean;
        openWorldHint?: boolean;
    };
    inputSchema: {
        type: 'object';
        properties: Record<string, unknown>;
        required?: string[];
        additionalProperties?: boolean;
    };
}
export interface CallToolResult {
    [key: string]: unknown;
    content: Array<{
        type: string;
        text?: string;
        data?: string;
        mimeType?: string;
    }>;
    isError?: boolean;
    structuredContent?: Record<string, unknown>;
}
export type ToolHandler = (args: Record<string, unknown>) => Promise<CallToolResult>;
