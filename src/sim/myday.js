// MY DAY — the Ideas engine and the "what do I do next" API (owner msg 107, BIBLE direction update 21.2). Schedule store: src/sim/planner.js (G.planner).
// UI: src/ui/myday.js (the HUD button + the compact sheet + the first-time walk-through) and src/ui/phone_planner.js (the phone app "My Day").
//
// TWO DIFFERENT THINGS
//   MY SCHEDULE = G.planner entries: only what the player chose, plus what life puts there (work, family / story, booked tickets, enrolled classes, deliveries).
//   IDEAS       = everything they COULD add, gathered here from all the content and ranked for right now. Nothing becomes an entry until the player taps Add.
//
// IDEA  { id, key (stable across days, for "Not interested"), kind, cat (what the ranking learns on), title, why (one line), icon, placeId? | pos? {x,y,name},
//         t? (start, abs minute), end?, dur, fixed (true: it has its own clock time), price?, walk (minutes on foot), score, day, entryId?, eventId?, oppId?, npc?, blurb? }
//   kinds: pin (another system's suggestion) · big (one of the six city events) · event (calendar) · show (film / concert / play / game) · opp (an Opportunity
//          on offer) · need (a place that fixes a low need) · friend (someone who is free) · interest (your interests) · new (never been) · weather · class · coach
//
// RANKING (score, higher first; rebuilt at most once per game minute and cached):
//   base by kind (pin 90, big today 80, need 40..90 by how low, opp 62, event 52, show 50, weather 50, friend 48, interest 46, coach 44, new 42, class 40)
//   + starts soon (+12 within 90 min, +6 within 4 h, +8 already open)      - distance (walk minutes / 2.5, max 18)
//   - cannot afford (-30)   + free when short of money (+3)   + a sale (+6)
//   + matches an interest (+10) / a trait (+4..8)   + fixes a need that is getting low (+8..12)   + never been there (+5)   - been there a lot (-4)
//   + what the player taught it: every Add of a category +3 (max +12), every "Not interested" -6 (max -24); the dismissed idea itself stays away for 7 days
//   - added in the last 2 days (-15)   + a small stable shuffle per 6 hours so the list is not the same all day
//   top(n) then picks greedily with variety: one per category and per place first, at most two of a kind.
//
// STATE  G.state.myday = { v: 1, seen: 0 | 1 (walk-through shown), like: { cat: n }, no: { key: absDay }, last: { key: t }, sumDay, nudgeDay, n: { add, no, open } }
// API    G.myDay = {
//          ideas(opts?) -> [idea] ranked. opts: { n (default 5; 0 = all), day (abs day, default today), at (abs minute: "for this gap"), until, varied (default true) }
//          idea(id) -> idea | null        add(ideaId, time?) -> appt id | true | null   (time: abs minute; without it timed ideas keep their own time and open-ended
//                                         ones go on the day as "any time today")        dismiss(ideaId)  "Not interested"        undismiss(ideaId)
//          schedule() -> { next, travel, today: [appt], flex: [appt], tomorrow: [appt], chapter: row | null, goals: [goal], opps: [goal], free: [{ from, to }] }
//          gaps(day?) -> [{ from, to }] free stretches of 45+ min between 07:00 and 23:00        summary() -> the morning line
//          onAdd(fn) -> off        open(opts) / close() / addIdea(opts) / explain()  are filled in by src/ui/myday.js (Promises; see there)
//        }
// EVENTS 'myday:add'({ idea, apptId, oppId })   'myday:dismiss'(idea)   'myday:open'(opts)   'myday:close'   'myday:change' (the lists should re-render)
import { G } from '../core/game.js';
import { EVENTS } from '../data/calendar.js';
import { FAMILIES, FAMILY_OF } from '../data/skills_extra.js';
import { cityPos } from '../ui/phone_util.js';
import '../art/icons/myday.js';

export const order = 132;
const DAY = 1440, WALK = .215;
const safe = (f, d) => { try { const v = f(); return v === undefined || v === null ? d : v; } catch (e) { return d; } };
const fresh = () => ({ v: 1, seen: 0, like: {}, no: {}, last: {}, sumDay: -1, nudgeDay: -1, n: { add: 0, no: 0, open: 0 } });
const st = () => { let s = G.state.myday; if (!s || typeof s !== 'object') s = G.state.myday = fresh(); const f = fresh(); for (const k in f) if (s[k] === undefined) s[k] = f[k]; return s; };
const now = () => G.state.t, today = () => Math.floor(G.state.t / DAY);
const hh = t => { const m = ((Math.round(t) % DAY) + DAY) % DAY; return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return ((h >>> 0) % 10000) / 10000; };
const place = id => safe(() => G.places.get(id), null);
const money = () => safe(() => G.money.get(), safe(() => G.state.player.money, 0));
const need = k => safe(() => G.needs.get(k), 100);
const trait = id => safe(() => G.traits.has(id), false);
const visits = id => safe(() => G.state.traits.visits[id], 0) || 0;
const WD = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], WDL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const EV_BY_ID = Object.fromEntries(EVENTS.map(e => [e.id, e]));
let ver = 0, cache = new Map(), listeners = [], here = null;

/* ---------- small helpers ---------- */
const walkTo = p => (p && isFinite(p.x) ? Math.max(1, Math.round((Math.abs(p.x - here.x) + Math.abs(p.y - here.y)) * WALK)) : 0);
const walkText = w => (w <= 1 ? 'right here' : w + ' min walk');
const inRoom = id => { const sc = G.scene ? String(G.scene.id) : ''; return !!id && sc !== 'city' && (sc === id || sc === 'int:' + id || sc.endsWith(':' + id)); };
const bigIds = () => new Set(safe(() => G.cityEvents.list().map(e => e.id), []));
const interests = () => safe(() => G.skills.interests(), []);
const guideAll = () => safe(() => G.guide.all(), []);
const openAt = (e, t) => safe(() => G.guide.openNow(e, t), { open: null });
const sale = evId => { const e = EV_BY_ID[evId]; return !!(e && e.special && e.special.discounts && e.special.discounts.length); };
/* which interest family a piece of content belongs to (guide entries carry a chapter, a type and tags; shows a type) */
const FAM_RE = { food: /\beat\b|food|restaurant|diner|ramen|pizza|bakery|cafe|market|cook|tasting|chili|bbq|berries/, sport: /fitness|gym|swim|pool|natator|court|basketball|run\b|yoga|skate|sport|aerobic|race|meet\b/,
  music: /music|concert|band|open mic|jazz|karaoke|danc|symphony|busker|record/, art: /\barts?\b|gallery|museum|paint|sketch|photo|exhibit|studio|sculpt/, words: /library|book|playhouse|theat|comedy|poet|reading|lecture|\bplay\b|stage|film|cinema/,
  mind: /chess|puzzle|quiz|trivia|observator|planetar|science|logic/, games: /arcade|gaming|game night|pinball/, nature: /outdoors|garden|park\b|conservator|aquarium|pier|pond|beach|fishing|bird|blossom|harvest|lighthouse|lookout/,
  making: /hardware|homegoods|workshop|tool|electronic|craft|repair|maker/, fashion: /cloth|boutique|fashion|dept|tailor|thrift|salon|hair|style|sale\b/ };
function famOf(text) { text = String(text || '').toLowerCase(); for (const f in FAM_RE) if (FAM_RE[f].test(text)) return f; return null; }
const FAM_VERB = { food: 'Try', sport: 'A workout at', music: 'Music at', art: 'Look round', words: 'Browse', mind: 'A think at', games: 'Play at', nature: 'A breather at', making: 'Poke around', fashion: 'Window-shop at' };
const FAM_NAME = Object.fromEntries(FAMILIES.map(f => [f.id, f.name])), FAM_ICON = Object.fromEntries(FAMILIES.map(f => [f.id, f.icon]));
const TRAIT_FOR = { food: ['foodie', 6], music: ['music_lover', 8], words: ['bookworm', 8], sport: ['athletic', 8], games: ['gamer', 8], nature: ['green_thumb', 8], fashion: ['fashionista', 8], art: ['daydreamer', 4], mind: ['curious', 4], making: ['tinkerer', 8] };
const SHOW_CAT = t => (/film/i.test(t) ? 'film' : /concert|music|recital|symphony/i.test(t) ? 'music' : /play|stage|comedy|theat/i.test(t) ? 'stage' : /game|basket|match/i.test(t) ? 'sport' : 'show');

/* ---------- gathering ---------- */
/** everything already on the schedule (to leave those ideas out) */
function onSchedule(d0) {
  const L = safe(() => G.planner.list(d0 * DAY - 1, (d0 + 1) * DAY + 240), []), set = new Set();
  for (const a of L) { const d = a.data || {}; if (a.s >= 3) continue; if (d.idea) set.add(String(d.idea)); if (d.guide) set.add('g:' + d.guide); if (d.eventId) set.add('e:' + d.eventId); if (d.opp) set.add('opp:' + d.opp); if (d.cat) set.add('cat:' + d.cat); if (a.placeId) { set.add('pl:' + a.placeId + ':' + (a.flex ? 'flex' : a.t)); set.add('at:' + a.placeId); } set.add('t:' + String(a.title).toLowerCase()); }
  return set;
}
let won = { key: '', list: [] };
function whatsOn(d0) { const key = d0 + '|' + Math.floor(now() / 30) + '|' + ver; if (won.key !== key) won = { key, list: safe(() => G.guide.whatsOn(d0), []) }; return won.list; }

function gather(day, at) {
  const t0 = now(), d0 = today(), isToday = day === d0, T = at !== undefined ? at : isToday ? t0 : day * DAY + 9 * 60, out = [], have = onSchedule(day), big = bigIds(), seenEv = new Set();
  here = cityPos();
  const push = i => { if (have.has(i.id)) return; if (have.has('cat:' + i.cat)) i.again = 1; if (i.placeId && have.has('at:' + i.placeId) && !i.fixed) return; i.day = day; i.walk = i.walk !== undefined ? i.walk : walkTo(i.pos || place(i.placeId)); i.key = i.key || i.id; out.push(i); };
  /* 1. pinned suggestions from other systems */
  if (isToday) for (const p of safe(() => G.planner.pins(), [])) push({ id: 'pin:' + p.id, kind: 'pin', cat: 'pin', title: p.title, why0: 'They are expecting you', icon: 'ui.heart', placeId: p.placeId, t: p.t > t0 ? p.t : null, dur: p.dur, fixed: p.t > t0, pinId: p.id });
  /* 2. what's on: shows, films, concerts, games + calendar events (the six city events among them) */
  const perVenue = {};
  for (const w of whatsOn(d0)) {
    if (w.day !== day || w.t + w.dur <= T + 15) continue; const evId = w.kind === 'event' ? String(w.entryId).replace(/^event:/, '') : null;
    if (evId) seenEv.add(evId); if (have.has('g:' + w.entryId) || (evId && have.has('e:' + evId)) || have.has('t:' + String(w.title).toLowerCase())) continue;
    const isShow = w.kind === 'show', window = !isShow && w.dur >= 150, started = w.t <= T;
    if (isShow) { if (w.t < T + 5) continue; const k = w.placeId; perVenue[k] = (perVenue[k] || 0) + 1; if (perVenue[k] > 3) continue; }
    else if (!window && started && T - w.t > 20) continue;
    const isBig = !!evId && big.has(evId), ce = isBig ? safe(() => G.cityEvents.list().find(q => q.id === evId && q.day === day), null) : null, cat = isShow ? SHOW_CAT(w.type) : isBig ? 'festival' : famOf(w.title + ' ' + w.blurb) || 'event';
    push(Object.assign({ id: (isShow ? 'show:' : 'ev:') + w.id, key: isShow ? 'show:' + w.entryId : 'ev:' + evId, kind: isShow ? 'show' : isBig ? 'big' : 'event', cat, fam: isShow ? famOf(w.type + ' ' + w.title) : famOf(w.title + ' ' + w.blurb), title: w.title, venue: w.venue,
      icon: isShow ? (cat === 'film' ? 'myday.film' : cat === 'music' ? 'skill.music' : 'ui.star') : isBig ? 'myday.festival' : 'ui.star', placeId: w.placeId, t: w.t, end: w.t + w.dur, dur: isShow ? w.dur : Math.min(w.dur, 90), fixed: !window, window, price: w.price, entryId: w.entryId, eventId: evId, sale: evId ? sale(evId) : false, blurb: w.blurb }, ce ? { t: ce.t0, end: ce.t1, fixed: false, window: true, showT: ce.paradeT, why0: ce.paradeT > T ? `The parade is at ${hh(ce.paradeT)}` : 'The whole town is out' } : null));
  }
  for (const e of safe(() => G.planner.eventsOn(day), [])) {   /* calendar rows the guidebook has no page for */
    const evId = e.data && e.data.eventId; if (!evId || seenEv.has(evId) || e.t + e.dur <= T + 15 || have.has('e:' + evId) || have.has('t:' + String(e.title).toLowerCase())) continue; const p = e.placeId && place(e.placeId); if (!p) continue;
    const window = e.dur >= 150; if (!window && e.t <= T - 20) continue;
    push({ id: 'ev:' + evId + '@' + e.t, key: 'ev:' + evId, kind: big.has(evId) ? 'big' : 'event', cat: big.has(evId) ? 'festival' : famOf(e.title + ' ' + (e.data.blurb || '')) || 'event', fam: famOf(e.title + ' ' + (e.data.blurb || '')), title: e.title, venue: p.name, icon: big.has(evId) ? 'myday.festival' : 'ui.star',
      placeId: e.placeId, t: e.t, end: e.t + e.dur, dur: Math.min(e.dur, 90), fixed: !window, window, eventId: evId, sale: sale(evId), blurb: e.data.blurb });
  }
  /* 2b. a city event later this week (today's list only) */
  if (isToday && at === undefined) for (const ce of safe(() => G.cityEvents.list(), []).slice(0, 2)) { const dd = ce.day - d0; if (dd < 1 || dd > 4 || have.has('e:' + ce.id)) continue;
    push({ id: 'big:' + ce.id + '@' + ce.day, key: 'big:' + ce.id, kind: 'big', cat: 'festival', title: ce.name, icon: 'myday.festival', placeId: 'cev:' + ce.id, t: ce.paradeT || ce.t0, end: ce.t1, dur: 90, fixed: true, eventId: ce.id, ahead: dd, walk: 0 }); }
  if (!isToday || at !== undefined) { /* another day / a later gap: only things with a time of their own, plus places that will be open then (below) */ }
  /* 3. Opportunities on offer */
  if (isToday) for (const o of safe(() => G.opps.list(), [])) { if (o.st !== 0 || have.has('opp:' + o.id)) continue; if (at !== undefined && o.until && o.until < at) continue;
    push({ id: 'opp:' + o.id, kind: 'opp', cat: 'opp', title: o.title, text: o.text, icon: 'app.opps', placeId: o.placeId && place(o.placeId) ? o.placeId : null, t: o.from || null, end: o.until || null, dur: 45, fixed: false, oppId: o.id, reward: o.rewardText || '', srcName: o.srcName || '' }); }
  /* 4. a place for a need that is getting low (now only) */
  if (isToday && at === undefined) {
    const NEED = { hunger: ['A bite at', 'You are hungry', 'need.hunger'], energy: ['A pick-me-up at', 'You are flagging', 'need.energy'], hygiene: ['Freshen up at', 'You could do with a wash', 'need.hygiene'], fun: ['Some fun at', 'You are bored', 'need.fun'], social: ['Company at', 'You could use some company', 'need.social'],
      comfort: ['Get cosy at', 'You could use some comfort', 'need.comfort'], outdoors: ['Fresh air at', 'You have been indoors a while', 'need.outdoors'], inspiration: ['Something new at', 'You are short of inspiration', 'need.inspiration'] };
    for (const k in NEED) { const v = need(k); if (v >= 42) continue; const soft = ['comfort', 'outdoors', 'inspiration'].includes(k);
      const rows = soft ? safe(() => G.needsExtra.fix(k, 3), []) : safe(() => G.nav.find(k, 3), []), r = rows.find(q => q && q.open !== false && typeof q.id === 'string' && !inRoom(q.id)) || null; if (!r) continue;
      const home = /^home:/.test(r.id) || r.home, HOME = { hunger: 'Cook something at home', energy: 'Head home and rest', hygiene: 'A shower at home', fun: 'Put your feet up at home', comfort: 'Home, where it is cosy' };
      push({ id: 'need:' + k + ':' + r.id, key: 'need:' + k, kind: 'need', cat: 'need', needId: k, needV: v, title: home && HOME[k] ? HOME[k] : `${NEED[k][0]} ${String(r.name).replace(/ \(.*\)$/, '')}`, why0: NEED[k][1], icon: NEED[k][2], placeId: r.id, dur: 45, fixed: false, walk: place(r.id) ? undefined : Math.max(1, Math.round((r.d || 0) * WALK)) }); }
  }
  /* 5. friends and family who are free (now only) */
  if (isToday && at === undefined) {
    const ids = safe(() => G.social.known(), []).filter(id => safe(() => G.social.isFamily(id), false) || safe(() => G.social.tierInfo(id).idx, 0) >= 1);
    let n = 0; for (const id of ids.sort((a, b) => hash(a + d0) - hash(b + d0))) { if (n >= 2) break;
      const w = safe(() => G.social.whereIs(id), null), c = safe(() => G.social.npc(id), null), sch = safe(() => G.social.schedule(id), null); if (!w || !c || !w.placeId || !place(w.placeId) || inRoom(w.placeId)) continue;
      if (sch && /type|lift|work|serve|cook|sleep|stock|clean|sweep|teach|drive/.test(sch.anim || '')) continue; const hf = (t0 % DAY) / 60; if (hf < 8 || hf > 21.5) continue;
      if (have.has('friend:' + id)) continue; const nm = c.short || c.name, pn = place(w.placeId).name, atHome = /^home:/.test(w.placeId);
      n++; push({ id: 'friend:' + id, kind: 'friend', cat: 'people', title: atHome ? `Drop in on ${nm}` : `Say hi to ${nm} at ${pn}`, why0: atHome ? `${nm} is home just now` : `${nm} is there just now`, icon: safe(() => G.social.isFamily(id), false) ? 'rel.family' : 'rel.friend', placeId: w.placeId, dur: 60, fixed: false, npc: id }); }
  }
  /* 6-8. places: your interests, somewhere new, the weather. One pass over the guidebook. */
  {
    const L = guideAll().filter(e => e.kind === 'place' && !e.parent && e.chapter !== 'transit' && e.chapter !== 'services' && e.placeId && isFinite(e.x) && !/^home:/.test(e.placeId) && !inRoom(e.placeId) && !/lobby|workplace|clinic|bank|office/i.test(e.type || '') && !/^ch_/.test(e.placeId));
    const hf0 = (T % DAY) / 60, openOk = e => { const o = openAt(e, T).open; return o === true || (o === null && hf0 >= 7 && hf0 < 22); }, blk = d0 + '|' + Math.floor(T / 360), ints = interests(), fams = ints.length ? ints : FAMILIES.map(f => f.id).sort((a, b) => hash(a + d0) - hash(b + d0)).slice(0, 2);
    const text = e => (e.chapter + ' ' + e.type + ' ' + e.title + ' ' + (e.tags || []).join(' ')).toLowerCase(), near = (a, b) => walkTo(a) - walkTo(b) + (visits(a.placeId) - visits(b.placeId)) * 2, among = (C, k, n = 5) => { C = C.sort(near).slice(0, n); return C.length ? C[Math.floor(hash(k + blk) * C.length)] : null; };   /* one of the few nearest, a different one every few hours */
    const hf = (T % DAY) / 60, used = new Set();
    for (const f of fams) { const c = among(L.filter(e => FAM_RE[f] && FAM_RE[f].test(text(e)) && !(f === 'nature' && /chess|playground|skate|cat alley/.test(text(e))) && openOk(e) && !have.has('pl:' + e.placeId + ':flex') && !used.has(e.placeId)), 'int' + f); if (!c) continue; used.add(c.placeId);
      push({ id: 'int:' + f + ':' + c.placeId, key: 'int:' + c.placeId, kind: 'interest', cat: 'int:' + f, fam: f, title: `${FAM_VERB[f] || 'Visit'} ${c.title}`, why0: ints.length ? `You like ${FAM_NAME[f]}` : c.type, icon: FAM_ICON[f] || 'ui.pin', placeId: c.placeId, dur: 60, fixed: false, entryId: c.id, blurb: c.blurb, guessed: !ints.length }); }
    const fresh0 = among(L.filter(e => !safe(() => G.guide.known(e), true) && openOk(e) && !used.has(e.placeId)), 'new', 4) || among(L.filter(e => !visits(e.placeId) && openOk(e) && !used.has(e.placeId) && e.chapter !== 'shop'), 'new', 4);
    if (fresh0) { used.add(fresh0.placeId); push({ id: 'new:' + fresh0.placeId, key: 'new:' + fresh0.placeId, kind: 'new', cat: 'new', fam: famOf(text(fresh0)), title: `Somewhere new: ${fresh0.title}`, why0: `${fresh0.type || 'A place'} you have not been to`, icon: 'myday.new', placeId: fresh0.placeId, dur: 60, fixed: false, entryId: fresh0.id, blurb: fresh0.blurb }); }
    const wk = isToday ? String(safe(() => (G.weather.current() || {}).kind, G.state.weather) || '') : String(safe(() => G.weather.daySummary(day - d0).kind, '') || ''), wet = /rain|storm|snow/.test(wk), clear = /clear|sun/.test(wk);
    const pick = re => among(L.filter(e => re.test(text(e)) && openOk(e) && !used.has(e.placeId)), 'wx', 3);
    let wx = null;
    if (clear && (hf >= 19.5 || hf < 2) && place('observatory') && !inRoom('observatory') && openAt(safe(() => G.guide.get('observatory'), null), T).open !== false) wx = { placeId: 'observatory', title: 'A clear night: the Observatory', why0: 'A good night for stars', icon: 'myday.stars' };
    else if (wet && hf >= 8 && hf < 21) { const c = pick(/cinema|museum|aquarium|library|conservator|gallery|arcade/); if (c) wx = { placeId: c.placeId, title: `A rainy day: ${c.title}`, why0: 'Dry and warm inside', icon: 'weather.rain', entryId: c.id }; }
    else if (clear && hf >= 8 && hf < 19) { const c = pick(/park|pier|beach|garden|pond|lookout|green|river/); if (c) wx = { placeId: c.placeId, title: `A fine day: ${c.title}`, why0: 'Lovely out', icon: 'weather.sun', entryId: c.id }; }
    if (wx && !have.has('pl:' + wx.placeId + ':flex')) push(Object.assign({ id: 'wx:' + wx.placeId, key: 'wx:' + wx.placeId, kind: 'weather', cat: 'wx', dur: 60, fixed: false }, wx));
  }
  /* 9. the University: a class to take */
  if (isToday && at === undefined && G.university && place('university') && !safe(() => G.university.enrolled().length, 0)) {
    const cs = safe(() => G.university.courses(), []).filter(c => !c.cert), ints = interests(), c = cs.find(q => ints.includes(FAMILY_OF[q.skill])) || cs[Math.floor(hash('uni' + d0) * cs.length)];
    if (c && safe(() => G.university.officeOpen(), true)) push({ id: 'uni:' + c.id, key: 'uni', kind: 'class', cat: 'learn', fam: FAMILY_OF[c.skill], title: `Take a class: ${c.name}`, why0: 'Sign up at the Registrar', icon: 'myday.class', placeId: 'university', dur: 45, fixed: false, price: typeof c.price === 'object' ? c.price.pay : c.price });
  }
  /* 10. a coach who is out today */
  if (isToday && at === undefined) { const ints = interests(), cs = safe(() => G.skillplay.coaches(), []).filter(c => c.here && !c.doneToday && isFinite(c.x)).sort((a, b) => (ints.includes(FAMILY_OF[b.skill]) ? 1 : 0) - (ints.includes(FAMILY_OF[a.skill]) ? 1 : 0) || hash(a.id + d0) - hash(b.id + d0))[0];
    if (cs) push({ id: 'coach:' + cs.id, key: 'coach:' + cs.id, kind: 'coach', cat: 'learn', fam: FAMILY_OF[cs.skill], title: `A lesson with ${cs.short || cs.name}`, why0: cs.role, icon: 'skill.' + cs.skill, pos: { x: cs.x, y: cs.y, name: cs.short || cs.name }, dur: 45, fixed: false, price: cs.fee, end: day * DAY + cs.hours[1] * 60 }); }
  return out;
}

/* ---------- ranking ---------- */
const BASE = { pin: 90, big: 80, opp: 62, event: 52, show: 50, weather: 50, friend: 48, interest: 46, coach: 44, new: 42, class: 40 };
function rank(i, T, isToday) {
  const s = st(), cash = money(), ints = interests(), bits = [];
  let sc = i.kind === 'need' ? 40 + (42 - i.needV) * 1.4 : i.kind === 'big' && i.ahead ? 46 - i.ahead * 5 : BASE[i.kind] || 40;
  /* time */
  if (i.t && isToday && !i.ahead) { const m = i.t - T;
    if (m <= 0 && i.window) { sc += 8; bits.push(`On now, till ${hh(i.end)}`); }
    else if (m <= 90) { sc += 12; bits.push(m <= 0 ? 'Starting now' : `Starts in ${Math.round(m)} min`); }
    else { if (m <= 240) sc += 6; bits.push((Math.floor((i.t % DAY) / 60) >= 17 ? 'Tonight at ' : 'Today at ') + hh(i.t)); }
    if (i.fixed && i.walk > m + 10) sc -= 25; }
  if (i.fixed && i.t && safe(() => G.planner.conflicts(i.t, Math.min(i.dur || 60, 90)), []).length) { sc -= 22; i.clash = 1; }   /* you are busy then */
  else if (i.ahead) bits.push(i.ahead === 1 ? `Tomorrow at ${hh(i.t)}` : `${WDL[Math.floor(i.t / DAY) % 7]} at ${hh(i.t)}`);
  else if (i.t && !isToday) bits.push(`${hh(i.t)}${i.window ? ' to ' + hh(i.end) : ''}`);
  if (i.kind === 'opp') { if (i.end && isToday) { const left = i.end - T; if (left < 180) sc += 8; bits.push(i.t && i.t > T ? `From ${hh(i.t)}` : `Until ${hh(i.end)}${Math.floor(i.end / DAY) > Math.floor(T / DAY) ? ' tomorrow' : ''}`); } if (i.reward) bits.push(i.reward); }
  if (i.why0) bits.unshift(i.why0);
  if (i.venue && !String(i.title).includes(i.venue)) bits.push(i.venue);
  /* distance */
  if (i.walk && isToday && !i.ahead) { sc -= Math.min(18, i.walk / 2.5); bits.push(walkText(i.walk)); }
  /* money */
  if (i.price) { if (i.price > cash) { sc -= 30; i.poor = true; } else if (cash < i.price * 3) sc -= 6; bits.push('$' + i.price); } else if (cash < 50 && i.kind !== 'need') sc += 3;
  if (i.sale) { sc += 6; bits.push('a deal today'); if (trait('thrifty')) sc += 6; }
  /* interests and traits */
  const fam = i.fam || null;
  if (fam && ints.includes(fam) && i.kind !== 'interest') { sc += 10; i.liked = fam; }
  if (fam && TRAIT_FOR[fam] && trait(TRAIT_FOR[fam][0])) sc += TRAIT_FOR[fam][1];
  if (i.guessed) sc -= 6;
  const hf = ((i.t || T) % DAY) / 60;
  if (trait('night_owl') && hf >= 20) sc += 5; if ((trait('early_bird') || trait('morning_person')) && hf < 10) sc += 5;
  if (i.kind === 'new' && (trait('curious') || trait('wanderer'))) sc += 8; if (trait('homebody') && i.walk > 25) sc -= 4;
  if (i.cat === 'people') sc += trait('outgoing') ? 6 : trait('shy') ? -6 : 0; if (i.cat === 'stage' && trait('stage_struck')) sc += 8;
  /* needs that are getting low */
  if (isToday) { if (need('fun') < 50 && /show|event|big|interest|coach/.test(i.kind)) sc += 8; if (need('social') < 50 && (i.cat === 'people' || i.kind === 'big' || i.kind === 'event')) sc += 10;
    if (need('hunger') < 50 && fam === 'food' && i.kind !== 'need') sc += 8; if (need('outdoors') < 50 && fam === 'nature') sc += 8; if (need('inspiration') < 50 && (fam === 'art' || i.kind === 'show' || i.kind === 'new')) sc += 8; }
  /* never been / been a lot */
  if (i.placeId && i.kind !== 'need' && i.kind !== 'friend') { const v = visits(i.placeId); if (!v) sc += 5; else if (v > 5) sc -= 4; }
  /* what the player taught it */
  const lk = s.like[i.cat] || 0; sc += Math.max(-24, Math.min(12, lk * 3));
  const la = s.last[i.key]; if (la !== undefined && T - la < 2 * DAY) sc -= 15;
  if (i.again) sc -= 12;   /* one of that sort is on the day already */
  sc += (hash(i.key + '|' + Math.floor(T / 360)) - .5) * 6;
  i.score = Math.round(sc * 10) / 10; i.why = bits.filter(Boolean).slice(0, 3).join(' · ');
  return i;
}
function build(day, at, until) {
  const key = [Math.floor(now()), ver, day, at, until, G.scene && G.scene.id].join('|'); let L = cache.get(key); if (L) return L;
  if (cache.size > 12) cache.clear();
  const s = st(), d0 = today(), isToday = day === d0, T = at !== undefined ? at : isToday ? now() : day * DAY + 9 * 60;
  L = gather(day, at).filter(i => !(s.no[i.key] !== undefined && d0 - s.no[i.key] < 7)).filter(i => until === undefined || !i.fixed || (i.t >= T - 10 && i.t + Math.min(i.dur, 60) <= until + 30)).filter(i => until === undefined || !i.window || i.t < until)
    .map(i => rank(i, T, isToday)).sort((a, b) => b.score - a.score);
  cache.set(key, L); return L;
}
/** greedy pick with variety */
function varied(L, n) {
  const out = [], cats = {}, kinds = {}, places = {};
  for (const pass of [0, 1]) for (const i of L) { if (out.length >= n) break; if (out.includes(i)) continue; const pk = i.placeId || i.id;
    if (!pass && (cats[i.cat] || places[pk] || (kinds[i.kind] || 0) >= 2)) continue; if (pass && (places[pk] || 0) >= 2) continue;
    out.push(i); cats[i.cat] = 1; kinds[i.kind] = (kinds[i.kind] || 0) + 1; places[pk] = (places[pk] || 0) + 1; }
  return out.sort((a, b) => b.score - a.score);
}
export function ideas(o = {}) {
  const day = o.day !== undefined ? o.day : o.at !== undefined ? Math.floor(o.at / DAY) : today(), at = o.at !== undefined && o.at <= now() + 15 ? undefined : o.at;   /* a gap that starts now is simply "now" */
  const L = build(day, at, o.until), n = o.n === undefined ? 5 : o.n;
  if (!n) return o.varied ? varied(L, L.length) : L.slice(); return o.varied === false ? L.slice(0, n) : varied(L, n);
}
export function idea(id) { for (const L of cache.values()) { const i = L.find(x => x.id === id); if (i) return i; } for (let d = today(); d < today() + 7; d++) { const i = build(d).find(x => x.id === id); if (i) return i; } return null; }

/* ---------- acting on an idea ---------- */
const bump = () => { ver++; cache.clear(); G.emit('myday:change'); };
/** default clock time for an idea that has a window but no start of its own (a market, a fair): as soon as you can get there */
export function defaultTime(i, from) { const T = Math.max(from === undefined ? now() : from, now()); if (i.showT && T + (i.walk || 0) < i.showT - 25) return Math.max(i.t, i.showT - 20);   /* a city event: be there for the parade */ return i.fixed ? i.t : i.window || i.t ? Math.max(i.t || 0, Math.ceil((T + (i.walk || 0) + 5) / 5) * 5) : null; }
export function add(id, time) {
  const i = typeof id === 'object' ? id : idea(id); if (!i || !G.planner) return null; const s = st(); let apptId = null, oppId = null;
  if (i.kind === 'opp') { if (!safe(() => G.opps.accept(i.oppId), false)) return null; oppId = i.oppId; apptId = safe(() => G.opps.get(i.oppId).appt, null) || true; }
  else {
    const t = time !== undefined ? time : i.fixed || i.window || (i.day !== today()) ? (i.fixed ? i.t : i.window ? defaultTime(i) : i.day * DAY + 11 * 60) : undefined, timed = t !== undefined && t !== null;
    const o = { title: i.title.replace(/^(Somewhere new|A rainy day|A fine day|A clear night): /, m => (m.startsWith('Somewhere') ? 'Visit ' : '')).replace(/^the Observatory$/, 'The Observatory'), placeId: i.placeId || null, kind: i.kind === 'show' || i.kind === 'event' || i.kind === 'big' ? 'event' : i.npc ? 'friend' : 'personal',
      dur: timed ? (i.end && !i.fixed ? Math.max(30, Math.min(i.dur, i.end - t)) : i.dur) : 60, src: 'mine', chosen: true,
      data: Object.assign({ idea: i.id, cat: i.cat }, i.entryId && i.t ? { guide: i.entryId } : null, i.eventId ? { eventId: i.eventId } : null, i.npc ? { npc: i.npc } : null, i.blurb ? { blurb: i.blurb } : null, i.pos ? { pos: i.pos } : null) };
    if (timed) { o.t = t; o.remind = t - now() > 50 ? 30 : 0; } else o.flex = true;
    if (i.pinId) safe(() => G.planner.remove(i.pinId));
    apptId = G.planner.add(o); if (!apptId) return null;
    if (timed && t - now() < (i.walk || 0) + 20) safe(() => G.planner.update(apptId, { lv: 1 }));   /* they just chose it: no "leave now" a second later */
  }
  s.like[i.cat] = Math.min(6, (s.like[i.cat] || 0) + 1); s.last[i.key] = Math.floor(now()); s.n.add++;
  bump(); const ev = { idea: i, apptId, oppId }; G.emit('myday:add', ev); for (const f of listeners.slice()) safe(() => f(ev));
  return apptId;
}
export function dismiss(id) { const i = typeof id === 'object' ? id : idea(id); if (!i) return false; const s = st(); s.no[i.key] = today(); s.like[i.cat] = Math.max(-8, (s.like[i.cat] || 0) - 2); s.n.no++;
  if (i.kind === 'opp') { /* an Opportunity stays on offer in its own app; My Day just stops suggesting it */ } if (i.pinId) safe(() => G.planner.remove(i.pinId)); bump(); G.emit('myday:dismiss', i); return true; }
export function undismiss(i) { if (!i) return false; const s = st(); if (s.no[i.key] === undefined) return false; delete s.no[i.key]; s.like[i.cat] = (s.like[i.cat] || 0) + 2; s.n.no--; bump(); return true; }
export const onAdd = fn => { listeners.push(fn); return () => { listeners = listeners.filter(f => f !== fn); }; };

/* ---------- the schedule, as My Day shows it ---------- */
const alive = a => !a.event && a.s !== 3 && a.s !== 4 && a.t + (a.dur || 60) > now() && !(a.data && a.data.beat && safe(() => G.story.beat(a.data.beat).st, '') === 'done');
export function gaps(day = today()) {
  const d0 = day * DAY, from = Math.max(d0 + 7 * 60, day === today() ? Math.ceil(now() / 5) * 5 : 0), to = d0 + 23 * 60, out = [];
  const L = safe(() => G.planner.list(d0, d0 + DAY + 1), []).filter(a => !a.flex && a.s !== 4).sort((a, b) => a.t - b.t); let c = from;
  for (const a of L) { if (a.t - c >= 45) out.push({ from: c, to: Math.min(a.t, to) }); c = Math.max(c, a.t + a.dur); }
  if (to - c >= 45) out.push({ from: c, to }); return out.filter(g => g.to - g.from >= 45);
}
export function schedule() {
  const P = G.planner, t = now(), d0 = today() * DAY, L = safe(() => P.list(t - 600, d0 + 2 * DAY + 240), []).filter(alive);
  const todayL = L.filter(a => !a.flex && a.t < d0 + DAY), flex = L.filter(a => a.flex), tomorrow = L.filter(a => !a.flex && a.t >= d0 + DAY && a.t < d0 + 2 * DAY);
  let next = safe(() => P.next(), null); if (next && !alive(next)) next = todayL[0] || flex[0] || null;
  const all = safe(() => G.goals.list(), []), ch = safe(() => G.chapters.row(), null);
  return { next, travel: next ? safe(() => P.travelTo(next), null) : null, today: todayL, flex, tomorrow, chapter: ch || (all.find(g => g.id === 'chapter' && !g.done) ? { text: all.find(g => g.id === 'chapter').text, stub: true } : null),
    goals: all.filter(g => g.group !== 'opportunity' && g.id !== 'chapter'), opps: all.filter(g => g.group === 'opportunity'), free: gaps() };
}

/* ---------- the morning line + one gentle idea later in the day ---------- */
const span = a => { const h = t => { const m = Math.round(t) % DAY, k = Math.floor(m / 60) % 12 || 12; return m % 60 ? k + ':' + String(m % 60).padStart(2, '0') : String(k); }; return `${h(a.t)} to ${h(a.t + a.dur)}`; };
const count = n => (['no', 'one', 'two', 'three', 'four', 'five'][n] || n) + (n === 1 ? ' idea' : ' ideas');
export function summary() {
  const sc = schedule(), d0 = today() * DAY, parts = sc.today.slice(0, 3).map(a => (a.kind === 'work' ? 'work ' + span(a) : `${a.title} at ${hh(a.t)}`));
  const g = sc.free.slice().sort((a, b) => (b.to - b.from) - (a.to - a.from))[0], mid = g ? ((g.from + g.to) / 2 - d0) / 60 : 0, when = !sc.today.length ? '' : mid < 12 ? 'this morning' : mid < 17 ? 'this afternoon' : 'this evening';
  const L = g ? ideas({ n: 3, at: sc.today.length ? Math.max(g.from, now()) : undefined, until: sc.today.length ? g.to : undefined }) : [], top = L[0];
  const big = ideas({ n: 0 }).find(i => i.kind === 'big' && !i.ahead), wk = String(safe(() => G.weather.daySummary(0).kind, '') || ''), wx = { rain: 'Rain about.', storm: 'Storms about.', snow: 'Snow today.' }[wk] || '';
  const top2 = L.find(i => i.kind !== 'big') || null, clean = x => x.title.replace(/^(Somewhere new|A rainy day|A fine day|A clear night): /, '') + (x.fixed && x.t ? ' at ' + hh(x.t) : '');
  let text = big ? `${big.title} is on today${big.t > now() ? ', from ' + hh(big.t) : ''}. ` : '';
  text += parts.length ? 'On your day: ' + parts.join(', ') + (sc.today.length > 3 ? ' and more' : '') + '.' : big ? 'Nothing else is on your day.' : 'Nothing on your day yet. It is all yours.';
  if (L.length) { const c = count(L.length); text += ` ${when ? 'Free ' + when + ': ' + c : c[0].toUpperCase() + c.slice(1) + ' to start you off'}${top2 ? ', like ' + clean(top2) : ''}.`; }
  if (wx) text += ' ' + wx; if (sc.chapter && !sc.chapter.stub && /open|paused/.test(sc.chapter.state || '')) text += ` ${sc.chapter.text} is there whenever you're ready.`;
  return { text, ideas: L, free: g || null };
}
function morning() {
  const s = st(), d = today(), hf = (now() % DAY) / 60; if (s.sumDay === d || hf < 5 || hf >= 12 || !G.started || G.cutscene || safe(() => G.needs.sleeping, false) || (G.busy && /sleep/i.test(G.busy.label || '')) || safe(() => G.chapters.active(), false)) return;
  if (safe(() => !!G.intro.active, false)) return;
  s.sumDay = d; for (const k in s.no) if (d - s.no[k] > 14) delete s.no[k]; for (const k in s.last) if (now() - s.last[k] > 3 * DAY) delete s.last[k];
  const sm = summary(); safe(() => G.phone.notify({ app: 'planner', title: 'My Day · Good morning', text: sm.text, icon: 'ui.calendar', priority: 'normal', data: { myday: 1 } }));
}
function evening() {
  const s = st(), d = today(), hf = (now() % DAY) / 60; if (s.nudgeDay === d || hf < 15 || hf >= 19.5 || !G.started || G.cutscene || G.busy || safe(() => G.chapters.active(), false) || safe(() => !!G.intro.active, false)) return;
  const t = now(); if (safe(() => G.planner.conflicts(t + 60, 300), []).length) { s.nudgeDay = d; return; }   /* the evening is spoken for */
  const i = ideas({ n: 0 }).find(x => x.fixed && x.t - t >= 75 && x.t - t <= 300 && !x.poor && x.score >= 52 && (s.like[x.cat] || 0) >= 0); if (!i) return;
  s.nudgeDay = d; safe(() => G.phone.notify({ app: 'planner', title: 'My Day · An idea for tonight', text: `${i.title}, ${hh(i.t)}${i.venue ? ' at ' + i.venue : ''}. Add it to your day if you fancy it.`, icon: 'ui.star', priority: 'low', data: { myday: 1, tab: 'ideas', idea: i.id } }));
}

export function init() {
  G.defineState('myday', fresh);
  const api = { ideas, idea, add, dismiss, undismiss, schedule, gaps, summary, onAdd, defaultTime, state: st, hh,
    /* filled in by ui/myday.js; harmless before that */
    open: o => { safe(() => G.phone.open('planner', o)); return Promise.resolve(false); }, close() { }, explain() { }, addIdea: o => api.open(o) };
  G.myDay = api;
  for (const ev of ['appt:add', 'appt:remove', 'appt:done', 'appt:missed', 'appt:start', 'appt:change', 'appt:pin', 'appt:unpin', 'opps:change', 'goals:change', 'chapters:change', 'load', 'day', 'scene', 'weather', 'skill:interests']) G.on(ev, () => { ver++; cache.clear(); G.emit('myday:change'); });
  G.on('load', () => { st(); });
  let acc = 0; G.on('minutes', d => { acc += d; if (acc < 10) return; acc = 0; morning(); evening(); });
  G.on('activityEnd', () => setTimeout(() => safe(() => morning()), 1500));
}
