// Transit gameplay: taxis (call / hail / stands) and bus rides, on top of sim/traffic.js. Train rides plug in via registerMode.
//
// G.transit
//   callTaxi(placeId | null, opts?) -> Promise<bool>   a cab spawns out of view, drives to the lane nearest the player, honks ("Your MapleCab is here"),
//        the player boards automatically within 3.3 units (or via the "Get in" interactable), rides to the place (G.places id, poi id, or {x,y,name}),
//        pays on arrival. placeId null -> destination picker on boarding. opts: { free: bool, auto: false (board only via the interactable), silent, fare }.
//        Resolves true on arrival, false if cancelled / not possible. If G.state.flags.firstCabFree is truthy the ride is free and the flag is cleared.
//   hailTaxi() -> Promise<bool>          hails the nearest free cab within 28 units (else calls one); destination picker on boarding
//   cancel()                             cancel a called/hailed cab that has not been boarded
//   skipRide()                           fade + fast-forward a taxi ride to its destination (the clock jumps to the ride's set end)
//   cabEstimate(to, from?) -> { wait, ride, minutes, len }   QA7: pick-up wait + the ride's game minutes (set by the road route, CAB_RIDE)   busStopsLeft() -> n | null
//   fare(kind, from?, to?) -> number     kind 'taxi' | 'bus' | 'train' | registered mode; from/to: place id | {x,y}; from defaults to the player.
//        fare(placeId) is shorthand for a taxi from the player. Taxi: economy.js FARES.taxi (Manhattan distance, night multiplier, airport flat).
//   boardBus(routeId?, stopId?, destStopId?) -> Promise<bool>   wait at a stop (default: nearest) for a route (default: first to arrive) and ride
//   nextBuses(stopId) -> [{ route, num, name, color, minutes }]      openStop(stopId) opens the stop panel      stops() -> busstop pois
//   ride -> null | { kind, vehicle, destination, progress 0..1, fare?, district }      onArrive(fn(ride)) -> unsubscribe
//   pending -> null | { cab, state: 'coming' | 'hail' | 'waiting' | 'picking' }
//   registerMode(name, impl)             impl: { ride(from, to, opts) -> Promise, fare?(from, to) -> number }; exposes G.transit['ride' + Name] (e.g. rideTrain)
//   beginRide({ kind, vehicle?, destination }) / endRide(ok = true)   for external modes (train): sets G.transit.ride, emits ride:start / ride:end + onArrive
//   payFare(kind, from?, to?) -> bool    charges fare() (free with a transit pass for bus/train)      hasPass() -> bool
//   roadGraph(), route(fromPoint, toPoint) (also module exports)
// Events: 'ride:start'(kind, placeId), 'ride:end'(kind, placeId), 'ride:district'(districtKey) when the ride vehicle enters a new district,
//         'taxi:here'(cab) when a called/hailed cab is waiting at the curb, 'taxi:cancel'.
// State: G.state.transit = { rides: { taxi, bus } } (stats only; passes live in G.inv; a ride in progress is not saved).
import { G } from '../core/game.js';
import { GT } from '../engine/world.js';
import { FARES } from '../data/economy.js';
import { el, toast, modal, choose, root } from '../ui/kit.js';
import { roadGraph, route } from './traffic.js';
export { roadGraph, route };

export const order = 62;
const CSS = `.ride-hud{position:absolute;left:50%;bottom:max(14px,env(safe-area-inset-bottom,0px));transform:translateX(-50%);width:min(340px,92vw);background:var(--panel);border:2px solid var(--edge);box-shadow:0 3px 0 var(--edge);padding:8px 10px;display:flex;flex-direction:column;gap:6px;pointer-events:auto;z-index:6;font-size:14px}
.ride-hud .ride-t{font-weight:700}.ride-hud .ride-s{opacity:.85;font-size:13px}.ride-bar{height:8px;border:2px solid var(--edge);background:var(--shade)}.ride-bar i{display:block;height:100%;background:#f2c230;width:0}
.ride-btns{display:flex;gap:6px;flex-wrap:wrap}.ride-btns button{flex:1;min-height:34px}
.tr-row{display:flex;gap:8px;align-items:center;padding:3px 0}.tr-num{min-width:24px;text-align:center;color:#fff;padding:1px 5px;border:2px solid var(--edge)}.tr-eta{margin-left:auto;font-weight:700}.tr-fare{margin-bottom:6px;opacity:.85}.tr-btns{display:flex;flex-direction:column;gap:6px;margin-top:8px}`;
const DN = { downtown: 'Downtown', oldtown: 'Old Town', harbor: 'Harborside', hillcrest: 'Hillcrest', maplewood: 'Maplewood', arts: 'Arts Quarter', railyard: 'Railyard', park: 'Central Park', airport: 'Airport' };
let S = null, ride = null, pend = null, wait = null, hud = null, tI = 0, tD = 0;
const arriveFns = [], modes = {}, idle = [];
const TX = () => G.traffic, W = () => G.sceneCache.get('city').world, inCity = () => !!G.scene && G.scene.id === 'city';
const fmt = n => G.money && G.money.fmt ? G.money.fmt(n) : '$' + n;
const hasPass = () => !!(G.inv && G.inv.hasAccess && G.inv.hasAccess('transit'));
const sfx = n => { try { G.audio && G.audio.sfx && G.audio.sfx(n); } catch (e) { } };
// nav hooks (sim/navigator.js trips; the guide arrow + "This is your stop" banner are ui/navarrow.js): the active bus trip, if any. NAV_HOLD = extra real seconds the bus waits at your stop.
/* QA round 7: a cab ride's GAME time comes from the road route, not from how long the cut takes: CAB_RIDE.fixed + CAB_RIDE.perUnit x route length.
   The ride owns the clock (G.cutscene.clock: core/game.js does not advance time during it; rideTick moves the clock with the cab's progress), so a ride costs
   the same at 1x / 2x / 4x and through red lights; the cut itself plays in whatever real time it takes. The pick-up is dispatched to take about CAB_PICKUP
   game minutes (x the weather's taxiWaitMult): the cab waits off screen when it is closer, and is placed at the kerb when it is late.
   cabEstimate(to, from?) -> { wait, ride, minutes, len } is what the Map / MapleCab / My Day show (sim/navigator.js uses it). */
export const CAB_RIDE = { fixed: 1, perUnit: .06, detour: 1.3 }, CAB_PICKUP = 6, CAB_LATE = 2, CAB_CAR_V = 4.5;   // CAB_CAR_V: measured pace of a dispatched cab (units per game minute = per world second)
const BUS_RIDE_V = 10, BUS_CLOCK = .2, NAV_HOLD = 9, navTrip = () => { try { const t = G.nav && G.nav.trip && G.nav.trip(); return t && t.mode === 'bus' && t.alight ? t : null; } catch (e) { return null; } };

function placeOf(id) {
  if (!id) return null; if (typeof id === 'object') return id; let p = G.places && G.places.get && G.places.get(id); if (p) return p;
  const c = G.sceneCache.get('city'), q = c && c.world.pois.find(o => o.id === id || o.id === 'door:' + id || o.id === 'station:' + id); return q ? { id, name: q.name || id, x: q.x, y: q.y, poi: q } : null;
}
function herePos() { if (inCity()) return G.player; const s = G.state.phone && G.state.phone.cityPos; return s || G.state.player; }
function taxiFare(from, to) {
  const T = FARES.taxi, w = G.sceneCache.get('city') && W(); if (!from || !to) return T.minFare;
  if (w && (w.districtAt(from.x, from.y) === 'airport' || w.districtAt(to.x, to.y) === 'airport')) return T.airportFlat;
  let f = T.base + T.perUnit * (Math.abs(from.x - to.x) + Math.abs(from.y - to.y)); const h = G.now().hour; if (h >= T.nightHours[0] || h < T.nightHours[1]) f *= T.nightMult;
  return Math.max(T.minFare, Math.min(T.maxFare, Math.round(f * 4) / 4));
}
const pickupMin = () => { let m = 1; try { m = (G.weather && G.weather.taxiWaitMult && G.weather.taxiWaitMult()) || 1; } catch (e) { } return CAB_PICKUP * m; };
const cabRideMin = len => CAB_RIDE.fixed + CAB_RIDE.perUnit * Math.max(0, len || 0);
const cabCharge = (len, a, b) => Math.min(len, (Math.abs(a.x - b.x) + Math.abs(a.y - b.y)) * CAB_RIDE.detour + 15);   // a one-way loop does not bill you: at most `detour` x the straight-line (Manhattan) distance + 15
function cabLane(pl) { const g = roadGraph(); return pl.poi && pl.poi.lane ? g.nearestLane(pl.poi.lane.x, pl.poi.lane.y) : g.nearestLane(pl.x, pl.y); }
let estC = null;
function cabEstimate(to, from) {
  const a = from ? placeOf(from) : herePos(), b = placeOf(to); if (!a || !b || !isFinite(a.x) || !isFinite(b.x)) return null;
  const key = Math.round(a.x) + ',' + Math.round(a.y) + '>' + Math.round(b.x) + ',' + Math.round(b.y); let len = estC && estC.k === key ? estC.len : null;
  if (len == null) { try { const g = roadGraph(), r = g.route(g.nearestLane(a.x, a.y), cabLane(b)); len = r ? cabCharge(r.len, a, b) : null; } catch (e) { len = null; } if (len == null) len = (Math.abs(a.x - b.x) + Math.abs(a.y - b.y)) * 1.15; estC = { k: key, len }; }
  const wait = pickupMin(), rideM = cabRideMin(len); return { wait, ride: rideM, minutes: wait + rideM, len };
}
function fare(kind, from, to) {
  if (kind !== 'taxi' && kind !== 'bus' && kind !== 'train' && !modes[kind]) { to = kind; from = undefined; kind = 'taxi'; }
  if (kind === 'taxi') return taxiFare(placeOf(from) || herePos(), placeOf(to));
  const m = modes[kind]; if (m && m.fare) return m.fare(from, to); return hasPass() ? 0 : FARES[kind] ? FARES[kind].single : 0;
}
function payFare(kind, from, to) { const f = fare(kind, from, to); if (f <= 0 || !G.money) return true; return G.money.pay(f, kind === 'taxi' ? 'Taxi' : kind === 'bus' ? 'Bus fare' : 'Train fare') !== false; }
/** nearest walkable non-road tile to (x,y), leaning toward (tx,ty) */
function curbSpot(x, y, tx, ty) {
  const w = W(); let bx = x, by = y, bd = 1e9;
  for (let dy = -7; dy <= 7; dy += .5) for (let dx = -7; dx <= 7; dx += .5) {
    const px = Math.floor(x + dx) + .5, py = Math.floor(y + dy) + .5; if (w.isBlocked(px, py)) continue; const t = w.tileType(px, py); if (t === GT.asphalt || t === GT.water || t === GT.void) continue;
    const c = Math.hypot(px - x, py - y) + .25 * Math.hypot(px - tx, py - ty); if (c < bd) { bd = c; bx = px; by = py; }
  }
  return { x: bx, y: by };
}

/* ---------- ride core ---------- */
function showHud(title, sub, btns) {
  hideHud(); const t = el('div.ride-t', { text: title }), s = el('div.ride-s', { text: sub || '' }), fill = el('i'), b = el('div.ride-btns', null, btns);
  hud = { root: el('div.ride-hud', null, t, s, el('div.ride-bar', null, fill), b), t, s, fill }; root().append(hud.root);
}
function hideHud() { if (hud) { hud.root.remove(); hud = null; } }
function begin(r) {
  const p = G.player; ride = r; r.t = 0; r.district = W().districtAt(r.vehicle.x, r.vehicle.y); p.stop && p.stop(); p.hidden = true; G.target = null; G.pending = null;
  r.t0 = G.state.t; G.camTarget = r.vehicle; r.vehicle.ghost = true; G.cutscene = { update: rideTick, ride: true, clock: r.kind === 'taxi' }; G.emit('ride:start', r.kind, r.destination);   /* clock: the ride owns the game clock (QA7) */
}
function finish(sp, ok = true) {
  const r = ride, p = G.player; if (!r) return; ride = null; p.x = sp.x; p.y = sp.y; p.z = W().heightAt(sp.x, sp.y); p.hidden = false; p.path = null;
  if (r.bus) { r.bus.hold = false; if (r.vehicle && r.vehicle.vbase) r.vehicle.vmax = r.vehicle.vbase; if (r.vehicle) { r.vehicle.pre = false; r.vehicle.ride = false; } if (G.state.speed === BUS_CLOCK) G.state.speed = r.prevSpeed || 1; } if (r.vehicle) r.vehicle.ghost = false; G.camTarget = null; G.cutscene = null; hideHud(); if (S && S.rides) S.rides[r.kind] = (S.rides[r.kind] || 0) + 1;
  G.emit('ride:end', r.kind, r.destination); for (const f of arriveFns.slice()) { try { f(r); } catch (e) { console.error(e); } } if (r.resolve) r.resolve(ok);
}
function rideTick(dt) {
  const r = ride; if (!r) { G.cutscene = null; return; } const v = r.vehicle, p = G.player; p.x = v.x; p.y = v.y; p.z = v.z; r.t += dt;
  // bus rides run the clock at BUS_CLOCK (see boardNow); a cab ride moves the clock with its progress (QA7: rideClock)
  if (!v.active) { if (r.kind === 'taxi') rideClock(r, r.progress); return finish(curbSpot(p.x, p.y, p.x, p.y), false); }
  if (r.holdT > 0 && (r.holdT -= dt) <= 0 && r.bus) r.bus.hold = false;
  if (r.kind === 'taxi') { r.done += v.v * dt; r.progress = Math.min(1, r.done / r.total); rideClock(r, r.progress); if (r.t > r.total / 4 + 90 && !r.skipping) skipRide(); }
  if ((tD -= dt) <= 0) {
    tD = .35; const k = W().districtAt(v.x, v.y); if (k && k !== r.district) { r.district = k; G.emit('ride:district', k); }
    if (hud) {
      hud.fill.style.width = Math.round(r.progress * 100) + '%';
      if (r.kind === 'bus') { const b = r.bus, ns = b.loop.stops[b.nsi], d = r.destination && TX().busStopName(r.destination), left = busLeft(r), ob = r.offBtn;
        if (left !== null) {   /* QA7: on a Map trip the right stop is unmistakable: the stop count is live, and "Get off" is only offered at (or just before) YOUR stop */
          const mn = navTrip().alight.name, show = left === 0 || (left === 1 && !b.atStop);
          hud.s.textContent = left === 0 ? 'THIS IS YOUR STOP: ' + mn : left === 1 ? (b.atStop ? 'Stay on: your stop ' + mn + ' is next' : 'Your stop is next: ' + mn) : (b.atStop ? 'At ' : 'Next: ') + ns.poi.name + ' · stay on, your stop ' + mn + ' is ' + left + ' stops away';
          if (ob) { ob.style.display = show ? '' : 'none'; ob.classList.toggle('primary', show); ob.textContent = left === 0 ? 'Get off here: your stop' : r.offNext ? 'Getting off at ' + mn + ' ✓' : 'Get off at ' + mn + ' (next)'; }
        } else {
          hud.s.textContent = (b.atStop ? 'At: ' : 'Next stop: ') + ns.poi.name + (r.offNext ? ' - getting off here' : d ? ' - getting off at ' + d : '');
          if (ob) { ob.style.display = ''; ob.classList.remove('primary'); const nx = b.loop.stops[(b.nsi + (b.atStop ? 1 : 0)) % b.loop.stops.length].poi.name; ob.textContent = b.atStop && b.atStop !== r.from ? 'Get off here (' + ns.poi.name + ')' : r.offNext ? 'Getting off at ' + nx + ' ✓' : 'Get off at ' + nx; }
        } }
      else hud.s.textContent = (DN[r.district] || 'Maple Bay') + (r.free ? ' - pre-paid' : ' - fare ' + fmt(r.fare));
    }
  }
}

/* ---------- taxis ---------- */
/** QA7: the game clock during a cab ride = start + ride minutes x progress (never backwards) */
function rideClock(r, k) { if (!r || !(r.T > 0) || r.t0 == null) return; const want = r.t0 + r.T * Math.max(0, Math.min(1, k)); if (want > G.state.t) G.advance(want - G.state.t); }
function freeCab(c) {
  if (!c.active || c.stand) return; c.parked = false; c.halt = false; c.keep = false; c.role = ''; c.pre = false; c.vmax = c.vbase; c.curb = 0; c.stop = null; c.onStop = null; c.taxiFree = true; c.setParams({ free: true }); TX().setPlan(c, null);
}
function startTaxiRide(cab, pl, opts, resolve) {
  const g = roadGraph(), dst = cabLane(pl), p = G.player;
  const f = opts.fare !== undefined ? opts.fare : taxiFare({ x: p.x, y: p.y }, pl), free = !!opts.free || !!G.state.flags.firstCabFree;
  if (cab.stand) { const j = cab.stand.cabs.indexOf(cab); if (j >= 0) cab.stand.cabs.splice(j, 1); cab.stand = null; }
  cab.parked = false; cab.halt = false; cab.curb = 0; cab.role = 'svc'; cab.keep = true; cab.taxiFree = false; cab.setParams({ free: false }); cab.pre = true; cab.vmax = 10; cab.stuck = 0;
  const rt = g.route({ e: cab.e, off: cab.off, s: cab.s, x: cab.x, y: cab.y }, dst);
  if (rt) { TX().setPlan(cab, rt); cab.stop = { e: rt.to.e, s: rt.to.s }; cab.onStop = arriveTaxi; }
  begin({ kind: 'taxi', vehicle: cab, destination: pl.id || null, place: pl, progress: 0, fare: f, free, total: rt ? Math.max(1, rt.len) : 1, done: 0, route: rt, resolve, T: cabRideMin(rt ? cabCharge(rt.len, p, pl) : (Math.abs(p.x - pl.x) + Math.abs(p.y - pl.y)) * 1.15) });
  showHud('MapleCab to ' + (pl.name || 'your destination'), '', el('button', { text: 'Skip ride', onclick: skipRide }));
  if (!rt) skipRide();
}
function arriveTaxi() {
  const r = ride; if (!r || r.kind !== 'taxi') return; const v = r.vehicle, pl = r.place;
  if (r.free) { if (G.state.flags.firstCabFree) G.state.flags.firstCabFree = false; } else if (G.money && G.money.pay) G.money.pay(r.fare, 'Taxi');
  r.progress = 1; rideClock(r, 1); v.parked = true; v.stop = null; v.onStop = null; idle.push({ v, t: 2.5 });
  finish(curbSpot(v.x, v.y, pl.x, pl.y)); const far = Math.abs(G.player.x - pl.x) + Math.abs(G.player.y - pl.y), m = Math.round(far * 17 / 10) * 10;   /* QA9: the University's kerb is 490 m from its door: say so, not 'Arrived' */
  toast((far > 10 ? `As close as the road goes: ${pl.name || 'your destination'} is ${m} m on foot` : 'Arrived: ' + (pl.name || 'destination')) + (r.free ? ' - ride pre-paid' : ' - fare ' + fmt(r.fare)), 'info', far > 10 ? 4500 : undefined);
}
function skipRide() {
  const r = ride; if (!r || r.kind !== 'taxi' || r.skipping) return; r.skipping = true; const f = G.fadeEl; G.modal++; if (f) f.classList.add('on');
  setTimeout(() => {
    try {
      if (ride === r) { const v = r.vehicle, rt = r.route; if (rt) { TX().setPlan(v, null); TX().place(v, rt.to.e, rt.to.off, rt.to.s); } v.v = 0; rideClock(r, 1); G.player.x = v.x; G.player.y = v.y; arriveTaxi(); G.snapCam(); }
    } finally { G.modal--; setTimeout(() => f && f.classList.remove('on'), 80); }
  }, 280);
}
function cabHere(c) {
  if (!pend || pend.cab !== c) return; c.parked = true; c.v = 0; pend.state = 'waiting'; pend.t = 0; pend.reach = 0; sfx('honk');
  if (pend.again) { G.emit('taxi:here', c); return; }   /* QA10: a cab that drove round to you again honks, no second banner */
  if (!pend.opts.silent) { let shown = null; try { shown = G.phone && G.phone.notify && G.phone.notify({ app: 'taxi', title: 'MapleCab', text: 'Your MapleCab is here.' }); } catch (e) { } if (!shown || (G.state.phone && G.state.phone.settings && G.state.phone.settings.banners === false)) toast('Your MapleCab is here.'); }   /* QA9: the banner, or a toast if there is no phone: not both */
  G.emit('taxi:here', c);
}
/* QA7: a cab that is still far away when the pick-up is due (one-way streets, red lights) is moved to the same street a few car lengths up from you and drives the rest */
function lateCab(pd, c) {
  pd.near = true; const g = roadGraph(), e = pd.pick.e, s0 = g.span(e)[0], room = (pd.pick.s - s0) * e.d, back = Math.max(0, Math.min(14, room - 1)); if (back < 4) return;
  const sp = g.lanePos(e, pd.pick.off, pd.pick.s - e.d * back), rt = g.route(sp, pd.pick); if (!rt) return;
  c.halt = false; TX().place(c, e, pd.pick.off, pd.pick.s - e.d * back); TX().setPlan(c, rt); c.stop = { e: pd.pick.e, s: pd.pick.s }; c.onStop = cabHere; c.v = 6;
}
/* owner (QA10): the cab comes to YOU. A called cab that has not reached the player within ~20 real seconds (stuck, parked out of sight, or the player
   walked off / sat in a window) is moved just off screen on the road nearest the player and drives in: the wait stays short. Its pick-up quote was already
   kept (the cab was there by `due`), so no game time is invented; the 80 s patience is unchanged and counts from the FIRST arrival (pd.wt). */
const CAB_REACH = 20, CAB_RESPAWNS = 3;
function respawnNear(pd, c) {
  const g = roadGraph(), p = G.player, pick = Object.assign({}, g.nearestLane(p.x, p.y)); if (!pick || !pick.e) return false;
  let sp = TX().offscreenLane(pick, 16, 34), rt = sp && g.route(sp, pick);
  if (!rt || rt.len > 90) { const e = pick.e, s0 = g.span(e)[0], back = Math.max(0, Math.min(14, (pick.s - s0) * e.d - 1)); if (back < 4) return false; sp = g.lanePos(e, pick.off, pick.s - e.d * back); rt = g.route(sp, pick); if (!rt) return false; }
  c.parked = false; c.halt = false; TX().place(c, sp.e, sp.off, sp.s); TX().setPlan(c, rt); c.stop = { e: pick.e, s: pick.s }; c.onStop = cabHere; c.v = 6; c.vmax = 9.5;
  pd.pick = pick; pd.state = 'coming'; pd.t = 0; pd.due = 0; pd.hold = 0; pd.near = true; pd.again = (pd.again || 0) + 1; pd.reach = 0; return true;
}
function dropPend(msg) { const pd = pend; if (!pd) return; pend = null; freeCab(pd.cab); if (msg) toast(msg); G.emit('taxi:cancel'); pd.resolve(false); }
function pickDestination() {
  const p = G.player, w = W(); let list = G.places && G.places.knownList ? G.places.knownList().filter(q => ['venue', 'home', 'station', 'airport', 'landmark'].includes(q.kind)) : [];
  if (!list.length) list = w.pois.filter(q => q.type === 'taxistand' || q.type === 'station').map(q => ({ id: q.id, name: q.name, x: q.x, y: q.y, poi: q }));
  const dk = q => q.district && DN[q.district] ? q.district : w.districtAt(q.x, q.y) || 'zz';
  const seenN = new Set(); list = list.filter(q => { const k = q.name + '|' + Math.round(q.x / 8) + ',' + Math.round(q.y / 8); if (seenN.has(k)) return false; seenN.add(k); return true; });   /* QA7: a place known under two ids (home + door, airport + terminal) was listed twice */
  list = list.filter(q => Math.abs(q.x - p.x) + Math.abs(q.y - p.y) > 14).map(q => ({ q, d: dk(q) })).sort((a, b) => a.d < b.d ? -1 : a.d > b.d ? 1 : a.q.name < b.q.name ? -1 : 1);
  if (!list.length) { toast('The driver does not know anywhere to take you yet.'); return Promise.resolve(null); }
  return choose('Where to?', list.map(o => ({ label: o.q.name, sub: (DN[o.d] || 'Maple Bay') + ' - ' + (G.state.flags.firstCabFree ? 'pre-paid' : fmt(taxiFare(p, o.q))), value: o.q })), { text: G.state.flags.firstCabFree ? 'This ride is pre-paid.' : 'Pay on arrival.' });
}
function boardCab() {
  const pd = pend; if (!pd || pd.state !== 'waiting' || ride) return; const go = pl => { pend = null; startTaxiRide(pd.cab, pl, pd.opts, pd.resolve); };
  if (pd.place) return go(pd.place); pd.state = 'picking';
  pickDestination().then(pl => { if (pend !== pd) return; if (!pl) { if (pd.cab.stand) { pend = null; pd.resolve(false); } else dropPend(); } else go(pl); });
}
function callTaxi(placeId, opts = {}) {
  if (!inCity() || !TX() || !TX().ensure()) { toast('Step outside to meet your cab.'); return Promise.resolve(false); }
  if (ride || pend || G.cutscene) { if (!opts.silent) toast('You already have a ride.'); return Promise.resolve(false); }
  const pl = placeOf(placeId); if (placeId && !pl) { toast("The dispatcher can't find that place."); return Promise.resolve(false); }
  const g = roadGraph(), p = G.player, pick = Object.assign({}, g.nearestLane(p.x, p.y)); let sp = TX().offscreenLane(pick, 20, 46), rt = sp && g.route(sp, pick);
  if (!rt || rt.len > 220) { const e = pick.e, s0 = g.span(e)[0]; sp = g.lanePos(e, pick.off, (pick.s - s0) * e.d > 26 ? pick.s - e.d * 26 : s0); rt = g.route(sp, pick); }
  const cab = TX().spawn('taxi', sp, { keep: true, role: 'svc', pre: true, params: { free: false } }); if (!cab) { toast('No cabs available right now.'); return Promise.resolve(false); }
  cab.vmax = 9.5; cab.v = 6; TX().setPlan(cab, rt); cab.stop = { e: pick.e, s: pick.s }; cab.onStop = cabHere;
  const due = pickupMin(), hold = Math.max(0, due / (G.CLOCK || .85) - (rt ? rt.len : 30) / CAB_CAR_V - .5);   /* QA13: hold / pd.t are real seconds; the quote is game minutes at G.CLOCK per second */ if (hold > 0) { cab.halt = true; cab.v = 0; }   // QA7: the pick-up takes about `due` game minutes (the cab waits off screen when it is close)
  if (!opts.silent) toast('MapleCab is on the way: about ' + Math.max(1, Math.round(due)) + ' min.');
  return new Promise(res => { pend = { cab, place: pl, opts, state: 'coming', t: 0, resolve: res, pick, due, hold, len: rt ? rt.len : null }; });
}
function hail(v) {
  if (ride || pend || G.cutscene || !v.active) return Promise.resolve(false);
  return new Promise(res => { pend = { cab: v, place: null, opts: {}, hailed: true, state: v.parked ? 'waiting' : 'hail', t: 0, resolve: res }; if (!v.parked) { v.keep = true; v.role = 'svc'; v.taxiFree = false; toast('Taxi!'); } else walkTo(v); });
}
function walkTo(v) { const p = G.player; if (Math.hypot(p.x - v.x, p.y - v.y) < 3.2 || G.busy) return; const sp = curbSpot(v.x, v.y, p.x, p.y); try { p.goTo(G.world, sp.x, sp.y, { snap: 8 }); } catch (e) { } }
function hailTaxi() {
  if (!inCity() || !TX()) return Promise.resolve(false); const p = G.player; let b = null, bd = 28;
  for (const v of TX().vehicles) { if (v.kind !== 'taxi' || !v.taxiFree) continue; const d = Math.hypot(v.x - p.x, v.y - p.y); if (d < bd) { bd = d; b = v; } }
  return b ? hail(b) : callTaxi(null);
}
function cabInteractable(v) {
  const mine = () => pend && pend.cab === v;
  return { scene: 'city', ent: v, x: v.x, y: v.y, h: 1.3, hit: 14, get range() { return mine() || v.parked ? 3 : 14; }, get label() { return mine() ? 'Get in the cab' : v.parked ? 'Take taxi' : 'Hail taxi'; },
    visible: () => v.active && v.kind === 'taxi' && !ride && (pend ? mine() && pend.state === 'waiting' : v.taxiFree), use: () => { if (mine()) boardCab(); else hail(v); } };
}

/* ---------- buses ---------- */
/** QA7: stops left to the Map trip's stop on the bus you ride (0 = at it), or null when you are not on a Map bus trip (or chose your own stop) */
function busLeft(r) {
  const nt = navTrip(); if (!r || r.kind !== 'bus' || !r.bus || r.destination || !nt || nt.stage !== 1) return null; const b = r.bus, S = b.loop.stops, n = S.length, i = S.findIndex(s => s.id === nt.alight.id); if (i < 0) return null;
  return b.atStop === nt.alight.id ? 0 : ((i - (b.atStop ? (b.nsi + 1) % n : b.nsi) + n) % n) + 1;
}
const stopPoi = id => W().pois.find(p => p.id === id);
const routeNum = rid => (TX().loops[rid] ? TX().loops[rid].num : String(rid).replace('bus', ''));
function boardNow(b, stop, dest, resolve) {
  wait = null; if (ride || !b.veh) { b.hold = false; if (resolve) resolve(false); return false; }
  if (!payFare('bus')) { b.hold = false; if (resolve) resolve(false); return false; }
  const l = b.loop, n = l.stops.length, i0 = l.stops.findIndex(s => s.id === stop.id), cnt = id => { const i = l.stops.findIndex(s => s.id === id); return i < 0 ? 0 : ((i - i0 + n) % n) || n; };
  b.hold = false; b.veh.vmax = BUS_RIDE_V; b.veh.pre = true; b.veh.ride = true;   // + transit signal priority (QA round 3: half of a ride was spent at red lights)   // the bus you ride drives at cab-ride pace (rides are compressed like taxi rides; restored in finish)
  begin({ kind: 'bus', vehicle: b.veh, bus: b, destination: dest || null, from: stop.id, progress: 0, offNext: false, n0: dest ? cnt(dest) : 1, left: dest ? cnt(dest) : 1, cnt, resolve });
  const r = ride; r.prevSpeed = G.state.speed === BUS_CLOCK ? 1 : G.state.speed || 1; G.state.speed = BUS_CLOCK;   // QA round 3: a bus ride is a compressed cut like a cab ride: the clock runs at 0.2x so the ridden bus (10 u/s top, ~4 u/s with stops) covers ~20 u per game minute, ~4.5x walking
  const setDest = id => { r.destination = id; r.offNext = false; const cur = l.stops[b.nsi].id, i = l.stops.findIndex(s => s.id === id), j = l.stops.findIndex(s => s.id === cur); r.left = r.n0 = ((i - j + n) % n) + 1; r.progress = 0; };
  showHud('Bus ' + l.num + ' - ' + l.route.name.replace(/^\s*\w+\s*/, ''), '', [
    r.offBtn = el('button', { text: 'Get off at next stop', onclick: () => { r.offNext = true; if (b.atStop && b.atStop !== r.from) alight(b.atStop); } }),
    el('button', { text: 'Choose stop', onclick: () => pickStop(r).then(id => { if (id && ride === r) setDest(id); }) }),
    el('button', { text: 'Skip ride', onclick: () => skipBus() })]);   /* owner msg 134: skip a bus ride like a cab ride */
  r.setDest = setDest;
  toast(hasPass() ? 'Transit pass accepted.' : 'Bus fare ' + fmt(FARES.bus.single) + ' paid.'); return true;
}
/** the stops still ahead on the bus you ride, for "Choose stop" and "Skip ride" */
function pickStop(r) { const b = r.bus, l = b.loop, n = l.stops.length, cur = b.nsi, opts = []; for (let k = b.atStop ? 1 : 0; k < n; k++) { const s = l.stops[(cur + k) % n]; opts.push({ label: s.poi.name, sub: k + 1 - (b.atStop ? 1 : 0) + (k ? ' stops' : ' stop - next'), value: s.id }); } return choose('Get off at...', opts); }
/* QA13 (owner msg 134): "Skip ride" on a bus, like the cab's. The stop is the one you chose ("Choose stop"), else the Map trip's stop, else you are asked which
   (a loop bus has no end of the line). The clock jumps by the rest of the ride at the navigator's own bus pace (BUS_V u per game minute along the loop
   + BUS_DWELL per stop passed: the quote's model), needs tick through G.advance, and you get off at that stop: the trip goes on to its walking leg. */
const SKIP_BUS_V = 20, SKIP_BUS_DWELL = .6;   // = navigator.js BUS_V0 / BUS_DWELL0 (at 1 game minute per real second; scaled by G.CLOCK below, as the navigator does)
function skipBus() {
  const r = ride; if (!r || r.kind !== 'bus' || r.skipping) return; const nt = navTrip(), dest = r.destination || (nt && nt.stage === 1 ? nt.alight.id : null);
  if (!dest) { pickStop(r).then(id => { if (id && ride === r) { r.setDest(id); skipBus(); } }); return; }
  r.skipping = true; const f = G.fadeEl; G.modal++; if (f) f.classList.add('on');
  setTimeout(() => {
    try {
      if (ride === r) { const b = r.bus, l = b.loop, L = l.L, i = l.stops.findIndex(s => s.id === dest), u = (TX().busU ? TX().busU(b) : b.u) || 0; let du = i < 0 || b.atStop === dest ? 0 : (l.stops[i].u - u + L) % L, between = 0;
        for (const s of l.stops) { const d2 = (s.u - u + L) % L; if (d2 > .5 && d2 < du - .5 && s.id !== b.atStop) between++; }
        const k = G.CLOCK || .85, m = du / (SKIP_BUS_V / k) + between * SKIP_BUS_DWELL * k; if (m > 0) G.advance(m); r.skipped = m; alight(dest); G.snapCam && G.snapCam(); }
    } finally { G.modal--; setTimeout(() => f && f.classList.remove('on'), 80); }
  }, 280);
}
function alight(stopId) { const r = ride; if (!r || r.kind !== 'bus') return; const p = stopPoi(stopId) || G.player; r.destination = stopId; r.progress = 1; finish(curbSpot(p.x, p.y, p.x, p.y)); toast('You get off at ' + (p.name || 'the stop') + '.'); }
function waitBus(stop, rid, dest, resolve) {
  if (ride || wait || pend) { if (resolve) resolve(false); return; }
  const here = TX().buses.find(b => b.veh && b.atStop === stop.id && (!rid || b.route === rid)); if (here) { here.hold = true; return boardNow(here, stop, dest, resolve); }
  wait = { stop, rid, dest, resolve };
  G.startActivity({ label: 'Waiting for the bus', anim: null, minutes: 300, rate: 10, canCancel: true,
    tick() { const nb = TX().nextBuses(stop.id).find(a => !rid || a.route === rid); if (G.busy) G.busy.rate = nb && (nb.bus.veh || nb.minutes <= 6) ? (G.CLOCK || .85) : 10; },   /* QA13: the free clock's pace (G.CLOCK game minutes per real second), so a bus in sight keeps its quoted minutes */   /* QA7: 1, not the game speed: an activity does not sub-step the world, so at 4x the bus you watch arriving cost 4x the game minutes */   // QA round 3: slow down before the bus is due, so an off-screen bus cannot skip past the spawn ring at 10x and go by unseen
    done() { if (wait) { const w = wait; wait = null; toast('No bus came.'); if (w.resolve) w.resolve(false); } }, cancel() { if (wait && !wait.boarding) { const w = wait; wait = null; if (w.resolve) w.resolve(false); } } });
}
function onBusArrive(b, stopId) {
  if (wait && stopId === wait.stop.id && (!wait.rid || b.route === wait.rid) && b.veh) { const w = wait; w.boarding = true; b.hold = true; G.endActivity(false); boardNow(b, w.stop, w.dest, w.resolve); return; }
  const r = ride; if (r && r.kind === 'bus' && r.bus === b) { if (r.left > 0) r.left--; r.progress = r.destination ? 1 - r.left / r.n0 : 0; if (r.offNext || r.destination === stopId) alight(stopId);
    else { const nt = navTrip(); if (nt && nt.stage === 1 && nt.alight.id === stopId) { b.hold = true; r.holdT = NAV_HOLD; } } }   // nav: wait a little at the player's stop (they get off themselves)
}
function openStop(p) {
  if (typeof p === 'string') p = stopPoi(p); if (!p || !TX()) return; const m = modal({ title: p.name }), nb = TX().nextBuses(p.id), free = hasPass();
  m.body.append(el('div.tr-fare', { text: free ? 'Transit pass - rides are free.' : 'Fare ' + fmt(FARES.bus.single) + ' per ride (7-day pass ' + fmt(FARES.transitPass.price) + ').' }));
  for (const a of nb.slice(0, 5)) { const n = el('b.tr-num', { text: a.num }); n.style.background = a.color || '#555'; m.body.append(el('div.tr-row', null, n, el('span', { text: a.name.replace(/^\s*\w+\s*/, '') }), el('span.tr-eta', { text: a.minutes <= 0 ? 'here now' : a.minutes + ' min' }))); }
  if (!nb.length) m.body.append(el('div.tr-row', { text: 'No service at this stop.' }));
  const nt = navTrip(), mine = nt && nt.stage === 0 && nt.board && nt.board.id === p.id ? nt.route : null;   // nav: the trip's bus is marked; the player gets off themselves (no auto-alight)
  if (mine) m.body.append(el('div.tr-fare', { text: 'Your trip: bus ' + routeNum(mine) + ' to ' + nt.alight.name + '.' }));
  const box = el('div.tr-btns'); for (const rid of p.routes || []) if (TX().loops[rid]) box.append(el('button' + (rid === mine ? '.primary' : ''), { text: 'Wait for bus ' + routeNum(rid) + (rid === mine ? ' (your trip)' : ''), 'data-route': rid, onclick: () => { m.close(); waitBus(p, rid); } })); m.body.append(box);
}
function boardBus(routeId, stopId, destStopId) {
  if (!inCity() || !TX() || !TX().ensure()) return Promise.resolve(false); const p = G.player; let stop = stopId && stopPoi(stopId);
  if (!stop) { let bd = 1e9; for (const q of W().pois) { if (q.type !== 'busstop' || (routeId && !(q.routes || []).includes(routeId))) continue; const d = Math.hypot(q.x - p.x, q.y - p.y); if (d < bd) { bd = d; stop = q; } } }
  if (!stop) return Promise.resolve(false); return new Promise(res => waitBus(stop, routeId, destStopId, res));
}

/* ---------- system ---------- */
function update(dt) {
  if (!TX()) return;
  for (let i = idle.length - 1; i >= 0; i--) { const o = idle[i]; if ((o.t -= dt) <= 0) { idle.splice(i, 1); if (!(pend && pend.cab === o.v) && !(ride && ride.vehicle === o.v)) freeCab(o.v); } }
  if ((tI -= dt) <= 0) { tI = 1; for (const v of TX().vehicles) if (v.kind === 'taxi' && !v._it) { v._it = cabInteractable(v); G.addInteractable(v._it); } }
  const pd = pend; if (!pd) return; const c = pd.cab, p = G.player; pd.t += G.modal > 0 || (G.firstTime && G.firstTime.isOpen) ? 0 : dt;   /* QA9: a window over the game does not use up the cab's patience */
  if (!c.active || !inCity()) { pend = null; if (c.active) freeCab(c); pd.resolve(false); return; }
  if (pd.state === 'hail') {
    if (!c.halt) { const e = c.e, g = roadGraph(); if (!c.cornerOn && !c.inNode && (e.s1 - c.s) * e.d > g.ext(e.to, e.axis) + 3.2 && (c.s - e.s0) * e.d > g.ext(e.from, e.axis) + 2.2) c.halt = true; else if (pd.t > 12) c.halt = true; }
    else if (c.v < .05) { c.parked = true; pd.state = 'waiting'; pd.t = 0; sfx('honk'); G.emit('taxi:here', c); walkTo(c); }
  } else if (pd.state === 'coming') { if (pd.hold > 0 && (pd.hold -= dt) <= 0) c.halt = false; if (!pd.near && pd.t > ((pd.due || 6) - 2) / (G.CLOCK || .85) && Math.hypot(c.x - pd.pick.x, c.y - pd.pick.y) > 12) lateCab(pd, c);
    if (pd.again && pd.t > 8) { c.halt = false; TX().setPlan(c, null); c.stop = null; c.onStop = null; TX().place(c, pd.pick.e, pd.pick.off, pd.pick.s); cabHere(c); return; }   /* a re-approach is never slow */
    if (pd.t > ((pd.due || 6) + CAB_LATE) / (G.CLOCK || .85)) { c.halt = false; TX().setPlan(c, null); c.stop = null; c.onStop = null; TX().place(c, pd.pick.e, pd.pick.off, pd.pick.s); cabHere(c); } }
  else if (pd.state === 'waiting') {
    if (pd.opts.auto !== false && !G.busy && !G.modal && Math.hypot(p.x - c.x, p.y - c.y) < (pd.hailed ? 4.6 : 3.3)) boardCab();
    else if (!pd.hailed && (pd.again || 0) < CAB_RESPAWNS && Math.hypot(p.x - c.x, p.y - c.y) > 6 && (pd.reach = (pd.reach || 0) + (G.modal > 0 ? 0 : dt)) > CAB_REACH && !G.busy && respawnNear(pd, c)) { /* driving round to you */ }
    else if (pd.hailed && !p.path && !G.busy && (pd.w = (pd.w || 0) + dt) > 1.5) { pd.w = 0; walkTo(c); }
    else if ((pd.wt = (pd.wt || 0) + (G.modal > 0 || (G.firstTime && G.firstTime.isOpen) ? 0 : dt)) > 80) dropPend(c.stand && pd.hailed ? null : 'Your cab gave up waiting. Call another in MapleCab.');   /* QA9: a cab you called never leaves without a word (it did from a stand kerb) */
  }
}

export function init() {
  S = G.defineState('transit', () => ({ rides: { taxi: 0, bus: 0 } }));
  if (typeof document !== 'undefined') document.head.append(el('style', { text: CSS }));
  const T = G.transit = {
    callTaxi, hailTaxi, cabEstimate, CAB_RIDE, busStopsLeft: () => busLeft(ride), skipBus, cancel: () => { if (pend && pend.state !== 'picking') dropPend(); }, skipRide, fare, payFare, hasPass, boardBus, openStop, roadGraph, route,
    nextBuses: id => TX() ? TX().nextBuses(id).map(a => ({ route: a.route, num: a.num, name: a.name, color: a.color, minutes: a.minutes })) : [],
    stops: () => W().pois.filter(p => p.type === 'busstop'),
    get ride() { return ride; }, get pending() { return pend; },
    onArrive(fn) { arriveFns.push(fn); return () => { const i = arriveFns.indexOf(fn); if (i >= 0) arriveFns.splice(i, 1); }; },
    registerMode(name, impl) { modes[name] = impl; if (impl && impl.ride) T['ride' + name[0].toUpperCase() + name.slice(1)] = (...a) => impl.ride(...a); return T; },
    beginRide(r) { ride = Object.assign({ progress: 0, vehicle: null, destination: null }, r); G.emit('ride:start', ride.kind, ride.destination); return ride; },
    endRide(ok = true) { const r = ride; if (!r) return; ride = null; hideHud(); if (S && S.rides) S.rides[r.kind] = (S.rides[r.kind] || 0) + 1; G.emit('ride:end', r.kind, r.destination); for (const f of arriveFns.slice()) f(r); if (r.resolve) r.resolve(ok); },
    rideTrain: () => { toast('The Loop line is not running yet.'); return Promise.resolve(false); },
  };
  G.addSystem({ name: 'transit', update });
  G.on('bus:arrive', onBusArrive);
  G.on('load', () => { S = G.state.transit; if (G.state.speed === BUS_CLOCK) G.state.speed = 1; if (ride) { G.cutscene = null; G.camTarget = null; G.player.hidden = false; hideHud(); ride = null; } pend = null; wait = null; });
  let built = false;
  G.on('scene', s => {
    if (!s || s.id !== 'city' || built || !TX() || !TX().ensure()) return; built = true;
    for (const p of s.world.pois) if (p.type === 'busstop') G.addInteractable({ scene: 'city', x: p.x, y: p.y, h: 1.8, range: 2.4, label: 'Bus stop - Route' + ((p.routes || []).length > 1 ? 's ' : ' ') + (p.routes || []).map(routeNum).join(', '), poi: p, use: () => openStop(p) });
  });
}
