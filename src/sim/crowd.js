// Crowd & ambient life: a faked, lively population around the camera (NOT agents with lives). Helpers: _crowd_core/_net/_animals/_rooms.js.
//
// City: pooled citizens (Cit extends Char) exist only near the screen. Walkers stroll the walkway network (world.walkways joined into a graph:
//   overlaps = turns, gaps over asphalt = crossings taken when no car is near); anchors (benches, bus stops, stalls, doors, landmarks, spots,
//   calendar events) keep a time/weather-dependent number of posed occupants, recruited from passing walkers when on screen.
// Rooms: on 'room:enter' venue rooms get staff (job uniform, at fixture staff spots) and customers (seats, shelves, queue, machines, dance floor)
//   that come and go. Uses scene.def.npcSpots [{x,y,dir,anim,kind:'staff'|'customer'|'queue'|'dance',seated?,outfit?}] when present.
// Animals: pigeons, seagulls, ducks, squirrels, cats, leashed dogs (see _crowd_animals.js).
//
// G.crowd
//   count() -> active citizens (city + room)          citizens() -> [Cit] (reused array; Cit has spec, kind, district, mood, st, anchor)
//   setDensity(mult)                                   freeze(bool) stop simulating (entities stay)      refill() repopulate instantly
//   spawnNear(x, y, opts) -> Cit | null   opts: { spec, outfit, age, kind, anim, dir, seated, z, keep (never auto-despawn), named (not tappable by the crowd), fade }
//        with opts.anim (or keep) the citizen stands there posed; otherwise it joins the strolling crowd.
//   despawn(cit, fade = true)                          replace an anonymous citizen with a named NPC: read cit.x/y/dir, despawn(cit, false), place yours.
//   reserve(fixture | {x,y}) / release(...)            keep a room fixture / spot free of ambient NPCs (job stations during the player's shift)
//   debug() -> counts;  bench(n) -> ms per update
// Hooks: every citizen is an interactable ('Talk'). On tap: G.social.talkToCitizen({ char, spec, district, mood, kind }) if it exists (may return a
//   Promise: the citizen waits until it resolves), else a greeting bubble. Citizens set `isCitizen = true`. No events are emitted.
// Listens: 'room:enter'/'room:exit', 'bus:arrive'/'bus:depart', 'use', 'activity', 'season', 'scene', 'load'.
import { G } from '../core/game.js';
import { findPath, followPath } from '../engine/nav.js';
import { GT } from '../engine/world.js';
import { VENUE_BY_ID, isOpen } from '../data/venues.js';
import { EVENTS, eventOnDay } from '../data/calendar.js';
import { X, Cit, rnd, ri, pick, rr, onScreen, okCell, dirOf, walkTo, getSpec, clearSpecs, registerTalk, ambientLine, speak, bubbleOk } from './_crowd_core.js';
import { playerStates, duet } from './_crowd_lines.js';
import { buildNet } from './_crowd_net.js';
import { initAnimals, updateAnimals, leash, animalCount, clearAnimals } from './_crowd_animals.js';
import { initRooms, updateRooms, reserve, release, roomCount, roomCits, roomInfo } from './_crowd_rooms.js';

export const order = 70;
/* ---------- tuning ---------- */
const CAP = 70;                 // pooled city citizens
const M_SPAWN = 64, M_GONE = 124, M_ANCH = 58; // px beyond the screen: spawn ring / despawn / anchors switch on
// citizens per 300x200 px of screen at full density (crowdFactor 1)
const DENS = { downtown: 30, oldtown: 22, harbor: 16, hillcrest: 8, maplewood: 10, arts: 18, railyard: 7, park: 16, airport: 12 };
const EV_LINES = { farmers_market: 'market_day', harvest_fair: 'maple_festival', summer_fireworks: 'fireworks', boardwalk_days: 'summer_fair', lantern_night: 'lantern_night', live_music_friday: 'gig_night', open_mic_wednesday: 'gig_night', blossom_festival: 'maple_festival', winter_lights: 'first_snow', founders_day: 'maple_festival', new_years_eve: 'fireworks' };
const EV_FALLBACK = { poi_city_plaza: [220, 222], poi_ferris_wheel: [100, 369], poi_pier: [100, 352], poi_lighthouse: [36, 352], poi_duck_pond: [96, 170.5] };

const WALK = 1, PAUSE = 2, XWAIT = 3, CROSS = 4, STATIC = 5, FOLLOW = 6, GOTO = 7, WANDER = 8, SHIFT = 9;
const pool = X.cits, ANCH = [], doors = [], evs = [], CZ = [], cand = [], candR = [], outList = [];
let net = null, NET = null, world = null, nAct = 0, target = 0, prefill = true, manageT = 0, anchT = 0, envT = 0, bubT = 5, pathBudget = 0, lfx = -999, lfy = -999, cfx = -999, cfy = -999, candTot = 0, lastT = 0, updMs = 0;
const frac = v => v - Math.floor(v);

/* ---------- pool ---------- */
function alloc() { if (nAct >= CAP) return null; for (let i = 0; i < pool.length; i++) { const c = pool[i]; if (!c.active) { c.clear(); c.keep = false; c.fails = 0; c.active = true; c.hidden = false; c.alpha = 1; nAct++; return c; } } return null; }
function freeCit(c) {
  if (!c.active) return; const a = c.anchor; if (a && a.occ[c.slot] === c) a.occ[c.slot] = null;
  const m = c.mate; if (m && m.active && m.lead === c) { m.lead = null; m.ww = c.ww; m.pw = c.pw; }
  if (c.spec && c.spec._n > 0) c.spec._n--; c.active = false; c.hidden = true; c.anchor = null; c.mate = null; c.lead = null; c.pet = null; c.path = null; c.goal = null; nAct--;
}
const fadeOut = c => { c.fade = -1; c.st = PAUSE; c.wait = 99; c.moving = false; c.link = null; };
function dress(c, district, outfit, age) { if (!outfit && !age && X.season === 3 && rnd() < .3) outfit = 'winter'; c.district = district; c.setSpec(getSpec(district, outfit, age)); c.spec._n++; }
const put = (c, x, y) => { c.x = x; c.y = y; c.zoff = 0; c.z = world.heightAt(x, y); c.t = rnd() * 10; };

/* ---------- strolling ---------- */
function next(c, first) {
  const w = NET[c.ww]; if (!w) return fadeOut(c); c.st = WALK; c.link = null; c.stuck = 0; c.pose = null;
  const L = w.links, n = L.length;
  if (!first && n && rnd() < (w.len < 8 ? .92 : .72)) {
    let l = L[ri(n)]; for (let k = 0; k < 3; k++) { if ((l.to === c.pw && n > 1) || (l.cross && rnd() < .6)) l = L[ri(n)]; else break; }
    c.link = l; c.tx = l.ax; c.ty = l.ay;
    if (l.x1 > l.x0 || l.y1 > l.y0) for (let k = 0; k < 3; k++) { const x = rr(l.x0, l.x1), y = rr(l.y0, l.y1); if (okCell(x, y)) { c.tx = x; c.ty = y; break; } }
    return;
  }
  const m = Math.min(.5, w.wid / 2 - .05); let bx = 0, by = 0, bd = 1e9;
  for (let k = 0; k < (first ? 5 : 3); k++) { const x = rr(w.x0 + m, w.x1 - m), y = rr(w.y0 + m, w.y1 - m); if (!okCell(x, y)) continue; const d = first ? Math.hypot(x - X.fx, y - X.fy) : 0; if (d < bd) { bd = d; bx = x; by = y; if (!first) break; } }
  if (bd === 1e9) { c.st = PAUSE; c.wait = 1; return; } c.tx = bx; c.ty = by;
}
function pause(c, pose, a, b) { c.st = PAUSE; c.wait = rr(a, b); c.pose = pose; c.moving = false; }
function arrive(c) {
  const L = c.link;
  if (L) { if (L.cross) { c.st = XWAIT; c.wait = 0; c.moving = false; return; } if (L.bx === L.bx) { c.st = CROSS; c.tx = L.bx; c.ty = L.by; return; } c.pw = c.ww; c.ww = L.to; c.link = null; return next(c); }
  if (X.wet) return next(c);
  const m = c.mate;
  if (m && m.active && rnd() < .55) { c.chat = true; pause(c, 'talk', 5, 11); c.faceTo(m.x, m.y); }
  else if (c.kind === 'phone' && rnd() < .7) pause(c, 'phone', 3, 8);
  else if (c.kind === 'stroll' && rnd() < .2) pause(c, rnd() < .3 ? 'phone' : null, 1, 3.5);
  else if (c.kind === 'police' && rnd() < .5) pause(c, null, 2, 6);
  else next(c);
}
const pathOk = p => { for (let i = 0; i < p.length; i++) if (world.tileType(p[i][0], p[i][1]) === GT.asphalt) return false; return true; };
function tryPath(c, x, y, limit, maxN) { if (pathBudget <= 0) return false; pathBudget--; const p = findPath(world, c.x, c.y, x, y, { limit, snap: 3 }); if (!p || !p.length || p.length > maxN || !pathOk(p)) return false; c.path = p; c.st = GOTO; c.stuck = 0; c.pose = null; return true; }
function unstick(c) { c.stuck = 0; if (++c.fails > 6) return fadeOut(c); c.goal = null; if (tryPath(c, c.tx, c.ty, 1200, 16)) return; c.link = null; next(c); }
/** walk back onto the nearest walkway and stroll on */
function rejoin(c) {
  const nw = net.nearest(c.x, c.y, 12); if (!nw) return fadeOut(c);
  if (nw.d < .2) { c.ww = nw.i; return next(c); }
  const i = nw.i; c.goal = { t: 'walk', i }; if (!tryPath(c, nw.x, nw.y, 2500, 40)) { c.goal = null; fadeOut(c); }
}
function reached(c) {
  const g = c.goal; c.goal = null; c.path = null;
  if (!g) { if (Math.hypot(c.tx - c.x, c.ty - c.y) < .6) arrive(c); else { c.link = null; next(c); } return; }
  if (g.t === 'walk') { c.ww = g.i; next(c); }
  else if (g.t === 'door') fadeOut(c);
  else if (g.t === 'slot') { const a = g.a, s = a.slots[g.i]; if (a.occ[g.i] === c && Math.hypot(s.x - c.x, s.y - c.y) < 1.3) settle(c, a, g.i); else { if (a.occ[g.i] === c) a.occ[g.i] = null; c.anchor = null; rejoin(c); } }
}
function roadClear(c) {
  const V = G.traffic && G.traffic.vehicles; if (!V) return true; const L = c.link, mx = (c.x + L.bx) / 2, my = (c.y + L.by) / 2;
  for (let i = 0; i < V.length; i++) { const v = V[i]; if (v.hidden || v.parked || !(v.v > .6)) continue; const dx = v.x - mx, dy = v.y - my; if (dx * dx + dy * dy < 72) return false; } return true;
}
function think(c) {
  const st = c.st;
  if (st === WALK || st === CROSS || st === GOTO) { // crude side-step around whoever is right ahead
    c.sx = 0; let hx = c.dir === 0 ? 1 : c.dir === 2 ? -1 : 0, hy = c.dir === 1 ? 1 : c.dir === 3 ? -1 : 0;
    if (X.playerOk) { const ox = X.px - c.x, oy = X.py - c.y; if (ox * ox + oy * oy < 1 && ox * hx + oy * hy > .05) { c.sx = hx * oy - hy * ox > 0 ? -1.3 : 1.3; return; } }
    for (let i = 0; i < pool.length; i++) { const o = pool[i]; if (!o.active || o === c || o === c.mate || o === c.lead) continue; const ox = o.x - c.x, oy = o.y - c.y; if (ox * ox + oy * oy < .7 && ox * hx + oy * hy > .05) { c.sx = hx * oy - hy * ox > 0 ? -1 : 1; break; } }
  } else if (st === STATIC) { const s = c.sl; if (s && s.anims.length > 1 && rnd() < .3) { const p = pick(s.anims); c.pose = p === 'stand' ? null : p; } }
  else if (st === XWAIT) { if (roadClear(c) || c.wait > 7) { const L = c.link; c.st = CROSS; c.tx = L.bx; c.ty = L.by; } }
  else if (st === PAUSE && c.chat) { const m = c.mate; if (m && m.active) { c.faceTo(m.x, m.y); c.pose = rnd() < .6 ? 'talk' : null; } }
}
function step(c, dt) {
  c.t += dt;
  if (c.fade) { c.alpha += c.fade * dt * 1.6; if (c.alpha >= 1) { c.alpha = 1; c.fade = 0; } else if (c.alpha <= 0) { freeCit(c); return; } }
  if (c.hold > 0) { c.hold -= dt; c.moving = false; if (c.hold <= 0) { c.pose = c.hpose || null; if (c.sl) c.dir = c.sl.dir; } return; }
  if ((c.think -= dt) <= 0) { c.think = .35 + rnd() * .3; think(c); }
  const sp = c.spd * (X.wet && !c.seated ? 1.45 : 1);
  switch (c.st) {
    case WALK: {
      const dx = c.tx - c.x, dy = c.ty - c.y, d2 = dx * dx + dy * dy; if (d2 < .03) { arrive(c); break; }
      const m = walkTo(c, c.tx, c.ty, sp * dt);
      if (c.sx) { const d = Math.sqrt(d2), nx = c.x - dy / d * c.sx * dt, ny = c.y + dx / d * c.sx * dt; if (okCell(nx, ny)) { c.x = nx; c.y = ny; } else c.sx = 0; }
      if (m < sp * dt * .3) { if ((c.stuck += dt) > .6) unstick(c); } else c.stuck = 0; break;
    }
    case PAUSE: c.moving = false; if ((c.wait -= dt) <= 0) { c.pose = null; c.chat = false; next(c); } break;
    case XWAIT: c.moving = false; c.wait += dt; break;
    case CROSS: {
      const dx = c.tx - c.x, dy = c.ty - c.y, d = Math.hypot(dx, dy); if (d < .15) { c.pw = c.ww; c.ww = c.link ? c.link.to : c.ww; c.link = null; next(c); break; }
      if (walkTo(c, c.tx, c.ty, sp * 1.35 * dt) < 1e-4) { const s = Math.min(d, sp * dt); c.x += dx / d * s; c.y += dy / d * s; c.z = world.heightAt(c.x, c.y); c.moving = true; } break;
    }
    case FOLLOW: {
      const L = c.lead; if (!L || !L.active) { c.lead = null; if (c.ww >= 0) next(c); else rejoin(c); break; }
      const side = L.dir === 0 || L.dir === 2; let tx = L.x + (side ? 0 : c.side * .62), ty = L.y + (side ? c.side * .62 : 0); if (!okCell(tx, ty)) { tx = L.x; ty = L.y; }
      const d = Math.hypot(tx - c.x, ty - c.y);
      if (d > 9) { fadeOut(c); L.mate = null; c.lead = null; break; }
      if (d > (L.moving ? .12 : .5)) { if (walkTo(c, tx, ty, Math.min(d, L.spd * (d > 1 ? 1.5 : 1.1) * (X.wet ? 1.45 : 1) * dt)) < 1e-4 && d > 2) { c.x += (tx - c.x) / d * sp * dt; c.y += (ty - c.y) / d * sp * dt; } c.pose = null; }
      else { c.moving = false; if (L.st === PAUSE && L.chat) { c.faceTo(L.x, L.y); c.pose = (c.t * .4 | 0) % 2 ? 'talk' : null; } else { c.pose = null; if (!L.moving) c.dir = L.dir; } }
      break;
    }
    case GOTO: {
      const ox = c.x, oy = c.y, m = c.path ? followPath(world, c, c.path, sp * dt) : 0; c.moving = m > 1e-4; if (c.moving) c.face(c.x - ox, c.y - oy); c.z = world.heightAt(c.x, c.y);
      if (!c.path || !c.path.length) reached(c); break;
    }
    case WANDER: {
      if (c.wait > 0) { c.wait -= dt; c.moving = false; break; }
      const d = Math.hypot(c.tx - c.x, c.ty - c.y), m = d > .15 ? walkTo(c, c.tx, c.ty, sp * dt) : 0;
      if (m < 1e-4) { const a = c.anchor, s = c.sl; c.moving = false; c.wait = rr(.3, 2.2); if (a && s) for (let k = 0; k < 5; k++) { const an = rnd() * 6.283, r = rnd() * s.wander, x = a.x + Math.cos(an) * r, y = a.y + Math.sin(an) * r; if (okCell(x, y)) { c.tx = x; c.ty = y; break; } } }
      break;
    }
    case SHIFT: { const s = c.sl, d = s ? Math.hypot(s.x - c.x, s.y - c.y) : 0; if (!s || d < .08 || walkTo(c, s.x, s.y, 1.4 * dt) < 1e-4) { if (s && c.anchor) settle(c, c.anchor, c.slot); else rejoin(c); } break; }
    default: c.moving = false;
  }
}

/* ---------- spawning walkers ---------- */
function rebuildCand() {
  cfx = X.fx; cfy = X.fy; cand.length = 0; candR.length = 0; candTot = 0; const R = ((G.W / 2 + M_SPAWN) / 16 + (G.H / 2 + M_SPAWN) / 8) / 2 + 5, x0 = cfx - R, x1 = cfx + R, y0 = cfy - R, y1 = cfy + R;
  for (let i = 0; i < NET.length; i++) { const k = NET[i], a = Math.max(k.x0, x0), b = Math.min(k.x1, x1), c = Math.max(k.y0, y0), d = Math.min(k.y1, y1); if (a >= b || c >= d) continue; cand.push(i); candR.push(a, c, b, d, candTot += Math.max(b - a, d - c) * Math.min(3, Math.sqrt(Math.min(b - a, d - c)))); }
}
function carrierZone(x, y) { for (let i = 0; i < CZ.length; i += 2) if (Math.abs(CZ[i] - x) + Math.abs(CZ[i + 1] - y) < 24) return true; return false; }
function mkWalker(c, wk, x, y) {
  const d = wk.district || world.districtAt(x, y) || 'downtown', h = X.hour, soft = wk.kind === 'path' || wk.kind === 'promenade' || wk.kind === 'boardwalk', rush = X.wd < 5 && ((h >= 7 && h < 9.5) || (h >= 16.5 && h < 18.5)), r = rnd();
  let kind = 'stroll', outfit, sp = rr(1.35, 2);
  if (soft && h > 5.5 && h < 21 && r < (X.wet ? .05 : .2)) { kind = 'jogger'; outfit = 'gymwear'; sp = rr(3.3, 4.1); }
  else if ((d === 'downtown' || d === 'arts' || d === 'railyard' || d === 'airport') && h > 6 && h < 20 && r < (rush ? .55 : .22)) { kind = 'commuter'; outfit = rnd() < .6 ? 'office' : undefined; sp = rr(2.4, 3); }
  else if ((d === 'harbor' || d === 'railyard') && !soft && h > 5 && h < 19 && r < .32) { kind = 'worker'; outfit = 'dockworker'; sp = rr(1.7, 2.2); }
  else { const q = rnd(); if (q < .025) { kind = 'police'; outfit = 'police'; sp = 1.25; } else if (q < .06 && h > 7 && h < 20) { kind = 'courier'; outfit = 'courier'; sp = 2.8; } else if (q < .06 + (X.night ? .12 : .035) + (d === 'maplewood' || d === 'hillcrest' || d === 'park' ? .035 : 0)) { kind = 'dogwalker'; sp = rr(1.4, 1.8); } else if (q < .3) kind = 'phone'; else if (q < .41) kind = 'pair'; else if (q < .62 && carrierZone(x, y)) { kind = 'carrier'; sp = rr(1.4, 1.8); } }
  put(c, x, y); dress(c, d, outfit); c.kind = kind; c.ww = wk.i; const age = c.spec.age; c.spd = sp * (age === 'elder' ? .72 : age === 'kid' ? .9 : 1); c.run = kind === 'jogger'; c.carry = kind === 'carrier'; c.side = rnd() < .5 ? 1 : -1;
  c.mood = kind === 'commuter' || kind === 'courier' ? 'busy' : pick(['ok', 'ok', 'happy', 'happy', 'tired']);
  if (kind === 'dogwalker') c.pet = leash(c);
  else if (kind === 'pair') { const m = alloc(); if (m) { put(m, x, y); dress(m, d, undefined, age === 'kid' ? 'adult' : undefined); m.kind = 'pair'; m.lead = c; c.mate = m; m.st = FOLLOW; m.spd = c.spd; m.side = c.side; m.ww = wk.i; m.mood = 'happy'; } }
  next(c, true);
}
function spawnWalker() {
  if (!cand.length) return false;
  let r = rnd() * candTot, j = 0; while (j < cand.length - 1 && candR[j * 5 + 4] < r) j++;
  const o = j * 5, x = rr(candR[o], candR[o + 2]), y = rr(candR[o + 1], candR[o + 3]);
  if (!onScreen(x, y, M_SPAWN) || (!prefill && onScreen(x, y, 10)) || !okCell(x, y)) return false;
  const c = alloc(); if (!c) return false; mkWalker(c, NET[cand[j]], x, y); return true;
}

/* ---------- anchors: posed people at benches, stops, stalls, doors, landmarks, spots, events ---------- */
function evLoc(e) { const pl = e.place || {}, P = world.pois; let p = null; if (pl.poi) { p = P.find(q => q.id === pl.poi); if (!p && EV_FALLBACK[pl.poi]) p = { x: EV_FALLBACK[pl.poi][0], y: EV_FALLBACK[pl.poi][1] }; } if (!p && pl.venue) p = P.find(q => q.id === 'stall:' + pl.venue) || P.find(q => q.id === 'door:' + pl.venue); return p ? { x: p.x, y: p.y } : null; }
const evActive = e => { const t = G.now(), h = t.hf; return (eventOnDay(e, t.day) && h >= e.hours[0] && h < e.hours[1]) || (e.hours[1] > 24 && t.day > 0 && eventOnDay(e, t.day - 1) && h < e.hours[1] - 24); };
function mkAnchors() {
  const add = (t, x, y, p, o) => ANCH.push(Object.assign({ t, x, y, p, slots: null, occ: [], seed: frac(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453 + 1), qT: 3, q: false, hold: 0, room: '', ev: null, d: world.districtAt(x, y) || 'downtown' }, o));
  for (const p of world.pois) {
    if (p.type === 'bench') add('bench', p.x, p.y, p); else if (p.type === 'busstop') add('bus', p.x, p.y, p); else if (p.type === 'stall') { add('stall', p.x, p.y, p); if (p.venue === 'market_stalls') CZ.push(p.x, p.y); }
    else if (p.type === 'landmark') add('landmark', p.x, p.y, p); else if (p.type === 'spot' && p.kind !== 'cats') add(p.kind, p.x, p.y, p);
    else if (p.type === 'door' && p.id) { const room = p.room || p.id.slice(5); add(/^home/.test(room) ? 'home' : 'door', p.x, p.y, p, { room }); if (/grocery|cornerstore|bakery/.test(room)) CZ.push(p.x, p.y); }
  }
  for (const e of EVENTS) { const l = evLoc(e); if (l) { e._loc = l; add('event', l.x, l.y, l, { ev: e }); } }
}
function want(a) {
  if (a.hold > G.time) return 0;
  const h = X.hour, f = X.cf * X.mult, f2 = Math.min(1, f + .2), day = h >= 7 && h < 20.5, dry = !X.wet, hs = frac(a.seed + Math.floor(G.state.t / 150) * .618);
  switch (a.t) {
    case 'bench': return dry && hs < .5 * f + (day ? .06 : 0) ? 1 : 0;
    case 'bus': return Math.min(4, Math.floor(hs * 4.6 * f + .25));
    case 'stall': { const v = VENUE_BY_ID[a.p.venue]; if (v && !isOpen(v, X.wd, h)) return 0; return Math.round((a.p.venue === 'market_stalls' && X.wd === 5 ? 5 : 1.5 + hs * 2.5) * f2); }
    case 'door': { const v = VENUE_BY_ID[a.room], open = v && isOpen(v, X.wd, h); if (a.room === 'bar') return open && (h >= 20 || h < 2) ? 3 + Math.floor(hs * 3) : 0; return open && dry && hs < .42 * f ? 1 : 0; }
    case 'landmark': return day && dry ? Math.floor(hs * 2.7 * f) : 0;
    case 'busker': return h >= 10 && h < 21.5 && dry && hs < .85 ? 1 + Math.round((2 + hs * 4) * f2) : 0;
    case 'chess': return day && dry ? 3 : 0;
    case 'fishing': return h >= 5.5 && h < 20 && dry ? 1 + (hs < .5 ? 1 : 0) : 0;
    case 'picnic': return h >= 11 && h < 18.5 && dry && X.season !== 3 ? 3 + (hs < .5 ? 1 : 0) : 0;
    case 'playground': return day && dry ? Math.round((X.wd >= 5 || h >= 15 ? 7 : 3) * f2) : 0;
    case 'skate': return h >= 12 && h < 21 && dry ? 2 + (hs < .5 ? 1 : 0) : 0;
    case 'beach': return h >= 10 && h < 19 && dry && X.season === 1 ? 4 : day && dry ? 1 : 0;
    case 'lookout': case 'planespotting': case 'duckpond': case 'ferriswheel': return dry && h >= 8 && h < 22 ? Math.round((1 + hs * 2) * f2) : 0;
    case 'garden': case 'shrine': return day && dry && hs < .7 ? 1 : 0;
    case 'event': return evActive(a.ev) ? 14 : 0;
  }
  return 0;
}
const D4 = [[0, -1], [0, 1], [-1, 0], [1, 0]];
function mkSlots(a) {
  const S = [], p = a.p; let s = (a.seed * 233280) | 0; const r = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  const ring = (n, r0, r1, anims, o) => { for (let k = 0, m = 0; k < n * 9 && m < n; k++) { const an = r() * 6.283, rad = r0 + r() * (r1 - r0), x = a.x + Math.cos(an) * rad, y = a.y + Math.sin(an) * rad; if (!okCell(x, y)) continue; let ok = true; for (const q of S) if (Math.hypot(q.x - x, q.y - y) < .8) { ok = false; break; } if (!ok) continue; S.push(Object.assign({ x, y, z: 0, dir: dirOf(a.x - x, a.y - y), anims, seated: false, kind: a.t, wander: 0, age: undefined }, o)); m++; } };
  const line = (n, x0, y0, ux, uy, dir) => { for (let k = 0; k < n; k++) { const x = x0 + ux * k * .78, y = y0 + uy * k * .78; if (!okCell(x, y)) break; S.push({ x, y, z: 0, dir, anims: ['stand', 'stand', 'phone', 'stand', 'talk'], seated: false, kind: 'queue', wander: 0 }); } };
  const queue = n => { let best = null, bn = 0; for (const d of D4) { let k = 0; while (k < n && okCell(a.x + d[0] * (1 + k * .78), a.y + d[1] * (1 + k * .78))) k++; if (k > bn) { bn = k; best = d; } } if (best) line(n, a.x + best[0], a.y + best[1], best[0], best[1], dirOf(-best[0], -best[1])); a.q = true; };
  switch (a.t) {
    case 'bench': S.push({ x: p.x, y: p.y, z: p.seatZ === undefined ? .45 : p.seatZ, dir: p.dir === undefined ? 1 : p.dir, anims: ['sit', 'read', 'phone', 'eat', 'sit'], seated: true, kind: 'bench', wander: 0 }); break;
    case 'bus': { const ax = p.axis === 'y' ? 0 : 1, ay = 1 - ax, dir = p.lane ? dirOf(p.lane.x - p.x, p.lane.y - p.y) : 1; for (const k of [-.8, .8, -1.6, 1.6]) { const x = p.x + ax * k, y = p.y + ay * k; if (okCell(x, y)) S.push({ x, y, z: 0, dir, anims: ['stand', 'stand', 'phone', 'stand'], seated: false, kind: 'bus', wander: 0 }); } break; }
    case 'stall': case 'ferriswheel': queue(5); break;
    case 'door': {
      let b = null; for (const d of D4) if (world.isBlocked(p.x + d[0] * 1.3, p.y + d[1] * 1.3)) { b = d; break; } if (!b) b = D4[0]; const wx = b[1] ? 1 : 0, wy = b[0] ? 1 : 0, sg = r() < .5 ? 1 : -1;
      if (a.room === 'bar') { for (const g of [sg, -sg]) if (!S.length) line(6, p.x + wx * g * 1.1, p.y + wy * g * 1.1, wx * g, wy * g, dirOf(-wx * g, -wy * g)); a.q = true; }
      else for (const g of [sg, -sg]) { const x = p.x + wx * g * 1.6 - b[0] * .1, y = p.y + wy * g * 1.6 - b[1] * .1; if (!S.length && okCell(x, y)) S.push({ x, y, z: 0, dir: dirOf(b[0], b[1]), anims: ['stand', 'stand', 'phone'], seated: false, kind: 'window', wander: 0 }); }
      break;
    }
    case 'landmark': ring(2, 2, 4.2, ['phone', 'stand', 'wave', 'phone', 'stand'], { kind: 'tourist' }); break;
    case 'busker': if (okCell(a.x, a.y)) S.push({ x: a.x, y: a.y, z: 0, dir: 1, anims: ['dance'], seated: false, kind: 'busker', wander: 0 }); ring(6, 1.7, 3.3, ['stand', 'stand', 'cheer', 'stand', 'talk'], { kind: 'listener' }); break;
    case 'chess': for (const q of [[-.6, 0, 0], [.6, 0, 2], [0, 1.2, 3]]) if (okCell(a.x + q[0], a.y + q[1])) S.push({ x: a.x + q[0], y: a.y + q[1], z: 0, dir: q[2], anims: ['stand', 'stand', 'talk'], seated: false, kind: 'chess', wander: 0 }); if (S.length < 2) ring(3, .8, 1.6, ['stand', 'talk']); break;
    case 'fishing': { let dir = 1; out: for (let k = 1; k < 5; k++) for (const d of D4) { const t = world.tileType(a.x + d[0] * k, a.y + d[1] * k); if (t === GT.water || t === GT.deepwater) { dir = dirOf(d[0], d[1]); break out; } } ring(2, 0, 1.6, ['stand']); for (const q of S) q.dir = dir; break; }
    case 'picnic': ring(4, .7, 1.4, ['sit', 'eat', 'sit', 'talk']); break;
    case 'playground': { ring(5, .5, 4, ['stand'], { wander: 4.5, age: 'kid', kind: 'kid' }); const K = S.splice(0); ring(3, 3.6, 6, ['stand', 'phone', 'talk', 'stand'], { kind: 'parent' }); const A = S.splice(0); while (K.length || A.length) { if (K.length) S.push(K.shift()); if (K.length) S.push(K.shift()); if (A.length) S.push(A.shift()); } break; }
    case 'skate': ring(3, .5, 3, ['stand'], { wander: 3, age: 'kid', kind: 'kid' }); break;
    case 'beach': ring(4, 1, 5, ['sit', 'sit', 'read', 'phone']); break;
    case 'duckpond': case 'lookout': ring(3, .7, 2.4, ['stand', 'stand', 'phone', 'wave']); break;
    case 'planespotting': ring(2, .5, 2, ['phone', 'stand', 'wave']); break;
    case 'garden': ring(1, .5, 1.5, ['work', 'stand']); break;
    case 'shrine': ring(1, .8, 1.6, ['stand']); break;
    case 'event': ring(14, 2, 9, ['stand', 'cheer', 'talk', 'phone', 'cheer', 'stand'], { kind: 'event' }); break;
  }
  return S;
}
function settle(c, a, i) {
  const s = a.slots[i]; c.x = s.x; c.y = s.y; c.zoff = s.z; c.z = world.heightAt(s.x, s.y) + s.z; c.dir = s.dir; c.seated = s.seated; const p = pick(s.anims); c.pose = p === 'stand' ? null : p;
  c.st = s.wander ? WANDER : STATIC; c.sl = s; c.kind = s.kind; c.moving = false; c.wait = 0; c.tx = s.x; c.ty = s.y; c.run = !!s.wander; c.carry = false; c.path = null; c.link = null; if (s.wander) c.spd = rr(2.6, 3.4);
}
function seat(a, i) { const c = alloc(); if (!c) return; const s = a.slots[i]; put(c, s.x, s.y); dress(c, a.d, undefined, s.age || (a.t === 'bus' || a.t === 'door' || a.t === 'chess' || a.t === 'fishing' ? 'adult' : undefined)); c.anchor = a; c.slot = i; a.occ[i] = c; c.mood = pick(['ok', 'happy', 'happy']); settle(c, a, i); }
function recruit(a, i) {
  const s = a.slots[i]; let b = null, bd = 81;
  for (let k = 0; k < pool.length; k++) { const c = pool[k]; if (!c.active || c.st !== WALK || c.mate || c.lead || c.pet || c.anchor || c.keep || (c.kind !== 'stroll' && c.kind !== 'phone') || (s.age ? c.spec.age !== s.age : c.spec.age === 'kid')) continue; const dx = c.x - s.x, dy = c.y - s.y, d = dx * dx + dy * dy; if (d < bd) { bd = d; b = c; } }
  if (!b) return false; b.goal = { t: 'slot', a, i }; if (!tryPath(b, s.x, s.y, 2500, 40)) { b.goal = null; return false; } b.anchor = a; b.slot = i; a.occ[i] = b; b.link = null; return true;
}
function unseat(c) { const a = c.anchor; if (a && a.occ[c.slot] === c) a.occ[c.slot] = null; c.anchor = null; c.sl = null; c.seated = false; c.zoff = 0; c.pose = null; c.run = false; c.carry = !!a && a.t === 'stall'; c.kind = c.carry ? 'carrier' : 'stroll'; c.spd = rr(1.4, 2) * (c.spec.age === 'elder' ? .72 : 1); c.z = world.heightAt(c.x, c.y); rejoin(c); }
function advance(a) { const O = a.occ, S = a.slots, f = O[0]; if (f) { if (f.st !== STATIC) return; unseat(f); } for (let i = 1; i < S.length; i++) { const c = O[i]; if (!c || O[i - 1]) continue; if (c.st !== STATIC) break; O[i - 1] = c; O[i] = null; c.slot = i - 1; c.sl = S[i - 1]; c.st = SHIFT; c.pose = null; } }
function tickAnchors() {
  let rec = 1; doors.length = 0;
  for (let k = 0; k < ANCH.length; k++) {
    const a = ANCH[k]; if (!onScreen(a.x, a.y, M_ANCH)) continue;
    if (a.t === 'home') { doors.push(a); continue; } if (a.t === 'door') { const v = VENUE_BY_ID[a.room]; if (!v || isOpen(v, X.wd, X.hour)) doors.push(a); }
    if (!a.slots) a.slots = mkSlots(a);
    const S = a.slots, O = a.occ, w = Math.min(S.length, want(a)); let n = 0, last = -1, ff = -1;
    for (let i = 0; i < S.length; i++) { const c = O[i]; if (c && (!c.active || c.anchor !== a)) O[i] = null; if (O[i]) { n++; last = i; } else if (ff < 0) ff = i; }
    if (n < w && ff >= 0) { const s = S[ff]; if (prefill) { for (let i = ff; i < S.length && n < w; i++) if (!O[i]) { seat(a, i); n++; } } else if (!onScreen(s.x, s.y, 6)) seat(a, ff); else if (rec > 0 && !s.wander && recruit(a, ff)) rec--; }
    else if (n > w && last >= 0 && rnd() < .3) { const c = O[last]; if (c.st === STATIC || c.st === WANDER) unseat(c); }
    else if (a.q && n > 0 && (a.qT -= .5) <= 0) { a.qT = rr(5, 11); advance(a); }
    else if (!a.q && n > 0 && rnd() < .006) { const c = O[last]; if (c.st === STATIC && onScreen(c.x, c.y, 0)) unseat(c); }
  }
}
function board(stopId, gone) { for (const a of ANCH) if (a.t === 'bus' && a.p.id === stopId) { a.hold = G.time + 14; for (const c of a.occ) if (c && c.active && c.anchor === a) { if (gone) freeCit(c); else { c.fade = -.55; if (a.p.lane) c.dir = dirOf(a.p.lane.x - c.x, a.p.lane.y - c.y); } } } }
/** someone steps out of a door / someone walks into one */
function doorLife(deficit) {
  if (!doors.length) return; const a = doors[ri(doors.length)];
  if (deficit > 1 && rnd() < .35) { const c = alloc(); if (!c) return; put(c, a.x, a.y); const groc = /grocery|cornerstore|bakery/.test(a.room); dress(c, a.d, a.room === 'office' || a.room === 'bank' ? 'office' : undefined, 'adult'); c.kind = groc ? 'carrier' : 'stroll'; c.carry = groc; c.spd = rr(1.4, 2.1); c.alpha = 0; c.fade = 1; c.mood = 'ok'; rejoin(c); if (c.fade < 0) freeCit(c); }
  else if (rnd() < (deficit < -3 ? .5 : .1)) { let b = null, bd = 100; for (let k = 0; k < pool.length; k++) { const c = pool[k]; if (!c.active || c.st !== WALK || c.mate || c.lead || c.pet || c.anchor || c.keep || c.kind === 'jogger' || c.kind === 'police') continue; const dx = c.x - a.x, dy = c.y - a.y, d = dx * dx + dy * dy; if (d < bd) { bd = d; b = c; } } if (b) { b.goal = { t: 'door' }; if (!tryPath(b, a.x, a.y, 2500, 40)) b.goal = null; else b.link = null; } }
}

/* ---------- environment / targets ---------- */
function density(dk) {
  let d = DENS[dk] === undefined ? 9 : DENS[dk], f = X.cf; const h = X.hour, we = X.wd >= 5;
  if (dk === 'downtown') { if (we) d *= .75; else if (h >= 11.5 && h < 13.5) d *= 1.25; }
  else if (dk === 'oldtown') { if (we) d *= X.wd === 5 && h >= 8 && h < 14 ? 1.6 : 1.3; }
  else if (dk === 'park') { if (we) d *= 1.35; if (h >= 12 && h < 18 && X.clear && !X.wet) d *= 1.5; }
  else if (dk === 'harbor') { if (we) d *= 1.25; if (h >= 17 && h < 20.5) d *= 1.7; }
  else if (dk === 'arts') { if (h >= 18 && h < 23) d *= 1.5; }
  else if (dk === 'maplewood' || dk === 'hillcrest') { if (we) d *= 1.2; if (h >= 15 && h < 18) d *= 1.2; }
  else if (dk === 'airport') f = Math.max(f, .5);
  for (const e of evs) if (Math.abs(e._loc.x - X.fx) + Math.abs(e._loc.y - X.fy) < 50) d *= (e.special && e.special.crowdMult) || 1.3;
  return d * f * X.mult;
}
function env() {
  const t = G.now(), W = G.weather; X.hour = t.hf; X.wd = t.weekday; X.season = t.season; X.night = t.hf < 5.5 || t.hf >= 21;
  X.wet = !!(W && W.isWet && W.isWet()); const cur = W && W.current ? W.current() : null; X.clear = !cur || cur.kind === 'clear';
  X.cf = W && W.crowdFactor ? W.crowdFactor() : (t.hf < 5 ? .13 : t.hf < 7 ? .3 : t.hf < 21 ? .9 : .4);
  evs.length = 0; for (const e of EVENTS) if (e._loc && evActive(e)) evs.push(e);
  X.dk = world.districtAt(X.fx, X.fy) || 'maplewood'; X.dens = density(X.dk);
  target = Math.min(CAP, Math.round(X.dens * (G.W + 2 * M_SPAWN) * (G.H + 2 * M_SPAWN) / 60000));
}
let stillT = 0, lastState = -99;
function chatter() {   // -> true when a bubble was shown (QA round 3: a failed try retries in 1.5 s instead of waiting a whole 5-10 s period)
  if (G.cutscene || G.player.hidden || G.modal > 0) return false; const n = pool.length, s0 = ri(n), p = G.player; let best = null, nearC = null, nd = 1e9;
  for (let k = 0; k < n; k++) { const c = pool[(s0 + k) % n]; if (!c.active || c.alpha < 1 || c.hold > 0 || !onScreen(c.x, c.y, -24) || !bubbleOk(c)) continue; const d = Math.hypot(c.x - p.x, c.y - p.y); if (d < nd) { nd = d; nearC = c; }
    if (best && (best.chat || best.st === STATIC)) continue; if (c.chat || (c.st === STATIC && c.kind !== 'bench' && c.kind !== 'busker')) best = c; else if (!best && (c.st === STATIC || c.st === XWAIT || c.kind === 'jogger' || c.kind === 'carrier')) best = c; }
  // someone right next to the player may react to the player (owner msg 79): bumped into, stared at, or a visible state (smelly, soaked, in pajamas...). Same bubble slot, no extra bubbles.
  if (nearC && G.time - lastState > 18) {
    const st = nd < .7 && X.pmove ? 'bumped' : nd < 1.4 && stillT > 6 ? 'staring' : null;
    if (st) { lastState = G.time; return speak(nearC, ambientLine(nearC, { state: st })); }
    if (nd < 5 && rnd() < .5 && playerStates().length) { lastState = G.time; return speak(nearC, ambientLine(nearC, null)); }
  }
  if (!best) best = nearC && rnd() < .5 ? nearC : null;   // QA round 3: a plain walker may talk too when nobody is standing / chatting (quiet streets were silent)
  if (!best) return false; const c = best, a = c.anchor, ev = a && a.t === 'event' ? a.ev : evs.length && rnd() < .4 ? evs[0] : null;
  if (c.chat && c.mate && c.mate.active && !ev && rnd() < .55) { const d = duet(c, { kind: c.kind }); if (d && speak(c, d[0])) { const m = c.mate; setTimeout(() => { if (m.active && G.scene === X.city && bubbleOk(m, d[1])) speak(m, d[1], true); }, 1900); return true; } }
  return speak(c, ambientLine(c, ev ? { event: EV_LINES[ev.id], eventId: ev.id } : c.kind === 'queue' ? { venue: 'queue' } : c.kind === 'bus' ? { venue: 'transit' } : c.kind === 'jogger' && rnd() < .6 ? { reaction: 'running' } : c.kind === 'carrier' && rnd() < .6 ? { reaction: 'carrying' } : c.st === XWAIT ? { kind: 'crosswalk_wait' } : null));
}

/* ---------- setup / update ---------- */
function setup(scene) {
  X.city = scene; X.world = world = scene.world; net = buildNet(world); NET = net.W; mkAnchors();
  for (let i = 0; i < CAP; i++) { const c = new Cit(); pool.push(c); scene.ents.push(c); registerTalk(c); }
  initAnimals(scene, net); prefill = true;
}
function manage() {
  for (let i = 0; i < pool.length; i++) { const c = pool[i]; if (c.active && !c.keep && !onScreen(c.x, c.y, M_GONE)) freeCit(c); }
  if (prefill || (anchT -= 1) <= 0) { anchT = 2; tickAnchors(); }
  const wcap = Math.min(target, CAP - 10); if (prefill) for (let i = 0; i < pool.length && nAct > target; i++) { const c = pool[i]; if (c.active && !c.keep && !c.anchor) freeCit(c); }
  let deficit = wcap - nAct, tries = prefill ? 500 : 4; while (deficit > 0 && tries-- > 0) if (spawnWalker()) deficit = wcap - nAct;
  if (!prefill) { doorLife(deficit); if (deficit < -4) for (let i = 0; i < pool.length; i++) { const c = pool[i]; if (c.active && !c.keep && !c.anchor && !c.lead && !onScreen(c.x, c.y, 12)) { freeCit(c); break; } } }
  prefill = false;
}
function update(dt) {
  if (X.frozen) return; const sc = G.scene; if (!sc) return;
  if (sc.indoor || sc.id !== 'city') { updateRooms(dt); return; }
  if (X.city !== sc) { if (X.city) return; setup(sc); }
  const f = G.camTarget || G.player, p = G.player; X.fx = f.x; X.fy = f.y; X.playerOk = !p.hidden && !G.cutscene; X.pmove = p.moving; X.px = p.x; X.py = p.y;
  if (Math.abs(X.fx - lfx) + Math.abs(X.fy - lfy) > 9 || Math.abs(G.state.t - lastT) > 45) { prefill = true; envT = 0; manageT = 0; if (Math.abs(G.state.t - lastT) > 45) for (const a of ANCH) for (const c of a.occ) if (c && c.active && c.anchor === a && rnd() < .7) freeCit(c); } lfx = X.fx; lfy = X.fy; lastT = G.state.t;
  if ((envT -= dt) <= 0) { envT = 1; env(); }
  if (Math.abs(X.fx - cfx) + Math.abs(X.fy - cfy) > 3) rebuildCand();
  pathBudget = 2;
  if ((manageT -= dt) <= 0) { manageT = .22; manage(); }
  for (let i = 0; i < pool.length; i++) { const c = pool[i]; if (c.active) step(c, dt); }
  updateAnimals(dt);
  stillT = X.pmove ? 0 : stillT + dt;
  if ((bubT -= dt) <= 0) bubT = chatter() ? rr(5, 10) : 1.5;
}

function spawnNear(x, y, o = {}) {
  if (!world || G.scene !== X.city) return null; let px = x, py = y, ok = okCell(x, y);
  for (let r = .5; r <= 3 && !ok; r += .5) for (let k = 0; k < 8 && !ok; k++) { px = x + Math.cos(k * .785) * r; py = y + Math.sin(k * .785) * r; ok = okCell(px, py); }
  if (!ok && !o.anim) return null; if (!ok) { px = x; py = y; }
  let c = alloc(); if (!c) { for (const q of pool) if (q.active && !q.keep && !q.anchor && !q.mate && !q.lead && !onScreen(q.x, q.y, 0)) { freeCit(q); break; } c = alloc(); if (!c) return null; }
  put(c, px, py); c.district = world.districtAt(px, py) || 'downtown'; if (o.spec) c.setSpec(o.spec); else dress(c, c.district, o.outfit, o.age);
  c.kind = o.kind || 'stroll'; c.named = !!o.named; c.keep = !!o.keep; c.spd = o.speed || rr(1.4, 2); if (o.fade) { c.alpha = 0; c.fade = 1; }
  if (o.anim || o.keep) { c.st = STATIC; c.pose = o.anim && o.anim !== 'stand' ? o.anim : null; c.dir = o.dir === undefined ? 1 : o.dir; c.seated = !!o.seated; c.zoff = o.z || 0; c.z = world.heightAt(px, py) + c.zoff; } else { rejoin(c); if (c.fade < 0 && !o.fade) { c.fade = 0; c.st = STATIC; } }
  return c;
}
function debug() {
  const k = {}, bad = []; let on = 0, road = 0, blocked = 0, stat = 0;
  for (const c of pool) if (c.active) { k[c.kind] = (k[c.kind] || 0) + 1; if (world && G.scene === X.city) { if (onScreen(c.x, c.y, 0)) on++; if (c.anchor) stat++; if (world.tileType(c.x, c.y) === GT.asphalt) { road++; if (c.st !== CROSS && c.st !== XWAIT) bad.push(c.kind + ':' + c.st + '@' + c.x.toFixed(1) + ',' + c.y.toFixed(1)); } if (world.isBlocked(c.x, c.y) && !c.seated) blocked++; } }
  return { active: nAct, onScreen: on, target, anchored: stat, district: X.dk, dens: +(X.dens || 0).toFixed(1), cf: +X.cf.toFixed(2), hour: +X.hour.toFixed(2), wd: X.wd, wet: X.wet, animals: animalCount(), road, roadBad: bad, blocked, kinds: k, events: evs.map(e => e.id), room: roomInfo(), ms: +updMs.toFixed(3) };
}
export function init() {
  initRooms();
  G.crowd = {
    count: () => nAct + roomCount(), citizens: () => { outList.length = 0; for (const c of pool) if (c.active) outList.push(c); return roomCits(outList); },
    setDensity: m => { X.mult = Math.max(0, +m || 0); envT = 0; }, freeze: b => { X.frozen = !!b; }, refill: () => { prefill = true; envT = 0; manageT = 0; },
    spawnNear, despawn: (c, fade = true) => { if (!c || !c.active) return; if (pool.includes(c)) { if (fade) { c.keep = false; fadeOut(c); } else freeCit(c); } }, reserve, release, debug,
    bench: (n = 600) => { const t0 = performance.now(); for (let i = 0; i < n; i++) update(1 / 60); return updMs = (performance.now() - t0) / n; },
    clear: () => { for (const c of pool) freeCit(c); clearAnimals(); }, CAP, DENS,
  };
  G.on('season', () => { clearSpecs(); });
  G.on('load', () => { prefill = true; envT = 0; });
  G.on('scene', s => { if (s === X.city) { prefill = true; envT = 0; manageT = 0; } });
  G.on('bus:arrive', (bus, stopId) => board(stopId, false)); G.on('bus:depart', (bus, stopId) => board(stopId, true));
  G.addSystem({ name: 'crowd', update });
}
