// Old Town shared kit: face-abstracted facade details, roofs and rooftop clutter.
// A "face" wraps a visible wall plane so every detail helper works on both the +y and +x walls
// (and shades itself correctly when the engine draws the asset flipped).
import { box, qy, qx, qz, fq, lw, PW, spx, ellipse, glow, lit, ball, cyl, cone, winY, winX, signY, signX, textY, textX, textW, PAT, foliage, hash2, dk, lt, mix, ENV, isFlipped, U } from '../../engine/raster.js';

export const SNOW = '#f4f8fb', SNOW2 = '#dfe8f2';
export const isWinter = () => ENV.season === 3;
export const kY = () => isFlipped() ? .34 : .14;
export const kX = () => isFlipped() ? .14 : .34;
export const sY = c => dk(c, kY());
export const sX = c => dk(c, kX());
export const pick = (r, a) => a[Math.floor(r() * a.length) % a.length];
export const snowTop = c => isWinter() ? SNOW : c;
const L3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

export function mat(kind, c) {
  switch (kind) {
    case 'brick': return PAT.brick(c); case 'stone': return PAT.stone(c); case 'siding': return PAT.siding(c);
    case 'planks': return PAT.planks(c); case 'shingle': return PAT.shingle(c);
    case 'stucco': { const a = dk(c, .07); return (u, v) => (hash2(u >> 1, v >> 1, 3) < .045 ? a : c); }
    case 'tile': { const m = lt(c, .25); return (u, v) => (v % 4 === 0 || u % 4 === 0) ? m : c; }
    default: return c;
  }
}
/** wall box with a material on both visible faces */
export function walls(x, y, z, w, d, h, c, kind, o = {}) {
  box(x, y, z, w, d, h, c, { l: mat(kind, sY(c)), r: mat(kind, sX(c)), t: o.t || dk(c, .12), ol: o.ol });
}

export function face(side, pos) {
  const Y = side === 'y';
  const F = {
    Y, pos, side,
    k: () => Y ? kY() : kX(),
    lite: () => (Y ? kY() : kX()) < .2,
    c: col => dk(col, Y ? kY() : kX()),
    P: (u, z, o = 0) => Y ? [u, pos + o, z] : [pos + o, u, z],
    q(u0, u1, z0, z1, h, h2, o = 0) { Y ? qy(u0, u1, pos + o, z0, z1, h, h2) : qx(pos + o, u0, u1, z0, z1, h, h2); },
    l(u0, z0, u1, z1, h, o = 0) { lw(F.P(u0, z0, o), F.P(u1, z1, o), h); },
    poly(pts, h, h2, o = 0) { fq(pts.map(p => F.P(p[0], p[1], o + (p[2] || 0))), h, h2); },
    win(u0, u1, z0, z1, o, off = 0) { Y ? winY(u0, u1, pos + off, z0, z1, o) : winX(pos + off, u0, u1, z0, z1, o); },
    box(u0, u1, z0, h, dep, c, o, off = 0) { Y ? box(u0, pos + off, z0, u1 - u0, dep, h, c, o) : box(pos + off, u0, z0, dep, u1 - u0, h, c, o); },
    sign(str, u0, u1, z0, z1, bg, fg, o, off = .02) { Y ? signY(str, u0, u1, pos + off, z0, z1, bg, fg, o) : signX(str, pos + off, u0, u1, z0, z1, bg, fg, o); },
    /** text centred between u0..u1 with its top at z */
    text(str, u0, u1, z, col, o = .02) { const pad = Math.round(((u1 - u0) * U - textW(str)) / 2) / U; Y ? textY(str, u0 + pad, pos + o, z, col) : textX(str, pos + o, u1 - pad, z, col); },
    /** one pixel, offset (dx along +u, dy down) from a face point */
    dot(u, z, dx, dy, h, o = 0) { const p = F.P(u, z, o); spx(p[0], p[1], p[2], Y ? dx : -dx, dy, h); },
    off: o => face(side, pos + o),
    perp: u => face(Y ? 'x' : 'y', u),
  };
  return F;
}

/** small bitmap (array of strings, '#' or palette keys) with top-left at face point (u,z) */
export function bitmap(F, u, z, rows, cols, o = 0) {
  rows.forEach((row, j) => { for (let i = 0; i < row.length; i++) { const ch = row[i]; if (ch === '.' || ch === ' ') continue; F.dot(u, z, i, j, typeof cols === 'string' ? cols : (cols[ch] || cols['#']), o); } });
}
/** bitmap at a free world point (screen aligned) */
export function sprite(pt, rows, cols, cx = 0) {
  rows.forEach((row, j) => { for (let i = 0; i < row.length; i++) { const ch = row[i]; if (ch === '.' || ch === ' ') continue; spx(pt[0], pt[1], pt[2], i - cx, j, cols[ch]); } });
}
/** dim warm dither on the wall around a light source (draw BEFORE lit windows) */
export function spill(pt, rx, ry, c = '#7a5630') { glow(() => { const s = PW(pt[0], pt[1], pt[2]); ellipse(s[0], s[1], rx, ry, c, 'glass'); }); }

/** evenly spread bay centres along a wall of length len */
export function bays(len, o = {}) {
  const m = o.m === undefined ? .35 : o.m, a = (o.from || 0) + m, b = (o.to === undefined ? len : o.to) - m, n = o.n || Math.max(1, Math.round((b - a) / (o.pitch || 1.5)));
  const out = []; for (let i = 0; i < n; i++) out.push(a + (b - a) * (i + .5) / n); return out;
}

const GLOWS = [['#ffd98a', '#f4c870'], ['#ffc878', '#f2b25c'], ['#ffe9b8', '#f8d898'], ['#ffd98a', '#f4c870'], ['#ffb86a', '#ee9c50'], ['#ffdca0', '#f0c078']];
const FLOWERS = [['#f2a7c3', '#fbe3ea', '#f6d04d', '#c9a0e8'], ['#e8483f', '#f6d04d', '#c06ad8', '#ff8fa3', '#ffffff'], ['#e08a2c', '#d9562b', '#e8b63a', '#a8402a'], []];
export const flowerC = r => { const f = FLOWERS[ENV.season]; return f.length ? pick(r, f) : null; };
export const leafC = (v = 0) => foliage('leaf', v) || '#5d7f6a';

/** flower / window box hanging below z on face F */
export function flowerBox(F, u0, u1, z, r, c = '#7a5236') {
  F.box(u0, u1, z - .2, .2, .16, c, { ol: false });
  const g = leafC(r()), G = F.c(g);
  F.q(u0 + .02, u1 - .02, z - .02, z + .13, G, dk(G, .18), .16);
  if (isWinter()) { F.q(u0 + .02, u1 - .02, z + .07, z + .15, SNOW, null, .16); return; }
  for (let u = u0 + .06; u < u1 - .05; u += .13) { const fc = flowerC(r); if (r() < .8 && fc) { F.dot(u, z + .12, 0, 0, fc, .16); if (r() < .5) F.dot(u, z + .12, 0, -1, fc, .16); } if (r() < .3) F.dot(u, z - .1, 0, 0, G, .17); }
}
const CAT = ['...#.#', '#..###', '#####.', '.####.'];
export function cat(F, u, z, c = '#3a3440') { bitmap(F, u, z, CAT.map(s => s), c, .09); F.dot(u, z, 0, -4 + 0, c, .09); glow(() => F.dot(u, z, 4, 1, '#f6e27a', .09)); }

/**
 * Detailed window. o: r (rng), on, p (lit probability), trim, shut (shutter colour), arch, lintel, sill(false to skip), sillc,
 * fbox (true|colour), cat, curt (curtain colour), blind (colour), mull, frame, glowc
 */
export function win(F, u0, u1, z0, z1, o = {}) {
  const r = o.r, on = o.on !== undefined ? o.on : (r ? r() < (o.p === undefined ? .6 : o.p) : true), m = (u0 + u1) / 2;
  const gc = o.glowc || (r ? pick(r, GLOWS) : GLOWS[0]), fr = o.frame || (F.lite() ? '#4a4458' : '#3e394c');
  if (o.shut) {
    const sw = Math.min(.34, (u1 - u0) * .5), sc = F.c(o.shut), sd = dk(sc, .32);
    for (const [a, b] of [[u0 - sw - .05, u0 - .05], [u1 + .05, u1 + sw + .05]]) { F.q(a, b, z0, z1, sc); for (let z = z0 + .14; z < z1 - .05; z += .19) F.l(a + .05, z, b - .05, z, sd); F.l(a, z0, a, z1, sd); F.l(b, z0, b, z1, sd); F.l(a, z0, b, z0, sd); F.l(a, z1, b, z1, sd); }
  }
  let top = z1;
  if (o.arch) {
    const rr = (u1 - u0) / 2, a = rr * .85; top = z1 + a;
    const pts = [[u0, z1 - .02], [u0, z1 + a * .5], [u0 + rr * .32, z1 + a * .87], [m, z1 + a], [u1 - rr * .32, z1 + a * .87], [u1, z1 + a * .5], [u1, z1 - .02]];
    if (o.trim) F.poly(pts.map(p => [p[0] + (p[0] < m - .01 ? -.08 : p[0] > m + .01 ? .08 : 0), p[1] + .08]), F.c(o.trim));
    F.poly(pts, F.lite() ? '#7fb6d0' : '#6aa2bd', F.lite() ? '#9fcbe0' : '#86bcd2'); if (on) glow(() => F.poly(pts, gc[0], gc[1]));
    for (let i = 0; i < 6; i++) F.l(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], fr);
    F.l(m, z1, m, z1 + a, fr);
  }
  if (o.trim) F.q(u0 - .08, u1 + .08, z0 - .06, z1 + (o.arch ? 0 : .08), F.c(o.trim));
  F.win(u0, u1, z0, z1, { on, mullion: o.mull === undefined ? 'cross' : o.mull, frame: fr, glowc: gc, glass: o.glass });
  if (o.curt) {
    const cw = (u1 - u0) * .4, ch = (z1 - z0) * .8, A = [[u0 + .03, z1 - .03], [u0 + cw, z1 - .03], [u0 + .03, z1 - ch]], B = [[u1 - .03, z1 - .03], [u1 - cw, z1 - .03], [u1 - .03, z1 - ch]];
    F.poly(A, F.c(o.curt)); F.poly(B, F.c(o.curt)); if (on) glow(() => { const c2 = mix(o.curt, gc[0], .4); F.poly(A, c2); F.poly(B, c2); });
  }
  if (o.blind) { const bz = z1 - (z1 - z0) * (o.blindh || .4); F.q(u0 + .03, u1 - .03, bz, z1 - .03, F.c(o.blind)); if (on) glow(() => F.q(u0 + .03, u1 - .03, bz, z1 - .03, mix(o.blind, gc[0], .5))); F.l(u0 + .03, bz, u1 - .03, bz, dk(o.blind, .4)); }
  if (o.lintel) F.q(u0 - .1, u1 + .1, top + .06, top + .2, F.c(o.lintel));
  if (o.sill !== false) F.box(u0 - .1, u1 + .1, z0 - .13, .07, .08, o.sillc || '#e6dfd0', { ol: false, t: snowTop(lt(o.sillc || '#e6dfd0', .2)) });
  if (o.fbox) flowerBox(F, u0 - .04, u1 + .04, z0 - .1, r || (() => .5), o.fbox === true ? undefined : o.fbox);
  if (o.cat) cat(F, m - .2, z0 + .2, o.cat === true ? undefined : o.cat);
}
/** a row of windows at storey base z. o: cols (centres) or bays opts, ww, wh, zo (sill height), skip(i), + win opts; per-window random flower boxes / cats via o.fboxP, o.catP */
export function winRow(F, len, z, o = {}) {
  const cs = o.cols || bays(len, o), ww = o.ww || .8, wh = o.wh || 1.15, zo = o.zo === undefined ? .5 : o.zo, r = o.r;
  cs.forEach((c, i) => {
    if (o.skip && o.skip(i, c)) return;
    const e = Object.assign({}, o);
    if (r) { if (o.fboxP) e.fbox = r() < o.fboxP ? (o.fbox || true) : false; if (o.catP) e.cat = r() < o.catP ? pick(r, ['#3a3440', '#d88a3a', '#e8e2d6', '#77706c']) : false; if (o.curts) e.curt = r() < .7 ? pick(r, o.curts) : null; }
    win(F, c - ww / 2, c + ww / 2, z + zo, z + zo + wh, e);
  });
  return cs;
}

/** door centred at u, base z. o: w,h,c,frame,glass,transom,arch,step,lite,on */
export function door(F, u, z, o = {}) {
  const w = o.w || .9, h = o.h || 1.6, c = o.c || '#7a3b2e', u0 = u - w / 2, u1 = u + w / 2, fc = F.c(o.frame || '#e8dfcc'), dc = F.c(c), dd = dk(dc, .22), ol = dk(dc, .55);
  let top = z + h; if (o.transom) top += .36;
  if (o.arch) { const a = w * .42, pts = [[u0 - .09, top], [u0 - .09, top + a * .55], [u0 + w * .18, top + a * .92], [u, top + a + .06], [u1 - w * .18, top + a * .92], [u1 + .09, top + a * .55], [u1 + .09, top]]; F.poly(pts, fc); const g = pts.map(p => [u + (p[0] - u) * .78, top + (p[1] - top) * .78]); F.poly(g, '#7fb6d0', '#9fcbe0'); glow(() => F.poly(g, '#ffd98a', '#f4c870')); F.l(u, top, u, top + a * .78, fc); F.l(u, top, u0 + .1, top + a * .5, fc); F.l(u, top, u1 - .1, top + a * .5, fc); }
  F.q(u0 - .09, u1 + .09, z, top + .09, fc);
  F.q(u0, u1, z, z + h, dc);
  if (o.glass) { F.win(u0 + .14, u1 - .14, z + .62, z + h - .15, { on: o.on !== false, mullion: o.gm || null, glowc: o.glowc, frame: ol }); F.q(u0 + .14, u1 - .14, z + .14, z + .48, dd); }
  else { F.q(u0 + .13, u1 - .13, z + .9, z + h - .14, dd); F.q(u0 + .13, u1 - .13, z + .14, z + .76, dd); if (o.lite) F.win(u0 + .22, u1 - .22, z + 1.0, z + h - .2, { on: true, frame: ol }); }
  if (o.double) F.l(u, z, u, z + h, ol);
  if (o.transom) F.win(u0, u1, z + h + .07, top, { on: true, mullion: 'v', frame: ol });
  F.l(u0, z, u0, z + h, ol); F.l(u1, z, u1, z + h, ol); F.l(u0, z + h, u1, z + h, ol);
  const hu = o.double ? u + .1 : u1 - .17; F.dot(hu, z + .8, 0, 0, '#f6d870'); F.dot(hu, z + .8, 0, 1, '#b89040'); if (o.double) F.dot(u - .1, z + .8, 0, 0, '#f6d870');
  if (o.wreath !== false && isWinter()) { bitmap(F, u - .16, z + 1.42, ['.##.', '#..#', '#..#', '.##.'], '#3f8a55'); F.dot(u - .16, z + 1.42, 1, 3, '#e8483f'); }
  if (o.step) F.box(u0 - .18, u1 + .18, z - o.step, o.step, o.stepd || .3, o.stepc || '#b9b3a6', { t: snowTop(lt(o.stepc || '#b9b3a6', .15)) });
}
/** carriage lamp on the wall, glowing at night */
export function wallLamp(F, u, z) {
  F.l(u, z + .3, u, z + .34, '#2a2a34', .12); F.box(u - .08, u + .08, z, .24, .14, '#2f2f3a', { ol: false }, .05);
  F.q(u - .05, u + .05, z + .04, z + .2, '#f3e3b0', null, .2); glow(() => { F.q(u - .08, u + .08, z, z + .24, '#fff2c4', null, .2); });
}
export function drainpipe(F, u, z0, z1, c = '#4a4f5c') { F.l(u, z0, u, z1, c, .04); F.l(u + .07, z0, u + .07, z1, lt(c, .25), .04); for (let z = z0 + .6; z < z1; z += 1.6) F.l(u - .05, z, u + .12, z, dk(c, .3), .04); }
/** sloped awning. z = height where it meets the wall. o: dep, drop, c, c2 (stripe), step, val (valance height), scallop */
export function awning(F, u0, u1, z, o = {}) {
  const dep = o.dep || .7, drop = o.drop === undefined ? .35 : o.drop, a = o.c || '#b8433a', b = o.c2, val = o.val === undefined ? .16 : o.val, step = o.step || .25, k = F.k() * .5;
  const G = F.perp(u1); fq([F.P(u1, z, 0), F.P(u1, z - drop, dep), F.P(u1, z - drop - val, dep), F.P(u1, z - drop - val, 0)], dk(G.c(a), .25), 'glass');
  let i = 0;
  for (let u = u0; u < u1 - 1e-6; u += step, i++) {
    const ue = Math.min(u + step, u1), col = b && (i & 1) ? b : a;
    fq([F.P(u, z, 0), F.P(ue, z, 0), F.P(ue, z - drop, dep), F.P(u, z - drop, dep)], dk(col, k));
    if (val) { F.q(u, ue, z - drop - val, z - drop, dk(col, k + .16), null, dep); if (o.scallop) { F.dot(u, z - drop - val, 0, -1, dk(col, .7), dep); } }
  }
  fq([F.P(u1, z, 0), F.P(u1, z - drop, dep), F.P(u1, z - drop, 0)], dk(G.c(a), .1));
  if (isWinter()) fq([F.P(u0, z, 0), F.P(u1, z, 0), F.P(u1, z - drop * .55, dep * .55), F.P(u0, z - drop * .55, dep * .55)], SNOW, 'glass');
  const oc = dk(a, .6); F.l(u0, z - drop - val, u1, z - drop - val, oc, dep); lw(F.P(u1, z, 0), F.P(u1, z - drop, dep), oc); lw(F.P(u0, z, 0), F.P(u0, z - drop, dep), oc); F.l(u0, z - drop, u0, z - drop - val, oc, dep); F.l(u1, z - drop, u1, z - drop - val, oc, dep);
  F.l(u0, z, u1, z, lt(a, .35));
}
/** shop window with timber surround, stall riser, mullions and goods on display. spans z 0..o.top */
export function shopfront(F, u0, u1, o = {}) {
  const z0 = o.z || 0, z1 = z0 + (o.top || 1.7), c = o.c || '#2f5f55', fc = F.c(c), base = z0 + (o.base === undefined ? .42 : o.base), r = o.r, ol = dk(fc, .5);
  F.q(u0, u1, z0, z1, fc); F.q(u0, u1, z0, base, dk(fc, .1));
  const g0 = u0 + .12, g1 = u1 - .12, n = Math.max(1, Math.round((g1 - g0) / (o.pane || 1.15)));
  for (let i = 0; i < n; i++) { const a = g0 + (g1 - g0) * i / n, b = g0 + (g1 - g0) * (i + 1) / n; if (base - z0 > .3) F.q(a + .08, b - .08, z0 + .1, base - .1, dk(fc, .25)); }
  F.win(g0, g1, base, z1 - .1, { on: true, frame: ol, glowc: o.glowc || ['#ffe3a8', '#f4cf86'] });
  if (o.goods && r) for (let u = g0 + .12; u < g1 - .22; u += .26 + r() * .12) { const col = pick(r, o.goods), hh = .1 + r() * (o.goodsh || .22); F.q(u, u + .17, base + .03, base + .03 + hh, col); F.l(u, base + .03 + hh, u + .17, base + .03 + hh, lt(col, .3)); }
  if (o.shelf && r) { const sz = base + (z1 - base) * .5; F.l(g0, sz, g1, sz, ol); for (let u = g0 + .1; u < g1 - .2; u += .22 + r() * .1) { const col = pick(r, o.goods || ['#d9562b']); F.q(u, u + .14, sz + .02, sz + .1 + r() * .16, col); } }
  if (o.transom !== false) { const tz = z1 - .42; F.l(g0, tz, g1, tz, ol); }
  for (let i = 1; i < n; i++) { const u = g0 + (g1 - g0) * i / n; F.q(u - .04, u + .04, base, z1 - .1, fc); }
  F.l(u0, base, u1, base, lt(fc, .3)); F.l(u0, z0, u0, z1, ol); F.l(u1, z0, u1, z1, ol);
  if (o.decal) F.text(o.decal, g0, g1, base + (z1 - base) * .62, o.decalc || '#f4ead0', .01);
}
/** fascia sign board with mouldings; text fitted (falls back to first word / truncation) */
export function fascia(F, str, u0, u1, z0, z1, bg, fg, o = {}) {
  const max = Math.floor(((u1 - u0) * U - 3 + 1) / 4); let s = String(str);
  if (s.length > max) { const ws = s.split(' '); s = ws[0].length <= max ? ws.reduce((a, w) => (a + ' ' + w).trim().length <= max ? (a + ' ' + w).trim() : a, '') : s.slice(0, max); }
  F.box(u0 - .04, u1 + .04, z0 - .06, z1 - z0 + .12, .08, o.mould || dk(bg, .25), { ol: false, t: snowTop(lt(bg, .2)) });
  F.sign(s, u0, u1, z0, z1, F.c(bg), fg, { lit: o.lit }, .09);
}
const ICONS = {
  cup: ['.#.#.', '.....', '####.', '#####', '####.', '.##..'], bread: ['.###.', '#####', '#.#.#', '#####'], book: ['##.##', '##.##', '##.##', '#####'],
  bowl: ['.#.#.', '.....', '#####', '#####', '.###.'], clover: ['.#.#.', '#####', '.###.', '#####', '..#..'], star: ['..#..', '#####', '.###.', '#.#.#'],
  fish: ['.##.#', '#####', '.##.#'], key: ['.##..', '#..##', '.##.#'], scissors: ['#..#', '.##.', '.##.', '#..#'], note: ['..##', '..#.', '###.', '###.'], leaf: ['..##', '.###', '###.', '#...'],
};
/** projecting board sign hanging from a bracket at (u,z). o: c, fg, icon, w, h, lit */
export function hangSign(F, u, z, o = {}) {
  const G = F.perp(u), a = F.pos + .14, b = F.pos + (o.w || .66), h = o.h || .5, c = o.c || '#2b2f3a', fg = o.fg || '#f6d870';
  lw(F.P(u, z + .1, 0), F.P(u, z + .1, b - F.pos + .04), '#2a2a34'); lw(F.P(u, z + .1, .3), F.P(u, z - .04, .3), '#2a2a34'); lw(F.P(u, z + .1, .5), F.P(u, z - .04, .5), '#2a2a34');
  const d = () => { G.q(a, b, z - h - .04, z - .04, G.c(c)); const ic = ICONS[o.icon || 'star'], pw = (b - a) * U; bitmap(G, a, z - .04, ic.map(s => s), fg, 0); };
  const dd = () => { G.q(a, b, z - h - .04, z - .04, G.c(c)); const ic = ICONS[o.icon || 'star'], iw = ic[0].length, ih = ic.length, pw = Math.round((b - a) * U), ph = Math.round(h * U);
    const ox = Math.floor((pw - iw) / 2), oy = Math.floor((ph - ih) / 2) + 1; ic.forEach((row, j) => { for (let i = 0; i < iw; i++) if (row[i] === '#') { const p = G.P(G.Y ? a : b, z - .04, 0); spx(p[0], p[1], p[2], ox + i, oy + j - Math.round((G.Y ? 1 : -1) * (ox + i) / 2) * (G.Y ? -1 : 1) * (G.Y ? -1 : 1), fg); } }); };
  void d; if (o.lit) lit(dd); else dd();
  const oc = dk(c, .6); G.l(a, z - h - .04, b, z - h - .04, oc); G.l(a, z - .04, b, z - .04, oc); G.l(a, z - h - .04, a, z - .04, oc); G.l(b, z - h - .04, b, z - .04, oc);
}
/** vertical blade sign with stacked letters, projecting from the wall; top at z. lit day & night */
export function neonV(F, u, z, str, o = {}) {
  const G = F.perp(u), a = F.pos + (o.gap === undefined ? .1 : o.gap), b = a + .5, s = String(str).toUpperCase(), h = s.length * .4 + .16, bg = o.bg || '#2a2440', fg = o.fg || '#ff6a8a';
  lw(F.P(u, z - .15, 0), F.P(u, z - .15, a - F.pos), '#2a2a34'); lw(F.P(u, z - h + .15, 0), F.P(u, z - h + .15, a - F.pos), '#2a2a34');
  G.q(a, b, z - h, z, G.c(bg));
  lit(() => { for (let i = 0; i < s.length; i++) G.text(s[i], a, b, z - .12 - i * .4, fg, 0); const e = o.edge || fg; G.l(a, z - h, a, z, e); G.l(b, z - h, b, z, e); G.l(a, z, b, z, e); G.l(a, z - h, b, z - h, e); });
}
/** flat vertical sign painted/mounted on the wall, stacked letters */
export function signV(F, u, z, str, o = {}) {
  const s = String(str).toUpperCase(), h = s.length * .4 + .16, bg = o.bg || '#2a2440', fg = o.fg || '#ffd35a', a = u - .28, b = u + .28;
  const d = () => { F.q(a, b, z - h, z, F.c(bg), null, .03); for (let i = 0; i < s.length; i++) F.text(s[i], a, b, z - .12 - i * .4, fg, .03); };
  if (o.lit) lit(d); else d(); const e = dk(bg, .5); F.l(a, z - h, a, z, e, .03); F.l(b, z - h, b, z, e, .03);
}
/** noren (split shop curtain) hanging from z */
export function noren(F, u0, u1, z, o = {}) {
  const c = o.c || '#34406a', h = o.h || .5, n = o.n || Math.max(2, Math.round((u1 - u0) / .42)), fc = F.c(c), mk = o.mark || '#f4ead0';
  F.l(u0 - .06, z + .03, u1 + .06, z + .03, '#4a3a2e', .05);
  for (let i = 0; i < n; i++) { const a = u0 + (u1 - u0) * i / n, b = u0 + (u1 - u0) * (i + 1) / n; F.q(a + .015, b - .015, z - h + (i % 2 ? .04 : 0), z, fc, null, .05); F.dot((a + b) / 2, z - h * .45, 0, 0, mk, .05); F.dot((a + b) / 2, z - h * .45, -1, 0, mk, .05); F.dot((a + b) / 2, z - h * .45, 0, 1, mk, .05); F.dot((a + b) / 2, z - h * .45, 0, -1, mk, .05); F.dot((a + b) / 2, z - h * .45, 1, 0, mk, .05); }
}
const LANT = [['.k.', 'hrr', 'hrr', 'rrd', '.g.'], ['.kkk.', 'hrrrd', 'hrrrd', 'hgggd', 'hrrrd', '.rrd.', '..g..'], ['..kkk..', '.hrrrd.', 'hhrrrdd', 'hhrrrdd', 'hhrrrdd', 'hhrrrdd', '.hrrrd.', '..kkk..', '...g...']];
const LANTG = [['...', 'yoo', 'yyo', 'ooo', '...'], ['.....', 'oyyoo', 'yyyyo', 'oyyoo', 'oyyoo', '.ooo.', '.....'], ['.......', '.oyyoo.', 'oyyyyoo', 'oyyyyoo', 'oyyyyoo', 'ooyyooo', '.ooooo.', '.......', '.......']];
/** paper lantern hanging from world point pt. o.s: 0 small, 1 medium, 2 large; o.c colour */
export function lantern(pt, o = {}) {
  const s = o.s || 0, c = o.c || '#d8432f', cx = s + 1;
  sprite(pt, LANT[s], { k: '#2a2430', r: c, h: lt(c, .3), d: dk(c, .25), g: '#e8b84a' }, cx);
  glow(() => sprite(pt, LANTG[s], { y: lt(c, .7), o: mix(c, '#ffb050', .5) }, cx));
}
/** sagging string of lanterns between world points a and b */
export function lanternString(a, b, n, o = {}) {
  const sag = o.sag === undefined ? .3 : o.sag, P = t => { const p = L3(a, b, t); p[2] -= sag * 4 * t * (1 - t); return p; }, cols = o.cols || ['#d8432f'];
  for (let i = 0; i < 12; i++) lw(P(i / 12), P((i + 1) / 12), '#3a3440');
  for (let i = 0; i < n; i++) lantern(P((i + .5) / n), { s: o.s || 0, c: cols[i % cols.length] });
}
/** festive string of tiny bulbs (always bright) */
export function stringLights(a, b, n, o = {}) {
  const sag = o.sag === undefined ? .2 : o.sag, P = t => { const p = L3(a, b, t); p[2] -= sag * 4 * t * (1 - t); return p; }, cols = o.cols || ['#ffe08a', '#ff8a6a', '#ffe08a', '#8fd0ff', '#ffe08a', '#9fe08a'];
  for (let i = 0; i < 10; i++) lw(P(i / 10), P((i + 1) / 10), '#3a3440');
  lit(() => { for (let i = 0; i < n; i++) { const p = P((i + .5) / n); spx(p[0], p[1], p[2], 0, 1, cols[i % cols.length]); } });
}
/** bunting flags between two world points */
export function bunting(a, b, n, cols = ['#e8483f', '#f6d04d', '#4f9ad8', '#f4f0e8', '#5aa84f']) {
  const P = t => { const p = L3(a, b, t); p[2] -= .25 * 4 * t * (1 - t); return p; };
  for (let i = 0; i < n; i++) { const p = P(i / n), q = P((i + 1) / n), m = P((i + .5) / n); lw(p, q, '#4a4458'); fq([p, q, [m[0], m[1], m[2] - .3]], cols[i % cols.length]); }
}
export function poster(F, u, z, r, o = {}) {
  const w = o.w || .45, h = o.h || .6, c = pick(r, ['#e8c84a', '#d85a4a', '#4a9ac0', '#e8e0cc', '#e88ab0', '#6ab890']);
  F.q(u, u + w, z, z + h, F.c(c), null, .02); F.q(u + .06, u + w - .06, z + h * .45, z + h - .08, F.c(dk(c, .35)), null, .02); F.l(u + .06, z + .12, u + w - .08, z + .12, dk(c, .5), .02); F.l(u + .06, z + .22, u + w - .14, z + .22, dk(c, .5), .02);
}
/** chalkboard / menu board on the wall */
export function chalkboard(F, u, z, o = {}) {
  const w = o.w || .6, h = o.h || .8; F.q(u - .04, u + w + .04, z - .04, z + h + .04, F.c('#8a6a4a'), null, .03); F.q(u, u + w, z, z + h, '#2f3a36', null, .03);
  for (let i = 0; i < 4; i++) F.l(u + .08, z + h - .14 - i * .16, u + w - .1 - (i % 2) * .14, z + h - .14 - i * .16, i ? '#c8d0c4' : '#f6d870', .03);
}
/** climbing ivy patch growing from (cu, z0) */
export function ivy(F, u0, u1, z0, z1, o = {}) {
  const g = foliage('leaf', o.v || 0), cols = g ? [F.c(g), F.c(dk(g, .22)), F.c(lt(g, .18)), F.c(g)] : [F.c('#6b5a48')];
  const s = .125, cu = o.cu === undefined ? u0 : o.cu, wd = u1 - u0, ht = z1 - z0, sd = o.seed || 7;
  for (let u = u0; u < u1 - 1e-6; u += s) for (let z = z0; z < z1 - 1e-6; z += s) {
    const a = Math.abs(u - cu) / wd, b = (z - z0) / ht, dens = 1.15 - a * a * 1.2 - b * b * 1.05, k = hash2(Math.round(u / s), Math.round(z / s), sd);
    if (k < dens * (g ? .85 : .22)) F.q(u, u + s, z, z + s, cols[Math.floor(k * 977) % cols.length], null, .02);
  }
}
/** iron railing along a face between u0..u1 at base z */
export function railing(F, u0, u1, z, o = {}) {
  const c = o.c || '#2f2f3a', h = o.h || .55, off = o.off || 0, n = Math.max(1, Math.round((u1 - u0) / (o.step || .22)));
  for (let i = 0; i <= n; i++) { const u = u0 + (u1 - u0) * i / n; F.l(u, z, u, z + h, c, off); }
  F.l(u0, z + h, u1, z + h, c, off); F.l(u0, z + .08, u1, z + .08, c, off);
}
/** small balcony: slab + railing (+ optional plants) */
export function balcony(F, u0, u1, z, o = {}) {
  const dep = o.dep || .4, c = o.c || '#2f2f3a';
  F.box(u0, u1, z - .1, .1, dep, o.slab || '#b9b3a6', { ol: false });
  F.l(u0, z - .1, u1, z - .1, dk(o.slab || '#b9b3a6', .5), dep);
  lw(F.P(u0, z + .5, 0), F.P(u0, z + .5, dep), c); lw(F.P(u1, z + .5, 0), F.P(u1, z + .5, dep), c); lw(F.P(u1, z, 0), F.P(u1, z, dep), c);
  if (o.plants && o.r) { for (let u = u0 + .1; u < u1 - .15; u += .3) if (o.r() < .6) { const g = F.c(leafC(o.r())); F.q(u, u + .2, z, z + .28, g, dk(g, .2), dep * .6); const fc = flowerC(o.r); if (fc) F.dot(u + .1, z + .28, 0, 0, fc, dep * .6); } }
  railing(F, u0, u1, z, { c, h: .5, off: dep, step: o.step || .16 });
}
/** zig-zag fire escape. zs = platform heights (bottom first) */
export function fireEscape(F, u0, u1, zs, o = {}) {
  const c = o.c || '#30303c', dep = o.dep || .5, c2 = lt(c, .22);
  zs.forEach((z, i) => {
    F.box(u0, u1, z - .07, .07, dep, c, { ol: false, t: lt(c, .3) });
    if (i < zs.length - 1) {
      const z2 = zs[i + 1] - .07, a = i % 2 ? u1 - .2 : u0 + .2, b = i % 2 ? u0 + .45 : u1 - .45;
      for (let k = 0; k <= 7; k++) { const t = k / 7, u = a + (b - a) * t, zz = z + (z2 - z) * t; lw(F.P(u, zz, .1), F.P(u, zz, .36), c2); }
      for (const o2 of [.1, .36]) { lw(F.P(a, z, o2), F.P(b, z2, o2), c); lw(F.P(a, z + .5, o2), F.P(b, z2 + .5, o2), c); }
    }
    lw(F.P(u0, z + .55, 0), F.P(u0, z + .55, dep), c); lw(F.P(u1, z + .55, 0), F.P(u1, z + .55, dep), c); lw(F.P(u1, z + .28, 0), F.P(u1, z + .28, dep), c);
    railing(F, u0, u1, z, { c, h: .55, off: dep, step: .25 }); F.l(u0, z + .28, u1, z + .28, c, dep);
  });
  if (o.ladder !== false) { const z = zs[0] - .07, a = zs.length % 2 ? u0 + .12 : u1 - .4; F.l(a, z - 1.05, a, z, c, dep * .7); F.l(a + .26, z - 1.05, a + .26, z, c, dep * .7); for (let zz = z - .95; zz < z; zz += .2) F.l(a, zz, a + .26, zz, c2, dep * .7); }
}
/** washing line with clothes between two world points */
export function laundry(a, b, r, o = {}) {
  const P = t => { const p = L3(a, b, t); p[2] -= .12 * 4 * t * (1 - t); return p; }, n = o.n || Math.max(2, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / .55));
  const cols = ['#f4f0e8', '#e86a5a', '#5a9ad8', '#f6d04d', '#f4f0e8', '#8ac89a', '#e8a0c0', '#4a5a8a'];
  for (let i = 0; i < 8; i++) lw(P(i / 8), P((i + 1) / 8), '#cfc8b8');
  if (isWinter() && !o.always) return;
  for (let i = 0; i < n; i++) { if (r() < .22) continue; const t0 = (i + .15) / n, t1 = (i + .85) / n, p = P(t0), q = P(t1), h = .28 + r() * .32, c = pick(r, cols); fq([p, q, [q[0], q[1], q[2] - h], [p[0], p[1], p[2] - h]], c); lw([p[0], p[1], p[2] - h], [q[0], q[1], q[2] - h], dk(c, .3)); lw(p, [p[0], p[1], p[2] - h], dk(c, .25)); }
}

/* ---------------- roofs ---------------- */
/** screen-space shingle rows for a sloped roof polygon. alongX: tile rows run along world x */
export function shingle(c, alongX, o = {}) {
  const s = (alongX !== isFlipped()) ? -1 : 1, d1 = dk(c, .22), l1 = lt(c, .12), st = o.step || 3, tick = o.tick;
  return (X, Y) => { const v = Y + s * (X >> 1) + 8192, row = Math.floor(v / st); if (v % st === 0) return d1; if (tick && (X + (row & 1) * 2) % 4 === 0) return d1; return hash2(((X + (row & 1) * 3) / 6) | 0, row, 5) > .8 ? l1 : c; };
}
/** brick (or any PAT) on an arbitrary polygon lying in a wall plane. onY: plane faces +y */
export function planePat(pat, onY) { const s = (onY !== isFlipped()) ? -1 : 1; return (X, Y) => pat(X, 8192 - Y - s * (X >> 1)); }
/** snow over a sloped quad S = [eaveA, eaveB, ridgeB, ridgeA] */
export function snowQuad(S, t0 = .1, t1 = .3, c = SNOW) { const [e0, e1, r1, r0] = S; fq([L3(e0, r0, t1), L3(e1, r1, t1), r1, r0], c); fq([L3(e0, r0, t0), L3(e1, r1, t0), L3(e1, r1, t1), L3(e0, r0, t1)], c, 'glass'); }
const slopeLite = onY => onY !== isFlipped();
/** gable roof, ridge along x: big slope faces the street (+y), gable end wall on +x. o: over, wall, wallPat, tick */
export function roofX(x, y, z, w, d, h, c, o = {}) {
  const ov = o.over === undefined ? .15 : o.over, m = y + d / 2, wc = o.wall, sc = slopeLite(true) ? c : dk(c, .2), oc = dk(c, .65);
  if (wc) fq([[x + w, y, z], [x + w, y + d, z], [x + w, m, z + h]], o.wallPat || sX(wc));
  const ez = z - ov * h / (d / 2), S = [[x, y + d + ov, ez], [x + w, y + d + ov, ez], [x + w, m, z + h], [x, m, z + h]];
  fq(S, shingle(sc, true, o));
  if (isWinter()) snowQuad(S, .08, .28, slopeLite(true) ? SNOW : SNOW2);
  lw(S[0], S[1], oc); lw([x, y + d + ov, ez - .07], [x + w, y + d + ov, ez - .07], oc); lw(S[1], S[2], oc); lw(S[0], S[3], oc); lw(S[3], S[2], isWinter() ? SNOW : lt(c, .4));
  return { s: h / (d / 2), S };
}
/** gable roof, ridge along y: gable end faces the street (+y), visible slope faces +x. */
export function roofY(x, y, z, w, d, h, c, o = {}) {
  const ov = o.over === undefined ? .15 : o.over, m = x + w / 2, wc = o.wall, sc = slopeLite(false) ? c : dk(c, .2), oc = dk(c, .65), f = y + d + (o.ovf === undefined ? .12 : o.ovf);
  if (wc) fq([[x, y + d, z], [x + w, y + d, z], [m, y + d, z + h]], o.wallPat || sY(wc));
  const ez = z - ov * h / (w / 2), S = [[x + w + ov, f, ez], [x + w + ov, y, ez], [m, y, z + h], [m, f, z + h]];
  fq(S, shingle(sc, false, o));
  if (isWinter()) snowQuad(S, .08, .28, slopeLite(false) ? SNOW : SNOW2);
  lw(S[0], S[1], oc); lw([x + w + ov, f, ez - .07], [x + w + ov, y, ez - .07], oc); lw(S[1], S[2], oc); lw(S[3], S[2], isWinter() ? SNOW : lt(c, .4));
  const bc = o.barge || dk(c, .35); for (const dz of [0, -.07, -.14]) { lw([x - ov, f, ez + dz], [m, f, z + h + dz], dz ? bc : oc); lw([x + w + ov, f, ez + dz], [m, f, z + h + dz], dz ? bc : oc); }
  return { s: h / (w / 2), S };
}
/** dormer on a slope above face F (F = the wall plane under the eave). inset = how far behind the wall plane its front sits; s = slope rise per unit depth; zb = z of roof surface at the dormer front */
export function dormer(F, u0, u1, inset, zb, dh, s, o = {}) {
  const wc = o.wall || '#e8e0d0', rc = o.roof || '#5a4a4a', um = (u0 + u1) / 2, rh = o.rh === undefined ? (u1 - u0) * .38 : o.rh, top = zb + dh + rh, G = F.perp(u1), ov = .08;
  const bk = dz => -inset - dz / s;
  fq([F.P(u1, zb, -inset), F.P(u1, zb + dh, -inset), F.P(u1, zb + dh, bk(dh))], G.c(wc));
  F.q(u0, u1, zb, zb + dh, F.c(wc), null, -inset);
  if (o.flat) { fq([F.P(u0 - ov, zb + dh, -inset + ov), F.P(u1 + ov, zb + dh, -inset + ov), F.P(u1 + ov, zb + dh, bk(dh)), F.P(u0 - ov, zb + dh, bk(dh))], snowTop(rc)); F.l(u0 - ov, zb + dh, u1 + ov, zb + dh, dk(rc, .6), -inset + ov); F.l(u0 - ov, zb + dh - .06, u1 + ov, zb + dh - .06, dk(rc, .6), -inset + ov); }
  else {
    fq([F.P(u0, zb + dh, -inset), F.P(u1, zb + dh, -inset), F.P(um, top, -inset)], F.c(wc));
    const R = [F.P(u1 + ov, zb + dh - .06, -inset + ov), F.P(u1 + ov, zb + dh - .06, bk(dh)), F.P(um, top, bk(dh + rh)), F.P(um, top, -inset + ov)];
    fq(R, isWinter() ? SNOW2 : G.c(rc));
    const oc = dk(rc, .6); lw(R[0], R[3], oc); lw(R[0], R[1], oc); lw(F.P(u0 - ov, zb + dh - .06, -inset + ov), R[3], oc); lw(F.P(u0 - ov, zb + dh - .12, -inset + ov), F.P(um, top - .06, -inset + ov), F.c(rc)); lw(F.P(u1 + ov, zb + dh - .12, -inset + ov), F.P(um, top - .06, -inset + ov), F.c(rc));
  }
  win(F.off(-inset), u0 + .12, u1 - .12, zb + .14, zb + dh - .1, Object.assign({ sill: false, mull: 'v' }, o.win));
  F.l(u0, zb, u0, zb + dh, dk(wc, .55), -inset); F.l(u1, zb, u1, zb + dh, dk(wc, .55), -inset);
}
/** mansard: steep slopes up to a flat deck. party=true: only the street (+y) slope, +x side is a flat party wall. returns slope info */
export function mansard(x, y, z, w, d, h, inn, c, o = {}) {
  const oc = dk(c, .65), cy = slopeLite(true) ? c : dk(c, .2), cx = slopeLite(false) ? c : dk(c, .2), deck = snowTop(o.deck || '#6f6a70'), pat = { step: 3, tick: true };
  if (o.party) {
    qz(x, x + w, y, y + d - inn, z + h, deck);
    fq([[x + w, y, z], [x + w, y + d, z], [x + w, y + d - inn, z + h], [x + w, y, z + h]], o.wallPat || sX(o.wall || c));
    const S = [[x, y + d, z], [x + w, y + d, z], [x + w, y + d - inn, z + h], [x, y + d - inn, z + h]]; fq(S, shingle(cy, true, pat));
    if (isWinter()) snowQuad(S, .55, .8);
    lw(S[0], S[1], oc); lw(S[1], S[2], oc); lw(S[0], S[3], oc); lw(S[3], S[2], lt(c, .4)); lw([x + w, y, z + h], [x + w, y + d - inn, z + h], oc);
  } else {
    qz(x + inn, x + w - inn, y + inn, y + d - inn, z + h, deck);
    const Sx = [[x + w, y + d, z], [x + w, y, z], [x + w - inn, y + inn, z + h], [x + w - inn, y + d - inn, z + h]]; fq(Sx, shingle(cx, false, pat));
    const S = [[x, y + d, z], [x + w, y + d, z], [x + w - inn, y + d - inn, z + h], [x + inn, y + d - inn, z + h]]; fq(S, shingle(cy, true, pat));
    if (isWinter()) { snowQuad(S, .55, .8); snowQuad(Sx, .55, .8, SNOW2); }
    lw(S[0], S[1], oc); lw(S[1], S[2], lt(c, .3)); lw(S[0], S[3], oc); lw(S[3], S[2], lt(c, .4)); lw(Sx[0], Sx[1], oc); lw(Sx[1], Sx[2], oc); lw(Sx[2], Sx[3], lt(c, .4));
  }
  return { s: h / inn };
}
/** flat roof with parapet (+ optional cornice overhang & dentils). returns the usable deck {z,x0,y0,x1,y1} */
export function flatRoof(x, y, z, w, d, o = {}) {
  const pc = o.c || '#8a6f64', ph = o.ph === undefined ? .35 : o.ph, t = o.t === undefined ? .2 : o.t, ov = o.ov || 0, rc = isWinter() ? SNOW : (o.roof || '#77706c'), hh = Math.min(.3, ph), zt = z + ph, zf = zt - hh;
  if (o.dent) box(x - ov * .5, y - ov * .5, z - .14, w + ov, d + ov, .14, dk(pc, .1), { ol: false });
  box(x - ov, y - ov, z, w + 2 * ov, d + 2 * ov, ph, pc, { l: o.l, r: o.r, t: snowTop(o.cap || lt(pc, .18)) });
  if (o.dent) { const a = dk(sY(pc), .4), b = dk(sX(pc), .4); for (let u = x - ov + .1; u < x + w + ov - .05; u += .25) lw([u, y + d + ov, z + .05], [u, y + d + ov, z + .14], a); for (let v = y - ov + .1; v < y + d + ov - .05; v += .25) lw([x + w + ov, v, z + .05], [x + w + ov, v, z + .14], b); }
  qz(x + t, x + w - t - hh, y + t, y + d - t - hh, zf, rc, isWinter() ? '#e6edf3' : dk(rc, .05));
  qy(x + t, x + w - t - hh, y + t, zf, zt, sY(dk(pc, .3))); qx(x + t, y + t, y + d - t - hh, zf, zt, sX(dk(pc, .3)));
  return { z: zf, x0: x + t + .1, y0: y + t + .1, x1: x + w - t - hh - .1, y1: y + d - t - hh - .1 };
}
export function chimney(x, y, z, h, c = '#a8553f', o = {}) {
  const w = o.w || .5, d = o.d || .5;
  box(x, y, z, w, d, h, c, { l: PAT.brick(sY(c)), r: PAT.brick(sX(c)) });
  box(x - .06, y - .06, z + h, w + .12, d + .12, .1, '#cfc6b4', { t: snowTop('#ddd4c2') });
  const n = o.pots === undefined ? (w > .7 ? 2 : 1) : o.pots; for (let i = 0; i < n; i++) box(x + .1 + i * (w - .42), y + d / 2 - .1, z + h + .1, .22, .2, .22, '#c9744a', { ol: false, t: '#3a2f33' });
}
export function waterTank(x, y, z, o = {}) {
  const r = o.r || .55, h = o.h || 1.1, lg = o.leg === undefined ? .7 : o.leg, c = o.c || '#9a7450', lc = '#3f3a40';
  for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) lw([x + a * r * .7, y + b * r * .7, z], [x + a * r * .7, y + b * r * .7, z + lg], lc);
  lw([x - r * .7, y + r * .7, z], [x + r * .7, y + r * .7, z + lg], lc); lw([x + r * .7, y + r * .7, z + lg], [x + r * .7, y - r * .7, z], lc);
  box(x - r * .8, y - r * .8, z + lg, r * 1.6, r * 1.6, .08, '#4a3a2e', { ol: false });
  cyl(x, y, z + lg + .08, r, h, c);
  for (const hz of [.2, .6, .95]) { const s = PW(x, y, z + lg + .08 + h * hz), rx = r * U * 1.414, ry = rx / 2; for (let X = Math.ceil(s[0] - rx); X <= Math.floor(s[0] + rx); X++) { const k = (X - s[0]) / rx; spx(0, 0, 0, 0, 0, '#000000'.slice(0, 0) || '#3f3a40'); void k; } }
  cone(x, y, z + lg + .08 + h, r * 1.12, .45, isWinter() ? '#e9eff5' : (o.roof || '#5a4f58'));
}
export function acUnit(x, y, z) { box(x, y, z, .7, .5, .42, '#b9bec4', { t: snowTop('#c9ced4') }); const F = face('y', y + .5); F.q(x + .08, x + .42, z + .07, z + .35, '#6f7680'); F.l(x + .08, z + .21, x + .42, z + .21, '#4a505a'); F.l(x + .25, z + .07, x + .25, z + .35, '#4a505a'); F.l(x + .5, z + .12, x + .62, z + .12, '#4a505a'); }
export function antenna(x, y, z, h = 1.4) { lw([x, y, z], [x, y, z + h], '#4a4a56'); for (let i = 0; i < 3; i++) lw([x - .3 + i * .05, y, z + h - .15 - i * .22], [x + .3 - i * .05, y, z + h - .15 - i * .22], '#5a5a66'); }
export function ventPipe(x, y, z, h = .5) { cyl(x, y, z, .12, h, '#9aa0a8'); cyl(x, y, z + h, .18, .08, '#7a8088', { t: snowTop('#8a9098') }); }
export function skylight(x, y, z) { box(x, y, z, .9, .7, .14, '#5a5560'); qz(x + .08, x + .82, y + .08, y + .62, z + .15, '#8fc0d6', '#a8d4e4'); glow(() => qz(x + .08, x + .82, y + .08, y + .62, z + .15, '#ffd98a', '#f4c870')); lw([x + .45, y + .08, z + .15], [x + .45, y + .62, z + .15], '#4a4458'); }
/** rooftop stair bulkhead with a door */
export function bulkhead(x, y, z, c = '#8a6f64', o = {}) { const w = o.w || 1.1, d = o.d || 1.3, h = 1.5; walls(x, y, z, w, d, h, c, o.mat || 'brick', { t: snowTop('#6f6a70') }); const F = face('y', y + d); F.q(x + .25, x + .85, z, z + 1.2, F.c('#4a5a66')); F.dot(x + .72, z + .6, 0, 0, '#d8c070'); glow(() => F.q(x + .4, x + .7, z + .75, z + 1.05, '#ffd98a')); }
/** planter with seasonal greenery */
export function planter(x, y, z, w, d, r, o = {}) {
  box(x, y, z, w, d, .3, o.c || '#8a6a4a', { t: isWinter() ? SNOW : '#5a4334' });
  if (isWinter()) return; const n = Math.max(1, Math.round(Math.max(w, d) / .45));
  for (let i = 0; i < n; i++) { const t = (i + .5) / n, px = w >= d ? x + w * t : x + w / 2, py = w >= d ? y + d / 2 : y + d * t, g = leafC(r()); ball(px, py, z + .42 + r() * .1, .2 + r() * .08, g); const fc = flowerC(r); if (fc && r() < .6) spx(px, py, z + .6, 0, 0, fc); }
}
/** potted evergreen / topiary */
export function pot(x, y, z, o = {}) { const s = o.s || 1; box(x - .14 * s, y - .14 * s, z, .28 * s, .28 * s, .26 * s, o.c || '#b8643f', { ol: false }); const g = foliage('pine', o.v || 0); ball(x, y, z + .26 * s + .26 * s, .26 * s, g, isWinter() ? { t: SNOW } : undefined); if (o.tall) ball(x, y, z + .26 * s + .62 * s, .19 * s, g, isWinter() ? { t: SNOW } : undefined); }
/** parasol (open in spring/summer, furled otherwise) */
export function parasol(x, y, z, c = '#e8483f', c2 = '#f4f0e8') {
  lw([x, y, z], [x, y, z + 1.5], '#6a5a4a');
  if (ENV.season <= 1) { const r = .7, t = [x, y, z + 1.65]; const ps = [[x - r, y - r], [x + r, y - r], [x + r, y + r], [x - r, y + r]]; for (let i = 0; i < 4; i++) fq([[ps[i][0], ps[i][1], z + 1.3], [ps[(i + 1) % 4][0], ps[(i + 1) % 4][1], z + 1.3], t], i === 1 ? dk(c, .2) : i === 2 ? c2 : i === 3 ? c : dk(c2, .2)); lw([x - r, y + r, z + 1.3], [x + r, y + r, z + 1.3], dk(c, .5)); lw([x + r, y + r, z + 1.3], [x + r, y - r, z + 1.3], dk(c, .5)); }
  else box(x - .06, y - .06, z + .7, .12, .12, .8, c, { ol: false });
}
/** scatter rooftop clutter on a deck region R = {z,x0,y0,x1,y1}. kinds: ac vent hatch antenna dish skylight tank planter */
export function roofStuff(r, R, o = {}) {
  const kinds = o.kinds || ['ac', 'vent', 'antenna', 'skylight', 'vent', 'ac'], n = o.n === undefined ? 3 : o.n, items = [], W = R.x1 - R.x0, D = R.y1 - R.y0;
  if (W < .9 || D < .9) return;
  const gx = Math.max(1, Math.floor(W / 1.3)), gy = Math.max(1, Math.floor(D / 1.3)), cells = [];
  for (let i = 0; i < gx; i++) for (let j = 0; j < gy; j++) cells.push([i, j]);
  for (let k = 0; k < n && cells.length; k++) { const c = cells.splice(Math.floor(r() * cells.length), 1)[0]; items.push({ x: R.x0 + (c[0] + .1 + r() * .2) * W / gx, y: R.y0 + (c[1] + .1 + r() * .2) * D / gy, k: pick(r, kinds), v: r() }); }
  items.sort((a, b) => (a.x + a.y) - (b.x + b.y));
  for (const it of items) {
    const { x, y } = it, z = R.z;
    if (it.k === 'ac') acUnit(x, y, z); else if (it.k === 'vent') ventPipe(x + .2, y + .2, z, .3 + it.v * .4); else if (it.k === 'antenna') antenna(x + .2, y + .2, z, 1.1 + it.v * .6);
    else if (it.k === 'skylight') skylight(x, y, z); else if (it.k === 'tank') waterTank(x + .5, y + .5, z, { r: .45, h: .9 }); else if (it.k === 'planter') planter(x, y, z, .9, .4, r);
    else if (it.k === 'dish') { lw([x + .2, y + .2, z], [x + .2, y + .2, z + .4], '#4a4a56'); ball(x + .2, y + .2, z + .55, .22, '#d8dce0', { squash: .7 }); }
  }
}
/** helper for asset vb: size box grown by margins */
export const vbOf = (sizeFn, ex = {}) => p => { const s = sizeFn(p || {}); return [-(ex.nx === undefined ? .4 : ex.nx), -(ex.ny === undefined ? .4 : ex.ny), 0, s[0] + (ex.x === undefined ? .5 : ex.x), s[1] + (ex.y === undefined ? 1 : ex.y), s[2] + (ex.z === undefined ? 1.6 : ex.z)]; };
export const PALETTE = {
  brick: ['#b5654a', '#a8553f', '#c07850', '#8f5a4c', '#9c4a40', '#c4956a'],
  stucco: ['#e9dcc0', '#e8c9a0', '#c9d6b8', '#b8cdd6', '#e8b4a8', '#f0d890', '#d6a8a0', '#d9b08a'],
  roof: ['#b8573f', '#5c6478', '#7a5548', '#4f4a58', '#9a4a3a'],
  door: ['#2f5f6f', '#8a2f3a', '#3f6a4a', '#d09030', '#34406a', '#6a3a5a'],
  trim: '#f0e8d8',
};
