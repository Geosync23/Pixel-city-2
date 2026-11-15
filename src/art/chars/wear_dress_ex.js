// EXAMPLE dress / one-piece shapes (artist B owns wear_dress_*.js). A dress is a torso shape with a skirt:
//   skirt: length in rows (99 = to the ankle), flare?: extra px per side from row 1 (number, or (j, n) => px), skirtPx?(c, x, j, n, k) -> colour of skirt pixel.
import { regShape } from './_shapes.js';
import { dk, lt } from '../../engine/raster.js';

// Ball gown: strapless bodice, a skirt that keeps widening, lighter tiers.
regShape('dress', 'ballgown', { sleeve: 0, skirt: 99, flare: (j, n) => Math.min(3, 1 + (j >> 1)),
  body(c, x, j, g) { return j === 0 ? g.sk : c; },
  skirtPx(c, x, j, n) { return j % 3 === 2 ? lt(c, .22) : c; },
  front(g) { g.row(1, g.lt(g.body, .3)); g.row(g.T - 1, g.dk(g.body, .25)); g.t(1, g.T - 1, g.accent); },
  back(g) { g.row(1, g.lt(g.body, .3)); g.row(g.T - 1, g.dk(g.body, .25)); } });

// Qipao: high collar, diagonal frog buttons, narrow skirt with a side slit.
regShape('dress', 'qipao', { sleeve: 2, skirt: 5, flare: 0,
  skirtPx(c, x, j, n, k) { return x === Math.max(2, k.x1) && j > 1 ? k.skin : null; },
  front(g) { g.row(0, g.lt(g.body, .2)); g.t(1, 1, g.GOLD); g.t(2 > g.x1 ? g.x1 : 2, 2, g.GOLD); g.t(g.x1, 3, g.c2 || g.GOLD); },
  back(g) { g.row(0, g.lt(g.body, .2)); } });
