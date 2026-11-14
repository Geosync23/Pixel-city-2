// Lobbies: gives apartment buildings and office buildings an enterable ground-floor lobby (and nothing more: upstairs is residents / staff only).
// Runs after public_places (55) + showpieces (56) and before places (58) so the door pois flow into G.places, addresses, the phone map, the Wander guide and the welcome glow.
// Converts in place: a door poi `door:lobby:<n>` (room `lobby:<n>`) at a street-connected doorstep of every apartment block / office building that has no door yet.
// Nothing is moved, removed or saved (ids are stable: n = index of the building among all lobby-class buildings in city scan order).
// Building classes (regex on the object id, see CLASS): downtown towers + office blocks, MBTV, harbor master, foundry, BayJet hangar, Town Hall, Shed 5 (offices);
//   old town row houses with 3+ floors, Sunny Court, townhouse courts, harbor sail/net lofts (residential). Single-family houses, duplexes and 2-floor rows are left alone.
// Hours: residential lobbies 24h; office lobbies 07:00 - 20:00 (toast when closed).
//
// G.lobbies
//   list() -> [{ id 'lobby:<n>', n, kind 'res'|'office', style, name, key (class), x, y, district, poi, ob, hours ([open, close] | null), spec, address (getter) }]
//   get(id | n | 'door:lobby:<n>')   nearest(kind | null, x, y) -> lobby | null   isOpen(id) -> bool   byDistrict()
//   census() -> { total, res, office, district: {..}, style: {..}, skipped: [..] }
// Events (from rooms/lobbies.js): 'lobby:notices'(id), 'lobby:directory'(id), 'lobby:coffee'(id, drink)
import { G } from '../core/game.js';
import { toast } from '../ui/kit.js';
import { ROOMS, enterRoom, defineRoom } from '../scenes/interior.js';
import { lobbyRoom } from '../scenes/rooms/lobbies.js';
import { specFor } from '../scenes/rooms/lobbies2.js';
import { registerInfo } from '../scenes/rooms/unique_rooms.js';
import { getCity } from '../world/_city.js';

export const order = 57;
const PL = [], BY = new Map(); let built = null, skipped = [];
const CLASS = [
  [/downtown\.tower\.twin/, 'twin'], [/downtown\.tower\.twotone/, 'twotone'], [/downtown\.tower\.round/, 'round'], [/downtown\.office\.brutalist/, 'brutalist'], [/downtown\.tower\.setback/, 'setback'],
  [/downtown\.tower\.banded/, 'banded'], [/downtown\.office\.mirror/, 'mirror'], [/civic\.radiotower/, 'mbtv'], [/harbor\.master/, 'hmaster'], [/ind\.factory/, 'foundry'], [/airport\.hangar\.box/, 'bayjet'], [/downtown\.cityhall/, 'townhall'],
];
function classOf(ob) {
  const id = ob.id, p = ob.p || {}, sign = String(p.name || '').toUpperCase();
  for (const [re, k] of CLASS) if (re.test(id)) return k;
  if (/ind\.warehouse\.arched/.test(id)) return sign === 'SHED 5' ? 'shed5' : null;
  if (/harbor\.warehouse\.timber/.test(id)) return /LOFT/.test(sign) ? 'hloft' : null;
  if (/res\.townhouses/.test(id)) return 'court';
  if (/oldtown\.apartment\.garden/.test(id)) return 'garden';
  const m = /oldtown\.rowhouse\.(gable|brick|stucco|bay|timber|mansard)/.exec(id); if (m) return (p.floors || 2) >= 3 ? 'row.' + m[1] : null;
  return null;
}
function flood(w, sx, sy) {
  const nw = w.nw, nh = w.nh, nav = w.nav, seen = new Uint8Array(nw * nh), q = new Int32Array(nw * nh); let h = 0, t = 0; const s = Math.floor(sy * 2) * nw + Math.floor(sx * 2); seen[s] = 1; q[t++] = s;
  while (h < t) { const c = q[h++], x = c % nw, y = (c - x) / nw; if (x > 0 && !seen[c - 1] && nav[c - 1] !== 1) { seen[c - 1] = 1; q[t++] = c - 1; } if (x < nw - 1 && !seen[c + 1] && nav[c + 1] !== 1) { seen[c + 1] = 1; q[t++] = c + 1; } if (y > 0 && !seen[c - nw] && nav[c - nw] !== 1) { seen[c - nw] = 1; q[t++] = c - nw; } if (y < nh - 1 && !seen[c + nw] && nav[c + nw] !== 1) { seen[c + nw] = 1; q[t++] = c + nw; } }
  return (x, y) => x > .25 && y > .25 && x < w.w - .25 && y < w.h - .25 && seen[Math.floor(y * 2) * nw + Math.floor(x * 2)] === 1;
}
// the walkable, street-connected spot in front of the building's door (asset `door` {side, at}, flip-aware), else of a facade midpoint
function doorSpot(ob, ok, free) {
  const a = ob.a, B = ob.B, pv = v => (typeof v === 'function' ? v(ob.p || {}) : v), dr = pv(a.door), good = (x, y) => ok(x, y) && free(x, y);
  const px = (dr && dr.side === 'x') !== !!ob.flip, len = px ? B[4] - B[1] : B[3] - B[0], at = !dr || dr.at === undefined ? len / 2 : Math.min(len - .5, Math.max(.5, dr.at));
  for (const out of [.75, 1.25, 1.75, 2.25, 2.75]) for (const off of [0, .5, -.5, 1, -1, 1.5, -1.5, 2, -2, 3, -3]) { const p = px ? { x: B[3] + out, y: B[1] + at + off } : { x: B[0] + at + off, y: B[4] + out }; if (good(p.x, p.y)) return { x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 100) / 100, dir: px ? 0 : 1 }; }
  for (const out of [.75, 1.5, 2.25]) for (const p of [{ x: (B[0] + B[3]) / 2, y: B[4] + out, dir: 1 }, { x: B[3] + out, y: (B[1] + B[4]) / 2, dir: 0 }, { x: (B[0] + B[3]) / 2, y: B[1] - out, dir: 3 }, { x: B[0] - out, y: (B[1] + B[4]) / 2, dir: 2 }]) if (good(p.x, p.y)) return p;
  return null;
}
const has = k => Map.prototype.has.call(ROOMS, k);
const hoursOf = L => L.hours, openNow = L => { const hr = hoursOf(L); if (!hr) return true; const h = G.now().hf; return h >= hr[0] && h < hr[1]; };
function ensure(w) {
  if (built === w || !w || !Array.isArray(w.objs)) return;
  try { ROOMS.has('pub:__'); } catch (e) { } // public places first (it claims shopfronts and adds their doors)
  built = w; PL.length = 0; BY.clear(); skipped = [];
  const blds = w.objs.filter(ob => ob.a && ob.a.kind === 'building' && ob.B), doors = w.pois.filter(p => (p.type === 'door' || p.type === 'stall') && !p.lobby);
  const dist = (p, ob) => Math.hypot(Math.max(ob.B[0] - p.x, 0, p.x - ob.B[3]), Math.max(ob.B[1] - p.y, 0, p.y - ob.B[4]));
  const owned = new Set(); for (const p of doors) { let b = null, bd = 3.2; for (const ob of blds) { const d = dist(p, ob); if (d < bd) { bd = d; b = ob; } } if (b) owned.add(b); }
  const claimed = new Set(G.publicPlaces ? G.publicPlaces.list().map(p => p.ob) : []);
  const start = doors.find(p => /^door:(cafe|bakery|grocery)/.test(p.id) && !w.isBlocked(p.x, p.y)) || doors.find(p => !w.isBlocked(p.x, p.y)), ok = start ? flood(w, start.x, start.y) : (x, y) => !w.isBlocked(x, y);
  const taken = doors.map(p => ({ x: p.x, y: p.y })), free = (x, y) => !taken.some(q => Math.hypot(q.x - x, q.y - y) < 1.6);
  const seq = {}, names = new Set(); let n = 0;
  for (const ob of blds) {
    const key = classOf(ob); if (!key) continue; n++;
    if (owned.has(ob) || claimed.has(ob)) continue;
    const i = seq[key] = (seq[key] || 0) + 1, spec = specFor(key, i - 1); if (!spec) continue;
    const sp = doorSpot(ob, ok, free); if (!sp) { skipped.push(ob.id + '@' + Math.round(ob.x) + ',' + Math.round(ob.y)); continue; }
    taken.push({ x: sp.x, y: sp.y });
    const district = w.districtAt(sp.x, sp.y) || w.districtAt(ob.x, ob.y) || 'downtown'; let name = spec.name; if (names.has(name)) name += ' ' + n; names.add(name);
    const id = 'lobby:' + n, kind = spec.kind === 'office' ? 'office' : 'res';
    const poi = w.poi({ type: 'door', id: 'door:' + id, room: id, name, x: sp.x, y: sp.y, dir: sp.dir === undefined ? 1 : sp.dir, district, lobby: kind, blurb: spec.blurb });
    const L = { id, n, kind, key, style: spec.style, name, x: sp.x, y: sp.y, district, poi, ob, spec, hours: kind === 'office' ? (spec.hours || [7, 20]) : null, get address() { return poi.address || (G.address && G.address.of(poi) || {}).text || ''; } };
    if (!has(id)) defineRoom(lobbyRoom(Object.assign({}, spec, { id, n, name, kind, district, c: Object.assign({}, spec.c) })));
    registerInfo(name, { blurb: spec.blurb, signature: spec.sig, tryThis: spec.tryThis || [], activities: ['seat'], kind: kind === 'res' ? 'apartment' : 'office', hours: L.hours });
    PL.push(L); BY.set(id, L);
  }
}
const norm = id => (typeof id === 'number' ? 'lobby:' + id : String(id).replace(/^door:/, ''));
const api = {
  list: () => PL.slice(), get: id => BY.get(norm(id)) || null,
  nearest(kind, x, y) { let b = null, bd = 1e9; for (const p of PL) { if (kind && p.kind !== kind && p.style !== kind) continue; const d = Math.hypot(p.x - x, p.y - y); if (d < bd) { bd = d; b = p; } } return b; },
  isOpen: id => { const L = BY.get(norm(id)); return !!L && openNow(L); },
  byDistrict() { const o = {}; for (const p of PL) (o[p.district] = o[p.district] || []).push(p); return o; },
  census() { const c = { total: PL.length, res: 0, office: 0, district: {}, style: {}, skipped }; for (const p of PL) { c[p.kind]++; c.district[p.district] = (c.district[p.district] || 0) + 1; c.style[p.style] = (c.style[p.style] || 0) + 1; } return c; },
};
function enter(L) {
  if (!openNow(L)) { toast(`${L.name} is closed. The lobby is open ${String(L.hours[0]).padStart(2, '0')}:00 – ${L.hours[1]}:00.`, 'info', 3200); return; }
  if (ROOMS.has(L.id)) enterRoom(L.id, L.poi.id); else toast("It's locked.");
}
export function init() {
  G.lobbies = api;
  // rooms may be asked for before the city scene was ever built (a save made inside a lobby, ?scene=int:lobby:<n>)
  const get0 = ROOMS.get, has0 = ROOMS.has, lazy = k => { if (!built && typeof k === 'string' && k.startsWith('lobby:')) { try { ensure(getCity()); } catch (e) { console.warn('lobbies', e); } } };
  ROOMS.get = k => { lazy(k); return get0.call(ROOMS, k); }; ROOMS.has = k => { lazy(k); return has0.call(ROOMS, k); };
  G.on('scene', s => {
    if (!s || s.id !== 'city' || s._lobbies || !s.world) return; s._lobbies = true; ensure(s.world);
    for (const L of PL) {
      const p = L.poi, old = s.interactables.find(it => it.poi === p || (Math.abs(it.x - p.x) < .01 && Math.abs(it.y - p.y) < .01 && it.label === L.name));
      if (old) { old.label = 'Enter lobby — ' + L.name; old.poi = p; old.use = () => enter(L); }
      else s.interactables.push({ x: p.x, y: p.y, label: 'Enter lobby — ' + L.name, h: 1.2, range: 1.3, poi: p, use: () => enter(L) });
    }
  });
  G.on('places:built', () => { if (!G.places) return; for (const L of PL) { const pl = G.places.get(L.id); if (pl) { pl.open = () => openNow(L); pl.lobby = L.kind; if (!pl.blurb) pl.blurb = L.spec.blurb; } } });
}
