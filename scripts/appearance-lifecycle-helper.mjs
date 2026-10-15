import assert from 'node:assert/strict';

export async function materialLifecycle({page,config,save,report}) {
  await page.evaluate(()=>{
    const style=document.createElement('style');style.id='material-fixture-style';
    style.textContent='@media(min-width:400px){.material-fixture{background:#fff}.material-fixture:hover{background:rgb(30,80,120)}}.material-gradient{background:linear-gradient(45deg,#fff,rgba(10,30,80,.8))}';
    document.head.append(style);
    const fixture=document.createElement('button');fixture.className='material-fixture';fixture.id='material-fixture';fixture.textContent='TEST';fixture.style.cssText='position:fixed;left:300px;top:150px;z-index:2147483000;width:240px;height:100px';document.body.append(fixture);
  });
  const probe=page.locator('#material-fixture');
  await page.waitForFunction(()=>getComputedStyle(document.querySelector('#material-fixture')).backgroundColor.includes('/ 0.15)'));
  const normal=await probe.evaluate(e=>getComputedStyle(e).backgroundColor);await probe.hover();
  const hover=await probe.evaluate(e=>getComputedStyle(e).backgroundColor);assert.notEqual(normal,hover);assert.match(hover,/\/ 0\.15\)/);
  await page.mouse.move(10,10);
  await probe.evaluate(e=>{e.style.backgroundColor='rgb(90,120,150)';});
  await page.waitForFunction(()=>document.querySelector('#material-fixture').hasAttribute('data-dev-inline-background'));
  const inline=await probe.evaluate(e=>({original:e.style.backgroundColor,rendered:getComputedStyle(e).backgroundColor}));assert.equal(inline.original,'rgb(90, 120, 150)');assert.match(inline.rendered,/\/ 0\.15\)/);
  await probe.evaluate(e=>{e.style.removeProperty('background-color');e.className='material-gradient';});
  await page.waitForFunction(()=>!document.querySelector('#material-fixture').hasAttribute('data-dev-inline-background'));
  const gradient=await probe.evaluate(e=>getComputedStyle(e).backgroundImage);assert.match(gradient,/\/ 0\.15\)/);assert.match(gradient,/\/ 0\.12\)/);
  await probe.evaluate(e=>{e.style.backgroundImage='radial-gradient(rgb(40,60,100),transparent)';});
  await page.waitForFunction(()=>document.querySelector('#material-fixture').hasAttribute('data-dev-inline-gradient'));
  assert.match(await probe.evaluate(e=>getComputedStyle(e).backgroundImage),/\/ 0\.15\)/);
  config.enabled=false;await save();assert.equal(await probe.evaluate(e=>getComputedStyle(e).backgroundImage),'radial-gradient(rgb(40, 60, 100), rgba(0, 0, 0, 0))');config.enabled=true;await save();
  await page.evaluate(()=>{const style=document.querySelector('#material-fixture-style');style.firstChild.textContent='.material-gradient{background-color:#abc}';document.querySelector('#material-fixture').style.removeProperty('background-image');});
  await page.waitForFunction(()=>getComputedStyle(document.querySelector('#material-fixture')).backgroundColor.startsWith('color(srgb 0.666'));
  await page.evaluate(()=>document.querySelector('#material-fixture-style').media='(min-width:99999px)');
  await page.waitForFunction(()=>{const color=getComputedStyle(document.querySelector('#material-fixture')).backgroundColor;return color==='rgba(0, 0, 0, 0)'||/\/ 0\)/.test(color);});
  await page.evaluate(()=>document.querySelector('#material-fixture-style').media='all');
  await page.waitForFunction(()=>getComputedStyle(document.querySelector('#material-fixture')).backgroundColor.startsWith('color(srgb 0.666'));
  report.checks.lazyStylesPortalHoverInlineGradientAndRestore=true;
  report.materialPerformance=await page.evaluate(async()=>{
    const start=performance.now(),frames=[];let last=start;
    for(let i=0;i<45;i++)await new Promise(resolve=>requestAnimationFrame(now=>{frames.push(now-last);last=now;resolve();}));
    return {sampleMs:performance.now()-start,frames:frames.length,p95FrameMs:frames.sort((a,b)=>a-b)[Math.floor(frames.length*.95)],adapterBytes:document.querySelector('#dev-glass-material').textContent.length,adapterRules:document.querySelector('#dev-glass-material').sheet.cssRules.length};
  });
  assert.ok(report.materialPerformance.p95FrameMs<150,'Material should not block normal frames');
  await page.evaluate(()=>{document.querySelector('#material-fixture').remove();document.querySelector('#material-fixture-style').remove();});
}
