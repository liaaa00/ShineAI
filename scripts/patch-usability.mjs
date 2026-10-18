function once(source,from,to) {
  if(source.includes(to))return source;
  if(source.split(from).length!==2)throw new Error('Usability patch layout changed: '+from.slice(0,100));
  return source.replace(from,to);
}
function section(source,start,end,replace) {
  const a=source.indexOf(start),b=source.indexOf(end,a+start.length);
  if(a<0||b<a)throw new Error('Usability section missing: '+start);
  return source.slice(0,a)+replace(source.slice(a,b))+source.slice(b);
}
export function patchUsabilityMain(source) {
  source=once(source,'for(const a08 of Ube)this["skillRepo"]["insertOrIgnore"](a08);','require("./extensions/builtin-skills.cjs").installBuiltinSkills(this,Ube);');
  const start='r["ipcMain"]["handle"]("registry:fetch-skillssh-leaderboard",';
  return section(source,start,',r["ipcMain"]["handle"]("registry:fetch-skills-sh",',()=>start+'async(_event,options)=>require("./extensions/skill-leaderboard.cjs").fetchLeaderboard({force:options?.force===true}))');
}
export function patchUsabilityPreload(source) {
  return once(source,'fetchLeaderboard: () => electron.ipcRenderer.invoke(REGISTRY_FETCH_SKILLSSH_LEADERBOARD),','fetchLeaderboard: (options) => electron.ipcRenderer.invoke(REGISTRY_FETCH_SKILLSSH_LEADERBOARD, { force: options?.force === true }),');
}
export function patchUsabilityRenderer(source) {
  source=source.replace(/\r\n/g,'\n');
  source=once(source,'createThenBind: "创建后即可在模型分配中绑定业务位"','createThenBind: "创建并测试连接后，可在会话中选择；辅助模型按需分配"');
  source=once(source,'createThenBind: "Once created, you can bind business slots in Model assignment"','createThenBind: "Create and test, then select it in chat; assign optional helper models as needed"');
  // Keep ordinary translation resources in place; change the actual visible guide.
  const guideStart='    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "px-4 py-1.5 text-caption text-text-muted flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-border flex-shrink-0", children: [';
  const guideEnd='    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 flex min-h-0 min-w-0 overflow-auto", children: [';
  if(!source.includes('"data-testid":"provider-setup-guide"')) source=section(source,guideStart,guideEnd,()=>`    jsxRuntimeExports.jsxs("div", { className: "px-4 py-2 text-caption text-text-muted flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-border flex-shrink-0", "data-testid":"provider-setup-guide", children: [
      jsxRuntimeExports.jsx("span", { children: instance.language.startsWith("zh") ? "使用自己的服务商：接入服务 → 测试连接 → 在会话中选择模型。标题、整理和翻译等辅助功能在「模型分配」中单独配置。" : "Connect your provider → test the connection → select a model in chat. Configure optional title, organization and translation models under Model assignments." }),
      jsxRuntimeExports.jsx("button", {type:"button",onClick:onCreate,className:"text-accent-blue hover:underline",children:instance.language.startsWith("zh")?"接入服务":"Connect provider"}),
      jsxRuntimeExports.jsx("button", {type:"button",onClick:()=>onFilterChange({type:"builtin",adapter:"all"}),className:"text-accent-blue hover:underline",children:instance.language.startsWith("zh")?"查看本机 CLI":"Local CLI providers"})
    ] }),\n`);
  source=section(source,'function EmptyState() {','function ProviderDetail({',part=> {
    if(part.includes('data-testid":"provider-empty-guide'))return part;
    return `function EmptyState() {
      return jsxRuntimeExports.jsxs("div",{className:"flex h-full min-h-[360px] flex-col justify-center gap-4 px-8 text-text-secondary", "data-testid":"provider-empty-guide",children:[
        jsxRuntimeExports.jsx("p",{className:"text-sm font-medium",children:instance.language.startsWith("zh")?"先接入你自己的模型服务":"Connect your model provider"}),
        jsxRuntimeExports.jsx("p",{className:"text-caption text-text-muted",children:instance.language.startsWith("zh")?"点击上方「接入服务」或「新增模型服务」。使用本机 CLI 时，可直接选择左侧对应卡片。":"Use Connect provider or Add provider above, or select a local CLI card on the left."}),
        jsxRuntimeExports.jsx("p",{className:"text-caption text-text-muted",children:instance.language.startsWith("zh")?"按服务商文档选择接入方式，填入地址、密钥和模型，保存后测试连接，再在会话里选用。模型名称不能代表协议；本地版不附赠官方模型额度。":"Choose the integration documented by your provider, enter its URL, key and model, save and test it, then select it in chat. A model name does not identify its protocol. This edition does not include hosted model credits."})
      ]});
    }\n`;
  });
  source=section(source,'function ProviderDetail({','function ProviderManagerShell({',part=> {
    part=once(part,'            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "col-span-2 sm:col-span-1", children: [\n              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-caption text-text-muted mb-1", children: instance.t("settingsProvider:detail.adapterType") }),','            !isCreating && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "col-span-2 sm:col-span-1", children: [\n              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-caption text-text-muted mb-1", children: instance.t("settingsProvider:detail.adapterType") }),');
    // Integration selection is a basic setup choice, visible before credentials.
    part=once(part,'      showSimpleCreate ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [',`      isCreating && jsxRuntimeExports.jsxs("div", {className:"px-1 space-y-2", "data-testid":"provider-integration",children:[
        jsxRuntimeExports.jsx("label",{htmlFor:"provider-integration-type",className:"block text-caption text-text-secondary",children:instance.language.startsWith("zh")?"接入方式":"Integration"}),
        jsxRuntimeExports.jsx("select",{id:"provider-integration-type",value:adapterType,onChange:e=>onChange({adapterType:e.target.value}),className:inputCls$7,children:ADAPTER_TYPE_OPTIONS.map(o=>jsxRuntimeExports.jsx("option",{value:o.value,children:o.value==="claude-sdk"?"Claude Code / Anthropic Messages":o.value==="codex-appserver"?"Codex / Responses":o.label},o.value))}),
        jsxRuntimeExports.jsx("p",{className:"text-caption text-text-muted",children:instance.language.startsWith("zh")?"OpenAI 兼容中转选择 OpenAI API；Anthropic Messages 中转选择 Claude；Responses 中转选择 Codex。按中转文档确认，不按模型名猜测。":"Choose OpenAI API, Claude for Anthropic Messages, or Codex for Responses according to your gateway documentation, not its model name."})
      ]}),
      showSimpleCreate ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [`);
    return part;
  });
  const marketStart=source.indexOf('function SkillsShMarketplace('),marketEnd=source.indexOf('\nfunction ',marketStart+10);
  if(marketStart<0||marketEnd<marketStart)throw new Error('Skill marketplace component missing');
  const beforeMarket=source.slice(0,marketStart),afterMarket=source.slice(marketEnd);
  source=source.slice(marketStart,marketEnd);
  source=once(source,'function SkillsShMarketplace({ installedSkills, onInstalled }) {','function SkillsShMarketplace({ installedSkills, onInstalled }) {\n  const [marketInfo,setMarketInfo]=reactExports.useState(null);');
  const fetchStart='  const fetchLeaderboard = async (';
  source=section(source,fetchStart,'  const skillKey = ',()=>`  const fetchLeaderboard = async (force = false) => {
    setLoading(true);setError(null);setSelectedSkill(null);setSkillDetail(null);setPage(0);
    try {
      const result2=await window.shineAI.registry.fetchLeaderboard({force});
      setMarketInfo({fetchedAt:result2.fetchedAt,stale:result2.stale});
      if(Array.isArray(result2.data))setSkills(result2.data);
      if(!result2.success)setError(result2.error || (instance.language.startsWith("zh")?"社区市场加载失败，请重试。":"Could not load the community market. Please retry."));
    } catch {
      setError(instance.language.startsWith("zh")?"社区市场暂不可用，请重试。":"Community market unavailable. Please retry.");
    } finally {setLoading(false);}
  };
`);
  source=once(source,'          onClick: fetchLeaderboard,','          onClick: () => fetchLeaderboard(true),');
  source=once(source,'children: loading2 ? instance.t("settingsProviderGuideCatalog:skillManager.loading") : instance.t("common:actions.refresh")','children: loading2 ? instance.t("settingsProviderGuideCatalog:skillManager.loading") : error2 ? (instance.language.startsWith("zh")?"重试":"Retry") : instance.t("common:actions.refresh")');
  source=once(source,'    error2 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className:',`    marketInfo?.fetchedAt && jsxRuntimeExports.jsx("p",{role:"status",className:"mb-2 text-caption text-text-muted",children:(instance.language.startsWith("zh")?(marketInfo.stale?"正在显示上次成功获取的缓存 · ":"列表更新时间 · "):(marketInfo.stale?"Showing cached results · ":"Updated · "))+new Date(marketInfo.fetchedAt).toLocaleString()}),
    error2 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { role:"alert", className:`);
  source=once(source,'] }) }) : filteredSkills.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className:','] }) }) : error2 && skills2.length === 0 ? jsxRuntimeExports.jsx("div",{className:"flex-1 flex items-center justify-center text-text-muted text-sm",children:instance.language.startsWith("zh")?"列表未加载，点击上方「重试」。":"The list has not loaded. Use Retry above."}) : filteredSkills.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className:');
  source=beforeMarket+source+afterMarket;
  source=once(source,'function NoviceWorkspacePicker({\n  customCwd,','function NoviceWorkspacePicker({\n  resolvedWorkingDirectory,\n  customCwd,');
  source=once(source,'      NoviceWorkspacePicker,\n      {\n        customCwd,','      NoviceWorkspacePicker,\n      {\n        resolvedWorkingDirectory,\n        customCwd,');
  if(!source.includes('function workingDirectoryNote('))source=source.replace('function NoviceWorkspacePicker(',`function workingDirectoryNote(resolvedWorkingDirectory) {
    const homeDirectory=window.shineAI.app.getHomePath().replace(/[\\\\/]+$/, "");
    const projectDirectory=[homeDirectory,...NOVICE_PATH_SEGMENTS].join(homeDirectory.includes("\\\\")?"\\\\":"/");
    const actualDirectory=resolvedWorkingDirectory || projectDirectory;
    return (instance.language.startsWith("zh")?"工作目录：":"Working directory: ")+actualDirectory+(!resolvedWorkingDirectory?(instance.language.startsWith("zh")?"（发送时按任务名创建子目录）":" (a task subfolder is created when sent)"):isScratchWorkingDirectory(actualDirectory)?(instance.language.startsWith("zh")?"（发送时创建独立子目录）":" (a new subfolder is created when sent)"):"");
  }
  function NoviceWorkspacePicker(`);
  source=section(source,'function NoviceWorkspacePicker({','function Novice',part=>{
    part=once(part,'  const recentDirEntries = (() => {',`  const directoryNote=workingDirectoryNote(resolvedWorkingDirectory);
  const recentDirEntries = (() => {`);
    part=once(part,'        title: displayTitle,','        title: directoryNote,');
    part=once(part,'        ref: btnRef,','        ref: btnRef, "data-testid":"workspace-picker",');
    part=once(part,'          children: [\n            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "shrink-0", children: [',`          children: [
            jsxRuntimeExports.jsxs("div",{className:"px-3 py-2 border-b border-border text-caption text-text-secondary",children:[jsxRuntimeExports.jsx("p",{className:"break-all",children:directoryNote}),jsxRuntimeExports.jsx("p",{className:"mt-1 text-text-muted",children:instance.language.startsWith("zh")?"这是任务执行的位置；可访问范围由旁边的目录权限单独控制。":"This is where the task runs. The separate directory permission controls its access scope."})]}),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "shrink-0", children: [`);
    return part;
  });
  source=section(source,'function NoviceHeroScreen(', '\nconst MODE_BADGES',part=>once(part,
    '        !embedded ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 px-4 text-center text-caption text-text-muted", children: t2("novice:hero.input.hint") }) : null,',
    `        jsxRuntimeExports.jsx("p", {"data-testid":"working-directory-summary",role:"note",title:workingDirectoryNote(resolvedWorkingDirectory),className:"mt-1 mx-auto w-full max-w-[760px] truncate px-4 text-caption text-text-muted",children:workingDirectoryNote(resolvedWorkingDirectory)}),
        !embedded ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 px-4 text-center text-caption text-text-muted", children: t2("novice:hero.input.hint") }) : null,`));
  return source;
}
