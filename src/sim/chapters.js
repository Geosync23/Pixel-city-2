// CHAPTERS — the main story engine ("The Maple Bay Year", owner msg 107, BIBLE direction update 21). Runs the data in src/story/chapters.js.
// Helpers: _chapters_places.js (place ids -> destinations), _chapters_cast.js (speakers + companions), _chapters_play.js (the `play` adapters, My Day adapters),
// _chapters_world.js (the marker in the city, the stall, the bell, the ladder, Map pins, home book), _chapters_moments.js (the small optional family
// moments between Chapters: G.chapters.moments), ui/chapters_ui.js (dialogue sheet, cards, chip, book).
//
// WHAT A CHAPTER IS (player's view): a gold marker in the city at its `marker` place + a gold row in the Goals list ("Chapter 4 · Theo Draws on a Napkin —
//   whenever you're ready"). Walk up, tap it: a card (title, hook, who is there, about how long). Begin / Not now. It never expires and is announced once.
//   Outside its `window` the card shows the Chapter's kind `closed` line. Only the next Chapter is open: `unlock` = the previous one + "a breath"
//   (the next 06:00, or n of them) + sometimes a light life condition that also lapses after `orMornings` more mornings.
// WHILE IT RUNS: dialogue is a modal sheet, so THE CLOCK STANDS STILL WHILE PEOPLE TALK and needs do not move; between lines (travel, play) the clock runs as
//   always. As long as a Chapter is running no need can fall below NEED_FLOOR (30): nobody passes out for listening. Companions are real characters that walk
//   with the player; on a ride they are waiting at the other end. `play` steps start the real system and continue on its result. Step out any time from the
//   "..." button ("Let's pick this up later"): the marker keeps the place. A reload resumes at the step.
//
// STATE  G.state.chapters = { v, done: { chId: { t, day, credit? } }, cur: null | { id, pc, paused, t0, went, scene }, picks: { choiceId: optionId }, flags: {},
//          pages: { pageId: day found }, keeps: [itemId], note: { chId: 1 (announced) }, introT, worked, page13?: text[] }
//        The program counter `pc` indexes the Chapter compiled to a flat list of ops (compile()); it is saved after every op.
// API    G.chapters = {
//          list() -> [{ id, n, title, state: 'done' | 'open' | 'running' | 'paused' | 'waiting' | 'locked', hook, ready, waiting? }]
//          row() -> the one gold row for goal lists / My Day: { id, n, title, text, hook, ready, state, place: { x, y, name } } | null
//          current() -> { id, n, title, pc, paused } | null        active() -> bool (running and not stepped out)       done(id) -> bool
//          open(id?) the start card        begin(id) -> bool        stepOut()        resume()
//          pick(choiceId) -> optionId | undefined        flag(id) -> value        test(cond) -> bool        fill(text) -> text with {tokens}
//          book: { has(), open(pageId?), pages() -> [{ id, n, title, place, found }], pins() -> [{ id, x, y, note }] }        keepsakes() -> [itemId]
//          marker() -> { id, x, y, label } | null (city coordinates)
//          debug: { start(n), skipTo(n, step), finish(n), reset(), unlock(n), ops(n), state() }        (n = number 1..15 or id)
//        }
// EVENTS 'chapter:open'(id) announced once · 'chapter:start'(id) · 'chapter:step'(id, pc, op) · 'chapter:choice'(choiceId, optionId) · 'chapter:out'(id) ·
//        'chapter:done'(id) · 'chapter:page'(pageId) · 'chapters:change' (any change the rows / marker should follow)
// OLD SAVES: see credit() below (old story beats done -> Act One Chapters credited; nothing is taken away).
import { G } from '../core/game.js';
import { toast, choose } from '../ui/kit.js';
import { CHAPTERS, CHAPTERS_BY_ID, BOOK, FAMILY_PAGES, ITEMS_NEW } from '../story/chapters.js';
import { STORY_ITEMS } from '../story/story.js';
import { ITEMS, ITEM_BY_ID, RECIPE_BY_ID } from '../data/items.js';
import { VIS } from './housing.js';
import { isHoliday } from '../data/cityhall.js';
import { enterRoom, exitRoom, ROOMS } from '../scenes/interior.js';
import { UI } from '../ui/chapters_ui.js';
import { resolve, here, sameBuilding, inCity, freeNear, cityWorld, placeIdOf } from './_chapters_places.js';
import { who, comp } from './_chapters_cast.js';
import { run as runPlay } from './_chapters_play.js';
import * as WORLD from './_chapters_world.js';
import * as MOMENTS from './_chapters_moments.js';

export const order = 140;
const NEED_FLOOR = 30, DAY = 1440, WD = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'], DUSK = [18.5, 19.75, 17.5, 16.75];
const safe = (f, d) => { try { const v = f(); return v === undefined || v === null ? d : v; } catch (e) { return d; } };
const fresh = () => ({ v: 1, done: {}, cur: null, picks: {}, flags: {}, pages: {}, keeps: [], note: {}, introT: null, worked: 0 });
let S = null, tok = 0, running = false, PROG = {}, hopping = false, lastRide = null, linger = false, curDest = null;
const st = () => { if (G.state.chapters !== S || !S) { S = G.state.chapters || (G.state.chapters = fresh()); for (const k in fresh()) if (S[k] === undefined) S[k] = fresh()[k]; } return S; };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const chOf = n => (typeof n === 'number' ? CHAPTERS[n - 1] : CHAPTERS_BY_ID[n] || CHAPTERS[(+n || 0) - 1]) || null;
const kicker = ch => 'Chapter ' + ch.n;
const canSave = () => !!G.started && !(G.query && G.query.has('scene') && !G.query.has('chsave'));
const save = () => { if (canSave()) safe(() => G.save()); };

/* ================= compile: nested steps -> a flat list of ops with jumps ================= */
function speakers(steps, set) {
  for (const s of steps || []) {
    if (s.do === 'say') set.add(s.who);
    if (s.do === 'choice') for (const o of s.options) speakers(o.reply, set);
    if (s.do === 'if') { speakers(s.then, set); speakers(s.else, set); }
    if (s.do === 'play') { for (const k in s.results || {}) speakers(s.results[k], set); for (const w of s.with || []) set.add(w); }
    if (s.do === 'walk') speakers(s.talk, set);
  }
  return set;
}
function compile(ch) {
  const ops = [];
  const emit = steps => {
    for (const s of steps || []) {
      if (s.do === 'choice') {
        const op = { op: 'choice', id: s.id, options: s.options.map(o => ({ id: o.id, text: o.text, fx: o.fx || null, to: 0 })), end: 0 }; ops.push(op); const jumps = [];
        s.options.forEach((o, i) => { op.options[i].to = ops.length; emit(o.reply); const j = { op: 'jmp', to: 0 }; ops.push(j); jumps.push(j); });
        op.end = ops.length; for (const j of jumps) j.to = op.end;
      } else if (s.do === 'if') {
        const op = { op: 'if', cond: s.cond, els: 0 }; ops.push(op); emit(s.then); const j = { op: 'jmp', to: 0 }; ops.push(j); op.els = ops.length; emit(s.else); j.to = ops.length;
      } else if (s.do === 'play') {
        const op = { op: 'play', step: s, good: 0, ok: 0, end: 0 }; ops.push(op); const R = s.results || {}, jumps = [];
        op.good = ops.length; emit(R.good); let j = { op: 'jmp', to: 0 }; ops.push(j); jumps.push(j);
        op.ok = ops.length; emit(R.ok); j = { op: 'jmp', to: 0 }; ops.push(j); jumps.push(j);
        op.end = ops.length; for (const q of jumps) q.to = op.end;
      } else if (s.do === 'walk') { ops.push({ op: 'walk', step: s }); emit(s.talk); }
      else ops.push(Object.assign({ op: s.do }, s));
    }
  };
  ch.scenes.forEach((sc, i) => {
    const cast = [...speakers(sc.steps, new Set())].filter(w => !['narrator', 'player', 'nell'].includes(w) && !offstage(ch, w, sc.id));
    ops.push({ op: 'scene', i, id: sc.id, place: sc.place, title: sc.title, cast }); emit(sc.steps);
  });
  ops.push({ op: 'end' });
  return ops;
}
const prog = ch => PROG[ch.id] || (PROG[ch.id] = compile(ch));
/* voices that are not in the room: Dad on the telephone in Chapter 7; Nana calling up the ladder while you are in her attic */
const OFF = { 'ch07:dad': 'phone', 'ch06:attic:nana': 'calling up the ladder' };
const offstage = (ch, w, sceneId) => OFF[ch.id + ':' + w] || OFF[ch.id + ':' + sceneId + ':' + w] || null;
const isPhone = (ch, w) => offstage(ch, w) === 'phone';
function sceneOpAt(ops, pc) { for (let i = Math.min(pc, ops.length - 1); i >= 0; i--) if (ops[i].op === 'scene') return ops[i]; return ops[0]; }

/* ================= conditions, tokens, windows, unlocks ================= */
const NUM = { 97: 'ninety-seven', 98: 'ninety-eight', lost: 'ninety-seven' };
function fill(t) {
  const P = G.state.player || {}, name = P.name || 'you', pk = st().picks;
  const title = { aunt: 'Aunt ' + name, uncle: 'Uncle ' + name, captain: 'Captain ' + name }[pk.c03_title] || name;
  return String(t).replace(/\{name\}/g, name).replace(/\{title\}/g, title)
    .replace(/\{home\}/g, safe(() => G.housing.current().home.name, 'your place'))
    .replace(/\{job\}/g, safe(() => String(G.jobs.current().title || G.jobs.current().name).toLowerCase(), 'the job hunt'))
    .replace(/\{count\}/g, NUM[pk.c07_count] || 'ninety-seven');
}
const weatherKind = () => safe(() => G.weather.current().kind, null) || G.state.weather || 'clear';
function festival(id) {
  /* the event's own day (G.cityEvents.current(): m = minutes since that day began), from the morning it is dressed until midnight */
  return safe(() => { const c = G.cityEvents.current(); return !!c && c.ev.id === id && c.m >= 0 && c.m < DAY; }, false);
}
function test1(c) {
  if (!c) return true; let neg = false; if (c[0] === '!') { neg = true; c = c.slice(1); }
  const [k, ...rest] = c.split(':'), v = rest.join(':'), n = G.now(), s = st(); let r = false;
  if (k === 'time') r = v === 'morning' ? n.hf >= 5 && n.hf < 11 : v === 'day' ? n.hf >= 11 && n.hf < 17 : v === 'evening' ? n.hf >= 17 && n.hf < 21 : n.hf >= 21 || n.hf < 5;
  else if (k === 'season') r = ['spring', 'summer', 'autumn', 'winter'][n.season] === v;
  else if (k === 'weather') { const w = weatherKind(); r = v === 'rain' ? /rain|storm/.test(w) : v === 'clear' ? /clear|partly/.test(w) : w === v; }
  else if (k === 'festival') r = festival(v);
  else if (k === 'flag') r = !!(s.flags[v] || (G.state.flags || {})[v]);
  else if (k === 'pick') { const [a, b] = v.split('='); r = s.picks[a] === b; }
  else if (k === 'rel') { const m = /^(.+)>=(\d+)$/.exec(v); r = !!m && safe(() => G.social.rel(m[1]), 0) >= +m[2]; }
  else if (k === 'met') r = !!safe(() => G.social.npc(v).met, false);
  else if (k === 'has') r = v === 'job' ? !!safe(() => G.jobs.current(), null) : s.keeps.includes(v.replace(/^item:/, '')) || safe(() => G.inv.count(v.replace(/^item:/, '')), 0) > 0;
  else if (k === 'seen') r = !!safe(() => G.places.known(v), false);
  else if (k === 'done') r = !!s.done[v];
  else if (k === 'day') r = (n.weekday < 5) === (v === 'weekday');
  else if (k === 'went') r = ((s.cur && s.cur.went) || 'walk') === v;
  else if (k === 'worked') r = Math.max(s.worked || 0, safe(() => G.jobs.current().shifts, 0), safe(() => G.state.ach.c.shifts_worked, 0)) >= +v;
  else if (k === 'cooked') r = safe(() => G.state.ach.c.cooked_meal, 0) >= +v;
  return neg ? !r : r;
}
const test = c => (Array.isArray(c) ? c.every(test1) : test1(c));
const duskH = () => safe(() => G.lighthouse.lampTime(), DUSK[G.now().season] || 18.5);
function hm(s) {
  const m = /^dusk([+-])(\d+):(\d+)$/.exec(s); if (m) return duskH() * 60 + (m[1] === '-' ? -1 : 1) * (+m[2] * 60 + +m[3]);
  const [h, mm] = String(s).split(':'); return +h * 60 + (+mm || 0);
}
/* a place that is shut all day today whatever the hour (City Hall on the three public holidays): the Chapter waits a day and says why */
const SHUT = { ch09: () => (safe(() => isHoliday(G.now().day), false) ? 'City Hall is shut for the holiday, archive and all. Pip has moved the investigation to tomorrow. In pen.' : null) };
const shutToday = ch => (SHUT[ch.id] ? SHUT[ch.id]() : null);
/* while a Chapter is being played nobody is walked to the door at closing time (the two places that have a switch for it) */
function holdDoors(on) { for (const k of ['cityhall', 'post']) safe(() => { G[k].debug.stay = !!on; }); }
function windowOpen(ch) {
  const w = ch.window; if (!w) return true; const n = G.now(), tod = n.hf * 60;
  if (shutToday(ch)) return false;
  /* the observatory's own idea of a clear night, when it is there. Nobody is kept waiting on the weather for long, though: once the Chapter has been open
     for two whole days (a cloudy week in winter can run to ten nights) the evening will do as it is, and begin() has the cloud break for it. */
  if (w.weather === 'clear' && !clearNight() && !cloudWaived(ch)) return false;
  return (w.slots || []).some(sl => (!sl.days || sl.days.includes(WD[n.weekday])) && tod >= hm(sl.from) && tod <= hm(sl.to));
}
const clearSky = () => { const ob = safe(() => G.observatory.sky(), null); return ob ? !ob.wx : /clear|partly/.test(weatherKind()); };
const clearNight = () => { const ob = safe(() => G.observatory.sky().observing, null); return ob === null ? /clear|partly/.test(weatherKind()) : ob; };
const cloudWaived = ch => { const u = unlockInfo(ch); return u.t !== Infinity && G.state.t - u.t >= 2 * DAY; };
/** the minute a Chapter opens (Infinity while its predecessor is not done) and whether its life condition still holds it back */
function unlockInfo(ch) {
  const u = ch.unlock || {}, s = st(); let base;
  if (u.after === 'intro') { if (!(G.state.flags || {}).introDone) return { t: Infinity }; if (s.introT === null || s.introT === undefined) return { t: 0 }; base = s.introT; }
  else { const d = s.done[u.after]; if (!d) return { t: Infinity }; if (d.credit) return { t: 0 }; base = d.t; }
  const n = u.breath && u.breath.mornings ? u.breath.mornings : 1;
  let t = Math.floor(base / DAY) * DAY + 360; if (t <= base) t += DAY; t += (n - 1) * DAY;
  if (u.life && !test(u.life.cond)) { const late = t + (u.life.orMornings || 2) * DAY; if (G.state.t < late) return { t, life: true, late, waiting: u.life.waiting }; }
  return { t };
}
const nextCh = () => CHAPTERS.find(c => !st().done[c.id]) || null;
function stateOf(ch) {
  const s = st(); if (s.done[ch.id]) return 'done'; if (s.cur && s.cur.id === ch.id) return s.cur.paused ? 'paused' : 'running';
  if (nextCh() !== ch) return 'locked'; const u = unlockInfo(ch); if (u.t === Infinity) return 'locked'; if (G.state.t < u.t) return 'locked'; if (u.life) return 'waiting'; return 'open';
}

/* ================= the marker, the gold row, the one notice ================= */
function markerPlace(ch) { const d = resolve(ch.marker.place); if (!d) return null; return d; }
function refresh() {
  const s = st(), ch = s.cur ? CHAPTERS_BY_ID[s.cur.id] : nextCh(); let mk = null, row = null;
  if (ch) {
    const state = stateOf(ch);
    if (state === 'open' || state === 'paused') {
      const d = markerPlace(ch);
      if (d) mk = { id: ch.id, x: d.x, y: d.y, room: d.room, label: `${kicker(ch)} · ${ch.title}`, sub: ch.marker.label };
      row = { text: `${kicker(ch)} · ${ch.title} — ${state === 'paused' ? "it'll keep" : "whenever you're ready"}`, hint: state === 'paused' ? 'Your place is kept. Go back to the gold marker when you like.' : ch.hook };
      if (state === 'open' && !s.note[ch.id] && !G.busy && !G.modal && !G.cutscene && G.started !== false) { s.note[ch.id] = 1; announce(ch); }
    } else if (state === 'waiting') row = { text: unlockInfo(ch).waiting, hint: 'No hurry.' };
    else if (state === 'running') row = { text: `${kicker(ch)} · ${ch.title}`, hint: ch.hook };
  }
  WORLD.setMarker(mk);
  const g = safe(() => G.goals.get('chapter'), null);
  if (!row) { if (g) safe(() => G.goals.remove('chapter')); }
  else if (!g || g.text !== row.text) { if (g) safe(() => G.goals.remove('chapter')); safe(() => G.goals.add({ id: 'chapter', text: row.text, hint: row.hint, group: 'goal', listTitle: 'The Maple Bay Year' })); }
}
function announce(ch) {
  /* one notice, not two: in the morning My Day's own line already says the Chapter is there (sim/myday.js summary), so the gold toast is kept for the times
     that line will not come (My Day's line already said today, or it is past noon) */
  const hf = G.now().hf, mdSays = !!G.myDay && hf >= 5 && hf < 12 && safe(() => G.state.myday.sumDay, -1) !== Math.floor(G.state.t / DAY);
  if (!mdSays) UI.toastGold(`${kicker(ch)} · ${ch.title}. ${ch.ready}`, 6500);
  safe(() => G.phone.notify({ app: 'map', title: `${kicker(ch)} · ${ch.title}`, text: ch.hook + ' ' + ch.ready, priority: 'low' }));
  G.emit('chapter:open', ch.id);
}
function rowInfo() {
  const s = st(), ch = s.cur ? CHAPTERS_BY_ID[s.cur.id] : nextCh(); if (!ch) return null; const state = stateOf(ch); if (state === 'locked' || state === 'done') return null;
  const d = markerPlace(ch), u = unlockInfo(ch);
  return { id: ch.id, n: ch.n, title: ch.title, hook: ch.hook, ready: ch.ready, state, text: state === 'waiting' ? u.waiting : `${kicker(ch)} · ${ch.title}`, place: d ? { x: d.x, y: d.y, name: ch.marker.label } : null,
    hours: state === 'open' ? safe(() => hoursOf(ch), null) : null, closed: (ch.window && ch.window.closed) || null };
}
/* QA10: My Day said "Whenever you're ready" at 17:46 for a Chapter whose window shut at 18:00 (the player took a cab and found the closed card).
   'until 18:00' while open (and it ends today), 'from 16:09' when it opens later today, 'closed' when not again today; null = nothing to say */
const hhmm = m => { m = Math.round(m); return String(Math.floor(m / 60) % 24).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
function hoursOf(ch) {
  const w = ch.window; if (!w || !w.slots || !w.slots.length || shutToday(ch)) return shutToday(ch) ? 'closed' : null; const n = G.now(), tod = n.hf * 60;
  const today = w.slots.filter(sl => !sl.days || sl.days.includes(WD[n.weekday]));
  if (windowOpen(ch)) { const sl = today.find(sl => tod >= hm(sl.from) && tod <= hm(sl.to)); return sl && hm(sl.to) < 24 * 60 - 1 ? 'until ' + hhmm(hm(sl.to)) : null; }
  if (w.weather === 'clear' && today.some(sl => tod >= hm(sl.from) && tod <= hm(sl.to))) return null;   /* it is the hour but not the sky: the closed card says why */
  const later = today.filter(sl => hm(sl.from) > tod).sort((a, b) => hm(a.from) - hm(b.from))[0]; return later ? 'from ' + hhmm(hm(later.from)) : 'closed';
}

/* The marker stands beside a door, and a new player taps the DOOR: walking in through the door of an open Chapter's place offers the same start card
   (once per time you come in; "Not now" leaves you in the room as on any visit). */
function doorStart() {
  const s = st(); if (running || G.modal || G.cutscene || G.busy || !G.scene || !/^int:/.test(G.scene.id)) return;
  const ch = s.cur ? CHAPTERS_BY_ID[s.cur.id] : nextCh(); if (!ch) return; const state = stateOf(ch); if (state !== 'open' && state !== 'paused') return;
  const d = markerPlace(ch); if (!d || !d.room || G.scene.id !== 'int:' + d.room) return;
  const day = Math.floor(G.state.t / DAY); s.doorDay = s.doorDay || {}; if (s.doorDay[ch.id] === day && d.id === 'home:player') return; s.doorDay[ch.id] = day;      /* your own front door asks once a day, not every time you come home */
  openCard(ch.id);
}

/* ================= the start card ================= */
async function openCard(id) {
  const s = st(), ch = id ? chOf(id) : (s.cur ? CHAPTERS_BY_ID[s.cur.id] : nextCh()); if (!ch || running) return false;
  const state = stateOf(ch); if (state !== 'open' && state !== 'paused') return false;
  const resume = state === 'paused', onShift = !!safe(() => G.jobs.onShift(), false), open = windowOpen(ch);
  const closed = onShift ? "You're on the clock just now. It'll keep until after work." : !open ? shutToday(ch) || ch.window.closed : null;
  const v = await UI.card({ kicker: kicker(ch), title: ch.title, hook: ch.hook, ready: resume ? "Your place is kept. Whenever you're ready." : ch.ready, closed, resume, canBegin: !closed,
    who: ch.cast.slice(0, 6).map(w => { const i = who(w); return { name: i.short || i.name, spec: i.spec }; }), meta: `About ${ch.minutes[0]} to ${ch.minutes[1]} minutes. No rush.` });
  if (v !== 'begin') return false;
  return resume ? resumeNow() : begin(ch.id);
}
/* the company pays your way in where a Chapter goes past a ticket desk (nobody is turned back at the columns mid-story) */
function tickets(ch) {
  if (ch.id === 'ch10' && !safe(() => G.museum.hasTicket(), true)) { safe(() => G.money.add(safe(() => G.museum.ticket, 6) || 6, 'gift')); safe(() => G.museum.buyTicket()); }
  if (ch.id === 'ch11' && !safe(() => G.observatory.hasTicket(), true)) { safe(() => G.money.add(6, 'gift')); safe(() => G.observatory.buyTicket()); }
}
function begin(id) {
  const ch = chOf(id), s = st(); if (!ch || running || s.done[ch.id]) return false;
  if (linger) { linger = false; comp.clear(); } comp.follow(true);
  const broke = !!(ch.window && ch.window.weather === 'clear' && !clearSky()); if (broke) safe(() => G.weather.setWeather('clear', 5));
  s.cur = { id: ch.id, pc: 0, paused: false, t0: Math.floor(G.state.t), went: null, broke }; G.emit('chapter:start', ch.id); refresh(); loop(); return true;
}
function resumeNow() { const s = st(); if (!s.cur || running) return false; s.cur.paused = false; s.cur.back = 1; refresh(); loop(); return true; }
function stepOut(quiet) {
  const s = st(); if (!s.cur) return; tok++; running = false; s.cur.paused = true;
  UI.close(); UI.chip(null); safe(() => G.navGoals.clear()); comp.clear(); G.player.pose = null; hopping = false; holdDoors(false);
  if (safe(() => G.minigame.isOpen(), false)) safe(() => G.minigame.abort());
  if (!quiet) toast("It'll keep. The gold marker has your place.", 'info', 3600);
  G.emit('chapter:out', s.cur.id); refresh(); G.emit('chapters:change'); save();
}

/* ================= the runner ================= */
async function loop() {
  const s = st(); if (!s.cur || s.cur.paused || running) return; running = true; const my = ++tok, ch = CHAPTERS_BY_ID[s.cur.id], ops = prog(ch);
  const alive = () => my === tok && st().cur && st().cur.id === ch.id && !st().cur.paused;
  UI.setOut(() => stepOut());
  safe(() => tickets(ch)); holdDoors(true);
  try {
    if (s.cur.pc > 0 && ops[s.cur.pc] && ops[s.cur.pc].op !== 'scene') { await enterScene(ch, sceneOpAt(ops, s.cur.pc), alive, true); }
    if (s.cur.broke && s.cur.pc === 0) { s.cur.broke = false; UI.setModal(true); const r = await UI.say({ name: '', text: 'All day the cloud has sat on Hillcrest like a lid. Now, as if somebody had asked it nicely, it is tearing open.', style: 'narrator' }); if (r === 'out') { stepOut(); return; } }
    while (alive()) {
      const pc = s.cur.pc, o = ops[pc]; if (!o) break;
      G.emit('chapter:step', ch.id, pc, o.op);
      const next = await exec(ch, o, alive, ops); if (!alive()) break;
      if (o.op === 'end') break;
      s.cur.pc = next === undefined || next === null ? pc + 1 : next; if (o.op !== 'jmp' && o.op !== 'if') save();
    }
  } catch (e) { console.error('chapter ' + ch.id, e); if (alive()) stepOut(true); }
  if (my === tok) running = false;
}
async function exec(ch, o, alive, ops) {
  const s = st();
  switch (o.op) {
    case 'scene': await enterScene(ch, o, alive, false); return;
    case 'say': { const r = await sayLine(ch, o); if (r === 'out') stepOut(); return; }
    case 'choice': {
      if (!UI.isOpen()) { for (let k = s.cur.pc - 1; k >= 0 && ops[k].op !== 'scene'; k--) if (ops[k].op === 'say') { UI.context(lineOf(ch, ops[k])); break; } }
      safe(() => G.goalsUI.caption());
      const v = await UI.choice(o.options.map(x => ({ id: x.id, text: fill(x.text) }))); if (v === 'out' || v === 'closed') { if (v === 'out') stepOut(); return; }
      const opt = o.options.find(x => x.id === v) || o.options[0]; s.picks[o.id] = opt.id;
      if (opt.fx) { for (const k in opt.fx.rel || {}) rel(k, opt.fx.rel[k]); if (opt.fx.flag) s.flags[opt.fx.flag] = true; }
      if (o.id === 'c15_page') { s.page13 = [fill(opt.text)]; foundPage('lookout', true); }
      G.emit('chapter:choice', o.id, opt.id); return opt.to;
    }
    case 'if': return test(o.cond) ? undefined : o.els;
    case 'jmp': return o.to;
    case 'beat': if (UI.isOpen()) await UI.beat(o.ms || 900); else await sleep(Math.min(900, o.ms || 900)); return;
    case 'flag': s.flags[o.id] = o.value === undefined ? true : o.value; return;
    case 'rel': for (const k in o.with || {}) rel(k, o.with[k]); return;
    case 'stage': stage(o); return;
    case 'page': await showPage(o.id); return;
    case 'give': give(o); return;
    case 'go': await go(ch, o, alive); return;
    case 'walk': await walk(ch, o.step, alive); return;
    case 'wait': await waitFor(ch, o, alive); return;
    case 'play': {
      UI.close(); const stp = o.step; stp._left = null;
      if (stp.with) comp.set(present().concat(stp.with));
      const r = await runPlay(stp, ctx(ch, alive)); if (!alive() || r === 'dead') return;
      UI.chip(null); safe(() => G.navGoals.clear());
      for (const l of stp._left || []) { if (!alive()) return; const q = await sayLine(ch, l); if (q === 'out') { stepOut(); return; } }
      return r === 'good' ? o.good : r === 'skip' ? o.end : o.ok;
    }
    case 'end': await finish(ch); return;
    default: console.warn('chapters: unknown step', o.op); return;
  }
}
const present = () => comp.ids();
function rel(id, n) { safe(() => G.social.addRel(id, n, { raw: true })); }
function lineOf(ch, o) {
  const i = who(o.who), off = offstage(ch, o.who, st().cur && st().cur.scene), phone = off === 'phone', style = o.who === 'narrator' ? 'narrator' : o.who === 'nell' ? 'hand' : off ? 'phone' : o.who === 'player' ? 'you' : '';
  return { name: i.short || i.name, spec: i.spec, text: fill(o.text), style, sub: off && !phone ? off : '' };
}
async function sayLine(ch, o) {
  const i = who(o.who), off = offstage(ch, o.who, st().cur && st().cur.scene), phone = off === 'phone', style = o.who === 'narrator' ? 'narrator' : o.who === 'nell' ? 'hand' : off ? 'phone' : o.who === 'player' ? 'you' : '';
  if (!safe(() => G.transit.ride, null)) UI.setModal(true);
  safe(() => G.goalsUI.caption());            /* a caption left over from the walk / the stair / the game must not sit on top of the sheet */
  const c = !style ? comp.char(o.who) : null, P = G.player; let prev;
  if (c) { if (c.stop) c.stop(); if (!c.zoff) c.faceTo(P.x, P.y); if (!G.cutscene && !G.busy) P.faceTo(c.x, c.y); prev = c.pose; if (o.anim && o.anim !== 'stand') c.pose = o.anim; }
  if (phone || (o.who === 'player' && o.anim === 'phone')) P.pose = 'phone'; else if (P.pose === 'phone' && style !== 'narrator' && style !== 'you') P.pose = null;
  const r = await UI.say({ name: i.short || i.name, spec: i.spec, text: fill(o.text), style, sub: off && !phone ? off : '' });
  if (c && o.anim) c.pose = prev || null;
  return r;
}
function ctx(ch, alive) {
  return {
    alive, n: ch.n, kicker: kicker(ch), sleep,
    chip(info) { UI.chip(info ? Object.assign({ kicker: kicker(ch), out: () => stepOut() }, info) : null); if (info && info.goal) safe(() => G.navGoals.set(info.goal)); },
    locate: f => safe(() => G.navGoals.locate(f), null),
    caption(w, text, ms) { const i = who(w); safe(() => G.goalsUI.caption(i.short || i.name || null, fill(text), ms || 4800)); },
    setFlag(id, v) { st().flags[id] = v; },
    async until(pred, maxMs) { const t0 = performance.now(); while (alive()) { if (safe(pred, false)) return true; if (maxMs && performance.now() - t0 > maxMs) return false; await sleep(200); } return false; },
    async fade(fn) { const f = G.fadeEl; if (f) { f.classList.add('on'); await sleep(320); } safe(fn); if (f) { await sleep(200); f.classList.remove('on'); } },
    /* if the player wanders out of the scene's place while the Chapter waits for them at a thing, it leads them back and asks again */
    async doAt(find, label, o) {
      for (let back = 0; ; back++) {
        const r = await doAt(ch, alive, find, label, o); if (r !== 'left') return r; if (back >= 2) return 'done';      /* twice is asking; a third time it is done from wherever you are */
        const cur = st().cur, d = cur ? resolve(sceneOpAt(prog(ch), cur.pc).place) : null; if (!d || here(d) || d.ride) return 'done';
        await travel(ch, d, 'Back to ' + d.name, null, alive); if (!alive()) return 'dead';
      }
    },
  };
}
/** lead the player to a thing in this scene (or just offer the button), wait until they are at it. -> 'done' | 'skip' | 'dead' */
function doAt(ch, alive, find, label, o = {}) {
  return new Promise(res => {
    UI.close(); let ended = false, off = null, iv = null;
    const t = find ? safe(() => G.navGoals.locate(find), null) : null, sid = G.scene.id;
    const end = v => { if (ended) return; ended = true; if (off) off(); clearInterval(iv); safe(() => G.navGoals.clear()); UI.chip(null); res(v); };
    let it = null;
    if (t) {
      const base = t.it || null;
      it = { x: t.x, y: t.y, label, h: 1.2, hit: 18, range: 1.9, scene: sid, spot: base && base.spot ? base.spot : undefined, use: () => end('done') };
      off = G.addInteractable(it);
      safe(() => G.navGoals.set({ room: sid === 'city' ? 'city' : sid.slice(4), find: { x: t.x, y: t.y, h: t.h || 1.6 }, label }));
    }
    let pressed = 0;
    UI.chip({ kicker: kicker(ch), text: label, out: () => stepOut(),
      go: { label: o.go || 'Go on', fn: () => { if (!it) return end('done'); if (!pressed) pressed = performance.now(); if (!G.player.path || !G.pending) safe(() => G.useInteractable(it)); } },      /* already on the way there: a second press does not start the walk over */
      skip: o.skip ? { label: 'Not today', fn: () => end('skip') } : null });
    iv = setInterval(() => {
      if (!alive()) return end('dead');
      if (it && G.scene.id !== sid) return end('left');
      const dt = pressed ? performance.now() - pressed : 0;
      if (dt > 7000 && !G.modal) end('done');                                                  /* could not walk all the way there: do it from where you stand */
      else if (dt > 1300 && !G.modal && !G.player.path && !G.pending) end('done');             /* as near as the room lets you get */
    }, 250);
  });
}

/* ---------- scenes, travel, companions ---------- */
async function enterScene(ch, o, alive, back) {
  const s = st(), d = resolve(o.place); s.cur.scene = o.id;
  if (d && d.ride) { if (safe(() => G.transit.ride, null)) { comp.hide(true); UI.setModal(false); } return; }
  UI.setModal(true);
  if (safe(() => G.transit.ride, null)) {            /* still on the road: let the ride finish (or skip the rest of it) */
    UI.close(); UI.chip(null);                      /* the cab's own strip (with its Skip ride button) is on screen */
    while (alive() && safe(() => G.transit.ride, null)) await sleep(250);
    UI.chip(null); await sleep(700); if (!alive()) return;
  }
  comp.hide(false);
  if (d && !here(d)) {
    if ((back || s.cur.back) && d.room && inCity() && Math.hypot(G.player.x - d.x, G.player.y - d.y) < 8) { UI.close(); await hop(d, true); }      /* picked up at the marker by the door: you walk straight in */
    else if (back || s.cur.back) { UI.close(); comp.set(o.cast); await travel(ch, d, 'Back to ' + d.name, null, alive); }
    else { UI.close(); await hop(d, true); }
  }
  s.cur.back = 0; if (!alive()) return;
  comp.set(present().concat(o.cast)); comp.retuck();
  if (o.cast.includes('nana') || o.cast.length) for (const w of o.cast) if (CAST_OK(w)) safe(() => G.social.meet(w));
  if (d) safe(() => G.places.discover(d.root || d.room || d.id, true));
}
const CAST_OK = w => !!safe(() => G.social.npc(w), null);
async function hop(d, cut) {
  if (hopping) return; hopping = true;
  try {
    if (G.busy) G.endActivity(false);
    if (d.room) { if (inCity() && d.door) await enterRoom(d.room, d.door); else if (ROOMS.get(d.room) && ROOMS.get(d.room).build) await enterRoom(d.room); else await G.go('int:' + d.room, {}); }
    else if (d.spot) { const f = freeNear(cityWorld(), d.x, d.y); await G.go('city', { x: f.x, y: f.y }); }
  } catch (e) { console.warn('chapters hop', e); }
  hopping = false;
}
async function travel(ch, d, label, note, alive) {
  const t0 = performance.now(); let noted = false, pinFor = null;
  curDest = d;
  while (alive() && !here(d)) {
    const inside = !inCity(), same = sameBuilding(d);
    const info = { kicker: kicker(ch), text: label, out: () => stepOut(), go: null };
    if (same) info.go = { label: 'Go', fn: () => hop(d) };
    else if (inside && !G.cutscene) info.go = { label: 'Step outside', fn: () => { if (!G.busy && !G.modal) safe(() => exitRoom()); } };
    UI.chip(info);
    const key = G.scene.id + '>' + d.id;
    if (pinFor !== key || !safe(() => G.state.navgoals.pin, null)) { pinFor = key; safe(() => G.navGoals.set({ room: d.room || 'city', find: d.room ? null : { x: d.x, y: d.y, h: 2 }, label, short: d.name, name: d.name })); }
    if (d.room && inCity() && !G.cutscene && !G.modal && Math.hypot(G.player.x - d.x, G.player.y - d.y) < 2.3) await hop(d);
    if (note && !noted && performance.now() - t0 > 60000 && !G.modal) { noted = true; UI.toastGold(fill(note), 6200); }      /* a minute on the road: the company says its one line about the way */
    await sleep(220);
  }
  curDest = null; safe(() => G.navGoals.clear()); UI.chip(null);
  if (alive() && safe(() => G.nav.trip(), null)) safe(() => G.nav.cancel());
  if (alive() && safe(() => G.state.phone.waypoint, null)) safe(() => G.phone.setWaypoint(null));
}
async function go(ch, o, alive) {
  const s = st(), d = resolve(o.place); UI.close(); G.player.pose = null;
  if (!d) { console.warn('chapters: unknown place', o.place); return; }
  comp.set(o.with || []); comp.follow(true); s.cur.went = null; lastRide = null;
  if (o.by === 'cab' && o.must) {
    /* the cab is called for you (no fare); you walk to it; the next scene plays inside it while it drives */
    UI.chip({ kicker: kicker(ch), text: o.label, out: () => stepOut() });
    let rode = false, failed = false; const t0 = performance.now(), P = G.player;
    const off = G.on('ride:start', () => { rode = true; }), offH = G.on('taxi:here', cab => { if (cab && !G.busy && !G.modal) safe(() => P.goTo(G.world, cab.x, cab.y, { snap: 8 })); });
    if (!inCity()) { safe(() => exitRoom()); await sleep(900); }
    /* a cab standing at the rank is hailed (it is right there at Arrivals); otherwise one is called. Either way the destination and the fare are settled for you. */
    const pl = safe(() => G.places.get(d.root || d.room || d.id), null);
    const pr = safe(() => G.transit.hailTaxi(), null), pd = safe(() => G.transit.pending, null);
    if (pd && pl) { pd.place = pl; pd.opts = Object.assign({}, pd.opts, { free: true, silent: true }); } else if (!pd) failed = true;
    if (pr && pr.then) pr.then(v => { if (v === false) failed = true; }); else failed = true;
    while (alive() && !rode && !failed && performance.now() - t0 < 150000) {
      const cab = safe(() => G.transit.pending.cab, null);
      if (cab && safe(() => G.transit.pending.state, '') === 'waiting' && !P.path && Math.hypot(P.x - cab.x, P.y - cab.y) > 3) safe(() => P.goTo(G.world, cab.x, cab.y, { snap: 8 }));
      await sleep(300);
    }
    off(); offH(); UI.chip(null); if (!alive()) return;
    if (!rode) safe(() => G.transit.cancel());
    s.cur.went = 'cab'; return;
  }
  await travel(ch, d, o.label, o.note, alive);
  s.cur.went = lastRide || 'walk';
}
async function walk(ch, stp, alive) {
  const MAP = { panorama_glass: [{ label: /panorama|glass|view|window|telescope/i }], dig_pit: [{ label: /dig/i }], tram_case: [{ label: /tram|streetcar|car no|number nine/i }] };
  const t = safe(() => G.navGoals.locate(MAP[stp.to] || [{ label: new RegExp(String(stp.to).replace(/_/g, ' '), 'i') }]), null);
  if (stp.with) comp.set(present().concat(stp.with));
  if (t && !G.busy) { UI.close(); const P = G.player, f = freeNear(G.world, t.x, t.y + 1, 3); if (P.goTo(G.world, f.x, f.y, { snap: 8 })) { for (let k = 0; k < 40 && alive() && P.path; k++) await sleep(200); } }
}
async function waitFor(ch, o, alive) {
  UI.close(); const isJob = o.event === 'job:hired'; if (isJob && safe(() => G.jobs.current(), null)) return;
  let hit = false; const off = G.on(o.event, () => { hit = true; });
  UI.chip({ kicker: kicker(ch), text: o.label, out: () => stepOut(), go: isJob ? { label: 'See the listings', fn: () => safe(() => G.jobs.openBoard({ source: 'phone' })) } : null });
  while (alive() && !hit) { if (isJob && safe(() => G.jobs.current(), null)) break; await sleep(250); }
  off(); UI.chip(null);
}
function stage(o) {
  const t = safe(() => G.navGoals.locate([{ label: new RegExp(String(o.at).replace(/_/g, ' '), 'i') }]), null);
  comp.set(present().concat([o.who])); if (t) comp.send(o.who, t.x, t.y + .8); comp.pose(o.who, o.anim);
}

/* ---------- give / pages / keepsakes ---------- */
/* Story furniture: the keepsakes that are also things for the home. Each is a real home item (registered here at import, the way data/goods rows are): the
   armchair comes with tomorrow's deliveries, the shelf is carried up by Dez (straight into storage), the two photographs arrive framed, to hang in Decorate. */
const STORY_FURN = {
  ch_nana_armchair: { name: "Nana's Attic Armchair", tag: 'sofa', art: 'armchair', p: { tier: 1, c: '#3f7a52', c2: '#e9dcc0' }, amb: 3, place: 'floor' },
  ch_wobbly_shelf: { name: "Theo's Wobbly Shelf", tag: 'bookshelf', art: 'bookshelf', p: { tier: 0 }, amb: 2, place: 'floor' },
  ch_kettle_photo: { name: 'The Copper Kettle, June 1985 (framed)', tag: 'decor', art: 'story.kettlephoto', p: {}, amb: 2, place: 'wall', mount: 1.2 },
  ch_year_photo: { name: 'Everyone at the Lookout (framed)', tag: 'decor', art: 'story.yearphoto', p: {}, amb: 3, place: 'wall', mount: 1.15 },
};
for (const id in STORY_FURN) {
  const g = STORY_FURN[id]; if (ITEM_BY_ID[id]) continue;
  const it = { id, name: g.name, category: 'homegood', price: 0, icon: g.name.toLowerCase(), effects: {}, stack: 1, soldAt: [], tag: g.tag, tier: 1, footprint: [1, 1], placement: g.place, bonus: Object.assign({ mult: 1, ambience: g.amb }, g.tag === 'bookshelf' ? { capacity: 6 } : {}), story: 1 };
  ITEMS.push(it); ITEM_BY_ID[id] = it; VIS[id] = { a: g.art, p: g.p, mount: g.mount };
}
const FURN = { nana_armchair: 'ch_nana_armchair', wobbly_shelf: 'ch_wobbly_shelf', kettle_photo: 'ch_kettle_photo', year_photo: 'ch_year_photo' };
function furnish(id, quiet) {
  const s = st(); s.furn = s.furn || {}; if (!FURN[id] || s.furn[id]) return; s.furn[id] = 1;
  const ok = safe(() => G.housing.addFurniture(FURN[id], { quiet: true, instant: id === 'wobbly_shelf' }), false);
  if (ok && !quiet && /photo/.test(id)) setTimeout(() => toast('It comes framed with tomorrow\'s deliveries. Hang it from Decorate.', 'info', 4200), 5200);
}
/* the standing family invitations: they go on the calendar through the old story engine's weekly `recur` list (kind 'friend' appointments you may keep or not) */
const RECUR = { sunday_dinner: { title: 'Sunday dinner on Sycamore Lane', place: 'home_jules', weekday: 'sun', from: '17:30', to: '20:30' }, kettle_corner_tea: { title: 'Saturday tea at the Kettle Corner', place: 'bakery', weekday: 'sat', from: '15:00', to: '17:00' } };
const NAMES = { paper_lantern: 'A paper lantern, the spare one', tram_ticket: 'A lifetime ticket for No. 9', postcard: 'A postcard of the Light', sky_poster: 'The SkyDeck poster', obs_starwheel: 'A star wheel, with the Kettle drawn on in pen', fm_tally: "A brass buyer's tally" };
function itemName(id) { return NAMES[id] || (ITEMS_NEW[id] && ITEMS_NEW[id].name) || (STORY_ITEMS[id] && STORY_ITEMS[id].name) || (ITEM_BY_ID[id] && ITEM_BY_ID[id].name) || (RECIPE_BY_ID[id] && RECIPE_BY_ID[id].name) || id; }
function keep(id) { const s = st(); if (!s.keeps.includes(id)) s.keeps.push(id); const k = safe(() => G.story.keepsakes(), null); if (k && !k.includes(id)) k.push(id); }
function give(o, quiet) {
  const s = st(), say = t => { if (!quiet && t) UI.toastGold(fill(t), 4600); };
  if (o.type === 'item') {
    if (ITEM_BY_ID[o.id] && !ITEMS_NEW[o.id] && !STORY_ITEMS[o.id]) { if (!safe(() => G.inv.add(o.id, o.n || 1, { silent: true }), false)) safe(() => G.inv.fridge.add(o.id, o.n || 1, { silent: true })); }
    else {
      const had = s.keeps.includes(o.id); keep(o.id);
      if (FURN[o.id]) furnish(o.id, quiet);
      if (!had && o.id === 'nana_jam') safe(() => G.needs.addMoodlet('home_cooked', 2));
    }
    if (o.id === 'nells_book') { s.pages.cover = s.pages.cover === undefined ? G.now().day : s.pages.cover; WORLD.sync(); }
  } else if (o.type === 'recipe') { safe(() => G.cooking.learn(o.id, 'story')); (G.state.flags || {})['recipe:' + o.id] = true; const r = safe(() => G.story.recipes(), null); if (r && !r.includes(o.id)) r.push(o.id); }
  else if (o.type === 'meal') { safe(() => G.needs.add('hunger', 46)); safe(() => G.needs.add('fun', 6)); safe(() => G.needs.add('social', 8)); G.emit('chapter:meal', o.id); }
  else if (o.type === 'money') safe(() => G.money.add(o.n || 0, 'story'));
  else if (o.type === 'ticket') { if (o.id === 'skydeck' && !safe(() => G.showpieces.skydeck.hasTicket(), true)) { safe(() => G.money.add(8, 'gift')); safe(() => G.showpieces.skydeck.buyTicket()); } }
  else if (o.type === 'contact') contact(o.id);
  else if (o.type === 'flag' || o.type === 'ability' || o.type === 'recurring' || o.type === 'opportunity') { if (o.id) s.flags[o.id] = true; if (o.type === 'flag' && o.id) (G.state.flags || {})[o.id] = true; }
  if (o.type === 'recurring' && RECUR[o.id]) { const r = safe(() => G.story.state().recur, null); if (r && !r[o.id]) r[o.id] = Object.assign({ last: -1 }, RECUR[o.id]); }
  else if (o.type === 'place') safe(() => G.places.discover(placeIdOf(o.id), true));
  else if (o.type === 'page') foundPage(o.id, true);
  else if (o.type === 'rel') rel(o.id, o.n || 0);
  say(o.text);
}
function contact(id) { const s = st(); if (CAST_OK(id)) { safe(() => G.social.meet(id)); if (id === 'dad' && safe(() => G.social.rel('dad'), 0) < 45) safe(() => G.social.setRel('dad', 45)); } else { s.flags['contact:' + id] = true; } }
function foundPage(id, quiet) {
  const s = st(), first = s.pages[id] === undefined; if (first) s.pages[id] = G.now().day;
  if (first) { G.emit('chapter:page', id); WORLD.sync(); }
  return first;
}
function bookPages() {
  const s = st(), out = [{ id: 'cover', n: 0, title: BOOK.title, text: BOOK.cover.concat(BOOK.contents), state: 'written' }];
  const ids = Object.keys(BOOK.pages).filter(id => s.pages[id] !== undefined).sort((a, b) => BOOK.pages[a].n - BOOK.pages[b].n || (a < b ? -1 : 1));
  for (const id of ids) { const p = BOOK.pages[id]; let text = p.text, note = p.todo ? 'To do there: ' + p.todo : null; if (id === 'lookout' && s.page13) { text = s.page13; note = null; } out.push({ id, n: p.n, title: p.title, text, state: id === 'lookout' && s.page13 ? 'family' : p.state, note }); }
  if (s.done.ch15) for (const f of FAMILY_PAGES) { if (f.by === 'player') continue; out.push({ id: 'fam_' + f.by, n: null, title: f.title, text: f.text, state: 'family', by: '— ' + (who(f.by).short || f.by) }); }
  return out;
}
async function showPage(id) {
  UI.close(); foundPage(id); const pages = bookPages(), at = Math.max(0, pages.findIndex(p => p.id === id));
  await UI.book({ title: BOOK.title, pages: id === 'cover' ? pages.slice(0, 1) : pages, at: id === 'cover' ? 0 : at });
}
function pins() {
  const s = st(), out = []; if (s.pages.cover === undefined && !s.keeps.includes('nells_book')) return out;
  for (const id in s.pages) { const p = BOOK.pages[id]; if (!p || !p.pin) continue; const d = resolve(p.place); if (d) out.push({ id, x: d.x, y: d.y, note: p.pin, title: p.title }); }
  return out;
}

/* ---------- "A page from the book" (pages 6-10): one quiet Opportunity at a time, from Chapter 6 on, never timed. Going to the place she wrote about
   finds the page: it opens in her handwriting, pins itself on the Map, and the next one is offered another day. ---------- */
const PAGE_OPPS = ['glasshouse', 'baths', 'grandmaple', 'orpheum', 'numbernine'];
const oppNow = () => safe(() => G.goals.list().find(g => /^bookpage:/.test(g.id) && !g.done), null);
function pageOpp() {
  const s = st(); if (!s.done.ch06 || s.cur || oppNow() || !G.goals) return;
  const id = PAGE_OPPS.find(k => s.pages[k] === undefined); if (!id || (s.pageDay !== undefined && G.now().day <= s.pageDay)) return;
  const p = BOOK.pages[id], d = resolve(p.place), pl = d && safe(() => G.places.get(d.root || d.room || d.id), null);
  G.goals.add({ id: 'bookpage:' + id, group: 'opportunity', text: 'A page from the book: ' + p.title, hint: (p.todo || 'Go and stand where she stood.') + ' No rush.', placeId: pl ? pl.id : undefined, doneText: 'A page found: ' + p.title });
}
async function pageVisit() {
  const s = st(), g = oppNow(); if (!g || s.cur || G.modal || G.busy || G.cutscene || running || MOMENTS.playing()) return;
  const id = g.id.slice(9), p = BOOK.pages[id], d = p && resolve(p.place); if (!d || !here(d)) return;
  s.pageDay = G.now().day; foundPage(id); safe(() => G.goals.complete(g.id)); save();
  await UI.book({ title: BOOK.title, pages: bookPages(), at: Math.max(0, bookPages().findIndex(q => q.id === id)) });
}

/* ---------- finishing ---------- */
const BEATS_OF = { ch01: ['g1_breakfast'], ch03: ['f1_welcome_dinner'], ch08: ['g5_the_bell'], ch09: ['g4_bookshop_clue'], ch13: ['g2_copper_kettle', 'g3_sunday_baking'], ch14: ['f3_booth_building', 'f4_summer_fair'], ch15: ['s3_one_year'] };
function takeawayLines(ch) {
  const out = [];
  for (const t of ch.takeaway || []) {
    if (t.text) out.push(t.text);
    else if (t.type === 'item') out.push(itemName(t.id));
    else if (t.type === 'recipe') out.push('A recipe: ' + itemName(t.id));
    else if (t.type === 'place') { const d = resolve(t.id); if (d) out.push('You know the way to ' + d.name.replace(/^The /, 'the ')); }
    else if (t.type === 'contact') out.push((who(t.id).short || t.id) + "'s number");
    else if (t.type === 'page') { if (t.id !== 'cover' && BOOK.pages[t.id]) out.push('A page of the book: ' + BOOK.pages[t.id].title); }
  }
  return out.map(fill);
}
function settle(ch, silent) {
  const s = st();
  for (const t of ch.takeaway || []) {
    if (t.type === 'rel') { if (!silent) rel(t.id, t.n || 0); }
    else if (t.type === 'contact' || t.type === 'place' || t.type === 'page' || t.type === 'flag' || t.type === 'ability' || t.type === 'opportunity' || t.type === 'recurring') give(t, true);
    else if (silent && (t.type === 'recipe' || t.type === 'item')) { if (t.type === 'recipe' || !s.keeps.includes(t.id)) give(t, true); }
  }
  for (const b of BEATS_OF[ch.id] || []) safe(() => G.story.credit(b));
}
async function finish(ch) {
  const s = st(); UI.close(); UI.chip(null); safe(() => G.navGoals.clear()); G.player.pose = null; holdDoors(false);
  settle(ch, false);
  s.done[ch.id] = { t: Math.floor(G.state.t), day: G.now().day }; s.cur = null; tok++; running = false;
  linger = true; comp.follow(false); G.emit('chapter:done', ch.id); G.emit('story:beat', ch.id);   /* the company stays where it stands until you leave the place */ refresh(); G.emit('chapters:change'); save();
  const nx = CHAPTERS[ch.n];
  await UI.endCard({ kicker: kicker(ch) + ' · done', title: ch.title, lines: takeawayLines(ch), next: nx ? "There's more, when you're ready. No rush." : 'The book is still not finished. Good.' });
  safe(() => G.audio.sfx('success'));
}

/* ---------- old saves: sensible credit (decided here, documented in docs/reports/chapters.md) ----------
   The old beats told a different, shorter family story; Act Two onward (the book) is new to everybody, so credit stops at Act One:
     g1_breakfast done            -> Chapter 1 done
     f1_welcome_dinner done       -> Chapters 1-3 done (you have eaten at both houses and know the town)
     ... and has, or has had, a job -> Chapter 4 done
     ... and f3_booth_building done (Theo's shelf) -> Chapter 5 done
   Credited Chapters give their recipes / contacts / places silently; keepsakes and relationships already earned are untouched. */
function credit() {
  const s = st(); if (s.credited) return; s.credited = 1;
  const bs = id => safe(() => G.story.beat(id).st, 'pending') === 'done', mark = id => { if (!s.done[id]) { s.done[id] = { t: Math.floor(G.state.t), day: G.now().day, credit: 1 }; settle(CHAPTERS_BY_ID[id], true); s.note[id] = 1; } };
  if (!Object.keys(safe(() => G.story.state().beats, {})).length) return;
  if (bs('g1_breakfast')) mark('ch01');
  if (bs('f1_welcome_dinner')) { mark('ch01'); mark('ch02'); mark('ch03'); if (safe(() => G.jobs.current(), null) || safe(() => G.state.ach.c.job_accepted, 0)) { mark('ch04'); if (bs('f3_booth_building')) mark('ch05'); } }
  for (const k of s.keeps.concat(safe(() => G.story.keepsakes(), []))) if (!s.keeps.includes(k)) s.keeps.push(k);
}
/** saves from before the story furniture existed: the armchair, the shelf and the photographs you already have are sent round (once) */
function furnishOwed() { const s = st(); for (const k of s.keeps) if (FURN[k] && !(s.furn || {})[k] && safe(() => G.housing.current(), null)) furnish(k, true); }

/* ---------- Dad lives in Pinehollow: asked out from his contact card he answers like himself, and nobody is left waiting for him at a cafe.
   (He is in town only inside Chapter 15 and, afterwards, for the first week of a season: then he is in your chair and says so.) ---------- */
const DAD_NO = ['Too far for these knees today. Go, and ring me from there. Tell me what I am looking at.', "It's a long road from Pinehollow. You go. Then describe it. Properly, mind.", 'Not this time. Send a postcard of it. I have the one of the Light on the fridge.'];
const DAD_HERE = ["I've only just got this chair how I like it. You go on. Tell me about it after.", 'I came to be shown, not marched. Tomorrow, maybe. Tell me what it was like.'];
function dadStaysHome() {
  const So = G.social; if (!So || !So.invite || So.invite.chDad) return;
  const orig = So.invite, f = (npc, a) => {
    if (npc !== 'dad') return orig(npc, a);
    const here = safe(() => MOMENTS.list().find(m => m.id === 'fm_dad_visit').due, null), pool = here ? DAD_HERE : DAD_NO, text = pool[Math.floor(G.state.t / 7) % pool.length];
    safe(() => G.messages.sendMine('dad', `${(a && a.title) || 'Come out with me'}. Want to come?`));
    safe(() => G.messages.send({ from: 'dad', name: 'Dad', text, delay: 4 }));
    return false;
  };
  f.chDad = 1; So.invite = f;
}

/* ================= debug ================= */
const debug = {
  state: () => st(), ops: n => prog(chOf(n)),
  /** where the running Chapter is waiting for the player to get to (tests): { id, name, room, x, y } | null */
  dest: () => (curDest ? { id: curDest.id, name: curDest.name, room: curDest.room, x: curDest.x, y: curDest.y } : null),
  /** move the clock forward to the next moment Chapter n can be started */
  toWindow(n) { const ch = chOf(n); if (!ch) return false; for (let k = 0; k < 8 * 96 && !windowOpen(ch); k++) G.advance(15); return windowOpen(ch); },
  /** make Chapter n the open one right now (earlier ones are marked done, quietly) */
  unlock(n) { const ch = chOf(n), s = st(); if (!ch) return false; if (s.cur) stepOut(true); s.cur = null; for (const c of CHAPTERS) { if (c.n < ch.n) s.done[c.id] = Object.assign({ t: 0, day: 0 }, s.done[c.id], { credit: 1 }); else delete s.done[c.id]; } s.note[ch.id] = 1; refresh(); return true; },
  start(n) { const ch = chOf(n); if (!debug.unlock(n)) return false; return begin(ch.id); },
  skipTo(n, step) { const ch = chOf(n); if (!debug.unlock(n)) return false; const s = st(); s.cur = { id: ch.id, pc: Math.max(0, Math.min(prog(ch).length - 1, step | 0)), paused: false, t0: Math.floor(G.state.t), went: null, back: 0 }; loop(); return true; },
  finish(n) { const ch = chOf(n), s = st(); if (!ch) return false; if (s.cur) stepOut(true); s.cur = null; for (const c of CHAPTERS) if (c.n <= ch.n && !s.done[c.id]) { s.done[c.id] = { t: Math.floor(G.state.t) - DAY, day: G.now().day - 1, credit: c.n < ch.n ? 1 : undefined }; settle(c, true); } refresh(); G.emit('chapters:change'); return true; },
  reset() { if (st().cur) stepOut(true); const k = fresh(); k.introT = null; k.credited = 1; G.state.chapters = k; S = null; st(); refresh(); G.emit('chapters:change'); return true; },
  /** the dev menu's "Chapters…" entry: pick a Chapter, then jump to its marker / start it / mark it done / reset the story */
  async menu() {
    const n = await choose('Chapters', CHAPTERS.map(c => ({ label: `${kicker(c)} · ${c.title}`, sub: stateOf(c), value: c.n })), { cls: 'dev-list' }); if (!n) return;
    const v = await choose(`${kicker(chOf(n))} · ${chOf(n).title}`, [{ label: 'Jump to its marker (opens it, moves the clock into its window)', value: 'go' }, { label: 'Start it right here', value: 'start' }, { label: 'Mark it done (and every Chapter before it)', value: 'done' }, { label: 'Reset the whole story', value: 'reset' }], { cls: 'dev-list' });
    if (v === 'go') { debug.unlock(n); debug.toWindow(n); await debug.toMarker(); } else if (v === 'start') { debug.unlock(n); debug.toWindow(n); debug.start(n); } else if (v === 'done') debug.finish(n); else if (v === 'reset') debug.reset();
  },
  toMarker() { const r = rowInfo(); if (!r || !r.place) return false; const f = freeNear(cityWorld(), r.place.x + 1.5, r.place.y + 2); return G.go('city', { x: f.x, y: f.y }); },
};

/* ================= init ================= */
export function init() {
  G.defineState('chapters', fresh); st();
  for (const id in ITEMS_NEW) if (!STORY_ITEMS[id]) STORY_ITEMS[id] = ITEMS_NEW[id];     /* the new keepsake rows, next to the old ones */
  G.chapters = {
    list: () => CHAPTERS.map(c => { const state = stateOf(c), u = state === 'waiting' ? unlockInfo(c) : null; return { id: c.id, n: c.n, title: c.title, state, hook: c.hook, ready: c.ready, waiting: u ? u.waiting : null }; }),
    row: rowInfo, current: () => { const c = st().cur; return c ? { id: c.id, n: CHAPTERS_BY_ID[c.id].n, title: CHAPTERS_BY_ID[c.id].title, pc: c.pc, paused: !!c.paused } : null; },
    active: () => { const c = st().cur; return !!c && !c.paused; }, done: id => !!st().done[id],
    open: openCard, begin, stepOut: () => stepOut(), resume: resumeNow,
    pick: id => st().picks[id], flag: id => st().flags[id], test, fill,
    book: { has: () => st().keeps.includes('nells_book') || st().pages.cover !== undefined, open: id => UI.book({ title: BOOK.title, pages: bookPages(), at: id ? Math.max(0, bookPages().findIndex(p => p.id === id)) : 0 }),
      pages: () => Object.keys(BOOK.pages).map(id => ({ id, n: BOOK.pages[id].n, title: BOOK.pages[id].title, place: BOOK.pages[id].place, found: st().pages[id] !== undefined })), pins },
    keepsakes: () => st().keeps.slice(), marker: () => WORLD.marker(), debug, windowOpen: n => windowOpen(chOf(n)),
    moments: { list: MOMENTS.list, playing: MOMENTS.playing, debug: MOMENTS.debug },
  };
  MOMENTS.init({ st, test, fill, give: o => give(o), say: o => sayLine({ id: 'fm' }, o), done: id => !!st().done[id], active: () => { const c = st().cur; return (!!c && !c.paused) || running || linger; } });
  dadStaysHome();
  WORLD.init({ openCard, pins, hasBook: () => G.chapters.book.has(), openBook: () => G.chapters.book.open(), done: id => !!st().done[id] });
  G.on('intro:done', () => { const s = st(); if (s.introT === null || s.introT === undefined) s.introT = Math.floor(G.state.t); });
  G.on('job:shift:end', () => { st().worked = (st().worked || 0) + 1; });
  G.on('ride:end', kind => { lastRide = kind === 'taxi' ? 'cab' : kind; });
  G.on('scene', () => { if (linger) { linger = false; comp.clear(); comp.follow(true); } if (st().cur && !st().cur.paused) setTimeout(() => comp.rescene(), 0); setTimeout(refresh, 300); setTimeout(() => safe(doorStart), 650); });
  G.on('minutes', () => {
    const s = st(); if (s.cur && !s.cur.paused && G.needs) for (const k of ['hunger', 'energy', 'hygiene', 'fun', 'social', 'bladder']) { const v = safe(() => G.needs.get(k), 100); if (v < NEED_FLOOR) safe(() => G.needs.set(k, NEED_FLOOR)); }
  });
  let acc = 0;
  G.addSystem({ name: 'chapters', update(dt) { if (st().cur && !st().cur.paused) comp.update(dt); acc += dt; if (acc > 1) { acc = 0; safe(refresh); safe(pageOpp); pageVisit().catch(() => 0); safe(MOMENTS.tick); } } });
  const wake = () => { S = null; const s = st(); tok++; running = false; hopping = false; PROG = {}; UI.close(); UI.chip(null); comp.clear(); safe(credit); safe(furnishOwed); safe(refresh);
    if (s.cur && !s.cur.paused) { s.cur.back = 1; const go = () => { if (!G.scene || G.modal || G.cutscene || !(G.state.flags || {}).introDone && s.cur.id !== 'ch01') return setTimeout(go, 500); loop(); }; setTimeout(go, 900); } };
  G.on('load', wake); G.on('game:start', () => { safe(dadStaysHome); safe(credit); safe(furnishOwed); safe(refresh); if (st().cur && !st().cur.paused && !running) wake(); });
  G.on('game:new', () => { G.state.chapters = fresh(); G.state.chapters.credited = 1; S = null; st(); });
}
