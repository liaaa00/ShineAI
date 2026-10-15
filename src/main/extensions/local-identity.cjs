'use strict';
const { EventEmitter } = require('node:events');
// This class supplies local execution capabilities. It never reads a hosted login,
// stores credentials, starts a refresh timer, or creates cloud membership.
class LocalIdentityService extends EventEmitter {
  async init() { delete process.env.SHINEAI_API_TOKEN; }
  cleanup() { this.removeAllListeners(); }
  getUserInfo() { return null; }
  getUserPlan() { return 'ultra'; } // Existing local capability enum; UI calls it 本地开发.
  getRemoteSubStatus() { return 'none'; }
  isRemoteSubActive() { return false; }
  isAuthenticated() { return false; }
  getAccessToken() { return null; }
  async getValidAccessToken() { return null; }
  getSavedCredentials() { return null; }
  async refreshCurrentUser() { return { success: false, errorCode: 'OFFICIAL_CLOUD_REMOVED', error: '本地版无需官方账号登录' }; }
  async logout() { this.emit('auth-state-changed', { isAuthenticated: false, user: null }); return { success: true }; }
  async getBuiltinProviderConfig() { return null; }
}
module.exports = { LocalIdentityService };
