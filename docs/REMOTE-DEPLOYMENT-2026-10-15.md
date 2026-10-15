# 公网部署验收 · 2026-10-15

## 访问与使用

手机工作台地址：**https://192.144.191.108**。已取得 Let's Encrypt 公网 IP 证书，无需域名或浏览器证书例外。登录账号与密码通过本机不入库的 `artifacts/remote-server-login.txt` 交付；它们独立于服务器 SSH 账号。

手机登录后点击“连接电脑”，生成一次性绑定码；新版桌面右下角打开“手机协同”，填写上述地址和绑定码，勾选允许访问的会话并开启连接。电脑必须保持运行。当前为单所有者版本，不能为不同用户提供独立账号和隔离空间。

## 部署结构

- 系统：OpenCloudOS 9.6，服务器原有其他容器保持原状。
- 服务代码：`/opt/shineai/app/remote/server`，普通用户 `shineai-remote` 运行，监听 `127.0.0.1:7940`。
- 运行时：`/opt/shineai/runtime/node`，Node `v24.22.0`；官方 Linux x64 归档 SHA-256 为 `cc2f601cee82d9a5a233302fe307abc600727035fd7d2c3a3571755989e95008`，安装前已校验。
- 系统服务：`shineai-remote.service`，已启用开机启动、故障重启和进程限制。
- 配置：`/etc/shineai-remote.env`，root 所有、权限 `600`；持久化状态位于 `/var/lib/shineai-remote`，服务用户独占、目录权限 `700`。
- HTTPS 代理：`/opt/shineai/proxy/compose.yaml`，Compose 项目 `shineai-mobile`，容器 `shineai-mobile-proxy-1`，复用服务器已有 Caddy 2.11.4 镜像并固定摘要。代理开机自动恢复，ACME 证书存入专用 Docker 数据卷。
- 公网仅通过 80/443 的 Caddy 访问程序；没有将 Node 的 7940 端口公开监听。未修改已有防火墙规则。

通用系统服务模板见 `remote/systemd/shineai-remote.service`，IP 证书模板见 `remote/Caddyfile.ip.example`。临时公共域名签发曾遭云平台拦截，最终采用直接 IP 的可信证书。

## 已完成验收

在本机通过公网 HTTPS 访问实际服务器，11 项桌面与手机网页端到端检查全部通过：默认关闭、实际登录和绑定、只读到勾选会话、拒绝未共享会话、手机消息交给真实桌面与 Claude CLI 后回复同步、网页无桌面权限、模型请求未结束时停止、断开、重连保留草稿、桌面重启不重放、手机撤销设备。

模型响应来自本地模拟服务，没有使用用户模型密钥或产生付费模型请求。测试设备已通过撤销流程清理。报告及截图位于 `artifacts/remote-public-e2e-report.json`、`artifacts/remote-public-mobile.png`，均不入库。

此外已验证服务器进程重启后手机登录仍有效，代理容器重启后可信 HTTPS 和健康接口恢复，系统服务与代理的自动启动策略生效。

证书首次签发、可信链和 IP 匹配已验证；自动续期配置已启用，尚未经历实际到期续签。实际手机的后台限制、移动网络切换与真实模型仍需用户体验后补充验证。当前没有重新打包安装器或覆盖用户原安装版。

## 维护

```sh
systemctl status shineai-remote
journalctl -u shineai-remote --since today
docker compose -p shineai-mobile -f /opt/shineai/proxy/compose.yaml ps
curl -fsS https://192.144.191.108/health
```

升级前停止程序并备份状态目录；更新代码、保持锁文件依赖一致后再启动。保留代理数据卷和入站 TCP 80/443，以便 Caddy 持续续期短期 IP 证书。离线改密命令和服务边界详见 [使用说明](../remote/README.md)。
