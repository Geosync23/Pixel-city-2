// Artist B bottom shapes (catalogue: src/data/clothes_bottoms.js BOTTOMS).
// Trousers: leg(i, n, c, k) colour of leg row i of n (0 = hip; n is ~4 near leg / 3 far leg standing, 6 seated and lying), px(i, n, near, c, c2, k) -> [col x, col x+1],
// wide(i, n) -> extra outer pixel.  Skirts: { skirt: rows (5 = to the shoe), flare: px per side or (j, n) => px, skirtPx(c, x, j, n, k) }.
import { regShape } from './_shapes.js';
import { dk, lt, mix } from '../../engine/raster.js';

const GOLD = '#e8c06a', SKIN = k => k.tights || k.skin, PALE = '#f4f0e8';
const R = (regShape.bind(null, 'bottom'));

/* ---------- trousers ---------- */
// Carpenter pants: darker double-knee panel, a light hammer loop on the near leg.
R('carpenter', { leg: (i, n, c) => (n > 2 && i === (n >> 1) ? dk(c, .24) : c), px: (i, n, near, c, c2) => (near && i === 1 ? [c, lt(c, .32)] : null) });
// Paperbag waist: gathered frill sticking out at the waist, tie, cropped at the ankle.
R('paperbag', { leg: (i, n, c) => (i === 0 ? lt(c, .2) : n > 2 && i === n - 1 ? 'skin' : c), wide: i => i === 0, px: (i, n, near, c, c2) => (i === 0 ? [c, dk(c, .3)] : null) });
// Corduroy: two-tone ribs down the leg, a slight boot-cut kick at the hem.
R('cords', { leg: (i, n, c) => (n > 2 && i === n - 1 ? dk(c, .14) : c), px: (i, n, near, c, c2) => [dk(c, .12), lt(c2, .14)], wide: (i, n) => n > 2 && i === n - 1 });
// Sailor trousers: high waistband with two gold buttons, wide from the thigh down.
R('sailor', { leg: (i, n, c) => (i === 0 ? lt(c, .14) : c), wide: i => i >= 1, px: (i, n, near, c, c2) => (i === 0 ? [GOLD, c2] : null) });
// Leather trousers: glossy highlight running down one side, dark knee seam.
R('leather', { leg: (i, n, c) => (n > 2 && i === (n >> 1) ? dk(c, .2) : c), px: (i, n, near, c, c2) => (n > 2 && i === (n >> 1) ? null : i < n - 1 ? [c, lt(c, .42)] : null) });
// Snow pants: puffy (wide all the way), quilted bands, dark elastic cuff.
R('snowpants', { leg: (i, n, c) => (n > 2 && i === n - 1 ? dk(c, .36) : i & 1 ? dk(c, .1) : c), wide: (i, n) => i < n - 1 });

/* ---------- shorts ---------- */
// Cargo shorts: to the knee, wide, light pocket flap on the thigh.
R('cargoshorts', { leg: (i, n, c) => (i < Math.min(3, n - 1) ? c : 'skin'), wide: i => i >= 1 && i < 3, px: (i, n, near, c, c2) => (i === 1 ? [lt(c, .26), c2] : null) });
// Board shorts: two-tone colour-block legs, dark waistband with a light drawstring.
R('boardshorts', { leg: (i, n, c) => (i < Math.min(3, n - 1) ? (i === 0 ? dk(c, .2) : c) : 'skin'), px: (i, n, near, c, c2, k) => (i === 0 ? [dk(c, .2), PALE] : i < Math.min(3, n - 1) ? [c, k.bot2 || lt(c, .45)] : null) });
// Cut-offs: denim shorts with a frayed pale hem, uneven against the thigh.
R('cutoffs', { leg: (i, n, c) => (i < 2 ? c : i === 2 && n > 3 ? lt(c, .42) : 'skin'), px: (i, n, near, c, c2, k) => (i === 2 && n > 3 ? [lt(c, .42), SKIN(k)] : null) });
// Running shorts: very short, contrast trim, split hem.
R('runshorts', { leg: (i, n, c, k) => (i === 0 ? c : i === 1 ? (k.bot2 || PALE) : 'skin'), px: (i, n, near, c, c2, k) => (i === 1 ? [k.bot2 || PALE, SKIN(k)] : null) });

/* ---------- skirts ---------- */
// Tennis skirt: short pleated flip with a contrast hem band.
R('tennisskirt', { skirt: 2, flare: 1, skirtPx: (c, x, j, n, k) => (j === n - 1 ? (k.bot2 || PALE) : (x + 8) & 1 ? dk(c, .14) : null) });
// Slit maxi: straight column to the ankle with a high slit showing the leg.
R('slitskirt', { skirt: 99, flare: 0, skirtPx: (c, x, j, n, k) => (x === Math.max(2, k.x1) && j > 1 ? SKIN(k) : null) });
// Denim mini: straight, button placket down the middle, frayed hem.
R('denimskirt', { skirt: 2, flare: 0, skirtPx: (c, x, j, n) => (j === n - 1 ? lt(c, .34) : x === 0 ? lt(c, .22) : x === -1 ? dk(c, .12) : null) });
// A-line: dark waistband, widening steadily to the knee.
R('aline', { skirt: 4, flare: j => (j === 0 ? 0 : j < 2 ? 1 : 2), skirtPx: (c, x, j) => (j === 0 ? dk(c, .2) : null) });
// Skater skirt: short and very full, soft folds.
R('skater', { skirt: 2, flare: j => (j ? 2 : 0), skirtPx: (c, x, j) => (j === 0 ? dk(c, .16) : (x + 8) % 3 === 0 ? lt(c, .2) : null) });
// Tutu: layered net (checker of light and base), stands out wide.
R('tutu', { skirt: 3, flare: j => (j === 0 ? 1 : 2), skirtPx: (c, x, j) => (j === 0 ? lt(c, .3) : (x + j) & 1 ? lt(c, .32) : null) });
// Kilt: knee length, flat apron edge with fringe on one side and a gold pin.
R('kilt', { skirt: 4, flare: 0, skirtPx: (c, x, j, n, k) => { const e = Math.max(2, k.x1); return x === e ? (j === n - 1 ? lt(c, .4) : lt(c, .2)) : x === e - 1 && j === 2 ? GOLD : null; } });
// Bubble skirt: balloons out then tucks in at the hem.
R('bubble', { skirt: 3, flare: (j, n) => (j === 0 || j === n - 1 ? 0 : 2), skirtPx: (c, x, j, n) => (j === n - 1 ? dk(c, .22) : j === 1 ? lt(c, .18) : null) });
// Trumpet (mermaid) skirt: fitted to the knee, then a flared hem.
R('trumpet', { skirt: 99, flare: (j, n) => (j >= n - 1 ? 2 : j >= n - 2 ? 1 : 0), skirtPx: (c, x, j, n) => (j === n - 2 ? lt(c, .18) : null) });
