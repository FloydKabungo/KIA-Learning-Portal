/* Tab-scoped storage for fictional preview data only.
 * Production profiles and authorization must live on a trusted server.
 * Never carry account records in window.name or persist login sessions locally.
 */
(() => {
  'use strict';
  const memory = Object.create(null);
  const isKey = (key) => typeof key === 'string' && /^kia-[a-zA-Z0-9:._-]+$/.test(key);
  const parse = (value) =>
    JSON.parse(value, (key, item) =>
      ['__proto__', 'prototype', 'constructor'].includes(key) ? undefined : item
    );
  let available = false;
  try {
    sessionStorage.setItem('kia-storage-check', '1');
    sessionStorage.removeItem('kia-storage-check');
    available = true;
  } catch {}
  let legacy = Object.create(null);
  try {
    if (window.name.startsWith('kia-portal-preview-v1:'))
      legacy = parse(window.name.slice('kia-portal-preview-v1:'.length));
    else if (window.name.startsWith('kia-learning-preview:'))
      legacy = {
        'kia-my-learning-preview-v1': parse(window.name.slice('kia-learning-preview:'.length)),
      };
  } catch {}
  // Clear the previous page-carrying mechanism even on public pages.
  window.name = '';
  if (available) {
    try {
      const oldKeys = Object.keys(localStorage).filter(isKey);
      for (const key of new Set([...oldKeys, ...Object.keys(legacy || {})])) {
        if (!isKey(key)) continue;
        const transferable =
          key === 'kia-admin-preview-v1' || key.startsWith('kia-my-learning-preview-v1');
        if (transferable && sessionStorage.getItem(key) === null) {
          const value = Object.hasOwn(legacy, key)
            ? JSON.stringify(legacy[key])
            : localStorage.getItem(key);
          if (value !== null) sessionStorage.setItem(key, value);
        }
        // The former persistent session is deliberately not restored.
        localStorage.removeItem(key);
      }
    } catch {
      /* Do not remove an old record when its migration cannot be saved. */
    }
  }
  function read(key) {
    if (!isKey(key)) return null;
    try {
      const value = sessionStorage.getItem(key);
      return value === null ? (memory[key] ?? null) : parse(value);
    } catch {
      return memory[key] ?? null;
    }
  }
  function write(key, value) {
    if (!isKey(key)) throw new Error('Invalid preview storage key.');
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
      memory[key] = structuredClone(value);
      return true;
    } catch {
      return false;
    }
  }
  function remove(key) {
    if (!isKey(key)) return;
    delete memory[key];
    try {
      sessionStorage.removeItem(key);
      localStorage.removeItem(key);
    } catch {}
  }
  function clear() {
    for (const key of Object.keys(memory)) delete memory[key];
    try {
      Object.keys(sessionStorage)
        .filter(isKey)
        .forEach((key) => sessionStorage.removeItem(key));
      Object.keys(localStorage)
        .filter(isKey)
        .forEach((key) => localStorage.removeItem(key));
    } catch {}
    window.name = '';
  }
  window.KIAStorage = Object.freeze({ read, write, remove, clear, available });
})();
