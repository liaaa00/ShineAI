'use strict';

// Keep native notifications alive until Windows reports a click or dismissal.
const visibleNotifications = new Set();
const pendingNavigation = new WeakMap();
const navigationChannel = 'butler:navigate-session';

function activateTaskWindow(getMainWindow, sessionId) {
  const window = getMainWindow();
  if (!window || window.isDestroyed()) return false;
  if (window.isMinimized()) window.restore();
  if (!window.isVisible()) window.show();
  window.focus();
  const contents = window.webContents;
  const previous = pendingNavigation.get(contents);
  previous?.cancel();
  if (typeof sessionId !== 'string' || !sessionId) return true;
  const send = () => {
    cancel();
    if (!contents.isDestroyed()) contents.send(navigationChannel, sessionId);
  };
  const cancel = () => {
    contents.removeListener('did-finish-load', send);
    contents.removeListener('destroyed', cancel);
    pendingNavigation.delete(contents);
  };
  if (contents.isLoadingMainFrame()) {
    pendingNavigation.set(contents, { cancel });
    contents.once('did-finish-load', send);
    contents.once('destroyed', cancel);
  } else send();
  return true;
}

function showTaskNotification({ Notification, getMainWindow, title, body, silent, sessionId }) {
  const notification = new Notification({ title, body, silent });
  visibleNotifications.add(notification);
  const release = () => visibleNotifications.delete(notification);
  notification.once('click', () => {
    release();
    try { activateTaskWindow(getMainWindow, sessionId); }
    catch (error) { console.error('Unable to open notification target:', error); }
  });
  notification.once('close', release);
  notification.once('failed', release);
  try { notification.show(); }
  catch (error) { release(); throw error; }
  return notification;
}

module.exports = { showTaskNotification, activateTaskWindow };
