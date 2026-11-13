// Maplewood civic & mixed buildings: elementary school (landmark), church / community hall, corner store with a flat above.
import { box, qy, qx, qz, lw, fq, cyl, cone, ball, dk, lt, mix, glow, lit, PAT, hash2, signY, signX, textY } from '../../engine/raster.js';
import {
  mk, body, win, winRow, door, steps, roofGable, roofHip, roofFlat, chimney, dish, antenna, pipe, lamp, rail, hood,
  fairy, pumpkin, pot, bloom, leafy, winter, autumn, spring, snowTop, fs, fQ, fL, fB, pt, disc, ring, W, bike, pick, mat, SNOW, wreath,
} from './_lib.js';

const STEP = '#c9c3b5';
function clock(s, a, pl, z, rr) {
  disc(s, a, pl, z, rr + .1, '#3a3440'); disc(s, a, pl, z, rr, '#f8f4e6'); glow(() => disc(s, a, pl, z, rr, '#fff2c4'));
  for (let i = 0; i < 12; i++) { const t = i / 12 * Math.PI * 2, q = pt(s, a + Math.cos(t) * rr * .82, pl, z + Math.sin(t) * rr * .82); fq([q, q], '#000'); lw(q, q, '#3a3440'); }
  lw(pt(s, a, pl, z), pt(s, a - rr * .45, pl, z + rr * .35), '#2a2430'); lw(pt(s, a, pl, z), pt(s, a + rr * .35, pl, z + rr * .65), '#2a2430');
}
function flag(x, y, z, h, c1 = '#d8343a', c2 = '#f8f4e6') {
  lw([x, y, z], [x, y, z + h], '#8a8e9a'); lw([x + .04, y, z], [x + .04, y, z + h], '#5a5e6a'); ball(x, y, z + h, .08, '#e8c860', { ol: false });
  const P = (a, b) => [x + a, y, z + h - .1 - b + Math.sin(a * 4) * .06];
  for (let i = 0; i < 6; i++) { const a = i * .2, b = a + .2, c = i < 2 || i > 3 ? c1 : c2; fq([P(a, 0), P(b, 0), P(b, .65), P(a, .65)], fs('y', c)); }
  fq([P(.5, .2), P(.7, .2), P(.7, .45), P(.5, .45)], fs('y', c1)); lw(P(0, .65), P(1.2, .65), dk(c1, .5)); lw(P(1.2, 0), P(1.2, .65), dk(c1, .5)); lw(P(0, 0), P(1.2, 0), dk(c1, .4));
}
/** striped shop awning on face s */
function awning(s, a0, a1, pl, z, dp, drop, c1, c2 = '#f4f0e8') {
  const n = Math.max(2, Math.round((a1 - a0) / .3)), st = (a1 - a0) / n;
  for (let i = 0; i < n; i++) { const c = i % 2 ? c2 : c1; fq([pt(s, a0 + i * st, pl, z), pt(s, a0 + (i + 1) * st, pl, z), pt(s, a0 + (i + 1) * st, pl + dp, z - drop), pt(s, a0 + i * st, pl + dp, z - drop)], winter() && i % 3 === 0 ? SNOW : c); fQ(s, a0 + i * st, a0 + (i + 1) * st, pl + dp, z - drop - .16, z - drop, fs(s, c)); }
  lw(pt(s, a0, pl + dp, z - drop - .16), pt(s, a1, pl + dp, z - drop - .16), dk(c1, .55)); lw(pt(s, a0, pl + dp, z - drop), pt(s, a1, pl + dp, z - drop), dk(c1, .3)); lw(pt(s, a0, pl, z), pt(s, a1, pl, z), dk(c1, .55));
  lw(pt(s, a1, pl, z), pt(s, a1, pl + dp, z - drop), dk(c1, .55)); lw(pt(s, a0, pl, z), pt(s, a0, pl + dp, z - drop), dk(c1, .55));
}
function crate(x, y, z, cols) { box(x, y, z, .6, .45, .3, '#b08a5a'); for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { const c = cols[(i + j) % cols.length]; fq([[x + .08 + i * .17, y + .1 + j * .17, z + .34], [x + .2 + i * .17, y + .1 + j * .17, z + .34], [x + .2 + i * .17, y + .22 + j * .17, z + .34], [x + .08 + i * .17, y + .22 + j * .17, z + .34]], c); } }
function stained(s, a0, a1, pl, z0, z1, seed, on) {
  const m = (a0 + a1) / 2, rr = (a1 - a0) / 2, cols = ['#d8443a', '#3a78c8', '#e8b63a', '#3aa87a', '#8a5ac8'];
  disc(s, m, pl, z1, rr + .08, fs(s, '#f4ead8')); fQ(s, a0 - .08, a1 + .08, pl, z0 - .08, z1, fs(s, '#f4ead8')); disc(s, m, pl, z1, rr, '#3a3440');
  const fn = (u, v) => { const k = hash2(Math.floor((u + v) / 3), Math.floor((u - v + 40) / 3), seed); return (u + v) % 3 === 0 || (u - v + 40) % 3 === 0 ? '#3a3440' : cols[Math.floor(k * 5)]; };
  const dim = (u, v) => { const c = fn(u, v); return c === '#3a3440' ? c : dk(c, .35); };
  fQ(s, a0, a1, pl, z0, z1, dim); disc(s, m, pl, z1, rr - .06, dk(cols[seed % 5], .3), dk(cols[(seed + 2) % 5], .3));
  if (on) glow(() => { fQ(s, a0, a1, pl, z0, z1, (u, v) => { const c = fn(u, v); return c === '#3a3440' ? '#5a3a30' : lt(c, .25); }); disc(s, m, pl, z1, rr - .06, lt(cols[seed % 5], .3), lt(cols[(seed + 2) % 5], .3)); });
  fL(s, a0, z0, a0, z1, pl, '#3a3440'); fL(s, a1, z0, a1, z1, pl, '#3a3440'); fL(s, a0, z0, a1, z0, pl, '#3a3440');
}

export default [
  /* ---------------- Maplewood elementary school (landmark) ---------------- */
  mk({
    id: 'bld.res.school', tags: ['maplewood', 'school', 'landmark', 'civic'], landmark: true, top: 3.2,
    defs: { w: 18, d: 10, floors: 2, wall: '#b5654a', roof: '#4d4a55', trim: '#f4ead8', doorc: '#2f5d50', mat: 'brick', name: 'MAPLEWOOD SCHOOL' },
    height: P => .5 + P.floors * 2.2 + 1.6,
    doorAt: P => ({ side: 'y', at: P.w / 2 }), lightAt: P => ({ x: P.w / 2, y: P.d + .2, z: 0, r: 5 }),
    variants: [
      { w: 18, d: 10, seed: 1 },
      { w: 20, d: 10, seed: 2, wall: '#d9c08a', roof: '#6a4a4a', doorc: '#a8343a', mat: 'stucco', name: 'HILLCREST ACADEMY' },
      { w: 16, d: 10, seed: 3, wall: '#a8553f', roof: '#3f4658', doorc: '#2b3a55', name: 'BAY ELEMENTARY' },
      { w: 18, d: 10, seed: 4, floors: 3, wall: '#c98a6a', roof: '#4a4650', doorc: '#e8c23a', name: 'MAPLE BAY HIGH' },
    ],
    paint(P, r) {
      const { w, d, wall, roof, trim } = P, m = P.mat, z0 = .5, fh = 2.2, fl = P.floors, H = z0 + fl * fh, bd = d - 2.2, c = w / 2, cw = 5.2, cx0 = c - cw / 2, cf = bd + 1.2, art = ['#e8b63a', '#d8443a', '#3a78c8', '#3aa87a', '#f4f0e8', '#e88ab0'];
      body(0, 0, 0, w, bd, H, wall, m, { base: '#a8a092', baseH: .5, band: [H - .12, z0 + fh], bandc: trim });
      const cls = (s, a0, a1, pl) => { for (let f = 0; f < fl; f++) winRow(s, a0, a1, pl, z0 + f * fh + .7, z0 + f * fh + 1.75, { r, ww: 1.15, pitch: 1.75, trim, mull: 'cross', head: true, pOn: .18, each: (i, o) => { o.art = r(); return o; } }); };
      const paper = (s, a0, a1, pl) => { for (let f = 0; f < fl; f++) { const n = Math.max(1, Math.floor((a1 - a0) / 1.75)), gap = (a1 - a0 - n * 1.15) / n; for (let i = 0; i < n; i++) { const a = a0 + gap / 2 + i * (1.15 + gap), zz = z0 + f * fh + .74; for (let k = 0; k < 4; k++) if (hash2(i * 7 + k, f + (s === 'y' ? 0 : 9), P.seed) > .45) { const cc = autumn() ? ['#e08a2c', '#c9552b', '#e8b63a'][k % 3] : winter() ? '#f4f8fb' : art[Math.floor(hash2(i, k + f * 3, P.seed + 1) * art.length)]; fQ(s, a + .1 + k * .26, a + .28 + k * .26, pl, zz + .02 + (k % 2) * .1, zz + .22 + (k % 2) * .1, fs(s, cc)); } } } };
      cls('x', .5, bd - .5, w); paper('x', .5, bd - .5, w);
      cls('y', .4, cx0 - .2, bd); paper('y', .4, cx0 - .2, bd); cls('y', cx0 + cw + .2, w - .4, bd); paper('y', cx0 + cw + .2, w - .4, bd);
      pipe('y', .2, bd, .5, H - .2, dk(trim, .3)); pipe('y', w - .26, bd, .5, H - .2, dk(trim, .3));
      bike('y', w - 3.2, bd + .12, 0, '#3a78c8', .8); bike('y', w - 2.5, bd + .16, 0, '#e8b63a', .75); bike('y', w - 1.8, bd + .12, 0, '#d8443a', .8);
      roofHip(0, 0, H, w, bd, 1.5, roof, { trim, over: .25, inset: .35, behind: () => { chimney(2, bd / 2 - .6, H + .3, H + 2.2, '#8f4838', { w: .7 }); } });
      // central entrance block
      body(cx0, bd - .02, 0, cw, cf - bd + .02, H, wall, m, { base: '#a8a092', baseH: .5, band: [H - .12], bandc: trim });
      for (let z = .6; z < H - .3; z += .5) { qy(cx0 + cw - .3, cx0 + cw, cf, z, z + .25, fs('y', trim)); qy(cx0, cx0 + .3, cf, z, z + .25, fs('y', trim)); qx(cx0 + cw, cf - .3, cf, z, z + .25, fs('x', trim)); }
      door('y', c, cf, z0, { c: P.doorc, trim, w: 1.7, h: 1.85, dbl: true, glass: 'top', lamp: false, wreath: true });
      lamp('y', c - 1.35, cf, z0 + 1.5, { r: 7 }); lamp('y', c + 1.35, cf, z0 + 1.5, { r: 7 });
      const sw = (P.name.length * 4 + 7) / 32;
      signY(P.name, c - Math.min(sw, cw / 2 - .1), c + Math.min(sw, cw / 2 - .1), cf + .02, z0 + 2.15, z0 + 2.65, trim, '#3a3440');
      for (let f = 1; f < fl; f++) winRow('y', cx0 + .5, cx0 + cw - .5, cf, z0 + f * fh + .75, z0 + f * fh + 1.75, { r, ww: 1.0, n: 3, trim, head: true, pOn: .4 });
      for (const k of [-1, 1]) win('y', c + k * 1.95 - .35, c + k * 1.95 + .35, cf, z0 + .7, z0 + 1.7, { on: r() < .5, trim, mull: 'h', head: true });
      win('x', bd + .25, cf - .25, cx0 + cw, z0 + .7, z0 + 1.7, { on: false, trim, mull: 'h' });
      steps('y', c - 1.8, c + 1.8, cf, z0, 3, STEP, .28);
      if (autumn()) { pumpkin(c - 1.5, cf + .25, z0 * .66, true); pumpkin(c + 1.5, cf + .25, z0 * .66, true); }
      if (winter()) fairy([cx0, cf + .02, z0 + 2.05], [cx0 + cw, cf + .02, z0 + 2.05], { sag: 2, waves: 4 });
      roofGable(cx0, bd - 2.6, H, cw, cf - bd + 2.6, 1.7, 'y', roof, { wall, wmat: m, trim, over: .2, rake: .25 });
      clock('y', c, cf, H + .68, .52);
      // cupola + flag
      const ux = c - .7, uy = bd - 2.0, uz = H + 1.45;
      box(ux, uy, uz - .5, 1.4, 1.4, 1.5, trim, { l: PAT.siding(dk(trim, .18), 3), r: PAT.siding(dk(trim, .36), 3) });
      qy(ux + .35, ux + 1.05, uy + 1.4, uz + .1, uz + .8, PAT.siding('#5a5662', 2)); qx(ux + 1.4, uy + .35, uy + 1.05, uz + .1, uz + .8, PAT.siding('#4a4652', 2));
      roofHip(ux, uy, uz + 1.0, 1.4, 1.4, 1.1, '#4f7f6a', { over: .15, kind: 'metal', trim });
      flag(ux + .7, uy + .7, uz + 2.1, 2.3);
    },
  }),

  /* ---------------- small church / community hall ---------------- */
  mk({
    id: 'bld.res.church', tags: ['maplewood', 'church', 'community', 'hall', 'civic', 'landmark'], top: 1.2,
    defs: { w: 7, d: 11, floors: 1, wall: '#f4f1ea', roof: '#4d4a55', trim: '#fbf8f0', doorc: '#a8343a', mat: 'siding', spire: '#4f7f6a', name: 'COMMUNITY HALL' },
    height: P => 7.2 + 3.6,
    doorAt: P => ({ side: 'y', at: 2.6 + (P.w - 2.6) / 2 }), lightAt: P => ({ x: 2.6 + (P.w - 2.6) / 2, y: P.d + .3, z: 0, r: 4 }),
    variants: [
      { w: 7, d: 11, seed: 1 },
      { w: 8, d: 12, seed: 2, wall: '#b5654a', mat: 'brick', roof: '#3f3d4a', doorc: '#2f5d50', spire: '#3f3d4a', name: 'ST. MAPLE' },
      { w: 7, d: 10, seed: 3, wall: '#c9b89a', mat: 'stone', roof: '#6a4a4a', doorc: '#5a3a2a', spire: '#6a4a4a', name: 'OLD CHAPEL' },
      { w: 8, d: 11, seed: 4, wall: '#ecd28a', roof: '#565266', doorc: '#3d5a6c', spire: '#565266', name: 'BAY FELLOWSHIP' },
    ],
    paint(P, r) {
      const { w, d, wall, roof, trim } = P, m = P.mat, z0 = .4, H = 3.6, bd = d - 1.2, tw = 2.6, rh = (w) * .42, cx = tw + (w - tw) / 2, HT = 7.2, lit1 = r() < .75;
      body(0, 0, 0, w, bd, H, wall, m, { base: '#9a948c', baseH: .4, corner: m === 'siding' ? trim : null });
      const nw = Math.max(3, Math.floor((bd - 1) / 2));
      for (let i = 0; i < nw; i++) { const y = .6 + i * (bd - 1.2) / nw + ((bd - 1.2) / nw - 1) / 2; stained('x', y, y + 1.0, w, z0 + .9, z0 + 2.2, P.seed * 3 + i, lit1); }
      // front
      const dw = 1.5;
      disc('y', cx, bd, z0 + 1.7, dw / 2 + .14, fs('y', trim)); fQ('y', cx - dw / 2 - .14, cx + dw / 2 + .14, bd, z0, z0 + 1.7, fs('y', trim));
      disc('y', cx, bd, z0 + 1.7, dw / 2, fs('y', P.doorc)); fQ('y', cx - dw / 2, cx + dw / 2, bd, z0, z0 + 1.7, PAT.planks(fs('y', P.doorc), 3)); fL('y', cx, z0, cx, z0 + 1.7 + dw / 2, bd, dk(P.doorc, .6));
      fL('y', cx - dw / 2, z0, cx - dw / 2, z0 + 1.7, bd, dk(P.doorc, .6)); fL('y', cx + dw / 2, z0, cx + dw / 2, z0 + 1.7, bd, dk(P.doorc, .6)); lw([cx - .1, bd, z0 + .8], [cx - .1, bd, z0 + .95], '#f6d870'); lw([cx + .1, bd, z0 + .8], [cx + .1, bd, z0 + .95], '#f6d870');
      lamp('y', cx + 1.25, bd, z0 + 1.5); if (winter()) wreath('y', cx, bd, z0 + 1.75, .24);
      steps('y', cx - 1.2, cx + 1.2, bd, z0, 3, STEP, .25);
      if (autumn()) { pumpkin(cx - 1.0, bd + .2, z0 * .66, true); pumpkin(cx + 1.05, bd + .22, z0 * .66); }
      // notice board
      fQ('y', w - 1.25, w - .2, bd, z0 + .7, z0 + 1.6, fs('y', '#3d5a48')); fQ('y', w - 1.18, w - .27, bd, z0 + .77, z0 + 1.53, '#f4f0e8'); for (let k = 0; k < 4; k++) fL('y', w - 1.1, z0 + .9 + k * .16, w - .4 - (k % 2) * .2, z0 + .9 + k * .16, bd, '#8a8a96');
      const sw = Math.min((w - tw) / 2 - .1, (P.name.length * 4 + 5) / 32);
      roofGable(0, 0, H, w, bd, rh, 'y', roof, { wall, wmat: m, trim, over: .25, rake: .25 });
      // rose window + name in the gable
      const rz = H + rh * .12 + .4;
      disc('y', cx + .1, bd, rz, .62, fs('y', trim)); disc('y', cx + .1, bd, rz, .52, '#3a3440'); disc('y', cx + .1, bd, rz, .44, '#3a78c8', '#8a5ac8'); glow(() => disc('y', cx + .1, bd, rz, .44, '#ffd98a', '#ff9a6a')); for (let i = 0; i < 4; i++) { const t = i / 4 * Math.PI; lw([cx + .1 + Math.cos(t) * .44, bd, rz + Math.sin(t) * .44], [cx + .1 - Math.cos(t) * .44, bd, rz - Math.sin(t) * .44], '#3a3440'); }
      signY(P.name, cx - sw, cx + sw, bd + .02, z0 + 2.75, z0 + 3.2, dk(wall, .1) === wall ? '#fff' : lt(wall, .5), '#3a3440');
      // tower + spire
      const ty0 = bd - tw + .4;
      body(0, ty0, 0, tw, tw, HT, wall, m, { base: '#9a948c', baseH: .4, corner: m === 'siding' ? trim : null, band: [HT - 1.9, HT - .1], bandc: trim });
      win('y', .85, 1.75, bd + .4, z0 + .8, z0 + 2.0, { on: lit1, trim, mull: 'cross', head: true });
      win('y', .95, 1.65, bd + .4, 3.6, 4.6, { on: r() < .4, trim, mull: 'h' });
      for (const s of ['y', 'x']) { const pl = s === 'y' ? bd + .4 : tw, a = s === 'y' ? 0 : ty0; disc(s, a + tw / 2, pl, HT - .75, .5, fs(s, trim)); fQ(s, a + tw / 2 - .5, a + tw / 2 + .5, pl, HT - 1.6, HT - .75, fs(s, trim)); disc(s, a + tw / 2, pl, HT - .75, .4, '#3a3440'); fQ(s, a + tw / 2 - .4, a + tw / 2 + .4, pl, HT - 1.55, HT - .75, PAT.siding('#4a4652', 2)); }
      ball(tw / 2 + .2, ty0 + tw / 2 + .2, HT - 1.2, .001, '#000', { ol: false });
      roofHip(0, ty0, HT, tw, tw, 3.2, P.spire, { over: .2, kind: 'shingle', trim });
      const sx = tw / 2, sy = ty0 + tw / 2, sz = HT + 3.2;
      lw([sx, sy, sz], [sx, sy, sz + .9], '#e8c860'); lw([sx - .25, sy, sz + .6], [sx + .25, sy, sz + .6], '#e8c860'); lw([sx + .03, sy, sz], [sx + .03, sy, sz + .9], '#b98a2c');
      if (winter()) fairy([tw, bd + .22, H - .1], [cx, bd + .22, H + rh * .9], { sag: 0 });
    },
  }),

  /* ---------------- corner store with a flat above ---------------- */
  mk({
    id: 'bld.res.cornerstore', tags: ['maplewood', 'shop', 'cornerstore', 'store', 'home', 'corner'],
    defs: { w: 7, d: 7, floors: 2, wall: '#e9dcc0', roof: '#6a4a4a', trim: '#f6f1e6', doorc: '#2f5d50', mat: 'siding', awn: '#2f8a6a', name: 'CORNER STORE' },
    height: P => 3 + (P.floors - 1) * 2 + 1.6,
    doorAt: P => ({ side: 'y', at: 1.3 }), lightAt: P => ({ x: 2.5, y: P.d + .3, z: 0, r: 4.5 }),
    variants: [
      { w: 7, d: 7, seed: 1 },
      { w: 8, d: 7, seed: 2, wall: '#b5654a', mat: 'brick', roof: '#3f3d4a', awn: '#d8443a', doorc: '#2a2a35', name: "SAL'S MARKET" },
      { w: 7, d: 6, seed: 3, wall: '#9fc0d8', roof: '#4a5568', awn: '#e8b63a', doorc: '#a8343a', name: 'MINI MART' },
      { w: 8, d: 8, seed: 4, wall: '#f2cf7a', roof: '#565266', awn: '#3a78c8', doorc: '#3a78c8', name: 'MAPLE GROCER', floors: 3 },
      { w: 7, d: 7, seed: 5, wall: '#dba59a', mat: 'stucco', roof: '#5a4038', awn: '#7a3b6a', doorc: '#5a2a4a', name: 'CORNER DELI' },
    ],
    paint(P, r) {
      const { w, d, wall, roof, trim } = P, m = P.mat, g = 3, fl = P.floors, H = g + (fl - 1) * 2, bd = d - .7, fr = '#3a3440', base = dk(P.awn, .45);
      body(0, 0, 0, w, bd, H, wall, m, { corner: m === 'siding' ? trim : null });
      // shopfront: dark timber frame on both street faces
      qy(0, w, bd, 0, g - .5, fs('y', base)); qx(w, 0, bd, 0, g - .5, fs('x', base));
      door('y', 1.3, bd, .1, { c: P.doorc, trim, glass: 'full', h: 1.75, wreath: true, lamp: false });
      W('y', 2.2, w - .35, bd, .7, 1.95, { on: true, mullion: null, frame: fr, glowc: ['#ffe9b0', '#ffd98a'] }); for (let x = 2.2 + (w - 2.55) / 3; x < w - .5; x += (w - 2.55) / 3) lw([x, bd, .7], [x, bd, 1.95], fr);
      W('x', bd - 3.4, bd - .35, w, .7, 1.95, { on: true, mullion: 'v', frame: fr, glowc: ['#f4d890', '#e8c070'] });
      // window dressing: shelves, posters, OPEN sign
      for (let x = 2.35; x < w - .7; x += .3) { const cc = pick(r, ['#d8443a', '#e8b63a', '#3aa87a', '#f4f0e8', '#3a78c8', '#e88ab0']); qy(x, x + .2, bd + .01, .75, .98 + (hash2(Math.floor(x * 9), 2, P.seed) > .5 ? .12 : 0), cc); }
      lw([2.2, bd + .01, 1.25], [w - .35, bd + .01, 1.25], '#8a6a4a'); for (let x = 2.4; x < w - .7; x += .42) qy(x, x + .22, bd + .01, 1.27, 1.5, pick(r, ['#c8683f', '#6aa8e0', '#f2cf5a', '#8fd08a']));
      lit(() => { qy(w - 1.35, w - .5, bd + .01, 1.55, 1.88, '#2a1f35'); textY('OPEN', w - 1.32, bd + .01, 1.82, '#ff6a5a'); });
      qx(w + .01, bd - 3.1, bd - 2.5, .9, 1.7, '#f4f0e8'); qx(w + .01, bd - 3.05, bd - 2.55, 1.25, 1.65, '#d8443a'); qx(w + .01, bd - 2.3, bd - 1.7, .85, 1.75, '#e8b63a'); qx(w + .01, bd - 2.25, bd - 1.75, .9, 1.2, '#3a78c8');
      wallQ2(bd, w, base);
      // sign fascia + awnings
      const sw = Math.min(w / 2 - .2, (P.name.length * 4 + 9) / 32);
      qy(0, w, bd, g - .5, g - .42, fs('y', trim)); qx(w, 0, bd, g - .5, g - .42, fs('x', trim));
      awning('y', .5, w - .1, bd, g - .62, .5, .32, P.awn); awning('x', bd - 3.7, bd - .1, w, g - .62, .5, .32, P.awn);
      signY(P.name, w / 2 - sw, w / 2 + sw, bd + .03, g - .38, g + .16, '#2a2430', '#ffe9b0', { lit: true });
      lamp('y', .5, bd, 1.6);
      // out front: crates, ice chest, newspaper box
      crate(2.3, bd + .05, 0, ['#d8443a', '#e8842a']); crate(3.0, bd + .05, 0, ['#8fd08a', '#f2cf5a']); if (w > 7) crate(3.7, bd + .05, 0, ['#e8842a', '#b77fe0']);
      if (autumn()) { pumpkin(w - 2.2, bd + .35, 0, true); pumpkin(w - 1.8, bd + .45, 0, true); pumpkin(w - 2.0, bd + .25, 0); }
      box(w - 1.4, bd + .05, 0, .9, .5, .75, '#e9eef4', { t: '#c9d2dc' }); textY('ICE', w - 1.28, bd + .56, .6, '#3a78c8');
      box(.25, bd + .05, 0, .4, .4, .8, '#d8443a'); qy(.3, .6, bd + .46, .35, .65, '#f4f0e8');
      // flat above
      for (let f = 1; f < fl; f++) {
        const fz = g + (f - 1) * 2;
        winRow('y', .4, w - .4, bd, fz + .6, fz + 1.5, { r, ww: .95, n: w >= 8 ? 3 : 2, trim, fbox: f === 1, pOn: .7, curt: '#e9c9a0', head: true, wreath: true });
        winRow('x', .5, bd - .5, w, fz + .6, fz + 1.5, { r, ww: .9, n: 2, trim, pOn: .6, head: true });
      }
      pipe('x', .3, w, g - .4, H - .2, dk(wall, .45));
      if (winter()) fairy([0, bd + .52, g - .95], [w, bd + .52, g - .95], { sag: 1 });
      const R = roofHip(0, 0, H, w, bd, 1.4, roof, { trim, over: .25, behind: () => chimney(w * .25, bd / 2 - .6, H + .4, H + 2.0, '#8f4838', { pots: 1 }) });
      dish(w - .6, bd * .3, H + .45);
    },
  }),
];
function wallQ2(bd, w, base) { qy(0, w, bd, 0, .6, fs('y', base)); for (let x = .25; x < w - .2; x += .9) { qy(x, x + .7, bd, .1, .5, fs('y', lt(base, .12))); } qx(w, 0, bd, 0, .6, fs('x', base)); qy(.75, 1.85, bd, .0, .12, '#8d8780'); }
