// Icons for the three gentle needs (Comfort, Outdoors, Inspiration), the home supplies (toiletries + cleaning) and the Opportunities app.
// 16x16, drawn with the shared icon kit. Not listed in icons.js: this module adds its entries to the exported ICONS table itself when it is
// imported (by src/sim/needs_extra.js, src/sim/supplies.js and src/ui/phone_opps.js), so `hasIcon('need.comfort')` is true.
import { icon, P, OL, r, R, OV, ov, PG, p, ps, ln, spr, sparkle, dk, lt } from './_lib.js';
import { ICONS } from './icons.js';

export const NEEDS_EXTRA_ICONS = {
  /* armchair, warm red */
  'need.comfort': () => {
    R(3, 2, 10, 8, P.red); R(1, 6, 3, 7, P.tomato); R(12, 6, 3, 7, P.tomato); R(4, 8, 8, 4, '#f6b48a'); r(4, 8, 8, 1, lt('#f6b48a', .3));
    r(3, 13, 2, 2, P.brown); r(11, 13, 2, 2, P.brown); ps([[6, 4], [9, 4]], dk(P.red, .3));
  },
  /* round tree under a blue sky */
  'need.outdoors': () => {
    OV(1, 1, 14, 14, P.sky); OV(4, 2, 8, 8, P.leaf); OV(3, 5, 5, 5, P.green); OV(8, 5, 5, 5, P.leaf); r(7, 9, 2, 5, P.brown); r(3, 13, 10, 1, P.lime);
    ps([[6, 4], [9, 6], [5, 7]], lt(P.leaf, .35));
  },
  /* lit lightbulb, violet glow */
  'need.inspiration': () => {
    OV(3, 1, 10, 10, P.yellow); R(6, 10, 4, 2, P.gold); r(6, 12, 4, 1, P.slate); r(6, 13, 4, 1, P.steel); r(7, 14, 2, 1, P.slate);
    ps([[7, 6], [8, 7], [7, 8], [8, 5]], P.orange); ps([[5, 3], [5, 4]], P.white);
    ps([[1, 2], [14, 2], [0, 6], [15, 6], [2, 11], [13, 11]], P.violet);
  },
  /* the Opportunities app: a four-point star on teal */
  'app.opps': () => {
    R(1, 1, 14, 14, P.teal); PG([[8, 2], [9.6, 6.4], [14, 8], [9.6, 9.6], [8, 14], [6.4, 9.6], [2, 8], [6.4, 6.4]], P.yellow); ps([[7, 7], [8, 7], [7, 8], [8, 8]], P.white);
    p(12, 3, P.white); p(3, 12, P.cream);
  },
  'ui.opp': () => { PG([[8, 1], [9.8, 6.2], [15, 8], [9.8, 9.8], [8, 15], [6.2, 9.8], [1, 8], [6.2, 6.2]], P.gold); ps([[7, 7], [8, 7], [7, 8], [8, 8]], P.white); },
  /* supplies */
  'ui.supplies': () => { R(2, 6, 12, 8, P.tan); r(2, 6, 12, 1, P.brown); ln(3, 6, 6, 2, P.brown); ln(12, 6, 9, 2, P.brown); r(6, 2, 4, 1, P.brown); r(5, 8, 2, 4, P.sky); r(9, 8, 2, 4, P.pink); },
  sup_soap: () => { R(2, 7, 12, 6, P.mint); r(4, 9, 8, 2, lt(P.mint, .35)); OV(10, 2, 3, 3, P.ice); OV(6, 3, 2, 2, P.ice); OV(12, 6, 2, 2, P.ice); },
  sup_shampoo: () => { R(4, 5, 8, 10, P.violet); R(6, 2, 4, 3, P.purple); r(7, 1, 2, 1, P.dark); R(5, 8, 6, 4, P.white); ps([[7, 9], [8, 10], [7, 11]], P.violet); },
  sup_toothpaste: () => { PG([[1, 6], [11, 5], [11, 11], [1, 10]], P.white); R(11, 6, 3, 4, P.sky); r(14, 7, 1, 2, P.blue); r(3, 7, 6, 2, P.red); r(3, 9, 6, 1, P.sky); },
  sup_toilet_paper: () => { OV(2, 3, 12, 6, P.white); R(2, 6, 12, 7, P.white); OV(2, 10, 12, 5, P.white); ov(6, 5, 4, 2, P.shade); r(11, 9, 3, 5, P.paper); ps([[4, 9], [4, 11], [7, 10], [9, 12]], P.ice); },
  sup_cleaner: () => { R(5, 6, 7, 9, P.sky); R(7, 3, 3, 3, P.blue); R(3, 1, 7, 2, P.red); r(2, 3, 2, 2, P.red); R(6, 9, 5, 3, P.white); ps([[0, 5], [1, 7], [0, 8]], P.ice); },
  sup_sponges: () => { R(1, 8, 9, 5, P.yellow); r(1, 8, 9, 2, P.green); R(7, 3, 8, 5, P.pink); r(7, 3, 8, 2, P.teal); ps([[3, 11], [6, 12], [10, 6], [13, 7]], dk(P.yellow, .2)); },
  sup_detergent: () => { R(3, 5, 10, 10, P.orange); R(5, 2, 4, 3, P.blue); r(9, 3, 3, 2, P.orange); OV(5, 8, 6, 5, P.white); OV(7, 9, 2, 2, P.sky); },
  /* visible mess in the home (used by the cleaning cupboard menu) */
  'ui.broom': () => { ln(11, 1, 5, 10, P.wood); ln(12, 1, 6, 10, P.brown); PG([[2, 10], [8, 10], [10, 15], [1, 15]], P.gold); ps([[3, 12], [5, 13], [7, 12], [4, 14], [8, 14]], dk(P.gold, .3)); sparkle(13, 11, '#fff2a0'); },
};
for (const [id, body] of Object.entries(NEEDS_EXTRA_ICONS)) if (!ICONS[id]) ICONS[id] = icon(body);
void OL;
export const galleryItems = Object.keys(NEEDS_EXTRA_ICONS).map(id => ({ id: 'icon.' + id, sb: [0, 0, 16, 16], draw: ICONS[id] }));
