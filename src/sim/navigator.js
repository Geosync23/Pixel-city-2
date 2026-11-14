// Navigator: "what do I need -> where is it -> how do I get there" (shared by the HUD need chooser and the phone Map app).
// G.nav = {
//   find(kind, n = 4, from?)  -> [{ id (place id | {x,y,name}), name, x, y, d (city units, manhattan), open: true|false|null, note, home?, friend? }]  closed places last.
//        kinds: food groceries coffee home work fun shopping transit  +  the needs: hunger energy hygiene fun social bladder (restrooms)
//   addSource(kind, fn(from) -> rows)   extra rows for a kind that are not registered places (park restroom pavilions)
//   matches(place, kind)      -> bool (data-driven: venue.offers {menu, shop[], services[], functions[]}, venue.type, guide entry type/chapter/acts, place kind)
//   routeTo(place | id | {x,y,name}, from?) -> options [{ mode: walk|bike|bus|train|cab, label, minutes, cost, text, dest, board?, alight?, stops?, line?, toward?, wait? }]
//   start(option)             walk/bike: waypoint to the destination. bus/train: MULTI-LEG trip (waypoint to the boarding stop first; after 'ride:end' it switches
//                             to the destination; cleared on arrival / cancel). cab: opens MapleCab.
//   trip() -> G.state.nav.trip | null      cancel()      offer(place) -> shows the "How will you get there?" sheet in the banner
// }
// State: G.state.nav = { trip: null | { mode, dest, board, alight, stops, line, toward, stage: 0 walk to stop | 1 riding | 2 walk to destination, at: bool } }.
// The trip banner is a DOM strip under the HUD (#nav-trip). Events: nav:start(trip), nav:stage(trip), nav:end(reason).
import { G } from '../core/game.js';
import { el, root } from '../ui/kit.js';
import { openState, cityPos, place, homePlace, money } from '../ui/phone_util.js';

const WALK = 1.15 / 3.6, BUS_V = 7, CAB_V = 9;   // game minutes per city unit on foot (player speed 3.6 u/s, 1 game min per real second, + corners)
const man = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y), safe = (f, d) => { try { const v = f(); return v === undefined ? d : v; } catch (e) { return d; } };
const cityW = () => { const s = G.sceneCache && G.sceneCache.get('city'); return s ? s.world : G.scene && G.scene.id === 'city' ? G.scene.world : null; };
const mins = m => Math.max(1, Math.round(m)) + ' min';
const pt = p => p ? { id: typeof p.id === 'string' ? p.id : null, name: p.name || 'Waypoint', x: p.x, y: p.y } : null;

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
  for (const p of safe(() => G.places.list(), [])) {
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
      if (i === j) continue; const k = (j - i + n) % n; let ride = 0; for (let m = 0; m < k; m++) ride += man(S[(i + m) % n], S[(i + m + 1) % n]);
      const wa = man(S[i], from) * WALK, wb = man(S[j], D) * WALK, nb = safe(() => G.transit.nextBuses(S[i].id).find(b => b.route === r.id), null), wait = nb ? nb.minutes : 20, rm = ride / BUS_V + k * .5, total = wa + Math.max(wait - wa, 0) + rm + wb;
      if (wa + wb > walk * .6) continue;
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
  if (o.mode === 'walk') return `Walk ${Math.round(o.dist)} m`;
  if (o.mode === 'bike') return `Ride ${Math.round(o.dist)} m (riding comes later)`;
  if (o.mode === 'cab') return 'Door to door with MapleCab';
  const veh = o.mode === 'bus' ? `ride the ${o.line} toward ${o.toward}` : `${o.line} toward ${o.toward}`;
  return `walk to ${o.board.name} (${mins(o.walkA)}) -> ${veh}, ${stopsTxt(o.stops)} -> get off at ${o.alight.name} -> walk ${mins(o.walkB)}`;
}
export function routeTo(dest, from = cityPos()) {
  if (typeof dest === 'string') dest = place(dest); if (!dest || !isFinite(dest.x) || !isFinite(dest.y)) return [];
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
export function cancel() { const t = trip(); if (!t) { offerFor = null; return render(); } const wp = safe(() => G.state.phone.waypoint, null); if (wp && (wp.id === t.board.id || (wp.x === t.board.x && wp.y === t.board.y) || wp.id === t.dest.id)) setWP(null); end('cancel'); }
export function start(o) {
  if (!o || !o.dest) return null; offerFor = null;
  if (o.mode === 'cab') { St.trip = null; render(); const id = o.dest.id; safe(() => id ? G.phone.open('taxi', { place: id }) : G.transit.callTaxi({ x: o.dest.x, y: o.dest.y, name: o.dest.name })); return null; }
  if (o.mode === 'walk' || o.mode === 'bike') { St.trip = null; setWP(o.dest.id || o.dest); render(); return null; }
  St.trip = { mode: o.mode, dest: o.dest, board: o.board, alight: o.alight, stops: o.stops, line: o.line, toward: o.toward, route: o.route || null, from: o.from || null, to: o.to || null, walkA: Math.round(o.walkA), walkB: Math.max(1, Math.round(o.walkB)), stage: 0, at: false };
  setWP(o.board); G.emit('nav:start', St.trip); render(); return St.trip;
}
function onRideEnd(kind) { const t = trip(); if (!t || t.stage >= 2 || (kind && kind !== t.mode && kind !== 'train' && kind !== 'bus')) return; t.stage = 2; t.at = false; const c = safe(() => cityPos(), null); if (c && man(c, t.dest) < 5) { setWP(null); return end('arrived'); } setWP(t.dest.id || t.dest); G.emit('nav:stage', t); render(); }
function tripText(t) {
  const veh = t.mode === 'bus' ? `${t.line} bus toward ${t.toward}` : `${t.line} toward ${t.toward}`, parts = [[0, t.at ? `at ${t.board.name}: board the ${veh}` : `walk to ${t.board.name}`], [1, `${veh} to ${t.alight.name.replace(/ Station$/, '')} (${stopsTxt(t.stops)})`], [2, `walk ${mins(t.walkB)}`]];
  const box = el('span'); parts.forEach(([s, txt], i) => { if (i) box.append(' -> '); box.append(el(s === t.stage ? 'b' : 'span', { style: s < t.stage ? 'opacity:.5;text-decoration:line-through' : '', text: txt })); }); return box;
}
function render() {
  if (typeof document === 'undefined') return; const t = trip();
  if (!bar) { bar = el('div', { id: 'nav-trip', role: 'status', style: 'position:fixed;left:0;right:0;margin:0 auto;width:fit-content;top:58px;max-width:min(92vw,560px);background:#fff4dc;color:#2a2733;border:2px solid #2a2733;box-shadow:3px 3px 0 #2a2733;padding:5px 8px;font:13px/1.35 "Pixelify Sans",system-ui,sans-serif;display:none;gap:6px;align-items:center;flex-wrap:wrap;pointer-events:auto' }); for (const ev of ['pointerdown', 'pointerup', 'click']) bar.addEventListener(ev, e => e.stopPropagation()); root().append(bar); }
  bar.replaceChildren(); const x = fn => el('button', { text: 'x', 'aria-label': 'Close', style: 'min-width:26px;min-height:26px;margin-left:auto', onclick: fn });
  if (offerFor) {
    const opts = routeTo(offerFor); bar.style.zIndex = '4000'; bar.style.display = 'flex'; bar.append(el('b', { text: `To ${offerFor.name}: how will you get there?` }), x(() => { offerFor = null; render(); }));
    for (const o of opts) bar.append(el('button', { 'data-nav': o.mode, title: o.text, style: 'min-height:30px;padding:2px 8px', text: `${o.label} · ${mins(o.minutes)} · ${o.costText}`, onclick: () => start(o) }));
  } else if (t && !G.onTitle && !safe(() => G.phone.isOpen, false)) { bar.style.zIndex = '40'; bar.style.display = 'flex'; bar.append(el('span', null, el('b', { text: `Trip to ${t.dest.name}: ` }), tripText(t)), x(cancel)); }
  else bar.style.display = 'none';
}
export function offer(p) { p = typeof p === 'string' ? place(p) : p; if (!p || !isFinite(p.x)) return []; const o = routeTo(p); if (o.length < 2) return o; offerFor = pt(p); render(); return o; }

export const order = 130;
export function init() {
  const boot = () => { St = G.state.nav && typeof G.state.nav === 'object' ? G.state.nav : G.defineState('nav', () => ({ trip: null })); if (!('trip' in St)) St.trip = null; };
  G.defineState('nav', () => ({ trip: null })); boot();
  G.on('load', () => { boot(); offerFor = null; render(); }); G.on('scene', () => render());
  G.on('ride:start', kind => { const t = trip(); if (t && t.stage === 0 && (kind === t.mode)) { t.stage = 1; render(); } });
  G.on('ride:end', onRideEnd);
  G.on('waypoint:arrived', wp => { const t = trip(); if (!t) return; if (t.stage >= 2 || (wp && (wp.id ? wp.id === t.dest.id : wp.x === t.dest.x && wp.y === t.dest.y))) return end('arrived'); if (t.stage === 0) { t.at = true; render(); } });
  G.on('waypoint', p => {
    if (mine) return; const t = trip();
    if (p && t && !(p.id && (p.id === t.board.id || p.id === t.dest.id))) end('replaced');
    // a waypoint set from inside the phone (Wander's "Take me there", ...): offer the ways to get there
    if (p && safe(() => G.phone.isOpen, false) && !trip()) { const o = routeTo(p); if (o.length > 1) { offerFor = pt(p); render(); } } else if (!p && offerFor) { offerFor = null; render(); }
  });
  G.on('phone:close', () => { offerFor = null; render(); }); G.on('phone:open', () => setTimeout(render, 0));
  G.nav = { find, matches, routeTo, describe, start, trip, cancel, offer, addSource: (kind, fn) => { (SOURCES[kind] || (SOURCES[kind] = [])).push(fn); } };
  render();
}
