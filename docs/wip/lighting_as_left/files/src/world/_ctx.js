// Shared generation context + helpers for the city generator (private; files starting with _ are not auto-initialised).
import { World, GT } from '../engine/world.js';
import { rng } from '../engine/raster.js';
import { ASSETS, assetSize, byTag } from '../art/registry.js';
export { GT };
export const W = 384, H = 384;
export const RIV = { x0: 150, x1: 162, y0: 50, weir: 121 };
export const SEA = 345;
/** district table: zone id -> key/name (keys match src/data/venues.js DISTRICTS) */
export const DISTRICTS = [
  { id: 1, key: 'downtown', name: 'Downtown' }, { id: 2, key: 'oldtown', name: 'Old Town' }, { id: 3, key: 'harbor', name: 'Harborside' },
  { id: 4, key: 'hillcrest', name: 'Hillcrest' }, { id: 5, key: 'maplewood', name: 'Maplewood' }, { id: 6, key: 'arts', name: 'Arts Quarter' },
  { id: 7, key: 'railyard', name: 'Railyard' }, { id: 8, key: 'park', name: 'Central Park & Riverside' }, { id: 9, key: 'airport', name: 'Airport' },
];
export const Z = { downtown: 1, oldtown: 2, harbor: 3, hillcrest: 4, maplewood: 5, arts: 6, railyard: 7, park: 8, airport: 9 };
export function zoneOf(x, y) {
  if (y >= 302) return x < 262 ? Z.harbor : Z.railyard;
  if (x < 148) return y < 121 ? Z.hillcrest : y < 196 ? Z.park : Z.oldtown;
  if (x < 174) return y < 121 ? (x < 162 ? Z.hillcrest : Z.arts) : Z.park;
  if (y < 134) return x >= 272 ? Z.airport : Z.arts;
  return x < 266 ? Z.downtown : Z.maplewood;
}
/** design ground level (before smoothing) */
export function level(x, y) {
  if (y >= 304) return 0;
  if (x < 149) { if (y < 26.5) return 10.5; if (y < 44.5) return 9; if (y < 62.5) return 7.5; if (y < 80.5) return 6; if (y < 98.5) return 4.5; if (y < 123) return 3; return 1; }
  if (x < 164) return y < 123 ? 3 : 1;
  if (y < 128) return 3;
  if (x >= 272 && y < 134) return 3;
  if (x >= 270 && y < 290) return 2;
  return 1;
}

export function makeCtx(seed) {
  const world = new World(W, H, { name: 'city' }); world.poolOcc = true;   /* outdoors: a building hides the light pools on the ground behind it (engine/render.js, docs/reports/pool_occlusion.md). Rooms keep their lights on everything. */
  const c = { world, seed, r: rng(seed), occ: new Uint8Array(W * H), roads: [], nodes: [], marks: [], named: {}, stats: {} };
  /* occupancy: 0 free, 1 carriageway, 2 sidewalk, 3 building/reserved, 4 water, 5 rail corridor, 6 paved path / plaza (walkable, keep clear of big things) */
  c.occSet = (x0, y0, x1, y1, v) => { x0 = Math.max(0, Math.floor(x0)); y0 = Math.max(0, Math.floor(y0)); x1 = Math.min(W, Math.ceil(x1)); y1 = Math.min(H, Math.ceil(y1)); for (let y = y0; y < y1; y++) c.occ.fill(v, y * W + x0, y * W + x1); };
  c.occAt = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? 9 : c.occ[Math.floor(y) * W + Math.floor(x)];
  c.occFree = (x0, y0, x1, y1, ok) => { x0 = Math.floor(x0); y0 = Math.floor(y0); x1 = Math.ceil(x1); y1 = Math.ceil(y1); if (x0 < 0 || y0 < 0 || x1 > W || y1 > H) return false; for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const v = c.occ[y * W + x]; if (v && !(ok && ok.includes(v))) return false; } return true; };
  /** sub-stream rng so that one district's changes do not reshuffle the others */
  c.sub = k => rng(seed * 7919 + k * 104729);
  /** wrap an asset so that a buggy draw() from in-progress art cannot crash the frame loop */
  const safe = new Map(); c.safe = a => { let s = safe.get(a); if (!s) { s = Object.assign(Object.create(a), { draw(p) { try { a.draw(p); } catch (e) { if (!a._bad) { a._bad = true; (c.world.badArt = c.world.badArt || []).push(a.id + ': ' + e.message); } } } }); safe.set(a, s); } return s; };
  c.keep = new Set(); c.keepClear = (x, y, rad = 2) => { const gx = Math.floor(x * 2), gy = Math.floor(y * 2); for (let j = -rad; j <= rad; j++) for (let i = -rad; i <= rad; i++) c.keep.add((gy + j) * 1000 + gx + i); };
  c.has = id => ASSETS.has(id);
  /** place an asset if it exists (returns object or null). o.free: only if nav cell is free. */
  c.put = (id, x, y, o = {}) => {
    const a = typeof id === 'string' ? ASSETS.get(id) : id; if (!a) return null;
    if (x < 1 || y < 1 || x > W - 2 || y > H - 2) return null;
    if (o.free) { let s = assetSize(a, o.p || {}); if (o.flip) s = [s[1], s[0], s[2]]; if (c.keep.size && a.kind !== 'vehicle') for (let yy = Math.floor(y * 2); yy < (y + s[1]) * 2; yy++) for (let xx = Math.floor(x * 2); xx < (x + s[0]) * 2; xx++) if (c.keep.has(yy * 1000 + xx)) return null; if (world.isBlocked(x + .25, y + .25) || world.isBlocked(x + s[0] - .25, y + s[1] - .25) || world.isBlocked(x + s[0] / 2, y + s[1] / 2)) return null; }
    const ob = world.place(c.safe(a), x, y, o); c.stats[a.kind] = (c.stats[a.kind] || 0) + 1; return ob;
  };
  /** random variant params of an asset (+seed) */
  c.vp = (a, r, extra) => { a = typeof a === 'string' ? ASSETS.get(a) : a; if (!a) return Object.assign({ seed: 1 }, extra || {}); const vs = a.variants && a.variants.length ? a.variants : [{}]; return Object.assign({}, vs[Math.floor(r() * vs.length) % vs.length], { seed: 1 + Math.floor(r() * 9999) }, extra || {}); };
  /** place with a random variant */
  c.putv = (id, x, y, r, o = {}) => { const a = typeof id === 'string' ? ASSETS.get(id) : id; if (!a) return null; return c.put(a, x, y, Object.assign({}, o, { p: c.vp(a, r, o.p) })); };
  /** first existing asset id of a list */
  c.first = (...ids) => ids.find(i => ASSETS.has(i)) || null;
  c.tag = (...tags) => byTag(...tags);
  c.pick = (arr, r) => arr[Math.floor(r() * arr.length) % arr.length];
  c.size = (a, p) => assetSize(typeof a === 'string' ? ASSETS.get(a) : a, p || {});
  c.h = (x, y) => world.heightAt(x, y);
  c.mark = (x0, y0, x1, y1, col) => c.marks.push([x0, y0, x1, y1, col]);
  return c;
}
