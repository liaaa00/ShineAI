import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {root,openTestApp,completeOnboarding} from './electron-test-helper.mjs';
const executable=process.argv.find(s=>s.startsWith('--executable='))?.slice(13);
const dir=path.join(root,'artifacts/usability-fix');fs.mkdirSync(dir,{recursive:true});
const data=path.join(root,'.test-data','usability-fix-'+Date.now());fs.mkdirSync(data,{recursive:true});
const legacy=JSON.parse(fs.readFileSync(path.join(root,'test/fixtures/builtin-skills-legacy.json'),'utf8'));
const report={checks:{},errors:[],scope:'Isolated Electron profile; real forms and SQLite migration, local HTTP market fixture. No paid model requests.'};
const rows=[{source:'shineai-fixture/skills',skillId:'verification',name:'市场流程验证',installs:42}];
let marketStatus=503;
const server=http.createServer((_req,res)=>{res.statusCode=marketStatus;res.end(marketStatus===200?'<script>self.__next_f.push('+JSON.stringify([1,'{"initialSkills":'+JSON.stringify(rows)+'}'])+')</script>':'temporary unavailable');});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const url='http://127.0.0.1:'+server.address().port;
const backups=[];let app,page;
async function open(){({app,page}=await openTestApp(data,{auth:19673,meeting:18473},executable));page.on('pageerror',e=>report.errors.push(e.message));}
async function settings(){await page.getByRole('button',{name:'设置',exact:true}).click();}
async function textSnapshot(name){await page.screenshot({path:path.join(dir,name+'.png')});fs.writeFileSync(path.join(dir,name+'.txt'),await page.locator('body').innerText());}
try{
 for(const scheme of ['shineai-dev','claudeops-dev']){const key='HKCU\\Software\\Classes\\'+scheme,file=path.join(dir,scheme+'.reg');try{execFileSync('reg.exe',['export',key,file,'/y'],{stdio:'ignore',windowsHide:true});backups.push({key,file});}catch{backups.push({key});}}
 await open();await completeOnboarding(page);
 const fresh=await page.evaluate(async()=> (await window.shineAI.skill.getAll()).data.filter(s=>s.source==='builtin'));
 assert.equal(fresh.find(s=>s.slashCommand==='translate').name,'内容翻译');assert.match(fresh.find(s=>s.slashCommand==='explain').promptTemplate,/请解释/);
 report.checks.newProfilesHaveCorrectBuiltinDefinitions=true;
 // Put actual legacy records back through the application's persistence API.
 await page.evaluate(async legacy=>{
   for(const s of legacy){const {isEnabled,isInstalled,...fields}=s;await window.shineAI.skill.update(s.id,fields);}
   await window.shineAI.skill.update('builtin-translate',{promptTemplate:'USER_PRESERVED {{user_input}}',isEnabled:false});
   await window.shineAI.skill.create({id:'custom-usability-fixture',name:'保留自建技能',slashCommand:'preserve-custom',promptTemplate:'CUSTOM_PRESERVED',source:'custom',type:'prompt',compatibleProviders:'all',isInstalled:true,isEnabled:true});
 },legacy);
 await app.close();app=null;await open();
 const migrated=await page.evaluate(async()=> (await window.shineAI.skill.getAll()).data);
 assert.equal(migrated.find(s=>s.id==='builtin-write-test').inputVariables[0].description,'测试框架');
 const translate=migrated.find(s=>s.id==='builtin-translate');assert.equal(translate.name,'内容翻译');assert.equal(translate.promptTemplate,'USER_PRESERVED {{user_input}}');assert.equal(translate.isEnabled,false);
 assert.equal(migrated.find(s=>s.id==='custom-usability-fixture').promptTemplate,'CUSTOM_PRESERVED');
 report.checks.actualSqliteMigrationPreservesCustomContentAndState=true;
 // The renderer must show the selected repository path, including when rootPath differs.
 const repo=path.join(data,'selected-project','primary-repo');fs.mkdirSync(repo,{recursive:true});execFileSync('git',['init',repo],{stdio:'ignore',windowsHide:true});
 const ws=await page.evaluate(({rootPath,repo})=>window.shineAI.workspace.create({name:'界面验证项目',rootPath,repos:[{repoPath:repo,name:'primary-repo',isPrimary:true}]}),{rootPath:path.dirname(repo),repo});assert.equal(ws.success,true);
 await page.reload();await page.getByTestId('working-directory-summary').waitFor();
 assert.match(await page.getByTestId('working-directory-summary').innerText(),/按任务名创建子目录/);
 await page.getByTestId('workspace-picker').click();
 await page.getByText('界面验证项目',{exact:true}).click();
 await page.waitForFunction(repo=>document.querySelector('[data-testid="working-directory-summary"]')?.textContent.includes(repo),repo);
 assert.equal(await page.getByTestId('working-directory-summary').getAttribute('title'),'工作目录：'+repo);
 await textSnapshot('directory-selected');
 report.checks.directoryShowsActualPrimaryRepositoryAndExplainsAutomaticFolders=true;
 await settings();await page.getByText('全部设置',{exact:true}).click();await page.getByRole('button',{name:'AI 模型',exact:true}).click();
 const guide=await page.getByTestId('provider-setup-guide').innerText();assert.doesNotMatch(guide,/赠送额度|接入向导/);assert.match(guide,/测试连接/);
 await page.getByRole('button',{name:'接入服务',exact:true}).click();
 await page.getByLabel('接入方式',{exact:true}).selectOption('claude-sdk');
 assert.equal(await page.getByLabel('接入方式',{exact:true}).inputValue(),'claude-sdk');await textSnapshot('provider-claude');
 await page.getByLabel('接入方式',{exact:true}).selectOption('codex-appserver');assert.equal(await page.getByLabel('接入方式',{exact:true}).inputValue(),'codex-appserver');
 await page.getByLabel('接入方式',{exact:true}).selectOption('openai-api');await textSnapshot('provider-openai');
 await page.getByRole('button',{name:'取消',exact:true}).click();
 report.checks.providerGuideAndVisibleProtocolChoicesUseRealForm=true;
 await page.getByRole('button',{name:'能力',exact:true}).click();await page.getByRole('button',{name:'技能',exact:true}).click();
 await page.getByPlaceholder('搜索技能名称、描述、命令...').fill('write-test');await page.getByText('编写测试',{exact:true}).waitFor();await textSnapshot('skill-repaired');
 await app.evaluate((_electron,url)=>{const original=globalThis.fetch;globalThis.fetch=(input,options)=>original(input==='https://skills.sh/'?url:input,options);},url);
 await page.getByRole('button',{name:/技能市场/}).click();await page.getByRole('button',{name:/skills.sh 社区/}).click();
 await page.getByRole('alert').filter({hasText:'HTTP 503'}).waitFor();assert.equal(await page.getByText('没有匹配的技能',{exact:true}).count(),0);await textSnapshot('market-first-failure');
 marketStatus=200;await page.getByRole('button',{name:'重试',exact:true}).click();await page.getByText('市场流程验证',{exact:true}).waitFor();assert.equal(await page.getByRole('alert').count(),0);
 marketStatus=503;await page.getByRole('button',{name:'刷新',exact:true}).click();await page.getByRole('alert').filter({hasText:'HTTP 503'}).waitFor();await page.getByRole('status').filter({hasText:'缓存'}).waitFor();assert.equal(await page.getByText('市场流程验证',{exact:true}).isVisible(),true);await textSnapshot('market-cached-failure');
 marketStatus=200;await page.getByRole('button',{name:'重试',exact:true}).click();await page.waitForFunction(()=>!document.querySelector('[role="alert"]'));assert.equal(await page.getByText('市场流程验证',{exact:true}).isVisible(),true);
 await page.getByPlaceholder('搜索技能名称或仓库...').fill('not-present');await page.getByText('没有匹配的技能',{exact:true}).waitFor();
 report.checks.marketFailureRetryCacheRecoveryAndNoSearchResultsAreDistinct=true;
 await app.close();app=null;await open();
 const saved=await page.evaluate(()=>window.shineAI.skill.get('builtin-translate'));assert.equal(saved.data.promptTemplate,'USER_PRESERVED {{user_input}}');assert.equal(saved.data.isEnabled,false);
 await page.waitForFunction(()=>document.querySelector('[data-testid="working-directory-summary"]')?.textContent.includes('primary-repo'));
 report.checks.restartKeepsRepairedSkillsAndSelectedDirectory=true;
 assert.deepEqual(report.errors,[]);
}catch(error){report.errors.push(error.stack);process.exitCode=1;if(page&&!page.isClosed())await textSnapshot('failure').catch(()=>{});}
finally{
 if(app)await app.close();server.closeAllConnections();await new Promise(r=>server.close(r));
 for(const {key,file}of backups){try{execFileSync('reg.exe',['delete',key,'/f'],{stdio:'ignore',windowsHide:true});}catch{}if(file)execFileSync('reg.exe',['import',file],{stdio:'ignore',windowsHide:true});}
 fs.writeFileSync(path.join(dir,executable?'installed-report.json':'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}
