'use strict';
const modes = new Set(['manual', 'balanced', 'full_auto']);
function permission(config = {}) {
  const mode = modes.has(config.permissionMode) ? config.permissionMode : config.autoAccept === false ? 'manual' : 'full_auto';
  return { permissionMode: mode, autoAccept: mode === 'full_auto' };
}
function runtimePermission(adapter, id, autoAccept, fallback) {
  const config = adapter.sessionManager?.getSession(id)?.config || adapter.sessionConfigs?.get(id);
  return permission(config || { permissionMode: fallback, autoAccept }).permissionMode;
}
function skillRecord(database, command) {
  return database.getSkill?.('dir:' + command) || database.getAllSkills?.().find(skill=>String(skill.slashCommand||'').replace(/^\//,'')===command) || database.getSkillByCommand(command);
}
function skillEnabled(database, command) {
  const stored = skillRecord(database, command);
  return !stored || (stored.isEnabled !== false && stored.isEnabled !== 0);
}
function directorySkill(gateway, command) {
  return skillEnabled(gateway.database, command) ? gateway.dirSkillCache.get(command) : undefined;
}
function permissionHook(adapter, id, config) {
  const check=adapter.createPermissionHandler(id,config.autoAccept,config.sessionMode,config.permissionMode,config.disallowedTools,config.planModeEnabled);
  return {matcher:'.*',hooks:[async input=>{
    await require('./turn-snapshot.cjs').beforeTool(id,input.tool_name);
    // Interactive questions and plan approval keep their dedicated SDK callbacks.
    if (['AskUserQuestion','ExitPlanMode'].includes(input.tool_name)) return {continue:true};
    const result=await check(input.tool_name,input.tool_input || {});
    return {hookSpecificOutput:{hookEventName:'PreToolUse',permissionDecision:result.behavior==='allow'?'allow':'deny',...(result.message?{permissionDecisionReason:result.message}:{})}};
  }]};
}
module.exports = { permission, runtimePermission, skillRecord, skillEnabled, directorySkill, permissionHook };
