> 历史开发记录：下文记录此前版本的检查，产品称呼已统一为 ShineAI；历史安装包、哈希、路径与测试结果不代表本轮改名后重新生成或验收。当前状态见 `SHINEAI-DELIVERY-2026-10-15.md`。

# 外观与动态背景调研

调研日期：2026-10-14。联网读取 GitHub 项目说明和关键源码，并使用隔离数据目录打开本工程的外观设置检查实际界面。调研阶段没有安装第三方美化工具；后续已内置实现背景与玻璃效果，使用和验证见 [外观说明](APPEARANCE.md)。

用户描述的“deepseek hemers”可能是 DeepSeek Harness；缺少准确项目链接，目前无法确定其看到的具体实现。

## 参考项目

| 项目 | 实际查到的能力 | 适合借鉴的部分 |
| --- | --- | --- |
| [beautiCode](https://github.com/starsstreaming/beautiCode) | DeepSeek Harness 等客户端接入；本地图片/视频导入、命名主题、压暗、模糊、视频播放状态管理；独立阅读表面保护 | 完整背景管理、工作时压暗、视频加载与切换失败恢复 |
| [dsh-glass-skin](https://github.com/Lenandy/dsh-glass-skin) | 本地/网络图片、透明玻璃画布与侧栏、明暗独立设置、浓度/模糊/遮罩、三个预设 | 面板与文字层分离、实时预览、预设与一键恢复 |
| [dsh-desktop-background](https://github.com/diancangdu/dsh-desktop-background) | 桌面背景图片，包括 GIF 的 MIME 支持；遮罩、面板、输入框等分区设置 | 分层透明度、稳定的区域锚点，避免背景被多层底色遮住 |
| [opencode-deepseek-chan](https://github.com/daemon1s/opencode-deepseek-chan) | OpenCode Desktop 静态图片/MP4/WebM 背景、静音循环视频、玻璃面板、预设 | 动态背景渲染与暗色玻璃配色的参考 |
| [dsh-desktop](https://github.com/QWQ123321123/dsh-desktop) | Tauri 桌面壳，本地选择背景、清除及实时透明度 | 桌面文件选择、数据目录保存、简洁操作入口 |

阅读的是公开说明和源码，没有运行这些第三方项目。它们的桌面兼容性和效果属于作者说明，不能视为在本机验证成功。

关键源码定位：

- [beautiCode 的 DSH 背景实现](https://github.com/starsstreaming/beautiCode/blob/35730da179021eaaa1f6f9f3094bb5fefb536cce/integrations/deepseek-harness/client.js)：独立媒体层、图片与视频切换、遮罩和模糊、静音播放以及加载失败处理。
- [beautiCode 的阅读表面保护](https://github.com/starsstreaming/beautiCode/blob/35730da179021eaaa1f6f9f3094bb5fefb536cce/integrations/deepseek-harness/readability.js)：对话框、菜单、输入等采用独立底色，而非让全页一律透明。
- [beautiCode 的背景 CSS](https://github.com/starsstreaming/beautiCode/blob/35730da179021eaaa1f6f9f3094bb5fefb536cce/packages/adapter-codex/src/renderer/background.css)：背景模糊默认不启用，源码说明逐帧全窗口模糊会增加合成成本。
- [dsh-glass-skin 客户端实现](https://github.com/Lenandy/dsh-glass-skin/blob/5cfe40e513fe53936185fbec793f0f9e8621252a/lib/client.js)：明暗分别保存、实时 CSS 变量、叠加透明度诊断；本地图片转 data URL 并存 localStorage，因此限 2 MB。
- [dsh-desktop-background 实现](https://github.com/diancangdu/dsh-desktop-background/blob/ad106c3b785686d4a39cb19d19d6a36ea1bf708c/index.js)：图片/遮罩/表面分层；侧栏和输入区域具有不同配方。
- [OpenCode 动态背景实现](https://github.com/daemon1s/opencode-deepseek-chan/blob/b59ba94581ffb2d48b4e180194c119c9661cab99/src/engine.js)：视频使用 `autoplay loop muted playsinline`，背景层不拦截点击。

## 本工程现状

已实际打开外观页：目前提供 12 种主题、文件图标、字号和布局相关设置；没有本地背景导入、面板透明度或动态壁纸配置。
外观页大部分篇幅是配色卡片，预览只展示色块，无法判断一整页聊天、侧栏、菜单和代码组合起来的效果。

源码中有两套相关样式入口：`--color-*` 和别名 `--v2-*`，还有局部内联背景。仅在 body 铺图不会让这些不透明表面自动透出背景。
编辑器会将 `--color-bg-secondary` 等读取为颜色，再拼接 `80` 作为 alpha；不能将这些共享变量直接统一替换为 rgba，否则可能破坏 Monaco 的颜色参数。终端同样有独立主题，默认不允许透明。

本地截图与检查结果保存在 `artifacts/appearance-research/current-appearance.png`、`current-workspace.png` 和 `local-inspection.json`。测试未读取用户日常配置和密钥，完成后恢复了开发版 URL 注册入口。

## 推荐的产品方案

外观页上半部分改为背景与整体效果，主题配色作为其下方的独立选项。提供一张包含侧栏、聊天、输入框、代码片段和菜单的组合预览。

| 控件 | 含义 |
| --- | --- |
| 导入背景 | JPG/PNG/WebP 等静态图片；GIF/动态 WebP；MP4/WebM 循环视频，具体编码以 Electron 实际解码结果为准 |
| 背景显示强度 | 调整背景层显著程度，不改变文字和图标透明度 |
| 背景遮罩 | 暗色压黑，浅色提白，改善背景与文字的对比 |
| 面板透明度 | 控制侧栏和工作区的材质；内部统一存“不透明度”，UI 可按透明度显示，避免方向混淆 |
| 模糊 | 可关闭，提供适量范围；动态背景默认关闭或很低，避免全窗口高强度逐帧模糊 |
| 图片位置与缩放 | 铺满、完整显示、焦点位置，允许把人物或建筑移到文字之外 |
| 预设 | 清晰壁纸、柔和玻璃、专注阅读；是一组配方，切换后仍能微调 |
| 动态播放 | 默认静音循环；可暂停，最小化/隐藏时暂停视频，恢复后继续；提供静态替代画面 |
| 恢复默认 | 关闭背景和玻璃效果，恢复原主题；清除背景与删除保存主题分开 |

侧栏与主区透出背景，输入框保持较高不透明度，菜单、对话框、代码和终端优先保持清晰。用户可逐步提高通透程度，但不将整个 root 的 opacity 降低，因为那会同时淡化文字。
暗色和浅色分别保存遮罩/透明配方。同一组 alpha 在白底和黑底上的观感不同，不能只切文字颜色。

第一阶段建议直接内置背景管理和预设，支持本地图片、GIF 和静音视频；第二阶段再考虑多个命名主题、自动切换和更丰富的动态效果。无需先引入在线皮肤市场或启动额外的注入工具。

## 工程落地要点

1. 新增可读的外观模块，通过现有安全 preload/IPC 接口打开文件选择器；只接受用户选择并验证过的媒体。
2. 媒体复制到开发版用户数据目录的 `appearance/media`，设置仅存媒体 ID 和参数。不要把大图/视频塞进 localStorage，也不要只引用会被移动或删除的原文件。
3. 使用受控应用媒体协议按 ID 返回文件；视频支持 Range。保留现有沙箱、隔离和来源校验，不开放调试端口，不套用其他项目修改安装包的脚本。
4. 独立的图片/视频层铺在应用底层，不响应鼠标。遮罩独立；外层表面使用专门的材质变量，保留编辑器和终端的基础颜色值。
5. 对侧栏、主面板、输入、弹层设稳定属性作为样式锚点；避免泛化修改所有 div 或依赖带哈希的类名。不要让隐藏的布局容器产生新底色并挡住聊天。
6. 滑块实时预览，保存做防抖；媒体先加载验证再切换，失败保留原背景。恢复默认、重启保存和导入错误均有明确结果。
7. 视频按可见性暂停、释放旧元素/资源；GIF 的暂停与静态替代需额外实现，不能把 video.pause 当作 GIF 也能暂停。用户选择减少动态效果时采用静态背景。

验收需覆盖图片/GIF/视频、亮暗主题、拖动滑块、菜单与输入对比度、代码/终端、窗口大小变化、隐藏恢复、资源损坏与重启保存；视觉效果需要真实窗口截图比较，不能只依据 CSS 是否写入。

这些项目的代码与内置壁纸可能采用不同许可。后续若直接复用代码，应逐项检查对应许可证和署名要求。当前建议自实现背景模块，用户导入自己的媒体。
