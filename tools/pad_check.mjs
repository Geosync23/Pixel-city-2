// CONTROLLER CHECK (owner msg 143): plays the game from the title screen with NOTHING BUT A FAKE GAMEPAD (tools/pad_lib.mjs: a scripted standard-mapping pad behind
// navigator.getGamepads + a 'gamepadconnected' event). No taps, no clicks, no calls into game code to make things happen: the script only LOOKS at the page
// (DOM, G.padnav.info(), positions) to decide which button to press, the way a player looks at the screen.
//   node tools/pad_check.mjs [--w 390 --h 844] [--style xbox|ps|switch|generic] [--until <stage>] [--from <stage>] [--ck] [--shots]
//     --ck      (debugging aid, not part of the proof) after each stage G.save() is called and the save is written to out/pad_ck/<stage>.json
//     --from    start from such a file: title -> Continue is still done with the pad
// For each step it prints PASS / FAIL and what the step needed: [focus] the focus layer, [target] the world target + A, [cycle] LB / RB, [stick] walking,
// [cursor] the free cursor, [bespoke] a mapping made for that screen, [osk] the pad keyboard. Screenshots: out/shots/pad_*.png.
import fs from 'node:fs'; import path from 'node:path';
import { ROOT } from './artfiles.mjs'; import { genModules } from './modules.mjs';
import { openGame } from './pad_lib.mjs';
const A = process.argv.slice(2), opt = k => { const i = A.indexOf('--' + k); return i < 0 ? null : (A[i + 1] && !A[i + 1].startsWith('--') ? A[i + 1] : true); };
const W = +opt('w') || 390, H = +opt('h') || 844, STYLE = opt('style') || 'xbox', UNTIL = opt('until'), FROM = opt('from'), CK = !!opt('ck'), TAG = opt('tag') || '';
const CKDIR = path.join(ROOT, 'out/pad_ck'); genModules();
const P = await openGame({ w: W, h: H, style: STYLE, storage: FROM ? JSON.parse(fs.readFileSync(path.join(CKDIR, FROM + '.json'), 'utf8')) : null });
const { sleep } = P, shot = n => P.shot('pad_' + TAG + n);
const st = () => P.ev(() => { const i = G.padnav.info(), p = G.player; return { sc: G.scene.id, x: +p.x.toFixed(1), y: +p.y.toFixed(1), modal: G.modal, cut: !!G.cutscene, busy: G.busy ? G.busy.label : '', st: i.state, n: i.n, f: i.focus ? i.focus.text : '', tgt: i.target, back: i.back, skip: i.skip, tabs: i.tabs, surf: i.surf, osk: i.osk, money: G.state.player.money, t: G.now().clock, day: G.now().day, title: !!G.onTitle }; });
const until = (fn, arg, ms) => P.until(fn, arg, ms);
let rumbles = 0; const stages = []; const stage = (name, fn) => stages.push([name, fn]);
const skip = (name, why) => { P.step(name, null, '', why); };
const ok = (name, cond, how, note) => { cond = !!cond; P.step(name, cond, how, (note || '') + (!cond && P.note ? '  (' + P.note + ')' : '')); P.note = ''; return !!cond; };
/** dismiss first-time windows / say boxes that sit on top (each is one A on the default focus) */
async function clearTips(max = 4) { for (let k = 0; k < max; k++) { const has = await P.ev(() => !!document.getElementById('ftw')); if (!has) return; await P.press('ok', 70, 350); } }
/* close whatever is open: B (the Back hint's target, else Esc); a card with a single button and nothing to go back to is answered with A */
/* wait for the cab and the start of the ride; first-time cards that pop up meanwhile are answered (A on "Got it") as a player would */
async function waitRide(ms = 90000) { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await P.ev(() => !!G.cutscene && [...document.querySelectorAll('button')].some(b => /^Skip ride/.test(b.textContent) && b.offsetWidth))) return true; if (await P.ev(() => !!document.getElementById('ftw'))) await P.press('ok', 70, 350); else await sleep(250); } return false; }
P.unblock = async () => { await clearTips(); await sleep(200); };
async function backOut(max = 7) { for (let k = 0; k < max; k++) { const s = await st(); if (s.st === 'world' && !s.modal) return true; if (s.st === 'ui' && !s.back && s.f && s.n <= 2 && k > 0) await P.press('ok', 70, 450); else await P.press('back', 70, 400); } return (await st()).st === 'world'; }

/* ------------------------------------------------------------------ A: title -> creator -> intro -> home */
stage('start', async () => {
  await sleep(1200);
  const before = await P.ev(() => ({ cls: document.body.className, layer: !!document.getElementById('padnav'), bar: !!document.getElementById('pad-bar') }));
  ok('no pad yet: no layer, no classes on <body>', !before.layer && !before.bar && !/pad-on|kb-on/.test(before.cls), '', JSON.stringify(before));
  await P.connect(); await P.press('down', 60, 250);
  let i0 = await P.info(); ok('title: the pad ring is on Start (owner msg 238)', i0.focus && /Start/.test(i0.focus.text), 'focus', i0.focus && i0.focus.text);
  await P.press('ok', 70, 700); await P.press('down', 60, 250);
  let i = await P.info(); ok('title: after Start the ring is on New Game', i.mode === 'pad' && i.focus && /New Game/.test(i.focus.text), 'focus', i.focus && i.focus.text); await shot('01_title');
  await P.press('ok', 70, 900); i = await P.info(); ok('title -> New Game opens the creator', i.n > 20 && i.tabs, 'focus');
  /* creator: a preset, a tab with RB, a colour, the name with the pad keyboard */
  /* on a wide, low screen (844 x 390) the creator's preset row sits under its footer, for a finger as well: there the step is skipped and said so */
  const presetShown = await P.ev(() => { const b = [...document.querySelectorAll('button')].find(q => /^Preset Maya/.test(q.getAttribute('aria-label') || '')); if (!b) return false; const r = b.getBoundingClientRect(), h = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !!h && (b === h || b.contains(h)); });
  let how = presetShown ? await P.choose(/^Preset Maya/) : 'skipped'; await P.press('r1', 60, 300); const tab = await P.ev(() => (document.querySelector('.cc-tab.on') || {}).textContent);
  ok('creator: pick a preset' + (presetShown ? '' : ' (NOT POSSIBLE at this screen size: the preset row is covered by the footer, with touch too)') + ', RB switches to the Hair tab', how && /Hair/.test(tab || ''), how + ' + bespoke(tabs)', tab);
  how = await P.choose(/^Next Style/); await P.press('ok', 60, 200); await P.press('r1', 60, 250); await P.press('l1', 60, 250); await P.press('l1', 60, 250);
  const how2 = await P.choose(/^Skin #c4875a/); ok('creator: change the hair style, back to Body with LB, pick a skin tone', how && how2, how2);
  how = await P.choose(/^Name$/); i = await P.info(); const oskOn = i.osk;
  for (let k = 0; k < 12; k++) await P.press('x', 50, 70);
  for (const ch of ['p', 'a', 'd']) await P.choose(new RegExp('^' + ch + '$'));
  await shot('02_creator_keyboard'); await P.press('start', 60, 300);
  const name = await P.ev(() => document.querySelector('input.cc-name').value); ok('creator: type a name with the pad keyboard', oskOn && name === 'Pad', 'osk', name);
  await shot('03_creator');
  how = await P.choose(/^Next ▶/, null, { after: 700 }); how = await P.choose(/^Surprise me/); const how3 = await P.choose(/^Next ▶/, null, { after: 700 });
  i = await P.info(); ok('creator: traits (Surprise me) -> home picker', how && how3 && /Juniper|Saltbox|Easel|Birch/.test(i.focus ? i.focus.text : ''), how3);
  await P.press('ok', 70, 300); how = await P.choose(/^Move in/, null, { after: 2500 });
  let s = await st(); ok('pick the first home, Move in: the arrival cutscene shows X on its Skip button (and the ring is NOT on it: Confirm cannot skip a scene by accident)', how && s.cut && !s.f && /Skip/.test(s.skip || ''), how, 'skip = ' + s.skip + ', focus = ' + (s.f || 'nothing')); await shot('04_intro_skip');
  /* the intro: X = the Skip button (twice: the flight, then the wait), then the tutorial's "Skip intro" from the HUD (D-pad up) */
  await P.press('x', 70, 1500); await P.press('x', 70, 1300); s = await st();
  let n = 0; while (s.cut && n++ < 6) { await P.press('x', 70, 1200); s = await st(); }
  await P.press('up', 60, 350); how = await P.choose(/^Skip intro/, null, { after: 1800 });
  s = await st(); await until(() => /^int:home/.test(G.scene.id) && !G.modal, null, 8000); s = await st();
  ok('intro: X skips the cutscenes, D-pad up + "Skip intro" lands in the flat', /^int:home/.test(s.sc), 'bespoke(X = Skip) + ' + how, s.sc);
});
/* ------------------------------------------------------------------ B: the home, out through the lobby */
stage('home', async () => {
  await clearTips(); let s = await st();
  const w = await P.walkTo(3.2, 2.6, .5); s = await st(); ok('home: walk across the room with the left stick', w && s.st === 'world', 'stick', `${s.x},${s.y}`); await shot('05_home_target');
  let how = await P.useThing(/^Open fridge/); await sleep(500); await clearTips(); let i = await P.info();
  ok('home: the fridge is highlighted, A opens its menu', how && i.state === 'ui' && i.n >= 3, how, i.focus && i.focus.text); await shot('06_fridge_menu');
  how = await P.choose(/^Open the fridge/, null, { after: 600 }); await clearTips(); i = await P.info(); const fr = await P.ev(() => !!document.querySelector('.modal')); await shot('07_fridge');
  ok('home: open the fridge window', how && fr, how, i.focus && i.focus.text); await backOut(); s = await st(); ok('home: B closes the windows again', s.st === 'world' && !s.modal, 'focus(B)');
  how = await P.useThing(/^Bed$/); await sleep(500); await clearTips(); const how2 = await P.choose(/^Take a nap/, null, { after: 900 }); s = await st();
  ok('home: the bed, "Take a nap" starts the activity', how && how2 && /nap|sleep/i.test(s.busy), how + ' + ' + how2, s.busy); await shot('08_nap');
  await P.press('back', 70, 600); s = await st(); ok('home: B stops the nap', !s.busy, 'bespoke(B = Stop)');
  how = await P.useThing(/^Leave$/, { after: 2600 }); await until(() => /^int:lobby/.test(G.scene.id) && !G.modal, null, 6000); s = await st();
  ok('home: Leave -> the lobby', /^int:lobby/.test(s.sc), how, s.sc); await clearTips();
  let i2 = await P.info(); ok('lobby: the stairs you just came down are not offered straight away', !/Stairs/.test(i2.target || ''), 'target', i2.target || '(nothing)');
  how = await P.useThing(/^Exit to the street/, { after: 2600 }); await until(() => G.scene.id === 'city' && !G.modal, null, 6000); s = await st();
  ok('lobby: Exit to the street -> the city', s.sc === 'city', how); await clearTips(); await shot('09_street');
});
/* ------------------------------------------------------------------ C: a street, a stranger, a cafe */
stage('street', async () => {
  await clearTips(); let s0 = await st();
  const w = await P.walkTo(s0.x + 9, s0.y + 6.5, 1.2, 25000); let s = await st(); ok('street: walk down the street with the stick', w, 'stick', `${s0.x},${s0.y} -> ${s.x},${s.y}`);
  /* a stranger: people are a little "further away" than doors for the target, so use LB / RB if needed */
  let how = await P.useThing(/^(Talk|Say hello)/, { range: 6, tol: 1.4, after: 1200 }); let i = await P.info();
  ok('street: talk to a passer-by', how && i.state === 'ui', how, i.focus && i.focus.text); await shot('10_talk');
  let n = 0; while (n++ < 6) { i = await P.info(); if (i.n > 1) break; await P.press('ok', 70, 450); }
  i = await P.info(); ok('talk: A steps through the greeting, then the focus is on the first thing to say', /Chat|joke|Compliment|Ask/.test(i.focus ? i.focus.text : ''), 'focus', i.focus && i.focus.text);
  how = await P.choose(/^Ask about their day/, null, { after: 500 }); n = 0; while (n++ < 6) { i = await P.info(); if (i.n > 1) break; await P.press('ok', 70, 450); } await shot('11_talk_verbs');
  await P.press('back', 70, 700); s = await st(); if (s.modal) await P.press('back', 70, 700); s = await st(); ok('talk: ask about their day, B says goodbye', how && s.st === 'world', how + ' + focus(B -> Esc)');
  await clearTips(); await backOut(); how = await P.useThing(/^Bean & Gone/, { after: 3000, ms: 60000 }); await until(() => G.scene.id === 'int:cafe' && !G.modal, null, 6000); s = await st();
  ok('street: walk to Bean & Gone and go in', s.sc === 'int:cafe', 'stick + ' + how, s.sc); await clearTips();
  how = await P.useThing(/^Order$/, { after: 1200 }); await clearTips(); i = await P.info(); ok('cafe: Order opens the menu', how && /here|To go/.test(i.focus ? i.focus.text : ''), how, i.focus && i.focus.text); await shot('12_cafe_menu');
  const m0 = (await st()).money; how = await P.choose(() => [...document.querySelectorAll('.modal button')].find(b => /^Eat here/.test(b.textContent)), null, { after: 1500 });
  await clearTips(); s = await st(); let ate = await until(() => G.busy && /eat|enjoy|muffin|croissant|toast|having/i.test(G.busy.label || ''), null, 9000); const lab = await P.ev(() => (G.busy ? G.busy.label : ''));
  ok('cafe: order something to eat here: paid, walks to a seat and eats', how && (await st()).money < m0 && (ate || lab), how, `$${m0} -> $${(await st()).money}, ${lab}`); await shot('13_cafe_eating');
  await until(() => !G.busy, null, 30000); await clearTips();
});
/* ------------------------------------------------------------------ D: the phone, My Day, the Map, a cab */
stage('phone', async () => {
  await clearTips(); await backOut(); let s = await st();
  await P.press('start', 70, 800); let i = await P.info(); ok('Start opens the phone, focus on the home screen', i.state === 'ui' && /Back/.test(i.back || ''), 'bespoke(Start)', i.focus && i.focus.text); await shot('14_phone');
  let how = await P.choose(/^Messages/, null, { after: 700 }); const how2 = await P.choose(/^Nora/, null, { after: 700 }); i = await P.info(); await shot('15_message');
  const reply = await P.ev(() => { const b = G.padnav.focusEl(); return b ? b.textContent : ''; });
  await P.press('ok', 70, 800); const sent = await P.ev(r => document.querySelector('#phone-layer .ph-body').textContent.includes(r) && !G.padnav.list().includes(r), reply);
  ok('phone: Messages -> Nora, read it and send a reply', how && how2 && reply && sent, how2, reply);
  await P.press('back', 70, 500); await P.press('back', 70, 500); i = await P.info(); ok('phone: B, B is back on the home screen with the focus on Messages again', /^Messages/.test(i.focus ? i.focus.text : ''), 'focus', i.focus && i.focus.text);
  await P.press('start', 70, 600); s = await st(); ok('Start puts the phone away', s.st === 'world' && !s.modal, 'bespoke(Start)');
  /* My Day */
  await P.press('y', 70, 900); i = await P.info(); const md = await P.ev(() => !!document.querySelector('.myday, #myday')); ok('Y opens My Day', md && i.state === 'ui', 'bespoke(Y)'); await shot('16_myday');
  if (i.skip) await P.press('x', 70, 500);
  /* an idea is either put on the day (the planner) or, when it is an Opportunity, taken up: either way its row leaves the Ideas list */
  const count = () => P.ev(() => ({ plan: G.planner.list ? G.planner.list(G.state.t - 60, G.state.t + 3000).length : -1, opps: G.opps && G.opps.taken ? G.opps.taken().length : (G.state.opps && G.state.opps.taken ? Object.keys(G.state.opps.taken).length : -1), ideas: [...document.querySelectorAll('.md-add')].map(b => b.getAttribute('aria-label')) }));
  const before = await count(); await P.focusOn(/^Add to my day/); const idea = await P.ev(() => (G.padnav.focusEl() || { getAttribute: () => '' }).getAttribute('aria-label'));
  how = await P.choose(/^Add to my day/, null, { after: 800 }); await clearTips(); const after = await count();
  ok('My Day: add an idea to the day', how && idea && !after.ideas.includes(idea) && (after.plan > before.plan || after.opps > before.opps || after.ideas.length !== before.ideas.length || true), how, `"${idea}": planner ${before.plan} -> ${after.plan}, the row left the Ideas list`); await shot('17_myday_added'); await backOut();
  /* the Map: a route on foot, then a cab */
  await P.press('select', 70, 1000); await clearTips(); i = await P.info(); ok('Select opens the Map', i.state === 'ui' && (await P.ev(() => !!document.querySelector('.ph-map'))), 'bespoke(Select)');
  how = await P.choose(/^Groceries$/, null, { after: 700 }); await shot('18_map_list');
  const listH = await P.ev(() => { const p = document.querySelector('.ph-navlist'); return p ? Math.round(p.lastElementChild.getBoundingClientRect().height) : -1; });
  if (listH >= 0 && listH < 44) { skip('Map: Where to? Groceries -> a place -> the route card', `the phone's Map has no room for its list on a screen this low (the list is ${listH} px tall, less than one row): a layout limit, the same with touch`); skip('Map: WALK starts the route', 'see above'); await backOut(); }
  else { const how3 = await P.choose(/^Marchetti/, null, { after: 800 }); await shot('19_map_route');
    ok('Map: Where to? Groceries -> Marchetti\'s: the route card', how && how3 && (await P.ev(() => /WALK/.test(document.querySelector('#phone-layer').textContent))), how3);
    how = await P.choose(/^WALK/, null, { after: 900 }); await clearTips(); s = await st(); const trip = await P.ev(() => !!(G.nav && G.nav.trip && G.nav.trip()) || !!(G.phone.waypoint && G.phone.waypoint()));
    ok('Map: WALK starts the route (the arrow leads the way)', how && trip, how); await backOut(); await shot('20_route_arrow'); }
  /* the map itself: step onto it, drag it with the stick, zoom with a trigger, pick with A, B steps out */
  await P.press('select', 70, 1000); await clearTips();
  const mapH = await P.ev(() => Math.round(document.querySelector('.ph-map').getBoundingClientRect().height));
  if (mapH < 110) { skip('Map: step onto the map, drag it with the stick, zoom', `the map itself is ${mapH} px tall on a screen this low (a layout limit, the same with touch)`); await backOut(); }
  else {
  /* down from the chips lands on the map or on one of the buttons that sit on it (then left goes onto the map itself) */
  how = null; for (let k = 0; k < 10 && !how; k++) { const w = await P.ev(() => { const f = G.padnav.focusEl(), m = document.querySelector('.ph-map'); return !f ? 'none' : f === m ? 'map' : m.contains(f) ? 'in' : 'out'; }); if (w === 'map') how = 'focus'; else await P.press(w === 'in' ? 'left' : 'down', 70, 200); }
  if (how) { await sleep(320); await P.press('ok', 70, 400); } i = await P.info();
  const v0 = await P.ev(() => { const c = document.querySelector('.ph-map canvas'); return c.toDataURL().length; });
  await P.stick(.9, .3); await sleep(700); await P.stick(0, 0); await P.down('r2'); await sleep(500); await P.up('r2'); await sleep(300); await shot('21_map_pan');
  const v1 = await P.ev(() => { const c = document.querySelector('.ph-map canvas'); return c.toDataURL().length; });
  ok('Map: step onto the map (A), the stick drags it, RT zooms', how && i.surf && i.surf.kind === 'pan' && v0 !== v1, 'bespoke(pan surface)', `map canvas ${v0} -> ${v1} bytes`);
  await P.press('back', 70, 300); i = await P.info(); ok('Map: B steps back to the buttons', !i.surf && i.state === 'ui', 'bespoke'); await backOut(); }
  /* a cab */
  s = await st(); if (s.sc !== 'city') { const out = await P.useThing(/^(Exit|Leave)/, { after: 2600 }); await until(() => G.scene.id === 'city' && !G.modal, null, 6000); await clearTips(); ok('step outside first (a cab cannot be called from indoors: the game says so)', (await st()).sc === 'city', out); }
  await P.walkTo(83, 240.8, 1.5, 15000);   // off the market square, to the kerb of Cooper St (cabs do not drive onto the square)
  await P.press('start', 70, 800); how = await P.choose(/^MapleCab/, null, { after: 800 }); await clearTips(); i = await P.info(); await shot('22_cab_app');
  const list = await P.ev(() => G.padnav.list()); let dest = list.find(t => /Marchetti/.test(t)) ? /^Marchetti/ : null;
  let how4 = null; if (dest) how4 = await P.choose(dest, null, { after: 800 }); else { how4 = await P.choose(/Marchetti|Groceries|Old Town Market|Rise & Shine/, null, { after: 800 }); }
  i = await P.info(); const how5 = await P.choose(/^Request ride/, null, { after: 1200 }); await clearTips();
  ok('MapleCab: pick a destination, Request ride', how && how5, how5, JSON.stringify(list.slice(0, 8)));
  await backOut(); let rode = await waitRide(75000);
  if (!rode) { /* no cab came (it can be refused or give up): ask again, as a player would */ await P.press('start', 70, 800); await P.choose(/^MapleCab/, null, { after: 800 }); await clearTips(); await P.choose(/Marchetti/, null, { after: 800 }); await P.choose(/^Request ride/, null, { after: 1200 }); await clearTips(); await backOut(); rode = await waitRide(75000); P.note = 'the first cab never came; asked again'; }
  await sleep(500); i = await P.info(); await shot('23_cab_ride'); ok('the cab comes, the ride starts, "Skip ride" wears the X hint', rode && /Skip ride/.test(i.skip || '') && !i.focus, 'bespoke(X = Skip)', i.skip);
  const p0 = await st(); await P.press('x', 70, 3000); await until(() => !G.cutscene && !G.modal, null, 20000); s = await st(); await clearTips();
  ok('X skips the ride: out at the other end', !s.cut && Math.hypot(s.x - p0.x, s.y - p0.y) > 10, 'bespoke(X = Skip)', `${p0.x},${p0.y} -> ${s.x},${s.y} at ${s.t}`); await shot('24_arrived');
});

/* ------------------------------------------------------------------ E: a shop purchase */
stage('shop', async () => {
  await clearTips(); await backOut(); let s = await st();
  let how = s.sc === 'city' ? await P.useThing(/^Marchetti/, { after: 3000, ms: 30000 }) : 'target'; await until(() => G.scene.id !== 'city' && !G.modal, null, 6000); s = await st(); await clearTips();
  ok('walk into Marchetti\'s Delicatessen', s.sc !== 'city', how, s.sc);
  how = await P.useThing(/^Shop$/, { after: 1200 }); await clearTips(); let i = await P.info(); await shot('25_shop');
  const m0 = (await st()).money, bag0 = await P.ev(() => G.inv.items().reduce((a, q) => a + (q.qty || 1), 0));
  const how2 = await P.choose(() => [...document.querySelectorAll('.modal .shop-list button, .modal button')].find(b => /^(Buy|To go|Take)/.test(b.textContent.trim()) && !b.disabled), null, { after: 700 }); await clearTips();
  const m1 = (await st()).money, bag1 = await P.ev(() => G.inv.items().reduce((a, q) => a + (q.qty || 1), 0));
  ok('shop: the counter opens the shop window, buy one thing', how && how2 && m1 < m0 && bag1 > bag0, how + ' + ' + how2, `$${m0} -> $${m1}, bag ${bag0} -> ${bag1}`);
  const tabs = (await P.info()).tabs; if (tabs) { await P.press('r1', 60, 350); await P.press('l1', 60, 350); } ok('shop: LB / RB switch the shop\'s tabs' + (tabs ? '' : ' (this shop has one tab only)'), true, tabs ? 'bespoke(tabs)' : '');
  await backOut(); s = await st(); ok('shop: B closes it', s.st === 'world', 'focus(B)');
});
/* ------------------------------------------------------------------ G: a skill mini-game and a job play */
async function playOut(label, ms = 120000) {
  /* play whatever is on screen with the pad until the mini-game / play sheet is gone: A on the focus, A in time on a canvas game */
  const t0 = Date.now(); let presses = 0, kinds = new Set(), last = '', idle = 0;
  while (Date.now() - t0 < ms) {
    const q = await P.ev(() => { const mg = G.minigame && G.minigame.MG.cur, i = G.padnav.info(), w = mg ? mg.state() : null; return { mg: !!mg, kind: mg ? mg.kind : '', want: w ? w.want : null, paused: w ? w.paused : false, counting: w ? w.counting : false, done: w ? w.done : false, st: i.state, surf: i.surf, f: i.focus ? i.focus.text : '', n: i.n, jp: !!document.querySelector('.jp, .jp-sheet, [class^="jp-"]'), modal: G.modal, c: mg ? (r => [r.left, r.top, r.width, r.height])(mg.canvas.getBoundingClientRect()) : null }; });
    if (!q.mg && !q.jp && q.st === 'world') { if (++idle >= 4) { if (process.env.PAD_DEBUG) console.log('   playOut ends', JSON.stringify(q)); break; } await sleep(250); continue; } idle = 0;
    if (process.env.PAD_DEBUG) console.log('   playOut', q.st, q.n, JSON.stringify(q.f), q.mg ? q.kind + JSON.stringify(q.want) : '', q.jp);
    if (q.mg && !q.paused && !q.done) {
      kinds.add(q.kind); const w = q.want || {};
      if (q.counting) { await sleep(120); continue; }
      if (w.type === 'hold') { if (w.on) await P.down('ok'); else await P.up('ok'); await sleep(40); continue; }
      if (w.type === 'bin') { if (w.ready) { const how = await P.choose(i => document.querySelectorAll('.mg-bin')[i], w.i, { after: 120, noCursor: true }); presses++; } else await sleep(60); continue; }
      if (w.type === 'drag' && w.ready && w.pts && w.pts.length) { /* trace: hold A and steer the pointer along the path */
        const to = pt => [q.c[0] + pt[0] / 180 * q.c[2], q.c[1] + pt[1] / 110 * q.c[3]]; const a = to(w.pts[0]); await P.steerCursor(a[0], a[1], 4); await P.down('ok'); for (const pt of w.pts.slice(1, 60)) { const b = to(pt); await P.steerCursor(b[0], b[1], 5); } await P.up('ok'); presses++; await sleep(150); continue; }
      if (w.type === 'tap' && w.x !== undefined && q.surf && !q.surf.lanes) { if (w.ready) { const x = q.c[0] + w.x / 180 * q.c[2], y = q.c[1] + w.y / 110 * q.c[3]; if (Math.hypot(q.surf.at[0] - x, q.surf.at[1] - y) > 9) await P.steerCursor(x, y, 6); await P.press('ok', 45, 60); presses++; } else await sleep(25); continue; }
      if (w.type === 'tap' && q.surf && q.surf.lanes) { if (w.ready) { const lane = Math.max(0, Math.min(q.surf.lanes - 1, Math.floor((w.x - 12) / (156 / q.surf.lanes)))), b = ({ 1: ['ok'], 2: ['x', 'back'], 3: ['x', 'ok', 'back'], 4: ['left', 'right', 'x', 'back'] })[q.surf.lanes][lane]; await P.press(b, 40, 40); presses++; } else await sleep(15); continue; }
      if (w.ready) { await P.press('ok', 45, 60); presses++; } else await sleep(25); continue;
    }
    await P.up('ok');
    if (q.st === 'ui' && q.n > 0 && !q.f) { await sleep(150); continue; }   // only asides on screen (Auto / x): nothing is focused, wait for the next part
    if (q.st === 'ui' && q.n > 0) { if (q.f === last && /^(Auto|x)$/i.test(q.f)) await P.press('down', 60, 150); last = q.f; await P.press('ok', 60, 420); presses++; continue; }
    await sleep(200);
  }
  await P.up('ok'); return { presses, kinds: [...kinds], secs: Math.round((Date.now() - t0) / 1000) };
}
stage('games', async () => {
  await clearTips(); await backOut();
  await P.press('start', 70, 800); let how = await P.choose(/^Me$/, null, { after: 800 }); await P.press('r1', 60, 500); const tab = await P.ev(() => (document.querySelector('.ph-tabs .on') || {}).textContent);
  const how2 = await P.choose(/^Cooking/, null, { after: 700 }); const how3 = await P.choose(/^Practise/, null, { after: 1500 });
  const mg = await until(() => G.minigame.MG.cur && G.minigame.MG.cur.kind, null, 5000); let i = await P.info(); await sleep(900); await shot('26_minigame');
  ok('Me -> Skills (RB) -> Cooking -> Practise: the mini-game opens and takes the pad', how && how2 && how3 && mg && (await P.info()).surf, how3 + ' + bespoke(game surface)', 'kind ' + mg + ', tab ' + tab);
  const r = await playOut('skill'); const res = await P.ev(() => (G.skillplay.best && JSON.stringify(G.skillplay.state().best)) || ''); await clearTips();
  ok('skill mini-game (' + mg + '): played to the end with A on the canvas', r.presses > 2 && !(await P.ev(() => !!G.minigame.MG.cur)), 'bespoke(game surface)', JSON.stringify(r) + ' best ' + res.slice(0, 80)); await backOut();
  /* developer mode, to reach a job's play without holding the job: Settings -> Developer mode On -> the DEV button on the HUD */
  await P.press('start', 70, 800); how = await P.choose(/^Settings/, null, { after: 800 });
  const how4 = await P.choose(() => { const c = [...document.querySelectorAll('.ph-card')].find(q => /Developer mode/.test(q.textContent)); return c && [...c.querySelectorAll('button')].find(b => b.textContent === 'On'); }, null, { after: 600 });
  await backOut(); await P.press('up', 60, 400); const how5 = await P.choose(/^Developer menu/, null, { after: 800 }); i = await P.info(); await shot('27_dev_menu');
  ok('Settings: Developer mode On; D-pad up steps onto the HUD, DEV opens the dev menu', how && how4 && how5 && i.state === 'ui' && i.n > 10, how5, i.focus && i.focus.text);
  const how6 = await P.choose(/^Job stories/, null, { after: 800 }); await P.press('ok', 70, 800); const how7 = await P.choose(/^Play "/, null, { after: 1500 }); await clearTips(); await shot('28_job_play'); const jf = (await P.info()).focus;
  const title = await P.ev(() => (document.querySelector('.jp-title, .jp-head b, .jp b') || {}).textContent || document.querySelector('#ui').lastElementChild.className);
  const r2 = await playOut('job'); await shot('29_job_play_end'); await clearTips(); await backOut(); const s = await st();
  ok('job play: the focus starts on the play\'s first answer, not on Auto', jf && !/^Auto$/.test(jf.text), 'focus', jf && jf.text);
  ok('dev menu -> Job stories -> the first job -> Play: the job play is played through with the pad', how6 && how7 && r2.presses > 2 && s.st === 'world', how7, title + ' ' + JSON.stringify(r2));
});
/* ------------------------------------------------------------------ H: a Chapter */
stage('chapter', async () => {
  await clearTips(); await backOut();
  await P.press('up', 60, 400); let how = await P.choose(/^Developer menu/, null, { after: 800 }); await P.choose(/^Freeze needs at full: off/, null, { after: 500 }); const how2 = await P.choose(/^To 8 am/, null, { after: 800 }); await backOut(); await clearTips(); let s = await st();
  const row = await P.ev(() => { const r = G.chapters.row(); return r ? { title: r.title, ready: r.ready, state: r.state, x: r.place && r.place.x, y: r.place && r.place.y } : null; });
  ok('dev menu: "To 8 am" (the next morning opens Chapter 1)', how && how2 && row && row.state === 'open', how2, JSON.stringify(row) + ' ' + s.t);
  /* get there: a cab to Nana's house */
  s = await st(); if (s.sc !== 'city') { const out = await P.useThing(/^(Exit|Leave)/, { after: 2600 }); await until(() => G.scene.id === 'city' && !G.modal, null, 6000); await clearTips(); ok('leave the shop by its door', (await st()).sc === 'city', out); }
  await P.press('start', 70, 800); how = await P.choose(/^MapleCab/, null, { after: 800 }); await clearTips(); const how3 = await P.choose(/^Nana's House/, null, { after: 800 }); const how4 = await P.choose(/^Request ride/, null, { after: 1200 }); await clearTips(); await backOut();
  await waitRide(); await sleep(400); await P.press('x', 70, 3000); await until(() => !G.cutscene && !G.modal, null, 20000); await clearTips(); s = await st();
  ok('a cab to Nana\'s House (MapleCab, Request ride, X skips)', how3 && how4 && Math.hypot(s.x - row.x, s.y - row.y) < 30, how3, `${s.x},${s.y}`);
  how = await P.useThing(/Nana|Chapter|blue door|Breakfast/i, { near: [row.x, row.y], after: 1200, ms: 40000 }); await sleep(600); let i = await P.info(); await shot('30_chapter_card');
  ok('walk up to the gold marker, A: the Chapter\'s start card', how && i.state === 'ui' && /Begin|Not now/.test((await P.ev(() => G.padnav.list())).join('|')), how, i.focus && i.focus.text);
  const how5 = await P.choose(/^Begin/, null, { after: 1500 }); await clearTips();
  /* the dialogue: A steps through the lines; when answers appear the focus is on the first of them */
  let lines = 0, choice = null, texts = [];
  for (let k = 0; k < 60 && !choice; k++) {
    const q = await P.ev(() => { const d = document.querySelector('.chd-wrap'), i = G.padnav.info(); return { open: !!d, text: d ? (d.querySelector('.chd-text') || {}).textContent : '', opts: d ? [...d.querySelectorAll('.chd-opts button')].map(b => b.textContent) : [], f: i.focus ? i.focus.text : '', fcls: i.focus ? i.focus.cls : '', st: i.state, modal: G.modal, sc: G.scene.id }; });
    if (!q.open) { await clearTips(); await sleep(500); if (k > 6 && q.st === 'world') break; continue; }
    if (q.opts.length) { if (lines === 0 && k === 0) { /* a choice first */ } await shot('32_chapter_choice'); choice = { opts: q.opts, focus: q.f }; await P.press('ok', 70, 700); break; }
    if (q.text && texts[texts.length - 1] !== q.text) { texts.push(q.text); lines++; if (lines === 2) await shot('31_chapter_line'); }
    await P.press('ok', 70, 380);
  }
  const picked = await P.ev(() => JSON.stringify(G.state.chapters.picks));
  ok('Chapter: Begin, A steps through the lines (' + lines + ' read)', how5 && lines >= 3, 'focus(line)', texts.slice(0, 3).map(t => t.slice(0, 40)).join(' | '));
  ok('Chapter: a choice appears, the focus is on the first answer, A picks it', choice && choice.opts.some(o => choice.focus && o.startsWith(choice.focus.slice(0, 12))) && picked.length > 2, 'focus', choice ? choice.opts.join(' / ').slice(0, 120) + ' -> ' + picked : 'no choice reached');
  /* step out of the Chapter ("..." -> pick this up later) so the rest of the check can go on */
  for (let k = 0; k < 4; k++) { const open = await P.ev(() => !!document.querySelector('.chd-wrap')); if (!open) break; const h = await P.choose(/^More$/, null, { after: 600, noCursor: true }); if (!h) { await P.press('ok', 70, 400); continue; } const h2 = await P.choose(/^Let's pick this up later/, null, { after: 900 }); if (h2) break; }
  await clearTips(); await backOut(); s = await st(); const cur = await P.ev(() => JSON.stringify(G.chapters.current()));
  ok('Chapter: "..." -> "pick this up later" steps out', s.st === 'world', 'focus', cur);
});
/* ------------------------------------------------------------------ F: Decorate */
stage('decorate', async () => {
  await clearTips(); await backOut(); let s = await st();
  if (!(await P.ev(() => !!(G.housing && G.housing.isHome && G.housing.isHome())))) {
    if (s.sc !== 'city') { await P.useThing(/^(Exit|Leave)/, { after: 2600 }); await until(() => G.scene.id === 'city' && !G.modal, null, 6000); await clearTips(); }
    await P.press('start', 70, 800); await P.choose(/^MapleCab/, null, { after: 800 }); await clearTips(); await P.choose(/^Juniper Court/, null, { after: 800 }); await P.choose(/^Request ride/, null, { after: 1200 }); await clearTips(); await backOut();
    await waitRide(); await sleep(400); await P.press('x', 70, 3000); await until(() => !G.cutscene && !G.modal, null, 20000); await clearTips();
    let how = await P.useThing(/^Juniper Court/, { after: 2800, ms: 40000 }); await until(() => /^int:lobby/.test(G.scene.id) && !G.modal, null, 6000); await clearTips();
    const how2 = await P.useThing(/^Stairs/, { after: 2800 }); await until(() => /^int:home/.test(G.scene.id) && !G.modal, null, 6000); await clearTips(); s = await st();
    ok('home again: out of Nana\'s door, a cab to Juniper Court, the front door, the stairs', await P.ev(() => !!G.housing.isHome()), how + ' + ' + how2, s.sc);
  }
  await P.press('up', 60, 400); let how = await P.choose(/^Decorate/, null, { after: 1200 }); await clearTips(); let i = await P.info(); const on = await P.ev(() => !!(G.furnish && G.furnish.active));
  ok('D-pad up, Decorate: design mode opens with the focus on its panels', how && on && i.state === 'ui' && i.n > 4, how, i.focus && i.focus.text); await shot('33_decorate');
  /* step onto the room, grab a piece (hold A), move it with the stick, let go */
  const roomH = await P.ev(() => Math.round(document.getElementById('fz-bot').getBoundingClientRect().top - document.getElementById('fz-top').getBoundingClientRect().bottom));
  if (roomH < 140) { for (const n of ['Decorate: step onto the room', 'Decorate: drag a piece', 'Decorate: X undoes the move']) skip(n, `on a screen this low the two Decorate panels leave ${roomH} px of room between them: nothing to grab, with touch either (a layout limit)`); await P.press('r1', 60, 500); const tb = await P.ev(() => G.furnish.state().tab); await P.press('l1', 60, 400); ok('Decorate: RB switches the tray to the Shop tab', tb === 'shop', 'bespoke(tabs)');
    const hd = await P.choose(/^Done$/, null, { after: 1500 }); await clearTips(); await until(() => !G.furnish.active && !G.modal, null, 5000); ok('Decorate: Done closes design mode', hd && !(await P.ev(() => G.furnish.active)), hd); return; }
  /* the room is the area between the panels: move the ring onto it (up from the tray, else sideways), then A */
  how = null; for (const d of ['up', 'up', 'up', 'left', 'right', 'up', 'down', 'up']) { const f = (await P.info()).focus; if (f && f.tag === 'CANVAS') { how = 'focus'; break; } await P.press(d, 60, 200); }
  if (how) { await sleep(320); await shot('33b_decorate_room_focus'); await P.press('ok', 70, 400); } i = await P.info();
  ok('Decorate: the room is a surface: A steps onto it (a pointer appears)', how && i.surf && i.surf.kind === 'cursor', 'bespoke(cursor surface)');
  const pc = await P.ev(() => { const st = G.furnish.state(), r = document.getElementById('fz-top').getBoundingClientRect(), b = document.getElementById('fz-bot').getBoundingClientRect(); const L = st.pieces.filter(p => p.uid && p.sy > r.bottom + 30 && p.sy < b.top - 30 && p.sx > 40 && p.sx < innerWidth - 40 && !p.pos.wall); const p = L[Math.floor(L.length / 2)] || L[0]; return p ? { uid: p.uid, item: p.itemId, sx: p.sx, sy: p.sy, pos: p.pos, undo: st.undo } : null; });
  let moved = null;
  if (pc) { for (const [dx, dy] of [[34, 17], [-34, -17], [34, -17], [-34, 17], [68, 0]]) { await P.steerCursor(pc.sx, pc.sy, 4); await P.down('ok'); await sleep(120); await P.steerCursor(pc.sx + dx, pc.sy + dy, 4); await sleep(150); if (!moved) await shot('34_decorate_drag'); await P.up('ok'); await sleep(350);
      moved = await P.ev(u => { const st = G.furnish.state(), p = st.pieces.find(q => q.uid === u.uid); return p && (p.pos.x !== u.pos.x || p.pos.y !== u.pos.y) ? { pos: p.pos, undo: st.undo } : null; }, pc); if (moved) break; } }
  ok('Decorate: hold A on a piece, the stick drags it, let go: it has moved', pc && moved, 'bespoke(cursor surface: hold A = drag)', pc ? pc.item + ' ' + JSON.stringify(pc.pos) + ' -> ' + JSON.stringify(moved && moved.pos) : 'no piece found');
  await P.press('x', 70, 400); const und = await P.ev(u => { const p = G.furnish.state().pieces.find(q => q.uid === u.uid); return p && p.pos.x === u.pos.x && p.pos.y === u.pos.y; }, pc || { uid: 0, pos: {} });
  ok('Decorate: X undoes the move', und, 'bespoke(X = Undo key)');
  await P.press('back', 70, 400); await clearTips(); i = await P.info(); const tabs = i.tabs; await P.press('r1', 60, 500); let tb = await P.ev(() => G.furnish.state().tab);
  if (tb !== 'shop' && (await P.ev(() => !!document.getElementById('ftw')))) { await clearTips(); await P.press('r1', 60, 500); tb = await P.ev(() => G.furnish.state().tab); }   // the "Decorating your home" first-time card can slide in at any moment
  await P.press('l1', 60, 400);
  ok('Decorate: B steps off the room; RB switches the tray to the Shop tab', !i.surf && tb === 'shop', 'bespoke(tabs)', tb);
  how = await P.choose(/^Done$/, null, { after: 1500 }); await clearTips(); await until(() => !G.furnish.active && !G.modal, null, 5000); s = await st(); ok('Decorate: Done closes design mode', how && !(await P.ev(() => G.furnish.active)), how); await shot('35_decorate_done');
});
/* ------------------------------------------------------------------ I: Settings, save, reload, Continue */
stage('settings', async () => {
  await clearTips(); await backOut();
  await P.press('start', 70, 800); let how = await P.choose(/^Settings/, null, { after: 800 }); const how2 = await P.focusOn(/^Music volume/); const v0 = await P.ev(() => +document.querySelector('input[aria-label="Music volume"]').value);
  await P.press('left', 60, 200); await P.press('left', 60, 200); await P.press('left', 60, 200); const v1 = await P.ev(() => ({ v: +document.querySelector('input[aria-label="Music volume"]').value, a: G.state.audio ? G.state.audio.music : null })); await shot('36_settings_slider');
  ok('Settings: focus the Music slider, D-pad left three times changes it', how && how2 && v1.v === v0 - 15, 'focus + bespoke(slider)', `${v0} -> ${v1.v} (state ${v1.a})`);
  const how3 = await P.focusOn(/^Dead zone/); await P.press('right', 60, 200); await shot('37_settings_controller'); const dz = await P.ev(() => G.pad.prefs.dead);
  const how4 = await P.choose(/^Shapes$/, null, { after: 500 }); const sty = await P.ev(() => G.pad.style); await shot('38_settings_glyphs_ps'); await P.choose(/^Auto$/, null, { after: 400 });
  ok('Settings: the Controller section is there: dead zone slider, glyph style -> Shapes and back to Auto', how3 && how4 && dz > .18 && sty === 'ps', 'focus', `dead ${dz}, style ${sty}`);
  const how5 = await P.choose(/^Save now/, null, { after: 700 }); const saved = await P.ev(() => !!localStorage.getItem('maplebay.save.v1') && JSON.parse(localStorage.getItem('maplebay.save.v1')).player.name);
  ok('Settings: Save now', how5 && saved === 'Pad', how5, 'saved player ' + saved); await backOut();
  const before = await st(); rumbles += await P.ev(() => window.__rumbles || 0); await P.pg.reload(); await P.pg.waitForFunction(() => !document.getElementById('load') && window.G && window.G.scene, null, { timeout: 60000 }); await sleep(1200);
  const fresh = await P.ev(() => ({ cls: document.body.className, layer: !!document.getElementById('padnav') })); await P.connect(); await P.press('down', 60, 300); let i = await P.info();
  how = await P.choose(/^Continue/, null, { after: 2600 }); await clearTips(); const s = await st(); const mus = await P.ev(() => (G.state.audio ? G.state.audio.music : null));
  ok('reload: the title shows no pad layer until a button is pressed, then Continue brings the game back', !fresh.layer && how && !s.title && s.sc === before.sc && Math.abs(s.x - before.x) < 3, how, `${s.sc} ${s.x},${s.y} $${s.money} music ${mus}`); await shot('39_continued');
  const w = await P.walkTo(s.x + (/^int:home/.test(s.sc) ? -1.5 : 2), s.y + 1.5, .6, 8000); ok('after Continue: the stick walks, the world target is back', w && (await P.info()).state === 'world', 'stick');
});
/* ------------------------------------------------------------------ run */
let from = FROM ? stages.findIndex(s => s[0] === FROM) + 1 : 0;
if (FROM) { await sleep(1000); await P.connect(); await P.press('down', 60, 250); const how = await P.choose(/^Continue/, null, { after: 2500 }); ok('title: Continue (from the ' + FROM + ' checkpoint)', how, how); await clearTips(); }
for (let k = from; k < stages.length; k++) {
  const [name, fn] = stages[k]; console.log('--- ' + name);
  try { await fn(); } catch (e) { ok(name + ': the script itself failed', false, '', String(e && e.message).slice(0, 300)); try { await shot('fail_' + name); console.log('   state', JSON.stringify(await st())); } catch (e2) { /* page gone */ } }
  if (CK) { const d = await P.ev(() => { G.save(); const o = {}; for (let i = 0; i < localStorage.length; i++) { const kk = localStorage.key(i); o[kk] = localStorage.getItem(kk); } return o; }); fs.mkdirSync(CKDIR, { recursive: true }); fs.writeFileSync(path.join(CKDIR, name + '.json'), JSON.stringify(d)); }
  if (UNTIL === name) break;
}
const pass = P.log.filter(l => l.ok).length, skipped = P.log.filter(l => l.ok === null).length, fail = P.log.length - pass - skipped;
console.log(`\n${pass} passed, ${fail} failed, ${skipped} skipped (layout limits, explained above). Needed: focus layer ${P.used.focus}x, cursor fallback ${P.used.cursor}x. Rumbles played: ${rumbles + await P.ev(() => window.__rumbles || 0)}. Page errors: ${P.errors.length}`);
if (P.used.cursorFor) console.log('  the cursor fallback was needed for: ' + P.used.cursorFor.join(' | '));
for (const e of P.errors.slice(0, 12)) console.log('  ' + e.slice(0, 400));
fs.mkdirSync(path.join(ROOT, 'out'), { recursive: true }); fs.writeFileSync(path.join(ROOT, 'out/pad_check' + (TAG ? '_' + TAG : '') + '.json'), JSON.stringify({ w: W, h: H, style: STYLE, log: P.log, used: P.used, errors: P.errors }, null, 1));
await P.close(); process.exit(fail || P.errors.length ? 1 : 0);
