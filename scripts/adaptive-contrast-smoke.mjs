import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {root,openTestApp,completeOnboarding} from './electron-test-helper.mjs';
const executable=process.argv.find(a=>a.startsWith('--executable='))?.slice(13);
const data=path.join(root,'.test-data','adaptive-contrast-'+Date.now());fs.mkdirSync(data,{recursive:true});
const artifacts=path.join(root,'artifacts/adaptive-contrast');fs.mkdirSync(artifacts,{recursive:true});
const source=fs.readFileSync(path.join(root,'src/renderer/assets/index-0LVJEr5c.js'),'utf8');
const aliases=Object.fromEntries(['useSessionStore','useUIStore','useWorkflowStore'].map(name=>[name,source.match(new RegExp(name+' as (\\w+)'))[1]]));
const report={date:new Date().toISOString(),executable:executable||'project Electron',checks:{},measurements:{},errors:[],scope:'Real conversation, workflow nodes and attachment renderer with local generated wallpapers. No model requests. Real local video playback; rapid cut stability injects light/dark samples at the canvas draw boundary.'};
const backups=[];let app,page,config;
async function save(id,enabled=true){config.media=id;config.enabled=enabled;assert.equal((await page.evaluate(c=>window.development.appearance.save(c),config)).success,true);if(enabled)await page.waitForFunction(id=>[...document.querySelectorAll('#dev-background img,#dev-background video')].some(e=>e.src.endsWith(id)),id);await page.waitForTimeout(1800);}
async function capture(name){await page.screenshot({path:path.join(artifacts,(executable?'installed-':'')+name+'.png')});}
try {
  for(const scheme of ['shineai-dev','spectrai-dev','claudeops-dev']){const key='HKCU\\Software\\Classes\\'+scheme,backup=path.join(data,scheme+'.reg');try{execFileSync('reg.exe',['export',key,backup,'/y'],{stdio:'ignore',windowsHide:true});backups.push({key,backup});}catch{backups.push({key});}}
  ({app,page}=await openTestApp(data,{auth:19478,meeting:18248},executable));
  assert.equal(path.resolve((await page.evaluate(()=>window.development.getRuntimeInfo())).userData),path.resolve(data));
  page.on('pageerror',e=>report.errors.push(e.message));await completeOnboarding(page);
  const media={};
  for(const kind of ['bright','dark','busy']) {
    const bytes=await page.evaluate(kind=>{
      const c=document.createElement('canvas');c.width=1280;c.height=800;const ctx=c.getContext('2d');
      ctx.fillStyle=kind==='dark'?'#080b10':'#f9fbff';ctx.fillRect(0,0,c.width,c.height);
      if(kind==='busy')for(let y=0;y<800;y+=40)for(let x=0;x<1280;x+=40){ctx.fillStyle=(x/40+y/40)%2?'#f9fbff':'#080b10';ctx.fillRect(x,y,40,40);}
      return c.toDataURL().split(',')[1];
    },kind);
    const file=path.join(data,kind+'.png');fs.writeFileSync(file,Buffer.from(bytes,'base64'));
    await app.evaluate(({dialog},file)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[file]});},file);
    const imported=await page.evaluate(()=>window.development.appearance.importMedia());assert.equal(imported.success,true);media[kind]=imported.media.id;
  }
  config=(await page.evaluate(()=>window.development.appearance.get())).config;
  for(const mode of ['light','dark'])Object.assign(config[mode],{strength:100,mask:0,transparency:100,blur:0,panelBlur:0});
  const workspace=await page.evaluate(rootPath=>(window.shineAI||window.spectrAI).workspace.create({name:'Readability fixtures',rootPath,repos:[{repoPath:rootPath,name:'fixture',isPrimary:true}]}),data);assert.equal(workspace.success,true);
  await page.evaluate(async({aliases,data})=>{
    const m=await import('./assets/index-0LVJEr5c.js');window.contrastSessions=m[aliases.useSessionStore];window.contrastUI=m[aliases.useUIStore];window.contrastWorkflow=m[aliases.useWorkflowStore];
    const id='contrast-fixture';window.contrastSessions.setState({sessions:[{id,name:'壁纸文字可读性',status:'idle',startedAt:Date.now(),workingDirectory:data,config:{providerId:'codex',model:'fixture',workingDirectory:data}}],selectedSessionId:id});
    window.contrastUI.getState().setActiveWorkspace('project');await window.contrastSessions.getState().openSessionForChat(id);
    const file='file:///'+(data+'/bright.png').replaceAll('\\','/');
    window.contrastSessions.setState({conversations:{[id]:[{id:'contrast-answer',role:'assistant',timestamp:Date.now(),attachments:[{type:'image',path:data+'/bright.png'}],content:'## 自适应壁纸\n\nREADABLE_BODY 明亮和暗色壁纸都应看清这段正文。\n\n[链接保持原有蓝色](https://example.com)\n\n```js\nconst readable = true;\n```'}]},conversationLoading:{}});
  },{aliases,data});
  const body=page.getByText('READABLE_BODY 明亮和暗色壁纸都应看清这段正文。',{exact:true});await body.waitFor();
  const nativeColor=await body.evaluate(e=>getComputedStyle(e).color);
  const link=page.getByRole('link',{name:'链接保持原有蓝色',exact:true});
  const nativeTheme=await page.evaluate(()=>window.contrastUI.getState().theme);
  for(const theme of ['light','dark']){
    await page.evaluate(theme=>window.contrastUI.getState().setTheme(theme),theme);
    const nativeLink=await link.evaluate(e=>getComputedStyle(e).color);
    for(const kind of ['bright','dark','busy']) {
      await save(media[kind]);await body.evaluate(element=>{if(!element.closest('[data-dev-adaptive-region]'))throw Error('Body has no adaptive region; '+[...document.querySelectorAll('[data-dev-adaptive-region]')].map(e=>e.tagName+':'+e.className).join(' | '));});
      // Set the expected fixture kind before calculating actual CSS contrast.
      await page.evaluate(kind=>{window.testWallpaperKind=kind;},kind);
      const measured=await body.evaluate(async(element)=>{
        const {contrast,luminance}=await import('./assets/dev-contrast.js');
        const region=element.closest('[data-dev-adaptive-region]'),canvas=document.createElement('canvas');canvas.width=canvas.height=1;const ctx=canvas.getContext('2d');
        const parse=color=>{ctx.clearRect(0,0,1,1);ctx.fillStyle=color;ctx.fillRect(0,0,1,1);return [...ctx.getImageData(0,0,1,1).data];};
        const fg=parse(getComputedStyle(element).color),back=parse(getComputedStyle(region).backgroundColor),alpha=back[3]/255;
        const backgrounds=window.testWallpaperKind==='bright'?[[249,251,255]]:window.testWallpaperKind==='dark'?[[8,11,16]]:[[249,251,255],[8,11,16]];
        return {palette:region.dataset.devAdaptiveRegion,color:getComputedStyle(element).color,alpha,ratios:backgrounds.map(p=>contrast(luminance(fg.slice(0,3)),luminance(p.map((v,i)=>v*(1-alpha)+back[i]*alpha))))};
      });
      assert.ok(measured.ratios.every(r=>r>=4.5),JSON.stringify(measured));
      if(kind!=='busy')assert.equal(measured.palette,kind==='bright'?'darkInk':'lightInk');
      assert.equal(await link.evaluate(e=>getComputedStyle(e).color),nativeLink);
      report.measurements[theme+'-'+kind]=measured;report.checks[theme+'-'+kind+'BodyAndSemanticLink']=true;
      await capture(theme+'-'+kind);
    }
  }
  const label=page.locator('span.absolute.inset-x-0.bottom-0').filter({hasText:'bright.png'}).first();
  await label.scrollIntoViewIfNeeded();await page.waitForTimeout(1400);await label.waitFor();assert.equal(await label.evaluate(e=>getComputedStyle(e).backgroundColor),'rgba(14, 20, 30, 0.86)');report.checks.imageCaptionProtected=true;
  // Real workflow descriptions use inline v2 colour tokens.
  await page.evaluate(()=>{
    window.contrastUI.getState().setActiveWorkspace('workflow');
    const workflow={id:'contrast-workflow',name:'自适应工作流',description:'测试',variables:{},isTemplate:false,steps:[{id:'agent',name:'构思与产品思考',type:'agent',claudeConfig:{prompt:'WORKFLOW_DESCRIPTION 清晰阅读节点说明'},position:{x:0,y:0},dependsOn:[],trigger:'auto'}]};
    const s=window.contrastWorkflow;s.setState({workflows:[...s.getState().workflows,workflow]});s.getState().setV2View({kind:'flow',workflowId:workflow.id});
  });
  const node=page.locator('.react-flow__node').first();await node.waitFor();
  await save(media.bright);await page.waitForFunction(()=>document.querySelector('.react-flow__node[data-dev-adaptive-region="darkInk"]'));
  assert.ok(await node.locator('[data-dev-adaptive-text]').count()>0);await capture('workflow-bright');
  await save(media.dark);await page.waitForFunction(()=>document.querySelector('.react-flow__node[data-dev-adaptive-region="lightInk"]'));await capture('workflow-dark');report.checks.inlineWorkflowTextFollowsWallpaper=true;
  // Decode a real local video; alternate sampled lighting at its canvas boundary
  // to deterministically exercise rapid scene cuts without relying on timing.
  const videoFile=path.join(root,'scripts/fixtures/appearance/animated.webm');
  await app.evaluate(({dialog},file)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[file]});},videoFile);
  const importedVideo=await page.evaluate(()=>window.development.appearance.importMedia());assert.equal(importedVideo.success,true);
  await save(importedVideo.media.id);
  await page.evaluate(()=>{
    window.originalContrastDraw=CanvasRenderingContext2D.prototype.drawImage;
    let bright=false;
    CanvasRenderingContext2D.prototype.drawImage=function(...args){
      if(this.canvas.width===128&&this.canvas.height===80){bright=!bright;this.fillStyle=bright?'#ffffff':'#000000';this.fillRect(0,0,128,80);return;}
      return window.originalContrastDraw.apply(this,args);
    };
  });
  const stability=await page.evaluate(async()=>{
    const node=document.querySelector('.react-flow__node'),video=document.querySelector('#dev-background video'),seen=[];
    const started=video.currentTime;
    for(let i=0;i<12;i++){seen.push(node.dataset.devAdaptiveRegion);await new Promise(r=>setTimeout(r,450));}
    return {playing:!video.paused&&video.readyState>=2,advanced:video.currentTime!==started,changes:seen.filter((p,i)=>i&&p!==seen[i-1]).length};
  });
  assert.equal(stability.playing,true);assert.equal(stability.advanced,true);assert.ok(stability.changes<=1,JSON.stringify(stability));
  report.measurements.video=stability;report.checks.realVideoAndSimulatedFastCutsDoNotFlashText=true;
  await page.evaluate(()=>{CanvasRenderingContext2D.prototype.drawImage=window.originalContrastDraw;delete window.originalContrastDraw;});
  // If pixel access is unavailable, retain legibility via the safe local backing.
  await page.evaluate(()=>{window.restoreContrastPixels=CanvasRenderingContext2D.prototype.getImageData;CanvasRenderingContext2D.prototype.getImageData=function(...args){if(this.canvas.width===128&&this.canvas.height===80)throw new DOMException('fixture pixel access denied','SecurityError');return window.restoreContrastPixels.apply(this,args);};});
  await save(media.bright);
  const fallbackAlpha=await node.evaluate(e=>getComputedStyle(e).getPropertyValue('--dev-adaptive-scrim'));
  assert.ok(/0\.[5-9]/.test(fallbackAlpha),fallbackAlpha);report.checks.unavailablePixelSamplingKeepsSafeBacking=true;
  await page.evaluate(()=>{CanvasRenderingContext2D.prototype.getImageData=window.restoreContrastPixels;delete window.restoreContrastPixels;});
  await save(media.busy,false);assert.equal(await page.locator('[data-dev-adaptive-text]').count(),0);report.checks.disablingWallpaperRestoresTheme=true;
  await page.evaluate(()=>window.contrastUI.getState().setActiveWorkspace('project'));
  await page.evaluate(theme=>window.contrastUI.getState().setTheme(theme),nativeTheme);await body.waitFor();
  assert.equal(await body.evaluate(e=>getComputedStyle(e).color),nativeColor);
  assert.equal(report.errors.length,0,report.errors.join('\n'));
}catch(error){report.errors.push(error.stack);process.exitCode=1;if(page&&!page.isClosed()){report.diagnostics=await page.evaluate(()=>({html:document.documentElement.outerHTML.slice(0,1000),regions:document.querySelectorAll('[data-dev-adaptive-region]').length,text:document.querySelectorAll('[data-dev-adaptive-text]').length,messages:[...document.querySelectorAll('[data-message-id]')].map(e=>({id:e.dataset.messageId,region:e.dataset.devAdaptiveRegion})),saved:window.development.appearance.get()})).catch(()=>null);await capture('failure').catch(()=>{});}}
finally{
  if(app)await app.close();
  for(const {key,backup} of backups){try{execFileSync('reg.exe',['delete',key,'/f'],{stdio:'ignore',windowsHide:true});}catch{}if(backup)execFileSync('reg.exe',['import',backup],{stdio:'ignore',windowsHide:true});}
  fs.writeFileSync(path.join(artifacts,executable?'installed-report.json':'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}
