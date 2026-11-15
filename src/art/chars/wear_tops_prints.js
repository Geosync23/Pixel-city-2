// Artist A: TOPS with prints and sports cuts (tees, merch, jerseys, tanks). Guide: docs/reports/clothes_drawing.md
// g: t(x, j, c) torso pixel (front: x = 1 is the chest centre line; back: x = 0 is the spine), row(j, c), body, inner, c2, accent, sk, wide, x0, x1, T, dk/lt/mix.
import { regShape } from './_shapes.js';

const C2 = (g, a = .5) => g.c2 || g.lt(g.body, a);
const XS = g => [-1, 0, 1]; // a three-wide print block, left of the centre line so it sits on the chest in 3/4 view

// Band / tour tee: a big square print on the chest (title line, picture, shadow) and the tour-dates list on the back.
regShape('top', 'bandtee', { sleeve: 2,
  front(g) {
    const a = g.accent, t = C2(g, .6); g.t(1, 0, g.sk);
    for (const x of XS(g)) { g.t(x, 1, t); g.t(x, 2, a); g.t(x, 3, a); g.t(x, 4, g.dk(a, .3)); }
    g.t(0, 2, g.lt(a, .35)); g.t(-1, 3, g.dk(a, .15));
  },
  back(g) { const t = C2(g, .6); for (const x of XS(g)) { g.t(x, 1, g.accent); g.t(x, 3, t); } g.t(0, 4, t); },
});

// Ringer tee: contrast neck ring and a contrast band at the hem.
regShape('top', 'ringer', { sleeve: 2,
  body(c, x, j, g) { return j === g.T - 1 ? C2(g) : null; },
  front(g) { const r = C2(g); g.t(1, 0, g.sk); g.t(0, 0, r); if (g.wide) g.t(2, 0, r); },
  back(g) { const r = C2(g); for (let x = -1; x <= 1; x++) g.t(x, 0, r); },
});

// Retro chest-band tee: a thick two-row band across the chest in c2 with a thin accent pinline under it.
regShape('top', 'retroband', { sleeve: 2,
  body(c, x, j, g) { return j === 2 || j === 3 ? C2(g) : j === 4 ? g.accent : null; },
  front(g) { g.t(1, 0, g.sk); },
  back(g) {},
});

// Star tee: a five-pixel star / cross print in the accent colour.
regShape('top', 'startee', { sleeve: 2,
  front(g) { const a = g.accent; g.t(1, 0, g.sk); g.t(0, 2, a); g.t(-1, 3, a); g.t(0, 3, g.lt(a, .3)); g.t(1, 3, a); g.t(0, 4, g.dk(a, .2)); },
  back(g) { g.t(0, 1, g.accent); },
});

// Sunset tee: a square postcard print, accent sky over c2 sea, a dark palm on the right.
regShape('top', 'sunsettee', { sleeve: 2,
  front(g) {
    const a = g.accent, s = C2(g, .3); g.t(1, 0, g.sk);
    for (const x of XS(g)) { g.t(x, 2, a); g.t(x, 3, s); g.t(x, 4, g.dk(s, .25)); }
    g.t(0, 2, g.lt(a, .45)); g.t(1, 2, g.dk(g.body, .55)); g.t(1, 3, g.dk(g.body, .55)); g.t(1, 4, g.dk(g.body, .4));
  },
  back(g) {},
});

// Basketball jersey: sleeveless, contrast trim at the neck and armholes, a number on the chest and a big "11" on the back.
regShape('top', 'bball', { sleeve: 0,
  front(g) {
    const n = C2(g); g.t(g.x0, 0, g.sk); g.t(g.x1, 0, g.sk); g.t(0, 0, g.sk); g.t(1, 0, g.sk); g.t(1, 1, n); g.t(0, 1, n);
    g.t(g.x0, 1, n); g.t(g.x1, 1, n);
    g.t(-1, 2, n); g.t(0, 2, n); g.t(0, 3, n); g.t(-1, 4, n); g.t(0, 4, n); g.t(-1, 3, g.accent);
  },
  back(g) {
    const n = C2(g); g.t(g.x0, 0, g.sk); g.t(g.x1, 0, g.sk); g.t(0, 0, g.sk); g.t(-1, 0, n); g.t(1, 0, n);
    for (let j = 1; j <= 4; j++) { g.t(-1, j, n); g.t(1, j, n); }
  },
});

// Hockey jersey: long sleeves, contrast shoulder yoke, a hem made of two stripes with an accent line between, laced collar, "7" on the back.
regShape('top', 'hockey', { sleeve: 9,
  body(c, x, j, g) { const s = C2(g); return j === 0 ? s : j === g.T - 3 || j === g.T - 1 ? s : j === g.T - 2 ? g.accent : null; },
  front(g) { g.t(1, 0, g.sk); g.t(1, 1, g.dk(g.body, .35)); g.t(-1, 1, g.accent); },
  back(g) { const n = C2(g); g.t(-1, 1, n); g.t(0, 1, n); g.t(1, 1, n); g.t(1, 2, n); g.t(0, 2, n); },
});

// Racerback sports tank: deep armholes, contrast side panels, Y-strap on the back.
regShape('top', 'racerback', { sleeve: 0,
  body(c, x, j, g) { return j >= 2 && (x === g.x0 || x === g.x1) ? C2(g) : null; },
  front(g) { for (const j of [0, 1]) { g.t(g.x0, j, g.sk); g.t(g.x1, j, g.sk); } g.t(0, 0, g.sk); g.t(1, 0, g.sk); },
  back(g) { for (let x = g.x0; x <= g.x1; x++) { if (x !== 0) { g.t(x, 0, x === g.x0 ? g.dk(g.sk, .1) : g.sk); g.t(x, 1, x === g.x0 ? g.dk(g.sk, .1) : g.sk); } } g.t(g.x0, 2, g.dk(g.sk, .1)); g.t(g.x1, 2, g.sk); },
});

// Tube top: strapless band of fabric; bare shoulders above and a bare midriff below.
regShape('top', 'tubetop', { sleeve: 0,
  body(c, x, j, g) { return j === 0 || j === g.T - 1 ? g.sk : null; },
  front(g) { for (let x = g.x0 + 1; x <= g.x1; x++) g.t(x, 1, g.lt(g.body, .22)); },
  back(g) { for (let x = g.x0 + 1; x <= g.x1; x++) g.t(x, 1, g.lt(g.body, .14)); },
});

// Collegiate sweatshirt: crew neck with the V insert, arched chest lettering (c2 or accent), ribbed hem.
regShape('top', 'collegiate', { sleeve: 9,
  front(g) {
    const l = g.c2 || g.accent; g.t(1, 0, g.dk(g.body, .25)); g.t(0, 0, g.lt(g.body, .2)); if (g.wide) g.t(2, 0, g.lt(g.body, .2));
    g.t(-1, 3, l); g.t(0, 2, l); g.t(1, 2, l); if (g.wide) g.t(2, 3, l); else g.t(1, 3, l);
    g.row(g.T - 1, g.dk(g.body, .22));
  },
  back(g) { for (let x = -1; x <= 1; x++) g.t(x, 0, g.lt(g.body, .2)); g.row(g.T - 1, g.dk(g.body, .22)); },
});

// Sailor top: big square collar in c2 that makes a V at the front and a square flap on the back, accent knot.
regShape('top', 'sailor', { sleeve: 2,
  front(g) {
    const c = C2(g, .7); g.t(1, 0, g.sk); g.t(1, 1, g.sk); g.t(0, 0, c); g.t(0, 1, c); g.t(-1, 0, c); if (g.wide) { g.t(2, 0, c); g.t(2, 1, c); }
    g.t(1, 2, g.accent); g.t(0, 2, g.dk(g.accent, .2)); if (g.wide) g.t(2, 2, g.dk(g.accent, .2)); g.t(1, 3, g.dk(g.accent, .15));
  },
  back(g) { const c = C2(g, .7); for (let j = 0; j < 3; j++) for (let x = -1; x <= 1; x++) g.t(x, j, j === 2 ? g.dk(c, .2) : c); g.t(-1, 1, g.dk(c, .3)); g.t(1, 1, g.dk(c, .3)); },
});
