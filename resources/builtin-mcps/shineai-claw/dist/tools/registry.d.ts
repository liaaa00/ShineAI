import type { ToolDefinition, ToolHandler, CallToolResult } from '../types/index.js';
export declare function registerTool(name: string, description: string, inputSchema: ToolDefinition['inputSchema'], handler: ToolHandler, annotations?: ToolDefinition['annotations']): void;
export declare function listTools(): ToolDefinition[];
export declare function callTool(name: string, args: Record<string, unknown>): Promise<CallToolResult>;
export declare function getToolCount(): number;
