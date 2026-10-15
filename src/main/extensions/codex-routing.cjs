'use strict';
const fs = require('node:fs');
const path = require('node:path');
const routingKey = /^\s*(model_provider|openai_base_url)\s*=/;
function topLevel(toml) {
  const lines = toml.split(/\r?\n/);
  const boundary = lines.findIndex(line => /^\s*\[/.test(line));
  return boundary < 0 ? lines : lines.slice(0, boundary);
}
function restoreInheritedRouting(generated, inherited) {
  // Remove only session routing overrides, then restore the user's selected provider.
  const lines = generated.split(/\r?\n/);
  const boundary = lines.findIndex(line => /^\s*\[/.test(line));
  const head = lines.slice(0, boundary < 0 ? lines.length : boundary).filter(line => !routingKey.test(line));
  head.push(...topLevel(inherited).filter(line => routingKey.test(line)));
  let tail = boundary < 0 ? '' : lines.slice(boundary).join('\n');
  if (!/^\s*\[model_providers\.shineai\]/m.test(inherited)) tail = tail.replace(/(^|\n)\[model_providers\.shineai\][\s\S]*?(?=\n\[|$)/g, '');
  return head.join('\n') + '\n' + tail;
}
function restoreFromUserHome(generated, sourceHome) {
  let inherited = '';
  try { inherited = fs.readFileSync(path.join(sourceHome, 'config.toml'), 'utf8'); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  return restoreInheritedRouting(generated, inherited);
}
module.exports = { restoreInheritedRouting, restoreFromUserHome };
