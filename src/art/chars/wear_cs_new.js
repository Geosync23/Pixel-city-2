// Shapes of the NEW pieces made for the clothing stores' signature looks (owner msg 178; catalogue rows: src/data/clothing_new.js).
// Same API as every wear_*.js file (docs/reports/clothes_drawing.md): the engine bends, mirrors, shades and outlines; a shape only describes the garment.
import { regShape } from './_shapes.js';
import { dk, lt } from '../../engine/raster.js';

const GOLD = '#e8c06a', PALE = '#f4f0e8';
const P = (g, x, r, c) => g.p(g.cx + x, g.yb - r, c);   // hats: row 5 = brow, 6 = top of the skull

/* ---------------- tops ---------------- */
// Wing-collar dress shirt: two white collar points, a puffed cravat in the accent colour, studs down a pleated front.
regShape('top', 'wingcollar', { sleeve: 9,
  front(g) { const a = g.accent; g.t(0, 0, g.lt(g.body, .4)); if (g.wide) g.t(2, 0, g.lt(g.body, .4)); g.t(1, 0, a); g.t(1, 1, a); g.t(0, 1, g.dk(a, .18)); g.t(1, 2, g.dk(a, .25)); for (let j = 3; j < g.T; j++) g.t(1, j, g.dk(g.body, .1)); g.t(1, 4, GOLD); },
  back(g) { g.row(0, g.lt(g.body, .4)); g.t(0, 0, g.dk(g.accent, .1)); } });
// Yoke jumper: a patterned ring round the shoulders (c2 + accent), ribbed hem.
regShape('top', 'yokeknit', { sleeve: 9,
  body(c, x, j, g) { const c2 = g.c2 || g.lt(c, .5); return j === 0 ? c2 : j === 1 ? (((x + 8) & 1) ? g.accent : c2) : j === 2 && ((x + 8) & 1) === 0 ? c2 : null; },
  front(g) { g.row(g.T - 1, g.dk(g.body, .22)); g.t(1, 0, g.dk(g.c2 || g.body, .15)); },
  back(g) { g.row(g.T - 1, g.dk(g.body, .22)); } });
// Camp shirt with a big flower print: open collar, flowers in c2 with accent leaves.
const ALOHA = ['.f..l', 'f.f..', '.l..f', '..f.l', 'f..f.', '.f...'];
regShape('top', 'aloha', { sleeve: 2,
  body(c, x, j, g) { const ch = ALOHA[j % 6][(x + 8) % 5]; return ch === 'f' ? (g.c2 || PALE) : ch === 'l' ? g.accent : null; },
  front(g) { g.t(1, 0, g.sk); g.t(1, 1, g.sk); g.t(0, 0, g.lt(g.body, .32)); if (g.wide) g.t(2, 0, g.lt(g.body, .32)); g.t(1, 3, g.dk(g.body, .3)); },
  back(g) { for (let x = -1; x <= 1; x++) g.t(x, 0, g.lt(g.body, .32)); } });
// Guernsey: a fisherman's jumper, ribbed across the shoulders, ribs running down the body, rolled neck.
regShape('top', 'guernsey', { sleeve: 9,
  body(c, x, j, g) { return j === 1 ? g.dk(c, .2) : j > 1 && ((x + 8) & 1) ? g.dk(c, .1) : null; },
  front(g) { g.row(0, g.lt(g.body, .22)); g.t(1, 0, g.lt(g.body, .38)); g.t(g.x1, g.T - 1, g.dk(g.body, .32)); },
  back(g) { g.row(0, g.lt(g.body, .22)); g.t(g.x0 + 1, g.T - 1, g.dk(g.body, .32)); } });
// Rowing zephyr: a chevron in c2 across the chest with a thin accent line under it, bound neck.
regShape('top', 'chevrontop', { sleeve: 2,
  body(c, x, j, g) { const m = g.front ? 1 : 0, d = Math.abs(x - m); return j === 3 - d ? (g.c2 || '#d2392f') : j === 4 - d ? g.accent : null; },
  front(g) { g.t(1, 0, g.sk); g.t(0, 0, g.c2 || '#d2392f'); if (g.wide) g.t(2, 0, g.c2 || '#d2392f'); },
  back(g) { for (let x = -1; x <= 1; x++) g.t(x, 0, g.c2 || '#d2392f'); } });

/* ---------------- outerwear (worn open: g.inner is the layer underneath) ---------------- */
// Morning coat: long skirts behind, a deep V showing the waistcoat, lapels, a watch chain.
regShape('outer', 'morningcoat', { sleeve: 9, tail: 3,
  front(g) { const lp = g.lt(g.body, .28); g.t(1, 0, g.inner); g.t(1, 1, g.inner); g.t(0, 1, g.inner); g.t(1, 2, g.inner); g.t(1, 3, g.inner); g.t(0, 0, lp); g.t(0, 2, lp); if (g.wide) { g.t(2, 0, lp); g.t(2, 1, lp); g.t(2, 2, g.dk(lp, .1)); } g.t(0, 3, GOLD); g.t(1, 4, g.dk(g.body, .4)); },
  back(g) { for (let j = 2; j < g.T; j++) g.t(0, j, g.dk(g.body, .24)); g.t(-1, g.T - 2, g.dk(g.body, .42)); g.t(1, g.T - 2, g.dk(g.body, .42)); for (let x = -1; x <= 1; x++) g.t(x, 0, g.lt(g.body, .2)); } });
// Capelet: covers the shoulders only, the dress shows below; sparkling hem, a clasp at the throat.
regShape('outer', 'capelet', { sleeve: 9, arm: 'inner',
  body(c, x, j, g) { return j >= 3 ? g.inner : j === 2 ? (((x + 8) & 1) ? (g.c2 || g.lt(c, .5)) : g.dk(c, .12)) : null; },
  front(g) { g.t(1, 0, GOLD); g.t(1, 1, g.dk(g.body, .2)); },
  back(g) { for (let x = -1; x <= 1; x++) g.t(x, 0, g.lt(g.body, .22)); } });
// Shawl-collar cardigan: a broad rolled collar, open front, toggles in c2, hangs over the hips.
regShape('outer', 'shawlcardi', { sleeve: 9, tail: 2,
  front(g) { const sc = g.lt(g.body, .3), tg = g.c2 || '#6a4428'; for (let j = 0; j < g.T; j++) g.t(1, j, g.inner); for (let j = 0; j < 3; j++) g.t(0, j, sc); if (g.wide) { g.t(2, 0, sc); g.t(2, 1, sc); g.t(2, 2, g.dk(sc, .1)); } g.t(0, 3, tg); g.t(0, 5, tg); g.t(g.x0 + 1, g.T - 1, g.dk(g.body, .22)); },
  back(g) { for (let x = -1; x <= 1; x++) { g.t(x, 0, g.lt(g.body, .3)); g.t(x, 1, g.lt(g.body, .16)); } g.row(g.T - 1, g.dk(g.body, .16)); } });
// Oilskin long coat: buttoned to the throat, collar up, a reflective band (c2) round the body, the hood lying on the back.
regShape('outer', 'oilskin', { sleeve: 9, tail: 4,
  body(c, x, j, g) { return j === g.T - 2 ? (g.c2 || '#dfe6ea') : null; },
  front(g) { g.row(0, g.dk(g.body, .2)); g.t(1, 0, g.dk(g.body, .34)); g.t(1, 1, g.dk(g.body, .34)); g.t(1, 2, GOLD); g.t(1, 3, g.dk(g.body, .34)); g.t(1, 5, GOLD); },
  back(g) { for (let x = -1; x <= 1; x++) { g.t(x, 0, g.dk(g.body, .2)); g.t(x, 1, g.dk(g.body, .1)); } g.t(0, 2, g.dk(g.body, .2)); } });
// Splash jacket: a shell with a contrast yoke (c2), high collar, a zip down the front.
regShape('outer', 'splashjacket', { sleeve: 9,
  body(c, x, j, g) { return j < 2 ? (g.c2 || g.dk(c, .5)) : null; },
  front(g) { const z = '#c8ccd4'; g.row(0, g.lt(g.c2 || g.body, .2)); for (let j = 1; j < g.T; j++) g.t(1, j, z); g.row(g.T - 1, g.dk(g.body, .25)); g.t(1, g.T - 1, z); g.t(-1, 3, g.accent); },
  back(g) { g.row(0, g.lt(g.c2 || g.body, .2)); g.row(g.T - 1, g.dk(g.body, .25)); g.t(0, 3, g.accent); g.t(1, 3, g.accent); } });

/* ---------------- dresses ---------------- */
// Flapper dress: thin straps, a dropped waist band in c2, tiers of fringe.
regShape('dress', 'fringe', { sleeve: 0, skirt: 4, flare: 0,
  body(c, x, j, g) { return j === 0 && (x < 0 || x > 1) ? g.sk : null; },
  skirtPx(c, x, j) { return j % 2 === 1 ? (((x + 8) & 1) ? lt(c, .34) : dk(c, .3)) : null; },
  front(g) { g.row(g.T - 1, g.c2 || GOLD); g.t(1, 1, g.lt(g.body, .3)); g.t(0, 2, g.c2 || GOLD); },
  back(g) { g.row(g.T - 1, g.c2 || GOLD); } });
// Patchwork pinafore: a bib and skirt of squares in three colours over a blouse (inner).
const patch = (x, j, a, b, c, o) => [a, b, c][(((x + 8) >> 1) + (j >> 1) + (o || 0)) % 3];
regShape('dress', 'patchwork', { sleeve: 2, arm: 'inner', skirt: 4, flare: 1,
  body(c, x, j, g) { if (j < 2 && (x === g.x0 || x === g.x1)) return g.inner; return patch(x, j, c, g.c2 || lt(c, .5), g.accent); },
  skirtPx(c, x, j, n, k) { return patch(x, j, c, k.pat2 || lt(c, .5), k.accent, 1); },
  front(g) { g.t(1, 0, g.inner); g.t(g.x0 + 1, 0, g.dk(g.body, .3)); g.t(g.x1 - (g.wide ? 0 : 0), 0, g.wide ? g.dk(g.body, .3) : g.inner); },
  back(g) { g.t(0, 0, g.inner); g.t(0, 1, g.inner); } });

/* ---------------- bottoms ---------------- */
// Morning trousers: bold two-tone stripes down each leg.
regShape('bottom', 'morningstripe', { leg: (i, n, c) => c, px: (i, n, near, c, c2) => [c2 || dk(c, .5), lt(c, .12)] });
// Breaker shorts: knee-short, a dark drawstring waist, a zigzag wave in c2 above the hem.
regShape('bottom', 'waveshorts', { leg: (i, n, c) => (i < Math.min(3, n - 1) ? c : 'skin'),
  px: (i, n, near, c, c2, k) => { const b = k.bot2 || PALE, h = Math.min(3, n - 1); return i >= h ? null : i === 0 ? [dk(c, .28), dk(c, .12)] : i === h - 1 ? [b, c] : [c, b]; } });

/* ---------------- shoes: a little grid at the foot (columns x-1 .. x+3; the last row is the sole row) ---------------- */
const FIX = { D: '#2e2a34', g: '#e8c06a', r: '#b47a4a', f: '#f0e6d0' };
function col(g, ch) {
  switch (ch) { case 'c': return g.c; case 'h': return g.hi; case 's': return g.sole; case 'w': return g.white; case 'k': return g.sk; case 'd': return g.dk(g.c, .3); case 'l': return g.lt(g.c, .25); case '2': return g.c2 || g.hi; }
  const f = FIX[ch]; return f ? (g.near ? f : g.dk(f, .16)) : null;
}
const shoe = (id, rows, art) => regShape('shoes', id, { rows, draw(g) { const top = -(art.length - 1); art.forEach((s, ri) => { const r = top + ri; if (r < -g.n) return; for (let ci = 0; ci < s.length; ci++) { const c = s[ci] === '.' ? null : col(g, s[ci]); if (c) g.p(g.x - 1 + ci, g.fy + r, c); } }); } });
shoe('spectator', 0, ['.2c2.', '.sc2.']);          // two-tone brogue: dark heel and toe cap (c2) on a pale shoe
shoe('tstrap', 0, ['.gg..', '.ckc.', '.D.cc']);    // dance heel: gold ankle strap, open instep, a little heel
shoe('sheepboot', 0, ['.ff..', '.clc.', '.rrr.']); // short sheepskin boot: fleece cuff, gum sole
shoe('deckboot', 1, ['.c2..', '.cc..', '.cch.', '.www.']); // rubber deck boot: pull loop (c2), white sole
shoe('racer', 0, ['.cc2.', '.2wwc']);              // flat racing shoe: heel tab and flash in c2, thin white sole

/* ---------------- hats ---------------- */
// Homburg: a stiff felt hat, dented crown, ribbon band, the brim curled up at both sides.
regShape('hat', 'homburg', { draw(g) { const c = g.c, b = g.band || g.dk(c, .5); g.R(-2, 1, 10, c); P(g, 0, 10, g.dk(c, .25)); P(g, -2, 10, g.lt(c, .25)); g.R(-3, 2, 9, c); g.R(-3, 3, 8, c); P(g, -3, 8, g.dk(c, .14)); P(g, -3, 9, g.dk(c, .14)); g.R(-3, 3, 7, b); g.R(-3, 3, 6, c); g.R(-4, g.front ? 4 : 3, 5, g.dk(c, .14)); P(g, -4, 6, g.lt(c, .2)); P(g, g.front ? 4 : 3, 6, g.lt(c, .2)); } });
// Feathered headband: a jewelled band over the hair, a tall feather at the side.
regShape('hat', 'featherband', { cut: false, draw(g) { const c = g.c, f = g.band || '#2f9a94'; g.R(-3, 3, 6, c); for (let x = -3; x <= 3; x += 2) P(g, x, 6, g.lt(c, .45)); P(g, -3, 7, g.dk(f, .2)); P(g, -3, 8, f); P(g, -4, 8, g.dk(f, .1)); P(g, -4, 9, g.lt(f, .3)); P(g, -2, 7, '#e8546a'); } });
// Striped bobble hat: cuff, two stripes, a big pom on top.
regShape('hat', 'stripepom', { draw(g) { const c = g.c, b = g.band || PALE; g.R(-3, 3, 5, b); P(g, -3, 5, g.dk(b, .15)); g.R(-3, 3, 6, c); g.R(-3, 3, 7, b); g.R(-2, 2, 8, c); P(g, -3, 6, g.dk(c, .15)); P(g, -3, 7, g.dk(b, .15)); g.R(-1, 0, 9, b); g.R(-1, 0, 10, g.lt(b, .3)); P(g, -2, 9, g.dk(b, .12)); P(g, 1, 9, b); } });
// Kerchief: a printed triangle over the hair, tied behind the head.
regShape('hat', 'kerchief', { draw(g) { const c = g.c, b = g.band || PALE, f = (x, r) => (((x + 8) + r) % 3 === 0 ? b : c); for (let x = -2; x <= 2; x++) P(g, x, 7, f(x, 7)); for (let x = -3; x <= 3; x++) P(g, x, 6, f(x, 6)); for (let x = -3; x <= (g.front ? 1 : 3); x++) P(g, x, 5, f(x, 5)); P(g, -4, 5, g.dk(c, .15)); P(g, -4, 4, c); P(g, -5, 4, g.dk(c, .2)); P(g, -5, 3, b); } });

/* ---------------- bags (carried) ---------------- */
// String beach bag: an open net with bright things inside.
regShape('bag', 'netbag', { hand(g) { const c = g.c, a = g.accent || '#f07a5a'; g.p(g.x, g.y + 1, g.dk(c, .35)); for (let j = 0; j < 4; j++) for (let i = -1; i <= 1; i++) g.p(g.x + i, g.y + 2 + j, ((i + j) & 1) ? c : j < 2 ? a : g.lt(a, .45)); g.p(g.x - 1, g.y + 5, g.dk(c, .2)); } });
// Knot bundle: a square of cloth knotted at the top, two little ears.
regShape('bag', 'bundle', { hand(g) { const c = g.c, a = g.accent || PALE; g.p(g.x - 1, g.y + 1, g.lt(c, .25)); g.p(g.x + 1, g.y + 1, g.lt(c, .25)); g.p(g.x, g.y + 2, g.dk(c, .3)); for (let j = 0; j < 3; j++) for (let i = -1; i <= 1; i++) g.p(g.x + i, g.y + 3 + j, (i + j) % 2 === 0 && j < 2 ? a : i === -1 ? g.dk(c, .15) : c); } });
