import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const policy = 'require("./extensions/memory-policy.cjs")';
const recovery = 'require("./extensions/recovery-context.cjs")';
function once(source, from, to) {
  if (source.includes(to)) return source;
  if (source.split(from).length !== 2) throw Error('Memory/context anchor changed: ' + from.slice(0, 100));
  return source.replace(from, to);
}
function region(source, from, until, transform) {
  const start = source.indexOf(from), end = source.indexOf(until, start);
  if (start < 0 || end < start) throw Error('Memory/context region changed: ' + from);
  return source.slice(0, start) + transform(source.slice(start, end)) + source.slice(end);
}
export function patchMemoryContextMain(source) {
  source = once(source, 'a02?.["memoryRootDir"]||i["homedir"]()+("/.shineai/butler/memory")', `a02?.["memoryRootDir"]||${policy}.butlerDirectory("memory")`);
  source = once(source, 'const Xj=a["join"](i["homedir"](),".shineai","butler","knowledge")', `const Xj=${policy}.butlerDirectory("knowledge")`);
  source = once(source, 'static ["BUTLER_DATA_DIR"]=a["join"](i[\'homedir\'](),".shineai","butler")', `static ["BUTLER_DATA_DIR"]=${policy}.butlerDirectory()`);
  source = region(source, 'function oR(a02,a03={}){', 'function cR(', () => `function oR(a02,a03={}){return ${policy}.validate(a02,a03);}`);
  source = once(source, 'if(!a03)return null;if(/(过时|已废弃|不再使用|obsolete|deprecated|superseded)/i', `if(!a03)return null;if(${policy}.isDurableRule(a03))return null;if(/(过时|已废弃|不再使用|obsolete|deprecated|superseded)/i`);
  const wrapper = `async["saveExplicitMemory"](a02,a03={}){return ${policy}.saveExplicit(this,a02,a03,()=>this["saveExplicitMemoryCandidate"](a02,a03));}async["saveExplicitMemoryCandidate"](a02,a03={}){`;
  source = once(source, 'async["saveExplicitMemory"](a02,a03={}){', wrapper);
  source = region(source, 'async["saveExplicitMemoryCandidate"]', '["pumpExplicitMemoryEvaluations"](){', block => {
    block = once(block, 'if(!this["isDurableMemoryText"](a04,!0x0)){', `if(!${policy}.validateCandidate(a04,{explicitRemember:true}).ok){`);
    // A rejected candidate may demote a completed task, but a persistent rule
    // that merely mentions "completion" must never close a matching memory.
    block = once(block, 'this["tryDemoteSameSubjectOnCompletion"](a04,a05,a06)', `${policy}.validate(a04,{explicitRemember:true}).reason==="mutable_world_state"?this["tryDemoteSameSubjectOnCompletion"](a04,a05,a06):null`);
    return block;
  });
  source = region(source, 'async["evaluateWorthiness"](a02,a03){', 'async["evaluateSkillWorthiness"]', () =>
    `async["evaluateWorthiness"](a02,a03){if(!this["resolveEvalProviderId"](a03)||!this["sessionManager"])return ${policy}.evaluationFailure("model_unavailable");try{return await this["evaluateWithLLM"](a02,a03);}catch(error){return ${policy}.evaluationFailure(error?.code==="invalid_evaluation"?"invalid_evaluation":"evaluation_failed");}}`);
  source = region(source, 'async["evaluateWithLLM"](a02,a03){', '["getStats"](){const b4T=', block => {
    const start = block.indexOf('const a05='), end = block.indexOf(',a06="memory-eval-"', start);
    if (start < 0 || end < start) throw Error('Missing memory evaluation prompt');
    block = block.slice(0, start) + `const a05=${policy}.evaluationPrompt(a02,a03)` + block.slice(end);
    const race = block.indexOf('a08=await Promise["race"]('), output = block.indexOf(';if(!a08["completed"]', race);
    if (race >= 0 && output > race) block = block.slice(0, race) + `a08=await ${policy}.waitForEvaluation(a07,this["memoryEvalTimeoutMs"])` + block.slice(output);
    else if (!block.includes(`${policy}.waitForEvaluation`)) throw Error('Missing evaluation timeout');
    const parse = block.indexOf('const a09=a08["output"]["match"]('), finallyAt = block.indexOf('}finally{', parse);
    if (parse >= 0) block = block.slice(0, parse) + `return ${policy}.parseEvaluation(a08["output"]);` + block.slice(finallyAt);
    else if (!block.includes(`${policy}.parseEvaluation`)) throw Error('Missing memory evaluation parser');
    return block;
  });
  source = region(source, 'async["runExplicitMemoryEvaluation"]', '["updateMemory"](a02', block => {
    block = once(block, 'if(!a0d?.["worthRemembering"]){', `if(a0d?.evaluationStatus==="error")return ${policy}.rejection(a0d.reasonCode,{action:"error",outcome:"error",retryable:a0d.reasonCode!=="model_unavailable"});if(!a0d?.["worthRemembering"]){`);
    block = once(block, 'const a0t=this["tryDemoteSameSubjectOnCompletion"](a0f,a05,a06)||this["tryDemoteSameSubjectOnCompletion"](a02,a05,a06);', `const a0t=${policy}.validate(a0f,{explicitRemember:true}).reason==="mutable_world_state"?this["tryDemoteSameSubjectOnCompletion"](a0f,a05,a06):null;`);
    block = once(block, `'reason':"蒸馏内容未通过意义校验",`, `'reasonCode':${policy}.validate(a0f,{explicitRemember:true}).reason,'reason':${policy}.descriptions[${policy}.validate(a0f,{explicitRemember:true}).reason]||"蒸馏内容未通过意义校验",`);
    block = once(block, `return a0t?{'ok':!0x0,'action':"skipped",`, `return a0t?{'ok':!0x0,'action':a0t.next,'memory':a0t.memory,`);
    block = once(block, `'reason':"落库失败，可重试",`, `'reasonCode':"persistence_failed",'reason':"落库失败，可重试",`);
    return block;
  });
  source = region(source, 'async["runMemoryEvaluation"]', '["enqueueSessionEndPromotion"]', block => {
    block = once(block, 'const bbi=a7z;this["activeMemoryEvals"]++;', `const bbi=a7z;if(a03?.source==="system_internal"||["sensitive_content","raw_output"].includes(${policy}.validateCandidate(a02).reason))return;this["activeMemoryEvals"]++;`);
    return once(block, 'return void this["tryDemoteSameSubjectOnCompletion"](a0h,a0g,a07);', `return void (${policy}.validate(a0h,{explicitRemember:a05}).reason==="mutable_world_state"&&this["tryDemoteSameSubjectOnCompletion"](a0h,a0g,a07));`);
  });
  // Feedback is based on actual action/pending/id, never just ok:true.
  source = once(source, '"- 需要「记住/忘掉」时调用 memory_save / memory_forget，禁止只口头确认。",', '"- 需要「记住/忘掉」时调用 memory_save / memory_forget，禁止只口头确认。","- 保存结果以 outcome/action/pending/persisted 为准，不能只看 ok。只有 saved/updated 且 persisted=true 才能说本次已保存；pending 是尚未确认，duplicate 是已有重复项；skipped/rejected/error 不得说已记住。",');
  source = source.replace(`function rW(a02){if(!${recovery}.messageText(a02))return;`, 'function rW(a02){');
  source = once(source, 'function rW(a02){const brB=a7z,', `function rW(a02){if(${recovery}.isInternalMessage(a02))return;const brB=a7z,`);
  source = once(source, 'a06=YO(String(a02?.["content"]||\'\')),a07=tW(a02)', `a06=YO(${recovery}.messageText(a02)),a07=tW(a02)`);
  source = region(source, 'function rW(', 'function aW(', block => {
    // Scoped replacements: other uses of the prefix clipper remain intact.
    return block.replace(/\bUH\(/g, `${recovery}.clip(`);
  });
  source = region(source, 'function iW(a02,a03){', 'function nW(', () => `function iW(a02,a03){return ${recovery}.recentWindow(a02,a03,rW,jH);}`);
  source = region(source, 'function cW(a02,a03,a04,a05,a06,a07){', 'function lW(', () => `function cW(a02,a03,a04,a05,a06,a07){return ${recovery}.buildPrompt(a02,a03,a04,a05,a06,a07);}`);
  // If the final safety budget is reached, retain the newest dialogue at the
  // end as well as the original constraints at the start.
  source = region(source, 'function lW(', 'function dW(', block => block.replace('a0p=UH(a0p,a0o)', `a0p=${recovery}.clip(a0p,a0o,jH)`));
  source = once(source, 'hr["info"]("[OpenAiApiAdapter] resumeSession "+a02+(": context restored, providerSessionId=")+a03));}', `hr["info"]("[OpenAiApiAdapter] resumeSession "+a02+(": context restored, providerSessionId=")+a03),${recovery}.flushAfterRestore(this,a02,a05));}`);
  return source;
}
export function patchMemoryContextFiles() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const file = path.join(root, 'src/main/index.js');
  fs.writeFileSync(file, patchMemoryContextMain(fs.readFileSync(file, 'utf8')));
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) patchMemoryContextFiles();
