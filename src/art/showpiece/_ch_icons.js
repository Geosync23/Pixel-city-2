// 16x16 item icons for the Maple Bay City Hall goods (registered into ICONS by sim/cityhall.js).
import { icon, R, r, OV, ov, PG, ps, ln, p, P, sparkle } from '../icons/_lib.js';
const leaf = (x, y, c = P.crimson) => { ps([[x, y - 2], [x - 1, y - 1], [x, y - 1], [x + 1, y - 1], [x - 2, y], [x - 1, y], [x, y], [x + 1, y], [x + 2, y], [x - 1, y + 1], [x, y + 1], [x + 1, y + 1], [x, y + 2]], c); };
const paper = f => () => { R(3, 1, 10, 14, P.paper); ln(5, 4, 10, 4, P.slate); ln(5, 6, 10, 6, P.grey); ln(5, 8, 9, 8, P.grey); f && f(); };
const framed = f => () => { R(1, 2, 14, 12, P.wood); r(3, 4, 10, 8, P.paper); f(); };
const key = c => () => { OV(1, 2, 7, 7, c); ov(3, 4, 3, 3, P.dark); r(7, 5, 8, 2, c); r(12, 7, 2, 3, c); r(9, 7, 1, 2, c); };
export const CH_ICONS = {
  ch_resident_id: icon(() => { R(1, 3, 14, 10, '#2f8a6a'); r(2, 6, 12, 6, P.paper); r(3, 7, 4, 4, P.sky); r(4, 8, 2, 2, P.skin); ln(8, 7, 12, 7, P.slate); ln(8, 9, 11, 9, P.grey); ov(11, 9, 3, 3, P.gold); }),
  ch_dog_licence: icon(() => { OV(2, 5, 5, 5, P.gold); OV(9, 5, 5, 5, P.gold); R(4, 6, 8, 3, P.gold); ov(7, 2, 3, 3, P.steel); ps([[6, 7], [8, 7], [10, 7]], P.brown); }),
  ch_bike_licence: icon(() => { R(2, 4, 12, 8, '#2f8a6a'); r(3, 5, 10, 6, P.green); ps([[5, 7], [5, 8], [5, 9], [7, 7], [8, 7], [8, 8], [7, 9], [8, 9], [10, 7], [11, 7], [11, 8], [11, 9]], P.white); ps([[3, 5], [12, 5]], P.steel); }),
  ch_busk_permit: icon(paper(() => { ln(8, 9, 8, 13, P.dark); ov(6, 12, 3, 2, P.dark); ps([[9, 9], [10, 10]], P.dark); ov(10, 10, 4, 4, P.red); })),
  ch_stall_permit: icon(paper(() => { r(5, 10, 6, 1, P.red); ps([[5, 11], [7, 11], [9, 11]], P.red); ps([[6, 11], [8, 11], [10, 11]], P.white); r(5, 12, 1, 2, P.brown); r(10, 12, 1, 2, P.brown); ov(10, 1, 4, 4, P.red); })),
  ch_confetti: icon(() => { PG([[3, 6], [13, 6], [8, 15]], P.paper); ps([[5, 7], [8, 9], [10, 7]], P.pink); ps([[4, 2], [9, 1], [12, 4], [6, 4]], P.gold); ps([[7, 2], [11, 2], [3, 4], [13, 2]], P.sky); ps([[5, 1], [10, 4], [8, 5]], P.rose); }),
  ch_workorder: icon(() => { R(3, 2, 10, 13, '#e8d8a0'); r(6, 1, 4, 2, P.steel); ln(5, 5, 10, 5, P.slate); ln(5, 7, 10, 7, P.grey); ln(5, 9, 8, 9, P.grey); ov(8, 10, 4, 4, P.blue); p(10, 12, P.sky); }),
  ch_valve_key: icon(() => { key('#c89a4a')(); R(1, 10, 5, 5, P.paper); ln(4, 8, 3, 10, P.brown); p(3, 12, P.slate); }),
  ch_city_key: icon(() => { key(P.gold)(); ln(4, 9, 2, 14, P.green); ln(5, 9, 7, 14, P.green); sparkle(13, 2); }),
  ch_seal_pin: icon(() => { OV(3, 2, 10, 10, P.gold); ov(4, 3, 8, 8, P.navy); leaf(8, 7); r(7, 12, 2, 3, P.steel); }),
  ch_paperweight: icon(() => { R(2, 11, 12, 4, P.wood); OV(3, 1, 10, 10, P.gold); ov(5, 3, 6, 6, P.tan); leaf(8, 6); }),
  ch_mug: icon(() => { R(3, 4, 8, 10, P.white); ps([[11, 6], [12, 7], [12, 9], [11, 10]], P.white); r(5, 7, 4, 1, P.green); r(6, 9, 2, 3, P.brown); r(5, 8, 4, 2, P.wood); }),
  ch_gavel: icon(() => { R(2, 3, 9, 4, P.wood); r(3, 3, 1, 4, P.gold); r(9, 3, 1, 4, P.gold); ln(7, 7, 12, 12, P.brown); ln(8, 7, 13, 12, P.brown); R(2, 12, 8, 3, P.choc); }),
  ch_postcards: icon(() => { R(2, 4, 11, 9, P.paper); R(4, 2, 11, 9, P.sky); r(4, 8, 11, 3, P.shade); r(8, 3, 3, 6, P.paper); r(9, 2, 1, 1, P.teal); p(9, 5, P.gold); }),
  ch_pigeon: icon(() => { OV(3, 5, 9, 8, P.grey); OV(9, 2, 5, 5, P.grey); ps([[14, 4], [15, 4]], P.orange); p(12, 3, P.black); ln(4, 8, 9, 11, P.rose); ps([[6, 13], [9, 13]], P.orange); r(4, 6, 4, 3, P.slate); }),
  ch_flag: icon(framed(() => { r(3, 4, 10, 8, '#2f8a6a'); ov(6, 6, 4, 4, P.white); p(8, 8, P.crimson); p(7, 7, P.crimson); p(8, 7, P.crimson); })),
  ch_print_map: icon(framed(() => { ln(3, 7, 12, 7, P.tan); ln(7, 4, 7, 11, P.tan); ln(10, 4, 10, 11, P.tan); r(3, 10, 6, 2, P.sky); p(5, 5, P.crimson); })),
  ch_print_plaza: icon(framed(() => { r(3, 4, 10, 8, '#d8c8a8'); r(3, 9, 10, 3, '#b8a888'); r(7, 6, 2, 4, P.brown); r(5, 9, 6, 1, P.brown); ps([[4, 8], [11, 8], [12, 9]], P.choc); p(8, 5, P.white); })),
  ch_print_courier: icon(framed(() => { r(4, 5, 8, 2, P.black); ln(4, 8, 7, 8, P.grey); ln(4, 10, 7, 10, P.grey); r(9, 8, 3, 3, P.shade); })),
  ch_print_blueprint: icon(framed(() => { r(3, 4, 10, 8, P.navy); ln(4, 10, 11, 10, P.ice); ln(7, 6, 7, 10, P.ice); ln(8, 6, 8, 10, P.ice); ln(5, 8, 10, 8, P.ice); p(11, 6, P.gold); })),
};
