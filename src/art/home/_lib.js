// Shared helpers for the home furniture library (src/art/home). Not an asset module.
import { box, qy, qx, qz, lw, PW, px, C, ellipse, dk, lt, mix, isFlipped } from '../../engine/raster.js';

/** quality tier 0 basic / 1 nice / 2 luxury (default 1) */
export const tier = p => (p && p.tier != null ? Math.max(0, Math.min(2, p.tier | 0)) : 1);
export const WOOD = ['#b89668', '#9c6a3e', '#5e3f30'];      // pine, oak, walnut
export const METAL = ['#8e979d', '#c2cad0', '#d9b65c'];     // dull steel, chrome, brass
export const WHITE = ['#d9d6cc', '#f1eee6', '#f8f5ee'];
export const CREAM = '#f3ead8', INK = '#2c2738', STEEL = '#b9c2c9';
export const wood = p => p.wood || WOOD[tier(p)];
export const metal = p => p.metal || METAL[tier(p)];
/** a tidy set of fabric colours used across variants */
export const FAB = { red: '#c8574d', teal: '#3f8f8a', blue: '#4f74b8', mustard: '#dba63c', sage: '#8fae7e', rose: '#d98a9c', plum: '#7a5590', grey: '#8d8f9c', navy: '#39456f', cream: '#eadfc8', olive: '#7b8450', rust: '#b9653a', char: '#4a4a58' };

/** box without outline */
export const b = (x, y, z, w, d, h, c, o) => box(x, y, z, w, d, h, c, Object.assign({ ol: false }, o));
const R = Math.round;
/** rounded target pixel of a world point */
export const sp = (x, y, z) => { const s = PW(x, y, z); return [R(s[0]), R(s[1])]; };
/** single pixel at a world point (+ optional screen offset; dx is mirrored when flipped) */
export function dot(x, y, z, h, dx = 0, dy = 0) { const s = sp(x, y, z); px(s[0] + (isFlipped() ? -dx : dx), s[1] + dy, C(h)); }
/** screen-space ellipse centred on a world point (rx, ry in px) */
export function blob(x, y, z, rx, ry, h, h2) { const s = PW(x, y, z); ellipse(s[0], s[1], rx, ry, h, h2); }
/** outlined screen-space ellipse */
export function oblob(x, y, z, rx, ry, h, h2) { const s = PW(x, y, z); ellipse(s[0], s[1], rx + 1, ry + 1, dk(h, .65)); ellipse(s[0], s[1], rx, ry, h, h2); }
/** 2px-wide vertical post (table/chair leg) */
export function leg(x, y, z, h, c) { const a = sp(x, y, z + h), q = sp(x, y, z), l = C(dk(c, .12)), r = C(dk(c, .42)); for (let Y = a[1]; Y <= q[1]; Y++) { px(a[0] - 1, Y, l); px(a[0], Y, r); } }
/** 1px vertical post */
export function pole(x, y, z, h, c) { lw([x, y, z], [x, y, z + h], c); }
/** four legs under a top of footprint (x,y,w,d) */
export function legs4(x, y, z, w, d, h, c, i = .07) { leg(x + i, y + i, z, h, c); leg(x + w - i, y + i, z, h, c); leg(x + i, y + d - i, z, h, c); leg(x + w - i, y + d - i, z, h, c); }
/** soft contact shadow on the floor */
export function shadow(x0, x1, y0, y1, z = 0) { qz(x0, x1, y0, y1, z, '#2a1f4538'); }
/** rectangle outline on a +y plane */
export function frameY(x0, x1, y, z0, z1, c) { lw([x0, y, z0], [x1, y, z0], c); lw([x0, y, z1], [x1, y, z1], c); lw([x0, y, z0], [x0, y, z1], c); lw([x1, y, z0], [x1, y, z1], c); }
export function frameX(x, y0, y1, z0, z1, c) { lw([x, y0, z0], [x, y1, z0], c); lw([x, y0, z1], [x, y1, z1], c); lw([x, y0, z0], [x, y0, z1], c); lw([x, y1, z0], [x, y1, z1], c); }
/** filled panel with a dark frame on a +y plane */
export function panelY(x0, x1, y, z0, z1, c, fc) { qy(x0, x1, y, z0, z1, c); frameY(x0, x1, y, z0, z1, fc || dk(c, .4)); }
/** n side-by-side cabinet doors on a +y face (drawn over an existing face): seams + handles */
export function doorsY(x0, x1, y, z0, z1, n, c, hc) {
  const s = dk(c, .42), w = (x1 - x0) / n;
  for (let i = 1; i < n; i++) lw([x0 + i * w, y, z0], [x0 + i * w, y, z1], s);
  for (let i = 0; i < n; i++) { const hx = (n > 1 && i % 2 === 0) ? x0 + (i + 1) * w - .13 : x0 + i * w + .13, zm = z0 + (z1 - z0) * .62; lw([hx, y, zm - .09], [hx, y, zm + .09], hc); }
}
/** n stacked drawers on a +y face: seams + handles */
export function drawersY(x0, x1, y, z0, z1, n, c, hc) {
  const s = dk(c, .42), h = (z1 - z0) / n, m = (x0 + x1) / 2, hw = Math.min(.16, (x1 - x0) * .22);
  for (let i = 1; i < n; i++) lw([x0, y, z0 + i * h], [x1, y, z0 + i * h], s);
  for (let i = 0; i < n; i++) lw([m - hw, y, z0 + (i + .55) * h], [m + hw, y, z0 + (i + .55) * h], hc);
}
/** fabric / rug patterns for qz (world coords). kind: plain stripe check dots zig diamond */
export function fabric(c, c2, kind, s = .25) {
  c2 = c2 || lt(c, .35);
  if (kind === 'stripe') return (x, y) => (Math.floor(y / s) & 1) ? c2 : c;
  if (kind === 'xstripe') return (x, y) => (Math.floor(x / s) & 1) ? c2 : c;
  if (kind === 'check') { const m = mix(c, c2, .5); return (x, y) => { const a = Math.floor(x / s) & 1, q = Math.floor(y / s) & 1; return a && q ? c2 : a || q ? m : c; }; }
  if (kind === 'dots') return (x, y) => { const fx = x / s - Math.floor(x / s), fy = y / s - Math.floor(y / s), o = (Math.floor(y / s) & 1) * .5, gx = (fx + o) % 1; return Math.abs(gx - .5) < .17 && Math.abs(fy - .5) < .17 ? c2 : c; };
  if (kind === 'zig') return (x, y) => { const t = x / s + Math.abs(((y / s) % 2 + 2) % 2 - 1); return (Math.floor(t) & 1) ? c2 : c; };
  if (kind === 'diamond') return (x, y) => { const a = Math.abs(((x / s) % 2 + 2) % 2 - 1), q = Math.abs(((y / s) % 2 + 2) % 2 - 1); return a + q < .62 ? c2 : c; };
  return () => c;
}
/** soft cushion / pillow block with outline */
export function cushion(x, y, z, w, d, h, c) { box(x, y, z, w, d, h, c, { t: lt(c, .12) }); }
/** small potted detail: a mug, cup or pot of 2-3 px */
export function mug(x, y, z, c) { const s = sp(x, y, z); px(s[0], s[1] - 1, C(c)); px(s[0] + 1, s[1] - 1, C(dk(c, .25))); px(s[0], s[1] - 2, C(lt(c, .3))); px(s[0] + 1, s[1] - 2, C(c)); }
/** books standing in a row on a +y plane from x0 to x1 at shelf height z (heights vary by seed fn r) */
export const BOOKC = ['#c8574d', '#3f8f8a', '#dba63c', '#4f74b8', '#7a5590', '#eadfc8', '#8fae7e', '#b9653a', '#39456f', '#d98a9c'];
export function books(x0, x1, y, z, hmax, r, fill = .85) {
  const n = R((x1 - x0) * 16);
  for (let i = 0; i < n; i++) {
    if (r() > fill) { i += 1 + (r() * 2 | 0); continue; }
    const wd = 1 + (r() < .35 ? 1 : 0), c = BOOKC[r() * BOOKC.length | 0], hh = Math.max(2, R(hmax * 16 * (.62 + r() * .38)));
    for (let k = 0; k < wd && i < n; k++, i++) { const q = sp(x0 + (i + .5) / 16, y, z); for (let v = 1; v <= hh; v++) px(q[0], q[1] - v, C(k ? dk(c, .18) : c)); }
    i--;
  }
}

/** row of small jars / cans / boxes standing on a shelf (on the +y plane at depth y). pal = colour list */
export const JARC = ['#d9a45a', '#c8574d', '#8fae7e', '#f1eee6', '#4f74b8', '#dba63c', '#b9653a', '#7a5590', '#3f8f8a'];
export function stock(x0, x1, y, z, hmax, r, cols = JARC, fillK = .9) {
  const n = R((x1 - x0) * 16); let i = 0;
  while (i < n) {
    if (r() > fillK) { i += 2; continue; }
    const wd = 2 + (r() * 2 | 0), c = cols[r() * cols.length | 0], hh = Math.max(2, R(hmax * 16 * (.5 + r() * .5))), lid = r() < .6 ? dk(c, .45) : lt(c, .5);
    for (let k = 0; k < wd && i < n; k++, i++) { const q = sp(x0 + (i + .5) / 16, y, z); for (let v = 1; v <= hh; v++) px(q[0], q[1] - v, C(v === hh ? lid : k === wd - 1 ? dk(c, .2) : (v === hh - 2 && hh > 3) ? lt(c, .35) : c)); }
    i++;
  }
}
/**
 * Open shelf unit (bookcase / pantry). n = number of compartments; fillFn(i, zShelf, gap, x0, x1, yFront) draws the contents of compartment i.
 */
export function shelfUnit(x, y, z, w, d, h, c, n, fillFn, o) {
  o = o || {}; const th = .06, base = o.base == null ? .08 : o.base, inner = dk(c, .5), gap = (h - base - th) / n;
  qy(x, x + w, y + .03, z, z + h, o.back || inner); qx(x + th, y, y + d, z, z + h, dk(c, .42));
  b(x, y, z, w, d, base, dk(c, .3));
  for (let i = 0; i < n; i++) {
    const zs = z + base + i * gap;
    b(x + th, y, zs - .04, w - th * 2, d, .04, c, { t: dk(c, .12) });
    if (fillFn) fillFn(i, zs, gap - .06, x + th + .02, x + w - th - .02, y + d - .1);
  }
  b(x + w - th, y, z, th, d, h, c); b(x, y, z + h - th, w, d, th, c);
  lw([x, y + d, z], [x, y + d, z + h], dk(c, .1)); lw([x + 1 / 16, y + d, z], [x + 1 / 16, y + d, z + h - th], dk(c, .3));
  const p6 = [[x, y, z + h], [x + w, y, z + h], [x + w, y, z], [x + w, y + d, z], [x, y + d, z], [x, y + d, z + h]], oc = dk(c, .7);
  for (let i = 0; i < 6; i++) lw(p6[i], p6[(i + 1) % 6], oc);
  lw([x + w, y + d, z + h], [x, y + d, z + h], lt(c, .5));
}
/** a 22px scale person for test scenes (not an asset) */
export function dummy(x, y, z, o) {
  o = o || {}; const s = sp(x, y, z), X = s[0], Y = s[1], sh = o.sh || '#e8590c', pa = o.pa || '#3d4f6b', sk = o.sk || '#f1c7a1', ha = o.ha || '#5b3a22', ol = C('#2a2233');
  const r = (x0, y0, w, h, c) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) px(X + x0 + i, Y + y0 + j, C(c)); };
  r(-4, -22, 8, 22, '#2a2233'); r(-3, -23, 6, 1, '#2a2233');
  r(-3, -8, 3, 8, pa); r(0, -8, 3, 8, dk(pa, .25)); r(-3, -1, 3, 1, '#2a2233'); r(0, -1, 3, 1, '#2a2233');
  r(-3, -15, 6, 7, sh); r(1, -15, 2, 7, dk(sh, .25)); r(-3, -21, 6, 6, sk); r(-3, -22, 6, 2, ha); r(1, -20, 2, 2, ha); px(X - 2, Y - 18, ol); px(X, Y - 18, ol);
}
export { dk, lt, mix };
