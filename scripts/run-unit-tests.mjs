import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Pass explicit files: Node 20 accepts a directory, whereas Node 24 does not.
const files = fs.readdirSync(path.join(root, 'test')).filter(name => /\.test\.(?:cjs|mjs)$/.test(name)).sort();
if (!files.length) throw Error('No unit test files found');
const result = spawnSync(process.execPath, ['--test', ...files.map(name => path.join(root, 'test', name))], { cwd: root, stdio: 'inherit' });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
