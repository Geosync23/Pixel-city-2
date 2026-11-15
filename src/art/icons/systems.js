// Icons for the Systems shelf ("How things work here"), the quick tools on Wander's front page and the first-time windows. 16x16, drawn with the shared icon kit.
// Like myday.js this module adds its entries to the exported ICONS table when it is imported (by src/sim/systems.js), so `hasIcon('sys.cook')` is true.
import { icon, P, r, R, OV, PG, ps, ln, dk, lt } from './_lib.js';
import { ICONS } from './icons.js';

export const SYSTEM_ICONS = {
  /* cooking: a pot with steam */
  'sys.cook': () => {
    R(2, 7, 12, 7, P.steel); r(1, 8, 1, 2, P.slate); r(14, 8, 1, 2, P.slate); R(2, 6, 12, 2, P.slate); r(7, 4, 2, 2, P.dark);
    ps([[4, 2], [5, 1], [4, 0], [11, 2], [10, 1], [11, 0]], P.ice); r(4, 10, 8, 1, lt(P.steel, .4));
  },
  /* groceries: a basket with a leaf and a loaf */
  'sys.groceries': () => {
    PG([[1, 7], [15, 7], [13, 15], [3, 15]], P.tan); r(1, 7, 14, 1, P.wood); ln(5, 8, 6, 14, P.wood); ln(10, 8, 9, 14, P.wood);
    OV(3, 2, 5, 6, P.leaf); OV(8, 3, 6, 5, P.bread); ps([[10, 4], [12, 4]], P.crust); ln(5, 0, 5, 2, P.green);
  },
  /* decorating: a sofa with a cushion */
  'sys.decor': () => {
    R(2, 4, 12, 6, P.teal); R(1, 8, 3, 5, dk(P.teal, .15)); R(12, 8, 3, 5, dk(P.teal, .15)); R(3, 9, 10, 4, lt(P.teal, .15));
    R(5, 6, 4, 3, P.gold); r(3, 13, 2, 2, P.choc); r(11, 13, 2, 2, P.choc);
  },
  /* a parcel on its way */
  'sys.parcel': () => {
    R(2, 5, 12, 10, P.tan); PG([[2, 5], [8, 2], [14, 5], [8, 8]], lt(P.tan, .2)); r(7, 5, 2, 10, P.paper); r(2, 9, 12, 1, dk(P.tan, .15));
    r(9, 11, 4, 3, P.white); r(10, 12, 2, 1, P.slate);
  },
  /* furniture shop: a floor lamp and a chair */
  'sys.furniture': () => {
    PG([[2, 1], [8, 1], [9, 6], [1, 6]], P.yellow); r(5, 6, 1, 8, P.slate); r(3, 14, 5, 1, P.slate);
    R(10, 6, 2, 8, P.wood); R(10, 10, 5, 2, P.rose); r(14, 12, 1, 3, P.wood); r(10, 14, 1, 1, P.wood);
  },
  /* a coach: whistle on a cord */
  'sys.coach': () => {
    ln(2, 1, 7, 6, P.red); ln(12, 1, 8, 6, P.red); OV(4, 7, 8, 8, P.gold); R(10, 8, 5, 3, P.gold); r(7, 10, 2, 2, P.dark); r(13, 9, 1, 1, P.white);
  },
  /* a Chapter of the story: the gold marker, a book under it */
  'sys.chapter': () => {
    PG([[8, 0], [12, 4], [8, 8], [4, 4]], P.gold); ps([[7, 3], [8, 2]], P.cream);
    PG([[1, 10], [8, 9], [8, 15], [1, 14]], P.paper); PG([[8, 9], [15, 10], [15, 14], [8, 15]], P.white); r(8, 9, 1, 6, P.crimson); ps([[3, 12], [4, 12], [5, 12], [10, 12], [11, 12], [12, 12]], P.slate);
  },
  /* the Map: a folded map with a pin */
  'sys.map': () => {
    PG([[1, 4], [6, 2], [6, 14], [1, 15]], P.paper); PG([[6, 2], [11, 4], [11, 15], [6, 14]], P.mint); PG([[11, 4], [15, 2], [15, 13], [11, 15]], P.paper);
    ln(2, 9, 5, 7, P.sky); ln(12, 10, 14, 8, P.sky); OV(6, 4, 5, 5, P.red); r(8, 9, 1, 3, P.red); r(8, 6, 1, 1, P.white);
  },
  /* post: an envelope with a stamp */
  'sys.post': () => {
    R(1, 4, 14, 10, P.white); ln(1, 4, 8, 10, P.shade); ln(15, 4, 8, 10, P.shade); r(1, 4, 14, 1, P.shade); R(11, 5, 3, 3, P.red); r(12, 6, 1, 1, P.cream);
  },
  /* the big sights: a dome with a flag */
  'sys.sights': () => {
    OV(3, 3, 10, 10, P.teal); r(2, 8, 12, 7, P.paper); R(2, 8, 12, 2, P.shade); for (let i = 0; i < 4; i++) r(3 + i * 3, 10, 1, 5, P.steel);
    r(1, 14, 14, 2, P.slate); r(8, 0, 1, 4, P.slate); PG([[9, 0], [13, 1], [9, 3]], P.red);
  },
  /* the shelf itself: three books and a question tag */
  'sys.shelf': () => {
    R(1, 3, 3, 10, P.red); R(5, 2, 3, 11, P.blue); R(9, 4, 3, 9, P.green); r(2, 5, 1, 2, P.cream); r(6, 4, 1, 2, P.cream); r(10, 6, 1, 2, P.cream);
    r(0, 13, 16, 2, P.wood); OV(11, 0, 5, 5, P.gold); r(13, 1, 1, 2, P.dark); r(13, 3, 1, 1, P.dark);
  },
  /* quick tools: a compass with a spark */
  'sys.tools': () => {
    OV(1, 2, 13, 13, P.cream); OV(3, 4, 9, 9, P.sky); PG([[8, 5], [10, 9], [7, 8]], P.red); PG([[7, 8], [10, 9], [6, 12]], P.white);
    ps([[14, 1], [13, 2], [15, 2], [14, 3], [14, 2]], P.yellow);
  },
  /* fun right now: a ticket and a star */
  'sys.fun': () => {
    PG([[1, 6], [12, 3], [14, 9], [3, 12]], P.pink); ln(5, 5, 7, 11, lt(P.pink, .5)); PG([[11, 8], [12, 11], [15, 11], [13, 13], [14, 16], [11, 14], [8, 16], [9, 13], [7, 11], [10, 11]], P.gold);
  },
  /* a rainy day: an umbrella */
  'sys.rainy': () => {
    PG([[8, 1], [14, 4], [15, 8], [1, 8], [2, 4]], P.blue); ps([[4, 8], [8, 8], [12, 8]], P.navy); r(8, 8, 1, 6, P.slate); r(6, 14, 3, 1, P.slate); r(6, 13, 1, 1, P.slate);
    ps([[2, 11], [3, 13], [12, 11], [13, 13]], P.sky);
  },
  /* this weekend: two calendar leaves */
  'sys.weekend': () => {
    R(1, 3, 8, 10, P.white); r(1, 3, 8, 3, P.red); R(7, 5, 8, 10, P.white); r(7, 5, 8, 3, P.gold); ps([[9, 10], [11, 10], [13, 10], [9, 12], [11, 12]], P.slate); ps([[3, 8], [5, 8], [3, 10]], P.slate);
  },
  /* tonight: a moon over a lit window */
  'sys.tonight': () => {
    OV(8, 0, 7, 7, P.lemon); OV(10, 0, 5, 5, P.navy); R(1, 7, 9, 9, P.dark); r(3, 9, 2, 2, P.yellow); r(6, 9, 2, 2, P.yellow); r(3, 12, 2, 2, P.orange); ps([[4, 2], [2, 4], [13, 9]], P.white);
  },
  /* first-time tip: a waving hand-lettered "hi" card */
  'sys.first': () => {
    R(1, 2, 14, 10, P.cream); PG([[4, 12], [8, 12], [4, 15]], P.cream); r(4, 5, 1, 5, P.red); r(6, 5, 1, 5, P.red); r(5, 7, 1, 1, P.red); r(9, 7, 1, 3, P.teal); r(9, 5, 1, 1, P.teal); r(12, 5, 1, 3, P.gold); r(12, 9, 1, 1, P.gold);
  },
};
for (const [id, body] of Object.entries(SYSTEM_ICONS)) if (!ICONS[id]) ICONS[id] = icon(body);
void OV;
export const galleryItems = Object.keys(SYSTEM_ICONS).map(id => ({ id: 'icon.' + id, sb: [0, 0, 16, 16], draw: ICONS[id] }));
