// 16x16 item icons for the Maple Bay Post goods (registered into ICONS by sim/post.js). Also 'app.post' / 'ui.mail' style glyphs used by the phone app.
import { icon, R, r, OV, ov, PG, ps, ln, p, P, sparkle } from '../icons/_lib.js';
const BL = '#2756a8', env = (c = P.white, st = P.crimson) => () => { R(1, 4, 14, 9, c); ln(1, 4, 8, 9, P.shade); ln(15, 4, 8, 9, P.shade); if (st) r(11, 5, 3, 3, st); };
const card = (f) => () => { R(1, 3, 14, 10, P.white); f(); };
const framed = f => () => { R(1, 2, 14, 12, P.wood); r(3, 4, 10, 8, P.paper); f(); };
const hornI = (x, y, c = P.gold) => ps([[x - 3, y], [x - 2, y - 1], [x - 1, y - 1], [x, y - 1], [x + 1, y], [x, y + 1], [x - 1, y + 1], [x - 2, y + 1], [x + 2, y], [x + 3, y - 1], [x + 4, y - 2], [x + 4, y - 1], [x + 4, y], [x + 4, y + 1], [x + 3, y + 1]], c);
const PC = {
  light: () => { r(2, 4, 12, 8, P.sky); r(2, 10, 12, 2, P.navy); r(7, 5, 2, 6, P.white); p(7, 7, P.crimson); p(8, 7, P.crimson); r(7, 4, 2, 1, P.gold); },
  cityhall: () => { r(2, 4, 12, 8, P.ice); r(4, 8, 8, 4, P.paper); r(7, 4, 2, 5, P.paper); p(7, 6, P.dark); p(8, 4, P.green); },
  harbor: () => { r(2, 4, 12, 8, P.sky); r(2, 9, 12, 3, P.blue); ps([[4, 9], [5, 9], [6, 9], [7, 9]], P.wood); ln(5, 5, 5, 8, P.dark); ps([[6, 6], [6, 7], [7, 7]], P.white); ps([[10, 9], [11, 9], [12, 9]], P.crimson); },
  otters: () => { r(2, 4, 12, 8, P.teal); ov(5, 5, 6, 6, P.brown); ps([[6, 7], [9, 7]], P.black); ps([[7, 9], [8, 9]], P.cream); },
  market: () => { r(2, 4, 12, 8, P.peach); r(3, 6, 10, 2, P.crimson); ps([[4, 6], [6, 6], [8, 6], [10, 6], [12, 6]], P.white); r(4, 9, 3, 2, P.orange); r(8, 9, 3, 2, P.leaf); },
  park: () => { r(2, 4, 12, 8, P.leaf); ov(5, 7, 7, 4, P.sky); ov(3, 4, 4, 4, P.green); p(8, 9, P.white); },
  skyline: () => { r(2, 4, 12, 8, P.violet); r(3, 7, 2, 5, P.navy); r(6, 5, 2, 7, P.navy); r(9, 8, 2, 4, P.navy); r(12, 6, 2, 6, P.navy); ps([[6, 6], [12, 8], [3, 9]], P.yellow); },
  tram: () => { r(2, 4, 12, 8, P.ice); r(2, 9, 12, 1, P.grey); r(4, 6, 8, 3, P.green); ps([[5, 7], [7, 7], [9, 7]], P.ice); ln(4, 10, 4, 11, P.slate); ln(11, 10, 11, 11, P.slate); },
};
export const POST_ICONS = {
  post_paper: icon(() => { R(2, 2, 10, 12, P.cream); ln(4, 5, 9, 5, P.sky); ln(4, 7, 9, 7, P.sky); ln(4, 9, 8, 9, P.sky); R(6, 9, 9, 6, P.sky); ln(6, 9, 10, 12, BL); ln(14, 9, 10, 12, BL); }),
  post_letter: icon(env()),
  post_parcel: icon(() => { R(2, 4, 12, 10, P.tan); ln(8, 4, 8, 13, P.cream); ln(2, 8, 13, 8, P.cream); ps([[7, 3], [9, 3], [6, 2], [10, 2]], P.cream); r(3, 10, 4, 3, P.white); }),
  post_slip: icon(() => { R(2, 3, 12, 10, P.pink); ln(4, 6, 11, 6, P.crimson); ln(4, 8, 10, 8, P.dark); ln(4, 10, 8, 10, P.dark); hornI(10, 11, BL); }),
  post_deadletter: icon(() => { R(1, 4, 14, 9, '#e0cf9c'); ln(1, 4, 8, 9, P.tan); ln(15, 4, 8, 9, P.tan); r(11, 5, 3, 3, P.sky); ln(3, 10, 8, 10, P.blue); ln(3, 12, 6, 12, P.blue); ln(2, 6, 9, 3, P.crimson); }),
  post_flower: icon(() => { R(3, 1, 10, 14, P.cream); ln(8, 7, 8, 13, P.leaf); ps([[7, 10], [9, 11]], P.leaf); ps([[8, 4], [6, 5], [10, 5], [7, 7], [9, 7]], P.blue); p(8, 5, P.gold); p(8, 6, P.gold); }),
  post_pick: icon(() => { PG([[3, 2], [13, 2], [8, 14]], P.green); ps([[11, 3], [12, 4]], P.cream); p(8, 6, P.mint); }),
  post_bracelet: icon(() => { OV(2, 3, 12, 10, P.green); ov(4, 5, 8, 6, null); ps([[4, 4], [8, 3], [12, 5], [13, 9], [9, 12], [4, 11], [2, 7]], P.white); }),
  post_bookmark: icon(() => { R(5, 1, 6, 12, P.navy); PG([[5, 13], [11, 13], [8, 15]], P.navy); ov(6, 4, 4, 4, P.gold); p(8, 6, P.crimson); ln(8, 3, 8, 8, P.cream); }),
  post_mixtape: icon(() => { R(1, 4, 14, 9, P.dark); r(3, 5, 10, 3, P.cream); ov(4, 9, 3, 3, P.white); ov(9, 9, 3, 3, P.white); ln(4, 6, 9, 6, P.crimson); }),
  post_scarf: icon(() => { R(3, 2, 10, 4, P.crimson); R(4, 6, 4, 8, P.crimson); r(4, 9, 4, 1, P.cream); r(3, 4, 10, 1, P.cream); ps([[4, 14], [6, 14], [7, 14]], P.cream); }),
  post_jam: icon(() => { R(4, 5, 8, 9, '#5a2040'); r(5, 8, 6, 3, P.cream); R(3, 3, 10, 3, P.crimson); ps([[4, 3], [6, 4], [8, 3], [10, 4], [12, 3]], P.white); p(8, 9, P.purple); }),
  post_biscuits: icon(() => { R(2, 6, 12, 8, P.teal); OV(4, 2, 8, 6, P.bread); ps([[6, 4], [9, 5], [8, 3]], P.crust); r(4, 9, 8, 2, P.cream); }),
  post_cocoa: icon(() => { R(4, 3, 8, 11, P.crimson); r(4, 3, 8, 2, P.gold); r(5, 7, 6, 4, P.cream); ov(6, 8, 4, 2, P.choc); }),
  post_loupe: icon(() => { OV(2, 2, 9, 9, P.gold); ov(4, 4, 5, 5, P.ice); ln(10, 10, 14, 14, P.brown); ln(11, 10, 14, 13, P.brown); p(5, 5, P.white); }),
  post_pen: icon(() => { ln(3, 13, 11, 5, P.navy); ln(4, 13, 12, 5, P.navy); ln(4, 14, 12, 6, P.navy); ps([[2, 14], [3, 14]], P.gold); ps([[12, 4], [13, 3]], P.gold); p(1, 15, P.black); }),
  post_van: icon(() => { R(1, 5, 13, 7, BL); r(1, 9, 13, 1, P.white); r(10, 6, 3, 3, P.ice); ov(3, 11, 3, 3, P.black); ov(10, 11, 3, 3, P.black); hornI(5, 7); }),
  post_horn: icon(() => { OV(2, 2, 12, 12, BL); hornI(7, 8); }),
  post_photo: icon(framed(() => { r(3, 4, 10, 4, P.sky); r(3, 8, 10, 4, P.leaf); r(6, 6, 6, 4, P.cream); r(6, 6, 6, 1, P.brown); p(4, 9, P.skin); p(4, 10, P.blue); })),
  post_cover: icon(framed(() => { r(4, 5, 8, 6, P.white); r(10, 6, 2, 2, P.crimson); r(8, 6, 2, 2, BL); ln(5, 9, 8, 9, P.slate); })),
  post_sheet: icon(framed(() => { for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) r(4 + i * 2, 5 + j * 2, 1, 1, [P.sky, P.orange, P.green, P.rose, P.gold, P.purple][(i + j * 2) % 6]); })),
  'app.post': icon(() => { R(1, 1, 14, 14, BL); r(3, 5, 10, 7, P.white); ln(3, 5, 8, 9, P.shade); ln(13, 5, 8, 9, P.shade); r(10, 6, 2, 2, P.crimson); }),
  'ui.mail': icon(env(P.white, P.crimson)),
  'ui.stamp': icon(() => { R(2, 1, 12, 14, P.white); r(4, 3, 8, 10, P.crimson); ps([[8, 5], [7, 6], [8, 6], [9, 6], [6, 7], [7, 7], [8, 7], [9, 7], [10, 7], [7, 8], [8, 8], [9, 8], [8, 9], [8, 10]], P.cream); }),
};
for (const k in PC) POST_ICONS['post_pc_' + k] = icon(card(PC[k]));
