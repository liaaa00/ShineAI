// T2 产出：MCP 工具层协议契约（面向 AI 的 schema，独立于 IPC 协议）
import { z } from 'zod';
const boundsSchema = z
    .object({
    x: z.number().describe('左上角 x 坐标，单位为 AppKit 逻辑 point'),
    y: z.number().describe('左上角 y 坐标，单位为 AppKit 逻辑 point'),
    width: z.number().positive().describe('宽度，单位为 AppKit 逻辑 point'),
    height: z.number().positive().describe('高度，单位为 AppKit 逻辑 point'),
})
    .describe('矩形区域（AppKit 逻辑 point）');
const pointSchema = z
    .object({
    x: z.number().describe('x 坐标，单位为 AppKit 逻辑 point'),
    y: z.number().describe('y 坐标，单位为 AppKit 逻辑 point'),
})
    .describe('屏幕点位（AppKit 逻辑 point）');
const describeScreenTargetSchema = z
    .object({
    window_id: z.number().int().positive().optional().describe('目标窗口 ID'),
    app_bundle_id: z.string().trim().min(1).optional().describe('目标应用 bundle_id'),
    app_name: z.string().trim().min(1).optional().describe('目标应用名称'),
})
    .superRefine((value, ctx) => {
    const selected = [value.window_id != null, value.app_bundle_id != null, value.app_name != null].filter(Boolean).length;
    if (selected === 0) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'target 提供时必须至少指定 window_id / app_bundle_id / app_name 之一',
        });
        return;
    }
    if (selected > 1) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'target 仅允许指定一种定位方式，避免歧义',
        });
    }
})
    .describe('目标窗口或应用定位信息（仅可三选一）');
const describeScreenCaptureAreaSchema = z
    .object({
    x: z.number().describe('区域左上角 x，单位为 AppKit 逻辑 point'),
    y: z.number().describe('区域左上角 y，单位为 AppKit 逻辑 point'),
    width: z.number().positive().describe('区域宽度，单位为 AppKit 逻辑 point'),
    height: z.number().positive().describe('区域高度，单位为 AppKit 逻辑 point'),
})
    .describe('屏幕裁剪区域（AppKit 逻辑 point）');
/**
 * describe_screen：截图 + AX 扫描 + 生成 SoM 标注图。
 * 返回 snapshot_id（后续操作引用）、raw/annotated 图路径和可交互元素列表。
 * 这是 AI 进行桌面自动化的第一步，建议优先调用。
 */
const describeScreenInputSchema = z
    .object({
    target: describeScreenTargetSchema.optional().describe('可选目标（窗口或应用）'),
    display_index: z.number().int().min(0).optional().describe('多屏序号（默认 0）'),
    capture_area: describeScreenCaptureAreaSchema.optional().describe('可选截图区域'),
    annotated: z.boolean().optional().describe('是否生成带编号标注图（默认 true）'),
    allow_web_focus: z.boolean().optional().describe('是否尝试唤醒 AXWebArea（默认 true）'),
    mode: z.enum(["auto", "ax_only", "ax_plus_vision", "ax_plus_cdp", "cdp_only", "vision_only"]).describe('识别模式，默认 auto（令 daemon 自动选择）。选择决策看 describe_screen 根描述。三路速度对比：ax=80ms, cdp=30ms, vision=+800ms。Vision 第一次调用额外冷启 500ms，后续快。').optional(),
})
    .superRefine((value, ctx) => {
    if (value.target?.window_id != null && value.display_index != null) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: '指定 window_id 时不应再指定 display_index',
            path: ['display_index'],
        });
    }
    if (value.capture_area && value.capture_area.width * value.capture_area.height <= 0) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'capture_area 的宽高必须大于 0',
            path: ['capture_area'],
        });
    }
})
    .describe('★ STEP 1 （桌面自动化第一步必调）：抓取屏幕，生成编号的可操作元素列表和 snapshot_id。后续 click/type_text 用返回的 element.id 定位。\n\n标准工作流：\n1. activate_app 切到目标应用（如需）→ 等 300ms\n2. describe_screen({mode}) → 读返回的 annotated 图和 ui_elements\n3. 选中目标 element.id → click/type_text({snapshot_id, element_id})\n4. 如果界面有变化 → 重新 describe_screen\n\nmode 选择决策（按目标应用选）：\n- 原生 AppKit 应用（Finder / 设置 / Safari chrome / 记事 / 邮件）→ 用 ax_only。极快（~80ms），识别率 90%+。\n- Tauri/Electron 应用（ShineAI / VSCode / Slack / Discord / Figma / Notion）→ 用 ax_only。Tauri 的 AXWebArea 能被唤醒，往往能拿到所有按钮（实测 128 元素→去重 64 个精准）。\n- Chrome/Edge/Brave 网页内容 → 优先 ax_plus_vision。Chrome 主线禁用了 AX 唤醒，单 AX 只能拿地址栏和菜单（约 48 个），需要 Vision OCR 补页面内按钮和文本（ax_plus_vision 可达 140 个，含「立即下载」等 CTA，加 ~800ms）。\n- 如果用户确认打开了 `open -a "Google Chrome" --args --remote-debugging-port=9222`，改用 ax_plus_cdp，30ms 拿完整 DOM。\n- 各种模式都几乎抓不到内容（特殊 Java/游戏应用）→ vision_only 兜底。\n- 不确定应用类型 → 不传 mode（auto），daemon 会自动判断。\n\n注意：snapshot_id 有 3-5 分钟有效期，LRU 25 个。过期或窗口移动后需要重新 describe_screen。');
const describeScreenOutputSchema = z
    .object({
    snapshot_id: z.string().min(1).describe('快照 ID，后续工具可复用'),
    screenshot_raw_path: z.string().min(1).describe('原始截图路径'),
    screenshot_annotated_path: z.string().min(1).optional().describe('标注截图路径'),
    screen_dimensions: z
        .object({
        width: z.number().positive().describe('屏幕宽度（逻辑 point）'),
        height: z.number().positive().describe('屏幕高度（逻辑 point）'),
    })
        .describe('屏幕尺寸（AppKit 逻辑 point）'),
    application: z
        .object({
        name: z.string().min(1).describe('应用名称'),
        bundle_id: z.string().min(1).describe('应用 bundle_id'),
        pid: z.number().int().positive().describe('应用进程 ID'),
    })
        .optional()
        .describe('识别出的应用信息'),
    window: z
        .object({
        title: z.string().describe('窗口标题'),
        window_id: z.number().int().positive().describe('窗口 ID'),
        bounds: boundsSchema.describe('窗口边界（AppKit 逻辑 point）'),
    })
        .optional()
        .describe('识别出的窗口信息'),
    is_dialog: z.boolean().describe('当前窗口是否是对话框'),
    element_count: z.number().int().min(0).describe('元素总数'),
    interactable_count: z.number().int().min(0).describe('可交互元素数'),
    ui_elements: z
        .array(z
        .object({
        id: z.string().min(1).describe('元素 ID（在 snapshot_id 内唯一）'),
        role: z.string().min(1).describe('AX 角色'),
        subrole: z.string().optional().describe('AX 子角色'),
        label: z.string().describe('元素可读标签'),
        title: z.string().optional().describe('元素标题'),
        value: z.string().optional().describe('元素当前值'),
        description: z.string().optional().describe('元素描述'),
        identifier: z.string().optional().describe('AX identifier'),
        keyboard_shortcut: z.string().optional().describe('快捷键提示'),
        is_actionable: z.boolean().describe('是否可执行点击/激活动作'),
        source: z.enum(["ax", "vis", "cdp"]).optional().describe('元素来源：ax=AX无障碍, vis=Vision OCR, cdp=Chrome DevTools Protocol'),
        bounds: boundsSchema.describe('元素边界（AppKit 逻辑 point）'),
    })
        .describe('单个 UI 元素信息'))
        .describe('编号 UI 元素列表'),
    menu_bar: z
        .object({
        items: z
            .array(z
            .object({
            id: z.string().min(1).describe('菜单项 ID'),
            title: z.string().describe('菜单标题'),
            shortcut: z.string().optional().describe('菜单快捷键'),
            enabled: z.boolean().describe('菜单项是否可用'),
        })
            .describe('单个菜单项'))
            .describe('菜单项列表'),
    })
        .optional()
        .describe('菜单栏信息（可选）'),
    warnings: z.array(z.string()).describe('采集过程中的告警信息'),
})
    .describe('describe_screen 的返回结构');
const clickQuerySchema = z
    .object({
    role: z.string().trim().min(1).optional().describe('按角色模糊匹配'),
    label: z.string().trim().min(1).optional().describe('按标签模糊匹配'),
    identifier: z.string().trim().min(1).optional().describe('按 identifier 模糊匹配'),
})
    .superRefine((value, ctx) => {
    if (!value.role && !value.label && !value.identifier) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'query 至少需要 role / label / identifier 之一',
        });
    }
})
    .describe('在快照中定位元素的模糊查询条件');
/**
 * click：点击一个 UI 元素。
 * 优先使用 snapshot_id + element_id（来自 describe_screen），仅在必要时使用坐标兜底。
 */
const clickInputSchema = z
    .object({
    snapshot_id: z.string().trim().min(1).optional().describe('快照 ID，来自 describe_screen'),
    element_id: z.string().trim().min(1).optional().describe('目标元素 ID，来自 describe_screen.ui_elements[].id'),
    query: clickQuerySchema.optional().describe('在快照内按字段模糊搜索元素'),
    x: z.number().optional().describe('坐标点击 x（仅坐标模式）'),
    y: z.number().optional().describe('坐标点击 y（仅坐标模式）'),
    button: z.enum(['left', 'right', 'middle']).optional().describe('鼠标按键类型（默认 left）'),
    click_type: z.enum(['single', 'double']).optional().describe('点击类型（默认 single）'),
    modifiers: z
        .array(z.enum(['cmd', 'shift', 'option', 'control']))
        .optional()
        .describe('组合修饰键（默认空）'),
})
    .superRefine((value, ctx) => {
    const hasElementId = value.element_id != null;
    const hasQuery = value.query != null;
    const hasCoordPair = value.x != null && value.y != null;
    if ((value.x == null) !== (value.y == null)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: '坐标模式需要同时提供 x 和 y',
            path: value.x == null ? ['x'] : ['y'],
        });
    }
    if (!hasElementId && !hasQuery && !hasCoordPair) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: '必须提供 element_id、query 或 (x,y) 其中一组',
        });
    }
    if (hasCoordPair && value.snapshot_id) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: '坐标模式下不应提供 snapshot_id',
            path: ['snapshot_id'],
        });
    }
    if ((hasElementId || hasQuery) && !value.snapshot_id) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'element_id 或 query 模式必须提供 snapshot_id',
            path: ['snapshot_id'],
        });
    }
})
    .describe('★ STEP 2：点击元素。优先顺序：element_id > query > (x, y)。\n\n- 最稳：element_id 来自最近一次 describe_screen 返回的 ui_elements[].id（is_actionable=true 优先）。\n- 次优：query 在 snapshot 内按 role/label/identifier 模糊匹配。\n- 底牌：仅在前两种都找不到时用坐标（需手工读截图网格）。\n\n多个同名元素时的选择启发式：\n- is_actionable=true 优先于无行为的显示元素\n- source="ax" 优先（最稳）、source="cdp" 次之、source="vis" 最后（OCR 识别位置可能有偏差）\n- bounds 面积中等优先（过小可能是容器错报，过大可能是整个容器）\n- role 匹配预期（想点按钮选 AXButton，不选 AXImage）\n\n失败回退：\n- 返 eSnapshotStale → 重新 describe_screen 拿新 snapshot_id\n- 返 eNotFound → 界面变化了，重新 describe_screen\n- 点了没反应 → describe_screen 验证状态；考虑调整 mode 如果是 web 页面→ax_plus_vision\n\n不要连点两次同一按钮（toggle 会反转）。click_type=double 才是双击。');
const clickOutputSchema = z
    .object({
    clicked_at: pointSchema.describe('实际点击坐标（AppKit 逻辑 point）'),
    method: z.enum(['axPress', 'hidClick']).optional().describe('实际执行方式：axPress=原生 AXPress；hidClick=坐标 CGEvent 回退'),
    target_element: z
        .object({
        id: z.string().min(1).describe('目标元素 ID'),
        role: z.string().min(1).describe('目标元素角色'),
        label: z.string().describe('目标元素标签'),
    })
        .optional()
        .describe('已命中的元素摘要'),
    verification_screenshot_path: z.string().optional().describe('点击后中心 300x300 验证截图路径'),
})
    .describe('click 的返回结构');
/**
 * type_text：输入文本，支持 Unicode/中文（绕开 IME）。
 * 可先基于 snapshot_id + element_id 聚焦目标输入框。
 */
const typeTextInputSchema = z
    .object({
    text: z.string().describe('要输入的文本内容（支持 Unicode）'),
    snapshot_id: z.string().trim().min(1).optional().describe('快照 ID（用于预聚焦）'),
    element_id: z.string().trim().min(1).optional().describe('目标元素 ID（用于预聚焦）'),
    clear_existing: z.boolean().optional().describe('输入前是否清空现有内容（默认 false）'),
    delay_ms_per_char: z.number().int().min(0).optional().describe('逐字符延迟毫秒（默认 0）'),
})
    .superRefine((value, ctx) => {
    const hasSnapshot = value.snapshot_id != null;
    const hasElement = value.element_id != null;
    if (hasSnapshot !== hasElement) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'snapshot_id 和 element_id 必须同时提供或同时省略',
        });
    }
    if (value.text.length === 0) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'text 不能为空字符串',
            path: ['text'],
        });
    }
})
    .describe('★ 输入文本。支持 Unicode（中英日/emoji），绕开 IME 直接注入。\n\n工作流：\n1. 通常先 click 一个 AXTextField / AXTextArea 获得焦点\n2. 传 snapshot_id + element_id 会自动 focus + 清空（如 clear_existing=true）+ 输入\n3. 未传 element_id 时直接向当前焦点输入\n\ndelay_ms_per_char 默认 0（最快）；某些 web 表单有抖动限流时可设 5-20。\n长文本（>500 字）建议分段，中间调用一次 hotkey({keys: [\'cmd\',\'s\']}) 等避免内容丢失。');
const typeTextOutputSchema = z
    .object({
    typed_chars: z.number().int().min(0).describe('实际输入字符数'),
    method: z.enum(['axSetValue', 'hidType']).optional().describe('实际执行方式：axSetValue=原生 AX 设置值；hidType=CGEvent 键盘回退'),
    focused_element: z
        .object({
        id: z.string().min(1).describe('聚焦元素 ID'),
        role: z.string().min(1).describe('聚焦元素角色'),
        label: z.string().describe('聚焦元素标签'),
    })
        .optional()
        .describe('被聚焦的目标元素'),
})
    .describe('type_text 的返回结构');
/**
 * hotkey：按下组合键（如 ['cmd','c']、['cmd','shift','s']、['cmd','tab']）。
 */
const hotkeyInputSchema = z
    .object({
    keys: z.array(z.string().trim().min(1)).min(1).describe('按键序列，至少 1 个键'),
    hold_ms: z.number().int().min(0).optional().describe('按住时长毫秒（默认 50）'),
})
    .superRefine((value, ctx) => {
    const normalized = value.keys.map(key => key.toLowerCase());
    if (new Set(normalized).size !== normalized.length) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'keys 不应包含重复键',
            path: ['keys'],
        });
    }
})
    .describe('按组合键（macOS 风格）。例：[\'cmd\',\'c\'] 复制 / [\'cmd\',\'shift\',\'s\'] 另存为 / [\'cmd\',\'tab\'] 切应用。\n\n键名：cmd/shift/option/control 修饰键 + 字母数字 / Enter/Tab/Escape/Space/Delete/Backspace/ArrowUp/ArrowDown/ArrowLeft/ArrowRight/F1-F12。无需先 focus（系统级事件）。\n\n不要用来快速打字——用 type_text。hotkey 专注快捷键/导航。');
const hotkeyOutputSchema = z
    .object({
    ok: z.literal(true).describe('执行成功标记'),
})
    .describe('hotkey 的返回结构');
/**
 * scroll：滚轮滚动。可选先移动到指定坐标后滚动。
 */
const scrollInputSchema = z
    .object({
    direction: z.enum(['up', 'down', 'left', 'right']).describe('滚动方向'),
    amount: z.number().positive().describe('滚动刻度（正数）'),
    x: z.number().optional().describe('可选预移动 x 坐标'),
    y: z.number().optional().describe('可选预移动 y 坐标'),
})
    .superRefine((value, ctx) => {
    if ((value.x == null) !== (value.y == null)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: '提供滚动坐标时必须同时包含 x 和 y',
        });
    }
})
    .describe('滚轮滚动。direction & amount（1≈10 帧等效）。传 x/y 先 move mouse 再滚。\n滞后加载场景需 scroll + describe_screen 重抓。长列表建议每滚一次再 describe，避免元素已滑出 viewport 后再 click。');
const scrollOutputSchema = z
    .object({
    ok: z.literal(true).describe('执行成功标记'),
})
    .describe('scroll 的返回结构');
/**
 * list_apps：列出当前运行中的应用（名称 / bundle_id / pid / 是否前台）。
 */
const listAppsInputSchema = z
    .object({})
    .strict()
    .superRefine((value, ctx) => {
    if (Object.keys(value).length !== 0) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'list_apps 不接收任何参数',
        });
    }
})
    .describe('列出当前运行的应用。主要用途：确认目标应用的 bundle_id 或 name 以便 activate_app 切过去。is_active=true 的是当前 frontmost（不传 target 时 describe_screen 默认对它）。无入参。');
const listAppsOutputSchema = z
    .object({
    applications: z
        .array(z
        .object({
        pid: z.number().int().positive().describe('进程 ID'),
        bundle_id: z.string().min(1).describe('应用 bundle_id'),
        name: z.string().min(1).describe('应用名称'),
        is_active: z.boolean().describe('是否为当前前台应用'),
    })
        .describe('运行中的应用'))
        .describe('应用列表'),
})
    .describe('list_apps 的返回结构');
/**
 * activate_app：激活并置前一个应用。支持 bundle_id 或 name 二选一。
 */
const activateAppInputSchema = z
    .object({
    bundle_id: z.string().trim().min(1).optional().describe('要激活的应用 bundle_id'),
    name: z.string().trim().min(1).optional().describe('要激活的应用名称'),
})
    .superRefine((value, ctx) => {
    if (!value.bundle_id && !value.name) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: '必须至少提供 bundle_id 或 name 其中之一',
        });
    }
})
    .describe('把应用切到前台（frontmost）。优先用 bundle_id（最稳）、次选 name。切换后建议 sleep 200-300ms 再 describe_screen，避免窗口还在动画中导致 AX 抓不稳。');
const activateAppOutputSchema = z
    .object({
    ok: z.literal(true).describe('执行成功标记'),
    pid: z.number().int().positive().optional().describe('被激活应用的进程 ID'),
})
    .describe('activate_app 的返回结构');
export const TOOL_NAMES = ['describe_screen', 'click', 'type_text', 'hotkey', 'scroll', 'list_apps', 'activate_app'];
export const toolSchemas = {
    describe_screen: {
        input: describeScreenInputSchema,
        output: describeScreenOutputSchema,
        description: '★ STEP 1 必调：截图 + AX/Vision/CDP 扫描 + SoM 标注。返回 snapshot_id（后续工具引用）、annotated 截图和 ui_elements 列表。是桌面自动化入口，每次界面变化后重调。mode 选 ax_only 对原生/Tauri 应用，ax_plus_vision 对 Chrome 网页（单 AX 仅 48 个元素，vision 补至 140 个含 CTA），ax_plus_cdp 对开了远程调试的 Chrome（30ms 完整 DOM）。',
    },
    click: {
        input: clickInputSchema,
        output: clickOutputSchema,
        description: '★ STEP 2：点击 UI 元素。snapshot_id+element_id 左键单击会优先 AXPress（不移动真实光标），失败回退 HID 坐标点击；也支持 query 模糊匹配和坐标(x,y)兜底。失败时：eSnapshotStale→重新 describe_screen；eNotFound→界面变化，重新 describe_screen。',
    },
    type_text: {
        input: typeTextInputSchema,
        output: typeTextOutputSchema,
        description: '向 UI 元素输入文本，支持 Unicode/中文。snapshot_id+element_id 指向 AXTextField/AXTextArea/AXSearchField 时优先 AXFocused+AXSetValue（不移动光标），失败回退点击聚焦+CGEvent 键盘输入。web 表单有限流时设 delay_ms_per_char=5-20。',
    },
    hotkey: {
        input: hotkeyInputSchema,
        output: hotkeyOutputSchema,
        description: '按 macOS 组合键（cmd/shift/option/control + 字母数字/Enter/Tab/Escape/Arrow/F1-F12）。无需先 focus，系统级事件。打字用 type_text，快捷键/导航用 hotkey。',
    },
    scroll: {
        input: scrollInputSchema,
        output: scrollOutputSchema,
        description: '滚轮滚动（up/down/left/right）。可选先移动到 (x,y) 再滚。懒加载场景需 scroll 后重新 describe_screen 重抓元素；长列表每滚一次再 describe 避免 click 失效。',
    },
    list_apps: {
        input: listAppsInputSchema,
        output: listAppsOutputSchema,
        description: '列出运行中应用（bundle_id/name/pid/is_active）。主要用途：在 activate_app 前确认正确的 bundle_id。is_active=true 是当前 frontmost。',
    },
    activate_app: {
        input: activateAppInputSchema,
        output: activateAppOutputSchema,
        description: '将应用置前（frontmost）。优先 bundle_id（最稳），次选 name。切换后等 200-300ms 再 describe_screen，避免动画中 AX 抓不稳。',
    },
};
function getDef(schema) {
    return schema._def;
}
function isOptionalLike(schema) {
    const typeName = getDef(schema).type;
    return typeName === 'optional' || typeName === 'default';
}
function withDescription(schema, jsonSchema) {
    if (schema.description) {
        jsonSchema.description = schema.description;
    }
    return jsonSchema;
}
function zodToJsonSchema(schema) {
    const def = getDef(schema);
    switch (def.type) {
        case 'default': {
            const inner = zodToJsonSchema(def.innerType);
            return withDescription(schema, {
                ...inner,
                default: def.defaultValue,
            });
        }
        case 'optional':
            return zodToJsonSchema(def.innerType);
        case 'nullable':
            return withDescription(schema, {
                anyOf: [zodToJsonSchema(def.innerType), { type: 'null' }],
            });
        case 'object': {
            const shape = (def.shape ?? {});
            const properties = {};
            const required = [];
            for (const [key, childSchema] of Object.entries(shape)) {
                properties[key] = zodToJsonSchema(childSchema);
                if (!isOptionalLike(childSchema)) {
                    required.push(key);
                }
            }
            const objectSchema = {
                type: 'object',
                properties,
                additionalProperties: false,
            };
            if (required.length > 0) {
                objectSchema.required = required;
            }
            return withDescription(schema, objectSchema);
        }
        case 'string':
            return withDescription(schema, { type: 'string' });
        case 'number':
            return withDescription(schema, { type: 'number' });
        case 'boolean':
            return withDescription(schema, { type: 'boolean' });
        case 'array':
            return withDescription(schema, {
                type: 'array',
                items: zodToJsonSchema(def.element),
            });
        case 'union':
            return withDescription(schema, {
                anyOf: (def.options ?? []).map(option => zodToJsonSchema(option)),
            });
        case 'enum': {
            const entries = (def.entries ?? {});
            const enumValues = Array.from(new Set(Object.values(entries)));
            const enumSchema = { enum: enumValues };
            if (enumValues.every(value => typeof value === 'string')) {
                enumSchema.type = 'string';
            }
            else if (enumValues.every(value => typeof value === 'number')) {
                enumSchema.type = 'number';
            }
            return withDescription(schema, enumSchema);
        }
        case 'literal': {
            const values = (def.values ?? []);
            const literalValue = values[0];
            const literalSchema = {
                const: literalValue,
            };
            if (typeof literalValue === 'string' ||
                typeof literalValue === 'number' ||
                typeof literalValue === 'boolean') {
                literalSchema.type = typeof literalValue;
            }
            return withDescription(schema, literalSchema);
        }
        default:
            return withDescription(schema, {});
    }
}
export function jsonSchemaOf(tool) {
    return zodToJsonSchema(toolSchemas[tool].input);
}
