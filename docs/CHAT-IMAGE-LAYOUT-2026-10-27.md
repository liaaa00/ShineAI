# 聊天图片展示调整

单图此前限制在 520px 宽、192–224px 高，多图使用总宽 420px 的两列缩略图，文件名覆盖图片底部。截图中的文字难以辨认，竖图尤其明显。

## 当前行为

- 单图容器最大宽度 760px，普通图片保留比例、完整展示，最大高度 560px；小图不放大到超过原始尺寸。
- 多图容器最大宽度 960px，按实际聊天区域宽度排列；窄区域自动单列，不依赖整个窗口宽度。
- 高宽比大于 2、按可用宽度展示仍超出预览高度的长截图，先显示可阅读的顶部预览并明确标注长图；“展开完整图片”显示全部内容，可再次收起。多图预览高度上限 420px。
- 文件名移到图片下方。原右键打开文件夹、复制图片及点击放大功能保留。
- 用户上传、模型返回的图片附件和 Markdown 图片共享展示组件；Markdown 图片也可点击放大。
- 新样式只作用于聊天图片，不调整壁纸、全局字体和其他图片入口。

## 实现

- `src/renderer/assets/dev-chat-image-layout.mjs`：可读的共享展示组件；通过已有 `ChatImage` 加载图片，沿用本地文件权限和会话副本机制。
- `src/renderer/assets/dev-chat-images.css`：限定作用域的响应式布局。
- `scripts/patch-chat-images.mjs`：幂等接入现有聊天附件、Markdown 和 HTML；恢复转换时也会保留本次改动。
- `scripts/update-installed-chat-images.mjs`：按安装版原有文件打补丁，备份后更新，不以开发目录的整个包覆盖安装版。

## 验证入口

```powershell
node --test test/chat-images.test.mjs
npm run check
node scripts/chat-image-layout-smoke.mjs
node scripts/chat-images-smoke.mjs
```

安装版隔离验证：

```powershell
node scripts/chat-image-layout-smoke.mjs --executable=E:/AI/ShineAI/ShineAI.exe
```

图片布局专项运行完整 Electron、真实文件读取和截图查看，使用独立测试数据，不调用模型，不向用户会话注入测试消息。验证横图与竖图比例、文件名位置、长图展开收起、多图宽窄布局、上传图片、Markdown 图片、点击放大与小图不放大。证据在 `artifacts/chat-image-layout/`。

本轮首次 `npm run check`：206 项测试、构建、verify、基础窗口、云功能边界和 Codex 探测通过；本地响应耗时门槛为 1500ms，实测 1531ms 未过，链路因此未执行编辑器阶段。单独复测及剩余阶段的实际结果另见本轮日志，不能把首次检查标记为全通过。

最终补充：

- 开发版图片布局 10 组检查通过；安装版图片布局 11 组检查通过（额外确认实际用户目录隔离），错误列表为空。安装版截图已实际查看，见 `artifacts/chat-image-layout/installed/`。
- 安装版原图片回归 5 组通过：混合文本提取、缺失文件提示、创建会话副本、重启且原图删除后的副本读取、删除会话后的副本清理。证据 `artifacts/chat-images/installed/report.json`。
- 编辑器阶段单独补跑，5 组检查通过；证据 `artifacts/chat-image-layout-editor-check.log`。
- 本地响应耗时单独复测仍未过，最大 3373ms，不能宣称整套检查全部通过。证据 `artifacts/chat-image-layout-local-recheck.log`。未修改该门槛或本地环境检测实现。
- 已在备份后更新 `E:/AI/ShineAI` 的四个图片展示文件，没有覆盖主进程、预加载或用户数据，也没有退出用户正在使用的进程。备份及逐文件 SHA-256 在 `artifacts/installed-chat-images-1793085409167/report.json`；用户下次完全退出并重新打开后生效。
