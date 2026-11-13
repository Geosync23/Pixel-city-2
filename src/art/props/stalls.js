// Kiosks, food carts, market stalls, cafe sets, public art and the statue.
import { box, cyl, ball, cone, qz, qy, qx, lw, fq, px, C, PW, dk, lt, mix, rng, hash2, ellipse, glow, lit, signY, signX, textY, winY, winX, PAT, rect, textW } from '../../engine/raster.js';
import { bulb, clumps, leafC, everC, limb, pole, shadow, snowTop, snowMound, blooms, stringLights, awning, parasol, wheel, crate, pumpkin, stampY, LEAF, rail, ring, winter, season, P, SNOW, SNOW2, IRON, WOOD, STONE, WARM, WARM2, screenY } from './_lib.js';

const GOODS = {
  fruit: { cols: ['#d8342c', '#f08a1c', '#ffd23a', '#7ab648', '#b06ae0', '#e85a70'], aw: ['#d8342c', '#f4f0e0'], name: 'FRUIT' },
  veg: { cols: ['#4fa850', '#f08a1c', '#8a4a9a', '#d8342c', '#e8e2d4', '#7ab648'], aw: ['#3f8a4a', '#f4f0e0'], name: 'VEG' },
  flowers: { cols: ['#ff8ab0', '#ffd23a', '#ffffff', '#b06ae0', '#f25a6a', '#ff8a3a'], aw: ['#e85a90', '#fbe3ea'], name: 'BLOOM' },
  fish: { cols: ['#dce8f0', '#dce8f0', '#dce8f0', '#dce8f0', '#dce8f0', '#dce8f0'], aw: ['#2f5fa8', '#f4f0e0'], name: 'FISH' },
  bread: { cols: ['#c9903a', '#e0b060', '#a86a2a', '#d8a850', '#b87a30', '#e8c070'], aw: ['#c9792a', '#f6e8c0'], name: 'BREAD' },
  trinkets: { cols: ['#3fa890', '#e8b63a', '#d8342c', '#3b7bd8', '#b06ae0', '#f4f0e0'], aw: ['#7a4ab8', '#f0d860'], name: 'GIFTS' },
  cheese: { cols: ['#f4d060', '#e8b63a', '#f6e8a0', '#e0a030', '#f4d060', '#d8342c'], aw: ['#e8b63a', '#f4f0e0'], name: 'DAIRY' },
  books: { cols: ['#8a4b3a', '#2f5fa8', '#2f6f5f', '#c8302a', '#e8b63a', '#5a4a7a'], aw: ['#2f6f5f', '#e8dcc0'], name: 'BOOKS' },
};
const cartBase = (c, o = {}) => { // shared pushcart body: 2 x 1 footprint
  wheel(.5, .2, 0, .26); wheel(1.5, .2, 0, .26);
  box(.15, .15, .32, 1.7, .7, .7, c, o.body || {}); box(.1, .1, 1.02, 1.8, .8, .06, o.top || '#c8ccd4', { t: winter() && !o.cover ? SNOW : (o.top || '#c8ccd4') });
  wheel(.5, .87, 0, .26); wheel(1.5, .87, 0, .26); lw([.15, .3, .9], [-.15, .3, 1.0], '#3a3440'); lw([.15, .7, .9], [-.15, .7, 1.0], '#3a3440'); lw([-.15, .3, 1.0], [-.15, .7, 1.0], '#8a8f9a');
};

export default [
  {
    id: 'prop.street.kiosk', kind: 'prop', tags: ['street', 'kiosk', 'newsstand', 'shop', 'lit'], solid: true, size: [3, 2, 3], vb: [-.3, -.3, 0, 3.3, 2.6, 3.6], use: { x: 1.5, y: 2.5 }, light: { x: 1.5, y: 2.4, z: 0, r: 3.5 },
    variants: [{ seed: 1 }, { seed: 2, c: '#7a2a2a', name: 'KIOSK', aw: ['#e8b63a', '#f4f0e0'] }, { seed: 3, c: '#2f5fa8', name: 'LOTTO', aw: ['#f4f0e0', '#3b7bd8'] }, { seed: 4, c: '#e8dcc0', name: 'TICKETS', aw: ['#d8342c', '#f4f0e0'] }],
    draw(p) {
      const c = p.c || '#2f6f5f', aw = p.aw || ['#2f6f5f', '#f4f0e0'], R = rng((p.seed || 1) * 7), MC = ['#d8342c', '#e8b63a', '#3b7bd8', '#f4f0e0', '#4fa850', '#b06ae0', '#f08a1c', '#3fa890', '#ff8ab0'];
      box(0, 0, 0, 3, 1.5, 2.5, c, { l: PAT.planks(dk(c, .18), 6), r: PAT.planks(dk(c, .36), 6) });
      // open hatch with magazine racks
      qy(.3, 2.7, 1.5, .95, 2.15, '#2a2433'); glow(() => qy(.3, 2.7, 1.5, .95, 2.15, '#ffd98a', '#f4c870'));
      const mags = () => { for (let r = 0; r < 3; r++) for (let i = 0; i < 11; i++) { const x = .38 + i * .21, z = 2.05 - r * .36, m = MC[Math.floor(R() * MC.length)]; qy(x, x + .17, 1.505, z - .28, z, m); qy(x + .02, x + .15, 1.505, z - .1, z - .03, lt(m, .5)); } }; lit(mags);
      for (let r = 1; r < 3; r++) lw([.3, 1.505, 2.05 - r * .36 + .04], [2.7, 1.505, 2.05 - r * .36 + .04], '#6b4a2f');
      lw([.3, 1.5, .95], [.3, 1.5, 2.15], dk(c, .5)); lw([2.7, 1.5, .95], [2.7, 1.5, 2.15], dk(c, .5));
      box(.2, 1.5, .8, 2.6, .35, .12, '#c9a268', { t: winter() ? '#d8c8a0' : '#d8b878' });
      for (let i = 0; i < 5; i++) { const x = .35 + i * .5; box(x, 1.56, .92, .34, .24, .05 + (i % 2) * .04, i % 2 ? '#f4f0e0' : '#e4e0d0', { ol: false }); lw([x + .05, 1.8, .95], [x + .28, 1.8, .95], '#3a3440'); }
      qx(3, .25, 1.25, .6, 1.9, '#e4dcc8'); for (let r = 0; r < 3; r++) for (let i = 0; i < 3; i++) qx(3.005, .32 + i * .32, .56 + i * .32, 1.5 - r * .4, 1.82 - r * .4, MC[(i * 3 + r + (p.seed || 0)) % 9]);
      awning(-.1, 3.1, 1.3, 2.2, 2.6, 2.25, aw[0], aw[1], 8);
      box(-.1, -.1, 2.5, 3.2, 1.5, .12, dk(c, .15), { t: winter() ? SNOW : dk(c, .1) }); box(.5, .9, 2.62, 2, .12, .5, dk(c, .3)); signY(p.name || 'NEWS', .55, 2.45, 1.025, 2.68, 3.06, '#f4f0e0', dk(c, .35), { lit: true });
      stringLights([-.1, 2.21, 2.08], [3.1, 2.21, 2.08], .08, [WARM, WARM2]);
    },
  },
  {
    id: 'prop.street.cart.hotdog', kind: 'prop', tags: ['street', 'foodstand', 'cart', 'hotdog', 'food', 'lit'], solid: true, size: [2, 1, 1.2], vb: [-.9, -.9, 0, 2.9, 1.9, 3.2], use: { x: 1, y: 1.5 }, light: { x: 1, y: 1.3, z: 0, r: 3 },
    variants: [{}, { c: '#e8b63a', par: ['#3b7bd8', '#f4f0e0'], name: 'SNACKS' }, { c: '#3a3440', par: ['#e8822a', '#3a3440'], name: 'GRILL' }],
    draw(p) {
      const c = p.c || '#c8302a', par = p.par || ['#d8342c', '#ffd23a'];
      cartBase(c, { body: { l: PAT.stripes(dk(c, .18), dk(c, .05), 20) } }); signY(p.name || 'HOTDOG', .2, 1.8, .855, .55, .9, '#fff4c8', dk(c, .3), { lit: true });
      box(.3, .25, 1.08, .6, .5, .2, '#a8acb4'); glow(() => qy(.34, .86, .755, 1.1, 1.22, '#ffb03a')); const s = P(.6, .5, 1.3); if (!winter() || true) { px(s[0], s[1] - 2, C('#e8ecf0')); px(s[0] + 1, s[1] - 4, C('#e8ecf0')); px(s[0] - 1, s[1] - 6, C('#f4f8fb')); }
      for (const [x, cc] of [[1.15, '#ffd23a'], [1.3, '#d8342c'], [1.45, '#f4f0e0']]) { cyl(x, .65, 1.08, .05, .2, cc, { ol: false }); const q = P(x, .65, 1.3); px(q[0], q[1], C(dk(cc, .3))); }
      box(1.1, .2, 1.08, .55, .28, .1, '#e8c890', { ol: false }); const b = P(1.2, .34, 1.2); for (let i = 0; i < 6; i++) { px(b[0] + i, b[1] + (i >> 1), C('#c8502a')); px(b[0] + i, b[1] + (i >> 1) + 1, C('#e8c890')); }
      parasol(1.75, .15, 2.35, 1.15, par[0], par[1], !winter(), 1.08); pole(.2, .2, 1.08, 1.9, '#3a3440', 1, false); bulb(.2, .2, 1.98, 2); glow(() => qz(.15, 1.85, .15, .85, 1.09, WARM2, 'glass'));
      if (!winter()) stringLights([.75, .9, 2.25], [2.6, .6, 2.25], .12, [WARM, WARM2], 6);
    },
  },
  {
    id: 'prop.street.cart.coffee', kind: 'prop', tags: ['street', 'foodstand', 'cart', 'coffee', 'cafe', 'food', 'lit'], solid: true, size: [2, 1, 2.6], vb: [-.4, -.4, 0, 2.4, 1.7, 3], use: { x: 1, y: 1.5 }, light: { x: 1, y: 1.3, z: 0, r: 3 },
    variants: [{}, { c: '#2f6f5f', aw: ['#2f6f5f', '#f4f0e0'], name: 'TEA' }, { c: '#e8dcc0', aw: ['#3a3440', '#e8b63a'], name: 'MOCHA' }],
    draw(p) {
      const c = p.c || '#6b4a35', aw = p.aw || ['#8a4b3a', '#f6e8c0'];
      for (const [x, y] of [[.15, .15], [1.85, .15]]) pole(x, y, 1.05, 2.5, '#3a3440', 1, false);
      cartBase(c, { top: '#d8b878', cover: true, body: { l: PAT.planks(dk(c, .18), 5), r: PAT.planks(dk(c, .36), 5) } }); signY(p.name || 'COFFEE', .25, 1.75, .855, .55, .9, '#2a2433', '#ffd98a', { lit: true });
      box(.3, .2, 1.08, .7, .45, .45, '#c8ccd4'); qy(.36, .94, .655, 1.2, 1.4, '#3a3f4a'); lit(() => { const q = P(.45, .655, 1.45); px(q[0], q[1], C('#ff6a5a')); px(q[0] + 3, q[1] + 1, C('#6af08a')); }); box(.35, .22, 1.53, .6, .4, .06, '#8a8f9a', { ol: false });
      for (let i = 0; i < 3; i++) cyl(.42 + i * .2, .4, 1.59, .06, .1, '#f4f0e0', { ol: false });
      for (let i = 0; i < 3; i++) cyl(1.2 + i * .18, .6, 1.08, .06, .16, '#f4f0e0', { t: '#6b4a35', ol: false }); box(1.25, .2, 1.08, .4, .25, .25, '#e8c890'); const s = P(.6, .4, 1.75); px(s[0], s[1] - 2, C('#f4f8fb')); px(s[0] + 1, s[1] - 4, C('#f4f8fb'));
      for (const [x, y] of [[.15, .85], [1.85, .85]]) pole(x, y, 1.05, 2.25, '#3a3440', 1, false);
      awning(0, 2, 0, 1.15, 2.55, 2.25, aw[0], aw[1], 6); stringLights([0, 1.16, 2.1], [2, 1.16, 2.1], .08, [WARM, WARM2]); bulb(1.6, .7, 1.85, 2); glow(() => qz(.15, 1.85, .15, .85, 1.09, WARM2, 'glass'));
    },
  },
  {
    id: 'prop.street.cart.icecream', kind: 'prop', tags: ['street', 'foodstand', 'cart', 'icecream', 'food', 'park', 'beach', 'lit'], solid: true, size: [2, 1, 1.2], vb: [-.9, -.9, 0, 2.9, 1.9, 3.2], use: { x: 1, y: 1.5 }, light: { x: 1, y: 1.3, z: 0, r: 3 },
    variants: [{}, { c: '#a8e0d8', par: ['#3fa890', '#f4f0e0'] }, { c: '#fbe3a0', par: ['#f08a1c', '#f4f0e0'], name: 'GELATO' }],
    draw(p) {
      // summer: ice cream; winter: the same cart sells hot cocoa with the parasol furled
      const w = winter(), c = p.c || '#f7c1d4', par = p.par || ['#ff8ab0', '#f4f0e0'];
      cartBase(c, { top: '#f4f0e0', body: { l: PAT.vstripes(dk(c, .12), '#f4f0e0', 4), r: PAT.vstripes(dk(c, .34), '#d0ccc0', 4) } });
      signY(w ? 'COCOA' : (p.name || 'ICES'), .15, 1.85, .855, .55, .9, '#fff8f0', w ? '#6b3a25' : '#e85a90', { lit: true });
      for (let i = 0; i < 2; i++) { box(.3 + i * .55, .25, 1.08, .45, .45, .08, '#c8ccd4'); const q = P(.52 + i * .55, .47, 1.17); px(q[0], q[1], C('#3a3440')); }
      if (w) { cyl(1.5, .5, 1.08, .16, .3, '#c8ccd4'); const s = P(1.5, .5, 1.45); px(s[0], s[1] - 2, C('#f4f8fb')); px(s[0] + 1, s[1] - 4, C('#f4f8fb')); px(s[0] - 1, s[1] - 6, C('#f4f8fb')); }
      else { const s = P(1.5, .5, 1.08); for (let j = 0; j < 7; j++) { const hw = Math.round((6 - j) * .45); for (let i = -hw; i <= hw; i++) px(s[0] + i, s[1] - 8 + j, C((i + j) & 1 ? '#d8a050' : '#c08838')); } ball(1.5, .5, 1.75, .17, '#ff9ac0'); ball(1.5, .5, 1.98, .14, '#fff4d8'); const q = P(1.5, .5, 2.14); px(q[0], q[1], C('#d8342c')); px(q[0], q[1] - 1, C('#d8342c')); }
      parasol(.45, .2, 2.35, 1.15, par[0], par[1], !w, 1.08); pole(1.8, .2, 1.08, 1.8, '#3a3440', 1, false); bulb(1.8, .2, 1.88, 2); glow(() => qz(.15, 1.85, .15, .85, 1.09, WARM2, 'glass'));
    },
  },
  {
    id: 'prop.street.foodtruck', kind: 'prop', tags: ['street', 'foodstand', 'truck', 'taco', 'food', 'lit', 'festival'], solid: true, size: [4, 2, 2.8], vb: [-.3, -.3, 0, 4.4, 3.2, 3.6], use: { x: 1.6, y: 2.8 }, light: { x: 1.6, y: 2.6, z: 0, r: 4.5 },
    variants: [{ seed: 1 }, { seed: 2, c: '#d8342c', c2: '#ffd23a', name: 'BURGERS' }, { seed: 3, c: '#e8b63a', c2: '#3a3440', name: 'NOODLES' }, { seed: 4, c: '#f4f0e0', c2: '#e85a90', name: 'CREPES' }],
    draw(p) {
      const c = p.c || '#3fa890', c2 = p.c2 || '#f08a1c';
      wheel(.8, .25, 0, .36); wheel(3.3, .25, 0, .36); box(.05, .25, .3, 3.9, 1.5, .12, '#3a3440', { ol: false });
      // box body + lower cab at the +x end
      box(0, .2, .4, 2.9, 1.6, 2.2, c, { t: winter() ? SNOW : lt(c, .2) }); qy(0, 2.9, 1.8, .4, .85, c2); lw([0, 1.8, .85], [2.9, 1.8, .85], dk(c2, .4));
      box(2.9, .25, .4, 1.1, 1.5, 1.5, lt(c, .12), { t: winter() ? SNOW : lt(c, .25) }); winX(4, .4, 1.6, 1.15, 1.75, { on: false, frame: '#2a2433' }); winY(3.05, 3.8, 1.75, 1.15, 1.75, { on: false, frame: '#2a2433' });
      qx(4, .3, 1.7, .4, .62, '#c8ccd4'); lit(() => { qx(4.005, .35, .6, .7, .86, '#fff8d0'); qx(4.005, 1.4, 1.65, .7, .86, '#fff8d0'); }); qy(3, 3.9, 1.75, .4, .75, c2);
      // serving window
      qy(.5, 2.5, 1.8, 1.25, 2.1, '#2a2433'); glow(() => qy(.5, 2.5, 1.8, 1.25, 2.1, '#ffd98a', '#f4c870')); lw([.5, 1.8, 1.25], [.5, 1.8, 2.1], dk(c, .5)); lw([2.5, 1.8, 1.25], [2.5, 1.8, 2.1], dk(c, .5));
      lit(() => { for (let i = 0; i < 4; i++) { qy(.62 + i * .46, .98 + i * .46, 1.805, 1.72, 2.02, ['#f4f0e0', '#2a2433'][i % 2]); lw([.68 + i * .46, 1.805, 1.92], [.92 + i * .46, 1.805, 1.92], '#f08a1c'); lw([.68 + i * .46, 1.805, 1.84], [.86 + i * .46, 1.805, 1.84], '#8a8f9a'); } });
      box(.4, 1.8, 1.15, 2.2, .3, .08, '#c8ccd4'); for (const [x, cc] of [[.7, '#d8342c'], [.9, '#ffd23a'], [1.9, '#4fa850']]) cyl(x, 1.97, 1.23, .05, .16, cc, { ol: false }); box(1.2, 1.86, 1.23, .4, .2, .06, '#f4f0e0', { ol: false });
      awning(.35, 2.65, 1.8, 2.6, 2.35, 2.15, c2, '#f4f0e0', 8);
      signY(p.name || 'TACOS', .4, 2.6, 1.805, .95, 1.1, c, c, { frame: false }); box(.5, 1.0, 2.6, 2, .14, .6, dk(c2, .2)); signY(p.name || 'TACOS', .55, 2.45, 1.145, 2.68, 3.12, '#2a2433', '#ffe27a', { lit: true });
      wheel(.8, 1.82, 0, .36); wheel(3.3, 1.78, 0, .36); cyl(2.3, .6, 2.6, .14, .25, '#8a8f9a'); const s = P(2.3, .6, 2.9); px(s[0], s[1] - 2, C('#e8ecf0')); px(s[0] + 1, s[1] - 5, C('#e8ecf0'));
      stringLights([0, 1.82, 2.6], [2.9, 1.82, 2.6], .1); textY('MENU', 2.55 + .02, 1.805, 1.9, lt(c, .6));
    },
  },
  {
    id: 'prop.street.stall', kind: 'prop', tags: ['street', 'stall', 'market', 'shop', 'oldtown', 'harbor', 'lit'], solid: true, size: [3, 2, 2.8], vb: [-.4, -.4, 0, 3.4, 2.6, 3.2], use: { x: 1.5, y: 2.5 }, light: { x: 1.5, y: 2.3, z: 0, r: 3.5 },
    variants: Object.keys(GOODS).map((kind, i) => ({ kind, seed: i + 1 })),
    draw(p) {
      const kind = p.kind || 'fruit', G = GOODS[kind] || GOODS.fruit, aw = p.aw || G.aw, R = rng((p.seed || 1) * 11), s = season(), cloth = p.cloth || lt(aw[0], .1);
      for (const x of [.1, 2.9]) pole(x, .1, 0, 2.7, '#8a6a45', 2, false);
      qy(.1, 2.9, .12, .9, 2.0, dk(aw[0], .35), dk(aw[0], .45));
      box(.15, .8, 0, 2.7, 1.0, .82, cloth, { l: PAT.vstripes(dk(cloth, .12), dk(lt(cloth, .3), .1), 6), r: dk(cloth, .36), t: '#c9a268' });
      // produce: a raised back row and a front row of crates
      for (let row = 0; row < 2; row++) for (let i = 0; i < 3; i++) {
        const x = .28 + i * .84, y = row ? 1.32 : .86, z = row ? .82 : 1.02, col = G.cols[(i + row * 3) % G.cols.length];
        if (!row) box(x, y, .82, .72, .44, .2, '#b8925a', { ol: false });
        if (kind === 'flowers') { for (let k = 0; k < 2; k++) { cyl(x + .18 + k * .36, y + .22, z, .14, .22, ['#8a959e', '#c0623a', '#3fa890'][(i + k) % 3]); clumps([{ x: x + .18 + k * .36, y: y + .22, z: z + .42, r: .2, c: s === 3 ? everC(k) : '#4f9a45' }], { seed: i * 3 + k + row, bump: .2 }); blooms(x + .06 + k * .36, x + .3 + k * .36, y + .12, y + .32, z + .46, s === 3 ? ['#d8342c', '#f4f0e0'] : [G.cols[(i * 2 + k + row) % 6], G.cols[(i + k * 3 + row) % 6]], 5, i * 7 + k + row, null); } continue; }
        if (kind === 'books') { box(x, y, z, .72, .44, .1, '#b8925a', { ol: false }); for (let k = 0; k < 8; k++) { const cc = G.cols[Math.floor(R() * 6)]; box(x + .03 + k * .085, y + .06, z + .1, .075, .32, .2 + R() * .08, cc, { ol: false }); } continue; }
        if (kind === 'trinkets') { box(x, y, z, .72, .44, .06, '#3a3440', { ol: false }); for (let k = 0; k < 6; k++) { const cc = G.cols[Math.floor(R() * 6)], bx = x + .06 + (k % 3) * .22, by = y + .05 + Math.floor(k / 3) * .2; if (k % 2) cyl(bx + .07, by + .07, z + .06, .06, .1 + R() * .1, cc, { ol: false }); else box(bx, by, z + .06, .14, .14, .08 + R() * .1, cc, { ol: false }); } continue; }
        if (kind === 'cheese') { box(x, y, z, .72, .44, .06, '#b8925a', { ol: false }); cyl(x + .22, y + .22, z + .06, .18, .12, col); cyl(x + .54, y + .24, z + .06, .13, .1 + .06 * row, G.cols[(i + 2) % 5]); if (i === 1) { const q = P(x + .22, y + .22, z + .18); px(q[0], q[1], C('#a8782a')); px(q[0] + 1, q[1] + 1, C('#a8782a')); } continue; }
        crate(x, y, z, .72, .44, .18, kind === 'fish' ? '#8ab0c8' : '#c9a268', col);
        if (kind === 'fish') { for (let k = 0; k < 4; k++) { const q = P(x + .12 + R() * .46, y + .1 + R() * .24, z + .18), fc = i === 2 && !row ? '#e8502a' : ['#8aa8c0', '#a8b8c8', '#6a8aa8'][k % 3]; for (let u = 0; u < 5; u++) px(q[0] + u, q[1] + (u >> 1), C(u === 4 ? dk(fc, .3) : u === 1 ? '#f4f8fb' : fc)); px(q[0] + 5, q[1] + 1, C(dk(fc, .2))); px(q[0] + 5, q[1] + 3, C(dk(fc, .2))); } }
        else if (kind === 'bread') { for (let k = 0; k < 4; k++) { const q = P(x + .1 + R() * .5, y + .1 + R() * .24, z + .2); for (let u = 0; u < 5; u++) { px(q[0] + u, q[1] + (u >> 1), C(lt(col, .25))); px(q[0] + u, q[1] + (u >> 1) + 1, C(dk(col, .15))); } } }
        else { for (let k = 0; k < 9; k++) { const q = P(x + .08 + R() * .56, y + .08 + R() * .28, z + .2); px(q[0], q[1], C(lt(col, .3))); px(q[0] + 1, q[1], C(col)); px(q[0], q[1] + 1, C(col)); px(q[0] + 1, q[1] + 1, C(dk(col, .25))); } }
      }
      if (kind === 'fish') { box(2.45, 1.05, .82, .3, .3, .45, '#c8ccd4', { ol: false }); const q = P(2.6, 1.2, 1.3); ellipse(q[0], q[1], 3, 3, '#f4f0e0'); px(q[0], q[1], C('#d8342c')); }
      if ((kind === 'fruit' || kind === 'veg') && s === 2) { pumpkin(2.8, 1.92, 0, 4); pumpkin(.25, 1.95, 0, 3, '#d86a1c'); }
      if (kind === 'trinkets') for (let i = 0; i < 5; i++) { const x = .5 + i * .5; lw([x, 1.6, 2.25], [x, 1.6, 2.0], '#3a3440'); lit(() => { const q = P(x, 1.6, 1.95); for (const d of [[0, 0], [-1, 1], [0, 1], [1, 1], [0, 2]]) px(q[0] + d[0], q[1] + d[1], C(['#ff8a7a', '#ffd98a', '#8ad0ff', '#b6f08a', '#ff9ad8'][i])); }); }
      qy(1.05, 1.95, 1.805, .25, .6, '#2a3038'); textY(G.name.slice(0, 5), 1.5 - textW(G.name.slice(0, 5)) / 32, 1.81, .52, '#f4f0e0');
      for (const x of [.1, 2.9]) pole(x, 1.95, 0, 2.3, '#8a6a45', 2, false);
      awning(-.15, 3.15, -.05, 2.25, 2.75, 2.28, aw[0], aw[1], 8, { val: .2 });
      stringLights([-.1, 2.26, 2.06], [3.1, 2.26, 2.06], .1, [WARM, WARM2, '#fffbe8']);
      for (const x of [.8, 2.2]) { lw([x, 1.7, 1.95], [x, 1.7, 1.75], '#3a3440'); bulb(x, 1.7, 1.68, 1.5); } glow(() => { qy(.15, 2.85, 1.8, .62, .82, WARM2, 'glass'); qz(.2, 2.8, .85, 1.75, 1.03, WARM2, 'glass'); });
    },
  },
  {
    id: 'prop.street.cafeset', kind: 'prop', tags: ['street', 'cafe', 'table', 'parasol', 'seat', 'plaza', 'terrace'], solid: true, size: [2, 2, 1], vb: [-.6, -.6, 0, 2.6, 2.6, 3.1],
    seats: [{ x: .4, y: 1, z: .45, dir: 0 }, { x: 1.6, y: 1, z: .45, dir: 2 }, { x: 1, y: .4, z: .45, dir: 1 }, { x: 1, y: 1.6, z: .45, dir: 3 }],
    variants: [{}, { par: ['#d8342c', '#f4f0e0'], c: '#3a3440' }, { par: ['#2f6f5f', '#2f6f5f'], n: 4, c: '#8a959e' }, { par: null, c: '#3fa890', n: 4 }, { par: ['#e8b63a', '#f4f0e0'], c: '#f4f0e0', top: '#c9a268' }, { par: ['#2f5fa8', '#f4f0e0'], n: 3, c: '#8a4b3a' }],
    draw(p) {
      const c = p.c || '#a8744a', par = p.par === null ? null : (p.par || ['#3b7bd8', '#f4f0e0']), n = p.n || 2, top = p.top || '#e8e2d4', w = winter();
      const chair = (x, y, dir) => { // dir: which way the sitter faces
        const bx = dir === 0 ? x - .2 : dir === 2 ? x + .16 : x - .2, by = dir === 1 ? y - .2 : dir === 3 ? y + .16 : y - .2;
        const back = () => { if (dir === 0 || dir === 2) box(bx, y - .2, .45, .04, .4, .45, c, { ol: false, r: PAT.vstripes(dk(c, .36), dk(c, .55), 2) }); else box(x - .2, by, .45, .4, .04, .45, c, { ol: false, l: PAT.vstripes(dk(c, .18), dk(c, .4), 2) }); };
        if (dir === 0 || dir === 1) back();
        for (const [dx, dy] of [[-.18, -.18], [.16, -.18], [-.18, .16], [.16, .16]]) lw([x + dx, y + dy, 0], [x + dx, y + dy, .42], dk(c, .45));
        box(x - .2, y - .2, .42, .4, .4, .05, c, { t: w ? SNOW : lt(c, .15) });
        if (dir === 2 || dir === 3) back();
      };
      shadow(1, 1, 0, par && !w ? 1.1 : .6);
      if (n > 2) chair(1, .4, 1); chair(.4, 1, 0);
      cyl(1, 1, 0, .2, .04, '#3a3440', { ol: false }); pole(1, 1, .04, .72, '#3a3440', 2, false); cyl(1, 1, .72, .42, .05, top, { t: w ? SNOW : top });
      if (!w) { const s = P(.88, 1.05, .78); px(s[0], s[1], C('#f4f0e0')); px(s[0], s[1] - 1, C('#f4f0e0')); px(s[0] + 1, s[1] - 1, C('#6b4a35')); const q = P(1.15, .9, .78); px(q[0], q[1] - 1, C('#d8342c')); px(q[0], q[1], C('#4f9a45')); }
      chair(1.6, 1, 2); if (n > 3) chair(1, 1.6, 3);
      if (par) parasol(1, 1, 2.35, 1.2, par[0], par[1], !w, .76);
    },
  },
  /* ================= public art ================= */
  {
    id: 'prop.street.art.leaf', kind: 'prop', tags: ['street', 'art', 'sculpture', 'maple', 'symbol', 'plaza', 'landmark'], solid: true, size: [2, 1, 3.2], vb: [-.4, -.2, 0, 2.4, 1.2, 3.6], light: { x: 1, y: 1.2, z: 0, r: 3 },
    variants: [{}, { c: '#e8b63a' }, { c: '#c8ccd4' }],
    draw(p) {
      // the city's symbol: a big steel maple leaf on a stone plinth, uplit at night
      const c = p.c || '#d8342c', L = ['......#......', '......#......', '.....###.....', '..#..###..#..', '..##.###.##..', '..#########..', '#.#########.#', '#############', '.###########.', '..#########..', '...#######...', '.#####.#####.', '......#......', '......#......'];
      box(.2, .15, 0, 1.6, .7, .2, STONE); box(.35, .22, .2, 1.3, .56, .25, lt(STONE, .08), { l: PAT.stone(dk(STONE, .15)), t: winter() ? SNOW : lt(STONE, .08) }); qy(.7, 1.3, .785, .26, .4, '#8a6a35'); lw([.78, .786, .35], [1.22, .786, .35], '#f6e8a0'); lw([.84, .786, .3], [1.16, .786, .3], '#e8c85a');
      const s = P(1, .5, .45), sc = 3, w = 13 * sc, x0 = s[0] - (w >> 1), y0 = s[1] - 14 * sc;
      const plot = (ox, oy, col) => L.forEach((r, v) => { for (let u = 0; u < 13; u++) if (r[u] === '#') for (let j = 0; j < sc; j++) for (let i = 0; i < sc; i++) { const X = u * sc + i, Yp = v * sc + j; px(x0 + X + ox, y0 + Yp + oy + ((X - w / 2) >> 2), C(typeof col === 'function' ? col(X, Yp) : col)); } });
      plot(2, 0, dk(c, .45)); plot(1, 0, dk(c, .3)); plot(0, 0, (X, Yp) => (X + Yp * 2) % 13 < 2 ? lt(c, .3) : X < 14 ? lt(c, .08) : c);
      for (let v = 2; v < 12; v++) px(x0 + 19, y0 + v * sc + 1, C(dk(c, .25)));
      if (winter()) L[3].split('').forEach((ch, u) => { if (L[5][u] === '#') for (let i = 0; i < sc; i++) px(x0 + u * sc + i, y0 + (L[3][u] === '#' ? 3 : L[4][u] === '#' ? 4 : 5) * sc - 1 + ((u * sc - w / 2) >> 2), C(SNOW)); });
      glow(() => { for (const x of [.45, 1.55]) { const q = P(x, .9, .22); px(q[0], q[1], C(WARM)); px(q[0] + 1, q[1], C(WARM)); px(q[0], q[1] - 1, C('#fffbe8')); } });
    },
  },
  {
    id: 'prop.street.art.balance', kind: 'prop', tags: ['street', 'art', 'sculpture', 'arts', 'plaza', 'modern'], solid: true, size: [1, 1, 3], vb: [-.4, -.4, 0, 1.4, 1.4, 3.4], variants: [{ seed: 1 }, { seed: 2, cols: ['#3fa890', '#f4f0e0', '#e85a90'] }, { seed: 3, cols: ['#c8ccd4', '#c8ccd4', '#e8c85a'] }],
    draw(p) {
      const cols = p.cols || ['#d8342c', '#ffd23a', '#3b7bd8'], R = rng((p.seed || 1) * 3);
      shadow(.5, .5, 0, .6); cyl(.5, .5, 0, .42, .15, '#56636b', { t: winter() ? SNOW : '#6a757e' });
      let x = .5, y = .5, z = .15; [.52, .4, .3].forEach((r, i) => { z += r * .95; x += (R() - .5) * .22; y += (R() - .5) * .22; ball(x, y, z, r, cols[i]); if (winter()) { const q = P(x, y, z + r * 1.05); if (i === 2) ellipse(q[0], q[1] + 2, r * 12, 2, SNOW); } z += r * .9; });
      pole(x + .02, y, z - .05, z + .35, '#3a3440', 1, false); const q = P(x + .02, y, z + .4); for (const d of [[0, 0], [-1, 1], [1, 1], [0, 2], [-2, 0], [2, 0]]) px(q[0] + d[0], q[1] + d[1], C('#e8c85a'));
    },
  },
  {
    id: 'prop.street.art.arc', kind: 'prop', tags: ['street', 'art', 'sculpture', 'downtown', 'plaza', 'modern', 'harbor'], solid: true, size: [3, 1, 2.6], vb: [-.3, -.3, 0, 3.3, 1.3, 3], variants: [{}, { c: '#c0623a' }, { c: '#3b7bd8', orb: '#ffd23a' }],
    draw(p) {
      const c = p.c || '#b8c0c8', pts = [], pts2 = [];
      box(.05, .2, 0, .7, .6, .12, '#56636b', { t: winter() ? SNOW : '#6a757e' }); box(2.25, .2, 0, .7, .6, .12, '#56636b', { t: winter() ? SNOW : '#6a757e' });
      for (let i = 0; i <= 24; i++) { const t = i / 24, a = t * Math.PI; pts.push([.4 + t * 2.2, .5 + Math.sin(a * 2) * .12, .12 + Math.sin(a) * 2.3]); pts2.push([.4 + t * 2.2, .5 + Math.sin(a * 2) * .12, .12 + Math.sin(a) * 2.3 - .12 - .25 * Math.sin(a)]); }
      for (let i = 0; i < 24; i++) { fq([pts[i], pts[i + 1], pts2[i + 1], pts2[i]], i < 12 ? lt(c, .1) : dk(c, .22)); lw(pts[i], pts[i + 1], winter() && i > 6 && i < 18 ? SNOW : lt(c, .45)); lw(pts2[i], pts2[i + 1], dk(c, .6)); }
      lw([1.5, .5, 2.05], [1.5, .5, 1.5], '#3a3440'); ball(1.5, .5, 1.25, .26, p.orb || '#e8c85a');
    },
  },
  {
    id: 'prop.street.art.cubes', kind: 'prop', tags: ['street', 'art', 'sculpture', 'arts', 'university', 'lit', 'modern'], solid: true, size: [1, 1, 3], vb: [-.4, -.4, 0, 1.5, 1.5, 3.4], light: { x: .5, y: .5, z: 0, r: 2.5 }, variants: [{ seed: 1 }, { seed: 2, cols: ['#3fa890', '#3b7bd8', '#b06ae0', '#e85a90'] }, { seed: 3, cols: ['#f4f0e0', '#e8b63a', '#f4f0e0', '#e8b63a'] }],
    draw(p) {
      const cols = p.cols || ['#e8822a', '#d8342c', '#e8b63a', '#ff8ab0'], R = rng((p.seed || 1) * 5); let z = 0;
      shadow(.5, .5, 0, .6);
      for (let i = 0; i < 4; i++) { const s = .8 - i * .13, ox = .5 - s / 2 + (R() - .5) * .25, oy = .5 - s / 2 + (R() - .5) * .25, c = cols[i % cols.length]; box(ox, oy, z, s, s, s * .9, c, { t: winter() && i === 3 ? SNOW : lt(c, .15) }); lit(() => { lw([ox + .06, oy + s, z + .06], [ox + s - .06, oy + s, z + .06], lt(c, .6)); lw([ox + s, oy + .06, z + .06], [ox + s, oy + s - .06, z + .06], lt(c, .4)); }); z += s * .9; }
    },
  },
  {
    id: 'prop.street.statue', kind: 'prop', tags: ['street', 'park', 'statue', 'monument', 'landmark', 'plaza', 'civic'], solid: true, size: [2, 2, 4.4], vb: [-.3, -.3, 0, 2.3, 2.3, 4.9], light: { x: 1, y: 2.3, z: 0, r: 3 },
    variants: [{ name: '1887' }, { name: 'CAPT', c: '#8a6a45', pose: 'scope' }, { name: 'POET', c: '#8a959e', pose: 'book', plinth: '#c8b8a0' }],
    draw(p) {
      const c = p.c || '#5aa890', pc = p.plinth || '#b9b4a8', w = winter(), pose = p.pose || 'hail';
      box(0, 0, 0, 2, 2, .2, dk(pc, .08), { t: w ? SNOW : PAT.ftile(pc, dk(pc, .06), .5) }); box(.25, .25, .2, 1.5, 1.5, .2, pc, { t: w ? SNOW : pc });
      box(.5, .5, .4, 1, 1, 1.5, pc, { l: PAT.stone(dk(pc, .18)), r: PAT.stone(dk(pc, .36)) }); box(.42, .42, 1.9, 1.16, 1.16, .12, lt(pc, .1), { t: w ? SNOW : lt(pc, .1) });
      signY(String(p.name || '1887').slice(0, 4), .5, 1.5, 1.505, .9, 1.3, '#8a6a35', '#f6e8a0', { frame: true }); if (!w && season() < 2) blooms(.3, 1.7, 1.78, 1.9, .42, ['#f25a6a', '#ffd23a', '#ffffff'], 7, 3);
      // bronze / verdigris figure, about 2.3 tall
      const z = 2.02, cx = 1, cy = 1, sh = { ol: false };
      box(cx - .2, cy - .12, z, .16, .2, .95, dk(c, .08), sh); box(cx + .04, cy - .12, z, .16, .2, .95, dk(c, .08), sh);
      box(cx - .26, cy - .16, z + .7, .52, .3, .2, c, sh); // coat skirt
      box(cx - .24, cy - .15, z + .9, .48, .28, .7, c, sh);
      if (pose === 'hail') { limb([cx + .22, cy, z + 1.5], [cx + .5, cy + .1, z + 2.05], c, 3, 2); const q = P(cx + .52, cy + .1, z + 2.1); px(q[0], q[1], C(lt(c, .3))); px(q[0], q[1] - 1, C(lt(c, .3))); limb([cx - .26, cy, z + 1.5], [cx - .32, cy + .1, z + .95], dk(c, .1), 3, 2); }
      else if (pose === 'scope') { limb([cx + .22, cy, z + 1.5], [cx + .3, cy + .25, z + 1.78], c, 3, 2); limb([cx + .05, cy + .2, z + 1.78], [cx + .6, cy + .45, z + 1.86], lt(c, .2), 2, 2); limb([cx - .26, cy, z + 1.5], [cx - .3, cy + .12, z + 1.0], dk(c, .1), 3, 2); }
      else { limb([cx + .22, cy, z + 1.5], [cx + .2, cy + .25, z + 1.25], c, 3, 2); limb([cx - .26, cy, z + 1.5], [cx - .1, cy + .25, z + 1.25], dk(c, .1), 3, 2); box(cx - .14, cy + .2, z + 1.2, .32, .1, .2, lt(c, .25), sh); }
      ball(cx, cy, z + 1.82, .17, c); const h = P(cx, cy, z + 1.98); for (let i = -4; i <= 4; i++) px(h[0] + i, h[1] + 1, C(w ? SNOW : dk(c, .3))); for (let i = -2; i <= 2; i++) { px(h[0] + i, h[1], C(w ? SNOW : dk(c, .15))); px(h[0] + i, h[1] - 1, C(w ? SNOW : c)); }
      for (let j = 0; j < 6; j++) { const q = P(cx - .24, cy + .13, z + 1.55 - j * .1); px(q[0] + 1, q[1], C(lt(c, .35))); } // lit edge
      if (w) { const q = P(cx, cy, z + 1.62); for (let i = -4; i <= 4; i++) if (Math.abs(i) > 1) px(q[0] + i, q[1] - 1 + (i >> 2), C(SNOW)); } else { const q = P(cx - .1, cy, z + 2.06); px(q[0], q[1] - 1, C('#8a8f9a')); px(q[0] + 1, q[1] - 1, C('#a8acb4')); px(q[0] + 2, q[1] - 2, C('#8a8f9a')); px(q[0] + 3, q[1] - 1, C('#e8a23a')); }
      glow(() => { for (const x of [.4, 1.6]) { const q = P(x, 1.85, .42); px(q[0], q[1], C(WARM)); px(q[0] + 1, q[1], C(WARM)); px(q[0], q[1] - 1, C('#fffbe8')); } });
    },
  },
];
