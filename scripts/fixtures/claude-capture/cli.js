'use strict';
const { spawn } = require('node:child_process');
const path = require('node:path');
if (process.argv.includes('--version') || process.argv.includes('-v')) { console.log('2.1.112 (Claude Code)'); process.exit(0); }
const endpoint = new URL(process.env.SHINEAI_CLAUDE_CAPTURE_URL || process.env.ANTHROPIC_BASE_URL);
if (endpoint.protocol !== 'http:' || endpoint.hostname !== '127.0.0.1') throw new Error('Capture CLI requires a loopback endpoint');
const args = process.argv.slice(2);
let settings = {};
for (const flag of ['--setting-sources', '--settings']) {
  const index = args.indexOf(flag);
  if (index >= 0) {
    if (flag === '--settings') settings = JSON.parse(args[index + 1]);
    args.splice(index, 2);
  }
}
const env = { ...process.env, ANTHROPIC_BASE_URL: endpoint.href, ANTHROPIC_API_KEY: 'local-test-only', ANTHROPIC_AUTH_TOKEN: '', CLAUDE_CODE_OAUTH_TOKEN: '', CLAUDE_CONFIG_DIR: process.env.SHINEAI_CLAUDE_CAPTURE_DIR || path.join(process.cwd(), '.claude-capture'), CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1', DISABLE_TELEMETRY: '1', DISABLE_ERROR_REPORTING: '1' };
settings.env = { ...settings.env, ANTHROPIC_BASE_URL: env.ANTHROPIC_BASE_URL, ANTHROPIC_API_KEY: env.ANTHROPIC_API_KEY, ANTHROPIC_AUTH_TOKEN: '', CLAUDE_CODE_OAUTH_TOKEN: '' };
const cli = path.resolve(__dirname, '../../../node_modules/@anthropic-ai/claude-agent-sdk/cli.js');
const child = spawn(process.execPath, [cli, ...args, '--setting-sources', '', '--settings', JSON.stringify(settings)], { env, stdio: 'inherit', windowsHide: true });
child.on('error', error => { console.error(error.message); process.exit(1); });
child.on('exit', code => process.exit(code ?? 1));
