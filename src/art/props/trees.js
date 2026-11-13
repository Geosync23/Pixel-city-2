// Trees of Maple Bay. All are kind 'prop', footprint = the trunk (0.5 x 0.5, old park tree 1 x 1); the canopy overhangs (vb).
// Params: size 'small'|'medium'|'large' (or a number scale), seed. Seasons via ENV.season.
import { box, lw, px, C, PW, lit, ENV, dk, lt, mix, rng, hash2, foliage } from '../../engine/raster.js';
import { broadleaf, conifer, clumps, leafC, everC, sizeK, trunk, limb, pole, shadow, scatter, snowMound, birchMark, winter, season, P, SNOW, SNOW2, BARK } from './_lib.js';

const seas = (sp, su, au) => i => { const s = ENV.season; if (s === 3) return null; const a = (s === 0 ? sp : s === 1 ? su : au)(); return a[i % a.length]; };
const SV = [{ seed: 1 }, { seed: 2, size: 'small' }, { seed: 3, size: 'large' }];
const AUT = ['#e08a2c', '#d9562b', '#e8b63a', '#c9792a', '#b8432a'];

/** litter drawn before the tree: autumn leaves, winter snow, spring petals */
function litter(p, sp, cols, petals) {
  const k = sizeK(p), s = season(), c = sp.cx === undefined ? .25 : sp.cx;
  if (s === 2) scatter(c, c, 0, sp.R * k * .95, cols || AUT, Math.round(16 * k * sp.R), p.seed || 1);
  if (s === 0 && petals) scatter(c, c, 0, sp.R * k * .9, petals, Math.round(10 * k * sp.R), p.seed || 1);
  if (s === 3) snowMound(c, c, 0, .45 * k + .1);
}
const tree = (name, tags, sp, o = {}) => ({
  id: 'prop.nature.tree.' + name, kind: 'prop', tags: ['nature', 'tree', ...tags], solid: true,
  size: p => [sp.foot || .5, sp.foot || .5, Math.round(sp.H * sizeK(p) * 10) / 10],
  vb: p => { const k = sizeK(p), R = sp.R * k + .6, c = sp.cx === undefined ? .25 : sp.cx; return [c - R, c - R, 0, c + R, c + R, sp.H * k + .6]; },
  variants: o.variants || SV,
  draw(p) { litter(p, sp, o.fall, o.petals); const t = broadleaf(p, sp); if (o.extra) o.extra(p, t, sp); },
});

/* ---------- species ---------- */
const maple = {
  H: 5.4, th: 1.7, R: 1.75, Rz: 1.05, N: 10, br: .52, tw: 6, bark: '#6e4a36',
  cols: seas(() => [leafC(0, '#a8d848', .2), leafC(1, '#a8d848', .2), leafC(2)], () => [leafC(0), leafC(1), leafC(3), leafC(0)], () => [mix(AUT[1], '#e63a22', .45), mix(AUT[4], '#d02a20', .4), mix(AUT[1], '#e63a22', .2), AUT[0], mix(AUT[1], '#e63a22', .45), mix(AUT[4], '#d02a20', .2), mix(AUT[1], AUT[0], .5)]),
};
const oak = {
  H: 5.2, th: 1.5, R: 2.25, Rz: .85, N: 12, br: .5, tw: 8, bark: '#5c4532', zc: .5,
  cols: seas(() => [leafC(2), leafC(0), leafC(2, '#3f8a45', .3)], () => [leafC(2), dk(leafC(2), .12), leafC(0), leafC(2)], () => [AUT[3], dk(AUT[3], .15), AUT[0], mix(AUT[3], '#8a6a2a', .4)]),
};
const birch = {
  H: 5.2, th: 2.5, R: 1.0, Rz: 1.1, N: 8, br: .5, tw: 4, bark: '#ece6d8', mark: birchMark, gap: .14, bump: .16, zc: .5,
  cols: seas(() => [leafC(1, '#c8e86a', .3), leafC(0, '#c8e86a', .3)], () => [leafC(3, '#a8d05a', .3), leafC(1, '#a8d05a', .25)], () => [AUT[2], mix(AUT[2], '#f6d85a', .4), mix(AUT[2], AUT[0], .4)]),
};
const cherry = {
  H: 3.9, th: 1.2, R: 1.7, Rz: .8, N: 9, br: .5, tw: 5, bark: '#5a3a38', zc: .55,
  cols: seas(() => [foliage('blossom', .1), foliage('blossom', .4), foliage('blossom', .1), foliage('blossom', .8)], () => [leafC(1), leafC(0), leafC(3)], () => [AUT[0], mix(AUT[1], '#c8405a', .3), AUT[1]]),
  dots: () => season() === 0 ? { c: ['#ffffff', '#fbe3ea', '#e8799f'], p: .3 } : season() === 1 ? { c: ['#c22a3a'], p: .05 } : null,
};
const poplar = {
  H: 6.8, th: 1.2, R: .62, Rz: 1.2, N: 12, br: .95, tw: 4, bark: '#7a6a55', zc: .5, sq: 1.25, bump: .14,
  cols: seas(() => [leafC(0), leafC(1)], () => [leafC(1, '#4a9a55', .3), leafC(0, '#4a9a55', .3), leafC(3)], () => [AUT[2], mix(AUT[2], '#c8b83a', .3), mix(AUT[2], AUT[0], .3)]),
};
const willow = {
  H: 4.9, th: 1.7, R: 1.9, Rz: .75, N: 10, br: .5, tw: 6, bark: '#5f4f38', zc: .62,
  cols: seas(() => [leafC(1, '#c8e060', .4), leafC(0, '#c8e060', .4)], () => [leafC(3, '#9ac850', .4), leafC(1, '#9ac850', .35)], () => [mix(AUT[2], '#b8b040', .5), mix(AUT[2], '#9aa040', .5), AUT[2]]),
};
const fruit = {
  H: 3.3, th: 1.1, R: 1.25, Rz: .9, N: 7, br: .55, tw: 4, bark: '#6b4a2f',
  cols: seas(() => [leafC(0), '#fbf3f0', leafC(1), '#f7dfe6'], () => [leafC(0), leafC(1), leafC(2)], () => [AUT[0], AUT[2], leafC(3)]),
  dots: p => { const f = { apple: '#d8342c', orange: '#f08a1c', pear: '#c8d048', plum: '#7a3a9a', lemon: '#f4d83a' }[p.fruit || 'apple'] || p.fruit; return season() === 0 ? { c: ['#ffffff', '#f7c1d4'], p: .22 } : season() === 1 ? { c: [f], p: .16, big: true } : season() === 2 ? { c: [f], p: .07, big: true } : null; },
};
const oldTree = {
  H: 9, th: 2.6, R: 3.7, Rz: .9, N: 20, br: .42, tw: 13, bark: '#5a4232', zc: .5, foot: 1, cx: .5, cy: .5,
  cols: seas(() => [leafC(2), leafC(0), leafC(1), leafC(2, '#3f8a45', .3)], () => [leafC(2), leafC(0), dk(leafC(2), .1), leafC(1), leafC(3)], () => [AUT[0], AUT[3], AUT[2], AUT[1], dk(AUT[3], .1)]),
};
const pineSp = {
  H: 6.2, th: 3.4, R: 1.5, Rz: .62, N: 8, br: .5, tw: 5, bark: '#8a5a3c', zc: .6, sq: .62, bump: .2, snow: true,
  cols: i => [everC(1), everC(0, '#2f6f5a', .3), everC(2)][i % 3],
};

/** hanging willow strands (leafy curtains; bare golden whips in winter) */
function strands(p, t) {
  const bare = t.bare, k = t.k, c1 = bare ? '#b09a48' : null;
  const bl = t.blobs.slice().sort((a, b) => a.x + a.y - b.x - b.y);
  for (const b of bl) {
    const s = PW(b.x, b.y, b.z), R = b.r * 16 * 1.1, col = b.c || c1, ca = C(lt(col, .12)), cb = C(dk(col, .2)), cc = C(dk(col, .38));
    for (let dx = -Math.round(R); dx <= Math.round(R); dx += bare ? 3 : 2) {
      const X = Math.round(s[0]) + dx, h = hash2(X, b.i, p.seed | 0), top = Math.round(s[1] + (bare ? -R * .3 : R * .25) * Math.sqrt(Math.max(0, 1 - (dx / R) ** 2)));
      const base = P(b.x, b.y, 0)[1], len = Math.min(Math.round((10 + h * 20) * k) + (bare ? 12 * k : 0), base - 6 - top);
      for (let i = 0; i < len; i++) { if (bare && hash2(X, i >> 2, 3) < .15) continue; px(X + ((i >> 3) & 1 && h > .5 ? 1 : 0), top + i, bare ? (i & 1 ? ca : cb) : (i > len - 3 ? ca : (i + X) % 3 === 0 ? cc : (dx < 0 ? ca : cb))); }
      if (bare && h > .6) px(X, top - 1, C(SNOW));
    }
  }
}
/** rope swing hanging from the big old tree */
function swing(p, t) {
  if (p.swing === false) return; const x = t.fork[0] + 1.9 * t.k, y = t.fork[1] + .9 * t.k, z = t.fork[2] + 1.0 * t.k;
  lw([x, y - .22, z], [x, y - .22, .55], '#d8c9a0'); lw([x, y + .22, z], [x, y + .22, .55], '#d8c9a0');
  box(x - .1, y - .28, .5, .2, .56, .06, '#b07444');
}

/* ---------- palm ---------- */
function palm(p) {
  const r = rng((p.seed || 1) * 131 + 7), k = sizeK(p), H = 4.6 * k, lean = (r() - .5) * 1.1 * k, c = .25;
  shadow(c, c, 0, .9 * k); if (winter()) snowMound(c, c, 0, .4);
  // curved trunk in slices
  const N = 10, tc = '#a8875a'; let prev = [c, c, 0];
  for (let i = 1; i <= N; i++) { const t = i / N, q = [c + lean * t * t, c, H * t]; trunk(prev, q, 5 - 2 * (i - 1) / N, 5 - 2 * i / N, i & 1 ? tc : dk(tc, .12), { noflare: i > 1, mark: (u, v) => v === 0 ? dk(tc, .4) : null }); prev = q; }
  const top = prev, g = ['#3f9a55', '#4fae5a', '#2f8050'], fr = [];
  for (let i = 0; i < 11; i++) { const a = i / 11 * 6.283 + r() * .5; fr.push({ a, len: (1.5 + r() * .5) * k, rise: (.5 + r() * .5) * k, c: g[i % 3] }); }
  fr.sort((A, B) => (Math.cos(A.a) + Math.sin(A.a)) - (Math.cos(B.a) + Math.sin(B.a)));
  for (const f of fr) {
    let last = null; const n = 14, cm = C(f.c), cl = C(lt(f.c, .25)), cd = C(dk(f.c, .3)), co = C(dk(f.c, .62));
    for (let i = 0; i <= n; i++) {
      const t = i / n, s = P(top[0] + Math.cos(f.a) * f.len * t, top[1] + Math.sin(f.a) * f.len * t, top[2] + f.rise * 4 * t * (1 - t) - f.len * .55 * t * t);
      if (last) { const m = Math.max(Math.abs(s[0] - last[0]), Math.abs(s[1] - last[1]), 1); for (let j = 0; j <= m; j++) { const X = Math.round(last[0] + (s[0] - last[0]) * j / m), Y = Math.round(last[1] + (s[1] - last[1]) * j / m), w = Math.round(5 * k * Math.sin(Math.min(1, t * 1.15) * Math.PI) + 1); px(X, Y - 1, winter() && (X & 3) < 2 ? C(SNOW) : cl); px(X, Y, cm); for (let q = 1; q <= w; q++) px(X, Y + q, (X & 1) ? cd : q === w ? co : cm); } }
      last = s;
    }
  }
  const s = P(top[0], top[1], top[2]); for (const d of [[-2, 1], [1, 2], [2, 0]]) { px(s[0] + d[0], s[1] + d[1], C('#6b4a2f')); px(s[0] + d[0], s[1] + d[1] - 1, C('#8a6a45')); }
}

export default [
  tree('maple', ['maple', 'deciduous', 'symbol'], maple, { fall: [AUT[1], AUT[4], AUT[0], '#e63a22'], variants: [{ seed: 1 }, { seed: 2, size: 'small' }, { seed: 3, size: 'large' }, { seed: 7 }] }),
  tree('oak', ['oak', 'deciduous'], oak, { fall: [AUT[3], AUT[0], '#8a6a2a'] }),
  tree('birch', ['birch', 'deciduous'], birch, { fall: [AUT[2], '#f6d85a'] }),
  tree('cherry', ['cherry', 'blossom', 'deciduous'], cherry, { petals: ['#f7c1d4', '#fbe3ea', '#f2a7c3'], fall: [AUT[0], AUT[1]] }),
  tree('poplar', ['poplar', 'tall', 'deciduous'], poplar, { fall: [AUT[2], '#c8b83a'] }),
  tree('willow', ['willow', 'water', 'deciduous'], willow, { fall: [AUT[2], '#b8b040'], extra: strands }),
  tree('fruit', ['fruit', 'orchard', 'garden', 'deciduous'], fruit, { petals: ['#ffffff', '#f7c1d4'], variants: [{ seed: 1, fruit: 'apple' }, { seed: 2, fruit: 'orange', size: 'small' }, { seed: 3, fruit: 'pear' }, { seed: 4, fruit: 'plum', size: 'large' }] }),
  tree('old', ['park', 'landmark', 'big', 'deciduous'], oldTree, { extra: swing, variants: [{ seed: 1, swing: true }, { seed: 5, swing: false, size: .85 }] }),
  tree('pine', ['pine', 'evergreen', 'hillcrest'], pineSp, {}),
  {
    id: 'prop.nature.tree.spruce', kind: 'prop', tags: ['nature', 'tree', 'spruce', 'evergreen'], solid: true,
    size: p => [.5, .5, 5.6 * sizeK(p)], vb: p => { const k = sizeK(p); return [-1.4 * k, -1.4 * k, 0, .5 + 1.4 * k, .5 + 1.4 * k, 5.6 * k + .4]; },
    variants: [{ seed: 1 }, { seed: 2, size: 'small' }, { seed: 3, size: 'large' }, { seed: 4, lights: true }],
    draw(p) {
      const k = sizeK(p), r = rng(p.seed || 1), c = everC(Math.floor(r() * 3), '#2f6a70', .3);
      shadow(.25, .25, 0, 1.1 * k); if (winter()) snowMound(.25, .25, 0, .6 * k);
      conifer(.25, .25, 0, 5.6 * k, 1.35 * k, 5, c, { skirt: .45 * k });
      if (p.lights && winter()) lit(() => { const cols = ['#ffd98a', '#ff6a5a', '#8ad0ff', '#b6f08a', '#ff9ad8']; for (let i = 0; i < 26; i++) { const t = i / 26, z = .7 * k + t * 4.5 * k, rr = 1.2 * k * (1 - t * .85), a = i * 1.1, s = P(.25 + Math.cos(a) * rr * .5 + Math.sin(a) * rr * .5, .25 - Math.cos(a) * rr * .5 + Math.sin(a) * rr * .5, z); if (Math.sin(a) > -.4) px(s[0], s[1], C(cols[i % 5])); } const s = P(.25, .25, 5.6 * k); px(s[0], s[1] - 1, C('#ffe27a')); px(s[0] - 1, s[1], C('#ffe27a')); px(s[0] + 1, s[1], C('#ffe27a')); px(s[0], s[1], C('#fff8d0')); px(s[0], s[1] + 1, C('#ffe27a')); });
    },
  },
  {
    id: 'prop.nature.tree.fir', kind: 'prop', tags: ['nature', 'tree', 'fir', 'evergreen', 'tall'], solid: true,
    size: p => [.5, .5, 6.4 * sizeK(p)], vb: p => { const k = sizeK(p); return [-1 * k, -1 * k, 0, .5 + 1 * k, .5 + 1 * k, 6.4 * k + .4]; }, variants: SV,
    draw(p) { const k = sizeK(p), r = rng(p.seed || 1); shadow(.25, .25, 0, .8 * k); if (winter()) snowMound(.25, .25, 0, .5 * k); conifer(.25, .25, 0, 6.4 * k, .95 * k, 7, everC(Math.floor(r() * 3), '#2a6a4a', .35), { skirt: .7 * k }); },
  },
  {
    id: 'prop.nature.tree.cypress', kind: 'prop', tags: ['nature', 'tree', 'cypress', 'evergreen', 'tall', 'hillcrest'], solid: true,
    size: p => [.5, .5, 5.6 * sizeK(p)], vb: p => { const k = sizeK(p); return [-.7 * k, -.7 * k, 0, .5 + .7 * k, .5 + .7 * k, 5.6 * k + .4]; }, variants: SV,
    draw(p) {
      const k = sizeK(p), H = 5.6 * k, c = everC((p.seed || 1) % 3, '#2a5f4a', .5);
      shadow(.25, .25, 0, .6 * k); if (winter()) snowMound(.25, .25, 0, .4 * k); pole(.25, .25, 0, .6 * k, BARK, 2);
      clumps([{ x: .25, y: .25, z: H * .42, r: .52 * k, sq: 3.6, c: dk(c, .08) }, { x: .25, y: .25, z: H * .62, r: .4 * k, sq: 3.6, c }, { x: .25, y: .25, z: H * .84, r: .2 * k, sq: 3.2, c: lt(c, .06) }], { seed: p.seed, bump: .12, snow: winter(), flat: true });
    },
  },
  {
    id: 'prop.nature.tree.palm', kind: 'prop', tags: ['nature', 'tree', 'palm', 'harbor', 'beach'], solid: true,
    size: p => [.5, .5, 4.8 * sizeK(p)], vb: p => { const k = sizeK(p); return [-2.2 * k, -2.2 * k, 0, .5 + 2.2 * k, .5 + 2.2 * k, 5.9 * k]; }, variants: [{ seed: 1 }, { seed: 2, size: 'small' }, { seed: 5, size: 'large' }],
    draw: palm,
  },
  {
    id: 'prop.nature.tree.sapling', kind: 'prop', tags: ['nature', 'tree', 'sapling', 'young', 'street'], solid: true,
    size: [.5, .5, 2.4], vb: [-.6, -.6, 0, 1.1, 1.1, 2.9], variants: [{ seed: 1 }, { seed: 2, kind: 'blossom' }, { seed: 3, guard: true }],
    draw(p) {
      const r = rng(p.seed || 1), s = season(), c = .25;
      // soil square + stake + tie
      box(-.1, -.1, 0, .7, .7, .04, winter() ? SNOW : '#6a4a36', { ol: false });
      if (p.guard) { for (const [x, y] of [[0, 0], [.5, 0], [0, .5], [.5, .5]]) pole(x, y, 0, 1.1, '#4d5d68', 1, false); for (const z of [.4, .8, 1.1]) { lw([0, .5, z], [.5, .5, z], '#4d5d68'); lw([.5, 0, z], [.5, .5, z], '#3d4a54'); } }
      else { pole(.05, .4, 0, 1.5, '#c9a268', 1, false); lw([.05, .4, 1.2], [c, c, 1.25], '#e8e2d4'); }
      trunk([c, c, 0], [c + .03, c, 1.5], 2, 1, '#7a5a3a', { noflare: true });
      const col = i => s === 3 ? null : s === 0 && p.kind === 'blossom' ? foliage('blossom', i / 3) : s === 2 ? AUT[(i + (p.seed || 0)) % 3] : leafC(i, '#a8d848', .2);
      const tips = [[c - .3, c + .1, 1.75], [c + .32, c - .05, 1.85], [c, c + .05, 2.15], [c + .05, c + .3, 1.6]];
      for (const t of tips) limb([c + .03, c, 1.4], t, '#7a5a3a', 1, 1, s === 3);
      if (s !== 3) clumps(tips.map((t, i) => ({ x: t[0], y: t[1], z: t[2], r: .3 + r() * .08, c: col(i) })), { seed: p.seed, bump: .15 });
      if (s === 2) scatter(c, c, 0, .5, AUT, 5, p.seed);
    },
  },
];
