// Walls, fences, gates, railings and construction pieces. All segments run along x (param len), footprint depth 0.5, fence plane at y = .25.
import { box, cyl, ball, qz, qy, qx, lw, fq, px, C, PW, dk, lt, mix, rng, hash2, glow, lit, PAT, signY, textY } from '../../engine/raster.js';
import { clumps, leafC, everC, limb, pole, snowTop, snowMound, blooms, bulb, rail, winter, season, P, SNOW, SNOW2, IRON, WOOD, STONE, WARM, WARM2 } from './_lib.js';

const Y = .25;
const seg = (id, tags, h, variants, draw, extra = {}) => ({ id: 'prop.street.' + id, kind: 'prop', tags: ['street', 'segment', ...tags], solid: true, size: p => [p.len || 2, .5, p.h || h], vb: p => [-.15, -.15, 0, (p.len || 2) + .15, .65, (p.h || h) + .5], variants, draw, ...extra });
const posts = (L, step) => { const n = Math.max(1, Math.round(L / step)), a = []; for (let i = 0; i <= n; i++) a.push(i * L / n); return a; };
/** climbing roses / ivy along a fence */
function climber(L, z, seed, flowers) { if (winter()) return; const R = rng(seed * 3 + 1), bl = []; for (let x = .3; x < L - .1; x += .45) bl.push({ x: x + (R() - .5) * .2, y: Y + .08, z: z * (.5 + R() * .45), r: .2 + R() * .1, c: season() === 2 ? ['#c9792a', '#b8432a', '#7a9a45'][Math.floor(R() * 3)] : leafC(Math.floor(R() * 3), '#3a8a4a', .3) }); clumps(bl, { seed, bump: .2, dots: flowers && season() < 2 ? { c: flowers, p: .3 } : null }); }

export default [
  seg('wall.low', ['wall', 'lowwall', 'park', 'garden'], .8, [{ len: 2 }, { len: 4, mat: 'stone' }, { len: 3, mat: 'concrete', h: .5 }, { len: 4, mat: 'brick', h: 1.2, ivy: true, seed: 3 }, { len: 2, mat: 'stone', pier: true }, { len: 3, mat: 'plaster', c: '#e8dcc0' }], p => {
    const L = p.len || 2, h = p.h || .8, mat = p.mat || 'brick', c = p.c || { brick: '#b5654a', stone: '#a8a69c', concrete: '#b6b1a3', plaster: '#e8dcc0' }[mat], pat = mat === 'brick' ? PAT.brick : mat === 'stone' ? PAT.stone : mat === 'plaster' ? PAT.stucco : (x => x);
    box(0, .06, 0, L, .38, h - .1, c, { l: pat(dk(c, .18)), r: pat(dk(c, .36)) });
    const cap = mat === 'brick' ? '#d8d2c0' : lt(c, .15); box(-.03, .02, h - .1, L + .06, .46, .1, cap, { t: winter() ? SNOW : cap });
    if (p.pier) for (const x of [0, L - .5]) { box(x, 0, 0, .5, .5, h + .25, c, { l: pat(dk(c, .18)), r: pat(dk(c, .36)) }); box(x - .04, -.04, h + .25, .58, .58, .1, cap, { t: winter() ? SNOW : cap }); ball(x + .25, .25, h + .5, .16, cap); }
    if (p.ivy && !winter()) { const R = rng(p.seed || 1), bl = []; for (let x = .2; x < L; x += .35) if (R() < .7) bl.push({ x, y: .47, z: h * (.45 + R() * .5), r: .18 + R() * .14, c: season() === 2 ? ['#b8432a', '#c9792a', '#d9562b'][Math.floor(R() * 3)] : everC(Math.floor(R() * 3), '#4f9a45', .4) }); clumps(bl, { seed: p.seed, bump: .22 }); }
  }),
  seg('fence.wood', ['fence', 'wood', 'maplewood', 'garden', 'alley'], 1.6, [{ len: 2 }, { len: 4, c: '#8a6a4a' }, { len: 4, h: 2, c: '#6a5a4a', worn: true, seed: 2 }, { len: 2, c: '#c8b08a', lattice: true }, { len: 3, c: '#7a8a6a' }], p => {
    const L = p.len || 2, h = p.h || 1.6, c = p.c || '#a8744a', R = rng(p.seed || 1), top = p.lattice ? h - .4 : h;
    for (const x of posts(L, 2)) box(Math.min(L - .14, Math.max(0, x - .07)), Y - .14, 0, .14, .14, h + .05, dk(c, .15), { ol: false });
    box(0, Y, .08, L, .06, top - .08, c, { l: (u, v, w, hh) => (u % 4 === 0) ? dk(c, .45) : (p.worn && hash2(u >> 2, 0, 5) < .2 && v > hh - 4) ? null : hash2(u >> 2, v >> 3, 2) < .12 ? dk(c, .28) : dk(c, .15), t: winter() ? SNOW : lt(c, .2) });
    if (p.lattice) { for (let i = 0; i < L * 16; i += 3) { lw([i / 16, Y + .06, top], [Math.min(L, i / 16 + .4), Y + .06, Math.min(h, top + .4)], c); lw([i / 16, Y + .06, h], [Math.min(L, i / 16 + .4), Y + .06, top], dk(c, .2)); } rail([0, Y + .06, h], [L, Y + .06, h], winter() ? SNOW : lt(c, .1), 2); }
    lw([0, Y + .06, .5], [L, Y + .06, .5], dk(c, .4)); lw([0, Y + .06, top - .3], [L, Y + .06, top - .3], dk(c, .4));
    if (p.worn) { textY('NO', .5, Y + .065, 1.2, '#e8e2d4'); const s = P(L * .6, Y + .065, 1.1); for (let i = 0; i < 9; i++) { px(s[0] + i, s[1] + Math.round(Math.sin(i) * 2) + (i >> 1), C('#5ad0f0')); px(s[0] + i, s[1] + Math.round(Math.sin(i) * 2) + (i >> 1) + 1, C('#ff5a8a')); } }
  }),
  seg('fence.picket', ['fence', 'picket', 'maplewood', 'garden', 'house'], 1, [{ len: 2 }, { len: 4 }, { len: 4, roses: ['#f25a6a', '#ff8ab0'], seed: 2 }, { len: 3, c: '#e8d8a8', roses: ['#ffffff', '#ffd23a'], seed: 4 }, { len: 2, c: '#a8c8d8' }], p => {
    const L = p.len || 2, h = p.h || 1, c = p.c || '#f4f0e6';
    for (const x of posts(L, 2)) { const px0 = Math.min(L - .12, Math.max(0, x - .06)); box(px0, Y - .1, 0, .12, .12, h + .08, c, { t: winter() ? SNOW : lt(c, .2) }); }
    rail([0, Y, .3], [L, Y, .3], dk(c, .25), 2); rail([0, Y, h - .28], [L, Y, h - .28], dk(c, .25), 2);
    for (let i = 1; i < L * 16 - 2; i += 4) { const x = i / 16; qy(x, x + 3 / 16, Y + .03, .08, h - .06, c); qy(x + 2 / 16, x + 3 / 16, Y + .03, .08, h - .06, dk(c, .2)); const s = P(x + 1 / 16, Y + .03, h - .06); px(s[0] + 1, s[1], C(winter() ? SNOW : c)); px(s[0], s[1] + 1, C(dk(c, .6))); px(s[0] + 2, s[1] + 2, C(dk(c, .6))); }
    if (p.roses) climber(L, h, p.seed || 1, p.roses);
  }),
  seg('fence.iron', ['fence', 'iron', 'oldtown', 'park', 'hillcrest'], 1.4, [{ len: 2 }, { len: 4, piers: true }, { len: 4, c: '#2f4f45', gold: true }, { len: 3, h: 2, piers: true, mat: '#b5654a' }, { len: 2, low: true, h: .6 }], p => {
    const L = p.len || 2, h = p.h || 1.4, c = p.c || '#2a2f3a', x0 = p.piers ? .5 : 0, x1 = p.piers ? L - .5 : L, mc = p.mat || '#a8a69c', pat = p.mat ? PAT.brick : PAT.stone;
    if (p.piers) { box(0, 0, 0, .5, .5, h + .1, mc, { l: pat(dk(mc, .18)), r: pat(dk(mc, .36)) }); box(-.04, -.04, h + .1, .58, .58, .1, '#d8d2c0', { t: winter() ? SNOW : '#d8d2c0' }); }
    box(x0, Y - .08, 0, x1 - x0, .16, .12, '#a8a69c', { ol: false, t: winter() ? SNOW : '#b8b6ac' });
    rail([x0, Y, h - .22], [x1, Y, h - .22], c, 1); rail([x0, Y, .22], [x1, Y, .22], c, 1);
    for (let i = 1; i < (x1 - x0) * 16; i += 3) { const x = x0 + i / 16, tall = (i % 6) === 1 || p.low; lw([x, Y, .12], [x, Y, tall ? h : h - .22], i % 2 ? c : lt(c, .12)); if (tall) { const s = P(x, Y, h); px(s[0], s[1] - 1, C(p.gold ? '#e8c85a' : winter() ? SNOW : lt(c, .3))); } }
    if (!p.piers) for (const x of posts(L, 2)) { pole(Math.min(L - .05, Math.max(.05, x)), Y, 0, h + .1, c, 2, false); const s = P(Math.min(L - .05, Math.max(.05, x)), Y, h + .1); px(s[0], s[1] - 1, C(p.gold ? '#e8c85a' : c)); px(s[0] - 1, s[1] - 1, C(p.gold ? '#e8c85a' : c)); }
    if (p.piers) { box(L - .5, 0, 0, .5, .5, h + .1, mc, { l: pat(dk(mc, .18)), r: pat(dk(mc, .36)) }); box(L - .54, -.04, h + .1, .58, .58, .1, '#d8d2c0', { t: winter() ? SNOW : '#d8d2c0' }); }
  }),
  seg('fence.chainlink', ['fence', 'chainlink', 'industrial', 'railyard', 'sports', 'alley'], 2, [{ len: 2 }, { len: 4 }, { len: 4, barbed: true, sign: 'KEEP OUT' }, { len: 4, h: 3, c: '#3f7a55' }], p => {
    const L = p.len || 2, h = p.h || 2, c = p.c || '#9aa0a8';
    qy(0, L, Y, .05, h, (u, v) => ((u + v) % 4 === 0 || (u - v + 400) % 4 === 0) ? c : null);
    for (const x of posts(L, 2)) pole(Math.min(L - .04, Math.max(.04, x)), Y - .02, 0, h + (p.barbed ? .25 : .05), dk(c, .2), 2, false);
    rail([0, Y, h], [L, Y, h], winter() ? SNOW : lt(c, .15), 1); rail([0, Y, .05], [L, Y, .05], dk(c, .25), 1);
    if (p.barbed) for (let i = 0; i < L * 16; i++) { const s = P(i / 16, Y, h + .2); px(s[0], s[1] + (i % 4 === 0 ? -1 : 0), C(i % 4 === 0 ? '#c8ccd4' : '#6a757e')); }
    if (p.sign) signY(p.sign, 1 - .85, 1 + .85, Y + .03, h * .5, h * .5 + .4, '#f0c832', '#2a2433');
  }),
  {
    id: 'prop.street.gate', kind: 'prop', tags: ['street', 'gate', 'fence', 'garden', 'park', 'entrance'], solid: false, size: [2, .5, 2], vb: [-.3, -.6, 0, 2.3, 1.6, 3.2],
    variants: [{ kind: 'picket' }, { kind: 'iron' }, { kind: 'wood' }, { kind: 'iron', open: true, c: '#2f4f45' }, { kind: 'picket', arch: true, seed: 3 }, { kind: 'wood', open: true }],
    draw(p) {
      // posts are solid in spirit, the opening (x .25..1.75) is the passage; closed gates are just visual (open: true swings the leaves in)
      const k = p.kind || 'picket', c = p.c || { picket: '#f4f0e6', iron: '#2a2f3a', wood: '#a8744a' }[k], h = k === 'picket' ? 1 : 1.5, op = p.open;
      const leaf = (xa, xb) => {
        if (op) { const x = xa < 1 ? xa : xb, dir = -1; if (k === 'iron') { for (let i = 0; i <= 10; i++) lw([x, Y + dir * i * .07, .1], [x, Y + dir * i * .07, h - (i % 2 ? .1 : 0)], c); lw([x, Y, h - .12], [x, Y - .7, h - .12], c); lw([x, Y, .2], [x, Y - .7, .2], c); } else qx(x, Y - .72, Y, .1, h - .05, k === 'wood' ? PAT.planks(dk(c, .36), 4) : PAT.vstripes(dk(c, .3), dk(c, .5), 3)); return; }
        if (k === 'iron') { for (let i = 0; i <= (xb - xa) * 16; i += 2) { const x = xa + i / 16, t = Math.abs((x - 1)); lw([x, Y, .1], [x, Y, h + .25 - t * .35], i % 4 ? c : lt(c, .12)); } rail([xa, Y, .25], [xb, Y, .25], c, 1); rail([xa, Y, h - .3], [xb, Y, h - .3], c, 1); }
        else if (k === 'wood') { box(xa, Y - .03, .1, xb - xa, .06, h - .1, c, { l: PAT.planks(dk(c, .15), 4), t: winter() ? SNOW : lt(c, .2) }); lw([xa, Y + .03, .2], [xb, Y + .03, h - .15], dk(c, .45)); lw([xa, Y + .03, .25], [xb, Y + .03, .25], dk(c, .4)); }
        else { rail([xa, Y, .3], [xb, Y, .3], dk(c, .25), 2); rail([xa, Y, h - .28], [xb, Y, h - .28], dk(c, .25), 2); for (let i = 0; i < (xb - xa) * 16 - 2; i += 4) { const x = xa + i / 16, t = 1 - Math.abs(x + .1 - 1) * .25; qy(x, x + 3 / 16, Y + .03, .1, h * t, c); qy(x + 2 / 16, x + 3 / 16, Y + .03, .1, h * t, dk(c, .2)); const s = P(x + 1 / 16, Y + .03, h * t); px(s[0] + 1, s[1], C(winter() ? SNOW : c)); } }
      };
      const post = x => { if (k === 'iron') { box(x - .12, Y - .12, 0, .24, .24, h + .3, '#a8a69c', { l: PAT.stone('#8a887e') }); ball(x, Y, h + .42, .13, '#c8c6bc'); } else { box(x - .09, Y - .09, 0, .18, .18, h + .25, k === 'wood' ? dk(c, .15) : c, { t: winter() ? SNOW : lt(c, .2) }); } };
      post(.12); leaf(.25, 1); leaf(1, 1.75); post(1.88);
      if (!op) { const s = P(1, Y + .04, h * .6); px(s[0], s[1], C('#e8c85a')); px(s[0] + 1, s[1], C('#2a2433')); }
      if (p.arch) { const pts = []; for (let i = 0; i <= 12; i++) { const a = i / 12 * Math.PI; pts.push([1 - Math.cos(a) * .88, Y, h + .25 + Math.sin(a) * 1.1]); } for (let i = 0; i < 12; i++) limb(pts[i], pts[i + 1], c, 2, 2); if (!winter()) { const R = rng(p.seed || 1), bl = pts.filter((_, i) => i % 2 === 0 || R() < .5).map((q, i) => ({ x: q[0], y: q[1] + .05, z: q[2], r: .2 + R() * .1, c: season() === 2 ? ['#c9792a', '#b8432a'][i % 2] : leafC(i, '#3a8a4a', .3) })); clumps(bl, { seed: p.seed, bump: .2, dots: season() < 2 ? { c: ['#ff8ab0', '#f25a6a', '#ffffff'], p: .3 } : null }); } else for (let i = 0; i < 12; i += 2) { const s = P(pts[i][0], pts[i][1], pts[i][2]); px(s[0], s[1] - 2, C(SNOW)); px(s[0] + 1, s[1] - 2, C(SNOW)); } }
    },
  },
  seg('railing', ['railing', 'terrace', 'retaining', 'hillcrest', 'bridge', 'lookout'], 1, [{ len: 2 }, { len: 4 }, { len: 4, kind: 'glass' }, { len: 4, kind: 'cable', c: '#e8e2d4' }, { len: 2, kind: 'stone' }, { len: 4, kind: 'stone' }], p => {
    const L = p.len || 2, h = p.h || 1, k = p.kind || 'bars', c = p.c || '#3d4a54';
    if (k === 'stone') { const sc = '#c8c2b4'; box(0, Y - .12, 0, L, .24, .12, sc, { ol: false }); for (let x = .2; x < L - .1; x += .3) { const s = P(x, Y, .12); for (let j = 0; j < Math.round((h - .3) * 16); j++) { const w = [1, 2, 2, 1][Math.min(3, (j / ((h - .3) * 16) * 4) | 0)]; for (let i = -w; i <= w; i++) px(s[0] + i, s[1] - j, C(i < 0 ? sc : dk(sc, .22))); } } box(-.02, Y - .15, h - .16, L + .04, .3, .14, sc, { t: winter() ? SNOW : lt(sc, .15) }); for (const x of [0, L - .3]) box(x, Y - .15, 0, .3, .3, h + .06, sc, { t: winter() ? SNOW : lt(sc, .15) }); return; }
    if (k === 'glass') qy(.05, L - .05, Y, .12, h - .1, '#a8d8e8', 'glass');
    if (k === 'bars') for (let i = 3; i < L * 16; i += 3) lw([i / 16, Y, .1], [i / 16, Y, h - .05], i % 2 ? c : lt(c, .15));
    if (k === 'cable') for (const z of [.25, .45, .65]) lw([0, Y, z], [L, Y, z], '#8a959e');
    for (const x of posts(L, k === 'bars' ? 2 : 1)) pole(Math.min(L - .04, Math.max(.04, x)), Y, 0, h, c, 2, false);
    rail([0, Y, .1], [L, Y, .1], c, 1); rail([0, Y, h], [L, Y, h], winter() ? SNOW : k === 'cable' ? '#a8744a' : lt(c, .1), 2);
  }),
  {
    id: 'prop.street.scaffold', kind: 'prop', tags: ['street', 'scaffold', 'construction', 'building'], solid: true, size: p => [p.len || 4, 1, (p.levels || 2) * 2 + 1], vb: p => [-.2, -.2, 0, (p.len || 4) + .2, 1.3, (p.levels || 2) * 2 + 1.3],
    variants: [{ len: 4, levels: 2 }, { len: 4, levels: 3, mesh: '#4fa850' }, { len: 2, levels: 1 }, { len: 6, levels: 2, mesh: '#3b7bd8', name: 'MAPLE BUILD' }],
    draw(p) {
      const L = p.len || 4, lv = p.levels || 2, H = lv * 2 + 1, c = '#9aa0a8', xs = posts(L, 2);
      for (const x of xs) pole(Math.min(L - .05, Math.max(.05, x)), .08, 0, H, dk(c, .15), 2, false);
      for (let i = 0; i < xs.length - 1; i++) for (let l = 0; l < lv; l++) lw([xs[i], .08, l * 2 + .1], [xs[i + 1], .08, l * 2 + 1.9], dk(c, .3));
      for (let l = 1; l <= lv; l++) { const z = l * 2; box(0, .1, z - .08, L, .8, .08, '#c9a268', { t: winter() ? SNOW : PAT.fboards('#c9a268', .27), l: '#a8824a' }); rail([0, .92, z + .5], [L, .92, z + .5], c, 1); rail([0, .92, z + 1], [L, .92, z + 1], '#f0c832', 1); const s = P(L * .3 + l * .5, .5, z); px(s[0], s[1] - 1, C('#d8342c')); px(s[0], s[1] - 2, C('#d8342c')); px(s[0] + 1, s[1] - 1, C('#a82a24')); if (l === lv) { box(L - .9, .3, z, .35, .3, .3, '#56636b', { ol: false }); cyl(L - 1.3, .5, z, .12, .25, '#e8e2d4'); } }
      if (p.mesh) { qy(0, L, .93, .3, H - .9, p.mesh, 'glass'); }
      for (const x of xs) pole(Math.min(L - .05, Math.max(.05, x)), .92, 0, H, c, 2, false);
      if (p.mesh && p.name) signY(p.name, L / 2 - 1.5, L / 2 + 1.5, .95, 2.6, 3.1, '#f4f0e0', '#2a2433');
      for (let z = .3; z < 2; z += .25) lw([L - .55, .93, z], [L - .2, .93, z], '#c8ccd4'); lw([L - .55, .93, 0], [L - .55, .93, 2], '#c8ccd4'); lw([L - .2, .93, 0], [L - .2, .93, 2], '#c8ccd4');
      for (const x of xs) { const s = P(Math.min(L - .05, Math.max(.05, x)), .92, 0); for (let i = -2; i <= 2; i++) px(s[0] + i, s[1] + 1, C('#6a5a4a')); }
    },
  },
  {
    id: 'prop.street.barrier', kind: 'prop', tags: ['street', 'construction', 'barrier', 'cone', 'roadworks'], solid: true, size: p => [p.len || 2, .5, 1], vb: p => [-.2, -.2, 0, (p.len || 2) + .2, .7, 1.4],
    variants: [{ kind: 'board' }, { kind: 'cones', len: 2 }, { kind: 'board', len: 3, lamp: true }, { kind: 'jersey', len: 2 }, { kind: 'cones', len: 1 }, { kind: 'water', len: 2 }],
    draw(p) {
      const L = p.len || 2, k = p.kind || 'board';
      if (k === 'cones') { for (let x = .25; x < L; x += .5) { box(x - .16, Y - .16, 0, .32, .32, .04, '#2a2f3a', { ol: false }); const a = P(x, Y, .04), b = P(x, Y, .7); for (let Yp = b[1]; Yp <= a[1]; Yp++) { const t = (Yp - b[1]) / (a[1] - b[1]), hw = Math.round(.5 + t * 2.6), st = t > .3 && t < .5 || t > .68 && t < .82; for (let i = -hw; i <= hw; i++) px(a[0] + i, Yp, C(st ? (i > 0 ? '#d8d2c0' : '#ffffff') : i > 0 ? '#c8601c' : '#f08a1c')); px(a[0] - hw - 1, Yp, C('#5a2a1c')); px(a[0] + hw + 1, Yp, C('#5a2a1c')); } if (winter()) px(b[0], b[1] - 1, C(SNOW)); } return; }
      if (k === 'jersey' || k === 'water') { const c = k === 'water' ? ['#f08a1c', '#f4f0e0'] : ['#b6b1a3', '#b6b1a3']; for (let i = 0; i < L; i++) { const cc = c[i % 2]; box(i + .02, .05, 0, .96, .4, .25, cc); box(i + .02, .14, .25, .96, .22, .6, cc, { t: winter() ? SNOW : lt(cc, .15) }); if (k === 'jersey') qy(i + .1, i + .9, .36, .5, .62, (u, v) => (u + v) % 8 < 4 ? '#f0c832' : '#2a2433'); } return; }
      for (const x of [.2, L - .2]) { lw([x, Y - .2, 0], [x, Y, .95], '#8a8f9a'); lw([x, Y + .2, 0], [x, Y, .95], '#c8ccd4'); }
      for (const z of [.55, .25]) { qy(.05, L - .05, Y + .02, z, z + .25, (u, v) => (u + v) % 8 < 4 ? '#f4f0e0' : '#d8342c'); lw([.05, Y + .02, z], [L - .05, Y + .02, z], '#5a2a2a'); lw([.05, Y + .02, z + .25], [L - .05, Y + .02, z + .25], winter() ? SNOW : '#ffffff'); }
      if (p.lamp) for (const x of [.2, L - .2]) { box(x - .06, Y - .04, .95, .12, .08, .14, '#3a3440', { ol: false }); const s = P(x, Y + .04, 1.02); lit(() => { px(s[0], s[1], C('#ffb03a')); px(s[0] + 1, s[1], C('#ff8a1c')); px(s[0], s[1] + 1, C('#ff8a1c')); px(s[0] + 1, s[1] + 1, C('#ffd98a')); }); }
    },
  },
];
