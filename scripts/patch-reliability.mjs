function once(source, from, to, label) {
  if (source.includes(to)) return source;
  if (source.split(from).length !== 2) throw new Error('Reliability patch layout changed: '+label);
  return source.replace(from,to);
}
function replaceSection(source, start, end, replacement) {
  if (replacement && source.includes(replacement)) return source;
  const a=source.indexOf(start),b=source.indexOf(end,a);
  if (a<0 && !replacement && source.includes(end)) return source;
  if (a<0 || b<a) throw new Error('Reliability section layout changed: '+start);
  return source.slice(0,a)+replacement+source.slice(b);
}
export function patchReliabilityMain(source) {
  source=once(source,'const a0f=a0b["createMcp"](a0d);','const a0f=require("./extensions/mcp-save.cjs").saveMcp(a0b,a0d);','MCP create persistence');
  source=once(source,'return a0b["updateMcp"](a0d,a0f),{\'success\':!0x0};','return {success:true,data:require("./extensions/mcp-save.cjs").saveMcp(a0b,a0f,a0d)};','MCP update persistence');
  source=once(source,'if(a0b["toggleMcp"](a0d,a0f),a0f){','if(require("./extensions/mcp-save.cjs").toggleMcp(a0b,a0d,a0f),a0f){','MCP toggle persistence');
  source=once(source,'console["error"]("[McpRepository] create error:",a05);','throw new Error("MCP 数据库写入失败，请检查配置或日志");','MCP insert failure');
  source=once(source,'console[\'error\']("[McpRepository] update error:",a06);','throw new Error("MCP 数据库更新失败，请检查配置或日志");','MCP update failure');
  source=replaceSection(source,'r["ipcMain"]["handle"]("skill:install-from-registry",',';const a0c=0x36ee80;',`r["ipcMain"]["handle"]("skill:install-from-registry",async(_event,item)=>{try{return await require("./extensions/market-install.cjs").installRegistrySkill(item,{database:a0b,fetchFile:fetch,parseBody:dB});}catch(error){return{success:false,error:error.message};}})`);
  source=replaceSection(source,'r["ipcMain"][\'handle\']("registry:install-mcp",',',r["ipcMain"]["handle"]("registry:list-skill-repos",',`r["ipcMain"]['handle']("registry:install-mcp",async(_event,item,envVars)=>{try{return require("./extensions/market-install.cjs").installMarketMcp(item,envVars,a0b);}catch(error){return{success:false,error:error.message};}})`);
  source=once(source,`return{'success':!0x0,'message':p['t']("mainIpc:mcp.configValid")};`,`return{success:false,error:"MCP 配置不完整：请选择连接方式并填写启动命令或 HTTP 服务地址"};`,'invalid MCP config');
  source=replaceSection(source,'async function S8(a02,a03,a04){','function I8(a02)',`async function S8(command,args,env){return require("./extensions/mcp-probe.cjs").probeMcp(command,args,env);}`);
  const body=(response,protocol,model,time) => `await require("./extensions/provider-probe-body.cjs").readProbeBody(${response},"${protocol}",${model},Math.max(1,10000-(Date.now()-${time})))`;
  source=once(source,`let a0j=a06;try{const a0k=await a0f["json"]();"string"==typeof a0k["model"]&&a0k["model"]["trim"]()&&(a0j=a0k['model']["trim"]());}catch{}`,`let a0j=${body('a0f','chat','a06','a0a')};`,'chat body');
  source=once(source,`else try{const a0u=await a0p["json"]();"string"==typeof a0u["model"]&&a0u["model"]["trim"]()&&(a0t=a0u["model"]["trim"]());}catch{}`,`else a0t=${body('a0p','responses','a06','a0b')};`,'responses body');
  source=once(source,`let a0m=a09;try{const a0n=await a0i["json"]();'string'==typeof a0n["model"]&&a0n["model"]["trim"]()&&(a0m=a0n["model"]["trim"]());}catch{}`,`let a0m=${body('a0i','claude','a09','a0f')};`,'claude body');
  source=once(source,`if(a0h['ok'])return WY({'success':!0x0,'status':'ok','category':"http",'scope':"none",'httpStatus':a0h["status"]`, `if(a0h['ok']&&(await require("./extensions/provider-probe-body.cjs").readProbeBody(a0h,"gemini",a09,Math.max(1,10000-(Date.now()-a0d)))))return WY({'success':!0x0,'status':'ok','category':"http",'scope':"none",'httpStatus':a0h["status"]`,'gemini body');
  return source;
}

export function patchReliabilityRenderer(source) {
  source=replaceSection(source,'    if (!result2?.success) {\n      const skillData = {','    if (result2?.success) {\n      setSuccessIds((prev) => new Set(prev).add(item.id));', '');
  source=once(source,'      if (detailSeqRef.current !== seq) return;\n      setDetailTest(buildState("error", TEST_WATCHDOG_MESSAGE', '      if (detailSeqRef.current !== seq) return;\n      detailSeqRef.current += 1;\n      setDetailTest(buildState("error", TEST_WATCHDOG_MESSAGE','draft timeout');
  source=once(source,'      if (cardSeqRef.current[provider2.id] !== seq) return;\n      setCardTests((current) => ({\n        ...current,\n        [provider2.id]: buildState("error", TEST_WATCHDOG_MESSAGE', '      if (cardSeqRef.current[provider2.id] !== seq) return;\n      cardSeqRef.current[provider2.id] += 1;\n      setCardTests((current) => ({\n        ...current,\n        [provider2.id]: buildState("error", TEST_WATCHDOG_MESSAGE','card timeout');
  source=once(source,'        if (listResult.success) {\n          set2({ servers: listResult.data || [] });\n        }\n        return true;', '        if (listResult.success && listResult.data?.some(server => server.id === result2.data?.id)) {\n          set2({ servers: listResult.data || [], marketError: null });\n          return true;\n        }\n        set2({ marketError: instance.language.startsWith("zh") ? "MCP 配置尚未读回，请刷新列表确认" : "Refresh the list to confirm the saved MCP configuration" });\n        return false;','MCP saved result');
  return source;
}
