// Maple Bay Observatory — 16x16 item icons for the `obs_*` items (registered into the shared ICONS table; no world assets here).
import { ICONS } from '../icons/icons.js';
import { icon, R, r, OV, ov, PG, ln, p, ps, st, P, steam, sparkle } from '../icons/_lib.js';
const NAVY = '#2d3a6e', GOLD = '#f2c230';
const mug = (c, top) => { R(3, 6, 8, 8, c); r(11, 8, 2, 1, c); r(12, 9, 1, 3, c); r(11, 12, 2, 1, c); r(4, 6, 6, 2, top); };
const I = {
  obs_starwheel: () => { OV(1, 1, 14, 14, NAVY); ov(4, 5, 9, 7, '#141a3a'); ps([[6, 7], [9, 6], [10, 9], [7, 10], [5, 9]], P.cream); ps([[3, 3], [12, 3], [8, 2], [13, 8], [2, 8]], GOLD); p(8, 8, GOLD); },
  obs_logbook: () => { R(3, 1, 10, 14, NAVY); r(3, 1, 2, 14, '#1c2548'); OV(7, 4, 5, 5, GOLD); ov(9, 4, 3, 4, NAVY); r(6, 11, 6, 1, P.cream); r(6, 13, 4, 1, P.cream); },
  obs_redtorch: () => { PG([[2, 6], [6, 4], [6, 12], [2, 10]], P.crimson); R(6, 6, 8, 4, P.red); r(9, 7, 2, 2, P.dark); st([[0, 5], [0, 8], [0, 11], [1, 7], [1, 9]], '#ff8a7a'); },
  obs_gift_postcards: () => { PG([[1, 5], [9, 2], [11, 9], [3, 12]], P.paper); R(5, 4, 10, 9, '#2a1a4a'); ov(7, 6, 6, 5, '#d8588a'); ov(9, 7, 3, 3, '#f4a0c0'); ps([[6, 5], [13, 6], [12, 11], [7, 11]], P.cream); },
  obs_gift_glowstars: () => { R(2, 1, 12, 14, '#1c2548'); for (const [x, y] of [[5, 4], [10, 6], [6, 10], [11, 11]]) { ps([[x, y], [x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]], '#b8f0a0'); p(x, y, '#e8ffd8'); } },
  obs_gift_saturn: () => { OV(4, 3, 9, 9, '#ecd9a0'); r(5, 6, 7, 1, '#cdb070'); r(5, 9, 7, 1, '#cdb070'); ln(0, 10, 15, 5, '#b8a060'); ln(1, 11, 15, 6, '#e4d4a0'); ps([[7, 6], [10, 6]], P.black); ln(7, 9, 10, 9, P.rose); },
  obs_gift_meteorite: () => { R(2, 8, 12, 6, P.steel); r(2, 8, 12, 1, P.grey); OV(4, 2, 8, 7, '#5a5e6a'); ps([[6, 4], [9, 5], [7, 7], [10, 7]], '#3a3e4a'); ps([[5, 3], [8, 3]], '#9aa0aa'); },
  obs_gift_moonlamp: () => { R(5, 12, 6, 2, P.wood); OV(2, 1, 12, 11, '#f4f0dc'); ov(4, 3, 3, 3, '#c9c6b4'); ov(9, 5, 3, 3, '#c9c6b4'); ov(6, 8, 2, 2, '#c9c6b4'); st([[0, 3], [15, 4], [1, 10], [14, 10]], '#fff8d0'); },
  obs_gift_rocket: () => { PG([[8, 0], [11, 4], [11, 11], [5, 11], [5, 4]], P.white); PG([[8, 0], [10, 3], [6, 3]], P.red); ov(7, 5, 2, 2, P.sky); PG([[5, 8], [2, 13], [5, 12]], P.red); PG([[11, 8], [14, 13], [11, 12]], P.red); r(7, 12, 2, 3, P.orange); p(7, 15, P.gold); },
  obs_gift_icecream: () => { PG([[2, 3], [14, 3], [13, 13], [3, 13]], P.steel); r(2, 3, 12, 1, P.grey); r(3, 12, 10, 1, P.grey); R(5, 5, 6, 6, P.pink); r(5, 7, 6, 2, P.cream); r(5, 9, 6, 2, P.choc); },
  obs_comet_print: () => { R(1, 2, 14, 12, P.gold); r(3, 4, 10, 8, '#0a0f2e'); ln(4, 10, 9, 6, '#7aa8e8'); ln(5, 10, 10, 6, '#c8e8ff'); ov(9, 5, 3, 3, P.white); ps([[4, 5], [11, 10], [6, 6]], '#b8c6f0'); },
  obs_cocoa: () => { mug(NAVY, P.choc); p(6, 6, P.cream); p(7, 7, P.cream); p(8, 6, P.cream); ps([[5, 10], [8, 11]], GOLD); steam(5, 1); },
  obs_supernova: () => { mug(P.red, P.choc); OV(3, 3, 4, 4, P.white); OV(6, 2, 4, 4, '#f8d8e4'); OV(8, 4, 3, 3, P.white); sparkle(12, 2, GOLD); sparkle(2, 1, GOLD); },
  obs_moon_pie: () => { OV(1, 3, 14, 10, P.choc); r(2, 8, 12, 1, P.cream); ov(4, 5, 3, 2, '#8a5634'); ov(9, 5, 3, 2, '#8a5634'); },
  obs_galaxy_donut: () => { OV(1, 3, 14, 11, P.bread); OV(2, 3, 12, 8, P.purple); ov(6, 6, 4, 3, P.crust); ps([[4, 5], [11, 5], [12, 8], [3, 8], [8, 4]], P.cream); ps([[5, 9], [10, 9]], GOLD); },
  obs_star_toastie: () => { PG([[1, 5], [15, 5], [14, 13], [2, 13]], P.bread); r(1, 5, 14, 1, P.crust); r(2, 12, 12, 1, P.crust); ps([[8, 7], [7, 9], [8, 9], [9, 9], [6, 10], [10, 10], [8, 8], [7, 8], [9, 8], [8, 10]], GOLD); },
  obs_orbit_soup: () => { OV(1, 4, 14, 10, P.white); OV(2, 4, 12, 7, P.tomato); ps([[8, 7], [9, 7], [10, 8], [9, 9], [7, 9], [6, 8], [6, 6], [8, 5]], P.cream); },
  obs_night_tea: () => { R(4, 4, 8, 10, '#8a4a2a'); r(4, 4, 8, 1, P.ice); r(12, 6, 2, 1, P.ice); r(13, 7, 1, 4, P.ice); r(12, 11, 2, 1, P.ice); OV(6, 6, 4, 4, P.lemon); ov(8, 6, 3, 3, '#8a4a2a'); steam(6, 0); },
};
for (const k in I) if (!ICONS[k]) ICONS[k] = icon(I[k]);
export const galleryItems = Object.keys(I).map(id => ({ id: 'icon.' + id, sb: [0, 0, 16, 16], draw: ICONS[id] }));
export default [];
