# ShineAI 随行工作台 · 第一版

手机浏览器登录后，绑定自己的电脑，查看指定会话、继续发消息、读取回复、停止运行。电脑主动连接自建服务器，模型凭证留在电脑。本服务独立于旧厂商平台。

当前为**单账号、自用版本**：一个服务实例只有一个所有者账号，最多绑定 20 台电脑；不是多租户服务。不要让不同用户共用这个所有者账号。独立用户账号、共享权限、审批、附件、文件下载和通知属于后续阶段。

## 本地验证

本机完整工程已准备运行依赖；新克隆时先按根 README 恢复桌面环境，再安装服务器依赖：

```powershell
npm ci --prefix remote/server --ignore-scripts
npm run check
npm run smoke:remote
```

专项测试启动独立 Electron、手机尺寸网页、本地中转和实际 Claude CLI，模型响应来自本地模拟服务，不读取用户的日常数据或模型凭证。报告与手机界面截图保存在 `artifacts/remote-e2e-report.json` 和 `artifacts/remote-mobile.png`。

本地手动运行服务器，在终端设置 `SHINEAI_REMOTE_USER`、`SHINEAI_REMOTE_PASSWORD`（至少 12 字符），执行 `npm run remote:start`。默认仅监听 `127.0.0.1:7940`，数据在工程 `.remote-data`。本机浏览器打开 `http://127.0.0.1:7940`；这个地址不能直接从另一台手机访问。

## 部署到自己的服务器

需要公网 HTTPS 地址、支持 WebSocket 的反向代理，以及能运行 Docker 的服务器。服务器不安装完整 Electron，也不复制电脑的项目或模型凭证。

没有域名时，也可以通过支持 ACME profiles 的 Caddy 为固定公网 IPv4 申请 Let's Encrypt 短期证书，直接使用 `https://公网IP`。配置示例见 `remote/Caddyfile.ip.example`，需要开放 TCP 80/443，并保持代理与证书数据卷持续运行以自动续期。首次签发成功不代表已经验证后续续期。

1. 克隆本工程。复制 `remote/.env.example` 为 `remote/.env`，填写真实的 HTTPS 地址、用户名和新密码。该文件已排除在 Git 之外。
2. 在工程根目录运行：

   ```sh
   docker compose --env-file remote/.env -f remote/compose.yaml up -d --build
   ```

3. 将域名解析到服务器，用 Caddy 或已有反向代理转发至 `127.0.0.1:7940`，启用 HTTPS 和 WebSocket；Caddy 示例见 `remote/Caddyfile.example`。Compose 仅将服务端口绑定到服务器回环地址。
4. 手机浏览器访问填写的 HTTPS 地址，登录后点击“连接电脑”。在新版桌面右下角打开“手机协同”，填写同一服务器地址和一次性绑定码。
5. 绑定成功后，勾选允许访问的会话，启用“允许手机连接这台电脑”，保存。默认没有共享会话，绑定本身不会开启远程执行。

容器以普通用户运行，程序文件只读，持久化状态存入 `remote-data` 卷。应保持**单实例、单进程**；当前存储为小型原子 JSON 文件，不支持多个进程共同写入，也没有实现数据库集群或高可用。备份应在停止服务后进行，保留数据卷；删除数据卷会丢失账号和绑定。

账号在首次启动时创建，后续不会因为修改环境变量而自动更换密码。需要更换密码时，停止服务后使用下文的本地管理命令；不要删除数据卷来重置账号。

## 账号管理

停止服务后，在同一数据卷上运行 `node admin.cjs reset-password`，从环境变量 `SHINEAI_REMOTE_PASSWORD` 读取新密码。Compose 示例：

```sh
docker compose --env-file remote/.env -f remote/compose.yaml stop server
# 先在 remote/.env 中换成新密码。
docker compose --env-file remote/.env -f remote/compose.yaml run --rm server node admin.cjs reset-password
docker compose --env-file remote/.env -f remote/compose.yaml up -d
```

此操作撤销手机登录会话和全部设备凭证，电脑需要重新绑定。管理命令不打印新密码、会话令牌或设备凭证。

## 操作边界

- 电脑需保持开机、联网并运行 ShineAI。电脑端可以立即关闭连接或解除绑定；手机也能解除电脑绑定。断开连接不会终止已经开始的本地任务。
- 手机只能访问电脑明确勾选的会话。会话的模型、工作目录和权限沿用桌面配置；手机输入可能触发该会话允许的真实操作。需要额外授权或计划确认时，回电脑端处理。
- 第一版每 2 秒刷新会话快照，显示最近 30 条文字消息，每条最多显示末尾 4000 字符；没有整盘同步、完整历史翻页、工具参数/富媒体展示和文件下载。
- “电脑已接收”表示发送接口返回，不代表任务已经完成；任务状态和回复以电脑后续快照为准。
- 离线时不排队远程指令。断线后的指令结果可能未知，先查看会话再决定是否重发，避免用户主动创建新的指令编号而重复操作。
- 指令具有编号和截止时间。电脑先持久化操作回执再执行，同编号重试不会重复发消息；重启后不确定的旧操作不会自动再执行。回执保存 24 小时，时间窗内最多 4000 条。
- 服务端不持久化会话正文，但在内存中暂存请求与结果；因此服务器管理员和运行环境属于信任边界。当前未实现端到端加密，不把 TLS 等同于服务器看不到会话内容。
- 登录使用 HttpOnly / SameSite Cookie，HTTPS 下带 Secure；写操作校验 Origin 和 CSRF。设备凭证只保留散列，电脑使用系统安全存储保存凭证。公网地址强制 HTTPS，回环 HTTP 仅用于本机测试。

本地专项测试使用模拟模型；实际 HTTPS 部署可使用下文的公网验收模式。已部署实例的结果见 [公网部署记录](../docs/REMOTE-DEPLOYMENT-2026-10-15.md)。手机系统后台限制、移动网络切换和真实模型仍需分别体验验证。

## 使用独立 Node 服务

无法拉取 Node 容器镜像时，可安装独立 Node 20+，使用 `remote/systemd/shineai-remote.service`。示例约定代码位于 `/opt/shineai/app`，Node 可执行文件为 `/opt/shineai/runtime/node/bin/node`，程序使用普通系统用户 `shineai-remote`，数据目录为该用户独占的 `/var/lib/shineai-remote`。

系统管理员准备 `/etc/shineai-remote.env`（权限 `600`），设置 `NODE_ENV=production`、`HOST=127.0.0.1`、`PORT=7940`、`SHINEAI_REMOTE_DATA_DIR=/var/lib/shineai-remote`，以及前述 `SHINEAI_REMOTE_PUBLIC_URL`、`SHINEAI_REMOTE_USER`、`SHINEAI_REMOTE_PASSWORD`。安装锁定服务器依赖后，将单元文件安装到 `/etc/systemd/system/`，执行 `systemctl daemon-reload` 和 `systemctl enable --now shineai-remote`；HTTPS 代理转发到回环端口即可。

检查运行状态使用 `systemctl status shineai-remote`，日志使用 `journalctl -u shineai-remote`。备份和离线改密前先停止该服务；不要同时启动两个进程写同一状态目录。

## 对已部署服务进行验收

配置环境变量 `SHINEAI_REMOTE_E2E_URL`、`SHINEAI_REMOTE_E2E_USER`、`SHINEAI_REMOTE_E2E_PASSWORD` 后运行 `npm run smoke:remote`，会改为连接实际部署的服务，在独立桌面测试数据中创建并绑定一台测试电脑。成功结束时撤销测试设备；失败后应在设备列表中清理遗留测试绑定。此模式会真实访问所指定服务，但模型请求仍使用本地模拟服务。

公网验收报告和截图输出为 `artifacts/remote-public-e2e-report.json`、`artifacts/remote-public-mobile.png`。不要把登录凭据写入脚本、命令行参数或提交到版本库。
