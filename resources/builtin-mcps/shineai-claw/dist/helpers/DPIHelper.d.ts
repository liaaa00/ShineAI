/**
 * macOS coordinate scaling helper aligned with Anthropic computer-use-demo.
 *
 * NOTE: This replaces the previous Windows DPI helper implementation.
 */
export declare const SCALING_TARGETS: readonly [{
    readonly name: "XGA";
    readonly width: 1024;
    readonly height: 768;
}, {
    readonly name: "WXGA";
    readonly width: 1280;
    readonly height: 800;
}, {
    readonly name: "FWXGA";
    readonly width: 1366;
    readonly height: 768;
}];
export type ScalingSource = 'api' | 'computer';
export type ScalingTarget = (typeof SCALING_TARGETS)[number];
export interface ScalingResult {
    x: number;
    y: number;
    scale: number;
    target: ScalingTarget | null;
}
/**
 * 计算给 AI 用的截图目标尺寸。
 * 返回 null 表示不需要缩放（屏幕与训练分辨率比例不匹配，或小于最小 target）。
 */
export declare function selectScalingTarget(screenWidth: number, screenHeight: number): ScalingTarget | null;
/**
 * 在 "AI 看到的坐标"（target dim）和 "真实屏幕坐标"（screen dim）之间转换。
 * source='api'：输入坐标来自 AI，放大到真实分辨率（用于实际 click）。
 * source='computer'：输入坐标来自真实屏幕，缩小到 AI 分辨率（用于截图标注）。
 */
export declare function scaleCoordinates(source: ScalingSource, x: number, y: number, screenWidth: number, screenHeight: number): ScalingResult;
