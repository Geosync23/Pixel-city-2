// EXAMPLE accessory shapes (artist C owns wear_acc_*.js). Kinds with a shape: neck, glasses, bag. Colour-only accessories need no shape
// (belt, gloves, socks, tights, watch: the catalogue item just sets that spec field, see src/data/clothes_acc.js).
//   neck:    draw(g)  g = { p, yS (shoulder row y), L (lean offset, add to x), x0, x1, T, c (colour), front }
//   glasses: draw(g)  g = { p, cx, yb, c (frame/lens colour or null), front, sk, EYE }   eyes are at (cx, cx+2) on rows yb-3 / yb-2 in front view
//   bag:     back(g)  g = { p, yS, x0, x1, ax, T, c, front, accent }  drawn over the body;   hand(g)  g = { p, x, y (the hand), c, accent }  carried
import { regShape } from './_shapes.js';

regShape('neck', 'choker', { draw(g) { if (g.front) { for (let x = 0; x <= Math.min(2, g.x1); x++) g.p(x + g.L, g.yS - 0, g.c); g.p(1 + g.L, g.yS, g.GOLD); } else for (let x = -1; x <= 1; x++) g.p(x + g.L, g.yS, g.c); } });
regShape('glasses', 'cateye', { draw(g) { const c = g.c || '#d9483b'; if (!g.front) { g.p(g.cx + 3, g.yb - 3, c); return; } for (const x of [-2, -1, 1, 3]) g.p(g.cx + x, g.yb - 3, c); g.p(g.cx - 1, g.yb - 4, c); g.p(g.cx + 3, g.yb - 4, c); g.p(g.cx, g.yb - 3, '#dff4fa'); g.p(g.cx + 2, g.yb - 3, '#dff4fa'); g.p(g.cx, g.yb - 2, g.EYE); g.p(g.cx + 2, g.yb - 2, g.EYE); } });
regShape('bag', 'bucketbag', { hand(g) { const c = g.c; g.p(g.x, g.y + 1, g.dk(c, .4)); for (let j = 0; j < 4; j++) for (let i = -1; i <= 1; i++) g.p(g.x + i, g.y + 2 + j, j === 0 ? g.dk(c, .3) : i === -1 ? g.dk(c, .15) : c); g.p(g.x, g.y + 2, g.accent); g.p(g.x + 1, g.y + 4, g.lt(c, .25)); } });
