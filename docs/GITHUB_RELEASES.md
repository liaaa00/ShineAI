# 在 GitHub 构建与发布安装包

日常发版不需要本地打包或上传依赖，也不需要本地 Windows / Mac 同时在线。

1. 将修改提交到 `main`。
2. 打开仓库的 **Actions → Build and release desktop installers → Run workflow**。
3. 分支选择 `main`，版本标签可以留空自动生成；也可以填写一个尚未使用的标签。
4. 等工作流完成，到 **Releases** 下载 Windows x64、Mac M 系列 DMG / ZIP、Mac Intel ZIP。

工作流先创建草稿，然后在 Windows 与两种原生 Mac runner 上构建。Windows 自动运行
源码检查、后台命令回归，以及实际安装、启动和卸载；Mac 检查安装文件中的数据库、
终端、CLI、工作台和沙箱。所有平台都成功，且四个安装文件与 SHA-256 全部匹配后，
才公开发布。失败时保留草稿和 Actions 日志，不替换已有的可用版本。

## 固定的构建输入

根目录应用依赖来自经过校验的快照，不能用根目录 `npm install` 替换 ABI 149 原生模块。

- Mac 使用持久保存的草稿 `build-inputs-v1` 中的 `runtime-dependencies-ci.zip`。它是可复用
  的构建依赖，不是安装包；不要删除这个草稿或附件。每次使用都会校验固定 SHA-256。
- Windows 从 `scripts/packaging/release-inputs.json` 指定的旧版安装器恢复固定运行时、
  应用依赖和未跟踪的大型资源。下载后先验证固定 SHA-256，只恢复允许的目录。
  当前源码、图标和其他跟踪资源始终取自本次 GitHub checkout。
- 工具依赖使用独立锁文件；NSIS 与 rcedit 下载后也会校验固定 SHA-256。

这些输入只在运行时或依赖实际升级时维护，不需要每次界面修复都重新上传。
新工作流不依赖本地 `D:` / `E:` 安装目录、用户会话、API Key 或个人配置。

Actions 的安装包和报告 Artifacts 保存三天；已公开 Release 的安装包持续保留。
旧的 `Package macOS` 和 Intel 修复流程供单个平台维护，日常发布统一使用新的桌面流程。

## 当前限制

内部兼容版本仍是 1.0.6，每次发布使用独立标签与精确源码提交区分，旧标签不重写。
Windows 没有商业代码签名；Mac 只有临时签名、没有 Apple Developer ID 或公证。
自动测试不消耗用户模型额度，也不能代替实体 Mac 上的全部权限与交互测试。
