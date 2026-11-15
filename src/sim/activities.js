// Activities: runs every entry of src/data/activities.js generically and wires furniture / world spots to them.
//
// G.activities
//   start(activityId, ctx?) -> the running activity | null. ctx (all optional):
//       { fx (fixture: tier scaling + seat), minutes, at: {x,y,z,dir} (seat), seated, label, book (item id), poi, rate,
//         onDone(run), onCancel(run), summary (text for the end toast), quiet (no flavour bubble), full: true (treat as full length -> onComplete applies) }
//     Effects: perHour needs / xpPerHour / fitnessPerHour are applied continuously while it runs (pro-rated, tier-scaled per `tierScales`,
//     outdoor fun x weather), cost and item cost are charged at start, onComplete (moodlet, needs, gives, money, opens) fires after a full run.
//   blocked(activityId, ctx?) -> reason string | null     (requirements + cost check)
//   forTags(tags, scene?) -> activity defs offered by a set of function tags in a scene (home / venue / world filtering)
//   menu(ctx: { fx?, poi?, tags, title? })  the "what do you want to do here" chooser (runs directly when only one thing is possible)
//   tagsFor(fx, scene) -> data function tags of a fixture (art tags are mapped onto the data vocabulary)
//   onOpen(key, fn)  register what an `onComplete.opens` key does: fn(ctx). Built in: fridge_inventory, serve_or_store, jobs_board_full, gig_payout,
//                    online_shop, wardrobe, outfit_preview (they call G.jobs / G.shop / G.wardrobe when present). Also emitted as 'ui:open'(key, ctx).
//   current() -> { id, def, elapsed, minutes, canCancel } | null        cancel()
// Fixture tags handled (registerFixture): every tag in data FUNCTION_TAGS.home/homeFixed/venue plus the art aliases
//   seating, booth, fitting, cardio, yoga, lockers, reading, pantry, moving, boxes, armchair.
// City: on entering the city scene, world pois of type 'bench' / 'spot' (and anything carrying a world function tag) become interactables.
// Events: 'activity:start'(id, ctx), 'activity:done'(id, { completed, minutes, totals }), 'ui:open'(key, ctx), 'cooked'(recipeId, servings)
// State: G.state.acts = { plants: { key: absDay watered }, last: { activityId: t } }
import { G } from '../core/game.js';
import { ACTIVITIES, ACTIVITY_BY_ID, FUNCTION_TAGS } from '../data/activities.js';
import { ITEM_BY_ID, RECIPES, homegoodsForTag } from '../data/items.js';
import { VENUE_BY_ID, isOpen, POIS } from '../data/venues.js';
import { EVENTS, eventOnDay } from '../data/calendar.js';
import { NEEDS, SKILLS, MOODLETS } from '../data/needs.js';
import { registerFixture } from '../scenes/interior.js';
import { choose, toast, bubble, modal, el } from '../ui/kit.js';
import { iconEl, weatherIcon } from '../ui/_icons.js';

export const order = 55;
let S = null, run = null; const opens = {}, cityRemovers = [], seen = new WeakSet();
const NEED_NAME = Object.fromEntries(NEEDS.map(n => [n.id, n.name])), SK = Object.fromEntries(SKILLS.map(s => [s.id, s]));
const hm = m => { m = Math.round(m); return m < 60 ? `${m} min` : m % 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m / 60} h`; };
const clockOf = h => String(Math.floor(h) % 24).padStart(2, '0') + ':' + String(Math.round((h % 1) * 60)).padStart(2, '0');
const money = n => (G.money ? G.money.fmt(n) : '$' + n);
const weatherKind = () => (G.weather && G.weather.current && (G.weather.current() || {}).kind) || G.state.weather || 'clear';
// converted public places (pub:<n>, see public_places.js) behave like the classic venue they were built as
const PUB_ALIAS = { cafe: 'cafe', bakery: 'bakery', diner: 'diner', eatery: 'restaurant', restaurant: 'restaurant', bar: 'bar', books: 'bookstore', boutique: 'clothing' };
const vkey = rid => { if (!rid || !rid.startsWith('pub:')) return rid; const p = G.publicPlaces && G.publicPlaces.get(rid); return (p && (PUB_ALIAS[p.tpl] || p.tpl)) || rid; };
const isHome = sc => { const r = (sc && sc.roomId) || ''; return r.startsWith('home') || r === 'devhome' || !!(sc && sc.def && (sc.def.home || (sc.def.tags || []).includes('home'))); };
const invCount = id => (G.inv ? G.inv.count(id) + (isHome(G.scene) ? G.inv.fridge.count(id) : 0) : 0);

/* ---------- tag mapping ---------- */
const HOME_T = ['bed', 'fridge', 'stove', 'microwave', 'sofa', 'tv', 'computer', 'bookshelf', 'game', 'music', 'shower', 'exercise', 'instrument', 'easel', 'plant', 'wardrobe', 'pantry', 'moving_box', 'delivery_box'];
const VENUE_T = FUNCTION_TAGS.venue.filter(t => !['till', 'shelf', 'host_stand', 'reception', 'showroom', 'clothes_rack', 'taxi_rank'].includes(t));
const RAW = [...new Set([...HOME_T, ...VENUE_T, 'bath', 'seating', 'booth', 'fitting', 'cardio', 'yoga', 'lockers', 'reading', 'moving', 'boxes', 'armchair'])];
function tagsFor(fx, scene) {
  const T = new Set(fx.tags), out = new Set(), id = fx.asset.id || '', rid = vkey(scene.roomId || ''), homeAsset = T.has('home');
  if (homeAsset || isHome(scene)) {
    for (const t of HOME_T) if (T.has(t)) out.add(t);
    if (id.includes('bathtub') || (!homeAsset && T.has('bath'))) out.add('bath');
    if (T.has('instrument')) out.delete('music');
    if (T.has('moving') || (T.has('boxes') && homeAsset)) out.add('moving_box');
    if (!isHome(scene)) { out.delete('fridge'); out.delete('pantry'); out.delete('wardrobe'); out.delete('moving_box'); }
  }
  if (!homeAsset) {
    for (const t of VENUE_T) if (T.has(t)) out.add(t);
    if (T.has('seating') || T.has('booth')) { out.add('seat'); if (rid === 'bar') out.add('bar_stool'); }
    if (T.has('fitting')) out.add('fitting_room');
    if (/bar\.pool/.test(id)) out.add('pool'); if (/dartboard/.test(id)) out.add('darts'); if (/jukebox/.test(id)) out.add('jukebox');
    if (/(^|\.)(pf\.tv)$/.test(id) && ((fx.item && fx.item.p) || {}).kind === 'sport') out.add('screen');
    if (rid === 'gym') { if (T.has('cardio')) out.add('treadmill'); if (T.has('yoga') && !T.has('decor')) out.add('yoga_studio'); if (T.has('lockers')) out.add('locker_shower'); }
    if (rid === 'library') { if (T.has('reading')) out.add('study_desk'); if (T.has('armchair')) out.add('reading_nook'); if (T.has('computer')) out.add('public_computer'); }
    if ((rid === 'library' || rid === 'bookstore') && T.has('bookshelf')) out.add('book_browse');
  }
  return [...out];
}
function forTags(tags, scene) {
  const rid = vkey((scene && scene.roomId) || ''), home = isHome(scene), city = scene && !scene.indoor;
  return ACTIVITIES.filter(a => tags.includes(a.tag) && (a.where === 'home' ? home : a.where === 'venue' ? ((a.venues || []).includes(rid) || ((a.venues || []).includes('*') && scene && scene.indoor && !home)) : a.where === 'world' ? city : true));
}

/* ---------- requirements ---------- */
function eventRunning(id) {
  const ev = EVENTS.find(e => e.id === id); if (!ev) return false; const n = G.now(), hrs = ev.hours || [0, 24];
  return (eventOnDay(ev, n.day) && n.hf >= hrs[0] && n.hf < hrs[1]) || (n.day > 0 && eventOnDay(ev, n.day - 1) && hrs[1] > 24 && n.hf < hrs[1] - 24);
}
function blocked(id, ctx = {}) {
  const a = ACTIVITY_BY_ID[id]; if (!a) return 'Unknown'; const r = a.requires || {}, n = G.now(), inv = G.inv;
  if (a.district && !(ctx.poi && String(ctx.poi.district || ctx.poi.id || '').includes(a.district))) return 'Not here';
  if (r.venueOpen) { const v = VENUE_BY_ID[(G.scene && G.scene.roomId) || '']; if (v && !isOpen(v, n.weekday, n.hf)) return 'Closed right now'; }
  if (r.access && !(inv && inv.hasAccess(r.access))) return r.access === 'gym' ? 'Needs a gym pass (front desk)' : 'Needs a pass';
  if (r.hours && !((n.hf >= r.hours[0] && n.hf < r.hours[1]) || (n.hf + 24 >= r.hours[0] && n.hf + 24 < r.hours[1]))) return `Only ${clockOf(r.hours[0])}–${clockOf(r.hours[1])}`;
  const w = weatherKind();
  if (a.where === 'world') { if (r.weather && !r.weather.includes(w)) return 'Needs a clear sky'; if (r.notWeather && r.notWeather.includes(w)) return 'Not in this weather'; }
  if (r.event && !eventRunning(r.event)) return 'Only during ' + ((EVENTS.find(e => e.id === r.event) || {}).name || 'the event');
  if (r.skill) for (const k in r.skill) if ((G.skills ? G.skills.level(k) : 1) < r.skill[k]) return `Needs ${SK[k].name} ${r.skill[k]}`;
  if (r.skillAny && !Object.keys(r.skillAny).some(k => (G.skills ? G.skills.level(k) : 1) >= r.skillAny[k])) return 'Needs ' + Object.keys(r.skillAny).map(k => `${SK[k].name} ${r.skillAny[k]}`).join(' or ');
  if (r.item && ![].concat(r.item).some(i => inv && inv.count(i) > 0)) return 'Needs: ' + [].concat(r.item).map(i => ITEM_BY_ID[i] ? ITEM_BY_ID[i].name : i).join(' or ');
  if (r.itemCategory && !ctx.book && !ctx.item) { const cats = [].concat(r.itemCategory); if (!(inv && inv.find(it => cats.includes(it.category) && (!r.bookKind || it.kind === r.bookKind) && (it.category === 'book' || inv.edible(it))).length)) return r.bookKind ? `No ${r.bookKind === 'skill' ? 'skill book' : 'novel'} in your backpack` : 'Bring some food'; }
  if (r.purchasedHere && !(G.shop && G.shop.purchased && G.shop.purchased((G.scene && G.scene.roomId) || ''))) return 'Order something first';
  if (r.companion) return 'Needs a friend along';
  if (a.schedule) { const jw = a.schedule.joinWindowMinutes / 60, hit = a.schedule.startHours.some(s => n.hf >= s - .05 && n.hf <= s + jw); if (!hit) { const nx = a.schedule.startHours.find(s => s > n.hf) ?? a.schedule.startHours[0]; return 'Next at ' + clockOf(nx); } }
  const c = a.cost;
  if (c && c.item && ![].concat(c.item).some(i => invCount(i) > 0)) return 'Needs: ' + [].concat(c.item).map(i => ITEM_BY_ID[i] ? ITEM_BY_ID[i].name : i).join(' or ');
  if (c && c.amount && !c.optional && G.money && !G.money.canAfford(c.amount)) return `Costs ${money(c.amount)}`;
  if (id === 'tend_plants' && ctx.fx && S.plants[plantKey(ctx.fx)] === n.day) return 'Already watered today';
  if (id === 'computer_gig' && !(G.jobs && G.jobs.openGigs)) return 'No gigs posted yet';
  return null;
}
const plantKey = fx => ((G.scene && G.scene.id) || '') + ':' + fx.x + ',' + fx.y;

/* ---------- tier / seats ---------- */
function goodOf(fx, tag) { const it = fx && fx.item; if (!it) return null; if (it.good && ITEM_BY_ID[it.good]) return ITEM_BY_ID[it.good]; const tier = it.p && it.p.tier !== undefined ? it.p.tier : it.tier; return tier === undefined ? null : homegoodsForTag(tag)[tier] || null; }
function seatOf(fx, a) {
  if (!fx) return null; const stand = ['work', 'carry', 'stand', 'dance', 'wave', 'cheer', 'talk'].includes(a.anim) && a.tag !== 'shower' && a.tag !== 'locker_shower';
  if (fx.seats && fx.seats.length && !stand) return fx.seats[0];
  if (a.anim === 'sit' && G.scene && G.scene.fixtures) { // e.g. TV: sit on the nearest sofa/chair
    let best = null, bd = 4.6; for (const f of G.scene.fixtures) { if (!f.seats || !f.seats.length || f.tags.includes('bed') && !f.tags.includes('seat')) continue; const d = Math.hypot(f.x - fx.x, f.y - fx.y); if (d < bd) { bd = d; best = f; } }
    if (best) return best.seats[0];
  }
  return null;
}

/* ---------- runner ---------- */
function start(id, ctx = {}) {
  const a = ACTIVITY_BY_ID[id]; if (!a || !G.player) return null;
  const why = ctx.force ? null : blocked(id, ctx); if (why) { toast(`${a.name}: ${why}.`, 'bad'); return null; }
  if (G.busy) G.endActivity(false);
  const c = a.cost, fx = ctx.fx, good = goodOf(fx, a.tag), mult = (good && good.bonus && good.bonus.mult) || 1, scales = a.tierScales || [];
  let minutes = ctx.minutes || a.minutes.default;
  if (c && c.amount && !(c.optional && G.money && !G.money.canAfford(c.amount))) { const amt = c.per === 'hour' ? c.amount * minutes / 60 : c.amount; if (G.money && !G.money.pay(amt, a.name, { category: 'fun' })) return null; }
  if (c && c.item && !(id === 'paint' && S.canvas)) { const it = [].concat(c.item).find(i => invCount(i) > 0); if (it) { if (!G.inv.remove(it, 1)) G.inv.fridge.remove(it, 1); if (id === 'paint') S.canvas = 1; } }
  const book = ctx.book ? ITEM_BY_ID[ctx.book] : null, seat = ctx.at || seatOf(fx, a), p = G.player;
  let anim = a.anim; const aid = (fx && fx.asset.id) || '';
  if (/treadmill/.test(aid)) anim = 'treadmill'; else if (/bike|rower|yogamat/.test(aid)) anim = 'sit'; if (seat && seat.lie) anim = 'sleep';
  if (book && book.kind === 'skill' && G.skills) { const l = G.skills.level(book.skill); if (l < book.minLevel || l > book.maxLevel) toast(l > book.maxLevel ? 'You already know everything in this book.' : 'This book is a bit advanced for you right now.', 'info'); }
  const st = run = { id, def: a, ctx, minutes, elapsed: 0, tot: {}, xp: {}, got: {}, yAcc: 0, t0: G.state.t, e0: G.needs ? G.needs.get('energy') : 0 };
  const sleepy = anim === 'sleep'; if (G.needs) G.needs.sleeping = sleepy;
  const tick = gm => {
    const h = gm / 60, N = G.needs; st.elapsed += gm; if (!N) return;
    for (const k in a.perHour) {
      let v = a.perHour[k]; if (scales.includes('perHour.' + k)) v *= mult;
      if (a.outdoor && k === 'fun' && v > 0 && G.weather && G.weather.outdoorFunMult) v *= G.weather.outdoorFunMult() || 1;
      if (k === 'energy' && v < 0 && a.fitnessPerHour && G.skills) v *= 1 + (SK.fitness.perLevel.workoutEnergyCostMult || 0) * (G.skills.level('fitness') - 1);
      const b = N.get(k); N.add(k, v * h); st.tot[k] = (st.tot[k] || 0) + N.get(k) - b;
    }
    for (const k in a.xpPerHour || {}) {
      const sk = k === '$bookSkill' ? book && book.skill : k; if (!sk || !G.skills) continue; let x = a.xpPerHour[k] * h * (scales.includes('xp') ? mult : 1);
      if (book && book.kind === 'skill') { const l = G.skills.level(sk), paid = G.state.inv.books[book.id] || 0; if (l < book.minLevel || l > book.maxLevel) x = 0; x = Math.min(x, Math.max(0, book.xpTotal - paid)); G.state.inv.books[book.id] = paid + x; }
      if (x > 0) st.xp[sk] = (st.xp[sk] || 0) + G.skills.addXp(sk, x);
    }
    if (book && book.kind === 'novel') { const B = G.state.inv.books; B[book.id] = (B[book.id] || 0) + gm; if (B[book.id] >= book.readMinutes) { B[book.id] = 0; N.addMoodlet('good_book'); toast(`You finished "${book.name}".`, 'good'); } }
    if (a.fitnessPerHour) N.addFitness(a.fitnessPerHour * h * (scales.includes('fitness') ? mult : 1));
    if (a.yieldPerHour) { st.yAcc += h; while (st.yAcc >= 1) { st.yAcc -= 1; for (const y of a.yieldPerHour) { let ch = y.chance; if (id === 'fish_pier') { const hf = G.now().hf; if ((hf >= 5 && hf < 7) || (hf >= 18 && hf < 21)) ch = .85; } if (id === 'garden' && G.now().season === 3) ch = 0; if (Math.random() < ch) { const it = Array.isArray(y.item) ? y.item[Math.random() * y.item.length | 0] : y.item; if (G.inv && G.inv.add(it, y.qty, { silent: true })) { st.got[it] = (st.got[it] || 0) + y.qty; bubble(p, '+ ' + ITEM_BY_ID[it].name, 1600); } } } } }
    if (id === 'paint') { G.state.inv.paint = (G.state.inv.paint || 0) + gm; }
    if (a.wake) { if (ctx.untilRested !== false && N.get('energy') >= (a.wake.atEnergy || 100) && (ctx.untilRested || st.elapsed >= 60)) { st.why = 'rested'; return G.endActivity(true); } if (N.get('hunger') < 6) { st.why = 'hungry'; return G.endActivity(true); } }
  };
  const end = completed => {
    if (run === st) run = null; if (G.needs) G.needs.sleeping = false; p.poseOpts = null;
    const full = completed && (ctx.full || st.why || st.elapsed >= a.minutes.default - .5), oc = a.onComplete;
    S.last[id] = Math.floor(G.state.t);
    if (id === 'tend_plants' && fx && completed) S.plants[plantKey(fx)] = G.now().day;
    if (id === 'paint') { if (G.state.inv.paint >= 120) { G.state.inv.paint = 0; S.canvas = 0; if (G.inv.add('painting', 1)) toast('You finished a painting!', 'good'); G.needs && G.needs.addMoodlet('inspired'); } else if (completed) toast(`The painting is ${Math.round(G.state.inv.paint / 1.2)}% done.`, 'info'); }
    else if (full && oc) {
      if (oc.moodlet && G.needs) G.needs.addMoodlet(oc.moodlet);
      if (oc.needs) for (const k in oc.needs) G.needs.add(k, oc.needs[k]);
      if (Array.isArray(oc.gives)) for (const g of oc.gives) if (Math.random() < (g.chance ?? 1) && G.inv) G.inv.add(g.item, g.qty || 1);
      if (oc.money && G.money) { const lv = G.skills ? Math.max(G.skills.level('charisma'), G.skills.level('creativity')) : 3, amt = Math.round(oc.money[0] + (oc.money[1] - oc.money[0]) * Math.max(0, Math.min(1, (lv - 3) / 7))); G.money.add(amt, a.name + ' tips'); toast(`Tips: ${money(amt)}!`, 'money'); }
    }
    if (full && good && good.bonus && good.bonus.moodlet && G.needs) G.needs.addMoodlet(good.bonus.moodlet);
    if (completed) { ctx.onDone && ctx.onDone(st); } else ctx.onCancel && ctx.onCancel(st);
    if (sleepy && a.wake) wakeSummary(st); else if (!ctx.noSummary) summary(st, completed);
    G.emit('activity:done', id, { completed, minutes: st.elapsed, totals: st.tot });
    if (full && oc && oc.opens && !ctx.noOpen) setTimeout(() => open(oc.opens, ctx), 0);
  };
  const act = G.startActivity({
    label: ctx.label || a.name, anim, minutes, rate: ctx.rate || Math.max(4, Math.min(48, minutes / 6)), canCancel: !a.fixed, tick, done: () => end(true), cancel: () => end(false),
    at: seat ? { x: seat.x, y: seat.y, z: seat.z || 0, dir: seat.dir } : undefined, actId: id,
  });
  p.poseOpts = sleepy ? { blanket: ctx.blanket || '#8fa8d8' } : seat && (seat.z || ctx.seated) && anim !== 'sit' && ['eat', 'drink', 'read', 'type', 'phone', 'talk'].includes(anim) ? { seated: true } : null;
  if (!seat && fx) p.faceTo(fx.x, fx.y);
  if (a.flavour && !ctx.quiet) bubble(p, a.flavour, 3200, 'think');
  G.emit('activity:start', id, ctx); return act;
}
function summary(st, completed) {
  if (st.ctx.summary && completed) return toast(st.ctx.summary, 'good', 3000);
  const parts = [];
  for (const k in st.tot) { const v = Math.round(st.tot[k]); if (v) parts.push(`${NEED_NAME[k]} ${v > 0 ? '+' : ''}${v}`); }
  for (const k in st.xp) { const v = Math.round(st.xp[k]); if (v) parts.push(`${SK[k].name} +${v} xp`); }
  for (const k in st.got) parts.push(`${ITEM_BY_ID[k].name} x${st.got[k]}`);
  if (parts.length) toast(`${st.ctx.label || st.def.name}: ${parts.join(' · ')}`, completed ? 'good' : 'info', 3200);
}
function wakeSummary(st) {
  const n = G.now(), N = G.needs, hrs = st.elapsed / 60, e = Math.round(N.get('energy')), gain = Math.round(e - st.e0);
  if (N.hasMoodlet('tipsy')) { N.removeMoodlet('tipsy'); N.addMoodlet('groggy'); }
  if (st.elapsed < 45) return summary(st, true);
  const morning = n.hour >= 4 && n.hour < 11, head = st.why === 'hungry' ? 'Your stomach woke you up' : morning ? 'Good morning!' : n.hour >= 18 || n.hour < 4 ? 'Awake again' : 'Rise and shine';
  const w = (G.weather && G.weather.current && G.weather.current()) || {}, wk = w.kind || G.state.weather, m = modal({ title: head, cls: 'wake-win' });
  const row = (ic, a, b) => el('div.wake-row', null, iconEl(ic, 2), el('span', { text: a }), el('b', { text: b }));
  m.body.append(el('div.wake-clock', null, el('b', { text: n.clock }), el('span', { text: `${n.weekdayName} · ${n.seasonName} ${n.dayOfMonth}` })),
    row('need.energy', `Slept ${hm(st.elapsed)}`, `Energy ${e} (${gain >= 0 ? '+' : ''}${gain})`),
    row('need.hunger', 'Hunger', `${Math.round(N.get('hunger'))} · ${N.band('hunger').label}`),
    row(weatherIcon(wk, n.hour >= 20 || n.hour < 6), 'Outside', (wk[0].toUpperCase() + wk.slice(1)) + (w.tempC !== undefined ? `, ${Math.round(w.tempC)}°C` : '')),
    hrs >= 6 && e >= 85 ? el('p.wake-note', { text: 'You feel properly rested.' }) : e < 40 ? el('p.wake-note', { text: 'Still tired. A longer night would help.' }) : null,
    el('button.go', { onclick: () => m.close() }, morning ? 'Start the day' : 'Get up'));
}

/* ---------- "opens" ---------- */
function open(key, ctx) {
  const c = Object.assign({ handled: false }, ctx); G.emit('ui:open', key, c);
  if (opens[key]) { try { if (opens[key](c) !== false) return; } catch (e) { console.error(e); } }
  if (!c.handled) toast('Nothing to see here yet.', 'info');
}
Object.assign(opens, {
  fridge_inventory: c => G.inv && G.inv.openFridge(c.fx),
  serve_or_store: () => true,
  jobs_board_full: c => (G.jobs && G.jobs.openBoard ? G.jobs.openBoard(c) : G.phone && G.phone.open ? G.phone.open('jobs') : false),
  gig_payout: () => true,
  online_shop: () => (G.shop ? G.shop.open('homegoods', { online: true }) : false),
  wardrobe: c => (G.wardrobe && G.wardrobe.open ? G.wardrobe.open(c) : false),
  outfit_preview: c => (G.wardrobe && G.wardrobe.open ? G.wardrobe.open(Object.assign({ preview: true }, c)) : G.shop ? G.shop.open('clothing') : false),
});

/* ---------- cooking ---------- */
function takeIngredients(rec, giveBack) { for (const k in rec.ingredients) { let n = rec.ingredients[k]; if (giveBack) { G.inv.add(k, n, { silent: true }) || G.inv.fridge.add(k, n, { silent: true }); continue; } const f = isHome(G.scene) ? Math.min(n, G.inv.fridge.count(k)) : 0; if (f) G.inv.fridge.remove(k, f); if (n - f) G.inv.remove(k, n - f); } }
async function cookMenu(fx, appliance) {
  const stove = goodOf(fx, 'stove'), sb = (stove && stove.bonus) || { stoveTier: 0, cookTimeMult: 1, mealEffectMult: 1 }, lvl = G.skills ? G.skills.level('cooking') : 1;
  const list = RECIPES.filter(r => r.appliance === appliance).map(r => {
    const miss = Object.keys(r.ingredients).filter(k => invCount(k) < r.ingredients[k]), min = Math.max(5, Math.round(r.cookMinutes * (appliance === 'stove' ? sb.cookTimeMult : 1) * (1 - .03 * (lvl - 1))));
    const why = lvl < r.skill ? `Cooking level ${r.skill}` : appliance === 'stove' && sb.stoveTier < r.stoveTier ? 'Needs a better stove' : miss.length ? 'Missing: ' + miss.map(k => ITEM_BY_ID[k].name).join(', ') : null;
    return { label: r.name, sub: why || `${hm(min)} · makes ${r.servings} · Hunger +${r.effects.hunger}`, icon: iconEl('meal_' + r.id, 2, 'meal'), disabled: !!why, value: { r, min }, ord: (why ? 100 : 0) + r.skill };
  }).sort((a, b) => a.ord - b.ord);
  const pick = await choose(appliance === 'stove' ? 'What shall we cook?' : 'No-cook dishes', list, { cls: 'act-menu', text: `Cooking level ${lvl}. Ingredients come from your kitchen.` });
  if (!pick) return; const { r, min } = pick;
  takeIngredients(r);
  start(appliance === 'stove' ? 'cook' : 'prep_cold', { fx, minutes: min, full: true, label: 'Cooking ' + r.name, noSummary: true, noOpen: true,
    onCancel: () => { takeIngredients(r, true); toast('You stopped cooking and put the ingredients back.', 'info'); },
    onDone: async () => {
      const id = 'meal_' + r.id, q = appliance === 'stove' ? sb.mealEffectMult : 1; if (G.skills) G.skills.addXp('cooking', r.xp);
      let inF = 0, inB = 0; for (let i = 0; i < r.servings; i++) { if (isHome(G.scene) && G.inv.fridge.add(id, 1, { q, silent: true })) inF++; else if (G.inv.add(id, 1, { q, silent: true })) inB++; }
      G.emit('cooked', r.id, inF + inB);
      if (!inF && !inB) return toast('No room to keep the food!', 'bad');
      const v = await choose(`${r.name} is ready!`, [{ label: 'Eat now', sub: G.inv.effectText(ITEM_BY_ID[id], q), icon: iconEl(id, 2, 'meal'), value: 'eat' }, { label: inF ? 'Save it for later' : 'Pack it up', sub: inF ? `${inF} in the fridge` : `${inB} in your backpack`, value: 'keep' }], { text: `Made ${r.servings} serving${r.servings > 1 ? 's' : ''}. +${r.xp} cooking xp.` });
      if (v === 'eat') G.inv.use(id, { from: inF ? 'fridge' : 'bag', at: tableSeat(fx) });
    } });
}
function tableSeat(fx) { if (!G.scene || !G.scene.fixtures) return undefined; let best = null, bd = 7; for (const f of G.scene.fixtures) { if (!f.seats || !f.seats.length || f.tags.includes('bed') || f.tags.includes('bath')) continue; const d = Math.hypot(f.x - G.player.x, f.y - G.player.y) + (f.tags.includes('dining') ? -3 : 0); if (d < bd) { bd = d; best = f; } } return best ? best.seats[0] : undefined; }
async function heatMenu(fx, actId) {
  const items = [...new Set([...G.inv.find(it => it.heat), ...(isHome(G.scene) ? G.inv.fridge.find(it => it.heat) : [])])];
  if (!items.length) return toast('Nothing to heat. Ready meals are sold at FreshWay and Lucky Corner.', 'info');
  const it = items.length === 1 ? items[0] : await choose('Heat what?', items.map(i => ({ label: i.name, sub: G.inv.effectText(i), icon: iconEl(i.id, 2, i.category), value: i })));
  if (!it) return; const good = goodOf(fx, 'microwave'), mult = actId === 'microwave_meal' && good ? good.bonus.mult : 1, min = actId === 'microwave_meal' ? (good ? good.bonus.heatMinutes : 5) : 8;
  start(actId, { fx, minutes: min, full: true, label: 'Heating ' + it.name, noSummary: true, onDone: () => setTimeout(() => G.inv.use(it.id, { from: G.inv.has(it.id) ? 'bag' : 'fridge', heated: true, mult, at: tableSeat(fx) }), 0) });
}

/* ---------- menus ---------- */
const LABEL = { bed: 'Bed', fridge: 'Open fridge', pantry: 'Open pantry', stove: 'Cook', microwave: 'Microwave', sofa: 'Sofa', tv: 'TV', computer: 'Computer', bookshelf: 'Bookshelf', game: 'Play games', music: 'Stereo', shower: 'Shower', bath: 'Bath', exercise: 'Work out', instrument: 'Practise', easel: 'Easel', plant: 'Plant', wardrobe: 'Wardrobe', moving_box: 'Moving box', delivery_box: 'Delivery box',
  seat: 'Sit', fitting_room: 'Fitting room', book_browse: 'Browse books', treadmill: 'Cardio', weights: 'Weights', yoga_studio: 'Yoga', locker_shower: 'Showers', study_desk: 'Study desk', reading_nook: 'Reading nook', public_computer: 'Computer', bar_stool: 'Bar', dancefloor: 'Dance floor', stage: 'Stage', cinema_seat: 'Cinema seat', arcade: 'Arcade',
  bench: 'Bench', duck_pond: 'Duck pond', fishing_spot: 'Fishing spot', ferris_wheel: 'The Bay Wheel', jog_path: 'Jogging path', viewpoint: 'Lookout', garden_plot: 'Garden bed', swing: 'Swing', picnic_spot: 'Picnic spot', busker: 'Busker', street_cat: 'Cat' };
function durations(a) { const m = a.minutes; if (m.min === m.max) return null; const s = [...new Set([m.min, m.default, m.max])]; return s.map(v => ({ label: hm(v), sub: v === m.default && s.length > 2 ? 'the usual' : '', value: v })); }
async function pickAndStart(a, ctx) {
  let c = Object.assign({}, ctx);
  const r = a.requires || {};
  if (r.itemCategory && a.tag !== 'self') {
    const cats = [].concat(r.itemCategory), items = G.inv.find(it => cats.includes(it.category) && (!r.bookKind || it.kind === r.bookKind) && (it.category === 'book' || G.inv.edible(it)));
    const it = items.length === 1 ? items[0] : await choose(a.name, items.map(i => ({ label: i.name, sub: G.inv.effectText(i), icon: iconEl(i.id, 2, i.category), value: i }))); if (!it) return;
    if (it.category === 'book') c.book = it.id; else { c.item = it.id; } c.label = it.category === 'book' ? `Reading ${it.name}` : a.name;
  }
  if (a.id === 'picnic') { const seat = c.at; return G.inv.use(c.item, { at: seat, extra: { fun: Math.round(a.perHour.fun * (ITEM_BY_ID[c.item].eatMinutes || 10) / 60) + 2 }, onDone: () => G.needs && G.needs.addMoodlet('fresh_air') }); }
  if (a.durationFrom === 'gig') return G.jobs.openGigs(c);
  const d = durations(a); if (d) { const v = await choose(a.name, d, { text: a.flavour }); if (!v) return; c.minutes = v; }
  if (a.cost && a.cost.optional && G.money && G.money.canAfford(a.cost.amount)) G.needs && G.needs.add('fun', 2);
  start(a.id, c);
}
async function menu(ctx) {
  if (G.busy) return; const tags = ctx.tags || [], fx = ctx.fx, opts = [];
  const add = (label, sub, fn, disabled, icon) => opts.push({ label, sub: typeof disabled === 'string' ? disabled : sub, disabled: !!disabled, value: fn, icon });
  if (tags.includes('fridge') || tags.includes('pantry')) { add(tags.includes('fridge') ? 'Open the fridge' : 'Open the pantry', 'Store, take or eat food', () => G.inv.openFridge(fx)); if (tags.includes('fridge')) add('Make a no-cook dish...', 'Salads and such', () => cookMenu(fx, 'none')); }
  if (tags.includes('stove')) { add('Cook...', 'Pick a recipe', () => cookMenu(fx, 'stove')); add('Heat a ready meal', 'The slow way: 8 min', () => heatMenu(fx, 'heat_on_stove')); }
  if (tags.includes('microwave')) add('Heat a ready meal', 'Ding!', () => heatMenu(fx, 'microwave_meal'));
  if (tags.includes('bed')) {
    const n = G.now(), wake = 7, toMorning = Math.round((((wake - n.hf) % 24) + 24) % 24 * 60) || 1440, e = G.needs ? G.needs.get('energy') : 50, why = e > 92 ? 'You are wide awake' : null;
    const good = goodOf(fx, 'bed'), rate = ACTIVITY_BY_ID.sleep.perHour.energy * ((good && good.bonus.mult) || 1), rested = Math.max(30, Math.round((100 - e) / rate * 60));
    if (toMorning >= 180 && toMorning <= 780 && (n.hf >= 18 || n.hf < 5)) add('Sleep until morning', `Wake at 07:00 · ${hm(toMorning)}`, () => start('sleep', { fx, minutes: toMorning, untilRested: false }), why);
    add('Sleep until rested', `About ${hm(rested)}`, () => start('sleep', { fx, minutes: 600, untilRested: true }), why);
    add('Sleep 8 hours', `Wake at ${clockOf((n.hf + 8) % 24)}`, () => start('sleep', { fx, minutes: 480, untilRested: false }), why);
    add('Take a nap', '30 min', () => start('nap', { fx, minutes: 30 }), e > 96 ? 'Not sleepy' : null);
  }
  const skip = ['sleep', 'nap', 'store_groceries', 'grab_snack', 'cook', 'prep_cold', 'microwave_meal', 'heat_on_stove'];
  for (const a of forTags(tags, G.scene)) { if (skip.includes(a.id)) continue; const c = Object.assign({}, ctx), why = blocked(a.id, c); if (why === 'Not here') continue; const m = a.minutes; add(a.name, why || (a.cost && a.cost.amount ? money(a.cost.amount) + ' · ' : '') + (m.min === m.max ? hm(m.min) : `${hm(m.min)} – ${hm(m.max)}`), () => pickAndStart(a, c), why); }
  if (!opts.length) return;
  const live = opts.filter(o => !o.disabled);
  const fn = opts.length === 1 && live.length === 1 ? live[0].value : await choose(ctx.title || LABEL[tags[0]] || 'What now?', opts, { cls: 'act-menu' });
  if (fn) fn();
}

/* ---------- city spots ---------- */
const WORLD = FUNCTION_TAGS.world, ALIAS = [[/duck|pond/, 'duck_pond'], [/fish|pier/, 'fishing_spot'], [/ferris|wheel/, 'ferris_wheel'], [/jog|loop|track/, 'jog_path'], [/view|lookout|vista|lighthouse/, 'viewpoint'], [/garden/, 'garden_plot'], [/swing|playground/, 'swing'], [/picnic/, 'picnic_spot'], [/busk/, 'busker'], [/cat\b/, 'street_cat'], [/bench/, 'bench']];
function worldTags(p) {
  const raw = [p.tag, p.fn, p.func, p.kind, p.sub, p.use, p.activity].concat(p.tags || [], p.functions || []).filter(v => typeof v === 'string'), out = new Set(raw.filter(t => WORLD.includes(t)));
  if (p.type === 'bench') out.add('bench');
  if (!out.size && (p.type === 'spot' || p.type === 'bench')) { const s = (raw.join(' ') + ' ' + (p.id || '') + ' ' + (p.name || '')).toLowerCase(); for (const [re, t] of ALIAS) if (re.test(s)) out.add(t); const d = POIS.find(q => q.id === p.id); if (d) d.functions.forEach(f => out.add(f)); }
  return [...out];
}
function buildCity(scene) {
  while (cityRemovers.length) cityRemovers.pop()();
  if (!scene || scene.id !== 'city' || !scene.world || !Array.isArray(scene.world.pois)) return;
  for (const p of scene.world.pois) {
    if (!p || !isFinite(p.x) || !isFinite(p.y)) continue; const tags = worldTags(p); if (!tags.length) continue;
    const seat = tags.includes('bench') || tags.includes('swing') ? (p.seat || (p.seats && p.seats[0]) || { x: p.x, y: p.y, z: p.seatZ ?? .45, dir: p.dir ?? 1 }) : undefined;
    const it = { scene: 'city', x: p.x, y: p.y, label: p.label || LABEL[tags[0]] || p.name || 'Spot', h: .8, range: 1.7, spot: p.spot || p.stand, poi: p, use: () => menu({ poi: p, tags, at: seat, title: p.name || LABEL[tags[0]] }) };
    cityRemovers.push(G.addInteractable(it));
  }
  // bench / chair PROPS that carry seats but have no poi get a Sit spot too
  try {
    const taken = scene.world.pois.filter(p => p && worldTags(p).length), FL = [1, 0, 3, 2]; let n = 0;
    for (const ob of scene.world.objs) {
      const a = ob.a; if (!a || !a.seats || n >= 220) continue; let st = typeof a.seats === 'function' ? a.seats(ob.p || {}) : a.seats; if (!Array.isArray(st)) continue; st = st.filter(q => q && !q.lie); if (!st.length) continue;
      const seats = st.map(q => ob.flip ? { x: ob.x + q.y, y: ob.y + q.x, z: (ob.z || 0) + (q.z || .45), dir: FL[q.dir || 0] } : { x: ob.x + q.x, y: ob.y + q.y, z: (ob.z || 0) + (q.z || .45), dir: q.dir || 0 });
      const cx = seats.reduce((v, q) => v + q.x, 0) / seats.length, cy = seats.reduce((v, q) => v + q.y, 0) / seats.length; if (taken.some(p => Math.hypot(p.x - cx, p.y - cy) < 1.6)) continue; n++;
      const poi = { type: 'bench', id: 'seat:' + n, name: 'Bench', x: cx, y: cy };
      cityRemovers.push(G.addInteractable({ scene: 'city', x: cx, y: cy, label: 'Sit', h: .8, range: 1.7, poi, use: () => menu({ poi, tags: ['bench'], at: nearSeat(seats), title: 'Bench' }) }));
    }
  } catch (e) { console.warn('bench props: ' + e.message); }
}
const nearSeat = seats => { const p = G.player, ents = (G.scene && G.scene.ents) || [], free = seats.filter(q => !ents.some(c => c !== p && !c.hidden && Math.hypot(c.x - q.x, c.y - q.y) < .3)); return (free.length ? free : []).reduce((a, b) => !a || Math.hypot(b.x - p.x, b.y - p.y) < Math.hypot(a.x - p.x, a.y - p.y) ? b : a, null); };
/** generic "Sit": any fixture with a non-lying seat that no other activity claimed */
function sitOn(fx) {
  const seat = nearSeat(fx.seats.filter(q => !q.lie)); if (!seat) { toast('Every seat here is taken.'); return; } if (G.busy) return;
  const p = G.player, t0 = G.state.t, rest = () => { const m = Math.max(0, Math.min(120, G.state.t - t0)); try { G.needs.add('energy', m * .08); G.needs.add('fun', m * .03); } catch (e) { } };
  G.startActivity({ label: 'Sitting', anim: 'sit', minutes: 90, rate: 5, canCancel: true, done: rest, cancel: rest, at: { x: seat.x, y: seat.y, z: seat.z || 0, dir: seat.dir } });
  if (seat.z) p.poseOpts = { seated: true };
}
function addSeats(sc) {
  if (!sc || sc.id === 'city' || !Array.isArray(sc.fixtures) || !Array.isArray(sc.interactables)) return;
  for (const fx of sc.fixtures) { if (!fx.seats || !fx.seats.some(q => !q.lie) || fx.tags.includes('bed') || fx.tags.includes('bath') || fx._sit || sc.interactables.some(it => it.fx === fx)) continue; fx._sit = true;
    sc.interactables.push({ x: fx.x, y: fx.y, h: Math.min(1.2, fx.ob.size[2]), hit: 14, range: 1.8, spot: fx.use || undefined, fx, label: 'Sit', act: true, use: () => sitOn(fx) }); }
}

export function init() {
  S = G.defineState('acts', () => ({ plants: {}, last: {}, canvas: 0 }));
  G.on('load', () => { S = G.state.acts || (G.state.acts = { plants: {}, last: {}, canvas: 0 }); run = null; });
  G.activities = { start, blocked, forTags, tagsFor, menu, onOpen: (k, fn) => { opens[k] = fn; }, cancel: () => { if (G.busy && G.busy.canCancel !== false) G.endActivity(false); },
    current: () => (run && G.busy ? { id: run.id, def: run.def, elapsed: run.elapsed, minutes: run.minutes, canCancel: G.busy.canCancel !== false } : null), cookMenu, isHome };
  for (const t of RAW) registerFixture(t, (fx, scene) => {
    if (seen.has(fx)) return null; const tags = tagsFor(fx, scene); if (!tags.length) return null;
    const special = tags.some(x => ['fridge', 'pantry', 'stove', 'microwave', 'bed'].includes(x)); if (!special && !forTags(tags, scene).length) return null;
    seen.add(fx); const acts = forTags(tags, scene);
    return { label: !special && acts.length === 1 ? acts[0].name : LABEL[tags[0]] || 'Use', act: true, use: () => menu({ fx, tags }) };
  });
  G.on('scene', s => { if (s && s.id === 'city') buildCity(s); })
  G.on('scene', s => { try { addSeats(s); } catch (e) { console.warn('seats: ' + e.message); } });
  G.on('activityEnd', () => { if (G.player) G.player.poseOpts = G.busy ? G.player.poseOpts : null; });
}
