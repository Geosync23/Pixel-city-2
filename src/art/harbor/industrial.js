// Railyard / industrial district buildings + the job sites (Pier 7 Freight, ZipParcel Depot) and roadside classics.
import { U, PW, C, px, at, box, qy, qx, qz, lw, fq, glow, lit, cyl, cone, ball, spx, ellipse, PAT, rng, dk, lt, mix, textS, textY, foliage } from '../../engine/raster.js';
import { Lc, Rc, walls, face, roll, door, gridWin, lamp, ladder, pipe, bulbs, rope, crate, barrel, drum, pallet, gull, gableS, hipS, snowTop, snowSlope, snowDisc, parapet, hcyl, band, taper, circ, disc, ring, roofPat, endPat, endBrick, ac, vent, skylight, stack, stripeHaz, chainlink, panels, bollardY, rail, winter, SNOW } from './_lib.js';

const pier7 = {
  id: 'bld.harbor.pier7', kind: 'building', tags: ['harbor', 'industrial', 'warehousejob', 'warehouse', 'freight', 'job'],
  size: p => [p.w || 16, 9, 6.8], vb: p => [-.5, -.5, 0, (p.w || 16) + .8, 9.8, 8.4],
  door: { side: 'y', at: 1.4 }, light: { x: 1.4, y: 10, z: 0, r: 5 },
  variants: [{ w: 16, seed: 1, wall: '#4f6f8f', name: 'PIER 7 FREIGHT' }, { w: 18, seed: 5, wall: '#7a8a6a', name: 'PIER 7 FREIGHT' }, { w: 14, seed: 9, wall: '#9a5a4a', name: 'PIER 7 FREIGHT' }],
  draw(p) {
    const w = p.w || 16, r = rng(p.seed || 1), wall = p.wall || '#4f6f8f', sd = 7.5, h = 5, rh = 1.7, sw = w - 5, name = p.name || 'PIER 7 FREIGHT', acc = '#f2c230';
    const Fy = face('y', sd), Fx = face('x', w);
    // shed
    walls(0, 0, 0, w, sd, h, wall, c => PAT.planks(c, 3));
    qy(0, w, sd, 0, .6, Lc('#a8a49c')); qx(w, 0, sd, 0, .6, Rc('#a8a49c'));
    Fy.q(0, w, h - 1, h - .55, Lc('#f4f0e8')); Fx.q(0, sd, h - 1, h - .55, Rc('#f4f0e8'));
    // +x gable end: giant 7 in a disc, windows
    for (let y = .8; y + 1.4 < 5.2; y += 2) gridWin(Fx, y, y + 1.4, 1.4, 2.5, { on: r() < .5, cols: 4, rows: 2 });
    pipe(Fx, .3, .6, h);
    gableS(0, 0, h, w, sd, rh, 'x', '#6c7680', { wall: endPat(wall, 'x'), over: .25, f: roofPat('#6c7680', 4) });
    const bc = [w + .01, sd / 2, h + .1]; disc('x', bc, .95, Rc('#f4f0e8'), null, 18); circ('x', bc, .95, dk(wall, .6), 20);
    const sev = [[-.45, .5], [.45, .5], [.45, .3], [0, -.55], [-.22, -.55], [.2, .3], [-.45, .3]]; // y grows to the left on the x wall: mirror
    fq([[bc[0] + .01, bc[1] + .45, bc[2] + .5], [bc[0] + .01, bc[1] - .45, bc[2] + .5], [bc[0] + .01, bc[1] - .45, bc[2] + .28], [bc[0] + .01, bc[1] + .45, bc[2] + .28]], Rc('#d8452f'));
    fq([[bc[0] + .01, bc[1] - .45, bc[2] + .28], [bc[0] + .01, bc[1] - .2, bc[2] + .28], [bc[0] + .01, bc[1] + .25, bc[2] - .58], [bc[0] + .01, bc[1], bc[2] - .58]], Rc('#d8452f'));
    for (let x = 2; x < w - 1; x += 3.2) { vent(x, sd / 2, h + rh - .1); }
    // office annex
    const ax = 0, ay = 5.2, aw = 5, ad = 3.8, aH = 4, Ay = face('y', 9), Ax = face('x', ax + aw), brick = '#a8604a';
    walls(ax, ay, 0, aw, ad, aH, brick, c => PAT.brick(c)); Ay.q(ax, ax + aw, 0, .3, Lc('#8c8a90')); Ax.q(ay, 9, 0, .3, Rc('#8c8a90'));
    door(Ay, ax + 1.4, { c: '#2f4a6a' }); Ay.box(ax + .7, 0, 1.78, 1.4, .5, .08, '#39424e'); lamp(Ay, ax + 1.4, 1.72, { len: .3 });
    gridWin(Ay, ax + 2.5, ax + 4.5, .7, 1.7, { on: true, cols: 4, rows: 2, sill: true });
    Ay.sign(name, ax + .25, ax + 4.75, 2.12, 2.72, '#1f2a3a', '#ffd060', { lit: true });
    for (const a of [ax + .5, ax + 2, ax + 3.5]) gridWin(Ay, a, a + 1, 2.95, 3.7, { on: r() < .6, cols: 2, rows: 2, sill: true });
    for (const z of [.8, 2.95]) for (const a of [ay + .5, ay + 2.2]) gridWin(Ax, a, a + 1.1, z, z + .8, { on: r() < .6, cols: 2, rows: 2, sill: true });
    parapet(ax, ay, aH, aw, ad, .3, .18, brick, '#6f6a70'); ac(ax + 1, ay + .8, aH); lw([ax + 3.5, ay + 1, aH], [ax + 3.5, ay + 1, aH + 1.8], '#4a4458'); lit(() => spx(ax + 3.5, ay + 1, aH + 1.8, 0, 0, '#ff5040'));
    at(5, 0, 0, () => {
    // dock
    box(0, sd, 0, sw, 1.5, .6, '#b8b4aa', { l: PAT.stone(Lc('#b8b4aa')) }); qz(0, sw, 8.82, 9, .6, acc); for (let x = .8; x < sw; x += 2.2) qy(x, x + .25, 9, .2, .5, '#2e2a3a');
    const nd = Math.floor((sw - .6) / 2.9);
    for (let i = 0; i < nd; i++) {
      const a = .6 + i * ((sw - .6) / nd) + .2, op = r() < .45 ? .3 + r() * .4 : 0;
      roll(Fy, a, a + 2.1, .6, 3.3, i % 2 ? '#d8d4c8' : '#c95a3a', { open: op }); Fy.text(String(i + 1), a + .95, 3.9, '#f4f0e8'); lamp(Fy, a + 1.05, 3.45, { len: .5 });
    }
    // canopy over dock
    for (let x = .1; x < sw; x += 2.9) lw([x, sd + .7, 4.2], [x, sd, 4.6], '#39424e');
    box(0, sd, 4.15, sw, .7, .08, '#6c7680', { ol: true }); snowTop(0, sw, sd, sd + .7, 4.23, .1);
    // goods on the dock
    let x = .4; while (x < sw - 1.4) { const k = r(); if (k < .35) { pallet(x, 7.75, .6, 1.1, .9); crate(x + .1, 7.85, .76, .55); if (r() < .6) crate(x + .58, 7.95, .76, .45, '#c9a36a'); } else if (k < .55) { drum(x + .3, 8.2, .6, '#3f7fbf'); drum(x + .85, 8.3, .6, '#d8452f'); } else if (k < .7) crate(x, 7.8, .6, .8, '#a87a4a'); x += 1.6 + r(); }
    for (const sx of [1.2, sw - 1.6]) { for (let i = 0; i < 3; i++) box(sx + i * .3, 9 + i * .0, 0, .3, .5, .6 - i * .2 - .0, '#a8a49c', { ol: false }); }
    });
    if (r() < .8) gull(4, sd / 2, h + rh + .02);
  },
};

const zip = {
  id: 'bld.ind.zipparcel', kind: 'building', tags: ['industrial', 'courier', 'depot', 'job', 'logistics'],
  size: p => [p.w || 14, 9, 5], vb: p => [-.5, -.5, 0, (p.w || 14) + .8, 10, 7.6],
  door: { side: 'y', at: 1.5 }, light: { x: 1.5, y: 10, z: 0, r: 5 },
  variants: [{ w: 14, seed: 1 }, { w: 17, seed: 4, wall: '#e4e6ea', c1: '#ff7a1a', c2: '#3a2f7a' }, { w: 12, seed: 8, c1: '#f2a81a', c2: '#2f5a8a' }],
  draw(p) {
    const w = p.w || 14, d = 9, H = 4.6, r = rng(p.seed || 1), wall = p.wall || '#eef0f2', c1 = p.c1 || '#ff7a1a', c2 = p.c2 || '#5a3a9a', name = p.name || 'ZIPPARCEL DEPOT';
    const Fy = face('y', d), Fx = face('x', w);
    walls(0, 0, 0, w, d, H, wall, c => panels(c, 16, 16));
    for (const [F, L] of [[Fy, w], [Fx, d]]) { F.q(0, L, 0, .35, F.sh('#7c8490')); F.q(0, L, 3.25, 4.05, F.sh(c1)); F.q(0, L, 3.12, 3.25, F.sh(c2)); }
    // glass lobby
    Fy.q(.3, 3.3, 0, 2.7, Lc('#39424e')); gridWin(Fy, .4, 3.2, 0.05, 2.6, { on: true, cols: 4, rows: 2, frame: '#39424e' }); door(Fy, 1.5, { c: c2, frame: '#39424e' });
    box(.2, d, 2.7, 3.2, .8, .14, c1); lit(() => { for (let x = .5; x < 3.3; x += .7) spx(x, d + .5, 2.7, 0, 1, '#fff2c4'); });
    // dock bays
    const nb = Math.floor((w - 4.2) / 2.4), bw = (w - 4.2) / nb;
    for (let i = 0; i < nb; i++) {
      const a = 3.9 + i * bw + (bw - 1.8) / 2, op = r() < .5 ? .3 + r() * .5 : 0;
      Fy.q(a - .22, a + 2.02, .5, 3.02, Lc('#2e2a3a'));
      roll(Fy, a, a + 1.8, .7, 2.8, '#dfe3e8', { open: op, inside: () => { if (r() < .8) { Fy.q(a + .2, a + .8, .7, 1.3, Lc('#c9a36a')); Fy.q(a + .9, a + 1.5, .7, 1.1, Lc('#b98a52')); Fy.q(a + .3, a + .7, 1.3, 1.7, Lc('#d8b47a')); } } });
      Fy.q(a - .1, a + 1.9, .35, .7, Lc('#4a4458')); Fy.q(a, a + .25, .4, .65, '#2e2a3a'); Fy.q(a + 1.55, a + 1.8, .4, .65, '#2e2a3a');
      Fy.text(String(i + 1), a + .8, 3.83, '#fff8e0'); bollardY(a - .5, d + .4);
    }
    bollardY(w - .35, d + .4);
    // name on the band (lit)
    const tw = name.length * 4 / 16; lit(() => Fy.text(name, .35, 3.83, '#fff8e0'));
    // +x side: logo, ribbon windows, door
    const ly = d - 3.2; Fx.q(ly, ly + 2.4, .9, 2.9, Rc(c2)); lit(() => { Fx.text('ZIP', ly + 1.9, 2.1, '#fff8e0'); const b = [[w + .01, ly + .75, 2.6], [w + .01, ly + .45, 1.95], [w + .01, ly + .62, 1.95], [w + .01, ly + .38, 1.25], [w + .01, ly + .9, 2.15], [w + .01, ly + .7, 2.15]]; fq([b[0], b[1], b[2], b[5]], c1); fq([b[2], b[3], b[4], b[5]], c1); });
    for (let y = .6; y + 1.5 < ly - .3; y += 1.9) gridWin(Fx, y, y + 1.5, 1.6, 2.6, { on: r() < .7, cols: 3, rows: 1, frame: '#39424e' });
    door(Fx, .9 + (ly > 4 ? 0 : 0), { c: '#7c8490', glass: false }); 
    // roof
    parapet(0, 0, H, w, d, .4, .2, wall, '#7a7f88');
    for (let i = 0; i < 3; i++) ac(1 + i * 1.5, 1, H, 1.1, .8);
    const sx = 6, sy = 1; for (let i = 0; i < Math.floor((w - 7.5) / 1.4); i++) for (let j = 0; j < 2; j++) { const x = sx + i * 1.4, y = sy + j * 1.5; fq([[x, y, H + .5], [x + 1.2, y, H + .5], [x + 1.2, y + 1.2, H + .12], [x, y + 1.2, H + .12]], winter() ? SNOW : '#2f4a7a', winter() ? '#c8d8e8' : '#3a5a8f'); lw([x, y + 1.2, H + .12], [x + 1.2, y + 1.2, H + .12], '#c8ccd0'); lw([x + .6, y, H + .5], [x + .6, y + 1.2, H + .12], '#5a7aaf'); qx(x + 1.2, y, y + .02, H, H + .5, '#4a4458'); }
    // rooftop sign
    const rx = 1, ry = d - 1.6; lw([rx + .3, ry + .1, H], [rx + .3, ry + .1, H + .5], '#4a4458'); lw([rx + 2.9, ry + .1, H], [rx + 2.9, ry + .1, H + .5], '#4a4458');
    box(rx, ry, H + .5, 3.2, .2, 1.3, c2); face('y', ry + .21).sign('ZIP', rx + 1.1, rx + 3.1, H + .6, H + 1.7, c2, '#fff8e0', { lit: true, frame: false });
    lit(() => { const X = rx + .2, Y = ry + .21, Z = H + .55; fq([[X + .55, Y, Z + 1.15], [X + .1, Y, Z + .5], [X + .4, Y, Z + .5], [X + .65, Y, Z + .68]], c1); fq([[X + .4, Y, Z + .5], [X + .65, Y, Z + .68], [X + .8, Y, Z + .68], [X + .25, Y, Z + .02]], c1); });
    lw([w - 1.2, 1.2, H], [w - 1.2, 1.2, H + 1.4], '#4a4458'); ball(w - 1.2, 1.2, H + 1.4, .35, '#e4e6ea', { squash: .7 });
    // parcel cages by the lobby
    for (const [x, y] of [[3.45, d + .25]]) { box(x, y, 0, .7, .6, .75, '#b98a52', { ol: false }); box(x + .1, y + .1, .75, .45, .4, .3, '#c9a36a', { ol: false }); chainlink(face('y', y + .62), x, x + .72, .05, 1.15, '#4f7fbf'); chainlink(face('x', x + .72), y, y + .62, .05, 1.15, '#4f7fbf'); }
  },
};

const factory = {
  id: 'bld.ind.factory', kind: 'building', tags: ['industrial', 'factory', 'landmark'],
  size: p => [p.w || 15, p.d || 9, 12.5], vb: p => [-.5, -.5, 0, (p.w || 15) + .8, (p.d || 9) + .9, 13.2],
  variants: [{ w: 15, d: 9, seed: 1, wall: '#a85640', name: 'MAPLE BAY WORKS' }, { w: 18, d: 10, seed: 6, wall: '#8a7a6a', clad: '#5f87a8', name: 'IRONSIDE FOUNDRY' }, { w: 13, d: 8, seed: 11, wall: '#b58a5a', clad: '#7fa07a', name: 'BAY CANNERY' }],
  draw(p) {
    const w = p.w || 15, d = p.d || 9, r = rng(p.seed || 1), wall = p.wall || '#a85640', clad = p.clad || '#8a9098', H = 4.4, name = p.name || 'MAPLE BAY WORKS', bw = 3.4, bd = Math.round(d * .6), bH = 5.6;
    // boiler house + stacks
    walls(0, 0, 0, bw, bd, bH, wall, c => PAT.brick(c)); const By = face('y', bd);
    gridWin(By, .6, 2.6, 2.6, 4.6, { on: true, cols: 3, rows: 4, glowc: ['#ffb060', '#f09040'] }); roll(By, .7, 2.5, 0, 2.1, '#5a6672', { open: 0 });
    parapet(0, 0, bH, bw, bd, .3, .18, wall, '#5a5560');
    stack(1, 1.2, bH, .5, 6.4, '#b5654a', { pat: true }); stack(2.3, 2.6, bH, .42, 5.2, '#b5654a', { pat: true });
    // yard tank + pipes in front of the boiler house
    for (const y of [bd + .5, bd + 1.9]) if (y + 1 < d) { for (const x of [.6, 2.2]) box(x, y, 0, .2, .9, .5, '#5a6672', { ol: false }); hcyl('x', .3, y + .45, .95, 2.5, .5, y > bd + 1 ? '#e8e2d4' : '#d8a23a', { snow: true }); }
    lw([1.5, bd + .45, 1.45], [1.5, bd + .45, 2.6], '#6c7a83'); lw([1.5, bd + .45, 2.6], [bw, bd + .45, 2.6], '#6c7a83'); lw([1.5, bd + .45, 2.7], [bw, bd + .45, 2.7], '#8a98a3');
    // main hall
    const x0 = bw, hw = w - bw, Fy = face('y', d), Fx = face('x', w);
    walls(x0, 0, 0, hw, d, H, wall, c => PAT.brick(c));
    Fy.q(x0, w, 0, .35, PAT.stone(Lc('#8c8a90'))); Fx.q(0, d, 0, .35, PAT.stone(Rc('#8c8a90')));
    Fy.q(x0, w, H - .75, H - .1, Lc('#f1e7cf')); Fy.text(name, x0 + Math.max(.2, (hw - name.length * 4 / 16) / 2), H - .28, Lc('#3a3446')); Fx.q(0, d, H - .75, H - .1, Rc('#f1e7cf'));
    const nb = Math.max(3, Math.round(hw / 2.4)), bwid = hw / nb;
    for (let i = 0; i <= nb; i++) { const a = x0 + i * bwid; Fy.q(Math.max(x0, a - .12), Math.min(w, a + .12), .35, H - .75, PAT.brick(Lc(lt(wall, .15)))); }
    for (let i = 0; i < nb; i++) {
      const a0 = x0 + i * bwid + .35, a1 = x0 + (i + 1) * bwid - .35;
      if (i === 1) { roll(Fy, a0 - .1, a1 + .1, 0, 2.9, '#4f6f5a', { open: r() < .6 ? .45 : 0 }); stripeHaz(Fy, a0 - .3, a0 - .2, 0, 1); stripeHaz(Fy, a1 + .2, a1 + .3, 0, 1); lamp(Fy, (a0 + a1) / 2, 3.25, { len: .3 }); }
      else if (i === nb - 1) { door(Fy, a0 + .5, { c: '#3a4a5a', glass: false }); lamp(Fy, a0 + .5, 2.1, { len: .7 }); gridWin(Fy, a0 + 1.1, a1, 1.2, 3.2, { on: r() < .7, cols: 2, rows: 4 }); }
      else gridWin(Fy, a0, a1, 1.2, 3.2, { on: r() < .7, cols: 3, rows: 4, sill: true });
    }
    for (let y = .6; y + 1.6 < d - .3; y += 2.3) gridWin(Fx, y, y + 1.6, 1.2, 3.2, { on: r() < .6, cols: 3, rows: 4, sill: true });
    pipe(Fx, .3, .35, H); pipe(Fx, d - .25, .35, H);
    // sawtooth roof
    const nt = Math.max(3, Math.round(hw / 2.3)), tw = hw / nt, rise = 1.35;
    for (let i = 0; i < nt; i++) {
      const a = x0 + i * tw, b = a + tw, Z = H, slope = [[a, 0, Z], [a, d, Z], [b, d, Z + rise], [b, 0, Z + rise]];
      fq(slope, '#7a808a'); for (let y = 1.5; y < d; y += 1.5) lw([a, y, Z], [b, y, Z + rise], '#6a707a');
      snowSlope([b, 0, Z + rise], [b, d, Z + rise], [a, 0, Z], [a, d, Z], .55);
      fq([[a, d, Z], [b, d, Z], [b, d, Z + rise]], endPat(clad, 'y')); lw([a, d, Z], [b, d, Z + rise], dk(clad, .6));
      qx(b, 0, d, Z, Z + rise, Rc(clad)); const G = face('x', b); for (let y = .3; y + 1.2 < d; y += 1.5) gridWin(G, y, y + 1.25, Z + .2, Z + rise - .15, { on: r() < .75, cols: 3, rows: 1, frame: '#39424e' });
      lw([b, 0, Z + rise], [b, d, Z + rise], lt(clad, .5)); lw([b, d, Z], [b, d, Z + rise], dk(clad, .6));
    }
    lw([x0, 0, H], [x0, d, H], dk(wall, .6));
    // clutter
    drum(w - .5, d + .35, 0, '#3f7fbf'); drum(w - 1.1, d + .4, 0, '#3f7fbf'); pallet(x0 + .3, d + .05, 0, 1.1, .8); crate(x0 + .4, d + .15, .16, .6);
  },
};

const silos = {
  id: 'bld.ind.silos', kind: 'building', tags: ['industrial', 'silo', 'grain', 'landmark'],
  size: p => [(p.n || 4) * 2.6 + 3.4, 3.6, (p.h || 8) + 4.2], vb: p => [-.5, -.5, 0, (p.n || 4) * 2.6 + 4.2, 4.6, (p.h || 8) + 5],
  variants: [{ n: 4, h: 8, seed: 1, c: '#d8d2c2', name: 'MAPLE BAY', name2: 'GRAIN CO' }, { n: 3, h: 7, seed: 5, c: '#aab8c4', acc: '#3f7fbf', name: 'BAY FEED', name2: '& SEED' }, { n: 5, h: 9, seed: 9, c: '#e4dccc', acc: '#3f8a55', name: 'HARVEST', name2: 'ELEVATOR' }],
  draw(p) {
    const n = p.n || 4, h = p.h || 8, r = rng(p.seed || 1), c = p.c || '#d8d2c2', acc = p.acc || '#b5503c', R = 1.3, cy = 1.8, hh = h + 3.3, hw = 3.2;
    // headhouse
    walls(0, 0, 0, hw, 3.6, hh, c, cc => panels(cc, 8, 32)); const Hy = face('y', 3.6), Hx = face('x', hw);
    Hy.q(0, hw, hh - 2.4, hh - .9, Lc(acc)); Hy.text(p.name || 'MAPLE BAY', .2 + Math.max(0, (hw - .4 - ((p.name || 'MAPLE BAY').length * 4 - 1) / 16) / 2), hh - 1.2, '#fff8e0'); Hy.text(p.name2 || 'GRAIN CO', .2 + Math.max(0, (hw - .4 - ((p.name2 || 'GRAIN CO').length * 4 - 1) / 16) / 2), hh - 1.75, '#fff8e0');
    roll(Hy, .5, 2.7, 0, 2.6, '#7c8490', { open: r() < .5 ? .5 : 0 }); lamp(Hy, 1.6, 2.95, { len: .3 });
    for (let z = 3.6; z + 1 < hh - 2.5; z += 1.9) gridWin(Hy, 1.1, 2.1, z, z + .8, { on: r() < .6, cols: 2, rows: 2 });
    for (let z = h + .6; z < hh - .8; z += 1.3) gridWin(Hx, 1.2, 2.4, z, z + .7, { on: r() < .6, cols: 3, rows: 1 });
    gableS(0, 0, hh, hw, 3.6, .9, 'x', '#6c7680', { wall: Rc(c), over: .2 });
    // elevator leg + spout on the front
    box(hw - .6, 3.6, 0, .4, .35, hh - .6, '#8a9098'); lw([.4, 3.62, 3], [.4, 3.62, hh - 2.5], '#6c7a83');
    // silos
    for (let i = 0; i < n; i++) {
      const x = hw + .2 + R + i * 2.6;
      cyl(x, cy, 0, R, h, c); for (let z = 1.6; z < h; z += 1.6) band(x, cy, z, R, .06, dk(c, .12));
      band(x, cy, h - .9, R, .5, acc); snowDisc(x, cy, h, R);
      const s = PW(x + R * .707, cy + R * .707, h * .55); textS(String(i + 1), Math.round(s[0]) - 1, Math.round(s[1]), dk(c, .5));
      cone(x, cy + R + .1, 0.5, .45, -.5 + 0.001, '#6c7680');
    }
    // ladder with cage on the last silo
    { const x = hw + .2 + R + (n - 1) * 2.6, s0 = PW(x + R * .9, cy + R * .43, 0), X = Math.round(s0[0]), Y = Math.round(s0[1]); for (let j = 2; j < h * U; j++) { px(X - 2, Y - j, C('#4a4458')); px(X + 2, Y - j, C('#4a4458')); if (j % 4 === 0) for (let i = -1; i <= 1; i++) px(X + i, Y - j, C('#4a4458')); } }
    // gallery on top
    const gx = hw - .1, gl = n * 2.6 + .3; for (let i = 0; i < n; i++) { const x = hw + .2 + R + i * 2.6; lw([x - .8, cy + .6, h], [x - .8, cy + .6, h + .5], '#4a4458'); lw([x + .8, cy + .6, h], [x + .8, cy + .6, h + .5], '#4a4458'); }
    walls(gx, cy - .6, h + .5, gl, 1.2, 1, lt(c, .1), cc => panels(cc, 8, 32)); const Gy = face('y', cy + .6);
    for (let x = gx + .5; x + .7 < gx + gl; x += 1.3) gridWin(Gy, x, x + .7, h + .85, h + 1.25, { on: r() < .6, cols: 2, rows: 1 });
    gableS(gx, cy - .6, h + 1.5, gl, 1.2, .45, 'x', '#6c7680', { wall: Rc(c), over: .12 });
    lit(() => spx(1.6, 1.8, hh + .9, 0, -1, '#ff5040')); if (r() < .7) gull(gx + gl * .6, cy, h + 1.97);
  },
};

const tanks = {
  id: 'bld.ind.tanks', kind: 'building', tags: ['industrial', 'tanks', 'oil', 'gas', 'harbor'],
  size: p => p.kind === 'sphere' ? [(p.n || 2) * 4, 4, 4.8] : p.kind === 'bullet' ? [7, (p.n || 3) * 2 + .6, 2.6] : [(p.n || 2) * 5.4 + .6, 6, 4.6],
  vb: p => { const s = tanks.size(p); return [-.4, -.4, 0, s[0] + .5, s[1] + .6, s[2] + 1.2]; },
  variants: [{ kind: 'oil', n: 2, seed: 1, acc: '#d8452f' }, { kind: 'oil', n: 1, seed: 4, acc: '#3f7fbf', c: '#e4e8ea' }, { kind: 'sphere', n: 2, seed: 2, acc: '#f2a81a' }, { kind: 'bullet', n: 3, seed: 3, acc: '#3f8a55' }, { kind: 'oil', n: 3, seed: 7, acc: '#3f8a55', c: '#d8d4c4' }],
  draw(p) {
    const kind = p.kind || 'oil', n = p.n || 2, r = rng(p.seed || 1), c = p.c || '#eef0ee', acc = p.acc || '#d8452f', S = tanks.size(p);
    const gravel = (x, y) => (((x * 16) | 0) * 7 + ((y * 16) | 0) * 13) % 11 === 0 ? '#8a8680' : '#9c988e';
    if (kind === 'oil') {
      box(0, 0, 0, S[0], S[1], .12, '#9c988e', { t: winter() ? SNOW : gravel, ol: false });
      qy(0, S[0], .15, .12, .5, Lc('#b8b4aa')); qx(.15, 0, S[1], .12, .5, Rc('#b8b4aa'));
      for (let i = 0; i < n; i++) {
        const x = .3 + 2.7 + i * 5.4, y = 3, R = 2.3, h = 3.7;
        cyl(x, y, .12, R, h, c); band(x, y, .12 + h - 1.1, R, .6, acc); for (const z of [1.2, 2.3]) band(x, y, z, R, .05, dk(c, .14)); snowDisc(x, y, .12 + h, R);
        // spiral stair
        let pv = null; for (let k = 0; k <= 14; k++) { const a = (128 - k * 12) * Math.PI / 180, q = [x + Math.cos(a) * (R + .05), y + Math.sin(a) * (R + .05), .12 + h * k / 14]; if (pv) { lw(pv, q, '#4a4458'); lw([pv[0], pv[1], pv[2] + .4], [q[0], q[1], q[2] + .4], '#6c7a83'); if (k % 2) lw(q, [q[0], q[1], q[2] + .4], '#6c7a83'); } pv = q; }
        circ('z', [x, y, .12 + h + .4], R, '#6c7a83', 24, -.75, 2.3); for (let k = 0; k < 8; k++) { const a = -.75 + k * 3.05 / 7; lw([x + Math.cos(a) * R, y + Math.sin(a) * R, .12 + h], [x + Math.cos(a) * R, y + Math.sin(a) * R, .12 + h + .4], '#6c7a83'); }
        cyl(x, y, .12 + h, .25, .25, '#8a9098', { ol: false }); const s = PW(x + R * .707, y + R * .707, 1.9); textS('T' + (i + 1), Math.round(s[0]) - 3, Math.round(s[1]), dk(c, .55));
        lw([x + R, y + .5, .5], [x + R + .6, y + .5, .5], '#6c7a83'); cyl(x + R + .6, y + .5, .12, .12, .5, '#d8452f', { ol: false });
      }
      qy(0, S[0], S[1], 0, .5, Lc('#b8b4aa')); qx(S[0], 0, S[1], 0, .5, Rc('#b8b4aa')); lw([0, S[1], .5], [S[0], S[1], .5], '#e8e4da'); lw([S[0], 0, .5], [S[0], S[1], .5], '#e8e4da');
      stripeHaz(face('y', S[1]), S[0] / 2 - .5, S[0] / 2 + .5, .08, .42);
    } else if (kind === 'sphere') {
      box(0, 0, 0, S[0], S[1], .12, '#b8b4aa', { ol: false });
      for (let i = 0; i < n; i++) {
        const x = 2 + i * 4, y = 2, R = 1.6, zc = 2.75;
        for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2 + .5; lw([x + Math.cos(a) * 1.25, y + Math.sin(a) * 1.25, .12], [x + Math.cos(a) * 1.25, y + Math.sin(a) * 1.25, zc], '#6c7a83'); lw([x + Math.cos(a) * 1.25, y + Math.sin(a) * 1.25, .12], [x + Math.cos(a + 1.05) * 1.25, y + Math.sin(a + 1.05) * 1.25, 1.4], '#8a98a3'); }
        ball(x, y, zc, R / 1.2 * 1.22, c, { squash: 1 }); const s = PW(x, y, zc);
        for (let X = -30; X <= 30; X++) { const k = X / 31, Y = Math.round(s[1] + 5 + 8 * Math.sqrt(1 - k * k)); px(s[0] + X, Y, C(acc)); px(s[0] + X, Y + 1, C(acc)); px(s[0] + X, Y + 2, C(dk(acc, .2))); }
        if (winter()) ellipse(s[0] - 3, s[1] - 24, 14, 5, SNOW);
        lw([x, y, zc + R], [x, y, zc + R + .5], '#6c7a83'); box(x - .4, y - .4, zc + R - .02, .8, .8, .06, '#6c7a83', { ol: false });
        let pv = null; for (let k = 0; k <= 8; k++) { const q = [x + R * .1 + k * .2, y + R + .15 - k * .1, .12 + (zc + R - .3) * k / 8]; if (pv) lw(pv, q, '#4a4458'); pv = q; }
        textS('G' + (i + 1), Math.round(s[0]) - 6, Math.round(s[1]) - 6, dk(c, .5));
      }
    } else {
      box(0, 0, 0, S[0], S[1], .12, '#b8b4aa', { ol: false });
      for (let i = 0; i < n; i++) {
        const y = 1.15 + i * 2, R = .8;
        for (const x of [1.4, 5]) box(x, y - .7, .12, .4, 1.4, .7, '#8c8a90');
        hcyl('x', .9, y, 1.5, 5.2, R, c, { snow: true }); ball(6.1, y, 1.5, R * .92, Rc(c), { squash: 1, ol: false });
        for (const x of [2.2, 4.4]) circ('x', [x, y, 1.5], R + .01, dk(c, .3), 14, -1.1, 2.04);
        fq([[2.6, y + R * .88, 1.5 + R * .5], [4, y + R * .88, 1.5 + R * .5], [4, y + R, 1.5 + R * .05], [2.6, y + R, 1.5 + R * .05]], Lc(acc));
        cyl(3.3, y, 1.5 + R - .05, .14, .3, '#d8452f', { ol: false }); lw([3.3, y, 2.5], [5.6, y, 2.5], '#6c7a83');
      }
      lw([5.6, 1.15, 2.5], [5.6, 1.15 + (n - 1) * 2, 2.5], '#6c7a83');
    }
  },
};

const substation = {
  id: 'bld.ind.substation', kind: 'building', tags: ['industrial', 'power', 'substation', 'utility'],
  size: p => [p.w || 8, 6, 5], vb: p => [-.4, -.4, 0, (p.w || 8) + .5, 6.5, 6],
  light: { x: 4, y: 3, z: 0, r: 4 },
  variants: [{ w: 8, seed: 1 }, { w: 10, seed: 4 }, { w: 7, seed: 7 }],
  draw(p) {
    const w = p.w || 8, d = 6, r = rng(p.seed || 1), st = '#6c7a83';
    qz(0, w, 0, d, .02, winter() ? (x, y) => (((x * 16) | 0) + ((y * 16) | 0)) % 9 === 0 ? '#c8d0d8' : SNOW : (x, y) => (((x * 16) | 0) * 7 + ((y * 16) | 0) * 13) % 11 === 0 ? '#8a8680' : '#a8a498');
    chainlink(face('y', .1), .1, w - .1, 0, 1.9); chainlink(face('x', .1), .1, d - .1, 0, 1.9);
    // control hut (back-left)
    walls(.5, .5, 0, 2.2, 1.8, 2.2, '#c9c2b0', c => PAT.brick(c, dk(c, .18))); door(face('y', 2.3), 1.2, { c: '#4f6f5a', glass: false }); lamp(face('y', 2.3), 1.2, 1.95, { len: .5 });
    box(.4, .4, 2.2, 2.4, 2, .15, '#6f6a70'); snowTop(.4, 2.8, .4, 2.4, 2.35); gridWin(face('x', 2.7), .9, 1.9, 1, 1.7, { on: true, cols: 2, rows: 1 });
    // bus gantries
    const gant = (x) => { for (const y of [.9, 4.9]) { lw([x, y, 0], [x, y, 4.3], st); lw([x + .15, y, 0], [x + .15, y, 4.3], dk(st, .3)); for (let z = .4; z < 4; z += .8) { lw([x, y, z], [x + .15, y, z + .4], st); } } box(x - .05, .8, 4.3, .25, 4.2, .15, st);
      for (const y of [1.6, 2.9, 4.2]) { for (let k = 0; k < 4; k++) spx(x + .08, y, 4.3 - k * .1, 0, 0, k % 2 ? '#e8e2d4' : '#8a5a48'); } };
    const g1 = 3.6, g2 = w - 1.4; gant(g1);
    // transformers
    const nt = w >= 9.5 ? 2 : 1;
    for (let i = 0; i < nt; i++) {
      const x = g1 + .9 + i * 2.3, y = 2.2, c = i % 2 ? '#7f9a8a' : '#8a98a3';
      box(x - .1, y - .1, 0, 1.6, 1.8, .15, '#b8b4aa', { ol: false });
      box(x, y, .15, 1.4, 1.2, 1.4, c, { l: PAT.planks(Lc(c), 2) }); box(x + .1, y + 1.2, .3, 1.2, .3, 1, dk(c, .1), { l: PAT.planks(Lc(dk(c, .15)), 2), ol: false });
      hcyl('x', x + .1, y + .25, 1.85, 1.2, .2, lt(c, .1)); snowTop(x, x + 1.4, y + .5, y + 1.2, 1.55, .08);
      for (const xx of [x + .3, x + .7, x + 1.1]) { lw([xx, y + .8, 1.55], [xx, y + .8, 2.3], '#8a5a48'); for (let k = 0; k < 4; k++) { spx(xx, y + .8, 1.75 + k * .14, -1, 0, '#e8e2d4'); spx(xx, y + .8, 1.75 + k * .14, 1, 0, '#e8e2d4'); } lw([xx, y + .8, 2.3], [g1 + .08, 1.6 + (xx - x - .3) * 3.2, 4.25], '#3a3446'); }
      stripeHaz(face('y', y + 1.51), x + .3, x + .9, .5, .8);
    }
    gant(g2);
    for (const y of [1.6, 2.9, 4.2]) { let pv = [g1 + .08, y, 4.25]; for (let k = 1; k <= 6; k++) { const t = k / 6, q = [g1 + .08 + (g2 - g1) * t, y, 4.25 - Math.sin(t * Math.PI) * .35]; lw(pv, q, '#3a3446'); pv = q; } lw([g2 + .08, y, 4.25], [w + .3, y, 4.7], '#3a3446'); }
    // floodlight
    lw([w - .6, .6, 0], [w - .6, .6, 3.6], '#4a4458'); box(w - .8, .55, 3.6, .4, .2, .2, '#39424e'); glow(() => { qy(w - .78, w - .42, .76, 3.62, 3.78, '#fff2c4'); fq([[w - .8, .8, 3.6], [w - .4, .8, 3.6], [w - .2, 2.6, 0.03], [w - 2.4, 2.6, .03]], '#ffe39a', 'glass'); });
    // front fences + signs
    chainlink(face('y', d - .1), .1, w - .1, 0, 1.9); chainlink(face('x', w - .1), .1, d - .1, 0, 1.9);
    for (const a of [1.5, w - 2]) { const F = face('y', d - .08); F.q(a, a + .5, 1, 1.5, '#f2c230'); const q = F.p(a + .25, 1.25, .01); spx(q[0], q[1], q[2], 0, -2, '#2e2a3a'); spx(q[0], q[1], q[2], -1, -1, '#2e2a3a'); spx(q[0], q[1], q[2], 0, 0, '#2e2a3a'); spx(q[0], q[1], q[2], 1, 0, '#2e2a3a'); spx(q[0], q[1], q[2], 0, 1, '#2e2a3a'); spx(q[0], q[1], q[2], -1, 2, '#2e2a3a'); }
    { const F = face('x', w - .08); F.q(2.6, 3.3, 1, 1.5, '#f2c230'); F.l(2.75, 1.25, 3.15, 1.25, '#2e2a3a'); }
  },
};

const brewery = {
  id: 'bld.ind.brewery', kind: 'building', tags: ['industrial', 'brewery', 'bar', 'food', 'brick'],
  size: p => [11, 8, 8.2], vb: [-.5, -.5, 0, 11.9, 9, 12.6],
  door: { side: 'y', at: 1.3 }, light: { x: 1.3, y: 9.2, z: 0, r: 4 },
  variants: [{ seed: 1, wall: '#a85640', name: 'MAPLE BREWING CO' }, { seed: 5, wall: '#8a6a52', roof: '#3f6a5a', name: 'OLD ANCHOR BREWERY' }, { seed: 9, wall: '#c9a27a', roof: '#7a3f3a', name: 'HOPYARD BREW CO' }],
  draw(p) {
    const r = rng(p.seed || 1), wall = p.wall || '#a85640', roof = p.roof || '#4a5868', stone = '#e6dcc4', cop = '#c8783a', name = p.name || 'MAPLE BREWING CO', mw = 7, d = 8, H = 6, w = 11;
    // chimney (back)
    box(5, .6, 0, 1.2, 1.2, 6.4, wall, { l: PAT.brick(Lc(wall)), r: PAT.brick(Rc(wall)) });
    stack(5.6, 1.2, 6.4, .5, 5.2, wall, { pat: true, band: stone });
    // main block
    const Fy = face('y', d), Fx = face('x', mw);
    walls(0, 0, 0, mw, d, H, wall, c => PAT.brick(c)); Fy.q(0, mw, 0, .35, PAT.stone(Lc('#8c8a90')));
    for (const a of [0, mw - .25]) Fy.q(a, a + .25, .35, H, PAT.brick(Lc(lt(wall, .15))));
    Fy.q(0, mw, 3.95, 4.7, Lc(stone)); Fy.text(name, Math.max(.15, (mw - (name.length * 4 - 1) / 16) / 2), 4.5, Lc('#3a2a2a'));
    Fy.q(.65, 1.95, 0, 1.85, Lc(stone)); door(Fy, .98, { c: '#3f5a3a', frame: stone }); door(Fy, 1.62, { c: '#3f5a3a', frame: stone }); lamp(Fy, 1.3, 2.25, { len: .35 });
    // kettle window
    const k0 = 2.8, k1 = 6.3; Fy.q(k0 - .1, k1 + .1, .35, 3.3, Lc(stone)); Fy.q(k0, k1, .45, 3.2, '#4a3a3a'); glow(() => Fy.q(k0, k1, .45, 3.2, '#ffcf7a', '#f0b050'));
    for (const cx of [k0 + .95, k1 - .95]) { const cc = [cx, d + .005, 1.5]; disc('y', cc, .8, Lc(cop), null, 16, 0, Math.PI); Fy.q(cx - .8, cx + .8, .45, 1.5, Lc(cop)); Fy.q(cx - .12, cx + .12, 2.25, 3.2, Lc(cop)); Fy.l(cx - .8, 1.5, cx + .8, 1.5, lt(cop, .5)); Fy.l(cx - .45, 1.95, cx - .15, 2.2, lt(cop, .6)); Fy.q(cx - .25, cx + .25, .8, 1.15, Lc(dk(cop, .35))); }
    for (let i = 1; i < 4; i++) { const a = k0 + (k1 - k0) * i / 4; Fy.l(a, .45, a, 3.2, '#2e2a3a'); } Fy.l(k0, 2.3, k1, 2.3, '#2e2a3a'); Fy.l(k0, .45, k1, .45, '#2e2a3a');
    for (let a = .7; a + 1.2 <= mw - .5; a += 1.55) { Fy.q(a - .05, a + 1.25, 4.95 + .75, 4.95 + .85, Lc(stone)); gridWin(Fy, a, a + 1.2, 4.95, 5.7, { on: r() < .6, cols: 3, rows: 2, sill: true }); }
    for (let y = .8; y + 1.2 < 5; y += 1.7) for (const z of [4.9]) gridWin(Fx, y, y + 1.2, z, z + .8, { on: r() < .6, cols: 3, rows: 2, sill: true });
    // hop emblem
    const ec = [.9 + 0, d + .01, 3.1]; disc('y', [1.3, d + .01, 3.05], .48, Lc(stone), null, 14); disc('y', [1.3, d + .01, 3.05], .34, Lc('#4f8a45'), null, 10); const hq = [1.3, d + .02, 3.05]; spx(hq[0], hq[1], hq[2], 0, -2, '#8fd06a'); spx(hq[0], hq[1], hq[2], -1, 0, '#8fd06a'); spx(hq[0], hq[1], hq[2], 1, 1, '#8fd06a');
    // hall (lower, right-back) + roof
    const hx = mw, hd = 5.4, hH = 3.6, Hy = face('y', hd), Hx = face('x', w);
    walls(hx, 0, 0, w - hx, hd, hH, wall, c => PAT.brick(c)); Hx.q(0, hd, 0, .35, PAT.stone(Rc('#8c8a90'))); Hy.q(hx, w, 0, .35, PAT.stone(Lc('#8c8a90')));
    roll(Hy, hx + .8, hx + 3.2, 0, 2.6, '#4f6f5a', { open: r() < .5 ? .4 : 0 });
    for (let y = .7; y + 1.4 < hd - .3; y += 2) gridWin(Hx, y, y + 1.4, 1.2, 2.7, { on: r() < .7, cols: 3, rows: 3, sill: true, glowc: ['#ffcf7a', '#f0b050'] });
    gableS(hx, 0, hH, w - hx, hd, 1.2, 'y', roof, { wall: endBrick(wall, 'y'), over: .2 });
    gableS(0, 0, H, mw, d, 1.6, 'x', roof, { wall: endBrick(wall, 'x'), over: .25, f: roofPat(roof, 4) });
    box(2.2, d / 2 - .45, H + 1.3, 1.6, .9, .6, stone, { l: PAT.siding(Lc(stone), 2) }); gableS(2.2, d / 2 - .45, H + 1.9, 1.6, .9, .4, 'x', cop, { over: .12 });
    // fermenter yard
    box(hx, hd, 0, w - hx, d - hd, .15, '#b8b4aa', { ol: false });
    for (let i = 0; i < 3; i++) { const x = hx + .75 + i * 1.25, y = hd + 1.2, st = '#c8d0d8'; for (const [a, b] of [[-.4, .3], [.4, .3], [0, -.4]]) lw([x + a, y + b, .15], [x + a * .6, y + b * .6, 1], '#6c7a83'); cone(x, y, 1.05, .2, -.01, st); taper(x, y, .7, .12, .58, .55, st, { cap: false }); cyl(x, y, 1.25, .58, 3, st, { ol: true }); band(x, y, 2.2, .58, .05, '#8a98a3'); band(x, y, 3.3, .58, .05, '#8a98a3'); cone(x, y, 4.25, .58, .4, winter() ? SNOW : st); const s = PW(x - .2, y + .3, 3.9); for (let j = 0; j < 30; j++) px(s[0], s[1] + j, C('#f4f8fb')); }
    lw([hx + .2, hd + 1.9, 4.35], [w - .2, hd + 1.9, 4.35], '#4a4458'); lw([hx + .2, hd + 1.9, 4.8], [w - .2, hd + 1.9, 4.8], '#4a4458'); for (let x = hx + .2; x <= w - .1; x += .9) lw([x, hd + 1.9, 4.35], [x, hd + 1.9, 4.8], '#4a4458');
    // barrels by the door + lights
    barrel(.35, d + .4, 0); barrel(2.35, d + .4, 0); barrel(2.4, d + .45, .75, '#9a6b42', .24, .6);
    bulbs([.2, d + .05, 3.7], [mw - .2, d + .05, 3.7], 14, ['#ffd98a', '#ffb060'], .25);
  },
};

const busdepot = {
  id: 'bld.ind.busdepot', kind: 'building', tags: ['industrial', 'busdepot', 'garage', 'transit'],
  size: p => [p.w || 14, p.d || 9, 5.6], vb: p => [-.5, -.5, 0, (p.w || 14) + .8, (p.d || 9) + .8, 7],
  variants: [{ w: 14, d: 9, seed: 1, wall: '#e9e2cf', acc: '#3f8a6a', bus: '#3f8a6a' }, { w: 17, d: 10, seed: 3, wall: '#d8dce0', acc: '#2f6f9f', bus: '#f2a81a' }, { w: 11, d: 8, seed: 8, wall: '#e6d2b0', acc: '#b5503c', bus: '#d8452f' }],
  draw(p) {
    const w = p.w || 14, d = p.d || 9, H = 4.4, r = rng(p.seed || 1), wall = p.wall || '#e9e2cf', acc = p.acc || '#3f8a6a', busc = p.bus || acc, Fy = face('y', d), Fx = face('x', w);
    walls(0, 0, 0, w, d, H, wall, c => PAT.stucco(c));
    for (const [F, L] of [[Fy, w], [Fx, d]]) { F.q(0, L, 0, .4, F.sh('#8c8a90')); F.q(0, L, 3.55, 3.85, F.sh(acc)); }
    const nb = Math.max(2, Math.floor((w - 1) / 3.1)), bw = (w - 1) / nb;
    for (let i = 0; i < nb; i++) {
      const a0 = .5 + i * bw + .25, a1 = .5 + (i + 1) * bw - .25, open = r() < .6, m = (a0 + a1) / 2;
      Fy.q(a0 - .12, a1 + .12, 0, 3.35, Lc('#4a4458'));
      roll(Fy, a0, a1, 0, 3.2, acc, { open: open ? .82 : 0, inside: () => {
        const b0 = m - 1.05, b1 = m + 1.05; Fy.q(b0, b1, .3, 2.55, Lc(busc)); Fy.q(b0, b1, .3, .75, Lc('#f4f0e8')); Fy.q(b0 + .1, b1 - .1, 2.12, 2.45, '#1f2430'); lit(() => Fy.text(String(10 + Math.floor(r() * 80)), m - .25, 2.42, '#ffb347'));
        Fy.w(b0 + .12, b1 - .12, 1.05, 2.02, { on: false, glass: ['#3a5a72', '#4a6a82'], mullion: 'v' }); Fy.q(b0, b1, .18, .32, '#2e2a3a');
        for (const s of [b0 + .15, b1 - .4]) { Fy.q(s, s + .25, .45, .62, '#f1e6bd'); glow(() => Fy.q(s, s + .25, .45, .62, '#fff2c4')); } Fy.q(b0 + .15, b0 + .5, 0, .2, '#23202e'); Fy.q(b1 - .5, b1 - .15, 0, .2, '#23202e');
      } });
      Fy.text(String(i + 1), m - .1, 3.83 + .02, '#fff8e0'); stripeHaz(Fy, a0 - .25, a0 - .12, 0, .9); stripeHaz(Fy, a1 + .12, a1 + .25, 0, .9);
    }
    // side offices
    door(Fx, d - 1, { c: acc }); lamp(Fx, d - 1, 2.1, { len: .6 });
    for (let y = .7; y + 1.4 < d - 1.9; y += 1.9) { gridWin(Fx, y, y + 1.4, 1, 1.9, { on: r() < .6, cols: 3, rows: 2, sill: true }); gridWin(Fx, y, y + 1.4, 2.4, 3.2, { on: r() < .5, cols: 3, rows: 2, sill: true }); }
    // roof + stepped sign parapet
    parapet(0, 0, H, w, d, .35, .2, wall, '#77747c');
    for (let x = 1.5; x + 2 < w - 1; x += 3.2) { skylight(x, 1.2, H, 2, 1.2, r() < .7); skylight(x, 3.4, H, 2, 1.2, r() < .5); }
    vent(w - 1, 1.2, H); ac(w - 2.4, d - 3.4, H);
    const nm = p.name || 'MAPLE BAY TRANSIT', sw = nm.length * 4 / 16 + .6, sx = (w - sw) / 2;
    box(sx - .4, d - .22, H, sw + .8, .22, .75, wall); box(sx, d - .24, H + .75, sw, .24, .55, wall); const S = face('y', d + .005);
    S.sign(nm, sx + .1, sx + sw - .1, H + .3, H + .95, acc, '#fff8e0', { lit: true }); snowTop(sx, sx + sw, d - .24, d, H + 1.3, .05);
    disc('y', [sx - .05 + sw + .1, d + .01, H + .4], .0, wall);
    // yard: fuel pump + bus stop pole
    box(w - .9, d + .15, 0, .5, .4, 1.2, '#d8452f'); qy(w - .82, w - .48, d + .56, .7, 1.05, '#e8e2d4'); lw([w - .4, d + .55, 1], [w - .25, d + .55, .4], '#2e2a3a');
    lw([.25, d + .4, 0], [.25, d + .4, 2.4], '#6c7a83'); const q = face('y', d + .41); q.q(.02, .5, 1.9, 2.4, '#2f6f9f'); q.text('BUS', .05, 2.3, '#fff8e0');
  },
};

const diner = {
  id: 'bld.ind.diner', kind: 'building', tags: ['industrial', 'diner', 'restaurant', 'food', 'roadside'],
  size: [8, 5, 3.2], vb: [-.5, -.5, 0, 8.8, 6.4, 6.4],
  door: { side: 'y', at: 4 }, light: { x: 4, y: 6.4, z: 0, r: 5 },
  variants: [{ seed: 1, acc: '#d8354a', neon: '#ff5a8a' }, { seed: 4, acc: '#2f9a9a', neon: '#5ae8e0' }, { seed: 7, acc: '#3a5fbf', neon: '#ffd060' }],
  draw(p) {
    const w = 8, d = 5, H = 2.7, r = rng(p.seed || 1), acc = p.acc || '#d8354a', neon = p.neon || '#ff5a8a', chrome = '#cdd6de', name = p.name || "DOT'S DINER", R = .7;
    const steel = c => (u, v) => v % 4 === 0 ? lt(c, .35) : v % 4 === 2 ? dk(c, .1) : c, Fy = face('y', d), Fx = face('x', w);
    // body with a rounded front corner
    const body = (z, h, c, pat) => { box(0, 0, z, w - R, d, h, c, { l: pat(Lc(c)), r: pat(Rc(c)), ol: false }); box(0, 0, z, w, d - R, h, c, { l: pat(Lc(c)), r: pat(Rc(c)), ol: false }); cyl(w - R, d - R, z, R, h, c, { ol: false }); };
    const flat = c => () => c;
    body(0, .35, '#4a4458', c => () => c); body(.35, .6, acc, c => () => c); body(.95, .1, '#f4f0e8', c => () => c); body(1.05, 1.1, chrome, steel); body(2.15, .12, acc, c => () => c); body(2.27, .43, chrome, steel);
    // checker strip
    Fy.q(0, w - R, .42, .88, (u, v) => ((u >> 2) + (v >> 2)) & 1 ? Lc('#f4f0e8') : Lc('#2e2a3a')); Fx.q(0, d - R, .42, .88, (u, v) => ((u >> 2) + (v >> 2)) & 1 ? Rc('#f4f0e8') : Rc('#2e2a3a'));
    // ribbon windows
    const wins = (F, L, skip) => { for (let a = .35; a + 1 <= L - .1; a += 1.12) { if (skip && a + 1 > skip[0] && a < skip[1]) continue; F.w(a, a + 1, 1.15, 2.05, { on: true, frame: '#7c8690', glowc: ['#ffe2a0', '#ffd080'] }); const q = F.p(a + .5, 1.2, .01); spx(q[0], q[1], q[2], -3, -1, acc); spx(q[0], q[1], q[2], 2, -1, acc); glow(() => { spx(q[0], q[1], q[2], -3, -1, dk(acc, .2)); spx(q[0], q[1], q[2], 2, -1, dk(acc, .2)); }); } };
    wins(Fy, w - R, [3.2, 4.8]); wins(Fx, d - R);
    // roof
    body(H, .22, '#f4f0e8', c => () => c); { const t = '#e4e0d6'; qz(.25, w - R, .25, d - .25, H + .22, t); qz(.25, w - .25, .25, d - R, H + .22, t); if (winter()) { qz(.25, w - R, .25, d - .25, H + .22, SNOW); qz(.25, w - .25, .25, d - R, H + .22, SNOW); } }
    lw([0, d, 0], [0, d, H + .22], '#4a4458'); lw([w, 0, 0], [w, 0, H + .22], '#4a4458'); lw([0, 0, H + .22], [w, 0, H + .22], '#4a4458'); lw([0, 0, H + .22], [0, d, H + .22], '#4a4458');
    lit(() => { lw([0, d + .01, H + .1], [w - R, d + .01, H + .1], neon); lw([w + .01, 0, H + .1], [w + .01, d - R, H + .1], neon); circ('z', [w - R, d - R, H + .1], R + .02, neon, 10, 0, Math.PI / 2); });
    ac(1, 1, H + .22, 1, .8); cyl(2.8, 1.4, H + .22, .22, .5, '#9aa0a6'); vent(5.6, 1.2, H + .22);
    // entrance vestibule
    const v0 = 3.3, v1 = 4.7; box(v0, d, 0, v1 - v0, .6, 2.45, chrome, { l: steel(Lc(chrome)), r: steel(Rc(chrome)) }); const V = face('y', d + .6);
    V.q(v0, v1, 0, .12, '#4a4458'); door(V, 4, { c: acc, frame: '#f4f0e8', z: .12 }); box(v0 - .15, d, 2.45, v1 - v0 + .3, .85, .12, acc); lit(() => lw([v0 - .15, d + .86, 2.47], [v1 + .15, d + .86, 2.47], neon));
    box(v0 + .1, d + .6, 0, v1 - v0 - .2, .3, .12, '#b8b4aa', { ol: false });
    // roof sign
    const sw = name.length * 4 / 16 + .7, sx = .9; lw([sx + .4, d - 1.25, H + .2], [sx + .4, d - 1.25, H + .7], '#4a4458'); lw([sx + sw - .4, d - 1.25, H + .2], [sx + sw - .4, d - 1.25, H + .7], '#4a4458');
    box(sx, d - 1.4, H + .6, sw, .25, 1.15, acc); const S = face('y', d - 1.14);
    S.q(sx + .1, sx + sw - .1, H + .72, H + 1.63, '#2a2038'); lit(() => { S.text(name, sx + .37, H + 1.33, '#fff2c4'); S.l(sx + .3, H + .86, sx + sw - .3, H + .86, neon); for (let a = sx + .14; a < sx + sw - .1; a += .25) { const q = S.p(a, H + 1.69, .01); spx(q[0], q[1], q[2], 0, 0, '#ffd060'); const q2 = S.p(a, H + .68, .01); spx(q2[0], q2[1], q2[2], 0, 0, '#ffd060'); } });
    // "EAT" pylon
    const ex = w - .9, ey = d - 2.2; lw([ex, ey, H + .2], [ex, ey, H + 2.3], '#6c7a83'); box(ex - .08, ey - .5, H + 1.2, .16, 1, 1.1, '#f4f0e8'); const E = face('x', ex + .09);
    lit(() => { E.q(ey - .42, ey + .42, H + 1.3, H + 2.2, '#2a2038'); const q = E.p(ey + .1, H + 2.1, .01); 'EAT'.split('').forEach((ch, i) => textS(ch, Math.round(PW(q[0], q[1], q[2])[0]) - 1, Math.round(PW(q[0], q[1], q[2])[1]) + 2 + i * 6 - 3, neon)); });
    lit(() => { const s = PW(ex, ey, H + 2.5); for (const [a, b] of [[0, -3], [0, -2], [-1, -1], [0, -1], [1, -1], [-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0], [-1, 1], [0, 1], [1, 1], [-2, 2], [2, 2]]) px(s[0] + a, s[1] + b - 2, C('#ffd060')); });
    // planters + newspaper box
    for (const x of [.4, 6.1]) { box(x, d + .12, 0, 1, .35, .35, '#8a5a48'); const fo = foliage('leaf', x); if (fo) { ball(x + .25, d + .3, .5, .2, fo); ball(x + .7, d + .3, .52, .22, lt(fo, .1)); } else snowTop(x, x + 1, d + .12, d + .47, .35, .05); }
    box(5.2, d + .12, 0, .4, .35, .8, '#2f6f9f');
  },
};

const gas = {
  id: 'bld.ind.gasstation', kind: 'building', tags: ['industrial', 'gasstation', 'shop', 'roadside'],
  size: [10, 8, 4.3], vb: [-.5, -.5, 0, 10.6, 8.6, 6.2],
  light: { x: 5, y: 5.6, z: 0, r: 6 },
  variants: [{ seed: 1, acc: '#d8452f', name: 'MAPLE GAS' }, { seed: 2, acc: '#2f8a5a', acc2: '#f2c230', name: 'BAY FUEL' }, { seed: 3, acc: '#2f5a9f', acc2: '#ff7a1a', name: 'COAST GAS' }],
  draw(p) {
    const r = rng(p.seed || 1), acc = p.acc || '#d8452f', acc2 = p.acc2 || '#f4f0e8', wall = '#f1ece0', name = p.name || 'MAPLE GAS';
    // kiosk
    const kw = 5.5, kd = 3, kH = 2.8, Ky = face('y', kd), Kx = face('x', kw);
    walls(0, 0, 0, kw, kd, kH, wall, c => panels(c, 16, 64)); Ky.q(0, kw, 0, .3, Lc('#8c8a90')); Kx.q(0, kd, 0, .3, Rc('#8c8a90'));
    Ky.q(0, kw, 2.15, 2.6, Lc(acc)); Kx.q(0, kd, 2.15, 2.6, Rc(acc)); lit(() => Ky.text('MART', 2.6, 2.55, '#fff8e0'));
    door(Ky, 1.1, { c: '#39424e' }); gridWin(Ky, 1.9, 5.1, .5, 1.9, { on: true, cols: 4, rows: 1, frame: '#39424e' }); gridWin(Kx, .5, 2.5, .5, 1.9, { on: true, cols: 3, rows: 1, frame: '#39424e' });
    for (let a = 2.1; a < 5; a += .8) { Ky.q(a, a + .5, .55, .9 + (r() * .4), Lc(['#d8452f', '#f2c230', '#3f8a55', '#3f7fbf'][Math.floor(r() * 4)])); }
    box(-.1, -.1, kH, kw + .2, kd + .2, .15, '#d8d4c8'); snowTop(0, kw, 0, kd, kH + .15); ac(.8, .8, kH + .15); box(3.4, 3.05, 0, 1, .5, 1.1, '#e4eef4'); face('y', 3.56).text('ICE', 3.55, .85, '#2f6f9f');
    // propane cage + air pump
    box(kw + .2, .4, 0, .9, .5, 1.2, '#c8ccd0'); chainlink(face('y', .92), kw + .2, kw + 1.1, .1, 1.2, '#7c8690'); cyl(kw + .5, .65, .1, .15, .5, '#f4f0e8', { ol: false }); cyl(kw + .85, .65, .1, .15, .5, '#f4f0e8', { ol: false });
    // ground glow under canopy
    const cx0 = 2, cx1 = 9.2, cy0 = 4.3, cy1 = 7.5, cz = 3.8;
    cyl(.6, 3.6, 0, .22, .7, '#3f8a55');
    glow(() => qz(cx0 + .6, cx1 - .6, cy0 + .5, cy1 - .3, .02, '#ffe9a8', 'glass'));
    // island + pumps
    box(2.4, 5.3, 0, 5.6, .8, .15, '#c8c4b8'); stripeHaz(face('y', 6.1), 2.4, 8, 0, .15);
    for (const x of [3.3, 6.5]) {
      box(x, 5.45, .15, .7, .5, 1.5, '#f4f0e8'); const P = face('y', 5.96); P.q(x, x + .7, 1.3, 1.65, Lc(acc)); P.q(x + .1, x + .6, .85, 1.2, '#1f2430'); lit(() => { P.l(x + .15, 1.1, x + .5, 1.1, '#7af0a0'); P.l(x + .15, .95, x + .4, .95, '#ffb347'); });
      rope([x + .7, 5.7, 1.2], [x + .85, 5.9, .5], .25, '#2e2a3a', 4); box(x + .78, 5.85, .35, .1, .1, .3, '#2e2a3a', { ol: false });
    }
    box(5.1, 5.5, .15, .35, .35, .7, '#3f8a55', { ol: false }); cyl(2.75, 5.7, .15, .13, .6, '#3f7fbf', { ol: false });
    // columns + canopy
    for (const x of [2.6, 7.5]) { box(x, 5.5, .15, .35, .4, cz - .15, '#e4e0d6'); qy(x, x + .35, 5.9, .15, .8, Lc(acc)); }
    box(cx0, cy0, cz, cx1 - cx0, cy1 - cy0, .5, '#f4f0e8', { l: () => Lc('#f4f0e8') }); const Cy = face('y', cy1), Cx = face('x', cx1);
    Cy.q(cx0, cx1, cz + .12, cz + .38, Lc(acc)); Cx.q(cy0, cy1, cz + .12, cz + .38, Rc(acc)); Cy.q(cx0, cx1, cz + .04, cz + .1, Lc(acc2)); Cx.q(cy0, cy1, cz + .04, cz + .1, Rc(acc2));
    lit(() => { Cy.text(name, (cx0 + cx1) / 2 - (name.length * 4 - 1) / 32, cz + .41, '#fff8e0'); Cy.l(cx0, cz, cx1, cz, '#fff2c4'); Cx.l(cy0, cz, cy1, cz, '#ffe9a8'); });
    qz(cx0 + .3, cx1 - .3, cy0 + .3, cy1 - .3, cz + .5, '#e4e0d6'); lw([cx0 + .3, cy0 + .3, cz + .5], [cx1 - .3, cy0 + .3, cz + .5], '#c8c4b8'); lw([cx0 + .3, cy0 + .3, cz + .5], [cx0 + .3, cy1 - .3, cz + .5], '#c8c4b8');
    snowTop(cx0, cx1, cy0, cy1, cz + .5);
    // price pylon
    const px0 = 9.3, py0 = 6.6; box(px0, py0, 0, .3, 1, 5.6, '#e4e0d6'); const S = face('y', py0 + 1.005);
    // (pylon faces +x for a readable board)
    const X = face('x', px0 + .305); lit(() => { X.q(py0 + .06, py0 + .94, 4.5, 5.5, acc); X.text('GAS', py0 + .87, 5.2, '#fff8e0'); X.q(py0 + .06, py0 + .94, 3.7, 4.4, '#1f2430'); X.text('149', py0 + .87, 4.25, '#7af0a0'); X.q(py0 + .06, py0 + .94, 2.9, 3.6, '#1f2430'); X.text('162', py0 + .87, 3.45, '#ffb347'); });
    snowTop(px0, px0 + .3, py0, py0 + 1, 5.6, .04);
  },
};

export default [pier7, zip, factory, silos, tanks, substation, brewery, busdepot, diner, gas];
