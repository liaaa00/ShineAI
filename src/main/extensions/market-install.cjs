'use strict';
const { downloadBytes, requireSkillText } = require('./market-download.cjs');

async function installRegistrySkill(item, { database, fetchFile, parseBody }) {
  if (!item || typeof item.id !== 'string' || !item.id.trim() || typeof item.name !== 'string' || !item.name.trim()) throw new Error('技能缺少名称或标识，未安装');
  let body = item.promptTemplate;
  if (!body?.trim() && item.contentUrl) {
    let url;
    try { url = new URL(item.contentUrl); } catch { throw new Error('技能下载地址无效'); }
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('技能下载地址无效');
    const bytes = await downloadBytes(fetchFile, url.href, { timeoutMs: 15000, signal: AbortSignal.timeout(45000) });
    body = parseBody(requireSkillText(bytes.toString('utf8')));
  }
  requireSkillText(body);
  const existing = database.getSkill(item.id);
  const now = new Date().toISOString();
  const skill = { id:item.id, name:item.name.trim(), description:item.description || '', category:item.category || 'general', slashCommand:item.slashCommand || undefined, type:item.type || 'prompt', compatibleProviders:item.compatibleProviders || 'all', promptTemplate:body, systemPromptAddition:item.systemPromptAddition, author:item.author, version:item.version, tags:item.tags, isInstalled:true, isEnabled:existing?.isEnabled ?? true, source:'marketplace', createdAt:existing?.createdAt || now, updatedAt:now };
  if (existing) database.updateSkill(skill.id,skill); else database.createSkill(skill);
  const saved = database.getSkill(skill.id);
  if (saved?.promptTemplate !== body) throw new Error('技能正文未保存成功');
  return { success:true, skill:saved };
}

function marketMcpConfig(item, envVars = {}) {
  if (!item || typeof item.id !== 'string' || !item.id.trim() || typeof item.name !== 'string' || !item.name.trim()) throw new Error('MCP 缺少名称或标识');
  if (!envVars || typeof envVars !== 'object' || Array.isArray(envVars) || Object.entries(envVars).some(([key,value]) => !/^[A-Za-z_][A-Za-z0-9_]*$/.test(key) || typeof value !== 'string')) throw new Error('MCP 环境变量格式无效');
  const missing = (item.envVars || []).filter(entry => entry.required && !envVars[entry.name]?.trim()).map(entry => entry.name);
  if (missing.length) throw new Error('请先填写必需的环境变量：' + missing.join('、'));
  const transport = item.transport || (item.url ? 'http' : 'stdio');
  if (!['stdio', 'http', 'sse'].includes(transport)) throw new Error('不支持的 MCP 连接方式');
  if (transport === 'stdio' && (typeof item.command !== 'string' || !item.command.trim())) throw new Error('市场未提供可执行命令，请打开项目主页按说明配置');
  if (item.args && (!Array.isArray(item.args) || item.args.some(arg => typeof arg !== 'string'))) throw new Error('MCP 启动参数格式无效');
  if (transport !== 'stdio') {
    let url;
    try { url = new URL(item.url); } catch { throw new Error('MCP 服务地址无效'); }
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('MCP 服务地址必须为 HTTP 或 HTTPS');
  }
  return { id:'market-' + item.id, name:item.name.trim(), description:item.description || '', category:item.category || 'custom', transport, command:item.command, args:item.args || [], url:item.url, headers:item.headers, compatibleProviders:'all', fallbackMode:'disabled', isInstalled:transport !== 'stdio' || ['npx','uvx'].includes(item.command), installMethod:item.installMethod === 'docker' ? 'manual' : item.installMethod || 'manual', source:'registry', version:item.version, isGlobalEnabled:false, envVars:Object.keys(envVars).length ? {...envVars} : undefined, tags:item.tags, author:item.author, homepage:item.repositoryUrl || item.homepage };
}

function installMarketMcp(item, envVars, database) {
  const config = marketMcpConfig(item,envVars);
  const previous = database.getMcp(config.id);
  if (previous) return { success:true, data:previous, alreadyInstalled:true, verified:false };
  database.createMcp(config);
  const saved = database.getMcp(config.id);
  if (!saved) throw new Error('MCP 配置未保存成功');
  return { success:true, data:saved, verified:false };
}

module.exports = { installRegistrySkill, marketMcpConfig, installMarketMcp };
