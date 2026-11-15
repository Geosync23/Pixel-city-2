// Shared helpers for the goods catalogue art (src/art/goods). Not an asset module.
// Every family is ONE parametric asset `furn.home.g.<family>`; `p.k` picks the kind (shape), colours come from p.c / p.c2 / p.wood / p.metal.
// The `furn.home.` prefix lets src/sim/housing.js place the pieces through its VIS table without any change there.
import { box, qy, qx, qz, lw, PW, px, C, ellipse, cyl, ball, dk, lt, mix, lit, glow, rng, hash2 } from '../../engine/raster.js';
import { b, leg, pole, legs4, shadow, dot, blob, oblob, sp, fabric, FAB, WOOD, METAL } from '../home/_lib.js';
export { box, qy, qx, qz, lw, PW, px, C, ellipse, cyl, ball, dk, lt, mix, lit, glow, rng, hash2, b, leg, pole, legs4, shadow, dot, blob, oblob, sp, fabric, FAB, WOOD, METAL };

export const BRASS = '#d9b65c', INK = '#2c2738', CREAM = '#f3ead8', STEEL = '#b9c2c9', TERRA = '#c9764a', OAK = '#b08a5a', WALNUT = '#6b4630', PINE = '#d8b888', BLACK = '#3a3640';
export const GREEN = ['#2f7a48', '#3f9a55', '#58b868', '#7fcf7a'];
/** draw a lamp shade / screen: bright and self-lit when on, dull when off */
export function shade(on, c, fn) { if (on) lit(() => fn(lt(c, .4))); else fn(dk(c, .12)); }
/** is the lamp on? (default yes) */
export const isOn = p => p.on !== false && p.on !== 0;
/** thick 2px line between world points */
export function lw2(a, q, c) { lw(a, q, c); lw([a[0], a[1], a[2] + 1 / 16], [q[0], q[1], q[2] + 1 / 16], c); }
/** screen-space filled rect centred on a world point */
export function srect(x, y, z, w, h, c, dx = 0, dy = 0) { const s = sp(x, y, z), cc = C(c); for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) px(s[0] + dx - (w >> 1) + i, s[1] + dy - h + 1 + j, cc); }
/** a simple pot centred at (x,y): returns the soil height */
export function pot(x, y, r, h, c, o) { o = o || {}; shadow(x - r - .02, x + r + .06, y - r - .02, y + r + .06, o.z || 0); cyl(x, y, o.z || 0, r - .02, h, c, { t: '#4a3626' }); if (o.rim !== false) cyl(x, y, (o.z || 0) + h - .05, r, .05, lt(c, .1), { t: '#4a3626' }); if (o.band) lw([x - r + .04, y + r, (o.z || 0) + h * .5], [x + r - .04, y + r, (o.z || 0) + h * .5], o.band); return (o.z || 0) + h; }
/** leaf blob with a lighter centre */
export function leaf(x, y, z, rx, ry, c) { oblob(x, y, z, rx, ry, c); blob(x, y, z + .03, rx * .5, ry * .45, lt(c, .2)); }
/** registry helper: one asset per family. K = { kind: { s: [w,d,h], d(p), seats?, use?, vb? } } */
export function family(id, tags, K, extra) {
  const k = p => K[p && p.k] || K[Object.keys(K)[0]], f = (key, dflt) => p => { const v = k(p)[key]; return v === undefined ? dflt : typeof v === 'function' ? v(p) : v; };
  const a = Object.assign({ id: 'furn.home.g.' + id, kind: 'furniture', tags: ['home', 'goods', ...tags], size: p => { const s = k(p).s; return typeof s === 'function' ? s(p) : s; },
    variants: Object.keys(K).map(key => Object.assign({ k: key }, K[key].v)), draw: p => k(p).d(p || {}) }, extra);
  if (!a.vb) a.vb = p => { const kk = k(p); if (kk.vb) return typeof kk.vb === 'function' ? kk.vb(p) : kk.vb; const s = a.size(p); return a.wall ? [-.2, -.2, -.3, s[0] + .2, s[1] + .4, s[2] + .3] : [-.35, -.35, 0, s[0] + .35, s[1] + .45, s[2] + .45]; };
  if (Object.values(K).some(q => q.seats)) { a.seats = f('seats', []); a.seatsFor = a.seats; }
  if (Object.values(K).some(q => q.use)) a.use = f('use', undefined);
  return a;
}
/** n short strokes fanning out from a point (grass-like fronds). pts drawn back to front. */
export function fronds(x, y, z, n, len, r, cols, o) {
  o = o || {}; const L = [];
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + r() * .6, sp2 = (o.spread === undefined ? .3 : o.spread) * (.5 + r() * .6), h = len * (.6 + r() * .4); L.push([x + Math.cos(a) * sp2, y + Math.sin(a) * sp2, z + h, cols[i % cols.length]]); }
  L.sort((a, q) => (a[0] + a[1]) - (q[0] + q[1]));
  for (const l of L) { const mx = (x + l[0]) / 2 + (l[0] - x) * (o.droop || 0), my = (y + l[1]) / 2 + (l[1] - y) * (o.droop || 0), mz = z + (l[2] - z) * (o.arch || .75); lw([x, y, z], [mx, my, mz], l[3]); lw([mx, my, mz], [l[0], l[1], l[2] - (o.droop ? (l[2] - z) * .35 : 0)], l[3]); if (o.wide) { lw([x + 1 / 16, y, z], [mx + 1 / 16, my, mz], dk(l[3], .2)); } if (o.tip) leaf(l[0], l[1], l[2] - (o.droop ? (l[2] - z) * .35 : 0), o.tip, o.tip * .75, l[3]); }
}
/** one fat pixel on a +y plane (k sixteenths wide and tall) */
export function pixY(x, y, z, c, k = 1) { qy(x, x + k / 16, y, z, z + k / 16, c); }
