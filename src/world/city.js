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
export function init() {
  G.registerScene('city', () => {
    const world = getCity(), sp = world.pois.find(p => p.id === 'spawn:airport') || { x: 200, y: 200 };
    const interactables = world.pois.filter(p => p.type === 'door').map(p => ({
      x: p.x, y: p.y, label: p.name, h: 1.2, range: 1.3, poi: p,
      use: () => { if (ROOMS.has(p.room)) enterRoom(p.room, p.id); else toast("It's closed right now."); },
    }));
    return { world, ents: [], interactables, spawn: { x: sp.x, y: sp.y, dir: sp.dir || 1 } };
  });
}
