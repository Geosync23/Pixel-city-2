// Elevated light-rail loop: corridor, viaduct (deck + piers), 8 stations. world.rail contract is documented in city.js.
import { GT, W, H, RIV, level } from './_ctx.js';
import { pad } from './_terrain.js';
import * as R from '../engine/raster.js';

export const RAIL_PATH = [[43, 123], [276, 123], [276, 129], [376, 129], [376, 305], [43, 305]];
export const LEGS = [ // deck rectangles: axis, centre coordinate, from, to
  { axis: 'x', c: 123, a: 40, b: 279 }, { axis: 'x', c: 129, a: 273, b: 379 }, { axis: 'y', c: 376, a: 132, b: 302 }, { axis: 'x', c: 305, a: 40, b: 379 }, { axis: 'y', c: 43, a: 126, b: 302 },
];
const lerp = (t, pts) => { if (t <= pts[0][0]) return pts[0][1]; for (let i = 0; i < pts.length - 1; i++) { const p = pts[i], q = pts[i + 1]; if (t <= q[0]) return p[1] + (q[1] - p[1]) * (t - p[0]) / (q[0] - p[0]); } return pts[pts.length - 1][1]; };
/** absolute height of the track bed at a point of the loop */
export function deckZ(x, y) { if (y < 131) return 8; if (y > 301) return 6; if (x > 200) return lerp(y, [[132, 8], [172, 7], [260, 7], [300, 6]]); return lerp(y, [[126, 8], [150, 6]]); }
export const STATIONS = [
  { id: 'hillcrest', name: 'Hillcrest', x: 84, y: 123, axis: 'x', side: 1, down: true }, { id: 'arts', name: 'Arts Quarter', x: 220, y: 123, axis: 'x', side: 1, down: true },
  { id: 'airport', name: 'Airport', x: 326, y: 129, axis: 'x', side: -1 }, { id: 'maplewood', name: 'Maplewood', x: 376, y: 216, axis: 'y', side: -1, lift: true },
  { id: 'railyard', name: 'Railyard', x: 334, y: 305, axis: 'x', side: 1 }, { id: 'central', name: 'Central', x: 213, y: 305, axis: 'x', side: 1, central: true },
  { id: 'harbor', name: 'Harborside', x: 100, y: 305, axis: 'x', side: 1 }, { id: 'oldtown', name: 'Old Town', x: 43, y: 248, axis: 'y', side: -1 },
];
export function terrain(c) {
  const w = c.world;
  for (const L of LEGS) { const f = (x0, y0, x1, y1) => { for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (!c.occ[y * W + x]) { c.occ[y * W + x] = 5; w.gt[y * W + x] = GT.gravel; } }; if (L.axis === 'x') f(L.a, L.c - 3, L.b, L.c + 3); else f(L.c - 3, L.a, L.c + 3, L.b); }
  for (const s of STATIONS) {
    if (s.axis === 'x') { const y0 = s.side > 0 ? s.y + 3 : s.y - 10, y1 = s.side > 0 ? s.y + 10 : s.y - 3; if (s.down) { const z = level(s.x, s.y - 4); pad(c, s.x - 13, s.y - 3, s.x + 13, s.y + 7, z); for (let k = 0; k <= 4; k++) pad(c, s.x + 5, s.y + 7 + k, s.x + 8, s.y + 7 + k, z - k * (z - 1) / 4); w.ground(s.x + 5, s.y + 7, s.x + 8, s.y + 11, GT.stairs); c.occSet(s.x + 5, s.y + 7, s.x + 8, s.y + 12, 6); w.ground(s.x - 13, s.y + 3, s.x + 13, s.y + 7, GT.plaza); c.occSet(s.x - 13, s.y + 3, s.x + 13, s.y + 7, 6); }
      else { for (let y = y0; y < y1; y++) for (let x = s.x - 13; x < s.x + 13; x++) if (!c.occ[y * W + x] || c.occ[y * W + x] === 5) { c.occ[y * W + x] = 6; w.gt[y * W + x] = GT.plaza; } } }
    else { const x0 = s.lift ? s.x - 3 : s.x - 11, x1 = s.lift ? s.x + 3 : s.x - 3; for (let y = s.y - 13; y < s.y + 13; y++) for (let x = x0; x < x1; x++) if (!c.occ[y * W + x] || c.occ[y * W + x] === 5) { c.occ[y * W + x] = 6; w.gt[y * W + x] = GT.plaza; } }
  }
}
const boxDeck = len => ({ key: 'deck' + len, size: [len, 6, .6], solid: false, vb: [0, 0, 0, len, 6, 1.2], draw() { R.box(0, 0, 0, len, 6, .6, '#b9b4a8'); R.qz(0, len, 1.2, 2.2, .62, '#6b5a4a'); R.qz(0, len, 3.8, 4.8, .62, '#6b5a4a'); R.box(0, 5.8, .6, len, .2, .5, '#a39e93', { ol: false }); } });
const boxPier = h => ({ key: 'pier' + h, size: [1.4, 1.6, h], draw() { R.box(.2, .2, 0, 1, 1.2, h - .4, '#b9b4a8'); R.box(0, 0, h - .4, 1.4, 1.6, .4, '#a39e93'); } });
export function build(c) {
  const w = c.world, has = id => c.has(id), r = c.sub(11);
  const deck = (x, y, len, flip, z) => { if (has('prop.rail.viaduct')) c.put('prop.rail.viaduct', x, y, { p: { len }, flip, z: z - .6, solid: false }); else w.placeCustom(boxDeck(len), x, y, { flip, z: z - .6 }); };
  const pier = (x, y, flip, zTop) => { const o = c.occAt(x, y); if (o === 1 || o === 4 || o === 3) return; const g = w.heightAt(x, y), h = Math.round((zTop - .6 - g) * 4) / 4; if (h < 2) return; const X = x - (flip ? .8 : .7), Y = y - (flip ? .7 : .8); if (has('prop.rail.pier')) c.put('prop.rail.pier', X, Y, { p: { h, seed: 1 + (r() * 99 | 0), poster: r() < .3 }, flip, z: g }); else w.placeCustom(boxPier(h), X, Y, { flip, z: g }); };
  for (const L of LEGS) for (let t = L.a; t < L.b; t += 8) {
    const len = Math.min(8, L.b - t), mid = t + len / 2, x = L.axis === 'x' ? mid : L.c, y = L.axis === 'x' ? L.c : mid, z = Math.round(deckZ(x, y) * 8) / 8;
    if (L.axis === 'x') { deck(t, L.c - 3, len, false, z); pier(t + 4, L.c, false, z); } else { deck(L.c - 3, t, len, true, z); pier(L.c, t + 4, true, z); }
  }
  const stations = [];
  for (const s of STATIONS) {
    const z = deckZ(s.x, s.y), u = z - .6, X = s.axis === 'x';
    const P = (id, along, across, o = {}) => { const a = c.has(id) ? id : null; if (!a) return null; const sz = c.size(a, o.p); return X ? c.put(a, s.x + along, s.y + across, { p: o.p, z: o.z, solid: o.solid }) : c.put(a, s.x + across, s.y + along, { p: o.p, z: o.z, flip: true, solid: o.solid }); };
    for (const sd of [-1, 1]) { const ac = sd < 0 ? -6 : 3; P('prop.rail.platform', -12, ac, { p: { len: 16, edge: sd < 0 ? 'y1' : 'y0' }, z: u, solid: false }); P('prop.rail.platform', 4, ac, { p: { len: 8, edge: sd < 0 ? 'y1' : 'y0' }, z: u, solid: false }); P('prop.rail.canopy', -8, ac, { p: { len: 16 }, z: u + 1.2, solid: false }); P('prop.rail.namesign', 5, sd < 0 ? -5.8 : 5.6, { p: { name: s.name.toUpperCase(), }, z: u + 1.2, solid: false }); P('prop.rail.bench', -11, sd < 0 ? -5.6 : 5, { p: {}, z: u + 1.2, solid: false }); }
    let ent;
    if (s.central && c.centralDoor) ent = { x: c.centralDoor.x, y: c.centralDoor.y }; else if (s.lift) { c.put('bld.rail.elevator', s.x - 3.4, s.y - 1.1, { p: { h: u + 1.2 - w.heightAt(s.x - 2, s.y) } }); ent = { x: s.x - 4.5, y: s.y + 2 }; }
    else if (X) { const y = s.side > 0 ? s.y + 6.2 : s.y - 8.6, g = w.heightAt(s.x, y + 1.2); c.put('bld.rail.stairs', s.x - 5, y, { p: { h: u + 1.2 - g, esc: true, seed: 3 } }); c.put('bld.rail.elevator', s.x + 3.6, s.side > 0 ? s.y + 6.2 : s.y - 8.4, { p: { h: u + 1.2 - g } }); ent = { x: s.x - 1, y: s.side > 0 ? s.y + 9.2 : s.y - 9.2 }; }
    else { const g = w.heightAt(s.x - 8, s.y); c.put('bld.rail.stairs', s.x - 8.6, s.y - 5, { p: { h: u + 1.2 - g, esc: true, seed: 3 }, flip: true }); ent = { x: s.x - 9.4, y: s.y - 1 }; }
    if (!c.has('bld.rail.stairs')) w.placeCustom({ key: 'stn' + s.id, size: [1, 1, 3], draw() { R.box(.3, .3, 0, .4, .4, 3, '#56636b'); R.signY(s.name.toUpperCase(), -1, 2, .8, 2.2, 2.9, '#e0453a', '#ffffff'); }, vb: [-1.2, 0, 0, 2.2, 1, 3.2] }, ent.x + 1, ent.y - 1.5, {});
    c.put(c.first('prop.rail.ticket'), ent.x + 2, ent.y - .2, { p: {}, free: true });
    w.poi({ type: 'station', id: 'station:' + s.id, name: s.name + ' Station', x: ent.x, y: ent.y, station: s.id });
    w.poi({ type: 'landmark', id: 'lm:station:' + s.id, name: s.name + ' Station', x: s.x, y: s.y });
    stations.push({ id: s.id, venueId: 'st_' + s.id, name: s.name, x: s.x, y: s.y, axis: s.axis, platformZ: z + .6, deckZ: z, entrance: ent });
  }
  // sample the loop every 4 units for train animation
  const profile = []; for (let i = 0; i < RAIL_PATH.length; i++) { const a = RAIL_PATH[i], b = RAIL_PATH[(i + 1) % RAIL_PATH.length], n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 4)); for (let k = 0; k < n; k++) { const x = a[0] + (b[0] - a[0]) * k / n, y = a[1] + (b[1] - a[1]) * k / n; profile.push({ x, y, z: deckZ(x, y) }); } }
  w.rail = { z: 5, path: RAIL_PATH.map(p => p.slice()), stations, profile, deckZ, trackOffsets: [-1.3, 1.3], deckWidth: 6 };
}
