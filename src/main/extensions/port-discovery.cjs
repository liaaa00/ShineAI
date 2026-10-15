'use strict';
const { execFileOutput } = require('./async-process.cjs');
let inFlight;

function parsePorts(listeners, exclusions = '', platform = process.platform) {
  const ports = new Set();
  for (const line of listeners.split(/\r?\n/)) {
    if (platform === 'win32') {
      const fields = line.trim().split(/\s+/);
      if (fields[3] !== 'LISTENING') continue;
      const port = Number(fields[1]?.split(':').at(-1));
      if (Number.isInteger(port) && port > 0 && port < 65536) ports.add(port);
    } else {
      const match = line.match(/:(\d+)\s+\(LISTEN\)/);
      if (match) ports.add(Number(match[1]));
    }
  }
  for (const line of exclusions.split(/\r?\n/)) {
    const range = line.match(/^\s*(\d+)\s+(\d+)\s*\*?\s*$/);
    if (!range) continue;
    const start = Number(range[1]), end = Number(range[2]);
    if (start > 0 && end >= start && end < 65536) for (let port = start; port <= end; port++) ports.add(port);
  }
  return ports;
}

function scanPorts() {
  if (inFlight) return inFlight;
  const options = { encoding: 'utf8', timeout: 2000, maxBuffer: 1024 * 1024, windowsHide: true };
  const queries = process.platform === 'win32'
    ? [['netstat.exe', ['-ano', '-p', 'TCP']], ['netsh.exe', ['int', 'ipv4', 'show', 'excludedportrange', 'protocol=tcp']]]
    : [['lsof', ['-nP', '-iTCP', '-sTCP:LISTEN']]];
  inFlight = Promise.allSettled(queries.map(([command, args]) => execFileOutput(command, args, options)))
    .then(results => parsePorts(results[0].status === 'fulfilled' ? results[0].value : '', results[1]?.status === 'fulfilled' ? results[1].value : ''))
    .finally(() => { inFlight = undefined; });
  return inFlight;
}

module.exports = { scanPorts, parsePorts };
