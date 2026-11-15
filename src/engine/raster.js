// Pixel rasteriser. Pure JS (no DOM) so it runs in the browser and in node (tools/gallery.mjs).
// All art in the game is drawn through this file. See docs/ART_GUIDE.md.
//
// World -> screen: 2:1 dimetric.  +x goes right-down, +y goes left-down, +z goes up.
//   sx = (x - y) * U        sy = (x + y) * U/2 - z * U          U = 16 px per world unit
// Visible faces of a box are: top (+z), the +y face ("left/front-left wall") and the +x face ("right wall").

export const U = 16;
export const ENV = { season: 1 }; // 0 spring, 1 summer, 2 autumn, 3 winter

/* ---------- colour ---------- */
const rgb = h => { const n = parseInt(h.slice(1, 7), 16); return [n >> 16, n >> 8 & 255, n & 255]; };
const CC = new Map();
/** '#rrggbb' or '#rrggbbaa' -> packed ABGR uint32 */
export function C(h) {
  let v = CC.get(h);
  if (v === undefined) {
    const a = rgb(h), al = h.length >= 9 ? parseInt(h.slice(7, 9), 16) : 255;
    v = ((al << 24) | a[2] << 16 | a[1] << 8 | a[0]) >>> 0; CC.set(h, v);
  }
  return v;
}
const hx = v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
export const mix = (h, h2, k) => { const a = rgb(h), b = rgb(h2); return '#' + hx(a[0] + (b[0] - a[0]) * k) + hx(a[1] + (b[1] - a[1]) * k) + hx(a[2] + (b[2] - a[2]) * k); };
/** darken toward the house shadow colour (cool purple) */
export const dk = (h, k) => mix(h, '#2a1f45', k);
/** lighten toward the house highlight colour (warm cream) */
export const lt = (h, k) => mix(h, '#fff8e0', k);
const PC = new Map();
/** face palette for a base colour: t top, l +y wall, r +x wall, o outline, h highlight edge, m mid edge */
export function pal(c) {
  let p = PC.get(c);
  if (!p) { p = { t: c, l: dk(c, .18), r: dk(c, .36), o: dk(c, .7), h: lt(c, .5), m: lt(dk(c, .18), .3) }; PC.set(c, p); }
  return p;
}

/* ---------- random ---------- */
/** deterministic rng: const r = rng(seed); r() -> [0,1) */
export function rng(s) { s = (Math.abs(s | 0) % 2147483646) + 1; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
export function hash2(x, y, s = 0) { let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }

/* ---------- target ---------- */
let T = null, MODE = 0, OFX = 0, OFY = 0, OFZ = 0;
// FL = "flip" mode: the asset is drawn mirrored across the x<->y diagonal (a free second orientation for every asset).
// Public world-space primitives swap their arguments at entry and then run un-flipped.
let FL = false;
const unfl = fn => { FL = false; try { fn(); } finally { FL = true; } };
const swLR = o => o ? Object.assign({}, o, { l: o.r, r: o.l, l2: o.r2, r2: o.l2 }) : o;
const revU = h => typeof h === 'function' ? (u, v, w, hh) => h(w - 1 - u, v, w, hh) : h;
/** true while drawing a flipped instance (rarely needed by art code) */
export const isFlipped = () => FL;
export const WS = (x, y, z) => [(x - y) * U, (x + y) * U / 2 - z * U];
/** world -> pixel in the current target (float) */
export const PW = (x, y, z) => { if (FL) { const t = x; x = y; y = t; } return [(x + OFX - y - OFY) * U - T.ox, (x + OFX + y + OFY) * U / 2 - (z + OFZ) * U - T.oy]; };
/** screen-space bounds [x0,y0,x1,y1] of a world AABB [x0,y0,z0,x1,y1,z1] */
export function screenBox(b) {
  let a = 1e9, c = 1e9, e = -1e9, f = -1e9;
  for (const x of [b[0], b[3]]) for (const y of [b[1], b[4]]) for (const z of [b[2], b[5]]) {
    const s = WS(x, y, z); if (s[0] < a) a = s[0]; if (s[1] < c) c = s[1]; if (s[0] > e) e = s[0]; if (s[1] > f) f = s[1];
  }
  return [a, c, e, f];
}
/**
 * Render draw() into a new pixel target. sb = screen bounds [x0,y0,x1,y1] (world-pixel space, before offset).
 * off = world offset [x,y,z] applied to everything drawn (and to sb).
 * Returns {w,h,x,y,buf,lb,hasLight}: buf = colour (ABGR uint32), lb = light layer (pixels that glow at night).
 */
export function render(sb, draw, off, pad = 3, flip = false) {
  off = off || [0, 0, 0];
  const o = WS(off[0], off[1], off[2] || 0);
  const x0 = Math.floor(sb[0] + o[0]) - pad, y0 = Math.floor(sb[1] + o[1]) - pad;
  const w = Math.max(1, Math.ceil(sb[2] + o[0]) - x0 + pad), h = Math.max(1, Math.ceil(sb[3] + o[1]) - y0 + pad);
  const prev = [T, MODE, OFX, OFY, OFZ, FL];
  T = { buf: new Uint32Array(w * h), lb: new Uint32Array(w * h), w, h, ox: x0, oy: y0, hasLight: false, cy0: 0, cy1: h };
  MODE = 0; OFX = off[0]; OFY = off[1]; OFZ = off[2] || 0; FL = !!flip;
  try { draw(); } finally { var out = T;[T, MODE, OFX, OFY, OFZ, FL] = prev; }
  return { w, h, x: x0, y: y0, buf: out.buf, lb: out.lb, hasLight: out.hasLight };
}
/*
 * Sliced rendering (perf: engine/sprites.js bakes sprites ahead of the camera a few milliseconds per frame instead of all at once).
 * renderJob() takes the same arguments as render(); every renderStep(job, rows) runs draw() once more, clipped to the next band of `rows`
 * target rows, and returns true when the last row is done; renderResult(job) is then exactly what render() would have returned.
 * Why it is the same picture: every pixel write goes through px() or fill() -> put(), and nothing ever reads the target back, so a pass
 * clipped to rows [cy0, cy1) writes exactly the pixels render() writes in those rows, in the same order. draw() must give the same
 * drawing each time it is called (art is deterministic; the callers drop a job when the season or the world changes).
 */
export function renderJob(sb, draw, off, pad = 3, flip = false) {
  off = off || [0, 0, 0];
  const o = WS(off[0], off[1], off[2] || 0);
  const x0 = Math.floor(sb[0] + o[0]) - pad, y0 = Math.floor(sb[1] + o[1]) - pad;
  const w = Math.max(1, Math.ceil(sb[2] + o[0]) - x0 + pad), h = Math.max(1, Math.ceil(sb[3] + o[1]) - y0 + pad);
  return { T: { buf: new Uint32Array(w * h), lb: new Uint32Array(w * h), w, h, ox: x0, oy: y0, hasLight: false, cy0: 0, cy1: 0 }, draw, off, flip: !!flip, w, h, row: 0 };
}
export function renderStep(job, rows) {
  const t = job.T; if (job.row >= t.h) return true;
  const prev = [T, MODE, OFX, OFY, OFZ, FL];
  T = t; t.cy0 = job.row; t.cy1 = Math.min(t.h, job.row + Math.max(1, rows | 0));
  MODE = 0; OFX = job.off[0]; OFY = job.off[1]; OFZ = job.off[2] || 0; FL = job.flip;
  try { job.draw(); } finally { [T, MODE, OFX, OFY, OFZ, FL] = prev; }
  job.row = t.cy1; return job.row >= t.h;
}
export function renderResult(job) { const t = job.T; return { w: t.w, h: t.h, x: t.ox, y: t.oy, buf: t.buf, lb: t.lb, hasLight: t.hasLight }; }
/** temporarily shift the drawing origin: at(x,y,z, ()=>{ ...draw in local coords... }) */
export function at(x, y, z, fn) { if (FL) { const t = x; x = y; y = t; } OFX += x; OFY += y; OFZ += z; try { fn(); } finally { OFX -= x; OFY -= y; OFZ -= z; } }

/* ---------- light modes ---------- */
/** glow(fn): pixels drawn inside only light up at night (lit windows, lamp bulbs). Invisible by day. */
export function glow(fn) { const m = MODE; MODE = 1; try { fn(); } finally { MODE = m; } }
/** lit(fn): pixels drawn inside are visible by day AND stay bright at night (neon, screens, signals). */
export function lit(fn) { const m = MODE; MODE = 2; try { fn(); } finally { MODE = m; } }

function put(i, c) {
  if (MODE === 0) { T.buf[i] = c; T.lb[i] = 0; }
  else if (MODE === 1) { T.lb[i] = c; T.hasLight = true; }
  else { T.buf[i] = c; T.lb[i] = c; T.hasLight = true; }
}
/** plot one pixel (target pixel coords) with a packed colour from C() */
export function px(x, y, c) { x = Math.floor(x); y = Math.floor(y); if (x < 0 || y < T.cy0 || x >= T.w || y >= T.cy1) return; put(y * T.w + x, c); }   // cy0..cy1 = the row band being drawn (the whole target in render(); see renderStep)
/** plot one pixel with a hex colour */
export function pxh(x, y, h) { px(x, y, C(h)); }
/** plot pixel offset (dx,dy) in screen pixels from a world anchor */
export function spx(x, y, z, dx, dy, h) { if (FL) dx = -dx; const s = PW(x, y, z); px(Math.round(s[0]) + dx, Math.round(s[1]) + dy, C(h)); }
/** filled screen-space rect anchored at pixel coords */
export function rect(x, y, w, h, hex) { const c = C(hex); for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) px(x + i, y + j, c); }

/**
 * Fill a convex polygon given in target pixel coords.
 * h: hex colour | pattern fn (px,py)=>hex|null.  h2: optional 2nd hex for a checker dither, or 'glass' (50% see-through).
 */
export function fill(p, h, h2) {
  const fn = typeof h === 'function' ? h : null;
  const c = fn ? 0 : C(h), gl = h2 === 'glass', c2 = h2 && !gl ? C(h2) : 0;
  let y0 = 1e9, y1 = -1e9; for (const q of p) { if (q[1] < y0) y0 = q[1]; if (q[1] > y1) y1 = q[1]; }
  y0 = Math.max(T.cy0, Math.ceil(y0 - .5)); y1 = Math.min(T.cy1 - 1, Math.floor(y1 - .5)); const n = p.length, W = T.w;
  for (let y = y0; y <= y1; y++) {
    const s = y + .5; let l = 1e9, r = -1e9;
    for (let i = 0; i < n; i++) { const a = p[i], b = p[(i + 1) % n]; if ((a[1] <= s) !== (b[1] <= s)) { const x = a[0] + (s - a[1]) / (b[1] - a[1]) * (b[0] - a[0]); if (x < l) l = x; if (x > r) r = x; } }
    if (l > r) continue; const xa = Math.max(0, Math.ceil(l - .5)), xb = Math.min(W - 1, Math.floor(r - .5)), row = y * W;
    if (fn) { for (let x = xa; x <= xb; x++) { const hh = fn(x, y); if (hh) put(row + x, C(hh)); } }
    else for (let x = xa; x <= xb; x++) { const odd = (x + y) & 1; if (gl && odd) continue; put(row + x, c2 && odd ? c2 : c); }
  }
}
/** 1px line in target pixel coords */
export function line(a, b, h) {
  let x0 = Math.round(a[0]), y0 = Math.round(a[1]); const x1 = Math.round(b[0]), y1 = Math.round(b[1]), c = C(h), dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy;
  for (let k = 0; k < 8000; k++) { px(x0, y0, c); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
}
/** filled ellipse in target pixel coords (h2 = dither colour or 'glass') */
export function ellipse(cx, cy, rx, ry, h, h2) {
  const c = C(h), gl = h2 === 'glass', c2 = h2 && !gl ? C(h2) : 0;
  for (let y = Math.ceil(cy - ry); y <= Math.floor(cy + ry); y++) {
    const t = (y - cy) / ry, hw = rx * Math.sqrt(Math.max(0, 1 - t * t));
    for (let x = Math.ceil(cx - hw); x <= Math.floor(cx + hw); x++) { const odd = (x + y) & 1; if (gl && odd) continue; px(x, y, c2 && odd ? c2 : c); }
  }
}

/* ---------- world-space primitives ---------- */
/** fill a convex polygon given as world points [[x,y,z],...] */
export const fq = (p, h, h2) => fill(p.map(q => PW(q[0], q[1], q[2])), h, h2); // PW handles flip
/** 1px line between two world points */
export const lw = (a, b, h) => line(PW(a[0], a[1], a[2]), PW(b[0], b[1], b[2]), h);

// Pattern fns for walls get (u, v, w, h): u = px from the wall's left edge on screen, v = px up from the wall's bottom edge.
function wallFn(fn, sx0, sy0, slope, wpx, hpx) {
  return (X, Y) => { const u = Math.floor(X + .5 - sx0); const v = Math.floor(sy0 + (X + .5 - sx0) * slope - (Y + .5)); return fn(u < 0 ? 0 : u, v < 0 ? 0 : v, wpx, hpx); };
}
/** wall on a constant-y plane (faces +y, the front-left wall). h = hex | pattern fn(u,v,w,h) */
export function qy(x0, x1, y, z0, z1, h, h2) {
  if (FL) return unfl(() => qx(y, x0, x1, z0, z1, revU(h), h2));
  if (typeof h === 'function') { const s = PW(x0, y, z0); h = wallFn(h, s[0], s[1], .5, (x1 - x0) * U, (z1 - z0) * U); }
  fq([[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]], h, h2);
}
/** wall on a constant-x plane (faces +x, the right wall). Pattern u runs from y1 (screen-left) to y0. */
export function qx(x, y0, y1, z0, z1, h, h2) {
  if (FL) return unfl(() => qy(y0, y1, x, z0, z1, revU(h), h2));
  if (typeof h === 'function') { const s = PW(x, y1, z0); h = wallFn(h, s[0], s[1], -.5, (y1 - y0) * U, (z1 - z0) * U); }
  fq([[x, y0, z0], [x, y1, z0], [x, y1, z1], [x, y0, z1]], h, h2);
}
/** horizontal quad at height z. h = hex | pattern fn(wx,wy) with local world coords of the pixel */
export function qz(x0, x1, y0, y1, z, h, h2) {
  if (FL) { const f = h; return unfl(() => qz(y0, y1, x0, x1, z, typeof f === 'function' ? (a, b) => f(b, a) : f, h2)); }
  if (typeof h === 'function') {
    const fn = h, ox = T.ox, oy = T.oy, zz = z + OFZ, fx = OFX, fy = OFY;
    h = (X, Y) => { const a = (X + .5 + ox) / U, b = (Y + .5 + oy + zz * U) / (U / 2); return fn((a + b) / 2 - fx, (b - a) / 2 - fy); };
  }
  fq([[x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]], h, h2);
}
/** outline of a box silhouette + inner highlight edges */
export function outline(x, y, z, w, d, h, c) {
  if (FL) return unfl(() => outline(y, x, z, d, w, h, c));
  const p = pal(c), s = [[x, y, z + h], [x + w, y, z + h], [x + w, y, z], [x + w, y + d, z], [x, y + d, z], [x, y + d, z + h]];
  for (let i = 0; i < 6; i++) lw(s[i], s[(i + 1) % 6], p.o);
  lw([x + w, y + d, z + h], [x, y + d, z + h], p.h); lw([x + w, y + d, z + h], [x + w, y, z + h], p.h); if (h > .3) lw([x + w, y + d, z + h], [x + w, y + d, z], p.m);
}
/**
 * Solid box at (x,y,z) size (w,d,h) in base colour c.
 * o: { t,l,r: override face colour (hex or pattern fn), t2,l2,r2: dither colours, ol:false to skip outline }
 */
export function box(x, y, z, w, d, h, c, o) {
  if (FL) return unfl(() => box(y, x, z, d, w, h, c, swLR(o)));
  o = o || {}; const p = pal(c);
  qx(x + w, y, y + d, z, z + h, o.r || p.r, o.r2); qy(x, x + w, y + d, z, z + h, o.l || p.l, o.l2); qz(x, x + w, y, y + d, z + h, o.t || p.t, o.t2);
  if (o.ol !== false) outline(x, y, z, w, d, h, c);
}
/** checkerboard floor tiles of size s */
export function tiles(x0, x1, y0, y1, z, a, b, s = 1) {
  if (FL) return unfl(() => tiles(y0, y1, x0, x1, z, a, b, s));
  let i = 0; for (let x = x0; x < x1 - 1e-6; x += s, i++) { let j = 0; for (let y = y0; y < y1 - 1e-6; y += s, j++) qz(x, Math.min(x + s, x1), y, Math.min(y + s, y1), z, (i + j) % 2 ? a : b); }
}
/** vertical cylinder centred at (x,y), base z, radius r, height h */
export function cyl(x, y, z, r, h, c, o) {
  if (FL) return unfl(() => cyl(y, x, z, r, h, c, o));
  o = o || {}; const p = pal(c), b = PW(x, y, z), t = PW(x, y, z + h), rx = r * U * 1.414, ry = rx / 2;
  const cl = C(o.l || p.l), cr = C(o.r || p.r), x0 = Math.ceil(b[0] - rx), x1 = Math.floor(b[0] + rx);
  for (let X = x0; X <= x1; X++) { const k = (X - b[0]) / rx, e = ry * Math.sqrt(Math.max(0, 1 - k * k)); for (let Y = Math.round(t[1]); Y <= Math.round(b[1] + e); Y++) px(X, Y, k > .15 ? cr : cl); }
  ellipse(t[0], t[1], rx, ry, o.t || p.t, o.t2);
  if (o.ol !== false) { const oc = C(p.o); for (let X = x0; X <= x1; X++) { const k = (X - b[0]) / rx, e = ry * Math.sqrt(Math.max(0, 1 - k * k)); px(X, Math.round(b[1] + e) + 1, oc); px(X, Math.round(t[1] - e) - 1, oc); } for (let Y = Math.round(t[1]); Y <= Math.round(b[1]); Y++) { px(x0 - 1, Y, oc); px(x1 + 1, Y, oc); } }
}
/** shaded ball (tree canopies, bushes, lamps). r in world units; squash<1 flattens vertically */
export function ball(x, y, z, r, c, o) {
  if (FL) return unfl(() => ball(y, x, z, r, c, o));
  o = o || {}; const s = PW(x, y, z), R = r * U * 1.2, Ry = R * (o.squash || .85), cT = C(o.t || lt(c, .22)), cM = C(c), cD = C(o.d || dk(c, .3)), oc = C(dk(c, .7));
  for (let Y = Math.floor(s[1] - Ry) - 1; Y <= Math.ceil(s[1] + Ry) + 1; Y++) for (let X = Math.floor(s[0] - R) - 1; X <= Math.ceil(s[0] + R) + 1; X++) {
    const a = (X - s[0]) / R, b = (Y - s[1]) / Ry, d = a * a + b * b; if (d > 1.12) continue; if (d > 1) { if (o.ol !== false) px(X, Y, oc); continue; }
    const li = -a * .55 - b * .8 + (((X + Y) & 1) ? .12 : -.12); px(X, Y, li > .42 ? cT : li > -.22 ? cM : cD);
  }
}
/** cone / spire: base centre (x,y,z), radius r, height h */
export function cone(x, y, z, r, h, c) {
  if (FL) return unfl(() => cone(y, x, z, r, h, c));
  const p = pal(c), b = PW(x, y, z), t = PW(x, y, z + h), rx = r * U * 1.414, ry = rx / 2;
  ellipse(b[0], b[1], rx, ry, p.r);
  fill([[b[0] - rx, b[1]], [b[0] + rx * .15, b[1] + ry], [t[0], t[1]]], p.l); fill([[b[0] + rx * .15, b[1] + ry], [b[0] + rx, b[1]], [t[0], t[1]]], p.r);
  line([b[0] - rx, b[1]], t, p.o); line([b[0] + rx, b[1]], t, p.o);
}

/* ---------- roofs ---------- */
/**
 * Gable roof over footprint (x,y,w,d) starting at height z, ridge h above z.
 * axis 'x': ridge runs along x (slopes face +y and -y, triangular gable end on the +x wall).
 * axis 'y': ridge runs along y (slopes face +x and -x, gable end on the +y wall).
 * c = roof colour (hex or pattern via o.f), o.wall = gable-end wall colour, o.over = overhang (default .15)
 */
export function gable(x, y, z, w, d, h, axis, c, o) {
  if (FL) return unfl(() => gable(y, x, z, d, w, h, axis === 'x' ? 'y' : 'x', c, o));
  o = o || {}; const p = pal(c), ov = o.over === undefined ? .15 : o.over, wc = o.wall || p.r;
  if (axis === 'x') {
    const m = y + d / 2, a = x - ov, b = x + w + ov;
    fq([[a, y - ov, z], [b, y - ov, z], [b, m, z + h], [a, m, z + h]], dk(c, .45));
    fq([[x + w, y, z], [x + w, y + d, z], [x + w, m, z + h]], typeof wc === 'string' ? dk(wc, .2) : wc);
    fq([[a, y + d + ov, z - ov * .5], [b, y + d + ov, z - ov * .5], [b, m, z + h], [a, m, z + h]], o.f || p.t, o.f2);
    lw([a, m, z + h], [b, m, z + h], p.h); lw([a, y + d + ov, z - ov * .5], [b, y + d + ov, z - ov * .5], p.o); lw([b, y + d + ov, z - ov * .5], [b, m, z + h], p.o); lw([a, y + d + ov, z - ov * .5], [a, m, z + h], p.o);
  } else {
    const m = x + w / 2, a = y - ov, b = y + d + ov;
    fq([[x - ov, a, z], [x - ov, b, z], [m, b, z + h], [m, a, z + h]], dk(c, .45));
    fq([[x, y + d, z], [x + w, y + d, z], [m, y + d, z + h]], typeof wc === 'string' ? dk(wc, .05) : wc);
    fq([[x + w + ov, a, z - ov * .5], [x + w + ov, b, z - ov * .5], [m, b, z + h], [m, a, z + h]], o.f || p.l, o.f2);
    lw([m, a, z + h], [m, b, z + h], p.h); lw([x + w + ov, a, z - ov * .5], [x + w + ov, b, z - ov * .5], p.o); lw([x + w + ov, b, z - ov * .5], [m, b, z + h], p.o); lw([x + w + ov, a, z - ov * .5], [m, a, z + h], p.o);
  }
}
/** hip / pyramid roof: four slopes meeting at a ridge (or a point when w==d). inset = flat-top fraction 0..1 */
export function hip(x, y, z, w, d, h, c, o) {
  if (FL) return unfl(() => hip(y, x, z, d, w, h, c, swLR(o)));
  o = o || {}; const p = pal(c), ov = o.over === undefined ? .15 : o.over, r = Math.min(w, d) / 2 * (1 - (o.inset || 0));
  const A = [x - ov, y - ov], B = [x + w + ov, y - ov], Cc = [x + w + ov, y + d + ov], D = [x - ov, y + d + ov];
  const a = [x + r, y + r], b = [x + w - r, y + r], cc = [x + w - r, y + d - r], dd = [x + r, y + d - r], zt = z + h;
  const P = (q, zz) => [q[0], q[1], zz];
  fq([P(A, z), P(B, z), P(b, zt), P(a, zt)], dk(c, .45)); fq([P(A, z), P(D, z), P(dd, zt), P(a, zt)], dk(c, .3));
  fq([P(B, z), P(Cc, z), P(cc, zt), P(b, zt)], o.r || p.r); fq([P(D, z), P(Cc, z), P(cc, zt), P(dd, zt)], o.l || p.t);
  if (o.inset) fq([P(a, zt), P(b, zt), P(cc, zt), P(dd, zt)], lt(c, .15));
  lw(P(Cc, z), P(cc, zt), p.h); lw(P(D, z), P(dd, zt), p.o); lw(P(B, z), P(b, zt), p.o); lw(P(dd, zt), P(cc, zt), p.h); lw(P(cc, zt), P(b, zt), p.h);
  lw(P(D, z), P(Cc, z), p.o); lw(P(Cc, z), P(B, z), p.o);
}

/* ---------- material patterns (use as the colour argument of qy/qx/qz or box o.l/o.r/o.t) ---------- */
export const PAT = {
  /** running-bond brick */
  brick: (c, mortar) => { const m = mortar || dk(c, .3), c2 = dk(c, .1), c3 = lt(c, .12); return (u, v) => { const row = Math.floor(v / 3); if (v % 3 === 0) return m; const uu = u + (row & 1) * 3; if (uu % 6 === 0) return m; const k = hash2(Math.floor(uu / 6), row); return k < .15 ? c2 : k > .88 ? c3 : c; }; },
  /** horizontal clapboard siding */
  siding: (c, step = 3) => { const s = dk(c, .22); return (u, v) => v % step === 0 ? s : c; },
  /** vertical planks / corrugated metal */
  planks: (c, step = 4) => { const s = dk(c, .22); return (u, v) => u % step === 0 ? s : c; },
  /** large stone blocks */
  stone: (c) => { const m = dk(c, .28), c2 = lt(c, .1); return (u, v) => { const row = Math.floor(v / 5); if (v % 5 === 0) return m; const uu = u + (row & 1) * 5; if (uu % 10 === 0) return m; return hash2(Math.floor(uu / 10), row, 7) > .7 ? c2 : c; }; },
  /** rough stucco speckle */
  stucco: (c) => { const a = dk(c, .08), b = lt(c, .1); return (u, v) => { const k = hash2(u, v, 3); return k < .06 ? a : k > .95 ? b : c; }; },
  /** horizontal stripes of two colours */
  stripes: (a, b, step = 4) => (u, v) => (Math.floor(v / step) & 1) ? a : b,
  /** vertical stripes (awnings) */
  vstripes: (a, b, step = 4) => (u, v) => (Math.floor(u / step) & 1) ? a : b,
  /** roof shingles for wall-like use */
  shingle: (c) => { const s = dk(c, .25), c2 = lt(c, .1); return (u, v) => { const row = Math.floor(v / 3); if (v % 3 === 0) return s; return ((u + (row & 1) * 2) % 4 === 0) ? s : hash2(u >> 2, row, 5) > .8 ? c2 : c; }; },
  /** floor pattern: square tiles of size s world units (for qz) */
  ftile: (a, b, s = 1) => (x, y) => ((Math.floor(x / s) + Math.floor(y / s)) & 1) ? a : b,
  /** floor pattern: wood boards running along x */
  fboards: (c, wdt = .5) => { const s = dk(c, .2), c2 = lt(c, .08); return (x, y) => { const r = Math.floor(y / wdt); const fy = y / wdt - r; if (fy < .12) return s; const xx = x + (r & 1) * .9; return (xx % 1.8) < .07 ? s : hash2(Math.floor(xx / 1.8), r, 9) > .6 ? c2 : c; }; },
};

/* ---------- windows ---------- */
/**
 * Window on a +y wall. Day: glass; night: glows warm when on (default: on with prob. via r()).
 * o: { on: bool, frame: hex, glass:[hexA,hexB], glowc:[hexA,hexB], sill: bool, mullion: 'cross'|'v'|'h'|null }
 */
export function winY(x0, x1, y, z0, z1, o) {
  if (FL) return unfl(() => winX(y, x0, x1, z0, z1, o));
  o = o || {}; const g = o.glass || ['#7fb6d0', '#9fcbe0'], gc = o.glowc || ['#ffd98a', '#f4c870'], fr = o.frame || '#4a4458';
  qy(x0, x1, y, z0, z1, g[0], g[1]);
  const a = PW(x0, y, z1), b = PW(x1, y, z1); // sky reflection glint
  if ((x1 - x0) * U >= 5) { px(Math.round(a[0]) + 1, Math.round(a[1]) + 1, C('#e8f6fb')); px(Math.round(a[0]) + 2, Math.round(a[1]) + 2, C('#e8f6fb')); }
  if (o.on !== false) glow(() => qy(x0, x1, y, z0, z1, gc[0], gc[1]));
  const mx = (x0 + x1) / 2, mz = (z0 + z1) / 2;
  const mull = () => { if (o.mullion === 'cross' || o.mullion === 'v') lw([mx, y, z0], [mx, y, z1], fr); if (o.mullion === 'cross' || o.mullion === 'h') lw([x0, y, mz], [x1, y, mz], fr); };
  mull(); if (o.on !== false && o.mullion) glow(() => { const f = dk(gc[1], .45); if (o.mullion !== 'h') lw([mx, y, z0], [mx, y, z1], f); if (o.mullion !== 'v') lw([x0, y, mz], [x1, y, mz], f); });
  lw([x0, y, z0], [x1, y, z0], fr); lw([x0, y, z1], [x1, y, z1], fr); lw([x0, y, z0], [x0, y, z1], fr); lw([x1, y, z0], [x1, y, z1], fr);
  if (o.sill) lw([x0 - .06, y, z0 - .06], [x1 + .06, y, z0 - .06], o.sillc || '#e8e2d4');
}
/** Window on a +x wall (spanning y0..y1). Same options as winY. */
export function winX(x, y0, y1, z0, z1, o) {
  if (FL) return unfl(() => winY(y0, y1, x, z0, z1, o));
  o = o || {}; const g = o.glass || ['#6aa2bd', '#86bcd2'], gc = o.glowc || ['#f4c870', '#e8b860'], fr = o.frame || '#3e394c';
  qx(x, y0, y1, z0, z1, g[0], g[1]);
  if (o.on !== false) glow(() => qx(x, y0, y1, z0, z1, gc[0], gc[1]));
  const my = (y0 + y1) / 2, mz = (z0 + z1) / 2;
  if (o.mullion === 'cross' || o.mullion === 'v') lw([x, my, z0], [x, my, z1], fr); if (o.mullion === 'cross' || o.mullion === 'h') lw([x, y0, mz], [x, y1, mz], fr);
  if (o.on !== false && o.mullion) glow(() => { const f = dk(gc[1], .45); if (o.mullion !== 'h') lw([x, my, z0], [x, my, z1], f); if (o.mullion !== 'v') lw([x, y0, mz], [x, y1, mz], f); });
  lw([x, y0, z0], [x, y1, z0], fr); lw([x, y0, z1], [x, y1, z1], fr); lw([x, y0, z0], [x, y0, z1], fr); lw([x, y1, z0], [x, y1, z1], fr);
  if (o.sill) lw([x, y0 - .06, z0 - .06], [x, y1 + .06, z0 - .06], o.sillc || '#d0cabc');
}

/* ---------- 3x5 pixel font ---------- */
const FONT = {
  A: '25755', B: '65656', C: '34443', D: '65556', E: '74647', F: '74644', G: '34553', H: '55755', I: '72227', J: '11152', K: '55655', L: '44447', M: '57555', N: '65555', O: '25552', P: '65644', Q: '25563', R: '65655', S: '34216', T: '72222', U: '55557', V: '55552', W: '55575', X: '55255', Y: '55222', Z: '71247',
  0: '75557', 1: '26227', 2: '61247', 3: '61216', 4: '55711', 5: '74616', 6: '34757', 7: '71222', 8: '75757', 9: '75716',
  ' ': '00000', '.': '00002', ',': '00024', '!': '22202', '?': '61202', '-': '00700', '+': '02720', ':': '02020', "'": '22000', '/': '11244', '&': '25256', '%': '51245', '*': '05250', '^': '05720', '$': '37276', '#': '57575', '>': '42124', '<': '12421', '=': '07070',
};
/** width in px of a string in the 3x5 font */
export const textW = s => s.length * 4 - 1;
function glyphs(str, plot) { str = String(str).toUpperCase(); for (let i = 0; i < str.length; i++) { const g = FONT[str[i]] || FONT['?']; for (let r = 0; r < 5; r++) { const bits = +g[r]; for (let b = 0; b < 3; b++) if (bits & (4 >> b)) plot(i * 4 + b, r); } } }
/** screen-aligned text; (x,y) = target pixel of top-left */
export function textS(str, x, y, h) { const c = C(h); glyphs(str, (u, v) => px(x + u, y + v, c)); }
/** text painted on a +y wall, top-left at world (x,y,z); reads left->right along +x */
export function textY(str, x, y, z, h) { if (FL) return unfl(() => textX(str, y, x + textW(str) / U, z, h)); const s = PW(x, y, z), X = Math.round(s[0]), Y = Math.round(s[1]), c = C(h); glyphs(str, (u, v) => px(X + u, Y + (u >> 1) + v, c)); }
/** text painted on a +x wall, top-left at world (x, yHigh, z); reads left->right toward -y */
export function textX(str, x, y, z, h) { if (FL) return unfl(() => textY(str, y - textW(str) / U, x, z, h)); const s = PW(x, y, z), X = Math.round(s[0]), Y = Math.round(s[1]), c = C(h); glyphs(str, (u, v) => px(X + u, Y - (u >> 1) + v, c)); }
/** sign board on a +y wall with centred text. Board spans x0..x1, z0..z1 at plane y. o.lit keeps it bright at night */
export function signY(str, x0, x1, y, z0, z1, bg, fg, o) {
  if (FL) return unfl(() => signX(str, y, x0, x1, z0, z1, bg, fg, o));
  const d = () => { qy(x0, x1, y, z0, z1, bg); const w = textW(str), pw = (x1 - x0) * U, s = PW(x0, y, z1), X = Math.round(s[0] + (pw - w) / 2), Y = Math.round(s[1] + ((z1 - z0) * U - 5) / 2), c = C(fg), bx = Math.round(s[0]); glyphs(str, (u, v) => px(X + u, Y + ((X + u - bx) >> 1) + v, c)); };
  if (o && o.lit) lit(d); else d();
  if (!o || o.frame !== false) { const f = dk(bg, .5); lw([x0, y, z0], [x1, y, z0], f); lw([x0, y, z1], [x1, y, z1], f); }
}
/** sign board on a +x wall spanning y0..y1 */
export function signX(str, x, y0, y1, z0, z1, bg, fg, o) {
  if (FL) return unfl(() => signY(str, y0, y1, x, z0, z1, bg, fg, o));
  const d = () => { qx(x, y0, y1, z0, z1, bg); const w = textW(str), pw = (y1 - y0) * U, s = PW(x, y1, z1), X = Math.round(s[0] + (pw - w) / 2), Y = Math.round(s[1] + ((z1 - z0) * U - 5) / 2), c = C(fg), bx = Math.round(s[0]); glyphs(str, (u, v) => px(X + u, Y - ((X + u - bx) >> 1) + v, c)); };
  if (o && o.lit) lit(d); else d();
  if (!o || o.frame !== false) { const f = dk(bg, .5); lw([x, y0, z0], [x, y1, z0], f); lw([x, y0, z1], [x, y1, z1], f); }
}

/* ---------- season helpers ---------- */
/** grass colour pair [a,b] for the current season */
export function grassC() { return [['#74b85c', '#80c468'], ['#6fae5a', '#79b964'], ['#9aa552', '#a8ae58'], ['#e6edf2', '#d8e2ea']][ENV.season]; }
/** foliage base colour for the current season. kind: 'leaf' (deciduous), 'pine' (evergreen), 'blossom'. v in [0,1) varies hue. Returns null for bare winter trees. */
export function foliage(kind = 'leaf', v = 0) {
  const s = ENV.season;
  if (kind === 'pine') return s === 3 ? '#4f7f6a' : ['#3f8a55', '#357a4a', '#3a7548'][Math.floor(v * 3) % 3];
  if (s === 0) return kind === 'blossom' ? ['#f2a7c3', '#f7c1d4', '#fbe3ea'][Math.floor(v * 3) % 3] : ['#7cc75e', '#8fd06a', '#6dbb58'][Math.floor(v * 3) % 3];
  if (s === 1) return ['#4f9a45', '#5aa84f', '#458c40', '#62b356'][Math.floor(v * 4) % 4];
  if (s === 2) return ['#e08a2c', '#d9562b', '#e8b63a', '#c9792a', '#b8432a'][Math.floor(v * 5) % 5];
  return null;
}
