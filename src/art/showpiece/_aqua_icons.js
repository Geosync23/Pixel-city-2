// 16x16 item icons for the Maple Bay Aquarium goods (registered into ICONS by sim/aquarium.js).
import { icon, R, r, OV, ov, PG, ps, ln, p, P } from '../icons/_lib.js';
const B = '#2f90c0', N = '#16324f';
export const AQUA_ICONS = {
  aqua_plush_turtle: icon(() => { OV(3, 5, 9, 8, '#5a9a5a'); ps([[5, 7], [8, 7], [6, 10], [9, 10], [7, 8]], '#3f6f44'); OV(11, 6, 4, 4, '#8aba68'); p(13, 7, P.ol); r(2, 4, 3, 2, '#8aba68'); r(2, 12, 3, 2, '#8aba68'); r(9, 13, 3, 2, '#8aba68'); }),
  aqua_plush_octopus: icon(() => { OV(3, 1, 10, 9, '#d8604a'); ps([[6, 5], [10, 5]], P.white); ps([[6, 6], [10, 6]], P.ol); for (const x of [2, 5, 8, 11]) { ln(x + 1, 10, x, 13, '#d8604a'); p(x + 1, 14, '#f08a70'); } }),
  aqua_plush_manta: icon(() => { PG([[8, 2], [15, 9], [8, 12], [1, 9]], '#3a424c'); r(6, 8, 4, 3, P.white); ps([[6, 2], [10, 2]], '#2a3038'); ps([[7, 5], [9, 5]], P.white); ln(8, 12, 8, 15, '#2a3038'); }),
  aqua_plush_otter: icon(() => { OV(4, 6, 8, 9, '#8a6240'); ov(6, 8, 4, 6, '#d8b888'); OV(4, 1, 8, 7, '#8a6240'); ov(6, 4, 4, 3, '#d8b888'); ps([[6, 3], [9, 3]], P.ol); p(7, 5, P.ol); ps([[4, 1], [11, 1]], '#6a4628'); ov(6, 10, 4, 3, '#f4f0e8'); }),
  aqua_plush_shark: icon(() => { OV(2, 6, 12, 6, '#8a94a0'); r(4, 10, 8, 2, '#e8ecee'); PG([[7, 6], [10, 6], [9, 2]], '#6a7480'); PG([[2, 9], [0, 5], [0, 13]], '#6a7480'); p(11, 8, P.ol); ps([[10, 10], [11, 10], [12, 10]], P.white); }),
  aqua_plush_penguin: icon(() => { OV(4, 4, 8, 11, '#2a2e3a'); ov(6, 7, 4, 7, P.white); OV(5, 1, 6, 5, '#2a2e3a'); ps([[6, 3], [9, 3]], P.white); r(7, 4, 2, 1, P.orange); ps([[5, 15], [6, 15], [9, 15], [10, 15]], P.orange); }),
  aqua_glow_jelly: icon(() => { OV(3, 2, 10, 7, '#c8f0ff'); ov(5, 4, 6, 3, '#eafcff'); for (const x of [4, 6, 8, 10, 12]) ln(x, 9, x - 1 + (x % 4 ? 1 : 0), 14, '#9fe0f8'); ps([[2, 1], [13, 1], [14, 5], [1, 6]], '#fff8c8'); }),
  aqua_turtle_keyring: icon(() => { OV(5, 1, 5, 5, P.steel); ov(6, 2, 3, 3, null); ln(7, 5, 8, 7, P.grey); OV(4, 8, 8, 6, '#5a9a5a'); ps([[6, 10], [9, 10], [7, 12], [8, 9]], '#3f6f44'); r(12, 10, 2, 2, '#8aba68'); ps([[4, 8], [4, 13], [10, 14], [11, 8]], '#8aba68'); }),
  aqua_shell_necklace: icon(() => { ln(2, 2, 7, 9, P.brown); ln(13, 2, 8, 9, P.brown); OV(5, 8, 6, 6, '#f6d8c0'); ov(7, 10, 3, 3, '#e8a890'); p(8, 11, '#c87868'); ps([[6, 9], [9, 12]], P.white); }),
  aqua_postcards: icon(() => { R(1, 5, 9, 7, '#7fcbe6'); R(4, 3, 9, 7, B); R(6, 6, 9, 7, N); ov(8, 8, 5, 3, P.orange); p(12, 9, P.ol); ps([[7, 8], [7, 10]], P.orange); }),
  aqua_snowglobe: icon(() => { OV(2, 1, 12, 11, '#bfe6f4'); R(3, 11, 10, 4, P.wood); ov(5, 6, 6, 3, '#8a94a0'); ps([[10, 5], [4, 7]], '#6a7480'); ps([[5, 3], [9, 4], [11, 7], [6, 9]], P.white); }),
  aqua_book_tidepools: icon(() => { R(3, 1, 10, 14, P.teal); r(4, 1, 1, 14, '#17666f'); r(7, 6, 3, 3, P.orange); ps([[8, 4], [8, 5], [5, 7], [6, 7], [10, 7], [11, 7], [6, 10], [10, 10]], P.orange); r(6, 12, 5, 1, P.cream); }),
  aqua_book_sketch: icon(() => { R(3, 1, 10, 14, '#4f8a4a'); r(4, 1, 1, 14, '#3a6a34'); ln(7, 12, 8, 3, '#a8d84a'); ln(10, 12, 9, 5, '#a8d84a'); ps([[6, 6], [9, 8], [11, 9], [6, 10]], '#c8e86a'); }),
  aqua_badge: icon(() => { OV(2, 2, 12, 12, B); ov(4, 4, 8, 8, '#7fcbe6'); ov(5, 7, 5, 3, P.white); ps([[10, 7], [11, 6], [11, 9], [10, 8]], P.white); p(6, 8, P.ol); }),
  aqua_certificate: icon(() => { R(2, 2, 12, 12, P.paper); r(4, 4, 8, 1, N); r(4, 6, 6, 1, P.shade); r(4, 8, 7, 1, P.shade); OV(9, 9, 4, 5, '#2a2e3a'); ov(10, 11, 2, 3, P.white); p(12, 10, P.orange); }),
  aqua_release_photo: icon(() => { R(1, 2, 14, 12, P.white); r(2, 3, 12, 5, '#7fcbe6'); r(2, 8, 12, 4, '#e8d6a8'); r(2, 7, 12, 1, P.white); OV(6, 7, 5, 4, '#5a9a5a'); p(11, 8, '#8aba68'); ps([[6, 6], [10, 6], [6, 11], [10, 11]], '#8aba68'); }),
  aqua_sleepover_patch: icon(() => { OV(1, 2, 14, 12, N); ov(3, 7, 9, 4, '#8a94a0'); PG([[7, 7], [10, 7], [9, 4]], '#6a7480'); ps([[11, 3], [12, 2], [13, 3]], P.yellow); ps([[4, 4], [5, 3]], P.white); ln(10, 9, 11, 9, P.ol); }),
  aqua_kelp_latte: icon(() => { R(3, 5, 9, 9, P.white); r(12, 7, 2, 4, P.white); ov(4, 4, 7, 3, '#9ac86a'); ps([[7, 5], [6, 4], [8, 4]], '#eaf6d0'); r(4, 12, 7, 1, P.shade); }),
  aqua_lagoon_soda: icon(() => { PG([[4, 3], [12, 3], [11, 15], [5, 15]], '#58c4dc'); r(5, 4, 6, 2, '#bfeeff'); ln(10, 0, 8, 6, P.red); ov(6, 8, 4, 2, P.orange); p(10, 9, P.orange); ps([[6, 12], [9, 11]], P.white); }),
  aqua_fish_waffle: icon(() => { OV(2, 5, 10, 7, P.bread); PG([[11, 8], [15, 4], [15, 12]], P.crust); p(4, 7, P.ol); ps([[6, 7], [8, 7], [6, 9], [8, 9], [7, 8], [9, 8]], P.crust); ln(3, 10, 5, 10, P.crust); }),
  aqua_chowder_bowl: icon(() => { OV(1, 5, 14, 10, P.bread); ov(3, 5, 10, 5, P.cream); ps([[5, 7], [9, 6], [7, 8]], P.leaf); ps([[10, 8], [6, 6]], P.orange); ln(2, 11, 13, 11, P.crust); }),
  aqua_harbor_tacos: icon(() => { PG([[1, 12], [4, 5], [8, 5], [9, 12]], P.gold); PG([[7, 13], [9, 6], [13, 6], [15, 13]], P.gold); ps([[4, 5], [6, 5], [10, 6], [12, 6]], P.leaf); ps([[5, 4], [11, 5]], P.tomato); ps([[3, 9], [12, 10]], P.crust); }),
  aqua_jelly_cup: icon(() => { PG([[3, 6], [13, 6], [11, 15], [5, 15]], '#7fd0f0'); ov(3, 3, 10, 5, P.white); ps([[6, 10], [9, 12], [8, 8]], '#c8f0ff'); p(8, 2, P.red); }),
};
