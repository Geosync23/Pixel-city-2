// Navigator: "what do I need -> where is it -> how do I get there" (shared by the HUD need chooser and the phone Map app).
// G.nav = {
//   find(kind, n = 4, from?)  -> [{ id (place id | {x,y,name}), name, x, y, d (city units, manhattan), open: true|false|null, note, home?, friend? }]  closed places last.
//        kinds: food groceries coffee home work fun shopping transit  +  the needs: hunger energy hygiene fun social bladder (restrooms)
//   addSource(kind, fn(from) -> rows)   extra rows for a kind that are not registered places (park restroom pavilions)
//   matches(place, kind)      -> bool (data-driven: venue.offers {menu, shop[], services[], functions[]}, venue.type, guide entry type/chapter/acts, place kind)
//   routeTo(place | id | {x,y,name}, from?) -> options [{ mode: walk|bike|bus|train|cab, label, minutes, cost, text, dest, board?, alight?, stops?, line?, toward?, wait? }]
//   start(option)             walk/bike: waypoint to the destination. bus/train: MULTI-LEG trip (waypoint to the boarding stop first; after 'ride:end' it switches
//                             to the destination; cleared on arrival / cancel). cab: opens MapleCab; once the ride is requested ('taxi:request') it becomes a
//                             cab trip (meet the cab at the kerb -> ride -> walk to the door). Requested indoors, the cab is called when you step outside.
//   trip() -> G.state.nav.trip | null      cancel()      offer(place) -> shows the "How will you get there?" sheet in the banner
//   replan(why?)              new guidance from where the player is now (got off at the wrong stop / missed it / the ride was lost on load): walk, or the same mode again
// }
// State: G.state.nav = { trip: null | { mode walk-less: bus|train|cab, dest, board, alight, stops, line, toward, route, from, to, stage: 0 walk to stop (cab: meet the cab) | 1 riding |
//        2 walk to destination, at: bool (standing at the boarding stop), call?: bool (cab still to be called), rerouted? }, edges: {} (ui/navarrow.js scene graph) }.
// The on-screen guide arrow for every leg (and the "This is your stop" banner) is ui/navarrow.js; it reads trip() + the waypoint every frame.
// The trip banner is a DOM strip under the HUD (#nav-trip). Events: nav:start(trip), nav:stage(trip), nav:end(reason: arrived|cancel|replaced), nav:reroute(trip | null, why).
import { G } from '../core/game.js';
import { el, root, toast } from '../ui/kit.js';
import { innerPlace } from '../ui/navarrow.js';
import { openState, cityPos, place, homePlace, money } from '../ui/phone_util.js';

const WALK = 1.15 / 3.6, BUS_V = 12, BUS_DWELL = 1, CAB_V = 9;   // BUS_V: measured along the bus loop incl. lights (units per game minute at the transit.js ride clock 0.35 + signal priority; QA round 3: 9.6-13.4 measured); BUS_DWELL game minutes per stop on the way   // game minutes per city unit on foot (player speed 3.6 u/s, 1 game min per real second, + corners)
const man = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y), safe = (f, d) => { try { const v = f(); return v === undefined ? d : v; } catch (e) { return d; } };
const cityW = () => { const s = G.sceneCache && G.sceneCache.get('city'); return s ? s.world : G.scene && G.scene.id === 'city' ? G.scene.world : null; };
const mins = m => Math.max(1, Math.round(m)) + ' min';
// distances shown to the player: city units are scaled so that the shown distance matches the shown walking time (~80 m per walking minute)
export const M_PER_U = 25;
export const fmtDist = u => { const m = Math.max(0, +u || 0) * M_PER_U; return m >= 950 ? (m / 1000).toFixed(m >= 9500 ? 0 : 1) + ' km' : Math.max(10, Math.round(m / 10) * 10) + ' m'; };
/** lowest bottom edge (viewport px) of the top HUD cluster / trip strip that overlaps the horizontal span x0..x1 (used to keep banners and the strip clear of the clock + needs bar) */
export function clearTop(x0, x1, skip) {
  if (typeof document === 'undefined') return 0; let b = 0;
  for (const s of ['#hud .hud-tl', '#hud .hud-tr', '#nav-trip']) { const e = document.querySelector(s); if (!e || e === skip) continue; const r = e.getBoundingClientRect(); if (!r.height || !r.width) continue; if (r.right > x0 && r.left < x1) b = Math.max(b, r.bottom); }
  return b;
}
const pt = p => p ? Object.assign({ id: typeof p.id === 'string' ? p.id : null, name: p.name || 'Waypoint', x: p.x, y: p.y }, p.room ? { room: p.room } : null) : null;
const KIND = { cab: 'taxi', bus: 'bus', train: 'train' }, inCity = () => !!G.scene && G.scene.id === 'city', normSt = id => String(id || '').replace(/^station:|^st_/, '');
const same = (a, b) => !!a && !!b && (a.id ? a.id === b.id : a.x === b.x && a.y === b.y);

/* ---------- matching ---------- */
let gi = null, giN = -1;
function guideOf(id) { const all = safe(() => G.guide.all(), []); if (!gi || giN !== all.length) { gi = new Map(); giN = all.length; for (const e of all) if (e.placeId && !gi.has(e.placeId)) gi.set(e.placeId, e); } return gi.get(id); }
function info(p) {
  const v = p.venue || {}, o = v.offers || {}, g = guideOf(p.id) || {};
  return { vt: v.type || '', menu: !!o.menu, shop: o.shop || [], svc: o.services || [], fns: (o.functions || []).concat(p.functions || []), type: String(g.type || '').toLowerCase(), ch: g.chapter || '', also: g.also || [], acts: g.acts || [], kind: p.kind, id: p.id, roomId: p.roomId };
}
const T = {
  food: i => i.menu || i.vt === 'food' || (i.ch === 'eat' && i.kind !== 'spot'),
  groceries: i => i.shop.includes('ingredient') || /supermarket|grocer|corner shop|bodega|delicatessen|mini mart|provisions/.test(i.type),
  coffee: i => /caf[eé]|coffee|tea house|bakery|juice/.test(i.type) || (i.menu && i.fns.includes('espresso')),
  hygiene: i => i.fns.includes('locker_shower') || /\bgym\b|laundr|salon|barber|\bspa\b|bath|pool/.test(i.type),
  fun: i => i.vt === 'leisure' || (['shows', 'arts', 'outdoors'].includes(i.ch) && i.vt !== 'shop') || i.also.includes('shows') || /arcade|cinema|theat|bowling|karaoke|museum|gallery/.test(i.type) || (i.kind === 'spot' && i.fns.length > 0),
  social: i => /\bbar\b|\bpub\b|caf[eé]|club|tea house|diner|beer|wine|cocktail/.test(i.type) || i.fns.includes('bar_stool') || i.fns.includes('dancefloor'),
  shopping: i => (i.vt === 'shop' || i.ch === 'shop' || /mall|market/.test(i.type)) && i.kind !== 'spot',
  transit: i => i.kind === 'station' || i.kind === 'busstop' || i.kind === 'taxistand',
};
// bladder: any place with a restroom. G.bladder.hasRestroom(roomId) knows which rooms have a counter / toilet; park pavilions come from the SOURCES hook below.
T.bladder = i => { if (i.fns.includes('restroom') || i.kind === 'airport') return true; if (i.kind !== 'venue' && !i.roomId) return false; const h = safe(() => G.bladder.hasRestroom(i.roomId || i.id), null); return h === true || (h == null && i.kind === 'venue' && (i.menu || i.svc.length > 0 || i.shop.length > 0)); };
const SOURCES = {};   // kind -> [fn(from) -> extra rows {id, name, x, y, d?, open?, note?}]  (G.nav.addSource)
T.hunger = i => T.food(i) || T.groceries(i); T.energy = T.coffee;
export const matches = (p, kind) => !!(p && T[kind] && T[kind](info(p)));
const HOME_NOTE = { hunger: 'cook from your fridge', food: 'cook from your fridge', energy: 'sleep or nap', hygiene: 'shower', fun: 'TV, games, music', bladder: 'your bathroom', home: '' };
const fridgeFood = () => safe(() => G.inv.fridge.items().some(s => G.inv.isFood(G.inv.item(s.id))), false);
const row = (p, from, extra) => Object.assign({ id: p.id, name: p.name, x: p.x, y: p.y, d: man(p, from), open: safe(() => openState(p).open, null), note: '' }, extra);

export function find(kind, n = 4, from = cityPos()) {
  const out = [], seen = new Set(), home = safe(() => homePlace(), null);
  if (kind === 'home') return home ? [row(home, from, { name: 'Home', home: true, open: null })] : [];
  if (kind === 'work') { const j = safe(() => G.jobs.current(), null), p = j && (place(j.venue) || place('door:' + j.venue)); if (!p) return []; const t = j.nextShift, c = t != null ? safe(() => { const m = ((t % 1440) + 1440) % 1440; return ' ' + String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(Math.floor(m % 60)).padStart(2, '0'); }, '') : ''; return [row(p, from, { name: 'Work: ' + (j.venueName || p.name), note: t != null ? 'next shift' + c : '' })]; }
  const f = T[kind]; if (!f) return [];
  for (const p of safe(() => G.places.list().concat(G.places.inner ? G.places.inner() : []), [])) {   // + places inside buildings (Galleria shops)
    if (!p || !isFinite(p.x) || !isFinite(p.y) || p.kind === 'home' || seen.has(p.name)) continue; if (!['venue', 'stall', 'spot', 'station', 'busstop', 'taxistand', 'landmark', 'airport'].includes(p.kind)) continue;
    if (!safe(() => f(info(p)), false)) continue; seen.add(p.name); out.push(row(p, from));
  }
  out.sort((a, b) => (a.open === false) - (b.open === false) || a.d - b.d); out.length = Math.min(out.length, n);
  if (kind === 'social') for (const id of safe(() => G.social.known(), []).slice(0, 12)) { const w = safe(() => G.social.whereIs(id.id || id), null); if (!w || !isFinite(w.x) || (w.sceneId && w.sceneId !== 'city' && !w.placeId)) continue; const nm = safe(() => G.social.npc(id.id || id).name, null) || String(id.id || id); const pl = w.placeId && place(w.placeId);
    out.push({ id: pl ? pl.id : { x: w.x, y: w.y, name: nm }, name: nm + (w.name ? ' is at ' + w.name : ''), x: w.x, y: w.y, d: man(w, from), open: null, note: 'friend', friend: true }); if (out.filter(o => o.friend).length >= 2) break; }
  for (const fn of SOURCES[kind] || []) for (const q of safe(() => fn(from), []) || []) if (q && isFinite(q.x) && isFinite(q.y)) out.push(Object.assign({ d: man(q, from), open: null, note: '' }, q));
  if (home && kind in HOME_NOTE && (kind !== 'hunger' && kind !== 'food' || fridgeFood())) out.push(row(home, from, { name: 'Home', note: HOME_NOTE[kind], home: true, open: null }));
  return out.sort((a, b) => (a.open === false) - (b.open === false) || a.d - b.d);
}

/* ---------- routing ---------- */
const hasBike = () => safe(() => { const h = G.state.home || {}, ids = (h.items || []).map(i => i.itemId).concat(h.storage || [], h.stay || []); return ids.some(id => { const it = safe(() => G.inv.item(id), null); return it ? it.vehicle === 'bike' : /^mall_bike/.test(String(id)); }); }, false);
function busOption(from, D, walk) {
  const w = cityW(); if (!w || !w.busRoutes || !G.transit) return null; let best = null;
  for (const r of w.busRoutes) {
    const S = r.stops.map(id => place(id) || (w.pois || []).find(p => p.id === id)).filter(Boolean), n = S.length; if (n < 2) continue;
    const near = q => S.map((s, i) => [man(s, q), i]).sort((a, b) => a[0] - b[0]).slice(0, 2).map(a => a[1]);
    for (const i of near(from)) for (const j of near(D)) {
      if (i === j) continue; const k = (j - i + n) % n; let ride = 0; const lp = safe(() => G.traffic.loops[r.id], null), ls = lp && lp.stops && lp.stops.length === n ? lp.stops : null;
      if (ls && lp.L) ride = ((ls[j].u - ls[i].u) % lp.L + lp.L) % lp.L; else for (let m = 0; m < k; m++) ride += man(S[(i + m) % n], S[(i + m + 1) % n]);   // the bus's own loop (one-way streets), not a straight line
      const wa = man(S[i], from) * WALK, wb = man(S[j], D) * WALK, nb = safe(() => G.transit.nextBuses(S[i].id).find(b => b.route === r.id), null), wait = nb ? nb.minutes : 20, rm = ride / BUS_V + (k - 1) * BUS_DWELL, total = wa + Math.max(wait - wa, 0) + rm + wb;
      if (wa + wb > walk * WALK * .6) continue;   // (walk is in units here: QA round 3 fixed the minutes-vs-units comparison)
      if (!best || total < best.minutes) best = { mode: 'bus', label: 'Bus ' + r.name, minutes: total, cost: safe(() => G.transit.hasPass() ? 0 : G.transit.fare('bus'), 1.5), route: r.id, line: r.name, stops: k, wait, toward: S[j > i ? n - 1 : j].name, board: pt(S[i]), alight: pt(S[j]), walkA: wa, walkB: wb, ride: rm };
    }
  }
  return best;
}
function trainOption(from, D, walk) {
  if (!G.rail || !G.rail.stations) return null; const ST = G.rail.stations().map(s => { const p = place('st_' + s.id), e = s.entrance || s; return { id: s.id, pid: p ? p.id : 'st_' + s.id, name: s.name + ' Station', x: p ? p.x : e.x, y: p ? p.y : e.y }; }); let best = null;
  const near = q => ST.slice().sort((a, b) => man(a, q) - man(b, q)).slice(0, 2);
  for (const A of near(from)) for (const B of near(D)) {
    if (A.id === B.id) continue; const pl = safe(() => G.rail.plan(A.id, B.id), null); if (!pl || !(pl.stops > 0)) continue;
    const wa = man(A, from) * WALK, wb = man(B, D) * WALK, wait = pl.departsIn != null ? pl.departsIn : pl.wait || 0, ride = Math.max(1, pl.minutes - wait), total = wa + Math.max(wait - wa, 0) + ride + wb;
    if (wa + wb > walk * .8) continue;
    if (!best || total < best.minutes) best = { mode: 'train', label: 'Train ' + pl.line, minutes: total, cost: safe(() => G.transit.hasPass() ? 0 : G.transit.fare('train'), 2.5), line: pl.line, toward: pl.toward, stops: pl.stops, wait, from: A.id, to: B.id, board: { id: A.pid, name: A.name, x: A.x, y: A.y }, alight: { id: B.pid, name: B.name, x: B.x, y: B.y }, walkA: wa, walkB: wb, ride };
  }
  return best;
}
const stopsTxt = k => k + (k === 1 ? ' stop' : ' stops');
export function describe(o) {
  if (!o) return '';
  if (o.mode === 'walk') return `Walk ${fmtDist(o.dist)}`;
  if (o.mode === 'bike') return `Ride ${fmtDist(o.dist)} (riding comes later)`;
  if (o.mode === 'cab') return 'Door to door with MapleCab';
  const tw = o.toward && o.toward !== o.alight.name ? ` toward ${o.toward}` : '', veh = o.mode === 'bus' ? `ride the ${o.line}${tw}` : `${o.line}${tw}`;   // (a loop bus 'toward' your own stop says nothing)
  return `walk to ${o.board.name} (${mins(o.walkA)}) -> ${veh}, ${stopsTxt(o.stops)} -> get off at ${o.alight.name} -> walk ${mins(o.walkB)}`;
}
export function routeTo(dest, from = cityPos()) {
  if (typeof dest === 'string') dest = place(dest) || innerPlace(dest); if (!dest || !isFinite(dest.x) || !isFinite(dest.y)) return [];
  const D = pt(dest), dist = man(D, from), walk = dist * WALK, out = [{ mode: 'walk', label: 'Walk', minutes: walk, cost: 0, dist }];
  if (hasBike()) out.push({ mode: 'bike', label: 'Bike', minutes: walk / 2.2, cost: 0, dist });
  for (const o of [busOption(from, D, dist), trainOption(from, D, dist)]) if (o && ((o.minutes < walk * .9 && o.minutes < walk - 2) || (dist > 170 && o.minutes < walk * 1.1))) out.push(o);
  if (dist > 25 && G.transit && G.transit.fare) { const fare = safe(() => D.id ? G.transit.fare(D.id) : G.transit.fare('taxi', from, D), null); if (fare != null && isFinite(fare)) out.push({ mode: 'cab', label: 'Cab', minutes: dist / CAB_V + 4, cost: safe(() => G.state.flags.firstCabFree, false) ? 0 : fare, free: !!safe(() => G.state.flags.firstCabFree, false) }); }
  for (const o of out) { o.dest = D; o.minutes = Math.max(1, Math.round(o.minutes)); o.text = describe(o); o.costText = o.free ? 'Free - prepaid' : o.cost ? money(o.cost) : 'free'; if (o.wait != null) o.next = o.wait < 1.5 ? 'leaving now' : 'next in ' + mins(o.wait); }
  return out;
}

/* ---------- trips ---------- */
let St = null, mine = false, bar = null, offerFor = null;
const trip = () => (St && St.trip) || null;
function setWP(p) { mine = true; try { G.phone.setWaypoint(p); } catch (e) { } mine = false; }
function end(reason) { if (!trip()) return; St.trip = null; G.emit('nav:end', reason); render(); }
export function cancel() {
  const t = trip(); if (!t) { offerFor = null; return render(); } const wp = safe(() => G.state.phone.waypoint, null);
  if (t.mode === 'cab' && t.stage === 0) { safe(() => G.transit.cancel()); safe(() => { G.state.phone.ride = null; }); }
  if (same(wp, t.board) || same(wp, t.dest)) setWP(null); end('cancel');
}
/* cab trips: stage 0 = meet the cab (called now, or as soon as the player is outside when t.call), 1 = riding, 2 = walk to the door */
function cabTrip(dest, call) { if (safe(() => G.state.phone.waypoint, null)) setWP(null); St.trip = { mode: 'cab', dest: pt(dest), board: null, alight: null, stops: 0, line: 'MapleCab', toward: '', stage: 0, at: false, call: !!call }; G.emit('nav:start', St.trip); render(); return St.trip; }
function callCab() {
  const t = trip(); if (!t || t.mode !== 'cab' || t.stage !== 0 || !t.call || !inCity() || G.cutscene || safe(() => G.transit.pending, null)) return; t.call = false;
  const pr = safe(() => G.transit.callTaxi(t.dest.id && place(t.dest.id) ? t.dest.id : { x: t.dest.x, y: t.dest.y, name: t.dest.name }), null);
  if (pr && pr.then) pr.then(ok => { if (!ok && trip() === t && t.stage < 2) { safe(() => { G.state.phone.ride = null; }); end('cancel'); } }); else end('cancel'); render();
}
export function start(o) {
  if (!o || !o.dest) return null; offerFor = null;
  if (o.mode === 'cab') { St.trip = null; render(); const id = o.dest.id && place(o.dest.id) ? o.dest.id : null; if (id) safe(() => G.phone.open('taxi', { place: id })); else { cabTrip(o.dest, true); callCab(); } return trip(); }
  if (o.mode === 'walk' || o.mode === 'bike') { St.trip = null; setWP(o.dest.id || o.dest); render(); return null; }
  St.trip = { mode: o.mode, dest: o.dest, board: o.board, alight: o.alight, stops: o.stops, line: o.line, toward: o.toward, route: o.route || null, from: o.from || null, to: o.to || null, walkA: Math.round(o.walkA), walkB: Math.max(1, Math.round(o.walkB)), stage: 0, at: false };
  setWP(o.board); G.emit('nav:start', St.trip); render(); return St.trip;
}
function toDest(t) {
  t.stage = 2; t.at = false; const c = safe(() => cityPos(), null);
  if (c && !t.dest.room && man(c, t.dest) < 5) { setWP(null); toast(`You have arrived: ${t.dest.name}`, 'good'); return end('arrived'); }
  setWP(t.dest.id || t.dest); G.emit('nav:stage', t); render();
}
function onRideEnd(kind, where) {
  const t = trip(); if (!t || t.stage >= 2) return;
  if (t.mode === 'cab') { if (kind === 'taxi') toDest(t); return; }
  if (kind !== 'train' && kind !== 'bus') return;
  const ok = kind === t.mode && (kind === 'train' ? normSt(where) === normSt(t.to) : !!t.alight && where === t.alight.id);
  if (ok) toDest(t); else replan(kind === t.mode ? 'missed' : 'other');
}
/** new guidance from where the player is now (wrong / missed stop, or a ride that was lost): walk if it is close, else the same mode again */
export function replan(why) {
  const t = trip(); if (!t) return null; const D = t.dest, from = safe(() => cityPos(), null); if (!from) return null; const opts = routeTo(D, from), walk = opts[0];
  if (!walk || man(from, D) < 5) { toDest(t); return trip(); }
  const alt = t.mode === 'cab' ? null : opts.find(o => o.mode === t.mode && o.board), pick = alt && walk.minutes > 10 && alt.minutes < walk.minutes - 4 ? alt : walk;
  if (pick === walk) { t.walkB = walk.minutes; t.rerouted = true; toDest(t); toast(`New route: walk ${mins(walk.minutes)} to ${D.name}. Follow the arrow.`, 'info', 4600); }
  else { start(pick); const n = trip(); if (n) n.rerouted = true; toast(`New route: ${pick.label} from ${pick.board.name} to ${D.name}. Follow the arrow.`, 'info', 4600); }
  G.emit('nav:reroute', trip(), why || ''); return trip();
}
const narrow = () => typeof innerWidth !== 'undefined' && innerWidth < 600;
function tripText(t) {
  const tw = t.toward && t.alight && t.toward !== t.alight.name ? ` toward ${t.toward}` : '', veh = t.mode === 'bus' ? `${t.line} bus${tw}` : `${t.line}${tw}`;
  const parts = t.mode === 'cab' ? [[0, t.call ? 'head outside to meet your cab' : 'meet your MapleCab at the kerb'], [1, 'ride'], [2, 'walk to the door']]
    : [[0, t.at ? `at ${t.board.name}: board the ${veh}` : `walk to ${t.board.name}`], [1, `${veh} to ${t.alight.name.replace(/ Station$/, '')} (${stopsTxt(t.stops)}) - get off yourself`], [2, `walk ${mins(t.walkB)}`]];
  // compact: the current step in bold + what comes next (the on-screen arrow does the guiding; the full itinerary is in the route card)
  const box = el('span'), cur = parts.find(q => q[0] === t.stage) || parts[parts.length - 1], nx = parts.find(q => q[0] === t.stage + 1);
  box.append(el('b', { text: cur[1] })); if (nx && !narrow()) box.append(el('span', { style: 'opacity:.65', text: ' · then ' + nx[1] })); return box;   // portrait: the current step only (keeps the strip to one or two lines)
}
function render() {
  if (typeof document === 'undefined') return; const t = trip();
  if (!bar) { bar = el('div', { id: 'nav-trip', role: 'status', style: 'position:fixed;left:0;right:0;margin:0 auto;width:fit-content;top:58px;max-width:min(92vw,560px);background:#fff4dc;color:#2a2733;border:2px solid #2a2733;box-shadow:3px 3px 0 #2a2733;padding:5px 8px;font:13px/1.35 "Pixelify Sans",system-ui,sans-serif;display:none;gap:6px;align-items:center;flex-wrap:wrap;pointer-events:auto' }); for (const ev of ['pointerdown', 'pointerup', 'click']) bar.addEventListener(ev, e => e.stopPropagation()); root().append(bar); }
  bar.replaceChildren(); const x = fn => el('button', { text: 'x', 'aria-label': 'Close', style: 'min-width:26px;min-height:26px;margin-left:auto', onclick: fn });
  if (offerFor) {
    const opts = routeTo(offerFor); bar.style.zIndex = '4000'; bar.style.display = 'flex'; bar.append(el('b', { text: `To ${offerFor.name}: how will you get there?` }), x(() => { offerFor = null; render(); }));
    for (const o of opts) bar.append(el('button', { 'data-nav': o.mode, title: o.text, style: 'min-height:30px;padding:2px 8px', text: `${o.label} · ${mins(o.minutes)} · ${o.costText}`, onclick: () => start(o) }));
  } else if (t && !G.onTitle && !safe(() => G.phone.isOpen, false)) { bar.style.zIndex = '40'; bar.style.display = 'flex'; bar.append(el('span', { style: 'flex:1 1 0;min-width:0' }, el('b', { text: narrow() ? `To ${t.dest.name}: ` : `Trip to ${t.dest.name}: ` }), tripText(t)), x(cancel)); }
  else bar.style.display = 'none';
  placeBar();
}
/* the strip sits just under the HUD's top cluster (clock + needs bar, money + speed), never on top of it; the goals widget moves down under the strip */
function placeBar() {
  if (!bar) return; const gw = document.getElementById('goalsw');
  const ts = document.getElementById('toasts');
  if (bar.style.display === 'none') { for (const e of [gw, ts]) if (e && e._navPush) { e.style.top = ''; e._navPush = false; } safe(() => G.phone.placeBanners()); return; }
  bar.style.top = '58px'; const r = bar.getBoundingClientRect(), top = Math.max(58, Math.round(clearTop(r.left, r.right, bar) + 6)); bar.style.top = top + 'px';
  if (gw) { const g = gw.getBoundingClientRect(), b = top + r.height + 8, uiTop = (gw.offsetParent || document.body).getBoundingClientRect().top; if (g.width && g.right > r.left && g.left < r.right && (gw._navPush || g.top < b)) { gw.style.top = Math.round(b - uiTop) + 'px'; gw._navPush = true; } }
  if (ts) { if (ts._navPush) { ts.style.top = ''; ts._navPush = false; } const q = ts.getBoundingClientRect(), up = (ts.offsetParent || document.body).getBoundingClientRect().top; if (q.top < top + r.height + 4) { ts.style.top = Math.round(top + r.height + 8 - up) + 'px'; ts._navPush = true; } }   // toasts too
  safe(() => G.phone.placeBanners());
}
export function offer(p) { p = typeof p === 'string' ? place(p) : p; if (!p || !isFinite(p.x)) return []; const o = routeTo(p); if (o.length < 2) return o; offerFor = pt(p); render(); return o; }

export const order = 130;
export function init() {
  const boot = () => { St = G.state.nav && typeof G.state.nav === 'object' ? G.state.nav : G.defineState('nav', () => ({ trip: null })); if (!('trip' in St)) St.trip = null; };
  G.defineState('nav', () => ({ trip: null })); boot();
  G.on('load', () => { boot(); offerFor = null; render(); }); G.on('scene', () => render()); G.on('game:start', () => render());   // (Continue from the title: the strip comes back with the trip)
  G.on('ride:start', kind => {
    const t = trip(); if (!t || t.stage !== 0 || kind !== KIND[t.mode]) return; t.stage = 1; t.at = false; if (same(safe(() => G.state.phone.waypoint, null), t.board)) setWP(null);
    if (kind === 'train') safe(() => { const c = G.state.rail.cur, pl = G.rail.plan(c.from, t.to || c.to); t.line = G.rail.lines[c.dir].name; if (pl && pl.dir === c.dir) { t.toward = pl.toward; t.stops = pl.stops; } });
    G.emit('nav:stage', t); render();
  });
  G.on('taxi:request', id => { const p = place(id); if (p) { cabTrip(p, !inCity()); if (!inCity()) toast('Head outside: your cab will be called when you reach the street. Follow the arrow.', 'info', 4200); } });
  G.on('taxi:cancel', () => { const t = trip(); if (t && t.mode === 'cab' && t.stage === 0) end('cancel'); });   // (also a cab requested indoors and cancelled before it was called)
  G.on('scene', s => { if (s && s.id === 'city') setTimeout(callCab, 700); });
  // watchdog: a trip that says "riding" while nothing is being ridden (ride lost on load, vehicle despawned) gets new guidance; a cab that vanished is called again
  let lost = 0; G.addSystem({ name: 'navigator', update(dt) {
    const t = trip(); if (!t || G.busy || G.cutscene) { lost = 0; return; } const riding = !!safe(() => G.transit.ride, null) || (G.scene && (G.scene.id === 'train' || G.scene.id === 'airtram'));
    if (t.stage === 1 && !riding) { if ((lost += dt) > 2.5) { lost = 0; replan('lost'); } }
    else if (t.mode === 'cab' && t.stage === 0 && !t.call && !riding && inCity() && !safe(() => G.transit.pending, null)) { if ((lost += dt) > 3) { lost = 0; t.call = true; callCab(); } }
    else lost = 0;
  } });
  G.on('ride:end', onRideEnd);
  G.on('waypoint:arrived', wp => { const t = trip(); if (!t) return; if (t.stage >= 2 || (wp && (wp.id ? wp.id === t.dest.id : wp.x === t.dest.x && wp.y === t.dest.y))) return end('arrived'); if (t.stage === 0) { t.at = true; render(); } });
  G.on('waypoint', p => {
    if (mine) return; const t = trip();
    if (p && t && !(p.id && (p.id === (t.board && t.board.id) || p.id === t.dest.id))) end('replaced');
    // a waypoint set from inside the phone (Wander's "Take me there", ...): offer the ways to get there
    if (p && safe(() => G.phone.isOpen, false) && !trip()) { const o = routeTo(p); if (o.length > 1) { offerFor = pt(p); render(); } } else if (!p && offerFor) { offerFor = null; render(); }
  });
  G.on('phone:close', () => { offerFor = null; render(); }); G.on('phone:open', () => setTimeout(render, 0));
  if (typeof addEventListener !== 'undefined') addEventListener('resize', () => render()); setInterval(() => { if (bar && bar.style.display !== 'none') placeBar(); }, 1000);
  G.nav = { find, matches, routeTo, describe, start, trip, cancel, offer, replan, fmtDist, clearTop, M_PER_U, addSource: (kind, fn) => { (SOURCES[kind] || (SOURCES[kind] = [])).push(fn); } };
  render();
}
