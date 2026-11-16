// In-store-only goods and clothes (owner msgs 167-168, BIBLE "Direction update 35"): the rule lives in src/data/instore.js; this is the runtime side.
// G.instore
//   online(id) -> bool        can this home good / legacy home item / clothing piece be ordered from the phone? (anything else -> true)
//   where(id, n = 3) -> [{ shop, venue, place, name, district, districtName, d, dist, open, opens, opensT, inStock, season }]  the shops that sell it, nearest first
//                       (clothes: shops that have it on the rails this week first; `season` set when it is only stocked in another season)
//   whereText(id) -> 'Only available in store: Lumen Lighting (Old Town), ...'
//   take(placeId, name?) -> bool   the existing route guidance (G.phone.routeTo: the Map's "How will you get there?" card), else a waypoint + close the phone
//   plan(row) -> apptId | null     "Add to My Day": a shopping stop at the store's next opening time
//   refuse(id) -> true when it is in store only (and says so with a toast): the guard every online order path calls
//   RULE_TEXT
// No state. Items already owned, carts / parcels from older saves, gifts and rewards never pass through these checks.
import { G } from '../core/game.js';
import { GOOD_BY_ID, STORE_BY_ID } from '../data/goods.js';
import { PIECE_BY_ID, SHOPS, CATALOG } from '../data/clothes.js';
import { ITEM_BY_ID } from '../data/items.js';
import { VENUE_BY_ID, isOpen } from '../data/venues.js';
import { itemOnline, pieceOnline, anchorShop, RULE_TEXT } from '../data/instore.js';
import { toast } from '../ui/kit.js';

export const order = 61.5;
const safe = (fn, fb) => { try { const v = fn(); return v === undefined || v === null ? fb : v; } catch (e) { return fb; } };
const DIST = { oldtown: 'Old Town', harbor: 'Harborside', harborside: 'Harborside', arts: 'Arts Quarter', maplewood: 'Maplewood', downtown: 'Downtown', hillcrest: 'Hillcrest', railyard: 'Railyard', park: 'Central Park', university: 'University' };
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], SEASON = ['spring', 'summer', 'autumn', 'winter'];
const hhmm = h => String(Math.floor(h)).padStart(2, '0') + ':' + String(Math.round((h % 1) * 60)).padStart(2, '0');

export function online(id) { if (PIECE_BY_ID[id]) return pieceOnline(id); return itemOnline(id); }
const pos = () => safe(() => { if (G.scene && G.scene.id === 'city' && G.player) return { x: G.player.x, y: G.player.y }; const room = String((G.scene && G.scene.id) || '').replace(/^int:/, ''); const p = G.places.get(room); if (p) return { x: p.x, y: p.y };
  return (G.state.phone && G.state.phone.cityPos) || { x: G.state.player.x || 0, y: G.state.player.y || 0 }; }, { x: 0, y: 0 });
/** is the venue open now, and if not, when does it open next */
function hours(venueId) {
  const v = VENUE_BY_ID[venueId]; if (!v || !v.hours) return { open: true, opens: '', opensT: null };
  const n = G.now(), now = isOpen(v, n.weekday, n.hf); if (now) return { open: true, opens: '', opensT: null };
  for (let k = 0; k < 8; k++) { const wd = (n.weekday + k) % 7, h = v.hours[wd]; if (!h || (k === 0 && n.hf >= h[0])) continue;
    const t = (n.day + k) * 1440 + Math.round(h[0] * 60); return { open: false, opensT: t, opens: 'Opens ' + (k === 0 ? 'today' : k === 1 ? 'tomorrow' : DAYS[wd]) + ' at ' + hhmm(h[0]) }; }
  return { open: false, opens: 'Closed this week', opensT: null };
}
function rowFor(shop, venue, placeId, name, extra) {
  const p = safe(() => G.places.get(placeId), null); if (!p) return null; const c = pos(), d = Math.abs(p.x - c.x) + Math.abs(p.y - c.y), h = hours(venue);
  return Object.assign({ shop, venue, place: placeId, name, district: p.district || '', districtName: DIST[p.district] || '', d, dist: safe(() => G.nav.fmtDist(d), Math.round(d * 17) + ' m'), inStock: true, season: null }, h, extra || null);
}
/** the shops that sell it, nearest first (clothes: the ones with it on the rails this week first) */
export function where(id, n = 3) {
  const out = [], seen = new Set(), add = r => { if (r && !seen.has(r.place + '|' + r.name)) { seen.add(r.place + '|' + r.name); out.push(r); } };
  const piece = PIECE_BY_ID[id];
  if (piece) {
    const C = G.clothesShop, season = safe(() => G.now().season, 0), inSeason = piece.season === null || piece.season === undefined || piece.season === season || (Array.isArray(piece.season) && piece.season.includes(season));
    const now = new Set(safe(() => C.whereSold(id), [])), anchor = anchorShop(piece);
    for (const s of piece.shops) { if (s === 'online' || !SHOPS[s]) continue; const place = safe(() => C.placeOf(s), null); if (!place) continue;
      const venue = (C && C.VENUE && C.VENUE[s]) || place, nm = safe(() => C.shopName(s), SHOPS[s].name), inside = place !== venue ? safe(() => G.places.get(place).name, '') : '';   /* a bay in the Galleria, the arena's team store, the hotel boutique */
      add(rowFor(s, venue, place, inside && inside !== nm ? `${nm}, ${inside}` : nm, { inStock: inSeason && (now.has(s) || s === anchor), season: inSeason ? null : [].concat(piece.season).map(k => SEASON[k]).join(' / ') })); }
    out.sort((a, b) => (b.inStock - a.inStock) || a.d - b.d);
  } else {
    const it = ITEM_BY_ID[id], g = GOOD_BY_ID[id], ids = [...new Set([...(g ? g.stores : []), ...((it && it.soldAt) || [])])];
    for (const s of ids) { const v = VENUE_BY_ID[s], st = STORE_BY_ID[s]; add(rowFor(s, s, s, (st && st.name) || (v && v.name) || safe(() => G.places.get(s).name, s))); }
    out.sort((a, b) => a.d - b.d);
  }
  return out.slice(0, n);
}
export function whereText(id, n = 3) { const w = where(id, n); return w.length ? 'Only available in store: ' + w.map(r => r.name + (r.districtName ? ` (${r.districtName})` : '')).join(', ') : 'Only available in store.'; }
export function take(placeId, name) {
  const p = safe(() => G.places.get(placeId), null); if (!p) { toast('Not on your map yet.', 'info'); return false; }
  if (G.phone && G.phone.routeTo && safe(() => G.phone.routeTo(placeId), false)) return true;   /* the Map's route card: on foot / bus / train / cab, like every other "Take me there" */
  safe(() => G.phone.setWaypoint(placeId)); safe(() => G.phone.close()); toast(`Waypoint set: ${name || p.name}. Follow the arrow.`, 'good', 3200); return true;
}
export function plan(r) {
  if (!r || !G.planner) return null; const t = r.opensT || Math.floor(G.state.t) + 60;
  const had = safe(() => G.planner.list(t - 1, t + 1).find(a => a && a.placeId === r.place && a.t === t && (a.s || 0) < 2), null);   /* QA16: a second tap added the same stop twice */
  if (had) { toast(`Already on My Day: ${r.name}, ${r.opens ? r.opens.replace(/^Opens /, '') : 'in an hour'}.`, 'info', 2600); return had.id; }
  const id = safe(() => G.planner.add({ title: `Shopping: ${r.name}`, placeId: r.place, t, dur: 45, kind: 'personal' }), null);
  if (id) toast(`Added to My Day: ${r.name}, ${r.opens ? r.opens.replace(/^Opens /, '') : 'in an hour'}.`, 'good', 3200); return id;
}
export function refuse(id) {
  if (online(id)) return false; const nm = (PIECE_BY_ID[id] || GOOD_BY_ID[id] || ITEM_BY_ID[id] || { name: 'That' }).name;
  toast(`${nm}: only in store. ${whereText(id, 2).replace(/^Only available in store: /, 'Find it at ')}.`, 'info', 4200); return true;
}
export function init() { G.instore = { online, where, whereText, take, plan, refuse, hours, venue: id => VENUE_BY_ID[id] || null, pieces: () => CATALOG, RULE_TEXT }; }
