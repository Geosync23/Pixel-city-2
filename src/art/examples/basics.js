// Reference examples of the asset contract (see docs/ART_GUIDE.md). Real art lives in the sibling folders.
import { box, qy, qx, qz, fq, lw, glow, lit, ball, cyl, gable, winY, winX, signY, PAT, foliage, rng, dk, lt, ENV } from '../../engine/raster.js';

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
      const trim = '#efe6d2', stone = '#9a8f86', awn = ['#2f6f5f', '#a8343a', '#35557a', '#b8862f'][(p.seed || 1) % 4], shut = dk(awn, .1);
      box(0, 0, 0, w, d, H, wall, { l: PAT.brick(dk(wall, .18)), r: PAT.brick(dk(wall, .36)), t: '#7a6f6a' });
      qy(0, w, d, 0, .3, stone); qx(w, 0, d, 0, .3, dk(stone, .2)); lw([0, d, .3], [w, d, .3], dk(stone, .4)); lw([w, 0, .3], [w, d, .3], dk(stone, .5));   /* stone plinth */
      for (let f = 1; f < fl; f++) {
        const z = f * 2;
        qy(0, w, d, z - .12, z, trim); qx(w, 0, d, z - .12, z, dk(trim, .2)); lw([0, d, z - .12], [w, d, z - .12], dk(trim, .45));                              /* string course */
        for (let x = .6; x + 1 <= w - .4; x += 1.6) {                                                                                                         /* upper windows: shutters + flower boxes */
          qy(x - .22, x - .04, d, z + .5, z + 1.6, shut); qy(x + 1.04, x + 1.22, d, z + .5, z + 1.6, shut);
          winY(x, x + 1, d, z + .5, z + 1.6, { on: r() < .6, mullion: 'cross', sill: true });
          if (ENV.season !== 3 && r() < .6) { qy(x + .05, x + .95, d + .01, z + .4, z + .52, '#7a5238'); const c = ['#e8556a', '#f2c230', '#f4f0ff'][Math.floor(r() * 3)]; for (let u = x + .12; u < x + .9; u += .19) { qy(u, u + .07, d + .01, z + .52, z + .62, '#4f9a55'); qy(u + .06, u + .13, d + .01, z + .58, z + .66, c); } }
        }
        for (let y = .6; y + 1 <= d - .4; y += 1.6) winX(w, y, y + 1, z + .5, z + 1.6, { on: r() < .6, mullion: 'cross', sill: true });
      }
      qy(0, w, d, H - .22, H, trim); qx(w, 0, d, H - .22, H, dk(trim, .2)); lw([0, d, H - .22], [w, d, H - .22], dk(trim, .45)); lw([w, 0, H - .22], [w, d, H - .22], dk(trim, .5));   /* cornice */
      qy(2.1, w - .4, d, .3, 1.62, trim); winY(2.2, w - .5, d, .42, 1.5, { on: true });                                                                         /* shopfront in a painted frame */
      for (let x = 2.4, i = 0; x + .3 < w - .6; x += .55, i++) { const c = ['#e8b860', '#c8703a', '#f1ede4', '#8a5a3a'][i % 4]; qy(x, x + .3, d + .01, .5, .5 + .18 + (i % 3) * .08, c); glow(() => qy(x, x + .3, d + .01, .5, .5 + .18 + (i % 3) * .08, lt(c, .3))); }   /* goods on display */
      qy(.62, 1.78, d, 0, 1.68, trim); qy(.7, 1.7, d, 0, 1.6, '#2b3a44'); winY(.85, 1.55, d, .7, 1.45, { on: true }); qy(1.5, 1.58, d + .01, .78, .86, '#e8c860');   /* door: frame, glass, brass handle */
      qy(.7, 1.7, d, 0, .08, stone);                                                                                                                             /* step */
      for (let x = .2, i = 0; x < w - .2 - 1e-6; x += .5, i++) { const xe = Math.min(w - .2, x + .5), c = i % 2 ? '#f4f0e8' : awn;                              /* striped, sloped awning with a valance */
        fq([[x, d, 1.88], [xe, d, 1.88], [xe, d + .28, 1.66], [x, d + .28, 1.66]], c); qy(x, xe, d + .28, 1.54, 1.66, dk(c, .18)); }
      lw([.2, d + .28, 1.54], [w - .2, d + .28, 1.54], dk(awn, .6)); lw([.2, d + .28, 1.66], [w - .2, d + .28, 1.66], dk(awn, .35));
      signY(p.name || 'SHOP', 2.2, w - .5, d + .02, 1.92, 2.4, '#1f2a33', '#ffd98a', { lit: true });
      gable(0, 0, H, w, d, 1.2, 'x', '#8a4b3a', { wall: wall });
      box(w * .25, d * .2, H + .35, .55, .55, 1.25, dk(wall, .1), { l: PAT.brick(dk(wall, .28)), r: PAT.brick(dk(wall, .42)), t: '#4a4048' }); box(w * .25 - .05, d * .2 - .05, H + 1.6, .65, .65, .1, stone, { ol: false });   /* chimney */
      if (ENV.season === 3) { const zs = y => H + 1.2 * (d - y) / (d / 2) + .03, sn = (y0, y1, h2) => fq([[.15, y0, zs(y0)], [w - .15, y0, zs(y0)], [w - .15, y1, zs(y1)], [.15, y1, zs(y1)]], '#f4f8fb', h2);   /* snow lying on the visible slope */
        sn(d * .52, d * .8); sn(d * .8, d * .93, 'glass'); }
    },
  },
];
