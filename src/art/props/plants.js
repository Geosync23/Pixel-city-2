// Bushes, hedges, flowers, rocks and small seasonal nature props.
import { box, cyl, ball, cone, qz, qy, qx, lw, px, C, PW, ENV, dk, lt, mix, rng, hash2, foliage, grassC, ellipse, signY } from '../../engine/raster.js';
import { clumps, leafC, everC, leafBox, limb, pole, trunk, shadow, scatter, snowTop, snowMound, blooms, tufts, rock, pumpkin, disc, winter, season, P, SNOW, SNOW2, BARK, WOOD, conifer } from './_lib.js';

const AUT = ['#e08a2c', '#d9562b', '#e8b63a', '#c9792a', '#b8432a'];
const FLW = { mixed: ['#f25a6a', '#ffd23a', '#ffffff', '#b06ae0', '#ff8ab0'], red: ['#e8342c', '#f25a6a', '#ff8a7a'], yellow: ['#ffd23a', '#ffe98a', '#f4a82a'], pink: ['#ff8ab0', '#f7c1d4', '#e85a90'], purple: ['#b06ae0', '#8a5ad0', '#d8a8f0'], white: ['#ffffff', '#fbf3d8', '#ffe98a'], blue: ['#5a8ae8', '#8ab8f8', '#ffffff'] };
const flw = p => Array.isArray(p.cols) ? p.cols : FLW[p.cols || 'mixed'] || FLW.mixed;
const SOIL = '#6a4a36';
/** bare winter shrub: a fan of twigs with snow */
function twigs(x, y, z, r, h, seed, c = '#7a5a45') { const R = rng(seed * 7 + 1); for (let i = 0; i < 9; i++) { const a = i / 9 * 6.283 + R(), l = r * (.5 + R() * .5); limb([x, y, z], [x + Math.cos(a) * l, y + Math.sin(a) * l, z + h * (.5 + R() * .5)], c, 1, 1, winter()); } }

export default [
  {
    id: 'prop.nature.bush', kind: 'prop', tags: ['nature', 'bush', 'park', 'garden'], solid: true,
    size: p => [p.w || 1, 1, .9], vb: p => [-.4, -.4, 0, (p.w || 1) + .4, 1.4, 1.5],
    variants: [{ seed: 1 }, { seed: 2, w: 1.5 }, { seed: 3, kind: 'flower', cols: 'pink' }, { seed: 4, kind: 'berry' }, { seed: 5, kind: 'flower', cols: 'white', w: 2 }, { seed: 6, kind: 'holly' }],
    draw(p) {
      const w = p.w || 1, r = rng((p.seed || 1) * 3 + 1), s = season(), ever = p.kind === 'holly', n = Math.round(3 + w * 2), bl = [];
      shadow(w / 2, .5, 0, .5 + w * .12);
      if (s === 3 && !ever) { for (let i = 0; i < Math.ceil(w); i++) twigs(.5 + i * (w - 1) / Math.max(1, Math.ceil(w) - 1 || 1), .5, 0, .55, .9, (p.seed || 1) + i); snowMound(w / 2, .55, 0, .3 + w * .1); if (p.kind === 'berry') scatter(w / 2, .5, .5, .35, ['#d8342c'], 6, p.seed); return; }
      for (let i = 0; i < n; i++) { const t = n === 1 ? .5 : i / (n - 1), c = ever ? everC(i, '#2a6a3a', .4) : s === 2 ? AUT[(i + (p.seed || 0)) % 5] : leafC(i + (p.seed || 0), p.kind === 'berry' ? '#3a7a4a' : null); bl.push({ x: .4 + t * (w - .8) + (r() - .5) * .15, y: .45 + (r() - .5) * .3, z: .42 + r() * .25, r: .46 + r() * .12, c }); }
      bl.sort((a, b) => a.x + a.y + a.z - b.x - b.y - b.z);
      const dots = p.kind === 'flower' && s < 2 ? { c: flw(p), p: s === 0 ? .3 : .22 } : (p.kind === 'berry' && s >= 1) || ever ? { c: ['#d8342c'], p: ever && s !== 3 && s !== 2 ? .04 : .16 } : null;
      clumps(bl, { seed: p.seed, bump: .14, dots, snow: winter() });
      if (s === 2) scatter(w / 2, .5, 0, .6 + w * .15, AUT, 6, p.seed);
    },
  },
  {
    id: 'prop.nature.hedge', kind: 'prop', tags: ['nature', 'hedge', 'park', 'garden', 'fence', 'segment'], solid: true,
    size: p => [p.len || 2, .5, p.h || 1], vb: p => [-.1, -.1, 0, (p.len || 2) + .1, .7, (p.h || 1) + .3],
    variants: [{ len: 2, seed: 1 }, { len: 4, seed: 2 }, { len: 3, h: 1.5, seed: 3 }, { len: 2, h: .5, flowers: 'pink', seed: 4 }, { len: 4, flowers: 'white', arch: false, seed: 5 }],
    draw(p) {
      const L = p.len || 2, h = p.h || 1, s = season(), c = s === 2 ? mix(everC(p.seed || 0), '#9a9a3a', .3) : s === 3 ? everC(1, '#3a5f4a', .5) : mix(everC(p.seed || 0), leafC(p.seed || 0) || '#4f9a45', .55);
      leafBox(0, .04, 0, L, .42, h, c);
      const s0 = P(0, .46, h), R = rng((p.seed || 1) + 5); // bumpy top edge: leaf pixels poking over the top rim
      for (let i = 2; i < L * 16 - 1; i += 2 + Math.floor(R() * 3)) px(s0[0] + i, s0[1] + (i >> 1) - 1, C(winter() ? SNOW : lt(c, .3)));
      if (p.flowers && s < 2) { blooms(.1, L - .1, .47, .47, h * .25 + .1, flw({ cols: p.flowers }), Math.round(L * 3), p.seed, null); blooms(.1, L - .1, .1, .4, h, flw({ cols: p.flowers }), Math.round(L * 4), (p.seed || 1) + 1, null); blooms(.1, L - .1, .47, .47, h * .7, flw({ cols: p.flowers }), Math.round(L * 3), (p.seed || 1) + 2, null); }
    },
  },
  {
    id: 'prop.nature.topiary', kind: 'prop', tags: ['nature', 'topiary', 'garden', 'hillcrest', 'formal', 'planter'], solid: true,
    size: [1, 1, 2], vb: [-.2, -.2, 0, 1.2, 1.2, 2.7],
    variants: [{ shape: 'ball' }, { shape: 'double' }, { shape: 'cone' }, { shape: 'spiral' }, { shape: 'cube', pot: '#e8e2d4' }, { shape: 'ball', pot: '#3d4a54' }],
    draw(p) {
      const pot = p.pot || '#c0623a', c = everC(1, '#3f8f4a', .5), sh = p.shape || 'ball', sn = winter();
      shadow(.5, .5, 0, .5); cyl(.5, .5, 0, .3, .45, pot, { t: SOIL }); cyl(.5, .5, .4, .34, .08, lt(pot, .1), { t: SOIL });
      if (sh !== 'cone' && sh !== 'cube') pole(.5, .5, .48, 1.2, BARK, 2, false);
      if (sh === 'ball') clumps([{ x: .5, y: .5, z: 1.35, r: .52, sq: .95, c }], { bump: .04, snow: sn, seed: 2 });
      else if (sh === 'double') { clumps([{ x: .5, y: .5, z: 1.0, r: .45, sq: .9, c }], { bump: .04, snow: sn, seed: 2 }); pole(.5, .5, 1.3, 1.8, BARK, 2, false); clumps([{ x: .5, y: .5, z: 1.95, r: .32, sq: .95, c: lt(c, .06) }], { bump: .04, snow: sn, seed: 3 }); }
      else if (sh === 'cone') conifer(.5, .5, .3, 2, .48, 1, c, { skirt: .25, jag: 0 });
      else if (sh === 'spiral') { for (let i = 0; i < 4; i++) clumps([{ x: .5 + (i & 1 ? .06 : -.06), y: .5, z: .85 + i * .42, r: .46 - i * .09, sq: .55, c: i & 1 ? lt(c, .05) : c }], { bump: .05, snow: sn, seed: i }); }
      else { leafBox(.12, .12, .5, .76, .76, .9, c); }
    },
  },
  {
    id: 'prop.nature.flowerbed', kind: 'prop', tags: ['nature', 'flowers', 'flowerbed', 'park', 'garden'], solid: true,
    size: p => [p.w || 2, p.d || 1, .3], vb: p => [-.1, -.1, 0, (p.w || 2) + .1, (p.d || 1) + .1, 1],
    variants: [{ w: 2, d: 1, seed: 1 }, { w: 3, d: 1, cols: 'red', edge: 'brick', seed: 2 }, { w: 2, d: 2, cols: 'purple', edge: 'wood', seed: 3 }, { w: 4, d: 1, cols: 'yellow', seed: 4 }, { w: 2, d: 2, round: true, cols: 'pink', seed: 5 }, { w: 1, d: 1, cols: 'blue', edge: 'wood', seed: 6 }],
    draw(p) {
      const w = p.w || 2, d = p.d || 1, s = season(), ec = { stone: '#b9b4a8', brick: '#b5654a', wood: '#a8744a' }[p.edge || 'stone'], cols = flw(p), sd = p.seed || 1;
      if (p.round) { cyl(w / 2, d / 2, 0, w / 2 - .04, .2, ec); cyl(w / 2, d / 2, .16, w / 2 - .14, .05, SOIL, { t: s === 3 ? SNOW : SOIL, t2: s === 3 ? SNOW2 : dk(SOIL, .12), ol: false }); }
      else { box(0, 0, 0, w, d, .2, ec); qz(.1, w - .1, .1, d - .1, .21, s === 3 ? SNOW : SOIL, s === 3 ? SNOW2 : dk(SOIL, .12)); }
      const m = p.round ? w * .2 : .16, x0 = m, x1 = w - m, y0 = m, y1 = d - m, A = w * d;
      if (s === 3) { tufts(x0, x1, y0, y1, .21, '#7a6a55', Math.round(A * 3), sd, 3); tufts(x0, x1, y0, y1, .21, everC(0), Math.round(A * 2), sd + 1, 3); return; }
      tufts(x0, x1, y0, y1, .21, s === 2 ? '#7a9a45' : leafC(0), Math.round(A * 14), sd, s === 0 ? 3 : 4);
      if (s === 0) { for (let i = 0, n = Math.round(A * 9), R = rng(sd); i < n; i++) { const q = P(x0 + R() * (x1 - x0), y0 + R() * (y1 - y0), .21), c = cols[i % cols.length]; px(q[0], q[1] - 1, C('#4f9a45')); px(q[0], q[1] - 2, C('#4f9a45')); px(q[0], q[1] - 3, C(c)); px(q[0], q[1] - 4, C(lt(c, .3))); px(q[0] + 1, q[1] - 3, C(dk(c, .2))); } }
      else if (s === 1) blooms(x0, x1, y0, y1, .32, cols, Math.round(A * 12), sd);
      else blooms(x0, x1, y0, y1, .3, ['#e8822a', '#b8432a', '#e8b63a', '#8a4a9a'], Math.round(A * 10), sd, '#7a8a3a');
    },
  },
  {
    id: 'prop.nature.wildflowers', kind: 'prop', tags: ['nature', 'flowers', 'meadow', 'park', 'decal'], solid: false,
    size: p => [p.w || 2, p.w || 2, .3], variants: [{ seed: 1 }, { seed: 2, cols: 'yellow', w: 3 }, { seed: 3, cols: 'white' }, { seed: 4, cols: 'purple', w: 1 }],
    draw(p) {
      const w = p.w || 2, s = season(), g = grassC()[0];
      tufts(0, w, 0, w, 0, s === 3 ? '#a89a78' : dk(g, .15), Math.round(w * w * 5), p.seed, 3);
      if (s === 0 || s === 1) blooms(.1, w - .1, .1, w - .1, .12, flw(p), Math.round(w * w * (s ? 5 : 4)), p.seed);
      if (s === 2) scatter(w / 2, w / 2, 0, w / 2, AUT, Math.round(w * w * 3), p.seed);
    },
  },
  {
    id: 'prop.nature.grass', kind: 'prop', tags: ['nature', 'grass', 'tallgrass', 'meadow', 'water', 'decal'], solid: false,
    size: p => [p.w || 1, p.w || 1, .6], variants: [{ seed: 1 }, { seed: 2, w: 2 }, { seed: 3, w: 1.5, dry: true }],
    draw(p) { const w = p.w || 1, s = season(), g = s === 3 ? '#b8a878' : p.dry || s === 2 ? '#b8a850' : dk(grassC()[0], .2); tufts(0, w, 0, w, 0, dk(g, .12), Math.round(w * w * 16), p.seed, 5); tufts(0, w, 0, w, 0, g, Math.round(w * w * 18), (p.seed || 1) + 3, 8); if (s === 3) scatter(w / 2, w / 2, .3, w * .4, [SNOW], Math.round(w * w * 6), p.seed); },
  },
  {
    id: 'prop.nature.fern', kind: 'prop', tags: ['nature', 'fern', 'undergrowth', 'park', 'decal'], solid: false,
    size: [1, 1, .6], variants: [{ seed: 1 }, { seed: 2 }],
    draw(p) {
      const R = rng(p.seed || 1), s = season(), c = s === 2 ? '#a89a3a' : s === 3 ? '#6a7a5a' : '#3f9a55', fr = [];
      for (let i = 0; i < 8; i++) fr.push(i / 8 * 6.283 + R() * .4); fr.sort((a, b) => Math.cos(a) + Math.sin(a) - Math.cos(b) - Math.sin(b));
      for (const a of fr) { let last = null; for (let i = 0; i <= 6; i++) { const t = i / 6, q = P(.5 + Math.cos(a) * .45 * t, .5 + Math.sin(a) * .45 * t, .45 * Math.sin(t * 2.2)); px(q[0], q[1], C(dk(c, .2))); px(q[0], q[1] - 1, C(i > 3 && s === 3 ? SNOW : lt(c, .15))); if (i & 1) { px(q[0] - 1, q[1], C(c)); px(q[0] + 1, q[1], C(c)); } last = q; } }
    },
  },
  {
    id: 'prop.nature.reeds', kind: 'prop', tags: ['nature', 'reeds', 'cattail', 'water', 'pond', 'decal'], solid: false,
    size: p => [p.w || 1, 1, 1.6], vb: p => [-.2, -.2, 0, (p.w || 1) + .2, 1.2, 2.1], variants: [{ seed: 1 }, { seed: 2, w: 2 }, { seed: 3, w: 3 }],
    draw(p) {
      const w = p.w || 1, R = rng((p.seed || 1) * 5), s = season(), g = s === 3 ? '#b8a878' : s === 2 ? '#a8a04a' : '#5a9a4a', st = [];
      for (let i = 0; i < w * 9; i++) st.push([.1 + R() * (w - .2), .15 + R() * .7, .8 + R() * .9, R(), R()]);
      st.sort((a, b) => a[0] + a[1] - b[0] - b[1]);
      for (const q of st) { const a = P(q[0], q[1], 0), h = Math.round(q[2] * 16), ln = Math.round((q[3] - .5) * 5); for (let i = 0; i < h; i++) px(a[0] + Math.round(ln * (i / h) ** 2), a[1] - i, C(i & 4 ? g : dk(g, .15)));
        if (q[4] < .45) { const X = a[0] + ln, Y = a[1] - h; for (let i = 0; i < 4; i++) { px(X, Y + i, C('#6b4428')); px(X + 1, Y + i, C('#4a2f1c')); } px(X, Y - 1, C(s === 3 ? SNOW : '#c9b88a')); px(X, Y - 2, C(s === 3 ? SNOW : '#c9b88a')); } else { px(a[0] + ln + 1, a[1] - h + 2, C(lt(g, .2))); } }
    },
  },
  {
    id: 'prop.nature.lilypads', kind: 'prop', tags: ['nature', 'lily', 'water', 'pond', 'floating', 'decal'], solid: false,
    size: p => [p.w || 2, p.w || 2, .1], variants: [{ seed: 1 }, { seed: 2, w: 3 }, { seed: 3, w: 1 }],
    draw(p) {
      const w = p.w || 2, R = rng((p.seed || 1) * 9), s = season(), g = s === 3 ? '#8aa89a' : s === 2 ? '#7a9a4a' : '#4fa85a', n = Math.round(w * w * (s === 3 ? .8 : 1.6)), pads = [];
      for (let i = 0; i < n; i++) pads.push([.3 + R() * (w - .6), .3 + R() * (w - .6), .14 + R() * .12, R()]); pads.sort((a, b) => a[0] + a[1] - b[0] - b[1]);
      for (const q of pads) { const a = PW(q[0], q[1], 0), rx = q[2] * 16 * 1.4, ry = rx / 2; ellipse(a[0], a[1] + 1, rx, ry, '#2a4f6a80'); ellipse(a[0], a[1], rx, ry, dk(g, .12)); ellipse(a[0], a[1] - .5, rx - 1, ry - .6, g); const X = Math.round(a[0]), Y = Math.round(a[1]); px(X + 1, Y, C('#2a4f6a80')); px(X + 2, Y + 1, C('#2a4f6a80')); px(X - 1, Y - 1, C(lt(g, .3)));
        if (q[3] < .4 && s < 2) { const c = q[3] < .2 ? '#ff8ab0' : '#ffffff'; px(X - 1, Y - 1, C(c)); px(X, Y - 2, C(lt(c, .5))); px(X + 1, Y - 1, C(dk(c, .15))); px(X, Y - 1, C('#ffd23a')); } }
    },
  },
  {
    id: 'prop.nature.rock', kind: 'prop', tags: ['nature', 'rock', 'boulder', 'park', 'water', 'hillcrest'], solid: true,
    size: p => [p.w || 1, p.d || p.w || 1, p.h || .6], vb: p => [-.2, -.2, 0, (p.w || 1) + .2, (p.d || p.w || 1) + .2, (p.h || .6) + .3],
    variants: [{ seed: 1 }, { seed: 2, w: .5, h: .3 }, { seed: 3, w: 2, d: 1.5, h: 1.3, moss: true }, { seed: 4, w: 1.5, d: 1, h: .7, c: '#a89a8a' }, { seed: 5, w: 2, d: 2, h: 1.8, c: '#8a8f9a', moss: true }, { seed: 6, w: 2, d: 1, h: .5, cluster: true }],
    draw(p) {
      const w = p.w || 1, d = p.d || w, h = p.h || .6, c = p.c || '#9a9aa2', moss = p.moss ? '#6a9a4a' : null;
      shadow(w / 2, d / 2, 0, Math.max(w, d) * .45);
      if (p.cluster) { rock(w * .28, d * .4, 0, w * .26, d * .36, h, c, p.seed, { moss }); rock(w * .72, d * .55, 0, w * .22, d * .34, h * .7, lt(c, .08), (p.seed || 1) + 1, {}); rock(w * .5, d * .82, 0, w * .12, d * .16, h * .35, dk(c, .06), (p.seed || 1) + 2, {}); }
      else rock(w / 2, d / 2, 0, w * .46, d * .46, h, c, p.seed, { moss });
      if (!winter()) tufts(.05, w * .5, d * .8, d, 0, dk(grassC()[0], .2), 3, p.seed, 3);
    },
  },
  {
    id: 'prop.nature.stump', kind: 'prop', tags: ['nature', 'stump', 'park', 'woods'], solid: true, size: [1, 1, .5], seats: [{ x: .5, y: .5, z: .45, dir: 1 }],
    variants: [{ seed: 1 }, { seed: 2, axe: true }, { seed: 3, shoots: true }],
    draw(p) {
      const c = '#7a5a3a'; shadow(.5, .5, 0, .5);
      for (const a of [.4, 2.2, 3.6, 5.1]) limb([.5, .5, 0], [.5 + Math.cos(a) * .48, .5 + Math.sin(a) * .48, 0], dk(c, .1), 3, 1);
      cyl(.5, .5, 0, .32, .42, c, { t: winter() ? SNOW : '#d8b888' });
      if (!winter()) { const s = PW(.5, .5, .42); ellipse(s[0], s[1], 4.5, 2.2, '#c9a268'); ellipse(s[0], s[1], 2.5, 1.2, '#d8b888'); px(Math.round(s[0]), Math.round(s[1]), C('#a8824a')); }
      if (p.axe) { limb([.5, .5, .45], [.95, .3, 1.0], '#a8744a', 1, 1); const s = P(.5, .5, .5); px(s[0] - 1, s[1] - 1, C('#c8ccd4')); px(s[0], s[1] - 2, C('#c8ccd4')); px(s[0] + 1, s[1] - 1, C('#8a8f9a')); px(s[0], s[1] - 1, C('#a8acb4')); }
      if (p.shoots && season() < 3) clumps([{ x: .78, y: .7, z: .5, r: .16, c: leafC(1) || AUT[2] }, { x: .3, y: .8, z: .3, r: .13, c: leafC(0) || AUT[0] }], { seed: 1, bump: .2 });
      if (season() !== 3 && (p.seed || 1) % 2) { const s = P(.2, .78, 0); px(s[0], s[1] - 1, C('#e8e2d4')); px(s[0], s[1] - 2, C('#d8342c')); px(s[0] - 1, s[1] - 2, C('#d8342c')); px(s[0] + 1, s[1] - 2, C('#b82a24')); }
    },
  },
  {
    id: 'prop.nature.log', kind: 'prop', tags: ['nature', 'log', 'park', 'woods', 'seat'], solid: true,
    size: p => [p.len || 2, .5, .45], seats: [{ x: .6, y: .25, z: .45, dir: 1 }, { x: 1.4, y: .25, z: .45, dir: 1 }], variants: [{ len: 2, seed: 1 }, { len: 3, seed: 2, moss: true }, { len: 2, seed: 3, birch: true }],
    draw(p) {
      const L = p.len || 2, c = p.birch ? '#e4dfd2' : '#6e5038', R = rng(p.seed || 1); shadow(L / 2, .25, 0, .5);
      box(0, .05, .02, L, .4, .36, c, { l: (u, v) => (p.birch ? (u % 7 === 3 && v % 3 === 1) : hash2(u >> 2, v, 1) < .25) ? dk(c, .5) : v > 4 ? lt(dk(c, .18), .15) : dk(c, .2), t: winter() ? SNOW : (x, y) => hash2(Math.floor(x * 5), Math.floor(y * 16), 2) < .25 ? dk(c, .15) : c, r: '#c9a268' });
      const s = PW(L, .25, .2); ellipse(s[0], s[1], 2.5, 3.5, '#d8b888'); px(Math.round(s[0]), Math.round(s[1]), C('#a8824a'));
      if (p.moss && !winter()) { qz(.3, 1.2, .05, .3, .385, '#6a9a4a', '#7aac58'); const q = P(L - .5, .46, .2); px(q[0], q[1], C('#e8e2d4')); px(q[0] - 1, q[1] - 1, C('#c9792a')); px(q[0], q[1] - 1, C('#c9792a')); px(q[0] + 1, q[1] - 1, C('#a8601c')); }
      limb([L * .35, .15, .38], [L * .35 - .1, .05, .62], dk(c, .2), 1, 1);
    },
  },
  {
    id: 'prop.nature.mushrooms', kind: 'prop', tags: ['nature', 'mushroom', 'woods', 'park', 'decal'], solid: false, size: [1, 1, .4],
    variants: [{ seed: 1 }, { seed: 2, c: '#c9792a' }, { seed: 3, c: '#e8e2d4' }, { seed: 4, c: '#8a5ad0' }],
    draw(p) {
      const R = rng((p.seed || 1) * 3), c = p.c || '#d8342c', ms = []; for (let i = 0; i < 5; i++) ms.push([.15 + R() * .7, .15 + R() * .7, 2 + Math.floor(R() * 3)]); ms.sort((a, b) => a[0] + a[1] - b[0] - b[1]);
      if (!winter()) tufts(.1, .9, .1, .9, 0, dk(grassC()[0], .2), 5, p.seed, 2);
      for (const m of ms) { const s = P(m[0], m[1], 0), r = m[2]; for (let i = 0; i < r; i++) { px(s[0], s[1] - i, C('#efe8d8')); if (r > 2) px(s[0] + 1, s[1] - i, C('#cfc6b0')); }
        const cy = s[1] - r; for (let dx = -r; dx <= r + (r > 2 ? 1 : 0); dx++) { px(s[0] + dx, cy, C(dx > 0 ? dk(c, .22) : c)); px(s[0] + dx, cy + 1, C(dk(c, .6))); if (Math.abs(dx) < r) px(s[0] + dx, cy - 1, C(winter() ? SNOW : dx > 0 ? dk(c, .12) : lt(c, .15))); if (Math.abs(dx) < r - 1) px(s[0] + dx, cy - 2, C(winter() ? SNOW : lt(c, .25))); }
        for (let i = 0; i < r; i++) px(s[0] + i, s[1] - i * 0, C('#efe8d8')); if (!winter() && c !== '#e8e2d4') { px(s[0] - r + 1, cy, C('#ffffff')); if (r > 2) px(s[0] + 1, cy - 1, C('#ffffff')); } }
    },
  },
  {
    id: 'prop.nature.pumpkins', kind: 'prop', tags: ['nature', 'pumpkin', 'autumn', 'seasonal', 'garden', 'farm'], solid: true,
    size: p => [p.w || 2, p.w || 2, .6], variants: [{ seed: 1 }, { seed: 2, w: 3 }, { seed: 3, w: 1, lantern: true }],
    draw(p) {
      // autumn: ripe pumpkins; summer: green vines with small green fruit; spring: seedlings in soil mounds; winter: snowy mounds + a forgotten pumpkin
      const w = p.w || 2, s = season(), R = rng((p.seed || 1) * 11), it = []; qz(.1, w - .1, .1, w - .1, .01, s === 3 ? SNOW : '#7a5a3e', s === 3 ? SNOW2 : SOIL);
      for (let i = 0; i < w * w * 1.6 + 1; i++) it.push([.3 + R() * (w - .6), .3 + R() * (w - .6), R(), R()]); it.sort((a, b) => a[0] + a[1] - b[0] - b[1]);
      if (s === 1 || s === 2) { for (const q of it) limb([q[0], q[1], .03], [q[0] + (q[2] - .5) * .9, q[1] + (q[3] - .5) * .9, .03], s === 2 ? '#6a8a3a' : '#4f9a45', 1, 1); tufts(.2, w - .2, .2, w - .2, .02, s === 2 ? '#7a9a3a' : '#4fa850', Math.round(w * w * 6), p.seed, 3); }
      it.forEach((q, i) => {
        if (s === 2) pumpkin(q[0], q[1], 0, 3 + Math.floor(q[2] * 3.5), q[3] < .15 ? '#e8d8b0' : q[3] < .3 ? '#d86a1c' : '#e8822a');
        else if (s === 1) pumpkin(q[0], q[1], 0, 2 + Math.floor(q[2] * 2), '#7aa84a');
        else if (s === 0) { const a = P(q[0], q[1], 0); px(a[0], a[1] - 1, C('#6dbb58')); px(a[0] - 1, a[1] - 2, C('#8fd06a')); px(a[0] + 1, a[1] - 2, C('#6dbb58')); }
        else if (i % 3 === 0) snowMound(q[0], q[1], 0, .2); else if (i === 1) pumpkin(q[0], q[1], 0, 4);
      });
      if (p.lantern && s === 2) { const a = P(w / 2, w / 2 + .2, 0); pumpkin(w / 2, w / 2 + .2, 0, 6); for (const d of [[-3, -6], [1, -6], [-2, -3], [-1, -3], [0, -3], [1, -3]]) px(a[0] + d[0], a[1] + d[1], C('#ffd23a')); }
    },
  },
  {
    id: 'prop.nature.snowman', kind: 'prop', tags: ['nature', 'seasonal', 'snowman', 'scarecrow', 'winter', 'park', 'garden'], solid: true,
    size: [1, 1, 1.6], vb: [-.4, -.4, 0, 1.4, 1.4, 2.2], variants: [{ seed: 1 }, { seed: 2, scarf: '#3b7bd8', hat: '#3a3440' }, { seed: 3, scarf: '#4fa850', hat: null }],
    draw(p) {
      const scarf = p.scarf || '#d8342c', c = .5;
      shadow(c, c, 0, .5);
      if (winter()) {
        const W = '#f4f8fb', o = { d: '#b8c8dc', t: '#ffffff' };
        ball(c, c, .32, .4, W, o); ball(c, c, .88, .3, W, o); ball(c, c, 1.3, .21, W, o);
        limb([c - .2, c + .2, .95], [c - .75, c + .45, 1.25], '#6b4a2f', 1, 1); limb([c + .25, c - .1, .95], [c + .8, c - .3, 1.3], '#6b4a2f', 1, 1);
        const n = P(c, c, 1.08), h = P(c, c, 1.3); for (let i = -4; i <= 4; i++) { px(n[0] + i, n[1] + (Math.abs(i) > 3 ? -1 : 0), C(scarf)); if (Math.abs(i) < 4) px(n[0] + i, n[1] + 1, C(dk(scarf, .25))); } px(n[0] + 2, n[1] + 2, C(scarf)); px(n[0] + 2, n[1] + 3, C(scarf)); px(n[0] + 3, n[1] + 4, C(dk(scarf, .2)));
        px(h[0] - 2, h[1] - 1, C('#2a2433')); px(h[0] + 1, h[1] - 1, C('#2a2433')); px(h[0], h[1] + 1, C('#f08a1c')); px(h[0] + 1, h[1] + 1, C('#f08a1c')); px(h[0] + 2, h[1] + 2, C('#d86a1c'));
        const b = P(c, c, .88); px(b[0], b[1] - 2, C('#2a2433')); px(b[0], b[1] + 1, C('#2a2433')); px(b[0], b[1] + 4, C('#2a2433'));
        if (p.hat !== null) { const hc = p.hat || '#2f3942'; cyl(c, c, 1.46, .2, .03, hc, { ol: false }); cyl(c, c, 1.48, .12, .22, hc); const q = P(c, c, 1.52); for (let i = -2; i <= 2; i++) px(q[0] + i, q[1] + 1, C(scarf)); }
      } else {
        // scarecrow for the rest of the year (pumpkin head in autumn)
        const s = season(), sh = p.seed % 2 ? '#c8503a' : '#4a7ab8';
        pole(c, c, 0, 1.25, '#8a6a45', 2, false); limb([c - .55, c + .25, 1.05], [c + .55, c - .25, 1.05], '#8a6a45', 2, 2);
        box(c - .2, c - .16, .55, .4, .32, .58, sh, { l: (u, v) => (u % 4 === 0 || v % 4 === 0) ? dk(sh, .4) : dk(sh, .15) });
        limb([c - .22, c + .1, 1.05], [c - .5, c + .24, 1.05], sh, 3, 3); limb([c + .22, c - .1, 1.05], [c + .5, c - .24, 1.05], dk(sh, .2), 3, 3);
        for (const [x, y] of [[c - .56, c + .27], [c + .56, c - .27]]) { const q = P(x, y, 1.05); px(q[0], q[1], C('#e8c85a')); px(q[0] + (x < c ? -1 : 1), q[1] + 1, C('#e8c85a')); px(q[0], q[1] + 2, C('#c9a23a')); }
        const q = P(c, c, .55); for (let i = -3; i <= 3; i += 2) { px(q[0] + i, q[1] + 1, C('#e8c85a')); px(q[0] + i, q[1] + 2, C('#c9a23a')); }
        if (s === 2) pumpkin(c, c, 1.12, 4); else { ball(c, c, 1.3, .18, '#e8d8a8'); const h = P(c, c, 1.3); px(h[0] - 2, h[1], C('#3a3440')); px(h[0] + 1, h[1], C('#3a3440')); px(h[0] - 1, h[1] + 2, C('#3a3440')); px(h[0], h[1] + 2, C('#3a3440')); }
        cyl(c, c, 1.46, .3, .03, '#d8b05a', { ol: false }); cone(c, c, 1.48, .17, .3, '#d8b05a');
        if (s !== 2) { const b = P(c - .5, c + .25, 1.05); px(b[0], b[1] - 2, C('#2a2433')); px(b[0] + 1, b[1] - 3, C('#2a2433')); px(b[0] - 1, b[1] - 3, C('#3a3440')); px(b[0] + 2, b[1] - 2, C('#f08a1c')); }
      }
    },
  },
  {
    id: 'prop.nature.leafpile', kind: 'prop', tags: ['nature', 'seasonal', 'leafpile', 'park', 'garden'], solid: true, size: [1, 1, .5], vb: [-.4, -.4, 0, 1.4, 1.4, 1.3],
    variants: [{ seed: 1 }, { seed: 2, rake: true }, { seed: 3, big: true }],
    draw(p) {
      // autumn: raked leaves; winter: shovelled snow heap; spring/summer: mulch / grass-clipping heap
      const s = season(), R = rng(p.seed || 1), k = p.big ? 1.3 : 1, cols = s === 2 ? AUT : s === 3 ? [SNOW, '#e2ecf4', '#f4f8fb'] : s === 1 ? ['#8aa84a', '#9ab858', '#7a9a45'] : ['#7a5a3e', '#6a4a36', '#8a6a48'];
      shadow(.5, .5, 0, .55 * k);
      const bl = [{ x: .5, y: .5, z: .16, r: .56 * k, sq: .5 }, { x: .3, y: .65, z: .22, r: .36 * k, sq: .55 }, { x: .68, y: .42, z: .3, r: .38 * k, sq: .55 }, { x: .5, y: .52, z: .46 * k, r: .3 * k, sq: .6 }].map((b, i) => ({ ...b, c: cols[(i + (p.seed || 0)) % cols.length] }));
      clumps(bl, { seed: p.seed, bump: s === 3 ? .04 : .16, flat: true });
      if (s === 2) scatter(.5, .5, 0, .8, AUT, 12, p.seed);
      if (p.rake || s === 3) { limb([1.05, .2, 0], [.75, .45, 1.15], '#c9a268', 1, 1); const q = P(1.05, .2, 0); if (s === 3) { for (let i = -2; i <= 2; i++) for (let j = 0; j < 3; j++) px(q[0] + i, q[1] - j, C(i > 0 ? '#a82a24' : '#d8342c')); } else for (let i = -3; i <= 3; i++) { px(q[0] + i, q[1] - 2, C('#8a8f9a')); if (i & 1) px(q[0] + i, q[1] - 1, C('#8a8f9a')); } }
    },
  },
];
