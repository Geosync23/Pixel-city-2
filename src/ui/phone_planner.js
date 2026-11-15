// Phone app "My Day" (app id stays 'planner'): the full view of the same data as the HUD sheet (src/ui/myday.js). Data/API: src/sim/planner.js (G.planner) + src/sim/myday.js (G.myDay).
//   MY SCHEDULE  what is on your day: Next, a Today / Tomorrow timeline with a now-line and the free gaps ("2 h free: ideas for this gap"), "any time" entries, the alarm.
//   IDEAS        everything you could add, ranked (G.myDay.ideas), for today, another day or one gap; each with Add / Not interested; tap one for the details and a time.
//   WEEK         the next seven days, one readable card each; tap a day for its timeline.
// Nothing is on the schedule unless the player added it or life put it there (work, family / story, tickets, classes, deliveries): city events are Ideas now.
// ctx.arg: { appt: id } opens that entry, { day: absDay } that day's timeline, { add: true, withNpc?, placeId? } the "plan your own" form,
//          { tab: 'sched' | 'ideas' | 'week' }, { idea: id } an idea's page, { gap: { from, to } } ideas for that stretch, { myday: 1 } (from My Day notifications).
import { G } from '../core/game.js';
import * as TEXTS from '../story/texts.js';
import { el, iconEl, row, empty, tabs, btn, card, chip, section, kv, portrait, npcName, when, hhmm, dur, dayOf, DAY, WEEKDAYS, timeInfo, place, placeName, destinations, openState, weatherIcon, safe, cap } from './phone_util.js';
import { contacts, tier } from './phone_messages.js';
import { defaultTime } from '../sim/myday.js';

let tab = 'sched', selDay = null, schedDay = 0, ideaDay = null, ideaGap = null;
const P = () => G.planner, MD = () => G.myDay;
const KIND = { story: 'Family', friend: 'With a friend', work: 'Work shift', event: 'You added', personal: 'You added' };
const KICON = { story: 'ui.heart', friend: 'rel.friend', work: 'ui.clock', event: 'ui.star', personal: 'ui.calendar' };
const srcLabel = a => safe(() => P().SRC_LABEL[P().srcOf(a)], KIND[a.kind] || ''), srcOf = a => safe(() => P().srcOf(a), 'mine');
const hm = t => hhmm((((t % DAY) + DAY) % DAY) / 60);
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

const span = a => (a.flex ? 'Any time today' : `${hm(a.t)} - ${hm(a.t + a.dur)}`);
function entryRow(a, ctx) {
  const now = G.state.t, cls = 'ph-agenda.' + a.kind + '.src-' + srcOf(a) + (a.s === 3 || a.s === 4 || a.t + a.dur <= now ? '.gone' : a.t <= now && !a.flex ? '.now' : '');
  const where = a.placeId ? placeName(a.placeId) : a.data && a.data.pos ? a.data.pos.name : '';
  const sub = [where && !String(a.title).includes(where) ? where : '', a.withNpc ? 'with ' + npcName(a.withNpc) : '', a.s === 4 ? 'missed' : a.s === 3 ? 'done' : srcLabel(a)].filter(Boolean).join(' · ');
  return row({ icon: KICON[a.kind] || 'ui.calendar', title: a.title, sub: sub || KIND[a.kind], right: a.flex ? el('span.ph-row-r', null, el('small', { text: 'any time' })) : el('span.ph-row-r', null, hm(a.t), el('br'), el('small', { text: dur(a.dur) })), cls, onclick: () => ctx.push(a.title, detail(a)) });
}
function detail(a) {
  return (b, ctx) => {
    const p = a.placeId ? place(a.placeId) : null, os = p && !a.flex ? openState(p, a.t) : null, src = srcOf(a), dest = p ? p.id : a.data && a.data.pos ? a.data.pos : null;
    b.append(el('div.ph-hero', null, iconEl(KICON[a.kind] || 'ui.calendar', 3), el('div', null, el('b', { text: a.title, style: { fontSize: '17px' } }), el('small', { text: srcLabel(a) }))));
    const c = a.flex ? card(kv('When', 'Any time today')) : card(kv('When', when(a.t)), kv('Until', hm(a.t + a.dur) + ` (${dur(a.dur)})`));
    if (a.placeId) c.append(kv('Where', placeName(a.placeId))); else if (a.data && a.data.pos) c.append(kv('Where', a.data.pos.name));
    { const tr = safe(() => P().travelTo(a), null), left = a.t - G.state.t; if (tr) c.append(kv('From here', (tr.best < tr.walk ? `${tr.walk} min on foot · ${tr.best} by ${tr.mode}` : `${tr.walk} min on foot`) + (!a.flex && left > 0 && left < 240 ? (left >= tr.walk + 10 ? ` · leave by ${hm(a.t - tr.walk - 10)}` : ' · leave now') : ''))); }
    if (os && os.open !== null) c.append(kv('At that time', os.open ? 'Open' : 'Closed'));
    if (a.withNpc) c.append(kv('With', npcName(a.withNpc))); if (!a.flex) c.append(kv('Reminder', a.remind ? `${a.remind} min before` : 'Off'));
    b.append(c); if (a.data && a.data.blurb) b.append(card(el('p', { text: a.data.blurb })));
    if (dest && G.phone.routeTo) b.append(btn('Take me there', () => G.phone.routeTo(dest), 'pri wide', 'ui.pin'));
    if (p) b.append(el('div.ph-btns', null, btn('Show on map', () => ctx.open('map', { place: p.id }), '', 'ui.pin'), G.phone.isUnlocked('taxi') ? btn('Cab there', () => ctx.open('taxi', { place: p.id }), '', 'transport.taxi') : null));
    if (a.s < 2 || a.flex) { if (src === 'mine') b.append(btn(a.flex ? 'Give it a time' : 'Move it', () => ctx.push('When?', moveView(a)), 'wide', 'ui.clock')); }
    if (!['work', 'class', 'delivery', 'story'].includes(src)) b.append(btn('Take it off my day', () => { P().remove(a.id); ctx.back(); ctx.tip('Taken off your day.'); }, 'wide', 'ui.cross'));
    else b.append(el('p.ph-note', { text: src === 'work' ? 'Your shifts come from your job. Change them in the Jobs app.' : src === 'class' ? 'This class is part of a course you enrolled in.' : src === 'delivery' ? 'This is a delivery you ordered.' : 'Family put this one on your day.' }));
  };
}
/* pick (another) time for one of your own entries */
function moveView(a) {
  const now = G.state.t, today = dayOf(now), f = { day: a.flex ? today : Math.max(today, dayOf(a.t)), hour: a.flex ? Math.ceil(((now % DAY) + 30) / 30) / 2 : (a.t % DAY) / 60 };
  return (b, ctx) => {
    const re = () => ctx.refresh(), t = () => f.day * DAY + Math.round(f.hour * 60), C = safe(() => P().conflicts(t(), a.flex ? 60 : a.dur, a.id), []);
    b.append(section('Day')); b.append(el('div.ph-chips', null, [0, 1, 2, 3, 4, 5, 6].map(i => chip(i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : WEEKDAYS[(today + i) % 7], f.day === today + i ? 'on' : '', () => { f.day = today + i; re(); }))));
    b.append(section('Time'), stepper(f, re));
    if (C.length) b.append(el('p.ph-note.warn', { text: `That is at the same time as ${C[0].title} (${hm(C[0].t)} to ${hm(C[0].t + C[0].dur)}). You can still keep both.` }));
    const bad = t() <= G.state.t;
    ctx.foot.append(el('div.ph-kv', null, el('span', { text: a.title }), el('b', { text: bad ? 'That time has passed' : when(t()) })),
      btn('Save', () => { if (bad) return ctx.tip('Pick a time in the future.'); P().update(a.id, { t: t(), dur: a.flex ? 60 : a.dur, remind: 30, lv: 0 }); ctx.back(); ctx.back(); ctx.tip('Moved.'); }, 'pri wide big', 'ui.check'));
  };
}
const stepper = (f, re) => el('div.ph-step', null, el('button', { text: '-', 'aria-label': 'Earlier', onclick: () => { f.hour = (f.hour + 23.5) % 24; re(); } }), el('b', { text: hhmm(f.hour) }), el('button', { text: '+', 'aria-label': 'Later', onclick: () => { f.hour = (f.hour + .5) % 24; re(); } }));

/* ---------- ideas ---------- */
function ideaRowEl(i, ctx, gap) {
  const addNow = () => {
    const t = gap && !i.fixed ? (defaultTime(i, gap.from) || Math.max(gap.from, Math.ceil(G.state.t / 5) * 5)) : i.fixed || i.window ? defaultTime(i) : i.day !== dayOf(G.state.t) ? i.day * DAY + 11 * 60 : undefined;
    if (t !== undefined && t !== null && safe(() => P().conflicts(t, Math.min(i.dur || 60, 90)), []).length) return ctx.push(i.title, ideaDetail(i, gap));   /* a clash: show it on the idea's page */
    const id = safe(() => MD().add(i, t === null ? undefined : t), null); ctx.tip(id ? (i.kind === 'opp' ? 'You took it up.' : `On your day${t ? ' at ' + hm(t) : ''}.`) : 'That one cannot be added just now.'); ctx.refresh();
  };
  return el('div.ph-idea' + (i.poor ? '.poor' : ''), { 'data-idea': i.id },
    el('button.ph-idea-m', { onclick: () => ctx.push(i.title, ideaDetail(i, gap)) }, iconEl(i.icon || 'myday.idea', 2), el('span.ph-row-m', null, el('b', { text: i.title }), el('small', { text: i.why || '' }))),
    el('button.ph-idea-add', { 'data-add': i.id, 'aria-label': 'Add to my day: ' + i.title, onclick: addNow }, i.kind === 'opp' ? 'Take' : 'Add'),
    el('button.ph-idea-no', { 'data-no': i.id, 'aria-label': 'Not interested', onclick: () => { safe(() => MD().dismiss(i)); ctx.tip('Not for you. Fewer like that from now on.'); ctx.refresh(); } }, 'x'));
}
function ideaDetail(i, gap) {
  const now = G.state.t, today = dayOf(now), open = !i.fixed && i.kind !== 'opp';
  const f = { any: open && !gap && !i.window && i.day === today, hour: 0 }; { const t0 = gap ? Math.max(gap.from, now + 10) : i.window ? defaultTime(i) : i.day === today ? now + 30 : i.day * DAY + 11 * 60; f.hour = Math.ceil((t0 % DAY) / 30) / 2; if (f.hour >= 24) f.hour = 23.5; }
  return (b, ctx) => {
    const re = () => ctx.refresh(), p = i.placeId ? place(i.placeId) : null, t = () => (i.fixed ? i.t : i.day * DAY + Math.round(f.hour * 60)), timed = i.fixed || (open && !f.any);
    b.append(el('div.ph-hero', null, iconEl(i.icon || 'myday.idea', 3), el('div', null, el('b', { text: i.title, style: { fontSize: '17px' } }), el('small', { text: 'An idea. Not on your day yet.' }))));
    const c = card(kv('Why now', i.why || 'Something to do'));
    c.append(kv('When', i.fixed ? when(i.t) + (i.end ? ` (${dur(i.dur)})` : '') : i.window ? `${hm(i.t)} to ${hm(i.end)}, turn up when you like` : i.kind === 'opp' && i.end ? `Until ${when(i.end)}` : 'Whenever you like'));
    if (p || i.pos) c.append(kv('Where', p ? p.name : i.pos.name)); if (i.walk) c.append(kv('From here', i.walk + ' min on foot')); if (i.price) c.append(kv('Costs', '$' + i.price, i.poor ? 'bad' : ''));
    b.append(c); if (i.blurb || i.text) b.append(card(el('p', { text: i.blurb || i.text })));
    if (open) { b.append(section('When will you go?'));
      b.append(el('div.ph-chips', null, i.day === today && !i.window ? chip('Any time today', f.any ? 'on' : '', () => { f.any = true; re(); }) : null, chip('At a time', !f.any ? 'on' : '', () => { f.any = false; re(); })));
      if (!f.any) b.append(stepper(f, re)); }
    const C = timed ? safe(() => P().conflicts(t(), Math.min(i.dur || 60, 90)), []) : [], bad = timed && !i.fixed && t() <= now;
    if (C.length) b.append(el('p.ph-note.warn', { text: `That is at the same time as ${C[0].title} (${hm(C[0].t)} to ${hm(C[0].t + C[0].dur)}). ${i.fixed ? 'You can still add it.' : 'You can add it anyway, or pick another time.'}` }));
    if (p) b.append(el('div.ph-btns', null, btn('Show on map', () => ctx.open('map', { place: p.id }), '', 'ui.pin'), i.entryId ? btn('Read about it', () => ctx.open('guide', { entry: i.entryId }), '', 'ui.star') : null));
    b.append(btn('Not interested', () => { safe(() => MD().dismiss(i)); ctx.back(); ctx.tip('Not for you. Fewer like that from now on.'); }, 'wide', 'ui.cross'));
    ctx.foot.append(el('div.ph-kv', null, el('span', { text: i.title }), el('b', { text: bad ? 'That time has passed' : i.kind === 'opp' ? 'An Opportunity' : timed ? when(t()) : 'Any time today' })),
      btn(i.kind === 'opp' ? 'Take it up' : C.length ? 'Add it anyway' : 'Add to my day', () => {
        if (bad) return ctx.tip('Pick a time in the future.');
        const id = safe(() => MD().add(i, timed && !i.fixed ? t() : i.window ? t() : undefined), null); if (!id) return ctx.tip('That one cannot be added just now.');
        tab = 'sched'; schedDay = i.day === today ? 0 : 1; if (i.day > today + 1) { tab = 'week'; selDay = i.day; } ideaGap = null; ctx.open('planner', { tab }); G.phone.tip(i.kind === 'opp' ? 'You took it up.' : 'On your day.');
      }, 'pri wide big', 'ui.check'));
  };
}

/* ---------- add flow ---------- */
function ideasView(pre) {
  return (b, ctx) => {
    b.append(el('p', { text: pre.withNpc ? `What would you like to do with ${npcName(pre.withNpc)}?` : 'Plan something of your own. You can invite a friend along.' }));
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
      btn('Add to my day', () => {
        if (bad) return ctx.tip('Pick a time in the future.');
        const title = (f.title || 'Appointment').trim() || 'Appointment', id = P().add({ title, placeId: f.placeId, t: t(), dur: f.dur, kind: f.withNpc ? 'friend' : 'personal', withNpc: f.withNpc, remind: f.remind, chosen: true });
        if (f.withNpc) invite(f.withNpc, P().get(id));
        selDay = f.day; ctx.open('planner', f.day === today ? { tab: 'sched' } : { day: f.day }); G.phone.tip(f.withNpc ? `On your day. ${npcName(f.withNpc)} has been invited.` : 'On your day.');
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
/* one day as a timeline: your entries in time order, the now-line, and the free gaps you can tap ("ideas for this gap") */
function timeline(b, ctx, day) {
  const now = G.state.t, d0 = day * DAY, isToday = day === dayOf(now), L = safe(() => P().list(d0, d0 + DAY), []).filter(a => !a.flex && dayOf(a.t) === day), gaps = safe(() => MD().gaps(day), []);
  const rows = L.map(a => ({ t: a.t, a })).concat(gaps.map(g => ({ t: g.from, g }))).sort((x, y) => x.t - y.t || (x.g ? 1 : -1)); let nowDone = !isToday;
  const nowLine = () => { nowDone = true; b.append(el('div.ph-nowline', null, el('b', { text: 'Now ' + hm(now) }))); };
  if (!rows.length) { if (isToday) nowLine(); b.append(el('p.ph-note', { text: isToday ? 'Nothing more today.' : 'Nothing on this day yet.' })); return; }
  for (const r of rows) {
    if (!nowDone && r.t >= now - 1) nowLine();
    if (r.a) { b.append(entryRow(r.a, ctx)); if (!nowDone && r.a.t <= now && r.a.t + r.a.dur > now) nowLine(); }
    else { const g = r.g, n = safe(() => MD().ideas({ n: 0, at: g.from, until: g.to }).length, 0);
      b.append(el('button.ph-gap', { 'data-gap': g.from, onclick: () => { tab = 'ideas'; ideaGap = g; ideaDay = day; ctx.refresh(); } }, iconEl('myday.free', 1), el('span', null, el('b', { text: `${dur(Math.round((g.to - g.from) / 15) * 15)} free` }), ` · ${hm(g.from)} to ${hm(g.to)}`), el('em', { text: n ? `${n} idea${n === 1 ? '' : 's'} for this gap` : 'ideas for this gap' }))); }
  }
  if (!nowDone) nowLine();
}
function schedTab(b, ctx) {
  const now = G.state.t, today = dayOf(now), W = G.weather, day = today + (schedDay ? 1 : 0), sc = safe(() => MD().schedule(), null);
  if (W && W.daySummary) { const fc = el('div.ph-fc'); for (let i = 0; i < 4; i++) { const s = safe(() => W.daySummary(i), null); if (!s) continue; fc.append(el('div', null, el('span', { text: i === 0 ? 'Today' : WEEKDAYS[(today + i) % 7] }), iconEl(weatherIcon(s.kind), 2), el('span', { text: `${s.hiC}° / ${s.loC}°` }), el('small', { text: s.name }))); } if (fc.children.length) b.append(card(fc)); }
  if (!schedDay && sc && sc.next) { const a = sc.next; b.append(section(a.flex || a.t > now ? 'Next' : 'Now')); b.append(entryRow(a, ctx));
    const dest = a.placeId || (a.data && a.data.pos) || null, tr = safe(() => P().travelTo(a), null); if (dest && tr && G.phone.routeTo) b.append(btn(`Take me there · ${tr.walk} min on foot`, () => G.phone.routeTo(dest), 'pri wide', 'ui.pin')); }
  if (!schedDay && sc && sc.chapter) b.append(el('div.ph-chap', { 'data-g': 'chapter' }, el('b', { text: sc.chapter.text }), el('small', { text: sc.chapter.state === 'waiting' ? 'No hurry.' : sc.chapter.state === 'paused' ? "Your place is kept. It'll keep." : "Whenever you're ready. It is on the Map in gold." })));
  b.append(el('div.ph-chips.ph-daysw', null, chip('Today', !schedDay ? 'on' : '', () => { schedDay = 0; ctx.refresh(); }), chip('Tomorrow', schedDay ? 'on' : '', () => { schedDay = 1; ctx.refresh(); }), el('button.ph-link', { text: '+ Plan your own', onclick: () => ctx.push('Plan something', ideasView({ day })) })));
  b.append(section(`${schedDay ? 'Tomorrow' : 'Today'} · ${timeInfo(day * DAY).label}`));
  timeline(b, ctx, day);
  if (!schedDay && sc && sc.flex.length) { b.append(section('Any time today')); for (const a of sc.flex) b.append(entryRow(a, ctx)); }
  b.append(el('p.ph-note', { text: 'Only what you add is on your day, plus what life puts there: work, family, things you booked. Everything else is in Ideas.' }));
  const al = P().alarm();
  b.append(section('Wake-up alarm'), el('div.ph-step', null, el('button', { text: '-', 'aria-label': 'Alarm earlier', onclick: () => { P().setAlarm((al === null ? 7.5 : al) - .5); ctx.refresh(); } }), el('b', { text: al === null ? 'Off' : hhmm(al) }),
    el('button', { text: '+', 'aria-label': 'Alarm later', onclick: () => { P().setAlarm((al === null ? 6.5 : al) + .5); ctx.refresh(); } }), el('button', { text: 'Off', disabled: al === null, onclick: () => { P().setAlarm(null); ctx.refresh(); } })));
}
function ideasTab(b, ctx) {
  const now = G.state.t, today = dayOf(now); if (ideaDay === null || ideaDay < today || ideaDay > today + 6) { ideaDay = today; ideaGap = null; } if (ideaGap && ideaGap.to <= now) ideaGap = null;
  b.append(el('div.ph-chips', null, [0, 1, 2, 3, 4, 5, 6].map(i => chip(i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : WEEKDAYS[(today + i) % 7], ideaDay === today + i ? 'on' : '', () => { ideaDay = today + i; ideaGap = null; ctx.refresh(); }))));
  if (ideaGap) b.append(el('div.ph-gaphead', null, el('b', { text: `For your free time, ${hm(ideaGap.from)} to ${hm(ideaGap.to)}` }), el('button.ph-link', { text: 'Show the whole day', onclick: () => { ideaGap = null; ctx.refresh(); } })));
  const L = safe(() => MD().ideas(ideaGap ? { n: 0, at: Math.max(ideaGap.from, ideaDay === today ? now : 0), until: ideaGap.to } : { n: 0, day: ideaDay }), []).slice(0, 18);
  b.append(el('p.ph-note', { text: ideaDay === today && !ideaGap ? 'Picked for you, right now. None of these is on your day until you add it.' : 'None of these is on your day until you add it.' }));
  if (!L.length) b.append(empty('myday.idea', 'Nothing special', ideaGap ? 'A free hour is a fine thing too.' : 'Nothing in the diary for this day yet.'));
  for (const i of L) b.append(ideaRowEl(i, ctx, ideaGap));
  b.append(el('button.ph-link', { text: '+ Plan something of your own', style: { alignSelf: 'center', marginTop: '6px' }, onclick: () => ctx.push('Plan something', ideasView({ day: ideaDay })) }));
}
function weekTab(b, ctx) {
  const now = G.state.t, today = dayOf(now), W = G.weather;
  if (selDay !== null && selDay >= today && selDay <= today + 13) { const d = selDay, i = timeInfo(d * DAY);
    b.append(el('div.ph-gaphead', null, el('b', { text: d === today ? 'Today' : d === today + 1 ? 'Tomorrow' : i.label }), el('button.ph-link', { text: 'Back to the week', onclick: () => { selDay = null; ctx.refresh(); } })));
    timeline(b, ctx, d); const fl = d === today ? safe(() => MD().schedule().flex, []) : []; if (fl.length) { b.append(section('Any time today')); for (const a of fl) b.append(entryRow(a, ctx)); }
    const n = safe(() => MD().ideas({ n: 0, day: d }).length, 0);
    b.append(btn(n ? `${n} idea${n === 1 ? '' : 's'} for this day` : 'Ideas for this day', () => { tab = 'ideas'; ideaDay = Math.min(d, today + 6); ideaGap = null; ctx.refresh(); }, 'wide', 'myday.idea'), btn('Plan something of your own', () => ctx.push('Plan something', ideasView({ day: d })), 'wide', 'ui.plus'));
    return; }
  for (let d = today; d < today + 7; d++) { const i = timeInfo(d * DAY), L = safe(() => P().list(d * DAY, (d + 1) * DAY), []).filter(a => dayOf(a.t) === d || (a.flex && d === today)), ws = W && W.daySummary ? safe(() => W.daySummary(d - today), null) : null;
    const big = safe(() => MD().ideas({ n: 0, day: d }).find(x => x.kind === 'big' && !x.ahead), null), n = safe(() => MD().ideas({ n: 0, day: d }).filter(x => x.t).length, 0);
    const box = el('button.ph-wday' + (d === today ? '.today' : ''), { 'data-day': d, onclick: () => { selDay = d; ctx.refresh(); } },
      el('div.ph-wd-h', null, el('b', { text: d === today ? 'Today' : d === today + 1 ? 'Tomorrow' : i.weekdayName || WEEKDAYS[d % 7] }), el('small', { text: `${i.seasonName} ${i.dayOfMonth}` }), ws ? iconEl(weatherIcon(ws.kind), 1) : null));
    if (!L.length) box.append(el('span.ph-wd-free', { text: 'Free' }));
    for (const a of L.slice(0, 4)) box.append(el('span.ph-wd-i.src-' + srcOf(a) + (a.s >= 3 || a.t + a.dur <= now ? '.gone' : ''), null, el('em', { text: a.flex ? 'any' : hm(a.t) }), a.title));
    if (L.length > 4) box.append(el('span.ph-wd-free', { text: `and ${L.length - 4} more` }));
    box.append(el('span.ph-wd-n' + (big ? '.big' : ''), { text: big ? `${big.title} · ${n} thing${n === 1 ? '' : 's'} on` : n ? `${n} thing${n === 1 ? '' : 's'} on in town` : 'A quiet day in town' }));
    b.append(box); }
}

export default {
  id: 'planner',
  // "something is coming up in the next two hours" — shown until you have opened the app once for that appointment (owner msg 88: the counter must clear)
  badge: () => { const n = safe(() => P().next(), null); return n && !n.flex && n.t - G.state.t < 120 && n.s < 3 && safe(() => G.state.phone.seen.plannerAppt, null) !== n.id ? 1 : 0; },
  render(b, ctx) {
    { const n = safe(() => P().next(), null), sn = G.state.phone && (G.state.phone.seen || (G.state.phone.seen = {})); if (n && sn && sn.plannerAppt !== n.id) { sn.plannerAppt = n.id; setTimeout(() => safe(() => G.phone.syncBadge(), 0), 0); } }
    if (!P() || !MD()) return b.append(empty('ui.calendar', 'My Day is syncing', 'Your day will be here in a moment.'));
    const a = ctx.arg; if (a && !a._used) { a._used = 1;
      if (a.tab) { tab = a.tab === 'ideas' ? 'ideas' : a.tab === 'week' ? 'week' : 'sched'; if (tab === 'week') selDay = null; }
      else if (a.myday) { tab = 'sched'; schedDay = 0; }
      if (a.gap) { tab = 'ideas'; ideaGap = a.gap; ideaDay = dayOf(a.gap.from); }
      if (a.day !== undefined) { const today = dayOf(G.state.t); if (a.day === today || a.day === today + 1) { tab = 'sched'; schedDay = a.day - today; } else { tab = 'week'; selDay = a.day; } }
      if (a.add) return queueMicrotask(() => ctx.push('Plan something', a.placeId ? form({ title: 'Visit ' + placeName(a.placeId), places: [a.placeId], withNpc: a.withNpc, custom: true }) : ideasView({ withNpc: a.withNpc })));
      if (a.idea) { const i = safe(() => MD().idea(a.idea), null); if (i) return queueMicrotask(() => ctx.push(i.title, ideaDetail(i))); tab = 'ideas'; }
      if (a.appt) { const x = P().get(a.appt); if (x && !x.pin) return queueMicrotask(() => ctx.push(x.title, detail(x))); } }
    b.append(tabs([{ id: 'sched', name: 'My Schedule' }, { id: 'ideas', name: 'Ideas' }, { id: 'week', name: 'Week' }], tab, t => { tab = t; if (t === 'week') selDay = null; if (t === 'ideas') ideaGap = null; ctx.refresh(); }));
    (tab === 'sched' ? schedTab : tab === 'ideas' ? ideasTab : weekTab)(b, ctx);
  },
};
