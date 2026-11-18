// First-evening save checks: saves from older builds (no G.state.fe, no 'bathroom' to-do) must load and not get stuck.   node tools/first_evening_saves.mjs
import fs from 'node:fs'; import { boot, ROOT } from './fe_lib.mjs';
let bad = 0; const say = (ok, t) => { if (!ok) bad++; console.log((ok ? 'PASS ' : 'FAIL ') + t); };
const KEY = 'maplebay.save.v1';
const info = () => ({ step: G.firstEvening.step, intro: G.intro.at, done: !!G.state.flags.introDone, scene: G.scene.id, tut: (() => { const t = document.querySelector('.tut'); return t && t.offsetWidth ? t.querySelector('span').textContent : null; })(), chip: (() => { const c = document.getElementById('goalsw'); return c && c.offsetWidth ? c.textContent : null; })(), goals: G.goals.list().map(g => g.id + (g.done ? '*' : '')), nav: (() => { const n = G.navArrow.target(); return n ? n.label : null; })() });
const cont = async A => { for (const re of [/^Start$/, /^Continue/]) await A.press(re, 1500); await A.pg.waitForFunction(() => !G.onTitle && G.scene, null, { timeout: 60000 }).catch(() => {}); await A.pg.waitForTimeout(5500); };
const strip = raw => { const j = JSON.parse(raw), st = j.state || j; delete st.fe; if (st.goals && st.goals.items) st.goals.items = st.goals.items.filter(g => g.id !== 'bathroom'); if (st.myday) delete st.myday.seen; return JSON.stringify(j); };

/* 1. an old save well past the intro (tools/perf_save.json) */
{ const A = await boot({ save: fs.readFileSync(ROOT + '/tools/perf_save.json', 'utf8'), dsf: 1 }); await cont(A); const s = await A.ev(info); console.log('     ' + JSON.stringify(s));
  say(!s.step && !s.tut && !!s.chip, `old save past the intro: no lesson, no bubble, the To do chip is there ("${s.chip}")`);
  for (let k = 0; k < 3; k++) await A.press(/^Got it$/, 700);   /* a first-time card of the old save is in the way */
  await A.noBanners(); await A.press(/./, 900, '#goalsw .gw-head'); const open = await A.ev(() => ({ open: G.myDay.isOpen, tut: !!document.querySelector('.md-tut.on') })); say(open.open, `the chip opens the menu (walk-through shown: ${open.tut})`); await A.shot('s1_old_save_menu');
  say(!A.errs.length, 'zero page errors ' + A.errs.slice(0, 2).join(' | ')); await A.close(); }

/* 2 + 3. saves made by a new game, then stripped of everything this change added (as an older build would have written them) */
let mid = null, eve = null;
{ const A = await boot({ dsf: 1 }); for (const re of [/^Start$/, /^New Game/, /^Next ▶/, /^Surprise me/, /^Next ▶/, /^Juniper Court/, /^Move in/]) await A.press(re);
  await A.pg.waitForTimeout(2500); for (let k = 0; k < 20; k++) { const at = await A.ev(() => G.intro.at); if (at === 'curb') break; await A.press(/^Skip$/, 1200); await A.pg.waitForTimeout(600); }
  await A.ev(() => G.save()); mid = strip(await A.ev(k => localStorage.getItem(k), KEY)); console.log('     mid-intro save at step: ' + await A.ev(() => G.intro.at));
  await A.ev(() => G.intro.skip()); await A.pg.waitForTimeout(6000); await A.ev(() => G.save()); eve = strip(await A.ev(k => localStorage.getItem(k), KEY)); await A.close(); }
{ const A = await boot({ save: mid, dsf: 1 }); await cont(A); let s = await A.ev(info); console.log('     ' + JSON.stringify(s));
  say(!s.done && !!s.intro && !s.step, `old mid-intro save resumes the intro at "${s.intro}"`);
  await A.ev(() => G.intro.skip()); await A.pg.waitForTimeout(7000); s = await A.ev(info); console.log('     ' + JSON.stringify(s));
  say(s.done && s.step === 'unpack' && s.goals.includes('bathroom') && s.nav === 'Unpack this box', `...and on reaching the flat the guided evening starts (step ${s.step}, arrow "${s.nav}", to-dos ${s.goals})`);
  say(!A.errs.length, 'zero page errors ' + A.errs.slice(0, 2).join(' | ')); await A.close(); }
{ const A = await boot({ save: eve, dsf: 1 }); await cont(A); const s = await A.ev(info); console.log('     ' + JSON.stringify(s));
  say(s.done && !s.step && !s.tut && !s.goals.includes('bathroom') && !!s.chip, `old save made on the first evening (no fe state, no bathroom to-do): loads, no lesson forced, chip "${s.chip}"`);
  await A.ev(() => { try { G.firstTime.setEnabled(false); } catch (e) { } }); for (let k = 0; k < 3; k++) await A.press(/^Got it$/, 700);   /* first-time cards off: one of them took the taps */
  await A.noBanners(); await A.press(/./, 900, '#goalsw .gw-head'); for (let k = 0; k < 5; k++) await A.press(/^(Next|Got it)$/, 400, '.md-tut button'); await A.press(/Unpack your moving/, 900, '.md-goal'); const n = await A.ev(info), d = await A.ev(() => JSON.stringify({ open: G.myDay.isOpen, sel: G.state.navgoals.sel, has: G.todoNav.has('unpack'), modal: G.modal, busy: !!G.busy, cur: (G.navGoals.current() || {}).id, win: ((document.querySelector('.modal') || {}).textContent || '').slice(0, 60), ph: G.phone.isOpen }));
  say(n.nav === 'Unpack this box', `tapping its "Unpack" to-do still points the arrow ("${n.nav}") ${n.nav ? '' : d}`);
  await A.ev(() => { G.save(); }); say(!A.errs.length, 'zero page errors ' + A.errs.slice(0, 2).join(' | ')); await A.close(); }
/* 4. a NEW save made mid-lesson resumes the lesson */
{ const A = await boot({ dsf: 1 }); await A.newGame(); await A.pg.waitForTimeout(1500); await A.ev(() => G.save()); const raw = await A.ev(k => localStorage.getItem(k), KEY); await A.close();
  const B = await boot({ save: raw, dsf: 1 }); await cont(B); await B.pg.waitForTimeout(6000); const s = await B.ev(info); console.log('     ' + JSON.stringify(s));
  say(s.step === 'unpack' && /box/.test(s.tut || '') && s.nav === 'Unpack this box', `a save made during the lesson resumes it (step ${s.step}, bubble "${s.tut}")`); say(!B.errs.length, 'zero page errors'); await B.close(); }
console.log(bad ? `${bad} FAILED` : 'ALL PASS'); process.exit(bad ? 1 : 0);
