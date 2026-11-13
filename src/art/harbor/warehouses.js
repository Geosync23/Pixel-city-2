// Harbour & industrial warehouses + brick lofts.
import { box, qy, qx, qz, lw, fq, glow, lit, cyl, cone, ball, spx, PAT, rng, dk, lt, mix, foliage, textY } from '../../engine/raster.js';
import { Lc, Rc, walls, face, roll, door, gridWin, lamp, ladder, pipe, bulbs, rope, crate, barrel, drum, pallet, gull, lifering, gableS, snowTop, parapet, hcyl, band, circ, disc, roofPat, endPat, barnDoor, ac, vent, skylight, stripeHaz, winter, SNOW } from './_lib.js';

const timber = {
  id: 'bld.harbor.warehouse.timber', kind: 'building', tags: ['harbor', 'warehouse', 'storage', 'timber'],
  size: p => [p.w || 8, p.d || 6, (p.h || 4) + (p.rh || 1.8)],
  vb: p => [-.5, -.5, 0, (p.w || 8) + 1.3, (p.d || 6) + 1.1, (p.h || 4) + (p.rh || 1.8) + 1.2],
  variants: [
    { w: 8, d: 6, seed: 3, wall: '#a8483a', name: 'NET LOFT' },
    { w: 10, d: 7, h: 4.5, rh: 2.2, seed: 8, wall: '#3f7f86', roof: '#7a4a3a', name: 'CHANDLERY' },
    { w: 7, d: 6, seed: 12, wall: '#c9a24a', roof: '#4a5868', name: 'SALT & CO' },
    { w: 9, d: 6, seed: 21, wall: '#8a7a66', roof: '#5a3f3a', name: 'SAIL LOFT' },
  ],
  draw(p) {
    const w = p.w || 8, d = p.d || 6, h = p.h || 4, rh = p.rh || 1.8, r = rng(p.seed || 1), wall = p.wall || '#a8483a', roof = p.roof || '#4f5560', trim = p.trim || '#f1e7cf';
    const Fy = face('y', d), Fx = face('x', w);
    walls(0, 0, 0, w, d, h, wall, c => PAT.planks(c, 3));
    qy(0, w, d, 0, .35, PAT.stone(Lc('#8c8a90'))); qx(w, 0, d, 0, .35, PAT.stone(Rc('#8c8a90')));
    Fy.q(0, .14, .35, h, Lc(trim)); Fy.q(w - .14, w, .35, h, Lc(trim)); Fx.q(0, .14, .35, h, Rc(trim)); Fx.q(d - .14, d, .35, h, Rc(trim));
    // +y facade: barn door, person door, windows, sign
    const bx = Math.max(.9, w * .42 - 1.3);
    barnDoor(Fy, bx, bx + 2.6, 0, 2.6, mix(wall, '#5a4636', .55), trim);
    Fy.sign(p.name || 'WAREHOUSE', bx - .1, bx + 2.7, h - 1.15, h - .58, '#f1e7cf', '#3a3446');
    const px0 = bx + 3.6;
    if (px0 + .6 < w - .3) { door(Fy, px0, { c: dk(wall, .35), frame: trim }); lamp(Fy, px0, 2.15, { len: 1 }); }
    for (let a = px0 + 1.1; a + 1 < w - .3; a += 1.5) gridWin(Fy, a, a + 1, 1.1, 2, { on: r() < .5, cols: 2, rows: 2, frame: trim, sill: true });
    if (bx > 1.5) gridWin(Fy, .4, bx - .5 > 1.4 ? 1.4 : bx - .5, 1.1, 2, { on: r() < .5, cols: 2, rows: 2, frame: trim, sill: true });
    if (r() < .7) lifering(Fy, px0 + 1.6 < w - .5 ? px0 + 1.6 : .8, 2.75);
    // +x gable end: windows, loft hatch + hoist
    const m = d / 2;
    for (const a of [m - 1.9, m + .9]) if (a > .3 && a + 1 < d - .2) gridWin(Fx, a, a + 1, 1.1, 2, { on: r() < .5, cols: 2, rows: 2, frame: trim, sill: true });
    Fx.q(m - .6, m + .6, h - 1.5, h - .05, Rc(trim)); Fx.q(m - .5, m + .5, h - 1.42, h - .12, PAT.planks(Rc(mix(wall, '#5a4636', .55)), 3)); Fx.l(m, h - 1.42, m, h - .12, Rc(trim));
    gableS(0, 0, h, w, d, rh, 'x', roof, { wall: endPat(wall, 'x'), over: .3, f: roofPat(roof, 4) });
    disc('x', [w + .01, m, h + rh * .45], .22, '#2c2638', null, 10); circ('x', [w + .01, m, h + rh * .45], .24, Rc(trim), 12);
    box(w, m - .07, h + rh * .78, 1, .14, .14, '#5a4636'); lw([w + .85, m, h + rh * .78], [w + .85, m, h - .9], '#d9c08a');
    if (r() < .6) crate(w + .6, m - .25, h - 1.4, .5); else { spx(w + .85, m, h - .9, 0, 0, '#39424e'); spx(w + .85, m, h - .9, -1, 1, '#39424e'); spx(w + .85, m, h - .9, 0, 2, '#39424e'); }
    // ridge cupola
    const cx = w * .3; box(cx, m - .4, h + rh - .3, 1, .8, .65, trim, { l: PAT.siding(Lc(trim), 2), r: PAT.siding(Rc(trim), 2) });
    gableS(cx, m - .4, h + rh + .35, 1, .8, .35, 'x', roof, { wall: Rc(trim), over: .12 });
    if (r() < .6) gull(cx + .5, m, h + rh + .72, r() < .5 ? 1 : -1);
    // clutter in front
    let cxp = .3; const lim = bx - .5;
    while (cxp + .6 < lim) { const k = r(); if (k < .4) { barrel(cxp + .3, d + .4, 0, r() < .5 ? '#8a5a34' : '#3f6f8f'); cxp += .7; } else if (k < .8) { crate(cxp, d + .15, 0, .55); if (r() < .4) crate(cxp + .05, d + .2, .55, .42, '#c9a36a'); cxp += .7; } else cxp += .6; }
  },
};

const corr = {
  id: 'bld.ind.warehouse.corrugated', kind: 'building', tags: ['industrial', 'harbor', 'warehouse', 'storage'],
  size: p => [p.w || 10, p.d || 8, (p.h || 4.2) + (p.rh || 1.2)],
  vb: p => [-.5, -.5, 0, (p.w || 10) + .8, (p.d || 8) + .9, (p.h || 4.2) + (p.rh || 1.2) + 1],
  variants: [
    { w: 10, d: 8, seed: 2, wall: '#5f87a8', accent: '#f2c230', name: 'BAY STORAGE', code: 'A1' },
    { w: 8, d: 10, seed: 5, wall: '#7fa07a', accent: '#f4f0e8', name: 'HARBOR CO', code: 'B4' },
    { w: 12, d: 8, h: 5, seed: 9, wall: '#b8664a', accent: '#f1e7cf', name: 'IRONSIDE SUPPLY', code: 'C2' },
    { w: 9, d: 7, seed: 14, wall: '#c8ccd0', accent: '#d8452f', name: 'COLD STORE', code: 'D7' },
  ],
  draw(p) {
    const w = p.w || 10, d = p.d || 8, h = p.h || 4.2, rh = p.rh || 1.2, r = rng(p.seed || 1), wall = p.wall || '#5f87a8', acc = p.accent || '#f2c230', roof = p.roof || lt(dk(wall, .25), .25);
    const Fy = face('y', d), Fx = face('x', w);
    walls(0, 0, 0, w, d, h, wall, c => PAT.planks(c, 3));
    qy(0, w, d, 0, .3, Lc('#9a9aa0')); qx(w, 0, d, 0, .3, Rc('#9a9aa0'));
    Fy.q(0, w, h - .75, h - .45, Lc(acc)); Fx.q(0, d, h - .75, h - .45, Rc(acc));
    // front: roller doors
    const nd = w >= 11 ? 3 : 2, dw = 2.3, gap = (w - 1.6 - nd * dw) / nd;
    let a = .5;
    for (let i = 0; i < nd; i++) {
      const op = r() < .4 ? .35 + r() * .3 : 0;
      roll(Fy, a, a + dw, 0, 3, i === 0 ? acc : '#d8d4c8', { open: op, num: String(i + 1), numc: '#f4f0e8' });
      stripeHaz(Fy, a - .22, a - .1, 0, 1); stripeHaz(Fy, a + dw + .1, a + dw + .22, 0, 1);
      lamp(Fy, a + dw / 2, 3.42, { len: .5 });
      a += dw + gap;
    }
    door(Fy, w - .75, { c: dk(wall, .4), glass: false }); lamp(Fy, w - .75, 2.1, { len: .9 });
    textY(p.name || 'STORAGE', Math.max(.3, w / 2 - (p.name || 'STORAGE').length * 2 / 16), d + .01, h - .08, lt(wall, .75));
    // side: high ribbon windows, pipes, code
    for (let y = .7; y + 1.4 < d - .3; y += 2.1) gridWin(Fx, y, y + 1.4, 2.3, 3.1, { on: r() < .45, cols: 4, rows: 2 });
    pipe(Fx, .35, .3, h); pipe(Fx, d - .3, .3, h);
    Fx.text(p.code || 'A1', d - .9, 1.6, lt(wall, .75));
    if (r() < .7) { Fx.q(d * .45, d * .45 + .9, .3, 1.3, Rc('#39424e')); Fx.q(d * .45 + .08, d * .45 + .82, .5, 1.2, PAT.siding(Rc('#6c7a83'), 2)); }
    // roof (ridge along y, gable faces the front)
    gableS(0, 0, h, w, d, rh, 'y', roof, { wall: endPat(wall, 'y'), over: .2 });
    const sl = (y, t) => [w / 2 + (w / 2 + .2) * t, y, h + rh * (1 - t)];
    for (let y = .8; y < d; y += 1) lw(sl(y, .03), sl(y, .97), dk(roof, .42));
    for (let y = 1.4; y + 1 < d; y += 3) { fq([sl(y, .25), sl(y + .9, .25), sl(y + .9, .8), sl(y, .8)], winter() ? SNOW : '#cfe6ee', winter() ? 'glass' : '#b4d6e2'); if (r() < .7) glow(() => fq([sl(y, .25), sl(y + .9, .25), sl(y + .9, .8), sl(y, .8)], '#ffe39a', 'glass')); }
    for (let y = 1.2; y < d - .5; y += 2.6) { cyl(w / 2, y, h + rh - .05, .16, .3, '#9aa0a6', { ol: false }); ball(w / 2, y, h + rh + .42, .22, '#c8ccd0', { squash: .8 }); }
    // gable apex badge
    disc('y', [w / 2, d + .01, h + rh * .42], .38, Lc(acc), null, 12); textY(p.code || 'A1', w / 2 - 7 / 32 - .22, d + .02, h + rh * .42 + .3, '#2e2a3a');
    // yard clutter
    if (r() < .6) { pallet(w - 2.6, d + .05, 0, 1.1, .8); crate(w - 2.5, d + .15, .16, .5); }
    if (r() < .5) drum(.25, d + .35, 0, '#d8452f');
  },
};

const arched = {
  id: 'bld.ind.warehouse.arched', kind: 'building', tags: ['industrial', 'harbor', 'warehouse', 'storage', 'hangar'],
  size: p => [p.w || 8, p.d || 10, (p.base || 1) + (p.w || 8) / 2],
  vb: p => [-.5, -.5, 0, (p.w || 8) + .6, (p.d || 10) + .9, (p.base || 1) + (p.w || 8) / 2 + .9],
  variants: [
    { w: 8, d: 10, seed: 1, wall: '#a9b4bd', door: '#d8452f', name: 'BOAT STORE' },
    { w: 7, d: 8, seed: 6, wall: '#6f9a78', door: '#f1e7cf', name: 'SHED 5' },
    { w: 9, d: 12, seed: 11, wall: '#b07a54', door: '#3f6f8f', name: 'DRY DOCK' },
  ],
  draw(p) {
    const w = p.w || 8, d = p.d || 10, b = p.base || 1, R = w / 2, r = rng(p.seed || 1), wall = p.wall || '#a9b4bd', dc = p.door || '#d8452f', Fy = face('y', d), Fx = face('x', w);
    box(0, 0, 0, w, d, b, '#b9b4a8', { l: PAT.stone(Lc('#b9b4a8')), r: PAT.stone(Rc('#b9b4a8')) });
    hcyl('y', R, 0, b, d, R, wall, { a0: 0, capA: [0, 180], cap: Lc(wall), snow: true });
    for (let y = 1; y < d; y += 1) circ('y', [R, y, b], R + .005, dk(wall, .4), 14, 0, 117 * Math.PI / 180);
    // front face detail: corrugation lines, door, windows, sign
    for (let x = .5; x < w; x += .5) { const zz = Math.sqrt(Math.max(0, R * R - (x - R) * (x - R))); Fy.l(x, b, x, b + zz - .05, dk(Lc(wall), .12)); }
    const dw = Math.min(3, w * .4), dh = Math.min(3.3, b + R * .68);
    roll(Fy, R - dw / 2, R + dw / 2, 0, dh, dc, { open: r() < .5 ? .4 : 0 });
    Fy.sign(p.name || 'SHED', R - 1.6, R + 1.6, dh + .3, dh + .85, '#f4f0e8', '#2e2a3a');
    lamp(Fy, R, b + R - .35, { len: .5 });
    for (const s of [-1, 1]) { const a = R + s * (dw / 2 + (R - dw / 2) * .5); if (R - dw / 2 > 1.2) gridWin(Fy, a - .4, a + .4, 1.1, 1.9, { on: r() < .5, cols: 2, rows: 2 }); }
    door(Fx, d - 1.2, { c: dk(wall, .45), glass: false, z: 0 });
    for (let y = 1.5; y < d - 2.5; y += 2.5) { fq([[R + R * Math.cos(.7), y, b + R * Math.sin(.7)], [R + R * Math.cos(.7), y + .9, b + R * Math.sin(.7)], [R + R * Math.cos(.35), y + .9, b + R * Math.sin(.35)], [R + R * Math.cos(.35), y, b + R * Math.sin(.35)]], '#8fc0d4', '#7fb0c4'); if (r() < .6) glow(() => fq([[R + R * Math.cos(.7), y, b + R * Math.sin(.7)], [R + R * Math.cos(.7), y + .9, b + R * Math.sin(.7)], [R + R * Math.cos(.35), y + .9, b + R * Math.sin(.35)], [R + R * Math.cos(.35), y, b + R * Math.sin(.35)]], '#ffe39a', '#f4c870')); }
    for (let y = 2; y < d - 1; y += 3.5) { cyl(R, y, b + R - .05, .15, .3, '#8a9098', { ol: false }); ball(R, y, b + R + .4, .2, '#c8ccd0', { squash: .8 }); }
    if (r() < .7) { drum(w - .4, d + .35, 0, '#3f7fbf'); drum(w - 1.05, d + .4, 0, '#f2c230'); }
    if (r() < .6) crate(.2, d + .15, 0, .6);
  },
};

const lofts = {
  id: 'bld.harbor.lofts', kind: 'building', tags: ['harbor', 'residential', 'loft', 'apartment', 'brick'],
  size: p => [p.w || 10, p.d || 7, (p.floors || 4) * 2 + .6],
  vb: p => [-.5, -.5, 0, (p.w || 10) + .9, (p.d || 7) + .9, (p.floors || 4) * 2 + 4],
  door: { side: 'y', at: 1.3 },
  variants: [
    { w: 10, d: 7, floors: 4, seed: 4, wall: '#a85640', name: 'COLD STORAGE' },
    { w: 8, d: 7, floors: 3, seed: 7, wall: '#c9a27a', name: 'ROPE WORKS' },
    { w: 12, d: 8, floors: 5, seed: 15, wall: '#8a5a48', name: 'CANNERY LOFTS' },
    { w: 9, d: 6, floors: 4, seed: 23, wall: '#b5654a', name: 'TEA & SPICE' },
  ],
  draw(p) {
    const w = p.w || 10, d = p.d || 7, fl = p.floors || 4, H = fl * 2, r = rng(p.seed || 1), wall = p.wall || '#a85640', stone = '#e6dcc4', fr = '#2f3a44';
    const Fy = face('y', d), Fx = face('x', w);
    walls(0, 0, 0, w, d, H, wall, c => PAT.brick(c));
    const facade = (F, len, isFront) => {
      const nb = Math.max(2, Math.round((len - .4) / 2.2)), bw = (len - .4) / nb;
      F.q(0, len, 0, .3, PAT.stone(F.sh('#8c8a90')));
      for (let i = 0; i <= nb; i++) { const a = .2 + i * bw; F.q(a - .13, a + .13, .3, H, PAT.brick(F.sh(lt(wall, .16)))); }
      F.q(0, len, 2, 2.16, F.sh(stone)); F.q(0, len, H - .2, H, F.sh(stone));
      for (let i = 0; i < nb; i++) {
        const a0 = .2 + i * bw + .3, a1 = .2 + (i + 1) * bw - .3, m = (a0 + a1) / 2;
        if (isFront && i === 0) { door(F, 1.3, { c: '#2f6f5f', frame: stone }); F.box(.6, 0, 1.78, 1.4, .5, .08, '#2f3a44'); lamp(F, 1.3, 1.95, { len: .4 }); }
        else { // glazed former loading door with brick arch
          F.q(a0 - .06, a1 + .06, .3, 1.78, F.sh(stone)); gridWin(F, a0, a1, .36, 1.7, { on: r() < .7, cols: 3, rows: 2, frame: fr });
        }
        for (let f = 1; f < fl; f++) {
          const z = f * 2 + .42, on = r() < .55;
          F.q(a0 - .04, a1 + .04, z + 1.28, z + 1.4, F.sh(stone));
          gridWin(F, a0, a1, z, z + 1.28, { on, cols: 3, rows: 3, frame: fr, sill: true });
          const k = r();
          if (k < .22) { F.q(a0, a1, z - .2, z - .05, F.sh('#b5654a')); const fo = foliage('leaf', r()) || '#e6edf2'; for (let t = a0 + .08; t < a1; t += .14) { const q = F.p(t, z - .02, .02); spx(q[0], q[1], q[2], 0, 0, fo); spx(q[0], q[1], q[2], 0, -1, r() < .4 ? '#f2a7c3' : lt(fo, .2)); } }
          else if (k < .3) { F.q(m - .3, m + .3, z - .02, z + .4, F.sh('#c8ccd0')); F.l(m - .3, z + .2, m + .3, z + .2, '#7c858c'); }
        }
      }
    };
    facade(Fy, w, true); facade(Fx, d, false);
    // ghost sign on the side wall
    const nm = p.name || 'COLD STORAGE', tw = (nm.length * 4 - 1) / 16, gz = H - .95;
    if (tw < d - .8) { Fx.q(d / 2 - tw / 2 - .25, d / 2 + tw / 2 + .25, 2.26, 2.86, Rc(stone), 'glass'); Fx.text(nm, d / 2 + tw / 2, 2.8, Rc('#f4ecd8')); }
    // fire escape on +x wall
    const fy0 = d - 2.6;
    for (let f = fl - 1; f >= 1; f--) {
      const z = f * 2 + .28;
      if (f < fl - 1) { lw([w + .45, fy0 + .2, z + .05], [w + .45, fy0 + 2, z + 2], '#2e2a3a'); lw([w + .25, fy0 + .2, z + .05], [w + .25, fy0 + 2, z + 2], '#2e2a3a'); }
      box(w, fy0, z, .6, 2.2, .06, '#39424e', { ol: false });
      for (const yy of [fy0, fy0 + 1.1, fy0 + 2.2]) lw([w + .6, yy, z], [w + .6, yy, z + .65], '#2e2a3a');
      lw([w + .6, fy0, z + .65], [w + .6, fy0 + 2.2, z + .65], '#2e2a3a'); lw([w + .6, fy0, z + .35], [w + .6, fy0 + 2.2, z + .35], '#2e2a3a');
      lw([w, fy0 + 2.2, z + .65], [w + .6, fy0 + 2.2, z + .65], '#2e2a3a');
    }
    lw([w + .35, fy0 + .3, 2.3], [w + .35, fy0 + .3, .9], '#2e2a3a'); lw([w + .5, fy0 + .3, 2.3], [w + .5, fy0 + .3, .9], '#2e2a3a');
    // cornice + parapet + roof
    box(-.12, -.12, H, w + .24, d + .24, .22, stone);
    parapet(0, 0, H + .22, w, d, .38, .2, wall, '#6f6a70');
    const Z = H + .22;
    // stair bulkhead
    box(.7, .7, Z, 1.6, 1.4, 1.5, lt(wall, .1), { l: PAT.brick(Lc(lt(wall, .1))), r: PAT.brick(Rc(lt(wall, .1))), t: '#5a5560' }); qy(1.1, 1.8, 2.1, Z, Z + 1.2, Lc('#2f6f5f')); snowTop(.7, 2.3, .7, 2.1, Z + 1.5);
    // water tank
    const tx = w - 2, ty = 1.6;
    for (const [a, b] of [[-.5, -.5], [.5, -.5], [-.5, .5], [.5, .5]]) lw([tx + a, ty + b, Z], [tx + a, ty + b, Z + 1], '#4a3a2e');
    lw([tx - .5, ty + .5, Z], [tx + .5, ty + .5, Z + 1], '#4a3a2e'); lw([tx + .5, ty + .5, Z + 1], [tx + .5, ty - .5, Z], '#4a3a2e');
    cyl(tx, ty, Z + 1, .75, 1.25, '#9a6b42'); band(tx, ty, Z + 1.25, .75, .07, '#4d5560'); band(tx, ty, Z + 1.9, .75, .07, '#4d5560');
    cone(tx, ty, Z + 2.25, .85, .6, winter() ? '#e6edf2' : '#5a4636');
    // roof garden / clutter
    const gx = 3, gy = d - 2.4;
    if (r() < .75 && w >= 9) {
      qz(gx, w - 2.4, gy - .6, d - .8, Z + .02, PAT.fboards('#b98a52', .3));
      for (let x = gx + .2; x < w - 3; x += 1.3) { box(x, gy - .5, Z, .7, .4, .3, '#8a5a48'); const fo = foliage('leaf', r()); if (fo) ball(x + .35, gy - .3, Z + .55, .3, fo); else snowTop(x, x + .7, gy - .5, gy - .1, Z + .3, .05); }
      lw([gx, gy + 1.3, Z], [gx, gy + 1.3, Z + 1.3], '#4a4458'); lw([w - 2.5, gy + 1.3, Z], [w - 2.5, gy + 1.3, Z + 1.3], '#4a4458');
      bulbs([gx, gy + 1.3, Z + 1.3], [w - 2.5, gy + 1.3, Z + 1.3], 9, ['#ffd98a', '#ff9a7a', '#9cf2b0', '#8fd0ff']);
      box(gx + 1, gy + .3, Z, .7, .7, .35, '#f1e7cf'); box(gx + 2, gy + .4, Z, .3, .3, .25, '#d8452f', { ol: false });
    } else { ac(gx, gy - .3, Z); ac(gx + 1.4, gy - .3, Z); }
    ac(3.2, 1, Z, 1, .8); vent(5, 1.4, Z); if (w > 9) skylight(5.6, 2.4, Z, 1.6, 1, r() < .6);
    if (r() < .5) gull(w - 2, 1.6, Z + 2.9);
  },
};

export default [timber, corr, arched, lofts];
