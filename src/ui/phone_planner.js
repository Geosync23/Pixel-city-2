// Phone app: Planner (Today timeline + forecast, two-week calendar, "plan something" flow). Data/API: src/sim/planner.js (G.planner).
// ctx.arg: { appt: id } opens that entry, { day: absDay } selects a day in the calendar, { add: true, withNpc?, placeId? } starts the add flow.
import { G } from '../core/game.js';
import * as TEXTS from '../story/texts.js';
import { el, iconEl, row, empty, tabs, btn, card, chip, section, kv, portrait, npcName, when, hhmm, dur, dayOf, DAY, WEEKDAYS, timeInfo, place, placeName, destinations, openState, weatherIcon, safe, cap } from './phone_util.js';
import { contacts, tier } from './phone_messages.js';

let tab = 'today', selDay = null;
/* a city event you already planned (from the event's "Plan to go", Wander's "Add to planner", Showtime ...) shows once: your own entry, not the automatic event row as well */
const sameEvent = (e, a) => !a.event && ((a.data && ((a.data.eventId && a.data.eventId === (e.data || {}).eventId) || (a.data.guide && String(a.data.guide).indexOf((e.data || {}).eventId) >= 0)))
  || (String(a.title).toLowerCase() === String(e.title).toLowerCase() && dayOf(a.t) === dayOf(e.t)));
const dedupe = L => L.filter(e => !e.event || !L.some(a => sameEvent(e, a)));
const P = () => G.planner;
const KIND = { story: 'Story', friend: 'With a friend', work: 'Work shift', event: 'City event', personal: 'Personal' };
const KICON = { story: 'ui.heart', friend: 'rel.friend', work: 'ui.clock', event: 'ui.star', personal: 'ui.calendar' };
export const IDEAS = [
  { id: 'gym', title: 'Gym session', icon: 'skill.fitness', places: ['gym'], dur: 60, hour: 18 },
  { id: 'movie', title: 'Movie night', icon: 'need.fun', places: ['cinema'], dur: 120, hour: 19 },
  { id: 'dinner', title: 'Dinner out', icon: 'need.hunger', places: ['diner', 'ramen', 'pizza', 'restaurant'], dur: 75, hour: 19 },
  { id: 'coffee', title: 'Coffee catch-up', icon: 'need.social', places: ['cafe', 'bakery'], dur: 45, hour: 10 },
  { id: 'walk', title: 'Park walk', icon: 'transport.walk', places: ['poi_park_loop', 'poi_duck_pond', 'poi_riverside_path', 'poi_lookout'], dur: 45, hour: 16 },
  { id: 'study', title: 'Study session', icon: 'skill.logic', places: ['library'], dur: 90, hour: 14 },
  { id: 'music', title: 'Live music', icon: 'ui.star', places: ['bar'], dur: 120, hour: 20 },
  { id: 'shop', title: 'Shopping trip', icon: 'ui.cart', places: ['grocery', 'clothing', 'homegoods', 'bookstore', 'market_stalls'], dur: 45, hour: 11 },
  { id: 'wheel', title: 'Harbor outing', icon: 'ui.sparkle', places: ['poi_ferris_wheel', 'poi_pier', 'poi_lighthouse'], dur: 60, hour: 17 },
  { id: 'family', title: 'Visit family', icon: 'rel.family', places: ['home:sibling', 'home:grandma'], dur: 90, hour: 17 },
  { id: 'custom', title: 'Something else', icon: 'ui.plus', places: [], dur: 60, hour: 12 },
];

const span = a => `${hhmm((a.t % DAY) / 60)} - ${hhmm(((a.t + a.dur) % DAY) / 60)}`;
function entryRow(a, ctx) {
  const now = G.state.t, cls = 'ph-agenda.' + a.kind + (a.t <= now && a.t + a.dur > now ? '.now' : a.t + a.dur <= now ? '.gone' : '');
  const sub = [a.placeId ? placeName(a.placeId) : a.district ? cap(a.district) : '', a.withNpc ? 'with ' + npcName(a.withNpc) : '', a.s === 4 ? 'missed' : a.s === 3 ? 'done' : ''].filter(Boolean).join(' · ');
  return row({ icon: KICON[a.kind] || 'ui.calendar', title: a.title, sub: sub || KIND[a.kind], right: el('span.ph-row-r', null, hhmm((a.t % DAY) / 60), el('br'), el('small', { text: dur(a.dur) })), cls, onclick: () => ctx.push(a.title, detail(a)) });
}
function detail(a) {
  return (b, ctx) => {
    const p = a.placeId ? place(a.placeId) : null, os = p ? openState(p, a.t) : null;
    b.append(el('div.ph-hero', null, iconEl(KICON[a.kind] || 'ui.calendar', 3), el('div', null, el('b', { text: a.title, style: { fontSize: '17px' } }), el('small', { text: KIND[a.kind] || '' }))));
    const c = card(kv('When', when(a.t)), kv('Until', hhmm(((a.t + a.dur) % DAY) / 60) + ` (${dur(a.dur)})`));
    if (a.placeId) c.append(kv('Where', placeName(a.placeId))); if (os && os.open !== null) c.append(kv('At that time', os.open ? 'Open' : 'Closed'));
    if (a.withNpc) c.append(kv('With', npcName(a.withNpc))); if (!a.event) c.append(kv('Reminder', a.remind ? `${a.remind} min before` : 'Off'));
    b.append(c); if (a.data && a.data.blurb) b.append(card(el('p', { text: a.data.blurb })));
    if (p) b.append(el('div.ph-btns', null, btn('Show on map', () => ctx.open('map', { place: p.id }), '', 'ui.pin'), G.phone.isUnlocked('taxi') ? btn('Cab there', () => ctx.open('taxi', { place: p.id }), '', 'transport.taxi') : null));
    const mine = a.event ? safe(() => P().list(dayOf(a.t) * DAY, (dayOf(a.t) + 1) * DAY, { events: false }).find(q => sameEvent(a, q)), null) : null;
    if (mine) b.append(btn('In your Planner: ' + hhmm((mine.t % DAY) / 60) + ' - open it', () => ctx.push(mine.title, detail(mine)), 'wide', 'ui.check'));
    else if (a.event) b.append(btn('Plan to go', () => ctx.push('Plan something', form({ title: a.title, places: a.placeId ? [a.placeId] : [], dur: Math.min(120, a.dur), kind: 'personal', t: Math.max(a.t, G.state.t + 30) })), 'pri wide', 'ui.plus'));
    else b.append(btn('Remove from Planner', () => { P().remove(a.id); ctx.back(); ctx.tip('Removed.'); }, 'wide', 'ui.cross'));
  };
}

/* ---------- add flow ---------- */
function ideasView(pre) {
  return (b, ctx) => {
    b.append(el('p', { text: pre.withNpc ? `What would you like to do with ${npcName(pre.withNpc)}?` : 'Pick a fun thing to do. You can invite a friend along.' }));
    b.append(el('div.ph-ideas', null, IDEAS.map(i => el('button', { onclick: () => ctx.push(i.title, form(Object.assign({}, i, pre, { title: i.id === 'custom' && pre.withNpc ? `Meet ${npcName(pre.withNpc)}` : i.title, custom: i.id === 'custom' }))) }, iconEl(i.icon, 2), el('span', { text: i.title })))));
  };
}
function form(o) {
  const now = G.state.t, today = dayOf(now), cands = (o.places || []).filter(id => place(id));
  const f = { title: o.title, placeId: o.placeId || cands[0] || null, day: o.day !== undefined && o.day >= today ? o.day : today, hour: o.hour || 12, dur: o.dur || 60, withNpc: o.withNpc || null, remind: 30 };
  if (o.t) { f.day = dayOf(o.t); f.hour = Math.ceil((o.t % DAY) / 30) / 2; }
  else if (f.day === today && f.hour * 60 <= (now % DAY) + 30) { f.hour = Math.ceil(((now % DAY) + 45) / 30) / 2; if (f.hour >= 23.5) { f.day++; f.hour = o.hour || 12; } }
  return (b, ctx) => {
    const re = () => ctx.refresh(), t = () => f.day * DAY + Math.round(f.hour * 60);
    if (o.custom) b.append(section('What'), el('input.ph-input', { value: f.title, maxlength: 28, 'aria-label': 'Title', oninput: e => { f.title = e.target.value; } }));
    b.append(section('Where'));
    const pl = el('div.ph-chips'); for (const id of cands.includes(f.placeId) || !f.placeId ? cands : [f.placeId, ...cands]) pl.append(chip(placeName(id), f.placeId === id ? 'on' : '', () => { f.placeId = id; re(); }));
    pl.append(chip(cands.length ? 'Other...' : f.placeId ? 'Change...' : 'Pick a place...', '', () => ctx.push('Pick a place', (bb, c2) => {
      const ds = destinations(); if (!ds.length) return bb.append(empty('ui.pin', 'No known places yet', 'Walk around town to discover places.'));
      bb.append(row({ icon: 'ui.cross', title: 'No particular place', onclick: () => { f.placeId = null; c2.back(); } }));
      for (const p of ds) bb.append(row({ icon: 'ui.pin', title: p.name, sub: p.districtName || '', onclick: () => { f.placeId = p.id; c2.back(); } }));
    })));
    b.append(pl);
    const p = f.placeId ? place(f.placeId) : null, os = p ? openState(p, t()) : null;
    b.append(section('Day')); b.append(el('div.ph-chips', null, [0, 1, 2, 3, 4, 5, 6].map(i => chip(i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : WEEKDAYS[(today + i) % 7], f.day === today + i ? 'on' : '', () => { f.day = today + i; re(); }))));
    b.append(section('Time', os && os.open !== null ? chip(os.open ? 'Open then' : 'Closed then', os.open ? 'good' : 'bad') : null));
    b.append(el('div.ph-step', null, el('button', { text: '-', 'aria-label': 'Earlier', onclick: () => { f.hour = (f.hour + 23.5) % 24; re(); } }), el('b', { text: hhmm(f.hour) }), el('button', { text: '+', 'aria-label': 'Later', onclick: () => { f.hour = (f.hour + .5) % 24; re(); } })));
    b.append(el('div.ph-chips', null, [30, 60, 90, 120, 180].map(m => chip(dur(m), f.dur === m ? 'on' : '', () => { f.dur = m; re(); }))));
    const cs = contacts().slice(0, 8);
    if (cs.length) { b.append(section('Invite')); b.append(el('div.ph-chips', null, chip('Just me', !f.withNpc ? 'on' : '', () => { f.withNpc = null; re(); }), cs.map(id => el('button.ph-chip' + (f.withNpc === id ? '.on' : ''), { onclick: () => { f.withNpc = id; re(); } }, portrait(id, 24), npcName(id))))); }
    b.append(section('Reminder')); b.append(el('div.ph-chips', null, [[0, 'None'], [15, '15 min'], [30, '30 min'], [60, '1 hour']].map(([m, l]) => chip(l, f.remind === m ? 'on' : '', () => { f.remind = m; re(); }))));
    const bad = t() <= G.state.t;
    ctx.foot.append(el('div.ph-kv', null, el('span', { text: f.title || 'Appointment' }), el('b', { text: bad ? 'That time has passed' : when(t()) })),
      btn('Add to Planner', () => {
        if (bad) return ctx.tip('Pick a time in the future.');
        const title = (f.title || 'Appointment').trim() || 'Appointment', id = P().add({ title, placeId: f.placeId, t: t(), dur: f.dur, kind: f.withNpc ? 'friend' : 'personal', withNpc: f.withNpc, remind: f.remind });
        if (f.withNpc) invite(f.withNpc, P().get(id));
        selDay = f.day; tab = 'calendar'; ctx.open('planner', { day: f.day }); G.phone.tip(f.withNpc ? `Added. ${npcName(f.withNpc)} has been invited.` : 'Added to your Planner.');
      }, 'pri wide big', 'ui.check'));
  };
}
/** invite an NPC to an appointment: G.social.invite(npcId, { apptId, title, placeId, t, dur }) when the social system has it, else a friendly text exchange */
function invite(npc, a) {
  if (G.social && G.social.invite) return safe(() => G.social.invite(npc, { apptId: a.id, title: a.title, placeId: a.placeId, t: a.t, dur: a.dur }), 0);
  if (!G.messages) return;
  G.messages.sendMine(npc, `${a.title}${a.placeId ? ' at ' + placeName(a.placeId) : ''}, ${when(a.t)}. Want to come?`);
  const tr = tier(npc).id, A = (TEXTS.VISIT_REPLIES && TEXTS.VISIT_REPLIES.accept) || {}, L = A[tr] || A.friend || ['Sounds great. See you there!'];
  G.messages.send({ from: npc, text: L[Math.floor(a.t) % L.length], delay: 12 });
}

/* ---------- tabs ---------- */
function todayTab(b, ctx) {
  const now = G.state.t, d0 = dayOf(now) * DAY, W = G.weather;
  if (W && W.daySummary) { const fc = el('div.ph-fc'); for (let i = 0; i < 4; i++) { const s = safe(() => W.daySummary(i), null); if (!s) continue; fc.append(el('div', null, el('span', { text: i === 0 ? 'Today' : WEEKDAYS[(dayOf(now) + i) % 7] }), iconEl(weatherIcon(s.kind), 2), el('span', { text: `${s.hiC}° / ${s.loC}°` }), el('small', { text: s.name }))); } if (fc.children.length) b.append(card(fc)); }
  const items = dedupe(P().list(now - 1, d0 + DAY)).filter(a => a.t + a.dur > now);
  b.append(section(`Today · ${timeInfo(now).label}`, el('button.ph-link', { text: '+ Plan something', onclick: () => ctx.push('Plan something', ideasView({ day: dayOf(now) })) })));
  if (!items.length) b.append(empty('ui.calendar', 'A free day', 'Nothing on. Plan something fun, or just wander.'));
  for (const a of items) b.append(entryRow(a, ctx));
  const tm = dedupe(P().list(d0 + DAY, d0 + 2 * DAY)); if (tm.length) { b.append(section('Tomorrow')); for (const a of tm) b.append(entryRow(a, ctx)); }
  const al = P().alarm();
  b.append(section('Wake-up alarm'), el('div.ph-step', null, el('button', { text: '-', 'aria-label': 'Alarm earlier', onclick: () => { P().setAlarm((al === null ? 7.5 : al) - .5); ctx.refresh(); } }), el('b', { text: al === null ? 'Off' : hhmm(al) }),
    el('button', { text: '+', 'aria-label': 'Alarm later', onclick: () => { P().setAlarm((al === null ? 6.5 : al) + .5); ctx.refresh(); } }), el('button', { text: 'Off', disabled: al === null, onclick: () => { P().setAlarm(null); ctx.refresh(); } })));
}
function calendarTab(b, ctx) {
  const now = G.state.t, today = dayOf(now), start = today - (today % 7); if (selDay === null || selDay < start || selDay >= start + 14) selDay = today;
  const all = dedupe(P().list(start * DAY, (start + 14) * DAY)), grid = el('div.ph-week');
  for (const w of WEEKDAYS) grid.append(el('small', { text: w, style: { textAlign: 'center', fontWeight: 700 } }));
  for (let d = start; d < start + 14; d++) { const its = all.filter(a => dayOf(a.t) === d), i = timeInfo(d * DAY);
    grid.append(el('button.ph-day' + (d === today ? '.today' : d < today ? '.past' : '') + (d === selDay ? '.on' : ''), { 'aria-label': `${i.label}, ${its.length} entries`, onclick: () => { selDay = d; ctx.refresh(); } }, el('span', { text: i.dayOfMonth }), el('small', { text: i.seasonName.slice(0, 3) }), el('span.ph-dots', null, its.slice(0, 4).map(a => el('i.' + a.kind))))); }
  b.append(grid);
  const i = timeInfo(selDay * DAY), its = all.filter(a => dayOf(a.t) === selDay);
  b.append(section(selDay === today ? 'Today' : i.label, selDay >= today ? el('button.ph-link', { text: '+ Add', onclick: () => ctx.push('Plan something', ideasView({ day: selDay })) }) : null));
  if (!its.length) b.append(el('p.ph-note', { text: 'Nothing planned this day.' }));
  for (const a of its) b.append(entryRow(a, ctx));
}

export default {
  id: 'planner',
  badge: () => { const n = safe(() => P().next(), null); return n && n.t - G.state.t < 120 && n.s < 3 ? 1 : 0; },
  render(b, ctx) {
    if (!P()) return b.append(empty('ui.calendar', 'Planner is syncing', 'Your calendar will be here in a moment.'));
    const a = ctx.arg; if (a && !a._used) { a._used = 1;
      if (a.day !== undefined) { tab = 'calendar'; selDay = a.day; }
      if (a.add) return queueMicrotask(() => ctx.push('Plan something', a.placeId ? form({ title: 'Visit ' + placeName(a.placeId), places: [a.placeId], withNpc: a.withNpc, custom: true }) : ideasView({ withNpc: a.withNpc })));
      if (a.appt) { const x = P().get(a.appt); if (x) return queueMicrotask(() => ctx.push(x.title, detail(x))); } }
    b.append(tabs([{ id: 'today', name: 'Today' }, { id: 'calendar', name: 'Calendar' }], tab, t => { tab = t; ctx.refresh(); }));
    (tab === 'today' ? todayTab : calendarTab)(b, ctx);
  },
};
