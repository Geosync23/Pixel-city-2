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
//   select({ goal?, appt?, need?, npc? } | null)                                       what the player picked (set automatically from the goals widget / need chooser)
//   locate(find) -> { x, y, h } | null                                                 resolve a `find` in the current scene
//   rootOf(roomId) -> the building's entrance room ('cityhall_council' -> 'cityhall')   doorOf(roomId) -> city door poi
//   fixEdges(sceneId, edges, liveScene) -> edges    GRAPH (below) adds the room links navarrow cannot see: bathrooms, lifts, curtains, turnstiles, tunnels
//   path(fromSceneId, toSceneId) -> [scene ids] | null      breadth-first over the same graph (tools/navcheck.mjs)
//   audit() -> rows for the regression table,  list -> resolver ids }
// Events: 'navgoal'(id | null) when the followed objective changes, 'navgoal:done'(id, step).   State: G.state.navgoals = { sel, pin }.
// Hooks into other systems: none are required — every resolver reads public state (see docs/reports/navgoals.md for the two tiny optional ones).
import { G } from '../core/game.js';
import { toast, el } from '../ui/kit.js';
import { ROOMS } from '../scenes/interior.js';
import { cur as workCur, city as workCity } from './_jobs_work.js';

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
  const p = rid.split(':'); return /^(home|pub|lobby)$/.test(p[0]) ? p.slice(0, 2).join(':') : p[0];
}
export const doorOf = rid => { const r = rootOf(rid); return cityPoi('door:' + r) || place(r) || null; };
const placeName = rid => { const r = rootOf(rid), p = place(r) || cityPoi('door:' + r); return (p && p.name) || safe(() => ROOMS.get(r).name, null) || 'the building'; };

/* ---------- GRAPH: room links the arrow's scene graph cannot read from the room definitions ----------
   [scene id | RegExp, label RegExp, to: scene id | [scene ids] | fn(sceneId) -> scene id]. Found with tools/navcheck.mjs (it uses every door-like interactable for real). */
const LIFT = ['int:hotel', 'int:hotel_floor', 'int:hotel_spa', 'int:hotel_bar'];
const GRAPH = [
  [/^int:home:[^:]+$/, /^Bathroom$/, s => s + ':bath'], [/^int:home:[^:]+$/, /^Leave$/, 'city'],
  [/^int:(concerthall|playhouse)$/, /^Auditorium$/, s => s + ':hall'], ['int:cinema', /^Screen 1$/, 'int:cinema:screen1'],
  ['int:arena', /^Into the bowl/, 'int:arena:bowl'], ['int:arena', /^TEAM ONLY$/, 'int:arena:backstage'], ['int:arena:backstage', /^Tunnel to the court$/, 'int:arena:bowl'], ['int:arena:bowl', /^Team tunnel$/, 'int:arena:backstage'],
  [/^int:hotel(_floor|_spa|_bar)?$/, /^Lift$/, s => LIFT.filter(x => x !== s)], ['int:hotel_floor', /^Room \d+$/, 'int:hotel_room'], ['int:hotel', /^Stairs up to The Tidewater Spa$/, 'int:hotel_spa'],
  ['int:natatorium', /^Exit to/, 'city'],
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
  if (f.label) { const it = nearest(G.interactables().filter(i => isFinite(i.x) && f.label.test(i.label || '') && (!f.ok || f.ok(i)))); return it ? { x: it.x, y: it.y, z: it.z && !it.ent ? Math.max(0, it.z - .3) : 0, h: it.ent ? 2.3 : Math.min(2.4, (it.h || 1) + 1.05), it } : null; }
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
  const it = { x: p.x, y: p.y, h: 1.4, hit: 14, range: 2.4, spot: p.it && p.it.spot ? p.it.spot : p.fx && p.fx.use ? p.fx.use : undefined, label: 'Hand over the parcel', navgoal: true, use: () => { const c = workCity.get('shift'); if (c && c.use) c.use(); } };
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
const SERVE = { label: /^(Order|Shop|Front desk|Reception|Box office|Tickets[ ,&]|Ticket desk|SkyDeck tickets|Information desk|Front office|Host stand|The Weathervane bar|Splash & Dash: the till)/ };
define('default', 'default', 0, ctx => {
  const root = ctx.root; if (!root || /^home/.test(root) || (ctx.pt.id && /^mall:/.test(ctx.pt.id))) return null;
  if (ctx.pt.room && ctx.pt.room !== root && ROOMS.has(ctx.pt.room)) return inRoom(ctx.pt.room) ? { done: true } : { room: ctx.pt.room, find: null, label: ctx.pt.name, short: ctx.pt.name };
  const pl = place(root); if (pl && pl.open && !safe(() => pl.open(), true) && !ctx.here) return null;   /* closed: the old arrival at the door */
  if (!inRoom(root)) return ctx.here === root ? { done: true, quiet: 1 } : { room: root, find: SERVE, label: ctx.pt.name || placeName(root), short: ctx.pt.name || placeName(root) };
  const p = locate1(G.scene, SERVE); if (!p) return { done: true };
  return { room: root, find: { x: p.x, y: p.y, h: p.h }, label: `${p.it.label}${/^(Order|Shop)$/.test(p.it.label) ? ' at the counter' : ''}`, near: NEAR_IN, name: ctx.pt.name || placeName(root) };
});

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
  if (A.r === PIN) { SS().pin = null; pinFn = null; }
  if (A.attached) { if (wp) { G.state.phone.waypoint = null; G.emit('waypoint', null); } if (dest) G.emit('waypoint:arrived', dest); }
  SS().sel = null;
  if (!st.quiet) { toast(`You have arrived: ${st.name || (dest && dest.name) || st.label}`, 'good'); safe(() => G.audio.sfx('success')); }
  G.emit('navgoal:done', A.id, st);
}
const point = (x, y, label, o) => Object.assign({ mode: 'point', x, y, label, goal: true }, o), chip = label => ({ mode: 'chip', label, goal: true });
const shortHop = l => { l = String(l || 'Exit').split(/[:(]/)[0].trim(); return l.length > 26 ? l.slice(0, 24) + '…' : l; };
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
    return point(door.x, door.y, d < 14 ? `Go in: ${name} → ${st.short || st.label}` : st.far || (st.title ? `${st.title} (${name})` : name), { dist: d < 14 ? null : d, z: safe(() => G.world.heightAt(door.x, door.y), 0), h: 2.6 });
  }
  const hop = safe(() => G.navArrow.route(want), null);
  return hop ? point(hop.x, hop.y, `${shortHop(hop.label)} → ${st.short || st.label}`, { h: 1.6 }) : chip(`Leave the building → ${st.short || st.label}`);
}
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
  G.on('load', () => { cur = null; hand = null; muted = {}; pinFn = null; SS().pin = null; lastEval = 0; });
  /* what the player picked: goal / appointment rows of the goals widget, need-chooser rows (read from the click; no hook in those files) */
  document.addEventListener('click', e => {
    const b = e.target && e.target.closest ? e.target.closest('[data-g],[data-a],[data-fix]') : null; if (!b) return;
    if (b.dataset.g) select({ goal: b.dataset.g }); else if (b.dataset.a) select({ appt: b.dataset.a });
    else { const w = b.closest('.win'), tt = w && w.querySelector('.win-title'), m = tt && /^([A-Za-z ]+):/.exec(tt.textContent || ''); if (m) select({ need: m[1].trim().toLowerCase(), place: b.dataset.fix }); }
  }, true);
}
const roomOfScene = s => (s && /^int:/.test(s.id) ? s.id.slice(4) : null);
