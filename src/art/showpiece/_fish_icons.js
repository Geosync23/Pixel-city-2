// 16x16 item icons for the Bay Fish Hall goods (registered into ICONS by sim/fishmarket.js).
import { icon, R, r, OV, ov, PG, ps, ln, p, P, sparkle, steam } from '../icons/_lib.js';
const cone = f => () => { PG([[3, 5], [13, 5], [8, 15]], P.white); ln(5, 8, 8, 13, P.shade); f(); };
const bowl = (c, f) => () => { OV(1, 6, 14, 8, c); f(); };
export const FISH_ICONS = {
  fm_oysters: icon(() => { OV(1, 4, 14, 10, P.ice); for (const [x, y] of [[3, 6], [7, 5], [11, 6], [4, 10], [8, 10], [11, 10]]) { ov(x, y, 3, 3, '#8a8a84'); p(x + 1, y + 1, '#f6f2e6'); } ps([[7, 8], [8, 8]], P.lemon); }),
  fm_shrimp_cocktail: icon(() => { PG([[3, 4], [13, 4], [9, 10], [7, 10]], P.ice); r(7, 10, 2, 3, P.ice); r(5, 13, 6, 1, P.ice); r(5, 5, 6, 2, P.tomato); for (const x of [3, 6, 9, 12]) { ps([[x, 3], [x, 2], [x + 1, 1]], '#f08a78'); } }),
  fm_chowder: icon(() => { OV(1, 5, 14, 10, P.bread); ov(3, 5, 10, 5, '#f4ecd0'); ps([[5, 7], [8, 6], [10, 8]], P.green); ps([[7, 8], [9, 6]], P.peach); ps([[2, 11], [13, 11]], P.crust); steam(6, 0); }),
  fm_bisque: icon(() => { PG([[4, 5], [12, 5], [11, 14], [5, 14]], P.white); ov(4, 3, 8, 4, '#e8864a'); ps([[7, 4], [8, 5], [9, 4]], P.cream); r(5, 9, 6, 1, P.red); steam(6, 0); }),
  fm_poke: icon(bowl('#3a3644', () => { ov(3, 6, 10, 5, P.white); ps([[4, 7], [5, 8], [6, 7], [5, 7]], '#c8303e'); ps([[8, 7], [9, 8]], P.leaf); ps([[10, 7], [11, 8], [10, 8]], P.yellow); ps([[7, 9], [8, 9]], '#2a2a36'); })),
  fm_nigiri: icon(() => { R(1, 6, 14, 8, '#3a3644'); for (let i = 0; i < 3; i++) { r(2 + i * 4, 9, 3, 3, P.white); r(2 + i * 4, 8, 3, 1, ['#f08a52', '#c8303e', '#f8e8d8'][i]); } ps([[13, 8], [13, 9]], P.leaf); ps([[13, 11]], P.pink); }),
  fm_fishchips: icon(cone(() => { OV(4, 2, 8, 4, '#e0a83a'); ps([[5, 3], [6, 2]], '#f6d070'); for (const x of [4, 6, 10, 12]) r(x, 1, 1, 4, P.yellow); ps([[11, 5]], P.lemon); })),
  fm_calamari: icon(cone(() => { for (const [x, y] of [[4, 3], [7, 2], [10, 3], [6, 4], [9, 4]]) { ov(x, y, 3, 3, '#e8b050'); p(x + 1, y + 1, P.white); } })),
  fm_lobster_roll: icon(() => { OV(1, 6, 14, 8, P.bread); r(3, 6, 10, 3, '#e0503a'); ps([[4, 6], [7, 7], [10, 6]], '#f6a088'); ps([[6, 6], [9, 7]], P.leaf); ps([[2, 12], [13, 12]], P.crust); }),
  fm_crab: icon(() => { OV(3, 6, 10, 7, '#d8683a'); ps([[5, 8], [10, 8]], P.ol); for (const x of [2, 13]) { ps([[x, 5], [x, 4]], '#d8683a'); } R(1, 2, 3, 3, '#c85030'); R(12, 2, 3, 3, '#c85030'); ps([[2, 11], [4, 13], [11, 13], [13, 11]], '#e89a5a'); ps([[7, 13], [8, 13]], P.lemon); }),
  fm_urchin: icon(() => { R(2, 8, 12, 5, P.bread); r(3, 8, 10, 1, P.crust); ov(4, 5, 8, 4, P.gold); ps([[5, 6], [8, 5], [10, 6]], P.orange); ps([[12, 6]], P.leaf); }),
  fm_kipper: icon(() => { PG([[1, 5], [12, 4], [15, 2], [14, 8], [15, 13], [12, 11], [1, 10]], '#d8922e'); ln(3, 7, 12, 7, '#f2c070'); ps([[4, 6], [7, 6], [10, 6], [4, 9], [7, 9], [10, 9]], '#8a5a1c'); p(2, 7, P.ol); }),
  fm_smoked_salmon: icon(() => { R(1, 4, 14, 10, P.paper); for (let i = 0; i < 4; i++) { r(2 + i * 3, 5, 3, 8, '#f0865a'); r(2 + i * 3, 7, 3, 1, '#f8c0a0'); r(2 + i * 3, 10, 3, 1, '#f8c0a0'); } ps([[13, 3], [14, 2]], P.leaf); }),
  fm_mackerel: icon(() => { PG([[1, 7], [4, 4], [11, 4], [15, 2], [14, 7], [15, 12], [11, 10], [4, 11]], '#2f9a94'); r(3, 8, 9, 2, P.ice); for (const x of [4, 6, 8, 10]) ln(x, 4, x + 1, 7, '#1c4458'); p(3, 6, P.ol); }),
  fm_tuna_loin: icon(() => { R(2, 4, 12, 9, '#b8303e'); r(2, 4, 12, 2, '#7a4a3a'); ln(4, 7, 4, 12, '#d85a62'); ln(8, 7, 8, 12, '#d85a62'); ln(12, 7, 12, 12, '#d85a62'); ps([[13, 3]], P.leaf); }),
  fm_swordfish: icon(() => { OV(1, 4, 14, 9, P.white); ov(3, 6, 10, 5, '#f4ecd8'); ln(4, 6, 7, 10, P.brown); ln(7, 6, 10, 10, P.brown); ln(10, 6, 12, 9, P.brown); ps([[12, 5]], P.lemon); }),
  fm_salt: icon(() => { R(4, 4, 8, 10, P.ice); r(5, 8, 6, 5, '#c8c8d0'); r(5, 6, 6, 2, P.blue); R(4, 2, 8, 2, P.tan); sparkle(13, 3); }),
  fm_spice: icon(() => { R(3, 4, 10, 10, P.crimson); r(3, 4, 10, 2, P.gold); ln(8, 7, 8, 12, P.cream); ln(6, 9, 10, 9, P.cream); ps([[6, 12], [7, 13], [9, 13], [10, 12]], P.cream); }),
  fm_lure: icon(() => { PG([[3, 2], [8, 5], [6, 9], [2, 6]], P.orange); ps([[4, 4], [5, 5]], P.yellow); ln(7, 8, 11, 11, P.steel); ps([[12, 12], [12, 13], [11, 14], [10, 13]], P.steel); ps([[2, 1], [1, 2]], P.red); }),
  fm_float: icon(() => { OV(3, 3, 10, 10, '#3fa88a'); ps([[5, 5], [6, 4], [5, 6]], P.mint); ln(3, 8, 12, 8, P.tan); ln(8, 3, 8, 12, P.tan); ln(5, 4, 11, 12, P.tan, true); ps([[8, 1], [8, 2]], P.tan); }),
  fm_knife: icon(() => { PG([[1, 3], [10, 9], [9, 11], [1, 5]], P.steel); ln(1, 3, 9, 9, P.ice); R(9, 9, 6, 3, P.wood); ps([[11, 10], [13, 11]], P.gold); }),
  fm_stampbook: icon(() => { R(3, 2, 10, 13, P.blue); r(4, 3, 1, 11, P.navy); R(6, 5, 6, 5, P.cream); PG([[7, 7], [9, 6], [11, 8], [9, 9]], '#5a86a8'); p(8, 7, P.ol); ps([[11, 6], [11, 9]], '#5a86a8'); }),
  fm_tally: icon(() => { OV(2, 2, 12, 12, P.gold); ov(4, 4, 8, 8, '#d8a030'); ln(6, 6, 6, 9, P.choc); ln(5, 8, 7, 8, P.choc); ln(9, 6, 9, 10, P.choc); p(8, 7, P.choc); ov(7, 1, 2, 2, P.ol); }),
};
