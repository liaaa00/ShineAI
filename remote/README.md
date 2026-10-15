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

需要域名、支持 HTTPS/WebSocket 的反向代理，以及能运行 Docker 的服务器。服务器不安装完整 Electron，也不复制电脑的项目或模型凭证。

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

本轮验证以本地服务器和模拟模型为准；真实域名、TLS 代理、手机系统后台限制及公网断线环境还需要在实际部署后验收。
