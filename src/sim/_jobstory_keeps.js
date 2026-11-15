// _jobstory_keeps.js — the keepsakes of the job stories as REAL THINGS (helper of sim/jobstory.js; J3).
// Every keepsake of story/jobs_*.js (ITEMS_NEW) is registered at import as a home good that hangs on a wall (art: src/art/jobs/keepsakes.js `furn.home.jobkeep`,
// icon under the item id): given by a beat, it goes into the home's storage (G.housing.addFurniture, instant) and is placed through the furnish system like any
// other piece. It is not sold anywhere and has no price. The two recipe cards also TEACH their recipe through the cooking system (G.cooking.learn):
//   dots_pie_card -> 'berry_pie' (Diner Berry Pie)        chili_card -> 'chili' (Three-Alarm Chili: Station 2's)
// grant(id) -> { item, recipe } what was handed over      sync(keeps, given) hands over anything an older save holds only as a list entry (once per id)
import { G } from '../core/game.js';
import { ITEMS, ITEM_BY_ID, HOMEGOODS, RECIPE_BY_ID } from '../data/items.js';
import { ITEMS_NEW } from '../story/jobs_arcs.js';
import { VIS } from './housing.js';

export const TEACHES = { dots_pie_card: 'berry_pie', chili_card: 'chili' };
const ICON = { bean_keyring: 'two keys on a brass coffee bean', hollis_map: 'framed pencil map of a shop', dots_pie_card: 'index card with a slice of pie', sal_cards: 'stack of index cards', date_stamp: 'brass date stamp, wooden handle', dock_hat: 'orange hard hat with a name', station_whistle: 'silver whistle on a chain',
  pet_secateurs: 'secateurs in a leather holster', cosmo_map: 'pencil map of a classroom with an X', black_book: 'thin black book', red_pencil: 'red pencil, worn short', chili_card: 'index card with a pot of chili' };
for (const id in ITEMS_NEW) {
  if (ITEM_BY_ID[id]) continue; const k = ITEMS_NEW[id];
  const it = { id, name: k.name, category: 'homegood', price: 0, icon: ICON[id] || 'keepsake', effects: {}, stack: 1, soldAt: [], tag: 'decor', tier: 1, footprint: [1, 1], placement: 'wall', bonus: { mult: 1, ambience: 1 }, note: k.desc, keepsake: true, job: k.job };
  ITEMS.push(it); ITEM_BY_ID[id] = it; HOMEGOODS.push(it); VIS[id] = { a: 'jobkeep', p: { k: id } };
}
const safe = (f, d) => { try { const v = f(); return v === undefined || v === null ? d : v; } catch (e) { return d; } };
export function grant(id) {
  const out = { item: false, recipe: null }; if (!ITEMS_NEW[id]) return out;
  out.item = !!safe(() => G.housing.addFurniture(id, { instant: true, quiet: true }), false);
  const r = TEACHES[id]; if (r && RECIPE_BY_ID[r]) { if (safe(() => G.cooking.learn(r, 'gift'), false) || safe(() => G.cooking.knows(r), false)) out.recipe = RECIPE_BY_ID[r].name; }
  return out;
}
/** older saves: a keepsake that is only a list entry becomes the thing (once) */
export function sync(keeps, given) { const out = []; for (const id of keeps || []) if (!given[id]) { given[id] = 1; const g = grant(id); if (g.item || g.recipe) out.push(id); } return out; }
