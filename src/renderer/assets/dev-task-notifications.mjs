// Data subscriptions also include mounted tabs that are currently hidden.
// Report a separate view topic only while this conversation is actually shown.
export function observeCompletionViewport(element, sessionId, acquireTopic) {
  if (!element || !sessionId) return () => {};
  let release;
  const report = () => {
    const visible = document.visibilityState === 'visible' && element.getClientRects().length > 0 &&
      element.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true });
    if (visible && !release) release = acquireTopic('task-notification-view:' + sessionId);
    else if (!visible && release) { release(); release = undefined; }
  };
  const resize = new ResizeObserver(report), intersection = new IntersectionObserver(report);
  resize.observe(element); intersection.observe(element);
  document.addEventListener('visibilitychange', report);
  report();
  return () => {
    resize.disconnect(); intersection.disconnect();
    document.removeEventListener('visibilitychange', report);
    release?.();
  };
}
