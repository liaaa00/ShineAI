// Recover a completed application ZIP when electron-builder's APFS stage hangs.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
assert.equal(process.platform, 'darwin'); assert.equal(process.arch, 'x64');
const output = path.join(root, 'artifacts/installer-mac');
const zip = path.join(output, 'ShineAI-1.0.6-macos-x64.zip');
const stage = path.join(root, 'artifacts/intel-recovery');
fs.mkdirSync(stage, { recursive: true });
execFileSync('ditto', ['-x', '-k', zip, stage], { timeout: 180000 });
const bundle = path.join(stage, 'ShineAI.app');
assert.ok(fs.existsSync(path.join(bundle, 'Contents/MacOS/ShineAI')));
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'artifacts/build-manifest.json'), 'utf8'));
for (const file of manifest.files) {
  const restored = path.join(bundle, 'Contents/Resources/app/out', file.path);
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(restored)).digest('hex'), file.sha256, file.path);
}
execFileSync('codesign', ['--verify', '--deep', '--strict', bundle], { stdio: 'inherit' });
fs.symlinkSync('/Applications', path.join(stage, 'Applications'));
const dmg = path.join(output, 'ShineAI-1.0.6-macos-x64.dmg');
// HFS+ avoids the stalled APFS copy-helper on the hosted Intel runner.
execFileSync('hdiutil', ['create', '-ov', '-srcfolder', stage, '-volname', 'ShineAI', '-fs', 'HFS+', '-format', 'UDZO', '-imagekey', 'zlib-level=3', dmg], { stdio: 'inherit', timeout: 300000 });
for (const file of [zip, dmg]) fs.writeFileSync(file + '.sha256', crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex') + '  ' + path.basename(file) + '\n');
fs.writeFileSync(path.join(output, 'package-report.json'), JSON.stringify({ platform: 'darwin', arch: 'x64', version: '1.0.6', bundle, executable: path.join(bundle, 'Contents/MacOS/ShineAI'), files: [zip, dmg], developerIdSigned: false, notarized: false, adHocSigned: true, commit: process.env.GITHUB_SHA, buildFingerprint: manifest.fingerprint, source: 'Previously completed x64 ZIP; all application files checked against current build manifest; HFS+ DMG' }, null, 2));
