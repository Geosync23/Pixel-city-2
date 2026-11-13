// Asset registry. Art modules export `default [asset, ...]`; tools/artfiles.mjs generates index.js which registers them all.
export const ASSETS = new Map();
export const MODULES = {};
export function reg(mod, file) {
  MODULES[file] = mod;
  const list = mod.default;
  if (Array.isArray(list)) for (const a of list) { if (!a || !a.id) continue; if (ASSETS.has(a.id)) console.warn('duplicate asset id', a.id, file); a.file = file; ASSETS.set(a.id, a); }
}
export const asset = id => { const a = ASSETS.get(id); if (!a) throw new Error('unknown asset ' + id); return a; };
export const assetSize = (a, p) => typeof a.size === 'function' ? a.size(p || {}) : a.size;
/** visual bounds (local AABB) used to size the sprite */
export function assetVB(a, p) { if (a.vb) return typeof a.vb === 'function' ? a.vb(p || {}) : a.vb; const s = assetSize(a, p); return [-.3, -.3, 0, s[0] + .3, s[1] + .3, s[2] + .3]; }
export const byTag = (...tags) => [...ASSETS.values()].filter(a => tags.every(t => (a.tags || []).includes(t)));
