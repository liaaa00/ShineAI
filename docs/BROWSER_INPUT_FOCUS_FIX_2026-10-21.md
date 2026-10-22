# 内置浏览器鼠标输入修复（2026-10-21）

## 问题与证据

用户要求在 ShineAI 真正的内置浏览器中完成网页自动化验证，不能用独立 Chromium 的测试结果代替。

在用户运行中的安装版，通过实际 CDP 门面创建独立 localhost 测试页，可以复现：移动事件到达页面，但鼠标按下、释放和点击没有到达。页面此时 `document.hasFocus()` 为 true，且可见。`Page.bringToFront`、修正 mouse move 的 button 参数、取消拖动、重置忽略输入/触摸模拟均没有恢复点击。

在相同页面、相同连接上执行 `Emulation.setFocusEmulationEnabled({enabled:true})` 后，按下、释放和点击立即恢复。关闭该模拟后不一定再次失败，说明它能初始化或恢复输入焦点状态，不能把现象简化为每次开关必然失败/成功。证据见 `artifacts/browser-input-diagnosis/live-report.json`。

结论范围：已证实内置 Chromium 的输入焦点准备能恢复此故障，DOM focus 并不足以判断输入状态；尚未定位 Chromium 内部具体代码分支。不是内置浏览器永久禁止点击，也不是缺少 Playwright 安装。此前 `backgroundInvoke:false` 对应的是没有可用页面目标，不能据此推导点击被永久禁用。

## 实现

- `src/main/extensions/browser-input-focus.cjs`：页面级 CDP 连接首次收到已获准的 `Input.*` 时，先准备虚拟焦点，收到确认后按序释放输入及排队请求。不会主动把系统窗口切到前台。
- 保留原有用户接管、跨会话和登录/验证码保护。在准备等待期间发生接管时，释放队列还会重新检查权限。
- 准备失败或超时明确返回 CDP 错误；连接关闭时丢弃待发输入。
- `scripts/patch-browser-input.mjs` 将窄补丁接入构建转换，可重复应用。
- 修复针对实际使用的页面 websocket 通道；没有宣称覆盖所有浏览器级 flattened CDP 客户端。

## 验证入口

```powershell
node --test test/browser-input-focus.test.cjs
npm run check
node scripts/browser-input-smoke.mjs --canvas
node scripts/update-installed-browser-input.mjs E:/AI/ShineAI
node scripts/browser-input-smoke.mjs --installed --canvas
```

自动化验证启动完整 ShineAI 应用，使用独立数据目录和本地模型响应 fixture，通过实际 `call_mcp_tool` 调度 `browser_navigate` 和 `browser_get_capabilities`，获取真实会话门面，再向该页面通道发送鼠标与键盘输入。不是单独打开一个 Chromium，也没有绕过门面权限检查。

画布验证使用正在运行的 5173 页面，在隔离浏览器存储中创建两个测试节点；等待持久化，并通过真实点击关闭可选登录引导。不会操作用户原有画布。报告和截图在 `artifacts/browser-input/{development,installed}/`。

单元测试覆盖准备确认、事件次序、32 位 CDP 请求 ID、准备期间接管、超时、失败重试、普通读取与关闭清理。端到端覆盖点击、后台拖动、修饰键、接管拒绝与明确授权后的恢复，以及画布框选。

## 本次实际结果

- `npm run check` 退出码 0：171 项单元测试、构建与完整检查链通过。构建指纹 `ddf8954ff00d0f0399afc020a388b479faab73b06aa965ccfde9facfc6db4ac6`，1772 个文件。
- 安装版真实会话通道验证：点击、后台拖动/修饰键、接管拒绝、授权恢复、双节点 Shift 框选、空格抓手平移，均通过。
- 额外画布行为检查未通过：清空选区后的第一次 Shift 框选选中 1 个节点，第二次 Shift 框选另一节点后仍只选中 1 个，未达到累计 2 个的预期。因此 `--installed --canvas` 的报告明确标记该项 false，并以非零退出，不能表述为全部画布回归通过。
- 画布空白点击清除选区的尝试也没有达到预期，尚未进一步定位。没有修改 5173 画布项目的业务代码；以上属于后续需要单独调查的画布行为，不能用来否认已观察到的浏览器鼠标输入恢复，也不能隐藏它们。
- 安装备份：`artifacts/installed-browser-input-1792571979613/report.json`，仅更新两个文件。

安装更新只修改 `main/index.js` 和 `main/extensions/browser-input-focus.cjs`，备份和哈希报告写入 `artifacts/installed-browser-input-*`；不改配置、聊天记录或凭据。已运行的主进程需要完全退出并重新打开才会加载磁盘上的主进程修复。
