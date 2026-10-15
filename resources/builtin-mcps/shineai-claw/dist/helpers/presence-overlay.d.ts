/**
 * ShineAI Claw presence overlay — click-through HUD while AI drives the desktop.
 *
 * Windows: lazy-spawn a WinForms overlay process (presence-overlay.ps1).
 * Any failure is swallowed so automation never fails because of the HUD.
 */
import { spawn } from 'child_process';
export interface PresenceOverlayDeps {
    platform?: NodeJS.Platform;
    env?: NodeJS.ProcessEnv;
    spawn?: typeof spawn;
    scriptPath?: string;
}
export declare function isPresenceEnabled(env?: NodeJS.ProcessEnv, platform?: NodeJS.Platform): boolean;
/** Format a stdin command for the overlay process. Pure — safe to unit-test. */
export declare function formatPresenceCommand(label: string, x?: number, y?: number): string;
export declare function sanitizeLabel(label: string): string;
/**
 * Show presence. With x/y → MARK (ring + badge); otherwise BADGE only.
 * Never throws.
 */
export declare function presenceMark(label: string, x?: number, y?: number, deps?: PresenceOverlayDeps): void;
/** Hide overlay immediately. Never throws. */
export declare function presenceHide(deps?: PresenceOverlayDeps): void;
/** Kill overlay process (best-effort). Never throws. */
export declare function presenceStop(): void;
/** Test-only: reset singleton so cases can re-spawn. */
export declare function resetPresenceOverlayForTests(): void;
