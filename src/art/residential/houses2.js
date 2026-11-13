// Maplewood family houses (part 2): L-shaped house, split-level, ranch with garage, duplex, and the sibling's family home.
import { box, qy, qx, qz, lw, fq, dk, lt, PAT, textY } from '../../engine/raster.js';
import {
  mk, body, win, winRow, door, garage, porch, steps, roofGable, roofHip, roofShed, chimney, dormer, skylight, solar, dish, pipe, lamp,
  fairy, pumpkin, pot, bloom, leafy, winter, autumn, snowTop, wallQ, fs, fQ, fL, hood, bike, hoop, swing, fB,
} from './_lib.js';

const STONE = '#9a948c', STEP = '#b9b2a6';

export default [
  /* ---------------- L-shaped two-storey house: front wing with bay window or garage, porch in the corner ---------------- */
  mk({
    id: 'bld.res.lhouse', tags: ['maplewood', 'home', 'house', 'suburb'],
    defs: { w: 9, d: 7, floors: 2, wall: '#dfe6ea', roof: '#4a5568', trim: '#f6f1e6', doorc: '#c8683f', mat: 'siding', shut: null, garage: false },
    height: P => .3 + P.floors * 2 + 1.5,
    doorAt: P => ({ side: 'y', at: P.w - 4.7 }), lightAt: P => ({ x: P.w - 4.7, y: P.d - .8, z: 0, r: 3 }),
    variants: [
      { w: 9, d: 7, seed: 1 },
      { w: 9, d: 7, seed: 2, wall: '#e3cfa0', roof: '#6a4a4a', doorc: '#2f5d50', garage: true, shut: '#6a4a4a' },
      { w: 8, d: 7, seed: 3, wall: '#b5654a', roof: '#3f3d4a', doorc: '#f6f1e6', mat: 'brick' },
      { w: 10, d: 8, seed: 4, wall: '#9db59a', roof: '#565266', doorc: '#7a3b2e', garage: true },
      { w: 9, d: 7, seed: 5, wall: '#f1ede4', roof: '#a8503c', doorc: '#2b3a55', shut: '#2b3a55', mat: 'stucco' },
    ],
    paint(P, r) {
      const { w, d, wall, roof, trim } = P, z0 = .3, H = z0 + P.floors * 2, m = P.mat, bd = d - 2.2, ww = 3.5, wx = w - ww, wf = d - .3, rh = 1.45, dx = w - 4.7, cb = m === 'siding' ? trim : null;
      body(0, 0, 0, w, bd, H, wall, m, { base: STONE, corner: cb });
      for (let f = 0; f < P.floors; f++) winRow('x', .4, bd - .2, w, z0 + f * 2 + .8, z0 + f * 2 + 1.65, { r, ww: .85, n: 2, trim, shut: P.shut });
      porch(wx - 2.9, wx, bd, .8, z0, { roofc: roof, post: trim, posts: 3, gap: [dx - .6, dx + .6], sidewall: wall, lights: true }, () => {
        door('y', dx, bd, z0, { c: P.doorc, trim, wreath: true, pumpkin: 2, mat: true });
        win('y', wx - 2.6, wx - 2.0, bd, z0 + .8, z0 + 1.65, { on: r() < .6, trim, mull: 'h' });
      });
      steps('y', dx - .6, dx + .6, bd + .8, z0, 2, STEP, .15);
      if (wx - 2.9 > 1.4) winRow('y', .3, wx - 3.0, bd, z0 + .75, z0 + 1.65, { r, ww: 1.0, n: 1, trim, shut: P.shut, fbox: true, curt: '#e9c9a0' });
      for (let f = 1; f < P.floors; f++) winRow('y', .3, wx - .2, bd, z0 + f * 2 + .85, z0 + f * 2 + 1.65, { r, ww: .9, n: wx > 5 ? 3 : 2, trim, shut: P.shut, wreath: true });
      const R = roofGable(0, 0, H, w, bd, rh, 'x', roof, { wall, wmat: m, trim, vent: true, behind: () => chimney(w * .18, bd / 2 - .8, H + .5, H + rh + .6) });
      if (r() < .5) skylight(R, 1.2, .35, { on: r() < .5 }); else solar(R, .8, wx - .6, .2, .62);
      // front wing
      body(wx, bd - .02, 0, ww, wf - bd + .02, H, wall, m, { base: STONE, corner: cb });
      for (let f = 0; f < P.floors; f++) win('x', bd + .5, wf - .6, w, z0 + f * 2 + .8, z0 + f * 2 + 1.65, { on: r() < .5, trim, shut: P.shut, mull: 'v' });
      const cx = wx + ww / 2;
      if (P.garage) { garage('y', cx - 1.3, cx + 1.3, wf, 0, { trim, c: lt(wall, .3) }); lamp('y', wx + .25, wf, 1.6); }
      else {
        fB('y', cx - 1.05, wf, z0 + .35, 2.1, .3, 1.45, wall, { l: mat0(m, wall) });
        for (let i = 0; i < 3; i++) win('y', cx - .95 + i * .65, cx - .95 + i * .65 + .55, wf + .3, z0 + .6, z0 + 1.65, { on: r() < .8, trim, mull: 'h', sill: false, curt: i === 1 ? null : '#d9e6ee' });
        fB('y', cx - 1.12, wf, z0 + 1.8, 2.24, .36, .12, roof, { t: winter() ? '#f4f8fb' : roof });
      }
      for (let f = 1; f < P.floors; f++) winRow('y', wx + .4, w - .4, wf, z0 + f * 2 + .85, z0 + f * 2 + 1.65, { r, ww: .9, n: 2, trim, shut: P.shut, fbox: true });
      pipe('y', wx + .12, wf, .3, H - .2, dk(trim, .25));
      roofGable(wx, bd - 2.4, H, ww, wf - bd + 2.4, 1.3, 'y', roof, { wall, wmat: m, trim, vent: 'round' });
    },
  }),

  /* ---------------- split-level: raised living wing + two-storey garage wing ---------------- */
  mk({
    id: 'bld.res.splitlevel', tags: ['maplewood', 'home', 'house', 'suburb', 'garage'],
    defs: { w: 10, d: 6, floors: 2, wall: '#e3cfa0', roof: '#565266', trim: '#f6f1e6', doorc: '#2f5d50', mat: 'siding', basec: '#b5654a', shut: null },
    height: P => 4.4 + 1.4,
    doorAt: P => ({ side: 'y', at: P.w - 5.4 }), lightAt: P => ({ x: P.w - 5.4, y: P.d + .3, z: 0, r: 3 }),
    variants: [
      { w: 10, d: 6, seed: 1 },
      { w: 11, d: 6, seed: 2, wall: '#9fb8c8', roof: '#3f4658', basec: '#8d8780', doorc: '#f2cf5a' },
      { w: 10, d: 7, seed: 3, wall: '#f1ede4', roof: '#6a4a4a', basec: '#a85a44', doorc: '#a8343a', shut: '#3d3a48' },
      { w: 10, d: 6, seed: 4, wall: '#b9c79a', roof: '#5a4038', basec: '#c9b89a', doorc: '#7a3b2e' },
      { w: 11, d: 6, seed: 5, wall: '#c98a6a', roof: '#4d4a55', basec: '#8d8780', doorc: '#2b3a55', mat: 'planks' },
    ],
    paint(P, r) {
      const { w, d, wall, roof, trim } = P, m = P.mat, gw = 4.3, wl = w - gw, zf = 1.0, H1 = zf + 2.2, bd = d - 1.2, H2 = 4.4, gd = d - .2, dx = wl - 1.1;
      // raised living wing (left)
      body(0, 0, 0, wl + .1, bd, H1, wall, m, { corner: trim });
      qy(0, wl, bd, 0, zf, PAT.brick(fs('y', P.basec))); lw([0, bd, zf], [wl, bd, zf], dk(P.basec, .5));
      for (let x = .6; x + .8 < dx - 1; x += 1.9) win('y', x, x + .8, bd, .35, .75, { on: r() < .3, trim: false, mull: 'v', sill: false });
      door('y', dx, bd, zf, { c: P.doorc, trim, wreath: true, glass: 'fan', lamp: true });
      win('y', .5, dx - 1.0, bd, zf + .55, zf + 1.6, { on: r() < .85, trim, mull: 'v', shut: P.shut, curt: '#e9c9a0', lights: true, head: true });
      steps('y', dx - .65, dx + .65, bd, zf, 4, STEP, .25);
      fL('y', dx - .65, .25, dx - .65, 1.6, bd + .98, '#3e394c'); lw([dx - .65, bd + .98, 1.0], [dx - .65, bd, zf + .75], '#3e394c'); lw([dx - .65, bd + .98, .85], [dx - .65, bd, zf + .6], '#3e394c');
      if (autumn()) { pumpkin(dx + .5, bd + .6, .5, true); pumpkin(dx + .45, bd + .85, .25); }
      roofGable(0, 0, H1, wl + .3, bd, 1.2, 'x', roof, { wall, wmat: m, trim, behind: () => chimney(wl * .3, bd / 2 - .8, H1 + .4, H1 + 1.9, P.basec === '#b5654a' || P.basec === '#a85a44' ? P.basec : '#8d8580') });
      // two-storey wing (right) with garage below
      body(wl, 0, 0, gw, gd, H2, wall, m, { corner: trim });
      qy(wl, w, gd, 0, 2.2, PAT.brick(fs('y', P.basec))); qx(w, 0, gd, 0, 2.2, PAT.brick(fs('x', P.basec)));
      lw([wl, gd, 2.2], [w, gd, 2.2], lt(P.basec, .3)); lw([w, 0, 2.2], [w, gd, 2.2], dk(P.basec, .4));
      garage('y', wl + .6, w - .6, gd, 0, { trim, c: lt(wall, .35), h: 1.8 });
      lamp('y', wl + .28, gd, 1.7);
      winRow('y', wl + .3, w - .3, gd, 2.95, 3.8, { r, ww: 1.0, n: 2, trim, shut: P.shut, fbox: true });
      win('x', gd * .5 - .5, gd * .5 + .5, w, .9, 1.7, { on: r() < .4, trim, mull: 'v' });
      winRow('x', .5, gd - .5, w, 2.95, 3.8, { r, ww: .9, n: 2, trim, shut: P.shut });
      pipe('y', wl + .14, gd, 0, H2 - .2, dk(trim, .25));
      roofHip(wl, 0, H2, gw, gd, 1.35, roof, { trim });
      if (r() < .6) dish(w - .5, gd * .4, H2 + .5);
    },
  }),

  /* ---------------- ranch: long and low, attached two-car garage ---------------- */
  mk({
    id: 'bld.res.ranch', tags: ['maplewood', 'home', 'house', 'suburb', 'garage'],
    defs: { w: 12, d: 6, floors: 1, wall: '#d9c9a8', roof: '#6a4a4a', trim: '#f6f1e6', doorc: '#a8343a', mat: 'wide', brickc: '#a85a44', shut: '#5a4038' },
    height: P => 2.3 + 1.5,
    doorAt: P => ({ side: 'y', at: P.w - 5.7 }), lightAt: P => ({ x: P.w - 5.7, y: P.d + .2, z: 0, r: 3 }),
    variants: [
      { w: 12, d: 6, seed: 1 },
      { w: 13, d: 6, seed: 2, wall: '#aebfa8', roof: '#4d4a55', brickc: '#8d8780', doorc: '#f2cf5a', shut: '#f6f1e6' },
      { w: 11, d: 6, seed: 3, wall: '#f1ede4', roof: '#3f4658', brickc: '#b5654a', doorc: '#2b3a55', shut: '#2b3a55' },
      { w: 12, d: 7, seed: 4, wall: '#d8a890', roof: '#5a4038', brickc: '#c9b89a', doorc: '#2f5d50', shut: null, mat: 'stucco' },
      { w: 13, d: 6, seed: 5, wall: '#8fa3b5', roof: '#3f3d4a', brickc: '#8d8780', doorc: '#c8683f', shut: '#f6f1e6' },
    ],
    paint(P, r) {
      const { w, d, wall, roof, trim } = P, m = P.mat, z0 = .2, H = 2.3, gw = 4.4, wg = w - gw, bd = d - .9, gd = d - .2, dx = wg - 1.3;
      body(0, 0, 0, wg + .1, bd, H, wall, m, { corner: trim });
      qy(0, wg, bd, 0, z0 + .75, PAT.brick(fs('y', P.brickc))); lw([0, bd, z0 + .75], [wg, bd, z0 + .75], lt(P.brickc, .35));
      door('y', dx, bd, z0, { c: P.doorc, trim, wreath: true, pumpkin: 2, side: true, steps: 1, stepc: STEP, mat: true });
      // picture window + bedroom windows
      win('y', dx - 3.6, dx - 1.3, bd, z0 + .8, z0 + 1.65, { on: r() < .85, trim, mull: 'v', shut: P.shut, curt: '#e9c9a0', lights: true, fbox: true, v: r() });
      if (dx - 3.9 > 1.4) winRow('y', .3, dx - 4.1, bd, z0 + .9, z0 + 1.65, { r, ww: .9, n: dx - 4.4 > 2.6 ? 2 : 1, trim, shut: P.shut });
      const R = roofGable(0, 0, H, wg + .3, bd, 1.15, 'x', roof, { wall, wmat: m, trim, behind: () => chimney(wg * .45, bd / 2 - .9, H + .3, H + 1.9, P.brickc, { w: 1.1 }) });
      // false front gable over the picture window
      roofGable(dx - 4.0, bd - 1.7, H, 3.1, 1.7, .85, 'y', roof, { wall, wmat: m, trim, vent: true, over: .2, rake: .2 });
      if (r() < .5) solar(R, .6, 2.8, .25, .7, 3);
      // garage wing
      body(wg, 0, 0, gw, gd, H + .1, wall, m, { corner: trim });
      qx(w, 0, gd, 0, z0 + .75, PAT.brick(fs('x', P.brickc))); lw([w, 0, z0 + .75], [w, gd, z0 + .75], dk(P.brickc, .2));
      garage('y', wg + .5, w - .5, gd, 0, { trim, c: lt(wall, .4), h: 1.75 });
      lamp('y', wg + .25, gd, 1.6); lamp('y', w - .25, gd, 1.6);
      winRow('x', .6, gd - .6, w, z0 + .95, z0 + 1.65, { r, ww: .9, n: 2, trim, pOn: .3, mull: 'v' });
      roofHip(wg, 0, H + .1, gw, gd, 1.3, roof, { trim });
      if (r() < .5) dish(wg + .5, .6, H + .6);
      pipe('y', wg + .12, gd, 0, H - .2, dk(trim, .25));
    },
  }),

  /* ---------------- duplex: two mirrored homes under one roof ---------------- */
  mk({
    id: 'bld.res.duplex', tags: ['maplewood', 'home', 'house', 'suburb', 'duplex'],
    defs: { w: 10, d: 6, floors: 2, wall: '#e6dcc6', wall2: null, roof: '#565266', trim: '#f6f1e6', doorc: '#2f5d50', doorc2: '#a8343a', mat: 'siding' },
    height: P => .3 + P.floors * 2 + 1.5,
    doorAt: P => ({ side: 'y', at: P.w / 2 - .9 }), lightAt: P => ({ x: P.w / 2, y: P.d + .5, z: 0, r: 3.5 }),
    variants: [
      { w: 10, d: 6, seed: 1 },
      { w: 10, d: 6, seed: 2, wall: '#9fc0d8', wall2: '#ecd28a', roof: '#4a4650', doorc: '#f6f1e6', doorc2: '#3d5a6c' },
      { w: 11, d: 6, seed: 3, wall: '#b5654a', roof: '#3f3d4a', mat: 'brick', doorc: '#2a2a35', doorc2: '#f2cf5a' },
      { w: 10, d: 7, seed: 4, wall: '#a9c2a0', wall2: '#e6b0a2', roof: '#6a4a4a', doorc: '#7a3b2e', doorc2: '#f6f1e6' },
      { w: 11, d: 6, seed: 5, wall: '#f1ede4', roof: '#56708a', doorc: '#56708a', doorc2: '#c8683f', mat: 'stucco' },
    ],
    paint(P, r) {
      const { w, d, roof, trim } = P, m = P.mat, z0 = .3, H = z0 + P.floors * 2, bd = d - .8, c = w / 2, wa = P.wall, wb = P.wall2 || P.wall, rh = 1.45, gw = 2.9;
      body(0, 0, 0, c, bd, H, wa, m, { base: STONE });
      body(c, 0, 0, c, bd, H, wb, m, { base: STONE, corner: m === 'siding' ? trim : null });
      for (let f = 0; f < P.floors; f++) winRow('x', .4, bd - .4, w, z0 + f * 2 + .8, z0 + f * 2 + 1.65, { r, ww: .85, n: 2, trim });
      porch(c - 2.3, c + 2.3, bd, .8, z0, { roofc: roof, post: trim, posts: 5, gap: [c - 1.5, c + 1.5], sidewall: wb, rail: true, lights: true }, () => {
        door('y', c - .9, bd, z0, { c: P.doorc, trim, wreath: true, pumpkin: 1, mat: '#5a7a4a' });
        door('y', c + .9, bd, z0, { c: P.doorc2, trim, pumpkin: 2, mat: '#8a5a3c', glass: 'fan' });
        fQ('y', c - .06, c + .06, bd + .4, z0, z0 + 2.2, fs('y', trim));
      });
      steps('y', c - 1.5, c + 1.5, d, z0, 2, STEP, .15);
      win('y', .5, 1.9, bd, z0 + .7, z0 + 1.65, { on: r() < .8, trim, mull: 'v', fbox: true, v: r(), curt: '#e9c9a0' });
      win('y', w - 1.9, w - .5, bd, z0 + .7, z0 + 1.65, { on: r() < .8, trim, mull: 'v', shut: dk(wb, .45), curt: '#c9d6e8' });
      for (let f = 1; f < P.floors; f++) {
        winRow('y', .3, c - .2, bd, z0 + f * 2 + .85, z0 + f * 2 + 1.65, { r, ww: .9, n: 2, trim, wreath: true });
        winRow('y', c + .2, w - .3, bd, z0 + f * 2 + .85, z0 + f * 2 + 1.65, { r, ww: .9, n: 2, trim, fbox: true });
      }
      pipe('y', c - .04, bd, 3.1, H - .1, dk(trim, .3));
      roofGable(0, 0, H, w, bd, rh, 'x', roof, { wall: wb, wmat: m, trim, vent: true, behind: () => { chimney(c - 1.6, bd / 2 - .8, H + .7, H + rh + .6); chimney(c + 1.0, bd / 2 - .8, H + .7, H + rh + .6); } });
      roofGable(.25, bd - 2.0, H, gw, 2.0, 1.0, 'y', roof, { wall: wa, wmat: m, trim, vent: 'round', over: .15, rake: .2 });
      roofGable(w - gw - .25, bd - 2.0, H, gw, 2.0, 1.0, 'y', roof, { wall: wb, wmat: m, trim, vent: 'round', over: .15, rake: .2 });
      if (r() < .6) dish(c + .4, bd / 2 + .3, H + rh * .6);
    },
  }),

  /* ---------------- the sibling's family house (story location) ---------------- */
  mk({
    id: 'bld.res.sibling', tags: ['maplewood', 'home', 'house', 'story', 'sibling', 'garage'],
    defs: { w: 10, d: 7, floors: 2, wall: '#f0cf7e', roof: '#7a4a3c', trim: '#fbf6ea', doorc: '#b8343a', mat: 'siding', shut: '#4f7560', num: '12' },
    height: P => .3 + 4 + 1.6,
    doorAt: P => ({ side: 'y', at: 2.1 }), lightAt: P => ({ x: 2.1, y: P.d + .5, z: 0, r: 4 }),
    variants: [
      { w: 10, d: 7, seed: 1 },
      { w: 11, d: 7, seed: 2 },
      { w: 10, d: 7, seed: 3, wall: '#f4dfa8', roof: '#5a4a52', shut: '#a8503c' },
    ],
    paint(P, r) {
      const { w, d, wall, roof, trim } = P, m = P.mat, z0 = .3, H = 4.3, pd = .9, bd = d - pd, mw = w - 3.4, gd = d - .3, gH = 2.4, rh = 1.6;
      // main two-storey body
      body(0, 0, 0, mw, bd, H, wall, m, { base: STONE, corner: trim });
      win('x', .6, 1.5, mw, z0 + 2.85, z0 + 3.65, { on: true, trim, shut: P.shut });
      win('x', bd - 1.5, bd - .6, mw, z0 + 2.85, z0 + 3.65, { on: r() < .5, trim, shut: P.shut });
      porch(0, mw, bd, pd, z0, { roofc: roof, post: trim, posts: 4, gap: [1.5, 2.7], sidewall: wall, lights: true, kind: 'shingle' }, () => {
        door('y', 2.1, bd, z0, { c: P.doorc, trim, wreath: true, mat: '#5a7a4a', side: true, glass: 'fan' });
        textY(P.num, 3.25, bd, z0 + 1.55, '#4a4458');
        win('y', .3, 1.0, bd, z0 + .75, z0 + 1.65, { on: true, trim, mull: 'v' });
        win('y', 3.9, mw - .5, bd, z0 + .7, z0 + 1.65, { on: true, trim, shut: P.shut, curt: '#f2b8a0', mull: 'cross' });
        swing('y', 4.1, mw - .7, bd, z0 + .42, z0 + 2.5, trim, '#d8443a');
        pot(.45, bd + .45, z0, bloom(.3) || leafy(.3), .2);
      });
      steps('y', 1.5, 2.7, d, z0, 2, STEP, .15);
      if (autumn()) { pumpkin(1.3, d - .12, z0, true); pumpkin(2.9, d - .12, z0, true); pumpkin(3.15, d - .05, z0); }
      winRow('y', .4, mw - .4, bd, z0 + 2.85, z0 + 3.65, { r, ww: .95, n: 3, trim, shut: P.shut, fbox: true, pOn: .9, wreath: true, curt: '#f4f0e8' });
      pipe('y', .16, bd, 3.2, H - .2, dk(trim, .25));
      const R = roofGable(0, 0, H, mw, bd, rh, 'x', roof, { wall, wmat: m, trim, vent: 'round', behind: () => chimney(mw * .22, bd / 2 - .8, H + .6, H + rh + .7, '#a85a44', { pots: 2 }) });
      dormer(R, mw * .62, .6, .95, { wall, trim, on: true, w: 1.4 });
      if (winter()) fairy([-.2, bd + .2, H - .12], [mw + .2, bd + .2, H - .12], { sag: 2, waves: 5 });
      // kids' bikes parked against the porch
      bike('y', 3.2, d + .02, 0, '#e0457a', .7); bike('y', 4.0, d + .06, 0, '#3a8ad8', .8);
      // garage wing with the basketball hoop
      body(mw, .8, 0, 3.4, gd - .8, gH, wall, m, { corner: trim });
      garage('y', mw + .45, w - .45, gd, 0, { trim, c: '#f6efe0', h: 1.75 });
      win('x', 1.6, 2.6, w, 1.0, 1.75, { on: r() < .5, trim, mull: 'v' });
      roofGable(mw, .8, gH, 3.4, gd - .8, 1.0, 'y', roof, { wall, wmat: m, trim, over: .15 });
      hoop('y', mw + 1.7, gd, gH + .1);
      lamp('y', mw + .22, gd, 1.6);
      if (winter()) fairy([mw, gd + .22, gH], [mw + 1.7, gd + .22, gH + 1], { sag: 0 });
    },
  }),
];
function mat0(m, c) { return m === 'brick' ? PAT.brick(dk(c, .18)) : m === 'stucco' ? PAT.stucco(dk(c, .18)) : PAT.siding(dk(c, .18), 3); }
