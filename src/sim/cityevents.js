// BIG CITY EVENTS (BIBLE direction update 12): six staged street festivals / parades a year that physically happen in the city.
// Data: src/data/cityevents.js (+ six rows in data/calendar.js). Stage (world dressing, actors): _cityevents_stage.js. Sky effects: _cityevents_fx.js. Art: src/art/events/.
//
// How it works. Everything is derived from the clock, so nothing but a few flags is saved:
//   level 1 (3 days before, 06:00)  posters + kerb banners along the route, a phone notice
//   level 2 (the day before, 06:00) bunting + arches; a notice; on the morning of the day an Opportunity is offered ('cev_<id>')
//   level 3 (open - 30 min .. close) the street is CLOSED to traffic (road edges get `closed`; see the guards in traffic.js / _traffic_veh.js), barriers, stalls,
//                                    set pieces, spectators line the route, the parade runs at `paradeAt`, the finale at `finaleAt`; things to do are interactables
//   after close: back to level 2 until midnight, then everything is removed and the world is exactly as before (all objects are non-solid; see debug.snapshot()).
// Weather: 'clear' events are guaranteed fine by their calendar row; 'rain_ok' events go ahead in rain (fewer spectators) and the parade waits out a storm.
//
// G.cityEvents
//   list() -> [{ id, name, day (next absolute day), t0, t1, paradeT }]      next() -> the next one      current() -> { ev, level, m (minutes into its day), cur } | null
//   live() -> the event that is on right now (level 3) | null               isClosed(roadId?) -> bool    place(id) -> the virtual place 'cev:<id>'
//   join(id?) -> Promise   take part in the moment (what the interactable does)      stage -> the built stage | null       TUNE
//   debug.start(id, hour?)   stage event `id` today as if the clock said `hour` (default: 20 min before the parade); debug.at(hour) moves that event's clock
//   debug.stop()             end a forced event and tear everything down            debug.snapshot() -> counts + a hash of the city world / traffic / interactables
//   debug.parade(u?) / debug.finale() / debug.moment()  jump to a part              debug.fps(seconds) -> Promise<avg fps>
// Events: 'cityevent:level'(id, level), 'cityevent:open'(id), 'cityevent:parade'(id), 'cityevent:finale'(id), 'cityevent:join'(id, stars) (the player took part),
//         'cityevent:game'(id, gameId, stars), 'cityevent:close'(id), 'cityevent:bang' (a firework burst: sound cue).
// State G.state.cityEvents = { cur: null | { id, base, u, pst, fin, delay, joined, lit, watch, mood, n: {sent notices}, games: {} }, force: null | { id, base }, treeLit: year | 0, seen: { id: count } }
import { G } from '../core/game.js';
import { EVENTS } from '../data/calendar.js';
import { ITEM_BY_ID } from '../data/items.js';
import { CITY_EVENTS, CITY_EVENT_BY_ID, TUNE } from '../data/cityevents.js';
import { roadGraph } from './traffic.js';
import { buildStage, clearLooks } from './_cityevents_stage.js';
import { FX, drawFX } from './_cityevents_fx.js';
import { play } from '../ui/minigame.js';
import { choose, toast, bubble } from '../ui/kit.js';

export const order = 131;
const DAY = 1440, SEASONS = ['spring', 'summer', 'autumn', 'winter'];
const safe = (f, d) => { try { const v = f(); return v === undefined || v === null ? d : v; } catch (e) { return d; } };
let S = null, stage = null, closed = false, drainT = 0, removers = [], tSync = 0, T = 0, lastLvl = -1, riding = null, pinId = null, finT = 0, cheerT = 0, wrapped = false, graphPatched = false, nClosed = 0, fpsAcc = null;
const fresh = () => ({ cur: null, force: null, treeLit: 0, seen: {} });
const city = () => G.sceneCache.get('city') || null;
const inCity = () => !!G.scene && G.scene.id === 'city';
const evOnDay = d => { const s = Math.floor(d / 14) % 4, dos = (d % 14) + 1; return CITY_EVENTS.find(e => e.season === s && e.day === dos) || null; };
const yearOf = t => Math.floor(t / DAY / 56);
const hh = h => { const m = Math.round(h * 60); return String(Math.floor(m / 60) % 24).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
const money = n => safe(() => G.money.fmt(n), '$' + n);

/* ---------- which event, and how far along ---------- */
function occ(t) {
  if (S.force) { const ev = CITY_EVENT_BY_ID[S.force.id]; if (ev) return { ev, base: S.force.base, forced: true }; }
  const today = Math.floor(t / DAY); for (let d = today; d <= today + TUNE.announceDays; d++) { const ev = evOnDay(d); if (ev) return { ev, base: d * DAY }; } return null;
}
function levelOf(o, t) {
  const m = t - o.base, ev = o.ev;
  if (m < -TUNE.announceDays * DAY + 360) return 0; if (m < -TUNE.buntingDays * DAY + 360) return 1; if (m < ev.open[0] * 60 - TUNE.closeLead) return 2; if (m < ev.open[1] * 60) return 3; if (m < DAY) return 2; return 0;
}
/** an event whose set piece stays up outside its own day (the winter tree) */
function keeper(t) { const d = Math.floor(t / DAY), s = Math.floor(d / 14) % 4, dos = (d % 14) + 1; for (const ev of CITY_EVENTS) if (ev.season === s) for (const p of ev.props || []) if (p.keep && dos >= p.keep[0] && dos <= p.keep[1]) return ev; return null; }

/* ---------- virtual places + calendar hook ---------- */
function placeOf(id) { const ev = CITY_EVENT_BY_ID[String(id).replace(/^cev:/, '')]; if (!ev) return null; const p = { x: ev.site.x, y: ev.site.y, district: ev.district, name: ev.site.name, id: 'cev:' + ev.id, type: 'landmark' }; return { id: 'cev:' + ev.id, name: ev.site.name, kind: 'landmark', x: ev.site.x, y: ev.site.y, district: ev.district, poi: p, open: () => true, cityEvent: ev.id }; }
function wrapPlaces() { if (wrapped || !G.places || !G.places.get) return; wrapped = true; const get = G.places.get; G.places.get = id => (typeof id === 'string' && id.startsWith('cev:') ? placeOf(id) : get(id)); if (G.places.known) { const kn = G.places.known; G.places.known = id => (typeof id === 'string' && id.startsWith('cev:') ? true : kn(id)); } }

/* ---------- street closures ---------- */
function patchGraph() {
  if (graphPatched) return; const g = roadGraph(); if (!g) return; graphPatched = true; const route0 = g.route, near0 = g.nearestLane, pts0 = g.routePts;
  /* while a street is closed: lane lookups skip it and routes go round it (a closed edge costs 100000). With nothing closed these are the originals. */
  g.nearestLane = (x, y) => { if (!nClosed) return near0(x, y); let be = null, bo = 1, bs = 0, bd = 1e9;
    for (const e of g.edges) { if (e.closed) continue; const ax = e.axis === 'x', sp = g.span(e), lo = Math.min(sp[0], sp[1]), hi = Math.max(sp[0], sp[1]), s = Math.max(lo, Math.min(hi, ax ? x : y)), da = Math.abs((ax ? x : y) - s);
      for (let off = 1; off <= (e.lanes > 1 ? 3 : 1); off += 2) { const dl = Math.abs((ax ? y : x) - g.laneCoord(e, off)), dd = da + dl; if (dd < bd - 1e-6) { bd = dd; be = e; bo = off; bs = s; } } }
    return be ? g.lanePos(be, bo, bs, { dist: bd }) : near0(x, y); };
  g.route = (a, b) => { if (!nClosed) return route0(a, b); const ch = []; for (const e of g.edges) if (e.closed) { ch.push(e); e.len += 1e5; } try { return route0(a, b); } finally { for (const e of ch) e.len -= 1e5; } };
  g.routePts = (p, q) => (nClosed ? g.route(g.nearestLane(p.x, p.y), g.nearestLane(q.x, q.y)) : pts0(p, q));
}
function setClosed(on) {
  if (!stage || on === closed) return; patchGraph(); closed = on;
  for (const e of stage.edges) { if (!!e.closed !== on) nClosed += on ? 1 : -1; e.closed = on; if (e.rev) { if (!!e.rev.closed !== on) nClosed += on ? 1 : -1; e.rev.closed = on; } }
  if (nClosed < 0) nClosed = 0; drainT = on ? 22 : 0; if (on) drain(false);
  G.emit(on ? 'cityevent:open' : 'cityevent:close', stage.ev.id);
}
/** vehicles caught on the closed stretch: parked stand cabs and anything out of sight go at once, the rest drive out; stragglers are lifted after the grace time */
function drain(all) { const tr = G.traffic; if (!tr || !tr.vehicles) return; for (const v of tr.vehicles.slice()) { if (!v.e || !v.e.closed || v.ride) continue; if (all || v.stand || v.parked || !tr.onScreen(v.x, v.y, 30)) tr.release(v); } }

/* ---------- notices ---------- */
function note(key, title, text, pr) { const c = S.cur; if (!c || c.n[key] || !text) return; c.n[key] = 1; safe(() => G.phone.notify({ app: 'guide', title, text, priority: pr || 'normal', data: { entry: 'event:' + c.id } }), null); }
function offerOpp(ev) {
  const c = S.cur; if (!c || c.n.opp || !G.opps || !G.opps.offer) return; c.n.opp = 1;
  safe(() => G.opps.offer({ id: 'cev_' + ev.id, src: 'event', title: ev.name, text: ev.texts.opp, at: 'cev:' + ev.id, do: { type: 'ev', ev: 'cityevent:join', a0: ev.id }, when: {}, reward: { needs: { fun: 6 } }, ttl: Math.max(2, ev.open[1] - safe(() => G.now().hf, 8)) }, { force: true }), null);
}

/* ---------- rewards ---------- */
function give(r, k = 1) {
  if (!r) return; for (const n in r.needs || {}) safe(() => G.needs.add(n, Math.round(r.needs[n] * k)), null);
  if (r.moodlet) safe(() => G.needs.addMoodlet(r.moodlet), null); if (r.money) safe(() => G.money.add(Math.round(r.money * k), 'Festival prize'), null);
  if (r.item && k >= .5) { const ok = safe(() => G.inv.add(r.item[0], r.item[1] || 1), false); if (!ok) toast('Your bag is full, so the prize stays on the table.', 'info'); }
}
const stageOk = () => stage && stage.level >= 3;
const hourNow = () => (S.cur ? (G.state.t - S.cur.base) / 60 : -1);

/* ---------- things to do ---------- */
async function stallUse(st) {
  if (st.def.game) return gameUse(stage.ev.games.find(g => g.id === st.def.game));
  const opts = st.def.sells.map(id => ITEM_BY_ID[id]).filter(Boolean).map(it => ({ label: it.name, sub: money(it.price), value: it.id })); opts.push({ label: 'Nothing, thanks', value: null });
  const id = await choose(st.def.name, opts, { text: 'What will it be?' }); if (!id) return; const it = ITEM_BY_ID[id];
  if (!safe(() => G.inv.canAdd(id, 1), true)) { toast('Your bag is full.', 'bad'); return; } if (!safe(() => G.money.pay(it.price, st.def.name, { category: it.category }), false)) return;
  safe(() => G.inv.add(id, 1), null); G.emit('shop:buy', id, 1, 'cev:' + stage.ev.id); toast(it.name + ' from ' + st.def.name + '.', 'good');
}
async function gameUse(gm) {
  if (!gm || !stageOk()) return; const ev = stage.ev, c = S.cur;
  const go = await choose(gm.title, [{ label: gm.fee ? 'Have a go (' + money(gm.fee) + ')' : 'Have a go', value: 1 }, { label: 'Not now', value: null }], { text: gm.text }); if (!go) return;
  if (gm.fee && !safe(() => G.money.pay(gm.fee, gm.title), false)) return;
  const r = await play(Object.assign({}, gm.game)); if (!r || r.aborted) return; const stars = r.stars || 0;
  c.games[gm.id] = Math.max(c.games[gm.id] || 0, stars); G.emit('cityevent:game', ev.id, gm.id, stars); safe(() => G.needs.add('fun', 6 + stars * 3), null);
  if (stars >= 2 && gm.prize) { const ok = safe(() => G.inv.add(gm.prize[0], gm.prize[1] || 1), false); toast(ok ? 'You win: ' + (ITEM_BY_ID[gm.prize[0]] || {}).name + '!' : 'A win! But your bag is full.', 'good'); FX.confetti(G.player.x, G.player.y, 40); } else toast(stars ? 'So close. The stallholder gives you a nod.' : 'Not this time.', 'info');
}
function momentOpen() { const ev = stage && stage.ev, m = ev && ev.moment, h = hourNow(); return !!m && stageOk() && h >= m.from && h < m.to; }
async function join() {
  if (!stageOk()) return false; const ev = stage.ev, m = ev.moment, c = S.cur, pr = stage.prop(m.prop); if (!m) return false;
  if (!momentOpen()) { toast(hourNow() < m.from ? m.label + ': from ' + hh(m.from) + '.' : 'That is over for this year.', 'info'); return false; }
  if (ev.id === 'winter_parade' && c.lit) { toast('The tree is already lit. Lovely, is it not?', 'info'); return false; }
  const go = await choose(m.title, [{ label: m.fee ? 'Take part (' + money(m.fee) + ')' : (c.joined ? 'Go again' : 'Take part'), value: 1 }, { label: 'Not now', value: null }], { text: m.text }); if (!go || !stageOk()) return false;
  if (m.fee && !safe(() => G.money.pay(m.fee, m.title), false)) return false;
  const def = Object.assign({}, m.game); let hits = 0;
  def.onBeat = (q, tag) => { if (q <= 0 || !stage) return; hits++; const p = G.player;
    if (m.fx === 'petals') { FX.petals(p.x + 1.5, p.y - .5, 14); const f = stage.els.find(el => el.k === 'float' && !el.e.hidden && Math.hypot(el.e.x - p.x, el.e.y - p.y) < 12); if (f) FX.petals(f.e.x, f.e.y, 10); }
    else if (m.fx === 'fireworks') { const b = stage.prop(1); FX.firework(b ? b.x : p.x, b ? b.y : p.y); if (q >= 1) FX.firework(b ? b.x : p.x, b ? b.y : p.y); }
    else if (m.fx === 'leaves') FX.leaves(p.x, p.y, 6); else if (m.fx === 'treelight' && pr) FX.sparkle(pr.x, pr.y, 2, 8); };
  const pl = G.player; pl.pose = ev.id === 'blossom_parade' ? 'wave' : 'work'; if (pr) pl.faceTo(pr.x, pr.y);
  const r = await play(def); pl.pose = null; if (!r || r.aborted || !S.cur || S.cur !== c) return false; const stars = r.stars || 0, k = r.quit ? .3 : .55 + stars * .15;
  if (m.fx === 'treelight') lightTree(true); else if (m.fx === 'skylantern') { FX.lanterns(pl.x, pl.y, 3); c.wish = 1; } else if (m.fx === 'fireworks') { c.fin = Math.max(c.fin, 1); finT = Math.min(finT, 20); } else if (ev.id === 'river_fair' && stars >= 2) FX.confetti(pr ? pr.x : pl.x, pr ? pr.y : pl.y, 60);
  cheerT = 6; const first = !c.joined; c.joined = Math.max(c.joined || 0, stars + 1);
  if (first) { give(ev.reward, stars >= 2 || !ev.reward.item || ev.id !== 'river_fair' ? k : .4); S.seen[ev.id] = (S.seen[ev.id] || 0) + 1; safe(() => G.guide.stamp('event:' + ev.id, true), null); } else safe(() => G.needs.add('fun', 5), null);
  toast(stars >= 2 || ev.id !== 'river_fair' ? m.done : 'No bell this time, but the crowd liked the swing.', 'good', 4200);
  G.emit('cityevent:join', ev.id, stars); if (pinId) { safe(() => G.navGoals.clear(), null); pinId = null; } return true;
}
function lightTree(byPlayer) {
  const c = S.cur; if (c) c.lit = byPlayer ? 2 : 1; S.treeLit = yearOf(G.state.t) + 1; if (!stage) return; stage.setProp('tree', { st: 'lit' }); stage.setProp('switch', { on: true });
  const t = stage.prop('tree'); if (t && inCity()) { FX.sparkle(t.x, t.y, 8, 120); FX.confetti(t.x, t.y + 2, 40); } cheerT = 8;
}
/* the hay wagon: hop on, ride to the end of the street */
function rideWagon(el) { if (riding || G.busy || G.cutscene || !stageOk()) return; const p = G.player; riding = { el, t: 0 }; p.stop && p.stop(); p.pose = 'sit'; p.poseOpts = { seated: true }; G.target = null; toast('You climb up onto the hay. Hold tight!', 'good'); }
function rideTick(dt) {
  const r = riding, p = G.player, e = r.el.e, seat = r.el.seat || { u: 2, y: 1, z: 1.1 }; r.t += dt;
  if (e.hidden || !stageOk() || r.t > 120 || !inCity()) { riding = null; p.pose = null; p.poseOpts = null; p.zoff = 0; p.bb = [-.2, -.2, .2, .2, 1.4];
    if (stage) { const g = stage.route.segs[stage.route.segs.length - 1]; p.x = g.x1 - g.uy * 2.6 - g.ux * 1.5; p.y = g.y1 + g.ux * 2.6 - g.uy * 1.5; p.z = G.world.heightAt(p.x, p.y); } safe(() => G.needs.add('fun', 10), null); if (S.cur) S.cur.rode = 1; toast('End of the line. That was a proper hayride.', 'good'); G.emit('cityevent:game', stage ? stage.ev.id : '', 'hayride', 3); return; }
  const du = seat.u - e.len / 2, dl = seat.y - e.wid / 2; if (e.ax === 'x') { p.x = e.x + du * e.d + .02; p.y = e.y + dl + .02; } else { p.x = e.x + dl + .02; p.y = e.y + du * e.d + .02; } p.z = e.z + seat.z; p.dir = e.ax === 'x' ? 1 : 0; p.path = null; p.bb = RB;
}
const RB = [.3, .3, .7, .7, 1.4];

function wire() {   /* interactables of the live stage */
  unwire(); if (!stage) return; const ev = stage.ev, live = () => stageOk() && inCity();
  for (const st of stage.stalls) removers.push(G.addInteractable({ scene: 'city', x: st.x, y: st.y, h: 1.4, hit: 16, spot: st.spot, label: st.def.name, visible: live, use: () => stallUse(st) }));
  const m = ev.moment, mp = m && stage.prop(m.prop);
  if (mp) removers.push(G.addInteractable({ scene: 'city', x: mp.x, y: mp.y, h: 1.2, hit: 16, spot: mp.spot, label: m.title, visible: live, use: () => join() }));
  for (const el of stage.els) if (el.ride) removers.push(G.addInteractable({ scene: 'city', ent: el.e, x: 0, y: 0, h: 1.4, hit: 18, range: 3.4, label: 'Hop on the hay wagon', visible: () => live() && !el.e.hidden && !riding, use: () => rideWagon(el) }));
}
function unwire() { for (const r of removers) safe(r, null); removers = []; }

/* ---------- build / tear down ---------- */
function teardown() {
  if (riding) { riding = null; const p = G.player; if (p) { p.pose = null; p.poseOpts = null; p.bb = [-.2, -.2, .2, .2, 1.4]; } }
  if (stage) { if (closed) setClosed(false); unwire(); stage.setLevel(0, false); stage = null; } closed = false; lastLvl = -1; FX.clear(); if (pinId) { safe(() => G.navGoals.clear(), null); pinId = null; }
}
function ensureStage(ev) { if (stage && stage.ev === ev) return true; teardown(); const c = city(); if (!c || !c.world) return false; const g = roadGraph(); if (!g) return false; patchGraph(); stage = buildStage(ev, c, g); { const L = safe(() => G.traffic.loops, {}); for (const k in L) for (const e of stage.edges) if (L[k].edges.includes(e) || L[k].edges.includes(e.rev)) console.warn('cityevents: ' + ev.id + ' closes ' + e.road.id + ' which bus loop ' + k + ' uses'); } if (!c._cevLights) { c._cevLights = true; const prev = c.lights; c.lights = (m, cam, pool) => { if (prev) prev(m, cam, pool); floatLights(m, cam, pool); }; } return true; }
function floatLights(m, cam, pool) { if (!stage || stage.level < 3 || !(G.env && (G.env.dark || 0) > .35)) return; const ps = pool(2.6, '#ffe2b0'), hw = ps.width >> 1, hh2 = ps.height >> 1; for (const el of stage.els) { const e = el.e; if (e.hidden || !e.isFloat) continue; const sx = Math.round((e.x - e.y) * 16) - cam.x - hw, sy = Math.round((e.x + e.y) * 8 - e.z * 16) - cam.y - hh2; if (sx > G.W || sy > G.H || sx + ps.width < 0 || sy + ps.height < 0) continue; m.drawImage(ps, sx, sy); } }

function sync() {
  if (!S) return; const c0 = city(); if (!c0 || !c0.world) return; wrapPlaces(); const t = G.state.t; let o = occ(t), lvl = o ? levelOf(o, t) : 0;
  if (o && lvl === 0 && o.forced) { S.force = null; o = occ(t); lvl = o ? levelOf(o, t) : 0; }
  if (S.cur && (!o || lvl === 0 || S.cur.id !== o.ev.id || S.cur.base !== o.base)) { S.cur = null; }
  if (o && lvl > 0 && !S.cur) S.cur = { id: o.ev.id, base: o.base, u: -1, pst: 0, fin: 0, delay: 0, joined: 0, lit: 0, watch: 0, mood: 0, n: {}, games: {} };
  const kev = keeper(t), tev = o && lvl > 0 ? o.ev : kev;
  if (!tev) { if (stage) teardown(); return; }
  if (!ensureStage(tev)) return; const keepOn = kev === tev, ev = tev, c = S.cur;
  if (!(o && lvl > 0)) lvl = 0;
  /* the winter tree: dark until it has been lit this year */
  if (stage.prop('tree')) { const lit = S.treeLit === yearOf(t) + 1; stage.setProp('tree', { st: lit ? 'lit' : 'dark' }); stage.setProp('switch', { on: lit }); }
  if (lvl !== lastLvl || stage.level !== lvl) { stage.setLevel(lvl, keepOn); if (lvl >= 3) wire(); else unwire(); if (lastLvl !== lvl) G.emit('cityevent:level', ev.id, lvl); lastLvl = lvl; }
  if (!c) { if (closed) setClosed(false); return; }
  const m = t - c.base, tx = ev.texts;
  if (lvl >= 1) note('a', ev.name, tx.announce); if (lvl >= 2 && m < 0) note('e', ev.name, tx.eve); if (lvl >= 2 && m >= 420 && m < ev.open[1] * 60) { note('t', ev.name + ' today', tx.today); if (m >= 450) offerOpp(ev); }
  /* closure */
  if (lvl === 3 && !closed) { const busy = safe(() => G.transit.ride || G.transit.pending, null); if (!busy || m >= ev.paradeAt * 60 - 6) { setClosed(true); note('s', ev.name, tx.start); if (safe(() => G.weather.isWet(), false) && ev.wx === 'rain_ok') note('r', ev.name, tx.rain, 'low'); } }
  else if (lvl !== 3 && closed) { setClosed(false); if (m >= ev.open[1] * 60) note('x', ev.name, tx.end, 'low'); }
  if (lvl !== 3) return;
  /* parade */
  if (c.pst === 0 && m >= ev.paradeAt * 60 + c.delay) {
    const storm = ev.wx === 'rain_ok' && safe(() => G.weather.current().kind, 'clear') === 'storm';
    if (storm && m < ev.open[1] * 60 - 50) { c.delay += 10; note('st', ev.name, tx.storm); }
    else if (storm) { c.pst = 2; }
    else { c.pst = 1; c.u = 0; if (closed) drain(true); note('p', ev.name, tx.parade); G.emit('cityevent:parade', ev.id); }
  }
  if (ev.finaleAt && c.fin === 0 && m >= ev.finaleAt * 60) { c.fin = 1; finT = 0; note('f', ev.name, tx.finale); G.emit('cityevent:finale', ev.id); if (ev.id === 'lantern_parade' && inCity()) FX.lanterns(ev.site.x, ev.site.y + 2, 60); }
  if (ev.id === 'winter_parade' && c.fin >= 1 && !c.lit && m >= ev.finaleAt * 60 + 9) lightTree(false);
  /* being there */
}
function pinTick() {   /* the arrow: from the site to the thing to do (BIBLE update 19) */
  if (!stageOk() || !inCity() || !G.navGoals || !G.navGoals.set) return; const ev = stage.ev, m = ev.moment, mp = m && stage.prop(m.prop), c = S.cur; if (!mp || !c) return;
  const wp = safe(() => G.phone.waypoint(), null), mine = wp && wp.id === 'cev:' + ev.id, p = G.player, d = Math.hypot(p.x - mp.x, p.y - mp.y);
  if (!pinId && mine && !c.joined && momentOpen() && stage.near(p.x, p.y) < 26) { pinId = safe(() => G.navGoals.set({ room: 'city', find: { x: mp.spot.x, y: mp.spot.y, h: 1.2 }, label: m.title + ': ' + m.label.toLowerCase(), short: m.label, done: 'cityevent:join', near: 1.4, name: m.label }), null) || 'pin'; }
  else if (pinId && (c.joined || !momentOpen() || d < 1.6 || stage.near(p.x, p.y) > 60)) { safe(() => G.navGoals.clear(), null); pinId = null; if (d < 1.6 && mine) safe(() => G.phone.setWaypoint(null), null); }
}

function update(dt, gm) {
  if (!S) return; T += dt; if (fpsAcc) { fpsAcc.n++; fpsAcc.t += dt; if (dt > fpsAcc.max) fpsAcc.max = dt; }
  if ((tSync -= dt) <= 0) { tSync = .5; sync(); pinTick(); }
  if (!stage) return; const c = S.cur, ev = stage.ev, here = inCity();
  if (closed && drainT > 0) { drainT -= dt; if (drainT <= 0) drain(true); else if (((T * 2) | 0) !== (((T - dt) * 2) | 0)) drain(false); }
  if (stage.level < 3 || !c) { return; }
  const p = G.player, near = here && stage.near(p.x, p.y) < 110;
  if (c.pst === 1) { c.u += (near ? dt : gm) * TUNE.paradeSpeed; if (c.u >= stage.cycle * stage.passes) { c.pst = 2; c.u = -1; if (c.watch >= 3 && !c.wr) { c.wr = 1; give({ needs: ev.watched }); if (here && near) toast('What a parade. You feel lighter for having seen it.', 'good'); } } }
  if (c.fin === 1) { finT += near ? dt : gm; const b = stage.prop(1);
    if (ev.id === 'harbor_day') { if (here && near && Math.random() < dt * 2.6) FX.firework(b ? b.x : ev.site.x, b ? b.y : ev.site.y + 40); if (finT > 95) { c.fin = 2; if (c.watch >= 3 && !c.fr) { c.fr = 1; safe(() => G.needs.addMoodlet('fireworks_awe'), null); } } cheerT = 2; }
    else if (ev.id === 'lantern_parade') { if (here && near && ((finT / 6) | 0) !== (((finT - dt) / 6) | 0) && finT < 40) FX.lanterns(ev.site.x, ev.site.y + 2, 26); if (finT > 45) c.fin = 2; cheerT = 2; }
    else if (finT > 30) c.fin = 2; }
  if (riding) rideTick(dt);
  if (!here) return;
  if (cheerT > 0) cheerT -= dt;
  /* ambient air: petals in spring, leaves in autumn, a little confetti behind the floats */
  if (near && c.pst === 1 && Math.random() < dt * 3) { const el = stage.els[(Math.random() * stage.els.length) | 0]; if (el && !el.e.hidden && el.k === 'float' && !el.water) { if (ev.scheme === 'blossom') FX.petals(el.e.x, el.e.y, 5); else if (ev.scheme === 'harvest') FX.leaves(el.e.x, el.e.y, 3); else if (ev.scheme === 'fair') FX.confetti(el.e.x, el.e.y, 4); else if (ev.scheme === 'winter') FX.sparkle(el.e.x, el.e.y, 3, 3); } }
  const m = (G.state.t - c.base) / 60, pa = ev.paradeAt + c.delay / 60, wet = safe(() => G.weather.isWet(), false);
  let dens = m < pa - TUNE.gatherMin / 60 ? .14 : m < pa ? .14 + .86 * (m - (pa - TUNE.gatherMin / 60)) / (TUNE.gatherMin / 60) : c.pst === 1 ? 1 : c.pst === 2 && m < pa + 1.2 ? .55 : .2;
  if (ev.finaleAt && m > ev.finaleAt - .7 && m < ev.finaleAt + .6) dens = Math.max(dens, .95); if (wet) dens *= .55;
  stage.update(dt, { u: c.pst === 1 ? c.u : -1, dens, densA: wet ? .4 : .75, t: T, cheer: cheerT > 0 });
}

function reload() { teardown(); S = G.state.cityEvents || (G.state.cityEvents = fresh()); for (const k in fresh()) if (S[k] === undefined) S[k] = fresh()[k]; if (S.cur) { S.cur.n = S.cur.n || {}; S.cur.games = S.cur.games || {}; } tSync = 0; }

/* ---------- debug ---------- */
function snapshot() {
  const c = city(); if (!c) return null; const w = c.world; let h = 0, nb = 0; const mixh = v => { h = (Math.imul(h, 31) + (v | 0)) | 0; };
  for (const ob of w.objs) { mixh(ob.x * 2); mixh(ob.y * 2); mixh(ob.z * 16); for (let i = 0; i < ob.id.length; i += 3) mixh(ob.id.charCodeAt(i)); mixh(ob.hidden ? 1 : 0); mixh(ob.solid ? 1 : 0); }
  for (let y = 0; y < w.h; y += 1) for (let x = 0; x < w.w; x += 1) if (w.isBlocked(x + .5, y + .5)) { nb++; mixh(x * 400 + y); }
  const g = roadGraph(); let cl = 0; for (const e of g.edges) if (e.closed) cl++;
  return { objs: w.objs.length, lights: w.lights.length, pois: w.pois.length, blocked: nb, hash: h, closedEdges: cl, nClosed, ents: c.ents.length, stageObjs: stage ? stage.placed.length : 0, level: stage ? stage.level : 0, routePatched: graphPatched, fx: FX.count() };
}
const debug = {
  start(id, hour) { const ev = CITY_EVENT_BY_ID[id]; if (!ev) return false; teardown(); S.cur = null; const h = hour === undefined ? ev.paradeAt - .34 : hour; S.force = { id, base: G.state.t - Math.round(h * 60) }; tSync = 0; sync(); return true; },
  at(hour) { if (!S.force) return false; const t = G.state.t; S.force.base = t - Math.round(hour * 60); if (S.cur) S.cur.base = S.force.base; tSync = 0; sync(); return true; },
  stop() { S.force = null; S.cur = null; teardown(); tSync = 0; sync(); return true; },
  parade(u) { const c = S.cur; if (!c) return false; c.pst = 1; c.u = u || 0; if (closed) drain(true); return true; }, finale() { const c = S.cur; if (!c) return false; c.fin = 0; debug.at(stage.ev.finaleAt || stage.ev.paradeAt); return true; },
  moment() { const m = stage && stage.ev.moment; if (!m) return false; debug.at(Math.max(m.from + .05, Math.min(m.to - .3, hourNow()))); const pr = stage.prop(m.prop); return pr ? pr.spot : null; },
  snapshot, fps(sec = 5) { return new Promise(res => { fpsAcc = { n: 0, t: 0, max: 0 }; const t0 = performance.now(); const iv = setInterval(() => { if (performance.now() - t0 >= sec * 1000) { clearInterval(iv); const a = fpsAcc; fpsAcc = null; res({ fps: +(a.n / Math.max(.001, a.t)).toFixed(1), worstMs: +(a.max * 1000).toFixed(1), frames: a.n }); } }, 100); }); },
  get fx() { return FX; },
};

export function init() {
  S = G.defineState('cityEvents', fresh);
  for (const ev of CITY_EVENTS) { const row = EVENTS.find(e => e.id === ev.cal); if (row) { row.place = Object.assign({}, row.place, { poi: 'cev:' + ev.id }); row._loc = undefined; } }
  G.cityEvents = {
    TUNE, debug, join, get stage() { return stage; },
    list() { const t = G.state.t, d0 = Math.floor(t / DAY), out = []; for (let d = d0; d < d0 + 56; d++) { const ev = evOnDay(d); if (ev) out.push({ id: ev.id, name: ev.name, day: d, t0: d * DAY + ev.open[0] * 60, t1: d * DAY + ev.open[1] * 60, paradeT: d * DAY + ev.paradeAt * 60 }); } return out; },
    next() { return this.list()[0] || null; },
    current() { const o = occ(G.state.t); if (!o) return null; return { ev: o.ev, level: levelOf(o, G.state.t), m: G.state.t - o.base, cur: S.cur }; },
    live() { return stageOk() ? stage.ev : null; }, isClosed(rid) { return closed && (!rid || stage.edges.some(e => e.road.id === rid)); }, place: placeOf,
  };
  G.addSystem({ name: 'cityevents', update });
  G.overlays.push(drawFX);
  G.on('minutes', d => { tSync = 0; const c = S && S.cur; /* being there: minutes spent at a live event */
    if (c && stageOk() && inCity() && !G.player.hidden && stage.near(G.player.x, G.player.y) < TUNE.nearSite) { c.watch += Math.min(30, d || 1); if (c.watch >= TUNE.watchMinutes && !c.mood) { c.mood = 1; safe(() => G.needs.addMoodlet('festival_spirit'), null); } } });
  G.on('load', reload);
  G.on('scene', s => { if (s && s.id === 'city') { wrapPlaces(); tSync = 0; } });
  G.on('season', () => { clearLooks(); });
  G.on('ready', wrapPlaces);
}
