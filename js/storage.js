// storage.js — safe localStorage wrapper (works even when storage is unavailable)
'use strict';

const storage = (() => {
  const KEY = 'brainstorm-bingo/v1';

  let available = false;
  try {
    const probe = '__bb_probe__';
    window.localStorage.setItem(probe, probe);
    window.localStorage.removeItem(probe);
    available = true;
  } catch (e) {
    available = false;
  }

  return {
    get available() {
      return available;
    },
    load() {
      if (!available) return null;
      try {
        const raw = window.localStorage.getItem(KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : null;
      } catch (e) {
        return null;
      }
    },
    save(state) {
      if (!available) return false;
      try {
        window.localStorage.setItem(KEY, JSON.stringify(state));
        return true;
      } catch (e) {
        return false;
      }
    },
    clear() {
      if (!available) return;
      try {
        window.localStorage.removeItem(KEY);
      } catch (e) {
        /* ignore */
      }
    },
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = storage;
