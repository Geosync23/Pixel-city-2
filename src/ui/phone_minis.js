// Phone apps released through the app store (catalogue in src/sim/apps.js), each a small window onto an existing system. Styles in phone_apps.css.
//   showtime  "Showtime"     G.shows.venues()/schedule(): what is on today and tomorrow, Add to planner, Take me there.
//   transit   "Bay Transit"  G.rail.nextTrains / G.transit.nextBuses for the nearest station and stop, tickets and passes, loop diagram.
//   wallet    "Receipts"     G.money.history(): this week's spending by category (bars) + G.money.bills().
//   closet    "Closet"       G.wardrobe.owned()/wear().
//   friends   "Circle"       G.social.known()/npc()/whereIs(): meters, whereabouts, birthdays, quick message.
//   weather   "Skies"        G.weather.forecast()/daySummary(): hourly strip, 3-day outlook, a hint.
// Every app guards a missing system with an empty state.
import { G } from '../core/game.js';
import { el, iconEl, btn, section, chip, kv, empty, safe, money, bar, when, cityPos, place, placeName, portrait, weatherIcon, DAY } from './phone_util.js';
import { toast } from './kit.js';
import { ITEM_BY_ID } from '../data/items.js';
import { regDef, goTo, walkMin, walkText, injectCss } from './phone_store.js';
export const order = 124;
const now = () => G.state.t || 0, today = () => Math.floor(now() / DAY);
const abs = (s, d) => (s.t < DAY ? d * DAY + s.t : s.t);

/* ---------- Showtime ---------- */
const VKIND = { cinema: 'Film', concerthall: 'Concert', playhouse: 'Play' };
function showtime(b, ctx) {
  b.classList.add('as-body'); const vs = safe(() => G.shows.venues(), []).map(v => (typeof v === 'string' ? { id: v } : v));
  if (!vs.length) { b.append(empty('ui.star', 'No listings', 'The box offices have not sent their programme yet.')); return; }
  const tix = safe(() => G.shows.tickets(), []) || [];
  if (tix.length) { b.append(section('Your tickets')); for (const t of tix) b.append(el('div.ph-card', null, el('b', { text: t.title || 'Ticket' }), el('small', { text: `${placeName(t.venue)}${t.t !== undefined ? ' · ' + when(abs(t, today())) : ''}` }))); }
  for (const d of [0, 1]) {
    const day = today() + d, rows = [];
    for (const v of vs) for (const s of safe(() => G.shows.schedule(v.id, day), []) || []) { const t = abs(s, day); if (t > now() - 5) rows.push({ s, t, v }); }
    rows.sort((a, c) => a.t - c.t); b.append(section(d ? 'Tomorrow' : 'Today', chip(String(rows.length))));
    if (!rows.length) b.append(el('p.as-note', { text: d ? 'Nothing listed yet.' : 'The last curtain has gone up. See tomorrow below.' }));
    for (const { s, t, v } of rows.slice(0, d ? 8 : 20)) b.append(el('div.ph-card.mn-show', null,
      el('div.mn-show-top', null, el('span.mn-time', { text: s.clock || when(t) }), el('span', null, el('b', { text: s.title }), el('small', { text: `${VKIND[v.id] || 'Show'} · ${v.name || placeName(v.id)} · ${money(s.price)} · ${s.minutes || 90} min` }))),
      s.blurb ? el('p', { text: s.blurb }) : null,
      el('div.nl-acts', null, btn('Add to planner', () => { const id = safe(() => G.planner.add({ title: s.title, placeId: v.id, t, dur: s.minutes || 90, kind: 'event' }), null); toast(id ? `In your planner: ${s.title}, ${when(t)}. Buy the ticket at the box office.` : 'Could not add that.', id ? 'good' : ''); }, '', 'ui.calendar'),
        btn('Take me there', () => goTo(place(v.id) ? v.id : 'door:' + v.id, ctx, v.name || placeName(v.id)), 'pri', 'ui.pin'))));
  }
  b.append(el('p.as-note', { text: 'Tickets are sold at each box office. Doors open 15 minutes before the start.' }));
}

/* ---------- Bay Transit ---------- */
function transit(b, ctx) {
  b.classList.add('as-body'); const me = cityPos(), R = G.rail, T = G.transit;
  if (!R && !T) { b.append(empty('ui.pin', 'No service', 'Transit information is not available right now.')); return; }
  const pass = safe(() => T.hasPass(), false), tk = safe(() => R.tickets(), 0);
  b.append(el('div.ph-card', null, kv('Transit pass', pass ? 'Valid' : 'None'), kv('Single tickets in your pocket', String(tk)),
    R && !pass ? el('div.nl-filters', null, R.buyTicket ? chip('Single ticket', '', () => { if (safe(() => R.buyTicket(), false)) ctx.refresh(); else toast('Not enough money.'); }) : null,
      safe(() => R.passes(), []).map(p => chip(`${p.name} ${money(p.price)}`, '', () => { if (safe(() => R.buyPass(p.id), false)) ctx.refresh(); else toast('Not enough money.'); }))) : null,
    pass ? el('small.nl-dim', { text: 'Every train and bus is covered while the pass lasts.' }) : null));
  const st = safe(() => R.stations(), []).map(s => ({ s, m: walkMin(me, s.entrance || s) })).sort((a, c) => a.m - c.m)[0];
  if (st) {
    b.append(section('Nearest station', chip(walkText(st.m)))); const c = el('div.ph-card', null, el('b', { text: st.s.name + ' Station' }));
    const tr = safe(() => R.nextTrains(st.s.id), []).slice(0, 4);
    for (const t of tr) c.append(kv(`${t.line || 'Train'} toward ${t.toward}`, t.boarding ? 'Boarding now' : `${Math.max(1, Math.round(t.minutes))} min`));
    if (!tr.length) c.append(el('small.nl-dim', { text: 'No trains listed just now.' }));
    c.append(btn('Take me there', () => goTo({ x: (st.s.entrance || st.s).x, y: (st.s.entrance || st.s).y, name: st.s.name + ' Station', id: st.s.venueId }, ctx, st.s.name + ' Station'), '', 'ui.pin')); b.append(c);
  }
  const bs = safe(() => T.stops(), []).map(s => ({ s, m: walkMin(me, s) })).sort((a, c) => a.m - c.m)[0];
  if (bs) {
    b.append(section('Nearest bus stop', chip(walkText(bs.m)))); const c = el('div.ph-card', null, el('b', { text: bs.s.name })), nb = safe(() => T.nextBuses(bs.s.id), []).slice(0, 4);
    for (const n of nb) c.append(kv(`${n.num || ''} ${n.name || n.route || 'Bus'}`.trim(), `${Math.max(1, Math.round(n.minutes))} min`));
    if (!nb.length) c.append(el('small.nl-dim', { text: 'No buses due.' }));
    c.append(btn('Take me there', () => goTo({ x: bs.s.x, y: bs.s.y, name: bs.s.name }, ctx, bs.s.name), '', 'ui.pin')); b.append(c);
  }
  const dg = st && R.diagram ? safe(() => R.diagram(st.s.id, null), null) : null;
  if (dg) b.append(section('The loop'), el('div.mn-diagram', null, dg));
}

/* ---------- Receipts ---------- */
const CATS = [['food', 'Food & drink', '#e0703a', /food|meal|grocer|coffee|cafe|diner|lunch|dinner|snack|eat|pizza|noodle|bakery|market|drink|order|restaurant|ramen/i], ['move', 'Getting around', '#3b82d6', /taxi|cab|train|bus|fare|pass|ticket \(|transit|ride/i],
  ['home', 'Home & bills', '#b8794a', /rent|lease|utilit|mortgage|bill|phone plan|furnit|upkeep|down payment|moving|delivery/i], ['fun', 'Fun & shows', '#a23b72', /show|film|cinema|concert|play|ticket|skydeck|arcade|game|gym|wheel|museum/i], ['shop', 'Shopping & other', '#8a5cc2', /./]];
function wallet(b) {
  b.classList.add('as-body'); const hist = safe(() => G.money.history(), null);
  if (!hist) { b.append(empty('ui.coin', 'No records', 'Your bank has not shared any activity yet.')); return; }
  const from = now() - 7 * DAY, wk = hist.filter(e => e.t >= from), out = wk.filter(e => e.d < 0), inn = wk.filter(e => e.d > 0).reduce((n, e) => n + e.d, 0), spent = -out.reduce((n, e) => n + e.d, 0);
  const sums = Object.fromEntries(CATS.map(c => [c[0], 0])); for (const e of out) sums[CATS.find(c => c[3].test(e.r || ''))[0]] -= e.d;
  b.append(el('div.mn-inout', null, el('span', null, el('small', { text: 'Out, last 7 days' }), el('b.bad', { text: money(spent) })), el('span', null, el('small', { text: 'In' }), el('b.good', { text: money(inn) }))));
  b.append(section('Where it went'));
  if (!out.length) b.append(el('p.as-note', { text: 'Nothing spent yet this week. Receipts fill in as you shop, ride and eat.' }));
  const max = Math.max(1, ...Object.values(sums)), ch = el('div.ph-card.mn-chart');
  for (const [id, name, col] of CATS) ch.append(el('div.mn-bar', null, el('span', { text: name }), el('i', null, el('u', { style: { width: Math.round(sums[id] / max * 100) + '%', background: col } })), el('b', { text: money(sums[id]) })));
  b.append(ch);
  const bl = safe(() => G.money.bills(), null);
  if (bl) { b.append(section('Bills due', chip(when(bl.dueT)))); const c = el('div.ph-card'); for (const i of bl.items || []) c.append(kv(i.label, money(i.amount))); if (bl.arrears) c.append(kv('Carried over', money(bl.arrears))); c.append(kv('Total', money(bl.total), 'tot')); b.append(c); }
  if (out.length) { b.append(section('Latest')); const c = el('div.ph-card'); for (const e of out.slice(0, 6)) c.append(kv(e.r || 'Payment', money(-e.d))); b.append(c); }
}

/* ---------- Closet ---------- */
function closet(b, ctx) {
  b.classList.add('as-body'); const W = G.wardrobe; if (!W || !W.owned) { b.append(empty('ui.heart', 'Empty closet', 'No wardrobe here yet.')); return; }
  const own = safe(() => W.owned(), []), cur = safe(() => W.wearing(), null), nm = id => (ITEM_BY_ID[id] && ITEM_BY_ID[id].name) || id;
  b.append(el('div.ph-card.mn-today', null, iconEl(cur || 'outfit_travel', 3, 'outfit'), el('span', null, el('small', { text: "Today's outfit" }), el('b', { text: cur ? nm(cur) : 'What you arrived in' }), el('small', { text: (safe(() => W.styles(), []) || []).join(', ') }))));
  b.append(section('Your outfits', chip(String(own.length)))); const grid = el('div.mn-grid');
  for (const id of own) grid.append(el('button.mn-outfit' + (id === cur ? '.on' : ''), { 'aria-label': nm(id), onclick: () => { if (id !== cur && safe(() => W.wear(id), false) !== false) { toast(`Now wearing: ${nm(id)}.`, 'good'); ctx.refresh(); } } }, iconEl(id, 3, 'outfit'), el('b', { text: nm(id) }), el('small', { text: id === cur ? 'Wearing' : 'Wear' })));
  b.append(grid, el('p.as-note', { text: own.length < 2 ? 'Only one outfit so far. Clothes shops around town and in the mall sell more.' : 'Tap an outfit to change into it, wherever you are.' }));
}

/* ---------- Circle ---------- */
function friends(b, ctx) {
  b.classList.add('as-body'); const So = G.social; if (!So || !So.known) { b.append(empty('ui.heart', 'Nobody yet', 'Say hello to someone in town.')); return; }
  const ids = safe(() => So.known(), []).map(x => (typeof x === 'string' ? x : x.id)), ppl = ids.map(id => safe(() => So.npc(id), null)).filter(Boolean).sort((a, c) => (c.rel || 0) - (a.rel || 0));
  if (!ppl.length) { b.append(empty('ui.heart', 'Nobody yet', 'Tap someone in town and press Talk. They will show up here.')); return; }
  const bd = ppl.filter(p => p.birthday).map(p => `${p.short || p.name}: ${typeof p.birthday === 'object' ? (p.birthday.label || `day ${p.birthday.day}${p.birthday.season !== undefined ? ', season ' + (p.birthday.season + 1) : ''}`) : p.birthday}`);
  b.append(section('Your circle', chip(ppl.length + ' people')));
  for (const p of ppl) { const w = safe(() => So.whereIs(p.id), null);
    b.append(el('div.ph-card.mn-friend', null, el('div.mn-friend-top', null, safe(() => portrait(p.id, 40, p.name), null), el('span', null, el('b', { text: p.name }), el('small', { text: [p.tierLabel || p.tier, p.role].filter(Boolean).join(' · ') }))),
      bar(Math.max(0, Math.min(100, p.rel || 0)), 100, '#e0527a'), el('small.nl-dim', { text: w && (w.label || w.name) ? 'Now: ' + (w.label || w.name) : 'Somewhere around town' }),
      el('div.nl-acts', null, btn('Message', () => G.phone.open('messages', { person: p.id })), w && typeof w.x === 'number' && (!w.sceneId || w.sceneId === 'city') ? btn('Find', () => goTo({ x: w.x, y: w.y, name: p.short || p.name }, ctx, p.short || p.name), '', 'ui.pin') : w && w.placeId ? btn('Find', () => goTo(w.placeId, ctx, w.label || w.name), '', 'ui.pin') : null))); }
  if (bd.length) { b.append(section('Birthdays')); b.append(el('div.ph-card', null, bd.map(t => el('small', { text: t })))); }
}

/* ---------- Skies ---------- */
const HINT = { clear: 'Clear skies. A good day for parks, the pier and long walks.', cloudy: 'Grey but dry. Fine for errands on foot.', rain: 'Rain on the way. Take an umbrella, or let the bus and train keep you dry; cinemas and cafes are at their cosiest.', storm: 'Storms. Stay in if you can: cook, decorate, or catch a show.', snow: 'Snow! Wrap up warm; walks are slower and the town looks its best.', fog: 'Foggy early on. It usually lifts by mid-morning.' };
function weather(b) {
  b.classList.add('as-body'); const Wx = G.weather; if (!Wx || !Wx.forecast) { b.append(empty('weather.sun', 'No forecast', 'The weather station is offline.')); return; }
  const cur = safe(() => Wx.current(), null), hr = safe(() => G.now().hour, 12), f = safe(() => Wx.forecast(0), []) || [], rest = f.filter(h => h.hour >= hr), s0 = safe(() => Wx.daySummary(0), null);
  const night = h => h < 6 || h >= 20;
  b.append(el('div.mn-sky', null, iconEl(weatherIcon(cur ? cur.kind : (s0 && s0.kind), night(hr)), 4), el('span', null, el('b', { text: cur ? `${cur.tempC}°C` : s0 ? `${s0.hiC}°C` : '' }), el('span', { text: (cur && cur.name) || (s0 && s0.name) || '' }), s0 ? el('small', { text: `High ${s0.hiC}° · Low ${s0.loC}°` }) : null)));
  const worst = ['storm', 'snow', 'rain', 'fog', 'cloudy', 'clear'].find(k => rest.some(h => h.kind === k)) || (cur && cur.kind) || 'clear', wet = rest.find(h => /rain|storm|snow/.test(h.kind));
  b.append(el('p.as-desc', { text: (HINT[worst] || HINT.clear) + (wet ? ` First drops around ${String(wet.hour).padStart(2, '0')}:00.` : '') }));
  b.append(section('Rest of today')); b.append(el('div.mn-hours', null, rest.map(h => el('span', null, el('small', { text: String(h.hour).padStart(2, '0') }), iconEl(weatherIcon(h.kind, night(h.hour)), 1), el('b', { text: h.tempC + '°' })))));
  b.append(section('Next 3 days')); const c = el('div.ph-card');
  for (const d of [1, 2, 3]) { const s = safe(() => Wx.daySummary(d), null); if (s) c.append(el('div.mn-day', null, el('span', { text: d === 1 ? 'Tomorrow' : 'In ' + d + ' days' }), iconEl(weatherIcon(s.kind, false), 1), el('b', { text: s.name }), el('small', { text: `${s.hiC}° / ${s.loC}°` }))); }
  b.append(c);
}

export function init() {
  injectCss(); if (!G.phone || !G.phone.registerApp) return;
  for (const [id, render] of [['showtime', showtime], ['transit', transit], ['wallet', wallet], ['closet', closet], ['friends', friends], ['weather', weather]]) G.phone.registerApp(Object.assign(regDef(id), { render }));
}
