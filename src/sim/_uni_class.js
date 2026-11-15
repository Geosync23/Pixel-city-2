// Maple Bay University — the class engine (helper of sim/university.js; no init of its own).
// A class is a short interactive scene, not a progress bar: the player sits (or stands at a station), the professor speaks, the wall screen changes, and the class sheet
// (ui/university_ui.js) carries the boards and the questions. The clock is advanced step by step so every class takes TUNE.classMin game minutes.
//   lecture(X, ses, seat, sc)    three boards + two questions                    -> { done, part: [right, asked] } | { left }
//   practical(X, ses, at, sc, where)   briefing + the kit mini-game at your station      -> { done, score } | { left }
//   paper(X, ses, seat, sc)      eight questions, no feedback until the end      -> { done, score 0..100 } | { left }
//   present(X, ses, seat, sc)    walk to the dais, the kit game in front of the class -> { done, score } | { left }
//   openLecture(X, talk, seat, sc)   two boards + one question
//   quiz(X, cid, seat, sc, mates)    the study group: three questions with the others chipping in
//   reading(X, cid, at, sc)      the set chapter: notes, then one check question
// X = the hooks university.js passes in: { C (course), prof(id) -> cast row, lvl(skill), teach, toast, state }.
import { G } from '../core/game.js';
import { bubble } from '../ui/kit.js';
import { play } from '../ui/minigame.js';
import { openSheet, LEFT } from '../ui/university_ui.js';
import { TUNE, UNITS, hh } from '../data/university.js';
import { CAST, LECTURES, READING, PRACTICAL, FINAL, LINES } from '../story/university.js';

const pick = a => a[Math.floor(Math.random() * a.length)], safe = fn => { try { return fn(); } catch (e) { return undefined; } };
export const wrap = (t, n = 17, max = 4) => { const out = []; let l = ''; for (const w of String(t).toUpperCase().replace(/[^A-Z0-9 .,:'!?%&-]/g, '').split(/\s+/)) { if ((l + ' ' + w).trim().length > n) { out.push(l); l = w; if (out.length >= max) break; } else l = (l + ' ' + w).trim(); } if (l && out.length < max) out.push(l); return out; };
const firstSentence = t => String(t).split(/(?<=[.!?])\s/)[0];
let live = null;   /* the class in progress: { kind, ses, sheet, t0, act } */
export const running = () => live;
/** stop whatever class is running (scene change, load) */
export function abort() { const l = live; live = null; if (l) { safe(() => l.sheet && l.sheet.close()); if (G.busy && G.busy._uni) G.endActivity(false); } }

/** wait (fast-forward) until abs minute T. resolves false when cancelled */
export function waitUntil(T, label, at, anim) {
  return new Promise(res => { const left = T - G.state.t; if (left <= .5) return res(true); const p = G.player; if (at && at.seated) p.poseOpts = { seated: true };
    const a = G.startActivity({ label, anim: anim || 'sit', minutes: left, rate: Math.max(3, left / 4), at: at ? { x: at.x, y: at.y, z: at.z || 0, dir: at.dir } : undefined, done: () => { p.poseOpts = null; res(true); }, cancel: () => { p.poseOpts = null; res(false); } }); a._uniWait = true; });
}
/** hold the player in place for a class; cancel (HUD button / moving on) = leaving */
function hold(label, at, anim, onCancel) {
  const p = G.player; if (at.seated) p.poseOpts = { seated: true };
  const a = G.startActivity({ label, anim: anim || 'sit', minutes: 9999, rate: .0001, at: { x: at.x, y: at.y, z: at.z || 0, dir: at.dir }, cancel: () => { p.poseOpts = null; onCancel && onCancel(); }, done: () => { p.poseOpts = null; } }); a._uni = true; return a;
}
const release = ok => { if (G.busy && G.busy._uni) G.endActivity(ok !== false); G.player.poseOpts = null; };
const aside = (sc, p = .5) => { if (Math.random() > p || !sc || !sc.uni) return; const c = pick((sc.uni.mates || []).filter(q => !q.hidden)); if (c) bubble(c, pick(LINES.aside), 2400); };
const profSay = (sc, text, ms = 3200) => { const p = sc && sc.uni && sc.uni.prof; if (p && !p.hidden) { p.pose = 'talk'; p._hold = ms / 1000; bubble(p, text.length > 90 ? text.slice(0, 88) + '…' : text, ms); } };
/** begin: open the sheet + the hold; returns the live record */
function begin(kind, X, ses, at, anim, label) {
  const C = X.C(ses.cid), l = { kind, ses, left: false, t0: G.state.t };
  l.sheet = openSheet({ title: `${C.code} · ${C.name}`, sub: label, color: C.color, onLeave: () => { l.left = true; release(false); } });
  l.act = hold(`${C.name}: ${label}`, at, anim, () => { l.left = true; l.sheet.leave(); });
  live = l; G.emit('university:classstart', ses.cid, ses.unit, kind); return l;
}
/** end: pad the clock to the full class length, release the player */
function end(l, ok) { const used = G.state.t - l.t0; if (ok && used < TUNE.classMin) G.advance(TUNE.classMin - used); if (live === l) live = null; release(ok); }
const gone = l => l.left || live !== l;

export async function lecture(X, ses, seat, sc) {
  const C = X.C(ses.cid), P = CAST[C.prof], L = LECTURES[C.id][ses.unit === 0 ? 0 : 1], B = sc.uni.board, l = begin('lecture', X, ses, Object.assign({ seated: true }, seat), 'sit', UNITS[ses.unit].name), sh = l.sheet; let ok = 0;
  const fail = () => { B.show(null); end(l, false); sh.close(); return { left: true }; };
  B.show({ mode: 'stage', title: C.code + ' ' + C.name, color: C.color, lines: [L.title, '', P.short, UNITS[ses.unit].name] }); profSay(sc, L.open);
  if (await sh.say(P.short, (ses.late ? pick(LINES.late) + ' ' : '') + L.open, 'Begin') === LEFT || gone(l)) return fail();
  for (let i = 0; i < L.boards.length; i++) {
    const b = L.boards[i]; B.show({ mode: 'slide', title: b.h, fig: b.fig, n: i + 1, of: L.boards.length, color: C.color, lines: wrap(firstSentence(b.t)) }); profSay(sc, firstSentence(b.t)); G.advance(9);
    if (await sh.slide({ h: b.h, t: b.t, fig: b.fig, who: P.short, n: i, of: L.boards.length }) === LEFT || gone(l)) return fail();
    aside(sc, .6);
    if (i >= 1 && L.ask[i - 1]) { const Q = L.ask[i - 1]; profSay(sc, Q[0]); G.advance(4); const r = await sh.ask(Q, { who: P.short + ' asks the room' }); if (r === LEFT || gone(l)) return fail(); if (r.ok) ok++; safe(() => { const c = pick(sc.uni.mates.filter(q => !q.hidden)); if (c) bubble(c, r.ok ? pick(['Nice.', 'I was going to say that.', 'Write that down.']) : pick(['Ooh. Close.', 'I thought so too.', 'Easy mistake.']), 2200); }); }
  }
  profSay(sc, L.close); if (await sh.say(P.short, L.close, 'Finish') === LEFT || gone(l)) return fail();
  B.show(null); end(l, true); return { done: true, part: [ok, L.ask.length], sheet: sh };
}

export async function practical(X, ses, at, sc, where) {
  const C = X.C(ses.cid), P = CAST[C.prof], T = PRACTICAL[C.id], l = begin('practical', X, ses, at, at.anim, 'Practical'), sh = l.sheet;
  const fail = () => { end(l, false); sh.close(); return { left: true }; };
  profSay(sc, T.brief[0]); if (await sh.say(P.short, T.brief[0], 'Next') === LEFT || gone(l)) return fail(); G.advance(6);
  profSay(sc, T.brief[1]); if (await sh.say(P.short, T.brief[1], 'Start') === LEFT || gone(l)) return fail();
  sh.el.style.display = 'none'; const tip = setInterval(() => { if (live === l) profSay(sc, pick(T.tips), 2600); }, 9000);
  let res = null; try { res = await play(Object.assign({ level: X.lvl(C.skill), sub: `${C.code} · practical` }, C.game)); } catch (e) { res = null; } clearInterval(tip);
  if (gone(l)) { sh.close(); return { left: true }; }
  sh.el.style.display = ''; const score = res ? (res.auto ? .5 : res.score || 0) : .4; G.advance(24); const line = score >= .55 ? T.done[0] : T.done[1]; profSay(sc, line);
  if (await sh.say(P.short, line, 'Finish') === LEFT || gone(l)) return fail();
  end(l, true); return { done: true, score, sheet: sh, where };
}

export function paperQs(cid) { const L = LECTURES[cid], all = L[0].ask.concat(L[1].ask, READING[cid].ask, (FINAL[cid] || {}).extra || []); return all.slice().sort(() => Math.random() - .5).slice(0, 8); }
export async function paper(X, ses, seat, sc) {
  const C = X.C(ses.cid), P = CAST[C.prof], F = FINAL[C.id], B = sc.uni.board, l = begin('paper', X, ses, Object.assign({ seated: true }, seat), 'read', 'Final paper'), sh = l.sheet, Qs = paperQs(C.id), done = []; let ok = 0;
  const fail = () => { B.show(null); end(l, false); sh.close(); return { left: true }; };
  B.show({ mode: 'paper', title: C.code + ' FINAL PAPER', color: C.color, lines: ['EXAM IN PROGRESS', 'NO TALKING', Qs.length + ' QUESTIONS', 'GOOD LUCK'] }); for (const c of sc.uni.mates.concat(sc.uni.extras)) if (!c.hidden) { c.pose = 'read'; c.noFidget = true; }
  profSay(sc, F.intro); if (await sh.say(P.short, F.intro, 'Turn over the paper') === LEFT || gone(l)) return fail();
  for (let i = 0; i < Qs.length; i++) { G.advance(4); const r = await sh.ask(Qs[i], { reveal: false, n: i, of: Qs.length, done, who: `Question ${i + 1} of ${Qs.length}` }); if (r === LEFT || gone(l)) return fail(); done[i] = 1; if (r.ok) ok++; }
  for (const c of sc.uni.mates.concat(sc.uni.extras)) c.noFidget = false; profSay(sc, 'Pens down, please.');
  B.show(null); end(l, true); return { done: true, score: Math.round(ok / Qs.length * 100), right: ok, of: Qs.length, sheet: sh };
}

export async function present(X, ses, seat, sc) {
  const C = X.C(ses.cid), P = CAST[C.prof], F = FINAL[C.id], B = sc.uni.board, sp = sc.uni.speak, l = begin('present', X, ses, Object.assign({ seated: true }, seat), 'sit', F.title), sh = l.sheet;
  const fail = () => { B.show(null); end(l, false); sh.close(); return { left: true }; };
  B.show({ mode: 'stage', title: C.code + ' ' + C.name, color: C.color, lines: [F.title, '', 'QUIET PLEASE'] }); profSay(sc, 'Who is first? ... You. Up you come.');
  if (await sh.say(P.short, 'Who is first? ... You. Up you come.', 'Walk to the front') === LEFT || gone(l)) return fail(); G.advance(8);
  /* move to the dais */
  l.act.cancel = null; G.endActivity(false); G.player.poseOpts = null; if (seat) seat.taken = null; l.act = hold(`${C.name}: ${F.title}`, { x: sp.x, y: sp.y, z: sp.z, dir: sp.dir }, C.id === 'music' ? 'type' : 'talk', () => { l.left = true; l.sheet.leave(); });
  profSay(sc, F.intro); if (await sh.say(P.short, F.intro, 'Begin') === LEFT || gone(l)) return fail();
  sh.el.style.display = 'none'; let res = null; try { res = await play(Object.assign({ level: X.lvl(C.skill), sub: `${C.code} · final` }, C.game, { title: F.title })); } catch (e) { res = null; }
  if (gone(l)) { sh.close(); return { left: true }; }
  sh.el.style.display = ''; const score = res ? (res.auto ? .55 : res.score || 0) : .4; G.advance(20);
  for (const c of sc.uni.mates.concat(sc.uni.extras)) if (!c.hidden) { c.pose = 'cheer'; c._cheer = 1; } setTimeout(() => { for (const c of sc.uni.mates.concat(sc.uni.extras)) if (c._cheer) { c._cheer = 0; c.pose = 'sit'; } }, 3500);
  const line = score >= .8 ? 'That is how it is done. Sit down before they ask for more.' : score >= .5 ? 'Good. Honest, clear, yours. Thank you.' : 'Shaky, but you finished. Finishing counts.'; profSay(sc, line);
  if (await sh.say(P.short, line, 'Back to your seat') === LEFT || gone(l)) return fail();
  B.show(null); end(l, true); return { done: true, score: Math.round(score * 100), sheet: sh };
}

export async function openLecture(X, talk, seat, sc) {
  const P = CAST[talk.by], B = sc.uni.board, ses = { cid: null, unit: 0 }, l = { kind: 'open', ses, left: false, t0: G.state.t };
  l.sheet = openSheet({ title: 'Open Lecture', sub: talk.title, color: '#e8b83a', onLeave: () => { l.left = true; release(false); } }); l.act = hold('Open lecture: ' + talk.title, Object.assign({ seated: true }, seat), 'sit', () => { l.left = true; l.sheet.leave(); }); live = l; const sh = l.sheet; let ok = 0;
  const fail = () => { B.show(null); if (live === l) live = null; release(false); sh.close(); return { left: true }; };
  B.show({ mode: 'stage', title: 'OPEN LECTURE NIGHT', lines: [talk.title, '', P.short] }); profSay(sc, 'Good evening, everybody. Thank you for coming out.');
  if (await sh.say(P.short, 'Good evening, everybody. Thank you for coming out. Tonight: ' + talk.title.toLowerCase() + '.', 'Listen') === LEFT || gone(l)) return fail();
  for (let i = 0; i < talk.boards.length; i++) { const b = talk.boards[i]; B.show({ mode: 'slide', title: b.h, fig: b.fig, n: i + 1, of: talk.boards.length, lines: wrap(firstSentence(b.t)) }); profSay(sc, firstSentence(b.t)); G.advance(12); if (await sh.slide({ h: b.h, t: b.t, fig: b.fig, who: P.short, n: i, of: talk.boards.length }) === LEFT || gone(l)) return fail(); aside(sc, .5); }
  for (const Q of talk.ask) { profSay(sc, Q[0]); const r = await sh.ask(Q, { who: P.short + ' asks the room' }); if (r === LEFT || gone(l)) return fail(); if (r.ok) ok++; }
  profSay(sc, talk.close); if (await sh.say(P.short, talk.close, 'Applaud') === LEFT || gone(l)) return fail();
  for (const c of sc.uni.mates.concat(sc.uni.extras)) if (!c.hidden) { c.pose = 'cheer'; c._cheer = 1; } setTimeout(() => { for (const c of sc.uni.mates.concat(sc.uni.extras)) if (c._cheer) { c._cheer = 0; c.pose = 'sit'; } }, 3000);
  B.show(null); const used = G.state.t - l.t0; if (used < 45) G.advance(45 - used); if (live === l) live = null; release(true); return { done: true, ok, sheet: sh };
}

export async function quiz(X, cid, seat, sc, mates) {
  const C = X.C(cid), ses = { cid, unit: -1 }, l = { kind: 'group', ses, left: false, t0: G.state.t }, Qs = paperQs(cid).slice(0, 3);
  l.sheet = openSheet({ title: 'Study group', sub: C.name, color: C.color, onLeave: () => { l.left = true; release(false); } }); l.act = hold('Study group: ' + C.name, Object.assign({ seated: true }, seat), 'read', () => { l.left = true; l.sheet.leave(); }); live = l; const sh = l.sheet; let ok = 0;
  const fail = () => { if (live === l) live = null; release(false); sh.close(); return { left: true }; }, who = i => mates[i % mates.length], say = (c, t) => { if (c && !c.hidden) { c.pose = 'talk'; c._hold = 2.5; bubble(c, t, 2600); } };
  say(who(0), 'Right. Flash cards. I ask, you answer, Bao stays awake.'); if (await sh.say(CAST.saoirse.short, `Right. ${C.name}. I ask, you answer, and Bao stays awake. Deal?`, 'Deal') === LEFT || gone(l)) return fail();
  for (let i = 0; i < Qs.length; i++) { G.advance(10); say(who(i), Qs[i][0]); const r = await sh.ask(Qs[i], { who: CAST[who(i).uniId].short + ' reads the card', n: i, of: Qs.length }); if (r === LEFT || gone(l)) return fail(); if (r.ok) ok++; say(who(i + 1), r.ok ? pick(['See, you know this.', 'That is the one I always get wrong.', 'Good. Next card.']) : pick(['We will do that one again.', 'I got it wrong last week too.', 'Yellow card. Facts pile.'])); }
  if (await sh.say(CAST.agnes.short, ok >= 2 ? 'You will be fine, dear. Have a flapjack.' : 'Twice more through the cards and you will have it. Have a flapjack anyway.', 'Pack up') === LEFT || gone(l)) return fail();
  const used = G.state.t - l.t0; if (used < 40) G.advance(40 - used); if (live === l) live = null; release(true); return { done: true, ok, of: Qs.length, sheet: sh };
}

export async function reading(X, cid, at, sc) {
  const C = X.C(cid), Rd = READING[cid], ses = { cid, unit: -1 }, l = { kind: 'reading', ses, left: false, t0: G.state.t };
  l.sheet = openSheet({ title: 'Set reading', sub: `${C.code} · ${Rd.title}`, color: C.color, onLeave: () => { l.left = true; release(false); } }); l.act = hold('Reading: ' + Rd.title, Object.assign({ seated: true }, at), 'read', () => { l.left = true; l.sheet.leave(); }); live = l; const sh = l.sheet;
  const fail = () => { if (live === l) live = null; release(false); sh.close(); return { left: true }; };
  if (await sh.notes(`${Rd.title}, by ${Rd.by}`, Rd.notes, 'I have read it') === LEFT || gone(l)) return fail(); G.advance(TUNE.readMin - 6);
  const r = await sh.ask(pick(Rd.ask), { who: 'A note to yourself: did it stick?' }); if (r === LEFT || gone(l)) return fail(); G.advance(6);
  if (live === l) live = null; release(true); return { done: true, ok: r.ok ? 1 : 0, sheet: sh };
}
export { hh };
