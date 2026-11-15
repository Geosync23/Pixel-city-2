// Shared palette + helpers for the Maple Bay Post art (post.js, post_ext.js). Not an asset module.
import * as R from '../../engine/raster.js';
import { S2, dot, BRASS, BRASS_D, BRASS_L, LINEN, INK, PAPER, OAK, OAK_D } from './_ch_lib.js';
export * from './_ch_lib.js';
const { qy, lw, dk, lt, px, C, ellipse } = R;
export const PBLUE = '#2756a8', PBLUE_D = '#1a3a78', PBLUE_L = '#4a7ad0', PRED = '#d2392f', PYEL = '#f2c230', CANVAS = '#c9b78e', CANVAS_D = '#a8956c', KRAFT = '#b98a52', KRAFT_D = '#94683a', PINK = '#f6b8c4';
/** the post horn (screen-space, centre px): a looped horn with a bell to the right */
export const horn = (X, Y, c = PYEL, s = 1) => { const cc = C(c), P = (x, y) => px(X + x * s, Y + y * s, cc);
  for (const [x, y] of [[-3, -1], [-2, -2], [-1, -2], [0, -2], [1, -1], [1, 0], [0, 1], [-1, 1], [-2, 1], [-3, 0], [2, -1], [3, -2], [4, -3], [4, -2], [4, -1], [4, 0], [4, 1], [3, 0], [2, 0], [-4, 0], [-5, 0]]) P(x, y); };
/** horn at a world point on a +y plane */
export const hornAt = (x, y, z, c, s) => { const q = S2(x, y, z); horn(q[0], q[1], c, s); };
/** a little envelope on a +y plane */
export const envelope = (x, y, z, w = .3, h = .2, c = LINEN) => { qy(x, x + w, y, z, z + h, c); lw([x, y, z + h], [x + w / 2, y, z + h / 2], dk(c, .3)); lw([x + w, y, z + h], [x + w / 2, y, z + h / 2], dk(c, .3)); const q = S2(x + w - .05, y, z + h - .04); px(q[0], q[1], C(PRED)); };
/** brown paper parcel box with string */
export const parcel = (x, y, z, w = .5, d = .4, h = .35, c = KRAFT) => { R.box(x, y, z, w, d, h, c); lw([x + w / 2, y + d, z], [x + w / 2, y + d, z + h], LINEN); lw([x + w / 2, y, z + h], [x + w / 2, y + d, z + h], LINEN); lw([x, y + d / 2, z + h], [x + w, y + d / 2, z + h], LINEN); lw([x + w, y + d / 2, z], [x + w, y + d / 2, z + h], dk(LINEN, .2)); };
/** round wall clock face on a +y plane: centre x, z; r in units */
export const clockY = (x, y, z, r, h = 10, m = 10, rim = BRASS) => { const q = S2(x, y, z), rp = Math.round(r * R.U); for (let j = -rp; j <= rp; j++) for (let i = -rp; i <= rp; i++) { const d = i * i + j * j; if (d <= rp * rp) px(q[0] + i, q[1] + j + (i >> 1), C(d > (rp - 2) * (rp - 2) ? rim : '#fff8e0')); }
  const hand = (a, l, c) => { for (let k = 0; k <= l; k++) { const i = Math.round(Math.sin(a) * k), j = Math.round(-Math.cos(a) * k); px(q[0] + i, q[1] + j + (i >> 1), C(c)); } }; hand((h % 12 + m / 60) / 12 * 6.283, rp * .5, INK); hand(m / 60 * 6.283, rp * .78, '#4a4458'); };
export { S2, dot, BRASS, BRASS_D, BRASS_L, LINEN, INK, PAPER, OAK, OAK_D, ellipse };
