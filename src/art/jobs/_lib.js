// Shared helpers for the job rooms' art (src/art/jobs/*). Not an asset module.
import { box, qy, qx, qz, lw, fq, lit, glow, cyl, spx, dk, lt, hash2, textY, textW } from '../../engine/raster.js';
import { F, K, bx, tube, post, posts, frameY, frameX, frameZ, table, chair, stool, sofa, counter, till, monitor, plant, carton, goods, shelf, bottle, cup, plate, lamp, rug, steam, mirrorY, screenY, screenLines, keyboard, PX } from '../venue/_lib.js';

export { F, K, bx, tube, post, posts, frameY, frameX, frameZ, table, chair, stool, sofa, counter, till, monitor, plant, carton, goods, shelf, bottle, cup, plate, lamp, rug, steam, mirrorY, screenY, screenLines, keyboard, PX };
export const TAU = 6.2832, INK = '#2a2733', BRASS = '#d8a848', CHROME = '#d5dbe0', PAPER = '#f4f0e8', CREAM = '#f4e9cf';
/** asset shorthand for this folder: J('fire.engine', tags, size, draw, extras) -> furn.job.fire.engine */
export const J = (id, tags, size, draw, x) => F('job.' + id, ['job'].concat(tags), size, draw, x);
/** filled disc on a y-plane (wheels, hose rolls, clocks, records) */
export const discY = (cx, y, cz, r, c, n = 14) => fq(Array.from({ length: n }, (_, i) => [cx + Math.cos(i / n * TAU) * r, y, cz + Math.sin(i / n * TAU) * r]), c);
/** ring outline on a y-plane */
export const ringY = (cx, y, cz, r, c, n = 14) => { for (let i = 0; i < n; i++) lw([cx + Math.cos(i / n * TAU) * r, y, cz + Math.sin(i / n * TAU) * r], [cx + Math.cos((i + 1) / n * TAU) * r, y, cz + Math.sin((i + 1) / n * TAU) * r], c); };
/** tiny screen-aligned sprite; bottom-left at the world anchor. rows of chars -> palette */
export const pix = (x, y, z, rows, pal) => { for (let j = 0; j < rows.length; j++) for (let i = 0; i < rows[j].length; i++) { const c = pal[rows[j][i]]; if (c) spx(x, y, z, i, j - rows.length, c); } };
/** centred 3x5 text on a y-plane between x0 and x1 */
export const label = (t, x0, x1, y, z, c) => textY(t, x0 + Math.max(0, ((x1 - x0) * 16 - textW(t)) / 32), y, z, c);
/** a sheet of paper pinned to a y-plane: body, a headline bar and a few lines */
export function sheet(x, y, z, w, h, o) {
  o = o || {}; const c = o.c || PAPER;
  qy(x, x + w, y, z, z + h, c); frameY(x, x + w, y, z, z + h, dk(c, .3));
  if (o.head) qy(x + .03, x + w - .03, y, z + h - .1, z + h - .04, o.head);
  if (o.pic) qy(x + .03, x + w * .5, y, z + h * .35, z + h - .14, o.pic, dk(o.pic, .2));
  for (let zz = z + h - (o.head ? .16 : .08), i = 0; zz > z + .04; zz -= .07, i++) { const k = hash2(i, o.seed || 1, 3), a = o.pic && zz > z + h * .35 ? x + w * .55 : x + .03; lw([a, y, zz], [a + (x + w - .03 - a) * (.5 + k * .5), y, zz], o.ink || '#8a8698'); }
  if (o.pin) spx(x + w / 2, y, z + h - .02, 0, 0, o.pin);
}
/** a framed chalk / cork board body on a y-plane */
export function board(x0, x1, y, z0, z1, c, fr) { qy(x0 - .05, x1 + .05, y - .01, z0 - .05, z1 + .05, fr || '#8a5a3a'); qy(x0, x1, y, z0, z1, c); frameY(x0, x1, y, z0, z1, dk(c, .35)); }
/** a small round wall clock on a y-plane */
export function clockY(cx, y, cz, r, o) {
  o = o || {}; discY(cx, y, cz, r + .03, o.rim || INK); discY(cx, y + .01, cz, r, o.face || PAPER);
  lw([cx, y + .02, cz], [cx + r * .55 * Math.cos(o.m || 1.2), y + .02, cz + r * .55 * Math.sin(o.m || 1.2)], INK); lw([cx, y + .02, cz], [cx + r * .8 * Math.cos(o.h || 2.6), y + .02, cz + r * .8 * Math.sin(o.h || 2.6)], '#b8342e');
}
/** a row of book / record spines on a y-plane */
export function spines(x0, x1, y, z0, z1, pal, seed, thin) {
  let x = x0, i = 0; while (x < x1 - .02) { const w = thin ? 1 / 16 : (1 + Math.floor(hash2(i, seed, 1) * 2)) / 16, c = pal[Math.floor(hash2(i, seed, 2) * pal.length)], h = (z1 - z0) * (thin ? 1 : .78 + hash2(i, seed, 3) * .22);
    if (hash2(i, seed, 5) > .06) { qy(x, Math.min(x1, x + w), y, z0, z0 + h, c); if (!thin && w > 1 / 16) lw([x, y, z0 + h * .7], [Math.min(x1, x + w), y, z0 + h * .7], lt(c, .4)); } x += w; i++; }
}
export { box, qy, qx, qz, lw, fq, lit, glow, cyl, spx, dk, lt, hash2 };
