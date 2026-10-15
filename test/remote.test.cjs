'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { createRemoteServer } = require('../remote/server/app.cjs');
const { DeviceAgent } = require('../src/main/extensions/remote/device-agent.cjs');
const { createAdapter } = require('../src/main/extensions/remote-bridge.cjs');
const { validateCommand, serverUrl, plainMessages } = require('../src/shared/remote/protocol.cjs');
const temporary = () => fs.mkdtempSync(path.join(os.tmpdir(), 'shineai-remote-'));
const command = (type, fields = {}) => ({ version:1, id:crypto.randomUUID(), expiresAt:Date.now() + 10000, type, ...fields });
const until = async check => { const deadline = Date.now() + 5000; while (!await check()) { assert.ok(Date.now() < deadline, 'Timed out'); await new Promise(r => setTimeout(r, 25)); } };

test('remote protocol restricts transport, commands, deadlines and the shared message shape', () => {
  assert.equal(serverUrl('https://example.test/'), 'https://example.test');
  for (const url of ['http://example.test','https://user:secret@example.test','https://example.test/?token=x','file:///tmp/x']) assert.throws(() => serverUrl(url));
  for (const input of [command('pty.write'), command('session.message', { sessionId:'s',text:' ' }), command('sessions.list', {expiresAt:Date.now()-1}), command('sessions.list', {id:'__proto__'})]) assert.throws(() => validateCommand(input));
  const messages = plainMessages([{id:'1',role:'assistant',content:[{type:'text',text:'hello'},{type:'tool_use',input:{apiKey:'do-not-forward'}}], apiKey:'do-not-forward'}]);
  assert.equal(messages[0].text, 'hello'); assert.ok(!JSON.stringify(messages).includes('do-not-forward'));
});

test('desktop adapter gates every operation by the local switch and exact session selection', async () => {
  let access = { enabled:true,sessionIds:['allowed'] }, sent = 0, stopped = 0;
  const sessions = [{id:'allowed',name:'Allowed',status:'waiting_input',config:{apiKey:'secret'}},{id:'private',name:'Private',config:{}}];
  const runtime = { sessionManagerV2:{getAllSessions:()=>sessions,getSession:id=>sessions.find(s=>s.id===id),getConversation:()=>[],sendMessage:async()=>{sent++;return 'queued';},abortSession:async()=>{stopped++;}},database:{getConversationMessagesPaged:()=>({messages:[]})} };
  const execute = createAdapter(() => runtime, () => access);
  assert.deepEqual((await execute(command('sessions.list'))).sessions.map(s=>s.id), ['allowed']);
  assert.ok(!JSON.stringify(await execute(command('session.read',{sessionId:'allowed'}))).includes('secret'));
  for (const type of ['session.read','session.message','session.stop']) await assert.rejects(execute(command(type,{sessionId:'private',text:'hello'})), /NOT_SHARED/);
  await execute(command('session.message',{sessionId:'allowed',text:'hello'})); await execute(command('session.stop',{sessionId:'allowed'}));
  assert.equal(sent,1); assert.equal(stopped,1);
  access = {enabled:false,sessionIds:['allowed']}; await assert.rejects(execute(command('session.message',{sessionId:'allowed',text:'hello'})), /REMOTE_DISABLED/);
});

test('device receipts prevent duplicate mutations across retries and process restart, and survive unknown outcomes', async () => {
  const directory = temporary(), journalFile = path.join(directory,'receipts.json'); let calls = 0;
  const options = {url:'http://127.0.0.1:7940',token:'fixture',journalFile,execute:async()=>{calls++; await new Promise(r=>setTimeout(r,20));return {accepted:true};}};
  const agent = new DeviceAgent(options); agent.running = true;
  const input = command('session.message',{sessionId:'allowed',text:'hello'});
  await Promise.all([agent.dispatch(input),agent.dispatch(input)]); assert.equal(calls,1);
  const restarted = new DeviceAgent(options); restarted.running = true;
  await restarted.dispatch(input); assert.equal(calls,1);
  await assert.rejects(restarted.dispatch({...input,text:'different'}),/COMMAND_ID_CONFLICT/);
  const uncertain = command('session.message',{sessionId:'allowed',text:'unknown'});
  restarted.journal[uncertain.id] = { hash:require('../src/shared/remote/protocol.cjs').fingerprint(uncertain),state:'accepted',createdAt:Date.now() }; restarted.saveJournal();
  const afterCrash = new DeviceAgent(options); afterCrash.running = true;
  await assert.rejects(afterCrash.dispatch(uncertain), /COMMAND_OUTCOME_UNKNOWN/); assert.equal(calls,1);
});

test('a stop request is handled while a message dispatch is still pending', async () => {
  let release, started = false;
  const blocked = new Promise(resolve => { release = resolve; });
  const agent = new DeviceAgent({url:'http://127.0.0.1:7940',token:'fixture',journalFile:path.join(temporary(),'receipts.json'),execute:async c=>{
    if(c.type==='session.message'){started=true;await blocked;return {accepted:true};}
    return {stopped:true};
  }});agent.running=true;
  const pending = agent.dispatch(command('session.message',{sessionId:'allowed',text:'hold'}));
  await until(()=>started);
  assert.deepEqual(await agent.dispatch(command('session.stop',{sessionId:'allowed'})),{stopped:true});
  release();await pending;
});

test('offline password reset revokes existing phones and device credentials while retaining the owner', async () => {
  const { Store, digest } = require('../remote/server/store.cjs');
  const { resetPassword } = require('../remote/server/admin.cjs');
  const directory = temporary(), store = await Store.open(directory,'owner','fixture-password-old');
  const login = await store.login('owner','fixture-password-old');
  store.state.devices.push({id:'device',tokenHash:digest('device-fixture')});store.save();
  await resetPassword(directory,'fixture-password-new');
  const restored = await Store.open(directory);
  assert.equal(restored.session(login.token),undefined);assert.equal(restored.device('device-fixture'),undefined);
  assert.equal(await restored.login('owner','fixture-password-old'),null);
  assert.ok(await restored.login('owner','fixture-password-new'));
});

test('HTTP and WebSocket relay verify login, CSRF, one-use pairing, device auth, replay and revocation', async t => {
  const directory = temporary();
  const remote = await createRemoteServer({directory,publicUrl:'http://127.0.0.1:7940',username:'owner',password:'fixture-password-12345',heartbeatMs:1000});
  await new Promise(r=>remote.server.listen(0,'127.0.0.1',r));
  const base = 'http://127.0.0.1:' + remote.server.address().port, origin = 'http://127.0.0.1:7940';
  let cookie='',csrf='',agent;
  t.after(async()=>{agent?.stop();await remote.close();});
  const request = async (route,method='GET',input,extra={}) => {
    const response = await fetch(base+route,{method,headers:{'Content-Type':'application/json',Origin:origin,...(cookie?{Cookie:cookie,'X-ShineAI-CSRF':csrf}:{}),...extra},...(input!==undefined?{body:JSON.stringify(input)}:{})});
    return {status:response.status,body:await response.json(),headers:response.headers};
  };
  assert.equal((await request('/api/devices')).status,401);
  assert.equal((await request('/api/login','POST',{username:'owner',password:'fixture-password-12345'},{Origin:'https://evil.test'})).status,403);
  assert.equal((await request('/api/login','POST',{username:'owner',password:'wrong'})).status,401);
  const login = await request('/api/login','POST',{username:'owner',password:'fixture-password-12345'});
  assert.equal(login.status,200); assert.match(login.headers.get('set-cookie'),/HttpOnly; SameSite=Strict/);
  cookie = login.headers.get('set-cookie').split(';')[0]; csrf = login.body.csrf;
  assert.equal((await request('/api/pairing','POST',{}, {'X-ShineAI-CSRF':'invalid'})).status,403);
  const ticket = await request('/api/pairing','POST',{});
  const paired = await request('/api/device/pair','POST',{code:ticket.body.code,name:'Test PC'});
  assert.equal(paired.status,200);
  assert.equal((await request('/api/device/pair','POST',{code:ticket.body.code,name:'Test PC'})).status,401);
  const prefix = `/api/devices/${paired.body.deviceId}/sessions`;
  assert.equal((await request(prefix)).body.error,'DEVICE_OFFLINE');
  let sends=0,stops=0;
  agent = new DeviceAgent({url:base,token:paired.body.deviceToken,journalFile:path.join(directory,'receipts.json'),reconnectMs:30,execute:async c=>{
    if(c.type==='sessions.list')return {sessions:[{id:'allowed',name:'Conversation',status:'idle'}]};
    if(c.sessionId!=='allowed')throw new (require('../src/shared/remote/protocol.cjs').RemoteError)('NOT_SHARED');
    if(c.type==='session.message'){sends++;return {accepted:true};}
    if(c.type==='session.stop'){stops++;return {stopped:true};}
    return {session:{id:'allowed'},messages:[]};
  }}); agent.start();
  await until(async()=> (await request('/api/devices')).body.devices[0].online);
  assert.equal((await request(prefix)).body.result.sessions[0].id,'allowed');
  assert.equal((await request(prefix+'/private')).body.error,'NOT_SHARED');
  const commandId=crypto.randomUUID(), payload={commandId,text:'hello'};
  assert.equal((await request(prefix+'/allowed/messages','POST',payload)).status,200);
  assert.equal((await request(prefix+'/allowed/messages','POST',payload)).status,200); assert.equal(sends,1);
  assert.equal((await request(prefix+'/allowed/messages','POST',{...payload,text:'different'})).body.error,'COMMAND_ID_CONFLICT');
  assert.equal((await request(prefix+'/allowed/messages','POST',{commandId:crypto.randomUUID(),text:'中'.repeat(16000)})).status,200);
  assert.equal(sends,2);
  assert.equal((await request(prefix+'/allowed/stop','POST',{commandId:crypto.randomUUID()})).status,200); assert.equal(stops,1);
  const stored = fs.readFileSync(path.join(directory,'state.json'),'utf8');
  assert.ok(!stored.includes(paired.body.deviceToken)); assert.ok(!stored.includes('fixture-password-12345')); assert.ok(!stored.includes(login.headers.get('set-cookie').split('=')[1].split(';')[0]));
  assert.equal((await request(`/api/devices/${paired.body.deviceId}`,'DELETE')).status,200);
  await until(()=>!agent.running);
  assert.equal((await request(prefix)).status,404);
  assert.equal((await request('/api/device/unpair','POST',{}, {Authorization:'Bearer '+paired.body.deviceToken})).status,401);
  await request('/api/logout','POST',{}); assert.equal((await request('/api/me')).status,401);
});
