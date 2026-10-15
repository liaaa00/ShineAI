import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { parse } = createRequire(path.join(root, '.runtime/package.json'))('acorn');
const { simple } = createRequire(path.join(root, '.runtime/package.json'))('acorn-walk');
export function removeOfficialCloud() {
  const mainFile = path.join(root, 'src/main/index.js');
  let main = fs.readFileSync(mainFile, 'utf8');
  const replacements = new Map([
    ['M5e', 'require("./extensions/local-identity.cjs").LocalIdentityService'],
    ...['R5e', 'N5e', 'F5e', 'rVt', 'sVt'].map(name => [name, 'require("./extensions/removed-cloud-services.cjs").RemovedCloudService']),
    ['_Gt', 'require("./extensions/removed-cloud-services.cjs").RemovedUpdater'],
  ]);
  const edits = [];
  const syntax = parse(main, { ecmaVersion: 'latest', sourceType: 'script' });
  for (const [name, expression] of replacements) {
    const declaration = syntax.body.find(node => node.type === 'ClassDeclaration' && node.id?.name === name);
    const replacement = `const ${name}=${expression};`;
    if (declaration) edits.push({ start: declaration.start, end: declaration.end, text: replacement });
    else if (!main.includes(replacement)) throw new Error('Unknown published cloud service layout: ' + name);
  }
  for (const edit of edits.sort((a, b) => b.start - a.start)) main = main.slice(0, edit.start) + edit.text + main.slice(edit.end);
  fs.writeFileSync(mainFile, main);
  const rendererFile = path.join(root, 'src/renderer/assets/index-0LVJEr5c.js');
  let renderer = fs.readFileSync(rendererFile, 'utf8');
  if (!renderer.includes('/* local edition: cloud UI removed */')) {
    const ast = parse(renderer, { ecmaVersion: 'latest', sourceType: 'module' });
    const uiEdits = [];
    for (const name of ['UserMenu', 'MeetingPanel', 'SessionShareDialog']) {
      const node = ast.body.find(node => node.type === 'FunctionDeclaration' && node.id?.name === name) || ast.body.flatMap(node => node.type === 'VariableDeclaration' ? node.declarations : []).find(node => node.id?.name === name)?.init;
      if (!node) throw new Error('Unknown published component: ' + name);
      const body = name === 'UserMenu' ? 'return jsxRuntimeExports.jsx("div", { title: "本地开发身份，无需官方账号", "data-local-identity": true, className: "px-2 py-2 text-xs text-accent-blue", children: "本地" });' : 'return null;';
      uiEdits.push({ start: node.body.start, end: node.body.end, text: '{' + body + '}' });
    }
    const nav = ast.body.flatMap(node => node.type === 'VariableDeclaration' ? node.declarations : []).find(node => node.id?.name === 'buildNavCategories');
    if (!nav || nav.init.body.type !== 'ArrayExpression') throw new Error('Unknown settings navigation layout');
    uiEdits.push({ start: nav.init.body.end, end: nav.init.body.end, text: '.map(category => ({ ...category, subTabs: category.subTabs.filter(tab => !["account", "plan", "promoter", "relay", "devices", "feedback", "model-store"].includes(tab.id)) })).filter(category => category.subTabs.length > 0)' });
    const commands = ast.body.flatMap(node => node.type === 'VariableDeclaration' ? node.declarations : []).find(node => node.id?.name === 'WORKSPACE_ITEMS');
    if (!commands || commands.init.type !== 'ArrayExpression') throw new Error('Unknown command palette layout');
    uiEdits.push({ start: commands.init.end, end: commands.init.end, text: '.filter(item => !["org", "chat", "devices"].includes(item.id))' });
    for (const edit of uiEdits.sort((a, b) => b.start - a.start)) renderer = renderer.slice(0, edit.start) + edit.text + renderer.slice(edit.end);
    function replace(from, to, label) {
      if (renderer.split(from).length !== 2) throw new Error('Unknown renderer layout: ' + label);
      renderer = renderer.replace(from, to);
    }
    replace('openLoginOverlay: () => set2({ showLoginOverlay: true })', 'openLoginOverlay: () => set2({ showLoginOverlay: false })', 'login overlay');
    replace('setShowLoginOverlay: (show) => set2({ showLoginOverlay: show })', 'setShowLoginOverlay: () => set2({ showLoginOverlay: false })', 'legacy login overlay');
    replace('const MORE_WORKSPACES = ["knowledge", "experts", "teams", "workflow", "org", "design", "analytics", "devices"];', 'const MORE_WORKSPACES = ["knowledge", "experts", "teams", "workflow", "design", "analytics"];', 'local workspaces');
    replace('detached: orgEnabled ? detachedWorkspaces : [...detachedWorkspaces, "org"],', 'detached: [...detachedWorkspaces, "org", "chat", "devices"],', 'remove persisted cloud sidebar items');
    replace('if (mapped) return mapped;', 'if (mapped && allNavCategories.some(category => category.subTabs.some(tab => tab.id === mapped))) return mapped;', 'removed settings deep link');
    replace('function resolveSettingsNav(tab2) {\n  return tab2', 'function resolveSettingsNav(tab2) {\n  if (["account", "plan", "promoter", "relay", "devices", "feedback", "model-store"].includes(tab2)) return "providers";\n  return tab2', 'settings route fallback');
    replace('setActiveWorkspace: (workspace2) => {\n    saveActiveWorkspace(workspace2);', 'setActiveWorkspace: (workspace2) => {\n    if (["org", "chat", "devices"].includes(workspace2)) workspace2 = "workbench";\n    saveActiveWorkspace(workspace2);', 'removed workspace route fallback');
    renderer += '\n/* local edition: cloud UI removed */\n';
  }
  if (!renderer.includes('/* local edition: cloud controls removed */')) {
    const syntax = parse(renderer, { ecmaVersion: 'latest', sourceType: 'module' });
    const edits = [];
    const text = node => node ? renderer.slice(node.start, node.end) : '';
    const field = (object, name) => object?.type === 'ObjectExpression' ? object.properties.find(property => property.key?.name === name || property.key?.value === name)?.value : undefined;
    simple(syntax, {
      CallExpression(node) {
        if (node.callee.type !== 'MemberExpression' || !['jsx', 'jsxs'].includes(node.callee.property.name)) return;
        const component = node.arguments[0];
        const props = node.arguments[1];
        const title = text(field(props, 'title'));
        const click = text(field(props, 'onClick'));
        const isCloudButton = component?.value === 'button' && ['onShareSession(', 'community:publish', 'handlePublishToCommunity', 'onPublish'].some(marker => click.includes(marker));
        const isTelemetryRow = component?.name === 'SettingRow' && title.includes('general.telemetry.title');
        const isUpdateHeader = component?.name === 'SectionHeader' && title.includes('general.updates.sectionTitle');
        const isUpdateCard = component?.name === 'SettingCard' && text(props).includes('general.updates.currentVersion');
        if (isCloudButton || isTelemetryRow || isUpdateHeader || isUpdateCard) edits.push({start:node.start,end:node.end,text:'null'});
      },
      ArrayExpression(node) {
        for (const element of node.elements) {
          if (element?.type === 'ObjectExpression' && text(field(element, 'onClick')).includes('community:publish')) edits.push({start:element.start,end:element.end,text:'...[]'});
        }
      }
    });
    const dialog = syntax.body.flatMap(node => node.type === 'VariableDeclaration' ? node.declarations : []).find(node => node.id?.name === 'HtmlPublishDialog');
    if (dialog) edits.push({ start:dialog.init.body.start, end:dialog.init.body.end, text:'{ return null; }' });
    // Some controls contain smaller controls. Only replace the outermost node.
    const outer = edits.filter(edit => !edits.some(other => other !== edit && other.start <= edit.start && other.end >= edit.end));
    for (const edit of outer.sort((a,b)=>b.start-a.start)) renderer = renderer.slice(0,edit.start)+edit.text+renderer.slice(edit.end);
    renderer = renderer.replace('const EDITION_DISPLAY_NAME = "ShineAI Pro";', 'const EDITION_DISPLAY_NAME = "ShineAI 本地开发版";');
    renderer = renderer.replace('setTelemetryEnabled: async (enabled) => {', 'setTelemetryEnabled: async (enabled) => { set2({ telemetryEnabled: false, telemetrySyncMode: "local" }); return { success: true, enabled: false };');
    renderer += '\n/* local edition: cloud controls removed */\n';
    console.log(`Removed ${outer.length} cloud-only controls from the published UI.`);
  }
  fs.writeFileSync(rendererFile, renderer);
  const htmlFile = path.join(root, 'src/renderer/index.html');
  const html = fs.readFileSync(htmlFile, 'utf8').replace('本地开发版 1.0.6 · AI 需自备账号或 API Key · 官方云服务需真实登录', '本地开发版 1.0.6 · 已移除官方云服务 · AI 使用自备服务商').replace('本地开发版 1.0.6 · 已移除官方云服务', '本地开发版 1.0.6 · 全局外观版 7 · 已移除官方云服务');
  fs.writeFileSync(htmlFile, html);
  console.log('Removed hosted identity, collaboration, telemetry, meeting and updater implementations; local AI providers retained.');
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) removeOfficialCloud();
