// Harbor Day boat parade (decorated boats lying along x, p.dir like vehicles) and the fireworks barge.
import { box, qy, qx, qz, lw, fq, lit, glow, dk, lt, PAT, cyl, ball, C, px, signY } from '../../engine/raster.js';
import { P, lamp, halo, bulbs, pennants, lantern, pole, dot, flag, mini, hull } from './_lib.js';

const B = (id, L, W, H, draw, extra) => Object.assign({ id, kind: 'vehicle', tags: ['event', 'boat', 'harbor'], size: [L, W, H], vb: [-.8, -.5, -.2, L + .8, W + .7, H + .5], variants: [{ dir: 1 }, { dir: -1 }], draw }, extra || {});
const GL = ['#fff2b0', '#9fd8ff', '#ff8a8a', '#9cf2b0'];
const dress = (K, zm, mx) => { const a = [K.X(.1), K.W / 2, K.zt + .5], m = [K.X(mx), K.W / 2, zm], b = [K.X(K.L - .2), K.W / 2, K.zt + .5]; bulbs(a, m, 7, GL, .2, 3); bulbs(m, b, 7, GL, .2, 3); pennants([a[0], a[1], a[2] - .15], [m[0], m[1], m[2] - .15], 6, ['#e0453a', '#f2c230', '#2f6fb5', '#f4f0e8'], .2, 4); };

export default [
  B('boat.harbor.tug', 4.6, 1.8, 3.6, p => {
    const K = hull(p, 4.6, 1.8, '#c9382e', { stripe: '#f4f0e8' }), X = K.X;
    box(K.bx(1.2, 1.7), .35, K.zt, 1.7, 1.1, 1.0, '#f4f0e8', { t: '#2f6fb5' }); glow(() => qy(Math.min(X(1.4), X(2.7)), Math.max(X(1.4), X(2.7)), 1.46, K.zt + .45, K.zt + .85, '#ffd98a')); qy(Math.min(X(1.4), X(2.7)), Math.max(X(1.4), X(2.7)), 1.46, K.zt + .45, K.zt + .85, '#2b3654');
    box(K.bx(1.5, .9), .5, K.zt + 1.0, .9, .8, .6, '#f4f0e8', { t: '#2f6fb5' }); cyl(X(1.3), .9, K.zt + 1.0, .22, 1.0, '#33303f'); cyl(X(1.3), .9, K.zt + 1.75, .24, .2, '#f2c230');
    pole(X(2.2), .9, K.zt + 1.6, 1.1, '#8a8f98', .06, false); dress(K, K.zt + 2.7, 2.2);
    for (let i = 0; i < 4; i++) { const q = P(X(.5 + i * 1.1), 1.82, .35); for (const d of [[0, 0], [1, 0], [2, 0], [0, 1], [2, 1], [0, 2], [1, 2], [2, 2]]) px(q[0] + d[0], q[1] + d[1], C('#33303f')); }
    mini(X(3.6), 1.0, K.zt, '#f2c230'); lamp(X(4.3), .9, K.zt + .3, '#fff6cf', 4);
  }),
  B('boat.harbor.sail', 4.2, 1.5, 5.2, p => {
    const K = hull(p, 4.2, 1.5, '#f4f0e8', { stripe: '#2f6fb5', deck: '#d8b47a', bow: 1.4 }), X = K.X;
    box(K.bx(1.3, 1.2), .35, K.zt, 1.2, .8, .35, '#f4f0e8', { t: '#b8925a' });
    pole(X(2.3), .75, K.zt, 4.2, '#b8925a', .08); lw([X(2.3), .75, K.zt + .9], [X(.3), .75, K.zt + .9], '#b8925a');
    fq([[X(2.2), .75, K.zt + 4.0], [X(2.2), .75, K.zt + 1.0], [X(.4), .75, K.zt + 1.0]], '#fbf8f0', '#f0e8d8'); fq([[X(2.4), .75, K.zt + 3.8], [X(2.4), .75, K.zt + .6], [X(3.9), .75, K.zt + .5]], '#fbe3ea');
    bulbs([X(.2), .75, K.zt + .5], [X(2.3), .75, K.zt + 4.2], 9, GL, .1, 3); bulbs([X(2.3), .75, K.zt + 4.2], [X(4.1), .75, K.zt + .4], 9, GL, .1, 3);
    mini(X(.9), 1.0, K.zt, '#2f6fb5'); mini(X(1.2), .6, K.zt, '#e0453a', '#a66a44'); flag(X(2.3), .75, K.zt + 4.2, .5, ['#e0453a', '#f4f0e8'], 5, 3);
  }),
  B('boat.harbor.trawler', 5, 1.9, 4.2, p => {
    const K = hull(p, 5, 1.9, '#2f8f6a', { stripe: '#f2c230' }), X = K.X;
    box(K.bx(3.0, 1.2), .4, K.zt, 1.2, 1.1, 1.3, '#f6f0dc', { t: '#c0302a' }); glow(() => qy(Math.min(X(3.1), X(4.1)), Math.max(X(3.1), X(4.1)), 1.51, K.zt + .7, K.zt + 1.1, '#ffd98a')); qy(Math.min(X(3.1), X(4.1)), Math.max(X(3.1), X(4.1)), 1.51, K.zt + .7, K.zt + 1.1, '#2b3654');
    pole(X(2.6), .95, K.zt, 3.1, '#8a6a45', .08); lw([X(2.6), .95, K.zt + 2.6], [X(.4), .95, K.zt + 1.4], '#8a6a45');
    for (let i = 0; i < 3; i++) box(K.bx(.5 + i * .7, .55), .5, K.zt, .55, .7, .3, ['#8ab0c8', '#c9a268', '#8ab0c8'][i]);
    for (let i = 0; i < 5; i++) lantern(X(.5 + i * .5), 1.6, K.zt + 1.5 + i * .22, i % 2 ? '#f2c230' : '#e0453a', 2);
    bulbs([X(2.6), .95, K.zt + 3.1], [X(4.8), .95, K.zt + .5], 7, GL, .2, 3); mini(X(1.9), 1.2, K.zt, '#f2c230', '#84502f'); flag(X(2.6), .95, K.zt + 3.1, .5, ['#2f6fb5', '#f4f0e8', '#e0453a'], 6, 4);
  }),
  B('boat.harbor.queen', 7, 2.4, 4.6, p => {
    const K = hull(p, 7, 2.4, '#f4f0e8', { stripe: '#e0453a', deck: '#c9a268', bow: 1.3, zt: .8 }), X = K.X;
    box(K.bx(.9, 4.4), .3, K.zt, 4.4, 1.8, .9, '#f4f0e8', { t: '#d8b47a' });
    for (let i = 0; i < 7; i++) { const u = 1.1 + i * .6, a = Math.min(X(u), X(u + .4)); glow(() => qy(a, a + .4, 2.11, K.zt + .3, K.zt + .7, '#ffd98a')); qy(a, a + .4, 2.11, K.zt + .3, K.zt + .7, '#2b3654'); }
    box(K.bx(1.4, 3.2), .5, K.zt + .9, 3.2, 1.4, .8, '#f4f0e8', { t: '#e0453a' }); for (let i = 0; i < 5; i++) { const u = 1.6 + i * .6, a = Math.min(X(u), X(u + .4)); glow(() => qy(a, a + .4, 1.91, K.zt + 1.15, K.zt + 1.5, '#ffd98a')); qy(a, a + .4, 1.91, K.zt + 1.15, K.zt + 1.5, '#2b3654'); }
    for (const u of [2.2, 3.2]) { cyl(X(u), 1.2, K.zt + 1.7, .2, 1.2, '#33303f'); cyl(X(u), 1.2, K.zt + 2.7, .22, .2, '#e0453a'); }
    const t = 'MAPLE QUEEN', a = Math.min(X(1.5), X(4.6)); signY(t, a, a + 3.1, 2.42, .3, .66, '#f4f0e8', '#1f3f6f', { frame: false });
    /* paddle wheel at the stern */
    const q = P(X(.35), 2.42, .7); for (let i = 0; i < 8; i++) { const an = i * Math.PI / 4; for (let r = 2; r < 11; r++) px(q[0] + Math.round(Math.cos(an) * r), q[1] + Math.round(Math.sin(an) * r), C('#c0302a')); } for (let i = 0; i < 40; i++) { const an = i * Math.PI / 20; px(q[0] + Math.round(Math.cos(an) * 11), q[1] + Math.round(Math.sin(an) * 11), C('#7a1a1a')); }
    bulbs([X(.3), 2.3, K.zt + .95], [X(5.4), 2.3, K.zt + .95], 14, GL, 0, 3, null); bulbs([X(1.4), 1.9, K.zt + 1.75], [X(4.6), 1.9, K.zt + 1.75], 9, GL, 0, 3, null);
    pole(X(5.6), 1.2, K.zt, 1.6, '#8a8f98', .06, false); flag(X(5.6), 1.2, K.zt + 1.6, .6, ['#e0453a', '#f4f0e8', '#2f6fb5'], 7, 5);
    for (let i = 0; i < 4; i++) mini(X(1.8 + i * .7), 1.7, K.zt + 1.7, ['#f2c230', '#2f6fb5', '#e0453a', '#4fa860'][i], ['#ecba90', '#84502f', '#f8d0aa', '#c4875a'][i]);
  }),
  B('boat.harbor.dinghy', 2.2, 1, 1.8, p => {
    const K = hull(p, 2.2, 1, '#3b82d6', { stripe: '#f4f0e8', bow: .7, zt: .4, deck: '#b8925a' }), X = K.X;
    mini(X(.9), .5, K.zt + .1, '#f4f0e8', '#c4875a'); pole(X(1.5), .5, K.zt, 1.0, '#8a6a45', .05, false); lantern(X(1.5), .55, K.zt + 1.15, '#f2c230', 3);
    lw([X(.7), 1.0, K.zt + .2], [X(.2), 1.3, -.05], '#8a6a45');
  }, { variants: [{ dir: 1 }, { dir: -1 }] }),
  { /* fireworks barge moored off the pier */
    id: 'boat.harbor.barge', kind: 'prop', tags: ['event', 'boat', 'harbor', 'fireworks'], solid: false, size: [5, 2.6, 1.6], vb: [-.4, -.4, -.2, 5.4, 3.2, 2.4], variants: [{}],
    draw() {
      box(0, 0, 0, 5, 2.6, .5, '#3a3f58', { t: '#5a606c', l: PAT.planks('#3a3f58', 8) }); for (let u = 0; u < 5; u += .3) { const q = P(u, 2.6, 0); px(q[0], q[1] + 1, C('#e8f6fb')); }
      for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) { cyl(.8 + i * 1.1, .7 + j * 1.1, .5, .16, .7 + ((i + j) % 2) * .2, '#8a8f98'); dot(.8 + i * 1.1, .7 + j * 1.1, 1.25 + ((i + j) % 2) * .2, '#2a2733', 2, 1, -1); }
      box(.1, .1, .5, .5, .5, .4, '#d8342e'); lamp(.2, 2.5, .7, '#ff5a5a', 4); lamp(4.8, 2.5, .7, '#ff5a5a', 4); lamp(4.8, .1, .7, '#9cf2b0', 4);
    },
  },
];
