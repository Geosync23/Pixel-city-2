// Airport retail + service counters: composable kiosk backs and counters by kind, display islands, info beacon, greeter name signs.
import { box, qy, qx, qz, fq, lw, lit, glow, cyl, ball, dk, lt, mix, rng, signY, textY } from '../../engine/raster.js';
import { WH, GR, STEEL, DARK, TEAL, WOOD, YEL, NAVY, RED, GREEN, BAGC, T, wp, we, rowsY, screenY, counter, suitcase } from './_lib.js';

const KIND = {
  coffee: { c: '#5a3a2a', f: '#2a3a34', name: 'BAY BREW', fg: '#ffd98a' }, news: { c: '#2f4a6a', f: '#22304a', name: 'NEWS & BOOKS', fg: '#ffffff' }, noodle: { c: '#8a4b2a', f: '#7a2a22', name: 'NOODLE BAR', fg: '#ffe2a0' },
  dutyfree: { c: '#e9e4d8', f: '#1c222b', name: 'DUTY FREE', fg: '#ffd98a' }, exchange: { c: '#2f6f5f', f: '#1f4a40', name: 'EXCHANGE', fg: '#d8ffe4' }, rental: { c: '#d2412f', f: '#d2412f', name: 'ZIP CARS', fg: '#ffffff' },
  lostfound: { c: '#6a5a8a', f: '#3a3058', name: 'LOST & FOUND', fg: '#ffffff' }, oversize: { c: '#59616e', f: '#2c3440', name: 'OVERSIZE BAGS', fg: '#ffd98a' }, souvenir: { c: '#c0563a', f: '#8a2f22', name: 'MAPLE GIFTS', fg: '#fff2c4' }, info: { c: NAVY, f: NAVY, name: 'INFORMATION', fg: '#ffffff' },
};
const PROD = ['#d2412f', '#e08a2c', '#f2c230', '#3fa45b', '#2f8f96', '#2f6fb0', '#8a5aa8', '#d86a8f', '#f4efe2', '#7a4e2d'];
const K = p => KIND[p.kind] || KIND.coffee;

export default [
  { id: 'furn.airport.shop.back', kind: 'furniture', tags: T(['shop_back']), size: p => [p.w || 4, .4, 2.75], vb: p => [0, 0, 0, p.w || 4, .62, 2.8],
    variants: Object.keys(KIND).map((kind, i) => ({ kind, w: 4, seed: i + 1 })),
    draw(p) {
      const w = p.w || 4, k = K(p), c = p.c || k.c, r = rng((p.seed || 1) * 13 + w), Y = .3, kind = p.kind || 'coffee';
      box(0, 0, 0, w, .3, 2.2, c, { ol: false }); qy(0, w, Y, 0, .12, dk(c, .35));
      if (kind === 'coffee') {
        box(.1, .3, 0, w - .2, .3, .9, '#3a2a22', { t: '#d8c9a8', ol: false }); box(.3, .32, .9, .8, .26, .42, STEEL, { ol: false }); qy(.36, .6, .58, 1.0, 1.2, '#1c222b'); lit(() => qy(.7, .78, .58, 1.18, 1.24, '#ff8a70')); for (let i = 0; i < 4; i++) box(1.4 + i * .22, .36, .9, .14, .14, .2, i % 2 ? '#f4efe2' : '#c0563a', { ol: false });
        screenY(.2, w * .5 - .1, Y + .01, 1.45, 2.05, '#22302a'); screenY(w * .5 + .1, w - .2, Y + .01, 1.45, 2.05, '#22302a'); rowsY([['LATTE 4', '#ffe9b8'], ['MOCHA 5', '#ffe9b8'], ['TEA   3', '#ffe9b8']], .26, Y + .02, 1.98, .19); rowsY([['BAGEL 3', '#ffe9b8'], ['MUFFIN 3', '#ffe9b8']], w * .5 + .16, Y + .02, 1.98, .19);
      } else if (kind === 'news' || kind === 'souvenir' || kind === 'dutyfree') {
        const lite = kind === 'dutyfree'; qy(.1, w - .1, Y, .15, 2.1, lite ? '#f6f1e4' : dk(c, .25));
        for (let s = 0; s < 4; s++) { const z = .2 + s * .48; box(.1, .3, z, w - .2, .22, .05, lite ? '#d8cfb8' : '#e8e2d4', { ol: false }); if (lite) lit(() => qy(.12, w - .12, Y + .01, z + .4, z + .44, '#fff6d8'));
          for (let x = .16; x < w - .3;) { const pw = kind === 'news' ? .2 + r() * .08 : .09 + r() * .1, ph = kind === 'news' ? .3 + r() * .06 : .16 + r() * .2, col = PROD[Math.floor(r() * PROD.length)]; if (kind === 'news') { qy(x, x + pw, Y + .23, z + .05, z + .05 + ph, col); qy(x + .03, x + pw - .03, Y + .23, z + .05 + ph * .55, z + .05 + ph * .85, lt(col, .5)); } else { box(x, .36, z + .05, pw, .1, ph, col, { ol: false }); if (kind === 'dutyfree') qy(x + pw * .3, x + pw * .7, .46, z + .05 + ph, z + .09 + ph, '#d8a848'); } x += pw + .04 + r() * .05; } }
      } else if (kind === 'noodle') {
        box(.1, .3, 0, w - .2, .3, .9, '#6a3a22', { t: STEEL, ol: false }); for (let i = 0; i < 3; i++) { const x = .4 + i * (w - 1.2) / 2; cyl(x + .15, .45, .9, .16, .28, '#aab3be'); glow(() => we(.46, x + .15, 1.24, .1, .03, '#fff2c4')); lw([x + .1, .45, 1.25], [x + .05, .45, 1.5], '#f4f8fb'); lw([x + .2, .45, 1.3], [x + .26, .45, 1.55], '#f4f8fb'); }
        qy(.1, w - .1, Y, 1.2, 2.1, PATW(c)); for (let i = 0; i < 4; i++) { const x = .3 + i * (w - .9) / 3; screenY(x, x + .32, Y + .01, 1.5, 1.95, '#f4efe2'); lit(() => { qy(x + .06, x + .26, Y + .02, 1.6, 1.85, ['#d2412f', '#e08a2c', '#3fa45b', '#7a4e2d'][i]); }); }
      } else if (kind === 'exchange') {
        screenY(.2, w - .2, Y + .01, .9, 2.05, '#10231e'); rowsY([['USD  1.00  .98', '#7df0a0'], ['EUR  1.08 1.05', '#e8f0ff'], ['GBP  1.27 1.22', '#e8f0ff'], ['JPY  .007 .006', '#e8f0ff'], ['CAD  .74  .71', '#ffd35a']].map(q => [q[0].slice(0, Math.floor((w - .5) * 4)), q[1]]), .28, Y + .02, 1.98, .22); qy(.1, w - .1, Y, .15, .8, lt(c, .1));
      } else if (kind === 'rental') {
        qy(.1, w - .1, Y, .15, 2.1, lt(c, .12)); qy(.1, w - .1, Y, 1.0, 1.25, '#ffffff'); wp(Y + .01, [[w / 2 - .7, 1.4], [w / 2 + .7, 1.4], [w / 2 + .55, 1.62], [w / 2 + .25, 1.66], [w / 2 + .1, 1.86], [w / 2 - .4, 1.86], [w / 2 - .55, 1.64]], '#ffffff'); we(Y + .02, w / 2 - .4, 1.4, .13, .13, '#1f2630'); we(Y + .02, w / 2 + .4, 1.4, .13, .13, '#1f2630'); for (let i = 0; i < 6; i++) lit(() => qy(.3 + i * .16, .38 + i * .16, Y + .01, .5, .72, YEL));
      } else if (kind === 'lostfound') {
        qy(.1, w - .1, Y, .15, 2.1, dk(c, .3)); const n = Math.round((w - .2) / .65), cw = (w - .2) / n;
        for (let s = 0; s < 3; s++) for (let i = 0; i < n; i++) { const x = .1 + i * cw, z = .2 + s * .64; qy(x + .03, x + cw - .03, Y + .01, z, z + .58, '#2a2440'); const q = r(); if (q < .3) suitcase(x + .1, .32, z, BAGC[Math.floor(r() * 10)], { w: .32, d: .16, h: .3 }); else if (q < .5) { lw([x + .2, .4, z], [x + .32, .4, z + .5], RED); lw([x + .21, .4, z], [x + .33, .4, z + .5], dk(RED, .2)); } else if (q < .65) { ball(x + cw / 2, .42, z + .18, .11, '#c79a64'); ball(x + cw / 2, .42, z + .36, .07, '#c79a64', { ol: false }); } else if (q < .8) box(x + .12, .34, z, .3, .16, .16, PROD[Math.floor(r() * 10)], { ol: false }); }
      } else if (kind === 'oversize') {
        qy(.3, w - .3, Y, .0, 1.9, '#1f2630'); qy(.3, w - .3, Y + .01, 1.0, 1.9, (u, v) => v % 3 === 0 ? '#7d8794' : '#aab3be'); qy(.3, w - .3, Y + .01, .92, 1.0, YEL); for (let x = .4; x < w - .4; x += .22) cyl(x + .06, .45, .34, .05, .06, STEEL, { ol: false }); box(.3, .32, 0, w - .6, .28, .34, '#59616e', { ol: false });
        lw([w - .7, .5, .4], [w - .5, .5, 1.5], '#e08a2c'); lw([w - .66, .5, .4], [w - .46, .5, 1.5], '#2f6fb0'); box(.5, .36, .4, .7, .2, .26, '#7a4e2d', { ol: false });
      } else { // info
        qy(.1, w - .1, Y, .15, 2.1, lt(c, .1)); screenY(.3, w - .3, Y + .01, 1.0, 1.95, '#16243a'); lit(() => { for (let i = 0; i < 5; i++) lw([.4, Y + .02, 1.1 + i * .17], [w - .4 - (i % 2) * .5, Y + .02, 1.1 + i * .17], '#6ea8ff'); we(Y + .02, w / 2, 1.5, .12, .12, '#ffd35a'); });
      }
      const fc = kind === 'rental' && p.c ? p.c : k.f; box(0, 0, 2.2, w, .55, .5, fc); signY(p.name || k.name, .15, w - .15, .56, 2.26, 2.64, fc, k.fg, { lit: true, frame: false }); glow(() => qy(.2, w - .2, .55, 2.2, 2.24, '#fff2c4'));
      if (kind === 'noodle') for (let x = .2; x < w - .3; x += .5) { qy(x, x + .44, .56, 1.75, 2.2, '#b0302a'); lit(() => we(.57, x + .22, 1.98, .08, .08, '#ffe2a0')); }
    } },
  { id: 'furn.airport.shop.counter', kind: 'furniture', tags: T(['shop_counter']), size: p => [p.w || 3, .5, 1.05], vb: p => [0, 0, 0, p.w || 3, p.kind === 'noodle' ? 1.15 : .52, 1.85],
    staff: p => ({ x: (p.w || 3) / 2, y: -.45, dir: 1 }), use: p => ({ x: (p.w || 3) / 2, y: p.kind === 'noodle' ? 1.5 : 1.05 }),
    seats: p => p.kind === 'noodle' ? Array.from({ length: Math.floor((p.w || 3) / .8) }, (_, i) => ({ x: .45 + i * .8, y: .86, z: .62, dir: 3 })) : [],
    variants: Object.keys(KIND).map((kind, i) => ({ kind, w: 3, seed: i + 1 })),
    draw(p) {
      const w = p.w || 3, k = K(p), kind = p.kind || 'coffee', c = p.c || (kind === 'dutyfree' ? '#2c3440' : k.c), top = kind === 'noodle' || kind === 'coffee' ? WOOD : WH, r = rng((p.seed || 1) * 7 + 1);
      counter(0, 0, w, .5, 1.0, c, top); lit(() => qy(.1, w - .1, .5, .86, .9, kind === 'noodle' ? '#ffb070' : '#bff0f4')); qy(.15, w - .15, .5, .2, .78, lt(c, .07));
      if (kind === 'coffee') { box(.2, .08, 1.0, .7, .34, .42, '#b6bfc9'); qy(.26, .5, .42, 1.1, 1.3, '#1c222b'); lit(() => qy(.6, .7, .42, 1.3, 1.36, '#ff8a70')); box(.95, .12, 1.0, .2, .2, .16, '#f4efe2', { ol: false }); box(w - 1.3, .08, 1.0, .9, .34, .34, '#d9eef2', { l: '#d9eef2', l2: '#f4f8fb', ol: false }); for (let i = 0; i < 4; i++) box(w - 1.22 + i * .2, .2, 1.02, .13, .13, .1, ['#c79a64', '#7a4e2d', '#e8c890', '#d86a8f'][i], { ol: false }); box(w - .32, .12, 1.0, .22, .26, .2, '#2c3440', { ol: false }); lit(() => qy(w - .3, w - .12, .38, 1.06, 1.17, '#8fd0ff')); }
      else if (kind === 'news' || kind === 'souvenir') { for (let i = 0; i < Math.floor(w / .5); i++) { const x = .15 + i * .5; if (r() < .8) box(x, .1, 1.0, .34, .3, .06 + r() * .12, PROD[Math.floor(r() * 10)], { t: '#f4efe2', ol: false }); else { box(x + .05, .15, 1.0, .2, .2, .25, '#e08a2c', { ol: false }); } } box(w - .36, .12, 1.0, .22, .26, .2, '#2c3440', { ol: false }); lit(() => qy(w - .34, w - .16, .38, 1.06, 1.17, '#8fd0ff')); }
      else if (kind === 'noodle') { for (let i = 0; i < Math.floor(w / .8); i++) { const x = .45 + i * .8; cyl(x, .3, 1.0, .13, .09, '#f4efe2', { t: '#d8a04a' }); lw([x + .05, .3, 1.1], [x + .2, .3, 1.28], '#7a4e2d'); cyl(x, .86, 0, .05, .56, STEEL, { ol: false }); cyl(x, .86, .56, .17, .07, '#b0302a'); } cyl(w - .2, .2, 1.0, .07, .2, '#2c3440', { ol: false }); }
      else if (kind === 'dutyfree') { box(.1, .06, 1.0, w - .2, .38, .32, '#d9eef2', { l: '#d9eef2', l2: '#f4f8fb', t: '#e6f4f7', t2: '#ffffff', ol: false }); lit(() => qy(.12, w - .12, .44, 1.0, 1.04, '#fff6d8')); for (let x = .2; x < w - .3; x += .2 + r() * .1) { const h = .1 + r() * .14; box(x, .2, 1.03, .09, .09, h, PROD[Math.floor(r() * 10)], { ol: false }); qy(x + .02, x + .07, .29, 1.03 + h, 1.07 + h, '#d8a848'); } }
      else if (kind === 'exchange') { box(0, .2, 1.0, w, .06, .8, '#cfe6ee', { l: '#cfe6ee', l2: '#e8f4f8', ol: false }); lw([0, .26, 1.8], [w, .26, 1.8], STEEL); lw([w / 2, .26, 1.0], [w / 2, .26, 1.8], STEEL); qy(w / 2 - .3, w / 2 + .3, .27, 1.0, 1.08, '#1f2630'); lit(() => qy(.2, .8, .5, .5, .7, '#7df0a0')); }
      else if (kind === 'oversize') { box(.15, .05, 1.0, 1.0, .4, .08, STEEL); lit(() => qy(.25, .6, .45, 1.01, 1.07, '#ff8a70')); suitcase(w - .9, .1, 1.0, '#e08a2c', { w: .6, d: .25, h: .3 }); }
      else { box(.3, .1, 1.0, .45, .12, .34, '#1c222b', { ol: false }); lit(() => qy(.33, .72, .1, 1.05, 1.31, '#8fd0ff')); box(w - .9, .12, 1.0, .3, .22, .16, kind === 'rental' ? '#f4efe2' : '#e08a2c', { ol: false }); box(w - .5, .15, 1.0, .12, .12, .22, k.c === NAVY ? YEL : k.c, { ol: false }); if (kind === 'info') { lit(() => { qy(w / 2 - .25, w / 2 + .25, .5, .3, .74, YEL); }); lit(() => textY('I', w / 2 - .05, .51, .68, NAVY)); } if (kind === 'rental') signY('ZIP', w / 2 - .4, w / 2 + .4, .51, .32, .72, '#ffffff', k.c, { lit: true }); if (kind === 'lostfound') { cyl(1.2, .25, 1.0, .07, .06, YEL); } }
    } },
  { id: 'furn.airport.island', kind: 'furniture', tags: T(['display', 'duty_free']), size: [2, 1, 1.3], use: { x: 1, y: 1.45 }, variants: [{ kind: 'perfume' }, { kind: 'choc', seed: 4 }, { kind: 'liquor', seed: 8 }],
    draw(p) {
      const r = rng((p.seed || 2) * 5), kind = p.kind || 'perfume', c = kind === 'choc' ? '#5a3a2a' : kind === 'liquor' ? '#22304a' : '#f1ede4';
      box(0, 0, 0, 2, 1, .7, c, { t: '#f8f4ea' }); lit(() => { qy(.08, 1.92, 1, .56, .62, '#fff6d8'); qx(2, .08, .92, .56, .62, '#f0e2b8'); }); qy(.1, 1.9, 1, .1, .5, lt(c, .08));
      box(.5, .25, .7, 1, .5, .3, '#f8f4ea', { ol: false }); lit(() => qy(.5, 1.5, .75, .7, .74, '#fff6d8'));
      for (let i = 0; i < 9; i++) { const x = .12 + r() * 1.66, y = .08 + r() * .8, onTop = x > .45 && x < 1.5 && y > .2 && y < .75, z = onTop ? 1.0 : .7, col = kind === 'choc' ? ['#7a4e2d', '#d2412f', '#f2c230', '#8a5aa8'][i % 4] : kind === 'liquor' ? ['#7a4e2d', '#3fa45b', '#c79a64', '#2f6fb0'][i % 4] : ['#f2a7c3', '#9fd0e0', '#e9c46a', '#c9a0dc', '#f4efe2'][i % 5];
        if (kind === 'choc') box(x, y, z, .16, .12, .08 + r() * .08, col, { ol: false }); else { const h = kind === 'liquor' ? .26 : .14; box(x, y, z, .09, .09, h, col, { ol: false }); box(x + .025, y + .025, z + h, .04, .04, .06, kind === 'liquor' ? '#2c3440' : '#d8a848', { ol: false }); } }
    } },
  { id: 'furn.airport.beacon', kind: 'furniture', tags: T(['info_beacon']), size: [.5, .5, 2.8], variants: [{}, { text: '$', c: '#2f6f5f' }],
    draw(p) { const c = p.c || NAVY; box(.15, .15, 0, .2, .2, 2.0, STEEL, { ol: false }); cyl(.25, .25, 0, .22, .1, '#59616e', { ol: false }); box(0, 0, 2.0, .5, .5, .7, c); lit(() => { qy(.05, .45, .5, 2.05, 2.65, YEL); qx(.5, .05, .45, 2.05, 2.65, dk(YEL, .1)); }); lit(() => { const t = p.text || 'I'; textY(t, .2, .51, 2.52, c); textY(t, .21, .51, 2.52, c); }); } },
  { id: 'furn.airport.namesign', kind: 'furniture', tags: T(['greeter_sign']), solid: false, size: [.5, .1, 1.75], vb: [-.3, 0, 0, .9, .12, 1.8], variants: [{ text: 'MR BAO' }, { text: 'WELCOME', text2: 'HOME!', c: '#f2a7c3' }, { text: 'PEMBERTON', c: '#e8f0ff' }],
    draw(p) { const t = String(p.text || 'HELLO'), t2 = p.text2, wd = Math.max(.7, (Math.max(t.length, (t2 || '').length) * 4 + 5) / 16), x0 = .25 - wd / 2, z0 = t2 ? 1.02 : 1.2; lw([.25, .05, .75], [.25, .05, z0], '#7a4e2d'); qy(x0, x0 + wd, .06, z0, 1.72, p.c || '#fffbe8'); lw([x0, .06, z0], [x0 + wd, .06, z0], '#59616e'); lw([x0, .06, 1.72], [x0 + wd, .06, 1.72], '#59616e'); lw([x0, .06, z0], [x0, .06, 1.72], '#59616e'); lw([x0 + wd, .06, z0], [x0 + wd, .06, 1.72], '#59616e'); textY(t, x0 + .12, .07, 1.62, '#2a2733'); if (t2) textY(t2, x0 + .12, .07, 1.26, '#c0392b'); } },
];
function PATW(c) { const s = dk(c, .22); return (u, v) => u % 5 === 0 ? s : c; }
