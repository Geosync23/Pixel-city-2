// Shared palette, geometry and helpers for the Maple Bay Natatorium art (natatorium.js, natatorium_leisure.js) and its rooms / sim (which import the geometry). Not an asset module.
//   Geometry is in ROOM coordinates (the room's floor starts at (0,0); rooms add their world offset O = 1).
//   POOL (competition pool, lanes along x; lane 1 at the back), DIVE (diving well) + BOARD_AT, STAND rows, LEIS { RIVER (ellipse loop), ISLAND, TUB, WAVE, TOD, SPLASH, TOWER },
//   FLUME / DROP: slide centre-lines [[x, y, z], ...], LIDO pool, riverPt(a) -> [x, y] on the river's mid-line, inEll(), pathAt(path, s) -> [x, y, z] by arc length, pathLen(path).
import * as R from '../../engine/raster.js';
const { box, qy, qx, qz, fq, lw, cyl, ball, dk, lt, mix, hash2, PW, px, C, lit, glow, rng } = R;
export { R };
export const TEAL = '#1fa3b8', TEAL_D = '#157a8c', NAVY = '#22304e', BLUE = '#1f6fb8', YEL = '#f2c230', RED = '#d8402e', ORG = '#f08a2c', WHITE = '#f4f8f8', TILE = '#e4eef0', TILE_D = '#c8dade', GROUT = '#a8c0c6', DECK = '#dfe9e4', DECK2 = '#d2dfda',
  STEEL = '#c2cad4', STEEL_D = '#8a94a2', INK = '#2a2733', WOOD = '#c8935a', WOOD_D = '#9a6a3c', CEDAR = '#d8a868', GLASS = '#a8dcea', WATER = '#4ab8d0', WATER_L = '#8fe0ea', WATER_D = '#2f8fb8', SAND = '#ead9b0', LEAF = '#3f9a55', LEAF_D = '#2f7a45', PINK = '#f28fb0', LIME = '#a8d84a';
export const FLOATS = ['#f08a2c', '#f28fb0', '#a8d84a', '#f2c230', '#5ab0e0', '#d8402e', '#8a5cc2'];

/* ---------- geometry (room coords) ---------- */
export const POOL = { x0: 4, x1: 26, y0: 6.6, y1: 16.2, lanes: 8, lw: 1.2 };
export const laneY = n => POOL.y0 + (n - .5) * POOL.lw;                    // centre line of lane n (1..8)
export const DIVE = { x0: 31, x1: 41, y0: 6.6, y1: 15.6 };
export const BOARD_AT = { b1: { x: 32.4, y: 8.1, z: .85, y0: 5.2 }, b3: { x: 35.4, y: 8.3, z: 2.3, y0: 5 }, p5: { x: 38.7, y: 7.7, z: 3.7, y0: 4.8 } };   // (x, y) = the tip over the water, y0 = where you step on
export const STAND = { x0: 4.5, x1: 25.5, rows: [{ y: .55, z: 1.35 }, { y: 1.45, z: .9 }, { y: 2.35, z: .45 }], rail: 4.45 };
export const LEIS = {
  RIVER: { cx: 22, cy: 13.6, rx: 11, ry: 7.4, ix: 8.2, iy: 4.9 }, TUB: { x: 22, y: 12.6, r: 1.55 }, BRIDGE: { x0: 21, x1: 22.6, y0: 18, y1: 21 },
  WAVE: { x0: 35.2, x1: 45, y0: 1.2, y1: 13.2 }, TOD: { x0: 35.6, x1: 45, y0: 15.6, y1: 24.6 }, SPLASH: { x0: .9, x1: 8.6, y0: 10.6, y1: 13.2 }, TOWER: { x0: .8, y0: .8, s: 3.2, h: 4 },
  BUCKET: { x: 40.5, y: 18.5 }, PLUNGE: { x: 21.4, y: 2.2, r: .85 }, RIVER_IN: { x: 13.2, y: 20.2 },
};
export const LIDO = { x0: 4, x1: 20, y0: 5.4, y1: 10.2, lanes: 4, lw: 1.2 };
export const inEll = (x, y, cx, cy, rx, ry) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
export const riverPt = a => { const r = LEIS.RIVER; return [r.cx + Math.cos(a) * (r.rx + r.ix) / 2, r.cy + Math.sin(a) * (r.ry + r.iy) / 2]; };
// slide centre-lines: from the tower top down to the run-out troughs
export const DROP = [[1.7, 3.9, 4.05], [1.7, 4.6, 3.9], [1.7, 7.6, 1.1], [1.7, 8.8, .55], [1.7, 10.4, .34], [1.7, 12.4, .26]];
export const FLUME = [[3.1, 3.9, 4.05], [3.1, 5, 3.85], [3.9, 6.1, 3.55], [5.5, 6.5, 3.2], [7, 5.8, 2.85], [8.3, 6, 2.5], [9.1, 7.1, 2.1], [8.8, 8.5, 1.7], [7.4, 9, 1.3], [6.1, 8.9, .95], [5.3, 9.6, .65], [5.2, 10.6, .42], [5.2, 12.4, .3]];
const sm = pts => { const o = []; for (let i = 0; i < pts.length - 1; i++) { const a = pts[Math.max(0, i - 1)], b = pts[i], c = pts[i + 1], d = pts[Math.min(pts.length - 1, i + 2)]; for (let k = 0; k < 6; k++) { const t = k / 6, t2 = t * t, t3 = t2 * t; o.push([0, 1, 2].map(j => .5 * (2 * b[j] + (c[j] - a[j]) * t + (2 * a[j] - 5 * b[j] + 4 * c[j] - d[j]) * t2 + (3 * b[j] - a[j] - 3 * c[j] + d[j]) * t3))); } } o.push(pts[pts.length - 1].slice()); return o; };
export const FLUME_S = sm(FLUME), DROP_S = sm(DROP);
export const pathLen = p => { let L = 0; for (let i = 1; i < p.length; i++) L += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1], p[i][2] - p[i - 1][2]); return L; };
export const pathAt = (p, s) => { for (let i = 1; i < p.length; i++) { const a = p[i - 1], b = p[i], d = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]); if (s <= d || i === p.length - 1) { const t = Math.max(0, Math.min(1, d ? s / d : 0)); return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t, b[0] - a[0], b[1] - a[1]]; } s -= d; } return p[p.length - 1]; };

/* ---------- drawing helpers ---------- */
export const S2 = (x, y, z) => { const s = PW(x, y, z); return [Math.round(s[0]), Math.round(s[1])]; };
export const dot = (x, y, z, c, r = 1) => { const s = S2(x, y, z), cc = C(c); for (let j = -r + 1; j < r; j++) for (let i = -r + 1; i < r; i++) px(s[0] + i, s[1] + j, cc); };
/** square wall tiles (pattern for qy / qx): size s px, with an accent band between v0..v1 px from the floor */
export const tiles = (c = TILE, s = 4, band, v0 = 14, v1 = 18) => { const g = dk(c, .12); return (u, v) => (band && v >= v0 && v < v1 ? (u % s === 0 ? dk(band, .15) : band) : u % s === 0 || v % s === 0 ? g : c); };
/** deck floor pattern (world coords): non-slip tiles */
export const deck = (a = DECK, b = DECK2, s = 1) => (x, y) => { const fx = x / s - Math.floor(x / s), fy = y / s - Math.floor(y / s); if (fx < .05 || fy < .05) return GROUT; return (Math.floor(x / s) + Math.floor(y / s)) & 1 ? a : b; };
/** steel rail on posts along x (y fixed) / along y (x fixed) */
export const railX = (x0, x1, y, z0, h, c = STEEL, n) => { n = n || Math.max(2, Math.round((x1 - x0) / .8) + 1); for (let i = 0; i < n; i++) { const x = x0 + (x1 - x0) * i / (n - 1); lw([x, y, z0], [x, y, z0 + h], dk(c, .2)); } lw([x0, y, z0 + h], [x1, y, z0 + h], lt(c, .2)); lw([x0, y, z0 + h * .55], [x1, y, z0 + h * .55], c); };
export const railY = (x, y0, y1, z0, h, c = STEEL, n) => { n = n || Math.max(2, Math.round((y1 - y0) / .8) + 1); for (let i = 0; i < n; i++) { const y = y0 + (y1 - y0) * i / (n - 1); lw([x, y, z0], [x, y, z0 + h], dk(c, .3)); } lw([x, y0, z0 + h], [x, y1, z0 + h], lt(c, .1)); lw([x, y0, z0 + h * .55], [x, y1, z0 + h * .55], dk(c, .1)); };
/** glass panel on a y-plane / x-plane with a steel top rail */
export const glassY = (x0, x1, y, z0, z1) => { qy(x0, x1, y, z0, z1, '#bfe8f0', 'glass'); lw([x0, y, z1], [x1, y, z1], STEEL); lw([x0, y, z0], [x0, y, z1], STEEL_D); lw([x1, y, z0], [x1, y, z1], STEEL_D); };
export const glassX = (x, y0, y1, z0, z1) => { qx(x, y0, y1, z0, z1, '#a8dcea', 'glass'); lw([x, y0, z1], [x, y1, z1], STEEL); lw([x, y0, z0], [x, y0, z1], STEEL_D); lw([x, y1, z0], [x, y1, z1], STEEL_D); };
/** potted / planted palm: trunk + frond fan */
export const palm = (x, y, z, h, seed = 1, c = LEAF) => { const rr = rng(seed * 7 + 5); for (let k = 0; k < 6; k++) { const zz = z + h * k / 6; lw([x + Math.sin(k) * .03, y, zz], [x + Math.sin(k + 1) * .03, y, zz + h / 6], k % 2 ? '#8a6a44' : '#a07a50'); lw([x + .05, y, zz], [x + .05, y, zz + h / 6], '#6a4e34'); }
  for (let i = 0; i < 9; i++) { const a = i / 9 * 6.283 + rr(), l = .7 + rr() * .5, ex = x + Math.cos(a) * l, ey = y + Math.sin(a) * l * .8, top = z + h + .25, col = i % 3 ? c : LEAF_D; for (let t = 0; t < 6; t++) { const u = t / 6, v = (t + 1) / 6, f = q => [x + (ex - x) * q, y + (ey - y) * q, top + Math.sin(q * 2.4) * .35 - q * q * .7]; lw(f(u), f(v), col); const m = f(v); lw(m, [m[0], m[1], m[2] - .14], t % 2 ? lt(col, .15) : col); } } dot(x, y, z + h + .2, '#8a6a44', 2); };
/** rolled / folded towel */
export const towel = (x, y, z, c, w = .36) => { box(x, y, z, w, .22, .1, c, { ol: false }); lw([x, y + .22, z + .05], [x + w, y + .22, z + .05], lt(c, .35)); };
/** screen-aligned 3x5 text centred on a world point */
export const textC = (str, x, y, z, c) => { const s = S2(x, y, z); R.textS(str, s[0] - (R.textW(str) >> 1), s[1], c); };
/** life ring */
export const ring = (x, y, z, c = ORG) => { const s = S2(x, y, z); R.ellipse(s[0], s[1], 4, 4, c); R.ellipse(s[0], s[1], 1.6, 1.6, '#00000000'); for (const [i, j] of [[-3, 0], [3, 0], [0, -3], [0, 3]]) px(s[0] + i, s[1] + j, C(WHITE)); px(s[0], s[1], C(dk(c, .5))); };
/** arched tube / half-pipe cross-section helpers for the slides: a short open trough segment between two 3D points */
export function trough(a, b, c, w = .42, closed) {
  const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1, nx = -dy / d * w, ny = dx / d * w;
  const L0 = [a[0] + nx, a[1] + ny, a[2] + .22], L1 = [b[0] + nx, b[1] + ny, b[2] + .22], R0 = [a[0] - nx, a[1] - ny, a[2] + .22], R1 = [b[0] - nx, b[1] - ny, b[2] + .22], M0 = [a[0], a[1], a[2] - .06], M1 = [b[0], b[1], b[2] - .06];
  const near = (nx + ny) > 0 ? [L0, L1] : [R0, R1], far = (nx + ny) > 0 ? [R0, R1] : [L0, L1];
  fq([far[0], far[1], M1, M0], dk(c, .22)); fq([M0, M1, near[1], near[0]], lt(c, .12)); fq([near[0], near[1], [near[1][0], near[1][1], near[1][2] - .34], [near[0][0], near[0][1], near[0][2] - .34]], dk(c, .08));
  lw(M0, M1, '#bfeef4'); lw(near[0], near[1], lt(c, .45)); lw(far[0], far[1], dk(c, .35));
  if (closed) { fq([far[0], far[1], [far[1][0], far[1][1], far[1][2] + .3], [far[0][0], far[0][1], far[0][2] + .3]], dk(c, .3)); const t0 = [a[0], a[1], a[2] + .62], t1 = [b[0], b[1], b[2] + .62]; fq([far[0], far[1], t1, t0].map((q, i) => (i < 2 ? [q[0], q[1], q[2] + .3] : q)), c); fq([t0, t1, [near[1][0], near[1][1], near[1][2] + .3], [near[0][0], near[0][1], near[0][2] + .3]], lt(c, .2)); fq([[near[0][0], near[0][1], near[0][2] + .3], [near[1][0], near[1][1], near[1][2] + .3], near[1], near[0]], dk(c, .05)); lw(t0, t1, lt(c, .5)); }
}
export { box, qy, qx, qz, fq, lw, cyl, ball, dk, lt, mix, hash2, PW, px, C, lit, glow, rng };
