// University campus + public library.
import { box, qy, qx, qz, fq, lw, glow, lit, gable, hip, cyl, cone, ball, PAT, rng, dk, lt, mix, hash2, foliage, PW, px, C, ENV } from '../../engine/raster.js';
import { Q, L, wallPat, txt, txtW, sign, icon, iconW, flatRoof, snowTop, gableSnow, dome, win, wins, door, awning, canopy, bulbs, lamp, halo, banner, flag, column, stairs, pediment, bush, topiary, planter, ROOF, clutter, VB, band, cornice, pick, winter, SNOW, SNOW2 } from './_lib.js';

/* ivy creeping up a wall (bare twigs in winter) */
function ivy(side, a0, a1, pl, z0, z1, seed) {
  const f = foliage('leaf', (seed % 7) / 7), w = winter(), c1 = w ? '#8a7466' : (side === 'y' ? f : dk(f, .18)), c2 = w ? '#8a7466' : dk(c1, .2);
  Q(side, a0, a1, pl, z0, z1, (u, v, W, H) => { const t = v / H, e = Math.min(u, W - u) / W, n = hash2(u >> 2, v >> 2, seed) * .6 + hash2(u >> 3, v >> 3, seed + 1) * .4; if (n < .2 + t * .55 + (e < .12 ? .3 : 0)) return null; if (w) return hash2(u, v, seed) > .8 ? c1 : null; return hash2(u, v, seed + 2) > .5 ? c1 : c2; });
}
function clockRows(R) { const rows = []; for (let y = -R; y <= R; y++) { let s = ''; for (let x = -R; x <= R; x++) { const d = Math.hypot(x, y); s += d > R + .3 ? '.' : d > R - 1.2 ? 'r' : ((x === 0 && y <= 0 && y > -R + 2) || (y === 0 && x >= 0 && x < R - 3) || (d > R - 3.2 && (x === 0 || y === 0))) ? 'h' : 'f'; } rows.push(s); } return rows; }
const CUP = ['..s.s..', '.s.s...', '.......', 'ccccc..', 'cccccdd', 'ccccc.d', 'cccccdd', '.ccc...', 'ppppp..'];
const BIKE = ['...b.....b..', '..bbb...bbb.', '.b.b.bbb.b.b', 'b...b...b..b', 'b...b...b..b', '.b.b.....bb.', '..b.......b.'];

export default [
  /* ------------------------------------------------------------ University main hall with clock tower */
  {
    id: 'bld.arts.unihall', kind: 'building', tags: ['arts', 'university', 'campus', 'landmark', 'school'],
    size: [18, 9, 8.5], vb: [-.4, -.4, 0, 18.6, 9.9, 19.5],
    door: { side: 'y', at: 9 }, light: { x: 9, y: 10, z: 0, r: 5 },
    variants: [{ seed: 2 }, { seed: 12, wall: '#c9b48a', roof: '#6a5a78', name: 'BAYVIEW COLLEGE' }, { seed: 31, wall: '#8e98a8', roof: '#3f6f66', name: 'MAPLE BAY TECH' }],
    draw(p) {
      const r = rng(p.seed || 1), wall = p.wall || '#a9604a', stone = '#e6dcc6', roof = p.roof || '#56627a', nm = p.name || 'MAPLE BAY UNIVERSITY', H = 6, D = 7, W = 18;
      const wo = { ww: .8, gap: .75, r, p: .55, mullion: 'cross', trim: stone, sill: true };
      // main range
      box(0, 0, 0, W, D, H, wall, wallPat('brick', wall));
      qy(0, W, D, 0, .6, PAT.stone(dk(stone, .22))); qx(W, 0, D, 0, .6, PAT.stone(dk(stone, .4)));
      for (let f = 0; f < 3; f++) { wins('y', 3.9, 7.3, D, f * 2 + .7, f * 2 + 1.6, f === 2 ? { ...wo, arch: true } : wo); wins('y', 10.7, 14.1, D, f * 2 + .7, f * 2 + 1.6, f === 2 ? { ...wo, arch: true } : wo); }
      qy(3.5, 14.5, D, 2.2, 2.34, dk(stone, .18)); qy(3.5, 14.5, D, 4.2, 4.34, dk(stone, .18));
      ivy('y', 3.6, 6.2, D + .01, .6, 4.6, (p.seed || 1) + 3); ivy('y', 12.6, 14.4, D + .01, .6, 3.4, (p.seed || 1) + 8);
      gable(0, 0, H, W, D, 2.4, 'x', roof, { wall, over: .2 }); gableSnow(0, 0, H, W, D, 2.4, 'x');
      // dormers + chimneys on the main roof
      for (const x of [5, 6.6, 11.6, 13.2]) { box(x - .35, D - 1.9, H + .75, .7, .8, .7, stone, { ol: false }); win('y', x - .22, x + .22, D - 1.1, H + .85, H + 1.35, { on: r() < .5 }); fq([[x - .45, D - 1.1, H + 1.45], [x + .45, D - 1.1, H + 1.45], [x, D - 1.1, H + 1.85]], dk(roof, .3)); }
      for (const x of [4.2, 14]) { box(x, 3, H + 1.9, .6, .6, 1.3, wall, { l: PAT.brick(dk(wall, .18)) }); box(x - .05, 2.95, H + 3.2, .7, .7, .12, stone, { ol: false }); }
      // gabled end pavilions
      for (const x0 of [0, 14.5]) {
        box(x0, 0, 0, 3.5, 8, H, wall, wallPat('brick', wall));
        qy(x0, x0 + 3.5, 8, 0, .6, PAT.stone(dk(stone, .22))); if (x0) qx(W, 0, 8, 0, .6, PAT.stone(dk(stone, .4)));
        for (let f = 0; f < 3; f++) wins('y', x0 + .4, x0 + 3.1, 8, f * 2 + .7, f * 2 + 1.6, { ...wo, n: 2, arch: f === 2 });
        qy(x0, x0 + 3.5, 8, 2.2, 2.34, dk(stone, .18)); qy(x0, x0 + 3.5, 8, 4.2, 4.34, dk(stone, .18));
        if (x0) { for (let f = 0; f < 3; f++) wins('x', .6, 7.4, W, f * 2 + .7, f * 2 + 1.6, { ...wo, arch: f === 2 }); qx(W, 0, 8, 2.2, 2.34, dk(stone, .36)); qx(W, 0, 8, 4.2, 4.34, dk(stone, .36)); ivy('x', 4.8, 7.8, W + .01, .6, 3.8, (p.seed || 1) + 5); }
        gable(x0, 0, H, 3.5, 8, 2.6, 'y', roof, { wall, over: .2 }); gableSnow(x0, 0, H, 3.5, 8, 2.6, 'y');
        win('y', x0 + 1.4, x0 + 2.1, 8, H + .5, H + 1.2, { on: r() < .5, arch: true, trim: stone });
      }
      for (let x = 4; x < 7.2; x += 1.05) bush(x + .4, D + .45, 0, .42, x / 9); for (let x = 10.9; x < 14.2; x += 1.05) bush(x + .4, D + .45, 0, .42, x / 7);
      // clock tower (projects forward)
      const tx = 7.5, ty = 5.5, tw = 3, th = 12.5;
      box(tx, ty, 0, tw, tw, th, wall, wallPat('brick', wall));
      qy(tx, tx + tw, ty + tw, 0, .6, PAT.stone(dk(stone, .22))); qx(tx + tw, ty, ty + tw, 0, .6, PAT.stone(dk(stone, .4)));
      for (const z of [6.2, 9.4]) { qy(tx, tx + tw, ty + tw, z, z + .22, dk(stone, .18)); qx(tx + tw, ty, ty + tw, z, z + .22, dk(stone, .36)); }
      for (const x of [tx + .12, tx + tw - .12]) { qy(x - .12, x + .12, ty + tw, .6, th, dk(stone, .18)); } qx(tx + tw, ty + tw - .24, ty + tw, .6, th, dk(stone, .36));
      // arched doorway
      const fy = ty + tw;
      qy(tx + .55, tx + tw - .55, fy, 0, 2.2, stone);
      win('y', tx + .75, tx + tw - .75, fy, 1.7, 1.75, { on: true, arch: true, archH: .6, trim: stone, glowc: ['#ffe2a0', '#ffc27a'] });
      door('y', 9, fy, { c: '#5a3626', double: true, w: 1.5, h: 1.7, frame: stone, full: false });
      lamp('y', tx + .3, fy, 1.9); lamp('y', tx + tw - .3, fy, 1.9);
      { const k = nm.lastIndexOf(' '), ls = txtW(nm) > 2.6 && k > 0 ? [nm.slice(0, k), nm.slice(k + 1)] : [nm]; qy(tx + .3, tx + tw - .3, fy + .01, 2.45, 2.55 + ls.length * .45, stone); ls.forEach((t, i) => sign('y', t, tx + .3, tx + tw - .3, fy + .02, 2.5 + (ls.length - 1 - i) * .45, 2.95 + (ls.length - 1 - i) * .45, null, '#4a3a34')); }
      win('y', 8.5, 9.5, fy, 3.7, 5.4, { on: r() < .7, arch: true, mullion: 'cross', trim: stone }); win('x', ty + 1, ty + 2, tx + tw, 3.7, 5.4, { on: r() < .7, arch: true, mullion: 'cross', trim: dk(stone, .2) });
      win('y', 8.65, 9.35, fy, 7, 8.4, { on: r() < .6, arch: true, trim: stone }); win('x', ty + 1.15, ty + 1.85, tx + tw, 7, 8.4, { on: r() < .6, arch: true, trim: dk(stone, .2) });
      // clock faces
      const CK = clockRows(13), cw = iconW(CK), cp = { r: '#3a3350', f: '#fff8e0', h: '#3a3350' };
      icon('y', CK, 9 - cw / 2, fy + .01, 11.95, cp); icon('x', CK, ty + 1.5 + cw / 2, tx + tw + .01, 11.95, { r: '#3a3350', f: '#eadfc0', h: '#3a3350' });
      glow(() => { icon('y', CK, 9 - cw / 2, fy + .01, 11.95, { f: '#fff2b0' }); icon('x', CK, ty + 1.5 + cw / 2, tx + tw + .01, 11.95, { f: '#f4d98a' }); });
      // belfry cornice + spire
      box(tx - .2, ty - .2, th, tw + .4, tw + .4, .35, stone);
      for (const [a, b] of [[tx, ty], [tx + tw - .4, ty], [tx, ty + tw - .4], [tx + tw - .4, ty + tw - .4]]) { box(a, b, th + .35, .4, .4, .7, stone, { ol: false }); cone(a + .2, b + .2, th + 1.05, .22, .5, roof); }
      hip(tx + .25, ty + .25, th + .35, tw - .5, tw - .5, 4.2, roof, { over: .1 });
      if (winter()) { fq([[tx + tw - .15, ty + tw - .15, th + .35], [tx + .15, ty + tw - .15, th + .35], [tx + tw / 2, ty + tw / 2, th + 4.55]], SNOW, 'glass'); }
      lw([tx + tw / 2, ty + tw / 2, th + 4.55], [tx + tw / 2, ty + tw / 2, th + 5.6], '#c9ccd2'); const q = PW(tx + tw / 2, ty + tw / 2, th + 5.6); px(q[0], q[1], C('#f2d98a')); px(q[0] + 1, q[1] + 1, C('#f2d98a')); px(q[0] - 1, q[1] + 1, C('#f2d98a'));
      stairs(8, 10, fy, 2, stone, { dep: .25, rise: .12 });
    },
  },
  /* ------------------------------------------------------------ modern lecture building */
  {
    id: 'bld.arts.lecture', kind: 'building', tags: ['arts', 'university', 'campus', 'school', 'modern'],
    size: p => [p.w || 12, p.d || 8, (p.floors || 3) * 2 + .3], vb: VB(p => [p.w || 12, p.d || 8, (p.floors || 3) * 2 + .3], 1.6, .6, 3),
    door: { side: 'y', at: 2 }, light: { x: 2, y: 9.2, z: 0, r: 4 }, lightFor: p => ({ x: 2, y: (p.d || 8) + 1.2, z: 0, r: 4 }),
    variants: [{ w: 12, d: 8, floors: 3, seed: 5, name: 'SCIENCE HALL', accent: '#e8843a' }, { w: 14, d: 8, floors: 4, seed: 19, name: 'HUMANITIES', accent: '#3f8fb0' }, { w: 10, d: 7, floors: 2, seed: 44, name: 'ART SCHOOL', accent: '#d94f7a' }, { w: 12, d: 9, floors: 3, seed: 8, name: 'ENGINEERING', accent: '#7cb342' }],
    draw(p) {
      const w = p.w || 12, d = p.d || 8, fl = p.floors || 3, H = fl * 2, r = rng(p.seed || 1), conc = '#e4e0d6', ac = p.accent || '#e8843a', dark = '#39404c', nm = p.name || 'SCIENCE HALL';
      const sx = 3.2; // stair tower width at the left end
      box(0, 0, 0, w, d, H, conc);
      // recessed glass ground floor behind pilotis
      qy(sx, w, d, 0, 2, '#4f6f86', '#5f8198'); glow(() => qy(sx, w, d, .2, 1.8, '#ffe9b0', '#ffd98a')); qx(w, 0, d, 0, 2, '#3f5a70', '#4a677e'); glow(() => qx(w, .2, d - .2, .2, 1.8, '#f4c870', '#e8b860'));
      for (let x = sx + 1.2; x < w - .2; x += 1.2) lw([x, d, 0], [x, d, 1.9], dark); lw([sx, d, 1.0], [w, d, 1.0], dark); for (let y = 1.2; y < d; y += 1.2) lw([w, y, 0], [w, y, 1.9], dark);
      for (let x = sx + .2; x <= w - .3; x += Math.max(2, (w - sx - .5) / Math.round((w - sx - .5) / 2.6))) box(x, d - .05, 0, .3, .3, 2, conc, { ol: false });
      box(w - .3, d - .05, 0, .3, .3, 2, conc, { ol: false });
      qy(sx, w, d + .25, 1.85, 2.4, dk(conc, .18)); lw([sx, d + .25, 1.85], [w, d + .25, 1.85], dk(conc, .5)); sign('y', nm, sx + 1.6, sx + 2.0 + txtW(nm), d + .26, 1.88, 2.38, null, dark);
      // upper floors: ribbon windows + coloured fins
      for (let f = 1; f < fl; f++) {
        const z0 = f * 2 + .55, z1 = f * 2 + 1.55, n = Math.round((w - sx - .6) / .9), ww = (w - sx - .6) / n;
        for (let i = 0; i < n; i++) { const x = sx + .3 + i * ww; if (hash2(i, f, p.seed || 1) < .16) { qy(x, x + ww, d, z0, z1, ac); lw([x, d, z0], [x, d, z1], dk(ac, .4)); } else win('y', x, x + ww, d, z0, z1, { on: r() < .5, frame: dark, glass: ['#6fa3bd', '#8dbdd2'] }); }
        const m = Math.round((d - .6) / .9), wy = (d - .6) / m;
        for (let i = 0; i < m; i++) { const y = .3 + i * wy; if (hash2(i, f, (p.seed || 1) + 9) < .16) qx(w, y, y + wy, z0, z1, dk(ac, .2)); else win('x', y, y + wy, w, z0, z1, { on: r() < .5, frame: dark, glass: ['#5a8fa8', '#76a8bd'] }); }
        lw([sx, d, f * 2 + .3], [w, d, f * 2 + .3], dk(conc, .4)); lw([w, 0, f * 2 + .3], [w, d, f * 2 + .3], dk(conc, .5));
      }
      const f = flatRoof(0, 0, H, w, d, conc, { cap: '#f4f0e8', roof: '#9a968e' }); f.x0 = sx + .4;
      // solar array + plant
      for (let x = f.x0 + .2; x + 1.3 < f.x1 - 1.5; x += 1.5) for (let y = f.y0 + .2; y + 1.1 < f.y1 - 2.5; y += 1.4) ROOF.solar(x, y, H);
      clutter(r, { ...f, y0: f.y1 - 2.2 }, ['ac2', 'vent', 'hatch', 'dish', 'ac'], 3);
      // accent stair tower with a tall slot window
      box(0, d - 2.2, 0, sx, 2.4, H + 1, ac);
      win('y', .45, 1.0, d + .2, 2.6, H + .4, { on: true, frame: dk(ac, .5), mullion: 'h', glowc: ['#fff1c8', '#ffe2a0'] });
      for (let z = 3.4; z < H + .3; z += .8) lw([.45, d + .2, z], [1.0, d + .2, z], dk(ac, .5));
      door('y', 2, d + .2, { c: dark, double: true, w: 1.5, h: 1.8, full: true, frame: '#fff8e8' });
      canopy(.9, 3.1, d + .2, 2.0, 1.0, '#fff8e8', { th: .12 });
      snowTop(0, sx, d - 2.2, d + .2, H + 1.001);
    },
  },
  /* ------------------------------------------------------------ dormitory */
  {
    id: 'bld.arts.dorm', kind: 'building', tags: ['arts', 'university', 'campus', 'residential', 'dorm'],
    size: p => [p.w || 10, p.d || 6, (p.floors || 4) * 2 + .3], vb: VB(p => [p.w || 10, p.d || 6, (p.floors || 4) * 2 + .3], 1.3, .6, 2.6),
    door: { side: 'y', at: 1.6 }, light: { x: 1.6, y: 7, z: 0, r: 3.5 }, lightFor: p => ({ x: 1.6, y: (p.d || 6) + 1, z: 0, r: 3.5 }),
    variants: [{ w: 10, d: 6, floors: 4, seed: 6, name: 'MAPLE HALL' }, { w: 12, d: 6, floors: 5, seed: 20, name: 'HERON HOUSE', wall: '#d9c9a8', panel: '#3f8fb0' }, { w: 9, d: 6, floors: 3, seed: 35, name: 'BAY HOUSE', wall: '#9aa7b4', panel: '#e9b44c' }, { w: 11, d: 7, floors: 5, seed: 51, name: 'ELM COURT', wall: '#b56a52', panel: '#f1e9d8' }],
    draw(p) {
      const w = p.w || 10, d = p.d || 6, fl = p.floors || 4, H = fl * 2, r = rng(p.seed || 1), wall = p.wall || '#c98a5a', pc = p.panel || '#5fa893', trim = '#f1e9d8', nm = p.name || 'MAPLE HALL';
      const CUR = ['#e86a5c', '#e9b44c', '#3fa7a0', '#8d7fd1', '#5fa8e0', '#ef8fb0', '#f1e9d8', '#7cc27a'];
      box(0, 0, 0, w, d, H, wall, wallPat('brick', wall));
      qy(0, w, d, 0, .4, dk(trim, .3)); qx(w, 0, d, 0, .4, dk(trim, .45));
      const sx = 3.2;
      for (let f = 0; f < fl; f++) {
        const z0 = f * 2 + .7, z1 = f * 2 + 1.6;
        const each = side => (i, a) => { const k = r(); Q(side, a - .1, a + 1, pl(side), z0 - .55, z0 - .1, side === 'y' ? pc : dk(pc, .2)); return k < .3 ? { curtain: pick(r, CUR) } : k < .42 ? { blind: .5 } : k < .5 ? { fbox: true } : null; };
        const pl = s => s === 'y' ? d : w;
        if (f > 0) wins('y', sx + .3, w - .3, d, z0, z1, { ww: .9, gap: .6, r, p: .6, mullion: 'v', trim, each: each('y') });
        else wins('y', sx + .3, w - .3, d, z0, z1, { ww: .9, gap: .6, r, p: .6, mullion: 'v', trim });
        wins('x', .4, d - .4, w, z0, z1, { ww: .9, gap: .7, r, p: .6, mullion: 'v', trim: dk(trim, .2), each: f > 0 ? each('x') : null });
        // the odd flag / poster in a window
      }
      // glazed stair bay over the entrance
      qy(.5, sx - .3, d, 0, H - .3, dk(trim, .18)); win('y', .8, sx - .6, d, 2.3, H - .6, { on: true, frame: '#4a4458', glass: ['#7fb6d0', '#9fcbe0'], glowc: ['#fff1c8', '#ffe2a0'] });
      for (let f = 1; f < fl; f++) { lw([.8, d, f * 2 + .1], [sx - .6, d, f * 2 + .1], '#4a4458'); lw([.8, d, f * 2 + 1.2], [sx - .6, d, f * 2 + .1 + 2], dk('#9fcbe0', .35)); }
      lw([(sx + .2) / 2, d, 2.3], [(sx + .2) / 2, d, H - .6], '#4a4458');
      door('y', 1.6, d, { c: pc, double: true, w: 1.4, h: 1.7, frame: trim, full: true });
      canopy(.5, sx - .3, d, 1.95, .9, pc, { th: .14 });
      sign('y', nm, .5, sx - .3, d + .91, 1.95, 2.35, pc, '#fff8e8', { frame: dk(pc, .4) });
      // bike rack baked at the wall
      for (let x = sx + .5, i = 0; x + .8 < w - .3 && i < 4; x += .95, i++) if (r() < .8) icon('y', BIKE, x, d + .02, .5, { b: pick(r, ['#c8423a', '#2f5d8a', '#3d3a4a', '#2f8a57', '#d98a2b']) });
      lw([sx + .4, d + .02, .12], [Math.min(w - .3, sx + 4.4), d + .02, .12], '#8d939b');
      // laundry / banner on the side
      if (r() < .7) { const z = 2 * (1 + Math.floor(r() * (fl - 1))) + .55; lw([w, 1, z], [w, 3.4, z], '#e8e2d4'); for (let y = 1.2, i = 0; y < 3.2; y += .45, i++) qx(w + .01, y, y + .32, z - .4 - (i % 2) * .12, z, pick(r, CUR)); }
      cornice(w, d, H - .2, trim, .2, .1);
      const f = flatRoof(0, 0, H, w, d, wall, { cap: trim });
      clutter(r, f, ['hatch', 'vent', 'solar', 'solar', 'ac', 'dish', 'chairs', 'garden', 'antenna'], 3 + Math.floor(w / 3));
    },
  },
  /* ------------------------------------------------------------ campus cafe kiosk */
  {
    id: 'bld.arts.kiosk', kind: 'building', tags: ['arts', 'campus', 'cafe', 'kiosk', 'food', 'park'],
    size: [3, 3, 3], vb: [-.9, -.9, 0, 3.9, 4.4, 5.2],
    door: { side: 'y', at: 1.5 }, light: { x: 1.5, y: 3.9, z: 0, r: 3 },
    variants: [{ seed: 1, name: 'BEAN CART' }, { seed: 2, wall: '#e9b44c', roof: '#c8423a', name: 'JUICE' }, { seed: 3, wall: '#ef8fb0', roof: '#5a4a78', name: 'CREPES' }, { seed: 4, wall: '#f1e9d8', roof: '#2f6f8a', name: 'COFFEE' }],
    draw(p) {
      const r = rng(p.seed || 1), wall = p.wall || '#3fa7a0', roof = p.roof || '#8a4b3a', cream = '#fff6e0', nm = p.name || 'COFFEE';
      box(0, 0, 0, 3, 3, 2.6, wall, { l: PAT.planks(dk(wall, .18), 4), r: PAT.planks(dk(wall, .36), 4) });
      qy(0, 3, 3, 0, .25, dk(wall, .5)); qx(3, 0, 3, 0, .25, dk(wall, .6));
      // serving hatch
      qy(.35, 2.65, 3, .95, 2.05, cream); qy(.45, 2.55, 3, 1.05, 1.95, '#4a3a34'); glow(() => qy(.45, 2.55, 3, 1.05, 1.95, '#ffd98a', '#f4c870'));
      // shelves, machine, cups inside
      const inn = () => { qy(.55, 1.1, 3, 1.05, 1.5, '#c9ccd2'); qy(.62, .8, 3, 1.5, 1.6, '#e2574c'); lw([1.3, 3, 1.62], [2.45, 3, 1.62], '#8a6f5a'); for (let x = 1.35; x < 2.4; x += .2) qy(x, x + .12, 3, 1.64, 1.8, pick(r, ['#fff6e0', '#e9b44c', '#e86a5c', '#7cc27a'])); qy(1.5, 2.3, 3, 1.05, 1.3, '#d9a441'); };
      inn(); glow(inn);
      box(.25, 3, .85, 2.5, .3, .1, '#8a6f5a');
      // menu board on the side + door
      door('x', .7, 3, { c: dk(wall, .3), glass: false, h: 1.7, w: .7, frame: cream });
      qx(3.01, 1.4, 2.6, .8, 2.0, '#2a2a33'); txt('x', 'MENU', 2.5, 3.02, 1.92, '#ffd166'); for (let k = 0; k < 4; k++) lw([3.02, 1.55, 1.5 - k * .18], [3.02, 2.45 - (k % 2) * .25, 1.5 - k * .18], '#e8e2d4');
      awning(.15, 2.85, 3, 2.2, { c: roof, c2: cream, dep: .55, drop: .3, stripe: .4 });
      hip(-.25, -.25, 2.6, 3.5, 3.5, 1.3, roof, { over: 0, inset: .25 });
      if (winter()) { qz(.6, 2.4, .6, 2.4, 3.91, SNOW); fq([[-.2, 3.2, 2.62], [3.2, 3.2, 2.62], [2.3, 2.3, 3.6], [.7, 2.3, 3.6]], SNOW, 'glass'); }
      // roof sign with cup
      box(.55, 1.6, 3.9, 1.9, .2, .75, '#2a2233', { ol: true });
      sign('y', nm, .55, 2.45, 1.81, 3.95, 4.6, null, '#ffd166', { lit: true });
      lit(() => icon('y', CUP, 1.5 - iconW(CUP) / 2, 1.81, 5.25, { c: cream, d: cream, p: '#e2574c', s: '#c9ccd2' }));
      bulbs('y', -.2, 3.2, 3.26, 2.56, { step: .35, cols: ['#fff2a8', '#ff8fb0', '#7df9ff'] }); bulbs('x', -.2, 3.2, 3.26, 2.56, { step: .35, cols: ['#fff2a8', '#ff8fb0', '#7df9ff'] });
      // stool + potted plant
      box(-.5, 3.2, 0, .4, .4, .5, '#8a6f5a'); topiary(3.3, 3.3, 0, .3);
    },
  },
  /* ------------------------------------------------------------ Maple Bay Public Library */
  {
    id: 'bld.arts.library', kind: 'building', tags: ['arts', 'civic', 'library', 'landmark', 'enterable'],
    size: [16, 11, 8], vb: [-.4, -.4, 0, 16.6, 11.6, 11.5],
    door: { side: 'y', at: 8 }, light: { x: 8, y: 11.8, z: 0, r: 6 },
    variants: [{ seed: 3, name: 'MAPLE BAY PUBLIC LIBRARY' }, { seed: 14, name: 'MAPLE BAY PUBLIC LIBRARY', wall: '#b9644c', roof: '#5a6f8a' }, { seed: 25, name: 'UNIVERSITY LIBRARY', wall: '#c9cdd4', roof: '#a8553f' }],
    draw(p) {
      const r = rng(p.seed || 1), stone = '#e9dfc8', wall = p.wall || stone, brick = wall !== stone, roof = p.roof || '#5fa893', nm = p.name || 'MAPLE BAY PUBLIC LIBRARY', pz = 1, H = 6.4;
      const wp = brick ? wallPat('brick', wall) : wallPat('stone', wall);
      // podium
      box(0, 0, 0, 16, 9, pz, stone, wallPat('stone', dk(stone, .08)));
      // main block
      box(.5, .5, pz, 15, 8, H - pz, wall, wp);
      const wo = { ww: 1, r, p: .75, arch: true, mullion: 'cross', trim: stone, glowc: ['#ffe2a0', '#ffc27a'] };
      wins('y', .9, 4.3, 8.5, pz + .9, pz + 3.2, { ...wo, n: 2 }); wins('y', 11.7, 15.1, 8.5, pz + .9, pz + 3.2, { ...wo, n: 2 });
      wins('x', 1.1, 7.9, 15.5, pz + .9, pz + 3.2, { ...wo, n: 4, trim: dk(stone, .2) });
      qy(.5, 15.5, 8.5, H - .9, H - .2, dk(stone, .18)); qx(15.5, .5, 8.5, H - .9, H - .2, dk(stone, .36)); lw([.5, 8.5, H - .9], [15.5, 8.5, H - .9], dk(stone, .5)); lw([15.5, .5, H - .9], [15.5, 8.5, H - .9], dk(stone, .55));
      for (const x of [.7, 4.6, 11.4, 15.3]) qy(x - .18, x + .18, 8.5, pz, H - .9, dk(stone, .14));
      // back wall of the portico: grand door
      qy(4.8, 11.2, 8.5, pz, H - .9, dk(stone, .26));
      door('y', 8, 8.5, { z: pz, c: '#5a3626', double: true, w: 1.8, h: 2.3, frame: stone, transom: true, full: false });
      win('y', 5.4, 6.4, 8.5, pz + .9, pz + 2.9, { on: true, mullion: 'cross', trim: stone }); win('y', 9.6, 10.6, 8.5, pz + .9, pz + 2.9, { on: true, mullion: 'cross', trim: stone });
      glow(() => qy(4.8, 11.2, 8.5, pz, pz + 3.6, '#ffd98a', 'glass'));
            // main roof: low hip + glazed lantern dome
      box(.5, .5, H, 15, 8, .3, stone);
      hip(.9, .9, H + .3, 14.2, 7.2, 1.5, roof, { over: 0, inset: .45 });
      if (winter()) qz(4.6, 11.4, 3.4, 5.6, H + 1.81, SNOW, SNOW2);
      cyl(8, 4.5, H + 1.8, 1.5, .7, stone);
      dome(8, 4.5, H + 2.5, 1.5, roof);
      lw([8, 4.5, H + 4.05], [8, 4.5, H + 4.8], '#f2d98a');
      // steps (inside footprint), cheek walls with lamps
      stairs(4.4, 11.6, 9, 5, stone, { dep: .4, rise: .2 });
      // portico: columns, entablature, pediment
      const cz = pz, ch = 4.4;
      for (let i = 0; i < 6; i++) column(4.9 + i * 1.24, 8.75, cz, ch, .26, lt(stone, .15));
      box(4.4, 6.5, cz + ch, 7.2, 2.6, .8, stone);
      sign('y', nm, 4.5, 11.5, 9.11, cz + ch + .12, cz + ch + .68, dk(stone, .1), '#4a3a34', { frame: dk(stone, .4) });
      gable(4.4, 6.5, cz + ch + .8, 7.2, 2.6, 1.7, 'y', roof, { wall: stone, over: .12 }); gableSnow(4.4, 6.5, cz + ch + .8, 7.2, 2.6, 1.7, 'y');
      pediment(4.4, 11.6, 9.11, cz + ch + .8, 1.7, stone);
      const q = PW(8, 9.12, cz + ch + 1.45); for (let k = -3; k <= 3; k++) { px(q[0] + k * 2, q[1] + k, C(k === 0 ? '#f2c230' : '#c9a66b')); } // book motif
      // cheek walls + lamp globes
      for (const x of [3.5, 11.6]) { box(x, 9, 0, .9, 2, 1.2, stone, wallPat('stone', dk(stone, .08))); box(x + .35, 10.3, 1.2, .2, .2, .9, '#3d4a54', { ol: false }); ball(x + .45, 10.4, 2.3, .22, '#fff2c4', { ol: true }); lit(() => { const g = PW(x + .45, 10.4, 2.3); px(g[0], g[1], C('#fff8d8')); px(g[0] - 1, g[1], C('#fff8d8')); px(g[0], g[1] - 1, C('#fff8d8')); }); halo(x + .45, 10.4, 2.3, 7); }
      // lawn planters in front of the wings
      for (const x0 of [.3, 12.8]) { box(x0, 9, 0, 2.9, 1.7, .35, dk(stone, .12)); for (let i = 0; i < 3; i++) bush(x0 + .5 + i * .95, 9.85, .35, .45, (i + x0) / 5); }
      banner('y', 1.0, 8.52, pz + 3.5, pz + 4.7, .9, '#2f5d8a', { c2: '#f2c230' }); banner('y', 14.1, 8.52, pz + 3.5, pz + 4.7, .9, '#a82a36', { c2: '#f2c230' });
      flag(15.2, 8.2, H + .3, 2.2, '#c8423a', '#fff6e0');
    },
  },
];
