// The open-world city scene ('city'). Generation lives in the pure modules _gen.js/_city.js (+ _roads, _rail, _airport, _places, _blocks, _furnish).
//
// World data contracts (all on the World returned by getCity()):
//   world.districts = [{id (zone id), key, name}]; world.districtAt(x,y) -> key | null; world.zone grid holds the ids.
//   world.roads = [{ id, axis:'x'|'y', c, a, b, half (2|4), name, kind }]   lanes at c±1 (and ±3); right-hand traffic: +x traffic on the +y side, +y traffic on the -x side.
//   world.intersections = [{ x, y, roads:[idX,idY], signal, z, arms:{n,s,e,w} }]
//   world.walkways = [{ x0,y0,x1,y1, axis, district, kind:'sidewalk'|'promenade'|'path'|'boardwalk'|'pier'|'lane'|'plaza', road? }]
//   world.parking = [{ x, y, axis ('y' = car is flipped), lot, occupied }]
//   world.rail = { z:5, path:[[x,y]..] closed loop, stations:[{ id, venueId, name, x, y, axis, platformZ, deckZ, entrance:{x,y} }], profile:[{x,y,z}], deckZ(x,y), trackOffsets, deckWidth }
//   world.busRoutes = [{ id, name, color, stops:[poi ids], path:[[x,y]..] lane corner loop }]
//   world.airport = { runways:[{axis,c,a,b,z,width}], taxiway, apron:{x0,y0,x1,y1}, gates:[{x,y,dir}], curb:{x,y}, approach, terminal }
//   pois: door (id 'door:<room>', room, name), station ('station:<id>'), busstop ('bus:<n>', road, side, routes, lane), taxistand ('taxi:<id>', lane),
//         spawn ('spawn:airport'), bench (dir), spot (kind), stall (venue), landmark (name).
import { G } from '../core/game.js';
import { toast } from '../ui/kit.js';
import { ROOMS, enterRoom } from '../scenes/interior.js';
import { getCity } from './_city.js';
export { getCity };
export { renderMinimap } from './minimap.js';

export const order = 50;
/* ---------- CLOSING TIME (owner msg 283): a shop / cafe / office with opening hours LOCKS its street door outside them ----------
   Returns the line to show ("Dot's Bakery is closed. Opens 6:00."), or '' when you may go in. Not locked: places with no hours (homes, lobbies), places
   that run their own door (p.locked / p.onUse: the showpieces), 24-hour places (convenience stores, the diner, the hotel), and, whatever the hour:
   during the arrival, a story Chapter, a date / relationship scene, while you are on shift, and the place you WORK at (staff have a key).
   Being inside at closing time does not throw you out: you leave when you like; you just cannot come back in. */
const clockOf = h => { h = ((h % 24) + 24) % 24; const m = Math.round((h - Math.floor(h)) * 60); return Math.floor(h) + ':' + String(m).padStart(2, '0'); };
const safe = (f, d) => { try { const v = f(); return v === undefined || v === null ? d : v; } catch (e) { return d; } };
export function closedNow(p) {
  if (!p || !p.room || p.onUse || typeof p.locked === 'function') return '';
  const pl = safe(() => G.places.get(p.room) || G.places.get(String(p.room).split(/[_:.]/)[0]), null), v = pl && pl.venue; if (!v || !v.hours || !pl.open) return ''; if (safe(() => pl.open(), true)) return '';
  if (safe(() => G.intro.active, false) || safe(() => G.chapters.active(), false) || safe(() => G.rel.active(), false) || safe(() => G.jobs.onShift(), false)) return '';
  const job = safe(() => G.jobs.current(), null); if (job && (job.venue === v.id || job.venue === p.room || safe(() => G.jobs.def(job.id).venue, '') === v.id)) return '';
  const n = G.now(); let when = ''; for (let k = 0; k < 8 && !when; k++) { const d = v.hours[(n.weekday + k) % 7]; if (!d) continue; if (k === 0 && n.hf >= d[0]) continue; when = (k === 0 ? '' : k === 1 ? 'tomorrow at ' : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][(n.weekday + k) % 7] + ' at ') + clockOf(d[0]); }
  return `${p.name || v.name} is closed.${when ? ' Opens ' + when + '.' : ''}`;
}
export function init() {
  G.registerScene('city', () => {
    const world = getCity(), sp = world.pois.find(p => p.id === 'spawn:airport') || { x: 200, y: 200 };
    const interactables = world.pois.filter(p => p.type === 'door').map(p => ({
      x: p.x, y: p.y, label: p.name, h: 1.2, range: 1.3, poi: p,
      use: () => { const why = typeof p.locked === 'function' ? p.locked(G, p) : p.locked; if (why) { if (typeof why === 'string') toast(why); return; } if (p.onUse && p.onUse(G, p) === true) return; const shut = closedNow(p); if (shut) { toast(shut, 'info', 3600); G.emit('door:closed', p, shut); return; } if (ROOMS.has(p.room)) enterRoom(p.room, p.id); else toast("It's closed right now."); },
    }));
    return { world, ents: [], interactables, spawn: { x: sp.x, y: sp.y, dir: sp.dir || 1 } };
  });
}
