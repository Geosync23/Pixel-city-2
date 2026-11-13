// Arts Quarter venues: The Orpheum cinema and the Playhouse theatre.
import { box, qy, qx, qz, fq, lw, glow, lit, gable, PAT, rng, dk, lt, mix, PW, px, C } from '../../engine/raster.js';
import { Q, L, wallPat, txt, txtW, sign, icon, iconW, flatRoof, snowTop, gableSnow, win, wins, door, canopy, bulbs, bulbsV, neon, lamp, banner, stairs, pediment, ROOF, clutter, VB, band, cornice, pick, winter, SNOW } from './_lib.js';

/* a lit poster case on a wall */
function poster(side, a, pl, z, seed, wd = .9, ht = 1.3) {
  const r = rng(seed), bg = pick(r, ['#2b3a67', '#7a2f4f', '#1f5f5a', '#c8572f', '#3a2f55']), fg = pick(r, ['#ffd166', '#ff8fb0', '#7df9ff', '#fff3d6']);
  Q(side, a - .08, a + wd + .08, pl, z - .08, z + ht + .08, '#d9b45a');
  const d1 = () => { Q(side, a, a + wd, pl, z, z + ht, bg); Q(side, a + .15, a + wd - .15, pl, z + ht * .45, z + ht - .15, fg); Q(side, a + .28, a + wd - .28, pl, z + ht * .55, z + ht - .3, pick(r, ['#e2574c', '#2b3a67', '#f6efe0'])); L(side, a + .12, z + .3, a + wd - .12, z + .3, pl, '#f6efe0'); L(side, a + .2, z + .16, a + wd - .2, z + .16, pl, fg); };
  lit(d1);
}
const MASKS = [
  '..hhhhh.....ddddd..', '.hhhhhhh...ddddddd.', 'hhkhhhkhh.ddkdddkdd', 'hhhhhhhhh.ddddddddd', 'hkhhhhhkh.dddkkkddd', 'hhkkkkkhh.ddkdddkdd', '.hhkkkhh...ddddddd.', '..hhhhh.....ddddd..'];

export default [
  /* ------------------------------------------------------------ The Orpheum cinema */
  {
    id: 'bld.arts.orpheum', kind: 'building', tags: ['arts', 'cinema', 'venue', 'landmark', 'enterable', 'nightlife'],
    size: p => [p.w || 10, p.d || 12, 7.3], vb: VB(p => [p.w || 10, p.d || 12, 7.3], 1.9, .6, 5),
    door: { side: 'y', at: 3.6 }, light: { x: 5, y: 13.6, z: 0, r: 6 }, lightFor: p => ({ x: 5, y: (p.d || 12) + 1.6, z: 0, r: 6 }),
    variants: [{ w: 10, d: 12, seed: 3, name: 'THE ORPHEUM', film: 'MOON OVER MAPLE' }, { w: 12, d: 12, seed: 17, name: 'THE ORPHEUM', film: 'HARBOR LIGHTS 2', wall: '#e6b8a0', accent: '#7a3f8a' }, { w: 10, d: 10, seed: 28, name: 'THE ORPHEUM', film: 'CATS IN SPACE', wall: '#d9e0c4', accent: '#c8423a' }],
    draw(p) {
      const w = p.w || 10, d = p.d || 12, r = rng(p.seed || 1), wall = p.wall || '#ecd2a4', acc = p.accent || '#22808a', gold = '#ffd24a', red = '#d2392f', cream = '#fff6dc';
      const nm = p.name || 'THE ORPHEUM', short = nm.replace(/^THE /i, ''), fy = d - 3, cx = 5, HA = 6, HF = 7;
      // auditorium
      box(0, 0, 0, w, fy, HA, wall, wallPat('stucco', wall));
      qx(w, 0, fy, 0, .5, dk(acc, .45)); qx(w, 0, fy, 5.0, 5.3, dk(acc, .3)); qx(w, 0, fy, 5.4, 5.5, dk(gold, .3));
      for (let y = .9; y < fy - .2; y += 2.4) { qx(w, y - .14, y + .14, .5, 5.0, dk(lt(wall, .35), .3)); }
      door('x', 1.5, w, { c: dk(acc, .2), glass: false, frame: dk(wall, .5) }); lamp('x', 2.25, w, 1.8, '#ff9f7a');
      for (let y = 3.0, i = 0; y + 1 < fy; y += 2.4, i++) poster('x', y, w + .01, .7, (p.seed || 1) * 7 + i);
      const fa = flatRoof(0, 0, HA, w, fy + .3, wall, { cap: lt(wall, .4), roof: '#8a8078' });
      clutter(r, { ...fa, y1: fa.y1 - .5 }, ['ac2', 'ac', 'vent', 'hatch', 'pipe', 'dish'], 4);
      // front block
      box(0, fy, 0, w, 3, HF, wall, wallPat('stucco', wall));
      qy(0, w, d, 0, .5, dk(acc, .3)); qx(w, fy, d, 0, .5, dk(acc, .45));
      for (const [a, b] of [[.3, cx - 1.5], [cx + 1.5, w - .3]]) {
        for (let x = a + .25; x < b - .1; x += .5) lw([x, d, 3.5], [x, d, HF - .9], dk(wall, .3));
        if (b - a > 1.6) win('y', (a + b) / 2 - .35, (a + b) / 2 + .35, d, 3.8, 5.8, { on: true, mullion: 'h', frame: dk(acc, .3), glowc: ['#ffc27a', '#ff9f6a'], trim: lt(wall, .5) });
      }
      qy(0, w, d, HF - .8, HF - .5, dk(acc, .18)); qy(0, w, d, HF - .45, HF - .35, gold); qx(w, fy, d, HF - .8, HF - .5, dk(acc, .36)); qx(w, fy, d, HF - .45, HF - .35, dk(gold, .25));
      win('x', fy + 1.1, fy + 1.9, w, 3.8, 5.8, { on: true, mullion: 'h', frame: dk(acc, .3), glowc: ['#ffc27a', '#ff9f6a'], trim: dk(lt(wall, .5), .2) });
      poster('x', fy + 1.0, w + .01, .7, (p.seed || 1) * 3 + 50, 1, 1.4);
      // entrance: doors, ticket booth, poster cases
      qy(cx - 3.3, cx + 3.3, d, .0, 2.3, dk(acc, .35));
      door('y', cx - 1.4, d, { c: red, double: true, w: 1.5, frame: gold, full: true }); door('y', cx + 1.4, d, { c: red, double: true, w: 1.5, frame: gold, full: true });
      poster('y', cx - 3.15, d + .01, .6, (p.seed || 1) + 90, .8, 1.3); poster('y', cx + 2.35, d + .01, .6, (p.seed || 1) + 91, .8, 1.3);
      box(cx - .45, d, 0, .9, .5, 1.9, acc); win('y', cx - .3, cx + .3, d + .5, .9, 1.6, { on: true, frame: gold }); txt('y', 'TIX', cx - .33, d + .51, .75, gold);
      if (w > 10.5) for (let x = cx + 3.6, i = 0; x + .9 < w - .2; x += 1.2, i++) poster('y', x, d + .01, .7, (p.seed || 1) + 70 + i);
      glow(() => qy(cx - 3.3, cx + 3.3, d, 0, 2.3, '#ffd98a', 'glass'));
      const ff = flatRoof(0, fy, HF, w, 3, wall, { cap: lt(wall, .4), roof: '#8a8078' });
      // lower pylon on the facade
      box(cx - 1.1, d, 3.5, 2.2, .3, HF + .3 - 3.5, acc, { ol: false });
      // marquee
      const mx0 = cx - 3.5, mx1 = cx + 3.5, mz = 2.3, mh = 1.2, md = 1.4;
      box(mx0, d, mz, mx1 - mx0, md, mh, '#f1e2c0');
      lit(() => { qy(mx0 + .15, mx1 - .15, d + md, mz + .14, mz + mh - .14, cream); qx(mx1, d + .12, d + md - .12, mz + .14, mz + mh - .14, '#f4e8c4'); });
      lit(() => { sign('y', nm, mx0 + .15, mx1 - .15, d + md + .01, mz + .62, mz + mh - .12, null, red); sign('y', p.film || 'NOW SHOWING', mx0 + .15, mx1 - .15, d + md + .01, mz + .14, mz + .62, null, '#2a2540'); txt('x', 'OPEN', d + md - .2, mx1 + .01, mz + .78, red); });
      bulbs('y', mx0 + .1, mx1 - .1, d + md, mz + mh - .04, { step: .25 }); bulbs('y', mx0 + .1, mx1 - .1, d + md, mz + .06, { step: .25 }); bulbs('x', d + .1, d + md - .1, mx1, mz + mh - .04, { step: .25 }); bulbs('x', d + .1, d + md - .1, mx1, mz + .06, { step: .25 });
      glow(() => { for (let x = mx0 + .5; x < mx1; x += 1) { const q = PW(x, d + md - .4, mz); px(q[0], q[1] + 1, C('#fff2a8')); } });
      snowTop(mx0, mx1, d, d + md, mz + mh + .001, .15);
      // upper pylon with stacked letters
      const pt = HF + 3.2;
      box(cx - 1.1, d - .9, HF + .3, 2.2, 1.2, pt - HF - .3, acc);
      qy(cx - 1.1, cx + 1.1, d + .3, 3.5, pt, dk(acc, .18)); lw([cx - 1.1, d + .3, 3.5], [cx - 1.1, d + .3, pt], dk(acc, .7)); lw([cx + 1.1, d + .3, 3.5], [cx + 1.1, d + .3, pt], lt(acc, .3));
      qy(cx - .8, cx + .8, d + .3, 3.65, pt - .15, dk(acc, .5));
      box(cx - .8, d - .7, pt, 1.6, 1.0, .45, lt(acc, .15)); box(cx - .45, d - .5, pt + .45, .9, .6, .45, gold);
      lw([cx, d - .2, pt + .9], [cx, d - .2, pt + 1.7], '#c9ccd2'); lit(() => { const q = PW(cx, d - .2, pt + 1.7); px(q[0], q[1], C('#ff5a4a')); px(q[0], q[1] - 1, C('#ff5a4a')); });
      const n = short.length, st = Math.min(.78, (pt - 4.1) / n), z0 = pt - .35 - ((pt - 4.1) - st * n) / 2;
      lit(() => { for (let i = 0; i < n; i++) txt('y', short[i], cx - .19, d + .31, z0 - i * st, gold, 2); });
      bulbsV('y', cx - .95, d + .31, 3.7, pt - .2, { step: .3, cols: ['#fff2a8', '#ff8f6a'] }); bulbsV('y', cx + .95, d + .31, 3.7, pt - .2, { step: .3, cols: ['#ff8f6a', '#fff2a8'] });
      snowTop(cx - .8, cx + .8, d - .7, d + .3, pt + .451, .1);
    },
  },
  /* ------------------------------------------------------------ Playhouse theatre */
  {
    id: 'bld.arts.theatre', kind: 'building', tags: ['arts', 'theatre', 'venue', 'landmark'],
    size: [12, 12, 10.5], vb: [-.4, -.4, 0, 12.6, 13.4, 12],
    door: { side: 'y', at: 6 }, light: { x: 6, y: 13.2, z: 0, r: 6 },
    variants: [{ seed: 4, name: 'MAPLE BAY PLAYHOUSE' }, { seed: 15, name: 'THE GRAND THEATRE', wall: '#d9c8a4', roof: '#4f6f8a', accent: '#2f5d8a' }, { seed: 26, name: 'LYRIC STAGE', wall: '#7f8fa8', roof: '#3d3a4a', accent: '#8a2f5a' }],
    draw(p) {
      const w = 12, d = 12, r = rng(p.seed || 1), wall = p.wall || '#b05a45', stone = '#eadfc8', roof = p.roof || '#5a6f6a', acc = p.accent || '#a82a36', gold = '#f2c230', nm = p.name || 'MAPLE BAY PLAYHOUSE';
      // fly tower (back)
      box(1, 0, 0, w - 2, 4.5, 10, wall, wallPat('brick', wall));
      qx(w - 1, 0, 4.5, 9.2, 9.5, dk(stone, .36)); qy(1, w - 1, 4.5, 9.2, 9.5, dk(stone, .18));
      txt('x', 'STAGE', 2.0, w - 1 + .01, 2.3, lt(wall, .4)); door('x', 1.4, w - 1, { c: '#3d3a4a', glass: false }); lamp('x', 2.1, w - 1, 1.8);
      for (let i = 0; i < 3; i++) lw([w - 1, .8 + i * 1.3, 4], [w - 1, .8 + i * 1.3, 9], dk(wall, .55));
      const ft = flatRoof(1, 0, 10, w - 2, 4.5, wall, { cap: stone }); clutter(r, ft, ['ac2', 'vent', 'hatch', 'antenna'], 3);
      // auditorium + foyer block
      const y0 = 4, H = 6.2;
      box(0, y0, 0, w, d - y0, H, wall, wallPat('brick', wall));
      qy(0, w, d, 0, .5, dk(stone, .3)); qx(w, y0, d, 0, .5, dk(stone, .46));
      qy(0, w, d, 2.6, 2.76, dk(stone, .18)); qx(w, y0, d, 2.6, 2.76, dk(stone, .36)); qy(0, w, d, H - .7, H, dk(stone, .18)); qx(w, y0, d, H - .7, H, dk(stone, .36));
      // side windows
      wins('x', y0 + .6, d - .6, w, .8, 2.0, { ww: 1, gap: 1.2, r, p: .7, mullion: 'cross', trim: dk(stone, .2), sill: true });
      wins('x', y0 + .6, d - .6, w, 3.2, 4.6, { ww: 1, gap: 1.2, r, p: .7, arch: true, mullion: 'v', trim: dk(stone, .2) });
      // front: pilasters, three arched windows, three doors
      for (const x of [.3, 3.0, 9.0, 11.7]) { qy(x - .2, x + .2, d, .5, H - .7, stone); lw([x - .2, d, .5], [x - .2, d, H - .7], dk(stone, .4)); }
      for (let i = 0; i < 3; i++) { const x = 4.1 + i * 1.9; win('y', x - .6, x + .6, d, 3.1, 4.5, { on: true, arch: true, mullion: 'cross', trim: stone, glowc: ['#ffe2a0', '#ffc27a'] }); }
      banner('y', 1.05, d + .02, 2.9, 5.2, 1.2, acc, { c2: gold }); banner('y', 9.75, d + .02, 2.9, 5.2, 1.2, acc, { c2: gold });
      for (let i = 0; i < 3; i++) door('y', 4.1 + i * 1.9, d, { c: '#5a2f2a', double: true, w: 1.4, frame: stone, full: true, h: 1.75 });
      for (const x of [1.65, 10.35]) { qy(x - .5, x + .5, d + .01, .7, 2.1, gold); lit(() => { qy(x - .42, x + .42, d + .02, .78, 2.02, '#2b3a67'); qy(x - .25, x + .25, d + .02, 1.3, 1.85, x < 6 ? '#ff8fb0' : '#ffd166'); lw([x - .3, d + .02, 1.05], [x + .3, d + .02, 1.05], '#f6efe0'); }); }
      sign('y', nm, 6 - txtW(nm) / 2 - .3, 6 + txtW(nm) / 2 + .3, d + .01, H - .64, H - .1, '#2a2233', gold, { lit: true });
      // glass & iron canopy with bulbs
      canopy(3.0, 9.0, d, 2.15, 1.2, '#3d3a4a', { th: .16 }); lw([3.1, d, 3.0], [3.1, d + 1.1, 2.3], '#3d3a4a'); lw([8.9, d, 3.0], [8.9, d + 1.1, 2.3], '#3d3a4a');
      bulbs('y', 3.05, 8.95, d + 1.2, 2.2, { step: .25 }); bulbs('x', d + .1, d + 1.1, 9.0, 2.2, { step: .25 });
      // roof: gable facing the street
      gable(0, y0, H, w, d - y0, 3.2, 'y', roof, { wall: stone, over: .2 }); gableSnow(0, y0, H, w, d - y0, 3.2, 'y');
      pediment(0, w, d + .01, H, 3.2, stone, { inner: dk(wall, .1) });
      const M = MASKS; icon('y', M, 6 - iconW(M) / 2, d + .02, H + 1.7, { h: gold, d: '#f6efe0', k: '#3a2a2a' });
      lw([6, d, H + 3.2], [6, d, H + 4.2], '#c9ccd2'); fq([[6, d, H + 4.2], [6.8, d, H + 4.1], [6.8, d, H + 3.7], [6, d, H + 3.75]], acc);
      // front steps (inside footprint visual only: low plinth)
      box(3.2, d, 0, 5.6, .35, .12, stone, { ol: false });
    },
  },
];
