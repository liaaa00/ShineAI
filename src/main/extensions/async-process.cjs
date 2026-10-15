'use strict';
const { execFile } = require('node:child_process');

function execFileOutput(file, args, options) {
  return new Promise((resolve, reject) => {
    execFile(file, args, options, (error, stdout) => error ? reject(error) : resolve(stdout));
  });
}

// Match spawnSync's result shape without blocking Electron's event loop.
function spawnResult(file, args, options) {
  return new Promise(resolve => {
    execFile(file, args, options, (error, stdout, stderr) => {
      const result = { stdout, stderr, status: error ? (Number.isInteger(error.code) ? error.code : null) : 0 };
      if (error && !Number.isInteger(error.code)) result.error = error;
      resolve(result);
    });
  });
}

module.exports = { execFileOutput, spawnResult };
