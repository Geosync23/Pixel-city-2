// Harborside landmarks: fish market, The Gilded Gull, boathouse, harbour master, lighthouse.
import { U, PW, C, px, box, qy, qx, qz, lw, fq, glow, lit, cyl, cone, ball, spx, ellipse, PAT, rng, dk, lt, mix, foliage } from '../../engine/raster.js';
import { Lc, Rc, walls, face, roll, door, gridWin, lamp, pipe, bulbs, rope, crate, barrel, gull, lifering, gableS, hipS, snowTop, band, taper, circ, disc, ring, roofPat, endPat, rail, parasol, cafeTable, fishCrate, winter, SNOW } from './_lib.js';

const fishmarket = {
  id: 'bld.harbor.fishmarket', kind: 'building', tags: ['harbor', 'fishmarket', 'shop', 'market', 'food'],
  size: p => [p.w || 11, p.d || 7, 5.6],
  vb: p => [-.5, -.5, 0, (p.w || 11) + .8, (p.d || 7) + 1.6, 7.2],
  door: { side: 'y', at: 1.5 }, light: { x: 5, y: 8.5, z: 0, r: 5 },
  variants: [
    { w: 11, d: 7, seed: 2, wall: '#efe7d2', roof: '#3f8a8a', awn: '#d8452f', name: 'FISH MARKET' },
    { w: 13, d: 8, seed: 6, wall: '#dfe9ea', roof: '#b5503c', awn: '#2f6f9f', name: 'BAY FISH HALL' },
    { w: 9, d: 6, seed: 10, wall: '#f1e7cf', roof: '#4a5868', awn: '#e0a030', name: 'FRESH CATCH' },
  ],
  draw(p) {
    const w = p.w || 11, d = p.d || 7, h = 3.4, rh = 2, r = rng(p.seed || 1), wall = p.wall || '#efe7d2', roof = p.roof || '#3f8a8a', awn = p.awn || '#d8452f', trim = '#2f5a6a';
    const Fy = face('y', d), Fx = face('x', w), tile = c => (u, v) => (v % 4 === 0 || u % 4 === 0) ? dk(c, .2) : c;
    walls(0, 0, 0, w, d, h, wall, c => PAT.siding(c, 3));
    Fy.q(0, w, 0, .9, tile(Lc('#bfe0e0'))); Fx.q(0, d, 0, .9, tile(Rc('#bfe0e0')));
    // entrance bay
    Fy.q(.75, 2.25, 0, 2.3, Lc(trim)); door(Fy, 1.08, { c: '#2f6f7f', frame: trim }); door(Fy, 1.92, { c: '#2f6f7f', frame: trim });
    Fy.q(.9, 2.1, 1.78, 2.2, '#9fcbe0', '#7fb6d0'); glow(() => Fy.q(.9, 2.1, 1.78, 2.2, '#ffd98a'));
    // stalls
    const nb = Math.max(2, Math.floor((w - 2.9) / 2.5)), bw = (w - 2.9) / nb;
    for (let i = 0; i < nb; i++) {
      const a0 = 2.7 + i * bw + .15, a1 = 2.7 + (i + 1) * bw - .15;
      Fy.q(a0 - .08, a1 + .08, .9, 2.5, Lc(trim)); Fy.q(a0, a1, .9, 2.42, '#3a3040'); glow(() => Fy.q(a0, a1, .9, 2.42, '#ffd98a', '#f4c870'));
      // shelves + scale silhouette inside
      Fy.l(a0, 1.9, a1, 1.9, '#5a4a52'); glow(() => { Fy.l(a0, 1.9, a1, 1.9, '#a8782e'); for (let t = a0 + .2; t < a1 - .1; t += .3) Fy.q(t, t + .15, 1.92, 2.1 + (r() * .15), '#c9903a'); });
      box(a0, d, 0, a1 - a0, .55, .9, '#f4f0e8', { l: tile(Lc('#f4f0e8')), r: tile(Rc('#f4f0e8')), t: '#eaf4fa', t2: '#d4e6f2' });
      const cols = ['#9fb4c4', '#e8927a', '#c8d4dc', '#f0b060', '#d8607a'];
      for (let t = a0 + .15; t < a1 - .2; t += .28) for (const yy of [.15, .36]) { const cc = cols[Math.floor(r() * 5)]; spx(t, d + yy, .9, 0, 0, cc); spx(t, d + yy, .9, 1, 0, cc); spx(t, d + yy, .9, 2, 1, dk(cc, .3)); }
      // awning
      const A = [[a0 - .15, d, 2.95], [a1 + .15, d, 2.95], [a1 + .15, d + 1, 2.5], [a0 - .15, d + 1, 2.5]], cA = winter() ? SNOW : awn;
      fq(A, (X, Y) => (Math.floor((X + 800) / 4) & 1) ? '#f4f0e8' : cA);
      qy(a0 - .15, a1 + .15, d + 1, 2.32, 2.5, PAT.vstripes(Lc('#f4f0e8'), Lc(awn), 4)); lw(A[2], A[3], dk(awn, .5)); lw([a0 - .15, d + 1, 2.32], [a1 + .15, d + 1, 2.32], dk(awn, .5)); lw(A[1], A[2], dk(awn, .5));
    }
    // side wall: windows, ice machine, fish mural
    for (let y = .8; y + 1.2 < d - 2.4; y += 1.9) gridWin(Fx, y, y + 1.2, 1.4, 2.5, { on: r() < .7, cols: 3, rows: 2, frame: trim, sill: true });
    Fx.q(d - 2.1, d - .5, 1.3, 2.6, Rc('#f4f0e8')); const fc = [w + .01, d - 1.3, 1.95];
    fq([[fc[0], fc[1] - .55, fc[2]], [fc[0], fc[1] - .2, fc[2] + .3], [fc[0], fc[1] + .3, fc[2] + .22], [fc[0], fc[1] + .55, fc[2]], [fc[0], fc[1] + .3, fc[2] - .22], [fc[0], fc[1] - .2, fc[2] - .3]], Rc('#4f9ac0'));
    fq([[fc[0], fc[1] - .5, fc[2]], [fc[0], fc[1] - .78, fc[2] + .28], [fc[0], fc[1] - .78, fc[2] - .28]], Rc('#4f9ac0')); spx(fc[0], fc[1] + .3, fc[2] + .08, 0, 0, '#f4f0e8');
    // roof with ridge lantern
    gableS(0, 0, h, w, d, rh, 'x', roof, { wall: endPat(wall, 'x'), over: .3, f: roofPat(roof, 3) });
    const lx = w * .2, ll = w * .6, m = d / 2;
    box(lx, m - .6, h + rh - .5, ll, 1.2, .8, wall, { ol: false }); for (let x = lx + .2; x + .8 < lx + ll; x += 1) gridWin(face('y', m + .6), x, x + .8, h + rh - .12, h + rh + .24, { on: true, cols: 2, rows: 1, frame: trim });
    gableS(lx, m - .6, h + rh + .3, ll, 1.2, .5, 'x', roof, { wall: Rc(wall), over: .15 });
    if (r() < .8) gull(lx + ll * .3, m, h + rh + .82, -1); if (r() < .5) gull(lx + ll * .8, m, h + rh + .82, 1);
    // big sign on the eave
    const nm = p.name || 'FISH MARKET', sw = nm.length * 4 / 16 + .5, sx = Math.min(w - sw - .3, 2.9 + (w - 2.9 - sw) / 2);
    box(sx, d + .3, h - .05, sw, .14, .85, '#1f3a4a'); Fy.k = d; face('y', d + .45).sign(nm, sx + .06, sx + sw - .06, h + .06, h + .72, '#1f3a4a', '#ffe08a', { lit: true, frame: false });
    lit(() => { for (let t = sx + .1; t < sx + sw; t += .3) spx(t, d + .45, h + .78, 0, 0, '#ffd060'); });
    // yard: crates, board
    fishCrate(w - 1.1, d + .75, 0, '#3f7fbf', 1); fishCrate(w - 1.05, d + .8, .3, '#f4f0e8', 2); if (r() < .7) fishCrate(.1, d + .1, 0, '#2f8f7f', 3);
    box(2.35, d + .2, 0, .08, .5, .95, '#3a3446'); qx(2.43, d + .22, d + .68, .15, .9, '#2c3a36'); lw([2.44, d + .3, .7], [2.44, d + .6, .7], '#f4f0e8'); lw([2.44, d + .3, .5], [2.44, d + .5, .5], '#f4f0e8');
  },
};

const gull_ = {
  id: 'bld.harbor.gildedgull', kind: 'building', tags: ['harbor', 'restaurant', 'seafood', 'food', 'waterfront'],
  size: p => [p.w || 10, p.d || 7, 5.8],
  vb: p => [-.5, -.5, 0, (p.w || 10) + .7, (p.d || 7) + 1.2, 7.6],
  door: { side: 'y', at: 1.3 }, light: { x: 1.3, y: 8.2, z: 0, r: 4.5 },
  variants: [
    { w: 10, d: 7, seed: 1, wall: '#2f4a6a', roof: '#8a3f3a', name: 'THE GILDED GULL' },
    { w: 11, d: 8, seed: 5, wall: '#f1e7cf', roof: '#2f5a6a', awn: '#b5503c', name: 'THE GILDED GULL' },
    { w: 10, d: 7, seed: 9, wall: '#7a3a3f', roof: '#3a4252', awn: '#2f4a6a', name: 'THE GILDED GULL' },
  ],
  draw(p) {
    const w = p.w || 10, d = p.d || 7, r = rng(p.seed || 1), wall = p.wall || '#2f4a6a', roof = p.roof || '#8a3f3a', trim = '#f1e7cf', awn = p.awn || wall, gold = '#f2c84a', H = 4, bw = w - 3.5;
    const Fy = face('y', d), Fx = face('x', bw);
    walls(0, 0, 0, bw, d, H, wall, c => PAT.siding(c, 3));
    qy(0, bw, d, 0, .3, PAT.stone(Lc('#8c8a90'))); qx(bw, 0, d, 0, .3, PAT.stone(Rc('#8c8a90')));
    for (const F of [Fy, Fx]) { const L = F === Fy ? bw : d; F.q(0, .14, .3, H, F.sh(trim)); F.q(L - .14, L, .3, H, F.sh(trim)); F.q(0, L, 1.98, 2.1, F.sh(trim)); }
    // front: double door + big windows
    Fy.q(.6, 2, 0, 1.8, Lc(trim)); door(Fy, .97, { c: '#7a2f2f', frame: trim }); door(Fy, 1.63, { c: '#7a2f2f', frame: trim });
    for (const a of [.42, 2.18]) { Fy.q(a - .07, a + .07, 1.1, 1.4, '#39424e'); lit(() => Fy.q(a - .04, a + .04, 1.14, 1.34, '#ffd98a')); }
    for (let a = 2.6; a + 1.5 <= bw - .3; a += 1.8) gridWin(Fy, a, a + 1.5, .55, 1.7, { on: true, cols: 3, rows: 2, frame: trim, sill: true });
    box(2.4, d, 1.76, bw - 2.6, .75, .09, awn, { t: (x, y) => (Math.floor(x * 2.5) & 1) ? trim : (winter() ? SNOW : awn), ol: false }); qy(2.4, bw - .2, d + .75, 1.62, 1.78, PAT.vstripes(Lc(trim), Lc(awn), 3)); lw([2.4, d + .75, 1.62], [bw - .2, d + .75, 1.62], dk(awn, .5));
    // sign
    const nm = p.name || 'THE GILDED GULL', sw = Math.min(bw - .5, nm.length * 4 / 16 + .5);
    Fy.sign(nm, .3, .3 + sw, 2.22, 2.82, '#1c2a3e', gold, { lit: true }); Fy.l(.3, 2.22, .3 + sw, 2.22, gold); Fy.l(.3, 2.82, .3 + sw, 2.82, gold);
    for (let a = .6; a + 1 <= bw - .3; a += 1.55) { const z = 2.95; Fy.q(a - .22, a, z, z + .8, Lc(trim)); Fy.q(a + 1, a + 1.22, z, z + .8, Lc(trim)); gridWin(Fy, a, a + 1, z, z + .8, { on: r() < .7, cols: 2, rows: 2, frame: trim, sill: true }); }
    // +x wall of the block: french doors to the terrace + upper windows
    for (let y = .8; y + 1.4 <= d - .5; y += 2) { Fx.q(y - .06, y + 1.46, .3, 1.86, Rc(trim)); gridWin(Fx, y, y + 1.4, .3, 1.8, { on: true, cols: 2, rows: 3, frame: trim }); }
    for (let y = .9; y + 1 <= d - .5; y += 1.6) gridWin(Fx, y, y + 1, 2.95, 3.75, { on: r() < .6, cols: 2, rows: 2, frame: trim, sill: true });
    // roof
    hipS(0, 0, H, bw, d, 1.7, roof, { over: .2 });
    box(bw - 1.9, 1.2, H + .5, .6, .6, 1.5, '#a85640', { l: PAT.brick(Lc('#a85640')), r: PAT.brick(Rc('#a85640')) }); snowTop(bw - 1.9, bw - 1.3, 1.2, 1.8, H + 2, .05);
    // gilded gull weathervane
    const gx = bw / 2, gy = d / 2, gz = H + 1.7; lw([gx, gy, gz], [gx, gy, gz + .8], '#4a4458');
    const g = (dx, dy) => spx(gx, gy, gz + .8, dx, dy, gold);[[-4, -3], [-3, -3], [-2, -3], [-1, -3], [0, -3], [1, -3], [-2, -4], [-1, -4], [0, -4], [1, -4], [2, -4], [2, -5], [3, -5], [-1, -5], [-2, -6], [-3, -7], [0, -2], [-5, -4]].forEach(q => g(q[0], q[1])); spx(gx, gy, gz + .8, 4, -5, '#e08030');
    bulbs([0, d + .32, H - .12], [bw, d + .32, H - .12], Math.round(bw * 2), ['#ffd98a', '#ffb060'], .12);
    // terrace deck
    const tx = bw, wood = '#b98a52';
    box(tx, 0, 0, w - tx, d, .3, wood, { t: PAT.fboards(wood, .3), l: PAT.planks(Lc(dk(wood, .2)), 4), r: PAT.planks(Rc(dk(wood, .2)), 4) });
    if (winter()) qz(tx + .1, w - .1, .1, d - .1, .3, SNOW, 'glass');
    rail([tx, 0, 0], [w, 0, 0], .3, .8, trim, 3);
    const ny = Math.max(1, Math.floor(d / 2.6));
    for (let i = 0; i < ny; i++) { const yy = (i + .5) * d / ny, xx = tx + (w - tx) / 2 + (i % 2 ? .2 : -.2); cafeTable(xx, yy, .3); parasol(xx, yy, .3, i % 2 ? '#d8452f' : (awn === wall ? '#2f6f9f' : awn), trim); }
    box(tx + .1, d - .6, .3, .5, .5, .4, '#8a5a48'); const fo = foliage('leaf', .3); if (fo) ball(tx + .35, d - .35, 1, .32, fo); else snowTop(tx + .1, tx + .6, d - .6, d - .1, .7, .05);
    rail([w, 0, 0], [w, d, 0], .3, .8, trim, Math.round(d / 1.2)); rail([tx + 1, d, 0], [w, d, 0], .3, .8, trim, 2);
    lifering(face('x', w), d / 2, .75, .25);
    lw([w, d, .3], [w, d, 2.6], '#4a4458'); lw([w, 0, .3], [w, 0, 2.6], '#4a4458'); bulbs([w, 0, 2.6], [w, d, 2.6], Math.round(d * 1.6), ['#ffd98a', '#ff9a7a', '#9cf2b0'], .35);
    bulbs([bw, d, H - .3], [w, d, 2.6], 7, ['#ffd98a', '#ff9a7a', '#9cf2b0'], .3);
    // menu board
    box(2.25, d + .25, 0, .08, .45, .9, '#3a3446'); qx(2.33, d + .27, d + .68, .15, .85, '#2c3a36'); lw([2.34, d + .33, .65], [2.34, d + .6, .65], gold);
  },
};

const boathouse = {
  id: 'bld.harbor.boathouse', kind: 'building', tags: ['harbor', 'boathouse', 'waterfront'],
  size: p => [p.w || 5, p.d || 7, 4.6],
  vb: p => [-.5, -.5, 0, (p.w || 5) + .9, (p.d || 7) + 3, 5.4],
  variants: [
    { w: 5, d: 7, seed: 1, wall: '#f1ece0', trim: '#2f6f9f', roof: '#5a6672', boat: '#d8452f' },
    { w: 5, d: 6, seed: 4, wall: '#b5503c', trim: '#f1e7cf', roof: '#4a4252', boat: '#f4f0e8' },
    { w: 6, d: 8, seed: 8, wall: '#6fa89a', trim: '#f4f0e8', roof: '#7a4a3a', boat: '#f2c230', name: 'ROWING CLUB' },
  ],
  draw(p) {
    const w = p.w || 5, d = p.d || 7, h = 2.9, rh = 1.7, r = rng(p.seed || 1), wall = p.wall || '#f1ece0', trim = p.trim || '#2f6f9f', roof = p.roof || '#5a6672', bc = p.boat || '#d8452f';
    const Fy = face('y', d), Fx = face('x', w), c = w / 2, ow = Math.min(3.4, w - 1.4);
    walls(0, 0, 0, w, d, h, wall, cc => PAT.siding(cc, 3));
    Fy.q(0, .14, 0, h, Lc(trim)); Fy.q(w - .14, w, 0, h, Lc(trim)); Fx.q(0, .14, 0, h, Rc(trim)); Fx.q(d - .14, d, 0, h, Rc(trim));
    Fy.q(0, w, 0, .25, Lc('#8c8a90')); Fx.q(0, d, 0, .25, Rc('#8c8a90'));
    // slipway
    const s0 = c - ow / 2, s1 = c + ow / 2, wood = '#a98a62';
    fq([[s0, d, .14], [s1, d, .14], [s1, d + 2.6, 0], [s0, d + 2.6, 0]], (X, Y) => (Y % 3 === 0) ? dk(wood, .25) : wood);
    qx(s1, d, d + 2.6, 0, .01, dk(wood, .4)); fq([[s1, d, 0], [s1, d + 2.6, 0], [s1, d, .14]], Rc(wood));
    lw([s0 + .5, d, .16], [s0 + .5, d + 2.6, .02], '#4d5560'); lw([s1 - .5, d, .16], [s1 - .5, d + 2.6, .02], '#4d5560');
    // opening + boat inside
    Fy.q(s0 - .1, s1 + .1, 0, 2.45, Lc(trim)); Fy.q(s0, s1, 0.1, 2.35, '#2c2638'); glow(() => Fy.q(s0, s1, .1, 2.35, '#f2c466', '#dba648'));
    const by = d - .02, hull = [[c - .85, by, 1.25], [c + .85, by, 1.25], [c + .6, by, .6], [c, by, .3], [c - .6, by, .6]];
    fq(hull, Lc(bc)); fq([[c - .85, by, 1.25], [c + .85, by, 1.25], [c + .78, by, 1.08], [c - .78, by, 1.08]], Lc('#f4f0e8')); lw(hull[2], hull[3], dk(bc, .6)); lw(hull[3], hull[4], dk(bc, .6)); lw([c, by, .3], [c, by, 1.25], dk(bc, .45));
    lw([c - .4, by, .3], [c - .4, by, .12], '#4d5560'); lw([c + .4, by, .3], [c + .4, by, .12], '#4d5560');
    // open door leaves
    const leaf = x => { box(x, d, 0.1, .08, 1.5, 2.25, trim, { r: PAT.planks(Rc(trim), 3) }); };
    leaf(s0 - .1); leaf(s1 + .02);
    // gable: round window, crossed oars, sign
    lamp(Fy, c, 2.82, { len: .35 });
    for (let a = .5; a + .8 < s0 - .2; a += 1.1) gridWin(Fy, a, a + .8, 1.1, 1.9, { on: r() < .5, cols: 2, rows: 2, frame: trim });
    // +x side: windows, kayak rack, ring
    for (let y = .7; y + 1 < d - 3.2; y += 1.6) gridWin(Fx, y, y + 1, 1.2, 2, { on: r() < .5, cols: 2, rows: 2, frame: trim, sill: true });
    const ky = d - 3.1, kc = ['#f2c230', '#d8452f', '#3f9fbf', '#7fbf6a'];
    for (let i = 0; i < 3; i++) { const z = .55 + i * .55, kk = kc[(i + (p.seed || 0)) % 4], X = w + .12; lw([w, ky + .4, z - .12], [w + .3, ky + .4, z - .12], '#4a4458'); lw([w, ky + 2.3, z - .12], [w + .3, ky + 2.3, z - .12], '#4a4458');
      fq([[X, ky, z], [X, ky + .5, z + .14], [X, ky + 2.2, z + .14], [X, ky + 2.7, z], [X, ky + 2.2, z - .12], [X, ky + .5, z - .12]], Rc(kk)); lw([X, ky, z], [X, ky + .5, z + .14], dk(kk, .6)); lw([X, ky + .5, z + .14], [X, ky + 2.2, z + .14], lt(kk, .3)); lw([X, ky + 2.2, z + .14], [X, ky + 2.7, z], dk(kk, .6)); lw([X, ky, z], [X, ky + .5, z - .12], dk(kk, .6)); lw([X, ky + .5, z - .12], [X, ky + 2.2, z - .12], dk(kk, .6)); lw([X, ky + 2.2, z - .12], [X, ky + 2.7, z], dk(kk, .6)); }
    lifering(Fx, .9 + (d - 4.2 > 1.6 ? 0 : 0), 2.45, .22);
    gableS(0, 0, h, w, d, rh, 'y', roof, { wall: endPat(wall, 'y'), over: .3, f: roofPat(roof, 4, 'y') });
    disc('y', [c, d + .01, h + rh * .42], .3, '#7fb6d0', '#9fcbe0', 12); glow(() => disc('y', [c, d + .01, h + rh * .42], .3, '#ffd98a', null, 12)); circ('y', [c, d + .01, h + rh * .42], .32, Lc(trim), 14); lw([c - .3, d + .01, h + rh * .42], [c + .3, d + .01, h + rh * .42], Lc(trim)); lw([c, d + .01, h + rh * .42 - .3], [c, d + .01, h + rh * .42 + .3], Lc(trim));
    if (p.name) Fy.sign(p.name, c - 1.5, c + 1.5, 2.5, 2.95, trim, wall);
    else { lw([c - 1.1, d + .02, 2.55], [c + 1.1, d + .02, 3.05], '#c9a36a'); lw([c - 1.1, d + .02, 3.05], [c + 1.1, d + .02, 2.55], '#c9a36a'); for (const s of [-1, 1]) { Fy.q(c + s * 1.1 - .12, c + s * 1.1 + .12, 2.9, 3.15, Lc(bc)); } }
    // buoys on a string at the corner
    const cols = ['#e8552f', '#f4f0e8', '#f2c230']; lw([.07, d + .02, 2.4], [.07, d + .02, 1], '#d9c08a'); for (let i = 0; i < 3; i++) ball(.1, d + .12, 2.1 - i * .42, .15, cols[i]);
    if (r() < .6) gull(w * .5, d * .3, h + rh + .02);
  },
};

const master = {
  id: 'bld.harbor.master', kind: 'building', tags: ['harbor', 'office', 'harbormaster', 'civic'],
  size: [5, 5, 7.6], vb: [-.6, -.6, 0, 5.9, 6, 11.5],
  door: { side: 'y', at: 1.2 },
  variants: [{ seed: 1, wall: '#f4f0e4', trim: '#2f4a6a', roof: '#b5503c' }, { seed: 5, wall: '#e6dcc0', trim: '#7a2f2f', roof: '#3f5a6a' }, { seed: 9, wall: '#cfe0e4', trim: '#2f5a50', roof: '#4a4252' }],
  draw(p) {
    const w = 5, d = 5, H = 4, r = rng(p.seed || 1), wall = p.wall || '#f4f0e4', trim = p.trim || '#2f4a6a', roof = p.roof || '#b5503c', Fy = face('y', d), Fx = face('x', w);
    walls(0, 0, 0, w, d, H, wall, c => PAT.siding(c, 3));
    qy(0, w, d, 0, .4, PAT.stone(Lc('#9a989e'))); qx(w, 0, d, 0, .4, PAT.stone(Rc('#9a989e')));
    for (const F of [Fy, Fx]) { F.q(0, .14, .4, H, F.sh(trim)); F.q(4.86, 5, .4, H, F.sh(trim)); F.q(0, 5, H - .16, H, F.sh(trim)); }
    door(Fy, 1.2, { c: trim, frame: '#f4f0e4' }); Fy.box(.5, 0, 1.8, 1.4, .55, .1, roof); lamp(Fy, 1.2, 1.74, { len: .3 });
    for (const a of [2.4, 3.6]) { Fy.q(a - .18, a, .8, 1.7, Lc(trim)); Fy.q(a + .8, a + .98, .8, 1.7, Lc(trim)); gridWin(Fy, a, a + .8, .8, 1.7, { on: r() < .7, cols: 2, rows: 2, frame: '#f4f0e4', sill: true }); }
    Fy.sign('HARBOUR MASTER', .55, 4.45, 2.08, 2.6, trim, '#f4f0e4');
    for (const a of [.7, 2.1, 3.5]) gridWin(Fy, a, a + .85, 2.85, 3.65, { on: r() < .6, cols: 2, rows: 2, frame: trim, sill: true });
    for (const z of [.8, 2.85]) for (const a of [.8, 2.2, 3.5]) gridWin(Fx, a, a + .85, z, z + .85, { on: r() < .6, cols: 2, rows: 2, frame: trim, sill: true });
    // notice board + barometer + bell
    Fx.q(1.75, 2.1, 1.9, 2.3, Rc('#c9a36a')); lifering(Fx, 4.55, 1.25, .22);
    Fy.q(4.4, 4.75, .9, 1.5, Lc('#3a3446')); Fy.q(4.44, 4.71, .95, 1.45, '#e8e2d4'); Fy.l(4.48, 1.3, 4.66, 1.3, '#d8452f'); Fy.l(4.48, 1.15, 4.6, 1.15, '#4a4458');
    // roof with flat top + lookout cabin
    hipS(0, 0, H, w, d, 1, roof, { over: .3, inset: .5 });
    const a = 1.25, cw = 2.5, Z = H + 1;
    rail([a, a + cw, 0], [a + cw, a + cw, 0], Z, .45, trim, 3); rail([a + cw, a, 0], [a + cw, a + cw, 0], Z, .45, trim, 3);
    box(a + .3, a + .3, Z, cw - .6, cw - .6, 1.4, wall); const Cy = face('y', a + cw - .3), Cx = face('x', a + cw - .3);
    gridWin(Cy, a + .42, a + cw - .42, Z + .45, Z + 1.2, { on: true, cols: 4, rows: 1, frame: trim }); gridWin(Cx, a + .42, a + cw - .42, Z + .45, Z + 1.2, { on: true, cols: 4, rows: 1, frame: trim });
    hipS(a + .3, a + .3, Z + 1.4, cw - .6, cw - .6, .75, roof, { over: .25 });
    // mast with yard, signal flags, radar and light
    const mx = 2.5, my = 2.5, mz = Z + 2.15; lw([mx, my, mz], [mx, my, mz + 2.6], '#4a4458'); lw([mx - .9, my, mz + 1.7], [mx + .9, my, mz + 1.7], '#4a4458');
    const fl = ['#d8452f', '#f2c230', '#2f6f9f', '#f4f0e8', '#3f8a55'];
    for (let i = 0; i < 4; i++) { const t = i / 4, q = [mx + .9 - t * .1, my, mz + 1.6 - t * 1.5]; lw([mx + .9, my, mz + 1.7], [mx + .85, my, mz], '#8a8090'); const cc = fl[(i + (p.seed || 0)) % 5]; for (let u = 0; u < 3; u++) for (let v = 0; v < 3; v++) spx(q[0], q[1], q[2], u + 1, v, (u + v) % 3 === 0 ? '#f4f0e8' : cc); }
    box(mx - .35, my - .05, mz + 2.2, .7, .1, .1, '#e8e2d4'); lit(() => { spx(mx, my, mz + 2.6, 0, -1, '#ff5040'); spx(mx, my, mz + 2.6, 0, -2, '#ff5040'); });
    // flag pole at the corner
    lw([.2, d - .2, H], [.2, d - .2, H + 2.4], '#e8e2d4'); for (let u = 1; u < 8; u++) for (let v = 0; v < 5; v++) spx(.2, d - .2, H + 2.4, -u, v + (u > 4 ? 1 : 0), (u < 3 || u > 5) ? '#d8452f' : '#f4f0e8');
    barrel(w - .5, d + .35, 0, '#8a5a34'); if (r() < .7) gull(a + cw, a + .4, Z + .5);
  },
};

const lighthouse = {
  id: 'bld.harbor.lighthouse', kind: 'building', tags: ['harbor', 'landmark', 'lighthouse'],
  size: p => [7, 5, 3.5 + (p.h || 8)],
  vb: p => [-1.6, -1.6, 0, 7.6, 5.8, 5.6 + (p.h || 8)],
  light: { x: 2.5, y: 2.5, z: 0, r: 11 },
  variants: [{ seed: 1, h: 8, c1: '#f4f0e8', c2: '#d8452f', cap: '#b5372c' }, { seed: 2, h: 10, c1: '#f4f0e8', c2: '#2e3a52', cap: '#2e3a52', bands: 5 }, { seed: 3, h: 7, c1: '#f4f0e8', c2: '#f4f0e8', cap: '#2f7a6a' }],
  draw(p) {
    const h = p.h || 8, c1 = p.c1 || '#f4f0e8', c2 = p.c2 || '#d8452f', cap = p.cap || '#b5372c', nb = p.bands || 4, r = rng(p.seed || 1), cx = 2.5, cy = 2.5;
    // rocks + stone plinth
    const rk = ['#8c8a90', '#7c7a84', '#9a989e']; for (const [x, y, s] of [[.4, 1.2, .5], [1, .3, .45], [4.4, .5, .5], [.3, 3.6, .55], [.9, 4.4, .4]]) { ball(x, y, .15, s, winter() && r() < .7 ? '#e6edf2' : rk[Math.floor(r() * 3)], { squash: .6 }); }
    cyl(cx, cy, 0, 2.3, .6, '#a8a49c'); band(cx, cy, .22, 2.3, .05, '#7c7a84'); if (winter()) { const t = PW(cx, cy, .6); ellipse(t[0], t[1], 2.3 * U * 1.414 - 2, 2.3 * U * .707 - 1, SNOW, '#e6edf2'); }
    // tower
    taper(cx, cy, .6, 1.6, 1.05, h, f => (Math.floor(f * nb * 2) % 2 === 1 ? c2 : c1));
    // door + windows on the front centre (screen aligned)
    const front = (z, rr) => PW(cx + rr * .707, cy + rr * .707, z);
    { const s = front(.6, 1.6), X = Math.round(s[0]), Y = Math.round(s[1]); for (let j = 0; j < 22; j++) for (let i = -6; i <= 6; i++) { if (j > 18 && Math.abs(i) > 24 - j) continue; px(X + i, Y - j, C(Math.abs(i) === 6 || j === 21 || (j > 18 && Math.abs(i) === 24 - j) ? '#4a4458' : i === 0 ? '#1f5a52' : '#2f7a6a')); } px(X + 3, Y - 9, C('#f2d27a')); }
    for (let k = 1; k <= Math.floor(h / 2.4); k++) { const z = .6 + k * 2.3, rr = 1.6 - (1.6 - 1.05) * (z - .6) / h, s = front(z, rr), X = Math.round(s[0]), Y = Math.round(s[1]);
      for (let j = 0; j < 8; j++) for (let i = -2; i <= 2; i++) px(X + i, Y - j, C(Math.abs(i) === 2 || j === 0 || j === 7 ? '#4a4458' : '#7fb6d0')); glow(() => { for (let j = 1; j < 7; j++) for (let i = -1; i <= 1; i++) px(X + i, Y - j, C('#ffd98a')); }); }
    // gallery
    const gz = .6 + h; cyl(cx, cy, gz, 1.55, .22, '#3a3446'); const gt = gz + .22;
    for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; if (Math.cos(a) + Math.sin(a) < -.3) continue; lw([cx + Math.cos(a) * 1.5, cy + Math.sin(a) * 1.5, gt], [cx + Math.cos(a) * 1.5, cy + Math.sin(a) * 1.5, gt + .55], '#3a3446'); }
    // lantern room
    cyl(cx, cy, gt, .9, .3, c1, { ol: false }); cyl(cx, cy, gt + .3, .85, 1.2, '#9fcbe0', { t: '#3a3446' });
    lit(() => { band(cx, cy, gt + .4, .85, 1, '#fff2a8'); const s = PW(cx, cy, gt + .9); ellipse(s[0], s[1] + 9, 7, 6, '#ffffff'); });
    for (let i = -2; i <= 2; i++) { const s = PW(cx, cy, gt + .3), X = Math.round(s[0] + i * 8.5), e = Math.round(.85 * U * .707 * Math.sqrt(Math.max(0, 1 - (i * 8.5 / (.85 * U * 1.414)) ** 2))); for (let j = 0; j < 20; j++) px(X, Math.round(s[1]) + e - j, C('#3a3446')); }
    circ('z', [cx, cy, gt + .55], 1.5, '#3a3446', 20, -.6, 2.2);
    glow(() => { const s = PW(cx, cy, gt + .9); for (let j = -34; j <= 34; j++) for (let i = -44; i <= 44; i++) { const dd = (i / 44) ** 2 + (j / 34) ** 2; if (dd < 1 && dd > .12 && ((i + j) & 1) && (dd < .5 || ((i - j) & 2))) px(s[0] + i, s[1] + 8 + j, C('#ffe9a0')); } });
    cyl(cx, cy, gt + 1.5, 1, .12, cap, { ol: false }); cone(cx, cy, gt + 1.6, 1, .9, winter() ? mix(cap, SNOW, .6) : cap); ball(cx, cy, gt + 2.55, .14, '#f2c84a'); lw([cx, cy, gt + 2.6], [cx, cy, gt + 3.2], '#4a4458');
    // keeper's cottage
    const kx = 4.2, ky = 1.6, kw = 2.8, kd = 3, kh = 2.1, Ky = face('y', ky + kd), Kx = face('x', kx + kw);
    walls(kx, ky, 0, kw, kd, kh, c1, c => PAT.siding(c, 3)); qy(kx, kx + kw, ky + kd, 0, .3, PAT.stone(Lc('#9a989e'))); qx(kx + kw, ky, ky + kd, 0, .3, PAT.stone(Rc('#9a989e')));
    door(Ky, kx + .8, { c: cap, frame: c1 }); gridWin(Ky, kx + 1.6, kx + 2.4, .8, 1.6, { on: true, cols: 2, rows: 2, frame: cap, sill: true }); lamp(Ky, kx + .8, 1.9, { len: .3 });
    gridWin(Kx, ky + .5, ky + 1.3, .8, 1.6, { on: r() < .7, cols: 2, rows: 2, frame: cap, sill: true }); gridWin(Kx, ky + 1.7, ky + 2.5, .8, 1.6, { on: true, cols: 2, rows: 2, frame: cap, sill: true });
    gableS(kx, ky, kh, kw, kd, 1.2, 'x', cap === c1 ? '#5a6672' : cap, { wall: endPat(c1, 'x'), over: .22, f: roofPat(cap === c1 ? '#5a6672' : cap, 3) });
    box(kx + .5, ky + .6, kh + .5, .45, .45, 1.1, '#a85640', { l: PAT.brick(Lc('#a85640')), r: PAT.brick(Rc('#a85640')) });
    if (r() < .8) gull(cx + .9, cy - .5, gt + .6, 1);
  },
};

export default [fishmarket, gull_, boathouse, master, lighthouse];
