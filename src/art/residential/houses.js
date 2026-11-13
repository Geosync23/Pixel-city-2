// Maplewood family houses (part 1): bungalow, two-storey gable house, cape cod, starter cottage, craftsman.
import { box, qy, qx, qz, lw, fq, cyl, dk, lt, PAT } from '../../engine/raster.js';
import {
  mk, body, win, winRow, door, porch, steps, roofGable, roofHip, chimney, dormer, skylight, solar, dish, pipe,
  fairy, pumpkin, pot, bloom, leafy, winter, autumn, snowTop, fs, fQ, fL, hood, pt, disc,
} from './_lib.js';

export const STONE = '#9a948c';

export default [
  /* ---------------- bungalow: low hip roof, front gabled bay, open deck ---------------- */
  mk({
    id: 'bld.res.bungalow', tags: ['maplewood', 'home', 'house', 'suburb'],
    defs: { w: 7, d: 6, floors: 1, wall: '#efe3c8', roof: '#7a5040', trim: '#f6f1e6', doorc: '#7a3b2e', mat: 'siding', shut: null },
    height: P => 2.3 + 1.4,
    doorAt: P => ({ side: 'y', at: 1.5 }), lightAt: P => ({ x: 1.5, y: P.d + .5, z: 0, r: 3 }),
    variants: [
      { w: 7, d: 6, seed: 1 },
      { w: 8, d: 6, seed: 2, wall: '#a9c2a0', roof: '#565266', doorc: '#c8683f', shut: '#4f6f5a' },
      { w: 6, d: 6, seed: 3, wall: '#e6b0a2', roof: '#6a4a4a', doorc: '#3d5a6c', mat: 'stucco' },
      { w: 8, d: 7, seed: 4, wall: '#9fc0d8', roof: '#4a5568', doorc: '#f2cf5a', shut: '#f6f1e6' },
      { w: 7, d: 6, seed: 5, wall: '#b5654a', roof: '#4d4a55', doorc: '#2f5d50', mat: 'brick' },
    ],
    paint(P, r) {
      const { w, d, wall, roof, trim } = P, fm = 1, bd = d - fm, H = 2.3, z0 = .3, m = P.mat, bw = w >= 7 ? 3.2 : 2.7, bx = w - bw, cb = m === 'siding' ? trim : null;
      body(0, 0, 0, w, bd, H, wall, m, { base: STONE, corner: cb });
      winRow('x', .4, bd - .3, w, z0 + .7, z0 + 1.6, { r, ww: .9, n: 2, trim, shut: P.shut });
      door('y', 1.5, bd, z0, { c: P.doorc, trim, wreath: true, pumpkin: 2, mat: true });
      if (bx > 3.3) win('y', 2.5, bx - .45, bd, z0 + .7, z0 + 1.6, { on: r() < .7, trim, curt: '#e9c9a0', mull: 'v' });
      roofHip(0, 0, H, w, bd, 1.4, roof, { trim, behind: () => chimney(w * .3, bd / 2 - .8, H + .5, H + 2.0) });
      porch(.1, bx, bd, .7, z0, { roof: 'none', ph: .72, post: trim, gap: [1.0, 2.0], posts: 4, base: STONE });
      steps('y', 1.0, 2.0, bd + .7, z0, 2, '#b9b2a6', .15);
      body(bx, bd - .02, 0, bw, fm + .02, H, wall, m, { base: STONE, corner: cb });
      win('y', bx + bw / 2 - .8, bx + bw / 2 + .8, d, z0 + .65, z0 + 1.6, { on: r() < .8, trim, shut: P.shut, fbox: true, v: r(), lights: true, curt: '#d9e6ee' });
      pipe('y', w - .22, d, .3, H - .3, dk(trim, .25));
      roofGable(bx, bd - 1.9, H, bw, fm + 1.9, 1.05, 'y', roof, { wall, wmat: m === 'brick' ? 'siding' : m, trim, vent: r() < .5 ? 'round' : true });
      if (r() < .5) dish(.6, bd * .5, H + .9);
    },
  }),

  /* ---------------- two-storey gable house with a full-width front porch ---------------- */
  mk({
    id: 'bld.res.gablehouse', tags: ['maplewood', 'home', 'house', 'suburb'],
    defs: { w: 7, d: 6, floors: 2, wall: '#f1ede4', roof: '#565266', trim: '#f6f1e6', doorc: '#a8343a', mat: 'siding', shut: '#3d5a6c' },
    height: P => .3 + P.floors * 2 + 1.6,
    doorAt: P => ({ side: 'y', at: 2 }), lightAt: P => ({ x: 2, y: P.d + .5, z: 0, r: 3 }),
    variants: [
      { w: 7, d: 6, seed: 1 },
      { w: 6, d: 6, seed: 2, wall: '#ecd28a', roof: '#7a5040', shut: '#f6f1e6', doorc: '#2f5d50' },
      { w: 8, d: 6, seed: 3, wall: '#8fa3b5', roof: '#3f4658', shut: '#f6f1e6', doorc: '#f2cf5a' },
      { w: 7, d: 7, seed: 4, wall: '#a9c2a0', roof: '#6a4a4a', shut: '#5a4038', doorc: '#7a3b2e' },
      { w: 8, d: 6, seed: 5, wall: '#b5654a', roof: '#4d4a55', mat: 'brick', shut: '#f6f1e6', doorc: '#2b3a55' },
      { w: 6, d: 6, seed: 6, wall: '#e6b0a2', roof: '#56708a', shut: null, doorc: '#3d5a6c' },
    ],
    paint(P, r) {
      const { w, d, wall, roof, trim } = P, pd = .8, bd = d - pd, z0 = .3, H = z0 + P.floors * 2, m = P.mat, rh = 1.6;
      const extChim = r() < .5;
      body(0, 0, 0, w, bd, H, wall, m, { base: STONE, corner: m === 'siding' ? trim : null });
      for (let f = 0; f < P.floors; f++) winRow('x', .3, bd - .3, w, z0 + f * 2 + .8, z0 + f * 2 + 1.65, { r, ww: .85, n: 2, trim, shut: P.shut, skip: (i) => extChim && false });
      porch(0, w, bd, pd, z0, { roofc: roof, post: trim, gap: [1.4, 2.6], lights: true, sidewall: wall, kind: 'shingle', posts: w >= 8 ? 5 : 4 }, () => {
        door('y', 2, bd, z0, { c: P.doorc, trim, wreath: true, pumpkin: 2, mat: true, side: w >= 7 });
        winRow('y', 3.4, w - .3, bd, z0 + .7, z0 + 1.65, { r, ww: 1, n: w >= 8 ? 2 : 1, trim, shut: P.shut, pOn: .8, curt: '#e9c9a0' });
        win('y', .3, 1.0, bd, z0 + .75, z0 + 1.65, { on: r() < .5, trim, mull: 'v' });
      });
      steps('y', 1.4, 2.6, d, z0, 2, '#b9b2a6', .15);
      for (let f = 1; f < P.floors; f++) winRow('y', .4, w - .4, bd, z0 + f * 2 + .85, z0 + f * 2 + 1.65, { r, ww: .9, n: w >= 8 ? 3 : 2, trim, shut: P.shut, fbox: f === 1 && r() < .6, wreath: true });
      pipe('y', w - .22, bd, 3.2, H - .3, dk(trim, .25));
      const R = roofGable(0, 0, H, w, bd, rh, 'x', roof, { wall, wmat: m, trim, vent: r() < .5 ? 'round' : true, behind: () => { if (!extChim) chimney(w * .25, bd / 2 - .75, H + .6, H + rh + .6); } });
      if (extChim) chimney(w, bd / 2 - .45, 0, H + rh + .6, '#a85a44', { w: .4, d: .9, pots: 2 });
      const k = r();
      if (k < .35) solar(R, w * .5, w - .6, .2, .7); else if (k < .6) skylight(R, w * .6, .3, { on: r() < .5 }); else if (k < .8) dish(.5, bd / 2, H + rh - .1);
    },
  }),

  /* ---------------- cape cod: steep roof with dormers, central pedimented door ---------------- */
  mk({
    id: 'bld.res.capecod', tags: ['maplewood', 'home', 'house', 'suburb'],
    defs: { w: 8, d: 6, floors: 1, wall: '#e9e4d8', roof: '#4d4a55', trim: '#f6f1e6', doorc: '#2b3a55', mat: 'shingle', shut: '#2b3a55' },
    height: P => 2.3 + 2.4,
    doorAt: P => ({ side: 'y', at: P.w / 2 }), lightAt: P => ({ x: P.w / 2, y: P.d + .5, z: 0, r: 3 }),
    variants: [
      { w: 8, d: 6, seed: 1 },
      { w: 9, d: 6, seed: 2, wall: '#8a9aa8', roof: '#3f3d4a', shut: '#f6f1e6', doorc: '#a8343a', mat: 'siding' },
      { w: 7, d: 6, seed: 3, wall: '#ecd28a', roof: '#6a4a4a', shut: '#4f6f5a', doorc: '#4f6f5a', mat: 'siding' },
      { w: 8, d: 6, seed: 4, wall: '#b5654a', roof: '#4a4650', shut: '#2a2a35', doorc: '#2a2a35', mat: 'brick' },
      { w: 9, d: 7, seed: 5, wall: '#c9d6c2', roof: '#7a5040', shut: '#7a3b2e', doorc: '#7a3b2e', mat: 'siding' },
    ],
    paint(P, r) {
      const { w, d, wall, roof, trim } = P, bd = d - .6, z0 = .3, H = 2.3, m = P.mat, rh = 2.4, cx = w / 2;
      body(0, 0, 0, w, bd, H, wall, m, { base: STONE, corner: m === 'brick' ? null : trim });
      winRow('x', .4, bd - .4, w, z0 + .7, z0 + 1.6, { r, ww: .85, n: 2, trim, shut: P.shut, skip: i => i === 0 });
      door('y', cx, bd, z0, { c: P.doorc, trim, wreath: true, pumpkin: 1, ped: true, glass: false, steps: 2, stepc: '#b9b2a6' });
      const n = w >= 9 ? 2 : 1;
      winRow('y', .35, cx - .9, bd, z0 + .7, z0 + 1.6, { r, ww: .9, n, trim, shut: P.shut, fbox: true, pOn: .7 });
      winRow('y', cx + .9, w - .35, bd, z0 + .7, z0 + 1.6, { r, ww: .9, n, trim, shut: P.shut, fbox: true, pOn: .7 });
      const R = roofGable(0, 0, H, w, bd, rh, 'x', roof, { wall, wmat: m, trim, behind: () => chimney(cx - .45, bd / 2 - .8, H + 1.2, H + rh + .7, '#a85a44', { w: .9, pots: 2 }) });
      win('x', bd / 2 - .4, bd / 2 + .4, w, H + .5, H + 1.4, { on: r() < .6, trim, mull: 'cross', shut: P.shut });
      const ds = w >= 9 ? [.2, .5, .8] : [.25, .75];
      for (const k of ds) dormer(R, w * k, .68, 1.0, { wall, trim, on: r() < .6, w: 1.25 });
      pipe('y', .2, bd, .3, H - .3, dk(trim, .25));
    },
  }),

  /* ---------------- tiny starter cottage ---------------- */
  mk({
    id: 'bld.res.cottage', tags: ['maplewood', 'home', 'house', 'starter', 'suburb'],
    defs: { w: 4, d: 5, floors: 1, wall: '#f2cf7a', roof: '#a8503c', trim: '#f6f1e6', doorc: '#3d7a8a', mat: 'siding', shut: '#3d7a8a' },
    height: P => 2.3 + P.w * .36 + .1,
    doorAt: P => ({ side: 'y', at: 1.1 }), lightAt: P => ({ x: 1.1, y: P.d + .5, z: 0, r: 2.5 }),
    variants: [
      { w: 4, d: 5, seed: 1 },
      { w: 5, d: 5, seed: 2, wall: '#a9d0c8', roof: '#565266', doorc: '#e06a4a', shut: '#f6f1e6' },
      { w: 4, d: 4, seed: 3, wall: '#f1ede4', roof: '#4f7560', doorc: '#a8343a', shut: '#4f7560', mat: 'planks' },
      { w: 5, d: 4, seed: 4, wall: '#e6a8b0', roof: '#5a5266', doorc: '#f6f1e6', shut: '#8a5a7a' },
      { w: 4, d: 5, seed: 5, wall: '#b88a5a', roof: '#3f4a45', doorc: '#2f5d50', shut: null, mat: 'shingle' },
    ],
    paint(P, r) {
      const { w, d, wall, roof, trim } = P, bd = d - .5, z0 = .25, H = 2.3, m = P.mat, rh = w * .36;
      body(0, 0, 0, w, bd, H, wall, m, { base: STONE, baseH: .25, corner: trim });
      winRow('x', .5, bd - .5, w, z0 + .75, z0 + 1.6, { r, ww: .85, n: bd > 4 ? 2 : 1, trim, shut: P.shut, fbox: r() < .5 });
      door('y', 1.1, bd, z0, { c: P.doorc, trim, wreath: true, pumpkin: 1, steps: 2, stepc: '#b9b2a6', glass: 'fan' });
      win('y', 2.1, w - .55, bd, z0 + .75, z0 + 1.65, { on: r() < .8, trim, shut: w > 4 ? P.shut : null, fbox: true, v: r(), curt: '#f4f0e8', lights: true });
      roofGable(0, 0, H, w, bd, rh, 'y', roof, { wall, wmat: m, trim, vent: 'round', behind: () => { cyl(w * .28, bd * .35, H + .3, .13, rh + .5, '#55566a'); cyl(w * .28, bd * .35, H + rh + .8, .2, .1, '#3e3e4c'); } });
      if (winter()) fairy([-.2, bd + .25, H - .1], [w / 2, bd + .25, H + rh - .1], { sag: 0 });
      if (r() < .4) pot(.35, bd + .25, 0, bloom(r()) || leafy(.2), .2);
    },
  }),

  /* ---------------- craftsman: broad front gable, offset porch gable on stone piers ---------------- */
  mk({
    id: 'bld.res.craftsman', tags: ['maplewood', 'home', 'house', 'suburb'],
    defs: { w: 7, d: 7, floors: 1, wall: '#7f9a78', roof: '#5a4038', trim: '#efe6cf', doorc: '#8a4a2a', mat: 'siding', gablec: '#c9a86a', pier: '#a09488' },
    height: P => 2.6 + P.w * .21 + .2,
    doorAt: P => ({ side: 'y', at: P.w - 1.35 }), lightAt: P => ({ x: P.w - 1.35, y: P.d + .4, z: 0, r: 3 }),
    variants: [
      { w: 7, d: 7, seed: 1 },
      { w: 8, d: 7, seed: 2, wall: '#b0784a', gablec: '#e3cfa0', roof: '#3f4a45', doorc: '#2f5d50' },
      { w: 7, d: 6, seed: 3, wall: '#5f7f9a', gablec: '#dfe6ea', roof: '#3f3d4a', doorc: '#c8683f' },
      { w: 8, d: 7, seed: 4, wall: '#d8c79a', gablec: '#9a5a40', roof: '#5a4038', doorc: '#3d5a6c', pier: '#b5654a' },
      { w: 7, d: 7, seed: 5, wall: '#8a5a5a', gablec: '#e3cfa0', roof: '#4d4a55', doorc: '#e3cfa0' },
    ],
    paint(P, r) {
      const { w, d, wall, roof, trim } = P, fm = 1, bd = d - fm, z0 = .45, H = 2.6, rh = w * .21, px1 = w - 2.7, dx = w - 1.35;
      body(0, 0, 0, w, bd, H, wall, P.mat, { base: P.pier, baseH: .45, corner: trim });
      winRow('x', .5, bd - .5, w, z0 + .7, z0 + 1.55, { r, ww: 1.0, n: 2, trim, mull: 'v', head: true });
      door('y', dx, bd, z0, { c: P.doorc, trim, wreath: true, pumpkin: 2, glass: 'fan', mat: true });
      win('y', .8, px1 - .8, bd, z0 + .65, z0 + 1.6, { on: r() < .8, trim, mull: 'v', head: true, curt: '#e9c9a0' });
      roofGable(0, 0, H, w, bd, rh, 'y', roof, { wall: P.gablec, wmat: 'shingle', trim, over: .3, rake: .35, behind: () => chimney(w * .2, bd * .3, H + .3, H + rh + .5, P.pier === '#b5654a' ? '#a85a44' : '#8d8580') });
      for (let i = -1; i <= 1; i++) win('y', w / 2 + i * .62 - .25, w / 2 + i * .62 + .25, bd, H + rh * .28, H + rh * .28 + .55, { on: r() < .5, trim, mull: null, sill: i === 0 });
      for (const k of [.1, .9]) { const xx = w * k, zz = H + rh * (1 - Math.abs(k - .5) * 2) - .2; lw([xx, bd, zz - .3], [xx, bd + .3, zz], dk(trim, .3)); lw([xx, bd, zz - .3], [xx, bd, zz], dk(trim, .3)); }
      porch(0, px1, bd, fm, z0, { roof: 'gable', ph: 1.8, gh: px1 * .2, post: trim, piers: P.pier, posts: 2, base: P.pier, roofc: roof, gwall: P.gablec, gmat: 'shingle', kind: 'shingle', vent: true, lights: true }, null);
      box(px1, bd, 0, w - px1 - .2, .6, z0, P.pier, { t: PAT.fboards('#b08a64', .25) });
      steps('y', dx - .6, dx + .6, bd + .6, z0, 3, '#b9b2a6', .13);
      if (autumn()) pumpkin(px1 + .3, bd + .35, z0, true);
      if (r() < .6) pot(w - .5, bd + .3, z0, bloom(r()) || leafy(.4), .2);
    },
  }),
];
