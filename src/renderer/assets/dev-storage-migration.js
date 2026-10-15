// Copy renamed preference keys once. Values may contain user content: never rewrite them.
(function () {
  try {
    const storage = window.localStorage;
    const marker = 'shineai-brand-storage-v1';
    if (storage.getItem(marker) === 'done') return;
    const old = atob('c3BlY3RyYWk=');
    const variants = [[old, 'shineai'], [old.toUpperCase(), 'SHINEAI'], [old[0].toUpperCase() + old.slice(1, -2) + 'AI', 'ShineAI']];
    const keys = Array.from({ length: storage.length }, (_, i) => storage.key(i));
    for (const key of keys) {
      for (const [prefix, replacement] of variants) {
        if (!key?.startsWith(prefix)) continue;
        const target = replacement + key.slice(prefix.length);
        if (storage.getItem(target) === null) storage.setItem(target, storage.getItem(key));
        break;
      }
    }
    storage.setItem(marker, 'done');
  } catch { /* A locked profile must still be able to open the application. */ }
})();
