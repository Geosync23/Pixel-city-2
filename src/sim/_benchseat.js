// Seats of placed props in the city (seating follow-ups, owner msg 180). Shared by sim/activities.js (the player) and sim/crowd.js (city folk).
import { U } from '../engine/raster.js';
const FLP = [1, 0, 3, 2], Q = [];
/** the seats of a placed prop in world coordinates; z = the absolute height of the seat */
export const propSeats = (ob, st) => st.map(q => ob.flip ? { x: ob.x + q.y, y: ob.y + q.x, z: (ob.z || 0) + (q.z || .45), dir: FLP[q.dir || 0] } : { x: ob.x + q.x, y: ob.y + q.y, z: (ob.z || 0) + (q.z || .45), dir: q.dir || 0 });
/** a seat with its height over the ground under it. A seated character's height is 'ground under the seat + seat z', so an absolute seat height must not be passed as it is: on ground that is not at 0 the sitter floated by the ground's height (or sank by it in the harbour, QA round 15 B10 / B11) */
export const onGround = (world, s) => s && Object.assign({}, s, { z: Math.max(0, s.z - world.heightAt(s.x, s.y)) });
/** the real seats (absolute z) of the bench prop a bench poi stands for, or null. The poi only knows the bench's middle, and its dir is the way the bench looks out: used as a seat it put the sitter between the
 *  two places, and on the quay and lake benches facing the backrest. */
export function benchSeats(world, p) {
  const px = (p.x - p.y) * U, py = (p.x + p.y) * U / 2 - world.heightAt(p.x, p.y) * U; Q.length = 0; world.query(px - 40, py - 40, px + 40, py + 40, Q); let best = null, bd = 1.3;
  for (const ob of Q) { const a = ob.a; if (!a || !Array.isArray(a.seats) || !/bench/.test(ob.id)) continue; const B = ob.B, d = Math.hypot((B[0] + B[3]) / 2 - p.x, (B[1] + B[4]) / 2 - p.y); if (d < bd) { bd = d; best = ob; } }
  Q.length = 0; return best ? propSeats(best, best.a.seats.filter(q => q && !q.lie)) : null;
}
