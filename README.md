# ShineAI

ShineAI 是以本地电脑为中心的 AI 桌面开发工程，基于 1.0.6 发布客户端重建。它保留本地项目、会话、文件、Git、终端、公开 Skill/MCP 市场，以及用户自行配置的 Claude、Codex、Gemini 和兼容 API。

当前工程包含可读的启动、安全和扩展模块，以及部分已打包、仍保留混淆命名的发布代码。它适合逐步二次开发，不等于作者完整的原始源码。

旧厂商的登录、会员、计费、云中继、协作、遥测和自动更新已移除。本地身份只是本地功能配置；模型服务仍使用用户自己的凭证和额度。

## 开发

需要 Windows x64、Node.js 20+、Python 3.11+。本机完整工作目录为 `D:\AI\ShineAI`。

```powershell
npm run build
npm start
```

开发数据保存在工程的 `.data`；安装版保存在 `%APPDATA%\ShineAI\Desktop`，以避开本机另一旧项目已经使用的同名数据目录。启动不会自动读取官方版或其他旧项目的数据。改名后的浏览器偏好支持一次性复制旧键，保留新设置与原始用户内容；已有加密记录的格式参数保持兼容。

### 从 GitHub 恢复完整运行环境

仓库提交应用源码、构建脚本、测试、内置技能/MCP 代码和手机网页资源；不提交个人数据、依赖目录、官方安装快照、运行时二进制或安装包。仅克隆仓库还不能直接运行完整桌面程序。

1. 将本地保存的 `official-1.0.6.asar` 及对应的 `.asar.unpacked` 放入 `archive/`。归档 SHA-256 必须为 `352bf011b87d372e85cd8c7da35e1fccef20b271f44a4f0f43911ca26239a9fe`。然后运行 `npm run restore:dependencies`，恢复 ABI 149 的应用依赖。不要用根目录 `npm install` 替换发布快照。
2. 将固定的 `electron-v44.5.1-win32-x64.zip` 放入 `.runtime/`，运行 `python scripts/restore-runtime.py`。校验值见脚本。测试工具运行 `npm ci --prefix .runtime --ignore-scripts`。
3. 从自己的完整工程备份恢复 `resources/git-bash`、`resources/runtime`、`resources/tools`、`resources/voice`，以及 `resources/builtin-mcps/shineai-claw/node_modules`。也可用 `node scripts/restore-local-resources.mjs "完整备份目录"` 复制这些固定目录；不会读取备份中的用户数据。该 MCP 的依赖也可在其目录执行 `npm ci --omit=dev --ignore-scripts`。
4. 运行 `npm run check`，然后 `npm start`。需要重做上游解码时，还须提供未修改的 `archive/official-1.0.6/` 基线；普通开发直接修改现有 `src`。

本机完整工程保留这些离线资源。GitHub 上传的是工程代码，不是完整安装分发镜像。

## 验证与打包

```powershell
npm run check
npm run smoke:brand
npm run smoke:file-links
npm run smoke:market
npm run e2e:local
npm run package:win
```

`check` 包含单元、构建、真实 Electron 窗口、隔离边界、云服务移除、Codex 模拟中转和本地响应检查。`e2e:local` 覆盖项目、文件、Git、真实终端与重启保存；这些检查不使用用户的模型密钥。`npm run e2e` 会调用已配置模型，需自行选择执行。

安装包输出为 `artifacts/installer/ShineAI-1.0.6-windows-x64-setup.exe`。打包工具首次准备步骤见 [安装与打包](docs/INSTALLER.md)。已有旧名称安装包不会因修改源码而自动更新。

## 代码入口

| 路径 | 用途 |
|---|---|
| `src/main/bootstrap.cjs` | 独立配置、窗口隔离、IPC 边界 |
| `src/main/extensions/` | 新功能与兼容修复，优先在这里开发 |
| `src/main/security/` | IPC 来源验证、云服务拦截 |
| `src/preload/` | 受控桌面接口与类型 |
| `src/renderer/` | 桌面 UI、全局图片/视频外观、文件定位 |
| `resources/builtin-skills/`、`resources/builtin-mcps/` | 随应用提供的本地能力 |
| `resources/web-client/` | 已发布的手机网页产物，尚未接入自建远程服务 |
| `scripts/`、`test/` | 构建、补丁、运行检查与单元测试 |

手机协同建议采用“手机网页 → 自建账号/设备服务器 → 电脑端出站连接”的方式。会话状态和产物按需同步，任务在电脑执行；电脑离线时无法操作电脑文件。现有手机网页并非可直接上线的自建方案。依据、可复用范围和实施顺序见 [手机远程协同分析](docs/MOBILE-REMOTE-PLAN.md)。

更多说明：[二次开发指南](docs/二次开发指南.md)、[文件定位](docs/FILE_LINKS.md)、[本轮交付记录](docs/SHINEAI-DELIVERY-2026-10-15.md)。其他检查报告包含此前开发阶段的历史证据，应以本轮记录区分实际验证范围。

本仓库的重建与改名不改变上游及第三方代码、资源的权利归属；保留原有许可文件。没有将整个重建工程重新声明为 MIT 授权。
