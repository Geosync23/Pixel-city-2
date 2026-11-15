// Chapter places (helper of sim/chapters.js): turns the place ids used by src/story/chapters.js into real destinations.
//
//   resolve(placeId) -> { id, name, room: room id | null (no 'int:'), root: the building's entrance room | null, door: city door poi id | null,
//                         x, y (CITY coordinates: the door, or the spot itself), spot: bool (an outdoor spot), ride?: 'cab' } | null
//   here(dest) -> bool          the player is at that destination right now (in the room, or within NEAR units of the spot)
//   sameBuilding(dest) -> bool  the player is inside the building `dest.room` belongs to (so a lift / stair / ladder is all that is between)
//   freeNear(world, x, y, r?) -> { x, y }   nearest walkable cell
//   NEW spots defined here (city coordinates): spot:second_wind (the pontoon by the Captain's boat), spot:kettle_stall (Market Street),
//   spot:airport_arrivals (the kerb outside Arrivals), spot:building_stoop (outside the player's own door).
import { G } from '../core/game.js';
import { ROOMS } from '../scenes/interior.js';
import { rootOf } from './navgoals.js';

export const NEAR = 5.5;
const safe = (f, d) => { try { const v = f(); return v === undefined || v === null ? d : v; } catch (e) { return d; } };
export const cityScene = () => (G.sceneCache && G.sceneCache.get('city')) || null;
export const cityWorld = () => { const c = cityScene(); return c ? c.world : null; };

/* outdoor spots: [x, y, name, G.places id to prefer (optional)] */
export const SPOTS = {
  'spot:playground': [66, 186, 'the playground, Central Park', 'poi_playground'],
  'spot:lighthouse': [36.5, 356.5, 'the foot of Gull Point Lighthouse', null],
  'spot:city_hall_steps': [222, 220.5, 'the City Hall steps', null],
  'spot:campus_green': [176, 49, 'the campus green', null],
  'spot:school': [313, 214, 'Maplewood Elementary', null],
  'lookout': [86, 25, 'Hillcrest Lookout', 'poi_lookout'],
  'spot:second_wind': [99, 361, 'the Second Wind, berth 3', null],
  'spot:kettle_stall': [100.5, 254.5, 'the Little Kettle, Market Street', null],
  'spot:market_street': [100.5, 254.5, 'Market Street', null],
  'spot:airport_arrivals': [341, 104, 'Arrivals, Maple Bay International', null],
  'spot:tram_shed': [270, 326, 'the old tram shed', null],
};
const ALIAS = { skydeck: 'skydeck', park: 'spot:playground' };

export function freeNear(w, x, y, r = 5) {
  if (!w) return { x, y };
  const ok = (a, b) => a > 0 && b > 0 && a < w.w && b < w.h && !safe(() => w.isBlocked(a, b), true);
  if (ok(x, y)) return { x, y };
  for (let d = .5; d <= r; d += .5) for (let k = 0; k < 16; k++) { const a = k / 16 * 6.283, cx = Math.round((x + Math.cos(a) * d) * 2) / 2, cy = Math.round((y + Math.sin(a) * d) * 2) / 2; if (ok(cx, cy)) return { x: cx, y: cy }; }
  return { x, y };
}
function homeDest() {
  const h = safe(() => G.housing.current(), null); if (!h || !h.roomId) return null;
  const p = safe(() => G.places.get(h.roomId), null), poi = safe(() => cityWorld().pois.find(q => q.id === (h.door || 'door:' + h.roomId)), null), at = p || poi; if (!at) return null;
  return { id: 'home:player', name: (h.home && h.home.name) || 'home', room: h.roomId, root: h.roomId, door: (poi && poi.id) || 'door:' + h.roomId, x: at.x, y: at.y, spot: false };
}
export function resolve(id) {
  if (!id) return null; id = ALIAS[id] || id;
  if (id === 'ride:cab') return { id, name: 'Cab 22', room: null, root: null, door: null, x: 0, y: 0, spot: false, ride: 'cab' };
  if (id === 'home:player') return homeDest();
  if (id === 'spot:building_stoop') { const h = homeDest(); if (!h) return null; const f = freeNear(cityWorld(), h.x + 1.5, h.y + 1.5); return { id, name: 'your front stoop', room: null, root: null, door: null, x: f.x, y: f.y, spot: true }; }
  if (SPOTS[id]) {
    const s = SPOTS[id], p = s[3] && safe(() => G.places.get(s[3]), null), f = freeNear(cityWorld(), p ? p.x : s[0], p ? p.y : s[1]);
    return { id, name: s[2], room: null, root: null, door: null, x: f.x, y: f.y, spot: true };
  }
  if (ROOMS.has(id)) {
    const root = id === 'home:grandma:attic' ? 'home:grandma' : rootOf(id), p = safe(() => G.places.get(root), null) || safe(() => G.places.get(id), null);
    const poi = safe(() => cityWorld().pois.find(q => q.id === 'door:' + root), null), at = p || poi;
    return { id, name: (ROOMS.get(id).name) || (p && p.name) || id, room: id, root, door: poi ? poi.id : (p && p.poi && p.poi.id) || null, x: at ? at.x : 0, y: at ? at.y : 0, spot: false, noDoor: !at };
  }
  const p = safe(() => G.places.get(id), null);
  if (p) { if (p.roomId && ROOMS.has(p.roomId)) return resolve(p.roomId); const f = freeNear(cityWorld(), p.x, p.y); return { id, name: p.name, room: null, root: null, door: null, x: f.x, y: f.y, spot: true }; }
  return null;
}
export function here(d) {
  if (!d || !G.scene) return false;
  if (d.ride) return !!safe(() => G.transit.ride, null);
  if (d.room) return G.scene.id === 'int:' + d.room;
  return G.scene.id === 'city' && Math.hypot(G.player.x - d.x, G.player.y - d.y) < NEAR;
}
export function sameBuilding(d) {
  if (!d || !d.room || !G.scene || !/^int:/.test(G.scene.id)) return false; const cur = G.scene.id.slice(4);
  const r = x => (/^home:grandma/.test(x) ? 'home:grandma' : rootOf(x));
  return r(cur) === r(d.room);
}
export const inCity = () => !!G.scene && G.scene.id === 'city';
