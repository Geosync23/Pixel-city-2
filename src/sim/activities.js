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
// Events: 'activity:start'(id, ctx), 'activity:done'(id, { completed, minutes, totals }), 'ui:open'(key, ctx), 'cooked'(recipeId, servings), 'recipe:learned'(recipeId, how)
// State: G.state.acts = { plants: { key: absDay watered }, last: { activityId: t } }; G.state.cook = recipe knowledge (see the cooking section; API G.cooking)
import { G } from '../core/game.js';
import { ACTIVITIES, ACTIVITY_BY_ID, FUNCTION_TAGS } from '../data/activities.js';
import { ITEM_BY_ID, RECIPES, RECIPE_BY_ID, RECIPE_CATS, LEARN_FROM, LEGACY_RECIPES, COOKBOOKS, homegoodsForTag } from '../data/items.js';
import { VENUE_BY_ID, isOpen, POIS } from '../data/venues.js';
import { EVENTS, eventOnDay } from '../data/calendar.js';
import { NEEDS, SKILLS, MOODLETS } from '../data/needs.js';
import { registerFixture } from '../scenes/interior.js';
import { U } from '../engine/raster.js';
import { nearestFree } from '../engine/nav.js';
import { choose, toast, bubble, modal, el } from '../ui/kit.js';
import { MACHINE_ACTS, machineAnim, machineId } from '../data/cookgames.js';
import { iconEl, weatherIcon } from '../ui/_icons.js';
import { pickAlarm, commitNote, ALARM_LABEL, ALARM_SUB } from '../ui/alarm.js';

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
const RAW = [...new Set([...HOME_T, ...VENUE_T, 'bath', 'seating', 'booth', 'fitting', 'cardio', 'yoga', 'boxing', 'lockers', 'reading', 'moving', 'boxes', 'armchair'])];
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
    if (rid === 'gym') { if (T.has('cardio')) out.add(/bike/.test(id) ? 'exbike' : /rower/.test(id) ? 'rower' : 'treadmill') /* each machine its own activity + mini-game (owner msg 162) */; if (T.has('boxing')) out.add('punchbag'); if (T.has('yoga') && !T.has('decor')) { out.add('yoga_studio'); out.add('yoga_mat'); } if (T.has('lockers')) out.add('locker_shower'); }
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
/* seating: nobody sits on somebody. The first seat of a piece that no visible character is on (the first one when they are all taken) */
const seatTaken = s => ((G.scene && G.scene.ents) || []).some(c => c !== G.player && !c.hidden && !c.isVehicle && (c.alpha === undefined || c.alpha > .5) && Math.hypot(c.x - s.x, c.y - s.y) < .3);
const freeSeat = seats => seats.find(s => !seatTaken(s)) || seats[0];
function seatOf(fx, a) {
  if (!fx) return null; const stand = ['work', 'carry', 'stand', 'dance', 'wave', 'cheer', 'talk'].includes(a.anim) && a.tag !== 'shower' && a.tag !== 'locker_shower';
  if (fx.seats && fx.seats.length && !stand) return freeSeat(fx.seats);
  if (a.anim === 'sit' && G.scene && G.scene.fixtures) { // e.g. TV: sit on the nearest sofa/chair
    let best = null, bd = 4.6; for (const f of G.scene.fixtures) { if (!f.seats || !f.seats.length || f.tags.includes('bed') && !f.tags.includes('seat')) continue; const d = Math.hypot(f.x - fx.x, f.y - fx.y); if (d < bd) { bd = d; best = f; } }
    if (best) return freeSeat(best.seats);
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
  const book = ctx.book ? ITEM_BY_ID[ctx.book] : null, seat = ctx.at || seatOf(fx, a) || (MACHINE_ACTS.includes(id) && fx && fx.pose && machineAnim(machineId(fx)) && !seatTaken(fx.pose) ? fx.pose : null) /* on the treadmill belt, on the mat, squared up to the bag */, p = G.player;
  let anim = a.anim; const aid = (fx && fx.asset.id) || '';
  if (MACHINE_ACTS.includes(id)) anim = machineAnim(machineId(fx)) || anim /* the animation matches the machine and its mini-game (owner msg 162) */; else if (/treadmill/.test(aid)) anim = 'treadmill'; else if (/bike|rower|yogamat/.test(aid)) anim = 'sit'; if (seat && seat.lie) anim = 'sleep';
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
    hrs >= 6 && e >= 85 ? el('p.wake-note', { text: 'You feel properly rested.' }) : e < 40 ? el('p.wake-note', { text: 'Still tired. A longer night would help.' }) : '',
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
// Recipes: data/items.js RECIPES (+ data/recipes_extra.js). Ingredients come from the kitchen (fridge + cupboards) first, then the backpack.
// RECIPE KNOWLEDGE — state G.state.cook = { v: 1, known: { recipeId: day learned }, eaten: { dishId: times eaten out }, books: [cookbookId on the kitchen shelf],
//   made: { recipeId: times cooked }, legacy?: 1 (a save from before recipe knowledge: keeps the 17 original recipes) }.
//   A recipe is known when it has no `learn` field, or it is in `known`, or the story set the flag 'recipe:<id>', or (legacy save) it is one of LEGACY_RECIPES.
//   Learned by: cooking level-ups ('skill:up'), cookbooks / recipe cards (bought -> shelved at once), eating a restaurant dish n times ('inv:use'),
//   friends ('friend:up' to friend / close), the story (flags). syncRecipes() re-checks all of them (also on load, every game day and when the menu opens).
// G.cooking = { knows(id), learn(id, how?) -> bool, known() -> [ids], status(id, fx?) -> { known, can, why, miss: [ingredientIds], minutes }, sync(),
//   open(fx, 'stove' | 'none'), teaser(id) -> how to learn it, shopHint([ingredientIds]) -> text, learnAll() (debug) }       Event: 'recipe:learned'(recipeId, how)
const CK = () => { let c = G.state.cook; if (!c) c = G.state.cook = {}; for (const k of ['known', 'eaten', 'made']) if (!c[k]) c[k] = {}; if (!Array.isArray(c.books)) c.books = []; return c; };
const LEGACY = new Set(LEGACY_RECIPES), EAT_IDS = new Set(RECIPES.flatMap(r => (r.learn && r.learn.eat) || [])), CAT_NAME = Object.fromEntries(RECIPE_CATS.map(c => [c.id, c.name]));
const knows = r => !!r && (!r.learn || CK().known[r.id] !== undefined || !!(G.state.flags && G.state.flags['recipe:' + r.id]) || (!!CK().legacy && LEGACY.has(r.id)));
const names = (list, max = 3) => list.slice(0, max).join(', ') + (list.length > max ? ` and ${list.length - max} more` : '');
function learn(id, how, quiet) {
  const r = RECIPE_BY_ID[id]; if (!r || knows(r)) return false;
  CK().known[id] = G.now().day; G.emit('recipe:learned', id, how || 'gift');
  if (!quiet) toast(`New recipe: ${r.name}!`, 'good', 3600); return true;
}
const tierOf = id => { try { return G.social && G.social.tier ? G.social.tier(id) : null; } catch (e) { return null; } };
const eatenOf = l => l.eat.reduce((n, d) => n + (CK().eaten[d] || 0), 0);
/** re-check every way of learning; returns the recipes learned just now */
function syncRecipes(quiet) {
  const c = CK(), lvl = G.skills ? G.skills.level('cooking') : 1, got = [];
  for (const r of RECIPES) {
    const l = r.learn; if (!l || knows(r)) continue;
    const yes = l.level ? lvl >= l.level : l.book ? c.books.includes(l.book) : l.eat ? eatenOf(l) >= l.n : l.friend ? ['friend', 'close'].includes(tierOf(l.friend)) : false;
    if (yes && learn(r.id, l.level ? 'level' : l.book ? 'book' : l.eat ? 'eat' : 'friend', true)) got.push(r);
  }
  if (got.length && !quiet) toast(`${got.length === 1 ? 'New recipe' : got.length + ' new recipes'}: ${names(got.map(r => r.name))}!`, 'good', 4200);
  return got;
}
/** cookbooks and recipe cards never ride in the backpack: the moment you have one it goes on the kitchen shelf and its recipes are yours */
let shelving = false;
function shelveBooks() {
  if (shelving || !G.inv) return; shelving = true;
  try {
    for (const b of COOKBOOKS) {
      const n = G.inv.count(b.id); if (!n) continue; G.inv.remove(b.id, n);
      if (CK().books.includes(b.id)) { toast(`You already have "${b.name}" — you leave the spare copy on the bookshop swap shelf.`, 'info', 3600); continue; }
      CK().books.push(b.id); const got = syncRecipes(true);
      toast(`"${b.name}" goes on your kitchen shelf. ${got.length ? `${got.length} new recipe${got.length === 1 ? '' : 's'}: ${names(got.map(r => r.name))}.` : 'You knew all of these already.'}`, 'good', 5200);
    }
  } finally { shelving = false; }
}
function ateOut(id) {
  if (!EAT_IDS.has(id)) return; const c = CK(); c.eaten[id] = (c.eaten[id] || 0) + 1;
  const got = syncRecipes(true);
  if (got.length) return toast(`You have had it often enough to work out how it is made. New recipe${got.length > 1 ? 's' : ''}: ${names(got.map(r => r.name))}!`, 'good', 5200);
  const r = RECIPES.find(q => q.learn && q.learn.eat && q.learn.eat.includes(id) && !knows(q)); if (!r) return;
  const k = eatenOf(r.learn); if (k === 1) toast(`You pay attention to how the ${ITEM_BY_ID[id].name} is made. ${r.learn.n - k} more and you could cook something like it at home.`, 'info', 4600);
}
/** "FreshWay Market sells all of it." — which shops stock these ingredients (fewest shops first; real places only, never the generic venue types) */
const SHOP_PRI = ['grocery', 'market_stalls', 'cornerstore', 'bakery'];
function shopHint(ids) {
  ids = [...new Set(ids)].filter(i => ITEM_BY_ID[i]); if (!ids.length) return '';
  const all = Object.values(VENUE_BY_ID).filter(v => v && !v.generic && v.offers && (v.offers.shop || []).includes('ingredient')), seenName = new Set(), shops = [];
  for (const v of [...SHOP_PRI.map(i => VENUE_BY_ID[i]).filter(Boolean), ...all.filter(v => !SHOP_PRI.includes(v.id))]) { if (seenName.has(v.name)) continue; seenName.add(v.name); shops.push(v); }
  let left = ids.slice(); const parts = [], n = G.now();
  for (let k = 0; k < 3 && left.length; k++) {
    let best = null, bn = 0; for (const v of shops) { const c = left.filter(i => ITEM_BY_ID[i].soldAt.includes(v.id)).length; if (c > bn) { bn = c; best = v; } }
    if (!best) break; const has = left.filter(i => ITEM_BY_ID[i].soldAt.includes(best.id)); left = left.filter(i => !has.includes(i));
    let shut = false; try { shut = !isOpen(best, n.weekday, n.hf); } catch (e) { /* no hours */ }
    parts.push(`${best.name}${shut ? ' (closed now)' : ''} sells ${!k && !left.length && ids.length > 1 ? (ids.length === 2 ? 'both' : 'all of it') : names(has.map(i => ITEM_BY_ID[i].name), 4)}`);
  }
  return parts.length ? parts.join('; ') + '.' : '';
}
function sellers(itemId) {
  const it = ITEM_BY_ID[itemId]; if (!it) return ''; const out = [];
  for (const v of it.soldAt.map(i => VENUE_BY_ID[i])) if (v && !v.generic && !out.includes(v.name)) out.push(v.name);
  if (!out.length) { const t = it.soldAt.map(i => VENUE_BY_ID[i]).find(v => v && v.generic); if (t) out.push('a ' + t.name.toLowerCase()); }   // no such place open in town yet: name the kind of place
  return out.slice(0, 2).join(' or ');
}
/** how an unknown recipe is learned (shown under the "???" teaser) */
function teaser(r) {
  const l = r.learn; if (!l) return '';
  if (l.level) return `You will work this one out yourself at Cooking level ${l.level}.`;
  if (l.book) { const b = ITEM_BY_ID[l.book], at = sellers(l.book); return `In ${b.name.startsWith('Recipe Card') ? 'the' : 'the cookbook'} "${b.name.replace('Recipe Card: ', '')}"${b.name.startsWith('Recipe Card') ? ' recipe card' : ''}${at ? ' — sold at ' + at : ''} (${G.money ? G.money.fmt(b.price) : '$' + b.price}).`; }
  if (l.eat) { const d = l.eat.map(i => ITEM_BY_ID[i]).find(i => i && sellers(i.id)) || ITEM_BY_ID[l.eat[0]], at = sellers(d.id), k = Math.min(l.n, eatenOf(l)); return `Taste it first: have the ${d.name}${at ? ' at ' + at : ''} ${l.n} times (${k}/${l.n}) and you will work out how it is made.`; }
  if (l.friend) return `A friend's recipe: get to know ${LEARN_FROM[l.friend] || l.friend}.`;
  return `A recipe somebody in town will hand you when the time is right (${LEARN_FROM[l.story] || 'the story'}).`;
}
/* QA6: the short "what am I missing" line on a recipe row: one shop for the missing ingredients (the shop that covers most of them) */
const buyAt = miss => { const h = shopHint(miss.slice(0, 3)); const m = /^([^;(]+?)(?: \(closed now\))? sells/.exec(h); return m ? 'at ' + m[1].trim() + (h.indexOf(';') > 0 ? ' +' : '') : 'not sold nearby'; };
const METHOD = r => (r.appliance === 'none' ? 'No-cook' : r.oven ? 'Oven' : r.stoveTier === 2 ? "Chef's range" : r.stoveTier === 1 ? 'Range' : 'Stove');
/** everything the menu needs to know about one recipe right now */
function recipeStatus(r, sb, atStove = true) {
  const lvl = G.skills ? G.skills.level('cooking') : 1, known = knows(r), miss = Object.keys(r.ingredients).filter(k => invCount(k) < r.ingredients[k]);
  const minutes = Math.max(5, Math.round(r.cookMinutes * (r.appliance === 'stove' ? sb.cookTimeMult : 1) * (1 - .03 * (lvl - 1))));
  /* QA6: a family recipe someone wrote out for you (learn.story, e.g. Bea's pancakes) can be followed at any Cooking level */
  const hard = !known ? 'Unknown recipe' : lvl < r.skill && !(r.learn && r.learn.story) ? `Needs Cooking level ${r.skill}` : r.appliance === 'stove' && !atStove ? 'Cook this one at the stove'
    : r.appliance === 'stove' && sb.stoveTier < r.stoveTier ? (r.stoveTier === 2 ? "Needs a Chef's Range" : r.oven ? 'Needs an oven (Gas Range & Oven)' : 'Needs a real range, not a hot plate') : null;
  const why = hard || (miss.length ? 'Missing: ' + names(miss.map(k => ITEM_BY_ID[k].name), 3) : null);
  return { r, known, miss, minutes, hard, why, can: !why, rank: !known ? 3 : hard ? 2 : miss.length ? 1 : 0 };
}
const fxLine = e => { const out = []; for (const k of ['hunger', 'energy', 'fun', 'social']) if (e[k] && out.length < 2) out.push(`${NEED_NAME[k]} +${e[k]}`); if (e.caffeine && out.length < 2) out.push('Caffeine'); return out.join(' · '); };
let cookCss = false;
function cookStyle() {
  if (cookCss || typeof document === 'undefined') return; cookCss = true;
  document.head.append(el('style', { text: `.cook-win{width:min(440px,96vw)}.cook-win .win-body{padding:0 10px 10px;display:flex;flex-direction:column;gap:5px}
.ck-head{position:sticky;top:0;z-index:2;background:var(--panel);padding:8px 0 6px;border-bottom:2px solid var(--shade);display:flex;flex-direction:column;gap:6px}
.ck-top{font-size:12px;font-weight:600;opacity:.8}.ck-tabs{display:flex;flex-wrap:wrap;gap:4px}
.ck-tabs button{min-height:30px;padding:2px 7px;font-size:12px;box-shadow:0 2px 0 var(--edge)}.ck-tabs button.on{background:var(--gold)}.ck-tabs button.dim{opacity:.55}
.ck-sec{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;opacity:.65;margin:7px 0 0}
.ck-row{display:flex;align-items:center;gap:8px;text-align:left;width:100%;padding:4px 8px;min-height:46px;flex:none}
.ck-row.off{background:#f3e8cf;box-shadow:0 2px 0 #2a273366;border-color:#2a273399}.ck-row.off .ico{opacity:.6}
.ck-m{flex:1;min-width:0;display:flex;flex-direction:column;line-height:1.2}.ck-m b{font-size:14px}.ck-s{font-size:12px;font-weight:600;opacity:.75}
.ck-row.miss .ck-s{color:#a3401f;opacity:1}.ck-row.unk b{letter-spacing:.12em;opacity:.6}
.ck-tag{font-size:10px;font-weight:700;border:2px solid var(--edge);padding:0 4px;background:var(--gold);flex:none}.ck-tag.lv{background:transparent;border-color:#2a273366;opacity:.75}
.ck-sil{filter:brightness(0);opacity:.3}.ck-note{font-size:12px;font-weight:600;opacity:.8;margin:2px 0}
.ck-hint{font-size:12px;font-weight:700;background:#fff0b8;border:2px solid var(--edge);padding:5px 8px;margin:2px 0}
.ck-det{display:flex;flex-direction:column;gap:7px;padding-top:10px}.ck-dh{display:flex;gap:10px;align-items:center}.ck-dh div{display:flex;flex-direction:column;line-height:1.25}
.ck-dh b{font-size:16px}.ck-dh span{font-size:12px;font-weight:600;opacity:.75}
.ck-ings{display:grid;grid-template-columns:1fr 1fr;gap:4px 10px}.ck-ing{display:flex;align-items:center;gap:6px;font-size:13px;font-weight:600;min-width:0}
.ck-ing span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ck-ing i{font-style:normal;font-weight:700;color:var(--good)}.ck-ing.no i{color:var(--bad)}.ck-ing.no span{color:var(--bad)}
.ck-btns{display:flex;gap:8px;margin-top:4px}.ck-btns .go{flex:1;background:var(--gold)}` }));
}
function takeIngredients(rec, giveBack) { for (const k in rec.ingredients) { let n = rec.ingredients[k]; if (giveBack) { (isHome(G.scene) && G.inv.fridge.add(k, n, { silent: true })) || G.inv.add(k, n, { silent: true }) || G.inv.fridge.add(k, n, { silent: true }); continue; } const f = isHome(G.scene) ? Math.min(n, G.inv.fridge.count(k)) : 0; if (f) G.inv.fridge.remove(k, f); if (n - f) G.inv.remove(k, n - f); } }
/** the recipe window. appliance 'stove' = everything; 'none' (opened at the fridge) = no-cook dishes and drinks only */
async function cookMenu(fx, appliance = 'stove') {
  if (G.busy) return; cookStyle(); shelveBooks(); syncRecipes();
  const atStove = appliance === 'stove', stove = goodOf(fx, 'stove'), sb = (atStove && stove && stove.bonus) || { stoveTier: 0, cookTimeMult: 1, mealEffectMult: 1 }, lvl = G.skills ? G.skills.level('cooking') : 1;
  const pool = RECIPES.filter(r => atStove || r.appliance === 'none'), made = CK().made;
  let tab = 'ready', sel = null, keep = 0;
  const m = modal({ title: atStove ? 'What shall we cook?' : 'No-cook dishes & drinks', cls: 'cook-win' });
  const stat = () => pool.map(r => recipeStatus(r, sb, atStove)), byName = (a, b) => a.r.skill - b.r.skill || a.r.name.localeCompare(b.r.name);
  const row = s => {
    const r = s.r, unk = !s.known;
    const sub = unk ? teaser(r) : s.rank === 1 ? `${s.why} · ${buyAt(s.miss)}` : s.why || `${hm(s.minutes)} · makes ${r.servings} · ${fxLine(r.effects)}`;
    const ic = iconEl('meal_' + r.id, 2, 'meal'); if (unk) ic.classList.add('ck-sil');
    return el('button.ck-row' + (s.can ? '' : '.off') + (s.rank === 1 ? '.miss' : '') + (unk ? '.unk' : ''), { onclick: () => { keep = m.body.scrollTop; sel = r; render(); } }, ic,
      el('span.ck-m', null, el('b', { text: unk ? '? ? ?' : r.name }), el('span.ck-s', { text: sub })),
      !unk && !made[r.id] && s.can ? el('span.ck-tag', { text: 'NEW' }) : null, el('span.ck-tag.lv', { text: 'Lv ' + r.skill }));
  };
  const cook = (r, min) => {
    m.close(); takeIngredients(r);
    const ok = start(atStove && r.appliance === 'stove' ? 'cook' : 'prep_cold', { fx, recipe: r.id /* the mini-game fits the dish: data/cookgames.js */, minutes: min, full: true, label: (r.appliance === 'none' ? 'Making ' : r.oven ? 'Baking ' : 'Cooking ') + r.name, noSummary: true, noOpen: true,
      onCancel: () => { takeIngredients(r, true); toast('You stopped and put the ingredients back.', 'info'); },
      onDone: async () => {
        const id = 'meal_' + r.id, q = r.appliance === 'stove' ? sb.mealEffectMult : 1, first = !CK().made[r.id], xp = Math.round(r.xp * (first ? 1.5 : 1));
        CK().made[r.id] = (CK().made[r.id] || 0) + 1; if (G.skills) G.skills.addXp('cooking', xp);
        let inF = 0, inB = 0; for (let i = 0; i < r.servings; i++) { if (isHome(G.scene) && G.inv.fridge.add(id, 1, { q, silent: true })) inF++; else if (G.inv.add(id, 1, { q, silent: true })) inB++; }
        G.emit('cooked', r.id, inF + inB);
        if (!inF && !inB) return toast('No room to keep the food!', 'bad');
        const v = await choose(`${r.name} is ready!`, [{ label: r.drink ? 'Drink it now' : 'Eat now', sub: G.inv.effectText(ITEM_BY_ID[id], q), icon: iconEl(id, 2, 'meal'), value: 'eat' }, { label: inF ? 'Save it for later' : 'Pack it up', sub: inF ? `${inF} in the kitchen` : `${inB} in your backpack`, value: 'keep' }],
          { text: `Made ${inF + inB} serving${inF + inB > 1 ? 's' : ''}. +${xp} cooking xp${first ? ' (first time — bonus!)' : ''}.${r.giftable ? ' A serving makes a good gift.' : ''}` });
        if (v === 'eat') G.inv.use(id, { from: inF ? 'fridge' : 'bag', at: tableSeat(fx) });
      } });
    if (!ok) takeIngredients(r, true);
  };
  const detail = r => {
    const s = recipeStatus(r, sb, atStove), unk = !s.known, ic = iconEl('meal_' + r.id, 3, 'meal'), d = el('div.ck-det'); if (unk) ic.classList.add('ck-sil');
    d.append(el('div.ck-dh', null, ic, el('div', null, el('b', { text: unk ? '? ? ?' : r.name }), el('span', { text: `${CAT_NAME[r.cat] || 'Recipe'} · ${METHOD(r)} · Cooking level ${r.skill}` }),
      !unk && el('span', { text: `${hm(s.minutes)} · makes ${r.servings} · keeps ${r.shelfLifeDays} day${r.shelfLifeDays === 1 ? '' : 's'}${made[r.id] ? ` · cooked ${made[r.id]}x` : ''}` }))));
    if (unk) d.append(el('p.ck-hint', { text: teaser(r) }), el('p.ck-note', { text: 'You do not know this recipe yet.' }));
    else {
      d.append(el('p.ck-note', { text: G.inv.effectText(ITEM_BY_ID['meal_' + r.id], r.appliance === 'stove' ? sb.mealEffectMult : 1) + (r.giftable ? ' · makes a good gift' : '') }));
      d.append(el('div.ck-sec', { text: 'Ingredients (from your kitchen)' }), el('div.ck-ings', null, Object.keys(r.ingredients).map(k => { const have = invCount(k), need = r.ingredients[k];
        return el('div.ck-ing' + (have < need ? '.no' : ''), null, iconEl(k, 1.5, 'ingredient'), el('span', { text: ITEM_BY_ID[k].name }), el('i', { text: `${Math.min(have, 99)}/${need}` })); })));
      if (s.miss.length) d.append(el('p.ck-hint', { text: 'Shopping: ' + (shopHint(s.miss) || 'nobody seems to sell that right now.') }));
      if (s.hard) d.append(el('p.ck-note', { text: s.hard + '.' }));
    }
    d.append(el('div.ck-btns', null, el('button', { onclick: () => { sel = null; render(); m.body.scrollTop = keep; } }, '< Back'),
      !unk && el('button.go', { disabled: !s.can, onclick: () => cook(r, s.minutes) }, s.can ? (r.appliance === 'none' ? 'Make it' : r.oven ? 'Bake it' : 'Cook it') + ` · ${hm(s.minutes)}` : s.hard ? 'Not yet' : 'Missing ingredients')));
    return d;
  };
  const render = () => {
    m.body.textContent = ''; if (sel) { m.body.append(detail(sel)); m.body.scrollTop = 0; return; }
    const all = stat(), ready = all.filter(s => s.rank === 0), unknown = all.filter(s => !s.known), cats = RECIPE_CATS.filter(c => all.some(s => s.r.cat === c.id));
    const tabs = [['ready', `Can cook now · ${ready.length}`], ...cats.map(c => [c.id, c.name]), ['learn', `To learn · ${unknown.length}`]];
    m.body.append(el('div.ck-head', null,
      el('div.ck-top', { text: `Cooking level ${lvl}${atStove ? ' · ' + ((stove && stove.name) || 'Stove') : ''} · you know ${all.length - unknown.length} of ${all.length} recipes` }),
      el('div.ck-tabs', null, tabs.map(([id, name]) => el('button' + (tab === id ? '.on' : '') + (id !== 'ready' && id !== 'learn' && !all.some(s => s.r.cat === id && s.rank === 0) ? '.dim' : ''), { onclick: () => { tab = id; render(); m.body.scrollTop = 0; } }, name)))));
    const sec = (title, list, note) => { if (!list.length) return; m.body.append(el('div.ck-sec', { text: title })); if (note) m.body.append(el('p.ck-note', { text: note })); for (const s of list) m.body.append(row(s)); };
    if (tab === 'ready') {
      if (!ready.length) m.body.append(el('p.ck-note', { text: atStove ? 'Nothing you know can be cooked with what is in the kitchen right now.' : 'Nothing no-cook can be made with what is in the kitchen right now.' }));
      sec('With what you have', ready.sort((a, b) => b.r.skill - a.r.skill || a.r.name.localeCompare(b.r.name)));
      const near = all.filter(s => s.rank === 1 && s.miss.length === 1).sort(byName).slice(0, 10), want = [...new Set(near.map(s => s.miss[0]))];
      sec('One ingredient short', near, want.length ? 'Shopping: ' + shopHint(want) : '');
      if (!near.length && !ready.length) { const two = all.filter(s => s.rank === 1).sort((a, b) => a.miss.length - b.miss.length || byName(a, b)).slice(0, 6); sec('Closest', two, two.length ? 'Shopping: ' + shopHint(two[0].miss) : ''); }
    } else if (tab === 'learn') {
      if (!unknown.length) m.body.append(el('p.ck-note', { text: 'You know every recipe here. Chef!' }));
      const kind = s => { const l = s.r.learn || {}; return l.level ? 0 : l.book ? 1 : l.eat ? 2 : l.friend ? 3 : 4; }, T = ['Work them out as your cooking improves', 'From cookbooks & recipe cards', 'Taste them around town first', "Friends' recipes", 'Family & story recipes'];
      for (let k = 0; k < 5; k++) sec(T[k], unknown.filter(s => kind(s) === k).sort((a, b) => k === 1 ? a.r.learn.book.localeCompare(b.r.learn.book) || byName(a, b) : k === 0 ? a.r.learn.level - b.r.learn.level || byName(a, b) : byName(a, b)));
    } else {
      const list = all.filter(s => s.r.cat === tab).sort((a, b) => a.rank - b.rank || byName(a, b));
      sec('Ready', list.filter(s => s.rank === 0)); sec('Need shopping', list.filter(s => s.rank === 1)); sec('Not yet', list.filter(s => s.rank === 2)); sec('Still to learn', list.filter(s => s.rank === 3));
    }
  };
  render();
}
function tableSeat(fx) { if (!G.scene || !G.scene.fixtures) return undefined; let best = null, bd = 7; for (const f of G.scene.fixtures) { if (!f.seats || !f.seats.length || f.tags.includes('bed') || f.tags.includes('bath')) continue; const d = Math.hypot(f.x - G.player.x, f.y - G.player.y) + (f.tags.includes('dining') ? -3 : 0); if (d < bd) { bd = d; best = f; } } return best ? best.seats[0] : undefined; }
function cookInit() {
  const blank = () => ({ known: {}, eaten: {}, books: [], made: {} });
  G.defineState('cook', blank); CK().v = 1;      // a game started in this version: knowledge begins with the base recipes
  // a save from before recipe knowledge has no slice (G.load fills in an unstamped default): it keeps everything it could cook
  G.on('load', () => { const c = CK(); if (!c.v) { c.v = 1; c.legacy = 1; } setTimeout(() => { try { syncRecipes(true); } catch (e) { console.warn('recipes: ' + e.message); } }, 0); });
  const safe = fn => (...a) => { try { fn(...a); } catch (e) { console.warn('recipes: ' + e.message); } };
  G.on('skill:up', safe(k => { if (k === 'cooking') setTimeout(safe(() => syncRecipes()), 600); }));
  G.on('friend:up', safe(() => syncRecipes()));
  G.on('story:beat', safe(() => setTimeout(safe(() => syncRecipes(true)), 0)));
  G.on('day', safe(() => syncRecipes()));
  G.on('inv:use', safe(id => ateOut(id)));
  G.on('inv:change', safe(() => { if (!shelving && G.inv && COOKBOOKS.some(b => G.inv.has(b.id))) setTimeout(safe(shelveBooks), 0); }));
  G.cooking = { knows: id => knows(RECIPE_BY_ID[id]), learn: (id, how) => learn(id, how), known: () => RECIPES.filter(knows).map(r => r.id), sync: () => syncRecipes(), open: cookMenu, shopHint,
    teaser: id => (RECIPE_BY_ID[id] ? teaser(RECIPE_BY_ID[id]) : ''),
    status: (id, fx) => { const r = RECIPE_BY_ID[id]; if (!r) return null; const g = goodOf(fx, 'stove'), s = recipeStatus(r, (g && g.bonus) || { stoveTier: 0, cookTimeMult: 1, mealEffectMult: 1 }); return { known: s.known, can: s.can, why: s.why, miss: s.miss, minutes: s.minutes }; },
    learnAll: () => RECIPES.filter(r => learn(r.id, 'debug', true)).length };
}
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
  if (tags.includes('fridge') || tags.includes('pantry')) { add(tags.includes('fridge') ? 'Open the fridge' : 'Open the pantry', 'Store, take or eat food', () => G.inv.openFridge(fx)); if (tags.includes('fridge')) add('Make a no-cook dish...', 'Sandwiches, salads, smoothies', () => cookMenu(fx, 'none')); }
  if (tags.includes('stove')) { add('Cook...', 'Open your recipes', () => cookMenu(fx, 'stove')); add('Heat a ready meal', 'The slow way: 8 min', () => heatMenu(fx, 'heat_on_stove')); }
  if (tags.includes('microwave')) add('Heat a ready meal', 'Ding!', () => heatMenu(fx, 'microwave_meal'));
  if (tags.includes('computer') && G.homeDesign && isHome(G.scene)) add('Shop for the home', 'Roomy: browse, order, track', () => G.homeDesign.shop());
  if (tags.includes('bed')) {
    const n = G.now(), wake = 7, toMorning = Math.round((((wake - n.hf) % 24) + 24) % 24 * 60) || 1440, e = G.needs ? G.needs.get('energy') : 50, why = e > 92 ? 'You are wide awake' : null;
    const good = goodOf(fx, 'bed'), rate = ACTIVITY_BY_ID.sleep.perHour.energy * ((good && good.bonus.mult) || 1), rested = Math.max(30, Math.round((100 - e) / rate * 60));
    if (toMorning >= 180 && toMorning <= 780 && (n.hf >= 18 || n.hf < 5)) add('Sleep until morning', `Wake at 07:00 · ${hm(toMorning)}` + ((note => note ? ' · ' + note : '')(commitNote(G.state.t, G.state.t + toMorning + 45))), () => start('sleep', { fx, minutes: toMorning, untilRested: false }), why);
    const jb = G.jobs && G.jobs.current && G.jobs.current(), toWork = jb && jb.nextShift ? Math.round(jb.nextShift - G.state.t - 75) : 0;
    if (toWork >= 120 && toWork <= 840) add('Sleep until it is time for work', `Wake at ${clockOf((((n.hf + toWork / 60) % 24) + 24) % 24)}, 75 min before your shift · ${hm(toWork)}`, () => start('sleep', { fx, minutes: toWork, untilRested: false }), why);
    add('Sleep until rested', `About ${hm(rested)}`, () => start('sleep', { fx, minutes: 600, untilRested: true }), why);
    add('Sleep 8 hours', `Wake at ${clockOf((n.hf + 8) % 24)}`, () => start('sleep', { fx, minutes: 480, untilRested: false }), why);
    add('Take a nap', '30 min', () => start('nap', { fx, minutes: 30 }), e > 96 ? 'Not sleepy' : null);
    add(ALARM_LABEL, ALARM_SUB, async () => { const r = await pickAlarm(); if (r && !G.busy) start('sleep', { fx, minutes: r.minutes, untilRested: false }); }, why);   /* owner: a custom wake-up time (src/ui/alarm.js) */
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
  cookInit();
  G.activities = { start, blocked, forTags, tagsFor, menu, onOpen: (k, fn) => { opens[k] = fn; }, cancel: () => { if (G.busy && G.busy.canCancel !== false) G.endActivity(false); },
    current: () => (run && G.busy ? { id: run.id, def: run.def, elapsed: run.elapsed, minutes: run.minutes, canCancel: G.busy.canCancel !== false } : null), cookMenu, isHome };
  for (const t of RAW) registerFixture(t, (fx, scene) => {
    if (seen.has(fx)) return null; const tags = tagsFor(fx, scene); if (!tags.length) return null;
    const special = tags.some(x => ['fridge', 'pantry', 'stove', 'microwave', 'bed'].includes(x)); if (!special && !forTags(tags, scene).length) return null;
    seen.add(fx); const acts = forTags(tags, scene);
    /* QA9: a bed is long and flat: its tap target covers the whole mattress (a tap on its far end found nothing, near the head the clothes rail won) */
    const long = fx.ob && fx.ob.B ? Math.max(fx.ob.B[3] - fx.ob.B[0], fx.ob.B[4] - fx.ob.B[1]) : 0, bedHit = long >= 1.5 && (tags.includes('bed') || fx.ob.size[2] <= 1.1) ? Math.max(12, Math.round(long / 2 * U * 1.05 + 1)) : undefined;   /* also sofas and baths: long and low */
    return Object.assign({ label: !special && acts.length === 1 ? acts[0].name : LABEL[tags[0]] || 'Use', act: true, use: () => menu({ fx, tags }) }, bedHit ? { hit: bedHit } : null);
  });
  G.on('scene', s => { if (s && s.id === 'city') buildCity(s); })
  G.on('scene', s => { try { addSeats(s); } catch (e) { console.warn('seats: ' + e.message); } });
  G.on('activityEnd', () => { if (G.player) G.player.poseOpts = G.busy ? G.player.poseOpts : null; });
  /* seating (docs/reports/seating.md): whatever started the activity (this file, a showpiece, a Chapter), if another character already sits on that seat the player
     takes the nearest free seat instead (same piece first); venue-room customers are left out, they get up by themselves (sim/_crowd_rooms.js vacate) */
  G.on('activity', a => {
    const sc = G.scene, p = G.player; if (!a || !a.at || a.hide || a.anim === 'sleep' || !sc || !sc.fixtures) return;
    const taken = s => sc.ents.some(c => c !== p && !c.hidden && !c.isVehicle && !(c.isCitizen && sc.indoor) && (c.alpha === undefined || c.alpha > .5) && Math.hypot(c.x - s.x, c.y - s.y) < .3); if (!taken(a.at)) return;
    let best = null, bd = 3; for (const f of sc.fixtures) for (const s of f.seats || []) { if (s.stand || s.staff || s.lie || taken(s)) continue; const d = Math.hypot(s.x - a.at.x, s.y - a.at.y) + (Math.abs(f.x - a.at.x) < 1.6 && Math.abs(f.y - a.at.y) < 1.6 ? 0 : 1); if (d < bd) { bd = d; best = s; } }
    if (!best) return; a.at.x = p.x = best.x; a.at.y = p.y = best.y; a.at.z = p.zoff = best.z || 0; if (best.dir !== undefined) a.at.dir = p.dir = best.dir; if (best.z && p.pose !== 'sit' && !p.poseOpts) p.poseOpts = { seated: true };
  });
  /* a save made while seated restores the player where they sat (only in the lobby of their own building; elsewhere the game resumes at a door): step off the furniture */
  G.on('game:start', () => { const p = G.player, W = G.world; if (!p || !W || G.busy || !W.isBlocked(p.x, p.y)) return; const f = nearestFree(W, Math.floor(p.x * 2), Math.floor(p.y * 2), 6); if (f) { p.x = (f[0] + .5) / 2; p.y = (f[1] + .5) / 2; p.zoff = 0; p.z = W.heightAt(p.x, p.y); } });
  /* standing up: never left inside furniture (the spot the player sat down from can have been taken by a piece that moved, or the seat was reached from afar) */
  G.on('activityEnd', a => { const p = G.player, W = G.world; if (!a || !a.at || !p || !W || G.busy || !W.isBlocked(p.x, p.y)) return; const f = nearestFree(W, Math.floor(p.x * 2), Math.floor(p.y * 2), 6); if (f) { p.x = (f[0] + .5) / 2; p.y = (f[1] + .5) / 2; p.z = W.heightAt(p.x, p.y); } });
}
