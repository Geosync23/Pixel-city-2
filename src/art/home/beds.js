// Beds. All beds stand with the HEAD against the back wall (y=0) and the foot toward +y.
// seats: lying position {x,y,z,dir,lie:true}: (x,y) = body centre, dir = where the feet point (head is at the other end).
import { box, qy, qx, qz, lw, glow, dk, lt } from '../../engine/raster.js';
import { tier, wood, WHITE, FAB, b, leg, pole, shadow, panelY, fabric, cushion, dot, METAL, drawersY } from './_lib.js';

function bedding(x, y, z, w, len, p, t) {
  // pillows at y..y+.4, duvet from y+.55 to y+len
  const c = p.c || FAB.blue, c2 = p.c2 || lt(c, .45), sheet = WHITE[t], n = w >= 1.5 ? 2 : 1, pw = (w - .16) / n - .06;
  for (let i = 0; i < n; i++) cushion(x + .11 + i * (pw + .06), y + .1, z, pw, .34, t ? .09 : .06, t ? '#fbf8f0' : '#e4dfd0');
  if (t === 2) for (let i = 0; i < n; i++) cushion(x + .11 + i * (pw + .06) + pw * .2, y + .36, z, pw * .6, .2, .1, c2);
  const y0 = y + .6, hh = t ? .07 : .04;
  box(x - .02, y0, z - .17, w + .04, y + len - y0, .17 + hh, c, { t: fabric(c, c2, p.pat || (t === 1 ? 'stripe' : 'plain'), w >= 1.5 ? .25 : .2) });
  qz(x - .02, x + w + .02, y0, y0 + .15, z + hh + .005, sheet); lw([x - .02, y0 + .15, z + hh], [x + w + .02, y0 + .15, z + hh], dk(c, .3));
  if (t === 0) { qz(x + w * .5, x + w * .5 + .22, y + len - .5, y + len - .28, z + hh + .005, p.patch || '#d9a45a'); }
  if (t === 2) { const k = p.c3 || '#e9dcc0'; qz(x - .02, x + w + .02, y + len - .5, y + len - .18, z + hh + .005, fabric(k, dk(k, .15), 'check', .12)); qx(x + w + .02, y + len - .5, y + len - .18, z - .12, z + hh, dk(k, .36)); for (let i = 0; i < 3; i++) dot(x + w + .02, y + len - .45 + i * .11, z - .12, dk(k, .5), 0, 1); }
}
function bedDraw(w, p) {
  const t = tier(p), wd = wood(p), m = p.metal || METAL[0], hb = [.85, .95, 1.3][t];
  shadow(-.05, w + .12, 0, 2.12);
  if (t === 0) {
    pole(.03, .04, 0, hb, m); pole(w - .03, .04, 0, hb, m); lw([.03, .04, hb], [w - .03, .04, hb], lt(m, .3)); lw([.03, .04, hb - .28], [w - .03, .04, hb - .28], m);
    for (let x = .2; x < w - .1; x += .2) lw([x, .04, .45], [x, .04, hb], m);
    b(0, .04, .2, w, 1.94, .08, m); leg(.04, 1.95, 0, .2, m); leg(w - .04, 1.95, 0, .2, m); leg(w - .04, .08, 0, .2, m);
    box(.02, .06, .28, w - .04, 1.9, .14, '#d8d2c2', { l: (u, v) => v % 3 === 1 ? '#9fb3c8' : '#c9c3b3' });
  } else if (t === 1) {
    box(0, 0, 0, w, .12, hb, wd); panelY(.1, w - .1, .12, .55, hb - .1, lt(wd, .14), dk(wd, .3));
    box(0, .12, .1, w, 1.8, .2, wd); box(.03, .12, .3, w - .06, 1.8, .17, WHITE[1]);
  } else {
    const u = p.head || '#e7d8be';
    box(-.04, 0, 0, w + .08, .14, hb, u, { l: (a, v) => (a % 6 === 3 && v % 5 === 2 && v > 9) ? dk(u, .4) : dk(u, .16) });
    lw([-.04, .14, hb], [w + .04, .14, hb], '#f1d27a');
    box(0, .14, .08, w, 1.86, .22, wd); box(.03, .14, .3, w - .06, 1.82, .18, WHITE[2]);
    leg(.05, 1.95, 0, .08, '#d9b65c'); leg(w - .05, 1.95, 0, .08, '#d9b65c');
  }
  bedding(0, t === 2 ? .14 : t ? .12 : .06, t ? .47 : .42, w, t === 2 ? 1.84 : t ? 1.8 : 1.9, p, t);
  if (t === 1) box(0, 1.92, 0, w, .08, .5, wd);
}
const bedSeats = w => w >= 1.5 ? [{ x: w * .27, y: 1.1, z: .52, dir: 1, lie: true }, { x: w * .73, y: 1.1, z: .52, dir: 1, lie: true }] : [{ x: w / 2, y: 1.1, z: .52, dir: 1, lie: true }];
const bedAsset = (id, w, variants) => ({
  id: 'furn.home.bed.' + id, kind: 'furniture', tags: ['home', 'bedroom', 'bed'], size: [w, 2, .6], vb: [-.3, -.2, 0, w + .3, 2.3, 1.5],
  use: { x: w + .35, y: 1.1 }, seats: bedSeats(w), variants, draw: p => bedDraw(w, p),
});

function bunk(p) {
  const t = tier(p), wd = t === 0 ? (p.metal || '#7d8a96') : wood(p), c = p.c || FAB.teal, cB = p.cB || p.c2 || FAB.mustard, H = 1.9;
  shadow(-.05, 1.12, 0, 2.12);
  const level = (z, col, top) => {
    box(0, 0, z - .1, 1, .1, .62, wd); if (t) panelY(.12, .88, .1, z + .18, z + .44, lt(wd, .14), dk(wd, .3));
    box(0, .1, z, 1, 1.8, .1, wd); box(.04, .1, z + .1, .92, 1.8, .13, WHITE[t]);
    cushion(.14, .2, z + .23, .72, .32, .07, '#fbf8f0');
    box(.02, .68, z + .1, .96, 1.22, .18, col, { t: fabric(col, lt(col, .45), p.pat || (t ? 'stripe' : 'plain'), .2) });
    qz(.02, .98, .68, .82, z + .285, WHITE[t]);
    box(0, 1.9, z - .1, 1, .1, top ? .62 : .5, wd);
  };
  box(0, 0, 0, .1, .1, H, wd); box(.9, 0, 0, .1, .1, H, wd);
  if (t === 2) { box(.04, .12, 0, .92, 1.76, .24, wd); drawersY(.04, .96, 1.88, .02, .22, 1, wd, '#d9b65c'); }
  level(.3, cB, false);
  // upper bunk
  level(1.15, c, true);
  lw([1, .1, 1.62], [1, 1.2, 1.62], dk(wd, .1)); lw([1, .1, 1.63], [1, 1.2, 1.63], lt(wd, .25)); for (const y of [.1, .65, 1.2]) lw([1, y, 1.25], [1, y, 1.62], dk(wd, .2));
  box(0, 1.9, 0, .1, .1, H, wd); box(.9, 1.9, 0, .1, .1, H, wd);
  // ladder on the +x side near the foot
  const lc = lt(wd, .2); lw([1.04, 1.32, 0], [1.04, 1.32, 1.5], dk(wd, .45)); lw([1.04, 1.74, 0], [1.04, 1.74, 1.5], dk(wd, .45));
  for (let z = .25; z < 1.45; z += .25) lw([1.04, 1.33, z], [1.04, 1.73, z], lc);
  if (t === 2) glow(() => { for (let y = .15; y < 1.9; y += .25) dot(1, y, 1.12, ['#ffd98a', '#ff9d8a', '#a8e6ff'][Math.round(y * 4) % 3]); });
  if (t === 2) for (let y = .15; y < 1.9; y += .25) dot(1, y, 1.12, '#f4e3b0');
}

function futon(p) {
  const t = tier(p), wd = wood(p), c = p.c || FAB.char, c2 = p.c2 || FAB.mustard, m = p.metal || METAL[0], fr = t ? wd : m;
  if (p.open) {
    shadow(-.05, 2.1, 0, 1.6);
    for (const [x, y] of [[.06, .06], [1.94, .06], [.06, 1.44], [1.94, 1.44]]) leg(x, y, 0, .2, fr);
    box(0, 0, .18, 2, 1.5, .07, fr);
    if (t) { box(0, 0, .18, .08, 1.5, .34, wd); }
    box(.04, .02, .25, 1.94, 1.46, .16, c, { t: (x, y) => (Math.abs(y - .75) < .03 || Math.abs(x % .5 - .25) < .02 && Math.abs((y % .5) - .25) < .04) ? dk(c, .25) : c });
    cushion(.14, .3, .41, .34, .9, .08, '#fbf8f0');
    box(.9, 0, .25, 1.1, 1.5, .2, c2, { t: fabric(c2, lt(c2, .4), p.pat || 'check', .25) }); qz(.9, 1.05, 0, 1.5, .455, WHITE[t]);
    if (t) box(1.92, 0, .18, .08, 1.5, .34, wd);
  } else {
    shadow(-.05, 2.1, 0, 1.1);
    for (const [x, y] of [[.06, .06], [1.94, .06], [.06, .94], [1.94, .94]]) leg(x, y, 0, .2, fr);
    if (t) box(0, .05, .18, .1, .95, .44, wd);
    box(.04, 0, .2, 1.92, .3, .68, c, { l: (u, v) => (v === 6 || (u % 8 === 4 && v % 6 === 3)) ? dk(c, .4) : dk(c, .18) });
    box(.04, .28, .2, 1.92, .72, .2, c, { t: (x, y) => Math.abs(x - 1) < .03 || (Math.abs(x % .5 - .25) < .03 && Math.abs(y - .65) < .04) ? dk(c, .25) : lt(c, .06) });
    if (t) cushion(.2, .3, .4, .38, .16, .3, c2);
    if (t === 2) cushion(1.4, .3, .4, .38, .16, .3, lt(c2, .3));
    if (t === 0) qz(1.2, 1.7, .5, .9, .405, fabric('#b9653a', '#eadfc8', 'check', .1));
    if (t) box(1.9, .05, .18, .1, .95, .44, wd); else { lw([2, .02, .2], [2, .02, .8], m); lw([2, .02, .2], [2, 1, .2], m); }
  }
}

function floorBed(p) {
  const t = tier(p), c = p.c || FAB.sage, c2 = p.c2 || lt(c, .4);
  shadow(-.04, 1.08, -.02, 2.08);
  if (p.bag) {
    box(.08, .05, 0, .84, 1.9, .04, p.mat || '#6f7fa8', { t: (x, y) => (Math.floor(y / .12) & 1) ? '#6f7fa8' : '#7b8bb4' });
    cushion(.28, .12, .04, .44, .3, .06, '#f1eee6');
    box(.18, .45, .04, .64, 1.4, .13, c, { t: (x, y) => (Math.floor(y / .14) % 2 ? lt(c, .12) : c) });
    lw([.82, .5, .17], [.82, 1.85, .17], '#f1d27a'); qz(.18, .82, .45, .6, .175, c2);
    if (t) { box(.02, 1.5, 0, .14, .14, .2, '#d9b65c', { ol: true }); glow(() => { b(.03, 1.51, .08, .12, .12, .1, '#ffe9a8'); }); }
    return;
  }
  box(0, 0, 0, 1, 2, t ? .22 : .16, '#e4dfd0', { l: (u, v) => v % 3 === 1 ? '#9fb3c8' : '#cfc9ba', r: (u, v) => v % 3 === 1 ? '#8598ad' : '#b3ad9f' });
  const z = t ? .22 : .16;
  cushion(.14, .1, z, .72, .34, .07, '#fbf8f0');
  box(-.02, .62, z - .1, 1.04, 1.3, .16, c, { t: fabric(c, c2, p.pat || (t ? 'check' : 'plain'), .2) }); qz(-.02, 1.02, .62, .76, z + .065, '#f1eee6');
  if (t === 0) qz(.5, .74, 1.4, 1.62, z + .065, '#d9a45a');
  if (t === 2) { cushion(.3, .4, z, .4, .2, .1, c2); }
}

export default [
  bedAsset('single', 1, [{ tier: 0, c: FAB.grey }, { tier: 1, c: FAB.blue }, { tier: 1, c: FAB.rose, pat: 'dots', wood: '#e9e2d2' }, { tier: 2, c: FAB.teal, c2: FAB.mustard }]),
  bedAsset('double', 1.5, [{ tier: 0, c: FAB.olive }, { tier: 1, c: FAB.red, pat: 'check' }, { tier: 1, c: FAB.sage, wood: '#e9e2d2' }, { tier: 2, c: FAB.navy, c2: '#d9b65c' }]),
  bedAsset('king', 2, [{ tier: 0, c: FAB.rust }, { tier: 1, c: FAB.teal }, { tier: 2, c: FAB.plum, c2: FAB.rose, head: '#5b4a6e' }, { tier: 2, c: '#f1eee6', c2: FAB.sage, wood: '#3a3038', head: '#8d8f9c' }]),
  {
    id: 'furn.home.bed.bunk', kind: 'furniture', tags: ['home', 'bedroom', 'bed'], size: [1, 2, 1.9], vb: [-.3, -.2, 0, 1.4, 2.3, 2.1],
    use: { x: 1.35, y: 1.5 }, seats: [{ x: .5, y: 1.1, z: .6, dir: 1, lie: true }, { x: .5, y: 1.1, z: 1.45, dir: 1, lie: true }],
    variants: [{ tier: 0, c: FAB.grey, cB: FAB.blue }, { tier: 1, c: FAB.red, cB: FAB.blue }, { tier: 1, c: FAB.rose, cB: FAB.sage, wood: '#e9e2d2' }, { tier: 2, c: FAB.teal, cB: FAB.mustard }],
    draw: bunk,
  },
  {
    id: 'furn.home.bed.futon', kind: 'furniture', tags: ['home', 'bedroom', 'living', 'bed', 'seat'], size: p => [2, p.open ? 1.5 : 1, p.open ? .45 : .9],
    use: { x: 1, y: 1.85 }, seats: [{ x: 1, y: .65, z: .45, dir: 0, lie: true }], sit: [{ x: .55, y: .65, z: .4, dir: 1 }, { x: 1.45, y: .65, z: .4, dir: 1 }],
    variants: [{ tier: 0, c: FAB.char }, { tier: 0, c: FAB.char, open: true }, { tier: 1, c: FAB.rust, c2: FAB.cream }, { tier: 1, c: FAB.rust, c2: FAB.teal, open: true }, { tier: 2, c: FAB.navy, c2: FAB.mustard }, { tier: 2, c: FAB.navy, c2: FAB.mustard, open: true }],
    draw: futon,
  },
  {
    id: 'furn.home.bed.floor', kind: 'furniture', tags: ['home', 'bedroom', 'bed'], size: [1, 2, .25],
    use: { x: 1.35, y: 1.1 }, seats: [{ x: .5, y: 1.1, z: .25, dir: 1, lie: true }],
    variants: [{ tier: 0, c: FAB.olive }, { tier: 1, c: FAB.red }, { tier: 2, c: FAB.plum, c2: FAB.mustard }, { bag: true, tier: 0, c: FAB.red }, { bag: true, tier: 1, c: FAB.teal, c2: '#f4a261' }],
    draw: floorBed,
  },
];
