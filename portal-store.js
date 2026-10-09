/* Isolated tab storage for fictional design samples only. No old account data is read. */
(() => {
  'use strict';
  const memory = Object.create(null);
  const prefix = 'kia-design-v2:';
  const isKey = key => typeof key === 'string' && /^kia-[a-zA-Z0-9:._-]+$/.test(key);
  let available = false;
  try { sessionStorage.setItem(prefix + 'check', '1'); sessionStorage.removeItem(prefix + 'check'); available = true; } catch {}
  function read(key) {
    if (!isKey(key)) return null;
    try {
      const raw = sessionStorage.getItem(prefix + key);
      return raw === null ? (memory[key] ?? null) : JSON.parse(raw, (name, value) =>
        ['__proto__', 'prototype', 'constructor'].includes(name) ? undefined : value);
    } catch { return memory[key] ?? null; }
  }
  function write(key, value) {
    if (!isKey(key)) throw new Error('Invalid design storage key.');
    memory[key] = structuredClone(value);
    try { sessionStorage.setItem(prefix + key, JSON.stringify(value)); } catch {}
    return true;
  }
  function remove(key) {
    if (!isKey(key)) return;
    delete memory[key];
    try { sessionStorage.removeItem(prefix + key); } catch {}
  }
  function clear() {
    for (const key of Object.keys(memory)) delete memory[key];
    try { Object.keys(sessionStorage).filter(k => k.startsWith(prefix)).forEach(k => sessionStorage.removeItem(k)); } catch {}
  }
  window.KIAStorage = Object.freeze({read, write, remove, clear, available});
})();
