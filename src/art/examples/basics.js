// Reference examples of the asset contract (see docs/ART_GUIDE.md). Real art lives in the sibling folders.
import { box, qy, qx, qz, lw, glow, lit, ball, cyl, gable, winY, winX, signY, PAT, foliage, rng, dk, lt, ENV } from '../../engine/raster.js';

export default [
  {
    id: 'ex.lamp', kind: 'prop', size: [.2, .2, 4.2], solid: true, tags: ['street'],
    vb: [-.6, -.4, 0, .8, .7, 4.5],
    light: { x: .1, y: .3, z: 0, r: 4 },            // engine draws a pool of light on the ground at night
    draw() {
      box(0, 0, 0, .2, .2, .4, '#3d4a54'); box(.04, .04, .4, .12, .12, 3.6, '#4d5d68', { ol: false });
      box(-.35, -.02, 4, .8, .3, .14, '#3d4a54');
      qy(-.3, .4, .28, 3.94, 4, '#d8d2c0'); glow(() => qy(-.3, .4, .28, 3.9, 4, '#fff2c4'));
    },
  },
  {
    id: 'ex.tree', kind: 'prop', size: [.4, .4, 4], solid: true, tags: ['nature'],
    vb: [-1.4, -1.4, 0, 1.8, 1.8, 4.6], variants: [{ seed: 1 }, { seed: 2 }, { seed: 3 }],
    draw(p) {
      const r = rng(p.seed || 1), f = foliage('leaf', r());
      box(.1, .1, 0, .2, .2, 1.8, '#6b4a2f', { ol: false });
      if (!f) { lw([.2, .2, 1.8], [-.4, .2, 2.8], '#6b4a2f'); lw([.2, .2, 1.8], [.8, .2, 2.9], '#6b4a2f'); lw([.2, .2, 1.8], [.2, .2, 3.2], '#6b4a2f'); return; }
      ball(.2, .2, 2.6, 1.0, f); ball(-.3, .5, 2.3, .6, dk(f, .08)); ball(.6, .1, 3.2, .65, lt(f, .1));
    },
  },
  {
    id: 'ex.shop', kind: 'building', tags: ['oldtown', 'shop'],
    size: p => [p.w || 6, p.d || 5, (p.floors || 2) * 2 + 1.2],
    door: { side: 'y', at: 1.2 },                  // door centre is 1.2 units along the +y face
    variants: [{ w: 6, d: 5, floors: 2, seed: 4, name: 'CAFE' }, { w: 7, d: 5, floors: 3, seed: 9, name: 'BOOKS', wall: '#e9dcc0' }],
    draw(p) {
      const w = p.w || 6, d = p.d || 5, fl = p.floors || 2, H = fl * 2, r = rng(p.seed || 1), wall = p.wall || '#b5654a';
      box(0, 0, 0, w, d, H, wall, { l: PAT.brick(dk(wall, .18)), r: PAT.brick(dk(wall, .36)), t: '#7a6f6a' });
      for (let f = 1; f < fl; f++) {
        for (let x = .6; x + 1 <= w - .4; x += 1.6) winY(x, x + 1, d, f * 2 + .5, f * 2 + 1.6, { on: r() < .6, mullion: 'cross', sill: true });
        for (let y = .6; y + 1 <= d - .4; y += 1.6) winX(w, y, y + 1, f * 2 + .5, f * 2 + 1.6, { on: r() < .6, mullion: 'cross', sill: true });
      }
      winY(2.2, w - .5, d, .4, 1.5, { on: true });                       // shopfront
      qy(.7, 1.7, d, 0, 1.6, '#2b3a44'); winY(.85, 1.55, d, .7, 1.45, { on: true });   // door
      box(.2, d, 1.7, w - .4, .7, .12, '#2f6f5f', { t: PAT.ftile('#2f6f5f', '#f4f0e8', .5), ol: false });  // awning
      signY(p.name || 'SHOP', 2.2, w - .5, d + .02, 1.95, 2.45, '#1f2a33', '#ffd98a', { lit: true });
      gable(0, 0, H, w, d, 1.2, 'x', '#8a4b3a', { wall: wall });
      if (ENV.season === 3) qz(.3, w - .3, d * .55, d - .2, H + .3, '#f4f8fb', 'glass');
    },
  },
];
