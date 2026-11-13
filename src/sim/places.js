// Places: the registry of named destinations (map app, taxi, appointments). Built from the city's world pois + data/venues.js.
//
// G.places
//   list(kind?) -> [place]     kind: 'venue' | 'home' | 'station' | 'busstop' | 'taxistand' | 'landmark' | 'spot' | 'stall' | 'airport'
//   get(id) -> { id, name, kind, x, y, district, poi (the world poi), venue? (data/venues entry), roomId?, type? (venue type), open() -> bool }
//       ids: room id for doors ('cafe', 'home:juniper_court'), station id ('st_central'), otherwise the poi id (or '<type>:<n>' when it has none)
//   known(id) -> bool          discover(id) -> true when newly discovered (toast + event)       knownList(kind?)
//   nearest(x, y, kind?, knownOnly?) -> place | null         rebuild()
//   Discovery: your home, the airport and all stations are known from the start; anything else when you walk within 9 units or go inside.
// State: G.state.places = { known: { id: 1 } }.   Events: 'place:discover'(id), 'places:built'
import { G } from '../core/game.js';
import { VENUE_BY_ID, STATIONS, POIS, DISTRICTS, isOpen } from '../data/venues.js';
import { HOME_BY_ID } from '../data/homes.js';
import { toast } from '../ui/kit.js';

export const order = 58;
let S = null, list = [], byId = new Map(), acc = 0;
const DNAME = Object.fromEntries(DISTRICTS.map(d => [d.id, d.name]));
const mk = (id, name, kind, p, extra) => Object.assign({ id, name, kind, x: p.x, y: p.y, district: p.district || (extra && extra.venue && extra.venue.district) || null, poi: p, open: () => true }, extra);

function rebuild() {
  list = []; byId = new Map(); const c = G.sceneCache.get('city'); if (!c || !c.world || !Array.isArray(c.world.pois)) return;
  const counts = {}, add = pl => { if (!pl.id || byId.has(pl.id)) return; byId.set(pl.id, pl); list.push(pl); };
  for (const p of c.world.pois) {
    if (!p || !isFinite(p.x) || !isFinite(p.y)) continue; const id = String(p.id || ''), type = p.type || id.split(':')[0];
    const auto = () => id || `${type}:${counts[type] = (counts[type] || 0) + 1}`;
    if (type === 'door' || id.startsWith('door:')) {
      const rid = p.room || id.replace(/^door:/, ''), v = VENUE_BY_ID[rid];
      if (v) add(mk(rid, v.name, 'venue', p, { venue: v, roomId: rid, type: v.type, district: p.district || v.district, open: () => { const n = G.now(); return isOpen(v, n.weekday, n.hf); } }));
      else if (rid.startsWith('home')) { const h = HOME_BY_ID[rid.split(':')[1]]; add(mk(rid, p.name || (h && h.name) || 'Home', 'home', p, { roomId: rid, home: h, district: p.district || (h && h.district) })); }
      else add(mk(rid, p.name || rid, 'venue', p, { roomId: rid }));
    } else if (type === 'station') { const sid = id.replace(/^station:/, ''), st = STATIONS.find(s => s.id === sid || s.id === 'st_' + sid); add(mk(st ? st.id : sid, p.name || (st ? st.name + ' Station' : 'Station'), 'station', p, { district: p.district || (st && st.district) })); }
    else if (type === 'busstop' || type === 'taxistand') add(mk(auto(), p.name || (type === 'busstop' ? 'Bus stop' : 'Taxi stand'), type, p));
    else if (type === 'spawn') { if (id === 'spawn:airport') add(mk('airport', 'Maple Bay International', 'airport', p, { venue: VENUE_BY_ID.airport, district: 'airport' })); }
    else if (type === 'landmark') add(mk(auto(), p.name || 'Landmark', 'landmark', p));
    else if (type === 'stall' || VENUE_BY_ID[p.venue || id.replace(/^(stall|venue):/, '')]) { const v = VENUE_BY_ID[p.venue || id.replace(/^(stall|venue):/, '')]; if (v) add(mk(v.id, v.name, 'stall', p, { venue: v, type: v.type, district: p.district || v.district, open: () => { const n = G.now(); return isOpen(v, n.weekday, n.hf); } })); }
    else if (type === 'spot') { const d = POIS.find(q => q.id === id); if (d || p.name) add(mk(auto(), (d && d.name) || p.name, 'spot', p, { district: p.district || (d && d.district), functions: d && d.functions })); }
  }
  for (const pl of list) pl.districtName = DNAME[pl.district] || '';
  const hid = G.state.home && G.state.home.id; if (hid) for (const k of ['home:' + hid, 'home']) if (byId.has(k)) S.known[k] = 1;
  for (const pl of list) if (pl.kind === 'station' || pl.kind === 'airport') S.known[pl.id] = 1;
  G.emit('places:built');
}
const api = {
  list: kind => (kind ? list.filter(p => p.kind === kind) : list.slice()),
  get: id => byId.get(id) || byId.get(String(id).replace(/^door:/, '')) || null,
  known: id => !!S.known[id],
  knownList: kind => list.filter(p => S.known[p.id] && (!kind || p.kind === kind)),
  discover(id, quiet) { const p = api.get(id); if (!p || S.known[p.id]) return false; S.known[p.id] = 1; if (!quiet && p.kind !== 'busstop' && p.kind !== 'taxistand') toast(`Discovered: ${p.name}`, 'good'); G.emit('place:discover', p.id); return true; },
  nearest(x, y, kind, knownOnly) { let b = null, bd = 1e9; for (const p of list) { if ((kind && p.kind !== kind) || (knownOnly && !S.known[p.id])) continue; const d = Math.hypot(p.x - x, p.y - y); if (d < bd) { bd = d; b = p; } } return b; },
  rebuild,
};
export function init() {
  S = G.defineState('places', () => ({ known: {} }));
  G.on('load', () => { S = G.state.places || (G.state.places = { known: {} }); if (list.length) rebuild(); });
  G.places = api;
  G.on('scene', s => { if (s.id === 'city' && (!list.length || list._w !== s.world)) { rebuild(); list._w = s.world; } else if (s.roomId) api.discover(s.roomId, true); });
  G.on('game:start', () => { if (G.sceneCache.get('city')) rebuild(); });
  G.addSystem({ name: 'places', update(dt) { acc += dt; if (acc < .7 || !G.scene || G.scene.id !== 'city' || G.cutscene) return; acc = 0; const p = G.player; for (const pl of list) if (!S.known[pl.id] && Math.abs(pl.x - p.x) < 9 && Math.abs(pl.y - p.y) < 9) api.discover(pl.id); } });
}
