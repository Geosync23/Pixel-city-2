// Relationship art (src/art/rel): the few props that dress the one small flat template (src/scenes/rooms/rel_flat.js) four ways.
// Assets (registry ids): furn.rel.musicstand (Noor: one kitchen chair and a music stand), furn.rel.cello (her cello on its stand),
//   furn.rel.corktile (Tav: a cork tile with a race number pinned to it), furn.rel.crewphoto (Tasha: the crew photograph, eight and a cox),
//   furn.rel.queuewindow (Marlow: the window that looks down on the cafe queue), furn.rel.blanket (a folded blanket for the sofa arm).
import { box, qz, qy, lw, px, C, PW, lt, dk, lit, rect } from '../../engine/raster.js';

const WOOD = '#8a5a3a', WOOD2 = '#6b4428', INK = '#2a2733', PAPER = '#fbf6e4', CORK = '#c79a63', BRASS = '#d9a441';
export default [
  { id: 'furn.rel.musicstand', kind: 'furniture', tags: ['rel', 'decor'], solid: true, size: [.5, .5, 1.3],
    draw() {      /* three feet, a thin pole, a tilted desk with two open pages */
      lw([.25, .25, 0], [.05, .42, 0], INK); lw([.25, .25, 0], [.45, .42, 0], INK); lw([.25, .25, 0], [.25, .05, 0], INK); lw([.25, .25, 0], [.25, .25, 1], '#55505f');
      qy(.03, .47, .25, .92, 1.28, '#3a3644'); qy(.06, .24, .255, .97, 1.24, PAPER); qy(.26, .44, .255, .97, 1.24, PAPER);
      for (const z of [1.04, 1.1, 1.16]) { qy(.08, .22, .26, z, z + .012, '#8d8a80'); qy(.28, .42, .26, z, z + .012, '#8d8a80'); }
    } },
  { id: 'furn.rel.cello', kind: 'furniture', tags: ['rel', 'decor'], solid: true, size: [.6, .5, 1.5],
    draw() {      /* a cello leaning in a low stand: body, waist, neck, scroll, four strings */
      box(.05, .12, 0, .5, .3, .08, INK);
      qy(.1, .5, .26, .1, .62, '#8a3f22', '#a34d2a'); qy(.14, .46, .26, .62, .9, '#7a371e', '#93431f'); qy(.17, .43, .26, .56, .66, '#5e2a16');
      qy(.27, .33, .265, .9, 1.38, '#2a1c10'); qy(.25, .35, .265, 1.38, 1.47, '#5e2a16'); qy(.29, .31, .27, .2, 1.36, '#e8e2cf');
      px(...PW(.22, .27, .42), C('#2a1c10')); px(...PW(.38, .27, .42), C('#2a1c10')); lw([.3, .26, .1], [.3, .34, 0], '#8d8a80');
    } },
  { id: 'furn.rel.corktile', kind: 'furniture', tags: ['rel', 'decor', 'wall'], wall: true, solid: false, size: [.8, .1, .8], mount: 1.25,
    draw() {      /* a cork tile; a race number on four pins; a ribbon; a route map torn from a paper */
      const y = .06; qy(0, .8, y - .02, 0, .8, dk(CORK, .25)); qy(.03, .77, y, .03, .77, CORK);
      for (const [x, z] of [[.1, .1], [.5, .2], [.3, .66], [.66, .6], [.2, .4]]) px(...PW(x, y + .005, z), C(dk(CORK, .18)));
      qy(.12, .58, y + .01, .3, .62, PAPER); qy(.12, .58, y + .012, .54, .62, '#e0523a'); qy(.2, .5, y + .014, .36, .5, INK);
      for (const [x, z] of [[.14, .6], [.56, .6], [.14, .32], [.56, .32]]) px(...PW(x, y + .016, z), C(BRASS));
      qy(.62, .7, y + .01, .14, .46, '#3b82d6'); qy(.6, .76, y + .01, .46, .56, '#f2c230');
    } },
  { id: 'furn.rel.crewphoto', kind: 'furniture', tags: ['rel', 'decor', 'wall', 'photo'], wall: true, solid: false, size: [1.2, .1, .7], mount: 1.3,
    draw() {      /* a long framed photograph: grey water, one thin boat, eight rowers and a cox, a shield in the corner */
      const y = .06; qy(0, 1.2, y - .02, 0, .7, '#3a2c22'); qy(.05, 1.15, y, .05, .65, '#e9e2cc'); qy(.09, 1.11, y + .005, .1, .6, '#9fb6c4'); qy(.09, 1.11, y + .008, .1, .3, '#7d97a8');
      qy(.14, 1.06, y + .012, .3, .335, '#3a2c22');
      for (let i = 0; i < 9; i++) { const x = .18 + i * .095; qy(x, x + .05, y + .014, .335, .43, i === 8 ? '#e0523a' : '#f4f0e8'); px(...PW(x + .025, y + .016, .46), C('#c98a6b')); }
      qy(1.0, 1.08, y + .012, .5, .58, '#b3261e');
    } },
  { id: 'furn.rel.queuewindow', kind: 'furniture', tags: ['rel', 'decor', 'wall', 'window'], wall: true, solid: false, size: [1.4, .1, 1.1], mount: 1, light: { x: .7, y: 1.5, z: 0, r: 3, c: '#ffe9b0' },
    draw() {      /* a sash window; through it, the street below: an awning's edge and the heads of a queue */
      const y = .06; qy(0, 1.4, y - .02, 0, 1.1, WOOD2);
      lit(() => { qy(.07, 1.33, y, .07, 1.03, '#bfe3f2', '#d8f0f8'); });
      qy(.07, 1.33, y + .005, .07, .3, '#8fa8b8'); qy(.07, 1.33, y + .008, .3, .38, '#b3261e'); for (let i = 0; i < 6; i++) qy(.09 + i * .21, .19 + i * .21, y + .01, .3, .38, '#f4f0e8');
      for (let i = 0; i < 7; i++) { const x = .14 + i * .17, c = ['#3a2c22', '#c98a2e', '#2a2733', '#8a4a2a', '#d8d2c0', '#3a2c22', '#6b4428'][i]; qy(x, x + .07, y + .012, .12, .2, c); qy(x - .01, x + .08, y + .012, .07, .13, ['#3b5bdb', '#2f9e44', '#e05a3a', '#8a5cc2', '#f08a2c', '#2fa3a0', '#b3261e'][i]); }
      qy(.68, .72, y + .014, .07, 1.03, WOOD2); qy(.07, 1.33, y + .014, .54, .58, WOOD2); qz(-.04, 1.44, 0, .16, 0, lt(WOOD, .1));
    } },
  { id: 'furn.rel.blanket', kind: 'furniture', tags: ['rel', 'decor'], solid: false, size: [.6, .5, .2],
    draw() { box(0, 0, 0, .6, .5, .08, '#84a98c', { l: '#6b8f73', r: '#57785f', t: '#9cc0a3' }); box(.03, .03, .08, .54, .44, .07, '#9cc0a3', { l: '#84a98c', r: '#6b8f73', t: '#b4d3ba' }); for (const x of [.15, .3, .45]) qz(x, x + .03, .03, .47, .151, '#f4f0e8'); } },
];
