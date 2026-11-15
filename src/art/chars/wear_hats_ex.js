// EXAMPLE headwear shapes (artist C owns wear_hats_*.js).
// { cut?: false to keep the hair above the brow visible (bands, bows, tiaras); default true hides it, draw(g) } with
//   g = { R(x0, x1, row, colour) fill a row of the head (row 0 = chin, 5 = brow line, 6 = top of the skull, 7+ above it; x -3..3 is the head),
//         p(x, y, colour) raw plot (use g.cx + dx, g.yb - row), c (hat colour), band (or null), accent, front (bool), bf (how far a brim reaches forward) }.
import { regShape } from './_shapes.js';

regShape('hat', 'newsboy', { draw(g) { const c = g.c; g.R(-3, 2, 8, c); g.R(-4, 3, 7, c); g.R(-4, 3, 6, c); g.R(-3, 3, 5, g.dk(c, .12)); g.R(3, g.bf, 5, g.dk(c, .32)); g.R(-4, -3, 6, g.dk(c, .18)); g.p(g.cx - 1, g.yb - 8, g.lt(c, .25)); g.p(g.cx, g.yb - 7, g.dk(c, .15)); g.p(g.cx + 2, g.yb - 7, g.dk(c, .15)); } });
regShape('hat', 'pillbox', { cut: false, draw(g) { const c = g.c; g.R(-2, 1, 8, c); g.R(-2, 1, 7, g.dk(c, .12)); g.p(g.cx - 1, g.yb - 8, g.lt(c, .3)); if (g.front) { g.p(g.cx + 2, g.yb - 6, g.accent); g.p(g.cx + 2, g.yb - 5, g.lt(g.accent, .3)); } } });
regShape('hat', 'sombrero', { draw(g) { const c = g.c, b = g.band || g.accent; g.R(-1, 1, 9, c); g.R(-2, 2, 8, c); g.R(-2, 2, 7, b); g.R(-3, 3, 6, c); g.R(-6, 6, 5, c); g.R(-6, -4, 5, g.dk(c, .15)); g.p(g.cx - 7, g.yb - 6, g.dk(c, .1)); g.p(g.cx + 7, g.yb - 6, c); for (let x = -5; x <= 5; x += 2) g.p(g.cx + x, g.yb - 5, b); g.p(g.cx - 1, g.yb - 9, g.lt(c, .3)); } });
