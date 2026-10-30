'use strict';

const fs = require('node:fs');
const path = require('node:path');
function candidate(input) {
  if (typeof input !== 'string' || !path.isAbsolute(input) || input.includes('\0')) return null;
  const match = /^(.*?)[\\/](?:\.shineai-worktrees[\\/](?:integrations[\\/])?|\.claude[\\/]worktrees[\\/])[^\\/]+[\\/](.+)$/i.exec(input);
  if (!match) return null;
  const base = path.resolve(match[1]),
    target = path.resolve(base, match[2]);
  const relative = path.relative(base, target);
  return relative && !relative.startsWith('..' + path.sep) && relative !== '..' && !path.isAbsolute(relative) ? target : null;
}
function resolveMoved(input) {
  if (typeof input !== 'string' || fs.existsSync(input)) return input;
  const target = candidate(input);
  return target && fs.existsSync(target) ? target : input;
}
module.exports = {
  candidate,
  resolveMoved
};
