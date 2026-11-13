// Planner: appointments, reminders and the city event calendar. UI: src/ui/phone_planner.js.
//
// State slice G.state.planner = { items: [appt], seq, ev: { 'eventId:day': 1 } (event reminders already sent), alarm: hour | null }
//   appt = { id, title, placeId?, t (abs game minute), dur (minutes), kind: 'story'|'friend'|'work'|'event'|'personal', withNpc?, data?,
//            remind (minutes before; 0 = none; default 30), s: 0 waiting | 1 reminded | 2 running | 3 kept | 4 missed, here? }
//
// G.planner
//   add({ title, placeId, t, dur = 60, kind = 'personal', withNpc, data, remind = 30 }) -> id
//   remove(id)    get(id)    update(id, patch)    done(id)  (mark as attended, e.g. by the jobs system when the player clocks in)
//   list(fromT = now, toT = from + 7 days, { events = true }) -> time-sorted appts; city events from data/calendar.js are included as
//        virtual entries { id: 'ev:<eventId>:<day>', kind: 'event', event: true, title, placeId, t, dur, data: { eventId, blurb } }
//   next() -> the next (or currently running) own appointment, or null         eventsOn(absDay) -> virtual event entries of that day
//   alarm() / setAlarm(hour | null)   wake-up alarm for the sleep activity (decimal hour)
// Events: 'appt:add'(a), 'appt:remove'(a), 'appt:soon'(a) `remind` minutes before, 'appt:start'(a), 'appt:done'(a) kept, 'appt:missed'(a)
//   "Kept" = the player was at the place (inside the room, or within 12 units of it in the city) at some point while it ran, or done(id)
//   was called; appointments without a place are always kept. All fired from the 'minutes' tick, so they also work across G.advance().
import { G } from '../core/game.js';
import { EVENTS, eventOnDay } from '../data/calendar.js';
import { CAST_BY_ID } from '../story/cast.js';
import * as TEXTS from '../story/texts.js';

export const order = 61;
const DAY = 1440;
let S = null;
const fresh = () => ({ items: [], seq: 0, ev: {}, alarm: null });
const clock = t => String(Math.floor((t % DAY) / 60)).padStart(2, '0') + ':' + String(Math.floor(t % 60)).padStart(2, '0');
const placeName = id => { const p = id && G.places && G.places.get ? G.places.get(id) : null; return p ? p.name : ''; };
const npcShort = id => { const c = CAST_BY_ID[id]; return c ? c.short || c.name : id; };

export function add(o) {
  if (!S || !o || typeof o.t !== 'number') return null;
  const a = { id: 'a' + (++S.seq), title: o.title || 'Appointment', placeId: o.placeId || null, t: Math.round(o.t), dur: o.dur || 60, kind: o.kind || 'personal', withNpc: o.withNpc || null, data: o.data || null, remind: o.remind === undefined ? 30 : o.remind, s: 0 };
  if (a.t <= G.state.t) a.s = 1; // already under way: no "soon" reminder
  S.items.push(a); S.items.sort((x, y) => x.t - y.t); G.emit('appt:add', a); return a.id;
}
export function get(id) { return (S && S.items.find(a => a.id === id)) || null; }
export function remove(id) { const i = S ? S.items.findIndex(a => a.id === id) : -1; if (i < 0) return false; const [a] = S.items.splice(i, 1); G.emit('appt:remove', a); return true; }
export function update(id, patch) { const a = get(id); if (!a) return null; Object.assign(a, patch); if (patch.t !== undefined) { a.s = a.t <= G.state.t ? 1 : 0; S.items.sort((x, y) => x.t - y.t); } return a; }
export function done(id) { const a = get(id); if (a) a.here = 1; return !!a; }
export function eventsOn(day) {
  const out = [];
  for (const e of EVENTS) { let on = false; try { on = eventOnDay(e, day); } catch (x) { on = false; } if (!on) continue; const h = e.hours || [9, 17], p = e.place || {};
    out.push({ id: `ev:${e.id}:${day}`, event: true, kind: 'event', title: e.name, placeId: p.venue || p.poi || null, district: p.district || null, t: day * DAY + h[0] * 60, dur: (h[1] - h[0]) * 60, data: { eventId: e.id, blurb: e.blurb, kind: e.kind }, s: 0 }); }
  return out;
}
export function list(fromT, toT, opts = {}) {
  if (!S) return []; if (fromT === undefined) fromT = G.state.t; if (toT === undefined) toT = fromT + 7 * DAY;
  const out = S.items.filter(a => a.t + a.dur > fromT && a.t < toT);
  if (opts.events !== false) for (let d = Math.floor(fromT / DAY); d <= Math.floor((toT - 1) / DAY); d++) for (const e of eventsOn(d)) if (e.t + e.dur > fromT && e.t < toT) out.push(e);
  return out.sort((a, b) => a.t - b.t);
}
export function next() { if (!S) return null; const t = G.state.t; return S.items.find(a => a.s < 3 && a.t + a.dur > t) || null; }
export const alarm = () => (S ? S.alarm : null);
export const setAlarm = h => { if (S) S.alarm = h === null || h === undefined ? null : ((+h % 24) + 24) % 24; };

function atPlace(a) {
  if (!a.placeId) return true; const sc = G.scene ? String(G.scene.id) : '';
  if (sc !== 'city') return sc === a.placeId || sc === 'int:' + a.placeId || sc.endsWith(':' + a.placeId) || sc.endsWith(a.placeId);
  const p = G.places && G.places.get ? G.places.get(a.placeId) : null; return !!p && Math.hypot(p.x - G.player.x, p.y - G.player.y) < 12;
}
const say = (a, lead) => `${lead}${a.title}${a.placeId && placeName(a.placeId) && !a.title.includes(placeName(a.placeId)) ? ' at ' + placeName(a.placeId) : ''}`;
const note = (a, text, pri) => { if (G.phone && G.phone.notify) G.phone.notify({ type: a.kind === 'work' ? 'shift_reminder' : 'appointment_reminder', app: a.kind === 'work' ? 'jobs' : 'planner', title: a.kind === 'work' ? 'Work' : 'Planner', text, icon: a.kind === 'work' ? 'ui.clock' : 'ui.calendar', priority: pri, data: { appt: a.id } }); };

function tick() {
  const t = G.state.t;
  for (const a of S.items.slice()) {
    if (a.s === 0 && a.remind > 0 && t >= a.t - a.remind && t < a.t) { a.s = 1; G.emit('appt:soon', a); note(a, say(a, `In ${Math.max(1, Math.round(a.t - t))} min: `) + ` (${clock(a.t)})`); }
    if (a.s < 2 && t >= a.t) { a.s = 2; a.here = a.here || (atPlace(a) ? 1 : 0); G.emit('appt:start', a); if (t < a.t + a.dur && !(a.here && a.placeId)) note(a, say(a, 'Starting now: ')); }
    if (a.s === 2) {
      if (!a.here && atPlace(a)) a.here = 1;
      if (t >= a.t + a.dur) {
        if (a.here) { a.s = 3; G.emit('appt:done', a); }
        else { a.s = 4; G.emit('appt:missed', a);
          if (a.withNpc && a.kind !== 'work' && !(G.social && G.social.onMissed) && G.messages) { const L = (TEXTS.INVITE_REPLIES && TEXTS.INVITE_REPLIES.npcStoodUp) || ['Missed you today! Rain check?']; G.messages.send({ from: a.withNpc, text: L[a.t % L.length], delay: 5 }); }
          else if (a.kind !== 'work') note(a, `You missed: ${a.title}. No harm done.`, 'low'); }
      }
    }
  }
  // tidy: forget finished entries after two days
  if (S.items.length && S.items[0].t + S.items[0].dur < t - 2 * DAY) S.items = S.items.filter(a => a.t + a.dur >= t - 2 * DAY);
}
function hourly() {
  const t = G.state.t, day = Math.floor(t / DAY), hf = (t - day * DAY) / 60;
  for (const k in S.ev) if (+k.split(':').pop() < day) delete S.ev[k];
  for (const e of EVENTS) {
    let on = false; try { on = eventOnDay(e, day); } catch (x) { on = false; } if (!on) continue; const key = e.id + ':' + day, h = e.hours || [9, 17]; if (S.ev[key]) continue;
    if (hf >= Math.max(6, h[0] - (e.notify || 2)) && hf < h[1]) { S.ev[key] = 1; const p = e.place || {}, where = placeName(p.venue || p.poi);
      if (G.phone && G.phone.notify) G.phone.notify({ type: 'event_today', app: 'planner', title: 'Today in Maple Bay', text: `${e.name}, ${clock(h[0] * 60)}-${clock(h[1] * 60)}${where ? ', ' + where : ''}`, icon: 'ui.star', data: { day } }); }
  }
  if (Math.floor(hf) === 6 && G.weather && G.weather.daySummary && G.phone) { let w = null; try { w = G.weather.daySummary(0); } catch (x) { w = null; }
    if (w && ['rain', 'storm', 'snow'].includes(w.kind)) G.phone.notify({ type: 'weather_alert', app: 'planner', title: 'Weather', text: { rain: 'Rain today. Umbrella weather!', storm: 'Storms today. Maybe a movie?', snow: 'Snow today. Wrap up warm!' }[w.kind], icon: 'weather.' + w.kind }); }
}

export function init() {
  S = G.defineState('planner', fresh);
  G.on('load', () => { S = G.state.planner || (G.state.planner = fresh()); S.items = S.items || []; S.ev = S.ev || {}; });
  G.on('minutes', tick); G.on('hour', hourly);
  G.planner = { add, remove, get, update, done, list, next, eventsOn, alarm, setAlarm, npcShort };
}
