// The Orpheum's films (private helper of shows.js): four ~60 s animated pixel shorts drawn in code onto a 112x64 canvas.
// drawFilm(film, ctx, t) paints the frame for film time t (seconds). Each film: { id, title, blurb, poster, price, minutes, score, dur, cues: [[t, kind]], scenes: [[t0, t1, fn(lt, t)]] }.
import { render, textS, textW } from '../engine/raster.js';
import { toSprite } from '../engine/sprites.js';
export const FW = 112, FH = 64;
let g = null; const W = FW, H = FH, TX = new Map();
const r = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
const h1 = (i, s = 0) => { const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return x - Math.floor(x); };
const cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), pr = (t, a, b) => cl((t - a) / (b - a));
function txt(s, c) { const k = s + c; let sp = TX.get(k); if (!sp) { sp = toSprite(render([0, 0, textW(s) + 1, 6], () => textS(s, 0, 0, c), null, 1)); TX.set(k, sp); } return sp; }
/** text; cx = centre x (or left x when left = true) */
const T = (s, cx, y, c = '#f4fbfc', left) => { const sp = txt(s, c); g.drawImage(sp.c, Math.round(left ? cx : cx - textW(s) / 2) + sp.x, y + sp.y); };
const card = (s, c = '#f4fbfc', bg = '#0a0a12') => { r(0, H - 11, W, 11, bg); T(s, W / 2, H - 8, c); };
const bands = (cols, y0 = 0, y1 = H) => { const hh = (y1 - y0) / cols.length; cols.forEach((c, i) => r(0, y0 + i * hh, W, Math.ceil(hh), c)); };
const stars = (n, s, t) => { for (let i = 0; i < n; i++) r(h1(i, s) * W, h1(i, s + 1) * 36, 1, 1, (Math.floor(t * 2 + i) % 7) ? '#f4fbfc' : '#7a84a8'); };
const rain = (t, n, c) => { for (let i = 0; i < n; i++) r(((h1(i, 3) * 140 - t * 22) % 140 + 140) % 140 - 14, (h1(i, 4) * H + t * 95) % H, 1, 3, c); };
const water = (y0, t, c, c2) => { r(0, y0, W, H - y0, c); for (let i = 0; i < 16; i++) r((h1(i, 8) * W + Math.sin(t * 1.5 + i) * 3), y0 + 1 + Math.floor(h1(i, 7) * (H - y0 - 2)), 3 + i % 3, 1, c2); };
const skyline = (y, s, c, scroll = 0, win) => { for (let i = 0; i < 16; i++) { const bw = 6 + Math.floor(h1(i, s) * 6), x = (((i * 9 - scroll) % 144) + 144) % 144 - 16, bh = 6 + Math.floor(h1(i, s + 2) * 16); r(x, y - bh, bw, bh, c); if (win) for (let j = 0; j < 6; j++) if (h1(i * 7 + j, s + 3) > .5) r(x + 1 + (j % 2) * 3, y - bh + 2 + (j >> 1) * 4, 1, 1, win); } };
const tri = (a, b, c, col, al = 1) => { g.globalAlpha = al; g.fillStyle = col; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineTo(c[0], c[1]); g.fill(); g.globalAlpha = 1; };
const disc = (x, y, rad, c) => { for (let j = -rad; j <= rad; j++) { const w = Math.round(Math.sqrt(rad * rad - j * j)); r(x - w, y + j, w * 2 + 1, 1, c); } };
/** little person, feet at (x, y). o: { walk: phase, hat, skin, legs, sit, arm: raised } */
function man(x, y, c, o = {}) {
  const f = o.walk !== undefined ? Math.floor(o.walk * 7) % 2 : 0, sk = o.skin || '#e8c0a0', lg = o.legs || '#1a1a24'; x = Math.round(x); y = Math.round(y);
  if (o.sit) { r(x - 1, y - 9, 3, 5, c); r(x - 1, y - 12, 3, 3, sk); r(x - 1, y - 4, 4, 1, lg); r(x + 2, y - 4, 1, 3, lg); }
  else { r(x - 1, y - 8, 3, 5, c); r(x - 1, y - 11, 3, 3, sk); r(x - 1, y - 3, 1, 3 - f, lg); r(x + 1, y - 3, 1, 2 + f, lg); }
  const hy = o.sit ? y - 13 : y - 12; if (o.hat) { r(x - 2, hy, 5, 1, o.hat); r(x - 1, hy - 1, 3, 1, o.hat); } if (o.arm) { r(x + 2, y - 10, 1, 3, c); r(x + 2, y - 11, 1, 1, sk); }
}
function lighthouse(x, y, t, on) { r(x, y - 22, 5, 22, '#e8e4dc'); r(x, y - 15, 5, 4, '#c0392b'); r(x - 1, y - 25, 7, 3, '#2a2a34'); r(x + 1, y - 24, 3, 2, on ? '#fff2a0' : '#6a6a74'); r(x + 1, y - 27, 3, 2, '#c0392b'); if (on) { const a = Math.sin(t * .9) * .5 + .1; tri([x + 3, y - 23], [x + 3 + Math.cos(a - .12) * 120, y - 23 + Math.sin(a - .12) * 120], [x + 3 + Math.cos(a + .12) * 120, y - 23 + Math.sin(a + .12) * 120], '#fff2a0', .28); } }
function ferry(x, y, lit) { r(x, y - 5, 34, 5, '#e8e4dc'); r(x + 2, y - 1, 30, 1, '#c0392b'); r(x + 5, y - 10, 20, 5, '#d8d4cc'); for (let i = 0; i < 5; i++) r(x + 7 + i * 4, y - 8, 2, 2, lit ? '#ffd870' : '#5a7a9a'); r(x + 13, y - 16, 5, 6, '#2a2a34'); r(x + 13, y - 14, 5, 1, '#c0392b'); }
function gull(x, y, open) { r(x, y - 3, 4, 3, '#f4f4f0'); r(x + 3, y - 5, 2, 2, '#f4f4f0'); r(x + 5, y - 4, open ? 2 : 1, 1, '#f2a040'); if (open) r(x + 5, y - 3, 1, 1, '#f2a040'); r(x, y - 3, 2, 1, '#9aa4b0'); r(x + 4, y - 5, 1, 1, '#1a1a24'); }
function pigeon(x, y, f, pretzel, fly) { x = Math.round(x); y = Math.round(y); r(x, y - 4, 6, 4, '#8a94a4'); r(x + 5, y - 7, 3, 3, '#6a7484'); r(x + 5, y - 5, 3, 1, '#5aa890'); r(x + 8, y - 6, 1, 1, '#f2a040'); r(x + 6, y - 7, 1, 1, '#f4fbfc'); if (fly) { if (f) r(x + 1, y - 8, 4, 4, '#a4aebc'); else r(x + 1, y - 3, 4, 4, '#a4aebc'); r(x - 2, y - 3, 2, 1, '#6a7484'); } else { r(x + 1, y, 1, 2, '#f2a040'); r(x + 3, y, 1, 2 - f, '#f2a040'); } if (pretzel) { r(x + 8, y - 5, 4, 4, '#a5652a'); r(x + 9, y - 4, 2, 2, fly ? '#00000000' : '#00000000'); r(x + 9, y - 4, 1, 1, '#6ac4f0'); r(x + 10, y - 3, 1, 1, '#6ac4f0'); } }
function train(x, y, lit, n = 3) { for (let k = 0; k < n; k++) { const cx = x + k * 23; r(cx, y - 8, 22, 8, '#e8eef0'); r(cx, y - 3, 22, 2, '#2fb0a0'); for (let i = 0; i < 4; i++) r(cx + 2 + i * 5, y - 7, 3, 3, lit ? '#ffe08a' : '#3a4a5a'); r(cx + 2, y, 3, 1, '#2a2a34'); r(cx + 16, y, 3, 1, '#2a2a34'); } }
const heart = (x, y, c = '#ff5a7a') => { r(x - 2, y, 2, 2, c); r(x + 1, y, 2, 2, c); r(x - 2, y + 1, 5, 2, c); r(x - 1, y + 3, 3, 1, c); r(x, y + 4, 1, 1, c); };
const title = (a, b, c1, c2) => { T(a, W / 2, 24, c1); if (b) T(b, W / 2, 36, c2 || '#8a94b8'); };
const theEnd = (lt, a, b, bg = '#0a0a12') => { r(0, 0, W, H, bg); T('THE END', W / 2, 20, '#f4fbfc'); if (lt > 1.5) T(a, W / 2, 34, '#c8b060'); if (lt > 3 && b) T(b, W / 2, 44, '#8a94b8'); };

/* ------------------------------------------------------------------ 1. The Last Ferry (noir) */
const pier = (t, x0 = 28) => { r(0, 0, W, H, '#0c1224'); stars(14, 2, t); water(44, t, '#0a1020', '#24345a'); r(x0, 44, W - x0, 4, '#4a3a2c'); for (let x = x0 + 2; x < W; x += 12) r(x, 48, 2, 10, '#2a2018'); };
const lamp = (x, y) => { r(x, y - 22, 1, 22, '#2a2a34'); r(x - 2, y - 23, 5, 2, '#2a2a34'); r(x - 1, y - 21, 3, 1, '#ffe08a'); tri([x, y - 20], [x - 10, y], [x + 11, y], '#ffe08a', .22); };
const DET = { hat: '#2a2a34', skin: '#d8b090' };
const ferryFilm = { id: 'ferry', title: 'The Last Ferry', blurb: 'Noir. Midnight on the pier, a missing foghorn, and a detective with one lead: webbed footprints.', poster: 'ferry', price: 9, minutes: 100, score: 'noir', dur: 60,
  cues: [[26, 'gasp'], [36.6, 'laugh'], [41, 'laugh'], [52, 'aww']],
  scenes: [
    [0, 5, (lt, t) => { r(0, 0, W, H, '#05070e'); rain(t, 30, '#2a3a5a'); title('THE LAST FERRY', 'A MAPLE BAY MYSTERY', '#e8d890'); }],
    [5, 18, (lt, t) => { pier(t); lighthouse(8, 44, t, true); lamp(72, 44); const x = 118 - pr(lt, 0, 8) * 50; man(x, 44, '#a08a64', Object.assign({ walk: lt < 8 ? lt : undefined }, DET)); rain(t, 34, '#3a4a70'); if (lt > 7) card(lt < 10.5 ? 'MIDNIGHT. THE PIER.' : 'THE FOGHORN IS GONE.', '#e8d890'); }],
    [18, 30, (lt, t) => { r(0, 0, W, H, '#1a1410'); for (let y = 4; y < H; y += 12) { r(0, y, W, 11, '#4a3a2c'); r(0, y + 11, W, 1, '#2a2018'); } const n = Math.floor(pr(lt, 1, 7) * 6); for (let i = 0; i < n; i++) { const x = 34 + i * 12, y = 30 + (i % 2) * 8; r(x, y, 1, 4, '#d88a3a'); r(x - 2, y, 1, 3, '#d88a3a'); r(x + 2, y, 1, 3, '#d88a3a'); r(x - 2, y + 3, 5, 2, '#d88a3a'); }
      r(0, 20, 22, 44, '#a08a64'); r(4, 8, 14, 12, '#d8b090'); r(0, 6, 24, 3, '#2a2a34'); r(4, 0, 14, 6, '#2a2a34'); r(14, 12, 2, 2, '#1a1a24'); const mx = 34 + pr(lt, 2, 9) * 60, my = 32 + Math.sin(lt * 2) * 3; disc(mx, my, 7, '#9ac8e8'); disc(mx, my, 5, '#c8e8f8'); r(mx + 5, my + 5, 6, 2, '#6a4a2a'); rain(t, 12, '#3a4a70');
      if (lt > 4) card(lt < 8 ? 'WEBBED FOOTPRINTS.' : 'SIZE: SMALL. VERY SMALL.', '#e8d890'); }],
    [30, 44, (lt, t) => { pier(t, 0); ferry(52, 44, true); const open = lt > 6.5 && lt < 10 && Math.floor(lt * 4) % 2 === 0; gull(66, 28, open); man(10 + pr(lt, 0, 5) * 28, 44, '#a08a64', Object.assign({ walk: lt < 5 ? lt : undefined, arm: lt > 6.5 }, DET)); rain(t, 22, '#3a4a70');
      if (lt > 6.5 && lt < 10) { const k = (lt * 3) % 1; g.globalAlpha = 1 - k; disc(78, 22, Math.round(4 + k * 10), '#f6e04a'); g.globalAlpha = 1; T('HONK!', 86, 12, Math.floor(lt * 6) % 2 ? '#f6e04a' : '#f4fbfc'); } if (lt > 10.5) card('CASE CLOSED.', '#e8d890'); }],
    [44, 54, (lt, t) => { bands(['#2a3a6a', '#6a4a7a', '#c86a5a', '#f0a05a', '#f8d078'], 0, 40); disc(84, 40, 9, '#fff0a0'); water(40, t, '#3a5a8a', '#f0a05a'); lighthouse(6, 40, t, false); const x = 20 + pr(lt, 0, 10) * 60; ferry(x, 46, false); man(x + 28, 41, '#a08a64', DET); gull(x + 27, 28 - Math.round(Math.abs(Math.sin(lt * 3))), false); r(x + 14, 22 - (lt * 6 % 6), 3, 3, '#d8d4cc'); if (lt > 3) card('THE LAST FERRY LEFT ON TIME.', '#2a2a34', '#f8d078'); }],
    [54, 60, lt => theEnd(lt, 'STARRING INSPECTOR FINCH', 'AND A GULL NAMED HORN'),
    ]] };

/* ------------------------------------------------------------------ 2. Maple & Moon (romance, four seasons) */
const SEAS = [
  { n: 'SPRING', sky: ['#8ac8e8', '#b8dcf0', '#f0d8e0'], tree: '#f0a8c0', gr: '#7ab860', pc: '#f8c8d8', d: 13 }, { n: 'SUMMER', sky: ['#1a2a5a', '#2a3a7a', '#4a4a8a'], tree: '#3a8a4a', gr: '#3a6a44', pc: '#f6e04a', d: 9 },
  { n: 'AUTUMN', sky: ['#e8a05a', '#f0b870', '#f8d8a0'], tree: '#d8542a', gr: '#a89850', pc: '#e8742a', d: 5 }, { n: 'WINTER', sky: ['#1a2040', '#2a3058', '#3a4070'], tree: null, gr: '#e8eef4', pc: '#f4fbfc', d: 2 }];
function season(k, lt, t) {
  const S = SEAS[k]; bands(S.sky, 0, 38); if (k === 1 || k === 3) stars(12, 5 + k, t); disc(86, 30 - k * 5 - pr(lt, 0, 12) * 4, 3 + k * 2, k === 0 ? '#f4f8fc' : '#fff4d0'); skyline(38, 11, k === 1 || k === 3 ? '#2a2a50' : '#8a94b8', 0, k === 1 || k === 3 ? '#ffd870' : null);
  water(38, t, k === 3 ? '#4a5a80' : '#4a8ab8', k === 3 ? '#8a9ac0' : '#9ad0e8'); r(0, 46, W, 18, S.gr); r(0, 46, W, 1, '#00000030');
  r(18, 22, 4, 26, '#4a3020'); r(12, 26, 6, 2, '#4a3020'); r(22, 24, 7, 2, '#4a3020'); if (S.tree) { disc(20, 18, 11, S.tree); disc(10, 24, 6, S.tree); disc(30, 22, 7, S.tree); } else { r(8, 24, 5, 1, '#f4fbfc'); r(22, 22, 8, 1, '#f4fbfc'); r(16, 20, 8, 2, '#f4fbfc'); }
  r(96, 26, 1, 22, '#2a2a34'); r(94, 24, 5, 3, k === 1 || k === 3 ? '#ffe08a' : '#d8d4cc'); r(48, 43, 24, 2, '#6a4a2a'); r(48, 39, 24, 1, '#6a4a2a'); r(50, 45, 1, 4, '#3a2a1a'); r(69, 45, 1, 4, '#3a2a1a');
  const w = pr(lt, 0, 3.5), ax = 30 + (60 - S.d / 2 - 30) * w, bx = 100 - (100 - 60 - S.d / 2) * w;
  man(ax, w < 1 ? 49 : 47, '#3c64ad', { walk: w < 1 ? lt : undefined, sit: w >= 1, hat: k === 3 ? '#c0392b' : null }); man(bx, w < 1 ? 49 : 47, '#d8483a', { walk: w < 1 ? lt : undefined, sit: w >= 1, skin: '#c89878', hat: k === 3 ? '#3c64ad' : null });
  for (let i = 0; i < 16; i++) { const px = (h1(i, 20 + k) * W + (k === 1 ? Math.sin(t + i) * 6 : t * (k === 3 ? 3 : 7))) % W, py = k === 1 ? 20 + h1(i, 31) * 26 + Math.sin(t * 2 + i) * 2 : (h1(i, 32) * H + t * (k === 3 ? 9 : 13)) % 50; if (k !== 1 || Math.floor(t * 3 + i) % 3) r(px, py, k === 2 ? 2 : 1, 1, S.pc); }
  if (k === 1 && w >= 1) { r(61, 36, 1, 3, '#f8f4ea'); r(60, 34, 3, 2, '#f8a0c0'); } if (k === 2 && w >= 1) r(57, 39, 7, 1, '#f6e04a'); if (k === 3 && lt > 7) heart(60, 26 - Math.round(pr(lt, 7, 9) * 4));
  T(S.n, 4, 3, k === 1 || k === 3 ? '#f4fbfc' : '#2a2a44', true);
}
const mapleFilm = { id: 'maple', title: 'Maple & Moon', blurb: 'Romance. One bench on the River Walk, two strangers, four seasons. Bring a tissue.', poster: 'maple', price: 9, minutes: 100, score: 'romance', dur: 60,
  cues: [[24, 'aww'], [38, 'laugh'], [50.5, 'aww']],
  scenes: [[0, 5, (lt, t) => { bands(['#f08a6a', '#f4b890', '#f8d8b0']); disc(78, 22, 12, '#fff4d0'); title('MAPLE & MOON', 'A YEAR ON THE RIVER WALK', '#5a2a3a', '#7a4a5a'); }],
    [5, 17.5, (lt, t) => season(0, lt, t)], [17.5, 30, (lt, t) => season(1, lt, t)], [30, 42.5, (lt, t) => season(2, lt, t)], [42.5, 55, (lt, t) => season(3, lt, t)],
    [55, 60, lt => theEnd(lt, 'SAME BENCH. NEXT YEAR.', null, '#2a1a2a')]] };

/* ------------------------------------------------------------------ 3. Captain Pigeon (comedy) */
const VEN = { hat: '#f4f0e8', legs: '#3a3a4a' };
function cart(x, y) { r(x, y - 9, 16, 7, '#e8e4dc'); for (let i = 0; i < 4; i++) r(x - 1 + i * 5, y - 16, 3, 3, '#d63a3a'); r(x - 1, y - 16, 18, 1, '#d63a3a'); r(x, y - 13, 1, 4, '#8a8a94'); r(x + 15, y - 13, 1, 4, '#8a8a94'); disc(x + 3, y - 1, 2, '#2a2a34'); disc(x + 13, y - 1, 2, '#2a2a34'); for (let i = 0; i < 3; i++) r(x + 2 + i * 4, y - 12, 3, 3, '#a5652a'); }
const street = (t, sky = '#6ac4f0') => { r(0, 0, W, H, sky); disc(96, 10, 5, '#fff0a0'); skyline(44, 21, '#c8a888', 0, '#8a6a58'); r(0, 44, W, 20, '#b8b0a8'); r(0, 52, W, 12, '#6a6a74'); for (let x = 4; x < W; x += 16) r(x, 57, 8, 1, '#e8e4dc'); };
const pigeonFilm = { id: 'pigeon', title: 'Captain Pigeon', blurb: 'Comedy. One pigeon. One pretzel. One very determined street vendor. A chase across the whole city.', poster: 'pigeon', price: 9, minutes: 95, score: 'comedy', dur: 60,
  cues: [[11, 'laugh'], [24.2, 'laugh'], [38.5, 'laugh'], [47, 'aww'], [52, 'laugh']],
  scenes: [
    [0, 4, (lt, t) => { r(0, 0, W, H, '#6ac4f0'); for (let i = 0; i < 8; i++) { const a = i * .785 + t * .3; tri([56, 32], [56 + Math.cos(a) * 90, 32 + Math.sin(a) * 90], [56 + Math.cos(a + .3) * 90, 32 + Math.sin(a + .3) * 90], '#f6e04a'); } r(20, 20, 72, 22, '#2a3a6a'); title('CAPTAIN PIGEON', null, '#f6e04a'); T('IN: THE BIG TWIST', W / 2, 33, '#f4fbfc'); }],
    [4, 15, (lt, t) => { street(t); cart(58, 50); const took = lt > 5.5, up = pr(lt, 7, 10); man(82, 50, '#f4f0e8', Object.assign({ arm: took }, VEN)); const px = lt < 4.5 ? 4 + pr(lt, 0, 4.5) * 44 : lt < 5.5 ? 48 + pr(lt, 4.5, 5.5) * 12 : 60 + up * 60, py = lt < 4.5 ? 50 : lt < 5.5 ? 50 - Math.sin(pr(lt, 4.5, 5.5) * 3.14) * 14 - pr(lt, 4.5, 5.5) * 10 : 40 - up * 44; pigeon(px, py, Math.floor(lt * 8) % 2, took, lt > 7); if (took && lt < 9) T('!', 84, 30, '#d63a3a'); if (lt > 6.5) card('HEY! THAT IS MY LAST PRETZEL!', '#2a2a34', '#f6e04a'); }],
    [15, 32, (lt, t) => { r(0, 0, W, H, '#8ad0f0'); skyline(40, 31, '#a8c0d8', lt * 6); skyline(56, 37, '#8a6a58', lt * 22, '#f8e8b0'); r(0, 56, W, 8, '#6a6a74'); const duck = lt > 6.5 && lt < 8.5 ? Math.sin(pr(lt, 6.5, 8.5) * 3.14) * 9 : 0; const lx = 150 - (lt - 5) * 40; if (lx > -40 && lx < W) { r(lx, 14, 40, 1, '#f4fbfc'); for (let i = 0; i < 4; i++) r(lx + 4 + i * 9, 15, 5, 6, ['#d63a3a', '#f4fbfc', '#3c64ad', '#f6e04a'][i]); }
      const bx = 210 - (lt - 8) * 30; if (bx > -50 && bx < W) { r(bx, 22, 46, 14, '#f8f4ea'); r(bx, 22, 46, 1, '#2a2a34'); T('EAT PRETZELS', bx + 23, 27, '#d63a3a'); }
      pigeon(56 + Math.sin(lt) * 6, 18 + duck + Math.sin(lt * 3) * 2, Math.floor(lt * 9) % 2, true, true); const trip = lt > 9 && lt < 10.4, vx = 20 + Math.sin(lt * .8) * 10; if (trip) { r(vx - 5, 54, 9, 3, '#f4f0e8'); r(vx + 4, 54, 3, 3, '#e8c0a0'); T('OOF', vx + 2, 44, '#2a2a34'); } else man(vx, 57, '#f4f0e8', Object.assign({ walk: lt * 1.6, arm: Math.floor(lt * 2) % 2 }, VEN)); if (lt > 12) card('ACROSS THE ROOFTOPS OF MAPLE BAY', '#f4fbfc', '#2a3a6a'); }],
    [32, 44, (lt, t) => { bands(['#f0a05a', '#f4b870', '#f8d8a0'], 0, 40); water(40, t, '#3a7aa8', '#8ac8e8'); r(0, 34, W, 4, '#5a5a64'); for (let x = 6; x < W; x += 20) { r(x, 38, 4, 26, '#4a4a54'); } const tx = 130 - lt * 22; train(tx, 34, true); man(tx + 30, 26, '#f4f0e8', Object.assign({ arm: true }, VEN)); pigeon(40 + pr(lt, 0, 12) * 40, 14 + Math.sin(lt * 3) * 2, Math.floor(lt * 9) % 2, true, true); if (lt > 5.5) card('HE TOOK THE 4:15 EXPRESS.', '#2a2a34', '#f8d8a0'); }],
    [44, 55, (lt, t) => { street(t, '#f4b890'); r(50, 20, 12, 30, '#9aa4a8'); r(46, 46, 20, 4, '#8a9498'); r(52, 10, 8, 10, '#7a8488'); r(48, 18, 16, 3, '#6a4a2a'); for (let i = 0; i < 3; i++) { r(50 + i * 4, 15 - (Math.floor(lt * 4 + i) % 2), 3, 3, '#a4aebc'); r(51 + i * 4, 14 - (Math.floor(lt * 4 + i) % 2), 1, 1, '#f2a040'); }
      const land = pr(lt, 0, 2); pigeon(20 + land * 44, 4 + land * 14, Math.floor(lt * 8) % 2, lt < 3, land < 1); if (lt > 3) for (let i = 0; i < 3; i++) heart(52 + i * 5, 4 - Math.round((lt * 3 + i) % 3), '#ff5a7a'); const vx = pr(lt, 2, 6) * 30 - 4; man(vx, 50, '#f4f0e8', Object.assign({ walk: lt < 6 ? lt : undefined, arm: lt > 7.5 }, VEN)); if (lt > 7.5) { r(vx + 4, 38, 4, 4, '#a5652a'); r(vx + 5, 39, 2, 2, '#f4b890'); } if (lt > 6.5) card(lt < 8.5 ? '...OH.' : 'THIS ONE IS ON THE HOUSE.', '#2a2a34', '#f6e04a'); }],
    [55, 60, lt => theEnd(lt, 'NO PRETZELS WERE HARMED', '(ONE WAS EATEN)', '#2a3a6a')]] };

/* ------------------------------------------------------------------ 4. Signal 9 (sci-fi) */
const mast = (x, y, k, t) => { r(x, y - 20, 2, 20, '#3a3a4a'); r(x - 2, y - 28, 6, 9, '#1a1a24'); const c = k === 0 ? '#ff4a3a' : Math.floor(t * 6) % 2 || k === 2 ? '#3fe07a' : '#1a4a2a'; r(x - 1, y - 27, 4, 4, c); if (k) { g.globalAlpha = .3; disc(x + 1, y - 25, 6, '#3fe07a'); g.globalAlpha = 1; } };
const viaduct = (y, sc = 0) => { r(0, y, W, 3, '#4a4a5a'); for (let x = ((-sc % 22) + 22) % 22 - 22; x < W; x += 22) r(x + 8, y + 3, 4, H, '#3a3a4a'); };
const signalFilm = { id: 'signal9', title: 'Signal 9', blurb: 'Sci-fi. The 11:58 light rail has eight signals on its loop. Tonight the ninth one is green.', poster: 'signal9', price: 9, minutes: 100, score: 'scifi', dur: 60,
  cues: [[25.5, 'gasp'], [29.5, 'gasp'], [38, 'aww'], [50, 'laugh']],
  scenes: [
    [0, 5, (lt, t) => { r(0, 0, W, H, '#0a0818'); stars(30, 9, t); g.globalAlpha = .25 + Math.sin(t * 3) * .1; disc(56, 27, 20, '#3fe07a'); g.globalAlpha = 1; title('SIGNAL 9', 'LAST TRAIN. NEW STOP.', '#3fe07a', '#8ad8b0'); }],
    [5, 17, (lt, t) => { r(0, 0, W, H, '#12102a'); stars(22, 9, t); disc(20, 12, 5, '#e8e4f8'); skyline(64, 41, '#1e1a3a', lt * 3, '#ffd870'); viaduct(40, lt * 30); train(-70 + pr(lt, 0, 12) * 110, 40, true); mast(100, 40, 0, t); if (lt > 5) card('THE 11:58. EIGHT SIGNALS. ALL RED.', '#8ad8b0'); }],
    [17, 27, (lt, t) => { r(0, 0, W, H, '#2a2a3a'); r(0, 8, W, 26, '#12102a'); for (let i = 0; i < 9; i++) r(((h1(i, 61) * 200 - lt * 80) % 200 + 200) % 200 - 40, 10 + h1(i, 62) * 22, 10, 1, '#ffd870'); for (let x = 0; x < W; x += 28) r(x, 8, 3, 26, '#3a3a4a'); r(0, 34, W, 2, '#5a5a6a'); r(0, 50, W, 14, '#3a3a4a'); for (let x = 6; x < W; x += 28) r(x, 40, 18, 10, '#2f8a80');
      man(42, 50, '#e8b83a', { sit: true }); r(40, 37 + (Math.floor(lt * 2) % 2), 5, 1, '#1a1a24'); const k = lt > 5 ? (lt > 7 ? 2 : 1) : 0; r(84, 10, 20, 22, '#0a0818'); mast(93, 40, k, t); if (k) T('9', 94, 6, '#3fe07a'); if (lt > 5.5) T('?', 46, 28, '#f4fbfc'); if (lt > 2) card(lt < 5.5 ? 'NEXT SIGNAL: 8.' : 'SIGNAL 9? THERE IS NO SIGNAL 9.', '#8ad8b0'); }],
    [27, 41, (lt, t) => { r(0, 0, W, H, '#0a0818'); for (let i = 0; i < 26; i++) { const sp = 30 + h1(i, 71) * 90, x = ((h1(i, 72) * 150 - lt * sp) % 150 + 150) % 150 - 20; r(x, h1(i, 73) * H, 2 + sp / 20, 1, i % 5 ? '#f4fbfc' : '#3fe07a'); } const up = pr(lt, 0, 3), mx = 150 - lt * 12; disc(mx, 22, 13, '#e8e4f8'); disc(mx - 4, 18, 3, '#c8c4e0'); disc(mx + 5, 26, 2, '#c8c4e0');
      if (lt < 3.5) { viaduct(52 + up * 20, lt * 30); } const y = 52 - up * 22 + Math.sin(lt * 2) * 2; g.save(); g.translate(40, y); g.rotate(-.12 * Math.sin(Math.min(1, up) * 3.14)); train(-34, 0, true); g.restore(); g.globalAlpha = .5; r(0, y - 2, 8, 1, '#3fe07a'); r(0, y - 5, 5, 1, '#2fd0c0'); g.globalAlpha = 1;
      if (lt > 8) { const wx = 130 - (lt - 8) * 18; for (let a = 0; a < 12; a++) r(wx + Math.cos(a * .52 + lt) * 9, 58 + Math.sin(a * .52 + lt) * 9, 2, 2, a % 2 ? '#ff5a7a' : '#f6e04a'); r(wx, 50, 1, 14, '#5a5a6a'); } if (lt > 3) card(lt < 8 ? 'NEXT STOP: UP.' : 'PLEASE HOLD THE HANDRAIL.', '#8ad8b0'); }],
    [41, 54, (lt, t) => { bands(['#2a2a5a', '#6a4a8a', '#d87a6a', '#f8c078'], 0, 44); skyline(44, 41, '#3a2a5a', 0, '#ffd870'); viaduct(44); r(60, 30, 44, 2, '#5a5a6a'); r(62, 32, 2, 12, '#4a4a5a'); r(100, 32, 2, 12, '#4a4a5a'); const d = pr(lt, 0, 4); train(-70 + d * 100, 44 - (1 - d) * 26, lt < 9); mast(108, 44, lt > 8.5 && lt < 10.5 ? (Math.floor(lt * 3) % 2 ? 2 : 0) : lt > 10.5 ? 0 : 2, t);
      if (lt > 5) man(72 + pr(lt, 5, 7) * 14, 44, '#e8b83a', { walk: lt < 7 ? lt : undefined }); if (lt > 8.5 && lt < 10.5) T(';)', 108, 6, '#3fe07a'); if (lt > 4.5) card(lt < 9 ? 'ARTS QUARTER. 11:59.' : 'MIND THE GAP BETWEEN WORLDS.', '#2a2a44', '#f8c078'); }],
    [54, 60, lt => theEnd(lt, 'SIGNAL 9 WILL RETURN', 'CHECK YOUR TIMETABLE', '#0a0818')]] };

export const FILMS = [ferryFilm, mapleFilm, pigeonFilm, signalFilm];
/** paint film frame t (seconds) on a 2D context of FW x FH */
export function drawFilm(film, ctx, t) {
  g = ctx; g.globalAlpha = 1; g.imageSmoothingEnabled = false; const sc = film.scenes.find(s => t >= s[0] && t < s[1]);
  if (!sc) { r(0, 0, W, H, '#05070e'); return; }
  g.save(); try { sc[2](t - sc[0], t); } finally { g.restore(); g.globalAlpha = 1; }
  const e = Math.min(t - sc[0], sc[1] - t); if (e < .35) { g.globalAlpha = 1 - e / .35; r(0, 0, W, H, '#05070e'); g.globalAlpha = 1; }
  if (Math.floor(t * 12) % 9 === 0) r(h1(Math.floor(t * 12), 91) * W, 0, 1, H, '#ffffff10');
}
/** the frame context drawFilm is painting on right now: lets films defined in other modules (src/sim/_media_films.js) share this engine */
export const filmCtx = () => g;
