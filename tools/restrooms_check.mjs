// Real venue restrooms check (src/sim/restrooms.js): New Game at 390x844 touch, then for each venue with a real restroom: tap the Restroom door, walk in,
// tap a Toilet (bladder fills, the stall door shuts, you are hidden), tap Wash hands (hygiene), tap the way out (you land at the door you used);
// also: no need (bladder full), leaving unwashed (one nudge), night, and a home bathroom. Run after node tools/build.mjs.
//   node tools/restrooms_check.mjs [--only diner,skydeck,cityhall]      Shots: out/shots/bath_*.png
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module';
const ROOT = '/home/user/Pixel-city-2'; const require = createRequire(ROOT + '/'); const { chromium } = require('playwright');
const a = process.argv.slice(2), o = { only: '' }; for (let i = 0; i < a.length; i++) o[a[i].slice(2)] = a[++i];
const HTML = fs.readFileSync(path.join(ROOT, 'dist/index.html'), 'utf8');
const OUT = path.join(ROOT, 'out/shots'); fs.mkdirSync(OUT, { recursive: true });
const srv = http.createServer((q, r) => { r.writeHead(200, { 'content-type': 'text/html' }); r.end(HTML); }); await new Promise(r => srv.listen(0, r)); const U = `http://localhost:${srv.address().port}/`;
const br = await chromium.launch(); const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true }), pg = await ctx.newPage(), errs = [];
pg.on('pageerror', e => errs.push('PAGEERROR ' + e.message.slice(0, 300))); pg.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 300)); });
await pg.goto(U); await pg.evaluate(() => localStorage.clear()); await pg.goto(U);
await pg.waitForFunction(() => window.G && G.onTitle !== undefined && !document.getElementById('load'), null, { timeout: 180000 }); await pg.waitForTimeout(800);
const tap = async (x, y, w = 350) => { await pg.touchscreen.tap(x, y); await pg.waitForTimeout(w); };
const find = (re, sc = 'button') => pg.evaluate(([s, sc]) => { const x = new RegExp(s, 'i'), e = [...document.querySelectorAll(sc)].find(b => b.offsetWidth && x.test((b.getAttribute('aria-label') || b.textContent || '').trim())); if (!e) return null; e.scrollIntoView({ block: 'center' }); const q = e.getBoundingClientRect(); return [q.left + q.width / 2, q.top + q.height / 2]; }, [re.source, sc]);
const tapText = async (re, sc = 'button', w) => { const r = await find(re, sc); if (!r) throw new Error('no button ' + re); await tap(r[0], r[1], w); return r; };
const shot = n => pg.screenshot({ path: path.join(OUT, 'bath_' + n + '.png') });
let bad = 0; const say = (ok, t) => { if (!ok) bad++; console.log((ok ? 'PASS ' : 'FAIL ') + t); };
const closeUi = () => pg.evaluate(async () => { for (let i = 0; i < 12; i++) { const s = document.querySelector('.say'); if (s) s.click(); const b = [...document.querySelectorAll('button')].find(b => /^(Got it|OK|Close)$/.test(b.textContent.trim()) && b.offsetParent); if (b) b.click(); if (!s && !b) break; await new Promise(r => setTimeout(r, 80)); } });
const toasts = () => pg.evaluate(() => [...document.querySelectorAll('#toasts > *')].map(e => e.textContent.trim()));
/** tap an interactable of the current scene (by label) on the canvas, as a finger would */
async function tapIt(re, w = 400) {
  const p = await pg.evaluate(s => { const x = new RegExp(s), its = G.interactables().filter(i => isFinite(i.x) && x.test(i.label || '')); if (!its.length) return null; const P = G.player; its.sort((a, b) => Math.hypot(a.x - P.x, a.y - P.y) - Math.hypot(b.x - P.x, b.y - P.y)); const it = its[0]; const q = G.toScreen(it.x, it.y, Math.min(1.4, (it.h || 1) * .6)); return [q.x, q.y, it.label]; }, re.source);
  if (!p) throw new Error('nothing labelled ' + re + ' here'); await tap(p[0], p[1], w); return p[2];
}
const waitFor = (fn, arg, ms = 25000) => pg.waitForFunction(fn, arg, { timeout: ms, polling: 100 }).then(() => true, () => false);
const st = () => pg.evaluate(() => ({ scene: G.scene.id, x: +G.player.x.toFixed(2), y: +G.player.y.toFixed(2), bladder: Math.round(G.needs.get('bladder')), hygiene: +G.needs.get('hygiene').toFixed(1), busy: G.busy && G.busy.label, hidden: !!G.player.hidden, t: G.now().clock }));

// ---- New Game (touch), intro skipped
await tapText(/^New Game$/, 'button', 1200);
await tapText(/^Next ▶/, 'button', 1200); await tapText(/^Surprise me/, 'button', 600); await tapText(/^Next ▶/, 'button', 1500);
await tapText(/./, '.hp-card', 500); await tapText(/^Move in/, 'button', 2500);
await pg.waitForFunction(() => window.G && G.intro, null, { timeout: 60000 });
await pg.evaluate(() => G.intro.skip()); await pg.waitForTimeout(4000);
await pg.waitForFunction(() => !G.intro.active && G.scene, null, { timeout: 60000 });
await pg.evaluate(() => { try { G.state.tips.off = 1; } catch (e) { } try { G.firstTime.setEnabled(false); } catch (e) { } });
await pg.waitForTimeout(800); await closeUi();

const VENUES = [['diner', 'door:diner'], ['skydeck', 'door:skydeck_lobby'], ['cityhall', 'door:cityhall']].filter(v => !o.only || o.only.split(',').includes(v[0]));
for (const [v, door] of VENUES) {
  console.log('--- ' + v);
  await pg.evaluate(([v, door]) => { G.state.flags.lastDoor = door; G.state.t = Math.floor(G.state.t / 1440) * 1440 + 12 * 60; G.needs.set('bladder', 18); G.needs.set('hygiene', 50); return G.go('int:' + v); }, [v, door]);
  await pg.waitForTimeout(1500); await closeUi();
  // stand a few steps from the Restroom door, then tap it
  const dr = await pg.evaluate(() => { const it = G.interactables().find(i => i.restroom); if (!it) return null; const s = it.spot || it; let best = null; for (const [dx, dy] of [[0, 3], [3, 0], [2, 2], [-2, 3], [0, 2], [2, 0]]) { const x = s.x + dx, y = s.y + dy; if (!G.world.isBlocked(x, y)) { best = [x, y]; break; } } if (best) { G.player.x = best[0]; G.player.y = best[1]; } G.snapCam(); return { label: it.label, navTo: it.navTo, spot: [s.x, s.y] }; });
  say(!!dr && dr.navTo === 'int:' + v + ':wc', v + ': Restroom door present, leads to the restroom room (' + JSON.stringify(dr) + ')');
  await pg.waitForTimeout(600); await shot(v + '_0_door');
  await tapIt(/^Restroom$/);
  const inWc = await waitFor(id => G.scene && G.scene.id === id, 'int:' + v + ':wc');
  say(inWc, v + ': tapped the door, walked there and went in -> ' + (await st()).scene);
  if (!inWc) continue;
  await pg.waitForTimeout(1200); await closeUi(); await shot(v + '_1_room_day');
  // toilet
  const b0 = await st();
  await tapIt(/^Toilet$/, 300);
  const sat = await waitFor(() => G.busy && /toilet/i.test(G.busy.actId || G.busy.label || ''), null, 15000);
  const mid = await st(); const shut = await pg.evaluate(() => G.scene.fixtures.some(f => f.tags.includes('wcstall') && f.ob.p.occ));
  say(sat && mid.hidden && shut, v + ': Toilet: activity started, player hidden, the stall door shut (' + JSON.stringify(mid) + ')');
  await pg.waitForTimeout(500); await shot(v + '_2_inuse');
  await waitFor(() => !G.busy, null, 20000); const b1 = await st(); const open = await pg.evaluate(() => !G.scene.fixtures.some(f => f.tags.includes('wcstall') && f.ob.p.occ));
  say(b1.bladder >= 99 && b0.bladder < 30 && !b1.hidden && open, v + `: bladder ${b0.bladder} -> ${b1.bladder}, visible again, door open again`);
  // wash hands (diner: first leave without washing to see the nudge, then come back)
  if (v === 'diner') {
    await tapIt(/^Back to /); await waitFor(id => G.scene.id === id, 'int:' + v, 15000); const tt = (await toasts()).join(' | ');
    say(/without washing/i.test(tt), v + ': left unwashed -> nudge: ' + tt.slice(0, 160));
    await pg.waitForTimeout(800); await tapIt(/^Restroom$/); await waitFor(id => G.scene.id === id, 'int:' + v + ':wc', 15000); await pg.waitForTimeout(800);
  }
  const h0 = (await st()).hygiene;
  await tapIt(/^Wash hands$/, 300); const washing = await waitFor(() => !!G.busy, null, 12000); await pg.waitForTimeout(300); await shot(v + '_3_wash');
  await waitFor(() => !G.busy, null, 15000); const h1 = (await st()).hygiene;
  say(washing && h1 > h0, v + `: Wash hands: hygiene ${h0} -> ${h1}`);
  // no need: bladder full
  await pg.evaluate(() => G.needs.set('bladder', 100)); await tapIt(/^Toilet$/, 300); await pg.waitForTimeout(2500);
  const nn = await st(), nt = (await toasts()).join(' | '); say(!nn.busy && /do not need/i.test(nt), v + ': bladder full -> no visit: ' + nt.slice(-80));
  // out
  await tapIt(/^Back to /); const back = await waitFor(id => G.scene.id === id, 'int:' + v, 15000); await pg.waitForTimeout(700);
  const at = await st(); const d = Math.hypot(at.x - dr.spot[0], at.y - dr.spot[1]); const tt2 = (await toasts()).join(' | ');
  say(back && d < .9, v + `: way out -> ${at.scene} at (${at.x}, ${at.y}), ${d.toFixed(2)} from the door spot`); say(!/without washing/i.test(tt2) || v === 'diner', v + ': no nudge after washing');
  await shot(v + '_4_back');
  // night
  await pg.evaluate(() => { G.state.t = Math.floor(G.state.t / 1440) * 1440 + 22 * 60 + 30; }); await tapIt(/^Restroom$/); await waitFor(id => G.scene.id === id, 'int:' + v + ':wc', 15000);
  await pg.waitForTimeout(1500); await closeUi(); await shot(v + '_5_room_night');
  await pg.evaluate(() => G.needs.set('bladder', 25)); await tapIt(/^Toilet$/, 300); await waitFor(() => !!G.busy, null, 12000); await pg.waitForTimeout(400); await shot(v + '_6_inuse_night'); await waitFor(() => !G.busy, null, 20000);
  await tapIt(/^Back to /); await waitFor(id => G.scene.id === id, 'int:' + v, 15000); await pg.waitForTimeout(500);
}

// the need chooser's guide: from inside the diner the arrow points at the Restroom door, inside at a stall, and the goal ends on the seat
if (!o.only || o.only.includes('diner')) {
  console.log('--- guide');
  await pg.evaluate(() => { G.state.t = Math.floor(G.state.t / 1440) * 1440 + 13 * 60; G.state.flags.lastDoor = 'door:diner'; G.needs.set('bladder', 15); return G.go('int:diner'); }); await pg.waitForTimeout(1200);
  const g = await pg.evaluate(() => { const p = G.places && G.places.get('diner'); G.navGoals.select({ need: 'bladder', place: 'diner' }); if (G.phone && G.phone.setWaypoint) { try { G.phone.setWaypoint({ id: 'diner', x: p.x, y: p.y, name: p.name }); } catch (e) { } } else G.state.phone.waypoint = { id: 'diner', x: p.x, y: p.y, name: p.name }; return true; });
  await pg.waitForTimeout(1500); const c1 = await pg.evaluate(() => { const c = G.navGoals.current(); return c && { id: c.id, room: c.step.room, label: c.step.label }; });
  say(c1 && c1.id === 'wc' && c1.room === 'diner', 'guide in the diner: ' + JSON.stringify(c1)); await shot('guide_1_venue');
  await tapIt(/^Restroom$/); await waitFor(() => G.scene.id === 'int:diner:wc', null, 15000); await pg.waitForTimeout(1500);
  const c2 = await pg.evaluate(() => { const c = G.navGoals.current(); return c && { id: c.id, room: c.step.room, label: c.step.label }; });
  say(c2 && c2.id === 'wc' && c2.room === 'diner:wc', 'guide in the restroom: ' + JSON.stringify(c2)); await shot('guide_2_room');
  await tapIt(/^Toilet$/, 300); await waitFor(() => !!G.busy, null, 12000); await pg.waitForTimeout(800);
  const c3 = await pg.evaluate(() => G.navGoals.current()); say(!c3 || c3.id !== 'wc', 'guide ends on the seat: ' + JSON.stringify(c3 && c3.id));
  await waitFor(() => !G.busy, null, 20000);
}

// a home bathroom still works
console.log('--- home');
const hb = await pg.evaluate(async () => { const h = G.housing.current(); await G.go('int:home:' + h.id, { fresh: true }); await new Promise(r => setTimeout(r, 1000)); return { scene: G.scene.id, door: !!G.interactables().find(i => /^Bathroom$/.test(i.label)) }; });
say(hb.door, 'home: ' + JSON.stringify(hb));
if (hb.door) {
  await pg.evaluate(() => { G.needs.set('bladder', 20); const it = G.interactables().find(i => /^Bathroom$/.test(i.label)); const s = it.spot || it; G.player.x = s.x; G.player.y = s.y + 1.5; G.snapCam(); }); await pg.waitForTimeout(500);
  await tapIt(/^Bathroom$/); const ok = await waitFor(() => /:bath$/.test(G.scene.id), null, 15000); await pg.waitForTimeout(800);
  await tapIt(/^Toilet$/, 300); await waitFor(() => !!G.busy, null, 12000); await shot('home_inuse'); await waitFor(() => !G.busy, null, 20000);
  const hs = await st(); say(ok && hs.bladder >= 99, 'home bathroom: in, toilet -> bladder ' + hs.bladder);
}

console.log(errs.length ? errs.length + ' page errors:\n' + errs.slice(0, 12).join('\n') : 'no page errors'); console.log(bad ? bad + ' FAILED' : 'all passed');
await br.close(); srv.close(); process.exit(bad || errs.length ? 1 : 0);
