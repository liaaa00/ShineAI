# macOS 安装包

Apple Silicon（arm64，M 系列）提供 DMG 与 ZIP；Intel（x64）提供 ZIP。
ZIP 解压后把 `ShineAI.app` 拖入“应用程序”即可安装。Intel 构建环境的磁盘镜像工具
曾持续卡住，因此该架构采用标准的应用 ZIP 分发，并直接测试 ZIP 内的程序。
Windows 安装器使用原有 NSIS 流程；Mac 安装器由 GitHub Actions 的原生 Mac runner 构建。

## 构建方式

日常发布使用 [统一 GitHub 发布流程](GITHUB_RELEASES.md)：在 Actions 运行
`Build and release desktop installers`，Windows 和两种 Mac 会自动构建、检查和发布。
下面的快照准备只在首次设置或依赖升级时需要；当前快照已持久保存在 `build-inputs-v1`
草稿中，后续界面改动不需要重新上传。

根目录依赖不能用普通 `npm install` 替换。当前项目仍依赖校验过的发布依赖快照。
维护者在完整 Windows 工程运行 `node scripts/prepare-release-input.mjs`，生成不含 profile、
环境文件或官方归档的 `artifacts/release-input/runtime-dependencies.zip`，同时生成 64 MiB 的
`.part-000` 等分片。将分片和 SHA-256 上传临时草稿 Release，再将标签及完整 ZIP 的
SHA-256 传入 `Package macOS` 工作流。工作流合并分片，根据指定哈希校验快照，
安装固定的对应架构 Codex CLI，下载校验过的 Electron 44.5.1，再打包。

工作流是手动触发，不对 PR 运行，不执行其他分支提交的安装脚本。构建必须使用可信源码。
依赖快照是可复用的构建输入；请保留 `build-inputs-v1` 草稿及其附件供后续工作流使用。

`package-macos.mjs` 只在 Mac 上运行，恢复依赖解压后丢失的执行权限，保留相对符号链接，
避免 CLI 快捷命令指向构建机器；发行前校验深度签名，保留沙箱和隔离，
使用对应架构的数据库与 PTY 原生模块。`macos-package-smoke.mjs` 实测安装包对应的
应用目录、SQLite 查询、真实终端、Claude/Codex CLI 启动、工作台加载和窗口沙箱。
检查不消耗用户模型额度，不证明真实模型调用或全部 Mac 桌面权限场景都可用。
Windows 专用的 Git Bash/Python 不塞入 Mac 包；需要 Python/Git 的功能使用 Mac 自己的环境。

## 安装

M 系列可打开对应 DMG 后将 ShineAI 拖到“应用程序”；Intel 解压 ZIP 后移动 `.app`。
首次打开可能被 macOS 安全检查拦截：确认来源是自己的仓库后，在“系统设置 → 隐私与安全性”
选择“仍要打开”。本项目未提供 Apple Developer ID 签名或公证；Apple Silicon 使用临时签名。
屏幕录制、辅助功能、麦克风等权限按使用功能在系统设置中授予。

安装包、SHA-256 和 CI 检查报告分别附在 Release 与工作流 Artifacts 中。
历史安装包版本号仍为上游兼容版本 1.0.6，具体源码由带日期的 Release 标签和 Git commit 标识。
