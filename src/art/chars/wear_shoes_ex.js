// EXAMPLE shoe shapes (artist B owns wear_shoes_*.js).
// { rows?: extra leg rows the shaft covers (boots), draw(g) } with g = { p(x, y, colour), x, fy (sole row), c (shoe colour, already shaded for the far leg),
//   hi, sole, toe, c2 (second colour or null), sk (skin), white, near }.  The foot is 2 px wide (x, x+1) on rows fy-1 (upper) and fy (sole) plus the toe at x+2.
import { regShape } from './_shapes.js';

regShape('shoes', 'cowboyboot', { rows: 2, draw(g) { g.p(g.x, g.fy - 1, g.c); g.p(g.x + 1, g.fy - 1, g.c2 || g.hi); g.p(g.x, g.fy, g.dk(g.c, .4)); g.p(g.x + 1, g.fy, g.c); g.p(g.x + 2, g.fy, g.c); g.p(g.x + 3, g.fy, g.dk(g.c, .2)); g.p(g.x + 1, g.fy - 3, g.c2 || g.hi); } });
regShape('shoes', 'clog', { draw(g) { g.p(g.x, g.fy - 1, g.sk); g.p(g.x + 1, g.fy - 1, g.c); g.p(g.x + 2, g.fy - 1, g.c); g.p(g.x, g.fy, '#c8a070'); g.p(g.x + 1, g.fy, '#c8a070'); g.p(g.x + 2, g.fy, '#b08a58'); } });
regShape('shoes', 'maryjane', { draw(g) { g.p(g.x, g.fy - 1, g.c); g.p(g.x + 1, g.fy - 1, g.sk); g.p(g.x, g.fy - 2, g.c2 || g.white); g.p(g.x + 1, g.fy - 2, g.c2 || g.white); g.p(g.x, g.fy, g.c); g.p(g.x + 1, g.fy, g.c); g.p(g.x + 2, g.fy, g.hi); } });
