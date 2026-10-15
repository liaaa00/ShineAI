/**
 * macOS coordinate scaling helper aligned with Anthropic computer-use-demo.
 *
 * NOTE: This replaces the previous Windows DPI helper implementation.
 */
export const SCALING_TARGETS = [
    { name: 'XGA', width: 1024, height: 768 },
    { name: 'WXGA', width: 1280, height: 800 },
    { name: 'FWXGA', width: 1366, height: 768 },
];
const ASPECT_RATIO_TOLERANCE = 0.02;
/**
 * 计算给 AI 用的截图目标尺寸。
 * 返回 null 表示不需要缩放（屏幕与训练分辨率比例不匹配，或小于最小 target）。
 */
export function selectScalingTarget(screenWidth, screenHeight) {
    if (screenWidth <= 0 || screenHeight <= 0) {
        return null;
    }
    const screenAspectRatio = screenWidth / screenHeight;
    const matchingTargets = SCALING_TARGETS.filter((target) => {
        const targetAspectRatio = target.width / target.height;
        const aspectRatioDiff = Math.abs(targetAspectRatio - screenAspectRatio);
        return aspectRatioDiff < ASPECT_RATIO_TOLERANCE && target.width <= screenWidth;
    });
    if (matchingTargets.length === 0) {
        return null;
    }
    return matchingTargets.reduce((best, current) => {
        return current.width > best.width ? current : best;
    });
}
/**
 * 在 "AI 看到的坐标"（target dim）和 "真实屏幕坐标"（screen dim）之间转换。
 * source='api'：输入坐标来自 AI，放大到真实分辨率（用于实际 click）。
 * source='computer'：输入坐标来自真实屏幕，缩小到 AI 分辨率（用于截图标注）。
 */
export function scaleCoordinates(source, x, y, screenWidth, screenHeight) {
    const target = selectScalingTarget(screenWidth, screenHeight);
    if (!target) {
        return {
            x: Math.round(x),
            y: Math.round(y),
            scale: 1,
            target: null,
        };
    }
    const scale = target.width / screenWidth;
    if (source === 'api') {
        return {
            x: Math.round(x / scale),
            y: Math.round(y / scale),
            scale,
            target,
        };
    }
    return {
        x: Math.round(x * scale),
        y: Math.round(y * scale),
        scale,
        target,
    };
}
