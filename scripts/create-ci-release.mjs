import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
if (process.env.GITHUB_ACTIONS !== 'true' || process.env.GITHUB_REF !== 'refs/heads/main') throw Error('Release only from main in GitHub Actions');
const version = JSON.parse(fs.readFileSync('package.json', 'utf8')).version;
const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const tag = process.env.RELEASE_TAG || `v${version}-local.${date.replaceAll('-', '')}.r${process.env.GITHUB_RUN_NUMBER}`;
if (!/^v[0-9][0-9A-Za-z._-]{0,79}$/.test(tag)) throw Error('Invalid release tag');
const commit = process.env.GITHUB_SHA;
if (!/^[a-f0-9]{40}$/.test(commit)) throw Error('Missing source commit');
fs.mkdirSync('artifacts', { recursive: true });
const notes = `ShineAI ${date} 桌面体验版。内部兼容版本 ${version}，源码提交：${commit}。

本次更新：后台命令结果保留在原执行卡片内；移除回答下方的大块重复结果；回答后才发生的失败显示可定位的简短提醒；后续重试回答会收起旧提醒，原执行记录与日志保留。

安装文件：Windows x64 安装程序；Mac M 系列 DMG / ZIP；Mac Intel ZIP。Mac 解压或打开 DMG 后，将 ShineAI.app 移至“应用程序”。

本 Release 由 GitHub Actions 从指定源码构建。Windows 执行自动检查和实际安装器验证；Mac 在对应架构原生 runner 验证安装文件内的工作台、数据库、终端、CLI 与沙箱。未进行真实付费模型调用，也未在用户实体 Mac 上测试。详细证据见本次 Actions 运行。

安装包未商业签名，Mac 为临时签名、无 Apple Developer ID 或公证。首次打开若被拦截，请在“系统设置 → 隐私与安全性”允许打开。每个安装文件附 SHA-256；不包含个人会话、密钥或本地配置。
`;
fs.writeFileSync('artifacts/ci-release-notes.md', notes);
execFileSync('gh', ['release', 'create', tag, '--draft', '--target', commit, '--title', `ShineAI ${date} · ${tag.split('.').at(-1)}`, '--notes-file', 'artifacts/ci-release-notes.md'], { stdio: 'inherit' });
fs.appendFileSync(process.env.GITHUB_OUTPUT, `release_tag=${tag}\n`);
