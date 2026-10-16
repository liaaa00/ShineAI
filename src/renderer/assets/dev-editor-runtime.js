// A slow start shows readable text while the same initialization continues.
// A real failure may be retried; concurrent viewers share one initialization.
export function createEditorRuntime(loader) {
  let pending = null;
  let failed = false;
  function initialize() {
    if (!pending) {
      if (failed) { loader.reset(); failed = false; }
      const attempt = Promise.resolve().then(() => loader.init()).catch(error => {
        throw error instanceof Error ? error : new Error('编辑器组件加载失败，请点击重试。');
      });
      pending = attempt;
      attempt.catch(() => {
        if (pending === attempt) { pending = null; failed = true; }
      });
    }
    return pending;
  }
  return {
    async ready(timeoutMs = 5000, onSlow = () => {}) {
      const timer = setTimeout(onSlow, timeoutMs);
      try { return await initialize(); }
      finally { clearTimeout(timer); }
    }
  };
}
