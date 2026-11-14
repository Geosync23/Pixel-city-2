// Books, gifts, toys, beauty, stationery, souvenirs, passes and odds & ends. Keyed by exact item id.
// Painters: book, card, ticket, box, bottle, jarOf, paperBag, flower, robot ... (exported for reuse).
import { P, OL, r, R, ov, OV, pg, PG, p, ps, ln, st, sl, spr, clr, glyph, glyphC, sparkle, dk, lt } from './_lib.js';
import { gift as giftBox } from './ui.js';

/* ---------- painters ---------- */
/** closed book, cover colour c; f draws the emblem (box x 5..12, y 3..10) */
export const book = (c, f, o = {}) => { R(2, 1, 12, 14, c); r(2, 1, 2, 14, dk(c, .28)); r(4, 13, 10, 1, P.cream); r(4, 14, 10, 1, dk(c, .3)); if (o.band) r(4, 11, 10, 1, o.band); if (f) f(); };
const em = (name, c, c2) => () => glyphC(name, 4, 2, 10, 9, c, c2, { soft: true });
export const card = (c, f) => { R(1, 3, 14, 10, c); r(1, 3, 14, 1, lt(c, .3)); if (f) f(); };
export const ticket = (c, f) => { R(0, 4, 16, 8, c); clr(0, 7, 1, 2); clr(15, 7, 1, 2); for (const y of [5, 7, 9, 10]) p(11, y, dk(c, .35)); if (f) f(); };
export const box = (c, x = 1, y = 3, w = 14, h = 11, lid) => { R(x, y, w, h, c); if (lid) R(x - 1 < 0 ? 0 : x - 1, y, Math.min(16, w + 2), 3, lid); };
export const bottle = (c, x = 5, y = 1, w = 6, h = 14, cap) => { R(x, y + 4, w, h - 4, c); r(x + 1, y + 2, w - 2, 2, c); R(x + 1, y, w - 2, 2, cap || dk(c, .3)); p(x + 1, y + 6, lt(c, .5)); };
export const jarOf = (body, lid, f) => { R(3, 5, 10, 10, body); R(3, 2, 10, 3, lid); r(4, 2, 8, 1, lt(lid, .3)); if (f) f(); };
export const paperBag = (c, f) => { PG([[3, 3], [13, 3], [14, 15], [2, 15]], c); for (const x of [3, 5, 7, 9, 11]) p(x, 2, c); r(3, 5, 10, 1, dk(c, .18)); if (f) f(); };
export const flower = (x, y, c, c2 = P.lemon) => { ps([[x, y - 1], [x - 1, y], [x + 1, y], [x, y + 1]], c); p(x, y, c2); };
export const tulip = (x, y, c) => { R(x, y, 3, 3, c); p(x, y - 1, c); p(x + 2, y - 1, c); };
const pen = (x, c, tip = P.dark) => { R(x, 3, 2, 9, c); r(x, 12, 2, 1, P.cream); p(x, 13, tip); p(x + 1, 13, tip); r(x, 2, 2, 1, dk(c, .3)); };
const tin = (c, key = P.red) => { r(13, 8, 2, 1, key); r(14, 6, 2, 2, key); };

export const MISC = {
  /* skill books */
  book_cooking_1: () => book(P.orange, em('pan', '#3a3644', P.cream)),
  book_cooking_2: () => book(P.white, em('fish', P.gold, '#fff4a8'), { band: P.gold }),
  book_fitness_1: () => book(P.red, em('shoe', P.white)),
  book_fitness_2: () => book('#8a2a2a', em('dumbbell', P.steel)),
  book_charisma_1: () => book(P.pink, em('chat', P.white)),
  book_charisma_2: () => book('#c83a8a', () => { PG([[8, 3], [12, 11], [4, 11]], '#fff4a8'); r(7, 2, 3, 2, P.dark); }),
  book_logic_1: () => book(P.navy, () => { r(5, 3, 7, 7, P.white); for (const i of [7, 9]) { r(i, 3, 1, 7, P.navy); r(5, i - 2, 7, 1, P.navy); } p(6, 4, P.gold); p(10, 8, P.gold); }),
  book_logic_2: () => book('#2c3e7a', () => { r(5, 8, 2, 3, P.leaf); r(8, 5, 2, 6, P.gold); r(11, 3, 2, 8, P.red); }, { band: P.sky }),
  book_creativity_1: () => book(P.teal, em('pen', P.lemon, '#3a3644')),
  book_creativity_2: () => book(P.purple, () => { OV(5, 3, 8, 7, '#f4e6c8'); ps([[7, 5], [10, 5]], P.red); p(8, 7, P.blue); p(11, 7, P.gold); p(6, 7, P.leaf); }),
  book_handiness_1: () => book(P.gold, em('wrench', '#3a3644')),
  book_handiness_2: () => book(P.brown, () => { PG([[5, 5], [13, 5], [13, 8], [5, 7]], P.steel); ps([[6, 8], [8, 8], [10, 9], [12, 9]], P.steel); r(4, 4, 3, 4, P.gold); }),
  /* novels */
  novel_lighthouse: () => book('#3b6fd0', () => { st([[9, 3], [10, 3], [11, 2], [12, 2], [10, 4], [11, 5], [12, 5]], '#fff4a8'); r(7, 4, 2, 6, P.white); r(7, 6, 2, 1, P.red); r(7, 3, 2, 1, P.gold); r(5, 10, 6, 1, P.slate); }),
  novel_last_train: () => book('#2a5a44', () => { R(5, 3, 8, 7, '#e8c860'); r(6, 4, 2, 3, '#fff4c8'); r(9, 4, 3, 3, '#fff4c8'); r(5, 8, 8, 1, P.red); ps([[6, 10], [11, 10]], P.dark); }, { band: P.gold }),
  novel_noodles: () => book(P.crimson, () => { glyph('heart', 6, 2, P.pink, P.pink, { soft: true }); PG([[4, 8], [13, 8], [11, 11], [6, 11]], P.white); ps([[6, 7], [8, 7], [10, 7]], P.lemon); }),
  novel_maple_murders: () => book('#2f2c3a', () => { OV(5, 2, 6, 6, P.steel); ov(6, 3, 4, 4, '#8fcdf0'); ln(10, 8, 12, 10, P.gold); p(7, 4, P.white); ps([[6, 10], [7, 10]], P.crimson); }),
  novel_starfarers: () => book('#3a2f7a', () => { ov(6, 4, 5, 5, P.orange); sl(4, 8, 12, 4, '#f6d8a0'); st([[5, 3], [12, 9], [11, 2]], P.white); }),
  /* gifts */
  gift_flowers: () => { tulip(2, 2, P.pink); tulip(6, 1, P.yellow); tulip(10, 2, P.pink); ps([[3, 5], [7, 4], [7, 5], [11, 5], [5, 6], [9, 6]], P.green); PG([[2, 7], [14, 7], [9, 16], [7, 16]], '#f4e6c8'); ln(5, 8, 8, 14, '#d8c49a'); r(6, 11, 4, 1, P.rose); },
  gift_wildflowers: () => { for (const [x, y, c] of [[3, 3, P.violet], [7, 2, P.white], [11, 3, P.orange], [5, 5, P.rose], [10, 6, P.sky]]) flower(x, y, c); for (const x of [4, 6, 8, 10, 11]) sl(x, 7, 7 + (x > 8 ? 1 : 0), 15, P.green); r(6, 11, 4, 1, P.tan); p(10, 12, P.tan); },
  gift_chocolates: () => { R(1, 4, 14, 10, '#c92a4a'); r(2, 5, 12, 8, '#f4d8c0'); for (const [x, y] of [[3, 6], [7, 6], [11, 6], [5, 10], [9, 10]]) { r(x, y, 2, 2, P.choc); p(x, y, '#a8703a'); } r(7, 4, 2, 10, P.gold); ps([[6, 3], [5, 2], [9, 3], [10, 2]], P.gold); },
  gift_honey: () => jarOf('#f2b020', P.gold, () => { r(5, 8, 6, 5, P.cream); r(6, 10, 4, 2, P.gold); ps([[7, 10], [9, 10], [6, 9], [9, 9]], '#3a3644'); p(4, 6, '#fde08a'); }),
  gift_candle: () => { st([[8, 0], [7, 1], [9, 1]], '#fff4a8'); OV(7, 1, 2, 4, P.orange); p(8, 3, P.lemon); r(8, 5, 1, 1, P.dark); R(3, 6, 10, 9, '#dff0f6'); r(4, 7, 8, 7, '#f6e6c8'); r(4, 11, 8, 2, P.rose); },
  gift_teddy: () => { OV(2, 0, 4, 4, '#a8703a'); OV(10, 0, 4, 4, '#a8703a'); OV(3, 1, 10, 8, '#b8804a'); OV(2, 8, 12, 8, '#b8804a'); ov(6, 5, 4, 3, '#e8c890'); ps([[5, 4], [10, 4], [7, 5]], '#2f2430'); OV(0, 9, 3, 4, '#a8703a'); OV(13, 9, 3, 4, '#a8703a'); r(5, 9, 6, 1, P.red); r(7, 8, 2, 3, P.red); ov(6, 11, 4, 4, '#e8c890'); },
  gift_wine: () => { bottle('#3a2a44', 5, 0, 6, 16, P.crimson); r(5, 8, 6, 5, P.cream); r(6, 10, 4, 1, P.crimson); },
  gift_postcards: () => { PG([[0, 6], [9, 3], [11, 10], [2, 13]], '#f4e6c8'); PG([[3, 4], [13, 4], [13, 12], [3, 12]], P.white); r(4, 5, 8, 4, '#8fcdf0'); r(4, 8, 8, 1, '#3b7ea8'); ps([[5, 7], [6, 6], [6, 7], [8, 7], [9, 5], [9, 6], [9, 7]], '#4a4468'); r(4, 10, 5, 1, P.grey); r(11, 10, 1, 1, P.red); },
  gift_succulent: () => { OV(4, 2, 8, 7, '#5fb84f'); ps([[6, 4], [9, 4], [8, 6]], '#a8dc7a'); p(8, 1, P.pink); PG([[3, 9], [13, 9], [12, 15], [4, 15]], '#c8683a'); r(3, 9, 10, 1, P.rose); r(7, 10, 2, 2, P.rose); ps([[6, 11], [9, 11]], P.rose); },
  gift_cake: () => { for (const x of [4, 8, 11]) { r(x, 2, 1, 3, [P.sky, P.pink, P.lemon][x % 3]); st([[x, 1]], P.orange); } R(1, 5, 14, 4, P.white); ps([[2, 9], [5, 9], [9, 9], [13, 9]], P.white); R(1, 9, 14, 5, '#f6b0c8'); ps([[3, 6], [7, 7], [11, 6]], P.red); R(0, 14, 16, 1, P.steel); },
  /* passes & misc */
  transit_pass: () => card(P.green, () => { OV(3, 5, 6, 6, P.white); ov(5, 7, 2, 2, P.green); r(10, 6, 4, 1, P.cream); r(10, 8, 3, 1, P.cream); r(2, 11, 12, 1, dk(P.green, .25)); }),
  gym_day_pass: () => ticket('#b8bec8', () => glyph('dumbbell', 2, 6, '#3a3644', '#3a3644', { soft: true })),
  gym_membership: () => card(P.red, () => { glyph('dumbbell', 2, 5, P.white, P.white, { soft: true }); glyph('leaf', 10, 5, P.gold, P.gold, { soft: true }); r(2, 11, 8, 1, P.cream); }),
  movie_ticket: () => ticket('#f6e6c0', () => { glyph('star', 2, 5, P.red, P.red, { soft: true }); r(12, 6, 3, 1, P.red); r(12, 9, 3, 1, P.red); }),
  fishing_rod: () => { ln(1, 14, 13, 1, P.wood); ln(2, 14, 14, 1, P.wood); r(1, 12, 3, 3, P.dark); OV(4, 9, 3, 3, P.steel); sl(13, 1, 13, 8, '#cfd6de'); OV(12, 8, 3, 3, P.red); r(12, 8, 3, 1, P.white); p(13, 11, P.slate); },
  umbrella: () => { ln(3, 14, 12, 2, P.wood); PG([[5, 13], [2, 9], [10, 2], [13, 4]], P.blue); ln(5, 11, 11, 4, dk(P.blue, .25)); ln(4, 10, 9, 4, lt(P.blue, .3)); r(1, 14, 3, 1, P.wood); p(1, 13, P.wood); p(13, 1, P.steel); },
  sketchbook: () => { R(1, 2, 11, 13, '#2f2c3a'); for (const y of [3, 5, 7, 9, 11, 13]) p(1, y, P.steel); r(4, 5, 6, 3, P.cream); PG([[12, 2], [15, 2], [15, 12], [13.5, 15], [12, 12]], P.gold); r(12, 2, 3, 2, P.pink); p(13, 14, P.dark); },
  canvas: () => { R(1, 1, 14, 14, P.white); r(2, 2, 12, 12, '#fbf7ee'); ps([[1, 1], [14, 1], [1, 14], [14, 14]], P.wood); ln(3, 12, 6, 9, '#e8e2d4'); },
  duck_feed: () => paperBag('#d8b078', () => { glyph('duck', 5, 7, P.white, P.orange, { soft: true }); ps([[5, 1], [8, 0], [10, 1]], P.gold); }),
  painting: () => { R(0, 1, 16, 14, P.gold); r(2, 3, 12, 10, '#8fcdf0'); r(2, 9, 12, 4, P.leaf); ov(9, 4, 3, 3, P.lemon); PG([[3, 9], [6, 5], [9, 9]], P.purple); ps([[4, 11], [8, 12], [11, 10]], P.red); },
  compost: () => { OV(0, 7, 16, 9, '#6b4a2e'); clr(0, 15, 16, 1); ps([[3, 10], [6, 12], [10, 10], [12, 13], [8, 9]], '#4a3220'); ps([[5, 11], [11, 12]], '#a8845a'); r(8, 4, 1, 4, P.green); ps([[7, 4], [6, 3], [9, 3], [10, 2]], P.leaf); },
  /* gen_* gifts */
  gen_vinyl: () => { OV(0, 0, 16, 16, '#2f2c3a'); ov(2, 2, 12, 12, '#3a3648'); ov(5, 5, 6, 6, P.orange); r(7, 7, 2, 2, P.cream); sl(3, 5, 5, 3, '#6a6478'); },
  gen_mixtape: () => { R(0, 3, 16, 10, '#3a3644'); r(2, 4, 12, 5, P.cream); r(3, 5, 6, 1, P.red); ov(3, 6, 3, 3, '#3a3644'); ov(10, 6, 3, 3, '#3a3644'); r(6, 7, 4, 1, P.slate); PG([[3, 13], [4, 10], [12, 10], [13, 13]], '#5e6676'); },
  gen_comic: () => { R(2, 1, 12, 14, P.yellow); r(2, 1, 12, 3, P.red); r(4, 2, 6, 1, P.white); OV(4, 5, 8, 5, P.white); p(6, 10, P.white); ps([[6, 7], [8, 7], [10, 7]], P.red); r(3, 12, 10, 2, P.blue); },
  gen_art_print: () => { R(1, 0, 14, 16, '#f4f0e8'); r(3, 2, 10, 12, '#f6c890'); ov(4, 3, 5, 5, P.red); r(8, 7, 4, 6, P.navy); ln(3, 12, 9, 8, P.teal); },
  gen_toy_robot: () => { r(7, 0, 2, 2, P.red); R(4, 2, 8, 5, P.steel); r(5, 4, 2, 2, P.sky); r(9, 4, 2, 2, P.sky); R(3, 8, 10, 5, '#8fa0b4'); r(5, 9, 6, 2, P.gold); R(1, 8, 2, 4, P.steel); tin(); R(4, 13, 3, 2, P.slate); R(9, 13, 3, 2, P.slate); },
  gen_notebook: () => { R(2, 1, 12, 14, '#5a8a7a'); r(2, 1, 2, 14, dk('#5a8a7a', .3)); r(10, 1, 1, 14, P.gold); r(10, 14, 1, 2, P.gold); r(5, 4, 4, 3, P.cream); },
  gen_pet_treats: () => paperBag('#d8b078', () => { OV(6, 9, 4, 4, '#8a5a38'); ps([[5, 7], [7, 6], [9, 6], [11, 7]], '#8a5a38'); p(5, 8, '#8a5a38'); p(11, 8, '#8a5a38'); }),
  gen_cheese_board: () => { R(0, 10, 16, 4, P.wood); PG([[1, 10], [1, 5], [7, 10]], P.face); OV(7, 5, 5, 5, '#f6efd8'); r(7, 8, 5, 2, '#f6efd8'); PG([[11, 10], [15, 6], [15, 10]], P.orange); ps([[2, 8], [9, 7]], '#d8a42a'); ps([[5, 4], [6, 3]], '#7a3a8a'); },
  gen_toolkit: () => { R(1, 3, 14, 11, P.red); r(1, 3, 14, 2, dk(P.red, .25)); r(3, 6, 1, 6, P.steel); r(6, 6, 2, 6, P.gold); r(6, 6, 2, 2, P.steel); r(10, 6, 1, 6, P.steel); r(9, 6, 3, 2, P.steel); r(13, 7, 1, 5, P.dark); r(1, 12, 14, 1, dk(P.red, .25)); },
  gen_bath_salts: () => jarOf('#dff0f6', P.wood, () => { r(4, 8, 8, 6, '#8fcdf0'); ps([[5, 9], [8, 10], [10, 8], [6, 12], [10, 12]], P.white); ps([[7, 8], [9, 11]], P.blue); r(5, 6, 6, 1, P.cream); }),
  /* mall: sports, toys, beauty, stationery */
  mall_sport_bottle: () => { bottle(P.steel, 5, 1, 6, 14, P.teal); r(5, 8, 6, 1, dk(P.steel, .2)); r(6, 0, 4, 1, P.teal); },
  mall_sport_ball: () => { OV(1, 1, 14, 14, '#e8782a'); ln(8, 1, 8, 14, '#3a2a20'); ln(1, 8, 14, 8, '#3a2a20'); ps([[3, 3], [4, 4], [5, 6], [5, 10], [4, 12], [3, 13], [12, 3], [11, 4], [10, 6], [10, 10], [11, 12], [12, 13]], '#3a2a20'); },
  mall_toy_blocks: () => { R(4, 1, 4, 3, P.blue); R(8, 2, 4, 3, P.gold); R(6, 4, 4, 2, P.green); ps([[5, 0], [6, 0], [9, 1], [10, 1]], P.sky); PG([[1, 6], [15, 6], [13, 15], [3, 15]], P.red); r(1, 6, 14, 2, lt(P.red, .2)); r(5, 10, 6, 3, P.white); },
  mall_toy_kite: () => { PG([[8, 0], [14, 6], [8, 12], [2, 6]], P.leaf); ln(8, 1, 8, 11, dk(P.leaf, .3)); ln(3, 6, 13, 6, dk(P.leaf, .3)); ps([[6, 4], [10, 4]], P.lemon); p(8, 8, P.red); st([[8, 13], [9, 14], [10, 13], [11, 14], [12, 15]], P.red); st([[10, 15], [12, 13]], P.gold); },
  mall_toy_puzzle: () => { box('#3b7ea8', 1, 3, 14, 11); r(2, 4, 12, 6, '#8fcdf0'); r(2, 9, 12, 2, '#3b6fd0'); r(7, 5, 2, 5, P.white); r(7, 7, 2, 1, P.red); st([[10, 5], [11, 5]], P.lemon); ps([[3, 12], [4, 12], [6, 12], [7, 12]], P.cream); },
  mall_toy_gull: () => { OV(2, 5, 12, 9, P.white); OV(8, 1, 7, 7, P.white); PG([[14, 4], [16, 5], [14, 6]], P.orange); p(12, 3, '#2f2430'); PG([[2, 8], [9, 8], [6, 12]], '#b8bec8'); r(5, 14, 2, 2, P.orange); r(9, 14, 2, 2, P.orange); },
  mall_toy_yoyo: () => { st([[2, 2], [14, 2], [2, 14], [14, 14]], '#8ff0f0'); OV(2, 2, 12, 12, '#3b6fd0'); ov(4, 4, 8, 8, '#5cf0e0'); ov(5, 5, 6, 6, '#3b6fd0'); p(8, 8, P.white); sl(8, 2, 9, 0, P.white); },
  mall_toy_boardgame: () => { box('#8a5a38', 0, 3, 16, 11); r(1, 4, 14, 2, P.gold); for (const [x, y, c] of [[2, 7, P.leaf], [6, 7, P.gold], [10, 7, P.red], [4, 10, P.blue], [8, 10, P.leaf]]) { r(x, y, 4, 3, c); p(x, y, OL); p(x + 3, y, OL); } },
  mall_toy_rc_car: () => { ln(4, 6, 2, 0, P.slate); PG([[4, 6], [10, 6], [12, 9], [15, 9], [15, 12], [1, 12], [1, 9], [3, 9]], P.red); r(5, 7, 4, 2, '#8fcdf0'); r(2, 10, 12, 1, P.white); OV(2, 11, 4, 4, '#2f2c3a'); OV(10, 11, 4, 4, '#2f2c3a'); p(3, 12, P.steel); p(11, 12, P.steel); },
  mall_toy_cards: () => { PG([[8, 1], [15, 3], [13, 13], [6, 11]], P.white); p(11, 5, P.red); p(11, 9, P.red); R(1, 3, 9, 12, P.crimson); r(2, 4, 7, 10, P.cream); glyph('leaf', 3, 6, P.crimson, P.crimson, { soft: true }); },
  mall_toy_rocket: () => { PG([[8, 0], [11, 4], [11, 11], [5, 11], [5, 4]], P.white); PG([[8, 0], [10, 3], [6, 3]], P.red); ov(7, 5, 2, 3, P.sky); PG([[5, 8], [5, 13], [2, 13]], P.red); PG([[11, 8], [14, 13], [11, 13]], P.red); st([[7, 13], [8, 14], [7, 15], [8, 12], [9, 13]], P.orange); },
  mall_toy_dino: () => { PG([[0, 9], [4, 7], [6, 3], [10, 3], [11, 6], [10, 8], [9, 12], [3, 12]], '#4fae5a'); R(9, 1, 5, 4, '#4fae5a'); p(12, 2, '#2f2430'); r(11, 4, 3, 1, P.white); ps([[5, 3], [7, 2], [3, 6]], P.lemon); R(4, 12, 2, 3, '#3f8a48'); R(8, 12, 2, 3, '#3f8a48'); r(12, 8, 2, 1, P.red); r(13, 6, 2, 2, P.red); },
  mall_helmet: () => { OV(1, 2, 14, 12, P.white); clr(1, 11, 14, 4); r(1, 10, 14, 1, P.steel); for (const x of [4, 7, 10]) r(x, 4, 2, 4, '#3a3644'); r(4, 11, 1, 3, P.dark); r(11, 11, 1, 3, P.dark); r(5, 14, 6, 1, P.dark); },
  mall_helmet_skate: () => { OV(1, 1, 11, 10, '#2f2c3a'); clr(1, 8, 11, 4); r(1, 7, 11, 1, P.slate); ps([[4, 3], [7, 3], [5, 5], [8, 5]], P.steel); R(8, 9, 7, 6, P.dark); OV(9, 10, 5, 4, P.red); p(10, 11, P.white); },
  mall_beauty_lipstick: () => { PG([[6, 0], [10, 2], [10, 6], [6, 6]], '#f07a5a'); R(6, 6, 4, 3, P.steel); R(5, 9, 6, 6, P.gold); r(5, 11, 6, 1, dk(P.gold, .2)); },
  mall_beauty_perfume: () => { R(6, 0, 4, 3, P.teal); r(7, 3, 2, 2, P.gold); R(2, 5, 12, 10, '#d8f0ec'); r(4, 9, 8, 5, '#f6d890'); ln(4, 7, 4, 12, P.white); r(6, 7, 4, 1, P.cream); },
  mall_beauty_masks: () => { for (const [x, y, c] of [[0, 1, P.mint], [4, 3, P.pink], [8, 5, '#c8b8f0']]) { R(x, y, 8, 10, c); r(x + 1, y + 1, 6, 1, P.white); ov(x + 2, y + 4, 4, 4, P.white); } },
  mall_beauty_polish: () => { for (const [x, c] of [[0, P.pink], [5, P.red], [10, P.gold]]) { R(x + 1, 2, 3, 5, '#2f2c3a'); R(x, 7, 5, 8, c); p(x + 1, 9, lt(c, .5)); } },
  mall_beauty_soap: () => { st([[3, 1], [5, 2], [12, 1]], P.white); OV(0, 4, 16, 10, '#b890d8'); r(5, 4, 6, 10, P.cream); ps([[7, 7], [8, 8], [7, 10]], P.purple); OV(11, 1, 3, 3, '#eefaff'); },
  mall_stat_pens: () => { const c = [P.red, P.orange, P.gold, P.green, P.blue, P.purple]; c.forEach((k, i) => { r(1 + i * 2 + (i > 2 ? 1 : 0), 2 + (i % 2), 2, 9, k); p(1 + i * 2 + (i > 2 ? 1 : 0), 1 + (i % 2), dk(k, .3)); }); R(1, 9, 14, 6, '#e4e8ee'); r(3, 11, 10, 2, P.white); },
  mall_stat_planner: () => { R(2, 1, 12, 14, '#8a909c'); r(2, 1, 2, 14, '#6a707c'); r(11, 1, 1, 14, '#2f2c3a'); r(5, 4, 5, 3, P.cream); r(6, 5, 3, 1, P.grey); r(14, 4, 1, 2, P.red); r(14, 8, 1, 2, P.gold); },
  mall_stat_washi: () => { for (const [y, c, d] of [[1, P.pink, P.white], [6, P.mint, P.green], [11, P.gold, P.red]]) { OV(2, y, 12, 5, c); ov(6, y + 1, 4, 2, '#f4e6c8'); ps([[3, y + 3], [5, y + 4], [10, y + 4], [12, y + 3]], d); } },
  mall_stat_fountain: () => { PG([[10, 1], [14, 5], [7, 12], [3, 8]], '#2f2c3a'); ln(11, 3, 5, 9, '#5a5668'); r(8, 5, 2, 1, P.gold); PG([[3, 8], [7, 12], [2, 15], [1, 14]], P.gold); ln(2, 14, 4, 11, '#8a6a1a'); },
  mall_stat_cards: () => { R(4, 1, 11, 8, '#f4e6c8'); r(6, 3, 5, 1, P.rose); r(6, 5, 7, 1, P.grey); R(1, 6, 13, 9, P.cream); ln(1, 6, 7, 11, '#c8b48a'); ln(13, 6, 7, 11, '#c8b48a'); r(6, 10, 3, 2, P.red); },
  /* skydeck souvenirs */
  sky_snowglobe: () => { OV(2, 0, 12, 12, '#cfe9f4'); r(7, 4, 2, 7, P.slate); r(6, 6, 4, 1, P.red); p(7, 3, P.gold); p(8, 3, P.gold); st([[4, 3], [11, 4], [5, 7], [10, 8], [9, 2], [4, 9]], P.white); r(4, 10, 8, 1, P.white); R(2, 11, 12, 4, P.wood); r(5, 12, 6, 1, P.gold); },
  sky_magnet: () => { R(1, 2, 14, 12, P.sky); r(2, 3, 12, 6, '#f6c890'); for (const [a, h] of [[2, 3], [4, 5], [6, 2], [8, 7], [10, 4], [12, 2]]) r(a, 12 - h - 2, 2, h + 1, '#3a3f6a'); r(2, 11, 12, 2, P.navy); ps([[4, 12], [6, 12], [8, 12], [10, 12]], P.cream); },
  sky_model: () => { for (const [a, h, c] of [[2, 5, P.steel], [5, 8, '#aab4c0'], [8, 11, P.steel], [11, 6, '#aab4c0']]) { R(a, 12 - h, 3, h, c); for (let j = 13 - h; j < 11; j += 2) p(a + 1, j, P.gold); } p(9, 0, P.red); R(0, 12, 16, 3, P.dark); r(4, 13, 8, 1, P.gold); },
  /* category & word-fallback glyphs */
  'cat.book': () => book(P.blue, em('star', P.gold)),
  'cat.gift': () => giftBox(P.pink, P.crimson),
  'cat.misc': () => { PG([[1, 5], [8, 2], [15, 5], [8, 8]], '#e8c48a'); R(1, 5, 7, 9, P.tan); R(8, 5, 7, 9, dk(P.tan, .12)); ln(4, 4, 11, 7, P.cream); r(10, 9, 3, 2, P.cream); },
  'glyph.ticket': () => ticket('#f6e6c0', () => { r(2, 6, 7, 1, P.red); r(2, 8, 5, 1, P.grey); r(12, 6, 3, 4, P.red); }),
  'glyph.card': () => card(P.teal, () => { r(3, 5, 4, 3, P.gold); r(3, 10, 9, 1, P.cream); }),
  'glyph.toy': () => MISC.gen_toy_robot(),
  'glyph.pen': () => MISC.mall_stat_fountain(),
  'glyph.bottle': () => { bottle('#5aa8d8', 5, 1, 6, 14, P.white); r(5, 8, 6, 3, P.white); },
  'glyph.flower': () => MISC.gift_flowers(),
  'glyph.ball': () => MISC.mall_sport_ball(),
  'glyph.box': () => { box('#c8a068', 1, 4, 14, 10, '#d8b078'); r(7, 4, 2, 10, P.cream); },
  'glyph.bag': () => paperBag('#d8b078', () => r(6, 8, 4, 3, P.cream)),
  'glyph.jar': () => jarOf('#f2b020', P.red, () => r(5, 8, 6, 4, P.cream)),
  'glyph.helmet': () => MISC.mall_helmet(),
  'glyph.record': () => MISC.gen_vinyl(),
  'glyph.soap': () => MISC.mall_beauty_soap(),
  'glyph.key': () => { OV(1, 2, 7, 7, P.gold); ov(3, 4, 3, 3, '#8a6a1a'); clr(4, 5, 1, 1); R(7, 5, 8, 2, P.gold); r(11, 7, 2, 2, P.gold); r(14, 7, 1, 2, P.gold); },
};
