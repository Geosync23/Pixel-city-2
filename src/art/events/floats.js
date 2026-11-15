// Parade floats for the big city events. Each lies along x; p.dir = 1 drives toward +x (the engine flips for y streets).
// Float coords: u = 0 rear .. L front (see floatBed in _lib.js).
import { box, qy, qx, qz, lw, fq, lit, glow, dk, lt, mix, rng, PAT, cyl, ball, cone, hip, gable, signY, textY, textW, U, C, px, ellipse } from '../../engine/raster.js';
import { P, lamp, halo, bulbs, pennants, lantern, balloon, flower, sprinkle, pole, cord, dot, flag, floatBed } from './_lib.js';

const F = (id, L, W, H, tags, draw, extra) => Object.assign({ id, kind: 'vehicle', tags: ['event', 'float', ...tags], size: [L, W, H], vb: [-.6, -.5, 0, L + .6, W + .6, H + .5], variants: [{ dir: 1 }, { dir: -1 }], draw }, extra || {});
const PINK = ['#f2a7c3', '#f7c1d4', '#fbe3ea'];

export default [
  /* ---------------- Blossom Parade ---------------- */
  F('float.blossom.tree', 5, 2, 4.6, ['blossom'], p => {
    const K = floatBed(p, 5, 2, { skirt: '#f2a7c3', trim: '#fff2b0', deck: '#9ad0a0' }), R = rng(5), cx = K.X(2.4);
    sprinkle(R, .2, 4.8, .2, 1.8, K.zt, PINK, 40);
    box(K.bx(.5, .8), .6, K.zt, .8, .8, .3, '#c9a268'); ball(K.X(.9), 1, K.zt + .55, .4, '#f7c1d4');
    box(cx - .18, .82, K.zt, .36, .36, 1.5, '#6b4a2f'); lw([cx, 1, 2.2], [cx - .9, 1, 3], '#6b4a2f'); lw([cx, 1, 2.2], [cx + .9, 1, 3.1], '#6b4a2f');
    for (const [dx, dy, dz, r, c] of [[-1.0, -.3, 3.0, .7, 1], [.9, -.2, 3.1, .75, 0], [0, -.4, 3.6, .8, 2], [-.5, .4, 2.9, .7, 0], [.5, .5, 3.0, .65, 1], [0, .2, 3.9, .6, 2], [-1.2, .3, 2.5, .45, 2], [1.3, .3, 2.6, .45, 1]]) ball(cx + dx, 1 + dy, dz, r, PINK[c]);
    for (let i = 0; i < 9; i++) lantern(cx - 1.3 + i * .32, 1.75, 2.1 - Math.abs(i - 4) * .05, i % 2 ? '#fff2b0' : '#ffd0e0', 2);
    for (let i = 0; i < 14; i++) dot(R() * 5, 2 + R() * .3, .9 + R() * 2.5, PINK[i % 3], 1, 1);
    box(K.bx(4, .7), .65, K.zt, .7, .7, .5, '#f6f0dc', { ol: false }); ball(K.X(4.35), 1, K.zt + .75, .35, '#f2a7c3');
  }),
  F('float.blossom.swan', 4.6, 2, 4, ['blossom'], p => {
    const K = floatBed(p, 4.6, 2, { skirt: '#9fd8e8', skirt2: '#e8f6fb', trim: '#f4f0e8', deck: '#7fc4dc' }), W = '#fbf8f0', s = K.f ? -1 : 1, X = K.X;
    for (let u = .3; u < 4.4; u += .5) { const q = P(u, 1.9, K.zt); px(q[0], q[1], C('#e8f6fb')); px(q[0] + 1, q[1], C('#e8f6fb')); }
    ball(X(1.0), 1, K.zt + 1.2, .5, W); ball(X(.6), 1, K.zt + 1.6, .3, W);                                   /* tail */
    ball(X(2.0), 1, K.zt + .85, .95, W, { squash: .75 }); ball(X(2.8), 1, K.zt + .8, .75, W, { squash: .8 });  /* body */
    fq([[X(1.2), 1.75, K.zt + 1.7], [X(2.9), 1.75, K.zt + 1.1], [X(2.7), 1.75, K.zt + .5], [X(1.3), 1.75, K.zt + .7]], '#f4f0e8', '#e8e2d4'); lw([X(1.2), 1.75, K.zt + 1.7], [X(2.9), 1.75, K.zt + 1.1], '#c8c2b4');   /* wing */
    for (let i = 0; i < 9; i++) { const k = i / 8, u = 3.2 + Math.sin(k * 2.6) * .5, z = K.zt + .9 + k * 1.9; ball(X(u), 1, z, .24 - k * .05, W, { ol: i === 0 || i === 8 }); }   /* neck */
    ball(X(3.6), 1, K.zt + 2.75, .3, W); fq([[X(3.8), 1, K.zt + 2.75], [X(4.25), 1, K.zt + 2.55], [X(3.85), 1, K.zt + 2.55]], '#f09a3a'); dot(X(3.7), 1.2, K.zt + 2.85, '#2b2238', 2, 2);
    lantern(X(.4), 1.7, K.zt + .5, '#ffd0e0', 2); lantern(X(4.2), 1.7, K.zt + .5, '#ffd0e0', 2);
    for (let i = 0; i < 5; i++) flower(X(1.4 + i * .4) + s * .0, 1.9, K.zt + .1, PINK[i % 3]);
  }),
  F('float.blossom.teahouse', 5, 2, 4, ['blossom'], p => {
    const K = floatBed(p, 5, 2, { skirt: '#e0608f', skirt2: '#fbe3ea', trim: '#f2c230', deck: '#c9a268' }), x0 = 1, w = 3;
    box(x0, .15, K.zt, w, 1.7, .2, '#8a5a3a', { t: PAT.fboards('#b8925a', .3) });
    qy(x0 + .1, x0 + w - .1, .2, K.zt + .2, K.zt + 1.9, '#f6f0dc'); for (let i = 0; i < 5; i++) lw([x0 + .1 + i * .7, .2, K.zt + .2], [x0 + .1 + i * .7, .2, K.zt + 1.9], '#8a5a3a'); lw([x0 + .1, .2, K.zt + 1.1], [x0 + w - .1, .2, K.zt + 1.1], '#8a5a3a');
    box(x0 + 1.1, .8, K.zt + .2, .8, .5, .3, '#5a3a2a'); cyl(x0 + 1.5, 1.05, K.zt + .5, .12, .16, '#7a9a8a', { ol: false });       /* tea table */
    for (const [x, y] of [[x0 + .1, .25], [x0 + w - .1, .25], [x0 + .1, 1.75], [x0 + w - .1, 1.75]]) pole(x, y, K.zt + .2, 1.8, '#c0302a', .14);
    hip(x0 - .1, .05, K.zt + 2, w + .2, 1.9, .9, '#c0302a', { over: .35 }); ball(x0 + w / 2, 1, K.zt + 3, .14, '#f2c230');
    for (const x of [x0 - .3, x0 + w + .3]) lantern(x, 2.2, K.zt + 1.6, '#f2c230', 3);
    for (const u of [.4, 4.6]) { cyl(K.X(u), 1, K.zt, .22, .3, '#c0623a'); ball(K.X(u), 1, K.zt + .75, .42, PINK[u < 1 ? 0 : 1]); }
  }),
  F('float.blossom.throne', 4.6, 2, 4.2, ['blossom'], p => {
    const K = floatBed(p, 4.6, 2, { skirt: '#fbe3ea', skirt2: '#f2a7c3', trim: '#e0608f', deck: '#f7c1d4' }), R = rng(11), X = K.X;
    box(K.bx(.5, 3.2), .2, K.zt, 3.2, 1.6, .4, '#f7c1d4', { l: PAT.vstripes('#f7c1d4', '#fbe3ea', 4) }); box(K.bx(.9, 2.2), .4, K.zt + .4, 2.2, 1.2, .4, '#fbe3ea');
    box(K.bx(1.2, .5), .55, K.zt + .8, .5, .9, 1.5, '#e0608f', { l: '#e0608f' }); box(K.bx(1.7, .6), .55, K.zt + .8, .6, .9, .35, '#f2c230');   /* throne: rider stands in front of it */
    /* flower arch over the throne */
    for (let i = 0; i <= 12; i++) { const a = Math.PI * i / 12, u = 1.9 + Math.cos(a) * 1.25, z = K.zt + .8 + Math.sin(a) * 2.3; ball(X(u), 1.75, z, .2, PINK[i % 3], { ol: false }); flower(X(u), 1.9, z, i % 2 ? '#fff2b0' : '#e0608f'); }
    sprinkle(R, .3, 4.3, .2, 1.8, K.zt + .02, PINK, 24);
    for (const u of [3.9, 4.3]) { cyl(X(u), .5, K.zt, .14, .5, '#f4f0e8'); ball(X(u), .5, K.zt + .8, .3, PINK[0]); cyl(X(u), 1.5, K.zt, .14, .5, '#f4f0e8'); ball(X(u), 1.5, K.zt + .8, .3, PINK[2]); }
  }, { riders: [{ u: 2.1, y: 1, z: 1.6, anim: 'wave' }] }),

  /* ---------------- River Fair ---------------- */
  F('float.fair.duck', 4.6, 2.2, 4.2, ['fair'], p => {
    const K = floatBed(p, 4.6, 2.2, { skirt: '#3b82d6', skirt2: '#9fd8ff', trim: '#f4f0e8', deck: '#5aa0e0', bulbs: ['#fff2b0', '#9fd8ff'] }), Y = '#f7d23a', X = K.X;
    for (let u = .3; u < 4.4; u += .45) { const q = P(u, 2.1, K.zt); px(q[0], q[1], C('#e8f6fb')); px(q[0] + 1, q[1] - 1, C('#e8f6fb')); px(q[0] + 2, q[1], C('#e8f6fb')); }
    ball(X(.8), 1.1, K.zt + 1.35, .45, Y); ball(X(2.0), 1.1, K.zt + 1.0, 1.15, Y, { squash: .78 });                 /* tail, body */
    fq([[X(1.3), 2.0, K.zt + 1.5], [X(2.6), 2.0, K.zt + 1.3], [X(2.3), 2.0, K.zt + .7], [X(1.4), 2.0, K.zt + .9]], '#e8b82a'); /* wing */
    ball(X(3.2), 1.1, K.zt + 2.3, .8, Y); fq([[X(3.8), 1.1, K.zt + 2.3], [X(4.5), 1.1, K.zt + 2.1], [X(3.8), 1.1, K.zt + 1.9]], '#f07a2a'); fq([[X(3.8), 1.5, K.zt + 2.2], [X(4.4), 1.3, K.zt + 2.08], [X(3.8), 1.5, K.zt + 1.95]], '#f09a3a');
    const q = P(X(3.45), 1.75, K.zt + 2.6); ellipse(q[0], q[1], 2, 2, '#2b2238'); px(q[0] - 1, q[1] - 1, C('#ffffff'));
    for (let i = 0; i < 4; i++) balloon(X(.3 + i * .12), .3 + i * .4, K.zt + 2.3 + (i % 2) * .5, ['#e0453a', '#4fa860', '#8a5cd0', '#f09a3a'][i], 3);
  }),
  F('float.fair.rainbow', 5, 2, 4.4, ['fair'], p => {
    const K = floatBed(p, 5, 2, { skirt: '#8a5cd0', skirt2: '#fff2b0', trim: '#f2c230', deck: '#f4f0e8', bulbs: ['#ff8a8a', '#ffe08a', '#9cf2b0', '#9fd8ff', '#d0a8ff'] }), X = K.X;
    const RB = ['#e0453a', '#f09a3a', '#f2c230', '#4fa860', '#3b82d6', '#8a5cd0'];
    for (const u of [.5, 4.1]) { box(K.bx(u, .5), .3, K.zt, .5, .6, 1.0, '#33303f'); const q = P(X(u + .25), .9, K.zt + .6); ellipse(q[0], q[1], 3, 3, '#5a606c'); ellipse(q[0], q[1], 1, 1, '#2a2733'); }   /* speakers */
    RB.forEach((c, k) => { const r = 2.0 - k * .2; for (let i = 0; i <= 20; i++) { const a = Math.PI * i / 20, a2 = Math.PI * (i + 1) / 20; fq([[2.5 + Math.cos(a) * r, 1.2, K.zt + Math.sin(a) * r * 1.5], [2.5 + Math.cos(a2) * r, 1.2, K.zt + Math.sin(a2) * r * 1.5], [2.5 + Math.cos(a2) * (r - .2), 1.2, K.zt + Math.sin(a2) * (r - .2) * 1.5], [2.5 + Math.cos(a) * (r - .2), 1.2, K.zt + Math.sin(a) * (r - .2) * 1.5]], c); } });
    for (const x of [.55, 4.45]) { ball(x, 1.3, K.zt + .25, .42, '#f4f8fb'); ball(x + (x < 2 ? .35 : -.35), 1.45, K.zt + .2, .32, '#e8f0f6'); }                                                             /* clouds */
    lw([2.5, 1.3, K.zt + 2.2], [2.5, 1.3, K.zt + 1.9], '#8a8f98'); ball(2.5, 1.3, K.zt + 1.6, .32, '#c9ced6'); lit(() => { const q = P(2.5, 1.3, K.zt + 1.6); for (const d of [[-2, -1], [1, -2], [2, 1], [-1, 2], [0, 0]]) px(q[0] + d[0], q[1] + d[1], C('#ffffff')); }); halo(2.5, 1.3, K.zt + 1.6, 6, '#d0a8ff');
    for (let i = 0; i < 6; i++) flag(K.X(.2 + i * .9), 1.9, K.zt, 1.1, [RB[i], RB[(i + 1) % 6], RB[(i + 2) % 6]], 5, 4);
  }, { riders: [{ u: 1.6, y: 1.5, z: .8, anim: 'dance' }, { u: 3.3, y: 1.5, z: .8, anim: 'dance' }] }),

  /* ---------------- Harvest Festival ---------------- */
  F('float.harvest.tractor', 3.4, 1.8, 2.7, ['harvest', 'tractor'], p => {
    const f = (p.dir || 1) < 0, L = 3.4, X = u => f ? L - u : u, bx = (u, w) => f ? L - u - w : u, red = '#c9382e';
    qz(.1, L - .1, .2, 1.95, 0, '#2a1f4540');
    const wheel = (u, r, y) => { const q = P(X(u), y, r); ellipse(q[0], q[1], r * 16 * .9, r * 16, '#25212d'); ellipse(q[0], q[1], r * 9, r * 10, '#e8b63a'); ellipse(q[0], q[1], 2, 2, '#8a5a2a'); };
    wheel(.8, .78, .1); wheel(2.75, .42, .1);
    box(bx(.3, 1.2), .25, .8, 1.2, 1.3, .35, red); box(bx(1.4, 1.8), .4, .65, 1.8, 1.0, .75, red, { t: lt(red, .15) });   /* seat deck, bonnet */
    qy(Math.min(X(3.0), X(3.2)), Math.max(X(3.0), X(3.2)), 1.4, .75, 1.3, '#33303f'); lamp(X(3.2), 1.25, 1.1, '#fff6cf', 4, 2, 2);
    pole(X(2.5), .9, 1.4, .9, '#5a606c', .1); dot(X(2.5), .9, 2.35, '#8a8f98', 2, 1);                                    /* exhaust */
    for (const [u, y] of [[.35, .3], [1.35, .3], [.35, 1.5], [1.35, 1.5]]) pole(X(u), y, 1.15, 1.2, '#4a4458', .07, false);
    box(bx(.25, 1.25), .22, 2.35, 1.25, 1.36, .1, '#e8b63a');                                                              /* canopy */
    box(bx(.5, .5), .65, 1.15, .5, .5, .25, '#33303f', { ol: false }); pole(X(1.3), .9, 1.15, .5, '#33303f', .05, false); dot(X(1.3), .9, 1.7, '#33303f', 3, 2);
    wheel(.8, .78, 1.8); wheel(2.75, .42, 1.8);
  }, { riders: [{ u: .8, y: .9, z: 1.2, anim: 'sit', seated: true, outfit: 'farmer' }] }),
  F('float.harvest.wagon', 4.6, 2, 2.4, ['harvest', 'wagon'], p => {
    const f = (p.dir || 1) < 0, L = 4.6, X = u => f ? L - u : u, bx = (u, w) => f ? L - u - w : u, wood = '#a8743e', hay = '#e8c85a';
    qz(.1, L - .1, .2, 2.15, 0, '#2a1f4540');
    const wheel = (u, y) => { const q = P(X(u), y, .45); ellipse(q[0], q[1], 6, 7, '#5a3a22'); ellipse(q[0], q[1], 4, 5, '#c9a268'); ellipse(q[0], q[1], 1, 1, '#5a3a22'); };
    wheel(.8, .05); wheel(3.8, .05);
    box(0, .1, .55, L, 1.8, .25, wood, { l: PAT.planks(wood, 5), r: dk(wood, .3), t: PAT.fboards('#c9a268', .3) });
    qy(.05, L - .05, .14, .8, 1.5, dk(wood, .25)); for (let u = .1; u < L; u += .5) lw([u, .14, .8], [u, .14, 1.5], dk(wood, .5));
    for (let i = 0; i < 4; i++) { const u = .35 + i * 1.02; box(bx(u, .9), .25, .8, .9, .7, .5, hay, { l: PAT.stripes(hay, dk(hay, .15), 3), t: lt(hay, .15) }); }
    for (let i = 0; i < 4; i++) { const u = .35 + i * 1.02; box(bx(u, .9), 1.2, .8, .9, .6, .3, hay, { l: PAT.stripes(hay, dk(hay, .15), 3), t: lt(hay, .15) }); }
    for (const u of [.1, 2.3, 4.5]) { lw([X(u), 1.9, .8], [X(u), 1.9, 1.5], dk(wood, .4)); } lw([.05, 1.9, 1.5], [L - .05, 1.9, 1.5], wood); lw([.05, 1.9, 1.15], [L - .05, 1.9, 1.15], wood);
    ball(X(4.3), 1.6, .95, .2, '#e8802a', { squash: .7 }); ball(X(.25), 1.65, .95, .16, '#e8b63a', { squash: .7 });
    pennants([.1, 1.92, 2.1], [L - .1, 1.92, 2.1], 8, ['#d9562b', '#e8b63a', '#8a5a2a'], .25, 4); pole(.1, 1.9, 1.5, .65, wood, .06, false); pole(L - .1, 1.9, 1.5, .65, wood, .06, false);
    wheel(.8, 2.0); wheel(3.8, 2.0);
    const tx = f ? -.5 : L; box(tx, .94, .5, .5, .12, .08, '#5a3a22', { ol: false });
  }, { riders: [{ u: 1.2, y: 1.2, z: 1.1, anim: 'sit', seated: true, dir: 1 }, { u: 3.2, y: 1.2, z: 1.1, anim: 'sit', seated: true, dir: 1 }], seat: { u: 2.2, y: 1.2, z: 1.1 } }),
  F('float.harvest.pumpkin', 4.6, 2, 3.6, ['harvest'], p => {
    const K = floatBed(p, 4.6, 2, { skirt: '#b8432a', skirt2: '#e8b63a', trim: '#f6e6b8', deck: '#e8c85a', bulbs: ['#ffd98a', '#ffb060'] }), X = K.X, O = '#e8802a';
    for (let i = 0; i < 7; i++) { const a = (i - 3) * .32; ball(2.3 + Math.sin(a) * 1.25, 1 + (i % 2) * .02, K.zt + 1.15, 1.0 - Math.abs(i - 3) * .08, i % 2 ? O : dk(O, .1), { squash: 1.05, ol: i === 0 || i === 6 }); }
    box(2.2, .9, K.zt + 2.2, .22, .22, .5, '#5a7a3a'); fq([[2.3, 1, K.zt + 2.5], [3.2, 1.3, K.zt + 2.3], [2.9, 1.3, K.zt + 2.0]], '#6f9a48');
    glow(() => { fq([[1.7, 2.02, K.zt + 1.5], [2.0, 2.02, K.zt + 1.5], [1.85, 2.02, K.zt + 1.8]], '#ffd98a'); fq([[2.5, 2.02, K.zt + 1.5], [2.8, 2.02, K.zt + 1.5], [2.65, 2.02, K.zt + 1.8]], '#ffd98a'); qy(1.7, 2.8, 2.02, K.zt + .8, K.zt + 1.05, '#ffd98a'); });
    fq([[1.7, 2.02, K.zt + 1.5], [2.0, 2.02, K.zt + 1.5], [1.85, 2.02, K.zt + 1.8]], '#5a2a14'); fq([[2.5, 2.02, K.zt + 1.5], [2.8, 2.02, K.zt + 1.5], [2.65, 2.02, K.zt + 1.8]], '#5a2a14'); for (let i = 0; i < 6; i++) dot(1.72 + i * .18, 2.02, K.zt + 1.0 - (i % 2) * .1, '#5a2a14', 3, 3);
    for (const u of [.4, 4.2]) { for (let k = 0; k < 5; k++) lw([X(u) + (k - 2) * .06, 1.2, K.zt], [X(u) + (k - 2) * .16, 1.2, K.zt + 1.6 + (k % 2) * .2], '#c9a23a'); dot(X(u), 1.2, K.zt + .8, '#8a5a2a', 3, 1, -1); }
    ball(X(.6), 1.7, K.zt + .16, .2, '#e8b63a', { squash: .7 }); ball(X(4.0), 1.75, K.zt + .14, .18, O, { squash: .7 });
  }),
  F('float.harvest.basket', 4.6, 2, 3.2, ['harvest'], p => {
    const K = floatBed(p, 4.6, 2, { skirt: '#6f7a48', skirt2: '#e8b63a', trim: '#d9562b', deck: '#c9a268', bulbs: ['#ffd98a', '#ffb060'] }), X = K.X, R = rng(3);
    cyl(2.3, 1, K.zt, 1.1, 1.0, '#b8925a', { l: '#c9a268', r: '#8a6a45' }); for (let k = 0; k < 4; k++) { const q = P(2.3, 1, K.zt + .2 + k * .22); for (let u = -24; u <= 24; u += 3) px(q[0] + u, q[1] + 8 - Math.abs(u) / 4, C('#7a5a35')); }
    for (let i = 0; i < 12; i++) { const a = i * 2.4, r = .25 + (i % 4) * .2; ball(2.3 + Math.cos(a) * r, 1 + Math.sin(a) * r * .6, K.zt + 1.15 + (i % 3) * .22, .3, ['#d8342c', '#e8b63a', '#8ab04a', '#d9562b'][i % 4]); }
    /* handle arch + ribbon */
    for (let i = 0; i <= 14; i++) { const a = Math.PI * i / 14; ball(2.3 + Math.cos(a) * 1.05, 1.02, K.zt + 1.0 + Math.sin(a) * 1.3, .09, '#8a6a45', { ol: false }); } dot(2.3, 1.02, K.zt + 2.4, '#d9562b', 5, 3, -2);
    for (const u of [.45, 4.15]) { for (let k = 0; k < 5; k++) lw([X(u) + (k - 2) * .06, .9, K.zt], [X(u) + (k - 2) * .18, .9, K.zt + 1.5 + (k % 2) * .2], '#c9a23a'); box(K.bx(u - .3, .6), 1.3, K.zt, .6, .45, .32, '#e8c85a', { l: PAT.stripes('#e8c85a', '#c9a23a', 3) }); }
    sprinkle(R, .3, 4.3, 1.5, 1.9, K.zt + .02, ['#d9562b', '#e8b63a', '#b8432a'], 14);
  }),

  /* ---------------- Lantern Night ---------------- */
  F('float.lantern.drum', 3.2, 1.8, 3.4, ['lantern'], p => {
    const K = floatBed(p, 3.2, 1.8, { skirt: '#c0302a', skirt2: '#7a1a1a', trim: '#f2c230', deck: '#5a3a2a', bulbs: ['#ff9a5a', '#ffd98a'], zt: .6 }), X = K.X;
    for (const u of [.8, 2.4]) { fq([[X(u) - .1, .9, K.zt], [X(u) + .1, .9, K.zt], [X(u) + .1, .9, K.zt + 1.1], [X(u) - .1, .9, K.zt + 1.1]], '#5a3a2a'); }
    /* big drum on its side: skin faces +y */
    const q = P(1.6, 1.5, K.zt + 1.45); ellipse(q[0] + 4, q[1] - 6, 21, 23, '#7a2a24'); ellipse(q[0], q[1], 21, 23, '#3a2a24'); ellipse(q[0], q[1], 19, 21, '#f6ecd0'); ellipse(q[0] - 3, q[1] - 4, 9, 10, '#fff8e0');
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; px(q[0] + Math.round(Math.cos(a) * 20), q[1] + Math.round(Math.sin(a) * 22), C('#f2c230')); }
    lit(() => { for (const d of [[0, -3], [-3, 0], [3, 0], [0, 3], [0, 0], [-2, -2], [2, 2], [2, -2], [-2, 2]]) px(q[0] + d[0], q[1] + d[1], C('#c0302a')); });
    for (const u of [.25, 2.95]) { pole(X(u), 1.6, K.zt, 2.3, '#7a2a24', .08, false); lantern(X(u), 1.72, K.zt + 2.1, '#e0453a', 4); lantern(X(u), 1.72, K.zt + 1.2, '#f2c230', 3); }
  }, { riders: [{ u: 1.6, y: 1.72, z: .6, anim: 'work', dir: 3 }] }),

  /* ---------------- Winter Lights Parade ---------------- */
  F('float.winter.sleigh', 5.6, 2, 3.6, ['winter'], p => {
    const K = floatBed(p, 5.6, 2, { skirt: '#f4f8fb', skirt2: '#cfe4f0', trim: '#9fd8ff', deck: '#f4f8fb', bulbs: ['#fff2b0', '#9fd8ff'] }), X = K.X, red = '#d8342e';
    /* sleigh at the rear */
    box(K.bx(.3, 2.0), .35, K.zt + .25, 2.0, 1.3, .7, red, { t: dk(red, .2) }); box(K.bx(.3, .3), .35, K.zt + .95, .3, 1.3, .9, red); lw([X(.3), 1.65, K.zt + 1.85], [X(.3), .35, K.zt + 1.85], '#f2c230');
    lw([X(.2), 1.7, K.zt + .12], [X(2.6), 1.7, K.zt + .12], '#f2c230'); lw([X(2.6), 1.7, K.zt + .12], [X(2.9), 1.7, K.zt + .5], '#f2c230');
    ball(X(.95), .8, K.zt + 1.25, .45, '#8a5a3a'); ball(X(1.0), 1.3, K.zt + 1.2, .35, '#2f8f6a'); box(K.bx(1.3, .4), .5, K.zt + .95, .4, .4, .4, '#f2c230'); dot(X(1.5), .7, K.zt + 1.4, red, 2, 2);
    bulbs([X(.3), 1.68, K.zt + .95], [X(2.3), 1.68, K.zt + .95], 6, ['#fff2b0', '#9cf2b0', '#ff8a8a'], 0, 3, null);
    /* two reindeer made of light */
    for (const u of [3.4, 4.5]) lit(() => { const q = P(X(u), 1.4, K.zt + .1), s = K.f ? -1 : 1, c = C('#fff2b0'), g = C('#ffd98a');
      for (let i = 0; i < 9; i++) px(q[0] + s * (i - 4), q[1] - 12 - (i >> 2), c); for (let j = 0; j < 9; j++) { px(q[0] - s * 4, q[1] - 11 + j + 0, g); px(q[0] + s * 3, q[1] - 12 + j, g); px(q[0] - s * 2, q[1] - 10 + j, g); px(q[0] + s * 5, q[1] - 13 + j, g); }
      for (let j = 0; j < 6; j++) px(q[0] + s * (6 + (j >> 1)), q[1] - 15 - j, c); px(q[0] + s * 10, q[1] - 21, c); px(q[0] + s * 11, q[1] - 20, C('#ff5a5a'));
      for (let j = 0; j < 4; j++) { px(q[0] + s * (8 - j), q[1] - 23 - j, g); px(q[0] + s * (9 + (j >> 1)), q[1] - 23 - j, g); } });
    for (const u of [3.4, 4.5]) halo(X(u), 1.4, K.zt + .9, 9, '#ffe6a8');
    for (let i = 0; i < 5; i++) { const u = 3 + i * .55; ball(X(u), .5, K.zt + .1, .22, '#f4f8fb', { ol: false, squash: .6 }); }
  }, { riders: [{ u: 1.9, y: 1, z: 1.3, anim: 'wave', outfit: 'santa' }] }),
  F('float.winter.globe', 4.2, 2, 3.8, ['winter'], p => {
    const K = floatBed(p, 4.2, 2, { skirt: '#2f6fb5', skirt2: '#9fd8ff', trim: '#f4f8fb', deck: '#e8f0f6', bulbs: ['#9fd8ff', '#f4f8fb'] });
    cyl(2.1, 1, K.zt, 1.05, .45, '#8a5a3a', { l: '#a8743e', r: '#6a4428', t: '#f4f8fb' });
    /* inside the glass: a tiny snowy house and tree */
    box(1.7, .8, K.zt + .45, .7, .5, .45, '#c0623a', { ol: false }); gable(1.7, .8, K.zt + .9, .7, .5, .3, 'x', '#f4f8fb', { over: .05 }); glow(() => qy(1.9, 2.1, 1.31, K.zt + .55, K.zt + .78, '#ffd98a')); qy(1.9, 2.1, 1.31, K.zt + .55, K.zt + .78, '#5a4a52');
    cone(2.7, 1.1, K.zt + .45, .3, .9, '#2f8f6a'); lamp(2.7, 1.1, K.zt + 1.38, '#fff2b0', 3, 1, 1);
    const q = P(2.1, 1, K.zt + 1.35); ellipse(q[0], q[1], 22, 21, '#cfe8f4', 'glass');
    for (let i = 0; i < 26; i++) { const a = i * 2.39, r = (i * 7 % 19); px(q[0] + Math.round(Math.cos(a) * r), q[1] + Math.round(Math.sin(a) * r), C('#ffffff')); }
    for (let i = 0; i < 40; i++) { const a = i * Math.PI / 20; px(q[0] + Math.round(Math.cos(a) * 22), q[1] + Math.round(Math.sin(a) * 21), C('#7fa8c0')); } for (let i = 0; i < 6; i++) px(q[0] - 14 + i, q[1] - 12 - i, C('#ffffff'));
    halo(2.1, 1, K.zt + 1.35, 12, '#bfe4ff');
    for (const u of [.4, 3.8]) { ball(K.X(u), 1.3, K.zt + .3, .32, '#f4f8fb'); ball(K.X(u), 1.3, K.zt + .75, .24, '#f4f8fb'); dot(K.X(u), 1.5, K.zt + .8, '#f07a2a', 2, 1); dot(K.X(u), 1.3, K.zt + 1.05, '#33303f', 4, 2, -2); }   /* snowmen */
  }),
  F('float.winter.gingerbread', 4.6, 2, 3.8, ['winter'], p => {
    const K = floatBed(p, 4.6, 2, { skirt: '#d8342e', skirt2: '#f4f8fb', trim: '#2f8f6a', deck: '#f4f8fb', bulbs: ['#ff8a8a', '#9cf2b0', '#fff2b0'] }), G = '#b87a4a', x0 = 1.1, w = 2.4;
    box(x0, .25, K.zt, w, 1.5, 1.5, G, { l: G, r: dk(G, .2) });
    qy(x0 + .95, x0 + 1.45, 1.76, K.zt, K.zt + .9, '#7a4a2a'); lw([x0 + .95, 1.76, K.zt + .9], [x0 + 1.45, 1.76, K.zt + .9], '#f4f8fb'); dot(x0 + 1.35, 1.76, K.zt + .45, '#f2c230', 2, 2);
    for (const x of [x0 + .2, x0 + 1.7]) { glow(() => qy(x, x + .5, 1.76, K.zt + .6, K.zt + 1.1, '#ffd98a')); qy(x, x + .5, 1.76, K.zt + .6, K.zt + 1.1, '#5a4a52'); lw([x, 1.76, K.zt + .6], [x + .5, 1.76, K.zt + .6], '#f4f8fb'); lw([x, 1.76, K.zt + 1.1], [x + .5, 1.76, K.zt + 1.1], '#f4f8fb'); lw([x, 1.76, K.zt + .6], [x, 1.76, K.zt + 1.1], '#f4f8fb'); lw([x + .5, 1.76, K.zt + .6], [x + .5, 1.76, K.zt + 1.1], '#f4f8fb'); }
    for (let u = x0 + .1; u < x0 + w; u += .3) { dot(u, 1.76, K.zt + 1.42, ['#d8342e', '#2f8f6a', '#f2c230'][Math.round(u * 10) % 3], 2, 2); }
    gable(x0, .25, K.zt + 1.5, w, 1.5, 1.0, 'x', '#f4f8fb', { over: .2, wall: G }); for (let u = x0; u < x0 + w; u += .22) { const q = P(u, 1.95, K.zt + 1.4); px(q[0], q[1] + 1, C('#f4f8fb')); if ((u * 9 | 0) % 2) px(q[0], q[1] + 2, C('#f4f8fb')); }
    box(x0 + 1.7, .5, K.zt + 2.0, .3, .3, .7, '#c0623a', { t: '#f4f8fb' });
    for (const u of [.45, 4.15]) { pole(K.X(u), 1.4, K.zt, 1.3, '#f4f8fb', .14); for (let k = 0; k < 5; k++) dot(K.X(u), 1.47, K.zt + .15 + k * .25, '#d8342e', 3, 2, -1); ball(K.X(u), 1.4, K.zt + 1.45, .22, '#d8342e'); }
    for (const u of [.5, 4.1]) ball(K.X(u), .6, K.zt + .3, .3, ['#9cf2b0', '#ff8ab0'][u < 1 ? 0 : 1]);
  }),
  F('float.winter.train', 5.6, 1.8, 3.2, ['winter'], p => {
    const f = (p.dir || 1) < 0, L = 5.6, X = u => f ? L - u : u, bx = (u, w) => f ? L - u - w : u, G = '#2f8f6a', R = '#d8342e';
    qz(.1, L - .1, .2, 1.95, 0, '#2a1f4540');
    const wheel = (u, r) => { const q = P(X(u), 1.8, r); ellipse(q[0], q[1], r * 14, r * 16, '#33303f'); ellipse(q[0], q[1], r * 9, r * 10, R); ellipse(q[0], q[1], 1, 1, '#f2c230'); };
    /* tender / carriage at the rear with presents */
    box(bx(.1, 1.9), .15, .4, 1.9, 1.5, .9, R, { l: PAT.vstripes(R, dk(R, .12), 6) }); for (let i = 0; i < 4; i++) box(bx(.3 + i * .42, .34), .5 + (i % 2) * .3, 1.3, .34, .34, .3 + (i % 3) * .12, ['#f2c230', '#9fd8ff', '#f4f8fb', '#9cf2b0'][i]);
    /* locomotive */
    box(bx(2.3, 1.1), .15, .4, 1.1, 1.5, 1.7, G); glow(() => qy(Math.min(X(2.5), X(3.2)), Math.max(X(2.5), X(3.2)), 1.66, 1.3, 1.9, '#ffd98a')); qy(Math.min(X(2.5), X(3.2)), Math.max(X(2.5), X(3.2)), 1.66, 1.3, 1.9, '#5a4a52'); box(bx(2.2, 1.3), .05, 2.1, 1.3, 1.7, .12, R);
    box(bx(3.4, 1.8), .3, .4, 1.8, 1.2, .5, '#33303f'); for (let k = 0; k < 4; k++) cyl(X(3.75 + k * .4), .9, .9, .5, .05, G, { ol: false }); box(bx(3.4, 1.8), .4, .9, 1.8, 1.0, .9, G, { t: lt(G, .15) });
    cyl(X(4.7), .9, 1.8, .2, .7, '#33303f'); cyl(X(4.7), .9, 2.5, .28, .12, R); for (let k = 0; k < 3; k++) ball(X(4.7) + (f ? .25 : -.25) * k, .9, 2.95 + k * .28, .2 + k * .06, '#f4f8fb', { ol: false });
    cyl(X(3.9), .9, 1.8, .14, .25, '#f2c230'); lamp(X(5.3), .9, 1.35, '#fff6cf', 5, 3, 3); fq([[X(5.2), .3, .4], [X(5.6), .9, .25], [X(5.2), 1.5, .4]], R);
    bulbs([X(.1), 1.67, 1.3], [X(2.0), 1.67, 1.3], 6, ['#fff2b0', '#9cf2b0', '#ff8a8a'], .1, 3, null); bulbs([X(3.4), 1.42, 1.8], [X(5.2), 1.42, 1.8], 6, ['#fff2b0', '#9fd8ff'], 0, 3, null);
    for (const u of [.5, 1.5]) wheel(u, .32); wheel(2.85, .45); for (const u of [3.8, 4.5, 5.1]) wheel(u, .32);
  }),
];
