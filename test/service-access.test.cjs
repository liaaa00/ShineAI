'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {protectHttp,verifyMeetingSocket,registerServiceAccess}=require('../src/main/security/service-access.cjs');
let access;
registerServiceAccess({handle(_channel,handler){access=handler();}},{localAuthPort:19211,meetingPort:17981});
function response(){return{status:null,ended:false,setHeader(){},writeHead(code){this.status=code;},end(){this.ended=true;}};}
test('local service capability is required even on loopback and leaked tokens reject remote origins',()=>{
 for(const kind of ['localAuth','meeting']){
  const url=kind==='localAuth'?'/auth/token':'/meeting/state';
  const header=kind==='localAuth'?'x-shineai-local-capability':'x-shineai-meeting-capability';
  let r=response();assert.equal(protectHttp(kind,{url,method:'GET',headers:{}},r),false);assert.equal(r.status,403);
  r=response();assert.equal(protectHttp(kind,{url,method:'GET',headers:{[header]:access[kind].capability}},r),true);
  r=response();assert.equal(protectHttp(kind,{url,method:'GET',headers:{[header]:access[kind].capability,origin:'https://example.com'}},r),false);
 }
});
test('OAuth callback and public health remain accessible while websocket requires a capability',()=>{
 assert.equal(protectHttp('localAuth',{url:'/auth/oauth/callback?code=example',headers:{},method:'GET'},response()),true);
 assert.equal(protectHttp('meeting',{url:'/health',headers:{},method:'GET'},response()),true);
 assert.equal(verifyMeetingSocket({req:{url:'/meeting/events',headers:{}},origin:''}),false);
 assert.equal(verifyMeetingSocket({req:{url:'/meeting/events?capability='+access.meeting.capability,headers:{}},origin:''}),true);
});
