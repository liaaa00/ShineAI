import assert from 'node:assert/strict';

// Real component states, rather than blank page samples. No model invocation.
export async function componentSurfaces({app,page,aliases,config,mode,data,save,pair,capture,media,report}) {
  const id='appearance-content-fixture';
  const messages=[{id:'fixture-question',role:'user',content:'请检查整体界面的外观。',timestamp:Date.now()-1000},
    {id:'fixture-answer',role:'assistant',timestamp:Date.now(),content:'## 整体外观验证\n\n这是验收面板里的实际回复正文。卡片、面板和输入框应透出同一张背景。\n\n```js\nconsole.log("FULL_MATERIAL_TEST");\n```\n\n'+ '透明底色保留文字与图标的清晰度。\n\n'.repeat(4)+'\n## 交接\n结论：本地测试数据已准备。\n产出：无文件修改。\n怎么验证的：打开验收、对话和菜单。\n需要你看：查看整体背景是否连续。\n风险：无'}];
  await app.evaluate(({ipcMain},messages)=>{
    for(const [channel,value]of [['session:conversation-history',messages],['session:conversation-history-paged',{messages,hasMore:false}],['session:get-activities',[]],['review:generate-handoff',{success:false,error:'Synthetic UI tests never invoke AI'}]]){
      ipcMain.removeHandler(channel);ipcMain.handle(channel,()=>value);
    }
  },messages);
  await page.evaluate(async({aliases,messages,id,data})=>{
    const m=await import('./assets/index-0LVJEr5c.js'),s=m[aliases.useSessionStore];
    s.setState({sessions:[{id,name:'整体背景测试',status:'waiting_input',startedAt:Date.now(),estimatedTokens:1234,workingDirectory:data,config:{providerId:'codex',model:'local-fixture',workingDirectory:data},provider:{id:'codex',name:'Codex CLI'}}],conversations:{[id]:messages},conversationLoading:{}});
  },{aliases,messages,id,data});
  const card=page.locator('.cn-node[data-kind="session"]').first();await card.waitFor();
  await page.getByRole('button',{name:'适应窗口',exact:true}).click();
  await pair('session-card-'+mode,null,.65,card);
  await card.hover();await page.locator('.cn-peek').waitFor();
  const peek=await page.locator('.cn-peek').boundingBox();
  await pair('hover-preview-'+mode,[Math.ceil(peek.x),Math.ceil(peek.y),Math.floor(peek.x+peek.width),Math.floor(peek.y+peek.height)],.65,undefined,async()=>{
    await page.mouse.move(10,10);await card.hover();await page.locator('.cn-peek').waitFor();
  });
  await card.click();const drawer=page.locator('[data-canvas-drawer="session"]');await drawer.waitFor();
  await page.locator('[data-drawer-tab="review"]').click();
  await page.locator('[data-review-handoff-source="agent"]').waitFor();
  await pair('acceptance-drawer-'+mode,null,.65,drawer);
  await pair('acceptance-summary-'+mode,null,.65,page.locator('[data-review-summary]'));
  await pair('acceptance-report-'+mode,null,.65,page.locator('[data-review-report]'));
  const reply=drawer.locator('textarea:visible').first();await reply.fill('只测试输入，不发送');
  await pair('acceptance-input-'+mode,null,.60,reply);
  await reply.fill('');
  const size=await page.evaluate(()=>({width:innerWidth,height:innerHeight}));
  report.checks[mode+'PopulatedCardPeekReviewReply']=true;
  config.media=media[2];await save();await capture('full-workbench-review-'+mode+'-landscape');
  for(const tab of ['chat','files']){
    await page.locator('[data-drawer-tab="'+tab+'"]').click();await page.waitForTimeout(500);
    await pair('drawer-'+tab+'-'+mode,null,.60,drawer);
  }
  await page.locator('[data-drawer-more]').click();const menu=page.locator('[data-drawer-more-menu]');await menu.waitFor();
  await pair('drawer-menu-'+mode,null,.65,menu);
  await page.locator('[data-drawer-more]').click();await page.locator('[data-drawer-tab="review"]').click();
  // The full setting range must affect actual component interiors.
  const colors=[];
  for(const transparency of [0,40,100]){
    config[mode].transparency=transparency;await save();
    colors.push(await drawer.evaluate(e=>getComputedStyle(e).backgroundColor));
    if(transparency===100){
      const opaque=await page.evaluate(()=>{
        const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
        return [...document.body.querySelectorAll('*')].flatMap(e=>{
          if(!(e instanceof HTMLElement)||e.closest('#dev-background,#dev-edition-banner,.dev-preview'))return [];
          const rect=e.getBoundingClientRect(),s=getComputedStyle(e);
          if(rect.width<24||rect.height<16||rect.right<0||rect.bottom<0||rect.left>=innerWidth||rect.top>=innerHeight||s.display==='none'||s.visibility==='hidden')return [];
          ctx.clearRect(0,0,1,1);ctx.fillStyle=s.backgroundColor;ctx.fillRect(0,0,1,1);
          return ctx.getImageData(0,0,1,1).data[3]>250?[{tag:e.tagName,cls:e.className,bg:s.backgroundColor}]:[];
        });
      });report[mode+'OpaqueAt100']=opaque;assert.deepEqual(opaque,[],'No opaque application UI surfaces at transparency 100');
      await pair('full-transparency-'+mode,null,.65,drawer);
    }
  }
  assert.notEqual(colors[0],colors[1]);assert.notEqual(colors[1],colors[2]);
  report[mode+'DrawerSliderColors']=colors;config[mode].transparency=70;await save();
  const resizer=page.locator('[data-drawer-resize]');const before=await drawer.boundingBox();await resizer.focus();await resizer.press('ArrowLeft');const after=await drawer.boundingBox();assert.ok(after.width>before.width);
  report.checks[mode+'DrawerTabsMenuSliderAndResize']=true;
  await page.keyboard.press('Escape');await drawer.waitFor({state:'hidden'});
  const composer=page.locator('[data-canvas-dock="open"]');await pair('canvas-input-panel-'+mode,null,.65,composer);
  assert.ok(size.width>0);
}
