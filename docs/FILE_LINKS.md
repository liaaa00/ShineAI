> 历史开发记录：下文记录此前版本的检查，产品称呼已统一为 ShineAI；历史安装包、哈希、路径与测试结果不代表本轮改名后重新生成或验收。当前状态见 `SHINEAI-DELIVERY-2026-10-15.md`。

# 会话文件路径

会话正文中的本地 Markdown 链接、自动识别的行内路径和纯文本路径，点击后在系统资源管理器中定位文件；文件夹直接打开。提示文字为“在文件夹中显示”。网页链接保持原有行为，代码块保持可复制文本。

相对路径以当前会话的工作目录或 worktree 为基准。绝对路径精确定位，不会替换成项目中同名文件。文件不存在时提示可能尚未生成、已移动或属于示例路径，不打开其他目录。

沿用 `file-manager:show-in-folder` 的来源和文件读取权限校验；校验后由 `src/main/extensions/reveal-local-path.cjs` 检查文件是否存在，目录调用 `shell.openPath`，普通文件调用 `shell.showItemInFolder`。不会启动被引用的文档、脚本或可执行文件。渲染层的 `dev-file-links.js` 统一调用并显示错误。

`scripts/patch-file-links.mjs` 保存恢复补丁，重复执行保持相同内容；`apply-dev-transforms.mjs` 已接入。`npm run smoke:file-links` 使用隔离用户配置，在实际会话中点击相对路径、中文空格路径、file URL、行号链接、脚本文件、文件夹和不存在的路径；系统打开动作在最后一层拦截，核对目标路径及动作，避免批量打开资源管理器。另检查危险协议不调用系统接口、网页入口与代码块保持原行为。专项不调用模型。

2026-10-15：完整 `npm run check` 通过 51 项单元测试和所有运行检查；工程版文件路径专项通过 10 项。本次修改不包含在此前发布的 859 MiB 安装包中，后续重新打包时自动加入该专项验收。

实际安装目录 `E:/AI/ShineAI` 已更新 4 个构建文件，旧文件备份为 `artifacts/installed-update-1792068293265`。同一专项对真实安装程序的 10 项检查全部通过，报告为 `artifacts/installed-file-links-report.json`。日常窗口正常退出后已重新启动。构建指纹为 `59c6954fad7488085f4fa79e98efe66ac8d0e77afc39929e7895819ce0161723`。
