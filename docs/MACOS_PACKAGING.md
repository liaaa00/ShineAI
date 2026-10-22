# macOS 安装包

支持分别构建 Apple Silicon（arm64，M 系列）与 Intel（x64）DMG 和 ZIP。
Windows 安装器使用原有 NSIS 流程；Mac 安装器由 GitHub Actions 的原生 Mac runner 构建。

## 构建方式

根目录依赖不能用普通 `npm install` 替换。当前项目仍依赖校验过的发布依赖快照。
维护者在完整 Windows 工程运行 `node scripts/prepare-release-input.mjs`，生成不含 profile、
环境文件或官方归档的 `artifacts/release-input/runtime-dependencies.zip`。将其及 SHA-256
传入临时草稿 Release 和 `Package macOS` 工作流。工作流根据指定哈希校验快照，
安装固定的对应架构 Codex CLI，下载校验过的 Electron 44.5.1，再打包。

工作流是手动触发，不对 PR 运行，不执行其他分支提交的安装脚本。构建必须使用可信源码。
依赖快照仅作此次构建输入，正式发布时可以移除；以后重建需要重新提供相同快照。

`package-macos.mjs` 只在 Mac 上运行，恢复依赖解压后丢失的执行权限，保留沙箱和隔离，
使用对应架构的数据库与 PTY 原生模块。`macos-package-smoke.mjs` 实测安装包对应的
应用目录、SQLite 查询、真实终端、Claude/Codex CLI 启动、工作台加载和窗口沙箱。
检查不消耗用户模型额度，不证明真实模型调用或全部 Mac 桌面权限场景都可用。
Windows 专用的 Git Bash/Python 不塞入 Mac 包；需要 Python/Git 的功能使用 Mac 自己的环境。

## 安装

选择自己芯片对应的 DMG，打开后将 ShineAI 拖到“应用程序”。也可解压 ZIP 后移动 `.app`。
首次打开可能被 macOS 安全检查拦截：确认来源是自己的仓库后，在“系统设置 → 隐私与安全性”
选择“仍要打开”。本项目未提供 Apple Developer ID 签名或公证；Apple Silicon 使用临时签名。
屏幕录制、辅助功能、麦克风等权限按使用功能在系统设置中授予。

安装包、SHA-256 和 CI 检查报告分别附在 Release 与工作流 Artifacts 中。
历史安装包版本号仍为上游兼容版本 1.0.6，具体源码由带日期的 Release 标签和 Git commit 标识。
