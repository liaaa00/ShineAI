const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createInputFocusBridge}=require('../src/main/extensions/browser-input-focus.cjs');
const input=id=>JSON.stringify({id,method:'Input.dispatchMouseEvent',params:{type:'mousePressed'}});
function fixture(){const sent=[],replies=[];return {sent,replies,bridge:createInputFocusBridge({send:(data,options)=>sent.push({data:JSON.parse(String(data)),options}),reply:data=>replies.push(JSON.parse(data))})};}
test('focus preparation waits for acknowledgement and preserves input/release/read order',()=>{
 const {sent,replies,bridge}=fixture();
 assert.equal(bridge.forward(input(1),false),true);assert.equal(sent[0].data.method,'Emulation.setFocusEmulationEnabled');
 assert.ok(Number.isInteger(sent[0].data.id)&&sent[0].data.id>0&&sent[0].data.id<=2147483647);
 assert.equal(bridge.forward(input(2),false),true);assert.equal(bridge.forward(JSON.stringify({id:3,method:'Runtime.evaluate'}),false),true);assert.equal(sent.length,1);
 assert.equal(bridge.receive(JSON.stringify({id:sent[0].data.id,result:{}}),false),true);
 assert.deepEqual(sent.slice(1).map(x=>x.data.id),[1,2,3]);assert.deepEqual(replies,[]);assert.equal(bridge.forward(input(4),false),false);bridge.close();
});

test('user takeover during preparation prevents queued input from being delivered',()=>{
 const sent=[],replies=[];let blocked=false;
 const bridge=createInputFocusBridge({send:data=>sent.push(JSON.parse(String(data))),reply:data=>replies.push(JSON.parse(data)),checkWrite:data=>({blocked,id:JSON.parse(String(data)).id,message:'User took over'})});
 bridge.forward(input(20),false);blocked=true;
 bridge.receive(JSON.stringify({id:sent[0].id,result:{}}),false);
 assert.equal(sent.length,1);assert.equal(replies[0].id,20);assert.match(replies[0].error.message,/took over/);bridge.close();
});

test('focus timeout reports failure instead of silently dropping the input',async()=>{
 const sent=[],replies=[];const bridge=createInputFocusBridge({send:data=>sent.push(JSON.parse(String(data))),reply:data=>replies.push(JSON.parse(data)),timeoutMs:10});
 bridge.forward(input(30),false);await new Promise(r=>setTimeout(r,30));
 assert.equal(sent.length,1);assert.equal(replies[0].id,30);assert.match(replies[0].error.message,/timed out/);bridge.close();
});
test('preparation errors fail queued requests without delivering input and permit retry',()=>{
 const {sent,replies,bridge}=fixture();bridge.forward(input(10),false);
 bridge.receive(JSON.stringify({id:sent[0].data.id,error:{message:'unsupported'}}),false);
 assert.equal(sent.length,1);assert.equal(replies[0].id,10);assert.match(replies[0].error.message,/unsupported/);
 bridge.forward(input(11),false);assert.equal(sent.length,2);bridge.close();
});
test('ordinary reads and binary frames do not prepare focus; closing drops queued input',()=>{
 const {sent,bridge}=fixture();assert.equal(bridge.forward(JSON.stringify({id:1,method:'Runtime.evaluate'}),false),false);assert.equal(bridge.forward(Buffer.from('x'),true),false);assert.equal(sent.length,0);
 bridge.forward(input(2),false);bridge.close();bridge.receive(JSON.stringify({id:sent[0].data.id,result:{}}),false);assert.equal(sent.length,1);
});
