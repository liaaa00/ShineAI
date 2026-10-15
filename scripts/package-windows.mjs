import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { prepareExtractor } from './packaging/nsis-extractor.mjs';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const metadata = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const stage = path.join(root, 'artifacts', 'installer-stage');
const output = path.join(root, 'artifacts', 'installer');
const toolRoot = path.join(root, '.runtime', 'packaging');
process.env.ELECTRON_BUILDER_CACHE = path.join(toolRoot, 'cache');
process.env.ELECTRON_BUILDER_NSIS_DIR = path.join(toolRoot, 'nsis-modern/nsis-3.11');
if (!fs.existsSync(path.join(process.env.ELECTRON_BUILDER_NSIS_DIR, 'Bin/makensis.exe'))) {
  throw new Error('The pinned NSIS 3.11 compiler is missing; see docs/INSTALLER.md.');
}
// NSIS otherwise forces ultra compression even when config says "normal".
// Level 3 keeps local rebuilds practical for the bundled SDK executables.
process.env.ELECTRON_BUILDER_COMPRESSION_LEVEL ??= '3';
if (!fs.existsSync(path.join(toolRoot, 'node_modules/electron-builder/package.json'))) {
  throw new Error('Install the pinned packaging tools first; see docs/INSTALLER.md.');
}
const requireTool = createRequire(path.join(toolRoot, 'package.json'));
const { build, Platform, Arch } = requireTool('electron-builder');
// Explicit allowlist: never stage project profiles, credentials, logs or archives.
for (const dir of ['out', 'node_modules', 'resources']) {
  if (!fs.statSync(path.join(root, dir)).isDirectory()) throw new Error(`Missing ${dir}`);
}
const buildManifest = JSON.parse(fs.readFileSync(path.join(root, 'artifacts/build-manifest.json'), 'utf8'));
for (const entry of buildManifest.files) {
  const digest = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, 'out', entry.path))).digest('hex');
  if (digest !== entry.sha256) throw new Error(`Stale output: ${entry.path}`);
}
if (fs.existsSync(stage) && fs.lstatSync(stage).isSymbolicLink()) throw new Error('Linked staging directory');
const reuseStage = process.argv.includes('--reuse-stage');
if (!reuseStage) {
  fs.rmSync(stage, { recursive: true, force: true });
  fs.mkdirSync(stage, { recursive: true });
  console.log('Staging the pinned Electron runtime and application dependencies…');
  fs.cpSync(path.join(root, '.runtime/electron'), stage, { recursive: true });
  fs.renameSync(path.join(stage, 'electron.exe'), path.join(stage, 'ShineAI.exe'));
  fs.rmSync(path.join(stage, 'resources/default_app.asar'), { force: true });
  const appRoot = path.join(stage, 'resources/app');
  fs.mkdirSync(appRoot, { recursive: true });
  for (const dir of ['out', 'node_modules', 'resources']) fs.cpSync(path.join(root, dir), path.join(appRoot, dir), { recursive: true });
  fs.writeFileSync(path.join(appRoot, 'package.json'), JSON.stringify({
    name: metadata.name, productName: 'ShineAI', version: metadata.version,
    private: true, main: metadata.main, description: metadata.description,
  }, null, 2) + '\n');
}
const appRoot = path.join(stage, 'resources/app');
if (fs.readdirSync(appRoot).sort().join(',') !== 'node_modules,out,package.json,resources') throw new Error('Unexpected staged application content');
for (const entry of buildManifest.files) {
  const staged = fs.readFileSync(path.join(appRoot, 'out', entry.path));
  if (crypto.createHash('sha256').update(staged).digest('hex') !== entry.sha256) throw new Error(`Stale staged output: ${entry.path}`);
}
// prepackaged keeps ABI 149 binaries intact and skips dependency installation/rebuild.
process.env.CSC_IDENTITY_AUTO_DISCOVERY = 'false';
console.log('Building the per-user Windows x64 installer…');
// Never trust cached archives by mtime: an interrupted archive can look current.
const reusePayload = process.argv.includes('--reuse-payload');
for (const extension of reusePayload ? ['7z'] : ['7z', 'zip']) {
  fs.rmSync(path.join(output, `${metadata.name}-${metadata.version}-x64.nsis.${extension}`), { force: true });
}
fs.rmSync(path.join(output, 'package-report.json'), { force: true });
fs.rmSync(path.join(output, 'installer-smoke-report.json'), { force: true });
// Explicit files retain their paths and avoid unnecessary directory records.
const packageFiles = [];
function collect(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error('Linked installer input');
    if (entry.isDirectory()) collect(file);
    else packageFiles.push(path.relative(stage, file).replaceAll('\\', '/'));
  }
}
collect(stage);
fs.mkdirSync(output, { recursive: true });
const responseFile = path.join(root, 'artifacts/installer-files.txt');
fs.writeFileSync(responseFile, packageFiles.map(file => `"${file}"`).join('\n') + '\n');
const archive = path.join(output, `${metadata.name}-${metadata.version}-x64.nsis.zip`);
const cachedArchive = path.join(root, 'artifacts/installer-payload.zip');
if (reusePayload && !fs.existsSync(archive) && fs.existsSync(cachedArchive)) fs.linkSync(cachedArchive, archive);
const stageInventory = crypto.createHash('sha256').update(JSON.stringify(packageFiles.map(file => {
  const stat = fs.statSync(path.join(stage, file));
  return [file, stat.size, stat.mtimeMs];
}))).digest('hex');
if (reusePayload) {
  const cached = JSON.parse(fs.readFileSync(path.join(root, 'artifacts/installer-payload-cache.json'), 'utf8'));
  const sha256 = crypto.createHash('sha256').update(fs.readFileSync(archive)).digest('hex');
  if (!reuseStage || cached.stageInventory !== stageInventory || cached.buildFingerprint !== buildManifest.fingerprint || cached.sha256 !== sha256) throw new Error('Cached payload does not match this stage');
} else {
console.log(`Creating a ZIP with ${packageFiles.length} file entries and no directory entries…`);
await new Promise((resolve, reject) => {
  const child = spawn(requireTool('7zip-bin').path7za, ['a', '-tzip', '-bd', '-mx=3', '-mm=Deflate', '-mtc=off', '-scsUTF-8', '-sccUTF-8', archive, '@' + responseFile], { cwd: stage, windowsHide: true, stdio: 'inherit' });
  child.on('error', reject);
  child.on('exit', code => code === 0 ? resolve() : reject(new Error(`Installer ZIP creation failed: ${code}`)));
});
}
const descriptor = fs.openSync(archive, 'r');
try {
  const length = fs.fstatSync(descriptor).size;
  const tail = Buffer.alloc(Math.min(length, 65557));
  fs.readSync(descriptor, tail, 0, tail.length, length - tail.length);
  const end = tail.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (end < 0 || end + 22 + tail.readUInt16LE(end + 20) !== tail.length ||
      tail.readUInt16LE(end + 10) !== Math.min(packageFiles.length, 65535)) {
    throw new Error('The ZIP is incomplete; refusing to generate an installer');
  }
} finally { fs.closeSync(descriptor); }
fs.writeFileSync(path.join(root, 'artifacts/installer-payload-cache.json'), JSON.stringify({
  stageInventory, buildFingerprint: buildManifest.fingerprint,
  sha256: crypto.createHash('sha256').update(fs.readFileSync(archive)).digest('hex'),
}, null, 2) + '\n');
if (!fs.existsSync(cachedArchive)) fs.linkSync(archive, cachedArchive);
else if (!reusePayload) { fs.unlinkSync(cachedArchive); fs.linkSync(archive, cachedArchive); }
// Redirect this builder process to a private copy of the pinned templates.
// Keep its normal installer/uninstaller generation and registration behavior.
const nsisRuntime = requireTool('app-builder-lib/out/targets/nsis/nsisUtil.js');
if (typeof nsisRuntime.nsisTemplatesDir !== 'string') throw new Error('Unsupported NSIS tool layout');
nsisRuntime.nsisTemplatesDir = prepareExtractor(root, toolRoot, requireTool('7zip-bin').path7za);
const files = await build({
  publish: 'never',
  projectDir: root, prepackaged: stage, targets: Platform.WINDOWS.createTarget(['nsis'], Arch.x64),
  config: {
    appId: 'com.local.shineai.dev.installed', productName: 'ShineAI',
    protocols: [{ name: 'ShineAI', schemes: ['shineai-dev', 'claudeops-dev'] }],
    executableName: 'ShineAI', electronVersion: '44.5.1',
    npmRebuild: false, asar: false, compression: 'normal',
    directories: { output, buildResources: path.join(root, 'resources') },
    win: { icon: path.join(root, 'resources/icon.ico'), signAndEditExecutable: false },
    artifactName: 'ShineAI-${version}-windows-x64-setup.${ext}',
    nsis: {
      include: path.join(root, 'scripts/packaging/protocol-cleanup.nsh'),
      oneClick: false, perMachine: false, allowElevation: false, packElevateHelper: false,
      installerLanguages: ['zh_CN', 'en_US'],
      allowToChangeInstallationDirectory: true, runAfterFinish: false,
      createDesktopShortcut: true, createStartMenuShortcut: true,
      shortcutName: 'ShineAI', uninstallDisplayName: 'ShineAI',
      deleteAppDataOnUninstall: false, differentialPackage: false, useZip: true,
    },
  },
});
const installer = files.find(file => file.endsWith('-setup.exe'));
if (!installer) throw new Error('Installer was not generated');
const checksum = crypto.createHash('sha256').update(fs.readFileSync(installer)).digest('hex');
fs.writeFileSync(installer + '.sha256', `${checksum}  ${path.basename(installer)}\n`);
fs.writeFileSync(path.join(output, 'package-report.json'), JSON.stringify({
  installer, sizeBytes: fs.statSync(installer).size, sha256: checksum,
  electron: '44.5.1', abi: '149', buildFingerprint: buildManifest.fingerprint,
  applicationAllowlist: ['out', 'node_modules', 'resources', 'package.json'],
  includesUserData: false, signed: false,
  archiveFileEntries: packageFiles.length, archiveDirectoryEntries: 0,
  extractor: 'bundled 7-Zip 21.07; direct extraction', compressionLevel: 3,
  nsis: '3.11',
}, null, 2) + '\n');
console.log(`Installer ready: ${installer}`);
