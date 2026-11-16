// Mini-games B check (owner msgs 163-164): the chore / venue games of src/sim/_mg_games.js on the BUILT game, 390x844 touch (the open / touch helpers are the ones of minigames_check.mjs).
//   node tools/minigames_b_check.mjs [walk | home | town | rules | pad | intro | explore]     (no argument = everything but explore)
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module';
import { openGame } from './pad_lib.mjs';
const ROOT = '/home/user/Pixel-city-2'; const require = createRequire(ROOT + '/'); const { chromium } = require('playwright');
const HTML = fs.readFileSync(path.join(ROOT, 'dist/index.html'), 'utf8'), BASE = fs.readFileSync(path.join(ROOT, 'tools/perf_save.json'), 'utf8');
const OUT = path.join(ROOT, 'out/shots'); fs.mkdirSync(OUT, { recursive: true });
const srv = http.createServer((q, r) => { r.writeHead(200, { 'content-type': 'text/html' }); r.end(HTML); }); await new Promise(r => srv.listen(0, r)); const U = `http://localhost:${srv.address().port}/`;
const br = await chromium.launch(); let bad = 0; const say = (ok, t) => { if (!ok) bad++; console.log((ok ? 'PASS ' : 'FAIL ') + t); };
const want = process.argv[2] || 'all', on = k => want === 'all' || want === k;

async function open(w = 390, h = 844) {
  const ctx = await br.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, hasTouch: true, isMobile: true }), pg = await ctx.newPage(), errs = [];
  pg.on('pageerror', e => errs.push(e.message.slice(0, 300))); pg.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 300)); });
  await pg.goto(U); await pg.evaluate(s => localStorage.setItem('maplebay.save.v1', s), BASE); await pg.goto(U);
  await pg.waitForFunction(() => window.G && G.onTitle !== undefined && !document.getElementById('load'), null, { timeout: 180000 }); await pg.waitForTimeout(800);
  await pg.touchscreen.tap(w / 2, 440); await pg.waitForFunction(() => !G.onTitle && G.scene, null, { timeout: 60000 }); await pg.waitForTimeout(2000);
  await pg.evaluate(() => { try { G.state.tips.off = 1; } catch (e) { } try { G.firstTime.setEnabled(false); } catch (e) { } try { G.dev.set(true); G.dev.freeze && G.dev.freeze(true); } catch (e) { } G.state.t = Math.floor(G.state.t / 1440) * 1440 + 10 * 60; });
  const cdp = await ctx.newCDPSession(pg);
  const tap = async (x, y, ms = 350) => { await pg.touchscreen.tap(x, y); await pg.waitForTimeout(ms); };
  const touch = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] });
  const tapText = async (re, sc = 'button') => { const r = await pg.evaluate(([s, sc]) => { const x = new RegExp(s, 'i'), e = [...document.querySelectorAll(sc)].find(b => b.offsetWidth && x.test((b.getAttribute('aria-label') || b.textContent || '').trim())); if (!e) return null; e.scrollIntoView({ block: 'center' }); const q = e.getBoundingClientRect(); return [q.left + q.width / 2, q.top + q.height / 2]; }, [re.source, sc]); if (!r) throw new Error('no button ' + re); await pg.waitForTimeout(150); const r2 = await pg.evaluate(([s, sc]) => { const x = new RegExp(s, 'i'), e = [...document.querySelectorAll(sc)].find(b => b.offsetWidth && x.test((b.getAttribute('aria-label') || b.textContent || '').trim())); const q = e.getBoundingClientRect(); return [q.left + q.width / 2, q.top + q.height / 2]; }, [re.source, sc]); await tap(r2[0], r2[1]); };
  /** walk up to a fixture (matched by its interactable label or a predicate on the fixture) and tap it until a menu opens */
  const tapThing = async (find, dz) => {
    for (let k = 0; k < 16; k++) {
      if (await pg.evaluate(() => !!document.querySelector('.modal .win'))) return true;
      await pg.waitForFunction(() => !G.busy, null, { timeout: 30000 }).catch(() => {});
      const c = await pg.evaluate(([f, dz]) => { const fn = new Function('i', 'return ' + f), it = G.interactables().filter(i => { try { return fn(i); } catch (e) { return false; } }).sort((a, b) => Math.hypot(a.x - G.player.x, a.y - G.player.y) - Math.hypot(b.x - G.player.x, b.y - G.player.y))[0]; if (!it) return null; const p = G.toScreen(it.x, it.y, (it.z || 0) + (dz === undefined || dz === null ? (it.h || .6) * .5 : dz)), r = G.cv.getBoundingClientRect(); return [p.x + r.left, p.y + r.top]; }, [find, dz]);
      if (!c) throw new Error('no thing ' + find);
      const vw = pg.viewportSize(), cx = Math.max(40, Math.min(vw.width - 40, c[0])), cy = Math.max(170, Math.min(vw.height - 150, c[1]));
      await tap(cx, cy, 500); await pg.waitForFunction(() => !!document.querySelector('.modal .win') || !G.player.moving, null, { timeout: 15000 }).catch(() => {}); await pg.waitForTimeout(500);
    }
    return pg.evaluate(() => !!document.querySelector('.modal .win'));
  };
  const mg = () => pg.evaluate(() => { const m = G.minigame.MG.cur; if (!m) return null; const s = m.state(), w = s.want || {}, p = m.toClient(w.x === undefined ? 90 : w.x, w.y === undefined ? 55 : w.y), pts = w.pts ? w.pts.map(q => { const c = m.toClient(q[0], q[1]); return [c.x, c.y]; }) : null; return { kind: m.kind, title: m.def.title, t: s.t, done: s.done, counting: s.counting, type: w.type, ready: !!w.ready, on: !!w.on, x: p.x, y: p.y, i: w.i, pts }; });
  /** play the open kit game with real touches, following the game's own hint (want()); returns when the sheet has closed. shotAt = seconds into the game for the screenshot */
  const playTouch = async (name, shotAt = 3.5, style = 'good') => {
    let held = false, shot = false, t0 = Date.now(), kind = null, title = null, angle = 0;
    while (Date.now() - t0 < 70000) {
      const s = await mg(); if (!s) break; kind = s.kind; title = s.title;
      if (!shot && s.t >= shotAt) { shot = true; if (name) await pg.screenshot({ path: path.join(OUT, name + '.png') }); }
      if (s.done || s.counting) { if (held) { held = false; await touch('touchEnd'); } await pg.waitForTimeout(60); continue; }
      if (kind === 'stir' && style !== 'keys') {            // a finger drawing circles round the pot at about 0.8 turns a second
        const c = await pg.evaluate(() => { const m = G.minigame.MG.cur; return m ? [m.toClient(90, 50), m.toClient(112, 50)] : null; }); if (!c) break; const r = c[1].x - c[0].x;
        if (!held) { held = true; await touch('touchStart', c[0].x + r, c[0].y); }
        for (let k = 0; k < 6; k++) { angle += s.on ? .45 : .2; await touch('touchMove', c[0].x + Math.cos(angle) * r, c[0].y + Math.sin(angle) * r); await pg.waitForTimeout(16); }
        continue;
      }
      if (s.type === 'hold') { if (s.on && !held) { held = true; await touch('touchStart', s.x, s.y); } else if (!s.on && held) { held = false; await touch('touchEnd'); } await pg.waitForTimeout(12); }
      else if (s.type === 'bin') { if (s.ready) { const b = await pg.evaluate(i => { const e = document.querySelectorAll('.mg-bin')[i]; if (!e) return null; const q = e.getBoundingClientRect(); return [q.left + q.width / 2, q.top + q.height / 2]; }, s.i); if (b) await tap(b[0], b[1], 120); } else await pg.waitForTimeout(40); }
      else if (s.type === 'drag') { if (s.ready && s.pts && s.pts.length) { await touch('touchStart', s.pts[0][0], s.pts[0][1]); for (const q of s.pts) { await touch('touchMove', q[0], q[1]); await pg.waitForTimeout(14); } await touch('touchEnd'); } await pg.waitForTimeout(60); }
      else { if (s.ready) { await pg.touchscreen.tap(s.x, s.y); await pg.waitForTimeout(kind === 'cadence' ? 150 : 40); } else await pg.waitForTimeout(10); }
    }
    if (held) await touch('touchEnd');
    return { kind, title };
  };
  const shot = n => pg.screenshot({ path: path.join(OUT, n + '.png') });
  const closeAll = async () => { for (let k = 0; k < 6; k++) { const has = await pg.evaluate(() => { const b = [...document.querySelectorAll('.modal .opt, .modal button')].find(e => e.offsetWidth && /^(Save it for later|Pack it up|Close|OK|Not now|Later|x|×)$/i.test((e.querySelector('.opt-l') || e).textContent.trim())); if (!b) return null; const q = b.getBoundingClientRect(); return [q.left + q.width / 2, q.top + q.height / 2]; }); if (!has) break; await tap(has[0], has[1], 500); } };
  return { ctx, pg, errs, tap, touch, tapText, tapThing, mg, playTouch, shot, closeAll, w, h };
}

/* PARTS */
const on2 = k => (want === 'all' && k !== 'explore') || want === k;
const sleep = ms => new Promise(r => setTimeout(r, ms));
/** tap a thing in the world until a menu, a game or an activity is there. `expect` = a regexp the menu must contain: another thing's menu (something stands in front) is closed and
 *  the tap is tried at other heights; after that the thing is used through G.useInteractable and the result says so (how = 'script'). */
async function tapOpen(A, find, dz, expect) {
  const pg = A.pg, there = () => pg.evaluate(() => !!document.querySelector('.modal .win') || !!G.minigame.MG.cur || !!G.busy);
  const right = () => pg.evaluate(src => { const w = document.querySelector('.modal .win'); return !w || !src || new RegExp(src, 'i').test(w.textContent); }, expect ? expect.source : null);
  const closeWin = async () => { const c = await pg.evaluate(() => { const b = document.querySelector('.modal .win .x, .modal .win button'); if (!b) return null; const q = b.getBoundingClientRect(); return [q.left + q.width / 2, q.top + q.height / 2]; }); if (c) await A.tap(c[0], c[1], 500); await pg.evaluate(() => { const w = document.querySelector('.modal .win'); if (w) { const b = [...w.querySelectorAll('button')].find(e => /^(x|×|Close|Never mind|Not now)$/i.test(e.textContent.trim())); if (b) b.click(); } }); await pg.waitForTimeout(400); };
  const dzs = [dz, dz, .15, .95, .5, dz]; let wrong = 0;
  for (let k = 0; k < 14 && wrong < 5; k++) {
    if (await there()) { if (await right()) return 'touch'; wrong++; await closeWin(); continue; }
    const c = await pg.evaluate(([f, dz]) => { const fn = new Function('i', 'return ' + f), it = G.interactables().filter(i => { try { return fn(i); } catch (e) { return false; } }).sort((a, b) => Math.hypot(a.x - G.player.x, a.y - G.player.y) - Math.hypot(b.x - G.player.x, b.y - G.player.y))[0]; if (!it) return null; const p = G.toScreen(it.x, it.y, (it.z || 0) + (dz === undefined || dz === null ? (it.h || .6) * .5 : dz)), r = G.cv.getBoundingClientRect(); return [p.x + r.left, p.y + r.top]; }, [find, dzs[Math.min(wrong, dzs.length - 1)]]);
    if (!c) throw new Error('no thing ' + find);
    const vw = pg.viewportSize(); await A.tap(Math.max(40, Math.min(vw.width - 40, c[0])), Math.max(170, Math.min(vw.height - 150, c[1])), 500);
    await pg.waitForFunction(() => !!document.querySelector('.modal .win') || !!G.minigame.MG.cur || !!G.busy || !G.player.moving, null, { timeout: 15000 }).catch(() => {}); await pg.waitForTimeout(500);
  }
  if (await there() && await right()) return 'touch';
  await closeWin(); await pg.evaluate(f => { const fn = new Function('i', 'return ' + f), it = G.interactables().filter(i => { try { return fn(i); } catch (e) { return false; } }).sort((a, b) => Math.hypot(a.x - G.player.x, a.y - G.player.y) - Math.hypot(b.x - G.player.x, b.y - G.player.y))[0]; G.useInteractable(it); }, find);
  await pg.waitForFunction(() => !!document.querySelector('.modal .win') || !!G.minigame.MG.cur || !!G.busy, null, { timeout: 20000 }).catch(() => {}); await pg.waitForTimeout(400); return 'script (the thing is behind something else on screen: walked to it with G.useInteractable; the menu and the game by touch)';
}
/** from a tap on the thing to the end of the activity: returns { opened, kind, title, card, stars } */
async function go(A, o) {
  const pg = A.pg; await pg.waitForFunction(() => !G.busy && !G.minigame.MG.cur, null, { timeout: 30000 }).catch(() => {}); await pg.evaluate(() => document.querySelectorAll('.mg-res').forEach(e => e.remove()));
  let how = 'touch'; if (o.find) how = await tapOpen(A, o.find, o.dz, (o.pick || [])[0]);
  for (const re of o.pick || []) { if (await pg.evaluate(() => !!G.minigame.MG.cur)) break; await pg.waitForTimeout(350); if (await pg.evaluate(() => !!document.querySelector('.modal .win'))) { if (process.env.MGB_V) console.log('   menu: ' + await pg.evaluate(() => document.querySelector('.modal .win').textContent.slice(0, 200))); await A.tapText(re, '.modal .opt, .modal button').catch(e => { if (process.env.MGB_V) console.log('   ' + e.message); }); } }
  const opened = await pg.waitForFunction(() => !!G.minigame.MG.cur, null, { timeout: o.wait || 9000 }).then(() => true).catch(() => false);
  if (!opened) { await pg.screenshot({ path: path.join(OUT, 'mgb_fail_' + (o.name || 'x') + '.png') }); return { opened: false, busy: await pg.evaluate(() => (G.busy ? G.busy.label : null) + ' modal:' + G.modal + ' ' + (document.querySelector('.modal .win') ? document.querySelector('.modal .win').textContent.slice(0, 120) : '')) }; }
  const anim = await pg.evaluate(() => G.player.pose + (G.player.hidden ? ' (hidden)' : ''));
  if (o.auto) { await pg.waitForTimeout(1300); await A.tapText(/^Auto$/, '.mg-auto'); await pg.waitForFunction(() => !G.busy, null, { timeout: 40000 }).catch(() => {}); await pg.waitForTimeout(400); return { opened: true, auto: true, card: await pg.evaluate(() => [...document.querySelectorAll('.mg-res')].map(e => e.textContent).join(' / ')) }; }
  const r = await A.playTouch(o.name, o.shotAt === undefined ? 3 : o.shotAt);
  await pg.waitForFunction(() => !G.busy, null, { timeout: 40000 }).catch(() => {}); await pg.waitForTimeout(500);
  const card = await pg.evaluate(() => [...document.querySelectorAll('.mg-res')].map(e => [...e.querySelectorAll('b, span')].map(x => x.textContent).join(' | ') + ' [' + e.querySelectorAll('.mg-stars i.on').length + ' stars]').join(' / '));
  return { opened: true, how, kind: r.kind, title: r.title, card, anim, stars: +((card.match(/\[(\d) stars\]/) || [])[1] || 0) };
}
const fmt = r => (r.opened ? `[${r.how}] "${r.title}" (${r.kind}), character: ${r.anim} -> ${r.card || 'no card'}` : 'NO GAME OPENED (busy: ' + r.busy + ')');

/* ====================================================================== walk: every B game starts and draws, 390 and 375 wide ====================================================================== */
if (on2('walk')) for (const [W, H] of [[390, 844], [375, 812]]) {
  const A = await open(W, H), pg = A.pg;
  const res = await pg.evaluate(async () => {
    const sleep = ms => new Promise(r => setTimeout(r, ms)), out = [], bad = [];
    const probe = async (name, pr) => { await sleep(60); const m = G.minigame.MG.cur, ok = !!m && m.canvas.isConnected; let drew = false, kind = m && m.kind; if (ok) { await sleep(1250); const d = m.canvas.getContext('2d').getImageData(0, 0, 180, 110).data; let n = 0; for (let i = 0; i < d.length; i += 4 * 97) if (d[i] !== d[0] || d[i + 1] !== d[1]) n++; drew = n > 20; const r = m.canvas.getBoundingClientRect(); if (r.left < 0 || r.right > innerWidth + .5 || r.bottom > innerHeight + .5) bad.push(name + ': canvas off screen'); m.quit(); } const r = await pr; await sleep(200); if (!(ok && drew && r && !r.error)) bad.push(name + ' did not start'); out.push(name + '=' + kind); };
    for (const k of Object.keys(G.mgB.games)) { const g = G.mgB.games[k]; await probe(k, g.skill ? G.skillplay.demo(k, 2, {}) : G.mgB.demo(k, {})); }
    await probe('fish', G.skillplay.demo('fish', 2, {})); await probe('paint#1', G.skillplay.demo('paint', 2, {})); await probe('paint#2', G.skillplay.demo('paint', 2, {}));
    for (const sc of ['plate', 'window', 'counter', 'pet']) await probe('scrub:' + sc, G.minigame.play({ kind: 'scrub', title: sc, level: 2, o: { scenes: [sc] } }));
    const map = Object.keys(G.mgB.acts).map(id => id + '>' + (G.skillplay.gameFor(id, {}) || G.mgB.acts[id] + '*'));
    return { out, bad, map };
  });
  say(!res.bad.length, `${W}x${H}: ${res.out.length} games start and draw inside the screen  ${res.bad.join(' | ')}`); console.log('     ' + res.out.join('  ')); if (W === 390) console.log('     activity > game (* = B runner): ' + res.map.join('  '));
  if (W === 375) for (const k of ['unbox', 'sort', 'fold', 'wires', 'dishes', 'water']) { await pg.evaluate(k => { window.__r = null; const g = G.mgB.games[k]; (g.skill ? G.skillplay.demo(k, 2, {}) : G.mgB.demo(k, {})).then(r => { window.__r = r; }); }, k); await pg.waitForTimeout(300); await A.playTouch('mgb_375_' + k, 1.6); await pg.waitForTimeout(1300); const rr = await pg.evaluate(() => window.__r); say(rr && rr.score >= .55, `375x812, ${k} played by touch (demo): score ${rr ? rr.score.toFixed(2) : 'none'}`); }
  say(!A.errs.length, `${W}x${H}: zero page errors ${A.errs.slice(0, 3).join(' | ')}`); await A.ctx.close();
}

/* ====================================================================== home: by touch, from the real things in the flat ====================================================================== */
if (on2('home')) {
  const A = await open(), pg = A.pg; let r;
  await pg.evaluate(async () => { const sleep = ms => new Promise(r => setTimeout(r, ms)); if (!G.housing.isHome()) { try { await G.housing.goHome(); } catch (e) { } await sleep(2500); } G.skillplay.setAuto(false); });
  /* 1. the moving boxes: played, Auto, mini-games off */
  let b0 = await pg.evaluate(() => ({ n: G.housing.boxes().length, fun: G.needs.get('fun'), flag: G.state.flags.boxes_unpacked || 0 })); await pg.evaluate(() => G.needs.set('fun', 40));
  r = await go(A, { name: 'mgb_unbox', find: "/Unpack a Moving Box/.test(i.label)", shotAt: 2.4 }); let b1 = await pg.evaluate(() => ({ n: G.housing.boxes().length, fun: G.needs.get('fun') }));
  say(r.opened && r.kind === 'unbox' && b1.n === b0.n - 1 && r.stars >= 2 && /Fun \+/.test(r.card), `moving box by touch: ${fmt(r)}; boxes ${b0.n} -> ${b1.n}`);
  r = await go(A, { find: "/Unpack a Moving Box/.test(i.label)", auto: true }); let b2 = await pg.evaluate(() => G.housing.boxes().length);
  say(r.opened && b2 === b1.n - 1 && !/stars/.test(r.card || ''), `moving box, Auto: unpacked as before (boxes ${b1.n} -> ${b2}), no game result card`);
  await pg.evaluate(() => G.skillplay.setAuto(true)); r = await go(A, { find: "/Unpack a Moving Box/.test(i.label)", wait: 2500 }); await pg.waitForFunction(() => !G.busy, null, { timeout: 40000 }).catch(() => {}); let b3 = await pg.evaluate(() => { G.skillplay.setAuto(false); return G.housing.boxes().length; });
  say(!r.opened && b3 === b2 - 1, `moving box, mini-games off: no game, unpacked as before (boxes ${b2} -> ${b3})`);
  /* 2. cleaning: the quick tidy (dishes), the proper clean (window, counter, plates) */
  await pg.evaluate(() => { G.supplies.addClean(-G.supplies.clean() + 30); G.supplies.add('cleaner', 3); G.supplies.add('sponge', 3); });
  r = await go(A, { name: 'mgb_dishes', find: "/Cleaning things/.test(i.label)", pick: [/^A quick tidy/], shotAt: 3 }); let c1 = await pg.evaluate(() => G.supplies.clean());
  say(r.opened && r.kind === 'scrub' && /cleanliness \+/.test(r.card) && c1 > 46.5, `quick tidy by touch: ${fmt(r)}; cleanliness 30 -> ${c1.toFixed(0)} (plain: 46)`);
  await pg.evaluate(() => G.supplies.addClean(-G.supplies.clean() + 20));
  r = await go(A, { name: 'mgb_scrub', find: "/Cleaning things/.test(i.label)", pick: [/^Clean the place properly/], shotAt: 2.5 }); let c2 = await pg.evaluate(() => G.supplies.clean());
  say(r.opened && r.kind === 'scrub' && /cleanliness \+/.test(r.card) && c2 > 75, `proper clean by touch: ${fmt(r)}; cleanliness 20 -> ${c2.toFixed(0)} (plain: 75)`);
  await pg.evaluate(() => G.supplies.addClean(-G.supplies.clean() + 30)); r = await go(A, { find: "/Cleaning things/.test(i.label)", pick: [/^A quick tidy/], auto: true }); let c3 = await pg.evaluate(() => G.supplies.clean());
  say(r.opened && Math.abs(c3 - 46) < 1.5 && !r.card, `quick tidy, Auto: the plain result (cleanliness 30 -> ${c3.toFixed(0)}), no card`);
  await pg.evaluate(() => { G.supplies.addClean(-G.supplies.clean() + 30); G.skillplay.setAuto(true); }); r = await go(A, { find: "/Cleaning things/.test(i.label)", pick: [/^A quick tidy/], wait: 2500 }); await pg.waitForFunction(() => !G.busy, null, { timeout: 40000 }).catch(() => {}); let c4 = await pg.evaluate(() => { G.skillplay.setAuto(false); return G.supplies.clean(); });
  say(!r.opened && Math.abs(c4 - 46) < 1.5, `quick tidy, mini-games off: no game, the plain result (cleanliness -> ${c4.toFixed(0)})`);
  /* 3. repairs: the stove (wires) */
  r = await go(A, { name: 'mgb_wires', find: "i.fx && i.fx.tags.includes('stove')", pick: [/Tune Up/i], shotAt: 1.4 });
  say(r.opened && r.kind === 'wires' && /tuned up/.test(r.card), `tune up the stove by touch: ${fmt(r)}`);
  /* 4. the house plant: watering */
  const placed = await pg.evaluate(async () => { const H = G.housing; H.addFurniture('plant_fern', { instant: true }); let u = null; for (const [x, y] of [[3, 3], [2, 4], [4, 2], [5, 5], [1, 1]]) { const pos = H.freeSpot('plant_fern', x, y); if (pos) { u = H.place('plant_fern', pos, { quiet: true }); if (u) break; } } await H.refresh(); await new Promise(r => setTimeout(r, 900)); return !!u && G.scene.fixtures.some(f => f.tags.includes('plant')); });
  if (!placed) say(false, 'could not place a house plant in the test flat'); else { r = await go(A, { name: 'mgb_water', find: "i.fx && i.fx.tags.includes('plant')", pick: [/Water/i], shotAt: 2.2 }); say(r.opened && r.kind === 'water' && /perks up|Watered/.test(r.card), `water the plant by touch: ${fmt(r)}`); }
  /* 5. the stereo from the MISC box: Dance Like Nobody's Watching */
  const stereo = await pg.evaluate(async () => { const H = G.housing; if (!G.scene.fixtures.some(f => f.tags.includes('music'))) { if (!H.storage().includes('music_t0')) H.addFurniture('music_t0', { instant: true }); for (const [x, y] of [[2, 2], [4, 4], [3, 5], [5, 2]]) { const pos = H.freeSpot('music_t0', x, y); if (pos && H.place('music_t0', pos, { quiet: true })) break; } await H.refresh(); await new Promise(r => setTimeout(r, 900)); } return G.scene.fixtures.some(f => f.tags.includes('music')); });
  if (!stereo) say(false, 'could not place the stereo'); else { r = await go(A, { name: 'mgb_dance_home', find: "i.fx && i.fx.tags.includes('music')", pick: [/Dance Like/i, /^(20|10|15) min/], shotAt: 4 }); say(r.opened && r.kind === 'rhythm' && /Fun \+/.test(r.card), `dance at home by touch: ${fmt(r)}`); }
  /* 6. a skill book: the recall round */
  const book = await pg.evaluate(() => { const id = Object.keys(G.state.inv.books || {})[0]; let got = null; for (const b of ['book_cooking_1', 'cookbook_basics', 'skillbook_cooking_1']) if (!got && G.inv.add(b, 1)) got = b; return got || G.inv.items().map(i => i.id).filter(i => /book/.test(i)).join(','); });
  r = await go(A, { name: 'mgb_recall', find: "i.fx && i.fx.tags.includes('bookshelf')", pick: [/Study a Skill Book/i, /^15 min/, /One Pan/], shotAt: 5 });
  say(r.opened && r.kind === 'memory', `study a skill book by touch (book: ${book}): ${fmt(r)}`);
  /* 7. the shower: the temperature dial; and the shower tune-up (the leak) */
  await pg.evaluate(async () => { G.needs.set('hygiene', 20); try { await G.housing.goRoom(G.state.home.id, 'bath', 'main'); } catch (e) { } await new Promise(r => setTimeout(r, 1800)); });
  r = await go(A, { name: 'mgb_dial', find: "i.fx && i.fx.tags.includes('shower')", pick: [/Take a Shower/i, /^15 min/], shotAt: 3 }); const hy = await pg.evaluate(() => G.needs.get('hygiene'));
  say(r.opened && r.kind === 'balance' && /Hygiene \+|Clean anyway/.test(r.card), `shower dial by touch: ${fmt(r)}; hygiene 20 -> ${hy.toFixed(0)}`);
  r = await go(A, { name: 'mgb_leak', find: "i.fx && i.fx.tags.includes('shower')", pick: [/Fix the Shower/i], shotAt: 3 });
  say(r.opened && r.kind === 'targets' && /tuned up/.test(r.card), `tune up the shower by touch: ${fmt(r)}`);
  /* 8. painting: every second session mixes colours (script start: the test flat has no easel; the game itself by touch) */
  await pg.evaluate(async () => { try { await G.housing.goRoom(G.state.home.id, 'main', 'bath'); } catch (e) { } await new Promise(r => setTimeout(r, 1500)); const p = G.skillplay.demo('paint', 2, {}); await new Promise(r => setTimeout(r, 300)); G.minigame.MG.cur.quit(); await p; await new Promise(r => setTimeout(r, 400)); window.__mix = null; G.skillplay.demo('paint', 2, {}).then(r => { window.__mix = r; }); }); await pg.waitForTimeout(400);
  r = await A.playTouch('mgb_mix', 2.5); await pg.waitForTimeout(1500); const mx = await pg.evaluate(() => window.__mix);
  say(r.kind === 'mix' && mx && mx.score >= .55, `painting, second session = mix the colour (started by script, played by touch): "${r.title}" score ${mx ? mx.score.toFixed(2) : 'none'}`);
  say(!A.errs.length, `home: zero page errors ${A.errs.slice(0, 3).join(' | ')}`); await A.ctx.close();
}

/* ====================================================================== town: the laundromat, the taproom, the pet shop, the park, the pier, the hotel pool ====================================================================== */
if (on2('town')) {
  const A = await open(), pg = A.pg; let r; const goto = async (sc, at) => { await pg.evaluate(async ([sc, at]) => { await G.go(sc, at || undefined); await new Promise(r => setTimeout(r, 1800)); }, [sc, at]); };
  await pg.evaluate(() => G.skillplay.setAuto(false));
  /* laundry: sort when the wash starts, fold when it is dry */
  const lset = await pg.evaluate(() => { const W = G.wardrobe, worn = W.wornIds(); for (const id of ['outfit_pajamas', 'outfit_tee_jeans', 'outfit_summer', 'outfit_knit', 'outfit_smart_casual', 'outfit_sport', 'outfit_raincoat', 'outfit_winter', 'outfit_travel']) { try { if (!W.owns(id)) W.add(id, true); } catch (e) { } }
    const ids = W.pieces().concat(W.owned()).filter(id => W.washable(id) && !worn.includes(id) && !W.delicate(id)).slice(0, 9); W.setState(ids, 3); G.laundry.ensureHamper && G.laundry.ensureHamper(); const ok = G.laundry.takeBag(); G.money.add(50, 'test'); return { n: ids.length, ok, hamper: G.laundry.hamper().length }; });
  await goto('int:pub:21');
  r = await go(A, { name: 'mgb_sort', find: "i.fx && i.fx.tags.includes('laundry_machine') && !/dryer/.test(i.fx.asset.id)", pick: [/^Wash a load/], shotAt: 2.6 }); let L = await pg.evaluate(() => { const l = G.laundry.loads()[0]; return l ? { mgb: l.mgb || 0, stage: l.stage, n: l.ids.length } : null; });
  say(r.opened && r.kind === 'laundry' && L && L.mgb >= 1 && /right basket/.test(r.card), `laundromat, wash a load -> sort by touch (${JSON.stringify(lset)}): ${fmt(r)}; load.mgb = ${L && L.mgb}`);
  await pg.evaluate(() => { const l = G.laundry.loads()[0]; l.t = G.state.t - 1; G.laundry.tick(); });
  await tapOpen(A, "i.fx && i.fx.tags.includes('laundry_machine') && /dryer/.test(i.fx.asset.id)", undefined, /Move the wet load/); await A.tapText(/^Move the wet load/, '.modal .opt').catch(() => {}); await pg.waitForTimeout(600);
  await pg.evaluate(() => { const l = G.laundry.loads()[0]; l.t = G.state.t - 1; G.laundry.tick(); try { G.needs.removeMoodlet('fresh_clothes'); } catch (e) { } G.needs.set('fun', 40); });
  r = await go(A, { name: 'mgb_fold', find: "i.fx && i.fx.tags.includes('laundry_machine') && /dryer/.test(i.fx.asset.id)", pick: [/^Fold it neatly/], shotAt: 1.6 }); const after = await pg.evaluate(() => ({ loads: G.laundry.loads().length, fresh: G.needs.hasMoodlet('fresh_clothes'), ml: (G.needs.moodlets().find(m => m.id === 'fresh_clothes') || {}) }));
  say(r.opened && r.kind === 'laundry' && after.loads === 0 && after.fresh && /Fun \+/.test(r.card), `laundromat, fold by touch: ${fmt(r)}; load collected, Fresh Clothes ${JSON.stringify(after.ml).slice(0, 120)}`);
  /* the pet shop's pen: brushing */
  await goto('int:pub:35'); r = await go(A, { name: 'mgb_brush', find: "i.fx && i.fx.tags.includes('pet_pen')", pick: [/Meet the Animals/i, /^(10|5) min/], shotAt: 3 });
  say(r.opened && r.kind === 'scrub' && /dog/.test(r.card), `meet the animals (brushing) by touch: ${fmt(r)}`);
  /* the park: the duck pond and the swings */
  await pg.evaluate(() => { G.inv.add('bread', 2); G.inv.add('fishing_rod', 1); });
  await goto('city', { x: 97, y: 173 }); r = await go(A, { name: 'mgb_ducks', find: "/Duck/i.test(i.label)", pick: [/Feed the Ducks/i], shotAt: 5 });
  say(r.opened && r.kind === 'aim' && /ducks/.test(r.card), `feed the ducks by touch: ${fmt(r)}`);
  await goto('city', { x: 66, y: 183.5 }); r = await go(A, { name: 'mgb_swing', find: "/Swing/i.test(i.label)", pick: [/Swing/i, /^(10|5) min/], shotAt: 5 });
  say(r.opened && r.kind === 'stroke' && /swings/.test(r.card), `have a swing by touch: ${fmt(r)}`);
  /* the pier: cast, bite, reel */
  const pier = await pg.evaluate(() => { const p = G.sceneCache.get('city').world.pois.find(q => q.id === 'poi_pier'); return p ? [p.x, p.y] : null; });
  if (pier) { await goto('city', { x: pier[0], y: pier[1] }); r = await go(A, { name: 'mgb_fish', find: "/Fish/i.test(i.label)", pick: [/Fish off the Pier/i, /^(30 min|1 h)/], shotAt: 9 }); say(r.opened && r.kind === 'cast' && /cm|got away/.test(r.card), `fish off the pier by touch (cast, bite, reel): ${fmt(r)}`); } else say(false, 'no pier poi');
  /* the hotel pool */
  const spa = await pg.evaluate(async () => { try { const S = G.state.hotel; if (S) S.spaDay = G.now().day; await G.hotel.toSpa('stairs'); } catch (e) { return 'toSpa: ' + e.message; } await new Promise(r => setTimeout(r, 2000)); return G.scene.id + ' pass:' + G.hotel.hasSpa() + ' ' + G.interactables().map(i => i.label).filter(l => /swim|pool|lap/i.test(l)).join(','); });
  r = await go(A, { name: 'mgb_laps', find: "/^The pool/.test(i.label)", pick: [/Swim/i], shotAt: 4 }).catch(e => ({ opened: false, busy: e.message }));
  say(r.opened && r.kind === 'stroke' && /clean strokes/.test(r.card || ''), `hotel pool laps by touch (${spa}): ${fmt(r)}`);
  /* the taproom's pool table */
  await pg.evaluate(() => { G.state.t = Math.floor(G.state.t / 1440) * 1440 + 19 * 60; }); await goto('int:pub:7'); r = await go(A, { name: 'mgb_cue', find: "i.fx && i.fx.tags.includes('pool')", pick: [/Shoot Pool/i, /^(20|10) min/], shotAt: 4 });
  say(r.opened && r.kind === 'timing' && /clean pots/.test(r.card), `shoot pool by touch: ${fmt(r)}`);
  say(!A.errs.length, `town: zero page errors ${A.errs.slice(0, 3).join(' | ')}`); await A.ctx.close();
}

/* ====================================================================== pad: three new games with the fake gamepad, Confirm only ====================================================================== */
if (on2('pad')) {
  const P = await openGame({ url: '?scene=city' }), pg = P.pg; await pg.waitForTimeout(1500); await P.connect(); await P.press('ok'); await pg.waitForTimeout(400);
  const run = async key => {
    await pg.evaluate(k => { window.__r = null; const g = G.mgB.games[k]; (g.skill ? G.skillplay.demo(k, 2, {}) : G.mgB.demo(k, {})).then(r => { window.__r = r; }); }, key); await pg.waitForTimeout(1100);
    let held = false; const t0 = Date.now();
    while (Date.now() - t0 < 70000) {
      const s = await pg.evaluate(() => { const m = G.minigame.MG.cur; if (!m) return null; const st = m.state(), w = st.want || {}; return { type: w.type, ready: !!w.ready, on: !!w.on, done: st.done, counting: st.counting }; }); if (!s) break;
      if (s.done || s.counting) { if (held) { held = false; await P.up('ok'); } await pg.waitForTimeout(50); continue; }
      if (s.type === 'hold') { if (s.on && !held) { held = true; await P.down('ok'); } else if (!s.on && held) { held = false; await P.up('ok'); } await pg.waitForTimeout(16); }
      else if (s.ready) { if (held) { held = false; await P.up('ok'); } await P.down('ok'); await pg.waitForTimeout(45); await P.up('ok'); await pg.waitForTimeout(45); } else await pg.waitForTimeout(12);
    }
    if (held) await P.up('ok'); await pg.waitForTimeout(400); return pg.evaluate(() => window.__r);
  };
  for (const [key, what] of [['unbox', 'Confirm rips the tape and lifts each thing'], ['dishes', 'scrub: Confirm scrubs the ringed spot'], ['wires', 'Confirm picks the plug, then its socket'], ['fold', 'Confirm folds the glowing flap'], ['water', 'Confirm held to pour']]) {
    const r = await run(key); if (key === 'dishes') await P.shot('mgb_pad_done');
    say(r && !r.quit && !r.auto && r.score >= .5, `fake gamepad, ${key} (${what}): score ${r ? r.score.toFixed(2) : 'none'}, ${r ? r.stars : 0} stars`);
  }
  say(!P.errors.filter(e => /exception|error/i.test(e)).length, `pad: zero page errors ${P.errors.slice(0, 3).join(' | ')}`); await P.close();
}

/* ====================================================================== intro: a fresh New Game through the real creator and intro (its own Skip buttons), then the first box by touch ====================================================================== */
if (on2('intro')) {
  const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true }), pg = await ctx.newPage(), errs = [];
  pg.on('pageerror', e => errs.push(e.message.slice(0, 300))); pg.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 300)); });
  await pg.goto(U); await pg.waitForFunction(() => window.G && G.onTitle !== undefined && !document.getElementById('load'), null, { timeout: 180000 }); await pg.waitForTimeout(1200);
  const cdp = await ctx.newCDPSession(pg), tap = async (x, y, ms = 350) => { await pg.touchscreen.tap(x, y); await pg.waitForTimeout(ms); }, touch = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] });
  const btn = re => pg.evaluate(src => { const x = new RegExp(src, 'i'), e = [...document.querySelectorAll('button, .opt')].find(b => b.offsetWidth && b.offsetHeight && x.test((b.textContent || '').trim())); if (!e) return null; e.scrollIntoView({ block: 'center' }); const q = e.getBoundingClientRect(); return [q.left + q.width / 2, q.top + q.height / 2, (e.textContent || '').trim().slice(0, 30)]; }, re.source);
  const path0 = [], press = async (re, ms = 1000) => { const b0 = await btn(re); if (!b0) return false; await pg.waitForTimeout(150); const b = await btn(re); if (!b) return false; path0.push(b[2]); await tap(b[0], b[1], ms); return true; };
  for (const re of [/^New Game/, /^Next ▶/, /^Surprise me/, /^Next ▶/, /^Juniper Court/, /^Move in/]) await press(re);
  for (let k = 0; k < 30; k++) { const st = await pg.evaluate(() => ({ home: /^int:home/.test((G.scene && G.scene.id) || ''), cut: !!G.cutscene })); if (st.home && !st.cut && !(await btn(/^Skip/))) break; if (!(await press(/^(Skip intro|Yes|Skip it)/, 1500)) && !(await press(/^Skip/, 1500))) await pg.waitForTimeout(800); }
  await pg.waitForTimeout(2500);
  const st = await pg.evaluate(() => ({ sc: G.scene.id, day: G.now().day, boxes: G.housing.boxes().map(b => b.label), seen: (G.state.skillplay.n || {}).mgSeen || 0, auto: G.skillplay.auto() }));
  console.log('     path: ' + path0.join(' > ')); say(/^int:home/.test(st.sc) && st.boxes.length >= 3 && st.day === 0 && !st.seen, `fresh New Game, creator, intro (Skip buttons): in the flat on day one with ${st.boxes.length} boxes, no mini-game seen yet  ${JSON.stringify(st)}`);
  const A = { pg, tap, touch, tapText: async () => {}, w: 390, h: 844 };
  A.playTouch = async (name, shotAt) => { let shot = false, kind = null, title = null; const t0 = Date.now(); while (Date.now() - t0 < 60000) { const s = await pg.evaluate(() => { const m = G.minigame.MG.cur; if (!m) return null; const s = m.state(), w = s.want || {}, p = m.toClient(w.x === undefined ? 90 : w.x, w.y === undefined ? 55 : w.y); return { kind: m.kind, title: m.def.title, t: s.t, done: s.done, counting: s.counting, ready: !!w.ready, x: p.x, y: p.y }; }); if (!s) break; kind = s.kind; title = s.title; if (!shot && s.t >= shotAt) { shot = true; await pg.screenshot({ path: path.join(OUT, name + '.png') }); } if (s.done || s.counting || !s.ready) { await pg.waitForTimeout(40); continue; } await pg.touchscreen.tap(s.x, s.y); await pg.waitForTimeout(280); } return { kind, title }; };
  await pg.evaluate(() => { try { G.firstTime.setEnabled(false); } catch (e) { } });
  let r = { opened: false };
  for (let k = 0; k < 5 && !r.opened; k++) { for (let q = 0; q < 4; q++) { const b = await btn(/^(OK|Got it|Close|Later|Not now|x|×)$/); if (b) await tap(b[0], b[1], 500); } r = await go(A, { name: 'mgb_intro_box', find: "/Unpack a Moving Box/.test(i.label)", shotAt: 2.2, wait: 6000 }).catch(e => ({ opened: false, busy: e.message })); }
  const en = await pg.evaluate(() => ({ boxes: G.housing.boxes().length, flag: G.state.flags.boxes_unpacked, seen: (G.state.skillplay.n || {}).mgSeen, tip: (G.state.skillplay.n || {}).mgTip || 0 }));
  say(r.opened && r.kind === 'unbox' && en.boxes === st.boxes.length - 1 && en.seen === 1 && en.tip === 0, `day one, the first box by touch (a human-speed thumb: one tap every 0.3 s): ${fmt(r)}; ${JSON.stringify(en)} (first mini-game of the save, no "turn them off" tip yet)`);
  say(!errs.length, `intro: zero page errors ${errs.slice(0, 3).join(' | ')}`); await ctx.close();
}

/* MORE */
await br.close(); srv.close(); console.log(bad ? `\n${bad} FAILED` : '\nall passed'); process.exit(bad ? 1 : 0);
