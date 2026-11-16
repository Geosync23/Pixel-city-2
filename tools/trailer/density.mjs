// How busy does the game really get? Counts pedestrians and vehicles IN VIEW at a place over the day, in the running build, nothing changed:
//   node tools/trailer/density.mjs <name> <x> <y> <zoom> [hours "7,8,..."] [days "0,5"]     (day 0 = Monday, 5 = Saturday)
// Per sample: the clock is set, the hidden player (free camera) is taken away and brought back so the game repopulates as on arrival, then the simulation
// runs 25 s and the counts are averaged over the last 5 s (5 readings). Clear weather. Output: one line per sample + <scratch>/density/<name>.json.
// people = G.crowd citizens on screen; moving / parked = G.traffic vehicles on screen; ev = a calendar / city event the game itself has on at that place and time.
import fs from 'node:fs'; import path from 'node:path'; import { open, installHelpers, freeze, settle, SCRATCH } from './lib.mjs';
const [name, x, y, zoom, hours = '7,8,9,10,11,12,13,14,15,16,17,18,19,20', days = '0,5'] = process.argv.slice(2);
const { page, close } = await open({ url: '?scene=city&t=12&debug&weather=clear' });
await installHelpers(page);
await page.evaluate(() => { window.COUNT = () => { const on = e => { const s = G.toScreen(e.x, e.y, e.z || 0); return s.x > 0 && s.x < innerWidth && s.y > 0 && s.y < innerHeight; };
  const cit = G.crowd.citizens().filter(c => c.active && !c.hidden && on(c)); const veh = G.traffic.vehicles.filter(v => !v.hidden && v.active !== false && on(v));
  return { people: cit.length, moving: veh.filter(v => Math.abs(v.v || 0) > .3).length, parked: veh.filter(v => !(Math.abs(v.v || 0) > .3)).length, total: G.crowd.count(), ev: (G.cityEvents.live() || {}).id || null, cal: G.calEvents.live().map(e => e.id).join('+') || null, wd: G.now().weekday, clock: G.now().clock }; }; });
await freeze(page); const out = [];
for (const d of days.split(',').map(Number)) for (const h of hours.split(',').map(Number)) {
  await page.evaluate(([d, h, x, y, z]) => { G.state.t = d * 1440 + h * 60; TR.free(x > 190 ? x - 120 : x + 120, y, z); }, [d, h, +x, +y, +zoom]); await settle(page, 1);
  await page.evaluate(([x, y, z]) => TR.free(x, y, z), [+x, +y, +zoom]); await settle(page, 20);
  const acc = { people: 0, moving: 0, parked: 0 }; let last; for (let k = 0; k < 5; k++) { await settle(page, 1); last = await page.evaluate(() => COUNT()); for (const q in acc) acc[q] += last[q] / 5; }
  const r = { day: d, h, people: +acc.people.toFixed(1), moving: +acc.moving.toFixed(1), parked: +acc.parked.toFixed(1), pool: last.total, ev: last.ev, cal: last.cal, wd: last.wd }; out.push(r); console.log(name, JSON.stringify(r));
}
fs.mkdirSync(path.join(SCRATCH, 'density'), { recursive: true }); fs.writeFileSync(path.join(SCRATCH, 'density', name + '.json'), JSON.stringify(out)); await close();
