import fs from 'node:fs/promises';
import path from 'node:path';
function resolveMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.png') {
        return 'image/png';
    }
    if (ext === '.jpg' || ext === '.jpeg') {
        return 'image/jpeg';
    }
    throw new Error(`Unsupported image type for MCP embedding: ${filePath}`);
}
function stringifyElementLabel(label) {
    return label.replaceAll('"', '\\"');
}
/**
 * 单纯把图片文件读成 MCP image content（不附带文字）。
 */
export async function imageContentFromFile(filePath) {
    let fileData;
    try {
        fileData = await fs.readFile(filePath);
    }
    catch (error) {
        const details = error instanceof Error ? error.message : String(error);
        throw new Error(`Image file not found or unreadable: ${filePath}. ${details}`);
    }
    return {
        type: 'image',
        data: Buffer.from(fileData).toString('base64'),
        mimeType: resolveMimeType(filePath),
    };
}
/**
 * 把 annotated 截图嵌入 MCP content blocks。
 * 默认返回 [text 描述 + image content + text 元素列表]。
 * includeImage=false 时返回 [text 描述 + text 元素列表]。
 */
export async function embedAnnotatedScreenshot(opts) {
    const includeImage = opts.includeImage ?? true;
    const screenshotPath = opts.annotatedPath || opts.rawPath;
    let screenshotContent = null;
    if (includeImage) {
        const candidatePaths = opts.annotatedPath ? [opts.annotatedPath, opts.rawPath] : [opts.rawPath];
        let lastError = null;
        for (const candidatePath of candidatePaths) {
            try {
                screenshotContent = await imageContentFromFile(candidatePath);
                break;
            }
            catch (error) {
                lastError = error;
            }
        }
        if (!screenshotContent) {
            if (lastError instanceof Error) {
                throw lastError;
            }
            throw new Error('Failed to load screenshot for MCP embedding.');
        }
    }
    const summaryLines = ['UI snapshot captured.', `snapshot_id: ${opts.snapshotId}`];
    if (opts.applicationName) {
        summaryLines.push(`application: ${opts.applicationName}`);
    }
    if (opts.windowTitle) {
        summaryLines.push(`window: ${opts.windowTitle}`);
    }
    if (opts.warnings && opts.warnings.length > 0) {
        summaryLines.push(`warnings: ${opts.warnings.join(' | ')}`);
    }
    if (!includeImage) {
        summaryLines.push(`screenshot_path: ${screenshotPath}`);
    }
    const actionableElements = opts.uiElements.filter((item) => item.is_actionable);
    const elementLines = ['Actionable elements:'];
    if (actionableElements.length === 0) {
        elementLines.push('(none)');
    }
    else {
        for (const item of actionableElements) {
            elementLines.push(`[${item.id}] ${item.role} "${stringifyElementLabel(item.label)}"`);
        }
    }
    const content = [
        {
            type: 'text',
            text: summaryLines.join('\n'),
        },
    ];
    if (includeImage && screenshotContent) {
        content.push(screenshotContent);
    }
    content.push({
        type: 'text',
        text: elementLines.join('\n'),
    });
    return content;
}
