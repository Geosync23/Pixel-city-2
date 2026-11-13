// Harbourside props: decks, moorings, cargo clutter, lamps, the food shack.
import { U, PW, C, px, box, qy, qx, qz, lw, fq, glow, lit, cyl, cone, ball, spx, PAT, rng, dk, lt, mix, foliage } from '../../engine/raster.js';
import { Lc, Rc, face, gridWin, door, lamp, rope, ring, disc, circ, band, crate, barrel, drum, gull, lifering, fishCrate, snowTop, snowDisc, rail, bulbs, chainlink, winter, SNOW } from './_lib.js';

const deck = {
  id: 'prop.harbor.deck', kind: 'prop', tags: ['harbor', 'pier', 'boardwalk', 'deck', 'walkable'], solid: false,
  size: p => [p.len || 4, p.wd || 2, p.h || .5],
  vb: p => [-.3, -.3, 0, (p.len || 4) + .3, (p.wd || 2) + .3, (p.h || .5) + 1.4],
  variants: [{ len: 4, wd: 2, h: .5 }, { len: 6, wd: 3, h: .5, rail: 'y', c: '#a89880' }, { len: 4, wd: 2, h: 1, rail: 'both', posts: true }, { len: 8, wd: 2, h: 1, c: '#a89880', posts: true }, { len: 2, wd: 2, h: .5, rail: 'end', posts: true }],
  draw(p) {
    const L = p.len || 4, W = p.wd || 2, h = p.h || .5, c = p.c || '#b98a52', pc = '#6b5240', rl = p.railc || '#e8e2d4';
    const pile = (x, y, top) => { cyl(x, y, 0, .13, top, pc, { t: dk(pc, .2) }); band(x, y, 0, .13, .12, '#4a5a4a'); };
    if (p.rail === 'both') rail([0, .06, 0], [L, .06, 0], h, .8, rl, Math.round(L / 1));
    // back row piles, shadow, bracing
    for (let x = .25; x < L; x += 2) pile(x, .25, h - .1);
    qy(0, L, W - .02, 0, h - .16, '#2e2a3a', 'glass'); qx(L - .02, 0, W, 0, h - .16, '#2e2a3a', 'glass');
    for (let x = .25; x < L; x += 2) pile(Math.min(x, L - .25), W - .2, h - .1);
    if (h >= 1) for (let x = .25; x + 2 <= L; x += 2) { lw([x, W - .05, .15], [x + 2, W - .05, h - .2], pc); lw([x, W - .05, h - .2], [x + 2, W - .05, .15], pc); }
    box(0, 0, h - .16, L, W, .16, c, { t: (x, y) => { const k = (x * 4) % 1; return k < .14 ? dk(c, .28) : ((Math.floor(x * 4) * 7 + Math.floor(y * 1.3 + Math.floor(x * 4) * .37)) % 5 === 0 ? lt(c, .1) : c); }, l: Lc(dk(c, .25)), r: PAT.planks(Rc(dk(c, .1)), 4) });
    if (winter()) qz(.1, L - .1, .1, W - .1, h, SNOW, 'glass');
    if (p.posts) { for (const x of [.14, L - .14]) for (const y of [.14, W - .14]) { cyl(x, y, h, .13, .45, pc, { t: winter() ? SNOW : lt(pc, .2) }); } }
    if (p.rail === 'y' || p.rail === 'both') rail([0, W - .06, 0], [L, W - .06, 0], h, .8, rl, Math.round(L / 1));
    if (p.rail === 'end') { rail([L - .06, 0, 0], [L - .06, W, 0], h, .8, rl, Math.round(W)); lifering(face('x', L - .04), W / 2, h + .45, .22); }
  },
};

const bollard = {
  id: 'prop.harbor.bollard', kind: 'prop', tags: ['harbor', 'bollard', 'mooring'], solid: true, size: [.5, .5, .6], vb: [-.5, -.5, 0, 1.1, 1.1, .9],
  variants: [{ c: '#3a3a44' }, { c: '#3a3a44', top: '#f2c230' }, { c: '#5a4a44', ropeCoil: true }, { c: '#2f4a6a', top: '#f4f0e8', twin: true }],
  draw(p) {
    const c = p.c || '#3a3a44', t = p.top || lt(c, .15);
    if (p.ropeCoil) { ring('z', [.55, .55, .02], .34, .16, '#d9c08a', 10); circ('z', [.55, .55, .03], .25, '#b89a62', 10); }
    cyl(.25, .25, 0, .22, .08, dk(c, .1));
    if (p.twin) { cyl(.1, .25, .08, .1, .42, c, { ol: false }); cyl(.4, .25, .08, .1, .42, c, { ol: false }); box(-.02, .17, .4, .54, .16, .12, t); }
    else { cyl(.25, .25, .08, .15, .34, c, { ol: false }); cyl(.25, .25, .42, .23, .12, t); band(.25, .25, .2, .15, .05, lt(c, .25)); }
    if (winter()) snowDisc(.25, .25, .54, .2);
  },
};

const mooring = {
  id: 'prop.harbor.mooringpost', kind: 'prop', tags: ['harbor', 'mooring', 'piling', 'water'], solid: true, size: [.5, .5, 1.5], vb: [-.4, -.4, 0, 1.4, 1.4, 2.3],
  variants: [{ seed: 1 }, { seed: 2, cap: '#f4f0e8' }, { seed: 3, cluster: true }, { seed: 4, cap: '#d8452f', h: 1.9 }],
  draw(p) {
    const r = rng(p.seed || 1), pc = '#6b5240', h = p.h || 1.4;
    const post = (x, y, hh, cap) => { cyl(x, y, 0, .16, hh, pc, { t: winter() ? SNOW : dk(pc, .25) }); band(x, y, 0, .16, .2, '#4a5a4a'); if (cap) { band(x, y, hh - .28, .16, .28, cap); } band(x, y, hh * .55, .17, .07, '#d9c08a'); band(x, y, hh * .55 + .09, .17, .07, '#c9b07a'); };
    if (p.cluster) { post(.2, .2, h + .3, p.cap); post(.62, .28, h, p.cap); post(.3, .62, h - .15, p.cap); band(.42, .4, h - .5, .42, .08, '#4a4458'); rope([.62, .28, h * .6], [1.3, .9, .05], .2); if (r() < .8) gull(.2, .2, h + .32, 1); }
    else { post(.25, .25, h, p.cap); rope([.3, .38, h * .6], [1.1, 1.1, .05], .25); if (r() < .4) gull(.25, .25, h + .02, r() < .5 ? 1 : -1); }
  },
};

const crates = {
  id: 'prop.harbor.crates', kind: 'prop', tags: ['harbor', 'industrial', 'crate', 'cargo'], solid: true, size: p => [(p.n || 3) > 2 ? 1.5 : .8, (p.n || 3) > 3 ? 1.4 : .8, (p.n || 3) > 1 ? 1.3 : .7], vb: p => [-.2, -.2, 0, 1.8, 1.7, 1.9],
  variants: [{ n: 1, seed: 1 }, { n: 2, seed: 2 }, { n: 3, seed: 3 }, { n: 5, seed: 4 }, { n: 4, seed: 9, c: '#8fa07a' }],
  draw(p) {
    const n = p.n || 3, r = rng(p.seed || 1), cs = p.c ? [p.c, dk(p.c, .1), lt(p.c, .1)] : ['#b98a52', '#c9a36a', '#a87a4a'], pick = () => cs[Math.floor(r() * 3)];
    if (n >= 4) crate(.75, .05, 0, .7, pick()); if (n >= 5) crate(.8, .1, .7, .55, pick());
    crate(.05, .05, 0, .7, pick()); if (n >= 2) crate(.1, .1, .7, .55, pick());
    if (n >= 3) { crate(.8, n > 3 ? .75 : .1, 0, .65, pick()); if (r() < .6) { const q = face('y', n > 3 ? 1.4 : .75); q.text('MB', .92, .45, '#5a4636'); } }
    if (n >= 4) crate(.1, .8, 0, .55, pick(), .45);
    if (winter()) { snowTop(.1, .65, .1, .65, n >= 2 ? 1.25 : .7, .06); }
  },
};

const barrels = {
  id: 'prop.harbor.barrels', kind: 'prop', tags: ['harbor', 'industrial', 'barrel', 'cargo'], solid: true, size: p => [(p.n || 3) > 1 ? 1.3 : .6, (p.n || 3) > 2 ? 1.2 : .6, (p.n || 3) > 3 ? 1.5 : .8], vb: [-.2, -.2, 0, 1.6, 1.5, 1.9],
  variants: [{ n: 1 }, { n: 3 }, { n: 4 }, { n: 3, kind: 'drum', seed: 2 }, { n: 4, kind: 'drum', seed: 5 }, { n: 2, c: '#3f6f8f' }],
  draw(p) {
    const n = p.n || 3, r = rng(p.seed || 1), dc = ['#3f7fbf', '#d8452f', '#f2c230', '#3f8a55', '#4a4458'];
    const one = (x, y, z) => p.kind === 'drum' ? drum(x, y, z, dc[Math.floor(r() * 5)]) : barrel(x, y, z, p.c || (r() < .7 ? '#8a5a34' : '#9a6b42'));
    one(.3, .3, 0); if (n >= 2) one(.95, .32, 0); if (n >= 3) one(.6, .88, 0); if (n >= 4) one(.62, .5, p.kind === 'drum' ? .8 : .75);
    if (winter()) snowDisc(n >= 4 ? .62 : .3, n >= 4 ? .5 : .3, n >= 4 ? 1.55 : (p.kind === 'drum' ? .8 : .75), .22);
  },
};

const fishcrates = {
  id: 'prop.harbor.fishcrates', kind: 'prop', tags: ['harbor', 'fishmarket', 'crate', 'fish'], solid: true, size: [1, .8, .9], vb: [-.2, -.2, 0, 1.9, 1.5, 1.4],
  variants: [{ n: 1, seed: 1 }, { n: 3, seed: 2 }, { n: 5, seed: 3 }, { n: 4, seed: 6, ice: true }],
  draw(p) {
    const n = p.n || 3, r = rng(p.seed || 1), cs = ['#3f7fbf', '#f4f0e8', '#2f8f7f', '#e0a030'];
    if (n >= 4) { fishCrate(.95, .1, 0, cs[1], 5); if (n >= 5) fishCrate(.95, .1, .3, cs[3], 7); }
    for (let k = 0; k < Math.min(3, n); k++) fishCrate(.05 + (k % 2) * .04, .1, k * .3, cs[(k + (p.seed || 0)) % 4], k + (p.seed || 1));
    if (p.ice) { box(.2, .8, 0, .7, .55, .5, '#e4eef4'); ball(.55, 1.05, .55, .28, '#f4fbff', { squash: .5 }); }
  },
};

const nets = {
  id: 'prop.harbor.nets', kind: 'prop', tags: ['harbor', 'fishing', 'net'], solid: true, size: p => p.rack ? [3, .4, 2] : [1.4, 1.2, .6], vb: p => p.rack ? [-.3, -.4, 0, 3.3, 1, 2.3] : [-.3, -.3, 0, 1.8, 1.6, 1],
  variants: [{ seed: 1, c: '#3f8a7a' }, { seed: 2, c: '#c9703a' }, { seed: 3, rack: true, c: '#3f8a7a' }, { seed: 4, rack: true, c: '#4f7f9f' }],
  draw(p) {
    const r = rng(p.seed || 1), c = p.c || '#3f8a7a', fl = ['#f08a3a', '#f4f0e8', '#f2c230'];
    if (p.rack) {
      for (const x of [.1, 1.5, 2.9]) { lw([x, .2, 0], [x, .2, 1.9], '#6b4a2f'); lw([x + .06, .2, 0], [x + .06, .2, 1.9], '#8a6a4a'); } lw([.1, .2, 1.85], [2.95, .2, 1.85], '#6b4a2f');
      const F = face('y', .26); F.q(.15, 2.9, .35, 1.82, (u, v) => { const sag = Math.sin(u / 44 * Math.PI) * 5; if (v < sag) return null; return ((u + v) % 4 === 0 || (u - v + 400) % 4 === 0) ? c : ((u + v) % 4 === 2 && (u - v + 400) % 4 === 2 ? dk(c, .3) : null); });
      for (let x = .3; x < 2.9; x += .42) ball(x, .3, 1.84, .09, fl[Math.floor(r() * 3)], { ol: false });
      rope([2.9, .26, .4], [2.4, .7, .02], .1); crate(.3, .45, 0, .45);
    } else {
      ball(.7, .6, .2, .62, c, { squash: .5 }); ball(.95, .75, .3, .4, lt(c, .1), { squash: .55 });
      const s = PW(.7, .6, .3); for (let j = -5; j < 8; j++) for (let i = -14; i < 15; i++) if ((i + j * 2) % 4 === 0 && (i * i) / 200 + (j * j) / 50 < 1) px(s[0] + i, s[1] + j, C(dk(c, .35)));
      for (let k = 0; k < 6; k++) { const a = r() * 6.28, d = .2 + r() * .4; ball(.7 + Math.cos(a) * d, .6 + Math.sin(a) * d * .8, .32 + r() * .1, .09, fl[k % 3], { ol: false }); }
      rope([1.2, .9, .1], [1.6, 1.3, .02], .0);
    }
  },
};

function trap(x, y, z, c = '#a8844a') {
  box(x, y, z, .9, .6, .45, c, { l: (u, v) => (u % 4 === 0 || v % 3 === 0) ? Lc(c) : Lc(dk(c, .55)), r: (u, v) => (u % 3 === 0 || v % 3 === 0) ? Rc(c) : Rc(dk(c, .55)), t: (a, b) => ((a * 16 | 0) % 3 === 0) ? c : dk(c, .3) });
  disc('y', [x + .45, y + .601, z + .22], .13, '#3f8a7a', null, 8);
}
const traps = {
  id: 'prop.harbor.lobstertraps', kind: 'prop', tags: ['harbor', 'fishing', 'trap', 'lobster'], solid: true, size: [1.9, .7, 1], vb: [-.2, -.2, 0, 2.4, 1.3, 1.6],
  variants: [{ n: 1 }, { n: 3 }, { n: 5 }, { n: 3, c: '#4f8a6a' }, { n: 5, c: '#c8b23a' }],
  draw(p) {
    const n = p.n || 3, c = p.c || '#a8844a';
    trap(0, 0, 0, c); if (n >= 2) trap(.95, 0, 0, c); if (n >= 3) trap(.48, 0, .45, c); if (n >= 5) { trap(1.0, .02, .45, dk(c, .08)); trap(.6, 0, .9, c); }
    const bz = 0; ball(n >= 2 ? 2.05 : 1.1, .5, .2, .18, '#e8552f'); band; lw([n >= 2 ? 2.05 : 1.1, .5, .35], [n >= 2 ? 2.05 : 1.1, .5, .7], '#f4f0e8'); rope([n >= 2 ? 1.9 : .95, .6, .1], [n >= 2 ? 1.2 : .4, .9, .02], 0);
    if (winter()) snowTop(n >= 5 ? .6 : n >= 3 ? .48 : 0, (n >= 5 ? .6 : n >= 3 ? .48 : 0) + .9, 0, .6, n >= 5 ? 1.35 : n >= 3 ? .9 : .45, .06);
  },
};

const buoy = {
  id: 'prop.harbor.buoy', kind: 'prop', tags: ['harbor', 'water', 'buoy', 'navigation'], solid: true, size: [.9, .9, 2.2], vb: [-.3, -.3, 0, 1.2, 1.2, 2.8],
  light: { x: .45, y: .45, z: 0, r: 2 },
  variants: [{ c: '#d8452f', kind: 'nun' }, { c: '#3f8a55', kind: 'can' }, { c: '#f2c230', kind: 'cage' }, { c: '#f08a3a', kind: 'ball' }, { c: '#f4f0e8', kind: 'ball', c2: '#2f6f9f' }],
  draw(p) {
    const c = p.c || '#d8452f', k = p.kind || 'nun', x = .45, y = .45, glowc = c === '#3f8a55' ? '#5af09a' : c === '#f2c230' ? '#ffe060' : '#ff5a4a';
    const t = PW(x, y, 0); for (let i = -9; i <= 9; i++) if (i % 3) px(t[0] + i, t[1] + 4 + (Math.abs(i) > 5 ? -1 : 0), C('#e8f6fb'));
    if (k === 'ball') { ball(x, y, .22, .36, c); if (p.c2) { const s = PW(x, y, .22); for (let i = -6; i <= 6; i++) { px(s[0] + i, s[1] + 1, C(p.c2)); px(s[0] + i, s[1] + 2, C(p.c2)); } } lw([x, y, .5], [x, y, .75], '#4a4458'); spx(x, y, .75, 0, -1, '#4a4458'); spx(x, y, .75, 1, -2, '#4a4458'); return; }
    cyl(x, y, 0, .42, .32, dk(c, .1)); band(x, y, .2, .42, .08, '#f4f0e8');
    if (k === 'nun') { cone(x, y, .32, .34, 1.1, c); lw([x, y, 1.4], [x, y, 1.8], '#4a4458'); }
    else if (k === 'can') { cyl(x, y, .32, .28, .95, c, { t: winter() ? SNOW : lt(c, .15) }); band(x, y, .9, .28, .12, '#f4f0e8'); lw([x, y, 1.27], [x, y, 1.8], '#4a4458'); }
    else { for (const [a, b] of [[-.25, 0], [.25, 0], [0, .25], [0, -.25]]) lw([x + a, y + b, .32], [x + a * .3, y + b * .3, 1.6], '#4a4458'); lw([x - .2, y, .8], [x + .2, y, .8], '#4a4458'); lw([x, y - .2, .8], [x, y + .2, .8], '#4a4458'); box(x - .2, y - .03, 1.05, .4, .06, .4, c); cyl(x, y, 1.6, .1, .2, '#4a4458', { ol: false }); }
    const lz = k === 'cage' ? 1.85 : 1.82; lit(() => { spx(x, y, lz, 0, 0, glowc); spx(x, y, lz, 0, -1, glowc); spx(x, y, lz, -1, 0, glowc); spx(x, y, lz, 1, 0, glowc); spx(x, y, lz, 0, 1, glowc); });
  },
};

const anchor = {
  id: 'prop.harbor.anchor', kind: 'prop', tags: ['harbor', 'monument', 'anchor', 'landmark'], solid: true, size: [2, 1.2, 3], vb: [-.3, -.3, 0, 2.4, 1.9, 3.4],
  variants: [{ c: '#3a3a44' }, { c: '#c9a23a', plinth: '#8c8a90' }, { c: '#7a4a3a', plinth: '#c8c0ac' }],
  draw(p) {
    const c = p.c || '#3a3a44', pl = p.plinth || '#b8b0a0', y = .6, cx = 1, hi = lt(c, .35), z0 = .55;
    box(0, 0, 0, 2, 1.2, .2, dk(pl, .12)); box(.15, .12, .2, 1.7, .96, .35, pl, { l: PAT.stone(Lc(pl)), r: PAT.stone(Rc(pl)) });
    qy(.6, 1.4, 1.085, .27, .47, Lc('#c9a23a')); lw([.7, 1.09, .4], [1.3, 1.09, .4], '#5a4a20'); lw([.7, 1.09, .33], [1.15, 1.09, .33], '#5a4a20');
    if (winter()) snowTop(.15, 1.85, .12, .5, .55, .08);
    // chain
    for (let k = 0; k < 7; k++) { const t = k / 6, q = [cx + .1 + t * .75, y + .35, 2.7 - t * 2.1 - Math.sin(t * 3.1) * -.25]; spx(q[0], q[1], q[2], 0, 0, k % 2 ? '#8a8f98' : '#5a5f68'); spx(q[0], q[1], q[2], 0, 1, k % 2 ? '#8a8f98' : '#5a5f68'); }
    // arms (arc), flukes, shank, stock, ring
    ring('y', [cx, y, z0 + .85], .82, .62, c, 14, Math.PI * 1.08, Math.PI * 1.92); circ('y', [cx, y, z0 + .85], .82, dk(c, .6), 14, Math.PI * 1.08, Math.PI * 1.92);
    for (const s of [-1, 1]) { const fx = cx + s * .74, fz = z0 + .62; fq([[fx - s * .28, y, fz - .02], [fx + s * .2, y, fz + .1], [fx + s * .02, y, fz + .52]], c); lw([fx + s * .2, y, fz + .1], [fx + s * .02, y, fz + .52], dk(c, .6)); lw([fx - s * .28, y, fz - .02], [fx + s * .02, y, fz + .52], hi); }
    box(cx - .08, y - .08, z0, .16, .16, 1.95, c); lw([cx - .08, y + .08, z0 + .1], [cx - .08, y + .08, z0 + 1.9], hi);
    box(cx - .6, y - .07, z0 + 1.62, 1.2, .14, .14, c); ball(cx - .6, y, z0 + 1.69, .09, c, { ol: false }); ball(cx + .6, y, z0 + 1.69, .09, c, { ol: false });
    ring('y', [cx, y + .01, z0 + 2.18], .24, .15, c, 12); circ('y', [cx, y + .01, z0 + 2.18], .24, dk(c, .6), 12);
  },
};

const ringstand = {
  id: 'prop.harbor.lifering', kind: 'prop', tags: ['harbor', 'safety', 'lifering'], solid: true, size: [.4, .3, 1.8], vb: [-.4, -.2, 0, .9, .7, 2.1],
  variants: [{ c: '#d8452f' }, { c: '#f2c230' }, { c: '#2f6f9f', sign: true }],
  draw(p) {
    const c = p.c || '#d8452f'; box(.14, .1, 0, .12, .12, 1.7, '#e8e2d4'); box(-.2, .08, .9, .8, .1, .85, c); const F = face('y', .18);
    F.q(-.14, .54, .96, 1.69, Lc('#f4f0e8')); lifering(F, .2, 1.33, .27); rope([.45, .19, 1.2], [.2, .19, .98], .08, '#d9c08a', 3);
    box(-.24, .04, 1.75, .88, .18, .06, dk(c, .15), { ol: false }); snowTop(-.24, .64, .04, .22, 1.81, .04); if (p.sign) F.text('SOS', -.02, 1.0 + .0, c);
  },
};

const ladder = {
  id: 'prop.harbor.ladder', kind: 'prop', tags: ['harbor', 'dock', 'ladder', 'water'], solid: false, size: p => [.6, .2, (p.h || .5) + .8], vb: p => [-.2, -.1, 0, .8, .5, (p.h || .5) + 1],
  variants: [{ h: .5 }, { h: 1 }, { h: 1, c: '#f2c230' }, { h: 1.5, c: '#d8452f' }],
  draw(p) {
    const h = p.h || .5, c = p.c || '#8a98a3', y = .12;
    for (const x of [.1, .5]) { lw([x, y, 0], [x, y, h + .55], c); lw([x + .04, y, 0], [x + .04, y, h + .55], dk(c, .3)); lw([x, y, h + .55], [x, y - .1, h + .7], c); lw([x, y - .1, h + .7], [x, y - .25, h], c); }
    for (let z = .12; z < h + .5; z += .2) lw([.1, y, z], [.52, y, z], lt(c, .2));
    spx(.1, y, 0, -1, 1, '#e8f6fb'); spx(.5, y, 0, 2, 1, '#e8f6fb');
  },
};

const docklamp = {
  id: 'prop.harbor.lamp', kind: 'prop', tags: ['harbor', 'lamp', 'light', 'street'], solid: true, size: [.3, .3, 4], vb: [-1.1, -.5, 0, 1.4, 1.2, 4.6],
  light: { x: .15, y: .6, z: 0, r: 4.5 },
  variants: [{ seed: 1 }, { seed: 2, double: true, c: '#2f4a4a' }, { seed: 3, ring: true }, { seed: 4, gull: true, c: '#4a3a34' }, { seed: 5, basket: true, c: '#2f4a6a' }],
  draw(p) {
    const c = p.c || '#3a3a44', x = .15, y = .15;
    cyl(x, y, 0, .15, .3, c); box(x - .05, y - .05, .3, .1, .1, 3.5, c, { ol: false }); band(x, y, 1.1, .08, .06, lt(c, .3));
    const arm = s => { const ax = x + s * .75; lw([x, y, 3.6], [x + s * .2, y, 3.95], c); lw([x + s * .2, y, 3.95], [ax, y, 3.95], c); lw([ax, y, 3.95], [ax, y, 3.75], c);
      fq([[ax - .32, y, 3.52], [ax + .32, y, 3.52], [ax + .1, y, 3.78], [ax - .1, y, 3.78]], winter() ? '#dfe8f0' : '#2f6f5f'); lw([ax - .32, y, 3.52], [ax + .32, y, 3.52], '#1f3a34');
      qy(ax - .12, ax + .12, y + .01, 3.42, 3.52, '#f1e6bd'); glow(() => { qy(ax - .14, ax + .14, y + .01, 3.4, 3.52, '#fff2c4'); fq([[ax - .14, y + .02, 3.4], [ax + .14, y + .02, 3.4], [ax + .7, y + .02, 2.2], [ax - .7, y + .02, 2.2]], '#ffe39a', 'glass'); }); };
    arm(-1); if (p.double) arm(1);
    if (!p.double) { lw([x, y, 3.8], [x, y, 4.1], c); ball(x, y, 4.12, .07, c, { ol: false }); }
    if (p.ring) lifering(face('y', y + .06), x, 1.55, .26);
    if (p.gull) gull(x, y, 4.2, 1);
    if (p.basket) { const fo = foliage('leaf', .4); lw([x, y, 2.9], [x + .5, y, 2.9], c); lw([x + .45, y, 2.9], [x + .45, y, 2.7], c); if (fo) { ball(x + .45, y, 2.5, .26, fo); spx(x + .45, y, 2.55, -2, 0, '#f2a7c3'); spx(x + .45, y, 2.5, 2, -2, '#f7e08a'); spx(x + .45, y, 2.5, 0, 2, '#f2a7c3'); } else ball(x + .45, y, 2.5, .2, '#8a6a4a'); }
  },
};

const perch = {
  id: 'prop.harbor.gullperch', kind: 'prop', tags: ['harbor', 'gull', 'bird', 'piling', 'decor'], solid: true, size: [.5, .5, 1.6], vb: [-.5, -.5, 0, 1.6, 1.3, 2.9],
  variants: [{ kind: 'post', seed: 1 }, { kind: 'sign', seed: 2, text: 'NO' }, { kind: 'cluster', seed: 3 }, { kind: 'post', seed: 4, h: 2.2 }],
  draw(p) {
    const k = p.kind || 'post', pc = '#6b5240', h = p.h || 1.4, r = rng(p.seed || 1);
    if (k === 'sign') { box(.2, .2, 0, .1, .1, 1.9, '#8a8f98'); box(-.2, .18, 1.25, .9, .08, .6, '#f4f0e8'); const F = face('y', .265); F.q(-.16, .66, 1.29, 1.81, '#f4f0e8'); F.text('NO', .1, 1.75, '#d8452f'); F.text('FEED', -.12, 1.5, '#3a3446'); F.l(-.16, 1.29, .66, 1.29, '#d8452f'); gull(.3, .22, 1.87, 1); snowTop(-.2, .7, .18, .26, 1.85, .03); return; }
    const post = (x, y, hh) => { cyl(x, y, 0, .16, hh, pc, { t: winter() ? SNOW : dk(pc, .25) }); band(x, y, 0, .16, .18, '#4a5a4a'); band(x, y, hh - .12, .16, .05, '#3a3040'); spx(x, y, hh, -2, 3, '#f4f0e8'); spx(x, y, hh, -2, 5, '#f4f0e8'); };
    if (k === 'cluster') { post(.2, .2, h + .5); post(.65, .3, h); post(.32, .68, h - .3); gull(.2, .2, h + .52, 1); gull(.65, .3, h + .02, -1); }
    else { post(.25, .25, h); gull(.25, .25, h + .02, r() < .5 ? 1 : -1); }
  },
};

const shack = {
  id: 'prop.harbor.foodshack', kind: 'prop', tags: ['harbor', 'foodstand', 'food', 'pier', 'shop'], solid: true, size: [3, 2.4, 3], vb: [-.5, -.4, 0, 3.5, 3.6, 4.9],
  light: { x: 1.5, y: 3.4, z: 0, r: 3.5 },
  variants: [{ kind: 'icecream', seed: 1 }, { kind: 'chips', seed: 2 }, { kind: 'icecream', seed: 3, c: '#bfe8d8', awn: '#e88ab0' }, { kind: 'chips', seed: 4, c: '#f4f0e8', awn: '#d8452f', name: 'CHIPPY' }, { kind: 'lobster', seed: 5, c: '#b5372c', awn: '#f4f0e8', name: 'LOBSTER ROLLS' }],
  draw(p) {
    const k = p.kind || 'icecream', ice = k === 'icecream', c = p.c || (ice ? '#f7c9d8' : '#2f6f9f'), awn = p.awn || (ice ? '#6fd0c0' : '#f2c230'), name = p.name || (ice ? 'ICE CREAM' : k === 'chips' ? 'FISH & CHIPS' : 'FOOD'), w = 3, d = 2.4, h = 2.4, Fy = face('y', d), Fx = face('x', w);
    box(0, 0, 0, w, d, h, c, { l: PAT.planks(Lc(c), 4), r: PAT.planks(Rc(c), 4) }); Fy.q(0, w, 0, .25, Lc(dk(c, .3))); Fx.q(0, d, 0, .25, Rc(dk(c, .3)));
    // hatch + counter
    Fy.q(.35, 2.65, .95, 2, Lc('#f4f0e8')); Fy.q(.42, 2.58, 1, 1.95, '#3a3040'); glow(() => Fy.q(.42, 2.58, 1, 1.95, '#ffe2a0', '#ffd080'));
    // goods silhouettes
    const g = ice ? ['#f7a8c0', '#f7e8b0', '#a8e0c8', '#c8a888'] : ['#e8c070', '#f2d890', '#d8a050', '#c8d4dc'];
    for (let i = 0; i < 5; i++) { const a = .6 + i * .4; Fy.q(a, a + .22, 1.02, 1.25 + (i % 2) * .1, g[i % 4]); }
    Fy.l(.42, 1.6, 2.58, 1.6, '#5a4a52'); glow(() => Fy.l(.42, 1.6, 2.58, 1.6, '#a8782e'));
    box(.3, d, .82, 2.4, .32, .12, '#f4f0e8');
    // menu on the side, door
    door(Fx, .7, { c: dk(c, .35), glass: false }); Fx.q(1.45, 2.15, .9, 1.9, Rc('#2c3a36')); for (let z = 1.7; z > 1; z -= .18) Fx.l(1.55, z, 1.55 + .2 + ((z * 37) % 3) * .12, z, '#f4f0e8');
    // awning
    const A = [[-.1, d, 2.42], [w + .1, d, 2.42], [w + .1, d + .9, 2.08], [-.1, d + .9, 2.08]], ac_ = winter() ? SNOW : awn;
    fq(A, (X, Y) => (Math.floor((X + 800) / 4) & 1) ? '#f4f0e8' : ac_); qy(-.1, w + .1, d + .9, 1.93, 2.08, PAT.vstripes(Lc('#f4f0e8'), Lc(awn), 4)); lw(A[2], A[3], dk(awn, .5)); lw(A[1], A[2], dk(awn, .5)); lw([-.1, d + .9, 1.93], [w + .1, d + .9, 1.93], dk(awn, .5));
    // roof + sign + mascot
    box(-.12, -.12, h, w + .24, d + .24, .14, dk(c, .25)); snowTop(-.12, w + .12, -.12, d + .12, h + .14, .1);
    const sw = Math.min(w + .2, name.length * 4 / 16 + .4), sx = (w - sw) / 2; box(sx, d - .3, h + .14, sw, .14, .6, '#2a2038'); lit(() => { face('y', d - .155).text(name, sx + .2, h + .58, ice ? '#ffb0d0' : '#ffd060'); for (let x = sx + .1; x < sx + sw; x += .28) spx(x, d - .155, h + .74, 0, 0, '#fff2c4'); });
    const mx = w / 2, my = d / 2 - .3, mz = h + .14;
    if (ice) { cone(mx, my, mz + 1.05, .36, -1.05 + .0001, '#d8a860'); fq([[mx - .5, my, mz + 1.05], [mx + .5, my, mz + 1.05], [mx, my, mz]], Lc('#d8a860')); lw([mx - .5, my, mz + 1.05], [mx, my, mz], '#8a6a3a'); lw([mx + .5, my, mz + 1.05], [mx, my, mz], '#8a6a3a'); lw([mx - .25, my, mz + .5], [mx + .38, my, mz + .8], '#b88848'); lw([mx + .25, my, mz + .5], [mx - .38, my, mz + .8], '#b88848');
      ball(mx, my, mz + 1.3, .44, '#f7a8c0'); ball(mx + .05, my, mz + 1.8, .33, '#fbf3dc'); ball(mx + .05, my, mz + 2.12, .1, '#d8452f', { ol: false }); }
    else if (k === 'chips') { const y = my; fq([[mx - .75, y, mz + .5], [mx - .25, y, mz + .85], [mx + .45, y, mz + .7], [mx + .7, y, mz + .5], [mx + .45, y, mz + .3], [mx - .25, y, mz + .15]], Lc('#f2c84a')); fq([[mx - .7, y, mz + .5], [mx - 1.05, y, mz + .85], [mx - 1.05, y, mz + .15]], Lc('#f2c84a')); spx(mx + .4, y, mz + .58, 0, 0, '#2e2a3a'); lw([mx - .25, y, mz + .85], [mx + .45, y, mz + .7], '#a8802a'); lw([mx - .25, y, mz + .15], [mx + .45, y, mz + .3], '#a8802a'); lw([mx - .1, y, mz + .25], [mx - .1, y, mz + .75], '#c89a30'); lw([mx - .75, y, mz], [mx - .75, y, mz + .2], '#4a4458'); lw([mx + .3, y, mz], [mx + .3, y, mz + .25], '#4a4458'); }
    else { ball(mx, my, mz + .5, .4, '#e8552f', { squash: .7 }); for (const s of [-1, 1]) { lw([mx + s * .3, my, mz + .6], [mx + s * .75, my, mz + 1], '#e8552f'); ball(mx + s * .8, my, mz + 1.1, .16, '#e8552f'); } spx(mx, my, mz + .65, -2, 0, '#2e2a3a'); spx(mx, my, mz + .65, 2, 0, '#2e2a3a'); }
    bulbs([-.1, d + .92, 2.1], [w + .1, d + .92, 2.1], 9, ['#ffd98a', '#ff9a7a', '#9cf2b0', '#8fd0ff'], .12);
    // bin + stool
    cyl(-.25, d + .5, 0, .2, .65, '#3f8a55'); box(w + .08, d + .3, 0, .08, .5, .9, '#3a3446'); qx(w + .16, d + .32, d + .78, .15, .85, '#2c3a36'); lw([w + .17, d + .4, .65], [w + .17, d + .68, .65], '#f4f0e8');
  },
};

export default [deck, bollard, mooring, crates, barrels, fishcrates, nets, traps, buoy, anchor, ringstand, ladder, docklamp, perch, shack];
