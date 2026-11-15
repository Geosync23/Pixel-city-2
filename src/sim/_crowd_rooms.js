// Ambient staff + customers inside venue rooms. Spots come from scene.def.npcSpots when present, else from fixtures (staff/seats/pose/use).
import { G } from '../core/game.js';
import { GT } from '../engine/world.js';
import { findPath, followPath, nearestFree } from '../engine/nav.js';
import { VENUE_BY_ID, isOpen } from '../data/venues.js';
import { JOBS } from '../data/jobs.js';
import { EVENTS, eventOnDay } from '../data/calendar.js';
import { X, Cit, rnd, ri, pick, rr, dirOf, getSpec, registerTalk, ambientLine, speak, talkTo, bubbleOk } from './_crowd_core.js';

const NP = 18, STAY = 1, IN = 2, OUT = 3;
const pool = []; let scene = null, spots = [], exitPt = null, venueId = '', vtype = '', churn = 4, checkT = 0, bubT = 6, uniform = null, desired = 0, inited = false;
const reserved = new Set();
const EAT = ['cafe', 'bakery', 'diner', 'ramen', 'pizza', 'restaurant'];
const SEAT_ANIMS = { eat: ['eat', 'drink', 'talk', 'eat', 'sit', 'phone'], bar: ['drink', 'talk', 'drink', 'sit'], library: ['read', 'read', 'read', 'sit'], bookstore: ['read', 'sit'], office: ['type'], cinema: ['sit', 'sit', 'eat'], clinic: ['sit', 'read', 'phone'], other: ['sit', 'phone', 'read'] };
const LINEKEY = { cafe: 'cafe', bakery: 'cafe', diner: 'eating', ramen: 'eating', pizza: 'eating', restaurant: 'eating', gym: 'workout', grocery: 'shopping', cornerstore: 'shopping', clothing: 'shopping', homegoods: 'shopping', bookstore: 'shopping', library: 'library', bar: 'bar', cinema: 'cinema' };
const BROWSE = /shelf|rack|produce|display|case|magazine|catalog|freezer|cooler|bin|table_display|mannequin/, COUNTER = /^(checkout|till|reception|host|host_stand|front_desk|bar_counter|ticket|teller|pickup_counter)$/;
const AMAP = { run: 'treadmill', cycle: 'treadmill', punch: 'lift', squat: 'lift', press: 'lift', yoga: 'stand', sing: 'talk', serve: 'work', browse: 'stand', watch: 'sit' };
const key = s => (s.x * 4 | 0) + ',' + (s.y * 4 | 0);
const baseVenue = id => VENUE_BY_ID[id] ? id : VENUE_BY_ID[id.split(/[_:.]/)[0]] ? id.split(/[_:.]/)[0] : '';

function popularity(h, wd) {
  const we = wd >= 5; let p = .45;
  if (venueId === 'cafe' || venueId === 'bakery') p = h < 10.5 ? .85 : h < 14 ? .65 : .45;
  else if (EAT.includes(venueId)) p = (h >= 11.5 && h < 14) ? .8 : (h >= 18 && h < 21.5) ? .9 : (h >= 23 || h < 5) ? .2 : .35;
  else if (venueId === 'bar') p = h >= 20 || h < 3 ? (we || wd === 4 ? 1 : .75) : .4;
  else if (venueId === 'gym') p = h < 9 ? .7 : h >= 17 && h < 20.5 ? .9 : .4;
  else if (venueId === 'office') p = h >= 9 && h < 17 ? .85 : .3;
  else if (venueId === 'cinema') p = h >= 18 ? .85 : .4;
  else if (venueId === 'library') p = we ? .6 : .45;
  else if (venueId === 'clinic' || venueId === 'bank') p = .4;
  else p = we ? .65 : h >= 16 && h < 19 ? .6 : .45;
  for (const e of EVENTS) if (e.place && e.place.venue === venueId && e.special && e.special.crowdMult && eventOnDay(e, G.now().day) && h >= e.hours[0] && h < e.hours[1]) p *= e.special.crowdMult;
  return Math.min(1.1, p) * X.mult;
}
function seatFor(x, y) { let b = null, bd = .5; for (const fx of scene.fixtures) for (const s of fx.seats || []) { const d = Math.hypot(s.x - x, s.y - y); if (d < bd) { bd = d; b = s; b._fx = fx; } } return b; }
function buildSpots(sc) {
  const out = [], W = sc.world, def = sc.def || {}, add = o => { o.by = null; o.z = o.z || 0; out.push(o); return o; };
  const seatAnims = SEAT_ANIMS[EAT.includes(venueId) ? 'eat' : SEAT_ANIMS[venueId] ? venueId : 'other'];
  if (Array.isArray(def.npcSpots) && def.npcSpots.length) {
    for (const s of def.npcSpots) {
      const p = sc.toWorld(s.x, s.y), k = s.kind || (s.anim === 'work' ? 'staff' : 'customer'), seat = seatFor(p.x, p.y), sitting = s.seated !== undefined ? s.seated : (seat ? !seat.stand : s.z > .2) && /sit|eat|drink|read|type|talk|phone/.test(s.anim || 'sit');
      add({ kind: k === 'staff' || k === 'worker' ? 'staff' : k === 'dance' || k === 'dancer' ? 'dance' : k === 'queue' ? 'queue' : sitting ? 'seat' : 'stand', x: seat && sitting ? seat.x : p.x, y: seat && sitting ? seat.y : p.y, z: seat && sitting ? seat.z : (s.z || 0), dir: s.dir !== undefined ? s.dir : seat && seat.dir !== undefined ? seat.dir : 1, anims: s.anim && !(s.anim === 'sit' && sitting && k !== 'staff') ? [AMAP[s.anim] || s.anim] : sitting ? seatAnims : ['stand', 'phone'], seated: sitting, fx: seat ? seat._fx : null, night: s.night, outfit: s.outfit });
    }
    return out;
  }
  for (const fx of sc.fixtures) {
    const tags = fx.tags || [], tj = tags.join(' '), desk = /computer|desk|type/.test(tj);
    if (fx.staff) add({ kind: 'staff', x: fx.staff.x, y: fx.staff.y, dir: fx.staff.dir !== undefined ? fx.staff.dir : 1, anims: desk ? ['type'] : ['work', 'work', 'stand'], fx });
    let seatN = 0;
    for (const s of fx.seats || []) { if (s.lie) continue; const st = !!s.staff; add({ kind: st ? 'staff' : 'seat', x: s.x, y: s.y, z: s.z, dir: s.dir !== undefined ? s.dir : 1, seated: !s.stand, anims: s.anim ? [s.anim] : st ? [desk ? 'type' : 'work'] : venueId === 'office' && desk ? ['type'] : seatAnims, fx, single: (fx.seats || []).length === 1, n: seatN++ }); }
    if (fx.pose && !/fitting|booth|bed/.test(tj)) { const stage = /stage|mic/.test(tj); add({ kind: stage ? 'stage' : 'pose', x: fx.pose.x, y: fx.pose.y, z: fx.pose.z, dir: fx.pose.dir !== undefined ? fx.pose.dir : 1, anims: [fx.pose.anim || (stage ? 'dance' : 'lift')], fx, single: true, outfit: venueId === 'gym' ? 'gymwear' : null }); }
    if (fx.use && !fx.staff && !(fx.seats || []).length && !fx.pose && BROWSE.test(tj) && !W.isBlocked(fx.use.x, fx.use.y)) add({ kind: 'browse', x: fx.use.x, y: fx.use.y, dir: dirOf(fx.x - fx.use.x, fx.y - fx.use.y), anims: ['stand', 'stand', 'phone', 'stand'], fx, single: true });
    if (fx.use && tags.some(t => COUNTER.test(t))) { // queue: head at the use spot, more behind it
      const dx = fx.use.x - fx.x, dy = fx.use.y - fx.y, d = dirOf(dx, dy), ux = d === 0 ? 1 : d === 2 ? -1 : 0, uy = d === 1 ? 1 : d === 3 ? -1 : 0;
      for (let k = 0; k < 3; k++) { const x = fx.use.x + ux * k * .8, y = fx.use.y + uy * k * .8; if (W.isBlocked(x, y)) break; add({ kind: 'queue', x, y, dir: (d + 2) % 4, anims: ['stand', 'stand', 'phone'], fx, single: k === 0, q: k }); }
    }
  }
  // dance floor tiles
  const dt = []; for (let y = 1; y < W.h - 1; y++) for (let x = 1; x < W.w - 1; x++) if (W.tileType(x, y) === GT.f_dance && !W.isBlocked(x + .5, y + .5)) dt.push([x + .5, y + .5]);
  for (let k = 0; k < Math.min(7, dt.length); k++) { const j = k + ri(dt.length - k), t = dt[j]; dt[j] = dt[k]; add({ kind: 'dance', x: t[0] + rr(-.15, .15), y: t[1] + rr(-.15, .15), dir: ri(4), anims: ['dance'] }); }
  return out;
}
const isRes = s => reserved.has(key(s)) || (s.fx && reserved.has(s.fx));
function onShiftHere(s) { // keep the player's own stations free during their shift
  const J = G.jobs; if (!J || !J.onShift || !J.onShift()) return false; let cur = J.current ? J.current() : null; cur = cur && (cur.id || cur.jobId || cur.job || cur); const job = JOBS.find(j => j.id === cur || j.id === (cur && cur.id)); if (!job || job.venue !== venueId) return false;
  const st = job.workLoop && job.workLoop.stations || []; return !s.fx || !s.fx.tags || s.fx.tags.some(t => st.includes(t)) || s.kind === 'staff';
}
const nearPlayer = (s, r) => { const p = G.player; return !p.hidden && Math.hypot(p.x - s.x, p.y - s.y) < r; };
const usableNow = s => !s.by && !isRes(s) && !nearPlayer(s, .7) && (s.kind !== 'dance' && s.kind !== 'stage' || X.hour >= 20 || X.hour < 4) && (s.kind !== 'queue' || !s.q || spots.some(o => o.fx === s.fx && o.kind === 'queue' && o.q === s.q - 1 && o.by));
function alloc() { for (const c of pool) if (!c.active) return c; return null; }
function settle(c) { const s = c.spot; c.x = s.x; c.y = s.y; c.zoff = s.z || 0; c.z = scene.world.heightAt(c.x, c.y) + c.zoff; c.dir = s.dir; c.seated = !!s.seated; c.pose = pick(s.anims); if (c.pose === 'stand') c.pose = null; c.moving = false; c.st = STAY; c.path = null; }
function spawn(s, instant) {
  const c = alloc(); if (!c) return null; const staff = s.kind === 'staff';
  c.clear(); c.active = true; c.hidden = false; c.alpha = instant ? 1 : 0; c.fade = instant ? 0 : 1; c.kind = staff ? 'staff' : 'customer'; c.district = (VENUE_BY_ID[venueId] || {}).district || 'downtown';
  c.setSpec(getSpec(c.district, s.outfit || (staff ? uniform : venueId === 'gym' && s.kind !== 'queue' ? 'gymwear' : venueId === 'office' ? 'office' : null) || undefined)); c.spec._n++;
  c.spot = s; s.by = c; c.stay = staff ? 1e9 : rr(25, 90); c.spd = rr(1.6, 2.2); c.zoff = 0;
  if (instant) settle(c); else { c.x = exitPt.x + rr(-.3, .3); c.y = exitPt.y - .2; c.z = scene.world.heightAt(c.x, c.y); c.dir = 3; goSpot(c); }
  return c;
}
function goSpot(c) { const s = c.spot, W = scene.world; let tx = s.x, ty = s.y; if (W.isBlocked(tx, ty)) { const f = nearestFree(W, Math.floor(tx * 2), Math.floor(ty * 2), 4); if (f) { tx = (f[0] + .5) / 2; ty = (f[1] + .5) / 2; } } c.path = findPath(W, c.x, c.y, tx, ty, { limit: 6000, snap: 4 }); c.st = IN; c.pose = null; c.seated = false; if (!c.path) settle(c); }
function free(c, now) { if (!c.active) return; if (c.spot && c.spot.by === c) c.spot.by = null; c.spot = null; if (c.spec && c.spec._n > 0) c.spec._n--; c.active = false; c.hidden = true; c.path = null; }
function leave(c, fast) {
  if (c.st === OUT) { if (fast) c.fade = -3; return; } if (c.spot && c.spot.by === c) c.spot.by = null; const W = scene.world; c.pose = null; c.seated = false; c.zoff = 0; c.hold = 0;
  if (fast) { c.st = OUT; c.fade = -3; c.path = null; return; }
  if (W.isBlocked(c.x, c.y)) { const f = nearestFree(W, Math.floor(c.x * 2), Math.floor(c.y * 2), 4); if (f) { c.x = (f[0] + .5) / 2; c.y = (f[1] + .5) / 2; } }
  c.z = W.heightAt(c.x, c.y); c.path = findPath(W, c.x, c.y, exitPt.x, exitPt.y - .3, { limit: 6000, snap: 4 }); c.st = OUT; if (!c.path) c.fade = -2;
}
function clearRoom() { for (const c of pool) free(c); for (const s of spots) s.by = null; if (scene) { for (const c of pool) { const i = scene.ents.indexOf(c); if (i >= 0) scene.ents.splice(i, 1); } } scene = null; spots = []; }
const custSpots = () => spots.filter(s => s.kind !== 'staff');
function enter(sc) {
  clearRoom(); const rid = sc.roomId || (sc.id || '').slice(4), def = sc.def || {};
  if (/^home/.test(rid) || def.home || def.noCrowd || /^(train|dev)/.test(rid)) return;
  scene = sc; venueId = baseVenue(rid); const v = VENUE_BY_ID[venueId], t = G.now(); X.hour = t.hf; X.wd = t.weekday; X.season = t.season;
  const ex = sc.interactables.find(i => i.exit); exitPt = ex ? { x: ex.x, y: ex.y } : sc.spawn && sc.spawn.x !== undefined ? { x: sc.spawn.x, y: sc.spawn.y } : { x: sc.world.w / 2, y: sc.world.h - 2 };
  const job = JOBS.find(j => j.venue === venueId); uniform = job ? job.uniform : null;
  spots = sc._crowdSpots || (sc._crowdSpots = buildSpots(sc)); for (const s of spots) s.by = null;
  for (const c of pool) if (!sc.ents.includes(c)) sc.ents.push(c);
  const open = v ? isOpen(v, t.weekday, t.hf) : true; if (!open) { desired = 0; return; }
  const staff = spots.filter(s => s.kind === 'staff' && !isRes(s) && !onShiftHere(s) && !nearPlayer(s, .7)); let ns = Math.min(staff.length, venueId === 'office' ? 6 : 3);
  for (let k = 0; k < ns; k++) { const j = k + ri(staff.length - k), s = staff[j]; staff[j] = staff[k]; spawn(s, true); }
  const cs = custSpots(), pop = popularity(t.hf, t.weekday); desired = Math.min(NP - ns, Math.round(cs.length * pop * .62));
  let guard = 0, n = 0; while (n < desired && guard++ < 80) { const s = cs[ri(cs.length)]; if (!usableNow(s) || onShiftHere(s)) continue; spawn(s, true); n++; }
  churn = rr(4, 9);
}
function step(c, dt) {
  c.t += dt; if (c.fade) { c.alpha += c.fade * dt; if (c.alpha >= 1) { c.alpha = 1; c.fade = 0; } else if (c.alpha <= 0) { free(c); return; } }
  if (c.hold > 0) { c.hold -= dt; if (c.hold <= 0 && c.st === STAY) { c.pose = c.hpose; c.dir = c.spot ? c.spot.dir : c.dir; } return; }
  if (c.st === STAY) {
    if ((c.think -= dt) <= 0) { c.think = rr(2.5, 6); const s = c.spot; if (s.anims.length > 1) { c.pose = pick(s.anims); if (c.pose === 'stand') c.pose = null; } if (c.kind !== 'staff' && (c.stay -= 4) <= 0) leave(c); }
  } else if (c.path) {
    const ox = c.x, oy = c.y, m = followPath(scene.world, c, c.path, c.spd * dt); c.moving = m > 1e-4; if (c.moving) c.face(c.x - ox, c.y - oy); c.z = scene.world.heightAt(c.x, c.y);
    if (!c.path.length) { c.path = null; c.moving = false; if (c.st === IN) { if (c.spot && c.spot.by === c && !isRes(c.spot) && !nearPlayer(c.spot, .6)) settle(c); else leave(c); } else c.fade = -2.5; }
  } else if (c.st === OUT && !c.fade) c.fade = -2.5;
}
/** an NPC at this fixture / spot makes room (player is about to use it) */
function vacate(fx, at, all) { for (const c of pool) { if (!c.active || !c.spot || c.st === OUT) continue; const s = c.spot; if ((fx && s.fx === fx && (all || s.single)) || (at && Math.hypot(s.x - at.x, s.y - at.y) < .5)) leave(c, true); } }
export function reserve(x) { if (!x) return; reserved.add(x.tags || x.ob ? x : key(x)); if (scene) vacate(x.tags || x.ob ? x : null, x.tags || x.ob ? null : x, true); }
export function release(x) { if (!x) return; reserved.delete(x.tags || x.ob ? x : key(x)); }
export function roomCount() { let n = 0; for (const c of pool) if (c.active) n++; return n; }
export function roomCits(out) { for (const c of pool) if (c.active) out.push(c); return out; }
export function roomInfo() { const k = {}; for (const c of pool) if (c.active) { const s = (c.spot ? c.spot.kind : 'moving') + ':' + (c.pose || 'stand'); k[s] = (k[s] || 0) + 1; } return { room: scene ? scene.roomId : null, venue: venueId, spots: spots.length, desired, n: roomCount(), kinds: k }; }

export function initRooms() {
  if (inited) return; inited = true;
  for (let i = 0; i < NP; i++) { const c = new Cit(); pool.push(c); registerTalk(c); }
  G.on('room:enter', sc => { try { enter(sc); } catch (e) { console.error(e); } });
  G.on('room:exit', () => clearRoom());
  G.on('use', it => { if (scene && it && (it.fx || it.spot)) vacate(it.fx || null, it.spot || null, false); });
  G.on('activity', a => { if (scene && a && a.at) vacate(null, a.at, false); });
}
/* QA round 3: showpiece rooms (museum, observatory, mall, SkyDeck, conservatory...) run their own crowds, which only ever spoke when tapped. They get the same
   ambient rate here (one bubble every 7-15 s), from a visible, unnamed person, with the room's LINES.venue pool; never during a planetarium show. */
let spT = 6;
function showpieceChatter(dt) {
  const sc = G.scene; if (!sc || !sc.indoor || /^int:(home|train|dev)/.test(sc.id || '') || (sc.def && sc.def.home)) return;
  if ((spT -= dt) > 0) return; spT = 2; if (G.cutscene || G.player.hidden || G.modal > 0) return;
  const st = sc.star && sc.star.phase; if (st === 'dim' || st === 'show' || st === 'applause') return;
  const can = [];
  for (const c of sc.ents) if (c && c !== G.player && c.spec && !c.isVehicle && !c.hidden && !c.npcId && !c.named && (c.alpha === undefined || c.alpha >= 1) && !(c._hold > 0) && !c.isCitizen && bubbleOk(c)) can.push(c);
  if (!can.length) return; const c = pick(can); if (speak(c, ambientLine(c, { venue: null }))) spT = rr(7, 15);
}
export function updateRooms(dt) {
  if (G.scene && G.scene.indoor && (!scene || G.scene !== scene)) { try { showpieceChatter(dt); } catch (e) { console.warn('chatter', e); spT = 30; } return; }
  if (!scene || G.scene !== scene) return;
  for (let i = 0; i < pool.length; i++) { const c = pool[i]; if (c.active) step(c, dt); }
  if ((checkT -= dt) <= 0) { // player proximity: never share a spot with the player
    checkT = .3; const p = G.player; if (!p.hidden) for (const c of pool) { if (!c.active || c.st !== STAY || !c.spot) continue; if (Math.hypot(p.x - c.spot.x, p.y - c.spot.y) < .45 || isRes(c.spot) || (c.kind === 'staff' && onShiftHere(c.spot))) leave(c, true); }
  }
  if ((churn -= dt) <= 0) {
    churn = rr(5, 13); const t = G.now(), v = VENUE_BY_ID[venueId], open = v ? isOpen(v, t.weekday, t.hf) : true, cs = custSpots(); X.hour = t.hf;
    let n = 0; for (const c of pool) if (c.active && c.kind !== 'staff' && c.st !== OUT) n++;
    desired = open ? Math.min(NP - 3, Math.round(cs.length * popularity(t.hf, t.weekday) * .62)) : 0;
    if (!open) { for (const c of pool) if (c.active && c.st === STAY && rnd() < .4) leave(c); }
    else if (n < desired || (n <= desired && rnd() < .35)) { for (let k = 0; k < 10; k++) { const s = cs[ri(cs.length)]; if (s && usableNow(s) && !onShiftHere(s)) { spawn(s, false); break; } } }
    else if (n > desired) { const c = pool[ri(pool.length)]; if (c.active && c.kind !== 'staff' && c.st === STAY) leave(c); }
  }
  // QA round 3: the speaker used to be ONE random slot of the 18-slot pool, so with 4-6 people in a room most ticks picked an empty slot (~1 bubble a minute);
  // now it picks among the people actually settled AND visible on screen (not under the HUD), and retries in 2 s when nobody qualifies or both bubble slots are busy.
  if ((bubT -= dt) <= 0) {
    bubT = 2; if (!G.cutscene && !G.player.hidden && G.modal <= 0) {
      const can = []; for (const c of pool) if (c.active && c.st === STAY && c.alpha >= 1 && c.hold <= 0 && bubbleOk(c)) can.push(c);
      if (can.length) { const c = pick(can); if (speak(c, ambientLine(c, { venue: (c.spot && c.spot.kind === 'queue' ? 'queue' : LINEKEY[venueId]) }))) bubT = rr(7, 15); }
    }
  }
}
