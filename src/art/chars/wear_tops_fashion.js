// Artist A: TOPS — shirts, blouses, knits and going-out cuts. Guide: docs/reports/clothes_drawing.md
// g: t(x, j, c) torso pixel (front: x = 1 is the chest centre line; back: x = 0 is the spine), row(j, c), body, inner, c2, accent, sk, wide, x0, x1, T, front, dk/lt/mix.
import { regShape } from './_shapes.js';

const C2 = (g, a = .5) => g.c2 || g.lt(g.body, a);
const ZIP = '#c8ccd4';

// Bustier: strapless, sweetheart dip at the centre, a lace trim row, two boning lines; lacing up the spine.
regShape('top', 'bustier', { sleeve: 0,
  body(c, x, j, g) { return j === 0 ? g.sk : null; },
  front(g) {
    const tr = C2(g, .3); for (let x = g.x0 + 1; x <= g.x1; x++) g.t(x, 1, tr); g.t(1, 1, g.sk);
    for (let j = 2; j < g.T; j++) { g.t(-1, j, g.dk(g.body, .25)); if (g.wide) g.t(2, j, g.dk(g.body, .25)); g.t(1, j, g.lt(g.body, .12)); }
  },
  back(g) { const tr = C2(g, .3); for (let x = g.x0 + 1; x <= g.x1; x++) g.t(x, 1, tr); for (let j = 2; j < g.T; j++) g.t(0, j, j & 1 ? g.accent : g.dk(g.body, .35)); },
});

// Pussy-bow blouse: long sleeves, a bow at the throat in the accent colour with two tails.
regShape('top', 'bowblouse', { sleeve: 9,
  front(g) { const a = g.accent; g.t(0, 0, a); g.t(1, 0, g.lt(a, .25)); if (g.wide) g.t(2, 0, a); g.t(1, 1, a); g.t(0, 2, g.dk(a, .2)); g.t(1, 2, g.dk(a, .12)); g.t(1, 3, g.dk(a, .25)); },
  back(g) { for (let x = -1; x <= 1; x++) g.t(x, 0, g.accent); },
});

// Fair Isle jumper: a patterned yoke (c2 band, accent motif row, c2 band) on a plain body, ribbed hem.
regShape('top', 'fairisle', { sleeve: 9,
  body(c, x, j, g) { const b = C2(g, .6); return j === 1 || j === 3 ? b : j === 2 ? ((x + 8) & 1 ? g.accent : c) : j === g.T - 1 ? g.dk(c, .22) : null; },
  front(g) { g.t(1, 0, g.lt(g.body, .25)); g.t(0, 0, g.lt(g.body, .15)); },
  back(g) {},
});

// Cable knit: two twisted cable columns (dark/light alternating), rolled collar, ribbed hem.
regShape('top', 'cableknit', { sleeve: 9,
  body(c, x, j, g) { return (x === -1 || x === 1) && j > 0 && j < g.T - 1 ? (j & 1 ? g.dk(c, .2) : g.lt(c, .1)) : null; },
  front(g) { g.row(0, g.lt(g.body, .28)); g.row(g.T - 1, g.dk(g.body, .22)); },
  back(g) { g.row(0, g.lt(g.body, .28)); g.row(g.T - 1, g.dk(g.body, .22)); },
});

// Quarter-zip pullover: stand collar in c2, a short silver zip down from the collar, ribbed hem.
regShape('top', 'quarterzip', { sleeve: 9,
  front(g) { const cl = C2(g, .3); for (let x = g.x0 + 1; x <= g.x1; x++) g.t(x, 0, cl); g.t(1, 0, ZIP); g.t(1, 1, ZIP); g.t(1, 2, g.dk(ZIP, .2)); g.row(g.T - 1, g.dk(g.body, .2)); },
  back(g) { const cl = C2(g, .3); for (let x = -1; x <= 1; x++) g.t(x, 0, cl); g.row(g.T - 1, g.dk(g.body, .2)); },
});

// Bowling shirt: camp collar, two contrast panels running down the front either side of the placket, contrast back yoke, chest embroidery.
regShape('top', 'bowling', { sleeve: 2,
  body(c, x, j, g) { return g.front ? ((x === 0 || x === 2) && j >= 1 ? C2(g) : null) : (j <= 1 ? C2(g) : null); },
  front(g) { g.t(1, 0, g.sk); g.t(0, 0, g.lt(g.body, .4)); if (g.wide) g.t(2, 0, g.lt(g.body, .4)); for (let j = 1; j < g.T; j++) g.t(1, j, j & 1 ? g.dk(g.body, .18) : g.body); g.t(-1, 2, g.accent); },
  back(g) {},
});

// Western shirt: pointed contrast yoke front and back, pearl snaps down the placket.
regShape('top', 'western', { sleeve: 9,
  body(c, x, j, g) { const y = C2(g); if (j === 0) return y; if (g.front) return j === 1 && (x === -1 || x === 2) ? y : null; return (j === 1 && x >= -1 && x <= 1) || (j === 2 && x === 0) ? y : null; },
  front(g) { const y = C2(g); g.t(1, 0, g.sk); g.t(0, 0, g.lt(y, .25)); if (g.wide) g.t(2, 0, g.lt(y, .25)); for (let j = 1; j < g.T; j++) g.t(1, j, j & 1 ? '#f4f0e8' : g.dk(g.body, .2)); },
  back(g) {},
});

// Mandarin-collar shirt: a closed band collar and a diagonal trimmed placket with knot buttons.
regShape('top', 'mandarin', { sleeve: 9,
  front(g) {
    const tr = g.c2 || g.dk(g.body, .32); for (let x = g.x0 + 1; x <= g.x1; x++) g.t(x, 0, tr);
    g.t(1, 1, tr); g.t(0, 2, tr); g.t(-1, 3, tr); g.t(1, 2, g.GOLD); g.t(0, 3, g.GOLD); g.row(g.T - 1, g.dk(g.body, .12));
  },
  back(g) { const tr = g.c2 || g.dk(g.body, .32); for (let x = -1; x <= 1; x++) g.t(x, 0, tr); },
});

// Peasant blouse: wide scoop neck, a band of two-colour embroidery under it, three-quarter sleeves, light hem.
regShape('top', 'peasant', { sleeve: 3,
  front(g) { g.t(0, 0, g.sk); g.t(1, 0, g.sk); if (g.wide) g.t(2, 0, g.sk); for (let x = g.x0 + 1; x <= g.x1; x++) g.t(x, 1, (x + 8) & 1 ? g.accent : C2(g, .5)); g.row(g.T - 1, g.lt(g.body, .2)); },
  back(g) { for (let x = -1; x <= 1; x++) g.t(x, 0, g.sk); for (let x = g.x0 + 1; x <= g.x1; x++) g.t(x, 1, (x + 8) & 1 ? g.accent : C2(g, .5)); g.row(g.T - 1, g.lt(g.body, .2)); },
});

// Tie-front shirt: camp collar shirt cropped above the waist, knotted at the front; bare midriff.
regShape('top', 'tiefront', { sleeve: 2,
  body(c, x, j, g) { return j === g.T - 1 && !(g.front && (x === 0 || x === 1)) ? g.sk : null; },
  front(g) { g.t(1, 0, g.sk); g.t(0, 0, g.lt(g.body, .35)); if (g.wide) g.t(2, 0, g.lt(g.body, .35)); for (let j = 1; j < g.T - 2; j++) g.t(1, j, j & 1 ? g.dk(g.body, .25) : g.lt(g.body, .3)); g.t(1, g.T - 2, g.dk(g.body, .2)); g.t(0, g.T - 1, g.dk(g.body, .25)); g.t(1, g.T - 1, g.lt(g.body, .15)); },
  back(g) { for (let x = -1; x <= 1; x++) g.t(x, 0, g.lt(g.body, .3)); },
});

// Waistcoat over a shirt: shirt sleeves (inner colour), V opening, two buttons, welt pockets, pointed hem; satin back with a half-belt.
regShape('top', 'waistcoat', { sleeve: 9, arm: 'inner',
  front(g) {
    const i = g.inner, b = g.c2 || g.dk(g.body, .45); g.t(0, 0, i); g.t(1, 0, i); if (g.wide) g.t(2, 0, i); g.t(1, 1, i); g.t(1, 2, i); g.t(0, 1, g.lt(g.body, .18));
    g.t(1, 3, b); g.t(1, 4, b); g.t(-1, 3, g.dk(g.body, .3)); if (g.wide) g.t(2, 3, g.dk(g.body, .3)); g.t(1, g.T - 1, g.dk(i, .1));
  },
  back(g) { const s = g.lt(g.body, .22); for (let j = 0; j < g.T; j++) for (let x = g.x0 + 1; x <= g.x1; x++) g.t(x, j, j === 0 ? g.inner : j === g.T - 2 ? g.dk(g.body, .2) : s); },
});

// Buffalo-check shirt: big 2x2 checks in c2, collar and centre placket.
regShape('top', 'buffalo', { sleeve: 9,
  body(c, x, j, g) { return ((((x + 8) >> 1) + (j >> 1)) & 1) ? (g.c2 || g.dk(c, .5)) : null; },
  front(g) { g.t(1, 0, g.sk); g.t(0, 0, g.lt(g.body, .3)); if (g.wide) g.t(2, 0, g.lt(g.body, .3)); },
  back(g) { for (let x = -1; x <= 1; x++) g.t(x, 0, g.lt(g.body, .3)); },
});

// One-shoulder top: one bare shoulder, the fabric runs diagonally to the other, a ruffle on the strap.
regShape('top', 'oneshoulder', { sleeve: 0,
  body(c, x, j, g) { const bare = g.front ? x <= 0 : x >= 0; return (j === 0 && bare) || (j === 1 && x === (g.front ? g.x0 : g.x1)) ? g.sk : null; },
  front(g) { g.t(1, 0, g.lt(g.body, .28)); if (g.wide) g.t(2, 0, g.lt(g.body, .15)); g.t(0, 1, g.lt(g.body, .2)); },
  back(g) { g.t(-1, 0, g.lt(g.body, .2)); g.t(0, 1, g.lt(g.body, .12)); },
});
