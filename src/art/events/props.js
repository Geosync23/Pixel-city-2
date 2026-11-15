// Set pieces of the six big city events: the Winter Lights tree, the high striker, harvest dressing, the lantern dragon, the "take part" stands.
import { box, qy, qx, qz, lw, fq, lit, glow, dk, lt, rng, PAT, cyl, ball, cone, C, px, signY, textY, textW, U, ellipse, ENV } from '../../engine/raster.js';
import { P, lamp, halo, bulbs, pennants, lantern, balloon, flower, pole, dot, flag } from './_lib.js';

const ORN = ['#d8342e', '#f2c230', '#9fd8ff', '#f4f8fb', '#ff8ab0'];
const hay = '#e8c85a';
function bale(x, y, z, w = 1.2, d = .8, h = .6) { box(x, y, z, w, d, h, hay, { l: PAT.stripes(hay, dk(hay, .16), 3), r: PAT.stripes(dk(hay, .2), dk(hay, .32), 3), t: lt(hay, .15) }); lw([x + w * .3, y + d, z], [x + w * .3, y + d, z + h], '#8a5a2a'); lw([x + w * .7, y + d, z], [x + w * .7, y + d, z + h], '#8a5a2a'); }
function pumpkin(x, y, z, r, c = '#e8802a') { ball(x, y, z + r * .7, r, c, { squash: .72 }); dot(x, y, z + r * 1.45, '#5a7a3a', 1, 2); }
/* one body colour set of the dragon */
const DR = { a: '#d8342e', b: '#f2c230', c: '#2f8f6a' };

export default [
  { /* the giant tree on City Hall Plaza. st: 'dark' (decorated, unlit) | 'lit' */
    id: 'prop.winter.tree', kind: 'prop', tags: ['event', 'winter', 'tree'], solid: false, size: [3, 3, 8.4], vb: [-1.2, -1.2, 0, 4.2, 4.2, 9.6], light: { x: 1.5, y: 2.6, z: 0, r: 7, c: '#ffe6b0' },
    variants: [{ st: 'dark' }, { st: 'lit' }],
    draw(p) {
      const on = p.st === 'lit', R = rng(21), G = ['#2f7a55', '#357f5a', '#2a6f4c'];
      box(.9, .9, 0, 1.2, 1.2, .7, '#c0302a', { l: PAT.vstripes('#c0302a', '#f2c230', 5), r: dk('#c0302a', .25) }); box(1.3, 1.3, .7, .4, .4, .6, '#6b4a2f');
      for (let k = 0; k < 6; k++) { const z = 1.1 + k * 1.05, r = 2.05 - k * .31; cone(1.5, 1.5, z, r, 1.9, G[k % 3]); if (ENV.season === 3) for (let i = 0; i < 10; i++) { const a = i * .63 + k; dot(1.5 + Math.cos(a) * r * .8, 1.5 + Math.abs(Math.sin(a)) * r * .8, z + .12, '#f4f8fb', 2, 1); } }
      for (let i = 0; i < 54; i++) { const k = R() * 6.2, z = 1.3 + k * 1.02, r = (2.05 - k * .31) * (.55 + R() * .4), a = R() * 3.3 - .9, x = 1.5 + Math.cos(a) * r * .7, y = 1.5 + Math.abs(Math.sin(a)) * r * .7 + .3, c = ORN[i % 5];
        if (on) lamp(x, y, z, i % 3 ? '#fff2b0' : c, 3, 2, 2); else dot(x, y, z, c, 2, 2); }
      /* star */
      const q = P(1.5, 1.5, 8.35), st = () => { for (let r = 0; r < 6; r++) { px(q[0], q[1] - r, C('#fff2b0')); px(q[0], q[1] + r, C('#f2c230')); px(q[0] - r, q[1], C('#f2c230')); px(q[0] + r, q[1], C('#fff2b0')); } for (let r = 1; r < 4; r++) { px(q[0] - r, q[1] - r, C('#f2c230')); px(q[0] + r, q[1] - r, C('#f2c230')); px(q[0] - r, q[1] + r, C('#e8a820')); px(q[0] + r, q[1] + r, C('#e8a820')); } };
      if (on) { halo(1.5, 1.5, 8.35, 11, '#fff2b0'); lit(st); } else st();
      for (let i = 0; i < 5; i++) box(.2 + i * .55, 2.4 + (i % 2) * .3, 0, .4, .4, .3 + (i % 3) * .1, ORN[i], { ol: false });   /* presents */
    },
  },
  { /* high striker: hit the pad, ring the bell */
    id: 'prop.fair.striker', kind: 'prop', tags: ['event', 'fair', 'game'], solid: false, size: [1.2, 1.4, 4.8], vb: [-.4, -.4, 0, 1.6, 2.2, 5.4], use: { x: .6, y: 2.2 }, variants: [{}],
    draw() {
      box(.1, .1, 0, 1, .5, .3, '#8a5cd0'); box(.35, .2, .3, .5, .2, 4.0, '#f4f0e8', { l: (u, v) => v > 58 ? '#e0453a' : v > 44 ? '#f09a3a' : v > 30 ? '#f2c230' : v > 16 ? '#4fa860' : '#3b82d6' });
      for (let k = 1; k < 8; k++) lw([.35, .4, .3 + k * .5], [.85, .4, .3 + k * .5], '#33303f'); lw([.6, .4, .4], [.6, .4, 4.2], '#33303f'); dot(.6, .41, 1.2, '#d8342e', 3, 2, -1);
      cyl(.6, .3, 4.35, .28, .22, '#f2c230'); lamp(.6, .3, 4.75, '#ff5a5a', 4, 2, 2); bulbs([.3, .42, .4], [.3, .42, 4.2], 7, ['#fff2b0', '#ff8a8a'], 0, 2, null); bulbs([.9, .42, .4], [.9, .42, 4.2], 7, ['#fff2b0', '#9fd8ff'], 0, 2, null);
      box(.3, .9, 0, .6, .4, .18, '#d8342e', { t: '#33303f' });                                                                  /* pad */
      lw([1.0, 1.3, 0], [1.05, .9, 1.1], '#8a6a45'); box(.9, .8, 1.05, .34, .22, .22, '#5a606c', { ol: false });                   /* mallet */
    },
  },
  { id: 'prop.harvest.bales', kind: 'prop', tags: ['event', 'harvest'], solid: false, size: [2.4, 1.2, 1.4], vb: [-.3, -.3, 0, 2.7, 1.6, 2], variants: [{ seed: 1 }, { seed: 2 }, { seed: 3 }],
    draw(p) { const s = p.seed || 1; bale(0, .2, 0); bale(1.2, .2, 0); if (s !== 2) bale(.6, .25, .6); if (s === 1) { pumpkin(.3, 1.05, 0, .22); pumpkin(2.1, 1.1, 0, .18, '#e8b63a'); } if (s === 3) { for (let k = 0; k < 5; k++) lw([2.3 + (k - 2) * .04, .9, 0], [2.3 + (k - 2) * .14, .9, 1.6 + (k % 2) * .2], '#c9a23a'); pumpkin(1.9, 1.05, 0, .26); } if (s === 2) { pumpkin(.6, .6, .6, .3); pumpkin(1.7, .6, .6, .22, '#e8b63a'); } } },
  { id: 'prop.harvest.scarecrow', kind: 'prop', tags: ['event', 'harvest'], solid: false, size: [.6, .6, 2.6], vb: [-.7, -.5, 0, 1.3, 1.1, 3], variants: [{}],
    draw() { pole(.3, .3, 0, 2.2, '#8a6a45', .08, false); lw([-.4, .3, 1.7], [1.0, .3, 1.7], '#8a6a45'); qy(-.05, .65, .36, 1.0, 1.8, '#3b6fd0'); qy(-.4, -.05, .36, 1.55, 1.8, '#3b6fd0'); qy(.65, 1.0, .36, 1.55, 1.8, '#3b6fd0'); dot(.3, .37, 1.5, '#d9562b', 3, 3, -1); dot(.1, .37, 1.2, '#e8b63a', 3, 3);
      for (const x of [-.45, 1.0]) for (let k = 0; k < 3; k++) dot(x, .36, 1.7 - k * .06, hay, 2, 1); ball(.3, .34, 2.05, .26, '#e8d0a0'); dot(.2, .5, 2.1, '#33303f', 1, 1); dot(.4, .5, 2.1, '#33303f', 1, 1); dot(.26, .5, 1.98, '#b8432a', 3, 1);
      cone(.3, .34, 2.25, .42, .5, '#8a5a2a'); pumpkin(.75, .55, 0, .2); },
  },
  { /* cider press: turn the screw, fill the mugs (the Harvest "take part" stand) */
    id: 'prop.harvest.press', kind: 'prop', tags: ['event', 'harvest', 'game'], solid: false, size: [2.4, 1.4, 2.6], vb: [-.3, -.3, 0, 2.7, 2.2, 3], use: { x: 1.2, y: 2.1 }, variants: [{}],
    draw() { const w = '#8a5a3a';
      box(.2, .2, 0, 2, 1, .35, w, { t: PAT.fboards('#a8743e', .3) }); for (const x of [.3, 2.0]) box(x, .55, .35, .16, .3, 1.9, w); box(.2, .5, 2.2, 2, .4, .2, w);
      cyl(1.2, .7, .35, .5, .8, '#a8743e', { l: '#a8743e', r: dk('#a8743e', .2), t: '#c0302a' }); pole(1.2, .7, 1.15, 1.2, '#8a8f98', .1); lw([.7, .7, 2.5], [1.7, .7, 2.5], '#5a606c');
      for (let i = 0; i < 6; i++) ball(.9 + (i % 3) * .3, .6 + (i > 2 ? .2 : 0), 1.2, .11, i % 2 ? '#d8342c' : '#8ab04a', { ol: false });
      box(1.75, 1.0, .35, .3, .3, .32, '#c9a268'); for (let i = 0; i < 3; i++) cyl(.4 + i * .28, 1.05, .35, .08, .2, '#f6f0dc', { ol: false }); dot(1.2, 1.2, .5, '#e8a030', 2, 3);
      signY('CIDER', .55, 1.85, .92, 2.22, 2.56, '#f6e6b8', '#5a2a14', {}); },
  },
  { /* giant pumpkin weigh-off: the season's biggest on a scale */
    id: 'prop.harvest.giant', kind: 'prop', tags: ['event', 'harvest'], solid: false, size: [2.4, 2, 2.4], vb: [-.3, -.3, 0, 2.7, 2.5, 3], variants: [{}],
    draw() { box(.1, .1, 0, 2.2, 1.8, .25, '#8a8f98', { t: '#c9ced6' }); for (let i = 0; i < 5; i++) ball(.6 + i * .3, 1 + (i % 2) * .03, .9, .78 - Math.abs(i - 2) * .07, i % 2 ? '#e8802a' : '#d9722a', { squash: .8, ol: i === 0 || i === 4 }); box(1.1, .9, 1.55, .16, .16, .3, '#5a7a3a');
      pole(2.15, .3, .25, 1.9, '#5a606c', .1); const q = P(2.15, .36, 2.1); ellipse(q[0], q[1], 6, 6, '#f4f0e8'); for (let i = 0; i < 20; i++) { const a = i * Math.PI / 10; px(q[0] + Math.round(Math.cos(a) * 6), q[1] + Math.round(Math.sin(a) * 6), C('#33303f')); } px(q[0], q[1], C('#d8342e')); px(q[0] + 1, q[1] - 1, C('#d8342e')); px(q[0] + 2, q[1] - 2, C('#d8342e'));
      dot(.5, 1.82, .5, '#3b82d6', 5, 6); dot(.5, 1.82, .5, '#f2c230', 3, 3, 1, 1); },
  },
  { /* wish table: write a wish on a paper lantern */
    id: 'prop.lantern.wish', kind: 'prop', tags: ['event', 'lantern', 'game'], solid: false, size: [2.4, 1.2, 2.6], vb: [-.3, -.3, 0, 2.7, 1.9, 3], use: { x: 1.2, y: 1.8 }, light: { x: 1.2, y: 1.5, z: 0, r: 3.5, c: '#ffd9a0' }, variants: [{}],
    draw() { box(.1, .3, 0, 2.2, .8, .85, '#c0302a', { l: PAT.vstripes('#c0302a', '#a02420', 6), t: '#f6f0dc' });
      for (let i = 0; i < 5; i++) lantern(.4 + i * .4, .7, 1.12, ['#f6f0dc', '#ffe6a8', '#ffd0c0'][i % 3], 3, '#8a6a45'); cyl(2.05, .9, .85, .07, .16, '#33303f', { ol: false }); dot(2.05, .9, 1.12, '#33303f', 1, 3);
      for (const x of [.1, 2.3]) pole(x, .3, 0, 2.4, '#7a2a24', .08, false); lw([.1, .3, 2.4], [2.3, .3, 2.4], '#7a2a24'); for (let i = 0; i < 4; i++) lantern(.45 + i * .5, .32, 2.0, i % 2 ? '#f2c230' : '#e0453a', 3);
      signY('WISHES', .6, 1.8, 1.12, .3, .64, '#f2c230', '#5a1414', {}); },
  },
  { /* the paper dragon, carried on poles: part = 'head' | 'body' | 'tail'; drawn along x (flip for y), p.dir like vehicles; hop = bob frame 0..3 */
    id: 'prop.lantern.dragon', kind: 'vehicle', tags: ['event', 'lantern', 'dragon'], size: [1.6, .8, 2.4], vb: [-.8, -.5, 0, 2.4, 1.4, 3.6],
    variants: [{ part: 'head', dir: 1 }, { part: 'body', dir: 1, i: 1 }, { part: 'body', dir: 1, i: 2 }, { part: 'tail', dir: 1 }, { part: 'head', dir: -1 }],
    draw(p) {
      const f = (p.dir || 1) < 0, X = u => f ? 1.6 - u : u, part = p.part || 'body', z = 1.75 + [0, .12, .2, .08][(p.hop || 0) & 3], i = p.i || 0;
      pole(.8, .4, 0, z, '#8a6a45', .06, false);
      if (part === 'body') { const c = i % 2 ? DR.a : dk(DR.a, .08);
        lit(() => { ball(.8, .4, z + .3, .62, c, { squash: .7, t: lt(DR.a, .3), d: dk(DR.a, .25) }); for (let k = -2; k <= 2; k++) dot(.8 + k * .22, .82, z + .2 - Math.abs(k) * .04, DR.b, 2, 2); for (let k = -1; k <= 1; k++) { const q = P(.8 + k * .4, .4, z + .78); px(q[0], q[1], C(DR.c)); px(q[0] - 1, q[1] + 1, C(DR.c)); px(q[0] + 1, q[1] + 1, C(DR.c)); px(q[0], q[1] + 1, C(DR.b)); } });
        halo(.8, .4, z + .3, 9, '#ff9a5a'); }
      else if (part === 'tail') { lit(() => { ball(X(1.0), .4, z + .3, .45, DR.a, { squash: .7 }); ball(X(.55), .4, z + .36, .3, DR.a, { squash: .7 }); fq([[X(.4), .4, z + .4], [X(-.4), .4, z + .9], [X(-.2), .4, z + .3]], DR.b); fq([[X(.4), .4, z + .35], [X(-.5), .4, z + .25], [X(-.1), .4, z + .05]], DR.c); }); halo(.8, .4, z + .3, 7, '#ff9a5a'); }
      else { lit(() => {
        ball(X(.5), .4, z + .35, .6, DR.a, { squash: .75 }); ball(X(1.15), .4, z + .45, .52, DR.a, { squash: .8, t: lt(DR.a, .3) });
        fq([[X(1.3), .78, z + .3], [X(2.0), .78, z + .22], [X(2.0), .78, z + .02], [X(1.3), .78, z - .02]], DR.b); fq([[X(1.35), .78, z + .7], [X(2.05), .78, z + .5], [X(2.0), .78, z + .3], [X(1.3), .78, z + .34]], DR.a);   /* jaws */
        for (let k = 0; k < 4; k++) dot(X(1.45 + k * .15), .79, z + .3, '#fff8e0', 1, 2);
        const q = P(X(1.3), .8, z + .62); ellipse(q[0], q[1], 2, 2, '#fff8e0'); px(q[0], q[1], C('#2b2238'));
        fq([[X(1.0), .4, z + .9], [X(.7), .4, z + 1.5], [X(1.2), .4, z + 1.0]], DR.b); fq([[X(1.25), .4, z + .9], [X(1.15), .4, z + 1.4], [X(1.45), .4, z + .95]], DR.b);   /* horns */
        for (let k = 0; k < 4; k++) dot(X(.3 + k * .2), .4, z + .95 - k * .02, DR.c, 2, 3);                                   /* mane */
        lw([X(1.95), .78, z + .3], [X(2.3), .78, z + .7], DR.b); lw([X(1.95), .78, z + .3], [X(2.35), .78, z + .1], DR.b); });
        halo(X(1.1), .4, z + .4, 11, '#ffb060'); }
    },
  },
  { /* blossom basket stand: take a handful of petals for the parade */
    id: 'prop.blossom.basket', kind: 'prop', tags: ['event', 'blossom', 'game'], solid: false, size: [1.6, 1, 2.4], vb: [-.3, -.3, 0, 1.9, 1.6, 2.9], use: { x: .8, y: 1.6 }, variants: [{}],
    draw() { const R = rng(4); box(.1, .2, 0, 1.4, .6, .7, '#f6f0dc', { l: PAT.vstripes('#f2a7c3', '#fbe3ea', 5) }); for (const x of [.45, 1.15]) { cyl(x, .5, .7, .3, .3, '#c9a268', { l: '#d8b47a', r: '#a8743e', t: '#f7c1d4' }); for (let i = 0; i < 9; i++) flower(x - .2 + R() * .4, .4 + R() * .25, 1.02, ['#f2a7c3', '#fbe3ea', '#f7c1d4'][i % 3], '#fff2b0'); }
      for (const x of [.1, 1.5]) pole(x, .2, 0, 2.2, '#f4f0e8', .07, false); pennants([.1, .2, 2.2], [1.5, .2, 2.2], 5, ['#f2a7c3', '#fbe3ea', '#9ad0a0'], .15, 4); signY('PETALS', .25, 1.35, .81, .2, .5, '#fbe3ea', '#7a2f52', {}); },
  },
  { /* Harbor Master's firing desk on the pier: a plunger box wired to the barge */
    id: 'prop.harbor.plunger', kind: 'prop', tags: ['event', 'harbor', 'game'], solid: false, size: [1.6, 1, 2.2], vb: [-.3, -.3, 0, 1.9, 1.6, 2.8], use: { x: .8, y: 1.6 }, light: { x: .8, y: 1.3, z: 0, r: 3 }, variants: [{}],
    draw() { box(.1, .2, 0, 1.4, .6, .8, '#2f6fb5', { l: PAT.vstripes('#2f6fb5', '#f4f0e8', 6), t: '#c9a268' }); box(.5, .3, .8, .6, .4, .4, '#d8342e', { t: '#b82a24' }); pole(.8, .5, 1.2, .5, '#8a8f98', .08, false); box(.55, .44, 1.66, .5, .12, .1, '#33303f');
      lamp(.3, .75, .95, '#9cf2b0', 3); lamp(1.3, .75, .95, '#ff5a5a', 3); lw([1.1, .5, .9], [1.7, .2, 0], '#33303f'); pole(.1, .2, 0, 2.0, '#f4f0e8', .07, false); flag(.1, .2, 2.0, .2, ['#e0453a', '#f2c230'], 6, 4); signY('FIRE!', .35, 1.25, .81, .2, .5, '#f4f0e8', '#1f3f6f', {}); },
  },
  { /* the big switch that lights the tree */
    id: 'prop.winter.switch', kind: 'prop', tags: ['event', 'winter', 'game'], solid: false, size: [1.4, 1, 2.2], vb: [-.3, -.3, 0, 1.7, 1.6, 2.8], use: { x: .7, y: 1.6 }, light: { x: .7, y: 1.3, z: 0, r: 3 }, variants: [{ on: false }, { on: true }],
    draw(p) { box(.1, .2, 0, 1.2, .6, 1.0, '#2f8f6a', { l: PAT.vstripes('#2f8f6a', '#f4f8fb', 6), t: '#d8342e' }); box(.4, .3, 1.0, .6, .4, .7, '#5a606c', { l: '#8a8f98' });
      const zz = p.on ? 1.25 : 1.75; lw([.7, .72, 1.35], [.7, .95, zz], '#33303f'); dot(.7, .95, zz, '#d8342e', 3, 3, -1, -1); lamp(.7, .72, 1.58, p.on ? '#9cf2b0' : '#ff5a5a', 4, 2, 2);
      for (const x of [.1, 1.3]) { pole(x, .2, 0, 1.9, '#f4f8fb', .1); for (let k = 0; k < 6; k++) dot(x, .27, .2 + k * .3, '#d8342e', 2, 2, -1); } bulbs([.1, .2, 1.9], [1.3, .2, 1.9], 5, ['#fff2b0', '#ff8a8a', '#9cf2b0'], .12, 3); },
  },
];
