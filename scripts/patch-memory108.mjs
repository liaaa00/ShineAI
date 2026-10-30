import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(path.join(root,'.runtime/package.json'));
const {parse}=require('acorn'),walk=require('acorn-walk');
const marker='/* development: official 1.0.8 memory core */';
function once(source,from,to){if(source.includes(to))return source;if(source.split(from).length!==2)throw Error('Memory 1.0.8 anchor changed: '+from.slice(0,80));return source.replace(from,to);}
export function patchMemory108Main(source){
  if(source.includes(marker))return source;
  const ast=parse(source,{ecmaVersion:'latest'}),builder=ast.body.find(n=>n.type==='ClassDeclaration'&&n.id.name==='JR'),service=ast.body.find(n=>n.type==='ClassDeclaration'&&n.id.name==='Dq');
  if(!builder||!service)throw Error('Unknown memory core layout');
  const edits=[{start:builder.start,end:builder.end,text:'class JR extends require("./upstream108/memory.cjs").MemoryContextBuilder{}'}];
  for(const name of ['createEmptyInjectionStatus','getMemoryContext']){
    const m=service.body.body.find(n=>(n.key.value||n.key.name)===name);
    if(!m)throw Error('Missing memory status method');
    const text=source.slice(m.start,m.end).replaceAll("'maxItems':0x8","'maxItems':0x12");
    edits.push({start:m.start,end:m.end,text});
  }
  const store=service.body.body.find(n=>(n.key.value||n.key.name)==='getMemoryStore');
  edits.push({start:store.value.body.start+1,end:store.value.body.start+1,text:'if(!this.memoryStore)require("./extensions/memory108-backup.cjs").ensureMemoryBackup(require("./extensions/memory-policy.cjs").butlerDirectory());'});
  const budget=ast.body.filter(n=>n.type==='VariableDeclaration').flatMap(n=>n.declarations).find(n=>n.id.name==='VR');
  if(!budget||budget.init.value!==2000)throw Error('Unknown old memory budget');
  edits.push({start:budget.init.start,end:budget.init.end,text:'3500'});
  for(const name of ['runExplicitMemoryEvaluation','runMemoryEvaluation']){
    const m=service.body.body.find(n=>(n.key.value||n.key.name)===name);
    let matches=0;
    walk.simple(m.value.body,{ArrayExpression(n){
      if(name==='runExplicitMemoryEvaluation'&&n.elements.some(e=>e?.value==='source-memory-save')){
        edits.push({start:n.elements[2].end,end:n.elements[2].end,text:',a0d.general&&a0i!=="project"?"pinned":undefined'});matches++;
      }else if(name==='runMemoryEvaluation'&&n.elements[0]?.object?.name==='a03'&&(n.elements[0].property.value||n.elements[0].property.name)==='source'){
        edits.push({start:n.elements[4].end,end:n.elements[4].end,text:',a0d.general&&!a0q&&a0g!=="project"?"pinned":\'\''});matches++;
      }
    }});
    if(matches!==1)throw Error('Unknown memory tag expression: '+name);
  }
  for(const e of edits.sort((a,b)=>b.start-a.start))source=source.slice(0,e.start)+e.text+source.slice(e.end);
  parse(source,{ecmaVersion:'latest'});
  return source+'\n'+marker+'\n';
}
export function patchMemory108Files(){
  const file=path.join(root,'src/main/index.js');fs.writeFileSync(file,patchMemory108Main(fs.readFileSync(file,'utf8')));
  const renderer=path.join(root,'src/renderer/assets/index-0LVJEr5c.js');let ui=fs.readFileSync(renderer,'utf8');
  ui=once(ui,'最多 8 条 / 2000 字','最多 18 条 / 3500 字（置顶最多 6 条、普通最多 12 条）');
  ui=once(ui,'up to 8 items / 2000 characters','up to 18 items / 3500 characters (up to 6 pinned and 12 regular)');
  fs.writeFileSync(renderer,ui);
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))patchMemory108Files();
