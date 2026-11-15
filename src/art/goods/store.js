// Store fixtures for the home-goods shops (rooms in src/scenes/rooms/goods_*.js). Ids `furn.goods.<name>`.
//   dtable (display table: w, d, h, c legs, top)  bench (slatted plant bench: w, d, wood)  plinth (cube: s, h, c)
//   partition (free-standing room-set wall: w, h, c wallpaper, c2 trim, pat 'plain'|'stripe'|'dots')  racking (big-box pallet racking: w, h, seed, c uprights)
//   hangsign (overhead aisle sign: text, c, fg)  arrow (floor arrow, flat: c)  cart (shopping trolley: c)  pallet (stack of flat-pack boxes: seed, c)
//   tvwall (wall-mounted slatwall for screens: w, c)  stand (stepped plant stand: w, c)
import { box, qy, qz, qx, lw, cyl, ball, dk, lt, mix, rng, textY, textW, glow, lit } from '../../engine/raster.js';
import { shadow, legs4, leg } from '../home/_lib.js';

const INK = '#2c2738';
const A = (id, tags, size, draw, o) => Object.assign({ id: 'furn.goods.' + id, kind: 'furniture', tags, size, draw }, o);
const S = (p, k, d) => (p && p[k] !== undefined ? p[k] : d);

export default [
  A('dtable', ['decor', 'display'], p => [S(p, 'w', 2), S(p, 'd', 1), S(p, 'h', .75)], p => {
    const w = S(p, 'w', 2), d = S(p, 'd', 1), h = S(p, 'h', .75), c = p.c || '#3a3640', top = p.top || '#d8c6a4';
    shadow(-.02, w + .06, -.02, d + .06); legs4(.06, .06, 0, w - .12, d - .12, h - .06, c, .05);
    if (p.skirt) box(.04, .04, .12, w - .08, d - .08, h - .2, p.skirt, { l: (u, v) => (u % 6 === 0 ? dk(p.skirt, .3) : dk(p.skirt, .15)) });
    box(0, 0, h - .06, w, d, .06, top, { t: lt(top, .08) });
  }, { variants: [{}, { w: 1, d: 1, top: '#f1eee6', c: '#b9c2c9' }, { w: 2, d: .5, top: '#9c6a3e', skirt: '#c8574d' }] }),

  A('bench', ['decor', 'display'], p => [S(p, 'w', 2), S(p, 'd', 1), .62], p => {
    const w = S(p, 'w', 2), d = S(p, 'd', 1), c = p.wood || '#9c7a52';
    shadow(-.02, w + .06, -.02, d + .06); legs4(.05, .05, 0, w - .1, d - .1, .56, dk(c, .2), .06);
    lw([.05, d - .05, .2], [w - .05, d - .05, .2], dk(c, .3)); box(.05, .05, .18, w - .1, d - .1, .03, dk(c, .25), { ol: false });
    for (let i = 0; i < Math.round(d * 6); i++) box(0, i / 6 + .01, .56, w, 1 / 6 - .03, .05, i % 2 ? c : lt(c, .08), { ol: i === 0 });
  }, { variants: [{}, { w: 1.5, d: .5, wood: '#6b4630' }] }),

  A('plinth', ['decor', 'display'], p => [S(p, 's', .5), S(p, 's', .5), S(p, 'h', .6)], p => {
    const s = S(p, 's', .5), h = S(p, 'h', .6), c = p.c || '#f1eee6'; shadow(-.02, s + .06, -.02, s + .06); box(0, 0, 0, s, s, h, c, { t: lt(c, .06) });
  }, { variants: [{}, { s: 1, h: .3, c: '#2c2c36' }] }),

  A('partition', ['decor', 'wallpanel'], p => [S(p, 'w', 3), .25, S(p, 'h', 2)], p => {
    const w = S(p, 'w', 3), h = S(p, 'h', 2), c = p.c || '#e8dcc0', t = p.c2 || '#f4f0e8', pat = p.pat || 'plain';
    const f = pat === 'stripe' ? (u) => (Math.floor(u / 3) % 2 ? c : lt(c, .1)) : pat === 'dots' ? (u, v) => (u % 5 === 2 && v % 5 === 2 ? dk(c, .2) : c) : pat === 'panel' ? (u, v) => (u % 10 === 0 || v % 12 === 0 ? dk(c, .12) : c) : () => c;
    box(0, 0, 0, w, .25, h, c, { l: f, r: dk(c, .15), t: t });
    qy(0, w, .25, 0, .12, dk(t, .25)); lw([0, .25, h], [w, .25, h], dk(t, .3));
  }, { variants: [{}, { c: '#8fae7e', pat: 'stripe' }, { c: '#39456f', pat: 'panel', c2: '#d9b65c' }] }),

  A('racking', ['decor', 'shelf'], p => [S(p, 'w', 3), 1, S(p, 'h', 3.2)], p => {
    const w = S(p, 'w', 3), h = S(p, 'h', 3.2), c = p.c || '#e0662e', r = rng(p.seed || 3), beams = [0, 1.05, 2.1];
    shadow(-.02, w + .06, -.02, 1.06);
    const BOX = ['#c9a36a', '#b88a52', '#d8b888', '#f1eee6', '#8fae7e', '#c8574d'];
    for (const z of beams) { if (z + .9 > h) break; for (let x = .1; x + .55 < w - .05; x += .6 + r() * .1) { const bh = .35 + r() * .45, bc = BOX[Math.floor(r() * BOX.length)]; box(x, .12, z + .1, .55, .76, bh, bc, { t: lt(bc, .12) }); if (bh > .5 && r() < .5) box(x + .05, .16, z + .1 + bh, .45, .6, .25, BOX[Math.floor(r() * BOX.length)]); } box(0, .05, z, w, .05, .1, c); box(0, .9, z, w, .05, .1, c); box(0, .1, z + .02, w, .8, .02, '#b9a07a', { ol: false }); }
    for (const x of [0, w - .08]) for (const y of [.02, .92]) box(x, y, 0, .08, .06, h, '#3a5f9a');
    lw([0, .95, h], [w, .95, h], '#3a5f9a');
  }, { variants: [{}, { w: 4, seed: 9 }] }),

  A('hangsign', ['decor', 'overhead', 'sign'], p => [Math.max(1, Math.ceil((textW(p.text || 'AISLE') + 10) / 8) / 2), .1, 2.9], p => {
    const t = p.text || 'AISLE', w = Math.max(1, Math.ceil((textW(t) + 10) / 8) / 2), c = p.c || '#e0662e', fg = p.fg || '#fff8e0';
    lw([.15, .05, 2.75], [.15, .05, 2.9], '#8a9098'); lw([w - .15, .05, 2.75], [w - .15, .05, 2.9], '#8a9098');
    box(0, 0, 2.3, w, .1, .45, c); textY(t, (w * 16 - textW(t)) / 32, .11, 2.66, fg);
  }, { solid: false, overhead: true, vb: p => { const w = Math.max(1, Math.ceil((textW(p.text || 'AISLE') + 10) / 8) / 2); return [-.3, -.3, 2.2, w + .3, .4, 3]; } }),

  A('arrow', ['decor', 'floor'], [1, 1, .02], p => {
    const c = p.c || '#f2c230', d = p.dir || 0;
    /* shaft + stepped head along +x (dir 0) or +y (dir 1) */
    const R = (a0, a1, b0, b1) => (d === 1 ? qz(b0, b1, a0, a1, .01, c) : qz(a0, a1, b0, b1, .01, c));
    R(.1, .55, .42, .58); for (let i = 0; i < 6; i++) { const a = .55 + i * .06, h = .3 - i * .05; R(a, a + .06, .5 - h, .5 + h); }
  }, { solid: false, flat: true, variants: [{}, { dir: 1 }] }),

  A('cart', ['decor'], [.5, 1, .95], p => {
    const c = p.c || '#c8574d', m = '#b9c2c9';
    shadow(.02, .52, .05, 1); for (const [x, y] of [[.08, .12], [.42, .12], [.08, .9], [.42, .9]]) { cyl(x, y, 0, .05, .05, INK, { ol: false }); lw([x, y, .05], [x, y, .3], m); }
    box(.04, .1, .3, .42, .8, .04, m, { ol: false });
    for (let i = 0; i <= 4; i++) lw([.04 + i * .105, .1, .4], [.04 + i * .105, .9, .75], m);
    lw([.04, .1, .4], [.46, .1, .4], m); lw([.04, .9, .75], [.46, .9, .75], m); lw([.04, .1, .4], [.04, .9, .75], m); lw([.46, .1, .4], [.46, .9, .75], m);
    lw([.04, .98, .92], [.46, .98, .92], c); lw([.04, .98, .93], [.46, .98, .93], c); lw([.04, .9, .75], [.04, .98, .92], m); lw([.46, .9, .75], [.46, .98, .92], m);
  }, { variants: [{}, { c: '#3a5f9a' }] }),

  A('pallet', ['decor'], [1, 1, .9], p => {
    const r = rng(p.seed || 4), c = p.c || '#c9a36a';
    shadow(-.02, 1.06, -.02, 1.06); box(0, 0, 0, 1, 1, .12, '#b9a07a', { l: (u) => (u % 4 === 0 ? '#7a6248' : '#b9a07a') });
    let z = .12; for (let i = 0; i < 3 + Math.floor(r() * 2); i++) { const h = .14 + r() * .1, cc = r() < .25 ? '#3a5f9a' : lt(c, (r() - .5) * .15); box(.04 + r() * .04, .04 + r() * .04, z, .9, .9, h, cc, { t: lt(cc, .12) }); if (cc !== '#3a5f9a') lw([.1, .95, z + h * .5], [.5, .95, z + h * .5], dk(cc, .35)); z += h; }
  }, { variants: [{}, { seed: 7, c: '#d8c6a4' }] }),

  A('stand', ['decor', 'display'], p => [S(p, 'w', 1.5), 1, 1.1], p => {
    const w = S(p, 'w', 1.5), c = p.c || '#f1eee6'; shadow(-.02, w + .06, -.02, 1.06);
    box(0, .66, 0, w, .34, .3, c, { t: lt(c, .06) }); box(0, .33, 0, w, .33, .62, dk(c, .04), { t: lt(c, .06) }); box(0, 0, 0, w, .33, .95, dk(c, .08), { t: lt(c, .06) });
  }, { variants: [{}, { c: '#6b4630' }] }),

  A('tvwall', ['decor', 'wallpanel'], p => [S(p, 'w', 4), .1, 2.2], p => {
    const w = S(p, 'w', 4), c = p.c || '#2c2c36'; box(0, 0, 0, w, .06, 2.2, c, { l: (u, v) => (v % 6 === 0 ? lt(c, .12) : c) });
    if (p.text) { box(0, .02, 2.25, w, .06, .3, p.hc || '#3f8f8a'); textY(p.text, (w * 16 - textW(p.text)) / 32, .09, 2.47, '#f4fbfc'); }
  }, { wall: true, mount: 0, solid: false, vb: p => [-.2, -.2, -.1, S(p, 'w', 4) + .2, .4, 2.7] }),
];
