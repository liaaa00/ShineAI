// Product branding only. External addresses and encryption formats are contracts.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const legacy = Buffer.from('U3BlY3RyQUk=', 'base64').toString();
export function brandSource(source) {
  const protectedValues = [
    `${legacy.toLowerCase()}dev.cloud`, `${legacy.toLowerCase()}dev.com`,
    `raw.githubusercontent.com/${legacy.toLowerCase()}/registry`,
    `github.com/${legacy.toLowerCase()}/registry`, `${legacy.toLowerCase()}/registry`,
  ];
  // The old salt is required to decrypt existing AES records; never rebrand it.
  for (const suffix of ['secret-store-salt-v1', 'user-token-salt-v1']) {
    const oldSalt = `${legacy.toLowerCase()}-${suffix}`;
    source = source.replaceAll(`"shineai-${suffix}"`, JSON.stringify(oldSalt));
    protectedValues.push(oldSalt);
  }
  for (const [i, value] of protectedValues.entries()) source = source.replaceAll(value, `__BRAND_CONTRACT_${i}__`);
  for (const [from, to] of [[legacy.toUpperCase(), 'SHINEAI'], [legacy[0].toLowerCase() + legacy.slice(1), 'shineAI'], [legacy, 'ShineAI'], [legacy.slice(0, -1) + 'i', 'ShineAI'], [legacy.toLowerCase(), 'shineai']]) source = source.replaceAll(from, to);
  for (const [i, value] of protectedValues.entries()) source = source.replaceAll(`__BRAND_CONTRACT_${i}__`, value);
  return source;
}

export function brandTree(directory) {
  let changed = 0;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.isSymbolicLink()) continue;
    let file = path.join(directory, entry.name);
    if (entry.isDirectory()) changed += brandTree(file);
    else if (/\.(?:[cm]?js|json|html|css|md|txt|ya?ml|ps1|sh|py|webmanifest|map|ts|cmd|bat)$/i.test(entry.name) && !/^(?:LICENSE|COPYING|NOTICE)/i.test(entry.name)) {
      const source = fs.readFileSync(file, 'utf8'), result = brandSource(source);
      if (result !== source) { fs.writeFileSync(file, result); changed++; }
    }
    const name = brandSource(entry.name);
    if (name !== entry.name) { fs.renameSync(file, path.join(directory, name)); changed++; }
  }
  return changed;
}

export function refreshWebPrecache(directory) {
  const file = path.join(directory, 'sw.js');
  const source = fs.readFileSync(file, 'utf8');
  const result = source.replace(/url:"([^"]+)",revision:(?:null|"[^"]*")/g, (_match, url) => {
    const asset = path.resolve(directory, url);
    if (!asset.startsWith(path.resolve(directory) + path.sep)) throw new Error('Unsafe precache asset');
    const digest = crypto.createHash('sha256').update(fs.readFileSync(asset)).digest('hex');
    return `url:${JSON.stringify(url)},revision:${JSON.stringify(digest)}`;
  });
  if (source !== result) fs.writeFileSync(file, result);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  console.log('Branded resource files:', brandTree(path.join(root, 'resources')));
  refreshWebPrecache(path.join(root, 'resources/web-client'));
}
