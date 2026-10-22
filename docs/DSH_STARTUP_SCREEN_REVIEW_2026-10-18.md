# dsh-startup-screen 接入评估

评估日期：2026-10-18。仓库：<https://github.com/QIFANAI/dsh-startup-screen>。
检查版本：1.6.0，提交 `8499f9df21c6cb27bef8ed7bb1ba29da654fc795`。
本次只检查源码、运行原项目测试及独立浏览器预览，没有修改 ShineAI 生产代码或安装插件。

## 结论

适合提取浏览器动画运行时，改造成 ShineAI 的可选启动动画。不能按原项目的 DSH 插件
安装命令直接装进 ShineAI，也不是 Skill。建议作为独立功能适配，保留现有主界面字体、
全窗口壁纸与透明度设置。

项目是 DeepSeek Harness 的社区插件，不是整个桌面应用的源码，也不是模型能力扩展。
这可能是此前提到的“deepseek hemers”相关项目，但无法据此确认当时看到的具体应用。

## 可以复用的部分

| 部分 | 源码事实 | ShineAI 用途 |
| --- | --- | --- |
| 启动动画 | `package/lib/splash.js` 为零依赖浏览器脚本，CSS 单独提供 | 标识入场、Canvas 星尘/光带、揭幕 |
| 中文清晰度 | 使用系统字体回退与真实字重；主标题逐字效果移除 blur，稳定后移除 transform | 启动页中文字清晰显示，不能保证任意壁纸上的主界面文字对比度 |
| 动态资源管理 | 限制 Canvas DPR、隐藏页面暂停、结束时停止绘制、减少动态效果时静态显示 | 控制开场动画的额外消耗；实际低配设备性能仍需集成后实测 |
| 可跳过与失败退出 | Esc/按钮跳过、滚动解锁和资源加载失败兜底 | 确保动画不阻止用户进入应用 |
| 明暗风格 | 独立 light/dark 配色 | 跟随 ShineAI 主题，退出动画后继续显示原壁纸 |

## 必须适配的部分

1. `package/lib/index.js` 依赖 DSH 的 `webServer`、`connection`、`ctx.get(...)` 等服务。
   `client.js` 依赖 `window.__ModuleLoader__` 和 DSH 的设置注册接口。ShineAI 没有这套
   插件宿主，不能直接使用原安装方式。
2. 原配置写入 `~/.dsh/dsh-startup.json`，设置页使用 `/dsh-startup/config` HTTP 路由。
   接入时改用 ShineAI 的独立 profile、经过校验的 preload/IPC 接口；不需要新增服务器。
3. 原版“真实事实”来自 DSH 的 profile、模型、插件和会话服务。ShineAI 需要重新映射数据，
   缺数据时显示未知。展示配置不等于已验证模型连接或实际权限。
4. 原版“访问许可、身份确认、读取权限、核验通过”属于动画流程，并没有接入 ShineAI 的
   工具权限审批。建议换成真实的配置加载、会话恢复与界面初始化状态。
5. 品牌文案可配置，但鲸鱼 SVG 路径写在运行时代码中。要替换为 ShineAI 标识，并检查
   音频中的欢迎文案，不能只改配置里的品牌名称。
6. 原版会创建覆盖整个视窗的高层遮罩并临时锁定滚动。需要明确生命周期，正确保存和
   恢复既有滚动状态，兼容窗口控件、开发版角标、浮窗及独立会话窗口。
7. 重播通过重新注入脚本实现，部分 document 监听使用匿名函数。正式接入宜改为明确的
   mount/dispose，验证重复预览不会累积监听、计时器或音轨。

## 推荐产品行为

- 提供启用开关与设置页预览；已启用时可每次启动或每天首次展示。
- 默认静音，始终可以跳过，保留窗口关闭/最小化操作。
- 用户已明确要求完整演出：默认完整模式；快速模式加速整段演出，保留所有视觉阶段。进度条只表示动画阶段，不表示系统初始化进度。
- 不要求重复点击“身份确认”；启动演出不模拟身份验证、账号权限或模型连接成功。
- 动画只覆盖启动期间，结束后完整清理，继续使用用户现有壁纸、透明度与字体。
- 无需模型请求、厂商会员或云端服务。若使用 TTS，另行核对声音来源，默认静音可避免依赖。

## 许可与素材

仓库 LICENSE 明确为 MIT，允许修改和再分发代码，复制相关代码时保留原版权及许可。
GitHub API 自动识别显示 `NOASSERTION`，本结论依据实际 LICENSE 正文。

`THIRD-PARTY-NOTICES.md` 说明原宣传片台词、音效与商业 BGM 没有随仓库分发。
作者自录的 `line-6.mp3` 按该声明允许随项目使用/修改/再分发。正式 ShineAI 版本建议
使用自身标识、文案和有权使用的音频；DeepSeek 商标与鲸鱼标识不能按代码 MIT 一并推定。

## 实际验证范围

- `npm --prefix package test`：73 + 194 + 40 + 45，共 352 项断言通过。
  这些测试主要使用 VM、DOM 和宿主接口替身，不等于真实 DSH 或 ShineAI 集成通过。
- 使用真实 Edge/Playwright 打开原仓库的独立布局预览，检查 light/dark 两个主题、
  Canvas 建立、Esc 移除遮罩和解锁页面。预览中的版本、模型和会话数为原仓库固定样例。
- 报告：`artifacts/research/startup-review-report.json`；截图：
  `artifacts/research/startup-dark.png`、`artifacts/research/startup-light.png`。
- 以上为最初的上游研究记录；当前接入及验证结果见下方补充。

源码参考：

- <https://github.com/QIFANAI/dsh-startup-screen/blob/8499f9df21c6cb27bef8ed7bb1ba29da654fc795/package/lib/splash.js>
- <https://github.com/QIFANAI/dsh-startup-screen/blob/8499f9df21c6cb27bef8ed7bb1ba29da654fc795/package/lib/splash.css>
- <https://github.com/QIFANAI/dsh-startup-screen/blob/8499f9df21c6cb27bef8ed7bb1ba29da654fc795/LICENSE>
- <https://github.com/QIFANAI/dsh-startup-screen/blob/8499f9df21c6cb27bef8ed7bb1ba29da654fc795/THIRD-PARTY-NOTICES.md>

## 音频候选补充

用户允许：能找到类似素材则考虑使用，不合适就静音。2026-10-18 检查以下素材页：

| 来源 | 类型与页面信息 | 页面许可 |
| --- | --- | --- |
| <https://kenney.nl/assets/sci-fi-sounds> | 科幻音效包，70 个文件 | CC0 |
| <https://kenney.nl/assets/digital-audio> | 数字/太空音效包，60 个文件 | CC0 |
| <https://kenney.nl/assets/music-jingles> | 短音乐片段，85 个文件 | CC0 |
| <https://opengameart.org/content/space-music> | mrpoly 的 Space Music，标为 electronic/techno/sci-fi | CC0 |

Kenney 官方支持页 <https://kenney.nl/support> 明确允许在商业项目使用其素材页的
CC0 资源，且不强制署名。具体纳入项目时仍保存所选资源随附的许可与来源记录。

以上为已核对页面与许可的候选，没有逐条试听，不宣称与原 BGM 具有相同听感。
原曲 In Cyberpunk 没有随仓库提供；如需原曲，需另外确认并取得相应软件分发授权。
原仓库作者自录欢迎语与 MIT 代码生成的合成提示音可按其许可沿用。

建议启动动画默认静音，若挑到合适素材可提供可选短提示音。没有合适声音时保持静音，
不阻止动画接入。本次没有添加音频资源或修改 ShineAI 的实际声音设置。

用户随后希望查找原曲供本地使用。通过 Apple iTunes Search API 核对到
Alex Chernykh / In Cyberpunk，trackId `1643702531`，时长 `150500` 毫秒，
与插件文档的 150.5 秒一致：

- 原曲页：<https://music.apple.com/us/album/in-cyberpunk/1643702530?i=1643702531>
- 平台返回的试听片段：<https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/f1/46/4b/f1464b16-811a-06a2-ea7e-3e4d323a39f0/mzaf_7567213402739821401.plus.aac.p.m4a>

本次提供平台试听链接，没有下载或把试听音频加入 ShineAI；平台试听不等于完整歌曲文件。


## ShineAI 完整开场接入（2026-10-18）

用户否定了只保留 Canvas 光场的简化加载页，最终版本直接适配原项目完整 DOM、
CSS 和时间线：黑幕标识 → 扫光洗白 → 档案布局 → 逐字解码/标识描边 → 环形扫描
→ 欢迎版式/RGB 故障/撕裂/光晕 → 镜头后撤揭幕。替换为 ShineAI 名称与自有星芒，
不包含原鲸鱼标识、原品牌、原欢迎录音或商业歌曲文件。

- `vendor/startup-cinematic.mjs` 为有明确 mount/dispose 的适配模块。全部计时器、
  动画帧、Canvas resize/visibility 监听及 Web Animations 在退出时清理。
- 原项目的 BGM、Web Speech、音效素材获取与脚本重新注入已移除。
- 配乐由 ShineAI 独立音频通道负责：默认静音，可选平台原曲试听片段或用户导入文件。
  联网试听失败继续动画，播放受浏览器手势策略限制时显示“开启音乐”按钮。
- CSS 全部限定在 `#shine-startup` 内；壁纸透明度适配排除该区域。
- 设置中的预览在动画期间将工作台置为 inert，结束/跳过后恢复原状态及焦点；不改写既有 overflow。
- Esc 与跳过按钮从开场首帧可用；可选每日一次；独立聊天/浮窗不展示开场。
- 系统“减少动态效果”下显示静态欢迎画面；30 秒兜底释放工作台。
- 档案数据仅显示实际版本、桌面类型、运行平台、沙箱及选中的音乐模式。
  五段中文为演出文案；不宣称正在验证身份、授予权限或已成功连接模型。

复验命令：`node scripts/startup-screen-smoke.mjs`。
增加 `--real-preview` 可实际验证 Apple 的 In Cyberpunk 30 秒片段解码与播放（测试静音）。
普通测试使用本地 WAV 和网络失败场景，不依赖 Apple 服务可用性。

集成测试记录位于 `artifacts/startup-screen/report.json`；四个分幕截图为
`cinematic-01-black-logo.png`、`cinematic-02-dossier.png`、`cinematic-03-radar.png`、
`cinematic-04-glitch.png`。桌面安装更新与用户数据保留记录单独保存。


最终验证：`npm run check` 完成，90 项测试及构建、完整性、桌面、云端隔离、Codex、本地运行、
Monaco 回归全部通过。`smoke:startup -- --real-preview` 对同一构建完成 13 项实际 Electron 检查，
包括四段演出、自动揭幕、主题、壁纸隔离、音频导入、30 秒原曲试听、网络失败、重复清理及持久化。
记录：`artifacts/startup-screen/real-preview-report.json`。

已备份并更新 `E:/AI/ShineAI`，安装文件哈希与构建清单一致，已重启。
6 条历史会话均可通过真实应用 API 读取，30 个技能的内容/状态和壁纸配置校验一致。
其中一个原有 Codex 运行实例在退出过程中变成 interrupted，未自动重新连接；
其历史消息仍在（数据库 873 条，分页 API 的当前读取上限 500 条）。没有为测试而提交恢复消息。
详见 `artifacts/startup-screen/live-restart-report.json`。

## 替换最早的原生加载窗口（2026-10-19）

原先恢复的主进程先创建一个 420×180 的独立加载窗口，主界面随后才播放动画，
因此旧品牌仍会先出现。本次直接替换该窗口的创建位置，并将工作台显示动作
交给 `extensions/startup-window.cjs` 协调：动画与主界面同时加载，主界面隐藏，
动画结束或跳过且主界面就绪后再交接。最大化也延迟到交接，避免提前显示工作台。

- `renderer/startup.html` 加载同一完整演出；没有旧的 data URL 加载页。
- 独立 `preload/startup.cjs` 仅提供启动配置读取和自身开始/结束操作；
  保持 sandbox、contextIsolation，并限制生命周期 IPC 的发送窗口。
- 关闭动画或当天已经播放时，独立窗口保持隐藏，不闪出额外加载页。
- 主界面不再自动播放动画；重载不会重复播放；设置中的预览仍然可用。
- 窗口渲染失败、失去响应或 35 秒兜底会释放交接，避免动画阻塞软件。
- 本版本 Playwright 的异步 `waitForFunction` 谓词会提前满足，测试改为显式
  逐次 await IPC 快照，再检查原生窗口可见状态，不以主界面 DOM 存在替代交接成功。

实际 Electron 启动专项完成 14 项检查，含完整冷启动、最早窗口的 URL/名称/沙箱、
交接前工作台隐藏、交接后工作台可见、Esc、无二次播放、重载、每日一次、禁用持久化，
以及原有主题、壁纸隔离和本地音乐功能。记录在 `artifacts/startup-screen/report.json`。
本次专项不含 Apple 联网试听复测；实际试听记录保留在此前的 `real-preview-report.json`。

最终 `npm run check` 通过（96 项测试及全部构建、验证、桌面、云端隔离、Codex、
本地运行和编辑器检查），与上述启动专项使用相同构建：
`721c26f822f52b059f8eb11e368b3699b685e75383d9a0142e93c047918bd033`。
已备份并更新安装版 8 个文件，完成重启；安装输出逐文件哈希与构建一致。
5 个现有运行实例保留，6 条历史记录仍可读取，30 个技能内容/状态、壁纸和数据目录一致。
安装版调试连接建立时动画已结束，因此最早窗口的直接可见性证据来自隔离冷启动专项；
安装版核对了相同构建、动画已退出、工作台未重复播放和持久化数据。
记录：`artifacts/startup-screen/native-live-restart-report.json`；
备份：`artifacts/installed-update-1792341261553`。本次没有创建安装包或推送远程仓库。
