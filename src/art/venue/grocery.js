// Grocery / supermarket + corner store fixtures.
import { box, qy, qx, qz, lw, glow, lit, ball, cyl, dk, lt, mix, PAT, textY, signY, spx, hash2, rng } from '../../engine/raster.js';
import { F, K, bx, tube, post, posts, frameY, frameX, frameZ, table, counter, till, monitor, goods, shelf, heap, heap2, carton, plant, compose, PX } from './_lib.js';

const G = ['grocery'], CS = ['cornerstore'];
const PROD = {
  apple: '#d63a3a', orange: '#f28a30', banana: '#f2d040', lime: '#8cc84a', lettuce: '#6fb858', tomato: '#e04a3a', carrot: '#f08a30',
  eggplant: '#6a3a7a', potato: '#c8a070', lemon: '#f6e04a', grape: '#7a4a9a', melon: '#3f7a48', pepper: '#e8c030', onion: '#e8d8b0', broc: '#3f8a45', pear: '#b8d060',
};
const tag = (x, y, z, c) => { qy(x, x + .16, y, z, z + .1, c || '#f4f0e8'); lw([x + .03, y, z + .05], [x + .12, y, z + .05], '#d63a3a'); };

/** upright glass-door fridge body. n doors */
function fridge(w, h, kind, o) {
  o = o || {}; const c = o.c || '#e4e8ea', n = Math.max(1, Math.round(w / (o.dw || .66)));
  box(0, 0, 0, w, .5, h, c);
  qy(0, w, .5, 0, .14, dk(c, .4)); for (let i = 0; i < 5; i++) lw([.1 + i * .08, .5, .04], [.1 + i * .08, .5, .1], dk(c, .6));
  lit(() => qy(.06, w - .06, .5, .18, h - .52, goods(kind, o.rows || 4, { seed: o.seed, back: o.back || '#d4eef2', board: '#f4fbfc' })));
  for (let i = 0; i <= n; i++) { const x = .06 + (w - .12) * i / n; lw([x, .5, .18], [x, .5, h - .52], '#5a6672'); if (i < n) lw([x + .06, .5, .7], [x + .06, .5, 1.15], '#f4fbfc'); }
  frameY(.06, w - .06, .5, .18, h - .52, '#5a6672');
  lit(() => signY(o.name || 'COLD', 0, w, .5, h - .48, h - .04, o.hc || '#2f8fc0', '#f4fbfc', { frame: false }));
}

const grocery = [
  F('grocery.produce', ['produce_stand', 'grocery', 'produce', 'shelf'], [2, 1, 1], p => {
    const c = p.items.map(k => PROD[k]), w = '#b88a54';
    box(0, 0, 0, 2, 1, .5, w, { l: PAT.planks(dk(w, .18), 5), r: PAT.planks(dk(w, .36), 5) });
    qy(0, 2, 1, 0, .08, dk(w, .55)); qx(2, 0, 1, 0, .08, dk(w, .62));
    box(0, 0, .5, 2, .5, .42, dk(w, .08)); box(0, .5, .5, 2, .5, .2, w);
    for (let i = 0; i < 4; i++) {
      const x = i * .5; qz(x + .05, x + .46, .05, .47, .92, heap(c[i], 9, i)); qz(x + .05, x + .46, .55, .96, .7, heap(c[4 + i] || c[i], 9, i + 7));
      if (i) { lw([x, 0, .92], [x, .5, .92], dk(w, .4)); lw([x, .5, .7], [x, 1, .7], dk(w, .4)); }
      tag(x + .17, 1, .54, i % 2 ? '#f6e08a' : '#f4f0e8');
    }
    if (p.big) { ball(.27, .26, 1.0, .15, PROD[p.big]); ball(.6, .78, .8, .13, PROD[p.big], { ol: false }); }
    frameZ(0, 2, 0, .5, .92, dk(w, .45)); lw([0, 1, .7], [2, 1, .7], lt(w, .4));
  }, { use: { x: 1, y: 1.5 }, variants: [
    { items: ['apple', 'orange', 'banana', 'lime', 'lemon', 'pear', 'grape', 'apple'], big: 'melon' },
    { items: ['lettuce', 'tomato', 'carrot', 'eggplant', 'potato', 'pepper', 'onion', 'broc'] },
    { items: ['orange', 'lemon', 'lime', 'orange', 'banana', 'banana', 'apple', 'pear'], big: 'orange' },
    { items: ['tomato', 'pepper', 'broc', 'lettuce', 'onion', 'carrot', 'potato', 'eggplant'], big: 'lettuce' }] }),

  F('grocery.gondola', ['grocery', 'shelf'], p => [p.w || 2, .5, 2], p => {
    const w = p.w || 2, c = p.c || '#e8e2d4';
    shelf(0, 0, 0, w, .5, 1.5, c, p.kind || 'cans', p.rows || 4, { seed: p.seed, back: '#4a4458' });
    box(0, .1, 1.5, w, .4, .44, p.hc || K.red); if (p.name) signY(p.name, 0, w, .5, 1.5, 1.94, p.hc || K.red, '#fff8e0', { frame: false });
    for (let r = 0; r < (p.rows || 4); r++) for (let i = 0; i < w * 2; i++) if (hash2(i, r, p.seed || 1) < .3) spx(.2 + i * .5 - .1, .5, 1.5 * r / (p.rows || 4), 0, 0, hash2(i, r, 3) < .4 ? '#f2c230' : '#f4f0e8');
  }, { use: { x: 1, y: 1 }, variants: [
    { kind: 'cans', seed: 3, hc: '#d63a3a', name: 'CANNED' }, { kind: 'cereal', seed: 5, hc: '#e8843a', name: 'CEREAL' },
    { kind: 'snacks', seed: 8, hc: '#7a55b0', name: 'SNACKS' }, { kind: 'drinks', seed: 2, hc: '#3c64ad', name: 'DRINKS' },
    { kind: 'household', seed: 4, hc: '#2f8f8a', name: 'HOME' }, { kind: 'cans', seed: 11, w: 1, hc: '#3f8a55' }] }),

  F('grocery.fridge', ['grocery', 'fridge', 'shelf'], p => [p.w || 2, .5, 2], p => fridge(p.w || 2, 2, p.kind || 'dairy', p),
    { use: { x: 1, y: 1 }, variants: [{ kind: 'dairy', name: 'DAIRY', seed: 2 }, { kind: 'drinks', name: 'DRINKS', seed: 5, hc: '#d6503a' }, { kind: 'frozen', name: 'FROZEN', seed: 7, hc: '#3c64ad', back: '#c4dcf0' }, { kind: 'drinks', name: 'COLD', seed: 9, w: 1 }] }),

  F('grocery.freezer', ['grocery', 'fridge'], [2, 1, 1], p => {
    const c = '#e4e8ea';
    box(0, 0, 0, 2, 1, .75, c); qy(0, 2, 1, 0, .1, dk(c, .45)); qx(2, 0, 1, 0, .1, dk(c, .5)); qy(0, 2, 1, .5, .6, p.hc || '#3c8fc0'); qx(2, 0, 1, .5, .6, dk(p.hc || '#3c8fc0', .2));
    lit(() => qz(.08, 1.92, .08, .92, .76, heap2(p.cols || ['#f4f0e8', '#9fd0e8', '#f4b8c8', '#f6e08a', '#b8e0a8', '#e8f6fa', '#e8f6fa'], 5, p.seed || 1)));
    box(0, 0, .75, 2, .08, .14, '#aab2b8', { ol: false }); 
    qz(.06, 1.94, .08, .94, .88, '#dff4f8', 'glass'); frameZ(.06, 1.94, .08, .94, .88, '#6a7682'); lw([1, .08, .88], [1, .94, .88], '#6a7682');
    lw([.2, .94, .88], [.8, .94, .88], '#f4fbfc'); lw([1.2, .94, .88], [1.8, .94, .88], '#f4fbfc');
  }, { use: { x: 1, y: 1.5 }, variants: [{ seed: 1 }, { seed: 4, hc: '#d6503a', cols: ['#e8a0a0', '#f4f0e8', '#d86a5a', '#f0c8a0', '#e8f6fa'] }] }),

  F('grocery.bakery', ['grocery', 'bakery', 'shelf'], [1.5, .5, 2], p => {
    const w = '#a8743f';
    bx(0, 0, 0, 1.5, .08, 1.6, dk(w, .2)); 
    for (let i = 0; i < 4; i++) { const z = .15 + i * .38; box(0, .04 + i * .0, z, 1.5, .46, .06, w); qz(.06, 1.44, .1, .46, z + .07, heap2(i % 2 ? ['#d8a050', '#c88838', '#e0b468'] : ['#e8c078', '#d8a050', '#b87830'], 4, i + (p.seed || 0)));
      for (let j = 0; j < 5; j++) { const x = .12 + j * .28; bx(x, .3, z + .06, .2, .16, .1, ['#d8a050', '#c88838', '#e0b468', '#b87830'][(i + j + (p.seed || 0)) % 4]); lw([x + .05, .46, z + .15], [x + .15, .46, z + .15], '#f0d8a0'); } }
    post(0, .5, 0, 1.56, dk(w, .4)); post(1.5, .5, 0, 1.56, dk(w, .4)); post(1.5, 0, 0, 1.56, dk(w, .4));
    box(0, .4, 1.54, 1.5, .1, .46, '#5a3a28'); signY('BREAD', 0, 1.5, .5, 1.54, 2.0, '#5a3a28', '#f6d890');
  }, { use: { x: .75, y: 1 }, variants: [{ seed: 0 }, { seed: 1 }] }),

  F('grocery.checkout', ['till', 'grocery', 'checkout'], [2.5, 1, 1], p => {
    const c = p.c || '#d8d2c4', ac = p.ac || '#3f8a55';
    // cashier pedestal (back) with till
    box(1.3, 0, 0, .7, .35, .95, dk(c, .1)); 
    // main lane
    box(0, .35, 0, 2.5, .65, .8, c); qy(0, 2.5, 1, 0, .1, dk(c, .55)); qx(2.5, .35, 1, 0, .1, dk(c, .6)); qy(0, 2.5, 1, .55, .68, ac); qx(2.5, .35, 1, .55, .68, dk(ac, .2));
    qz(.08, 1.3, .45, .92, .81, (x, y) => (Math.floor(x * 16) % 4 === 0) ? '#4a4a56' : '#33333d'); frameZ(.08, 1.3, .45, .92, .81, '#8a9098');
    // groceries on the belt
    bx(.25, .55, .81, .2, .16, .22, '#e8843a'); bx(.55, .6, .81, .14, .14, .14, '#d63a3a'); cyl(.85, .7, .81, .07, .2, '#6fb6d8', { ol: false }); bx(1.02, .55, .81, .18, .2, .1, '#f2c230');
    // scanner
    qz(1.38, 1.72, .5, .9, .81, '#2a2f3a'); lit(() => { lw([1.45, .7, .81], [1.65, .7, .81], '#ff5a4a'); lw([1.55, .58, .81], [1.55, .84, .81], '#ff5a4a'); });
    // bagging shelf + paper bag
    qz(1.8, 2.44, .42, .94, .81, lt(c, .3)); box(2.0, .5, .81, .3, .26, .36, '#c8a070'); lw([2.05, .76, 1.17], [2.25, .76, 1.17], '#a88050'); spx(2.15, .6, 1.2, 0, 0, '#6fb858'); spx(2.15, .6, 1.2, 1, -1, '#6fb858'); spx(2.1, .64, 1.2, -1, 0, '#e8c078');
    // till on the pedestal, customer display, lane light
    till(1.45, .03, .95); 
    post(1.97, .02, .95, 1.9, '#8a9098'); box(1.82, 0, 1.9, .3, .08, .3, '#f4f0e8'); lit(() => { qy(1.84, 2.1, .08, 1.92, 2.18, p.open === false ? '#d63a3a' : '#3fae6a'); textY(String(p.n || 1), 1.94, .08, 2.14, '#fff8e0'); });
    // card reader
    post(1.75, .95, .81, 1.02, '#4a4f5c'); bx(1.68, .9, 1.02, .14, .08, .14, '#3a3f4c'); lit(() => qy(1.7, 1.8, .98, 1.08, 1.14, '#9cf2b0'));
  }, { vb: [-.3, -.3, 0, 2.8, 1.3, 2.4], use: { x: 1.6, y: 1.5 }, staff: { x: 1.6, y: -.5, dir: 1 }, variants: [{ n: 1 }, { n: 2, ac: '#d6503a' }, { n: 3, open: false, ac: '#3c64ad' }] }),

  F('grocery.baskets', ['grocery', 'baskets'], [.5, .5, .7], p => {
    const c = p.c || K.red; bx(.02, .02, 0, .46, .46, .06, '#5a6272');
    for (let i = 0; i < (p.n || 5); i++) { const z = .06 + i * .1; box(.04, .06, z, .42, .34, .14, c, { t: dk(c, .5) }); lw([.06, .4, z + .07], [.44, .4, z + .07], dk(c, .4)); }
    const z = .06 + (p.n || 5) * .1 + .04; tube([.1, .23, z], [.1, .23, z + .12], '#3a3f4c'); tube([.4, .23, z], [.4, .23, z + .12], '#3a3f4c'); tube([.1, .23, z + .12], [.4, .23, z + .12], '#3a3f4c');
  }, { use: { x: .25, y: 1 }, variants: [{ c: K.red }, { c: K.green, n: 4 }, { c: K.blue, n: 3 }] }),

  F('grocery.trolley', ['cart_bay', 'grocery', 'trolley'], p => [.5 + (p.n || 1) * .5, .5, 1], p => {
    const n = p.n || 1, hc = p.c || K.red;
    for (let i = 0; i < n; i++) {
      const x = i * .28;
      for (const [a, b] of [[x + .15, .08], [x + .15, .42], [x + .95, .08], [x + .95, .42]]) { post(a, b, .06, .3, '#8a9098'); spx(a, b, .0, 0, -1, '#2a2733'); spx(a, b, .0, 0, -2, '#2a2733'); spx(a, b, 0, 1, -1, '#2a2733'); }
      lw([x + .15, .42, .14], [x + .95, .42, .14], '#8a9098'); lw([x + .95, .08, .14], [x + .95, .42, .14], '#8a9098');
      box(x + .12, .05, .34, .88, .4, .42, '#c8ced4', { t: '#7a828e', t2: 'glass', l: '#e4e8ec', l2: 'glass', r: '#aab2ba', r2: 'glass' });
      if (i === n - 1 && p.full) { bx(x + .3, .12, .5, .2, .2, .34, '#e8843a'); bx(x + .55, .15, .5, .25, .22, .3, '#6fb858'); cyl(x + .82, .3, .5, .07, .36, '#f1ede4', { ol: false }); }
      tube([x + .1, .05, .86], [x + .1, .45, .86], hc); post(x + .1, .45, .76, .86, '#8a9098');
      bx(x + .12, .22, .68, .02, .1, .08, hc);
    }
  }, { use: { x: .2, y: 1 }, variants: [{ n: 1 }, { n: 1, full: true, c: K.blue }, { n: 4 }] }),

  F('grocery.promo', ['grocery', 'promo', 'shelf'], [1, 1, 1.9], p => {
    const c = p.c || K.yellow, pc = p.pc || K.red, r = rng(p.seed || 1);
    box(0, 0, 0, 1, 1, .25, c, { l: PAT.vstripes(c, lt(c, .4), 3) }); 
    for (let t = 0; t < 3; t++) { const i = t * .14, z = .25 + t * .3; box(i, i, z, 1 - 2 * i, 1 - 2 * i, .3, pc, { l: goods(p.kind || 'cans', 1, { seed: t + (p.seed || 1), back: dk(pc, .3), board: lt(c, .2), pal: p.pal }), t: heap2(p.pal || [pc, lt(pc, .3), dk(pc, .15)], 7, t) }); }
    post(.5, .5, 1.15, 1.45, '#8a9098'); box(0, .46, 1.38, 1, .08, .5, pc); lit(() => signY(p.name || 'SALE', .03, .97, .54, 1.41, 1.85, '#f6e04a', '#c0282a', { frame: false }));
  }, { vb: [-.3, -.3, 0, 1.3, 1.3, 2.1], use: { x: .5, y: 1.5 }, variants: [{ name: 'SALE', seed: 1 }, { name: '-50%', c: '#e8f0f4', pc: '#3c64ad', kind: 'drinks', seed: 4, pal: ['#3c64ad', '#6fb6d8', '#f1ede4'] }, { name: 'NEW!', c: '#f4b8c8', pc: '#7a55b0', kind: 'cereal', seed: 6 }] }),

  F('grocery.scale', ['grocery', 'scale'], [.5, .5, 1.4], p => {
    box(.08, .08, 0, .34, .34, .8, '#d8d2c4'); qy(.08, .42, .42, 0, .08, '#8a8478');
    box(.03, .03, .8, .44, .44, .06, '#b8bcc0'); cyl(.25, .27, .88, .2, .03, '#d5dbe0'); ball(.22, .27, .96, .07, PROD.apple, { ol: false }); ball(.3, .3, .95, .06, PROD.lime, { ol: false });
    post(.25, .05, .86, 1.2, '#8a9098'); box(.08, .02, 1.12, .34, .06, .24, '#3a3f4c'); lit(() => { qy(.11, .39, .08, 1.2, 1.32, '#9cf2b0'); }); lw([.14, .08, 1.26], [.3, .08, 1.26], '#1f5a3a'); qy(.11, .39, .08, 1.14, 1.18, '#cfd4da', '#8a9098');
  }, { use: { x: .25, y: 1 } }),

  F('grocery.aislesign', ['grocery', 'sign', 'overhead'], [2, .5, 2.7], p => {
    const c = p.c || '#2f6f5f';
    post(.2, .25, 2.3, 2.7, '#8a9098'); post(1.8, .25, 2.3, 2.7, '#8a9098');
    box(0, .2, 1.5, 2, .1, .82, c); qy(0, .4, .3, 1.5, 2.32, '#f4f0e8'); textY(String(p.n || 1), .13, .3, 2.1, c);
    textY(p.a || 'FRUIT', .5, .3, 2.24, '#fff8e0'); textY(p.b || 'VEG', .5, .3, 1.86, '#f6e08a');
  }, { solid: false, overhead: true, vb: [-.2, 0, 1.4, 2.2, .6, 2.8], variants: [{ n: 1, a: 'FRUIT', b: 'VEG' }, { n: 2, a: 'CANS', b: 'PASTA', c: '#8a3a3a' }, { n: 3, a: 'SNACKS', b: 'DRINKS', c: '#3c5a9a' }, { n: 4, a: 'DAIRY', b: 'FROZEN', c: '#2f7f9a' }] }),

  F('grocery.crates', ['stockroom', 'grocery', 'decor', 'produce'], [1, .5, .9], p => {
    const w = '#c8a068', it = p.items || ['apple', 'orange', 'lettuce'];
    const crate = (x, y, z, k) => { box(x, y, z, .48, .46, .26, w, { l: PAT.siding(dk(w, .18), 4), r: PAT.siding(dk(w, .36), 4), t: heap(PROD[k], 9, x * 7) }); frameZ(x, x + .48, y, y + .46, z + .26, dk(w, .4)); };
    crate(0, .02, 0, it[0]); crate(.5, .02, 0, it[1]); crate(.1, .02, .28, it[2]); if (p.tall) crate(.5, .02, .28, it[0]);
    tag(.22, .48, .36);
  }, { variants: [{}, { items: ['potato', 'onion', 'carrot'], tall: true }, { items: ['lemon', 'tomato', 'pepper'] }] }),

  F('grocery.flowers', ['grocery', 'decor', 'flowers'], [1, .5, 1.2], p => {
    const cols = ['#e87aa0', '#f2c230', '#d63a3a', '#f1ede4', '#b07ad8', '#f28a30'];
    box(0, 0, 0, 1, .5, .3, '#8aa878'); box(0, 0, .3, 1, .25, .3, '#8aa878');
    for (let r = 0; r < 2; r++) for (let i = 0; i < 3; i++) { const x = .18 + i * .32, y = r ? .37 : .12, z = r ? .3 : .6, c = cols[(i + r * 3 + (p.seed || 0)) % 6];
      cyl(x, y, z, .11, .2, '#b8c4cc', { t: '#2a4a2a' }); for (let k = 0; k < 6; k++) { const dx = (hash2(k, i, r) - .5) * .22, dy = (hash2(k, i, r + 5) - .5) * .16; lw([x, y, z + .2], [x + dx, y + dy, z + .42], '#3f8a45'); spx(x + dx, y + dy, z + .44, 0, 0, c); spx(x + dx, y + dy, z + .44, 1, 0, lt(c, .3)); spx(x + dx, y + dy, z + .44, 0, 1, dk(c, .15)); } }
    tag(.4, .5, .1, '#f6e08a');
  }, { use: { x: .5, y: 1 }, variants: [{ seed: 0 }, { seed: 2 }] }),
];

/* ---------------- corner store ---------------- */
function atm(p) {
  const c = p.c || '#3c64ad';
  box(0, 0, 0, .5, .5, 1.7, c); qy(0, .5, .5, 0, .1, dk(c, .5));
  qy(.05, .45, .5, .75, 1.35, '#d8dce0'); 
  lit(() => { qy(.1, .4, .5, 1.05, 1.3, '#4ac0e8', '#6ad0f0'); lw([.13, .5, 1.24], [.3, .5, 1.24], '#f4fbfc'); lw([.13, .5, 1.16], [.36, .5, 1.16], '#f4fbfc'); lw([.13, .5, 1.1], [.24, .5, 1.1], '#f6e04a'); });
  qy(.1, .28, .5, .82, .98, '#8a9098', '#cfd4da'); qy(.32, .42, .5, .93, .97, '#2a2733'); lit(() => spx(.36, .5, .87, 0, 0, '#5af08a')); qy(.12, .4, .5, .62, .68, '#2a2733');
  lit(() => { qy(.05, .45, .5, 1.42, 1.62, '#f4f0e8'); qy(.05, .45, .5, 1.42, 1.47, '#f6c040'); spx(.25, .5, 1.58, -2, 1, c); spx(.25, .5, 1.58, -1, 0, c); spx(.25, .5, 1.58, 0, 1, c); spx(.25, .5, 1.58, 1, 1, c); spx(.25, .5, 1.58, 2, 2, c); });
}
const corner = [
  F('cornerstore.counter', ['till', 'cornerstore', 'checkout'], [2, .5, 1], p => {
    const c = p.c || '#3f7a6a';
    counter(0, 0, 2, .5, 1, c, '#e8e2d4', { panels: false });
    // candy rack on the customer face
    qy(.1, 1.2, .5, .12, .78, goods('snacks', 3, { seed: p.seed || 2, back: dk(c, .45), board: '#e8e2d4' })); frameY(.1, 1.2, .5, .12, .78, dk(c, .5));
    qy(1.4, 1.85, .5, .25, .75, '#f6e04a'); qy(1.45, 1.8, .5, .5, .7, '#d63a3a'); lw([1.47, .5, .4], [1.78, .5, .4], '#c0282a'); lw([1.47, .5, .33], [1.7, .5, .33], '#c0282a');
    till(.25, .08, 1);
    // lottery scratch-card case
    box(.85, .1, 1, .5, .3, .22, '#e8f6fa', { l: goods('cigs', 2, { seed: 9, back: '#f4f0e8', board: '#c8ccd4', pal: ['#f2c230', '#e87aa0', '#6fb6d8', '#9ccc4a', '#e8843a'] }) });
    lit(() => { qy(.85, 1.35, .4, 1.22, 1.32, '#d63a3a'); lw([.9, .4, 1.27], [1.3, .4, 1.27], '#f6e04a'); });
    // gum jar + charity tin
    cyl(1.6, .28, 1, .1, .2, '#e8f6fa', { t: '#d63a3a' }); spx(1.6, .28, 1.1, -1, 0, '#e87aa0'); spx(1.6, .28, 1.1, 1, 1, '#f2c230'); spx(1.6, .28, 1.08, 0, -1, '#6fb6d8');
    cyl(1.84, .3, 1, .06, .14, '#f2c230', { ol: false });
  }, { vb: [-.3, -.3, 0, 2.3, .8, 1.6], use: { x: .5, y: 1 }, staff: { x: .5, y: -.5, dir: 1 }, variants: [{}, { c: '#8a4a3a', seed: 6 }] }),

  F('cornerstore.backshelf', ['cornerstore', 'shelf', 'decor'], [2, .5, 2.4], p => {
    const c = '#6a5a4a';
    box(0, 0, 0, 2, .5, .8, c); qy(.06, 1.94, .5, .1, .74, goods('liquor', 2, { seed: 3, back: '#2e2836', board: '#a89878' }));
    box(0, 0, .8, 2, .3, 1.15, dk(c, .1), { l: goods('cigs', 4, { seed: p.seed || 4, back: '#2e2836', board: '#d8d2c0' }) });
    qy(0, 1.0, .3, 1.5, 1.95, PAT.siding('#b8bcc0', 2)); lw([0, .3, 1.5], [1, .3, 1.5], '#6a7078');
    box(0, 0, 1.95, 2, .32, .45, '#2a2733'); lit(() => { signY('LOTTO', .02, 1.3, .32, 1.96, 2.4, '#d63a3a', '#f6e04a', { frame: false }); signY('18+', 1.3, 2, .32, 1.96, 2.4, '#f4f0e8', '#2a2733', { frame: false }); });
  }, { variants: [{}, { seed: 9 }] }),

  F('cornerstore.fridge', ['cornerstore', 'fridge', 'shelf'], p => [p.w || 1, .5, 2], p => fridge(p.w || 1, 2, p.kind || 'drinks', Object.assign({ dw: .5 }, p)),
    { use: { x: .5, y: 1 }, variants: [{ name: 'COLA', hc: '#d63a3a', seed: 3 }, { name: 'TEA', hc: '#2f8f8a', seed: 6 }, { name: 'DRINKS', w: 1.5, hc: '#3c64ad', seed: 8 }] }),

  F('cornerstore.magrack', ['cornerstore', 'shelf', 'magazines'], [1, .5, 1.8], p => {
    const c = '#4a4f5c';
    bx(0, 0, 0, 1, .12, 1.74, c);
    for (let i = 3; i >= 0; i--) { const y = .12 + (3 - i) * .09, z = .3 + i * .28; box(0, y - .04, z - .28, 1, .1, .1, dk(c, .1), { ol: false }); qy(.02, .98, y + .06, z - .2, z + .2, goods('mags', 1, { seed: (p.seed || 1) + i, back: c, board: c })); }
    box(0, .12, 0, 1, .38, .12, c); bx(.08, .2, .12, .36, .26, .1, '#e8e2d4', { l: PAT.siding('#e8e2d4', 2) }); bx(.55, .2, .12, .36, .26, .16, '#e8e2d4', { l: PAT.siding('#d8d2c4', 2) }); lw([.6, .46, .25], [.85, .46, .25], '#3a3f4c');
    post(0, .5, 0, .3, dk(c, .3)); post(1, .5, 0, .3, dk(c, .3));
    signY('NEWS', 0, 1, .13, 1.3, 1.74, '#d63a3a', '#f4f0e8');
  }, { use: { x: .5, y: 1 }, variants: [{ seed: 1 }, { seed: 5 }] }),

  F('cornerstore.shelf', ['cornerstore', 'shelf'], p => [p.w || 1.5, .5, 1.6], p => {
    const w = p.w || 1.5; shelf(0, 0, 0, w, .5, 1.6, p.c || '#d8c8a8', p.kind || 'snacks', 4, { seed: p.seed, back: '#4a4038' });
    lw([0, .5, 1.6], [w, .5, 1.6], '#f4e9cf');
  }, { use: { x: .75, y: 1 }, variants: [{ kind: 'snacks', seed: 2 }, { kind: 'cans', seed: 7 }, { kind: 'household', seed: 5, w: 1 }, { kind: 'cereal', seed: 3 }] }),

  F('cornerstore.slushie', ['cornerstore', 'slushie', 'drinkmachine'], [1, .5, 1.6], p => {
    const c = '#e8e2d4', cols = p.cols || ['#e8405a', '#4a90e8'];
    box(0, 0, 0, 1, .5, .9, c); qy(0, 1, .5, 0, .08, '#8a8478'); frameY(.08, .92, .5, .16, .78, dk(c, .3)); signY('ICY', .1, .9, .5, .25, .69, '#3c8fd0', '#f4fbfc');
    box(.04, .04, .9, .92, .42, .22, '#3a3f4c'); 
    cols.forEach((k, i) => { const x = .27 + i * .46; lit(() => cyl(x, .25, 1.12, .17, .38, k, { t: lt(k, .35), l: lt(k, .15), ol: false })); cyl(x, .25, 1.5, .18, .06, '#3a3f4c'); spx(x, .25, 1.3, -2, 0, '#fff8e0'); spx(x, .25, 1.36, -2, 0, '#fff8e0'); spx(x, .25, 1.2, 1, 0, lt(k, .5));
      qy(x - .05, x + .05, .46, .98, 1.08, '#cfd4da'); lw([x, .47, .98], [x, .47, .92], '#2a2733'); });
    cyl(.5, .4, .9, .05, .16, '#f4f0e8', { ol: false });
  }, { use: { x: .5, y: 1 }, variants: [{}, { cols: ['#9ccc4a', '#f28a30'] }] }),

  F('cornerstore.atm', ['cornerstore', 'atm'], [.5, .5, 1.7], atm, { use: { x: .25, y: 1 }, variants: [{}, { c: '#2f8f6a' }] }),

  F('cornerstore.icecream', ['cornerstore', 'fridge'], [1, .5, .9], p => {
    const c = '#f4f0e8';
    box(0, 0, 0, 1, .5, .8, c); qy(0, 1, .5, 0, .08, '#8a8478'); qy(0, 1, .5, .3, .62, '#e87aa0'); textY('ICE', .12, .5, .56, '#fff8e0'); ball(.75, .5, .5, .08, '#f6e08a', { ol: false }); ball(.75, .5, .58, .07, '#f4b8c8', { ol: false });
    lit(() => qz(.06, .94, .06, .44, .81, heap2(['#f4b8c8', '#9fd0e8', '#f6e08a', '#f4f0e8', '#c8a070'], 6, 2)));
    qz(.04, .96, .04, .46, .86, '#dff4f8', 'glass'); frameZ(.04, .96, .04, .46, .86, '#6a7682'); lw([.5, .04, .86], [.5, .46, .86], '#6a7682');
  }, { use: { x: .5, y: 1 } }),

  F('cornerstore.gumball', ['cornerstore', 'decor'], [.5, .5, 1.2], p => {
    const c = p.c || K.red; cyl(.25, .25, 0, .16, .04, '#4a4f5c'); tube([.25, .25, .04], [.25, .25, .55], '#8a9098'); cyl(.25, .25, .55, .14, .2, c); qy(.2, .3, .39, .58, .66, '#cfd4da');
    ball(.25, .25, .95, .2, '#dff4f8'); for (let i = 0; i < 14; i++) spx(.25, .25, .9, Math.round((hash2(i, 1) - .5) * 7), Math.round((hash2(i, 2) - .2) * 4), ['#d63a3a', '#f2c230', '#3c64ad', '#3fae6a', '#e87aa0'][i % 5]);
    cyl(.25, .25, 1.13, .07, .04, c, { ol: false });
  }, { variants: [{}, { c: K.blue }] }),
];

export default [...grocery, ...corner];
export { atm, fridge };

import generic from './generic.js';
export const galleryItems = [
  compose([grocery, corner, generic], 'room.grocery', 9, 7, 2.8, { floor: PAT.ftile('#e4dcc8', '#d8d0bc', 1), wall: '#e8e4d0' }, [
    ['grocery.fridge', .2, .05, { kind: 'dairy', name: 'DAIRY' }], ['grocery.fridge', 2.3, .05, { kind: 'frozen', name: 'FROZEN', hc: '#3c64ad', seed: 7 }], ['grocery.bakery', 4.6, .05], ['generic.door', 6.8, 0, {}],
    ['grocery.gondola', 1, 2.2, { kind: 'cereal', name: 'CEREAL', hc: '#e8843a' }], ['grocery.gondola', 3.5, 2.2, { kind: 'drinks', name: 'DRINKS', hc: '#3c64ad' }],
    ['grocery.produce', 6.5, 2.2], ['grocery.aislesign', 1.3, 2.2, { n: 2, a: 'CEREAL', b: 'DRINKS', c: '#8a3a3a' }],
    ['grocery.checkout', 1, 4.6], ['dude', 2.6, 4.2, '#3f8a55', 0, { apron: '#f4f0e8' }], ['dude', 2.6, 6.1, '#d86a4a'], ['grocery.promo', 5, 4.5], ['grocery.baskets', 7.2, 5.8], ['grocery.trolley', 6.6, 4.5, { n: 1, full: true }],
    ['grocery.freezer', .3, 2.0 + 99, {}], ['dude', 6, 3.6, '#6a8ad8'],
  ].filter(i => i[2] < 50)),
  compose([grocery, corner, generic], 'room.cornerstore', 6, 5, 2.8, { floor: PAT.ftile('#c8d0c8', '#b8c2ba', .5), wall: '#e8d8b0' }, [
    ['cornerstore.backshelf', .2, .05], ['cornerstore.fridge', 2.6, .05], ['cornerstore.fridge', 3.7, .05, { name: 'TEA', hc: '#2f8f8a', seed: 6 }], ['cornerstore.atm', 5.2, .1],
    ['cornerstore.counter', .2, 1.3], ['dude', .8, .95, '#d8a03a'], ['dude', .9, 2.4, '#7a55b0'],
    ['cornerstore.shelf', 3.2, 2.2], ['cornerstore.magrack', 3.4, 4.2 - .5], ['cornerstore.slushie', 4.9, 3.7], ['cornerstore.gumball', .2, 4.3], ['cornerstore.icecream', 1.2, 3.9],
  ]),
];
