// Restaurants: diner, ramen bar, pizza place, fine dining + the shared kitchen line.
import { box, qy, qx, qz, lw, fq, glow, lit, ball, cyl, dk, lt, mix, PAT, textY, signY, spx, hash2, rng } from '../../engine/raster.js';
import { F, K, bx, tube, post, posts, frameY, frameX, frameZ, table, rtable, chair, stool, sofa, counter, till, goods, shelf, heap, heap2, carton, plant, compose, steam, plate, cup, bottle, lamp, candle, rug, pleat, screenY, PX } from './_lib.js';
import generic from './generic.js';
const KT = ['diner', 'ramen', 'pizza', 'restaurant', 'kitchen'];
const ST = '#c4c9ce';
/** steel cabinet base */
const steel = (w, d, h, o) => { box(0, 0, 0, w, d, h, ST, o); qy(0, w, d, 0, .1, dk(ST, .5)); qx(w, 0, d, 0, .1, dk(ST, .55)); };
const pot = (x, y, z, r, h, c, f) => { cyl(x, y, z, r, h, c || '#8a9098', { t: f || '#e8c078' }); lw([x - r - .04, y, z + h - .03], [x - r, y, z + h - .03], '#3a3f4c'); };
const flame = (x, y, z) => lit(() => { spx(x, y, z, -1, 0, '#4a90e8'); spx(x, y, z, 1, 0, '#4a90e8'); spx(x, y, z, 0, 1, '#6ad0f0'); spx(x, y, z, 2, 1, '#4a90e8'); spx(x, y, z, -2, 1, '#4a90e8'); });
/** booth bench facing dir 0 (+x) or 2 (-x); 0.5 wide, d deep */
function bench(x, y, d, dir, c) {
  const back = () => { box(dir ? x + .38 : x, y, 0, .12, d, 1.15, c); lw([dir ? x + .38 : x, y + d, 1.08], [(dir ? x + .38 : x) + .12, y + d, 1.08], '#f4f0e8'); };
  if (!dir) back(); box(dir ? x : x + .12, y, 0, .38, d, .45, dk(c, .08), { t: lt(c, .08) }); qy(dir ? x : x + .12, (dir ? x : x + .12) + .38, y + d, 0, .12, '#4a4458'); if (dir) back();
}
const dinerT = ['diner', 'restaurant'];
const rest = [
  F('diner.booth', ['diner', 'pizza', 'bar', 'seating', 'booth', 'table'], [2, 1, 1.2], p => {
    const c = p.c || '#c8352f';
    bench(0, 0, 1, 0, c); table(.62, .08, .76, .84, .75, p.tc || '#e8e4dc', { leg: '#8a9098', inset: .3 }); frameZ(.62, 1.38, .08, .92, .75, '#aab2ba');
    bottle(.8, .2, .75, '#d63a3a', .1); bottle(.9, .18, .75, '#f2c230', .1); bx(1.05, .14, .75, .12, .1, .1, '#d5dbe0'); if (!p.empty) { plate(.85, .6, .75, '#f4f0e8', '#c88838'); plate(1.18, .55, .75, '#f4f0e8', '#e0b468'); cup(1.0, .75, .75, '#e87aa0'); }
    bench(1.5, 0, 1, 2, c);
  }, { seats: [{ x: .3, y: .28, z: .45, dir: 0 }, { x: .3, y: .74, z: .45, dir: 0 }, { x: 1.7, y: .28, z: .45, dir: 2 }, { x: 1.7, y: .74, z: .45, dir: 2 }], variants: [{}, { c: '#2f8f8a', empty: true }, { c: '#5a3a6a', tc: '#3a2a2a' }, { c: '#8a5a3a', tc: '#d2a26a' }] }),

  F('diner.counter', ['till', 'diner', 'counter', 'checkout', 'seating'], p => [p.w || 3, 1, 1.05], p => {
    const w = p.w || 3, c = p.c || '#c8352f';
    box(0, 0, 0, w, .5, .95, '#d5dbe0', { l: PAT.planks('#c4cad0', 3) }); qy(0, w, .5, 0, .1, '#4a4458'); qy(0, w, .5, .55, .75, c); lw([0, .5, .65], [w, .5, .65], lt(c, .4));
    box(-.03, -.02, .95, w + .06, .58, .08, '#f1ede4'); lw([-.03, .56, .99], [w + .03, .56, .99], '#aab2ba');
    till(.15, .08, 1.03); cyl(.85, .25, 1.03, .13, .03, '#d5dbe0'); ball(.85, .25, 1.12, .1, '#e87aa0', { ol: false, squash: .7 }); ball(.85, .25, 1.17, .14, '#dff4f8', { squash: .8, t: '#f8feff', d: '#b4dbe8' }); // cake dome
    cyl(1.4, .22, 1.03, .07, .2, '#3a3f4c', { t: '#5a3a28' }); bx(1.7, .15, 1.03, .1, .1, .12, '#d5dbe0'); if (w > 2.5) { plate(2.2, .3, 1.03, '#f4f0e8', '#e0b468'); cup(2.45, .25, 1.03); bottle(2.7, .2, 1.03, '#d63a3a', .1); }
    for (let x = .5; x < w; x += 1) stool(x, .82, .7, c, { ring: true, leg: '#aab2ba' });
  }, { vb: [-.3, -.3, 0, 3.3, 1.3, 1.6], seats: p => Array.from({ length: Math.round(p.w || 3) }, (_, i) => ({ x: .5 + i, y: .82, z: .7, dir: 3 })), use: { x: .3, y: 1.4 }, staff: { x: .3, y: -.5, dir: 1 }, variants: [{ w: 3 }, { w: 2, c: '#2f8f8a' }] }),

  F('diner.jukebox', ['diner', 'bar', 'jukebox', 'fun'], [1, .5, 1.7], p => {
    const c = p.c || '#8a3a2a';
    box(0, 0, 0, 1, .5, 1.1, c); box(.06, 0, 1.1, .88, .5, .3, c); box(.16, 0, 1.4, .68, .5, .18, c); box(.3, 0, 1.58, .4, .5, .08, c);
    qy(.14, .86, .5, .12, .62, '#c8a050', '#8a6a30'); frameY(.14, .86, .5, .12, .62, '#f2c230');
    lit(() => { qy(.14, .86, .5, .72, 1.08, '#f6e8c8'); for (let i = 0; i < 4; i++) lw([.2, .5, 1.02 - i * .08], [.8, .5, 1.02 - i * .08], i % 2 ? '#d63a3a' : '#3c64ad');
      qy(.22, .78, .5, 1.14, 1.5, '#4ac0e8', '#f6e04a'); qy(.3, .7, .5, 1.2, 1.44, '#e8405a', '#f28a30'); cyl(.5, .51, 1.26, .1, .02, '#2a2733', { ol: false });
      for (const [a, b, z0, z1, k] of [[.03, .03, .1, 1.1, '#f6e04a'], [.97, .97, .1, 1.1, '#f6e04a'], [.1, .1, 1.1, 1.4, '#e8405a'], [.9, .9, 1.1, 1.4, '#e8405a'], [.2, .2, 1.4, 1.58, '#4ac0e8'], [.8, .8, 1.4, 1.58, '#4ac0e8']]) tube([a, .5, z0], [b, .5, z1], k); lw([.3, .5, 1.63], [.7, .5, 1.63], '#5af08a'); });
  }, { use: { x: .5, y: 1 }, variants: [{}, { c: '#3a4a7a' }] }),

  F('diner.table', ['diner', 'pizza', 'table', 'seating'], [2, 1, 1], p => {
    const c = p.c || '#c8352f'; chair(0, .25, 0, '#d5dbe0', { seat: c });
    table(.6, .1, .8, .8, .75, p.tc || '#f1ede4', { leg: '#8a9098', inset: .34 }); if (p.check) qz(.6, 1.4, .1, .9, .751, PAT.ftile(c, '#f1ede4', .2)); frameZ(.6, 1.4, .1, .9, .75, '#aab2ba');
    bottle(.95, .25, .75, '#d63a3a', .1); bottle(1.05, .22, .75, '#f2c230', .1); if (!p.empty) plate(1.0, .62, .75, '#f4f0e8', '#e8843a');
    chair(1.5, .25, 2, '#d5dbe0', { seat: c });
  }, { seats: [{ x: .25, y: .5, z: .45, dir: 0 }, { x: 1.75, y: .5, z: .45, dir: 2 }], variants: [{}, { check: true }, { c: '#3f8a55', check: true, empty: true }] }),

  /* ---- ramen ---- */
  F('ramen.bar', ['ramen', 'counter', 'cookstation', 'checkout', 'seating'], p => [p.w || 3, 1.5, 2.2], p => {
    const w = p.w || 3, c = '#a8703c', nc = p.nc || '#2f3f6a';
    // back-of-counter pots (chef side)
    box(0, 0, 0, w, .5, .9, c, { l: PAT.planks(dk(c, .18), 5) }); qy(0, w, .5, 0, .08, dk(c, .55));
    qz(.06, 1.1, .04, .3, .901, '#3a3f4c'); pot(.3, .17, .9, .16, .3, '#8a9098', '#e8d8b0'); steam(.3, .17, 1.25, 5); pot(.78, .17, .9, .14, .24, '#6a7078', '#c8703a'); steam(.78, .17, 1.2, 4);
    box(-.03, .28, .9, w + .06, .28, .14, lt(c, .12)); // raised eating ledge
    for (let x = .5; x < w; x += 1) { cyl(x, .42, 1.04, .12, .07, (x | 0) % 2 ? '#c0392b' : '#2f3f6a', { t: '#e8c078' }); lw([x + .08, .42, 1.13], [x + .2, .42, 1.2], '#5a3a28'); }
    bx(w - .3, .3, 1.04, .12, .1, .14, '#5a3a28'); for (let i = 0; i < 3; i++) post(w - .28 + i * .04, .35, 1.18, 1.3, '#d2a26a');
    // noren on a beam
    post(.02, .5, 1.04, 2.2, dk(c, .3)); post(w - .02, .5, 1.04, 2.2, dk(c, .3)); tube([0, .5, 2.14], [w, .5, 2.14], dk(c, .35));
    const n = Math.round(w * 2); for (let i = 0; i < n; i++) { const a = i * w / n + .03, b = (i + 1) * w / n - .03; qy(a, b, .52, 1.66, 2.12, nc); lw([a, .52, 1.66], [b, .52, 1.66], dk(nc, .35)); if (i % 2 === 0 && i < n - 1) { cyl((a + b) / 2 + w / n / 2, .53, 1.9, .09, .01, '#f4f0e8', { ol: false }); } }
    if (p.name) textY(p.name, w / 2 - p.name.length * .125, .52, 2.02, '#f4f0e8');
    for (let x = .5; x < w; x += 1) stool(x, 1.1, .7, '#5a3a28', { leg: '#3a3f4c', ring: true });
  }, { seats: p => Array.from({ length: Math.round(p.w || 3) }, (_, i) => ({ x: .5 + i, y: 1.1, z: .7, dir: 3 })), use: { x: 1.5, y: 1.6 }, staff: { x: .6, y: -.5, dir: 1 }, variants: [{ w: 3 }, { w: 4, nc: '#a8322a' }, { w: 2, nc: '#3a3a3a' }] }),

  F('ramen.lantern', ['ramen', 'decor', 'overhead', 'lamp'], [.5, .5, 2.6], p => {
    const c = p.c || '#d6402a'; post(.25, .25, 2.3, 2.6, '#3a3f4c'); cyl(.25, .25, 2.24, .08, .05, '#2a2733', { ol: false });
    lit(() => ball(.25, .25, 1.98, .2, c, { squash: 1.15, t: lt(c, .35) })); glow(() => ball(.25, .25, 1.98, .26, '#ffb060', { ol: false, squash: 1.1, t: '#ffe6a0', d: '#ff8a40' }));
    lit(() => ball(.25, .25, 1.98, .2, c, { squash: 1.15, t: lt(c, .35), ol: false })); for (const k of [-.1, 0, .1]) lw([.1, .25, 1.98 + k], [.4, .25, 1.98 + k], dk(c, .25));
    cyl(.25, .25, 1.72, .08, .04, '#2a2733', { ol: false });
  }, { solid: false, overhead: true, vb: [-.2, -.2, 1.5, .7, .7, 2.7], light: { x: .25, y: .25, z: 0, r: 2 }, variants: [{}, { c: '#f4f0e8' }] }),

  /* ---- pizza ---- */
  F('pizza.oven', ['pizza', 'cookstation', 'oven'], [1.5, 1.5, 2.2], p => {
    const c = p.c || '#b5654a', st = '#d8cdb5';
    box(0, 0, 0, 1.5, 1.5, .85, st, { l: PAT.stone(dk(st, .18)), r: PAT.stone(dk(st, .36)) }); qy(.3, 1.2, 1.5, .1, .65, '#3a2a28'); for (let i = 0; i < 4; i++) cyl(.45 + i * .2, 1.42, .12 + (i % 2) * .16, .08, .02, '#b07444', { ol: false, t: '#d2a26a' }); cyl(.6, 1.42, .44, .08, .02, '#b07444', { ol: false, t: '#d2a26a' });
    box(0, 0, .85, 1.5, 1.5, .08, dk(st, .15));
    box(.5, .1, 1.5, .4, .4, .7, c, { l: PAT.brick(dk(c, .18)), r: PAT.brick(dk(c, .36)) });
    ball(.75, .7, 1.25, .62, c, { squash: .8 }); 
    box(.42, 1.05, .93, .66, .4, .5, c, { l: PAT.brick(dk(c, .18)), r: PAT.brick(dk(c, .36)), t: PAT.ftile(c, dk(c, .2), .12) });
    qy(.5, 1.0, 1.45, .93, 1.3, '#2a1a18'); lit(() => { qy(.52, .98, 1.45, .93, 1.06, '#e8502a', '#f28a30'); for (const [x, h] of [[.56, .16], [.68, .24], [.8, .2], [.9, .12]]) { qy(x, x + .08, 1.45, 1.06, 1.06 + h, '#f28a30'); qy(x + .02, x + .06, 1.45, 1.06, 1.02 + h, '#f6e04a'); } }); glow(() => qy(.5, 1.0, 1.45, .93, 1.3, '#ff9a40', '#ffc060'));
    frameY(.5, 1.0, 1.45, .93, 1.3, dk(c, .5));
    tube([1.3, 1.52, 0], [1.4, 1.2, 1.5], '#b07444'); cyl(1.42, 1.2, 1.5, .14, .02, '#d2a26a'); // peel
  }, { use: { x: .75, y: 2 }, light: { x: .75, y: 2, z: 0, r: 2.5 }, variants: [{}, { c: '#e8dcc4' }] }),

  F('pizza.counter', ['till', 'pizza', 'counter', 'checkout'], [2.5, .5, 1.5], p => {
    const c = p.c || '#3f8a55';
    counter(0, 0, 2.5, .5, 1, '#f1ede4', '#d8d2c4', { panels: false }); qy(0, 2.5, .5, .1, .92, PAT.vstripes('#f1ede4', c, 4)); qy(0, 2.5, .5, .5, .92, '#f1ede4'); signY('PIZZA', .6, 1.9, .5, .47, .91, '#f1ede4', '#c0392b', { frame: false });
    // warmer with slices
    lit(() => { bx(.1, .06, 1, 1.3, .38, .03, '#3a3f4c'); for (let i = 0; i < 3; i++) { cyl(.32 + i * .42, .25, 1.03, .17, .02, '#e8b860', { ol: false, t: i === 1 ? '#f0d080' : '#e86a3a' }); for (let k = 0; k < 4; k++) spx(.32 + i * .42, .25, 1.06, [-2, 1, 3, -1][k], [0, -1, 1, 1][k], i === 1 ? '#3f8a55' : '#a8281a'); } });
    glow(() => qz(.1, 1.4, .06, .44, 1.04, '#ffd070', 'glass'));
    qy(.1, 1.4, .46, 1, 1.35, '#e4f6fa', 'glass'); frameY(.1, 1.4, .46, 1, 1.35, '#7a8690'); box(.08, .04, 1.35, 1.34, .44, .06, '#c0392b'); lit(() => lw([.12, .46, 1.34], [1.38, .46, 1.34], '#ffb040'));
    till(1.6, .08, 1); for (let i = 0; i < 5; i++) box(2.05, .08, 1 + i * .05, .38, .36, .05, i % 2 ? '#e8dcc4' : '#f1ede4', { ol: i === 4 });
  }, { vb: [-.3, -.3, 0, 2.8, .8, 1.8], use: { x: 1.75, y: 1 }, staff: { x: 1.75, y: -.5, dir: 1 }, variants: [{}, { c: '#c0392b' }] }),

  /* ---- fine dining ---- */
  F('restaurant.table', ['restaurant', 'table', 'seating'], p => [2, p.n === 4 ? 2 : 1, 1], p => {
    const four = p.n === 4, cc = p.cc || '#5a3a28', cl = p.cl || '#f8f4ea', y0 = four ? .5 : 0;
    if (four) chair(.75, 0, 1, cc, { seat: '#8a3a3a' }); chair(0, y0 + .25, 0, cc, { seat: '#8a3a3a' });
    box(.55, y0 + .05, .3, .9, .9, .45, cl, { l: pleat(dk(cl, .1)), r: pleat(dk(cl, .22)) }); post(1, y0 + .5, 0, .3, '#4a3a30'); cyl(1, y0 + .5, 0, .2, .03, '#4a3a30', { ol: false });
    plate(.75, y0 + .5, .75); plate(1.25, y0 + .5, .75); if (four) { plate(1, y0 + .25, .75); plate(1, y0 + .78, .75); }
    cyl(.82, y0 + .3, .75, .03, .12, '#e4f6fa', { ol: false, t: '#8a2a3a' }); cyl(1.2, y0 + .72, .75, .03, .12, '#e4f6fa', { ol: false, t: '#8a2a3a' });
    if (p.flower) { cyl(1, y0 + .5, .75, .04, .1, '#9fd0e8', { ol: false }); spx(1, y0 + .5, .92, 0, 0, '#e87aa0'); spx(1, y0 + .5, .92, 1, -1, '#d63a3a'); spx(1, y0 + .5, .92, -1, -1, '#e87aa0'); } else candle(1, y0 + .5, .75);
    chair(1.5, y0 + .25, 2, cc, { seat: '#8a3a3a' }); if (four) chair(.75, 1.5, 3, cc, { seat: '#8a3a3a' });
  }, { seats: p => p.n === 4 ? [{ x: .25, y: 1, z: .45, dir: 0 }, { x: 1.75, y: 1, z: .45, dir: 2 }, { x: 1, y: .25, z: .45, dir: 1 }, { x: 1, y: 1.75, z: .45, dir: 3 }] : [{ x: .25, y: .5, z: .45, dir: 0 }, { x: 1.75, y: .5, z: .45, dir: 2 }],
    variants: [{ n: 2 }, { n: 4 }, { n: 2, flower: true, cl: '#f4d8d0' }, { n: 4, cc: '#2a2733', flower: true }] }),

  F('restaurant.host', ['restaurant', 'host', 'checkout'], [.5, .5, 1.6], p => {
    const c = p.c || '#5a3a28'; box(.03, .03, 0, .44, .44, 1.05, c); frameY(.09, .41, .47, .15, .9, dk(c, .35)); qy(.14, .36, .47, .55, .7, '#d8a848'); 
    fq([[0, 0, 1.25], [.5, 0, 1.25], [.5, .5, 1.05], [0, .5, 1.05]], lt(c, .15)); qx(.5, 0, .5, 1.05, 1.05, c); fq([[.5, 0, 1.05], [.5, .5, 1.05], [.5, 0, 1.25]], dk(c, .36)); lw([0, .5, 1.05], [.5, .5, 1.05], lt(c, .4));
    fq([[.1, .1, 1.22], [.4, .1, 1.22], [.4, .38, 1.11], [.1, .38, 1.11]], '#f8f4ea'); lw([.14, .2, 1.18], [.36, .2, 1.18], '#8a8478'); lw([.14, .28, 1.15], [.3, .28, 1.15], '#8a8478');
    lamp(.42, .06, 1.25, .34, '#3f8a55', { r: .09, base: '#d8a848' });
  }, { use: { x: .25, y: 1 }, staff: { x: .25, y: -.4, dir: 1 }, variants: [{}, { c: '#2a2733' }] }),

  F('restaurant.winerack', ['restaurant', 'bar', 'decor', 'shelf'], [1.5, .5, 2.1], p => {
    const c = '#5a3a28'; box(0, 0, 0, 1.5, .5, 2.05, c); qy(.06, 1.44, .5, .7, 2.0, (u, v) => { const a = u % 4, b = v % 4; return (a === 0 || b === 0) ? dk(c, .1) : (a === 2 && b === 2) ? ['#3a5a3a', '#8a2a3a', '#d8a848', '#5a9a5a'][Math.floor(hash2(u >> 2, v >> 2, p.seed || 1) * 4)] : (a === 1 && b === 2) ? '#6a5a50' : '#2a1a20'; });
    frameY(.08, .72, .5, .12, .62, dk(c, .4)); frameY(.78, 1.42, .5, .12, .62, dk(c, .4)); spx(.68, .5, .4, 0, 0, '#d8a848'); spx(.82, .5, .4, 0, 0, '#d8a848');
  }, { variants: [{ seed: 1 }, { seed: 4 }] }),

  /* ---- kitchen line (shared) ---- */
  F('kitchen.range', [...KT, 'cookstation', 'stove'], [1.5, 1, 1.5], p => {
    steel(1.5, 1, .9); box(0, 0, .9, 1.5, .1, .55, ST); 
    qz(.05, 1.45, .12, .95, .901, '#3a3f4c'); for (const [x, y] of [[.4, .32], [1.1, .32], [.4, .72], [1.1, .72]]) cyl(x, y, .9, .15, .02, '#2a2733', { ol: false, t: '#4a4f5c' });
    flame(.4, .72, .93); pot(1.1, .32, .92, .17, .3, '#8a9098', p.soup || '#d8703a'); steam(1.1, .32, 1.26, 4);
    cyl(.42, .34, .92, .16, .06, '#3a3f4c', { t: '#e8c060' }); tube([.42, .5, .96], [.42, .75, 1.0], '#2a2733'); // pan
    cyl(1.1, .72, .92, .13, .16, '#c0392b', { t: '#8a2a1a' });
    qy(.1, 1.4, 1, .16, .7, dk(ST, .12)); qy(.25, 1.25, 1, .28, .58, '#2a2733'); glow(() => qy(.25, 1.25, 1, .28, .58, '#c05a2a', '#2a2733')); tube([.2, 1.02, .66], [1.3, 1.02, .66], '#e4e8ec');
    for (let i = 0; i < 5; i++) { spx(.2 + i * .27, 1, .82, 0, 0, '#2a2733'); spx(.2 + i * .27, 1, .82, 1, 0, '#c0392b'); }
  }, { use: { x: .75, y: 1.5 }, variants: [{}, { soup: '#e8d8a0' }] }),

  F('kitchen.grill', [...KT, 'cookstation', 'grill'], [1.5, 1, 1.5], p => {
    steel(1.5, 1, .9); box(0, 0, .9, 1.5, .1, .55, ST);
    qz(.05, 1.45, .12, .95, .901, '#4a4f5c', '#3a3f4c'); frameZ(.05, 1.45, .12, .95, .901, '#8a9098');
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { if (p.kind === 'pancake') cyl(.3 + i * .4, .35 + j * .35, .9, .11, .03, '#e8c078', { ol: false }); else { cyl(.3 + i * .4, .35 + j * .35, .9, .1, .04, '#7a4a30', { ol: false, t: (i + j) % 2 ? '#8a5a38' : '#f2c230' }); } }
    tube([1.3, .5, .92], [1.3, .9, .98], '#2a2733'); bx(1.22, .3, .9, .16, .22, .01, '#d5dbe0'); steam(.5, .5, 1.0, 3); steam(1.0, .4, 1.0, 3);
    qy(.1, 1.4, 1, .16, .7, dk(ST, .12)); frameY(.16, .72, 1, .22, .64, '#7d858e'); frameY(.78, 1.34, 1, .22, .64, '#7d858e'); for (let i = 0; i < 3; i++) { spx(.3 + i * .45, 1, .82, 0, 0, '#2a2733'); spx(.3 + i * .45, 1, .82, 1, 0, '#c0392b'); }
  }, { use: { x: .75, y: 1.5 }, variants: [{}, { kind: 'pancake' }] }),

  F('kitchen.fryer', [...KT, 'cookstation', 'fryer'], [1, 1, 1.5], p => {
    steel(1, 1, .9); box(0, 0, .9, 1, .1, .55, ST);
    for (const x of [.08, .54]) { qz(x, x + .38, .16, .9, .901, '#c89030', '#e8b040'); frameZ(x, x + .38, .16, .9, .901, '#7d858e'); qz(x + .06, x + .32, .3, .75, .93, '#8a9098', 'glass'); tube([x + .19, .75, .93], [x + .19, 1.05, 1.0], '#2a2733'); }
    qz(.14, .4, .36, .7, .94, heap('#f2c860', 9)); steam(.3, .5, 1.0, 3);
    qy(.08, .92, 1, .16, .7, dk(ST, .12)); lit(() => { spx(.2, 1, .8, 0, 0, '#ff5a4a'); spx(.7, 1, .8, 0, 0, '#5af08a'); }); frameY(.12, .46, 1, .2, .6, '#7d858e'); frameY(.54, .88, 1, .2, .6, '#7d858e');
  }, { use: { x: .5, y: 1.5 } }),

  F('kitchen.prep', ['prep_counter', ...KT, 'prepstation', 'cookstation'], [2, 1, 1], p => {
    table(0, 0, 2, 1, .9, ST, { leg: '#7d858e', thick: true }); bx(.06, .06, .25, 1.88, .88, .04, dk(ST, .12)); cyl(.4, .5, .29, .2, .3, '#8a9098'); bx(1.1, .25, .29, .5, .5, .25, '#f1ede4'); 
    bx(.2, .35, .9, .6, .45, .04, '#d2a26a'); ball(.38, .55, .98, .07, '#e04a3a', { ol: false }); ball(.55, .5, .98, .06, '#6fb858', { ol: false }); tube([.65, .7, .95], [.85, .62, .95], '#d5dbe0');
    for (let i = 0; i < 4; i++) { cyl(1.1 + i * .22, .3, .9, .09, .1, '#d5dbe0', { t: ['#e04a3a', '#6fb858', '#f2c860', '#f1ede4'][i] }); }
    bx(1.2, .6, .9, .5, .28, .03, '#f1ede4'); plate(1.35, .74, .93, '#f4f0e8', '#c88838'); 
  }, { use: { x: 1, y: 1.5 }, variants: [{}] }),

  F('kitchen.pass', ['ticket_rail', 'pass_window', ...KT, 'pass', 'servestation'], [2, .5, 2], p => {
    steel(2, .5, 1); qy(.08, .98, .5, .2, .9, dk(ST, .1)); qy(1.02, 1.92, .5, .2, .9, dk(ST, .1)); box(-.03, -.02, 1, 2.06, .58, .06, lt(ST, .3));
    plate(.35, .25, 1.06, '#f4f0e8', '#c88838'); plate(.8, .28, 1.06, '#f4f0e8', '#6fb858'); plate(1.3, .25, 1.06, '#f4f0e8', '#e8843a'); cyl(1.75, .25, 1.06, .07, .05, '#d5dbe0'); spx(1.75, .25, 1.13, 0, 0, '#d8a848');
    post(.03, .25, 1.06, 1.85, '#7d858e'); post(1.97, .25, 1.06, 1.85, '#7d858e'); box(0, .05, 1.82, 2, .42, .1, ST);
    for (const x of [.4, 1.0, 1.6]) { post(x, .28, 1.6, 1.82, '#3a3f4c'); cyl(x, .28, 1.52, .11, .1, '#c0392b', { ol: false, t: '#8a2a1a' }); lit(() => cyl(x, .28, 1.5, .08, .02, '#ffb040', { ol: false })); glow(() => { cyl(x, .28, 1.07, .16, .01, '#ffc870', { ol: false }); }); }
    for (let i = 0; i < 5; i++) { qy(.2 + i * .34, .36 + i * .34, .48, 1.62, 1.82, '#f8f4ea'); lw([.23 + i * .34, .48, 1.74], [.33 + i * .34, .48, 1.74], i % 2 ? '#d63a3a' : '#8a8478'); }
  }, { use: { x: 1, y: 1 }, staff: { x: 1, y: -.5, dir: 1 }, variants: [{}] }),

  F('kitchen.dishpit', ['dish_sink', ...KT, 'dishstation', 'sink'], [2, 1, 1.6], p => {
    steel(2, 1, .9); box(0, 0, .9, 2, .1, .4, ST);
    qz(.1, .9, .2, .9, .901, '#8a9098'); qz(.16, .84, .26, .84, .901, '#6fb6d8', '#9fd0e8'); frameZ(.1, .9, .2, .9, .901, '#7d858e'); for (let i = 0; i < 5; i++) spx(.5, .55, .9, [-4, 2, 5, -1, 3][i], [0, 1, -1, 2, 2][i], '#f4fbfc');
    tube([.5, .14, .9], [.5, .14, 1.5], '#aab2ba'); tube([.5, .14, 1.5], [.5, .45, 1.4], '#aab2ba'); tube([.5, .45, 1.4], [.5, .45, 1.2], '#3a3f4c');
    box(1.1, .2, .9, .75, .7, .06, '#4a8ad0', { t: '#3a6aa8' }); for (let i = 0; i < 6; i++) { qx(1.2 + i * .11, .3, .8, .96, 1.2, '#f4f0e8'); frameX(1.2 + i * .11, .3, .8, .96, 1.2, '#b8bcc0'); }
    qy(.1, 1.9, 1, .16, .75, dk(ST, .1)); frameY(.2, .9, 1, .22, .68, '#7d858e'); frameY(1.1, 1.8, 1, .22, .68, '#7d858e');
  }, { use: { x: .5, y: 1.5 } }),

  F('kitchen.walkin', [...KT, 'door', 'fridge'], [1.5, .1, 2.1], p => {
    qy(0, 1.5, .04, 0, 2.05, '#aab2ba'); qy(.08, 1.42, .06, 0, 1.97, '#d8dde2', '#e4e8ec'); frameY(.08, 1.42, .06, 0, 1.97, '#6a7682');
    for (const z of [.5, 1.0, 1.5]) lw([.1, .06, z], [1.4, .06, z], '#b8c0c8'); tube([1.25, .08, .8], [1.25, .08, 1.2], '#3a3f4c'); bx(1.2, .06, .95, .12, .06, .08, '#7d858e');
    for (const z of [.3, 1.6]) bx(.08, .06, z, .12, .04, .1, '#7d858e'); lit(() => { qy(.5, .9, .06, 1.6, 1.8, '#2a2733'); spx(.6, .06, 1.72, 0, 0, '#6ad0f0'); spx(.6, .06, 1.72, 1, 1, '#6ad0f0'); spx(.6, .06, 1.72, 3, 1, '#6ad0f0'); spx(.6, .06, 1.72, 4, 2, '#6ad0f0'); });
  }, { wall: true, mount: 0, solid: false, use: { x: .75, y: .5 }, variants: [{}] }),

  F('kitchen.shelf', [...KT, 'shelf', 'decor'], [1.5, .5, 1.9], p => {
    posts(.03, .03, 1.44, .44, 0, 1.85, '#8a9098');
    for (let i = 0; i < 4; i++) { const z = .15 + i * .5; box(0, 0, z, 1.5, .5, .04, '#b8bcc0', { t: '#c4c9ce', t2: '#aab2ba' });
      if (i === 3) { pot(.3, .25, z + .04, .16, .22); pot(.75, .25, z + .04, .13, .18, '#6a7078'); cyl(1.2, .25, z + .04, .15, .08, '#3a3f4c'); }
      else if (i === 2) for (let j = 0; j < 5; j++) cyl(.18 + j * .28, .28, z + .04, .09, .2, ['#f1ede4', '#e8c060', '#c0392b', '#f1ede4', '#6fb858'][(j + (p.seed || 0)) % 5], { ol: false, t: '#d5dbe0' });
      else if (i === 1) { carton(.08, .06, z + .04, .5, .38, .3); bx(.7, .1, z + .04, .34, .3, .24, '#f1ede4'); bx(1.1, .1, z + .04, .3, .3, .3, '#c8a068'); }
      else { box(.1, .06, z + .04, .55, .4, .3, '#e8dcc0'); box(.8, .06, z + .04, .55, .4, .26, '#e8dcc0'); qy(.3, .5, .46, z + .12, z + .24, '#c0563a'); } }
  }, { variants: [{ seed: 0 }, { seed: 2 }] }),
];
export default rest;
export const galleryItems = [
  compose([rest, generic], 'room.diner', 9, 6, 2.8, { floor: PAT.ftile('#2a2733', '#f1ede4', .5), wall: '#9fd0c8', dado: 1.1, dadoc: '#e8e4dc' }, [
    ['kitchen.walkin', .3, 0], ['kitchen.range', 2.1, .1], ['kitchen.grill', 3.7, .1], ['kitchen.fryer', 5.3, .1], ['kitchen.shelf', 6.6, .05], ['dude', 3.2, 1.5, '#f1ede4', 0, { hair: '#f1ede4' }],
    ['kitchen.pass', .4, 2.2], ['diner.counter', 3, 2.2], ['diner.jukebox', 7.6, 2.2], ['dude', 3.4, 1.85, '#e87aa0'],
    ['diner.booth', .3, 4.6], ['diner.booth', 2.8, 4.6, { c: '#2f8f8a' }], ['diner.table', 5.6, 4.4, { check: true }], ['dude', 5.1, 3.5, '#6a8ad8'],
  ]),
  compose([rest, generic], 'room.ramen', 6, 5, 2.8, { floor: PAT.fboards('#8a6a4a'), wall: '#d8c8a0', dado: .9, dadoc: '#5a4030' }, [
    ['kitchen.range', .3, .1, { soup: '#e8d8a0' }], ['kitchen.prep', 2, .1], ['kitchen.dishpit', 4 + 99, .1], ['ramen.bar', .5, 2], ['dude', 1.4, 1.6, '#2a2733', 0, { apron: '#f1ede4' }], ['ramen.lantern', 4.2, 2.6], ['ramen.lantern', 5, 1.2, { c: '#f4f0e8' }], ['diner.table', 3.9, 3.6, { c: '#5a3a28', tc: '#a8703c' }],
  ].filter(i => i[1] < 50)),
  compose([rest, generic], 'room.pizza', 7, 5.5, 2.8, { floor: PAT.ftile('#c0563a', '#e8d8c0', .5), wall: '#f0e4c8' }, [
    ['pizza.oven', .3, .1], ['kitchen.prep', 2.2, .1], ['kitchen.dishpit', 4.6, .1], ['pizza.counter', 1.5, 2.3], ['dude', 3.2, 1.9, '#f1ede4', 0, { apron: '#3f8a55' }], ['diner.table', .5, 4.2, { c: '#3f8a55', check: true }], ['diner.booth', 4.5, 3.8, { c: '#8a5a3a', tc: '#d2a26a' }],
  ]),
  compose([rest, generic], 'room.restaurant', 8, 6, 2.8, { floor: PAT.fboards('#6a4a38'), wall: '#5a3040', dado: 1, dadoc: '#3a2028' }, [
    ['restaurant.winerack', .3, .05], ['kitchen.pass', 2.5, .3], ['restaurant.winerack', 5.2, .05, { seed: 4 }], ['restaurant.host', 6.9, 4.4], ['dude', 7.15, 4.1, '#2a2733'],
    ['restaurant.table', .6, 2], ['restaurant.table', 3.4, 1.8, { n: 4 }], ['restaurant.table', .8, 4.2, { n: 2, flower: true }], ['restaurant.table', 4, 4, { n: 4, cc: '#2a2733', flower: true }],
  ]),
];
