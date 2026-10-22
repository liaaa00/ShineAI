import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
if (process.env.GITHUB_ACTIONS !== 'true' || process.env.GITHUB_REF !== 'refs/heads/main') throw Error('Publish only from main in GitHub Actions');
const tag = process.env.RELEASE_TAG;
if (!/^v[0-9][0-9A-Za-z._-]{0,79}$/.test(tag || '')) throw Error('Invalid release tag');
const release = JSON.parse(execFileSync('gh', ['release', 'view', tag, '--json', 'assets,isDraft,targetCommitish'], { encoding: 'utf8' }));
if (!release.isDraft || release.targetCommitish !== process.env.GITHUB_SHA) throw Error('Draft source revision mismatch');
const version = JSON.parse(fs.readFileSync('package.json', 'utf8')).version;
const names = [`ShineAI-${version}-windows-x64-setup.exe`, `ShineAI-${version}-macos-arm64.dmg`, `ShineAI-${version}-macos-arm64.zip`, `ShineAI-${version}-macos-x64.zip`];
fs.mkdirSync('artifacts/checksums', { recursive: true });
execFileSync('gh', ['release', 'download', tag, '--pattern', '*.sha256', '--dir', 'artifacts/checksums'], { stdio: 'inherit' });
if (release.assets.length !== names.length * 2) throw Error('Unexpected release asset count');
for (const name of names) {
  const asset = release.assets.find(a => a.name === name);
  const checksum = release.assets.find(a => a.name === name + '.sha256');
  const hash = fs.readFileSync('artifacts/checksums/' + name + '.sha256', 'utf8').trim().split(/\s+/)[0];
  if (!asset || !checksum || asset.state !== 'uploaded' || checksum.state !== 'uploaded' || asset.size < 1000000 || !/^[a-f0-9]{64}$/.test(hash) || asset.digest !== 'sha256:' + hash) throw Error('Missing or invalid installer: ' + name);
}
execFileSync('gh', ['release', 'edit', tag, '--draft=false', '--prerelease'], { stdio: 'inherit' });
fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `Published [${tag}](https://github.com/${process.env.GITHUB_REPOSITORY}/releases/tag/${tag}) from ${process.env.GITHUB_SHA}. All four installers and SHA-256 files verified.\n`);
