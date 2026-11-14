// Maple Bay Botanical Conservatory — plants. ids furn.cons.* (+ five house plants furn.home.plant.cons_* sold as seedlings in the gift shop).
//   palm {kind: 'coconut'|'date'|'areca', h, seed, lean}   banana {seed, h}   treefern {seed, h}   cycad {seed}   bamboo {seed}   maple {seed}
//   bed {w, d, kind: 'tropical'|'fern'|'orchid'|'butterfly'|'desert'|'hedge', seed}   raised stone-curbed bed, densely planted (place tall plants inside with z = .35)
//   cactus {kind: 'saguaro'|'barrel'|'prickly'|'organ'|'agave'|'yucca'|'aloe', seed}   rock {w, d, h, c, moss, seed}   mesa {seed}
//   orchidlog (tag cons_orchid: the sketching subject)   basket {kind: 'fern'|'orchid'|'fuchsia', seed} (overhead, hang with z)
//   flowerbed {w, d, season 0-3, v}   showpiece {season}   urn {kind, season}   reeds {seed}
// Indoor plants are evergreen: nothing here reads ENV.season; the flower show takes p.season.
import * as R from '../../engine/raster.js';
import { IRON, IRON_D, STONE, STONE_D, SOIL, MOSS, GREENS, S2, dot, blob, oblob, trunk, frond, rosette, flower, bedBase } from './_cons_lib.js';
const { box, qy, qx, qz, fq, lw, lit, glow, cyl, ball, cone, dk, lt, mix, PW, px, C, rng, at, line, ellipse } = R;

const TRUNK = '#8a6a4a', SAND = '#e2d0a0', TERRA = '#c9764a';
const TULIP = ['#e8483b', '#f2c230', '#f08ab0', '#8a5cd0', '#f4f0e8', '#f07a3a'], MUM = ['#c9792a', '#e8b63a', '#8a2f3a', '#f0e2c0', '#d9562b', '#b05a8a'];

/* ---------- trees ---------- */
function palm(p) {
  const r = rng(p.seed || 3), k = p.kind || 'coconut', H = p.h || 3.6, lean = p.lean === undefined ? (r() - .5) * .7 : p.lean, c = .3;
  if (k === 'areca') { // clumping palm: several thin stems
    const st = []; for (let i = 0; i < 5; i++) st.push([c + (r() - .5) * .34, c + (r() - .5) * .34, H * (.55 + r() * .45), (r() - .5) * .5]);
    st.sort((a, b) => (a[0] + a[1]) - (b[0] + b[1]));
    for (const s of st) { trunk([s[0], s[1], 0], [s[0] + s[3] * .5, s[1], s[2]], 2, '#7fae5a', 4); rosette(s[0] + s[3] * .5, s[1], s[2], { n: 6, len: 1.05, rise: .5, droop: .75, lf: 3, r, cols: ['#2f7a48', '#4aa858', '#62bc68'] }); }
    return;
  }
  const tx = c + lean, w = k === 'date' ? 5 : 3;
  // gently curved trunk in 4 segments
  let a = [c, c, 0]; for (let i = 1; i <= 4; i++) { const t = i / 4, b = [c + lean * t * t, c, H * t]; trunk(a, b, w + (i === 1 ? 1 : 0), k === 'date' ? '#7a5a40' : TRUNK, k === 'date' ? 2 : 3); a = b; }
  if (k === 'date') { blob(tx, c, H - .05, 5, 3.5, '#6a4a34'); for (let i = 0; i < 3; i++) { const an = 1 + i * 2.1; for (let j = 0; j < 4; j++) dot(tx + Math.cos(an) * .22, c + Math.sin(an) * .22, H - .2 - j * .07, j % 2 ? '#e8962c' : '#c8721c', j % 2, 0); } }
  rosette(tx, c, H, { n: k === 'date' ? 13 : 10, len: k === 'date' ? 1.75 : 1.6, rise: .55, droop: 1.0, lf: k === 'date' ? 4 : 4, r, cols: k === 'date' ? ['#2c6e4a', '#3f8f58', '#57a868'] : ['#2f7a48', '#44a058', '#64bc6a'] });
  if (k === 'coconut') { for (const [dx, dy, dz] of [[-.1, .1, -.12], [.1, .08, -.1], [0, .14, -.22]]) oblob(tx + dx, c + dy, H + dz, 1.6, 1.6, '#7a5a34'); }
  // top tuft
  frond(tx, c, H, -2.3, .7, .7, .1, '#64bc6a', '#2f7a48', 2); frond(tx, c, H, .9, .6, .75, .1, '#64bc6a', '#2f7a48', 2);
}
function paddle(x, y, z, a, len, rise, droop, c) { // banana leaf: fat arc of ellipses
  const N = Math.round(len * 9); let pr = null;
  for (let i = 0; i <= N; i++) { const t = i / N, X = x + Math.cos(a) * len * t, Y = y + Math.sin(a) * len * t, Z = z + rise * Math.sin(t * Math.PI * .65) - droop * t * t, wv = 1 + 3.6 * Math.sin(Math.min(1, t * 1.25) * Math.PI); blob(X, Y, Z, wv, Math.max(1, wv * .7), i % 4 === 3 ? dk(c, .16) : c); }
  for (let i = 0; i <= N; i++) { const t = i / N, s = S2(x + Math.cos(a) * len * t, y + Math.sin(a) * len * t, z + rise * Math.sin(t * Math.PI * .65) - droop * t * t); if (pr) line(pr, s, lt(c, .35)); pr = s; }
}
function banana(p) {
  const r = rng(p.seed || 5), H = p.h || 1.5, c = .3;
  trunk([c, c, 0], [c + .04, c, H], 4, '#8fae5a', 5);
  const L = []; for (let i = 0; i < 7; i++) L.push(i / 7 * Math.PI * 2 + r() * .6);
  L.sort((a, b) => (Math.cos(a) + Math.sin(a)) - (Math.cos(b) + Math.sin(b)));
  L.forEach((a, i) => paddle(c + .04, c, H, a, 1.0 + r() * .45, .75 + r() * .3, .5 + r() * .5, Math.cos(a) + Math.sin(a) < -.3 ? '#3a8a4c' : ['#4fa858', '#62bc62', '#58b05c'][i % 3]));
  if ((p.seed || 0) % 2 === 0) { for (let j = 0; j < 4; j++) for (let i = -1; i <= 1; i++) dot(c + .3, c + .3, H - .25 - j * .09, j < 3 ? (i ? '#e8c83a' : '#f4dc5a') : '#7a3a6a', i, 0); }
}
function treefern(p) {
  const r = rng(p.seed || 7), H = p.h || 2, c = .3; trunk([c, c, 0], [c + .05, c, H], 4, '#5a4030', 2);
  for (let i = 0; i < 9; i++) dot(c, c + .05, r() * H, '#7a5a40', Math.round(r() * 4 - 2), 0);
  rosette(c + .05, c, H, { n: 11, len: 1.35, rise: .5, droop: .95, lf: 4, r, cols: ['#2a6e44', '#3c9450', '#55b060'] });
  dot(c + .05, c, H + .12, '#a8c060'); dot(c + .05, c, H + .12, '#a8c060', 1, -1);
}
function cycad(p) { const r = rng(p.seed || 2), c = .4; cyl(c, c, 0, .16, .3, '#6a4a34', { t: '#7a5a40' }); rosette(c, c, .3, { n: 12, len: .85, rise: .35, droop: .45, lf: 2, r, cols: ['#245e40', '#2f7a48', '#4a9a58'] }); blob(c, c, .42, 2, 2.4, '#c8a050'); }
function bamboo(p) {
  const r = rng(p.seed || 4), S = []; for (let i = 0; i < 9; i++) S.push([.15 + r() * .7, .15 + r() * .5, 2.2 + r() * 1.3, (r() - .5) * .35]);
  S.sort((a, b) => (a[0] + a[1]) - (b[0] + b[1]));
  for (const s of S) { const a = S2(s[0], s[1], 0), b = S2(s[0] + s[3], s[1], s[2]), n = a[1] - b[1]; for (let k = 0; k <= n; k++) { const X = Math.round(a[0] + (b[0] - a[0]) * k / n); px(X, a[1] - k, C(k % 7 === 0 ? '#5a8a3a' : '#9ac85a')); px(X + 1, a[1] - k, C(k % 7 === 0 ? '#4a7a30' : '#7fb04a')); }
    for (let j = 0; j < 6; j++) { const z = s[2] * (.45 + r() * .55), dx = (r() - .5) * .5; for (let q = 0; q < 4; q++) dot(s[0] + s[3] * z / s[2] + dx * q / 4, s[1], z - q * .03, q % 2 ? '#4fa858' : '#7fcf7a', dx > 0 ? q : -q, q >> 1); } }
}
function maple(p) { // Japanese maple (koi garden): always crimson
  const r = rng(p.seed || 6), c = .4; trunk([c, c, 0], [c + .1, c, 1.1], 3, '#5a4034', 0); lw([c + .1, c, 1.1], [c - .35, c, 1.6], '#5a4034'); lw([c + .1, c, 1.1], [c + .55, c, 1.55], '#5a4034');
  const B = []; for (let i = 0; i < 12; i++) B.push([c + .1 + (r() - .5) * 1.2, c + (r() - .5) * .8, 1.4 + r() * .7, .3 + r() * .2]); B.sort((a, b) => (a[0] + a[1]) - (b[0] + b[1]));
  B.forEach((b, i) => ball(b[0], b[1], b[2], b[3], ['#c8402f', '#d9562b', '#b8342e', '#e0703a'][i % 4], { squash: .7, ol: i < 5 }));
}

/* ---------- small plants used inside beds (all take a local origin via at()) ---------- */
const PL = {
  ear(r) { const n = 4 + Math.floor(r() * 2), L = []; for (let i = 0; i < n; i++) { const a = r() * 6.3; L.push([Math.cos(a) * (.12 + r() * .25), Math.sin(a) * (.12 + r() * .25), .35 + r() * .55, 3.5 + r() * 2.5]); } L.sort((a, b) => (a[0] + a[1]) - (b[0] + b[1]));
    for (const l of L) lw([0, 0, 0], [l[0], l[1], l[2]], '#3a7a48'); L.forEach((l, i) => { const c = GREENS[i % 3]; oblob(l[0], l[1], l[2], l[3], l[3] * .72, c); blob(l[0], l[1], l[2] + .03, l[3] * .45, l[3] * .3, lt(c, .2)); dot(l[0], l[1], l[2], dk(c, .4)); }); },
  bop(r) { for (let i = 0; i < 6; i++) { const a = i * 1.05 + r(), dx = Math.cos(a) * .22, dy = Math.sin(a) * .22, h = .7 + r() * .5, c = i % 2 ? '#2f7a48' : '#3f9a55'; lw([0, 0, 0], [dx, dy, h], c); lw([.03, 0, 0], [dx + .05, dy, h], dk(c, .2)); blob(dx, dy, h, 1.8, 2.6, c); }
    for (const s of [[.1, 1.25], [-.12, 1.05]]) { lw([0, 0, .3], [s[0], 0, s[1]], '#5a8a4a'); dot(s[0], 0, s[1], '#f08a2a'); dot(s[0], 0, s[1], '#f4b03a', 1, -1); dot(s[0], 0, s[1], '#f08a2a', 2, -1); dot(s[0], 0, s[1], '#3b6fd0', 1, 0); } },
  ginger(r) { for (let i = 0; i < 4; i++) { const dx = (r() - .5) * .4, dy = (r() - .5) * .3, h = .6 + r() * .5; lw([dx, dy, 0], [dx, dy, h], '#3f8a50'); for (let k = 0; k < 4; k++) dot(dx, dy, h * (.3 + k * .15), '#4fa858', k % 2 ? 2 : -2, 0); for (let k = 0; k < 4; k++) dot(dx, dy, h + k * .06, k < 3 ? '#d8303a' : '#f06a5a', k % 2, 0); dot(dx, dy, h + .06, '#b8242e', -1, 0); } },
  croton(r) { ball(0, 0, .3, .3, '#3a8a4c', { squash: .8 }); for (let i = 0; i < 12; i++) dot((r() - .5) * .45, (r() - .5) * .3, .2 + r() * .32, ['#f2c230', '#e8483b', '#f08a2a', '#f4e070'][i % 4], 0, 0); },
  fern(r) { rosette(0, 0, .05, { n: 8, len: .55, rise: .32, droop: .35, lf: 2, r, cols: ['#2a6e44', '#3c9450', '#62bc68'] }); },
  hibiscus(r) { ball(0, 0, .38, .36, '#3f8f50', { squash: .85 }); const c = ['#e8483b', '#f08ab0', '#f2c230', '#f4f0e8'][Math.floor(r() * 4)]; for (let i = 0; i < 5; i++) flower((r() - .5) * .5, (r() - .5) * .3, .3 + r() * .4, c, '#ffe070', i < 2); },
  moss(r) { ball(0, 0, .08, .26 + r() * .1, MOSS, { squash: .5, ol: false }); },
  hosta(r) { for (let i = 0; i < 7; i++) { const a = i * .9 + r(); oblob(Math.cos(a) * .2, Math.sin(a) * .2, .12 + r() * .12, 3, 2, i % 2 ? '#6ab87a' : '#8fd0a0', '#3a7a58'); } dot(0, 0, .5, '#c8a8e8'); dot(0, 0, .44, '#c8a8e8', 1, 0); lw([0, 0, .1], [0, 0, .42], '#5a9a6a'); },
  shroom(r) { for (let i = 0; i < 3; i++) { const dx = (r() - .5) * .3, dy = (r() - .5) * .2; dot(dx, dy, .06, '#f4ecd8'); dot(dx, dy, .12, '#d8483b'); dot(dx, dy, .12, '#d8483b', 1, 0); dot(dx, dy, .12, '#d8483b', -1, 0); dot(dx, dy, .16, '#f4f0e8'); } },
  orchid(r) { const c = ['#d858b8', '#f4f0f8', '#f2c8e8', '#f2c230', '#b048d0'][Math.floor(r() * 5)]; for (let i = 0; i < 3; i++) oblob((i - 1) * .12, .02 * i, .08, 2.6, 1.4, '#3f8f50'); const dx = (r() - .5) * .3; let pr = S2(0, 0, .1);
    for (let k = 1; k <= 6; k++) { const t = k / 6, s = S2(dx * t * 1.6, 0, .1 + .75 * Math.sin(t * 1.9)); line(pr, s, '#6a8a4a'); pr = s; if (k > 2) { px(s[0], s[1] - 1, C(c)); px(s[0] - 1, s[1], C(c)); px(s[0] + 1, s[1], C(c)); px(s[0], s[1] + 1, C(dk(c, .15))); px(s[0], s[1], C(c === '#f2c230' ? '#b8342e' : '#f2c230')); } } },
  lantana(r) { ball(0, 0, .3, .32, '#3f8f50', { squash: .8 }); const cs = [['#f08a2a', '#f2c230'], ['#f08ab0', '#f4e070'], ['#b868e0', '#f4f0e8'], ['#e8483b', '#f2a03a']][Math.floor(r() * 4)]; for (let i = 0; i < 9; i++) { const x = (r() - .5) * .5, y = (r() - .5) * .34, z = .22 + r() * .36; dot(x, y, z, cs[0]); dot(x, y, z, cs[1], 1, 0); dot(x, y, z, cs[0], 0, -1); } },
  buddleia(r) { ball(0, 0, .42, .34, '#4a9a5a', { squash: .95 }); for (let i = 0; i < 6; i++) { const x = (r() - .5) * .55, y = (r() - .5) * .3, z = .5 + r() * .4, c = i % 2 ? '#8a5cd0' : '#b48ae8'; for (let k = 0; k < 4; k++) dot(x, y, z + k * .055, k === 3 ? lt(c, .4) : c, k > 1 ? 1 : 0, 0); } },
  succ(r) { const c = ['#7ab8a0', '#9ac8b0', '#b89ac8', '#8fc070'][Math.floor(r() * 4)]; blob(0, 0, .03, 3.4, 1.9, dk(c, .3)); blob(0, 0, .05, 2.4, 1.3, c); blob(0, 0, .07, 1.2, .7, lt(c, .35)); dot(0, 0, .08, '#f08ab0'); },
  pebble(r) { blob(0, 0, .02, 1.5 + r() * 1.5, 1 + r(), ['#a8a096', '#8f887e', '#c2b8a6'][Math.floor(r() * 3)]); },
  box_(r) { ball(0, 0, .28, .36, '#3a8450', { squash: .8, ol: false }); },
};
const MIX = { tropical: ['ear', 'bop', 'ginger', 'croton', 'fern', 'hibiscus', 'ear', 'fern'], fern: ['fern', 'moss', 'hosta', 'fern', 'moss', 'shroom', 'fern'], orchid: ['orchid', 'orchid', 'moss', 'fern', 'orchid'], butterfly: ['lantana', 'buddleia', 'lantana', 'hibiscus', 'buddleia'], desert: ['succ', 'succ', 'pebble', 'succ', 'pebble'], hedge: ['box_'] };
function bed(p) {
  const w = p.w || 3, d = p.d || 2, k = p.kind || 'tropical', r = rng((p.seed || 1) * 7 + 3), h = bedBase(w, d, k === 'hedge' ? .25 : .35, k === 'desert' ? SAND : k === 'orchid' ? '#6a4a34' : SOIL), M = MIX[k] || MIX.tropical, L = [];
  const step = k === 'desert' ? .42 : k === 'hedge' ? .38 : k === 'fern' ? .5 : .62;
  for (let y = .38; y < d - .3; y += step) for (let x = .38; x < w - .3; x += step) { if (p.gap && r() < p.gap) { r(); r(); continue; } L.push([Math.min(w - .32, x + (r() - .5) * .22), Math.min(d - .32, y + (r() - .5) * .22), M[Math.floor(r() * M.length)]]); }
  L.sort((a, b) => (a[0] + a[1]) - (b[0] + b[1]));
  for (const l of L) at(l[0], l[1], h, () => PL[l[2]](r));
}

/* ---------- desert ---------- */
function column(x, y, z, r0, h, c) { cyl(x, y, z, r0, h, c, { t: lt(c, .25) }); const a = S2(x, y, z), n = Math.round(h * 16); for (let k = 2; k < n; k++) { px(a[0] - 1, a[1] - k, C(dk(c, .28))); px(a[0] + 2, a[1] - k, C(dk(c, .4))); if (k % 3 === 0) { px(a[0] - 3, a[1] - k, C('#f0ecd0')); px(a[0] + 1, a[1] - k, C('#f0ecd0')); } } ball(x, y, z + h, r0 * .98, c, { squash: .7, ol: false }); }
function cactus(p) {
  const k = p.kind || 'saguaro', r = rng(p.seed || 2), c = '#4f9a62', m = .4;
  if (k === 'saguaro') { const H = p.h || 2.6; box(m - .5, m - .07, H * .42, .32, .14, .12, c, { ol: false }); column(m - .5, m, H * .42, .1, H * .32, c); column(m, m, 0, .16, H, c); box(m + .16, m - .07, H * .55, .32, .14, .12, c, { ol: false }); column(m + .48, m, H * .55, .1, H * .28, c); flower(m, m, H + .16, '#f4f0e8', '#f2c230'); flower(m - .5, m, H * .74 + .14, '#f4f0e8', '#f2c230'); }
  else if (k === 'barrel') { for (const [x, y, s] of [[m, m, .34], [m + .5, m + .3, .22], [m - .35, m + .4, .18]].slice(0, 1 + Math.floor(r() * 3))) { ball(x, y, s * .8, s, c, { squash: .85 }); const a = S2(x, y, s * .8); for (let i = -2; i <= 2; i++) for (let j = -3; j <= 3; j += 2) px(a[0] + i * Math.round(s * 7), a[1] + j, C(i % 2 ? '#f2e6a0' : dk(c, .3))); blob(x, y, s * 1.55, s * 5, s * 2.4, '#e8c83a'); dot(x, y, s * 1.6, '#f08a2a'); } }
  else if (k === 'prickly') { const P = [[m, m, .3, 5, 6], [m - .3, m, .75, 4, 5], [m + .32, m, .8, 4.5, 5.5], [m + .1, m, 1.25, 3.5, 4.5], [m - .45, m, 1.2, 3, 3.5], [m + .6, m, 1.3, 2.6, 3.2]]; for (const [x, y, z, rx, ry] of P) { oblob(x, y, z, rx, ry, c); blob(x - .03, y, z + .05, rx * .5, ry * .5, lt(c, .15)); for (let i = 0; i < 4; i++) dot(x, y, z, '#f0ecd0', Math.round((r() - .5) * rx * 1.4), Math.round((r() - .5) * ry * 1.4)); } for (const [x, z] of [[m - .45, 1.48], [m + .6, 1.55], [m + .1, 1.58], [m + .3, 1.2]]) { dot(x, m, z, '#d8306a'); dot(x, m, z, '#f06a9a', 0, -1); dot(x, m, z, '#d8306a', 1, 0); } }
  else if (k === 'organ') { const S = []; for (let i = 0; i < 6; i++) S.push([m + (r() - .5) * .7, m + (r() - .5) * .5, 1.1 + r() * 1.5]); S.sort((a, b) => (a[0] + a[1]) - (b[0] + b[1])); for (const s of S) column(s[0], s[1], 0, .09, s[2], '#5aa068'); }
  else if (k === 'agave') { const F = []; for (let i = 0; i < 11; i++) F.push(i / 11 * 6.283 + r() * .3); F.sort((a, b) => (Math.cos(a) + Math.sin(a)) - (Math.cos(b) + Math.sin(b))); for (const a of F) { const len = .55 + r() * .25, cc = Math.cos(a) + Math.sin(a) < 0 ? '#6a9a94' : '#8fc0b4'; for (const o of [0, .04, -.04]) lw([m + o, m, .05], [m + Math.cos(a) * len, m + Math.sin(a) * len, .35 + r() * .2], o ? dk(cc, .15) : cc); dot(m + Math.cos(a) * len, m + Math.sin(a) * len, .45, '#5a3a2a'); } blob(m, m, .3, 2, 2.5, '#a8d0c4'); if (p.spike) { lw([m, m, .3], [m, m, 2.4], '#9ab080'); for (let i = 0; i < 6; i++) { dot(m, m, 1.5 + i * .16, '#e8d86a', i % 2 ? 2 : -2, 0); dot(m, m, 1.5 + i * .16, '#e8d86a', i % 2 ? 3 : -3, -1); } } }
  else if (k === 'yucca') { trunk([m, m, 0], [m + .05, m, 1.3], 3, '#8a7458', 2); lw([m + .05, m, .9], [m + .5, m, 1.5], '#8a7458'); lw([m + .05, m, 1.0], [m - .4, m, 1.6], '#8a7458'); for (const [x, z] of [[m + .05, 1.5], [m + .52, 1.62], [m - .42, 1.72]]) for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; lw([x, m, z], [x + Math.cos(a) * .36, m + Math.sin(a) * .2, z + .08 + Math.sin(a * 2) * .1 + (i % 3) * .08], i % 2 ? '#6a9a6a' : '#8fb880'); } }
  else { rosette(m, m, .05, { n: 9, len: .5, rise: .5, droop: .1, lf: 0, r, cols: ['#4a8a6a', '#6ab08a', '#8ac8a0'] }); lw([m, m, .2], [m + .04, m, 1.0], '#a86a4a'); for (let i = 0; i < 5; i++) dot(m + .04, m, 1.0 + i * .06, i > 3 ? '#f4b03a' : '#f0603a', i % 2, 0); }
}
function rock(p) {
  const w = p.w || 1.2, d = p.d || 1, h = p.h || .7, c = p.c || '#8d8a86', r = rng(p.seed || 3), n = Math.max(2, Math.round(w * d * 2.2)), B = [];
  for (let i = 0; i < n; i++) { const s = (.28 + r() * .3) * Math.min(1.4, Math.max(w, d) / 1.4); B.push([s + r() * Math.max(.01, w - 2 * s), s + r() * Math.max(.01, d - 2 * s), s * (h / .7), s]); }
  B.sort((a, b) => (a[0] + a[1]) - (b[0] + b[1]));
  B.forEach((b, i) => { const cc = i % 3 === 1 ? lt(c, .1) : i % 3 === 2 ? dk(c, .1) : c; ball(b[0], b[1], b[2] * .62, b[3], cc, { squash: .62 * (h / .7) > .9 ? .9 : .7, t: p.moss ? mix(cc, MOSS, .75) : lt(cc, .25) }); if (p.moss && r() < .6) at(b[0], b[1], b[2] * 1.05, () => PL.fern(r)); });
}
function mesa(p) {
  const r = rng(p.seed || 9), c = '#c8764a', st = col => R.PAT.stripes(col, dk(col, .12), 3);
  const L = (x, y, z, w, d, h, cc) => box(x, y, z, w, d, h, cc, { l: st(cc), r: st(dk(cc, .2)), t: lt(cc, .2) });
  L(0, 0, 0, 4, 2.5, .7, c); L(.2, 0, .7, 1.1, 1, 1.5, '#b8663e'); L(1.2, .1, .7, 2.6, 1.9, .6, '#d08a58'); L(1.7, .1, 1.3, 1.5, 1.3, .8, '#c07048'); L(2.3, .2, 2.1, .7, .8, .3, '#d89a6a');
  for (let i = 0; i < 6; i++) at(.3 + r() * 3.3, 2.2 + r() * .2, .9 * (r() < .5 ? 0 : 0), () => PL.pebble(r));
  at(3.5, 2.2, .7, () => PL.succ(r)); at(.7, 1.6, .7, () => PL.succ(r)); at(2.6, .6, 2.4, () => PL.succ(r)); at(.7, .5, 2.2, () => PL.succ(r));
}

/* ---------- orchids, baskets ---------- */
function orchidlog() {
  const r = rng(11); // a mossy branch arch on a rock base, covered in orchids
  at(0, .1, 0, () => rock({ w: 3, d: .8, h: .5, moss: 1, seed: 4 }));
  const pts = []; for (let i = 0; i <= 14; i++) { const t = i / 14; pts.push([.3 + t * 2.4, .45, .4 + 1.9 * Math.sin(t * Math.PI) * (1 - .15 * t)]); }
  for (let i = 0; i < 14; i++) { const a = S2(...pts[i]), b = S2(...pts[i + 1]); for (let o = -2; o <= 2; o++) line([a[0], a[1] + o], [b[0], b[1] + o], o === -2 ? '#8a6a4a' : o === 2 ? '#4a3424' : '#6a4a34'); if (i % 2) { px(a[0], a[1] - 3, C(MOSS)); px(a[0] + 1, a[1] - 3, C('#7fb85a')); } }
  lw([1.5, .45, 2.3], [1.2, .45, 2.75], '#6a4a34'); lw([1.5, .45, 2.3], [1.95, .45, 2.7], '#6a4a34');
  for (let i = 1; i < 14; i++) { const q = pts[i]; if (i % 2 === 0) at(q[0], q[1] + .1, q[2] - .05, () => PL.orchid(r)); else { for (let k = 1; k < 5; k++) dot(q[0], q[1], q[2] - k * .08, k % 2 ? '#4fa858' : '#3f8f50', (k % 2) * 2 - 1, 0); } }
  for (const [x, z] of [[.8, .55], [2.2, .6], [1.5, .5]]) at(x, .75, z - .2, () => PL.orchid(r));
  at(.35, .7, .25, () => PL.fern(r)); at(2.7, .7, .25, () => PL.fern(r));
}
function basket(p) { // local z = 0 is the lowest trailing tip; the hook is at z = 1.6
  const k = p.kind || 'fern', r = rng(p.seed || 3), c = .4, top = 1.6;
  for (const [dx, dy] of [[-.2, .14], [.2, .14], [0, -.18]]) lw([c, c, top], [c + dx, c + dy, .72], IRON_D);
  dot(c, c, top, IRON);
  if (k === 'fern') rosette(c, c, .72, { n: 12, len: .7, rise: .22, droop: .75, lf: 3, r, cols: ['#2a6e44', '#3c9450', '#62bc68'] });
  cyl(c, c, .5, .2, .22, '#7a5a3a', { t: '#4a3626', l: '#8a6a44' });
  if (k === 'orchid') { for (let i = 0; i < 4; i++) at(c + (i - 1.5) * .1, c + .05, .68, () => PL.orchid(r)); for (let i = 0; i < 5; i++) for (let q = 0; q < 5; q++) dot(c + (i - 2) * .09, c + .2, .48 - q * .07, q % 2 ? '#c8d0b0' : '#a8b090', 0, 0); }
  if (k === 'fuchsia') { ball(c, c, .82, .3, '#3f8f50', { squash: .7 }); for (let i = 0; i < 8; i++) { const x = c + (r() - .5) * .6, y = c + (r() - .5) * .3 + .1, z = .3 + r() * .4; lw([x, y, .72], [x, y, z + .08], '#4a9a5a'); dot(x, y, z + .06, '#e8306a'); dot(x, y, z, '#8a3ac8'); dot(x, y, z, '#e8306a', 1, -1); dot(x, y, z, '#e8306a', -1, -1); } }
}

/* ---------- seasonal flower show ---------- */
function tulip(x, y, z, c) { lw([x, y, z], [x, y, z + .26], '#4a9a50'); dot(x, y, z + .1, '#5ab060', 1, 0); dot(x, y, z + .32, c); dot(x, y, z + .32, c, 1, 0); dot(x, y, z + .32, lt(c, .3), 0, -1); dot(x, y, z + .32, dk(c, .15), 1, -1); }
function sunflower(x, y, z, h) { lw([x, y, z], [x, y, z + h], '#4a8a40'); oblob(x - .08, y, z + h * .45, 2.2, 1.3, '#4fa050', '#2f6a3a'); oblob(x + .1, y, z + h * .65, 2, 1.2, '#5ab058', '#2f6a3a'); const s = PW(x, y, z + h + .08); ellipse(s[0], s[1], 4, 3.6, '#c88a1a'); ellipse(s[0], s[1], 3.2, 2.8, '#f4c81a'); ellipse(s[0], s[1], 1.5, 1.3, '#6a4020'); px(Math.round(s[0]) - 1, Math.round(s[1]) - 1, C('#8a5a30')); }
function mum(x, y, z, s, c) { ball(x, y, z + s * .6, s, c, { squash: .7 }); const a = S2(x, y, z + s * .9); for (let i = 0; i < 7; i++) px(a[0] + ((i * 5) % 9) - 4, a[1] + ((i * 3) % 5) - 2, C(i % 2 ? lt(c, .35) : dk(c, .2))); }
function pumpkin(x, y, z, s = 1) { oblob(x, y, z + .14 * s, 4 * s, 3 * s, '#e8862c'); blob(x, y, z + .16 * s, 1.6 * s, 2.6 * s, '#f4a03a'); dot(x, y, z + .14 * s + .2 * s, '#5a7a3a'); dot(x, y, z + .14 * s + .26 * s, '#5a7a3a', 1, 0); }
function poinsettia(x, y, z, c = '#d8303a') { ball(x, y, z + .14, .2, '#2f6a44', { squash: .7, ol: false }); const a = S2(x, y, z + .3); for (const [dx, dy] of [[0, 0], [2, 0], [-2, 0], [0, -2], [0, 2], [1, -1], [-1, -1], [1, 1], [-1, 1], [3, 1], [-3, 1], [0, -3]]) px(a[0] + dx, a[1] + dy, C((dx + dy) % 2 ? dk(c, .15) : c)); px(a[0], a[1], C('#f2d040')); }
function fir(x, y, z, h, lights, r) { lw([x, y, z], [x, y, z + .15], '#5a4030'); for (let i = 0; i < 3; i++) cone(x, y, z + .12 + i * h * .26, .26 - i * .06, h * .42, '#2f7050'); if (lights) lit(() => { for (let i = 0; i < 7; i++) dot(x, y, z + .2 + r() * h * .7, ['#ffe070', '#ff7a6a', '#7ad8ff', '#fff4d0'][i % 4], Math.round((r() - .5) * 6), 0); }); }
function flowerbed(p) {
  const w = p.w || 4, d = p.d || 2, s = p.season === undefined ? 0 : p.season, r = rng((p.seed || 1) * 5 + s), v = p.v || 0, h = bedBase(w, d, .25, s === 3 ? '#e9eef2' : SOIL, '#e8e2d4'), L = [];
  if (s === 0) { let k = v; for (let x = .34; x < w - .28; x += .22, k++) { const c = TULIP[Math.floor(k / 3) % TULIP.length]; for (let y = .34; y < d - .28; y += .24) L.push([x + (r() - .5) * .04, y, () => tulip(0, 0, 0, c)]); } }
  else if (s === 1) { for (let y = .45; y < d - .6; y += .42) for (let x = .45; x < w - .35; x += .46) { const hh = .7 + r() * .5 + (d - y) * .12; L.push([x + (r() - .5) * .12, y, () => sunflower(0, 0, 0, hh)]); } for (let x = .36; x < w - .3; x += .24) { const c = ['#f08a2a', '#e8483b', '#f2c230'][Math.floor(r() * 3)]; L.push([x, d - .36, () => { ball(0, 0, .1, .12, '#4a9a50', { ol: false, squash: .7 }); flower(0, 0, .2, c, '#7a3a1a'); }]); } }
  else if (s === 2) { for (let y = .45; y < d - .3; y += .5) for (let x = .45; x < w - .3; x += .52) { const c = MUM[(Math.floor(x / .52) + Math.floor(y / .5) * 2 + v) % MUM.length], q = r(); L.push([x + (r() - .5) * .1, y, q < .14 ? () => pumpkin(0, 0, 0, .8 + r() * .5) : () => mum(0, 0, 0, .2 + r() * .06, c)]); } }
  else { for (let y = .42; y < d - .3; y += .44) for (let x = .42; x < w - .3; x += .46) { const q = r(), c = q < .22 ? '#f4f0e8' : q < .3 ? '#f08ab0' : '#d8303a'; L.push([x + (r() - .5) * .08, y, q > .9 ? () => fir(0, 0, 0, .7 + r() * .3, true, r) : () => poinsettia(0, 0, 0, c)]); } }
  L.sort((a, b) => (a[0] + a[1]) - (b[0] + b[1])); for (const l of L) at(l[0], l[1], h, l[2]);
  if (s === 3) lit(() => { for (let x = .1; x < w; x += .3) dot(x, d, .27, ['#ffe070', '#ff7a6a', '#7ad8ff'][Math.round(x / .3) % 3], 0, Math.round(x / .3) % 2); });
}
function showpiece(p) {
  const s = p.season === undefined ? 0 : p.season, r = rng(40 + s), c = 1.5;
  cyl(c, c, 0, 1.4, .35, '#e8e2d4', { t: s === 3 ? '#e9eef2' : SOIL }); cyl(c, c, .35, .95, .4, '#e8e2d4', { t: s === 3 ? '#e9eef2' : SOIL });
  const ring = (rad, z, n, fn) => { const P = []; for (let i = 0; i < n; i++) { const a = i / n * 6.283; P.push([c + Math.cos(a) * rad, c + Math.sin(a) * rad]); } P.sort((a, b) => (a[0] + a[1]) - (b[0] + b[1])); P.forEach((q, i) => at(q[0], q[1], z, () => fn(i))); };
  if (s === 0) { // blossom tree over tulip rings
    ring(1.2, .35, 26, i => tulip(0, 0, 0, TULIP[Math.floor(i / 2) % 3])); ring(.75, .75, 16, i => tulip(0, 0, 0, TULIP[3 + i % 3]));
    trunk([c, c, .75], [c + .1, c, 2.0], 4, '#6a4a3a', 0); lw([c + .1, c, 1.7], [c - .6, c, 2.3], '#6a4a3a'); lw([c + .1, c, 1.8], [c + .8, c, 2.4], '#6a4a3a');
    const B = []; for (let i = 0; i < 11; i++) B.push([c + (r() - .5) * 2, c + (r() - .5) * 1.4, 2.2 + r() * .9, .36 + r() * .22]); B.sort((a, b) => (a[0] + a[1]) - (b[0] + b[1])); B.forEach((b, i) => ball(b[0], b[1], b[2], b[3], ['#f2a7c3', '#f7c1d4', '#fbe3ea', '#f08ab0'][i % 4], { squash: .75, ol: i < 5 }));
  } else if (s === 1) { // sunflower tower with a straw-hat scarecrow
    ring(1.2, .35, 14, i => sunflower(0, 0, 0, .6 + (i % 3) * .12)); ring(.72, .75, 9, i => sunflower(0, 0, 0, .8 + (i % 2) * .15));
    lw([c, c, .75], [c, c, 2.5], '#8a6a44'); lw([c - .5, c, 2.0], [c + .5, c, 2.0], '#8a6a44'); box(c - .22, c - .1, 1.55, .44, .2, .55, '#3b6fd0', { ol: false }); qy(c - .22, c + .22, c + .1, 1.55, 1.75, '#d9483b'); ball(c, c, 2.3, .2, '#f0d8a8'); cyl(c, c, 2.42, .34, .04, '#e8c060', { ol: false }); cyl(c, c, 2.44, .17, .16, '#e8c060'); dot(c, c + .2, 2.3, '#3a2a20', -1, 0); dot(c, c + .2, 2.3, '#3a2a20', 2, 0);
  } else if (s === 2) { // pumpkin pyramid with chrysanthemums and hay
    ring(1.2, .35, 12, i => i % 3 === 0 ? pumpkin(0, 0, 0, 1.3) : mum(0, 0, 0, .22, MUM[i % MUM.length])); ring(.72, .75, 8, i => i % 2 ? pumpkin(0, 0, 0, 1.1) : mum(0, 0, 0, .2, MUM[(i + 2) % MUM.length]));
    box(c - .4, c - .3, .75, .8, .6, .4, '#e0c060', { l: R.PAT.siding('#d8b450', 2), r: R.PAT.siding('#c09a40', 2), t: '#e8cc70' }); pumpkin(c - .15, c, 1.15, 1.6); pumpkin(c + .25, c + .1, 1.15, 1.1); pumpkin(c, c, 1.55, 1.2);
    for (let i = 0; i < 5; i++) { const x = c + (i - 2) * .12; lw([x, c - .2, 1.15], [x + (i - 2) * .1, c - .2, 2.3 + (i % 2) * .2], '#c8a040'); dot(x + (i - 2) * .1, c - .2, 2.3 + (i % 2) * .2, '#e8c860', 0, -1); }
  } else { // poinsettia tree with a lit star
    ring(1.2, .35, 14, i => poinsettia(0, 0, 0, i % 4 === 3 ? '#f4f0e8' : '#d8303a')); for (let t = 0; t < 5; t++) ring(.8 - t * .16, .75 + t * .36, Math.max(4, 12 - t * 2), i => poinsettia(0, 0, 0, (i + t) % 5 === 0 ? '#f4f0e8' : '#d8303a'));
    lit(() => { for (let i = 0; i < 22; i++) { const z = .8 + r() * 1.7, rad = .85 * (1 - (z - .75) / 2.1); dot(c + (r() - .5) * 2 * rad, c + .2, z, ['#ffe070', '#fff4d0', '#7ad8ff'][i % 3]); } const s2 = S2(c, c, 2.75); for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [-2, 0], [0, -2], [0, 2]]) px(s2[0] + dx, s2[1] + dy, C(Math.abs(dx) + Math.abs(dy) > 1 ? '#ffe070' : '#fff8d8')); });
    for (const [x, y, cc] of [[.5, 2.5, '#3b6fd0'], [2.4, 2.3, '#4fa860'], [2.7, 1.2, '#f2c230']]) { box(x, y, 0, .32, .32, .26, cc); qy(x + .13, x + .19, y + .32, 0, .26, '#f4f0e8'); }
  }
}
function urn(p) {
  const k = p.kind || 'flowers', r = rng(p.seed || 2), c = .35, s = p.season === undefined ? 1 : p.season;
  cyl(c, c, 0, .22, .1, STONE); cyl(c, c, .1, .09, .28, STONE, { ol: false }); cyl(c, c, .38, .26, .3, STONE, { t: SOIL }); cyl(c, c, .62, .3, .06, lt(STONE, .2), { t: SOIL });
  if (k === 'fern') rosette(c, c, .68, { n: 10, len: .6, rise: .3, droop: .55, lf: 2, r, cols: ['#2a6e44', '#3c9450', '#62bc68'] });
  else if (k === 'topiary') { lw([c, c, .68], [c, c, 1.0], '#5a4030'); ball(c, c, 1.25, .3, '#3a8450'); }
  else { ball(c, c, .82, .3, '#3f8f50', { squash: .7 }); const cs = [TULIP, ['#f08a2a', '#f2c230', '#e8483b'], MUM, ['#d8303a', '#f4f0e8']][s]; for (let i = 0; i < 9; i++) flower(c + (r() - .5) * .55, c + (r() - .5) * .3 + .05, .74 + r() * .3, cs[i % cs.length], '#ffe070', i % 3 === 0); for (let i = 0; i < 4; i++) for (let q = 0; q < 4; q++) dot(c + (i - 1.5) * .14, c + .28, .62 - q * .06, q % 2 ? '#4fa858' : '#3f8f50', q % 2, 0); }
}
function reeds(p) { const r = rng(p.seed || 3); for (let i = 0; i < 12; i++) { const x = .1 + r() * .8, y = .1 + r() * .4, h = .6 + r() * .7, dx = (r() - .5) * .3; lw([x, y, 0], [x + dx, y, h], i % 2 ? '#5a9a4a' : '#7ab85a'); if (i % 3 === 0) { dot(x + dx, y, h, '#7a4a2a'); dot(x + dx, y, h, '#7a4a2a', 0, 1); dot(x + dx, y, h, '#7a4a2a', 0, 2); } } }

/* ---------- house plants sold as seedlings (furn.home.plant.cons_*) ---------- */
function hpot(c = TERRA, h = .22) { cyl(.25, .25, 0, .13, h, c, { t: '#4a3626' }); cyl(.25, .25, h - .05, .15, .05, lt(c, .1), { t: '#4a3626' }); return h; }
const HP = (id, h, draw, variants) => ({ id: 'furn.home.plant.cons_' + id, kind: 'furniture', tags: ['home', 'decor', 'plant', 'conservatory'], size: [.5, .5, h], vb: [-.4, -.4, 0, .9, .9, h + .3], variants: variants || [{}], draw });

const T = ['conservatory', 'cons'];
const A = (id, tags, size, draw, x) => Object.assign({ id: 'furn.cons.' + id, kind: 'furniture', tags: T.concat(tags), size, draw, variants: [{}] }, x);
export default [
  A('palm', ['palm', 'tree'], p => [.6, .6, p.h || 3.6], palm, { vb: p => [-1.8, -1.8, 0, 2.4, 2.4, (p.h || 3.6) + 1.2], variants: [{ kind: 'coconut', h: 4, seed: 3 }, { kind: 'date', h: 3.2, seed: 8 }, { kind: 'areca', h: 2.6, seed: 5 }, { kind: 'coconut', h: 3, seed: 12, lean: -.5 }] }),
  A('banana', ['banana'], p => [.6, .6, (p.h || 1.5) + .8], banana, { vb: p => [-1.4, -1.4, 0, 2, 2, (p.h || 1.5) + 1.5], variants: [{ seed: 2 }, { seed: 5, h: 1.9 }] }),
  A('treefern', ['fern', 'tree'], p => [.6, .6, (p.h || 2) + .5], treefern, { vb: p => [-1.4, -1.4, 0, 2, 2, (p.h || 2) + 1], variants: [{ seed: 7 }, { seed: 3, h: 1.4 }] }),
  A('cycad', ['cycad'], [.8, .8, .9], cycad, { vb: [-.6, -.6, 0, 1.4, 1.4, 1.3], variants: [{ seed: 2 }, { seed: 9 }] }),
  A('bamboo', ['bamboo'], [1, .8, 3.4], bamboo, { vb: [-.4, -.3, 0, 1.4, 1.1, 3.8], variants: [{ seed: 4 }, { seed: 9 }] }),
  A('maple', ['maple', 'tree'], [.8, .8, 2.2], maple, { vb: [-.8, -.6, 0, 1.6, 1.4, 2.6], variants: [{ seed: 6 }] }),
  A('bed', ['bed', 'planter'], p => [p.w || 3, p.d || 2, p.kind === 'hedge' ? .7 : .9], bed, { vb: p => [-.3, -.3, 0, (p.w || 3) + .3, (p.d || 2) + .3, 1.9], variants: [{ w: 4, d: 3, kind: 'tropical', seed: 2 }, { w: 3, d: 2, kind: 'fern', seed: 4 }, { w: 3, d: 1, kind: 'orchid', seed: 5 }, { w: 3, d: 2, kind: 'butterfly', seed: 6 }, { w: 3, d: 2, kind: 'desert', seed: 7 }, { w: 4, d: 1, kind: 'hedge', seed: 1 }] }),
  A('cactus', ['cactus', 'desert'], p => p.kind === 'saguaro' || !p.kind ? [.8, .8, p.h || 2.6] : p.kind === 'organ' ? [.8, .8, 2.4] : p.kind === 'yucca' ? [.8, .8, 2] : [.8, .8, .9], cactus, { vb: p => [-.5, -.4, 0, 1.5, 1.3, p.spike ? 2.7 : (p.kind === 'saguaro' || !p.kind ? (p.h || 2.6) + .5 : 2.9)], variants: [{ kind: 'saguaro' }, { kind: 'barrel', seed: 7 }, { kind: 'prickly' }, { kind: 'organ', seed: 4 }, { kind: 'agave', seed: 2, spike: 1 }, { kind: 'yucca' }, { kind: 'aloe' }] }),
  A('rock', ['rock'], p => [p.w || 1.2, p.d || 1, p.h || .7], rock, { vb: p => [-.3, -.3, 0, (p.w || 1.2) + .3, (p.d || 1) + .3, (p.h || .7) + 1], variants: [{}, { w: 2.5, d: 1.2, h: 1.1, moss: 1, seed: 5 }, { w: 2, d: 1.5, h: 1, c: '#c8764a', seed: 8 }] }),
  A('mesa', ['rock', 'desert'], [4, 2.5, 2.4], mesa),
  A('orchidlog', ['orchid', 'cons_orchid'], [3, 1, 2.6], orchidlog, { vb: [-.3, -.3, 0, 3.3, 1.4, 3.2], use: { x: 1.5, y: 1.7 } }),
  A('basket', ['hanging'], [.8, .8, 1.6], basket, { overhead: true, solid: false, vb: [-.4, -.4, 0, 1.2, 1.2, 1.7], variants: [{ kind: 'fern', seed: 3 }, { kind: 'orchid', seed: 5 }, { kind: 'fuchsia', seed: 7 }] }),
  A('flowerbed', ['flowershow'], p => [p.w || 4, p.d || 2, .8], flowerbed, { vb: p => [-.2, -.2, 0, (p.w || 4) + .2, (p.d || 2) + .2, 2], variants: [{ season: 0 }, { season: 1 }, { season: 2 }, { season: 3 }] }),
  A('showpiece', ['flowershow'], [3, 3, 3], showpiece, { vb: [-.4, -.4, 0, 3.4, 3.4, 3.6], variants: [{ season: 0 }, { season: 1 }, { season: 2 }, { season: 3 }] }),
  A('urn', ['urn', 'planter'], [.7, .7, 1.2], urn, { vb: [-.3, -.3, 0, 1, 1, 1.7], variants: [{ season: 0 }, { kind: 'fern' }, { kind: 'topiary' }, { season: 3 }] }),
  A('reeds', ['reeds'], [1, .6, 1.2], reeds, { solid: false, vb: [-.2, -.2, 0, 1.2, .8, 1.5] }),
  HP('orchid', 1, () => { const h = hpot('#f1eee6', .2); at(.25, .25, h, () => PL.orchid(rng(2))); at(.3, .25, h, () => PL.orchid(rng(7))); }),
  HP('palm', 1.3, () => { const h = hpot(TERRA, .24); rosette(.25, .25, h + .25, { n: 8, len: .6, rise: .5, droop: .45, lf: 2, r: rng(3), cols: ['#2f7a48', '#44a058', '#64bc6a'] }); lw([.25, .25, h], [.25, .25, h + .25], '#7fae5a'); }),
  HP('barrel', .7, () => { const h = hpot('#3b4560', .18); ball(.25, .25, h + .13, .16, '#4f9a62', { squash: .9 }); const a = S2(.25, .25, h + .13); for (let i = -1; i <= 1; i++) for (let j = -2; j <= 2; j += 2) px(a[0] + i * 3, a[1] + j, C('#f2e6a0')); blob(.25, .25, h + .28, 2, 1, '#e8c83a'); }),
  HP('flytrap', .7, () => { const h = hpot('#c9764a', .18), r = rng(5); for (let i = 0; i < 6; i++) { const a = i * 1.05 + r(), x = .25 + Math.cos(a) * .16, y = .25 + Math.sin(a) * .12, z = h + .16 + r() * .22; lw([.25, .25, h], [x, y, z], '#5aa050'); oblob(x, y, z, 2, 1.5, '#7fc060', '#3f7a40'); dot(x, y, z, '#d8483b'); } }),
  HP('birdsnest', 1, () => { const h = hpot('#f1eee6', .22), r = rng(8); for (let i = 0; i < 9; i++) { const a = i / 9 * 6.283 + r() * .3, len = .3 + r() * .14, c = Math.cos(a) + Math.sin(a) < 0 ? '#3c9450' : '#6ac070'; for (let t = 1; t <= 5; t++) blob(.25 + Math.cos(a) * len * t / 5, .25 + Math.sin(a) * len * t / 5, h + .5 * Math.sin(t / 5 * 1.9), 1 + Math.sin(t / 5 * 3.14) * 1.4, 1.2, c); } }),
];
