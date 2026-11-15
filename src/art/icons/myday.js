// Icons for My Day (the HUD button, the sheet, the Ideas list). 16x16, drawn with the shared icon kit. Like needs_extra.js this module adds its entries
// to the exported ICONS table itself when it is imported (by src/sim/myday.js), so `hasIcon('myday.btn')` is true.
import { icon, P, r, R, OV, PG, ps, ln, spr, sparkle, dk, lt } from './_lib.js';
import { ICONS } from './icons.js';

export const MYDAY_ICONS = {
  /* the HUD button: a day page with a rising sun and two ticked lines */
  'myday.btn': () => {
    R(1, 2, 14, 13, P.white); R(1, 2, 14, 5, P.sky); OV(5, 3, 6, 6, P.gold); r(1, 7, 14, 1, dk(P.sky, .25));
    r(3, 9, 2, 2, P.green); r(6, 9, 7, 2, '#c9c2b4'); r(3, 12, 2, 2, P.red); r(6, 12, 5, 2, '#c9c2b4');
    r(4, 0, 2, 3, P.slate); r(10, 0, 2, 3, P.slate);
  },
  /* an idea: a lit bulb */
  'myday.idea': () => {
    OV(3, 1, 10, 10, P.yellow); R(6, 10, 4, 2, P.gold); r(6, 12, 4, 1, P.slate); r(6, 13, 4, 1, P.steel); r(7, 14, 2, 1, P.slate);
    ps([[7, 6], [8, 7], [7, 8], [8, 5]], P.orange); ps([[5, 3], [5, 4]], P.white);
  },
  /* film: a clapper board */
  'myday.film': () => {
    R(1, 6, 14, 9, P.dark); PG([[1, 2], [15, 2], [15, 6], [1, 6]], P.white); for (let i = 0; i < 4; i++) PG([[2 + i * 4, 2], [4 + i * 4, 2], [3 + i * 4, 6], [1 + i * 4, 6]], P.black);
    r(3, 9, 10, 1, P.steel); r(3, 12, 7, 1, P.steel);
  },
  /* a city event: bunting and a balloon */
  'myday.festival': () => {
    ln(0, 2, 15, 4, P.slate); PG([[1, 3], [5, 3], [3, 7]], P.red); PG([[6, 4], [10, 4], [8, 8]], P.gold); PG([[11, 4], [15, 5], [13, 9]], P.teal);
    OV(4, 8, 7, 7, P.pink); ps([[6, 10], [6, 11]], lt(P.pink, .4)); r(7, 15, 1, 1, P.slate);
  },
  /* somewhere new: a compass rose on a map corner */
  'myday.new': () => {
    OV(1, 1, 14, 14, P.paper); PG([[8, 2], [10, 8], [8, 14], [6, 8]], P.red); PG([[8, 8], [10, 8], [8, 14], [6, 8]], P.steel); r(7, 7, 2, 2, P.gold);
    ps([[2, 8], [13, 8]], P.slate);
  },
  /* a clear night: stars and a crescent */
  'myday.stars': () => {
    OV(1, 1, 14, 14, P.navy); OV(4, 4, 7, 7, P.lemon); OV(6, 3, 7, 7, P.navy); sparkle(11, 10, P.white); ps([[3, 11], [12, 4], [5, 13], [9, 12]], P.ice);
  },
  /* a class: mortarboard */
  'myday.class': () => {
    PG([[8, 2], [16, 6], [8, 10], [0, 6]], P.dark); R(4, 8, 8, 4, P.black); ln(13, 7, 13, 12, P.gold); r(12, 12, 3, 2, P.gold);
  },
  /* free time: an open clock */
  'myday.free': () => {
    OV(1, 1, 14, 14, P.mint); OV(3, 3, 10, 10, P.white); r(7, 4, 2, 5, P.dark); r(7, 7, 4, 2, P.dark);
  },
};
for (const [id, body] of Object.entries(MYDAY_ICONS)) if (!ICONS[id]) ICONS[id] = icon(body);
void spr;
export const galleryItems = Object.keys(MYDAY_ICONS).map(id => ({ id: 'icon.' + id, sb: [0, 0, 16, 16], draw: ICONS[id] }));
