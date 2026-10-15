'use strict';
const path = require('node:path');
function port(value, fallback) {
  if (value === undefined || value === '') return fallback;
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1024 || number > 65535) throw new Error('Invalid development port');
  return number;
}
function createConfig(root, env = process.env, runtime = {}) {
  // Installed applications must never write their profile into Program Files.
  const defaultData = runtime.isPackaged
    ? path.join(runtime.appData, 'ShineAI', 'Desktop')
    : path.join(root, '.data');
  return Object.freeze({
    root: path.resolve(root),
    userData: path.resolve(env.SHINEAI_DEV_USER_DATA_DIR || defaultData),
    resources: path.join(root, 'resources'),
    localAuthPort: port(env.SHINEAI_LOCAL_AUTH_PORT, 19211),
    meetingPort: port(env.SHINEAI_MEETING_GATEWAY_PORT, 17981),
    version: '1.0.6',
    title: 'ShineAI 1.0.6 · 全局外观版 7',
  });
}
module.exports = { createConfig, port };
