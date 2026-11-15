// jobstory.js — G.jobStory: JOBS WITH STORIES (BIBLE direction updates 3-5; design docs/story/JOBS.md; data src/story/jobs_arcs.js + jobs_a..e.js + jobs_new.js).
// Every job is a place with people in it: a cast, an arc of nine beats, one distinctive piece of play, ambient lines, texts, an Opportunity, a keepsake.
// This module makes that data run. It sits on top of sim/jobs.js (employment, shifts, pay) and plays its scenes through the Chapters' dialogue sheet
// (ui/chapters_ui.js: portrait, typed text, choices as buttons, the Log), so a job scene looks and behaves like a Chapter scene.
//
// WHAT HAPPENS ON A SHIFT
//   clock-in   sim/jobs.js calls clockIn(job, shift, { work, skip }). The shift is counted as ATTENDED for this job (once a day, kept for good).
//              A beat that is due `at: 'clockin'` (or one that was interrupted earlier) plays first. Then the card: "Work the shift" / "Skip to the end".
//              Skip = the existing auto-work (paid at the flat score, tips at the auto share): credit and pay for showing up. A mid / clock-out beat that is
//              due WAITS for the next worked shift; once it has waited through two skipped shifts the card has a third button, "Just the moment, then skip".
//   working    about halfway, at a lull (no task running, nothing open), a `mid` beat plays. On a shift with no mid beat the job's PLAY appears as one pink
//              ticket at one of the job's stations (sim/_jobplay_games.js). Coworkers stand in the room and say the job's ambient lines (a no-repeat bag).
//   clock-out  a `clockout` beat plays before the pay card.
//   Never more than one beat a shift, never on two shifts running (except beats 1 and 2), never while a Chapter is being played.
// OFF-SHIFT BEATS are invitations: the invite text arrives, a pinned Idea appears in My Day ("They are expecting you"; Add = an appointment), and the scene
//   plays when the player is at the place inside the window. They never expire; the next beat waits for them a while (PACING.offBeats) and then goes on.
// QUITTING freezes the arc (counters, picks and done beats are per job and kept); coming back resumes at the next beat.
//
// TRIGGERS (`when`, story/_jobs_kit.js TRIGGER_KEYS): shifts, pick, flag, notFlag, after are hard; weekday, weather, season, event, dom, level, promoted,
//   rel, skill, chapter are soft and lapse at `orShifts`.   CONDITIONS in `if` steps and line conditions: pick: flag: weather: season: done: festival: level:
//   rel: day: (anything else is handed to G.chapters.test).   EFFECTS (EFFECT_KEYS): rel, flag, xp, money, mood, perf, text, opp, item, need.
//
// G.jobStory = {
//   clockIn(job, shift, cb), shiftEnd(summary, show, quiet), addRel(id, d)        called by sim/jobs.js
//   arc(jobId) -> { title, premise, shifts, beats: [{ id, n, title, at, done, due }] }        next(jobId?) -> the beat that would play on the next shift | null
//   rel(id) -> points with a person who is not in cast.js (cast people use G.social)          pick(choiceId)   flag(id)   keepsakes() -> [{ id, name, desc }]
//   play(jobId?) -> Promise<score | null>    the job's play, right now          hasPlay(jobId)          active() -> a beat is on screen
//   debug: { list(jobId?), fire(beatId), setShifts(jobId, n), reset(jobId?), play(jobId), clockIn(jobId, level?), stations(jobId?), line(jobId?), texts(), state(), menu() }
// }
// Events: 'jobstory:beat'(beatId)  'jobstory:beat:start'(beatId)  'jobstory:choice'(choiceId, optionId)  'jobstory:invite'(beatId)  'jobstory:play'(jobId, score)  'jobstory:keepsake'(itemId)
// State (in the jobs slice, so old saves simply gain it): G.state.jobs.story = { v, jobs: { [jobId]: { shifts, day, done: { beatId: shiftNo }, last, wait, plays,
//   best, mem } }, picks: { choiceId: optionId }, rel: { speakerId: n }, keeps: [itemId], q: [{ id, at }] (texts on their way), sent: { textId: day },
//   textDay, cur: { id, job, pc } | null (the beat on screen: survives save / load on any line), held: { beatId: pc } (beats put down half-way while another played), bags: { jobId: [line indices left] }, off: { beatId: { n, t, pin } } }
//   Story flags are G.state.flags (also 'beat:<beatId>' when a beat ends), as the data files and the Opportunities expect.
// Adding a job / beat / play: docs/reports/jobs_engine.md.
import { G } from '../core/game.js';
import { ARCS, BEATS_BY_ID, CASTS, SPEAKERS, SHIFT_LINES, TEXTS, OPPS, ITEMS_NEW, MOODLETS_NEW, PLAYS, JOB_IDS } from '../story/jobs_arcs.js';
import { JOB_BY_ID } from '../data/jobs.js';
import { MOODLETS } from '../data/needs.js';
import { POOL, POOL_BY_ID } from '../data/opportunities.js';
import { ROOMS, enterRoom } from '../scenes/interior.js';
import { UI } from '../ui/chapters_ui.js';
import { el, root, toast, bubble, choose } from '../ui/kit.js';
import * as WK from './_jobs_work.js';
import { who, isCast, figures } from './_jobstory_cast.js';
import { PLAY, STATION, KIND, WORDS } from './_jobplay_games.js';
import { runPlay, injectCss } from './_jobplay_kit.js';
import { STATIONS, debugStations, stationsFor } from './_jobstory_stations.js';
import { grant, sync as syncKeeps, TEACHES } from './_jobstory_keeps.js';
import { OUTDOOR } from './_social_data.js';

export const order = 126;   /* right after sim/jobs.js (120) */
const DAY = 1440, SEASONS = ['spring', 'summer', 'autumn', 'winter'], WDL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export const TUNE = { midAt: .42, playAt: .3, playUntil: .85, lineEvery: [25, 40], lineFirst: 6, waitButton: 2, offWait: 6, textQuiet: [21.5, 7.5], playBonus: 3, playXp: 18 };
const safe = (f, d) => { try { const v = f(); return v === undefined || v === null ? d : v; } catch (e) { return d; } };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const cl = (v, a, b) => Math.max(a, Math.min(b, v)), today = () => Math.floor(G.state.t / DAY);
const fmt = n => (G.money && G.money.fmt ? G.money.fmt(n) : '$' + n);

/* ---------- state ---------- */
const fresh = () => ({ v: 1, jobs: {}, picks: {}, rel: {}, keeps: [], given: {}, q: [], sent: {}, textDay: -1, cur: null, held: {}, bags: {}, off: {} });
function st() { const J = G.state.jobs || (G.state.jobs = {}); let s = J.story; if (!s || typeof s !== 'object') s = J.story = fresh(); const f = fresh(); for (const k in f) if (s[k] === undefined) s[k] = f[k]; return s; }
function jr(id) { const s = st(); return s.jobs[id] || (s.jobs[id] = { shifts: 0, day: -1, done: {}, last: -9, wait: 0, plays: 0, best: 0, mem: {} }); }
const flags = () => G.state.flags || (G.state.flags = {});
const flag = id => !!flags()[id];
const setFlag = id => { if (!flags()[id]) { flags()[id] = 1; G.emit('flag', id); } };
const curJob = () => safe(() => G.jobs.current(), null);
const levelOf = jobId => { const c = curJob(); return c && c.id === jobId ? c.level : safe(() => G.state.jobs.history[jobId].level, 1); };
const wx = () => String(safe(() => G.weather.current().kind, 'clear'));
const eventOn = id => safe(() => G.planner.eventsOn(today()), []).some(e => e.data && e.data.eventId === id) || safe(() => G.cityEvents.list(), []).some(e => e.id === id && e.day === today());
const chapterBusy = () => !!safe(() => G.chapters.active(), false);
const relOf = id => (isCast(id) ? safe(() => G.social.rel(id), 0) : st().rel[id] || 0);
function addRel(id, d) { if (!id || !d) return; if (isCast(id)) { safe(() => { if (!(G.social.known() || []).includes(id)) G.social.meet(id); G.social.addRel(id, d, { raw: true }); }); return; } const s = st(); s.rel[id] = cl((s.rel[id] || 0) + d, 0, 100); }
const fill = t => { const x = String(t || ''); return safe(() => G.chapters.fill(x), null) || x.replace(/\{name\}|\{title\}/g, (G.state.player && G.state.player.name) || 'you'); };

/* ---------- conditions + triggers ---------- */
function test(c, jobId) {
  if (!c) return true; const i = c.indexOf(':'), k = c.slice(0, i), v = c.slice(i + 1), n = G.now();
  switch (k) {
    case 'pick': { const [a, b] = v.split('='); return st().picks[a] === b; }
    case 'flag': return flag(v);
    case 'weather': return wx() === v;
    case 'season': return SEASONS[n.season] === v;
    case 'done': return !!safe(() => G.chapters.done(v), false);
    case 'festival': return eventOn(v);
    case 'level': return levelOf(jobId || (curJob() || {}).id) >= +String(v).replace(/[^\d]/g, '');
    case 'rel': { const m = /^(\w+)\s*>=\s*(\d+)$/.exec(v); return m ? relOf(m[1]) >= +m[2] : false; }
    case 'day': return v === 'weekend' ? n.weekday >= 5 : n.weekday < 5;
    default: return !!safe(() => G.chapters.test(c), false);
  }
}
function softOk(w, jobId) {
  const n = G.now(), lvl = levelOf(jobId);
  if (w.weekday && !w.weekday.includes(n.weekday)) return false;
  if (w.weather && !w.weather.includes(wx())) return false;
  if (w.season && !w.season.includes(SEASONS[n.season])) return false;
  if (w.event && !eventOn(w.event)) return false;
  if (w.dom && !(n.dayOfMonth >= w.dom[0] && n.dayOfMonth <= w.dom[1])) return false;
  if (w.level && lvl < w.level) return false;
  if (w.promoted && lvl < w.promoted) return false;
  if (w.chapter && !safe(() => G.chapters.done(w.chapter), false)) return false;
  for (const id in w.rel || {}) if (relOf(id) < w.rel[id]) return false;
  for (const k in w.skill || {}) if (safe(() => G.skills.level(k), 1) < w.skill[k]) return false;
  return true;
}
const isDone = b => jr(b.job).done[b.id] !== undefined;
/** all of a beat's own conditions, for shift number n of its job (the "beat before it" rule is in nextBeat) */
function due(b, n) {
  const w = b.when || {}; if ((w.shifts || 1) > n) return false;
  if (w.pick) { const [a, v] = w.pick.split('='); if (st().picks[a] !== v) return false; }
  if (w.flag && !flag(w.flag)) return false; if (w.notFlag && flag(w.notFlag)) return false;
  if (w.after && BEATS_BY_ID[w.after] && !isDone(BEATS_BY_ID[w.after])) return false;
  if (w.orShifts && n >= w.orShifts) return true;
  return softOk(w, b.job);
}
/** the beat that plays on shift n of this job, or null. Off-shift beats are invitations: they hold the arc up only for a while. */
function nextBeat(jobId, n) {
  const arc = ARCS[jobId]; if (!arc) return null; const R = jr(jobId), s = st();
  for (let i = 0; i < arc.beats.length; i++) {
    const b = arc.beats[i]; if (isDone(b)) continue;
    if (b.at === 'off') {
      const o = s.off[b.id], nx = arc.beats.slice(i + 1).find(x => x.at !== 'off'); if (!o) return null;
      if (n >= Math.min((nx && nx.when && nx.when.orShifts) || 1e9, o.n + TUNE.offWait)) continue;      /* waited long enough: the arc goes on, the invitation stays open */
      return null;
    }
    if (!due(b, n)) return null;
    if (b.n > 2 && n - R.last < 2) return null;                                                          /* not on two shifts running */
    return b;
  }
  return null;
}

/* ---------- effects ---------- */
function regMood(id) { const m = MOODLETS_NEW[id]; if (m && !MOODLETS[id]) MOODLETS[id] = Object.assign({ walkSpeed: 1, workPerf: 0, source: 'work' }, m); }
function give(id) {
  const s = st(), it = ITEMS_NEW[id]; if (!it || s.keeps.includes(id)) return; s.keeps.push(id); s.given[id] = 1;
  const g = grant(id);      /* the thing itself: into the home's storage (hang it through Furnish); a recipe card also teaches its recipe */
  UI.toastGold(`${it.kind === 'recipe' ? 'A recipe card' : 'A keepsake'}: ${it.name}. ${it.desc}${g.recipe ? ' You can cook ' + g.recipe + ' now.' : ''}${g.item ? ' It is with your things at home: hang it where you like.' : ''}`, 8000); G.emit('jobstory:keepsake', id);
}
function offerOpp(id) { const row = OPPS[id]; if (!row) return; safe(() => G.opps.offer(POOL_BY_ID[id] ? id : row, { force: true })); }
function apply(e, src) {
  if (!e) return;
  for (const id in e.rel || {}) addRel(id, e.rel[id]);
  for (const f of [].concat(e.flag || [])) setFlag(f);
  for (const k in e.xp || {}) safe(() => G.skills.addXp(k, e.xp[k]));
  if (e.money) { safe(() => G.money.add(e.money, 'Work: ' + (src || 'a little extra'))); toast('+' + fmt(e.money), 'money'); }
  if (e.mood) { regMood(e.mood); safe(() => G.needs.addMoodlet(e.mood)); }
  if (e.perf) { const sh = safe(() => G.jobs.shift(), null); if (sh) sh.perf = cl((sh.perf || 0) + e.perf, -5, 10); }
  for (const t of [].concat(e.text || [])) queueText(t);
  if (e.opp) offerOpp(e.opp);
  if (e.item) give(e.item);
  for (const k in e.need || {}) safe(() => G.needs.add(k, e.need[k]));
}

/* ---------- texts: at most one a day from work, never at night; each row carries its own delay ---------- */
function queueText(id) { const s = st(), tx = TEXTS[id]; if (!tx || s.sent[id] !== undefined || s.q.some(q => q.id === id)) return; s.q.push({ id, at: G.state.t + (tx.after || 0) * 60 }); }
function pumpTexts() {
  const s = st(); if (!s.q.length || !G.messages) return; const n = G.now(), d = today();
  if (s.textDay === d || n.hf >= TUNE.textQuiet[0] || n.hf < TUNE.textQuiet[1]) return;
  const i = s.q.findIndex(q => q.at <= G.state.t); if (i < 0) return; const q = s.q.splice(i, 1)[0], tx = TEXTS[q.id]; if (!tx) return;
  const w = who(tx.from); s.sent[q.id] = d; s.textDay = d;
  safe(() => G.messages.send({ from: tx.from, name: isCast(tx.from) ? undefined : w.short || w.name, text: fill(tx.text) }));
}
const textsOn = key => Object.keys(TEXTS).filter(id => TEXTS[id].on === key);

/* ---------- the beat player: a beat's steps compiled to a flat list with a saved program counter ---------- */
const PROG = {};
function compile(b) {
  if (PROG[b.id]) return PROG[b.id]; const ops = [];
  const walk = steps => { for (const s of steps || []) {
    if (s.do === 'say') ops.push({ op: 'say', who: s.who, text: s.text });
    else if (s.do === 'beat') ops.push({ op: 'beat', ms: s.ms });
    else if (s.do === 'fx') ops.push({ op: 'fx', e: s });
    else if (s.do === 'if') { const o = { op: 'if', cond: s.cond, to: 0 }; ops.push(o); walk(s.then); if (s.else && s.else.length) { const j = { op: 'jmp', to: 0 }; ops.push(j); o.to = ops.length; walk(s.else); j.to = ops.length; } else o.to = ops.length; }
    else if (s.do === 'choice') { const o = { op: 'choice', id: s.id, options: s.options.map(x => ({ id: x.id, text: x.text, fx: x.fx || null, to: 0 })) }; ops.push(o); const js = [];
      s.options.forEach((x, i) => { o.options[i].to = ops.length; walk(x.reply); const j = { op: 'jmp', to: 0 }; ops.push(j); js.push(j); }); js.forEach(j => { j.to = ops.length; }); }
  } };
  walk(b.steps); return PROG[b.id] = ops;
}
let running = false, tok = 0, met = {};
const lineOf = (o, jobId) => { const w = who(o.who), first = o.who !== 'narrator' && o.who !== 'player' && !met[o.who]; met[o.who] = 1; return { name: w.short || w.name, spec: w.spec, text: fill(o.text), style: o.who === 'narrator' ? 'narrator' : '', sub: first && w.role ? w.role : '' }; };
/** plays (or resumes) a beat. -> 'done' | 'out' (the player put it down: it keeps its place) | 'busy' | 'gone' (a load happened) */
async function runBeat(b) {
  if (running || !b) return 'busy'; const s = st(), ops = compile(b), my = ++tok; running = true; met = {};
  if (!s.cur || s.cur.id !== b.id) { if (s.cur && s.cur.pc > 0 && BEATS_BY_ID[s.cur.id]) s.held[s.cur.id] = s.cur.pc;      /* another beat was put down half-way (another job, an invitation): its place is kept */
    s.cur = { id: b.id, job: b.job, pc: s.held[b.id] || 0 }; delete s.held[b.id]; }
  safe(() => { G.player.stop(); }); G.emit('jobstory:beat:start', b.id);
  try {
    while (s.cur && s.cur.id === b.id && s.cur.pc < ops.length) {
      const o = ops[s.cur.pc];
      if (o.op === 'say') { const r = await UI.say(lineOf(o, b.job)); if (my !== tok) return 'gone'; if (r !== 'next') { UI.close(); return 'out'; } s.cur.pc++; }
      else if (o.op === 'choice') {
        if (!UI.isOpen()) { for (let k = s.cur.pc - 1; k >= 0; k--) if (ops[k].op === 'say') { UI.context(lineOf(ops[k], b.job)); break; } }
        const v = await UI.choice(o.options.map(x => ({ id: x.id, text: fill(x.text) }))); if (my !== tok) return 'gone'; const opt = o.options.find(x => x.id === v); if (!opt) { UI.close(); return 'out'; }
        s.picks[o.id] = v; apply(opt.fx, b.title); s.cur.pc = opt.to; G.emit('jobstory:choice', o.id, v);
      }
      else if (o.op === 'if') s.cur.pc = test(o.cond, b.job) ? s.cur.pc + 1 : o.to;
      else if (o.op === 'jmp') s.cur.pc = o.to;
      else if (o.op === 'beat') { if (UI.isOpen()) await UI.beat(o.ms || 900); else await sleep(300); if (my !== tok) return 'gone'; s.cur.pc++; }
      else { apply(o.e, b.title); s.cur.pc++; }
    }
    UI.close(); finishBeat(b); return 'done';
  } catch (e) { console.error('job beat', b.id, e); UI.close(); return 'out'; }
  finally { if (my === tok) running = false; }
}
function finishBeat(b) {
  const s = st(), R = jr(b.job); R.done[b.id] = R.shifts; if (b.at !== 'off') R.last = R.shifts; R.wait = 0; s.cur = null;
  setFlag('beat:' + b.id); apply(b.fx, b.title);
  for (const id of textsOn('beat:' + b.id)) queueText(id);
  if (b.at === 'off') offDone(b);
  offCheck(); G.emit('jobstory:beat', b.id);
}
const putDown = () => toast('It will keep. They will pick it up when you are back at work.', 'info', 3600);

/* ---------- the clock-in card ---------- */
function card(job, o) {
  injectCss();
  return new Promise(res => {
    G.modal++; let open = true; const done = v => { if (!open) return; open = false; clearInterval(iv); wrap.remove(); G.modal--; res(v); };
    const iv = setInterval(() => { if (o.live && !o.live()) done(null); }, 400);      /* the shift ended underneath the card (a scripted time jump, a load): the card goes too */
    const L = job.levels[(o.level || 1) - 1], hrs = job.shifts.end - job.shifts.start;
    const btn = (id, title, sub, cls) => el('button.jsc-b' + (cls ? '.' + cls : ''), { 'data-js': id, onclick: () => done(id) }, el('b', { text: title }), el('small', { text: sub }));
    const wrap = el('div.jsc-wrap', null, el('i.jm-res.js-calm', { hidden: true, style: { display: 'none' } }), el('div.jsc', { role: 'dialog', 'aria-label': 'Clocked in' },
      el('div.jsc-kick', { text: 'Clocked in · shift ' + o.n }), el('h2', { text: L.title }), el('p.jsc-where', { text: `${o.venueName} · ${hrs} hours · ${fmt(L.hourly)} an hour` }),
      o.feel ? el('p.jsc-feel', { text: o.feel }) : null,
      btn('work', 'Work the shift', PLAY[job.id] && !o.mid ? `Do the job yourself: tickets, tips, and ${PLAYS[job.id] ? '"' + PLAYS[job.id].name + '"' : 'the day'}.` : 'Do the job yourself: tickets, tips, and whatever today brings.', 'pri'),
      o.moment ? btn('moment', 'Just the moment, then skip', 'Something has been waiting for you here. Hear it, then skip the rest.') : null,
      btn('skip', 'Skip to the end', 'You showed up: that counts. Full hours paid, the shift goes by in a few seconds.'),
      el('small.jsc-foot', { text: 'Either way the shift counts and you are paid.' })));
    root().append(wrap);
  });
}

/* ---------- a shift ---------- */
let T = null;   /* today's shift: { job, n, sh, beat (mid / clockout beat due today), mode: 'work' | 'skip', midTried, play: 0 none | 1 ticket out | 2 done, lineT, t0 } */
const alive = t => T === t && safe(() => G.jobs.shift(), null) === t.sh;
async function clockIn(job, sh, cb) {
  const s = st(), R = jr(job.id); if (R.day !== sh.day) { R.day = sh.day; R.shifts++; }
  const t = T = { job: job.id, n: R.shifts, sh, room: G.scene, beat: null, mode: null, cb, midTried: false, play: 0, lineAt: performance.now() + TUNE.lineFirst * 1000, playAt: 0, midPlayed: false };
  keepIn(true); staffPass(job); await sleep(700); if (!alive(t)) return;
  for (let k = 0; k < 40 && (G.modal > 0 || running); k++) { await sleep(250); if (!alive(t)) return; }        /* a first-time window, a toast card: wait for it */
  let b = null, resume = false;
  if (!chapterBusy()) {
    const mine = id => !!BEATS_BY_ID[id] && BEATS_BY_ID[id].job === job.id && BEATS_BY_ID[id].at !== 'off', hid = Object.keys(s.held).find(mine);
    if (s.cur && mine(s.cur.id)) b = BEATS_BY_ID[s.cur.id];                                   /* put down earlier: pick it up */
    else if (hid) { b = BEATS_BY_ID[hid]; resume = true; }
    else b = nextBeat(job.id, t.n);
  }
  if (b && (b.at === 'clockin' || resume || (s.cur && s.cur.id === b.id))) { const r = await runBeat(b); if (!alive(t)) return; if (r === 'out') putDown(); b = null; await sleep(350); }
  t.beat = b;
  const cj = curJob() || {}, v = await card(job, { n: t.n, level: cj.level || 1, venueName: cj.venueName || job.name, mid: !!(b && b.at === 'mid'), moment: !!b && R.wait >= TUNE.waitButton, feel: b ? 'There is something in the air today.' : '', live: () => alive(t) });
  if (!alive(t)) return;
  if (v === 'moment' && b) { const r = await runBeat(b); if (!alive(t)) return; if (r === 'out') putDown(); t.beat = null; }
  if (v === 'work') { t.mode = 'work'; t.lineAt = performance.now() + TUNE.lineFirst * 1000; cb.work(); setFigures(job); }
  else { t.mode = 'skip'; cb.skip(); }
}
function setFigures(job, max, off) {
  const sc = G.scene; if (!sc || !sc.fixtures || job.id === 'courier') return;
  if (job.isNew && sc._jobSt !== job.id) { sc._jobSt = job.id; safe(() => stationsFor(job, sc)); }
  const tags = job.isNew ? job.workLoop.stations.map(x => 'js:' + job.id + ':' + x) : job.workLoop.stations, per = tags.map(tag => { const a = []; for (const fx of sc.byTag(tag).slice(0, 2)) { const p = fx.staff || fx.use || fx; a.push({ x: p.x + 1.2, y: p.y + .3 }, { x: p.x - 1.2, y: p.y + .6 }, { x: p.x + .4, y: p.y + 1.3 }); } return a; }).filter(a => a.length);
  const door = sc.spawn ? [{ x: sc.spawn.x + 1.5, y: sc.spawn.y - 2 }, { x: sc.spawn.x - 1.5, y: sc.spawn.y - 2.5 }] : [];
  /* the cast lists coworkers before regulars: the first stands by the second station (the working end of the room), the others by the last stations (the public end: tables, the door) */
  const spotsFor = k => { const n = per.length, first = n ? (k === 0 ? 1 % n : (n - k + n) % n) : 0, out = []; for (let i = 0; i < n; i++) out.push(...per[(first + i) % n]); return out.concat(door); };
  const lines = SHIFT_LINES[job.id] || [], talkers = [...new Set(lines.map(l => l.who))], cast = (CASTS[job.id] || { people: [] }).people.map(p => p.id).filter(id => talkers.includes(id));
  figures.set(sc, max ? cast.slice(0, max) : cast, spotsFor, (id, c) => { if (off) return greet(id, c, job.id); const l = nextLine(job.id, id, true); if (l) lastBubble = bubble(c, fill(l.text), 2600 + l.text.length * 45); });
}
/* ---------- off shift: the people of a workplace can be greeted ---------- */
/* A first tap gives a line that reflects how far the story has gone; the next taps give one of their own lines. In the four job rooms the people are the
   room's own figures; in the other workplaces up to two of the job's people who are not cast.js characters stand about when the player has worked there. */
const VISIT = {
  jo: ['Visitors are welcome. Mind the yellow line, and do not touch the bell.', 'Nine calls in ten are toast. We practice for the tenth.'], dutch: ['It is not ready. It is never ready before nine. Sit down anyway.', 'She pulls to the right. Do not tell her I said so.'], tully: ['Fifty-one seconds. Ask me again next week.', 'You can try the pole. Everybody wants to try the pole.'],
  calloway: ['Room 4. We are doing sevens. Come in quietly: quiet is catching.', 'Twenty-two of them and one of me. The arithmetic is not in my favor.'], whitlow: ['Good morning. It is a new day and nobody has done anything wrong in it yet.', 'Visitors sign in with their eyes. Thank you.'], nguyen: ['Three mittens this week. No two the same.', 'Mind the floor by the fountain. It is always wet. Nobody knows why.'],
  cosmo: ['(Cosmo looks at you for a while. Then he draws something small on his clipboard, and turns it so that you can see.)', '(A map of where you are standing. It is accurate.)'], juniper: ['It is seven. Whatever it is, it is seven. Is it seven?', 'I know all the months. Do you want all the months?'], ayo: ['Why are you here? Why is it Tuesday? Why is a stick an insect?', 'My brother is in the other class. He is exactly the same as me, but worse.'],
  max: ['If you have a story, the counter is there. If you have a complaint, also the counter.', 'Who cares? That is not rude. That is the question.'], lev: ['Light is good today. Low and from the side.', 'Stand still. No. That was it. It is gone.'], edwina: ['Arriving or departing, dear? I keep a note of both.', 'Fifty years of Comings and Goings. The trick is to spell every name right.'],
  sunny: ['Oh. Hello. We are, um. I am better with the microphone between us.', 'Sit in, if you like. The red sofa. It does not creak on air.'], hattie: ['Do not touch the fader on four. It sticks. I know that it sticks.', 'Forty-one listeners. That we know of.'],
};
const STAGE = [
  ['First week. You are still looking at your feet when you walk in. That will pass.', 'Off the clock, and here anyway. I will take that as a good sign.'],
  ['You know where things are now. That is most of the job, the first month.', 'Not working today? Then sit down like a person, not like staff.'],
  ['You have been here long enough to have opinions. Keep the good ones.', 'Day off, and you came by. So did I, for years.'],
  ['I still think about that shift. You did what you thought was right. So we did.', 'Since that day I do not check your work. Mostly.'],
  ['It is your place too, now. You know that.', 'Still here. So are we. Go on, you have the day.'],
];
const GONE = ['Your hook is still there. Nobody has been told to move it.', 'The door has not changed. Neither has the offer.'];
const greeted = {};
function greetLine(id, jobId) {
  const R = jr(jobId), n = greeted[id + ':' + G.scene.id] = (greeted[id + ':' + G.scene.id] || 0) + 1, c = curJob(), mine = !!c && c.id === jobId;
  if (mine && c.onShift) { const l = nextLine(jobId, id, true); return l ? l.text : 'Busy night. Back to it.'; }
  if (n % 2 === 0 || /^(cosmo)$/.test(id) && R.shifts > 0) { const l = nextLine(jobId, id, true); if (l) return l.text; }
  if (!R.shifts) return (VISIT[id] || ['Hello.'])[(n >> 1) % (VISIT[id] || [0]).length] || 'Hello.';
  if (!mine) return GONE[(n >> 1) % GONE.length];
  const done = (ARCS[jobId] ? ARCS[jobId].beats : []).filter(b => isDone(b)), turn = done.some(b => b.n >= 6), all = flag(jobId + '_arc_done') || done.length >= 9, k = all ? 4 : turn ? 3 : done.length >= 4 ? 2 : done.length >= 2 ? 1 : 0;
  let t = STAGE[k][(n >> 1) % 2]; const ns = c.nextShift; if (k < 2 && ns !== null && ns !== undefined && (n >> 1) % 2 === 1) t = `Your next shift is ${WDL[Math.floor(ns / DAY) % 7]}. Until then you are a customer.`;
  return t;
}
/** tap on one of a job's people (the job rooms' own figures and the off-shift stand-ins come here) */
function greet(id, ch, jobId) {
  jobId = jobId || Object.keys(CASTS).find(j => CASTS[j].people.some(p => p.id === id)); if (!jobId || !ch) return null;
  const text = fill(greetLine(id, jobId)); lastBubble = bubble(ch, text, 2600 + text.length * 45); safe(() => G.needs.add('social', 1)); G.emit('jobstory:greet', id, jobId); return text;
}
/** off shift, in a workplace where the player has worked: up to two of its people who are not cast.js characters are about */
function greeters() {
  const sc = G.scene; if (!sc || !sc.indoor || !sc.fixtures || safe(() => G.jobs.onShift(), false)) return;
  for (const id of JOB_IDS) { const job = JOB_BY_ID[id]; if (!job || id === 'courier' || sc.id !== 'int:' + (job.room || job.venue) || !st().jobs[id] || !st().jobs[id].shifts) continue; setFigures(job, 2, true); return; }
}

function shiftEnd(sum, show, quiet) {
  const t = T; figures.clear(); if (t && t.room && JOB_BY_ID[t.job] && JOB_BY_ID[t.job].isNew) t.room._closing = false;
  const after = () => { show(); offCheck(); if (sum.promoted) for (const id of textsOn('promoted:' + sum.promoted.level)) if (TEXTS[id].job === sum.jobId) queueText(id); };
  if (!t || t.job !== sum.jobId) return after();
  T = null; const b = t.beat, plays = b && b.at === 'clockout' && t.mode === 'work' && sum.reason === 'done' && !quiet && !chapterBusy();
  if (b && !plays) jr(t.job).wait++;                 /* a beat was due and did not get its moment (skipped, auto-worked, left early): it waits, and that is counted */
  if (plays) { sleep(400).then(() => runBeat(b)).then(r => { if (r === 'out') putDown(); after(); }).catch(() => after()); return; }
  after();
}
const lull = () => { const W = WK.cur(); return !!W && !W.paused && !W.lock && !W.active && !G.busy && !G.modal && !running && !safe(() => G.minigame.isOpen(), false); };
function update() {
  const t = T; if (!t || t.mode !== 'work' || G.modal > 0) return; const sh = t.sh; if (safe(() => G.jobs.shift(), null) !== sh) return;
  const frac = (G.state.t - sh.in) / Math.max(1, sh.end - sh.in);
  if (t.beat && t.beat.at === 'mid' && !t.midTried && frac >= TUNE.midAt && lull()) {
    t.midTried = true; const b = t.beat; t.midPlayed = true; runBeat(b).then(r => { if (r === 'out') putDown(); if (T === t) t.beat = null; });
  }
  if (!t.play && PLAY[t.job] && !(t.beat && t.beat.at === 'mid') && !t.midPlayed && frac >= (t.job === 'courier' ? .01 : TUNE.playAt) && frac < TUNE.playUntil && !running) { if (performance.now() >= t.playAt) { t.playAt = performance.now() + 2000; offerPlay(t); } }
  if (performance.now() >= t.lineAt) { t.lineAt = performance.now() + (TUNE.lineEvery[0] + Math.random() * (TUNE.lineEvery[1] - TUNE.lineEvery[0])) * 1000; if (!running && !safe(() => G.minigame.isOpen(), false)) ambient(t.job); }
}

/* ---------- the play ---------- */
function playInfo(jobId) { const P = Object.assign({}, PLAYS[jobId], WORDS[jobId]), job = JOB_BY_ID[jobId]; return { job: jobId, title: P.name || 'The job', sub: job ? job.name : '', good: P.good || 'Well done.', bad: P.bad || 'Tomorrow will go better.', reward: sc => `Counts toward today's shift. Bonus ${fmt(Math.round(TUNE.playBonus * (.5 + sc) * 4) / 4)}.` }; }
async function play(jobId) {
  jobId = jobId || (curJob() || {}).id; const fn = PLAY[jobId]; if (!fn) return null;
  const env = { level: levelOf(jobId), weather: wx(), mem: jr(jobId).mem || (jr(jobId).mem = {}) };
  const sc = await runPlay(playInfo(jobId), ctx => fn(ctx, env));
  if (sc !== null) { const R = jr(jobId); R.plays++; R.best = Math.max(R.best || 0, sc); G.emit('jobstory:play', jobId, sc); }
  return sc;
}
function offerPlay(t) {
  const job = JOB_BY_ID[t.job], P = PLAYS[t.job] || {}, station = STATION[t.job]; if (!job || !station) { t.play = 2; return; }
  const task = { id: 'the_play', name: P.name || 'The job', station, minutes: 8, anim: 'work', bonus: TUNE.playBonus, countsAs: 3 };
  const o = WK.inject({ title: '★ ' + (P.name || 'Your part of the job'), task, run: () => play(t.job), onDone: q => { t.play = 2; const sh = t.sh; if (sh && q !== undefined) { sh.tipSum += q; sh.tipN++; } safe(() => G.skills.addXp(job.trains.primary, Math.round(TUNE.playXp * (q || 0)))); } });
  if (o) { t.play = 1; toast(`${P.name || 'Something of your own'}: the pink marker, when you have a moment.`, 'info', 4200); }
}

/* ---------- ambient shift lines: a no-repeat bag per job; conditional lines are only drawn while their condition holds ---------- */
function nextLine(jobId, only, asked) {      /* only = a speaker id (somebody standing in the room); asked = the player tapped them: they may repeat themselves */
  const L = SHIFT_LINES[jobId]; if (!L || !L.length) return null; const s = st(); let bag = s.bags[jobId];
  const refill = () => { bag = s.bags[jobId] = L.map((_, i) => i); for (let i = bag.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [bag[i], bag[j]] = [bag[j], bag[i]]; } };
  if (!Array.isArray(bag) || !bag.length) refill();
  for (let pass = 0; pass < 2; pass++) {
    const k = bag.findIndex(i => L[i] && (!only || L[i].who === only) && (!L[i].cond || test(L[i].cond, jobId)));
    if (k >= 0) return L[bag.splice(k, 1)[0]];
    if (only) { if (!asked) return null; const any = L.filter(l => l.who === only && (!l.cond || test(l.cond, jobId))); return any.length ? any[Math.floor(Math.random() * any.length)] : null; }
    refill();
  }
  return null;
}
let lastBubble = null;
/* a line from somebody who is not standing in view: a small card just above the shift panel, with their name */
function caption(name, text, ms) { injectCss(); const c = el('div.js-cap', null, name ? el('b', { text: name }) : null, el('span', { text })); root().append(c); lastBubble = c; setTimeout(() => c.classList.add('out'), ms); setTimeout(() => c.remove(), ms + 300); return c; }
const onScreen = c => { const p = c && !c.hidden ? safe(() => G.toScreen(c.x, c.y, (c.z || 0) + 1.9), null) : null; return !!p && p.x > 40 && p.x < innerWidth - 40 && p.y > 170 && p.y < innerHeight - 250; };
function ambient(jobId) {
  if (lastBubble && lastBubble.isConnected) return null;                 /* never two of ours at once */
  const here = figures.ids().concat((CASTS[jobId] || { people: [] }).people.map(p => p.id).filter(id => isCast(id) && figures.char(id))), near = here.filter(id => onScreen(figures.char(id)));
  /* SEEN FIRST: somebody who is standing in view speaks in a bubble over their head; every fourth line (or when nobody is in view) comes from somebody
     else in the room or out of it, as a caption with their name above the shift panel */
  let l = null; if (near.length && Math.random() < .78) l = nextLine(jobId, near[Math.floor(Math.random() * near.length)]);
  if (!l && here.length && Math.random() < .5) l = nextLine(jobId, here[Math.floor(Math.random() * here.length)]); if (!l) l = nextLine(jobId);
  if (!l) return null; const c = figures.char(l.who), text = fill(l.text), ms = 2800 + text.length * 50, seen = onScreen(c);
  if (seen) { lastBubble = bubble(c, text, ms); safe(() => { if (!c.poseOpts) c.faceTo(G.player.x, G.player.y); c._hold = Math.max(c._hold || 0, 2); }); }
  else caption(who(l.who).short || '', text, ms);
  G.emit('jobstory:line', l.who, seen ? 'bubble' : 'caption', text);
  return { who: l.who, how: seen ? 'bubble' : 'caption', text };
}

/* ---------- off-shift beats: invitations ---------- */
const offBeats = jobId => (ARCS[jobId] ? ARCS[jobId].beats.filter(b => b.at === 'off') : []);
const prevDone = b => { const arc = ARCS[b.job], i = arc.beats.indexOf(b); return arc.beats.slice(0, i).every(x => isDone(x) || (x.at === 'off' && st().off[x.id])); };
function placeOf(id) {
  if (ROOMS.has(id)) { const root2 = safe(() => G.navGoals.rootOf(id), id), p = safe(() => G.places.get(root2), null) || safe(() => G.places.get(id), null); return { room: id, placeId: p ? p.id : null, name: (ROOMS.get(id) || {}).name || (p && p.name) || id, x: p && p.x, y: p && p.y }; }
  const p = safe(() => G.places.get(id), null); if (p) return { room: null, placeId: p.id, name: p.name, x: p.x, y: p.y };
  const o = OUTDOOR[id]; if (o) return { room: null, placeId: null, name: o.name, x: o.x, y: o.y, pos: { x: o.x, y: o.y, name: o.name } };
  return null;
}
function nextWindow(b, from = G.state.t) { const w = b.window || { days: [0, 1, 2, 3, 4, 5, 6], from: 9, to: 20 }; for (let d = Math.floor(from / DAY); d < Math.floor(from / DAY) + 9; d++) { if (!w.days.includes(d % 7)) continue; const a = d * DAY + w.from * 60, z = d * DAY + w.to * 60; if (z - 20 > from) return { from: a, to: z }; } return null; }
const inWindow = b => { const w = nextWindow(b); return !!w && G.state.t >= w.from && G.state.t < w.to; };
function offTitle(b, win) {     /* "Mr. Lindgren and Marlow, Saturday afternoon": who is there and the day of the window it is pinned for */
  const ids = [], scan = steps => { for (const s of steps || []) { if (s.do === 'say' && s.who !== 'narrator' && s.who !== 'player' && !ids.includes(s.who)) ids.push(s.who); if (s.options) for (const o of s.options) scan(o.reply); scan(s.then); scan(s.else); } }; scan(b.steps);
  const w = b.window, part = !w ? '' : w.from < 11 ? 'morning' : w.from < 17 ? 'afternoon' : 'evening', day = win ? WDL[Math.floor(win.from / DAY) % 7] : '';
  return ids.slice(0, 2).map(id => who(id).short).join(' and ') + (day ? ', ' + day + ' ' + part : part ? ', one ' + part : '');
}
function pinOf(o) { return o && o.pin ? safe(() => G.planner.pins().find(p => p.id === o.pin), null) : null; }
const apptOf = o => (o && o.pin ? safe(() => G.planner.list(G.state.t - DAY, G.state.t + 12 * DAY).find(a => a.data && a.data.idea === 'pin:' + o.pin), null) : null);
/** which invitations are open now (for the job the player holds); texts, pins */
function offCheck() {
  const c = curJob(); if (!c) return; const s = st(), R = jr(c.id);
  for (const b of offBeats(c.id)) {
    if (isDone(b) || !prevDone(b)) continue; let o = s.off[b.id];
    if (!o) { if (!(due(b, R.shifts) || (b.invite && s.sent[b.invite] !== undefined))) continue; o = s.off[b.id] = { n: R.shifts, t: G.state.t, pin: null }; if (b.invite) queueText(b.invite); G.emit('jobstory:invite', b.id); }
    if (b.invite && s.sent[b.invite] === undefined) continue;        /* the invitation has not arrived yet: no idea before the text */
    if (!pinOf(o) && !apptOf(o)) { const w = nextWindow(b), pl = placeOf(b.place); if (w && pl) o.pin = safe(() => G.planner.suggest({ title: offTitle(b, w), placeId: pl.placeId, t: Math.max(w.from, Math.ceil(G.state.t / 30) * 30), dur: 60, kind: 'friend', data: Object.assign({ jobBeat: b.id, blurb: b.title }, pl.pos ? { pos: pl.pos } : null) }), null); }
  }
}
function offDone(b) { const o = st().off[b.id] || (st().off[b.id] = { n: jr(b.job).shifts, t: G.state.t, pin: null }); const a = apptOf(o); if (a) safe(() => G.planner.done(a.id)); if (pinOf(o)) safe(() => G.planner.remove(o.pin)); o.pin = null; o.done = 1; }
function atPlace(b) {
  const pl = placeOf(b.place); if (!pl || !G.scene) return false;
  if (pl.room) return G.scene.id === 'int:' + pl.room;
  if (pl.placeId && ROOMS.has(pl.placeId)) return G.scene.id === 'int:' + pl.placeId;
  return G.scene.id === 'city' && isFinite(pl.x) && Math.hypot(G.player.x - pl.x, G.player.y - pl.y) < 7;
}
let offBusy = false;
function offTry() {
  const c = curJob(); if (!c || offBusy || running || G.modal > 0 || chapterBusy() || safe(() => G.jobs.onShift(), false) || G.busy) return; const s = st();
  for (const b of offBeats(c.id)) {
    const o = s.off[b.id]; if (!o || isDone(b) || !inWindow(b) || !atPlace(b)) continue; if (b.invite && s.sent[b.invite] === undefined) continue;
    offBusy = true; sleep(900).then(() => (running || G.modal > 0 || !atPlace(b) ? 'busy' : runBeat(b))).then(r => { offBusy = false; if (r === 'out') toast('It will keep. Come back inside the same hours.', 'info', 3600); }).catch(() => { offBusy = false; }); return;
  }
}
/* My Day source (add-only hook): an open invitation that has no pinned Idea (the pin is the normal route, see offCheck) */
function ideaSource(c) {
  const j = curJob(); if (!j || !c || !c.push) return; const s = st();
  for (const b of offBeats(j.id)) { const o = s.off[b.id]; if (!o || isDone(b) || pinOf(o) || apptOf(o)) continue; if (b.invite && s.sent[b.invite] === undefined) continue; const w = nextWindow(b), pl = placeOf(b.place); if (!w || !pl || Math.floor(w.from / DAY) !== c.day) continue;
    c.push({ id: 'jobbeat:' + b.id, key: 'jobbeat:' + b.id, kind: 'friend', cat: 'friend', base: 78, title: offTitle(b, w), why0: 'They are expecting you', icon: 'ui.heart', placeId: pl.placeId, pos: pl.pos, t: Math.max(w.from, G.state.t), end: w.to, window: true, dur: 60, fixed: false }); }
}

/* ---------- public views ---------- */
function arc(jobId) {
  const a = ARCS[jobId]; if (!a) return null; const R = jr(jobId);
  return { job: jobId, title: a.title, premise: a.premise, shifts: R.shifts, plays: R.plays, best: R.best, beats: a.beats.map(b => ({ id: b.id, n: b.n, title: b.title, at: b.at, done: isDone(b), invited: !!st().off[b.id], due: !isDone(b) && due(b, R.shifts + 1) })) };
}
const keepsakes = () => st().keeps.map(id => Object.assign({ id }, ITEMS_NEW[id]));

/* ---------- debug ---------- */
const debug = {
  list: jobId => (jobId ? arc(jobId) : JOB_IDS.map(id => { const a = arc(id); return { job: id, title: a.title, shifts: a.shifts, done: a.beats.filter(b => b.done).length, live: !!JOB_BY_ID[id], play: PLAY[id] ? KIND[id] : 'fallback' }; })),
  /** play a beat here and now, whatever its conditions (returns the promise of the result) */
  fire(beatId) { const b = BEATS_BY_ID[beatId]; if (!b) return null; const R = jr(b.job); delete R.done[b.id]; st().cur = null; return runBeat(b); },
  setShifts(jobId, n) { const R = jr(jobId); R.shifts = Math.max(0, n | 0); R.last = -9; R.day = -1; return R.shifts; },
  reset(jobId) { const s = st(); if (jobId) { delete s.jobs[jobId]; delete s.bags[jobId]; for (const b of (ARCS[jobId] || { beats: [] }).beats) { delete flags()['beat:' + b.id]; delete s.off[b.id]; } } else G.state.jobs.story = fresh(); return true; },
  play: jobId => play(jobId),
  /** hire (if needed), go to the workplace and clock in the way the player does: beat, card, pay card */
  clockIn: (jobId, level) => G.jobs.debugStart(jobId, level, { story: true }),
  stations(jobId) { const job = JOB_BY_ID[jobId || (curJob() || {}).id]; return job && STATIONS[job.id] ? debugStations(job) : null; },
  line: jobId => ambient(jobId || (curJob() || {}).id),
  /** on a shift: one test ticket at a station of the job (to check that the player can walk to it and use it); returns the ticket id for G.jobs.goStep */
  tryStation(station, k) { const o = WK.inject({ title: 'Test: ' + station, task: { id: 'test_station', name: 'Test ' + station, station, minutes: 1, anim: 'work', bonus: 0 }, run: async () => 1 }); if (o && k) o.steps[0].fi = k; if (o) WK.sync(); return o ? o.id : null; },
  texts() { const s = st(); s.textDay = -1; for (const q of s.q) q.at = 0; pumpTexts(); return s.q.length; },
  today: () => (T ? { job: T.job, n: T.n, beat: T.beat && T.beat.id, mode: T.mode, play: T.play } : null), who: id => who(id), figs: () => figures.ids(), give: id => give(id), greet: (id, jobId) => { const c = figures.char(id); return c ? greet(id, c, jobId) : null; }, greeters: () => { greeters(); return figures.ids(); },
  state: () => st(), next: (jobId, n) => { const b = nextBeat(jobId, n === undefined ? jr(jobId).shifts + 1 : n); return b ? b.id : null; },
  async menu() {
    const cur = curJob(), jobId = await choose('Job stories', JOB_IDS.map(id => { const a = arc(id); return { label: (JOB_BY_ID[id] ? '' : '(no room yet) ') + id, sub: `${a.title} · shift ${a.shifts} · ${a.beats.filter(b => b.done).length}/9 beats${cur && cur.id === id ? ' · your job' : ''}`, value: id }; }));
    if (!jobId) return; const a = arc(jobId), live = !!JOB_BY_ID[jobId];
    const act = await choose(jobId + ': ' + a.title, [live ? { label: 'Go there and clock in (the real card)', value: 'in' } : null, PLAY[jobId] ? { label: 'Play "' + PLAYS[jobId].name + '" now', value: 'play' } : null, { label: 'Fire a beat...', value: 'beat' }, { label: 'Set shifts attended...', value: 'n' }, { label: 'Say an ambient line', value: 'line' }, { label: 'Deliver waiting texts now', value: 'tx' }, { label: 'Reset this arc', value: 'reset' }].filter(Boolean));
    if (act === 'in') return debug.clockIn(jobId); if (act === 'play') return debug.play(jobId); if (act === 'line') return debug.line(jobId); if (act === 'tx') return debug.texts(); if (act === 'reset') return debug.reset(jobId);
    if (act === 'beat') { const id = await choose('Fire a beat', a.beats.map(b => ({ label: `${b.n}. ${b.title}`, sub: `${b.at}${b.done ? ' · done' : ''}`, value: b.id }))); if (id) return debug.fire(id); }
    if (act === 'n') { const n = await choose('Shifts attended', [0, 1, 3, 8, 11, 14, 18, 22].map(x => ({ label: String(x), value: x }))); if (n !== null) return debug.setShifts(jobId, n); }
  },
};

export function init() {
  st(); for (const id in MOODLETS_NEW) regMood(id);
  for (const id in OPPS) { const row = OPPS[id]; if (row.when && row.when.flag && !POOL_BY_ID[id]) { POOL.push(row); POOL_BY_ID[id] = row; } }      /* flag-gated rows join the normal pool */
  G.jobStory = { clockIn, shiftEnd, addRel, arc, next: jobId => { const id = jobId || (curJob() || {}).id; return id ? nextBeat(id, jr(id).shifts + 1) : null; }, rel: relOf, pick: id => st().picks[id], flag, keepsakes,
    play, hasPlay: id => !!PLAY[id], playName: id => (PLAYS[id] ? PLAYS[id].name : ''), active: () => running, test, greet, TUNE, debug };
  G.addSystem({ name: 'jobstory', update });
  G.on('minutes', () => { pumpTexts(); offTry(); });
  G.on('scene', () => { figures.clear(); if (T && T.mode === 'work' && safe(() => G.jobs.shift(), null) === T.sh && G.scene && G.scene.id === WK.cur()?.roomId) setFigures(JOB_BY_ID[T.job]); else setTimeout(() => safe(greeters), 300); setTimeout(offTry, 600); setTimeout(staffDoors, 80); });
  G.on('day', () => offCheck());
  G.on('job:hired', () => offCheck());
  G.on('opp:done', (id, row) => { const r = row && row.reward && row.reward.rel; for (const k in r || {}) if (!isCast(k) && k !== 'boss') addRel(k, r[k]); });
  const wake = () => { st(); tok++; running = false; offBusy = false; T = null; figures.clear();
    const s = st(), b = s.cur && BEATS_BY_ID[s.cur.id]; if (!b) { s.cur = null; return; }
    /* a save made in the middle of a beat: carry on from the same line if the player is still standing there */
    setTimeout(() => { const job = JOB_BY_ID[b.job], here = b.at === 'off' ? atPlace(b) : job && G.scene && G.scene.id === 'int:' + (job.room || job.venue); if (here && !running && !chapterBusy()) runBeat(b).then(r => { if (r === 'out') putDown(); }); }, 1600); };
  const keeps = () => { const s = st(), got = syncKeeps(s.keeps, s.given); if (got.length) toast('Your keepsakes from work are with your things at home now: hang them where you like.', 'info', 5200); };
  G.on('load', () => { wake(); setTimeout(() => safe(keeps), 2500); }); G.on('ready', () => { wake(); offCheck(); setTimeout(() => safe(keeps), 2500); setTimeout(staffDoors, 80); safe(() => G.myDay.addSource(ideaSource)); safe(() => defineNav()); });
}
/* STAFF DOOR. Some workplaces shut their public door outside opening hours and walk visitors out (the Aquarium before 9, the Conservatory before 9: their
   own modules, not ours to edit), but the aquarist and the florist start at 7. For the half hour before a shift and during it, the door of the player's own
   workplace lets them in, and the room does not walk its own staff out. Done from here by wrapping the door's public hooks on the live city scene. */
const staffNow = job => { const c = curJob(); if (!c || c.id !== job.id) return false; if (c.onShift) return true; const t = c.nextShift; return t !== null && t !== undefined && G.state.t >= t - 35 && G.state.t < t + (job.shifts.end - job.shifts.start) * 60 - 20; };
function staffDoors() {
  const sc = G.scene; if (!sc || sc.id !== 'city' || !sc.world || !sc.world.pois) return;
  for (const id in STATIONS) {
    const job = JOB_BY_ID[id]; if (!job) continue; const room = job.room || job.venue, rootId = safe(() => G.navGoals.rootOf(room), room), door = sc.world.pois.find(p => p.id === 'door:' + rootId); if (!door) continue;
    const staff = () => Object.keys(STATIONS).some(k => { const j = JOB_BY_ID[k]; return j && safe(() => G.navGoals.rootOf(j.room || j.venue), j.venue) === rootId && staffNow(j); });
    if (typeof door.onUse === 'function' && !door.onUse._staff) { const orig = door.onUse, f = (...a) => (staff() ? false : orig(...a)); f._staff = 1; door.onUse = f; }
    for (const it of sc.interactables) if (it.poi === door && typeof it.use === 'function' && !it.use._staff) { const orig = it.use, f = (...a) => (staff() && ROOMS.has(rootId) ? enterRoom(rootId, door.id) : orig(...a)); f._staff = 1; it.use = f; }
  }
}
/* STAFF PASS. The Museum, Aquarium, Observatory and Conservatory turn visitors without a day ticket back from their wings; the job's stations are in the wings.
   Clocking in stamps today's ticket in that showpiece's own state (their hasTicket() reads `ticketDay`): staff walk in free on the days they work. */
function staffPass(job) { const S = G.state[job.venue]; if (job.isNew && S && typeof S === 'object' && 'ticketDay' in S && S.ticketDay !== today()) { S.ticketDay = today(); return true; } return false; }
const keepIn = on => { const sc = G.scene; if (sc && sc.indoor && T && JOB_BY_ID[T.job] && JOB_BY_ID[T.job].isNew) sc._closing = !!on; };

/* the guide arrow to a workplace that is a room inside a bigger place (the airport's concourse / baggage claim): sim/navgoals.js 'clockin' leads to `venue` */
function defineNav() {
  if (!G.navGoals || !G.navGoals.define) return;
  G.navGoals.define('jobroom', 'commit', 62, ctx => {
    const j = curJob(), job = j && JOB_BY_ID[j.id]; if (!job || !job.room || job.room === job.venue || !ctx.attached || j.onShift) return null;
    if (ctx.placeId !== job.venue && ctx.root !== job.venue && ctx.root !== safe(() => G.navGoals.rootOf(job.room), null)) return null;
    if (j.nextShift === null || j.nextShift === undefined || j.nextShift - G.state.t > 240) return null;
    return { room: job.room, find: null, label: 'Walk in to clock in: ' + ((ROOMS.get(job.room) || {}).name || job.name), short: 'clock in', done: false };
  });
}
