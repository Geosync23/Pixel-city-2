// Story engine (src/story/story.js beats) + goals list + achievements (src/story/texts.js ACHIEVEMENTS).
//
// ---- G.goals (state G.state.goals = { items: [goal], collapsed }) ----------------------------------------------------------
//   add({ id, text, group: 'goal' | 'opportunity', hint?, placeId?, list?, listTitle?, doneText?,
//         doneWhen?: condition string (see cond below), done?: eventName | predicate fn, onDone?: fn }) -> goal
//        `done` as an event name completes the goal the next time that event fires (survives save/load); a predicate is checked every
//        game minute (runtime only: call add() again with the same id after a load to re-attach it and onDone).
//   complete(id) -> bool     remove(id)     get(id)     isDone(id)     list() -> [{ id, text, shown, group, hint, placeId, listTitle, done }]
//   addList(listId) adds every goal of story/intro.js GOAL_LISTS[listId];  addFromList(listId, goalId) adds one.
//   cond(when) -> bool   the shared condition vocabulary of GOAL_LISTS.doneWhen and ACHIEVEMENTS.when ('boxes_unpacked:3',
//        'fridge_opened', 'ate_meal', 'replied:jules', 'slept', 'beat_done:<id>', 'fridge_stocked', 'cooked_meal', 'rode_train',
//        'job_accepted', 'met_npcs:3', 'taxi_rides:10', 'friends:1', 'money:1000', ...), backed by counters in G.state.ach.c.
//   Events: 'goal:done'(id, goal), 'goals:change'.   Fully completed lists are cleared the next morning.
//
// ---- G.story (state G.state.story = { beats: { id: { st, day, t0, t1, appt, n, prep, t } }, vars, last, items, recipes, disc, recur }) ---
//   st: 'pending' (implicit) | 'scheduled' (messages sent + appointment in the planner) | 'active' (scene running) | 'done'.
//   A missed window sends the beat's gentle `missed` messages and re-schedules it (rec.n counts misses); nothing ever fails.
//   state() -> slice     beat(id) -> { def, st, t0, t1, ... }     active() -> beats currently scheduled/active
//   offer(id, { now? }) send the delivery messages + create the appointment (now: window starts immediately; debug/tests)
//   start(id) -> Promise  play the scene right here, then complete     complete(id) rewards + done     skipTo(id) (debug) marks all
//   earlier beats done (flags only) and offers `id` with an immediate window     hints() -> [{ id, title, t0, t1, placeId, thread }]
//   discount(venueId) -> percent unlocked by the story     recipes() -> [recipeId]     keepsakes() -> [itemId]
//   Triggers: evaluated every game minute once flags.introDone is set: first `sendAt` on/after `minDay` with all `after` done, at most
//   one new beat per day and never more than two open at once. 45 min before a window the `with` NPCs are placed (G.social.place) and
//   story homes are opened (G.housing.invite). Being at the place inside the window plays the scene (say()/choose()).
//   Events: 'story:offer'(id), 'story:beat'(id) on completion, 'story:missed'(id).
//
// ---- Achievements (state G.state.ach = { got: { id: t }, c: counters }) -------------------------------------------------------
//   G.achievements = { list() -> [{ id, name, desc, got }], grant(id), has(id) }.   Event 'achievement'(id, def) + toast.
import { G } from '../core/game.js';
import { toast, say, choose } from '../ui/kit.js';
import { BEATS, BEATS_BY_ID, STORY_ITEMS, RECIPES } from '../story/story.js';
import { CAST, CAST_BY_ID } from '../story/cast.js';
import { ACHIEVEMENTS } from '../story/texts.js';
import { GOAL_LISTS } from '../story/intro.js';
import { ITEM_BY_ID } from '../data/items.js';

export const order = 60;
const WDK = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const hm = s => { const [h, m] = String(s).split(':'); return (+h) * 60 + (+m || 0); };
const safe = (f, d) => { try { const v = f(); return v === undefined ? d : v; } catch (e) { return d; } };
const fill = t => String(t).replace(/\{name\}/g, (G.state.player && G.state.player.name) || 'you');
const cityW = () => { const c = G.sceneCache.get('city'); return c ? c.world : null; };

/* ================= counters / conditions ================= */
const A = () => { let a = G.state.ach; if (!a || !a.c) a = G.state.ach = { got: (a && a.got) || {}, c: {} }; return a; };
const C = () => A().c;
const bump = (k, n = 1) => { const c = C(); c[k] = (c[k] || 0) + n; later(); };
const setc = (k, v) => { const c = C(); if (c[k] !== v) { c[k] = v; later(); } };
let pend = false; function later() { if (pend) return; pend = true; queueMicrotask(() => { pend = false; evalGoals(); evalAch(); }); }
function cond(when) {
  if (!when) return false; const c = C(), F = G.state.flags || {};
  if (when === 'intro_complete' || when === 'entered_home') return !!F.introDone;
  if (when.startsWith('beat_done:')) return beatSt(when.slice(10)) === 'done';
  if (when.startsWith('attended:')) return when === 'attended:open_mic' && beatSt('k2_open_mic') === 'done';
  if (when === 'met_npcs:all') return safe(() => G.social.known().length >= CAST.length, false);
  if (when.startsWith('outside_before') || when.startsWith('outside_after')) return !!c[when.split(':')[0]];
  if (when.startsWith('recipes:')) return (S().recipes || []).length >= +when.slice(8);
  const m = /^(.+):(\d+)$/.exec(when); if (m) return (c[m[1]] || 0) >= +m[2];
  return !!c[when];
}
function track() {
  const on = (ev, fn) => G.on(ev, (...a) => { try { fn(...a); } catch (e) { console.warn('story track ' + ev, e); } });
  on('home:unpack', () => setc('boxes_unpacked', G.state.flags.boxes_unpacked || (C().boxes_unpacked || 0) + 1));
  on('ui:open', k => { if (/fridge/.test(String(k))) setc('fridge_opened', 1); });
  on('use', it => { if (it && /fridge/i.test(String(it.label || '') + ' ' + String(it.tag || ''))) setc('fridge_opened', 1); });
  on('activity:done', (id, r) => {
    if (id === 'grab_snack' || id === 'store_groceries') setc('fridge_opened', 1);
    if (r && r.completed === false) return;
    if (id === 'sleep') { bump('slept'); if (safe(() => G.housing.isHome(), false)) setc('first_night', 1); }
    if (/^eat|meal|dine/.test(id)) bump('ate_meal');
    if (/gym|treadmill|lift|weights|yoga|workout|jog|swim/.test(id)) bump('workouts');
    if (/sunset/.test(id)) setc('watched_sunset', 1); if (/chess/.test(id)) setc('chess_won', 1);
  });
  on('inv:use', id => { const it = ITEM_BY_ID[id]; if (it && it.effects && it.effects.hunger > 0) bump('ate_meal'); });
  on('shop:buy', (id, q, v) => { const it = ITEM_BY_ID[id]; if (it && it.category === 'dish') { if (it.effects && it.effects.hunger > 0 && !it.takeaway) bump('ate_meal'); if (v) setc('ate_at:' + v, 1); } if (v) { const c = C(); c._v = c._v || {}; c._v[v] = (c._v[v] || 0) + 1; setc('venue_visits_same', Math.max(c.venue_visits_same || 0, c._v[v])); } });
  on('msg:reply', th => setc('replied:' + th, 1));
  on('inv:change', () => { if (safe(() => G.state.inv.fridge.length, 0) >= 3) setc('fridge_stocked', 1); });
  on('cooked', id => { bump('cooked_meal'); setc('cooked:' + id, 1); });
  on('ride:end', (kind, pl) => { if (kind === 'train') { bump('rode_train'); const c = C(); c._s = c._s || {}; if (pl) c._s[typeof pl === 'string' ? pl : pl.id || pl.name || '?'] = 1; setc('stations_visited', Object.keys(c._s).length); } if (kind === 'taxi') bump('taxi_rides'); if (kind === 'bus') bump('bus_rides'); });
  on('job:hired', () => { setc('job_accepted', 1); bump('jobs_held'); }); on('job:promoted', () => bump('promotions'));
  on('npc:met', () => bump('met_npcs')); on('social:citizen', () => later());
  on('friend:up', (id) => { const k = safe(() => G.social.known(), []); let f = 0, cl = 0; for (const n of k) { const t = G.social.tier(n); if (t === 'friend' || t === 'close') f++; if (t === 'close') cl++; } setc('friends', f); setc('close_friends', cl); if (/friend|close/.test(G.social.tier(id))) setc('friend:' + id, 1); });
  on('social:gift', (id, item, kind) => { if (/lov/.test(String(kind))) setc('gift_loved', 1); });
  on('social:talk', (id, verb, ok) => { if (verb === 'joke' && ok === false) setc('joke_failed', 1); });
  on('social:hangout', (id, ap, kind) => { if (kind === 'host') setc('hosted_visit', 1); });
  on('home:move', (id, prev) => { if (prev && prev !== id) setc('moved_home', 1); });
  on('home:furnish', () => setc('furniture_placed', safe(() => G.housing.items().length, 0)));
  on('money', () => setc('money', Math.max(C().money || 0, Math.floor(safe(() => G.money.get(), 0)))));
  on('story:beat', later); on('intro:done', later);
}
function ambientTrack() { // every few game minutes
  if (!G.scene || G.scene.id !== 'city' || !(G.state.flags || {}).introDone) return; const c = C(), w = G.world, p = G.player, n = G.now();
  const d = safe(() => w.districtAt(p.x, p.y), null); if (d) { c._d = c._d || {}; if (!c._d[d]) { c._d[d] = 1; setc('districts_visited', Object.keys(c._d).length); } }
  if (n.hf >= 4.5 && n.hf < 6.5) setc('outside_before', 1); if (n.hf >= 2 && n.hf < 4.5) setc('outside_after', 1);
  if (safe(() => G.weather.isWet(), false)) setc('walked_in_rain', 1);
}

/* ================= goals ================= */
const GS = () => { let g = G.state.goals; if (!g || !Array.isArray(g.items)) g = G.state.goals = { items: [] }; return g; };
const rt = {}; // id -> { pred, onDone, off }
function hookEvent(it) { const r = rt[it.id] || (rt[it.id] = {}); if (r.off || !it.ev || it.done) return; r.off = G.on(it.ev, () => completeGoal(it.id)); }
function addGoal(g) {
  if (!g || !g.id) return null; const s = GS(); let it = s.items.find(x => x.id === g.id);
  if (!it) {
    it = { id: g.id, text: g.text || g.id, group: g.group === 'opportunity' ? 'opportunity' : 'goal', done: 0 };
    for (const k of ['hint', 'placeId', 'list', 'listTitle', 'doneText']) if (g[k] !== undefined) it[k] = g[k];
    if (g.doneWhen) it.when = g.doneWhen; if (typeof g.done === 'string') it.ev = g.done;
    s.items.push(it);
  }
  const r = rt[it.id] || (rt[it.id] = {}); if (typeof g.done === 'function') r.pred = g.done; if (g.onDone) r.onDone = g.onDone;
  hookEvent(it); G.emit('goals:change'); later(); return it;
}
function addFromList(listId, goalId) { const L = GOAL_LISTS[listId]; const g = L && L.goals.find(x => x.id === goalId); return g ? addGoal(Object.assign({}, g, { list: listId, listTitle: L.title })) : null; }
function addList(listId) { const L = GOAL_LISTS[listId]; if (L) for (const g of L.goals) addFromList(listId, g.id); }
function completeGoal(id) {
  const it = GS().items.find(x => x.id === id); if (!it || it.done) return false; it.done = 1; it.t = Math.floor(G.state.t);
  const r = rt[id]; if (r && r.off) { r.off(); r.off = null; }
  shown(it); G.emit('goal:done', id, it); if (r && r.onDone) safe(() => r.onDone(it));
  if (it.list && GS().items.every(x => x.list !== it.list || x.done)) setTimeout(() => toast('All done: ' + (it.listTitle || 'goals') + '!', 'good', 3200), 1800);
  G.emit('goals:change'); return true;
}
function removeGoal(id) { const s = GS(), i = s.items.findIndex(x => x.id === id); if (i < 0) return; s.items.splice(i, 1); const r = rt[id]; if (r && r.off) r.off(); delete rt[id]; G.emit('goals:change'); }
function shown(it) { const m = /\((\d+)\/(\d+)\)/.exec(it.text); if (!m || !it.when) return; const k = it.when.split(':')[0], n = it.done ? +m[2] : Math.min(+m[2], C()[k] || 0), s = it.text.replace(m[0], `(${n}/${m[2]})`); if (s !== it.shown) { it.shown = s; G.emit('goals:change'); } }
function evalGoals() {
  for (const it of GS().items.slice()) { if (it.done) continue; shown(it); const r = rt[it.id]; if ((it.when && cond(it.when)) || (r && r.pred && safe(() => r.pred(it), false))) completeGoal(it.id); }
}
function purgeLists() { const s = GS(), keep = s.items.filter(x => !(x.done && (!x.list || s.items.every(y => y.list !== x.list || y.done)))); if (keep.length !== s.items.length) { s.items = keep; G.emit('goals:change'); } }

/* ================= achievements ================= */
let achAt = 0;
function grant(id) {
  const a = A(), def = ACHIEVEMENTS.find(x => x.id === id); if (!def || a.got[id]) return false; a.got[id] = Math.floor(G.state.t);
  const wait = Math.max(0, achAt - performance.now()); achAt = performance.now() + wait + 1500;
  setTimeout(() => { toast('Achievement: ' + def.name + ' — ' + def.desc, 'good', 4200); safe(() => G.audio.sfx('achievement')); }, wait);
  G.emit('achievement', id, def); return true;
}
function evalAch() { const a = A(); if (!(G.state.flags || {}).introDone) return; for (const d of ACHIEVEMENTS) if (!a.got[d.id] && cond(d.when)) grant(d.id); }

/* ================= story ================= */
const S = () => { let s = G.state.story; if (!s || !s.beats) s = G.state.story = { beats: {}, vars: {}, threads: {}, last: -9, items: [], recipes: [], disc: {}, recur: {} }; return s; };
const rec = id => S().beats[id] || null;
const beatSt = id => (rec(id) ? rec(id).st : 'pending');
let running = false;
const ALIAS = { home_nana: 'home:grandma', home_jules: 'home:sibling', home_kit: 'home:friend', pier: 'poi_pier', lookout: 'poi_lookout' };
const NAMED = { park: /picnic meadow|central park/i, 'spot:school': /elementary|school/i, pier: /pier/i, lookout: /lookout/i };
function placeOf(key) {
  const P = G.places; if (!P) return null;
  if (key === 'player_home') { const h = safe(() => G.housing.current(), null); return h ? P.get(h.roomId) : null; }
  let p = safe(() => P.get(ALIAS[key] || key), null); if (p) return p;
  const re = NAMED[key] || new RegExp(String(key).replace(/^spot:/, '').replace(/_/g, ' '), 'i');
  return safe(() => P.list().find(q => re.test(q.name || '')), null) || null;
}
const roomOf = p => (p ? p.roomId || (p.kind === 'venue' || p.kind === 'home' ? p.id : null) : null);
function atPlace(p) {
  if (!p || !G.scene) return false; const r = roomOf(p), sid = G.scene.id;
  if (sid === 'int:' + r || sid === 'int:' + p.id) return true;
  if (r) return false; return sid === 'city' && Math.hypot(G.player.x - p.x, G.player.y - p.y) < 10;
}
function windowFor(b, baseDay, wd) {
  const ap = b.delivery.appointment, want = wd || ap.weekday; let d = baseDay;
  const snap = () => { if (want) { const k = WDK.indexOf(want); while (k >= 0 && d % 7 !== k) d++; } };
  snap(); if (d * 1440 + hm(ap.to) - 30 <= G.state.t) { d++; snap(); }
  return [d * 1440 + hm(ap.from), d * 1440 + hm(ap.to)];
}
function schedule(b, r, t0, t1) {
  const ap = b.delivery.appointment, p = placeOf(ap.place); if (r.appt !== undefined && r.appt !== null) safe(() => G.planner.remove(r.appt));
  r.t0 = t0; r.t1 = t1; r.prep = 0; r.st = 'scheduled';
  r.appt = safe(() => G.planner.add({ title: ap.title, placeId: p ? p.id : undefined, t: t0, dur: t1 - t0, kind: 'story', data: { beat: b.id }, remind: 30 }), null);
}
function offer(id, o = {}) {
  const b = BEATS_BY_ID[id]; if (!b || beatSt(id) === 'done' || beatSt(id) === 'active') return false; const s = S(), day = Math.floor(G.state.t / 1440);
  const r = s.beats[id] = { st: 'scheduled', day, n: 0 }; s.last = day;
  b.delivery.messages.forEach((m, i) => safe(() => G.messages.send({ from: m.from, text: m.text, delay: i || undefined })));
  let w = windowFor(b, day + (b.delivery.appointment.dayOffset || 0)); if (o.now) w = [Math.floor(G.state.t), Math.floor(G.state.t) + 300];
  schedule(b, r, w[0], w[1]); G.emit('story:offer', id); return true;
}
function prep(b, r) {
  r.prep = 1; const ap = b.delivery.appointment, p = placeOf(ap.place); if (!p || !G.social) return; const room = roomOf(p), until = r.t1 + 30, w = cityW();
  if (room && /^home:/.test(room)) safe(() => G.housing.invite(room, Math.ceil((r.t1 - G.state.t) / 60) + 1));
  (ap.with || []).forEach((n, i) => {
    if (room) return safe(() => G.social.place(n, room, { until }));
    let x = p.x, y = p.y; for (let k = 0; k < 24; k++) { const a = (i * 2.4 + k * .9), rr = 2 + (k >> 2) * .8 + (i % 3) * .5, cx = Math.round((p.x + Math.cos(a) * rr) * 2) / 2, cy = Math.round((p.y + Math.sin(a) * rr) * 2) / 2; if (w && !safe(() => w.isBlocked(cx, cy), true)) { x = cx; y = cy; break; } }
    safe(() => G.social.place(n, p.id, { x, y, until }));
  });
  safe(() => G.social.refresh());
}
function missed(b, r) {
  const m = b.missed || {}; r.n = (r.n || 0) + 1;
  (m.messages || []).forEach((x, i) => safe(() => G.messages.send({ from: x.from, text: x.text, delay: i || undefined })));
  for (const n of b.delivery.appointment.with || []) safe(() => G.social.place(n));
  const day = Math.floor(G.state.t / 1440), base = Math.max(day, Math.floor(r.t0 / 1440) + (m.rescheduleDays || 1)), w = windowFor(b, base, m.weekday);
  schedule(b, r, w[0], w[1]); G.emit('story:missed', b.id);
  const F = G.state.flags; if (!F.hint_story_missed) { F.hint_story_missed = 1; toast("Missed a plan? No stress. They'll text to reschedule. They always do.", 'info', 4200); }
}
const whoName = id => (id === 'narrator' ? '' : id === 'player' ? (G.state.player.name || 'You') : (CAST_BY_ID[id] ? CAST_BY_ID[id].short || CAST_BY_ID[id].name : id));
function effects(e) { if (!e) return; for (const k in e.relationship || {}) safe(() => G.social.addRel(k, e.relationship[k], { raw: true })); if (e.flag) G.state.flags[e.flag] = true; }
async function play(steps, poses) {
  for (const st of steps || []) {
    if (st.choice) {
      const opts = st.choice.options, v = await choose('', opts.map((o, i) => ({ label: o.text, value: i })), { cls: 'story-choice' }), o = opts[v === null || v === undefined ? 0 : v];
      S().vars[st.choice.id] = opts.indexOf(o); effects(o.effects); await play(o.reply, poses); continue;
    }
    const ch = st.anim && st.speaker !== 'narrator' ? safe(() => G.social.char(st.speaker), null) : null;
    if (ch) { if (!poses.has(ch)) poses.set(ch, ch.pose); ch.pose = st.anim === 'stand' ? null : st.anim; }
    await say([{ who: whoName(st.speaker), text: fill(st.text) }]);
  }
}
async function start(id) {
  const b = BEATS_BY_ID[id]; if (!b || running || beatSt(id) === 'done') return false; running = true;
  const r = S().beats[id] || (S().beats[id] = { st: 'scheduled', day: Math.floor(G.state.t / 1440), n: 0 }); r.st = 'active';
  const poses = new Map();
  try { for (const n of b.delivery.appointment.with || []) safe(() => G.social.meet(n)); await play(b.scene, poses); } catch (e) { console.warn('story scene ' + id, e); }
  for (const [ch, p] of poses) ch.pose = p;
  running = false; complete(id); return true;
}
function complete(id, silent) {
  const b = BEATS_BY_ID[id], s = S(); if (!b || beatSt(id) === 'done') return false; const r = s.beats[id] || (s.beats[id] = { n: 0 }), R = b.rewards || {};
  r.st = 'done'; r.t = Math.floor(G.state.t); if (r.appt !== undefined && r.appt !== null) safe(() => (silent ? G.planner.remove(r.appt) : G.planner.done(r.appt)));
  for (const f of R.flags || []) G.state.flags[f] = true;
  for (const u of R.unlocks || []) {
    if (u.type === 'discount') s.disc[u.venue] = Math.max(s.disc[u.venue] || 0, u.percent);
    else if (u.type === 'contact') { if (!silent) safe(() => G.social.meet(u.npc)); }
    else if (u.type === 'home') G.state.flags['home_open:' + u.home] = true;
    else if (u.type === 'recurring') s.recur[u.id] = { title: u.title, place: u.place, weekday: u.weekday, from: u.from, to: u.to, last: -1 };
    else if (u.type === 'music') G.state.flags['music:' + u.track] = true;
  }
  for (const rc of R.recipes || []) if (!s.recipes.includes(rc)) { s.recipes.push(rc); G.state.flags['recipe:' + rc] = true; if (!silent) toast('New recipe: ' + (RECIPES[rc] ? RECIPES[rc].name : rc), 'good', 3600); }
  if (silent) return true;
  for (const k in R.relationship || {}) safe(() => G.social.addRel(k, R.relationship[k], { raw: true }));
  for (const it of R.items || []) { const ok = ITEM_BY_ID[it] && safe(() => G.inv.add(it, 1), false); if (!ok && !s.items.includes(it)) s.items.push(it); toast('Received: ' + ((STORY_ITEMS[it] && STORY_ITEMS[it].name) || (ITEM_BY_ID[it] && ITEM_BY_ID[it].name) || it), 'good', 3600); }
  if (R.money) safe(() => G.money.add(R.money, 'story'));
  toast(b.summary, 'info', 5200); G.emit('story:beat', id); later(); safe(() => G.started && !(G.query && G.query.has('scene')) && G.save());
  return true;
}
function skipTo(id) { const i = BEATS.findIndex(b => b.id === id); if (i < 0) return false; for (let k = 0; k < i; k++) complete(BEATS[k].id, true); return offer(id, { now: true }); }
function tick() {
  const s = S(), T = G.state.t, F = G.state.flags || {};
  if (running || G.cutscene) return;
  for (const id in s.beats) {
    const r = s.beats[id], b = BEATS_BY_ID[id]; if (!b) continue;
    if (r.st === 'active') { r.st = 'scheduled'; } // a scene interrupted by a reload
    if (r.st !== 'scheduled') continue;
    if (T > r.t1) { missed(b, r); continue; }
    if (!r.prep && T >= r.t0 - 45) prep(b, r);
    if (T >= r.t0 && !G.modal && !G.busy && atPlace(placeOf(b.delivery.appointment.place))) { start(id); return; }
  }
  if (!F.introDone) return;
  const day = Math.floor(T / 1440), tod = T % 1440; if (day <= (s.last === undefined ? -9 : s.last) || tod > 21 * 60 + 30) return;
  if (Object.values(s.beats).filter(r => r.st === 'scheduled').length >= 2) return;
  for (const b of BEATS) { if (rec(b.id)) continue; const t = b.trigger || {}; if (day < (t.minDay || 0) || tod < hm(t.sendAt || '09:00') || !(t.after || []).every(a => beatSt(a) === 'done')) continue; offer(b.id); break; }
}
function recurring(day) {
  const s = S(); for (const id in s.recur) { const r = s.recur[id]; if (WDK[day % 7] !== r.weekday || r.last === day) continue; r.last = day; const p = placeOf(r.place);
    safe(() => G.planner.add({ title: r.title, placeId: p ? p.id : undefined, t: day * 1440 + hm(r.from), dur: hm(r.to) - hm(r.from), kind: 'friend', data: { recur: id } })); }
}
const hints = () => Object.keys(S().beats).filter(id => S().beats[id].st === 'scheduled' && BEATS_BY_ID[id]).map(id => { const r = S().beats[id], b = BEATS_BY_ID[id], p = placeOf(b.delivery.appointment.place); return { id, title: b.delivery.appointment.title, thread: b.thread, t0: r.t0, t1: r.t1, placeId: p ? p.id : null }; }).sort((a, b) => a.t0 - b.t0);

export function init() {
  G.defineState('story', () => ({ beats: {}, vars: {}, threads: {}, last: -9, items: [], recipes: [], disc: {}, recur: {} }));
  G.defineState('goals', () => ({ items: [] }));
  G.defineState('ach', () => ({ got: {}, c: {} }));
  G.goals = { add: addGoal, complete: completeGoal, remove: removeGoal, addList, addFromList, cond, get: id => GS().items.find(x => x.id === id) || null, isDone: id => { const g = GS().items.find(x => x.id === id); return !!(g && g.done); }, list: () => GS().items };
  G.story = { state: S, beat: id => (BEATS_BY_ID[id] ? Object.assign({ def: BEATS_BY_ID[id], st: 'pending' }, rec(id)) : null), offer, start, complete: id => complete(id), skipTo, hints, tick,
    active: () => Object.keys(S().beats).filter(id => /scheduled|active/.test(S().beats[id].st)), discount: v => S().disc[v] || 0, recipes: () => S().recipes, keepsakes: () => S().items };
  G.achievements = { list: () => ACHIEVEMENTS.map(d => Object.assign({ got: A().got[d.id] !== undefined }, d)), grant, has: id => A().got[id] !== undefined };
  track();
  let acc = 0;
  G.on('minutes', (d) => { safe(tick); acc += d || 1; if (acc >= 5) { acc = 0; safe(ambientTrack); evalGoals(); evalAch(); } });
  G.on('scene', () => setTimeout(() => safe(tick), 700));
  G.on('day', d => { safe(() => recurring(typeof d === 'number' ? d : Math.floor(G.state.t / 1440))); purgeLists(); });
  G.on('load', () => { for (const k in rt) { if (rt[k].off) rt[k].off(); delete rt[k]; } for (const it of GS().items) hookEvent(it); running = false; G.emit('goals:change'); });
}
