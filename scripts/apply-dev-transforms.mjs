import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { removeOfficialCloud } from './remove-official-cloud.mjs';
import { patchClaudeEffort } from './patch-claude-effort.mjs';
import { patchLocalResponsiveness, patchRuntimePorts } from './patch-local-responsiveness.mjs';
import { patchSkillMarketMain, patchSkillMarketRenderer } from './patch-skill-market.mjs';
import { patchReliabilityMain, patchReliabilityRenderer } from './patch-reliability.mjs';
import { patchFileLinksMain, patchFileLinksRenderer, patchFileLinksPreload } from './patch-file-links.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mainFile = path.join(root, 'src/main/index.js');
const fileLinksPreload = path.join(root, 'src/preload/index.js');
fs.writeFileSync(fileLinksPreload, patchFileLinksPreload(fs.readFileSync(fileLinksPreload, 'utf8')));
let main = fs.readFileSync(mainFile, 'utf8');
function once(source, from, to, label) {
  if (source.includes(to)) return source;
  if (source.includes('/* local edition: cloud UI removed */') && label === 'local account menu') return source;
  if (source.includes('const M5e=require("./extensions/local-identity.cjs").LocalIdentityService;') && ['OAuth callback', 'LocalAuth listener', 'LocalAuth log', 'local execution gates', 'OAuth token endpoint protection', 'meeting endpoint protection', 'meeting websocket protection'].includes(label)) return source;
  if (source.split(from).length !== 2) throw new Error('Upstream layout changed: ' + label);
  return source.replace(from, to);
}
main = once(main, '"http://127.0.0.1:19210/auth/oauth/callback"', '`http://127.0.0.1:${require("./runtime/config.cjs").createConfig(require("path").resolve(__dirname,"../..")).localAuthPort}/auth/oauth/callback`', 'OAuth callback');
main = once(main, 'this["server"][\'listen\'](0x4b0a,"127.0.0.1",()=>{})', 'this["server"][\'listen\'](require("./runtime/config.cjs").createConfig(require("path").resolve(__dirname,"../..")).localAuthPort,"127.0.0.1",()=>{})', 'LocalAuth listener');
main = once(main, '"[LocalAuthServer] Port 19210 in use, skipping"', '"[LocalAuthServer] Development callback port is in use"', 'LocalAuth log');
main = once(main, 'const nYt="claudeops://",oYt="shineai://";', 'const nYt="claudeops-dev://",oYt="shineai-dev://";', 'deep link constants');
main = main.replaceAll('["setAsDefaultProtocolClient"]("claudeops"', '["setAsDefaultProtocolClient"]("claudeops-dev"').replaceAll('["setAsDefaultProtocolClient"]("shineai"', '["setAsDefaultProtocolClient"]("shineai-dev"');
// The community parser is separate from the OS dispatch function.
main = once(main, 'function k9(a02){const bPR=a7z;if(!a02["startsWith"]("claudeops://"))return null;const a03=a02["slice"](0xc)', 'function k9(a02){const bPR=a7z;if(!a02["startsWith"]("claudeops-dev://"))return null;const a03=a02["slice"]("claudeops-dev://".length)', 'community deep-link parser');
main = once(main, 'if(a0F&&a0F["startsWith"](nYt))return a0F;', 'if(a0F&&(a0F["startsWith"](nYt)||a0F["startsWith"](oYt)))return a0F;', 'initial deep-link dispatch');
main = once(main, 'lYt(a0i);', 'a0i.startsWith(oYt)?cYt(a0i):lYt(a0i);', 'initial protocol routing');
main = once(main, '["validate"](a02,a03,a04){const bNf=a7z,a05=U6(a02);', '["validate"](a02,a03,a04){this["refreshTrustedRoots"]();const bNf=a7z,a05=U6(a02);', 'refresh registered workspace permissions');
main = once(main, '"provider:get-all",async()=>{const bzB=bzA;try{return a03["getAllProviders"]();', '"provider:get-all",async()=>{const bzB=bzA;try{require("./extensions/provider-defaults.cjs").initializeProviderDefaults(a03,a02.authService);return a03["getAllProviders"]();', 'local provider defaults');
// Codex traffic uses the Responses API. For bare gateway origins, infer its /v1 base.
main = once(main, 'async function JY(a02,a03){', 'async function JY(a02,a03,a0y=!0x1){', 'Codex probe mode');
{
  const start = main.indexOf('async function JY(');
  const end = main.indexOf('async function ZY(', start);
  if (start < 0 || end < start) throw new Error('Upstream layout changed: Codex probe body');
  let probe = main.slice(start, end);
  probe = once(probe, 'a0a=Date["now"]();try{', 'a0a=Date["now"]();if(!a0y)try{', 'skip Chat Completions in Codex probe');
  const responseStart = probe.indexOf('const a0b=Date["now"]();');
  if (responseStart < 0) throw new Error('Upstream layout changed: Responses probe');
  let responses = probe.slice(responseStart);
  responses = once(responses, 'a0o=setTimeout(()=>a0n["abort"](),RY)', 'a0o=setTimeout(()=>a0n["abort"](),a0y?0x9c40:RY)', 'Codex probe response timeout');
  responses = once(responses, "'max_output_tokens':0x10})", "'max_output_tokens':0x10,...(a0y?{'stream':!0x0}:{})})", 'Codex streaming probe');
  // Upgrade the previous header-only probe as well as a fresh upstream baseline.
  const validatedProbe = "let a0t=a06;if(a0y)a0t=await require('./extensions/codex-endpoint.cjs').readCodexProbeResponse(a0p,a06,Math.max(1,40000-(Date.now()-a0b)));else try{";
  responses = responses.replace("let a0t=a06;if(a0y)await a0p['body']?.['cancel']?.();else try{", validatedProbe);
  if (!responses.includes("let a0t=a06;if(a0y)a0t=await require('./extensions/codex-endpoint.cjs').readCodexProbeResponse(")) responses = once(responses, 'let a0t=a06;try{', validatedProbe, 'Codex probe validates response content');
  responses = once(responses, 'catch(a0v){const a0w=', 'catch(a0v){if(a0y&&a0v?.code===\"CODEX_PROBE_FAILED\")return WY({success:false,status:\"config_error\",category:\"http\",scope:\"provider-config\",httpStatus:200,responseStarted:true,retrySafe:false,message:LY(a0v.message,a05),latencyMs:Date.now()-a0b},a02,a03);const a0w=', 'Codex streaming errors remain failures');
  responses = once(responses, "{'seconds':0xa,'host':UY(a07)}", "{'seconds':a0y?0x28:0xa,'host':UY(a07)}", 'Codex probe timeout detail');
  main = main.slice(0, start) + probe.slice(0, responseStart) + responses + main.slice(end);
}
main = once(main, 'case "codex-appserver":a05=await JY(a04,"https://api.openai.com/v1");break;', 'case "codex-appserver":a05=await JY({...a04,apiBaseUrl:require("./extensions/codex-endpoint.cjs").normalizeCodexBaseUrl(a04.apiBaseUrl)},"https://api.openai.com/v1",!0x0);break;', 'Codex Responses probe and API base');
main = once(main, 'this["createImageGenProxy"](a02,a03["apiBaseUrl"],a0f)', 'this["createImageGenProxy"](a02,require("./extensions/codex-endpoint.cjs").normalizeCodexBaseUrl(a03["apiBaseUrl"]),a0f)', 'Codex image proxy API base');
main = once(main, 'const a0U=(a0g||a03["apiBaseUrl"])', 'const a0U=require("./extensions/codex-endpoint.cjs").normalizeCodexBaseUrl(a0g||a03["apiBaseUrl"])', 'Codex session API base');
main = once(main, `const a0z=a0a['replace']`, `const a0z=require("./extensions/codex-endpoint.cjs").normalizeCodexBaseUrl(a0a)['replace']`, 'Codex generated config API base');
const routingCleanupStart = 'else a0R=a0R["replace"](/^\\s*openai_base_url';
const routingCleanupEnd = 'a0R!==a0S&&ve["writeFileSync"](a0N,a0R,"utf-8");';
const routingReplacement = 'else a0R=require("./extensions/codex-routing.cjs").restoreFromUserHome(a0R,IT());';
if (!main.includes(routingReplacement)) {
  const start = main.indexOf(routingCleanupStart), end = main.indexOf(routingCleanupEnd, start);
  if (start < 0 || end < start) throw new Error('Upstream layout changed: Codex routing inheritance');
  main = main.slice(0, start) + routingReplacement + main.slice(end);
}
main = once(main, '["getLegacyConfigPath"](){const cyd=a7z;try{', '["getLegacyConfigPath"](){/* dev isolation: no migration from official profiles */ return null; const cyd=a7z;try{', 'legacy profile');
main = once(main, 'a05!==a03[0x0]&&a03["push"](a05);', '/* dev isolation: no sibling official data-path fallback */', 'skill profile');
main = once(main, '["getUserPlan"](){const gBM=a7z;', '["getUserPlan"](){/* Local development capabilities; no hosted tokens or subscriptions. */ return "ultra"; const gBM=a7z;', 'local execution gates');
main = once(main, '["handleRequest"](a02,a03){const gD6=a7z,', '["handleRequest"](a02,a03){if(!require("./security/service-access.cjs").protectHttp("localAuth",a02,a03))return;const gD6=a7z,', 'OAuth token endpoint protection');
main = once(main, 'async["_handleRequest"](a02,a03){const hJw=a7z,', 'async["_handleRequest"](a02,a03){if(!require("./security/service-access.cjs").protectHttp("meeting",a02,a03))return;const hJw=a7z,', 'meeting endpoint protection');
main = once(main, "'path':\"/meeting/events\"}", "'path':\"/meeting/events\",'verifyClient':require(\"./security/service-access.cjs\").verifyMeetingSocket}", 'meeting websocket protection');
// Sandboxed preloads use only Electron and the supported os module.
main = main.replace(/(["']sandbox["']\s*:\s*)!0x1/g, '$1!0x0');
fs.writeFileSync(mainFile, patchFileLinksMain(patchReliabilityMain(patchSkillMarketMain(patchRuntimePorts(patchLocalResponsiveness(patchClaudeEffort(main)))))));
const rendererFile = path.join(root, 'src/renderer/assets/index-0LVJEr5c.js');
let renderer = fs.readFileSync(rendererFile, 'utf8');
renderer = once(renderer, 'const TEST_WATCHDOG_MS = 12e3;', 'const TEST_WATCHDOG_MS = 12e3;\nconst CODEX_TEST_WATCHDOG_MS = 45e3;', 'Codex UI probe timeout');
renderer = once(renderer, 'watchdogTimeout: "Test timed out: save your changes before testing, or check the proxy"', 'watchdogTimeout: "The provider did not respond in time. Check its API address, network, or proxy."', 'English provider timeout guidance');
renderer = once(renderer, 'watchdogTimeout: "测连超时：先保存当前改动再测，或检查代理"', 'watchdogTimeout: "服务商响应超时，请检查 API 地址、网络或代理。"', 'Chinese provider timeout guidance');
{
  const start = renderer.indexOf('function useProviderTesting(');
  const end = renderer.indexOf('function needsV1Suggestion(', start);
  if (start < 0 || end < start) throw new Error('Upstream layout changed: provider testing UI');
  let testing = renderer.slice(start, end);
  const needle = '}, TEST_WATCHDOG_MS);';
  if (testing.includes(needle)) {
    let count = 0;
    testing = testing.replaceAll(needle, () => {
      count += 1;
      return count === 1
        ? '}, adapterType === "codex-appserver" ? CODEX_TEST_WATCHDOG_MS : TEST_WATCHDOG_MS);'
        : '}, normalizeProviderAdapterType(provider2.adapterType, "openai-api") === "codex-appserver" ? CODEX_TEST_WATCHDOG_MS : TEST_WATCHDOG_MS);';
    });
    if (count !== 2) throw new Error('Upstream layout changed: provider testing watchdogs');
  }
  renderer = renderer.slice(0, start) + testing + renderer.slice(end);
}
renderer = once(renderer, 'const LOGIN_SKIPPED_STORAGE_KEY = "shineai_login_skipped";', `const LOCAL_DEV_USER = Object.freeze({ id: "local-development", email: "", displayName: "本地开发用户（非官方会员）", plan: "ultra", planExpiresAt: null, remoteSub: "none", remoteSubExpiresAt: null, remoteSubMaxDevices: 0, emailVerified: false, authProvider: "local-development" });\nconst getLocalDevUser = () => ({ ...LOCAL_DEV_USER });\nconst LOGIN_SKIPPED_STORAGE_KEY = "shineai_login_skipped";`, 'local identity');
renderer = once(renderer, 'const applyUserState = (user2, set2) => {\n  if (user2)', 'const applyUserState = (user2, set2) => {\n  user2 = user2 || getLocalDevUser();\n  if (user2)', 'auth fallback');
renderer = once(renderer, '        user: user2,\n        telemetryEnabled: telemetryState.enabled,', '        user: user2 || getLocalDevUser(),\n        telemetryEnabled: telemetryState.enabled,', 'auth initialization');
renderer = once(renderer, '        canUseChat: resolveCanUseChat(user2),\n        showLoginOverlay: !user2,', '        canUseChat: true,\n        showLoginOverlay: false,', 'local chat access');
renderer = once(renderer, '        user: null,\n        telemetryEnabled: readTelemetryEnabled(),\n        telemetrySyncMode: "local",\n        canUseChat: false,\n        showLoginOverlay: true,', '        user: getLocalDevUser(),\n        telemetryEnabled: readTelemetryEnabled(),\n        telemetrySyncMode: "local",\n        canUseChat: true,\n        showLoginOverlay: false,', 'offline initialization');
renderer = once(renderer, '    set2({ showLoginOverlay: false });\n  },\n  upgradePlan:', '    set2({ user: getLocalDevUser(), canUseChat: true, showLoginOverlay: false });\n  },\n  upgradePlan:', 'skip login');
// Hosted relay access must never follow the local capability label.
renderer = once(renderer, 'function hasRemoteSubAccess(plan2, remoteSub, remoteSubExpiresAt) {', 'function hasRemoteSubAccess(plan2, remoteSub, remoteSubExpiresAt) {\n  if (useAuthStore.getState().user?.id === "local-development") return false;', 'hosted relay boundary');
renderer = once(renderer, '}));\nfunction useIsPro() {', '}));\nwindow.addEventListener("shineai:official-login", () => useAuthStore.getState().openLoginOverlay());\nfunction useIsPro() {', 'optional hosted login entry');
renderer = once(renderer, '  const handleOpen = reactExports.useCallback(() => {\n    cancelClose();\n    setOpen(true);\n  }, [cancelClose]);', '  const handleOpen = reactExports.useCallback(() => {\n    if (useAuthStore.getState().user?.id === "local-development") { useAuthStore.getState().openLoginOverlay(); return; }\n    cancelClose();\n    setOpen(true);\n  }, [cancelClose]);', 'local account menu');
renderer = once(renderer, 'const planLabelMap$1 = {\n  free: "Free",\n  pro: "Pro",\n  ultra: "Ultra",', 'const planLabelMap$1 = {\n  free: "Free",\n  pro: "Pro",\n  get ultra() { return useAuthStore.getState().user?.id === "local-development" ? "本地开发" : "Ultra"; },', 'account label');
renderer = once(renderer, '  "continue": "登录并开始",', '  "continue": "进入开发工作台",', 'development onboarding label');
fs.writeFileSync(rendererFile, patchFileLinksRenderer(patchReliabilityRenderer(patchSkillMarketRenderer(renderer))));
const preload = path.join(root, 'src/preload/index.js');
let preloadCode = fs.readFileSync(preload, 'utf8').replace('require("i18next");', '// Sandboxed preload: unused i18next side effect removed.');
if (!preloadCode.includes('const __devPreloadInfo')) preloadCode = preloadCode.replace('const electron = require("electron");', 'const electron = require("electron");\nconst __devPreloadInfo = electron.ipcRenderer.sendSync("dev:preload-info");\nif (!__devPreloadInfo) throw new Error("Development preload origin was rejected");');
preloadCode = preloadCode.replace('getCwd: () => process.cwd()', 'getCwd: () => __devPreloadInfo.cwd').replace('getHomePath: () => require("os").homedir()', 'getHomePath: () => __devPreloadInfo.home');
if (!preloadCode.includes('exposeInMainWorld("development"')) preloadCode += '\nelectron.contextBridge.exposeInMainWorld("development", { getRuntimeInfo: () => electron.ipcRenderer.invoke("dev:runtime-info"), getServiceAccess: () => electron.ipcRenderer.invoke("dev:service-access") });\n';
preloadCode = preloadCode.replace('getRuntimeInfo: () => electron.ipcRenderer.invoke("dev:runtime-info") });', 'getRuntimeInfo: () => electron.ipcRenderer.invoke("dev:runtime-info"), getServiceAccess: () => electron.ipcRenderer.invoke("dev:service-access") });');
fs.writeFileSync(preload, preloadCode);
const html = path.join(root, 'src/renderer/index.html');
let htmlCode = fs.readFileSync(html, 'utf8').replace('<title>ShineAI</title>', '<title>ShineAI 1.0.6</title>');
if (!htmlCode.includes('dev-edition-banner')) htmlCode = htmlCode.replace('<div id="root"></div>', '<div id="root"></div>\n    <div id="dev-edition-banner" style="position:fixed;bottom:4px;right:8px;z-index:2147483640;font-size:11px;pointer-events:none;color:#8ab4f8;background:#101827d9;padding:3px 8px;border-radius:5px">本地开发版 1.0.6 · AI 需自备账号或 API Key · 官方云服务需真实登录</div>');
fs.writeFileSync(html, htmlCode);
console.log('Applied isolated development configuration, local identity and sandbox transforms');
removeOfficialCloud();
await import('./patch-appearance.mjs').then(module => module.patchAppearance());
await import('./patch-workbench.mjs').then(module => module.patchWorkbench());
await import('./patch-editor-runtime.mjs').then(module => module.patchEditorRuntimeFiles());
await import('./patch-task-notifications.mjs').then(module => module.patchTaskNotificationFiles());
const usability = await import('./patch-usability.mjs');
fs.writeFileSync(mainFile, usability.patchUsabilityMain(fs.readFileSync(mainFile,'utf8')));
fs.writeFileSync(rendererFile, usability.patchUsabilityRenderer(fs.readFileSync(rendererFile,'utf8')));
fs.writeFileSync(preload, usability.patchUsabilityPreload(fs.readFileSync(preload,'utf8')));
await import('./patch-webapp-testing.mjs').then(module => module.patchWebappTestingFiles());
await import('./patch-execution-experience.mjs').then(module => module.patchExecutionFiles());
await import('./patch-startup-screen.mjs').then(module => module.patchStartupFiles());
await import('./patch-running-input.mjs').then(module => module.patchRunningInputFiles());
await import('./patch-diagram-viewer.mjs').then(module => module.patchDiagramViewerFiles());
await import('./patch-background-tools.mjs').then(module => module.patchBackgroundFiles());
await import('./patch-butler-overview.mjs').then(module => module.patchButlerFiles());
await import('./patch-pet-persona.mjs').then(module => module.patchPetFiles());
await import('./patch-memory-context.mjs').then(module => module.patchMemoryContextFiles());
await import('./patch-browser-input.mjs').then(module => module.patchBrowserInputFiles());
await import('./patch-chat-images.mjs').then(module => module.patchChatImagesFiles());
