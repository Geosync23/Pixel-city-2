// Central Station hall kit (room 'central_station', src/scenes/rooms/stations.js). Ids furn.station.*:
//   arch {w,h,sky}   wall bay: stone piers + tall arched steel-and-glass window (wall item)        sky: 0 day | 1 dusk | 2 night
//   portal {sky}     6-wide wall bay: stairs/escalators up to the platforms, lit PLATFORMS sign, big LED departures board
//   dome {w,d,sky}   the far half of the glass vault/dome springing from the two back walls (overhead; place at z = wall height)
//   gates            glass fare-gate line with side wings (use)        counter  ticket office (staff, use)
//   kiosk {kind: coffee|news|flowers|bakery}  (staff, use)             info     information desk (staff, use)
//   clock (meeting-point clock), pillar, planter, piano (seats, use), medallion (flat floor inlay), shaft (flat light patch)
import { box, qy, qx, qz, lw, fq, lit, glow, dk, lt, cyl, ball, signY, textY, spx, hash2, rng, PAT, PW, px, C } from '../../engine/raster.js';

const STONE = '#e6dfd0', STEEL = '#3f5a5a', BRASS = '#c9a24a', NAVY = '#27408a';
const SKY = [['#c9e9f5', '#a9d6ee', '#8cc4e6'], ['#f8d2a0', '#eea58c', '#9a82b8'], ['#2c3160', '#23284e', '#1a1d3c']];
const T = ['station', 'central'];

function archFn(sky, seed) {
  const S = SKY[sky] || SKY[0];
  return (u, v, w, h) => {
    const r = w / 2, cy = h - r;
    if (v > cy) { const d = Math.hypot(u + .5 - r, v - cy); if (d >= r) return null; if (d > r - 1.7 || Math.abs(d - (r - 8)) < .7) return STEEL; }
    if (u < 1 || u >= w - 1 || v < 1) return STEEL;
    if (u % 13 === 6 || (v <= cy && v % 16 === 0)) return STEEL;
    const k = v / h * 3, b = Math.min(2, Math.floor(k));
    if (sky === 2 && hash2(u, v, seed) > .988) return '#e8ecff';
    if (sky === 0 && hash2(Math.floor((u + v) / 7), Math.floor(v / 3), seed) > .88) return '#eef8fc';
    if (b < 2 && k - b > .72 && ((u + v) & 1)) return S[b + 1];
    return S[b];
  };
}
function bay(w, h) {
  box(0, 0, 0, w, .3, h, STONE, { l: PAT.stone(STONE), ol: false });
  qy(0, w, .3, 0, .5, dk(STONE, .14)); lw([0, .3, .5], [w, .3, .5], dk(STONE, .35)); qy(0, w, .3, h - .22, h, lt(STONE, .3)); lw([0, .3, h - .22], [w, .3, h - .22], dk(STONE, .3));
}
const arch = {
  id: 'furn.station.arch', kind: 'furniture', tags: T, wall: true, mount: 0, solid: false, size: p => [p.w || 4, .3, p.h || 4.4],
  variants: [{ w: 4 }, { w: 3, sky: 1 }, { w: 4, sky: 2 }],
  draw(p) {
    const w = p.w || 4, h = p.h || 4.4; bay(w, h);
    qy(.4, w - .4, .3, .75, h - .35, archFn(p.sky || 0, (p.seed || 1) + w));
    lw([.4, .3, .75], [w - .4, .3, .75], BRASS); lw([.34, .3, .68], [w - .34, .3, .68], dk(STONE, .3));
    for (const x of [.08, w - .26]) { qy(x, x + .18, .3, 2.0, 2.12, BRASS); lit(() => qy(x + .03, x + .15, .3, 2.12, 2.38, '#fff1c0')); }
  },
};

const ROWS = [['AIRPORT', '1', '2'], ['OLD TOWN', '2', '5'], ['HILLCREST', '1', '14'], ['HARBORSIDE', '2', '19']];
const portal = {
  id: 'furn.station.portal', kind: 'furniture', tags: T.concat('departures'), wall: true, mount: 0, solid: false, size: p => [6, .3, p.h || 4.4], variants: [{}],
  draw(p) {
    const h = p.h || 4.4, Y = .3; bay(6, h);
    qy(1, 5, Y, 0, 2.2, '#2a2733');
    for (let i = 0; i < 8; i++) qy(1.5 + i * .09, 4.5 - i * .09, Y, i * .22, i * .22 + .22, i % 2 ? '#8a8f9a' : '#a4a9b3');
    lit(() => qy(2.3, 3.7, Y, 1.78, 2.15, '#ffe6b0', '#ffd98a'));
    for (const s of [0, 1]) { const x0 = s ? 4.95 : 1.05, x1 = s ? 4.3 : 1.7; lw([x0, Y, .75], [x1, Y, 2.0], '#16141c'); lw([x0, Y, .68], [x1, Y, 1.93], YELc); lw([x0, Y, 0], [x0, Y, .75], '#16141c'); }
    lw([1, Y, 0], [1, Y, 2.2], BRASS); lw([5, Y, 0], [5, Y, 2.2], BRASS); lw([1, Y, 2.2], [5, Y, 2.2], BRASS);
    signY('PLATFORMS 1-2', 1.1, 4.9, Y, 2.26, 2.6, NAVY, '#ffffff', { lit: true });
    qy(.35, 5.65, Y, 2.72, h - .28, '#16141c'); lw([.35, Y, 2.72], [5.65, Y, 2.72], BRASS); lw([.35, Y, h - .28], [5.65, Y, h - .28], BRASS); lw([.35, Y, 2.72], [.35, Y, h - .28], BRASS); lw([5.65, Y, 2.72], [5.65, Y, h - .28], BRASS);
    lit(() => {
      textY('DEPARTURES', .55, Y, h - .36, '#ffffff'); textY('PLAT MIN', 3.75, Y, h - .36, '#8fb0e8');
      ROWS.forEach((r, i) => { const z = h - .36 - (i + 1) * .27; if (z < 2.95) return; textY(r[0], .55, Y, z, '#ffb347'); textY(r[1], 4.0, Y, z, '#7ee08a'); textY(r[2], 4.85, Y, z, '#ffb347'); });
    });
  },
};
const YELc = '#f2c230';

const dome = {
  id: 'furn.station.dome', kind: 'furniture', tags: T, overhead: true, solid: false, size: p => [p.w || 28, p.d || 20, 2], vb: p => [0, 0, 0, p.w || 28, p.d || 20, 8.4],
  variants: [{ w: 28, d: 20 }, { w: 28, d: 20, sky: 2 }],
  draw(p) {
    const w = p.w || 28, d = p.d || 20, cx = w / 2, cy = d / 2, HD = 8, S = SKY[p.sky || 0], N = 6, PSI = 62 * Math.PI / 180, st = p.sky === 2 ? '#4d6f6c' : STEEL;
    const k = s => 1 - Math.cos(s), sj = j => PSI * j / N;
    const PY = (x0, s) => [x0 + (cx - x0) * k(s), cy * k(s), HD * Math.sin(s)], PX = (y0, s) => [cx * k(s), y0 + (cy - y0) * k(s), HD * Math.sin(s)];
    const col = (i, j) => { const b = Math.min(2, Math.floor(j / 2)); return [S[b], (i + j) & 1 ? S[Math.min(2, b + 1)] : lt(S[b], .25)]; };
    const vault = (P, len, step) => {
      const n = Math.round(len / step);
      for (let j = 0; j < N; j++) for (let i = 0; i < n; i++) { const a = i * step, b = a + step, c = col(i, j); fq([P(a, sj(j)), P(b, sj(j)), P(b, sj(j + 1)), P(a, sj(j + 1))], c[0], c[1]); }
      for (let i = 0; i <= n; i++) for (let j = 0; j < N; j++) lw(P(i * step, sj(j)), P(i * step, sj(j + 1)), st);
      for (let j = 0; j <= N; j++) for (let i = 0; i < n; i++) lw(P(i * step, sj(j)), P((i + 1) * step, sj(j)), j === N || j === 0 ? dk(st, .3) : st);
      for (let j = 0; j < N; j++) { const a = P(len, sj(j)), b = P(len, sj(j + 1)); lw([a[0], a[1], a[2] + .07], [b[0], b[1], b[2] + .07], lt(st, .35)); }
      for (let i = 0; i < n; i++) { const a = P(i * step, PSI), b = P((i + 1) * step, PSI); lw([a[0], a[1], a[2] + .07], [b[0], b[1], b[2] + .07], BRASS); }
    };
    vault(PX, d, 2); vault(PY, w, 2);
    for (let j = 0; j < N; j++) { const a = PY(0, sj(j)), b = PY(0, sj(j + 1)); lw([a[0], a[1], a[2] + .07], [b[0], b[1], b[2] + .07], dk(st, .4)); }
    lw([0, 0, .06], [w, 0, .06], dk(st, .3)); lw([0, 0, .06], [0, d, .06], dk(st, .3));
  },
};

const gates = {
  id: 'furn.station.gates', kind: 'furniture', tags: T.concat('gates'), size: [8, 2.8, 1.15], use: { x: 4, y: 3.3 }, variants: [{}],
  draw() {
    const g = '#bfe0ea', m = '#c9d2d8';
    qx(.1, 0, 2.1, 0, 1.0, g, 'glass'); lw([.1, 0, 1.0], [.1, 2.1, 1.0], m); lw([.1, 0, 0], [.1, 2.1, 0], dk(m, .3)); for (let y = 0; y <= 2.1; y += .7) lw([.1, y, 0], [.1, y, 1.0], m);
    for (let i = 0; i < 9; i++) {
      const x = i * .965;
      box(x, 2.1, 0, .28, .7, 1.0, m, { t: lt(m, .3) }); qy(x + .04, x + .24, 2.8, .1, .9, dk(m, .12));
      lit(() => { qz(x + .07, x + .21, 2.5, 2.7, 1.01, i % 4 === 3 ? '#e0453a' : '#5ad06a'); qy(x + .08, x + .2, 2.8, .6, .78, i % 4 === 3 ? '#e0453a' : '#5ad06a'); });
      if (i < 8) { qy(x + .28, x + .62, 2.45, .25, .92, '#9fd6e8', 'glass'); qy(x + .63, x + .965, 2.45, .25, .92, '#9fd6e8', 'glass'); lw([x + .28, 2.45, .92], [x + .965, 2.45, .92], '#e8f6fb'); lw([x + .625, 2.45, .25], [x + .625, 2.45, .92], '#5b8fa5'); }
    }
    qx(8, 0, 2.1, 0, 1.0, g, 'glass'); lw([8, 0, 1.0], [8, 2.1, 1.0], m); for (let y = 0; y <= 2.1; y += .7) lw([8, y, 0], [8, y, 1.0], m);
  },
};

const counter = {
  id: 'furn.station.counter', kind: 'furniture', tags: T.concat('tickets'), size: [4, 1.2, 2.5], staff: { x: 1, y: .3, dir: 1 }, use: { x: 1, y: 1.7 }, variants: [{}],
  draw() {
    const g = '#34504f';
    box(0, .7, 0, .15, .5, 2.05, g, { ol: false });
    box(0, .7, 0, 4, .5, 1.05, g, { t: '#e8dcc0', l: PAT.planks(g, 8) }); qy(0, 4, 1.2, .9, .98, BRASS); qy(0, 4, 1.2, 0, .14, dk(g, .3));
    qy(.15, 3.85, 1.0, 1.05, 1.95, '#d4ecf2', 'glass'); for (const x of [.15, 2, 3.85]) lw([x, 1.0, 1.05], [x, 1.0, 1.95], BRASS); lw([.15, 1.0, 1.95], [3.85, 1.0, 1.95], BRASS);
    for (const x of [1, 3]) { qy(x - .2, x + .2, 1.0, 1.05, 1.2, '#16141c'); lit(() => textY(x < 2 ? '1' : '2', x - .08, 1.0, 1.85, '#ffb347')); }
    box(3.85, .7, 0, .15, .5, 2.05, g, { ol: false });
    box(0, .7, 2.05, 4, .5, .45, NAVY); signY('TICKETS', .6, 3.4, 1.2, 2.1, 2.45, NAVY, '#ffffff', { lit: true, frame: false });
    glow(() => qy(.2, 3.8, 1.0, 1.25, 1.9, '#ffe6b0', 'glass'));
  },
};

const KIOSK = {
  coffee: { c: '#6b4a3a', a: '#e8c060', sign: 'COFFEE', goods: ['#f4efe2', '#c9a24a', '#8a5a3a'] },
  news: { c: '#27408a', a: '#e0453a', sign: 'NEWS+SNACKS', goods: ['#e0453a', '#f2c230', '#5ad06a', '#f4efe2', '#7a5aa8', '#2f8f96'] },
  flowers: { c: '#3f7a55', a: '#f2a7c3', sign: 'FLOWERS', goods: ['#f2a7c3', '#e0453a', '#f2c230', '#f4efe2', '#b58ad6'] },
  bakery: { c: '#b5654a', a: '#f4efe2', sign: 'BAKERY', goods: ['#e8c060', '#c9792a', '#f1d9a0'] },
};
const kiosk = {
  id: 'furn.station.kiosk', kind: 'furniture', tags: T.concat('kiosk'), size: [3, 2, 2.7], vb: [-.3, -.3, 0, 3.3, 2.5, 2.8], staff: { x: 1.5, y: .95, dir: 1 }, use: { x: 1.5, y: 2.5 },
  variants: [{ kind: 'coffee' }, { kind: 'news' }, { kind: 'flowers' }, { kind: 'bakery' }],
  draw(p) {
    const K = KIOSK[p.kind] || KIOSK.coffee, c = K.c, r = rng((p.seed || 3) + K.sign.length), G = K.goods, pick = () => G[Math.floor(r() * G.length)];
    box(0, 0, 0, 3, .4, 2.1, c); qy(.12, 2.88, .4, .3, 2.0, dk(c, .35));
    for (const z of [.45, .95, 1.45]) { qy(.12, 2.88, .4, z - .06, z, lt(c, .35)); for (let x = .2; x < 2.7; x += .26) { const hh = .16 + r() * .22; if (r() < .85) qy(x, x + .2, .4, z, z + hh, pick()); } }
    box(0, .4, 0, .4, 1.1, 1.0, c, { t: '#f1ede4', ol: false });
    box(0, 1.5, 0, 3, .5, 1.0, c, { t: '#f1ede4' }); qy(.15, 2.85, 2.0, .14, .86, lt(c, .12)); qy(0, 3, 2.0, 0, .1, dk(c, .35));
    if (p.kind === 'news') { for (let x = .22; x < 2.7; x += .33) for (const z of [.2, .52]) { const m = pick(); qy(x, x + .27, 2.0, z, z + .28, m); lw([x + .04, 2.0, z + .22], [x + .2, 2.0, z + .22], '#ffffff'); } }
    else if (p.kind === 'flowers') { for (let x = .3; x < 2.8; x += .5) { cyl(x, 1.75, 1.0, .12, .22, '#8a8f9a', { ol: false }); ball(x, 1.75, 1.42, .2, pick(), { ol: false }); ball(x + .12, 1.7, 1.52, .12, pick(), { ol: false }); spx(x, 1.75, 1.3, 0, 0, '#3f8a55'); } textY('FRESH', 1.0, 2.0, .62, '#ffffff'); }
    else if (p.kind === 'bakery') { qy(.3, 2.2, 2.0, .2, .8, '#f1d9a0'); for (let x = .4; x < 2.1; x += .3) { qy(x, x + .22, 2.0, .28, .42, '#c9792a'); qy(x, x + .22, 2.0, .54, .68, '#e8c060'); } box(.3, 1.6, 1.0, 1.4, .3, .32, '#d4ecf2', { t: '#e8f6fb', ol: false }); for (let x = .4; x < 1.6; x += .25) spx(x, 1.9, 1.12, 0, 0, '#c9792a'); }
    else { lit(() => { textY('LATTE 4', .35, 2.0, .74, '#ffe6b0'); textY('TEA 3', .35, 2.0, .44, '#ffe6b0'); }); box(2.1, 1.58, 1.0, .7, .36, .46, '#c9d2d8'); qy(2.2, 2.7, 1.94, 1.08, 1.3, '#2a2733'); lit(() => spx(2.25, 1.94, 1.38, 0, 0, '#e0453a')); for (const x of [.5, .75, 1.0]) cyl(x, 1.75, 1.0, .06, .16, '#f4efe2', { ol: false }); }
    box(0, 1.9, 1.0, .1, .1, 1.3, dk(c, .2), { ol: false }); box(2.9, 1.9, 1.0, .1, .1, 1.3, dk(c, .2), { ol: false });
    glow(() => qy(.15, 2.85, 1.55, 1.05, 2.2, '#ffd98a', 'glass'));
    box(-.2, -.2, 2.3, 3.4, 2.4, .3, K.a, { l: PAT.vstripes(K.a, K.a === '#f4efe2' ? '#e0b0a0' : '#f4efe2', 6), r: PAT.vstripes(dk(K.a, .15), '#d8d2c2', 6) });
    signY(K.sign, .5, 2.5, 2.2, 2.34, 2.57, c, '#ffffff', { lit: true });
  },
};

const info = {
  id: 'furn.station.info', kind: 'furniture', tags: T.concat('info'), size: [2.5, 1, 1.1], vb: [-.1, -.1, 0, 2.6, 1.1, 2.7], staff: { x: 1.1, y: .15, dir: 1 }, use: { x: 1.25, y: 1.5 }, variants: [{}],
  draw() {
    box(0, .4, 0, 2.5, .6, 1.05, NAVY, { t: '#e8dcc0' }); qy(0, 2.5, 1.0, .9, .98, BRASS); signY('INFO', .5, 1.7, 1.0, .3, .75, '#f4efe2', NAVY, { lit: true });
    box(2.15, .55, 1.05, .1, .1, 1.0, '#8a8f9a', { ol: false }); box(1.9, .5, 2.05, .6, .2, .55, NAVY);
    lit(() => { const s = PW(2.2, .7, 2.48), X = Math.round(s[0]), Y = Math.round(s[1]), w = C('#ffffff'); px(X, Y - 2, w); for (let i = 0; i < 5; i++) px(X, Y + i, w); px(X - 1, Y + 4, w); px(X + 1, Y + 4, w); px(X - 1, Y, w); });
    box(.3, .5, 1.05, .5, .3, .28, '#2a2733', { ol: false }); lit(() => qy(.34, .76, .8, 1.1, 1.28, '#8fd0ff'));
  },
};

function face(x, y, z, sx) { // small lit clock face around a world anchor; sx = shear direction of the face (+1: +y face, -1: +x face)
  const s = PW(x, y, z), X = Math.round(s[0]), Y = Math.round(s[1]), w = C('#fffbe8'), d = C('#2a2733');
  for (let j = -5; j <= 5; j++) for (let i = -4; i <= 4; i++) { const yy = j - i * .5 * sx; if (i * i * 1.5 + yy * yy <= 22) px(X + i, Y + j, i * i * 1.5 + yy * yy > 15 ? C(BRASS) : w); }
  px(X, Y, d); px(X, Y - 1, d); px(X, Y - 2, d); px(X, Y - 3, d); px(X + 1, Y + (sx > 0 ? 1 : 0), d); px(X + 2, Y + (sx > 0 ? 1 : -1), d);
}
const clock = {
  id: 'furn.station.clock', kind: 'furniture', tags: T.concat('clock', 'meeting'), size: [1.4, 1.4, 3.5], variants: [{}],
  draw() {
    cyl(.7, .7, 0, .58, .14, dk(STONE, .15)); cyl(.7, .7, .14, .5, .3, STONE, { t: '#8a5a3a' });
    cyl(.7, .7, .44, .13, .2, BRASS, { ol: false }); cyl(.7, .7, .6, .08, 1.8, '#34504f', { ol: false }); cyl(.7, .7, 2.3, .14, .12, BRASS, { ol: false });
    box(.32, .32, 2.42, .76, .76, .8, '#34504f'); lw([.32, 1.08, 2.42], [1.08, 1.08, 2.42], BRASS); lw([1.08, .32, 2.42], [1.08, 1.08, 2.42], BRASS);
    lit(() => { face(.7, 1.08, 2.82, 1); face(1.08, .7, 2.82, -1); });
    box(.26, .26, 3.22, .88, .88, .08, BRASS, { ol: false }); ball(.7, .7, 3.4, .1, BRASS);
  },
};

const pillar = {
  id: 'furn.station.pillar', kind: 'furniture', tags: T, size: [.7, .7, 4.4], vb: [-.3, -.3, 0, 1, 1, 4.5], variants: [{}],
  draw(p) {
    const h = p.h || 4.4;
    box(.05, .05, 0, .6, .6, .5, STONE); cyl(.35, .35, .5, .19, h - .9, STEEL); for (const z of [.62, h - .55]) cyl(.35, .35, z, .23, .08, BRASS, { ol: false });
    box(.02, .02, h - .4, .66, .66, .4, '#34504f');
    lw([.35, .55, 2.5], [.35, .82, 2.62], BRASS); lw([.55, .35, 2.5], [.82, .35, 2.62], BRASS);
    lit(() => { ball(.35, .84, 2.74, .13, '#fff1c0', { ol: false }); ball(.84, .35, 2.74, .13, '#fff1c0', { ol: false }); });
  },
  light: { x: .6, y: .6, z: 0, r: 4.5, c: '#ffe2b0' },
};

const planter = {
  id: 'furn.station.planter', kind: 'furniture', tags: T.concat('plant'), size: [1.5, 1.5, 3.3], vb: [-.4, -.4, 0, 1.9, 1.9, 3.6], variants: [{}, { seed: 5 }],
  draw(p) {
    const r = rng(p.seed || 2);
    box(0, 0, 0, 1.5, 1.5, .5, STONE, { t: '#5a4636' }); qy(0, 1.5, 1.5, .38, .5, lt(STONE, .3)); qx(1.5, 0, 1.5, .38, .5, dk(STONE, .1));
    for (let i = 0; i < 9; i++) { const x = .15 + r() * 1.2, y = .15 + r() * 1.2; spx(x, y, .56, 0, 0, ['#f2a7c3', '#f2c230', '#f4efe2'][i % 3]); spx(x, y, .5, 0, 0, '#4f9a55'); }
    cyl(.75, .75, .5, .08, 1.3, '#7a5a44', { ol: false });
    ball(.5, .65, 2.0, .55, '#458c50'); ball(1.05, .8, 2.1, .55, '#4f9a55'); ball(.75, .75, 2.6, .62, '#5aa860');
  },
};

const piano = {
  id: 'furn.station.piano', kind: 'furniture', tags: T.concat('piano'), size: [1.6, 1.3, 1.3], seats: [{ x: .8, y: 1.08, z: .48, dir: 3 }], use: { x: .8, y: 1.6 }, variants: [{}],
  draw() {
    const c = '#2f8f96';
    box(0, 0, 0, 1.6, .45, 1.25, c); qy(.08, 1.52, .45, .78, 1.18, dk(c, .15));
    for (const [x, z, k] of [[.25, .3, '#f2c230'], [.6, .2, '#f2a7c3'], [1.0, .34, '#f4efe2'], [1.35, .22, '#e0453a'], [.42, 1.0, '#f2a7c3'], [1.2, 1.02, '#f2c230']]) { spx(x, .45, z, 0, 0, k); spx(x, .45, z, 1, 0, k); spx(x, .45, z, 0, -1, k); spx(x, .45, z, -1, 0, k); spx(x, .45, z, 0, 1, '#3f8a55'); }
    box(0, .45, .58, 1.6, .26, .12, dk(c, .1), { ol: false }); qz(.06, 1.54, .49, .69, .705, '#f4efe2'); for (let x = .12; x < 1.5; x += .1) lw([x, .49, .706], [x, .6, .706], '#2a2733');
    qy(.55, 1.05, .46, .86, 1.14, '#fbf8ee'); lw([.6, .46, 1.06], [1.0, .46, 1.06], '#8a8f9a'); lw([.6, .46, .96], [1.0, .46, .96], '#8a8f9a');
    box(0, .45, 0, .1, .26, .58, c, { ol: false }); box(1.5, .45, 0, .1, .26, .58, c, { ol: false });
    box(.55, .9, 0, .5, .36, .45, '#3a3644', { t: '#b5654a' });
  },
};

const medallion = {
  id: 'furn.station.medallion', kind: 'furniture', tags: T, flat: true, solid: false, size: [8, 8, .02], variants: [{}],
  draw() {
    qz(0, 8, 0, 8, .01, (x, y) => {
      const dx = x - 4, dy = y - 4, r = Math.hypot(dx, dy), a = Math.atan2(dy, dx) + Math.PI, s = Math.floor(a / (Math.PI / 8));
      if (r > 3.95) return null; if (r > 3.72) return STEEL; if (r > 3.5) return BRASS; if (r < .35) return BRASS; if (r < .5) return STEEL;
      const rs = .9 + 2.3 * Math.pow(Math.abs(Math.cos(a * 4)), 2.2), rs2 = .7 + 1.5 * Math.pow(Math.abs(Math.sin(a * 4)), 2.2);
      if (r < rs) return (s & 1) ? '#b5654a' : '#8a4a3a'; if (r < rs2) return (s & 1) ? '#56636b' : '#7a8790';
      if (r > 3.05 && r < 3.2) return BRASS;
      return ((s >> 1) & 1) ? '#efe8d8' : '#d9cfba';
    });
  },
};

const shaft = {
  id: 'furn.station.shaft', kind: 'furniture', tags: T, flat: true, solid: false, size: [4.4, 6, .02], variants: [{}],
  draw() { for (let k = 0; k < 3; k++) { const x = k * 1.1; fq([[x, 0, .01], [x + .85, 0, .01], [x + 2.2, 6, .01], [x + 1.35, 6, .01]], '#fff6d2', 'glass'); } },
};

export default [arch, portal, dome, gates, counter, kiosk, info, clock, pillar, planter, piano, medallion, shaft];
