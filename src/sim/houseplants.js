// Houseplants in flower shops + some home-goods counters (owner, 2026-11-16: "The flower shops in the game should allow you to buy houseplants as well.
// And maybe they should also be available at some of the home goods stores.")
//
// DATA ONLY + one helper: no new art. The plants are the existing home-goods catalogue pieces (data/goods.js, category 'plants', ids g_*), which
// sim/goods.js already registers as `homegood` items with art, Decorate placement, watering (art tag 'plant' -> "Water the Plants") and Comfort ambience.
// This module only adds venue ids to those items' `soldAt` (at import time, so public_places' florist instances copy them when the city is built,
// and again in init() for any instance that already exists).
//
//   FLORIST_PLANTS   20 houseplants every florist (type gen_retail_florist and every 'pub:<n>' instance of it) sells next to its bouquets
//   EXTRA            smaller selections: Old Town Market flower stall, Nest & Wire (downtown counter), Nest & Wire Home (Galleria), Garden Gifts (conservatory)
// G.houseplants
//   venues() -> [venueId]          every venue this module stocks (florist instances resolved at call time)
//   carryHome(itemId, venueId) -> null | bool   ui/shop.js asks this before its home-goods delivery: a small carry-able plant bought over a NON goods-store
//                                  counter goes into the goods shopping bag (G.goods.buy: pays, toasts, emits goods:buy + shop:buy) and is unpacked into storage
//                                  when you walk into your home, exactly like small pieces picked off a home-goods store shelf. null = not handled (normal
//                                  next-day delivery, e.g. big plants or a full bag); true = bought; false = refused (money).
// The shop window names the home tab "Houseplants" when every home good at that counter is a plant, and the plant section "Houseplants" everywhere (ui/shop.js).
import { G } from '../core/game.js';
import { ITEM_BY_ID } from '../data/items.js';
import { VENUES, VENUE_BY_ID } from '../data/venues.js';
import { GOOD_BY_ID } from '../data/goods.js';
import './goods.js';   // registers the g_* items first

export const order = 54;   // before public_places (55) builds the florist instances

/* small to big; prices are the catalogue's (by size): $8 succulent ... $95 fiddle-leaf fig */
export const FLORIST_PLANTS = [
  'g_sp_succulent', 'g_sp_lavender', 'g_sp_ivy', 'g_sp_herbs', 'g_sp_cactus3', 'g_sp_moss', 'g_sp_orchid', 'g_sp_orchid_white', 'g_sp_terrarium', 'g_sp_bonsai',
  'g_wp_airplants', 'g_wp_pearls', 'g_wp_macrame',
  'g_snake_plant', 'g_plant_fern', 'g_plant_lily', 'g_plant_calathea', 'plant_t1', 'g_plant_pothos', 'g_fiddle_tall',
];
export const EXTRA = {
  market_stalls: ['g_sp_succulent', 'g_sp_cactus3', 'g_sp_herbs', 'g_sp_lavender', 'g_sp_orchid', 'g_snake_plant'],          // the flower stall at Old Town Market (already: Hanging Fern)
  homegoods: ['g_snake_plant', 'g_plant_zz', 'g_plant_lily', 'g_plant_pothos', 'g_sp_orchid', 'g_sp_herbs'],                   // Nest & Wire downtown (already: succulent, monstera, lemon tree, hanging fern)
  'mall:nest': ['g_snake_plant', 'g_plant_lily', 'g_sp_orchid', 'g_sp_terrarium'],                                             // Nest & Wire Home, Galleria
  'conservatory:gifts': ['g_sp_orchid_white', 'g_sp_terrarium', 'g_sp_moss', 'g_wp_airplants', 'g_sp_bonsai'],                // Garden Gifts (already: 5 seedlings)
};
const FLORIST = 'gen_retail_florist';

const stockAt = (vid, ids) => { for (const id of ids) { const it = ITEM_BY_ID[id]; if (it && !it.soldAt.includes(vid)) it.soldAt = it.soldAt.concat(vid); } };   // never mutate shared soldAt arrays in place
const florists = () => VENUES.filter(v => v && v.genType === FLORIST).map(v => v.id);
function stockAll() {
  stockAt(FLORIST, FLORIST_PLANTS);
  for (const vid of florists()) stockAt(vid, FLORIST_PLANTS);
  for (const vid in EXTRA) stockAt(vid, EXTRA[vid]);
}
stockAll();

function carryHome(itemId, venueId) {
  const it = ITEM_BY_ID[itemId], g = GOOD_BY_ID[itemId], v = VENUE_BY_ID[venueId];
  if (!it || !g || !g.carry || it.tag !== 'plant' || !v || v.goods || !G.goods || !G.goods.buy) return null;
  if (G.goods.bag().length >= G.goods.BAG_MAX) return null;   // full bag: the counter delivers it instead
  return !!G.goods.buy(itemId, venueId);
}

export function init() {
  stockAll();
  G.on('scene', s => { if (s && s.id === 'city') stockAll(); });   // florist instances are registered while the city is built
  G.houseplants = { venues: () => [FLORIST].concat(florists(), Object.keys(EXTRA)), carryHome, FLORIST_PLANTS, EXTRA };
}
