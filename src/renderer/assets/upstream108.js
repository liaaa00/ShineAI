// Selected official 1.0.8 UI, sharing existing application stores.
export function createUpstream108UI({useTranslation,create$5,reactExports,useUIStore,jsxRuntimeExports,createLucideIcon,instance,useWorkbenchDockStore,reactDomExports,useSessionStore,cn,useFileManagerStore,useWorkGroupStore,MarkdownRenderer$1}){
instance.addResourceBundle("zh-CN","dailyBoard",{"section":{"title":"工作日报","description":"按天汇总本机会话：已完成 / 进行中 / 待决策"},"modal":{"close":"关闭"},"entry":{"openToday":"打开今日工作日报","generate":"生成工作日报","tray":"打开工作日报","workbenchToolbar":"日报"},"toolbar":{"prevDay":"前一天","nextDay":"后一天","today":"今天","calendar":"日历","generate":"生成日报","refresh":"刷新","generating":"正在生成…","export":"导出","exportHtml":"导出 HTML","exportPng":"导出 PNG","exportPdf":"导出 PDF","schedule":"定时设置"},"summary":{"title":"总述","empty":"暂无总述","collapse":"收起总述","expand":"展开总述"},"kpi":{"total":"事项","done":"已完成","doing":"进行中","wait":"待决策","outputs":"产出"},"filter":{"lanes":"泳道","status":"状态","onlyWait":"只看待决策","search":"搜索","searchPlaceholder":"搜索事项","devices":"设备","all":"全部","clear":"清除筛选"},"view":{"label":"视图","timeline":"时间轴","list":"列表"},"legend":{"title":"图例","done":"已完成","doing":"进行中","wait":"待决策","error":"出错"},"footer":{"source":"数据来源：本机会话记录","localOnly":"仅包含本机会话","otherDevices":"另有 {{count}} 台在线设备未汇总","aggregated":"已汇总 {{count}} 台设备","staleSnapshot":"{{count}} 台离线，使用 {{time}} 的快照","failedCount":"{{count}} 台拉取失败"},"status":{"idle":"未生成","generating":"AI 整理中 {{done}}/{{total}}","generated":"已生成","generatedAt":"已生成 · {{time}}","partial":"部分生成","failed":"生成失败","scheduled":"定时生成","catchup":"定时生成（补跑，延迟 {{delay}}）","delayMinutes":"{{n}} 分钟","delayHours":"{{h}} 小时","delayHoursMinutes":"{{h}} 小时 {{m}} 分钟"},"state":{"emptyTitle":"今天还没有工作记录","emptyHint":"开始一个会话后会自动出现在这里","addManual":"补录线下工作","generating":"AI 整理中 {{done}}/{{total}}","cancel":"取消","noModel":"未配置后台模型，日报暂由规则整理","assignModel":"去分配","failed":"生成失败","failedWith":"生成失败：{{message}}","partialFailed":"部分会话整理失败，已保留规则结果","retry":"重试","stale":"{{count}} 个会话有新动静·刷新","refresh":"刷新","archived":"历史日期原始记录已归档，显示简版","pendingTidy":"待整理","lowConfidence":"规则推不出，待整理","noSnapshot":"这一天还没有生成日报"},"card":{"statusDone":"已完成","statusDoing":"进行中","statusWait":"待决策","lowConfidence":"低置信","deviceLocal":"本机","remoteReadonly":"远端设备·只读","remoteReadonlyHint":"该条来自其他设备，仅同步摘要，不能在本机编辑/合并/拆分。","goAnswer":"去回答","openSession":"打开会话","sessionDeleted":"源会话已删除","outputsCount":"{{count}} 项产出","live":"进行中","since":"起","now":"{{time}} 现在","nextDay":"次日"},"lane":{"scheduled":"定时任务","other":"其他","count":"{{count}} 项","collapse":"折叠泳道","expand":"展开泳道"},"drawer":{"title":"事项详情","status":"状态","lane":"泳道","timeRange":"时间段","sourceSession":"来源会话","conclusion":"结论","outputs":"产出","decision":"要你决定","risks":"风险","edit":"编辑","source":"来源","close":"关闭","empty":"无"},"source":{"handoff":"交接段","aiHandoff":"AI 交接","aiEdit":"AI 整理","rule":"规则","manual":"手动"},"schedule":{"title":"定时设置","loading":"加载设置…","loadFailed":"设置加载失败","timezone":"时区","nextSlot":"下次触发","nextNone":"未开启定时","enabled":"开启定时生成","times":"生成时间点","addTime":"添加时间","timeInvalid":"时间格式不对，请用 HH:mm","timeDup":"该时间点已存在","timesMax":"最多 6 个时间点","remove":"移除","workdaysOnly":"只在工作日（周一至周五）","skipDates":"跳过日期","addSkipDate":"添加跳过日期","catchup":"错过时自动补跑（上一工作日）","skipIdle":"无新动静时跳过","channels":"通知渠道","channel_desktop":"应用内提醒","channel_feishu":"飞书","channel_telegram":"Telegram","channel_dingtalk":"钉钉","channel_mobile":"手机收件箱（PNG）","channelUnavailable":{"unconfigured":"未配置","not_logged_in":"未登录","no_paired_phone":"未绑定手机"},"channelMobileHint":"自动导出保存在系统“文档”文件夹 → ShineAI → Daily reports。","autoExport":"定时后自动导出","autoExportOff":"关闭","hideLocalPaths":"隐藏本地路径（导出/推送只留文件名）","excludeGroups":"排除分组","excludeDirs":"排除工作目录","excludeDirsPlaceholder":"每行一个目录前缀","saving":"保存中…","saved":"已保存","saveFailed":"保存失败：{{message}}"},"export":{"hidePaths":"隐藏本地路径","busy":"导出中…","done":"已导出：{{path}}","open":"打开位置","failed":"导出失败：{{message}}"},"schedulePrompt":{"text":"已生成第一份工作日报。开启定时生成，可在每天固定时间自动出日报。","enable":"开启定时","dismiss":"不再提示"},"edit":{"dialog":{"manual":"补录线下工作","merge":"合并条目","split":"拆分条目"},"mergeHint":"将合并选中的 {{count}} 项（成员隐藏）","title":"标题","summary":"一句话摘要","partTitle":"第 {{n}} 部分标题","addPart":"加一部分","removePart":"删一部分","needTwoParts":"至少两部分且都要填标题","lane":"泳道","start":"开始时间","end":"结束时间","save":"保存","hidden":"隐藏这条","scopeToday":"仅今天","scopeAlways":"以后都归这组","split":"拆分","undo":"删除合并/拆分","merge":"合并","selected":"已选 {{count}} 项","aiConflict":"AI 有新判断","acceptAi":"采用 AI 判断","keepMine":"保持我的"},"calendar":{"hasSnapshot":"有快照","noSnapshot":"无"}},true,true);
instance.addResourceBundle("zh-CN","webLlm",{"title":"网页大模型","description":"让 AI 借用你已登录的网页版大模型（Gemini、ChatGPT、DeepSeek 等）来写代码、答问题，不消耗 API 额度。","loadError":"读取网页大模型设置失败","disabledHint":"开启后，AI 可以在内置浏览器里打开你已登录的网页大模型，把问题发过去并取回回答。打开开关后即可添加站点并一键测试。","browserUnavailable":"内置浏览器的 AI 操作通道没有开启，测试、登录和拾取元素都用不了。","footnote":"所有操作都在内置浏览器里完成，不读写系统剪贴板；提示词、文件内容会发给对应的第三方网站。","master":{"title":"启用网页大模型","description":"默认关闭。开启后 AI 会话里可以使用 web_llm_ask 工具。"},"risk":{"title":"开启前请了解风险","intro":"网页大模型通过自动操作网页来工作，开启前请确认你了解以下几点：","terms":"部分网站的服务条款可能禁止自动化操作。","account":"频繁自动操作可能触发网站风控，导致账号被限制。","thirdParty":"提示词和你附带的文件内容会发送给对应的第三方网站。","acknowledge":"我已了解以上风险","confirm":"开启"},"sites":{"title":"站点"},"picker":{"title":"添加站点","description":"选一个你已经登录过（或准备登录）的网站，随后一键测试即可使用。","custom":"自定义网站"},"form":{"name":"名称","namePlaceholder":"例如：公司内部助手","url":"新对话网址","nameRequired":"请填写名称","urlInvalid":"请填写以 http:// 或 https:// 开头的网址","maxChars":"单次最大字数","maxCharsHint":"超过就拒绝发送并建议分批，不会截断；留空用默认值。","maxCharsInvalid":"请填写正整数，或留空用默认值"},"advanced":{"title":"高级：手动指定页面元素","description":"自动识别失败时，在网页上点选对应元素，优先级高于自动识别。","auto":"自动识别"},"fields":{"input":"输入框","send":"发送按钮","message":"回复区","copy":"复制按钮","stop":"停止按钮"},"actions":{"test":"测试","testing":"测试中","login":"去登录","edit":"编辑","delete":"删除","retest":"重新测试","pick":"拾取元素","clear":"清除","setDefault":"设为默认","save":"保存","cancel":"取消","add":"添加","addSite":"添加站点","retry":"重试","remove":"移除","openBrowserSettings":"去开启"},"status":{"ready":"就绪","untested":"未测试","not_logged_in":"未登录","needs_calibration":"需重新标定","captcha":"验证码","error":"出错"},"steps":{"open":"打开页面","login":"检查登录","input":"输入","send":"发送","wait":"等待回复","extract":"抽取并校验","foreground":"切到前台重试","done":"完成"},"errorCodes":{"not_logged_in":"站点未登录","captcha":"遇到验证码，需要你在浏览器里处理","page_changed":"网页结构变了，自动识别失败","input_failed":"无法在输入框里写入内容","send_failed":"无法发送消息","quota_exceeded":"该站点额度用完或被限流，建议换个站点","user_busy":"你正在操作这个网页，稍后再试","too_long":"内容超过站点字数上限，请分批发送","sensitive_file":"附带文件疑似含密钥等敏感信息，已拦截","site_not_found":"找不到这个站点","site_disabled":"该站点已停用","cdp_unavailable":"内置浏览器不可用","needs_calibration":"站点需要重新测试","risk_not_acknowledged":"尚未在设置里开启网页大模型"},"errors":{"generic":"操作失败，请稍后重试"},"progress":{"title":"测试结果","running":"正在测试…","elapsed":"已用 {{time}}"},"add":{"title":"添加 {{name}}","close":"关闭","steps":{"1":"打开并登录","2":"一键测试","3":"完成"},"loginHint":"会在内置浏览器里打开该网站。检测到已登录会自动打勾；如果你早已登录，也可以直接点「我已登录」。","openLogin":"打开 {{name}}","loginDetected":"已检测到登录","loginWatching":"正在检测登录状态…","next":"下一步：一键测试","manualLoggedIn":"我已登录，开始测试","ready":"{{name}} 已可以使用","done":"完成"},"site":{"isDefault":"默认站点","needsForegroundHint":"该站点需要页面在前台才会渲染回复，调用时会临时把浏览器切到前台。","needsForeground":"需前台","deleteTitle":"删除站点","deleteMessage":"确定删除「{{name}}」？它的测试结果和手动指定的元素都会一并删除。","lastSuccess":"上次成功 {{time}}","avg":"平均 {{time}}"},"pick":{"hint":"请在浏览器里点击「{{field}}」，按 Esc 取消","cancelled":"已取消拾取","saved":"已保存所选元素"},"pending":{"login":"请在浏览器里登录 {{name}}，登录后会自动检测","loginDetected":"已检测到 {{name}} 登录，正在回到设置…","back":"回到设置","dismiss":"不再检测"},"allowlist":{"title":"敏感文件放行名单","description":"疑似含密钥的文件默认不会发给网页模型。确认安全的文件可以加到这里放行；只能在这里改，AI 无法修改。","empty":"暂无放行的文件","add":"添加文件"},"tool":{"label":"网页大模型 · {{name}}","defaultSite":"默认站点","running":"等待网页回复","runningHint":"正在网页里等待回复，通常需要 15 秒到几分钟。可以点「在浏览器里看」查看过程。","elapsed":"用时 {{time}}","codeBlocks_one":"{{count}} 个代码块","codeBlocks_other":"{{count}} 个代码块","timedOut":"已超时，返回部分内容","failed":"调用失败","done":"已完成","viewInBrowser":"在浏览器里看","openSettings":"打开网页大模型设置"}},true,true);
instance.addResourceBundle("en-US","dailyBoard",{"section":{"title":"Work Log","description":"Daily summary of local sessions: done / in progress / needs decision"},"modal":{"close":"Close"},"entry":{"openToday":"Open today's work log","generate":"Generate work log","tray":"Open work log","workbenchToolbar":"Log"},"toolbar":{"prevDay":"Previous day","nextDay":"Next day","today":"Today","calendar":"Calendar","generate":"Generate","refresh":"Refresh","generating":"Generating…","export":"Export","exportHtml":"Export HTML","exportPng":"Export PNG","exportPdf":"Export PDF","schedule":"Schedule"},"summary":{"title":"Summary","empty":"No summary yet","collapse":"Collapse summary","expand":"Expand summary"},"kpi":{"total":"Items","done":"Done","doing":"In progress","wait":"Needs decision","outputs":"Outputs"},"filter":{"lanes":"Lanes","status":"Status","onlyWait":"Needs decision only","search":"Search","searchPlaceholder":"Search items","devices":"Device","all":"All","clear":"Clear filters"},"view":{"label":"View","timeline":"Timeline","list":"List"},"legend":{"title":"Legend","done":"Done","doing":"In progress","wait":"Needs decision","error":"Error"},"footer":{"source":"Source: local session records","localOnly":"Local sessions only","otherDevices":"{{count}} online device(s) not aggregated","aggregated":"Aggregated {{count}} device(s)","staleSnapshot":"{{count}} offline, using snapshot from {{time}}","failedCount":"{{count}} failed to fetch"},"status":{"idle":"Not generated","generating":"AI organizing {{done}}/{{total}}","generated":"Generated","generatedAt":"Generated · {{time}}","partial":"Partially generated","failed":"Generation failed","scheduled":"Scheduled run","catchup":"Scheduled run (catch-up, {{delay}} late)","delayMinutes":"{{n}} min","delayHours":"{{h}} h","delayHoursMinutes":"{{h}} h {{m}} min"},"state":{"emptyTitle":"No work recorded today","emptyHint":"Start a session and it will show up here","addManual":"Add offline work","generating":"AI organizing {{done}}/{{total}}","cancel":"Cancel","noModel":"No background model assigned; this log is rule-based for now","assignModel":"Assign model","failed":"Generation failed","failedWith":"Generation failed: {{message}}","partialFailed":"Some sessions failed; rule results kept","retry":"Retry","stale":"{{count}} session(s) have new activity · Refresh","refresh":"Refresh","archived":"Raw records for this past date are archived; showing a brief view","pendingTidy":"Pending","lowConfidence":"Can't infer; pending","noSnapshot":"No work log generated for this day"},"card":{"statusDone":"Done","statusDoing":"In progress","statusWait":"Needs decision","lowConfidence":"Low confidence","deviceLocal":"Local","remoteReadonly":"Remote device · read-only","remoteReadonlyHint":"This item comes from another device; only the summary is synced, so it cannot be edited/merged/split here.","goAnswer":"Answer","openSession":"Open session","sessionDeleted":"Source session deleted","outputsCount":"{{count}} output(s)","live":"In progress","since":"from","now":"{{time}} now","nextDay":"next day"},"lane":{"scheduled":"Scheduled tasks","other":"Other","count":"{{count}}","collapse":"Collapse lane","expand":"Expand lane"},"drawer":{"title":"Item details","status":"Status","lane":"Lane","timeRange":"Time range","sourceSession":"Source session","conclusion":"Conclusion","outputs":"Outputs","decision":"Needs decision","risks":"Risks","edit":"Edit","source":"Source","close":"Close","empty":"None"},"source":{"handoff":"Handoff","aiHandoff":"AI handoff","aiEdit":"AI edit","rule":"Rule","manual":"Manual"},"schedule":{"title":"Schedule","loading":"Loading settings…","loadFailed":"Failed to load settings","timezone":"Time zone","nextSlot":"Next run","nextNone":"Schedule off","enabled":"Enable scheduled generation","times":"Run times","addTime":"Add time","timeInvalid":"Invalid time, use HH:mm","timeDup":"That time already exists","timesMax":"At most 6 times","remove":"Remove","workdaysOnly":"Weekdays only (Mon–Fri)","skipDates":"Skip dates","addSkipDate":"Add skip date","catchup":"Catch up when missed (previous workday)","skipIdle":"Skip when there is no new activity","channels":"Notification channels","channel_desktop":"In-app reminder","channel_feishu":"Feishu","channel_telegram":"Telegram","channel_dingtalk":"DingTalk","channel_mobile":"Mobile inbox (PNG)","channelUnavailable":{"unconfigured":"Not configured","not_logged_in":"Not signed in","no_paired_phone":"No paired phone"},"channelMobileHint":"Automatic exports: Documents → ShineAI → Daily reports.","autoExport":"Auto export after run","autoExportOff":"Off","hideLocalPaths":"Hide local paths (export/push keeps file names only)","excludeGroups":"Excluded groups","excludeDirs":"Excluded working directories","excludeDirsPlaceholder":"One directory prefix per line","saving":"Saving…","saved":"Saved","saveFailed":"Save failed: {{message}}"},"export":{"hidePaths":"Hide local paths","busy":"Exporting…","done":"Exported: {{path}}","open":"Open location","failed":"Export failed: {{message}}"},"schedulePrompt":{"text":"Your first daily board is ready. Turn on scheduled generation to get it automatically at fixed times.","enable":"Enable schedule","dismiss":"Don't show again"},"edit":{"dialog":{"manual":"Add offline work","merge":"Merge items","split":"Split item"},"mergeHint":"Merge {{count}} selected items (members hidden)","title":"Title","summary":"One-line summary","partTitle":"Part {{n}} title","addPart":"Add part","removePart":"Remove part","needTwoParts":"Need at least two parts, each with a title","lane":"Lane","start":"Start","end":"End","save":"Save","hidden":"Hide this item","scopeToday":"Today only","scopeAlways":"Move all future to this group","split":"Split","undo":"Remove merged/split item","merge":"Merge","selected":"{{count}} selected","aiConflict":"AI has a new take","acceptAi":"Use AI","keepMine":"Keep mine"},"calendar":{"hasSnapshot":"Has snapshot","noSnapshot":"None"}},true,true);
instance.addResourceBundle("en-US","webLlm",{"title":"Web LLMs","description":"Let the AI use web chat models you are already signed in to (Gemini, ChatGPT, DeepSeek, …) to write code and answer questions, without spending API quota.","loadError":"Failed to load Web LLM settings","disabledHint":"When enabled, the AI can open a web chat you are signed in to inside the built-in browser, send it a question and bring back the answer. Turn it on to add a site and run a one-click test.","browserUnavailable":"The built-in browser's AI channel is off, so testing, signing in and picking elements won't work.","footnote":"Everything happens in the built-in browser and the system clipboard is never read or written. Prompts and file contents are sent to the corresponding third-party website.","master":{"title":"Enable Web LLMs","description":"Off by default. When on, AI sessions can use the web_llm_ask tool."},"risk":{"title":"Understand the risks first","intro":"Web LLMs work by automating web pages. Before turning this on, please confirm you understand:","terms":"Some websites' terms of service may prohibit automation.","account":"Frequent automated use may trigger the site's risk controls and restrict your account.","thirdParty":"Your prompts and attached file contents are sent to the third-party website.","acknowledge":"I understand these risks","confirm":"Enable"},"sites":{"title":"Sites"},"picker":{"title":"Add a site","description":"Pick a website you are signed in to (or are about to sign in to), then run a one-click test.","custom":"Custom website"},"form":{"name":"Name","namePlaceholder":"e.g. Company assistant","url":"New chat URL","nameRequired":"Name is required","urlInvalid":"Enter a URL starting with http:// or https://","maxChars":"Max characters per request","maxCharsHint":"Longer requests are refused with a suggestion to split them, never truncated. Leave empty for the default.","maxCharsInvalid":"Enter a positive whole number, or leave empty for the default"},"advanced":{"title":"Advanced: choose page elements manually","description":"If auto-detection fails, click the element on the page. Manual choices take priority.","auto":"Auto-detect"},"fields":{"input":"Input box","send":"Send button","message":"Reply area","copy":"Copy button","stop":"Stop button"},"actions":{"test":"Test","testing":"Testing","login":"Sign in","edit":"Edit","delete":"Delete","retest":"Test again","pick":"Pick element","clear":"Clear","setDefault":"Set as default","save":"Save","cancel":"Cancel","add":"Add","addSite":"Add site","retry":"Retry","remove":"Remove","openBrowserSettings":"Turn on"},"status":{"ready":"Ready","untested":"Not tested","not_logged_in":"Signed out","needs_calibration":"Needs re-test","captcha":"Captcha","error":"Error"},"steps":{"open":"Open page","login":"Check sign-in","input":"Type","send":"Send","wait":"Wait for reply","extract":"Extract and verify","foreground":"Retry in foreground","done":"Done"},"errorCodes":{"not_logged_in":"Not signed in to the site","captcha":"A captcha needs your attention in the browser","page_changed":"The page layout changed and auto-detection failed","input_failed":"Could not type into the input box","send_failed":"Could not send the message","quota_exceeded":"Quota used up or rate limited — try another site","user_busy":"You are using this page right now — try again shortly","too_long":"Content exceeds the site's limit — send it in parts","sensitive_file":"An attached file looks like it contains secrets and was blocked","site_not_found":"Site not found","site_disabled":"This site is disabled","cdp_unavailable":"The built-in browser is unavailable","needs_calibration":"The site needs to be tested again","risk_not_acknowledged":"Web LLMs are not enabled in Settings yet"},"errors":{"generic":"Something went wrong. Please try again."},"progress":{"title":"Test result","running":"Testing…","elapsed":"{{time}} elapsed"},"add":{"title":"Add {{name}}","close":"Close","steps":{"1":"Open and sign in","2":"One-click test","3":"Done"},"loginHint":"The site opens in the built-in browser. Sign-in is detected automatically; if you are already signed in, just click \"I'm signed in\".","openLogin":"Open {{name}}","loginDetected":"Signed in","loginWatching":"Checking sign-in…","next":"Next: one-click test","manualLoggedIn":"I'm signed in, start test","ready":"{{name}} is ready to use","done":"Done"},"site":{"isDefault":"Default site","needsForegroundHint":"This site only renders replies while the page is in the foreground, so the browser is brought to the front during calls.","needsForeground":"Needs foreground","deleteTitle":"Delete site","deleteMessage":"Delete \"{{name}}\"? Its test results and manually chosen elements will be removed too.","lastSuccess":"Last success {{time}}","avg":"Avg {{time}}"},"pick":{"hint":"Click the \"{{field}}\" in the browser, or press Esc to cancel","cancelled":"Picking cancelled","saved":"Element saved"},"pending":{"login":"Sign in to {{name}} in the browser — it will be detected automatically","loginDetected":"Signed in to {{name}}, returning to Settings…","back":"Back to Settings","dismiss":"Stop checking"},"allowlist":{"title":"Sensitive file allowlist","description":"Files that look like they contain secrets are never sent to web models. Add files you have checked to allow them. Only editable here — the AI cannot change it.","empty":"No files allowed yet","add":"Add file"},"tool":{"label":"Web LLM · {{name}}","defaultSite":"default site","running":"Waiting for the web reply","runningHint":"Waiting for the web page to reply — usually 15 seconds to a few minutes. Click \"View in browser\" to watch.","elapsed":"{{time}}","codeBlocks_one":"{{count}} code block","codeBlocks_other":"{{count}} code blocks","timedOut":"timed out, partial reply","failed":"Call failed","done":"Done","openSettings":"Open Web LLM settings","viewInBrowser":"View in browser"}},true,true);
const scriptRel = function detectScriptRel() {
  const relList = typeof document !== "undefined" && document.createElement("link").relList;
  return relList && relList.supports && relList.supports("modulepreload") ? "modulepreload" : "preload";
}();
const assetsURL = function(dep, importerUrl) {
  return new URL(dep, importerUrl).href;
};
const seen = {};
const __vitePreload = function preload(baseModule, deps, importerUrl) {
  let promise = Promise.resolve();
  if (deps && deps.length > 0) {
    const links = document.getElementsByTagName("link");
    const cspNonceMeta = document.querySelector(
      "meta[property=csp-nonce]"
    );
    const cspNonce = cspNonceMeta?.nonce || cspNonceMeta?.getAttribute("nonce");
    promise = Promise.allSettled(
      deps.map((dep) => {
        dep = assetsURL(dep, importerUrl);
        if (dep in seen) return;
        seen[dep] = true;
        const isCss = dep.endsWith(".css");
        const cssSelector = isCss ? '[rel="stylesheet"]' : "";
        const isBaseRelative = !!importerUrl;
        if (isBaseRelative) {
          for (let i2 = links.length - 1; i2 >= 0; i2--) {
            const link22 = links[i2];
            if (link22.href === dep && (!isCss || link22.rel === "stylesheet")) {
              return;
            }
          }
        } else if (document.querySelector(`link[href="${dep}"]${cssSelector}`)) {
          return;
        }
        const link3 = document.createElement("link");
        link3.rel = isCss ? "stylesheet" : scriptRel;
        if (!isCss) {
          link3.as = "script";
        }
        link3.crossOrigin = "";
        link3.href = dep;
        if (cspNonce) {
          link3.setAttribute("nonce", cspNonce);
        }
        document.head.appendChild(link3);
        if (isCss) {
          return new Promise((res, rej) => {
            link3.addEventListener("load", res);
            link3.addEventListener(
              "error",
              () => rej(new Error(`Unable to preload CSS for ${dep}`))
            );
          });
        }
      })
    );
  }
  function handlePreloadError(err) {
    const e3 = new Event("vite:preloadError", {
      cancelable: true
    });
    e3.payload = err;
    window.dispatchEvent(e3);
    if (!e3.defaultPrevented) {
      throw err;
    }
  }
  return promise.then((res) => {
    for (const item of res || []) {
      if (item.status !== "rejected") continue;
      handlePreloadError(item.reason);
    }
    return baseModule().catch(handlePreloadError);
  });
};
var createRoot;
const ArrowLeft = createLucideIcon("ArrowLeft", [
  ["path", { d: "m12 19-7-7 7-7", key: "1l729n" }],
  ["path", { d: "M19 12H5", key: "x3x0zl" }]
]);
const CalendarCheck = createLucideIcon("CalendarCheck", [
  ["path", { d: "M8 2v4", key: "1cmpym" }],
  ["path", { d: "M16 2v4", key: "4m81vk" }],
  ["rect", { width: "18", height: "18", x: "3", y: "4", rx: "2", key: "1hopcy" }],
  ["path", { d: "M3 10h18", key: "8toen8" }],
  ["path", { d: "m9 16 2 2 4-4", key: "19s6y9" }]
]);
const CalendarClock = createLucideIcon("CalendarClock", [
  ["path", { d: "M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5", key: "1osxxc" }],
  ["path", { d: "M16 2v4", key: "4m81vk" }],
  ["path", { d: "M8 2v4", key: "1cmpym" }],
  ["path", { d: "M3 10h5", key: "r794hk" }],
  ["path", { d: "M17.5 17.5 16 16.3V14", key: "akvzfd" }],
  ["circle", { cx: "16", cy: "16", r: "6", key: "qoo3c4" }]
]);
const Calendar = createLucideIcon("Calendar", [
  ["path", { d: "M8 2v4", key: "1cmpym" }],
  ["path", { d: "M16 2v4", key: "4m81vk" }],
  ["rect", { width: "18", height: "18", x: "3", y: "4", rx: "2", key: "1hopcy" }],
  ["path", { d: "M3 10h18", key: "8toen8" }]
]);
const Check = createLucideIcon("Check", [["path", { d: "M20 6 9 17l-5-5", key: "1gmf2c" }]]);
const ChevronDown = createLucideIcon("ChevronDown", [
  ["path", { d: "m6 9 6 6 6-6", key: "qrunsl" }]
]);
const ChevronLeft = createLucideIcon("ChevronLeft", [
  ["path", { d: "m15 18-6-6 6-6", key: "1wnfg3" }]
]);
const ChevronRight = createLucideIcon("ChevronRight", [
  ["path", { d: "m9 18 6-6-6-6", key: "mthhwq" }]
]);
const ChevronsUpDown = createLucideIcon("ChevronsUpDown", [
  ["path", { d: "m7 15 5 5 5-5", key: "1hf1tw" }],
  ["path", { d: "m7 9 5-5 5 5", key: "sgt6xg" }]
]);
const CircleCheck = createLucideIcon("CircleCheck", [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["path", { d: "m9 12 2 2 4-4", key: "dzmm74" }]
]);
const CircleHelp = createLucideIcon("CircleHelp", [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["path", { d: "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3", key: "1u773s" }],
  ["path", { d: "M12 17h.01", key: "p32p05" }]
]);
const Circle = createLucideIcon("Circle", [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }]
]);
const Crosshair = createLucideIcon("Crosshair", [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["line", { x1: "22", x2: "18", y1: "12", y2: "12", key: "l9bcsi" }],
  ["line", { x1: "6", x2: "2", y1: "12", y2: "12", key: "13hhkx" }],
  ["line", { x1: "12", x2: "12", y1: "6", y2: "2", key: "10w3f3" }],
  ["line", { x1: "12", x2: "12", y1: "22", y2: "18", key: "15g9kq" }]
]);
const Download = createLucideIcon("Download", [
  ["path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", key: "ih7n3h" }],
  ["polyline", { points: "7 10 12 15 17 10", key: "2ggqvy" }],
  ["line", { x1: "12", x2: "12", y1: "15", y2: "3", key: "1vk2je" }]
]);
const Ellipsis = createLucideIcon("Ellipsis", [
  ["circle", { cx: "12", cy: "12", r: "1", key: "41hilf" }],
  ["circle", { cx: "19", cy: "12", r: "1", key: "1wjl8i" }],
  ["circle", { cx: "5", cy: "12", r: "1", key: "1pcz8c" }]
]);
const ExternalLink = createLucideIcon("ExternalLink", [
  ["path", { d: "M15 3h6v6", key: "1q9fwt" }],
  ["path", { d: "M10 14 21 3", key: "gplh6r" }],
  ["path", { d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6", key: "a6xqqp" }]
]);
const FileCode2 = createLucideIcon("FileCode2", [
  ["path", { d: "M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4", key: "1pf5j1" }],
  ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4", key: "tnqrlb" }],
  ["path", { d: "m5 12-3 3 3 3", key: "oke12k" }],
  ["path", { d: "m9 18 3-3-3-3", key: "112psh" }]
]);
const FilePlus = createLucideIcon("FilePlus", [
  ["path", { d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z", key: "1rqfz7" }],
  ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4", key: "tnqrlb" }],
  ["path", { d: "M9 15h6", key: "cctwl0" }],
  ["path", { d: "M12 18v-6", key: "17g6i2" }]
]);
const FileText = createLucideIcon("FileText", [
  ["path", { d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z", key: "1rqfz7" }],
  ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4", key: "tnqrlb" }],
  ["path", { d: "M10 9H8", key: "b1mrlr" }],
  ["path", { d: "M16 13H8", key: "t4e002" }],
  ["path", { d: "M16 17H8", key: "z1uh3a" }]
]);
const FolderOpen = createLucideIcon("FolderOpen", [
  [
    "path",
    {
      d: "m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2",
      key: "usdka0"
    }
  ]
]);
const Globe = createLucideIcon("Globe", [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["path", { d: "M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20", key: "13o1zl" }],
  ["path", { d: "M2 12h20", key: "9i4pu4" }]
]);
const Image$1 = createLucideIcon("Image", [
  ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2", ry: "2", key: "1m3agn" }],
  ["circle", { cx: "9", cy: "9", r: "2", key: "af1f0g" }],
  ["path", { d: "m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21", key: "1xmnt7" }]
]);
const LayoutList = createLucideIcon("LayoutList", [
  ["rect", { width: "7", height: "7", x: "3", y: "3", rx: "1", key: "1g98yp" }],
  ["rect", { width: "7", height: "7", x: "3", y: "14", rx: "1", key: "1bb6yr" }],
  ["path", { d: "M14 4h7", key: "3xa0d5" }],
  ["path", { d: "M14 9h7", key: "1icrd9" }],
  ["path", { d: "M14 15h7", key: "1mj8o2" }],
  ["path", { d: "M14 20h7", key: "11slyb" }]
]);
const LoaderCircle = createLucideIcon("LoaderCircle", [
  ["path", { d: "M21 12a9 9 0 1 1-6.219-8.56", key: "13zald" }]
]);
const Loader = createLucideIcon("Loader", [
  ["path", { d: "M12 2v4", key: "3427ic" }],
  ["path", { d: "m16.2 7.8 2.9-2.9", key: "r700ao" }],
  ["path", { d: "M18 12h4", key: "wj9ykh" }],
  ["path", { d: "m16.2 16.2 2.9 2.9", key: "1bxg5t" }],
  ["path", { d: "M12 18v4", key: "jadmvz" }],
  ["path", { d: "m4.9 19.1 2.9-2.9", key: "bwix9q" }],
  ["path", { d: "M2 12h4", key: "j09sii" }],
  ["path", { d: "m4.9 4.9 2.9 2.9", key: "giyufr" }]
]);
const LogIn = createLucideIcon("LogIn", [
  ["path", { d: "M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4", key: "u53s6r" }],
  ["polyline", { points: "10 17 15 12 10 7", key: "1ail0h" }],
  ["line", { x1: "15", x2: "3", y1: "12", y2: "12", key: "v6grx8" }]
]);
const Minus = createLucideIcon("Minus", [["path", { d: "M5 12h14", key: "1ays0h" }]]);
const Pencil = createLucideIcon("Pencil", [
  [
    "path",
    {
      d: "M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z",
      key: "1a8usu"
    }
  ],
  ["path", { d: "m15 5 4 4", key: "1mk7zo" }]
]);
const Play = createLucideIcon("Play", [
  ["polygon", { points: "6 3 20 12 6 21 6 3", key: "1oa8hb" }]
]);
const Plus$1 = createLucideIcon("Plus", [
  ["path", { d: "M5 12h14", key: "1ays0h" }],
  ["path", { d: "M12 5v14", key: "s699le" }]
]);
const RefreshCw = createLucideIcon("RefreshCw", [
  ["path", { d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8", key: "v9h5vc" }],
  ["path", { d: "M21 3v5h-5", key: "1q7to0" }],
  ["path", { d: "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16", key: "3uifl3" }],
  ["path", { d: "M8 16H3v5", key: "1cv678" }]
]);
const RotateCw = createLucideIcon("RotateCw", [
  ["path", { d: "M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8", key: "1p45f6" }],
  ["path", { d: "M21 3v5h-5", key: "1q7to0" }]
]);
const Search$1 = createLucideIcon("Search", [
  ["circle", { cx: "11", cy: "11", r: "8", key: "4ej97u" }],
  ["path", { d: "m21 21-4.3-4.3", key: "1qie3q" }]
]);
const Settings = createLucideIcon("Settings", [
  [
    "path",
    {
      d: "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z",
      key: "1qme2f"
    }
  ],
  ["circle", { cx: "12", cy: "12", r: "3", key: "1v7zrd" }]
]);
const SlidersHorizontal = createLucideIcon("SlidersHorizontal", [
  ["line", { x1: "21", x2: "14", y1: "4", y2: "4", key: "obuewd" }],
  ["line", { x1: "10", x2: "3", y1: "4", y2: "4", key: "1q6298" }],
  ["line", { x1: "21", x2: "12", y1: "12", y2: "12", key: "1iu8h1" }],
  ["line", { x1: "8", x2: "3", y1: "12", y2: "12", key: "ntss68" }],
  ["line", { x1: "21", x2: "16", y1: "20", y2: "20", key: "14d8ph" }],
  ["line", { x1: "12", x2: "3", y1: "20", y2: "20", key: "m0wm8r" }],
  ["line", { x1: "14", x2: "14", y1: "2", y2: "6", key: "14e1ph" }],
  ["line", { x1: "8", x2: "8", y1: "10", y2: "14", key: "1i6ji0" }],
  ["line", { x1: "16", x2: "16", y1: "18", y2: "22", key: "1lctlv" }]
]);
const Star = createLucideIcon("Star", [
  [
    "path",
    {
      d: "M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z",
      key: "r04s7s"
    }
  ]
]);
const Trash2 = createLucideIcon("Trash2", [
  ["path", { d: "M3 6h18", key: "d0wm0j" }],
  ["path", { d: "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6", key: "4alrt4" }],
  ["path", { d: "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2", key: "v07s0e" }],
  ["line", { x1: "10", x2: "10", y1: "11", y2: "17", key: "1uufr5" }],
  ["line", { x1: "14", x2: "14", y1: "11", y2: "17", key: "xtxkd" }]
]);
const TriangleAlert = createLucideIcon("TriangleAlert", [
  [
    "path",
    {
      d: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3",
      key: "wmoenq"
    }
  ],
  ["path", { d: "M12 9v4", key: "juzpu7" }],
  ["path", { d: "M12 17h.01", key: "p32p05" }]
]);
const X$1 = createLucideIcon("X", [
  ["path", { d: "M18 6 6 18", key: "1bl5f8" }],
  ["path", { d: "m6 6 12 12", key: "d8bk6v" }]
]);
const MAIN_PANE_ID = "main";
function listPanes(root2) {
  if (root2.type === "pane") return [root2];
  return root2.children.flatMap(listPanes);
}
function isPaneCollapsed(pane2) {
  return pane2.id !== MAIN_PANE_ID && pane2.collapsed === true;
}
function isPrototypeSession$1(session2) {
  return session2?.config?.sessionType === "prototype";
}
function isFinishedSessionStatus(status2) {
  return status2 === "completed" || status2 === "terminated";
}
function placeSessionInFocusedPane(sessionId) {
  const ui2 = useUIStore.getState();
  const session2 = useSessionStore.getState();
  if (isPrototypeSession$1(session2.sessions.find((s2) => s2.id === sessionId))) {
    session2.selectSession(sessionId);
    if (ui2.secondarySessionId === sessionId) ui2.setSecondarySessionId(null);
    return;
  }
  if (ui2.sessionDisplayMode !== "split-2") {
    session2.selectSession(sessionId);
    return;
  }
  if (session2.selectedSessionId === sessionId) {
    ui2.setFocusedSplitPane("primary");
    return;
  }
  if (ui2.secondarySessionId === sessionId) {
    ui2.setFocusedSplitPane("secondary");
    return;
  }
  if (ui2.focusedSplitPane === "secondary") {
    ui2.setSecondarySessionId(sessionId);
    return;
  }
  session2.selectSession(sessionId);
  if (ui2.secondarySessionId === sessionId) {
    ui2.setSecondarySessionId(null);
  }
}
function bindSessionToLandingPane(sessionId) {
  if (isPrototypeSession$1(useSessionStore.getState().sessions.find((s2) => s2.id === sessionId))) {
    return false;
  }
  const ui2 = useUIStore.getState();
  const spec = ui2.layoutSpec;
  if (!spec?.root) return false;
  const panes = listPanes(spec.root);
  const isSessionsPane = (paneId) => !!panes.find((pane2) => pane2.id === paneId)?.tabs.some((tab2) => tab2.kind === "sessions");
  const sessionPanes = panes.filter((pane2) => pane2.tabs.some((tab2) => tab2.kind === "sessions"));
  const hasBinding = panes.some((pane2) => !!pane2.sessionId);
  if (panes.length <= 1 && !hasBinding) return false;
  const focused = ui2.focusedPaneId;
  const target2 = sessionPanes.find((pane2) => pane2.id === focused) ?? sessionPanes.find((pane2) => pane2.id === MAIN_PANE_ID) ?? sessionPanes.find((pane2) => !!pane2.sessionId) ?? sessionPanes[0];
  if (!target2 || !isSessionsPane(target2.id)) return false;
  useUIStore.getState().bindSessionToPane(target2.id, sessionId);
  markExplicitViewOfFinishedSession(sessionId);
  const sessionState = useSessionStore.getState();
  if (sessionState.selectedSessionId !== sessionId) sessionState.selectSession(sessionId);
  return true;
}
function markExplicitViewOfFinishedSession(sessionId) {
  const session2 = useSessionStore.getState().sessions.find((s2) => s2.id === sessionId);
  if (!session2 || !isFinishedSessionStatus(session2.status)) return;
  useUIStore.getState().setTemporaryTab(sessionId);
}
const SIZE_CLASS_MAP$1 = {
  sm: {
    trigger: "min-h-[32px] px-3 py-1.5 text-xs",
    icon: "w-3.5 h-3.5",
    panel: "p-2",
    option: "px-3 py-2 text-sm",
    label: "text-sm",
    description: "text-caption"
  },
  md: {
    trigger: "min-h-[40px] px-4 py-2.5 text-sm",
    icon: "w-4 h-4",
    panel: "p-2.5",
    option: "px-4 py-3 text-base",
    label: "text-base",
    description: "text-xs"
  }
};
const VARIANT_CLASS_MAP = {
  default: {
    trigger: [
      "rounded-full border border-border/70 bg-bg-primary text-text-primary shadow-sm",
      "hover:border-border hover:bg-bg-secondary",
      "focus-visible:ring-2 focus-visible:ring-accent-blue/20 focus-visible:border-accent-blue/45",
      "disabled:cursor-not-allowed disabled:opacity-50"
    ].join(" ")
  },
  ghost: {
    trigger: [
      "rounded-full border border-transparent bg-transparent text-text-secondary shadow-none",
      "hover:border-border/50 hover:bg-bg-hover/80 hover:text-text-primary",
      "focus-visible:ring-2 focus-visible:ring-accent-blue/20 focus-visible:border-accent-blue/40",
      "disabled:cursor-not-allowed disabled:opacity-50"
    ].join(" ")
  }
};
function getOptionSearchText$1(option) {
  if (option.searchText) {
    return option.searchText;
  }
  return `${String(option.label)} ${String(option.description ?? "")} ${option.value}`;
}
function getFirstEnabledIndex$1(options2) {
  return options2.findIndex((option) => !option.disabled);
}
function getLastEnabledIndex$1(options2) {
  for (let index2 = options2.length - 1; index2 >= 0; index2 -= 1) {
    if (!options2[index2].disabled) return index2;
  }
  return -1;
}
function getNextEnabledIndex$1(options2, currentIndex, direction) {
  if (!options2.length) return -1;
  for (let offset = 1; offset <= options2.length; offset += 1) {
    const nextIndex = (currentIndex + offset * direction + options2.length) % options2.length;
    if (!options2[nextIndex]?.disabled) {
      return nextIndex;
    }
  }
  return currentIndex;
}
function Select({
  value,
  options: options2,
  onChange,
  placeholder: placeholder2 = instance.t("commandPalette:select.placeholder"),
  size = "md",
  variant = "default",
  fullWidth = true,
  align = "start",
  className,
  panelClassName,
  optionClassName,
  renderValue,
  searchable = false,
  searchPlaceholder = instance.t("commandPalette:select.searchPlaceholder"),
  emptySearchText = instance.t("commandPalette:select.noMatch"),
  disabled = false,
  onBlur,
  onFocus,
  onKeyDown,
  ...buttonProps
}) {
  const listboxId = reactExports.useId();
  const triggerRef = reactExports.useRef(null);
  const panelRef = reactExports.useRef(null);
  const searchInputRef = reactExports.useRef(null);
  const optionRefs = reactExports.useRef([]);
  const shouldScrollIntoViewRef = reactExports.useRef(false);
  const [open, setOpen] = reactExports.useState(false);
  const [query, setQuery] = reactExports.useState("");
  const [activeIndex, setActiveIndex] = reactExports.useState(-1);
  const [panelStyle, setPanelStyle] = reactExports.useState(null);
  const sizeClasses = SIZE_CLASS_MAP$1[size];
  const variantClasses = VARIANT_CLASS_MAP[variant];
  const queryLower = query.trim().toLowerCase();
  const visibleOptions = reactExports.useMemo(() => {
    if (!searchable || !queryLower) return options2;
    return options2.filter((option) => getOptionSearchText$1(option).toLowerCase().includes(queryLower));
  }, [options2, queryLower, searchable]);
  const selectedIndex = reactExports.useMemo(
    () => options2.findIndex((option) => option.value === value),
    [options2, value]
  );
  const selectedOption = selectedIndex >= 0 ? options2[selectedIndex] : void 0;
  const visibleSelectedIndex = reactExports.useMemo(
    () => visibleOptions.findIndex((option) => option.value === value),
    [value, visibleOptions]
  );
  const closePanel = reactExports.useCallback((focusTrigger = false) => {
    setOpen(false);
    setQuery("");
    setActiveIndex(-1);
    if (focusTrigger) {
      triggerRef.current?.focus();
    }
  }, []);
  const updatePanelPosition = reactExports.useCallback(() => {
    if (!triggerRef.current || !panelRef.current) return;
    const gap = 8;
    const viewportPadding = 8;
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const panelRect = panelRef.current.getBoundingClientRect();
    const preferredWidth = Math.max(triggerRect.width, panelRect.width);
    let left = align === "end" ? triggerRect.right - preferredWidth : triggerRect.left;
    if (left + preferredWidth > window.innerWidth - viewportPadding) {
      left = window.innerWidth - preferredWidth - viewportPadding;
    }
    if (left < viewportPadding) {
      left = viewportPadding;
    }
    const bottomSpace = window.innerHeight - triggerRect.bottom - viewportPadding;
    const topSpace = triggerRect.top - viewportPadding;
    const shouldOpenUpward = bottomSpace < panelRect.height + gap && topSpace > bottomSpace;
    let top = shouldOpenUpward ? triggerRect.top - panelRect.height - gap : triggerRect.bottom + gap;
    if (top + panelRect.height > window.innerHeight - viewportPadding) {
      top = window.innerHeight - panelRect.height - viewportPadding;
    }
    if (top < viewportPadding) {
      top = viewportPadding;
    }
    setPanelStyle({
      left,
      top,
      minWidth: triggerRect.width,
      maxWidth: Math.min(420, window.innerWidth - viewportPadding * 2)
    });
  }, [align]);
  reactExports.useEffect(() => {
    if (!open) return;
    const handleOutsideClick = (event2) => {
      const target2 = event2.target;
      if (triggerRef.current?.contains(target2) || panelRef.current?.contains(target2)) {
        return;
      }
      closePanel(false);
    };
    const handleEscape = (event2) => {
      if (event2.key === "Escape") {
        event2.preventDefault();
        closePanel(true);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [closePanel, open]);
  reactExports.useLayoutEffect(() => {
    if (!open) {
      setPanelStyle(null);
      return;
    }
    const frame2 = window.requestAnimationFrame(() => {
      updatePanelPosition();
    });
    const handleViewportChange = (event2) => {
      if (event2.target && panelRef.current?.contains(event2.target)) {
        return;
      }
      updatePanelPosition();
    };
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);
    return () => {
      window.cancelAnimationFrame(frame2);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [open, updatePanelPosition, visibleOptions.length]);
  reactExports.useEffect(() => {
    if (!open) return;
    const defaultIndex = visibleSelectedIndex >= 0 ? visibleSelectedIndex : getFirstEnabledIndex$1(visibleOptions);
    shouldScrollIntoViewRef.current = true;
    setActiveIndex(defaultIndex);
  }, [open, visibleOptions, visibleSelectedIndex]);
  reactExports.useEffect(() => {
    if (!open || !searchable) return;
    const frame2 = window.requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });
    return () => {
      window.cancelAnimationFrame(frame2);
    };
  }, [open, searchable]);
  reactExports.useEffect(() => {
    if (!open || activeIndex < 0) return;
    if (!shouldScrollIntoViewRef.current) return;
    shouldScrollIntoViewRef.current = false;
    optionRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);
  const handleSelect = reactExports.useCallback((nextValue) => {
    onChange(nextValue);
    closePanel(true);
  }, [closePanel, onChange]);
  const handleTriggerKeyDown = (event2) => {
    onKeyDown?.(event2);
    if (event2.defaultPrevented || disabled) return;
    if (!open) {
      if (event2.key === "ArrowDown" || event2.key === "Enter" || event2.key === " ") {
        event2.preventDefault();
        setOpen(true);
        return;
      }
      if (event2.key === "ArrowUp") {
        event2.preventDefault();
        shouldScrollIntoViewRef.current = true;
        setOpen(true);
        setActiveIndex(getLastEnabledIndex$1(visibleOptions));
      }
      return;
    }
    if (event2.key === "ArrowDown") {
      event2.preventDefault();
      shouldScrollIntoViewRef.current = true;
      setActiveIndex((currentIndex) => {
        const baseIndex = currentIndex >= 0 ? currentIndex : getFirstEnabledIndex$1(visibleOptions);
        return getNextEnabledIndex$1(visibleOptions, baseIndex, 1);
      });
      return;
    }
    if (event2.key === "ArrowUp") {
      event2.preventDefault();
      shouldScrollIntoViewRef.current = true;
      setActiveIndex((currentIndex) => {
        const baseIndex = currentIndex >= 0 ? currentIndex : getLastEnabledIndex$1(visibleOptions);
        return getNextEnabledIndex$1(visibleOptions, baseIndex, -1);
      });
      return;
    }
    if (event2.key === "Home") {
      event2.preventDefault();
      shouldScrollIntoViewRef.current = true;
      setActiveIndex(getFirstEnabledIndex$1(visibleOptions));
      return;
    }
    if (event2.key === "End") {
      event2.preventDefault();
      shouldScrollIntoViewRef.current = true;
      setActiveIndex(getLastEnabledIndex$1(visibleOptions));
      return;
    }
    if (event2.key === "Enter" || event2.key === " ") {
      event2.preventDefault();
      const option = visibleOptions[activeIndex];
      if (option && !option.disabled) {
        handleSelect(option.value);
      }
    }
  };
  const handleSearchKeyDown = (event2) => {
    if (event2.key === "ArrowDown") {
      event2.preventDefault();
      shouldScrollIntoViewRef.current = true;
      setActiveIndex(getFirstEnabledIndex$1(visibleOptions));
      return;
    }
    if (event2.key === "ArrowUp") {
      event2.preventDefault();
      shouldScrollIntoViewRef.current = true;
      setActiveIndex(getLastEnabledIndex$1(visibleOptions));
      return;
    }
    if (event2.key === "Enter") {
      event2.preventDefault();
      const option = visibleOptions[activeIndex];
      if (option && !option.disabled) {
        handleSelect(option.value);
      }
    }
  };
  const triggerLabel = renderValue ? renderValue(selectedOption) : selectedOption?.label || placeholder2;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        ...buttonProps,
        ref: triggerRef,
        type: "button",
        disabled,
        "aria-haspopup": "listbox",
        "aria-expanded": open,
        "aria-controls": listboxId,
        onClick: () => {
          if (disabled) return;
          if (open) {
            closePanel(false);
            return;
          }
          setOpen(true);
        },
        onBlur,
        onFocus,
        onKeyDown: handleTriggerKeyDown,
        className: [
          "inline-flex items-center justify-between gap-3 text-left outline-none transition-all",
          fullWidth ? "w-full" : "w-auto",
          sizeClasses.trigger,
          variantClasses.trigger,
          className
        ].filter(Boolean).join(" "),
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: [
            "min-w-0 flex-1 truncate",
            selectedOption ? "text-text-primary" : "text-text-muted",
            sizeClasses.label
          ].join(" "), children: triggerLabel }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronsUpDown, { className: [
            "shrink-0 text-text-secondary transition-transform",
            sizeClasses.icon,
            open ? "scale-[1.05] text-text-primary" : ""
          ].join(" ") })
        ]
      }
    ),
    open && reactDomExports.createPortal(
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          ref: panelRef,
          id: listboxId,
          role: "listbox",
          "aria-activedescendant": activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : void 0,
          className: [
            "fixed z-[10020] max-h-[320px] overflow-y-auto rounded-[24px] border border-border/70",
            "bg-bg-primary shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-md",
            sizeClasses.panel,
            panelClassName
          ].filter(Boolean).join(" "),
          style: panelStyle ?? { opacity: 0 },
          onWheel: (event2) => event2.stopPropagation(),
          children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: searchable ? "space-y-2" : "space-y-1", children: [
            searchable && /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                ref: searchInputRef,
                type: "text",
                value: query,
                onChange: (event2) => setQuery(event2.target.value),
                onKeyDown: handleSearchKeyDown,
                placeholder: searchPlaceholder,
                className: "w-full rounded-full border border-border/70 bg-bg-secondary px-3 py-1.5 text-xs text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-accent-blue/45 focus:ring-2 focus:ring-accent-blue/20"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-1", children: visibleOptions.length > 0 ? visibleOptions.map((option, index2) => {
              const selected2 = option.value === value;
              const active = index2 === activeIndex;
              return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  id: `${listboxId}-option-${index2}`,
                  ref: (node2) => {
                    optionRefs.current[index2] = node2;
                  },
                  type: "button",
                  role: "option",
                  "aria-selected": selected2,
                  disabled: option.disabled,
                  onMouseEnter: () => {
                    if (!option.disabled) {
                      setActiveIndex(index2);
                    }
                  },
                  onMouseDown: (event2) => event2.preventDefault(),
                  onClick: () => {
                    if (!option.disabled) {
                      handleSelect(option.value);
                    }
                  },
                  className: [
                    "group flex w-full items-center gap-3 rounded-2xl border border-transparent text-left transition-colors",
                    "disabled:cursor-not-allowed disabled:opacity-40",
                    sizeClasses.option,
                    optionClassName,
                    selected2 || active ? "bg-bg-secondary text-text-primary" : "text-text-primary hover:bg-bg-secondary/80"
                  ].filter(Boolean).join(" "),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex min-w-0 flex-1 flex-col", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: [
                        "truncate leading-tight",
                        sizeClasses.label
                      ].join(" "), children: option.label }),
                      option.description && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: [
                        "mt-1 truncate text-text-secondary",
                        sizeClasses.description
                      ].join(" "), children: option.description })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: [
                      "shrink-0 text-text-secondary transition-opacity",
                      sizeClasses.icon,
                      selected2 ? "opacity-100 text-text-primary" : "opacity-0 group-hover:opacity-30"
                    ].join(" ") })
                  ]
                },
                `${option.value}-${index2}`
              );
            }) : searchable ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-3 py-2 text-xs text-text-muted", children: emptySearchText }) : null })
          ] })
        }
      ),
      document.body
    )
  ] });
}
function getBrowserBridge() {
  if (typeof window === "undefined") return null;
  const shineAI = window.shineAI;
  const browser2 = shineAI?.browser;
  if (!browser2 || typeof browser2.getState !== "function" || typeof browser2.setViewBounds !== "function") {
    return null;
  }
  return browser2;
}
function canDockBrowserHere() {
  if (typeof window === "undefined" || !getBrowserBridge()) return false;
  return !window.location.hash.startsWith("#/workspace-window");
}
function canDockPanelHere(panel2) {
  return panel2 !== "browser" || canDockBrowserHere();
}
function openWorkbenchDockPanel(panel2, { toggle = false } = {}) {
  if (!canDockPanelHere(panel2)) return false;
  const ui2 = useUIStore.getState();
  const dock2 = useWorkbenchDockStore.getState();
  if (ui2.activeWorkspace !== "workbench") {
    ui2.setActiveWorkspace("workbench");
    dock2.setPanel(panel2);
  } else if (toggle) dock2.toggle(panel2);
  else dock2.setPanel(panel2);
  return true;
}
function ensureSessionsSurfaceVisible() {
  const ui2 = useUIStore.getState();
  if (ui2.maximizedSurface && ui2.maximizedSurface.kind !== "sessions") {
    ui2.restoreMaximizedSurface?.();
  }
  const hasSessions = ui2.layoutSpec?.root ? listPanes(ui2.layoutSpec.root).some((pane2) => pane2.tabs.some((tab2) => tab2.kind === "sessions")) : true;
  if (!hasSessions || ui2.primaryPane !== "sessions") {
    ui2.setMainSurface("sessions");
  }
}
function placeInactiveOrMissingSession(sessionId, opts) {
  const { setTemporaryTab, focusedSplitPane } = useUIStore.getState();
  const isMultiPane = opts.sessionDisplayMode !== "single";
  if (!isMultiPane) {
    setTemporaryTab(sessionId);
    return;
  }
  placeSessionInFocusedPane(sessionId);
  if (!opts.isTerminalInactive) return;
  if (opts.sessionDisplayMode === "split-2" && focusedSplitPane === "secondary") return;
  setTemporaryTab(sessionId);
}
async function navigateToSessionForChat(sessionId) {
  const {
    setActiveWorkspace,
    primaryPane,
    sessionDisplayMode,
    setMainSurface
  } = useUIStore.getState();
  const { sessions: sessions2, openSessionForChat } = useSessionStore.getState();
  const session2 = sessions2.find((s2) => s2.id === sessionId);
  const missing = !session2;
  const isTerminalInactive = !!session2 && (session2.status === "completed" || session2.status === "terminated");
  const needsInactivePlacement = isTerminalInactive || missing;
  setActiveWorkspace("project");
  ensureSessionsSurfaceVisible();
  if (needsInactivePlacement) {
    if (!bindSessionToLandingPane(sessionId)) {
      placeInactiveOrMissingSession(sessionId, { isTerminalInactive, sessionDisplayMode });
    }
  } else {
    if (!bindSessionToLandingPane(sessionId)) {
      placeSessionInFocusedPane(sessionId);
    }
  }
  const result2 = await openSessionForChat(sessionId);
  if (!result2.success && needsInactivePlacement) {
    const latestUi = useUIStore.getState();
    if (latestUi.temporaryTabId === sessionId) {
      latestUi.setTemporaryTab(null);
    }
  }
  return result2;
}
const fileManagerStore = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  useFileManagerStore
}, Symbol.toStringTag, { value: "Module" }));
const ConfirmDialog$1 = ({
  open,
  title: title2 = instance.t("commandPalette:confirmDialog.title"),
  message: message2,
  children: children2,
  maxWidthClassName = "max-w-sm",
  confirmText = instance.t("common:actions.ok"),
  cancelText = instance.t("common:actions.cancel"),
  danger = false,
  hideCancel = false,
  requireTypeConfirm,
  confirmDisabled = false,
  onConfirm,
  onCancel
}) => {
  const confirmBtnRef = reactExports.useRef(null);
  const inputRef = reactExports.useRef(null);
  const [typedConfirm, setTypedConfirm] = reactExports.useState("");
  const confirmDisabledReason = reactExports.useMemo(() => {
    if (!requireTypeConfirm) {
      return null;
    }
    return typedConfirm === requireTypeConfirm ? null : instance.t("commandPalette:confirmDialog.typeToContinue", { text: requireTypeConfirm });
  }, [requireTypeConfirm, typedConfirm]);
  const isConfirmDisabled = Boolean(confirmDisabledReason) || confirmDisabled;
  reactExports.useEffect(() => {
    if (!open) {
      setTypedConfirm("");
      return;
    }
    if (requireTypeConfirm) {
      inputRef.current?.focus();
    } else {
      confirmBtnRef.current?.focus();
    }
    const handleKeyDown = (e3) => {
      if (e3.key === "Escape") {
        onCancel();
        return;
      }
      if (e3.key === "Enter" && !isConfirmDisabled) {
        onConfirm();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isConfirmDisabled, onCancel, onConfirm, open, requireTypeConfirm]);
  if (!open) return null;
  const dialog = /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      className: "fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in",
      style: { willChange: "transform" },
      onClick: onCancel,
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: `pointer-events-auto bg-bg-secondary rounded-lg shadow-2xl w-full ${maxWidthClassName} border border-border animate-slide-in`,
          onClick: (e3) => e3.stopPropagation(),
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 p-4 border-b border-border", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `p-2 rounded-lg ${danger ? "bg-accent-red/10" : "bg-accent-yellow/10"}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                TriangleAlert,
                {
                  className: `w-5 h-5 ${danger ? "text-accent-red" : "text-accent-yellow"}`
                }
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-base font-semibold text-text-primary", children: title2 })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 px-4 py-5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-text-secondary leading-relaxed", children: message2 }),
              children2,
              requireTypeConfirm && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-sm font-medium text-text-primary", htmlFor: "confirm-dialog-type-input", children: [
                  instance.t("commandPalette:confirmDialog.enterText"),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mx-1 rounded bg-bg-tertiary px-1.5 py-0.5 text-xs text-text-primary", children: requireTypeConfirm }),
                  instance.t("commandPalette:confirmDialog.afterText")
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    id: "confirm-dialog-type-input",
                    ref: inputRef,
                    type: "text",
                    value: typedConfirm,
                    onChange: (e3) => setTypedConfirm(e3.target.value),
                    placeholder: requireTypeConfirm,
                    autoComplete: "off",
                    spellCheck: false,
                    className: "w-full rounded-md border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary outline-none transition focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-text-muted", children: [
                  instance.t("commandPalette:confirmDialog.exactMatchPrefix"),
                  confirmText,
                  instance.t("commandPalette:confirmDialog.exactMatchSuffix")
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-3 px-4 pb-4", children: [
              !hideCancel && /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  onClick: onCancel,
                  className: "px-4 py-2 text-sm font-medium rounded bg-bg-hover hover:bg-bg-tertiary text-text-secondary btn-transition",
                  children: cancelText
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { title: confirmDisabledReason ?? void 0, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  ref: confirmBtnRef,
                  onClick: () => {
                    if (!isConfirmDisabled) {
                      onConfirm();
                    }
                  },
                  disabled: isConfirmDisabled,
                  className: `px-4 py-2 text-sm font-medium rounded text-white btn-transition ${danger ? "bg-accent-red hover:bg-accent-red/85" : "bg-accent-blue hover:bg-accent-blue/85"} ${isConfirmDisabled ? "cursor-not-allowed opacity-50 hover:bg-inherit" : ""}`,
                  children: confirmText
                }
              ) })
            ] })
          ]
        }
      )
    }
  );
  if (typeof document === "undefined") return dialog;
  return reactDomExports.createPortal(dialog, document.body);
};
function mountDialog(options2) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root2 = createRoot(container);
  root2.render(
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      ConfirmDialog$1,
      {
        open: true,
        title: options2.title,
        message: options2.message,
        confirmText: options2.confirmText,
        cancelText: options2.cancelText,
        danger: options2.danger,
        hideCancel: options2.hideCancel,
        onConfirm: options2.onConfirm,
        onCancel: options2.onCancel,
        children: options2.children
      }
    )
  );
  return () => {
    root2.unmount();
    container.remove();
  };
}
function confirmAsync(options2) {
  if (typeof document === "undefined") {
    return Promise.resolve(globalThis.confirm?.(options2.message) ?? true);
  }
  return new Promise((resolve) => {
    let settled = false;
    const cleanup = mountDialog({
      ...options2,
      onConfirm: () => {
        if (settled) return;
        settled = true;
        resolve(true);
        queueMicrotask(cleanup);
      },
      onCancel: () => {
        if (settled) return;
        settled = true;
        resolve(false);
        queueMicrotask(cleanup);
      }
    });
  });
}
const EXT_KIND = {
  // code
  ts: "code",
  tsx: "code",
  js: "code",
  jsx: "code",
  mjs: "code",
  cjs: "code",
  json: "code",
  jsonc: "code",
  py: "code",
  go: "code",
  rs: "code",
  java: "code",
  kt: "code",
  kts: "code",
  c: "code",
  cc: "code",
  cpp: "code",
  cxx: "code",
  h: "code",
  hpp: "code",
  cs: "code",
  rb: "code",
  php: "code",
  swift: "code",
  scala: "code",
  sh: "code",
  bash: "code",
  zsh: "code",
  ps1: "code",
  bat: "code",
  cmd: "code",
  sql: "code",
  graphql: "code",
  gql: "code",
  vue: "code",
  svelte: "code",
  css: "code",
  scss: "code",
  less: "code",
  sass: "code",
  html: "code",
  htm: "code",
  xml: "code",
  yml: "code",
  yaml: "code",
  toml: "code",
  ini: "code",
  conf: "code",
  env: "code",
  dockerfile: "code",
  makefile: "code",
  cmake: "code",
  gradle: "code",
  // doc
  md: "doc",
  mdx: "doc",
  txt: "doc",
  rst: "doc",
  rtf: "doc",
  pdf: "doc",
  doc: "doc",
  docx: "doc",
  docm: "doc",
  dotx: "doc",
  odt: "doc",
  xls: "doc",
  xlsx: "doc",
  xlsm: "doc",
  xltx: "doc",
  ppt: "doc",
  pptx: "doc",
  pptm: "doc",
  potx: "doc",
  ods: "doc",
  odp: "doc",
  wps: "doc",
  et: "doc",
  dps: "doc",
  wpt: "doc",
  ett: "doc",
  dpt: "doc",
  epub: "doc",
  ofd: "doc",
  msg: "doc",
  eml: "doc",
  csv: "doc",
  tsv: "doc",
  log: "doc",
  // image
  png: "image",
  jpg: "image",
  jpeg: "image",
  gif: "image",
  webp: "image",
  bmp: "image",
  svg: "image",
  ico: "image",
  tif: "image",
  tiff: "image",
  avif: "image",
  heic: "image",
  // video
  mp4: "video",
  webm: "video",
  mkv: "video",
  mov: "video",
  avi: "video",
  m4v: "video",
  flv: "video",
  wmv: "video",
  // audio
  mp3: "audio",
  wav: "audio",
  flac: "audio",
  aac: "audio",
  m4a: "audio",
  ogg: "audio",
  opus: "audio",
  wma: "audio",
  // archive
  zip: "archive",
  rar: "archive",
  "7z": "archive",
  tar: "archive",
  gz: "archive",
  tgz: "archive",
  bz2: "archive",
  xz: "archive"
};
const DEFAULT_OPEN_ACTIONS = {
  // code/doc → editor 为主；md 可加 preview
  code: ["editor", "system_default", "reveal"],
  doc: ["editor", "system_default", "reveal", "preview"],
  image: ["preview", "system_default", "reveal"],
  video: ["system_default", "reveal"],
  audio: ["system_default", "reveal"],
  archive: ["reveal", "system_default"],
  binary: ["reveal", "system_default"],
  directory: ["reveal"]
};
const DEFAULT_ACTION = {
  code: "editor",
  doc: "editor",
  image: "preview",
  video: "system_default",
  audio: "system_default",
  archive: "reveal",
  binary: "reveal",
  directory: "reveal"
};
function isDirectoryPath(path2) {
  const p2 = path2.trim();
  if (!p2) return false;
  if (/[/\\]$/.test(p2)) return true;
  if (/^[a-zA-Z]:[/\\]?$/.test(p2)) return true;
  if (p2 === "/" || p2 === "\\") return true;
  return false;
}
function extOf(path2) {
  const normalized = path2.replace(/\\/g, "/").split(/[?#]/)[0];
  const base = normalized.split("/").filter(Boolean).pop() || "";
  const lowerBase = base.toLowerCase();
  if (lowerBase === "dockerfile" || lowerBase === "makefile") return lowerBase;
  const dot2 = base.lastIndexOf(".");
  if (dot2 <= 0) return "";
  return base.slice(dot2 + 1).toLowerCase();
}
function inferProductKind$1(path2) {
  if (!path2 || !path2.trim()) return "binary";
  if (isDirectoryPath(path2)) return "directory";
  const ext = extOf(path2);
  if (!ext) return "binary";
  return EXT_KIND[ext] ?? "binary";
}
function openActionsForKind(kind2) {
  return DEFAULT_OPEN_ACTIONS[kind2];
}
function defaultOpenActionForKind(kind2) {
  return DEFAULT_ACTION[kind2];
}
const KNOWN_KINDS = /* @__PURE__ */ new Set([
  "code",
  "doc",
  "image",
  "video",
  "audio",
  "archive",
  "binary",
  "directory"
]);
function isDelete(changeType2) {
  return (changeType2 ?? "").toLowerCase() === "delete";
}
function asProductKind(value) {
  if (!value?.trim()) return void 0;
  const k2 = value.trim().toLowerCase();
  if (k2 === "markdown") return "doc";
  if (k2 === "other" || k2 === "mp4") return k2 === "mp4" ? "video" : "binary";
  return KNOWN_KINDS.has(k2) ? k2 : void 0;
}
function inferProductKind(input2) {
  return asProductKind(input2.kind) ?? inferProductKind$1(input2.path);
}
function isHtmlPreviewPath(filePath) {
  return /\.(html?)$/i.test(filePath);
}
const IN_APP_TEXT_DOC_RE = /\.(mdx?|markdown|txt|rst|csv|tsv|log)$/i;
function stripQueryHash(value) {
  return value.split(/[?#]/, 1)[0];
}
function prefersSystemDefaultOpen(input2) {
  const path2 = stripQueryHash(input2.path);
  if (isHtmlPreviewPath(path2) || IN_APP_TEXT_DOC_RE.test(path2)) return false;
  const kind2 = inferProductKind(input2);
  return kind2 !== "code" && kind2 !== "image" && kind2 !== "directory";
}
function getDefaultOpenAction(input2) {
  if (isDelete(input2.changeType)) return "reveal";
  if (isHtmlPreviewPath(input2.path)) return "preview";
  if (prefersSystemDefaultOpen(input2)) return "system_default";
  return defaultOpenActionForKind(inferProductKind(input2));
}
function getAvailableOpenActions(input2) {
  if (isDelete(input2.changeType)) {
    return ["reveal", "system_default"];
  }
  const actions2 = [...openActionsForKind(inferProductKind(input2))];
  if (isHtmlPreviewPath(input2.path) && !actions2.includes("preview")) {
    return ["preview", ...actions2];
  }
  return actions2;
}
function parentDir(filePath) {
  const norm = filePath.replace(/\\/g, "/");
  const i2 = norm.lastIndexOf("/");
  if (i2 <= 0) return filePath;
  const parent = norm.slice(0, i2);
  return filePath.includes("\\") ? parent.replace(/\//g, "\\") : parent;
}
function getBridge() {
  return typeof window !== "undefined" ? window.shineAI : void 0;
}
async function openWithSystemDefault(filePath) {
  const bridge = getBridge();
  const openPath = bridge?.shell?.openPath ?? bridge?.folderOpener?.openPath;
  if (!openPath) return { ok: false, error: "openPath unavailable" };
  try {
    const result2 = await openPath(filePath);
    return result2?.success ? { ok: true } : { ok: false, error: result2?.error ?? "openPath failed" };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
async function revealInFolder(filePath) {
  const bridge = getBridge();
  const show = bridge?.fileManager?.showInFolder;
  if (show) {
    try {
      const result2 = await show(filePath);
      return result2?.success ? { ok: true } : { ok: false, error: result2?.error ?? "showInFolder failed" };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  }
  return openWithSystemDefault(parentDir(filePath));
}
function isMarkdownPreviewPath(filePath) {
  return /\.(md|mdx|markdown)$/i.test(filePath);
}
const PRODUCT_PREVIEW_EVENT = "shineai:product-preview";
function dispatchProductPreview(path2, kind2) {
  if (typeof window === "undefined" || typeof window.dispatchEvent !== "function") return false;
  window.dispatchEvent(
    new CustomEvent(PRODUCT_PREVIEW_EVENT, { detail: { path: path2, kind: kind2 } })
  );
  return true;
}
const defaultEditorOpener = async (filePath, line2, col, options2) => {
  try {
    const { useFileManagerStore: useFileManagerStore2 } = await __vitePreload(async () => {
      const { useFileManagerStore: useFileManagerStore3 } = await Promise.resolve().then(() => fileManagerStore);
      return { useFileManagerStore: useFileManagerStore3 };
    }, true ? void 0 : void 0, import.meta.url);
    const store2 = useFileManagerStore2.getState();
    const openOptions = options2?.revealInExplorer ? { revealInExplorer: true } : void 0;
    if (line2 != null) {
      await store2.openFileAtLine(filePath, line2, col ?? 1, openOptions);
    } else {
      await store2.openFileInTab(filePath, openOptions);
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
};
let editorOpener = defaultEditorOpener;
async function openProduct(input2) {
  const path2 = input2.path?.trim();
  if (!path2) return { ok: false, error: "path is empty" };
  const action2 = input2.action ?? getDefaultOpenAction(input2);
  const available = getAvailableOpenActions(input2);
  if (!available.includes(action2)) {
    return { ok: false, error: `action not available: ${action2}` };
  }
  switch (action2) {
    case "editor":
      return editorOpener(path2, input2.line, input2.col, input2.revealInExplorer ? { revealInExplorer: true } : void 0);
    case "reveal":
      return revealInFolder(path2);
    case "preview": {
      const kind2 = inferProductKind(input2);
      if (kind2 === "image" && dispatchProductPreview(path2, "image")) {
        return { ok: true };
      }
      if (isMarkdownPreviewPath(path2) && dispatchProductPreview(path2, "doc")) {
        return { ok: true };
      }
      if (isHtmlPreviewPath(path2) && dispatchProductPreview(path2, "html")) {
        return { ok: true };
      }
      return openWithSystemDefault(path2);
    }
    case "system_default":
      return openWithSystemDefault(path2);
    default:
      return { ok: false, error: `unknown action: ${action2}` };
  }
}
const WEB_LLM_OVERRIDE_FIELDS = ["input", "send", "message", "copy", "stop"];
function isHttpUrl$1(value) {
  try {
    const url = new URL(value.trim());
    return (url.protocol === "http:" || url.protocol === "https:") && Boolean(url.hostname);
  } catch {
    return false;
  }
}
function fixActionFor(site2) {
  if (site2.status === "ready" || site2.status === "untested") return null;
  if (site2.status === "not_logged_in" || site2.status === "captcha") return "login";
  const code2 = site2.lastError?.code;
  if (code2 === "not_logged_in" || code2 === "captcha") return "login";
  if (code2 === "page_changed" || code2 === "input_failed" || code2 === "send_failed") return "pick";
  return "retest";
}
function overrideFieldForStep(step) {
  if (step === "send") return "send";
  if (step === "wait") return "stop";
  if (step === "extract") return "message";
  return "input";
}
function formatElapsed$1(sec) {
  const s2 = Math.max(0, Math.round(sec));
  if (s2 < 60) return `${s2}s`;
  return `${Math.floor(s2 / 60)}m${String(s2 % 60).padStart(2, "0")}s`;
}
function formatRelative(iso, locale2, now2 = Date.now()) {
  const at = iso ? Date.parse(iso) : NaN;
  if (!Number.isFinite(at)) return "";
  const diffSec = Math.round((at - now2) / 1e3);
  const rtf = new Intl.RelativeTimeFormat(locale2, { numeric: "auto" });
  const abs2 = Math.abs(diffSec);
  if (abs2 < 60) return rtf.format(diffSec, "second");
  if (abs2 < 3600) return rtf.format(Math.round(diffSec / 60), "minute");
  if (abs2 < 86400) return rtf.format(Math.round(diffSec / 3600), "hour");
  return rtf.format(Math.round(diffSec / 86400), "day");
}
function getWebLlmBridge() {
  return window.shineAI?.webLlm;
}
let subscribed = false;
const useWebLlmUiStore = create$5((set2, get2) => ({
  snapshot: null,
  loadState: "idle",
  progress: {},
  testing: {},
  lastTest: {},
  loggedIn: {},
  pending: null,
  addFlow: null,
  editing: null,
  load: async () => {
    const api2 = getWebLlmBridge();
    if (!api2) {
      set2({ loadState: "error" });
      return;
    }
    ensureSubscribed(api2);
    if (!get2().snapshot) set2({ loadState: "loading" });
    try {
      set2({ snapshot: await api2.list(), loadState: "ready" });
    } catch (err) {
      console.error("[WebLlm] 读取设置失败:", err);
      set2({ loadState: "error" });
    }
  },
  apply: (res) => {
    if (res?.snapshot) set2({ snapshot: res.snapshot, loadState: "ready" });
    return res;
  },
  runTest: async (siteId) => {
    const api2 = getWebLlmBridge();
    if (!api2 || get2().testing[siteId]) return false;
    set2((s2) => ({ testing: { ...s2.testing, [siteId]: Date.now() }, progress: { ...s2.progress, [siteId]: [] } }));
    let result2;
    try {
      const res = get2().apply(await api2.test(siteId));
      result2 = { ok: res.ok, elapsedSec: res.elapsedSec, error: res.error };
    } catch (err) {
      console.error("[WebLlm] 测试失败:", err);
      result2 = { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
    set2((s2) => {
      const { [siteId]: _done, ...rest } = s2.testing;
      return { testing: rest, lastTest: { ...s2.lastTest, [siteId]: result2 } };
    });
    return result2.ok;
  },
  setPending: (pending2) => set2({ pending: pending2 }),
  setAddFlow: (addFlow) => set2({ addFlow }),
  setEditing: (editing) => set2({ editing })
}));
function ensureSubscribed(api2) {
  if (subscribed) return;
  subscribed = true;
  api2.onProgress((event2) => {
    useWebLlmUiStore.setState((s2) => {
      const patch2 = {};
      if (event2.op === "test" && s2.testing[event2.siteId]) {
        patch2.progress = { ...s2.progress, [event2.siteId]: [...s2.progress[event2.siteId] ?? [], event2] };
      }
      if (event2.op === "login" && event2.status === "ok") {
        patch2.loggedIn = { ...s2.loggedIn, [event2.siteId]: true };
        if (s2.pending?.kind === "login" && s2.pending.siteId === event2.siteId) {
          patch2.pending = { ...s2.pending, detected: true };
        }
      }
      return patch2;
    });
  });
}
const STEPS$2 = ["open", "login", "input", "send", "wait", "extract"];
function useTicker(active) {
  const [now2, setNow] = reactExports.useState(() => Date.now());
  reactExports.useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const id2 = window.setInterval(() => setNow(Date.now()), 1e3);
    return () => window.clearInterval(id2);
  }, [active]);
  return now2;
}
function WebLlmProgressList({
  events: events2,
  running: running2,
  startedAt,
  elapsedSec
}) {
  const { t: t2 } = useTranslation("webLlm");
  const now2 = useTicker(running2);
  const latest = /* @__PURE__ */ new Map();
  for (const e3 of events2) latest.set(e3.step, e3);
  const steps2 = latest.has("foreground") ? [...STEPS$2, "foreground"] : STEPS$2;
  const seconds = running2 && startedAt ? (now2 - startedAt) / 1e3 : elapsedSec;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-border bg-bg-primary/60 px-4 py-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-2 flex items-center justify-between text-xs text-text-muted", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: running2 ? t2("progress.running") : t2("progress.title") }),
      seconds != null && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "tabular-nums", children: t2("progress.elapsed", { time: formatElapsed$1(seconds) }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("ol", { className: "space-y-1.5", "aria-live": "polite", children: steps2.map((step) => {
      const e3 = latest.get(step);
      const status2 = e3?.status;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-start gap-2 text-xs", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mt-0.5 shrink-0", children: status2 === "running" ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-3.5 w-3.5 animate-spin text-accent-blue" }) : status2 === "ok" ? /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-3.5 w-3.5 text-accent-green" }) : status2 === "fail" ? /* @__PURE__ */ jsxRuntimeExports.jsx(X$1, { className: "h-3.5 w-3.5 text-accent-red" }) : status2 === "skip" ? /* @__PURE__ */ jsxRuntimeExports.jsx(Minus, { className: "h-3.5 w-3.5 text-text-muted" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Circle, { className: "h-3.5 w-3.5 text-text-muted/40" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: status2 ? "text-text-primary" : "text-text-muted", children: t2(`steps.${step}`) }),
        e3?.detail && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "min-w-0 text-text-muted", children: e3.detail })
      ] }, step);
    }) })
  ] });
}
function shouldRevealBrowserPane(spec, maximized = null) {
  if (maximized && maximized.kind !== "browser") return true;
  const pane2 = listPanes(spec.root).find((item) => item.tabs.some((tab2) => tab2.kind === "browser"));
  if (!pane2) return true;
  if (isPaneCollapsed(pane2)) return true;
  return pane2.active !== "browser";
}
function handleBrowserPaneRequest(payload) {
  const url = typeof payload?.url === "string" ? payload.url.trim() : "";
  const ui2 = useUIStore.getState();
  const canEmbed = ui2.activeWorkspace === "project" && !!getBrowserBridge();
  if (payload?.background) {
    if (canEmbed) ui2.addViewTabInBackground("browser");
    return;
  }
  if (ui2.activeWorkspace === "workbench" && openWorkbenchDockPanel("browser")) return;
  if (canEmbed) {
    if (!shouldRevealBrowserPane(ui2.layoutSpec, ui2.maximizedSurface)) return;
    if (ui2.maximizedSurface && ui2.maximizedSurface.kind !== "browser") {
      ui2.restoreMaximizedSurface();
    }
    ui2.openViewBesideMain("browser");
    return;
  }
  if (url) void getBrowserBridge()?.openWindow?.(url);
}
const WEB_LLM_SETTINGS_TAB = "web-llm";
function revealBrowserPane() {
  const ui2 = useUIStore.getState();
  if (ui2.activeWorkspace !== "project" && ui2.activeWorkspace !== "workbench") ui2.setActiveWorkspace("project");
  window.setTimeout(() => handleBrowserPaneRequest({}), 0);
}
function returnToWebLlmSettings() {
  window.dispatchEvent(new CustomEvent("open-settings-tab", { detail: WEB_LLM_SETTINGS_TAB }));
}
const SIZE_CONFIG = {
  sm: {
    track: "h-5 w-9",
    thumb: "h-4 w-4",
    translate: "translate-x-4",
    icon: 10,
    ioBar: "w-[1.5px] h-[6px]",
    ioCircle: "w-[6px] h-[6px] border-[1.5px]",
    text: "text-[7px]",
    gap: "px-1"
  },
  md: {
    track: "h-6 w-11",
    thumb: "h-5 w-5",
    translate: "translate-x-5",
    icon: 12,
    ioBar: "w-[2px] h-2",
    ioCircle: "w-2 h-2 border-[1.5px]",
    text: "text-micro",
    gap: "px-1.5"
  },
  lg: {
    track: "h-7 w-14",
    thumb: "h-5 w-5",
    translate: "translate-x-8",
    icon: 14,
    ioBar: "w-[2px] h-2.5",
    ioCircle: "w-2.5 h-2.5 border-[1.5px]",
    text: "text-tiny",
    gap: "px-2"
  }
};
const COLOR_CONFIG = {
  blue: { bg: "bg-accent-blue", shadow: "shadow-accent-blue/20", ring: "focus-visible:ring-accent-blue/50" },
  green: { bg: "bg-accent-green", shadow: "shadow-accent-green/20", ring: "focus-visible:ring-accent-green/50" },
  purple: { bg: "bg-accent-purple", shadow: "shadow-accent-purple/20", ring: "focus-visible:ring-accent-purple/50" },
  red: { bg: "bg-accent-red", shadow: "shadow-accent-red/20", ring: "focus-visible:ring-accent-red/50" }
};
const SemanticSwitch = ({
  checked,
  onChange,
  variant = "icon",
  disabled = false,
  size = "md",
  color: color2 = "blue",
  className,
  label: label2
}) => {
  const s2 = SIZE_CONFIG[size];
  const c2 = COLOR_CONFIG[color2];
  const isIcon = variant === "icon";
  const renderIndicators = () => {
    const containerClass = [
      "absolute inset-0 flex items-center justify-between pointer-events-none",
      s2.gap
    ].join(" ");
    switch (variant) {
      case "icon":
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: containerClass, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "span",
            {
              className: [
                "text-white transition-all duration-300",
                checked ? "opacity-100 scale-100" : "opacity-0 scale-75"
              ].join(" "),
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { size: s2.icon, strokeWidth: 3 })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "span",
            {
              className: [
                "text-text-secondary transition-all duration-300",
                checked ? "opacity-0 scale-75" : "opacity-100 scale-100"
              ].join(" "),
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(X$1, { size: s2.icon, strokeWidth: 3 })
            }
          )
        ] });
      case "io":
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: containerClass, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "span",
            {
              className: [
                "transition-opacity duration-300",
                checked ? "opacity-40" : "opacity-0"
              ].join(" "),
              children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: ["block rounded-full bg-white", s2.ioBar].join(" ") })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "span",
            {
              className: [
                "transition-opacity duration-300",
                checked ? "opacity-0" : "opacity-40"
              ].join(" "),
              children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: ["block rounded-full border-white", s2.ioCircle].join(" ") })
            }
          )
        ] });
      case "text":
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: containerClass, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "span",
            {
              className: [
                "font-bold leading-none tracking-wide text-white select-none transition-opacity duration-300",
                s2.text,
                checked ? "opacity-100" : "opacity-0"
              ].join(" "),
              children: "ON"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "span",
            {
              className: [
                "font-bold leading-none tracking-wide text-white select-none transition-opacity duration-300",
                s2.text,
                checked ? "opacity-0" : "opacity-100"
              ].join(" "),
              children: "OFF"
            }
          )
        ] });
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "button",
    {
      type: "button",
      role: "switch",
      "aria-checked": checked,
      "aria-label": label2,
      disabled,
      onClick: () => !disabled && onChange(!checked),
      className: [
        "relative inline-flex shrink-0 cursor-pointer items-center rounded-full",
        "transition-colors duration-300 ease-in-out",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        s2.track,
        c2.ring,
        checked ? `border border-transparent ${c2.bg}` : "border border-border/50 bg-bg-secondary hover:bg-bg-hover",
        className
      ].join(" "),
      children: [
        renderIndicators(),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "span",
          {
            "aria-hidden": "true",
            className: [
              "pointer-events-none relative z-10 inline-block transform rounded-full bg-white ring-0",
              "transition-all duration-300",
              isIcon ? "ease-[cubic-bezier(0.34,1.56,0.64,1)]" : "ease-in-out",
              s2.thumb,
              checked ? s2.translate : "translate-x-0",
              checked && isIcon ? `shadow-lg ${c2.shadow}` : "shadow-sm ring-1 ring-border/40"
            ].join(" ")
          }
        )
      ]
    }
  );
};
const SIZE_CLASS_MAP = {
  sm: {
    trigger: "min-h-[32px] px-3 py-1.5 text-xs",
    icon: "w-3.5 h-3.5",
    panel: "p-2",
    option: "px-3 py-2 text-sm",
    label: "text-sm"
  },
  md: {
    trigger: "min-h-[40px] px-4 py-2.5 text-sm",
    icon: "w-4 h-4",
    panel: "p-2.5",
    option: "px-4 py-3 text-base",
    label: "text-base"
  }
};
function getFirstEnabledIndex(options2) {
  return options2.findIndex((option) => !option.disabled);
}
function getLastEnabledIndex(options2) {
  for (let index2 = options2.length - 1; index2 >= 0; index2 -= 1) {
    if (!options2[index2]?.disabled) return index2;
  }
  return -1;
}
function getNextEnabledIndex(options2, currentIndex, direction) {
  if (!options2.length) return -1;
  for (let offset = 1; offset <= options2.length; offset += 1) {
    const nextIndex = (currentIndex + offset * direction + options2.length) % options2.length;
    if (!options2[nextIndex]?.disabled) {
      return nextIndex;
    }
  }
  return currentIndex;
}
function toggleValue(values, nextValue) {
  if (values.includes(nextValue)) {
    return values.filter((value) => value !== nextValue);
  }
  return [...values, nextValue];
}
function getOptionSearchText(option) {
  if (option.searchText) {
    return option.searchText;
  }
  return `${String(option.label)} ${String(option.description ?? "")}`;
}
function MultiSelect({
  value,
  options: options2,
  onChange,
  placeholder: placeholder2 = instance.t("commandPalette:select.placeholder"),
  searchPlaceholder = instance.t("commandPalette:select.searchPlaceholder"),
  size = "md",
  fullWidth = true,
  disabled = false,
  emptyText = instance.t("commandPalette:select.empty"),
  emptySearchText = instance.t("commandPalette:select.noMatch")
}) {
  const listboxId = reactExports.useId();
  const triggerRef = reactExports.useRef(null);
  const panelRef = reactExports.useRef(null);
  const searchInputRef = reactExports.useRef(null);
  const optionRefs = reactExports.useRef([]);
  const shouldScrollIntoViewRef = reactExports.useRef(false);
  const [open, setOpen] = reactExports.useState(false);
  const [query, setQuery] = reactExports.useState("");
  const [activeIndex, setActiveIndex] = reactExports.useState(-1);
  const [panelStyle, setPanelStyle] = reactExports.useState(null);
  const sizeClasses = SIZE_CLASS_MAP[size];
  const queryLower = query.trim().toLowerCase();
  const filteredOptions = reactExports.useMemo(() => {
    if (!queryLower) return options2;
    return options2.filter((option) => getOptionSearchText(option).toLowerCase().includes(queryLower));
  }, [options2, queryLower]);
  const updatePanelPosition = reactExports.useCallback(() => {
    if (!triggerRef.current || !panelRef.current) return;
    const gap = 8;
    const viewportPadding = 8;
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const panelRect = panelRef.current.getBoundingClientRect();
    const maxPanelWidth = Math.min(420, window.innerWidth - viewportPadding * 2);
    const preferredWidth = Math.min(
      maxPanelWidth,
      Math.max(triggerRect.width, panelRect.width)
    );
    let left = triggerRect.left;
    if (left + preferredWidth > window.innerWidth - viewportPadding) {
      left = window.innerWidth - preferredWidth - viewportPadding;
    }
    if (left < viewportPadding) {
      left = viewportPadding;
    }
    const bottomSpace = window.innerHeight - triggerRect.bottom - viewportPadding;
    const topSpace = triggerRect.top - viewportPadding;
    const shouldOpenUpward = bottomSpace < panelRect.height + gap && topSpace > bottomSpace;
    let top = shouldOpenUpward ? triggerRect.top - panelRect.height - gap : triggerRect.bottom + gap;
    if (top + panelRect.height > window.innerHeight - viewportPadding) {
      top = window.innerHeight - panelRect.height - viewportPadding;
    }
    if (top < viewportPadding) {
      top = viewportPadding;
    }
    setPanelStyle({
      left,
      top,
      minWidth: triggerRect.width,
      maxWidth: Math.min(420, window.innerWidth - viewportPadding * 2)
    });
  }, []);
  const closePanel = reactExports.useCallback((focusTrigger = false) => {
    setOpen(false);
    setQuery("");
    setActiveIndex(-1);
    if (focusTrigger) {
      triggerRef.current?.focus();
    }
  }, []);
  const handleToggle = reactExports.useCallback((nextValue) => {
    onChange(toggleValue(value, nextValue));
  }, [onChange, value]);
  reactExports.useEffect(() => {
    if (!open) return;
    const handleOutsideClick = (event2) => {
      const target2 = event2.target;
      if (triggerRef.current?.contains(target2) || panelRef.current?.contains(target2)) {
        return;
      }
      closePanel(false);
    };
    const handleEscape = (event2) => {
      if (event2.key === "Escape") {
        event2.preventDefault();
        closePanel(true);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [closePanel, open]);
  reactExports.useLayoutEffect(() => {
    if (!open) {
      setPanelStyle(null);
      return;
    }
    const frame2 = window.requestAnimationFrame(() => {
      updatePanelPosition();
    });
    const handleViewportChange = (event2) => {
      if (event2.target && panelRef.current?.contains(event2.target)) {
        return;
      }
      updatePanelPosition();
    };
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);
    return () => {
      window.cancelAnimationFrame(frame2);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [open, updatePanelPosition, filteredOptions.length]);
  reactExports.useEffect(() => {
    if (!open) return;
    const selectedIndex = filteredOptions.findIndex((option) => value.includes(option.value) && !option.disabled);
    const defaultIndex = selectedIndex >= 0 ? selectedIndex : getFirstEnabledIndex(filteredOptions);
    shouldScrollIntoViewRef.current = true;
    setActiveIndex(defaultIndex);
  }, [filteredOptions, open, value]);
  reactExports.useEffect(() => {
    if (!open || activeIndex < 0) return;
    if (!shouldScrollIntoViewRef.current) return;
    shouldScrollIntoViewRef.current = false;
    optionRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);
  reactExports.useEffect(() => {
    if (!open) return;
    const frame2 = window.requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });
    return () => {
      window.cancelAnimationFrame(frame2);
    };
  }, [open]);
  const handleTriggerKeyDown = (event2) => {
    if (disabled) return;
    if (!open) {
      if (event2.key === "ArrowDown" || event2.key === "Enter" || event2.key === " ") {
        event2.preventDefault();
        setOpen(true);
        return;
      }
      if (event2.key === "ArrowUp") {
        event2.preventDefault();
        shouldScrollIntoViewRef.current = true;
        setOpen(true);
        setActiveIndex(getLastEnabledIndex(filteredOptions));
      }
      return;
    }
    if (event2.key === "ArrowDown") {
      event2.preventDefault();
      shouldScrollIntoViewRef.current = true;
      setActiveIndex((currentIndex) => {
        const baseIndex = currentIndex >= 0 ? currentIndex : getFirstEnabledIndex(filteredOptions);
        return getNextEnabledIndex(filteredOptions, baseIndex, 1);
      });
      return;
    }
    if (event2.key === "ArrowUp") {
      event2.preventDefault();
      shouldScrollIntoViewRef.current = true;
      setActiveIndex((currentIndex) => {
        const baseIndex = currentIndex >= 0 ? currentIndex : getLastEnabledIndex(filteredOptions);
        return getNextEnabledIndex(filteredOptions, baseIndex, -1);
      });
      return;
    }
    if (event2.key === "Home") {
      event2.preventDefault();
      shouldScrollIntoViewRef.current = true;
      setActiveIndex(getFirstEnabledIndex(filteredOptions));
      return;
    }
    if (event2.key === "End") {
      event2.preventDefault();
      shouldScrollIntoViewRef.current = true;
      setActiveIndex(getLastEnabledIndex(filteredOptions));
      return;
    }
    if (event2.key === "Enter" || event2.key === " ") {
      event2.preventDefault();
      const option = filteredOptions[activeIndex];
      if (option && !option.disabled) {
        handleToggle(option.value);
      }
      return;
    }
    if (event2.key === "Escape") {
      event2.preventDefault();
      closePanel(true);
    }
  };
  const handleSearchKeyDown = (event2) => {
    if (event2.key === "ArrowDown") {
      event2.preventDefault();
      const firstIndex = getFirstEnabledIndex(filteredOptions);
      shouldScrollIntoViewRef.current = true;
      setActiveIndex(firstIndex);
      if (firstIndex >= 0) {
        window.requestAnimationFrame(() => {
          optionRefs.current[firstIndex]?.focus();
        });
      }
      return;
    }
    if (event2.key === "ArrowUp") {
      event2.preventDefault();
      const lastIndex = getLastEnabledIndex(filteredOptions);
      shouldScrollIntoViewRef.current = true;
      setActiveIndex(lastIndex);
      if (lastIndex >= 0) {
        window.requestAnimationFrame(() => {
          optionRefs.current[lastIndex]?.focus();
        });
      }
      return;
    }
    if (event2.key === "Home") {
      event2.preventDefault();
      shouldScrollIntoViewRef.current = true;
      setActiveIndex(getFirstEnabledIndex(filteredOptions));
      return;
    }
    if (event2.key === "End") {
      event2.preventDefault();
      shouldScrollIntoViewRef.current = true;
      setActiveIndex(getLastEnabledIndex(filteredOptions));
      return;
    }
    if (event2.key === "Escape") {
      event2.preventDefault();
      closePanel(true);
    }
  };
  const handleOptionKeyDown = (event2, index2) => {
    if (event2.key === "ArrowDown") {
      event2.preventDefault();
      const nextIndex = getNextEnabledIndex(filteredOptions, index2, 1);
      shouldScrollIntoViewRef.current = true;
      setActiveIndex(nextIndex);
      optionRefs.current[nextIndex]?.focus();
      return;
    }
    if (event2.key === "ArrowUp") {
      event2.preventDefault();
      const prevIndex = getNextEnabledIndex(filteredOptions, index2, -1);
      shouldScrollIntoViewRef.current = true;
      setActiveIndex(prevIndex);
      optionRefs.current[prevIndex]?.focus();
      return;
    }
    if (event2.key === "Home") {
      event2.preventDefault();
      const firstIndex = getFirstEnabledIndex(filteredOptions);
      shouldScrollIntoViewRef.current = true;
      setActiveIndex(firstIndex);
      optionRefs.current[firstIndex]?.focus();
      return;
    }
    if (event2.key === "End") {
      event2.preventDefault();
      const lastIndex = getLastEnabledIndex(filteredOptions);
      shouldScrollIntoViewRef.current = true;
      setActiveIndex(lastIndex);
      optionRefs.current[lastIndex]?.focus();
      return;
    }
    if (event2.key === "Enter" || event2.key === " ") {
      event2.preventDefault();
      const option = filteredOptions[index2];
      if (option && !option.disabled) {
        handleToggle(option.value);
      }
      return;
    }
    if (event2.key === "Escape") {
      event2.preventDefault();
      closePanel(true);
    }
  };
  const triggerLabel = value.length > 0 ? instance.t("commandPalette:multiSelect.selectedCount", { count: value.length }) : placeholder2;
  const showEmptyText = options2.length === 0 ? emptyText : emptySearchText;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        ref: triggerRef,
        type: "button",
        disabled,
        "aria-haspopup": "listbox",
        "aria-expanded": open,
        "aria-controls": listboxId,
        onClick: () => !disabled && setOpen((current) => !current),
        onKeyDown: handleTriggerKeyDown,
        className: [
          "inline-flex items-center justify-between gap-3 text-left outline-none transition-all",
          fullWidth ? "w-full" : "w-auto",
          sizeClasses.trigger,
          "rounded-full border border-border/70 bg-bg-primary text-text-primary shadow-sm",
          "hover:border-border hover:bg-bg-secondary",
          "focus-visible:ring-2 focus-visible:ring-accent-blue/20 focus-visible:border-accent-blue/45",
          "disabled:cursor-not-allowed disabled:opacity-50"
        ].join(" "),
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: [
            "min-w-0 flex-1 truncate",
            value.length > 0 ? "text-text-primary" : "text-text-muted",
            sizeClasses.label
          ].join(" "), children: triggerLabel }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronsUpDown, { className: [
            "shrink-0 text-text-secondary transition-transform",
            sizeClasses.icon,
            open ? "scale-[1.05] text-text-primary" : ""
          ].join(" ") })
        ]
      }
    ),
    open && reactDomExports.createPortal(
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          ref: panelRef,
          id: listboxId,
          role: "listbox",
          "aria-multiselectable": "true",
          "aria-activedescendant": activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : void 0,
          className: [
            "fixed z-[10020] max-h-[320px] max-w-[420px] overflow-y-auto rounded-[24px] border border-border/70",
            "bg-bg-primary shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-md",
            sizeClasses.panel
          ].join(" "),
          style: panelStyle ?? { opacity: 0 },
          children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                ref: searchInputRef,
                type: "text",
                value: query,
                onChange: (event2) => setQuery(event2.target.value),
                onKeyDown: handleSearchKeyDown,
                placeholder: searchPlaceholder,
                className: "w-full rounded-full border border-border/70 bg-bg-secondary px-3 py-1.5 text-xs text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-accent-blue/45 focus:ring-2 focus:ring-accent-blue/20"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-1", children: filteredOptions.length > 0 ? filteredOptions.map((option, index2) => {
              const selected2 = value.includes(option.value);
              const active = index2 === activeIndex;
              return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  id: `${listboxId}-option-${index2}`,
                  ref: (node2) => {
                    optionRefs.current[index2] = node2;
                  },
                  type: "button",
                  role: "option",
                  "aria-selected": selected2,
                  disabled: option.disabled,
                  onMouseEnter: () => {
                    if (!option.disabled) {
                      setActiveIndex(index2);
                    }
                  },
                  onMouseDown: (event2) => event2.preventDefault(),
                  onClick: () => {
                    if (!option.disabled) {
                      handleToggle(option.value);
                    }
                  },
                  onKeyDown: (event2) => handleOptionKeyDown(event2, index2),
                  className: [
                    "group flex w-full items-start gap-3 rounded-2xl border border-transparent text-left transition-colors",
                    "disabled:cursor-not-allowed disabled:opacity-40",
                    sizeClasses.option,
                    selected2 || active ? "bg-bg-secondary text-text-primary" : "text-text-primary hover:bg-bg-secondary/80"
                  ].join(" "),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "span",
                      {
                        className: [
                          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                          selected2 ? "bg-accent-blue border-accent-blue text-white" : "border-border/70 bg-transparent"
                        ].join(" "),
                        children: selected2 && /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-3 w-3" })
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex min-w-0 flex-1 flex-col", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: [
                        "truncate leading-tight",
                        sizeClasses.label
                      ].join(" "), children: option.label }),
                      option.description && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mt-1 truncate text-text-secondary text-caption", children: option.description })
                    ] })
                  ]
                },
                `${option.value}-${index2}`
              );
            }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-3 py-2 text-xs text-text-muted", children: showEmptyText }) })
          ] })
        }
      ),
      document.body
    )
  ] });
}
function SectionHeader({ title: title2, description: description2 }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-base font-semibold text-text-primary", children: title2 }),
    description2 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-text-muted", children: description2 })
  ] });
}
function SettingCard({ children: children2 }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border border-border bg-bg-secondary/50 divide-y divide-border", children: children2 });
}
function SettingRow({
  title: title2,
  description: description2,
  children: children2
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-4 px-5 py-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium text-text-primary", children: title2 }),
      description2 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-0.5 text-xs text-text-muted leading-relaxed", children: description2 })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "shrink-0", children: children2 })
  ] });
}
function AdvancedSettingsSection({
  title: title2 = instance.t("settingsProviderGuideCatalog:shared.advancedSettings"),
  description: description2,
  defaultOpen = false,
  children: children2
}) {
  const [open, setOpen] = reactExports.useState(defaultOpen);
  return (
    // 与普通设置卡片刻意区分：虚线边框 + 更浅底 + 悬停高亮 + 明确的「展开/收起」提示，
    // 否则用户会把它当成一块静态设置、注意不到可以展开。
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-dashed border-border bg-bg-tertiary/20", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "button",
          onClick: () => setOpen((v2) => !v2),
          "aria-expanded": open,
          className: "flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left btn-transition rounded-xl cursor-pointer hover:border-accent-blue/40 hover:bg-bg-hover/60",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "min-w-0 flex items-center gap-2.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SlidersHorizontal, { className: "h-4 w-4 shrink-0 text-text-muted", "aria-hidden": true }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "min-w-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-sm font-medium text-text-primary", children: title2 }),
                description2 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mt-0.5 block text-xs text-text-muted leading-relaxed", children: description2 })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex shrink-0 items-center gap-1 text-xs text-text-muted", children: [
              open ? instance.t("settingsProviderGuideCatalog:shared.collapse") : instance.t("settingsProviderGuideCatalog:shared.expand"),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                ChevronDown,
                {
                  className: `h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`,
                  "aria-hidden": true
                }
              )
            ] })
          ]
        }
      ),
      open && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "divide-y divide-border border-t border-dashed border-border", children: children2 })
    ] })
  );
}
function toast(message2, type) {
  useUIStore.getState().showToast?.(message2, type);
}
function failText(error2) {
  return error2 || instance.t("webLlm:errors.generic");
}
async function startLogin(site2) {
  const api2 = getWebLlmBridge();
  const store2 = useWebLlmUiStore.getState();
  if (!api2) return;
  try {
    const res = store2.apply(await api2.openLogin(site2.id));
    if (!res.ok) {
      toast(failText(res.error), "error");
      return;
    }
    store2.setPending({ kind: "login", siteId: site2.id, siteName: site2.name, startedAt: Date.now(), detected: false });
    revealBrowserPane();
  } catch (err) {
    console.error("[WebLlm] 打开登录页失败:", err);
    toast(failText(), "error");
  }
}
function confirmLoggedIn(siteId) {
  void getWebLlmBridge()?.stopLoginWatch(siteId).catch(() => {
  });
  useWebLlmUiStore.setState((s2) => ({
    loggedIn: { ...s2.loggedIn, [siteId]: true },
    pending: s2.pending?.siteId === siteId ? null : s2.pending
  }));
}
function stopLoginWatch(siteId) {
  void getWebLlmBridge()?.stopLoginWatch(siteId).catch(() => {
  });
  useWebLlmUiStore.setState((s2) => ({ pending: s2.pending?.kind === "login" && s2.pending.siteId === siteId ? null : s2.pending }));
}
async function startPick(site2, field2) {
  const api2 = getWebLlmBridge();
  const store2 = useWebLlmUiStore.getState();
  if (!api2 || store2.pending?.kind === "pick") return;
  store2.setPending({ kind: "pick", siteId: site2.id, siteName: site2.name, field: field2, startedAt: Date.now() });
  revealBrowserPane();
  try {
    const res = store2.apply(await api2.pick(site2.id, field2));
    if (res.cancelled) toast(instance.t("webLlm:pick.cancelled"), "info");
    else if (res.ok) toast(instance.t("webLlm:pick.saved"), "success");
    else toast(failText(res.error), "error");
  } catch (err) {
    console.error("[WebLlm] 拾取元素失败:", err);
    toast(failText(), "error");
  } finally {
    useWebLlmUiStore.getState().setPending(null);
    useWebLlmUiStore.getState().setEditing({ siteId: site2.id, focusField: field2 });
    returnToWebLlmSettings();
  }
}
const btn$2 = "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs btn-transition disabled:cursor-not-allowed disabled:opacity-50";
const primaryBtn = `${btn$2} bg-accent-blue text-white hover:bg-accent-blue/85`;
const secondaryBtn = `${btn$2} border border-border bg-bg-tertiary text-text-primary hover:border-accent-blue/30`;
function WebLlmAddFlow({ site: site2, browserAvailable }) {
  const { t: t2 } = useTranslation("webLlm");
  const flow2 = useWebLlmUiStore((s2) => s2.addFlow);
  const setAddFlow = useWebLlmUiStore((s2) => s2.setAddFlow);
  const loggedIn = useWebLlmUiStore((s2) => Boolean(s2.loggedIn[site2.id]));
  const watching = useWebLlmUiStore((s2) => s2.pending?.kind === "login" && s2.pending.siteId === site2.id);
  const testingSince = useWebLlmUiStore((s2) => s2.testing[site2.id]);
  const events2 = useWebLlmUiStore((s2) => s2.progress[site2.id] ?? []);
  const lastTest = useWebLlmUiStore((s2) => s2.lastTest[site2.id]);
  const runTest = useWebLlmUiStore((s2) => s2.runTest);
  const apply2 = useWebLlmUiStore((s2) => s2.apply);
  const setEditing = useWebLlmUiStore((s2) => s2.setEditing);
  const [savingDefault, setSavingDefault] = reactExports.useState(false);
  const step = flow2?.step ?? 1;
  const close2 = () => {
    stopLoginWatch(site2.id);
    setAddFlow(null);
  };
  const retest = () => {
    setAddFlow({ siteId: site2.id, step: 2 });
    void runTest(site2.id).then((ok2) => {
      const ui2 = useWebLlmUiStore.getState();
      if (ok2 && ui2.addFlow?.siteId === site2.id) ui2.setAddFlow({ siteId: site2.id, step: 3 });
    });
  };
  const goTest = () => {
    if (!loggedIn) confirmLoggedIn(site2.id);
    else stopLoginWatch(site2.id);
    retest();
  };
  const makeDefault = async () => {
    const api2 = getWebLlmBridge();
    if (!api2 || savingDefault) return;
    setSavingDefault(true);
    try {
      apply2(await api2.setDefault(site2.id));
    } finally {
      setSavingDefault(false);
    }
  };
  const failed2 = step === 2 && !testingSince && lastTest && !lastTest.ok;
  const fix = failed2 ? fixActionFor(site2) ?? "retest" : null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-accent-blue/30 bg-bg-secondary/50", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3 border-b border-border px-5 py-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-w-0 text-sm font-medium text-text-primary", children: t2("add.title", { name: site2.name }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: close2, className: "rounded p-1 text-text-muted hover:bg-bg-hover hover:text-text-primary", "aria-label": t2("add.close"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(X$1, { className: "h-4 w-4" }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("ol", { className: "flex items-center gap-2 px-5 pt-4 text-xs", children: [1, 2, 3].map((n2) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex min-w-0 flex-1 items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "span",
        {
          className: [
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-tiny font-semibold",
            n2 < step ? "bg-accent-green/15 text-accent-green" : n2 === step ? "bg-accent-blue text-white" : "bg-bg-tertiary text-text-muted"
          ].join(" "),
          children: n2 < step ? /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-3 w-3" }) : n2
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `truncate ${n2 === step ? "text-text-primary" : "text-text-muted"}`, children: t2(`add.steps.${n2}`) }),
      n2 < 3 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-px flex-1 bg-border" })
    ] }, n2)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 px-5 py-4", children: [
      step === 1 && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs leading-relaxed text-text-muted", children: t2("add.loginHint") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: secondaryBtn, disabled: !browserAvailable, onClick: () => void startLogin(site2), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "h-3.5 w-3.5" }),
            t2("add.openLogin", { name: site2.name })
          ] }),
          loggedIn ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1.5 text-xs text-accent-green", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-3.5 w-3.5" }),
            t2("add.loginDetected")
          ] }) : watching ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1.5 text-xs text-text-muted", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-3.5 w-3.5 animate-spin" }),
            t2("add.loginWatching")
          ] }) : null
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: primaryBtn, disabled: !browserAvailable, onClick: goTest, children: loggedIn ? t2("add.next") : t2("add.manualLoggedIn") }) })
      ] }),
      step === 2 && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          WebLlmProgressList,
          {
            events: events2,
            running: Boolean(testingSince),
            startedAt: testingSince,
            elapsedSec: lastTest?.elapsedSec
          }
        ),
        failed2 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs leading-relaxed text-accent-red", children: site2.lastError?.message || lastTest?.error || t2("errors.generic") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-2", children: [
            fix !== "retest" && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: secondaryBtn, onClick: retest, children: t2("actions.retest") }),
            fix === "login" && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: primaryBtn, onClick: () => {
              setAddFlow({ siteId: site2.id, step: 1 });
              void startLogin(site2);
            }, children: t2("actions.login") }),
            fix === "pick" && /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                className: primaryBtn,
                onClick: () => {
                  setAddFlow(null);
                  setEditing({ siteId: site2.id, focusField: overrideFieldForStep(site2.lastError?.step) });
                },
                children: t2("actions.pick")
              }
            ),
            fix === "retest" && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: primaryBtn, onClick: retest, children: t2("actions.retest") })
          ] })
        ] })
      ] }),
      step === 3 && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "inline-flex items-center gap-1.5 text-sm text-accent-green", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-4 w-4" }),
          t2("add.ready", { name: site2.name })
        ] }),
        site2.learned?.needsForeground && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-text-muted", children: t2("site.needsForegroundHint") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-2", children: [
          site2.isDefault ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1.5 text-xs text-text-muted", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Star, { className: "h-3.5 w-3.5 fill-accent-yellow text-accent-yellow" }),
            t2("site.isDefault")
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: secondaryBtn, disabled: savingDefault, onClick: () => void makeDefault(), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Star, { className: "h-3.5 w-3.5" }),
            t2("actions.setDefault")
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: primaryBtn, onClick: () => setAddFlow(null), children: t2("add.done") })
        ] })
      ] })
    ] })
  ] });
}
const STATUS_TONE$1 = {
  ready: "bg-accent-green/12 text-accent-green",
  untested: "bg-bg-tertiary text-text-muted",
  not_logged_in: "bg-accent-yellow/12 text-accent-yellow",
  needs_calibration: "bg-accent-yellow/12 text-accent-yellow",
  captcha: "bg-accent-yellow/12 text-accent-yellow",
  error: "bg-accent-red/12 text-accent-red"
};
const iconBtn$1 = "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-text-secondary btn-transition hover:bg-bg-hover hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50";
function SiteAvatar({ name: name2 }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-bg-tertiary text-sm font-semibold text-text-secondary", "aria-hidden": true, children: name2.trim().charAt(0).toUpperCase() || "?" });
}
function WebLlmSiteCard({ site: site2, browserAvailable }) {
  const { t: t2, i18n } = useTranslation("webLlm");
  const testingSince = useWebLlmUiStore((s2) => s2.testing[site2.id]);
  const events2 = useWebLlmUiStore((s2) => s2.progress[site2.id] ?? []);
  const editing = useWebLlmUiStore((s2) => s2.editing?.siteId === site2.id ? s2.editing : null);
  const setEditing = useWebLlmUiStore((s2) => s2.setEditing);
  const runTest = useWebLlmUiStore((s2) => s2.runTest);
  const apply2 = useWebLlmUiStore((s2) => s2.apply);
  const [busy, setBusy] = reactExports.useState(false);
  const testing = Boolean(testingSince);
  const fix = testing ? null : fixActionFor(site2);
  const setDefault = async () => {
    const api2 = getWebLlmBridge();
    if (!api2 || busy || site2.isDefault) return;
    setBusy(true);
    try {
      apply2(await api2.setDefault(site2.id));
    } finally {
      setBusy(false);
    }
  };
  const remove2 = async () => {
    const api2 = getWebLlmBridge();
    if (!api2 || busy) return;
    const ok2 = await confirmAsync({
      title: t2("site.deleteTitle"),
      message: t2("site.deleteMessage", { name: site2.name }),
      confirmText: t2("actions.delete"),
      danger: true
    });
    if (!ok2) return;
    setBusy(true);
    try {
      const res = apply2(await api2.deleteSite(site2.id));
      if (!res.ok) useUIStore.getState().showToast?.(res.error || t2("errors.generic"), "error");
    } finally {
      setBusy(false);
    }
  };
  const meta2 = [
    site2.lastSuccessAt ? t2("site.lastSuccess", { time: formatRelative(site2.lastSuccessAt, i18n.language) }) : null,
    site2.learned?.avgSec != null ? t2("site.avg", { time: formatElapsed$1(site2.learned.avgSec) }) : null,
    site2.learned?.needsForeground ? t2("site.needsForeground") : null
  ].filter(Boolean);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border bg-bg-secondary/50", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3 px-5 py-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SiteAvatar, { name: site2.name }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate text-sm font-medium text-text-primary", children: site2.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: () => void setDefault(),
              disabled: busy,
              title: site2.isDefault ? t2("site.isDefault") : t2("actions.setDefault"),
              "aria-label": site2.isDefault ? t2("site.isDefault") : t2("actions.setDefault"),
              "aria-pressed": Boolean(site2.isDefault),
              className: "rounded p-0.5 hover:bg-bg-hover",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(Star, { className: `h-3.5 w-3.5 ${site2.isDefault ? "fill-accent-yellow text-accent-yellow" : "text-text-muted"}` })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `rounded px-1.5 py-0.5 text-tiny font-medium ${STATUS_TONE$1[site2.status]}`, children: t2(`status.${site2.status}`) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-0.5 truncate text-xs text-text-muted", children: site2.host || site2.url }),
        meta2.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-xs text-text-muted", children: meta2.join(" · ") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex shrink-0 items-center gap-0.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: iconBtn$1, disabled: testing || !browserAvailable, onClick: () => void runTest(site2.id), children: [
          testing ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-3.5 w-3.5 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { className: "h-3.5 w-3.5" }),
          testing ? t2("actions.testing") : t2("actions.test")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: iconBtn$1, disabled: testing || !browserAvailable, onClick: () => void startLogin(site2), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(LogIn, { className: "h-3.5 w-3.5" }),
          t2("actions.login")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: iconBtn$1, onClick: () => setEditing(editing ? null : { siteId: site2.id }), "aria-expanded": Boolean(editing), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "h-3.5 w-3.5" }),
          t2("actions.edit")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: `${iconBtn$1} hover:text-accent-red`, disabled: testing || busy, onClick: () => void remove2(), "aria-label": t2("actions.delete"), title: t2("actions.delete"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3.5 w-3.5" }) })
      ] })
    ] }),
    fix && site2.lastError && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3 border-t border-border px-5 py-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "min-w-0 text-xs leading-relaxed text-accent-red", children: [
        site2.lastError.step ? `${t2(`steps.${site2.lastError.step}`)} · ` : "",
        site2.lastError.message || t2(`errorCodes.${site2.lastError.code}`)
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          className: `${secondaryBtn} shrink-0`,
          disabled: !browserAvailable,
          onClick: () => {
            if (fix === "login") void startLogin(site2);
            else if (fix === "pick") setEditing({ siteId: site2.id, focusField: overrideFieldForStep(site2.lastError?.step) });
            else void runTest(site2.id);
          },
          children: fix === "login" ? t2("actions.login") : fix === "pick" ? t2("actions.pick") : t2("actions.retest")
        }
      )
    ] }),
    testing && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-t border-border px-5 py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(WebLlmProgressList, { events: events2, running: true, startedAt: testingSince }) }),
    editing && /* @__PURE__ */ jsxRuntimeExports.jsx(SiteEditor, { site: site2, focusField: editing.focusField, browserAvailable, onClose: () => setEditing(null) }, site2.id)
  ] });
}
function SiteEditor({
  site: site2,
  focusField,
  browserAvailable,
  onClose
}) {
  const { t: t2 } = useTranslation("webLlm");
  const apply2 = useWebLlmUiStore((s2) => s2.apply);
  const picking = useWebLlmUiStore((s2) => s2.pending?.kind === "pick");
  const [name2, setName] = reactExports.useState(site2.name);
  const [url, setUrl] = reactExports.useState(site2.url);
  const [maxChars, setMaxChars] = reactExports.useState(site2.maxChars != null ? String(site2.maxChars) : "");
  const [saving, setSaving] = reactExports.useState(false);
  const [error2, setError] = reactExports.useState(null);
  const nameError = !name2.trim() ? t2("form.nameRequired") : null;
  const urlError = !isHttpUrl$1(url) ? t2("form.urlInvalid") : null;
  const maxCharsError = maxChars.trim() && !/^[1-9]\d*$/.test(maxChars.trim()) ? t2("form.maxCharsInvalid") : null;
  const invalid = Boolean(nameError || urlError || maxCharsError);
  const save2 = async () => {
    const api2 = getWebLlmBridge();
    if (!api2 || invalid || saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = apply2(await api2.saveSite({
        id: site2.id,
        name: name2.trim(),
        url: url.trim(),
        maxChars: maxChars.trim() ? Number(maxChars.trim()) : null
      }));
      if (res.ok) onClose();
      else setError(res.error || t2("errors.generic"));
    } catch (err) {
      console.error("[WebLlm] 保存站点失败:", err);
      setError(t2("errors.generic"));
    } finally {
      setSaving(false);
    }
  };
  const clearOverride = async (field2) => {
    const api2 = getWebLlmBridge();
    if (!api2) return;
    const res = apply2(await api2.saveSite({ id: site2.id, overrides: { [field2]: null } }));
    if (!res.ok) useUIStore.getState().showToast?.(res.error || t2("errors.generic"), "error");
  };
  const input2 = "w-full rounded-md border border-border bg-bg-primary px-3 py-1.5 text-sm text-text-primary outline-none transition focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 border-t border-border px-5 py-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-3 sm:grid-cols-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block space-y-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-text-secondary", children: t2("form.name") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: input2, value: name2, onChange: (e3) => setName(e3.target.value), "aria-invalid": Boolean(nameError) }),
        nameError && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-accent-red", children: nameError })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block space-y-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-text-secondary", children: t2("form.url") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: input2, value: url, onChange: (e3) => setUrl(e3.target.value), "aria-invalid": Boolean(urlError), spellCheck: false }),
        urlError && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-accent-red", children: urlError })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(AdvancedSettingsSection, { title: t2("advanced.title"), description: t2("advanced.description"), defaultOpen: Boolean(focusField), children: [
      WEB_LLM_OVERRIDE_FIELDS.map((field2) => {
        const selector2 = site2.overrides?.[field2];
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `flex items-center justify-between gap-4 px-5 py-3 ${focusField === field2 ? "bg-accent-blue/8" : ""}`, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-text-primary", children: t2(`fields.${field2}`) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-0.5 truncate font-mono text-xs text-text-muted", title: selector2, children: selector2 || t2("advanced.auto") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex shrink-0 gap-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: iconBtn$1, disabled: picking || !browserAvailable, onClick: () => void startPick(site2, field2), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Crosshair, { className: "h-3.5 w-3.5" }),
              t2("actions.pick")
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: iconBtn$1, disabled: !selector2, onClick: () => void clearOverride(field2), children: t2("actions.clear") })
          ] })
        ] }, field2);
      }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-4 px-5 py-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-text-primary", children: t2("form.maxChars") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-0.5 text-xs text-text-muted", children: maxCharsError || t2("form.maxCharsHint") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-32 shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            className: `${input2} tabular-nums`,
            inputMode: "numeric",
            placeholder: "100000",
            value: maxChars,
            onChange: (e3) => setMaxChars(e3.target.value),
            "aria-invalid": Boolean(maxCharsError)
          }
        ) })
      ] })
    ] }),
    error2 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-accent-red", children: error2 }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: secondaryBtn, onClick: onClose, children: t2("actions.cancel") }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: primaryBtn, disabled: invalid || saving, onClick: () => void save2(), children: [
        saving && /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-3.5 w-3.5 animate-spin" }),
        t2("actions.save")
      ] })
    ] })
  ] });
}
function toastError(message2) {
  useUIStore.getState().showToast?.(message2, "error");
}
function WebLlmSettingsSection() {
  const { t: t2 } = useTranslation("webLlm");
  const snapshot2 = useWebLlmUiStore((s2) => s2.snapshot);
  const loadState = useWebLlmUiStore((s2) => s2.loadState);
  const addFlow = useWebLlmUiStore((s2) => s2.addFlow);
  const load = useWebLlmUiStore((s2) => s2.load);
  const apply2 = useWebLlmUiStore((s2) => s2.apply);
  const [toggling, setToggling] = reactExports.useState(false);
  const [riskOpen, setRiskOpen] = reactExports.useState(false);
  const [riskChecked, setRiskChecked] = reactExports.useState(false);
  const [pickerOpen, setPickerOpen] = reactExports.useState(false);
  reactExports.useEffect(() => {
    void load();
    void getWebLlmBridge()?.refreshPresets().then((next2) => useWebLlmUiStore.setState({ snapshot: next2, loadState: "ready" })).catch(() => {
    });
  }, [load]);
  const setEnabled = async (enabled, riskAcknowledged) => {
    const api2 = getWebLlmBridge();
    if (!api2 || toggling) return;
    setToggling(true);
    try {
      const res = apply2(await api2.setEnabled({ enabled, riskAcknowledged }));
      if (!res.ok) toastError(res.error || t2("errors.generic"));
    } catch (err) {
      console.error("[WebLlm] 切换总开关失败:", err);
      toastError(t2("errors.generic"));
    } finally {
      setToggling(false);
    }
  };
  const handleToggle = (checked) => {
    if (checked && !snapshot2?.riskAcknowledgedAt) {
      setRiskChecked(false);
      setRiskOpen(true);
      return;
    }
    void setEnabled(checked);
  };
  const sites2 = snapshot2?.sites ?? [];
  const flowSite = addFlow ? sites2.find((s2) => s2.id === addFlow.siteId) : void 0;
  const browserAvailable = snapshot2?.browserAvailable !== false;
  const showPicker = !flowSite && (sites2.length === 0 || pickerOpen);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(SectionHeader, { title: t2("title"), description: t2("description") }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(SettingCard, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingRow, { title: t2("master.title"), description: t2("master.description"), children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
      (loadState === "loading" || toggling) && /* @__PURE__ */ jsxRuntimeExports.jsx(RotateCw, { className: "h-4 w-4 animate-spin text-text-muted" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        SemanticSwitch,
        {
          checked: Boolean(snapshot2?.enabled),
          disabled: loadState !== "ready" || toggling,
          onChange: handleToggle,
          size: "sm",
          label: t2("master.title")
        }
      )
    ] }) }) }),
    loadState === "error" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3 rounded-lg border border-accent-yellow/30 bg-accent-yellow/8 px-4 py-3 text-xs text-accent-yellow", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "h-3.5 w-3.5 shrink-0" }),
        t2("loadError")
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: secondaryBtn, onClick: () => void load(), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(RotateCw, { className: "h-3 w-3" }),
        t2("actions.retry")
      ] })
    ] }),
    snapshot2 && !snapshot2.enabled && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs leading-relaxed text-text-muted", children: t2("disabledHint") }),
    snapshot2?.enabled && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      !browserAvailable && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3 rounded-lg border border-accent-yellow/30 bg-accent-yellow/8 px-4 py-3 text-xs leading-relaxed text-accent-yellow", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-start gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "mt-0.5 h-3.5 w-3.5 shrink-0" }),
          t2("browserUnavailable")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            className: `${secondaryBtn} shrink-0`,
            onClick: () => window.dispatchEvent(new CustomEvent("open-settings-tab", { detail: "builtin-browser" })),
            children: t2("actions.openBrowserSettings")
          }
        )
      ] }),
      flowSite && /* @__PURE__ */ jsxRuntimeExports.jsx(WebLlmAddFlow, { site: flowSite, browserAvailable }),
      showPicker && /* @__PURE__ */ jsxRuntimeExports.jsx(
        AddSitePicker,
        {
          closable: sites2.length > 0,
          onClose: () => setPickerOpen(false),
          onAdded: () => setPickerOpen(false)
        }
      ),
      sites2.some((site2) => site2.id !== flowSite?.id) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-sm font-medium text-text-primary", children: t2("sites.title") }),
          !showPicker && !flowSite && /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: secondaryBtn, onClick: () => setPickerOpen(true), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Plus$1, { className: "h-3.5 w-3.5" }),
            t2("actions.addSite")
          ] })
        ] }),
        sites2.filter((site2) => site2.id !== flowSite?.id).map((site2) => /* @__PURE__ */ jsxRuntimeExports.jsx(WebLlmSiteCard, { site: site2, browserAvailable }, site2.id))
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SensitiveAllowlist, { paths: snapshot2.sensitiveAllowlist ?? [] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "flex items-center gap-1.5 text-caption text-text-muted", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Globe, { className: "h-3 w-3" }),
      t2("footnote")
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      ConfirmDialog$1,
      {
        open: riskOpen,
        title: t2("risk.title"),
        message: t2("risk.intro"),
        maxWidthClassName: "max-w-md",
        confirmText: t2("risk.confirm"),
        confirmDisabled: !riskChecked,
        onCancel: () => setRiskOpen(false),
        onConfirm: () => {
          setRiskOpen(false);
          void setEnabled(true, true);
        },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-text-secondary", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: t2("risk.terms") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: t2("risk.account") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: t2("risk.thirdParty") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex cursor-pointer items-center gap-2 text-sm text-text-primary", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", checked: riskChecked, onChange: (e3) => setRiskChecked(e3.target.checked), className: "h-4 w-4 accent-accent-blue" }),
            t2("risk.acknowledge")
          ] })
        ]
      }
    )
  ] });
}
function AddSitePicker({ closable, onClose, onAdded }) {
  const { t: t2 } = useTranslation("webLlm");
  const snapshot2 = useWebLlmUiStore((s2) => s2.snapshot);
  const apply2 = useWebLlmUiStore((s2) => s2.apply);
  const setAddFlow = useWebLlmUiStore((s2) => s2.setAddFlow);
  const [busyId, setBusyId] = reactExports.useState(null);
  const [customOpen, setCustomOpen] = reactExports.useState(false);
  const [name2, setName] = reactExports.useState("");
  const [url, setUrl] = reactExports.useState("");
  const [touched, setTouched] = reactExports.useState(false);
  const [error2, setError] = reactExports.useState(null);
  const presets = reactExports.useMemo(() => {
    const added = new Set((snapshot2?.sites ?? []).map((s2) => s2.id));
    return (snapshot2?.presets ?? []).filter((p2) => !added.has(p2.id));
  }, [snapshot2]);
  const add2 = async (input22, key2) => {
    const api2 = getWebLlmBridge();
    if (!api2 || busyId) return;
    setBusyId(key2);
    setError(null);
    try {
      const res = apply2(await api2.saveSite(input22));
      if (res.ok && res.site) {
        setAddFlow({ siteId: res.site.id, step: 1 });
        onAdded();
      } else {
        setError(res.error || t2("errors.generic"));
      }
    } catch (err) {
      console.error("[WebLlm] 添加站点失败:", err);
      setError(t2("errors.generic"));
    } finally {
      setBusyId(null);
    }
  };
  const nameError = touched && !name2.trim() ? t2("form.nameRequired") : null;
  const urlError = touched && !isHttpUrl$1(url) ? t2("form.urlInvalid") : null;
  const input2 = "w-full rounded-md border border-border bg-bg-primary px-3 py-1.5 text-sm text-text-primary outline-none transition focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border bg-bg-secondary/50 px-5 py-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-3 flex items-start justify-between gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium text-text-primary", children: t2("picker.title") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-0.5 text-xs text-text-muted", children: t2("picker.description") })
      ] }),
      closable && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: onClose, className: "rounded p-1 text-text-muted hover:bg-bg-hover hover:text-text-primary", "aria-label": t2("add.close"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(X$1, { className: "h-4 w-4" }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4", children: [
      presets.map((preset2) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "button",
          disabled: Boolean(busyId),
          onClick: () => void add2({ presetId: preset2.id }, preset2.id),
          className: "flex min-w-0 items-center gap-2.5 rounded-lg border border-border bg-bg-primary/60 px-3 py-2.5 text-left btn-transition hover:border-accent-blue/40 hover:bg-bg-hover disabled:cursor-not-allowed disabled:opacity-60",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SiteAvatar, { name: preset2.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "min-w-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block truncate text-sm text-text-primary", children: preset2.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block truncate text-xs text-text-muted", children: preset2.host })
            ] }),
            busyId === preset2.id && /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "ml-auto h-3.5 w-3.5 shrink-0 animate-spin text-text-muted" })
          ]
        },
        preset2.id
      )),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "button",
          onClick: () => setCustomOpen((v2) => !v2),
          "aria-expanded": customOpen,
          className: "flex items-center gap-2.5 rounded-lg border border-dashed border-border px-3 py-2.5 text-left text-sm text-text-secondary btn-transition hover:border-accent-blue/40 hover:text-text-primary",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Plus$1, { className: "h-4 w-4 shrink-0" }),
            t2("picker.custom")
          ]
        }
      )
    ] }),
    customOpen && /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "form",
      {
        className: "mt-4 grid gap-3 sm:grid-cols-[1fr_2fr_auto] sm:items-start",
        onSubmit: (e3) => {
          e3.preventDefault();
          setTouched(true);
          if (!name2.trim() || !isHttpUrl$1(url)) return;
          void add2({ name: name2.trim(), url: url.trim() }, "custom");
        },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-text-secondary", children: t2("form.name") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: input2, value: name2, onChange: (e3) => setName(e3.target.value), placeholder: t2("form.namePlaceholder"), "aria-invalid": Boolean(nameError) }),
            nameError && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-accent-red", children: nameError })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-text-secondary", children: t2("form.url") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: input2, value: url, onChange: (e3) => setUrl(e3.target.value), placeholder: "https://", spellCheck: false, "aria-invalid": Boolean(urlError) }),
            urlError && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-accent-red", children: urlError })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "submit", className: `${primaryBtn} sm:mt-5`, disabled: Boolean(busyId), children: [
            busyId === "custom" && /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-3.5 w-3.5 animate-spin" }),
            t2("actions.add")
          ] })
        ]
      }
    ),
    error2 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-xs text-accent-red", children: error2 })
  ] });
}
function SensitiveAllowlist({ paths }) {
  const { t: t2 } = useTranslation("webLlm");
  const apply2 = useWebLlmUiStore((s2) => s2.apply);
  const [saving, setSaving] = reactExports.useState(false);
  const save2 = async (next2) => {
    const api2 = getWebLlmBridge();
    if (!api2 || saving) return;
    setSaving(true);
    try {
      const res = apply2(await api2.setSensitiveAllowlist(next2));
      if (!res.ok) toastError(res.error || t2("errors.generic"));
    } catch (err) {
      console.error("[WebLlm] 保存放行名单失败:", err);
      toastError(t2("errors.generic"));
    } finally {
      setSaving(false);
    }
  };
  const addFile = async () => {
    const file2 = await window.shineAI?.app?.selectFile();
    if (file2 && !paths.includes(file2)) await save2([...paths, file2]);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(AdvancedSettingsSection, { title: t2("allowlist.title"), description: t2("allowlist.description"), children: [
    paths.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-5 py-3 text-xs text-text-muted", children: t2("allowlist.empty") }) : paths.map((p2) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3 px-5 py-2.5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "min-w-0 truncate font-mono text-xs text-text-secondary", title: p2, children: p2 }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          disabled: saving,
          onClick: () => void save2(paths.filter((x2) => x2 !== p2)),
          className: "shrink-0 rounded p-1 text-text-muted hover:bg-bg-hover hover:text-accent-red disabled:opacity-50",
          "aria-label": t2("actions.remove"),
          title: t2("actions.remove"),
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(X$1, { className: "h-3.5 w-3.5" })
        }
      )
    ] }, p2)),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-5 py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: secondaryBtn, disabled: saving, onClick: () => void addFile(), children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(FilePlus, { className: "h-3.5 w-3.5" }),
      t2("allowlist.add")
    ] }) })
  ] });
}
function localDateKey(date2 = /* @__PURE__ */ new Date()) {
  const y2 = date2.getFullYear();
  const m2 = String(date2.getMonth() + 1).padStart(2, "0");
  const d2 = String(date2.getDate()).padStart(2, "0");
  return `${y2}-${m2}-${d2}`;
}
function todayKey() {
  return localDateKey();
}
function parseDateKey(dateKey) {
  const [y2, m2, d2] = dateKey.split("-").map(Number);
  return new Date(y2, (m2 ?? 1) - 1, d2 ?? 1, 0, 0, 0, 0);
}
function shiftDateKey(dateKey, days) {
  const d2 = parseDateKey(dateKey);
  d2.setDate(d2.getDate() + days);
  return localDateKey(d2);
}
function isTodayKey(dateKey) {
  return dateKey === todayKey();
}
function isoToMinutes(iso, dayStart) {
  if (!iso) return null;
  const t2 = new Date(iso).getTime();
  if (!Number.isFinite(t2)) return null;
  return (t2 - dayStart.getTime()) / 6e4;
}
function formatMinutes(min2, nextDayLabel) {
  const wrapped = (min2 % 1440 + 1440) % 1440;
  const hh2 = String(Math.floor(wrapped / 60)).padStart(2, "0");
  const mm = String(Math.floor(wrapped % 60)).padStart(2, "0");
  const text2 = `${hh2}:${mm}`;
  return min2 >= 1440 ? `${nextDayLabel} ${text2}` : text2;
}
function formatClock(iso, locale2) {
  if (!iso) return "";
  const d2 = new Date(iso);
  if (!Number.isFinite(d2.getTime())) return "";
  return new Intl.DateTimeFormat(locale2, { hour: "2-digit", minute: "2-digit", hour12: false }).format(d2);
}
function formatDateTitle(dateKey, locale2) {
  const d2 = parseDateKey(dateKey);
  return new Intl.DateTimeFormat(locale2, { year: "numeric", month: "long", day: "numeric", weekday: "short" }).format(d2);
}
function nowMinutes() {
  const n2 = /* @__PURE__ */ new Date();
  return n2.getHours() * 60 + n2.getMinutes() + n2.getSeconds() / 60;
}
function dailyBoardDateKey(date2 = /* @__PURE__ */ new Date()) {
  return localDateKey(date2);
}
const useDailyBoardNav = create$5((set2) => ({
  date: dailyBoardDateKey(),
  intent: "view",
  nonce: 0,
  modalOpen: false,
  open: (date2) => set2((s2) => ({ date: date2 ?? dailyBoardDateKey(), intent: "view", nonce: s2.nonce + 1 })),
  requestGenerate: (date2) => set2((s2) => ({ date: date2 ?? s2.date, intent: "generate", nonce: s2.nonce + 1 })),
  close: () => set2({ modalOpen: false })
}));
function openDailyBoard(date2) {
  useDailyBoardNav.getState().open(date2);
  useDailyBoardNav.setState({ modalOpen: true });
}
function WebLlmPendingBar() {
  const { t: t2 } = useTranslation("webLlm");
  const pending2 = useWebLlmUiStore((s2) => s2.pending);
  const inSettings = useUIStore((s2) => s2.activeWorkspace === "settings");
  const now2 = useTicker(Boolean(pending2));
  const detected = pending2?.kind === "login" && pending2.detected;
  reactExports.useEffect(() => {
    if (!detected) return;
    const id2 = window.setTimeout(() => {
      useWebLlmUiStore.getState().setPending(null);
      returnToWebLlmSettings();
    }, 1200);
    return () => window.clearTimeout(id2);
  }, [detected]);
  if (!pending2 || inSettings) return null;
  const elapsed = formatElapsed$1((now2 - pending2.startedAt) / 1e3);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex justify-center px-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { role: "status", className: "pointer-events-auto flex max-w-xl items-center gap-3 rounded-lg border border-border bg-bg-secondary px-4 py-2.5 text-xs text-text-primary shadow-[0_8px_24px_rgba(0,0,0,0.25)]", children: pending2.kind === "pick" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Crosshair, { className: "h-4 w-4 shrink-0 text-accent-blue" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "min-w-0", children: t2("pick.hint", { field: t2(`fields.${pending2.field}`) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "shrink-0 tabular-nums text-text-muted", children: elapsed })
  ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    detected ? null : /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 shrink-0 animate-spin text-text-muted" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "min-w-0", children: detected ? t2("pending.loginDetected", { name: pending2.siteName }) : t2("pending.login", { name: pending2.siteName }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "shrink-0 tabular-nums text-text-muted", children: elapsed }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        type: "button",
        onClick: () => {
          useWebLlmUiStore.getState().setPending(null);
          returnToWebLlmSettings();
        },
        className: "inline-flex shrink-0 items-center gap-1 rounded-md bg-accent-blue px-2.5 py-1 text-white btn-transition hover:bg-accent-blue/85",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "h-3.5 w-3.5" }),
          t2("pending.back")
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        type: "button",
        onClick: () => stopLoginWatch(pending2.siteId),
        className: "shrink-0 rounded p-1 text-text-muted hover:bg-bg-hover hover:text-text-primary",
        "aria-label": t2("pending.dismiss"),
        title: t2("pending.dismiss"),
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(X$1, { className: "h-3.5 w-3.5" })
      }
    )
  ] }) }) });
}
function computeKpis(items) {
  const k2 = { total: items.length, done: 0, doing: 0, wait: 0, outputs: 0 };
  for (const it2 of items) {
    k2[it2.status]++;
    k2.outputs += it2.outputs.length;
  }
  return k2;
}
function openFullConversation(sessionId) {
  void navigateToSessionForChat(sessionId);
}
function getApi() {
  return typeof window === "undefined" ? void 0 : window.shineAI?.dailyBoard;
}
function getDay(date2) {
  const api2 = getApi();
  if (!api2) return Promise.resolve({ ok: false, error: "dailyBoard service unavailable" });
  return api2.getDay(date2);
}
function generateDay(date2) {
  const api2 = getApi();
  if (!api2) return Promise.resolve({ ok: false, error: "dailyBoard service unavailable" });
  return api2.generate({ date: date2 });
}
function listRunDates(from, to) {
  const api2 = getApi();
  if (!api2) return Promise.resolve({ ok: false, error: "dailyBoard service unavailable" });
  return api2.listRunDates(from, to);
}
function onUpdated(callback2) {
  const api2 = getApi();
  if (!api2) return () => {
  };
  return api2.onUpdated(callback2);
}
const unavailable = () => Promise.resolve({ ok: false, error: "dailyBoard service unavailable" });
function getSettings() {
  const api2 = getApi();
  if (!api2) return unavailable();
  return api2.getSettings();
}
function setSettings(patch2) {
  const api2 = getApi();
  if (!api2) return unavailable();
  return api2.setSettings(patch2);
}
function getScheduleStatus() {
  const api2 = getApi();
  if (!api2) return unavailable();
  return api2.getScheduleStatus();
}
function getChannelAvailability() {
  const api2 = getApi();
  return api2 ? api2.getChannelAvailability() : Promise.resolve({ ok: false, error: "dailyBoard service unavailable" });
}
function exportDailyBoard(request) {
  const api2 = getApi();
  if (!api2) return unavailable();
  return api2.export(request);
}
function editItem(req) {
  const api2 = getApi();
  return api2 ? api2.editItem(req) : unavailable();
}
function moveLane(req) {
  const api2 = getApi();
  return api2 ? api2.moveLane(req) : unavailable();
}
function merge(req) {
  const api2 = getApi();
  return api2 ? api2.merge(req) : unavailable();
}
function split(req) {
  const api2 = getApi();
  return api2 ? api2.split(req) : unavailable();
}
function addEntry(req) {
  const api2 = getApi();
  return api2 ? api2.addEntry(req) : unavailable();
}
function deleteEntry(req) {
  const api2 = getApi();
  return api2 ? api2.deleteEntry(req) : unavailable();
}
function resolveAiConflict(req) {
  const api2 = getApi();
  return api2 ? api2.resolveAiConflict(req) : unavailable();
}
function cancelRefine(req) {
  const api2 = getApi();
  return api2 ? api2.cancelRefine(req) : unavailable();
}
function onProgress(callback2) {
  const api2 = getApi();
  return api2 ? api2.onProgress(callback2) : () => {
  };
}
function useDailyBoardData(date2) {
  const [day, setDay] = reactExports.useState(null);
  const [loading2, setLoading] = reactExports.useState(true);
  const [localGenerating, setLocalGenerating] = reactExports.useState(false);
  const [error2, setError] = reactExports.useState(null);
  const dateRef = reactExports.useRef(date2);
  dateRef.current = date2;
  const load = reactExports.useCallback(async (target2, quiet = false) => {
    if (!quiet) setLoading(true);
    const res = await getDay(target2);
    if (dateRef.current !== target2) return;
    if (res.ok) {
      setDay(res.data);
      setError(null);
    } else {
      setError(res.error);
    }
    if (!quiet) setLoading(false);
  }, []);
  const generate = reactExports.useCallback(async () => {
    const target2 = dateRef.current;
    setLocalGenerating(true);
    setError(null);
    const res = await generateDay(target2);
    if (dateRef.current !== target2) {
      setLocalGenerating(false);
      return;
    }
    if (res.ok) {
      setDay(res.data.day);
    } else {
      setError(res.error);
    }
    setLocalGenerating(false);
  }, []);
  const refresh2 = reactExports.useCallback(() => {
    void load(dateRef.current, true);
  }, [load]);
  reactExports.useEffect(() => {
    setDay(null);
    setError(null);
    void load(date2, false);
  }, [date2, load]);
  reactExports.useEffect(() => {
    return onUpdated((payload) => {
      if (payload.date === dateRef.current) void load(dateRef.current, true);
    });
  }, [load]);
  return { day, loading: loading2, generating: localGenerating || !!day?.generating, error: error2, refresh: refresh2, generate: () => void generate() };
}
const EMPTY_FILTER = { lanes: [], status: "all", onlyWait: false, query: "", devices: [] };
function effectiveStatus(filter2) {
  return filter2.onlyWait ? "wait" : filter2.status;
}
function filterItems(items, filter2) {
  const status2 = effectiveStatus(filter2);
  const laneSet = new Set(filter2.lanes);
  const deviceSet = new Set(filter2.devices);
  const q2 = filter2.query.trim().toLowerCase();
  return items.filter((item) => {
    if (laneSet.size > 0 && !laneSet.has(item.laneKey)) return false;
    if (deviceSet.size > 0 && !deviceSet.has(item.deviceId)) return false;
    if (status2 !== "all" && item.status !== status2) return false;
    if (q2) {
      const hay = `${item.title}
${item.summary}
${item.laneName}
${item.decision?.question ?? ""}`.toLowerCase();
      if (!hay.includes(q2)) return false;
    }
    return true;
  });
}
const DAILY_BOARD_CHANNELS = ["desktop"];
const DAILY_BOARD_EXPORT_FORMATS = ["html", "png", "pdf"];
const DAILY_BOARD_MAX_TIMES = 6;
const TIME_RE = /^(\d{1,2}):(\d{2})$/;
function normalizeSlotTime(raw) {
  if (typeof raw !== "string") return null;
  const m2 = TIME_RE.exec(raw.trim());
  if (!m2) return null;
  const h2 = Number(m2[1]);
  const min2 = Number(m2[2]);
  if (h2 > 23 || min2 > 59) return null;
  return `${String(h2).padStart(2, "0")}:${m2[2]}`;
}
function slotPlannedAt(date2, slot) {
  const [y2, m2, d2] = date2.split("-").map(Number);
  const [hh2, mm] = slot.split(":").map(Number);
  return new Date(y2, m2 - 1, d2, hh2, mm, 0, 0);
}
function runDelayMs(run2) {
  if (run2.trigger === "manual" || !run2.slot) return null;
  const started = new Date(run2.startedAt).getTime();
  if (!Number.isFinite(started)) return null;
  return Math.max(0, started - slotPlannedAt(run2.date, run2.slot).getTime());
}
function monthKey(dateKey) {
  return dateKey.slice(0, 7);
}
function monthBounds(month) {
  const [y2, m2] = month.split("-").map(Number);
  const last2 = new Date(y2, m2, 0).getDate();
  return { from: `${month}-01`, to: `${month}-${String(last2).padStart(2, "0")}` };
}
function buildMonthCells(month) {
  const { from, to } = monthBounds(month);
  const first2 = parseDateKey(from);
  const days = parseDateKey(to).getDate();
  const offset = (first2.getDay() + 6) % 7;
  const cells = [];
  for (let i2 = 0; i2 < offset; i2++) cells.push(null);
  for (let d2 = 1; d2 <= days; d2++) {
    const [y2, m2] = month.split("-");
    cells.push(`${y2}-${m2}-${String(d2).padStart(2, "0")}`);
  }
  return cells;
}
function DailyBoardCalendar({ date: date2, maxDate, onPick, onClose }) {
  const { t: t2, i18n } = useTranslation("dailyBoard");
  const [month, setMonth] = reactExports.useState(monthKey(date2));
  const [runDates, setRunDates] = reactExports.useState(/* @__PURE__ */ new Set());
  const [loading2, setLoading] = reactExports.useState(false);
  const rootRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    const bounds = monthBounds(month);
    let alive = true;
    setLoading(true);
    void listRunDates(bounds.from, bounds.to).then((res) => {
      if (!alive) return;
      setRunDates(new Set(res.ok ? res.data : []));
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [month]);
  reactExports.useEffect(() => {
    const onDown = (e3) => {
      if (!rootRef.current?.contains(e3.target)) onClose();
    };
    const onKey = (e3) => {
      if (e3.key === "Escape") onClose();
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);
  const weekdayNames = reactExports.useMemo(() => {
    const fmt2 = new Intl.DateTimeFormat(i18n.language, { weekday: "short" });
    return Array.from({ length: 7 }, (_3, i2) => fmt2.format(new Date(2024, 0, 1 + i2)));
  }, [i18n.language]);
  const monthLabel = reactExports.useMemo(() => {
    const fmt2 = new Intl.DateTimeFormat(i18n.language, { year: "numeric", month: "long" });
    return fmt2.format(parseDateKey(`${month}-01`));
  }, [i18n.language, month]);
  const shiftMonth = (delta) => {
    const [y2, m2] = month.split("-").map(Number);
    const d2 = new Date(y2, m2 - 1 + delta, 1);
    setMonth(`${d2.getFullYear()}-${String(d2.getMonth() + 1).padStart(2, "0")}`);
  };
  const cells = buildMonthCells(month);
  const today2 = localDateKey();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { ref: rootRef, className: "absolute left-0 top-11 z-40 w-72 rounded-xl border border-border bg-bg-secondary p-3 shadow-xl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-2 flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "rounded-lg p-1 text-text-muted hover:bg-bg-hover hover:text-text-primary", onClick: () => shiftMonth(-1), "aria-label": t2("toolbar.prevDay"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { className: "h-4 w-4", "aria-hidden": true }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-semibold text-text-primary", children: monthLabel }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "rounded-lg p-1 text-text-muted hover:bg-bg-hover hover:text-text-primary", onClick: () => shiftMonth(1), "aria-label": t2("toolbar.nextDay"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "h-4 w-4", "aria-hidden": true }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-7 gap-1 text-center text-[11px] text-text-muted", children: weekdayNames.map((w2) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "py-0.5", children: w2 }, w2)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 grid grid-cols-7 gap-1", children: cells.map((cell2, i2) => {
      if (!cell2) return /* @__PURE__ */ jsxRuntimeExports.jsx("div", {}, `blank-${i2}`);
      const disabled = cell2 > maxDate;
      const selected2 = cell2 === date2;
      const isTodayCell = cell2 === today2;
      const hasSnapshot = runDates.has(cell2);
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "button",
          disabled,
          onClick: () => onPick(cell2),
          className: cn(
            "relative flex h-8 items-center justify-center rounded-lg text-xs tabular-nums outline-none transition-colors",
            disabled ? "cursor-not-allowed text-text-muted/40" : selected2 ? "bg-accent-blue text-white" : "text-text-secondary hover:bg-bg-hover hover:text-text-primary",
            isTodayCell && !selected2 && "font-semibold text-accent-blue"
          ),
          children: [
            Number(cell2.slice(8, 10)),
            hasSnapshot && !selected2 ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute bottom-1 h-1 w-1 rounded-full bg-accent-blue", "aria-hidden": true }) : null
          ]
        },
        cell2
      );
    }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex items-center gap-2 text-[11px] text-text-muted", children: [
      loading2 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Loader, { className: "h-3 w-3 animate-spin", "aria-hidden": true }) : null,
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-block h-1.5 w-1.5 rounded-full bg-accent-blue", "aria-hidden": true }),
      t2("calendar.hasSnapshot")
    ] })
  ] });
}
const ICONS = {
  html: FileCode2,
  png: Image$1,
  pdf: FileText
};
function DailyBoardExportMenu({ date: date2, initialHidePaths, onClose }) {
  const { t: t2 } = useTranslation("dailyBoard");
  const [hidePaths, setHidePaths] = reactExports.useState(initialHidePaths ?? false);
  const [busy, setBusy] = reactExports.useState(null);
  const [done2, setDone] = reactExports.useState(null);
  const [error2, setError] = reactExports.useState(null);
  const rootRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    if (initialHidePaths != null) return;
    let alive = true;
    void getSettings().then((res) => {
      if (alive && res.ok) setHidePaths(res.data.hideLocalPaths);
    });
    return () => {
      alive = false;
    };
  }, [initialHidePaths]);
  reactExports.useEffect(() => {
    const onDown = (e3) => {
      if (!rootRef.current?.contains(e3.target)) onClose();
    };
    const onKey = (e3) => {
      if (e3.key === "Escape") onClose();
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);
  const run2 = async (format2) => {
    setBusy(format2);
    setError(null);
    setDone(null);
    const res = await exportDailyBoard({ date: date2, format: format2, hideLocalPaths: hidePaths });
    setBusy(null);
    if (res.ok) setDone(res.data.filePaths);
    else setError(res.error === "canceled" ? null : res.error);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { ref: rootRef, className: "absolute right-0 top-11 z-40 w-72 rounded-xl border border-border bg-bg-secondary p-3 shadow-xl", "data-daily-export-menu": true, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-2 flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-semibold text-text-primary", children: t2("toolbar.export") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "rounded-lg p-1 text-text-muted hover:bg-bg-hover hover:text-text-primary", onClick: onClose, "aria-label": t2("drawer.close"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(X$1, { className: "h-4 w-4", "aria-hidden": true }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "mb-2 flex cursor-pointer items-center gap-2 text-xs text-text-secondary", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", className: "accent-accent-blue", checked: hidePaths, onChange: (e3) => setHidePaths(e3.target.checked) }),
      t2("export.hidePaths")
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-col gap-1", children: DAILY_BOARD_EXPORT_FORMATS.map((format2) => {
      const Icon2 = ICONS[format2];
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "button",
          className: "inline-flex h-8 items-center gap-2 rounded-lg border border-border px-2.5 text-xs font-medium text-text-primary outline-none hover:bg-bg-hover focus-visible:ring-2 focus-visible:ring-accent-blue disabled:cursor-not-allowed disabled:opacity-40",
          disabled: busy != null,
          onClick: () => void run2(format2),
          children: [
            busy === format2 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Loader, { className: "h-3.5 w-3.5 animate-spin", "aria-hidden": true }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Icon2, { className: "h-3.5 w-3.5", "aria-hidden": true }),
            t2(`toolbar.export${format2[0].toUpperCase()}${format2.slice(1)}`)
          ]
        },
        format2
      );
    }) }),
    busy ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-[11px] text-text-muted", children: t2("export.busy") }) : null,
    done2 && done2.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 rounded-lg border border-accent-green/30 bg-accent-green/10 px-2 py-1.5 text-[11px] text-text-secondary", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "flex items-center gap-1.5 text-accent-green", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-3 w-3", "aria-hidden": true }),
        t2("export.done", { path: done2[0] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "button",
          className: "mt-1 inline-flex items-center gap-1 rounded px-1 text-accent-blue hover:underline",
          onClick: () => void openProduct({ path: done2[0], action: "reveal" }),
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(FolderOpen, { className: "h-3 w-3", "aria-hidden": true }),
            t2("export.open")
          ]
        }
      )
    ] }) : null,
    error2 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { role: "alert", className: cn("mt-2 flex items-center gap-1.5 text-[11px] text-accent-red"), children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "h-3 w-3", "aria-hidden": true }),
      t2("export.failed", { message: error2 })
    ] }) : null
  ] });
}
function useDailyBoardSettings(enabled) {
  const [settings3, setSettings$1] = reactExports.useState(null);
  const [status2, setStatus] = reactExports.useState(null);
  const [loading2, setLoading] = reactExports.useState(false);
  const [loadError2, setLoadError] = reactExports.useState(null);
  const [phase2, setPhase] = reactExports.useState("idle");
  const [saveError, setSaveError] = reactExports.useState(null);
  const [nonce, setNonce] = reactExports.useState(0);
  reactExports.useEffect(() => {
    let alive = true;
    setLoading(true);
    setLoadError(null);
    void Promise.all([getSettings(), getScheduleStatus()]).then(([s2, st2]) => {
      if (!alive) return;
      if (s2.ok) setSettings$1(s2.data);
      else setLoadError(s2.error);
      if (st2.ok) setStatus(st2.data);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [enabled, nonce]);
  const reload = reactExports.useCallback(() => setNonce((n2) => n2 + 1), []);
  const save2 = reactExports.useCallback(async (patch2) => {
    const prev = settings3;
    setPhase("saving");
    setSaveError(null);
    if (prev) setSettings$1({ ...prev, ...patch2 });
    const res = await setSettings(patch2);
    if (res.ok) {
      setSettings$1(res.data);
      setPhase("saved");
    } else {
      if (prev) setSettings$1(prev);
      setSaveError(res.error);
      setPhase("error");
    }
  }, [settings3]);
  return { settings: settings3, status: status2, loading: loading2, loadError: loadError2, phase: phase2, saveError, reload, save: save2 };
}
const EXPORT_FORMATS = ["html", "png", "pdf"];
function formatSlot(iso, locale2) {
  const d2 = new Date(iso);
  if (!Number.isFinite(d2.getTime())) return iso;
  try {
    return new Intl.DateTimeFormat(locale2, { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).format(d2);
  } catch {
    return iso;
  }
}
function DailyBoardSchedulePanel({ onClose }) {
  const { t: t2, i18n } = useTranslation("dailyBoard");
  const { settings: settings3, status: status2, loading: loading2, loadError: loadError2, phase: phase2, saveError, reload, save: save2 } = useDailyBoardSettings(true);
  const groups2 = useWorkGroupStore((s2) => s2.groups);
  const rootRef = reactExports.useRef(null);
  const [newTime, setNewTime] = reactExports.useState("");
  const [timeError, setTimeError] = reactExports.useState(null);
  const [newSkipDate, setNewSkipDate] = reactExports.useState("");
  const [dirsText, setDirsText] = reactExports.useState("");
  const [availability, setAvailability] = reactExports.useState({});
  reactExports.useEffect(() => {
    setDirsText(settings3 ? settings3.excludeDirs.join("\n") : "");
  }, [settings3]);
  reactExports.useEffect(() => {
    let alive = true;
    void getChannelAvailability().then((res) => {
      if (!alive || !res.ok) return;
      setAvailability(Object.fromEntries(res.data.map((a2) => [a2.channel, a2])));
    });
    return () => {
      alive = false;
    };
  }, []);
  reactExports.useEffect(() => {
    const onDown = (e3) => {
      if (!rootRef.current?.contains(e3.target)) onClose();
    };
    const onKey = (e3) => {
      if (e3.key === "Escape") onClose();
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);
  const nextSlotText = reactExports.useMemo(() => {
    if (!status2?.nextSlot) return t2("schedule.nextNone");
    return `${status2.nextSlot.date} ${status2.nextSlot.slot} · ${formatSlot(status2.nextSlot.at, i18n.language)}`;
  }, [status2, t2, i18n.language]);
  if (loading2 && !settings3) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Panel, { innerRef: rootRef, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-xs text-text-muted", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Loader, { className: "h-3.5 w-3.5 animate-spin", "aria-hidden": true }),
      t2("schedule.loading")
    ] }) });
  }
  if (loadError2 || !settings3) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Panel, { innerRef: rootRef, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { role: "alert", className: "flex items-center gap-2 text-xs text-accent-red", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "h-3.5 w-3.5", "aria-hidden": true }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex-1", children: t2("schedule.loadFailed") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "rounded px-1.5 hover:underline", onClick: reload, children: t2("state.retry") })
    ] }) });
  }
  const addTime = () => {
    const norm = normalizeSlotTime(newTime);
    if (!norm) {
      setTimeError(t2("schedule.timeInvalid"));
      return;
    }
    if (settings3.times.includes(norm)) {
      setTimeError(t2("schedule.timeDup"));
      return;
    }
    if (settings3.times.length >= DAILY_BOARD_MAX_TIMES) {
      setTimeError(t2("schedule.timesMax"));
      return;
    }
    setTimeError(null);
    setNewTime("");
    void save2({ times: [...settings3.times, norm].sort() });
  };
  const removeTime = (slot) => {
    if (settings3.times.length <= 1) return;
    void save2({ times: settings3.times.filter((s2) => s2 !== slot) });
  };
  const toggleChannel = (channel, on) => {
    const next2 = on ? [...settings3.channels, channel] : settings3.channels.filter((c2) => c2 !== channel);
    void save2({ channels: DAILY_BOARD_CHANNELS.filter((c2) => next2.includes(c2)) });
  };
  const toggleGroup = (id2, on) => {
    const next2 = on ? [...settings3.excludeGroupIds, id2] : settings3.excludeGroupIds.filter((g2) => g2 !== id2);
    void save2({ excludeGroupIds: next2 });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Panel, { innerRef: rootRef, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-3 flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-semibold text-text-primary", children: t2("schedule.title") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "rounded-lg p-1 text-text-muted hover:bg-bg-hover hover:text-text-primary", onClick: onClose, "aria-label": t2("drawer.close"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(X$1, { className: "h-4 w-4", "aria-hidden": true }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(SaveFeedback, { phase: phase2, error: saveError, t: t2 }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-3 space-y-1 rounded-lg bg-bg-primary px-2.5 py-2 text-[11px] text-text-muted", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        t2("schedule.timezone"),
        ": ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-text-secondary", children: status2?.timeZone ?? "—" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        t2("schedule.nextSlot"),
        ": ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-text-secondary", children: nextSlotText })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex flex-1 cursor-pointer items-center gap-2 text-xs text-text-primary", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", className: "accent-accent-blue", checked: settings3.enabled, onChange: (e3) => void save2({ enabled: e3.target.checked }) }),
      t2("schedule.enabled")
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Section$1, { title: t2("schedule.times"), children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "mb-1.5 space-y-1", children: settings3.times.map((slot) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-center gap-2 text-xs text-text-secondary", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono tabular-nums", children: slot }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "text-text-muted hover:text-accent-red disabled:opacity-30", disabled: settings3.times.length <= 1, onClick: () => removeTime(slot), "aria-label": `${t2("schedule.remove")} ${slot}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3.5 w-3.5", "aria-hidden": true }) })
      ] }, slot)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "time",
            value: newTime,
            onChange: (e3) => {
              setNewTime(e3.target.value);
              setTimeError(null);
            },
            className: "h-7 rounded-lg border border-border bg-bg-primary px-2 text-xs text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-accent-blue",
            "aria-label": t2("schedule.addTime")
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "inline-flex h-7 items-center gap-1 rounded-lg border border-border px-2 text-xs text-text-primary hover:bg-bg-hover disabled:opacity-40", disabled: settings3.times.length >= DAILY_BOARD_MAX_TIMES, onClick: addTime, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus$1, { className: "h-3.5 w-3.5", "aria-hidden": true }),
          t2("schedule.addTime")
        ] })
      ] }),
      timeError ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { role: "alert", className: "mt-1 text-[11px] text-accent-red", children: timeError }) : null
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex flex-1 cursor-pointer items-center gap-2 text-xs text-text-primary", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", className: "accent-accent-blue", checked: settings3.workdaysOnly, onChange: (e3) => void save2({ workdaysOnly: e3.target.checked }) }),
      t2("schedule.workdaysOnly")
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Section$1, { title: t2("schedule.skipDates"), children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-1.5 flex flex-wrap gap-1", children: settings3.skipDates.map((d2) => /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1 rounded-full bg-bg-hover px-2 py-0.5 text-[11px] text-text-secondary", children: [
        d2,
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "text-text-muted hover:text-accent-red", onClick: () => void save2({ skipDates: settings3.skipDates.filter((x2) => x2 !== d2) }), "aria-label": `${t2("schedule.remove")} ${d2}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx(X$1, { className: "h-3 w-3", "aria-hidden": true }) })
      ] }, d2)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "date",
            value: newSkipDate,
            onChange: (e3) => setNewSkipDate(e3.target.value),
            className: "h-7 rounded-lg border border-border bg-bg-primary px-2 text-xs text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-accent-blue",
            "aria-label": t2("schedule.addSkipDate")
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "inline-flex h-7 items-center gap-1 rounded-lg border border-border px-2 text-xs text-text-primary hover:bg-bg-hover disabled:opacity-40", disabled: !newSkipDate, onClick: () => {
          void save2({ skipDates: [...settings3.skipDates, newSkipDate] });
          setNewSkipDate("");
        }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus$1, { className: "h-3.5 w-3.5", "aria-hidden": true }),
          t2("schedule.addSkipDate")
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex flex-1 cursor-pointer items-center gap-2 text-xs text-text-primary", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", className: "accent-accent-blue", checked: settings3.catchup, onChange: (e3) => void save2({ catchup: e3.target.checked }) }),
      t2("schedule.catchup")
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex flex-1 cursor-pointer items-center gap-2 text-xs text-text-primary", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", className: "accent-accent-blue", checked: settings3.skipIdle, onChange: (e3) => void save2({ skipIdle: e3.target.checked }) }),
      t2("schedule.skipIdle")
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Section$1, { title: t2("schedule.channels"), children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 gap-1", children: DAILY_BOARD_CHANNELS.map((c2) => {
        const info2 = availability[c2];
        const disabled = info2 ? !info2.available : false;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "label",
          {
            className: cn("flex items-center gap-1.5 text-xs", disabled ? "cursor-not-allowed text-text-muted/60" : "cursor-pointer text-text-secondary"),
            title: disabled && info2?.reason ? t2(`schedule.channelUnavailable.${info2.reason}`) : void 0,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "checkbox",
                  className: "accent-accent-blue",
                  disabled,
                  checked: settings3.channels.includes(c2),
                  onChange: (e3) => toggleChannel(c2, e3.target.checked)
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate", children: t2(`schedule.channel_${c2}`) }),
              disabled && info2?.reason ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "shrink-0 text-[10px] text-text-muted/70", children: [
                "· ",
                t2(`schedule.channelUnavailable.${info2.reason}`)
              ] }) : null
            ]
          },
          c2
        );
      }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-[11px] text-text-muted/70", children: t2("schedule.channelMobileHint") })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Section$1, { title: t2("schedule.autoExport"), children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "select",
        {
          value: settings3.autoExport ?? "off",
          onChange: (e3) => void save2({ autoExport: e3.target.value === "off" ? null : e3.target.value }),
          className: "h-7 rounded-lg border border-border bg-bg-primary px-2 text-xs text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-accent-blue",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "off", children: t2("schedule.autoExportOff") }),
            EXPORT_FORMATS.map((f2) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: f2, children: f2.toUpperCase() }, f2))
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "mt-2 flex cursor-pointer items-center gap-2 text-xs text-text-secondary", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", className: "accent-accent-blue", checked: settings3.hideLocalPaths, onChange: (e3) => void save2({ hideLocalPaths: e3.target.checked }) }),
        t2("schedule.hideLocalPaths")
      ] })
    ] }),
    groups2.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Section$1, { title: t2("schedule.excludeGroups"), children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 gap-1", children: groups2.map((g2) => /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex cursor-pointer items-center gap-1.5 text-xs text-text-secondary", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", className: "accent-accent-blue", checked: settings3.excludeGroupIds.includes(g2.id), onChange: (e3) => toggleGroup(g2.id, e3.target.checked) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate", title: g2.name, children: g2.name })
    ] }, g2.id)) }) }) : null,
    /* @__PURE__ */ jsxRuntimeExports.jsx(Section$1, { title: t2("schedule.excludeDirs"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      "textarea",
      {
        value: dirsText,
        onChange: (e3) => setDirsText(e3.target.value),
        onBlur: () => void save2({ excludeDirs: dirsText.split("\n").map((s2) => s2.trim()).filter(Boolean) }),
        rows: 3,
        className: "w-full resize-y rounded-lg border border-border bg-bg-primary px-2 py-1 text-xs text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-accent-blue",
        placeholder: t2("schedule.excludeDirsPlaceholder")
      }
    ) })
  ] });
}
function Panel({ children: children2, innerRef }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: innerRef, className: "absolute right-0 top-11 z-40 max-h-[70vh] w-[380px] overflow-auto rounded-xl border border-border bg-bg-secondary p-3 shadow-xl", "data-daily-schedule-panel": true, children: children2 });
}
function Row({ children: children2 }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-2 flex items-center gap-2", children: children2 });
}
function Section$1({ title: title2, children: children2 }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mb-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted", children: title2 }),
    children2
  ] });
}
function SaveFeedback({ phase: phase2, error: error2, t: t2 }) {
  if (phase2 === "idle") return null;
  if (phase2 === "saving") {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mb-2 flex items-center gap-1.5 text-[11px] text-text-muted", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Loader, { className: "h-3 w-3 animate-spin", "aria-hidden": true }),
      t2("schedule.saving")
    ] });
  }
  if (phase2 === "error") {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("p", { role: "alert", className: cn("mb-2 text-[11px] text-accent-red"), children: t2("schedule.saveFailed", { message: error2 ?? "" }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-2 text-[11px] text-accent-green", children: t2("schedule.saved") });
}
const btn$1 = "inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-2.5 text-xs font-medium text-text-primary outline-none transition-colors hover:bg-bg-hover focus-visible:ring-2 focus-visible:ring-accent-blue disabled:cursor-not-allowed disabled:opacity-40";
const iconBtn = "flex h-8 w-8 items-center justify-center rounded-lg text-text-muted outline-none transition-colors hover:bg-bg-hover hover:text-text-primary focus-visible:ring-2 focus-visible:ring-accent-blue disabled:cursor-not-allowed disabled:opacity-40";
function formatDelay(ms, t2) {
  const min2 = Math.max(0, Math.round(ms / 6e4));
  if (min2 < 60) return t2("status.delayMinutes", { n: min2 });
  const h2 = Math.floor(min2 / 60);
  const m2 = min2 % 60;
  return m2 > 0 ? t2("status.delayHoursMinutes", { h: h2, m: m2 }) : t2("status.delayHours", { h: h2 });
}
function DailyBoardToolbar({ date: date2, hasSnapshot, generating: generating2, lastRun, onPickDate, onGenerate }) {
  const { t: t2, i18n } = useTranslation("dailyBoard");
  const [calOpen, setCalOpen] = reactExports.useState(false);
  const [exportOpen, setExportOpen] = reactExports.useState(false);
  const [scheduleOpen, setScheduleOpen] = reactExports.useState(false);
  const today2 = todayKey();
  const isToday = isTodayKey(date2);
  const finishedAt = lastRun?.finishedAt ?? null;
  const statusText = generating2 ? t2("toolbar.generating") : hasSnapshot && finishedAt ? t2("status.generatedAt", { time: formatClock(finishedAt, i18n.language) }) : t2("status.idle");
  const triggerTip = lastRun && lastRun.trigger !== "manual" && lastRun.status !== "running" ? lastRun.trigger === "catchup" ? t2("status.catchup", { delay: formatDelay(runDelayMs(lastRun) ?? 0, t2) }) : t2("status.scheduled") : null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-10 shrink-0 items-center gap-2 border-b border-border/70 bg-bg-secondary px-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-0.5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: iconBtn, onClick: () => onPickDate(shiftDateKey(date2, -1)), title: t2("toolbar.prevDay"), "aria-label": t2("toolbar.prevDay"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { className: "h-4 w-4", "aria-hidden": true }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-w-[12rem] text-center text-sm font-semibold text-text-primary", children: formatDateTitle(date2, i18n.language) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          className: iconBtn,
          onClick: () => onPickDate(shiftDateKey(date2, 1)),
          disabled: isToday,
          title: t2("toolbar.nextDay"),
          "aria-label": t2("toolbar.nextDay"),
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "h-4 w-4", "aria-hidden": true })
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: btn$1, onClick: () => onPickDate(today2), disabled: isToday, children: t2("toolbar.today") }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: cn(btn$1, calOpen && "bg-bg-hover"), "aria-expanded": calOpen, onClick: () => setCalOpen((v2) => !v2), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "h-3.5 w-3.5", "aria-hidden": true }),
        t2("toolbar.calendar")
      ] }),
      calOpen && /* @__PURE__ */ jsxRuntimeExports.jsx(DailyBoardCalendar, { date: date2, maxDate: today2, onPick: (d2) => {
        onPickDate(d2);
        setCalOpen(false);
      }, onClose: () => setCalOpen(false) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-text-muted", children: statusText }),
    triggerTip ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full bg-accent-blue/10 px-2 py-0.5 text-[11px] text-accent-blue", children: triggerTip }) : null,
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: cn(btn$1, exportOpen && "bg-bg-hover"), "aria-expanded": exportOpen, onClick: () => setExportOpen((v2) => !v2), disabled: !hasSnapshot, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "h-3.5 w-3.5", "aria-hidden": true }),
        t2("toolbar.export")
      ] }),
      exportOpen && /* @__PURE__ */ jsxRuntimeExports.jsx(DailyBoardExportMenu, { date: date2, onClose: () => setExportOpen(false) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: cn(iconBtn, scheduleOpen && "bg-bg-hover"), "aria-expanded": scheduleOpen, title: t2("toolbar.schedule"), "aria-label": t2("toolbar.schedule"), onClick: () => setScheduleOpen((v2) => !v2), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Settings, { className: "h-4 w-4", "aria-hidden": true }) }),
      scheduleOpen && /* @__PURE__ */ jsxRuntimeExports.jsx(DailyBoardSchedulePanel, { onClose: () => setScheduleOpen(false) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: cn(btn$1, "border-transparent bg-accent-blue text-white hover:bg-accent-blue/90"), onClick: onGenerate, disabled: generating2, "data-daily-board-generate": true, children: [
      generating2 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Loader, { className: "h-3.5 w-3.5 animate-spin", "aria-hidden": true }) : /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "h-3.5 w-3.5", "aria-hidden": true }),
      generating2 ? t2("toolbar.generating") : hasSnapshot ? t2("toolbar.refresh") : t2("toolbar.generate")
    ] })
  ] });
}
function DailyBoardSchedulePrompt({ active }) {
  const { t: t2 } = useTranslation("dailyBoard");
  const { settings: settings3, save: save2 } = useDailyBoardSettings(true);
  if (!active || !settings3 || settings3.enabled || settings3.schedulePromptDismissed) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { role: "status", className: "flex shrink-0 items-center gap-2 border-b border-accent-blue/30 bg-accent-blue/10 px-4 py-1.5 text-xs text-text-secondary", "data-daily-schedule-prompt": true, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(CalendarClock, { className: "h-3.5 w-3.5 shrink-0 text-accent-blue", "aria-hidden": true }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "min-w-0 flex-1 truncate", children: t2("schedulePrompt.text") }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "shrink-0 rounded px-1.5 text-accent-blue hover:underline", onClick: () => void save2({ enabled: true }), children: t2("schedulePrompt.enable") }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "shrink-0 rounded p-0.5 text-text-muted hover:text-text-primary", "aria-label": t2("schedulePrompt.dismiss"), title: t2("schedulePrompt.dismiss"), onClick: () => void save2({ schedulePromptDismissed: true }), children: /* @__PURE__ */ jsxRuntimeExports.jsx(X$1, { className: "h-3.5 w-3.5", "aria-hidden": true }) })
  ] });
}
const HEADER_COLLAPSED_KEY = "dailyBoard.headerCollapsed";
function Kpi({ value, label: label2, tone, active, clickable, onClick }) {
  const inner = /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("b", { className: cn("block text-xl font-semibold leading-tight tabular-nums", tone ?? "text-text-primary"), children: value }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[11px] text-text-muted", children: label2 })
  ] });
  if (!clickable) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-w-[68px] rounded-lg border border-border bg-bg-secondary px-3 py-1.5 text-center", children: inner });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "button",
    {
      type: "button",
      "aria-pressed": !!active,
      onClick,
      className: cn(
        "min-w-[68px] rounded-lg border px-3 py-1.5 text-center outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent-blue",
        active ? "border-accent-blue bg-accent-blue/10" : "border-border bg-bg-secondary hover:bg-bg-hover"
      ),
      children: inner
    }
  );
}
function DailyBoardHeader({ kpis, summary: summary2, collapsed: collapsed2, onToggleCollapsed, activeStatus, onlyWait, onPickStatus }) {
  const { t: t2 } = useTranslation("dailyBoard");
  const effective = onlyWait ? "wait" : activeStatus;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "shrink-0 border-b border-border/70 bg-bg-primary px-4 py-2", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          className: "mt-1 text-text-muted outline-none hover:text-text-primary focus-visible:ring-2 focus-visible:ring-accent-blue",
          "aria-expanded": !collapsed2,
          onClick: onToggleCollapsed,
          title: collapsed2 ? t2("summary.expand") : t2("summary.collapse"),
          "aria-label": collapsed2 ? t2("summary.expand") : t2("summary.collapse"),
          children: collapsed2 ? /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "h-4 w-4", "aria-hidden": true }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "h-4 w-4", "aria-hidden": true })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-1 flex-wrap items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Kpi, { value: kpis.total, label: t2("kpi.total"), clickable: true, active: effective === "all", onClick: () => onPickStatus("all") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Kpi, { value: kpis.done, label: t2("kpi.done"), tone: "text-accent-green", clickable: true, active: effective === "done", onClick: () => onPickStatus("done") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Kpi, { value: kpis.doing, label: t2("kpi.doing"), tone: "text-accent-blue", clickable: true, active: effective === "doing", onClick: () => onPickStatus("doing") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Kpi, { value: kpis.wait, label: t2("kpi.wait"), tone: "text-accent-yellow", clickable: true, active: effective === "wait", onClick: () => onPickStatus("wait") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Kpi, { value: kpis.outputs, label: t2("kpi.outputs"), clickable: false })
      ] })
    ] }),
    !collapsed2 && summary2.trim() ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 whitespace-pre-wrap pl-7 text-sm leading-6 text-text-secondary", children: summary2 }) : null
  ] });
}
function laneDisplayName(lane2, t2) {
  if (lane2.kind === "other") return t2("lane.other");
  if (lane2.kind === "scheduled") return t2("lane.scheduled");
  return lane2.name?.trim() || t2("lane.other");
}
function itemLaneDisplayName(item, t2) {
  if (item.laneKey === "scheduled") return t2("lane.scheduled");
  if (item.laneKey === "other") return t2("lane.other");
  return item.laneName?.trim() || t2("lane.other");
}
function DailyBoardFilters({ lanes, filter: filter2, onChange, view: view2, onViewChange, searchRef, devices = [] }) {
  const { t: t2 } = useTranslation("dailyBoard");
  const statusOptions = [
    { value: "all", label: t2("filter.all") },
    { value: "done", label: t2("card.statusDone") },
    { value: "doing", label: t2("card.statusDoing") },
    { value: "wait", label: t2("card.statusWait") }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex shrink-0 flex-wrap items-center gap-2 border-b border-border/70 bg-bg-primary px-4 py-1.5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-44", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      MultiSelect,
      {
        size: "sm",
        fullWidth: true,
        value: filter2.lanes,
        placeholder: t2("filter.lanes"),
        onChange: (lanes2) => onChange({ ...filter2, lanes: lanes2 }),
        options: lanes.map((lane2) => ({
          value: lane2.key,
          label: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1.5", children: [
            lane2.color ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-block h-2 w-2 rounded-full", style: { backgroundColor: lane2.color }, "aria-hidden": true }) : null,
            laneDisplayName(lane2, t2),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-text-muted", children: t2("lane.count", { count: lane2.count }) })
          ] }),
          searchText: lane2.name
        }))
      }
    ) }),
    devices.length > 1 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-40", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      MultiSelect,
      {
        size: "sm",
        fullWidth: true,
        value: filter2.devices,
        placeholder: t2("filter.devices"),
        onChange: (next2) => onChange({ ...filter2, devices: next2 }),
        options: devices.map((d2) => ({ value: d2.value, label: d2.label, searchText: d2.label }))
      }
    ) }) : null,
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-32", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      Select,
      {
        size: "sm",
        value: filter2.onlyWait ? "wait" : filter2.status,
        options: statusOptions,
        onChange: (value) => onChange({ ...filter2, status: value, onlyWait: false }),
        renderValue: (opt) => opt?.label ?? t2("filter.status")
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-2.5 text-xs text-text-secondary", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          type: "checkbox",
          checked: filter2.onlyWait,
          onChange: (e3) => onChange({ ...filter2, onlyWait: e3.target.checked, status: e3.target.checked ? "wait" : "all" })
        }
      ),
      t2("filter.onlyWait")
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative min-w-[10rem] flex-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Search$1, { className: "pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted", "aria-hidden": true }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          ref: searchRef,
          type: "search",
          value: filter2.query,
          onChange: (e3) => onChange({ ...filter2, query: e3.target.value }),
          onKeyDown: (e3) => e3.key === "Escape" && e3.target.blur(),
          placeholder: t2("filter.searchPlaceholder"),
          "aria-label": t2("filter.search"),
          className: "h-8 w-full rounded-lg border border-border bg-bg-primary pl-7 pr-7 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent-blue"
        }
      ),
      filter2.query ? /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "absolute right-1.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary", onClick: () => onChange({ ...filter2, query: "" }), "aria-label": t2("filter.clear"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(X$1, { className: "h-3.5 w-3.5", "aria-hidden": true }) }) : null
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { role: "group", "aria-label": t2("view.label"), className: "inline-flex items-center rounded-lg border border-border p-0.5", children: ["timeline", "list"].map((v2) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        type: "button",
        "aria-pressed": view2 === v2,
        onClick: () => onViewChange(v2),
        className: cn(
          "inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent-blue",
          view2 === v2 ? "bg-text-primary text-bg-primary" : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
        ),
        children: [
          v2 === "timeline" ? /* @__PURE__ */ jsxRuntimeExports.jsx(LayoutList, { className: "h-3.5 w-3.5", "aria-hidden": true }) : /* @__PURE__ */ jsxRuntimeExports.jsx(LayoutList, { className: "h-3.5 w-3.5", "aria-hidden": true }),
          v2 === "timeline" ? t2("view.timeline") : t2("view.list")
        ]
      },
      v2
    )) })
  ] });
}
const DEFAULT_FALLBACK = { startMin: 9 * 60, endMin: 18 * 60 };
const DEFAULT_MIN_SPAN = 120;
const DEFAULT_PADDING = 30;
const floorHour = (min2) => Math.floor(min2 / 60) * 60;
const ceilHour = (min2) => Math.ceil(min2 / 60) * 60;
function normalizeEnd$1(startMin, endMin) {
  if (endMin === null || endMin === void 0) return startMin;
  return endMin < startMin ? endMin + 1440 : endMin;
}
function computeTimeRange(input2) {
  const fallback2 = input2.fallback ?? DEFAULT_FALLBACK;
  const minSpan = input2.minSpanMin ?? DEFAULT_MIN_SPAN;
  const padding = input2.paddingMin ?? DEFAULT_PADDING;
  if (input2.items.length === 0) {
    return { ...fallback2 };
  }
  let earliest = Number.POSITIVE_INFINITY;
  let latest = Number.NEGATIVE_INFINITY;
  for (const item of input2.items) {
    earliest = Math.min(earliest, item.startMin);
    latest = Math.max(latest, normalizeEnd$1(item.startMin, item.endMin));
  }
  if (input2.nowMin !== null && input2.nowMin !== void 0) {
    latest = Math.max(latest, input2.nowMin);
  }
  const startMin = floorHour(earliest - padding);
  let endMin = ceilHour(latest + padding);
  if (endMin - startMin < minSpan) endMin = startMin + minSpan;
  return { startMin, endMin };
}
function timeRangeSpan(range3) {
  return Math.max(1, range3.endMin - range3.startMin);
}
const LANE_PACK_GAP = 6;
const LANE_PACK_CARD_WIDTH = 200;
const LANE_PACK_COMPACT_CARD_WIDTH = 160;
const LANE_PACK_ROW_HEIGHT = 64;
const LANE_PACK_COMPACT_ROW_HEIGHT = 36;
const LANE_PACK_MIN_BAR_WIDTH = 168;
const LANE_PACK_MAX_ROWS = 4;
function clamp(value, min2, max2) {
  if (max2 < min2) return min2;
  return Math.min(Math.max(value, min2), max2);
}
function normalizeEnd(startMin, endMin) {
  if (endMin === null || endMin === void 0) return null;
  return endMin < startMin ? endMin + 1440 : endMin;
}
function packPass(input2, cardWidth, minBarWidth, gap) {
  const { trackWidth, rangeStartMin, rangeEndMin } = input2;
  const span = rangeEndMin - rangeStartMin;
  const nowMin = input2.nowMin ?? null;
  const x2 = (min2) => span <= 0 ? 0 : (min2 - rangeStartMin) / span * trackWidth;
  const nowX = nowMin === null ? null : x2(nowMin);
  const rowEnd = [];
  const placements = [];
  const ordered = [...input2.items].sort((a2, b2) => a2.startMin - b2.startMin || a2.id.localeCompare(b2.id));
  for (const item of ordered) {
    const startX = x2(item.startMin);
    let left = clamp(startX, 0, Math.max(0, trackWidth - cardWidth));
    let width = cardWidth;
    if (item.doing) {
      if (nowX !== null) {
        width = Math.max(minBarWidth, nowX - left);
        if (width > nowX - left) left = Math.max(0, nowX - width);
        if (left + width > nowX) width = Math.max(0, nowX - left);
      } else {
        const end = normalizeEnd(item.startMin, item.endMin);
        width = Math.max(minBarWidth, end === null ? cardWidth : x2(end) - left);
      }
    }
    let row2 = rowEnd.findIndex((end) => left >= end + gap);
    if (row2 < 0) {
      row2 = rowEnd.length;
      rowEnd.push(0);
    }
    rowEnd[row2] = left + width;
    placements.push({ id: item.id, row: row2, left, width });
  }
  return placements;
}
function packLane(input2) {
  const cardWidth = input2.cardWidth ?? LANE_PACK_CARD_WIDTH;
  const compactCardWidth = input2.compactCardWidth ?? LANE_PACK_COMPACT_CARD_WIDTH;
  const gap = input2.gap ?? LANE_PACK_GAP;
  const rowHeight = input2.rowHeight ?? LANE_PACK_ROW_HEIGHT;
  const compactRowHeight = input2.compactRowHeight ?? LANE_PACK_COMPACT_ROW_HEIGHT;
  const minBarWidth = input2.minBarWidth ?? LANE_PACK_MIN_BAR_WIDTH;
  const maxRows = input2.maxRows ?? LANE_PACK_MAX_ROWS;
  const placements = packPass(input2, cardWidth, minBarWidth, gap);
  const rowCount = placements.reduce((max2, p2) => Math.max(max2, p2.row + 1), 0);
  if (rowCount > maxRows) {
    const compactPlacements = packPass(input2, compactCardWidth, minBarWidth, gap);
    const compactRows = compactPlacements.reduce((max2, p2) => Math.max(max2, p2.row + 1), 0);
    return {
      placements: compactPlacements,
      rowCount: compactRows,
      compact: true,
      rowHeight: compactRowHeight,
      cardWidth: compactCardWidth,
      height: compactRows * compactRowHeight
    };
  }
  return {
    placements,
    rowCount,
    compact: false,
    rowHeight,
    cardWidth,
    height: rowCount * rowHeight
  };
}
function resolveItemRange(firstAt, lastAt, dayStart, fallbackStartMin) {
  const first2 = isoToMinutes(firstAt, dayStart);
  const last2 = isoToMinutes(lastAt, dayStart);
  const startMin = first2 ?? last2 ?? fallbackStartMin;
  return { startMin, endMin: last2, hasTime: first2 !== null || last2 !== null };
}
const sessionTargetKey = (sessionId, deviceId) => `session:${sessionId}@${deviceId}`;
const entryTargetKey = (entryId) => `entry:${entryId}`;
const LOCAL_DEVICE_ID = "local";
function targetKeyOf(item) {
  return item.entry ? entryTargetKey(item.entry.id) : sessionTargetKey(item.sessionId, item.deviceId);
}
function isRemoteItem(item) {
  return !!item.deviceId && item.deviceId !== LOCAL_DEVICE_ID;
}
function deviceTagLabel(item, t2) {
  if (!isRemoteItem(item)) return t2("card.deviceLocal");
  return item.deviceName?.trim() || item.deviceId;
}
function hasRemoteItems(items) {
  return items.some(isRemoteItem);
}
function deviceOptions(items) {
  const map2 = /* @__PURE__ */ new Map();
  for (const it2 of items) {
    if (!map2.has(it2.deviceId)) map2.set(it2.deviceId, it2.deviceName?.trim() || it2.deviceId);
  }
  return [...map2.entries()].map(([value, label2]) => ({ value, label: label2 }));
}
const STATUS_META = {
  done: {
    icon: CircleCheck,
    text: "text-accent-green",
    border: "border-l-accent-green",
    tint: "bg-accent-green/15 text-accent-green",
    labelKey: "card.statusDone"
  },
  doing: {
    icon: Loader,
    text: "text-accent-blue",
    border: "border-l-accent-blue",
    tint: "bg-accent-blue/15 text-accent-blue",
    labelKey: "card.statusDoing"
  },
  wait: {
    icon: CircleHelp,
    text: "text-accent-yellow",
    border: "border-l-accent-yellow",
    tint: "bg-accent-yellow/15 text-accent-yellow",
    labelKey: "card.statusWait"
  }
};
const LANE_COL_W = 112;
const ZOOM_STEPS = [1, 2, 4];
function statusIcon(item, className = "h-3.5 w-3.5") {
  const Icon2 = STATUS_META[item.status].icon;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Icon2, { className: cn(className, item.status === "doing" && "animate-spin"), "aria-hidden": true });
}
function DailyBoardTimeline({ day, items, nowMin, isToday, selectedId, onSelect, onOpen, onAnswer, multiSelectedIds, onToggleMulti, onAddEntry, showDeviceTag }) {
  const { t: t2, i18n } = useTranslation("dailyBoard");
  const containerRef = reactExports.useRef(null);
  const [baseWidth, setBaseWidth] = reactExports.useState(0);
  const [zoomIndex, setZoomIndex] = reactExports.useState(0);
  const [tooltip2, setTooltip] = reactExports.useState(null);
  const hoverTimer = reactExports.useRef(null);
  const dayStart = reactExports.useMemo(() => parseDateKey(day.date), [day.date]);
  reactExports.useEffect(() => {
    const el2 = containerRef.current;
    if (!el2 || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => {
      const w2 = entries[0]?.contentRect.width ?? 0;
      setBaseWidth(Math.max(240, w2 - LANE_COL_W));
    });
    ro.observe(el2);
    return () => ro.disconnect();
  }, []);
  reactExports.useEffect(() => {
    const el2 = containerRef.current;
    if (!el2) return;
    const onWheel = (e3) => {
      if (!e3.ctrlKey) return;
      e3.preventDefault();
      setZoomIndex((i2) => Math.min(ZOOM_STEPS.length - 1, Math.max(0, i2 + (e3.deltaY < 0 ? 1 : -1))));
    };
    el2.addEventListener("wheel", onWheel, { passive: false });
    return () => el2.removeEventListener("wheel", onWheel);
  }, []);
  const zoom2 = ZOOM_STEPS[zoomIndex];
  const trackWidth = baseWidth * zoom2;
  const range3 = reactExports.useMemo(() => {
    const rows = items.map((item) => resolveItemRange(item.firstAt, item.lastAt, dayStart, 0)).filter((r2) => r2.hasTime).map((r2) => ({ startMin: r2.startMin, endMin: r2.endMin ?? void 0 }));
    return computeTimeRange({ items: rows, nowMin: isToday ? nowMin : null });
  }, [items, dayStart, nowMin, isToday]);
  const laneRows = reactExports.useMemo(() => {
    const byLane = /* @__PURE__ */ new Map();
    for (const item of items) {
      const arr = byLane.get(item.laneKey) ?? [];
      arr.push(item);
      byLane.set(item.laneKey, arr);
    }
    const tiles = day.lanes.filter((lane2) => byLane.has(lane2.key));
    for (const key2 of byLane.keys()) {
      if (!tiles.some((lane2) => lane2.key === key2)) {
        const first2 = byLane.get(key2)[0];
        tiles.push({ key: key2, kind: "other", name: first2.laneName, color: null, count: byLane.get(key2).length });
      }
    }
    const nowX = isToday ? (nowMin - range3.startMin) / timeRangeSpan(range3) * trackWidth : null;
    return tiles.map((lane2) => {
      const cards2 = byLane.get(lane2.key) ?? [];
      const packItems = cards2.map((item) => {
        const span2 = resolveItemRange(item.firstAt, item.lastAt, dayStart, range3.startMin);
        return {
          id: item.sessionId,
          startMin: span2.startMin,
          endMin: span2.endMin,
          doing: item.status === "doing" && isToday && !item.sessionDeleted
        };
      });
      const packed = packLane({
        trackWidth,
        rangeStartMin: range3.startMin,
        rangeEndMin: range3.endMin,
        nowMin: isToday ? nowMin : null,
        items: packItems
      });
      const byId = new Map(packed.placements.map((p2) => [p2.id, p2]));
      return { lane: lane2, cards: cards2, packed, byId, nowX };
    });
  }, [items, day, dayStart, range3, trackWidth, nowMin, isToday]);
  const span = timeRangeSpan(range3);
  const xOf = (min2) => (min2 - range3.startMin) / span * trackWidth;
  const hourMarks = reactExports.useMemo(() => {
    const startH = Math.floor(range3.startMin / 60);
    const endH = Math.ceil(range3.endMin / 60);
    const marks = [];
    for (let h2 = startH; h2 <= endH; h2++) marks.push(h2 * 60);
    return marks;
  }, [range3]);
  const compactTicks = baseWidth < 600;
  const scheduleTooltip = reactExports.useCallback((item, x2, y2) => {
    if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => setTooltip({ item, x: x2, y: y2 }), 300);
  }, []);
  const clearTooltip = reactExports.useCallback(() => {
    if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
    setTooltip(null);
  }, []);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { ref: containerRef, className: "relative flex min-h-0 flex-1 overflow-hidden", "data-daily-timeline": true, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-0 flex-1 overflow-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", style: { width: LANE_COL_W + trackWidth }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "sticky top-0 z-20 flex shrink-0 border-b border-border/70 bg-bg-primary/95 backdrop-blur", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "sticky left-0 z-10 h-7 shrink-0 border-r border-border/70 bg-bg-primary", style: { width: LANE_COL_W } }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative h-7", style: { width: trackWidth }, children: [
          hourMarks.map((m2) => {
            const hour = Math.round(m2 / 60);
            if (compactTicks && hour % 2 !== 0) return null;
            return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute top-1 -translate-x-1/2 text-[11px] font-semibold text-text-muted", style: { left: xOf(m2) }, children: formatMinutes(m2, t2("card.nextDay")) }, m2);
          }),
          isToday && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute top-1 inline-flex -translate-x-1/2 whitespace-nowrap rounded bg-accent-red px-1 text-[10px] font-semibold text-bg-primary", style: { left: xOf(nowMin), transform: "translateX(-50%)" }, children: t2("card.now", { time: formatClock((/* @__PURE__ */ new Date()).toISOString(), i18n.language) }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pointer-events-none absolute inset-0 z-0", "aria-hidden": true, children: [
        hourMarks.map((m2) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-0 bottom-0 w-px bg-border/40", style: { left: LANE_COL_W + xOf(m2) } }, m2)),
        isToday && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-0 bottom-0 z-10 border-l-2 border-dashed border-accent-red", style: { left: LANE_COL_W + xOf(nowMin) } })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative z-10", children: laneRows.map(({ lane: lane2, cards: cards2, packed, byId }) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex border-b border-border/50", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "sticky left-0 z-10 flex shrink-0 flex-col gap-0.5 border-r border-border/70 bg-bg-secondary px-2.5 py-2", style: { width: LANE_COL_W }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-3 w-1 rounded-full", style: { backgroundColor: lane2.color ?? "var(--color-text-muted, #999)" }, "aria-hidden": true }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate text-xs font-semibold text-text-primary", title: laneDisplayName(lane2, t2), children: laneDisplayName(lane2, t2) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "pl-2.5 text-[11px] text-text-muted", children: t2("lane.count", { count: cards2.length }) }),
            onAddEntry ? /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "rounded px-1 text-[11px] text-accent-blue hover:underline", onClick: () => onAddEntry(lane2.key), title: t2("state.addManual"), "aria-label": t2("state.addManual"), children: "＋" }) : null
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative", style: { width: trackWidth, minHeight: packed.height }, children: cards2.map((item) => {
          const place = byId.get(item.sessionId);
          if (!place) return null;
          return /* @__PURE__ */ jsxRuntimeExports.jsx(
            TimelineCard,
            {
              item,
              left: place.left,
              width: place.width,
              top: place.row * packed.rowHeight,
              compact: packed.compact,
              selected: item.sessionId === selectedId,
              multiSelected: !isRemoteItem(item) && (multiSelectedIds ?? []).includes(targetKeyOf(item)),
              onToggleMulti: onToggleMulti && !isRemoteItem(item) ? () => onToggleMulti(targetKeyOf(item)) : void 0,
              showDeviceTag,
              locale: i18n.language,
              onSelect: () => onSelect(item.sessionId),
              onOpen: () => onOpen(item),
              onAnswer: () => onAnswer(item),
              onHoverStart: (x2, y2) => scheduleTooltip(item, x2, y2),
              onHoverEnd: clearTooltip
            },
            item.sessionId
          );
        }) })
      ] }, lane2.key)) })
    ] }) }),
    tooltip2 ? /* @__PURE__ */ jsxRuntimeExports.jsx(CardTooltip, { item: tooltip2.item, x: tooltip2.x, y: tooltip2.y, locale: i18n.language }) : null
  ] });
}
function TimelineCard({ item, left, width, top, compact, selected: selected2, multiSelected, onToggleMulti, showDeviceTag, locale: locale2, onSelect, onOpen, onAnswer, onHoverStart, onHoverEnd }) {
  const { t: t2 } = useTranslation("dailyBoard");
  const meta2 = STATUS_META[item.status];
  const start2 = formatClock(item.firstAt, locale2);
  const deleted = item.sessionDeleted;
  const onKeyDown = (e3) => {
    if (e3.key === "Enter" || e3.key === " ") {
      e3.preventDefault();
      onOpen();
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      role: "button",
      tabIndex: selected2 ? 0 : -1,
      "aria-current": selected2 ? "true" : void 0,
      "data-daily-card": item.sessionId,
      onClick: (e3) => {
        if ((e3.ctrlKey || e3.metaKey) && onToggleMulti) {
          e3.stopPropagation();
          onToggleMulti();
          return;
        }
        onSelect();
        onOpen();
      },
      onKeyDown,
      onFocus: (e3) => {
        onSelect();
        if (item.summary || item.decision) {
          const r2 = e3.currentTarget.getBoundingClientRect();
          onHoverStart(r2.right, r2.top);
        }
      },
      onBlur: onHoverEnd,
      onMouseEnter: (e3) => onHoverStart(e3.currentTarget.getBoundingClientRect().right, e3.currentTarget.getBoundingClientRect().top),
      onMouseLeave: onHoverEnd,
      className: cn(
        "absolute cursor-pointer overflow-hidden rounded-md border border-border/70 border-l-4 bg-bg-secondary text-left shadow-sm outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-accent-blue",
        meta2.border,
        selected2 && "ring-2 ring-accent-blue",
        multiSelected && "ring-2 ring-accent-green",
        deleted && "opacity-60",
        compact ? "px-1.5 py-0.5" : "px-2 py-1"
      ),
      style: { left, width, top, height: compact ? 32 : 60 },
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 overflow-hidden", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: cn("shrink-0 font-mono text-[11px] font-semibold", meta2.text), children: [
            start2,
            item.status === "doing" ? ` ${t2("card.since")}` : ""
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate text-xs font-medium text-text-primary", title: item.title, children: item.title }),
          showDeviceTag ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn("shrink-0 rounded px-1 text-[10px]", isRemoteItem(item) ? "bg-accent-blue/15 text-accent-blue" : "bg-bg-hover text-text-muted"), children: deviceTagLabel(item, t2) }) : null,
          item.confidence === "low" ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "shrink-0 text-[11px] text-accent-yellow", title: t2("card.lowConfidence"), children: "?" }) : null,
          item.aiState === "pending" ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "shrink-0 text-[11px] text-accent-yellow", title: t2("state.pendingTidy"), children: "◌" }) : null
        ] }),
        !compact && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-0.5 flex items-center gap-1 overflow-hidden text-[11px] text-text-secondary", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: cn("inline-flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-px", meta2.tint), children: [
            statusIcon(item, "h-3 w-3"),
            t2(meta2.labelKey)
          ] }),
          deleted ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate text-text-muted", children: t2("card.sessionDeleted") }) : item.status === "wait" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate", children: item.decision?.question || item.summary }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "shrink-0 rounded px-1 text-accent-blue hover:underline", onClick: (e3) => {
              e3.stopPropagation();
              onAnswer();
            }, children: t2("card.goAnswer") })
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate", children: item.summary })
        ] })
      ]
    }
  );
}
function CardTooltip({ item, x: x2, y: y2, locale: locale2 }) {
  const { t: t2 } = useTranslation("dailyBoard");
  const meta2 = STATUS_META[item.status];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pointer-events-none fixed z-50 w-72 rounded-lg border border-border bg-bg-secondary p-3 text-xs shadow-xl", style: { left: Math.min(x2 + 8, window.innerWidth - 300), top: y2 }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-1 flex items-center gap-1.5 font-semibold text-text-primary", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: meta2.text, children: statusIcon(item, "h-3.5 w-3.5") }),
      item.title
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-1 flex items-center gap-2 text-text-muted", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: t2(meta2.labelKey) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
        formatClock(item.firstAt, locale2),
        item.lastAt ? `–${formatClock(item.lastAt, locale2)}` : ""
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: itemLaneDisplayName(item, t2) })
    ] }),
    item.summary ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "whitespace-pre-wrap leading-5 text-text-secondary", children: item.summary }) : null,
    item.status === "wait" && item.decision?.question ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 leading-5 text-accent-yellow", children: item.decision.question }) : null
  ] });
}
function DailyBoardList({ day, items, onOpen, onAnswer, multiSelectedIds, onToggleMulti, onAddEntry, showDeviceTag }) {
  const { t: t2, i18n } = useTranslation("dailyBoard");
  const byLane = /* @__PURE__ */ new Map();
  for (const item of items) {
    const arr = byLane.get(item.laneKey) ?? [];
    arr.push(item);
    byLane.set(item.laneKey, arr);
  }
  const groups2 = [...day.lanes.filter((lane2) => byLane.has(lane2.key))];
  for (const key2 of byLane.keys()) {
    if (!groups2.some((lane2) => lane2.key === key2)) {
      const first2 = byLane.get(key2)[0];
      groups2.push({ key: key2, kind: "other", name: first2.laneName, color: null, count: byLane.get(key2).length });
    }
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-0 flex-1 overflow-auto p-4", "data-daily-list": true, children: groups2.map((lane2) => {
    const cards2 = [...byLane.get(lane2.key) ?? []].sort((a2, b2) => (a2.firstAt ?? "").localeCompare(b2.firstAt ?? ""));
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mb-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "mb-1.5 flex items-center gap-2 text-xs font-semibold text-text-primary", children: [
        lane2.color ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-block h-2.5 w-2.5 rounded-full", style: { backgroundColor: lane2.color }, "aria-hidden": true }) : null,
        laneDisplayName(lane2, t2),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-normal text-text-muted", children: t2("lane.count", { count: cards2.length }) }),
        onAddEntry ? /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "rounded px-1 text-accent-blue hover:underline", onClick: () => onAddEntry(lane2.key), title: t2("state.addManual"), "aria-label": t2("state.addManual"), children: "＋" }) : null
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "divide-y divide-border/60 overflow-hidden rounded-lg border border-border", children: cards2.map((item) => {
        const meta2 = STATUS_META[item.status];
        const deleted = item.sessionDeleted;
        const multi = !isRemoteItem(item) && (multiSelectedIds ?? []).includes(targetKeyOf(item));
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: cn("flex items-start gap-3 bg-bg-secondary px-3 py-2", multi && "ring-2 ring-inset ring-accent-green"), "data-daily-list-item": item.sessionId, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "w-24 shrink-0 pt-0.5 font-mono text-[11px] text-text-muted", children: [
            formatClock(item.firstAt, i18n.language),
            item.lastAt ? `–${formatClock(item.lastAt, i18n.language)}` : ""
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: cn("mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-px text-[11px]", meta2.tint), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(meta2.icon, { className: cn("h-3 w-3", item.status === "doing" && "animate-spin"), "aria-hidden": true }),
            t2(meta2.labelKey)
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "min-w-0 flex-1 text-left", onClick: (e3) => {
            if ((e3.ctrlKey || e3.metaKey) && onToggleMulti && !isRemoteItem(item)) {
              onToggleMulti(targetKeyOf(item));
              return;
            }
            onOpen(item);
          }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate text-sm font-medium text-text-primary", children: item.title }),
              showDeviceTag ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn("shrink-0 rounded px-1 text-[10px]", isRemoteItem(item) ? "bg-accent-blue/15 text-accent-blue" : "bg-bg-hover text-text-muted"), children: deviceTagLabel(item, t2) }) : null,
              item.confidence === "low" ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[11px] text-accent-yellow", title: t2("card.lowConfidence"), children: "?" }) : null,
              item.aiState === "pending" ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[11px] text-accent-yellow", title: t2("state.pendingTidy"), children: "◌" }) : null,
              deleted ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[11px] text-text-muted", children: [
                "· ",
                t2("card.sessionDeleted")
              ] }) : null
            ] }),
            !deleted && (item.status === "wait" && item.decision?.question ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mt-0.5 block truncate text-xs text-accent-yellow", children: item.decision.question }) : item.summary ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mt-0.5 block truncate text-xs text-text-secondary", children: item.summary }) : null)
          ] }),
          !deleted && item.status === "wait" ? /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "shrink-0 rounded px-1.5 py-0.5 text-xs text-accent-blue hover:underline", onClick: () => onAnswer(item), children: t2("card.goAnswer") }) : null
        ] }, item.sessionId);
      }) })
    ] }, lane2.key);
  }) });
}
function awaitKindOf(n2) {
  return n2.status === "awaiting" ? n2.awaitKind ?? "answer" : null;
}
const STATUS_TONE = {
  running: "bg-accent-green/15 text-accent-green",
  sleeping: "bg-bg-hover text-text-muted",
  queued: "bg-bg-hover text-text-secondary",
  succeeded: "bg-accent-green/15 text-accent-green",
  partial: "bg-accent-yellow/15 text-accent-yellow",
  failed: "bg-accent-red/15 text-accent-red",
  stopped: "bg-bg-hover text-text-muted",
  awaiting: "bg-accent-yellow/20 text-accent-yellow"
};
const statusChipClass = (status2) => `rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_TONE[status2]}`;
function StatusChip({ status: status2, awaitKind: awaitKind2 }) {
  const { t: t2 } = useTranslation("canvasDrawer");
  return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { "data-drawer-status": status2, className: statusChipClass(status2), children: status2 === "awaiting" ? t2(`awaitKind.${awaitKind2 ?? "answer"}`) : t2(`status.${status2}`) });
}
function Section({ title: title2, children: children2 }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mb-5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "mb-2 text-xs font-semibold tracking-wide text-text-muted", children: title2 }),
    children2
  ] });
}
const DRAWER_WIDTH_KEY = "shineai.canvas.drawerWidth";
const DRAWER_MIN_W = 360;
const DRAWER_DEFAULT_W = 420;
const DRAWER_KEY_STEP = 16;
function clampDrawerWidth(width, containerWidth = 0) {
  const max2 = containerWidth > 0 ? Math.max(DRAWER_MIN_W, containerWidth * 0.7) : Infinity;
  return Math.round(Math.min(max2, Math.max(DRAWER_MIN_W, Number.isFinite(width) ? width : DRAWER_DEFAULT_W)));
}
function readDrawerWidth() {
  try {
    const raw = localStorage.getItem(DRAWER_WIDTH_KEY);
    return raw === null ? DRAWER_DEFAULT_W : clampDrawerWidth(Number(raw));
  } catch {
    return DRAWER_DEFAULT_W;
  }
}
const useDrawerWidthStore = create$5((set2) => ({
  width: readDrawerWidth(),
  setWidth: (width) => {
    set2({ width });
    try {
      localStorage.setItem(DRAWER_WIDTH_KEY, String(width));
    } catch {
    }
  }
}));
function DrawerFrame({ node: node2, onClose, onBack, backLabel, actions: actions2, moreActions: moreActions2, statusMeta: statusMeta2, statusSlot, statusOverride, fill: fill2 = false, tabs: tabs2, activeTab, onTabChange, kicker, subtitle: subtitle2, subtitleMeta, children: children2 }) {
  const { t: t2 } = useTranslation("canvasDrawer");
  reactExports.useEffect(() => {
    const onKey = (e3) => e3.key === "Escape" && !(e3.target instanceof Element && e3.target.closest(".xterm")) && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const [moreOpen, setMoreOpen] = reactExports.useState(false);
  const hasMore = !!(actions2 || moreActions2);
  const moreRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    if (!moreOpen) return;
    const onDown = (e3) => !moreRef.current?.contains(e3.target) && setMoreOpen(false);
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, [moreOpen]);
  const width = useDrawerWidthStore((s2) => s2.width);
  const commitWidth = useDrawerWidthStore((s2) => s2.setWidth);
  const [dragWidth, setDragWidth] = reactExports.useState(null);
  const asideRef = reactExports.useRef(null);
  const stopDragRef = reactExports.useRef(null);
  reactExports.useEffect(() => () => stopDragRef.current?.(), []);
  const containerWidth = () => asideRef.current?.offsetParent?.getBoundingClientRect().width ?? 0;
  const onResizePointerDown = (e3) => {
    if (e3.button !== 0) return;
    e3.preventDefault();
    const startX = e3.clientX;
    const startWidth = width;
    const total2 = containerWidth();
    let last2 = startWidth;
    setDragWidth(startWidth);
    const move2 = (ev) => {
      last2 = clampDrawerWidth(startWidth - (ev.clientX - startX), total2);
      setDragWidth(last2);
    };
    const stop2 = () => {
      window.removeEventListener("pointermove", move2);
      window.removeEventListener("pointerup", stop2);
      window.removeEventListener("pointercancel", stop2);
      window.removeEventListener("blur", stop2);
      stopDragRef.current = null;
      setDragWidth(null);
      commitWidth(last2);
    };
    window.addEventListener("pointermove", move2);
    window.addEventListener("pointerup", stop2);
    window.addEventListener("pointercancel", stop2);
    window.addEventListener("blur", stop2);
    stopDragRef.current = stop2;
  };
  const onResizeKeyDown = (e3) => {
    if (e3.key !== "ArrowLeft" && e3.key !== "ArrowRight") return;
    e3.preventDefault();
    commitWidth(clampDrawerWidth(width + (e3.key === "ArrowLeft" ? DRAWER_KEY_STEP : -DRAWER_KEY_STEP), containerWidth()));
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "aside",
    {
      ref: asideRef,
      role: "complementary",
      "aria-label": t2("aria", { title: node2.title }),
      "data-canvas-drawer": node2.kind,
      className: "absolute bottom-0 right-0 top-0 z-30 flex max-w-full flex-col border-l border-border bg-bg-secondary shadow-2xl",
      style: { width: dragWidth ?? width },
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            role: "separator",
            "aria-orientation": "vertical",
            "aria-label": t2("resize"),
            title: t2("resize"),
            tabIndex: 0,
            "data-drawer-resize": true,
            onPointerDown: onResizePointerDown,
            onKeyDown: onResizeKeyDown,
            className: cn(
              "absolute bottom-0 left-0 top-0 z-10 w-1.5 -translate-x-1/2 cursor-col-resize transition-colors hover:bg-accent-blue/60 focus-visible:bg-accent-blue focus-visible:outline-none",
              dragWidth !== null && "bg-accent-blue"
            )
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "relative border-b border-border px-5 pb-3 pt-3 short:pb-2 short:pt-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: onClose, "aria-label": t2("close"), className: "absolute right-3 top-3 short:top-1 flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-bg-hover hover:text-text-primary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X$1, { className: "h-4 w-4" }) }),
          hasMore ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              ref: moreRef,
              className: cn("absolute right-11 top-3 short:top-1", moreActions2 ? "block" : "hidden short:block"),
              onKeyDown: (e3) => {
                if (e3.key !== "Escape" || !moreOpen) return;
                e3.stopPropagation();
                setMoreOpen(false);
              },
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", "aria-label": t2("moreActions"), title: t2("moreActions"), "aria-expanded": moreOpen, onClick: () => setMoreOpen((v2) => !v2), "data-drawer-more": true, className: "flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-bg-hover hover:text-text-primary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Ellipsis, { className: "h-4 w-4" }) }),
                moreOpen ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute right-0 top-9 z-40 flex min-w-40 flex-col gap-1.5 rounded-xl border border-border bg-bg-secondary p-2 shadow-xl", "data-drawer-more-menu": true, children: [
                  actions2 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("flex-col gap-1.5", moreActions2 ? "hidden short:flex" : "flex"), children: actions2 }) : null,
                  moreActions2
                ] }) : null
              ]
            }
          ) : null,
          onBack ? /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: onBack, "data-drawer-back": true, className: "mb-1 inline-flex items-center gap-0.5 text-xs text-text-muted hover:text-text-primary", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { className: "h-3.5 w-3.5" }),
            backLabel
          ] }) : null,
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cn("short:flex short:items-center short:gap-2", hasMore ? "short:pr-[4.75rem]" : "short:pr-8"), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-2 text-xs text-text-muted short:shrink-0", children: kicker ?? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: t2(node2.subKind === "workflow" ? "kind.workflow" : `kind.${node2.kind}`) }),
              !statusOverride && statusSlot ? statusSlot : /* @__PURE__ */ jsxRuntimeExports.jsx(StatusChip, { status: statusOverride ?? node2.status, awaitKind: statusOverride ? null : awaitKindOf(node2) }),
              statusMeta2 ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "tabular-nums", "data-drawer-status-meta": true, children: statusMeta2 }) : null
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: cn("mt-1 text-lg font-semibold leading-snug text-text-primary short:mt-0 short:min-w-0 short:truncate short:pr-0 short:text-base", moreActions2 ? "pr-[4.75rem]" : "pr-8"), title: node2.title, children: node2.title })
          ] }),
          subtitle2 || subtitleMeta ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-0.5 flex min-w-0 items-center gap-2 pr-8 short:hidden text-[11px] text-text-muted", children: [
            subtitle2 ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "min-w-0 truncate font-mono", title: subtitle2, "data-drawer-subtitle": true, children: subtitle2 }) : null,
            subtitle2 && subtitleMeta ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { "aria-hidden": true, className: "shrink-0 text-text-tertiary/60", children: "·" }) : null,
            subtitleMeta
          ] }) : null,
          actions2 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2.5 flex flex-wrap gap-1.5 short:hidden", children: actions2 }) : null,
          tabs2?.length ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { role: "tablist", className: "-mb-3 mt-2.5 flex gap-4 short:-mb-2 short:mt-1.5", children: tabs2.map((tab2) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              type: "button",
              role: "tab",
              "aria-selected": tab2.id === activeTab,
              "data-drawer-tab": tab2.id,
              onClick: () => onTabChange?.(tab2.id),
              className: cn(
                "border-b-2 pb-2 text-xs font-medium outline-none transition-colors focus-visible:text-text-primary",
                tab2.id === activeTab ? "border-text-primary text-text-primary" : "border-transparent text-text-muted hover:text-text-primary"
              ),
              children: [
                tab2.label,
                tab2.dot ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { role: "img", "aria-label": t2("session.tabDot"), className: "ml-1 inline-block h-1.5 w-1.5 rounded-full bg-accent-yellow align-middle", "data-drawer-tab-dot": true }) : null
              ]
            },
            tab2.id
          )) }) : null
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: fill2 ? "flex min-h-0 flex-1 flex-col px-5 pb-3 pt-3" : "flex-1 overflow-y-auto px-5 pb-6 pt-4", children: children2 })
      ]
    }
  );
}
function isExternalLink(value) {
  return /^https?:\/\//i.test(value.trim());
}
function isLocalPath(value) {
  const v2 = value.trim();
  return /^[A-Za-z]:[\\/]/.test(v2) || v2.startsWith("\\\\") || v2.startsWith("/") || v2.includes("\\") && !v2.includes("://");
}
async function openOutput(value) {
  const raw = value.trim();
  if (!raw) return { ok: false, error: "empty output" };
  if (isExternalLink(raw)) {
    const browser2 = window.shineAI?.browser;
    if (browser2?.openWindow) {
      void browser2.openWindow(raw, { newTab: true });
      return { ok: true };
    }
    void window.shineAI?.shell?.openExternal?.(raw);
    return { ok: true };
  }
  if (isLocalPath(raw)) {
    return openProduct({ path: raw });
  }
  return { ok: false, error: "unsupported output" };
}
const STATUSES$1 = ["done", "doing", "wait"];
function DailyBoardEntryDialog({ mode: mode2, laneKey, laneOptions, memberCount = 0, defaultTitle = "", busy, onSubmit, onClose }) {
  const { t: t2 } = useTranslation("dailyBoard");
  const [title2, setTitle] = reactExports.useState(defaultTitle);
  const [summary2, setSummary] = reactExports.useState("");
  const [status2, setStatus] = reactExports.useState("done");
  const [lane2, setLane] = reactExports.useState(laneKey);
  const [start2, setStart] = reactExports.useState("");
  const [end, setEnd] = reactExports.useState("");
  const [parts, setParts] = reactExports.useState([
    { title: defaultTitle ? `${defaultTitle} (1)` : "", summary: "", status: "done" },
    { title: defaultTitle ? `${defaultTitle} (2)` : "", summary: "", status: "done" }
  ]);
  const isSplit = mode2 === "split";
  const canSubmit = isSplit ? parts.length >= 2 && parts.every((p2) => p2.title.trim()) : title2.trim().length > 0;
  const submit = () => {
    if (!canSubmit) return;
    onSubmit({
      laneKey: lane2,
      title: title2.trim(),
      summary: summary2.trim(),
      status: status2,
      startAt: start2 || null,
      endAt: end || null,
      parts: isSplit ? parts.map((p2) => ({ title: p2.title.trim(), summary: p2.summary.trim(), status: p2.status })) : void 0
    });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4", "data-daily-entry-dialog": true, onKeyDown: (e3) => {
    if (e3.key === "Escape") onClose();
  }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { role: "dialog", "aria-modal": "true", "aria-label": t2(`edit.dialog.${mode2}`), className: "w-[420px] max-w-full rounded-xl border border-border bg-bg-secondary p-4 shadow-2xl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-3 flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-semibold text-text-primary", children: t2(`edit.dialog.${mode2}`) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "rounded-lg p-1 text-text-muted hover:bg-bg-hover hover:text-text-primary", onClick: onClose, "aria-label": t2("drawer.close"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(X$1, { className: "h-4 w-4", "aria-hidden": true }) })
    ] }),
    mode2 === "merge" ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-2 text-xs text-text-muted", children: t2("edit.mergeHint", { count: memberCount }) }) : null,
    isSplit ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-3 space-y-2", children: [
      parts.map((part, i2) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-border p-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            value: part.title,
            onChange: (e3) => setParts((prev) => prev.map((p2, j2) => j2 === i2 ? { ...p2, title: e3.target.value } : p2)),
            placeholder: t2("edit.partTitle", { n: i2 + 1 }),
            className: "mb-1 h-7 w-full rounded-lg border border-border bg-bg-primary px-2 text-xs text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              value: part.summary,
              onChange: (e3) => setParts((prev) => prev.map((p2, j2) => j2 === i2 ? { ...p2, summary: e3.target.value } : p2)),
              placeholder: t2("edit.summary"),
              className: "h-7 flex-1 rounded-lg border border-border bg-bg-primary px-2 text-xs text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("select", { value: part.status, onChange: (e3) => setParts((prev) => prev.map((p2, j2) => j2 === i2 ? { ...p2, status: e3.target.value } : p2)), className: "h-7 rounded-lg border border-border bg-bg-primary px-1.5 text-xs text-text-primary", children: STATUSES$1.map((s2) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: s2, children: t2(`card.status${s2[0].toUpperCase()}${s2.slice(1)}`) }, s2)) })
        ] })
      ] }, i2)),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "rounded-lg border border-border px-2 py-0.5 text-xs text-text-secondary hover:bg-bg-hover", onClick: () => setParts((p2) => [...p2, { title: "", summary: "", status: "done" }]), children: t2("edit.addPart") }),
        parts.length > 2 ? /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "rounded-lg border border-border px-2 py-0.5 text-xs text-text-secondary hover:bg-bg-hover", onClick: () => setParts((p2) => p2.slice(0, -1)), children: t2("edit.removePart") }) : null
      ] })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "mb-1 block text-[11px] text-text-muted", children: t2("edit.title") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          value: title2,
          onChange: (e3) => setTitle(e3.target.value),
          className: "mb-2 h-8 w-full rounded-lg border border-border bg-bg-primary px-2 text-xs text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-accent-blue",
          "data-daily-entry-title": true
        }
      ),
      mode2 === "manual" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "mb-1 block text-[11px] text-text-muted", children: t2("edit.summary") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "textarea",
          {
            value: summary2,
            onChange: (e3) => setSummary(e3.target.value),
            rows: 2,
            className: "mb-2 w-full resize-y rounded-lg border border-border bg-bg-primary px-2 py-1 text-xs text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-2 flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("select", { value: status2, onChange: (e3) => setStatus(e3.target.value), className: "h-7 rounded-lg border border-border bg-bg-primary px-1.5 text-xs text-text-primary", "aria-label": t2("drawer.status"), children: STATUSES$1.map((s2) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: s2, children: t2(`card.status${s2[0].toUpperCase()}${s2.slice(1)}`) }, s2)) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "datetime-local", value: start2, onChange: (e3) => setStart(e3.target.value), className: "h-7 rounded-lg border border-border bg-bg-primary px-1.5 text-xs text-text-primary", "aria-label": t2("edit.start") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "datetime-local", value: end, onChange: (e3) => setEnd(e3.target.value), className: "h-7 rounded-lg border border-border bg-bg-primary px-1.5 text-xs text-text-primary", "aria-label": t2("edit.end") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "mb-1 block text-[11px] text-text-muted", children: t2("edit.lane") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("select", { value: lane2, onChange: (e3) => setLane(e3.target.value), className: "mb-3 h-8 w-full rounded-lg border border-border bg-bg-primary px-2 text-xs text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-accent-blue", children: laneOptions.map((l2) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: l2.key, children: l2.name }, l2.key)) })
      ] }) : null
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "rounded-lg border border-border px-3 py-1 text-xs text-text-secondary hover:bg-bg-hover", onClick: onClose, children: t2("state.cancel") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: cn("rounded-lg bg-accent-blue px-3 py-1 text-xs font-medium text-white hover:bg-accent-blue/90 disabled:opacity-40"), disabled: !canSubmit || busy, onClick: submit, children: busy ? t2("schedule.saving") : t2("edit.save") })
    ] })
  ] }) });
}
const STATUSES = ["done", "doing", "wait"];
function statusLabelKey(status2) {
  return `card.status${status2[0].toUpperCase()}${status2.slice(1)}`;
}
function drawerNode(item) {
  return { id: `daily-${item.sessionId}`, title: item.title, kind: "session", status: "succeeded" };
}
function DailyBoardDrawer({ item, date: date2, laneOptions, editNonce, onClose, onOpenSession, onAnswer, onMutated }) {
  const { t: t2, i18n } = useTranslation("dailyBoard");
  const meta2 = STATUS_META[item.status];
  const deleted = item.sessionDeleted;
  const remote2 = isRemoteItem(item);
  const start2 = formatClock(item.firstAt, i18n.language);
  const end = formatClock(item.lastAt, i18n.language);
  const sourceKey = item.origin === "handoff" ? "source.handoff" : item.origin === "ai" ? "source.aiEdit" : item.origin === "manual" ? "source.manual" : "source.rule";
  const targetKey = item.entry ? entryTargetKey(item.entry.id) : sessionTargetKey(item.sessionId, item.deviceId);
  const [editing, setEditing] = reactExports.useState(false);
  const [busy, setBusy] = reactExports.useState(false);
  const [error2, setError] = reactExports.useState(null);
  const [draft, setDraft] = reactExports.useState({ status: item.status, title: item.title, summary: item.summary, hidden: false });
  const [lane2, setLane] = reactExports.useState(item.laneKey);
  const [laneScope, setLaneScope] = reactExports.useState("today");
  const [splitting, setSplitting] = reactExports.useState(false);
  reactExports.useEffect(() => {
    setDraft({ status: item.status, title: item.title, summary: item.summary, hidden: false });
    setLane(item.laneKey);
    setEditing(false);
  }, [item.sessionId, item.status, item.title, item.summary, item.laneKey]);
  reactExports.useEffect(() => {
    if (editNonce > 0) setEditing(true);
  }, [editNonce]);
  const run2 = async (fn, after) => {
    setBusy(true);
    setError(null);
    const res = await fn();
    setBusy(false);
    if (res.ok) {
      after?.();
      onMutated();
    } else setError(res.error ?? "failed");
  };
  const saveEdit = () => {
    const patch2 = {};
    if (draft.status !== item.status) patch2.status = draft.status;
    if (draft.title.trim() !== item.title) patch2.title = draft.title.trim();
    if (draft.summary.trim() !== item.summary) patch2.summary = draft.summary.trim();
    if (draft.hidden) patch2.hidden = true;
    const laneChanged = lane2 !== item.laneKey;
    const scope = laneScope === "always" && laneChanged && lane2.startsWith("group:") ? "always" : "today";
    if (laneChanged && scope === "today") patch2.laneKey = lane2;
    if (Object.keys(patch2).length === 0 && !laneChanged) {
      setEditing(false);
      return;
    }
    void run2(
      async () => {
        if (Object.keys(patch2).length > 0) {
          const r2 = await editItem({ date: date2, targetKey, patch: patch2 });
          if (!r2.ok) return r2;
        }
        if (laneChanged && scope === "always") {
          const r2 = await moveLane({ date: date2, targetKey, laneKey: lane2, scope: "always" });
          if (!r2.ok) return r2;
        }
        return { ok: true };
      },
      () => setEditing(false)
    );
  };
  laneOptions.filter((l2) => l2.key.startsWith("group:"));
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    DrawerFrame,
    {
      node: drawerNode(item),
      onClose,
      kicker: t2("drawer.title"),
      subtitle: itemLaneDisplayName(item, t2),
      actions: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5", children: [
        !deleted && !remote2 ? /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium text-text-primary hover:bg-bg-hover", onClick: () => setEditing((v2) => !v2), children: t2("drawer.edit") }) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "inline-flex h-8 items-center gap-1.5 rounded-lg border-transparent bg-accent-blue px-3 text-xs font-medium text-white hover:bg-accent-blue/90 disabled:opacity-40", disabled: deleted || remote2, onClick: () => onOpenSession(item), children: t2("card.openSession") })
      ] }),
      children: [
        item.aiConflict ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { role: "status", className: "mb-3 rounded-lg border border-accent-blue/30 bg-accent-blue/10 px-3 py-2 text-xs text-text-secondary", "data-daily-ai-conflict": true, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-1.5 font-medium text-accent-blue", children: t2("edit.aiConflict") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "rounded px-1.5 text-accent-blue hover:underline", disabled: busy, onClick: () => void run2(() => resolveAiConflict({ date: date2, targetKey, choice: "accept" })), children: t2("edit.acceptAi") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "rounded px-1.5 text-text-secondary hover:underline", disabled: busy, onClick: () => void run2(() => resolveAiConflict({ date: date2, targetKey, choice: "keep" })), children: t2("edit.keepMine") })
          ] })
        ] }) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-3 flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium", meta2.tint), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(meta2.icon, { className: cn("h-3.5 w-3.5", item.status === "doing" && "animate-spin"), "aria-hidden": true }),
            t2(meta2.labelKey)
          ] }),
          item.confidence === "low" || item.aiState === "pending" ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[11px] text-accent-yellow", children: t2("state.pendingTidy") }) : null,
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[11px] text-text-muted", children: t2(sourceKey) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn("text-[11px]", remote2 ? "text-accent-blue" : "text-text-muted"), children: deviceTagLabel(item, t2) }),
          remote2 ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[11px] text-text-muted", "data-daily-remote-readonly": true, children: t2("card.remoteReadonly") }) : null,
          deleted ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[11px] text-text-muted", children: t2("card.sessionDeleted") }) : null
        ] }),
        remote2 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-3 rounded-lg bg-bg-hover px-2.5 py-1.5 text-[11px] text-text-muted", children: t2("card.remoteReadonlyHint") }) : null,
        editing ? /* @__PURE__ */ jsxRuntimeExports.jsx(Section, { title: t2("drawer.edit"), children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", "data-daily-edit-zone": true, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              value: draft.title,
              onChange: (e3) => setDraft((d2) => ({ ...d2, title: e3.target.value })),
              "aria-label": t2("edit.title"),
              className: "h-8 w-full rounded-lg border border-border bg-bg-primary px-2 text-xs text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "textarea",
            {
              value: draft.summary,
              onChange: (e3) => setDraft((d2) => ({ ...d2, summary: e3.target.value })),
              rows: 2,
              "aria-label": t2("edit.summary"),
              className: "w-full resize-y rounded-lg border border-border bg-bg-primary px-2 py-1 text-xs text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("select", { value: draft.status, onChange: (e3) => setDraft((d2) => ({ ...d2, status: e3.target.value })), className: "h-7 rounded-lg border border-border bg-bg-primary px-1.5 text-xs text-text-primary", "aria-label": t2("drawer.status"), children: STATUSES.map((s2) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: s2, children: t2(statusLabelKey(s2)) }, s2)) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex cursor-pointer items-center gap-1.5 text-xs text-text-secondary", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", className: "accent-accent-blue", checked: draft.hidden, onChange: (e3) => setDraft((d2) => ({ ...d2, hidden: e3.target.checked })) }),
              t2("edit.hidden")
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "mb-1 block text-[11px] text-text-muted", children: t2("edit.lane") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("select", { value: lane2, onChange: (e3) => setLane(e3.target.value), className: "h-7 w-full rounded-lg border border-border bg-bg-primary px-2 text-xs text-text-primary", "aria-label": t2("edit.lane"), children: laneOptions.map((l2) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: l2.key, children: l2.name }, l2.key)) }),
            !item.entry && lane2 !== item.laneKey && lane2.startsWith("group:") ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 flex items-center gap-3 text-[11px] text-text-secondary", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex cursor-pointer items-center gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "radio", className: "accent-accent-blue", checked: laneScope === "today", onChange: () => setLaneScope("today") }),
                t2("edit.scopeToday")
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex cursor-pointer items-center gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "radio", className: "accent-accent-blue", checked: laneScope === "always", onChange: () => setLaneScope("always") }),
                t2("edit.scopeAlways")
              ] })
            ] }) : null
          ] }),
          error2 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { role: "alert", className: "text-[11px] text-accent-red", children: t2("state.failedWith", { message: error2 }) }) : null,
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "rounded-lg bg-accent-blue px-3 py-1 text-xs font-medium text-white hover:bg-accent-blue/90 disabled:opacity-40", disabled: busy, onClick: saveEdit, children: t2("edit.save") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "rounded-lg border border-border px-3 py-1 text-xs text-text-secondary hover:bg-bg-hover", onClick: () => setEditing(false), children: t2("state.cancel") }),
            !item.entry ? /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "ml-auto rounded-lg border border-border px-3 py-1 text-xs text-text-secondary hover:bg-bg-hover", onClick: () => setSplitting(true), children: t2("edit.split") }) : null,
            item.entry ? /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "ml-auto rounded-lg border border-accent-red/40 px-3 py-1 text-xs text-accent-red hover:bg-accent-red/10 disabled:opacity-40", disabled: busy, onClick: () => void run2(() => deleteEntry({ date: date2, entryId: item.entry.id }), onClose), children: t2("edit.undo") }) : null
          ] })
        ] }) }) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsx(Section, { title: `${t2("drawer.lane")} · ${t2("drawer.timeRange")}`, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-text-secondary", children: [
          itemLaneDisplayName(item, t2),
          start2 ? ` · ${start2}${end ? `–${end}` : ""}` : ""
        ] }) }),
        item.status === "wait" && (item.decision?.question || !deleted) ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Section, { title: t2("drawer.decision"), children: [
          item.decision?.question ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm leading-6 text-text-secondary", children: item.decision.question }) : null,
          item.decision?.options?.length ? /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "mt-2 space-y-1", children: item.decision.options.map((opt, i2) => /* @__PURE__ */ jsxRuntimeExports.jsx("li", { className: "rounded-lg border border-border bg-bg-primary px-2.5 py-1.5 text-xs text-text-secondary", children: opt }, `${i2}-${opt}`)) }) : null,
          !deleted ? /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "mt-2 inline-flex h-8 items-center rounded-lg border border-accent-blue px-3 text-xs font-medium text-accent-blue hover:bg-accent-blue/10", onClick: () => onAnswer(item), children: t2("card.goAnswer") }) : null
        ] }) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsx(Section, { title: t2("drawer.conclusion"), children: item.detail.trim() ? /* @__PURE__ */ jsxRuntimeExports.jsx(MarkdownRenderer$1, { content: item.detail, variant: "compact" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-text-muted", children: t2("drawer.empty") }) }),
        item.outputs.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Section, { title: t2("drawer.outputs"), children: /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "space-y-1", "data-daily-outputs": true, children: item.outputs.map((out, i2) => /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "w-full truncate rounded-lg bg-bg-primary px-2.5 py-1.5 text-left text-xs text-text-secondary hover:text-accent-blue hover:underline", title: out, onClick: () => void openOutput(out).then((res) => {
          if (!res.ok) setError(res.error ?? "open failed");
        }), children: out }) }, `${i2}-${out}`)) }) }) : null,
        item.risks.trim() ? /* @__PURE__ */ jsxRuntimeExports.jsx(Section, { title: t2("drawer.risks"), children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "whitespace-pre-wrap text-sm leading-6 text-text-secondary", children: item.risks }) }) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsx(Section, { title: t2("drawer.source"), children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-flex rounded-full bg-bg-hover px-2 py-0.5 text-[11px] text-text-secondary", children: t2(sourceKey) }) }),
        splitting ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          DailyBoardEntryDialog,
          {
            mode: "split",
            laneKey: item.laneKey,
            laneOptions,
            defaultTitle: item.title,
            busy,
            onClose: () => setSplitting(false),
            onSubmit: (payload) => {
              void run2(() => split({ date: date2, targetKey, parts: (payload.parts ?? []).map((p2) => ({ ...p2, laneKey: item.laneKey })) }), () => {
                setSplitting(false);
                onClose();
              });
            }
          }
        ) : null
      ]
    }
  );
}
function DailyBoardSkeleton() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-0 flex-1 flex-col gap-3 p-4", "aria-hidden": true, "data-daily-skeleton": true, children: [0, 1, 2].map((i2) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-24 shrink-0 animate-pulse rounded bg-bg-hover" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 flex-1 animate-pulse rounded bg-bg-hover" })
  ] }, i2)) });
}
function DailyBoardEmpty({ titleKey, hintKey, actionLabel, onAction, busy, onAddManual }) {
  const { t: t2 } = useTranslation("dailyBoard");
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-0 flex-1 items-center justify-center p-8", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-md rounded-2xl border border-border bg-bg-secondary px-6 py-5 text-center shadow-sm", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(CalendarCheck, { className: "mx-auto mb-2 h-6 w-6 text-text-muted", "aria-hidden": true }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium text-text-primary", children: t2(titleKey) }),
    hintKey ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1.5 text-xs leading-6 text-text-muted", children: t2(hintKey) }) : null,
    actionLabel && onAction ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        type: "button",
        className: "mt-3 inline-flex h-8 items-center gap-1.5 rounded-lg border-transparent bg-accent-blue px-3 text-xs font-medium text-white hover:bg-accent-blue/90 disabled:opacity-40",
        disabled: busy,
        onClick: onAction,
        children: [
          busy ? /* @__PURE__ */ jsxRuntimeExports.jsx(Loader, { className: "h-3.5 w-3.5 animate-spin", "aria-hidden": true }) : null,
          actionLabel
        ]
      }
    ) : null,
    onAddManual ? /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "mt-3 inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium text-text-primary hover:bg-bg-hover", onClick: onAddManual, "data-daily-add-manual": true, children: t2("state.addManual") }) : null
  ] }) });
}
const AUTO_LIST_WIDTH = 960;
const HYSTERESIS = 40;
function readCollapsed() {
  try {
    return localStorage.getItem(HEADER_COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
}
function isEditable(target2) {
  const el2 = target2;
  const tag2 = el2?.tagName;
  return tag2 === "INPUT" || tag2 === "TEXTAREA" || tag2 === "SELECT" || el2?.isContentEditable === true;
}
function DailyBoardView({ onNavigate } = {}) {
  const { t: t2, i18n } = useTranslation("dailyBoard");
  const date2 = useDailyBoardNav((s2) => s2.date);
  const intent2 = useDailyBoardNav((s2) => s2.intent);
  const nonce = useDailyBoardNav((s2) => s2.nonce);
  const { day, loading: loading2, generating: generating2, error: error2, refresh: refresh2, generate } = useDailyBoardData(date2);
  const [filter2, setFilter] = reactExports.useState(EMPTY_FILTER);
  const [manualView, setManualView] = reactExports.useState(null);
  const [autoView, setAutoView] = reactExports.useState("timeline");
  const [collapsed2, setCollapsed] = reactExports.useState(readCollapsed);
  const [selectedId, setSelectedId] = reactExports.useState(null);
  const [drawerId, setDrawerId] = reactExports.useState(null);
  const [, setTick] = reactExports.useState(0);
  const [multi, setMulti] = reactExports.useState([]);
  const [editNonce, setEditNonce] = reactExports.useState(0);
  const [dialog, setDialog] = reactExports.useState(null);
  const [actionBusy, setActionBusy] = reactExports.useState(false);
  const [actionError, setActionError] = reactExports.useState(null);
  const [progress2, setProgress] = reactExports.useState(null);
  const rootRef = reactExports.useRef(null);
  const searchRef = reactExports.useRef(null);
  const isToday = isTodayKey(date2);
  const nowMin = nowMinutes();
  const lastNonce = reactExports.useRef(0);
  reactExports.useEffect(() => {
    if (nonce === lastNonce.current) return;
    lastNonce.current = nonce;
    if (intent2 === "generate") generate();
  }, [nonce, intent2, generate]);
  reactExports.useEffect(() => {
    const id2 = window.setInterval(() => setTick((v2) => v2 + 1), 6e4);
    return () => window.clearInterval(id2);
  }, []);
  reactExports.useEffect(() => {
    setProgress(day?.refineProgress ?? null);
  }, [day]);
  reactExports.useEffect(() => {
    return onProgress((payload) => {
      if (payload.date !== date2) return;
      setProgress(payload.done >= payload.total ? null : { done: payload.done, total: payload.total });
    });
  }, [date2]);
  reactExports.useEffect(() => {
    const el2 = rootRef.current;
    if (!el2 || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => {
      const w2 = entries[0]?.contentRect.width ?? 0;
      setAutoView((prev) => {
        if (prev === "timeline" && w2 < AUTO_LIST_WIDTH - HYSTERESIS) return "list";
        if (prev === "list" && w2 > AUTO_LIST_WIDTH + HYSTERESIS) return "timeline";
        return prev;
      });
    });
    ro.observe(el2);
    return () => ro.disconnect();
  }, []);
  reactExports.useEffect(() => {
    setManualView(null);
    setSelectedId(null);
    setDrawerId(null);
    setMulti([]);
  }, [date2]);
  const view2 = manualView ?? autoView;
  const items = reactExports.useMemo(() => day?.items ?? [], [day]);
  const filtered = reactExports.useMemo(() => filterItems(items, filter2), [items, filter2]);
  const showDeviceTag = reactExports.useMemo(() => hasRemoteItems(items), [items]);
  const deviceFilterOptions = reactExports.useMemo(() => showDeviceTag ? deviceOptions(items) : [], [items, showDeviceTag]);
  const ordered = reactExports.useMemo(() => {
    const laneOrder = new Map((day?.lanes ?? []).map((lane2, i2) => [lane2.key, i2]));
    return [...filtered].sort((a2, b2) => {
      const la2 = laneOrder.get(a2.laneKey) ?? 999;
      const lb2 = laneOrder.get(b2.laneKey) ?? 999;
      if (la2 !== lb2) return la2 - lb2;
      return (a2.firstAt ?? "").localeCompare(b2.firstAt ?? "");
    });
  }, [filtered, day]);
  reactExports.useEffect(() => {
    if (selectedId && ordered.some((it2) => it2.sessionId === selectedId)) return;
    setSelectedId(ordered[0]?.sessionId ?? null);
  }, [ordered, selectedId]);
  const selectedItem = ordered.find((it2) => it2.sessionId === selectedId) ?? null;
  const drawerItem = items.find((it2) => it2.sessionId === drawerId) ?? null;
  const kpis = day?.digest?.kpis ?? computeKpis(items);
  const focusCard = reactExports.useCallback((id2) => {
    if (!id2) return;
    requestAnimationFrame(() => {
      const node2 = document.querySelector(`[data-daily-card="${id2}"]`);
      node2?.focus();
    });
  }, []);
  const moveSelection = reactExports.useCallback((dir) => {
    if (ordered.length === 0) return;
    const idx = Math.max(0, ordered.findIndex((it2) => it2.sessionId === selectedId));
    const cur = ordered[idx];
    let next2 = cur;
    if (dir === "left" || dir === "right") {
      const sameLane = ordered.filter((it2) => it2.laneKey === cur.laneKey);
      const li2 = sameLane.findIndex((it2) => it2.sessionId === cur.sessionId);
      const target2 = sameLane[li2 + (dir === "left" ? -1 : 1)];
      if (target2) next2 = target2;
    } else {
      const laneKeys = [...new Set(ordered.map((it2) => it2.laneKey))];
      const laneIdx = laneKeys.indexOf(cur.laneKey);
      const targetLane = laneKeys[laneIdx + (dir === "up" ? -1 : 1)];
      if (targetLane) {
        const cand = ordered.filter((it2) => it2.laneKey === targetLane);
        next2 = cand.reduce((best, it2) => Math.abs(minutes(it2) - minutes(cur)) < Math.abs(minutes(best) - minutes(cur)) ? it2 : best, cand[0]);
      }
    }
    if (next2 && next2.sessionId !== cur.sessionId) {
      setSelectedId(next2.sessionId);
      focusCard(next2.sessionId);
    }
  }, [ordered, selectedId, focusCard]);
  const openSession = reactExports.useCallback((item) => {
    if (item.sessionDeleted) return;
    openFullConversation(item.sessionId);
    onNavigate?.();
  }, [onNavigate]);
  const clearMulti = reactExports.useCallback(() => setMulti([]), []);
  const toggleMulti = reactExports.useCallback((id2) => {
    setMulti((prev) => prev.includes(id2) ? prev.filter((x2) => x2 !== id2) : [...prev, id2]);
  }, []);
  const onMutated = reactExports.useCallback(() => {
    clearMulti();
    refresh2();
  }, [clearMulti, refresh2]);
  const runAction = reactExports.useCallback(async (fn) => {
    setActionBusy(true);
    setActionError(null);
    const res = await fn();
    setActionBusy(false);
    if (res.ok) {
      onMutated();
      return true;
    }
    setActionError(res.error ?? "failed");
    return false;
  }, [onMutated]);
  const laneOptions = reactExports.useMemo(
    () => (day?.lanes ?? []).map((l2) => ({ key: l2.key, name: laneDisplayName(l2, t2) })),
    [day, t2]
  );
  const refineProgress = progress2;
  const defaultLaneKey = day?.lanes?.[0]?.key ?? "other";
  const openAddManual = reactExports.useCallback(() => setDialog({ mode: "manual", laneKey: defaultLaneKey }), [defaultLaneKey]);
  const submitEntry = reactExports.useCallback(async (payload) => {
    if (!dialog) return;
    const ok2 = await runAction(() => dialog.mode === "merge" ? merge({ date: date2, targetKeys: multi, title: payload.title }) : addEntry({
      date: date2,
      laneKey: payload.laneKey,
      title: payload.title,
      summary: payload.summary,
      status: payload.status,
      startAt: payload.startAt,
      endAt: payload.endAt
    }));
    if (ok2) setDialog(null);
  }, [dialog, multi, date2, runAction]);
  const onKeyDown = (e3) => {
    if (isEditable(e3.target)) return;
    const k2 = e3.key;
    if (k2 === "Escape") {
      if (drawerId) {
        setDrawerId(null);
        focusCard(selectedId);
        return;
      }
      e3.target?.blur?.();
      return;
    }
    if (k2 === "[") {
      e3.preventDefault();
      useDailyBoardNav.getState().open(shiftDateKey(date2, -1));
      return;
    }
    if (k2 === "]") {
      e3.preventDefault();
      if (!isToday) useDailyBoardNav.getState().open(shiftDateKey(date2, 1));
      return;
    }
    if (k2 === "t" || k2 === "T") {
      e3.preventDefault();
      useDailyBoardNav.getState().open(todayKey());
      return;
    }
    if (k2 === "r" || k2 === "R") {
      e3.preventDefault();
      if (!generating2) generate();
      return;
    }
    if (k2 === "/") {
      e3.preventDefault();
      searchRef.current?.focus();
      return;
    }
    if (k2 === "o" || k2 === "O") {
      if (selectedItem) openSession(selectedItem);
      return;
    }
    if (k2 === "e" || k2 === "E") {
      if (selectedItem && !selectedItem.sessionDeleted && !isRemoteItem(selectedItem)) {
        setDrawerId(selectedItem.sessionId);
        setEditNonce((n2) => n2 + 1);
      }
      return;
    }
    if (k2 === "ArrowLeft") {
      e3.preventDefault();
      moveSelection("left");
      return;
    }
    if (k2 === "ArrowRight") {
      e3.preventDefault();
      moveSelection("right");
      return;
    }
    if (k2 === "ArrowUp") {
      e3.preventDefault();
      moveSelection("up");
      return;
    }
    if (k2 === "ArrowDown") {
      e3.preventDefault();
      moveSelection("down");
      return;
    }
  };
  const showFailed = error2 != null || day?.lastRun?.status === "failed";
  const failureText = error2 ?? day?.lastRun?.error ?? "";
  const stale = isToday ? day?.staleCount ?? 0 : 0;
  const body = () => {
    if (loading2 && !day) return /* @__PURE__ */ jsxRuntimeExports.jsx(DailyBoardSkeleton, {});
    if (!day) return /* @__PURE__ */ jsxRuntimeExports.jsx(DailyBoardEmpty, { titleKey: "state.noSnapshot", actionLabel: t2("toolbar.generate"), onAction: () => generate(), busy: generating2, onAddManual: openAddManual });
    if (!day.hasSnapshot && !isToday) {
      return /* @__PURE__ */ jsxRuntimeExports.jsx(DailyBoardEmpty, { titleKey: "state.noSnapshot", actionLabel: t2("toolbar.generate"), onAction: () => generate(), busy: generating2, onAddManual: openAddManual });
    }
    if (items.length === 0) return /* @__PURE__ */ jsxRuntimeExports.jsx(DailyBoardEmpty, { titleKey: "state.emptyTitle", hintKey: "state.emptyHint", onAddManual: openAddManual });
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("min-h-0 flex-1 flex-col", view2 === "timeline" ? "flex" : "hidden", "print:hidden"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        DailyBoardTimeline,
        {
          day,
          items: filtered,
          nowMin,
          isToday,
          selectedId,
          onSelect: setSelectedId,
          onOpen: (it2) => setDrawerId(it2.sessionId),
          onAnswer: openSession,
          multiSelectedIds: multi,
          onToggleMulti: toggleMulti,
          onAddEntry: (laneKey) => setDialog({ mode: "manual", laneKey }),
          showDeviceTag
        }
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("min-h-0 flex-1 flex-col", view2 === "list" ? "flex" : "hidden", "print:flex"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        DailyBoardList,
        {
          day,
          items: filtered,
          onOpen: (it2) => setDrawerId(it2.sessionId),
          onAnswer: openSession,
          multiSelectedIds: multi,
          onToggleMulti: toggleMulti,
          onAddEntry: (laneKey) => setDialog({ mode: "manual", laneKey }),
          showDeviceTag
        }
      ) })
    ] });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { ref: rootRef, className: "relative flex h-full min-h-0 flex-col bg-bg-primary", "data-daily-board-view": true, onKeyDown, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      DailyBoardToolbar,
      {
        date: date2,
        hasSnapshot: !!day?.hasSnapshot,
        generating: generating2,
        lastRun: day?.lastRun ?? null,
        onPickDate: (d2) => useDailyBoardNav.getState().open(d2),
        onGenerate: generate
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(DailyBoardSchedulePrompt, { active: day?.lastRun?.trigger === "manual" }),
    day?.modelAssigned === false ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { role: "status", className: "flex shrink-0 items-center gap-2 border-b border-accent-yellow/30 bg-accent-yellow/10 px-4 py-1.5 text-xs text-text-secondary", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "min-w-0 flex-1 truncate", children: t2("state.noModel") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "shrink-0 rounded px-1.5 text-accent-blue hover:underline", onClick: () => {
        window.dispatchEvent(new CustomEvent("open-settings-tab", { detail: "daily-board" }));
        onNavigate?.();
      }, children: t2("state.assignModel") })
    ] }) : null,
    day?.lastRun?.status === "partial" && !showFailed ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { role: "alert", className: "flex shrink-0 items-center gap-2 border-b border-accent-red/30 bg-accent-red/10 px-4 py-1.5 text-xs text-accent-red", "data-daily-partial": true, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "h-3.5 w-3.5", "aria-hidden": true }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "min-w-0 flex-1 truncate", children: t2("state.partialFailed") }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "inline-flex items-center gap-1 rounded px-1.5 hover:underline", onClick: generate, disabled: generating2, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "h-3 w-3", "aria-hidden": true }),
        t2("state.retry")
      ] })
    ] }) : null,
    refineProgress ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { role: "status", className: "flex shrink-0 items-center gap-2 border-b border-border/60 bg-bg-secondary px-4 py-1.5 text-xs text-text-secondary", "data-daily-refine-progress": true, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-3.5 w-3.5 animate-spin", "aria-hidden": true }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "min-w-0 flex-1 truncate", children: t2("state.generating", { done: refineProgress.done, total: refineProgress.total }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "shrink-0 rounded px-1.5 text-accent-blue hover:underline", onClick: () => void cancelRefine({ date: date2 }), children: t2("state.cancel") })
    ] }) : null,
    multi.length >= 2 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { role: "status", className: "flex shrink-0 items-center gap-2 border-b border-accent-green/30 bg-accent-green/10 px-4 py-1.5 text-xs text-text-secondary", "data-daily-merge-bar": true, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "min-w-0 flex-1 truncate", children: t2("edit.selected", { count: multi.length }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "shrink-0 rounded px-1.5 text-accent-blue hover:underline disabled:opacity-40", disabled: actionBusy, onClick: () => setDialog({ mode: "merge", laneKey: defaultLaneKey }), children: t2("edit.merge") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "shrink-0 rounded px-1.5 text-text-muted hover:underline", onClick: clearMulti, children: t2("state.cancel") })
    ] }) : null,
    actionError ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { role: "alert", className: "shrink-0 border-b border-accent-red/30 bg-accent-red/10 px-4 py-1.5 text-xs text-accent-red", children: t2("state.failedWith", { message: actionError }) }) : null,
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      DailyBoardHeader,
      {
        kpis,
        summary: day?.digest?.summary ?? "",
        collapsed: collapsed2,
        onToggleCollapsed: () => setCollapsed((v2) => {
          const next2 = !v2;
          try {
            localStorage.setItem(HEADER_COLLAPSED_KEY, next2 ? "1" : "0");
          } catch {
          }
          return next2;
        }),
        activeStatus: filter2.status,
        onlyWait: filter2.onlyWait,
        onPickStatus: (target2) => setFilter((f2) => {
          if (target2 === "all") return { ...f2, status: "all", onlyWait: false };
          const isSame = (f2.onlyWait ? "wait" : f2.status) === target2;
          return { ...f2, status: isSame ? "all" : target2, onlyWait: false };
        })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      DailyBoardFilters,
      {
        lanes: day?.lanes ?? [],
        filter: filter2,
        onChange: setFilter,
        view: view2,
        onViewChange: setManualView,
        searchRef,
        devices: deviceFilterOptions
      }
    ),
    showFailed ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { role: "alert", className: "flex shrink-0 items-center gap-2 border-b border-accent-red/30 bg-accent-red/10 px-4 py-1.5 text-xs text-accent-red", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "h-3.5 w-3.5", "aria-hidden": true }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "min-w-0 flex-1 truncate", children: failureText ? t2("state.failedWith", { message: failureText }) : t2("state.failed") }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "inline-flex items-center gap-1 rounded px-1.5 hover:underline", onClick: generate, disabled: generating2, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "h-3 w-3", "aria-hidden": true }),
        t2("state.retry")
      ] })
    ] }) : null,
    stale > 0 && !showFailed ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex shrink-0 items-center gap-2 border-b border-border/60 bg-accent-blue/10 px-4 py-1.5 text-xs text-text-secondary", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "min-w-0 flex-1 truncate", children: t2("state.stale", { count: stale }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "rounded px-1.5 text-accent-blue hover:underline", onClick: refresh2, children: t2("state.refresh") })
    ] }) : null,
    body(),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex shrink-0 items-center justify-between gap-3 border-t border-border/70 bg-bg-secondary px-4 py-1.5 text-[11px] text-text-muted", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { "data-daily-footer-aggregate": true, children: day?.aggregate ? aggregateFooterText(day.aggregate, t2, i18n.language) : `${t2("footer.localOnly")} · ${t2("footer.source")}` }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-2.5 w-2.5 rounded-sm bg-accent-green", "aria-hidden": true }),
          t2("legend.done")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-2.5 w-2.5 rounded-sm bg-accent-blue", "aria-hidden": true }),
          t2("legend.doing")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-2.5 w-2.5 rounded-sm bg-accent-yellow", "aria-hidden": true }),
          t2("legend.wait")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(STATUS_META.done.icon, { className: "h-3 w-3", "aria-hidden": true }),
          "· ? ",
          t2("card.lowConfidence")
        ] })
      ] })
    ] }),
    drawerItem ? /* @__PURE__ */ jsxRuntimeExports.jsx(
      DailyBoardDrawer,
      {
        item: drawerItem,
        date: date2,
        laneOptions,
        editNonce,
        onClose: () => {
          setDrawerId(null);
          focusCard(selectedId);
        },
        onOpenSession: openSession,
        onAnswer: openSession,
        onMutated
      }
    ) : null,
    dialog ? /* @__PURE__ */ jsxRuntimeExports.jsx(
      DailyBoardEntryDialog,
      {
        mode: dialog.mode,
        laneKey: dialog.laneKey,
        laneOptions: laneOptions.length > 0 ? laneOptions : [{ key: "other", name: t2("lane.other") }],
        memberCount: multi.length,
        busy: actionBusy,
        onClose: () => setDialog(null),
        onSubmit: (payload) => void submitEntry(payload)
      }
    ) : null
  ] });
}
function minutes(item) {
  if (!item.firstAt) return 0;
  const d2 = new Date(item.firstAt);
  return Number.isFinite(d2.getTime()) ? d2.getHours() * 60 + d2.getMinutes() : 0;
}
function aggregateFooterText(agg, t2, locale2) {
  const parts = [t2("footer.aggregated", { count: agg.online.length })];
  if (agg.stale.length > 0) {
    parts.push(t2("footer.staleSnapshot", { count: agg.stale.length, time: formatClock(agg.stale[0].fetchedAt, locale2) }));
  }
  if (agg.failed.length > 0) parts.push(t2("footer.failedCount", { count: agg.failed.length }));
  return parts.join(" · ");
}
function DailyBoardModal() {
  const { t: t2 } = useTranslation("dailyBoard");
  const open = useDailyBoardNav((s2) => s2.modalOpen);
  const close2 = useDailyBoardNav((s2) => s2.close);
  reactExports.useEffect(() => {
    if (!open) return;
    const onKey = (e3) => {
      if (e3.key !== "Escape" || e3.defaultPrevented) return;
      const root2 = document.querySelector("[data-daily-board-modal]");
      if (root2 && root2.contains(document.activeElement)) return;
      close2();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close2]);
  if (!open) return null;
  return reactDomExports.createPortal(
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {zIndex:90}, className: "fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4 sm:p-8", onMouseDown: (e3) => {
      if (e3.target === e3.currentTarget) close2();
    }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        role: "dialog",
        "aria-modal": "true",
        "aria-label": t2("section.title"),
        "data-daily-board-modal": true,
        className: "relative flex h-full max-h-[920px] w-full max-w-[1480px] flex-col overflow-hidden rounded-xl border border-border bg-bg-primary shadow-2xl",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex shrink-0 items-center justify-between border-b border-border px-4 py-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-text-primary", children: t2("section.title") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: close2, "aria-label": t2("modal.close"), title: t2("modal.close"), className: "rounded p-1 text-text-secondary hover:bg-bg-hover hover:text-text-primary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X$1, { className: "h-4 w-4", "aria-hidden": true }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-0 flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx(DailyBoardView, { onNavigate: close2 }) })
        ]
      }
    ) }),
    document.body
  );
}
return {WebLlmSettingsSection,WebLlmPendingBar,DailyBoardModal,openDailyBoard};
}
