// App icons for the three media apps (Pages, Reel, PlayBox), 16x16, drawn with the shared icon kit. Not listed in icons.js: this module adds
// its entries to the exported ICONS table itself when it is imported (by src/ui/phone_reader.js), so `hasIcon('app.pages')` is true.
import { icon, P, r, R, OV, PG, p } from './_lib.js';
import { ICONS } from './icons.js';

export const MEDIA_ICONS = {
  'app.pages': () => { PG([[1, 4], [7, 5], [7, 14], [1, 12]], '#fbf4e0'); PG([[9, 5], [15, 4], [15, 12], [9, 14]], '#f4e6c8'); r(7, 5, 2, 10, P.brown); for (const y of [7, 9, 11]) { r(3, y - (y > 9 ? 0 : 0), 3, 1, P.shade); r(11, y, 3, 1, P.shade); } r(12, 2, 2, 7, P.red); },
  'app.reel': () => { R(1, 3, 14, 11, '#3a3644'); r(3, 5, 10, 7, '#6fb3e0'); r(3, 10, 10, 2, '#3b82d6'); PG([[7, 6], [11, 8.5], [7, 11]], P.white); for (const x of [2, 5, 8, 11]) { p(x + 1, 3, P.gold); p(x + 1, 13, P.gold); } },
  'app.playbox': () => { R(1, 5, 14, 8, P.purple); R(0, 7, 3, 5, P.purple); R(13, 7, 3, 5, P.purple); r(3, 8, 3, 1, P.white); r(4, 7, 1, 3, P.white); OV(9, 9, 2, 2, P.gold); OV(11, 7, 2, 2, P.red); r(7, 3, 2, 2, P.slate); },
};
for (const [id, body] of Object.entries(MEDIA_ICONS)) if (!ICONS[id]) ICONS[id] = icon(body);
export const galleryItems = Object.keys(MEDIA_ICONS).map(id => ({ id: 'icon.' + id, sb: [0, 0, 16, 16], draw: ICONS[id] }));
