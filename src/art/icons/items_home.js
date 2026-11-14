// Home goods: furniture, appliances, electronics, plants, decor, bikes & boards. Keyed by exact item id.
// Each family has one parametric painter (bed, fridge, sofa, flat, laptop, shelf, console, arcade, plant ...), exported for reuse.
import { P, OL, r, R, ov, OV, pg, PG, p, ps, ln, st, sl, spr, clr, steam, sparkle, dk, lt } from './_lib.js';

const SCR = '#6fc3e0', GLASS = '#bfe0ee', WOOD = '#b8794a', WAL = '#7a4a2e';
/* ---------- painters ---------- */
export const bed = (frame, duvet, pillow, o = {}) => {
  const hy = o.tall ? 1 : 4; R(0, hy, 3, 14 - hy, frame); if (o.tuft) ps([[1, hy + 2], [1, hy + 5], [1, hy + 8]], dk(frame, .3));
  R(3, 9, 12, 4, duvet); r(9, 9, 1, 4, dk(duvet, .15)); R(3, 7, o.tall ? 6 : 4, 3, pillow); R(15, 10, 1, 4, frame);
  r(3, 13, 12, 1, dk(frame, .15)); r(1, 14, 2, 2, frame); r(14, 14, 2, 2, frame);
};
export const fridge = (c, x, y, w, h, split, handle = P.slate) => { R(x, y, w, h, c); r(x, y + split, w, 1, dk(c, .3)); r(x + w - 2, y + 1, 1, Math.max(1, split - 2), handle); r(x + w - 2, y + split + 2, 1, 3, handle); };
export const microwave = (c, win, det, o = {}) => { const y = o.tall ? 2 : 4, h = o.tall ? 12 : 9; R(0, y, 16, h, c); r(1, y + 1, 10, h - 2, win); ln(2, y + h - 3, 4, y + 2, lt(win, .35)); ps([[13, y + 2], [13, y + 4], [13, y + 6]], det); r(1, y + h, 2, 1, P.dark); r(13, y + h, 2, 1, P.dark); };
export const sofa = (c, cush, o = {}) => {
  R(2, o.low ? 6 : 4, 12, 7, c); R(0, 7, 3, 7, c); R(13, 7, 3, 7, c); R(3, 10, 10, 4, lt(c, .1)); r(8, 10, 1, 3, dk(c, .2));
  if (cush) { R(3, 6, 4, 4, cush); R(9, 6, 4, 4, cush); } if (o.buttons) ps([[4, 6], [7, 6], [10, 6], [5, 8], [8, 8], [11, 8]], dk(c, .35));
  r(1, 14, 2, 1, P.choc); r(13, 14, 2, 1, P.choc);
};
export const flat = (x, y, w, h, screen, body = P.black) => { R(x, y, w, h, body); r(x + 1, y + 1, w - 2, h - 2, screen); ln(x + 2, y + h - 3, x + 4, y + 2, lt(screen, .35)); };
export const laptop = (c, screen, o = {}) => { R(3, 3, 10, 8, c); r(4, 4, 8, 6, screen); ln(5, 8, 7, 5, lt(screen, .4)); PG([[2, 11], [14, 11], [16, 14], [0, 14]], lt(c, .12)); r(3, 12, 10, 1, dk(c, .25)); if (o.sticker) r(10, 4, 2, 2, o.sticker); };
export const tower = (x, y, w, h, c, glow) => { R(x, y, w, h, c); r(x + 1, y + 1, w - 2, 1, dk(c, .3)); if (glow) { r(x + 1, y + 3, 1, h - 5, glow[0]); if (w > 3) r(x + w - 2, y + 3, 1, h - 5, glow[1] || glow[0]); } else p(x + 1, y + 3, P.leaf); };
const SPINES = [P.red, P.blue, P.gold, P.green, P.purple, P.orange, P.teal, P.cream, P.rose];
export const shelf = (x, y, w, h, wood, rows, fill = 1) => {
  R(x, y, w, h, wood); const rh = Math.floor((h - 1) / rows) - 1;
  for (let k = 0; k < rows; k++) { const yy = y + 1 + k * (rh + 1); r(x + 1, yy, w - 2, rh, dk(wood, .5)); for (let i = 0; i < w - 2; i++) { const s = (i * 7 + k * 5) % 9; if (fill < 1 && (i + k) % 3 === 0) continue; r(x + 1 + i, yy + (s % 4 === 0 ? 1 : 0), 1, rh - (s % 4 === 0 ? 1 : 0), SPINES[s]); } }
};
export const pad = (x, y, c) => { R(x, y, 6, 4, c); p(x + 1, y + 1, dk(c, .5)); p(x + 4, y + 1, P.red); p(x + 4, y + 2, P.sky); };
export const consoleBox = (c, pads, padC, led = P.sky) => { R(2, 2, 12, 6, c); r(3, 5, 8, 1, dk(c, .25)); p(12, 4, led); if (pads === 1) pad(5, 10, padC); else { pad(1, 10, padC); pad(9, 10, padC); } };
export const arcade = (c, marquee, screen) => { R(3, 0, 10, 16, c); r(4, 1, 8, 2, marquee); r(4, 4, 8, 5, '#231f33'); ps([[5, 5], [8, 6], [10, 5], [6, 7]], screen); p(7, 7, P.white); R(2, 10, 12, 2, lt(c, .2)); r(5, 9, 1, 2, P.red); ps([[9, 10], [11, 10]], P.gold); r(7, 13, 2, 2, dk(c, .4)); };
export const speaker = (x, y, w, h, c) => { R(x, y, w, h, c); ov(x + (w > 3 ? 1 : 0), y + h - w - 1 + (w > 3 ? 1 : 0), w > 3 ? w - 2 : w, w > 3 ? w - 2 : w, '#2f2c3a'); p(x + Math.floor(w / 2), y + 1, '#2f2c3a'); };
export const tub = (c, o = {}) => { const x = o.short ? 2 : 0, w = 16 - 2 * x; r(12, 2, 1, 4, P.steel); r(10, 2, 3, 1, P.steel); PG([[x, 7], [x + w, 7], [x + w - 1, 12], [x + w - 3, 14], [x + 3, 14], [x + 1, 12]], c); R(x, 6, w, 2, lt(c, .1)); if (o.water) r(x + 1, 6, w - 2, 1, o.water); if (o.feet) { r(x + 2, 14, 2, 2, o.feet); r(x + w - 4, 14, 2, 2, o.feet); } if (o.bubbles) { OV(2, 3, 4, 4, P.white); OV(5, 2, 4, 4, '#eefaff'); OV(8, 4, 3, 3, P.white); } };
export const stall = (wall, front, head) => { R(2, 1, 12, 14, wall); r(3, 3, 10, 11, front); r(2, 15, 12, 1, P.slate); r(9, 2, 4, 1, head); r(9, 3, 1, 1, head); };
export const guitar = (c, o = {}) => { const s = o.small ? 1 : 0; ln(8, 8, 13, 3, P.choc); ln(9, 8, 14, 3, P.choc); R(13, 0 + s, 3, 3, dk(c, .35)); OV(1 + s, 7 + s, 9 - s, 9 - s * 2, c); OV(5, 5 + s, 6 - s, 6 - s, c); ov(4, 10, 3, 3, '#3a2a20'); r(2 + s, 13 - s, 3, 1, dk(c, .4)); sl(6, 10, 12, 4, '#f4e6c8'); };
export const easel = (o = {}) => { const y = o.small ? 5 : 2, h = o.small ? 6 : 9; ln(8, 0, 3, 15, WOOD); ln(8, 0, 13, 15, WOOD); r(7, 0, 2, 15, dk(WOOD, .2)); R(3, y, 10, h, P.white); r(2, y + h, 12, 1, WOOD); };
export const potAt = (x, y, w, h, c) => { PG([[x, y], [x + w, y], [x + w - 1, y + h], [x + 1, y + h]], c); r(x, y, w, 1, lt(c, .3)); };
const G1 = '#3f9a4a', G2 = '#5fb84f', G3 = '#2f7a3e';
export const leafO = (x, y, w, h, c = G1, split) => { OV(x, y, w, h, c); if (split) { p(x, y + Math.floor(h / 2), OL); p(x + w - 1, y + Math.floor(h / 2) - 1, OL); } p(x + Math.floor(w / 2), y + Math.floor(h / 2), dk(c, .25)); };
/** hanging basket with trailing strands: kind 'fern' | 'pothos' | 'ivy' | 'pearls' */
export const hanging = (kind, pot) => {
  sl(8, 0, 4, 4, P.tan); sl(8, 0, 11, 4, P.tan); p(8, 0, P.brown); const c = { fern: G2, pothos: '#7cc04a', ivy: G3, pearls: '#a8d88a' }[kind];
  if (kind === 'fern') { for (const [x, d] of [[1, 1], [3, 0], [12, 0], [14, 1]]) for (let j = 0; j < 7 - d * 2; j++) p(x, 5 + d * 2 + j, j % 2 ? c : G3); OV(2, 2, 12, 5, c); ps([[4, 3], [7, 2], [10, 3]], lt(c, .3)); }
  else if (kind === 'pearls') { for (const [x, n] of [[2, 9], [4, 11], [6, 7], [9, 10], [11, 8], [13, 11]]) for (let j = 0; j < n; j += 2) p(x, 6 + j, c); OV(3, 3, 10, 3, c); }
  else { for (const [x, n] of [[2, 7], [5, 10], [10, 8], [13, 10]]) for (let j = 0; j < n; j++) { p(x + (j % 4 < 2 ? 0 : 1), 6 + j, j % 3 === 2 ? lt(c, .3) : c); if (kind === 'pothos' && j % 3 === 1) p(x + (j % 4 < 2 ? 1 : 0), 6 + j, c); } OV(2, 3, 12, 4, c); ps([[4, 4], [9, 3]], lt(c, .3)); }
  potAt(4, 5, 8, 4, pot);
};
/** upright plant in a pot. kind: 'monstera' | 'fiddle' | 'snake' | 'cactus' | 'saguaro' | 'barrel' | 'lemon'; size 0..2 */
export const plant = (kind, size, pot) => {
  const py = 11 - (size === 0 ? 0 : 0), pw = size === 2 ? 8 : 6, px = 8 - pw / 2;
  if (kind === 'monstera') { const L = size === 0 ? [[2, 5, 6, 5], [8, 4, 6, 5]] : size === 1 ? [[0, 4, 7, 6], [8, 2, 7, 6], [5, 0, 6, 5]] : [[0, 5, 7, 6], [9, 4, 7, 6], [1, 0, 7, 5], [7, 0, 8, 6]]; r(7, 6, 2, 6, G3); for (const l of L) leafO(l[0], l[1], l[2], l[3], G1, true); }
  else if (kind === 'fiddle') { r(7, size === 0 ? 5 : 1, 2, 11, WAL); const L = size === 0 ? [[2, 3, 5, 5], [9, 2, 5, 5], [5, 0, 5, 4]] : size === 1 ? [[1, 6, 5, 4], [10, 5, 5, 4], [2, 2, 5, 4], [9, 1, 5, 4], [5, 0, 5, 3]] : [[0, 4, 6, 5], [10, 4, 6, 5], [1, 0, 6, 5], [9, 0, 6, 5], [5, 2, 6, 5]]; for (const l of L) leafO(l[0], l[1], l[2], l[3], '#2f8a48'); }
  else if (kind === 'snake') { const S = size === 0 ? [[5, 6], [7, 4], [10, 6]] : size === 1 ? [[3, 4], [5, 2], [8, 1], [10, 3], [12, 5]] : [[3, 2], [5, 0], [7, 1], [9, 0], [12, 2]]; for (const [x, y] of S) { R(x, y + 1, 2, 12 - y, G3); p(x, y, G3); for (let j = y + 2; j < 11; j += 2) p(x, j, '#8fcf6a'); r(x + 1, y + 1, 1, 11 - y, '#e8d84a'); } }
  else if (kind === 'cactus') { OV(4, 4, 8, 8, G2); ln(8, 5, 8, 10, G3); ps([[6, 6], [10, 6], [6, 9], [10, 9]], '#e2f4c8'); OV(6, 2, 4, 3, P.pink); p(8, 3, P.lemon); }
  else if (kind === 'saguaro') { R(6, 1, 4, 11, G2); R(2, 4, 2, 4, G2); r(4, 7, 2, 2, G2); R(12, 2, 2, 5, G2); r(10, 6, 2, 2, G2); ln(8, 2, 8, 10, G3); ps([[7, 3], [7, 6], [7, 9]], '#e2f4c8'); }
  else if (kind === 'barrel') { OV(2, 2, 12, 10, '#d8c23a'); for (const x of [4, 6, 9, 11]) ln(x, 3, x, 10, '#a8922a'); ps([[5, 4], [8, 3], [10, 5]], '#fff4a8'); OV(6, 1, 4, 2, P.orange); }
  else if (kind === 'lemon') { r(7, 6, 2, 6, WAL); OV(1, 0, 14, 9, G1); ps([[4, 2], [9, 1], [11, 5], [6, 6]], G2); OV(3, 4, 3, 3, P.lemon); OV(10, 2, 3, 3, P.lemon); OV(8, 6, 3, 3, P.lemon); }
  if (kind === 'barrel') { PG([[1, 10], [15, 10], [13, 15], [3, 15]], pot); r(1, 10, 14, 1, lt(pot, .3)); }
  else potAt(px, py, pw, 5, pot);
};
export const rug = (c, border, f) => { ps([[0, 5], [0, 7], [0, 9], [0, 11], [15, 5], [15, 7], [15, 9], [15, 11]], P.cream); R(1, 4, 14, 9, border); r(3, 6, 10, 5, c); if (f) f(); };
export const frame = (x, y, w, h, fc, pic, f) => { R(x, y, w, h, fc); r(x + 1, y + 1, w - 2, h - 2, pic); if (f) f(x + 1, y + 1); };
const wheel = (x, y) => { OV(x, y, 7, 7, '#3a3644'); ov(x + 1, y + 1, 5, 5, '#d5dbe2'); p(x + 3, y + 3, P.slate); };
export const bike = (c, o = {}) => {
  wheel(0, 8); wheel(9, 8); ln(3, 11, 6, 6, c); ln(6, 6, 11, 6, c); ln(11, 6, 8, 11, c); ln(3, 11, 8, 11, c); ln(11, 6, 12, 11, c); ln(6, 6, 6, 4, c); r(5, 3, 3, 1, P.black);
  ln(11, 6, 11, 3, c); if (o.drop) { r(11, 3, 3, 1, P.black); p(13, 4, P.black); p(12, 5, P.black); } else r(10, 3, 3, 1, P.black); if (o.basket) { R(12, 3, 4, 3, P.tan); r(12, 4, 4, 1, dk(P.tan, .25)); }
};

const sky = (x, y, w, h) => { r(x, y, w, h, '#8fcdf0'); r(x, y + h - 2, w, 2, '#3b7ea8'); };
export const HOME = {
  bed_t0: () => { R(0, 9, 16, 4, '#aab0bc'); r(0, 12, 16, 1, '#7c8494'); R(1, 7, 6, 3, P.white); ps([[9, 10], [12, 10]], '#c8ced8'); },
  bed_t1: () => bed(WOOD, P.blue, P.white),
  bed_t2: () => bed('#8a6ab8', '#f4f0e8', '#f6d8e0', { tall: 1, tuft: 1 }),
  fridge_t0: () => fridge(P.white, 3, 6, 10, 9, 3),
  fridge_t1: () => fridge('#f4e6c8', 3, 0, 10, 16, 5, P.brown),
  fridge_t2: () => { fridge(P.steel, 2, 0, 12, 16, 6, P.dark); r(4, 2, 4, 3, '#231f33'); r(5, 3, 2, 1, P.sky); },
  stove_t0: () => { OV(2, 6, 12, 5, '#5a5666'); ov(4, 7, 8, 3, P.red); ov(6, 8, 4, 1, P.orange); R(1, 10, 14, 4, P.black); p(12, 12, P.gold); p(3, 12, P.red); },
  stove_t1: () => { R(2, 2, 12, 13, P.white); r(2, 2, 12, 2, P.dark); ps([[4, 2], [7, 2], [10, 2], [12, 2]], P.red); ps([[4, 5], [6, 5], [9, 5], [11, 5]], P.slate); r(4, 7, 8, 1, P.steel); R(4, 9, 8, 5, '#3a3644'); ln(5, 12, 7, 10, '#6a6478'); },
  stove_t2: () => { R(0, 2, 16, 13, P.steel); r(0, 2, 16, 2, P.black); ps([[2, 2], [6, 2], [10, 2], [13, 2]], P.orange); ps([[2, 5], [5, 5], [8, 5], [11, 5], [13, 5]], P.crimson); R(1, 8, 6, 6, '#3a3644'); R(9, 8, 6, 6, '#3a3644'); r(2, 7, 4, 1, P.white); r(10, 7, 4, 1, P.white); },
  microwave_t0: () => microwave('#e4d6b8', '#5a6676', P.brown),
  microwave_t1: () => { microwave('#3a3644', '#231f33', P.slate); r(12, 5, 3, 2, '#0a2a1a'); ps([[12, 5], [14, 5], [13, 6]], '#5cf08a'); },
  microwave_t2: () => { microwave(P.steel, '#3a4458', P.slate, { tall: 1 }); OV(12, 9, 3, 3, P.dark); p(13, 10, P.white); r(1, 3, 10, 1, P.dark); st([[4, 0], [5, 1], [8, 0], [9, 1]], '#e8eef4'); },
  sofa_t0: () => { R(1, 6, 14, 4, '#8a8f4a'); ln(2, 8, 13, 8, dk('#8a8f4a', .2)); R(0, 10, 16, 3, '#9a9f58'); ps([[4, 7], [10, 7], [7, 11]], dk('#8a8f4a', .3)); r(1, 13, 1, 2, P.slate); r(14, 13, 1, 2, P.slate); },
  sofa_t1: () => sofa('#d8a030', '#f4e6c8'),
  sofa_t2: () => sofa('#1f7f86', null, { buttons: 1 }),
  tv_t0: () => { ln(8, 3, 4, 0, P.slate); ln(8, 3, 12, 0, P.slate); R(1, 4, 14, 10, '#8a6a4a'); r(2, 5, 9, 8, '#9fd0e0'); ln(3, 10, 5, 7, P.white); ps([[12, 6], [12, 8]], P.cream); r(12, 10, 2, 2, '#5a4030'); r(2, 14, 2, 1, P.choc); r(12, 14, 2, 1, P.choc); },
  tv_t1: () => { flat(1, 2, 14, 9, '#3b6fd0'); r(7, 11, 2, 2, P.dark); R(2, 13, 12, 2, WOOD); },
  tv_t2: () => { flat(0, 0, 16, 11, '#8a5cc2'); r(1, 7, 14, 3, '#f08a2c'); ov(6, 4, 4, 4, P.gold); R(2, 13, 12, 2, P.dark); ps([[4, 13], [6, 13], [9, 13], [11, 13]], P.slate); },
  mall_tv_retro: () => { ln(8, 4, 5, 1, P.slate); ln(8, 4, 11, 1, P.slate); R(2, 5, 12, 9, P.orange); r(3, 6, 8, 7, '#b8e8d0'); ln(4, 11, 6, 8, P.white); ps([[12, 7], [12, 9], [12, 11]], P.cream); r(3, 14, 2, 1, P.dark); r(11, 14, 2, 1, P.dark); },
  mall_tv_ultra: () => { flat(0, 4, 16, 7, '#2fa3a0'); ps([[3, 8], [6, 7], [10, 8], [12, 6]], '#8fe0d8'); ln(4, 11, 3, 13, P.dark); ln(11, 11, 12, 13, P.dark); },
  mall_tv_frame: () => frame(0, 2, 16, 12, P.gold, '#8fcdf0', () => { r(1, 9, 14, 4, '#5fb84f'); PG([[3, 9], [7, 4], [11, 9]], '#8a7ab8'); p(7, 4, P.white); ov(11, 4, 2, 2, P.lemon); }),
  computer_t0: () => laptop('#8a909c', SCR, { sticker: P.pink }),
  computer_t1: () => { flat(0, 2, 11, 8, SCR, P.dark); r(4, 10, 3, 2, P.slate); r(2, 12, 7, 1, P.slate); r(1, 14, 9, 1, P.steel); tower(12, 3, 4, 12, '#e4e0d8'); },
  computer_t2: () => { flat(0, 1, 8, 7, '#8a5cc2', P.dark); flat(5, 5, 8, 7, SCR, P.dark); r(8, 12, 2, 2, P.slate); r(2, 8, 2, 5, P.slate); r(1, 14, 10, 1, P.steel); tower(13, 2, 3, 13, '#231f33', ['#f060c0']); },
  mall_laptop_air: () => laptop('#d8dde4', '#f4faff'),
  mall_pc_rig: () => { flat(0, 4, 9, 7, '#e060c0', P.dark); r(3, 11, 3, 2, P.slate); r(1, 13, 7, 1, P.slate); tower(9, 1, 7, 14, '#231f33', ['#5cf0e0', '#f060c0']); ov(11, 5, 3, 3, '#8a5cc2'); },
  bookshelf_t0: () => { R(1, 8, 9, 7, P.tan); r(2, 9, 7, 5, dk(P.tan, .45)); r(2, 10, 1, 4, P.red); r(3, 9, 1, 5, P.blue); r(4, 11, 1, 3, P.gold); R(6, 1, 9, 7, P.tan); r(7, 2, 7, 5, dk(P.tan, .45)); r(8, 3, 1, 4, P.green); r(9, 2, 1, 5, P.cream); r(12, 4, 2, 3, P.purple); },
  bookshelf_t1: () => shelf(2, 0, 12, 16, WOOD, 3),
  bookshelf_t2: () => { shelf(0, 0, 16, 16, WAL, 3); ln(10, 15, 12, 1, P.cream); ln(13, 15, 15, 1, P.cream); ps([[12, 5], [13, 5], [11, 9], [12, 9], [11, 13], [12, 13]], P.cream); },
  game_t0: () => { R(1, 11, 14, 4, P.red); r(3, 12, 6, 2, P.cream); R(2, 7, 12, 4, P.blue); r(9, 8, 4, 2, P.gold); R(3, 3, 10, 4, P.green); r(4, 4, 4, 2, P.cream); ps([[10, 4], [11, 5]], P.white); },
  game_t1: () => consoleBox(P.white, 2, '#e4e0d8'),
  game_t2: () => arcade('#c8382c', P.gold, '#5cf08a'),
  mall_console_pico: () => { R(4, 3, 8, 5, P.white); r(5, 6, 6, 1, '#cfd6de'); p(10, 4, P.leaf); pad(5, 10, '#f08ab0'); },
  mall_console_pro: () => consoleBox('#2f2c3a', 2, '#4a4458', '#5cf0e0'),
  mall_arcade_cab: () => { arcade('#7a55c8', '#f6d24a', '#f08ab0'); sparkle(8, 2, '#fff8e0'); },
  music_t0: () => { ln(12, 5, 14, 0, P.slate); R(1, 6, 14, 8, P.red); OV(2, 7, 6, 6, '#3a3644'); ps([[4, 9], [5, 10]], P.slate); ov(10, 8, 3, 3, P.cream); r(9, 12, 5, 1, dk(P.red, .3)); },
  music_t1: () => { speaker(0, 4, 4, 11, WOOD); speaker(12, 4, 4, 11, WOOD); R(5, 6, 6, 9, '#3a3644'); r(6, 7, 4, 2, '#5cf08a'); ps([[6, 11], [8, 11], [6, 13], [8, 13]], P.steel); },
  music_t2: () => { R(1, 8, 14, 7, WOOD); r(2, 10, 5, 4, dk(WOOD, .4)); r(3, 10, 1, 4, P.red); r(4, 10, 1, 4, P.gold); r(5, 10, 1, 4, P.teal); r(9, 10, 5, 4, dk(WOOD, .4)); OV(2, 2, 11, 6, '#2f2c3a'); ov(6, 4, 3, 2, P.orange); ln(13, 2, 10, 5, P.steel); R(13, 1, 2, 2, P.steel); },
  mall_speaker_boom: () => { r(3, 2, 10, 1, P.dark); p(3, 3, P.dark); p(12, 3, P.dark); R(0, 4, 16, 10, P.red); OV(1, 6, 6, 6, '#2f2c3a'); OV(9, 6, 6, 6, '#2f2c3a'); p(3, 8, P.slate); p(11, 8, P.slate); r(6, 5, 4, 2, P.cream); ps([[7, 12], [8, 12]], P.gold); },
  mall_hifi: () => { speaker(0, 3, 4, 12, WAL); speaker(12, 3, 4, 12, WAL); R(5, 7, 6, 8, WAL); r(6, 9, 4, 1, P.gold); ps([[6, 12], [9, 12]], P.cream); OV(5, 3, 6, 4, '#2f2c3a'); p(7, 4, P.orange); p(8, 4, P.orange); },
  shower_t0: () => { r(1, 1, 14, 1, P.steel); R(2, 2, 12, 13, '#d8ecf4'); for (const x of [4, 7, 10, 12]) ln(x, 3, x, 14, '#a8c8d8'); ps([[2, 2], [5, 2], [8, 2], [11, 2]], P.slate); },
  shower_t1: () => { stall(GLASS, '#d8f0f8', P.steel); r(4, 2, 8, 1, P.steel); ln(4, 12, 7, 5, P.white); st([[5, 4], [7, 6], [9, 4], [11, 7], [8, 9], [6, 11], [10, 11]], '#5aa8e0'); },
  shower_t2: () => { stall('#5e6676', '#b8dce8', P.gold); ln(4, 12, 6, 8, P.white); r(3, 12, 4, 2, '#7a8494'); st([[5, 5], [6, 4], [5, 3], [9, 7], [10, 6], [9, 5], [7, 9], [8, 8]], P.white); steam(5, -1, '#e8eef4'); },
  bath_t0: () => tub(P.white, { short: 1 }),
  bath_t1: () => tub(P.white, { feet: P.gold, water: '#8fcdf0' }),
  bath_t2: () => tub('#e4e8ee', { bubbles: 1, water: '#5cc8d0' }),
  exercise_t0: () => { R(4, 5, 11, 8, P.purple); r(11, 5, 1, 8, dk(P.purple, .3)); r(7, 5, 1, 8, dk(P.purple, .3)); OV(1, 4, 7, 10, P.violet); ov(3, 7, 3, 4, P.purple); p(4, 8, P.cream); },
  exercise_t1: () => { R(1, 10, 11, 2, '#3a3644'); r(2, 12, 1, 3, P.slate); r(10, 12, 1, 3, P.slate); R(1, 7, 4, 3, P.red); for (const [x, y] of [[4, 1], [8, 5]]) { R(x, y, 2, 5, P.slate); R(x + 6, y, 2, 5, P.slate); r(x + 2, y + 2, 4, 1, P.steel); } },
  exercise_t2: () => { R(0, 11, 13, 3, '#3a3644'); r(1, 12, 11, 1, P.slate); ln(12, 11, 14, 4, P.steel); ln(13, 11, 15, 4, P.steel); R(10, 1, 6, 4, P.dark); r(11, 2, 4, 2, '#5cf08a'); r(0, 14, 2, 1, P.black); r(11, 14, 2, 1, P.black); },
  instrument_t0: () => guitar('#e8c078', { small: 1 }),
  instrument_t1: () => guitar('#d8923a'),
  instrument_t2: () => { R(1, 2, 14, 11, WAL); r(1, 2, 14, 1, lt(WAL, .3)); r(5, 4, 6, 3, '#f4e6c8'); ps([[6, 5], [8, 5], [9, 6]], P.dark); R(0, 8, 16, 3, lt(WAL, .1)); r(1, 9, 14, 2, P.white); for (let i = 0; i < 7; i++) p(2 + i * 2, 9, P.black); r(1, 13, 2, 2, WAL); r(13, 13, 2, 2, WAL); ps([[7, 14], [8, 14]], P.gold); },
  easel_t0: () => easel({ small: 1 }),
  easel_t1: () => { easel(); ps([[5, 4], [6, 4], [5, 5]], P.red); ps([[9, 6], [10, 6], [10, 7]], P.blue); ps([[6, 8], [7, 9]], P.gold); p(11, 3, P.green); },
  easel_t2: () => { easel(); r(4, 3, 8, 4, '#8fcdf0'); r(4, 7, 8, 3, P.leaf); ov(9, 3, 2, 2, P.lemon); R(12, 11, 4, 4, '#8fcdf0'); ln(13, 10, 12, 7, P.red); ln(14, 10, 15, 7, P.gold); R(0, 12, 4, 3, WAL); p(1, 11, P.rose); p(2, 11, P.teal); },
  plant_t0: () => plant('cactus', 0, '#c8683a'),
  plant_t1: () => plant('monstera', 1, P.white),
  plant_t2: () => plant('lemon', 2, P.blue),
  plant_fern: () => hanging('fern', '#c8683a'),
  mall_plant_monstera_baby: () => plant('monstera', 0, '#c8683a'),
  mall_plant_monstera: () => plant('monstera', 1, '#f4f0e8'),
  mall_plant_monstera_xl: () => plant('monstera', 2, '#c8a060'),
  mall_plant_fiddle_s: () => plant('fiddle', 0, '#e4e0d8'),
  mall_plant_fiddle: () => plant('fiddle', 1, '#5e6676'),
  mall_plant_fiddle_xl: () => plant('fiddle', 2, '#d8a838'),
  mall_plant_snake_s: () => plant('snake', 0, '#c8683a'),
  mall_plant_snake: () => plant('snake', 1, P.grey),
  mall_plant_snake_xl: () => plant('snake', 2, '#3a3644'),
  mall_plant_cactus: () => plant('cactus', 0, P.sky),
  mall_plant_cactus_tall: () => plant('saguaro', 1, '#c8683a'),
  mall_plant_cactus_gold: () => plant('barrel', 2, '#2f7f8a'),
  mall_plant_pothos: () => hanging('pothos', P.white),
  mall_plant_ivy: () => hanging('ivy', '#b8834a'),
  mall_plant_pearls: () => hanging('pearls', '#e8a0b8'),
  rug_t0: () => { ps([[0, 5], [0, 8], [0, 11], [15, 6], [15, 9], [15, 12]], P.cream); R(1, 4, 14, 9, P.tan); r(1, 6, 14, 1, P.teal); r(1, 8, 14, 1, P.red); r(1, 10, 14, 1, P.teal); },
  rug_t1: () => rug('#f4ead2', '#b8563a', () => { r(4, 7, 8, 3, '#ead9b8'); }),
  rug_t2: () => rug('#b02a2a', '#f2c230', () => { PG([[8, 6], [12, 8.5], [8, 11], [4, 8.5]], P.navy); ps([[7, 8], [8, 8]], P.gold); ps([[3, 6], [12, 6], [3, 10], [12, 10]], P.cream); }),
  decor_t0: () => { R(1, 1, 7, 10, '#7a55c8'); ov(3, 3, 3, 3, P.gold); r(2, 8, 5, 1, P.cream); R(9, 4, 6, 11, P.orange); ps([[11, 6], [12, 7], [11, 8], [12, 9]], '#3a3644'); r(10, 12, 4, 1, P.cream); ps([[1, 1], [7, 1], [9, 4], [14, 4]], P.white); },
  decor_t1: () => { frame(0, 4, 5, 8, '#3a3644', '#f4e6c8', (x, y) => ov(x, y + 2, 3, 3, P.red)); frame(5, 3, 6, 10, '#3a3644', '#8fcdf0', (x, y) => r(x, y + 5, 4, 3, P.leaf)); frame(11, 4, 5, 8, '#3a3644', '#f4e6c8', (x, y) => r(x + 1, y + 1, 1, 4, P.navy)); },
  decor_t2: () => { frame(0, 0, 7, 7, P.gold, '#8fcdf0', (x, y) => r(x, y + 3, 5, 2, P.leaf)); frame(8, 1, 5, 5, P.gold, P.pink); frame(1, 8, 5, 7, P.gold, '#f4e6c8', (x, y) => ov(x, y + 1, 3, 3, P.navy)); frame(7, 7, 9, 8, P.gold, P.purple, (x, y) => { r(x, y + 4, 7, 2, P.orange); p(x + 4, y + 1, P.lemon); }); },
  decor_string_lights: () => { const y = [3, 5, 6, 7, 7, 6, 5, 3]; for (let i = 0; i < 8; i++) { r(i * 2, y[i], 2, 1, '#3a3644'); } const c = [P.gold, P.pink, P.sky, P.lemon]; for (let i = 0; i < 4; i++) { const x = 1 + i * 4, yy = y[Math.min(7, i * 2 + 1)] + 1; R(x, yy, 3, 4, c[i]); st([[x + 1, yy + 5]], '#fff4c8'); } },
  decor_floor_lamp: () => { r(9, 14, 6, 1, P.dark); ln(12, 14, 12, 4, P.dark); ln(12, 4, 9, 1, P.dark); ln(9, 1, 5, 1, P.dark); PG([[1, 2], [8, 2], [10, 7], [0, 7]], '#f6e6c0'); st([[3, 8], [5, 9], [7, 8], [4, 10], [6, 10]], '#fff4a8'); },
  decor_wall_clock: () => { OV(1, 1, 14, 14, '#2f2c3a'); ov(3, 3, 10, 10, '#fbf4e0'); ps([[8, 3], [8, 12], [3, 8], [12, 8]], P.slate); ln(8, 8, 8, 5, '#2f2c3a'); ln(8, 8, 10, 9, '#2f2c3a'); p(8, 8, P.red); },
  decor_aquarium: () => { R(0, 3, 16, 11, '#6fc3e0'); r(0, 3, 16, 1, '#3a3644'); r(1, 12, 14, 1, P.tan); ps([[3, 11], [3, 10], [4, 9], [3, 8]], P.green); spr(6, 6, ['.##.#', '####.', '.##.#'], { '#': P.orange }, { soft: true }); p(7, 7, P.white); st([[12, 9], [13, 7], [12, 5]], P.white); r(0, 14, 16, 1, '#3a3644'); },
  sky_poster: () => frame(0, 2, 16, 12, WAL, '#f6c890', (x, y) => { r(x, y + 6, 14, 4, '#3b7ea8'); ov(x + 10, y + 1, 3, 3, P.lemon); for (const [a, h] of [[1, 3], [3, 5], [5, 2], [7, 6], [9, 3], [11, 2]]) r(x + a, y + 6 - h, 2, h, '#4a4468'); p(x + 7, y - 1 + 0, '#4a4468'); }),
  mall_bike_city: () => bike('#2fa3a0', { basket: 1 }),
  mall_bike_road: () => bike(P.red, { drop: 1 }),
  mall_skate_classic: () => { OV(5, 0, 6, 16, '#f6d24a'); r(7, 3, 2, 10, '#f08a2c'); r(4, 3, 8, 1, P.steel); r(4, 12, 8, 1, P.steel); for (const [x, y] of [[3, 2], [11, 2], [3, 11], [11, 11]]) R(x, y, 2, 3, P.white); },
  mall_skate_cruiser: () => { PG([[0, 5], [3, 7], [13, 7], [16, 5], [16, 7], [14, 9], [2, 9], [0, 7]], '#f07a5a'); r(3, 7, 10, 1, '#f6b48a'); OV(2, 10, 4, 4, '#fff4dc'); OV(10, 10, 4, 4, '#fff4dc'); p(3, 11, P.slate); p(11, 11, P.slate); r(3, 9, 2, 1, P.steel); r(11, 9, 2, 1, P.steel); },
};
