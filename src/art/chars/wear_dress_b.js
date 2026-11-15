// Artist B dress / one-piece shapes (catalogue: src/data/clothes_bottoms.js DRESSES).
// A dress is a torso shape plus a skirt (skirt rows: 1 = hips only .. 5 = to the shoe; 99 = as long as the legs allow), flare, skirtPx(c, x, j, n, k).
// One-pieces with trouser legs (jumpsuit, dungarees, boiler suit, tracksuit) are drawn as a full-length column with a dark centre seam, because the
// engine shows bare legs under any dress; see the artist B report for the hook that would let them colour the legs instead.
import { regShape } from './_shapes.js';
import { dk, lt } from '../../engine/raster.js';

const GOLD = '#e8c06a', PALE = '#f4f0e8', ZIP = '#c8ccd4';
const D = (id, def) => regShape('dress', id, def);
const edge = k => Math.max(2, k.x1);
/** split trouser legs: a dark seam down the middle from row 1, and a cuff on the hem row */
const legsPx = cuff => (c, x, j, n) => (x === 0 && j >= 1 ? dk(c, .42) : j === n - 1 && cuff ? cuff(c) : null);

/* ---------- one-pieces ---------- */
// Romper / playsuit: short sleeves, tie waist, shorts with a centre split.
D('romper', { sleeve: 2, skirt: 2, flare: 0, skirtPx: (c, x, j, n) => (x === 0 && j === n - 1 ? dk(c, .42) : j === n - 1 ? dk(c, .1) : null),
  front(g) { g.t(1, 0, g.sk); g.t(0, 0, g.sk); g.row(g.T - 1, g.dk(g.body, .22)); g.t(g.x0 + 1, g.T - 1, g.lt(g.body, .32)); },
  back(g) { g.t(0, 0, g.sk); g.row(g.T - 1, g.dk(g.body, .22)); } });
// Wide-leg jumpsuit: thin straps, belted waist with a gold buckle, palazzo legs.
D('jumpsuit', { sleeve: 0, skirt: 99, flare: 0, skirtPx: legsPx(),
  front(g) { for (let x = g.x0; x <= g.x1; x++) if (x !== g.x0 + 1 && x !== g.x1 - 1) g.t(x, 0, g.sk); g.row(g.T - 1, g.dk(g.body, .3)); g.t(1, g.T - 1, GOLD); },
  back(g) { for (let x = g.x0; x <= g.x1; x++) if (x !== g.x0 + 1 && x !== g.x1 - 1) g.t(x, 0, g.sk); g.t(0, 1, g.sk); g.row(g.T - 1, g.dk(g.body, .3)); } });
// Dungarees: shirt (inner colour) under a bib with straps and gold buttons, chest pocket, rolled cuffs.
D('dungarees', { sleeve: 2, arm: 'inner', skirt: 99, flare: 0, skirtPx: legsPx(c => lt(c, .3)),
  body(c, x, j, g) { return j < 2 && x !== -1 && x !== (g.wide ? 2 : 1) ? g.inner : null; },
  front(g) { g.t(1, 0, g.sk); g.t(0, 2, GOLD); if (g.wide) g.t(2, 2, GOLD); g.t(1, 3, g.lt(g.body, .25)); },
  back(g) { for (let x = -1; x <= 1; x += 2) { g.t(x, 0, g.dk(g.body, .08)); g.t(x, 1, g.dk(g.body, .08)); } g.t(0, 2, g.body); } });
// Boiler suit: long sleeves, pale collar, zip down the front, belt, chest pocket.
D('boilersuit', { sleeve: 9, skirt: 99, flare: 0, skirtPx: legsPx(c => dk(c, .2)),
  front(g) { g.t(0, 0, g.lt(g.body, .32)); if (g.wide) g.t(2, 0, g.lt(g.body, .32)); g.t(1, 0, g.sk); for (let j = 1; j < g.T; j++) g.t(1, j, ZIP); g.row(g.T - 1, g.dk(g.body, .3)); g.t(1, g.T - 1, ZIP); g.t(g.x0 + 1, 1, g.dk(g.body, .2)); },
  back(g) { for (let x = -1; x <= 1; x++) g.t(x, 0, g.lt(g.body, .32)); g.row(g.T - 1, g.dk(g.body, .3)); } });
// Tracksuit set: zip jacket and trousers in one colour, contrast side stripes all the way down.
D('tracksuit', { sleeve: 9, skirt: 99, flare: 0,
  body(c, x, j, g) { return x === g.x1 && j > 0 ? (g.c2 || PALE) : null; },
  skirtPx: (c, x, j, n, k) => (x === edge(k) || x === k.x0 ? (k.pat2 || PALE) : x === 0 && j >= 1 ? dk(c, .42) : null),
  front(g) { g.row(0, g.c2 || PALE); g.t(1, 0, g.sk); for (let j = 1; j < g.T; j++) g.t(1, j, ZIP); },
  back(g) { for (let x = -1; x <= 1; x++) g.t(x, 0, g.c2 || PALE); } });
// One-piece swimsuit: scoop neck, racer back, cut high on the hip (legs bare).
D('onepiece', { sleeve: 0, skirt: 1, flare: 0, skirtPx: (c, x, j, n, k) => (x === k.x0 || x === edge(k) ? k.skin : null),
  body(c, x, j, g) { return x === g.x1 && j > 0 ? (g.c2 || g.lt(c, .4)) : null; },
  front(g) { g.t(g.x0, 0, g.sk); g.t(g.x1, 0, g.sk); g.t(0, 0, g.sk); g.t(1, 0, g.sk); g.t(1, 1, g.sk); },
  back(g) { g.t(g.x0, 0, g.sk); g.t(g.x1, 0, g.sk); g.t(-1, 0, g.sk); g.t(0, 0, g.sk); g.t(1, 0, g.sk); g.t(0, 1, g.sk); g.t(0, 2, g.sk); } });

/* ---------- day dresses ---------- */
// Sheath: sleeveless, fitted straight to the knee, high square neck, two darts.
D('sheath', { sleeve: 0, skirt: 4, flare: 0, skirtPx: (c, x, j) => ((x === -1 || x === 1) && j > 0 && j < 3 ? dk(c, .1) : null),
  front(g) { g.t(1, 0, g.sk); g.t(0, 0, g.lt(g.body, .2)); g.row(g.T - 1, g.dk(g.body, .12)); },
  back(g) { g.row(g.T - 1, g.dk(g.body, .12)); for (let j = 0; j < g.T; j++) g.t(0, j, g.dk(g.body, .16)); } });
// Sixties shift: straight short dress, white Peter Pan collar, contrast hem band, three-quarter sleeves.
D('shift', { sleeve: 3, skirt: 3, flare: 0, skirtPx: (c, x, j, n, k) => (j === n - 1 ? (k.pat2 || PALE) : null),
  front(g) { g.t(0, 0, g.c2 || PALE); if (g.wide) g.t(2, 0, g.c2 || PALE); g.t(1, 0, g.sk); },
  back(g) { for (let x = -1; x <= 1; x++) g.t(x, 0, g.c2 || PALE); } });
// Kaftan: loose to the ankle, embroidered neckline in the accent colour, banded hem.
D('kaftan', { sleeve: 3, skirt: 99, flare: 1, skirtPx: (c, x, j, n, k) => (j === n - 1 ? ((x + 8) & 1 ? k.accent : (k.pat2 || lt(c, .35))) : null),
  front(g) { g.t(1, 0, g.sk); g.t(0, 0, g.accent); if (g.wide) g.t(2, 0, g.accent); g.t(1, 1, g.accent); g.t(1, 2, g.c2 || g.lt(g.body, .35)); },
  back(g) { for (let x = -1; x <= 1; x++) g.t(x, 0, g.accent); } });
// Prairie dress: off the shoulder ruffle, long tiered skirt ending in a wide ruffle.
D('prairie', { sleeve: 2, skirt: 99, flare: (j, n) => (j === 0 ? 0 : j === n - 1 ? 2 : 1), skirtPx: (c, x, j, n) => (j === n - 1 ? lt(c, .22) : j === 2 ? dk(c, .14) : null),
  front(g) { g.row(0, g.sk); g.row(1, g.lt(g.body, .3)); g.row(g.T - 1, g.dk(g.body, .14)); },
  back(g) { g.row(0, g.sk); g.row(1, g.lt(g.body, .3)); } });
// Halter dress: bare shoulders, strap round the neck, knee length.
D('halter', { sleeve: 0, skirt: 4, flare: 1,
  front(g) { for (let x = g.x0; x <= g.x1; x++) if (x !== 1) g.t(x, 0, g.sk); g.t(g.x0, 1, g.sk); g.t(1, 0, g.dk(g.body, .2)); g.row(g.T - 1, g.dk(g.body, .2)); },
  back(g) { g.row(0, g.sk); g.row(1, g.sk); g.t(0, 0, g.dk(g.body, .2)); g.t(-1, 2, g.sk); g.t(0, 2, g.sk); g.t(1, 2, g.sk); g.row(g.T - 1, g.dk(g.body, .2)); } });
// Babydoll: puff sleeves, ribbon under the bust, a short skirt swinging out from high up.
D('babydoll', { sleeve: 2, skirt: 3, flare: j => (j ? 2 : 1),
  body(c, x, j, g) { return j >= 3 ? g.lt(c, .1) : null; },
  front(g) { g.t(1, 0, g.sk); g.row(2, g.c2 || g.dk(g.body, .3)); g.t(1, 2, g.accent); },
  back(g) { g.row(2, g.c2 || g.dk(g.body, .3)); } });
// Tennis dress: sleeveless polo collar in white, pleated flippy skirt with a white hem.
D('tennisdress', { sleeve: 0, skirt: 2, flare: 1, skirtPx: (c, x, j, n, k) => (j === n - 1 ? (k.pat2 || PALE) : (x + 8) & 1 ? dk(c, .14) : null),
  front(g) { g.t(0, 0, g.c2 || PALE); if (g.wide) g.t(2, 0, g.c2 || PALE); g.t(1, 0, g.sk); g.t(1, 1, g.c2 || PALE); g.t(g.x0, 0, g.sk); g.t(g.x1, 0, g.sk); },
  back(g) { for (let x = -1; x <= 1; x++) g.t(x, 0, g.c2 || PALE); g.t(g.x0, 0, g.sk); g.t(g.x1, 0, g.sk); } });
// Pleated midi: three-quarter sleeves, thin belt, long knife pleats.
D('pleatmidi', { sleeve: 3, skirt: 5, flare: 1, skirtPx: (c, x, j) => ((x + 8) & 1 ? dk(c, .18) : lt(c, .06)),
  front(g) { g.t(1, 0, g.sk); g.t(0, 0, g.sk); g.row(g.T - 1, g.c2 || g.dk(g.body, .35)); },
  back(g) { g.t(0, 0, g.sk); g.row(g.T - 1, g.c2 || g.dk(g.body, .35)); } });
// Kimono robe dress: crossed collar in the second colour, wide obi sash in the accent, wrap edge down the skirt.
D('kimono', { sleeve: 9, skirt: 99, flare: 0, skirtPx: (c, x, j, n, k) => (x === 1 ? (k.pat2 || PALE) : null),
  front(g) { const e = g.c2 || PALE; g.t(0, 0, e); g.t(1, 0, g.sk); g.t(1, 1, e); if (g.wide) g.t(2, 2, e); g.row(g.T - 2, g.accent); g.row(g.T - 1, g.accent); g.t(1, g.T - 2, g.dk(g.accent, .3)); },
  back(g) { for (let x = -1; x <= 1; x++) g.t(x, 0, g.c2 || PALE); g.row(g.T - 2, g.accent); g.row(g.T - 1, g.accent); g.t(0, g.T - 2, g.lt(g.accent, .3)); g.t(0, g.T - 3, g.lt(g.accent, .3)); } });

/* ---------- evening ---------- */
// Cocktail dress: strapless sweetheart neckline, ribbon waist, short full skirt.
D('cocktail', { sleeve: 0, skirt: 3, flare: j => (j === 0 ? 0 : j === 1 ? 1 : 2),
  front(g) { g.t(g.x0, 0, g.sk); g.t(1, 0, g.sk); g.t(g.x1, 0, g.sk); g.row(g.T - 1, g.accent); g.t(1, g.T - 1, g.lt(g.accent, .35)); },
  back(g) { g.row(0, g.sk); g.row(g.T - 1, g.accent); } });
// Bodycon: long sleeves, bandage bands all over, very short and tight.
D('bodycon', { sleeve: 9, skirt: 2, flare: 0, body: (c, x, j) => (j & 1 ? dk(c, .14) : null), skirtPx: (c, x, j) => (j & 1 ? null : dk(c, .14)),
  front(g) { g.t(0, 0, g.sk); g.t(1, 0, g.sk); },
  back(g) { g.t(0, 0, g.sk); } });
// Blazer dress: lapels, double row of gold buttons, short straight skirt.
D('blazerdress', { sleeve: 9, skirt: 2, flare: 0,
  front(g) { g.t(1, 0, g.sk); g.t(1, 1, g.sk); g.t(0, 0, g.lt(g.body, .25)); if (g.wide) g.t(2, 0, g.lt(g.body, .25)); g.t(0, 1, g.lt(g.body, .25)); for (let j = 2; j < g.T; j++) g.t(1, j, g.dk(g.body, .22)); g.t(0, 3, GOLD); g.t(0, 5 % g.T, GOLD); if (g.wide) { g.t(2, 3, GOLD); g.t(2, 5 % g.T, GOLD); } },
  back(g) { for (let x = -1; x <= 1; x++) g.t(x, 0, g.lt(g.body, .22)); g.t(0, g.T - 1, g.dk(g.body, .2)); } });
// Mermaid gown: one shoulder, fitted to the knee then a fishtail at the floor.
D('mermaid', { sleeve: 0, skirt: 99, flare: (j, n) => (j >= n - 1 ? 2 : j >= n - 2 ? 1 : 0), skirtPx: (c, x, j, n) => (j === n - 2 ? lt(c, .2) : j === n - 1 ? lt(c, .1) : null),
  front(g) { for (let x = g.x0; x <= 0; x++) g.t(x, 0, g.sk); g.t(g.x0, 1, g.sk); g.t(1, 1, g.lt(g.body, .2)); },
  back(g) { for (let x = 0; x <= g.x1; x++) g.t(x, 0, g.sk); g.t(g.x1, 1, g.sk); } });
