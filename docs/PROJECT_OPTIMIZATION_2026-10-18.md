# ShineAI 整体优化分析

日期：2026-10-18。调研通过 GitHub 仓库搜索、提交信息和源码读取完成，没有运行
外部项目。本报告是对照现有工程提出的后续建议；除本轮手动文字设置外，不表示
这些改进已经实现。未重新执行真实付费模型请求，也不是完整安全审计。

## 判断依据

ShineAI 已有独立 profile、IPC 校验、云服务隔离、公开 Skill/MCP 市场、模型连接
测试、文件预览、终端、任务通知、环境诊断，以及一致性备份和增量更新脚本。
本轮完整检查通过 69 项单元测试及构建、桌面、安全边界、模拟中转、本地响应、
编辑器检查。后续优化应补足实际缺口，避免把已有功能再做一遍。

工程的限制也很明确：主进程恢复包约 16.26 MiB，renderer 主包约 17.49 MiB，
部分仍混淆。GitHub 恢复环境仍依赖私有保存的发布归档与大型运行时资源；
完整安装包此前约 858 MiB，约 6.49 万个文件。没有配置 `.github` CI 流程。
这些规模和恢复条件会影响开发、测试、打包与独立复现。

## P0：先补足可核对的请求行为与可恢复的数据保护

### 1. 让设置、连接测试和真实请求使用同一份能力配置

实际问题：此前出现过 Claude 界面已设置思考强度，但出站请求没有参数。当前
已有 Claude/Codex 参数回归，不应把“某条连接测试通过”扩大成所有协议都可用。

建议：

- 统一“协议 → 适配器 → 模型能力 → 本次请求参数”的生成入口，避免测试与聊天各自拼请求。
- 为自定义中转模型名提供明确的能力配置；无法识别时显示“未知”，允许用户按服务商文档设置。
- 增加只读的请求摘要：协议、模型、配置强度、实际发出的相关参数名、超时阶段及错误类别。
- 明确区分“界面已保存”“请求已带参数”“中转是否执行”。最后一项需要后端证据，不能从 HTTP 200 推断。
- 摘要不包含 API Key、Authorization、完整用户提示词或附件；不自动上传。

参考：

- [Cherry Studio：逐请求能力解析](https://github.com/CherryHQ/cherry-studio/blob/d01b83d2cc58e5a7f95906f2546a5db96e8344e9/src/main/ai/runtime/aiSdk/params/capabilities.ts)
- [CodePilot：协议出站请求样例测试](https://github.com/op7418/CodePilot/blob/1ae6d76de6993377dab961eacf04927babd99eb1/src/__tests__/unit/provider-request-shape.test.ts)
- [AionUi：协议转换测试](https://github.com/iOfficeAI/AionUi/blob/c140550d04e44f3d6f8a9830b40ae56e4689a977/tests/unit/providers/ProtocolConverter.test.ts)

验收：Claude、OpenAI Chat、Responses 的真实应用向本地模拟服务发送请求，逐个核对
强度、工具和取消行为；对于不支持的能力明确提示，而不是悄悄丢掉设置。

### 2. 把备份脚本完善成可验证的备份与恢复流程

已有数据库维护/迁移备份，本轮品牌迁移也做过一致性备份；缺口是用户日常可操作、
可验证的完整恢复体验，不是“没有任何备份”。

- 提供本地备份入口，区分会话、设置、Skill/MCP 配置、壁纸/附件。
- 默认不携带密钥；需要迁移凭据时设计独立的受保护流程，明确同机与跨机差别。
- 使用有版本、文件清单、大小和哈希的备份格式，先验证，再在隔离目录试恢复。
- 恢复前保存当前快照，失败能回退；验证旧加密格式和路径绑定，不能直接移动数据库后假定密钥仍能解密。
- 凭据存储已有 safeStorage/AES 实现与历史字段，需专项盘点覆盖范围，再做显式、可回退的兼容迁移。

参考：

- [Chatbox：分项导出与 includeKeys](https://github.com/chatboxai/chatbox/blob/0ac6385ae1ff5bf778777826da3c5edcd55b61b8/src/renderer/packages/backup/export-backup.ts)
- [Chatbox：导入清单校验和回滚](https://github.com/chatboxai/chatbox/blob/0ac6385ae1ff5bf778777826da3c5edcd55b61b8/src/renderer/packages/backup/import-backup.ts)
- [Cherry Studio：恢复启动隔离与故障处理](https://github.com/CherryHQ/cherry-studio/blob/d01b83d2cc58e5a7f95906f2546a5db96e8344e9/src/main/core/preboot/backupRestoreGate.ts)
- [CodePilot：用系统存储保护随机数据密钥](https://github.com/op7418/CodePilot/blob/1ae6d76de6993377dab961eacf04927babd99eb1/electron/provider-secret-key.ts)

验收：在全新隔离 profile 中恢复，确认会话和附件数量、内容、Skill/MCP、壁纸；
错误清单和恢复中断都不得破坏当前数据。凭据测试只用生成的样例。

## P1：长会话性能、离线诊断与交付效率

### 3. 先测长会话，再优化渲染

Chatbox 使用 react-virtuoso，CodePilot 使用虚拟消息行并处理流式行高与前插锚点。
ShineAI 的关键词“virtual”多数出现在表情组件，尚不能据此证明或否定聊天列表
已有完整虚拟化。应先测 DOM 和滚动性能，避免仅凭搜索结果做结论。

- 用 1,000/5,000 条消息、代码块、工具结果生成可重复场景。
- 记录首屏耗时、DOM 数、内存、流式更新与滚动卡顿。
- 再选择消息分页、长工具结果默认折叠、Markdown 缓存、虚拟滚动。
- 回归“加载更早”位置、搜索定位、自动跟随、选中文本、代码高度变化。
- 壁纸已有隐藏/减弱动态暂停机制，保留现有行为；只在测出额外成本后优化。

参考：[Chatbox 消息列表](https://github.com/chatboxai/chatbox/blob/0ac6385ae1ff5bf778777826da3c5edcd55b61b8/src/renderer/components/chat/MessageList.tsx)、
[CodePilot 虚拟滚动逻辑](https://github.com/op7418/CodePilot/blob/1ae6d76de6993377dab961eacf04927babd99eb1/src/components/chat/message-list-virtual.ts)。

### 4. 把分散错误汇成可导出的本地诊断摘要

已有启动日志、环境检测、MCP 诊断和若干日志脱敏逻辑；建议统一错误分类与入口。

- 分清网络不可达、认证失败、模型不支持、正文无效、工具启动失败、文件权限和编辑器资源失败。
- 提供“原因 → 可执行的下一步 → 再试一次”，避免只显示堆栈或笼统超时。
- 用户主动导出前预览内容，遮蔽密钥、用户名、敏感路径；默认排除聊天正文和数据库。
- 设置与模型请求摘要共享错误编号，方便定位同一次操作。

参考：[AionUi 错误摘要脱敏与长度限制](https://github.com/iOfficeAI/AionUi/blob/c140550d04e44f3d6f8a9830b40ae56e4689a977/packages/desktop/src/renderer/pages/conversation/platforms/acp/errorDiagnostics.ts)、
[Cherry Studio 诊断包服务](https://github.com/CherryHQ/cherry-studio/blob/d01b83d2cc58e5a7f95906f2546a5db96e8344e9/src/main/services/diagnostics/DiagnosticBundleService.ts)。

只参考本地采集、筛选与脱敏，不引入这些项目的遥测或自动上传服务。

### 5. 减少重复打包，补足可复现构建

已有构建哈希、安装包白名单、固定 ABI、安装包缓存检查和安装目录增量更新。
建议在这些机制上改进：

- 将“开发更新已安装程序”整理成一次命令：检查运行状态、备份、校验更新、重启、报告构建指纹。
- 完整打包采用受校验的增量暂存，避免每次复制全部运行时；不以 mtime 代替内容验证。
- 分析大型 CLI、语音等资源占比，评估可选组件或独立资源包，先保证离线完整版本可用。
- 新旧版本可辨认，安装器升级和回退可验证；保留已移除的厂商更新通道边界。
- 先用 CI 运行纯单元与源码检查，再在合法可恢复的依赖/资源前提下运行 Windows 桌面和打包检查。
- 补齐干净环境恢复入口；需要发布归档的步骤明确说明，不能宣称当前已经支持纯 npm ci 从零构建。

参考：[AionUi 构建发布工作流](https://github.com/iOfficeAI/AionUi/blob/c140550d04e44f3d6f8a9830b40ae56e4689a977/.github/workflows/build-and-release.yml)、
[CodePilot 架构分层](https://github.com/op7418/CodePilot/blob/1ae6d76de6993377dab961eacf04927babd99eb1/ARCHITECTURE.md)。

## P2：能力说明与文件操作可撤销

### 6. 让功能可用性跟实际运行能力一致

按运行时和服务商区分“可用 / 未配置 / 不支持 / 未验证”，设置与执行入口共用
同一能力表。保留公开 Skill/MCP 市场，不用本地身份假装拥有远端额度。
前期被取消的手机协同不在本次建议的实施范围，不重新接入服务器。

参考：[CodePilot 能力矩阵](https://github.com/op7418/CodePilot/blob/1ae6d76de6993377dab961eacf04927babd99eb1/src/lib/harness/capability-matrix.ts)。

### 7. 增强 AI 改文件后的可撤销体验

已有文件侧栏、差异预览、Git 和工作区能力。可进一步按任务记录改动前快照，
预览后恢复指定文件。必须保留任务开始前用户尚未提交的修改，不直接执行
git checkout HEAD。先确认已有适配器的撤销/快照覆盖范围，避免重建相同能力。

参考：[CodePilot 文件检查点](https://github.com/op7418/CodePilot/blob/1ae6d76de6993377dab961eacf04927babd99eb1/src/lib/file-checkpoint.ts)。
其示例为内存文本快照，不能照搬为持久备份：ShineAI 方案还需考虑崩溃恢复、
二进制文件、编码、容量、路径校验以及恢复时发现用户后续修改的冲突。

## 推进顺序与工程约束

建议次序：请求行为一致性与诊断 → 备份恢复 → 长会话基准 → 开发更新/打包 →
能力说明与文件检查点。统一诊断可随第一项推进。

新增代码优先进入可读扩展模块，逐步从大恢复包抽离接口；不一次重写整个应用。
保持 renderer 沙箱、IPC 校验、官方安装隔离、公开市场和现有本地功能。外部代码
只作为设计参考；实际复用需逐项审查许可证，不因仓库公开就直接复制。
