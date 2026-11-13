// TVs, game, music, bookshelves. Screens are `lit` when p.on (p.show: sunset news game desktop code toon static).
import { box, qy, qx, qz, lw, glow, lit, cyl, rng, dk, lt, signY } from '../../engine/raster.js';
import { tier, wood, FAB, METAL, b, leg, legs4, pole, shadow, drawersY, doorsY, dot, blob, oblob, mug, screenY, frameY, books, stock, shelfUnit, scene } from './_lib.js';

const GOLD = '#d9b65c';
function flatTV(x, y, z, w, h, p, t) {
  const c = t === 0 ? '#59606c' : '#262830', bz = t === 0 ? .05 : .025;
  if (t === 2) { b(x + w * .2, y - .04, z, w * .6, .16, .02, '#3a3a46'); } else { b(x + w * .3, y - .04, z, w * .4, .16, .03, dk(c, .1)); pole(x + w / 2, y + .03, z, .08, c); }
  box(x, y, z + .07, w, t === 0 ? .1 : .05, h, c); screenY(x + bz, x + w - bz, y + (t === 0 ? .1 : .05), z + .07 + bz + (t === 0 ? .03 : 0), z + .07 + h - bz, p.on, p.show || 'sunset', p.seed);
  lit(() => dot(x + w - .08, y + (t === 0 ? .1 : .05), z + .085, p.on ? '#8dffb0' : '#ff5a5a'));
}
function tvStand(w, p) {
  const t = tier(p), wd = wood(p), sz = w <= 1 ? 0 : w <= 1.5 ? 1 : 2, H = .45;
  shadow(-.03, w + .06, 0, .58);
  if (t === 0) {
    if (sz === 0) { box(.1, .03, 0, .8, .44, H, '#c98a4a', { l: (u, v) => (v % 4 === 0 || u % 6 === 0) ? '#8a5a2a' : '#b5763a' }); }
    else { for (const x of [0, w - .4]) box(x, .05, 0, .4, .4, .2, '#9a9a9a', { l: (u, v) => (v % 3 === 0) ? '#6f6f78' : (u % 6 < 3 ? '#8a8a92' : '#9d9da5') }); box(0, 0, .2, w, .5, .06, '#b89668'); box(0, 0, H - .06, w, .5, .06, '#b89668'); for (const x of [.03, w - .09]) b(x, .03, .26, .06, .44, .13, '#8a6a44'); books(.3, w * .55, .44, .26, .12, rng(p.seed || 3), .9); }
  } else if (t === 1) {
    for (const [x, y] of [[.06, .06], [w - .06, .06], [.06, .44], [w - .06, .44]]) leg(x, y, 0, .1, dk(wd, .3));
    box(0, 0, .1, w, .5, H - .1, wd); const m = sz === 0 ? .5 : w * .36; doorsY(.04, m, .5, .13, H - .04, sz === 0 ? 1 : 2, wd, METAL[1]); qy(m + .04, w - .04, .5, .14, H - .05, dk(wd, .5)); frameY(m + .04, w - .04, .5, .14, H - .05, dk(wd, .3));
    qy(m + .1, Math.min(w - .1, m + .5), .5, .16, .23, '#e6ebef'); lit(() => dot(m + .16, .5, .19, '#8dffb0'));
  } else {
    for (const [x, y] of [[.08, .08], [w - .08, .08], [.08, .42], [w - .08, .42]]) leg(x, y, 0, .16, GOLD);
    box(0, 0, .16, w, .5, H - .16, p.wood || '#f1eee6'); const n = Math.max(2, Math.round(w * 2)); doorsY(.03, w - .03, .5, .18, H - .03, n, p.wood || '#f1eee6', GOLD);
  }
  // the set
  if (t === 0 && sz === 0) { // CRT
    const c = p.c || '#6f5a4a'; box(.14, .04, H, .72, .42, .56, c); qy(.19, .68, .46, H + .08, H + .5, '#22252f'); screenY(.21, .66, .46, H + .1, H + .48, p.on, p.show || 'static', p.seed); dot(.76, .46, H + .42, '#d9d2bd'); dot(.76, .46, H + .32, '#d9d2bd'); for (let i = 0; i < 3; i++) lw([.72, .46, H + .1 + i * .05], [.8, .46, H + .1 + i * .05], dk(c, .4));
    lw([.5, .25, H + .56], [.3, .25, H + .9], '#8e979d'); lw([.5, .25, H + .56], [.72, .25, H + .86], '#8e979d');
  } else {
    const tw = [.8, 1.25, 1.75][sz] + (t === 2 && sz === 2 ? .1 : 0), th = [.5, .72, .98][sz];
    flatTV((w - tw) / 2, .2, H, tw, th, p, t);
    if (t === 2) { b((w - tw * .7) / 2, .34, H, tw * .7, .08, .05, '#3a3a46'); } else if (sz > 0 && t === 1) { cyl(.14, .28, H, .06, .08, '#c9764a'); blob(.14, .28, H + .2, 3, 3, '#4f9a55'); }
    if (t === 2 && sz > 0) { b(w - .2, .3, H, .1, .12, .16, '#f8f5ee'); }
  }
}
const tvH = (w, t) => .45 + (w <= 1 ? .6 : w <= 1.5 ? .82 : 1.08);
const tvAsset = (id, w, variants) => ({ id: 'furn.home.tv.' + id, kind: 'furniture', tags: ['home', 'living', 'tv'], size: [w, .5, tvH(w)], vb: [-.3, -.3, 0, w + .3, .8, tvH(w) + .5], use: { x: w / 2, y: .85 }, view: { x: w / 2, y: 2.5 }, variants, draw: p => tvStand(w, p) });

function arcade(p) {
  const t = tier(p), c = p.c || ['#59607a', FAB.red, '#2c2738'][t], c2 = p.c2 || ['#d9a45a', FAB.mustard, '#5ad0ff'][t];
  shadow(.06, .98, 0, .84);
  const side = (u, v) => (t && (u + v) % 8 < 2) ? c2 : (t === 2 && (u - v + 40) % 8 < 1) ? '#ff5ad0' : dk(c, .36);
  box(.1, 0, 0, .8, .7, .85, c, { r: side }); for (const x of [.3, .6]) { qy(x, x + .1, .7, .3, .46, '#22252f'); lit(() => dot(x + .05, .7, .4, '#ff7a3c')); } lw([.14, .7, .1], [.86, .7, .1], dk(c, .45));
  box(.1, 0, .85, .8, .76, .08, '#2c2738', { t: '#3a3a46' }); pole(.3, .5, .93, .09, '#c2cad0'); lit(() => { dot(.3, .5, 1.04, '#ff5a5a'); dot(.3, .5, 1.04, '#ff5a5a', 0, 1); dot(.55, .55, .94, '#ffd24a'); dot(.66, .5, .94, '#5ad0ff'); dot(.77, .55, .94, '#8dffb0'); });
  box(.1, 0, .93, .8, .5, .6, c, { r: side }); qy(.16, .84, .5, .98, 1.48, '#22252f'); screenY(.19, .81, .5, 1.01, 1.45, p.on !== false, p.show || 'game', p.seed || 2);
  box(.1, 0, 1.53, .8, .58, .24, c, { r: side }); lit(() => { qy(.14, .86, .58, 1.57, 1.73, c2); for (let i = 0; i < 4; i++) qy(.2 + i * .16, .28 + i * .16, .58, 1.61, 1.69, i % 2 ? '#f8f5ee' : dk(c2, .5)); });
}
function gameConsole(p) {
  const t = tier(p), c = p.c || ['#b9b3a8', '#f1eee6', '#2c2738'][t];
  if (t === 0) { box(.1, .06, 0, .3, .22, .07, c, { t: (x, y) => (x > .16 && x < .34 && y > .1 && y < .2) ? dk(c, .3) : c }); lit(() => dot(.14, .28, .03, '#ff5a5a')); dot(.3, .28, .03, '#7a5590'); dot(.34, .28, .03, '#7a5590'); }
  else if (t === 1) { box(.14, .04, 0, .1, .26, .3, c); lit(() => lw([.24, .08, .04], [.24, .08, .26], '#5ad0ff')); }
  else { box(.1, .04, 0, .14, .26, .32, c); b(.08, .03, 0, .02, .28, .34, '#f1eee6'); b(.24, .03, 0, .02, .28, .34, '#f1eee6'); lit(() => { lw([.26, .06, .06], [.26, .06, .3], '#5a8aff'); dot(.17, .3, .28, '#f8f5ee'); }); }
  for (const [x, y, k] of [[.18, .4, FAB.red], [.36, .36, FAB.blue]]) { const cc = t === 0 ? c : t === 1 ? k : (k === FAB.red ? '#f1eee6' : '#2c2738'); b(x, y, 0, .12, .07, .03, cc, { t: lt(cc, .2) }); dot(x + .03, y + .04, .04, '#3a3a46'); dot(x + .09, y + .04, .04, t ? '#ffd24a' : '#c8574d'); }
  lw([.24, .4, 0], [.24, .3, 0], '#3a3a46');
}
function stereo(p) {
  const t = tier(p), wd = wood(p), on = p.on, r = rng(p.seed || 6);
  const speaker = (x, y, z, w, h, c) => { box(x, y, z, w, .26, h, c); const m = x + w / 2; blob(m, y + .26, z + h * .3, w * 5.2, w * 5.2, '#22252f'); blob(m, y + .26, z + h * .3, w * 2.4, w * 2.4, '#59607a'); blob(m, y + .26, z + h * .74, w * 2.6, w * 2.6, '#22252f'); dot(m, y + .26, z + h * .74, '#8e979d'); };
  const notes = (x, z) => { if (on) lit(() => { for (const [dx, dz, c] of [[0, 0, '#ffd24a'], [.14, .16, '#ff8ad0'], [-.1, .3, '#8ad8ff']]) { dot(x + dx, .25, z + dz, c); dot(x + dx, .25, z + dz, c, 1, -1); dot(x + dx, .25, z + dz, c, 1, -2); dot(x + dx, .25, z + dz, c, 2, -2); } }); };
  shadow(-.03, 1.06, 0, .58);
  if (t === 0) { // boombox on a crate
    box(.12, .05, 0, .76, .4, .4, '#c98a4a', { l: (u, v) => (v % 4 === 0 || u % 6 === 0) ? '#8a5a2a' : '#b5763a', r: (u, v) => (v % 4 === 0) ? '#6f4a26' : '#93602f' });
    const c = p.c || '#4a4a58'; box(.08, .12, .4, .84, .24, .34, c); for (const x of [.24, .76]) { blob(x, .36, .55, 3.4, 3.4, '#22252f'); blob(x, .36, .55, 1.5, 1.5, '#8e979d'); }
    qy(.4, .6, .36, .5, .6, '#22252f'); qy(.38, .62, .36, .64, .7, '#c2cad0'); lit(() => dot(.5, .36, .67, on ? '#8dffb0' : '#ff5a5a')); lw([.2, .24, .74], [.2, .24, .82], '#8e979d'); lw([.2, .24, .82], [.8, .24, .82], '#8e979d'); lw([.8, .24, .82], [.8, .24, .74], '#8e979d'); lw([.9, .2, .74], [.98, .2, 1.1], '#c2cad0');
    notes(.5, .95);
  } else { // record player on a cabinet (+ floor speakers for tier 2)
    const cw = t === 2 ? .56 : 1, x0 = t === 2 ? .22 : 0, H = .6;
    if (t === 2) speaker(0, .1, 0, .2, 1.05, p.c || '#3a3038');
    for (const [x, y] of [[x0 + .06, .06], [x0 + cw - .06, .06], [x0 + .06, .44], [x0 + cw - .06, .44]]) leg(x, y, 0, .14, t === 2 ? GOLD : dk(wd, .3));
    box(x0, 0, .14, cw, .5, H - .14, wd); qy(x0 + .05, x0 + cw - .05, .5, .18, H - .06, dk(wd, .55));
    books(x0 + .07, x0 + cw - (t === 2 ? .07 : .4), .5, .18, .32, r, 1);
    if (t === 1) { b(.68, .2, H, .0, 0, 0, wd); qy(.66, .94, .5, .2, .5, dk(wd, .2)); blob(.8, .5, .3, 1.6, 1.6, '#22252f'); blob(.8, .5, .43, 1, 1, '#22252f'); }
    else { qy(x0 + .08, x0 + cw - .08, .5, H - .2, H - .1, '#22252f'); lit(() => { for (let i = 0; i < 5; i++) dot(x0 + .14 + i * .06, .5, H - .15, i < 3 || on ? ['#8dffb0', '#8dffb0', '#ffd24a', '#ffb04a', '#ff5a5a'][i] : '#3a3a46'); }); }
    const px0 = x0 + (t === 2 ? .06 : .08); box(px0, .08, H, .44, .36, .06, t === 2 ? '#2c2738' : lt(wd, .2)); blob(px0 + .2, .26, H + .065, 4.6, 2.3, '#22252f'); blob(px0 + .2, .26, H + .065, 1.4, .7, p.c2 || FAB.red); lw([px0 + .4, .14, H + .08], [px0 + .3, .3, H + .08], '#e6ebef'); dot(px0 + .4, .14, H + .09, GOLD);
    if (t === 1) { box(.62, .12, H, .26, .22, .3, wd); blob(.75, .34, H + .15, 2.6, 2.6, '#22252f'); blob(.75, .34, H + .15, 1, 1, '#8e979d'); }
    if (t === 2) speaker(.8, .1, 0, .2, 1.05, p.c || '#3a3038');
    notes(t === 2 ? .5 : .4, H + .3);
  }
}
function bookshelf(p) {
  const t = tier(p), wd = wood(p), w = p.w || 1, low = p.low, H = low ? 1 : 1.9, n = low ? 2 : 4, r = rng(p.seed || 7), fillK = [.6, .9, .97][t];
  shadow(-.03, w + .06, 0, .58);
  shelfUnit(0, 0, 0, w, .5, H, wd, n, (i, z, g, x0, x1, y) => {
    const k = (i + (p.seed || 0)) % 4;
    if (k === 2 && t) { books(x0, x0 + (x1 - x0) * .55, y, z, g * .9, r, fillK); cyl(x1 - .2, y - .1, z, .07, .1, '#c9764a'); blob(x1 - .2, y - .1, z + .2, 3, 2.6, '#4f9a55'); blob(x1 - .24, y - .1, z + .26, 2, 2, '#6dbb68'); }
    else if (k === 0 && t === 0) { stock(x0, x0 + .3, y, z, g * .6, r); box(x1 - .42, y - .3, z, .36, .28, .2, '#c9a36a', { l: (u, v) => v === 2 ? '#8a6a44' : '#b8925a' }); }
    else if (k === 3 && t === 2) { books(x0, x0 + (x1 - x0) * .5, y, z, g * .9, r, 1); oblob(x1 - .2, y - .1, z + .14, 2.6, 2.6, '#4f8fc8'); dot(x1 - .2, y - .1, z + .16, '#6dbb68', -1, 0); dot(x1 - .2, y - .1, z, GOLD); }
    else books(x0, x1, y, z, g * .92, r, fillK);
  }, { back: t === 2 ? dk(wd, .35) : null });
  if (t === 2) { lw([0, .5, H], [w, .5, H], GOLD); glow(() => { for (let i = 1; i <= n; i++) lw([.1, .46, .08 + i * (H - .14) / n - .06], [w - .1, .46, .08 + i * (H - .14) / n - .06], '#ffe9a8'); }); }
  if (low) { if (t) { cyl(w * .3, .25, H, .08, .14, '#f1eee6'); blob(w * .3, .25, H + .32, 4, 4, '#4f9a55'); blob(w * .27, .25, H + .4, 2.5, 2.5, '#6dbb68'); } b(w * .6, .15, H, .24, .18, .04, FAB.rust); b(w * .62, .17, H + .04, .2, .16, .03, FAB.teal); }
  else if (t === 0) { box(.2, .1, H, .4, .3, .2, '#c9a36a', { l: (u, v) => v === 2 ? '#8a6a44' : '#b8925a' }); }
}

const M = (id, tags, o) => Object.assign({ id: 'furn.home.' + id, kind: 'furniture', tags: ['home', 'living', ...tags] }, o);
const T3 = [{ tier: 0 }, { tier: 1 }, { tier: 2 }];
export default [
  tvAsset('small', 1, [{ tier: 0, on: true }, { tier: 1, on: true, show: 'toon' }, { tier: 2, on: true, show: 'news' }, { tier: 0 }]),
  tvAsset('medium', 1.5, [{ tier: 0, on: true, show: 'news' }, { tier: 1, on: true }, { tier: 2, on: true, show: 'game' }, { tier: 1 }]),
  tvAsset('large', 2, [{ tier: 0, on: true, show: 'toon' }, { tier: 1, on: true, show: 'game' }, { tier: 2, on: true }, { tier: 2, wood: '#3a3038' }]),
  M('tv.wall', ['tv'], { size: p => [p.len || 1.5, .1, (p.len || 1.5) * .58], wall: true, mount: 1, solid: false, use: { x: .75, y: .6 }, view: { x: .75, y: 2.5 },
    variants: [{ tier: 1, on: true }, { tier: 2, on: true, len: 2, show: 'game' }, { tier: 0, on: true, len: 1, show: 'news' }, { tier: 1 }],
    draw(p) { const t = tier(p), w = p.len || 1.5, h = w * .58, c = t === 0 ? '#59606c' : '#262830', bz = t === 0 ? .05 : .025; box(0, 0, 0, w, .07, h, c); screenY(bz, w - bz, .07, bz + (t === 0 ? .03 : 0), h - bz, p.on, p.show || 'sunset', p.seed); lit(() => dot(w - .08, .07, .02, p.on ? '#8dffb0' : '#ff5a5a')); } }),
  M('arcade', ['game'], { size: [1, 1, 1.8], use: { x: .5, y: 1.25 }, variants: [{ tier: 0 }, { tier: 1 }, { tier: 2 }, { tier: 1, c: FAB.blue, c2: '#ff8ad0', show: 'toon' }], draw: arcade }),
  M('console', ['game'], { size: [.5, .5, .35], surface: true, solid: false, use: { x: .25, y: .8 }, variants: T3, draw: gameConsole }),
  M('stereo', ['music'], { size: [1, .5, 1.05], vb: [-.3, -.3, 0, 1.3, .8, 1.6], use: { x: .5, y: .85 }, variants: [{ tier: 0, on: true }, { tier: 1, on: true }, { tier: 2, on: true }, { tier: 1, wood: '#e9e2d2' }], draw: stereo }),
  M('bookshelf', ['bookshelf', 'storage'], { size: p => [p.w || 1, .5, p.low ? 1 : 1.9], vb: p => [-.3, -.3, 0, (p.w || 1) + .3, .8, 2.3], use: { x: .5, y: .85 },
    variants: [{ tier: 0, seed: 1 }, { tier: 1, seed: 2 }, { tier: 2, seed: 3 }, { tier: 1, w: 2, seed: 5, wood: '#e9e2d2' }, { tier: 1, low: true, w: 1.5, seed: 4 }, { tier: 2, low: true, w: 2, seed: 8 }], draw: bookshelf }),
];
