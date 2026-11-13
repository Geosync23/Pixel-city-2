// Maple Bay city generator (pure, deterministic, DOM-free). generateCity(seed) -> World with the data contracts documented in city.js.
import { makeCtx, DISTRICTS, W, H } from './_ctx.js';
import { baseTerrain, relax, carveWater } from './_terrain.js';
import { buildRoads, markRoads, flushMarks, bridges } from './_roads.js';

const optional = async () => { };
export function generateCity(seed = 20261, steps = {}) {
  const t0 = Date.now(), c = makeCtx(seed), w = c.world;
  w.districts = DISTRICTS.map(d => ({ ...d })); const dk = Object.fromEntries(DISTRICTS.map(d => [d.id, d.key]));
  w.districtAt = (x, y) => dk[w.zoneAt(x, y)] || null;
  w.walkways = []; w.parking = []; w.busRoutes = [];
  baseTerrain(c);
  buildRoads(c);
  for (const f of steps.terrain || []) f(c);     // modules pin pads / paint ground before relaxation
  relax(c);
  carveWater(c);
  for (const f of steps.ground || []) f(c);      // ground painting that needs final heights
  markRoads(c);
  w.bakeTerrainNav();
  bridges(c);
  for (const f of steps.build || []) f(c);       // objects
  flushMarks(c);
  w.genMs = Date.now() - t0; w.genStats = c.stats; w._ctx = c;
  return w;
}
