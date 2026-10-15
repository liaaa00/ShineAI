export interface HudElement {
    number: number;
    name?: string;
    controlType?: string;
    screenX?: number;
    screenY?: number;
    rectX?: number;
    rectY?: number;
    rectW?: number;
    rectH?: number;
}
export interface RenderHudOptions {
    /** Absolute path to the source screenshot (PNG). */
    imagePath: string;
    /** Array of annotated elements to overlay. */
    elements: HudElement[];
    /** Element number to highlight (glow/pulse). 0 = no highlight. */
    highlightNumber?: number;
    /** RGB glow color string, e.g. "0,200,255". Default: cyan. */
    glowColor?: string;
    /** Highlight rendering style. Default: 'glow'. */
    highlightMode?: 'glow' | 'pulse' | 'flash';
    /** Override output path. Default: <source>_hud.png next to source. */
    outputPath?: string;
}
/**
 * Renders a sci-fi HUD overlay onto `imagePath` and returns the path of the new image.
 * The source image is NOT modified; a new file `*_hud.png` is produced.
 */
export declare function renderHud(opts: RenderHudOptions): Promise<string>;
