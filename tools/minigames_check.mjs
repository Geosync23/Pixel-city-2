// Mini-games check (cooking + gym, owner msgs 158-164). Runs on the BUILT game (dist/index.html), 390x844 touch (and 375x812 for the walk).
//   node tools/minigames_check.mjs            everything
//   node tools/minigames_check.mjs walk       1. every recipe and every exercise machine: the mapped game exists and STARTS (G.skillplay.demo, then Stop)
//   node tools/minigames_check.mjs play       2. each cooking game from the real kitchen flow and each gym machine from the real gym, by TOUCH (screenshots out/shots/mg_*.png); `gym` = the gym half only
//   node tools/minigames_check.mjs rules      3. Auto / mini-games off for one of each; the Settings switch; the "turn them off" hint (2nd, 3rd, 4th time: shown; 5th: not)
//   node tools/minigames_check.mjs pad        4. one game with the fake gamepad (tools/pad_lib.mjs)
// Game state is set up through G (ingredients, recipes known, a gym pass, teleports); everything the PLAYER does is a real touch.
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
export { open, say, br, srv, OUT };

/* ====================================================================== 1. walk: every recipe + every machine ====================================================================== */
if (on('walk')) for (const [W, H] of [[390, 844], [375, 812]]) {
  const A = await open(W, H), pg = A.pg;
  const res = await pg.evaluate(async () => {
    const sp = G.skillplay, out = { recipes: 0, bad: [], kinds: {}, machines: [] }, sleep = ms => new Promise(r => setTimeout(r, ms));
    const start = async (key, ctx) => { const pr = sp.demo(key, 2, { ctx }); await sleep(40); const m = G.minigame.MG.cur, kind = m && m.kind, ok = !!m && !!m.canvas.isConnected; let drew = false; if (ok) { await sleep(60); const d = m.canvas.getContext('2d').getImageData(0, 0, 180, 110).data; let n = 0; for (let i = 0; i < d.length; i += 4 * 97) if (d[i] !== d[0] || d[i + 1] !== d[1]) n++; drew = n > 20; m.quit(); } const r = await pr; await sleep(180); return { ok: ok && drew && r && !r.error, kind }; };
    const ids = Object.keys(G.cooking ? {} : {}); void ids;
    const all = G.skillplay.recipeIds();
    for (const id of all) { const key = sp.gameFor('cook', { recipe: id }); if (!key || !sp.GAMES[key] || !sp.cookGames[key]) { out.bad.push(id + ': no game (' + key + ')'); continue; } const r = await start(key, { recipe: id }); if (!r.ok) out.bad.push(id + ': ' + key + ' did not start'); out.kinds[key] = (out.kinds[key] || 0) + 1; out.recipes++; }
    for (const [aid, k] of [['gym.treadmill', ''], ['gym.bike', ''], ['gym.rower', ''], ['gym.bag', ''], ['gym.mat', ''], ['gym.bench', ''], ['gym.squatrack', ''], ['gym.dumbbells', ''], ['gym.kettlebells', ''], ['gym.cable', ''], ['furn.home.treadmill', ''], ['furn.home.yogamat', ''], ['furn.home.dumbbells', ''],
      ['g.fit', 'spinbike'], ['g.fit', 'bag'], ['g.fit', 'bench'], ['g.fit', 'rower'], ['g.fit', 'kettlebells'], ['g.fit', 'pullup'], ['g.fit', 'balance'], ['g.fit', 'hoop'], ['g.fit', 'pingpong'], ['g.fit', 'climbwall']]) {
      const key = sp.gameFor('exercise_home', { fx: { asset: { id: aid }, item: { p: { k } } } }); if (!key || !sp.GAMES[key]) { out.bad.push(aid + ' ' + k + ': no game'); continue; } const r = await start(key, {}); if (!r.ok) out.bad.push(aid + ' ' + k + ': ' + key + ' did not start'); out.machines.push((k || aid) + '=' + key + '/' + r.kind);
    }
    return out;
  });
  say(res.recipes === 212 || res.recipes > 200, `${W}x${H}: ${res.recipes} recipes, each mapped game exists and starts  ${JSON.stringify(res.kinds)}`);
  say(!res.bad.length, `${W}x${H}: no recipe / machine without a starting game ${res.bad.slice(0, 8).join(' | ')}`);
  console.log('     machines: ' + res.machines.join('  '));
  say(!A.errs.length, `${W}x${H}: zero page errors ${A.errs.slice(0, 3).join(' | ')}`); await A.ctx.close();
}

/* ====================================================================== 2. play: by touch, from the real activity ====================================================================== */
const DISHES = [['flip', 'pancakes', 'stove'], ['ck_blend', 'berry_smoothie', 'fridge'], ['ck_chop', 'garden_salad', 'fridge'], ['ck_stir', 'tomato_soup', 'stove'], ['ck_oven', 'choc_chip_cookies', 'stove'], ['ck_fry', 'fish_and_chips', 'stove'], ['ck_boil', 'boiled_eggs', 'stove'],
  ['ck_build', 'cheese_sandwich', 'fridge'], ['ck_pour', 'lemonade', 'fridge'], ['ck_knead', 'flatbreads', 'stove']];
async function kitchen(A) {
  const pg = A.pg;
  const info = await pg.evaluate(async list => {
    const sleep = ms => new Promise(r => setTimeout(r, ms)); if (!G.housing.isHome()) { try { await G.housing.goHome(); } catch (e) { } await sleep(2500); }
    const R = G.skillplay.recipe; for (const [, id] of list) { const r = R(id); try { G.cooking.learn(id, 'test'); } catch (e) { } for (const k in r.ingredients) { G.inv.fridge.add(k, r.ingredients[k] * 3, { silent: true }) || G.inv.add(k, r.ingredients[k] * 3, { silent: true }); } }
    while (G.skills.level('cooking') < 6) G.skills.addXp('cooking', 400, true);
    const fx = G.scene.fixtures || [], st = fx.find(f => f.tags.includes('stove')), fr = fx.find(f => f.tags.includes('fridge'));
    if (st && st.item) { st.item.good = null; st.item.p = Object.assign({}, st.item.p, { tier: 2 }); }   /* setup: the save's hot plate becomes a range with an oven (the oven / fryer dishes need one) */
    return { home: G.housing.isHome(), room: G.scene.roomId, stove: !!st, fridge: !!fr, tier: st && st.item && (st.item.p || {}).tier, can: list.map(([, id, at]) => { const s = G.cooking.status(id, at === 'stove' ? st : fr); return id + ':' + (s.can ? 'ok' : s.why); }) };
  }, DISHES);
  return info;
}
if (on('play') || want === 'gym') {
  const A = await open(390, 844), pg = A.pg; const info = await kitchen(A); console.log('     kitchen: ' + JSON.stringify(info));
  for (const [key, id, at] of want === 'gym' ? [] : DISHES) {
    try {
      await A.closeAll(); await pg.waitForFunction(() => !G.busy && !G.minigame.MG.cur, null, { timeout: 60000 }).catch(() => {});
      const name = await pg.evaluate(id => G.skillplay.recipe(id).name, id);
      await A.tapThing(at === 'stove' ? "/stove|cooker|range|hot plate|hob/i.test(i.label) || (i.fx && i.fx.tags.includes('stove'))" : "/fridge/i.test(i.label) || (i.fx && i.fx.tags.includes('fridge'))");
      await A.tapText(at === 'stove' ? /^Cook\.\.\./ : /^Make a No-Cook Dish/, '.modal .opt'); await pg.waitForTimeout(500);
      await A.tapText(/^All/, '.cook-win button').catch(() => {}); await pg.waitForTimeout(300);
      await A.tapText(new RegExp('^' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), '.ck-row'); await pg.waitForTimeout(400);
      if (key === 'flip') await A.shot('mg_cook_window');
      await A.tapText(/^(Cook|Make|Bake|Mix|Brew|Blend)\b/, '.ck-btns button'); await pg.waitForFunction(() => !!G.minigame.MG.cur, null, { timeout: 8000 });
      const act = await pg.evaluate(() => ({ id: G.busy && G.busy.actId, cur: G.skillplay.current() && G.skillplay.current().key }));
      const r = await A.playTouch('mg_cook_' + key.replace('ck_', ''), key === 'ck_build' ? 1.2 : 3.2);
      await pg.waitForFunction(() => !G.busy, null, { timeout: 90000 }).catch(() => {}); await pg.waitForTimeout(700);
      const made = await pg.evaluate(id => ({ n: G.inv.fridge.count('meal_' + id) + G.inv.count('meal_' + id), best: G.skillplay.best(G.skillplay.gameFor('cook', { recipe: id })), card: (document.querySelector('.mg-res') || {}).textContent || '' }), id);
      say(act.cur === key && made.n >= 1 && made.best && made.best.n >= 1, `cook ${name} at the ${at}: game '${act.cur}' (${r.kind}) "${r.title}" played by touch -> ${made.n} serving(s), best ${made.best && made.best.q.toFixed(2)}  [${made.card.slice(0, 70)}]`);
      await A.closeAll();
    } catch (e) { say(false, `cook ${id} (${key}): ${e.message.slice(0, 200)}`); await A.shot('mg_FAIL_' + key); await pg.evaluate(() => { try { G.minigame.abort(); document.querySelectorAll('.modal').forEach(m => { const x = m.querySelector('.x, .close'); x && x.click(); }); if (G.busy) G.endActivity(false); } catch (e2) { } }); await pg.waitForTimeout(800); }
  }
  /* ---- the gym: every machine, from the gym floor ---- */
  await pg.evaluate(async () => { const sleep = ms => new Promise(r => setTimeout(r, ms)); G.money.add(500, 'test'); try { G.inv.grant('gym', 2); } catch (e) { } G.state.t = Math.floor(G.state.t / 1440) * 1440 + 10 * 60; await G.go('int:gym', { fresh: true }); await sleep(3000); });
  const gymInfo = await pg.evaluate(() => ({ room: G.scene.roomId, blocked: G.activities.blocked('gym_bike', {}), things: G.interactables().map(i => i.label).filter((v, i, a) => a.indexOf(v) === i).slice(0, 40) })); console.log('     gym: ' + JSON.stringify(gymInfo));
  for (const [aid, opt, key, anim] of [['gym.treadmill', /^Run on the Treadmill/, 'stride', 'treadmill'], ['gym.bike', /^Ride the Exercise Bike/, 'spin', 'cycle'], ['gym.rower', /^Row/, 'row', 'row'], ['gym.bag', /^Hit the Bag/, 'punch', 'punch'], ['gym.mat', /^Stretch on a Mat/, 'pose', 'yoga'], ['gym.bench', /^Lift Weights/, 'reps', 'lift'], ['gym.squatrack', /^Lift Weights/, 'reps', 'lift']]) {
    try {
      await A.closeAll(); await pg.waitForFunction(() => !G.busy && !G.minigame.MG.cur, null, { timeout: 90000 }).catch(() => {}); await pg.waitForTimeout(600);
      const f0 = await pg.evaluate(() => G.needs.fitness ? G.needs.fitness() : (G.state.needs.fitness || 0));
      let ttl = '';
      for (const dz of [null, 1.3, .2, 1.9]) {   /* tap the machine itself; when a neighbour's tap target wins, close that menu and tap the machine higher / lower */
        await A.tapThing(`i.fx && i.fx.asset.id === 'furn.${aid}'`, dz); await A.tapText(opt, '.modal .opt').catch(() => {}) /* a machine with one activity opens its time chooser at once */; await pg.waitForTimeout(300);
        ttl = await pg.evaluate(() => (document.querySelector('.modal .win') || {}).textContent || ''); if (opt.test(ttl.trim())) break; await A.tapText(/^(x|×|Close)$/i, '.modal button').catch(() => {}); await pg.waitForTimeout(400);
      }
      if (!opt.test(ttl.trim())) throw new Error('menu is not ' + opt + ': ' + ttl.slice(0, 60));
      await A.tapText(/^(15|10) min/, '.modal .opt');
      await pg.waitForFunction(() => !!G.minigame.MG.cur, null, { timeout: 8000 });
      const st = await pg.evaluate(() => ({ id: G.busy && G.busy.actId, cur: G.skillplay.current() && G.skillplay.current().key, pose: G.player.pose, lab: G.busy && G.busy.label }));
      const r = await A.playTouch('mg_gym_' + aid.replace('gym.', ''), 4);
      await pg.waitForFunction(() => !G.busy, null, { timeout: 90000 }).catch(() => {}); await pg.waitForTimeout(600);
      const f1 = await pg.evaluate(() => G.needs.fitness ? G.needs.fitness() : (G.state.needs.fitness || 0)), best = await pg.evaluate(k => G.skillplay.best(k), key);
      say(st.cur === key && st.pose === anim && best && best.n >= 1, `gym ${aid}: "${st.lab}" (${st.id}) anim '${st.pose}' game '${st.cur}' (${r.kind}) played by touch, fitness ${(+f0).toFixed(1)} -> ${(+f1).toFixed(1)}, best ${best && best.q.toFixed(2)}`);
    } catch (e) { say(false, `gym ${aid}: ${e.message.slice(0, 200)}`); await A.shot('mg_FAIL_' + aid.replace('gym.', '')); await pg.evaluate(() => { try { G.minigame.abort(); document.querySelectorAll('.modal').forEach(m => { const x = m.querySelector('.x, .close'); x && x.click(); }); if (G.busy) G.endActivity(false); } catch (e2) { } }); await pg.waitForTimeout(800); }
  }
  say(!A.errs.length, `play: zero page errors ${A.errs.slice(0, 3).join(' | ')}`); await A.ctx.close();
}

/* ====================================================================== 3. rules: the hint, the Settings switch, Auto ====================================================================== */
if (on('rules')) {
  const A = await open(390, 844), pg = A.pg; await kitchen(A);
  /* the hint: a clean counter, then five games in a row (opened as the kit opens them; closed with a touch on Stop) */
  await pg.evaluate(() => { const n = G.skillplay.state().n; n.mgSeen = 0; n.mgTip = 0; });
  const seen = [];
  for (let k = 1; k <= 5; k++) {
    await pg.evaluate(k => { G.skillplay.demo(['ck_blend', 'spin', 'ck_chop', 'punch', 'ck_stir'][k - 1], 2, { ctx: { recipe: 'berry_smoothie' } }); }, k); await pg.waitForTimeout(900);
    const tip = await pg.evaluate(() => { const t = document.querySelector('.mg .mg-tip'); return t ? t.textContent : ''; }); seen.push(tip ? 1 : 0);
    if (k === 2) { await A.shot('mg_tip'); const blocked = await pg.evaluate(() => { const t = document.querySelector('.mg .mg-tip'), c = document.querySelector('.mg .mg-cv'); if (!t || !c) return 'gone'; const a = t.getBoundingClientRect(), b = c.getBoundingClientRect(); return a.bottom > b.top + 1 ? 'covers the game' : G.modal ? 'modal' : ''; }); say(!blocked && /turn mini-games off in Settings/.test(tip), `hint on the 2nd game: "${tip}", above the sheet, the game runs under it ${blocked}`); }
    await A.tapText(/^Stop$/, '.mg .mg-x'); await pg.waitForTimeout(500);
  }
  const cnt = await pg.evaluate(() => { const n = G.skillplay.state().n; return [n.mgSeen, n.mgTip, JSON.parse(JSON.stringify(G.state.skillplay.n)).mgTip]; });
  say(seen.join('') === '01110' && cnt[1] === 3, `hint sequence over five games: ${seen.join(' ')} (want 0 1 1 1 0); counters in the save: seen ${cnt[0]}, shown ${cnt[1]}`);
  /* Auto on one of each: the usual result, no bonus */
  const cookOnce = async (id, how) => {
    await A.closeAll(); await pg.waitForFunction(() => !G.busy && !G.minigame.MG.cur, null, { timeout: 60000 }).catch(() => {});
    const name = await pg.evaluate(id => G.skillplay.recipe(id).name, id), n0 = await pg.evaluate(id => G.inv.fridge.count('meal_' + id) + G.inv.count('meal_' + id), id);
    await A.tapThing("/fridge/i.test(i.label) || (i.fx && i.fx.tags.includes('fridge'))"); await A.tapText(/^Make a No-Cook Dish/, '.modal .opt'); await pg.waitForTimeout(500);
    await A.tapText(/^All/, '.cook-win button').catch(() => {}); await pg.waitForTimeout(300); await A.tapText(new RegExp('^' + name), '.ck-row'); await pg.waitForTimeout(400);
    await A.tapText(/^(Cook|Make|Bake|Mix|Brew|Blend)\b/, '.ck-btns button'); await pg.waitForTimeout(1200);
    const open = await pg.evaluate(() => !!G.minigame.MG.cur); if (how === 'auto' && open) await A.tapText(/^Auto$/, '.mg .mg-auto');
    await pg.waitForFunction(() => !G.busy, null, { timeout: 90000 }).catch(() => {}); await pg.waitForTimeout(600);
    const n1 = await pg.evaluate(id => G.inv.fridge.count('meal_' + id) + G.inv.count('meal_' + id), id), serv = await pg.evaluate(id => G.skillplay.recipe(id).servings, id); await A.closeAll();
    return { open, made: n1 - n0, serv, name };
  };
  let r = await cookOnce('berry_smoothie', 'auto'); say(r.open && r.made === r.serv, `Auto (touch on the Auto button) on ${r.name}: game was open, the dish is made with the usual ${r.serv} serving(s) (got ${r.made})`);
  /* the Settings switch, by touch */
  await pg.evaluate(() => G.phone.open('settings')); await pg.waitForTimeout(900);
  await pg.evaluate(() => { const e = document.querySelector('[data-set="minigames"]'); e && e.scrollIntoView({ block: 'center' }); }); await pg.waitForTimeout(300); await A.shot('mg_settings');
  const chip = await pg.evaluate(() => { const e = [...document.querySelectorAll('[data-set="minigames"] *')].find(b => b.textContent.trim() === 'Off' && b.offsetWidth); if (!e) return null; const q = e.getBoundingClientRect(); return [q.left + q.width / 2, q.top + q.height / 2]; });
  say(!!chip, 'Settings has a Mini-games row with On / Off'); if (chip) await A.tap(chip[0], chip[1], 500);
  say(await pg.evaluate(() => G.skillplay.auto() === true), 'tapping Off turns mini-games off (G.skillplay.auto())'); await A.shot('mg_settings_off');
  await pg.evaluate(() => G.phone.close()); await pg.waitForTimeout(600);
  r = await cookOnce('garden_salad', 'off'); say(!r.open && r.made === r.serv, `mini-games off: ${r.name} cooks with no game and the usual ${r.serv} serving(s) (got ${r.made})`);
  await pg.evaluate(async () => { G.money.add(500, 'test'); try { G.inv.grant('gym', 2); } catch (e) { } await G.go('int:gym', { fresh: true }); await new Promise(r => setTimeout(r, 3000)); });
  await A.tapThing("i.fx && i.fx.asset.id === 'furn.gym.bike'"); await pg.waitForTimeout(300); await A.tapText(/^(15|10) min/, '.modal .opt'); await pg.waitForTimeout(1500);
  const g1 = await pg.evaluate(() => ({ open: !!G.minigame.MG.cur, act: G.busy && G.busy.actId, pose: G.player.pose })); say(!g1.open && g1.act === 'gym_bike' && g1.pose === 'cycle', `mini-games off: the bike runs as a plain activity (act ${g1.act}, anim ${g1.pose}, game open: ${g1.open})`);
  await pg.evaluate(() => { G.endActivity(false); G.skillplay.setAuto(false); }); await pg.waitForTimeout(600);
  await A.tapThing("i.fx && i.fx.asset.id === 'furn.gym.bike'"); await pg.waitForTimeout(300); await A.tapText(/^(15|10) min/, '.modal .opt'); await pg.waitForFunction(() => !!G.minigame.MG.cur, null, { timeout: 8000 }).catch(() => {});
  const f0 = await pg.evaluate(() => G.state.needs.fitness); await A.tapText(/^Auto$/, '.mg .mg-auto'); await pg.waitForFunction(() => !G.busy, null, { timeout: 90000 }).catch(() => {}); await pg.waitForTimeout(500);
  const g2 = await pg.evaluate(() => ({ best: G.skillplay.best('spin'), fit: G.state.needs.fitness })); say(!g2.best || !g2.best.n, `switch back On, then Auto on the bike: the ride finishes, no game result recorded (fitness ${(+f0).toFixed(2)} -> ${(+g2.fit).toFixed(2)})`);
  say(!A.errs.length, `rules: zero page errors ${A.errs.slice(0, 3).join(' | ')}`); await A.ctx.close();
}

/* ====================================================================== 4. the fake gamepad ====================================================================== */
if (on('pad')) {
  const P = await openGame({ url: '?scene=city' }), pg = P.pg; await pg.waitForTimeout(1500); await P.connect(); await P.press('ok'); await pg.waitForTimeout(400);
  const run = async (key, ctx) => {
    await pg.evaluate(([k, c]) => { window.__r = null; G.skillplay.demo(k, 2, { ctx: c }).then(r => { window.__r = r; }); }, [key, ctx || {}]); await pg.waitForTimeout(1100);
    let held = false; const t0 = Date.now();
    while (Date.now() - t0 < 60000) {
      const s = await pg.evaluate(() => { const m = G.minigame.MG.cur; if (!m) return null; const st = m.state(), w = st.want || {}; return { type: w.type, ready: !!w.ready, on: !!w.on, done: st.done, counting: st.counting }; }); if (!s) break;
      if (s.done || s.counting) { if (held) { held = false; await P.up('ok'); } await pg.waitForTimeout(50); continue; }
      if (s.type === 'hold') { if (s.on && !held) { held = true; await P.down('ok'); } else if (!s.on && held) { held = false; await P.up('ok'); } await pg.waitForTimeout(16); }
      else if (s.ready) { await P.down('ok'); await pg.waitForTimeout(45); await P.up('ok'); await pg.waitForTimeout(45); } else await pg.waitForTimeout(12);
    }
    if (held) await P.up('ok'); await pg.waitForTimeout(400); return pg.evaluate(() => window.__r);
  };
  for (const [key, ctx, what] of [['punch', null, 'targets: Confirm hits the lit spot'], ['ck_blend', { recipe: 'berry_smoothie' }, 'hold: Confirm held'], ['ck_build', { recipe: 'club_sandwich' }, 'sequence: Confirm places the next piece'], ['ck_oven', { recipe: 'choc_chip_cookies' }, 'golden: Confirm pressed'], ['row', null, 'stroke: Confirm held'], ['spin', null, 'cadence: Confirm pressed'], ['ck_stir', { recipe: 'tomato_soup' }, 'stir: Confirm held and released'], ['ck_chop', { recipe: 'garden_salad' }, 'sweep: Confirm pressed']]) {
    const r = await run(key, ctx); if (key === 'punch') await P.shot('mg_pad_done');
    say(r && !r.quit && !r.auto && r.score >= .5, `fake gamepad, ${key} (${what}): score ${r ? r.score.toFixed(2) : 'none'}, ${r ? r.stars : 0} stars`);
  }
  say(!P.errors.filter(e => /exception|error/i.test(e)).length, `pad: zero page errors ${P.errors.slice(0, 3).join(' | ')}`); await P.close();
}

await br.close(); srv.close(); console.log(bad ? `\n${bad} FAILED` : '\nall passed'); process.exit(bad ? 1 : 0);
