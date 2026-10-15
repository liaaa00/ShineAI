import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import net from 'node:net';
import assert from 'node:assert/strict';
import { root, openTestApp, completeOnboarding } from './electron-test-helper.mjs';
const ports = { auth:19314, meeting:18084 };
const report = { date: new Date().toISOString(), checks:{}, errors:[] };
const server = http.createServer((_request,response) => { response.setHeader('Access-Control-Allow-Origin','*'); response.end('CUSTOM_PROVIDER_REACHABLE'); });
await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
let app, page;
function portClosed(port) {
  return new Promise(resolve => {
    const socket=net.connect({host:'127.0.0.1',port});
    socket.on('connect',()=>{socket.destroy();resolve(false);});
    socket.on('error',()=>resolve(true));
    socket.setTimeout(3000,()=>{socket.destroy();resolve(false);});
  });
}
try {
  ({app,page}=await openTestApp(path.join(root,'.test-data','cloud-'+Date.now()),ports));
  page.on('pageerror',error=>report.errors.push(error.message));
  await completeOnboarding(page);
  await page.locator('[data-local-identity]').waitFor();
  report.checks.localIdentityHasNoLoginButton=await page.locator('[data-local-identity]').getByRole('button').count()===0;
  const disabled=await page.evaluate(async()=>({
    org:await window.shineAI.org.driveUpload({}),
    login:await window.shineAI.auth.loginWithEmail('unused@example.invalid','unused'),
    publish:await window.shineAI.session.publishHtml({title:'test',html:'test'}),
  }));
  report.checks.cloudActionsReturnRemoved=Object.values(disabled).every(result=>result.errorCode==='OFFICIAL_CLOUD_REMOVED');
  report.checks.mainOfficialRequestBlocked=await app.evaluate(async()=>{try {await globalThis.fetch('https://api.spectraidev.cloud/api');return false;} catch(error) {return error.code==='OFFICIAL_CLOUD_REMOVED';}});
  report.checks.rendererOfficialRequestBlocked=await page.evaluate(async()=>{try {await fetch('https://api.spectraidev.cloud/api');return false;} catch {return true;}});
  const customUrl=`http://127.0.0.1:${server.address().port}/`;
  report.checks.mainCustomProviderAllowed=await app.evaluate(async(_electron,url)=>(await (await fetch(url)).text())==='CUSTOM_PROVIDER_REACHABLE',customUrl);
  report.checks.rendererCustomProviderAllowed=await page.evaluate(async url=>(await (await fetch(url)).text())==='CUSTOM_PROVIDER_REACHABLE',customUrl);
  report.checks.cloudServersNotListening=await portClosed(ports.auth)&&await portClosed(ports.meeting);
  await page.getByRole('button',{name:'设置',exact:true}).click();
  await page.getByText('全部设置',{exact:true}).click();
  const body=await page.locator('body').innerText();
  report.checks.noCloudSettingsButtons=await page.getByRole('button',{name:/^(账号|会员|订阅|推广|云中继|我的设备|意见反馈|检查更新)$/}).count()===0;
  report.checks.localEditionLabel=body.includes('ShineAI 本地开发版')&&!body.includes('ShineAI Pro');
  await page.screenshot({path:path.join(root,'artifacts/local-settings.png')});
  assert.ok(Object.values(report.checks).every(Boolean),JSON.stringify(report.checks));
  assert.equal(report.errors.length,0,report.errors.join(';'));
} catch(error) { report.errors.push(error.message);process.exitCode=1; }
finally {
  if(app)await app.close();
  await new Promise(resolve=>server.close(resolve));
  fs.writeFileSync(path.join(root,'artifacts/cloud-smoke-report.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));
}
