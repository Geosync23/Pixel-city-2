// Maple Bay icon set: flat 16x16 pixel icons drawn with the raster kit (see _lib.js).
//
//   import { drawIcon, ICON_SIZE } from '../art/icons/icons.js';
//   const spr = toSprite(render([0, 0, 16, 16], () => drawIcon('apple')));   // sprite.c is a 22x22 canvas (3px pad)
//   // or render([0,0,16,16], () => drawIcon(id), null, 0) for an exact 16x16 buffer
//
// Ids: items use their exact item id ('apple', 'cafe_latte', 'bed_t1' ...). Everything else is namespaced:
//   need.*  skill.*  mood.*  moodlet.*  rel.*  ui.*  weather.*  season.*  transport.*  app.*  venue.*  poi.*  job.*  cat.*
// drawIcon(id, category?) never throws: unknown ids fall back to a category icon (cat.food, cat.drink ...) or a '?' box.
import { icon, begin, flush, r, R, p, ps, spr, OL, P } from './_lib.js';
import { UI, NEEDS, SKILLS, FACES, WEATHER, REL, TRANSPORT } from './ui.js';

export const ICON_SIZE = 16;

/** raw icon bodies by id (drawn into the 16x16 paint buffer). Add new icons to the module tables. */
const BODIES = Object.assign({}, UI, NEEDS, SKILLS, FACES, WEATHER, REL, TRANSPORT);

/** id -> alias id (moodlets and other synonyms) */
const ALIAS = {};

/** id -> draw fn (16x16, top-left at the current origin PW(0,0,0)) */
export const ICONS = {};
for (const [id, body] of Object.entries(BODIES)) ICONS[id] = icon(body);
for (const [id, to] of Object.entries(ALIAS)) if (ICONS[to] && !ICONS[id]) ICONS[id] = ICONS[to];

const unknown = icon(() => {
  R(1, 1, 14, 14, '#c9c2d8');
  spr(4, 3, ['.####.', '##..##', '....##', '...##.', '..##..', '..##..', '......', '..##..'], { '#': OL });
});
ICONS['ui.unknown'] = unknown;

export const hasIcon = id => Object.prototype.hasOwnProperty.call(ICONS, id);

/** draw icon `id` (16x16) with its top-left at the origin. category: optional fallback hint. Never throws. */
export function drawIcon(id, category) {
  let fn = hasIcon(id) ? ICONS[id] : null;
  if (!fn) fn = ICONS[resolveFallback(String(id || ''), category)] || unknown;
  try { fn(); } catch (e) { try { unknown(); } catch (e2) { /* nothing */ } }
}
export function resolveFallback(id, category) { return 'ui.unknown'; }

export const galleryItems = Object.keys(ICONS).map(id => ({ id: 'icon.' + id, sb: [0, 0, 16, 16], draw: ICONS[id] }));
