'use strict';
const { isDeepStrictEqual } = require('node:util');

function normalizeMcp(input) {
  if (!input || typeof input.id !== 'string' || !input.id.trim() || typeof input.name !== 'string' || !input.name.trim()) throw new Error('MCP 缺少名称或标识');
  const config = { category:'custom', transport:'stdio', compatibleProviders:'all', fallbackMode:'disabled', installMethod:'manual', source:'custom', isGlobalEnabled:false, ...input };
  if (!['stdio','http','sse'].includes(config.transport)) throw new Error('MCP 连接方式无效');
  if (config.transport === 'stdio' && (typeof config.command !== 'string' || !config.command.trim())) throw new Error('MCP 配置不完整：请填写启动命令');
  if (config.transport !== 'stdio') {
    let url;
    try { url = new URL(config.url); } catch { throw new Error('MCP 配置不完整：请填写 HTTP 服务地址'); }
    if (!['http:','https:'].includes(url.protocol)) throw new Error('MCP 服务地址必须为 HTTP 或 HTTPS');
  }
  if (config.args && (!Array.isArray(config.args) || config.args.some(arg => typeof arg !== 'string'))) throw new Error('MCP 启动参数格式无效');
  if (config.envVars && (typeof config.envVars !== 'object' || Array.isArray(config.envVars) || Object.entries(config.envVars).some(([key,value]) => !/^[A-Za-z_][A-Za-z0-9_]*$/.test(key) || typeof value !== 'string'))) throw new Error('MCP 环境变量格式无效');
  return config;
}

function saveMcp(database, input, id) {
  const previous = id ? database.getMcp(id) : undefined;
  if (id && !previous) throw new Error('MCP 服务器不存在');
  const config = normalizeMcp(id ? {...previous,...input,id} : input);
  if (!id && database.getMcp(config.id)) throw new Error('MCP 标识已存在，请编辑现有配置');
  if (id) database.updateMcp(id,config); else database.createMcp(config);
  const saved = database.getMcp(config.id);
  if (!saved) throw new Error('MCP 配置未保存成功');
  for (const key of ['name','transport','command','args','url','envVars','headers','isGlobalEnabled']) {
    if (config[key] !== undefined && !isDeepStrictEqual(saved[key],config[key])) throw new Error('MCP 配置未完整保存，请重试');
  }
  return saved;
}

function toggleMcp(database,id,enabled) {
  const previous = database.getMcp(id);
  if (!previous) throw new Error('MCP 服务器不存在');
  if (typeof enabled !== 'boolean') throw new Error('MCP 启用状态无效');
  if (enabled) normalizeMcp(previous);
  database.toggleMcp(id,enabled);
  const saved = database.getMcp(id);
  if (!saved || saved.isGlobalEnabled !== enabled) throw new Error('MCP 启用状态未保存成功');
  return saved;
}
module.exports = { normalizeMcp, saveMcp, toggleMcp };
