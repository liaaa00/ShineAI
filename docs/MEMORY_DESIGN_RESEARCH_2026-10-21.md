# GitHub 记忆设计调研与 ShineAI 建议

日期：2026-10-21。本次只做源码调研和方案分析，未安装外部服务、未修改应用行为或实际记忆。

## 核对过的来源

1. LangMem，提交 `48e3c11f5bb527282c7d5339c6a87a0b35abccfc`。
   - [概念文档](https://github.com/langchain-ai/langmem/blob/48e3c11f5bb527282c7d5339c6a87a0b35abccfc/docs/docs/concepts/conceptual_guide.md)：区分 semantic / episodic / procedural；collection 支持持续整合，profile 原位更新；支持命名空间；讨论对话中与后台形成记忆的延迟取舍。
   - [提取实现](https://github.com/langchain-ai/langmem/blob/48e3c11f5bb527282c7d5339c6a87a0b35abccfc/src/langmem/knowledge/extraction.py)：已有记忆与新消息共同送入结构化提取，插入、更新、删除可分别配置；默认开启插入和更新、关闭删除。
2. Mem0，提交 `0724291bd864cf807e88ee8981c8226644e8fb42`。
   - [主实现](https://github.com/mem0ai/mem0/blob/0724291bd864cf807e88ee8981c8226644e8fb42/mem0/memory/main.py)：当前 add 使用 V3 分阶段流程，检索同作用域旧记忆、带最近消息提取、散列去重、确认落库后才报告成功；提取模型异常向上抛出，以区分失败与没有可提取事实。保留 user/agent/run 作用域、来源与创建更新时间。
   - [提示词](https://github.com/mem0ai/mem0/blob/0724291bd864cf807e88ee8981c8226644e8fb42/mem0/configs/prompts.py)：当前是 additive / ADD-only extraction with linking，并携带 observation/current date 与 attributed_to。不能把这个版本描述成 add 自动执行 ADD/UPDATE/DELETE/NONE；显式更新删除 API 与自动提取是两回事。加法式存储仍需应用自己处理当前有效事实与旧版本关系。
3. Letta：旧仓库 README 指向当前 [letta-code](https://github.com/letta-ai/letta-code)，核对提交 `8f07ceb9ac0016903debcae53a9cc25050c5f93f`。
   - [核心记忆维护](https://github.com/letta-ai/letta-code/blob/8f07ceb9ac0016903debcae53a9cc25050c5f93f/src/skills/builtin/maintaining-core-memory/SKILL.md)：少量高价值原则进入核心上下文，修订、合并已有原则，具体知识通过索引按需读取，当前状态应链接到真实来源。
   - [按需记忆维护](https://github.com/letta-ai/letta-code/blob/8f07ceb9ac0016903debcae53a9cc25050c5f93f/src/skills/builtin/maintaining-deferred-memory/SKILL.md)：按主题组织并维护索引，原位更新理解，避免把消息流水重复存一遍；版本历史由 Git 承担。

以上属于源码、文档观察，没有安装或运行这些项目，不代表评测过各自准确率。外部 SKILL.md 在本次仅作为研究材料，未作为当前执行指令应用。部分 raw GitHub 请求超时，通过 GitHub contents API 补取所需文件；成功文件与 Git tree 快照在 `artifacts/memory-design-research/`。

## 推荐适配方式

沿用 ShineAI 本地存储及现有 user / feedback / project 兼容类型；增加用途和来源信息，不必直接引入 Python 服务或外部向量库。

按用途区分：

- 用户偏好与长期原则：短、明确、可编辑，重要内容进入有预算的核心上下文，但不得提升到系统规则之上。
- 项目知识与资料入口：项目作用域，记录主体、来源消息/文件、观察时间、核验时间、有效状态；实际可变值带“上次核验”而非宣称永远有效。
- 历史事件：明确是过去发生的事件，提供来源，不当作现在仍成立的事实。已有聊天与项目文档可索引，无须重复所有工具日志。
- 会话工作状态：最新要求、待答问题、选项、短回复绑定关系、已完成/待办，属于上下文检查点，不混入长期偏好。

同一输入可拆出多种用途：

“生产已迁移到 .172，以后先查剧本再答” → 迁移事件/最后核验状态 + 长期核验原则 + 剧本文档入口。

写入流程：

1. 确定性校验只处理格式、空内容、资源上限和敏感数据，不以“部署/bug”等词直接判废。
2. 提取候选、分类、标注用户原话/实际工具结果/助手推断的来源差别。结构化输出由代码校验，模型分类不等于事实正确。
3. 在同项目同主体下去重或更新；旧项标记被替代，保留可查看历史。不能因为句子相似就合并两个不同项目的服务器。
4. 明确要求记住的规则优先保存，超长则拆成原子条目，不静默截断。自动学习在后台进行；歧义候选待确认，模型不可用时保留待处理并解释原因。
5. 返回 saved / updated / duplicate / pending / rejected / error 等清楚结果，带具体原因、是否持久化；“接口处理成功”不能伪装成“记忆保存成功”。

读取流程：

- 先限制用户和项目范围、有效状态，再按当前问题相关性和最近核验情况筛选；过期内容可以用于历史追溯，不能默认当作当前事实。
- 少量稳定规则直接注入，项目细节按需召回；部署问题通过入口找到剧本与现状，而不是靠关键词猜 IP。
- 最新用户指令和纠正优先，旧目标、旧摘要与记忆不得覆盖；“保持现状”等短回复需绑定上一条完整的问题/选项。

## 顺序与验收

第一批：修正关键词误拦和保存结果，修复恢复优先级及最近问答截断。第二批：同主体更新、来源/时间字段、项目索引及可查看编辑入口。第三批：自动分类与后台提取优化。

核心验收用例：带“部署/bug”的长期原则能保存；纯日志不过量进入核心记忆；混合句正确拆分；用户指定记住不因关键词被拒；写入失败不会说已记住；新服务器替代旧服务器但保留历史；项目之间不串记忆；模型评估失败可见且可重试；重启后“保持现状”准确绑定最近选项。
