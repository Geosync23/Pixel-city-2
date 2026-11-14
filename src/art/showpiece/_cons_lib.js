// Shared helpers for the Botanical Conservatory art (conservatory*.js) and its room (scenes/rooms/conservatory.js reads the pond / bridge geometry).
import * as R from '../../engine/raster.js';
const { PW, px, C, line, ellipse, dk, lt, isFlipped, box, qz, lw } = R;

export const IRON = '#3d7a68', IRON_D = '#2a5648', IRON_L = '#a8dcc8', STONE = '#c6bfb0', STONE_D = '#968f82', SOIL = '#5e4636', MOSS = '#5f9a4a', WOOD = '#9a6a42', RED = '#c8402f';
export const GREENS = ['#2f7a48', '#3f9a55', '#58b868', '#7fcf7a', '#256a4a'];
export const WATER = ['#3a9ab0', '#45a6ba', '#b8ecf0', '#2c8098'];

export const S2 = (x, y, z) => { const s = PW(x, y, z); return [Math.round(s[0]), Math.round(s[1])]; };
/** one pixel at a world point (+ screen offset; dx is mirrored when the asset is drawn flipped) */
export const dot = (x, y, z, c, dx = 0, dy = 0) => { const s = S2(x, y, z); px(s[0] + (isFlipped() ? -dx : dx), s[1] + dy, C(c)); };
export const blob = (x, y, z, rx, ry, c, c2) => { const s = PW(x, y, z); ellipse(s[0], s[1], rx, ry, c, c2); };
export const oblob = (x, y, z, rx, ry, c, oc) => { const s = PW(x, y, z); ellipse(s[0], s[1], rx + 1, ry + 1, oc || dk(c, .55)); ellipse(s[0], s[1], rx, ry, c); };
/** thick vertical-ish stem between two world points (w px wide) with ring marks */
export function trunk(a, b, w, c, rings = 3) {
  const A = PW(a[0], a[1], a[2]), B = PW(b[0], b[1], b[2]), n = Math.max(1, Math.round(A[1] - B[1])), cl = C(lt(c, .18)), cm = C(c), cd = C(dk(c, .3)), co = C(dk(c, .6));
  for (let k = 0; k <= n; k++) { const f = k / n, X = Math.round(A[0] + (B[0] - A[0]) * f - w / 2), Y = Math.round(A[1]) - k, ww = Math.max(2, Math.round(w * (1 - f * .25)));
    px(X - 1, Y, co); px(X + ww, Y, co); for (let i = 0; i < ww; i++) px(X + i, Y, rings && k % rings === 0 ? cd : i === 0 ? cl : i >= ww - 1 ? cd : cm); }
}
/** a feather frond: an arc from (cx,cy,z) heading angle a (world xy), with comb leaflets hanging below the rib */
export function frond(cx, cy, z, a, len, rise, droop, c, cd, lf = 3) {
  let prev = null; const N = Math.max(5, Math.round(len * 8)), CC = C(c), CD = C(cd), CL = C(lt(c, .25));
  for (let i = 0; i <= N; i++) {
    const t = i / N, s = PW(cx + Math.cos(a) * len * t, cy + Math.sin(a) * len * t, z + rise * Math.sin(t * Math.PI * .7) - droop * t * t), X = Math.round(s[0]), Y = Math.round(s[1]);
    if (lf && i > 0) { const L = Math.max(1, Math.round(lf * Math.sin(Math.min(1, t * 1.1 + .08) * Math.PI))); for (let k = 1; k <= L; k++) px(X, Y + k, (i + k) % 3 === 0 ? CD : k === L ? CD : CC); }
    if (prev) line(prev, [X, Y], c); prev = [X, Y];
  }
  for (let i = 1; i < N; i += 2) { const t = i / N, s = PW(cx + Math.cos(a) * len * t, cy + Math.sin(a) * len * t, z + rise * Math.sin(t * Math.PI * .7) - droop * t * t); px(Math.round(s[0]), Math.round(s[1]) - 1, CL); }
}
/** a crown of fronds. o: { n, len, rise, droop, lf, cols, r (rng), a0, spread (0..1 length jitter) } */
export function rosette(cx, cy, z, o) {
  const r = o.r || (() => .5), n = o.n || 8, cols = o.cols || GREENS, F = [];
  for (let i = 0; i < n; i++) { const a = (o.a0 || 0) + i / n * Math.PI * 2 + (r() - .5) * .5; F.push([a, (o.len || 1) * (1 - (o.spread || .25) * r()), i]); }
  F.sort((p, q) => (Math.cos(p[0]) + Math.sin(p[0])) - (Math.cos(q[0]) + Math.sin(q[0])));
  for (const [a, len, i] of F) { const back = Math.cos(a) + Math.sin(a) < -.4, c = back ? cols[0] : cols[1 + (i % 2)]; frond(cx, cy, z, a, len, (o.rise === undefined ? .4 : o.rise) * (.8 + r() * .4), (o.droop === undefined ? .8 : o.droop) * (.7 + r() * .6), c, back ? dk(cols[0], .25) : cols[0], o.lf === undefined ? 3 : o.lf); }
}
/** small flower: plus shape */
export function flower(x, y, z, c, cc, big) { dot(x, y, z, cc || '#ffe9a0'); dot(x, y, z, c, 1, 0); dot(x, y, z, c, -1, 0); dot(x, y, z, c, 0, -1); dot(x, y, z, c, 0, 1); if (big) { dot(x, y, z, lt(c, .3), -1, -1); dot(x, y, z, c, 1, -1); dot(x, y, z, dk(c, .2), 1, 1); dot(x, y, z, dk(c, .2), -1, 1); } }
/** raised stone-curbed planting bed base; returns soil height */
export function bedBase(w, d, h, soil, curb = STONE) {
  box(0, 0, 0, w, d, h, curb, { t: lt(curb, .12) }); qz(.16, w - .16, .16, d - .16, h + .002, soil, dk(soil, .14));
  for (let x = .75; x < w; x += 1) lw([x, d, .02], [x, d, h - .02], dk(curb, .28)); for (let y = .75; y < d; y += 1) lw([w, y, .02], [w, y, h - .02], dk(curb, .42));
  return h;
}

/* ---------- koi pond + bridge geometry (local pond coords; the room uses these for nav and the koi) ---------- */
export const POND = { w: 10, d: 7, bridge: { x0: 1.5, x1: 8.5, y0: 2.75, y1: 4.25, h: .62 }, pads: [[2.2, 1.6], [3.4, 2.0], [7.3, 1.7], [6.4, 5.3], [2.6, 5.4], [8.0, 4.9], [4.9, 1.2], [5.3, 5.9]] };
/** signed "insideness" of the pond outline: > 0 inside the water, the value is roughly the distance to the shore in units */
export function pondIn(x, y, w = POND.w, d = POND.d) {
  const u = (x - w / 2) / (w / 2), v = (y - d / 2) / (d / 2), th = Math.atan2(v, u), rr = .93 + .06 * Math.sin(th * 3 + .6) + .035 * Math.cos(th * 5);
  return (rr - Math.hypot(u, v)) * Math.min(w, d) / 2;
}
/** bridge deck height at t = 0..1 along its length */
export const archZ = (t, h = POND.bridge.h) => (t <= 0 || t >= 1 ? 0 : h * Math.sin(Math.PI * t));
