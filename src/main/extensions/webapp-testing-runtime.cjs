'use strict';
const path = require('node:path');

// The recovered generic builtin hint assumes scripts/search.py and treats an
// executable Python as a complete skill runtime. Neither holds for Playwright.
function runtimeSection(skill, python) {
  if (skill?.slashCommand !== 'webapp-testing') return null;
  const directory = skill.dirPath ? path.resolve(skill.dirPath) : null;
  return [
    '# 网页测试运行环境',
    '',
    ...(directory ? [
      '- Skill 目录：`' + directory + '`',
      '- 页面探查脚本：`' + path.join(directory, 'scripts', 'probe.py') + '`'
    ] : []),
    ...(python?.path ? ['- 宿主检测到的 Python 候选：`' + python.path + '`（仅检测了解释器，尚未验证 Playwright 包和浏览器）。'] : ['- 宿主没有检测到 Python；仍可检查目标项目自己的运行环境或使用当前会话提供的浏览器工具。']),
    '',
    '使用目标项目已有的 Playwright 环境。执行探查脚本前，先用所选 Python 检查 `import playwright` 并确认 Chromium 可启动；宿主自带 Python 可能没有 Playwright，不要把它当作已就绪环境。',
    '项目采用 Node Playwright 时沿用项目测试命令；使用 ShineAI Claw 时按技能正文发现浏览器工具。按任务选择一种可用方式，不必同时使用。',
    '缺少运行依赖时说明具体缺项，不把技能已安装或解释器可执行当成测试成功。'
  ].join('\n');
}

module.exports = { runtimeSection };
