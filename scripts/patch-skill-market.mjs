export function patchSkillMarketMain(source) {
  source = source.replace('function $8(a02){const bP2=a7z,', 'function $8(a02){if(/[<>\\[\\]`|;&\\r\\n]/.test(a02||"")||/^npx\\s+(?:-y\\s+)?skills\\s+(?!add\\b)/i.test(a02||""))throw new Error("安装命令包含示例占位符或不是技能安装命令，请改用 GitHub 技能目录导入");const bP2=a7z,');
  source = source.replace('const a0c="HEAD"===a08?"main":a08,a0d=', 'const a0c=a08,a0d=');
  source = source.replace("['map'](a0f=>({'path':a0f[\"path\"],'type':a0f[\"type\"]})),'branch':a0c", "['map'](a0f=>({'path':a0f[\"path\"],'type':a0f[\"type\"],sha:a0f.sha,size:a0f.size,mode:a0f.mode})),'branch':a0c,truncated:a0b.truncated");
  const inferStart = source.indexOf('const a0b=D9(a07["content"]);');
  if (inferStart >= 0) {
    const inferEnd = source.indexOf('return a08["promptTemplate"]||"prompt"===a08["type"]?', inferStart);
    if (inferEnd < inferStart) throw new Error('Skill document inference layout changed');
    source = source.slice(0,inferStart) + source.slice(inferEnd);
  }
  const anchor = 'if(!a07)return null;const a08=a04(a07["content"],a03)';
  const replacement = 'if(!a07)return null;const repositoryPlan=require("./extensions/public-skill-install.cjs").repositoryPlan(a02,a03,a07);if(repositoryPlan)return{...repositoryPlan,detailMarkdown:a07.content,detailPath:a07.path,detailBranch:a07.branch,githubUrl:"https://github.com/"+a02+"/blob/"+a07.branch+"/"+a07.path,parsed:a04(a07.content,a03)};const a08=a04(a07["content"],a03)';
  if (!source.includes(replacement)) {
    if (source.split(anchor).length !== 2) throw new Error('Skill classification layout changed');
    source = source.replace(anchor, replacement);
  }
  const installAnchor = 'if(\'npx\'===a0t["method"]){const a0E=a0t["inferredInstallCommand"]';
  const installReplacement = `if(a0t.method==="repository"){
    const installId=/^[a-zA-Z0-9-]{8,80}$/.test(a0q.installId||"")?a0q.installId:require("node:crypto").randomUUID();
    const log=(line,type="stdout")=>KI(F9,{installId,line,type});
    try{
      log("正在启动安装...","info");
      const tree=await R9(a0r,a0s);
      if(tree?.truncated)throw new Error("仓库文件列表不完整，请通过 GitHub 目录导入该技能");
      const data=await require("./extensions/public-skill-install.cjs").installRepositorySkill({source:a0o,skillId:a0p,detail:a0t,tree:tree?.tree,skillsRoot:await iB.getSkillsRootDir(),fetchFile:(url,options)=>fetch(url,{...options,headers:{"User-Agent":"ShineAI-Skill-Import"}}),parseSkill:zB,database:a0b,onLog:log});
      log("✓ 安装完成","done");return{success:true,data};
    }catch(error){log("✗ 安装失败: "+error.message,"error");throw error;}
  }if('npx'===a0t["method"]){const a0E=a0t["inferredInstallCommand"]`;
  if (!source.includes(installReplacement)) {
    const previousStart = source.indexOf('if(a0t.method==="repository"){');
    if (previousStart >= 0) {
      const previousEnd = source.indexOf(installAnchor, previousStart);
      if (previousEnd < previousStart) throw new Error('Skill installation patch layout changed');
      source = source.slice(0,previousStart) + installReplacement + source.slice(previousEnd+installAnchor.length);
    } else {
      if (source.split(installAnchor).length !== 2) throw new Error('Skill installation layout changed');
      source = source.replace(installAnchor, installReplacement);
    }
  }
  source = source.replace('a0G=Date["now"]()+\'-\'+Math[\'random\']()["toString"](0x24)[\'slice\'](0x2,0x6);KI(F9', 'a0G=/^[a-zA-Z0-9-]{8,80}$/.test(a0q.installId||"")?a0q.installId:require("node:crypto").randomUUID();KI(F9');
  if (!source.includes('if(!a0H.skills?.length)')) source = source.replace('return KI(F9,{\'installId\':a0G,\'line\':p[\'t\']("mainIpc:registry.installDone")', 'if(!a0H.skills?.length)throw new Error("安装命令已结束，但未发现有效技能，未完成安装");for(const skill of a0H.skills){skill.tags=[...new Set([...(skill.tags||[]),"mk:"+a0o+"/"+a0p])];skill.isInstalled=true;skill.isEnabled=true;a0b.getSkill(skill.id)?a0b.updateSkill(skill.id,skill):a0b.createSkill(skill);}return KI(F9,{\'installId\':a0G,\'line\':p[\'t\']("mainIpc:registry.installDone")');
  return source;
}

export function patchSkillMarketRenderer(source) {
  // SKILL.md repositories install their directory, irrespective of commands in the
  // document. Older explicit CLI packages retain their separate confirmation.
  source = source.replace('classification.method === "prompt" && /* @__PURE__ */ jsxRuntimeExports.jsx("span",', '(classification.method === "prompt" || classification.method === "repository") && /* @__PURE__ */ jsxRuntimeExports.jsx("span",');
  source = source.replace('children: instance.t("settingsProviderGuideCatalog:skillManager.classify.prompt") }),', 'children: classification.method === "repository" ? (instance.language.startsWith("zh") ? "技能目录 · 下载到本地" : "Skill directory · local download") : instance.t("settingsProviderGuideCatalog:skillManager.classify.prompt") }),');
  source = source.replace('done: isDone\n', 'done: isDone,\n            failed: data.type === "error" || prev.failed\n');
  const start = source.indexOf('  const installSkillInternal = async (skill2, options2) => {');
  const end = source.indexOf('  const handleInstall = async (skill2) => {', start);
  if (start < 0 || end < start) throw new Error('Skill install result UI layout changed');
  let install = source.slice(start, end);
  if (!install.includes('        return true;')) install = install.replace('        onInstalled();\n', '        onInstalled();\n        return true;\n');
  if (!install.includes('    return false;')) install = install.replace('    }\n  };\n', '    }\n    return false;\n  };\n');
  source = source.slice(0, start) + install + source.slice(end);
  source = source.replace('      await installSkillInternal(skill2, { confirmedInstallCommand: command2 });', '      const success = await installSkillInternal(skill2, { confirmedInstallCommand: command2 });\n      setNpxLogPanel((prev) => prev ? { ...prev, done: true, failed: !success } : prev);');
  source = source.replace('npxLogPanel.done ? instance.t("settingsProviderGuideCatalog:skillManager.actions.installDone")', 'npxLogPanel.done ? (npxLogPanel.failed ? (instance.language.startsWith("zh") ? "安装失败" : "Installation failed") : instance.t("settingsProviderGuideCatalog:skillManager.actions.installDone"))');
  const tracked = `  const runTrackedSkillInstall = async (skill2, options2 = {}) => {
    const installId = crypto.randomUUID();
    setNpxLogPanel({ skillName: skill2.name, installId, logs: [], done: false, failed: false });
    const unsubscribe = window.shineAI.registry.onSkillsShInstallProgress(data => {
      if (data.installId !== installId) return;
      setNpxLogPanel(prev => prev?.installId === installId ? { ...prev, logs: [...prev.logs, { line: data.line, type: data.type }].slice(-500), done: data.type === "done" || data.type === "error", failed: data.type === "error" || prev.failed } : prev);
    });
    try {
      const success = await installSkillInternal(skill2, { ...options2, installId });
      setNpxLogPanel(prev => prev?.installId === installId ? { ...prev, done: true, failed: !success } : prev);
    } finally { unsubscribe?.(); }
  };
`;
  if (!source.includes('  const runTrackedSkillInstall = async')) {
    const pos=source.indexOf('  const handleInstall = async (skill2) => {',start);
    source=source.slice(0,pos)+tracked+source.slice(pos);
  }
  source=source.replace('      await installSkillInternal(skill2);\n      return;', '      if (classification.method === "repository") await runTrackedSkillInstall(skill2);\n      else await installSkillInternal(skill2);\n      return;');
  if(!source.includes('if (data.method === "repository") { await runTrackedSkillInstall(skill2); return; }')) source=source.replace('      const result2 = await shineAI?.registry?.installSkillsSh?.(skill2.source, skill2.skillId);', '      if (data.method === "repository") { await runTrackedSkillInstall(skill2); return; }\n      const result2 = await shineAI?.registry?.installSkillsSh?.(skill2.source, skill2.skillId);');
  const confirmStart=source.indexOf('  const confirmNpxInstall = async () => {',start),confirmEnd=source.indexOf('  const handleAiInstall = async (skill2) => {',confirmStart);
  if(confirmStart<0||confirmEnd<confirmStart)throw new Error('Skill confirmation UI layout changed');
  source=source.slice(0,confirmStart)+`  const confirmNpxInstall = async () => {
    if (!pendingNpxInstall) return;
    const { skill: skill2, command: command2 } = pendingNpxInstall;
    setPendingNpxInstall(null);
    await runTrackedSkillInstall(skill2, { confirmedInstallCommand: command2 });
  };
`+source.slice(confirmEnd);
  return source;
}
