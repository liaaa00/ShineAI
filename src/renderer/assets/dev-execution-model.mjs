const image = /\.(png|jpe?g|webp|gif|bmp|svg|avif|ico)$/i;
const names = {
  image:['查看图片','View image'], imageRead:['读取图片','Read image'], read:['读取文件','Read file'],
  screenshot:['截图','Screenshot'], skill:['加载技能','Load skill'], skillSearch:['查找技能','Find skills'],
  test:['测试命令','Test command'], command:['执行命令','Run command'], change:['修改文件','Change file']
};
const parse = value => { try { return typeof value === 'string' && value.length < 1000000 ? JSON.parse(value) : value || {}; } catch { return {}; } };
const text = value => typeof value === 'string' ? value : '';
export function operationInfo(operation, zh = true) {
  const use = operation.toolUse || {}, result = operation.result;
  const name = result?.toolName || use.toolName || operation.liveResult?.toolName || 'Tool';
  const short = name.split('__').pop();
  const input = { ...parse(use.toolInput), ...parse(result?.toolInput) };
  const command = text(input.command) || (Array.isArray(input.command) ? input.command.join(' ') : '');
  const path = text(input.file_path || input.path || input.image_path);
  let kind;
  if (['view_image','image_view','imageView'].includes(short)) kind='image';
  else if (['Read','read_file'].includes(short)) kind=image.test(path)?'imageRead':'read';
  else if (/^(browser_|computer_)?screenshot$/.test(short)) kind='screenshot';
  else if (short==='invoke_skill') kind='skill';
  else if (short==='search_skills') kind='skillSearch';
  else if (['Write','Edit','write_file','edit_file','fileChange','apply_patch'].includes(short)) kind='change';
  else if (command) kind=/(?:^|[\s;&|])(?:pytest|jest|vitest|playwright)(?:\s|$)|\b(?:npm|pnpm|yarn)\s+(?:run\s+)?(?:test|check|smoke(?::[\w-]+)?)\b|\bnode\s+--test\b|\b(?:cargo|go)\s+test\b/i.test(command)?'test':'command';
  else kind='other';
  const label=names[kind]?.[zh?0:1] || name;
  const state=result?(result.isError?'failed':'done'):'pending';
  let detail=path || command || (kind==='skill'?text(input.command):kind==='skillSearch'?text(input.query):'');
  let evidence=path;
  if (kind==='screenshot' && result && !result.isError) {
    const body=parse(result.toolResult);
    const structured=body.structuredContent || body;
    evidence=text(structured.path || structured.filePath || structured.screenshotPath || structured.file_path);
    if (!evidence && Array.isArray(body.content)) {
      for (const block of body.content) {
        if (block.type!=='text') continue;
        const value=parse(block.text);
        evidence=text(value.path || value.filePath || value.screenshotPath);
        if (evidence) break;
      }
    }
    detail=evidence || (zh?'截图结果可在执行记录中展开':'Expand the tool result for screenshot evidence');
  }
  return { name,kind,label,state,detail,evidence,operation };
}
export function activityCounts(operations, zh=true) {
  const counts={};
  for (const op of operations) {
    const info=operationInfo(op,zh);
    const suffix=info.state==='failed'?(zh?'失败':'failed'):info.state==='pending'?(zh?'未完成':'pending'):'';
    const key=info.label+(suffix?' · '+suffix:'');
    counts[key]=(counts[key]||0)+1;
  }
  return counts;
}
export function turnEvidence(messages, aggregate, zh=true) {
  let start=-1;
  for(let i=messages.length-1;i>=0;i--) if(messages[i].role==='user'){start=i;break;}
  const turn=messages.slice(start<0?0:start+1);
  const ops=aggregate(turn.filter(m=>['tool_use','tool_result'].includes(m.role)));
  const activities=ops.map(op=>operationInfo(op,zh));
  const files=new Map();
  for(const message of turn) if(message.fileChange?.filePath) {
    const change=message.fileChange;
    files.set(change.filePath,{path:change.filePath,changeType:change.changeType,diff:change.operationDiff || ''});
  }
  for(const info of activities) if(info.kind==='change' && info.state==='done' && info.evidence && !files.has(info.evidence)) files.set(info.evidence,{path:info.evidence});
  return {anchor:start<0?null:messages[start].id,activities,files:[...files.values()],tests:activities.filter(i=>i.kind==='test'),skills:activities.filter(i=>i.kind==='skill'||i.kind==='skillSearch'),images:activities.filter(i=>['image','imageRead','screenshot'].includes(i.kind))};
}
