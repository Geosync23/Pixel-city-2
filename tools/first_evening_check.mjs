// First-evening check (owner playtest list 2026-11-18): a NEW game on the BUILT game at phone size, by touch.
//   node tools/first_evening_check.mjs [w h]      screenshots -> out/shots/first_evening/
import { boot } from './fe_lib.mjs';
const W = +process.argv[2] || 390, H = +process.argv[3] || 844, tag = W === 390 ? '' : '_' + W;
const A = await boot({ w: W, h: H }); let bad = 0; const say = (ok, t) => { if (!ok) bad++; console.log((ok ? 'PASS ' : 'FAIL ') + t); };
const { ev, pg } = A, shot = n => A.shot(n + tag);
const st = () => ev(() => { const t = document.querySelector('.tut'), n = G.navArrow && G.navArrow.target && G.navArrow.target(), c = document.querySelector('#goalsw'), cr = c && c.getBoundingClientRect(), tr = t && t.getBoundingClientRect();
  return { step: G.firstEvening.step, tut: t && t.offsetWidth ? t.querySelector('span').textContent : null, nav: n ? n.label : null, sel: G.todoNav.selected(), chip: c && c.offsetWidth ? c.textContent : null, hl: !!document.querySelector('#goalsw .tut-hl'), chipBox: cr ? [Math.round(cr.left), Math.round(cr.top), Math.round(cr.right), Math.round(cr.bottom)] : null, tutBox: tr ? [Math.round(tr.left), Math.round(tr.top), Math.round(tr.right), Math.round(tr.bottom)] : null, scene: G.scene.id, t: G.now().clock, busy: G.busy && G.busy.label, mg: !!(G.minigame.MG && G.minigame.MG.cur) }; });
const speed = () => A.press(/^4x$/, 300);
const settle = async (ms = 1200) => { await A.waitIdle(); await pg.waitForTimeout(ms); };
const clearBanners = async () => { for (let k = 0; k < 6; k++) { const b = await ev(() => { const x = [...document.querySelectorAll('#ph-banners button, #ph-banners [role=button], #ph-banners *')].find(e => e.offsetWidth && /^[x×✕]$/i.test((e.textContent || '').trim()) && !e.children.length); if (!x) return null; const r = x.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }); if (!b) break; await A.tap(b[0], b[1], 400); } };

await A.newGame(); await ev(() => { try { G.firstTime.setEnabled(false); } catch (e) { } }); await clearBanners(); await pg.waitForTimeout(4500); await clearBanners(); await pg.waitForTimeout(800);
let s = await st(); console.log(JSON.stringify(s));
const hud = await ev(() => ({ myday: [...document.querySelectorAll('.hud-myday')].filter(e => e.isConnected && e.offsetWidth).length, row: [...document.querySelectorAll('#hud .hud-tlrow > *')].map(e => e.className) }));
say(hud.myday === 0, `HUD: no My Day button (top-left row is ${JSON.stringify(hud.row)})`);
say(!!s.chip && /TO DO|To do/i.test(s.chip), `HUD: the To do chip is there: "${s.chip}"`);
say(s.step === 'unpack' && s.nav === 'Unpack this box' && /moving box/.test(s.tut || ''), `arrival: the arrow points at a box by itself ("${s.nav}"), bubble "${s.tut}"`);
say(s.chipBox && s.tutBox && s.tutBox[1] >= s.chipBox[3] && s.tutBox[0] >= 0 && s.tutBox[2] <= W, `bubble sits under the chip and inside the screen (chip ${s.chipBox}, bubble ${s.tutBox})`);
await shot('01_hud_after_arrow_boxes');

/* unpack the three boxes, then the suitcase: no mini-game */
await speed(); let mgSeen = 0;
for (let k = 0; k < 3; k++) { const ok = await A.useThing('^Unpack a Moving Box'); await pg.waitForTimeout(700); for (let q = 0; q < 3; q++) { if ((await st()).busy) break; await A.press(/^Unpack/, 700, '.modal button, .opt'); } s = await st(); if (s.mg) mgSeen++; if (k === 0) await shot('02_unpacking_plain'); await settle(); if (!ok) break; }
s = await st(); const left = await ev(() => G.housing.boxes().map(b => b.label));
say(left.length === 1 && mgSeen === 0, `three boxes unpacked as a plain timed action, no mini-game (left: ${left})`);
say(s.nav === 'Unpack your suitcase' && /suitcase/.test(s.tut || ''), `then the arrow moves to the suitcase by itself ("${s.nav}"), bubble "${s.tut}"`);
await pg.waitForTimeout(2500); await shot('03_arrow_suitcase');
await A.useThing('^Unpack your suitcase'); await pg.waitForTimeout(700); for (let q = 0; q < 3; q++) { if ((await st()).busy) break; await A.press(/^Unpack/, 700, '.modal button, .opt'); } s = await st(); if (s.mg) mgSeen++; await settle(1800);
say(mgSeen === 0 && (await ev(() => G.goals.isDone('unpack'))), 'suitcase unpacked, no mini-game; to-do "unpack" done');

/* the menu lesson */
await pg.waitForTimeout(4500); s = await st(); console.log(JSON.stringify(s));
say(s.step === 'menu' && s.hl && /To do/.test(s.tut || ''), `menu lesson: the chip is highlighted, bubble "${s.tut}"`); await shot('04_menu_lesson');
await A.noBanners(); await A.tap((s.chipBox[0] + s.chipBox[2]) / 2, (s.chipBox[1] + s.chipBox[3]) / 2, 900);
const tuts = []; for (let k = 0; k < 6; k++) { const t = await ev(() => { const b = document.querySelector('.md-tut.on p'); return b ? b.textContent : null; }); if (!t) break; tuts.push(t); await shot('05_menu_walk_' + (k + 1)); await A.press(/^(Next|Got it)$/, 600, '.md-tut button'); }
console.log('     walk-through: ' + JSON.stringify(tuts));
say(tuts.length === 4 && /phone/i.test(tuts[3]) && /My Day app/.test(tuts[3]), 'the menu opens with a 4-step walk-through; the last step names the My Day app on the phone');
const order = await ev(() => { const b = document.querySelector('.md-body'), y = q => { const e = b.querySelector(q); return e ? e.getBoundingClientRect().top + b.scrollTop : null; }; b.scrollTop = 0; return { todo: y('.md-todo'), sched: y('.md-sched'), ideas: y('.md-ideas'), phone: y('.md-phone'), rows: [...b.querySelectorAll('.md-goal')].map(e => e.textContent), fit: document.querySelector('.md-sheet').getBoundingClientRect().right <= innerWidth && b.scrollWidth <= b.clientWidth + 1 }; });
say(order.todo !== null && order.todo < order.sched && order.sched < order.ideas && order.ideas < order.phone && order.fit, `menu order: To do (${order.todo}) < My schedule (${order.sched}) < Ideas (${order.ideas}) < phone row (${order.phone}); fits the width`);
console.log('     to-do rows: ' + JSON.stringify(order.rows)); await pg.waitForTimeout(300); await shot('06_menu_open');
await A.press(/Get some sleep/, 900, '.md-goal'); s = await st();
say(s.nav === 'Your bed' && !(await ev(() => G.myDay.isOpen)), `tapping the to-do "Get some sleep" closes the menu and points the arrow at the bed ("${s.nav}")`); await pg.waitForTimeout(600); await shot('06b_todo_tap_arrow_bed');

/* the needs lesson: bathroom */
await pg.waitForTimeout(1500); s = await st(); console.log(JSON.stringify(s));
say(s.step === 'bath' && /toilet/i.test(s.tut || ''), `needs lesson: bubble "${s.tut}", arrow "${s.nav}" (the bed stays selected until the next step: ${s.sel})`);
await ev(() => G.navGoals.select(null)); await pg.waitForTimeout(700); s = await st(); say(/toilet/i.test(s.nav || ''), `arrow to the bathroom: "${s.nav}"`); await shot('07_bathroom_lesson');
await A.useThing('^Bathroom', { dz: .9 /* owner msg 281: tap the DOOR (above the threshold), not the floor in front of it */, tries: 6, until: () => /:bath$/.test(G.scene.id) }); await pg.waitForTimeout(2500); s = await st(); console.log(JSON.stringify(s)); await shot('07b_in_bathroom');
say(/:bath$/.test(s.scene) && s.nav === 'Use the toilet', `in the bathroom the arrow marks the toilet ("${s.nav}")`);
await A.useThing('^Toilet'); await pg.waitForTimeout(600); await A.press(/^(Use|Toilet|Go)/, 700, '.modal button, .opt'); await settle(); s = await st();
say(/wash/i.test(s.tut || '') && s.nav === 'Wash your hands', `after the toilet: bubble "${s.tut}", arrow "${s.nav}"`); await shot('07c_wash_hands');
await A.useThing('^Sink'); await pg.waitForTimeout(600); await A.press(/^Wash/, 700, '.modal button, .opt'); await settle(1500);
say(await ev(() => G.goals.isDone('bathroom')), 'to-do "Freshen up in the bathroom" done');

/* cooking and eating */
const its = await ev(() => G.interactables().map(i => i.label)); const back = its.find(l => /Back|Leave|Exit|door|room/i.test(l)); console.log('     bath exits: ' + JSON.stringify(its)); /* owner msg 281: tap the door / the way out, not the mat in front of it (G.doorTap says where) */
for (let k = 0; k < 6 && await ev(() => /:bath$/.test(G.scene.id)); k++) { const c = await ev(lbl => { const it = G.interactables().find(i => i.label === lbl), q = G.doorTap(it); if (Math.hypot(it.x - G.player.x, it.y - G.player.y) > .8) { G.player.stop(); G.player.x = it.spot ? it.spot.x : it.x; G.player.y = it.spot ? it.spot.y : it.y; G.snapCam(); return null; } const p = G.toScreen(q.x, q.y, G.world.heightAt(it.x, it.y) + q.up), r = G.cv.getBoundingClientRect(); return [p.x + r.left, p.y + r.top]; }, back); if (c) await A.tap(c[0], c[1], 1800); else await pg.waitForTimeout(700); }
await pg.waitForTimeout(2500);
s = await st(); console.log(JSON.stringify(s)); say(s.step === 'food' && /fridge/i.test(s.tut || '') && /fridge/i.test(s.nav || ''), `food lesson: bubble "${s.tut}", arrow "${s.nav}"`); await shot('08_food_lesson');
await A.useThing('fridge'); await pg.waitForTimeout(700); await A.press(/^Make a no-cook dish/, 1000); await A.press(/^Cheese & Tomato Sandwich/, 1000); await A.press(/^Make it/, 1500);
let games = 0, rounds = null, shotDone = false;
for (let k = 0; k < 400; k++) { const m = await ev(() => { const m = G.minigame.MG.cur; if (!m) return null; const s = m.state(), w = s.want || {}, p = m.toClient(w.x === undefined ? 90 : w.x, w.y === undefined ? 55 : w.y); return { title: m.def.title, done: s.done, counting: s.counting, ready: !!w.ready, x: p.x, y: p.y, rounds: s.stats && s.stats.rounds, t: s.t }; }); if (!m) { if (games) break; await pg.waitForTimeout(100); continue; } games = 1; rounds = m.rounds; if (!shotDone && m.t > 1.2) { shotDone = true; await shot('09_sandwich_minigame'); } if (m.done || m.counting || !m.ready) { await pg.waitForTimeout(60); continue; } await pg.touchscreen.tap(m.x, m.y); await pg.waitForTimeout(650); }
await pg.waitForTimeout(2500); for (let k = 0; k < 4; k++) { if (await A.btn(/^Eat now/)) break; await A.press(/^(OK|Continue|Done|Nice|Got it)/, 900); }
const again = await ev(() => !!(G.minigame.MG && G.minigame.MG.cur));
say(games === 1 && rounds === 1 && !again, `sandwich: the Build game ran once, ${rounds} round, and did not start again`); await shot('09b_sandwich_ready');
await A.press(/^Eat now/, 1200); await settle(600);
say(await ev(() => G.goals.isDone('find_food')), 'ate it: to-do "Make yourself something to eat" done');

/* the free evening + tomorrow */
const cardsSeen = []; let n10 = 0;
for (let k = 0; k < 60 && cardsSeen.length < 6; k++) { const t = await ev(() => { const b = document.querySelector('.say .say-text'); return b && b.offsetWidth ? b.textContent : null; }); if (!t) { if (cardsSeen.length && (await st()).step === 'done') break; await pg.waitForTimeout(500); continue; } if (cardsSeen[cardsSeen.length - 1] !== t) { cardsSeen.push(t); if (cardsSeen.length === 1) await shot('10_free_evening'); if (cardsSeen.length === 2) await shot('10b_free_evening_ideas'); if (cardsSeen.length === 4) await shot('11_tomorrow_nana'); if (cardsSeen.length === 5) await shot('11b_tomorrow_job'); } const r = await ev(() => { const b = document.querySelector('.say').getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; }); await A.tap(r[0], r[1], 700); }
console.log('     cards: ' + JSON.stringify(cardsSeen));
say(cardsSeen.length === 6 && /yours/.test(cardsSeen[0]) && /Nana Bea/.test(cardsSeen[3]) && /job/i.test(cardsSeen[4]), 'cards: the evening is yours + ideas, then Nana Bea tomorrow morning and perhaps a job');
await pg.waitForTimeout(1500); const end = await ev(() => ({ step: G.firstEvening.step, goals: G.goals.list().filter(g => !g.done).map(g => g.text), tut: !!(document.querySelector('.tut') || {}).offsetWidth }));
say(end.step === 'done' && end.goals.some(t => /Nana/.test(t)) && end.goals.some(t => /job/i.test(t)) && !end.tut, `lesson over; open to-dos: ${JSON.stringify(end.goals)}`);
s = await st(); await A.noBanners(); await A.tap((s.chipBox[0] + s.chipBox[2]) / 2, (s.chipBox[1] + s.chipBox[3]) / 2, 900); await shot('12_menu_tomorrow_todos'); await A.press(/^x$/, 500, '.md-head button');
/* save -> reload: nothing stuck */
await ev(() => G.save()); 
say(!A.errs.length, `zero page errors ${A.errs.slice(0, 3).join(' | ')}`);
console.log(bad ? `${bad} FAILED` : 'ALL PASS'); await A.close(); process.exit(bad ? 1 : 0);
