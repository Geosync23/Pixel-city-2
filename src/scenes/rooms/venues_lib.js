// Shared helpers for the venue rooms (venues_*.js). A venue room is a normal interior.js room def plus metadata:
//   venue: '<venue id>'      which data/venues.js entry this room belongs to (cinema:hall -> 'cinema')
//   music: 'cafe'|'gym'|'bar'|'shop'|'office'|'quiet'
//   npcSpots: [{ x, y, z, dir, anim, kind, fixture? }]   ROOM coords (scene.toWorld(x, y) -> world), dir 0=+x 1=+y 2=-x 3=-y,
//       anim 'sit'|'stand'|'work'|'dance'|'run'|'yoga'|..., kind 'customer'|'staff'. Derived lazily (first read) from items flagged
//       with `n: 'seats staff use pose'` (any subset; `ns` = max seats taken, `nk` = force kind) plus the hand-placed `npc: [...]` list.
import { defineRoom } from '../interior.js';
import { asset } from '../../art/registry.js';

/** floor item */
export const V = (a, x, y, p, o) => Object.assign({ id: 'furn.' + a, x, y }, p ? { p } : null, o);
/** wall items: WY = back wall along x, WX = left wall along y */
export const WY = (a, at, p, mount) => Object.assign({ id: 'furn.' + a, wall: 'y', at }, p ? { p } : null, mount !== undefined ? { mount } : null);
export const WX = (a, at, p, mount) => Object.assign({ id: 'furn.' + a, wall: 'x', at }, p ? { p } : null, mount !== undefined ? { mount } : null);
/** hand-placed npc spot */
export const S = (x, y, dir, anim = 'stand', kind = 'customer') => ({ x, y, z: 0, dir, anim, kind });
const r2 = v => Math.round(v * 100) / 100;

function spots(def) {
  const out = [];
  for (const it of def.items || []) {
    if (!it.n || it.wall) continue;
    let a; try { a = asset(it.id); } catch (e) { continue; }
    const P = it.p || {}, fl = !!it.flip, fnv = v => typeof v === 'function' ? v(P) : v, want = it.n.split(' ');
    const L = (q, anim, kind, ddir) => ({ x: r2(it.x + (fl ? q.y : q.x)), y: r2(it.y + (fl ? q.x : q.y)), z: q.z || 0,
      dir: q.dir !== undefined ? (fl ? [1, 0, 3, 2][q.dir] : q.dir) : ddir, anim: q.anim || anim, kind: it.nk || kind, fixture: it.id });
    if (want.includes('seats')) { let st = a.seatsFor ? a.seatsFor(P) : fnv(a.seats); st = Array.isArray(st) ? st : []; for (const q of st.slice(0, it.ns || 99)) out.push(L(q, 'sit', 'customer', 1)); }
    if (want.includes('staff') && fnv(a.staff)) out.push(L(fnv(a.staff), 'work', 'staff', fl ? 0 : 1));
    if (want.includes('use') && fnv(a.use)) out.push(L(fnv(a.use), 'stand', 'customer', fl ? 2 : 3));
    if (want.includes('pose') && fnv(a.pose)) out.push(L(fnv(a.pose), 'work', 'customer', 1));
  }
  return out.concat(def.npc || []);
}

export function room(def) {
  let cache = null;
  Object.defineProperty(def, 'npcSpots', { enumerable: true, configurable: true, get() { return cache || (cache = spots(def)); } });
  if (!def.venue) def.venue = def.id;
  return defineRoom(def);
}
