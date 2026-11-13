// Arts Quarter street buildings: mural studios, gallery, record shop, tattoo/vintage, lofts, pizza, music club.
import { box, qy, qx, qz, fq, lw, glow, lit, cyl, ball, PAT, rng, dk, lt, mix, hash2, ENV } from '../../engine/raster.js';
import { Q, L, wallPat, txt, txtW, sign, icon, iconW, flatRoof, snowTop, win, wins, door, shutter, awning, canopy, bulbs, neon, halo, lamp, banner, bush, planter, ROOF, clutter, mural, MURAL_KINDS, muralPal, VB, band, cornice, pick, winter, SNOW } from './_lib.js';

const LIGHT = (at, D, r = 4) => ({ light: { x: at, y: D + .8, z: 0, r }, lightFor: p => ({ x: at, y: (p.d || D) + .8, z: 0, r }) });

/* ---------- bitmaps ---------- */
const HERON = [
  '......bbb.....', '.....bbwbyyyy.', '.....bbb......', '.....bb.......', '......bb......', '.......bb.....', '......bb......', '.....bb.......', '....bbb.......',
  '...bbbbbb.....', '..bbbccbbb....', '.bbbcccbbbb...', '.bbccccbbb....', 'bb.bbbbbb.....', 'b....p.p......', '.....p.p......', '.....p.p......', '.....p.pp.....', '....pp........'];
function vinyl(R) { const rows = []; for (let y = -R; y <= R; y++) { let s = ''; for (let x = -R; x <= R; x++) { const d = Math.hypot(x, y); s += d > R + .3 ? '.' : d > R - 1 ? 'o' : d < 1.2 ? 'w' : d < R * .38 ? 'r' : (Math.round(d) % 3 === 0 ? 'g' : 'k'); } rows.push(s); } return rows; }
function slice(n) { const rows = []; for (let y = 0; y < n; y++) { let s = ''; const hw = (n - y) * .55; for (let x = -Math.ceil(n * .55); x <= Math.ceil(n * .55); x++) { const a = Math.abs(x); s += a > hw ? '.' : y < 2 ? 'c' : a > hw - 1 ? 'o' : ((x * 7 + y * 5) % 11 === 0 || (x === 1 && y === 4) || (x === -2 && y === 6) || (x === 0 && y === 9)) ? 'p' : 'y'; } rows.push(s); } return rows; }
const NOTE = ['...nnnn', '...n..n', '...n..n', '...n..n', '.nnn.nn', 'nnnn.nn', '.nn....'];
const HEART = ['.hh.hh.', 'hhhhhhh', 'hhhhhhh', '.hhhhh.', '..hhh..', '...h...'];
const DRESS = ['..ss..', '.ssss.', '..ss..', '.dddd.', '.dddd.', 'dddddd', 'dddddd', '..kk..'];

/* posters pasted on a wall area */
function posters(side, a0, a1, pl, z0, z1, seed, cols) {
  const r = rng(seed), C5 = cols || ['#f25c54', '#ffd166', '#06d6a0', '#4d96ff', '#f15bb5', '#fff3d6'];
  for (let a = a0; a + .5 <= a1; a += .62) for (let z = z0; z + .6 <= z1; z += .78) {
    if (r() < .22) continue; const c = pick(r, C5), dz = (r() - .5) * .08;
    Q(side, a, a + .5, pl, z + dz, z + .66 + dz, c); Q(side, a + .08, a + .42, pl, z + .3 + dz, z + .56 + dz, pick(r, C5)); L(side, a + .08, z + .14 + dz, a + .4, z + .14 + dz, pl, '#2a2540'); L(side, a, z + dz, a + .5, z + dz, pl, dk(c, .5));
  }
}
/* grid display of small colourful goods behind a shop window */
function goods(x0, x1, y, z0, z1, seed, cols, st = .32) { const r = rng(seed); for (let x = x0 + .1; x + .22 <= x1; x += st) for (let z = z0 + .08; z + .22 <= z1; z += st) if (r() < .8) { const c = pick(r, cols); qy(x, x + .22, y, z, z + .22, c); glow(() => qy(x, x + .22, y, z, z + .22, lt(c, .25))); } }

const STUDIO_COLS = ['#e86a5c', '#3fa7a0', '#e9b44c', '#8d7fd1', '#5fa8e0', '#ef8fb0', '#7cc27a'];

export default [
  /* ------------------------------------------------------------ mural studio */
  {
    id: 'bld.arts.studio', kind: 'building', tags: ['arts', 'studio', 'mural', 'shop'],
    size: p => [p.w || 7, p.d || 6, (p.floors || 2) * 2 + .3], vb: VB(p => [p.w || 7, p.d || 6, (p.floors || 2) * 2 + .3], 1, .5, 2.6),
    door: { side: 'y', at: 1.2 }, ...LIGHT(1.2, 6, 3),
    variants: [
      { w: 7, d: 6, floors: 2, seed: 3, wall: '#e86a5c', mural: 'sun', name: 'CLAY & CO' },
      { w: 8, d: 7, floors: 3, seed: 11, wall: '#3fa7a0', mural: 'skyline', name: 'STUDIO 11' },
      { w: 6, d: 6, floors: 2, seed: 7, wall: '#e9b44c', mural: 'waves', name: 'PRINT LAB' },
      { w: 9, d: 6, floors: 3, seed: 21, wall: '#8d7fd1', mural: 'flower', muralSide: 'y', name: 'BLOOM ARTS' },
      { w: 7, d: 8, floors: 3, seed: 5, wall: '#f1e9d8', mural: 'geo', name: 'ATELIER' },
      { w: 8, d: 6, floors: 2, seed: 16, wall: '#5fa8e0', mural: 'rainbow', name: 'KIDS ART' },
      { w: 6, d: 7, floors: 3, seed: 29, wall: '#ef8fb0', mural: 'memphis', name: 'ZINE HAUS' },
      { w: 10, d: 6, floors: 2, seed: 40, wall: '#7cc27a', mural: 'hills', muralSide: 'both', mural2: 'bubbles', name: 'GLASSWORKS' },
    ],
    draw(p) {
      const w = p.w || 7, d = p.d || 6, fl = p.floors || 2, H = fl * 2, r = rng(p.seed || 1), wall = p.wall || pick(r, STUDIO_COLS), ms = p.muralSide || 'x';
      const kind = p.mural || pick(r, MURAL_KINDS), trim = lt(wall, .55), dc = pick(r, ['#2f5d8a', '#c8423a', '#2f6f5f', '#6b4a8a', '#d98a2b']);
      box(0, 0, 0, w, d, H, wall, wallPat('stucco', wall));
      qy(0, w, d, 0, .35, dk(wall, .45)); qx(w, 0, d, 0, .35, dk(wall, .58));
      // +x wall
      if (ms !== 'y') mural('x', kind, .3, d - .3, w, .5, H - .25, p.seed || 1);
      else { for (let f = 0; f < fl; f++) wins('x', .5, d - .5, w, f * 2 + .6, f * 2 + 1.6, { ww: 1, gap: .8, r, mullion: 'cross', sill: true, trim }); }
      // +y wall upper floors
      if (ms === 'x') for (let f = 1; f < fl; f++) wins('y', .4, w - .4, d, f * 2 + .6, f * 2 + 1.65, { ww: 1.3, gap: .5, r, p: .65, mullion: 'cross', sill: true, trim, each: () => r() < .3 ? { fbox: true } : null });
      else mural('y', ms === 'both' ? (p.mural2 || 'bubbles') : kind, .3, w - .3, d, 2.55, H - .25, (p.seed || 1) + (ms === 'both' ? 2 : 0));
      // ground floor: door + big studio window with art on show
      door('y', 1.2, d, { c: dc, transom: false });
      lamp('y', 1.95, d, 1.75);
      const x0 = 2.3, x1 = w - .5;
      qy(x0 - .1, x1 + .1, d, .35, 1.8, trim);
      wins('y', x0, x1, d, .5, 1.7, { ww: (x1 - x0) / Math.max(1, Math.round((x1 - x0) / 1.3)) - .001, gap: 0, n: Math.max(1, Math.round((x1 - x0) / 1.3)), on: true, mullion: 'h' });
      const P = muralPal((p.seed || 1) + 1);
      for (let x = x0 + .3, i = 0; x + .5 < x1; x += 1.3, i++) { const c = P[i % 5]; qy(x, x + .55, d, .7, 1.25, '#f6efe0'); qy(x + .08, x + .47, d, .78, 1.17, c); qy(x + .18, x + .37, d, .86, 1.0, P[(i + 2) % 5]); lw([x + .27, d, .5], [x + .27, d, .7], '#6b4a2f'); }
      sign('y', p.name || 'STUDIO', x0, x1, d + .02, 1.84, 2.3, '#2a2540', trim, { lit: true });
      // paint pots by the door
      box(.25, d, 0, .25, .22, .28, P[0], { ol: false }); box(.5, d + .05, 0, .2, .2, .2, P[3], { ol: false });
      cornice(w, d, H - .2, trim, .2, .1);
      const f = flatRoof(0, 0, H, w, d, wall, { roof: '#8a8580', cap: trim });
      clutter(r, f, ['sky', 'sky', 'ac', 'garden', 'chairs', 'vent', 'solar'], 2 + Math.floor(w * d / 16));
    },
  },
  /* ------------------------------------------------------------ white-cube gallery */
  {
    id: 'bld.arts.gallery', kind: 'building', tags: ['arts', 'gallery', 'shop'],
    size: p => [p.w || 9, p.d || 7, 5], vb: VB(p => [p.w || 9, p.d || 7, 5], 1.2, .6, 2.2),
    door: { side: 'y', at: 1.4 }, ...LIGHT(1.4, 7, 4),
    variants: [{ w: 9, d: 7, seed: 2, accent: '#e2574c', name: 'GALLERY' }, { w: 11, d: 8, seed: 8, accent: '#2f6fd0', name: 'KUNSTHAUS' }, { w: 8, d: 6, seed: 14, accent: '#e9b44c', name: 'SALT ARTS' }],
    draw(p) {
      const w = p.w || 9, d = p.d || 7, H = 4.7, r = rng(p.seed || 1), ac = p.accent || '#e2574c', wall = '#f3f0ea', blk = '#2a2a33';
      box(0, 0, 0, w, d, H, wall);
      qy(0, w, d, 0, .25, '#c9c5bc'); qx(w, 0, d, 0, .25, '#a9a59c');
      // side wall: one slot window + tall banner
      win('x', d - 3.2, d - .6, w, .5, 3.2, { on: true, frame: blk, mullion: 'v', glowc: ['#fff1c8', '#ffe2a0'] });
      banner('x', .8, w + .02, 1.2, 4.2, 1.1, ac, { c2: '#fff8e8' });
      txt('x', 'NOW', 1.72, w + .03, 3.6, '#fff8e8'); txt('x', 'ON', 1.6, w + .03, 2.5, '#fff8e8');
      // glazed front
      const x0 = 2.4, x1 = w - .45, n = Math.max(2, Math.round((x1 - x0) / 1.4));
      wins('y', x0, x1, d, .3, 3.2, { ww: (x1 - x0) / n - .001, gap: 0, n, on: true, frame: blk, glowc: ['#fff1c8', '#ffe2a0'] });
      lw([x0, d, 2.2], [x1, d, 2.2], blk);
      // art seen through the glass
      const P = muralPal(p.seed || 1);
      for (let i = 0; i < n; i++) { const x = x0 + (i + .25) * (x1 - x0) / n, c = P[i % 5], zz = .9 + (i % 2) * .15; const d1 = () => { qy(x, x + .7, d, zz, zz + .9, '#fbf8f0'); qy(x + .08, x + .62, d, zz + .08, zz + .82, c); qy(x + .2, x + .45, d, zz + .25, zz + .6, P[(i + 3) % 5]); }; d1(); glow(d1); }
      door('y', 1.4, d, { c: blk, full: true, h: 1.9, frame: blk, w: 1.0 });
      canopy(.6, 2.2, d, 2.1, .7, blk, { th: .1 });
      sign('y', p.name || 'GALLERY', .5, w - .5, d + .01, 3.5, 4.4, null, blk, { s: 2 });
      qy(.5, .5 + txtW(p.name || 'GALLERY', 2) * 0 + .5, d, 3.42, 3.5, ac); qy(.5, w - .5, d, 3.38, 3.44, ac);
      const f = flatRoof(0, 0, H, w, d, wall, { roof: '#d9d5cc', cap: '#ffffff' });
      // long skylight strips + a rooftop sculpture
      for (let y = f.y0 + .2; y + 1 < f.y1 - 1.6; y += 1.6) { box(f.x0 + .2, y, H, Math.min(w - 4, 5), 1, .25, '#e8e4dc'); qz(f.x0 + .3, f.x0 + Math.min(w - 4, 5) + .1, y + .1, y + .9, H + .26, '#9fcbe0', '#b8dcec'); glow(() => qz(f.x0 + .3, f.x0 + Math.min(w - 4, 5) + .1, y + .1, y + .9, H + .26, '#fff1c8', '#ffe2a0')); }
      const sx = w - 1.9, sy = d - 2.2; box(sx, sy, H, 1, 1, .3, '#c9c5bc');
      box(sx + .35, sy + .35, H + .3, .3, .3, 1.3, ac, { ol: false }); ball(sx + .5, sy + .5, H + 1.9, .42, r() < .5 ? '#f2c230' : '#2f6fd0'); box(sx + .1, sy + .4, H + 1.0, .8, .2, .2, blk, { ol: false });
    },
  },
  /* ------------------------------------------------------------ record shop */
  {
    id: 'bld.arts.records', kind: 'building', tags: ['arts', 'shop', 'records', 'music'],
    size: p => [p.w || 5, p.d || 6, (p.floors || 2) * 2 + .3], vb: VB(p => [p.w || 5, p.d || 6, (p.floors || 2) * 2 + .3], 1.2, .5, 3.2),
    door: { side: 'y', at: 1.1 }, ...LIGHT(1.1, 6, 3),
    variants: [{ w: 5, d: 6, floors: 2, seed: 4, wall: '#2f6f73', name: 'SPIN CITY' }, { w: 6, d: 6, floors: 3, seed: 12, wall: '#7a3f6b', name: 'WAX & WANE' }, { w: 5, d: 7, floors: 2, seed: 31, wall: '#c9662f', name: 'B-SIDE' }],
    draw(p) {
      const w = p.w || 5, d = p.d || 6, fl = p.floors || 2, H = fl * 2, r = rng(p.seed || 1), wall = p.wall || '#2f6f73', trim = '#f6e7c1', acc = '#f2c230';
      box(0, 0, 0, w, d, H, wall, wallPat('brick', wall));
      // side wall: gig posters low, windows above
      posters('x', .4, d - .5, w + .01, .35, 1.9, (p.seed || 1) * 3);
      for (let f = 1; f < fl; f++) wins('x', .5, d - .5, w, f * 2 + .5, f * 2 + 1.6, { ww: .9, gap: .9, r, mullion: 'cross', sill: true, trim });
      // front
      for (let f = 1; f < fl; f++) for (const x of [.3, w - 1.1]) win('y', x, x + .8, d, f * 2 + .5, f * 2 + 1.6, { on: r() < .6, mullion: 'cross', sill: true, trim });
      const V = vinyl(11), vw = iconW(V); // big record between the first-floor windows
      icon('y', V, w / 2 - vw / 2, d + .02, 2 + 1.8, { o: '#15131f', k: '#2a2636', g: '#4a4560', r: acc, w: '#fff8e8' }); lit(() => icon('y', V, w / 2 - vw / 2, d + .02, 2 + 1.8, { r: acc, w: '#fff8e8', o: '#ff8fb0' }));
      door('y', 1.1, d, { c: acc, frame: '#2a2540' });
      qy(1.9, w - .3, d, .3, 1.72, '#2a2540'); win('y', 2.0, w - .4, d, .5, 1.62, { on: true, mullion: 'v' });
      goods(2.0, w - .4, d, .55, 1.2, p.seed || 1, ['#f25c54', '#ffd166', '#06d6a0', '#4d96ff', '#f15bb5', '#2a2540']);
      awning(.3, w - .3, d, 1.85, { c: '#2a2540', c2: acc, dep: .6, drop: .3, stripe: .4 });
      const f = flatRoof(0, 0, H, w, d, wall, { cap: trim });
      // roof sign with name
      const nm = p.name || 'RECORDS', sw = Math.min(w - .6, txtW(nm) + .6);
      lw([.6, d - .3, H + .3], [.6, d - .3, H + 1.0], '#3d3a4a'); lw([.3 + sw, d - .3, H + .3], [.3 + sw, d - .3, H + 1.0], '#3d3a4a');
      sign('y', nm, .3, .3 + sw, d - .3, H + .9, H + 1.6, '#15131f', acc, { lit: true });
      bulbs('y', .35, .25 + sw, d - .3, H + 1.62, { step: .3, cols: ['#ff8fb0', '#fff2a8'] });
      clutter(r, { ...f, y1: f.y1 - .8 }, ['ac', 'vent', 'dish', 'pipe', 'sky', 'ac2'], 4);
    },
  },
  /* ------------------------------------------------------------ tattoo / vintage shop (false-front) */
  {
    id: 'bld.arts.vintage', kind: 'building', tags: ['arts', 'shop', 'vintage', 'tattoo'],
    size: p => [p.w || 5, p.d || 6, (p.floors || 2) * 2 + 1.4], vb: VB(p => [p.w || 5, p.d || 6, (p.floors || 2) * 2 + 1.4], 1.2, .5, 1),
    door: { side: 'y', at: 1.1 }, ...LIGHT(1.1, 6, 3),
    variants: [{ w: 5, d: 6, floors: 2, seed: 6, style: 'tattoo', name: 'INK & IVY' }, { w: 6, d: 6, floors: 2, seed: 18, style: 'vintage', name: 'RETRO RAGS' }, { w: 5, d: 7, floors: 3, seed: 27, style: 'vintage', wall: '#7fb6a8', name: 'MOTH & MOON' }, { w: 6, d: 5, floors: 2, seed: 33, style: 'tattoo', wall: '#4a2f4f', name: 'BLACK CAT INK' }],
    draw(p) {
      const w = p.w || 5, d = p.d || 6, fl = p.floors || 2, H = fl * 2, r = rng(p.seed || 1), tat = (p.style || 'vintage') === 'tattoo';
      const wall = p.wall || (tat ? '#34323f' : '#e2a84a'), trim = tat ? '#e8e2d4' : '#fff3d6', nc = tat ? '#ff4f8b' : '#c8423a';
      box(0, 0, 0, w, d, H, wall, wallPat(tat ? 'brick' : 'siding', wall));
      for (let f = 0; f < fl; f++) wins('x', .6, d - .6, w, f * 2 + .55, f * 2 + 1.55, { ww: .8, gap: 1.1, r, mullion: tat ? 'h' : 'cross', sill: true, trim, blind: tat ? .5 : 0 });
      // upper front
      for (let f = 1; f < fl; f++) {
        if (tat) wins('y', .3, w - .3, d, f * 2 + .5, f * 2 + 1.5, { ww: 1, n: 2, r, p: .7, mullion: 'h', trim, blind: .4, glowc: ['#ff9fc0', '#f47aa8'] });
        else wins('y', .3, w - .3, d, f * 2 + .45, f * 2 + 1.35, { ww: 1, n: 2, r, p: .7, arch: true, trim, mullion: 'v', curtain: pick(r, ['#c8423a', '#3f8fb0', '#8d7fd1']) });
      }
      // ground
      door('y', 1.1, d, { c: tat ? '#b3262e' : '#3f7d6f', frame: trim });
      qy(1.9, w - .3, d, .3, 1.72, trim); win('y', 2.0, w - .4, d, .5, 1.62, { on: true, glowc: tat ? ['#ffb0c8', '#ff8fb0'] : undefined });
      if (tat) { // flash sheets in the window + neon
        goods(2.0, w - .4, d, .55, 1.3, p.seed || 1, ['#f6efe0', '#f6efe0', '#e8dcc0'], .34);
        neon('y', [[2.2, 1.5], [w - .6, 1.5]], d + .01, nc);
      } else { // mannequins
        const pal2 = { s: '#f0c8a0', d: pick(r, ['#c8423a', '#3f8fb0', '#8d7fd1']), k: '#3a3350' };
        for (let x = 2.2, i = 0; x + .4 < w - .4; x += .75, i++) icon('y', DRESS, x, d + .01, 1.25, { ...pal2, d: ['#c8423a', '#3f8fb0', '#f2c230', '#8d7fd1'][i % 4] });
        awning(.3, w - .3, d, 1.85, { c: nc, c2: '#fff3d6', dep: .65 });
      }
      // stepped false front
      box(0, d - .35, H, w, .35, .7, wall, { l: tat ? PAT.brick(dk(wall, .18)) : PAT.siding(dk(wall, .18)) });
      box(w * .18, d - .35, H + .7, w * .64, .35, .7, wall, { l: tat ? PAT.brick(dk(wall, .18)) : PAT.siding(dk(wall, .18)) });
      const f = flatRoof(0, 0, H, w, d - .35, wall, { cap: trim });
      clutter(r, f, ['ac', 'vent', 'pipe', 'sky'], 2);
      box(0, d - .35, H, w, .35, .7, wall, { l: tat ? PAT.brick(dk(wall, .18)) : PAT.siding(dk(wall, .18)) });
      box(w * .18, d - .35, H + .7, w * .64, .35, .7, wall, { l: tat ? PAT.brick(dk(wall, .18)) : PAT.siding(dk(wall, .18)) });
      snowTop(w * .18, w * .82, d - .35, d, H + 1.401, .05);
      const nm = p.name || (tat ? 'TATTOO' : 'VINTAGE');
      if (tat) { sign('y', nm, .2, w - .2, d + .01, H + .1, H + .6, '#1c1a26', nc, { lit: true }); sign('y', 'TATTOO', w * .18 + .1, w * .82 - .1, d + .01, H + .78, H + 1.28, null, '#7df9ff', { lit: true }); icon('y', HEART, .35, d + .02, H - .35, { h: nc }); lit(() => icon('y', HEART, .35, d + .02, H - .35, { h: nc })); }
      else { sign('y', nm, .2, w - .2, d + .01, H + .1, H + .6, nc, '#fff6e0', { lit: true }); sign('y', 'VINTAGE', w * .18 + .1, w * .82 - .1, d + .01, H + .78, H + 1.28, null, dk(wall, .6)); }
    },
  },
  /* ------------------------------------------------------------ artist lofts */
  {
    id: 'bld.arts.lofts', kind: 'building', tags: ['arts', 'residential', 'lofts', 'apartment'],
    size: p => [p.w || 9, p.d || 7, (p.floors || 3) * 2 + .3], vb: VB(p => [p.w || 9, p.d || 7, (p.floors || 3) * 2 + .3], 1, 1, 2.8),
    door: { side: 'y', at: 1.2 }, ...LIGHT(1.2, 7, 3),
    variants: [{ w: 9, d: 7, floors: 3, seed: 5, wall: '#a8553f' }, { w: 11, d: 8, floors: 4, seed: 13, wall: '#8a5a48', ghost: 'MAPLE MILLS' }, { w: 8, d: 7, floors: 4, seed: 22, wall: '#c2a78a', ghost: 'BAY THREAD CO' }, { w: 12, d: 7, floors: 3, seed: 37, wall: '#7d6a78' }],
    draw(p) {
      const w = p.w || 9, d = p.d || 7, fl = p.floors || 3, H = fl * 2, r = rng(p.seed || 1), wall = p.wall || '#a8553f', trim = '#2f3440', stone = '#d9cfbb';
      box(0, 0, 0, w, d, H, wall, wallPat('brick', wall));
      qy(0, w, d, 0, .4, dk(stone, .25)); qx(w, 0, d, 0, .4, dk(stone, .42));
      const g = ['#5f8fa8', '#7fa8bd'], go = { ww: 1.5, gap: .5, r, p: .6, mullion: 'cross', frame: trim, glass: g, sill: true, sillc: stone };
      for (let f = 0; f < fl; f++) {
        if (f > 0) wins('y', .4, w - .4, d, f * 2 + .35, f * 2 + 1.7, { ...go, each: () => r() < .25 ? { curtain: pick(r, ['#e86a5c', '#e9b44c', '#3fa7a0', '#8d7fd1']) } : (r() < .2 ? { fbox: true } : null) });
        wins('x', 2.2, d - .4, w, f * 2 + .35, f * 2 + 1.7, { ...go, ww: 1.3 });
        if (f > 0) { lw([0, d, f * 2], [w, d, f * 2], dk(wall, .5)); lw([w, 0, f * 2], [w, d, f * 2], dk(wall, .6)); }
      }
      // extra mullions for the industrial look
      // ghost sign on the side wall top
      if (p.ghost) txt('x', p.ghost, d - .5, w + .01, H - .12, lt(wall, .5));
      // fire escape on +x near the back
      for (let f = 1; f < fl; f++) {
        const z = f * 2 + .15; box(w, .5, z, .55, 1.5, .08, '#3d3a4a', { ol: false });
        for (let y = .5; y <= 2.01; y += .25) lw([w + .55, y, z + .08], [w + .55, y, z + .7], '#3d3a4a'); lw([w + .55, .5, z + .7], [w + .55, 2, z + .7], '#55515f');
        lw([w + .3, .6, z - 1.9], [w + .3, 1.8, z], '#55515f'); lw([w + .5, .6, z - 1.9], [w + .5, 1.8, z], '#3d3a4a');
        win('x', .7, 1.6, w, f * 2 + .35, f * 2 + 1.7, { on: r() < .5, frame: trim, glass: g });
      }
      // ground: entrance + loading shutter + gallery window
      door('y', 1.2, d, { c: '#2f5d8a', frame: stone, transom: true });
      lamp('y', 2.0, d, 1.8);
      shutter('y', 2.6, Math.min(w - 2.6, 5), d, .0, 1.75, '#6f8f7a', { wins: true, r, p: .5 });
      if (w >= 8.5) wins('y', Math.min(w - 2.6, 5) + .4, w - .4, d, .5, 1.7, { ...go, p: .8 });
      txt('y', 'LOFTS', .5, d + .01, 2.42, lt(wall, .55));
      cornice(w, d, H - .22, stone, .22, .12);
      const f = flatRoof(0, 0, H, w, d, wall, { cap: stone });
      // sawtooth skylights
      const n = Math.max(2, Math.floor((d - 2.4) / 1.5)), x0 = f.x0 + .2, x1 = Math.min(f.x1 - 2, x0 + 5);
      for (let i = 0; i < n; i++) {
        const y = f.y0 + .1 + i * 1.5;
        fq([[x0, y, H], [x1, y, H], [x1, y + 1.1, H + .9], [x0, y + 1.1, H + .9]], winter() ? SNOW : '#77706c');
        fq([[x1, y, H], [x1, y + 1.1, H], [x1, y + 1.1, H + .9]], '#5d5753');
        qy(x0, x1, y + 1.1, H, H + .9, '#8fc4dc', '#a8d4e6'); const on = r() < .7; if (on) glow(() => qy(x0, x1, y + 1.1, H, H + .9, '#ffe2a0', '#f4c870'));
        for (let x = x0; x <= x1 + .01; x += (x1 - x0) / 4) lw([x, y + 1.1, H], [x, y + 1.1, H + .9], '#3d3a4a'); lw([x0, y + 1.1, H + .9], [x1, y + 1.1, H + .9], '#3d3a4a'); lw([x0, y + 1.1, H], [x1, y + 1.1, H], '#3d3a4a');
      }
      ROOF.tank(f.x1 - 1.4, f.y0 + .2, H); ROOF.garden(f.x1 - 1.5, f.y1 - 2.4, H, r); ROOF.chairs(f.x1 - 1.5, f.y1 - 1.2, H);
    },
  },
  /* ------------------------------------------------------------ pizza place */
  {
    id: 'bld.arts.pizza', kind: 'building', tags: ['arts', 'pizza', 'restaurant', 'food', 'enterable'],
    size: p => [p.w || 7, p.d || 6, (p.floors || 2) * 2 + .3], vb: VB(p => [p.w || 7, p.d || 6, (p.floors || 2) * 2 + .3], 1.3, .5, 3.4),
    door: { side: 'y', at: 1.2 }, ...LIGHT(1.2, 6, 4.5),
    variants: [{ w: 7, d: 6, floors: 2, seed: 9, name: 'SLICE OF HEAVEN' }, { w: 8, d: 7, floors: 3, seed: 19, name: 'SLICE OF HEAVEN', wall: '#f1e2c4' }, { w: 7, d: 6, floors: 1, seed: 3, name: 'SLICE OF HEAVEN' }],
    draw(p) {
      const w = p.w || 7, d = p.d || 6, fl = p.floors || 2, H = fl * 2, r = rng(p.seed || 1), wall = p.wall || '#f4e6c8', brick = '#b5553f', red = '#d2392f', grn = '#2f8a57', cream = '#fff6e0', nm = p.name || 'SLICE OF HEAVEN';
      box(0, 0, 0, w, d, H, wall, wallPat('stucco', wall));
      qy(0, w, d, 0, 2.3, PAT.brick(dk(brick, .18))); qx(w, 0, d, 0, 2.3, PAT.brick(dk(brick, .36)));
      band(w, d, 2.3, cream, .14);
      for (let f = 1; f < fl; f++) {
        wins('y', .4, w - .4, d, f * 2 + .6, f * 2 + 1.6, { ww: .9, gap: .8, r, mullion: 'cross', sill: true, trim: cream, shutter: grn, each: () => r() < .4 ? { fbox: true } : null });
        wins('x', .5, d - .5, w, f * 2 + .6, f * 2 + 1.6, { ww: .9, gap: 1, r, mullion: 'cross', sill: true, trim: cream, shutter: dk(grn, .2) });
      }
      // side: oven wall with arched glow + menu board
      win('x', d - 2.4, d - .8, w, .5, 1.5, { on: true, mullion: 'cross', trim: cream });
      qx(w + .01, 1.0, 2.2, .5, 1.7, '#2a2a33'); for (let k = 0; k < 5; k++) lw([w + .02, 1.15, 1.5 - k * .2], [w + .02, 2.05 - (k % 2) * .3, 1.5 - k * .2], k ? '#e8e2d4' : '#ffd166');
      // front: door, wide window with chequered bulkhead, oven glow
      door('y', 1.2, d, { c: grn, frame: cream, transom: true });
      const x0 = 2.2, x1 = w - .4;
      qy(x0 - .1, x1 + .1, d, 0, 1.8, cream); qy(x0, x1, d, .05, .5, (u, v) => ((u >> 2) + (v >> 2)) & 1 ? red : cream);
      wins('y', x0, x1, d, .55, 1.7, { ww: (x1 - x0) / 3 - .001, gap: 0, n: 3, on: true, glowc: ['#ffd27a', '#ffb347'] });
      // pizza on display + oven fire
      const pz = PWs => 0; for (let i = 0; i < 3; i++) { const x = x0 + (i + .5) * (x1 - x0) / 3; qy(x - .35, x + .35, d, .58, .7, '#e8d0a0'); qy(x - .28, x + .28, d, .7, .76, i % 2 ? '#e9b44c' : '#d2392f'); }
      glow(() => { qy(x1 - .9, x1 - .2, d, .9, 1.4, '#ff8a3a', '#ffb347'); });
      awning(.3, w - .3, d, 1.9, { c: red, c2: cream, dep: .8, drop: .4, stripe: .5 });
      for (let x = .3, i = 0; x < w - .31; x += .5, i++) if (i % 3 === 2) qy(x, Math.min(w - .3, x + .5), d + .8, 1.74, 1.9, grn);
      // roof
      const f = flatRoof(0, 0, H, w, d, fl > 1 ? wall : brick, { cap: cream });
      box(f.x0, f.y0, H, .9, .9, 1.6, brick, { l: PAT.brick(dk(brick, .18)), r: PAT.brick(dk(brick, .36)) }); box(f.x0 - .05, f.y0 - .05, H + 1.6, 1, 1, .15, '#6f625c'); snowTop(f.x0, f.x0 + .9, f.y0, f.y0 + .9, H + 1.76, .1);
      clutter(r, { ...f, x0: f.x0 + 1.4, y1: f.y1 - 1 }, ['ac', 'vent', 'garden'], 2);
      // big lit roof sign: slice + name
      const S = slice(15), sw = iconW(S, 1), tw = txtW(nm) + .5, bx0 = Math.max(.2, (w - (tw + sw + .5)) / 2), ys = d - .25;
      for (const x of [bx0 + .3, bx0 + sw + tw]) { lw([x, ys, H + .3], [x, ys, H + .9], '#3d3a4a'); lw([x, ys, H + .9], [x - .25, ys - .5, H + .3], '#3d3a4a'); }
      lit(() => { qy(bx0, bx0 + sw + .3, ys, H + .6, H + 1.9, '#2a2233'); icon('y', S, bx0 + .15, ys + .01, H + 1.72, { c: '#e9b06a', o: '#f2c230', y: '#ffd95e', p: '#d2392f' }); });
      sign('y', nm, bx0 + sw + .3, bx0 + sw + .3 + tw, ys, H + .75, H + 1.35, red, '#fff6e0', { lit: true });
      bulbs('y', bx0 + sw + .4, bx0 + sw + .2 + tw, ys, H + 1.4, { step: .25 }); bulbs('y', bx0 + sw + .4, bx0 + sw + .2 + tw, ys, H + .68, { step: .25 });
    },
  },
  /* ------------------------------------------------------------ The Blue Heron music club */
  {
    id: 'bld.arts.blueheron', kind: 'building', tags: ['arts', 'bar', 'club', 'music', 'nightlife', 'enterable'],
    size: p => [p.w || 8, p.d || 7, (p.floors || 2) * 2 + .3], vb: VB(p => [p.w || 8, p.d || 7, (p.floors || 2) * 2 + .3], 1.3, .5, 3.4),
    door: { side: 'y', at: 1.3 }, ...LIGHT(1.3, 7, 4.5),
    variants: [{ w: 8, d: 7, floors: 2, seed: 7, name: 'THE BLUE HERON' }, { w: 9, d: 8, floors: 2, seed: 23, name: 'THE BLUE HERON', wall: '#3a2f55' }, { w: 8, d: 6, floors: 3, seed: 41, name: 'THE BLUE HERON', wall: '#243a4a' }],
    draw(p) {
      const w = p.w || 8, d = p.d || 7, fl = p.floors || 2, H = fl * 2, r = rng(p.seed || 1), wall = p.wall || '#34406a', cy = '#5ff2ff', pk = '#ff5fa8', nm = p.name || 'THE BLUE HERON';
      box(0, 0, 0, w, d, H, wall, wallPat('brick', wall));
      qy(0, w, d, 0, .4, '#1c1f33'); qx(w, 0, d, 0, .4, '#15172a');
      // side wall: stage door, poster wall, glass-block windows
      door('x', 1.2, w, { c: '#3d3a4a', glass: false, frame: '#1c1f33' }); lamp('x', 1.9, w, 1.8, '#ff9f7a');
      posters('x', 2.4, d - .5, w + .01, .5, 1.9, (p.seed || 1) * 5, ['#ff5fa8', '#5ff2ff', '#ffd166', '#f6efe0', '#9b5de5']);
      const gb = { glass: ['#4a6f9a', '#5f86b4'], glowc: ['#7f9bff', '#b06bff'], frame: '#1c1f33', mullion: 'cross' };
      for (let f = 1; f < fl; f++) { wins('x', .6, d - .6, w, f * 2 + .6, f * 2 + 1.5, { ...gb, ww: 1.1, gap: 1, r, p: .8 }); wins('y', 3.6, w - .4, d, f * 2 + .6, f * 2 + 1.5, { ...gb, ww: 1.0, gap: .6, r, p: .85, glowc: ['#ff8fc8', '#c77bff'] }); }
      // front ground: door under a little canopy, long window glowing purple, neon stripe
      door('y', 1.3, d, { c: '#16182b', double: true, w: 1.4, frame: '#0f1020', glowc: ['#ffd98a', '#ff9fd0'], handle: cy, full: true }); neon('y', [[.5, 0], [.5, 1.74], [2.1, 1.74], [2.1, 0]], d + .01, cy);
      box(.35, d, 1.85, 1.9, .8, .14, '#16182b'); bulbs('y', .4, 2.2, d + .8, 1.84, { step: .2, cols: [cy, pk] });
      wins('y', 3.0, w - .5, d, .7, 1.6, { ww: 1.0, gap: .25, on: true, ...gb, glowc: ['#ff8fc8', '#c77bff'] });
      neon('y', [[2.9, 1.78], [w - .4, 1.78]], d + .01, pk); neon('y', [[2.9, .55], [w - .4, .55]], d + .01, cy);
      icon('y', NOTE, w - 1.3, d + .01, 2.45 - .0, { n: pk }); lit(() => icon('y', NOTE, w - 1.3, d + .01, 2.45, { n: pk }));
      // name sign
      sign('y', nm, 2.9, 2.9 + txtW(nm) + .5, d + .02, 1.9, 2.45, '#12142a', cy, { lit: true });
      // tall heron blade sign over the entrance
      cornice(w, d, H - .18, '#1c1f33', .18, .08);
      const f = flatRoof(0, 0, H, w, d, wall, { cap: '#4a5278', roof: '#55526a' });
      clutter(r, { ...f, x0: f.x0 + 1, y1: f.y1 - 1.2 }, ['ac2', 'ac', 'vent', 'pipe', 'dish'], 3);
      const bx = .35, bw = 2.3, bz = H - .7;
      box(bx, d, bz, bw, .3, H + 2.6 - bz, '#12142a');
      lit(() => { icon('y', HERON, bx + (bw - iconW(HERON, 2)) / 2, d + .31, H + 2.35, { b: cy, c: '#2fa8e0', w: '#12142a', y: '#ffd166', p: pk }, 2); });
      neon('y', [[bx + .12, bz + .12], [bx + bw - .12, bz + .12], [bx + bw - .12, H + 2.48], [bx + .12, H + 2.48], [bx + .12, bz + .12]], d + .31, pk);
    },
  },
];
