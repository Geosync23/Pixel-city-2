// Maple Bay University — 16x16 item icons for the `uni_*` items (registered into the shared ICONS table; no world assets here).
import { ICONS } from '../icons/icons.js';
import { icon, R, r, OV, ov, PG, ln, p, ps, P, steam } from '../icons/_lib.js';
const NAVY = '#2f3f72', GOLD = '#e8b83a', CREAM = '#f4ead0';
const cert = c => () => { R(2, 2, 12, 11, CREAM); r(4, 4, 8, 1, NAVY); r(4, 6, 6, 1, P.shade); r(4, 8, 7, 1, P.shade); OV(9, 9, 5, 5, GOLD); PG([[10, 13], [12, 13], [12, 16], [11, 15], [10, 16]], c); p(11, 11, CREAM); };
const RIB = { cook: '#c8683f', art: '#d94f7a', write: '#5a4a8a', code: '#3b82d6', music: '#2f9a94', speak: '#e8843a', eco: '#4fa860', fix: '#7a8a9a' };
const I = {
  uni_card: () => { R(1, 3, 14, 10, NAVY); r(2, 4, 12, 1, GOLD); R(3, 6, 4, 5, P.skin); r(3, 6, 4, 1, P.choc); r(9, 7, 4, 1, CREAM); r(9, 9, 3, 1, CREAM); ps([[12, 11], [11, 11]], GOLD); },
  uni_diploma: () => { R(1, 5, 14, 6, CREAM); OV(0, 5, 3, 6, P.shade); OV(13, 5, 3, 6, P.shade); r(7, 4, 2, 8, NAVY); OV(6, 6, 4, 4, GOLD); PG([[6, 10], [8, 10], [8, 14], [7, 13], [6, 14]], NAVY); PG([[8, 10], [10, 10], [10, 14], [9, 13], [8, 14]], NAVY); },
  uni_coffee: () => { R(3, 6, 8, 8, NAVY); r(11, 8, 2, 1, NAVY); r(12, 9, 1, 3, NAVY); r(11, 12, 2, 1, NAVY); r(4, 6, 6, 2, P.coffee); p(7, 10, GOLD); steam(6, 0); },
  uni_tea: () => { OV(1, 11, 14, 4, P.white); R(4, 6, 8, 6, P.white); r(5, 6, 6, 1, '#c8843a'); r(12, 8, 2, 1, P.white); r(13, 9, 1, 2, P.white); OV(6, 4, 4, 3, P.lemon); steam(4, 0); },
  uni_toastie: () => { PG([[1, 12], [8, 3], [15, 12]], P.bread); ln(3, 12, 13, 12, P.crust); ln(4, 10, 12, 10, P.yellow); ln(5, 9, 11, 9, P.tomato); ps([[6, 7], [9, 6], [8, 8]], P.crust); },
  uni_soup: () => { OV(1, 6, 14, 8, P.white); OV(3, 6, 10, 4, P.orange); ps([[6, 7], [9, 8]], P.cream); OV(11, 11, 5, 4, P.bread); },
  uni_flapjack: () => { R(2, 5, 12, 8, '#d8a040'); ps([[4, 7], [7, 6], [10, 8], [5, 10], [9, 11], [12, 10]], '#b87a28'); ps([[6, 8], [11, 6]], P.cream); },
  uni_crumble: () => { OV(1, 7, 14, 7, '#c8683f'); OV(3, 6, 10, 5, '#e8c070'); ps([[5, 7], [8, 6], [10, 8], [7, 9]], '#b8863a'); ov(9, 8, 4, 2, P.lemon); },
  uni_mug: () => { R(3, 4, 8, 10, NAVY); r(11, 6, 2, 1, NAVY); r(12, 7, 1, 4, NAVY); r(11, 11, 2, 1, NAVY); PG([[5, 6], [9, 6], [9, 10], [7, 12], [5, 10]], GOLD); p(7, 8, NAVY); },
  uni_pennant: () => { ln(2, 1, 2, 14, P.wood); PG([[3, 2], [15, 6], [3, 10]], NAVY); ln(4, 3, 4, 9, GOLD); ps([[7, 6], [9, 6], [11, 6]], GOLD); },
};
for (const k in RIB) I['uni_cert_' + k] = cert(RIB[k]);
for (const k in I) if (!ICONS[k]) ICONS[k] = icon(I[k]);
export const galleryItems = Object.keys(I).map(id => ({ id: 'icon.' + id, sb: [0, 0, 16, 16], draw: ICONS[id] }));
export default [];
