// Alarm picker check: touch only for the UI; game state set up with G (time, energy, job, hotel stay).
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module';
const ROOT = '/home/user/Pixel-city-2'; const require = createRequire(ROOT + '/'); const { chromium } = require('playwright');
const HTML = fs.readFileSync(path.join(ROOT, 'dist/index.html'), 'utf8'), BASE = fs.readFileSync(path.join(ROOT, 'tools/perf_save.json'), 'utf8');
const OUT = path.join(ROOT, 'out/shots'); fs.mkdirSync(OUT, { recursive: true });
const srv = http.createServer((q, r) => { r.writeHead(200, { 'content-type': 'text/html' }); r.end(HTML); }); await new Promise(r => srv.listen(0, r)); const U = `http://localhost:${srv.address().port}/`;
const br = await chromium.launch(); let bad = 0; const say = (ok, t) => { if (!ok) bad++; console.log((ok ? 'PASS ' : 'FAIL ') + t); };
async function open(w, h, save) {
  const ctx = await br.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, hasTouch: true, isMobile: true }), pg = await ctx.newPage(), errs = [];
  pg.on('pageerror', e => errs.push(e.message.slice(0, 200))); pg.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); });
  await pg.goto(U); await pg.evaluate(s => localStorage.setItem('maplebay.save.v1', s), save); await pg.goto(U);
  await pg.waitForFunction(() => window.G && G.onTitle !== undefined && !document.getElementById('load'), null, { timeout: 180000 }); await pg.waitForTimeout(800);
  await pg.touchscreen.tap(w / 2, 440); await pg.waitForFunction(() => !G.onTitle && G.scene, null, { timeout: 60000 }); await pg.waitForTimeout(2000);
  await pg.evaluate(() => { try { G.state.tips.off = 1; } catch (e) { } try { G.firstTime.setEnabled(false); } catch (e) { } });
  const tap = async (x, y) => { await pg.touchscreen.tap(x, y); await pg.waitForTimeout(350); };
  const tapText = async (re, sc = 'button') => { const r = await pg.evaluate(([s, sc]) => { const x = new RegExp(s, 'i'), e = [...document.querySelectorAll(sc)].find(b => b.offsetWidth && x.test((b.getAttribute('aria-label') || b.textContent || '').trim())); if (!e) return null; const q = e.getBoundingClientRect(); return [q.left + q.width / 2, q.top + q.height / 2, !!e.disabled]; }, [re.source, sc]); if (!r) throw new Error('no button ' + re); await tap(r[0], r[1]); return r; };
  const tapThing = async re => { for (let k = 0; k < 14; k++) { if (await pg.evaluate(() => !!document.querySelector('.modal .win'))) return true; await pg.waitForFunction(() => !G.busy, null, { timeout: 30000 }).catch(() => {}); const c = await pg.evaluate(s => { const x = new RegExp(s), it = G.interactables().filter(i => x.test(i.label)).sort((a, b) => Math.hypot(a.x - G.player.x, a.y - G.player.y) - Math.hypot(b.x - G.player.x, b.y - G.player.y))[0]; if (!it) return null; const p = G.toScreen(it.x, it.y, (it.z || 0) + .3), r = G.cv.getBoundingClientRect(); return [p.x + r.left, p.y + r.top]; }, re.source); if (!c) throw new Error('no thing ' + re); const vw = pg.viewportSize(), cx = Math.max(50, Math.min(vw.width - 50, c[0])), cy = Math.max(300, Math.min(vw.height - 220, c[1])); if (cx !== c[0] || cy !== c[1]) { await tap(cx, cy); await pg.waitForFunction(() => !!document.querySelector('.modal .win'), null, { timeout: 4000 }).catch(() => {}); await pg.waitForTimeout(300); if (await pg.evaluate(() => !!document.querySelector('.modal .win'))) return true; continue; } await tap(c[0], c[1]); await pg.waitForFunction(() => !!document.querySelector('.modal .win'), null, { timeout: 7000 }).catch(() => {}); await pg.waitForTimeout(400); if (await pg.evaluate(() => !!document.querySelector('.modal .win'))) return true; } return false; };
  const opts = () => pg.evaluate(() => [...document.querySelectorAll('.modal .opt')].map(b => b.textContent.trim() + (b.disabled ? ' [off]' : '')));
  const shot = n => pg.screenshot({ path: path.join(OUT, 'alarm_' + n + '.png') });
  const picker = () => pg.evaluate(() => { const w = document.querySelector('.alarm-win'); return w && { nums: [...w.querySelectorAll('.al-num')].map(e => e.textContent).join(':'), line: w.querySelector('.al-line').textContent, warn: w.querySelector('.al-warn').style.display === 'none' ? '' : w.querySelector('.al-warn').textContent }; });
  const setTo = async (hh, mm) => { for (let i = 0; i < 30; i++) { const p = await picker(), [h, m] = p.nums.split(':').map(Number); if (h === hh) break; await tapText(h > hh ? /^One hour earlier/ : /^One hour later/); } for (let i = 0; i < 14; i++) { const p = await picker(), [, m] = p.nums.split(':').map(Number); if (m === mm) break; await tapText(m > mm ? /^Five minutes earlier/ : /^Five minutes later/); } };
  const sleepThrough = async () => { await pg.waitForFunction(() => !G.busy, null, { timeout: 120000 }); await pg.waitForTimeout(800); return pg.evaluate(() => ({ clock: G.now().clock, hf: G.now().hf, wake: (document.querySelector('.wake-clock b') || {}).textContent || null })); };
  return { ctx, pg, errs, tap, tapText, tapThing, opts, shot, picker, setTo, sleepThrough };
}
const night = (h, energy) => `(()=>{ const d = Math.floor(G.state.t / 1440) + 1; G.state.t = d * 1440 + ${h} * 60; G.needs.add('energy', ${energy} - G.needs.get('energy')); G.needs.add('hunger', 100); G.needs.add('bladder', 100); return G.now().clock; })()`;

for (const [W, H] of [[390, 844], [375, 812]]) {
  const tag = W + 'x' + H; console.log('--- ' + tag);
  /* 1. home bed, no job: 22:10, alarm 05:35 */
  const A = await open(W, H, BASE);
  console.log('scene', await A.pg.evaluate(() => G.scene.id), 'clock', await A.pg.evaluate(night(22 + 10 / 60, 35)));
  say(await A.tapThing(/^Bed$/), tag + ' bed menu opens by a tap on the bed'); const o1 = await A.opts(); console.log(o1.join('\n   ')); await A.shot('menu_' + tag);
  say(/^Set the alarm/.test(o1[o1.length - 1]) && /^Sleep until morning/.test(o1[0]), tag + ' "Set the alarm…" is the last row, existing rows first');
  await A.tapText(/^Set the alarm/); let p = await A.picker(); console.log('picker start', JSON.stringify(p)); await A.shot('picker_start_' + tag);
  await A.setTo(5, 35); p = await A.picker(); console.log('picker set', JSON.stringify(p)); await A.shot('picker_0535_' + tag);
  say(p.nums === '05:35' && /^Wake at 05:35 · sleeps \d+ h \d+ min$/.test(p.line), tag + ' picker reads 05:35 / 7 h 25 min');
  await A.tapText(/^Sleep$/); const w1 = await A.sleepThrough(); console.log('woke', JSON.stringify(w1)); await A.shot('wake_0535_' + tag);
  say(w1.clock === '05:35' || w1.wake === '05:35', tag + ' woke at 05:35 on the game clock (' + w1.clock + ')');
  /* limits: from 21:00 try to go below 30 min and above 14 h */
  if (W === 390) {
    await A.pg.evaluate(() => { const m = document.querySelector('.modal'); if (m) m.querySelector('.win-head .x').click(); }); await A.pg.waitForTimeout(400);
    await A.pg.evaluate(night(21, 30)); await A.tapThing(/^Bed$/); await A.tapText(/^Set the alarm/);
    for (let i = 0; i < 24; i++) { if (await A.pg.evaluate(() => document.querySelector('[aria-label="Five minutes earlier"]').disabled)) break; await A.tapText(/^One hour earlier/); } p = await A.picker(); console.log('now', await A.pg.evaluate(() => G.now().clock)); const lo = await A.pg.evaluate(() => document.querySelector('[aria-label="Five minutes earlier"]').disabled); console.log('min', JSON.stringify(p), 'minus disabled', lo);
    say(lo && /sleeps (30|31|32|33|34|35) min/.test(p.line), 'lower limit 30 min'); await A.shot('picker_min');
    for (let i = 0; i < 24; i++) { if (await A.pg.evaluate(() => document.querySelector('[aria-label="One hour later"]').disabled)) break; await A.tapText(/^One hour later/); } p = await A.picker(); const hi = await A.pg.evaluate(() => document.querySelector('[aria-label="One hour later"]').disabled); console.log('max', JSON.stringify(p), 'plus disabled', hi);
    say(hi && /sleeps 1[34] h/.test(p.line), 'upper limit 14 h'); await A.shot('picker_limit');
    await A.tapText(/^Not yet$/);
  }
  /* 2. save / reload remembers 05:35 */
  const save = await A.pg.evaluate(() => G.save()); await A.ctx.close();
  const B = await open(W, H, save); await B.pg.evaluate(night(21, 40)); await B.tapThing(/^Bed$/); await B.tapText(/^Set the alarm/); p = await B.picker(); console.log('after reload', JSON.stringify(p)); await B.shot('reload_' + tag);
  say(p.nums === '05:35', tag + ' after save + reload the picker starts at 05:35');
  await B.tapText(/^Not yet$/);
  /* 3. a job that starts at 07:00: the note on "until morning" and in the picker */
  const hired = await B.pg.evaluate(() => { const r = G.jobs.apply('barista'); return [!!r, G.jobs.current() && G.jobs.current().nextShift]; });
  const shiftT = hired[1], sd = Math.floor(shiftT / 1440); await B.pg.evaluate(`(()=>{ G.state.t = ${sd} * 1440 - 150; G.needs.add('energy', 40 - G.needs.get('energy')); })()`);
  console.log('hired', hired, 'now', await B.pg.evaluate(() => G.now().clock), 'shift', await B.pg.evaluate(() => { const t = G.jobs.current().nextShift; return Math.floor(t % 1440 / 60) + ':' + t % 60; }));
  await B.pg.waitForTimeout(1500); await B.pg.evaluate(() => { document.querySelectorAll('.modal .win-head .x').forEach(x => x.click()); }); await B.pg.waitForTimeout(300);
  await B.tapThing(/^Bed$/); const o3 = await B.opts(); console.log(o3.join('\n   ')); await B.shot('job_menu_' + tag);
  say(/your shift starts at 07:00/.test(o3[0]), tag + ' "until morning" says your shift starts at 07:00');
  await B.tapText(/^Set the alarm/); await B.setTo(7, 30); p = await B.picker(); console.log('job picker', JSON.stringify(p)); await B.shot('job_picker_' + tag);
  say(/^Your shift starts at 07:00$/.test(p.warn), tag + ' picker line "Your shift starts at 07:00" at 07:30');
  await B.setTo(5, 0); p = await B.picker(); console.log('job picker 05:00', JSON.stringify(p)); say(!p.warn, tag + ' no line at 05:00 (2 h before)');
  await B.tapText(/^Not yet$/); await B.pg.waitForTimeout(500); console.log('after not yet', await B.pg.evaluate(() => JSON.stringify({ busy: G.busy && G.busy.label, clock: G.now().clock, modal: G.modal }))); await B.shot('dbg_notyet');
  /* planner appointment */
  await B.pg.evaluate(() => { G.jobs.quit(); const d = Math.floor(G.state.t / 1440) + 1; G.planner.add({ title: 'Dentist', t: d * 1440 + 7 * 60 + 30, dur: 60 }); });
  console.log('modal before appt', await B.pg.evaluate(() => [...document.querySelectorAll('.modal .win-title')].map(e => e.textContent))); await B.pg.evaluate(() => { document.querySelectorAll('.modal .win-head .x').forEach(x => x.click()); }); await B.pg.waitForTimeout(400); await B.tapThing(/^Bed$/); const o4 = await B.opts(); if (!o4.length) { await B.shot('dbg_appt'); console.log(await B.pg.evaluate(() => JSON.stringify({ busy: G.busy && G.busy.label, pl: [G.player.x, G.player.y], sc: G.scene.id, clock: G.now().clock }))); } console.log(o4[0]); say(/Dentist starts at 07:30/.test(o4[0]), tag + ' appointment note on "until morning"'); await B.tapText(/^Set the alarm/); await B.setTo(7, 15); p = await B.picker(); console.log('appt picker', JSON.stringify(p)); say(/Dentist starts at 07:30/.test(p.warn), tag + ' appointment line in the picker'); await B.shot('appt_picker_' + tag); await B.tapText(/^Not yet$/);
  /* 4. hotel bed */
  const ok = await B.pg.evaluate(async () => { G.money.add(2000, 'test'); G.state.t = Math.floor(G.state.t / 1440) * 1440 + 22 * 60; const b = G.hotel.book(G.hotel.tiers[0].id); G.hotel.enterRoom(); await new Promise(r => setTimeout(r, 2500)); G.needs.add('energy', 40 - G.needs.get('energy')); G.needs.add('hunger', 100); G.needs.add('bladder', 100); return [b, G.scene.id, G.now().clock]; });
  console.log('hotel', ok); await B.pg.evaluate(() => { document.querySelectorAll('.modal .win-head .x').forEach(x => x.click()); });
  say(await B.tapThing(/^The bed$/), tag + ' hotel bed menu opens'); const o5 = await B.opts(); console.log(o5.join('\n   ')); await B.shot('hotel_menu_' + tag);
  say(o5.some(o => /^Set the alarm/.test(o)), tag + ' hotel bed has "Set the alarm…"');
  await B.tapText(/^Set the alarm/); p = await B.picker(); console.log('hotel picker start', JSON.stringify(p)); await B.setTo(6, 20); await B.shot('hotel_picker_' + tag);
  await B.tapText(/^Sleep$/); const w5 = await B.sleepThrough(); console.log('hotel woke', JSON.stringify(w5)); await B.shot('hotel_wake_' + tag);
  say(w5.clock === '06:20', tag + ' hotel: woke at 06:20 (' + w5.clock + ')');
  say(!A.errs.length && !B.errs.length, tag + ' page errors: ' + [...A.errs, ...B.errs].slice(0, 4).join(' | '));
  await B.ctx.close();
}
await br.close(); srv.close(); console.log(bad ? bad + ' FAILED' : 'all passed'); process.exitCode = bad ? 1 : 0;
