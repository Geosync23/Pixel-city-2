// Street addresses. Every door (and any point) gets a US-style address from the nearest named street:
//   number = 100 x block index along the street (blocks are counted at cross streets) + position within the block, odd on one side / even on the other.
// API: G.address.of(poiOrPoint) -> { number, street, text: '214 Maple Ave' };  G.address.streets() -> [{ name, axis, c, a, b }] (merged, unique);
//      G.address.find(text) -> poi | null.   Door pois get `poi.address` (string) and door prompts show it.
import { G } from '../core/game.js';
export const order = 62;
let world = null, streets = [];
function build(w) {
  world = w; const by = new Map();
  for (const r of w.roads || []) { const k = r.name + '|' + r.axis + '|' + r.c; const s = by.get(k); if (s) { s.a = Math.min(s.a, r.a); s.b = Math.max(s.b, r.b); } else by.set(k, { name: r.name, axis: r.axis, c: r.c, a: r.a, b: r.b, half: r.half, kind: r.kind }); }
  streets = [...by.values()];
  for (const s of streets) { const cuts = new Set(); for (const n of w.intersections || []) { const along = s.axis === 'x' ? n.x : n.y, across = s.axis === 'x' ? n.y : n.x; if (Math.abs(across - s.c) < 3 && along >= s.a - 1 && along <= s.b + 1) cuts.add(Math.round(along)); } s.cuts = [...cuts].sort((p, q) => p - q); }
}
function of(pt) {
  if (!world || !pt) return null; let best = null, bd = 1e9;
  for (const s of streets) { const along = s.axis === 'x' ? pt.x : pt.y, across = (s.axis === 'x' ? pt.y : pt.x) - s.c; const ca = Math.max(s.a, Math.min(s.b, along)); const d = Math.abs(across) + Math.abs(along - ca) * 2; if (d < bd) { bd = d; best = { s, along: ca, across }; } }
  if (!best || bd > 40) return null; const s = best.s; let block = 1; for (const c of s.cuts) if (c <= best.along) block++; const start = [...s.cuts].reverse().find(c => c <= best.along); const within = Math.max(0, Math.round((best.along - (start === undefined ? s.a : start)) / 2)) * 2; let num = block * 100 + within; if (best.across > 0) num += 1;
  return { number: num, street: s.name, text: num + ' ' + s.name };
}
const CANON = { 'door:home:grandma': '4 Thimble Street', 'door:home:sibling': '12 Sycamore Lane' };   /* the story's addresses win (docs/story/CHAPTERS.md) */
export function init() {
  G.address = { of, streets: () => streets, find: t => { t = String(t).toLowerCase(); return world ? world.pois.find(p => p.address && p.address.toLowerCase() === t) || null : null; } };
  G.on('scene', s => {
    if (s.id !== 'city' || s._addr) return; s._addr = true; build(s.world); const seen = new Set();
    for (const p of s.world.pois) { if (p.type !== 'door' && p.type !== 'station' && p.type !== 'stall') continue; const a = of(p); if (!a) continue; let t = a.text, n = a.number; while (seen.has(t)) { n += 2; t = n + ' ' + a.street; } seen.add(t); p.address = CANON[p.id] || t; }
    for (const it of s.interactables) { const p = s.world.pois.find(q => q.address && q.type === 'door' && Math.abs(q.x - it.x) < .01 && Math.abs(q.y - it.y) < .01); if (p && it.label && !it._addr) { it._addr = true; it.label = it.label + '  ·  ' + p.address; } }
    G.emit('addresses:built');
  });
}
