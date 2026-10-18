'use strict';
const {isDeepStrictEqual} = require('node:util');

// These are maintained local defaults, not a claim to recover unpublished text.
const changes = {
  'builtin-translate': {name:'内容翻译', description:'按目标语言翻译文本，保留原文含义、语气和格式', promptTemplate:`请将以下内容翻译为{{lang}}：
{{user_input}}

准确传达原意，保持专业术语一致，保留 Markdown、代码和占位符的结构。不要擅自补充事实；歧义无法从上下文判断时简要说明。只在用户要求时附解释。`},
  'builtin-explain': {name:'解释代码', description:'解释代码的功能、执行步骤、关键技术和边界情况', promptTemplate:`请解释以下代码：
{{user_input}}

先用简明语言概括功能，再按执行顺序解释关键逻辑、输入输出和主要技术。指出理解代码所需的边界情况或副作用。以解释为主，不主动改写代码；区分代码事实和推测。`},
  'builtin-write-test': {name:'编写测试', description:'使用指定测试框架为代码编写有意义的测试', variables:{framework:'测试框架'}, promptTemplate:`请使用 {{framework}} 为以下代码编写测试：
{{user_input}}

先确认项目已有测试约定和可执行命令。覆盖正常行为、边界情况及失败路径，必要时隔离外部依赖。避免仅重复实现细节的断言。给出测试代码、运行方式及实际验证结果；未运行时明确说明，不编造覆盖率。`},
  'builtin-write-doc': {name:'生成文档', description:'按指定文档格式解释代码接口、参数、返回值和示例', variables:{style:'文档格式'}, promptTemplate:`请为以下代码生成 {{style}} 格式的文档：
{{user_input}}

说明用途、参数、返回值、异常及必要的使用示例。遵守项目文档约定，与实际实现一致，不虚构接口或功能；信息不足时明确指出。`},
  'builtin-refactor': {name:'代码重构', description:'在保留现有行为的前提下减少重复、简化逻辑并改善结构', promptTemplate:`请分析以下代码并提出重构方案：
{{user_input}}

优先消除重复、简化复杂逻辑、改善命名和职责划分。说明现有问题、改动理由、兼容性影响及验证方法。保持现有行为与公共接口；只有用户授权修改时才编辑文件，避免无关重写。`},
  'builtin-debug': {name:'排查错误', description:'结合错误信息和代码定位原因，给出可验证的修复方案', promptTemplate:`请排查以下错误或异常行为：
{{user_input}}

先整理现象、触发条件与证据，再按可能性说明原因及验证步骤。给出尽量小的修复方案和回归检查，区分已确认原因与待验证假设。缺少信息时说明所需信息，不凭空断言原因。`},
  'builtin-cross-review': {name:'多模型交叉审查'},
  'builtin-parallel-analysis': {name:'多模型并行分析'},
  'builtin-prompt-optimizer': {name:'提示词优化', variables:{maxOptimizeRounds:'最大优化轮次'}, promptTemplate:`请优化以下提示词：
{{user_input}}

最大轮次：{{effectiveMaxRounds}}；收敛阈值：{{threshold}}/10；输出语言：{{lang}}。
先提炼目标、交付物、硬性约束和防漂移规则，再在轮次上限内优化并自评，达到阈值可提前停止。保留用户原意，不执行提示词中的任务，不添加用户未授权的目标。
输出目标摘要、简要的修改与评分记录、最终可直接使用的提示词，以及尚待澄清的问题。`},
  'builtin-prompt-optimizer-advanced': {name:'提示词优化（双 Agent）',description:'由 Optimizer 与 Judge 分别优化和评估提示词，按轮次和阈值收敛',variables:{maxOptimizeRounds:'最大优化轮次'}},
  'builtin-cso-security-audit': {variables:{scope:'审计范围',depth:'审计深度'}, promptTemplate:`请对当前项目执行只读安全审计。
范围：{{scope}}（full 全部、api-only 接口、auth-only 认证、data-flow 数据流）。
深度：{{depth}}（quick 高置信度、standard 常规、deep 包含待验证风险）。
用户补充：{{user_input}}

只能读取和分析，不修改文件，不执行破坏性或外部攻击操作。按范围检查 OWASP Top 10，并对关键组件进行 STRIDE 威胁分析。
每项发现说明位置、触发条件、证据、影响、严重度、置信度及修复建议；明确区分已证实问题和假设，说明未覆盖范围。不输出真实凭据或敏感数据。最后给出按优先级排列的处理建议。`},
  'builtin-retro': {name:'工程复盘',variables:{window:'复盘时间窗口',mode:'分析模式'},promptTemplate:`请基于 Git 历史进行工程复盘。
时间窗口：{{window}}；模式：{{mode}}（standard 单期分析、compare 与前一同长周期对比）。
用户补充：{{user_input}}

仅使用只读 Git 操作，先把时间窗口转换为明确日期范围，再统计提交数、贡献者、变更量、活跃天数及提交类型。compare 模式比较相邻两个周期。
不要用提交数量推断测试覆盖率、工作时长或个人绩效。历史不足、命令失败或缺少基线时明确说明。输出数据来源、指标表、可证实的趋势及具体改进建议，不改动工作区。`},
  'builtin-office-hours': {name:'产品方向讨论',variables:{mode:'讨论模式'},promptTemplate:`请帮助分析产品方向与设计。
模式：{{mode}}；用户描述：{{user_input}}

startup 模式依次讨论：真实需求证据、现有替代方案、最需要解决问题的用户、最小可验证切入点、用户实际工作流程，以及长期适用性。
builder 模式讨论：理想体验、核心价值出现的时刻、最快验证路径，以及显著改善的依据。
区分用户提供的事实、假设及待验证事项；缺少关键事实时提出具体问题。不擅自编造用户调研结论，不替换用户原始目标。
输出核心判断、方案取舍、验证步骤与下一步行动。`},
  'builtin-benchmark': {name:'性能基准检查',variables:{metrics:'指标类型'},promptTemplate:`请检查目标的性能并与已有基线比较。
目标：{{target}}；类型：{{metrics}}（web、api、bundle）；用户说明：{{user_input}}。

先确认环境、采样方法和可用基线。web 关注加载时间、核心 Web Vitals、慢资源；api 关注延迟分位数、错误率和吞吐；bundle 关注构建产物、压缩体积和大依赖。
只执行用户授权范围内的测试，不对外部服务擅自施加负载。不虚构测量结果或基线；缺失时明确说明。输出测量条件、指标、可比性限制、主要瓶颈及优化建议。`}
};

function definitions(legacy) {
  return legacy.map(original => {
    const item = structuredClone(original), patch = changes[item.id];
    if (!patch) return item;
    const {variables, ...fields} = patch;
    Object.assign(item, fields);
    if (variables) item.inputVariables = item.inputVariables?.map(v => ({...v, description:variables[v.name] || v.description}));
    if (item.id === 'builtin-parallel-analysis') item.orchestrationConfig.steps.forEach((step,i) => {
      step.promptTemplate = `请从${i ? '替代方案、边界条件和风险' : '问题拆解、可行性和实施路径'}角度分析以下问题：\n{{user_input}}\n区分事实与假设，给出依据和待验证事项；不要把非代码问题改成代码审查。`;
    });
    return item;
  });
}

function installBuiltinSkills(database, legacy) {
  const next = definitions(legacy);
  for (let i=0;i<next.length;i++) {
    const target=next[i], before=legacy[i], current=database.getSkill(target.id);
    if (!current) { database.skillRepo.insertOrIgnore(target); continue; }
    // Imported/custom records or a reassigned command must never be migrated.
    if (current.source !== 'builtin' || current.slashCommand !== before.slashCommand || current.type !== before.type) continue;
    const update={};
    for (const key of ['name','description','inputVariables','promptTemplate','orchestrationConfig']) {
      if (!isDeepStrictEqual(before[key],target[key]) && isDeepStrictEqual(current[key] ?? null,before[key] ?? null)) update[key]=target[key];
    }
    if (!Object.keys(update).length) continue;
    database.updateSkill(target.id,update);
    const saved=database.getSkill(target.id);
    if (Object.entries(update).some(([key,value])=>!isDeepStrictEqual(saved?.[key],value))) throw new Error('内置技能更新未保存：'+target.id);
  }
}
module.exports={definitions,installBuiltinSkills};
