// 16x16 item icons for the Museum of Maple Bay goods (registered into ICONS by sim/museum.js).
import { icon, R, r, OV, ov, PG, ps, ln, p, st, P, sparkle, steam } from '../icons/_lib.js';
const frame = (a, b, c, d) => () => { R(1, 3, 14, 11, '#3a3440'); r(2, 4, 12, 9, a); r(2, 9, 12, 4, b); c && c(); };
export const MUS_ICONS = {
  mus_print_dawn: icon(frame('#d8808a', '#4a5a8a', () => { ov(9, 5, 3, 3, '#fff4c8'); r(4, 6, 1, 5, '#3a2c34'); ps([[5, 7], [5, 8], [6, 8]], '#f4e6c8'); })),
  mus_print_maple: icon(frame('#f4ecd8', '#f4ecd8', () => { ov(5, 5, 6, 6, '#c8342a'); ps([[8, 4], [4, 7], [11, 7], [5, 10], [10, 10]], '#c8342a'); r(8, 10, 1, 3, '#7a2a20'); })),
  mus_print_tram: icon(frame('#2a3058', '#1c2040', () => { r(4, 6, 9, 4, '#c8402f'); ps([[5, 7], [7, 7], [9, 7], [11, 7]], '#ffe08a'); ps([[5, 11], [8, 12], [10, 11]], '#f4c860'); })),
  mus_print_koi: icon(frame('#1f5a60', '#1f5a60', () => { ps([[5, 6], [6, 5], [7, 5], [8, 6], [9, 7]], '#f08a2a'); ps([[10, 10], [9, 11], [8, 11], [7, 10], [6, 9]], '#f8f0e0'); p(6, 9, '#e8483b'); })),
  mus_dino_model: icon(() => { R(2, 12, 12, 3, P.wood); ln(2, 6, 6, 8, '#eadfc4'); ln(6, 8, 10, 6, '#eadfc4'); r(10, 3, 4, 3, '#eadfc4'); p(12, 4, P.ol); ln(7, 8, 8, 11, '#eadfc4'); ps([[7, 9], [9, 9], [6, 9]], '#eadfc4'); ps([[11, 6], [13, 6]], '#fff4dc'); }),
  mus_plush_rex: icon(() => { OV(3, 6, 8, 8, P.leaf); OV(8, 2, 6, 5, P.leaf); p(12, 4, P.ol); ps([[10, 6], [12, 6]], P.white); ps([[9, 9], [10, 9]], P.green); r(4, 13, 2, 2, P.green); r(8, 13, 2, 2, P.green); ps([[2, 9], [1, 10]], P.leaf); }),
  mus_ammonite: icon(() => { OV(2, 2, 12, 12, P.tan); ov(4, 4, 8, 8, P.brown); ov(5, 5, 6, 6, P.tan); ov(7, 7, 3, 3, P.brown); ps([[3, 7], [7, 3], [12, 8], [8, 12]], P.coffee); }),
  mus_geode: icon(() => { OV(1, 4, 14, 10, P.grey); ov(3, 6, 10, 6, P.purple); ps([[5, 8], [8, 7], [10, 9], [7, 10]], P.violet); st([[6, 7], [9, 8]], '#fff8e0'); sparkle(12, 3); }),
  mus_postcards: icon(() => { R(2, 5, 9, 7, '#d8808a'); R(4, 4, 9, 7, '#9ad0f0'); R(6, 6, 9, 7, P.cream); r(7, 7, 4, 3, '#e8483b'); ps([[12, 8], [13, 8], [12, 10], [13, 10]], P.grey); }),
  mus_tin_robot: icon(() => { R(5, 1, 6, 5, P.steel); ps([[6, 3], [9, 3]], P.yellow); R(4, 6, 8, 6, P.red); ov(6, 7, 4, 4, P.cream); r(5, 12, 2, 3, P.slate); r(9, 12, 2, 3, P.slate); r(2, 7, 2, 4, P.steel); r(12, 7, 2, 4, P.steel); p(8, 0, P.red); }),
  mus_snowglobe: icon(() => { OV(2, 1, 12, 11, P.ice); r(6, 6, 2, 5, P.grey); r(8, 4, 2, 7, P.steel); r(10, 7, 2, 4, P.grey); st([[4, 4], [11, 3], [6, 3], [12, 6], [4, 8]], '#ffffff'); R(3, 11, 10, 4, P.wood); }),
  mus_book_history: icon(() => { R(3, 1, 10, 14, P.navy); r(4, 2, 1, 12, P.blue); r(7, 4, 2, 6, P.gold); ps([[6, 10], [9, 10], [7, 3], [8, 3]], P.gold); }),
  mus_book_looking: icon(() => { R(3, 1, 10, 14, P.cream); r(4, 2, 1, 12, P.shade); r(6, 4, 5, 5, P.red); r(6, 11, 5, 1, P.dark); }),
  mus_sketchkit: icon(() => { R(2, 3, 9, 11, P.grey); r(3, 4, 7, 9, P.paper); ln(4, 10, 8, 6, P.dark); ln(11, 13, 14, 2, P.yellow); ln(12, 13, 15, 3, P.red); p(11, 14, P.ol); }),
  mus_badge: icon(() => { OV(2, 2, 12, 12, P.gold); ov(4, 4, 8, 8, P.yellow); ps([[6, 8], [7, 8], [8, 7], [9, 6], [10, 6], [7, 9], [9, 9]], P.green); sparkle(12, 3); }),
  mus_curator_coffee: icon(() => { R(3, 6, 8, 7, P.white); r(4, 7, 6, 2, P.coffee); ps([[11, 8], [12, 8], [12, 9], [12, 10], [11, 10]], P.white); r(2, 13, 10, 1, P.shade); steam(5, 1); }),
  mus_mammoth_cocoa: icon(() => { R(3, 6, 9, 8, P.brown); OV(3, 3, 9, 5, P.cream); ps([[5, 5], [9, 5]], P.choc); ps([[12, 8], [13, 9], [12, 11]], P.brown); steam(6, 0); }),
  mus_fossil_shortbread: icon(() => { OV(2, 3, 12, 10, P.bread); ov(5, 5, 6, 6, P.crust); ov(6, 6, 4, 4, P.bread); p(8, 8, P.crust); }),
  mus_tomato_soup: icon(() => { OV(1, 6, 11, 8, P.white); ov(2, 7, 9, 4, P.tomato); ps([[5, 8], [7, 9]], P.leaf); OV(10, 3, 5, 5, P.bread); }),
  mus_grilled_cheese: icon(() => { PG([[1, 12], [8, 3], [15, 12]], P.bread); PG([[3, 11], [8, 5], [13, 11]], P.gold); r(2, 12, 12, 2, P.crust); ps([[6, 13], [10, 13]], P.yellow); }),
  mus_lemon_dome: icon(() => { OV(3, 4, 10, 10, P.lemon); r(3, 10, 10, 4, P.lemon); ps([[6, 4], [7, 3], [8, 3], [9, 4], [5, 5], [10, 5]], P.teal); R(2, 13, 12, 2, P.white); sparkle(11, 6); }),
};
