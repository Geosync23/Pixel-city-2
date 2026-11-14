// Built-in architecture for the unique player homes (ids `furn.home.build.*`): the pieces that make each shell its own place.
// Floor pieces (kind furniture; solid unless noted):
//   build.wall        partition / pony wall along x (flip = along y). p: len, h (1.2), c, c2, pat (plain brick planks tile stripes), trim, cap (top colour;
//                     default = dark "cut" wall), glass: true (glazed upper half), base (height of the solid part when glazed)
//   build.block       full-height mass with the room's wall finish (bathroom volume, chimney breast). p: w, d, h, c, c2, pat, trim, hatch (iron oven door on +y)
//   build.column      p.style 'iron' | 'classic' | 'wood', h
//   build.stairs      staircase, HIGH end at local x = 0 (put that end against a back wall). p: len (3), h (2.8), c (wood), runner (carpet colour)
//   build.railing     balustrade along x. p: len, style 'glass' | 'iron' | 'wood' | 'picket' | 'stone'
//   build.windowseat  cushioned bench under a bay window [seat]. p: len (2), c (cushion), wood
//   build.lemontree   potted lemon tree
//   build.gardenbed   raised vegetable bed. p: len
// Flat decals (solid: false): build.step (p.w, p.d, sunk: true = sunken lounge pit | raise: true = low platform; c, c2 floor colours, edge),
//   build.lightpool (sun through a skylight: p.w, p.d, nx, ny), build.paint (paint splatters: p.w, p.d, seed)
// Overhead (solid: false, place with z): build.beam (p.len, style 'steel' | 'wood'), build.arch (p.w, c: an arch between two columns, place at z ~1.9)
// Wall pieces (wall: true): build.window (p: w, h, view 'sea' | 'city' | 'garden' | 'hills' | 'brick' | 'sky', frame, nx, ny, arch, post, shelf, sill),
//   build.window.porthole (view), build.door.terrace (arched french doors, view), build.lifebuoy
import { box, qy, qx, qz, lw, glow, rng, dk, lt, PAT, cyl, ball, hash2 } from '../../engine/raster.js';
import { b, dot, blob, frameY, shadow, FAB } from './_lib.js';

const CUT = '#2a2733', GOLD = '#d9b65c';
const PATS = { plain: c => PAT.stucco(c), brick: c => PAT.brick(c), planks: c => PAT.planks(c, 5), tile: c => (u, v) => ((u % 8 === 0 || v % 8 === 0) ? dk(c, .2) : c), stripes: (c, c2) => PAT.vstripes(c, c2 || lt(c, .15), 6) };
const wp = (p, shade) => (PATS[p.pat || 'plain'] || PATS.plain)(dk(p.c || '#e9dcc0', shade), p.c2 ? dk(p.c2, shade) : undefined);

/* ---------- partitions, blocks, columns ---------- */
function partition(p) {
  const L = p.len || 2, h = p.h || 1.2, c = p.c || '#e9dcc0', tr = p.trim || '#7a5a44', y0 = .1, th = .3;
  if (p.glass) {
    const hb = p.base === undefined ? .5 : p.base;
    box(0, y0, 0, L, th, hb, c, { l: wp(p, .1), r: wp(p, .26), t: tr });
    qy(0, L, y0 + th / 2, hb, h, '#cfeaf2', 'glass'); for (let x = 0; x <= L + .01; x += 1) lw([Math.min(x, L - .02), y0 + th / 2, hb], [Math.min(x, L - .02), y0 + th / 2, h], tr);
    lw([0, y0 + th / 2, h], [L, y0 + th / 2, h], tr); for (let x = .3; x < L; x += 1) { lw([x, y0 + th / 2, h - .2], [x + .16, y0 + th / 2, h - .5], '#f4fbfd'); }
  } else box(0, y0, 0, L, th, h, c, { l: wp(p, .1), r: wp(p, .26), t: p.cap || CUT });
  qy(0, L, y0 + th, 0, .2, tr); qx(L, y0, y0 + th, 0, .2, dk(tr, .15));
}
function block(p) {
  const w = p.w || 1, d = p.d || 1, h = p.h || 2.8, c = p.c || '#e9dcc0', tr = p.trim || '#7a5a44';
  box(0, 0, 0, w, d, h, c, { l: wp(p, .1), r: wp(p, .26), t: CUT, ol: false });
  qy(0, w, d, 0, .22, tr); qx(w, 0, d, 0, .22, dk(tr, .15)); lw([w, d, 0], [w, d, h], dk(c, .38)); lw([0, d, h], [w, d, h], dk(tr, .3)); lw([w, 0, h], [w, d, h], dk(tr, .4));
  if (p.rail) { qy(0, w, d, p.rail, p.rail + .1, tr); qx(w, 0, d, p.rail, p.rail + .1, dk(tr, .15)); }
  if (p.hatch) { const x = w / 2 - .3; b(x, d, .5, .6, .06, .5, '#3a3440'); qy(x + .06, x + .54, d + .06, .56, .94, '#2a2733'); glow(() => qy(x + .12, x + .48, d + .06, .6, .74, '#ffb054')); qy(x + .12, x + .48, d + .06, .6, .66, '#e8853a'); lw([x + .06, d + .06, .78], [x + .54, d + .06, .78], '#5a5266'); dot(x + .48, d + .06, .86, GOLD);
    b(x - .1, d, .44, .8, .12, .06, '#5a5266'); for (let z = 1.3; z < h - .2; z += .5) lw([x + .1, d, z], [x + .5, d, z], dk(c, .22)); }
}
function column(p) {
  const h = p.h || 2.8, st = p.style || 'iron';
  shadow(.05, .5, .05, .5);
  if (st === 'classic') { const c = p.c || '#f4efe4'; b(.06, .06, 0, .38, .38, .14, c); cyl(.25, .25, .14, .13, h - .34, c, { ol: false }); for (const dx of [-1, 1]) lw([.25 + dx * .06, .43, .2], [.25 + dx * .06, .43, h - .26], dk(c, .16)); b(.08, .08, h - .2, .34, .34, .08, c); b(.04, .04, h - .12, .42, .42, .12, c, { t: CUT }); return; }
  if (st === 'wood') { const c = p.c || '#7a5238'; b(.14, .14, 0, .22, .22, h, c, { t: CUT }); b(.08, .08, 0, .34, .34, .1, dk(c, .15)); return; }
  const c = p.c || '#3f4a52'; b(.1, .1, 0, .3, .3, .12, c); cyl(.25, .25, .12, .075, h - .42, c, { ol: false }); b(.12, .12, .5, .26, .26, .05, lt(c, .12)); b(.1, .1, h - .3, .3, .3, .1, c); b(.04, .04, h - .2, .42, .42, .2, c, { t: CUT });
  for (const z of [.3, h - .5]) { dot(.25, .34, z, lt(c, .35)); }
}
function stairs(p) {
  const L = p.len || 3, H = p.h || 2.8, c = p.c || '#9c6a3e', n = Math.round(L / .25), s = L / n, run = p.runner;
  for (let j = 0; j < n; j++) { const hj = H * (1 - j / n);
    box(j * s, 0, 0, s, 1, hj, c, { l: (u, v) => (v % 9 === 0 ? dk(c, .3) : dk(c, .12)), r: dk(c, .3), t: lt(c, .14), ol: false });
    if (run) qz(j * s, (j + 1) * s, .22, .78, hj + .001, run, dk(run, .12)); lw([(j + 1) * s, 0, hj], [(j + 1) * s, 1, hj], dk(c, .4)); }
  lw([0, 1, 0], [L, 1, 0], dk(c, .5));
  const rail = '#f4f1ea'; for (let j = 1; j < n; j += 2) { const hj = H * (1 - j / n); lw([(j + .5) * s, .96, hj], [(j + .5) * s, .96, hj + .8], rail); }
  lw([s * 1.5, .96, H * (1 - 1 / n) + .8], [L - s / 2, .96, H / n + .8], dk(c, .25)); lw([s * 1.5, .96, H * (1 - 1 / n) + .86], [L - s / 2, .96, H / n + .86], c);
  b(L - .16, .88, 0, .14, .14, H / n + .95, c);
}
function railing(p) {
  const L = p.len || 2, st = p.style || 'iron', y = .3;
  if (st === 'glass') { const m = p.c || '#c2cad0'; qy(0, L, y, .08, .86, '#cfeaf2', 'glass'); for (let x = 0; x <= L + .01; x += 1) { const xx = Math.min(x, L - .04); b(xx, y - .02, 0, .05, .06, .92, m); } lw([0, y, .9], [L, y, .9], lt(m, .3)); lw([0, y, .08], [L, y, .08], dk(m, .2)); for (let x = .3; x < L; x += 1) lw([x, y, .7], [x + .14, y, .42], '#f4fbfd'); return; }
  if (st === 'stone') { const c = p.c || '#efe8da'; b(0, y - .1, 0, L, .3, .12, c); for (let x = .12; x < L - .05; x += .25) { cyl(x, y + .05, .12, .05, .5, c, { ol: false }); } b(0, y - .12, .62, L, .34, .12, c, { t: lt(c, .3) }); lw([0, y + .22, .62], [L, y + .22, .62], dk(c, .3)); return; }
  if (st === 'picket') { const c = p.c || '#f8f5ee'; lw([0, y, .3], [L, y, .3], dk(c, .25)); lw([0, y, .62], [L, y, .62], dk(c, .25)); for (let x = .06; x < L - .05; x += .19) { qy(x, x + .11, y + .02, 0, .78, c); dot(x + .05, y + .02, .84, c); lw([x + .11, y + .02, 0], [x + .11, y + .02, .78], dk(c, .22)); } return; }
  const c = p.c || (st === 'wood' ? '#7a5238' : '#3a3440');
  for (let x = 0; x <= L + .01; x += .5) { const xx = Math.min(x, L - .06); b(xx, y - .02, 0, .06, .06, .95, c); }
  for (let x = .125; x < L; x += .125) lw([x, y, .1], [x, y, .88], st === 'wood' ? '#f4f1ea' : c);
  b(0, y - .04, .88, L, .1, .07, c, { t: lt(c, .25) }); lw([0, y, .1], [L, y, .1], c);
}
function windowSeat(p) {
  const L = p.len || 2, wd = p.wood || '#7a5238', c = p.c || FAB.rust;
  box(0, 0, 0, L, 1, .4, wd, { l: (u, v) => ((u % 16 === 0 || v === 1 || v === 5) ? dk(wd, .35) : dk(wd, .1)) });
  for (let x = .5; x < L; x += 1) dot(x, 1, .22, GOLD);
  box(.04, .04, .4, L - .08, .92, .1, c, { t: lt(c, .12) }); lw([.04, .96, .45], [L - .04, .96, .45], dk(c, .3));
  box(.08, .1, .5, .3, .5, .3, FAB.cream, { t: lt(FAB.cream, .2) }); box(L - .42, .12, .5, .32, .5, .3, p.c2 || FAB.sage, { t: lt(p.c2 || FAB.sage, .2) });
}
function lemonTree(p) {
  const pot = p.pot || '#c9764a'; shadow(.04, .5, .04, .5);
  cyl(.25, .25, 0, .17, .34, pot, { t: '#4a3626' }); cyl(.25, .25, .3, .2, .06, lt(pot, .1), { t: '#4a3626' });
  lw([.25, .25, .34], [.26, .25, 1.05], '#6b4630'); lw([.25 + 1 / 16, .25, .34], [.26 + 1 / 16, .25, 1.05], '#4a3020');
  ball(.25, .25, 1.3, .36, '#3f8a4c'); ball(.12, .3, 1.5, .24, '#4f9a55', { ol: false }); ball(.36, .22, 1.56, .22, '#58a85c', { ol: false });
  const r = rng(p.seed || 4); for (let i = 0; i < 7; i++) { const x = .25 + (r() - .5) * .5, z = 1.1 + r() * .55; dot(x, .45, z, '#f2d54a'); dot(x, .45, z, '#f8e77a', 0, -1); dot(x, .45, z, '#d9b63a', 1, 0); }
}
function gardenBed(p) {
  const L = p.len || 2, wd = '#8a6a4a';
  box(0, 0, 0, L, 1, .3, wd, { l: (u, v) => (v % 5 === 0 ? dk(wd, .35) : dk(wd, .12)), t: '#5a4030' }); qz(.08, L - .08, .08, .92, .31, '#5a4030', '#4a3426');
  const r = rng(p.seed || 2); for (let x = .25; x < L - .1; x += .34) for (const y of [.3, .7]) { const k = r(); if (k < .35) { blob(x, y, .44, 2.2, 1.6, '#4f9a45'); dot(x, y, .5, '#d9483b'); dot(x, y, .44, '#e8683b', 1, 0); } else if (k < .7) { blob(x, y, .42, 2, 1.5, '#6fb85c'); blob(x, y, .5, 1.2, 1, '#8fd06a'); } else { lw([x, y, .31], [x, y, .62], '#4f9a45'); dot(x, y, .64, '#f2d54a'); dot(x, y, .56, '#6fb85c', 1, 0); } }
}

/* ---------- flat decals ---------- */
function step(p) {
  const w = p.w || 3, d = p.d || 3, c = p.c || '#b8a0c8', c2 = p.c2 || dk(c, .08), e = p.edge || '#7a5238';
  const pat = (x, y) => (((Math.floor(x * 2) + Math.floor(y * 2)) & 1) ? c : c2);
  if (p.raise) { const h = .14; box(0, 0, 0, w, d, h, e, { t: p.boards ? PAT.fboards(c, .5) : pat, l: dk(e, .12), r: dk(e, .3) }); lw([0, d, h], [w, d, h], lt(e, .25)); lw([w, 0, h], [w, d, h], lt(e, .18)); return; }
  const s = .18;                                   // sunken: the pit floor sits s lower; the back risers face the camera
  qy(0, w, 0, -s, 0, dk(e, .2)); qx(0, 0, d, -s, 0, dk(e, .38)); qz(0, w - s, 0, d - s, -s, pat);
  lw([0, 0, 0], [w, 0, 0], lt(e, .2)); lw([0, 0, 0], [0, d, 0], lt(e, .12)); lw([0, 0, -s], [w - s, 0, -s], dk(e, .5)); lw([0, 0, -s], [0, d - s, -s], dk(e, .5));
  lw([w, 0, 0], [w, d, 0], dk(e, .1)); lw([0, d, 0], [w, d, 0], dk(e, .1));
}
function lightPool(p) {
  const w = p.w || 3, d = p.d || 2, nx = p.nx || 3, ny = p.ny || 2, g = .08, c = p.c || '#fff3b02e';
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) qz(i * w / nx + g, (i + 1) * w / nx - g, j * d / ny + g, (j + 1) * d / ny - g, .01, c);
}
function paint(p) {
  const w = p.w || 3, d = p.d || 3, r = rng(p.seed || 7), C = ['#d9483b', '#f2c14e', '#3b6fd0', '#3f9a8a', '#f08ab0', '#f4f1ea', '#7a55c8', '#e8853a'];
  for (let i = 0; i < Math.round(w * d * 2.2); i++) { const x = .2 + r() * (w - .4), y = .2 + r() * (d - .4), c = C[Math.floor(r() * C.length)], k = r();
    if (k < .3) { blob(x, y, .01, 2 + r() * 2.5, 1 + r() * 1.2, c); dot(x + .12, y + .1, .01, c); dot(x - .1, y + .14, .01, c, 1, 0); }
    else if (k < .55) { for (let t = 0; t < 4; t++) dot(x + t * .05, y + t * .03, .01, c); }
    else { dot(x, y, .01, c); dot(x, y, .01, c, 1, 0); if (k > .8) dot(x + .08, y - .06, .01, c); } }
}

/* ---------- overhead ---------- */
function beam(p) {
  const L = p.len || 4;
  if (p.style === 'wood') { const c = p.c || '#6a4630'; box(0, .12, 0, L, .26, .3, c, { l: (u, v) => ((v === 2 || v === 3) && hash2(u >> 3, v, 3) > .4 ? dk(c, .3) : dk(c, .12)), ol: false }); lw([0, .38, 0], [L, .38, 0], dk(c, .5)); return; }
  const c = p.c || '#4a545c'; b(0, .1, 0, L, .3, .06, c); b(0, .2, .06, L, .1, .2, dk(c, .1)); b(0, .1, .26, L, .3, .06, c, { t: lt(c, .12) });
  for (let x = .25; x < L; x += .5) { dot(x, .4, .03, lt(c, .4)); dot(x, .4, .29, lt(c, .4)); } lw([0, .4, 0], [L, .4, 0], dk(c, .5));
}
function arch(p) {
  const W = p.w || 3, c = p.c || '#f4efe4', H = p.h || 1.1, top = .16, hz = H - top, n = Math.max(5, Math.round(hz * 8)), y0 = .12, th = .26;
  for (let k = 0; k < n; k++) { const z0 = (k / n) * hz, zc = ((k + .5) / n) * hz, half = (W / 2) * Math.sqrt(Math.max(0, 1 - (zc / hz) * (zc / hz))), sw = W / 2 - half;
    if (sw > .03) { b(0, y0, z0, sw, th, hz / n + .01, c, { l: dk(c, .08), r: dk(c, .2) }); b(W - sw, y0, z0, sw, th, hz / n + .01, c, { l: dk(c, .08) }); } }
  box(0, y0, hz, W, th, top, c, { t: CUT, l: dk(c, .08), ol: false }); lw([0, y0 + th, H], [W, y0 + th, H], dk(c, .3)); lw([0, y0 + th, hz], [W, y0 + th, hz], dk(c, .16));
  b(W / 2 - .1, y0 + th, hz - .12, .2, .04, .26, dk(c, .1));
}

/* ---------- views through the windows (wall patterns: fn(u, v, w, h) in px, v up) ---------- */
const SKY = '#9fd3ee', SKY2 = '#b9e0f2';
const cloud = (u, v, W, H, s, lo = .58) => { for (let i = 0; i < 3; i++) { const cx = (hash2(i, 1, s) * .8 + .1) * W, cy = (lo + hash2(i, 2, s) * (.92 - lo)) * H, rx = 3.5 + hash2(i, 3, s) * 4.5, ry = 1.5 + hash2(i, 4, s) * 1.3, a = (u - cx) / rx, c = (v - cy) / ry; if (a * a + c * c < 1) return v < cy - ry * .2 ? '#e3f4fa' : '#f6fcfe'; } return null; };
const sky = (u, v, W, H, s, lo) => cloud(u, v, W, H, s, lo) || (v > H * .62 ? SKY : SKY2);
const VIEWS = {
  sky: s => (u, v, W, H) => sky(u, v, W, H, s, .25),
  sea: s => (u, v, W, H) => { const hz = Math.round(H * .38), bx = Math.round(W * (.25 + hash2(1, 1, s) * .5));
    if (v < hz) return ((u * 3 + v * 5) % 11 === 0) ? '#a6d4e4' : v >= hz - 2 ? '#6aaed0' : v > hz * .45 ? '#4f94be' : '#3f84b0';
    if (v < hz + 2 && Math.abs(u - bx) <= 2) return '#7a4e2d'; if (v >= hz + 2 && v < hz + 8 && u >= bx && u - bx <= (hz + 8 - v) * .55) return '#f8f5ee'; if (v >= hz + 2 && v < hz + 6 && u < bx && bx - u <= (hz + 6 - v) * .5) return '#e8d9b8';
    return sky(u, v, W, H, s); },
  city: s => (u, v, W, H) => { const i = Math.floor(u / 6), bh = Math.round((.22 + hash2(i, 0, s) * .42) * H), i2 = Math.floor((u + 4) / 9), bh2 = Math.round((.4 + hash2(i2, 5, s) * .45) * H);
    if (v < bh) { const c = ['#55648c', '#64749c', '#4c5a82'][Math.floor(hash2(i, 9, s) * 3)]; return u % 6 === 0 ? dk(c, .2) : (u % 2 === 1 && v % 3 === 1 && hash2(u, v, s) > .5) ? '#c9dcf0' : c; }
    if (v < bh2) return (u + 4) % 9 === 0 ? '#8496bc' : (v % 4 === 2 && (u + 4) % 3 === 1) ? '#a9bcd8' : '#94a8cc';
    return sky(u, v, W, H, s, .7); },
  garden: s => (u, v, W, H) => { if (v < H * .14) return ((u * 7 + v * 3) % 11 === 0) ? '#a2d888' : '#7cc068'; const t = (u + 3) % 12, n = hash2(Math.floor(u / 3), Math.floor(v / 2), s);
    if (v > H * (.5 + n * .22)) return n > .62 ? '#7cc75e' : n > .3 ? '#5aa84f' : '#4f9a45';
    if (t <= 1) return ((v % 5 === 0 && t === 0) || (v % 7 === 3 && t === 1)) ? '#4a4a58' : t ? '#e3e0d6' : '#f6f3ea';
    return n > .9 ? '#8fd06a' : v > H * .3 ? SKY2 : '#b8dca0'; },
  hills: s => (u, v, W, H) => { const sea = H * .34, hill = sea + H * (.1 + .12 * Math.sin(u / W * 3.3 + s) + .05 * Math.sin(u / W * 9 + s * 2));
    if (v < H * .1) return u % 5 < 3 ? '#f0e9da' : '#d9d0bc'; if (v < H * .13) return '#f8f3e6';
    const cy = Math.floor(u / 7), cx = cy * 7 + 3, ch = H * (.3 + hash2(cy, 3, s) * .25); if (hash2(cy, 1, s) > .62 && Math.abs(u - cx) <= (v > ch * .7 ? 0 : 1) && v < ch) return '#2f6f48';
    if (v < sea) return ((u * 3 + v * 7) % 13 === 0) ? '#bfe3ee' : v > sea - 2 ? '#7ab8d8' : '#5a9cc8';
    if (v < hill) return (hash2(u >> 1, Math.floor(v) >> 1, s) > .8) ? '#f0d9b0' : v > hill - 2 ? '#a8cc98' : '#8fbc8a';
    const dx = u - W * .78, dy = v - H * .8; if (dx * dx + dy * dy < 9) return '#fff3b0'; return sky(u, v, W, H, s, .66); },
  brick: s => (u, v, W, H) => { if (v > H * .72) return sky(u, v, W, H, s, .8); if (v > H * .72 - 2) return '#7a4e3a'; const wu = u - Math.round(W * .55), wv = v - Math.round(H * .25);
    if (wu >= 0 && wu < 7 && wv >= 0 && wv < 9) return (wu === 0 || wu === 6 || wv === 0 || wv === 8 || wu === 3) ? '#f1eee6' : '#f2c66a'; return PAT.brick('#a8624a')(u, v); },
};
const VIEWN = { city: s => (u, v, W, H) => { const i = Math.floor(u / 6), bh = Math.round((.22 + hash2(i, 0, s) * .42) * H); if (v < bh && u % 6 !== 0 && u % 2 === 1 && v % 3 === 1 && hash2(u, v, s) > .5 && hash2(v, u, s + 3) > .35) return '#ffd98a'; return null; } };
function pane(x0, x1, y, z0, z1, view, s) { qy(x0, x1, y, z0, z1, (VIEWS[view] || VIEWS.sky)(s)); if (VIEWN[view]) glow(() => qy(x0, x1, y, z0, z1, VIEWN[view](s))); }
function archFill(g0, g1, y, z1, r, fr) { const n = Math.max(4, Math.round(r * 16 / 2)); for (let k = 0; k < n; k++) { const t = (k + .5) / n, ins = r * (1 - Math.sqrt(1 - t * t)), za = z1 - r + (k / n) * r, zb = z1 - r + ((k + 1) / n) * r; qy(g0, g0 + ins, y, za, zb, fr); qy(g1 - ins, g1, y, za, zb, fr); } }
function winView(p) {
  const w = p.w || 1.5, h = p.h || 1.2, fr = p.frame || '#f4f1ea', nx = p.nx || 2, ny = p.ny || 1, s = p.seed || 1, f = p.fw || .07, view = p.view || 'sky';
  if (p.sill !== false) box(-.05, 0, -.06, w + .1, p.deep ? .3 : .16, .06, p.sillc || fr);
  box(0, 0, 0, w, .08, h, fr); const g0 = f, g1 = w - f, z0 = f, z1 = h - f, Y = .08;
  pane(g0, g1, Y, z0, z1, view, s);
  if (p.arch) archFill(g0, g1, Y + .001, z1, Math.min((g1 - g0) / 2, p.archR || .5), fr);
  for (let i = 1; i < nx; i++) { const x = g0 + (g1 - g0) * i / nx; if (p.post) qy(x - .04, x + .04, Y + .001, z0, z1, fr); else lw([x, Y, z0], [x, Y, z1], fr); }
  for (let j = 1; j < ny; j++) { const z = z0 + (z1 - z0) * j / ny; lw([g0, Y, z], [g1, Y, z], fr); }
  frameY(g0, g1, Y, z0, z1, dk(fr, .3));
  for (let i = 0; i < nx; i += 2) { const x = g0 + (g1 - g0) * (i + .2) / nx; lw([x, Y, z1 - .12], [x + .14, Y, z1 - .4], '#f4fbfd'); }
  if (p.shelf) { const wd = p.shelfc || '#f1eee6'; box(-.05, .08, -.02, w + .1, .3, .05, wd); const r = rng(s + 5), P = ['#c9764a', '#f1eee6', '#4f74b8', '#dba63c']; for (let x = .16; x < w - .1; x += .32) { const pc = P[Math.floor(r() * 4)], k = r(); b(x - .06, .18, .03, .13, .12, .12, pc); if (k < .4) { blob(x, .24, .28, 2.4, 2, '#3f9a55'); blob(x, .24, .34, 1.4, 1.2, '#58b868'); } else if (k < .7) { lw([x, .24, .15], [x, .24, .4], '#3f9a55'); dot(x, .24, .42, '#f08ab0'); dot(x, .24, .42, '#f08ab0', 1, 0); dot(x, .24, .34, '#58b868', -1, 0); } else { for (const dx of [-.04, 0, .04]) lw([x + dx, .24, .15], [x + dx * 2, .24, .36], '#2f7a48'); } } }
  if (p.curtain) { const c = p.curtain, cw = w * .2, fold = (u) => (u % 4 === 0 ? dk(c, .3) : u % 4 === 2 ? lt(c, .12) : dk(c, .08)); qy(-.1, cw, .12, -.1, h + .08, fold); qy(w - cw, w + .1, .12, -.1, h + .08, fold); lw([-.16, .12, h + .1], [w + .16, .12, h + .1], '#5a3a2a'); }
}
function porthole(p) {
  const r = .36, cx = .5, cz = .5, s = p.seed || 2, m = p.metal || GOLD, fn = (VIEWS[p.view || 'sea'])(s), st = 1 / 16;
  for (let x = cx - r - .09; x < cx + r + .09; x += st) { const t = (x + st / 2 - cx) / (r + .09), hh = (r + .09) * Math.sqrt(Math.max(0, 1 - t * t)); qy(x, x + st, .04, cz - hh, cz + hh, Math.abs(t) > .8 ? dk(m, .2) : m); }
  for (let x = cx - r; x < cx + r; x += st) { const t = (x + st / 2 - cx) / r, hh = r * Math.sqrt(Math.max(0, 1 - t * t)); qy(x, x + st, .06, cz - hh, cz + hh, (u, v, W, H) => fn(Math.round((x - cx + r) * 16), Math.round((cz - hh) * 16 - (cz - r) * 16) + v, r * 32, r * 32)); }
  for (const [dx, dz] of [[0, r + .05], [0, -r - .05], [r + .05, 0], [-r - .05, 0]]) dot(cx + dx, .07, cz + dz, dk(m, .45)); lw([cx - .2, .07, cz + .16], [cx - .08, .07, cz + .26], '#f4fbfd');
}
function terraceDoor(p) {
  const w = p.w || 2, h = p.h || 2.3, fr = p.frame || '#f4f1ea', s = p.seed || 3, f = .1, Y = .08, g0 = f, g1 = w - f, z1 = h - f;
  box(0, 0, 0, w, .08, h, fr); pane(g0, g1, Y, .04, z1, p.view || 'hills', s); archFill(g0, g1, Y + .001, z1, (g1 - g0) / 2, fr);
  qy(g0, g1, Y + .001, 0, .34, fr); frameY(g0 + .08, w / 2 - .1, Y + .002, .06, .28, dk(fr, .18)); frameY(w / 2 + .1, g1 - .08, Y + .002, .06, .28, dk(fr, .18));
  qy(w / 2 - .05, w / 2 + .05, Y + .001, 0, z1 - .2, fr); lw([w / 2, Y + .002, 0], [w / 2, Y + .002, z1 - .3], dk(fr, .3));
  for (const z of [.95, 1.5]) lw([g0, Y, z], [g1, Y, z], fr); lw([g0, Y, h - (g1 - g0) / 2 - f], [g1, Y, h - (g1 - g0) / 2 - f], fr);
  dot(w / 2 - .1, Y + .01, 1, GOLD); dot(w / 2 + .1, Y + .01, 1, GOLD); frameY(g0, g1, Y, 0, z1, dk(fr, .25)); qz(g0, g1, .08, .16, .005, dk(fr, .2));
}
function lifebuoy() {
  const r = .36, r2 = .17, cx = .4, cz = .4, st = 1 / 16;
  for (let x = cx - r; x < cx + r; x += st) for (let z = cz - r; z < cz + r; z += st) { const dx = x + st / 2 - cx, dz = z + st / 2 - cz, d = Math.hypot(dx, dz); if (d > r || d < r2) continue;
    const a = Math.abs(((Math.atan2(dz, dx) / Math.PI * 2) % 1 + 1) % 1 - .5), red = a > .3; qy(x, x + st, .05, z, z + st, d > r - .05 ? (red ? '#a8362c' : '#d9d2bd') : red ? '#d9483b' : '#f8f5ee'); }
  dot(cx, .06, cz + r + .05, '#5a5266'); lw([cx - r + .02, .06, cz - r + .08], [cx - r - .06, .06, cz - r - .3], '#c9b48a');
}

const A = (id, tags, o) => Object.assign({ id: 'furn.home.build.' + id, kind: 'furniture', tags: ['home', 'build', ...tags] }, o);
const WA = (id, tags, o) => A(id, ['wall', ...tags], Object.assign({ wall: true, solid: false }, o));
export default [
  A('wall', ['partition'], { size: p => [p.len || 2, .5, p.h || 1.2], variants: [{ len: 2 }, { len: 3, pat: 'brick', c: '#a8563c' }, { len: 2, pat: 'planks', c: '#cfdde2', cap: '#4f6f86' }, { len: 3, glass: true, h: 2.2, c: '#3d4560', trim: '#c9a24a' }, { len: 2, h: 2.8 }], draw: partition }),
  A('block', ['partition'], { size: p => [p.w || 1, p.d || 1, p.h || 2.8], variants: [{ w: 3, d: 2, c: '#e8b84a' }, { w: 1, d: 1, hatch: true }, { w: 3, d: 1.5, pat: 'stripes', c: '#dfe8c8', c2: '#cfdcb0', rail: 1 }, { w: 2, d: 1, pat: 'brick', c: '#a8563c' }], draw: block }),
  A('column', ['column'], { size: p => [.5, .5, p.h || 2.8], variants: [{ style: 'iron' }, { style: 'classic' }, { style: 'wood' }, { style: 'iron', h: 3.4 }], draw: column }),
  A('stairs', ['stairs'], { size: p => [p.len || 3, 1, p.h || 2.8], vb: p => [0, 0, 0, p.len || 3, 1.1, (p.h || 2.8) + 1], variants: [{}, { runner: '#b8433a' }, { len: 4, h: 3.4, c: '#5e3f30', runner: '#c9a24a' }], draw: stairs }),
  A('railing', ['railing'], { size: p => [p.len || 2, .5, .95], variants: [{ style: 'iron' }, { style: 'glass', len: 3 }, { style: 'wood' }, { style: 'picket', len: 3 }, { style: 'stone', len: 3 }], draw: railing }),
  A('windowseat', ['seat', 'sofa', 'living'], { size: p => [p.len || 2, 1, .5], vb: p => [0, 0, 0, p.len || 2, 1, .9], use: p => ({ x: (p.len || 2) / 2, y: 1.35 }), seatsFor: p => { p = p || {}; const L = p.len || 2, o = []; for (let x = .5; x < L; x += 1) o.push({ x, y: .55, z: .5, dir: 1 }); return o; },
    variants: [{}, { len: 3, c: FAB.teal }, { len: 2, c: FAB.mustard, wood: '#f1eee6' }], draw: windowSeat }),
  A('lemontree', ['plant'], { size: [.5, .5, 1.8], vb: [-.3, -.3, 0, .8, .8, 2], variants: [{}, { pot: '#f1eee6', seed: 9 }], draw: lemonTree }),
  A('gardenbed', ['garden'], { size: p => [p.len || 2, 1, .35], vb: p => [0, 0, 0, p.len || 2, 1, .8], use: p => ({ x: (p.len || 2) / 2, y: 1.35 }), variants: [{}, { len: 3, seed: 5 }], draw: gardenBed }),
  A('step', ['floor'], { solid: false, size: p => [p.w || 3, p.d || 3, .02], vb: p => [0, 0, -.25, p.w || 3, p.d || 3, .2], variants: [{ sunk: true }, { raise: true, c: '#7a5238', boards: true, edge: '#5e3f30' }, { sunk: true, w: 5, d: 4, c: '#5a6a8a', edge: '#c9a24a' }], draw: step }),
  A('lightpool', ['floor'], { solid: false, size: p => [p.w || 3, p.d || 2, .02], variants: [{}, { w: 4, d: 3, nx: 4, ny: 3 }], draw: lightPool }),
  A('paint', ['floor'], { solid: false, size: p => [p.w || 3, p.d || 3, .02], variants: [{}, { w: 4, d: 4, seed: 3 }], draw: paint }),
  A('beam', ['ceiling'], { solid: false, size: p => [p.len || 4, .5, .09], vb: p => [0, 0, 0, p.len || 4, .5, .34], variants: [{ style: 'steel' }, { style: 'wood' }, { style: 'steel', len: 8 }], draw: beam }),
  A('arch', ['ceiling'], { solid: false, size: p => [p.w || 3, .5, .09], vb: p => [0, 0, 0, p.w || 3, .5, (p.h || 1.1) + .05], variants: [{}, { w: 4, c: '#e9dcc0' }], draw: arch }),
  WA('window', ['window'], { size: p => [p.w || 1.5, .1, p.h || 1.2], vb: p => [-.3, -.1, -.4, (p.w || 1.5) + .3, .5, (p.h || 1.2) + .3], mount: .9,
    variants: [{ view: 'sea', w: 1, h: 2, ny: 3 }, { view: 'city', w: 3, h: 2.8, nx: 3, frame: '#3a3440', sill: false }, { view: 'garden', shelf: true }, { view: 'hills', arch: true, h: 1.8 }, { view: 'brick', nx: 3, post: true, w: 2, frame: '#7a5238', deep: true }, { view: 'sea', w: 2.5, h: 2.4, nx: 4, ny: 4, arch: true, archR: 1.1, frame: '#3a3440' }, { view: 'sky', w: 3, h: .7, nx: 4 }], draw: winView }),
  WA('window.porthole', ['window'], { size: [1, .1, 1], mount: 1.1, variants: [{}, { view: 'sky', metal: '#c2cad0' }], draw: porthole }),
  WA('door.terrace', ['window', 'door'], { size: p => [p.w || 2, .1, p.h || 2.3], mount: 0, variants: [{}, { view: 'sea', w: 1.5 }, { view: 'city', frame: '#3a3440' }], draw: terraceDoor }),
  WA('lifebuoy', ['decor'], { size: [.8, .1, .8], mount: 1.3, variants: [{}], draw: () => lifebuoy() }),
];
