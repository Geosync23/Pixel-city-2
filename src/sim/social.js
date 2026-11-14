// Social system: named NPCs (story/cast.js) on schedules, relationships, conversations, gifts, invitations both ways, citizens.
// UI: src/ui/talk.js. Private data helpers: src/sim/_social_data.js.
//
// State G.state.social = {
//   npcs: { [castId]: rec }, citizens: { [czId]: rec + { id, name, spec, district, x, y, metDay } },
//   rec = { rel 0-100, met 0|1, lastTalkDay, talksToday, flags: {}, memory: [{d, v}], cd: { verbId|call|text: untilT }, last?: { d, topic } }
//   over: { [id]: { placeId|null, until?, anim?, x?, y? } }  scripted placement overrides (G.social.place)
//   hang: { [apptId]: { npc, placeId, t, dur, kind: 'out'|'visit'|'host', st: 0 waiting | 1 hung out, greet?, fed? } }
//   seq, seed, nextInvite (abs minute) }
//
// G.social
//   npc(id) -> { id, name, short, role, group, district, home, spec, rel, tier, tierLabel, met, where, knownFacts: [string], bio?, birthday? } | null
//   rel(id) -> 0..100     addRel(id, d, { raw? }) -> applied delta     setRel(id, v)     tier(id) -> 'stranger'|'acquaintance'|'friend'|'close'
//   tierInfo(id) -> { id, label, idx, family }      known() -> [ids met]      meet(id)      isFamily(id)
//   whereIs(id) -> { placeId, label, name, sceneId, x?, y? }       present(id) -> bool (a Char in the current scene)      char(id) -> Char | null
//   staffAt(venueId) -> [ids working there right now]     boss(jobId) -> castId     discount(venueId) -> 0..0.1
//   talk(id, opts?) -> Promise (opens the panel)     converse(id, opts?) -> session (no UI; session.verbs()/act(verbId, arg)/close())
//       opts: { greeting: string|[...], lines: { [verbId]: string|[...] } forced NPC replies, max: exchanges, onEnd(session) }
//   talkToCitizen({ char, spec, district, mood, kind }) -> Promise     (hook for sim/crowd.js)
//   place(id, placeId | null, { until | minutes, anim, x, y, scene })   scripted placement (placeId: room id, G.places id, 'park'...; null = hidden); place(id) clears.
//       x,y = exact world position in `scene` (default 'city'; pass e.g. 'int:cafe' for a spot inside a room); placeId is then only the label
//   sayAs(id, text | [texts]) -> Promise      dialogue box with the NPC's name (faces the player when present)
//   invite(npcId, { apptId, title, placeId, t, dur }) -> bool      (planner app: ask an NPC along to an existing appointment)
//   inviteFrom(npcId, { placeId, t, dur, text, title })            NPC texts an invitation with Accept / Decline
//   hangout(npcId, { placeId, t, dur, kind? }) -> apptId            create an agreed meeting directly (story use)
//   call(id) -> bool      onText(id)      onMissed (marker: the planner leaves stood-up texts to us)      refresh()
// Events: 'npc:met'(id), 'friend:up'(id, tier), 'friend:down'(id, tier), 'social:talk'(id, verbId, ok), 'social:gift'(id, itemId, kind),
//         'social:hangout'(id, apptId, kind), 'social:favor'(id, favorId, effect), 'social:citizen'(czId)
import { G } from '../core/game.js';
import { Char, charArt } from '../core/char.js';
import { CAST, CAST_BY_ID, JOBS } from '../story/cast.js';
import { RELATIONSHIP_TIERS as TIERS, STARTING_RELATIONSHIP as START, VERBS, GIFT_REACTIONS, FAVORS, NPC_LINES, AMBIENT, LORE_TOPICS } from '../story/dialogue.js';
import * as TEXTS from '../story/texts.js';
import { ITEM_BY_ID } from '../data/items.js';
import { ROOMS } from '../scenes/interior.js';
import { bubble, toast, say as kitSay } from '../ui/kit.js';
import { openTalk } from '../ui/talk.js';
import { hash, buildSpecs, OUTDOOR, HOME_ROOM, HOME_LABEL, venueName, HANG, HANG_MENU, citizenName, citizenInfo, CTX } from './_social_data.js';

export const order = 70;
const DAY = 1440, DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'], SEASON = ['spring', 'summer', 'autumn', 'winter'];
const PLACE_ID = { park: 'poi_duck_pond', pier: 'poi_pier', lookout: 'poi_lookout' };
const GIFT_ALIAS = { gift_flowers: 'flowers', gift_wildflowers: 'flowers', gift_chocolates: 'chocolate', chocolate_bar: 'chocolate', gift_candle: 'candle', gift_wine: 'wine', gift_postcards: 'postcard', gift_succulent: 'houseplant', fish: 'fresh_fish', duck_feed: 'birdseed', granola_bar: 'protein_bar', gift_honey: 'maple_syrup', gift_cake: 'pastry_box' };
const GIFTABLE = ['gift', 'book', 'snack', 'drink', 'meal', 'dish', 'ready_meal', 'ingredient'], FOOD = ['meal', 'dish', 'ready_meal', 'snack', 'drink'];
const fresh = () => ({ npcs: {}, citizens: {}, over: {}, hang: {}, seq: 0, seed: 20431, nextInvite: 0 });
let S = null, RT = {}, GONE = [], LOC = {}, SPECS = {}, CZI = {}, ANON = null, lastQ = -1, tick = 0, bubT = 0;

const rnd = () => { S.seed = (S.seed * 16807) % 2147483647; return S.seed / 2147483647; };
const pick = a => (a && a.length ? a[Math.floor(rnd() * a.length) % a.length] : '');
const vpick = a => (a && a.length ? a[Math.floor(Math.random() * a.length)] : '');
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const today = () => Math.floor(G.state.t / DAY);
const pname = () => (G.state.player && G.state.player.name) || 'you';
const clock12 = t => { const m = Math.floor(t % DAY), h = Math.floor(m / 60), mm = m % 60; return `${h % 12 || 12}:${String(mm).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`; };
const dayWord = t => { const d = Math.floor(t / DAY) - today(), h = (t % DAY) / 60; return d === 0 ? (h >= 17 ? 'tonight' : 'today') : d === 1 ? 'tomorrow' : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][Math.floor(t / DAY) % 7]; };
const cityWorld = () => { const c = G.sceneCache.get('city'); return c && c.world; };
const cityPoi = id => { const w = cityWorld(); return w && w.pois.find(p => p.id === id); };
const placeLabel = id => { const p = G.places && G.places.get && G.places.get(id); return (p && p.name) || venueName(id); };

/* ---------- records ---------- */
function info(id) { if (id === '_anon') return ANON && ANON.info; const c = CAST_BY_ID[id]; if (c) return c; const z = S.citizens[id]; if (!z) return null; return CZI[id] || (CZI[id] = citizenInfo(z)); }
function rec(id) {
  if (id === '_anon') return ANON && ANON.rec; if (S.citizens[id]) return S.citizens[id]; if (!CAST_BY_ID[id]) return null;
  return S.npcs[id] || (S.npcs[id] = { rel: START[id] || 0, met: START[id] !== undefined ? 1 : 0, lastTalkDay: -1, talksToday: 0, flags: {}, memory: [], cd: {} });
}
const isFamily = id => { const c = info(id); return !!c && c.group === 'family'; };
const tierIdx = r => { let k = 0; for (let i = 0; i < TIERS.length; i++) if (r >= TIERS[i].min) k = i; return k; };
const rel = id => { const r = rec(id); return r ? r.rel : 0; };
const tier = id => TIERS[tierIdx(rel(id))].id;
const tierInfo = id => { const i = tierIdx(rel(id)), fam = isFamily(id); return { id: TIERS[i].id, label: fam ? 'Family' : TIERS[i].label, idx: i, family: fam, min: TIERS[i].min, max: TIERS[i].max }; };
const specs = id => SPECS[id] || (SPECS[id] = CAST_BY_ID[id] ? buildSpecs(CAST_BY_ID[id]) : { base: (S.citizens[id] || (ANON && ANON.z) || {}).spec || {}, work: null });
const allIds = () => CAST.map(c => c.id).concat(Object.keys(S.citizens));
function meet(id) { const r = rec(id); if (!r || r.met || id === '_anon') return; r.met = 1; G.emit('npc:met', id); const c = info(id); if (c.group !== 'family') toast(`You met ${c.name}.`, 'good'); }
function addRel(id, d, o = {}) {
  const r = rec(id); if (!r || !d) return 0; const before = tierIdx(r.rel), old = r.rel;
  if (d > 0 && !o.raw && G.skills) d *= 1 + .04 * ((G.skills.level('charisma') || 1) - 1);
  const floor = isFamily(id) ? 40 : r.flags.acq ? 15 : 0; r.rel = id === '_anon' ? clamp(r.rel + d, 0, 12) : clamp(r.rel + d, Math.min(floor, old), 100); if (d < 0 && r.rel < floor) r.rel = Math.min(old, floor);
  r.rel = Math.round(r.rel * 10) / 10; const now = tierIdx(r.rel); if (now >= 1) r.flags.acq = 1;
  if (now !== before && id !== '_anon') { const c = info(id); G.emit(now > before ? 'friend:up' : 'friend:down', id, TIERS[now].id); if (now > before) toast(`${c.short} is now ${now === 3 ? 'a close friend' : now === 2 ? 'a friend' : 'an acquaintance'}!`, 'good'); }
  return r.rel - old;
}
function fill(s, c, x) {
  return String(s || '').replace(/\{(\w+)\}/g, (m, k) => k === 'name' ? pname() : k === 'npc' ? (c ? c.short : '') : k === 'role' ? (c ? c.role : '') : x && x[k] !== undefined ? x[k]
    : k === 'venue' ? ((G.scene && G.scene.roomId && venueName(G.scene.roomId)) || 'the cafe') : k === 'district' ? 'the neighborhood' : k === 'gift' ? 'gift' : m);
}

/* ---------- schedules & locations ---------- */
const hm = s => +s.slice(0, 2) * 60 + +s.slice(3);
function block(c, t) {
  const d = Math.floor(t / DAY), m = t - d * DAY, wd = DAYS[d % 7], yd = DAYS[(d + 6) % 7]; let b = null;
  if (c.citizen) { const z = S.citizens[c.id]; return z && z.metDay !== d && (d + hash(c.id)) % 2 === 0 && m >= 600 && m < 1080 ? { place: '@haunt', anim: (hash(c.id) & 1) ? 'walk' : 'stand' } : null; }
  for (const r of c.routine || []) { const f = hm(r.from), to = hm(r.to); if (to > f ? (r.days.includes(wd) && m >= f && m < to) : ((r.days.includes(wd) && m >= f) || (r.days.includes(yd) && m < to))) b = r; }
  return b;
}
function placeLoc(key) { // room id / G.places id / outdoor key -> location
  if (!key) return { placeId: null, label: 'Away', sceneId: null };
  if (ROOMS.has(key)) { const d = cityPoi('door:' + key) || {}; return { placeId: key, label: placeLabel(key), sceneId: 'int:' + key, room: key, dx: d.x, dy: d.y }; }
  const o = OUTDOOR[key]; if (o) return { placeId: PLACE_ID[key] || key, label: o.name, sceneId: 'city', x: o.x, y: o.y };
  const p = G.places && G.places.get && G.places.get(key); if (p) return { placeId: key, label: p.name, sceneId: 'city', x: p.x + 1.5, y: p.y + 1.5 };
  const d = cityPoi('door:' + key); if (d) return { placeId: key, label: venueName(key), sceneId: 'city', x: d.x + 1.5, y: d.y + 2 };
  return { placeId: null, label: 'Out and about', sceneId: null };
}
function routineLoc(c, key) {
  if (key === '@haunt') { const z = S.citizens[c.id]; return { placeId: null, label: 'Out and about', sceneId: 'city', x: z.x, y: z.y }; }
  if (key === 'home') { const room = HOME_ROOM[c.home]; return room && ROOMS.has(room) ? Object.assign(placeLoc(room), { label: HOME_LABEL[c.home] }) : { placeId: null, label: 'At home', sceneId: null }; }
  if (key === 'spot:building_stoop') { const h = G.state.home && G.state.home.id, p = h && cityPoi('door:home:' + h); return p ? { placeId: 'home:' + h, label: 'your building', sceneId: 'city', x: p.x + 2, y: p.y + 2 } : { placeId: null, label: 'Out and about', sceneId: null }; }
  return placeLoc(key);
}
function computeLoc(id, t) {
  const c = info(id); let l = null;
  for (const k in S.hang) { const h = S.hang[k]; if (h.npc === id && t >= h.t - 15 && t < h.t + h.dur) { l = placeLoc(h.placeId); l.hang = k; l.anim = 'stand'; return l; } }
  const o = S.over[id];
  if (o) { if (o.until && t >= o.until) delete S.over[id]; else { l = placeLoc(o.placeId); if (o.x !== undefined) { l.x = o.x; l.y = o.y; l.fixed = 1; l.sceneId = o.scene || 'city'; } l.anim = o.anim || 'stand'; l.over = 1; return l; } }
  const b = block(c, t); if (!b) return { placeId: null, label: 'At home', sceneId: null };
  l = routineLoc(c, b.place); l.anim = b.anim; l.work = !!(c.work && c.work.venue === b.place); return l;
}
const lkey = l => [l.sceneId, l.placeId, l.x, l.y, l.anim, l.hang].join('|');
function refresh(force) {
  const t = G.state.t;
  for (const k in S.hang) { const h = S.hang[k]; if (t >= h.t + h.dur + 6) { delete S.hang[k]; } else if (t >= h.t + h.dur - 4 && h.kind === 'visit' && !h.bye && RT[h.npc]) { h.bye = 1; bubble(RT[h.npc].char, fill(vpick(TEXTS.VISIT_REPLIES.leaving), info(h.npc)), 3600); } }
  for (const id of allIds()) { const l = computeLoc(id, t), old = LOC[id]; if (force || !old || lkey(old) !== lkey(l)) { LOC[id] = l; if (RT[id]) leave(id); } }
  sync();
}
function whereIs(id) { const l = LOC[id] || (info(id) ? computeLoc(id, G.state.t) : null); return l ? { placeId: l.placeId, label: l.label, name: l.label, sceneId: l.sceneId, x: l.x !== undefined ? l.x : l.dx, y: l.y !== undefined ? l.y : l.dy } : null; }

/* ---------- presence ---------- */
function freeNear(W, x, y, r = 5) { for (let k = 0; k <= r * 2; k++) for (let dy = -k; dy <= k; dy++) for (let dx = -k; dx <= k; dx++) { if (Math.max(Math.abs(dx), Math.abs(dy)) !== k) continue; const px = x + dx * .5, py = y + dy * .5; if (px > 1 && py > 1 && px < W.w - 1 && py < W.h - 1 && !W.isBlocked(px, py)) return { x: px, y: py }; } return { x, y }; }
function drop(rt) {
  const sc = rt.scene; let i = sc.ents.indexOf(rt.char); if (i >= 0) sc.ents.splice(i, 1); i = sc.interactables.indexOf(rt.it); if (i >= 0) sc.interactables.splice(i, 1);
  if (rt.spot && G.crowd && G.crowd.release) try { G.crowd.release({ x: rt.spot.x, y: rt.spot.y }); } catch (e) { /* crowd not ready */ }
  if (RT[rt.id] === rt) delete RT[rt.id]; i = GONE.indexOf(rt); if (i >= 0) GONE.splice(i, 1);
}
function leave(id) { // walk out of view, then vanish
  const rt = RT[id]; if (!rt) return; const sc = rt.scene, ch = rt.char, W = sc.world;
  if (sc !== G.scene) return drop(rt); delete RT[id];
  let i = sc.interactables.indexOf(rt.it); if (i >= 0) sc.interactables.splice(i, 1);
  if (rt.spot && G.crowd && G.crowd.release) try { G.crowd.release({ x: rt.spot.x, y: rt.spot.y }); } catch (e) { /* */ } rt.spot = null;
  ch.pose = null; ch.poseOpts = null; if (ch.zoff || W.isBlocked(ch.x, ch.y)) { const p = freeNear(W, ch.x, ch.y, 3); ch.x = p.x; ch.y = p.y; ch.zoff = 0; }
  let tx, ty; if (sc.indoor) { const s = typeof sc.spawn === 'object' && sc.spawn ? sc.spawn : { x: W.w / 2, y: W.h - 2 }; tx = s.x; ty = s.y; }
  else { const n = LOC[id], P = G.player; if (n && n.dx !== undefined && Math.hypot(n.dx - ch.x, n.dy - ch.y) < 45) { tx = n.dx; ty = n.dy + 1; } else { const a = Math.atan2(ch.y - P.y, ch.x - P.x); const p = freeNear(W, ch.x + Math.cos(a) * 16, ch.y + Math.sin(a) * 16, 6); tx = p.x; ty = p.y; } }
  rt.leaving = true; rt.t = 0; let ok = false; try { ok = ch.goTo(W, tx, ty, { snap: 8, limit: 6000 }); } catch (e) { ok = false; }
  if (!ok) return drop(rt); GONE.push(rt);
}
const STANDING = a => { const A = charArt().ANIMS || {}; return A[a] && !['walk', 'stand', 'sit', 'sleep'].includes(a) ? a : null; };
function placeRoom(rt) {
  const sc = rt.scene, W = sc.world, l = rt.loc, ch = rt.char, P = G.player;
  const taken = s => { for (const k in RT) { const o = RT[k]; if (o !== rt && o.scene === sc && Math.hypot(o.char.x - s.x, o.char.y - s.y) < .45) return true; } return Math.hypot(P.x - s.x, P.y - s.y) < .5; };
  let all = []; try { all = ((sc.def && sc.def.npcSpots) || []).map(s => { const p = sc.toWorld(s.x, s.y); return { x: p.x, y: p.y, z: s.z || 0, dir: s.dir, anim: s.anim, kind: s.kind }; }); } catch (e) { all = []; }
  if (!all.length) for (const fx of sc.fixtures || []) { if (fx.tags.includes('seat') && !fx.tags.includes('bed')) for (const s of fx.seats) if (s && !s.lie && !s.staff) all.push({ x: s.x, y: s.y, z: s.z || 0, dir: s.dir === undefined ? 1 : s.dir, anim: 'sit', kind: 'customer' }); if (fx.staff) all.push({ x: fx.staff.x, y: fx.staff.y, z: fx.staff.z || 0, dir: fx.staff.dir === undefined ? 1 : fx.staff.dir, anim: 'work', kind: 'staff' }); }
  let spot = null; const h = hash(rt.id), sitty = ['sit', 'eat', 'drink', 'read', 'type', 'phone'].includes(l.anim) || !!l.hang;
  if (l.work) spot = all.find(s => s.kind === 'staff' && !taken(s));
  if (!spot && !l.fixed) { let cs = all.filter(s => s.kind !== 'staff' && !taken(s) && (s.anim === 'sit') === sitty); if (!cs.length && sitty) cs = all.filter(s => s.kind !== 'staff' && !taken(s)); if (cs.length) spot = cs[h % cs.length]; }
  if (!spot) { const c0 = l.fixed ? { x: l.x, y: l.y } : { x: 1 + (sc.def ? sc.def.w : W.w) * (.3 + (h % 5) * .1), y: 1 + (sc.def ? sc.def.d : W.h) * (.45 + (h % 3) * .12) }, p = freeNear(W, c0.x, c0.y, 4); spot = { x: p.x, y: p.y, z: 0, dir: 1, anim: 'stand', kind: 'floor' }; }
  ch.x = spot.x; ch.y = spot.y; ch.zoff = spot.z || 0; ch.dir = spot.dir === undefined ? 1 : spot.dir; ch.z = W.heightAt(ch.x, ch.y) + ch.zoff; ch.poseOpts = null;
  if (spot.kind === 'staff') ch.pose = STANDING(spot.anim) || STANDING(l.anim) || 'work';
  else if (spot.anim === 'sit') { ch.pose = ['eat', 'drink', 'read', 'type', 'phone', 'talk'].includes(l.anim) ? l.anim : 'sit'; if (ch.pose !== 'sit') ch.poseOpts = { seated: true }; rt.seated = true; }
  else ch.pose = STANDING(spot.anim === 'run' ? 'treadmill' : spot.anim) || STANDING(l.anim);
  rt.spot = spot; rt.far = spot.kind === 'staff' || rt.seated; rt.basePose = ch.pose; rt.baseOpts = ch.poseOpts;
  if (spot.kind !== 'floor' && G.crowd && G.crowd.reserve) try { G.crowd.reserve({ x: spot.x, y: spot.y }); } catch (e) { /* */ }
}
function placeCity(rt) {
  const W = rt.scene.world, l = rt.loc, ch = rt.char, h = hash(rt.id), a = (h % 628) / 100, r = l.fixed ? 0 : 1 + (h % 3) * .8;
  let p = freeNear(W, Math.round((l.x + Math.cos(a) * r) * 2) / 2, Math.round((l.y + Math.sin(a) * r) * 2) / 2, 6); ch.zoff = 0; ch.pose = STANDING(l.anim); ch.dir = h % 2;
  if (l.anim === 'sit') { const b = W.pois.find(q => q.type === 'bench' && Math.hypot(q.x - l.x, q.y - l.y) < 10 && !Object.values(RT).some(o => o !== rt && Math.hypot(o.char.x - q.x, o.char.y - q.y) < .6)); if (b) { const s = b.seat || (b.seats && b.seats[0]) || { x: b.x, y: b.y, z: b.seatZ === undefined ? .45 : b.seatZ, dir: b.dir === undefined ? 1 : b.dir }; p = { x: s.x, y: s.y }; ch.zoff = s.z || 0; ch.dir = s.dir === undefined ? 1 : s.dir; ch.pose = 'sit'; rt.seated = true; rt.spot = { x: s.x, y: s.y }; } }
  ch.x = p.x; ch.y = p.y; ch.z = W.heightAt(p.x, p.y) + ch.zoff; rt.anchor = { x: p.x, y: p.y }; rt.stroll = l.anim === 'walk' && !l.fixed; rt.t = 1 + (h % 40) / 10; rt.basePose = ch.pose; rt.baseOpts = null; rt.far = rt.seated;
}
function spawn(id, l) {
  const sc = G.scene, c = info(id), sp = specs(id), ch = new Char(l.work && sp.work ? sp.work : sp.base, 0, 0); ch.npcId = id; ch.speed = 2.4;
  const rt = RT[id] = { id, char: ch, scene: sc, loc: l, t: 0, greetT: G.time + 2 + Math.random() * 3 };
  if (sc.indoor) placeRoom(rt); else placeCity(rt);
  sc.ents.push(ch); const r = rec(id);
  rt.it = { ent: ch, x: ch.x, y: ch.y, label: r.met ? 'Talk to ' + c.short : 'Say hello', range: rt.far ? 2.7 : 1.6, h: 1.3, npc: id, use: () => { talk(id); } }; sc.interactables.push(rt.it);
  const h = l.hang && S.hang[l.hang]; if (h && !h.greet) { h.greet = 1; setTimeout(() => { if (RT[id] === rt) bubble(ch, fill(vpick(h.kind === 'visit' ? TEXTS.VISIT_REPLIES.arriving : h.kind === 'host' ? CTX.hostWelcome : CTX.hangArrive), c), 3600); }, 900); }
}
function sync() {
  const sc = G.scene; if (!sc || !S) return; const sid = sc.id, P = G.player;
  for (const id in RT) if (RT[id].scene !== sc) drop(RT[id]);
  for (const rt of GONE.slice()) if (rt.scene !== sc) drop(rt);
  for (const id in LOC) { const l = LOC[id]; if (l.sceneId !== sid || RT[id]) continue; if (!sc.indoor && Math.hypot(l.x - P.x, l.y - P.y) > 34) continue; try { spawn(id, l); } catch (e) { console.error('social spawn', id, e); delete RT[id]; } }
}
function update(dt) {
  const sc = G.scene; if (!sc || !S) return; const W = sc.world, P = G.player;
  for (const id in RT) { const rt = RT[id], ch = rt.char; ch.t += dt;
    if (rt.wave > 0) { rt.wave -= dt; if (rt.wave <= 0 && !rt.talking) { ch.pose = rt.basePose; ch.poseOpts = rt.baseOpts; } }
    if (rt.stroll && !rt.talking && !(rt.wave > 0)) { if (ch.path) { ch.t -= dt; ch.move(W, dt); } else { ch.moving = false; rt.t -= dt; if (rt.t <= 0) { rt.t = 3 + Math.random() * 7; const tx = rt.anchor.x + Math.round((Math.random() * 8 - 4) * 2) / 2, ty = rt.anchor.y + Math.round((Math.random() * 8 - 4) * 2) / 2; if (!W.isBlocked(tx, ty)) try { ch.goTo(W, tx, ty, { limit: 500 }); } catch (e) { /* */ } } } } }
  for (const rt of GONE.slice()) { rt.t += dt; rt.char.move(W, dt); if (!rt.char.path || rt.t > 10) drop(rt); }
  tick -= dt; if (tick > 0) return; tick = .5;
  if (!sc.indoor) { for (const id in RT) { const c = RT[id].char; if (Math.hypot(c.x - P.x, c.y - P.y) > 46) drop(RT[id]); } sync(); }
  if (G.busy || G.cutscene || G.time < bubT) return;
  for (const id in RT) { const rt = RT[id], ch = rt.char, r = rec(id); if (!r.met || G.time < rt.greetT || Math.hypot(ch.x - P.x, ch.y - P.y) > 3.4) continue;
    rt.greetT = G.time + 120; bubT = G.time + 6; const c = info(id), bark = rt.loc.work && TEXTS.VENUE_BARKS && TEXTS.VENUE_BARKS[rt.loc.placeId];
    bubble(ch, fill(bark && bark.speaker === id && Math.random() < .6 ? vpick(bark.greeting) : vpick(CTX.wave), c), 2600);
    if (!rt.seated && rt.spot && rt.spot.kind !== 'staff' || !rt.spot) { ch.stop(); ch.faceTo(P.x, P.y); ch.pose = 'wave'; ch.poseOpts = null; rt.wave = 1.5; } break; }
}

/* ---------- conversation engine ---------- */
function chance(v, c, r) {
  const f = v.factors || {}, tr = c.personality || []; let p = v.baseChance;
  for (const t of tr) { if ((f.likedBy || []).includes(t)) p += .15; if ((f.dislikedBy || []).includes(t)) p -= .15; }
  p += (f.tierBonus || 0) * Math.max(0, tierIdx(r.rel) - TIERS.findIndex(x => x.id === v.minTier));
  if (G.needs && G.needs.mood) p -= (f.mood || 0) * (1 - G.needs.mood() / 100) * .5;
  if (G.skills) p += ((G.skills.level('charisma') || 1) - 1) * .02;
  return clamp(p, .05, .98);
}
function npcPool(id, r) { const L = NPC_LINES[id]; if (!L) return []; let out = []; for (let i = tierIdx(r.rel); i >= 0 && !out.length; i--) out = L[TIERS[i].id] || []; if (isFamily(id) && L.family) out = out.concat(L.family); return out; }
function ambientReply(c) { const h = G.now().hour, part = h < 11 ? 'morning' : h < 17 ? 'midday' : h < 21 ? 'evening' : 'night', k = rnd(); return pick(k < .45 ? AMBIENT.district[c.district] : k < .75 ? AMBIENT.timeOfDay[part] : AMBIENT.season[SEASON[G.now().season]]) || pick(AMBIENT.timeOfDay[part]); }
function greet(id, c, r, x) {
  const fam = c.group === 'family', i = tierIdx(r.rel), g = c.greetings || {}, out = [fill(pick(fam ? (i >= 3 ? g.high : g.mid) : i >= 3 ? g.high : i === 2 ? g.mid : g.low) || 'Hello!', c)];
  const N = G.needs, n = k => (N ? N.get(k) : 100), now = G.now(), w = G.state.weather, b = c.birthday; let k = null, tok = null;
  if (x.hang) k = x.hang.kind === 'visit' ? 'visitHere' : x.hang.kind === 'host' ? 'hostWelcome' : 'hangArrive';
  else if (x.first && !fam) k = 'intro';
  else if (b && SEASON[now.season] === b.season && now.dayOfMonth === b.day) k = 'birthday';
  else if (n('energy') < 22) k = 'tired'; else if (n('hunger') < 22) k = 'hungry'; else if (n('hygiene') < 18) k = 'grubby';
  else if (G.state.wardrobe && G.state.wardrobe.temp) k = 'uniform';
  else if (r.last && r.last.d < today() && rnd() < .6) { k = 'remember'; tok = { topic: r.last.topic }; }
  else if (x.atWork) k = i >= 1 ? 'staffKnown' : 'atWork';
  else if ((w === 'rain' || w === 'storm') && rnd() < .6) k = 'rain'; else if (w === 'snow' && rnd() < .6) k = 'snow';
  else if (n('social') < 25) k = 'lonely'; else if (N && N.mood && N.mood() > 82 && rnd() < .5) k = 'happy';
  else if (now.hour < 8) k = 'morning'; else if (now.hour >= 22) k = 'night';
  else if (G.jobs && G.jobs.current && G.jobs.current() && !r.flags.jobAsked && i >= 1) { k = 'job'; r.flags.jobAsked = 1; }
  if (k) out.push(fill(pick(CTX[k]), c, tok));
  return out;
}
function verbsFor(ses) {
  const c = ses.info, r = ses.rec, t = G.state.t, i = tierIdx(r.rel), out = [], h = ses.hang, kid = c.age < 14;
  if (ses.ended) return [{ id: 'goodbye', label: 'Say goodbye' }];
  if (h && !h.hung && t >= h.t - 15) out.push({ id: 'hang_now', label: h.kind === 'host' ? 'Share a meal' : (HANG[hangKey(h.placeId)] || HANG.home)[1], special: true });
  if (h && h.kind === 'visit' && !h.fed && foodOptions().length) out.push({ id: 'offer_food', label: 'Offer some food', special: true, picker: 'food' });
  for (const v of VERBS) {
    if (ses.light && !['chat', 'joke', 'compliment', 'ask_day', 'goodbye'].includes(v.id)) continue;
    if (i < TIERS.findIndex(x => x.id === v.minTier)) continue;
    if (v.requires === 'flirtable' && !c.flirtable) continue; if (v.requires === 'notFamily' && c.group === 'family') continue; if (v.requires === 'atHome' && !(G.housing && G.housing.isHome && G.housing.isHome())) continue;
    if (v.requires === 'hasGift' && !giftOptions().length) continue;
    if ((v.id === 'invite_hangout' || v.id === 'invite_over' || v.id === 'ask_favor') && (kid || h)) continue;
    if (v.id === 'invite_over' && !(G.housing && G.housing.current && G.housing.current())) continue;
    const cd = (r.cd[v.id] || 0) > t;
    out.push({ id: v.id, label: v.label, disabled: cd, note: cd ? 'later' : '', picker: v.id === 'give_gift' ? 'gift' : v.id === 'invite_hangout' ? 'hangout' : v.id === 'invite_over' ? 'visit' : v.id === 'ask_favor' ? 'favor' : null });
  }
  return out;
}
function giftOptions() { if (!G.inv) return []; return G.inv.items().map(s => ({ s, d: ITEM_BY_ID[s.id] })).filter(o => o.d && (GIFTABLE.includes(o.d.category) || GIFT_ALIAS[o.id] || o.s.id === 'sketchbook' || o.s.id === 'painting')).map(o => ({ id: o.s.id, label: o.d.name, sub: 'x' + o.s.qty })); }
function foodOptions() { const out = []; if (!G.inv) return out; const add = (st, src) => { for (const s of st) { const d = ITEM_BY_ID[s.id]; if (d && FOOD.includes(d.category)) out.push({ id: src + ':' + s.id, label: d.name, sub: src === 'fridge' ? 'from the fridge' : 'from your bag' }); } }; add(G.inv.items(), 'bag'); if (G.inv.fridge && G.housing && G.housing.isHome && G.housing.isHome()) add(G.inv.fridge.items(), 'fridge'); return out; }
function timeOptions(kind) {
  const t = G.state.t, d0 = today() * DAY, h = (t - d0) / 60, out = [], add = (tt, label) => { if (tt > t + 5) out.push({ id: tt, label, sub: clock12(tt) }); };
  if (h >= 8 && h < 21) add(t + (kind === 'visit' ? 20 : 45), kind === 'visit' ? 'Come over now' : 'Right now');
  if (h < 11) add(d0 + 750, 'Today at lunch'); if (h < 14.5) add(d0 + 930, 'This afternoon'); if (h < 17.5) add(d0 + 1110, 'This evening'); if (h < 19.5 && kind !== 'visit') add(d0 + 1230, 'Tonight');
  add(d0 + DAY + 750, 'Tomorrow at lunch'); add(d0 + DAY + 1110, 'Tomorrow evening');
  const sat = (5 - today() % 7 + 7) % 7; if (sat > 1) add(d0 + sat * DAY + 660, 'Saturday morning');
  return out;
}
const hangKey = pid => { if (HANG[pid]) return pid; for (const k in PLACE_ID) if (PLACE_ID[k] === pid) return k; return String(pid).startsWith('home:') ? 'home' : 'park'; };
function availability(id, t, kind, placeId) {
  const c = info(id), r = rec(id), h = (t % DAY) / 60;
  if (c.group !== 'family' && tierIdx(r.rel) < (kind === 'visit' ? 2 : 1)) return 'lowRelationship';
  if (h < 8) return 'tooEarly'; if (h >= (kind === 'visit' ? 21 : 22.5)) return 'tooLate';
  const b = block(c, t); if (b && c.work && b.place === c.work.venue && !['walk', 'stand'].includes(b.anim) && c.work.venue !== placeId) return 'atWork';
  for (const k in S.hang) { const x = S.hang[k]; if (x.npc === id && t < x.t + x.dur && t + 90 > x.t) return 'busy'; }
  return null;
}
function hangout(npc, o) { // create (or adopt) the appointment + meeting record
  const c = info(npc), dur = o.dur || 90, kind = o.kind || (G.housing && G.housing.current && G.housing.current() && G.housing.current().roomId === o.placeId ? 'visit' : HOME_ROOM[c.home] === o.placeId ? 'host' : 'out');
  let id = o.apptId; if (!id && G.planner) id = G.planner.add({ title: o.title || (kind === 'visit' ? `${c.short} comes over` : kind === 'host' ? `Visit ${c.short}` : `${(HANG[hangKey(o.placeId)] || HANG.home)[1].replace(' together', '')} with ${c.short}`), placeId: o.placeId, t: o.t, dur, kind: 'friend', withNpc: npc, data: { social: 1 } });
  if (!id) id = 'h' + (++S.seq);
  S.hang[id] = { npc, placeId: o.placeId, t: o.t, dur, kind, st: 0 };
  if (kind === 'host' && G.housing && G.housing.invite) G.housing.invite(o.placeId, Math.max(1, (o.t + dur - G.state.t) / 60));
  G.emit('social:hangout', npc, id, kind); refresh(); return id;
}
function startHang(key) {
  const h = S.hang[key]; if (!h || h.hung) return; const c = info(h.npc), rt = RT[h.npc], conf = h.kind === 'host' ? ['eat', 'Share a meal', 0, { hunger: 42, fun: 12 }] : HANG[hangKey(h.placeId)] || HANG.home;
  let cost = conf[2]; if (cost && G.money) { if (G.money.canAfford && !G.money.canAfford(cost)) { cost = 0; toast(`${c.short}: "My treat this time."`, 'good'); } else G.money.pay(cost, 'Out with ' + c.short); }
  h.hung = 1; h.st = 1; const N = G.needs, nd = Object.assign({ social: 32 }, conf[3]);
  if (rt) { rt.talking = false; rt.char.pose = STANDING(conf[0]) || (rt.seated ? 'sit' : 'talk'); rt.char.poseOpts = rt.seated && rt.char.pose !== 'sit' ? { seated: true } : null; }
  const fin = full => { if (rt && RT[h.npc] === rt) { rt.char.pose = rt.basePose; rt.char.poseOpts = rt.baseOpts; } addRel(h.npc, full ? 6 : 2); if (G.planner && G.planner.done) try { G.planner.done(key); } catch (e) { /* */ }
    const r = rec(h.npc); r.lastTalkDay = today(); r.last = { d: today(), topic: 'our ' + conf[1].replace(' together', '').toLowerCase() };
    if (full) { if (N && N.addMoodlet) try { N.addMoodlet(isFamily(h.npc) ? 'family_time' : 'good_company', 3); } catch (e) { /* unknown moodlet */ } if (G.messages) G.messages.send({ from: h.npc, name: c.name, text: pick(TEXTS.INVITE_REPLIES.npcAfterGood), delay: 60 + Math.floor(rnd() * 60) }); if (rt && RT[h.npc] === rt) bubble(rt.char, 'That was lovely.', 2600); } };
  G.startActivity({ label: `${conf[1]} (${c.short})`, anim: conf[0] === 'sit' ? 'stand' : conf[0], minutes: 60, rate: 10, tick(gm) { if (N) for (const k in nd) N.add(k, nd[k] * gm / 60); }, done: () => fin(true), cancel: () => fin(false) });
}
function gift(ses, itemId, res) {
  const c = ses.info, r = ses.rec, d = ITEM_BY_ID[itemId] || { name: itemId }, key = GIFT_ALIAS[itemId] || (d.kind === 'novel' ? 'novel' : itemId), L = c.likes || {}, D = c.dislikes || {};
  const food = FOOD.includes(d.category) || d.category === 'ingredient';
  const kind = (L.gifts || []).includes(key) ? 'loved' : (D.gifts || []).includes(key) ? 'disliked' : d.category === 'gift' || (food && (L.topics || []).includes('food')) || (d.category === 'book' && (L.topics || []).includes('books')) ? 'liked' : 'neutral';
  let delta = GIFT_REACTIONS[kind].delta; if (kind === 'liked' && d.relationship) delta = Math.max(delta, d.relationship * .8);
  const now = G.now(), b = c.birthday, bd = b && SEASON[now.season] === b.season && now.dayOfMonth === b.day; if (bd && delta > 0) delta = Math.max(delta * 2, d.birthdayRelationship || 0);
  if (G.inv) G.inv.remove(itemId, 1); r.flags['g:' + key] = kind; r.gifts = (r.gifts || []).filter(g => g[0] !== d.name).concat([[d.name, kind]]).slice(-6);
  res.ok = kind !== 'disliked'; res.them = fill(pick(GIFT_REACTIONS[kind].lines), c, { gift: d.name }) + (bd && res.ok ? ' On my birthday, too!' : ''); res.delta = Math.round(addRel(ses.id, delta) * 10) / 10; res.kind = kind;
  r.last = { d: today(), topic: 'the ' + d.name.toLowerCase() }; G.emit('social:gift', ses.id, itemId, kind); return res;
}
function favor(ses, fid, res, ok) {
  const c = ses.info, f = FAVORS.find(x => x.id === fid) || FAVORS[0], e = f.effect || {}; res.you = f.ask;
  if (!ok) { res.them = f.no; return; } res.them = f.yes;
  if (e.money && G.money) G.money.add(e.money, 'A favor from ' + c.short);
  if (e.item && G.inv) { const id = ITEM_BY_ID[e.item] ? e.item : (Object.keys(ITEM_BY_ID).find(k => ITEM_BY_ID[k].category === 'meal') || 'bread'); if (!G.inv.add(id, 1)) toast('Your bag is full.', 'bad'); }
  if (e.freeRide) G.state.flags.freeRide = (G.state.flags.freeRide || 0) + e.freeRide;
  if (e.flag) G.state.flags[e.flag] = today() + 1; if (e.jobPerformance) G.state.flags.goodWord = (G.state.flags.goodWord || 0) + e.jobPerformance;
  G.emit('social:favor', ses.id, f.id, e);
}
function act(ses, vid, arg) {
  const c = ses.info, r = ses.rec, id = ses.id, res = { verb: vid, you: '', them: '', delta: 0, ok: true }, forced = ses.lines && ses.lines[vid];
  if (vid === 'hang_now') { res.them = fill(pick(['Yes, let us!', 'I thought you would never ask.', 'Lead the way.']), c); res.end = true; ses.ended = true; const k = c && LOC[id] && LOC[id].hang; res.start = () => startHang(k); return res; }
  if (vid === 'offer_food') { const [src, item] = String(arg).split(':'), d = ITEM_BY_ID[item] || {}; (src === 'fridge' ? G.inv.fridge : G.inv).remove(item, 1); ses.hang.fed = 1; res.you = `Here, have some ${d.name || 'food'}.`; res.them = fill(pick(CTX.fed), c); res.delta = addRel(id, ['snack', 'drink'].includes(d.category) ? 2 : 5); const rt = RT[id]; if (rt) { rt.basePose = rt.seated ? 'eat' : 'eat'; rt.baseOpts = rt.seated ? { seated: true } : null; } return res; }
  const v = VERBS.find(x => x.id === vid); if (!v) return res; const t0 = G.state.t;
  res.you = fill(pick(v.playerLines), c);
  if (vid === 'goodbye') { res.them = fill(forced ? pick([].concat(forced)) : pick(ses.light ? CTX.citizenBye : v.success), c); res.end = true; ses.ended = true; return res; }
  G.advance(3 + Math.floor(rnd() * 4)); ses.n++; if (r.lastTalkDay !== today()) { r.lastTalkDay = today(); r.talksToday = 0; }
  r.cd[vid] = t0 + (v.cooldownMin || 0); for (const k in r.cd) if (r.cd[k] < t0) delete r.cd[k];
  const N = G.needs, soc = (v.needs && v.needs.social) || 0, fun = (v.needs && v.needs.fun) || 0, lm = ses.light ? .5 : 1;
  if (vid === 'give_gift') { gift(ses, arg, res); }
  else {
    let ok = rnd() < chance(v, c, r), why = null;
    if (vid === 'invite_hangout' || vid === 'invite_over') { const kind = vid === 'invite_over' ? 'visit' : 'out', a = arg || {}, pid = kind === 'visit' ? G.housing.current().roomId : PLACE_ID[a.place] || a.place; why = availability(id, a.t, kind, pid); if (!why && !ok) why = 'busy';
      if (kind === 'out') res.you = fill(`Want to go to {venue} ${dayWord(a.t)} around ${clock12(a.t)}?`, c, { venue: placeLabel(pid) });
      else res.you = `Come over to mine ${dayWord(a.t)}, around ${clock12(a.t)}?`;
      if (why) { ok = false; res.them = fill(pick(TEXTS.VISIT_REPLIES.decline[why]), c); r.cd[vid] = t0 + 90; } else { ok = true; res.them = fill(pick(rnd() < .5 ? v.success : TEXTS.VISIT_REPLIES.accept[c.group === 'family' ? 'family' : tier(id)] || v.success), c, { venue: placeLabel(pid) }); res.appt = hangout(id, { placeId: pid, t: a.t, dur: kind === 'visit' ? 120 : 90, kind }); } }
    else if (vid === 'ask_favor') favor(ses, arg, res, ok);
    res.ok = ok;
    if (!res.them) {
      if (forced) res.them = fill(pick([].concat(forced)), c);
      else if (!ok) res.them = fill(pick(v.fail), c);
      else if (ses.light) res.them = vid === 'chat' || vid === 'ask_day' ? ambientReply(c) : fill(pick(v.success), c);
      else if (vid === 'gossip') { const lk = (c.likes && c.likes.topics) || [], pool = LORE_TOPICS.filter(l => l.askedOf && l.askedOf[id]).concat(LORE_TOPICS.filter(l => l.tags.some(g => lk.includes(g)))), L = pick(pool.length && rnd() < .8 ? pool : LORE_TOPICS); res.them = (L.askedOf && L.askedOf[id]) || pick(L.lines); res.topic = L.title; }
      else { const P = npcPool(id, r); res.them = fill((vid === 'chat' || vid === 'ask_day' || vid === 'deep_talk') && P.length && rnd() < (vid === 'deep_talk' ? .35 : .6) ? pick(P) : pick(v.success), c); }
    }
    if (!why) { const dm = r.talksToday < 4 ? 1 : r.talksToday < 8 ? .5 : .25, d = ok ? v.delta.success : v.delta.fail; res.delta = addRel(id, d > 0 ? d * dm : d); }
  }
  if (N) { N.add('social', soc * (res.ok ? 1 : .5) * lm); if (res.ok && fun) N.add('fun', fun * lm); }
  if (G.skills) G.skills.addXp('charisma', ses.light ? 2 : res.ok ? 6 : 2);
  r.talksToday++; if (res.ok) { ses.good++; r.last = { d: today(), topic: res.topic ? res.topic.replace(/^The /, 'the ') : ({ joke: 'your terrible joke', deep_talk: 'starting over', compliment: 'that nice thing you said', flirt: 'you being charming' })[vid] || (r.last && r.last.topic) || 'life in the Bay' }; }
  r.memory.push({ d: today(), v: vid }); if (r.memory.length > 6) r.memory.shift();
  G.emit('social:talk', id, vid, res.ok);
  if (ses.n >= ses.max) { ses.ended = true; res.after = fill(pick(ses.atWork ? CTX.backToWork : ses.light ? CTX.citizenBye : CTX.mustGo), c); }
  return res;
}
function converse(id, o = {}) {
  const c = o.info || info(id); if (!c) return null; const r = o.rec || rec(id), rt = RT[id], ch = o.char || (rt && rt.char) || null, l = LOC[id] || {}, first = !r.met;
  if (r.lastTalkDay !== today()) r.talksToday = 0;
  const atWork = !!(rt && l.work), hang = (rt && l.hang && S.hang[l.hang]) || null;
  const ses = { id, info: c, rec: r, name: c.name, short: c.short, role: c.role, spec: (ch && ch.spec) || specs(id).base, char: ch, rt, light: !!o.light, atWork, hang, n: 0, good: 0, ended: false, lines: o.lines || null, onEnd: o.onEnd,
    max: o.max || (o.light ? 3 : atWork && !hang ? 3 : 4 + tierIdx(r.rel)) };
  ses.greeting = o.greeting ? [].concat(o.greeting).map(s => fill(s, c)) : greet(id, c, r, { first, atWork, hang });
  if (!o.light) meet(id); if (rt) rt.it.label = 'Talk to ' + c.short;
  ses.rel = () => r.rel; ses.tier = () => (o.light ? { id: 'stranger', label: 'Stranger', idx: 0, min: 0, max: 14 } : tierInfo(id));
  ses.verbs = () => verbsFor(ses); ses.act = (v, a) => act(ses, v, a); ses.gifts = giftOptions; ses.foods = foodOptions; ses.times = timeOptions;
  ses.places = () => HANG_MENU.map(m => ({ id: m[0], label: m[1], sub: placeLabel(PLACE_ID[m[0]] || m[0]) }));
  ses.favors = () => FAVORS.filter(f => tierIdx(r.rel) >= TIERS.findIndex(x => x.id === f.minTier)).map(f => ({ id: f.id, label: f.ask }));
  ses.close = () => { if (ses.closed) return; ses.closed = true; if (ses.onEnd) try { ses.onEnd(ses); } catch (e) { console.error(e); } };
  return ses;
}
function talk(id, o) { const ses = converse(id, o); if (!ses) return Promise.resolve(null); return openTalk(ses).then(() => ses); }

/* ---------- anonymous citizens ---------- */
function talkToCitizen(x) {
  const ch = x && x.char; if (!ch) return null; if (ch._czId && S.citizens[ch._czId]) return talk(ch._czId, { char: ch });
  if (!ch._czName) ch._czName = citizenName(Math.floor(Math.random() * 1e9)); const kid = (x.spec && x.spec.age === 'kid') || x.kind === 'kid';
  const z = { id: '_anon', name: ch._czName, district: x.district || 'downtown', spec: x.spec, kid }, inf = citizenInfo(z);
  ANON = { z, info: inf, rec: { rel: ch._czRel || 0, met: 1, lastTalkDay: today(), talksToday: 0, flags: {}, memory: [], cd: ch._czCd || {} } };
  const g = [pick(AMBIENT.reactions.friendly_stranger) || 'Oh, hello!']; if (!ch._czMet) g.push(`I'm ${inf.short}, by the way.`); ch._czMet = 1;
  const ses = converse('_anon', { light: true, char: ch, greeting: g });
  return openTalk(ses).then(() => {
    ch._czRel = ANON.rec.rel; ch._czCd = ANON.rec.cd; if (ch.mood !== undefined && ses.good) ch.mood = 'happy';
    if (ses.good >= 2 && !kid && rnd() < .4) {
      const ids = Object.keys(S.citizens); if (ids.length >= 12) { const low = ids.filter(k => S.citizens[k].rel < 15).sort((a, b) => S.citizens[a].rel - S.citizens[b].rel)[0]; if (!low) return ses; delete S.citizens[low]; delete LOC[low]; delete CZI[low]; delete SPECS[low]; }
      const spec = {}; for (const k in x.spec || {}) if (k[0] !== '_' && typeof x.spec[k] !== 'function') spec[k] = x.spec[k];
      const cid = 'cz' + (++S.seq); S.citizens[cid] = { id: cid, name: z.name, spec, district: z.district, x: Math.round(ch.x * 2) / 2, y: Math.round(ch.y * 2) / 2, metDay: today(), rel: 15, met: 1, lastTalkDay: today(), talksToday: ses.n, flags: { acq: 1 }, memory: [], cd: {} };
      ch._czId = cid; toast(`${inf.short} will remember you. New acquaintance!`, 'good'); G.emit('npc:met', cid); G.emit('social:citizen', cid);
    }
    return ses;
  });
}

/* ---------- invitations ---------- */
function inviteFrom(npc, o) {
  const c = info(npc); if (!c || !G.messages) return null; const dur = o.dur || 90, tok = { venue: placeLabel(o.placeId), time: clock12(o.t), day: dayWord(o.t), npc: c.short };
  return G.messages.send({ from: npc, name: c.name, text: fill(o.text || "Want to meet at {venue}, {day} at {time}?", c, tok), onReply: 'social:invite',
    appt: { title: o.title || (String(o.placeId).startsWith('home:') ? `Visit ${c.short}` : `Meet ${c.short} at ${tok.venue}`), placeId: o.placeId, t: o.t, dur, kind: 'friend', withNpc: npc, data: { social: 1 } } });
}
function onApptReply(thread, ok, apptId, msg) {
  const a = msg && msg.appt; if (!a || !a.data || !a.data.social) return; const c = info(thread); if (!c) return; const tok = { venue: placeLabel(a.placeId), time: clock12(a.t), day: dayWord(a.t) };
  if (ok) hangout(thread, { apptId: apptId || undefined, placeId: a.placeId, t: a.t, dur: a.dur, title: a.title });
  G.messages.send({ from: thread, name: c.name, text: fill(pick(ok ? TEXTS.INVITE_REPLIES.npcOnAccept : TEXTS.INVITE_REPLIES.npcOnDecline), c, tok), delay: 3 });
}
function autoInvite() {
  const t = G.state.t, now = G.now(); if (!G.messages || now.hour < 9 || now.hour > 19) return; if (!S.nextInvite) { S.nextInvite = t + 600; return; } if (t < S.nextInvite) return;
  S.nextInvite = t + DAY * (1 + rnd() * 1.5); const busy = {}; for (const k in S.hang) busy[S.hang[k].npc] = 1; const opts = [];
  const elig = id => { const c = info(id), r = rec(id); return r.met && !busy[id] && c.age >= 14; };
  for (const e of TEXTS.FRIEND_INVITES) {
    const ids = e.from === 'any-friend' ? allIds().filter(id => !isFamily(id) && tierIdx(rel(id)) >= 2) : e.from === 'any-close' ? allIds().filter(id => !isFamily(id) && tierIdx(rel(id)) >= 3) : e.from === 'any-family' ? ['jules', 'theo', 'nana', 'dez'] : [e.from];
    for (const id of ids) if (info(id) && elig(id) && tierIdx(rel(id)) >= TIERS.findIndex(x => x.id === e.minTier)) opts.push([e, id]);
  }
  if (!opts.length) return; const [e, id] = pick(opts), list = TEXTS.VENUE_TYPES[e.venueType], v = list ? pick(list) : e.venueType, d0 = today() * DAY;
  const m = { morning: 570, lunch: 750, afternoon: 900, evening: 1110, night: 1230, weekend: 630 }[e.when] || 1110; let tt = d0 + m;
  if (e.when === 'weekend') { let k = 0; while (((today() + k) % 7 < 5 || d0 + k * DAY + m < t + 120) && k < 8) k++; tt = d0 + k * DAY + m; } else if (tt < t + 100) tt += DAY;
  const c = info(id), home = HOME_ROOM[c.home], useHome = home && isFamily(id) && e.from === 'any-family' && rnd() < .5;
  inviteFrom(id, useHome ? { placeId: home, t: d0 + (d0 + 1110 > t + 100 ? 0 : DAY) + 1110, dur: 120, text: 'Dinner at ours {day}? {time}. There is always too much food.' } : { placeId: PLACE_ID[v] || v, t: tt, text: e.text });
}
function invite(npc, a) { // phone planner: ask an NPC along
  const c = info(npc); if (!c || !a) return false; const home = G.housing && G.housing.current && G.housing.current(), kind = home && home.roomId === a.placeId ? 'visit' : 'out';
  if (G.messages) G.messages.sendMine(npc, `${a.title || 'Hang out'}${a.placeId ? ' at ' + placeLabel(a.placeId) : ''}, ${dayWord(a.t)} at ${clock12(a.t)}. Want to come?`);
  let why = a.placeId ? availability(npc, a.t, kind, a.placeId) : 'busy'; if (!why && rnd() > .55 + .15 * tierIdx(rel(npc))) why = 'busy';
  if (G.messages) G.messages.send({ from: npc, name: c.name, text: fill(pick(why ? TEXTS.VISIT_REPLIES.decline[why] : TEXTS.VISIT_REPLIES.accept[isFamily(npc) ? 'family' : tier(npc)] || TEXTS.INVITE_REPLIES.npcOnAccept), c, { venue: placeLabel(a.placeId), time: clock12(a.t) }), delay: 6 });
  if (why) return false; hangout(npc, { apptId: a.apptId, placeId: a.placeId, t: a.t, dur: a.dur || 90, kind }); if (G.planner && G.planner.update) try { G.planner.update(a.apptId, { withNpc: npc }); } catch (e) { /* */ } return true;
}
function call(id) {
  const c = info(id), r = rec(id); if (!c) return false; const t = G.state.t, h = G.now().hour, asleep = h < 7 || h >= 23 || (LOC[id] && LOC[id].work);
  if (asleep || (r.cd.call || 0) > t) { toast(asleep ? `${c.short} did not pick up.` : `${c.short} is busy. Try again later.`); return false; }
  r.cd.call = t + 180; toast(`${c.short}: "${fill(pick(CTX.phone), c)}"`);
  G.startActivity({ label: 'On the phone with ' + c.short, anim: 'phone', minutes: 12, rate: 3, done() { if (G.needs) G.needs.add('social', 14); if (G.skills) G.skills.addXp('charisma', 3); addRel(id, r.talksToday < 6 ? 1.5 : .5); r.lastTalkDay = today(); r.talksToday++; const P = npcPool(id, r); toast(`${c.short}: "${fill(P.length ? pick(P) : 'Good to catch up. Talk soon!', c)}"`, 'good', 4200); } });
  return true;
}
function onText(id) {
  const c = info(id), r = rec(id); if (!c || !G.messages) return; const t = G.state.t, g = isFamily(id) ? 'family' : tierIdx(r.rel) >= 3 ? 'close' : 'friend', P = npcPool(id, r);
  G.messages.send({ from: id, name: c.name, text: fill(rnd() < .5 && P.length ? pick(P) : pick(TEXTS.CHECK_INS[g]), c), delay: 5 + Math.floor(rnd() * 12) });
  if ((r.cd.text || 0) <= t) { r.cd.text = t + 720; addRel(id, 1); r.lastTalkDay = today(); if (G.needs) G.needs.add('social', 4); }
}
function onMissed(a) { const h = S.hang[a.id]; if (!h) return; const c = info(h.npc); if (!h.hung) { addRel(h.npc, -3); if (G.messages) G.messages.send({ from: h.npc, name: c.name, text: fill(pick(TEXTS.INVITE_REPLIES.npcStoodUp), c, { venue: placeLabel(h.placeId), time: clock12(h.t) }), delay: 5 }); } delete S.hang[a.id]; refresh(); }
function onDone(a) { const h = S.hang[a.id]; if (h && !h.hung) { h.hung = 1; addRel(h.npc, 2); } }

/* ---------- daily ---------- */
function onDay(d) {
  const now = G.now();
  for (const id of allIds()) { const r = rec(id), c = info(id); if (!r.met) continue;
    if (r.lastTalkDay >= 0 && d - r.lastTalkDay > 4 && r.rel > (isFamily(id) ? 40 : 15)) addRel(id, -1);
    const b = c.birthday; if (b && b.season === SEASON[now.season] && b.day === now.dayOfMonth && tierIdx(r.rel) >= 1 && G.phone && G.phone.notify) G.phone.notify({ app: 'messages', title: 'Birthday', text: `It is ${c.short}'s birthday today! A little gift goes a long way.`, icon: 'ui.heart', face: id }); }
  if (G.messages && rnd() < .35) { const fr = allIds().filter(id => rec(id).met && info(id).age >= 14 && (isFamily(id) || tierIdx(rel(id)) >= 2)); if (fr.length) { const id = pick(fr), c = info(id); G.messages.send({ from: id, name: c.name, text: fill(pick(TEXTS.CHECK_INS[isFamily(id) ? 'family' : tierIdx(rel(id)) >= 3 ? 'close' : 'friend']), c), delay: 540 + Math.floor(rnd() * 500) }); } }
}

/* ---------- public ---------- */
function npc(id) {
  const c = info(id); if (!c) return null; const r = rec(id), ti = tierInfo(id), i = ti.idx, fam = ti.family, facts = [], L = c.likes || {}, D = c.dislikes || {};
  if (r.met) {
    if (c.work && c.work.job) facts.push(`${c.work.job}${String(c.work.venue).startsWith('spot:') ? '' : ' at ' + venueName(c.work.venue)}`);
    if (i >= 1 && L.topics && L.topics.length) facts.push('Likes talking about ' + (i >= 2 ? L.topics.join(', ') : L.topics[0]));
    if (i >= 2 && D.topics && D.topics.length) facts.push('Not keen on talk of ' + D.topics.join(', '));
    if (i >= 3 && L.gifts && L.gifts.length) facts.push('Loves: ' + L.gifts.map(g => g.replace(/_/g, ' ')).join(', '));
    for (const g of r.gifts || []) facts.push(`${g[1] === 'loved' ? 'Loved' : g[1] === 'liked' ? 'Liked' : g[1] === 'disliked' ? 'Did not like' : 'Was fine with'} your gift: ${g[0]}`);
    if (i >= 2 && c.personality) facts.push('Personality: ' + c.personality.join(', '));
  }
  const out = { id, name: c.name, short: c.short, role: c.role, group: c.group, district: c.district, home: c.home, age: c.age, pronouns: c.pronouns, citizen: !!c.citizen, spec: specs(id).base, rel: r.rel, tier: ti.id, tierLabel: ti.label, met: !!r.met, knownFacts: facts, where: (fam || i >= 2) ? whereIs(id) : null };
  if (r.met && (i >= 1 || fam)) out.bio = c.bio; if (c.birthday && (i >= 2 || fam)) out.birthday = c.birthday;
  return out;
}
function place(id, placeId, o = {}) {
  if (!info(id)) return; if (placeId === undefined) delete S.over[id]; else { const e = S.over[id] = { placeId: placeId || null }; if (o.until) e.until = o.until; else if (o.minutes) e.until = G.state.t + o.minutes; if (o.anim) e.anim = o.anim; if (o.x !== undefined) { e.x = o.x; e.y = o.y; if (o.scene) e.scene = o.scene; } }
  const l = computeLoc(id, G.state.t); LOC[id] = l; if (RT[id]) drop(RT[id]); sync();
}
function sayAs(id, lines) { const c = info(id), rt = RT[id]; if (rt) { rt.char.stop(); rt.char.faceTo(G.player.x, G.player.y); G.player.faceTo(rt.char.x, rt.char.y); } return kitSay([].concat(lines).map(t => ({ who: c ? c.short : '', text: fill(t, c) }))); }
function discount(venueId) { let d = 0; for (const c of CAST) if (c.work && c.work.venue === venueId && rec(c.id).met) { const i = tierIdx(rel(c.id)); d = Math.max(d, i >= 3 ? .1 : i >= 2 ? .05 : 0); } return d; }

export function init() {
  S = G.defineState('social', fresh);
  const fix = () => { S = G.state.social; const f = fresh(); for (const k in f) if (S[k] === undefined) S[k] = f[k]; for (const id in START) rec(id); };
  fix();
  G.social = { npc, rel, addRel, setRel: (id, v) => addRel(id, v - rel(id), { raw: true }), tier, tierInfo, known: () => allIds().filter(id => rec(id).met), meet, isFamily, whereIs, present: id => !!RT[id], char: id => (RT[id] ? RT[id].char : null),
    staffAt: v => CAST.filter(c => c.work && c.work.venue === v && LOC[c.id] && LOC[c.id].work).map(c => c.id), boss: j => (JOBS[j] ? JOBS[j].boss : null), discount, talk, converse, talkToCitizen, place, sayAs, invite, inviteFrom, hangout, call, onText, onMissed: true, refresh: () => refresh(true),
    schedule: (id, t) => { const c = info(id), b = c && block(c, t === undefined ? G.state.t : t); return b ? { place: b.place, anim: b.anim } : null; }, _rt: () => RT };
  G.on('minutes', (d, t) => { const q = Math.floor(t / 15); if (q !== lastQ) { lastQ = q; refresh(); } });
  G.on('hour', () => autoInvite()); G.on('day', onDay);
  G.on('scene', () => { for (const id in RT) drop(RT[id]); for (const rt of GONE.slice()) drop(rt); if (!Object.keys(LOC).length) refresh(); else sync(); });
  G.on('load', () => { for (const id in RT) drop(RT[id]); for (const rt of GONE.slice()) drop(rt); fix(); LOC = {}; CZI = {}; SPECS = {}; lastQ = -1; refresh(true); });
  G.on('home:move', () => refresh(true)); G.on('places:built', () => refresh(true));
  G.on('msg:appt', onApptReply); G.on('appt:missed', onMissed); G.on('appt:done', onDone);
  G.on('appt:remove', a => { if (a && S.hang[a.id]) { delete S.hang[a.id]; refresh(); } });
  G.on('cooked', () => { for (const k in S.hang) { const h = S.hang[k], rt = RT[h.npc]; if (h.kind === 'visit' && rt && !h.cooked) { h.cooked = 1; addRel(h.npc, 4); bubble(rt.char, fill(vpick(CTX.cooked), info(h.npc)), 3400); } } });
  G.addSystem({ name: 'social', update });
  if (G.scene) refresh(true);
}
