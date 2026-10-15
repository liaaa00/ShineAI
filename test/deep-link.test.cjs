const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
test('published community parser accepts the isolated protocol, encoded IDs and versions', () => {
  const source = fs.readFileSync(path.join(__dirname, '../src/main/index.js'), 'utf8');
  const start = source.indexOf('function k9(a02)');
  const end = source.indexOf('let w9=', start);
  assert.ok(start >= 0 && end > start, 'Parser must remain extractable from the recovered bundle');
  const parse = vm.runInNewContext(source.slice(start, end) + ';k9', { a7z: null, URLSearchParams }, { timeout: 1000 });
  assert.deepEqual(JSON.parse(JSON.stringify(parse('claudeops-dev://install/skill/test%20id?version=2'))), { type:'skill', id:'test id', version:'2' });
  assert.equal(parse('claudeops://install/skill/test'), null);
  assert.equal(parse('https://example.com/install/skill/test'), null);
  assert.equal(parse('claudeops-dev://install/skill'), null);
});
