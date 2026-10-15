# Windows 安装与打包

安装输出名称为 `artifacts/installer/ShineAI-1.0.6-windows-x64-setup.exe`。可执行文件、快捷方式、安装器显示名均为 **ShineAI**；协议入口为 `shineai-dev` 和保留的 `claudeops-dev`。

安装版数据位于 `%APPDATA%\ShineAI\Desktop`，源码开发数据位于工程 `.data`。不会自动导入官方账号或其他旧应用的数据，也不会覆盖本机另一旧项目已有的 `%APPDATA%\ShineAI` 根数据。卸载保留用户数据。切换旧开发版前应先关闭它并备份/导出配置，不能在应用写入时复制 SQLite。

本轮完成品牌代码和运行检查，尚未生成新的 ShineAI 安装包。此前安装器、哈希和安装耗时属于旧名称版本的历史记录，不能作为新包的验收结果。

## 首次准备

先按 README 恢复应用依赖、资源和固定的 Electron 44.5.1（ABI 149）。打包工具独立安装：

```powershell
New-Item -ItemType Directory -Force .runtime/packaging
Copy-Item scripts/packaging/package.json .runtime/packaging/package.json
Copy-Item scripts/packaging/package-lock.json .runtime/packaging/package-lock.json
npm ci --prefix .runtime/packaging --no-audit --no-fund
node scripts/packaging/restore-nsis.mjs
```

## 生成与验证

```powershell
npm run package:win
npm run test:installer-payload
```

`package:win` 先执行完整检查，再生成 Windows x64 当前用户安装器。它只打包 `out`、应用依赖、公共资源和固定 Electron，不包含项目 profile、模型凭证、日志或 archive。使用 `prepackaged` 避免替换原生依赖，不使用 ASAR 以保留 CLI、终端、Python 的真实路径。

安装器使用 NSIS 3.11、现代 7-Zip 和压缩级别 3，校验 ZIP 完整性，输出 SHA-256 与构建报告。没有代码签名证书时显示未知发布者。

`test:installer-payload` 提取新安装包进行校验并运行隔离测试，不修改用户的安装注册项。`test:installer` 会实际安装、启动并卸载测试程序；已有同名安装时拒绝覆盖。两者不能互相代替，具体范围以新生成的报告为准。

已有 **ShineAI** 安装的源码更新命令为：

```powershell
node scripts/update-installed.mjs "E:/AI/ShineAI"
```

先退出应用。脚本校验目标身份和构建哈希，备份后更新 `resources/app/out`，失败回滚；不更新运行时、内置资源或用户数据，因此本轮包含内置 MCP 路径改名的首次品牌切换应使用新安装包或完整副本，不能只运行这个增量命令。

完整压缩包含大量模型 CLI 和运行时文件，耗时比开发构建长。日常开发使用 `npm run build` 和 `npm start`，需要安装体验时再打包。
