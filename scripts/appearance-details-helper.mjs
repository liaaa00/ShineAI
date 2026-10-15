import assert from 'node:assert/strict';

export async function routeDetails({page,route,pair,report,aliases}) {
  if(route==='experts'){
    const card=page.locator('article[aria-label]').first();await card.waitFor();
    await pair('expert-card',null,.65,card);
    await card.getByRole('button',{name:/更多/}).click();
    const menu=page.locator('div.fixed[class*="z-"]').filter({has:page.getByText('编辑',{exact:true})}).last();await menu.waitFor();
    await pair('expert-context-menu',null,.65,menu);await page.mouse.click(100,100);
    await card.getByRole('button',{name:/查看专家/}).click();await page.waitForTimeout(400);
    await pair('expert-detail',null,.65);report.checks.expertCardMenuAndDetail=true;
  }
  if(route==='workflow'){
    await page.getByRole('button',{name:'空白创建',exact:true}).click();await page.locator('.react-flow').waitFor();
    await pair('workflow-editor',null,.65);
    await page.evaluate(async alias=>{
      const m=await import('./assets/index-0LVJEr5c.js'),store=m[alias],workflow={id:'material-workflow-fixture',name:'整体外观测试工作流',description:'仅显示，不执行模型',variables:{},isTemplate:false,steps:[
        {id:'review',name:'检查外观',type:'manual_review',reviewConfig:{message:'检查背景与控件',requireApproval:true},position:{x:0,y:0},dependsOn:[],trigger:'auto'},
        {id:'agent',name:'示例节点',type:'agent',claudeConfig:{prompt:'不要执行这个测试节点'},position:{x:300,y:0},dependsOn:['review'],trigger:'auto'}]};
      store.setState({workflows:[...store.getState().workflows,workflow]});store.getState().setV2View({kind:'flow',workflowId:workflow.id});
    },aliases.useWorkflowStore);
    const node=page.locator('.react-flow__node').first();await node.waitFor();await pair('workflow-node',null,.65,node);await node.click();await page.waitForTimeout(300);await pair('workflow-node-inspector',null,.65);
    report.workflowEditorButtons=await page.getByRole('button').allTextContents();
    report.checks.workflowEditorMaterial=true;
  }
}

export async function settingsDetails({page,pair,report}) {
  const nav=async(tab)=>{await page.evaluate(tab=>window.dispatchEvent(new CustomEvent('open-settings-tab',{detail:tab})),tab);await page.waitForTimeout(500);};
  await nav('skills');await page.getByRole('button',{name:'📥 导入',exact:true}).click();
  const menu=page.locator('div.absolute[class*="z-50"]').filter({has:page.getByRole('button',{name:/从 URL \/ GitHub 导入/})});await menu.waitFor();
  await pair('skill-import-menu',null,.65,menu);
  await menu.getByRole('button',{name:/从 URL \/ GitHub 导入/}).click();
  const dialog=page.locator('div.fixed.inset-0').filter({has:page.locator('input[placeholder*="GitHub"]')}).last();await dialog.waitFor();
  await pair('skill-import-dialog',null,.65,dialog);
  const input=dialog.locator('input').first();await input.fill('https://example.invalid/fixture.md');await pair('skill-import-input',null,.65,input);
  await dialog.getByRole('button',{name:'取消',exact:true}).click();
  await page.getByRole('button',{name:/技能市场/}).click();await page.waitForTimeout(1000);await pair('skill-market',null,.65);
  await nav('mcp');await pair('mcp-settings',null,.65);report.mcpButtons=await page.getByRole('button').allTextContents();
  await nav('providers');await pair('provider-settings',null,.65);report.providerButtons=await page.getByRole('button').allTextContents();
  assert.equal(await page.getByText('应用渲染异常',{exact:true}).count(),0);
  report.checks.skillMarketImportPopupInputMcpAndProviders=true;
}
