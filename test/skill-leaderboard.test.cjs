const {test}=require('node:test');
const assert=require('node:assert/strict');
const {parseSkillsPage,createLeaderboard}=require('../src/main/extensions/skill-leaderboard.cjs');
const rows=[{source:'owner/repo',skillId:'example',name:'中文 [name] "quoted"',installs:12}];
const html=list=>'<script>self.__next_f.push('+JSON.stringify([1,'4c:["x",{"initialSkills":'+JSON.stringify(list)+'}]'])+')</script>';
test('market parser decodes streamed Next payloads and JSON strings without evaluating scripts',()=>{
 assert.deepEqual(parseSkillsPage(html(rows)),rows);
 const payload='{"initialSkills":'+JSON.stringify(rows)+'}',split=payload.indexOf('initialSkills')+4;
 const chunks=[payload.slice(0,split),payload.slice(split)].map(s=>'<script>self.__next_f.push('+JSON.stringify([1,s])+')</script>').join('');
 assert.deepEqual(parseSkillsPage(chunks),rows);assert.deepEqual(parseSkillsPage(html([])),[]);
 assert.equal(parseSkillsPage(html([{source:'open.feishu.cn',skillId:'lark-doc',name:'飞书文档'}])).length,1);
 for(const value of ['<html>login</html>',html([{source:42,skillId:'bad',name:'bad'}]),'{"initialSkills":['])assert.throws(()=>parseSkillsPage(value),{code:'MARKET_FORMAT'});
});
test('failed refresh exposes its cause and retains last successful list; forced retries bypass cache',async()=>{
 let timestamp=100,calls=0,mode='ok';
 const load=createLeaderboard({now:()=>timestamp,fetchPage:async()=>{calls++;if(mode==='dns')throw Object.assign(new Error('SECRET TOKEN'),{cause:{code:'ENOTFOUND'}});return new Response(mode==='format'?'<html>changed</html>':html(rows),{status:mode==='http'?503:200});}});
 assert.equal((await load()).data.length,1);await load();assert.equal(calls,1);
 mode='dns';const fail=await load({force:true});assert.equal(fail.success,false);assert.equal(fail.errorCode,'MARKET_DNS');assert.equal(fail.stale,true);assert.deepEqual(fail.data,rows);assert.doesNotMatch(fail.error,/SECRET/);
 mode='format';assert.equal((await load({force:true})).errorCode,'MARKET_FORMAT');mode='http';assert.match((await load({force:true})).error,/503/);
 mode='ok';timestamp=300;const recovered=await load({force:true});assert.equal(recovered.success,true);assert.equal(recovered.stale,false);assert.equal(recovered.fetchedAt,300);
});
test('first failure is an explicit failure with no false successful empty list',async()=>{
 const timeout=createLeaderboard({fetchPage:async()=>{throw Object.assign(new Error(),{name:'TimeoutError'});}});
 assert.deepEqual(await timeout(),{success:false,errorCode:'MARKET_TIMEOUT',error:'社区市场连接超时，请检查网络或代理后重试。',data:[],fetchedAt:null,stale:false});
 const huge=createLeaderboard({fetchPage:async()=>new Response('x'.repeat(5*1024*1024+1))});assert.equal((await huge()).errorCode,'MARKET_FORMAT');
});
