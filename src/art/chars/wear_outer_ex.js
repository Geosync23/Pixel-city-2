// EXAMPLE outerwear shapes (artist A owns wear_outer_*.js). Outerwear is worn OPEN over the top: g.inner is the colour of the top underneath.
import { regShape } from './_shapes.js';

// Cape: no sleeves of its own (arms show the top), long back, gold clasp at the throat.
regShape('outer', 'cape', { sleeve: 9, arm: 'inner', tail: 4,
  front(g) { for (let j = 1; j < g.T; j++) { g.t(0, j, g.inner); g.t(1, j, g.inner); if (g.wide && j > 2) g.t(2, j, g.inner); } g.t(1, 0, g.GOLD); g.t(0, 0, g.lt(g.body, .25)); if (g.wide) g.t(2, 0, g.lt(g.body, .25)); },
  back(g) { for (let x = -1; x <= 1; x++) g.t(x, 0, g.lt(g.body, .22)); for (let j = 2; j < g.T; j += 2) g.t(0, j, g.dk(g.body, .14)); } });

// Kimono jacket: crossed collar band in the second colour, sash in the accent, hem over the hips.
regShape('outer', 'kimono', { sleeve: 9, tail: 2,
  front(g) { const band = g.c2 || g.lt(g.body, .45); g.t(1, 0, g.sk); g.t(0, 0, band); g.t(1, 1, band); if (g.wide) { g.t(2, 0, band); g.t(2, 2, band); } g.t(0, 1, g.inner); g.row(g.T - 2, g.accent); g.t(g.x0, g.T - 2, g.dk(g.accent, .15)); },
  back(g) { const band = g.c2 || g.lt(g.body, .45); for (let x = -1; x <= 1; x++) g.t(x, 0, band); g.row(g.T - 2, g.accent); g.t(0, g.T - 3, g.lt(g.accent, .25)); g.t(0, g.T - 1, g.dk(g.accent, .2)); } });
