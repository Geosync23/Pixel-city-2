// rel.js — G.rel: RELATIONSHIPS & ROMANCE (BIBLE direction update 5; design docs/story/RELATIONSHIPS.md; data src/story/rel_*.js; report docs/reports/relationships.md).
// Two tracks: friendship is the social system's own meter (G.social) plus one story stage (Confidant); romance is a second meter, "warmth" (0-100), with the
// ten written people only (rel_people.js ROMANCEABLE; never family, never under 21, never anonymous citizens, no start with a current boss, one partner from
// "Together" on, no jealousy). This module makes the designer's data run, the way sim/jobstory.js runs the job arcs:
//
// SCENES (vignettes of the 12 arcs, the heart scenes and milestones of the 10 romances, the 10 first dates) play through the Chapters dialogue sheet
//   (ui/chapters_ui.js). A scene is compiled to a flat list with a saved program counter (G.state.rel.cur), so it keeps its place on any line and at a
//   choice across "pick this up later" and save / load. `play` steps start the real systems (sim/_rel_play.js). While a scene runs no need falls below 30.
// INVITATIONS: the governor OFFERS one deep scene every 2-4 days (PACING): the person's invite text arrives in Messages, then a pinned Idea with their
//   name appears in My Day ("They are expecting you"). Add makes it an appointment (tagged with them). During the scene's window the person stands at the
//   place; a rose marker (not the Chapters' gold one) shows the spot in the city and the guide arrow leads to them. Walking up (or tapping them) opens a small
//   card: Begin / Not now. Nothing expires: "Not now" keeps it; a pin that is dismissed comes back quietly after three days.
// PACING GOVERNOR: no deep scene is offered in the first five days, on a day a Chapter was begun, on a day an off-shift job beat was offered, while two
//   invitations wait, or on the day one was played; three friend / family arcs and two romances move at once; one person never invites twice in two days.
//   No scene starts during a Chapter, a shift, a shift beat, a class, a show or another window.
// HELPERS: _rel_base.js (state, tracks, conditions, effects, places, texts) · _rel_play.js (play adapters) · _rel_small.js (texts, waves, remembered
//   details) · _rel_verbs.js (the 25 context verbs + meters) · _rel_dates.js (dates) · _rel_life.js (endings, living together, the wedding, keepsakes).
//
// G.rel = { stage(id), stageLabel(id), warmth(id), addWarmth(id, n, src), friendStage(id), partner(), remember(id, key), remembers(id, key), pick(choiceId),
//   offer(sceneId) -> bool, start(sceneId) -> Promise<'done' | 'out' | 'busy' | 'gone'>, available() -> [scene ids that could be offered now], offers() -> open
//   invitations, arc(personId) -> { title, premise, scenes: [{ id, n, title, seen, offered }] }, scene(id), active() -> a scene is on screen,
//   verbs(id), date: { types(id), book(o), start(apptId), list() }, moveIn(id), moveOut(id), propose(id), wedding: { plan(o), state(), begin() }, endIt(id, how),
//   pages(id?), keepsakes(), openTo(list?), people() -> the ten with stage + warmth, PACING, debug }
// Events: 'rel:stage'(id, stage, old) 'rel:warmth'(id, pts, src) 'rel:scene:start'(sceneId) 'rel:scene'(sceneId) 'rel:choice'(choiceId, optionId) 'rel:offer'(sceneId)
//   'rel:mem'(id, key) 'rel:text'(from, id) 'rel:date'(id, type, outcome) 'rel:movein'(id) 'rel:moveout'(id) 'rel:engaged'(id) 'rel:married'(id) 'rel:ended'(id, how)
//   'rel:keepsake'(itemId) 'rel:page'(pageId) 'rel:small'(kind, id, text)
// State: G.state.rel (see _rel_base.js fresh()). Friendship points stay in G.state.social.
import { G } from '../core/game.js';
import { el, toast, choose } from '../ui/kit.js';
import { UI } from '../ui/chapters_ui.js';
import { WS } from '../engine/raster.js';
import { ARCS, ARC_SCENES, ARC_SPEAKERS } from '../story/rel_arcs.js';
import { HEARTS, SCENES_BY_ID as HEART_SCENES } from '../story/rel_romance.js';
import { FIRST_DATES } from '../story/rel_dates.js';
import { comp } from './_chapters_cast.js';
import * as B from './_rel_base.js';
import { st, safe, sleep, today, DAY, HOOK, who, fill, short, test, apply, dest, at, nextWindow, inWindow, windowWords, queueText, pumpTexts, stage, setStage, ror, fr, isRom, PACING, ROMANCEABLE, ROMANCE_STAGES } from './_rel_base.js';
import { run as runPlay } from './_rel_play.js';
import * as SMALLBITS from './_rel_small.js';
import * as VERBS from './_rel_verbs.js';
import * as DATES from './_rel_dates.js';
import * as LIFE from './_rel_life.js';

export const order = 146;   /* after chapters (140), jobstory (126), myday (132), navgoals (136) */
const NEED_FLOOR = 30;

/* ---------- the scenes ---------- */
export const SC = {};
for (const p in ARCS) for (const s of ARCS[p].scenes) SC[s.id] = Object.assign({}, s, { arc: 'a:' + p, track: 'friend', key: s.id.split('.')[1], speakers: ARC_SPEAKERS[p] || [p] });
for (const p in HEARTS) for (const s of HEARTS[p].scenes) SC[s.id] = Object.assign({}, s, { arc: 'h:' + p, track: 'romance', key: s.id.split('.')[1], speakers: [p] });
for (const p in FIRST_DATES) SC['fd.' + p] = Object.assign({}, FIRST_DATES[p], { id: 'fd.' + p, person: p, arc: 'h:' + p, track: 'romance', key: 'fd', speakers: [p], n: 0 });
const INVITED = ['h1', 'h2', 'h3', 'm1', 'm2'];           /* heart scenes that arrive as invitations; the rest are started by a verb, a date or a talk */
const arcOf = key => (key[0] === 'a' ? ARCS[key.slice(2)] : HEARTS[key.slice(2)]);
const lead = sc => sc.speakers[0];
const seen = id => st().seen[id] !== undefined;
const busy = () => running || G.modal > 0 || !!G.busy || !!G.cutscene || !!safe(() => G.chapters.active(), false) || !!safe(() => G.chapters.moments.playing(), false) || !!safe(() => G.jobs.onShift(), false) || !!safe(() => G.jobStory.active(), false)
  || !!safe(() => G.shows.state(), null) || !!safe(() => G.university.inClass(), false) || !!safe(() => G.furnish.active, false) || !!safe(() => G.transit.ride, null) || !!safe(() => G.intro.active, false);

/* ---------- compile ---------- */
const PROG = {};
function compile(sc) {
  if (PROG[sc.id]) return PROG[sc.id]; const ops = [];
  const walk = steps => { for (const s of steps || []) {
    if (s.do === 'say') ops.push({ op: 'say', who: s.who, text: s.text });
    else if (s.do === 'beat') ops.push({ op: 'beat', ms: s.ms });
    else if (s.do === 'fx') ops.push({ op: 'fx', e: s });
    else if (s.do === 'play') ops.push({ op: 'play', st: s });
    else if (s.do === 'if') { const o = { op: 'if', cond: s.cond, to: 0 }; ops.push(o); walk(s.then); if (s.else && s.else.length) { const j = { op: 'jmp', to: 0 }; ops.push(j); o.to = ops.length; walk(s.else); j.to = ops.length; } else o.to = ops.length; }
    else if (s.do === 'choice') { const o = { op: 'choice', id: s.id, options: s.options.map(x => ({ id: x.id, text: x.text, fx: x.fx || null, to: 0 })) }; ops.push(o); const js = [];
      s.options.forEach((x, i) => { o.options[i].to = ops.length; walk(x.reply); const j = { op: 'jmp', to: 0 }; ops.push(j); js.push(j); }); js.forEach(j => { j.to = ops.length; }); }
  } };
  walk(sc.steps); return PROG[sc.id] = ops;
}

/* ---------- the runner ---------- */
let running = false, tok = 0, met = {}, mine = false;      /* mine: the companions on screen are ours (not a Chapter's) */
const lookFor = (sc, o) => (o && o.look) || (sc.key === 'fd' ? 'date' : sc.place === 'home' && st().live ? 'home' : null);
function lineOf(o, x) {
  const w = who(o.who, x.look), first = o.who !== 'narrator' && o.who !== 'player' && !met[o.who]; met[o.who] = 1;
  const ch = o.who !== 'narrator' && o.who !== 'player' ? safe(() => comp.char(o.who) || G.social.char(o.who), null) : null; if (ch && !ch.pose && !ch.zoff) safe(() => { ch.stop && ch.stop(); ch.faceTo(G.player.x, G.player.y); });
  return { name: w.short || w.name, spec: w.spec, text: fill(o.text, x.tok), style: o.who === 'narrator' ? 'narrator' : x.phone ? 'phone' : '', sub: first && x.sub ? x.sub : '' };
}
function withUs(ids, look, force) {      /* the people of a scene who are not standing in it get a figure beside the player (the Chapters' companion code) */
  const need = ids.filter(id => B.castOf(id) && (force || !safe(() => G.social.char(id), null)) && !comp.has(id)); if (!need.length) { if (comp.ids().length) mine = true; return; }
  comp.set(comp.ids().concat(need)); mine = true; if (look) for (const id of need) { const c = comp.char(id), w = who(id, look); if (c && w.spec) c.spec = w.spec; }
}
const sendHome = () => { if (mine) { comp.clear(); mine = false; } };
/** play a compiled program. key = where the program counter is kept (scene id, or a transient id for small scripts). -> 'done' | 'out' | 'busy' | 'gone' */
async function runOps(key, ops, x) {
  if (running) return 'busy'; const s = st(), my = ++tok; running = true; met = {};
  if (!s.cur || s.cur.id !== key) { if (s.cur && s.cur.pc > 0) s.held[s.cur.id] = s.cur.pc; s.cur = { id: key, pc: s.held[key] || 0 }; delete s.held[key]; }
  safe(() => G.player.stop()); const alive = () => my === tok && !!s.cur && s.cur.id === key;
  const c = { person: x.person, venue: x.venue, alive, destOf: k => dest(k, x.person), hideWith: on => comp.hide(on), captionRel: (w, t, ms) => safe(() => G.goalsUI.caption(w, t, ms)) };
  try {
    while (alive() && s.cur.pc < ops.length) {
      const o = ops[s.cur.pc];
      if (o.op === 'say') { const r = await UI.say(lineOf(o, x)); if (my !== tok) return 'gone'; if (r !== 'next') { UI.close(); return 'out'; } s.cur.pc++; }
      else if (o.op === 'choice') {
        if (!UI.isOpen()) { for (let k = s.cur.pc - 1; k >= 0; k--) if (ops[k].op === 'say') { UI.context(lineOf(ops[k], x)); break; } }
        const v = await UI.choice(o.options.map(q => ({ id: q.id, text: fill(q.text, x.tok) }))); if (my !== tok) return 'gone'; const opt = o.options.find(q => q.id === v); if (!opt) { UI.close(); return 'out'; }
        s.picks[o.id] = v; apply(opt.fx, x.person, 'scene'); s.cur.pc = opt.to; G.emit('rel:choice', o.id, v); if (x.onPick) safe(() => x.onPick(o.id, v, opt));
      }
      else if (o.op === 'if') s.cur.pc = test(o.cond, x.person) ? s.cur.pc + 1 : o.to;
      else if (o.op === 'jmp') s.cur.pc = o.to;
      else if (o.op === 'beat') { if (UI.isOpen()) await UI.beat(o.ms || 900); else await sleep(300); if (my !== tok) return 'gone'; s.cur.pc++; }
      else if (o.op === 'play') { UI.close(); await sleep(250); const r = await runPlay(o.st, c); if (my !== tok || r === 'dead') return 'gone'; if (x.onPlay) safe(() => x.onPlay(o.st, r, c)); s.cur.pc++; await sleep(300); }
      else if (o.op === 'call') { UI.close(); await o.fn(c); if (my !== tok) return 'gone'; s.cur.pc++; }
      else { apply(o.e, x.person, 'scene'); s.cur.pc++; }
    }
    UI.close(); if (s.cur && s.cur.id === key) s.cur = null; return 'done';
  } catch (e) { console.error('rel scene', key, e); UI.close(); return 'out'; }
  finally { if (my === tok) running = false; }
}
/** play (or pick up) a scene. o: { force (debug: whatever its conditions) } */
async function start(id, o = {}) {
  const sc = SC[id]; if (!sc) return null; if (running) return 'busy'; const s = st(), d = dest(sc.place, sc.person);
  G.emit('rel:scene:start', id);
  const look = lookFor(sc, o); if (!(d && d.phone)) withUs(sc.speakers, look);
  const r = await runOps(id, compile(sc), { person: sc.person === 'kids' ? 'kids' : sc.person, look, phone: !!(d && d.phone), sub: '' });
  if (r === 'done') finish(sc); else if (r === 'out') { toast('It will keep. They will pick it up where you left off.', 'info', 3600); const of = s.off[id]; if (of) of.snooze = G.state.t + 30; }
  if (r !== 'busy') sendHome();
  return r;
}
function finish(sc) {
  const s = st(), id = sc.id; s.seen[id] = today(); s.lastScene = today(); const A = s.arcs[sc.arc] || (s.arcs[sc.arc] = {}); A.lastDay = today();
  apply(sc.fx, sc.person, 'scene');
  if (sc.ask) for (const p of sc.speakers.slice(0, 1)) s.threads[p] = id;
  const o = s.off[id]; if (o) { const a = apptOf(o); if (a) safe(() => G.planner.done(a.id)); if (pinOf(o)) safe(() => G.planner.remove(o.pin)); o.pin = null; o.done = 1; for (const p of sc.speakers) safe(() => G.social.place(p)); }
  for (const p of sc.speakers) safe(() => { const r = G.state.social.npcs[p]; if (r) r.lastTalkDay = today(); });
  if (sc.track === 'romance') safe(() => LIFE.milestone(sc));
  G.emit('rel:scene', id); safe(() => G.save && G.started && !(G.query && G.query.has('scene')) && G.save());
}

/* ---------- when is a scene ready ---------- */
function hardOk(sc) {
  const w = sc.when || {}, s = st(), p = sc.person;
  const prev = w.after || sc.prev;
  if (sc.track === 'friend') { if (prev && !seen(prev)) return false; } else { const need = { h2: 'h1', h3: 'h2', m2: 'm1' }[sc.key]; if (need && !seen(p + '.' + need)) return false; }
  if (w.fr && fr(p) < w.fr) return false;
  if (w.stage && ROMANCE_STAGES.indexOf(stage(p)) < ROMANCE_STAGES.indexOf(w.stage)) return false;
  if (w.flag && !B.flag(w.flag)) return false; if (w.notFlag && B.flag(w.notFlag)) return false;
  if (w.pick && !test('pick:' + w.pick)) return false;
  /* days since the scene before it (or, on the romance track, since the stage began) */
  const A = s.arcs[sc.arc] || {}, base = sc.track === 'romance' ? Math.max(A.lastDay === undefined ? -99 : A.lastDay, (s.ro[p] || {}).since || 0) : A.lastDay;
  const gap = w.days !== undefined ? w.days : sc.track === 'friend' && sc.n > 1 ? PACING.arcGapDays : 0;
  if (base !== undefined && gap && today() - base < gap) return false;
  return true;
}
function softOk(sc) {
  const w = sc.when || {}, n = G.now();
  if (w.chapter && !safe(() => G.chapters.done(w.chapter), false)) return false;
  if (w.weekday && !w.weekday.includes(n.weekday)) return false;
  if (w.weather && !w.weather.includes(B.wx())) return false;
  if (w.season && !w.season.includes(B.SEASONS[n.season])) return false;
  if (w.event && !B.eventOn(w.event)) return false;
  return true;
}
function ready(sc) {
  if (seen(sc.id) || !hardOk(sc)) return false; const s = st(), w = sc.when || {};
  if (s.wait[sc.id] === undefined) s.wait[sc.id] = today();
  if (softOk(sc)) return true;
  if (w.chapter && sc.track === 'friend' && B.castOf(lead(sc)) && safe(() => G.social.isFamily(lead(sc)), false) && !safe(() => G.chapters.done(w.chapter), false)) return false;      /* family scenes never run ahead of the Chapters */
  return !!w.orDays && today() - s.wait[sc.id] >= w.orDays;
}
const nextOf = key => { const a = arcOf(key); if (!a) return null; return a.scenes.map(x => SC[x.id]).find(sc => !seen(sc.id) && (sc.track === 'friend' || INVITED.includes(sc.key))) || null; };
const moving = key => { const a = arcOf(key); return a.scenes.some(x => seen(x.id) || st().off[x.id]) && !a.scenes.every(x => seen(x.id)); };
/** the scenes that could be offered right now, best first */
function available() {
  const s = st(), out = [], keys = Object.keys(ARCS).map(p => 'a:' + p).concat(ROMANCEABLE.filter(p => ROMANCE_STAGES.indexOf(stage(p)) >= 2).map(p => 'h:' + p));
  const mf = keys.filter(k => k[0] === 'a' && moving(k)).length, mr = keys.filter(k => k[0] === 'h' && moving(k)).length;
  for (const k of keys) {
    const sc = nextOf(k); if (!sc || s.off[sc.id]) continue; const A = s.arcs[k] || {};
    if (A.lastInvite !== undefined && today() - A.lastInvite < PACING.perPersonGapDays) continue;
    const rq = s.ro[sc.person]; if (rq && rq.quiet !== undefined && today() < rq.quiet) continue;                    /* the quiet spell after an ending */
    if (!moving(k) && (k[0] === 'a' ? mf >= PACING.activeArcs : mr >= PACING.romanceArcs)) continue;
    if (!dest(sc.place, sc.person)) continue; if (!ready(sc)) continue;
    out.push({ sc, score: (k[0] === 'h' ? 40 : 0) + (moving(k) ? 25 : 0) + fr(sc.person) / 4 + Math.min(20, today() - (s.wait[sc.id] || today())) });
  }
  return out.sort((a, b) => b.score - a.score).map(x => x.sc);
}

/* ---------- offers: the invitation, the pin, the appointment ---------- */
const openOffers = () => { const s = st(); return Object.keys(s.off).filter(id => SC[id] && !s.off[id].done && !seen(id)); };
const pinOf = o => (o && o.pin ? safe(() => G.planner.pins().find(p => p.id === o.pin), null) : null);
const apptOf = o => { if (!o) return null; const L = safe(() => G.planner.list(G.state.t - DAY, G.state.t + 30 * DAY), []); return (o.appt && L.find(a => a.id === o.appt && a.s !== 4)) || (o.pin && L.find(a => a.data && a.data.idea === 'pin:' + o.pin && a.s !== 4)) || null; };
function titleOf(sc, d) { const names = sc.speakers.map(short).join(' and '); return d.phone ? `${names}, on the telephone` : d.home ? `${names}, at your place` : `${names}, ${d.name}`; }
function offer(id, o = {}) {
  const sc = SC[id], s = st(); if (!sc || seen(id) || (s.off[id] && !s.off[id].done)) return false; const d = dest(sc.place, sc.person); if (!d) return false;
  s.off[id] = { day: today(), t: G.state.t, sent: !sc.invite, pin: null }; const A = s.arcs[sc.arc] || (s.arcs[sc.arc] = {}); A.lastInvite = today();
  if (!o.quiet) { s.lastOffer = today(); s.gap = PACING.sceneEvery[0] + (Math.abs((today() * 7919 + id.length * 31) % (PACING.sceneEvery[1] - PACING.sceneEvery[0] + 1))); }
  if (sc.invite) queueText({ from: lead(sc), text: sc.invite, inv: id, force: true }); else pin(id);
  G.emit('rel:offer', id); return true;
}
function pin(id) {
  const sc = SC[id], s = st(), o = s.off[id]; if (!sc || !o || o.done || pinOf(o) || apptOf(o)) return null; const d = dest(sc.place, sc.person), w = nextWindow(sc.window); if (!d || !w) return null;
  o.sent = true; o.pin = safe(() => G.planner.suggest({ title: titleOf(sc, d), placeId: d.placeId || null, t: Math.max(w.from, Math.ceil(G.state.t / 30) * 30), dur: 60, kind: 'friend', data: Object.assign({ rel: id, blurb: sc.title }, d.pos ? { pos: d.pos } : null) }), null);
  safe(() => G.emit('myday:change')); return o.pin;
}
HOOK.inviteArrived = id => pin(id);
/** an Idea that was added to the day: the appointment gets the person, the tag ("With a friend" / "Family") and the spot */
function onAdd(x) {
  const pinId = x && x.idea && x.idea.pinId, apptId = x && x.apptId; if (!pinId || !apptId || apptId === true) return; const s = st();
  const id = Object.keys(s.off).find(k => s.off[k].pin === pinId); if (id) { const sc = SC[id], o = s.off[id], d = dest(sc.place, sc.person), a = safe(() => G.planner.get(apptId), null); o.appt = apptId;
    if (a) safe(() => G.planner.update(apptId, { kind: 'friend', withNpc: B.castOf(lead(sc)) && !d.phone ? lead(sc) : undefined, data: Object.assign({}, a.data, { rel: id, blurb: sc.title }, d.pos ? { pos: d.pos } : null) })); return; }
  safe(() => DATES.onAdd(pinId, apptId));
}
/** every game minute: put the people of an open invitation at the place during its window (an accepted one at home: from its time) */
function stageOffers() {
  const s = st();
  for (const id of openOffers()) {
    const sc = SC[id], o = s.off[id]; if (!o.sent) continue;
    if (!pinOf(o) && !apptOf(o)) { if (o.aside === undefined) o.aside = today(); else if (today() - o.aside >= 3) { delete o.aside; pin(id); } continue; }      /* dismissed or missed: it comes back as an Idea after three days, quietly */
    const w = nextWindow(sc.window), d = dest(sc.place, sc.person); if (!w || !d || d.phone || d.any || G.state.t < w.from) continue;
    const a = apptOf(o); if (d.home && !(a && G.state.t >= a.t - 20)) continue;
    if (o.staged === w.from) continue; o.staged = w.from;
    for (const p of sc.speakers) { if (!B.castOf(p)) continue; safe(() => { if (!(G.social.known() || []).includes(p)) G.social.meet(p); });
      if (d.flat) continue;
      if (d.room) safe(() => G.social.place(p, d.room, { until: w.to, anim: 'stand' })); else safe(() => G.social.place(p, d.placeId || d.key, { x: d.x + 1 + sc.speakers.indexOf(p), y: d.y + .5, scene: 'city', until: w.to, anim: 'stand' })); }
  }
}
/** is there an invitation that can begin here and now (optionally: with this person)? */
function hereNow(person) {
  const s = st(), t = G.state.t;
  for (const id of openOffers()) {
    const sc = SC[id], o = s.off[id]; if (!o.sent || (person && !sc.speakers.includes(person))) continue; if (!person && o.snooze && o.snooze > t) continue;
    if (!inWindow(sc.window) && !(s.cur && s.cur.id === id)) continue; const d = dest(sc.place, sc.person); if (!d || !at(d)) continue;
    if (d.home || d.phone || d.any) { const a = apptOf(o); if (!a || t < a.t - 20) continue; }
    return sc;
  }
  return null;
}
let carding = false;
async function card(sc) {
  if (carding || running) return 'busy'; carding = true;
  try {
    const s = st(), o = s.off[sc.id], a = arcOf(sc.arc), d = dest(sc.place, sc.person), resume = !!((s.cur && s.cur.id === sc.id) || s.held[sc.id]);
    const v = await UI.card({ kicker: d.phone ? `${short(lead(sc))} is on the telephone` : sc.track === 'romance' ? short(lead(sc)) : `${sc.speakers.map(short).join(' and ')} · ${a.title}`, title: sc.title, hook: sc.n <= 1 && a.premise ? a.premise : 'They are expecting you. It will take a little while, and it keeps your place.',
      who: sc.speakers.map(p => who(p)).filter(w => w.spec).map(w => ({ name: w.short, spec: w.spec })), meta: 'About ten minutes · the clock stands still while you talk', ready: 'No rush. Nothing here runs out.', canBegin: true, resume });
    if (v !== 'begin') { if (o) o.snooze = G.state.t + 120; return 'later'; }
    return await start(sc.id);
  } finally { carding = false; }
}
function tryStart() { if (busy() || carding) return; const sc = hereNow(); if (!sc) return; const d = dest(sc.place, sc.person);
  /* in a room or at home: at once. At a spot in the city: when you are close to them */
  if (d.spot && !d.any && !d.phone) { const c = safe(() => G.social.char(lead(sc)), null); if (c && Math.hypot(c.x - G.player.x, c.y - G.player.y) > 4.2) return; }
  card(sc); }
/** add-only hook in sim/social.js talk(): a tap on a person who is expecting you begins their scene instead of small talk */
function intercept(id) {
  if (busy() || carding) return false;
  const sc = hereNow(id); if (sc) { card(sc); return true; }
  return !!safe(() => DATES.intercept(id), false) || !!safe(() => LIFE.intercept(id), false) || !!safe(() => meetScene(id), false);
}
/** the `meet` scene: by itself, the first time you talk to a romanceable Friend at their place (MILESTONES.meet) */
function meetScene(id) {
  if (!isRom(id) || B.canStart(id) !== true || stage(id) !== 'none') return false; const sc = SC[id + '.meet']; if (!sc || seen(sc.id) || fr(id) < ((sc.when || {}).fr || 40)) return false;
  const d = dest(sc.place, id); if (!d || !at(d) || (sc.window && !inWindow(sc.window))) return false;
  start(sc.id).then(r => { if (r === 'done') B.setFlag('met:' + id + ':noticed'); }); return true;
}

/* ---------- the governor ---------- */
function govern(force) {
  const s = st(), n = G.now(); if (!force) {
    if (today() < 5 || n.hf < 8 || n.hf > 19.5) return null;
    if (safe(() => G.chapters.current(), null) || s.chDay === today() || s.jobInvDay === today()) return null;
    if (openOffers().filter(id => s.off[id].aside === undefined).length >= PACING.scenesOfferedAtOnce) return null;
    if (today() - s.lastOffer < s.gap || s.lastScene === today()) return null;
    if (Object.values(s.dates || {}).some(d => Math.floor(d.t / DAY) === today() && !d.done)) return null;        /* a date you booked is that day's deep scene */
  }
  const sc = available()[0]; if (!sc) return null; offer(sc.id); return sc.id;
}

/* ---------- the rose marker + the arrow ---------- */
function markers() { const s = st(), out = []; for (const id of openOffers()) { const sc = SC[id], o = s.off[id]; if (!o.sent || !inWindow(sc.window)) continue; const d = dest(sc.place, sc.person); if (d && isFinite(d.x) && !d.any && !d.phone && !d.home) out.push({ id, x: d.x, y: d.y, room: d.room, label: short(lead(sc)) }); } return out.concat(safe(() => DATES.markers(), [])); }
let MK = [], mkT = 0;
function drawMarkers(ctx, cam) {
  if (!G.scene || G.scene.id !== 'city' || (G.cutscene && G.cutscene.hideMarkers) || !MK.length) return; const t = performance.now() / 1000;
  for (const m of MK) {
    const z = safe(() => G.world.heightAt(m.x, m.y), 0), p = WS(m.x, m.y, z), X = Math.round(p[0] - cam.x), Y = Math.round(p[1] - cam.y) - (m.room ? 6 : 0); if (X < -20 || Y < -30 || X > G.W + 20 || Y > G.H + 40) continue;
    const k = (t * .7) % 1, rx = 5 + k * 6; ctx.globalAlpha = .7 * (1 - k); ctx.fillStyle = '#ffc2d1'; for (let a = 0; a < 24; a++) { const an = a / 24 * 6.283; ctx.fillRect(Math.round(X + Math.cos(an) * rx), Math.round(Y + Math.sin(an) * rx / 2), 1, 1); }
    ctx.globalAlpha = 1; const b = Math.round(Math.sin(t * 2.2) * 1.5), y = Y - 30 + b;
    /* a small rose lantern with a heart: two bumps, a body, a point, a stem of light */
    ctx.fillStyle = '#7a2238'; ctx.fillRect(X - 5, y - 1, 11, 9); ctx.fillRect(X - 4, y + 8, 9, 2); ctx.fillRect(X - 2, y + 10, 5, 2); ctx.fillRect(X, y + 12, 1, 2); ctx.fillRect(X - 4, y - 2, 4, 1); ctx.fillRect(X + 1, y - 2, 4, 1);
    ctx.fillStyle = '#e8587a'; ctx.fillRect(X - 4, y, 9, 7); ctx.fillRect(X - 3, y + 7, 7, 2); ctx.fillRect(X - 1, y + 9, 3, 2); ctx.fillRect(X - 3, y - 1, 2, 1); ctx.fillRect(X + 2, y - 1, 2, 1); ctx.fillStyle = '#7a2238'; ctx.fillRect(X, y - 1, 1, 2);
    ctx.fillStyle = '#ffd6e0'; ctx.fillRect(X - 3, y + 1, 2, 2);
  }
}
function defineNav() {
  if (!G.navGoals || !G.navGoals.define) return;
  G.navGoals.define('rel', 'commit', 67, ctx => {
    const s = st(); let best = null;
    for (const id of openOffers()) { const sc = SC[id], o = s.off[id], a = apptOf(o); if (!a || !o.sent) continue; const d = dest(sc.place, sc.person); if (!d || d.any || d.phone) continue;
      const mineSel = ctx.sel && ctx.sel.appt === a.id, near = ctx.placeId && (ctx.placeId === d.placeId || ctx.root === d.root || ctx.root === d.room); if (!mineSel && !near && !(ctx.here && (ctx.here === d.room || ctx.here === d.root))) continue;
      if (seen(id)) return { done: true, quiet: 1, name: short(lead(sc)) };
      const c = safe(() => G.social.char(lead(sc)), null); best = { room: d.room || 'city', find: c ? { npc: lead(sc) } : d.room ? null : { x: d.x, y: d.y, h: 2.2 }, label: inWindow(sc.window) ? `${short(lead(sc))} is expecting you` : `${short(lead(sc))}: ${windowWords(sc.window)}`, short: short(lead(sc)), name: short(lead(sc)) }; if (mineSel) break; }
    return best || safe(() => DATES.navStep(ctx), null);
  });
}

/* ---------- public views ---------- */
function arcView(p) { const key = ARCS[p] ? 'a:' + p : HEARTS[p] ? 'h:' + p : null; if (!key) return null; const a = arcOf(key), s = st(); return { key, person: p, title: a.title, premise: a.premise, done: a.scenes.every(x => seen(x.id)), scenes: a.scenes.map(x => ({ id: x.id, n: x.n, title: x.title, seen: seen(x.id), offered: !!(s.off[x.id] && !s.off[x.id].done), ready: !seen(x.id) && ready(SC[x.id]) })) }; }
const people = () => ROMANCEABLE.map(id => ({ id, name: short(id), stage: stage(id), label: B.stageLabel(id), warmth: B.warmth(id), friend: fr(id), can: B.canStart(id) }));

/* ---------- debug ---------- */
const debug = {
  state: () => st(), scenes: () => Object.keys(SC), list: () => Object.keys(ARCS).map(arcView).concat(Object.keys(HEARTS).map(arcView)), people,
  /** play a scene here and now, whatever its conditions */
  fire(id) { const s = st(); delete s.seen[id]; delete s.held[id]; if (s.cur && s.cur.id === id) s.cur = null; return start(id, { force: true }); },
  offer(id) { const s = st(); delete s.seen[id]; delete s.off[id]; return offer(id, { quiet: true }); },
  /** offer it and deliver the invitation now; `go` also takes you to the place inside its window */
  async invite(id, go) { const sc = SC[id]; if (!sc) return null; debug.offer(id); pumpTexts(true); pin(id); if (go) { const w = nextWindow(sc.window); if (w && G.state.t < w.from) G.advance(w.from + 5 - G.state.t); stageOffers(); await debug.goto(sc.place, sc.person); } return st().off[id]; },
  async goto(place, person) { const d = dest(place, person); if (!d || d.any || d.phone) return false; if (d.flat) { await G.go('int:' + d.flat); return true; } if (d.room) { await G.go('int:' + d.room); return true; } await G.go('city', { x: d.x - 2.5, y: d.y + 2.5 }); return true; },
  setFriend(id, n) { safe(() => { if (!(G.social.known() || []).includes(id)) G.social.meet(id); G.social.setRel(id, n); }); return fr(id); },
  setStage(id, sg, pts) { const r = ror(id); if (sg === 'none') { r.stage = 'none'; r.pts = 0; return r; } setStage(id, sg, true); const i = ROMANCE_STAGES.indexOf(sg); if (i >= 2 && !r.dates) { r.dates = 1; r.firstDateDay = today() - 1; st().seen['fd.' + id] = today() - 1; } if (i >= 3) r.hearts[0] = 1; if (i >= 4) { r.hearts[1] = 1; r.partnerDay = today(); } r.pts = pts !== undefined ? pts : Math.max(r.pts, [0, 2, 12, 35, 55, 85, 85][i]); return r; },
  setWarmth(id, n) { const r = ror(id); r.pts = B.cl(n, 0, 100); return r.pts; },
  seen(id, on = true) { if (on) st().seen[id] = today() - 1; else delete st().seen[id]; },
  skipDays(n = 1) { for (let k = 0; k < n * 24; k++) { safe(() => { for (const nd of ['hunger', 'energy', 'hygiene', 'bladder', 'social', 'fun']) G.needs.set(nd, 80); }); G.advance(60); } return today(); },
  govern: force => govern(force !== false), available: () => available().map(x => x.id), offers: () => openOffers().map(id => Object.assign({ id }, st().off[id])), texts: () => pumpTexts(true),
  places() { const bad = []; for (const id in SC) if (!dest(SC[id].place, SC[id].person)) bad.push(id + ' @ ' + SC[id].place); return bad; },
  reset() { B.resetState(); tok++; running = false; UI.close(); return true; },
  small: () => SMALLBITS.debug(), date: (id, type, venue) => DATES.debugStage(id, type, venue), wedding: v => LIFE.debugWedding(v), movein: id => LIFE.moveIn(id, true),
  /** play every step of a scene with instant choices (first option, or `pickN`): used by the sweep test */
  async menu() {
    const all = Object.keys(ARCS).map(p => ({ p, a: arcView(p), rom: false })).concat(ROMANCEABLE.map(p => ({ p, a: arcView(p), rom: true })));
    const p = await choose('Relationships', all.map(x => ({ label: (x.rom ? '♥ ' : '') + (x.p === 'kids' ? 'Pip and Milo' : short(x.p)), sub: `${x.a.title} · ${x.a.scenes.filter(q => q.seen).length}/${x.a.scenes.length}${x.rom ? ' · ' + (B.stageLabel(x.p) || 'no track') + ' ' + B.warmth(x.p) : ' · ' + B.FRIEND_LABEL[B.friendStage(x.p)] + ' ' + Math.round(fr(x.p))}`, value: x.p })).concat([{ label: 'Skip days...', value: '_days' }, { label: 'Offer the next scene now (governor)', value: '_gov' }, { label: 'Deliver waiting texts', value: '_tx' }, { label: 'Say a small bit now', value: '_small' }, { label: 'Stage the wedding...', value: '_wed' }]), { cls: 'dev-list' });
    if (!p) return; if (p === '_gov') return toast('Offered: ' + (govern(true) || 'nothing is ready')); if (p === '_tx') return pumpTexts(true); if (p === '_small') return SMALLBITS.debug();
    if (p === '_days') { const n = await choose('Skip how many days?', [1, 2, 3, 5, 7, 14, 28].map(x => ({ label: String(x), value: x }))); return n ? debug.skipDays(n) : null; }
    if (p === '_wed') return LIFE.debugWedding();
    const a = arcView(p), rom = isRom(p), id = p === 'kids' ? 'pip' : p;
    const act = await choose((p === 'kids' ? 'Pip and Milo' : short(p)) + ': ' + a.title, [{ label: 'Fire a scene here...', value: 'fire' }, { label: 'Invite me to a scene (text, pin, go there)...', value: 'inv' }, { label: 'Set friendship...', value: 'fr' },
      rom ? { label: 'Set romance stage...', value: 'st' } : null, rom ? { label: 'Set warmth...', value: 'w' } : null, rom ? { label: 'First date scene (here)', value: 'fd' } : null, rom ? { label: 'Stage a date...', value: 'date' } : null, rom ? { label: 'Move in / out', value: 'live' } : null, { label: 'Mark the arc as seen', value: 'all' }].filter(Boolean), { cls: 'dev-list' });
    if (act === 'fire' || act === 'inv') { const sid = await choose('Which scene?', a.scenes.map(q => ({ label: `${q.n}. ${q.title}`, sub: q.id + (q.seen ? ' · seen' : ''), value: q.id })), { cls: 'dev-list' }); if (sid) return act === 'fire' ? debug.fire(sid) : debug.invite(sid, true); }
    if (act === 'fr') { const n = await choose('Friendship', [0, 15, 40, 60, 75, 90].map(x => ({ label: String(x), value: x }))); if (n !== null) return debug.setFriend(id, n); }
    if (act === 'st') { const sg = await choose('Stage', ROMANCE_STAGES.map(x => ({ label: x, value: x }))); if (sg) return debug.setStage(p, sg); }
    if (act === 'w') { const n = await choose('Warmth', [5, 12, 35, 45, 55, 75, 85, 95].map(x => ({ label: String(x), value: x }))); if (n !== null) return debug.setWarmth(p, n); }
    if (act === 'fd') return debug.fire('fd.' + p);
    if (act === 'date') { const ty = await choose('Which date?', DATES.typeList().map(t => ({ label: t.name, sub: t.id, value: t.id })), { cls: 'dev-list' }); if (ty) return DATES.debugStage(p, ty); }
    if (act === 'live') return st().live && st().live.id === p ? LIFE.moveOut(p) : LIFE.moveIn(p, true);
    if (act === 'all') { for (const q of a.scenes) st().seen[q.id] = today() - 1; return true; }
  },
};

export function init() {
  st(); B.regMoods();
  HOOK.start = start; HOOK.runOps = runOps; HOOK.compile = steps => { const k = '_'; delete PROG[k]; return compile({ id: k, steps }); }; HOOK.offer = offer; HOOK.busy = busy; HOOK.withUs = withUs; HOOK.sendHome = sendHome; HOOK.SC = SC; HOOK.seen = seen; HOOK.isRunning = () => running; HOOK.card = card;
  G.rel = {
    stage, stageLabel: B.stageLabel, warmth: B.warmth, addWarmth: B.addWarmth, friendStage: B.friendStage, partner: B.partner, remember: B.remember, remembers: B.remembers, pick: id => st().picks[id],
    offer, start, available: () => available().map(x => x.id), offers: () => openOffers(), arc: arcView, scene: id => SC[id] || null, active: () => running, people, openTo(list) { if (Array.isArray(list)) st().openTo = list.filter(x => ['w', 'm', 'n'].includes(x)); return st().openTo.slice(); },
    verbs: id => VERBS.verbsFor(id), date: { types: id => DATES.typesFor(id), book: o => DATES.book(o), start: apptId => DATES.startAppt(apptId), list: () => DATES.list() },
    moveIn: id => LIFE.moveIn(id), moveOut: id => LIFE.moveOut(id), propose: id => LIFE.propose(id), wedding: { plan: o => LIFE.weddingPlan(o), state: () => st().wedding, begin: () => LIFE.weddingBegin() }, endIt: (id, how) => LIFE.endIt(id, how),
    pages: id => LIFE.pages(id), keepsakes: () => st().keeps.map(k => Object.assign({ id: k }, B.ITEMS[k])), who,
    /* add-only hooks used by sim/social.js, ui/talk.js, ui/phone_messages.js */
    intercept, talkVerbs: (ses, out) => VERBS.talkVerbs(ses, out), talkAct: (ses, vid, arg) => VERBS.talkAct(ses, vid, arg), talkMeter: (ses, head) => VERBS.talkMeter(ses, head), talkPicker: (ses, v, ui) => VERBS.talkPicker(ses, v, ui), greeting: ses => SMALLBITS.greeting(ses), wave: id => SMALLBITS.wave(id), personCard: (id, b, ctx) => VERBS.personCard(id, b, ctx),
    PACING, debug,
  };
  SMALLBITS.init(); VERBS.init(); DATES.init(); LIFE.init();
  G.overlays.push(drawMarkers);
  let acc = 0;
  G.addSystem({ name: 'rel', update(dt) { if (mine && !safe(() => G.chapters.active(), false)) comp.update(dt); acc += dt; if (acc < 1) return; acc = 0; safe(tryStart); safe(() => DATES.tick()); safe(() => VERBS.tick()); safe(() => LIFE.tick()); if (++mkT % 2 === 0 || !MK.length) MK = safe(markers, []); } });
  G.on('minutes', () => { pumpTexts(); safe(stageOffers); if (running) safe(() => { for (const k of ['hunger', 'energy', 'hygiene', 'bladder', 'social', 'fun', 'comfort']) if (G.needs.get(k) < NEED_FLOOR) G.needs.set(k, NEED_FLOOR); }); });
  G.on('hour', () => { safe(govern); safe(() => SMALLBITS.hourly()); safe(() => LIFE.hourly()); });
  G.on('day', () => { safe(() => LIFE.daily()); safe(() => DATES.daily()); });
  G.on('chapter:start', () => { st().chDay = today(); }); G.on('jobstory:invite', () => { st().jobInvDay = today(); });
  G.on('myday:add', x => safe(() => onAdd(x)));
  G.on('scene', () => { if (mine && !safe(() => G.chapters.active(), false)) setTimeout(() => comp.rescene(), 0); MK = safe(markers, []); setTimeout(() => safe(stageOffers), 200); });
  const wake = () => { st(); tok++; running = false; carding = false; mine = false; const s = st(), sc = s.cur && SC[s.cur.id];
    if (s.cur && !sc) { s.cur = null; return; } if (!sc) return;
    /* a save made in the middle of a scene: carry on from the same line if the player is still standing there */
    setTimeout(() => { const d = dest(sc.place, sc.person); if (d && at(d) && !busy()) start(sc.id); }, 1700); };
  G.on('load', wake); G.on('ready', () => { wake(); safe(defineNav); safe(stageOffers); });
}
