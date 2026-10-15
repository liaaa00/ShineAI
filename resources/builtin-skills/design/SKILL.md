---
name: design
description: "前端设计总入口：写/改/审页面、组件、界面、样式、配色、字体、布局、动效、响应式、可访问性时先用它。Frontend design router for building, refining, reviewing or polishing any UI (page, component, landing page, dashboard, settings, form, mobile UI). Routes to ui-ux-pro-max (style/palette/font/product-type database) and impeccable (craft floor, 24 refine commands, deterministic anti-AI-slop detector)."
category: development
tags: design, ui, ux, frontend, 前端, 界面, 页面, 组件, 样式, 美化, 好看, 配色, 字体, 排版, 布局, 动效, 动画, 响应式, 落地页, 官网, 首页, 仪表盘, 表单, 弹窗, 按钮, 审美, 视觉, 交互, 网页
version: 1.0.0
---

# design · 前端设计总入口

本技能只做分流，不重复写设计规则。根目录见上方 `[SKILL RESOURCES]` 的「根目录」，下文记作 `<根>`。

## 1. 先判断：这一轮要不要碰 UI 代码

- 只要方案、分析、评估，不产出页面或组件 → **不要**加载下面的子技能，直接回答。
- 要写、改、审界面 → 按第 2 节分流。**只读命中的那一份**，不要把子技能全读一遍。

## 2. 分流

| 场景 | 读什么 |
|---|---|
| 新页面或新产品：要选风格、配色、字体组合、产品类型的设计方向 | `<根>/../ui-ux-pro-max/SKILL.md`，按它的说明用 `scripts/search.py` 查库（读不到时改用 `invoke_skill('ui-ux-pro-max')`） |
| 动手写或改任何 UI 代码（新页面、局部调整都算） | `<根>/impeccable/SKILL.md`，按它的 Setup 走；**写代码前必读** `<根>/impeccable/reference/craft-floor.md` |
| 审查、打磨、去 AI 味、加动效、改配色、改排版、适配移动端等（polish / audit / critique / bolder / quieter / animate / colorize / typeset / layout / adapt / harden / clarify …） | `<根>/impeccable/SKILL.md` 的 Commands 表，找到对应的 `reference/<命令>.md` 再执行 |

新页面的典型顺序：ui-ux-pro-max 定方向 → impeccable craft-floor 约束下写代码 → impeccable 检测收尾。

## 3. Impeccable 启动器路径

Impeccable 文档里写的 `.claude/skills/impeccable/scripts/impeccable` 一律换成：

- Windows：`<根>/impeccable/scripts/impeccable.cmd`
- macOS / Linux：`sh <根>/impeccable/scripts/impeccable`

当前工作目录保持在用户项目里。第一次运行会把引擎下载到 `~/.impeccable/bin/`。下载失败或启动器报错时，按 impeccable 自己的「Launcher unavailable」条款降级，不要因此卡住任务。

写完 UI 后跑一次确定性检测（不调模型，不需要 Key）：

```
<启动器> detect --json <改动的文件或目录>
```

修掉报出的问题，最多再复检一轮，然后停止。

原型模式（代码只在对话里渲染、不落文件）不跑 detect，靠写代码前的 craft-floor 约束把关；用户要求把原型落成文件时再跑。

## 4. 规则冲突时的优先级

1. 用户这轮的明确要求
2. 项目已有的设计体系（DESIGN.md、tokens、现有组件库）
3. impeccable craft-floor 的禁止项
4. ui-ux-pro-max 的风格推荐

例如：ui-ux-pro-max 推荐渐变或玻璃拟态，但 craft-floor 禁止 → 以 craft-floor 为准，除非用户点名要这种风格。

## 5. 不要做

- 不要运行 `npx impeccable install` 或 `/impeccable hooks on`，也不要往用户项目里写 hook 或 provider 配置；本技能已经内置。
- 用户没要求时，不要生成 PRODUCT.md 或 DESIGN.md；缺上下文时直接读现有代码。
