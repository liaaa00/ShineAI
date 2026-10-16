# 内置文件编辑器

文件编辑器使用随程序发布的 `renderer/monaco/vs`，包括 AMD loader、编辑器、样式、语言模块和 worker。加载地址由 renderer 模块的本地 URL 推导，支持安装路径包含空格、中文；不依赖 CDN，不改变其他服务商或市场的联网行为。

`dev-editor-runtime.js` 合并并发初始化。超过 5 秒时暂时显示只读文本，同一次加载继续进行，成功后自动恢复完整编辑器。真正加载失败后，“重试编辑器”会清除失败的 AMD/loader 状态并再次加载；组件卸载后不更新其状态。完整编辑器尊重文件标签的只读权限，不覆盖已有内容或未保存修改。

`scripts/patch-editor-runtime.mjs` 保存可重复应用的恢复补丁，已接入 `apply-dev-transforms.mjs`。`scripts/update-installed-editor-runtime.mjs` 为独立安装版同步该补丁和本地编辑器资源；先备份并记录哈希，失败回滚，保留其名称、配置及数据目录。

运行 `npm run smoke:editor`，或向脚本传入 `--executable=独立安装版exe路径`。在隔离配置里实际打开 README，断网验证本地脚本、样式、JSON worker，随后模拟慢加载和首次失败，验证自动恢复、按钮重试、完整编辑器只读状态。故障模拟只拦截 loader 脚本插入，后续加载真实本地编辑器。报告位于 `artifacts/editor-runtime-report.json`、`artifacts/installed-editor-runtime-report.json`。

2026-10-16 验证：`npm run check` 全部通过，包含 61 项单元测试及新增编辑器专项；工程版和桌面独立安装版的 5 项编辑器专项均通过，未发生页面异常。当前运行窗口的 README 已恢复完整编辑器且超时提示消失；当时有后台任务运行，因此未重启程序或重载页面。安装文件已同步，新的本地加载流程在下一次正常启动时使用。
