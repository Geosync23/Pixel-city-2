// Planner: MY SCHEDULE (appointments, reminders) behind "My Day". Ideas engine: src/sim/myday.js. UI: src/ui/myday.js (HUD sheet) + src/ui/phone_planner.js (phone app).
//
// MY DAY RULES (owner msg 107, BIBLE 21.2): the schedule holds ONLY what the player chose plus what life puts there (work shifts, story / family, things they
//   booked: tickets, enrolled classes, deliveries, accepted invitations). City events are NOT on the schedule any more: list() leaves them out unless asked
//   ({ events: true }); they are Ideas (G.myDay.ideas()). A system that wants to SUGGEST something calls add({ ..., offer: true }) (or suggest(o)): it becomes a
//   pinned Idea (state `pins`), not an entry, until the player taps Add. Known auto-adds are converted the same way (AUTO below).
//
// State slice G.state.planner = { v: 2, items: [appt], pins: [pin], seq, ev: { 'eventId:day': 1 } (event reminders already sent), alarm: hour | null }
//   appt = { id, title, placeId?, t (abs game minute), dur (minutes), kind: 'story'|'friend'|'work'|'event'|'personal', withNpc?, data?,
//            remind (minutes before; 0 = none; default 30), s: 0 waiting | 1 reminded | 2 running | 3 kept | 4 missed, here?,
//            flex? (1 = "any time today": no clock time, no reminders, done the moment you arrive, lapses quietly at the end of the day), src? (see srcOf) }
//   pin  = { id: 'p<n>', pin: 1, title, placeId?, t, dur, kind, data? }   a suggestion from another system, shown first among the Ideas
//
// srcOf(a) -> 'work' | 'story' | 'family' | 'friend' | 'class' | 'delivery' | 'ticket' | 'mine'   why the entry is on the schedule (SRC_LABEL has the words);
//   isLife(a) -> true for everything the player did not pick from the Ideas / the add form themselves.
//
// G.planner
//   add({ title, placeId, t, dur = 60, kind = 'personal', withNpc, data, remind = 30 }) -> id
//   remove(id)    get(id)    update(id, patch)    done(id)  (mark as attended, e.g. by the jobs system when the player clocks in)
//   finish(id)    (QA11) it is over now: kept, its end moved to now, appt:done; the chip stops saying NOW
//   add({ ..., flex: true }) -> an "any time today" entry        add({ ..., offer: true }) / suggest(o) -> a pinned Idea (id 'p<n>'), see above
//   list(fromT = now, toT = from + 7 days, { events = false }) -> time-sorted appts. With { events: true } city events from data/calendar.js are included as
//        virtual entries { id: 'ev:<eventId>:<day>', kind: 'event', event: true, title, placeId, t, dur, data: { eventId, blurb } }
//   next() -> what to do next: the running / soon (90 min) timed entry, else the first "any time" entry, else the next timed one, or null
//   eventsOn(absDay) -> virtual event entries of that day        pins() -> pinned Ideas        conflicts(t, dur, exceptId?) -> timed entries that overlap
//   alarm() / setAlarm(hour | null)   wake-up alarm for the sleep activity (decimal hour)
// Events: 'appt:add'(a), 'appt:remove'(a), 'appt:leave'(a, travel) when it is time to set off (walk time + LEAD.buffer; a 'high' notification + an in-world banner), 'appt:soon'(a) `remind` minutes before, 'appt:start'(a), 'appt:done'(a) kept, 'appt:missed'(a)
//   "Kept" = the player was at the place (inside the room, or within 12 units of it in the city) at some point while it ran, or done(id)
//   was called; appointments without a place are always kept. All fired from the 'minutes' tick, so they also work across G.advance().
import { G } from '../core/game.js';
import { EVENTS, eventOnDay } from '../data/calendar.js';
import { CAST_BY_ID } from '../story/cast.js';
import * as TEXTS from '../story/texts.js';
import { toast } from '../ui/kit.js';
const safe = (f, d) => { try { const v = f(); return v === undefined ? d : v; } catch (e) { return d; } };

export const order = 61;
const DAY = 1440;
let S = null;
const fresh = () => ({ v: 2, items: [], pins: [], seq: 0, ev: {}, alarm: null });
const clock = t => String(Math.floor((t % DAY) / 60)).padStart(2, '0') + ':' + String(Math.floor(t % 60)).padStart(2, '0');
const placeName = id => { const p = id && G.places && G.places.get ? G.places.get(id) : null; return p ? p.name : ''; };
const npcShort = id => { const c = CAST_BY_ID[id]; return c ? c.short || c.name : id; };

/* known automatic adds from other systems: they become pinned Ideas instead of entries (the player adds them with one tap) */
const AUTO = o => !!(o && (o.offer || (o.data && o.data.aquaRelease)));
const famNpc = id => { try { return !!(id && G.social && G.social.isFamily && G.social.isFamily(id)); } catch (e) { return false; } };
export const SRC_LABEL = { work: 'Work', story: 'Family', family: 'Family', friend: 'With a friend', class: 'Class', delivery: 'Delivery', ticket: 'Booked', mine: 'You added' };
export function srcOf(a) {
  if (!a) return 'mine'; if (a.src) return a.src; const d = a.data || {};
  if (a.kind === 'work') return 'work'; if (a.kind === 'story' || d.beat || d.chapter) return 'story'; if (d.recur) return 'family';
  if (d.idea) return 'mine'; if (a.withNpc) return famNpc(a.withNpc) ? 'family' : 'friend';
  if (d.uni) return 'class'; if (d.ship) return 'delivery'; if (d.show || d.nat || /^(Basketball|Concert|Show|Planetarium): /.test(a.title || '') || /wedding/i.test(a.title || '')) return 'ticket';
  return 'mine';
}
export const isLife = a => srcOf(a) !== 'mine';
const endOfDay = t => { const d = Math.floor(t / DAY), m = t - d * DAY; return (d + 1) * DAY + (m >= 21 * 60 ? 180 : 0); };   /* an "any time" entry added late at night runs into the small hours */
export function suggest(o) {
  if (!S || !o) return null; const p = { id: 'p' + (++S.seq), pin: 1, title: o.title || 'Idea', placeId: o.placeId || null, t: Math.round(typeof o.t === 'number' ? o.t : G.state.t), dur: o.dur || 60, kind: o.kind || 'personal', data: o.data || null };
  S.pins.push(p); G.emit('appt:pin', p); return p.id;
}
export function add(o) {
  if (!S || !o) return null; if (AUTO(o) && !o.chosen) return suggest(o);
  if (o.flex) o = Object.assign({}, o, { t: Math.round(G.state.t), dur: Math.max(60, endOfDay(G.state.t) - Math.round(G.state.t)), remind: 0 });
  if (typeof o.t !== 'number') return null;
  const a = { id: 'a' + (++S.seq), title: o.title || 'Appointment', placeId: o.placeId || null, t: Math.round(o.t), dur: o.dur || 60, kind: o.kind || 'personal', withNpc: o.withNpc || null, data: o.data || null, remind: o.remind === undefined ? 30 : o.remind, s: 0 };
  if (o.flex) { a.flex = 1; a.lv = 1; } if (o.src) a.src = o.src;
  if (a.t <= G.state.t) a.s = 1; // already under way: no "soon" reminder
  S.items.push(a); S.items.sort((x, y) => x.t - y.t); G.emit('appt:add', a); return a.id;
}
export const pins = () => (S ? S.pins.slice() : []);
const pinAt = id => (S && typeof id === 'string' && id[0] === 'p' ? S.pins.findIndex(p => p.id === id) : -1);
export function get(id) { return (S && (S.items.find(a => a.id === id) || S.pins[pinAt(id)])) || null; }
export function remove(id) { const j = pinAt(id); if (j >= 0) { const [p] = S.pins.splice(j, 1); G.emit('appt:unpin', p); return true; }
  const i = S ? S.items.findIndex(a => a.id === id) : -1; if (i < 0) return false; const [a] = S.items.splice(i, 1); G.emit('appt:remove', a); return true; }
export function update(id, patch) { const a = get(id); if (!a) return null; Object.assign(a, patch); if (a.pin) return a; if (patch.t !== undefined) { if (a.flex) { delete a.flex; delete a.lv; delete a.lc; } a.s = a.t <= G.state.t ? 1 : 0; S.items.sort((x, y) => x.t - y.t); G.emit('appt:change', a); } return a; }
export function done(id) { const a = get(id); if (a && a.pin) return remove(id); if (a) a.here = 1; return !!a; }
/** timed entries (not "any time" ones) that overlap [t, t + dur) */
/** QA11 (add-only): the thing is over now (a shift ended early, a class finished or was credited): kept, and it stops being "NOW" on the chip */
export function finish(id) { const a = get(id); if (!a || a.pin) return false; a.here = 1; if (a.s >= 3) return true; const t = G.state.t; if (t < a.t + a.dur) a.dur = Math.max(1, Math.ceil(t - a.t)); a.s = 3; G.emit('appt:done', a); return true; }
export function conflicts(t, dur, except) { return S ? S.items.filter(a => !a.flex && a.id !== except && a.s < 3 && a.t < t + dur && a.t + a.dur > t) : []; }
export function eventsOn(day) {
  const out = [];
  for (const e of EVENTS) { let on = false; try { on = eventOnDay(e, day); } catch (x) { on = false; } if (!on) continue; const h = e.hours || [9, 17], p = e.place || {};
    out.push({ id: `ev:${e.id}:${day}`, event: true, kind: 'event', title: e.name, placeId: p.venue || p.poi || null, district: p.district || null, t: day * DAY + h[0] * 60, dur: (h[1] - h[0]) * 60, data: { eventId: e.id, blurb: e.blurb, kind: e.kind }, s: 0 }); }
  return out;
}
export function list(fromT, toT, opts = {}) {
  if (!S) return []; if (fromT === undefined) fromT = G.state.t; if (toT === undefined) toT = fromT + 7 * DAY;
  const out = S.items.filter(a => a.t + a.dur > fromT && a.t < toT);
  if (opts.events === true) for (let d = Math.floor(fromT / DAY); d <= Math.floor((toT - 1) / DAY); d++) for (const e of eventsOn(d)) if (e.t + e.dur > fromT && e.t < toT) out.push(e);
  return out.sort((a, b) => a.t - b.t);
}
export function next() {
  if (!S) return null; const t = G.state.t, L = S.items.filter(a => a.s < 3 && a.t + a.dur > t), timed = L.find(a => !a.flex);
  if (timed && timed.t - t <= 90) return timed;
  return L.find(a => a.flex) || timed || null;
}
export const alarm = () => (S ? S.alarm : null);
export const setAlarm = h => { if (S) S.alarm = h === null || h === undefined ? null : ((+h % 24) + 24) % 24; };

const posOf = a => (a && !a.placeId && a.data && a.data.pos && isFinite(a.data.pos.x) ? a.data.pos : null);   /* an entry at a spot that is not a registered place (a coach in the park) */
function atPlace(a) {
  const q = posOf(a); if (q) return !!(G.scene && G.scene.id === 'city' && Math.hypot(q.x - G.player.x, q.y - G.player.y) < 12);
  if (!a.placeId) return true; const sc = G.scene ? String(G.scene.id) : '';
  if (sc !== 'city') return sc === a.placeId || sc === 'int:' + a.placeId || sc.endsWith(':' + a.placeId) || sc.endsWith(a.placeId);
  const p = G.places && G.places.get ? G.places.get(a.placeId) : null; return !!p && Math.hypot(p.x - G.player.x, p.y - G.player.y) < 12;
}
const say = (a, lead) => `${lead}${a.title}${a.placeId && placeName(a.placeId) && !a.title.includes(placeName(a.placeId)) ? ' at ' + placeName(a.placeId) : ''}`;
// Every planner notification opens that item in the Planner when tapped (data.appt -> phone_planner.js detail view), work shifts included (owner msg 99).
// `head` is the bold first line ("Leave now", "In 30 min", "Starting now"); 'high' priority banners stay until tapped or dismissed.
const note = (a, text, pri, head) => { if (G.phone && G.phone.notify) G.phone.notify({ app: 'planner', title: head ? 'My Day · ' + head : a.kind === 'work' ? 'My Day · Work' : 'My Day', text, icon: a.kind === 'work' ? 'ui.clock' : 'ui.calendar', priority: pri, data: { appt: a.id } }); };
/* ---------- lead time: "leave now so you get there on time" ---------- */
export const LEAD = { buffer: 10, recheck: 5, horizon: 240 };   // minutes: spare time on top of the trip; how often the trip is re-estimated; how far ahead we look
/** best travel estimate to an appointment's place from where the player is now: { walk, best, mode } in game minutes, or null when there is no place / already there */
export function travelTo(a) {
  if (!a || !(a.placeId || posOf(a)) || atPlace(a)) return null; const p = posOf(a) || (G.places && G.places.get ? G.places.get(a.placeId) : null); if (!p) return null;
  let o = []; try { o = (G.nav && G.nav.routeTo && G.nav.routeTo(p)) || []; } catch (e) { o = []; }
  if (!o.length) { const c = (G.state.phone && G.state.phone.cityPos) || G.player, d = Math.abs(p.x - c.x) + Math.abs(p.y - c.y); return { walk: Math.round(d / 3.1) + 2, best: Math.round(d / 3.1) + 2, mode: 'walk' }; }
  const w = o.find(x => x.mode === 'walk'), b = o.slice().sort((x, y) => x.minutes - y.minutes)[0];
  return { walk: w ? w.minutes : b.minutes, best: b.minutes, mode: b.mode };
}
/* really there (for entries that are done on arrival): inside the place, or within a few steps of an outdoor spot */
function arrived(a) { if (!G.scene || G.scene.id !== 'city') return atPlace(a); const p = posOf(a) || (G.places && G.places.get ? G.places.get(a.placeId) : null); return !!p && Math.hypot(p.x - G.player.x, p.y - G.player.y) < (p.kind === 'venue' || p.kind === 'home' ? 0 : 7); }
function leadCheck(a, t) {
  if (a.lv || a.s >= 2 || t >= a.t || a.t - t > LEAD.horizon) return; if (a.lc !== undefined && t - a.lc < LEAD.recheck && a.t - t > 20) return; a.lc = t;
  { let tp = null; try { tp = G.nav && G.nav.trip && G.nav.trip(); } catch (e) { tp = null; } if (tp && tp.dest && a.placeId && tp.dest.id === a.placeId) { a.lv = 1; return; } }   /* QA14: already on a Map trip there (it said "Leave now ... 10 min on foot" to a player sitting on the train to work) */
  const tr = travelTo(a); if (!tr) return; const left = a.t - t;
  if (left > tr.walk + LEAD.buffer) return;   // still time to walk there
  a.lv = 1; const where = placeName(a.placeId) || (a.data && a.data.pos && a.data.pos.name) || 'there', late = left < tr.best;
  const how = tr.best < tr.walk ? `${tr.walk} min on foot, ${tr.best} by ${tr.mode}` : `${tr.walk} min on foot`;
  const text = late ? `${a.title} starts at ${clock(a.t)} and ${where} is ${how} away. Go now, you may be a little late.` : `${a.title} starts at ${clock(a.t)} (in ${Math.round(left)} min). ${where} is ${how} away.`;
  note(a, text, 'high', late ? 'Leave now, running late' : 'Leave now'); G.emit('appt:leave', a, tr);
  /* QA14: a fast leisure activity ("Linger a while, 2 h" runs 20 game min per real second) ran straight through "Leave now": 18 minutes were gone before a player could react. Stop it here (what it gave so far stays). */
  try { const b = G.busy; if (b && b.actId && !/^(sleep|nap)$/.test(b.actId) && !b.jobTask && !b.jobAuto && !safe(() => G.jobs.onShift(), false) && b.anim !== 'sleep' && b.canCancel !== false && !/^(wait|sleep|nap)/i.test(b.label || '') && (b.rate || 0) >= 4 && (b.left || 0) > 10)   /* only a leisure activity (sim/activities.js actId); never work, auto-work, sleep, a class or a wait for transport */ { G.endActivity(true); toast(`Time to go: ${a.title} at ${clock(a.t)}.`, 'info', 4200); } } catch (e) { /* no activity layer */ }
  try { if (G.navArrow && G.navArrow.banner) G.navArrow.banner(late ? 'Leave now, running late' : 'Time to leave', `${a.title} · ${clock(a.t)} · ${how}`, { ms: 8000, red: late }); } catch (e) { /* no banner layer */ }
}

function tick() {
  const t = G.state.t;
  if ((G.chapters && G.chapters.active && G.chapters.active()) || (G.rel && G.rel.active && G.rel.active())) return;   /* QA11: and not over a relationship scene */   /* Chapters part 2: no 'Starting now' / 'Leave now' banners over a Chapter scene; they catch up when it ends */
  for (const a of S.items.slice()) {
    leadCheck(a, t);
    if (a.s === 0 && a.remind > 0 && t >= a.t - a.remind && t < a.t) { a.s = 1; G.emit('appt:soon', a); const m = Math.max(1, Math.round(a.t - t)); note(a, say(a, '') + ` at ${clock(a.t)}.` + (atPlace(a) && a.placeId ? ' You are already there.' : ''), 'normal', `In ${m} min`); }
    if (a.s < 2 && t >= a.t) { a.s = 2; a.here = a.here || (atPlace(a) && (a.placeId || posOf(a)) && !a.flex ? 1 : 0); G.emit('appt:start', a); if (!a.flex && t < a.t + a.dur && !(a.here && (a.placeId || posOf(a)))) {   /* QA11: also not for an entry at a spot you are standing on (Dez at the plaza) */ note(a, say(a, '') + ' has started.', 'high', 'Starting now'); try { if (G.navArrow && G.navArrow.banner) G.navArrow.banner('Starting now', say(a, ''), { ms: 7000 }); } catch (e) { /* no banner layer */ } } }
    if (a.s === 2) {
      if (!a.here && atPlace(a) && (a.placeId || posOf(a) || !a.flex)) a.here = 1;
      /* something the player picked from the Ideas is done the moment they get there (no need to wait the hour out) */
      if (a.here && (a.placeId || posOf(a)) && arrived(a) && !a.withNpc && (a.flex || (a.data && a.data.idea))) { a.s = 3; a.arr = 1; G.emit('appt:done', a); continue; }
      if (t >= a.t + a.dur) {
        if (a.here) { a.s = 3; G.emit('appt:done', a); }
        else { a.s = 4; G.emit('appt:missed', a);
          if (a.flex || (a.data && a.data.idea && !a.withNpc)) { /* your own idea, not taken up: it just lapses, no notice */ }
          else if (a.withNpc && a.kind !== 'work' && !(G.social && G.social.onMissed) && G.messages) { const L = (TEXTS.INVITE_REPLIES && TEXTS.INVITE_REPLIES.npcStoodUp) || ['Missed you today! Rain check?']; G.messages.send({ from: a.withNpc, text: L[a.t % L.length], delay: 5 }); }
          else if (a.kind !== 'work' && !(a.data && a.data.relDate)) note(a, `You missed: ${a.title}. No harm done.`, 'low'); }   /* QA12: a missed date is not "no harm done" (warmth -4, their own text, a "Make it up" Idea) */
      }
    }
  }
  if (S.pins.length && S.pins.some(p => p.t + p.dur < t - DAY)) S.pins = S.pins.filter(p => p.t + p.dur >= t - DAY);
  // tidy: forget finished entries after two days
  if (S.items.length && S.items[0].t + S.items[0].dur < t - 2 * DAY) S.items = S.items.filter(a => a.t + a.dur >= t - 2 * DAY);
}
function hourly() {
  const t = G.state.t, day = Math.floor(t / DAY), hf = (t - day * DAY) / 60;
  for (const k in S.ev) if (+k.split(':').pop() < day) delete S.ev[k];
  for (const e of EVENTS) {
    let on = false; try { on = eventOnDay(e, day); } catch (x) { on = false; } if (!on) continue; const key = e.id + ':' + day, h = e.hours || [9, 17]; if (S.ev[key]) continue;
    if (hf >= Math.max(6, h[0] - (e.notify || 2)) && hf < h[1]) { S.ev[key] = 1; const p = e.place || {}, where = placeName(p.venue || p.poi);
      if (G.myDay && G.myDay.ideas) continue;   /* My Day's morning summary and its one evening idea speak for the calendar now (fewer notices) */
      if (G.phone && G.phone.notify) G.phone.notify({ type: 'event_today', app: 'planner', title: 'Today in Maple Bay', text: `${e.name}, ${clock(h[0] * 60)}-${clock(h[1] * 60)}${where ? ', ' + where : ''}`, icon: 'ui.star', data: { day } }); }
  }
  if (Math.floor(hf) === 6 && G.weather && G.weather.daySummary && G.phone && !(G.myDay && G.myDay.ideas)) { let w = null; try { w = G.weather.daySummary(0); } catch (x) { w = null; }
    if (w && ['rain', 'storm', 'snow'].includes(w.kind)) G.phone.notify({ type: 'weather_alert', app: 'planner', title: 'Weather', text: { rain: 'Rain today. Umbrella weather!', storm: 'Storms today. Maybe a movie?', snow: 'Snow today. Wrap up warm!' }[w.kind], icon: 'weather.' + w.kind }); }
}

/* old saves (v < 2): entries another system added by itself and the player has not acted on become pinned Ideas; everything else stays where it was */
function migrate() {
  if (S.v >= 2) return; S.v = 2;
  for (const a of S.items.slice()) if (AUTO(a) && a.s < 2 && !a.here) { S.items.splice(S.items.indexOf(a), 1); S.pins.push({ id: 'p' + (++S.seq), pin: 1, title: a.title, placeId: a.placeId, t: a.t, dur: a.dur, kind: a.kind, data: a.data }); }
}

export function init() {
  S = G.defineState('planner', fresh);
  S.pins = S.pins || [];
  G.on('load', () => { S = G.state.planner || (G.state.planner = fresh()); S.items = S.items || []; S.ev = S.ev || {}; S.pins = S.pins || []; migrate(); });
  G.on('minutes', tick); G.on('hour', hourly);
  G.planner = { add, suggest, remove, get, update, done, finish, list, next, eventsOn, pins, conflicts, srcOf, isLife, SRC_LABEL, alarm, setAlarm, npcShort, travelTo, atPlace, LEAD };
}
