export interface VisionSelector {
    text?: string;
    near?: {
        x: number;
        y: number;
    };
    role?: string;
}
export interface VisionLocation {
    x: number;
    y: number;
    confidence: number;
    matchedText: string;
}
/**
 * Locate a UI element by text using OCR on the given screenshot.
 *
 * @param selector  - text (required for text match), near (tie-breaking), role (ignored in v1 OCR)
 * @param screenshotPath - absolute path to screenshot PNG
 * @param captureRegion  - screen region the screenshot covers; REQUIRED for correct
 *                         OCR→screen coordinate mapping. Returns null if omitted.
 * @returns matched location with confidence, or null if no match
 */
export declare function visionLocate(selector: VisionSelector, screenshotPath: string, captureRegion?: {
    x: number;
    y: number;
    w: number;
    h: number;
}): Promise<VisionLocation | null>;
