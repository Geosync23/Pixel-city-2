// Phone app: MapleCab. Destination list (known places by district) with a fare quote, a confirm screen and ride status.
// Requests go to G.transit.callTaxi(placeId) (optional G.transit.fare(placeId), G.transit.cancelTaxi()); without a transit system the
// app shows a friendly "no cars available" state. ctx.arg: { place: id } jumps straight to the quote for that place.
// State: G.state.phone.ride = { placeId, name, fare, t, status: 'requested' | 'riding' } while a ride is active; G.state.phone.seen.taxi = recent ids.
// Listens: 'ride:start'(kind), 'ride:end'(kind, placeId).  Emits: 'taxi:request'(placeId, fare), 'taxi:cancel'(placeId).
import { G } from '../core/game.js';
import { TRANSIT_SERVICE } from '../data/venues.js';
import { el, iconEl, row, empty, btn, card, section, kv, destinations, place, placeCat, CAT_BY_ID, DISTRICT_NAME, openState, taxiFare, homePlace, money, balance, safe, cityPos, allPlaces } from './phone_util.js';

const S = () => G.state.phone;
const canCall = () => !!(G.transit && G.transit.callTaxi);
const eta = () => { const w = TRANSIT_SERVICE.taxi.pickupWaitMinutes, m = safe(() => G.weather.taxiWaitMult(), 1) || 1; return `${Math.round(w.phoneMin * m)}-${Math.round(w.phoneMax * m)} min`; };
/* QA7: the same numbers the Map shows (G.transit.cabEstimate: the pick-up wait + a ride whose game time is set by the route) */
const est = p => safe(() => G.transit.cabEstimate(p.id || p), null), hm = t => { const m = Math.round(((t % 1440) + 1440) % 1440); return String(Math.floor(m / 60) % 24).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
const etaFor = p => { const e = p && est(p); return e ? `about ${Math.max(1, Math.round(e.wait))} min` : eta(); };
function hereName() { const c = cityPos(); let best = null, bd = 1e9; for (const p of allPlaces()) { const d = Math.abs(p.x - c.x) + Math.abs(p.y - c.y); if (d < bd && p.kind !== 'spot') { bd = d; best = p; } } return best ? (bd < 14 ? 'Near ' + best.name : (best.districtName || DISTRICT_NAME[best.district] || 'Maple Bay')) : 'Your location'; }

const freeRide = () => !!(G.state.flags && G.state.flags.firstCabFree);
function request(p, fare, ctx) {
  if (!canCall()) return ctx.push('No cars available', b => b.append(empty('transport.taxi', 'No cars available', 'All MapleCab drivers are off the road right now. Please try again a little later. The light rail and buses are running!', btn('Back to destinations', () => ctx.open('taxi'), 'wide'))));
  // nav hook: requested indoors -> the navigator (G.nav, on 'taxi:request') guides the player to the street and calls the cab there
  const later = !!G.nav && !(G.scene && G.scene.id === 'city');
  let r; try { r = later ? true : G.transit.callTaxi(p.id); } catch (e) { console.error(e); r = false; } if (r === false) return ctx.tip("A cab can't reach you here. Step outside to the street and try again.");
  S().ride = { placeId: p.id, name: p.name, fare, t: G.state.t, status: 'requested' }; const rec = S().seen.taxi = (S().seen.taxi || []).filter(id => id !== p.id); rec.unshift(p.id); rec.length = Math.min(rec.length, 3);
  G.emit('taxi:request', p.id, fare); safe(() => G.audio.sfx('confirm'), 0); ctx.open('taxi');
}
function quote(p) {
  return (b, ctx) => {
    const fare = taxiFare(p), bal = balance(), ok = safe(() => G.money.canAfford(fare), bal >= fare), os = openState(p), st = safe(() => G.places.nearest(cityPos().x, cityPos().y, 'station'), null);
    b.append(el('div.ph-hero.dark', null, iconEl('transport.taxi', 3), el('div', null, el('small', { text: 'From: ' + hereName() }), el('b', { text: 'To: ' + p.name, style: { fontSize: '18px' } }), el('small', { text: p.districtName || DISTRICT_NAME[p.district] || '' }))), el('div.ph-checker'));
    b.append(card(el('div.ph-kv', null, el('span', { text: 'Fare' }), el('b.ph-big', { text: freeRide() ? 'Free — prepaid' : money(fare) })), kv('Pick-up in', etaFor(p)), (e => e ? kv('Ride', `about ${Math.max(1, Math.round(e.ride))} min · there by ${hm(G.state.t + e.minutes)}`) : null)(est(p)), kv('Your balance', money(bal)), os.open !== null ? kv('Destination', os.text) : null));
    if (!ok && !freeRide()) b.append(card(el('b', { text: 'That fare is a bit much right now.' }), el('p', { text: st ? `The light rail is only ${money(2.5)}. Nearest station: ${st.name}.` : 'The light rail and buses are cheaper.' }), st ? btn('Show station on map', () => ctx.open('map', { place: st.id }), '', 'ui.pin') : null));
    b.append(el('p.ph-note', { text: 'Your driver meets you at the nearest kerb. You pay when you arrive; cancelling before pick-up is free.' }));
    ctx.foot.append(btn(ok || freeRide() ? `Request ride · ${freeRide() ? 'Free — prepaid' : money(fare)}` : 'Not enough money', () => request(p, fare, ctx), 'gold wide big', 'transport.taxi')); if (!ok && !freeRide()) ctx.foot.lastChild.disabled = true;
  };
}
function status(b, ctx, r) {
  const riding = r.status === 'riding' || !!G.cutscene;
  // requested indoors: the navigator (G.nav) calls the cab only once you reach the street, so it is not on its way yet
  const later = !riding && !!safe(() => { const t = G.nav.trip(); return t && t.mode === 'cab' && t.stage === 0 && t.call; }, false), step = riding ? 2 : later ? 0 : 1;
  b.append(el('div.ph-hero.dark', null, iconEl('transport.taxi', 3), el('div', null, el('b', { text: riding ? 'Enjoy the ride!' : later ? 'Head outside to meet your cab' : 'Your cab is on its way', style: { fontSize: '18px' } }), el('small', { text: 'To ' + r.name }))), el('div.ph-checker'));
  b.append(el('div.ph-steps', null, ['Requested', 'On the way', 'Riding', 'Arrived'].map((s, i) => el('span' + (i < step ? '.done' : i === step ? '.on' : ''), { text: s }))));
  b.append(card(kv('Fare', freeRide() ? 'Free — prepaid' : money(r.fare)), kv('Pick-up', riding ? 'Done' : later ? 'once you are outside, then ' + etaFor(place(r.placeId)) : etaFor(place(r.placeId))),
    el('p', { text: riding ? 'Sit back. The city looks great from the back seat.' : later ? 'MapleCab calls your driver as soon as you step out onto the street. Put your phone away and follow the arrow to the exit.' : 'Put your phone away and wait by the kerb. Hop in when the yellow cab pulls up.' })));
  ctx.foot.append(btn('Put phone away', () => ctx.close(), 'pri wide big', 'ui.check'));
  if (!riding) ctx.foot.append(btn('Cancel ride (free)', () => { safe(() => (G.transit.cancelTaxi || G.transit.cancel)(), 0); G.emit('taxi:cancel', r.placeId); S().ride = null; ctx.refresh(); ctx.tip('Ride cancelled.'); }, 'wide'));
}

export default {
  id: 'taxi',
  badge: () => (S().ride ? 1 : 0),
  setup() {
    G.on('ride:start', kind => { if (kind === 'taxi' && S().ride) S().ride.status = 'riding'; });
    G.on('ride:end', kind => { if (kind === 'taxi' || !kind) S().ride = null; });
    /* QA12: a cab that gave up waiting (transit dropPend emits taxi:cancel) left the card on "On the way" for up to four hours, with no cab coming */
    G.on('taxi:cancel', () => { const r = S().ride; if (r && r.status !== 'riding') S().ride = null; });
  },
  render(b, ctx) {
    const r = S().ride, a = ctx.arg;
    if (r && G.state.t - r.t > 240 && !G.cutscene) S().ride = null; // stale request (e.g. after a load)
    if (S().ride) return status(b, ctx, S().ride);
    if (a && a.place && !a._used) { a._used = 1; const p = place(a.place); if (p) return queueMicrotask(() => ctx.push('Your ride', quote(p))); }
    b.append(el('div.ph-hero', null, iconEl('transport.taxi', 3), el('div', null, el('b', { text: 'Where to?', style: { fontSize: '20px' } }), el('small', { text: 'Pick-up: ' + hereName() }))), el('div.ph-checker'));
    if (!canCall()) b.append(el('p.ph-note', { text: 'Heads up: drivers are scarce right now. You can still check fares.' }));
    const fam = ['home:sibling', 'home:grandma'].map(id => safe(() => place(id), null)).filter(Boolean);   /* QA7: family homes are cab destinations from day 0 (their texts give the address; you need not have walked past) */
    const all = destinations().concat(fam.filter(f => !destinations().some(p => p.id === f.id))), here = cityPos(), far = all.filter(p => Math.abs(p.x - here.x) + Math.abs(p.y - here.y) > 10);
    if (!far.length) return b.append(empty('ui.pin', 'No destinations yet', 'Places you visit or hear about show up here. Stations and your home are always listed.'));
    const item = p => { const os = openState(p); return row({ icon: p.kind === 'home' ? 'ui.home' : p.kind === 'station' ? 'transport.train' : p.kind === 'airport' ? 'transport.plane' : el('i', { style: { width: '16px', height: '16px', border: '2px solid #2a2733', background: CAT_BY_ID[placeCat(p)].color, flex: 'none' } }), iconScale: 1,
      title: p.name, sub: [CAT_BY_ID[placeCat(p)].name, os.open === null ? '' : os.open ? 'open now' : 'closed now'].filter(Boolean).join(' · '), right: freeRide() ? 'Free' : money(taxiFare(p)), onclick: () => ctx.push('Your ride', quote(p)) }); };
    const home = homePlace(), work = safe(() => place(G.jobs.current().venue), null), quick = [home, work, ...fam, ...(S().seen.taxi || []).map(place)].filter((p, i, arr) => p && far.includes(p) && arr.indexOf(p) === i);
    // "For you now" (owner msg 84): where your arrow / current trip points, and anything on the planner in the next 12 hours
    const sug = [], addS = (pl, why) => { if (pl && typeof pl.x === 'number' && Math.abs(pl.x - here.x) + Math.abs(pl.y - here.y) > 10 && !sug.some(q => q.p === pl)) sug.push({ p: pl, why }); };
    const tr = safe(() => G.nav.trip(), null), wp = safe(() => G.phone.waypoint(), null), hhmm = t => { const m = ((t % 1440) + 1440) % 1440; return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(Math.floor(m % 60)).padStart(2, '0'); };
    addS(tr && tr.dest && tr.dest.id && place(tr.dest.id), 'Your current trip'); addS(wp && wp.id && place(wp.id), 'Your arrow points here');
    for (const ap of safe(() => G.planner.list(G.state.t - 30, G.state.t + 720), []).slice(0, 8)) if (ap.placeId && ap.s !== 3 && ap.s !== 4) addS(place(ap.placeId), 'My Day · ' + ap.title + ' · ' + hhmm(ap.t));
    if (sug.length) { b.append(section('For you now')); for (const q of sug.slice(0, 5)) { const r0 = item(q.p), sm = r0.querySelector('small'); if (sm) sm.textContent = q.why; r0.dataset.sug = '1'; b.append(r0); } }
    if (quick.length) { b.append(section('Quick picks')); for (const p of quick) b.append(item(p)); }
    const groups = {}; for (const p of far) (groups[p.district || 'other'] = groups[p.district || 'other'] || []).push(p);
    for (const d of [...Object.keys(DISTRICT_NAME), 'other']) { const g = groups[d]; if (!g) continue; b.append(section(DISTRICT_NAME[d] || 'Elsewhere')); g.sort((x, y) => (x.name < y.name ? -1 : 1)).forEach(p => b.append(item(p))); }
  },
};
