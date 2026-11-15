// Shared helpers for the big-city-events art (floats, boats, festival props). Only raster.js is imported.
import { PW, px, C, fq, lw, qx, qy, qz, box, dk, lt, mix, glow, lit, isFlipped, PAT, ellipse, line } from '../../engine/raster.js';

/** rounded screen pixel of a world point */
export const P = (x, y, z) => { const s = PW(x, y, z); return [Math.round(s[0]), Math.round(s[1])]; };
/** soft night-only halo (dithered diamond) */
export function halo(x, y, z, r, hex) {
  const q = P(x, y, z), c = C(hex);
  glow(() => { for (let Y = -r; Y <= r; Y++) for (let X = -r; X <= r; X++) { const d = Math.abs(X) + Math.abs(Y); if (d > r) continue; if (d > r * .55 && ((X + Y) & 1)) continue; px(q[0] + X, q[1] + Y, c); } });
}
/** small bulb that is bright day and night (+ halo at night) */
export function lamp(x, y, z, hex, r = 3, w = 2, h = 2) {
  if (r) halo(x, y, z, r, mix(hex, '#ffffff', .25));
  const q = P(x, y, z), c = C(hex);
  lit(() => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) px(q[0] + i - (w >> 1), q[1] + j - (h >> 1), c); });
}
/** plain pixels at a world anchor */
export function dot(x, y, z, hex, w = 1, h = 1, dx = 0, dy = 0) { const q = P(x, y, z), c = C(hex); for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) px(q[0] + i + dx, q[1] + j + dy, c); }
const lerp = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
/** point on a sagging string between two world points */
export const sagPt = (a, b, k, sag) => { const q = lerp(a, b, k); q[2] -= sag * 4 * k * (1 - k); return q; };
/** the string itself */
export function cord(a, b, sag = 0, hex = '#4a4458', n = 10) { let q = a; for (let i = 1; i <= n; i++) { const r = sagPt(a, b, i / n, sag); lw(q, r, hex); q = r; } }
/** fairy lights along a (sagging) string */
export function bulbs(a, b, n, cols, sag = 0, r = 2, wire = '#4a4458') {
  if (wire) cord(a, b, sag, wire);
  for (let i = 0; i < n; i++) { const q = sagPt(a, b, (i + .5) / n, sag); lamp(q[0], q[1], q[2] - .04, cols[i % cols.length], r, 2, 2); }
}
/** triangular pennants hanging from a (sagging) string */
export function pennants(a, b, n, cols, sag = 0, len = 5) {
  cord(a, b, sag, '#e8e2d4');
  for (let i = 0; i < n; i++) {
    const q = sagPt(a, b, (i + .5) / n, sag), s = P(q[0], q[1], q[2]), c = C(cols[i % cols.length]), d = C(dk(cols[i % cols.length], .25));
    for (let r = 0; r < len; r++) { const hw = Math.max(0, Math.round((len - 1 - r) * 2 / len)); for (let u = -hw; u <= hw; u++) px(s[0] + u, s[1] + 1 + r, u > 0 ? d : c); }
  }
}
/** round paper lantern (lit, with a halo): s = radius in px */
export function lantern(x, y, z, hex, s = 3, cap = '#3a3440') {
  const q = P(x, y, z);
  halo(x, y, z, s + 3, lt(hex, .35));
  lit(() => { ellipse(q[0], q[1], s, s + 1, hex); ellipse(q[0] - 1, q[1] - 1, Math.max(1, s - 2), Math.max(1, s - 1), lt(hex, .35)); });
  const c = C(cap); for (let u = -1; u <= 1; u++) { px(q[0] + u, q[1] - s - 2, c); px(q[0] + u, q[1] + s + 2, c); }
  px(q[0], q[1] + s + 3, C('#f2c230')); px(q[0], q[1] + s + 4, C('#f2c230'));
}
/** party balloon with a string */
export function balloon(x, y, z, hex, s = 3) {
  const q = P(x, y, z); line([q[0], q[1] + s + 1], [q[0] + 1, q[1] + s + 8], '#e8e2d4');
  ellipse(q[0], q[1], s, s + 1, hex, null); ellipse(q[0] - 1, q[1] - 1, Math.max(1, s - 2), Math.max(1, s - 2), lt(hex, .4)); px(q[0], q[1] + s + 1, C(dk(hex, .3)));
}
/** little 5-pixel flower */
export function flower(x, y, z, hex, mid = '#f2c230') { const q = P(x, y, z), c = C(hex); px(q[0] - 1, q[1], c); px(q[0] + 1, q[1], c); px(q[0], q[1] - 1, c); px(q[0], q[1] + 1, c); px(q[0], q[1], C(mid)); }
/** scatter flowers over a horizontal patch */
export function sprinkle(R, x0, x1, y0, y1, z, cols, n) { for (let i = 0; i < n; i++) flower(x0 + R() * (x1 - x0), y0 + R() * (y1 - y0), z, cols[Math.floor(R() * cols.length) % cols.length]); }
/** thin pole */
export const pole = (x, y, z, h, c, t = .12, ol = true) => box(x - t / 2, y - t / 2, z, t, t, h, c, { ol });
/** flag on a pole (screen-space cloth) */
export function flag(x, y, z, h, cols, w = 7, hh = 5) {
  pole(x, y, z, h, '#d8d2c0', .08, false); const q = P(x, y, z + h), f = isFlipped() ? -1 : 1;
  for (let j = 0; j < hh; j++) for (let i = 1; i <= w; i++) px(q[0] + f * i, q[1] + j + ((i >> 2) & 1), C(cols[Math.floor(j * cols.length / hh)]));
}
/** a seated / standing festival figure made of a few pixels (for tiny far-off riders, boat crews) */
export function mini(x, y, z, shirt, skin = '#ecba90', hair = '#4a3022') {
  const q = P(x, y, z); px(q[0], q[1] - 7, C(hair)); px(q[0] + 1, q[1] - 7, C(hair)); px(q[0], q[1] - 6, C(skin)); px(q[0] + 1, q[1] - 6, C(skin));
  for (let j = 0; j < 3; j++) { px(q[0], q[1] - 5 + j, C(shirt)); px(q[0] + 1, q[1] - 5 + j, C(dk(shirt, .2))); } px(q[0] - 1, q[1] - 5, C(shirt)); px(q[0] + 2, q[1] - 5, C(dk(shirt, .2)));
  px(q[0], q[1] - 2, C('#3a3f58')); px(q[0] + 1, q[1] - 2, C('#3a3f58')); px(q[0], q[1] - 1, C('#3a3f58')); px(q[0] + 1, q[1] - 1, C('#2a2f44'));
}

/**
 * Parade float platform. Float coords: u = 0 rear .. L front, mapped onto x by p.dir (like the vehicles).
 * o: { skirt, skirt2 (stripe), trim, deck, zt (deck height, default .8), bulbs: [cols] | false }
 * Returns K = { L, W, zt, f (true when the front is at x = 0), X(u) -> x, bx(u, w) -> x of a box that starts at u and is w long }
 */
export function floatBed(p, L, W, o) {
  o = o || {}; const f = (p.dir || 1) < 0, zt = o.zt || .8, sk = o.skirt || '#f2a7c3', sk2 = o.skirt2 || lt(sk, .45), trim = o.trim || '#f2c230';
  const K = { L, W, zt, f, X: u => f ? L - u : u, bx: (u, w) => f ? L - u - w : u };
  qz(.1, L - .1, .15, W + .12, 0, '#2a1f4540');                                             /* ground shadow */
  box(0, 0, .1, L, W, zt - .1, sk, { l: PAT.vstripes(sk, sk2, 5), r: PAT.vstripes(dk(sk, .2), dk(sk2, .2), 5), t: o.deck || lt(sk, .25) });
  /* scalloped fringe along the two visible sides */
  for (let u = .1; u < L - .05; u += .25) { const q = P(u, W, .1); px(q[0], q[1] + 1, C(trim)); px(q[0] + 1, q[1] + 2, C(trim)); px(q[0] + 2, q[1] + 2, C(dk(trim, .2))); }
  for (let v = .1; v < W - .05; v += .25) { const q = P(L, v, .1); px(q[0], q[1] + 1, C(dk(trim, .15))); px(q[0] - 1, q[1] + 2, C(dk(trim, .3))); }
  lw([0, W, zt], [L, W, zt], trim); lw([L, 0, zt], [L, W, zt], dk(trim, .15));
  if (o.bulbs !== false) { const cols = o.bulbs || ['#fff2b0', '#ffd0e0']; bulbs([.2, W + .02, zt - .22], [L - .2, W + .02, zt - .22], Math.round(L * 1.6), cols, 0, 2, null); }
  /* tow bar at the front */
  const tx = f ? -.35 : L; box(tx, W / 2 - .06, .22, .35, .12, .08, '#4a4458', { ol: false });
  return K;
}
/** hull of a boat lying along x: pointed bow at the front (p.dir). Returns K like floatBed (zt = deck height). */
export function hull(p, L, W, col, o) {
  o = o || {}; const f = (p.dir || 1) < 0, zt = o.zt || .7, K = { L, W, zt, f, X: u => f ? L - u : u, bx: (u, w) => f ? L - u - w : u };
  const bow = o.bow || 1.1, a = f ? bow : 0, b = f ? L : L - bow, tipx = f ? 0 : L, m = W / 2, st = o.stripe || '#f4f0e8', dkc = dk(col, .3);
  qz(a, b, 0, W, zt, o.deck || '#c9a268'); fq([[f ? a : b, 0, zt], [f ? a : b, W, zt], [tipx, m, zt + .12]], o.deck || '#c9a268');
  qy(a, b, W, .0, zt, col); qy(a, b, W, zt - .16, zt - .06, st);
  if (!f) { fq([[b, W, 0], [tipx, m, .1], [tipx, m, zt + .12], [b, W, zt]], dkc); fq([[b, W, zt - .16], [tipx, m, zt - .02], [tipx, m, zt + .08], [b, W, zt - .06]], dk(st, .15)); }
  else { fq([[a, W, 0], [tipx, m, .1], [tipx, m, zt + .12], [a, W, zt]], lt(col, .08)); qx(b, 0, W, 0, zt, dkc); }
  if (!f) lw([b, W, zt], [tipx, m, zt + .12], dk(col, .6)); else lw([a, W, zt], [tipx, m, zt + .12], dk(col, .6));
  lw([a, W, zt], [b, W, zt], lt(col, .3)); lw([a, W, 0], [b, W, 0], dk(col, .6));
  /* wake / waterline foam */
  for (let u = a; u < b; u += .3) { const q = P(u, W, 0); px(q[0], q[1] + 1, C('#e8f6fb')); if ((u * 10 | 0) % 2) px(q[0] + 1, q[1] + 2, C('#bfe4f0')); }
  return K;
}
