// Guide arrow: the one on-screen arrow that leads the player to the active waypoint / trip objective in EVERY scene (owner msg 72, BIBLE direction update 15).
//
// What it shows (one DOM element #nav-arrow, never hidden while a waypoint, trip or ride is active):
//   - target on screen  -> a bobbing marker above it with its name;
//   - target off screen -> the arrow is clamped to the edge of the HUD safe area, rotated toward the target, with "name · distance";
//   - nothing to point at (waiting on the platform, riding between stops, tram) -> a "chip" under the top HUD with the instruction.
// Where it points (computed from G.state.phone.waypoint + G.nav.trip() + G.transit.ride / pending, see compute()):
//   city      the waypoint / boarding stop / station entrance / the door of the building the objective is in / the called cab / (riding a cab or bus) the destination or your stop
//   interior  objective in this room (Central Station gates for a train trip, a mall shop counter) -> that spot; otherwise the exit that leads toward it:
//             a small scene graph (exit doormats + where they lead: def.exits `to`, the literal in `use: G => G.go('..')`, label rules, and edges LEARNED
//             whenever the player uses something that changes the scene, kept in G.state.nav.edges) is searched breadth-first; fallback = the room's main exit.
//   train     riding: chip "Stay on: X in N min"; your stop is next / you are at it: RED arrow on the nearest door + the "This is your stop" banner + sound.
//   bus       (city cutscene) the arrow marks your stop the whole ride, RED when it is next / you are at it, + the banner. You still get off yourself.
// Arrival: within ARRIVE units of a destination in the city (or ARRIVE_IN inside a room) the waypoint is cleared -> 'waypoint'(null), 'waypoint:arrived'(wp), toast.
//          A boarding stop is not "arrived": the trip gets `at = true` and the arrow stays on the stop / station until you board.
// G.navArrow = { target() -> {mode:'point'|'chip', x, y, label, red, scene} | null, banner(title, sub, {red, ms, sfx}), hideBanner(), edges(sceneId?) , route(goalSceneId) , innerPlace(id) }
// Events: 'nav:stop'(phase 'next'|'at'|'missed', kind 'train'|'bus', stopId).
// Tuning: ARRIVE, ARRIVE_IN, SAFE (margins), HEAD (marker height above the target, world units).
import { G } from '../core/game.js';
import { el, root, toast } from './kit.js';
import { ROOMS } from '../scenes/interior.js';
import { VENUE_BY_ID } from '../data/venues.js';

export const order = 135;
export const ARRIVE = 4, ARRIVE_IN = 2.2, HEAD = 2.3, SAFE = { l: 10, r: 10, t: 108, b: 22 };
const RO = 1;   // room floor origin offset (interior.js O)
const CSS = `#nav-arrow{position:absolute;left:0;top:0;z-index:20;pointer-events:none;display:none;align-items:center;gap:4px;font-weight:700;font-size:13px;line-height:1.25;font-family:inherit}
#nav-arrow.on{display:flex}#nav-arrow.e-r{flex-direction:row-reverse}#nav-arrow.e-t{flex-direction:column}#nav-arrow.e-b,#nav-arrow.near{flex-direction:column-reverse}
#nav-arrow .w{flex:none;display:flex;filter:drop-shadow(0 2px 0 #fff4dc) drop-shadow(0 -2px 0 #fff4dc) drop-shadow(2px 0 0 #fff4dc) drop-shadow(-2px 0 0 #fff4dc)}
#nav-arrow .a{flex:none;position:relative;width:32px;height:32px;background:var(--edge,#2a2733);clip-path:polygon(50% 0,100% 100%,50% 76%,0 100%)}
#nav-arrow .a:after{content:'';position:absolute;inset:0;background:var(--accent,#e2553b);clip-path:polygon(50% 17%,84% 88%,50% 66%,16% 88%)}
#nav-arrow .l{background:var(--panel,#fff4dc);color:var(--ink,#2a2733);border:2px solid var(--edge,#2a2733);box-shadow:0 2px 0 var(--edge,#2a2733);padding:1px 6px;white-space:nowrap;max-width:min(300px,74vw);overflow:hidden;text-overflow:ellipsis}
#nav-arrow.near .a{clip-path:polygon(50% 100%,6% 38%,6% 0,94% 0,94% 38%);animation:navbob .5s infinite alternate}
#nav-arrow.near .a:after{clip-path:polygon(50% 86%,17% 35%,17% 10%,83% 10%,83% 35%)}
#nav-arrow.red .a{width:42px;height:42px;animation:navpulse .45s infinite alternate}#nav-arrow.red .a:after{background:#e2241b}
#nav-arrow.red.near .a{animation:navbob .32s infinite alternate}
#nav-arrow.red .l{background:#e2241b;color:#fff;font-size:14px;padding:2px 8px}
#nav-arrow.chip .a{width:20px;height:20px;transform:rotate(90deg)!important;animation:none}
#nav-arrow.chip{flex-direction:row}
@keyframes navbob{from{transform:translateY(-5px)}to{transform:translateY(2px)}}
@keyframes navpulse{from{filter:brightness(1)}to{filter:brightness(1.35)}}
#nav-stop{position:absolute;left:50%;top:116px;transform:translate(-50%,0);z-index:45;pointer-events:none;display:none;flex-direction:column;align-items:center;gap:2px;text-align:center;width:max-content;max-width:min(92vw,460px);
 background:var(--panel,#fff4dc);color:var(--ink,#2a2733);border:3px solid var(--edge,#2a2733);box-shadow:0 5px 0 var(--edge,#2a2733);padding:8px 16px}
#nav-stop.on{display:flex;animation:navpop .22s steps(4)}#nav-stop b{font-size:22px;line-height:1.15;letter-spacing:.5px}#nav-stop span{font-size:14px;font-weight:700}
#nav-stop.red{background:#e2241b;color:#fff;border-color:#fff4dc;outline:3px solid #2a2733}#nav-stop.red b{font-size:26px}
@keyframes navpop{from{transform:translate(-50%,0) scale(.6)}to{transform:translate(-50%,0) scale(1)}}
#wrap.on-title #nav-arrow,#wrap.on-title #nav-stop{display:none}
@media (max-width:480px){#nav-stop b{font-size:19px}#nav-stop.red b{font-size:22px}}
@media (prefers-reduced-motion:reduce){#nav-arrow .a,#nav-stop.on{animation:none!important}}`;

const safe = (f, d) => { try { const v = f(); return v === undefined ? d : v; } catch (e) { return d; } };
const sfx = n => { try { G.audio && G.audio.sfx && G.audio.sfx(n); } catch (e) { } };
const norm = id => String(id && id.id ? id.id : id || '').replace(/^station:|^st_/, '');
const trip = () => safe(() => G.nav.trip(), null);
const waypoint = () => safe(() => G.state.phone.waypoint, null);
const place = id => safe(() => G.places.get(id), null);
const cityScene = () => (G.sceneCache && G.sceneCache.get('city')) || null;
const cityPoi = id => safe(() => cityScene().world.pois.find(p => p.id === id), null);
const short = n => String(n || '').replace(/ Station$/, '');

/* ---------- places that live inside a building (mall shops): a waypoint with `room` leads to the building door, then to the spot inside ---------- */
const INNER = [[/^mall:/, 'deptstore']];
export function innerPlace(id) {
  if (typeof id !== 'string') return null; const m = INNER.find(q => q[0].test(id)), v = VENUE_BY_ID[id]; if (!m || !v) return null;
  const door = place(m[1]) || cityPoi('door:' + m[1]); return door ? { id, name: v.name, x: door.x, y: door.y, room: m[1] } : null;
}

/* ---------- scene graph: exits -> where they lead ---------- */
let lastUse = null;
const learned = () => { const s = G.state.nav; if (!s) return {}; if (!s.edges || typeof s.edges !== 'object') s.edges = {}; return s.edges; };
function learn(from, it, to) {
  if (!from || !to || from === to || !it || !isFinite(it.x)) return; const L = learned(), a = L[from] || (L[from] = []), x = Math.round(it.x * 2) / 2, y = Math.round(it.y * 2) / 2;
  const e = a.find(q => q.x === x && q.y === y); if (e) e.to = to; else { a.push({ x, y, to }); if (a.length > 8) a.shift(); }
  const ks = Object.keys(L); if (ks.length > 48) delete L[ks[0]];
}
const parentOf = id => { const p = String(id).split(':'); if (p.length < 3) return null; p.pop(); const q = p.join(':'); return ROOMS.has(q.slice(4)) ? q : null; };
/** where an exit of scene `sid` leads: scene id, or null when unknown. ex = the room def's exit entry (may be undefined) */
function guessTo(sid, ex, label) {
  if (ex) { if (ex.to) return ex.to; if (typeof ex.use === 'function') { const m = /\.go\(\s*(['"`])([^'"`]+)\1\s*[,)]/.exec(String(ex.use)); if (m) return m[2]; } else return 'city'; }
  const l = String(label || '');
  if (/lobby|^back|living room/i.test(l)) return parentOf(sid) || null;
  if (/auditorium|screen \d|bathroom|gates? [a-z]\d/i.test(l)) return null;
  return ex ? null : 'city';
}
const OUTWARD = /exit|leave|street|outside|curb|kerb|lobby|^back|way out|living room/i, DOORISH = /elevator|lift|stairs|door|tram/i;
/** edges of a scene: [{ x, y, label, to (scene id | null), exit: bool, out: bool }]; live interactables for the current scene, room defs + learned edges otherwise */
function edges(sid = G.scene && G.scene.id) {
  const out = [], L = learned()[sid] || [], rid = String(sid).slice(4), def = ROOMS.get(rid), live = G.scene && G.scene.id === sid ? G.scene : null;
  const lk = (x, y) => { const e = L.find(q => Math.abs(q.x - x) < .8 && Math.abs(q.y - y) < .8); return e ? e.to : undefined; };
  if (live) {
    const exs = (live.def && live.def.exits) || [];
    for (const it of live.interactables || []) {
      if (!isFinite(it.x) || (it.visible && !safe(() => it.visible(), true))) continue; const known = lk(it.x, it.y);
      if (!it.exit && !it.navTo && known === undefined) continue;   // it.navTo: a non-door that leads to another scene (SkyDeck lifts, set by sim/showpieces.js)
      const ex = it.exit ? exs.find(e => Math.abs(e.x + RO - it.x) < .3 && Math.abs(e.y + RO - it.y) < .3) : null, to = known !== undefined ? known : it.navTo || guessTo(sid, ex, it.label);
      out.push({ x: it.x, y: it.y, spot: it.spot, label: it.label || 'Exit', to, exit: !!it.exit, out: OUTWARD.test(it.label || '') || to === 'city' });
    }
  } else {
    if (def && !def.build) for (const ex of def.exits || [{ x: def.w / 2, y: def.d - .5 }]) { const x = ex.x + RO, y = ex.y + RO, k = lk(x, y); out.push({ x, y, label: ex.label || 'Exit', to: k !== undefined ? k : guessTo(sid, ex, ex.label), exit: true }); }
    else if (/^int:/.test(sid)) out.push({ x: 0, y: 0, label: 'Exit', to: 'city', exit: true });
    for (const e of L) if (!out.some(o => Math.abs(o.x - e.x) < .8 && Math.abs(o.y - e.y) < .8)) out.push({ x: e.x, y: e.y, label: 'Exit', to: e.to, exit: false });
  }
  return safe(() => G.navGoals.fixEdges(sid, out, live), out);   /* sim/navgoals.js GRAPH: links the room defs do not show (bathrooms, lifts, curtains, turnstiles) */
}
/** first hop (an edge of the current scene) on the shortest known way to `goal`; falls back to the way out, then to any exit */
function route(goal) {
  const sc = G.scene; if (!sc) return null; const first = edges(sc.id); if (!first.length) return fallbackDoor(sc);
  const seen = new Set([sc.id]); let q = first.filter(e => e.to).map(e => ({ e, at: e.to }));
  for (let depth = 0; depth < 5 && q.length; depth++) {
    const hit = q.find(n => n.at === goal); if (hit) return hit.e; const nx = [];
    for (const n of q) { if (seen.has(n.at) || n.at === 'city') continue; seen.add(n.at); for (const e of edges(n.at)) if (e.to && !seen.has(e.to)) nx.push({ e: n.e, at: e.to }); }
    q = nx;
  }
  if (goal !== 'city') { const h = first.find(e => e.to === 'city'); if (h) return h; }
  return first.find(e => e.exit && e.out && e.to !== null) || first.find(e => e.exit && e.out) || first.find(e => e.exit) || first[0] || fallbackDoor(sc);
}
function fallbackDoor(sc) { const it = (sc.interactables || []).find(i => isFinite(i.x) && OUTWARD.test(i.label || '')) || (sc.interactables || []).find(i => isFinite(i.x) && DOORISH.test(i.label || '')); return it ? { x: it.x, y: it.y, label: it.label, to: null } : null; }

/* ---------- the "This is your stop" banner ---------- */
let banEl = null, banT = 0, banKey = '';
export function banner(title, sub, o = {}) {
  if (!banEl) return; banEl.replaceChildren(el('b', { text: title }), sub ? el('span', { text: sub }) : null); banEl.classList.toggle('red', !!o.red); banEl.classList.remove('on'); void banEl.offsetWidth; banEl.classList.add('on');
  banEl.style.top = Math.round((marginT || SAFE.t) + 4) + 'px'; banT = (o.ms || 4200) / 1000; mT = 0; if (o.sfx !== false) sfx(o.sfx || (o.red ? 'alert' : 'notify'));
}
export function hideBanner() { if (banEl) banEl.classList.remove('on'); banT = 0; banKey = ''; }
function stopNotice(phase, kind, stopId, name) {
  const key = kind + '|' + phase + '|' + stopId; if (key === banKey) return; banKey = key; G.emit('nav:stop', phase, kind, stopId);
  if (phase === 'at') banner('THIS IS YOUR STOP', name + ' - ' + (kind === 'bus' ? 'tap "Get off here"' : 'get off through the doors'), { red: true, ms: 9000 });
  else if (phase === 'next') banner('Your stop is next', name + ' - get ready to get off', { ms: 4500 });
  else if (phase === 'missed') banner('You missed your stop', 'Get off at the next one: new directions will follow', { ms: 5000, sfx: 'error' });
}

/* ---------- targets ---------- */
const pointT = (x, y, label, o) => Object.assign({ mode: 'point', x, y, label }, o);
const chipT = label => ({ mode: 'chip', label });
function arrive(wp, quiet) {
  const cur = waypoint(); if (cur) { G.state.phone.waypoint = null; G.emit('waypoint', null); }
  G.emit('waypoint:arrived', wp); if (!quiet) toast(`You have arrived: ${wp.name}`, 'good');
}
function objective() {
  const t = trip(), w = waypoint();
  if (t) {
    if (t.stage === 0) return t.mode === 'cab' ? { kind: 'cab', pt: t.dest, goal: 'city', t } : { kind: 'board', pt: t.board, goal: t.mode === 'train' && norm(t.from) === 'central' ? 'int:central_station' : 'city', t };
    if (t.stage === 1) return { kind: 'ride', pt: t.alight || t.dest, goal: 'city', t };
    return { kind: 'dest', pt: t.dest, goal: t.dest.room ? 'int:' + t.dest.room : 'city', t };
  }
  return w ? { kind: 'dest', pt: w, goal: w.room ? 'int:' + w.room : 'city' } : null;
}
const boardHint = t => t.mode === 'bus' ? `Tap the stop: wait for the ${t.line} bus` : `Tap the station: ${t.line} to ${short(t.alight && t.alight.name)}`;
function cityGuide(o) {
  const p = G.player, pt = o.pt, d = Math.hypot(pt.x - p.x, pt.y - p.y), w = G.world;
  if (d < ARRIVE && !G.cutscene && !G.busy) {
    if (o.kind === 'board') { if (!o.t.at) { const cur = waypoint(); arrive(cur || pt, true); o.t.at = true; toast(`${pt.name}. ${boardHint(o.t)}.`, 'good', 3600); } }
    else { arrive(pt); return null; }
  }
  const at = o.kind === 'board' && (o.t.at || d < ARRIVE);
  return pointT(pt.x, pt.y, at ? boardHint(o.t) : pt.name, { z: safe(() => w.heightAt(pt.x, pt.y), 0), dist: at ? null : d, h: o.kind === 'board' ? 2.6 : HEAD });
}
function roomGuide(o) {
  const sc = G.scene, p = G.player, t = o.t;
  if (o.kind === 'board') { const g = (sc.interactables || []).find(i => /platform/i.test(i.label || '')); if (!t.at) { t.at = true; const cur = waypoint(); if (cur) arrive(cur, true); } return g ? pointT(g.x, g.y, `Platforms: ${t.line} to ${short(t.alight && t.alight.name)}`, { h: 2.6 }) : chipT(`Board ${t.line} to ${short(t.alight && t.alight.name)}`); }
  const pt = o.pt, s = (sc.shops || []).find(q => q.venueId === pt.id || q.id === pt.id) || (sc.interactables || []).find(i => i.label === pt.name && isFinite(i.x));
  if (!s || Math.hypot(s.x - p.x, s.y - p.y) < ARRIVE_IN) { arrive(pt); return null; }
  return pointT(s.x, s.y, pt.name, { h: 2 });
}
function exitGuide(o, what) {
  const hop = route(o.goal), name = what || (o.kind === 'board' ? o.pt.name : o.pt.name);
  return hop ? pointT(hop.x, hop.y, `${hop.label || 'Exit'} → ${name}`, { h: 1.6 }) : chipT(`Leave the building → ${name}`);
}
function cabGuide(o) {
  if (G.scene.id !== 'city') return exitGuide(o, 'meet your cab outside');
  const pd = safe(() => G.transit.pending, null); if (!pd || !pd.cab) return chipT('Calling your MapleCab...');
  if (pd.state === 'coming' && pd.pick && isFinite(pd.pick.x)) return pointT(pd.pick.x, pd.pick.y, 'Cab pick-up: wait at the kerb', { h: 1.8 });
  return pointT(pd.cab.x, pd.cab.y, 'Your MapleCab: hop in', { h: 2.2 });
}
let rideSt = { was: '', missed: false };
function busGuide(ride, t) {
  const b = ride.bus, S = b && b.loop && b.loop.stops; if (!S) return null; const n = S.length, idx = id => S.findIndex(s => s.id === id);
  let stopId = t && t.mode === 'bus' && t.stage === 1 && t.alight && idx(t.alight.id) >= 0 ? t.alight.id : ride.destination || null;
  if (!stopId) return t && t.mode === 'bus' ? chipT(`This bus does not stop at ${t.alight.name}: get off and you will be re-routed`) : null;
  const i = idx(stopId); if (i < 0) return null; const poi = S[i].poi, nextI = b.atStop ? (b.nsi + 1) % n : b.nsi, left = b.atStop === stopId ? 0 : ((i - nextI + n) % n) + 1;
  const phase = b.atStop === stopId ? 'at' : left === 1 && !b.atStop ? 'next' : 'ride';
  if (rideSt.was === 'at' && phase !== 'at') { rideSt.missed = true; stopNotice('missed', 'bus', stopId, poi.name); }
  rideSt.was = phase;
  if (rideSt.missed && phase === 'ride') { const nx = S[nextI].poi; return pointT(nx.x, nx.y, 'Missed it: get off at the next stop', { h: 2.6 }); }
  if (phase !== 'ride') { rideSt.missed = false; stopNotice(phase, 'bus', stopId, poi.name); }
  return pointT(poi.x, poi.y, phase === 'at' ? 'THIS IS YOUR STOP' : phase === 'next' ? 'YOUR STOP IS NEXT' : `Get off at ${poi.name} · ${left} stops`, { red: phase !== 'ride', h: 2.6 });
}
function trainGuide(t) {
  const TR = G.trainRide, st = TR && TR.state(), r = st && st.ride, ts = st && st.ts, R = G.rail; if (!r || !ts || !R) return null;
  const dest = norm(t && t.mode === 'train' && t.to ? t.to : r.to), S = R.station(dest), name = S ? S.name : dest, p = G.player;
  const doors = TR.doors(), d = doors.reduce((a, b) => Math.abs(b.cx - p.x) < Math.abs(a.cx - p.x) ? b : a), door = (label, red) => pointT(d.cx, d.y + .45, label, { red, h: 2.5 });
  const phase = ts.dwell && ts.at === dest ? 'at' : !ts.dwell && ts.next && ts.next.id === dest ? 'next' : 'ride';
  if (rideSt.was === 'at' && phase !== 'at' && !st.leaving && !st.done) { rideSt.missed = true; stopNotice('missed', 'train', dest, name); }
  rideSt.was = phase;
  if (st.leaving || st.done) return null;
  if (phase === 'at') { rideSt.missed = false; if (st.door > .4) stopNotice('at', 'train', dest, name + ' Station'); return door('YOUR STOP: get off here', true); }
  if (phase === 'next') { rideSt.missed = false; stopNotice('next', 'train', dest, name + ' Station'); return door(`YOUR STOP IS NEXT: ${name}`, true); }
  if (rideSt.missed) return ts.dwell && st.door > .5 ? door(`Get off at ${ts.stop.st.name}: you will be re-routed`, false) : chipT('Missed your stop: get off at the next station');
  return chipT(`Stay on: ${name} in ${Math.max(1, Math.round(R.timeTo(r.dir, r.train, dest)))} min`);
}
function compute() {
  if (G.onTitle || !G.scene || !G.player || !G.cv) return null;
  const sc = G.scene, id = sc.id, ride = safe(() => G.transit.ride, null), t = trip();
  if (id === 'train') return trainGuide(t);
  if (ride && ride.kind === 'bus' && id === 'city') return busGuide(ride, t);
  if (ride && ride.kind === 'taxi' && id === 'city') { const pl = (t && t.mode === 'cab' && t.dest) || ride.place; if (!pl || !isFinite(pl.x)) return null; return pointT(pl.x, pl.y, pl.name || 'Destination', { dist: Math.hypot(pl.x - G.player.x, pl.y - G.player.y), z: safe(() => G.world.heightAt(pl.x, pl.y), 0) }); }
  const o = objective();
  /* last-metre guidance (sim/navgoals.js, owner msg 102): while an objective is unresolved the arrow goes on INSIDE, to the exact thing; arrival is decided there */
  if (id !== 'airtram' && (!o || o.kind === 'dest')) { const ng = safe(() => G.navGoals.guide(o), null); if (ng) return ng; if (o && !objective()) return null; /* it just completed there */ }
  if (!o) return null;
  if (id === 'airtram') return chipT(`Riding the tram → ${o.pt.name}`);
  if (o.kind === 'ride') return chipT(`Riding → ${o.pt.name}`);
  if (G.busy && /^Waiting for the (train|bus)/.test(G.busy.label || '')) return chipT(o.t && o.kind === 'board' ? `${G.busy.label}: ${o.t.line} to ${short(o.t.alight && o.t.alight.name)}` : G.busy.label);
  if (o.kind === 'cab') return cabGuide(o);
  if (id === o.goal) return id === 'city' ? cityGuide(o) : roomGuide(o);
  if (id === 'city') {   // the objective is inside a building: lead to its door
    const door = cityPoi('door:' + o.goal.slice(4)) || o.pt, d = Math.hypot(door.x - G.player.x, door.y - G.player.y), rn = safe(() => ROOMS.get(o.goal.slice(4)).name, null) || door.name || 'the building';
    if (o.kind === 'board' && d < ARRIVE && !o.t.at) { o.t.at = true; const cur = waypoint(); if (cur) arrive(cur, true); }
    return pointT(door.x, door.y, d < 14 ? `Go in: ${rn} → ${o.kind === 'board' ? 'platforms' : o.pt.name}` : o.kind === 'board' ? o.pt.name : `${o.pt.name} (${rn})`, { dist: d < 14 ? null : d, z: safe(() => G.world.heightAt(door.x, door.y), 0), h: 2.6 });
  }
  const pl = o.kind === 'dest' && o.pt.id && place(o.pt.id);
  if (pl && pl.roomId && id === 'int:' + pl.roomId) { arrive(o.pt); return null; }   // already inside the destination
  return exitGuide(o);
}

/* ---------- drawing ---------- */
let box = null, aEl = null, lEl = null, cur = null, sizeKey = '', bw = 0, bh = 0, marginT = 0, mT = 0, lastTxt = '';
function margins(W, H) {
  if ((mT -= 1) <= 0) { mT = 12; const bar = document.getElementById('nav-trip'), wr = G.cv.parentElement.getBoundingClientRect(); let t = SAFE.t; if (bar && bar.style.display !== 'none') { const r = bar.getBoundingClientRect(); if (r.height) t = Math.max(t, r.bottom - wr.top + 8); }
    /* things that would cover the arrow at the top edge: phone banners and toasts (the arrow moves below them; at most 42% of the height) */
    for (const q of document.querySelectorAll('#ph-banners .ph-banner,#toasts .toast')) { const r = q.getBoundingClientRect(); if (r.height && r.top - wr.top < 260) t = Math.max(t, Math.min(wr.height * .42, r.bottom - wr.top + 6)); }
    const jh = document.getElementById('jobhud'), jr = jh && jh.getBoundingClientRect(); margins.jh = jr && jr.height && jr.top - wr.top > wr.height * .4 ? { r: jr.right - wr.left + 6, t: jr.top - wr.top - 6 } : null;   /* the shift HUD sits bottom-left in portrait */
    let b = SAFE.b; for (const q of document.querySelectorAll('.ride-hud,.rail-hud')) { const r = q.getBoundingClientRect(); if (r.height) b = Math.max(b, wr.bottom - r.top + 8); } marginT = t; margins.b = b; }
  return { l: SAFE.l, r: W - SAFE.r, t: marginT + (banT > 0 ? banEl.offsetHeight + 12 : 0), b: H - (margins.b || SAFE.b) };
}
function frame(dt) {
  if (!box) return; if (banT > 0 && (banT -= dt) <= 0) banEl.classList.remove('on');
  const t = cur = compute();
  if (!t || G.modal > 0) { if (box.classList.contains('on')) box.className = ''; return; }   // (a window / the phone is open: nothing to steer by)
  const wrap = G.cv.parentElement, W = wrap.clientWidth, H = wrap.clientHeight, M = margins(W, H);
  let cls = 'on' + (t.red ? ' red' : ''), txt = t.label || '', x, y, rot = 0;
  if (t.mode === 'chip') { cls += ' chip'; } else if (t.dist != null && t.dist >= 1) txt += ` · ${safe(() => G.nav.fmtDist(t.dist), Math.round(t.dist) + ' m')}`;
  if (txt !== lastTxt) { lEl.textContent = lastTxt = txt; sizeKey = ''; }
  if (t.mode === 'chip') {
    if (box.className !== cls) { box.className = cls; sizeKey = ''; } if (sizeKey !== cls + txt) { sizeKey = cls + txt; bw = box.offsetWidth; bh = box.offsetHeight; }
    x = (W - bw) / 2; y = M.t + 2; aEl.style.transform = '';
  } else {
    const z = t.z || 0, top = G.toScreen(t.x, t.y, z + (t.h || HEAD)), gp = G.toScreen(t.x, t.y, z), pad = 18;
    // right-bottom corner belongs to the HUD buttons
    const bMax = gp.x > W - 96 ? Math.min(M.b, H - 150) : M.b;
    const inside = gp.x > M.l + pad && gp.x < M.r - pad && top.y > M.t + 30 && gp.y < bMax + 10;
    let edge = 'near';
    if (!inside) {
      const pp = G.player.hidden && G.camTarget ? G.camTarget : G.player, o0 = G.toScreen(pp.x, pp.y, pp.z || 0), ox = Math.max(M.l + 40, Math.min(M.r - 40, o0.x)), oy = Math.max(M.t + 40, Math.min(M.b - 40, o0.y - 16));
      const dx = gp.x - ox, dy = (gp.y + top.y) / 2 - oy, kx = dx > 0 ? (M.r - ox) / dx : dx < 0 ? (M.l - ox) / dx : 1e9, ky = dy > 0 ? (M.b - oy) / dy : dy < 0 ? (M.t - oy) / dy : 1e9, k = Math.min(kx, ky, 1);
      edge = kx < ky ? (dx > 0 ? 'e-r' : 'e-l') : (dy > 0 ? 'e-b' : 'e-t'); x = ox + dx * k; y = oy + dy * k; rot = Math.round(Math.atan2(dy, dx) * 180 / Math.PI + 90);
    }
    cls += ' ' + edge; if (box.className !== cls) { box.className = cls; sizeKey = ''; } if (sizeKey !== cls + txt) { sizeKey = cls + txt; bw = box.offsetWidth; bh = box.offsetHeight; }
    if (edge === 'near') { x = top.x - bw / 2; y = top.y - bh; aEl.style.transform = ''; }
    else { x -= edge === 'e-r' ? bw : edge === 'e-l' ? 0 : bw / 2; y -= edge === 'e-b' ? bh : edge === 'e-t' ? 0 : bh / 2; aEl.style.transform = `rotate(${rot}deg)`; }
    x = Math.max(M.l, Math.min(M.r - bw, x)); y = Math.max(M.t, Math.min(Math.min(x + bw > W - 96 ? Math.min(M.b, H - 150) : M.b, margins.jh && x < margins.jh.r ? margins.jh.t : 1e9) - bh, y));
  }
  box.style.transform = `translate(${Math.round(x)}px,${Math.round(y)}px)`;
}

export function init() {
  if (typeof document === 'undefined') return;
  document.head.append(el('style', { text: CSS }));
  aEl = el('span.a'); lEl = el('span.l'); box = el('div', { id: 'nav-arrow', 'aria-hidden': 'true' }, el('span.w', null, aEl), lEl); banEl = el('div', { id: 'nav-stop', role: 'alert' }); root().append(box, banEl);
  G.on('frame', frame);
  G.on('use', it => { if (it && G.scene) lastUse = { scene: G.scene.id, it, time: G.time }; });
  G.on('scene', (s, prev) => {
    if (prev && s && lastUse && lastUse.scene === prev.id && G.time - lastUse.time < 30 && /^int:/.test(prev.id) && (s.id === 'city' || /^int:/.test(s.id))) learn(prev.id, lastUse.it, s.id);
    lastUse = null; mT = 0; if (s && s.id !== 'train') hideBanner();
  });
  G.on('ride:start', () => { rideSt = { was: '', missed: false }; banKey = ''; mT = 0; });
  G.on('ride:end', () => { rideSt = { was: '', missed: false }; hideBanner(); mT = 0; });
  G.on('load', () => { hideBanner(); rideSt = { was: '', missed: false }; });
  G.navArrow = { target: () => (cur ? Object.assign({ scene: G.scene && G.scene.id }, cur) : null), banner, hideBanner, edges, route, innerPlace, get el() { return box; }, get bannerEl() { return banEl; } };
}
