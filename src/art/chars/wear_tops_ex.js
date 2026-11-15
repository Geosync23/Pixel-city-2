// EXAMPLE top shapes (framework samples; artist A owns wear_tops_*.js and may extend this file). Guide: docs/reports/clothes_drawing.md
// A torso shape: { sleeve: 0 none | 2 short | 3 three-quarter | 9 long, arm?: 'inner'|'accent'|'c2'|'skin' (sleeve colour), tail?: rows of hem over the hips,
//   body?(c, x, j, g) -> colour of body pixel (x, j) after the fabric pattern, front?(g), back?(g) }.   g.t(x, j, colour) plots torso pixel: x in g.x0..g.x1
//   (-2..2 on an average build; 1 = the centre line of the chest in front view), j = row 0 (shoulders) .. g.T-1 (hem). g.row(j, c) fills a row.
import { regShape } from './_shapes.js';

// Raglan baseball tee: body in the main colour, three-quarter sleeves and collar ring in the second colour.
regShape('top', 'raglan', { sleeve: 3, arm: 'c2',
  front(g) { const c2 = g.c2 || g.accent; g.t(1, 0, g.sk); g.t(0, 0, c2); if (g.wide) g.t(2, 0, c2); g.t(g.x0, 0, g.dk(c2, .14)); g.t(g.x1, 0, c2); },
  back(g) { const c2 = g.c2 || g.accent; for (let x = -1; x <= 1; x++) g.t(x, 0, c2); g.t(g.x0, 0, g.dk(c2, .14)); g.t(g.x1, 0, c2); } });

// Halter top: bare shoulders, the fabric gathers to the neck.
regShape('top', 'halter', { sleeve: 0,
  body(c, x, j, g) { return (j === 0 && (x < 0 || x > 1)) || (j === 1 && (x === g.x0 || x === g.x1)) ? g.sk : c; },
  front(g) { g.t(1, 1, g.lt(g.body, .25)); },
  back(g) { for (let j = 0; j < 3; j++) for (let x = g.x0; x <= g.x1; x++) g.t(x, j, x === g.x0 ? g.dk(g.sk, .1) : g.sk); g.t(0, 0, g.body); g.row(3, g.dk(g.body, .15)); } });

// Peplum blouse: short sleeves, belted waist, a flared frill over the hips.
regShape('top', 'peplum', { sleeve: 2,
  front(g) { g.t(1, 0, g.sk); g.t(0, 0, g.sk); g.row(g.T - 3, g.dk(g.body, .3)); g.t(1, g.T - 3, g.GOLD); g.t(g.x0 - 1, g.T - 1, g.dk(g.body, .12)); g.t(g.x1 + 1, g.T - 1, g.lt(g.body, .15)); g.row(g.T - 1, g.lt(g.body, .15)); },
  back(g) { g.row(g.T - 3, g.dk(g.body, .3)); g.t(g.x0 - 1, g.T - 1, g.dk(g.body, .12)); g.t(g.x1 + 1, g.T - 1, g.lt(g.body, .15)); g.row(g.T - 1, g.lt(g.body, .15)); } });
