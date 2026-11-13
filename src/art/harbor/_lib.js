// Shared helpers for the harbour / industrial kit. Local to this folder (not an asset module: no default export array).
import { U, ENV, C, PW, px, fq, lw, qy, qx, qz, box, cyl, glow, lit, dk, lt, PAT, winY, winX, isFlipped, ellipse, spx, gable, hip, signY, signX, textY, textX } from '../../engine/raster.js';

export const SNOW = '#f4f8fb';
export const winter = () => ENV.season === 3;
/** wall shades that stay light-on-the-left when the asset is flipped: Lc for +y-facing surfaces, Rc for +x-facing */
export const Lc = c => isFlipped() ? dk(c, .36) : dk(c, .18);
export const Rc = c => isFlipped() ? dk(c, .18) : dk(c, .36);
export const METAL = '#5d6b78', DARK = '#2e2a3a', WOOD = '#9a6b42', ROPE = '#d9c08a', LAMP = '#fff2c4';

/** box whose walls use a PAT.* pattern with flip-correct shading */
export function walls(x, y, z, w, d, h, c, pat, o) { box(x, y, z, w, d, h, c, Object.assign({ l: pat(Lc(c)), r: pat(Rc(c)) }, o)); }

/* ---------- circles in a plane: pl 'y' (wall facing +y), 'x' (wall facing +x), 'z' (flat) ---------- */
export const P3 = (pl, c, a, b) => pl === 'y' ? [c[0] + a, c[1], c[2] + b] : pl === 'x' ? [c[0], c[1] + a, c[2] + b] : [c[0] + a, c[1] + b, c[2]];
const TAU = Math.PI * 2;
export function disc(pl, c, r, h, h2, n = 18, a0 = 0, a1 = TAU) { const p = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; p.push(P3(pl, c, Math.cos(a) * r, Math.sin(a) * r)); } fq(p, h, h2); }
export function ring(pl, c, r0, r1, h, n = 18, a0 = 0, a1 = TAU) {
  for (let i = 0; i < n; i++) { const a = a0 + (a1 - a0) * i / n, b = a0 + (a1 - a0) * (i + 1) / n;
    fq([P3(pl, c, Math.cos(a) * r0, Math.sin(a) * r0), P3(pl, c, Math.cos(b) * r0, Math.sin(b) * r0), P3(pl, c, Math.cos(b) * r1, Math.sin(b) * r1), P3(pl, c, Math.cos(a) * r1, Math.sin(a) * r1)], typeof h === 'function' ? h(i) : h); }
}
export function circ(pl, c, r, h, n = 24, a0 = 0, a1 = TAU) { for (let i = 0; i < n; i++) { const a = a0 + (a1 - a0) * i / n, b = a0 + (a1 - a0) * (i + 1) / n; lw(P3(pl, c, Math.cos(a) * r, Math.sin(a) * r), P3(pl, c, Math.cos(b) * r, Math.sin(b) * r), h); } }

/* ---------- round things ---------- */
/** front surface band of a vertical cylinder (no top cap): stripes, hoops */
export function band(x, y, z, r, h, c) {
  const b = PW(x, y, z), t = PW(x, y, z + h), rx = r * U * 1.414, ry = rx / 2, cl = C(dk(c, .18)), cr = C(dk(c, .36));
  for (let X = Math.ceil(b[0] - rx); X <= Math.floor(b[0] + rx); X++) { const k = (X - b[0]) / rx, e = ry * Math.sqrt(Math.max(0, 1 - k * k)); for (let Y = Math.round(t[1] + e); Y <= Math.round(b[1] + e); Y++) px(X, Y, k > .15 ? cr : cl); }
}
/** tapered round tower. col = hex or f(0..1 up the height) => hex */
export function taper(x, y, z, r0, r1, h, col, o) {
  o = o || {}; const b = PW(x, y, z), steps = Math.ceil(h * U * 2), cf = typeof col === 'function' ? col : () => col;
  for (let i = 0; i <= steps; i++) {
    const f = i / steps, r = (r0 + (r1 - r0) * f) * U * 1.414, ry = r / 2, cy = b[1] - f * h * U, c = cf(f), cl = C(dk(c, .16)), cr = C(dk(c, .38)), ch = C(lt(c, .25)), oc = C(dk(c, .7));
    const x0 = Math.ceil(b[0] - r), x1 = Math.floor(b[0] + r);
    for (let X = x0; X <= x1; X++) { const k = (X - b[0]) / r, e = ry * Math.sqrt(Math.max(0, 1 - k * k)); if (i === 0) px(X, Math.round(cy + e) + 1, oc); px(X, Math.round(cy + e), k > .15 ? cr : k > -.45 && k < -.25 ? ch : cl); }
    px(x0 - 1, Math.round(cy), oc); px(x1 + 1, Math.round(cy), oc);
  }
  const t = PW(x, y, z + h), tc = cf(1); if (o.cap !== false) { ellipse(t[0], t[1], r1 * U * 1.414 + 1, r1 * U * .707 + 1, dk(tc, .7)); ellipse(t[0], t[1], r1 * U * 1.414, r1 * U * .707, o.t || tc); }
}
/**
 * horizontal cylinder (or vault). axis 'x': runs from (x,y,z) to (x+len,y,z), (y,z) = centre of the circle; axis 'y' likewise along y.
 * o: { a0,a1: angle range of the shell in degrees (default full visible), cap: colour of the end cap or false, capA: [a0,a1] deg of the cap sector, snow }
 */
export function hcyl(axis, x, y, z, len, r, c, o) {
  o = o || {}; const lo = Math.max(-63, o.a0 === undefined ? -63 : o.a0), hi = Math.min(117, o.a1 === undefined ? 117 : o.a1);
  const side = (axis === 'x') ? Lc(c) : Rc(c), n = Math.max(6, Math.round((hi - lo) / 12));
  const pt = (t, a) => { const ca = Math.cos(a) * r, sa = Math.sin(a) * r; return axis === 'x' ? [x + t, y + ca, z + sa] : [x + ca, y + t, z + sa]; };
  for (let i = 0; i < n; i++) {
    const A = hi + (lo - hi) * i / n, B = hi + (lo - hi) * (i + 1) / n, m = (A + B) / 2, a = A * Math.PI / 180, b = B * Math.PI / 180;
    let col = m > 96 ? dk(c, .1) : m > 62 ? lt(c, .22) : m > 34 ? c : m > 0 ? side : m > -30 ? dk(side, .14) : dk(side, .3);
    if (o.snow && winter() && m > 48) col = m > 62 ? SNOW : null;
    if (col) fq([pt(0, a), pt(len, a), pt(len, b), pt(0, b)], col); else { fq([pt(0, a), pt(len, a), pt(len, b), pt(0, b)], c); fq([pt(0, a), pt(len, a), pt(len, b), pt(0, b)], SNOW, 'glass'); }
  }
  const oc = dk(c, .7), ah = hi * Math.PI / 180, al = lo * Math.PI / 180;
  lw(pt(0, ah), pt(len, ah), oc); lw(pt(0, al), pt(len, al), oc);
  const ca = o.capA || [0, 360], pl = axis === 'x' ? 'x' : 'y', cc = axis === 'x' ? [x + len, y, z] : [x, y + len, z];
  if (o.cap !== false) { disc(pl, cc, r, o.cap || (axis === 'x' ? Rc(c) : Lc(c)), null, 20, ca[0] * Math.PI / 180, ca[1] * Math.PI / 180); circ(pl, cc, r, oc, 24, ca[0] * Math.PI / 180, ca[1] * Math.PI / 180); }
  // far end silhouette
  const c0 = axis === 'x' ? [x, y, z] : [x, y, z]; circ(pl, c0, r, oc, 14, al, ah);
}

/* ---------- snow ---------- */
export function snowTop(x0, x1, y0, y1, z, inset = .18) { if (!winter()) return; qz(x0, x1, y0, y1, z, SNOW, 'glass'); if (x1 - x0 > inset * 2 && y1 - y0 > inset * 2) qz(x0 + inset, x1 - inset, y0 + inset, y1 - inset, z, SNOW); }
/** snow on a slope: r0,r1 = ridge end points, e0,e1 = eave end points */
export function snowSlope(r0, r1, e0, e1, k = .62) { if (!winter()) return; const m = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; fq([r0, r1, m(r1, e1, k), m(r0, e0, k)], SNOW); fq([m(r0, e0, k), m(r1, e1, k), m(r1, e1, .9), m(r0, e0, .9)], SNOW, 'glass'); }
/** gable roof + winter snow on the visible slope */
export function gableS(x, y, z, w, d, h, axis, c, o) {
  gable(x, y, z, w, d, h, axis, c, o); const ov = (o && o.over !== undefined) ? o.over : .15;
  if (axis === 'x') snowSlope([x - ov, y + d / 2, z + h], [x + w + ov, y + d / 2, z + h], [x - ov, y + d + ov, z], [x + w + ov, y + d + ov, z]);
  else snowSlope([x + w / 2, y - ov, z + h], [x + w / 2, y + d + ov, z + h], [x + w + ov, y - ov, z], [x + w + ov, y + d + ov, z]);
}
/** flat roof with a parapet of height ph, thickness t, drawn on top of a box whose top is at z. Roof floor is at z. */
export function parapet(x, y, z, w, d, ph, t, wc, fc) {
  box(x, y, z, w, d, ph, wc, { ol: false }); const cap = lt(wc, .25);
  qz(x, x + w, y, y + d, z + ph, cap); qz(x + t, x + w - t, y + t, y + d - t, z + ph, Lc(wc));
  qx(x + t, y + t, y + d - t, z, z + ph, Rc(wc)); qy(x + t, x + w - t, y + t, z, z + ph, Lc(wc));
  qz(x + t, x + w - t - ph, y + t, y + d - t - ph, z, fc, dk(fc, .06));
  if (winter()) { qz(x + t, x + w - t - ph, y + t, y + d - t - ph, z, SNOW); qz(x + t + .4, x + w - t - ph - .4, y + t + .4, y + d - t - ph - .4, z, SNOW, '#e6eef4'); }
  lw([x, y + d, z + ph], [x + w, y + d, z + ph], lt(wc, .5)); lw([x + w, y, z + ph], [x + w, y + d, z + ph], lt(wc, .5));
  lw([x, y, z + ph], [x + w, y, z + ph], dk(wc, .7)); lw([x, y, z + ph], [x, y + d, z + ph], dk(wc, .7));
}

/* ---------- wall-face abstraction: write a facade detail once, use it on the +y or the +x wall ---------- */
export function face(side, k) {
  return side === 'y' ? {
    side, k, sh: Lc, q: (a0, a1, z0, z1, h, h2) => qy(a0, a1, k, z0, z1, h, h2), w: (a0, a1, z0, z1, o) => winY(a0, a1, k, z0, z1, o),
    p: (a, z, off = 0) => [a, k + off, z], l: (a0, z0, a1, z1, h) => lw([a0, k, z0], [a1, k, z1], h),
    sign: (s, a0, a1, z0, z1, bg, fg, o) => signY(s, a0, a1, k, z0, z1, bg, fg, o), text: (s, a, z, h) => textY(s, a, k, z, h),
    box: (a, off, z, w, dep, h, c, o) => box(a, k + off, z, w, dep, h, c, o),
  } : {
    side, k, sh: Rc, q: (a0, a1, z0, z1, h, h2) => qx(k, a0, a1, z0, z1, h, h2), w: (a0, a1, z0, z1, o) => winX(k, a0, a1, z0, z1, o),
    p: (a, z, off = 0) => [k + off, a, z], l: (a0, z0, a1, z1, h) => lw([k, a0, z0], [k, a1, z1], h),
    sign: (s, a0, a1, z0, z1, bg, fg, o) => signX(s, k, a0, a1, z0, z1, bg, fg, o), text: (s, a, z, h) => textX(s, k, a, z, h),
    box: (a, off, z, w, dep, h, c, o) => box(k + off, a, z, dep, w, h, c, o),
  };
}
/** roller shutter. o.open 0..1, o.num text */
export function roll(F, a0, a1, z0, z1, c, o) {
  o = o || {}; const fr = dk(c, .55), zo = z0 + (z1 - z0) * (o.open || 0);
  F.q(a0 - .1, a1 + .1, z0, z1 + .12, F.sh(fr));
  if (o.open) { F.q(a0, a1, z0, zo, '#2c2638'); glow(() => F.q(a0, a1, z0, zo, '#f2c466', '#dba648')); if (o.inside) o.inside(); }
  F.q(a0, a1, zo, z1, PAT.siding(F.sh(c), 2)); F.l(a0, zo, a1, zo, dk(c, .6));
  if (o.num) F.text(o.num, (a0 + a1) / 2 + (F.side === 'y' ? -1 : 1) * (o.num.length * 4 - 1) / 32, z1 + .62, o.numc || '#f4f0e8');
}
/** person door .9 x 1.6 centred at a */
export function door(F, a, o) {
  o = o || {}; const z = o.z || 0, c = o.c || '#3f5a6e', fr = o.frame || '#e8e2d4';
  F.q(a - .52, a + .52, z, z + 1.72, F.sh(fr)); F.q(a - .45, a + .45, z, z + 1.6, F.sh(c));
  if (o.glass !== false) F.w(a - .28, a + .28, z + .8, z + 1.42, { on: o.on !== false, frame: dk(c, .5) });
  else { F.l(a - .3, z + .2, a + .3, z + .2, dk(c, .5)); F.l(a - .3, z + 1.35, a + .3, z + 1.35, dk(c, .5)); }
  const hp = F.p(a + (F.side === 'y' ? .34 : -.34), z + .78, .01); spx(hp[0], hp[1], hp[2], 0, 0, '#f2d27a'); spx(hp[0], hp[1], hp[2], 0, 1, '#f2d27a');
}
/** multi-pane industrial window */
export function gridWin(F, a0, a1, z0, z1, o) {
  o = o || {}; const cols = o.cols || 3, rows = o.rows || 2, fr = o.frame || '#4a4458';
  F.w(a0, a1, z0, z1, { on: o.on, frame: fr, sill: o.sill, glass: o.glass, glowc: o.glowc });
  const ln = c => { for (let i = 1; i < cols; i++) { const a = a0 + (a1 - a0) * i / cols; F.l(a, z0, a, z1, c); } for (let j = 1; j < rows; j++) { const z = z0 + (z1 - z0) * j / rows; F.l(a0, z, a1, z, c); } };
  ln(fr); if (o.on !== false) glow(() => ln('#a8782e'));
}
/** wall lamp with a soft cone of light on the wall */
export function lamp(F, a, z, o) {
  o = o || {}; const len = o.len || 1.3;
  glow(() => fq([F.p(a - .1, z, .01), F.p(a + .1, z, .01), F.p(a + .55, z - len, .01), F.p(a - .55, z - len, .01)], o.c || '#ffe39a', 'glass'));
  F.q(a - .16, a + .16, z, z + .1, '#39424e'); F.q(a - .06, a + .06, z + .1, z + .22, '#39424e');
  F.q(a - .1, a + .1, z - .07, z, '#f1e6bd'); glow(() => F.q(a - .1, a + .1, z - .07, z, LAMP));
}
export function ladder(F, a, z0, z1, c = '#4a4458') { F.l(a - .15, z0, a - .15, z1, c); F.l(a + .15, z0, a + .15, z1, c); for (let z = z0 + .25; z < z1; z += .3) F.l(a - .15, z, a + .15, z, c); }
export function pipe(F, a, z0, z1, c = '#6c7a83') { F.q(a - .06, a + .07, z0, z1, F.sh(c)); F.l(a - .06, z0, a - .06, z1, dk(c, .5)); for (let z = z0 + .5; z < z1; z += 1.2) F.l(a - .1, z, a + .1, z, dk(c, .55)); }
/** string of coloured bulbs between two world points */
export function bulbs(a, b, n, cols, sag = .25) {
  let pv = a; const pts = [];
  for (let i = 1; i <= n; i++) { const t = i / n, q = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t - Math.sin(t * Math.PI) * sag]; lw(pv, q, '#3a3446'); pv = q; if (i < n) pts.push(q); }
  lit(() => pts.forEach((q, i) => spx(q[0], q[1], q[2], 0, 1, cols[i % cols.length])));
}
export function rope(a, b, sag = .3, c = ROPE, n = 6) { let pv = a; for (let i = 1; i <= n; i++) { const t = i / n, q = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t - Math.sin(t * Math.PI) * sag]; lw(pv, q, c); pv = q; } }

/* ---------- little things reused across assets ---------- */
export function crate(x, y, z, s, c = '#b98a52', h) {
  h = h || s; box(x, y, z, s, s, h, c, { l: PAT.planks(Lc(c), 3), r: PAT.planks(Rc(c), 3) });
  const e = dk(c, .5); lw([x, y + s, z + h - .01], [x + s, y + s, z + h - .01], lt(c, .3)); lw([x + .02, y + s, z + .03], [x + s - .02, y + s, z + h - .05], e); lw([x + s, y + s - .02, z + .03], [x + s, y + .02, z + h - .05], e);
}
export function barrel(x, y, z, c = '#8a5a34', r = .28, h = .75) {
  cyl(x, y, z, r, h, c, { t: dk(c, .25) }); const m = '#4d5560';
  band(x, y, z + h * .12, r, .06, m); band(x, y, z + h * .8, r, .06, m); band(x, y, z + h * .42, r + .015, h * .16, lt(c, .12));
}
export function drum(x, y, z, c = '#3f7fbf', r = .28, h = .8) { cyl(x, y, z, r, h, c, { t: lt(c, .15) }); band(x, y, z + h * .3, r, .04, dk(c, .4)); band(x, y, z + h * .65, r, .04, dk(c, .4)); }
export function pallet(x, y, z, w = 1.2, d = 1, c = '#c9a36a') {
  box(x, y, z, w, .12, .1, dk(c, .2), { ol: false }); box(x, y + d / 2 - .06, z, w, .12, .1, dk(c, .2), { ol: false }); box(x, y + d - .12, z, w, .12, .1, dk(c, .2), { ol: false });
  box(x, y, z + .1, w, d, .06, c, { t: (wx, wy) => (((wx - x) * 5) % 1) < .22 ? dk(c, .45) : c });
}
/** tiny seagull standing at a point. f = facing -1/1 */
export function gull(x, y, z, f = 1) {
  const p = (dx, dy, h) => spx(x, y, z, dx * f, dy, h);
  p(-1, -3, '#f6f4ee'); p(0, -3, '#f6f4ee'); p(1, -4, '#f6f4ee'); p(1, -5, '#f6f4ee'); p(2, -5, '#f0b030'); p(-2, -3, '#9aa3ad'); p(-1, -2, '#9aa3ad'); p(0, -2, '#f6f4ee'); p(-3, -3, '#4a4458'); p(0, -1, '#e0903a');
}
/** life ring hung on a wall */
export function lifering(F, a, z, r = .28) { const c = F.p(a, z, .02); ring(F.side, c, r, r * .5, i => (i % 4 < 2) ? '#f4f0e8' : '#d8452f', 16); circ(F.side, c, r, '#7a2a22', 16); }
/** stencilled / painted text helpers */
export function stripeHaz(F, a0, a1, z0, z1) { F.q(a0, a1, z0, z1, (u, v) => ((u + v) >> 2) & 1 ? '#f2c230' : '#2e2a3a'); }
/** roof clutter: AC unit */
export function ac(x, y, z, w = .9, d = .7) { box(x, y, z, w, d, .5, '#b8bcc0'); qy(x + .1, x + w - .1, y + d, z + .1, z + .4, PAT.siding('#7c858c', 2)); disc('z', [x + w / 2, y + d / 2, z + .5], Math.min(w, d) * .3, '#6c757c', null, 10); }
export function vent(x, y, z, c = '#9aa0a6') { cyl(x, y, z, .14, .35, c, { ol: false }); cyl(x, y, z + .35, .24, .12, dk(c, .1)); }
export function skylight(x, y, z, w, d, on) { box(x, y, z, w, d, .15, '#6c7a83', { t: '#9fcbe0', t2: '#7fb6d0' }); if (on) glow(() => qz(x + .06, x + w - .06, y + .06, y + d - .06, z + .15, '#ffe39a', '#f4c870')); if (winter()) qz(x, x + w, y, y + d * .5, z + .15, SNOW, 'glass'); }
/** round smokestack with bands and an aircraft warning light */
export function stack(x, y, z, r, h, c, o) {
  o = o || {}; const bc = o.band || '#f4f0e8';
  taper(x, y, z, r, r * .72, h, f => (f > .78 && f < .86) || (f > .9 && f < .97) ? bc : (o.pat && Math.floor(f * h * 5) % 2 ? dk(c, .06) : c), { t: '#2a2433' });
  lit(() => { spx(x, y, z + h, 0, -1, '#ff5040'); spx(x, y, z + h, 1, -1, '#ff5040'); });
}

/** screen-space roof pattern: rows parallel to the ridge on the visible slope of a gable */
export const roofPat = (c, step = 4, axis = 'x') => { const f = isFlipped() !== (axis === 'y'), b = f ? dk(c, .18) : c, s = dk(b, .2); return (X, Y) => { const v = Math.floor(f ? Y + X * .5 : Y - X * .5); return ((v % step) + step) % step === 0 ? s : b; }; };
/** screen-space vertical plank / corrugation pattern for gable-end triangles. side: 'x' or 'y' = which wall the triangle is on (unflipped) */
export const endPat = (c, side, step = 3) => { const b = side === 'x' ? Rc(c) : Lc(c), s = dk(b, .22); return (X, Y) => X % step === 0 ? s : b; };
export const endBrick = (c, side) => { const b = side === 'x' ? Rc(c) : Lc(c), m = dk(b, .3); const up = (side === 'x') !== isFlipped(); return (X, Y) => { const v = Math.floor(up ? Y + X * .5 : Y - X * .5), row = Math.floor(v / 3); return ((v % 3) + 3) % 3 === 0 ? m : ((X + (row & 1) * 3) % 6 === 0 ? m : b); }; };
/** sliding barn door with X brace and rail */
export function barnDoor(F, a0, a1, z0, z1, c, trim) {
  F.q(a0, a1, z0, z1, PAT.planks(F.sh(c), 3)); const t = F.sh(trim), m = (a0 + a1) / 2;
  F.l(a0, z0, a1, z0, t); F.l(a0, z1, a1, z1, t); F.l(a0, z0, a0, z1, t); F.l(a1, z0, a1, z1, t); F.l(m, z0, m, z1, t);
  F.l(a0, z0, m, z1, t); F.l(m, z1, a1, z0, t);
  F.q(a0 - .5, a1 + .5, z1 + .06, z1 + .16, '#39424e'); F.l(a0 - .5, z1 + .06, a1 + .5, z1 + .06, '#23202e');
}

/** hip roof + winter snow */
export function hipS(x, y, z, w, d, h, c, o) {
  hip(x, y, z, w, d, h, c, o); o = o || {}; const ov = o.over === undefined ? .15 : o.over, r = Math.min(w, d) / 2 * (1 - (o.inset || 0)), zt = z + h;
  snowSlope([x + r, y + d - r, zt], [x + w - r, y + d - r, zt], [x - ov, y + d + ov, z], [x + w + ov, y + d + ov, z], .5);
  snowSlope([x + w - r, y + r, zt], [x + w - r, y + d - r, zt], [x + w + ov, y - ov, z], [x + w + ov, y + d + ov, z], .5);
  if (o.inset) snowTop(x + r, x + w - r, y + r, y + d - r, zt, .1);
}
/** simple post-and-rail fence line between two ground points at height z (posts every ~step) */
export function rail(a, b, z, hgt, c, n) { n = n || Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 1)); for (let i = 0; i <= n; i++) { const t = i / n, x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t; lw([x, y, z], [x, y, z + hgt], c); } lw([a[0], a[1], z + hgt], [b[0], b[1], z + hgt], c); lw([a[0], a[1], z + hgt * .5], [b[0], b[1], z + hgt * .5], c); }
/** parasol (closed in winter) */
export function parasol(x, y, z, c, c2) {
  lw([x, y, z], [x, y, z + 1.7], '#6b5a48');
  if (winter()) { box(x - .05, y - .05, z + .9, .1, .1, .8, c, { ol: false }); return; }
  const n = 8, top = [x, y, z + 1.95];
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + .39, b = (i + 1) / n * Math.PI * 2 + .39; fq([[x + Math.cos(a) * .95, y + Math.sin(a) * .95, z + 1.5], [x + Math.cos(b) * .95, y + Math.sin(b) * .95, z + 1.5], top], i % 2 ? c : c2); }
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + .39, b = (i + 1) / n * Math.PI * 2 + .39; lw([x + Math.cos(a) * .95, y + Math.sin(a) * .95, z + 1.5], [x + Math.cos(b) * .95, y + Math.sin(b) * .95, z + 1.5], dk(c, .5)); }
}
/** cafe table with two chairs */
export function cafeTable(x, y, z, c = '#f4f0e8') { lw([x, y, z], [x, y, z + .7], '#4a4458'); cyl(x, y, z + .68, .32, .06, c); box(x - .65, y - .15, z, .3, .3, .45, '#8a5a34', { ol: false }); box(x + .4, y - .1, z, .3, .3, .45, '#8a5a34', { ol: false }); }
/** fish crate: plastic tray with ice + fish */
export function fishCrate(x, y, z, c = '#3f7fbf', seed = 1) {
  box(x, y, z, .8, .55, .3, c); qz(x + .06, x + .74, y + .06, y + .49, z + .3, '#eaf4fa', '#d4e6f2');
  const cols = ['#9fb4c4', '#e8927a', '#c8d4dc', '#f0b060']; for (let i = 0; i < 4; i++) { const fx = x + .15 + ((i * 37 + seed * 13) % 5) * .11, fy = y + .14 + (i % 2) * .2, cc = cols[(i + seed) % 4]; spx(fx, fy, z + .3, 0, 0, cc); spx(fx, fy, z + .3, 1, 0, cc); spx(fx, fy, z + .3, 2, 0, dk(cc, .3)); }
}
