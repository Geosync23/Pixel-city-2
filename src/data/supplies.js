// supplies.js — toiletries and cleaning supplies: the things at home that run out with use and send you on a small errand (Wave C).
// Pure design data + the item registration (the same add-only pattern as data/post.js / data/museum.js: nothing in data/items.js is edited).
//
// SUPPLIES[] fields
//   key        stock key in G.state.supplies.stock          item   the shop item (category 'misc') that refills it
//   name       how the stock is called in text ("soap")     uses   how many uses one bought item adds
//   start      uses in the bathroom / cupboard on day 1 (and in old saves): enough for the first few days
//   low        at or under this many uses the one friendly "running low" notice goes out (then only the quiet HUD basket)
//   kind       'toiletry' | 'cleaning' | 'laundry'           needs  (laundry only) the stock is only watched once you own a washer
// What uses what lives in USE (src/sim/supplies.js reads it).
import { ITEMS, ITEM_BY_ID, MISC } from './items.js';
import { VENUES } from './venues.js';

export const SUPPLIES = [
  { key: 'soap', item: 'sup_soap', name: 'soap', uses: 24, start: 8, low: 3, kind: 'toiletry' },
  { key: 'shampoo', item: 'sup_shampoo', name: 'shampoo', uses: 18, start: 6, low: 2, kind: 'toiletry' },
  { key: 'toothpaste', item: 'sup_toothpaste', name: 'toothpaste', uses: 30, start: 10, low: 3, kind: 'toiletry' },
  { key: 'tp', item: 'sup_toilet_paper', name: 'toilet paper', uses: 30, start: 11, low: 4, kind: 'toiletry' },
  { key: 'cleaner', item: 'sup_cleaner', name: 'all-purpose cleaner', uses: 8, start: 2, low: 1, kind: 'cleaning' },
  { key: 'sponge', item: 'sup_sponges', name: 'sponges and cloths', uses: 8, start: 3, low: 1, kind: 'cleaning' },
  { key: 'detergent', item: 'sup_detergent', name: 'laundry detergent', uses: 12, start: 0, low: 1, kind: 'laundry', needs: 'washer' },
];
export const SUPPLY_BY_KEY = Object.fromEntries(SUPPLIES.map(s => [s.key, s]));
export const SUPPLY_BY_ITEM = Object.fromEntries(SUPPLIES.map(s => [s.item, s]));

// uses per action (fractions are fine: a hand-wash is a fifth of a "use" of soap)
export const USE = {
  shower: { soap: 1, shampoo: 1 }, bath: { soap: 1, shampoo: 1 }, wash_hands: { soap: 0.2 }, toilet: { tp: 1 }, brush: { toothpaste: 1 },
  clean: { cleaner: 1, sponge: 1 }, wash: { detergent: 1 },
};
// what going without costs (always small, never a lecture): hygiene taken back off after the activity
export const WITHOUT = { soap: { shower: -10, bath: -10 }, shampoo: { shower: -5, bath: -5 }, tp: { toilet: -4 } };
export const BRUSH = { minutes: 3, hygiene: 8, perDay: 3, moodlet: 'minty' };   // hygiene only for the first `perDay` brushes of a day

// Shops: venue TYPE ids that stock each group (instances of a type inherit it; see venues_extra.registerInstance) + single venue ids.
const TOILETRY_AT = ['grocery', 'cornerstore', 'gen_grocery_m', 'gen_bodega', 'gen_retail_pharmacy'];
const CLEANING_AT = ['grocery', 'cornerstore', 'gen_grocery_m', 'gen_bodega', 'gen_retail_hardware', 'gen_retail_pharmacy'];
const M = (id, name, price, icon, soldAt, note) => ({ id, name, category: 'misc', price, icon, effects: {}, stack: 4, soldAt: soldAt.slice(), note, supply: true });
export const SUPPLY_ITEMS = [
  M('sup_soap', 'Bar Soap (3-pack)', 4, 'mint green soap bar, bubbles', TOILETRY_AT, 'Goes in your bathroom when you get home. About three weeks of showers and hand-washing.'),
  M('sup_shampoo', 'Shampoo', 6, 'violet bottle, white label', TOILETRY_AT, 'Goes in your bathroom when you get home. About 18 washes.'),
  M('sup_toothpaste', 'Toothpaste', 3, 'white tube, red and blue stripe', TOILETRY_AT, 'Goes by your sink when you get home. Brush at the bathroom sink.'),
  M('sup_toilet_paper', 'Toilet Paper (6 rolls)', 5, 'white roll, quilted', TOILETRY_AT, 'Goes in your bathroom when you get home. You will be glad you have it.'),
  M('sup_cleaner', 'All-Purpose Cleaner', 5, 'blue spray bottle, red trigger', CLEANING_AT, 'For a proper clean at home (with sponges). Eight cleans in a bottle.'),
  M('sup_sponges', 'Sponges & Cloths', 3, 'yellow sponge, pink cloth', CLEANING_AT, 'For a proper clean at home (with cleaner). Eight cleans in a pack.'),
  M('sup_detergent', 'Laundry Detergent', 7, 'orange jug, blue cap', CLEANING_AT, 'For your own washer at home. Twelve loads.'),
];
for (const it of SUPPLY_ITEMS) {
  if (ITEM_BY_ID[it.id]) continue;
  /* converted shopfronts are their own venues (genType): give them what their type stocks, whenever they were registered */
  for (const v of VENUES) if (v.genType && it.soldAt.includes(v.genType) && !it.soldAt.includes(v.id)) it.soldAt.push(v.id);
  ITEMS.push(it); ITEM_BY_ID[it.id] = it; if (Array.isArray(MISC)) MISC.push(it);
}
/** call once the city exists: instances registered after this module loaded get the stock too */
export function syncSupplyShops() {
  for (const it of SUPPLY_ITEMS) { const live = ITEM_BY_ID[it.id] || it; for (const v of VENUES) if (v.genType && live.soldAt.includes(v.genType) && !live.soldAt.includes(v.id)) live.soldAt.push(v.id); }
}
