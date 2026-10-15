'use strict';
const { EventEmitter } = require('node:events');
function removed() { return { success: false, errorCode: 'OFFICIAL_CLOUD_REMOVED', error: '此本地版已移除官方云服务' }; }
// Lifecycle adapters preserve callers while removing network clients and listeners.
class RemovedCloudService extends EventEmitter {
  async init() {}
  async start() { return { enabled: false, port: null }; }
  async stop() {}
  cleanup() { this.removeAllListeners(); }
  destroy() { this.cleanup(); }
  setEnabled() {}
  isConnected() { return false; }
  get connected() { return false; }
  get isRunning() { return false; }
  get gatewayPort() { return null; }
  async disconnect() {}
  async connect() { return removed(); }
  async sendAIMessage() { return removed(); }
  async reportDaily() {}
  getState() { return { connectionState: 'disconnected', room: null, participants: [], enabled: false }; }
  getRendererState() { return this.getState(); }
}
class RemovedUpdater extends RemovedCloudService {
  getState() { return { status: 'idle', isForcedUpgrade: false, enabled: false, message: '本地开发版通过工程代码更新' }; }
  isForcedUpgradeActive() { return false; }
  async checkForUpdates() { return { ...removed(), state: this.getState() }; }
  async downloadUpdate() { return removed(); }
  quitAndInstall() { return removed(); }
}
module.exports = { RemovedCloudService, RemovedUpdater, removed };
