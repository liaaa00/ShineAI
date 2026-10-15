import * as fs from 'fs';
import * as path from 'path';
import { registerTool } from './registry.js';
import { PolicyEngine } from '../security/PolicyEngine.js';
function textResult(data) {
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
}
function errorResult(message) {
    return { isError: true, content: [{ type: 'text', text: message }] };
}
export function registerFileTools() {
    registerTool('file_read', '读取文件内容，支持文本和二进制（base64）', {
        type: 'object',
        properties: {
            path: { type: 'string', description: '文件路径' },
            encoding: { type: 'string', description: '编码（默认 utf-8）' },
            max_lines: { type: 'number', description: '最大读取行数（可选）' },
        },
        required: ['path'],
    }, async (args) => {
        const filePath = args.path;
        const encoding = args.encoding || 'utf-8';
        const maxLines = args.max_lines;
        const validation = PolicyEngine.validateFilePath(filePath, 'read');
        if (!validation.allowed)
            return errorResult(`Read blocked: ${validation.reason}`);
        const resolved = path.resolve(filePath);
        try {
            const stat = await fs.promises.stat(resolved);
            if (!stat.isFile())
                return errorResult(`Not a file: ${resolved}`);
            const content = await fs.promises.readFile(resolved);
            const isBinary = content.includes(0);
            if (isBinary) {
                return textResult({ path: resolved, encoding: 'base64', size: stat.size, content: content.toString('base64') });
            }
            let text = content.toString(encoding);
            if (maxLines && maxLines > 0) {
                text = text.split('\n').slice(0, maxLines).join('\n');
            }
            return textResult({ path: resolved, encoding, size: stat.size, content: text });
        }
        catch (err) {
            return errorResult(err.code === 'ENOENT' ? `File not found: ${resolved}` : err.message);
        }
    }, { title: 'File Read', readOnlyHint: true, destructiveHint: false, idempotentHint: true });
    registerTool('file_write', '写入文件内容，自动创建父目录', {
        type: 'object',
        properties: {
            path: { type: 'string', description: '文件路径' },
            content: { type: 'string', description: '文件内容' },
            encoding: { type: 'string', description: '编码（默认 utf-8）' },
        },
        required: ['path', 'content'],
    }, async (args) => {
        const filePath = args.path;
        const content = args.content;
        const encoding = args.encoding || 'utf-8';
        const validation = PolicyEngine.validateFilePath(filePath, 'write');
        if (!validation.allowed)
            return errorResult(`Write blocked: ${validation.reason}`);
        const resolved = path.resolve(filePath);
        try {
            await fs.promises.mkdir(path.dirname(resolved), { recursive: true });
            await fs.promises.writeFile(resolved, content, { encoding });
            const stat = await fs.promises.stat(resolved);
            return textResult({ path: resolved, size: stat.size, success: true });
        }
        catch (err) {
            return errorResult(err.message);
        }
    }, { title: 'File Write', readOnlyHint: false, destructiveHint: true, idempotentHint: true });
    registerTool('file_list', '列举目录文件，支持 glob 过滤和递归', {
        type: 'object',
        properties: {
            path: { type: 'string', description: '目录路径' },
            pattern: { type: 'string', description: 'glob 过滤模式（如 *.ts）' },
            recursive: { type: 'boolean', description: '是否递归子目录' },
        },
        required: ['path'],
    }, async (args) => {
        const dirPath = args.path;
        const pattern = args.pattern;
        const recursive = args.recursive ?? false;
        const validation = PolicyEngine.validateFilePath(dirPath, 'read');
        if (!validation.allowed)
            return errorResult(`List blocked: ${validation.reason}`);
        const resolved = path.resolve(dirPath);
        try {
            const stat = await fs.promises.stat(resolved);
            if (!stat.isDirectory())
                return errorResult(`Not a directory: ${resolved}`);
            const entries = await collectEntries(resolved, recursive);
            let filtered = entries;
            if (pattern) {
                const regex = globToRegex(pattern);
                filtered = entries.filter((e) => regex.test(e.name));
            }
            return textResult({ path: resolved, count: filtered.length, files: filtered });
        }
        catch (err) {
            return errorResult(err.code === 'ENOENT' ? `Directory not found: ${resolved}` : err.message);
        }
    }, { title: 'File List', readOnlyHint: true, destructiveHint: false, idempotentHint: true });
}
async function collectEntries(dir, recursive) {
    const entries = [];
    const dirents = await fs.promises.readdir(dir, { withFileTypes: true });
    for (const dirent of dirents) {
        const fullPath = path.join(dir, dirent.name);
        try {
            const stat = await fs.promises.stat(fullPath);
            entries.push({
                name: dirent.name,
                path: fullPath,
                size: stat.size,
                modified: stat.mtime.toISOString(),
                isDirectory: dirent.isDirectory(),
            });
            if (recursive && dirent.isDirectory()) {
                entries.push(...await collectEntries(fullPath, true));
            }
        }
        catch { /* skip inaccessible entries */ }
    }
    return entries;
}
function globToRegex(glob) {
    const escaped = glob.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.');
    return new RegExp(`^${escaped}$`, 'i');
}
