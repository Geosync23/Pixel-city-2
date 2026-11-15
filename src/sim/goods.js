// Home goods (Wave C): the big catalogue (data/goods.js) as real items, physical shopping in the home-goods stores, the shopping bag, lamps at home.
//
// At import time every GOODS row becomes a `homegood` item (ITEMS / ITEM_BY_ID, id 'g_<x>', soldAt = its store ids) with art in housing's VIS table, so
// the existing Decorate mode stores, places, rotates and sells it, and activities read its function from the art's tags (a sofa is sittable, a TV watchable...).
// Every store is a venue record (VENUES + VENUE_BY_ID, id 'goods:<key>', priceMult = store.mult) -> the counter's buy menu (ui/shop.js) lists its whole range.
// A curated slice is also sold over three existing counters: Nest & Wire ('homegoods'), and the Galleria's Fern & Frond ('mall:fern') + Nest & Wire Home ('mall:nest').
//
// PHYSICAL SHOPPING: display pieces in the store rooms carry the fixture tag `gdisp` (item fields gd = good id, gs = store id). Tap one -> the inspect sheet
// (src/sim/goods_sheet.js): big picture, the colourways this shop has, price, what it does, Buy / Try it. Small pieces (good.carry) go into the SHOPPING BAG and
// land in your home storage the next time you walk in; big ones are delivered the way the furniture flow always did (G.housing.addFurniture: tomorrow 09:00).
// LAMPS: placed goods with `lamp` switch on and off at home (fixture tag `glamp`); off lamps are remembered per placed piece.
//
// G.goods
//   stores() -> [store rows (data/goods.js STORES) + { open (bool), hoursText, x, y (door, when the city is built) }]      store(id)
//   stock(storeId) -> [good]     price(goodId, storeId) -> $     whereSold(goodId) -> [storeId]     isOpen(storeId) -> bool     hoursText(storeId)
//   inspect(goodId, storeId, fx?)  opens the sheet      buy(goodId, storeId, { quiet }) -> 'bag' | 'delivery' | null
//   bag() -> [goodId] (carried, lands at home)          unpackBag() -> n      lampOn(uid) -> bool     setLamp(uid, on)
// State G.state.goods = { bag: [goodId], off: { placedUid: 1 }, bought: n, spent: $, visits: { storeId: n } }
// Events: 'goods:buy'(goodId, storeId, price, 'bag'|'delivery'), 'goods:bag'(ids) when the bag is unpacked at home, 'goods:lamp'(uid, on), 'goods:visit'(storeId)
//   (+ the standard 'shop:buy'(goodId, 1, storeId) so purchase listeners see it)
import { G } from '../core/game.js';
import { GOODS, GOOD_BY_ID, STORES, STORE_BY_ID, goodsAt } from '../data/goods.js';
import { ITEMS, ITEM_BY_ID } from '../data/items.js';
import { VENUES, VENUE_BY_ID, isOpen } from '../data/venues.js';
import { VIS } from './housing.js';
import { registerFixture } from '../scenes/interior.js';
import { asset, assetSize } from '../art/registry.js';
import { toast } from '../ui/kit.js';
import { openSheet } from './goods_sheet.js';

export const order = 57.6;
export const BAG_MAX = 8;
const MULT = [1, 1.15, 1.3], FUNCTIONAL = ['sofa', 'bed', 'tv', 'music', 'game', 'computer', 'bookshelf', 'exercise', 'instrument', 'easel', 'bath', 'shower'];

/* ---------- registration (import time, before any init) ---------- */
const sizeOf = g => { try { const a = asset('furn.home.' + g.art); return assetSize(a, g.p); } catch (e) { return [1, 1, 1]; } };
for (const g of GOODS) {
  if (ITEM_BY_ID[g.id]) continue; const s = sizeOf(g);
  const it = { id: g.id, name: g.name, category: 'homegood', price: g.price, icon: g.name.toLowerCase(), effects: {}, stack: 1, soldAt: g.stores.slice(), tag: g.tag, tier: g.tier,
    footprint: [s[0], s[1]], placement: g.place, bonus: { mult: FUNCTIONAL.includes(g.tag) ? MULT[g.tier] || 1 : 1, ambience: g.ambience }, good: 1, cat: g.cat, style: g.style };
  ITEMS.push(it); ITEM_BY_ID[g.id] = it;
  VIS[g.id] = { a: g.art, p: g.p, mount: g.mount };
}
const DAYN = n => [0, 1, 2, 3, 4, 5, 6].map(() => n);
for (const s of STORES) {
  if (VENUE_BY_ID[s.id]) continue;
  const v = { id: s.id, name: s.name, type: 'shop', district: s.district || 'downtown', where: s.where || '', station: null, interior: true, hours: s.hours || DAYN([10, 19]),
    offers: { shop: ['homegood'], functions: ['showroom', 'till'] }, priceMult: s.mult || 1, jobId: null, delivers: true, blurb: s.blurb, goods: true, kindLabel: s.kind };
  VENUES.push(v); VENUE_BY_ID[s.id] = v;
}
/* the curated slice for three existing counters (deterministic: by category, cheapest first) */
const ALSO = [
  ['mall:fern', g => g.cat === 'plants' && g.price <= 160, 24],
  ['mall:nest', g => ['decor', 'wall', 'lighting', 'kitchen'].includes(g.cat) && g.carry && g.stores.includes('goods:bellwether'), 30],
  ['homegoods', g => (g.cat === 'electronics' || (g.cat === 'lighting' && g.place === 'floor')) && g.stores.some(s => s === 'goods:voltaic' || s === 'goods:lumen'), 30],
];
for (const [vid, pred, n] of ALSO) { if (!VENUE_BY_ID[vid]) continue; let k = 0; for (const g of GOODS.filter(pred).sort((a, b) => a.price - b.price)) { if (k >= n) break; const it = ITEM_BY_ID[g.id]; if (!it.soldAt.includes(vid)) { it.soldAt = it.soldAt.concat(vid); k++; } } }

/* ---------- state ---------- */
let S = null;
const blank = () => ({ bag: [], off: {}, bought: 0, spent: 0, visits: {} });
function norm() { S = G.state.goods; if (!S || typeof S !== 'object') S = G.state.goods = blank(); const b = blank(); for (const k in b) if (S[k] === undefined) S[k] = b[k]; S.bag = S.bag.filter(id => GOOD_BY_ID[id]); return S; }
const safe = (fn, fb) => { try { const v = fn(); return v === undefined || v === null ? fb : v; } catch (e) { return fb; } };
const fmt = n => (G.money && G.money.fmt ? G.money.fmt(n) : '$' + n);

/* ---------- stores, prices ---------- */
const clock = h => String(Math.floor(h) % 24).padStart(2, '0') + ':' + String(Math.round((h % 1) * 60)).padStart(2, '0');
function storeOpen(id) { const v = VENUE_BY_ID[id]; if (!v) return false; const n = G.now(); return isOpen(v, n.weekday, n.hf); }
function hoursText(id) { const v = VENUE_BY_ID[id], h = v && v.hours && v.hours[G.now().weekday]; return h ? `Open ${clock(h[0])}–${clock(h[1])}` : 'Closed today'; }
function price(goodId, storeId) {
  const it = ITEM_BY_ID[goodId]; if (!it) return 0;
  if (G.shop && G.shop.price && VENUE_BY_ID[storeId]) return safe(() => G.shop.price(it, storeId), it.price);
  return Math.round(it.price * ((STORE_BY_ID[storeId] || {}).mult || 1));
}
const whereSold = id => (GOOD_BY_ID[id] ? GOOD_BY_ID[id].stores.slice() : []);
let sitePos = () => null;
export const setSiteLookup = fn => { sitePos = fn; };
const stores = () => STORES.map(s => Object.assign({}, s, { open: storeOpen(s.id), hoursText: hoursText(s.id), count: goodsAt(s.id).length }, sitePos(s.id) || {}));

/* ---------- buying ---------- */
function buy(goodId, storeId, o = {}) {
  const g = GOOD_BY_ID[goodId], it = ITEM_BY_ID[goodId]; if (!g || !it) return null;
  const p = price(goodId, storeId), carry = !!g.carry;
  if (carry && S.bag.length >= BAG_MAX) { if (!o.quiet) toast('Your shopping bag is full. Take it home first, or have this one delivered at the counter.', 'bad', 3600); return null; }
  if (!G.money || !G.money.pay(p, g.name, { category: 'homegood', venue: storeId })) return null;
  let how;
  if (carry) { S.bag.push(goodId); how = 'bag'; if (!o.quiet) toast(`${g.name} is in your shopping bag. It goes into storage when you get home.`, 'good', 3600); }
  else { if (G.housing && G.housing.addFurniture) G.housing.addFurniture(goodId, { quiet: true }); else (G.state.owned.furniture || (G.state.owned.furniture = [])).push({ id: goodId, day: G.now().day, t: Math.floor(G.state.t) }); how = 'delivery';
    if (!o.quiet) { const h = safe(() => G.housing.current(), null), fast = h && h.home && h.home.perk && h.home.perk.effect && h.home.perk.effect.freeSameDayDelivery; toast(`${g.name}: ${!h ? 'it waits in storage until you have a home.' : fast ? 'delivered to your building in a few hours.' : 'delivered to your home tomorrow at 09:00.'}`, 'good', 3800); } }
  S.bought++; S.spent += p;
  G.emit('goods:buy', goodId, storeId, p, how); G.emit('shop:buy', goodId, 1, storeId); safe(() => G.audio.sfx('buy'));
  return how;
}
function unpackBag() {
  if (!S.bag.length || !G.housing) return 0; const ids = S.bag.splice(0);
  for (const id of ids) G.housing.addFurniture(id, { instant: true, quiet: true });
  toast(`You unpack your shopping bag: ${ids.map(id => GOOD_BY_ID[id].name).join(', ')}. Tap Decorate to place ${ids.length > 1 ? 'them' : 'it'}.`, 'good', 5200);
  G.emit('goods:bag', ids); return ids.length;
}

/* ---------- lamps at home ---------- */
function applyLamp(fx, scene, on) {
  const ob = fx.ob, W = scene.world; if (!ob) return;
  ob.p = Object.assign({}, ob.p, { on: !!on }); delete ob._key;
  if (!on) { const L = W.lights.filter(l => l.ob === ob); if (L.length) { ob._gl = L; W.lights = W.lights.filter(l => l.ob !== ob); } }
  else if (ob._gl) { for (const l of ob._gl) if (!W.lights.includes(l)) W.lights.push(l); ob._gl = null; }
}
const lampOn = uid => !S.off[uid];
function setLamp(uid, on) { if (on) delete S.off[uid]; else S.off[uid] = 1; const sc = G.scene; if (sc && sc.fixtures) for (const fx of sc.fixtures) if (fx.item && fx.item.uid === uid) applyLamp(fx, sc, on); G.emit('goods:lamp', uid, !!on); }

export function init() {
  G.defineState('goods', blank); norm();
  G.goods = {
    stores, store: id => stores().find(s => s.id === id) || null, stock: id => goodsAt(id), price, whereSold, isOpen: storeOpen, hoursText,
    inspect: (goodId, storeId, fx) => openSheet(goodId, storeId, fx), buy, bag: () => S.bag.slice(), unpackBag, lampOn, setLamp, BAG_MAX,
  };
  G.on('load', norm);
  /* display pieces in the stores: tap -> inspect sheet */
  registerFixture('gdisp', (fx, scene) => {
    const it = fx.item, g = it && GOOD_BY_ID[it.gd]; if (!g) return null; const sid = it.gs || (scene.def && scene.def.venue);
    return { label: `${g.name} · ${fmt(price(g.id, sid))}`, gdisp: true, range: 1.6, use: () => openSheet(g.id, sid, fx) };
  });
  /* lamps you own: switch on / off */
  registerFixture('glamp', (fx, scene) => {
    const uid = fx.item && fx.item.uid; if (!uid || !(G.housing && G.housing.isHome(scene.id))) return null;
    const ia = { label: lampOn(uid) ? 'Switch off' : 'Switch on', range: 1.6, use: () => { const on = !lampOn(uid); setLamp(uid, on); ia.label = on ? 'Switch off' : 'Switch on'; safe(() => G.audio.sfx('click')); toast(on ? 'Click. Warm light.' : 'Click. Off.', 'info', 1200); } };
    return ia;
  });
  G.on('room:build', sc => {
    if (!sc || !sc.fixtures) return;
    if (G.housing && G.housing.isHome(sc.id)) { for (const fx of sc.fixtures) if (fx.item && fx.item.uid && S.off[fx.item.uid] && fx.tags.includes('glamp')) applyLamp(fx, sc, false); }
  });
  G.on('scene', s => {
    if (!s) return;
    if (s.def && s.def.goodsStore) {
      /* one tap target per display piece: drop the generic activity / seat targets that sit on the same pieces */
      for (let i = s.interactables.length - 1; i >= 0; i--) { const it = s.interactables[i]; if (it.fx && it.fx.item && it.fx.item.gd && !it.gdisp) s.interactables.splice(i, 1); }
      const sid = s.def.venue; S.visits[sid] = (S.visits[sid] || 0) + 1; G.emit('goods:visit', sid);
    }
    if (S.bag.length && G.housing && G.housing.isHome(s.id)) setTimeout(unpackBag, 700);
  });
}
