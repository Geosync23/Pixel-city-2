// Maple Bay Natatorium — 16x16 item icons for the `nat_*` items and the three outfits (registered into the shared ICONS table at import; no world assets here).
import { ICONS } from '../icons/icons.js';
import { icon, R, r, OV, ov, PG, ln, p, ps, st, P, steam, sparkle } from '../icons/_lib.js';
const BLU = '#1f6fb8', NAV = '#22304e', YEL = '#f2c230', TEAL = '#1fa3b8';
const medal = c => () => { PG([[4, 0], [7, 0], [9, 6], [6, 6]], BLU); PG([[9, 0], [12, 0], [10, 6], [7, 6]], '#3b8fd8'); OV(4, 6, 8, 9, c); p(8, 10, P.dark); p(7, 11, P.dark); p(8, 12, P.dark); sparkle(12, 7); };
const cup = (c, top) => () => { PG([[4, 4], [12, 4], [11, 15], [5, 15]], P.ice); PG([[5, 6], [11, 6], [10.4, 14], [5.6, 14]], c); OV(4, 2, 8, 4, top || c); ln(10, 0, 9, 5, P.red); ps([[6, 8], [9, 10], [7, 12]], P.white); };
const suit = (c, c2, stripe) => () => { PG([[4, 1], [6, 1], [7, 4], [9, 4], [10, 1], [12, 1], [13, 7], [11, 14], [9, 15], [7, 15], [5, 14], [3, 7]], c); if (stripe) for (const y of [5, 8, 11]) r(4, y, 8, 1, c2); else { ln(11, 3, 11, 13, c2); ln(12, 4, 12, 9, c2); } };
const I = {
  nat_goggles: () => { ln(1, 6, 14, 6, P.black); OV(2, 5, 5, 5, BLU); OV(9, 5, 5, 5, BLU); r(7, 7, 2, 1, P.black); ps([[3, 6], [10, 6]], P.ice); ps([[4, 7], [11, 7]], '#8fd0f0'); },
  nat_cap: () => { OV(2, 2, 12, 11, BLU); r(2, 11, 12, 2, NAV); PG([[5, 7], [11, 6], [9, 9]], YEL); ln(11, 6, 13, 5, YEL); ps([[4, 4], [5, 3], [6, 3]], '#8fc0f0'); },
  nat_towel: () => { OV(1, 4, 6, 9, P.white); R(4, 4, 10, 9, '#3b8fd8'); for (const x of [6, 9, 12]) r(x, 4, 1, 9, P.white); ov(2, 6, 3, 5, P.shade); p(3, 8, BLU); },
  nat_kickboard: () => { PG([[3, 3], [8, 1], [13, 3], [13, 15], [3, 15]], YEL); ov(6, 9, 4, 3, '#c89a1a'); ln(5, 5, 11, 5, '#fff2a8'); ps([[4, 13], [12, 13]], '#c89a1a'); },
  nat_noseclip: () => { ln(3, 4, 8, 12, P.steel); ln(13, 4, 8, 12, P.steel); OV(1, 2, 4, 4, P.pink); OV(11, 2, 4, 4, P.pink); p(8, 13, P.slate); },
  nat_shampoo: () => { R(4, 5, 8, 10, P.leaf); r(6, 2, 4, 3, P.white); r(7, 1, 2, 1, P.steel); r(5, 8, 6, 4, P.white); ps([[6, 10], [7, 9], [8, 10], [9, 9]], TEAL); },
  nat_noodle: () => { for (let i = 0; i < 12; i++) { const x = 2 + i, y = Math.round(10 - Math.sin(i / 11 * 3.14) * 7); r(x, y, 2, 3, P.pink); } ps([[2, 11], [13, 11]], P.rose); ps([[6, 4], [8, 3]], '#fbd0e0'); },
  nat_armbands: () => { OV(1, 4, 7, 9, P.orange); ov(3, 6, 3, 5, P.dark); OV(8, 4, 7, 9, P.orange); ov(10, 6, 3, 5, P.dark); ps([[2, 6], [9, 6]], P.yellow); r(7, 8, 2, 1, P.white); },
  nat_plush_marlin: () => { OV(3, 6, 10, 6, BLU); PG([[6, 6], [9, 1], [11, 6]], '#3b8fd8'); PG([[2, 9], [0, 5], [0, 13]], BLU); ln(12, 9, 15, 8, YEL); ov(5, 9, 6, 3, P.ice); p(10, 8, P.black); p(10, 7, P.white); },
  nat_ring: () => { OV(1, 5, 12, 10, P.pink); ov(4, 8, 6, 4, P.dark); ln(11, 6, 12, 1, P.pink); OV(10, 0, 5, 4, P.rose); p(14, 2, P.orange); p(12, 1, P.black); ps([[3, 7], [4, 6]], '#fbd0e0'); },
  outfit_nat_marlins: suit(NAV, YEL), outfit_nat_retro: suit('#d8402e', P.white, true),
  outfit_nat_robe: () => { PG([[5, 1], [11, 1], [14, 5], [13, 15], [3, 15], [2, 5]], '#2f8a8a'); OV(5, 0, 6, 5, '#257474'); ov(6, 1, 4, 3, P.dark); ln(8, 5, 8, 14, YEL); ps([[5, 9], [11, 9]], '#1f6a6a'); },
  nat_chips: () => { PG([[2, 5], [14, 5], [9, 15], [7, 15]], P.paper); for (const [x, y, h] of [[4, 1, 5], [6, 0, 6], [8, 2, 4], [10, 0, 6], [12, 2, 4]]) R(x, y, 2, h, P.gold); ps([[5, 7], [9, 8], [11, 6]], P.red); ps([[6, 2], [10, 3]], P.white); },
  nat_slush_blue: cup('#3b9be8', '#8fd0ff'), nat_slush_red: cup('#e8483a', '#ff9a8a'),
  nat_hotchoc: () => { R(2, 5, 10, 9, P.white); r(12, 7, 2, 1, P.white); r(13, 8, 1, 3, P.white); r(12, 11, 2, 1, P.white); r(3, 5, 8, 2, P.choc); ps([[4, 5], [7, 5], [9, 6]], P.pink); ps([[5, 6], [8, 5]], P.white); steam(5, 0); },
  nat_toastie: () => { PG([[1, 12], [8, 3], [15, 12]], P.bread); PG([[3, 12], [8, 6], [13, 12]], '#e8b04a'); r(2, 12, 12, 2, P.crust); ps([[5, 13], [8, 14], [11, 13]], P.gold); ln(6, 9, 10, 9, P.crust); },
  nat_lolly: () => { PG([[8, 0], [11, 4], [11, 11], [5, 11], [5, 4]], P.white); r(5, 2, 6, 3, P.tomato); r(5, 8, 6, 3, P.blue); p(8, 0, P.tomato); r(7, 11, 2, 5, P.tan); },
  nat_flapjack: () => { R(1, 5, 14, 7, '#d8a04a'); ps([[3, 7], [6, 9], [9, 6], [12, 8], [5, 6], [11, 10]], '#f4d48a'); ps([[4, 9], [8, 8], [13, 7]], P.crust); ps([[2, 5], [5, 5], [8, 5], [11, 5]], '#f4d48a'); },
  nat_water: () => { R(5, 4, 6, 11, P.ice); r(6, 1, 4, 3, BLU); r(5, 8, 6, 3, '#6fb3e0'); ps([[6, 5], [6, 6], [6, 12]], P.white); },
  nat_badge: () => { OV(1, 1, 14, 14, BLU); ov(3, 3, 10, 10, '#3b8fd8'); for (let x = 3; x < 13; x++) p(x, Math.round(9 + Math.sin(x * 1.2) * 1.2), P.white); OV(6, 4, 4, 3, YEL); st([[2, 8], [13, 8], [8, 2], [8, 13]], '#8fc0f0'); },
  nat_medal_gold: medal(P.gold), nat_medal_silver: medal(P.steel), nat_medal_bronze: medal('#c8843a'),
  nat_whistle: () => { ln(2, 2, 6, 7, P.crimson); ln(2, 2, 3, 6, P.crimson); OV(5, 7, 8, 7, P.gold); R(10, 6, 5, 3, P.gold); ov(7, 9, 3, 3, P.dark); p(14, 7, P.dark); sparkle(6, 6); },
};
for (const k in I) if (!ICONS[k]) ICONS[k] = icon(I[k]);
export const NAT_ICONS = Object.keys(I);
export const galleryItems = Object.keys(I).map(id => ({ id: 'icon.' + id, sb: [0, 0, 16, 16], draw: ICONS[id] }));
export default [];
