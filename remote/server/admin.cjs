'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { Store, secret, passwordKey } = require('./store.cjs');
async function resetPassword(directory, password) {
  if (typeof password !== 'string' || password.length < 12 || password.length > 1024) throw new Error('Set SHINEAI_REMOTE_PASSWORD to a new password of 12–1024 characters.');
  if (!fs.existsSync(path.join(directory, 'state.json'))) throw new Error('No initialized owner state.');
  const store = await Store.open(directory), salt = secret();
  store.state.account = { ...store.state.account, salt, passwordHash: await passwordKey(password, salt) };
  store.state.sessions = []; store.state.devices = [];
  store.save();
}
if (require.main === module) (async () => {
  if (process.argv[2] !== 'reset-password') throw new Error('Usage: stop the server, then node admin.cjs reset-password');
  await resetPassword(path.resolve(process.env.SHINEAI_REMOTE_DATA_DIR || '.remote-data'), process.env.SHINEAI_REMOTE_PASSWORD);
  console.log('Owner password changed; all phone sessions and device credentials were revoked.');
})().catch(error => { console.error(error.message); process.exitCode = 1; });
module.exports = { resetPassword };
