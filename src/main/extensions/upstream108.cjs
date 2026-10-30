'use strict';

const fs = require('node:fs');
const path = require('node:path');
const electron = require('electron');
const upstream = require('../upstream108/features.cjs');
const presets = require('../upstream108/presets.cjs');
const {
  importCookies
} = require('./browser-cookies.cjs');
const {
  installWebLlmState
} = require('./web-llm-state.cjs');
const MCP_ID = 'shineai-web-llm';
function broadcast(channel, data) {
  for (const w of electron.BrowserWindow.getAllWindows()) if (!w.isDestroyed() && w.webContents.getURL().includes('/renderer/')) w.webContents.send(channel, data);
}
function configureSchema(db, directory) {
  if (!db?.prepare) throw Error('本地数据库尚未就绪。');
  const exists = db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='daily_board_runs'").get();
  if (!exists) {
    const backups = path.join(directory, 'backups');
    fs.mkdirSync(backups, {
      recursive: true
    });
    db.prepare('VACUUM INTO ?').run(path.join(backups, 'before-local108-' + Date.now() + '.sqlite'));
  }
  db.transaction(() => {
    db.exec(fs.readFileSync(path.join(__dirname, '../upstream108/schema.sql'), 'utf8'));
    for (const [table, column, type] of [['daily_board_items', 'ai_state', 'TEXT'], ['daily_board_runs', 'coverage_json', 'TEXT']]) {
      if (!db.prepare('PRAGMA table_info(' + table + ')').all().some(c => c.name === column)) db.exec('ALTER TABLE ' + table + ' ADD COLUMN ' + column + ' ' + type);
    }
    db.exec('CREATE TABLE IF NOT EXISTS shineai_workspace_order(workspace_id TEXT PRIMARY KEY, sort_order INTEGER NOT NULL)');
  })();
}
function installWorkspaceOrder(database) {
  const original = database.getAllWorkspaces.bind(database),
    db = database.getDb();
  database.getAllWorkspaces = () => {
    const rows = original(),
      order = new Map(db.prepare('SELECT workspace_id,sort_order FROM shineai_workspace_order').all().map(r => [r.workspace_id, r.sort_order]));
    return rows.sort((a, b) => (order.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (order.get(b.id) ?? Number.MAX_SAFE_INTEGER));
  };
  return ids => {
    if (!Array.isArray(ids) || ids.length > 1000 || ids.some(id => typeof id !== 'string') || new Set(ids).size !== ids.length) throw Error('工作区顺序无效。');
    const all = database.getAllWorkspaces(),
      known = new Set(all.map(w => w.id));
    if (ids.some(id => !known.has(id))) throw Error('工作区不存在，请刷新。');
    const next = [...ids, ...all.map(w => w.id).filter(id => !ids.includes(id))];
    db.transaction(() => {
      db.prepare('DELETE FROM shineai_workspace_order').run();
      const write = db.prepare('INSERT INTO shineai_workspace_order VALUES(?,?)');
      next.forEach((id, i) => write.run(id, i));
    })();
    return {
      success: true
    };
  };
}
const htmlEscape = value => String(value ?? '').replace(/[&<>"']/g, c => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
})[c]);
function renderReport(day, hidePaths) {
  const scrub = value => htmlEscape(hidePaths ? upstream.redact(String(value ?? '')).replace(/(?:[A-Z]:[\\/]|\/(?:home|Users|mnt|var|tmp)\/)[^\s<>"']+/gi, '[本地路径]') : value);
  return '<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'"><title>ShineAI 工作日报</title><style>body{font:15px/1.7 system-ui,sans-serif;color:#243247;background:#fff;margin:48px;max-width:1100px}h1{font-size:30px}article{padding:18px 0;border-top:1px solid #dce2e9;break-inside:avoid}p{white-space:pre-wrap;overflow-wrap:anywhere}small{color:#627187}.status{font-weight:600}</style><h1>ShineAI 工作日报 · ' + htmlEscape(day.date) + '</h1><p>' + scrub(day.digest?.summary || '') + '</p>' + day.items.map(item => '<article><small>' + scrub(item.laneName || '其他') + '</small><h2>' + scrub(item.title) + '</h2><span class="status">' + ({
    done: '已完成',
    doing: '进行中',
    wait: '待决策'
  }[item.status] || '待核对') + '</span><p>' + scrub(item.summary) + '</p></article>').join('');
}
async function exportReport(service, request, automatic = false) {
  if (!request || !/^\d{4}-\d{2}-\d{2}$/.test(request.date) || !['html', 'png', 'pdf'].includes(request.format)) throw Error('导出格式或日期无效。');
  const owner = electron.BrowserWindow.getFocusedWindow(),
    options = {
      defaultPath: 'ShineAI-' + request.date + '.' + request.format,
      filters: [{
        name: request.format.toUpperCase(),
        extensions: [request.format]
      }]
    };
  let selected;
  if (automatic) {
    const folder = path.join(electron.app.getPath('documents'), 'ShineAI', 'Daily reports');
    await fs.promises.mkdir(folder, {
      recursive: true
    });
    selected = {
      filePath: path.join(folder, options.defaultPath)
    };
  } else selected = await (owner ? electron.dialog.showSaveDialog(owner, options) : electron.dialog.showSaveDialog(options));
  if (selected.canceled || !selected.filePath) throw Error('canceled');
  const day = await service.getDay(request.date),
    html = renderReport(day, request.hideLocalPaths);
  if (request.format === 'html') {
    await fs.promises.writeFile(selected.filePath, html, 'utf8');
    return {
      filePaths: [selected.filePath]
    };
  }
  const window = new electron.BrowserWindow({
    show: false,
    width: 1280,
    height: 900,
    webPreferences: {
      sandbox: true,
      nodeIntegration: false,
      contextIsolation: true,
      offscreen: true
    }
  });
  try {
    await window.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
    if (request.format === 'pdf') await fs.promises.writeFile(selected.filePath, await window.webContents.printToPDF({
      printBackground: true,
      pageSize: 'A4'
    }));else {
      const height = await window.webContents.executeJavaScript('Math.max(900,document.documentElement.scrollHeight)');
      if (height > 16000) throw Error('日报过长，无法完整导出为单张图片，请选择 PDF 或 HTML。');
      window.setContentSize(1280, height);
      await new Promise(resolve => setTimeout(resolve, 100));
      await fs.promises.writeFile(selected.filePath, (await window.webContents.capturePage()).toPNG());
    }
  } finally {
    window.destroy();
  }
  return {
    filePaths: [selected.filePath]
  };
}
function register(deps, bridge) {
  const database = deps.database,
    db = database.getDb(),
    directory = electron.app.getPath('userData');
  configureSchema(db, directory);
  const handle = (channel, action) => electron.ipcMain.handle(channel, async (event, ...args) => {
    try {
      return await action(event, ...args);
    } catch (error) {
      return {
        ok: false,
        success: false,
        error: error.message
      };
    }
  });
  const reorder = installWorkspaceOrder(database);
  handle('workspace:reorder', (_e, ids) => reorder(ids));
  // Separate assignment for these helpers; preserve all existing memory/provider routing.
  const featureDb = new Proxy(database, {
    get(target, key) {
      if (key === 'getAppSettings') return () => {
        const s = target.getAppSettings();
        return {
          ...s,
          remoteControlProviderId: s.dailyBoardProviderId || s.summaryProviderId || s.remoteControlProviderId,
          remoteControlModelId: s.dailyBoardModelId || s.summaryModelId || s.remoteControlModelId
        };
      };
      const value = target[key];
      return typeof value === 'function' ? value.bind(target) : value;
    }
  });
  let daily;
  const overlay = new upstream.DailyBoardOverlay({
    getDb: () => db,
    assignGroup: (ids, group) => database.workGroupRepository?.assign(ids, group),
    fallbackFingerprint: (...args) => daily?.liveFingerprint(...args)
  });
  daily = new upstream.DailyBoardService({
    database: featureDb,
    overlay,
    getSettings: () => upstream.readDailySettings(database.getAppSettings()),
    onUpdated: data => broadcast('dailyBoard:updated', data),
    onProgress: data => broadcast('dailyBoard:progress', data),
    ai: {
      hasModel: () => upstream.hasModel(featureDb),
      chat: bridge.createChat(featureDb, 'daily-board'),
      handoffDailyLimit: 0,
      generateHandoff: async () => ({
        error: 'automatic_handoff_disabled'
      }),
      redact: upstream.redact,
      lang: () => electron.app.getLocale().startsWith('zh') ? 'zh' : 'en'
    }
  });
  const scheduler = new upstream.DailyBoardScheduler({
    getSettings: () => upstream.readDailySettings(database.getAppSettings()),
    listRuns: dates => daily.listSchedulerRuns(dates),
    recordSlotRun: job => daily.recordSlotRun(job),
    isGenerating: date => daily.isGeneratingDay(date),
    hasActivity: (date, since) => daily.hasNewActivity(date, since),
    generate: async (date, options) => {
      const result = await daily.generate(date, options.trigger, options);
      const settings = upstream.readDailySettings(database.getAppSettings());
      if (settings.autoExport && result.run.status !== 'failed') await exportReport(daily, {
        date,
        format: settings.autoExport,
        hideLocalPaths: settings.hideLocalPaths
      }, true);
      return {
        runId: result.run.id,
        status: result.run.status
      };
    },
    notify: notice => broadcast('dailyBoard:scheduled-ready', notice),
    log: (...args) => console.warn(...args)
  });
  upstream.registerDailyBoard({
    database,
    dailyBoardService: daily,
    dailyBoardOverlay: overlay,
    dailyBoardSchedule: scheduler,
    dailyBoardExport: request => exportReport(daily, request),
    dailyBoardChannelProbe: () => ({
      feishuConfigured: false,
      telegramConfigured: false,
      dingtalkConfigured: false,
      mobileReady: false
    })
  });
  scheduler.start();
  electron.powerMonitor.on('resume', () => scheduler.onResume());
  handle('dailyBoard:model', (_e, input) => {
    if (input) {
      const id = String(input.providerId || '');
      if (id && !database.getProvider(id)) throw Error('模型服务不存在。');
      database.updateAppSetting('dailyBoardProviderId', id);
      database.updateAppSetting('dailyBoardModelId', String(input.model || ''));
    }
    const s = database.getAppSettings();
    return {
      ok: true,
      providerId: s.dailyBoardProviderId || '',
      model: s.dailyBoardModelId || '',
      fallbackProviderId: s.summaryProviderId || s.remoteControlProviderId || ''
    };
  });
  const storePath = path.join(directory, 'web-llm.json'),
    portFile = path.join(directory, 'web-llm-connection.json');
  async function ensurePort() {
    const port = await bridge.facades()?.ensure('web-llm-settings');
    if (!port) throw Error('内置浏览器通道未开启，请在设置中开启并重启。');
    fs.writeFileSync(portFile, JSON.stringify({
      port
    }));
    return port;
  }
  const mcp = {
    id: MCP_ID,
    name: '网页大模型',
    category: 'builtin',
    source: 'builtin',
    transport: 'stdio',
    command: process.execPath,
    args: [path.join(__dirname, 'web-llm-mcp.cjs')],
    envVars: {
      ELECTRON_RUN_AS_NODE: '1',
      WEB_LLM_STORE_PATH: storePath,
      WEB_LLM_CONNECTION_PATH: portFile
    },
    compatibleProviders: 'all',
    fallbackMode: 'disabled',
    installMethod: 'builtin',
    isInstalled: true,
    isGlobalEnabled: false
  };
  const old = database.getMcp(MCP_ID);
  if (old) database.updateMcp(MCP_ID, {
    ...mcp,
    isGlobalEnabled: old.isGlobalEnabled
  });else database.createMcp(mcp);
  installWebLlmState(database, presets, storePath, MCP_ID);
  const web = new upstream.WebLlmService({
    storePath,
    driver: presets,
    ensureSettingsPort: ensurePort,
    isBrowserAvailable: () => !!bridge.facades(),
    revealBrowserPane: () => deps.browserWindowManager?.openWindow({}),
    emitProgress: data => broadcast('web-llm:progress', data),
    mcp: {
      isEnabled: () => !!database.getMcp(MCP_ID)?.isGlobalEnabled,
      setEnabled: enabled => {
        database.toggleMcp(MCP_ID, enabled);
        presets.updateStore(storePath, store => ({
          ...store,
          enabled
        }));
        bridge.syncMcp(deps, enabled ? 'add' : 'remove', enabled ? database.getMcp(MCP_ID) : MCP_ID);
        if (enabled) ensurePort().catch(error => console.warn('[web-llm] ' + error.message));
      }
    },
    fetchPresetsJson: async () => ({
      version: 1,
      presets: presets.BUNDLED_WEB_LLM_PRESETS
    }),
    telemetry: {
      isEnabled: () => false,
      send: async () => false
    }
  });
  for (const [channel, method, key] of [['list', 'list'], ['save-site', 'saveSite'], ['delete-site', 'deleteSite', 'siteId'], ['set-default', 'setDefault', 'siteId'], ['test', 'test', 'siteId'], ['open-login', 'openLogin', 'siteId'], ['stop-login-watch', 'stopLoginWatch', 'siteId'], ['set-enabled', 'setEnabled'], ['set-sensitive-allowlist', 'setSensitiveAllowlist', 'paths'], ['refresh-presets', 'refreshPresets']]) handle('web-llm:' + channel, (_e, input) => web[method](key ? input?.[key] : input));
  handle('web-llm:pick', (_e, input) => web.pick(input?.siteId, input?.field));
  handle('browser:cookies:import', (event, input) => importCookies(electron, event, input));
  handle('browser:page-context', async (_event, tabId) => {
    const manager = deps.browserWindowManager,
      tab = manager?.tabs?.get(tabId || manager.activeTabId),
      contents = tab?.view?.webContents;
    if (!contents || contents.isDestroyed()) throw Error('请先在内置浏览器打开网页。');
    const url = contents.getURL();
    if (!/^https?:\/\//i.test(url)) throw Error('只能将普通网页交给 AI。');
    const content = await contents.executeJavaScript('(()=>{const root=document.querySelector("article,main,[role=main]")||document.body;return(root?.innerText||"").slice(0,24000)})()');
    return {
      ok: true,
      title: contents.getTitle(),
      url,
      text: String(content).slice(0, 24000)
    };
  });
  if (old?.isGlobalEnabled) ensurePort().catch(error => console.warn('[web-llm] ' + error.message));
  electron.app.once('before-quit', () => {
    web.stop();
    scheduler.stop();
  });
}
module.exports = {
  register,
  configureSchema,
  installWorkspaceOrder,
  renderReport
};
