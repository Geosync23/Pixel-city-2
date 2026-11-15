// Artist A: OUTERWEAR — coats and jackets worn over the top. g.inner = colour of the top underneath. Guide: docs/reports/clothes_drawing.md
// g: t(x, j, c) torso pixel (front: x = 1 is the centre line; back: x = 0 is the spine), p(x, y, c) raw plot (hips: y = g.hipY + row), row(j, c),
// body, inner, c2, accent, sk, wide, x0, x1, T, front, seated, k (k.L = leg rows), dk/lt/mix, WHITE, GOLD.
import { regShape } from './_shapes.js';

const C2 = (g, a = .5) => g.c2 || g.lt(g.body, a);
const ZIP = '#c8ccd4';
/** paint a row of the coat tail (rows below the waist), when the tail is drawn (standing poses only) */
const tailRow = (g, j, f) => { if (g.seated || j >= g.k.L - 2) return; for (let x = g.x0; x <= g.x1; x++) { const c = f(x); if (c) g.p(x, g.hipY + j, c); } };

// Pea coat: double-breasted, two columns of buttons, wide lapels, a half-belt on the back.
regShape('outer', 'peacoat', { sleeve: 9, tail: 1,
  front(g) {
    const b = g.c2 || g.lt(g.body, .45); g.t(1, 0, g.inner); g.t(0, 0, g.lt(g.body, .28)); g.t(0, 1, g.lt(g.body, .16)); if (g.wide) g.t(2, 0, g.lt(g.body, .28));
    for (let j = 1; j < g.T; j++) g.t(1, j, g.dk(g.body, .2));
    for (const j of [2, 4]) { g.t(-1, j, b); g.t(g.wide ? 2 : 1, j, b); }
  },
  back(g) { const b = g.c2 || g.lt(g.body, .45); for (let x = -1; x <= 1; x++) { g.t(x, 0, g.lt(g.body, .22)); g.t(x, g.T - 2, g.dk(g.body, .28)); } g.t(-1, g.T - 2, b); g.t(1, g.T - 2, b); },
});

// Duffle coat: horn toggles (c2) across the front on rope loops, the hood folded behind the neck and hanging on the back.
regShape('outer', 'duffle', { sleeve: 9, tail: 2,
  front(g) {
    const tg = g.c2 || '#ead9b8'; for (let x = g.x0 + 1; x <= g.x1; x++) g.t(x, 0, g.dk(g.body, .2)); g.t(1, 0, g.inner);
    for (let j = 1; j < g.T; j++) g.t(1, j, g.dk(g.body, .22));
    for (const j of [1, 3]) { g.t(-1, j, g.dk(g.body, .38)); g.t(0, j, tg); g.t(1, j, g.dk(tg, .15)); }
  },
  back(g) { const h = g.dk(g.body, .2); for (let x = -1; x <= 1; x++) { g.t(x, 0, g.lt(g.body, .15)); g.t(x, 1, h); g.t(x, 2, h); } g.t(0, 3, h); g.t(0, 1, g.dk(h, .15)); },
});

// Anorak: a pullover shell, half zip from the collar, a kangaroo pocket band (c2), hood on the back.
regShape('outer', 'anorak', { sleeve: 9, tail: 1,
  body(c, x, j, g) { return g.c2 && (j === 3 || j === 4) ? g.c2 : null; },
  front(g) {
    const pc = g.c2 || g.body; g.t(0, 0, g.lt(g.body, .22)); if (g.wide) g.t(2, 0, g.lt(g.body, .22)); g.t(1, 0, ZIP); g.t(1, 1, ZIP); g.t(1, 2, g.dk(ZIP, .2));
    for (let x = -1; x <= g.x1; x++) g.t(x, 3, g.dk(pc, .28)); g.t(1, 4, g.dk(pc, .14));
  },
  back(g) { const h = g.dk(g.body, .2); for (let x = -1; x <= 1; x++) { g.t(x, 0, h); g.t(x, 1, h); } g.t(0, 2, h); },
});

// Wrap coat: no buttons, a broad shawl collar sweeping to the waist, a tie belt with two ends hanging over the hem; long.
regShape('outer', 'wrapcoat', { sleeve: 9, tail: 3,
  front(g) {
    const sh = g.lt(g.body, .3), bt = g.c2 || g.dk(g.body, .4); g.t(1, 0, g.inner); g.t(0, 0, sh); g.t(0, 1, sh); g.t(1, 1, sh); g.t(1, 2, sh); if (g.wide) { g.t(2, 0, sh); g.t(2, 1, g.dk(g.body, .12)); }
    g.t(1, 3, g.dk(g.body, .15)); g.row(g.T - 2, bt); g.t(0, g.T - 2, g.dk(bt, .15)); g.t(0, g.T - 1, bt); g.t(-1, g.T - 1, g.dk(bt, .1));
    tailRow(g, 0, x => x === 0 ? bt : x === -1 ? g.dk(bt, .1) : null);
  },
  back(g) { for (let x = -1; x <= 1; x++) g.t(x, 0, g.lt(g.body, .3)); g.row(g.T - 2, g.c2 || g.dk(g.body, .4)); },
});

// Long puffer: quilted channels every other row that carry on down the long tail, centre zip, lighter hood rim.
regShape('outer', 'longpuffer', { sleeve: 9, tail: 4,
  body(c, x, j, g) { return j & 1 ? g.dk(c, .26) : null; },
  front(g) {
    for (let x = g.x0 + 1; x <= g.x1; x++) g.t(x, 0, g.lt(g.body, .22)); for (let j = 1; j < g.T; j++) g.t(1, j, g.dk(g.body, .34));
    for (const j of [1, 3]) tailRow(g, j, x => x === g.x0 ? g.dk(g.body, .34) : x === 1 ? g.dk(g.body, .4) : g.dk(g.body, .24));
  },
  back(g) { for (let x = -1; x <= 1; x++) g.t(x, 0, g.lt(g.body, .22)); for (const j of [1, 3]) tailRow(g, j, x => x === g.x0 ? g.dk(g.body, .34) : g.dk(g.body, .3)); },
});

// Shearling jacket: a big fleece collar (c2) over both shoulders, open front, fleece-trimmed hem.
regShape('outer', 'shearling', { sleeve: 9,
  front(g) {
    const fl = g.c2 || '#efe4cc'; for (let x = g.x0 + 1; x <= g.x1; x++) { g.t(x, 0, fl); g.t(x, 1, x === 1 ? g.inner : g.dk(fl, .08)); }
    for (let j = 2; j < g.T - 1; j++) g.t(1, j, g.inner); g.row(g.T - 1, g.dk(fl, .1)); g.t(1, g.T - 1, g.dk(g.inner, .1));
  },
  back(g) { const fl = g.c2 || '#efe4cc'; for (let x = g.x0 + 1; x <= g.x1; x++) { g.t(x, 0, fl); g.t(x, 1, g.dk(fl, .08)); } g.row(g.T - 1, g.dk(fl, .1)); },
});

// Tuxedo / dinner jacket: satin peak lapels in c2 framing the shirt, a single satin button, white pocket square.
regShape('outer', 'tuxedo', { sleeve: 9,
  front(g) {
    const lp = g.c2 || g.lt(g.body, .3); g.t(1, 0, g.inner); g.t(1, 1, g.inner); g.t(1, 2, g.inner);
    g.t(0, 0, lp); g.t(0, 1, lp); g.t(0, 2, g.dk(lp, .1)); if (g.wide) { g.t(2, 0, lp); g.t(2, 1, g.dk(lp, .1)); }
    g.t(1, 3, lp); g.t(-1, 1, g.WHITE);
  },
  back(g) { const lp = g.c2 || g.lt(g.body, .3); for (let x = -1; x <= 1; x++) g.t(x, 0, lp); g.t(0, g.T - 1, g.dk(g.body, .3)); },
});

// Field jacket: closed placket, stand collar, four flap pockets in two rows, drawcord waist on the back.
regShape('outer', 'fieldjacket', { sleeve: 9, tail: 1,
  front(g) {
    const f = g.dk(g.body, .38); for (let x = g.x0 + 1; x <= g.x1; x++) g.t(x, 0, g.lt(g.body, .2)); g.t(1, 0, g.inner);
    for (let j = 1; j < g.T; j++) g.t(1, j, g.dk(g.body, .16));
    for (const j of [1, 3]) { g.t(-1, j, f); g.t(0, j, f); if (g.wide) g.t(2, j, f); g.t(0, j + 1, g.lt(g.body, .3)); }
  },
  back(g) { for (let x = -1; x <= 1; x++) g.t(x, 0, g.lt(g.body, .2)); g.row(g.T - 2, g.dk(g.body, .14)); },
});
