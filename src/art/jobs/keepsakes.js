// Keepsakes from the job stories (story/jobs_*.js ITEMS_NEW): one wall piece that draws each of the twelve (`furn.home.jobkeep`, param k = the item id), so a
// keepsake can hang at home through the furnish system, and its 16x16 inventory icon (registered into ICONS under the item id). Used by sim/_jobstory_keeps.js.
import { textY, ball } from '../../engine/raster.js';
import { ICONS } from '../icons/icons.js';
import { icon, R, OV, PG, r, ov, p, ps, ln, P as IP } from '../icons/_lib.js';
import { bx, tube, post, frameY, discY, ringY, pix, sheet, INK, BRASS, PAPER, box, qy, lw, fq, cyl, spx, dk, lt } from './_lib.js';

const OAK = '#8a5a3a', OAKD = '#5a3a28', CARD = '#f4e9cf';
const frame = (x0, x1, z0, z1, c, bg) => { qy(x0 - .05, x1 + .05, .03, z0 - .05, z1 + .05, c); qy(x0, x1, .04, z0, z1, bg); frameY(x0, x1, .04, z0, z1, dk(c, .3)); };
const ledge = (x0, x1, z) => { bx(x0, 0, z, x1 - x0, .16, .04, OAK); lw([x0, .16, z], [x1, .16, z], OAKD); };
const hook = (x, z) => { bx(x - .14, 0, z - .06, .28, .04, .12, OAK); spx(x, .06, z, 0, 0, BRASS); spx(x, .06, z, 0, 1, BRASS); };
const DRAW = {
  bean_keyring() { hook(.5, .78); lw([.5, .07, .76], [.5, .07, .62], '#8a8698'); discY(.5, .07, .52, .1, BRASS, 8); lw([.5, .08, .6], [.5, .08, .44], '#b8882a'); for (const dx of [-.1, .1]) { lw([.5, .07, .44], [.5 + dx, .07, .2], '#c8ccd4'); spx(.5 + dx, .07, .2, 0, 0, '#c8ccd4'); spx(.5 + dx, .07, .24, dx < 0 ? -1 : 1, 0, '#c8ccd4'); } },
  hollis_map() { frame(.1, .9, .12, .88, OAK, CARD); for (let i = 0; i < 6; i++) { qy(.16 + i * .12, .24 + i * .12, .05, .2, .7 - (i % 2) * .1, '#d8cdb0'); frameY(.16 + i * .12, .24 + i * .12, .05, .2, .7 - (i % 2) * .1, '#8a8698'); } textY('4', .52, .06, .86, '#c8322c'); lw([.14, .05, .16], [.86, .05, .16], '#8a8698'); },
  dots_pie_card() { frame(.18, .82, .26, .74, '#b8342e', CARD); for (let i = 0; i < 5; i++) lw([.24, .05, .66 - i * .08], [.5 + (i % 3) * .1, .05, .66 - i * .08], '#6a5a80'); pix(.62, .05, .34, ['.ccc.', 'ccccc', 'bbbbb'], { c: '#d6924a', b: '#a8642e' }); },
  sal_cards() { ledge(.14, .86, .3); for (let i = 0; i < 6; i++) bx(.28 + (i % 2) * .02, .03, .34 + i * .035, .42, .1, .035, i % 2 ? CARD : PAPER); qy(.28, .7, .14, .44, .55, PAPER); lw([.32, .15, .5], [.62, .15, .5], '#6a5a80'); lw([.26, .14, .34], [.72, .14, .56], '#c8322c'); },
  date_stamp() { ledge(.2, .8, .3); box(.36, .02, .34, .28, .12, .1, BRASS); cyl(.5, .08, .44, .05, .2, OAKD, { ol: false }); ball(.5, .08, .68, .08, OAK, { ol: false }); qy(.24, .34, .16, .34, .4, '#3a3a6a'); },
  dock_hat() { hook(.5, .82); fq([[.26, .07, .5], [.74, .07, .5], [.7, .07, .72], [.5, .07, .8], [.3, .07, .72]], '#f28a30'); qy(.2, .8, .08, .44, .5, '#d9722e'); lw([.5, .08, .5], [.5, .08, .8], lt('#f28a30', .3)); qy(.36, .64, .09, .54, .64, PAPER); lw([.4, .1, .59], [.6, .1, .59], INK); },
  station_whistle() { hook(.5, .8); lw([.5, .07, .78], [.4, .07, .5], '#c8ccd4'); lw([.5, .07, .78], [.6, .07, .5], '#c8ccd4'); lw([.4, .07, .5], [.5, .07, .4], '#c8ccd4'); lw([.6, .07, .5], [.5, .07, .4], '#c8ccd4'); box(.4, .04, .24, .26, .08, .12, '#d5dbe0'); discY(.42, .13, .3, .07, '#c8ccd4', 8); spx(.6, .13, .32, 0, 0, INK); },
  pet_secateurs() { hook(.5, .82); fq([[.38, .07, .76], [.62, .07, .76], [.58, .07, .36], [.42, .07, .36]], '#8a5a3a'); lw([.4, .08, .7], [.6, .08, .7], '#c8a070'); lw([.42, .08, .4], [.58, .08, .4], '#c8a070'); lw([.46, .08, .76], [.4, .08, .94], '#e8e2d4'); lw([.54, .08, .76], [.6, .08, .94], '#e8e2d4'); spx(.5, .08, .78, 0, 0, '#c8ccd4'); },
  cosmo_map() { frame(.1, .9, .12, .88, '#3b6fd0', PAPER); for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { qy(.22 + i * .32, .42 + i * .32, .05, .26 + j * .28, .42 + j * .28, '#e8e2d4'); frameY(.22 + i * .32, .42 + i * .32, .05, .26 + j * .28, .42 + j * .28, '#8a8698'); } qy(.2, .8, .05, .78, .82, '#8a8698'); lw([.66, .06, .2], [.74, .06, .28], '#c8322c'); lw([.66, .06, .28], [.74, .06, .2], '#c8322c'); },
  black_book() { ledge(.2, .8, .3); box(.3, .02, .34, .1, .12, .4, '#22202a'); lw([.35, .14, .36], [.35, .14, .72], '#5a5664'); box(.42, .02, .34, .3, .12, .06, '#8a3848'); spx(.36, .15, .6, 0, 0, BRASS); },
  red_pencil() { frame(.14, .86, .34, .66, OAKD, '#3f6a5a'); lw([.24, .05, .44], [.7, .05, .56], '#c8322c'); lw([.24, .06, .45], [.7, .06, .57], '#d8483b'); spx(.72, .06, .57, 0, 0, '#f4e9cf'); spx(.74, .06, .58, 0, 0, INK); spx(.24, .06, .44, -1, 0, '#e87aa0'); },
  chili_card() { frame(.18, .82, .26, .74, '#2f3f72', CARD); for (let i = 0; i < 5; i++) lw([.24, .05, .66 - i * .08], [.52 + (i % 2) * .14, .05, .66 - i * .08], INK); pix(.6, .05, .32, ['.rrr.', 'rrrrr', '.kkk.'], { r: '#c8322c', k: INK }); spx(.3, .06, .3, 0, 0, '#6b3f2a'); spx(.3, .06, .3, 1, 0, '#6b3f2a'); },
};
const IC = {
  bean_keyring() { OV(5, 1, 6, 6, IP.gold); ln(8, 2, 8, 6, IP.brown); ln(6, 8, 4, 14, IP.steel); ln(10, 8, 12, 14, IP.steel); ps([[3, 13], [3, 14], [13, 13], [13, 14]], IP.steel); },
  hollis_map() { R(1, 2, 14, 12, IP.paper); for (let i = 0; i < 4; i++) r(3 + i * 3, 5, 2, 6 - (i % 2) * 2, IP.shade); p(8, 3, IP.crimson); r(2, 12, 12, 1, IP.grey); },
  dots_pie_card() { R(1, 3, 14, 10, IP.cream); r(3, 5, 7, 1, IP.slate); r(3, 7, 5, 1, IP.slate); PG([[8, 11], [14, 11], [11, 8]], IP.bread); r(8, 11, 7, 1, IP.crust); },
  sal_cards() { R(2, 9, 12, 5, IP.paper); R(3, 6, 11, 4, IP.cream); R(2, 3, 12, 4, IP.white); r(4, 5, 7, 1, IP.slate); ln(1, 12, 14, 4, IP.crimson); },
  date_stamp() { OV(6, 1, 4, 4, IP.brown); r(7, 5, 2, 4, IP.choc); R(4, 9, 8, 4, IP.gold); r(3, 13, 10, 2, IP.navy); },
  dock_hat() { PG([[3, 10], [4, 5], [8, 3], [12, 5], [13, 10]], IP.orange); r(1, 10, 14, 2, '#d9722e'); r(6, 6, 4, 3, IP.white); r(7, 7, 2, 1, IP.ol); },
  station_whistle() { ln(3, 1, 8, 6, IP.grey); ln(13, 1, 8, 6, IP.grey); R(5, 8, 8, 4, IP.steel); OV(2, 7, 6, 6, IP.steel); p(11, 9, IP.ol); },
  pet_secateurs() { ln(4, 1, 7, 8, IP.steel); ln(12, 1, 9, 8, IP.steel); p(8, 8, IP.slate); PG([[5, 9], [8, 9], [7, 15], [4, 15]], IP.crimson); PG([[9, 9], [12, 9], [13, 15], [10, 15]], IP.crimson); },
  cosmo_map() { R(1, 2, 14, 12, IP.white); r(3, 4, 3, 3, IP.shade); r(8, 4, 3, 3, IP.shade); r(3, 9, 3, 3, IP.shade); r(8, 9, 3, 3, IP.shade); ln(11, 9, 13, 11, IP.crimson); ln(13, 9, 11, 11, IP.crimson); },
  black_book() { R(3, 2, 10, 13, IP.black); r(5, 2, 1, 13, IP.dark); r(7, 5, 4, 1, IP.gold); r(12, 3, 1, 11, IP.white); },
  red_pencil() { ln(3, 12, 11, 4, IP.crimson); ln(4, 13, 12, 5, IP.red); ps([[12, 3], [13, 3], [13, 4]], IP.tan); p(14, 2, IP.ol); ps([[2, 13], [3, 14]], IP.pink); },
  chili_card() { R(1, 3, 14, 10, IP.cream); r(3, 5, 8, 1, IP.ol); r(3, 7, 6, 1, IP.ol); OV(8, 8, 6, 4, IP.crimson); r(9, 12, 4, 1, IP.ol); p(4, 10, IP.choc); p(5, 10, IP.choc); },
};
for (const k in IC) if (!ICONS[k]) ICONS[k] = icon(IC[k]);
export const galleryItems = Object.keys(IC).map(id => ({ id: 'icon.' + id, sb: [0, 0, 16, 16], draw: ICONS[id] }));
export default [
  { id: 'furn.home.jobkeep', kind: 'furniture', tags: ['home', 'wall', 'decor', 'keepsake'], size: [1, .2, 1], wall: true, mount: 1.2, solid: false, vb: [-.2, -.2, -.1, 1.2, .5, 1.1],
    variants: Object.keys(DRAW).map(k => ({ k })), draw(p) { (DRAW[p.k] || DRAW.cosmo_map)(); } },
];
