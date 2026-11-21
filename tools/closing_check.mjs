// closing_check: shops lock their street door outside opening hours; 24-hour places never do (owner msg 283).   node tools/closing_check.mjs
import { boot } from './fe_lib.mjs';
const B = await boot({ w: 390, h: 844 }); const { pg, ev } = B; await B.newGame(); await ev(() => { G.firstEvening.skip(); G.firstTime.setEnabled(false); G.state.tips.shopHint = 99; });
let fails = 0; const ok = (c, name, d = '') => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + name + (d ? '  [' + d + ']' : '')); };
const tryDoor = async (room, h, wd) => { await ev(([h, wd]) => { let d = Math.floor(G.state.t / 1440) + 1; while (wd !== null && d % 7 !== wd) d++; G.state.t = d * 1440 + h * 60; }, [h, wd === undefined ? null : wd]); await ev(() => { G.go('city'); }); await pg.waitForTimeout(1300);
  return ev(async room => { const it = G.interactables().find(i => i.poi && i.poi.type === 'door' && i.poi.room === room); if (!it) return { err: 'no door ' + room }; G.player.stop(); G.player.x = it.x; G.player.y = it.y + .5; let said = ''; let msg = ''; const off = G.on('door:closed', (p, m) => { said = 'closed'; msg = m; }); it.use(G, it); await new Promise(r => setTimeout(r, 1600)); off && off(); const t = msg; return { sc: String(G.scene.id), said, toast: t, wd: G.now().weekday, clock: G.now().clock }; }, room); };
let r;
r = await tryDoor('cafe', 23); ok(r.sc === 'city' && /is closed\. Opens tomorrow at 7:00\./.test(r.toast), 'cafe at 23:00: locked, says when it opens', JSON.stringify(r));
r = await tryDoor('cafe', 5.5); ok(r.sc === 'city' && /Opens (7|8):00\./.test(r.toast) && !/tomorrow/.test(r.toast), 'cafe at 5:30: locked, opens later today', JSON.stringify(r));
r = await tryDoor('cafe', 12); ok(r.sc === 'int:cafe', 'cafe at 12:00: open', JSON.stringify(r));
r = await tryDoor('grocery', 22.5); ok(r.sc === 'city' && /closed/.test(r.toast), 'supermarket at 22:30: locked', JSON.stringify(r));
r = await tryDoor('bookstore', 9); ok(r.sc === 'city' && /Opens (10|11):00\./.test(r.toast), 'bookshop at 9:00: locked until it opens', JSON.stringify(r));
r = await tryDoor('cornerstore', 3); ok(r.sc === 'int:cornerstore', 'corner store at 3:00: open (24 hours)', JSON.stringify(r));
r = await tryDoor('pub:6', 3.5); ok(r.sc === 'int:pub:6', 'gas station mini mart at 3:30: open (24 hours)', JSON.stringify(r));
r = await tryDoor('diner', 4); ok(r.sc === 'int:diner', 'diner at 4:00: open (24 hours)', JSON.stringify(r));
r = await tryDoor('bar', 23.5); ok(r.sc === 'int:bar', 'bar at 23:30: open (late hours)', JSON.stringify(r));
r = await tryDoor('bar', 12); ok(r.sc === 'city' && /Opens 17:00\./.test(r.toast), 'bar at noon: locked until the evening', JSON.stringify(r));
// staff key: with a job at the cafe the door opens before hours
const hired = await ev(() => { try { for (const id of ['barista', 'trainee_barista', 'cafe_barista']) { try { G.jobs.apply(id); } catch (e) { } const c = G.jobs.current(); if (c && c.venue === 'cafe') return 'cafe'; } const c = G.jobs.current(); return c ? 'hired at ' + c.venue : 'not hired'; } catch (e) { return 'ERR ' + e.message; } });
if (hired === 'cafe') { r = await tryDoor('cafe', 6); ok(r.sc === 'int:cafe', 'cafe at 6:00 when you work there: your key lets you in', JSON.stringify(r)); } else console.log('     (staff-key case not run: ' + hired + ')');
// home is never locked
r = await ev(async () => { G.state.t = (Math.floor(G.state.t / 1440) + 1) * 1440 + 3 * 60; await G.go('city'); const it = G.interactables().find(i => /^Juniper Court/.test(i.label || '')); it.use(G, it); await new Promise(r => setTimeout(r, 1500)); return String(G.scene.id); }); ok(/lobby|home/.test(r), 'your own building at 3:00: opens', r);
ok(!B.errs.length, 'zero page errors', B.errs.join(' | ')); console.log(fails ? fails + ' FAILED' : 'ALL PASS'); await B.close(); process.exit(fails ? 1 : 0);
