export interface MCPImageContent {
    type: 'image';
    data: string;
    mimeType: 'image/png' | 'image/jpeg';
}
export interface MCPTextContent {
    type: 'text';
    text: string;
}
export type MCPContent = MCPImageContent | MCPTextContent;
/**
 * 单纯把图片文件读成 MCP image content（不附带文字）。
 */
export declare function imageContentFromFile(filePath: string): Promise<MCPImageContent>;
/**
 * 把 annotated 截图嵌入 MCP content blocks。
 * 默认返回 [text 描述 + image content + text 元素列表]。
 * includeImage=false 时返回 [text 描述 + text 元素列表]。
 */
export declare function embedAnnotatedScreenshot(opts: {
    rawPath: string;
    annotatedPath?: string;
    uiElements: Array<{
        id: string;
        role: string;
        label: string;
        is_actionable: boolean;
    }>;
    applicationName?: string;
    windowTitle?: string;
    snapshotId: string;
    warnings?: string[];
    includeImage?: boolean;
}): Promise<MCPContent[]>;
