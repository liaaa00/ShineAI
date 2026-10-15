'use strict';
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { downloadBytes, requireSkillText, downloadError } = require('./market-download.cjs');
const activeInstalls = new Set();

function repositoryPlan(source, skillId, detail) {
  if (!/^[\w.-]+\/[\w.-]+$/.test(source) || !/^[\w.-]+$/.test(skillId) || ['.', '..'].includes(skillId)) throw new Error('技能仓库或名称格式无效');
  const file = detail.path;
  if (typeof file !== 'string' || file.includes('\\') || file.split('/').some(part => !part || part === '.' || part === '..' || /[<>:"|?*\x00-\x1f]/.test(part))) throw new Error('技能文件路径无效');
  if (!/(^|\/)SKILL\.md$/i.test(file)) return null;
  if (typeof detail.branch !== 'string' || !detail.branch || /[\x00-\x1f]/.test(detail.branch)) throw new Error('技能分支无效');
  return { method: 'repository', source, skillId, directory: path.posix.dirname(file) === '.' ? '' : path.posix.dirname(file), branch: detail.branch };
}

function selectFiles(tree, directory) {
  if (!Array.isArray(tree)) throw new Error('无法获取技能仓库文件列表');
  const prefix = directory ? directory + '/' : '';
  const files = tree.filter(entry => entry.type === 'blob' && entry.path.startsWith(prefix)).map(entry => ({ ...entry, relative: entry.path.slice(prefix.length) }));
  const seen = new Set();
  const selected = files.filter(entry => !entry.relative.split('/').some(part => ['.git', 'node_modules'].includes(part)));
  if (!selected.length || selected.length > 500) throw new Error('技能目录为空或文件数超过 500');
  for (const entry of selected) {
    const parts = entry.relative.split('/');
    if (entry.mode === '120000' || entry.relative.includes('\\') || parts.some(part => !part || part === '.' || part === '..' || /[<>:"|?*\x00-\x1f]/.test(part) || /[. ]$/.test(part) || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part))) throw new Error('技能目录包含不支持的文件路径');
    const key = entry.relative.toLowerCase();
    if (seen.has(key)) throw new Error('技能目录包含重复文件路径');
    seen.add(key);
    if (entry.size > 5 * 1024 * 1024) throw new Error('技能文件超过 5 MB');
  }
  if (!selected.some(entry => entry.relative.toLowerCase() === 'skill.md')) throw new Error('技能目录缺少 SKILL.md');
  return selected;
}

async function installRepositorySkill(options) {
  const key = path.resolve(options.skillsRoot).toLowerCase() + ':' + options.source + '/' + options.skillId;
  if (activeInstalls.has(key)) throw new Error('这个技能正在安装，请等待当前安装完成');
  activeInstalls.add(key);
  try { return await installDirectory(options); }
  finally { activeInstalls.delete(key); }
}

// Files are downloaded before registration. A failed download or DB write restores
// the previous directory and never reports a successful empty installation.
async function installDirectory({ source, skillId, detail, tree, skillsRoot, fetchFile, parseSkill, database, onLog = () => {}, timeoutMs = 120000, signal }) {
  signal = signal ? AbortSignal.any([signal, AbortSignal.timeout(timeoutMs)]) : AbortSignal.timeout(timeoutMs);
  const plan = repositoryPlan(source, skillId, { path: detail.detailPath, branch: detail.detailBranch });
  if (!plan) throw new Error('未找到可安装的技能目录');
  const files = selectFiles(tree, plan.directory);
  const marker = 'mk:' + source + '/' + skillId;
  const existing = database.getAllSkills().find(skill => skill.tags?.includes(marker));
  const id = existing?.id || 'skillsh-' + source.replace('/', '-') + '-' + skillId;
  const destination = path.join(skillsRoot, id.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_'));
  await fs.mkdir(skillsRoot, { recursive: true });
  const workspace = await fs.mkdtemp(path.join(skillsRoot, '.install-'));
  const staging = path.join(workspace, skillId), backup = path.join(workspace, 'previous');
  await fs.mkdir(staging);
  let moved = false, replaced = false, registered = false;
  try {
    onLog('正在下载技能目录：' + source + '/' + plan.directory);
    let bytes = 0;
    for (const [index, entry] of files.entries()) {
      signal.throwIfAborted();
      onLog('正在下载 ' + (index + 1) + '/' + files.length + '：' + entry.relative);
      const url = 'https://raw.githubusercontent.com/' + source + '/' + encodeURIComponent(plan.branch) + '/' + entry.path.split('/').map(encodeURIComponent).join('/');
      const content = await downloadBytes(fetchFile, url, { signal, onRetry: (attempt, max) => onLog('连接中断，正在重试 ' + attempt + '/' + max + '：' + entry.relative) });
      if (/^[a-f0-9]{40}$/.test(entry.sha || '')) {
        const digest = crypto.createHash('sha1').update(Buffer.from('blob ' + content.length + '\0')).update(content).digest('hex');
        if (digest !== entry.sha) throw new Error('仓库内容已变化，请刷新技能详情后重试');
      }
      bytes += content.length;
      if (bytes > 20 * 1024 * 1024) throw new Error('技能目录超过 20 MB');
      const relative = entry.relative.toLowerCase() === 'skill.md' ? 'SKILL.md' : entry.relative;
      if (relative === 'SKILL.md') requireSkillText(content.toString('utf8'));
      const target = path.join(staging, ...relative.split('/'));
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, content);
      onLog('已下载：' + entry.relative);
    }
    const parsed = parseSkill(staging);
    if (!parsed?.name || !parsed.promptTemplate) throw new Error('SKILL.md 无有效技能内容');
    signal.throwIfAborted();
    const skill = { ...parsed, id, dirPath: destination, tags: [...new Set([...(parsed.tags || []), marker])], source: 'marketplace', isInstalled: true, isEnabled: existing?.isEnabled ?? true };
    try { await fs.rename(destination, backup); moved = true; } catch (error) { if (error.code !== 'ENOENT') throw error; }
    await fs.rename(staging, destination); replaced = true;
    if (existing) database.updateSkill(id, skill); else database.createSkill(skill);
    registered = true;
    const saved = database.getSkill(id);
    if (!saved?.promptTemplate || saved.dirPath !== destination) throw new Error('技能未正确保存，安装已回滚');
    onLog('安装成功：' + skill.name + '（' + files.length + ' 个文件）');
    return { method: 'repository', skill: saved, files: files.length };
  } catch (error) {
    if (registered) {
      if (existing) database.updateSkill(id,existing); else database.deleteSkill(id);
    }
    if (replaced) await fs.rm(destination, { recursive: true, force: true });
    if (moved) await fs.rename(backup, destination);
    throw /timeout|abort/i.test(error.name) ? downloadError(error) : error;
  } finally { await fs.rm(workspace, { recursive: true, force: true }); }
}

module.exports = { repositoryPlan, selectFiles, installRepositorySkill };
