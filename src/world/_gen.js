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
  let first = true;
  for (const f of steps.build || []) { f(c); if (first) { first = false; for (const p of w.pois) if (p.type === 'door' || p.type === 'spawn') c.keepClear(p.x, p.y); } else for (const p of w.pois) if (!p._k && (p.type === 'station' || p.type === 'stall')) { p._k = 1; c.keepClear(p.x, p.y, 1); } }
  // make sure every actionable poi sits on a walkable cell
  for (const p of w.pois) { delete p._k; if (p.type === 'bench' || p.type === 'landmark' || !w.isBlocked(p.x, p.y)) continue; let best = null, bd = 1e9; for (let dy = -3; dy <= 3; dy += .5) for (let dx = -3; dx <= 3; dx += .5) { const x = p.x + dx, y = p.y + dy, d = dx * dx + dy * dy; if (d < bd && !w.isBlocked(x, y)) { bd = d; best = [x, y]; } } if (best) { p.x = best[0]; p.y = best[1]; } }
  flushMarks(c);
  w.genMs = Date.now() - t0; w.genStats = c.stats; w._ctx = c;
  return w;
}
