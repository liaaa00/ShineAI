import type { AnnotatedSource } from './click-accuracy.js';
export interface AnnotatedElement {
    number: number;
    name: string;
    controlType: string;
    screenX: number;
    screenY: number;
    automationId?: string;
    className?: string;
    processId?: number;
    rectX?: number;
    rectY?: number;
    rectW?: number;
    rectH?: number;
    source?: AnnotatedSource;
    isEnabled?: boolean;
    isOffscreen?: boolean;
    patterns?: string[];
}
export interface ScreenshotMeta {
    captureX: number;
    captureY: number;
    captureW: number;
    captureH: number;
    imageW: number;
    imageH: number;
    elements?: AnnotatedElement[];
}
/**
 * Model-side vision limits Anthropic's standard tier enforces on an uploaded image
 * BEFORE the model sees it: long edge capped at 1568px, total pixels near ~1.15M
 * (≈1568 vision-token budget). If we hand over a native 2560x1440 / 4K capture, the API
 * downscales it lossily and grid labels / small text get mushed. So we downscale
 * application-side with high-quality interpolation and keep coordinates in screen space.
 * Other providers differ, but these bounds are a safe common ceiling.
 */
export declare const AUTO_SCALE_MAX_LONG_EDGE = 1568;
export declare const AUTO_SCALE_MAX_PIXELS = 1150000;
/**
 * Target image size for auto-scaling a WxH capture within the model's vision limits.
 * scale = min(1, MAX_LONG_EDGE/longEdge, sqrt(MAX_PIXELS/(w*h))). Never upscales.
 * Same math is inlined in the PowerShell capture path via the two injected constants.
 */
export declare function computeAutoScale(w: number, h: number): {
    width: number;
    height: number;
    scale: number;
};
export type ScreenshotMetaFs = {
    existsSync: (p: string) => boolean;
    readFileSync: (p: string, encoding: 'utf8') => string;
};
/** Resolve + unify separators; Windows also lowercases for case-insensitive hits. */
export declare function normalizeScreenshotMetaKey(p: string): string;
/** Sibling persistence path used by screenshot(): foo.png → foo.meta.json */
export declare function siblingMetaJsonPath(screenshotPath: string): string;
/** Parse disk .meta.json into ScreenshotMeta; require elements for hydrate. */
export declare function parseScreenshotMetaJson(raw: string): ScreenshotMeta | null;
export declare function setScreenshotMeta(map: Map<string, ScreenshotMeta>, screenshotPath: string, meta: ScreenshotMeta): void;
/**
 * Lookup by normalized key; on miss, hydrate from sibling .meta.json when it has elements.
 */
export declare function getScreenshotMeta(map: Map<string, ScreenshotMeta>, screenshotPath: string, fsImpl?: ScreenshotMetaFs): ScreenshotMeta | null;
