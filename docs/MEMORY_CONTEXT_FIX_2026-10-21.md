# 记忆准入与会话恢复修复

日期：2026-10-21。对应兼容性审计第一阶段：修复误拦截、如实反馈保存结果、恢复最近问答。来源和事实时序管理的第二阶段不在本次实现范围内。

## 修改后的行为

- 保留原有 user / feedback / project（内部还支持 reference）、项目范围、候选审核、归档、向量同步和后台评估队列。
- `memory-policy.cjs` 区分原始输入的结构准入和蒸馏后的短 claim 校验。原始显式输入允许最多 4000 字符，由现有评估模型提取最多 200 字符的长期主张；不新增一次模型分类请求。
- 不再因出现部署、状态、bug 或完成等词就直接拒绝长期规则；评估提示词也同步修正。原始混合内容可以提取长期原则，纯进度不能作为长期原则保存；完成句仍可更新同主题旧记忆。
- 原有后台维护也会检查是否为有效规则，避免把“任务完成后必须测试”错误地归档为“任务已完成”。没有批量恢复以前被归档的内容。
- 模型不可用、评估调用失败、返回格式错误、队列满、等待中、重复、跳过和真正写入分别反馈。沿用旧 `ok/action/id/memory/pending` 字段，补充 `outcome/persisted/reasonCode`；调用说明明确禁止仅凭 ok=true 声称保存成功。
- 真正 inserted / merged 返回 saved / updated；重复记录表示本次未新增；归档明确为 archived。pending 只表示尚未确认，不建议盲目重试。
- 记忆评估仍走既有后台调用；清理评估超时定时器。普通消息发送前没有增加记忆模型调用。
- `recovery-context.cjs` 在同一 token 预算内保留长消息的开头和结尾，保留上一答末尾选项与后续短回复，图片消息继续保留附件路径。内部提醒从用户正文摘录中去除，后台结束通知不作为最新要求。
- 恢复提示明确区分原始任务、可能过时的摘要和最近对话；后续明确纠正可以更新早期目标，仍适用的限制继续保留。对短回复找不到明确指代时要求澄清；历史部署信息不能当作当前实测结论。

## 实测中发现的恢复队列问题

在 OpenAI API 适配器恢复会话时，隐藏的恢复提示只入上下文，不启动模型一轮执行。在异步 MCP 初始化期间到达的用户消息会进入适配器已有 pendingMessages；原来恢复完成没有触发它的排空，因而可能无限等待。

修复在原生 resumeSession 完成后延迟到下一个事件循环，确认还是同一个会话、waiting_input、模型循环 idle、没有压缩且有待发消息，再调用原有 flushPendingMessages。仍一次派发一条，沿用原来的失败回填、后续排空和消息版本逻辑；不读取或自动重放上次运行中断的输入，不让运行、停止、替换会话或正在压缩的会话被强行派发。

## 测试隔离

真实应用测试使用本地固定响应服务和独立资料目录，不访问真实模型。首次测试发现旧记忆默认使用用户目录下的 `.shineai/butler`，不随 Electron userData 隔离；本次生成的单条测试记录已经按准确 ID、唯一条目数及测试项目路径核实后清除，备份在 `artifacts/memory-context/first-fixture-feedback.md`，未删除其他记忆。

新增可选 `SHINEAI_DEV_BUTLER_DIR` 绝对路径覆盖记忆、知识页和维护目录；未设置时保留原目录，不迁移或改写现有用户记忆。测试脚本显式传入独立路径。向量目录沿用现有 Electron profile 路由。

## 代码与验证入口

- 可读逻辑：`src/main/extensions/memory-policy.cjs`、`recovery-context.cjs`。
- 可重复补丁：`scripts/patch-memory-context.mjs`，接入 `apply-dev-transforms.mjs`。
- 15 项针对性测试：`node --test test/memory-context.test.mjs`。包含原生显式保存、自动候选审核、完成句、维护、模型失败、预算、短回复、附件、恢复排队与构建补丁重复应用。
- 真实应用验证：`node scripts/memory-context-smoke.mjs`；安装版加 `--installed`。覆盖真实 memory_save 工具、评估调用、落盘、无效结果、重启和后续请求。
- 完整工程检查：`npm run check`。最终结果和安装更新记录在下方补充。

静态单元测试中的存储使用临时替身；真实应用脚本另行验证实际本地存储和 API 请求。固定响应只证明程序链路和参数，不证明外部模型一定理解或遵守提示，也没有验证任何线上服务器状态。

## 最终验证与安装更新

- 最终 `npm run check` 退出码 0：158 项测试全部通过，构建、校验、桌面启动、云端边界、Codex 接口、本地功能及 Monaco 编辑器检查全部通过。记录：`artifacts/memory-context-check.log`。
- 开发版及安装版各 8 项真实应用检查全部通过，均执行了 8 次会话请求和 2 次记忆评估请求：`artifacts/memory-context/development/smoke-report.json`、`artifacts/memory-context/installed/smoke-report.json`。
- 实际复现了恢复过程中的临时排队：修复后只发送一次；随后空闲状态新消息直接发送，不再排队，也不额外调用记忆评估。实际请求同时包含之前回答的末尾选项和“保持现状”短回复。
- 更新 `E:/AI/ShineAI/resources/app/out` 中的主入口及两个新增扩展，共 3 个文件。备份与更新哈希记录：`artifacts/installed-update-1792550265921/report.json`。
- 构建指纹：`bcfe59699f94049123356a6c24135e785d498a68149f5a4e9b81d6fb2920f02a`。
- 安装版测试使用独立资料与记忆目录，已关闭测试实例。没有强制结束用户当前已打开的安装版；当前窗口在下次重启后加载新主进程代码。
