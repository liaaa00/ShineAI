import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { root, openTestApp, completeOnboarding } from './electron-test-helper.mjs';

const executable = process.argv.find(arg => arg.startsWith('--executable='))?.slice('--executable='.length);
const dataDir = path.join(root, '.test-data', 'skill-install-' + Date.now());
const report = { date: new Date().toISOString(), executable: executable || 'project Electron', checks: {}, errors: [] };
const reportFile = path.join(root, 'artifacts', executable ? 'installed-skill-install-report.json' : 'skill-install-report.json');
let app, page;
try {
  ({app,page} = await openTestApp(dataDir, {auth:19412,meeting:18182}, executable));
  page.on('pageerror', error => report.errors.push(error.message));
  await completeOnboarding(page);
  const classification = await page.evaluate(() => window.shineAI.registry.classifySkillsSh('vercel-labs/skills', 'find-skills'));
  assert.equal(classification.success, true, classification.error);
  assert.equal(classification.data.method, 'repository');
  assert.equal(classification.data.inferredInstallCommand, undefined);
  assert.ok(classification.data.detailMarkdown.includes('npx skills find'));
  report.checks.searchExampleIsNotExecuted = true;
  await page.getByRole('button',{name:'设置',exact:true}).click();
  await page.getByText('全部设置',{exact:true}).click();
  await page.getByRole('button',{name:'能力',exact:true}).click();
  await page.getByRole('button',{name:'技能',exact:true}).click();
  await page.getByRole('button',{name:/技能市场/}).click();
  await page.getByRole('button',{name:/skills.sh 社区/}).click();
  await page.getByPlaceholder('搜索技能名称或仓库...').fill('find-skills');
  await page.getByText('find-skills',{exact:true}).first().waitFor({timeout:45000});
  await page.getByRole('button',{name:'安装',exact:true}).click();
  await Promise.race([
    page.getByRole('button',{name:'已装',exact:true}).waitFor({timeout:120000}),
    page.getByText(/安装"find-skills"失败/).waitFor({timeout:120000}).then(async () => { throw new Error(await page.getByText(/安装"find-skills"失败/).innerText()); })
  ]);
  const installed = await page.evaluate(async () => (await window.shineAI.skill.getAll()).data.find(skill => skill.tags?.includes('mk:vercel-labs/skills/find-skills')));
  assert.ok(installed, 'Skill registry entry missing after installation');
  assert.ok(installed.promptTemplate?.includes('# Find Skills'));
  assert.ok(installed.dirPath.startsWith(dataDir));
  assert.ok(fs.readFileSync(path.join(installed.dirPath,'SKILL.md'),'utf8').includes('# Find Skills'));
  await page.getByRole('button',{name:'已装',exact:true}).waitFor();
  report.installedSkill = {id:installed.id,name:installed.name,slashCommand:installed.slashCommand};
  report.checks.realMarketButtonDownloadsAndRegistersSkill = true;
  report.checks.skillBodyAndDirectoryPresent = true;
  await page.screenshot({path:path.join(root,'artifacts',executable?'installed-skill-install.png':'skill-install.png')});
  const duplicate = await page.evaluate(() => window.shineAI.registry.installSkillsSh('vercel-labs/skills','find-skills'));
  assert.equal(duplicate.success, true, duplicate.error);
  assert.equal(duplicate.data.skill.id, installed.id);
  report.checks.reinstallUpdatesSameSkill = true;
  await app.close(); app = null;
  ({app,page} = await openTestApp(dataDir,{auth:19412,meeting:18182},executable));
  const saved = await page.evaluate(id => window.shineAI.skill.get(id), installed.id);
  assert.equal(saved.success,true);
  assert.ok(saved.data.promptTemplate.includes('# Find Skills'));
  assert.ok(fs.existsSync(path.join(saved.data.dirPath,'SKILL.md')));
  report.checks.restartPreservesSkill = true;
  assert.equal(report.errors.length,0,report.errors.join('; '));
} catch(error) { report.errors.push(error.stack); process.exitCode=1; }
finally { if(page && !page.isClosed() && report.errors.length) { report.visibleError=(await page.locator('body').innerText()).slice(-1800); await page.screenshot({path:path.join(root,'artifacts/skill-install-failure.png')}); } if(app)await app.close(); fs.writeFileSync(reportFile,JSON.stringify(report,null,2)+'\n'); console.log(JSON.stringify(report,null,2)); }
