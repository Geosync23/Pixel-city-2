// Opportunities: small optional things that come up from needs, people, places, events, work, weather, the time of year and the story.
// (Never "missions" or "quests" in anything the player reads.) Pool + tuning: src/data/opportunities*.js. App: src/ui/phone_opps.js.
//
// LIFECYCLE   offered -> accepted (or declined / quietly ignored when its time passes) -> done (reward) or expired (no penalty, one kind line).
//   Doing the thing counts even if you never tapped "accept". Accepting adds it to the Goals widget ("Opportunities"), points the guide arrow at
//   its place (G.navGoals leads on to the person / counter inside) and, when it has a time, adds a Planner appointment.
// PACING      a few a day (TUNE.perDay), spaced out (gap + jitter), none at night / asleep / on shift / in a cutscene, at most TUNE.maxOffered waiting,
//   varied sources, and NO REPEATS until the pool cycles (state `used`); needs / weather / event rows are weighted up while they are true.
//
// State G.state.opps = { cur: [{ id, st: 0 offered | 1 accepted, t0, until, from?, at, pos?, npc?, p, appt?, c? (a custom row, JSON) }], used: { id: day },
//   once: { id: 1 }, log: [{ id, title, src, r: 'done' | 'expired' | 'declined' | 'ignored' | 'dropped', t }], d: { day, n }, next, last: [src, src], seq, cyc,
//   n: { offered, accepted, done, expired, src: { src: done } }, first: 0 | 1 }
//
// G.opps
//   list() -> [{ id, st, title, text, src, srcName, until, from, placeId, placeName, reward, rewardText, def }]   (offered + accepted, newest first)
//   get(id)      log() -> newest-first history      stats()      pool -> the rows      TUNE
//   offer(rowOrId, { quiet?, force? }) -> bool     a story step / another system offers one: a pool id, or a row object in the pool's format
//        (JSON only; `emit: 'event:name'` is emitted when it is done, so a story beat can wait for it; `text`, `title`, `at`, `do`, `reward`...)
//   accept(id, { go? })   decline(id)   drop(id) (let an accepted one go)   go(id) (guide arrow / trip chooser)   complete(id) (debug + scripted)
//   offerNow(id?)  debug: offer the best candidate (or that id) right now, ignoring the pacing       eligible() -> [ids] that could be offered now
// Events: 'opp:offer'(id, row), 'opp:accept'(id), 'opp:done'(id, row), 'opp:end'(id, how), 'opps:change'.
import { G } from '../core/game.js';
import { POOL, POOL_BY_ID, TUNE, SOURCES, STAMPS } from '../data/opportunities.js';
import { ITEM_BY_ID } from '../data/items.js';
import { ROOMS } from '../scenes/interior.js';
import { EXPERIENCES, STAMP_GROUPS } from './_guide_data.js';
import { hash2 } from '../engine/raster.js';
import { toast, say } from '../ui/kit.js';
import { openState } from '../ui/phone_util.js';
import '../art/icons/needs_extra.js';

export const order = 132;   /* after goals UI (130) and the guide; the navgoals resolver is attached on 'ready' */
const DAY = 1440, GROUP = 'Opportunities';
if (!STAMP_GROUPS.includes(GROUP)) STAMP_GROUPS.push(GROUP);
for (const s of STAMPS) if (!EXPERIENCES.some(e => e.id === s.id)) EXPERIENCES.push({ id: s.id, title: s.title, group: GROUP, glyph: s.glyph || 'stamp', blurb: s.blurb });

const safe = (f, d) => { try { const v = f(); return v === undefined || v === null ? d : v; } catch (e) { return d; } };
let S = null, useIts = new Map(), evOff = new Map();
const fresh = () => ({ cur: [], used: {}, once: {}, log: [], d: { day: -1, n: 0 }, next: 0, last: [], seq: 0, cyc: 0, n: { offered: 0, accepted: 0, done: 0, expired: 0, src: {} }, first: 0, day0: -1 });
const now = () => G.state.t, day = () => Math.floor(G.state.t / DAY);
const defOf = c => (c && (c.c || POOL_BY_ID[c.id])) || null;
const place = id => safe(() => G.places.get(id), null);
const homeId = () => safe(() => G.state.home.id, null);
const isHome = () => safe(() => G.housing.isHome(), false);
const roomOf = at => { if (!at) return null; if (at === 'home') return homeId() ? 'home:' + homeId() : null; const p = place(at); return (p && p.roomId) || (ROOMS.has(at) ? at : null); };
const rootOf = rid => safe(() => G.navGoals.rootOf(rid), rid);
const curRoom = () => (G.scene && /^int:/.test(G.scene.id) ? String(G.scene.id).slice(4) : null);
const npcId = id => (id === 'boss' ? safe(() => G.social.boss(G.jobs.current().id), null) : id);
const npcName = id => safe(() => G.social.npc(id).short || G.social.npc(id).name, null) || id;
const clockOf = t => { const m = ((Math.round(t) % DAY) + DAY) % DAY; return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
const WD = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const whenText = t => { const d = Math.floor(t / DAY), d0 = day(); return (d === d0 ? 'today' : d === d0 + 1 ? 'tomorrow' : WD[((d % 7) + 7) % 7]) + ' ' + clockOf(t); };
const inRange = (v, r) => (r[0] <= r[1] ? v >= r[0] && v < r[1] : v >= r[0] || v < r[1]);
const cityPos = () => (G.scene && G.scene.id === 'city' ? G.player : safe(() => G.state.phone.cityPos, null) || G.player);
const dist = p => { const c = cityPos(); return Math.hypot(p.x - c.x, p.y - c.y); };

/* ---------- where it leads ---------- */
function whereNpc(id) {
  const w = safe(() => G.social.whereIs(id), null); if (!w) return null;
  if (w.placeId && place(w.placeId)) return { at: w.placeId };
  if (isFinite(w.x) && isFinite(w.y) && (!w.sceneId || w.sceneId === 'city')) return { pos: { x: w.x, y: w.y, name: npcName(id) } };
  return null;
}
function target(def) {
  const at = def.at; if (!at) return { at: null };
  if (at === 'home') return homeId() ? { at: 'home' } : null;
  if (at[0] === '@') { const nm = at.slice(1), L = safe(() => G.places.list(), []), p = L.find(q => q.name === nm && q.kind !== 'landmark') || L.find(q => q.name === nm); return p ? { at: p.id } : null; }
  if (at.startsWith('npc:')) { const id = npcId(at.slice(4)); if (!id) return null; const w = whereNpc(id); return w ? Object.assign({ npc: id }, w) : null; }
  if (at === 'green') { const g = safe(() => G.needsExtra.greens(), []).slice().sort((a, b) => dist(a) - dist(b))[0]; return g ? { at: g.id } : null; }
  if (at === 'new') { const p = safe(() => G.places.list(), []).filter(q => q && isFinite(q.x) && ['venue', 'spot', 'stall'].includes(q.kind) && !/^lobby:/.test(q.id) && !safe(() => G.places.known(q.id), true) && openState(q).open !== false).sort((a, b) => dist(a) - dist(b))[0]; return p ? { at: p.id } : null; }
  if (at.startsWith('near:')) { const r = safe(() => G.nav.find(at.slice(5), 4), []).find(q => typeof q.id === 'string' && !q.home && !q.friend && q.open !== false); return r ? { at: r.id } : null; }
  if (at === 'supplies') { const s = safe(() => G.supplies.shops()[0], null); return s ? { at: s.id } : null; }
  if (at === 'event') { const want = def.when && def.when.event, e = safe(() => G.planner.eventsOn(day()), []).find(x => (!want || (x.data && x.data.eventId === want)) && x.placeId && place(x.placeId)); return e ? { at: e.placeId, evt: e.title, from: e.t, until: e.t + e.dur } : null; }
  return place(at) ? { at } : null;
}
function here(c) {
  if (!c.at && !c.pos) return true;
  if (c.at === 'home') return isHome();
  const p = c.at ? place(c.at) : c.pos; if (!p) return false; const rid = c.at ? roomOf(c.at) : null, cr = curRoom(), d = defOf(c);
  if (rid) return !!cr && (cr === rid || rootOf(cr) === rootOf(rid));
  return !!G.scene && G.scene.id === 'city' && Math.hypot(p.x - G.player.x, p.y - G.player.y) <= ((d && d.do && d.do.r) || TUNE.r);
}

/* ---------- conditions ---------- */
function okWhen(def, tgt) {
  const w = def.when || {}, n = G.now(), N = G.needs;
  if (w.minDay !== undefined && day() - (S.day0 < 0 ? day() : S.day0) < w.minDay) return false;
  if (w.h && !inRange(n.hf, w.h)) return false;
  if (def.until !== undefined && n.hf >= def.until - 0.5) return false;
  if (w.wd && !w.wd.includes(n.weekday)) return false;
  if (w.season && !w.season.includes(n.season)) return false;
  if (w.dom && !(n.dayOfMonth >= w.dom[0] && n.dayOfMonth <= w.dom[1])) return false;
  if (w.wx || w.notWx) { const k = safe(() => G.weather.current().kind, null) || G.state.weather || 'clear'; if (w.wx && !w.wx.includes(k)) return false; if (w.notWx && w.notWx.includes(k)) return false; }
  if (w.need) for (const k in w.need) { const v = N ? N.get(k) : 50; if (v < w.need[k][0] || v > w.need[k][1]) return false; }
  if (w.clean) { const v = safe(() => G.supplies.clean(), 100); if (v < w.clean[0] || v > w.clean[1]) return false; }
  if (w.sup) for (const k in w.sup) if (safe(() => G.supplies.left(k), 0) < w.sup[k]) return false;
  if (w.supLow && !safe(() => G.supplies.low().length, 0)) return false;
  if (w.has && !safe(() => G.inv.count(w.has), 0)) return false;
  if (w.lacks && safe(() => G.inv.count(w.lacks), 0)) return false;
  if (w.homeTag && !safe(() => G.housing.items().some(it => (ITEM_BY_ID[it.itemId] || {}).tag === w.homeTag), false)) return false;
  if (w.job !== undefined && !!safe(() => G.jobs.current(), null) !== !!w.job) return false;
  if (w.ml && !safe(() => G.needs.hasMoodlet(w.ml), false)) return false;
  if (w.flag && !(G.state.flags && G.state.flags[w.flag])) return false;
  if (w.event && !safe(() => G.planner.eventsOn(day()), []).some(e => e.data && e.data.eventId === w.event && now() < e.t + e.dur - 60)) return false;
  if (w.eventAny && !safe(() => G.planner.eventsOn(day()), []).some(e => e.placeId && place(e.placeId) && now() < e.t + e.dur - 60 && now() > e.t - 120)) return false;
  if (!tgt) return true;
  if (w.open && tgt.at && tgt.at !== 'home') { const p = place(tgt.at); if (p && openState(p).open === false) return false; if (p && openState(p, now() + 90).open === false) return false; }
  if (w.npcOut) { const id = npcId(w.npcOut), q = id && whereNpc(id); if (!q) return false; if (!String(def.at || '').startsWith('npc:') && q.at !== tgt.at) return false; }
  return true;
}
function eligible1(def) {
  if (!def || S.cur.some(c => c.id === def.id) || S.once[def.id]) return null;
  if (!okWhen(def, null)) return null;
  const tgt = target(def); if (!tgt) return null;
  if (!okWhen(def, tgt)) return null;
  /* a `bring` row needs the thing to be buyable somewhere, and a paid one must be affordable */
  const d = def.do || {}; if (d.pay && safe(() => G.money.get(), 0) < d.pay + 5) return null;
  return tgt;
}

/* ---------- offering ---------- */
function deadline(def, tgt) {
  const t = now(), d0 = day() * DAY;
  if (def.appt) { const a = def.appt, n = G.now(); let dd = day(); if (a.wd !== undefined) { dd += ((a.wd - n.weekday) % 7 + 7) % 7; if (dd === day() && n.hf >= a.h) dd += 7; } else if (n.hf >= a.h + (a.dur || 60) / 60 - .5) dd += 1; const from = dd * DAY + a.h * 60; return { from, until: from + (a.dur || 60) }; }
  if (tgt && tgt.until) return { from: undefined, until: tgt.until };
  if (def.until !== undefined) return { until: d0 + def.until * 60 };
  if (def.ttl === 0) return { until: t + TUNE.acceptedDays * DAY };
  return { until: Math.ceil((t + (def.ttl || TUNE.ttl) * 60) / 30) * 30 };   /* a round clock time ("until 22:30") reads kinder than 22:01 */
}
function doOffer(def, tgt, o = {}) {
  const dl = deadline(def, tgt), c = { id: def.id, st: 0, t0: Math.round(now()), until: Math.round(dl.until), at: tgt.at || null, p: 0 };
  if (dl.from !== undefined) c.from = Math.round(dl.from); if (tgt.pos) c.pos = tgt.pos; if (tgt.npc) c.npc = tgt.npc; if (o.custom) c.c = def;
  S.cur.push(c); S.n.offered++; if (!def.repeat) S.used[def.id] = day(); if (def.once) S.once[def.id] = 1; S.last.push(def.src); if (S.last.length > 2) S.last.shift();
  ensureEvents(def);
  G.emit('opp:offer', def.id, def); G.emit('opps:change');
  if (!o.quiet) safe(() => G.phone.notify({ app: 'opps', title: 'Opportunity', text: def.title + '. ' + def.text, icon: 'ui.opp', priority: 'normal', data: { opp: def.id } }));
  return true;
}
function weightOf(def) {
  let w = def.wt || 1; const wn = def.when || {};
  if (S.last.includes(def.src)) w *= TUNE.lastSrcMult;
  if (wn.need || wn.clean || wn.supLow) w *= TUNE.needBoost;
  if (wn.wx || wn.event || wn.eventAny || wn.wd || wn.dom) w *= TUNE.timelyBoost;
  return w;
}
function candidates() {
  const out = [];
  for (const def of POOL) { if (S.used[def.id] !== undefined && !def.repeat) continue; if (def.first && S.first) continue; const tgt = eligible1(def); if (tgt) out.push({ def, tgt, w: weightOf(def) }); }
  return out;
}
function pick() {
  if (!S.first) { const f = POOL.find(d => d.first), tgt = f && eligible1(f); S.first = 1; if (tgt) return { def: f, tgt }; }
  let L = candidates();
  if (!L.length) {
    /* nothing unused fits: once enough of the pool has had its turn, start a new cycle (recent ones still rest) */
    const usedN = Object.keys(S.used).length; if (usedN < POOL.length * TUNE.cycleAt) return null;
    const d = day(); for (const id in S.used) if (S.used[id] <= d - TUNE.cooldownDays) delete S.used[id]; S.cyc++;
    L = candidates(); if (!L.length) return null;
  }
  let tot = 0; for (const c of L) tot += c.w; let r = hash2(S.seq++, day(), 77) * tot;
  for (const c of L) { r -= c.w; if (r <= 0) return c; }
  return L[L.length - 1];
}
function canOfferNow() {
  if (!S) return false; const F = G.state.flags || {};
  if (!(F.introDone || (G.query && G.query.has('opps')))) return false;
  if (G.cutscene || safe(() => G.needs.sleeping, false) || safe(() => G.jobs.onShift(), false)) return false;
  const n = G.now(); if (inRange(n.hf, TUNE.quiet)) return false;
  if (S.cur.filter(c => c.st === 0).length >= TUNE.maxOffered || S.cur.length >= TUNE.maxOpen) return false;
  return true;
}
function maybeOffer() {
  if (now() < S.next || !canOfferNow()) return false;
  const d = day(); if (S.d.day !== d) S.d = { day: d, n: 0 }; if (S.day0 < 0) S.day0 = d;
  if (S.d.n >= (d === S.day0 ? TUNE.firstDay : TUNE.perDay - (hash2(d, 5, 91) < TUNE.lightDayShare ? 1 : 0))) return false;   /* some days are a little quieter */
  const c = pick(); if (!c) { S.next = now() + 45; return false; }
  S.d.n++; S.next = now() + TUNE.gap + Math.floor(hash2(S.seq, d, 13) * TUNE.jitter);
  return doOffer(c.def, c.tgt);
}
/** a story step / another system offers one */
function offer(rowOrId, o = {}) {
  if (!S) return false; const custom = typeof rowOrId === 'object', def = custom ? Object.assign({ src: 'story', when: {}, reward: {}, do: { type: 'visit', stay: 2 } }, rowOrId) : POOL_BY_ID[rowOrId];
  if (!def || !def.id || S.cur.some(c => c.id === def.id)) return false;
  const tgt = o.force ? target(def) : eligible1(def); if (!tgt) return false;
  if (custom && POOL_BY_ID[def.id]) return false;
  return doOffer(def, tgt, { quiet: o.quiet, custom });
}

/* ---------- accepting, ending ---------- */
const find = id => S.cur.find(c => c.id === id) || null;
const gid = id => 'opp:' + id;
const placeIdOf = c => (c.at === 'home' ? (homeId() ? 'home:' + homeId() : null) : c.at);
function hintOf(c) { const def = defOf(c); return def.text + (c.from ? ` (${whenText(c.from)} to ${clockOf(c.until)})` : ` (until ${whenText(c.until)})`); }
function accept(id, o = {}) {
  const c = find(id), def = defOf(c); if (!c || !def) return false; if (c.st === 1) { if (o.go) go(id); return true; }
  c.st = 1; S.n.accepted++;
  if (def.at && String(def.at).startsWith('npc:')) { const w = whereNpc(c.npc); if (w) { c.at = w.at || null; if (w.pos) c.pos = w.pos; else delete c.pos; } }
  safe(() => G.goals.add({ id: gid(id), text: def.title, group: 'opportunity', hint: hintOf(c), placeId: placeIdOf(c) || undefined, doneText: 'Opportunity done: ' + def.title }));
  if (def.appt && c.from && G.planner) c.appt = safe(() => G.planner.add({ title: def.title, placeId: placeIdOf(c), t: c.from, dur: c.until - c.from, kind: 'personal', data: { opp: id } }), null);
  G.emit('opp:accept', id); G.emit('opps:change'); syncUse();
  if (o.go !== false && !c.from) go(id, true);
  return true;
}
/** point the guide arrow at it (quiet = just the arrow; otherwise the "how will you get there?" chooser when the place is far) */
function go(id, quiet) {
  const c = find(id); if (!c || !G.phone) return false; const pid = placeIdOf(c), tgt = pid || (c.pos ? { x: c.pos.x, y: c.pos.y, name: c.pos.name } : null); if (!tgt) return false;
  if (c.at === 'home' && isHome()) return false;
  safe(() => G.navGoals.select({ goal: gid(id) }));
  const p = pid ? place(pid) : c.pos, far = p && dist(p) > 70;
  if (!quiet && far && G.phone.routeTo && safe(() => G.phone.routeTo(tgt), false)) return true;
  return safe(() => { G.phone.setWaypoint(tgt); return true; }, false);
}
function logIt(c, r) { const def = defOf(c) || {}; S.log.unshift({ id: c.id, title: def.title || c.id, src: def.src || 'story', r, t: Math.round(now()) }); if (S.log.length > 40) S.log.length = 40; }
function end(c, how) {
  const i = S.cur.indexOf(c); if (i < 0) return; S.cur.splice(i, 1); logIt(c, how);
  if (how !== 'done') { safe(() => G.goals.remove(gid(c.id))); if (c.appt) safe(() => G.planner.remove(c.appt)); }
  const w = safe(() => G.phone.waypoint(), null), sel = safe(() => G.state.navgoals.sel, null);
  if (w && sel && sel.goal === gid(c.id)) { safe(() => G.phone.setWaypoint(null)); safe(() => G.navGoals.select(null)); }
  dropUse(c.id); G.emit('opp:end', c.id, how); G.emit('opps:change');
}
const decline = id => { const c = find(id); if (!c || c.st !== 0) return false; end(c, 'declined'); return true; };
const drop = id => { const c = find(id); if (!c) return false; end(c, c.st ? 'dropped' : 'declined'); return true; };
function rewardText(def) {
  const r = def.reward || {}, out = []; if (r.money) out.push('+' + safe(() => G.money.fmt(r.money), '$' + r.money));
  for (const k in r.needs || {}) { const d = (G.needs && G.needs.defs.find(x => x.id === k)) || { name: k }; out.push('+' + d.name); }
  for (const k in r.rel || {}) out.push(npcName(npcId(k)) + ' will like it');
  for (const k in r.xp || {}) { const d = safe(() => G.skills.defs.find(x => x.id === k), null) || { name: k }; out.push(d.name + ' xp'); }
  if (r.item) out.push((ITEM_BY_ID[r.item[0]] || { name: r.item[0] }).name); if (r.stamp) out.push('a stamp'); if (r.moodlet && !out.length) out.push('a good feeling');
  return out.join(' · ');
}
function give(def) {
  const r = def.reward || {}, k1 = TUNE.rewardScale;
  if (r.money) safe(() => G.money.add(Math.round(r.money * k1), 'Opportunity: ' + def.title));
  for (const k in r.needs || {}) safe(() => G.needs.add(k, r.needs[k] * k1));
  for (const k in r.rel || {}) { const id = npcId(k); if (id) safe(() => G.social.addRel(id, r.rel[k])); }
  for (const k in r.xp || {}) safe(() => G.skills.addXp(k, r.xp[k]));
  if (r.item) safe(() => G.inv.add(r.item[0], r.item[1] || 1, { silent: true }));
  if (r.moodlet) safe(() => G.needs.addMoodlet(r.moodlet));
  if (r.stamp) safe(() => G.guide.stamp(r.stamp));
}
function complete(id) {
  const c = find(id), def = defOf(c); if (!c || !def) return false;
  if (c.st === 0) S.n.accepted++;
  S.n.done++; S.n.src[def.src] = (S.n.src[def.src] || 0) + 1;
  give(def);
  if (c.appt) safe(() => G.planner.done(c.appt));
  const had = safe(() => G.goals.get(gid(id)), null);
  end(c, 'done');
  if (had) safe(() => G.goals.complete(gid(id))); else toast('Opportunity done: ' + def.title, 'good', 3600);
  const rt = rewardText(def); if (rt) setTimeout(() => toast(rt, 'good', 3600), had ? 900 : 500);
  for (const s of STAMPS) { if (!s.count) continue; const n = s.src ? S.n.src[s.src] || 0 : S.n.done; if (n >= s.count) safe(() => G.guide.stamp(s.id)); }
  if (S.n.done >= 1) safe(() => G.guide.stamp('x:opp_first'));
  G.emit('opp:done', id, def); if (def.emit) G.emit(def.emit, id);
  return true;
}

/* ---------- noticing that it was done ---------- */
const active = c => !c.from || now() >= c.from;
const matchStr = (spec, v) => { if (Array.isArray(spec)) return spec.some(s => matchStr(s, v)); if (typeof spec !== 'string') return false; return spec.startsWith('re:') ? new RegExp(spec.slice(3), 'i').test(v) : spec === v; };
function matchItem(spec, itemId) { if (spec === 'any') return true; if (typeof spec === 'string' && spec.startsWith('cat:')) return (ITEM_BY_ID[itemId] || {}).category === spec.slice(4); return matchStr(spec, itemId); }
function each(fn) { for (const c of S.cur.slice()) { const def = defOf(c); if (!def) { end(c, 'ignored'); continue; } if (!active(c)) continue; if (safe(() => fn(c, def, def.do || {}), false)) complete(c.id); } }
function onAct(id, r) { each((c, def, d) => d.type === 'act' && matchStr(d.act, id) && (d.min ? r && r.minutes >= d.min : !r || r.completed !== false || r.minutes >= 5) && (!d.here || here(c))); }
function onBuy(itemId, qty, venueId) { each((c, def, d) => d.type === 'buy' && matchItem(d.item, itemId) && (!d.here || venueId === c.at || here(c))); }
function onTalk(id) { each((c, def, d) => d.type === 'talk' && npcId(d.npc) === id); }
function onEv(name, args) { each((c, def, d) => d.type === 'ev' && [].concat(d.ev).includes(name) && (d.a0 === undefined || args[0] === d.a0 || (args[0] && typeof args[0] === 'object' && args[0].kind === d.a0)) && (!d.here || here(c))); }
function ensureEvents(def) { const d = def.do || {}; if (d.type !== 'ev') return; for (const name of [].concat(d.ev)) if (!evOff.has(name)) evOff.set(name, G.on(name, (...a) => { if (S) onEv(name, a); })); }

/* ---------- 'use' rows: a button on the person / counter / spot ---------- */
const COUNTER_RE = /^(Order|Shop|Front desk|Reception|Box office|Information desk|Information|Front office|Host stand|Tickets|Counter|Browse)\b/, COUNTER_TAGS = ['till', 'checkout', 'front_desk', 'reception', 'counter', 'bar_counter', 'host_stand', 'host'];
function dropUse(id) { const u = useIts.get(id); if (!u) return; const a = u.scene && u.scene.interactables, i = a ? a.indexOf(u.it) : -1; if (i >= 0) a.splice(i, 1); useIts.delete(id); }
function locate(c, d) {
  const sc = G.scene, npc = npcId(d.npc || c.npc);
  if (npc) { const ch = safe(() => G.social.char(npc), null); if (ch && !ch.hidden && (sc.ents || []).includes(ch)) return { ent: ch }; }
  if (sc.id === 'city') { const p = c.at ? place(c.at) : c.pos; return p ? { x: p.x, y: p.y } : null; }
  const viaNav = safe(() => G.navGoals.locate([{ label: COUNTER_RE }, { tag: COUNTER_TAGS }]), null); if (viaNav) return { x: viaNav.x, y: viaNav.y, spot: (viaNav.it && viaNav.it.spot) || (viaNav.fx && viaNav.fx.use) || undefined };
  for (const t of COUNTER_TAGS) { const fx = safe(() => sc.byTag(t)[0], null); if (fx) return { x: fx.x, y: fx.y, spot: fx.use || undefined }; }
  const sp = typeof sc.spawn === 'function' ? null : sc.spawn; return sp ? { x: sp.x, y: sp.y - 1.4 } : null;
}
function syncUse() {
  if (!S || !G.scene) return;
  for (const [id, u] of useIts) if (u.scene !== G.scene || !find(id) || find(id).st !== 1) dropUse(id);
  for (const c of S.cur) {
    const def = defOf(c), d = def && def.do; if (!d || d.type !== 'use' || c.st !== 1 || useIts.has(c.id) || !active(c)) continue;
    const inCity = G.scene.id === 'city', rid = c.at ? roomOf(c.at) : null; if (rid ? !here(c) : !inCity) continue;
    const L = locate(c, d); if (!L) continue;
    const it = Object.assign({ h: 1.3, hit: 15, range: L.ent ? 1.7 : 2.2, label: d.label, opp: c.id, navgoal: true, use: () => doUse(c.id) }, L.ent ? { ent: L.ent, x: L.ent.x, y: L.ent.y } : { x: L.x, y: L.y, spot: L.spot });
    G.scene.interactables.unshift(it); useIts.set(c.id, { it, scene: G.scene });
  }
}
function doUse(id) {
  const c = find(id), def = defOf(c), d = def && def.do; if (!c || !d) return;
  if (d.bring) { const have = safe(() => G.inv.count(d.bring[0]), 0); if (have < (d.bring[1] || 1)) { const nm = (ITEM_BY_ID[d.bring[0]] || { name: d.bring[0] }).name; toast(`You need ${d.bring[1] > 1 ? d.bring[1] + ' x ' : ''}${nm} in your backpack for this${have ? ` (you have ${have})` : ''}.`, 'info', 4200); return; } }
  if (d.pay && !safe(() => G.money.pay(d.pay, def.title), false)) return;
  const fin = async () => { if (d.bring) safe(() => G.inv.remove(d.bring[0], d.bring[1] || 1)); if (d.lines && d.lines.length) await say(d.lines.map(t => ({ text: t }))); complete(id); };
  if (d.minutes) G.startActivity({ label: d.label, anim: d.anim || 'stand', minutes: d.minutes, rate: Math.max(4, d.minutes / 3), done: () => { fin(); } }); else fin();
}

/* ---------- the clock ---------- */
function tick(dm) {
  if (!S) return;
  for (const c of S.cur.slice()) {
    const def = defOf(c); if (!def) { end(c, 'ignored'); continue; }
    if (now() > c.until) { if (c.st === 1) { S.n.expired++; end(c, 'expired'); toast(`"${def.title}" has passed. No harm done: something else will come along.`, 'info', 4200); } else end(c, 'ignored'); continue; }
    const d = def.do || {};
    if (d.type === 'visit' && active(c) && here(c) && !G.cutscene) { c.p = (c.p || 0) + dm; if (c.p >= (d.stay || 0)) complete(c.id); }
  }
  if (useIts.size || S.cur.some(c => c.st === 1 && (defOf(c) || {}).do && defOf(c).do.type === 'use')) syncUse();
  maybeOffer();
}

/* ---------- views ---------- */
function view(c) {
  const def = defOf(c); if (!def) return null; const pid = placeIdOf(c), p = pid ? place(pid) : null;
  return { id: c.id, st: c.st, title: def.title, text: def.text, src: def.src, srcName: (SOURCES[def.src] || SOURCES.story).name, icon: (SOURCES[def.src] || SOURCES.story).icon, t0: c.t0, until: c.until, from: c.from || null,
    untilText: c.from ? `${whenText(c.from)} to ${clockOf(c.until)}` : 'until ' + whenText(c.until), placeId: pid, placeName: c.at === 'home' ? 'Home' : p ? p.name : c.pos ? c.pos.name : '', reward: def.reward || {}, rewardText: rewardText(def), def, appt: c.appt || null, canGo: !!(pid || c.pos) && !(c.at === 'home' && isHome()) };
}
const list = () => S.cur.map(view).filter(Boolean).sort((a, b) => b.st - a.st || b.t0 - a.t0);

function attachNav() {
  if (!G.navGoals || !G.navGoals.define) return;
  G.navGoals.define('opps', 'default', 28, ctx => {
    if (!S || !ctx.root) return null; const mine = S.cur.filter(c => c.st === 1 && c.at && rootOf(roomOf(c.at)) === ctx.root && active(c)); if (!mine.length) return null;
    const c = mine.find(x => ctx.sel && ctx.sel.goal === gid(x.id)) || mine[0], def = defOf(c), d = def.do || {}, rid = roomOf(c.at), inRoom = curRoom() === rid;
    if (!inRoom) return { room: rid, find: null, label: def.title, short: def.title };
    if (d.type === 'use') { const u = useIts.get(c.id); if (!u) return null; const it = u.it; return { room: rid, find: it.ent ? { ent: e => e === it.ent } : { x: it.x, y: it.y, h: 2 }, label: d.label, short: d.label, name: def.title, quiet: 1 }; }
    if (d.type === 'talk') { const id = npcId(d.npc), ch = safe(() => G.social.char(id), null); return ch && !ch.hidden ? { room: rid, find: { npc: id }, label: 'Talk to ' + npcName(id), short: 'talk to ' + npcName(id), name: def.title, quiet: 1 } : null; }
    if (d.type === 'buy') return { room: rid, find: [{ label: COUNTER_RE }, { tag: COUNTER_TAGS }], label: def.title + ': buy it here', short: def.title, name: def.title, quiet: 1 };
    if (d.type === 'visit') return { room: rid, find: null, label: def.title + ': stay a moment', short: def.title, quiet: 1 };
    return null;
  }, (ctx, s) => !!(s && s.goal && String(s.goal).startsWith('opp:')));
}

export function init() {
  S = G.defineState('opps', fresh);
  const rebind = () => { S = G.state.opps || (G.state.opps = fresh()); const f = fresh(); for (const k in f) if (S[k] === undefined) S[k] = f[k]; for (const k in f.n) if (S.n[k] === undefined) S.n[k] = f.n[k]; useIts = new Map(); for (const c of S.cur) { const def = defOf(c); if (def) ensureEvents(def); } };
  rebind(); G.on('load', () => { rebind(); setTimeout(syncUse, 300); });
  G.opps = { list, get: id => { const c = find(id); return c ? view(c) : null; }, log: () => S.log.slice(), stats: () => Object.assign({ open: S.cur.length, cycle: S.cyc, used: Object.keys(S.used).length, pool: POOL.length }, S.n), pool: POOL, TUNE, SOURCES,
    offer, accept, decline, drop, go, complete, offerNow: id => { const def = id ? POOL_BY_ID[id] : null; if (id) { const tgt = def && target(def); return !!tgt && !find(id) && doOffer(def, tgt); } const c = pick(); return c ? doOffer(c.def, c.tgt) && c.def.id : false; },
    eligible: () => candidates().map(c => c.def.id), rewardText, target: id => target(POOL_BY_ID[id] || {}), here: id => { const c = find(id); return c ? here(c) : false; } };
  G.on('minutes', tick);
  G.on('activity:done', onAct); G.on('shop:buy', onBuy); G.on('social:talk', onTalk);
  G.on('scene', () => setTimeout(syncUse, 250)); G.on('room:enter', () => setTimeout(syncUse, 250));
  G.on('intro:done', () => { if (S) S.next = Math.max(S.next, now() + 40); });
  G.on('ready', attachNav);
}
