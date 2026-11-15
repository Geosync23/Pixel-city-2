// 16x16 item icons for the Grand Maple Hotel goods (registered into ICONS by sim/hotel.js).
import { icon, R, r, OV, ov, PG, ps, ln, p, st, P, sparkle, steam } from '../icons/_lib.js';
const coupe = (c, g) => () => { PG([[2, 3], [14, 3], [8, 9]], c); r(7, 9, 2, 4, P.ice); r(5, 13, 6, 1, P.ice); ps([[4, 3], [5, 3]], P.cream); g && g(); };
const tall = (c, g) => () => { R(5, 2, 6, 12, c); r(5, 2, 6, 2, P.ice); ps([[6, 5], [6, 6]], P.cream); g && g(); };
const plate = f => () => { OV(1, 5, 14, 9, P.white); ov(3, 7, 10, 5, P.paper); f(); };
const gold = '#e8c06a';
export const HOTEL_ICONS = {
  hotel_ck_weathervane: icon(coupe('#c8e8b0', () => { ln(10, 1, 12, 5, P.green); ps([[11, 2], [12, 3]], P.leaf); })),
  hotel_ck_maple: icon(() => { R(4, 6, 8, 8, '#c8782a'); r(4, 6, 8, 1, P.ice); r(6, 8, 3, 3, P.ice); ps([[10, 5], [11, 4], [12, 5]], P.orange); p(5, 8, P.cream); }),
  hotel_ck_fog: icon(tall('#a8c8e8', () => { ov(9, 1, 5, 5, P.lemon); p(11, 3, P.yellow); })),
  hotel_ck_golden: icon(() => { OV(3, 2, 10, 8, '#f09a3a'); r(3, 2, 10, 2, P.ice); r(7, 10, 2, 3, P.ice); r(5, 13, 6, 1, P.ice); ps([[5, 5], [8, 6], [10, 4]], P.cream); ov(10, 1, 4, 4, P.orange); }),
  hotel_ck_garden: icon(tall('#b8e0b0', () => { ps([[7, 8], [8, 10], [9, 7]], P.green); ps([[9, 1], [10, 0], [11, 1]], P.leaf); })),
  hotel_ck_house: icon(coupe('#c8243a', () => { ps([[2, 2], [5, 2], [8, 2], [11, 2], [14, 2]], gold); p(8, 5, P.crimson); sparkle(12, 7); })),
  hotel_olives: icon(() => { OV(2, 7, 12, 7, P.white); ov(3, 7, 10, 4, P.paper); ps([[5, 8], [8, 7], [10, 9], [7, 9]], '#6a8a3a'); ps([[6, 9], [9, 8], [11, 8]], P.tan); p(8, 7, P.red); }),
  hotel_sliders: icon(plate(() => { OV(3, 4, 5, 4, P.bread); r(3, 7, 5, 1, P.peach); r(3, 8, 5, 2, P.bread); OV(8, 5, 5, 4, P.bread); r(8, 8, 5, 1, P.peach); r(8, 9, 5, 2, P.bread); p(5, 2, P.wood); p(10, 3, P.wood); })),
  hotel_d_chowder: icon(() => { OV(1, 6, 14, 8, P.white); ov(3, 7, 10, 4, '#f4ecd0'); ps([[5, 8], [8, 9], [10, 8]], P.green); ps([[7, 8], [9, 9]], P.peach); steam(6, 1); }),
  hotel_d_beet: icon(plate(() => { ov(4, 6, 4, 4, '#a8243e'); ov(8, 7, 4, 4, '#b8343e'); ps([[6, 6], [10, 7], [8, 10]], P.white); ps([[5, 10], [11, 6]], P.leaf); })),
  hotel_d_halibut: icon(plate(() => { OV(4, 6, 8, 4, '#f8f0e0'); ps([[4, 10], [6, 11], [9, 11], [11, 10]], P.leaf); ov(11, 5, 3, 3, P.lemon); })),
  hotel_d_duck: icon(plate(() => { for (let i = 0; i < 4; i++) { r(4 + i * 2, 6 + (i & 1), 2, 4, '#8a4a2e'); r(4 + i * 2, 7 + (i & 1), 1, 2, '#d88a8a'); } ps([[4, 11], [7, 11], [10, 11]], '#5a2a1e'); })),
  hotel_d_risotto: icon(() => { OV(1, 6, 14, 8, P.white); ov(3, 7, 10, 4, '#e8d8a8'); ps([[5, 8], [9, 9], [7, 7]], P.brown); ps([[10, 8], [6, 9]], P.leaf); steam(7, 1); }),
  hotel_d_tart: icon(plate(() => { OV(4, 6, 8, 5, P.bread); ov(5, 7, 6, 3, '#c8782a'); ps([[8, 7], [7, 8], [9, 8], [8, 9]], P.red); ov(11, 5, 3, 3, P.white); })),
  hotel_d_souffle: icon(() => { R(4, 8, 8, 6, P.white); OV(3, 3, 10, 7, P.choc); ps([[6, 4], [9, 5]], P.coffee); st([[5, 2], [8, 1], [10, 2]], P.white); }),
  hotel_rs_club: icon(plate(() => { PG([[3, 10], [7, 4], [11, 10]], P.bread); r(4, 8, 6, 1, P.leaf); r(4, 9, 6, 1, P.tomato); ps([[7, 3], [7, 2]], P.wood); ps([[11, 8], [12, 7], [12, 9], [13, 8]], P.gold); })),
  hotel_rs_cocoa: icon(() => { R(2, 6, 7, 7, P.white); r(3, 7, 5, 2, P.choc); ps([[9, 8], [10, 8], [10, 9], [10, 10], [9, 10]], P.white); OV(10, 10, 5, 4, P.bread); ps([[11, 11], [13, 12]], P.choc); steam(4, 1); }),
  hotel_rs_breakfast: icon(() => { R(1, 11, 14, 3, P.steel); OV(2, 6, 6, 5, P.white); ov(4, 7, 3, 3, P.yellow); R(9, 7, 3, 4, P.bread); R(12, 5, 3, 6, P.orange); r(12, 5, 3, 1, P.ice); }),
  hotel_spa_salts: icon(() => { R(4, 5, 8, 9, P.ice); r(5, 8, 6, 5, '#6ab0d8'); R(5, 2, 6, 3, P.tan); ps([[6, 9], [9, 11], [8, 8]], P.white); }),
  hotel_spa_oil: icon(() => { R(5, 5, 6, 9, '#b8782a'); r(6, 8, 4, 3, P.green); R(6, 2, 4, 3, P.black); p(7, 6, P.cream); }),
  hotel_spa_mask: icon(() => { R(4, 4, 8, 10, '#5aa878'); r(5, 6, 6, 4, P.mint); R(5, 1, 6, 3, P.white); ps([[7, 7], [8, 8], [9, 7]], P.green); }),
  hotel_keyfob: icon(() => { OV(2, 2, 7, 7, gold); ov(4, 4, 3, 3, '#a87a2c'); ln(8, 8, 13, 13, P.grey); ps([[12, 11], [13, 10], [11, 13]], P.grey); ps([[2, 9], [2, 10], [3, 11], [3, 12]], P.red); }),
  hotel_bear: icon(() => { OV(3, 6, 10, 9, P.brown); OV(4, 2, 8, 7, P.brown); ov(6, 5, 4, 3, P.tan); ps([[6, 4], [9, 4]], P.ol); p(8, 6, P.ol); R(5, 0, 6, 2, P.red); r(5, 2, 6, 1, gold); ps([[3, 3], [12, 3]], P.brown); }),
  hotel_postcards: icon(() => { R(2, 5, 9, 7, '#9ad0f0'); R(4, 3, 10, 8, P.cream); r(6, 6, 6, 4, '#ead9bd'); r(8, 8, 2, 2, P.red); ps([[7, 7], [10, 7]], '#5a8ab0'); R(5, 4, 2, 2, P.rose); }),
  hotel_chocolates: icon(() => { R(2, 5, 12, 9, gold); r(3, 6, 10, 7, '#3a2a22'); for (let j = 0; j < 2; j++) for (let i = 0; i < 3; i++) ov(4 + i * 3, 7 + j * 3, 2, 2, j ^ (i & 1) ? P.choc : P.coffee); ln(2, 4, 13, 4, P.red); sparkle(13, 3); }),
  hotel_slippers: icon(() => { OV(2, 5, 6, 9, P.white); OV(8, 4, 6, 9, P.white); ov(3, 6, 4, 4, P.shade); ov(9, 5, 4, 4, P.shade); ps([[5, 11], [11, 10]], gold); }),
  hotel_tag: icon(() => { PG([[4, 2], [12, 2], [12, 13], [4, 13]], '#7a2030'); r(6, 6, 4, 5, P.cream); ps([[7, 8], [8, 8], [7, 10]], P.dark); ov(7, 3, 2, 2, gold); ln(8, 0, 8, 2, P.tan); }),
  outfit_hotel_robe: icon(() => { PG([[4, 2], [12, 2], [14, 6], [12, 7], [12, 14], [4, 14], [4, 7], [2, 6]], P.white); ln(8, 3, 8, 13, P.shade); ln(5, 2, 8, 7, P.shade); ln(11, 2, 8, 7, P.shade); r(4, 9, 8, 1, P.shade); ps([[10, 6], [10, 7]], gold); }),
};
