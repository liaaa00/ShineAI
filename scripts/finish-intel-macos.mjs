// Recover a completed application ZIP when electron-builder's APFS stage hangs.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
assert.equal(process.platform, 'darwin'); assert.ok(['arm64','x64'].includes(process.arch));
const arch=process.arch;
const output = path.join(root, 'artifacts/installer-mac');
const zip = path.join(output, `ShineAI-1.0.6-macos-${arch}.zip`);
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
let repaired=0;
function repairLinks(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) {
      const target=fs.readlinkSync(file),marker='/node_modules/';
      if(path.isAbsolute(target)&&target.includes(marker)){
        const replacement=path.join(bundle,'Contents/Resources/app',target.slice(target.indexOf(marker)+1));
        assert.ok(fs.existsSync(replacement),'Missing packaged link target: '+path.relative(bundle,file));
        fs.unlinkSync(file);fs.symlinkSync(path.relative(path.dirname(file),replacement),file);repaired++;
      }
      assert.ok(fs.existsSync(file),'Broken packaged link: '+path.relative(bundle,file));
    } else if (entry.isDirectory()) repairLinks(file);
  }
}
repairLinks(bundle);console.log('Repaired relocatable executable links:',repaired);
execFileSync('codesign', ['--force', '--deep', '--sign', '-', '--verbose=4', bundle], { stdio: 'inherit' });
execFileSync('codesign', ['--verify', '--deep', '--strict', '--verbose=4', bundle], { stdio: 'inherit' });
fs.symlinkSync('/Applications', path.join(stage, 'Applications'));
const refreshedZip=path.join(output, `ShineAI-1.0.6-macos-${arch}.repacked.zip`);
execFileSync('ditto',['-c','-k','--keepParent',bundle,refreshedZip],{stdio:'inherit',timeout:300000});
fs.renameSync(refreshedZip,zip);
const dmg = path.join(output, `ShineAI-1.0.6-macos-${arch}.dmg`);
// HFS+ avoids the stalled APFS copy-helper on the hosted Intel runner.
execFileSync('hdiutil', ['create', '-ov', '-srcfolder', stage, '-volname', 'ShineAI', '-fs', 'HFS+', '-format', 'UDZO', '-imagekey', 'zlib-level=3', dmg], { stdio: 'inherit', timeout: 300000 });
for (const file of [zip, dmg]) fs.writeFileSync(file + '.sha256', crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex') + '  ' + path.basename(file) + '\n');
fs.writeFileSync(path.join(output, 'package-report.json'), JSON.stringify({ platform: 'darwin', arch, version: '1.0.6', bundle, executable: path.join(bundle, 'Contents/MacOS/ShineAI'), files: [zip, dmg], developerIdSigned: false, notarized: false, adHocSigned: true, commit: process.env.GITHUB_SHA, buildFingerprint: manifest.fingerprint, repairedLinks:repaired, source: 'Previously completed application ZIP; all application files checked against current build manifest; relocated links; HFS+ DMG' }, null, 2));
