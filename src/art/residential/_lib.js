// Shared residential kit helpers (local to src/art/residential). Everything is flip-safe: geometry goes through the
// raster world primitives, and face shades / screen-space roof patterns consult isFlipped().
import {
  U, ENV, C, mix, dk, lt, rng, hash2, PW, px, fill, ellipse, fq, lw, qy, qx, qz, box, ball, glow, lit, PAT, winY, winX, isFlipped,
} from '../../engine/raster.js';

export const SNOW = '#f4f8fb', SNOW2 = '#d9e4ee';
export const winter = () => ENV.season === 3, autumn = () => ENV.season === 2, spring = () => ENV.season === 0, summer = () => ENV.season === 1;
const mod = (a, n) => ((a % n) + n) % n;

/* ---------- face abstraction: s = 'y' (the +y wall, coordinate a = x) or 'x' (the +x wall, a = y); pl = plane ---------- */
export const pt = (s, a, pl, z) => s === 'y' ? [a, pl, z] : [pl, a, z];
export const fQ = (s, a0, a1, pl, z0, z1, h, h2) => s === 'y' ? qy(a0, a1, pl, z0, z1, h, h2) : qx(pl, a0, a1, z0, z1, h, h2);
export const fL = (s, a0, z0, a1, z1, pl, c) => lw(pt(s, a0, pl, z0), pt(s, a1, pl, z1), c);
/** box sticking out of a face: spans a..a+wa along the face, pl..pl+dp outward */
export const fB = (s, a, pl, z, wa, dp, h, c, o) => s === 'y' ? box(a, pl, z, wa, dp, h, c, o) : box(pl, a, z, dp, wa, h, c, o);
/** is this face drawn as the bright (screen-left) wall right now? */
export const bright = s => (s === 'y') !== isFlipped();
/** wall shade of colour c for face s (matches box(): left wall lighter, right wall darker, also when flipped) */
export const fs = (s, c) => bright(s) ? dk(c, .18) : dk(c, .36);
/** the other face */
export const oth = s => s === 'y' ? 'x' : 'y';
/** pixel helper on a world point */
export function wpx(q, dx, dy, h) { const s = PW(q[0], q[1], q[2]); px(Math.round(s[0]) + (isFlipped() ? -dx : dx), Math.round(s[1]) + dy, C(h)); }

/* ---------- materials ---------- */
export function mat(m, c) {
  switch (m) {
    case 'brick': return PAT.brick(c);
    case 'siding': return PAT.siding(c, 3);
    case 'wide': return PAT.siding(c, 5);
    case 'stone': return PAT.stone(c);
    case 'stucco': return PAT.stucco(c);
    case 'planks': return PAT.planks(c, 4);
    case 'shingle': return PAT.shingle(c);
    default: return c;
  }
}
/** wall-pattern adaptor for arbitrary polygons on a face (gable triangles etc.) */
export function wallPat(s, fn, a0, a1, pl, z) {
  if (typeof fn !== 'function') return fn;
  const yl = bright(s), o = PW(...pt(s, yl ? a0 : a1, pl, z)), sl = yl ? .5 : -.5;
  return (X, Y) => { const u = Math.floor(X + .5 - o[0]), v = Math.floor(o[1] + (X + .5 - o[0]) * sl - (Y + .5)); return fn(u < 0 ? 0 : u, v < 0 ? 0 : v); };
}
/** material quad on a face */
export const wallQ = (s, a0, a1, pl, z0, z1, m, c) => fQ(s, a0, a1, pl, z0, z1, mat(m, fs(s, c)));
/** main wall volume. o: { t: top colour, base: foundation colour|false, baseH, corner: trim colour for corner boards } */
export function body(x, y, z, w, d, h, c, m, o) {
  o = o || {};
  box(x, y, z, w, d, h, c, { l: mat(m, dk(c, .18)), r: mat(m, dk(c, .36)), t: o.t || dk(c, .3), ol: o.ol });
  if (o.base !== false && o.base) { const bh = o.baseH || .3; qy(x, x + w, y + d, z, z + bh, mat('stone', fs('y', o.base))); qx(x + w, y, y + d, z, z + bh, mat('stone', fs('x', o.base))); lw([x, y + d, z + bh], [x + w, y + d, z + bh], dk(o.base, .5)); lw([x + w, y, z + bh], [x + w, y + d, z + bh], dk(o.base, .55)); }
  if (o.corner) { qy(x + w - .12, x + w, y + d, z, z + h, fs('y', o.corner)); qx(x + w, y + d - .12, y + d, z, z + h, fs('x', o.corner)); qy(x, x + .12, y + d, z, z + h, fs('y', o.corner)); }
  if (o.band) for (const bz of [].concat(o.band)) { qy(x, x + w, y + d, z + bz - .1, z + bz + .05, fs('y', o.bandc || lt(c, .4))); qx(x + w, y, y + d, z + bz - .1, z + bz + .05, fs('x', o.bandc || lt(c, .4))); }
}

/* ---------- little things ---------- */
/** circle outline lying in a face plane */
export function ring(s, a, pl, z, r, c, n = 28) { for (let i = 0; i < n; i++) { const t = i / n * Math.PI * 2, q = PW(...pt(s, a + Math.cos(t) * r, pl, z + Math.sin(t) * r)); px(Math.round(q[0]), Math.round(q[1]), C(c)); } }
/** filled disc lying in a face plane */
export function disc(s, a, pl, z, r, c, c2) { const p = []; for (let i = 0; i < 14; i++) { const t = i / 14 * Math.PI * 2; p.push(pt(s, a + Math.cos(t) * r, pl, z + Math.sin(t) * r)); } fq(p, c, c2); }
export function wreath(s, a, pl, z, r = .2) { ring(s, a, pl, z, r, '#2f7a45'); ring(s, a, pl, z, r - .07, '#3f9a55'); wpx(pt(s, a, pl, z - r), 0, 0, '#d8343a'); wpx(pt(s, a, pl, z - r), 0, 1, '#d8343a'); }
export function pumpkin(x, y, z, big) { const q = PW(x, y, z); const X = Math.round(q[0]), Y = Math.round(q[1]); ellipse(X, Y - 2, big ? 3 : 2, big ? 2.4 : 1.6, '#e8842a'); px(X - 1, Y - 3, C('#f4a64a')); px(X, Y - (big ? 5 : 4), C('#4f7a3a')); px(X + (big ? 2 : 1), Y - 1, C('#b85a1c')); }
export function pot(x, y, z, f, r = .17, pc = '#b8643c') { box(x - .09, y - .09, z, .18, .18, .16, pc, { ol: false }); if (f) ball(x, y, z + .16 + r * .8, r, f, { ol: true }); }
/** season-aware flower colour (null = bare) */
export function bloom(v) { const s = ENV.season; if (s === 3) return null; if (s === 2) return ['#e08a2c', '#c9552b', '#e8b63a'][Math.floor(v * 3) % 3]; return ['#ef6f8f', '#f4d24a', '#f2f2f2', '#b77fe0', '#ff8f4a'][Math.floor(v * 5) % 5]; }
export const leafy = v => winter() ? '#4f7f6a' : ['#4f9a45', '#5aa84f', '#458c40'][Math.floor(v * 3) % 3];
/** string of fairy lights between two world points (bright at night) */
export function fairy(a, b, o) {
  o = o || {}; const cols = o.cols || ['#ff5a5a', '#ffd84a', '#5ad1ff', '#7dff7a'], A = PW(a[0], a[1], a[2]), B = PW(b[0], b[1], b[2]);
  const n = Math.max(2, Math.round(Math.hypot(B[0] - A[0], B[1] - A[1]) / (o.step || 3)));
  for (let i = 0; i <= n; i++) { const t = i / n, sag = Math.round(Math.sin(t * Math.PI * (o.waves || 1)) * (o.sag === undefined ? 2 : o.sag)); const X = Math.round(A[0] + (B[0] - A[0]) * t), Y = Math.round(A[1] + (B[1] - A[1]) * t) + Math.abs(sag); if (i % 2) px(X, Y, C('#3a3a48')); else lit(() => px(X, Y, C(cols[(i >> 1) % cols.length]))); }
}
/** wall lantern: little fixture + night glow halo */
export function lamp(s, a, pl, z, o) {
  o = o || {}; const q = PW(...pt(s, a, pl, z)), X = Math.round(q[0]), Y = Math.round(q[1]);
  px(X, Y - 3, C('#2e2a3a')); px(X - 1, Y - 2, C('#2e2a3a')); px(X, Y - 2, C('#2e2a3a')); px(X + 1, Y - 2, C('#2e2a3a'));
  px(X - 1, Y - 1, C('#f6e7b0')); px(X, Y - 1, C('#fff6d0')); px(X + 1, Y - 1, C('#f6e7b0')); px(X - 1, Y, C('#f6e7b0')); px(X, Y, C('#fff6d0')); px(X + 1, Y, C('#f6e7b0')); px(X, Y + 1, C('#2e2a3a'));
  glow(() => { ellipse(X, Y, o.r || 6, o.r || 6, '#ffd98a', 'glass'); ellipse(X, Y, 2.5, 2.5, '#fff2c4'); });
}
/** drain pipe down a face */
export function pipe(s, a, pl, z0, z1, c) { fL(s, a, z0, a, z1, pl, c); fL(s, a + .06, z0, a + .06, z1, pl, dk(c, .3)); }
/** satellite dish on a pole at a world point */
export function dish(x, y, z) { const q = PW(x, y, z), X = Math.round(q[0]), Y = Math.round(q[1]), f = isFlipped() ? -1 : 1; for (let i = 0; i < 4; i++) px(X, Y - i, C('#4a4a5a')); ellipse(X + f * 2, Y - 6, 3.2, 3.6, '#e6e6ee'); ellipse(X + f * 2.6, Y - 6, 2, 2.6, '#c2c4d2'); px(X + f * 4, Y - 7, C('#4a4a5a')); for (let a = 0; a < 6.3; a += .35) px(Math.round(X + f * 2 + Math.cos(a) * 4), Math.round(Y - 6 + Math.sin(a) * 4.3), C('#55566a')); }
/** tv antenna */
export function antenna(x, y, z, h = 1.2) { lw([x, y, z], [x, y, z + h], '#55566a'); lw([x - .3, y, z + h - .1], [x + .3, y, z + h - .1], '#55566a'); lw([x - .2, y, z + h - .35], [x + .2, y, z + h - .35], '#55566a'); }
/** winter snow sheet on a horizontal surface (no-op outside winter) */
export function snowTop(x0, x1, y0, y1, z, force) { if (!winter() && !force) return; qz(x0, x1, y0, y1, z, SNOW, 'glass'); if (x1 - x0 > .5 && y1 - y0 > .5) qz(x0 + .2, x1 - .2, y0 + .2, y1 - .2, z, (wx, wy) => hash2(Math.floor(wx * 3), Math.floor(wy * 3), 5) > .88 ? SNOW2 : SNOW); }
/** steps climbing to height z in front of face s between a0..a1 (n steps, each `run` deep) */
export function steps(s, a0, a1, pl, z, n = 2, c = '#b9b2a6', run = .28) { for (let i = 0; i < n; i++) fB(s, a0, pl, 0, a1 - a0, run * (n - i), z * (i + 1) / n, c, { ol: i === 0 }); }

/* ---------- windows & doors ---------- */
/** raw raster window on face s */
export const W = (s, a0, a1, pl, z0, z1, o) => s === 'y' ? winY(a0, a1, pl, z0, z1, o) : winX(pl, a0, a1, z0, z1, o);
/**
 * Framed window on face s. o: { on, mull, trim (hex|false), frame, shut: hex, fbox: bool|hex, head: bool, sill (default true),
 *   curt: hex, wreath: bool (winter only), awn: hex, glass, glowc, v: 0..1 variety seed }
 */
export function win(s, a0, a1, pl, z0, z1, o) {
  o = o || {}; const trim = o.trim === undefined ? '#f1ede4' : o.trim, v = o.v === undefined ? .5 : o.v, on = o.on !== false;
  if (o.shut) { const sw = Math.min(.3, (a1 - a0) * .4); for (const b of [a0 - sw - .07, a1 + .07]) { fQ(s, b, b + sw, pl, z0, z1, PAT.siding(fs(s, o.shut), 2)); fL(s, b, z0, b, z1, pl, dk(o.shut, .55)); fL(s, b + sw, z0, b + sw, z1, pl, dk(o.shut, .55)); } }
  if (trim) fQ(s, a0 - .07, a1 + .07, pl, z0 - .07, z1 + .07, fs(s, trim));
  if (o.head) fQ(s, a0 - .16, a1 + .16, pl, z1 + .06, z1 + .2, fs(s, trim || '#f1ede4'));
  W(s, a0, a1, pl, z0, z1, { on, mullion: o.mull === undefined ? 'cross' : o.mull, frame: o.frame, glass: o.glass, glowc: o.glowc });
  if (o.curt) { const cw = (a1 - a0) * .22, cc = fs(s, o.curt); for (const b of [a0 + .06, a1 - .06 - cw]) { fQ(s, b, b + cw, pl, z0 + .06, z1 - .06, cc); if (on) glow(() => fQ(s, b, b + cw, pl, z0 + .06, z1 - .06, mix(o.curt, '#ffcf80', .45))); } }
  if (o.blind) { const bz = z1 - (z1 - z0) * o.blind; fQ(s, a0 + .06, a1 - .06, pl, bz, z1 - .06, fs(s, '#efe9da')); if (on) glow(() => fQ(s, a0 + .06, a1 - .06, pl, bz, z1 - .06, '#ffe9b8')); }
  if (o.sill !== false) { fL(s, a0 - .12, z0 - .07, a1 + .12, z0 - .07, pl, lt(trim || '#d8d2c4', .3)); fL(s, a0 - .12, z0 - .13, a1 + .12, z0 - .13, pl, dk(trim || '#d8d2c4', .45)); }
  if (o.fbox) {
    const bc = typeof o.fbox === 'string' ? o.fbox : '#8a5a3c';
    fB(s, a0 - .02, pl, z0 - .34, a1 - a0 + .04, .16, .2, bc, { ol: false });
    const n = Math.round((a1 - a0) * U / 2);
    for (let i = 0; i < n; i++) { const a = a0 + (i + .5) * (a1 - a0) / n, k = hash2(i, Math.floor(v * 97), 3), q = pt(s, a, pl + .16, z0 - .14); if (winter()) { wpx(q, 0, 0, SNOW); continue; } const f = bloom(hash2(i >> 1, Math.floor(v * 97), 8)); wpx(q, 0, 0, '#4f9a45'); if (k > .25) wpx(q, 0, -1, k > .6 ? f : '#5aa84f'); if (k > .7) wpx(q, 0, -2, f); }
  }
  if (o.awn) { const n = Math.max(2, Math.round((a1 - a0 + .3) / .25)), b0 = a0 - .15, st = (a1 - a0 + .3) / n; for (let i = 0; i < n; i++) fq([pt(s, b0 + i * st, pl, z1 + .45), pt(s, b0 + (i + 1) * st, pl, z1 + .45), pt(s, b0 + (i + 1) * st, pl + .5, z1 + .08), pt(s, b0 + i * st, pl + .5, z1 + .08)], i % 2 ? '#f4f0e8' : o.awn); lw(pt(s, b0, pl + .5, z1 + .08), pt(s, b0 + n * st, pl + .5, z1 + .08), dk(o.awn, .5)); }
  if (o.wreath && winter()) wreath(s, (a0 + a1) / 2, pl, (z0 + z1) / 2, Math.min(.2, (a1 - a0) * .3));
  if (o.lights && winter()) fairy(pt(s, a0 - .1, pl, z1 + .12), pt(s, a1 + .1, pl, z1 + .12), { sag: 1 });
}
/** evenly spaced row of windows between a0..a1. o: win opts + { n | pitch, ww, r: rng, pOn, skip: i=>bool, each: (i,opts)=>opts } */
export function winRow(s, a0, a1, pl, z0, z1, o) {
  o = o || {}; const ww = o.ww || .9, n = o.n || Math.max(1, Math.floor((a1 - a0) / (o.pitch || ww + .9))), r = o.r || (() => .5), gap = (a1 - a0 - n * ww) / n;
  for (let i = 0; i < n; i++) { const a = a0 + gap / 2 + i * (ww + gap), on = r() < (o.pOn === undefined ? .55 : o.pOn), v = r(); if (o.skip && o.skip(i, a + ww / 2)) continue; let oo = Object.assign({}, o, { on, v }); if (o.each) oo = o.each(i, oo) || oo; win(s, a, a + ww, pl, z0, z1, oo); }
}
/**
 * Door centred at a on face s, sill at z. o: { w (.9), h (1.6), c, trim, glass: 'top'|'full'|'fan'|false, dbl, lamp (default true), on,
 *   wreath, pumpkin, side: bool (sidelights), steps: n, stepc, mat: bool (doormat) }
 */
export function door(s, a, pl, z, o) {
  o = o || {}; const w = o.w || .9, h = o.h || 1.6, c = o.c || '#7a3b2e', trim = o.trim === undefined ? '#f1ede4' : o.trim, a0 = a - w / 2, a1 = a + w / 2, on = o.on !== false;
  if (o.steps) steps(s, a0 - .25, a1 + .25, pl, z, o.steps, o.stepc);
  if (o.side) for (const b of [a0 - .38, a1 + .1]) { if (trim) fQ(s, b - .05, b + .33, pl, z, z + h + .05, fs(s, trim)); W(s, b, b + .28, pl, z + .5, z + h - .1, { on, mullion: 'h' }); }
  if (trim) fQ(s, a0 - .1, a1 + .1, pl, z, z + h + .1, fs(s, trim));
  if (o.ped) { fQ(s, a0 - .22, a1 + .22, pl, z + h + .08, z + h + .2, fs(s, trim || '#f1ede4')); fq([pt(s, a0 - .22, pl, z + h + .2), pt(s, a1 + .22, pl, z + h + .2), pt(s, a, pl, z + h + .5)], fs(s, trim || '#f1ede4')); lw(pt(s, a0 - .22, pl, z + h + .2), pt(s, a, pl, z + h + .5), dk(trim || '#f1ede4', .35)); lw(pt(s, a1 + .22, pl, z + h + .2), pt(s, a, pl, z + h + .5), dk(trim || '#f1ede4', .35)); fQ(s, a0 - .2, a0 - .08, pl, z, z + h + .08, fs(s, trim || '#f1ede4')); fQ(s, a1 + .08, a1 + .2, pl, z, z + h + .08, fs(s, trim || '#f1ede4')); }
  fQ(s, a0, a1, pl, z, z + h, fs(s, c));
  const pc = dk(fs(s, c), .25), hi = lt(fs(s, c), .18);
  if (o.glass === 'full') W(s, a0 + .14, a1 - .14, pl, z + .25, z + h - .15, { on, mullion: o.dbl ? 'v' : 'cross' });
  else if (o.glass !== false) { W(s, a0 + .18, a1 - .18, pl, z + h - .62, z + h - .18, { on, mullion: o.glass === 'fan' ? 'v' : null }); fL(s, a0 + .18, z + .2, a1 - .18, z + .2, pl, pc); fL(s, a0 + .18, z + .8, a1 - .18, z + .8, pl, pc); fL(s, a0 + .18, z + .2, a0 + .18, z + .8, pl, pc); fL(s, a1 - .18, z + .2, a1 - .18, z + .8, pl, hi); }
  else { for (const zz of [.2, .95]) { fL(s, a0 + .18, z + zz, a1 - .18, z + zz, pl, pc); fL(s, a0 + .18, z + zz + .5, a1 - .18, z + zz + .5, pl, pc); fL(s, a0 + .18, z + zz, a0 + .18, z + zz + .5, pl, pc); fL(s, a1 - .18, z + zz, a1 - .18, z + zz + .5, pl, hi); } }
  if (o.dbl) fL(s, a, z, a, z + h, pl, pc);
  fL(s, a0, z, a0, z + h, pl, dk(c, .6)); fL(s, a1, z, a1, z + h, pl, dk(c, .6)); fL(s, a0, z + h, a1, z + h, pl, dk(c, .6));
  const hq = pt(s, bright(s) ? a1 - .16 : a0 + .16, pl, z + .78); wpx(hq, 0, 0, '#f6d870'); wpx(hq, 0, 1, '#b98a2c');
  if (o.dbl) { const h2 = pt(s, a, pl, z + .78); wpx(h2, -1, 0, '#f6d870'); wpx(h2, 1, 0, '#f6d870'); }
  if (o.mat) fq([pt(s, a0 + .05, pl + .08, z + .01), pt(s, a1 - .05, pl + .08, z + .01), pt(s, a1 - .05, pl + .42, z + .01), pt(s, a0 + .05, pl + .42, z + .01)], o.mat === true ? '#8a5a3c' : o.mat, '#6f4630');
  if (o.lamp !== false) lamp(s, o.side ? a1 + .62 : a1 + .34, pl, z + 1.35);
  if (o.wreath && winter()) wreath(s, a, pl, z + 1.12, .19);
  if (o.pumpkin && autumn()) { const q = pt(s, a0 - .32, pl + .22, z); pumpkin(q[0], q[1], q[2], true); const q2 = pt(s, a0 - .5, pl + .42, z); if (o.pumpkin > 1) pumpkin(q2[0], q2[1], q2[2]); }
}
/** sectional garage door a0..a1, height h. o: { c, trim, win: bool, h } */
export function garage(s, a0, a1, pl, z, o) {
  o = o || {}; const h = o.h || 1.7, c = o.c || '#e8e2d4', trim = o.trim === undefined ? '#f1ede4' : o.trim, cc = fs(s, c);
  if (trim) fQ(s, a0 - .1, a1 + .1, pl, z, z + h + .1, fs(s, trim));
  fQ(s, a0, a1, pl, z, z + h, cc);
  const n = 4; for (let i = 1; i < n; i++) { fL(s, a0, z + i * h / n, a1, z + i * h / n, pl, dk(cc, .28)); fL(s, a0, z + i * h / n - .0625, a1, z + i * h / n - .0625, pl, lt(cc, .25)); }
  const cols = Math.max(2, Math.round((a1 - a0) / .7)); for (let i = 1; i < cols; i++) fL(s, a0 + i * (a1 - a0) / cols, z, a0 + i * (a1 - a0) / cols, z + h, pl, dk(cc, .12));
  if (o.win !== false) for (let i = 0; i < cols; i++) { const b = a0 + (i + .2) * (a1 - a0) / cols, e = a0 + (i + .8) * (a1 - a0) / cols; W(s, b, e, pl, z + h * .78, z + h * .95, { on: false }); }
  fL(s, a0, z, a0, z + h, pl, dk(c, .6)); fL(s, a1, z, a1, z + h, pl, dk(c, .6)); fL(s, a0, z + h, a1, z + h, pl, dk(c, .6));
  wpx(pt(s, (a0 + a1) / 2, pl, z + .3), 0, 0, '#55566a'); wpx(pt(s, (a0 + a1) / 2, pl, z + .3), 1, 0, '#55566a');
}

/* ---------- roofs ---------- */
function slopePat(kind, c, P0, dir, k, vmax, snow) {
  const X0 = P0[0], Y0 = P0[1], cs = dk(c, .26), c2 = lt(c, .1), c3 = dk(c, .1), sn = winter() && snow !== false;
  return (X, Y) => {
    const dx = (X - X0) * dir, v = Math.floor(Y - Y0 - dx * .5 + .5), uu = Math.floor(dx + v * k);
    if (sn) {
      const edge = vmax * (.6 + .16 * hash2(Math.floor(uu / 4), 0, 11));
      if (v < edge - 2) return hash2(Math.floor(uu / 3), Math.floor(v / 2), 3) > .9 ? SNOW2 : SNOW;
      if (v < edge + 1 && ((X + Y) & 1)) return SNOW;
    }
    if (kind === 'tile') { if (mod(v, 5) === 0) return cs; const m = mod(uu, 3); return m === 0 ? c3 : m === 1 ? c2 : c; }
    if (kind === 'metal') return mod(uu, 6) === 0 ? cs : mod(uu, 6) === 1 ? c2 : c;
    if (kind === 'plain') return mod(v, 6) === 0 ? c3 : c;
    const row = Math.floor(v / 4); if (mod(v, 4) === 0) return cs; const u2 = uu + (row & 1) * 4; if (mod(u2, 8) === 0) return c3; const h = hash2(Math.floor(u2 / 8), row, 5); return h > .82 ? c2 : h < .14 ? c3 : c;
  };
}
const slopeC = (s, c) => bright(s) ? c : dk(c, .2);
/**
 * Gable roof on footprint (x,y,w,d) from wall-top z, ridge h above. axis 'x': ridge along x, visible slope faces +y, gable wall on +x.
 * axis 'y': ridge along y, visible slope faces +x, gable wall on +y.
 * o: { kind: 'shingle'|'tile'|'metal'|'plain', wall: hex, wmat, trim: hex (barge board), over (.3 eave), rake (.25), behind: fn, snow, vent: bool }
 * Returns R = { sl(a,t,up) -> world point on the visible slope (a along ridge, t 0 ridge..1 eave), face, ... } for roof furniture.
 */
export function roofGable(x, y, z, w, d, h, axis, c, o) {
  o = o || {}; const X = axis === 'x', ov = o.over === undefined ? .2 : o.over, rk = o.rake === undefined ? .25 : o.rake, trim = o.trim || '#f1ede4';
  const L = X ? w : d, Wd = X ? d : w, a0 = (X ? x : y), c0 = (X ? y : x), half = Wd / 2, m = c0 + half, zr = z + h, drop = ov * h / half, ze = z - drop;
  const W3 = (a, cc, zz) => X ? [a, cc, zz] : [cc, a, zz], sv = X ? 'y' : 'x', sg = X ? 'x' : 'y';   // sv: face the visible slope looks at; sg: gable wall face
  const A = a0 - rk, B = a0 + L + rk, oc = dk(c, .7);
  fq([W3(A, c0 - ov, ze), W3(B, c0 - ov, ze), W3(B, m, zr), W3(A, m, zr)], dk(c, .45));
  const wc = o.wall || '#e8e2d4', wf = mat(o.wmat, fs(sg, wc));
  fq([W3(a0 + L, c0, z), W3(a0 + L, c0 + Wd, z), W3(a0 + L, m, zr)], wallPat(sg, wf, c0, c0 + Wd, a0 + L, z));
  fq([W3(a0 + L, c0 - ov, ze), W3(B, c0 - ov, ze), W3(B, m, zr), W3(a0 + L, m, zr)], dk(c, .5));
  if (o.behind) o.behind();
  const run = half + ov, rise = h + drop, P0 = PW(...W3(A, m, zr)), pf = slopePat(o.kind, slopeC(sv, c), P0, bright(sv) ? 1 : -1, run / (run + rise), (run + rise) * U, o.snow);
  fq([W3(A, c0 + Wd + ov, ze), W3(B, c0 + Wd + ov, ze), W3(B, m, zr), W3(A, m, zr)], pf);
  // barge board on the gable end + fascia
  const tb = fs(sg, trim), bt = .16;
  fq([W3(B, c0 + Wd + ov, ze), W3(B, m, zr), W3(B, m, zr - bt), W3(B, c0 + Wd + ov, ze - bt)], tb);
  fq([W3(B, c0 - ov, ze), W3(B, m, zr), W3(B, m, zr - bt), W3(B, c0 - ov, ze - bt)], dk(tb, .12));
  lw(W3(B, c0 + Wd + ov, ze - bt), W3(B, m, zr - bt), dk(trim, .45)); lw(W3(B, c0 - ov, ze - bt), W3(B, m, zr - bt), dk(trim, .5));
  lw(W3(A, c0 + Wd + ov, ze - .07), W3(B, c0 + Wd + ov, ze - .07), dk(trim, .25));
  lw(W3(A, m, zr), W3(B, m, zr), winter() && o.snow !== false ? SNOW : lt(c, .35));
  lw(W3(A, c0 + Wd + ov, ze), W3(B, c0 + Wd + ov, ze), oc); lw(W3(A, c0 + Wd + ov, ze), W3(A, m, zr), oc); lw(W3(B, c0 + Wd + ov, ze), W3(B, m, zr), oc);
  lw(W3(B, m, zr), W3(B, c0 - ov, ze), oc); lw(W3(A, m, zr), W3(A, c0 - ov, ze), oc); lw(W3(A, c0 - ov, ze), W3(B, c0 - ov, ze), oc);
  if (o.vent) { const s = sg, zz = z + h * .42; if (o.vent === 'round') { disc(s, m, a0 + L, zz, .26, '#4a4458'); disc(s, m, a0 + L, zz, .19, '#7fb6d0', '#9fcbe0'); } else { fQ(s, m - .22, m + .22, a0 + L, zz - .2, zz + .25, fs(s, trim)); fQ(s, m - .15, m + .15, a0 + L, zz - .14, zz + .19, PAT.siding(dk(wc, .5), 2)); } }
  return { axis, face: sv, gface: sg, x, y, z, w, d, h, m, run, rise, a0, a1: a0 + L, c, kind: o.kind, sl: (a, t, up = 0) => W3(a, m + t * run, zr - t * rise + up) };
}
/** quad lying on a roof slope: a0..a1 along the ridge, t0..t1 down the slope */
export function onSlope(R, a0, a1, t0, t1, c, c2, up = .03) { fq([R.sl(a0, t0, up), R.sl(a1, t0, up), R.sl(a1, t1, up), R.sl(a0, t1, up)], c, c2); }
export function skylight(R, a, t, o) { o = o || {}; const w = o.w || .7, dt = o.dt || .22; onSlope(R, a - .06, a + w + .06, t - .03, t + dt + .03, '#3e394c'); onSlope(R, a, a + w, t, t + dt, '#8cc3dc', '#a9d6e8', .04); if (o.on) glow(() => onSlope(R, a, a + w, t, t + dt, '#ffd98a', '#f4c870', .04)); if (winter()) onSlope(R, a, a + w, t, t + dt * .35, SNOW, 'glass', .05); }
export function solar(R, a0, a1, t0, t1, cols) { onSlope(R, a0 - .05, a1 + .05, t0 - .02, t1 + .02, '#c9ccd6', null, .05); cols = cols || Math.max(1, Math.round((a1 - a0) / .8)); const st = (a1 - a0) / cols, mt = (t0 + t1) / 2; for (let i = 0; i < cols; i++) for (let j = 0; j < 2; j++) { const b = a0 + i * st + .04, e = a0 + (i + 1) * st - .04, ta = j ? mt + .015 : t0 + .01, tb = j ? t1 - .01 : mt - .015; onSlope(R, b, e, ta, tb, '#27406e', (i + j) % 2 ? '#2f4c80' : '#27406e', .06); lw(R.sl(b, ta, .07), R.sl(e, ta, .07), '#5f86c2'); } if (winter()) onSlope(R, a0, a1, t0, t0 + (t1 - t0) * .3, SNOW, 'glass', .08); }
/**
 * Dormer poking out of the visible slope of gable roof R, centred at a, front face at slope fraction tf, hh tall.
 * o: { w (1.3), wall, wmat, roof, trim, on, kind, rh (roof height), shed: bool, win opts via o.win }
 */
export function dormer(R, a, tf, hh, o) {
  o = o || {}; const X = R.axis === 'x', wd = o.w || 1.3, s = R.face, so = R.gface, wall = o.wall || '#e8e2d4';
  const cf = R.m + tf * R.run, zf = R.z + R.h - tf * (R.rise), zt = zf + hh, tb = Math.max(0, tf - hh / R.rise), cb = R.m + tb * R.run;
  const W3 = (aa, cc, zz) => X ? [aa, cc, zz] : [cc, aa, zz], A = a - wd / 2, B = a + wd / 2;
  fq([W3(B, cf, zf), W3(B, cf, zt), W3(B, cb, zt)], mat(null, fs(so, wall)));   // cheek
  fQ(s, A, B, cf, zf, zt, mat(o.wmat, fs(s, wall)));
  fL(s, A, zf, A, zt, cf, dk(wall, .6)); fL(s, B, zf, B, zt, cf, dk(wall, .35)); fL(s, A, zf, B, zf, cf, dk(wall, .6)); lw(W3(B, cf, zf), W3(B, cb, zt), dk(wall, .6));
  win(s, A + .22, B - .22, cf, zf + .18, zt - .1, Object.assign({ mull: 'cross', sill: false, trim: o.trim }, o.win || {}, { on: o.on }));
  const rc = o.roof || R.c;
  if (o.shed) { const rr = o.rh || .25, ov = .12; fq([W3(A - ov, cf + .15, zt), W3(B + ov, cf + .15, zt), W3(B + ov, cb - rr * R.run / R.rise, zt + rr), W3(A - ov, cb - rr * R.run / R.rise, zt + rr)], winter() ? SNOW : slopeC(s, rc)); lw(W3(A - ov, cf + .15, zt), W3(B + ov, cf + .15, zt), dk(rc, .7)); lw(W3(B + ov, cf + .15, zt), W3(B + ov, cb - rr * R.run / R.rise, zt + rr), dk(rc, .7)); lw(W3(A - ov, cf + .15, zt), W3(A - ov, cb - rr * R.run / R.rise, zt + rr), dk(rc, .7)); }
  else { const rh = o.rh || wd * .32; if (X) roofGable(A, cb - .3, zt, wd, cf - cb + .3, rh, 'y', rc, { wall, kind: o.kind || R.kind, trim: o.trim, over: .12, rake: .12 }); else roofGable(cb - .3, A, zt, cf - cb + .3, wd, rh, 'x', rc, { wall, kind: o.kind || R.kind, trim: o.trim, over: .12, rake: .12 }); }
}
/** hip roof with shingle patterns + snow. o: { kind, over, inset, behind } ; returns { top z } */
export function roofHip(x, y, z, w, d, h, c, o) {
  o = o || {}; const ov = o.over === undefined ? .2 : o.over, r = Math.min(w, d) / 2 * (1 - (o.inset || 0)), drop = ov * h / r, ze = z - drop, zt = z + h, oc = dk(c, .7);
  const A = [x - ov, y - ov, ze], B = [x + w + ov, y - ov, ze], Cc = [x + w + ov, y + d + ov, ze], D = [x - ov, y + d + ov, ze];
  const a = [x + r, y + r, zt], b = [x + w - r, y + r, zt], cc = [x + w - r, y + d - r, zt], dd = [x + r, y + d - r, zt];
  fq([A, B, b, a], dk(c, .45)); fq([A, D, dd, a], dk(c, .32));
  if (o.behind) o.behind();
  const run = r + ov, rise = h + drop, k = run / (run + rise), vm = (run + rise) * U;
  fq([B, Cc, cc, b], slopePat(o.kind, slopeC('x', c), PW(...cc), bright('x') ? 1 : -1, k, vm, o.snow));
  fq([D, Cc, cc, dd], slopePat(o.kind, slopeC('y', c), PW(...dd), bright('y') ? 1 : -1, k, vm, o.snow));
  if (o.inset) { fq([a, b, cc, dd], winter() ? SNOW : lt(c, .12)); lw(a, b, oc); lw(a, dd, oc); }
  const hi = winter() && o.snow !== false ? SNOW : lt(c, .35);
  lw(Cc, cc, hi); lw(dd, cc, hi); lw(cc, b, hi); lw(D, dd, oc); lw(B, b, oc); lw(D, Cc, oc); lw(Cc, B, oc);
  lw([D[0], D[1], ze - .07], [Cc[0], Cc[1], ze - .07], dk(o.trim || '#f1ede4', .25)); lw([B[0], B[1], ze - .07], [Cc[0], Cc[1], ze - .07], dk(o.trim || '#f1ede4', .4));
}
/** flat roof with parapet. o: { ph (.3), cop: coping colour, roof: deck colour, mat, snow } */
export function roofFlat(x, y, z, w, d, c, o) {
  o = o || {}; const ph = o.ph === undefined ? .3 : o.ph, cop = o.cop || lt(c, .35), rc = o.roof || '#8b8791', t = o.t || .18;
  box(x, y, z, w, d, ph, c, { l: mat(o.mat, dk(c, .18)), r: mat(o.mat, dk(c, .36)), t: cop });
  qz(x + t, x + w - t, y + t, y + d - t, z + ph, rc, o.roof2 || dk(rc, .06));
  qz(x + t, x + w - t, y + t, y + t + .12, z + ph, dk(rc, .35)); qz(x + t, x + t + .12, y + t, y + d - t, z + ph, dk(rc, .3));
  lw([x + t, y + d - t, z + ph], [x + w - t, y + d - t, z + ph], dk(cop, .35)); lw([x + w - t, y + t, z + ph], [x + w - t, y + d - t, z + ph], dk(cop, .35));
  if (o.snow !== false) snowTop(x + t, x + w - t, y + t, y + d - t, z + ph);
}
/** mono-pitch (shed) roof falling toward +y (front). high edge at y, low at y+d. o: { kind, over, trim, sidewall: hex } */
export function roofShed(x, y, z, w, d, h, c, o) {
  o = o || {}; const ov = o.over === undefined ? .2 : o.over, drop = ov * h / d, oc = dk(c, .7), A = x - ov, B = x + w + ov;
  if (o.sidewall) fq([[x + w, y, z], [x + w, y + d, z], [x + w, y, z + h]], mat(o.wmat, fs('x', o.sidewall)));
  const run = d + ov, rise = h + drop;
  fq([[A, y, z + h], [B, y, z + h], [B, y + d + ov, z - drop], [A, y + d + ov, z - drop]], slopePat(o.kind, slopeC('y', c), PW(A, y, z + h), bright('y') ? 1 : -1, run / (run + rise), (run + rise) * U, o.snow));
  qx(B, y, y + .001, z, z, c);
  fq([[B, y, z + h], [B, y + d + ov, z - drop], [B, y + d + ov, z - drop - .12], [B, y, z + h - .12]], fs('x', o.trim || '#f1ede4'));
  lw([A, y + d + ov, z - drop], [B, y + d + ov, z - drop], oc); lw([A, y, z + h], [A, y + d + ov, z - drop], oc); lw([B, y, z + h], [B, y + d + ov, z - drop], oc); lw([A, y, z + h], [B, y, z + h], lt(c, .3));
  lw([A, y + d + ov, z - drop - .07], [B, y + d + ov, z - drop - .07], dk(o.trim || '#f1ede4', .25));
}
/** brick chimney box with cap (and snow cap in winter) */
export function chimney(x, y, z0, z1, c = '#a85a44', o) {
  o = o || {}; const w = o.w || .55, d = o.d || .55;
  box(x, y, z0, w, d, z1 - z0, c, { l: PAT.brick(dk(c, .18)), r: PAT.brick(dk(c, .36)), t: dk(c, .5) });
  box(x - .06, y - .06, z1, w + .12, d + .12, .12, o.cap || '#8d8790', { t: winter() ? SNOW : '#8d8790' });
  if (o.pots) for (let i = 0; i < o.pots; i++) box(x + .08 + i * .24, y + .18, z1 + .12, .16, .16, .2, '#c8683f', { ol: false, t: '#3a2a2a' });
}

/** little canopy over a door centred at a, underside at z. o: { kind: 'gable'|'flat', c: roof colour, trim, w (1.5), dp (.35) } */
export function hood(s, a, pl, z, o) {
  o = o || {}; const w = o.w || 1.5, dp = o.dp || .35, trim = o.trim || '#f1ede4', c = o.c || '#565266';
  for (const b of [a - w / 2 + .1, a + w / 2 - .1]) { lw(pt(s, b, pl, z - .45), pt(s, b, pl + dp, z), dk(trim, .35)); lw(pt(s, b, pl, z - .45), pt(s, b, pl, z), dk(trim, .35)); }
  if (o.kind === 'flat') { fB(s, a - w / 2, pl, z, w, dp, .12, trim, { t: winter() ? SNOW : c }); return; }
  if (s === 'y') roofGable(a - w / 2, pl, z, w, dp, o.h || .42, 'y', c, { wall: trim, trim, over: .06, rake: .08, kind: 'plain' }); else roofGable(pl, a - w / 2, z, dp, w, o.h || .42, 'x', c, { wall: trim, trim, over: .06, rake: .08, kind: 'plain' });
}

/** a bike seen side-on, standing against face plane pl. k = size (1 adult, .7 kid) */
export function bike(s, a, pl, z, bc, k = 1) {
  const R = .22 * k, L = .62 * k, t = '#3a3a48';
  ring(s, a, pl, z + R, R, t, 16); ring(s, a + L, pl, z + R, R, t, 16);
  fL(s, a, z + R, a + L * .4, z + R * 2.5, pl, bc); fL(s, a + L * .4, z + R * 2.5, a + L * .88, z + R * 2.5, pl, bc); fL(s, a + L * .88, z + R * 2.5, a + L, z + R, pl, bc); fL(s, a + L * .4, z + R * 2.5, a + L * .55, z + R, pl, bc); fL(s, a, z + R, a + L * .55, z + R, pl, bc);
  fL(s, a + L * .33, z + R * 3, a + L * .5, z + R * 3, pl, t); fL(s, a + L * .88, z + R * 2.5, a + L * .8, z + R * 3.3, pl, t);
}
/** basketball hoop mounted on face s, backboard centred at a, rim height z */
export function hoop(s, a, pl, z) {
  fQ(s, a - .5, a + .5, pl + .04, z - .1, z + .65, fs(s, '#f4f0e8')); fL(s, a - .5, z - .1, a + .5, z - .1, pl + .04, '#55566a'); fL(s, a - .5, z + .65, a + .5, z + .65, pl + .04, '#55566a'); fL(s, a - .5, z - .1, a - .5, z + .65, pl + .04, '#55566a'); fL(s, a + .5, z - .1, a + .5, z + .65, pl + .04, '#55566a');
  fL(s, a - .2, z + .05, a + .2, z + .05, pl + .04, '#d8443a'); fL(s, a - .2, z + .35, a + .2, z + .35, pl + .04, '#d8443a'); fL(s, a - .2, z + .05, a - .2, z + .35, pl + .04, '#d8443a'); fL(s, a + .2, z + .05, a + .2, z + .35, pl + .04, '#d8443a');
  for (let i = 0; i < 14; i++) { const t = i / 14 * Math.PI * 2, q = pt(s, a + Math.cos(t) * .22, pl + .3 + Math.sin(t) * .22, z); wpx(q, 0, 0, '#f07a2a'); if (i % 2 === 0) { wpx(q, 0, 2, '#f4f0e8'); wpx(pt(s, a + Math.cos(t) * .16, pl + .3 + Math.sin(t) * .16, z), 0, 4, '#e2ded2'); } }
}
/** porch swing hanging at face plane (seat spans a0..a1), chains up to ztop */
export function swing(s, a0, a1, pl, z, ztop, c = '#f1ede4', cush = '#d8443a') {
  fB(s, a0, pl + .12, z + .3, a1 - a0, .1, .5, c, { ol: false });
  fB(s, a0, pl + .2, z, a1 - a0, .42, .1, c);
  fQ(s, a0 + .08, a1 - .08, pl + .22, z + .36, z + .7, PAT.vstripes(fs(s, cush), fs(s, lt(cush, .5)), 3));
  for (const a of [a0 + .04, a1 - .04]) { lw(pt(s, a, pl + .6, z + .1), pt(s, a, pl + .4, ztop), '#6a6a78'); }
}

/* ---------- porches & balconies ---------- */
/** picket/bar railing on the plane (face s at pl) from a0..a1, top at z+h */
export function rail(s, a0, a1, pl, z, o) {
  o = o || {}; const h = o.h || .6, c = o.c || '#f1ede4', st = o.step || .1875, cc = fs(s, c);
  if (o.solid) { fQ(s, a0, a1, pl, z, z + h, mat(o.mat, fs(s, o.solid))); fL(s, a0, z, a1, z, pl, dk(o.solid, .6)); }
  else if (o.glass) { fQ(s, a0, a1, pl, z + .05, z + h, '#bfe3ee', 'glass'); }
  else for (let a = a0 + st / 2; a < a1; a += st) fL(s, a, z, a, z + h, pl, cc);
  fL(s, a0, z + h, a1, z + h, pl, lt(c, .3)); fL(s, a0, z + h - .0625, a1, z + h - .0625, pl, dk(cc, .2)); if (!o.solid && !o.glass) fL(s, a0, z + .08, a1, z + .08, pl, cc);
}
/**
 * Front porch on the +y side: deck x0..x1, from wall plane y0 out dp, floor at z.
 * o: { post: hex, posts: n, ph (post height 1.9), rail: bool, gap: [a,b] (opening for steps), deck: hex, roof: 'shed'|'flat'|'none', roofc, kind,
 *      rh, trim, piers: hex (stone piers, craftsman), railc, lights: bool, base: hex }
 * mid(): called after the deck is laid and before posts/roof — draw the wall's door and windows there.
 */
export function porch(x0, x1, y0, dp, z, o, mid) {
  o = o || {}; const post = o.post || '#f1ede4', ph = o.ph || 2.5, yf = y0 + dp, n = o.posts || Math.max(2, Math.round((x1 - x0) / 2) + 1), deck = o.deck || '#b08a64';
  box(x0, y0, 0, x1 - x0, dp, z, o.base || '#a59c90', { t: PAT.fboards(deck, .25), l: o.lattice ? PAT.planks(dk(o.base || '#a59c90', .1), 3) : undefined });
  if (winter()) qz(x0, x1, yf - .25, yf, z, SNOW, 'glass');
  if (mid) mid();
  const xs = []; for (let i = 0; i < n; i++) xs.push(x0 + .08 + i * (x1 - x0 - .34) / (n - 1));
  if (o.rail !== false) {
    const gp = o.gap || [1e9, 1e9];
    for (let i = 0; i < n - 1; i++) { const a = xs[i] + .18, b = xs[i + 1]; if (b <= gp[0] || a >= gp[1]) rail('y', a, b, yf - .1, z, { c: o.railc || post }); else { if (gp[0] - a > .3) rail('y', a, gp[0], yf - .1, z, { c: o.railc || post }); if (b - gp[1] > .3) rail('y', gp[1], b, yf - .1, z, { c: o.railc || post }); } }
    rail('x', y0, yf - .1, x1 - .1, z, { c: o.railc || post });
  }
  for (const xx of xs) { if (o.piers) { box(xx - .06, yf - .32, z, .3, .3, .7, o.piers, { l: PAT.stone(dk(o.piers, .18)), r: PAT.stone(dk(o.piers, .36)) }); fq([[xx, yf - .08, z + .7], [xx + .18, yf - .08, z + .7], [xx + .15, yf - .08, z + ph], [xx + .03, yf - .08, z + ph]], fs('y', post)); fq([[xx + .18, yf - .26, z + .7], [xx + .18, yf - .08, z + .7], [xx + .15, yf - .08, z + ph], [xx + .15, yf - .2, z + ph]], fs('x', post)); } else box(xx, yf - .26, z, .18, .18, ph, post, { ol: false }); lw([xx, yf - .08, z], [xx, yf - .08, z + ph], dk(post, .5)); }
  if (o.lights && winter()) fairy([x0, yf, z + ph - .05], [x1, yf, z + ph - .05], { sag: 2, waves: n - 1 });
  const rc = o.roofc || '#565266';
  if (o.roof === 'flat') { box(x0 - .15, y0, z + ph, x1 - x0 + .3, dp + .15, .2, o.trim || post, { t: winter() ? SNOW : dk(rc, .1) }); }
  else if (o.roof === 'gable') { box(x0 - .08, yf - .3, z + ph - .2, x1 - x0 + .16, .3, .2, o.trim || post); roofGable(x0, y0 - (o.back || 0), z + ph, x1 - x0, dp + (o.back || 0), o.gh || .9, 'y', rc, { wall: o.gwall || post, wmat: o.gmat, trim: o.trim || post, kind: o.kind, over: .2, rake: .2, vent: o.vent }); }
  else if (o.roof === 'beam') { box(x0 - .1, yf - .3, z + ph, x1 - x0 + .2, .3, .14, o.trim || post, { t: winter() ? SNOW : undefined }); }
  else if (o.roof !== 'none') { roofShed(x0, y0, z + ph, x1 - x0, dp, o.rh || .22, rc, { over: .1, kind: o.kind, trim: o.trim || post, sidewall: o.sidewall || post }); }
}
/**
 * Apartment balcony on face s: a0..a1, slab top at z, sticking out dp.
 * o: { dp (.6), slab, style: 'bars'|'glass'|'solid', c: rail colour, solid: hex, r: rng, stuff: bool, under: bool }
 */
export function balcony(s, a0, a1, pl, z, o) {
  o = o || {}; const dp = o.dp || .6, r = o.r || (() => .5), slab = o.slab || '#cfc9bd', c = o.c || '#4a4a5a', rh = o.h || .62;
  fB(s, a0, pl, z - .14, a1 - a0, dp, .14, slab, { t: dk(slab, .12) });
  if (o.stuff !== false) {
    const k = r(), k2 = r(), mid = pl + dp * .5, P = (a, off, zz) => pt(s, a, pl + off, zz);
    if (k < .3) { // laundry line
      const lz = z + 1.25, cols = ['#f4f0e8', '#e06a6a', '#6aa8e0', '#f2cf5a', '#8fd08a', '#e9a0c8'];
      lw(P(a0 + .1, dp * .7, lz), P(a1 - .1, dp * .7, lz), '#6a6a78');
      for (let a = a0 + .2; a < a1 - .45; a += .42) { const cc = cols[Math.floor(r() * cols.length)], hh = .3 + r() * .3, ww = .22 + r() * .12; fq([P(a, dp * .7, lz), P(a + ww, dp * .7, lz), P(a + ww, dp * .7, lz - hh), P(a, dp * .7, lz - hh)], fs(s, cc)); lw(P(a, dp * .7, lz - hh), P(a + ww, dp * .7, lz - hh), dk(cc, .4)); }
    } else if (k < .55) { // plants
      for (let a = a0 + .25; a < a1 - .15; a += .45 + r() * .3) { const q = P(a, mid - pl, z); pot(q[0], q[1], q[2], r() < .3 && !winter() ? bloom(r()) : leafy(r()), .14 + r() * .08); }
    } else if (k < .72) { // bike leaning on the wall
      bike(s, a0 + (a1 - a0) * .3, pl + .15, z, ['#d8443a', '#3a78c8', '#e8b63a', '#3aa87a'][Math.floor(k2 * 4)]);
    } else if (k < .88) { // chair + table / parasol in summer
      const q = P(a0 + (a1 - a0) * .5, dp * .45, z); box(q[0] - .12, q[1] - .12, q[2], .24, .24, .42, '#e8e2d4', { ol: false }); const q2 = P(a0 + (a1 - a0) * .5 + (s === 'y' ? .4 : -.4), dp * .45, z); box(q2[0] - .1, q2[1] - .1, q2[2], .2, .2, .26, ['#d8443a', '#3a78c8', '#3aa87a'][Math.floor(k2 * 3)], { ol: false });
      const q3 = P(a0 + .3, dp * .5, z); pot(q3[0], q3[1], q3[2], leafy(k2), .16);
    }
  }
  const ro = { h: rh, c, solid: o.style === 'solid' ? (o.solid || '#e8e2d4') : null, glass: o.style === 'glass', mat: o.mat };
  // end panel then front panel
  const es = oth(s);
  if (s === 'y') rail('x', pl, pl + dp, a1, z, ro); else rail('y', pl, pl + dp, a1, z, ro);
  rail(s, a0, a1, pl + dp, z, ro);
  fL(s, a0, z, a0, z + rh, pl + dp, dk(c, .3)); fL(s, a1, z, a1, z + rh, pl + dp, dk(c, .3));
  if (winter() && o.fairy) fairy(pt(s, a0, pl + dp, z + rh), pt(s, a1, pl + dp, z + rh), { sag: 0 });
  if (winter() && !o.fairy) fL(s, a0, z + rh + .0625, a1, z + rh + .0625, pl + dp, SNOW);
  if (autumn() && o.pump) { const q = pt(s, a1 - .25, pl + dp * .5, z); pumpkin(q[0], q[1], q[2]); }
}

/* ---------- asset builder ---------- */
/**
 * mk({ id, tags, defs: {w,d,floors,...}, height: P => h, paint(P, r), variants, doorAt: P => ({side,at}), lightAt: P => ({x,y,z,r}), top: extra vb height })
 * Fills size/vb/draw. `door` and `light` are plain objects computed for variants[0] (per the contract); doorAt(p)/lightAt(p) give exact
 * values for any parameter set.
 */
export function mk(a) {
  const merge = p => Object.assign({ seed: 1 }, a.defs, p || {});
  const out = {
    id: a.id, kind: 'building', tags: a.tags, variants: a.variants, solid: true,
    size: p => { const P = merge(p); return [P.w, P.d, a.height(P)]; },
    vb: a.vb ? p => a.vb(merge(p)) : p => { const P = merge(p), h = a.height(P), m = a.pad || [.6, .6, .7, 1.1]; return [-m[0], -m[1], 0, P.w + m[2], P.d + m[3], h + (a.top === undefined ? 1 : a.top)]; },
    draw: p => { const P = merge(p); a.paint(P, rng(P.seed * 7 + 3)); },
    params: a.defs,
  };
  if (a.doorAt) { out.doorAt = p => a.doorAt(merge(p)); out.door = out.doorAt(a.variants[0]); }
  if (a.lightAt) { out.lightAt = p => a.lightAt(merge(p)); out.light = out.lightAt(a.variants[0]); }
  if (a.landmark) out.landmark = true;
  return out;
}
export const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
