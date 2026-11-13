// Old Town walk-up apartment buildings (the player's starter studio lives in one of these).
import { box, qz, fq, lw, ball, spx, glow, lit, rng, dk, lt, PAT, ENV } from '../../engine/raster.js';
import { face, walls, mat, bays, win, winRow, door, wallLamp, drainpipe, flowerBox, ivy, railing, balcony, chimney, flatRoof, roofStuff, pot, pick, snowTop, isWinter, stringLights, sY, sX, vbOf, D, SNOW, fascia, fireEscape, laundry, waterTank, bulkhead, planter, parasol, antenna, acUnit, leafC, flowerC, poster } from './_lib.js';

const CURT = ['#f4ead8', '#e8b4a8', '#b8cdd6', '#c9d6b8', '#f0d890', '#d8a0c0'];
function winAC(F, c, z) { F.box(c - .28, c + .28, z, .3, .22, '#c9ced4', { t: snowTop('#d9dee4') }); F.l(c - .2, z + .1, c + .2, z + .1, '#7a8088', .22); F.l(c - .2, z + .2, c + .2, z + .2, '#7a8088', .22); }

/* ---------- brick walk-up with fire escape, laundry and a water tank ---------- */
const a1Size = p => [p.w || 8, p.d || 8, (p.floors || 4) * 2 + .5];
function walkup(p) {
  const q = D(p, { w: 8, d: 8, floors: 4, seed: 1, wall: '#9c4a40', trim: '#e2d6c2', name: 'MAPLE COURT', door: '#2f4a5a' }), { w, d } = q, fl = q.floors, r = rng(q.seed), H = fl * 2;
  const Fy = face('y', d), Fx = face('x', w), base = '#b9ae9c';
  walls(0, 0, 0, w, d, H, q.wall, 'brick');
  Fy.q(0, w, 0, 1.9, mat('stone', Fy.c(base))); Fx.q(0, d, 0, 1.9, mat('stone', Fx.c(base)));
  Fy.box(0, w, 1.86, .12, .06, q.trim, { ol: false }); Fx.box(0, d, 1.86, .12, .06, q.trim, { ol: false });
  const cols = bays(w, { m: .5, pitch: 1.55 }), gcols = cols.filter(c => c > 3.3), xc = bays(d, { m: .7, pitch: 1.8 });
  // ground floor
  winRow(Fy, w, 0, { cols: gcols, r, ww: .8, wh: .95, zo: .6, trim: q.trim, mull: 'cross' }); gcols.forEach(c => { for (const u of [c - .2, c, c + .2]) Fy.l(u, .6, u, 1.55, '#3a3440'); });
  winRow(Fx, d, 0, { cols: xc, r, ww: .75, wh: .95, zo: .6, trim: q.trim, skip: i => i === 0 });
  Fx.q(.4, 1.3, 0, 1.55, Fx.c('#4a5a66')); Fx.l(.4, 0, .4, 1.55, '#2a2f3a'); Fx.l(1.3, 0, 1.3, 1.55, '#2a2f3a'); poster(Fx, 1.6, .5, r);
  door(Fy, 1.5, 0, { w: 1.2, c: q.door, glass: true, double: true, transom: false, frame: q.trim, step: .1, stepd: .35 });
  wallLamp(Fy, .55, 1.15); wallLamp(Fy, 2.45, 1.15);
  Fy.box(.5, 2.5, 1.75, .14, .55, dk(q.door, .1), { t: snowTop(lt(q.door, .2)) }); fascia(Fy, q.name, .1, 2.9, 2.0, 2.42, dk(q.door, .2), '#f6e2a0');
  for (let i = 0; i < 4; i++) { Fy.q(2.75 + i * .14, 2.85 + i * .14, .95, 1.2, '#c8ccd0', null, .02); }
  // upper floors
  const fe0 = Math.min(cols.length - 2, Math.max(1, Math.floor(cols.length / 2) - 1)), fu0 = cols[fe0] - .7, fu1 = cols[Math.min(cols.length - 1, fe0 + 1)] + .7;
  for (let f = 1; f < fl; f++) {
    const z = f * 2;
    winRow(Fx, d, z, { cols: xc, r, ww: .75, wh: 1.1, zo: .55, lintel: q.trim, sillc: q.trim, mull: 'h', curts: CURT, catP: .05 });
    winRow(Fy, w, z, { cols, r, ww: .8, wh: 1.15, zo: .55, lintel: q.trim, sillc: q.trim, mull: 'h', curts: CURT, catP: .06 });
    cols.forEach((c, i) => { if (c > fu0 && c < fu1) return; const k = r(); if (k < .22) winAC(Fy, c, z + .55); else if (k < .5) flowerBox(Fy, c - .44, c + .44, z + .45, r); });
    xc.forEach((c, i) => { if (r() < .2) winAC(Fx, c, z + .55); });
  }
  // laundry lines across the side wall
  for (let f = 1; f < fl; f++) if (r() < .75 && xc.length > 1) { const i = Math.floor(r() * (xc.length - 1)), z = f * 2 + 1.0; laundry([w + .22, xc[i] + .3, z], [w + .22, xc[i + 1] - .3, z], r); lw([w, xc[i] + .3, z], [w + .22, xc[i] + .3, z], '#4a4458'); lw([w, xc[i + 1] - .3, z], [w + .22, xc[i + 1] - .3, z], '#4a4458'); }
  drainpipe(Fx, .15, 0, H); drainpipe(Fy, w - .15, 0, H);
  const zs = []; for (let f = 1; f < fl; f++) zs.push(f * 2 + .38);
  fireEscape(Fy, fu0, fu1, zs);
  if (isWinter()) zs.forEach(z => stringLights(Fy.P(fu0, z + .5, .5), Fy.P(fu1, z + .5, .5), 7, { sag: .05 }));
  else if (zs.length) { const z = zs[zs.length - 1]; for (let u = fu0 + .15; u < fu1 - .5; u += .5) if (r() < .5) { const g = Fy.c(leafC(r())); Fy.q(u, u + .25, z, z + .3, g, dk(g, .2), .3); } }
  // roof
  const R = flatRoof(0, 0, H, w, d, { c: q.trim, ov: .12, ph: .45, dent: true });
  bulkhead(R.x0, R.y0, R.z, q.wall);
  waterTank(R.x1 - 1, R.y0 + .9, R.z, { r: .7, h: 1.3, leg: .9 });
  if (R.y1 - R.y0 > 4) { const y = R.y0 + 2.6; lw([R.x0 + .2, y, R.z], [R.x0 + .2, y, R.z + 1.2], '#4a3a2e'); lw([R.x1 - 1.6, y, R.z], [R.x1 - 1.6, y, R.z + 1.2], '#4a3a2e'); laundry([R.x0 + .2, y, R.z + 1.15], [R.x1 - 1.6, y, R.z + 1.15], r); }
  roofStuff(r, { z: R.z, x0: R.x0, y0: R.y0 + 3.2, x1: R.x1, y1: R.y1 }, { n: 4, kinds: ['planter', 'vent', 'skylight', 'antenna', 'dish', 'ac', 'planter'] });
}

/* ---------- stucco balcony apartments with a rooftop garden ---------- */
const a2Size = p => [p.w || 8, p.d || 7, (p.floors || 3) * 2 + .5];
function gardenApts(p) {
  const q = D(p, { w: 8, d: 7, floors: 3, seed: 1, wall: '#e6b870', trim: '#fbf0dc', shut: '#3f6a5a', cap: '#b8573f', name: 'ROSE COURT', door: '#6a3a2a' }), { w, d } = q, fl = q.floors, r = rng(q.seed), H = fl * 2;
  const Fy = face('y', d), Fx = face('x', w);
  walls(0, 0, 0, w, d, H, q.wall, 'stucco');
  Fy.q(0, w, 0, .5, Fy.c(dk(q.wall, .3))); Fx.q(0, d, 0, .5, Fx.c(dk(q.wall, .3)));
  const cols = bays(w, { m: .55, pitch: 1.85 }), gcols = cols.filter(c => c > 2.7), xc = bays(d, { m: .8, pitch: 2 });
  ivy(Fx, 0, d * .4, 0, H * .75, { cu: 0, seed: q.seed, v: r() });
  winRow(Fy, w, 0, { cols: gcols, r, ww: .85, wh: .9, zo: .6, arch: true, trim: q.trim, mull: 'v', fboxP: .6 });
  winRow(Fx, d, 0, { cols: xc, r, ww: .8, wh: .9, zo: .6, arch: true, trim: q.trim, mull: 'v', skip: i => i === 0 });
  door(Fy, 1.5, 0, { w: 1.1, c: q.door, frame: q.trim, arch: true, double: true, step: .1 });
  wallLamp(Fy, 2.35, 1.2); Fy.text(q.name.split(' ')[0], .2, 2.8, 2.36, Fy.c(dk(q.wall, .55)));
  pot(.6, d + .22, 0, { tall: true }); pot(2.4, d + .22, 0, { tall: true });
  for (let f = 1; f < fl; f++) {
    const z = f * 2;
    winRow(Fx, d, z, { cols: xc, r, ww: .8, wh: 1.1, zo: .55, trim: q.trim, shut: q.shut, curts: CURT, fboxP: .4, catP: .06 });
    cols.forEach((c, i) => {
      if ((i + f) % 2 === 0) { win(Fy, c - .45, c + .45, z + .22, z + 1.7, { r, trim: q.trim, shut: q.shut, mull: 'cross', sill: false, curt: pick(r, CURT) }); balcony(Fy, c - .8, c + .8, z + .2, { dep: .42, r, plants: true, slab: q.trim }); if (r() < .35 && !isWinter()) { const a = Fy.P(c - .7, z + .95, .42), b = Fy.P(c + .7, z + .95, .42); laundry(a, b, r, { n: 3 }); } }
      else win(Fy, c - .42, c + .42, z + .55, z + 1.65, { r, trim: q.trim, shut: q.shut, mull: 'cross', curt: pick(r, CURT), fbox: r() < .7, cat: r() < .08 });
    });
  }
  drainpipe(Fy, w - .14, 0, H);
  // roof garden
  const R = flatRoof(0, 0, H, w, d, { c: q.wall, ph: .45, cap: q.cap, roof: '#b09a7a', l: mat('stucco', sY(q.wall)), r: mat('stucco', sX(q.wall)) });
  bulkhead(R.x0, R.y0, R.z, q.wall, { mat: 'stucco' });
  planter(R.x0 + 1.4, R.y0, R.z, R.x1 - R.x0 - 1.5, .45, r, { c: '#b8643f' });
  planter(R.x0, R.y0 + 1.6, R.z, .45, R.y1 - R.y0 - 1.7, r, { c: '#b8643f' });
  // pergola
  const px = R.x0 + 1.4, py = R.y0 + 1.2, pw = Math.min(2.6, R.x1 - px - 1.4), pd = 1.8, pz = R.z + 1.5, pc = '#7a5a40';
  for (const [a, b] of [[0, 0], [pw, 0], [0, pd], [pw, pd]]) lw([px + a, py + b, R.z], [px + a, py + b, pz], pc);
  box(px + .3, py + .5, R.z, pw - .6, .7, .35, '#e8e0d0', { t: snowTop('#f4ead8') });
  for (let x = 0; x <= pw + .01; x += .37) lw([px + x, py - .15, pz], [px + x, py + pd + .15, pz], pc); lw([px - .15, py, pz], [px + pw + .15, py, pz], pc); lw([px - .15, py + pd, pz], [px + pw + .15, py + pd, pz], pc);
  if (!isWinter()) for (let i = 0; i < 5; i++) ball(px + r() * pw, py + r() * pd * .6, pz + .08, .22 + r() * .1, leafC(r()), { squash: .6 });
  stringLights([px - .15, py + pd, pz], [px + pw + .15, py + pd, pz], 8, { sag: .15 });
  if (R.x1 - (px + pw) > 1.2) parasol(R.x1 - .8, R.y1 - 1, R.z, '#e8a23a');
  planter(R.x0 + .8, R.y1 - .5, R.z, Math.max(.9, R.x1 - R.x0 - 2.8), .4, r, { c: '#b8643f' });
  antenna(R.x1 - .3, R.y0 + .5, R.z, 1.4);
}

export default [
  { id: 'bld.oldtown.apartment.walkup', kind: 'building', tags: ['oldtown', 'residential', 'apartment', 'home', 'brick', 'enterable'], size: a1Size, vb: vbOf(a1Size, { y: .8, z: 3 }), door: { side: 'y', at: 1.5 }, light: { x: 1.5, y: 8.8, z: 0, r: 4 }, draw: walkup,
    variants: [{ w: 8, d: 8, floors: 4, seed: 6 }, { w: 7, d: 8, floors: 5, seed: 14, wall: '#8f5a4c', name: 'THE ALDER', door: '#3f5a3a' }, { w: 10, d: 8, floors: 4, seed: 23, wall: '#b5654a', name: 'LANTERN APTS', door: '#6a2f3a' }, { w: 8, d: 7, floors: 3, seed: 37, wall: '#c4956a', name: 'BAKER HOUSE' }, { w: 9, d: 9, floors: 5, seed: 45, wall: '#77575a', trim: '#d9cfc0', name: 'OLD MILL' }] },
  { id: 'bld.oldtown.apartment.garden', kind: 'building', tags: ['oldtown', 'residential', 'apartment', 'home', 'stucco', 'enterable'], size: a2Size, vb: vbOf(a2Size, { y: .8, z: 2.6 }), door: { side: 'y', at: 1.5 }, light: { x: 1.5, y: 7.8, z: 0, r: 4 }, draw: gardenApts,
    variants: [{ w: 8, d: 7, floors: 3, seed: 5 }, { w: 9, d: 7, floors: 4, seed: 18, wall: '#e8b4a8', shut: '#5a6a8a', name: 'ROSE COURT' }, { w: 7, d: 7, floors: 3, seed: 26, wall: '#c9d6b8', shut: '#8a4a3a', cap: '#7a5548', name: 'SAGE HOUSE' }, { w: 10, d: 8, floors: 4, seed: 39, wall: '#f0d890', shut: '#34506a', name: 'SUNNY COURT' }] },
];
