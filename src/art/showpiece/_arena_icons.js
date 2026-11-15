// Maple Bay Arena — 16x16 item icons for the `arena_*` items (registered into the shared ICONS table; no world assets here).
import { ICONS } from '../icons/icons.js';
import { icon, R, r, OV, ov, PG, ln, p, ps, st, P, steam, sparkle } from '../icons/_lib.js';
const RED = '#d2392f', CRM = '#f4f0e8', ORG = '#e0762c', FUR = '#9a6a3c';
const bball = (x, y, s, c = ORG) => { OV(x, y, s, s, c); ln(x + (s >> 1), y, x + (s >> 1), y + s - 1, P.dark); ln(x, y + (s >> 1), x + s - 1, y + (s >> 1), P.dark); };
const I = {
  arena_hotdog: () => { OV(1, 6, 14, 6, P.bread); R(2, 6, 12, 3, '#c0563a'); ps([[3, 6], [5, 7], [7, 6], [9, 7], [11, 6], [13, 7]], P.yellow); r(2, 10, 12, 1, P.crust); },
  arena_chili_dog: () => { OV(1, 6, 14, 7, P.bread); R(2, 5, 12, 4, '#8a3a26'); ps([[3, 5], [6, 6], [9, 5], [12, 6], [5, 7], [10, 7]], P.yellow); ps([[4, 6], [8, 6], [11, 5]], '#c0563a'); r(2, 11, 12, 1, P.crust); },
  arena_nachos: () => { PG([[1, 8], [15, 8], [13, 14], [3, 14]], RED); PG([[2, 8], [5, 2], [8, 8]], P.yellow); PG([[6, 8], [9, 3], [12, 8]], P.gold); PG([[10, 8], [13, 4], [15, 8]], P.yellow); ps([[5, 6], [9, 6], [12, 7]], '#f08a2c'); ps([[4, 7], [10, 5]], P.green); },
  arena_corn_dog: () => { ln(8, 10, 8, 15, P.tan); OV(5, 1, 6, 10, '#d6924a'); ps([[7, 3], [7, 4], [8, 5], [8, 6], [7, 7]], P.yellow); },
  arena_pretzel: () => { OV(1, 2, 14, 12, P.crust); ov(3, 4, 4, 4, '#00000000'); ov(4, 5, 3, 3, P.cream); ov(9, 5, 3, 3, P.cream); ov(6, 9, 4, 3, P.cream); ps([[3, 3], [8, 3], [12, 4], [5, 12], [11, 11], [2, 8], [13, 8]], P.white); },
  arena_popcorn: () => { PG([[3, 6], [13, 6], [12, 15], [4, 15]], P.white); for (const x of [4, 7, 10]) PG([[x, 6], [x + 2, 6], [x + 1.6, 15], [x + .4, 15]], RED); OV(2, 1, 5, 5, '#fff2a8'); OV(6, 0, 5, 5, P.cream); OV(10, 2, 4, 4, '#fff2a8'); },
  arena_soda: () => { PG([[4, 4], [12, 4], [11, 15], [5, 15]], RED); r(3, 3, 10, 2, P.white); ln(9, 0, 8, 4, P.yellow); OV(6, 7, 4, 4, FUR); p(7, 8, P.black); p(8, 8, P.black); },
  arena_lemonade: () => { PG([[4, 3], [12, 3], [11, 15], [5, 15]], '#f7e35a'); r(4, 3, 8, 1, P.ice); OV(9, 0, 5, 5, P.lemon); p(11, 2, P.white); ln(6, 1, 7, 6, P.pink); ps([[6, 8], [9, 10], [7, 12]], P.white); },
  arena_cotton_candy: () => { PG([[7, 9], [9, 9], [8, 16]], P.paper); OV(2, 1, 12, 9, P.pink); ov(4, 2, 4, 3, '#f8b8d0'); ov(9, 5, 3, 3, P.rose); },
  arena_foam_finger: () => { PG([[3, 8], [13, 8], [12, 15], [4, 15]], RED); R(6, 0, 4, 9, RED); r(3, 7, 3, 2, RED); p(7, 11, CRM); p(8, 10, CRM); p(8, 11, CRM); p(8, 12, CRM); p(8, 13, CRM); p(7, 13, CRM); p(9, 13, CRM); },
  arena_card_pack: () => { R(3, 1, 10, 14, RED); r(3, 1, 10, 2, P.gold); r(3, 13, 10, 2, P.gold); OV(6, 5, 5, 5, FUR); p(7, 6, P.black); p(9, 6, P.black); sparkle(12, 3, P.white); },
  arena_program: () => { R(3, 1, 10, 14, RED); r(3, 1, 2, 14, '#a82a26'); r(6, 3, 6, 1, CRM); R(7, 6, 3, 4, CRM); OV(7, 4, 3, 3, P.skin); bball(10, 10, 3); },
  arena_pennant: () => { ln(2, 1, 2, 15, P.wood); PG([[3, 2], [15, 6], [3, 10]], RED); r(4, 5, 5, 2, CRM); },
  arena_plush_ollie: () => { OV(3, 0, 10, 8, FUR); p(3, 0, '#6a4226'); p(12, 0, '#6a4226'); OV(6, 4, 4, 3, '#f0dcb8'); ps([[5, 3], [10, 3]], P.black); p(8, 4, P.black); R(4, 8, 8, 6, RED); p(8, 10, CRM); p(8, 11, CRM); r(4, 14, 3, 2, FUR); r(9, 14, 3, 2, FUR); },
  arena_mini_ball: () => { bball(2, 2, 12); ln(4, 4, 6, 11, P.dark); ln(11, 4, 9, 11, P.dark); },
  arena_scarf: () => { for (let i = 0; i < 6; i++) r(1 + i * 2, 3, 2, 4, i % 2 ? CRM : RED); R(11, 3, 4, 4, RED); for (let j = 0; j < 4; j++) r(10, 7 + j * 2, 4, 2, j % 2 ? RED : CRM); ps([[10, 15], [12, 15]], RED); },
  arena_jersey: () => { PG([[3, 1], [6, 1], [8, 3], [10, 1], [13, 1], [13, 15], [3, 15]], RED); r(6, 1, 1, 2, CRM); r(9, 1, 1, 2, CRM); r(3, 14, 10, 1, CRM); ps([[6, 7], [7, 6], [7, 7], [7, 8], [7, 9], [7, 10], [9, 6], [10, 6], [10, 7], [9, 8], [10, 8], [9, 9], [9, 10], [10, 10]], CRM); },
  arena_tshirt: () => { PG([[1, 4], [5, 2], [11, 2], [15, 4], [13, 7], [12, 6], [12, 15], [4, 15], [4, 6], [3, 7]], CRM); r(6, 2, 4, 1, RED); OV(6, 6, 4, 4, RED); p(7, 7, CRM); p(8, 7, CRM); },
  arena_signed_ball: () => { bball(1, 1, 14); ps([[4, 5], [5, 4], [6, 5], [7, 4], [9, 10], [10, 11], [11, 10], [12, 11], [5, 10], [6, 11]], P.black); sparkle(13, 2, P.white); },
  arena_gold_card: () => { R(3, 1, 10, 14, P.gold); r(4, 2, 8, 12, '#f6d24a'); OV(6, 4, 5, 5, '#a8762a'); R(6, 9, 5, 4, '#a8762a'); sparkle(12, 2, P.white); sparkle(3, 12, P.white); },
  arena_lucky_ball: () => { bball(1, 1, 14, '#b8743a'); ps([[4, 5], [5, 6], [9, 9], [10, 10], [11, 9]], '#6a4226'); st([[0, 0], [15, 1], [14, 14], [1, 13]], '#fff2a8'); },
};
for (const k in I) if (!ICONS[k]) ICONS[k] = icon(I[k]);
export const ARENA_ICONS = Object.keys(I);
export const galleryItems = Object.keys(I).map(id => ({ id: 'icon.' + id, sb: [0, 0, 16, 16], draw: ICONS[id] }));
export default [];
