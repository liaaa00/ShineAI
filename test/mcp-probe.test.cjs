const {test} = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const {probeMcp} = require('../src/main/extensions/mcp-probe.cjs');
test('MCP tests validate initialization and tool lists instead of accepting any JSON result',async()=>{
  const fixture=path.resolve(__dirname,'../scripts/fixtures/mcp-probe.cjs');
  assert.equal(await probeMcp(process.execPath,[fixture,'valid'],process.env),1);
  await assert.rejects(probeMcp(process.execPath,[fixture,'bad-init'],process.env),/初始化响应无效/);
  await assert.rejects(probeMcp(process.execPath,[fixture,'bad-tools'],process.env),/工具列表响应无效/);
});
