const {test}=require('node:test');
const assert=require('node:assert/strict');
const {defaults,normalize,sniff,rangeFor}=require('../src/main/extensions/appearance.cjs');
const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os');
const {registerAppearance}=require('../src/main/extensions/appearance.cjs');
test('appearance preferences reject traversal and invalid values, preserve separate theme settings',()=>{
 const config=defaults();config.dark.transparency=65;assert.equal(normalize(config).light.transparency,35);
 for(const media of ['../../private.png','file:///secret','abc.svg'])assert.throws(()=>normalize({...config,media}));
 for(const transparency of [-1,101,NaN,'50'])assert.throws(()=>normalize({...config,dark:{...config.dark,transparency}}));
 assert.throws(()=>normalize({...config,enabled:'true'}));assert.throws(()=>normalize({...config,fit:'stretch'}));
 assert.equal(normalize({...config,extra:'ignored'}).extra,undefined);
});
test('video byte ranges support seeks and suffix reads, reject malformed or unsatisfiable ranges',()=>{
 assert.deepEqual(rangeFor('bytes=10-19',100),{start:10,end:19,status:206});
 assert.deepEqual(rangeFor('bytes=90-',100),{start:90,end:99,status:206});
 assert.deepEqual(rangeFor('bytes=-10',100),{start:90,end:99,status:206});
 assert.deepEqual(rangeFor('bytes=90-200',100),{start:90,end:99,status:206});
 for(const input of ['bytes=100-','bytes=10-9','bytes=-0','bytes=1-2,4-5','bytes=','unknown'])assert.equal(rangeFor(input,100),null);
});

test('old appearance profiles retain glass blur, and zero blur is a valid persisted preference',()=>{
 const legacy=defaults();delete legacy.light.panelBlur;delete legacy.dark.panelBlur;
 legacy.light.mask=38;
 assert.equal(normalize(legacy).light.panelBlur,16);
 assert.equal(normalize(legacy).dark.panelBlur,16);
 assert.equal(normalize(legacy).light.mask,38);
 assert.equal(normalize({...legacy,light:{...legacy.light,panelBlur:0}}).light.panelBlur,0);
 for(const panelBlur of [-1,25,NaN,'0',null])assert.throws(()=>normalize({...legacy,light:{...legacy.light,panelBlur}}));
});
test('background import checks file signatures instead of trusting extensions',()=>{
 sniff(Buffer.from([137,80,78,71,13,10,26,10]),'.png');
 sniff(Buffer.from('GIF89a'),'.gif');sniff(Buffer.from([26,69,223,163]),'.webm');
 assert.throws(()=>sniff(Buffer.from('<script>'),'.png'));assert.throws(()=>sniff(Buffer.from('GIF89a'),'.mp4'));
});
test('import copies chosen media, settings survive reload, used media cannot be discarded',async()=>{
 const directory=await fs.mkdtemp(path.join(os.tmpdir(),'shineai-appearance-'));
 try {
  const source=path.join(directory,'selected.png');await fs.writeFile(source,Buffer.from([137,80,78,71,13,10,26,10,0,1,2,3]));
  function setup() {
   const handlers=new Map(),protocolHandlers=new Map();
   registerAppearance({app:{whenReady:()=>Promise.resolve()},ipcMain:{handle:(key,fn)=>handlers.set(key,fn)},protocol:{registerSchemesAsPrivileged:()=>{},handle:(key,fn)=>protocolHandlers.set(key,fn)},dialog:{showOpenDialog:async()=>({canceled:false,filePaths:[source]})},BrowserWindow:{fromWebContents:()=>null,getAllWindows:()=>[]},config:{userData:path.join(directory,'profile')}});
   return {handlers,protocolHandlers};
  }
  const {handlers,protocolHandlers}=setup(),event={sender:{}};
  const imported=await handlers.get('dev:appearance:import')(event);assert.equal(imported.success,true);
  await fs.unlink(source);
  const config={...defaults(),media:imported.media.id,enabled:true};config.light.panelBlur=0;config.dark.panelBlur=24;
  assert.equal((await handlers.get('dev:appearance:save')(event,config)).success,true);
  assert.equal((await handlers.get('dev:appearance:discard')(event,config.media)).success,false);
  const response=await protocolHandlers.get('shineai-media')(new Request(imported.media.url,{headers:{Range:'bytes=0-7'}}));
  assert.equal(response.status,206);assert.deepEqual([...new Uint8Array(await response.arrayBuffer())],[137,80,78,71,13,10,26,10]);
  const loaded=await setup().handlers.get('dev:appearance:get')(event);assert.deepEqual(loaded.config,config);
  const invalid=await handlers.get('dev:appearance:save')(event,{...config,media:'../../secret'});assert.equal(invalid.success,false);
  assert.equal((await handlers.get('dev:appearance:get')(event)).config.media,config.media);
  await handlers.get('dev:appearance:save')(event,defaults());assert.equal((await handlers.get('dev:appearance:discard')(event,config.media)).success,true);
 }finally{await fs.rm(directory,{recursive:true,force:true});}
});
