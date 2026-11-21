// staffed_check: "if a place has things to buy there is someone there" (owner msg 282).   node tools/staffed_check.mjs [--v] [--hours 10,13,19] [--reps 2]
// Every room with a counter / till that sells something (an interactable with `.shop`): whenever it SELLS (a shop's own till: always, open or closed;
// a stall / kiosk in a hall: in its own hours; never a self-service shelf / machine), somebody (staff or a named person, not a customer)
// must stand within NEAR tiles of each counter. Rooms are entered for real (G.go, fresh), at several hours, several times (staff are drawn at random).
import { boot } from './fe_lib.mjs';
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; }, V = process.argv.includes('--v');
const HOURS = arg('--hours', '10,13,19').split(',').map(Number), REPS = +arg('--reps', 2), NEAR = 2.6;
const B = await boot({ w: 390, h: 844 }); const { pg, ev } = B; await B.newGame(); await ev(() => { G.firstEvening.skip(); G.firstTime.setEnabled(false); G.state.tips.shopHint = 99; }); await pg.waitForTimeout(600);
const ids = await ev(() => G.restrooms.roomIds().filter(id => !/^home|:wc$|:bath|^lobby|^airport|^train|^dev/.test(id)));
const bad = {}, seen = {}, closed = {}, self = {}; let notsell = 0; let rooms = 0, counters = 0, checks = 0;
for (const h of HOURS) for (let rep = 0; rep < REPS; rep++) {
  await ev(h => { const d = Math.floor(G.state.t / 1440) + 1; G.state.t = d * 1440 + h * 60; }, h);
  for (const id of ids) {
    const r = await ev(async ([id, NEAR]) => { try { await G.go('int:' + id, { fresh: true, fade: false }); } catch (e) { return { err: String(e.message || e) }; }
      await new Promise(r => setTimeout(r, 260)); const sc = G.scene; if (!sc || sc.id !== 'int:' + id) return { err: 'not entered (' + (sc && sc.id) + ')' };
      const its = G.interactables().filter(i => i.shop && !i.ent); if (!its.length) return { none: 1 };
      const ppl = sc.ents.filter(e => e !== G.player && e.x !== undefined && e.setSpec && !e.hidden && e.active !== false && (e.alpha === undefined || e.alpha > .3));
      const venue = String(its[0].shop).split(':')[0]; let open = true; try { const pl = G.places.get(id) || G.places.get(id.split(':')[0]) || G.places.get(venue); if (pl && pl.open) open = !!pl.open(); } catch (e) { }
      return { open, fmOpen: (() => { try { return G.fishmarket.isOpen() && G.now().hf >= 11 && G.now().hf < 15; } catch (e) { return false; } })(), n: ppl.length, staff: ppl.filter(e => e.kind === 'staff').length, its: its.map(i => { let bd = 99, who = null; for (const e of ppl) { if (e.kind === 'customer') continue;   /* an employee or a named person, not a customer who happens to stand there */ const d = Math.hypot(e.x - i.x, e.y - i.y); if (d < bd) { bd = d; who = e.kind || 'person'; } } const ci = G.counterInfo(i); return { l: i.label, shop: i.shop, x: i.x, y: i.y, d: +bd.toFixed(1), who, ok: bd <= NEAR, self: ci.self, sells: ci.sells }; }) }; }, [id, NEAR]);
    if (r.err) { if (V) console.log('skip', id, r.err); continue; } if (r.none) continue; if (!seen[id]) { seen[id] = 1; rooms++; counters += r.its.length; }
    for (const i of r.its) { if (i.self) { self[id + ' | ' + i.l] = 1; if (i.ok) console.log('CLERK AT A SELF-SERVICE POINT  ' + id + ' | ' + i.l); continue; } if (!i.sells && !/^fishmarket/.test(i.shop)) { notsell++; continue; }   /* fish hall stalls are checked whenever the hall is open: its own mongers must be there */ if (/^fishmarket/.test(i.shop) && !r.fmOpen) { notsell++; continue; } checks++; if (!i.ok) { const k = id + ' | ' + i.l + ' (' + i.shop + ')'; (bad[k] = bad[k] || []).push(h + ':00 nearest ' + (i.who ? i.who + ' ' + i.d : 'nobody') + ', ' + r.staff + ' staff in room'); } }
  }
}
const keys = Object.keys(bad).sort(); for (const k of keys) console.log('NOBODY AT  ' + k + '   [' + bad[k].length + '/' + HOURS.length * REPS + ': ' + bad[k].slice(0, 3).join('; ') + ']');
console.log('self-service (no clerk owed): ' + Object.keys(self).join('; ') + ' | looks at a stall / kiosk that was closed at that hour (does not sell, no clerk owed): ' + notsell);
console.log(`\n${rooms} rooms with something to buy, ${counters} counters, ${checks} looks (${HOURS.join(', ')} h x ${REPS}): ${keys.length} counter(s) found unattended at least once; page errors ${B.errs.length}`);
await B.close(); process.exit(keys.length ? 1 : 0);
