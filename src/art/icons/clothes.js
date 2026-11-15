// Wardrobe icons: the Closet app, one glyph per piece category, laundry goods and the clothes moodlets. Registered straight into ICONS (see icons.js).
import { ICONS } from './icons.js';
import { icon, R, OV, PG, r, ov, p, ps, ln, clr, dk, lt } from './_lib.js';

const tee = c => { PG([[1, 4], [5, 2], [11, 2], [15, 4], [13, 7], [12, 6], [12, 14], [4, 14], [4, 6], [3, 7]], c); r(6, 2, 4, 2, dk(c, .25)); r(5, 13, 6, 1, dk(c, .15)); };
const pants = c => { R(4, 2, 8, 12, c); clr(7, 6, 2, 8); r(4, 2, 8, 2, dk(c, .2)); p(5, 13, lt(c, .3)); p(10, 13, lt(c, .3)); };
const washer = (c, door) => { R(2, 2, 12, 13, c); r(2, 2, 12, 3, dk(c, .12)); ps([[4, 3], [6, 3]], '#3a3a46'); p(12, 3, '#e05a3a'); OV(4, 6, 8, 8, door); ov(6, 8, 4, 4, '#7fc8e0'); p(7, 9, '#f8fbfd'); };
const BODY = {
  'app.closet': () => { R(1, 1, 14, 14, '#8a5cc2'); ln(8, 3, 8, 5, '#f4f0e8'); ln(8, 5, 3, 9, '#f4f0e8'); ln(8, 5, 13, 9, '#f4f0e8'); r(3, 9, 11, 1, '#f4f0e8'); r(5, 10, 6, 4, '#f2c230'); r(5, 10, 6, 1, '#d9a23a'); },
  'ui.hanger': () => { ln(8, 2, 8, 5, '#6a4428'); p(9, 2, '#6a4428'); ln(8, 5, 2, 11, '#b8794a'); ln(8, 5, 14, 11, '#b8794a'); r(2, 11, 13, 2, '#b8794a'); },
  'ui.scissors': () => { ln(4, 2, 10, 10, '#c8ccd4'); ln(12, 2, 6, 10, '#9aa0a8'); OV(2, 10, 5, 5, '#d9483b'); OV(9, 10, 5, 5, '#d9483b'); p(8, 6, '#3a3a46'); },
  'ui.hamper': () => { PG([[3, 6], [13, 6], [12, 14], [4, 14]], '#c8a070'); for (let y = 8; y < 14; y += 2) r(4, y, 8, 1, '#a8804a'); r(4, 3, 4, 3, '#d9483b'); r(7, 2, 4, 4, '#5ab0e0'); r(10, 4, 3, 2, '#e8b83a'); },
  'ui.washer': () => washer('#f4f1ea', '#c2cad0'),
  'cat.top': () => tee('#5ab0e0'), 'cat.outer': () => { tee('#2f3f72'); r(7, 4, 2, 10, '#f4f0e8'); ps([[6, 7], [6, 10]], '#e8c06a'); },
  'cat.dress': () => { PG([[5, 2], [11, 2], [11, 6], [14, 14], [2, 14], [5, 6]], '#d9483b'); r(5, 6, 6, 1, dk('#d9483b', .25)); clr(7, 2, 2, 1); ps([[5, 10], [9, 11], [11, 9]], '#f4f0e8'); },
  'cat.bottom': () => pants('#4a6fa8'),
  'cat.shoes': () => { PG([[2, 9], [6, 6], [9, 9], [14, 10], [14, 13], [2, 13]], '#d9483b'); r(2, 12, 13, 2, '#f0ece4'); ps([[6, 8], [8, 9]], '#f0ece4'); },
  'cat.hat': () => { OV(4, 3, 8, 8, '#3b6fd0'); r(1, 10, 14, 2, '#3b6fd0'); r(4, 9, 8, 1, '#f4f0e8'); p(6, 4, lt('#3b6fd0', .4)); },
  'cat.acc': () => { OV(2, 5, 5, 5, '#22202c'); OV(9, 5, 5, 5, '#22202c'); r(7, 6, 2, 1, '#22202c'); p(3, 6, '#9ad0e8'); p(10, 6, '#9ad0e8'); r(5, 12, 6, 1, '#e8c06a'); p(8, 13, '#e8c06a'); },
  hamper_t0: () => BODY['ui.hamper'](), hamper_t1: () => { R(3, 5, 10, 10, '#f1ede4'); r(3, 5, 10, 2, '#d8d2c4'); r(4, 9, 8, 1, '#d8d2c4'); r(5, 2, 4, 3, '#5ab0e0'); r(8, 3, 3, 2, '#d9483b'); },
  washer_t0: () => washer('#e9e4d6', '#8e979d'), washer_t1: () => washer('#f4f1ea', '#c2cad0'), washer_t2: () => washer('#4a4a58', '#d9b65c'),
  dryer_t1: () => { R(2, 2, 12, 13, '#f4f1ea'); r(2, 2, 12, 3, '#d8d5cc'); p(4, 3, '#e05a3a'); OV(4, 6, 8, 8, '#8e979d'); ov(6, 8, 4, 4, '#f0b060'); p(7, 9, '#fff8e0'); },
  dryrack_t0: () => { ln(2, 14, 13, 4, '#9aa0a8'); ln(13, 14, 2, 4, '#9aa0a8'); r(1, 4, 14, 1, '#c2cad0'); r(3, 5, 2, 5, '#d9483b'); r(7, 5, 2, 6, '#e8b83a'); r(11, 5, 2, 4, '#5ab0e0'); },
  'moodlet.musty_clothes': () => { tee('#a8a070'); ps([[3, 1], [4, 0], [12, 1], [13, 0]], '#6f7a48'); }, 'moodlet.fresh_clothes': () => { tee('#f4f0e8'); ps([[13, 1], [14, 2], [12, 2], [13, 3], [13, 2]], '#f2c230'); },
  'moodlet.underdressed': () => { tee('#5ab0e0'); ps([[2, 11], [3, 12], [2, 13], [13, 11], [12, 12], [13, 13]], '#bfe4f4'); }, 'moodlet.overdressed': () => { tee('#d9483b'); ps([[2, 1], [2, 3], [13, 1], [13, 3]], '#f09a3a'); },
};
for (const k in BODY) if (!ICONS[k]) ICONS[k] = icon(BODY[k]);
export const galleryItems = Object.keys(BODY).map(id => ({ id: 'icon.' + id, sb: [0, 0, 16, 16], draw: ICONS[id] }));
