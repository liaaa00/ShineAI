import {test} from 'node:test';
import assert from 'node:assert/strict';
import {palettes,luminance,contrast,requiredBacking,choosePalette,fittedRect} from '../src/renderer/assets/dev-contrast.js';
test('bright and dark wallpapers choose readable inks without unnecessary backing',()=>{
  assert.equal(choosePalette([[255,255,255]]),'darkInk');
  assert.equal(choosePalette([[0,0,0]]),'lightInk');
  assert.equal(requiredBacking([[255,255,255]],palettes.darkInk),0);
  assert.equal(requiredBacking([[0,0,0]],palettes.lightInk),0);
});
test('a busy wallpaper gets sufficient backing for secondary and primary text',()=>{
  const pixels=[[255,255,255],[0,0,0],[100,90,210],[210,190,100],[20,100,50]];
  for(const palette of Object.values(palettes)) {
    const alpha=requiredBacking(pixels,palette);
    assert.ok(alpha>0 && alpha<1);
    for(const pixel of pixels) {
      const background=pixel.map((v,i)=>v*(1-alpha)+palette.backing[i]*alpha);
      for(const ink of [palette.ink,palette.secondary])assert.ok(contrast(luminance(ink),luminance(background))>=4.7);
    }
  }
});
test('small lighting changes preserve previous palette',()=>{
  const samples=Array.from({length:256},(_,i)=>[[i,i,i]]);
  const nearTie=samples.find(p=>Math.abs(requiredBacking(p,palettes.darkInk)-requiredBacking(p,palettes.lightInk))<.16);
  assert.ok(nearTie);assert.equal(choosePalette(nearTie,'darkInk'),'darkInk');assert.equal(choosePalette(nearTie,'lightInk'),'lightInk');
});
test('sampling matches cover, contain, and image position',()=>{
  assert.deepEqual(fittedRect(200,100,100,100,'contain',50,50),{x:0,y:25,width:100,height:50});
  assert.deepEqual(fittedRect(200,100,100,100,'cover',100,50),{x:-100,y:0,width:200,height:100});
});
