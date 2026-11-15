// Maple Bay Aquarium — interior furniture (ids furn.aqua.*). The living things (fish, jellies, penguins, otters, the diver) are drawn by scenes/rooms/aquarium_life.js.
//   desk {w, kind ticket|shop|cafe|prep}  bench {c}  sign {name, c, w} (hang it with z)  plaque {c}  board {kind shows|adopt|sketch|chart|plaque, name, n}
//   touchpool {w, d}  lagoon {w, d}  penguinrock {w}  icewall {w, h} (wall)  partition {w, h, c}  tankwall {w, h}  plinth {r}  coltank {k 0-3, frame}
//   photospot {k jaws|tunnel|penguin}  quiz  feeder  plant {seed}  door {name} (wall)  stairs {name}  shelf {kind plush|books|mugs, w}  plushbin
//   rib {span, h}  curb {len}  glint {len, h}  rock {seed, s}  coral {k, seed}  kelp {h, frame, seed}  wreck  anchor  chest {frame}
//   deckpool {w, d, kind otter|seal}  stand {w}  scope  bucket  rehab {stage 0-3}  labbench {kind}  rack {frame}  sleepbag {c}  rail {len}  lamp
import * as R from '../../engine/raster.js';
import { AQ, S2, cylP, fishS, kelpS, coralS, starS, bubbleS, waterTop, steel } from './_aqua_lib.js';
const { box, qy, qx, qz, fq, lw, lit, glow, cyl, ball, dk, lt, mix, hash2, rng, signY, signX, textS, textW, PAT, C, px, rect, ellipse } = R;
const A = (id, tags, size, draw, o) => Object.assign({ id: 'furn.aqua.' + id, kind: 'furniture', tags: ['aquarium'].concat(tags), size, draw, variants: [{}] }, o);
const txt = (str, x, y, z, c, centre) => R.textY(str, x - (centre ? textW(str) / 32 : 0), y, z, c);

function desk(p) {
  const w = p.w || 4, k = p.kind || 'ticket', c = k === 'cafe' ? '#2f6f78' : k === 'shop' ? AQ.coral : k === 'prep' ? AQ.steel : AQ.navy;
  box(0, 0, 0, w, .7, 1, c, { l: (u, v) => (v > 12 ? lt(c, .12) : (u + v) % 7 === 0 ? dk(c, .15) : c), t: k === 'prep' ? '#d8e0e4' : AQ.white });
  qy(.05, w - .05, .7, .08, .16, AQ.aqua);
  if (k === 'ticket') { signY('TICKETS', .4, w - 1.2, .7, .48, .78, c, AQ.foam, { frame: false }); fishS(w - .7, .71, .62, 9, AQ.orange, { dir: -1, stripe: 3, c2: AQ.foam }); box(.4, .15, 1.02, .5, .35, .32, '#3a3440', { ol: false }); lit(() => qy(.44, .86, .5, 1.1, 1.28, '#8fe0ff')); for (let i = 0; i < 3; i++) box(1.3 + i * .3, .25, 1.02, .2, .12, .22, [AQ.coral, AQ.aqua, AQ.orange][i], { ol: false }); }
  else if (k === 'shop') { signY('GIFTS', .3, w - .9, .7, .48, .78, c, AQ.foam, { frame: false }); box(w - .7, .15, 1.02, .4, .35, .3, '#3a3440', { ol: false }); for (const [x, cc] of [[.35, '#7fb0c8'], [.7, '#f29ac0'], [1.05, '#5f8a3a']]) { ball(x, .35, 1.14, .11, cc, { ol: false }); ball(x + .1, .35, 1.2, .05, cc, { ol: false }); } }
  else if (k === 'cafe') { signY('THE GALLEY', .2, w - .2, .7, .48, .78, c, AQ.foam, { frame: false }); box(.3, .1, 1.02, .6, .45, .5, '#c8ccd0', { ol: false }); lit(() => qy(.4, .8, .56, 1.2, 1.36, '#ffb060')); for (let i = 0; i < 4; i++) cyl(1.4 + i * .28, .3, 1.02, .08, .18, AQ.white, { ol: false }); box(w - 1, .12, 1.02, .8, .4, .28, '#bfe6f0', { ol: false, t: '#e8fbff' }); for (let i = 0; i < 3; i++) ball(w - .85 + i * .25, .32, 1.12, .08, ['#f2c24a', '#f29ac0', '#b8794a'][i], { ol: false }); }
  else { for (let i = 0; i < 3; i++) { const s = S2(.5 + i * .5, .3, 1.03); ellipse(s[0], s[1], 5, 2, '#d8e0e4'); fishS(.5 + i * .5, .3, 1.06, 5, '#9fb4c4', { dir: 1 }); } box(w - .8, .15, 1.02, .5, .4, .2, '#f4f0e8', { ol: false }); box(w - .7, .2, 1.22, .3, .3, .25, '#58c4a0', { ol: false }); }
}
function bench(p) { const c = p.c || AQ.teal; for (const x of [.1, 1.72]) box(x, .08, 0, .18, .54, .3, '#3a3440', { ol: false }); box(0, 0, .28, 2, .7, .17, c, { t: lt(c, .12) }); }
function sign(p) { const w = p.w || 3, c = p.c || AQ.navy; for (const x of [.3, w - .3]) lw([x, .1, .6], [x, .1, 1.6], '#5a6670'); box(0, 0, 0, w, .2, .6, c, { ol: false }); lit(() => signY(p.name || 'AQUARIUM', .1, w - .1, .2, .08, .52, c, p.fg || AQ.foam, { frame: false })); qy(0, w, .2, 0, .06, AQ.aqua); }
function plaque(p) { const c = p.c || AQ.navy; box(.22, .1, 0, .12, .12, .8, '#5a6670', { ol: false }); fq([[0, .05, .8], [.56, .05, .8], [.56, .3, 1.02], [0, .3, 1.02]].map(q => [q[0], q[1] + .0, q[2]]), c); qy(0, .56, .3, .8, 1.02, dk(c, .2)); lit(() => { const s = S2(.28, .3, .95); rect(s[0] - 2, s[1] - 1, 5, 1, AQ.foam); rect(s[0] - 3, s[1] + 1, 7, 1, AQ.aqua); }); fishS(.28, .31, .88, 5, AQ.orange, { dir: 1 }); }
function board(p) {
  const k = p.kind || 'shows', w = k === 'plaque' ? 1.2 : k === 'shows' ? 3.8 : 2.4, c = k === 'plaque' ? '#7a5a2a' : k === 'chart' ? '#f4f0e8' : AQ.navy, T = 2.9;
  if (k === 'plaque') { box(.2, 0, 0, .8, .3, .55, '#8a8f98', { l: PAT.stone('#7d8792') }); fq([[.05, .05, .55], [1.15, .05, .55], [1.15, .35, .85], [.05, .35, .85]], '#c8a050'); qy(.05, 1.15, .35, .55, .85, '#8a6a2a'); fishS(.6, .36, .7, 9, '#5f8f5a', { dir: 1, fat: .45 }); return; }
  for (const x of [.1, w - .25]) box(x, .05, 0, .15, .15, T, '#5a6670', { ol: false }); box(0, 0, .45, w, .18, T - .45, c, { l: c, t: dk(c, .2) }); qy(0, w, .18, T - .08, T, AQ.aqua);
  const row = (i, s, col, x) => txt(s, x === undefined ? .15 : x, .19, T - .2 - i * .44, col);
  if (k === 'shows') { lit(() => { txt('TODAY', w / 2, .19, T - .14, AQ.orange, 1); (p.rows || ['11:30 PENGUINS', '12:15 RAY BAY', '13:00 OTTERS', '14:00 DIVER']).forEach((s, i) => { row(i + 1.2, s.slice(0, 5), AQ.aqua); row(i + 1.2, s.slice(6), AQ.foam, 1.7); }); }); }
  else if (k === 'adopt') { lit(() => txt('ADOPTED', w / 2, .19, T - .2, AQ.orange, 1)); const names = (p.names || []).slice(-4); for (let i = 0; i < 4; i++) { const s = S2(.2, .19, T - .72 - i * .44); rect(s[0], s[1], 3, 4, '#2a2733'); rect(s[0] + 1, s[1] + 1, 1, 3, '#f4f0e8'); if (names[i]) lit(() => row(i + 1.2, String(names[i]).slice(0, 8), AQ.foam, .5)); else row(i + 1.2, '.......', '#4a6a8a', .5); } }
  else if (k === 'sketch') { qy(.1, w - .1, .19, .55, T - .12, '#b8875a'); for (let i = 0; i < 6; i++) { const x = .2 + (i % 3) * .72, z = 1.9 - Math.floor(i / 3) * .9; qy(x, x + .58, .2, z, z + .6, i < (p.n || 0) ? '#fbf7ee' : '#e8dcc0'); if (i < (p.n || 0)) fishS(x + .29, .21, z + .3, 6 + (i % 3), ['#6a7a8a', '#8a6a5a', '#5a7a6a'][i % 3], { dir: i % 2 ? 1 : -1 }); } }
  else { txt('TURTLE', w / 2, .19, T - .2, AQ.coral, 1); const n = p.n || 0; for (let i = 0; i < 3; i++) { row(i + 1.2, 'DAY ' + (i + 1), '#4a5a6a'); qy(1.3, 2.2, .19, T - 1.02 - i * .44, T - .8 - i * .44, i < n ? '#58c4a0' : '#d8d0c0'); } if (p.name) txt(String(p.name).slice(0, 9), w / 2, .19, .95, AQ.navy, 1); }
}
function creature(x, y, z, k, seed) {
  const s = S2(x, y, z);
  if (k === 0) starS(x, y, z, ['#f08a3a', '#c85ab0', '#e8483b'][seed % 3]);
  else if (k === 1) { ellipse(s[0], s[1], 3, 2, '#5a3a8a'); for (let a = 0; a < 8; a++) px(s[0] + Math.round(Math.cos(a * .785) * 4), s[1] + Math.round(Math.sin(a * .785) * 3), C('#8a6ac0')); }
  else if (k === 2) { ellipse(s[0], s[1], 4, 2, '#3f9a6a'); for (let a = 0; a < 7; a++) px(s[0] - 3 + a, s[1] - 2 - (a & 1), C('#8fe0a8')); px(s[0], s[1], C('#f4c0d0')); }
  else { ellipse(s[0], s[1], 3, 2, '#d8a868'); px(s[0] + 3, s[1] + 1, C('#e8483b')); px(s[0] - 3, s[1] + 1, C('#e8483b')); px(s[0] + 1, s[1] - 2, C(AQ.ink)); }
}
function touchpool(p) {
  const w = p.w || 5, d = p.d || 3, r = rng(11);
  box(0, 0, 0, w, d, .72, AQ.rock, { l: PAT.stone(AQ.rock), r: PAT.stone(AQ.rockD), t: '#98a2ac' });
  waterTop(.3, w - .3, .3, d - .3, .68, '#58b8d0'); qz(.3, w - .3, .3, d - .3, .66, (x, y) => (hash2(Math.floor(x * 8), Math.floor(y * 8), 4) > .5 ? null : null));
  for (let i = 0; i < 14; i++) { const x = .6 + r() * (w - 1.2), y = .6 + r() * (d - 1.2); const s = S2(x, y, .68); ellipse(s[0], s[1], 4 + r() * 3, 2 + r(), i % 3 ? AQ.sand : '#8a94a0', 'glass'); }
  [[.9, .8, 0], [w - 1, .9, 1], [w / 2, d - .8, 2], [1.2, d - .9, 3], [w - 1.2, d - .7, 0], [w / 2 + .5, .9, 1], [w / 2 - .9, d / 2, 2], [w - .8, d / 2, 0]].forEach(([x, y, k], i) => creature(x, y, .7, k, i));
  for (const [x, y] of [[0, 0], [w - .5, 0], [0, d - .4]]) ball(x + .3, y + .2, .75, .28, AQ.rockD, { squash: .6 });
}
function lagoon(p) {
  const w = p.w || 7, d = p.d || 4;
  box(0, 0, 0, w, d, .62, '#d8c8a0', { l: PAT.stone('#cdbb90'), r: PAT.stone('#b8a67c'), t: '#e8dcb8' });
  qz(.25, w - .25, .25, d - .25, .56, (x, y) => { const k = Math.sin(x * 4 + Math.sin(y * 3)) + Math.sin(y * 5 + x * 1.3); return k > 1.3 ? '#c8f4f8' : k > .2 ? '#7fd8e0' : '#6ccad6'; });
  for (const [x, y, k] of [[.8, .7, 1], [w - 1, d - .8, 0], [w - .9, .8, 2]]) coralS(x, y, .6, k, 3);
  qy(0, w, d, .62, .9, '#bfeaf6', 'glass'); qx(w, 0, d, .62, .9, '#a8dcec', 'glass'); lw([0, d, .9], [w, d, .9], AQ.frame); lw([w, 0, .9], [w, d, .9], AQ.frame);
}
function penguinrock(p) {
  const w = p.w || 13, r = rng(5);
  box(0, 0, 0, w, 3.2, .5, '#aeb8c2', { l: PAT.stone('#9aa6b2'), r: PAT.stone('#84909c'), t: (x, y) => (hash2(Math.floor(x * 5), Math.floor(y * 5), 2) > .82 ? '#eef6fa' : '#c8d2da') });
  for (let i = 0; i < 6; i++) { const x = .6 + i * (w - 1.2) / 5, hgt = .5 + r() * .9; box(x - .5, .1, .5, 1 + r() * .6, .8, hgt, i % 2 ? '#dfeef6' : '#9aa6b2', { l: i % 2 ? '#c8e0ee' : PAT.stone('#8a96a2'), t: '#f4fbff' }); }
  for (const [x, y] of [[2.2, 1.6], [w - 3, 1.9], [w / 2, 1.3]]) { const s = S2(x, y, .5); ellipse(s[0], s[1], 9, 4, '#eef6fa'); }
  // the pool in front, behind low glass
  box(0, 3.2, 0, w, 1.4, .34, '#7d8792', { ol: false, t: '#5a6670' }); waterTop(.1, w - .1, 3.25, 4.5, .36, '#3f9ec4');
  qy(0, w, 4.6, 0, .34, '#2f86b0'); qy(0, w, 4.6, .34, 1, '#bfeaf6', 'glass'); qx(w, 3.2, 4.6, .34, 1, '#a8dcec', 'glass'); lw([0, 4.6, 1], [w, 4.6, 1], AQ.frame); lw([w, 3.2, 1], [w, 4.6, 1], AQ.frame);
  for (let x = 2; x < w; x += 3) lw([x, 4.6, .0], [x, 4.6, 1], AQ.frame);
}
function icewall(p) {
  const w = p.w || 13, h = p.h || 3.6;
  qy(0, w, .1, 0, h, (u, v, W, Hh) => { const m = Hh * .45 + Math.sin(u / 17) * 9 + Math.sin(u / 5) * 2, m2 = Hh * .3 + Math.sin(u / 11 + 2) * 7; if (v > m) return v > Hh - 8 && hash2(u >> 2, v >> 1, 6) > .7 ? '#e8f4ff' : ((u + v) & 1) && v < m + 6 ? '#a8d4ee' : '#8fc4e6'; if (v > m2) return v > m - 3 ? '#f4fbff' : '#cfe4f2'; return hash2(u >> 1, v >> 1, 3) > .9 ? '#dfeef6' : '#b4cfe2'; });
}
function partition(p) { const w = p.w || 4, h = p.h || 3, c = p.c || '#dfe8ea'; box(0, 0, 0, w, .3, h, c, { l: (u, v) => (v < 4 ? AQ.navy : v % 24 === 0 ? dk(c, .1) : c), r: dk(c, .2), t: '#8a98a0' }); if (p.wave) qy(0, w, .3, .9, 1.02, AQ.aqua); }
function tankwall(p) { const w = p.w || 9, h = p.h || 3; box(0, 0, 0, w, .8, h, AQ.navy, { l: '#0f2a48', r: '#0c2038', t: '#1c3c5c' }); }
function plinth(p) { const r = p.r || 2.6; cyl(r, r, 0, r, .5, AQ.navy, { t: '#1c3c5c' }); cylP(r, r, .38, r, .12, () => AQ.aqua, { ol: false }); }
function coltank(p) {
  const k = p.k || 0, f = p.frame || 0, r = .62;
  cyl(.7, .7, 0, .7, .5, AQ.navy); cylP(.7, .7, .5, r, 1.7, (kk, v, hp) => (kk > .78 || kk < -.78 ? '#bfeaf6' : v > hp - 3 ? '#9fdcf0' : kk > .2 ? '#2a7aa6' : '#3490bc'), { t: '#1c3c5c' });
  lit(() => { cylP(.7, .7, .55, r - .08, 1.55, (kk, v, hp) => (kk > .2 ? '#2f86b4' : '#3f9ec8'), { ol: false }); const s = S2(.7, .7, 1.2);
    if (k === 0) { for (const [dx, dy, fl] of [[-5, 2, 1], [4, -6, -1], [0, 8, 1]]) { const X = s[0] + dx, Y = s[1] + dy + ((f + dx) & 1); rect(X, Y, 2, 2, '#f2c24a'); rect(X + fl, Y + 2, 2, 3, '#e0a030'); px(X + fl * 2, Y + 5, C('#e0a030')); px(X - fl, Y, C('#f2c24a')); px(X, Y - 1, C('#f8e08a')); } kelpS(.5, .7, .56, 16, 2 + f * .3, '#58a06a'); }
    else if (k === 1) { for (const [dx, dy, d] of [[-4 + f, 3, 1], [3 - f, -4, -1], [1, 9, 1]]) { const X = s[0] + dx, Y = s[1] + dy; rect(X - 2, Y - 1, 5, 3, '#f0782a'); rect(X - 1, Y - 1, 1, 3, '#fbf7ee'); rect(X + 1, Y - 1, 1, 3, '#fbf7ee'); px(X - 3 * d, Y, C('#f0782a')); } const q = S2(.7, .7, .62); ellipse(q[0], q[1] - 2, 6, 3, '#f29ac0'); for (let i = -5; i <= 5; i += 2) px(q[0] + i, q[1] - 5 - ((i + f) & 1), C('#f8c8e0')); }
    else if (k === 2) { const X = s[0] + (f ? 1 : -1), Y = s[1] + 2; ellipse(X, Y - 3, 5, 4, '#c8503a'); for (let i = -2; i <= 2; i++) { const L = 5 + ((i + f) & 1) * 2; for (let j = 0; j < L; j++) px(X + i * 2 + Math.round(Math.sin(j / 2 + i) * 1.2), Y + j, C(j % 2 ? '#e8846a' : '#c8503a')); } px(X - 2, Y - 3, C(AQ.foam)); px(X + 2, Y - 3, C(AQ.foam)); }
    else { for (const [dx, dy] of [[-4, -5], [3, 1], [-1, 8], [5, -8]]) { const X = s[0] + dx, Y = s[1] + dy + ((f + dx) & 1); ellipse(X, Y, 2, 1, '#f8c8e8'); px(X - 1, Y + 2, C('#f29ac0')); px(X + 1, Y + 2 + (f & 1), C('#f29ac0')); } }
    bubbleS(.95, .7, .7, 4, 3 + f); });
  cyl(.7, .7, 2.2, .7, .16, AQ.navy);
}
function photospot(p) {
  const k = p.k || 'jaws';
  if (k === 'jaws') { box(0, .2, 0, 2.2, .5, .12, AQ.navy, { ol: false }); const cx = 1.1, y = .45; for (let a = 0; a <= 20; a++) { const t = Math.PI * a / 20, x = cx - Math.cos(t) * 1.02, z = .12 + Math.sin(t) * 1.9, s = S2(x, y, z); ellipse(s[0], s[1], 3, 3, '#e8e0cc'); } for (let a = 1; a < 20; a++) { const t = Math.PI * a / 20, x = cx - Math.cos(t) * .86, z = .12 + Math.sin(t) * 1.66, s = S2(x, y + .01, z); rect(s[0] - 1, s[1], 2, 3, '#fbf7ee'); px(s[0], s[1] + 3, C('#fbf7ee')); } txt('PHOTO', 1.1, .71, .12, AQ.aqua, 1); }
  else { qz(0, 1.4, 0, 1, .02, AQ.navy); qz(.1, 1.3, .1, .9, .03, AQ.aqua, AQ.navy); const s = S2(.7, .5, .03); rect(s[0] - 4, s[1] - 2, 9, 5, '#2a2733'); rect(s[0] - 1, s[1] - 1, 3, 3, '#bfeaf6'); rect(s[0] - 3, s[1] - 3, 3, 1, '#2a2733'); }
}
function quiz() { box(.15, .1, 0, .2, .2, .9, '#5a6670', { ol: false }); box(0, 0, .9, .9, .5, .5, AQ.orange, { l: '#e88a2a' }); lit(() => { txt('FISH', .45, .51, 1.32, AQ.navy, 1); txt('QUIZ', .45, .51, 1.18, AQ.navy, 1); }); fishS(.45, .52, 1.0, 7, AQ.navy, { dir: 1 }); }
function feeder() { box(.1, .1, 0, .5, .4, .9, AQ.coral, { l: '#d8604a' }); cylP(.35, .3, .9, .22, .4, k => (k > .2 ? '#a8dcec' : '#cff0f8'), { t: '#e8fbff' }); const s = S2(.35, .3, 1); for (let i = 0; i < 6; i++) px(s[0] - 3 + i, s[1] + (i & 1), C('#b8794a')); txt('FOOD', .35, .51, .62, AQ.foam, 1); }
function plant(p) { const r = rng(p.seed || 1); cyl(.4, .4, 0, .3, .45, AQ.navy); for (let i = 0; i < 7; i++) { const a = i / 7 * 6.28 + r(), L = .5 + r() * .5; for (let t = 0; t < 8; t++) { const k = t / 8, s = S2(.4 + Math.cos(a) * L * k, .4 + Math.sin(a) * L * k, .5 + Math.sin(k * 2.2) * (1 + r() * .1)); rect(s[0], s[1], 2, 2, t > 5 ? '#6fb85a' : '#3f8a4a'); } } }
function door(p) { qy(0, 1.3, .1, 0, 2.2, '#5a6a78'); qy(.1, 1.2, .11, 0, 2.1, p.c || '#3f7a94'); rect(...S2(1, .12, 1.05), 2, 2, '#e8d48a'); lit(() => signY(p.name || 'STAFF', .05, 1.25, .12, 2.25, 2.55, AQ.navy, AQ.foam, { frame: false })); const s = S2(.65, .12, 1.6); ellipse(s[0], s[1], 4, 4, '#bfeaf6'); ellipse(s[0], s[1], 3, 3, '#2f90c0'); }
function stairs(p) {
  qz(0, 2, 0, 1.6, .02, '#0c1a2c'); for (let i = 0; i < 5; i++) qz(.1, 1.9, .1 + i * .28, .38 + i * .28, .03, i % 2 ? '#1c3450' : '#24406a'); lit(() => { for (let i = 0; i < 5; i++) lw([.1, .38 + i * .28, .03], [1.9, .38 + i * .28, .03], '#58c4dc'); });
  for (const x of [0, 1.9]) { box(x, 0, 0, .1, 1.6, .9, AQ.steel, { ol: false, l: '#aebcc2' }); } box(0, 0, 0, 2, .1, 1.9, AQ.navy, { ol: false }); lit(() => signY(p.name || 'THE DEEP', .05, 1.95, .1, 1.35, 1.8, AQ.navy, AQ.aqua, { frame: false })); const s = S2(1, .11, 1.1); for (let i = 0; i < 4; i++) rect(s[0] - 3 + i, s[1] + i * (p.up ? -1 : 1) + (p.up ? 3 : 0), 7 - i * 2, 1, AQ.orange);
}
function shelf(p) {
  const w = p.w || 3, k = p.kind || 'plush', r = rng(w * 7 + k.length);
  box(0, 0, 0, w, .5, 2, '#e8dcc0', { l: '#d8ccb0', r: '#b8ac90', t: '#f4ead0' }); for (let i = 0; i < 3; i++) { const z = .25 + i * .6; qy(.08, w - .08, .5, z, z + .5, '#3a5a74'); qy(.08, w - .08, .5, z - .05, z, '#f4ead0');
    for (let x = .25; x < w - .2; x += k === 'books' ? .16 : .42) { if (k === 'plush') { const c = ['#7fb0c8', '#f29ac0', '#5a5a66', '#f29a3a', '#9a7a5a', '#8ad0b0'][Math.floor(r() * 6)]; ball(x, .5, z + .14, .13, c, { ol: false }); ball(x + .1, .5, z + .26, .07, c, { ol: false }); } else if (k === 'books') { const c = ['#2f6f9a', '#f0735a', '#f2c24a', '#1f8f9a', '#eef3f2'][Math.floor(r() * 5)]; qy(x, x + .13, .51, z, z + .3 + r() * .12, c); } else { const c = ['#eef3f2', '#58c4dc', '#f0735a', '#16324f'][Math.floor(r() * 4)]; const s = S2(x, .51, z + .2); rect(s[0], s[1], 4, 4, c); px(s[0] + 4, s[1] + 1, C(c)); px(s[0] + 5, s[1] + 2, C(c)); } } }
}
function plushbin() { cyl(.6, .6, 0, .55, .55, AQ.coral, { t: '#d8604a' }); const r = rng(3); for (let i = 0; i < 9; i++) { const a = r() * 6.28, d = r() * .35; ball(.6 + Math.cos(a) * d, .6 + Math.sin(a) * d, .6 + r() * .12, .14, ['#7fb0c8', '#f29ac0', '#5a5a66', '#f29a3a', '#8ad0b0'][i % 5], { ol: false }); } }
// ---- the tunnel + sea bed
function rib(p) { const sp = p.span || 3, h = p.h || 2.6, c = '#c8d4da'; for (let a = 0; a < 24; a++) { const t0 = Math.PI * a / 24, t1 = Math.PI * (a + 1) / 24, y0 = sp / 2 - Math.cos(t0) * sp / 2, y1 = sp / 2 - Math.cos(t1) * sp / 2, z0 = Math.sin(t0) * h, z1 = Math.sin(t1) * h; fq([[.16, y0, z0], [.16, y1, z1], [.16, y1, z1 + .14], [.16, y0, z0 + .14]], a > 15 ? '#8a98a2' : c); lw([.16, y0, z0], [.16, y1, z1], '#4a5a66'); } lit(() => { for (const a of [5, 12, 19]) { const t = Math.PI * a / 24, s = S2(.17, sp / 2 - Math.cos(t) * sp / 2, Math.sin(t) * h + .03); rect(s[0], s[1], 2, 2, '#bff0ff'); } }); }
function curb(p) { const l = p.len || 4; box(0, 0, 0, l, .2, .32, '#16324f', { ol: false, t: '#24486c' }); lit(() => { for (let x = .25; x < l; x += .5) { const s = S2(x, .2, .2); rect(s[0], s[1], 2, 1, '#58c4dc'); } }); }
function glint(p) { const l = p.len || 4, h = p.h || 2.4; for (let x = .3; x < l; x += 1.25) for (let k = 0; k < 2; k++) { const zz = h * (.5 + k * .28) + (hash2(Math.floor(x * 4), k, 2) - .5) * .5, L = .5 + k * .2; fq([[x, .05, zz], [x + .1, .05, zz], [x + .1 + L * .3, .05, zz + L], [x + L * .3, .05, zz + L]], '#d8f6ff', 'glass'); } }
function rock(p) { const s = p.s || 1, r = rng(p.seed || 1); ball(.6 * s, .6 * s, .22 * s, .55 * s, p.c || '#4a5c74', p.c ? { squash: .6 } : { squash: .6, t: '#6a80a0', d: '#2f3c54' }); if (s > .8) ball(.25 * s, .8 * s, .12 * s, .3 * s, '#405068', { squash: .6, d: '#2a364a' }); if (p.grow) lit(() => { coralS(.6 * s, .7 * s, .4 * s, Math.floor(r() * 6), p.seed); if (s > 1) coralS(.9 * s, .5 * s, .3 * s, Math.floor(r() * 6), p.seed + 1); }); }
function coral(p) { lit(() => { coralS(.4, .4, 0, p.k || 0, p.seed || 1); if (p.big) { coralS(.75, .3, 0, (p.k || 0) + 2, 5); coralS(.15, .6, 0, (p.k || 0) + 4, 7); } }); }
function kelp(p) { const h = p.h || 3; lit(() => { for (let i = 0; i < 3; i++) kelpS(.2 + i * .25, .3 + (i & 1) * .2, 0, Math.round((h - i * .4) * 16), (p.seed || 1) + i * 2 + (p.frame || 0) * .45, i % 2 ? '#4f8a4a' : '#6a9a3a'); }); }
function wreck() {
  const c = '#5a4a44', d = '#3f3430'; fq([[0, .4, 0], [4.4, .4, 0], [4.9, .4, 1.3], [.3, .4, 1.0]], d); box(.2, .4, 0, 4.4, 1.3, 1, c, { l: PAT.planks(c, 5), r: d, t: '#4a3c38', ol: false }); fq([[4.6, .4, 0], [5.6, 1.05, .9], [4.6, 1.7, 0]], d); fq([[4.6, .4, 1], [5.6, 1.05, 1.5], [4.6, 1.7, 1], [4.6, 1.05, 1]], c);
  for (const x of [1, 2, 3]) { const s = S2(x, 1.71, .55); ellipse(s[0], s[1], 3, 3, '#1c1820'); } box(2.1, .9, 1, .22, .22, 2.6, d, { ol: false }); lw([2.2, 1, 3.2], [3.4, 1, 2.6], d); lw([2.2, 1, 3.2], [1, 1, 2.7], d); fq([[2.25, 1.02, 3.4], [3, 1.02, 3.1], [2.25, 1.02, 2.7]], '#7a6a5a', 'glass');
  lit(() => { coralS(.8, 1.75, .1, 2, 3); coralS(3.6, 1.75, .1, 1, 4); kelpS(4.3, 1.5, 1, 20, 3); starS(1.6, 1.2, 1.02, '#f08a3a'); });
}
function anchor() { const s = S2(.6, .5, 0), c = '#5a6a7a'; rect(s[0], s[1] - 18, 2, 18, c); rect(s[0] - 4, s[1] - 16, 10, 2, c); ellipse(s[0] + 1, s[1] - 20, 3, 3, c); ellipse(s[0] + 1, s[1] - 20, 1, 1, '#16324f'); for (let i = 0; i < 7; i++) { px(s[0] - i, s[1] - 1 - (i > 4 ? i - 4 : 0), C(c)); px(s[0] + 1 + i, s[1] - 1 - (i > 4 ? i - 4 : 0), C(c)); px(s[0] - i, s[1] - (i > 4 ? i - 4 : 0), C(c)); px(s[0] + 1 + i, s[1] - (i > 4 ? i - 4 : 0), C(c)); } }
function chest(p) { box(0, 0, 0, .9, .6, .4, '#7a5234', { l: PAT.planks('#7a5234', 4) }); qy(0, .9, .6, .14, .2, '#c8a050'); if (p.frame) { fq([[0, 0, .4], [.9, 0, .4], [.9, 0, .9], [0, 0, .9]], '#5e3c28'); lit(() => { const s = S2(.45, .3, .45); rect(s[0] - 4, s[1] - 2, 9, 3, '#f2c24a'); px(s[0] - 2, s[1] - 4, C('#fff4c8')); px(s[0] + 3, s[1] - 5, C('#fff4c8')); bubbleS(.45, .3, .6, 5, 2); }); } else box(-.02, -.02, .4, .94, .64, .16, '#8a6240', { ol: false }); }
// ---- harbor deck
function deckpool(p) {
  const w = p.w || 8, d = p.d || 5, ot = (p.kind || 'otter') === 'otter';
  box(0, 0, 0, w, d, .7, ot ? '#8a94a0' : '#7d8792', { l: PAT.stone('#7d8792'), r: PAT.stone('#646e7a'), t: '#a8b2bc' }); waterTop(.3, w - .3, .9, d - .3, .64, ot ? '#3f9ab4' : '#2f86a8');
  box(.3, .3, .5, w - .6, 1.1, .5, AQ.rock, { l: PAT.stone(AQ.rock), t: '#98a2ac', ol: false }); for (let x = .6; x < w - 1; x += 1.7) ball(x + .4, .7, 1.05, .45, x % 2 ? AQ.rock : '#8a94a0', { squash: .55 });
  if (ot) { kelpS(w - 1.2, d - .9, .66, 9, 3); kelpS(1.2, d - 1.3, .66, 7, 5); } else { box(w / 2 - 1, d / 2 - .2, .5, 2, 1.2, .32, '#98a2ac', { ol: false, t: '#b8c2cc' }); }
  qy(0, w, d, .7, 1.25, '#cff0f8', 'glass'); qx(w, 0, d, .7, 1.25, '#bfe4f0', 'glass'); lw([0, d, 1.25], [w, d, 1.25], AQ.frame); lw([w, 0, 1.25], [w, d, 1.25], AQ.frame); for (let x = 2; x < w; x += 2) lw([x, d, .7], [x, d, 1.25], AQ.frame);
  signY(ot ? 'SEA OTTERS' : 'HARBOR SEALS', .3, 3.4, d, .2, .55, AQ.navy, AQ.foam, { frame: false });
}
function stand(p) { const w = p.w || 6; for (let i = 0; i < 3; i++) { box(0, i * .8, 0, w, .8, .45 + i * .4, AQ.wood, { l: PAT.planks(AQ.wood, 6), r: AQ.woodD, t: (x, y) => (Math.floor(x * 2) % 2 ? '#c8976a' : '#c08e62') }); } }
function scope() { cyl(.3, .3, 0, .12, 1.1, '#5a6670'); box(.1, .1, 1.1, .4, .6, .3, AQ.coral, { r: '#c8503a' }); const s = S2(.3, .7, 1.25); ellipse(s[0], s[1], 2, 2, '#bfeaf6'); }
function bucket() { cyl(.25, .25, 0, .2, .35, AQ.steel); const s = S2(.25, .25, .37); fishS(.25, .25, .4, 6, '#9fb4c4', { dir: 1 }); px(s[0] - 5, s[1] - 2, C('#5a6670')); px(s[0] + 5, s[1] - 2, C('#5a6670')); }
function rail(p) { const l = p.len || 4; for (let x = 0; x <= l; x += 1) box(Math.min(x, l - .1), 0, 0, .1, .1, .9, AQ.steel, { ol: false }); lw([0, .1, .9], [l, .1, .9], AQ.frame); lw([0, .1, .5], [l, .1, .5], AQ.steel); }
function lamp() { cyl(.2, .2, 0, .06, 2.4, '#5a6670'); lit(() => ball(.2, .2, 2.5, .2, '#ffe9b0', { ol: false })); }
// ---- behind the scenes
function rehab(p) {
  const st = p.stage || 0; cylP(1.7, 1.7, 0, 1.7, .85, (k, v) => (v % 9 === 0 ? '#3f86bc' : k > .2 ? '#3f86bc' : '#58a0d4'), { t: '#8fc0e0' });
  const s = S2(1.7, 1.7, .85); ellipse(s[0], s[1], 34, 17, '#3fa6c8'); for (let i = 0; i < 9; i++) { const a = i * .7, X = s[0] + Math.round(Math.cos(a) * 20), Y = s[1] + Math.round(Math.sin(a) * 9); rect(X, Y, 4, 1, '#9fe0f0'); }
  box(3.1, .6, 0, .35, .5, 1.3, AQ.steel, { ol: false }); lit(() => { const q = S2(3.3, 1.11, 1.1); rect(q[0] - 2, q[1], 5, 3, st >= 3 ? '#8fe0a8' : '#f2c24a'); });
  if (st >= 3) txt('READY!', 1.7, 3.42, .5, AQ.foam, 1);
}
function labbench(p) {
  const k = p.kind || 'scope'; steel(0, 0, 0, 2.4, .7, .95, '#d8e0e4', { t: '#eef3f2' }); for (const x of [.1, 1.25]) qy(x, x + 1.05, .7, .1, .8, '#b9c6cc');
  if (k === 'scope') { box(.4, .2, .97, .3, .3, .1, '#3a3440', { ol: false }); box(.5, .28, 1.07, .1, .1, .4, '#3a3440', { ol: false }); box(.4, .22, 1.4, .3, .12, .1, '#5a6670', { ol: false }); for (let i = 0; i < 4; i++) cyl(1.2 + i * .25, .3, .97, .07, .22 + (i & 1) * .1, ['#8fe0a8', '#f29ac0', '#9fdcf0', '#f2c24a'][i], { ol: false }); }
  else { for (let i = 0; i < 2; i++) { cylP(.5 + i * 1.2, .35, .97, .26, .5, (kk, v) => (kk > .2 ? '#2f86b4' : '#58b4d8'), { t: '#9fdcf0' }); lit(() => { const s = S2(.5 + i * 1.2, .35, 1.25); for (const [dx, dy] of [[-3, 0], [2, -4], [1, 3]]) { ellipse(s[0] + dx, s[1] + dy, 1, 1, '#f8c8e8'); } }); } txt('JELLY NURSERY', 1.2, .71, .6, AQ.navy, 1); }
}
function rack(p) { const f = p.frame || 0; steel(0, 0, 0, 3, .6, 2.1, '#c8d4da'); for (let i = 0; i < 2; i++) for (let j = 0; j < 3; j++) { const x = .12 + j * .96, z = .2 + i * .95; qy(x, x + .82, .6, z, z + .75, '#2f86b4'); lit(() => { qy(x + .04, x + .78, .61, z + .04, z + .71, i ? '#3f9ec8' : '#2f8ab0'); fishS(x + .25 + ((f + j) & 1) * .12, .62, z + .4, 5, ['#f2c24a', '#f0735a', '#c8d4da'][j], { dir: (j + i + f) & 1 ? 1 : -1 }); fishS(x + .6, .62, z + .25, 4, ['#f29ac0', '#8fe0a8', '#f29a3a'][j], { dir: (j + f) & 1 ? -1 : 1 }); qy(x + .04, x + .78, .62, z + .04, z + .1, AQ.sand); }); } }
function sleepbag(p) { const c = p.c || AQ.coral; const s = S2(.9, .4, .05); qz(.1, 1.8, .1, .7, .04, c, dk(c, .15)); qz(.1, .5, .1, .7, .06, '#f4f0e8'); ellipse(s[0] - 9, s[1] - 2, 3, 2, '#3a3440'); }

export default [
  A('desk', ['counter'], p => [p.w || 4, .7, 1.05], desk, { use: p => ({ x: (p.w || 4) / 2, y: 1.2 }), staff: p => ({ x: (p.w || 4) / 2, y: -.45, dir: 1 }), vb: p => [-.1, -.1, 0, (p.w || 4) + .1, .9, 1.7], variants: [{ kind: 'ticket' }, { kind: 'shop', w: 3 }, { kind: 'cafe' }, { kind: 'prep', w: 3 }] }),
  A('bench', ['aqua_bench'], [2, .7, .46], bench, { seats: [{ x: .55, y: .35, z: .45, dir: 3 }, { x: 1.45, y: .35, z: .45, dir: 3 }], use: { x: 1, y: 1.15 }, variants: [{}, { c: AQ.coral }] }),
  A('sign', ['sign'], p => [p.w || 3, .2, .6], sign, { solid: false, vb: p => [0, 0, 0, p.w || 3, .3, 1.7], variants: [{ name: 'LOCAL WATERS', w: 3.6 }, { name: 'PENGUIN COVE', w: 3.6, c: '#2f6f78' }, { name: 'THE DEEP', c: '#0c1a2c', fg: AQ.aqua }] }),
  A('plaque', ['aqua_plaque'], [.56, .35, 1.02], plaque, { use: { x: .28, y: .85 }, variants: [{}, { c: AQ.tealD }] }),
  A('board', ['aqua_board'], p => [p.kind === 'plaque' ? 1.2 : p.kind === 'shows' || !p.kind ? 3.8 : 2.4, p.kind === 'plaque' ? .4 : .2, p.kind === 'plaque' ? .85 : 2.9], board, { use: p => ({ x: p.kind === 'plaque' ? .6 : p.kind === 'shows' || !p.kind ? 1.9 : 1.2, y: .9 }), variants: [{ kind: 'shows' }, { kind: 'adopt', names: ['PEBBLE', 'SKIPPER'] }, { kind: 'sketch', n: 3 }, { kind: 'chart', n: 2, name: 'JUNIPER' }, { kind: 'plaque' }] }),
  A('touchpool', ['aqua_touchpool'], p => [p.w || 5, p.d || 3, .72], touchpool, { vb: p => [-.1, -.1, 0, (p.w || 5) + .1, (p.d || 3) + .1, 1.2] }),
  A('lagoon', ['aqua_lagoon'], p => [p.w || 7, p.d || 4, .62], lagoon, { vb: p => [-.1, -.1, 0, (p.w || 7) + .1, (p.d || 4) + .1, 1.4] }),
  A('penguinrock', ['aqua_penguins'], p => [p.w || 13, 4.6, .5], penguinrock, { vb: p => [-.1, -.1, 0, (p.w || 13) + .2, 4.8, 2.2], use: p => ({ x: (p.w || 13) / 2, y: 5.2 }) }),
  A('icewall', ['wall'], p => [p.w || 13, .1, p.h || 3.6], icewall, { wall: true, solid: false, variants: [{ w: 8 }] }),
  A('partition', ['wall'], p => [p.w || 4, .3, p.h || 3], partition, { variants: [{}, { w: 6, wave: 1 }] }),
  A('tankwall', ['wall'], p => [p.w || 9, .8, p.h || 3], tankwall),
  A('plinth', [], p => [(p.r || 2.6) * 2, (p.r || 2.6) * 2, .5], plinth, { vb: p => [-.2, -.2, 0, (p.r || 2.6) * 2 + .2, (p.r || 2.6) * 2 + .2, .7] }),
  A('coltank', ['aqua_coltank'], [1.4, 1.4, 2.36], coltank, { vb: [-.1, -.1, 0, 1.5, 1.5, 2.5], variants: [0, 1, 2, 3].map(k => ({ k })) }),
  A('photospot', ['aqua_photo'], p => (p.k === 'jaws' || !p.k ? [2.2, .7, .12] : [1.4, 1, .04]), photospot, { solid: false, vb: p => (p.k === 'jaws' || !p.k ? [-.3, 0, 0, 2.5, .9, 2.3] : [0, 0, 0, 1.4, 1, .2]), use: p => (p.k === 'jaws' || !p.k ? { x: 1.1, y: .55 } : { x: .7, y: .5 }), variants: [{ k: 'jaws' }, { k: 'tunnel' }] }),
  A('quiz', ['aqua_quiz'], [.9, .5, 1.4], quiz, { use: { x: .45, y: 1 } }),
  A('feeder', ['aqua_feeder'], [.7, .5, 1.3], feeder, { use: { x: .35, y: 1 } }),
  A('plant', ['plant'], [.8, .8, 1.6], plant, { vb: [-.6, -.6, 0, 1.6, 1.6, 2], variants: [{ seed: 1 }, { seed: 4 }] }),
  A('door', ['aqua_door'], [1.3, .12, 2.6], door, { wall: true, solid: false, variants: [{ name: 'STAFF' }] }),
  A('stairs', ['aqua_stairs'], [2, 1.6, .1], stairs, { solid: false, vb: [-.1, -.1, 0, 2.1, 1.7, 2], variants: [{ name: 'THE DEEP' }, { name: 'UP', up: 1 }] }),
  A('shelf', ['shelf'], p => [p.w || 3, .5, 2], shelf, { use: p => ({ x: (p.w || 3) / 2, y: 1 }), variants: [{ kind: 'plush' }, { kind: 'books' }, { kind: 'mugs' }] }),
  A('plushbin', ['shelf'], [1.2, 1.2, .8], plushbin),
  A('rib', [], p => [.2, p.span || 3, .1], rib, { solid: false, vb: p => [0, -.1, 0, .4, (p.span || 3) + .1, (p.h || 2.6) + .3] }),
  A('curb', [], p => [p.len || 4, .2, .32], curb),
  A('glint', [], p => [p.len || 4, .1, .1], glint, { solid: false, vb: p => [0, 0, 0, (p.len || 4) + .6, .2, (p.h || 2.4) + .6] }),
  A('rock', ['seabed'], p => [1.2 * (p.s || 1), 1.2 * (p.s || 1), .6 * (p.s || 1)], rock, { vb: p => [-.2, -.2, 0, 1.5 * (p.s || 1), 1.5 * (p.s || 1), 1.6 * (p.s || 1)], variants: [{ seed: 1 }, { seed: 2, s: 1.6, grow: 1 }] }),
  A('coral', ['seabed'], [.8, .8, .5], coral, { vb: [-.4, -.4, 0, 1.4, 1.4, 1.2], variants: [0, 1, 2].map(k => ({ k, big: k === 1 })) }),
  A('kelp', ['seabed'], [.8, .8, .3], kelp, { solid: false, vb: p => [-.5, -.5, 0, 1.4, 1.4, (p.h || 3) + .2], variants: [{ h: 3 }, { h: 4, frame: 1 }] }),
  A('wreck', ['seabed'], [5.6, 2.1, 1.5], wreck, { vb: [-.2, -.2, 0, 5.9, 2.3, 3.9] }),
  A('anchor', ['seabed'], [1.2, 1, .4], anchor, { vb: [-.2, -.2, 0, 1.4, 1.2, 1.6] }),
  A('chest', ['seabed'], [.9, .6, .56], chest, { vb: [-.1, -.3, 0, 1, .8, 1.4], variants: [{ frame: 0 }, { frame: 1 }] }),
  A('deckpool', ['aqua_deckpool'], p => [p.w || 8, p.d || 5, .7], deckpool, { vb: p => [-.1, -.1, 0, (p.w || 8) + .1, (p.d || 5) + .1, 1.7], variants: [{ kind: 'otter' }, { kind: 'seal' }] }),
  A('stand', ['aqua_stand'], p => [p.w || 6, 2.4, .45], stand, { vb: p => [-.1, -.1, 0, (p.w || 6) + .1, 2.5, 1.5], seats: p => { const o = []; for (let i = 0; i < 3; i++) for (let x = .6; x < (p.w || 6); x += 1) o.push({ x, y: i * .8 + .4, z: .45 + i * .4, dir: 3 }); return o; }, use: p => ({ x: (p.w || 6) / 2, y: -.5 }) }),
  A('prepbench', ['aqua_prep'], [3, .7, 1.05], () => desk({ kind: 'prep', w: 3 }), { use: { x: 1.5, y: 1.2 }, vb: [-.1, -.1, 0, 3.1, .9, 1.7] }),
  A('scope', ['aqua_scope'], [.6, .8, 1.4], scope, { use: { x: .3, y: -.4 } }),
  A('bucket', [], [.5, .5, .4], bucket, { solid: false }),
  A('rail', [], p => [p.len || 4, .1, .9], rail),
  A('lamp', [], [.4, .4, 2.7], lamp, { light: { x: .2, y: .2, z: 0, r: 4, c: '#ffe9b0' } }),
  A('rehab', ['aqua_rehab'], [3.5, 3.4, .85], rehab, { vb: [-.1, -.1, 0, 3.7, 3.6, 1.5], use: { x: 1.7, y: 3.9 }, variants: [0, 3].map(stage => ({ stage })) }),
  A('labbench', ['aqua_lab'], [2.4, .7, .97], labbench, { vb: [-.1, -.1, 0, 2.5, .9, 1.8], use: { x: 1.2, y: 1.2 }, variants: [{ kind: 'scope' }, { kind: 'nursery' }] }),
  A('rack', ['aqua_rack'], [3, .6, 2.1], rack, { use: { x: 1.5, y: 1.1 }, variants: [{ frame: 0 }, { frame: 1 }] }),
  A('sleepbag', [], [1.9, .8, .08], sleepbag, { solid: false, variants: [{}, { c: '#3b6fd0' }] }),
];
