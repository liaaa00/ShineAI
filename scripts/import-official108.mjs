// Selective, reproducible import. Never copies the upstream application entrypoint.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {brandSource} from './brand-source.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(path.join(root,'package.json'));
const {parse}=require(path.join(root,'.runtime/node_modules/acorn'));
const walk=require(path.join(root,'.runtime/node_modules/acorn-walk'));
const babel=require('@babel/parser'),traverse=require('@babel/traverse').default;
const official=path.resolve(process.argv[2]||'D:/AI/SpectrAI-v108-recovered');
function edits(s,items){let p=0,out='';for(const e of items.sort((a,b)=>a.start-b.start||b.end-a.end)){if(e.start<p)continue;out+=s.slice(p,e.start)+e.value;p=e.end;}return out+s.slice(p);}
function decode(s){
  const ast=parse(s,{ecmaVersion:'latest'}),rotation=ast.body.find(n=>n.type==='ExpressionStatement'&&s.slice(n.start,n.end).startsWith('(function'));
  if(!rotation)return s;
  const alias=ast.body.find(n=>n.type==='VariableDeclaration')?.declarations[0];
  const decoder=ast.body.find(n=>n.type==='FunctionDeclaration'&&n.id.name===alias?.init?.name);
  const array=ast.body.find(n=>n.type==='FunctionDeclaration'&&n!==decoder&&s.slice(n.start,n.end).includes('const ')&&s.slice(n.start,n.end).includes('return'));
  const call=rotation.expression;
  const arrayName=call.arguments?.[0]?.name;
  const actualArray=ast.body.find(n=>n.type==='FunctionDeclaration'&&n.id.name===arrayName)||array;
  if(!decoder||!actualArray)throw Error('Unknown decoder layout');
  const context=vm.createContext({});vm.runInContext(s.slice(decoder.start,decoder.end)+'\n'+s.slice(actualArray.start,actualArray.end)+'\n'+s.slice(rotation.start,rotation.end),context,{timeout:30000});
  const aliases=new Set([decoder.id.name]);let changed;
  do{changed=false;walk.simple(ast,{VariableDeclarator(n){if(n.id.type==='Identifier'&&n.init?.type==='Identifier'&&aliases.has(n.init.name)&&!aliases.has(n.id.name)){aliases.add(n.id.name);changed=true;}}});}while(changed);
  const changes=[];walk.simple(ast,{CallExpression(n){if(n.callee.type==='Identifier'&&aliases.has(n.callee.name)&&n.arguments.length===1&&typeof n.arguments[0].value==='number')changes.push({start:n.start,end:n.end,value:JSON.stringify(context[decoder.id.name](n.arguments[0].value))});}});
  s=edits(s,changes);const folded=parse(s,{ecmaVersion:'latest'}),cache=new WeakMap();
  function value(n){if(cache.has(n))return cache.get(n);let v;if(n.type==='Literal'&&typeof n.value==='string')v=n.value;else if(n.type==='BinaryExpression'&&n.operator==='+'){const a=value(n.left),b=value(n.right);if(a!==undefined&&b!==undefined)v=a+b;}cache.set(n,v);return v;}
  const folds=[];walk.simple(folded,{BinaryExpression(n){const v=value(n);if(v!==undefined)folds.push({start:n.start,end:n.end,value:JSON.stringify(v)});}});return edits(s,folds);
}
function index(s,module=false){const map=new Map(),ast=parse(s,{ecmaVersion:'latest',sourceType:module?'module':'script'});for(const n of ast.body){if(n.type==='VariableDeclaration'){for(const d of n.declarations)if(d.id.type==='Identifier')map.set(d.id.name,{start:d.start,code:n.kind+' '+s.slice(d.start,d.end)+';'});}else if(n.id)map.set(n.id.name,{start:n.start,code:s.slice(n.start,n.end)});}return {map,ast};}
function closure(map,roots,overrides=new Map(),shared=new Set()){
  const nodes=new Map(),external=new Set(),used=new Set();
  function add(name){if(shared.has(name)){used.add(name);return;}if(nodes.has(name))return;if(overrides.has(name)){nodes.set(name,{start:-1,code:overrides.get(name)});return;}const d=map.get(name);if(!d){external.add(name);return;}nodes.set(name,d);if(nodes.size>700)throw Error('Import grew beyond reviewed boundary: '+name);traverse(babel.parse(d.code,{sourceType:'module'}),{ReferencedIdentifier(p){if(!p.scope.hasBinding(p.node.name))add(p.node.name);}});}
  roots.forEach(add);return {code:[...nodes.values()].sort((a,b)=>a.start-b.start).map(x=>x.code).join('\n'),nodes:[...nodes.keys()],external:[...external],shared:[...used]};
}
const original=fs.readFileSync(path.join(official,'src/main/index.js'),'utf8');
const originalHash=crypto.createHash('sha256').update(original).digest('hex');
if(originalHash!=='08e410cbc5028c05f2d6b8036c3edaf7566782b6e49ae7d978de3bd1e9285f15')throw Error('This selective import only supports the reviewed official 1.0.8 bundle. Review new versions before importing.');
const decodedFile=path.join(root,'artifacts/official108-review/main.decoded.cjs');
const cached=fs.existsSync(decodedFile)?fs.readFileSync(decodedFile,'utf8'):null;
const main=cached&&crypto.createHash('sha256').update(cached).digest('hex')==='7a4fd1a73cc2c839b2ed612da14e1a344ec2b982c5e01c3cec0b70abf7b4939d'?cached:decode(original);
const {map:mainMap,ast:mainAst}=index(main);
const current=fs.readFileSync(path.join(root,'src/main/index.js'),'utf8'),{map:currentMap}=index(current);
const overrides=new Map([['a7J','const a7J=null;'],['a01','const a01=null;'],['rE','function rE(channel,data){for(const w of require("electron").BrowserWindow.getAllWindows())if(!w.isDestroyed())w.webContents.send(channel,data);}'],['j','const j=require("./presets.cjs");']]);
// Reuse existing, already hardened i18n/path-guard modules, not upstream copies.
for(const name of ['p','h']){const old=currentMap.get(name)?.code;if(!old?.includes('require('))throw Error('Missing shared module '+name);let code=old.replaceAll('"./chunks/','"../chunks/');if(name==='p')code=code.replace(/=require\(([^)]+)\);/,'=require("./messages.cjs").wrap(require($1));');overrides.set(name,code);}
const roots=['xbe','Tge','WAe','iAe','fIe','a9','ibe','Ybe'];
const features=closure(mainMap,roots,overrides);
// Zero explicitly disables automatic handoff generation in the local edition.
// Summarize existing conversations without recording a false quota failure.
features.code=features.code.replace('a0q["length"]>a0p&&a0o("handoff_limit:"','a0p>0&&a0q["length"]>a0p&&a0o("handoff_limit:"');
const exportMap={DailyBoardService:'xbe',WebLlmService:'Tge',registerDailyBoard:'WAe',DailyBoardScheduler:'iAe',DailyBoardOverlay:'fIe',hasModel:'a9',redact:'ibe',readDailySettings:'Ybe'};
const target=path.join(root,'src/main/upstream108');fs.mkdirSync(target,{recursive:true});
fs.writeFileSync(path.join(target,'features.cjs'),brandSource('// Selected official 1.0.8 functionality; integration lives in extensions/upstream108.cjs.\n'+features.code+'\nmodule.exports={'+Object.entries(exportMap).map(([k,v])=>k+':'+v).join(',')+'};\n'));
const presets=decode(fs.readFileSync(path.join(official,'src/main/chunks/presets-28giQBOA.js'),'utf8'));
fs.writeFileSync(path.join(target,'presets.cjs'),brandSource(presets));
const websocket=decode(fs.readFileSync(path.join(official,'src/main/chunks/websocket-server-CPeNiTlh.js'),'utf8'));
fs.writeFileSync(path.join(target,'websocket-server-CPeNiTlh.js'),brandSource(websocket.replaceAll('./stdio-DXmbQghg.js','../chunks/stdio-DXmbQghg.js')));
// Only additive local tables; never advance or replay the upstream migration ledger.
const schema=[];walk.simple(mainAst,{Literal(n){if(typeof n.value==='string'&&n.value.includes('CREATE TABLE IF NOT EXISTS daily_board')&&!n.value.includes('remote_snapshots'))schema.push(n.value);}});
fs.writeFileSync(path.join(target,'schema.sql'),schema.join('\n')+'\n');
const renderer=fs.readFileSync(path.join(official,'src/renderer/assets/index-B8uQEM4s.js'),'utf8'),{map:uiMap}=index(renderer,true);
const shared=new Set(['reactExports','reactDomExports','jsxRuntimeExports','useTranslation','instance','create$5','createLucideIcon','useUIStore','useSessionStore','cn','useFileManagerStore','useWorkGroupStore','MarkdownRenderer$1','useWorkbenchDockStore']);
const ui=closure(uiMap,['WebLlmSettingsSection','WebLlmPendingBar','DailyBoardModal','openDailyBoard'],new Map(),shared);
if(ui.external.some(n=>!['window','console','CustomEvent','URL','document','queueMicrotask','localStorage','ResizeObserver','requestAnimationFrame','Event','Element'].includes(n)))throw Error('Unreviewed UI dependencies '+ui.external);
const locales={};for(const lang of ['zh-CN','en-US'])for(const namespace of ['dailyBoard','webLlm']){
  const key=`"./locales/${lang}/${namespace}.json": `,p=renderer.indexOf(key);if(p<0)throw Error('Missing locale '+key);const alias=/^[\w$]+/.exec(renderer.slice(p+key.length))[0],bundle=closure(uiMap,[alias]);
  if(bundle.external.length)throw Error('Nonliteral locale dependency');locales[lang+'|'+namespace]=vm.runInNewContext(bundle.code+'\n'+alias,{}, {timeout:2000});
}
const localeCode=Object.entries(locales).map(([key,data])=>{const [lang,ns]=key.split('|');if(ns==='dailyBoard'){data.schedule.channel_desktop=lang==='zh-CN'?'应用内提醒':'In-app reminder';data.schedule.channelMobileHint=lang==='zh-CN'?'自动导出保存在系统“文档”文件夹 → ShineAI → Daily reports。':'Automatic exports: Documents → ShineAI → Daily reports.';}return `instance.addResourceBundle(${JSON.stringify(lang)},${JSON.stringify(ns)},${JSON.stringify(data)},true,true);`;}).join('\n');
const uiCode=ui.code.replace('className: "fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4 sm:p-8"','style: {zIndex:90}, className: "fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4 sm:p-8"').replace('const DAILY_BOARD_CHANNELS = ["desktop", "feishu", "telegram", "dingtalk", "mobile"];','const DAILY_BOARD_CHANNELS = ["desktop"];').replace('detail: "model-routing"','detail: "daily-board"');
fs.writeFileSync(path.join(root,'src/renderer/assets/upstream108.js'),brandSource('// Selected official 1.0.8 UI, sharing existing application stores.\nexport function createUpstream108UI({'+ui.shared.join(',')+'}){\n'+localeCode+'\n'+uiCode+'\nreturn {WebLlmSettingsSection,WebLlmPendingBar,DailyBoardModal,openDailyBoard};\n}\n'));
// Add only absent utility selectors. Do not replace theme tokens, resets or fonts.
const oldCss=fs.readFileSync(path.join(root,'src/renderer/assets/index-qrggy75z.css'),'utf8');
const newCss=fs.readFileSync(path.join(official,'src/renderer/assets/index-bLDEWl1Z.css'),'utf8');
function missingRules(css){let cursor=0,out='';while(cursor<css.length){const open=css.indexOf('{',cursor);if(open<0)break;const selector=css.slice(cursor,open).trim();let end=open+1,depth=1,quote=null;for(;end<css.length&&depth;end++){const c=css[end];if(c==='\\'){end++;continue;}if(quote){if(c===quote)quote=null;continue;}if(c==='"'||c==="'"){quote=c;continue;}if(c==='{')depth++;if(c==='}')depth--;}const body=css.slice(open+1,end-1);if(/^@(?:media|supports|layer)\b/.test(selector)){const inner=missingRules(body);if(inner)out+=selector+'{'+inner+'}\n';}else if(selector.startsWith('.')&&!oldCss.includes(selector+'{')&&!body.includes('{'))out+=selector+'{'+body+'}\n';cursor=end;}return out;}
fs.writeFileSync(path.join(root,'src/renderer/assets/upstream108.css'),'/* Additive upstream utilities; existing appearance configuration is preserved. */\n'+missingRules(newCss));
const report={officialVersion:'1.0.8',mainSha256:crypto.createHash('sha256').update(original).digest('hex'),mainNodes:features.nodes,mainExternals:features.external,uiNodes:ui.nodes,uiShared:ui.shared,memoryImported:false};
fs.writeFileSync(path.join(target,'import-manifest.json'),JSON.stringify(report,null,2)+'\n');console.log('Imported isolated local feature modules:',features.nodes.length,'main and',ui.nodes.length,'UI declarations');
