'use strict';
const defaults = Object.freeze({ screenshotFull: 'Ctrl+Alt+Shift+S', screenshotWindow: 'Ctrl+Alt+Shift+W' });
const alternatives = {
  screenshotFull: [defaults.screenshotFull, 'Ctrl+Alt+Shift+F8', 'Ctrl+Alt+Shift+F10'],
  screenshotWindow: [defaults.screenshotWindow, 'Ctrl+Alt+Shift+F9', 'Ctrl+Alt+Shift+F11'],
};

function registerScreenshotShortcuts({ globalShortcut, bindings, onFull, onWindow, onBindingsChanged, logger = console }) {
  const registered = [];
  let changed = false;
  for (const [action, callback] of [['screenshotFull', onFull], ['screenshotWindow', onWindow]]) {
    const requested = bindings[action];
    if (!requested) continue; // Respect an explicitly disabled shortcut.
    let chosen;
    for (const accelerator of new Set([requested, ...alternatives[action]])) {
      try {
        if (globalShortcut.register(accelerator, callback)) { chosen = accelerator; break; }
      } catch { /* Invalid or unavailable accelerator: try the development alternatives. */ }
    }
    if (!chosen) { logger.warn('[Shortcuts] No available screenshot accelerator for ' + action); continue; }
    registered.push(chosen);
    if (chosen !== requested) {
      bindings[action] = chosen;
      changed = true;
      logger.info('[Shortcuts] Screenshot accelerator reassigned: ' + action + ' = ' + chosen);
    }
  }
  if (changed) {
    try { onBindingsChanged?.({ ...bindings }); }
    catch { logger.warn('[Shortcuts] Could not persist the reassigned screenshot accelerators'); }
  }
  return registered;
}

module.exports = { defaults, registerScreenshotShortcuts };
