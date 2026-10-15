import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {root,openTestApp,completeOnboarding} from './electron-test-helper.mjs';

// Exercise the actual embedded payload without invoking NSIS registration or
// overwriting the user's installed development edition and shortcuts.
const metadata=JSON.parse(fs.readFileSync(path.join(root,'artifacts/installer/package-report.json'),'utf8'));
const manifest=JSON.parse(fs.readFileSync(path.join(root,'artifacts/build-manifest.json'),'utf8'));
const testRoot=path.join(root,'.test-data','installer-payload-'+Date.now());
const install=path.join(testRoot,'application'),data=path.join(testRoot,'profile');
const report={date:new Date().toISOString(),installer:metadata.installer,install,checks:{},errors:[],scope:'Embedded payload extraction and application behavior; installer registration/uninstallation not rerun'};
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
async function run(exe,args,options={}) {
  await new Promise((resolve,reject)=>{
    const child=spawn(exe,args,{windowsHide:true,...options});let tail='';
    child.stdout.on('data',chunk=>{tail=(tail+chunk).slice(-3000);});
    child.stderr.on('data',chunk=>{tail=(tail+chunk).slice(-3000);});
    child.on('error',reject);child.on('close',code=>code===0?resolve():reject(new Error('Exit '+code+': '+tail)));
  });
}
let app,page;
const protocolBackups=[];
try {
  assert.equal(hash(metadata.installer),metadata.sha256);
  assert.equal(metadata.buildFingerprint,manifest.fingerprint);
  fs.mkdirSync(install,{recursive:true});
  // The app registers its own development URL schemes on launch even though
  // this test does not invoke NSIS. Preserve the current installed handlers.
  for(const scheme of ['shineai-dev','claudeops-dev']) {
    const key='HKCU\\Software\\Classes\\'+scheme,backup=path.join(testRoot,scheme+'.reg');
    try {await run('reg.exe',['export',key,backup,'/y']);protocolBackups.push({key,backup});}
    catch {protocolBackups.push({key,backup:null});}
  }
  console.log('Extracting the actual installer payload into an isolated directory…');
  await run(path.join(root,'.runtime/packaging/node_modules/7zip-bin/win/x64/7za.exe'),['x',metadata.installer,'-o'+install,'-y','-bd','-bb0']);
  let count=0;
  function countFiles(directory) {for(const entry of fs.readdirSync(directory,{withFileTypes:true})) {const target=path.join(directory,entry.name);if(entry.isDirectory())countFiles(target);else count++;}}
  countFiles(install);assert.equal(count,metadata.archiveFileEntries);
  const out=path.join(install,'resources/app/out');
  for(const entry of manifest.files)assert.equal(hash(path.join(out,entry.path)),entry.sha256,entry.path);
  report.checks.actualInstallerPayloadCompleteAndCurrent=true;
  console.log('Embedded payload file count and build hashes verified. Launching packaged application…');
  const executable=path.join(install,'ShineAI.exe');
  ({app,page}=await openTestApp(data,{auth:19432,meeting:18202},executable));
  page.on('pageerror',error=>report.errors.push(error.message));
  await completeOnboarding(page);
  const runtime=await page.evaluate(()=>window.development.getRuntimeInfo());
  assert.equal(runtime.release,JSON.parse(fs.readFileSync(path.join(root,'src/main/runtime/release.json'),'utf8')).release);assert.equal(runtime.abi,'149');assert.equal(runtime.userData,data);
  assert.equal(await app.evaluate(({app})=>app.isPackaged),true);
  assert.ok(await page.getByText(/全局外观版 7/).count());
  report.checks.extractedPackagedApplicationLaunches=true;
  await app.close();app=null;
  console.log('Packaged release and isolation verified. Checking local settings and connection validation…');
  await run(process.execPath,[path.join(root,'scripts/reliability-smoke.mjs'),'--executable='+executable],{cwd:root});
  report.reliability=JSON.parse(fs.readFileSync(path.join(root,'artifacts/installed-reliability-report.json'),'utf8'));
  assert.equal(report.reliability.errors.length,0);
  console.log('Checking local projects, files, Git and terminal…');
  await run(process.execPath,[path.join(root,'scripts/e2e.mjs'),'--local-only','--executable='+executable],{cwd:root});
  report.localE2e=JSON.parse(fs.readFileSync(path.join(root,'artifacts/installer-local-e2e-report.json'),'utf8'));
  assert.equal(report.localE2e.errors.length,0);
  report.checks.extractedPayloadReliabilityAndLocalFunctions=true;
  console.log('Checking imported media, playback and appearance preferences…');
  await run(process.execPath,[path.join(root,'scripts/appearance-smoke.mjs'),'--executable='+executable],{cwd:root});
  report.appearance=JSON.parse(fs.readFileSync(path.join(root,'artifacts/appearance-smoke/installed-report.json'),'utf8'));
  assert.equal(report.appearance.errors.length,0);
  report.checks.extractedPayloadAppearance=true;
  console.log('Checking original video clarity and full-resolution pause…');
  await run(process.execPath,[path.join(root,'scripts/appearance-video-smoke.mjs'),'--executable='+executable],{cwd:root});
  report.videoClarity=JSON.parse(fs.readFileSync(path.join(root,'artifacts/appearance-video/installed-report.json'),'utf8'));
  assert.equal(report.videoClarity.errors.length,0);
  report.checks.extractedPayloadOriginalVideoClarity=true;
  console.log('Checking workbench wallpaper…');
  await run(process.execPath,[path.join(root,'scripts/appearance-board-smoke.mjs'),'--executable='+executable],{cwd:root});
  report.workbenchAppearance=JSON.parse(fs.readFileSync(path.join(root,'artifacts/appearance-board/installed-report.json'),'utf8'));
  assert.equal(report.workbenchAppearance.errors.length,0);
  report.checks.extractedPayloadWorkbenchWallpaper=true;
  console.log('Checking global surfaces, drawers, menus and detached windows…');
  await run(process.execPath,[path.join(root,'scripts/appearance-surfaces-smoke.mjs'),'--executable='+executable],{cwd:root});
  report.globalAppearance=JSON.parse(fs.readFileSync(path.join(root,'artifacts/appearance-surfaces/installed-report.json'),'utf8'));
  assert.equal(report.globalAppearance.errors.length,0);
  report.checks.extractedPayloadGlobalWallpaper=true;
  console.log('Checking transparent panel text occlusion…');
  await run(process.execPath,[path.join(root,'scripts/appearance-occlusion-smoke.mjs'),'--executable='+executable],{cwd:root});
  report.panelOcclusion=JSON.parse(fs.readFileSync(path.join(root,'artifacts/appearance-occlusion/installed-report.json'),'utf8'));
  assert.equal(report.panelOcclusion.errors.length,0);
  report.checks.extractedPayloadPanelTextOcclusion=true;
  console.log('Checking conversation file links and Explorer locations…');
  await run(process.execPath,[path.join(root,'scripts/file-links-smoke.mjs'),'--executable='+executable],{cwd:root});
  report.fileLinks=JSON.parse(fs.readFileSync(path.join(root,'artifacts/installed-file-links-report.json'),'utf8'));
  assert.equal(report.fileLinks.errors.length,0);
  report.checks.extractedPayloadConversationFileLocations=true;
  assert.equal(report.errors.length,0);
}catch(error){report.errors.push(error.stack);process.exitCode=1;}
finally{
  if(app)await app.close();
  try {
    for(const {key,backup} of protocolBackups) {
      await run('reg.exe',['delete',key,'/f']).catch(()=>{});
      if(backup)await run('reg.exe',['import',backup]);
    }
    report.checks.developmentProtocolRegistrationsRestored=true;
  } catch(error) {report.errors.push('Protocol restore failed: '+error.message);process.exitCode=1;}
  fs.writeFileSync(path.join(root,'artifacts/installer/payload-smoke-report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({checks:report.checks,errors:report.errors,report:'artifacts/installer/payload-smoke-report.json'},null,2));
}
