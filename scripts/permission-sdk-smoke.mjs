import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {root} from './electron-test-helper.mjs';
const require=createRequire(path.join(root,'package.json'));
const {query}=await import(pathToFileURL(require.resolve('@anthropic-ai/claude-agent-sdk')).href);
const {permissionHook}=require('./src/main/extensions/execution-policy.cjs');
const directory=path.join(root,'.test-data','permission-sdk-'+Date.now());fs.mkdirSync(directory,{recursive:true});
const report={checks:{},errors:[],scope:'Real bundled Claude SDK and CLI against a loopback model fixture. PreToolUse policy must override allowedTools and prevent/allow an actual temporary Write. No external model requests.'};
let mode='manual',calls=0;
const target=()=>path.join(directory,mode+'.txt');
const server=http.createServer((req,res)=>{let body='';req.on('data',b=>body+=b);req.on('end',()=>{
 const input=JSON.parse(body||'{}');
 if(req.url.includes('count_tokens')){res.setHeader('content-type','application/json');res.end('{"input_tokens":100}');return;}
 if(!input.stream){res.setHeader('content-type','application/json');res.end(JSON.stringify({id:'aux',type:'message',role:'assistant',model:input.model,content:[{type:'text',text:'Local fixture'}],stop_reason:'end_turn',usage:{input_tokens:10,output_tokens:5}}));return;}
 const toolResult=input.messages?.some(m=>Array.isArray(m.content)&&m.content.some(b=>b.type==='tool_result'));
 res.writeHead(200,{'content-type':'text/event-stream'});
 const send=value=>res.write('event: '+value.type+'\ndata: '+JSON.stringify(value)+'\n\n');
 send({type:'message_start',message:{id:'local-'+Date.now(),type:'message',role:'assistant',model:input.model,content:[],stop_reason:null,stop_sequence:null,usage:{input_tokens:100,output_tokens:0}}});
 if(!toolResult){
  send({type:'content_block_start',index:0,content_block:{type:'tool_use',id:'tool-write-'+mode,name:'Write',input:{}}});
  send({type:'content_block_delta',index:0,delta:{type:'input_json_delta',partial_json:JSON.stringify({file_path:target(),content:'SDK_PERMISSION_'+mode})}});
 } else {
  send({type:'content_block_start',index:0,content_block:{type:'text',text:''}});
  send({type:'content_block_delta',index:0,delta:{type:'text_delta',text:'SDK_PERMISSION_DONE'}});
 }
 send({type:'content_block_stop',index:0});send({type:'message_delta',delta:{stop_reason:toolResult?'end_turn':'tool_use',stop_sequence:null},usage:{output_tokens:20}});send({type:'message_stop'});res.end();
 });});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const url='http://127.0.0.1:'+server.address().port;
try {
 for(mode of ['manual','full_auto']) {
  calls=0;const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),90000);
  const adapter={createPermissionHandler:()=>async()=>{calls++;return {behavior:mode==='manual'?'deny':'allow',message:'Local permission fixture'};}};
  let success=false;
  try {
   const stream=query({prompt:'Run the requested local Write once, then finish.',options:{stderr:chunk=>fs.appendFileSync(path.join(root,'artifacts/codex-experience/permission-sdk-stderr.txt'),chunk),cwd:directory,model:'claude-opus-5-5',executable:process.execPath,pathToClaudeCodeExecutable:path.join(root,'scripts/fixtures/claude-capture/cli.js'),abortController:controller,maxTurns:3,permissionMode:'default',allowedTools:['Write'],canUseTool:async(_name,input)=>({behavior:'allow',updatedInput:input}),hooks:{PreToolUse:[permissionHook(adapter,'local',{permissionMode:mode,autoAccept:mode==='full_auto'})]},env:{...process.env,SHINEAI_CLAUDE_CAPTURE_URL:url,SHINEAI_CLAUDE_CAPTURE_DIR:path.join(directory,'config-'+mode),ANTHROPIC_BASE_URL:url,ANTHROPIC_API_KEY:'local-test-only',CLAUDE_CONFIG_DIR:path.join(directory,'config-'+mode),CLAUDE_CODE_GIT_BASH_PATH:path.join(root,'resources/git-bash/bin/bash.exe'),CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC:'1',DISABLE_TELEMETRY:'1',DISABLE_ERROR_REPORTING:'1'}}});
   for await(const message of stream)if(message.type==='result') {assert.equal(message.is_error,false,JSON.stringify(message));success=true;}
  } finally {clearTimeout(timeout);}
  assert.equal(success,true);assert.ok(calls>0,'SDK must invoke PreToolUse before preapproved Write');
  assert.equal(fs.existsSync(target()),mode==='full_auto');
  if(mode==='full_auto')assert.equal(fs.readFileSync(target(),'utf8'),'SDK_PERMISSION_full_auto');
  report.checks[mode==='manual'?'manualDeniesPreapprovedWrite':'fullAutoAllowsRealWrite']=true;
 }
} catch(error) {report.errors.push(error.stack);process.exitCode=1;}
finally {server.closeAllConnections();await new Promise(r=>server.close(r));fs.writeFileSync(path.join(root,'artifacts/codex-experience/permission-sdk-report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));}
