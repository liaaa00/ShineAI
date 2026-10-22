# 图表放大查看

日期：2026-10-19

## 使用方式

聊天中的 Mermaid 图表渲染成功后，工具栏出现“放大查看”。点击后使用整个应用
窗口查看图表，默认按画布尺寸完整显示。长图允许缩到原聊天卡片 50% 下限以下。

- “适合窗口”：重新居中并完整显示，调整窗口大小时自动适配。
- “100%”：按 SVG 原始尺寸显示。
- `+` / `−` 按钮或快捷键：放大、缩小；`Ctrl + 滚轮` 围绕鼠标位置缩放。
- 鼠标拖动：平移图表；`0` 重新适配窗口。
- “复制源码”和“导出 SVG”：复用原有图表操作。
- “关闭”或 `Esc`：返回原聊天位置，并恢复放大按钮焦点；聊天卡片原有缩放和平移不变。

保留既有字体、图表配色、透明壁纸及外观配置。查看器不新增遮罩或壁纸层。
未启用壁纸时使用现有窗口底色。

## 实现边界

- `src/renderer/assets/dev-diagram-viewer.mjs`：独立 React 查看器，通过原生模态
  dialog 和 body portal 展示，打开时暂时隐藏主界面，关闭后恢复其原样式。
- `src/renderer/assets/dev-diagram-viewer.css`：窗口布局和操作按钮，沿用主题变量。
- `scripts/patch-diagram-viewer.mjs`：窄补丁接入原 MermaidBlock，已加入恢复流程，
  重复执行不重复注入。
- 沿用现有 Mermaid strict 安全渲染及 SVG 导出内容，查看用副本重新分配 SVG ID，
  防止与聊天中仍挂载的图表发生 marker、CSS 引用冲突。
- 没有新增 IPC、文件权限、依赖或模型请求。

此入口针对聊天中的 Mermaid 图表；不代表所有文件类型都增加了新预览器。

## 验证

`npm run smoke:diagram` 使用隔离 Electron profile 和合成 Markdown，实际渲染
24 节点纵向图及 3 节点横向图，验证完整显示、低于 50% 的缩放、100%、缩放按钮、
拖动、Ctrl 滚轮、窗口调整、SVG ID 隔离、Esc/关闭恢复、导出及壁纸保留。

导出通过 Electron 实际下载并校验 SVG 文件。复制测试替换隔离页面的 clipboard
writeText 接口，核对原始源码传参，避免覆盖用户系统剪贴板；没有验证操作系统剪贴板。
壁纸使用测试生成的 PNG 导入隔离 profile，不修改真实用户外观。

桌面报告和截图位于 `artifacts/diagram-viewer/`，工程检查日志位于
`artifacts/diagram-viewer-check.log`。不向真实会话注入测试消息或调用付费模型。

最终结果：

- `npm run check` 通过：107 项自动测试、构建一致性校验及原有桌面回归通过。
- `npm run smoke:diagram` 通过：8 项真实 Electron 图表操作与布局检查，无页面异常。
- 复核期间一次既有后台响应检查记录 2074ms，超过 1500ms；保留原阈值重新运行完整
  检查后为 131ms，通过。第一次检查同项为 106ms。
- 构建指纹：`3c57a749ab28a60bf6c11040939f3791264b4eace51aba6cfd79efe1d76aae1d`。
- 与当前安装版的差异只有四个 renderer 文件。交付时安装版仍有运行中会话，
  空闲检查拒绝执行更新，未替换或重启真实安装版，避免中断用户任务。
  更新入口准备于 `artifacts/diagram-viewer/update-live.mjs`，更新前会再次检查
  活动任务和未保存编辑，备份应用文件并验证会话、技能、外观与 profile 保留。
