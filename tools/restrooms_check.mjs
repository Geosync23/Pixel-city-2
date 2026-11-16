// Real venue restrooms check (src/sim/restrooms.js): New Game at 390x844 touch, then for each venue with a real restroom: tap the Restroom door, walk in,
// tap a Toilet (bladder fills, the stall door shuts, you are hidden), tap Wash hands (hygiene), tap the way out (you land at the door you used);
// also: no need (bladder full), leaving unwashed (one nudge), night, and a home bathroom. Batch 4: the park pavilion (from the city) and the airport restroom
// during the intro's baggage step (--only intro / park run just those). Run after node tools/build.mjs.
// Every USE (door, toilet, basin, way out) is a finger tap on the canvas; when the thing is off the phone screen the player first walks near it with the
// game's pathfinder (G.player.goTo, the same call a floor tap makes).
//   node tools/restrooms_check.mjs [--only diner,skydeck,...] [--shots bath2]      DIST=/path/to/index.html overrides the build tested (default: the repo's dist/index.html)
//   Shots: out/shots/<prefix>_*.png (prefix 'bath' by default). Also once: Stop during a toilet visit, save + reload inside a restroom, City Hall's records floor door.
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module';
const ROOT = '/home/user/Pixel-city-2'; const require = createRequire(ROOT + '/'); const { chromium } = require('playwright');
const a = process.argv.slice(2), o = { only: '', shots: 'bath' }; for (let i = 0; i < a.length; i++) o[a[i].slice(2)] = a[++i];
const HTML = fs.readFileSync(process.env.DIST || path.join(ROOT, 'dist/index.html'), 'utf8'); console.log('testing ' + (process.env.DIST || 'dist/index.html'));
const OUT = path.join(ROOT, 'out/shots'); fs.mkdirSync(OUT, { recursive: true });
const srv = http.createServer((q, r) => { r.writeHead(200, { 'content-type': 'text/html' }); r.end(HTML); }); await new Promise(r => srv.listen(0, r)); const U = `http://localhost:${srv.address().port}/`;
const br = await chromium.launch(); const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true }), pg = await ctx.newPage(), errs = [];
pg.on('pageerror', e => errs.push('PAGEERROR ' + e.message.slice(0, 300))); pg.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 300)); });
await pg.goto(U); await pg.evaluate(() => localStorage.clear()); await pg.goto(U);
await pg.waitForFunction(() => window.G && G.onTitle !== undefined && !document.getElementById('load'), null, { timeout: 180000 }); await pg.waitForTimeout(800);
const tap = async (x, y, w = 350) => { await pg.touchscreen.tap(x, y); await pg.waitForTimeout(w); };
const find = (re, sc = 'button') => pg.evaluate(([s, sc]) => { const x = new RegExp(s, 'i'), e = [...document.querySelectorAll(sc)].find(b => b.offsetWidth && x.test((b.getAttribute('aria-label') || b.textContent || '').trim())); if (!e) return null; e.scrollIntoView({ block: 'center' }); const q = e.getBoundingClientRect(); return [q.left + q.width / 2, q.top + q.height / 2]; }, [re.source, sc]);
const tapText = async (re, sc = 'button', w) => { const r = await find(re, sc); if (!r) throw new Error('no button ' + re); await tap(r[0], r[1], w); return r; };
const shot = n => pg.screenshot({ path: path.join(OUT, o.shots + '_' + n.replace(/:/g, '_') + '.png') });
const EXIT = /^((Back|Up) to |Leave the )/;   // the way out of a restroom (each room's own label)
let bad = 0; const say = (ok, t) => { if (!ok) bad++; console.log((ok ? 'PASS ' : 'FAIL ') + t); };
const closeUi = () => pg.evaluate(async () => { for (let i = 0; i < 12; i++) { const s = document.querySelector('.say'); if (s) s.click(); const mx = document.querySelector('.modal .x'); if (mx) mx.click(); const b = [...document.querySelectorAll('button')].find(b => /^(Got it|OK|Close)$/.test(b.textContent.trim()) && b.offsetParent); if (b) b.click(); if (!s && !b && !mx) break; await new Promise(r => setTimeout(r, 80)); } });
const toasts = () => pg.evaluate(() => [...document.querySelectorAll('#toasts > *')].map(e => e.textContent.trim()));
/** tap an interactable of the current scene (by label) on the canvas, as a finger would; when it is off screen or under the HUD (rooms are big at
    phone zoom), first walk near it (see the note at the top) */
const SAFE = { x0: 30, x1: 360, y0: 300, y1: 720 };
async function tapIt(re, w = 400) {
  const where = () => pg.evaluate(s => { const x = new RegExp(s), its = G.interactables().filter(i => isFinite(i.x) && x.test(i.label || '')); if (!its.length) return null; const P = G.player; its.sort((a, b) => Math.hypot(a.x - P.x, a.y - P.y) - Math.hypot(b.x - P.x, b.y - P.y)); const it = its[0]; const q = G.toScreen(it.x, it.y, Math.min(1.4, (it.h || 1) * .5)), me = G.toScreen(P.x, P.y, .7); const el = document.elementFromPoint(q.x, q.y); return [q.x, q.y, it.label, me.x, me.y, !el || el.tagName === 'CANVAS']; }, re.source);
  for (let k = 0; k < 8; k++) {
    await closeUi(); const p = await where(); if (!p) throw new Error('nothing labelled ' + re + ' here');
    if (p[0] > SAFE.x0 && p[0] < SAFE.x1 && p[1] > SAFE.y0 - 120 && p[1] < SAFE.y1 + 60 && p[5]) { await tap(p[0], p[1], w); return p[2]; }
    // walk toward it with the game's own pathfinder (what a floor tap does: G.player.goTo), then tap it with a finger. Floor taps chosen by a script kept
    // landing on other things on the way (the suggestion box, the diner counter), which is the script's aim, not the game's.
    await pg.evaluate(s => { const x = new RegExp(s), P = G.player, its = G.interactables().filter(i => isFinite(i.x) && x.test(i.label || '')).sort((a, b) => Math.hypot(a.x - P.x, a.y - P.y) - Math.hypot(b.x - P.x, b.y - P.y)); const it = its[0], t = it.spot || it; P.goTo(G.world, t.x, t.y + 1.2, { snap: 10 }) || P.goTo(G.world, t.x, t.y, { snap: 10 }); }, re.source);
    await pg.waitForFunction(() => !G.player.path || !G.player.path.length, null, { timeout: 12000 }).catch(() => {}); await pg.waitForTimeout(300);
  }
  const p = await where(); await tap(p[0], p[1], w); return p[2];
}
const dbg = () => pg.evaluate(() => JSON.stringify({ pending: G.pending && G.pending.it.label, path: G.player.path && G.player.path.length, at: [+G.player.x.toFixed(2), +G.player.y.toFixed(2)], modal: G.modal, mtxt: [...document.querySelectorAll('.modal, .say, [class*=card]')].filter(e => e.offsetWidth).map(e => e.className + ': ' + e.textContent.slice(0, 80)).slice(0, 4), busy: G.busy && G.busy.label, cut: !!G.cutscene }));
const waitFor = (fn, arg, ms = 25000) => pg.waitForFunction(fn, arg, { timeout: ms, polling: 100 }).then(() => true, () => false);
const st = () => pg.evaluate(() => ({ scene: G.scene.id, x: +G.player.x.toFixed(2), y: +G.player.y.toFixed(2), bladder: Math.round(G.needs.get('bladder')), hygiene: +G.needs.get('hygiene').toFixed(1), busy: G.busy && G.busy.label, hidden: !!G.player.hidden, t: G.now().clock }));

// ---- New Game (touch), intro skipped
await tapText(/^New Game$/, 'button', 1200);
await tapText(/^Next ▶/, 'button', 1200); await tapText(/^Surprise me/, 'button', 600); await tapText(/^Next ▶/, 'button', 1500);
await tapText(/./, '.hp-card', 500); await tapText(/^Move in/, 'button', 2500);
await pg.waitForFunction(() => window.G && G.intro, null, { timeout: 60000 });
// ---- batch 4: the airport restroom during the intro's baggage step (enter + leave before and after the bag; the step must carry on)
if (!o.only || o.only.split(',').includes('intro')) {
  console.log('--- intro: airport restroom during baggage claim');
  await pg.waitForFunction(() => G.intro.active && G.scene && /^int:/.test(G.scene.id), null, { timeout: 60000 }).catch(() => {}); await pg.waitForTimeout(1500);   // the intro's first step is under way (not still in the city)
  await pg.evaluate(() => G.intro.goto('baggage')); const inT = await waitFor(() => G.scene && G.scene.id === 'int:airport:terminal' && G.intro.at === 'baggage', null, 40000);
  await pg.waitForTimeout(1500); await closeUi();
  const ir = await pg.evaluate(() => { const it = G.interactables().find(i => i.restroom); if (!it) return null; const s = it.spot || it; G.player.x = s.x + .3; G.player.y = s.y + 1.4; G.snapCam(); return it.navTo; });
  say(inT && ir === 'int:airport:wc', 'intro baggage step: in the terminal, the Restroom leads to the airport restroom (' + ir + ') ' + JSON.stringify(await pg.evaluate(() => ({ s: G.scene.id, at: G.intro.at }))));
  await pg.waitForTimeout(500); await tapIt(/^Restroom$/); const in1 = await waitFor(() => G.scene.id === 'int:airport:wc', null, 15000); await pg.waitForTimeout(900); await closeUi(); await shot('intro_1_wc');
  await tapIt(EXIT); const out1 = await waitFor(() => G.scene.id === 'int:airport:terminal', null, 15000); await pg.waitForTimeout(600);
  say(in1 && out1 && await pg.evaluate(() => G.intro.at === 'baggage'), 'intro: in and out of the restroom before the bag, still on the baggage step');
  // the step still runs: walk to carousel 2 and the bag comes out on the belt
  await pg.evaluate(() => { const c = G.scene.spots && G.scene.spots.claim; if (c) { G.player.x = c.x + 1; G.player.y = c.y + 1.5; G.snapCam(); } });
  const bagOut = await waitFor(() => G.interactables().some(i => /^Your bag!$/.test(i.label || '')), null, 30000); await shot('intro_2_bag');
  say(bagOut, 'intro: after the restroom the bag still comes out on carousel 2');
  const got = await pg.evaluate(() => G.introAirport.grabBag()); await pg.waitForTimeout(1500); await closeUi();
  await pg.evaluate(() => { const it = G.interactables().find(i => i.restroom); const s = it.spot || it; G.player.x = s.x + .3; G.player.y = s.y + 1.4; G.snapCam(); }); await pg.waitForTimeout(500);
  await tapIt(/^Restroom$/); const in2 = await waitFor(() => G.scene.id === 'int:airport:wc', null, 15000); await pg.waitForTimeout(800); await closeUi();
  await tapIt(EXIT); const out2 = await waitFor(() => G.scene.id === 'int:airport:terminal', null, 15000); await pg.waitForTimeout(600);
  const is2 = await pg.evaluate(() => ({ at: G.intro.at, bag: !!(G.introAirport.state() || {}).bag, active: G.intro.active }));
  say(got && in2 && out2 && is2.at === 'baggage' && is2.bag, 'intro: bag collected, in and out of the restroom again, still heading for the exit ' + JSON.stringify(is2)); await shot('intro_3_back');
}
await pg.evaluate(() => G.intro.skip()); await pg.waitForTimeout(4000);
await pg.waitForFunction(() => !G.intro.active && G.scene, null, { timeout: 60000 });
await pg.evaluate(() => { try { G.state.tips.off = 1; } catch (e) { } try { G.firstTime.setEnabled(false); } catch (e) { } });
await pg.waitForTimeout(800); await closeUi();

const VENUES = [['diner', 'door:diner'], ['skydeck', 'door:skydeck_lobby'], ['cityhall', 'door:cityhall'], ['skydeck_lobby', 'door:skydeck_lobby'], ['central_station', 'door:central_station'], ['deptstore', 'door:deptstore'], ['library', 'door:library'], ['museum', 'door:museum'], ['gym', 'door:gym'], ['bar', 'door:bar'], ['arena', 'door:arena'], ['cityhall_records', 'door:cityhall'], ['hotel', 'door:hotel'], ['hotel_ballroom', 'door:hotel'], ['cafe', 'door:cafe'], ['ramen', 'door:ramen'], ['pizza', 'door:pizza'], ['bakery', 'door:bakery'], ['aquarium', 'door:aquarium'], ['natatorium:leisure', 'door:natatorium'], ['university:commons', 'door:university'], ['cinema', 'door:cinema'], ['fishmarket', 'door:fishmarket'], ['observatory', 'door:observatory', 14], ['pub:8', 'door:pub:8'], ['pub:45', 'door:pub:45'], ['pub:53', 'door:pub:53'], ['pub:29', 'door:pub:29'], ['pub:24', 'door:pub:24'],
  /* batch 4 */ ...['concerthall', 'playhouse', 'conservatory', 'clinic', 'airport:terminal', 'airport:concourse', 'lighthouse', 'restaurant', 'school_classroom', 'fire_station', 'post_main', 'post_downtown', 'post_maplewood', 'post_hillcrest', 'post_harbor',
    'cs_hollowell', 'cs_nightjar', 'cs_juniper', 'cs_secondwind', 'cs_sole', 'cs_tidepool', 'cs_outfitters', 'cs_otterline', 'cs_brim', 'cs_lantern',
    'goods:timber', 'goods:fjord', 'goods:bellwether', 'goods:lumen', 'goods:copper', 'goods:attic', 'goods:warp', 'goods:loam', 'goods:voltaic', 'goods:spoke', 'goods:kestrel', 'goods:sleepy', 'goods:nord',
    'hotel_restaurant', 'hotel_bar', 'natatorium:change', 'cinema:screen1', 'observatory:planetarium'].map(v => [v, 'door:' + v.split(/[:_]/)[0], 14])].filter(v => !o.only || o.only.split(',').includes(v[0]));
async function venueRun(v, door, hour) {
  console.log('--- ' + v); const wcId = await pg.evaluate(v => G.restrooms.roomOf(v), v); if (!wcId) { say(false, v + ': no restroom room registered'); return; }
  await pg.evaluate(([v, door, hour]) => { G.state.flags.lastDoor = door; G.state.t = Math.floor(G.state.t / 1440) * 1440 + (hour || 12) * 60; G.needs.set('bladder', 18); G.needs.set('hygiene', 50); for (const k of ['hunger', 'energy', 'fun', 'social']) G.needs.set(k, 90); return G.go('int:' + v); }, [v, door, hour]);   // other needs topped up: a long run starves the player (a faint ends the visit)
  await pg.waitForTimeout(1500); await closeUi();
  // stand a few steps from the Restroom door, then tap it
  const dr = await pg.evaluate(() => { const it = G.interactables().find(i => i.restroom); if (!it) return null; const s = it.spot || it; let best = null; for (const [dx, dy] of [[-.5, 1.8], [0, 2.5], [2, 1], [-1, 2], [0, 2], [2, 0]]) { const x = s.x + dx, y = s.y + dy; if (!G.world.isBlocked(x, y)) { best = [x, y]; break; } } if (best) { G.player.x = best[0]; G.player.y = best[1]; } G.snapCam(); return { label: it.label, navTo: it.navTo, spot: [s.x, s.y] }; });
  say(!!dr && dr.navTo === 'int:' + wcId, v + ': Restroom door present, leads to the restroom room (' + JSON.stringify(dr) + ')');
  await pg.waitForTimeout(600); await shot(v + '_0_door');
  await tapIt(/^Restroom$/);
  const inWc = await waitFor(id => G.scene && G.scene.id === id, 'int:' + wcId);
  say(inWc, v + ': tapped the door, walked there and went in -> ' + (await st()).scene + (inWc ? '' : ' ' + await dbg()));
  if (!inWc) return;
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
    await tapIt(EXIT); await waitFor(id => G.scene.id === id, 'int:' + v, 15000); const tt = (await toasts()).join(' | ');
    say(/without washing/i.test(tt), v + ': left unwashed -> nudge: ' + tt.slice(0, 160));
    await pg.waitForTimeout(800); await tapIt(/^Restroom$/); await waitFor(id => G.scene.id === id, 'int:' + wcId, 15000); await pg.waitForTimeout(800);
  }
  const h0 = (await st()).hygiene;
  await tapIt(/^Wash hands$/, 300); const washing = await waitFor(() => !!G.busy, null, 12000); await pg.waitForTimeout(300); await shot(v + '_3_wash');
  await waitFor(() => !G.busy, null, 15000); const h1 = (await st()).hygiene;
  say(washing && h1 > h0, v + `: Wash hands: hygiene ${h0} -> ${h1}`);
  // no need: bladder full
  await pg.evaluate(() => G.needs.set('bladder', 100)); await tapIt(/^Toilet$/, 300); await waitFor(() => [...document.querySelectorAll('#toasts > *')].some(e => /do not need/i.test(e.textContent)), null, 12000);
  const nn = await st(), nt = (await toasts()).join(' | '); say(!nn.busy && /do not need/i.test(nt), v + ': bladder full -> no visit: ' + nt.slice(-80) + (/do not need/i.test(nt) ? '' : ' ' + await dbg()));
  // out
  await tapIt(EXIT); const back = await waitFor(id => G.scene.id === id, 'int:' + v, 15000); await pg.waitForTimeout(700); const tt2 = (await toasts()).join(" | ");
  const at = await st(); const d = await pg.evaluate(a => Math.min(...G.interactables().filter(i => i.restroom).map(i => { const s = i.spot || i; return Math.hypot(a.x - s.x, a.y - s.y); })), at);   // the door used (a room can have two) const tt2 = (await toasts()).join(' | ');
  say(back && d < .9, v + `: way out -> ${at.scene} at (${at.x}, ${at.y}), ${d.toFixed(2)} from the door spot`); say(!/without washing/i.test(tt2) || v === 'diner', v + ': no nudge after washing');
  await shot(v + '_4_back');
  // night
  await pg.evaluate(() => { G.state.t = Math.floor(G.state.t / 1440) * 1440 + 22 * 60 + 30; }); await tapIt(/^Restroom$/); await waitFor(id => G.scene.id === id, 'int:' + wcId, 15000);
  await pg.waitForTimeout(1500); await closeUi(); await shot(v + '_5_room_night');
  await pg.evaluate(() => G.needs.set('bladder', 25)); await tapIt(/^Toilet$/, 300); await waitFor(() => !!G.busy, null, 12000); await pg.waitForTimeout(400); await shot(v + '_6_inuse_night'); await waitFor(() => !G.busy, null, 20000);
  await tapIt(EXIT); await waitFor(id => G.scene.id === id, 'int:' + v, 15000); await pg.waitForTimeout(500);
}
for (const [v, door, hour] of VENUES) { try { await venueRun(v, door, hour); } catch (e) { say(false, v + ': the script stopped here: ' + e.message.split('\n')[0] + ' ' + await dbg().catch(() => '')); await closeUi().catch(() => {}); } }

// batch 4: the park pavilion's public restroom, reached from the city
if (!o.only || o.only.split(',').includes('park')) {
  console.log('--- park');
  await pg.evaluate(() => { G.state.t = Math.floor(G.state.t / 1440) * 1440 + 13 * 60; G.needs.set('bladder', 18); G.needs.set('hygiene', 50); for (const k of ['hunger', 'energy', 'fun', 'social']) G.needs.set(k, 90); const p = G.bladder.parkRestrooms()[0]; return G.go('city', { x: p.x, y: p.y + 1.5 }); }); await pg.waitForTimeout(2000); await closeUi();
  const pk = await pg.evaluate(() => { const its = G.interactables().filter(i => /^Public restroom$/.test(i.label || '')); return { n: its.length, wc: its.map(i => i.wc) }; });
  say(pk.n > 0 && pk.wc.every(w => w === 'park:wc'), 'park: the pavilion doors lead to the park restroom ' + JSON.stringify(pk)); await shot('park_0_door');
  const from = await st(); await tapIt(/^Public restroom$/); const inP = await waitFor(() => G.scene.id === 'int:park:wc', null, 20000); await pg.waitForTimeout(1000); await closeUi(); await shot('park_1_room_day');
  say(inP, 'park: tapped the pavilion door -> ' + (await st()).scene);
  if (inP) {
    const b0 = await st(); await tapIt(/^Toilet$/, 300); const sat = await waitFor(() => !!G.busy, null, 15000); await pg.waitForTimeout(400); await shot('park_2_inuse'); await waitFor(() => !G.busy, null, 20000); const b1 = await st();
    say(sat && b0.bladder < 30 && b1.bladder >= 99, `park: toilet, bladder ${b0.bladder} -> ${b1.bladder}`);
    await tapIt(/^Wash hands$/, 300); await waitFor(() => !!G.busy, null, 12000); await waitFor(() => !G.busy, null, 15000); const h1 = (await st()).hygiene; say(h1 > 50, 'park: washed, hygiene ' + h1);
    await tapIt(/^Have a look$|^The notice$/, 300); await pg.waitForTimeout(600); const said = await pg.evaluate(() => (document.querySelector('.say') || {}).textContent || ''); say(/WATER|pine/i.test(said), 'park: the notice reads: ' + said.slice(0, 90)); await closeUi();
    await tapIt(EXIT); const outP = await waitFor(() => G.scene.id === 'city', null, 20000); await pg.waitForTimeout(800); const at = await st();
    const dd = await pg.evaluate(a => Math.min(...G.interactables().filter(i => i.restroom).map(i => { const s = i.spot || i; return Math.hypot(a.x - s.x, a.y - s.y); })), at);
    say(outP && dd < 1.2, `park: way out -> ${at.scene} at (${at.x}, ${at.y}), ${dd.toFixed(2)} from the pavilion door`); await shot('park_4_back');
    await pg.evaluate(() => { G.state.t = Math.floor(G.state.t / 1440) * 1440 + 22 * 60 + 30; }); await tapIt(/^Public restroom$/); await waitFor(() => G.scene.id === 'int:park:wc', null, 15000); await pg.waitForTimeout(1500); await closeUi(); await shot('park_5_room_night');
    await tapIt(EXIT); await waitFor(() => G.scene.id === 'city', null, 15000);
  }
}

// the need chooser's guide: from inside the diner the arrow points at the Restroom door, inside at a stall, and the goal ends on the seat
if (!o.only || o.only.includes('diner')) {
  console.log('--- guide');
  await pg.evaluate(() => { G.state.t = Math.floor(G.state.t / 1440) * 1440 + 13 * 60; G.state.flags.lastDoor = 'door:diner'; G.needs.set('bladder', 15); return G.go('int:diner'); }); await pg.waitForTimeout(1200);
  const g = await pg.evaluate(() => { const p = G.places && G.places.get('diner'); G.navGoals.select({ need: 'bladder', place: 'diner' }); if (G.phone && G.phone.setWaypoint) { try { G.phone.setWaypoint({ id: 'diner', x: p.x, y: p.y, name: p.name }); } catch (e) { } } else G.state.phone.waypoint = { id: 'diner', x: p.x, y: p.y, name: p.name }; return true; });
  await pg.evaluate(() => { const it = G.interactables().find(i => i.restroom), s = it.spot; G.player.x = s.x - .5; G.player.y = s.y + 1.8; G.snapCam(); });
  await pg.waitForTimeout(1500); const c1 = await pg.evaluate(() => { const c = G.navGoals.current(); return c && { id: c.id, room: c.step.room, label: c.step.label }; });
  say(c1 && c1.id === 'wc' && c1.room === 'diner', 'guide in the diner: ' + JSON.stringify(c1)); await shot('guide_1_venue');
  await tapIt(/^Restroom$/); const gin = await waitFor(() => G.scene.id === 'int:diner:wc', null, 15000); if (!gin) console.log('  guide: door tap did not take me in ' + await dbg()); await pg.waitForTimeout(1500);
  const c2 = await pg.evaluate(() => { const c = G.navGoals.current(); return c && { id: c.id, room: c.step.room, label: c.step.label }; });
  say(c2 && c2.id === 'wc' && c2.room === 'diner:wc', 'guide in the restroom: ' + JSON.stringify(c2)); await shot('guide_2_room');
  await tapIt(/^Toilet$/, 300); await waitFor(() => !!G.busy, null, 12000); await pg.waitForTimeout(800);
  const c3 = await pg.evaluate(() => G.navGoals.current()); say(!c3 || c3.id !== 'wc', 'guide ends on the seat: ' + JSON.stringify(c3 && c3.id));
  await waitFor(() => !G.busy, null, 20000);
}

// Stop in the middle of a toilet visit, then save + reload while standing inside a restroom
if (!o.only || o.only.includes('library')) {
  console.log('--- stop + reload');
  await pg.evaluate(() => { G.state.t = Math.floor(G.state.t / 1440) * 1440 + 14 * 60; G.state.flags.lastDoor = 'door:library'; G.needs.set('bladder', 10); return G.go('int:library'); }); await pg.waitForTimeout(1200); await closeUi();
  await pg.evaluate(() => { const it = G.interactables().find(i => i.restroom), s = it.spot; G.player.x = s.x + 1.5; G.player.y = s.y + 1; G.snapCam(); });
  await tapIt(/^Restroom$/); const inL = await waitFor(() => G.scene.id === 'int:library:wc', null, 15000); await pg.waitForTimeout(800);
  await tapIt(/^Toilet$/, 300); await waitFor(() => !!G.busy, null, 12000); await pg.waitForTimeout(700);
  const sb = await find(/^Stop$/); if (sb) await tap(sb[0], sb[1], 600); await waitFor(() => !G.busy, null, 8000);
  const ss = await st(), so = await pg.evaluate(() => !G.scene.fixtures.some(f => f.tags.includes('wcstall') && f.ob.p.occ));
  say(inL && !!sb && !ss.busy && !ss.hidden && so && ss.bladder > 10 && ss.bladder < 99, `Stop during a visit: stopped, visible, stall open, bladder part-filled (${ss.bladder})`); await shot('stop');
  await pg.evaluate(() => G.save()); const before = await st();
  await pg.reload(); await pg.waitForFunction(() => window.G && G.onTitle !== undefined && !document.getElementById('load'), null, { timeout: 180000 }); await pg.waitForTimeout(800);
  await tapText(/^Continue$/, 'button', 3000); await pg.waitForFunction(() => G.scene && G.player, null, { timeout: 60000 }); await pg.waitForTimeout(1500);
  await pg.evaluate(() => { try { G.state.tips.off = 1; } catch (e) { } try { G.firstTime.setEnabled(false); } catch (e) { } }); await closeUi();
  const after = await st(); say(before.scene === 'int:library:wc' && /^(city|int:library)$/.test(after.scene) && !after.hidden && !!(await pg.evaluate(() => G.state.restrooms && G.state.restrooms.visits)), `save inside the library restroom + reload -> ${after.scene} (${after.x}, ${after.y}), visible`); await shot('reload');
}

// a home bathroom still works
console.log('--- home');
const hb = await pg.evaluate(async () => { const h = G.housing.current(); await G.go('int:home:' + h.id, { fresh: true }); await new Promise(r => setTimeout(r, 1000)); return { scene: G.scene.id, door: !!G.interactables().find(i => /^Bathroom$/.test(i.label)) }; });
say(hb.door, 'home: ' + JSON.stringify(hb));
if (hb.door) {
  await pg.evaluate(() => { G.needs.set('bladder', 20); const it = G.interactables().find(i => /^Bathroom$/.test(i.label)); const s = it.spot || it; G.player.x = s.x; G.player.y = s.y + 1.5; G.snapCam(); }); await pg.waitForTimeout(500);
  await tapIt(/^Bathroom$/); const ok = await waitFor(() => /:bath$/.test(G.scene.id), null, 15000); if (!ok) console.log('  home: bathroom door tap ' + await dbg()); await pg.waitForTimeout(800);
  await tapIt(/^Toilet$/, 300); await waitFor(() => !!G.busy, null, 12000); await shot('home_inuse'); await waitFor(() => !G.busy, null, 20000);
  const hs = await st(); say(ok && hs.bladder >= 99, 'home bathroom: in, toilet -> bladder ' + hs.bladder);
}

console.log(errs.length ? errs.length + ' page errors:\n' + errs.slice(0, 12).join('\n') : 'no page errors'); console.log(bad ? bad + ' FAILED' : 'all passed');
await br.close(); srv.close(); process.exit(bad || errs.length ? 1 : 0);
