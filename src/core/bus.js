// Tiny event bus.
const H = new Map();
export const on = (ev, fn) => { let a = H.get(ev); if (!a) H.set(ev, a = []); a.push(fn); return () => off(ev, fn); };
export const off = (ev, fn) => { const a = H.get(ev); if (a) { const i = a.indexOf(fn); if (i >= 0) a.splice(i, 1); } };
export const emit = (ev, ...args) => { const a = H.get(ev); if (a) for (const fn of a.slice()) { try { fn(...args); } catch (e) { console.error('handler for', ev, e); } } };
