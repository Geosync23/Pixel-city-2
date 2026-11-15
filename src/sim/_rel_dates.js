// Relationship dates (helper of sim/rel.js): dates as real play (rel_dates.js, rel_dates_talk.js; RELATIONSHIPS.md section 6).
//   BOOK     "Ask on a date" (talk panel) or Porchlight: type > place > time, inside the person's `free` hours and the type's window. It lands on My Day
//            as an appointment with them ("A date"). Before the first date the only thing on offer is that person's own FIRST DATE scene, at their place and hours.
//   RUN      when you are at the place around the time, in DATE_ORDER: arrive (a caption) > their line as you meet > THE PLAY (the place's own system, through
//            _rel_play.js: the venue's real menu for two, a whole show in two seats, the constellation tracer, the cooking window, the Wheel, a walk...) >
//            their line during it > THE TALK (the first of their four conversations whose condition is true and that you have not had; then one comfortable
//            line) > close > their goodnight text. The companion is a real figure in their date look who stands and walks with you (the Chapters' companion code).
//   SCORE    quiet, cannot fail (OUTCOMES): on time, not starving or filthy, a type or dish they like, the talk, a remembered detail, a bonus. Shown only as the
//            goodnight text and a moodlet. Warmth 4 / 6 / 8. Late by more than half an hour: their kind line, -1. Not turning up: a kind text, -4, and a quiet
//            Idea in My Day to make it up to them (a text of two honest lines clears the dip).
//   One date a day; the same person every second day at most. A date you booked is that day's deep scene (the governor offers nothing else).
import { G } from '../core/game.js';
import { toast, choose } from '../ui/kit.js';
import { UI } from '../ui/chapters_ui.js';
import { DATE_TYPES, OUTCOMES, REPAIR, FIRST_DATES, GOODNIGHT, DATE_FALLBACK } from '../story/rel_dates.js';
import { DATE_LINES, DATE_TALK, DATE_TALK_AFTER } from '../story/rel_dates_talk.js';
import { comp } from './_chapters_cast.js';
import * as B from './_rel_base.js';
import { st, safe, sleep, today, DAY, HOOK, fill, short, dest, at, stage, stageIdx, warmth, addWarmth, ror, test, queueText, mood, PEOPLE, WDL, hhmm, isRom, castOf } from './_rel_base.js';

const SEASON = ['spring', 'summer', 'autumn', 'winter'];
const say = (who, text) => ({ do: 'say', who, text });
const eventOnDay = (id, day) => safe(() => G.planner.eventsOn(day), []).some(e => e.data && e.data.eventId === id);
const isBirthday = id => { const b = (castOf(id) || {}).birthday, n = G.now(); return !!b && b.season === SEASON[n.season] && b.day === n.dayOfMonth; };
export const typeList = () => Object.values(DATE_TYPES);
const venuesOf = (T, id) => T.venues.map(k => ({ key: k, d: dest(k, id) })).filter(v => v.d && !v.d.any && !v.d.phone).map(v => ({ key: v.key, name: v.d.home ? 'Your place' : v.d.name.replace(/^the /, 'The ') }));
/** what you can ask this person to do, now */
export function typesFor(id) {
  const P = PEOPLE[id]; if (!P || !isRom(id) || stageIdx(id) < 1) return []; const r = ror(id);
  if (!r.dates) { const f = FIRST_DATES[id], d = dest(f.place, id); return [{ id: 'first', name: 'A first date: ' + f.title, sub: d ? d.name + ' · their idea' : 'their idea', venues: d ? [{ key: f.place, name: d.name }] : [] }]; }
  const si = stageIdx(id), L = P.likes.outings || [], D = (P.dislikes && P.dislikes.outings) || [];
  return typeList().filter(T => T.id !== 'plusone' && (si >= 2 || T.minStage === 'spark')).map(T => ({ id: T.id, name: T.name, sub: (L.includes(T.id) ? '★ their sort of thing · ' : D.includes(T.id) ? 'not their favourite, they will come · ' : '') + T.cost, venues: venuesOf(T, id), liked: L.includes(T.id) }))
    .filter(t => t.venues.length).sort((a, b) => (b.liked ? 1 : 0) - (a.liked ? 1 : 0));
}
const dateOn = day => Object.values(st().dates).some(d => d.done !== 2 && Math.floor(d.t / DAY) === day);
/** times on the next six days when they are free, the place is right and you have no other date */
export function timesFor(id, type, venue) {
  const P = PEOPLE[id], f = type === 'first' ? FIRST_DATES[id] : null, T = f ? { window: f.window || { from: 10, to: 20 }, minutes: 60 } : DATE_TYPES[type]; if (!P || !T) return [];
  const w = T.window || { from: 9, to: 21 }, out = [], d0 = today(), r = ror(id), free = f ? [{ days: w.days || [0, 1, 2, 3, 4, 5, 6], from: w.from, to: w.to }] : P.free;
  for (let d = d0; d < d0 + 7 && out.length < 9; d++) {
    if (dateOn(d) || (r.lastDate !== undefined && Math.abs(d - r.lastDate) < 2 && r.dates)) continue; if (w.days && !w.days.includes(d % 7)) continue;
    if (w.event && !eventOnDay(w.event, d) && !(T.bonus && eventOnDay(T.bonus, d))) continue;
    for (const fw of free) { if (!fw.days.includes(d % 7)) continue; const a = Math.max(fw.from, w.from), z = Math.min(fw.to, w.to) - Math.min(1, (T.minutes || 60) / 60); if (z < a) continue;
      for (const h of [a, (a + z) / 2, z].filter((x, i, arr) => arr.indexOf(x) === i && (i === 0 || x - arr[i - 1] >= 1))) { const hh = Math.round(h * 2) / 2, t = d * DAY + hh * 60; if (t < G.state.t + 20 || out.some(o => o.t === t)) continue;
        out.push({ t, label: `${d === d0 ? 'Today' : d === d0 + 1 ? 'Tomorrow' : WDL[d % 7]}, ${hhmm(hh)}`, sub: w.event && eventOnDay(T.bonus, d) ? 'a special night' : '' }); if (out.length >= 9) break; } }
  }
  return out.sort((a, b) => a.t - b.t);
}
/** book it: an appointment with them on My Day. o = { id, type, venue, t, title? } -> appointment id | null */
export function book(o) {
  const id = o.id, P = PEOPLE[id], s = st(); if (!P || stageIdx(id) < 1) return null; const first = o.type === 'first' || !ror(id).dates, T = first ? null : DATE_TYPES[o.type]; if (!first && !T) return null;
  const f = FIRST_DATES[id], key = first ? f.place : o.venue || T.venues[0], d = dest(key, id); if (!d || d.any || d.phone) return null; if (dateOn(Math.floor(o.t / DAY))) return null;
  const title = first ? `A first date with ${short(id)}` : fill(T.plan, { npc: short(id), event: o.title || 'the day out' }), dur = first ? 75 : T.minutes || 60;
  const appt = safe(() => G.planner.add({ title, placeId: d.placeId || null, t: Math.round(o.t), dur, kind: 'friend', withNpc: id, chosen: true, data: Object.assign({ relDate: id, blurb: 'A date' }, d.pos ? { pos: d.pos } : null) }), null); if (!appt) return null;
  s.dates[appt] = { id, type: first ? 'first' : o.type, venue: key, t: Math.round(o.t), dur, appt, done: 0 };
  mood('rel_butterflies'); G.emit('rel:date:booked', id, s.dates[appt].type, appt); return appt;
}
export const list = () => Object.values(st().dates).filter(d => !d.done);
const destOfDate = d => dest(d.venue, d.id);
const due = d => !d.done && G.state.t >= d.t - 25 && G.state.t <= d.t + d.dur + 60;
function stageDate(d) {      /* they are there a little early, in view, waiting */
  if (d.staged || G.state.t < d.t - 25) return; d.staged = 1; const x = destOfDate(d), id = d.id; if (!x) return; safe(() => { if (!(G.social.known() || []).includes(id)) G.social.meet(id); });
  if (x.room) safe(() => G.social.place(id, x.room, { until: d.t + d.dur + 60, anim: 'stand' })); else safe(() => G.social.place(id, x.placeId || x.key, { x: x.x, y: x.y, scene: 'city', until: d.t + d.dur + 60, anim: 'stand' }));
}
export const markers = () => list().filter(d => due(d)).map(d => { const x = destOfDate(d); return x && isFinite(x.x) && !x.home ? { id: 'date:' + d.appt, x: x.x, y: x.y, room: x.room, label: short(d.id) } : null; }).filter(Boolean);
export const navStep = () => null;      /* the appointment carries `withNpc`: the existing 'meet' resolver leads to them */
export const onAdd = () => null;

/* ---------- running a date ---------- */
let on = null;
function talkFor(id) { const r = ror(id), L = DATE_TALK[id] || []; return L.find(t => !r.talks.includes(t.id) && test(t.when, id)) || null; }
async function runDate(d) {
  if (on || HOOK.isRunning()) return 'busy'; const id = d.id, s = st();
  if (d.type === 'first') { on = d; try { safe(() => G.social.place(id)); HOOK.withUs([id], 'date', true); const r = await HOOK.start('fd.' + id, { look: 'date' }); if (r === 'done') { d.done = 1; safe(() => G.planner.done(d.appt)); } return r; } finally { on = null; } }
  const T = DATE_TYPES[d.type], P = PEOPLE[id], r = ror(id), late = G.state.t - d.t, lines = (DATE_LINES[id] || {})[d.type] || [], nth = (r.types[d.type] || 0) + 1, wet = ['rain', 'storm', 'snow'].includes(B.wx());
  const tk = talkFor(id), after = DATE_TALK_AFTER[id] || [], res = { play: 'ok', mem: false, late };
  const steps = [say('narrator', T.arrive[(nth - 1) % T.arrive.length])];
  if (wet && T.wet) steps.push(say('narrator', T.wet));
  if (late > 30) steps.push(say(id, REPAIR.late[id])); else if (lines[0]) steps.push(say(id, lines[nth > 1 && lines.length > 2 ? 2 : 0])); else steps.push(...DATE_FALLBACK.arrive);
  if (isBirthday(id)) steps.push(...DATE_FALLBACK.birthday);
  steps.push(Object.assign({}, T.play, { id: T.play.id === 'venue' || T.play.id === 'event' ? T.play.id : T.play.id }));
  if (nth >= 4) steps.push(...DATE_FALLBACK.again); else if (lines[1]) steps.push(say(id, lines[nth > 1 && lines.length > 3 ? 3 : 1])); else steps.push(...DATE_FALLBACK.moment);
  if (tk) { steps.push(...tk.steps); steps.push({ do: 'fx', _talk: tk.id }); } else if (after.length) steps.push(say(id, after[(r.dates + nth) % after.length]));
  steps.push(say('narrator', T.close[(nth - 1) % T.close.length]));
  on = d; safe(() => G.social.place(id)); HOOK.withUs([id], 'date', true);
  try {
    const ops = HOOK.compile(steps); for (const o of ops) if (o.op === 'fx' && o.e._talk) { const tid = o.e._talk; o.op = 'call'; o.fn = async () => { if (!r.talks.includes(tid)) r.talks.push(tid); res.talk = true; res.mem = /^(mem|seen|stage):/.test(tk.when); }; }
    const venue = d.venue, out = await HOOK.runOps('date:' + d.appt, ops, { person: id, venue: venue === 'home' ? 'home' : (destOfDate(d) || {}).placeId || venue, look: 'date', onPlay: (stp, v, c) => { res.play = v; res.c = c; } });
    if (out !== 'done') { if (out === 'out') toast('It will keep for a little. They wait.', 'info', 3200); return out; }
    finishDate(d, T, res); return 'done';
  } finally { on = null; setTimeout(() => { if (!HOOK.isRunning()) HOOK.sendHome(); }, 2500); }
}
function finishDate(d, T, res) {
  const id = d.id, P = PEOPLE[id], r = ror(id), N = G.needs; let pts = 0;
  if (res.late <= 10) pts++;
  if (safe(() => N.get('hygiene'), 60) > 40 && safe(() => N.get('hunger'), 60) > 12 && safe(() => N.get('energy'), 60) > 12) pts++;
  if ((P.likes.outings || []).includes(d.type) || res.play === 'good' && ['order', 'cook'].includes(T.play.kind)) pts++;
  pts++;                                                   /* the talk happened: it always does */
  if (res.mem || Object.keys(st().mem[id] || {}).length >= 3 && res.talk) pts++;
  if ((T.bonus && B.eventOn(T.bonus)) || isBirthday(id) || ((st().small.ev || {}).gift || {})[id] && st().small.ev.gift[id][1] === today()) pts++;
  const out = pts >= 5 ? 'books' : pts >= 3 ? 'lovely' : 'fine';
  d.done = 1; d.out = out; r.dates++; r.lastDate = today(); r.types[d.type] = (r.types[d.type] || 0) + 1; r.lastSeen = today();
  addWarmth(id, OUTCOMES.warmth[out] + (res.late > 30 ? -1 : 0), 'date'); mood(OUTCOMES.mood[out]); safe(() => G.planner.done(d.appt)); safe(() => N.add('social', 30)); B.addFr(id, 2);
  queueText({ from: id, text: GOODNIGHT[id][out], after: 1.5, force: true });
  G.emit('rel:date', id, d.type, out);
  /* MILESTONES.steady: if the warmth is there and you have not asked, THEY raise it at the end of a date */
  if (stage(id) === 'dating' && warmth(id) >= 45 && (r.hearts[0] || HOOK.seen(id + '.h1')) && today() - (r.since || 0) >= 6 && !HOOK.seen(id + '.steady')) setTimeout(() => { if (!HOOK.busy()) HOOK.start(id + '.steady'); }, 1800);
}
export function tick() {
  const s = st(); for (const k in s.dates) { const d = s.dates[k]; if (d.done) continue; safe(() => stageDate(d));
    if (!on && due(d) && !HOOK.busy()) { const x = destOfDate(d); if (x && at(x)) { const c = safe(() => G.social.char(d.id), null); if (x.spot && c && Math.hypot(c.x - G.player.x, c.y - G.player.y) > 4.5) continue; runDate(d); return; } } }
}
/** add-only hook (through G.rel.intercept): a tap on your date begins it */
export function intercept(id) { const d = list().find(x => x.id === id && due(x)); if (!d) return false; const x = destOfDate(d); if (!x || !at(x)) return false; runDate(d); return true; }
export const startAppt = apptId => { const d = st().dates[apptId]; return d && !d.done ? runDate(d) : null; };
function missed(a) {
  const d = a && st().dates[a.id]; if (!d || d.done) return; const id = d.id; d.done = 2; safe(() => G.social.place(id));
  addWarmth(id, B.WARMTH.stoodUp, 'date'); ror(id).owe = today(); queueText({ from: id, text: REPAIR.stoodUp[id], after: .5, force: true });
  ror(id).owePin = safe(() => G.planner.suggest({ title: `Make it up to ${short(id)}`, t: G.state.t + 60, dur: 20, kind: 'friend', data: { relRepair: id, blurb: 'A text will do. So will turning up.' } }), null);
}
/** the quiet way to make it right: a text of two honest lines (also cleared by a loved gift or by simply talking to them) */
async function repair(id) { const r = ror(id); if (!r.owe && r.owe !== 0) return false; const v = await choose(`A text to ${short(id)}`, REPAIR.texts.map((t, i) => ({ label: t, value: i }))); if (v === null || v === undefined) return false;
  safe(() => G.messages.sendMine(id, REPAIR.texts[v])); delete r.owe; delete r.owePin; addWarmth(id, 3, 'scene'); queueText({ from: id, text: 'Thank you for saying. Yes. Pick a day.', after: 1, force: true }); return true; }
export function daily() { const s = st(); for (const id in s.ro) { const r = s.ro[id]; if (r.owePin && r.owe !== undefined && today() - r.owe >= 3) safe(() => HOOK.unpinRepair(r)); }      /* the "make it up" Idea does not linger: after three days it goes, and simply talking to them clears the dip */
  for (const k in s.dates) if (s.dates[k].done && today() - Math.floor(s.dates[k].t / DAY) > 3) delete s.dates[k]; }
/** debug: make sure there is a track, book this date for five minutes from now and stand at the place */
export async function debugStage(id, type, venue) {
  const r = ror(id); if (stageIdx(id) < 2 && type !== 'first') { B.setStage(id, 'dating', true); if (!r.dates) { r.dates = 1; st().seen['fd.' + id] = today() - 1; } } if (stageIdx(id) < 1) B.setStage(id, 'spark', true);
  for (const k in st().dates) if (!st().dates[k].done) { safe(() => G.planner.remove(k)); delete st().dates[k]; } r.lastDate = -9;
  const T = DATE_TYPES[type], key = type === 'first' ? FIRST_DATES[id].place : venue || (venuesOf(T, id)[0] || {}).key, appt = book({ id, type, venue: key, t: G.state.t + 6 }); if (!appt) return null;
  const x = dest(key, id); if (x.room) await G.go('int:' + x.room); else await G.go('city', { x: x.x - 2, y: x.y + 2.5 }); return appt;
}
export function init() {
  HOOK.bookDate = book; HOOK.dateTypes = typesFor; HOOK.dateTimes = timesFor; HOOK.repair = repair;
  G.on('appt:missed', a => safe(() => missed(a)));
  G.on('appt:remove', a => { const d = a && st().dates[a.id]; if (d && !d.done) { delete st().dates[a.id]; safe(() => G.social.place(d.id)); } });
  G.on('myday:add', x => { const p = x && x.idea && x.idea.pinId; if (!p) return; const s = st(), id = Object.keys(s.ro).find(k => s.ro[k].owePin === p); if (!id) return; delete s.ro[id].owePin; if (x.apptId && x.apptId !== true) safe(() => G.planner.remove(x.apptId)); setTimeout(() => repair(id), 500); });
  const unpin = r => { if (r.owePin) { safe(() => G.planner.remove(r.owePin)); delete r.owePin; } };
  HOOK.unpinRepair = unpin;
  G.on('social:talk', id => { const r = st().ro[id]; if (r && r.owe !== undefined && today() - r.owe >= 1) { delete r.owe; unpin(r); addWarmth(id, 2, 'scene'); } });
  G.on('social:gift', (id, it, kind) => { const r = st().ro[id]; if (r && r.owe !== undefined && kind === 'loved') { delete r.owe; unpin(r); addWarmth(id, 3, 'scene'); } });
}
export { UI, sleep, comp };
