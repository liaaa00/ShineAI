'use strict';
const path = require('node:path');
const { createRemoteServer } = require('./app.cjs');
(async () => {
  const port = Number(process.env.PORT || 7940), host = process.env.HOST || '127.0.0.1';
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid PORT');
  if (!['127.0.0.1', 'localhost', '::1'].includes(host) && !process.env.SHINEAI_REMOTE_PUBLIC_URL?.startsWith('https://')) throw new Error('A non-loopback listener requires SHINEAI_REMOTE_PUBLIC_URL with HTTPS.');
  const remote = await createRemoteServer({ directory: path.resolve(process.env.SHINEAI_REMOTE_DATA_DIR || '.remote-data'), publicUrl: process.env.SHINEAI_REMOTE_PUBLIC_URL || `http://127.0.0.1:${port}`, username: process.env.SHINEAI_REMOTE_USER, password: process.env.SHINEAI_REMOTE_PASSWORD });
  remote.server.listen(port, host, () => console.log(`ShineAI Remote listening on ${host}:${port}`));
  const shutdown = () => remote.close().then(() => process.exit(0));
  process.once('SIGTERM', shutdown); process.once('SIGINT', shutdown);
})().catch(error => { console.error('ShineAI Remote:', error.message); process.exitCode = 1; });
