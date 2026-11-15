// More homes in the city (owner msg 107): the front doors of the nine houses and five apartments of src/data/homes_more.js. Runtime only, nothing saved,
// no world file touched, no building moved or re-skinned: each home gets a door poi `door:home:<id>` (room `home:<id>`) on the street side of a building
// that already stands there. Houses use buildings that had no door at all; the apartments share a building with its lobby (their door sits beside it).
// Runs on the city's 'scene' event after lobbies (57) and goods (57.7) and before places (58), so G.places / the phone map / addresses / taxi / the arrow
// all pick the doors up. Housing (60) then gives every door that is not yours its listing card ("Look inside").
// G.homesCity = { sites() -> [{ id, x, y, poi, bld }], door(id) -> poi | null }
import { G } from '../core/game.js';
import { HOME_BY_ID } from '../data/homes.js';
import { ROOMS, enterRoom } from '../scenes/interior.js';

export const order = 57.8;
export const SITES = [
  { id: 'lantern_garret', bld: 'bld.oldtown.rowhouse.gable', at: [123, 206] }, { id: 'sunny_court_flat', bld: 'bld.oldtown.apartment.garden', at: [66, 220] },
  { id: 'inkwell_walkup', bld: 'bld.arts.lofts', at: [250, 75] }, { id: 'netloft_3', bld: 'bld.harbor.warehouse.timber', at: [196, 332] },
  { id: 'meridian_1407', bld: 'bld.downtown.tower.round', at: [222, 282] },
  { id: 'wren_cottage', bld: 'bld.res.cottage', at: [308, 178] }, { id: 'rosebank_bungalow', bld: 'bld.res.bungalow', at: [344, 239] },
  { id: 'crooked_house', bld: 'bld.oldtown.rowhouse.timber', at: [125, 211] }, { id: 'bluebird_house', bld: 'bld.res.capecod', at: [274, 207] },
  { id: 'thistle_house', bld: 'bld.res.craftsman', at: [289, 270] }, { id: 'larkspur_house', bld: 'bld.res.gablehouse', at: [97, 47] },
  { id: 'stepdown_house', bld: 'bld.res.splitlevel', at: [117, 83] }, { id: 'orchard_end', bld: 'bld.res.lhouse', at: [307, 187] },
  { id: 'gulls_rest', bld: 'bld.res.cliffhouse', at: [51, 46] },
];
let built = null; const DOOR = {};
const near = (o, at) => Math.abs(o.x - at[0]) < 1.6 && Math.abs(o.y - at[1]) < 1.6;
/* the walkable spot in front of the building's door (asset `door` { side, at }, flip-aware) or of a facade midpoint; never on top of another door */
function doorSpot(w, ob) {
  const doors = w.pois.filter(p => p.type === 'door' || p.type === 'stall');
  const ok = (x, y) => x > 1 && y > 1 && x < w.w - 1 && y < w.h - 1 && !w.isBlocked(x, y) && !w.isBlocked(x + .3, y) && !w.isBlocked(x - .3, y) && !doors.some(q => Math.hypot(q.x - x, q.y - y) < 1.4);
  const a = ob.a, B = ob.B, pv = v => (typeof v === 'function' ? v(ob.p || {}) : v), dr = pv(a.door);
  const px = (dr && dr.side === 'x') !== !!ob.flip, len = px ? B[4] - B[1] : B[3] - B[0], at = !dr || dr.at === undefined ? len / 2 : Math.min(len - .5, Math.max(.5, dr.at));
  for (const out of [.75, .5, 1.25, 1.75, 2.25]) for (const off of [0, .5, -.5, 1, -1, 1.5, -1.5, 2, -2, 2.5, -2.5, 3, -3]) { const p = px ? { x: B[3] + out, y: B[1] + at + off, dir: 0 } : { x: B[0] + at + off, y: B[4] + out, dir: 1 }; if (ok(p.x, p.y)) return p; }
  for (const out of [.75, 1.5, 2.25]) for (const p of [{ x: B[3] + out, y: (B[1] + B[4]) / 2, dir: 0 }, { x: (B[0] + B[3]) / 2, y: B[4] + out, dir: 1 }]) if (ok(p.x, p.y)) return p;
  return null;
}
export function ensure(w) {
  if (built === w || !w || !Array.isArray(w.objs)) return; built = w;
  for (const s of SITES) {
    const h = HOME_BY_ID[s.id]; if (!h) continue; const pid = 'door:home:' + s.id; let poi = w.pois.find(p => p.id === pid);
    const ob = w.objs.find(o => o.id === s.bld && near(o, s.at)); if (!ob || !ob.B) { console.warn('homes: no building for', s.id); continue; }
    if (!poi) { const sp = doorSpot(w, ob); if (!sp) { console.warn('homes: no doorstep for', s.id); continue; }
      poi = w.poi({ type: 'door', id: pid, room: 'home:' + s.id, name: h.name, x: sp.x, y: sp.y, dir: sp.dir, district: w.districtAt(sp.x, sp.y) || h.district, moreHome: s.id }); }
    DOOR[s.id] = { poi, ob };
  }
}
function hook(s) {
  if (!s || s.id !== 'city' || !s.world) return; ensure(s.world); if (s._moreHomes) return; s._moreHomes = true;
  for (const id in DOOR) { const p = DOOR[id].poi; if (!s.interactables.some(it => it.poi === p)) s.interactables.push({ x: p.x, y: p.y, label: p.name, h: 1.2, range: 1.3, poi: p,
    use: () => { if (p.onUse && p.onUse(G, p) === true) return; if (ROOMS.has(p.room)) enterRoom(p.room, p.id); } }); }
  if (G.places && G.places.list && G.places.list().length && !G.places.get('home:' + SITES[0].id) && G.places.rebuild) G.places.rebuild();   /* places was built before the doors existed */
}
export function init() {
  G.homesCity = { sites: () => Object.keys(DOOR).map(k => ({ id: k, x: DOOR[k].poi.x, y: DOOR[k].poi.y, poi: DOOR[k].poi.id, bld: DOOR[k].ob.id })), door: id => (DOOR[id] ? DOOR[id].poi : null) };
  G.on('scene', hook); G.on('game:start', () => hook(G.sceneCache.get('city')));
  hook(G.sceneCache.get('city'));
}
