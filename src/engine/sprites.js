// Sprite cache: raster results -> canvases. Browser only.
import * as R from './raster.js';
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
/** raster.render() result -> sprite {c: colour canvas, l: light canvas|null, x, y, w, h} (x,y = offset from the anchor in px) */
export function toSprite(r) {
  if (!r) return null;
  const c = mk(r.w, r.h); c.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(r.buf.buffer), r.w, r.h), 0, 0);
  let l = null; if (r.hasLight) { l = mk(r.w, r.h); l.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(r.lb.buffer), r.w, r.h), 0, 0); }
  return { c, l, x: r.x, y: r.y, w: r.w, h: r.h };
}
const cache = new Map(); let total = 0; export const BUDGET = { px: 36e6 };
/** LRU cache. key: string; make: () => sprite */
export function cached(key, make) {
  let s = cache.get(key);
  if (s !== undefined) { cache.delete(key); cache.set(key, s); return s; }
  s = make(); cache.set(key, s); if (s) total += s.w * s.h;
  if (total > BUDGET.px) for (const [k, v] of cache) { if (total <= BUDGET.px * .8 || k === key) break; cache.delete(k); if (v) total -= v.w * v.h; }
  return s;
}
/** drop everything (call on season change) */
export function clearSprites() { cache.clear(); total = 0; }
export const spriteStats = () => ({ count: cache.size, px: total });
const sw = b => [b[1], b[0], b[2], b[4], b[3], b[5]];
/** sprite for a placed world object (see World.place). Anchor = WS(ob.x, ob.y, ob.z). */
export function objSprite(ob) {
  if (!ob._key) ob._key = ob.id + '|' + JSON.stringify(ob.p) + (ob.flip ? '|F' : '');
  return cached(ob._key, () => { try { return toSprite(R.render(R.screenBox(ob.vbl), () => ob.a.draw(ob.p), null, 3, ob.flip)); } catch (e) { console.warn('art error in ' + ob.id + ': ' + e.message); return null; } });
}
/** sprite for an asset drawn at the origin with params (vehicles etc). vb optional override. */
export function assetSprite(a, p, flip, key) {
  key = key || (a.id + '|' + JSON.stringify(p) + (flip ? '|F' : ''));
  return cached(key, () => { let vb = a.vb ? (typeof a.vb === 'function' ? a.vb(p) : a.vb) : null; if (!vb) { const s = typeof a.size === 'function' ? a.size(p) : a.size; vb = [-.3, -.3, 0, s[0] + .3, s[1] + .3, s[2] + .3]; } if (flip) vb = sw(vb); return toSprite(R.render(R.screenBox(vb), () => a.draw(p), null, 3, flip)); });
}
/** sprite from a pixel-bounds draw function (characters): sb = [x0,y0,x1,y1] px around the anchor */
export function pixSprite(key, sb, draw) { return cached(key, () => toSprite(R.render(sb, draw, null, 1))); }
