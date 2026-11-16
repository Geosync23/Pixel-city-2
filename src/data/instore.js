// instore.js — which home goods and clothes can be ORDERED ONLINE and which are ONLY SOLD IN STORE (owner msgs 167-168, BIBLE "Direction update 35").
// Pure data + pure functions (node-safe: the check script tools/instore_check.mjs and the game share it). Runtime API: src/sim/instore.js (G.instore).
//
// THE RULE (deterministic: by tier / brand / tag + the explicit override lists below; never random per session)
//  Home goods (data/goods.js), decided per FAMILY (every colourway of a piece shares the answer):
//    1. STORE_FAMILY / ONLINE_FAMILY overrides win (festival and seasonal pieces, souvenirs, the showpieces of a store).
//    2. A family sold ONLY at Atelier Nord (designer showroom) and / or The Gilded Attic (antiques, one of a kind) is in store only.
//    3. In every category the cheapest ONLINE_SHARE (42%) of the families are orderable (cheapest first, ties by family id); the rest (the nicer,
//       larger, dearer pieces) are in store only. The cheapest family of every category is always orderable, so a room can always be furnished from the phone.
//  Older tiered home goods (data/items.js `*_t0/_t1/_t2`, sold at Nest & Wire and through the home computer's online shop): t0 and t1 online, t2 and
//    anything from $300 up in store only.
//  Clothes (data/clothes*.js), decided per piece:
//    1. STORE_PIECE / ONLINE_PIECE overrides win.
//    2. Catalogue exclusives (`online: true`, shops = ['online'] only) stay online: no shop has them.
//    3. Seasonal pieces (`season` set) are in store only (they are the racks that change with the season).
//    4. Boutique / signature brands (STORE_BRANDS: Marigold, Hollowell & Sons, Nightjar, Juniper & Rye, Second Wind vintage, Little Lantern handmade)
//       are in store only: they are what makes Marigold & Main, Ink & Ivy, the market and the hotel boutique worth the trip.
//    5. Otters team merch (name has "Otters") is in store only: the team store and the gym.
//    6. Maple Basics (the everyday staples) is all online.
//    7. Every other high-street brand: in each brand + slot (accessories by kind), the cheapest PIECE_SHARE (75%) are online, the dearer rest in store.
//    8. Guarantee: the cheapest non-seasonal piece of every slot / accessory kind is online, so you can always dress from the phone.
//  Nothing scripted orders a specific piece online (checked: story, chapters, Opportunities, first-time cards, tips), so no scripted exceptions were needed;
//  SCRIPTED lists the ids that must stay online if that ever changes.
//
// Exports: goodOnline(goodOrId) -> bool, familyOnline(family) -> bool, itemOnline(itemId) -> bool (any home good incl. legacy tiers; non-furniture -> true),
//          pieceOnline(pieceOrId) -> bool, applyClothes(CATALOG) (puts / removes 'online' in each piece's shops: idempotent), splitGoods(), splitClothes(), RULE_TEXT.
import { GOODS, GOOD_BY_ID, CATS } from './goods.js';
import { CATALOG, PIECE_BY_ID } from './clothes.js';
import { ITEM_BY_ID } from './items.js';

export const ONLINE_SHARE = 0.42, PIECE_SHARE = 0.75;
export const STORE_BRANDS = ['marigold', 'hollowell', 'nightjar', 'juniper_rye', 'second_wind', 'little_lantern'];
/** goods (any colourway names its family) that are in store only whatever their price: festival / seasonal / souvenir / store showpieces */
export const STORE_GOODS = ['g_xmastree', 'g_pumpkin_carved', 'g_wp_wreath_berry', 'g_d_snowglobe', 'g_wl_star', 'g_lamp_lantern', 'g_egg_white'];
/** goods that stay orderable whatever the rule says (scripted / tutorial pieces would go here) */
export const ONLINE_GOODS = [];
export const STORE_PIECE = [];
export const ONLINE_PIECE = [];
/** ids that a story / tutorial / Opportunity tells the player to order online (none today; keep them online if added) */
export const SCRIPTED = [];
const DESIGNER = new Set(['goods:nord', 'goods:attic']);

/* ---------- home goods ---------- */
let FAM = null;
function famTable() {
  if (FAM) return FAM;
  const fams = new Map();
  for (const g of GOODS) { let f = fams.get(g.family); if (!f) fams.set(g.family, f = { family: g.family, cat: g.cat, price: g.price, stores: new Set(), ids: [] }); f.ids.push(g.id); f.price = Math.min(f.price, g.price); for (const s of g.stores) f.stores.add(s); }
  const force = (list, v) => { const out = new Map(); for (const id of list) { const g = GOOD_BY_ID[id]; if (g) out.set(g.family, v); } return out; };
  const over = new Map([...force(STORE_GOODS, false), ...force(ONLINE_GOODS.concat(SCRIPTED.filter(id => GOOD_BY_ID[id])), true)]);
  FAM = {};
  for (const cat of Object.keys(CATS)) {
    const list = [...fams.values()].filter(f => f.cat === cat).sort((a, b) => a.price - b.price || (a.family < b.family ? -1 : 1)); if (!list.length) continue;
    const want = Math.max(1, Math.round(ONLINE_SHARE * list.length)); let n = 0;
    for (const f of list) { if (over.has(f.family)) { FAM[f.family] = over.get(f.family); if (FAM[f.family]) n++; } }
    for (const f of list) {
      if (over.has(f.family)) continue;
      const designer = [...f.stores].every(s => DESIGNER.has(s));
      FAM[f.family] = !designer && n < want; if (FAM[f.family]) n++;
    }
    if (!list.some(f => FAM[f.family])) FAM[list[0].family] = true;   // the cheapest of every category can always be ordered
  }
  return FAM;
}
export const familyOnline = family => famTable()[family] !== false;
export function goodOnline(g) { if (typeof g === 'string') g = GOOD_BY_ID[g]; return !g || familyOnline(g.family); }
/** any item id: goods by the family rule, the older tiered home goods by tier, everything that is not furniture / decor -> true */
export function itemOnline(id) {
  if (GOOD_BY_ID[id]) return goodOnline(id);
  const it = ITEM_BY_ID[id]; if (!it || it.category !== 'homegood') return true;
  if (ONLINE_GOODS.includes(id) || SCRIPTED.includes(id)) return true; if (STORE_GOODS.includes(id)) return false;
  return /_t[012]$/.test(id) ? !/_t2$/.test(id) : it.price < 300;
}

/* ---------- clothes ---------- */
const slotKey = p => (p.slot === 'acc' ? 'acc:' + p.kind : p.slot);
let PCS = null;
function pieceTable() {
  if (PCS) return PCS; PCS = {};
  const groups = new Map();
  for (const p of CATALOG) {
    let v = null;
    if (STORE_PIECE.includes(p.id)) v = false; else if (ONLINE_PIECE.includes(p.id) || SCRIPTED.includes(p.id)) v = true;
    else if (p.online) v = true;
    else if (p.season !== null && p.season !== undefined) v = false;
    else if (STORE_BRANDS.includes(p.brand)) v = false;
    else if (/Otters/.test(p.name)) v = false;
    else if (p.brand === 'maple_basics') v = true;
    if (v !== null) { PCS[p.id] = v; continue; }
    const k = p.brand + '|' + slotKey(p); let gr = groups.get(k); if (!gr) groups.set(k, gr = []); gr.push(p);
  }
  for (const gr of groups.values()) { gr.sort((a, b) => a.price - b.price || (a.id < b.id ? -1 : 1)); const want = Math.max(1, Math.round(PIECE_SHARE * gr.length)); gr.forEach((p, i) => { PCS[p.id] = i < want; }); }
  const bySlot = new Map(); for (const p of CATALOG) { if (p.season !== null && p.season !== undefined || STORE_PIECE.includes(p.id)) continue; const k = slotKey(p), c = bySlot.get(k); if (!c || p.price < c.price || (p.price === c.price && p.id < c.id)) bySlot.set(k, p); }
  for (const p of bySlot.values()) PCS[p.id] = true;
  return PCS;
}
export function pieceOnline(p) { const id = typeof p === 'string' ? p : p && p.id; return !!(id && pieceTable()[id]); }
/** make every piece's `shops` agree with the rule: 'online' in shops <=> orderable. Physical shops are never touched. */
export function applyClothes(list = CATALOG) {
  for (const p of list) { const on = pieceOnline(p), has = p.shops.includes('online'); if (on && !has) p.shops.push('online'); else if (!on && has) p.shops = p.shops.filter(s => s !== 'online'); }
  return list;
}
/** the first physical shop of a piece (the one that always has it in stock when it is in store only) */
export const anchorShop = p => (p && (p.shops.find(s => s !== 'online' && s !== 'market') || p.shops.find(s => s !== 'online'))) || null;   /* an indoor shop before the market stalls */

/* ---------- counts (report + check script) ---------- */
export function splitGoods() {
  const out = {}; for (const g of GOODS) { const r = out[g.cat] || (out[g.cat] = { goods: 0, store: 0, fams: new Set(), storeFams: new Set() }); r.goods++; r.fams.add(g.family); if (!goodOnline(g)) { r.store++; r.storeFams.add(g.family); } }
  for (const k in out) { out[k].fams = out[k].fams.size; out[k].storeFams = out[k].storeFams.size; } return out;
}
export function splitClothes() { const out = {}; for (const p of CATALOG) { const k = slotKey(p), r = out[k] || (out[k] = { n: 0, store: 0 }); r.n++; if (!pieceOnline(p)) r.store++; } return out; }
export const RULE_TEXT = 'Basics and the cheaper pieces of each category can be ordered; the nicer, bigger, brand, seasonal and festival pieces are only in the shops.';
export { PIECE_BY_ID };
// applied once when this module loads (idempotent): from here on `p.shops.includes('online')` is the single truth the Closet app, the online catalogue
// and the order button read. clothes_shop.js imports this module, so the game always sees the rule; node tools that import it see it too.
applyClothes();
