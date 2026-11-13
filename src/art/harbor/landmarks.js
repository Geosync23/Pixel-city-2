// Big harbour props: gantry crane, pier ferris wheel, container stacks.
import { U, PW, C, px, box, qy, qx, qz, lw, fq, glow, lit, cyl, cone, ball, spx, PAT, rng, dk, lt, mix } from '../../engine/raster.js';
import { Lc, Rc, face, gridWin, door, lamp, rope, ring, disc, circ, band, container, CONT, LOGOS, snowTop, stripeHaz, winter, SNOW, rail, bulbs } from './_lib.js';

const crane = {
  id: 'prop.harbor.crane', kind: 'prop', tags: ['harbor', 'industrial', 'landmark', 'crane'], solid: true,
  size: [6, 5, 15], vb: [-3.2, -.5, 0, 14.6, 5.6, 16],
  variants: [{ seed: 1, c: '#e0a030', load: true }, { seed: 2, c: '#2f6f9f', load: false }, { seed: 3, c: '#c9482f', load: true }, { seed: 4, c: '#5a8a6a', load: true }],
  draw(p) {
    const r = rng(p.seed || 1), c = p.c || '#e0a030', d2 = dk(c, .2), W = 6, D = 5, LH = 9, st = '#4a4458';
    const leg = (x, y) => { box(x - .1, y - .1, 0, .8, .8, .5, '#39424e'); box(x, y, .5, .6, .6, LH - .5, c); stripeHaz(face('y', y + .6), x, x + .6, .5, 1.3); };
    const brace = (y) => { lw([.6, y, 1.4], [W - .6, y, 5], d2); lw([.6, y, 5], [W - .6, y, 1.4], d2); lw([.6, y, 5], [W - .6, y, LH - .3], d2); lw([.6, y, LH - .3], [W - .6, y, 5], d2); };
    // back frame (y = 0)
    leg(0, 0); leg(W - .6, 0); box(0, .1, 5, W, .4, .4, c, { ol: false }); brace(.3);
    // sill + portal beams along y
    box(.1, 0, 1.2, .4, D, .35, c, { ol: false }); box(W - .5, 0, 1.2, .4, D, .35, c, { ol: false });
    // front frame (y = D-.6)
    leg(0, D - .6); leg(W - .6, D - .6); box(0, D - .5, 5, W, .4, .4, c, { ol: false }); brace(D - .3);
    // top platform
    box(-.2, -.1, LH, W + .4, D + .2, .5, c);
    // machinery house
    box(.2, .8, LH + .5, 3, 3.2, 1.7, '#e8e2d4', { l: PAT.planks(Lc('#e8e2d4'), 4), r: PAT.planks(Rc('#e8e2d4'), 4) }); gridWin(face('y', 4), .6, 2.8, LH + 1.2, LH + 1.8, { on: r() < .7, cols: 4, rows: 1 }); box(.1, .7, LH + 2.2, 3.2, 3.4, .12, d2); snowTop(.1, 3.3, .7, 4.1, LH + 2.32);
    face('y', 4.01).text('P7', .7, LH + 1.05, dk(c, .3));
    // boom (along x, over the water at +x)
    const by = D / 2 - .35, bz = LH + .5, b0 = -3, b1 = 14;
    box(b0, by, bz, b1 - b0, .7, .55, c, { l: (u, v) => ((u >> 4) & 1) ? Lc('#f4f0e8') : Lc('#d8452f') }); if (winter()) qz(b0, b1, by, by + .7, bz + .55, SNOW, 'glass');
    box(b0, by - .25, bz - .3, 1.6, 1.2, 1.1, '#5a5560'); // counterweight
    // A-frame + stays
    const ax = 3.6, at = LH + 6; lw([ax - 1.2, by + .35, bz + .55], [ax, by + .35, at], c); lw([ax + 1.2, by + .35, bz + .55], [ax, by + .35, at], c); lw([ax - 1.1, by + .35, bz + .55], [ax + .1, by + .35, at], d2); lw([ax + 1.3, by + .35, bz + .55], [ax + .1, by + .35, at], d2);
    lw([ax - .55, by + .35, bz + 2.8], [ax + .65, by + .35, bz + 2.8], d2);
    lw([ax, by + .35, at], [b1 - .3, by + .35, bz + .55], st); lw([ax, by + .35, at], [9, by + .35, bz + .55], st); lw([ax, by + .35, at], [b0 + .4, by + .35, bz + .55], st);
    lit(() => { spx(ax, by + .35, at, 0, -1, '#ff5040'); spx(b1, by + .35, bz + .55, 0, -1, '#ff5040'); spx(b0, by + .35, bz + .8, 0, -1, '#ff5040'); });
    // floodlights under the boom
    for (const x of [6.5, 11.5]) { box(x, by + .7, bz - .12, .3, .15, .12, '#39424e', { ol: false }); glow(() => { qy(x, x + .3, by + .86, bz - .12, bz - .02, '#fff2c4'); fq([[x, by + .86, bz - .15], [x + .3, by + .86, bz - .15], [x + 1, by + .86, bz - 2.6], [x - .7, by + .86, bz - 2.6]], '#ffe39a', 'glass'); }); }
    // operator cab + trolley + spreader
    const tx = 8.2 + (r() * 3 | 0); box(tx - 1.6, by - .1, bz - 1.25, 1.1, .9, 1.2, '#f4f0e8'); gridWin(face('y', by + .8), tx - 1.5, tx - .6, bz - 1.05, bz - .35, { on: true, cols: 2, rows: 1 }); gridWin(face('x', tx - .5), by, by + .7, bz - 1.05, bz - .35, { on: true, cols: 1, rows: 1 });
    box(tx - .2, by - .1, bz - .3, 1.6, .9, .3, '#39424e');
    const hz = p.load === false ? bz - 3 : 3.2 + (r() * 3 | 0) * .6;
    for (const [dx, dy] of [[.1, .05], [1.3, .05], [.1, .65], [1.3, .65]]) lw([tx - .2 + dx, by + dy, bz - .3], [tx - 1 + dx * 2.4 + .6, by - .3 + dy * 1.6, hz + 1.42], st);
    box(tx - .95, by - .3, hz + 1.3, 3.1, 1.3, .14, '#f2c230');
    if (p.load !== false) { const ci = Math.floor(r() * CONT.length); container(tx - .9, by - .25, hz, 3, CONT[ci], { logo: LOGOS[ci], snow: false }); }
    // access stair on the front-right leg
    for (let z = .8; z < LH; z += .4) lw([W, D - .6, z], [W + .25, D - .6, z], st); lw([W + .25, D - .6, .5], [W + .25, D - .6, LH], st);
  },
};

const wheel = {
  id: 'prop.harbor.ferriswheel', kind: 'prop', tags: ['harbor', 'landmark', 'ferriswheel', 'pier', 'fun'], solid: true,
  size: [11, 3, 12.4], vb: [-.6, -.5, 0, 11.6, 3.9, 13.2],
  light: { x: 5.5, y: 4, z: 0, r: 7 },
  variants: [{ seed: 1, c: '#f4f0e8', rot: 0 }, { seed: 2, c: '#d8452f', rot: .13, pal: ['#fff2c4', '#ffd060'] }, { seed: 3, c: '#2f6f9f', rot: .26, pal: ['#ff5a8a', '#5ae8e0', '#ffd060'] }],
  draw(p) {
    const c = p.c || '#f4f0e8', rot = p.rot || 0, R = 5, cx = 5.5, cz = 6.7, N = 12, y0 = 1.05, y1 = 1.95, pal = p.pal || ['#ff5a6a', '#ffd060', '#5ae8a0', '#5ac8ff', '#c88aff'], st = dk(c, .35);
    const gc = ['#d8452f', '#f2c230', '#3f9fbf', '#7fbf6a', '#e88ab0', '#f08a3a'];
    // platform
    box(0, 0, 0, 11, 3, .4, '#b98a52', { t: PAT.fboards('#b98a52', .3), l: PAT.planks(Lc('#8a6a4a'), 4), r: PAT.planks(Rc('#8a6a4a'), 4) }); if (winter()) qz(.2, 10.8, .2, 1, .4, SNOW, 'glass');
    const pt = (y, a, rr) => [cx + Math.cos(a) * rr, y, cz + Math.sin(a) * rr];
    const frame = (y) => { for (const s of [-1, 1]) { lw([cx, y, cz], [cx + s * 2.9, y, .4], st); lw([cx + s * .12, y, cz], [cx + s * 3.02, y, .4], c); lw([cx + s * .2, y, cz], [cx + s * 3.1, y, .4], c); } lw([cx - 1.55, y, 3.4], [cx + 1.55, y, 3.4], c); };
    const rim = (y) => { circ('y', [cx, y, cz], R, c, 48); circ('y', [cx, y, cz], R - .12, st, 48); circ('y', [cx, y, cz], R * .55, c, 36); for (let i = 0; i < N; i++) { const a = rot + i / N * Math.PI * 2; lw([cx, y, cz], pt(y, a, R), c); } };
    frame(y0 - .25); rim(y0);
    // gondolas (hang from the rim between the two wheels)
    const order = [...Array(N).keys()].sort((a, b) => Math.sin(rot + a / N * Math.PI * 2) - Math.sin(rot + b / N * Math.PI * 2));
    for (let i = 0; i < N; i++) { const a = rot + i / N * Math.PI * 2, q = pt(y0, a, R); lw(q, [q[0], y1, q[2]], st); }
    for (const i of order) {
      const a = rot + i / N * Math.PI * 2, q = pt(y0, a, R), g = gc[i % gc.length], gx = q[0] - .4, gz = q[2] - 1.05;
      lw([q[0], (y0 + y1) / 2, q[2]], [q[0], (y0 + y1) / 2, gz + .75], st);
      box(gx, y0 + .1, gz, .8, y1 - y0 - .2, .42, g); qy(gx + .08, gx + .72, y1 - .1, gz + .42, gz + .68, '#9fcbe0', 'glass'); glow(() => qy(gx + .08, gx + .72, y1 - .1, gz + .42, gz + .68, '#ffd98a', 'glass'));
      box(gx - .05, y0 + .05, gz + .7, .9, y1 - y0 - .1, .08, winter() ? SNOW : lt(g, .3), { ol: false }); lw([gx, y1 - .1, gz + .42], [gx, y1 - .1, gz + .7], st); lw([gx + .8, y1 - .1, gz + .42], [gx + .8, y1 - .1, gz + .7], st);
    }
    rim(y1);
    // bulbs on the front wheel
    lit(() => { for (let i = 0; i < N; i++) { const a = rot + i / N * Math.PI * 2; for (let k = 1; k <= 5; k++) { const q = pt(y1 + .01, a, R * k / 5); spx(q[0], q[1], q[2], 0, 0, pal[(i + k) % pal.length]); spx(q[0], q[1], q[2], 1, 0, pal[(i + k) % pal.length]); } for (let k = 1; k < 4; k++) { const q = pt(y1 + .01, a + k / 4 / N * Math.PI * 2, R); spx(q[0], q[1], q[2], 0, 0, pal[(i + k) % pal.length]); spx(q[0], q[1], q[2], 0, 1, pal[(i + k) % pal.length]); } } });
    frame(y1 + .25);
    // hub
    disc('y', [cx, y1 + .27, cz], .5, Lc(p.hub || '#f2c84a'), null, 14); circ('y', [cx, y1 + .27, cz], .5, st, 14); lit(() => disc('y', [cx, y1 + .28, cz], .2, '#fff2c4', null, 8));
    // booth, steps, fence, sign
    box(.4, .6, .4, 1.6, 1.4, 1.9, '#d8452f', { l: PAT.vstripes(Lc('#d8452f'), Lc('#f4f0e8'), 4), r: PAT.vstripes(Rc('#d8452f'), Rc('#f4f0e8'), 4) });
    qy(.65, 1.75, 2, 1.3, 1.95, '#3a3040'); glow(() => qy(.65, 1.75, 2, 1.3, 1.95, '#ffd98a')); box(.3, .5, 2.3, 1.8, 1.6, .12, '#f2c84a'); snowTop(.3, 2.1, .5, 2.1, 2.42, .06);
    face('y', 2.001).text('TICKETS', .52, 1.2, '#fff8e0');
    rail([2.4, 3, 0], [4.2, 3, 0], .4, .7, '#e8e2d4', 2); rail([6.8, 3, 0], [11, 3, 0], .4, .7, '#e8e2d4', 4); rail([11, 0, 0], [11, 3, 0], .4, .7, '#e8e2d4', 3);
    for (let i = 0; i < 2; i++) box(4.5, 3 + i * .3, 0, 2, .3, .26 - i * .13, '#a87a4a', { ol: false });
    box(7.2, 2.7, .4, 3.4, .14, .7, '#2a2038'); lit(() => { face('y', 2.85).text(p.name || 'PIER WHEEL', 7.4, .95, '#ffd060'); for (let x = 7.3; x < 10.6; x += .3) { spx(x, 2.85, 1.12, 0, 0, pal[0]); spx(x, 2.85, .42, 0, 0, pal[1 % pal.length]); } });
  },
};

const stackSize = p => [(p.nx || 1) * ((p.len || 3) + .1), (p.ny || 2) * 1.3, (p.maxh || 3) * 1.3];
const containers = {
  id: 'prop.harbor.containers', kind: 'prop', tags: ['harbor', 'industrial', 'container', 'freight'], solid: true,
  size: stackSize, vb: p => { const s = stackSize(p); return [-.3, -.3, 0, s[0] + .3, s[1] + .3, s[2] + .5]; },
  variants: [{ nx: 1, ny: 2, maxh: 3, len: 3, seed: 1 }, { nx: 2, ny: 3, maxh: 4, len: 3, seed: 5 }, { nx: 1, ny: 1, maxh: 1, len: 6, seed: 3, color: '#2f6f9f' }, { nx: 2, ny: 2, maxh: 2, len: 6, seed: 8 }, { nx: 1, ny: 1, maxh: 2, len: 3, seed: 11 }, { nx: 3, ny: 2, maxh: 5, len: 3, seed: 14 }],
  draw(p) {
    const nx = p.nx || 1, ny = p.ny || 2, mh = p.maxh || 3, len = p.len || 3, r = rng(p.seed || 1);
    for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
      const hh = Math.max(1, Math.round(mh * (.45 + r() * .6)));
      for (let k = 0; k < Math.min(mh, hh); k++) { const ci = Math.floor(r() * CONT.length), c = p.color && r() < .7 ? p.color : CONT[ci]; container(i * (len + .1), j * 1.3 + .05, k * 1.3, len, c, { logo: LOGOS[ci], snow: k === Math.min(mh, hh) - 1 }); }
    }
  },
};

export default [crane, wheel, containers];
