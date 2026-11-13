// Clothing shop + furniture/electronics (homegoods) shop fixtures.
import { box, qy, qx, qz, lw, fq, glow, lit, ball, cyl, dk, lt, mix, PAT, textY, signY, spx, hash2, rng } from '../../engine/raster.js';
import { F, K, bx, tube, post, posts, frameY, frameX, frameZ, table, rtable, chair, stool, sofa, counter, till, monitor, goods, shelf, heap, heap2, carton, plant, compose, steam, plate, cup, bottle, lamp, candle, rug, pleat, screenY, screenLines, mirrorY, dude, keyboard, PX } from './_lib.js';
import generic from './generic.js';
const CL = ['#d63a3a', '#3c64ad', '#f1ede4', '#3a3f4c', '#f2c230', '#3f8a55', '#e87aa0', '#c0a078', '#6fb6d8', '#7a55b0', '#e8843a'];
const PALS = { mix: CL, warm: ['#d63a3a', '#e8843a', '#f2c230', '#e87aa0', '#8a3a2a', '#f1ede4'], cool: ['#3c64ad', '#6fb6d8', '#2f8f8a', '#7a55b0', '#f1ede4', '#3a3f4c'], mono: ['#3a3f4c', '#f1ede4', '#8a9098', '#2a2733', '#c0a078', '#5a6272'], pastel: ['#f4b8c8', '#b8e0a8', '#9fd0e8', '#f6e08a', '#c8b8e8', '#f1ede4'] };
const CH = '#c4c9ce';
/** TV picture: simple landscape/abstract still, lit */
function picture(x0, x1, y, z0, z1, k) {
  const w = x1 - x0, h = z1 - z0, m = ((k % 6) + 6) % 6;
  lit(() => {
    if (m === 0) { qy(x0, x1, y, z0, z1, '#6ab8e8'); qy(x0, x1, y, z0, z0 + h * .4, '#3f9a55'); qy(x0 + w * .55, x0 + w * .75, y, z0 + h * .55, z0 + h * .85, '#f6e04a'); fq([[x0, y, z0 + h * .4], [x0 + w * .3, y, z0 + h * .75], [x0 + w * .6, y, z0 + h * .4]], '#5a7a8a'); }
    else if (m === 1) { qy(x0, x1, y, z0, z1, '#2a1f45'); qy(x0, x1, y, z0, z0 + h * .3, '#e8643a'); qy(x0, x1, y, z0 + h * .3, z0 + h * .5, '#f2a030'); qy(x0 + w * .4, x0 + w * .6, y, z0 + h * .3, z0 + h * .62, '#f6e04a'); }
    else if (m === 2) { qy(x0, x1, y, z0, z1, '#1b6a8a'); qy(x0, x1, y, z0 + h * .7, z1, '#c0392b'); for (let i = 0; i < 4; i++) lw([x0 + w * .1, y, z0 + h * (.15 + i * .14)], [x0 + w * (.5 + hash2(i, 3) * .4), y, z0 + h * (.15 + i * .14)], '#f4fbfc'); }
    else if (m === 3) { qy(x0, x1, y, z0, z1, '#3fae6a'); lw([x0 + w / 2, y, z0], [x0 + w / 2, y, z1], '#f4fbfc'); frameY(x0 + w * .1, x1 - w * .1, y, z0 + h * .15, z1 - h * .15, '#f4fbfc'); qy(x0 + w * .3, x0 + w * .36, y, z0 + h * .4, z0 + h * .55, '#d63a3a'); qy(x0 + w * .62, x0 + w * .68, y, z0 + h * .5, z0 + h * .65, '#3c64ad'); }
    else if (m === 4) { qy(x0, x1, y, z0, z1, '#f4b8c8'); qy(x0 + w * .35, x0 + w * .65, y, z0, z0 + h * .5, '#7a55b0'); qy(x0 + w * .4, x0 + w * .6, y, z0 + h * .5, z0 + h * .8, '#f0c8a0'); qy(x0 + w * .38, x0 + w * .62, y, z0 + h * .75, z0 + h * .88, '#4a3028'); }
    else { qy(x0, x1, y, z0, z1, '#141a33'); for (let i = 0; i < 9; i++) spx(x0 + w * hash2(i, 1), y, z0 + h * (.2 + .75 * hash2(i, 2)), 0, 0, '#f4fbfc'); qy(x0 + w * .6, x0 + w * .78, y, z0 + h * .5, z0 + h * .8, '#f6e8a0'); qy(x0, x1, y, z0, z0 + h * .18, '#2a3a6a'); }
  });
}
function tv(x, y, z, w, h, k) { bx(x, y, z, w, .06, h, '#1e2028'); picture(x + PX, x + w - PX, y + .06, z + PX, z + h - PX, k); }
const garment = (x, y, z0, len, d, c) => { bx(x, y, z0, .1, d, len, c); lw([x, y + d, z0 + len], [x + .1, y + d, z0 + len], lt(c, .3)); };
const clothing = [
  F('clothing.rack', ['clothing', 'rack', 'shelf'], p => [p.w || 2, .5, 1.5], p => {
    const w = p.w || 2, pl = PALS[p.pal || 'mix'], r = rng(p.seed || 1);
    bx(.02, .04, 0, .08, .42, .04, '#8a9098'); bx(w - .1, .04, 0, .08, .42, .04, '#8a9098'); post(.06, .25, 0, 1.45, CH); 
    for (let x = .16; x < w - .2; x += .125) { const c = pl[Math.floor(r() * pl.length)], long = p.long ? .5 + r() * .45 : .45 + r() * .2; spx(x + .05, .25, 1.42, 0, 0, '#3a3f4c'); garment(x, .08, 1.36 - long, long, .34, c); if (r() < .3) lw([x + .1, .2, 1.36 - long + .1], [x + .1, .3, 1.36 - long + .1], lt(c, .4)); }
    tube([.06, .25, 1.42], [w - .06, .25, 1.42], CH); post(w - .06, .25, 0, 1.45, CH); post(w - .06 - PX, .25, 0, 1.45, '#8a9098');
    if (p.sale) { box(w / 2 - .3, .2, 1.48, .6, .06, .44, '#d63a3a'); signY('-30', w / 2 - .3, w / 2 + .3, .26, 1.48, 1.92, '#d63a3a', '#f6e04a', { frame: false }); }
  }, { vb: p => [-.3, -.3, 0, (p.w || 2) + .3, .8, 2.1], use: { x: 1, y: 1 }, variants: [{ seed: 1 }, { seed: 2, pal: 'warm' }, { seed: 3, pal: 'cool', long: true }, { seed: 4, pal: 'mono', w: 1.5 }, { seed: 5, pal: 'pastel', sale: true }] }),

  F('clothing.roundrack', ['clothing', 'rack', 'shelf'], [1, 1, 1.5], p => {
    const pl = PALS[p.pal || 'mix'], n = 14; cyl(.5, .5, 0, .3, .04, '#8a9098'); tube([.5, .5, .04], [.5, .5, 1.42], CH);
    const g = []; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; g.push([.5 + Math.cos(a) * .36, .5 + Math.sin(a) * .36, i]); }
    g.sort((a, b) => (a[0] + a[1]) - (b[0] + b[1])).forEach(([x, y, i]) => { const c = pl[Math.floor(hash2(i, p.seed || 1) * pl.length)], len = .5 + hash2(i, 7) * .2; bx(x - .07, y - .07, 1.3 - len, .14, .14, len, c); });
    cyl(.5, .5, 1.36, .42, .02, CH, { ol: false, t2: 'glass', t: CH }); cyl(.5, .5, 1.42, .1, .04, '#d63a3a', { ol: false });
  }, { use: { x: .5, y: 1.5 }, variants: [{ seed: 1 }, { seed: 4, pal: 'cool' }, { seed: 7, pal: 'pastel' }] }),

  F('clothing.foldtable', ['clothing', 'table', 'shelf'], [2, 1, 1], p => {
    const c = p.c || '#d2a26a', pl = PALS[p.pal || 'mix'];
    table(0, 0, 2, 1, .75, c, { thick: true }); bx(.1, .1, .2, 1.8, .8, .04, dk(c, .1));
    for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) { const k = pl[(i * 2 + j + (p.seed || 0)) % pl.length], h = .08 + hash2(i, j, p.seed || 1) * .2; box(.1 + i * .47, .1 + j * .45, .75, .38, .34, h, k, { l: PAT.stripes(dk(k, .18), dk(k, .3), 2), r: PAT.stripes(dk(k, .36), dk(k, .46), 2), ol: false }); }
    bx(.9, .42, .75, .2, .04, .28, '#f1ede4'); lw([.93, .46, .95], [1.07, .46, .95], '#d63a3a');
  }, { use: { x: 1, y: 1.5 }, variants: [{}, { pal: 'cool', c: '#f1ede4', seed: 2 }, { pal: 'warm', seed: 3 }] }),

  F('clothing.mannequin', ['clothing', 'mannequin', 'decor'], [.5, .5, 1.6], p => {
    cyl(.25, .25, 0, .18, .05, '#8a9098'); dude(.25, .25, .05, p.shirt || '#d63a3a', { skin: '#e8e2d8', hair: '#e8e2d8', pant: p.pant || '#3a4a6a', manq: true, apron: p.scarf });
  }, { variants: [{}, { shirt: '#f2c230', pant: '#f1ede4' }, { shirt: '#3a3f4c', pant: '#8a5a3a', scarf: '#e87aa0' }, { shirt: '#6fb6d8', pant: '#2a2733' }, { shirt: '#f1ede4', pant: '#c0a078', scarf: '#3f8a55' }] }),

  F('clothing.fitting', ['clothing', 'fitting'], [1, 1, 2.2], p => {
    const c = p.c || '#e8dcc4', cc = p.cc || '#8a3a5a';
    box(0, 0, 0, 1, 1, 2.1, c); qy(.06, .94, 1, 0, 2.0, '#3a2a30');
    if (p.open) { mirrorY(.5, .9, 1, .4, 1.8, '#d8a848'); bx(.55, .6, 0, .3, .3, .4, '#8a5a3a'); qy(.08, .4, 1, .2, 1.9, pleat(cc)); lw([.4, 1, .2], [.4, 1, 1.9], dk(cc, .4)); }
    else { qy(.08, .92, 1, .2, 1.9, pleat(cc)); lw([.08, 1, .2], [.92, 1, .2], dk(cc, .4)); if (p.busy) { spx(.4, 1, 0, 0, -1, '#2a2733'); spx(.4, 1, 0, 1, -1, '#2a2733'); spx(.55, 1, 0, 0, -1, '#2a2733'); spx(.55, 1, 0, 1, -1, '#2a2733'); } }
    tube([.06, 1.02, 1.92], [.94, 1.02, 1.92], '#d8a848'); frameY(.06, .94, 1, 0, 2.0, dk(c, .4)); lit(() => { spx(.5, 1, 2.06, 0, 0, p.busy ? '#ff5a4a' : '#5af08a'); spx(.5, 1, 2.06, 1, 0, p.busy ? '#ff5a4a' : '#5af08a'); });
  }, { use: { x: .5, y: 1.5 }, pose: { x: .5, y: .5, z: 0, dir: 1, hidden: true }, variants: [{}, { open: true }, { busy: true, cc: '#3c5a8a' }, { cc: '#3f6a5a', c: '#f1ede4' }] }),

  F('clothing.shoewall', ['clothing', 'shoes', 'shelf'], p => [p.w || 2, .3, 2.2], p => {
    const w = p.w || 2, c = p.c || '#f1ede4'; qy(0, w, .03, .3, 2.2, c); frameY(0, w, .03, .3, 2.2, dk(c, .35));
    for (let i = 0; i < 5; i++) { const z = .45 + i * .34; box(.05, .03, z, w - .1, .22, .03, '#d2a26a', { ol: false }); qy(.05, w - .05, .25, z + .03, z + .29, goods('shoes', 1, { seed: (p.seed || 1) + i, back: c, board: '#d2a26a' })); }
    lit(() => lw([.05, .04, 2.14], [w - .05, .04, 2.14], '#fff2c4'));
  }, { wall: true, mount: .3, solid: false, use: { x: 1, y: .8 }, variants: [{ seed: 1 }, { seed: 6, c: '#3a3f4c' }, { seed: 3, w: 3 }] }),

  F('clothing.counter', ['clothing', 'checkout', 'counter'], [2, .5, 1], p => {
    const c = p.c || '#f1ede4'; counter(0, 0, 2, .5, 1, c, p.top || '#3a3f4c', { panels: false }); qy(.1, 1.9, .5, .15, .85, dk(c, .08)); signY(p.name || 'MODA', .5, 1.5, .5, .3, .74, dk(c, .08), p.ink || '#c0392b', { frame: false });
    till(.2, .08, 1); for (let i = 0; i < 3; i++) box(.85 + i * .04, .12, 1, .3, .08, .34 - i * .03, ['#f4b8c8', '#f1ede4', '#3a3f4c'][i], { ol: false }); lw([.9, .2, 1.34], [1.0, .2, 1.42], '#d8a848'); lw([1.0, .2, 1.42], [1.1, .2, 1.34], '#d8a848');
    box(1.45, .12, 1, .3, .26, .1, '#3c64ad', { l: PAT.stripes('#3c64ad', '#f1ede4', 2) }); cyl(1.85, .25, 1, .06, .1, '#d8a848', { ol: false });
  }, { vb: [-.3, -.3, 0, 2.3, .8, 1.6], use: { x: .5, y: 1 }, staff: { x: .5, y: -.5, dir: 1 }, variants: [{}, { c: '#2e3440', top: '#d2a26a', name: 'DENIM', ink: '#f2c230' }] }),

  F('clothing.mirror', ['clothing', 'mirror', 'decor'], [.5, .5, 1.8], p => {
    const c = p.c || '#d8a848'; tube([.03, .1, 0], [.03, .3, 1.7], c); bx(0, .25, .15, .5, .06, 1.6, c); mirrorY(.04, .46, .31, .2, 1.7, dk(c, .3)); tube([.47, .1, 0], [.47, .3, 1.7], c);
  }, { use: { x: .25, y: 1 }, variants: [{}, { c: '#f1ede4' }, { c: '#3a3f4c' }] }),

  F('clothing.shelves', ['clothing', 'shelf'], [2, .5, 2.1], p => {
    const c = p.c || '#f1ede4', pl = PALS[p.pal || 'mix'];
    box(0, 0, 0, 2, .5, 2.05, c, { l: goods('folded', 5, { seed: p.seed || 3, back: dk(c, .45), board: c, pal: pl }) }); qy(0, 2, .5, 0, .08, dk(c, .5));
    qy(1, 2, .5, .86, 2.02, dk(c, .45)); lw([1, .5, .86], [2, .5, .86], c); lw([1, .5, .08], [1, .5, 2.05], c); tube([1.02, .48, 1.92], [1.98, .48, 1.92], CH);
    for (let i = 0; i < 7; i++) { const k = pl[(i + (p.seed || 0)) % pl.length], len = .55 + hash2(i, p.seed || 1) * .35; qy(1.06 + i * .13, 1.16 + i * .13, .5, 1.88 - len, 1.88, k); qy(1.06 + i * .13, 1.09 + i * .13, .5, 1.88 - len, 1.88, dk(k, .2)); }
  }, { use: { x: 1, y: 1 }, variants: [{}, { pal: 'cool', seed: 6 }, { pal: 'warm', c: '#d2a26a', seed: 9 }] }),

  F('clothing.accessories', ['clothing', 'decor', 'shelf'], [.5, .5, 1.7], p => {
    cyl(.25, .25, 0, .2, .05, '#8a9098'); tube([.25, .25, .05], [.25, .25, 1.6], CH);
    for (let i = 0; i < 4; i++) { const z = .5 + i * .3; cyl(.25, .25, z, .2 - i * .02, .02, CH, { ol: false }); for (let k = 0; k < 4; k++) { const a = k / 4 * 6.28 + i, x = .25 + Math.cos(a) * .17, y = .25 + Math.abs(Math.sin(a)) * .17; if (p.hats) cyl(x, y, z + .02, .07, .06, CL[(i * 3 + k) % CL.length], { ol: false }); else { spx(x, y, z + .1, 0, 0, '#2a2733'); spx(x, y, z + .1, 1, 0, CL[(i + k) % CL.length]); spx(x, y, z + .1, 2, 0, '#2a2733'); } } }
    cyl(.25, .25, 1.6, .08, .06, '#d8a848', { ol: false });
  }, { use: { x: .25, y: 1 }, variants: [{ hats: true }, {}] }),

  F('clothing.pouf', ['clothing', 'seating'], [1, .5, .45], p => { const c = p.c || '#8a3a5a'; box(.02, .04, .08, .96, .42, .34, c, { t: lt(c, .12) }); for (const x of [.25, .5, .75]) spx(x, .25, .42, 0, 0, dk(c, .4)); posts(.08, .1, .84, .3, 0, .08, '#d8a848'); },
    { seats: [{ x: .3, y: .25, z: .42, dir: 1 }, { x: .7, y: .25, z: .42, dir: 1 }], variants: [{}, { c: '#3f6a5a' }, { c: '#c0a078' }] }),
];

/* ---------------- homegoods ---------------- */
const APPL = {
  fridge: (c) => { box(.1, .1, 0, .8, .8, 1.85, c); lw([.1, .9, 1.2], [.9, .9, 1.2], dk(c, .4)); tube([.2, .92, 1.3], [.2, .92, 1.7], dk(c, .5)); tube([.2, .92, .6], [.2, .92, 1.1], dk(c, .5)); lit(() => qy(.55, .8, .9, 1.45, 1.6, '#6ad0f0')); qy(.1, .9, .9, 0, .08, dk(c, .5)); },
  washer: (c) => { box(.1, .1, 0, .8, .8, .95, c); qy(.1, .9, .9, .78, .95, dk(c, .12)); cyl(.5, .92, .42, .2, .01, '#3a3f4c', { ol: false }); cyl(.5, .93, .42, .14, .01, '#6fb6d8', { ol: false, t: '#9fd0e8' }); lit(() => { spx(.75, .9, .87, 0, 0, '#5af08a'); spx(.7, .9, .87, 0, 0, '#f6e04a'); }); cyl(.3, .9, .86, .04, .01, '#8a9098', { ol: false }); },
  oven: (c) => { box(.1, .1, 0, .8, .8, .92, c); box(.1, .1, .92, .8, .1, .2, c); qz(.15, .85, .22, .86, .921, '#2a2733'); for (const [x, y] of [[.32, .4], [.68, .4], [.32, .7], [.68, .7]]) cyl(x, y, .92, .1, .01, '#4a4f5c', { ol: false }); qy(.2, .8, .9, .2, .62, '#2a2733'); frameY(.2, .8, .9, .2, .62, '#8a9098'); tube([.25, .92, .7], [.75, .92, .7], '#d5dbe0'); for (let i = 0; i < 4; i++) spx(.25 + i * .16, .9, .82, 0, 0, '#2a2733'); lit(() => qy(.4, .6, .1 + .1, 1.0, 1.08, '#5af08a')); },
  dishwasher: (c) => { box(.1, .1, 0, .8, .8, .92, c); qy(.1, .9, .9, .76, .92, '#3a3f4c'); lit(() => { spx(.3, .9, .84, 0, 0, '#6ad0f0'); spx(.36, .9, .84, 0, 0, '#6ad0f0'); }); tube([.25, .92, .7], [.75, .92, .7], '#d5dbe0'); qy(.1, .9, .9, 0, .08, dk(c, .5)); },
  micro: (c) => { box(.1, .1, 0, .8, .8, .7, '#d2a26a'); frameY(.18, .82, .9, .1, .6, '#a8743f'); box(.15, .2, .7, .7, .5, .42, c); qy(.2, .68, .7, .76, 1.06, '#2a2733'); lit(() => { qy(.72, .82, .7, .96, 1.04, '#5af08a'); }); for (let i = 0; i < 3; i++) spx(.76, .7, .9 - i * .05, 0, 0, '#8a9098'); },
};
const PLINTH = {
  lamp: z => lamp(.5, .5, z, .7, '#e8c060', { r: .2 }),
  vase: z => { cyl(.5, .5, z, .13, .3, '#3c8fa8'); cyl(.5, .5, z + .3, .07, .12, '#3c8fa8', { ol: false }); for (let i = 0; i < 5; i++) { lw([.5, .5, z + .42], [.5 + (hash2(i, 1) - .5) * .4, .5, z + .75 + hash2(i, 2) * .15], '#3f8a45'); spx(.5 + (hash2(i, 1) - .5) * .4, .5, z + .78 + hash2(i, 2) * .15, 0, 0, ['#e87aa0', '#f2c230', '#f1ede4'][i % 3]); } },
  toaster: z => { box(.3, .35, z, .4, .26, .26, '#c0392b'); bx(.36, .42, z + .26, .28, .04, .06, '#e0b468'); bx(.36, .52, z + .26, .28, .04, .04, '#e0b468'); spx(.7, .5, z + .1, 0, 0, '#2a2733'); },
  speaker: z => { box(.32, .32, z, .36, .36, .7, '#2e3440'); cyl(.5, .69, z + .5, .1, .01, '#5a6272', { ol: false }); cyl(.5, .69, z + .22, .13, .01, '#5a6272', { ol: false }); lit(() => spx(.5, .68, z + .66, 0, 0, '#6ad0f0')); },
  console: z => { box(.25, .3, z, .5, .4, .12, '#f1ede4'); lit(() => lw([.3, .7, z + .06], [.5, .7, z + .06], '#6ad0f0')); bx(.3, .78, z, .16, .1, .05, '#2e3440'); bx(.55, .78, z, .16, .1, .05, '#c0392b'); },
  laptop: z => { bx(.28, .4, z, .44, .3, .02, '#b8bcc0'); bx(.28, .4, z + .02, .44, .03, .3, '#8a9098'); lit(() => { qy(.3, .7, .43, z + .04, z + .3, '#3a6ea5'); screenLines(.33, .68, .43, z + .06, z + .28, '#9fd0e8', 2); }); },
  blender: z => { cyl(.5, .5, z, .12, .14, '#3a3f4c'); cyl(.5, .5, z + .14, .1, .3, '#b4dbe8', { t: '#e87aa0', l: '#e8a0b8' }); cyl(.5, .5, z + .44, .11, .04, '#3a3f4c', { ol: false }); },
};
const home = [
  F('homegoods.plinth', ['homegoods', 'display', 'shelf'], [1, 1, 1.5], p => {
    const c = p.c || '#f1ede4'; box(.15, .15, 0, .7, .7, .6, c); qy(.15, .85, .85, 0, .06, dk(c, .4)); (PLINTH[p.item || 'lamp'])(.6);
    qy(.2, .42, .85, .3, .45, '#f6e04a'); lw([.24, .85, .38], [.38, .85, .38], '#c0392b');
  }, { use: { x: .5, y: 1.5 }, variants: Object.keys(PLINTH).map((item, i) => ({ item, c: i % 3 === 1 ? '#3a3f4c' : i % 3 === 2 ? '#d2a26a' : '#f1ede4' })) }),

  F('homegoods.tvwall', ['homegoods', 'tv', 'display'], [3, .2, 2.4], p => {
    const f = p.frame || 0; qy(0, 3, .03, .4, 2.4, '#3a3f4c'); frameY(0, 3, .03, .4, 2.4, '#2a2733');
    tv(.1, .04, 1.3, 1.5, .95, f); tv(1.7, .04, 1.65, 1.2, .65, f + 1); tv(1.7, .04, 1.0, .58, .55, f + 2); tv(2.32, .04, 1.0, .58, .55, f + 3); tv(.1, .04, .55, .7, .65, f + 4); tv(.9, .04, .55, .7, .65, f + 5); tv(1.7, .04, .5, 1.2, .42, f + 2);
    for (const [x, z] of [[.2, 1.24], [1.8, 1.6], [.2, .5]]) { qy(x, x + .2, .05, z, z + .08, '#f6e04a'); }
  }, { wall: true, mount: .4, solid: false, use: { x: 1.5, y: .8 }, frames: 3, variants: [{ frame: 0 }, { frame: 2 }, { frame: 4 }] }),

  F('homegoods.appliance', ['homegoods', 'appliance', 'display'], p => [1, 1, p.kind === 'fridge' ? 1.9 : 1.2], p => { (APPL[p.kind || 'fridge'])(p.c || '#e4e8ec'); qy(.15, .35, .9, .12, .26, '#f6e04a'); lw([.18, .9, .19], [.32, .9, .19], '#c0392b'); },
    { use: { x: .5, y: 1.5 }, variants: [{ kind: 'fridge' }, { kind: 'fridge', c: '#3a3f4c' }, { kind: 'washer' }, { kind: 'oven' }, { kind: 'dishwasher', c: '#b8bcc0' }, { kind: 'micro' }, { kind: 'washer', c: '#c0392b' }] }),

  F('homegoods.sofa', ['homegoods', 'vignette', 'seating', 'sofa'], [3, 2, 1.6], p => {
    const c = p.c || '#4a7a8a'; rug(.1, .5, 2.8, 1.5, p.rc || '#c0563a', '#f1ede4', { inner: lt(p.rc || '#c0563a', .2) });
    sofa(.2, .1, 2, .9, c); bx(.5, .32, .52, .3, .1, .26, p.pc || '#f2c230'); bx(1.7, .32, .52, .3, .1, .26, lt(c, .4));
    table(2.35, .2, .5, .5, .55, '#8a5a3a'); lamp(2.6, .45, .55, .6, '#f1ede4', { r: .16 }); table(.7, 1.2, 1, .5, .35, '#d2a26a', { thick: true }); bx(.9, 1.3, .35, .3, .2, .04, '#3c64ad');
    qy(.25, .5, 1, .12, .3, '#f6e04a'); lw([.28, 1, .21], [.46, 1, .21], '#c0392b');
  }, { seats: [{ x: .7, y: .65, z: .42, dir: 1 }, { x: 1.7, y: .65, z: .42, dir: 1 }], light: { x: 2.6, y: .8, z: 0, r: 2 }, variants: [{}, { c: '#c0704a', rc: '#3f6a5a', pc: '#f1ede4' }, { c: '#e8dcc4', rc: '#3c5a8a', pc: '#c0392b' }] }),

  F('homegoods.bed', ['homegoods', 'vignette', 'bed'], [2.5, 2.5, 1.3], p => {
    const c = p.c || '#8a5a3a', b = p.b || '#6fa8c8'; rug(0, .6, 2.5, 1.9, p.rc || '#e8dcc4', '#c0a078');
    box(.2, .1, 0, 1.5, .12, 1.2, c); box(.2, .22, 0, 1.5, 2, .3, c); box(.24, .22, .3, 1.42, 1.96, .2, '#f1ede4'); box(.22, .9, .32, 1.46, 1.3, .2, b, { t: lt(b, .1) }); qz(.22, 1.68, .9, 1.05, .525, '#f1ede4');
    bx(.32, .3, .5, .55, .4, .1, '#f8f4ea'); bx(1.02, .3, .5, .55, .4, .1, '#f8f4ea');
    box(1.85, .1, 0, .5, .5, .55, c); frameY(1.9, 2.3, .6, .1, .3, dk(c, .35)); frameY(1.9, 2.3, .6, .32, .5, dk(c, .35)); lamp(2.1, .35, .55, .5, p.lc || '#f2c860', { r: .14 });
    qy(1.2, 1.45, 2.22, .1, .26, '#f6e04a'); lw([1.23, 2.22, .18], [1.41, 2.22, .18], '#c0392b');
  }, { bed: { x: .95, y: 1.3, z: .52, dir: 1 }, light: { x: 2.1, y: .8, z: 0, r: 2 }, variants: [{}, { c: '#f1ede4', b: '#e8a0b0', rc: '#c8b8e8' }, { c: '#3a3f4c', b: '#c0563a', lc: '#f1ede4' }] }),

  F('homegoods.counter', ['homegoods', 'checkout', 'counter'], [2, .5, 1], p => {
    const c = p.c || '#3a5a8a'; counter(0, 0, 2, .5, 1, c, '#f1ede4', { panels: false }); lit(() => lw([.05, .5, .12], [1.95, .5, .12], '#6ad0f0')); signY(p.name || 'HOME+', .3, 1.7, .5, .3, .78, c, '#f6e04a', { frame: false });
    till(.2, .08, 1); monitor(.9, .1, 1, .42, .3, { scr: '#2a8a6a' }); carton(1.5, .1, 1, .36, .3, .26, '#f1ede4', { label: '#3c64ad' });
  }, { vb: [-.3, -.3, 0, 2.3, .8, 1.7], use: { x: .5, y: 1 }, staff: { x: .5, y: -.5, dir: 1 }, variants: [{}, { c: '#c0563a', name: 'VOLT' }] }),

  F('homegoods.kiosk', ['homegoods', 'catalog', 'computer'], [.5, .5, 1.5], p => {
    const c = p.c || '#f1ede4'; box(.05, .05, 0, .4, .4, .08, '#3a3f4c'); box(.17, .12, .08, .16, .16, .9, c);
    box(.03, .1, .98, .44, .1, .46, '#2e3440'); lit(() => { qy(.06, .44, .2, 1.02, 1.4, '#f4f0e8'); qy(.06, .44, .2, 1.3, 1.4, p.a || '#c0563a'); for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) qy(.09 + i * .18, .23 + i * .18, .2, 1.05 + j * .12, 1.14 + j * .12, ['#6fb6d8', '#f2c230', '#9ccc4a', '#e87aa0'][i * 2 + j]); });
  }, { use: { x: .25, y: 1 }, variants: [{}, { a: '#3a5a8a', c: '#3a3f4c' }] }),

  F('homegoods.techshelf', ['homegoods', 'shelf'], [2, .5, 2], p => {
    shelf(0, 0, 0, 2, .5, 1.5, p.c || '#3a3f4c', 'tech', 4, { seed: p.seed || 2, back: '#1e2028', board: '#8a9098', pal: p.pal }); box(0, .1, 1.5, 2, .4, .46, p.hc || '#3a5a8a'); lit(() => signY(p.name || 'GADGETS', 0, 2, .5, 1.5, 1.96, p.hc || '#3a5a8a', '#f4fbfc', { frame: false }));
  }, { use: { x: 1, y: 1 }, variants: [{}, { name: 'AUDIO', hc: '#c0563a', seed: 7 }, { name: 'KITCHEN', hc: '#3f8a55', seed: 4, pal: ['#f1ede4', '#c0392b', '#9fd0e8', '#f2c230', '#f1ede4'], c: '#e8e2d4' }] }),

  F('homegoods.lamps', ['homegoods', 'display', 'lamp'], [1.5, .5, 2], p => {
    const c = '#d2a26a'; box(0, 0, 0, 1.5, .5, .5, c); box(0, 0, .5, 1.5, .25, .4, c); qy(0, 1.5, .5, 0, .06, dk(c, .5));
    lamp(.25, .12, .9, .6, '#e8c060', { r: .15 }); lamp(.75, .12, .9, .85, '#f1ede4', { r: .12 }); lamp(1.25, .12, .9, .55, '#c0563a', { r: .17 });
    lamp(.4, .38, .5, .45, '#6fb6d8', { r: .13 }); lamp(1.05, .38, .5, .5, '#9ccc4a', { r: .12 });
  }, { use: { x: .75, y: 1 }, light: { x: .75, y: 1, z: 0, r: 2.5 } }),

  F('homegoods.tvstand', ['homegoods', 'tv', 'display', 'fun'], [2, .5, 1.6], p => {
    const c = p.c || '#8a5a3a'; box(0, 0, 0, 2, .5, .5, c); frameY(.08, .96, .5, .1, .42, dk(c, .35)); qy(1.06, 1.92, .5, .1, .42, '#2a2028'); box(1.2, .1, .14, .5, .34, .1, '#f1ede4'); lit(() => spx(1.3, .44, .19, 0, 0, '#6ad0f0'));
    bx(.9, .2, .5, .2, .14, .06, '#1e2028'); tv(.15, .22, .56, 1.7, 1.0, p.frame || 0);
    box(-.0, .1, .5, .12, .2, .5, '#2e3440'); box(1.88, .1, .5, .12, .2, .5, '#2e3440');
  }, { use: { x: 1, y: 1.2 }, frames: 6, variants: [{ frame: 3 }, { frame: 0, c: '#f1ede4' }, { frame: 5, c: '#3a3f4c' }] }),

  F('homegoods.demotable', ['homegoods', 'display', 'table'], [2, 1, 1.2], p => {
    table(0, 0, 2, 1, .85, p.c || '#f1ede4', { leg: '#8a9098', thick: true });
    for (let i = 0; i < 3; i++) { const x = .15 + i * .62; bx(x, .2, .85, .44, .3, .02, '#b8bcc0'); bx(x, .2, .87, .44, .03, .28, '#8a9098'); lit(() => { qy(x + .02, x + .42, .23, .89, 1.13, ['#3a6ea5', '#2a8a6a', '#7a55b0'][i]); screenLines(x + .05, x + .4, .23, .91, 1.11, '#e4f6fa', i + 3); }); }
    for (let i = 0; i < 5; i++) { bx(.15 + i * .36, .68, .85, .12, .2, .02, '#2e3440'); lit(() => qz(.16 + i * .36, .26 + i * .36, .7, .86, .871, ['#6ad0f0', '#f6e04a', '#e87aa0', '#5af08a', '#f4fbfc'][i])); }
  }, { use: { x: 1, y: 1.5 }, variants: [{}, { c: '#d2a26a' }] }),

  F('homegoods.rugrolls', ['homegoods', 'decor'], [1, 1, 1.7], p => {
    box(.05, .05, 0, .9, .9, .5, '#d2a26a', { l: PAT.planks('#b8854e', 5), r: PAT.planks('#a07040', 5) });
    [['#c0563a', .3, .3, 1.5], ['#3c5a8a', .65, .3, 1.3], ['#e8c060', .3, .65, 1.2], ['#3f6a5a', .68, .68, 1.4], ['#8a3a5a', .48, .5, 1.6]].sort((a, b) => a[1] + a[2] - b[1] - b[2]).forEach(([c, x, y, h]) => cyl(x, y, .2, .14, h - .2, c, { t: lt(c, .3) }));
  }, {}),
];
export default [...clothing, ...home];
export const galleryItems = [
  compose([clothing, home, generic], 'room.clothing', 8, 6, 2.8, { floor: PAT.fboards('#d8b888'), wall: '#f0d8d0' }, [
    ['clothing.shoewall', .3, 0], ['clothing.shelves', 2.6, .05], ['clothing.fitting', 5, .05], ['clothing.fitting', 6.1, .05, { open: true, cc: '#3c5a8a' }],
    ['clothing.rack', .5, 1.8], ['clothing.rack', .5, 3.0, { seed: 5, pal: 'pastel', sale: true }], ['clothing.roundrack', 3.4, 2], ['clothing.foldtable', 5, 2.3], ['clothing.mannequin', 3.2, 3.6], ['clothing.mannequin', 3.9, 3.9, { shirt: '#f2c230', pant: '#f1ede4' }],
    ['clothing.counter', .5, 4.8], ['dude', 1, 4.4, '#2a2733'], ['clothing.mirror', 7.3, 2], ['clothing.pouf', 6.4, 4], ['clothing.accessories', 5.2, 4.6], ['dude', 6, 3.5, '#3fae6a'],
  ]),
  compose([clothing, home, generic], 'room.homegoods', 9, 7, 2.8, { floor: PAT.ftile('#d8d8d0', '#ccccc4', 1), wall: '#e4e0d4' }, [
    ['homegoods.tvwall', .3, 0], ['homegoods.techshelf', 3.6, .05], ['homegoods.lamps', 5.9, .05], ['homegoods.appliance', 7.7, .1], 
    ['homegoods.appliance', 7.8, 1.3, { kind: 'washer' }], ['homegoods.appliance', 7.8, 2.4, { kind: 'oven' }],
    ['homegoods.sofa', .3, 1.8], ['homegoods.bed', 3.8, 1.6], ['homegoods.demotable', .5, 4.6], ['homegoods.plinth', 3.3, 4.6, { item: 'speaker' }], ['homegoods.plinth', 4.5, 4.9, { item: 'vase', c: '#3a3f4c' }], ['homegoods.kiosk', 6.2, 4.4], ['dude', 6.45, 5.3, '#e8843a'],
    ['homegoods.counter', 6.6, 5.9], ['dude', 7.1, 5.5, '#3a5a8a'], ['homegoods.rugrolls', .2, 5.9],
  ]),
];
