// Wish-list reminder (owner msg 175: "a wish-list reminder when walking past the shop"). Background: src/sim/instore.js (in-store-only pieces, G.instore).
//
// When the player WALKS in the city within NEAR units of the door of an OPEN shop that stocks an in-store-only piece on their Roomy wish list (G.orders.wish)
// or their Closet wish list (G.wardrobe.wishes), one phone banner drops in: "On your wish list" / "Linen Armchair is sold here at Marigold & Main."
// (several pieces there: "Linen Armchair +2 more: sold here at ..."). Tapping the banner walks the player to that shop's door and in (G.useInteractable on the
// city door, the same as tapping the door; no door found -> G.instore.take: the Map's "How will you get there?" card). The banner's entry in the phone's
// notification history opens Roomy on the piece / the Closet wish list.
//
// Rules: once per piece per game day; at most one reminder per shop visit (a visit ends when you are LEAVE units away; walking out of the shop's own door counts
// as a visit already); silent while the shop is closed (that visit stays silent); never during a Chapter, a relationship scene / date, a job shift or job story
// beat, the intro, a ride or a cab on its way (G.transit), a cutscene, an activity (G.busy), design mode, an open phone / window / mini-game, or while another
// phone banner is showing; never for a piece you own or that left the wish list.
// Cost: the shop -> wished pieces index is rebuilt only when the wish lists / stock week / season change (signature checked at most once per game minute, plus
// 'order:wish' / 'goods:buy' / 'wardrobe:add' / 'shop:buy'); the walk check runs twice a real second over the few indexed shops (no scan over the catalogue).
//
// G.wishNudge
//   index() -> [{ place, venue, shop, kind, x, y, ids: [pieceId] }]   the current shop -> wished in-store pieces index (rebuilt if stale)
//   check() -> null | { place, ids, text }   run the walk check now (what the system does every 0.5 s); returns the reminder it showed
//   go(placeId) -> bool    the banner's tap action: walk to that shop's door and in
//   state() -> G.state.wishnudge         NEAR, LEAVE
//   debug: { reset() }   forget today's reminders and the current visits
// State G.state.wishnudge = { d: game day of `s`, s: [pieceId reminded today] }   (missing in older saves: created on first use; pruned to wished pieces)
// Events: 'wish:nudge'(placeId, [pieceId])
import { G } from '../core/game.js';
import { GOOD_BY_ID, STORE_BY_ID } from '../data/goods.js';
import { PIECE_BY_ID, SHOPS } from '../data/clothes.js';
import { VENUE_BY_ID } from '../data/venues.js';
import { anchorShop } from '../data/instore.js';

export const order = 136;
export const NEAR = 4.5, LEAVE = 6.5;
const safe = (fn, fb) => { try { const v = fn(); return v === undefined || v === null ? fb : v; } catch (e) { return fb; } };
let IX = [], sig = '', dirty = true, lastMin = -1, acc = 0, prevScene = '';
const visit = new Set();   /* places handled during the current visit (shown, closed, or just walked out of) */

function st() {
  let s = G.state.wishnudge; if (!s || typeof s !== 'object') s = G.state.wishnudge = { d: -1, s: [] };
  if (!Array.isArray(s.s)) s.s = []; const day = Math.floor((G.state.t || 0) / 1440); if (s.d !== day) { s.d = day; s.s = []; }
  return s;
}
const goodsWish = () => safe(() => G.orders.wish(), []);
const clothesWish = () => safe(() => G.wardrobe.wishes(), []);
const inSeason = (p, season) => p.season === null || p.season === undefined || p.season === season || (Array.isArray(p.season) && p.season.includes(season));
/* owned anywhere: placed, in storage, in a box, on its way, in the shopping bag, in a parcel */
function ownsGood(id) {
  const h = G.state.home || {}, has = a => Array.isArray(a) && a.includes(id);
  if ((h.items || []).some(i => i && i.itemId === id) || has(h.storage) || has(h.stay) || (h.boxes || []).some(b => b && has(b.items)) || (h.pending || []).some(p => p && p.id === id)) return true;
  if (has(safe(() => G.state.goods.bag, null))) return true;
  return (safe(() => G.state.orders.ships, []) || []).some(s => s && s.st === 'transit' && (s.lines || []).some(l => l && l.id === id));
}
const owns = id => PIECE_BY_ID[id] ? !!safe(() => G.wardrobe.owns(id), false) : ownsGood(id);
const nameOf = id => (PIECE_BY_ID[id] || GOOD_BY_ID[id] || { name: 'A piece' }).name;

function rebuild() {
  dirty = false; const by = new Map(), wishG = goodsWish(), wishC = clothesWish(), now = safe(() => G.now(), { season: 0 });
  const put = (place, venue, shop, kind, id) => { const p = safe(() => G.places.get(place), null); if (!p || !isFinite(p.x)) return; let e = by.get(place);
    if (!e) by.set(place, e = { place, venue, shop, kind, x: p.x, y: p.y, ids: [] }); if (!e.ids.includes(id)) e.ids.push(id); };
  for (const id of wishG) { if (!GOOD_BY_ID[id] || safe(() => G.instore.online(id), true) || ownsGood(id)) continue;
    for (const r of safe(() => G.instore.where(id, 99), [])) put(r.place, r.venue, r.shop, 'good', id); }
  const C = G.clothesShop;
  for (const id of wishC) { const p = PIECE_BY_ID[id]; if (!p || !C || safe(() => G.instore.online(id), true) || owns(id) || !inSeason(p, now.season)) continue;
    const at = new Set(safe(() => C.whereSold(id), [])), anchor = anchorShop(p); if (anchor) at.add(anchor);
    for (const s of at) { if (s === 'online' || !SHOPS[s]) continue; const place = safe(() => C.placeOf(s), null); if (place) put(place, (C.VENUE && C.VENUE[s]) || place, s, 'piece', id); } }
  IX = [...by.values()];
  const wished = new Set(wishG.concat(wishC)), s = st(); s.s = s.s.filter(id => wished.has(id));   /* drop the state for pieces no longer wished */
}
function index() {
  const n = safe(() => G.now(), null); const m = Math.floor(G.state.t || 0);
  if (m !== lastMin) { lastMin = m; const k = goodsWish().join(',') + '|' + clothesWish().join(',') + '|' + Math.floor(m / 10080) + '|' + (n ? n.season : 0); if (k !== sig) { sig = k; dirty = true; } }
  if (dirty) safe(() => rebuild());
  return IX;
}
/* is a reminder allowed right now? (walking in the city, nothing else on) */
function quiet() {
  if (!G.scene || G.scene.id !== 'city' || !G.player || G.onTitle) return false;
  if (G.modal > 0 || G.busy || G.cutscene) return false;
  if (safe(() => G.intro.active, false) || safe(() => G.chapters.active(), false) || safe(() => G.chapters.moments.playing(), false)) return false;
  if (safe(() => G.rel.active(), false) || safe(() => G.jobs.onShift(), false) || safe(() => G.jobStory.active(), false)) return false;
  if (safe(() => G.transit.ride, null) || safe(() => G.transit.pending, null) || safe(() => G.minigame.isOpen(), false) || safe(() => G.phone.isOpen, false) || safe(() => G.furnish.active, false)) return false;
  if (typeof document !== 'undefined' && document.querySelector('#ph-banners > *')) return false;
  return true;
}
const shopName = e => e.kind === 'piece' ? safe(() => G.clothesShop.shopName(e.shop), (SHOPS[e.shop] || {}).name || 'this shop') + (e.place !== e.venue ? safe(() => ', ' + G.places.get(e.place).name, '') : '')   /* a Galleria bay, the arena's team store, the hotel boutique: as G.instore.where names them */
  : ((STORE_BY_ID[e.shop] || {}).name || (VENUE_BY_ID[e.venue] || {}).name || safe(() => G.places.get(e.place).name, 'this shop'));
export function text(name, more, shop) { return more > 0 ? `${name} +${more} more: sold here at ${shop}.` : `${name} is sold here at ${shop}.`; }

function check() {
  const ix = index(); if (!ix.length || !G.scene || G.scene.id !== 'city' || !G.player) return null;
  const px = G.player.x, py = G.player.y;
  for (const e of ix) if (visit.has(e.place) && Math.hypot(e.x - px, e.y - py) > LEAVE) visit.delete(e.place);
  if (!quiet()) return null;
  const s = st();
  for (const e of ix) {
    if (visit.has(e.place) || Math.abs(e.x - px) > NEAR || Math.abs(e.y - py) > NEAR || Math.hypot(e.x - px, e.y - py) > NEAR) continue;
    const wp = safe(() => G.phone.waypoint(), null); if (wp && (wp === e.place || wp.id === e.place || wp.room === e.place)) { visit.add(e.place); continue; }   /* already on the way there */
    if (!safe(() => G.instore.hours(e.venue).open, true)) { visit.add(e.place); continue; }   /* closed: silent for this visit */
    const ids = e.ids.filter(id => !s.s.includes(id) && !owns(id) && (PIECE_BY_ID[id] ? clothesWish() : goodsWish()).includes(id));
    if (!ids.length) continue;
    visit.add(e.place); for (const id of ids) s.s.push(id);
    const first = ids[0], shop = shopName(e), msg = text(nameOf(first), ids.length - 1, shop), place = e.place;
    const piece = !!PIECE_BY_ID[first];
    safe(() => G.phone.notify({ app: piece ? 'closet' : 'roomy', title: 'On your wish list', text: msg, priority: 'normal', data: piece ? { tab: 'wish' } : { good: first }, onTap: () => go(place) }));
    G.emit('wish:nudge', place, ids);
    return { place, ids, text: msg };
  }
  return null;
}
/** the banner's tap: walk to the shop's city door and in (as if the door was tapped); else the Map's route card */
export function go(placeId) {
  const p = safe(() => G.places.get(placeId), null); if (!p) return false;
  if (G.scene && G.scene.id === 'city' && !G.modal && !G.busy && !G.cutscene) {
    const door = safe(() => G.scene.interactables.find(i => i && i.poi && (i.poi === p.poi || (i.poi.room && i.poi.room === placeId))), null)
      || safe(() => G.interactables().find(i => i && i.poi && i.poi.type === 'door' && Math.hypot(i.x - p.x, i.y - p.y) < .6), null);
    if (door) { G.useInteractable(door); return true; }
  }
  return !!safe(() => G.instore.take(placeId, p.name), false);
}

export function init() {
  const mark = () => { dirty = true; };
  for (const ev of ['order:wish', 'goods:buy', 'wardrobe:add', 'shop:buy', 'load']) G.on(ev, mark);
  G.on('load', () => { visit.clear(); });
  G.wishNudge = { index, check, go, text, state: st, NEAR, LEAVE, debug: { reset() { st().s = []; visit.clear(); dirty = true; } } };
  G.addSystem({ name: 'wishnudge', update(dt) {
    const sid = G.scene ? G.scene.id : ''; if (sid !== prevScene) { if (sid === 'city' && prevScene.startsWith('int:')) visit.add(prevScene.slice(4)); prevScene = sid; }   /* walked out of the shop's own door: that visit is done */
    acc += dt; if (acc < .5) return; acc = 0; if (sid !== 'city') return; safe(() => check());
  } });
}
