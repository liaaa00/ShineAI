import {test} from 'node:test';
import assert from 'node:assert/strict';
import {choosePalette,fittedRect} from '../src/renderer/assets/dev-contrast.js';
test('text ink follows bright and dark wallpaper',()=>{
  assert.equal(choosePalette([[255,255,255]]),'darkInk');
  assert.equal(choosePalette([[0,0,0]]),'lightInk');
});
test('unavailable pixels retain existing ink',()=>{
  assert.equal(choosePalette([],'darkInk'),'darkInk');
  assert.equal(choosePalette([],'lightInk'),'lightInk');
});
test('near-tie lighting retains ink instead of flickering',()=>{
  const nearTie=Array.from({length:256},(_,i)=>[[i,i,i]]).find(p=>choosePalette(p,'darkInk')==='darkInk' && choosePalette(p,'lightInk')==='lightInk');
  assert.ok(nearTie);
});
test('sampling follows cover, contain, and image position',()=>{
  assert.deepEqual(fittedRect(200,100,100,100,'contain',50,50),{x:0,y:25,width:100,height:50});
  assert.deepEqual(fittedRect(200,100,100,100,'cover',100,50),{x:-100,y:0,width:200,height:100});
});
