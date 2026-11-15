// navgoals.js — LAST-METRE GUIDANCE (owner msg 102, BIBLE direction update 19): the guide arrow leads to the exact thing the player has to do,
// not just to the building. This module owns the OBJECTIVE model + one RESOLVER per system that sends the player somewhere; ui/navarrow.js only asks
// `G.navGoals.guide(o)` every frame and draws what comes back (and `fixEdges` completes its room graph).
//
// OBJECTIVE (what a resolver returns; a "step" of it, re-derived from live state ~5x per second):
//   { room: room id ('cityhall_council', no 'int:') | 'city',
//     find: what to mark in that room — { label: RegExp } an interactable | { tag: 'till' | [tags] } a fixture | { asset: 'furn.x' } | { npc: castId } |
//           { ent: fn(entity) } | { x, y, h?, z? } an explicit spot | fn(scene) -> { x, y } | an array of those (first that resolves) | null (chip only),
//     label: 'Deliver to Rosa at the counter' (the arrow text in the room), short?: text used after "Exit → ..." / "Go in: X → ...", far?: city text,
//     near?: units — reaching the target within this distance completes the objective, done?: true — the objective is complete NOW,
//     quiet?: no "You have arrived" toast, name?: what the arrival toast calls it }
//   The arrow walks the player there through as many rooms as needed (navarrow's exit graph), marks the target with the label, and the objective ends
//   ONLY when the resolver says `done` (seated, handed over, talked to...) or `near` is reached: arriving at the door no longer clears the waypoint.
//
// WHICH objective (rule c: the one the player selected wins):
//   - a waypoint / trip destination ("attached"): resolvers are asked for the building it leads to; a tapped goal / appointment / need row (remembered in
//     G.state.navgoals.sel from the click on the widget) gets +1000 priority, then the resolver priorities (commitments > chain steps > live events > default);
//   - no waypoint: only 'strong' resolvers (the active shift task) and, while you are INSIDE their building, 'commit' resolvers (a ticket you hold, an
//     appointment in its window, a meeting you signed up for). 'default' resolvers (the till of a shop, the information desk) need a waypoint.
//   - a trip that is still on its way (walk to the stop, ride, cab) keeps navarrow's own guidance.
//
// G.navGoals = {
//   guide(o) -> arrow target { mode: 'point' | 'chip', x, y, label, ... } | null       (called by ui/navarrow.js compute(); o = its objective() or null)
//   current() -> { id, step, attached, root } | null                                  the objective being followed right now (debug / tests)
//   set({ room, find, label, done?: event name | predicate fn, near?, name? }) -> id   pin an explicit objective (wins over everything); clear() removes it
//   define(id, kind: 'strong' | 'commit' | 'default', prio, fn(ctx) -> step | null)    add a resolver (ctx: { root, here, attached, pt, placeId, sel, t })
//   select({ goal?, appt?, need?, entry? } | null)                                     what the player picked (set automatically from the goals widget / need chooser / Wander)
//   locate(find) -> { x, y, h } | null                                                 resolve a `find` in the current scene
//   rootOf(roomId) -> the building's entrance room ('cityhall_council' -> 'cityhall')   doorOf(roomId) -> city door poi
//   fixEdges(sceneId, edges, liveScene) -> edges    GRAPH (below) adds the room links navarrow cannot see: bathrooms, lifts, curtains, turnstiles, tunnels
//   path(fromSceneId, toSceneId) -> [scene ids] | null      breadth-first over the same graph (tools/navcheck.mjs)
//   audit() -> rows for the regression table,  list -> resolver ids }
// Events: 'navgoal'(id | null) when the followed objective changes, 'navgoal:done'(id, step).   State: G.state.navgoals = { sel, pin }.
// Hooks into other systems: none — every resolver reads public state (_jobs_work.cur() / city.get(), G.shows.run, G.cityhall.*, G.arena.*, ...) and what the
//   player picked is read from the click itself ([data-g] / [data-a] goal + appointment rows, [data-fix] need chooser, [data-navrow] Map "Where to?", Wander's
//   "Take me there"). The courier's hand-over inside a venue is an interactable this module adds to the room; it calls the job's own city interactable.
// Resolvers (ids): shift, cab (a called / hailed cab outside a Map trip, QA7), gig, clockin, show, council, wedding, mayor, records, ch_chain, arena, arena_chain, cons_tour, mus_tour, cons_chain, mus_chain, obs_show,
//   obs_chain, aqua_show, aqua_chain, hotel_dine, hotel_event, hotel_room, hotel_chain, fish_auction, lh_lamp, lh_chain, nat_swim, nat_chain, story, meet, wander,
//   need, default. Audit table, what was played and the known gaps: docs/reports/navgoals.md.   Regression check: node tools/navcheck.mjs
import { G } from '../core/game.js';
import { toast, el } from '../ui/kit.js';
import { ROOMS } from '../scenes/interior.js';
import { VENUE_BY_ID } from '../data/venues.js';
import { cur as workCur, city as workCity } from './_jobs_work.js';
import { SHOWS as AQ_SHOWS } from '../data/aquarium.js';

export const order = 136;   /* right after ui/navarrow.js (135) */
const DAY = 1440, NEAR_IN = 2.2;
const safe = (f, d) => { try { const v = f(); return v === undefined || v === null ? d : v; } catch (e) { return d; } };
const now = () => G.state.t;
const clock = t => { const m = Math.round(((t % DAY) + DAY) % DAY), h = Math.floor(m / 60) % 24; return (h < 10 ? '0' : '') + h + ':' + (m % 60 < 10 ? '0' : '') + (m % 60); };
const cityScene = () => (G.sceneCache && G.sceneCache.get('city')) || null;
const cityPoi = id => safe(() => cityScene().world.pois.find(p => p.id === id), null);
const place = id => safe(() => G.places.get(id), null);
const roomId = () => (G.scene && /^int:/.test(G.scene.id) ? G.scene.id.slice(4) : null);
const inRoom = rid => !!G.scene && G.scene.id === 'int:' + rid;
const busyIs = re => !!G.busy && re.test(G.busy.label || '');
const SS = () => G.state.navgoals || (G.state.navgoals = { sel: null, pin: null });

/* ---------- buildings: which rooms belong together ---------- */
const FAMILY = [[/^cityhall(_|$)|^lobby:4$/, 'cityhall'], [/^hotel(_|$)/, 'hotel'], [/^lighthouse(_|$)/, 'lighthouse'], [/^skydeck/, 'skydeck_lobby'], [/^mall:/, 'deptstore']];
export function rootOf(rid) {
  if (!rid) return null; rid = String(rid).replace(/^int:/, ''); for (const f of FAMILY) if (f[0].test(rid)) return f[1];
  const p = rid.split(':'); return /^(home|pub|lobby|goods)$/.test(p[0]) ? p.slice(0, 2).join(':') : p[0];
}
/* QA9: the other rooms of one building (University: the Commons behind the Great Hall), for "where can I fix this?" (navigator.js) and the need resolver */
let subN = -1; const subC = new Map();
export function subRooms(rid) {
  if (!rid || /^home/.test(rid)) return []; if (subN !== ROOMS.size) { subN = ROOMS.size; subC.clear(); }
  if (!subC.has(rid)) { const out = []; for (const k of ROOMS.keys()) if (k !== rid && rootOf(k) === rid) out.push(k); subC.set(rid, out); } return subC.get(rid);
}
export const doorOf = rid => { const r = rootOf(rid); return cityPoi('door:' + r) || place(r) || safe(() => G.mailboxes.doorOf(r), null) || null; };   /* mailboxes: a home's lobby is behind the home's street door */
const placeName = rid => { const r = rootOf(rid), p = place(r) || cityPoi('door:' + r); return (p && p.name) || safe(() => ROOMS.get(r).name, null) || 'the building'; };

/* ---------- GRAPH: room links the arrow's scene graph cannot read from the room definitions ----------
   [scene id | RegExp, label RegExp, to: scene id | [scene ids] | fn(sceneId) -> scene id]. Found with tools/navcheck.mjs (it uses every door-like interactable for real). */
const LIFT = ['int:hotel', 'int:hotel_floor', 'int:hotel_spa', 'int:hotel_bar'];
const GRAPH = [
  [/^int:home:[^:]+$/, /^Bathroom$/, s => s + ':bath'], [/^int:home:[^:]+$/, /^Leave$/, s => safe(() => G.mailboxes.leaveTo(s), null) || 'city'],   /* mailboxes: YOUR apartment leaves into its lobby */
  [/^int:(concerthall|playhouse)$/, /^Auditorium$/, s => s + ':hall'], ['int:cinema', /^Screen 1$/, 'int:cinema:screen1'],
  ['int:arena', /^(Into the bowl|Turnstiles$)/, 'int:arena:bowl'], ['int:arena', /^TEAM ONLY$/, 'int:arena:backstage'], ['int:arena:backstage', /^Tunnel to the court$/, 'int:arena:bowl'], ['int:arena:bowl', /^Team tunnel$/, 'int:arena:backstage'],
  [/^int:hotel(_floor|_spa|_bar)?$/, /^Lift$/, s => LIFT.filter(x => x !== s)], ['int:hotel_floor', /^Room \d+$/, 'int:hotel_room'], ['int:hotel', /^Stairs up to The Tidewater Spa$/, 'int:hotel_spa'],
  ['int:natatorium', /^Exit to/, 'city'],
  /* QA round 5: the 13 home-goods stores leave by "Exit to the street" (navarrow only reads Exit/Leave exits); Nana's attic ladder (chapters) */
  [/^int:goods:[^:]+$/, /^Exit to the street$/, 'city'], ['int:home:grandma', /^The attic ladder$/, 'int:home:grandma:attic'],
  ['int:observatory', /^Planetarium/, 'int:observatory:planetarium'], ['int:observatory', /^Stairs to the dome/, 'int:observatory:roof'], ['int:observatory:roof', /^Stairs down$/, 'int:observatory'],
  ['int:aquarium', /^Staff door/, 'int:aquarium:lab'], ['int:aquarium', /^Stairs to the Turtle Lagoon$/, 'int:aquarium:turtles'], ['int:aquarium', /^Stairs down to the (Ocean Tunnel|Deep)$/, 'int:aquarium:deep'], ['int:aquarium', /^Door to the Harbor Deck$/, 'int:aquarium:deck'],
  ['int:aquarium:deep', /^Stairs up to/, 'int:aquarium'],
  ['int:skydeck_lobby', /^Lift to the SkyDeck$/, 'int:skydeck'], ['int:skydeck', /^Lift down to the lobby$/, 'int:skydeck_lobby'],
  ['int:airport:concourse', /^Tram to Baggage Claim$/, 'int:airport:terminal'], ['int:airport:terminal', /^Tram to Gates/, 'int:airport:concourse'],
];
const graphFor = sid => GRAPH.filter(g => (typeof g[0] === 'string' ? g[0] === sid : g[0].test(sid)));
const toOf = (g, sid) => { let t = typeof g[2] === 'function' ? g[2](sid) : g[2]; t = Array.isArray(t) ? t : [t]; return t.filter(x => x === 'city' || ROOMS.has(x.slice(4))); };
/** complete navarrow's edge list for a scene (called from navarrow.edges). live = the scene object when sid is the current scene */
export function fixEdges(sid, out, live) {
  const hx = OFF ? null : safe(() => G.housing.navEdges(sid), null);   /* more homes: stairs, room doors and "back" mats of multi-room homes (sim/housing.js) */
  if (hx) for (const e of hx) { const h0 = out.find(o => Math.abs(o.x - e.x) < .8 && Math.abs(o.y - e.y) < .8); if (h0) { h0.to = e.to; h0._g = 1; } else out.push({ x: e.x, y: e.y, spot: e.spot, label: e.label, to: e.to, exit: false, out: false, _g: 1 }); }
  /* QA11: a home's inner room (a bathroom, an attic) read from its definition got a phantom "Exit" to the city at (0, 0); with the flat's two doors the
     same length, the cab arrow said "Bathroom → meet your cab outside". Inner rooms of a home only lead back into the home. */
  if (/^int:home:[^:]+:/.test(sid)) for (let i = out.length - 1; i >= 0; i--) { const o = out[i]; if (o.to === 'city' && !o._g && (!live || (o.x === 0 && o.y === 0))) out.splice(i, 1); }
  const mx = OFF ? null : safe(() => G.mailboxes.navEdges(sid), null);   /* mailboxes: the stairs / lift of YOUR lobby lead up to your flat */
  if (mx) for (const e of mx) if (!out.some(o => o.to === e.to)) out.push({ x: e.x, y: e.y, label: e.label, to: e.to, exit: false, out: false, _g: 1 });
  const gs = OFF ? [] : graphFor(sid); if (!gs.length) return out;
  const at = (x, y) => out.filter(o => Math.abs(o.x - x) < .8 && Math.abs(o.y - y) < .8);
  const put = (x, y, label, to, spot) => { const here = at(x, y); if (here.some(o => o.to === to)) return; const e = here.find(o => !o._g);
    if (e) { e.to = to; e._g = 1; if (to === 'city') e.out = true; } else out.push({ x, y, spot, label, to, exit: false, out: to === 'city', _g: 1 }); };
  if (live) { for (const it of live.interactables || []) { if (!isFinite(it.x) || (it.visible && !safe(() => it.visible(), true))) continue; for (const g of gs) if (g[1].test(it.label || '')) toOf(g, sid).forEach(to => put(it.x, it.y, it.label, to, it.spot)); } }
  else for (const g of gs) { const tos = toOf(g, sid), ex = out.filter(o => g[1].test(o.label || '')); if (ex.length && tos.length === 1) ex.forEach(o => { o.to = tos[0]; }); else tos.forEach(to => { if (!out.some(o => o.to === to)) out.push({ x: 0, y: 0, label: 'Door', to, exit: false, _g: 1 }); }); }
  return out;
}
/** shortest known chain of scenes from -> to (both scene ids), or null */
export function path(from, to) {
  if (from === to) return [from]; const E = sid => safe(() => G.navArrow.edges(sid), []), prev = new Map([[from, null]]); let q = [from];
  for (let depth = 0; depth < 8 && q.length; depth++) { const nx = []; for (const a of q) for (const e of E(a)) { if (!e.to || prev.has(e.to)) continue; prev.set(e.to, a); if (e.to === to) { const p = [to]; let c = a; while (c) { p.unshift(c); c = prev.get(c); } return p; } if (e.to !== 'city') nx.push(e.to); } q = nx; }
  return null;
}

/* ---------- finding the thing in the room ---------- */
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const nearest = (list, key = q => q) => { const p = G.player; let best = null, bd = 1e9; for (const q of list) { const k = key(q), d = Math.hypot(k.x - p.x, k.y - p.y); if (d < bd) { bd = d; best = q; } } return best; };
function locate1(sc, f) {
  if (!f || !sc) return null;
  if (Array.isArray(f)) { for (const q of f) { const r = locate1(sc, q); if (r) return r; } return null; }
  if (typeof f === 'function') return safe(() => f(sc), null);
  if (typeof f.x === 'number') return f;
  if (f.label) { const all = G.interactables().filter(i => isFinite(i.x) && f.label.test(i.label || '') && (!f.ok || f.ok(i))), fix = all.filter(i => !i.ent), it = nearest(fix.length ? fix : all);   /* a desk and its clerk share a label: the desk is what you use */ return it ? { x: it.x, y: it.y, z: it.z && !it.ent ? Math.max(0, it.z - .3) : 0, h: it.ent ? 2.3 : Math.min(2.4, (it.h || 1) + 1.05), it } : null; }
  if (f.npc) { const c = safe(() => G.social.char(f.npc), null) || (sc.ents || []).find(e => e.npcId === f.npc); return c && !c.hidden ? { x: c.x, y: c.y, z: c.zoff || 0, h: 2.3, ent: c } : null; }
  if (f.ent) { const c = nearest((sc.ents || []).filter(e => !e.hidden && safe(() => f.ent(e), false))); return c ? { x: c.x, y: c.y, h: 2.3, ent: c } : null; }
  if (f.tag) { for (const t of [].concat(f.tag)) { const fx = nearest(safe(() => sc.byTag(t), []).filter(q => !f.ok || f.ok(q))); if (fx) return { x: fx.x, y: fx.y, h: Math.min(2.6, ((fx.ob.size && fx.ob.size[2]) || 1) + (fx.ob.z || 0) + .9), fx }; } return null; }
  if (f.asset) { const fx = nearest((sc.fixtures || []).filter(q => q.asset && q.asset.id === f.asset)); return fx ? { x: fx.x, y: fx.y, h: Math.min(2.6, ((fx.ob.size && fx.ob.size[2]) || 1) + .9), fx } : null; }
  return null;
}
export const locate = f => locate1(G.scene, f);

/* ---------- resolvers ---------- */
const RES = [];
/** kind: 'strong' (always asked) | 'commit' (asked with a waypoint to its building, or while you are inside it) | 'default' (only with a waypoint) */
export function define(id, kind, prio, fn, sel) { const i = RES.findIndex(r => r.id === id), r = { id, kind, prio, fn, sel }; if (i >= 0) RES[i] = r; else RES.push(r); RES.sort((a, b) => b.prio - a.prio); return r; }
const apptsAt = (root, pad = 75) => safe(() => G.planner.list(now() - 600, now() + pad, { events: false }), []).filter(a => !a.event && a.s !== 3 && a.s !== 4 && a.placeId && rootOf(safe(() => place(a.placeId).roomId, a.placeId)) === root && a.t - pad <= now() && a.t + (a.dur || 60) > now());
const selGoal = (ctx, id) => !!(ctx.sel && ctx.sel.goal === id);

/* -- jobs: the active shift task (all 10 jobs) + the courier's deliveries. Reads the work engine (W = _jobs_work.cur()); nothing is declared in the job files. */
let hand = null;   /* courier: the hand-over spot inside the venue the parcel is for { it, st, scene } */
const RECIPIENT = [{ label: /^(Order|Shop|Front desk|Reception|Box office|Information desk|Information|Front office|Host stand|Tickets)\b/ }, { tag: ['till', 'checkout', 'front_desk', 'reception', 'counter', 'bar_counter'] }];
const courierStep = () => { const W = workCur(); if (!W || W.paused) return null; for (const o of W.orders) { const st = o.steps[o.i]; if (st && st.city) return st; } return null; };
function syncHandover() {
  const st = courierStep(), rid = roomId(), poi = st && st.city.id && cityPoi(st.city.id), want = st && rid && poi && poi.room === rid ? st : null;
  if (hand && (hand.st !== want || hand.scene !== G.scene)) { const a = hand.scene.interactables, i = a.indexOf(hand.it); if (i >= 0) a.splice(i, 1); hand = null; }
  if (!want || hand) return;
  const sc = G.scene, p = locate1(sc, RECIPIENT) || (sc.spawn ? { x: sc.spawn.x, y: sc.spawn.y - 1.2 } : null); if (!p) return;
  const it = { x: p.x, y: p.y, h: 1.4, hit: 14, range: 2.4, spot: p.it && p.it.spot ? p.it.spot : p.fx && p.fx.use ? p.fx.use : undefined, label: 'Hand over the parcel', navgoal: true, use: () => { const c = workCity.get('shift'); if (c && c.use && hand && courierStep() === hand.st) c.use(); } };
  sc.interactables.unshift(it); hand = { it, st: want, scene: sc, at: p.it ? 'at the counter' : p.fx ? 'at the counter' : 'here' };
}
define('shift', 'strong', 90, ctx => {
  const W = workCur(); if (!W || W.paused) return null;
  const o = W.orders.find(q => q.steps[q.i] && q.steps[q.i].city) || W.active || W.orders[0], st = o && o.steps[o.i]; if (!st) return null;
  if (st.city) {
    const c = st.city; if (ctx.attached && dist(ctx.pt, c) > 1.5) return null;   /* the player picked another destination: theirs wins */
    if (hand && hand.st === st && hand.scene === G.scene) return { room: roomId(), find: { x: hand.it.x, y: hand.it.y, h: 2.2 }, label: `Hand the parcel over ${hand.at}`, quiet: 1 };
    const poi = c.id && cityPoi(c.id), can = poi && poi.room && ROOMS.has(poi.room) && !/^home/.test(poi.room);
    return { room: 'city', find: { x: c.x, y: c.y, h: 3.3 }, label: st.name, close: can ? 'Deliver here: tap the gold marker, or go in' : 'Deliver here: tap the gold marker', short: st.name, quiet: 1 };
  }
  if (ctx.attached) return null;
  const rid = W.roomId.slice(4);
  if (!inRoom(rid)) return { room: rid, find: null, label: st.name, short: st.name, far: 'Back to work: ' + st.name, quiet: 1 };
  if (st.opts) return { room: rid, find: null, label: `${st.name}: find the ${st.color} marker${st.hint ? ' (' + st.hint + ')' : ''}`, quiet: 1 };
  const it = W.its.find(x => x._o === o); return it ? { room: rid, find: { x: it.x, y: it.y, h: Math.min(2.6, (it.h || 1) + 1.5) }, label: st.name, quiet: 1 } : null;
});
/* -- QA7: a cab you called or hailed (MapleCab, the intro, a story ride) that is not part of a Map trip (navarrow guides those itself): the arrow leads to it */
define('cab', 'strong', 95, ctx => {
  const pd = safe(() => G.transit.pending, null), t = trip(); if (!pd || !pd.cab || !pd.cab.active || pd.state === 'picking' || (t && t.mode === 'cab')) return null;
  const c = pd.cab, coming = pd.state === 'coming' || pd.state === 'hail';
  if (coming && pd.pick && isFinite(pd.pick.x)) return { room: 'city', find: { x: pd.pick.x, y: pd.pick.y, h: 1.8 }, label: 'Cab pick-up: wait at the kerb', far: 'Your MapleCab is on its way', short: 'your cab', quiet: 1 };
  return { room: 'city', find: () => ({ x: c.x, y: c.y, h: 2.2, ent: c }), label: 'Your MapleCab: tap it to get in', far: 'Your MapleCab is waiting', short: 'your cab', quiet: 1 };
});
/* -- gigs (dog walking, flyers, furniture): a chain of city targets, each finished by tapping its teal marker: the arrow stays on it until it is done */
define('gig', 'strong', 85, ctx => {
  const a = safe(() => G.jobs.activeGig(), null), t = a && a.targets && a.targets[a.i]; if (!t) return null; if (ctx.attached && dist(ctx.pt, t) > 1.5) return null;
  return { room: 'city', find: { x: t.x, y: t.y, h: 3.3 }, label: `${t.label}: ${t.name}`, close: `${t.label}: tap the teal marker`, short: t.label, quiet: 1 };
});
/* -- clock-in: a waypoint to your workplace (shift appointment / the "Shift at X" opportunity). You clock in by walking in during the window. */
define('clockin', 'commit', 60, ctx => {
  const j = safe(() => G.jobs.current(), null); if (!j || !ctx.attached || ctx.root !== rootOf(j.venue)) return null;
  if (j.onShift) return { done: true, quiet: 1, name: 'your shift at ' + j.venueName };
  if (j.nextShift == null || j.nextShift - now() > 240) return null;
  const early = j.nextShift - 30 - now();
  return { room: j.venue, find: null, label: early > 0 ? `Your shift starts at ${clock(j.nextShift)}: you clock in when you walk in from ${clock(j.nextShift - 30)}` : 'Walk in to clock in', short: 'clock in', done: false };
}, (ctx, s) => s.goal === 'job_shift');

/* -- shows: cinema, Symphony Hall, Lantern Playhouse. box office -> hall door / curtains (ticket check) -> your seat */
const HALLDOOR = { cinema: ['Screen 1: show your ticket', /^Screen 1$/], concerthall: ['Auditorium doors: show your ticket', /^Auditorium$/], playhouse: ['Through the curtains: show your ticket', /^Auditorium$/] };
define('show', 'commit', 80, ctx => {
  const v = safe(() => G.shows.venues(), []).find(q => q.lobby === ctx.root); if (!v) return null;
  const run = G.shows.run, t = now(), T = G.shows.TUNE, hd = HALLDOOR[v.id] || ['The hall: show your ticket', /^(Auditorium|Screen 1)$/];
  if (run && run.venue.id === v.id) {
    if (run.mine || run.phase !== 'doors') return { done: true, name: 'your seat for ' + run.prog.title };
    const s = run.seat0; return { room: v.hall, find: { x: s.x, y: s.y, z: Math.max(0, s.z - .2), h: 1.7 }, label: `Your seat: row ${String.fromCharCode(65 + s.row)}, seat ${s.n + 1}. Tap it to sit`, short: 'your seat' };
  }
  const tk = safe(() => G.shows.tickets(), []).find(k => k.venue === v.id && k.t + T.lateGrace > t);
  if (tk) { const open = t >= tk.t - T.doorsBefore; if (busyIs(/^Waiting for the doors/)) return { room: v.lobby, find: null, label: `Waiting for the doors: ${tk.title}, ${clock(tk.t)}` };
    return { room: v.lobby, find: { label: hd[1] }, label: open ? hd[0] : `Doors open ${clock(tk.t - T.doorsBefore)}: tap the door to wait here`, short: open ? 'your seat' : tk.title }; }
  if (!ctx.attached) return null;
  return { room: v.lobby, find: { label: /^Box office$/ }, label: 'Box office: pick a show and buy a ticket', short: 'box office', near: 0 };
});

/* -- default: a plain waypoint to a place with a room -> the counter / till / desk where you are served. Homes: nothing further. */
const SERVE = { label: /^(Order|Shop|Front desk|Reception|Box office|Tickets[ ,&]|Ticket desk|SkyDeck tickets|Information desk|Front office|Host stand|The Weathervane bar|Ballroom steward|The Tidewater Spa desk|Splash & Dash: the till)/ };
define('default', 'default', 0, ctx => {
  const root = ctx.root; if (!root || /^home/.test(root) || (ctx.pt.id && /^mall:/.test(ctx.pt.id))) return null;
  const rid = ctx.pt.room && ROOMS.has(ctx.pt.room) && rootOf(ctx.pt.room) === root ? ctx.pt.room : root, name = ctx.pt.name || placeName(root);
  const pl = place(root); if (pl && pl.open && !safe(() => pl.open(), true) && !ctx.here) return null;   /* closed: the old arrival at the door */
  if (!inRoom(rid)) return { room: rid, find: SERVE, label: name, short: name };
  const p = locate1(G.scene, SERVE); if (!p) return { done: true, name };
  return { room: rid, find: { x: p.x, y: p.y, h: p.h }, label: `${p.it.label}${/^(Order|Shop)$/.test(p.it.label) ? ' at the counter' : ''}`, near: NEAR_IN, name };
});

/* ---------- shared helpers for the showpiece resolvers ---------- */
const hf = () => G.now().hf;
const soon = (hours, lead, dur) => { const h = hf(); return (hours || []).find(q => h >= q - lead && h < q + dur); };
const want = ctx => ctx.attached || apptsAt(ctx.root).length > 0;   /* you asked to be taken there, or it is in your planner right now */
const goalOpen = id => { const g = safe(() => G.goals.get(id), null); return !!g && !g.done; };
const EV = {};   /* event flags: EV[name] / EV[name + ':' + firstArg] = game minute it last fired (init() subscribes to EVENTS) */
const EVENTS = ['cityhall:served', 'cityhall:chain', 'conservatory:chain', 'museum:chain', 'hotel:chain', 'natatorium:chain', 'observatory:chain', 'aquarium:chain', 'lighthouse:chain', 'arena:chain', 'lighthouse:lamp', 'social:talk', 'social:hangout', 'story:beat', 'show:ticket', 'arena:ticket', 'job:task', 'job:shift:start', 'cityhall:number', 'hotel:meal', 'natatorium:swimwear', 'conservatory:ticket', 'museum:ticket', 'observatory:ticket', 'aquarium:ticket'];
const since = (name, mins = 3) => EV[name] !== undefined && now() - EV[name] <= mins && now() >= EV[name];
let lastUse = null;   /* { label, t } of the last interactable the player used */
const usedLately = re => !!lastUse && now() - lastUse.t <= 2 && now() >= lastUse.t && re.test(lastUse.label);
const desk = (room, re, label, short) => ({ room, find: { label: re }, label, short });
const talk = (room, re, label, short) => ({ room, find: { label: re }, label, short, talk: 1 });   /* a person: talking to them is all the arrow asks for */
const citySpots = (list, label, name) => { const q = (list || []).filter(c => c && !c.got && isFinite(c.x)); if (!q.length) return null; const c = nearestCity(q); return { room: 'city', find: { x: c.x, y: c.y, h: 2.4 }, label, far: label, close: label, near: 2.2, name: name || label, quiet: 1 }; };
const nearestCity = list => { const p = safe(() => G.state.phone.cityPos, null) || G.player; let b = list[0], bd = 1e9; for (const q of list) { const d = Math.hypot(q.x - p.x, q.y - p.y); if (d < bd) { bd = d; b = q; } } return b; };
/** a showpiece opportunity ("chain"): with a waypoint to one of its buildings, the arrow goes to the person / fixture of the current step. fn(ctx, picked) -> step */
const chain = (id, roots, goal, ev, fn) => define(id, 'default', 5, ctx => {
  if (!goalOpen(goal)) return null; const picked = selGoal(ctx, goal); if (!(ctx.root && roots.includes(ctx.root)) && !picked) return null;
  const st = fn(ctx, picked); if (st && st.talk && usedLately(st.find.label)) return { done: true, quiet: 1 };
  return !st && since(ev, 2) && ctx.here && roots.includes(ctx.here) ? { done: true, quiet: 1 } : st;   /* the step was just done and the next one is not in this building */
}, (ctx, s) => s.goal === goal);

/* -- City Hall: council meeting (gallery seat / speakers' list / podium), weddings, the mayor, the Permits & Records queue, the fountain chain */
const CH = () => G.cityhall, chS = () => G.state.cityhall || {};
define('council', 'commit', 75, ctx => {
  if (ctx.root !== 'cityhall' || !CH()) return null;
  const cs = safe(() => CH().council.state(), null) || {}, S = chS(), sg = (S.council || {}).sign, n = G.now(), nx = safe(() => CH().council.next(), null);
  const pre = !cs.on && nx && nx.day === n.day && n.hf >= nx.from - 1 && n.hf < nx.from; if (!cs.on && !pre) return null;
  const signed = !!(sg && !sg.done && sg.day === (cs.on ? cs.day : nx.day)); if (!ctx.attached && !signed && !apptsAt('cityhall').length) return null;
  const R = 'cityhall_council';
  if (busyIs(/^(Watching the council|Speaking to the council)/) || (inRoom(R) && busyIs(/^Sitting$/))) return { done: true, name: 'the council meeting' };
  if (cs.on && cs.you && cs.phase === 'comment') return desk(R, /^The podium$/, 'The chair is calling you: speak at the podium', 'the podium');
  const ch = S.chain || {}; if (ch.st === 3 && ch.clerk && !signed && !(sg && sg.done)) return desk(R, /^Sign up to speak$/, 'Sign up to speak for Work Order 62-F', 'the speakers\' list');
  return desk(R, /^Sit in the public gallery$/, cs.on ? (signed ? 'Take a gallery seat until the chair calls you' : 'Council in session: take a seat in the gallery') : `Council meets at ${clock(nx.from * 60)}: take a seat in the gallery`, 'the Council Chamber');
});
define('wedding', 'commit', 74, ctx => {
  if (ctx.root !== 'cityhall' || !CH()) return null; const on = safe(() => CH().wedding.isOn(), false), mine = safe(() => CH().wedding.mine(), null), R = 'cityhall_clerk';
  const mineSoon = !mine && apptsAt('cityhall').some(a => /wedding/i.test(a.title || ''));
  if (!on && !mineSoon) return null; if (!ctx.attached && !mine && !mineSoon) return null;
  if (busyIs(/^At the wedding/)) return { done: true, name: 'the wedding' };
  const ph = inRoom(R) ? safe(() => G.scene.hot.phase(), null) : null;
  if (mine || mineSoon) return ph === 'kiss' || ph === 'exit' ? { done: true, name: 'your wedding' } : Object.assign(desk(R, /^The register$/, 'Your wedding: the Wedding Room, by the register', 'the Wedding Room'), { near: ph ? 0 : 2.4, name: 'the Wedding Room' });
  return desk(R, /^Sit with the wedding guests$/, 'A wedding is on: sit with the guests', 'the Wedding Room');
});
define('mayor', 'commit', 73, ctx => {
  if (ctx.root !== 'cityhall') return null; const a = chS().appt; if (!a || now() < a.t - 90 || now() > a.t + 75) return null;
  if (now() < a.t - 15) return Object.assign(desk('cityhall_clerk', /^Priscilla/, `The mayor sees you at ${clock(a.t)}: wait by her secretary`, 'the mayor\'s office'), { near: 2.4, name: 'the mayor\'s secretary' });
  return Object.assign(desk('cityhall_mayor', /^Mayor Winnie/, 'Your ten minutes: talk to Mayor Castellanos', 'the mayor'), { near: 2, name: 'the mayor' });
});
function queueStep(win, what) {
  const q = safe(() => CH().queue.state(), null), R = 'cityhall_records'; if (!q) return null;
  if (since('cityhall:served', 3)) return { done: true, name: what || 'the window' };
  if (!q.ticket || q.expired) return desk(R, /^Take a number$/, 'Take a number from the red machine', 'Permits & Records');
  if (!q.called) return G.busy ? { room: R, find: null, label: `Ticket ${q.ticket}: ${q.ahead} ahead of you` } : desk(R, /^Sit and wait for your number$/, `Ticket ${q.ticket}: sit and wait, ${q.ahead} ahead of you`, 'Permits & Records');
  return desk(R, win ? new RegExp('^Window ' + win) : /^Window \d/, win ? `Your number is up: window ${win}${what ? ', ' + what : ''}` : 'Your number is up: any window', 'the windows');
}
define('records', 'commit', 72, ctx => {
  if (ctx.root !== 'cityhall' || !CH()) return null; const q = safe(() => CH().queue.state(), null), S = chS(); if (!q || !q.ticket || q.expired || (S.q && S.q.served)) return null;
  const st = (S.chain || {}).st; return queueStep(st === 1 ? 4 : st === 5 ? 5 : 0, st === 1 ? 'Property Records' : st === 5 ? 'Lost & Found' : '');
});
chain('ch_chain', ['cityhall'], 'ch_fountain', 'cityhall:chain', (ctx, picked) => {
  const c = chS().chain || {}, st = c.st;
  if (st === 1) return queueStep(4, 'ask about the fountain work order');
  if (st === 2) return desk('cityhall_archive', c.drawer ? /^Map drawers$/ : /^Microfilm reader$/, c.drawer ? 'Open drawer 62-F in the map cabinet' : 'Wind the microfilm to June 1962', 'the Archive');
  if (st === 3 && !c.clerk) return talk('cityhall_clerk', /Bell, City Clerk$/, 'Show Work Order 62-F to Mr. Bell', 'the City Clerk');
  if (st === 3) { const sg = (chS().council || {}).sign; return sg && !sg.done ? null : desk('cityhall_council', /^Sign up to speak$/, 'Sign up to speak for Work Order 62-F', 'the speakers\' list'); }
  if (st === 5) return queueStep(5, 'ask for valve key V-7');
  if ((st === 4 || st === 6) && picked) { const m = safe(() => CH().plumber(), null); return m ? { room: 'city', find: { x: m.x, y: m.y, h: 2.4 }, label: 'Marta Kowalski, the plumber', close: 'Talk to Marta', near: 2.2, name: 'Marta, the plumber' } : null; }
  return null;
});

/* -- Arena: box office -> turnstiles -> "Your seat" in the bowl; the lucky-ball chain */
define('arena', 'commit', 78, ctx => {
  if (ctx.root !== 'arena' || !G.arena) return null; const A = G.arena, s = A.now(), on = s.ph !== 'none' && s.ph !== 'exit', live = on ? safe(() => A.ticketFor(s.ev), null) : null;
  if (live) { const B = safe(() => A.state(), null); if (B && B.seated) return { done: true, name: 'your seat' };
    if (!live.seat) return inRoom('arena:bowl') ? { done: true, name: 'the standing floor' } : { room: 'arena:bowl', find: null, label: 'Standing floor: in through the turnstiles', short: 'the floor' };
    return desk('arena:bowl', /^Your seat/, 'Your seat: tap it to sit down', 'your seat'); }
  const nx = safe(() => A.tickets(), []).filter(k => k.T0 > now() && k.T0 - now() < 180).sort((a, b) => a.T0 - b.T0)[0];
  if (nx) return Object.assign(desk('arena', /^Turnstiles$/, `${nx.title}: doors open ${clock(nx.T0 - 60)}`, nx.title), { near: 2.4, name: 'the turnstiles' });
  if (ctx.attached && on) return desk('arena', /^Box office: tickets$/, `${s.ev.title} is on: tickets at the box office`, 'the box office');
  return null;
});
chain('arena_chain', ['arena'], 'arena_ball', 'arena:chain', (ctx, picked) => {
  const c = safe(() => G.arena.chain(), {}), st = c.st;
  if (st === 1) return picked ? citySpots(safe(() => cityScene().world.pois, []).filter(p => /^arenaball:/.test(p.id || '')).map(p => ({ x: p.x, y: p.y, got: (c.found || []).includes(+p.id.split(':')[1]) })), 'Look for the lucky ball here') : null;
  if (st === 2) return desk('arena', /^Benny, equipment manager$/, 'Give the lucky ball back to Benny', 'Benny');
  if (st === 3) return talk('arena:backstage', /^Coach Delacroix$/, 'Say hello to Coach Delacroix', 'the locker corridor');
  if (st === 4) return desk('arena:backstage', /^The Ollie suit$/, 'Put on the Ollie suit (home game, before half-time)', 'the Ollie suit');
  return null;
});

/* -- Conservatory + Museum: guided tours (meet the docent), the cuttings / lost-objects chains */
const tourRes = (id, root, api, docent, deskRe, what) => define(id, 'commit', 70, ctx => {
  const C = api(); if (ctx.root !== root || !C) return null; const t = safe(() => C.tour.state(), null), h = soon(C.tour.times, .75, .25);
  if (t && t.on && t.joined) return { done: true, name: 'the guided tour' };
  if (!(t && t.on) && h === undefined) return null; if (!want(ctx)) return null;
  if (!safe(() => C.hasTicket(), true)) return desk(root, deskRe, `${what} ticket first: the ticket desk`, 'the tour');
  return Object.assign(desk(root, docent, t && t.on ? 'The tour is leaving: tap the docent to join' : `Guided tour at ${clock(h * 60)}: meet the docent here`, 'the tour'), { near: t && t.on ? 0 : 2.4, name: 'the tour meeting point' });
});
tourRes('cons_tour', 'conservatory', () => G.conservatory, /^Wendell, the docent$/, /^Tickets & tours$/, 'Garden');
tourRes('mus_tour', 'museum', () => G.museum, /^Ines, the docent$/, /^Tickets, audio guide & tours$/, 'Museum');
chain('cons_chain', ['conservatory'], 'cons_cuttings', 'conservatory:chain', (ctx, picked) => { const st = safe(() => G.conservatory.chain().st, 0);
  return st === 1 ? (picked ? citySpots(safe(() => G.conservatory.cuttings(), []), 'A curious plant: take a cutting') : null) : st === 2 ? talk('conservatory', /^Hattie, head gardener$/, 'Bring the cuttings to Hattie', 'Hattie') : null; });
chain('mus_chain', ['museum'], 'mus_lost', 'museum:chain', (ctx, picked) => { const st = safe(() => G.museum.chain().st, 0);
  return st === 1 ? (picked ? citySpots(safe(() => G.museum.lost(), []), 'A lost object: have a look') : null) : st === 2 ? talk('museum', /^Dr\. Okafor, the curator$/, 'Bring the finds to Dr. Okafor', 'the curator') : null; });

/* -- Observatory: planetarium show (ticket desk -> Star Theatre -> a seat), the comet chain */
define('obs_show', 'commit', 70, ctx => {
  if (ctx.root !== 'observatory' || !G.observatory) return null; const O = G.observatory, star = inRoom('observatory:planetarium') ? G.scene.star : null;
  if (star && star.mine) return { done: true, name: 'your seat in the Star Theatre' };
  const cur = safe(() => O.shows.current(), null), nx = cur || safe(() => O.shows.next(true), null), live = star && star.phase !== 'idle' && star.phase !== 'exit';
  if (!live && !(nx && nx.T - now() < 45)) return null; if (!live && !want(ctx)) return null;
  if (!safe(() => O.hasTicket(), true)) return desk('observatory', /^Tickets & showtimes$/, 'Day ticket first: the ticket desk', 'the planetarium');
  return desk('observatory:planetarium', /^Sit$/, live || cur ? 'Take any seat: tap it' : `${(nx.prog || {}).title || 'The show'} at ${clock(nx.T)}: take a seat`, 'the Star Theatre');
});
chain('obs_chain', ['observatory'], 'obs_comet', 'observatory:chain', () => { const st = safe(() => G.observatory.chain().st, 0);
  return st === 1 ? desk('observatory:roof', /^Look through the Great Telescope$/, 'Sweep the sky with the Great Telescope (clear nights)', 'the dome') : st === 2 ? talk('observatory', /^Dr\. Halvorsen, astronomer$/, 'Tell Dr. Halvorsen what you found', 'Dr. Halvorsen') : null; });

/* -- Aquarium: feedings + keeper talks at the spot where they happen, the turtle chain */
const AQ_AT = { penguin: [/^Sit and watch the penguins$/, 'Penguin feeding: watch from the benches'], rays: [/^Feed the rays$/, 'Ray Bay feeding: feed the rays here'], otter: [/^Sit in the stand$/, 'Otter feeding: sit in the stand'],
  dive: [/^Sit and watch the Big Blue$/, 'Dive show: sit by the Big Blue'], turtle: [/^Hold out a lettuce leaf$/, 'Turtle feeding: hold out a lettuce leaf'], octo: [/^Spot: Giant Pacific octopus$/, 'Meet the octopus: at the den'] };
define('aqua_show', 'commit', 70, ctx => {
  if (ctx.root !== 'aquarium' || !G.aquarium || !want(ctx)) return null; const h = hf();
  const sh = AQ_SHOWS.map(s => ({ s, at: s.at.find(q => h >= q - .6 && h < q + s.dur) })).filter(q => q.at !== undefined && AQ_AT[q.s.id]).sort((a, b) => a.at - b.at)[0]; if (!sh) return null;
  if (!safe(() => G.aquarium.hasTicket(), true)) return desk('aquarium', /^Tickets, passes & shows$/, 'Day ticket first: the ticket desk', sh.s.name);
  const a = AQ_AT[sh.s.id]; return Object.assign(desk(sh.s.room, a[0], a[1] + (h < sh.at ? ` (${clock(sh.at * 60)})` : ''), sh.s.name), { near: 1.9, name: sh.s.name });
});
chain('aqua_chain', ['aquarium'], 'aqua_turtle', 'aquarium:chain', (ctx, picked) => { const st = safe(() => G.aquarium.chain().st, 0);
  if (st === 1) return desk('aquarium:lab', /^The rehab pool$/, 'Look after the turtle: the rehab pool', 'Behind the Scenes');
  if (st === 2) return talk('aquarium', /^Dr\. Reyes, the head aquarist$/, 'Tell Dr. Reyes the turtle is ready', 'Dr. Reyes');
  if (st === 3 && picked) { const r = safe(() => G.aquarium.releaseSpot(), null); return r ? { room: 'city', find: { x: r.x, y: r.y, h: 2.4 }, label: 'The release: Gull Point Beach', near: 2.4, name: 'the release spot' } : null; }
  return null; });

/* -- Grand Maple Hotel: your table in the restaurant, ballroom events, your room, the suitcase chain */
define('hotel_dine', 'commit', 66, ctx => {
  if (ctx.root !== 'hotel' || !G.hotel || !ctx.attached) return null;
  const pick = ctx.pt.room === 'hotel_restaurant' || (ctx.sel && ctx.sel.need === 'hunger') || apptsAt('hotel').some(a => /dinner|tea|brunch|breakfast|gilded/i.test(a.title || '')); if (!pick) return null;
  if (safe(() => G.hotel.service(), null) || busyIs(/dinner|tea|eating|buffet|course|breakfast|brunch/i) || usedLately(/^(Your table|Table|Host stand)$/)) return { done: true, name: 'your table' };
  const R = 'hotel_restaurant'; if (!inRoom(R)) return { room: R, find: null, label: 'The Gilded Maple', short: 'your table' };
  const p = locate1(G.scene, [{ label: /^Your table$/ }, { label: /^Host stand$/ }]); if (!p) return { done: true, name: 'The Gilded Maple' };
  return { room: R, find: { x: p.x, y: p.y, h: p.h }, label: p.it.label === 'Your table' ? 'Your table: tap it to sit down' : 'Host stand: ask Laurent for a table', short: 'your table' };
}, (ctx, s) => s.need === 'hunger');
define('hotel_event', 'commit', 64, ctx => {
  if (ctx.root !== 'hotel' || !G.hotel || !want(ctx)) return null; const n = G.now(), e = safe(() => G.hotel.events(1), []).find(q => q.day === n.day && n.hf >= q.from - .75 && n.hf < q.to); if (!e) return null;
  return Object.assign(desk('hotel_ballroom', /^Ballroom steward$/, `${e.name}: see the ballroom steward`, e.name), { near: 2.2, name: e.name });
});
define('hotel_room', 'commit', 62, ctx => {
  if (ctx.root !== 'hotel' || !G.hotel || !ctx.attached || !(ctx.sel && ctx.sel.need === 'energy')) return null; if (!safe(() => G.hotel.stay(), null)) return null;
  return Object.assign(desk('hotel_room', /^The bed$/, 'Your room: the bed', 'your room'), { near: 1.8, name: 'your room' });
});
chain('hotel_chain', ['hotel'], 'hotel_cases', 'hotel:chain', (ctx, picked) => { const st = safe(() => G.hotel.chain().st, 0);
  return st === 1 ? (picked ? citySpots(safe(() => G.hotel.cases(), []), 'A burgundy suitcase: pick it up') : null) : st === 2 ? talk('hotel', /^Odile, the concierge$/, 'Tell Odile you found all three suitcases', 'the concierge') : null; });

/* -- Bay Fish Hall: the dawn auction.  Lighthouse: lighting the lamp + Silas's chain.  Natatorium: desk -> lockers -> rinse -> the pool / your lesson */
define('fish_auction', 'commit', 70, ctx => {
  if (ctx.root !== 'fishmarket' || !want(ctx)) return null; const h = hf(); if (h < 5 || h >= 7.5) return null;
  return Object.assign(desk('fishmarket', /^The auction rostrum$/, h < 5.5 ? 'Fish auction at 05:30: by the rostrum' : 'Fish auction: bid at the rostrum', 'the fish auction'), { near: 2.6, name: 'the fish auction' });
});
define('lh_lamp', 'commit', 70, ctx => {
  if (ctx.root !== 'lighthouse' || !G.lighthouse) return null; const L = G.lighthouse, d = hf() - L.lampTime(), st = safe(() => L.chain().st, 0);
  if (d < -1 || d > .5) return null; if (!want(ctx) && st !== 5) return null;
  if ((G.state.lighthouse || {}).litDay === G.now().day || since('lighthouse:lamp', 20)) return { done: true, name: 'the lantern room' };
  if (safe(() => L.lampOn(), false)) return inRoom('lighthouse_lantern') ? { done: true, name: 'the lantern room' } : { room: 'lighthouse_lantern', find: null, label: 'The lamp is lit: the lantern room', short: 'the lantern room' };   /* Silas has lit it already */
  return desk('lighthouse_lantern', /^The great lens$/, d < -.5 ? `Lamp-lighting at ${clock(L.lampTime() * 60 - 30)}: up to the lantern` : 'Light the lamp: the great lens', 'the lantern room');
});
chain('lh_chain', ['lighthouse', 'fishmarket'], 'lh_lamp', 'lighthouse:chain', ctx => { const L = G.lighthouse, st = safe(() => L.chain().st, 0);
  if (st === 1) return talk('fishmarket', /^Old Halvorsen/, 'Ask Old Halvorsen at the smokery', 'Halvorsen Smokery');
  if (st === 2) return desk('fishmarket', /^The auction rostrum$/, 'Win a lot at the dawn auction (05:30 to 07:30)', 'the auction');
  if (st === 3 || st === 4) { const at = safe(() => L.keeperAt(), 'cottage'), R = at === 'watch' ? 'lighthouse_watch' : at === 'lantern' ? 'lighthouse_lantern' : 'lighthouse'; return at === 'bed' ? null : talk(R, /^Silas Marrow/, 'Bring it to Silas, the keeper', 'Silas'); }
  return null; });
define('nat_swim', 'default', 4, ctx => {
  if (ctx.root !== 'natatorium' || !G.natatorium) return null; const N = G.natatorium, S = G.state.natatorium || {}, d = G.now().day;
  if (ctx.pt.room && ctx.pt.room !== 'natatorium:pool' && ctx.pt.room !== 'natatorium') return null;
  if (!safe(() => N.entryOk(), false)) return desk('natatorium', /^Front desk$/, 'Front desk: buy a swim', 'the pool');
  if (!S.swim) return desk('natatorium:change', /^Lockers$/, 'Lockers: change into your swimwear', 'the lockers');
  if (S.rinsed !== d) return desk('natatorium:change', /^Shower$/, 'Quick rinse first: the showers', 'the showers');
  const lesson = S.lessonDay !== d && (S.level || 1) < 5;
  return Object.assign(desk('natatorium:pool', lesson ? /^Coach Midge Okafor$/ : /^Lane 4/, lesson ? 'Swim lesson: talk to Coach Midge' : 'The lanes: pick one and swim', 'the pool'), { near: 2.4, name: lesson ? 'your swim lesson' : 'the pool' });
});
chain('nat_chain', ['natatorium'], 'nat_record', 'natatorium:chain', (ctx, picked) => { const st = safe(() => G.natatorium.chain().st, 0);
  return st === 1 ? (picked ? citySpots(safe(() => G.natatorium.clues(), []), 'A clue about the 1974 record') : null) : st === 4 ? talk('natatorium:pool', /^Walt Brennan, lifeguard$/, 'Tell Walt about the record', 'Walt') : null; });

/* -- people: story beats (the scene starts when you are there) and meetings with a friend -> that NPC, wherever they are in the building */
const npcShort = id => safe(() => G.social.npc(id).short, null) || safe(() => G.planner.npcShort(id), id);
const apptsFor = ctx => safe(() => G.planner.list(now() - 600, now() + 90, { events: false }), []).filter(a => !a.event && a.s !== 3 && a.s !== 4 && a.placeId && a.t - 90 <= now() && a.t + (a.dur || 60) > now()
  && (a.placeId === ctx.placeId || (ctx.root && rootOf(safe(() => place(a.placeId).roomId, a.placeId)) === ctx.root)));
function npcStep(npc, title, verb) {
  const c = safe(() => G.social.char(npc), null), who = npcShort(npc), rid = roomId() || 'city';
  if (c && !c.hidden) return { room: rid, find: { npc }, label: `${title}: ${verb} ${who}`, short: who, name: who };
  const w = safe(() => G.social.whereIs(npc), null);
  if (w && w.sceneId && w.sceneId !== G.scene.id) return { room: w.sceneId === 'city' ? 'city' : w.sceneId.slice(4), find: isFinite(w.x) ? { x: w.x, y: w.y, h: 2.3 } : null, label: `${title}: ${who} is at ${w.label || 'the place'}`, short: who, name: who };
  return { room: rid, find: null, label: `${title}: ${who} is on the way, wait here`, short: who };
}
define('story', 'commit', 69, ctx => {
  const a = apptsFor(ctx).find(q => q.data && q.data.beat); if (!a) return null; const b = safe(() => G.story.beat(a.data.beat), null); if (!b) return null;
  if (b.st === 'active' || b.st === 'done' || since('story:beat:' + a.data.beat, 5)) return { done: true, quiet: 1, name: a.title };
  const ap = safe(() => b.def.delivery.appointment, null) || {}, npc = (ap.with || [])[0]; if (b.t0 !== undefined && now() < b.t0) return { room: roomId() || 'city', find: npc ? { npc } : null, label: `${a.title}: from ${clock(b.t0)}`, short: a.title };
  return npc ? npcStep(npc, a.title, 'go up to') : null;
}, (ctx, s) => !!s.appt);
define('meet', 'commit', 68, ctx => {
  const a = apptsFor(ctx).find(q => q.withNpc && q.kind !== 'work' && !(q.data && q.data.beat)); if (!a) return null; const npc = a.withNpc;
  if (since('social:talk:' + npc, 4) || safe(() => G.state.social.hang[a.id].st, 0) === 1 || usedLately(new RegExp('\\b' + npcShort(npc) + '\\b'))) return { done: true, name: npcShort(npc) };
  /* QA round 5: inside the meeting place before the friend has arrived, the arrow used to send you out to wherever they were (Dot's Diner -> "Exit -> Dez" at his depot an hour before lunch). Wait here instead. */
  const c0 = safe(() => G.social.char(npc), null); if ((!c0 || c0.hidden) && ctx.root && ctx.here === ctx.root) return { room: roomId() || 'city', find: null, label: `${a.title}: ${npcShort(npc)} is on the way, wait here`, short: npcShort(npc) };
  return npcStep(npc, a.title, 'say hello to');
}, (ctx, s) => !!s.appt);

/* -- Wander "Take me there" on an entry that is INSIDE a building (a Galleria shop, a SkyDeck feature, the station piano...): the entry is read from the click */
const STOP = /^(the|and|with|from|maple|skydeck|galleria|station|central|your|spot)$/;
function byTitle(sc, title) {
  const ws = (String(title).toLowerCase().match(/[a-z]{4,}/g) || []).filter(w => !STOP.test(w)); if (!ws.length) return null; let best = null, bs = 0;
  for (const it of G.interactables()) { if (!isFinite(it.x) || it.exit) continue; const l = String(it.label || '').toLowerCase(), n = ws.filter(w => l.includes(w.replace(/s$/, ''))).length - (it.ent ? .5 : 0); if (n > bs) { bs = n; best = it; } }
  return best && bs >= 1 ? { x: best.x, y: best.y, h: Math.min(2.4, (best.h || 1) + 1.05), it: best } : null;
}
define('wander', 'default', 20, ctx => {
  const e = ctx.sel && ctx.sel.entry; if (!e || !ctx.root || rootOf(e.room || e.placeId) !== ctx.root) return null; const rid = e.room && ROOMS.has(e.room) ? e.room : ctx.root;
  if (rid === 'skydeck' && !safe(() => G.showpieces.skydeck.hasTicket(), true)) return desk('skydeck_lobby', /^SkyDeck tickets$/, 'SkyDeck ticket first: the desk', e.title);
  if (!inRoom(rid)) return { room: rid, find: null, label: e.title, short: e.title };
  const sh = e.venueId ? (G.scene.shops || []).find(q => q.venueId === e.venueId || q.id === e.venueId) : null, p = sh ? { x: sh.x, y: sh.y, h: 2 } : byTitle(G.scene, e.title) || locate1(G.scene, SERVE); if (!p) return { done: true, name: e.title };
  return { room: rid, find: { x: p.x, y: p.y, h: p.h }, label: e.title, near: NEAR_IN, name: e.title };
}, (ctx, s) => !!s.entry);

/* -- home (mailboxes, Direction update 23): a waypoint to YOUR apartment goes on through the lobby, up the stairs / lift, and ends inside the flat */
define('home_up', 'default', 1, ctx => { const h = safe(() => G.housing.current(), null); if (!h || ctx.root !== 'home:' + h.id || !safe(() => G.mailboxes.through(h.id), false)) return null;
  return safe(() => G.housing.isHome(), false) ? { done: true, name: h.home.name } : { room: 'home:' + h.id, find: null, label: 'Home', short: 'home', name: h.home.name }; });
/* -- needs: the need chooser picked a place -> the thing inside that fixes it (at home: the right room too) */
const NEED = { hunger: { home: ['', /^(Cook|Open fridge)$/, 'Cook something: the kitchen'], venue: [/^(Order|Order at .*|Shop|.*: order|.*Cafe.*|Comet Cocoa|Dockside Dogs|Noodle bar|Bay Brew coffee bar)$/, 'Eat here: order'] },
  energy: { home: ['', /^Bed$/, 'Your bed: sleep'], venue: [/^(Order|Order at .*|.*Cafe.*|Comet Cocoa|Bay Brew coffee bar|Meridian Espresso)$/, 'A coffee: order here'] },
  bladder: { home: [':bath', /^Toilet$/, 'The toilet'], venue: [/^(Restroom|Toilet)$/, 'The restroom'] },
  hygiene: { home: [':bath', /^Shower$/, 'The shower'], venue: [/^(Use the Locker-Room Shower|Shower|Rain shower|Wash hands)$/, 'Freshen up here'] } };
/* QA9: in a building of several rooms, the room that has it (University: the restrooms and the Quill & Kettle are in the Commons, not the Great Hall) */
const menuOf = r => { const v = VENUE_BY_ID[safe(() => ROOMS.get(r).venue, null)]; return !!(v && v.offers && v.offers.menu); };
function needRoom(root, need) {
  const subs = subRooms(root); if (!subs.length) return root;
  if (need === 'bladder') { if (safe(() => G.bladder.hasRestroom(root), null) === true) return root; return subs.find(r => safe(() => G.bladder.hasRestroom(r), null) === true) || root; }
  if (need === 'hunger' || need === 'energy') { if (menuOf(root)) return root; return subs.find(menuOf) || root; }
  return root;
}
define('need', 'default', 30, ctx => {
  const s = ctx.sel, N = s && s.need && NEED[s.need]; if (!N || !ctx.root || (ctx.pt.id && /^mall:/.test(ctx.pt.id))) return null; if (s.place && s.place !== 'pos' && ctx.pt.id && s.place !== ctx.pt.id) return null;
  const home = /^home/.test(ctx.root), d = home ? N.home : N.venue, ht = { energy: 'bed', hunger: 'fridge', hygiene: 'shower', bladder: 'toilet' }[s.need], hr = home && ht ? safe(() => G.housing.roomWith(ht), null) : null, rid = hr && ROOMS.has(hr) && rootOf(hr) === ctx.root ? hr : home && ROOMS.has(ctx.root + d[0]) ? ctx.root + d[0] : home ? ctx.root : needRoom(ctx.root, s.need), re = home ? d[1] : d[0], label = home ? d[2] : d[1];
  if ((usedLately(re) && lastUse.scene !== 'city') || busyIs(/toilet|restroom|shower|sleep|eat|cook|nap/i)) return { done: true, quiet: 1 };   /* QA9: not the street door ('Sunnyside Cafe' matched the '.*Cafe.*' of the counter and ended the goal at the door) */
  if (inRoom(rid) && !locate1(G.scene, { label: re })) return home ? { done: true } : null;   /* nothing of that kind here: fall back to the counter */
  return { room: rid, find: { label: re }, label, short: label.toLowerCase(), near: 1.3, name: ctx.pt.name || placeName(ctx.root) };
}, (ctx, s) => !!s.need);

/* ---------- picking + following ---------- */
let OFF = false;   /* debug: `?ngoff` or G.navGoals.off = true switches the whole module off (the arrow behaves as before; used for before/after tests) */
let cur = null, lastEval = 0, lastKey = '', muted = {}, locC = null;
const trip = () => safe(() => G.nav.trip(), null), waypoint = () => safe(() => G.state.phone.waypoint, null);
function mkCtx(pt) {
  const here = rootOf(roomId()), ctx = { here, attached: !!pt, pt: pt || null, root: here, placeId: null, sel: SS().sel, t: now() };
  if (pt) {
    let rid = pt.room || null; const pl = !rid && pt.id ? place(pt.id) : null; ctx.placeId = pt.id || null;
    if (!rid && pt.id && /^mall:/.test(pt.id)) rid = 'deptstore';
    if (!rid && pl && pl.roomId) rid = pl.roomId;
    if (!rid && pt.id && ROOMS.has(pt.id)) rid = pt.id;
    if (!rid) { const cs = cityScene(), d = cs && cs.world.pois.find(p => p.type === 'door' && p.room && Math.abs(p.x - pt.x) < 1.3 && Math.abs(p.y - pt.y) < 1.3); if (d && ROOMS.has(d.room)) rid = d.room; }
    ctx.root = rid ? rootOf(rid) : null;
  }
  return ctx;
}
function evaluate(o) {
  const pt = o && o.pt ? o.pt : null, ctx = mkCtx(pt), pin = SS().pin; let best = null;
  safe(syncHandover);
  if (pin && pinFn) { const st = safe(() => pinFn(ctx), null); if (st) best = { r: PIN, st, pr: 1e6 }; }
  if (!best) for (const r of RES) {
    if (r.kind === 'default' && !ctx.attached) continue;
    if (r.kind === 'commit' && !ctx.attached && (!ctx.here || muted[r.id])) continue;
    const st = safe(() => r.fn(ctx), null); if (!st) continue;
    if (st.done && muted[r.id] && !ctx.attached) continue;
    const pr = (st.prio !== undefined ? st.prio : r.prio) + (ctx.sel && r.sel && safe(() => r.sel(ctx, ctx.sel), false) ? 1000 : 0);
    if (!best || pr > best.pr) best = { r, st, pr };
  }
  const prevId = cur && cur.id;
  cur = best ? { id: best.r.id, r: best.r, step: best.st, attached: ctx.attached, root: ctx.root, ctx } : null;
  if (cur && cur.step.done) { finish(cur); cur = null; }
  if ((cur && cur.id) !== prevId) G.emit('navgoal', cur ? cur.id : null);
}
/** the objective is complete: clear the waypoint / trip that led here, with the same feedback as a normal arrival */
function finish(A) {
  const wp = waypoint(), t = trip(), dest = (t && t.dest) || wp, st = A.step; muted[A.id] = 1;
  /* QA12: an explicit pin to somewhere else (your mailbox, while the Chapter's waypoint led to Nana's) must not wipe the waypoint you were following */
  const pinRoom = A.r === PIN && SS().pin && SS().pin.room, other = !!pinRoom && !!A.attached && safe(() => rootOf(pinRoom) !== A.root, false);
  if (A.r === PIN) { SS().pin = null; pinFn = null; }
  if (A.attached && !other) { if (wp) { G.state.phone.waypoint = null; G.emit('waypoint', null); } if (dest) G.emit('waypoint:arrived', dest); }
  SS().sel = null;
  if (!st.quiet) { toast(`You have arrived: ${st.name || (dest && dest.name) || st.label}`, 'good'); safe(() => G.audio.sfx('success')); }
  G.emit('navgoal:done', A.id, st);
}
const point = (x, y, label, o) => Object.assign({ mode: 'point', x, y, label, goal: true }, o), chip = label => ({ mode: 'chip', label, goal: true });
const shortHop = l => { l = String(l || 'Exit').split(/[:(]/)[0].trim(); return l.length > 36 ? l.slice(0, 34) + '…' : l; };
function target(A) {
  const st = A.step, sc = G.scene, id = sc.id, want = st.room === 'city' ? 'city' : 'int:' + st.room, pl = G.player;
  if (id === want) {
    const t = performance.now(); if (!locC || locC.sc !== sc || locC.f !== st.find || t - locC.t > 240) locC = { sc, f: st.find, t, p: typeof (st.find && st.find.x) === 'number' ? st.find : locate1(sc, st.find) };
    const p = locC.p && locC.p.ent ? { x: locC.p.ent.x, y: locC.p.ent.y, z: locC.p.z, h: locC.p.h } : locC.p; if (!p) return chip(st.wait || st.label);
    const d = Math.hypot(p.x - pl.x, p.y - pl.y);
    if (st.near && d < st.near && !G.busy && !G.cutscene) { finish(A); cur = null; return null; }
    const z = id === 'city' ? safe(() => G.world.heightAt(p.x, p.y), 0) : p.z || 0;
    return point(p.x, p.y, id === 'city' && d < 7 && st.close ? st.close : st.label, { h: p.h || 2, z, dist: id === 'city' && d >= 7 ? d : null });
  }
  if (id === 'city') {
    const door = doorOf(st.room) || (A.ctx.pt && A.ctx.root === rootOf(st.room) ? A.ctx.pt : null); if (!door) return chip(st.far || st.label);
    const d = Math.hypot(door.x - pl.x, door.y - pl.y), name = placeName(st.room);
    const sh = st.short || st.label;
    return point(door.x, door.y, d < 14 ? (norm(sh) === norm(name) ? `Go in: ${name}` : `Go in: ${name} → ${sh}`) : st.far || (st.title ? `${st.title} (${name})` : name), { dist: d < 14 ? null : d, z: safe(() => G.world.heightAt(door.x, door.y), 0), h: 2.6 });
  }
  const hop = safe(() => G.navArrow.route(want), null);
  if (!hop) return chip(`Leave the building → ${st.short || st.label}`);
  const hl = shortHop(hop.label), sh = st.short || st.label, same = norm(hl) === norm(sh) || norm(sh).includes(norm(hl));
  return point(hop.x, hop.y, same ? `${hl}: this way` : `${hl} → ${sh}`, { h: 1.6 });
}
const norm = t => String(t).toLowerCase().replace(/^(the|to the|back to the) /, '').trim();
/** called by ui/navarrow.js every frame. o = navarrow's objective() ({ kind: 'dest', pt } for a waypoint / arrived trip) or null */
export function guide(o) {
  if (!G.scene || !G.player || OFF) return null;
  const t = performance.now(), key = G.scene.id + '|' + (o && o.pt ? (o.pt.id || '') + ',' + o.pt.x + ',' + o.pt.y : '') + '|' + (G.busy ? 1 : 0);
  if (t - lastEval > 200 || key !== lastKey) { lastEval = t; lastKey = key; evaluate(o); }
  return cur ? target(cur) : null;
}

/* ---------- explicit objectives (G.navGoals.set) ---------- */
const PIN = { id: 'pin', kind: 'strong', prio: 1e6 }; let pinFn = null, pinOff = null;
export function set(o) {
  clear(); if (!o || !o.room) return null; const s = SS(); s.pin = { room: o.room, label: o.label || 'Here', near: o.near, name: o.name }; let done = false;
  if (typeof o.done === 'string') pinOff = G.on(o.done, () => { done = true; });
  pinFn = () => (done || (typeof o.done === 'function' && safe(() => o.done(), false)) ? { done: true, name: o.name || o.label } : { room: o.room, find: o.find || null, label: o.label || 'Here', short: o.short, near: o.near, name: o.name });
  lastEval = 0; return 'pin';
}
export function clear() { if (pinOff) { pinOff(); pinOff = null; } pinFn = null; SS().pin = null; lastEval = 0; }
export function select(s) { SS().sel = s ? Object.assign({ t: now() }, s) : null; lastEval = 0; }

const CSS = `#nav-arrow .l{white-space:normal;max-width:min(250px,66vw);text-align:center;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden}
#nav-arrow.chip .l{max-width:min(330px,84vw)}`;
export function init() {
  G.defineState('navgoals', () => ({ sel: null, pin: null }));
  G.navGoals = { guide, current: () => (cur ? { id: cur.id, step: cur.step, attached: cur.attached, root: cur.root } : null), set, clear, define, select, locate, rootOf, doorOf, fixEdges, path, get list() { return RES.map(r => r.id); }, get off() { return OFF; }, set off(v) { OFF = !!v; cur = null; lastEval = 0; }, get graph() { return GRAPH; }, RECIPIENT, SERVE };
  if (typeof document === 'undefined') return;
  if (typeof location !== 'undefined' && /[?&]ngoff\b/.test(location.search)) OFF = true;
  document.head.append(el('style', { text: CSS }));
  G.on('scene', (s, prev) => { lastEval = 0; locC = null; if (!s || !prev || rootOf(roomOfScene(s)) !== rootOf(roomOfScene(prev))) muted = {}; });
  G.on('waypoint', p => { lastEval = 0; if (p) muted = {}; else if (!trip()) SS().sel = null; });
  G.on('load', () => { cur = null; hand = null; muted = {}; pinFn = null; SS().pin = null; lastEval = 0; lastUse = null; for (const k in EV) delete EV[k]; });
  for (const name of EVENTS) G.on(name, a => { EV[name] = now(); if (typeof a === 'string' || typeof a === 'number') EV[name + ':' + a] = now(); lastEval = 0; });
  G.on('use', it => { if (it && it.label) lastUse = { label: it.label, t: now(), scene: G.scene && G.scene.id }; lastEval = 0;
    /* a door that does not let you in (closed, members only): give the old arrival at the door instead of an arrow that asks for the impossible */
    const A = cur; if (A && it && G.scene && G.scene.id === 'city' && A.attached && A.step.room !== 'city' && !A.step.quiet) { const d = doorOf(A.step.room); if (d && isFinite(it.x) && Math.hypot(it.x - d.x, it.y - d.y) < 2.5) setTimeout(() => { if (cur && cur.id === A.id && cur.attached && G.scene.id === 'city' && !G.modal && !G.busy && !G.cutscene) { A.step = Object.assign({}, A.step, { quiet: 1 }); finish(A); cur = null; lastEval = 0; } }, 2600); } });
  G.on('jobs:hud', () => { lastEval = 0; }); G.on('activityEnd', () => { lastEval = 0; });
  /* what the player picked: goal / appointment rows of the goals widget, need-chooser rows (read from the click; no hook in those files) */
  document.addEventListener('click', e => {
    const tm = e.target && e.target.closest ? e.target.closest('.wg button') : null;
    if (tm && /Take me there/.test(tm.textContent || '')) { const h = tm.closest('.wg').querySelector('.wg-title h2'), en = h && safe(() => G.guide.all().find(q => q.title === h.textContent), null); select(en && (en.room || en.venueId) ? { entry: { id: en.id, title: en.title, room: en.room || null, venueId: en.venueId || null, placeId: en.placeId || null } } : null); return; }
    const b = e.target && e.target.closest ? e.target.closest('[data-g],[data-a],[data-fix],[data-navrow]') : null; if (!b) return;
    if (b.dataset.navrow) { const c = document.querySelector('.ph-chip.on[data-navchip]'), k = c && { food: 'hunger', coffee: 'energy' }[c.dataset.navchip]; select(k ? { need: k, place: b.dataset.navrow } : null); return; }   /* the Map's "Where to?" rows */
    if (b.dataset.g) select({ goal: b.dataset.g }); else if (b.dataset.a) select({ appt: b.dataset.a });
    else { const w = b.closest('.win'), tt = w && w.querySelector('.win-title'), m = tt && /^([A-Za-z ]+):/.exec(tt.textContent || ''); if (m) select({ need: m[1].trim().toLowerCase(), place: b.dataset.fix }); }
  }, true);
}
const roomOfScene = s => (s && /^int:/.test(s.id) ? s.id.slice(4) : null);
