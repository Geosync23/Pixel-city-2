// Maplewood family houses (part 1): bungalow, two-storey gable house, cape cod, starter cottage, craftsman.
import { box, qy, qx, qz, lw, fq, dk, lt, PAT, glow } from '../../engine/raster.js';
import {
  mk, body, win, winRow, door, garage, porch, steps, roofGable, roofHip, roofShed, chimney, dormer, skylight, solar, dish, antenna, pipe, lamp,
  fairy, pumpkin, pot, bloom, leafy, winter, autumn, spring, snowTop, wallQ, fs, fQ, fL, pick, rail,
} from './_lib.js';

const STONE = '#9a948c';

export default [
  /* ---------------- bungalow: one storey, hip roof swallowing an inset corner porch ---------------- */
  mk({
    id: 'bld.res.bungalow', tags: ['maplewood', 'home', 'house', 'suburb'],
    defs: { w: 7, d: 6, floors: 1, wall: '#efe3c8', roof: '#7a5040', trim: '#f6f1e6', doorc: '#7a3b2e', mat: 'siding', shut: null },
    height: P => 2.3 + 1.7,
    doorAt: P => ({ side: 'y', at: 1.5 }), lightAt: P => ({ x: 1.5, y: P.d + .6, z: 0, r: 3 }),
    variants: [
      { w: 7, d: 6, seed: 1 },
      { w: 8, d: 6, seed: 2, wall: '#a9c2a0', roof: '#565266', doorc: '#c8683f', shut: '#4f6f5a' },
      { w: 6, d: 6, seed: 3, wall: '#dba59a', roof: '#6a4a4a', doorc: '#3d5a6c', mat: 'stucco' },
      { w: 8, d: 7, seed: 4, wall: '#9fc0d8', roof: '#4a5568', doorc: '#f2cf5a', shut: '#f6f1e6' },
      { w: 7, d: 6, seed: 5, wall: '#b5654a', roof: '#4d4a55', doorc: '#2f5d50', mat: 'brick' },
    ],
    paint(P, r) {
      const { w, d, wall, roof, trim } = P, pd = 1.5, bd = d - pd, H = 2.3, z0 = .3, pw = Math.min(3.6, w - 2.6), m = P.mat;
      body(0, 0, 0, w, bd, H, wall, m, { base: STONE, corner: m === 'siding' ? trim : null });
      winRow('x', .4, bd - .2, w, z0 + .75, z0 + 1.7, { r, ww: .9, n: bd > 5 ? 2 : 1, trim, shut: P.shut, v: r() });
      porch(0, pw, bd, pd, z0, { roof: 'none', ph: 2.0, post: trim, gap: [1.0, 2.0], posts: 2 }, () => {
        door('y', 1.5, bd, z0, { c: P.doorc, trim, wreath: true, pumpkin: 2, mat: true });
        if (pw > 3.2) win('y', 2.45, 3.25, bd, z0 + .75, z0 + 1.7, { on: r() < .7, trim, curt: '#e9c9a0' });
      });
      body(pw, bd - .02, 0, w - pw, pd + .02, H, wall, m, { base: STONE, corner: m === 'siding' ? trim : null });
      const fw = w - pw;
      win('y', pw + fw / 2 - .8, pw + fw / 2 + .8, d, z0 + .7, z0 + 1.7, { on: r() < .8, trim, mull: 'cross', shut: P.shut, fbox: true, head: true, v: r(), lights: true, curt: '#d9e6ee' });
      win('x', bd + .3, d - .3, w, z0 + .75, z0 + 1.7, { on: r() < .5, trim, mull: 'v' });
      steps('y', .95, 2.05, d, z0, 2);
      pipe('y', w - .2, d, .3, H - .2, dk(trim, .25));
      roofHip(0, 0, H, w, d, 1.7, roof, { trim, behind: () => chimney(w * .62, bd / 2 - .9, H + .5, H + 2.3) });
      if (r() < .5) dish(w - .4, d * .45, H + .55);
    },
  }),

  /* ---------------- two-storey gable house with a full-width front porch ---------------- */
  mk({
    id: 'bld.res.gablehouse', tags: ['maplewood', 'home', 'house', 'suburb'],
    defs: { w: 7, d: 6, floors: 2, wall: '#f1ede4', roof: '#565266', trim: '#f6f1e6', doorc: '#a8343a', mat: 'siding', shut: '#3d5a6c' },
    height: P => .3 + P.floors * 2 + 1.9,
    doorAt: P => ({ side: 'y', at: 2 }), lightAt: P => ({ x: 2, y: P.d + .6, z: 0, r: 3 }),
    variants: [
      { w: 7, d: 6, seed: 1 },
      { w: 6, d: 6, seed: 2, wall: '#ecd28a', roof: '#7a5040', shut: '#f6f1e6', doorc: '#2f5d50' },
      { w: 8, d: 6, seed: 3, wall: '#8fa3b5', roof: '#3f4658', shut: '#f6f1e6', doorc: '#f2cf5a' },
      { w: 7, d: 7, seed: 4, wall: '#a9c2a0', roof: '#6a4a4a', shut: '#5a4038', doorc: '#7a3b2e' },
      { w: 8, d: 6, seed: 5, wall: '#b5654a', roof: '#4d4a55', mat: 'brick', shut: '#f6f1e6', doorc: '#2b3a55' },
      { w: 6, d: 6, seed: 6, wall: '#dba59a', roof: '#56708a', shut: null, doorc: '#3d5a6c' },
    ],
    paint(P, r) {
      const { w, d, wall, roof, trim } = P, pd = 1.4, bd = d - pd, z0 = .3, H = z0 + P.floors * 2, m = P.mat, rh = 1.9;
      const extChim = r() < .5;
      body(0, 0, 0, w, bd, H, wall, m, { base: STONE, corner: m === 'siding' ? trim : null });
      for (let f = 0; f < P.floors; f++) winRow('x', .3, bd - .3, w, z0 + f * 2 + .75, z0 + f * 2 + 1.75, { r, ww: .85, n: 2, trim, shut: P.shut, skip: i => extChim && false });
      if (extChim) chimney(w, bd / 2 - .4, 0, H + rh + .5, '#a85a44', { w: .45, d: .8, pots: 2 });
      porch(0, w, bd, pd, z0, { roofc: roof, post: trim, gap: [1.4, 2.6], lights: true, sidewall: wall, kind: 'shingle' }, () => {
        door('y', 2, bd, z0, { c: P.doorc, trim, wreath: true, pumpkin: 2, mat: true, side: w >= 7 });
        winRow('y', 3.3, w - .3, bd, z0 + .7, z0 + 1.7, { r, ww: 1, n: w >= 8 ? 2 : 1, trim, shut: P.shut, pOn: .8, curt: '#e9c9a0' });
        win('y', .25, .95, bd, z0 + .75, z0 + 1.7, { on: r() < .5, trim, mull: 'v' });
      });
      steps('y', 1.4, 2.6, d, z0, 2);
      for (let f = 1; f < P.floors; f++) winRow('y', .4, w - .4, bd, z0 + f * 2 + .8, z0 + f * 2 + 1.75, { r, ww: .9, n: w >= 8 ? 3 : 2, trim, shut: P.shut, fbox: f === 1 && r() < .6, wreath: true });
      pipe('y', w - .22, bd, 2.9, H - .2, dk(trim, .25));
      const R = roofGable(0, 0, H, w, bd, rh, 'x', roof, { wall, wmat: m, trim, vent: r() < .5 ? 'round' : true, behind: () => { if (!extChim) chimney(w * .25, bd / 2 - .75, H + .8, H + rh + .6); } });
      const k = r();
      if (k < .35) solar(R, w * .5, w - .6, .2, .7); else if (k < .6) skylight(R, w * .6, .3, { on: r() < .5 }); else if (k < .8) dish(.5, bd / 2, H + rh - .1);
    },
  }),
];
