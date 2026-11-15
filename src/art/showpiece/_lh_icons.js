// 16x16 item icons for the Gull Point Lighthouse goods (registered into ICONS by sim/lighthouse.js).
import { icon, R, r, OV, ov, PG, ps, ln, p, P, sparkle, steam } from '../icons/_lib.js';
const navy = '#2e3a52', brass = '#d8a848';
const tower = (x, y) => { PG([[x + 1, y + 3], [x + 4, y + 3], [x + 5, y + 12], [x, y + 12]], P.white); r(x + 1, y + 6, 4, 2, navy); r(x, y + 10, 5, 1, navy); r(x + 1, y + 1, 3, 2, P.yellow); r(x, y + 3, 5, 1, navy); p(x + 2, y, P.crimson); };
export const LH_ICONS = {
  lh_postcards: icon(() => { R(1, 5, 10, 8, '#9ad0f0'); R(4, 2, 11, 9, P.cream); tower(7, 0); ln(5, 9, 13, 9, P.sky); }),
  lh_model: icon(() => { OV(2, 11, 12, 4, '#8a8a90'); tower(5, 0); r(6, 13, 5, 1, '#6a6a70'); sparkle(13, 3); }),
  lh_chart: icon(() => { PG([[2, 4], [13, 2], [14, 12], [3, 14]], '#e8dcb8'); ln(4, 7, 8, 6, '#5a8a6a'); ln(8, 6, 12, 8, '#5a8a6a'); ln(10, 10, 12, 12, P.crimson); ln(12, 10, 10, 12, P.crimson); ps([[5, 10], [7, 11]], '#6a8ab0'); R(1, 3, 2, 12, P.tan); }),
  lh_bell: icon(() => { PG([[5, 4], [10, 4], [13, 12], [2, 12]], brass); r(2, 12, 12, 1, '#a87a2c'); ov(7, 13, 2, 2, P.choc); ln(8, 0, 8, 4, P.tan); ps([[6, 6], [6, 7]], '#f6d67a'); }),
  lh_knots: icon(() => { R(1, 2, 14, 12, P.wood); for (let j = 0; j < 2; j++) for (let i = 0; i < 3; i++) { ov(2 + i * 4, 4 + j * 5, 3, 3, P.cream); p(3 + i * 4, 5 + j * 5, P.wood); } }),
  lh_bunting: icon(() => { ln(0, 3, 15, 5, P.tan); [[1, P.crimson], [5, P.yellow], [9, P.blue], [13, P.white]].forEach(([x, c], i) => { PG([[x, 4 + (i >> 1)], [x + 3, 4 + (i >> 1)], [x + 1.5, 10 + (i >> 1)]], c); }); }),
  lh_lantern: icon(() => { R(4, 5, 8, 8, P.crimson); r(5, 6, 6, 6, P.ice); ov(7, 8, 2, 3, P.yellow); R(5, 3, 6, 2, '#8a2a22'); R(4, 13, 8, 2, '#8a2a22'); ln(5, 2, 8, 0, P.steel); ln(8, 0, 10, 2, P.steel); }),
  lh_shell: icon(() => { PG([[3, 4], [10, 2], [14, 8], [9, 14], [4, 11]], '#f6b8a8'); ln(5, 5, 9, 12, '#e08a7a'); ln(8, 4, 11, 10, '#e08a7a'); ps([[6, 8], [7, 9]], P.white); }),
  lh_shortbread: icon(() => { R(1, 6, 14, 8, navy); r(2, 7, 12, 1, brass); for (let i = 0; i < 3; i++) { R(3 + i * 4, 2, 3, 5, '#f0d8a0'); ps([[4 + i * 4, 3], [4 + i * 4, 5]], '#c8a060'); } }),
  lh_tea: icon(() => { R(3, 3, 10, 12, navy); r(3, 3, 10, 2, brass); tower(6, 4); }),
  lh_mug: icon(() => { R(3, 6, 8, 8, P.white); r(3, 6, 8, 1, navy); r(4, 7, 6, 1, '#a8642e'); ln(11, 8, 13, 9, P.white); ln(13, 9, 11, 12, P.white); steam(5, 1); }),
  lh_stew: icon(() => { OV(1, 6, 14, 8, P.white); ov(3, 7, 10, 4, '#c8502e'); ps([[5, 8], [9, 9]], P.cream); ps([[7, 8], [10, 8]], P.leaf); R(11, 3, 4, 3, P.bread); steam(5, 1); }),
  lh_brasso: icon(() => { R(4, 5, 8, 9, P.yellow); r(4, 8, 8, 3, navy); R(6, 3, 4, 2, P.steel); PG([[10, 10], [15, 9], [15, 14], [11, 15]], P.cream); sparkle(2, 4); }),
  lh_spyglass: icon(() => { PG([[1, 11], [6, 7], [8, 9], [3, 13]], brass); PG([[6, 7], [10, 4], [12, 6], [8, 9]], '#f6d67a'); PG([[10, 4], [13, 1], [15, 3], [12, 6]], brass); p(14, 2, P.sky); }),
  lh_logbook: icon(() => { R(3, 2, 10, 13, navy); r(4, 3, 1, 11, '#1e2638'); ln(8, 5, 8, 10, brass); ln(6, 6, 10, 6, brass); ps([[6, 10], [7, 11], [9, 11], [10, 10]], brass); }),
  lh_herring: icon(() => { OV(3, 2, 10, 4, P.wood); R(3, 4, 10, 9, P.wood); OV(3, 11, 10, 4, P.wood); r(3, 6, 10, 1, P.dark); r(3, 11, 10, 1, P.dark); PG([[5, 8], [9, 7], [11, 9], [9, 10]], '#b8c8d6'); p(6, 8, P.ol); }),
  lh_mantle: icon(() => { R(2, 5, 12, 9, '#8a9a8a'); r(2, 5, 12, 2, '#6a7a6a'); R(7, 7, 2, 3, brass); ps([[4, 11], [5, 12], [10, 11], [11, 12]], '#5a6a5a'); sparkle(13, 3); }),
  lh_badge: icon(() => { PG([[8, 1], [14, 4], [13, 11], [8, 15], [3, 11], [2, 4]], brass); tower(6, 3); sparkle(13, 2); }),
};
