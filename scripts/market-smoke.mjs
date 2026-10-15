import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import { root, openTestApp, completeOnboarding } from './electron-test-helper.mjs';
const dataDir = path.join(root, '.test-data', 'market-' + Date.now());
const report = { date: new Date().toISOString(), checks: {}, errors: [] };
const fixtureId = 'market-download-verification';
const fixturePrompt = 'MARKET_DOWNLOAD_VERIFIED {{user_input}}';
const fixtureMcp = { id: 'market-config-verification', name: 'Market config verification', command: 'node', args: ['--version'], installMethod: 'manual', source: 'official' };
let fixtureUrl;
const server = http.createServer((request, response) => {
  if (request.url === '/SKILL.md') {
    response.end('---\nname: market-download-verification\ndescription: Download verification\n---\n\n' + fixturePrompt);
  } else {
    response.setHeader('Content-Type', 'application/json');
    response.end(JSON.stringify({ skills: [{ id: fixtureId, name: 'Download verification', contentUrl: fixtureUrl + '/SKILL.md', slashCommand: 'market-download-verification', type: 'prompt', compatibleProviders: 'all', source: 'official' }], mcps: [fixtureMcp] }));
  }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
fixtureUrl = `http://127.0.0.1:${server.address().port}`;
let app, page;
try {
  ({ app, page } = await openTestApp(dataDir));
  page.on('pageerror', error => report.errors.push(error.message));
  await completeOnboarding(page);
  const skills = await page.evaluate(() => window.shineAI.registry.fetchSkills(true));
  assert.ok(Array.isArray(skills) && skills.length > 0);
  report.defaultSkillCount = skills.length;
  report.checks.defaultSkillCatalog = true;
  const installed = await page.evaluate(() => window.shineAI.skill.getAll().then(result => result.data));
  const candidate = skills.find(item => item.promptTemplate && !installed.some(skill => skill.id === item.id) && skills.filter(other => other.name === item.name).length === 1);
  assert.ok(candidate, 'Expected a unique uninstalled market skill with an inline template');
  await page.getByRole('button', { name: '设置', exact: true }).click();
  await page.getByText('全部设置', { exact: true }).click();
  await page.getByRole('button', { name: '能力', exact: true }).click();
  await page.getByRole('button', { name: '技能', exact: true }).click();
  await page.getByRole('button', { name: /技能市场/ }).click();
  await page.getByText('Code Review', { exact: true }).first().waitFor({ timeout: 35000 });
  report.checks.officialMarketCardsVisible = true;
  await page.screenshot({ path: path.join(root, 'artifacts/market-restored.png') });
  await page.getByPlaceholder('搜索技能...').fill(candidate.name);
  await page.getByRole('button', { name: '安装', exact: true }).click();
  await page.waitForFunction(id => window.shineAI.skill.get(id).then(result => result.success), candidate.id);
  const saved = await page.evaluate(id => window.shineAI.skill.get(id).then(result => result.data), candidate.id);
  assert.equal(saved.promptTemplate, candidate.promptTemplate);
  report.installedSkill = { id: candidate.id, name: candidate.name };
  report.checks.marketButtonInstallsLocally = true;
  // A local registry isolates the download/install contract from external network outages.
  await page.evaluate(url => window.shineAI.settings.update('registry_url', url + '/registry.json'), fixtureUrl);
  const refresh = await page.evaluate(() => window.shineAI.registry.forceRefresh());
  assert.equal(refresh.success, true);
  const downloadedCatalog = await page.evaluate(() => window.shineAI.registry.fetchSkills());
  const fixture = downloadedCatalog.find(item => item.id === fixtureId);
  assert.ok(fixture);
  report.checks.refreshAndCustomRegistry = true;
  const download = await page.evaluate(item => window.shineAI.registry.installFromRegistry(item), fixture);
  assert.equal(download.success, true);
  assert.ok((await page.evaluate(id => window.shineAI.skill.get(id).then(result => result.data), fixtureId)).promptTemplate.includes(fixturePrompt));
  report.checks.skillContentDownload = true;
  const mcps = await page.evaluate(() => window.shineAI.registry.fetchMcps());
  assert.equal(mcps[0].id, fixtureMcp.id);
  const builtin = await page.evaluate(() => window.shineAI.registry.fetchMarketMcps({ source: 'builtin' }));
  assert.ok(builtin.items.length > 0);
  const mcpInstall = await page.evaluate(item => window.shineAI.registry.installMcp(item), fixtureMcp);
  assert.equal(mcpInstall.success, true);
  assert.ok((await page.evaluate(() => window.shineAI.mcp.getAll().then(result => result.data))).some(item => item.id === 'market-' + fixtureMcp.id));
  report.checks.mcpCatalogAndLocalConfig = true;
  assert.equal((await page.evaluate(() => window.shineAI.auth.loginWithEmail('unused@example.invalid', 'unused'))).errorCode, 'OFFICIAL_CLOUD_REMOVED');
  report.checks.hostedLoginStillRemoved = true;
  await app.close(); app = null;
  ({ app, page } = await openTestApp(dataDir));
  const restored = await page.evaluate(id => window.shineAI.skill.get(id).then(result => result.data), candidate.id);
  assert.equal(restored.promptTemplate, candidate.promptTemplate);
  assert.ok((await page.evaluate(id => window.shineAI.skill.get(id).then(result => result.data), fixtureId)).promptTemplate.includes(fixturePrompt));
  report.checks.restartPreservesInstalledSkills = true;
  assert.equal(report.errors.length, 0, report.errors.join(';'));
} catch (error) { report.errors.push(error.message); process.exitCode = 1; }
finally {
  if (app) await app.close();
  await new Promise(resolve => server.close(resolve));
  fs.writeFileSync(path.join(root, 'artifacts/market-smoke-report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
}
