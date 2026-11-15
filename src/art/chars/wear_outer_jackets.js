// Artist A: OUTERWEAR — short jackets, sports and street layers. g.inner = colour of the top underneath. Guide: docs/reports/clothes_drawing.md
import { regShape } from './_shapes.js';

const C2 = (g, a = .5) => g.c2 || g.lt(g.body, a);
const ZIP = '#c8ccd4';

// Zip fleece: contrast shoulder yoke and hem binding (c2), zipped to the collar, a zipped chest pocket.
regShape('outer', 'fleece', { sleeve: 9,
  body(c, x, j, g) { return j <= 1 || j === g.T - 1 ? (g.c2 || g.dk(c, .3)) : null; },
  front(g) { const y = g.c2 || g.dk(g.body, .3); g.t(0, 0, g.lt(y, .2)); if (g.wide) g.t(2, 0, g.lt(y, .2)); for (let j = 0; j < g.T; j++) g.t(1, j, j ? ZIP : g.lt(ZIP, .2)); g.t(-1, 2, ZIP); },
  back(g) { const y = g.c2 || g.dk(g.body, .3); for (let x = -1; x <= 1; x++) g.t(x, 0, g.lt(y, .2)); },
});

// Track jacket: contrast sleeves (c2), stand collar in c2, a full silver zip, contrast hem band.
regShape('outer', 'trackjacket', { sleeve: 9, arm: 'c2',
  body(c, x, j, g) { return j === g.T - 1 ? C2(g) : null; },
  front(g) { const s = C2(g); for (let x = g.x0 + 1; x <= g.x1; x++) g.t(x, 0, s); for (let j = 0; j < g.T; j++) g.t(1, j, j ? ZIP : g.WHITE); },
  back(g) { const s = C2(g); for (let x = g.x0 + 1; x <= g.x1; x++) g.t(x, 0, s); },
});

// Chore coat: worn open, contrast corduroy collar (c2), a chest pocket and two hip pockets.
regShape('outer', 'chore', { sleeve: 9, tail: 1,
  front(g) {
    const cl = g.c2 || g.dk(g.body, .3), pk = g.dk(g.body, .3); g.t(0, 0, cl); if (g.wide) g.t(2, 0, cl); g.t(-1, 0, g.dk(cl, .1));
    for (let j = 0; j < g.T; j++) g.t(1, j, j === g.T - 1 ? g.dk(g.inner, .1) : g.inner);
    g.t(-1, 1, pk); g.t(-1, 3, pk); g.t(0, 3, pk); if (g.wide) g.t(2, 3, pk);
  },
  back(g) { const cl = g.c2 || g.dk(g.body, .3); for (let x = -1; x <= 1; x++) g.t(x, 0, cl); },
});

// Moto / biker jacket: asymmetric diagonal zip, wide snapped lapel, belted hem with a silver buckle.
regShape('outer', 'moto', { sleeve: 9,
  front(g) {
    const bl = g.dk(g.body, .28); g.t(1, 0, g.inner); if (g.wide) g.t(2, 0, g.inner); g.t(0, 0, g.lt(g.body, .35)); g.t(0, 1, g.lt(g.body, .28)); g.t(-1, 1, ZIP);
    const zx = g.wide ? [2, 2, 1, 1] : [1, 1, 1, 1]; for (let j = 1; j < g.T - 1; j++) g.t(zx[j - 1], j, ZIP);
    g.row(g.T - 1, bl); g.t(g.x1, g.T - 1, ZIP); g.t(-1, 3, g.dk(ZIP, .2));
  },
  back(g) { for (let x = -1; x <= 1; x++) g.t(x, 0, g.lt(g.body, .3)); g.row(g.T - 1, g.dk(g.body, .28)); },
});

// Bolero / cropped jacket: ends under the chest so the top shows below; open front with a lapel.
regShape('outer', 'bolero', { sleeve: 9,
  body(c, x, j, g) { return j >= 3 ? g.inner : null; },
  front(g) { g.t(1, 0, g.inner); g.t(1, 1, g.inner); g.t(0, 0, g.lt(g.body, .3)); for (let x = g.x0 + 1; x <= 0; x++) g.t(x, 2, g.dk(g.body, .15)); if (g.wide) g.t(2, 2, g.dk(g.body, .15)); },
  back(g) { for (let x = -1; x <= 1; x++) g.t(x, 0, g.lt(g.body, .25)); for (let x = g.x0 + 1; x <= g.x1; x++) g.t(x, 2, g.dk(g.body, .15)); },
});

// Coach jacket: snap placket, small chest logo, drawcord hem; a big arched print across the back.
regShape('outer', 'coach', { sleeve: 9,
  front(g) {
    g.t(1, 0, g.inner); g.t(0, 0, g.lt(g.body, .25)); if (g.wide) g.t(2, 0, g.lt(g.body, .25));
    for (let j = 1; j < g.T; j++) g.t(1, j, j & 1 ? g.lt(g.body, .55) : g.dk(g.body, .18)); g.t(-1, 1, g.accent); g.t(0, 1, g.accent);
    g.row(g.T - 1, g.dk(g.body, .2)); g.t(1, g.T - 1, g.WHITE);
  },
  back(g) { const a = g.accent, t = C2(g, .55); g.t(-1, 2, a); g.t(0, 1, a); g.t(1, 2, a); g.t(0, 2, g.lt(a, .3)); for (let x = -1; x <= 1; x++) g.t(x, 3, t); g.row(g.T - 1, g.dk(g.body, .2)); },
});

// Ski jacket: two chest bands (c2 over accent) across the whole jacket, zipped to the collar.
regShape('outer', 'skijacket', { sleeve: 9, tail: 1,
  body(c, x, j, g) { return j === 2 ? C2(g) : j === 3 ? g.accent : null; },
  front(g) { for (let x = g.x0 + 1; x <= g.x1; x++) g.t(x, 0, g.lt(g.body, .22)); for (let j = 0; j < g.T; j++) g.t(1, j, j === 2 || j === 3 ? g.lt(ZIP, .1) : ZIP); },
  back(g) { for (let x = -1; x <= 1; x++) g.t(x, 0, g.lt(g.body, .22)); },
});

// Kimono jacket (same cut as the framework example 'kimono'). 'kimono' is also a DRESS shape (artist B), and torsoShape() looks dresses up before
// outerwear, so the catalogue sells the jacket under this collision-free id: crossed collar band (c2), accent sash, hem over the hips.
regShape('outer', 'kimonojacket', { sleeve: 9, tail: 2,
  front(g) { const band = g.c2 || g.lt(g.body, .45); g.t(1, 0, g.sk); g.t(0, 0, band); g.t(1, 1, band); if (g.wide) { g.t(2, 0, band); g.t(2, 2, band); } g.t(0, 1, g.inner); g.row(g.T - 2, g.accent); g.t(g.x0, g.T - 2, g.dk(g.accent, .15)); },
  back(g) { const band = g.c2 || g.lt(g.body, .45); for (let x = -1; x <= 1; x++) g.t(x, 0, band); g.row(g.T - 2, g.accent); g.t(0, g.T - 3, g.lt(g.accent, .25)); g.t(0, g.T - 1, g.dk(g.accent, .2)); } });
