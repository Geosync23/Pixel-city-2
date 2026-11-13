// Boats and the moored cargo ship. All float: z=0 is the waterline, bow points to +x (flip gives +y).
import { U, PW, C, px, box, qy, qx, qz, lw, fq, glow, lit, cyl, cone, ball, spx, PAT, rng, dk, lt, mix } from '../../engine/raster.js';
import { Lc, Rc, face, gridWin, rope, crate, gull, ring, disc, circ, band, hull, container, CONT, LOGOS, snowTop, winter, SNOW, fishCrate } from './_lib.js';

const navLights = (L, W, z) => lit(() => { spx(L * .66, W, z, 0, -1, '#ff4040'); spx(L * .66, 0, z, 0, -1, '#40e070'); });

const fishing = {
  id: 'prop.harbor.boat.fishing', kind: 'prop', tags: ['harbor', 'boat', 'water', 'fishing'], solid: true,
  size: [6, 2.2, 2.6], vb: [-.4, -.4, 0, 6.5, 2.7, 5.4],
  variants: [{ seed: 1, c: '#2f6f9f', trim: '#f4f0e8' }, { seed: 2, c: '#b5372c', trim: '#f1e7cf' }, { seed: 3, c: '#3f8a6a', trim: '#f2c230' }, { seed: 4, c: '#f4f0e8', trim: '#2f4a6a' }],
  draw(p) {
    const L = 6, W = 2.2, fb = .75, r = rng(p.seed || 1), c = p.c || '#2f6f9f', trim = p.trim || '#f4f0e8';
    hull(L, W, fb, c, { sheer: .45, stripe: trim, deck: '#b98a52' });
    face('y', W + .0).text('MB' + (10 + (p.seed || 1) * 7 % 90), .5, fb - .12, lt(c, .7));
    // stern gear: net pile, pots
    ball(.9, .8, fb + .2, .5, '#3f8a7a', { squash: .55 }); for (let i = 0; i < 5; i++) spx(.9, .8, fb + .3, -5 + i * 3, (i % 2) * 2 - 3, '#f08a3a');
    crate(.5, 1.45, fb, .5, '#a87a4a', .4); if (r() < .7) fishCrate(1.6, 1.35, fb, '#f4f0e8', p.seed || 1);
    // mast + boom
    const mx = 2.7, my = W / 2; lw([mx, my, fb], [mx, my, 4.6], '#6b4a2f'); lw([mx + .06, my, fb], [mx + .06, my, 4.6], '#8a6a4a'); lw([mx, my, 2.2], [.5, my, 3.2], '#6b4a2f'); lw([mx, my, 4.5], [.5, my, 3.2], '#4a4458'); lw([mx, my, 4.5], [L - .2, my, fb + .5], '#4a4458');
    lw([.9, my, 3.05], [.9, my, 2], '#4a4458'); spx(.9, my, 2, 0, 0, '#39424e'); spx(.9, my, 2, -1, 1, '#39424e');
    // wheelhouse
    const hx = 3.1, hy = .45, hw = 1.5, hd = 1.3, hh = 1.45; box(hx, hy, fb, hw, hd, hh, trim, { l: PAT.siding(Lc(trim), 3), r: PAT.siding(Rc(trim), 3) });
    gridWin(face('y', hy + hd), hx + .15, hx + hw - .15, fb + .7, fb + 1.25, { on: true, cols: 2, rows: 1, frame: dk(c, .3) }); gridWin(face('x', hx + hw), hy + .15, hy + hd - .15, fb + .7, fb + 1.25, { on: true, cols: 2, rows: 1, frame: dk(c, .3) });
    box(hx - .15, hy - .1, fb + hh, hw + .35, hd + .2, .1, c); snowTop(hx - .15, hx + hw + .2, hy - .1, hy + hd + .1, fb + hh + .1, .08);
    box(hx + .5, hy + .5, fb + hh + .1, .5, .12, .1, '#e8e2d4', { ol: false }); lw([hx + .2, hy + .3, fb + hh], [hx + .2, hy + .3, fb + hh + .9], '#4a4458'); lit(() => spx(hx + .2, hy + .3, fb + hh + .9, 0, 0, '#fff2c4'));
    // fenders / buoys on the side
    const bc = ['#f08a3a', '#f4f0e8', '#e8552f']; for (let i = 0; i < 3; i++) { const x = 1.2 + i * 1.5; lw([x, W + .02, fb], [x, W + .02, .45], '#d9c08a'); ball(x, W + .1, .38, .16, bc[(i + (p.seed || 0)) % 3]); }
    navLights(L, W, fb + .1); if (r() < .6) gull(hx + .8, hy + .6, fb + hh + .12, 1);
  },
};

const sail = {
  id: 'prop.harbor.boat.sail', kind: 'prop', tags: ['harbor', 'boat', 'water', 'sailboat'], solid: true,
  size: [5.5, 1.7, 2], vb: [-.4, -.4, 0, 6, 2.2, 8],
  variants: [{ seed: 1, stripe: '#2f6f9f', sail: '#f6f1e2' }, { seed: 2, stripe: '#d8452f', sail: '#f6f1e2', sail2: '#d8452f' }, { seed: 3, c: '#2f4a6a', stripe: '#f2c84a', sail: '#f1e7cf', furled: true }, { seed: 4, stripe: '#3f8a6a', sail: '#fbe3c0', sail2: '#3f8a6a' }],
  draw(p) {
    const L = 5.5, W = 1.7, fb = .55, c = p.c || '#f4f0e8', st = p.stripe || '#2f6f9f', sc = p.sail || '#f6f1e2', s2 = p.sail2 || sc, my = W / 2, mx = 3.2, top = 7.4, furled = p.furled || winter();
    hull(L, W, fb, c, { sheer: .3, stripe: st, deck: '#d9c8a0', boot: '#2f4a6a' });
    // cockpit + cabin
    qz(.4, 1.6, .35, W - .35, fb + .01, '#8a6a4a'); lw([.2, my, fb + .3], [1, my, fb + .45], '#6b4a2f');
    box(1.8, .38, fb, 1.9, W - .76, .38, '#f4f0e8'); for (const x of [2.1, 2.7, 3.3]) { qy(x, x + .32, W - .38, fb + .12, fb + .28, '#3a5a72'); glow(() => qy(x, x + .32, W - .38, fb + .12, fb + .28, '#ffd98a')); }
    snowTop(1.8, 3.7, .38, W - .38, fb + .38, .06);
    // rig
    lw([mx, my, fb + .38], [mx, my, top], '#8a8f98'); lw([mx + .06, my, fb + .38], [mx + .06, my, top], '#c8ccd0');
    lw([mx, my, top], [L - .05, my, fb + .35], '#6c7a83'); lw([mx, my, top], [.1, my, fb + .05], '#6c7a83'); lw([mx, my, 4.4], [mx, W, fb], '#6c7a83');
    const bz = fb + 1.15; lw([mx, my, bz], [.5, my, bz], '#8a8f98');
    if (furled) { box(.6, my - .09, bz, mx - .7, .18, .2, st, { ol: false }); lw([.6, my + .09, bz + .2], [mx - .1, my + .09, bz + .2], lt(st, .4)); }
    else {
      const M = [[mx - .05, my, bz + .1], [mx - .05, my, top - .15], [.6, my, bz + .1]]; fq(M, sc); fq([[mx - .05, my, bz + .1], [mx - .05, my, bz + .9], [1.25, my, bz + .9 - .0], [.6, my, bz + .1]], s2 === sc ? dk(sc, .06) : s2);
      for (let k = 1; k < 5; k++) { const z = bz + .1 + (top - bz - .25) * k / 5, xx = mx - .05 - (mx - .65) * (1 - k / 5); lw([mx - .05, my, z], [xx, my, z], dk(sc, .14)); }
      lw(M[1], M[2], dk(sc, .35)); lw(M[0], M[2], dk(sc, .35));
      const J = [[mx + .12, my, top - .7], [L - .15, my, fb + .45], [mx + .2, my, fb + .9]]; fq(J, lt(sc, .2)); lw(J[0], J[1], dk(sc, .35)); lw(J[1], J[2], dk(sc, .35)); lw(J[0], J[2], dk(sc, .3));
    }
    for (let u = 0; u < 4; u++) for (let v = 0; v < 2; v++) spx(mx, my, top, -u - 1, v + (u > 1 ? 1 : 0), st);
    lit(() => spx(mx, my, top, 0, -1, '#fff2c4')); navLights(L, W, fb + .1);
    ball(1.5, W + .08, .35, .14, '#f4f0e8'); ball(3.6, W + .08, .35, .14, '#f4f0e8');
  },
};

const motor = {
  id: 'prop.harbor.boat.motor', kind: 'prop', tags: ['harbor', 'boat', 'water', 'motorboat'], solid: true,
  size: [3.6, 1.4, 1.1], vb: [-.6, -.4, 0, 4, 1.9, 1.9],
  variants: [{ c: '#f4f0e8', stripe: '#d8452f' }, { c: '#f4f0e8', stripe: '#2f8a9f', deck: '#2f8a9f' }, { c: '#2f3a52', stripe: '#f2c84a' }, { c: '#f2c230', stripe: '#2e2a3a' }],
  draw(p) {
    const L = 3.6, W = 1.4, fb = .5, c = p.c || '#f4f0e8', st = p.stripe || '#d8452f';
    box(-.28, W / 2 - .18, .15, .3, .36, .75, '#2e2a3a'); box(-.3, W / 2 - .2, .9, .36, .4, .22, st);
    hull(L, W, fb, c, { sheer: .2, stripe: st, deck: p.deck || '#e8e2d4', bowAt: .6 });
    qz(.25, 1.9, .22, W - .22, fb + .01, '#6c5a4a'); box(.3, .28, fb - .0, .4, W - .56, .28, '#f4f0e8'); box(1.2, .3, fb, .35, .32, .32, st); box(1.2, W - .62, fb, .35, .32, .32, st);
    // windshield
    const ws = [[1.95, .22, fb], [1.95, W - .22, fb], [1.7, W - .22, fb + .45], [1.7, .22, fb + .45]]; fq(ws, '#9fd0e4', 'glass'); lw(ws[2], ws[3], '#4a4458'); lw(ws[1], ws[2], '#4a4458'); lw(ws[0], ws[3], '#4a4458');
    fq([[1.95, W - .22, fb], [2.3, W - .22, fb], [1.7, W - .22, fb + .45]], '#7fb6d0'); lw([2.3, W - .22, fb], [1.7, W - .22, fb + .45], '#4a4458');
    lw([2.4, W / 2, fb + .12], [L - .2, W / 2, fb + .2], dk(c, .25)); spx(L - .25, W / 2, fb + .25, 0, -1, '#c8ccd0');
    lit(() => { spx(2.3, W, fb + .05, 0, -1, '#ff4040'); spx(.1, W / 2, fb + .3, 0, -1, '#fff2c4'); });
    if (winter()) qz(2.4, 3.1, .4, W - .4, fb + .12, SNOW, 'glass');
  },
};

const tug = {
  id: 'prop.harbor.boat.tug', kind: 'prop', tags: ['harbor', 'boat', 'water', 'tugboat'], solid: true,
  size: [6.5, 2.6, 3.4], vb: [-.4, -.4, 0, 7, 3.2, 6.2],
  variants: [{ seed: 1, c: '#2e3a4a', house: '#f1e7cf', fun: '#f2c230' }, { seed: 2, c: '#7a2f2a', house: '#f4f0e8', fun: '#2e3a4a' }, { seed: 3, c: '#2f5a50', house: '#f1e7cf', fun: '#d8452f' }],
  draw(p) {
    const L = 6.5, W = 2.6, fb = .85, c = p.c || '#2e3a4a', hs = p.house || '#f1e7cf', fun = p.fun || '#f2c230';
    hull(L, W, fb, c, { sheer: .55, stripe: '#f4f0e8', deck: '#8a6a4a', boot: '#a8382f' });
    // towing bitt + rope coil at stern
    box(.7, W / 2 - .3, fb, .2, .6, .45, '#39424e'); ring('z', [1.25, .7, fb + .02], .3, .14, '#d9c08a', 10);
    // funnel (behind the wheelhouse)
    const dkh = 1.1; box(1.7, .5, fb, 3, W - 1, dkh, hs, { l: PAT.siding(Lc(hs), 3) });
    for (const x of [1.95, 2.55, 3.15]) { disc('y', [x + .15, W - .49, fb + .65], .16, '#3a5a72', null, 8); glow(() => disc('y', [x + .15, W - .49, fb + .65], .13, '#ffd98a', null, 8)); circ('y', [x + .15, W - .49, fb + .65], .17, '#c9a23a', 10); }
    qy(3.9, 4.4, W - .5, fb, fb + .9, Lc('#7a4a3a'));
    cyl(2.2, W / 2, fb + dkh, .4, 1.5, fun); band(2.2, W / 2, fb + dkh + 1.05, .4, .3, '#2e2a3a'); band(2.2, W / 2, fb + dkh + .55, .4, .22, '#d8452f');
    // wheelhouse
    const wx = 3, wy = .72, ww = 1.5, wd = W - 1.44, wz = fb + dkh; box(wx, wy, wz, ww, wd, 1.05, hs);
    gridWin(face('y', wy + wd), wx + .1, wx + ww - .1, wz + .4, wz + .9, { on: true, cols: 3, rows: 1, frame: dk(c, .2) }); gridWin(face('x', wx + ww), wy + .1, wy + wd - .1, wz + .4, wz + .9, { on: true, cols: 3, rows: 1, frame: dk(c, .2) });
    box(wx - .12, wy - .12, wz + 1.05, ww + .3, wd + .24, .1, '#a8382f'); snowTop(wx - .12, wx + ww + .18, wy - .12, wy + wd + .12, wz + 1.15, .08);
    lw([wx + .5, W / 2, wz + 1.15], [wx + .5, W / 2, wz + 2.6], '#4a4458'); lw([wx + .2, W / 2, wz + 2.1], [wx + .8, W / 2, wz + 2.1], '#4a4458'); lit(() => { spx(wx + .5, W / 2, wz + 2.6, 0, 0, '#fff2c4'); spx(wx + .5, W / 2, wz + 2.3, 0, 0, '#fff2c4'); });
    box(wx + .9, W / 2 - .3, wz + 1.15, .12, .6, .12, '#e8e2d4', { ol: false });
    // tyre fenders + bow pudding
    for (const x of [.9, 2.1, 3.3, 4.5]) { ring('y', [x, W + .03, .52], .3, .13, '#23202e', 12); circ('y', [x, W + .03, .52], .3, '#4a4458', 12); }
    ball(L - .25, W / 2 + .25, fb + .3, .28, '#3a3038', { squash: .8 });
    navLights(L, W, fb + .15);
  },
};

const row = {
  id: 'prop.harbor.boat.row', kind: 'prop', tags: ['harbor', 'boat', 'water', 'rowboat'], solid: true,
  size: [2.6, 1.1, .5], vb: [-.3, -.5, 0, 3, 1.7, 1],
  variants: [{ c: '#a8744a' }, { c: '#3f8a9f', in: '#e8dcc0' }, { c: '#d8452f', in: '#f1e7cf' }, { c: '#f4f0e8', in: '#8fbf9a' }],
  draw(p) {
    const L = 2.6, W = 1.1, fb = .38, c = p.c || '#a8744a', inn = p.in || lt(c, .25);
    hull(L, W, fb, c, { sheer: .12, deck: lt(c, .3), boot: dk(c, .3), tuck: .1 });
    fq([[.1, .1, fb], [L * .66, .1, fb], [L - .25, W / 2, fb + .08], [L * .66, W - .1, fb], [.1, W - .1, fb]], winter() ? '#e6edf2' : dk(inn, .28));
    fq([[.1, .1, fb], [L * .66, .1, fb], [L * .66, .32, fb], [.1, .32, fb]], dk(inn, .12));
    for (const x of [.5, 1.3]) { qz(x, x + .28, .1, W - .1, fb, inn); lw([x, .1, fb], [x, W - .1, fb], dk(inn, .4)); }
    lw([.3, W + .25, fb + .2], [1.9, .25, fb + .12], '#c9a36a'); lw([.3, -.2, fb + .3], [1.9, W - .3, fb + .12], '#c9a36a'); spx(.3, W + .25, fb + .2, 0, 0, '#e8d8b0'); spx(.3, W + .25, fb + .2, -1, 0, '#e8d8b0');
    spx(1.1, W, fb, 0, -1, '#4a4458'); lw([L - .1, W / 2, fb + .1], [L + .3, W / 2 + .3, 0], '#d9c08a');
  },
};

const ship = {
  id: 'prop.harbor.cargoship', kind: 'prop', tags: ['harbor', 'boat', 'water', 'ship', 'landmark', 'cargo'], solid: true,
  size: p => [p.len || 22, 5, 7.5], vb: p => [-.5, -.5, 0, (p.len || 22) + .6, 5.6, 10.6],
  variants: [{ len: 22, seed: 1, c: '#2f4a6a', name: 'MB AURORA' }, { len: 19, seed: 5, c: '#3a3a44', boot: '#a8382f', name: 'NORTH STAR', fun: '#d8452f' }, { len: 25, seed: 9, c: '#3f6a5a', name: 'TIDEWATER', fun: '#f2c230' }],
  draw(p) {
    const L = p.len || 22, W = 5, fb = 2.2, r = rng(p.seed || 1), c = p.c || '#2f4a6a', fun = p.fun || '#2f6f9f', name = p.name || 'MB AURORA';
    hull(L, W, fb, c, { sheer: .9, bowAt: .84, boot: p.boot || '#a8382f', deck: '#7a6a62', tuck: .3 });
    const Hy = face('y', W - .0); 
    lit(() => { }); { const q = PW(L * .7, W - .15, fb - .35); } face('y', W - .12).text(name, L * .84 - 1 - name.length * 4 / 16, fb - .25, '#f4f0e8');
    lw([.2, W - .2, fb - .5], [L * .8, W - .1, fb - .5], dk(Lc(c), .15));
    for (let x = 1; x < L * .8; x += 2.5) { spx(x, W - .25, .9, 0, 0, dk(c, .5)); }
    // superstructure (aft)
    const sx = 1, sy = .5, sw = 3.4, sd = W - 1, wh = '#f4f0e8';
    box(sx - .2, 1.6, fb, .9, 1.8, 5.2, fun); band; qy(sx - .2, sx + .7, 3.4, fb + 4.2, fb + 4.8, Lc('#f4f0e8')); qx(sx + .7, 1.6, 3.4, fb + 4.2, fb + 4.8, Rc('#f4f0e8')); box(sx - .25, 1.55, fb + 5.2, 1, 1.9, .15, '#2e2a3a');
    for (let k = 0; k < 4; k++) {
      const z = fb + k * 1.05, ins = k === 3 ? -.35 : k * .12, bx = sx + .6 + (k === 3 ? 0 : k * .1), by = sy + ins, bw = sw - .6 - (k === 3 ? .2 : k * .2), bd = sd - ins * 2;
      box(bx, by, z, bw, bd, 1.05, wh, { ol: k === 0 || k === 3 }); const Fy = face('y', by + bd), Fx = face('x', bx + bw);
      if (k === 3) { gridWin(Fy, bx + .1, bx + bw - .1, z + .4, z + .9, { on: true, cols: 5, rows: 1, frame: '#39424e' }); gridWin(Fx, by + .15, by + bd - .15, z + .4, z + .9, { on: true, cols: 9, rows: 1, frame: '#39424e' }); }
      else { for (let x = bx + .2; x + .3 < bx + bw; x += .55) Fy.w(x, x + .3, z + .45, z + .78, { on: r() < .6 }); for (let y = by + .25; y + .3 < by + bd; y += .6) Fx.w(y, y + .3, z + .45, z + .78, { on: r() < .6 }); Fy.l(bx, z + 1.04, bx + bw, z + 1.04, '#c8c4b8'); }
    }
    const tz = fb + 4.2; snowTop(sx + .6, sx + sw - .2, sy - .35, sy + sd + .35, tz, .1);
    lw([sx + 1.6, W / 2, tz], [sx + 1.6, W / 2, tz + 2.2], '#4a4458'); lw([sx + 1.1, W / 2, tz + 1.5], [sx + 2.1, W / 2, tz + 1.5], '#4a4458'); box(sx + 1.2, W / 2 - .05, tz + .9, .8, .1, .1, '#e8e2d4', { ol: false });
    lit(() => { spx(sx + 1.6, W / 2, tz + 2.2, 0, 0, '#fff2c4'); spx(sx + 1.1, W / 2, tz + 1.5, 0, 0, '#ff4040'); spx(sx + 2.1, W / 2, tz + 1.5, 0, 0, '#40e070'); });
    box(sx + 2.2, .2, fb + 1.2, .9, .5, .45, '#e8552f'); // lifeboat
    // containers
    const x0 = sx + sw + .8, nb = Math.floor((L * .84 - x0 - .5) / 3.1);
    for (let i = 0; i < nb; i++) { const hmax = 1 + Math.floor(r() * 3); for (let j = 0; j < 4; j++) { const hh = Math.max(1, hmax - (r() < .3 ? 1 : 0)); for (let k = 0; k < hh; k++) { const ci = Math.floor(r() * CONT.length); container(x0 + i * 3.1, .1 + j * 1.2, fb + k * 1.3, 3, CONT[ci], { logo: j === 3 ? LOGOS[ci] : '', snow: k === hh - 1 }); } } }
    // forecastle gear
    const fx = L * .86; box(fx, W / 2 - .5, fb + .25, .7, 1, .35, '#6c7a83'); lw([fx + 1.2, W / 2, fb + .5], [fx + 1.2, W / 2, fb + 2.6], '#4a4458'); lit(() => spx(fx + 1.2, W / 2, fb + 2.6, 0, 0, '#fff2c4'));
    // anchor + hawse on the bow quarter
    { const s = PW(L * .93, W * .78, fb - .2), X = Math.round(s[0]), Y = Math.round(s[1]), k = C('#23202e'); for (let j = 0; j < 7; j++) px(X, Y + j, k); for (let i = -2; i <= 2; i++) px(X + i, Y + 6 - Math.abs(i) + (Math.abs(i) === 2 ? 0 : 1), k); px(X - 1, Y + 1, k); px(X + 1, Y + 1, k); }
    // mooring lines
    rope([1.2, W, fb - .3], [.2, W + .5, 0.3], .3, '#d9c08a', 4);
    lit(() => { spx(L * .8, W, fb + .2, 0, -1, '#ff4040'); });
  },
};

export default [fishing, sail, motor, tug, row, ship];
