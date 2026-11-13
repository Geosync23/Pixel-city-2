// Hillcrest: modern flat-roof villa, mediterranean villa, columned mansion, cliffside stilt house, glass pavilion house.
import { box, qy, qx, qz, lw, fq, cyl, cone, ball, dk, lt, mix, glow, PAT, hash2 } from '../../engine/raster.js';
import {
  mk, body, win, winRow, door, garage, steps, roofGable, roofHip, roofFlat, roofShed, chimney, dish, pipe, lamp, rail, balcony,
  fairy, pumpkin, pot, bloom, leafy, winter, autumn, summer, spring, snowTop, wallQ, fs, fQ, fL, fB, pt, disc, W, wreath, SNOW,
} from './_lib.js';

/** floor-to-ceiling glazing made of panels; warm lantern glow at night */
function glassWall(s, a0, a1, pl, z0, z1, o) {
  o = o || {}; const pw = o.panel || 1, fr = o.frame || '#33333f', g = fs(s, o.tint || '#a6d8ea'), g2 = lt(g, .22), g3 = dk(g, .12);
  fQ(s, a0, a1, pl, z0, z1, (u, v) => { const k = (u + v * 2) % 46; return k < 5 ? g2 : k > 30 && k < 34 ? g2 : v < 5 ? g3 : g; });
  if (o.on !== false) glow(() => { fQ(s, a0, a1, pl, z0, z1, '#ffdf9a', '#f6c874'); if (o.blind) fQ(s, a0, a1, pl, z1 - o.blind, z1, '#ffeec4'); });
  const n = Math.max(1, Math.round((a1 - a0) / pw));
  for (let i = 0; i <= n; i++) { const a = a0 + i * (a1 - a0) / n; fL(s, a, z0, a, z1, pl, fr); if (o.on !== false) glow(() => fL(s, a, z0, a, z1, pl, '#8a6a3a')); }
  fL(s, a0, z0, a1, z0, pl, fr); fL(s, a0, z1, a1, z1, pl, fr); if (o.mid) fL(s, a0, z0 + o.mid, a1, z0 + o.mid, pl, fr);
}
function pool(x0, x1, y0, y1, z, rim = '#e9e4d8') {
  qz(x0 - .2, x1 + .2, y0 - .2, y1 + .2, z + .02, rim, dk(rim, .05));
  if (winter()) { qz(x0, x1, y0, y1, z + .02, '#3f5f80', '#456888'); snowTop(x0 + .3, x1 - .3, y0 + .2, y1 - .2, z + .03); }
  else { qz(x0, x1, y0, y1, z + .02, (wx, wy) => { const k = hash2(Math.floor(wx * 4 + wy * 2), Math.floor(wy * 5), 4); return k > .86 ? '#b6ecf2' : k < .3 ? '#43b6cf' : '#55c6da'; }); glow(() => qz(x0, x1, y0, y1, z + .02, '#5fe0ea', '#8ff0f4')); qz(x0, x1, y0, y0 + .12, z + .02, '#2f93ae'); qz(x0, x0 + .12, y0, y1, z + .02, '#3aa3bc'); }
  lw([x0, y1, z + .02], [x1, y1, z + .02], dk(rim, .4)); lw([x1, y0, z + .02], [x1, y1, z + .02], dk(rim, .4)); lw([x0, y0, z + .02], [x1, y0, z + .02], dk(rim, .5)); lw([x0, y0, z + .02], [x0, y1, z + .02], dk(rim, .5));
}
function lounger(x, y, z, c = '#f4f0e8') { box(x, y, z, .5, 1.1, .16, c, { ol: false }); box(x, y, z + .16, .5, .3, .2, c, { ol: false }); lw([x, y + 1.1, z], [x + .5, y + 1.1, z], dk(c, .5)); }
function parasol(x, y, z, c) { if (winter()) { lw([x, y, z], [x, y, z + 1.3], '#6a6a78'); return; } lw([x, y, z], [x, y, z + 1.5], '#6a6a78'); cone(x, y, z + 1.25, .75, .45, c); }
function solarFlat(x0, x1, y0, y1, z) { const n = Math.max(1, Math.round((x1 - x0) / .9)); for (let i = 0; i < n; i++) { const a = x0 + i * (x1 - x0) / n, b = a + (x1 - x0) / n - .12; fq([[a, y0, z + .35], [b, y0, z + .35], [b, y1, z + .05], [a, y1, z + .05]], '#27406e', '#2f4c80'); lw([a, y1, z + .05], [b, y1, z + .05], '#9aa0b4'); lw([a, (y0 + y1) / 2, z + .2], [b, (y0 + y1) / 2, z + .2], '#5f86c2'); fq([[b, y0, z], [b, y1, z], [b, y0, z + .35]], '#4a4a5a'); if (winter()) fq([[a, y0, z + .36], [b, y0, z + .36], [b, y0 + (y1 - y0) * .4, z + .25], [a, y0 + (y1 - y0) * .4, z + .25]], SNOW, 'glass'); } }
function acUnit(x, y, z) { box(x, y, z, .7, .6, .45, '#c9ccd4'); qy(x + .1, x + .6, y + .6, z + .1, z + .38, PAT.siding('#8a8e9a', 2)); }
/** arched (round-top) window */
function archWin(s, a0, a1, pl, z0, z1, o) {
  o = o || {}; const m = (a0 + a1) / 2, rr = (a1 - a0) / 2, trim = o.trim || '#f4ead2';
  disc(s, m, pl, z1, rr + .08, fs(s, trim)); fQ(s, a0 - .08, a1 + .08, pl, z0 - .08, z1, fs(s, trim));
  disc(s, m, pl, z1, rr, '#4a4458'); disc(s, m, pl, z1, rr - .07, '#7fb6d0', '#9fcbe0'); if (o.on !== false) glow(() => disc(s, m, pl, z1, rr - .07, '#ffd98a', '#f4c870'));
  W(s, a0, a1, pl, z0, z1, { on: o.on, mullion: o.mull === undefined ? 'cross' : o.mull });
  fL(s, m, z1, m, z1 + rr - .07, pl, '#4a4458');
  if (o.sill !== false) fL(s, a0 - .14, z0 - .1, a1 + .14, z0 - .1, pl, lt(trim, .3));
  if (o.shut) for (const b of [a0 - .34, a1 + .08]) { fQ(s, b, b + .26, pl, z0, z1, PAT.siding(fs(s, o.shut), 2)); }
  if (o.wreath && winter()) wreath(s, m, pl, (z0 + z1) / 2, .2);
}
function archDoor(s, a, pl, z, o) {
  o = o || {}; const w = o.w || 1.2, h = o.h || 1.5, c = o.c || '#7a4a2a', trim = o.trim || '#f4ead2', a0 = a - w / 2, a1 = a + w / 2;
  disc(s, a, pl, z + h, w / 2 + .14, fs(s, trim)); fQ(s, a0 - .14, a1 + .14, pl, z, z + h, fs(s, trim));
  disc(s, a, pl, z + h, w / 2, fs(s, c)); fQ(s, a0, a1, pl, z, z + h, PAT.planks(fs(s, c), 3));
  fL(s, a, z, a, z + h + w / 2, pl, dk(c, .6)); fL(s, a0, z, a0, z + h, pl, dk(c, .6)); fL(s, a1, z, a1, z + h, pl, dk(c, .6));
  for (const b of [a - .12, a + .12]) { const q = pt(s, b, pl, z + .8); fq([q, q], c); lw(q, pt(s, b, pl, z + .9), '#f6d870'); }
  fL(s, a0 + .1, z + .3, a1 - .1, z + .3, pl, '#3a2a22'); fL(s, a0 + .1, z + h - .1, a1 - .1, z + h - .1, pl, '#3a2a22');
  lamp(s, a1 + .4, pl, z + 1.5); lamp(s, a0 - .4, pl, z + 1.5);
  if (winter()) wreath(s, a, pl, z + h + .1, .2);
}
function cypress(x, y, z, h = 1.6) { box(x - .15, y - .15, z, .3, .3, .25, '#b8643c', { ol: false }); const f = winter() ? '#3f6f5a' : '#2f6f48'; cone(x, y, z + .25, .22, h, f); }

export default [
  /* ---------------- modern flat-roof villa: stacked boxes, glass, roof terrace, pool ---------------- */
  mk({
    id: 'bld.res.villa.modern', tags: ['hillcrest', 'home', 'villa', 'modern', 'upscale'],
    defs: { w: 11, d: 8, floors: 2, wall: '#f4f1ea', accent: '#a8744a', acmat: 'planks', trim: '#33333f', doorc: '#8a5a3c', pool: true, para: '#e06a4a' },
    height: P => P.floors > 1 ? 5.4 : 2.9,
    doorAt: P => ({ side: 'y', at: 1.4 }), lightAt: P => ({ x: 1.4, y: P.d - 1.6, z: 0, r: 3.5 }),
    variants: [
      { w: 11, d: 8, seed: 1 },
      { w: 12, d: 8, seed: 2, wall: '#e9e6e0', accent: '#3e3e4a', acmat: 'plain', para: '#f2cf5a', doorc: '#c8683f' },
      { w: 10, d: 8, seed: 3, wall: '#f4f1ea', accent: '#c9c5bd', acmat: 'stucco', pool: false, para: '#3aa8a0' },
      { w: 12, d: 9, seed: 4, wall: '#d9d2c4', accent: '#7a4a32', acmat: 'planks', para: '#f4f0e8', doorc: '#33333f' },
      { w: 10, d: 7, seed: 5, floors: 1, wall: '#f4f1ea', accent: '#a8744a', pool: true, para: '#e06a4a' },
    ],
    paint(P, r) {
      const { w, d, wall, accent, trim } = P, z0 = .2, tw = 2.6, bd = d - tw, H1 = 2.6, bx = Math.round(w * .4 * 2) / 2, two = P.floors > 1;
      // ground block
      body(0, 0, 0, w, bd, H1, wall, 'plain', { t: wall });
      winRow('x', .5, bd - .5, w, 1.3, 1.9, { r, ww: 1.4, n: 2, trim: false, mull: 'v', sill: false, frame: trim });
      door('y', 1.4, bd, z0, { c: P.doorc, trim: false, w: 1.0, h: 2.0, glass: false, side: true, wreath: true });
      wallQ('y', .3, .65, bd, z0, 2.3, 'planks', accent);
      glassWall('y', 2.6, w - .5, bd, z0, 2.25, { panel: 1.2, on: r() < .9 });
      // terrace + pool
      box(0, bd, 0, w, tw, z0, '#d6d0c2', { t: PAT.ftile('#d9d3c6', '#cfc8ba', .5) });
      if (P.pool) { pool(w - 5.6, w - .7, bd + .9, d - .5, z0); lounger(2.9, bd + .5, z0); lounger(3.7, bd + .5, z0, P.para === '#f4f0e8' ? '#e06a4a' : '#f4f0e8'); }
      else { for (let i = 0; i < 3; i++) cypress(w - 1 - i * 1.5, d - .5, z0, 1.3 + (i % 2) * .3); box(3, bd + .6, z0, 1.6, .8, .35, '#8a8a96'); lounger(5.4, bd + .6, z0); }
      steps('y', .8, 2.0, d, z0, 1, '#c9c3b5', .2);
      if (autumn()) pumpkin(.6, bd + .3, z0, true);
      // roof of ground block = terrace on the left
      roofFlat(0, 0, H1, w, bd, wall, { ph: .25, roof: '#b9a98c', roof2: '#b0a084', cop: '#fbf8f0' });
      if (two) {
        const tz = H1 + .25;
        box(1.0, 1.2, tz, .9, .9, .4, '#e9e4d8', { ol: false }); box(2.2, 1.4, tz, .5, .5, .35, P.para, { ol: false }); box(.9, 2.6, tz, .5, .5, .35, P.para, { ol: false });
        parasol(1.45, 1.65, tz + .4, P.para);
        pot(.5, bd - .5, tz, leafy(r()), .28, '#e9e4d8'); pot(bx - .5, .6, tz, leafy(r()), .25, '#e9e4d8');
        rail('y', .1, bx, bd - .1, tz, { glass: true, c: trim, h: .55 });
        // upper block, cantilevered toward the street
        const by0 = .4, by1 = bd + .9, H2 = 5.0;
        box(bx, by0, H1, w - bx, by1 - by0, H2 - H1, accent, { l: matA(P.acmat, dk(accent, .18)), r: matA(P.acmat, dk(accent, .36)) });
        qz(bx, w, bd, by1, H1, dk(accent, .55));
        glassWall('y', bx + .4, w - .4, by1, H1 + .35, H2 - .35, { panel: 1.1, on: r() < .8, blind: r() < .5 ? .5 : 0 });
        winRow('x', by0 + .5, by1 - .5, w, H1 + .6, H2 - .5, { r, ww: 1.6, n: 2, trim: false, mull: 'v', sill: false, frame: trim, pOn: .7 });
        roofFlat(bx, by0, H2, w - bx, by1 - by0, accent, { ph: .2, cop: lt(accent, .25), roof: '#8b8791' });
        solarFlat(bx + .6, bx + .6 + Math.min(3.6, w - bx - 2.2), by0 + .8, by0 + 2.0, H2 + .2);
        acUnit(w - 1.5, by0 + 2.6, H2 + .2);
        if (winter()) fairy([bx, by1, H2 + .2], [w, by1, H2 + .2], { sag: 0, cols: ['#fff2c4', '#ffd98a'] });
      } else { solarFlat(1, 4.6, .8, 2.0, H1 + .25); acUnit(w - 2, 1, H1 + .25); }
      // low planter wall along the street edge
      box(2.4, d - .3, 0, w - 2.4, .3, .55, wall, { t: '#6a5a48' });
      for (let x = 2.7; x < w - .3; x += .55) { const f = hash2(Math.floor(x * 7), P.seed, 2); if (winter()) continue; ball(x, d - .15, .7, .2, f > .75 ? (bloom(f) || leafy(f)) : leafy(f), { ol: false }); }
      snowTop(2.4, w, d - .3, d, .56);
    },
  }),

  /* ---------------- mediterranean villa: stucco, terracotta tile, tower, arches ---------------- */
  mk({
    id: 'bld.res.villa.med', tags: ['hillcrest', 'home', 'villa', 'mediterranean', 'upscale'],
    defs: { w: 11, d: 8, floors: 2, wall: '#f2dcb4', roof: '#c8683f', trim: '#fbf2dc', doorc: '#7a4a2a', shut: '#4f7f8a', tile: '#3d7a9a' },
    height: P => 6.6 + 1.4,
    doorAt: P => ({ side: 'y', at: 2 }), lightAt: P => ({ x: 2, y: P.d - 1.8, z: 0, r: 3.5 }),
    variants: [
      { w: 11, d: 8, seed: 1 },
      { w: 12, d: 8, seed: 2, wall: '#f4e9d6', roof: '#b8553a', shut: '#7a4a2a', tile: '#c89a3a' },
      { w: 11, d: 9, seed: 3, wall: '#eab48a', roof: '#a8503c', shut: '#f4ead2', tile: '#3d7a9a' },
      { w: 12, d: 8, seed: 4, wall: '#f6efe2', roof: '#d07a4a', shut: '#3d6a4a', tile: '#3d6a4a' },
      { w: 10, d: 8, seed: 5, wall: '#f0c9a0', roof: '#b8553a', shut: '#5a4a7a', tile: '#5a4a7a' },
    ],
    paint(P, r) {
      const { w, d, wall, roof, trim } = P, z0 = .3, H = 4.4, bd = d - 2.4, tw = 3, mw = w - tw, HT = 6.6, base = '#c9b79a';
      // main block
      body(0, 0, 0, mw + .1, bd, H, wall, 'stucco', { base, t: wall });
      archDoor('y', 2, bd, z0, { c: P.doorc, trim });
      for (let x = 3.6; x + 1 <= mw - .3; x += 1.7) archWin('y', x, x + .9, bd, z0 + .6, z0 + 1.4, { on: r() < .7, trim, wreath: true });
      win('y', .35, .95, bd, z0 + .8, z0 + 1.6, { on: r() < .5, trim, mull: 'h', shut: null });
      // upper floor: french doors with juliet balconies
      for (let x = 1.1; x + 1.2 <= mw - .2; x += 2.3) { win('y', x, x + 1.1, bd, 2.55, 3.85, { on: r() < .65, trim, mull: 'v', shut: P.shut, sill: false }); balcony('y', x - .45, x + 1.55, bd, 2.5, { dp: .35, c: '#33303c', stuff: false, slab: trim, h: .5 }); if (!winter()) { pot(x - .2, bd + .18, 2.5, bloom(r()) || leafy(.2), .14); pot(x + 1.3, bd + .18, 2.5, bloom(r()) || leafy(.6), .14); } }
      qy(0, mw, bd, H - .5, H - .3, PAT.vstripes(fs('y', P.tile), fs('y', trim), 2));
      roofHip(0, 0, H, mw + .2, bd, 1.25, roof, { kind: 'tile', trim, over: .3, behind: () => chimney(mw * .3, bd / 2 - .7, H + .4, H + 1.8, wall, { cap: roof }) });
      // tower
      const ty = bd - tw;
      body(mw, ty, 0, tw, tw, HT, wall, 'stucco', { base, t: wall });
      archWin('y', mw + 1.0, mw + 2.0, bd, z0 + .7, z0 + 1.6, { on: r() < .6, trim });
      archWin('y', mw + 1.05, mw + 1.95, bd, 2.9, 3.8, { on: r() < .6, trim, shut: P.shut });
      for (let i = 0; i < 2; i++) { archWin('y', mw + .45 + i * 1.2, mw + 1.35 + i * 1.2, bd, HT - 1.7, HT - .95, { on: true, trim, mull: null, sill: false }); archWin('x', ty + .45 + i * 1.2, ty + 1.35 + i * 1.2, w, HT - 1.7, HT - .95, { on: true, trim, mull: null, sill: false }); }
      archWin('x', ty + 1.0, ty + 2.0, w, 2.9, 3.8, { on: r() < .5, trim, shut: P.shut });
      win('x', ty + 1.0, ty + 2.0, w, z0 + .8, z0 + 1.6, { on: r() < .5, trim, mull: 'cross' });
      qy(mw, w, bd, HT - .5, HT - .32, PAT.vstripes(fs('y', P.tile), fs('y', trim), 2)); qx(w, ty, bd, HT - .5, HT - .32, PAT.vstripes(fs('x', P.tile), fs('x', trim), 2));
      roofHip(mw, ty, HT, tw, tw, 1.3, roof, { kind: 'tile', trim, over: .3 });
      lw([mw + tw / 2, ty + tw / 2, HT + 1.3], [mw + tw / 2, ty + tw / 2, HT + 1.9], '#4a4458'); ball(mw + tw / 2, ty + tw / 2, HT + 1.9, .1, '#e8c860', { ol: false });
      // front terrace wing with pergola
      const wx = w - 4.6, wh = 1.0;
      box(wx, bd, 0, 4.6, 2.1, wh, wall, { l: PAT.stucco(dk(wall, .18)), r: PAT.stucco(dk(wall, .36)), t: PAT.ftile('#d8a078', '#cf9068', .5) });
      for (let i = 0; i < 3; i++) { const a = wx + .5 + i * 1.35; fQ('y', a, a + .9, bd + 2.1, .15, .6, dk(wall, .5)); disc('y', a + .45, bd + 2.1, .6, .45, dk(wall, .5)); }
      snowTop(wx + .1, w - .1, bd + .1, bd + 2.0, wh + .01);
      box(wx + 1.0, bd + .6, wh, 1.3, .8, .4, '#8a5a3c', { ol: false }); box(wx + .5, bd + .75, wh, .35, .35, .3, P.shut, { ol: false }); box(wx + 2.5, bd + .75, wh, .35, .35, .3, P.shut, { ol: false });
      cypress(w - .5, bd + .45, wh, 1.5); pot(wx + .35, bd + 1.75, wh, bloom(r()) || leafy(.3), .22);
      rail('y', wx + .05, w - .05, bd + 2.05, wh, { c: '#33303c', h: .5 }); rail('x', bd, bd + 2.05, w - .05, wh, { c: '#33303c', h: .5 });
      for (const [px, py] of [[wx + .1, bd + 1.85], [w - .3, bd + 1.85]]) box(px, py, wh, .2, .2, 2.0, '#8a5a3c', { ol: false });
      for (let x = wx; x < w; x += .45) lw([x, bd, wh + 2.05], [x, bd + 2.2, wh + 2.05], '#7a4a2a');
      lw([wx - .1, bd + 1.95, wh + 2.0], [w + .1, bd + 1.95, wh + 2.0], '#6a3e22'); lw([wx - .1, bd + 1.95, wh + 1.94], [w + .1, bd + 1.95, wh + 1.94], '#6a3e22');
      if (winter()) fairy([wx, bd + 2.0, wh + 1.9], [w, bd + 2.0, wh + 1.9], { sag: 2, waves: 3, cols: ['#fff2c4', '#ffd98a'] });
      else if (!autumn()) for (let x = wx + .2; x < w; x += .3) if (hash2(Math.floor(x * 10), 3, P.seed) > .45) ball(x, bd + 1.95, wh + 2.1, .16, hash2(Math.floor(x * 10), 5) > .7 ? '#c86aa8' : '#4f9a45', { ol: false });
      steps('y', 1.3, 2.7, bd, z0, 2, '#d9c9aa', .22);
      if (autumn()) { pumpkin(1.0, bd + .25, 0, true); pumpkin(3.0, bd + .25, 0, true); }
      cypress(.5, bd + .4, 0, 1.7); cypress(3.5, bd + .4, 0, 1.4);
    },
  }),

  /* ---------------- mansion: symmetric, two-storey portico with columns ---------------- */
  mk({
    id: 'bld.res.mansion', tags: ['hillcrest', 'home', 'mansion', 'upscale'],
    defs: { w: 14, d: 8, floors: 2, wall: '#f1ead8', roof: '#4a4a58', trim: '#fbf8f0', doorc: '#2a2a35', mat: 'stucco', shut: '#2f3f4f' },
    height: P => 4.6 + 1.9,
    doorAt: P => ({ side: 'y', at: P.w / 2 }), lightAt: P => ({ x: P.w / 2, y: P.d + .2, z: 0, r: 4.5 }),
    variants: [
      { w: 14, d: 8, seed: 1 },
      { w: 16, d: 8, seed: 2, wall: '#a8553f', mat: 'brick', roof: '#3a3a46', shut: '#f6f1e6', doorc: '#f6f1e6' },
      { w: 12, d: 8, seed: 3, wall: '#e9d6a8', roof: '#5a4038', shut: '#3d5a48', doorc: '#3d5a48' },
      { w: 14, d: 9, seed: 4, wall: '#cfd6dc', mat: 'siding', roof: '#3f4658', shut: '#1f2a44', doorc: '#a8343a' },
      { w: 16, d: 8, seed: 5, wall: '#f4f1ea', roof: '#6a4a4a', shut: null, doorc: '#7a3b2e', mat: 'stone' },
    ],
    paint(P, r) {
      const { w, d, wall, roof, trim } = P, m = P.mat, z0 = .4, H = 4.6, pd = 1.3, bd = d - pd - .4, c = w / 2, pw = 4.6;
      body(0, 0, 0, w, bd, H, wall, m, { base: '#b0a898', baseH: .4, band: [2.45, H - .12], bandc: trim });
      // quoins
      for (let z = .5; z < H - .3; z += .5) { qy(w - .32, w, bd, z, z + .25, fs('y', trim)); qx(w, bd - .32, bd, z, z + .25, fs('x', trim)); qy(0, .32, bd, z, z + .25, fs('y', trim)); }
      for (let f = 0; f < 2; f++) winRow('x', .5, bd - .5, w, z0 + f * 2.1 + .7, z0 + f * 2.1 + 1.65, { r, ww: .9, n: 3, trim, shut: P.shut, head: true });
      const side = (a0, a1) => { for (let f = 0; f < 2; f++) winRow('y', a0, a1, bd, z0 + f * 2.1 + .65, z0 + f * 2.1 + 1.7, { r, ww: .95, n: (a1 - a0) > 4.4 ? 3 : 2, trim, shut: P.shut, head: true, wreath: true, pOn: .65, fbox: f === 0 && spring() }); };
      side(.5, c - pw / 2 - .1); side(c + pw / 2 + .1, w - .5);
      door('y', c, bd, z0, { c: P.doorc, trim, w: 1.4, h: 1.8, dbl: true, glass: false, ped: true, wreath: true, lamp: false });
      lamp('y', c - 1.3, bd, z0 + 1.45, { r: 7 }); lamp('y', c + 1.3, bd, z0 + 1.45, { r: 7 });
      win('y', c - .6, c + .6, bd, z0 + 2.75, z0 + 3.75, { on: true, trim, mull: 'cross', head: true });
      balcony('y', c - 1.1, c + 1.1, bd, z0 + 2.45, { dp: .35, c: '#2e2a3a', stuff: false, slab: trim, h: .45 });
      roofHip(0, 0, H, w, bd, 1.5, roof, { trim, inset: .45, over: .25, kind: 'shingle', behind: () => { chimney(1.2, bd / 2 - .5, H + .3, H + 2.0, m === 'brick' ? '#8f4838' : '#a85a44', { w: .8, pots: 2 }); chimney(w - 2.0, bd / 2 - .5, H + .3, H + 2.0, m === 'brick' ? '#8f4838' : '#a85a44', { w: .8, pots: 2 }); } });
      // portico
      box(c - pw / 2, bd, 0, pw, pd, z0, '#d9d3c6', { t: PAT.ftile('#e4dfd2', '#cfc9bb', .5) });
      steps('y', c - pw / 2 + .3, c + pw / 2 - .3, bd + pd, z0, 2, '#d9d3c6', .2);
      if (autumn()) { pumpkin(c - 1.9, bd + pd - .5, z0, true); pumpkin(c + 1.9, bd + pd - .5, z0, true); }
      for (const k of [-1, 1]) pot(c + k * (pw / 2 - .9), bd + .35, z0, leafy(.5), .26, '#e9e4d8');
      const cz = H - z0 - .35;
      for (const k of [-1.5, -.5, .5, 1.5]) { const cx = c + k * (pw - .7) / 3, cy = bd + pd - .3; box(cx - .2, cy - .2, z0, .4, .4, .14, trim, { ol: false }); cyl(cx, cy, z0 + .14, .14, cz - .14, trim); box(cx - .2, cy - .2, z0 + cz - .12, .4, .4, .12, trim, { ol: false }); if (winter()) fairy([cx - .2, cy + .15, z0 + cz - .2], [cx + .15, cy + .15, z0 + .3], { sag: 0, cols: ['#fff2c4', '#ff5a5a'], step: 4 }); }
      box(c - pw / 2 - .05, bd, H - .35, pw + .1, pd + .05, .35, trim);
      roofGable(c - pw / 2, bd - 2.2, H, pw, pd + 2.2, 1.15, 'y', roof, { wall: trim, trim, vent: 'round', over: .12, rake: .15 });
    },
  }),

  /* ---------------- cliffside house on stilts ---------------- */
  mk({
    id: 'bld.res.cliffhouse', tags: ['hillcrest', 'home', 'cliff', 'stilts', 'modern', 'upscale'],
    defs: { w: 8, d: 7, floors: 1, stilt: 2.5, wall: '#a8744a', roof: '#3e3e4a', trim: '#f4f1ea', doorc: '#e06a4a', mat: 'planks', post: '#5a5560' },
    height: P => P.stilt + 2.5 * P.floors + 1.1,
    doorAt: P => ({ side: 'y', at: 3.6 + (P.stilt - 2.5) }), lightAt: P => ({ x: 3.6 + (P.stilt - 2.5), y: P.d + .4, z: 0, r: 3 }),
    variants: [
      { w: 8, d: 7, seed: 1 },
      { w: 9, d: 7, seed: 2, stilt: 3.5, wall: '#3e4a52', roof: '#2e2e38', doorc: '#f2cf5a', post: '#8a8590' },
      { w: 8, d: 7, seed: 3, stilt: 2, wall: '#e9e4d8', roof: '#56708a', doorc: '#56708a', mat: 'wide' },
      { w: 9, d: 8, seed: 4, stilt: 3, floors: 2, wall: '#8a5a3c', roof: '#3f4a45', doorc: '#f4f1ea' },
      { w: 8, d: 7, seed: 5, stilt: 1.5, wall: '#7f9a78', roof: '#4d4a55', doorc: '#c8683f', mat: 'wide' },
    ],
    paint(P, r) {
      const { w, d, wall, roof, trim, post } = P, sh = P.stilt, pd = d - 1, hw = w - 1.3, hd = pd - 1.2, H = sh + 2.5 * P.floors;
      // stilts + bracing
      const xs = [.3, w / 2 - .15, w - .6], ys = [.3, pd / 2 - .15, pd - .6];
      for (const y of ys) for (const x of xs) { box(x, y, 0, .3, .3, sh - .3, post, { ol: false }); lw([x, y + .3, 0], [x, y + .3, sh - .3], dk(post, .6)); box(x - .1, y - .1, 0, .5, .5, .15, '#9a948c', { ol: false }); }
      for (let i = 0; i < 2; i++) { lw([xs[i] + .3, pd - .3, .3], [xs[i + 1], pd - .3, sh - .5], dk(post, .3)); lw([xs[i] + .3, pd - .3, sh - .5], [xs[i + 1], pd - .3, .3], dk(post, .3)); lw([w - .3, ys[i] + .3, .3], [w - .3, ys[i + 1], sh - .5], dk(post, .45)); lw([w - .3, ys[i] + .3, sh - .5], [w - .3, ys[i + 1], .3], dk(post, .45)); }
      // platform
      box(0, 0, sh - .3, w, pd, .3, '#8a6a4a', { t: PAT.fboards('#b08a64', .25), l: dk('#7a5a40', .1), r: dk('#7a5a40', .3) });
      snowTop(hw, w, 0, pd, sh + .01); snowTop(0, hw, hd, pd, sh + .01);
      // house
      body(0, 0, sh, hw, hd, H - sh, wall, P.mat, { t: dk(wall, .3) });
      for (let f = 0; f < P.floors; f++) {
        const z = sh + f * 2.5;
        glassWall('y', 1.9, hw - .3, hd, z + .1, z + 2.1, { panel: 1.1, on: r() < .9, blind: f ? .6 : 0 });
        glassWall('x', .5, hd - 1.6, hw, z + .1, z + 2.1, { panel: 1.1, on: r() < .7 });
        win('x', hd - 1.1, hd - .4, hw, z + 1.2, z + 1.9, { on: r() < .5, trim: false, mull: null, sill: false });
      }
      door('y', 1.1, hd, sh, { c: P.doorc, trim: false, glass: 'top', wreath: true, h: 1.8 });
      roofShed(0, 0, H, hw, hd, .7, roof, { kind: 'metal', trim, over: .35, sidewall: wall, wmat: P.mat });
      cyl(hw * .25, hd * .3, H + .35, .12, .9, '#55566a'); cyl(hw * .25, hd * .3, H + 1.25, .18, .08, '#3e3e4c');
      // deck life
      box(hw + .25, 1.2, sh, .5, .5, .4, '#e06a4a', { ol: false }); box(hw + .25, 2.2, sh, .5, .5, .4, '#e06a4a', { ol: false }); pot(hw + .5, hd + .5, sh, leafy(r()), .25, '#e9e4d8'); pot(.4, hd + .55, sh, bloom(r()) || leafy(.2), .2);
      if (autumn()) pumpkin(1.9, hd + .3, sh, true);
      rail('x', 0, pd - .05, w - .05, sh, { c: '#33333f', glass: true, h: .6 });
      rail('y', 2.0, w - .05, pd - .05, sh, { c: '#33333f', glass: true, h: .6 });
      if (winter()) fairy([2.0, pd, sh + .62], [w, pd, sh + .62], { sag: 0 });
      // stairs along the front, climbing toward -x
      const n = Math.round(sh / .25), run = .26, x0 = 1.9, tw = .9;
      box(.9, pd, sh - .12, 1.0, tw, .12, '#8a6a4a', { t: '#b08a64' });
      lw([x0 + n * run, d - .02, 0], [x0, d - .02, sh - .1], dk('#7a5a40', .3));
      for (let i = 0; i < n; i++) { const z = sh - (i + 1) * (sh / n), x = x0 + i * run; box(x, pd + .05, z, run + .04, tw - .1, .07, '#b08a64', { ol: false }); lw([x, d - .05, z], [x + run, d - .05, z], '#6a4a34'); }
      lw([x0 + n * run, d - .05, .75], [x0, d - .05, sh + .65], '#33333f'); lw([x0 + n * run, d - .05, 0], [x0 + n * run, d - .05, .75], '#33333f'); lw([x0, d - .05, sh], [x0, d - .05, sh + .65], '#33333f'); lw([.9, d - .05, sh + .65], [x0, d - .05, sh + .65], '#33333f'); lw([.9, d - .05, sh], [.9, d - .05, sh + .65], '#33333f');
      lamp('y', 1.75, hd, sh + 1.5);
    },
  }),

  /* ---------------- glass pavilion ("penthouse on the ground") ---------------- */
  mk({
    id: 'bld.res.glasshouse', tags: ['hillcrest', 'home', 'villa', 'modern', 'glass', 'upscale'],
    defs: { w: 9, d: 7, floors: 2, wall: '#f4f1ea', stone: '#8d8780', trim: '#2e2e38', doorc: '#2e2e38', tint: '#a6d8ea' },
    height: P => .5 + 2.6 * P.floors + .5,
    doorAt: P => ({ side: 'y', at: 2 }), lightAt: P => ({ x: 2, y: P.d + .2, z: 0, r: 4 }),
    variants: [
      { w: 9, d: 7, seed: 1 },
      { w: 10, d: 7, seed: 2, stone: '#a8744a', tint: '#b8dcd0' },
      { w: 9, d: 7, seed: 3, floors: 1, stone: '#5a5560', wall: '#e9e6e0' },
      { w: 11, d: 8, seed: 4, stone: '#b5a58a', tint: '#9fc8e8', wall: '#3e3e4a' },
      { w: 10, d: 8, seed: 5, stone: '#8d8780', tint: '#c2e0e6' },
    ],
    paint(P, r) {
      const { w, d, wall, trim } = P, z0 = .5, fh = 2.6, H1 = z0 + fh, bd = d - 1.4, sw = 1.2, st = P.stone;
      // plinth with reflecting pool strip + steps
      box(0, 0, 0, w, d - .5, z0, '#c9c5bd', { t: PAT.ftile('#d6d2c8', '#ccc7bc', .5), l: PAT.stone(dk('#c9c5bd', .18)), r: PAT.stone(dk('#c9c5bd', .36)) });
      steps('y', 1.2, 2.8, d - .5, z0, 3, '#c9c5bd', .16);
      if (!winter()) { qz(3.4, w - .4, bd + .25, d - .75, z0 + .01, '#55c6da', '#6fd3e4'); glow(() => qz(3.4, w - .4, bd + .25, d - .75, z0 + .01, '#5fe0ea', 'glass')); lw([3.4, d - .75, z0 + .01], [w - .4, d - .75, z0 + .01], '#9a968c'); lw([3.4, bd + .25, z0 + .01], [w - .4, bd + .25, z0 + .01], '#7a766c'); } else snowTop(3.4, w - .4, bd + .25, d - .75, z0 + .01);
      // interior hints then glass skin
      box(.3, .3, z0, w - .6, bd - .3, fh - .25, '#6a6470', { ol: false });
      box(0, .2, z0, sw, bd - .2, fh + .0, st, { l: PAT.stone(dk(st, .18)), r: PAT.stone(dk(st, .36)) });   // stone fin wall (left)
      glassWall('x', .4, bd - .1, w - .3, z0 + .05, H1 - .3, { panel: 1.15, on: true, tint: P.tint, frame: trim });
      glassWall('y', sw + 1.6, w - .3, bd, z0 + .05, H1 - .3, { panel: 1.15, on: true, tint: P.tint, frame: trim, blind: r() < .4 ? .5 : 0 });
      door('y', 2, bd, z0, { c: P.doorc, trim: false, w: 1.0, h: 2.0, glass: 'full', wreath: true, lamp: false });
      lamp('y', 1.25, bd, z0 + 1.5);
      // interior silhouettes against the glass (sofa, lamp, plant)
      qy(sw + 2.4, sw + 4.0, bd + .01, z0 + .1, z0 + .55, '#5a6a8a'); glow(() => qy(sw + 2.4, sw + 4.0, bd + .01, z0 + .1, z0 + .55, '#b8763a'));
      qy(w - 1.6, w - 1.2, bd + .01, z0 + .1, z0 + 1.3, '#4f8a55', 'glass'); glow(() => qy(w - 1.6, w - 1.2, bd + .01, z0 + .1, z0 + 1.3, '#5a7a3a', 'glass'));
      if (autumn()) pumpkin(2.9, bd + .3, z0, true);
      // roof slab 1
      box(-.3, -.1, H1 - .25, w + .6, bd + .7, .25, wall, { t: lt(wall, .1) });
      snowTop(-.2, w + .2, 0, bd + .5, H1 + .01);
      if (P.floors > 1) {
        const ux = Math.round(w * .35), uy0 = .5, uy1 = bd - 1.2, H2 = H1 + fh;
        rail('y', .3, ux, bd + .3, H1, { glass: true, c: trim, h: .5 });
        box(1.0, 1.3, H1, .5, 1.1, .2, '#f4f0e8', { ol: false }); pot(.7, bd - .3, H1, leafy(r()), .3, '#e9e4d8'); pot(ux - .6, .8, H1, leafy(r()), .26, '#e9e4d8');
        box(ux + .2, uy0 + .2, H1, w - ux - .9, uy1 - uy0 - .3, fh - .25, '#6a6470', { ol: false });
        glassWall('x', uy0 + .1, uy1, w - .5, H1 + .05, H2 - .3, { panel: 1.1, on: r() < .8, tint: P.tint, frame: trim });
        glassWall('y', ux, w - .5, uy1, H1 + .05, H2 - .3, { panel: 1.1, on: r() < .8, tint: P.tint, frame: trim, blind: .45 });
        rail('x', uy1, bd + .3, w + .1, H1, { glass: true, c: trim, h: .5 }); rail('y', ux, w + .1, bd + .3, H1, { glass: true, c: trim, h: .5 });
        box(ux - .5, uy0 - .3, H2 - .25, w - ux + .5, uy1 - uy0 + 1.0, .25, wall, { t: lt(wall, .1) });
        snowTop(ux - .4, w - .1, uy0 - .2, uy1 + .6, H2 + .01);
        box(ux + .6, uy0 + .3, H2, .8, .8, 1.0, st, { l: PAT.stone(dk(st, .18)), r: PAT.stone(dk(st, .36)) });
        if (winter()) fairy([ux - .5, uy1 + .7, H2 - .05], [w, uy1 + .7, H2 - .05], { sag: 0, cols: ['#fff2c4', '#ffd98a'] });
      } else { box(w * .5, 1, H1, .8, .8, 1.0, st, { l: PAT.stone(dk(st, .18)), r: PAT.stone(dk(st, .36)) }); solarFlat(1.2, 3.9, 1.0, 2.2, H1); }
      if (winter()) fairy([-.3, bd + .6, H1 - .05], [w + .3, bd + .6, H1 - .05], { sag: 0, cols: ['#fff2c4', '#ffd98a'] });
    },
  }),
];
function matA(m, c) { return m === 'planks' ? PAT.planks(c, 3) : m === 'stucco' ? PAT.stucco(c) : c; }
