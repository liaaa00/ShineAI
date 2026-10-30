// One-time, hash-pinned extraction. Normal builds use the checked-in output.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {brandSource} from './brand-source.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(path.join(root,'.runtime/package.json'));
const {parse}=require('acorn'),babel=require('@babel/parser'),traverse=require('@babel/traverse').default,generate=require('@babel/generator').default;
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const official=path.resolve(process.argv[2]||'D:/AI/SpectrAI-v108-recovered');
const original=fs.readFileSync(path.join(official,'src/main/index.js'),'utf8');
if(hash(original)!=='08e410cbc5028c05f2d6b8036c3edaf7566782b6e49ae7d978de3bd1e9285f15')throw Error('Unreviewed upstream bundle');
const decoded=fs.readFileSync(path.join(root,'artifacts/official108-review/main.decoded.cjs'),'utf8');
if(hash(decoded)!=='7a4fd1a73cc2c839b2ed612da14e1a344ec2b982c5e01c3cec0b70abf7b4939d')throw Error('Expected the verified decoded 1.0.8 bundle');
const ast=parse(decoded,{ecmaVersion:'latest'}),decls=new Map();
for(const n of ast.body){if(n.type==='VariableDeclaration'){for(const d of n.declarations)if(d.id.type==='Identifier')decls.set(d.id.name,{start:d.start,code:n.kind+' '+decoded.slice(d.start,d.end)+';'});}else if(n.id)decls.set(n.id.name,{start:n.start,code:decoded.slice(n.start,n.end)});}
const nodes=new Map(),externals=new Set();
function add(name){if(nodes.has(name))return;if(['a7J','a01'].includes(name)){nodes.set(name,{start:-1,code:'const '+name+'=null;'});return;}if(name==='gR'){nodes.set(name,{start:-1,code:'function gR(text,options={}){return require("../extensions/memory-policy.cjs").validate(text,options);}'});return;}const n=decls.get(name);if(!n){externals.add(name);return;}nodes.set(name,n);if(nodes.size>80)throw Error('Memory import exceeded its reviewed boundary');traverse(babel.parse(n.code),{ReferencedIdentifier(p){if(!p.scope.hasBinding(p.node.name))add(p.node.name);}});}
add('MO');
const allowed=new Set(['Array','Boolean','Date','Math','Number','Object','RegExp','Set','String','Map','JSON','undefined']);
if([...externals].some(name=>!allowed.has(name)))throw Error('Unreviewed memory dependency: '+[...externals].join(','));
const loader=ast.body.find(n=>n.type==='ClassDeclaration'&&n.id.name==='Vj');
const evaluator=loader.body.body.find(n=>(n.key.name||n.key.value)==='evaluateWithLLM');
const prompt=evaluator.value.body.body.find(n=>n.type==='VariableDeclaration'&&n.declarations.some(d=>d.id.name==='a05')).declarations.find(d=>d.id.name==='a05').init;
const promptCode='function evaluationPrompt(text,context){const a02=text,a03=context;return '+decoded.slice(prompt.start,prompt.end)+';}';
let code=[...nodes.values()].sort((a,b)=>a.start-b.start).map(n=>n.code).join('\n')+'\n'+promptCode+'\nmodule.exports={MemoryContextBuilder:MO,evaluationPrompt};';
const readable=babel.parse(code);
traverse(readable,{ArrayExpression(p){const index=p.node.elements.findIndex(n=>n?.type==='StringLiteral'&&n.value==='- 需要「记住/忘掉」时调用 memory_save / memory_forget，禁止只口头确认。');if(index>=0)p.node.elements.splice(index+1,0,babel.parseExpression(JSON.stringify('- 保存结果以 outcome/action/pending/persisted 为准，不能只看 ok。只有 saved/updated 且 persisted=true 才能说本次已保存；pending、duplicate、rejected、error 不得冒称本次已保存。')));}});
traverse(readable,{Program(p){for(const [from,to] of Object.entries({MO:'MemoryContextBuilder',EO:'MEMORY_BUDGET_CHARS',JP:'PINNED_TAG',$R:'isPinnedMemory',fR:'isPendingMemory',vR:'memoryStatus',tR:'isUsableMemory',TR:'isTopicRelevant',nO:'topicTokens',lO:'clipDescription',TO:'injectionHeader'}))if(p.scope.hasBinding(from))p.scope.rename(from,to);}});
code=brandSource('// Selected official 1.0.8 memory injection and evaluation prompt.\n'+generate(readable,{comments:false}).code+'\n');
const target=path.join(root,'src/main/upstream108/memory.cjs');fs.writeFileSync(target,code);
fs.writeFileSync(path.join(root,'src/main/upstream108/memory-manifest.json'),JSON.stringify({version:'1.0.8',mainSha256:hash(original),decodedSha256:hash(decoded),outputSha256:hash(code),declarations:[...nodes.keys()],externals:[...externals],localAdaptations:['Existing semantic admission validator; no broad keyword rejection of durable rules','Accurate save-result instruction','Local branding'],storageSchemaChanged:false},null,2)+'\n');
console.log(JSON.stringify({declarations:nodes.size,externals:[...externals],outputSha256:hash(code)}));
