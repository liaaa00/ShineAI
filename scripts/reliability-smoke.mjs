import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {root,openTestApp,completeOnboarding} from './electron-test-helper.mjs';

const executable=process.argv.find(arg=>arg.startsWith('--executable='))?.slice('--executable='.length);
const dataDir=path.join(root,'.test-data','reliability-'+Date.now());
const report={date:new Date().toISOString(),executable:executable||'project Electron',checks:{},errors:[]};
const catalog=[];
const server=http.createServer(async(req,res)=>{
  if(req.url==='/registry.json'){res.setHeader('content-type','application/json');return res.end(JSON.stringify({skills:catalog,mcps:[]}));}
  if(req.url==='/missing.md'){res.writeHead(404);return res.end('missing');}
  if(req.url==='/html.md'){res.setHeader('content-type','text/html');return res.end('<!doctype html><html>Proxy login</html>');}
  if(req.url==='/good.md')return res.end('---\nname: downloaded-skill\ndescription: A verification skill\n---\n\nREAL_DOWNLOADED_BODY {{user_input}}');
  let body='';for await(const chunk of req)body+=chunk;
  const payload=JSON.parse(body||'{}');
  res.setHeader('content-type','application/json');
  const model=payload.model || (/models\/([^:]+)/.exec(req.url)?.[1]);
  if(model==='invalid-body')return res.end('{"error":{"message":"Local test model error"}}');
  if(model==='html-body')return res.end('<html>Gateway login</html>');
  if(req.url.endsWith('/messages'))return res.end(JSON.stringify({type:'message',model,content:[{type:'text',text:'Hi'}]}));
  if(req.url.includes(':generateContent'))return res.end(JSON.stringify({candidates:[{content:{parts:[{text:'Hi'}]}}]}));
  if(req.url.endsWith('/responses'))return res.end(JSON.stringify({model,output:[{type:'message',content:[{type:'output_text',text:'Hi'}]}]}));
  res.end(JSON.stringify({model,choices:[{message:{content:'Hi'}}]}));
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port;
catalog.push(...['missing','html','good'].map(name=>({id:'verify-'+name,name:'Verify '+name,contentUrl:origin+'/'+name+'.md',slashCommand:'verify-'+name,source:'official'})));
let app,page;
try{
  ({app,page}=await openTestApp(dataDir,{auth:19422,meeting:18192},executable));
  page.on('pageerror',error=>report.errors.push(error.message));
  await completeOnboarding(page);
  await page.evaluate(url=>window.shineAI.settings.update('registry_url',url),origin+'/registry.json');
  await page.evaluate(()=>window.shineAI.registry.forceRefresh());
  await page.getByRole('button',{name:'设置',exact:true}).click();
  await page.getByText('全部设置',{exact:true}).click();
  await page.getByRole('button',{name:'能力',exact:true}).click();
  await page.getByRole('button',{name:'技能',exact:true}).click();
  await page.getByRole('button',{name:/技能市场/}).click();
  await page.getByPlaceholder('搜索技能...').fill('Verify missing');
  await page.getByRole('button',{name:'安装',exact:true}).click();
  await page.getByText(/技能文件不存在/).waitFor();
  assert.equal((await page.evaluate(()=>window.shineAI.skill.get('verify-missing'))).success,false);
  report.checks.uiFailedDownloadCreatesNoEmptySkill=true;
  const html=await page.evaluate(item=>window.shineAI.registry.installFromRegistry(item),catalog[1]);
  assert.equal(html.success,false);assert.match(html.error,/网页/);
  const good=await page.evaluate(item=>window.shineAI.registry.installFromRegistry(item),catalog[2]);
  assert.equal(good.success,true,good.error);assert.ok(good.skill.promptTemplate.includes('REAL_DOWNLOADED_BODY'));
  const duplicate=await page.evaluate(item=>window.shineAI.registry.installFromRegistry(item),catalog[2]);
  assert.equal(duplicate.success,true,duplicate.error);
  report.checks.htmlRejectedAndValidRegistryInstallPersists=true;
  const broken=await page.evaluate(()=>window.shineAI.mcp.create({id:'verify-invalid-mcp',name:'Invalid MCP',transport:'stdio',isGlobalEnabled:false,installMethod:'manual',compatibleProviders:'all'}));
  assert.equal(broken.success,false);assert.match(broken.error,/配置不完整/);
  for(const action of ['update','toggle']) {
    const result=await page.evaluate(action=>window.shineAI.mcp[action]('verify-nonexistent',action==='toggle'?true:{name:'Missing'}),action);
    assert.equal(result.success,false);assert.match(result.error,/不存在/);
  }
  const fixture=path.join(root,'scripts/fixtures/mcp-probe.cjs');
  const node=await app.evaluate(()=>process.execPath);
  const minimal=await page.evaluate(config=>window.shineAI.mcp.create(config),{id:'verify-minimal',name:'Minimal valid MCP',command:node,args:[fixture,'valid'],envVars:{ELECTRON_RUN_AS_NODE:'1'}});
  assert.equal(minimal.success,true,minimal.error);assert.equal(minimal.data.source,'custom');
  assert.equal((await page.evaluate(()=>window.shineAI.mcp.get('verify-minimal'))).success,true);
  report.checks.minimalMcpDefaultsPersist=true;
  for(const mode of ['valid','bad-init','bad-tools']){
    const added=await page.evaluate(item=>window.shineAI.registry.installMcp(item),{id:'verify-'+mode,name:'Verify '+mode,command:node,args:[fixture,mode],transport:'stdio',installMethod:'manual'});
    assert.equal(added.success,true,added.error);assert.equal(added.data.isGlobalEnabled,false);
    await page.evaluate(id=>window.shineAI.mcp.update(id,{envVars:{ELECTRON_RUN_AS_NODE:'1'}}),added.data.id);
    const tested=await page.evaluate(id=>window.shineAI.mcp.testConnection(id),added.data.id);
    assert.equal(tested.success,mode==='valid',tested.error);
  }
  const missingMcp=await page.evaluate(()=>window.shineAI.registry.installMcp({id:'verify-missing-config',name:'Missing configuration',installMethod:'manual'}));
  assert.equal(missingMcp.success,false);
  report.checks.mcpProtocolAndInvalidConfigurationChecks=true;
  report.checks.marketMcpStartsDisabled=true;
  for(const adapterType of ['openai-api','claude-sdk','gemini-core']){
    for(const model of ['valid-body','invalid-body','html-body']){
      const result=await page.evaluate(options=>window.shineAI.provider.testApi(options),{adapterType,apiBaseUrl:adapterType==='openai-api'?origin+'/v1':origin,apiKey:'local-fixture-only',model});
      assert.equal(result.success,model==='valid-body',adapterType+': '+result.message);
    }
  }
  report.checks.providerBodyValidationUsingLocalFixtures=true;
  const setting=await page.evaluate(()=>window.shineAI.settings.update('showStatusHints',false));
  assert.ok(setting?.success !== false);
  await page.screenshot({path:path.join(root,'artifacts',executable?'installed-reliability.png':'reliability.png')});
  await app.close();app=null;
  ({app,page}=await openTestApp(dataDir,{auth:19422,meeting:18192},executable));
  assert.equal((await page.evaluate(()=>window.shineAI.settings.getAll())).showStatusHints,false);
  assert.ok((await page.evaluate(()=>window.shineAI.skill.get('verify-good'))).data.promptTemplate.includes('REAL_DOWNLOADED_BODY'));
  report.checks.settingsAndSkillSurviveRestart=true;
  assert.equal(report.errors.length,0,report.errors.join(';'));
}catch(error){report.errors.push(error.stack);process.exitCode=1;}
finally{if(app)await app.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));fs.writeFileSync(path.join(root,'artifacts',executable?'installed-reliability-report.json':'reliability-report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));}
