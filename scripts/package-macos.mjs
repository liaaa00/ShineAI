import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (process.platform !== 'darwin') throw Error('Build on a macOS runner; Windows native dependencies are not a Mac runtime.');
const arch = process.arch;
if (!['x64', 'arm64'].includes(arch)) throw Error('Unsupported Mac architecture');
const requireTool = createRequire(path.join(root, '.runtime/packaging/package.json'));
const { build, Platform, Arch } = requireTool('electron-builder');
const { downloadArtifact } = requireTool('@electron/get');
const metadata = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const stage = path.join(root, 'artifacts/mac-stage');
fs.mkdirSync(stage, { recursive: true });
const archive = await downloadArtifact({ version: '44.5.1', artifactName: 'electron', platform: 'darwin', arch });
execFileSync('ditto', ['-x', '-k', archive, stage]);
const bundle = path.join(stage, 'ShineAI.app');
fs.renameSync(path.join(stage, 'Electron.app'), bundle);
const contents = path.join(bundle, 'Contents');
for (const notice of ['LICENSE', 'LICENSES.chromium.html']) {
  if (fs.existsSync(path.join(stage, notice))) fs.copyFileSync(path.join(stage, notice), path.join(contents, 'Resources', notice));
}
const iconset = path.join(stage, 'ShineAI.iconset');
fs.mkdirSync(iconset, { recursive: true });
for (const size of [16, 32, 128, 256, 512]) {
  for (const scale of [1, 2]) execFileSync('sips', ['-z', String(size * scale), String(size * scale), path.join(root, 'resources/icon.png'), '--out', path.join(iconset, `icon_${size}x${size}${scale === 2 ? '@2x' : ''}.png`)]);
}
execFileSync('iconutil', ['-c', 'icns', iconset, '-o', path.join(contents, 'Resources/shineai.icns')]);
const appRoot = path.join(contents, 'Resources/app');
fs.rmSync(path.join(contents, 'Resources/default_app.asar'), { force: true });
fs.mkdirSync(appRoot, { recursive: true });
for (const dir of ['out', 'node_modules', 'resources']) {
  fs.cpSync(path.join(root, dir), path.join(appRoot, dir), { recursive: true, filter(source) {
    const parent = path.dirname(source);
    const packageRoot = path.basename(parent) === 'node_modules' || (path.basename(parent).startsWith('@') && path.basename(path.dirname(parent)) === 'node_modules');
    if (!packageRoot || !fs.existsSync(path.join(source, 'package.json'))) return true;
    const pkg = JSON.parse(fs.readFileSync(path.join(source, 'package.json'), 'utf8'));
    const supports = (values, target) => !values || (!values.includes('!' + target) && (!values.some(v => !v.startsWith('!')) || values.includes(target) || values.includes('any')));
    return supports(pkg.os, 'darwin') && supports(pkg.cpu, arch);
  } });
}
fs.writeFileSync(path.join(appRoot, 'package.json'), JSON.stringify({ name: metadata.name, productName: 'ShineAI', version: metadata.version, main: metadata.main, private: true }));
const exe = path.join(contents, 'MacOS/ShineAI');
fs.renameSync(path.join(contents, 'MacOS/Electron'), exe);
const plist = path.join(contents, 'Info.plist');
for (const [key, value] of Object.entries({ CFBundleExecutable: 'ShineAI', CFBundleName: 'ShineAI', CFBundleDisplayName: 'ShineAI', CFBundleIconFile: 'shineai.icns', CFBundleIdentifier: 'com.local.shineai.dev.installed', CFBundleShortVersionString: metadata.version, CFBundleVersion: metadata.version, NSMicrophoneUsageDescription: 'Allow audio capture when you use voice features.', NSCameraUsageDescription: 'Allow camera access when you use video features.' })) {
  execFileSync('plutil', ['-replace', key, '-string', value, plist]);
}
// ZIPs restored from Windows lose executable mode bits. Restore only executable
// file formats and scripts; do not run downloaded install hooks over the snapshot.
function fixModes(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isSymbolicLink()) continue;
    if (entry.isDirectory()) { fixModes(file); continue; }
    const fd = fs.openSync(file, 'r');
    const header = Buffer.alloc(4);
    fs.readSync(fd, header, 0, 4, 0); fs.closeSync(fd);
    if (header.subarray(0, 2).toString() === '#!' || ['cffaedfe', 'cefaedfe', 'cafebabe', 'bebafeca', '7f454c46'].includes(header.toString('hex'))) fs.chmodSync(file, 0o755);
  }
}
fixModes(appRoot);
// Remove the downloaded bundle signature after modifying it, then apply an ad-hoc
// signature required by Apple Silicon. This is not Developer ID/notarization.
execFileSync('codesign', ['--force', '--deep', '--sign', '-', bundle], { stdio: 'inherit' });
process.env.CSC_IDENTITY_AUTO_DISCOVERY = 'false';
process.env.ELECTRON_BUILDER_COMPRESSION_LEVEL ??= '3';
const output = path.join(root, 'artifacts/installer-mac');
const files = await build({ projectDir: root, prepackaged: bundle, publish: 'never', targets: Platform.MAC.createTarget(['dmg', 'zip'], Arch[arch]), config: {
  appId: 'com.local.shineai.dev.installed', productName: 'ShineAI', executableName: 'ShineAI', electronVersion: '44.5.1', npmRebuild: false, asar: false,
  directories: { output }, artifactName: 'ShineAI-${version}-macos-${arch}.${ext}',
  mac: { identity: null, category: 'public.app-category.developer-tools', icon: path.join(contents, 'Resources/shineai.icns') },
  dmg: { sign: false },
} });
for (const file of files.filter(f => /\.(dmg|zip)$/.test(f))) {
  fs.writeFileSync(file + '.sha256', crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex') + '  ' + path.basename(file) + '\n');
}
fs.writeFileSync(path.join(output, 'package-report.json'), JSON.stringify({ platform: 'darwin', arch, version: metadata.version, bundle, executable: exe, files, developerIdSigned: false, notarized: false, adHocSigned: true, commit: process.env.GITHUB_SHA || null }, null, 2));
console.log('Mac installation images ready: ' + output);
