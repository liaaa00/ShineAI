'use strict';

// A focused DOM document does not imply a focused Chromium RenderWidgetHost.
// Prepare only page-level input that has already passed the facade policy gate.
function createInputFocusBridge({ send, reply, checkWrite = () => ({ blocked: false }), timeoutMs = 5000 }) {
  // Chromium CDP requires signed 32-bit request identifiers. Reserve a high
  // positive range, separate from ordinary incrementing client request ids.
  const internalId = 1500000000 + Math.floor(Math.random() * 500000000);
  let ready = false, pending = false, timer, closed = false;
  const queue = [];
  function flush(error) {
    clearTimeout(timer); pending = false; ready = !error;
    for (const frame of queue.splice(0)) {
      if (error) {
        try {
          const request = JSON.parse(String(frame.data));
          reply(JSON.stringify({ id: request.id, error: { code: -32000, message: 'Browser input focus preparation failed: ' + error } }));
        } catch {}
      } else {
        // A user may take over while Chromium acknowledges focus preparation.
        // Recheck the current policy before releasing each queued command.
        const policy = checkWrite(frame.data);
        if (policy.blocked) reply(JSON.stringify({ id: policy.id, error: { code: -32000, message: policy.message || 'Browser input permission changed' } }));
        else send(frame.data, { binary: frame.binary });
      }
    }
  }
  return {
    forward(data, binary) {
      if (closed || binary) return false;
      let request;
      try { request = JSON.parse(String(data)); } catch { return false; }
      if (!pending && (!request.method?.startsWith('Input.') || ready)) return false;
      queue.push({ data, binary });
      if (!pending) {
        pending = true;
        timer = setTimeout(() => flush('timed out'), timeoutMs);
        timer.unref?.();
        send(JSON.stringify({ id: internalId, method: 'Emulation.setFocusEmulationEnabled', params: { enabled: true } }), { binary: false });
      }
      return true;
    },
    receive(data, binary) {
      if (binary) return false;
      let response;
      try { response = JSON.parse(String(data)); } catch { return false; }
      if (response.id !== internalId) return false;
      if (pending) flush(response.error ? String(response.error.message || 'CDP error') : null);
      return true;
    },
    close() { closed = true; clearTimeout(timer); queue.length = 0; }
  };
}
module.exports = { createInputFocusBridge };
