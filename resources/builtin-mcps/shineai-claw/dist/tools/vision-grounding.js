/**
 * Vision Grounding — OCR-based visual element locator for click fallback.
 *
 * Calls ocr-worker.ps1 in a separate STA process (same pattern as desktop-tools.ts),
 * parses `text|screenX|screenY|width|height` output, and matches by selector.text
 * (case-insensitive, whitespace-normalized). Uses `near` to disambiguate multiple hits.
 *
 * No new npm dependencies — pure Node.js + existing ocr-worker.ps1.
 */
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { tmpdir } from 'os';
import { spawn } from 'child_process';
import { readFile, unlink } from 'fs/promises';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
/** Path to ocr-worker.ps1 (same constant pattern as desktop-tools.ts:39) */
const OCR_WORKER_PS1 = join(__dirname, '..', 'scripts', 'ocr-worker.ps1');
/**
 * Run ocr-worker.ps1 on the given screenshot and return parsed word list.
 * captureX/Y/W/H describe the screen region the screenshot covers (needed for coordinate mapping).
 */
async function runOcrWorker(imgPath, captureX, captureY, captureW, captureH) {
    const outFile = join(tmpdir(), `shineai_vg_ocr_${Date.now()}_${Math.random().toString(36).slice(2)}.txt`);
    const workerPath = OCR_WORKER_PS1.replace(/\\\\/g, '\\');
    const args = [
        '-NoProfile', '-STA', '-ExecutionPolicy', 'Bypass',
        '-File', workerPath,
        '-ImgPath', imgPath,
        '-CaptureX', String(captureX),
        '-CaptureY', String(captureY),
        '-CaptureW', String(captureW),
        '-CaptureH', String(captureH),
        '-OutFile', outFile,
    ];
    await new Promise((resolve, reject) => {
        const proc = spawn('powershell.exe', args, {
            stdio: ['ignore', 'ignore', 'pipe'],
            windowsHide: true,
        });
        let stderrBuf = '';
        proc.stderr.on('data', (d) => { stderrBuf += d.toString(); });
        proc.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`ocr-worker exited ${code}: ${stderrBuf.slice(0, 300)}`));
            }
            else {
                resolve();
            }
        });
        proc.on('error', reject);
        // Hard timeout: 10s (aligned with desktop-tools annotate WaitForExit 8000)
        setTimeout(() => { try {
            proc.kill();
        }
        catch { /* ignore */ } ; reject(new Error('ocr-worker timeout')); }, 10000);
    });
    if (!existsSync(outFile)) {
        return [];
    }
    let raw = '';
    try {
        raw = await readFile(outFile, 'utf8');
    }
    finally {
        try {
            await unlink(outFile);
        }
        catch { /* ignore */ }
    }
    const words = [];
    for (const line of raw.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed)
            continue;
        const parts = trimmed.split('|');
        if (parts.length < 5)
            continue;
        const x = parseInt(parts[1], 10);
        const y = parseInt(parts[2], 10);
        const w = parseInt(parts[3], 10);
        const h = parseInt(parts[4], 10);
        if (!Number.isFinite(x) || !Number.isFinite(y))
            continue;
        words.push({ text: parts[0], x, y, w, h });
    }
    return words;
}
/** Normalize text for matching: lowercase + collapse whitespace */
function normalize(s) {
    return s.toLowerCase().replace(/\s+/g, ' ').trim();
}
/** Euclidean distance */
function dist(ax, ay, bx, by) {
    return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);
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
export async function visionLocate(selector, screenshotPath, captureRegion) {
    if (!selector.text)
        return null;
    if (!existsSync(screenshotPath))
        return null;
    // Without a real capture region we cannot map OCR coordinates back to the screen.
    if (!captureRegion)
        return null;
    const region = captureRegion;
    const needle = normalize(selector.text);
    if (!needle)
        return null;
    let words;
    try {
        words = await runOcrWorker(screenshotPath, region.x, region.y, region.w, region.h);
    }
    catch {
        // OCR failure is non-fatal — fall through to return null
        return null;
    }
    if (words.length === 0)
        return null;
    const candidates = [];
    for (const word of words) {
        const wordNorm = normalize(word.text);
        if (wordNorm === needle) {
            candidates.push({ word, confidence: 1.0 });
        }
        else if (needle.length >= 2 && wordNorm.includes(needle)) {
            // Substring match only for needles ≥ 2 chars; a 1-char needle matches far too much.
            candidates.push({ word, confidence: 0.7 });
        }
        else if (needle.includes(wordNorm) && wordNorm.length >= 2) {
            candidates.push({ word, confidence: 0.5 });
        }
    }
    if (candidates.length === 0)
        return null;
    // If multiple hits and near is provided, pick the closest
    let best;
    if (candidates.length === 1) {
        best = candidates[0];
    }
    else if (selector.near) {
        const { x: nx, y: ny } = selector.near;
        best = candidates.reduce((a, b) => dist(a.word.x, a.word.y, nx, ny) <= dist(b.word.x, b.word.y, nx, ny) ? a : b);
    }
    else {
        // No near hint: prefer highest confidence, then first occurrence
        best = candidates.reduce((a, b) => (b.confidence > a.confidence ? b : a));
    }
    return {
        x: best.word.x,
        y: best.word.y,
        confidence: best.confidence,
        matchedText: best.word.text,
    };
}
