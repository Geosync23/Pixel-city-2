// Bookstore & library fixtures.
import { box, qy, qx, qz, lw, fq, glow, lit, ball, cyl, dk, lt, mix, PAT, textY, signY, spx, hash2, rng } from '../../engine/raster.js';
import { F, K, bx, tube, post, posts, frameY, frameX, frameZ, table, rtable, chair, stool, sofa, counter, till, monitor, goods, shelf, heap, heap2, carton, plant, compose, steam, plate, cup, bottle, lamp, candle, rug, pleat, screenY, screenLines, mirrorY, dude, keyboard, PX } from './_lib.js';
import generic from './generic.js';
const BL = ['bookstore', 'library'];
const BC = ['#a83a3a', '#2f5f8f', '#3f7a55', '#d8b040', '#6a4a8a', '#c86a3a', '#e8dcc0', '#2f6f6f'];
const bookstack = (x, y, z, n, s) => { for (let i = 0; i < n; i++) { const c = BC[(i * 3 + s) % BC.length], o = (hash2(i, s) - .5) * .04; bx(x + o, y, z + i * .05, .24, .18, .05, c); lw([x + o, y + .18, z + i * .05 + .02], [x + o + .24, y + .18, z + i * .05 + .02], '#f1ede4'); } };
const upright = (x, y, z, c) => { bx(x, y, z, .18, .05, .26, c); qy(x + .03, x + .15, y + .05, z + .14, z + .2, lt(c, .5)); };
/** green banker's lamp */
const banker = (x, y, z) => { cyl(x, y, z, .07, .02, '#d8a848', { ol: false }); post(x, y, z, z + .2, '#d8a848'); bx(x - .12, y - .05, z + .2, .24, .12, .08, '#2f8a55'); lw([x - .12, y + .07, z + .27], [x + .12, y + .07, z + .27], '#6fd098'); glow(() => { bx(x - .12, y - .05, z + .2, .24, .12, .08, '#9cf2b0'); qz(x - .2, x + .2, y - .05, y + .3, z + .01, '#ffe6a0', 'glass'); }); lit(() => lw([x - .1, y + .07, z + .2], [x + .1, y + .07, z + .2], '#fff2c4')); };
const books = [
  F('books.shelf', [...BL, 'shelf', 'bookshelf', 'shelvestation'], p => [p.w || 2, .5, 2.3], p => {
    const w = p.w || 2, c = p.c || '#8a5a3a';
    box(0, 0, 0, w, .5, 2.2, c, { l: goods('books', 5, { seed: p.seed || 1, back: dk(c, .55), board: lt(c, .1), pal: p.pal }) });
    qy(0, PX, .5, 0, 2.2, c); qy(w - PX, w, .5, 0, 2.2, c); qy(0, w, .5, 0, .1, dk(c, .3)); box(-.03, -.02, 2.2, w + .06, .56, .08, dk(c, .08));
    if (w >= 2) lw([w / 2, .5, .1], [w / 2, .5, 2.2], c);
    if (p.face) for (let i = 0; i < w * 2; i++) { const z = .1 + (2.1 / 5) * (1 + (i * 2) % 4) + .03; upright(.12 + i * .46, .46, z, BC[(i + (p.seed || 0)) % BC.length]); }
    if (p.label) { qy(w / 2 - .22, w / 2 + .22, .54, 2.2, 2.28, '#d8a848'); }
  }, { use: { x: 1, y: 1 }, variants: [{ seed: 1 }, { seed: 4, face: true }, { seed: 7, c: '#5a3a28', label: true }, { seed: 9, c: '#e8dcc4', pal: ['#e87aa0', '#6fb6d8', '#f2c230', '#9ccc4a', '#f1ede4', '#e8843a', '#7a55b0'] }, { seed: 12, w: 1 }, { seed: 15, c: '#3a4a5a', face: true }] }),

  F('books.lowshelf', [...BL, 'shelf', 'bookshelf'], [2, .5, 1.3], p => {
    const c = p.c || '#8a5a3a'; box(0, 0, 0, 2, .5, 1.05, c, { l: goods('books', 2, { seed: p.seed || 3, back: dk(c, .55), board: lt(c, .1) }) }); qy(0, 2, .5, 0, .1, dk(c, .3)); qy(0, PX, .5, 0, 1.05, c); qy(2 - PX, 2, .5, 0, 1.05, c);
    for (let i = 0; i < 4; i++) upright(.2 + i * .45, .2, 1.05, BC[(i * 2 + (p.seed || 0)) % BC.length]); if (p.plant) plant(1.8, .2, 1.05, .6);
  }, { use: { x: 1, y: 1 }, variants: [{}, { c: '#e8dcc4', seed: 8, plant: true }] }),

  F('books.ladder', [...BL, 'decor', 'ladder'], [.5, 1, 2.2], p => {
    const c = p.c || '#b07444'; tube([.06, .9, 0], [.06, .1, 2.15], c); for (let i = 1; i < 8; i++) { const k = i / 8.5; tube([.06, .9 - .8 * k, 2.15 * k], [.44, .9 - .8 * k, 2.15 * k], lt(c, .15)); } tube([.44, .9, 0], [.44, .1, 2.15], dk(c, .1));
    for (const x of [.06, .44]) { spx(x, .9, 0, 0, -1, '#2a2733'); spx(x, .9, 0, 1, -1, '#2a2733'); }
  }, { variants: [{}, { c: '#5a3a28' }] }),

  F('library.table', ['library', 'bookstore', 'table', 'seating', 'reading'], [2, 2, 1.2], p => {
    const c = p.c || '#8a5a3a', cc = p.cc || '#5a3a28';
    chair(.25, 0, 1, cc); chair(1.25, 0, 1, cc);
    table(0, .5, 2, 1, .75, c, { thick: true }); lw([0, 1, .75], [2, 1, .75], dk(c, .2));
    banker(.5, .95, .75); banker(1.5, .95, .75);
    fq([[.3, 1.15, .76], [.6, 1.15, .76], [.6, 1.4, .76], [.3, 1.4, .76]], '#f8f4ea'); lw([.45, 1.15, .76], [.45, 1.4, .76], '#b8b0a0'); bookstack(1.3, 1.2, .75, 3, p.seed || 1); bookstack(.9, .6, .75, 2, 4);
    chair(.25, 1.5, 3, cc); chair(1.25, 1.5, 3, cc);
  }, { seats: [{ x: .5, y: .25, z: .45, dir: 1 }, { x: 1.5, y: .25, z: .45, dir: 1 }, { x: .5, y: 1.75, z: .45, dir: 3 }, { x: 1.5, y: 1.75, z: .45, dir: 3 }], light: { x: 1, y: 1, z: 0, r: 2 }, variants: [{}, { c: '#5a3a28', cc: '#3f6a5a', seed: 5 }] }),

  F('library.desk', ['library', 'libstation', 'checkout', 'counter'], [2.5, .5, 1.1], p => {
    const c = p.c || '#6a4a30'; counter(0, 0, 2.5, .5, 1.0, c, lt(c, .3), { pw: .62 });
    signY(p.name || 'LIBRARY', .5, 2.0, .5, .32, .78, '#2f4a3a', '#f6e8c8');
    monitor(.25, .08, 1, .42, .3, { scr: '#2a6a5a' }); bx(.85, .15, 1, .12, .12, .08, '#3a3f4c'); bx(.87, .17, 1.08, .08, .08, .06, '#8a5a3a'); // date stamp
    bookstack(1.2, .12, 1, 4, 2); bookstack(1.55, .14, 1, 2, 5); banker(2.2, .2, 1);
  }, { vb: [-.3, -.3, 0, 2.8, .8, 1.7], use: { x: 1.4, y: 1 }, staff: { x: .6, y: -.5, dir: 1 }, variants: [{}, { name: 'RETURNS', c: '#8a5a3a' }] }),

  F('library.cart', ['library', 'bookstore', 'bookcart', 'shelvestation'], [1, .5, 1.1], p => {
    const c = p.c || '#7d858e'; posts(.04, .06, .92, .38, .06, 1.0, c);
    for (let i = 0; i < 3; i++) { const z = .12 + i * .34; box(.02, .04, z, .96, .42, .04, lt(c, .2)); if (i < 2 || !p.empty) qy(.06, .94, .46, z + .04, z + .3, goods('books', 1, { seed: (p.seed || 2) + i, back: '#00000000', board: lt(c, .2) })); }
    tube([.04, .06, 1.0], [.04, .44, 1.0], '#3a3f4c'); for (const [a, b] of [[.08, .44], [.92, .44], [.92, .08]]) { spx(a, b, 0, 0, -1, '#2a2733'); spx(a, b, 0, 1, -1, '#2a2733'); spx(a, b, 0, 0, -2, '#2a2733'); }
  }, { use: { x: .5, y: 1 }, variants: [{}, { empty: true, seed: 6 }] }),

  F('library.catalog', ['library', 'decor', 'catalog'], [1.5, .5, 1.4], p => {
    const c = '#8a5a3a'; posts(.06, .06, 1.38, .38, 0, .35, dk(c, .3)); box(0, 0, .3, 1.5, .5, 1.0, c);
    for (let i = 0; i < 6; i++) for (let j = 0; j < 5; j++) { const x = .06 + i * .235, z = .36 + j * .18; qy(x, x + .2, .5, z, z + .14, lt(c, .12)); frameY(x, x + .2, .5, z, z + .14, dk(c, .35)); spx(x + .1, .5, z + .06, 0, 0, '#d8a848'); spx(x + .1, .5, z + .1, 0, 0, '#f1ede4'); spx(x + .1, .5, z + .1, -1, 0, '#f1ede4'); }
    plant(.3, .25, 1.3, .6, { kind: 'snake' }); bookstack(.9, .15, 1.3, 2, 3);
  }, { use: { x: .75, y: 1 } }),

  F('library.computer', ['library', 'bookstore', 'computer', 'seating'], [1, 1, 1.4], p => {
    const c = p.c || '#d2a26a';
    box(0, 0, 0, .05, .5, 1.3, dk(c, .1)); bx(0, 0, 0, 1, .05, 1.3, dk(c, .15)); bx(.95, 0, .7, .05, .5, .6, dk(c, .1));
    table(.05, .05, .9, .45, .75, c, { inset: .03 }); monitor(.28, .1, .75, .46, .34, { scr: p.scr || '#3a6ea5', seed: p.seed || 2 }); keyboard(.34, .34, .751);
    chair(.25, .5, 3, p.cc || '#3a5a8a');
  }, { use: { x: .5, y: 1.1 }, seats: [{ x: .5, y: .75, z: .45, dir: 3 }], variants: [{}, { scr: '#2a8a6a', cc: '#c0563a', seed: 5 }, { scr: '#f4f0e8', seed: 7 }] }),

  F('bookstore.table', ['bookstore', 'table', 'shelf', 'display'], [2, 1, 1.4], p => {
    const c = p.c || '#d2a26a'; table(0, 0, 2, 1, .7, c, { thick: true });
    box(.5, .2, .7, 1, .3, .2, dk(c, .08)); for (let i = 0; i < 4; i++) upright(.56 + i * .24, .3, .9, BC[(i + (p.seed || 0)) % BC.length]);
    for (let i = 0; i < 5; i++) bookstack(.08 + i * .38, .62, .7, 2 + (i * 7 + (p.seed || 0)) % 4, i + (p.seed || 0)); bookstack(.1, .2, .7, 4, 3); bookstack(1.62, .2, .7, 3, 6);
    post(1, .25, .9, 1.3, '#8a9098'); box(.6, .22, 1.2, .8, .05, .44 - .2, p.sc || '#c0392b'); 
  }, { use: { x: 1, y: 1.5 }, variants: [{}, { c: '#f1ede4', seed: 3, sc: '#3c64ad' }] }),

  F('bookstore.till', ['bookstore', 'checkout', 'counter'], [2, .5, 1], p => {
    const c = p.c || '#3f5a4a'; counter(0, 0, 2, .5, 1, c, '#d2a26a', { pw: .5 }); signY('BOOKS', .35, 1.65, .5, .3, .76, '#f6e8c8', c);
    till(.2, .08, 1); bookstack(.8, .14, 1, 3, 1); cyl(1.3, .25, 1, .07, .12, '#3c64ad', { ol: false }); for (let i = 0; i < 4; i++) post(1.26 + i * .03, .25, 1.12, 1.26, ['#c0392b', '#f2c230', '#3f8a55', '#2a2733'][i]);
    box(1.6, .12, 1, .3, .06, .3, '#f1ede4', { ol: false }); qy(1.64, 1.86, .18, 1.06, 1.26, '#e87aa0', '#f2c230');
  }, { vb: [-.3, -.3, 0, 2.3, .8, 1.6], use: { x: .5, y: 1 }, staff: { x: .5, y: -.5, dir: 1 }, variants: [{}, { c: '#8a3a3a' }] }),

  F('library.globe', ['library', 'bookstore', 'decor'], [.5, .5, 1.3], p => {
    cyl(.25, .25, 0, .18, .05, '#5a3a28'); tube([.25, .25, .05], [.25, .25, .7], '#8a5a3a'); ball(.25, .25, .98, .24, '#4a90c8'); for (let i = 0; i < 9; i++) spx(.25, .25, .98, Math.round((hash2(i, 1) - .5) * 7), Math.round((hash2(i, 2) - .5) * 7), i % 3 ? '#6fb858' : '#d8c070');
    lw([.08, .25, .8], [.42, .25, 1.18], '#d8a848');
  }, {}),

  F('library.returns', ['library', 'returns'], [1, .5, 1.1], p => {
    const c = p.c || '#3c5a8a'; box(0, 0, 0, 1, .5, 1.05, c); qy(0, 1, .5, 0, .08, dk(c, .5)); qy(.15, .85, .5, .78, .88, '#1e2028'); lw([.15, .5, .78], [.85, .5, .78], '#d5dbe0'); signY('IN', .2, .8, .5, .25, .69, '#f1ede4', c);
  }, { use: { x: .5, y: 1 }, variants: [{}, { c: '#8a3a3a' }] }),

  F('bookstore.spinner', ['bookstore', 'decor', 'shelf'], [.5, .5, 1.7], p => {
    cyl(.25, .25, 0, .2, .05, '#3a3f4c'); tube([.25, .25, .05], [.25, .25, 1.62], '#8a9098');
    for (let i = 0; i < 4; i++) { const z = .4 + i * .3; box(.08, .08, z, .34, .34, .26, '#f1ede4', { l: goods('mags', 1, { seed: i + (p.seed || 1), back: '#f1ede4', board: '#8a9098', pal: BC }), r: goods('mags', 1, { seed: i + 9, back: '#d8d2c4', board: '#8a9098', pal: BC }), ol: false }); }
    cyl(.25, .25, 1.6, .1, .05, '#c0392b', { ol: false });
  }, { use: { x: .25, y: 1 }, variants: [{ seed: 1 }, { seed: 5 }] }),

  F('books.piles', [...BL, 'decor'], [.5, .5, .7], p => { const s = p.seed || 1; bookstack(.03, .04, 0, 6 + s % 4, s); bookstack(.22, .28, 0, 3 + s % 3, s + 3); },
    { variants: [{ seed: 1 }, { seed: 2 }, { seed: 7 }] }),
];
export default books;
export const galleryItems = [
  compose([books, generic], 'room.library', 9, 7, 3, { floor: PAT.fboards('#a87848'), wall: '#d8c8a8', dado: 1, dadoc: '#5a4030' }, [
    ['books.shelf', .3, .05], ['books.shelf', 2.4, .05, { seed: 4, face: true }], ['books.shelf', 4.5, .05, { seed: 7, c: '#5a3a28' }], ['books.shelf', 6.6, .05, { seed: 12 }], ['books.ladder', 3.2, .5],
    ['library.table', 1, 2.4], ['library.table', 4, 2.6, { c: '#5a3a28', cc: '#3f6a5a' }], ['library.computer', 7.5, 2], ['library.computer', 7.5, 3.2, { scr: '#2a8a6a', cc: '#c0563a' }],
    ['library.desk', .5, 5.6], ['dude', 1.1, 5.2, '#7a55b0'], ['library.cart', 3.6, 5.2], ['library.catalog', 5.2, 5.8], ['library.globe', 7.2, 5.6], ['library.returns', 7.6, 4.6 + 99], ['dude', 6.2, 4.7, '#3f8a55'],
  ].filter(i => i[2] < 50)),
  compose([books, generic], 'room.bookstore', 7, 5.5, 2.8, { floor: PAT.fboards('#c89a64'), wall: '#3f5a4a' }, [
    ['books.shelf', .3, .05, { seed: 9, c: '#e8dcc4', pal: ['#e87aa0', '#6fb6d8', '#f2c230', '#9ccc4a', '#f1ede4', '#e8843a', '#7a55b0'] }], ['books.shelf', 2.4, .05, { seed: 15, c: '#3a4a5a', face: true }], ['books.shelf', 4.5, .05, { seed: 3 }],
    ['bookstore.table', 1.2, 1.8], ['books.lowshelf', 4.2, 2.2, { c: '#e8dcc4', seed: 8, plant: true }], ['bookstore.till', .4, 4.2], ['dude', .9, 3.8, '#c0563a'], ['bookstore.spinner', 3, 4.2], ['books.piles', 6.3, .9], ['library.returns', 4.5, 4.2], ['dude', 3.3, 2.9 + .3, '#6a8ad8'],
  ]),
];
