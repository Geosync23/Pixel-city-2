// Cafe & bakery fixtures.
import { box, qy, qx, qz, lw, glow, lit, ball, cyl, dk, lt, mix, PAT, textY, signY, spx, hash2, rng } from '../../engine/raster.js';
import { F, K, bx, tube, post, posts, frameY, frameX, frameZ, table, rtable, chair, stool, sofa, counter, till, goods, shelf, heap, heap2, carton, plant, compose, steam, plate, cup, bottle, lamp, rug, screenY, PX } from './_lib.js';
import generic from './generic.js';
const CB = ['cafe', 'bakery'];
const W = '#8a5a3a';
function espresso(x, y, z, c) {
  box(x, y, z, .62, .36, .1, '#3a3f4c'); box(x, y, z + .1, .62, .2, .3, c); box(x, y, z + .32, .62, .36, .1, c, { t: '#d5dbe0' });
  qy(x + .04, x + .58, y + .2, z + .12, z + .3, '#2a2733'); for (const k of [.16, .46]) { post(x + k, y + .24, z + .2, z + .3, '#d5dbe0'); cup(x + k, y + .27, z + .1, '#f4f0e8'); }
  lw([x + .05, y + .36, z + .37], [x + .57, y + .36, z + .37], lt(c, .5)); lit(() => { spx(x + .5, y + .36, z + .37, 0, 0, '#ff5a4a'); spx(x + .44, y + .36, z + .37, 0, 0, '#5af08a'); });
  for (const k of [.12, .26, .4]) cup(x + k, y + .12, z + .42, '#f4f0e8'); steam(x + .3, y + .3, z + .5, 3);
}
function pastries(x0, x1, y0, y1, z, s) { qz(x0, x1, y0, y1, z, '#f4f0e8'); qz(x0 + .03, x1 - .03, y0 + .03, y1 - .03, z, heap2(['#e0b468', '#c88838', '#f4d8a0', '#e87aa0', '#8a4a2a', '#f4f0e8', '#d8a050', '#d63a3a'], 6, s)); }
function glassCase(x, y, z, w, d, h, s, o) {
  o = o || {};
  lit(() => { bx(x, y, z, w, d, .03, '#f4f0e8'); qy(x, x + w, y + .02, z, z + h, '#f6e8c8'); pastries(x + .04, x + w - .04, y + .06, y + d - .04, z + .03, s); bx(x + .03, y + .03, z + h * .5, w - .06, d * .55, .03, '#e4f2f4'); pastries(x + .06, x + w - .06, y + .06, y + d * .5, z + h * .5 + .03, s + 3); });
  qy(x, x + w, y + d, z, z + h, '#e4f6fa', 'glass'); qx(x + w, y, y + d, z, z + h, '#c4e2ea', 'glass');
  frameY(x, x + w, y + d, z, z + h, '#7a8690'); frameX(x + w, y, y + d, z, z + h, '#7a8690'); box(x, y, z + h, w, d, .04, o.top || '#d5dbe0');
  lw([x + .1, y + d, z + h - .08], [x + .3, y + d, z + h * .4], '#f8feff');
}
const cafe = [
  F('cafe.bar', ['cafe', 'bakery', 'baristastation', 'counter'], [2.5, .5, 1], p => {
    const c = p.c || W;
    counter(0, 0, 2.5, .5, 1, c, p.top || '#e8dcc4', { pw: .5 }); if (p.tile) qy(0, 2.5, .5, .1, .9, PAT.ftile ? PAT.brick(p.tile, lt(p.tile, .5)) : p.tile);
    espresso(.15, .06, 1, p.mc || '#c0392b');
    box(.95, .1, 1, .22, .22, .3, '#3a3f4c'); cyl(1.06, .21, 1.3, .1, .2, '#b4dbe8', { t: '#6a4a30' }); // grinder
    for (let i = 0; i < 3; i++) cyl(1.45, .25, 1 + i * .05, .06, .05, i % 2 ? '#f4f0e8' : '#e8dcc4', { ol: false }); cyl(1.45, .25, 1.15, .06, .02, '#f4f0e8');
    cyl(1.75, .22, 1, .08, .22, '#d5dbe0'); post(1.75, .22, 1.22, 1.28, '#3a3f4c'); // milk jug
    box(2.05, .12, 1, .3, .26, .05, '#5a3a28'); cup(2.14, .26, 1.05, '#f4f0e8'); cup(2.28, .22, 1.05, '#9fd0e8');
  }, { vb: [-.3, -.3, 0, 2.8, .8, 1.8], use: { x: 2, y: 1 }, staff: { x: .6, y: -.5, dir: 1 }, variants: [{}, { c: '#3f6a5a', mc: '#d5dbe0', top: '#f1ede4' }, { c: '#e8dcc4', tile: '#6fa8b8', mc: '#3a3f4c', top: '#8a5a3a' }] }),

  F('cafe.till', ['cafe', 'bakery', 'checkout', 'counter'], [1.5, .5, 1], p => {
    const c = p.c || W; counter(0, 0, 1.5, .5, 1, c, p.top || '#e8dcc4', { pw: .5 });
    till(.2, .08, 1); cyl(.75, .3, 1, .07, .16, '#b4dbe8', { t: '#f2c230' }); spx(.75, .3, 1.06, 0, 0, '#f2c230'); spx(.75, .3, 1.06, 1, 1, '#d5dbe0'); // tip jar
    box(.95, .1, 1, .4, .3, .04, '#5a3a28'); for (let i = 0; i < 3; i++) ball(1.05 + i * .1, .25, 1.09, .06, ['#e0b468', '#c88838', '#8a4a2a'][i], { ol: false });
    qy(.3, 1.2, .5, .3, .75, '#2f3a34'); frameY(.3, 1.2, .5, .3, .75, '#d2a26a'); textY('TO GO', .4, .5, .68, '#f4f0e8'); lw([.45, .5, .42], [1.05, .5, .42], '#f6e08a');
  }, { vb: [-.3, -.3, 0, 1.8, .8, 1.6], use: { x: .5, y: 1 }, staff: { x: .5, y: -.5, dir: 1 }, variants: [{}, { c: '#3f6a5a', top: '#f1ede4' }] }),

  F('cafe.pastrycase', ['cafe', 'bakery', 'display', 'shelf'], [1.5, .5, 1.3], p => {
    const c = p.c || W; box(0, 0, 0, 1.5, .5, .55, c); qy(0, 1.5, .5, 0, .08, dk(c, .5)); frameY(.08, 1.42, .5, .16, .46, dk(c, .34));
    glassCase(0, 0, .55, 1.5, .5, .7, p.seed || 1);
  }, { use: { x: .75, y: 1 }, variants: [{ seed: 1 }, { seed: 5, c: '#3f6a5a' }, { seed: 9, c: '#e8dcc4' }] }),

  F('cafe.menu', ['cafe', 'bakery', 'menu', 'decor'], [2, .1, 2.5], p => {
    if (p.kind === 'lit') { box(0, 0, 1.5, 2, .08, .9, '#2a2733'); for (let i = 0; i < 3; i++) { const x = .05 + i * .65; lit(() => { qy(x, x + .6, .08, 1.55, 2.35, i === 1 ? '#f6e8c8' : '#3a2a22'); for (let r = 0; r < 5; r++) { lw([x + .06, .08, 2.2 - r * .13], [x + .3 + hash2(i, r) * .15, .08, 2.2 - r * .13], i === 1 ? '#5a3a28' : '#f6e8c8'); lw([x + .5, .08, 2.2 - r * .13], [x + .55, .08, 2.2 - r * .13], '#f2a030'); } if (i === 1) { ball(x + .3, .09, 1.72, .1, '#c88838', { ol: false }); } }); } return; }
    const b = p.b || '#2f3a34'; box(0, 0, 1.45, 2, .06, 1, '#8a5a3a'); qy(.06, 1.94, .06, 1.51, 2.39, b);
    textY(p.name || 'MENU', .15, .06, 2.33, '#f4f0e8'); lw([.15, .06, 1.96], [.75, .06, 1.96], '#f6e08a');
    for (let r = 0; r < 4; r++) { lw([.15, .06, 1.88 - r * .1], [.4 + hash2(r, 1) * .3, .06, 1.88 - r * .1], '#e8e2d4'); lw([.8, .06, 1.88 - r * .1], [.88, .06, 1.88 - r * .1], '#f4b8c8'); }
    for (let r = 0; r < 6; r++) { lw([1.1, .06, 2.3 - r * .12], [1.4 + hash2(r, 4) * .25, .06, 2.3 - r * .12], r % 3 ? '#e8e2d4' : '#9fd0e8'); lw([1.78, .06, 2.3 - r * .12], [1.86, .06, 2.3 - r * .12], '#f6e08a'); }
    cyl(1.3, .07, 1.56, .08, .1, '#f4f0e8', { ol: false, t: '#6a4a30' }); 
  }, { wall: true, mount: 1.45, solid: false, vb: [-.1, 0, 1.4, 2.1, .3, 2.6], variants: [{}, { name: 'BREAD', b: '#2a2733' }, { kind: 'lit' }] }),

  F('cafe.tableset', ['cafe', 'bakery', 'table', 'seating'], [2, 1, 1], p => {
    const c = p.c || '#d2a26a', cc = p.cc || '#3f6a5a';
    chair(0, .25, 0, cc); if (p.sq) table(.6, .1, .8, .8, .75, c, { leg: '#4a4458' }); else rtable(1, .5, .38, .75, c);
    cup(.85, .5, .75); if (!p.empty) { plate(1.12, .45, .75, '#f4f0e8', '#e0b468'); cup(1.1, .68, .75, '#9fd0e8'); }
    chair(1.5, .25, 2, cc);
  }, { seats: [{ x: .25, y: .5, z: .45, dir: 0 }, { x: 1.75, y: .5, z: .45, dir: 2 }], variants: [{}, { c: '#f1ede4', cc: '#c0563a' }, { sq: true, c: '#8a5a3a', cc: '#e8c060', empty: true }] }),

  F('cafe.chair', ['cafe', 'bakery', 'seating', 'chair'], [.5, .5, 1], p => chair(0, 0, p.dir === undefined ? 1 : p.dir, p.c || '#3f6a5a'),
    { seats: [{ x: .25, y: .25, z: .45, dir: 1 }], seatDirFromParam: 'dir', variants: [{ dir: 1 }, { dir: 0, c: '#c0563a' }, { dir: 3, c: '#e8c060' }, { dir: 2, c: '#8a5a3a' }] }),

  F('cafe.windowbar', ['cafe', 'bakery', 'seating'], p => [p.n || 2, 1, 1.1], p => {
    const n = p.n || 2, c = p.c || '#d2a26a';
    bx(0, 0, 0, n, .06, 1.0, dk(c, .2)); for (let x = .1; x < n; x += .9) lw([x, .4, .55], [x, .06, 1.0], '#4a4458');
    box(0, 0, 1.0, n, .45, .07, c); for (let i = 0; i < n; i++) { if (i % 2 === 0) cup(.4 + i, .22, 1.07); else plate(.5 + i, .22, 1.07, '#f4f0e8', '#c88838'); }
    for (let i = 0; i < n; i++) stool(.5 + i, .75, .7, p.sc || '#c0563a', { ring: true });
  }, { seats: p => Array.from({ length: p.n || 2 }, (_, i) => ({ x: .5 + i, y: .75, z: .7, dir: 3 })), variants: [{ n: 2 }, { n: 3, sc: '#3f6a5a' }] }),

  F('cafe.armchair', ['cafe', 'bookstore', 'library', 'seating', 'armchair'], [1, 1, .95], p => sofa(0, 0, 1, .9, p.c || '#8a5a8a'),
    { seats: [{ x: .5, y: .55, z: .42, dir: 1 }], variants: [{}, { c: '#c0704a' }, { c: '#4a7a6a' }, { c: '#c8a850' }] }),

  F('cafe.lowtable', ['cafe', 'bookstore', 'table'], [1, 1, .5], p => {
    rtable(.5, .5, .4, .45, p.c || '#8a5a3a', { leg: '#5a3a28' }); cup(.4, .5, .45); bx(.52, .38, .45, .22, .16, .03, '#3c64ad'); bx(.54, .4, .48, .2, .14, .02, '#f1ede4');
  }, { variants: [{}, { c: '#f1ede4' }] }),

  F('cafe.condiments', ['cafe', 'bakery', 'decor'], [1, .5, 1.2], p => {
    const c = '#8a5a3a'; box(0, 0, 0, 1, .5, .95, c); qy(0, 1, .5, 0, .08, dk(c, .5)); frameY(.08, .48, .5, .15, .8, dk(c, .34)); frameY(.52, .92, .5, .15, .8, dk(c, .34)); box(-.03, -.02, .95, 1.06, .56, .05, '#e8dcc4');
    cyl(.2, .25, 1, .09, .24, '#d5dbe0'); post(.2, .25, 1.24, 1.3, '#3a3f4c'); cyl(.45, .25, 1, .09, .24, '#f1ede4'); post(.45, .25, 1.24, 1.3, '#3a3f4c');
    box(.62, .14, 1, .3, .24, .08, '#5a3a28', { t: heap2(['#f4f0e8', '#f4b8c8', '#f6e08a', '#c8a070'], 8, 1) }); for (let i = 0; i < 4; i++) post(.68 + i * .06, .2, 1.08, 1.2, i % 2 ? '#f4f0e8' : '#8a5a3a');
  }, { use: { x: .5, y: 1 } }),

  /* ---- bakery ---- */
  F('bakery.shelves', ['bakery', 'cafe', 'shelf'], [2, .5, 2.1], p => {
    const w = '#a8743f';
    box(0, 0, 0, 2, .5, .5, w); frameY(.08, .96, .5, .12, .42, dk(w, .34)); frameY(1.04, 1.92, .5, .12, .42, dk(w, .34));
    bx(0, 0, .5, 2, .08, 1.5, dk(w, .15));
    for (let i = 0; i < 3; i++) { const z = .5 + i * .48; box(0, .06, z, 2, .44 - i * .06, .05, w);
      for (let j = 0; j < 4; j++) { const x = .08 + j * .48, k = (i + j + (p.seed || 0)) % 4;
        if (k === 0) { box(x, .14, z + .05, .4, .26 - i * .04, .14, '#c8a068', { t: '#8a6a40' }); for (let b = 0; b < 4; b++) tube([x + .08 + b * .08, .3 - i * .05, z + .1], [x + .1 + b * .08, .2, z + .45], '#d8a050'); }
        else if (k === 1) for (let b = 0; b < 3; b++) ball(x + .08 + b * .13, .3 - i * .05, z + .13, .085, '#c88838', { ol: false, squash: .7 });
        else if (k === 2) { bx(x, .16, z + .05, .38, .22 - i * .04, .12, '#e0b468'); lw([x, .38 - i * .04, z + .17], [x + .38, .38 - i * .04, z + .17], '#f4d8a0'); bx(x + .05, .16, z + .17, .28, .2 - i * .04, .1, '#d8a050'); }
        else { bx(x + .02, .2, z + .05, .34, .16, .04, '#f4f0e8'); for (let b = 0; b < 3; b++) ball(x + .08 + b * .11, .28, z + .13, .055, ['#e87aa0', '#8a4a2a', '#f4d8a0'][b], { ol: false }); } } }
    post(0, .5, .5, 2.0, dk(w, .4)); post(2, .5, .5, 2.0, dk(w, .4)); box(0, 0, 2.0, 2, .5, .06, w);
  }, { use: { x: 1, y: 1 }, variants: [{ seed: 0 }, { seed: 1 }, { seed: 2 }] }),

  F('bakery.oven', ['bakery', 'bakestation', 'oven'], [1.5, 1, 2], p => {
    const c = '#b8bcc0'; box(0, 0, 0, 1.5, 1, 1.85, c); qy(0, 1.5, 1, 0, .25, dk(c, .35)); box(.1, .1, 1.85, .5, .5, .15, dk(c, .3));
    for (let i = 0; i < 3; i++) { const z = .35 + i * .5; qy(.08, 1.12, 1, z, z + .4, '#3a3f4c'); qy(.14, 1.06, 1, z + .08, z + .32, '#2a2028');
      lit(() => { qy(.14, 1.06, 1, z + .08, z + .14, '#f08a30', '#e8643a'); for (let b = 0; b < 4; b++) qy(.2 + b * .22, .36 + b * .22, 1, z + .14, z + .22, '#e0b468'); }); glow(() => qy(.14, 1.06, 1, z + .14, z + .32, '#ffb050', '#f08a30'));
      tube([.2, 1.02, z + .36], [1.0, 1.02, z + .36], '#e4e8ec'); }
    qy(1.2, 1.44, 1, .4, 1.75, '#3a3f4c'); lit(() => { qy(1.24, 1.4, 1, 1.5, 1.68, '#f08a30'); for (let i = 0; i < 4; i++) spx(1.28, 1, 1.35 - i * .14, 0, 0, i % 2 ? '#5af08a' : '#ff5a4a'); }); for (let i = 0; i < 4; i++) spx(1.36, 1, 1.35 - i * .14, 0, 0, '#d5dbe0');
  }, { use: { x: .6, y: 1.5 }, variants: [{}] }),

  F('bakery.worktable', ['bakery', 'bakestation', 'prepstation'], [2, 1, .95], p => {
    table(0, 0, 2, 1, .9, '#d8c8a0', { leg: '#8a9098', thick: true }); bx(.1, .1, .25, 1.8, .8, .04, '#b8bcc0');
    bx(.3, .3, .29, .4, .4, .3, '#f1ede4'); bx(1.1, .3, .29, .5, .4, .2, '#c8a068');
    qz(.2, .9, .2, .8, .9, '#f4f0e8', '#e8dcc4'); ball(.45, .5, .97, .13, '#f0deb0', { ol: false, squash: .6 }); ball(.72, .42, .95, .09, '#f0deb0', { ol: false, squash: .6 });
    tube([1.0, .7, .94], [1.5, .55, .94], '#b07444'); cyl(1.7, .3, .9, .13, .14, '#d5dbe0', { t: '#f4f0e8' }); bx(1.25, .15, .9, .4, .25, .03, '#3a3f4c'); for (let i = 0; i < 3; i++) ball(1.33 + i * .12, .28, .96, .05, '#e0b468', { ol: false });
  }, { use: { x: 1, y: 1.5 }, variants: [{}] }),

  F('bakery.sacks', ['bakery', 'decor'], [1, .5, .8], p => {
    const c = '#e8dcc0', sack = (x, y, z, w) => { box(x, y, z, w, .42, .24, c, { t: lt(c, .3) }); qy(x + w * .3, x + w * .7, y + .42, z + .06, z + .18, p.lc || '#c0563a'); lw([x + .03, y + .42, z + .22], [x + w - .03, y + .42, z + .22], dk(c, .25)); };
    sack(0, .04, 0, .5); sack(.5, .04, 0, .5); sack(.22, .04, .24, .5); if (p.n > 3) sack(.3, .04, .48, .46);
  }, { variants: [{ n: 3 }, { n: 4, lc: '#3c64ad' }] }),

  F('bakery.counter', ['bakery', 'cafe', 'checkout', 'counter'], [2.5, .5, 1.3], p => {
    const c = p.c || '#e8dcc4'; box(0, 0, 0, 2.5, .5, .55, c, { l: PAT.planks(dk(c, .18), 6) }); qy(0, 2.5, .5, 0, .08, dk(c, .5));
    glassCase(0, 0, .55, 1.6, .5, .5, p.seed || 2); box(1.6, 0, .55, .9, .5, .45, c); box(1.56, -.02, 1.0, .98, .56, .06, '#8a5a3a');
    till(1.75, .1, 1.06); box(.15, .08, 1.09, .5, .3, .16, '#c8a068', { t: '#8a6a40' }); for (let b = 0; b < 5; b++) tube([.22 + b * .08, .28, 1.2], [.24 + b * .09, .16, 1.6], b % 2 ? '#d8a050' : '#c88838');
    box(.9, .1, 1.09, .5, .3, .05, '#5a3a28'); for (let b = 0; b < 4; b++) ball(1.0 + b * .1, .26, 1.18, .06, '#e0b468', { ol: false });
  }, { vb: [-.3, -.3, 0, 2.8, .8, 1.8], use: { x: 1.9, y: 1 }, staff: { x: 1.9, y: -.5, dir: 1 }, variants: [{}, { c: '#9fc8c0', seed: 6 }] }),

  F('bakery.traycart', ['bakery', 'decor'], [.5, 1, 1.7], p => {
    posts(.03, .03, .44, .94, 0, 1.65, '#8a9098'); for (let i = 0; i < 6; i++) { const z = .2 + i * .25; bx(.04, .04, z, .42, .92, .03, '#b8bcc0'); if ((i + (p.seed || 0)) % 3) qz(.07, .43, .1, .9, z + .04, heap2(['#e0b468', '#c88838', '#d8a050', '#b8bcc0'], 7, i)); }
    frameZ(.03, .47, .03, .97, 1.65, '#8a9098'); for (const [a, b] of [[.03, .97], [.47, .97], [.47, .03]]) { spx(a, b, 0, 0, -1, '#2a2733'); spx(a, b, 0, 0, 0, '#2a2733'); }
  }, { variants: [{ seed: 0 }, { seed: 1 }] }),
];
export default cafe;
export const galleryItems = [
  compose([cafe, generic], 'room.cafe', 8, 6, 2.8, { floor: PAT.fboards('#c89a64'), wall: '#e8d4b0', dado: 1, dadoc: '#5f8a7a' }, [
    ['cafe.menu', .4, 0], ['cafe.menu', 2.9, 0, { kind: 'lit' }], ['bakery.shelves', 5.6, .05],
    ['cafe.till', .3, 1.4], ['cafe.bar', 1.8, 1.4], ['cafe.pastrycase', 4.3, 1.4], ['dude', 2.4, 1.0, '#f1ede4', 0, { apron: '#3f6a5a' }], ['dude', .9, 2.5, '#6a8ad8'],
    ['cafe.tableset', 1, 3.6], ['cafe.tableset', 4, 4.2, { c: '#f1ede4', cc: '#c0563a' }], ['cafe.armchair', 6.6, 2.6], ['cafe.lowtable', 6.7, 3.8], ['cafe.condiments', 6.5, 1.2 + 99],
    ['cafe.windowbar', .2 + 99, 5], ['dude', 5.9, 4.7, '#d8a03a', .0],
  ].filter(i => i[2] < 50 && i[1] < 50)),
  compose([cafe, generic], 'room.bakery', 7, 5, 2.8, { floor: PAT.ftile('#e8d8c0', '#c8a888', .5), wall: '#f0e0c0' }, [
    ['cafe.menu', .3, 0, { name: 'BREAD', b: '#2a2733' }], ['bakery.oven', 2.8, .05], ['bakery.shelves', 4.7, .05, { seed: 1 }],
    ['bakery.worktable', .3, 1.0], ['bakery.counter', 2.2, 2.4], ['dude', 4.1, 2.0, '#f1ede4', 0, { apron: '#c0563a' }], ['bakery.sacks', .2, 2.6], ['bakery.traycart', .4, 3.6], ['cafe.windowbar', 3, 4 - .0, { n: 3 }], ['cafe.condiments', 5.8, 3.2],
  ]),
];
