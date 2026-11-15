// EXAMPLE bottom shapes (artist B owns wear_bottoms_*.js).
// Trousers / shorts: { leg?(i, n, c, k) -> colour of leg row i of n (0 = hip) or 'skin', px?(i, n, near, c, c2, k) -> [col1, col2] per-row detail,
//   wide?(i, n) -> true to add an outer pixel on that row (flares, wide legs) }.   Skirts: { skirt: rows, flare?, skirtPx? } as in wear_dress_ex.js.
import { regShape } from './_shapes.js';
import { dk, lt } from '../../engine/raster.js';

// Culottes: wide cropped legs ending mid-calf.
regShape('bottom', 'culottes', { leg: (i, n, c) => (i < n - 2 ? c : 'skin'), wide: (i, n) => i >= 1 && i < n - 2 });
// Harem pants: baggy through the leg, tight dark cuff at the ankle.
regShape('bottom', 'harem', { leg: (i, n, c) => (i === n - 1 ? dk(c, .32) : c), wide: (i, n) => i >= 1 && i < n - 1, px: (i, n, near, c, c2) => (i === 2 ? [c, lt(c2, .18)] : null) });
// Wrap skirt: knee length, a lighter overlapping edge running down the front.
regShape('bottom', 'wrapskirt', { skirt: 4, flare: 1, skirtPx: (c, x, j) => (x === 1 - (j >> 1) ? lt(c, .3) : null) });
