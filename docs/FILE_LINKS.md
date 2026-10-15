# 会话文件路径

会话正文中的本地 Markdown 链接、自动识别的行内路径和纯文本路径，点击后在软件内置文件面板打开。聊天保留在左侧，文件显示在右侧；已有文件面板时复用该面板。带行号的链接跳转到对应行。提示文字为“在侧边栏打开”。

文本、代码和 Markdown 沿用已有编辑器；图片、PDF 和 Office 文档沿用已有预览能力。HTML 和脚本点击时显示源码，不执行内容。无法读取或不支持的文件在文件面板显示原因，不调用系统程序兜底。重复点击同一路径复用标签页，并保留未保存的修改。

相对路径以当前会话的工作目录或 worktree 为基准。绝对路径保持精确，不会被项目中同名文件替换。Windows 路径和 file URL 统一分隔符，避免同一文件因链接形式不同而重复打开标签。

沿用 `useFileManagerStore.openFileInTab/openFileAtLine`、`useFileTabStore` 和 `useUIStore.openViewBesideMain("files")`，通过现有带权限校验的文件读取 IPC 获取内容。没有新增特权接口或放宽访问权限。可读入口为 `src/renderer/assets/dev-file-links.js`；`scripts/patch-file-links.mjs` 保存恢复补丁，重复执行保持相同内容，`apply-dev-transforms.mjs` 已接入。

文件夹链接保留在系统资源管理器打开的行为；通过项目索引识别目录，显式以斜杠结尾的链接支持空目录。网页链接保持原有行为，危险协议被阻止，代码块保持可复制文本。

`npm run smoke:file-links` 在隔离用户配置中实际点击链接，验证右侧可见的文件内容与左侧聊天并存、行号定位、图片解码、中文空格路径、file URL、未保存修改、HTML/脚本不执行、目录行为、缺失文件错误、危险协议、网页链接和代码块。系统打开动作在最后一层拦截，专项不调用模型。报告为 `artifacts/file-links-report.json`，界面截图为 `artifacts/file-links-side-panel.png`。

本次修改面向工程开发版。此前安装包和安装目录的验证记录不代表已包含本次功能，需要重新打包才会进入新的安装包。

2026-10-15 验证：`npm run check` 全部通过（56 项单元测试、构建与完整性检查、界面启动、云服务移除、Codex 协议测试、本地运行检查）；`npm run smoke:file-links` 的 15 项界面检查全部通过。恢复补丁可从本轮修改前的源码重现当前 renderer，且重复执行不改变结果。
