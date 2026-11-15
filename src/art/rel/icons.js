// Relationship art (src/art/rel): the Porchlight app icon (a lit porch lamp), 16x16, drawn with the shared icon kit and added to the ICONS table when
// this module is imported (by src/ui/phone_porchlight.js), the way src/art/icons/media.js adds the media apps.
import { icon, r, R, OV, p } from '../icons/_lib.js';
import { ICONS } from '../icons/icons.js';

export const REL_ICONS = {
  /* a porch lamp on its bracket, lit: warm glass, a dark cap, a halo of light on a dusk-blue tile */
  'app.porchlight': () => {
    R(1, 1, 14, 14, '#2e3a5c');
    OV(4, 4, 8, 8, '#ffd98a'); OV(5, 5, 6, 6, '#fff3c4');
    r(6, 3, 4, 1, '#1d1a2b'); r(5, 4, 6, 1, '#1d1a2b'); r(7, 2, 2, 1, '#1d1a2b');
    r(6, 5, 4, 5, '#ffb94a'); r(7, 6, 2, 3, '#fff8dc'); r(6, 10, 4, 1, '#1d1a2b'); r(7, 11, 2, 1, '#1d1a2b');
    r(11, 3, 3, 1, '#1d1a2b'); p(13, 4, '#1d1a2b'); p(13, 5, '#1d1a2b');
    p(3, 12, '#ffd98a'); p(12, 12, '#ffd98a'); p(8, 13, '#ffd98a');
  },
};
for (const [id, body] of Object.entries(REL_ICONS)) if (!ICONS[id]) ICONS[id] = icon(body);
export const galleryItems = Object.keys(REL_ICONS).map(id => ({ id: 'icon.' + id, sb: [0, 0, 16, 16], draw: ICONS[id] }));
