// The three gentle needs: Comfort, Outdoors, Inspiration (Wave C; BIBLE direction update 2 "Needs drive errands").
// They are ordinary entries of data NEEDS (flag `soft`), so G.needs.get/add/set/band and the HUD work as for the other six; this module is
// what MOVES them: where you are (indoors / in the street / in a park / at home), what you are doing (SOFT_ACT) and what you come across
// (new places, exhibits, shows, recipes, dishes). Tuning: SOFT / SOFT_ACT / SOFT_ACT_RULES in src/data/needs.js. Dev mode's freeze (G.dev.frozen)
// stops every drift here, like the clock decay in needs.js.
//
// State G.state.needsx = { d (abs day of the daily caps), disc, det, seen: { visitKey: day }, tried: { dishId: 1 }, cooked: { recipeId: 1 } }
//
// G.needsExtra
//   homeComfort() -> 0..100   what Comfort settles at in your home right now (cleanliness + cosiness)        comfortParts() -> { base, clean, cosy }
//   inPark() -> bool          is the player near a park / pier / beach / lookout / river walk right now
//   rates() -> { comfort, outdoors, inspiration } points per hour at this moment (debug + the Wellness app's little arrows)
//   fix(needId, n = 3) -> [{ id, name, d, open }]   nearest places that lift a gentle need (the HUD's "where can I fix this?" chooser)
//   inspire(points, why?)     add Inspiration (other systems may call it; Opportunities do)
//   greens() -> [{ x, y, name, id }]   the park-like spots
// Events: 'needsx:inspire'(points, why), 'needsx:newplace'(placeId), 'needsx:newcook'(recipeId) (a recipe cooked for the first time).
import { G } from '../core/game.js';
import { SOFT, SOFT_ACT, SOFT_ACT_RULES } from '../data/needs.js';
import { ACTIVITY_BY_ID } from '../data/activities.js';
import { ITEM_BY_ID } from '../data/items.js';
import '../art/icons/needs_extra.js';

export const order = 97;
const safe = (f, d) => { try { const v = f(); return v === undefined || v === null ? d : v; } catch (e) { return d; } };
const O = SOFT.outdoors, I = SOFT.inspiration, C = SOFT.comfort;
let S = null, greenList = null, parkCache = { t: -1, v: false };
const fresh = () => ({ d: -1, disc: 0, det: 0, seen: {}, tried: {}, cooked: {} });
const day = () => Math.floor(G.state.t / 1440);
const roll = () => { const d = day(); if (S.d !== d) { S.d = d; S.disc = 0; S.det = 0; for (const k in S.seen) if (S.seen[k] < d - 1) delete S.seen[k]; } };
const N = () => G.needs;
const frozen = () => !!(G.dev && G.dev.frozen);

/* ---------- where am I ---------- */
const GREEN_RE = /pond|river|lookout|park|falls|green|pier|beach|garden|meadow|bandstand|playground|shrine|gull point|wheel|quay|plaza|square/i;
function greens() {
  if (greenList) return greenList; const out = [];
  for (const p of safe(() => G.places.list(), [])) { if (!p || !isFinite(p.x)) continue; if (p.kind === 'spot' ? !/plumber|skate|cat alley|runway/i.test(p.name) : p.kind === 'landmark' && GREEN_RE.test(p.name) && !/^lm:(home|station)/.test(p.id)) out.push({ x: p.x, y: p.y, name: p.name, id: p.id }); }
  if (out.length) greenList = out; return out;
}
function inPark() {
  if (!G.scene || G.scene.id !== 'city') return false; const t = Math.floor(G.state.t); if (parkCache.t === t) return parkCache.v;
  const p = G.player, r = O.parkRadius; let v = false; for (const g of greens()) if (Math.abs(g.x - p.x) < r && Math.abs(g.y - p.y) < r && Math.hypot(g.x - p.x, g.y - p.y) < r) { v = true; break; }
  parkCache = { t, v }; return v;
}
const isHome = () => safe(() => G.housing.isHome(), false);
function comfortParts() {
  const clean = safe(() => G.supplies.clean(), 70), amb = safe(() => G.housing.ambience(), 0);
  return { base: C.base, clean: clean * C.cleanShare, cosy: Math.min(C.cosyMax, amb * C.cosyPer) };
}
const homeComfort = () => { const p = comfortParts(); return Math.max(0, Math.min(100, Math.round(p.base + p.clean + p.cosy))); };
/** the comfort level of the room you are in, or null when the place has none (streets, shops) */
function comfortHere() {
  const sid = G.scene ? String(G.scene.id) : ''; if (isHome()) return homeComfort();
  if (/^int:hotel_room/.test(sid)) return C.hotelRoom; if (/^int:home:(sibling|grandma|friend)/.test(sid)) return C.friendHome; return null;
}
function actFx() {
  const a = safe(() => G.activities.current(), null); if (!a || !a.id) return null;
  if (SOFT_ACT[a.id]) return SOFT_ACT[a.id];
  const def = a.def || ACTIVITY_BY_ID[a.id] || {}, s = a.id + ' ' + (def.name || '') + ' ' + (def.tag || '');
  for (const r of SOFT_ACT_RULES) if (r.re.test(s)) return r.fx;
  return null;
}
function rates() {
  const n = N(), asleep = !!(n && n.sleeping), out = { comfort: 0, outdoors: 0, inspiration: 0 }; if (!n || !G.scene) return out;
  /* outdoors */
  if (G.scene.indoor) { let r = asleep ? O.asleep : O.indoors; if (isHome() && safe(() => G.housing.current().home.perk.effect.homeViewpoint, false)) r *= O.terraceHomeMult; out.outdoors = r; }
  else { const k = safe(() => G.weather.current().kind, null) || G.state.weather || 'clear'; let r = (inPark() ? O.park : O.outside) * (O.weather[k] === undefined ? 1 : O.weather[k]); if (G.env && G.env.night) r *= O.night; out.outdoors = r; }
  /* inspiration */
  out.inspiration = asleep ? I.asleep : I.awake;
  /* comfort: towards the room's level at home (or a hotel room / family home), slowly down elsewhere */
  const lv = comfortHere(), cur = n.get('comfort');
  if (lv !== null) out.comfort = lv > cur ? Math.min(C.toward, (lv - cur) * 4) : Math.max(-C.toward, (lv - cur) * 4); else out.comfort = asleep ? C.asleepAway : C.away;
  const fx = actFx(); if (fx) for (const k in fx) out[k] += fx[k];
  return out;
}
function tick(dm) {
  const n = N(); if (!n || !S || frozen() || !G.scene) return; roll();
  const r = rates(), h = dm / 60, lv = comfortHere();
  for (const k of ['outdoors', 'inspiration', 'comfort']) {
    let d = r[k] * h; if (!d) continue;
    if (k === 'comfort' && lv !== null) { const cur = n.get('comfort'), fxc = (actFx() || {}).comfort || 0, drift = (r.comfort - fxc) * h; d = (Math.abs(drift) > Math.abs(lv - cur) ? lv - cur : drift) + fxc * h; }   /* never overshoot the room's level */
    if (d) n.add(k, d);
  }
  if (!n.sleeping && O.energyTrickle && n.band('outdoors').id === 'full') n.add('energy', O.energyTrickle * h);
}

/* ---------- inspiration from what you come across ---------- */
function inspire(pts, why) { const n = N(); if (!n || !(pts > 0) || frozen()) return 0; n.add('inspiration', pts); G.emit('needsx:inspire', pts, why); return pts; }
function onDiscover(id) {
  if (!S) return; roll(); const p = safe(() => G.places.get(id), null); if (p && ['busstop', 'taxistand', 'home'].includes(p.kind)) return;
  if (!G.state.flags || !G.state.flags.introDone) return;   /* the map filling in on arrival is not a discovery */
  if (S.disc >= I.discoverDayCap) return; if (!S.disc) safe(() => N().addMoodlet('something_new')); S.disc += I.discover; inspire(I.discover, 'place'); G.emit('needsx:newplace', id);
}
function visit(key) { roll(); const k = 'v:' + key; if (S.seen[k] === day()) return; S.seen[k] = day(); const pts = I.visit[key]; if (pts) inspire(pts, key); }
function detail(why) { roll(); if (S.det >= I.detailDayCap) return; S.det += I.detail; inspire(I.detail, why); }
function onBuy(itemId) { const it = ITEM_BY_ID[itemId]; if (!it || it.category !== 'dish' || S.tried[itemId]) return; S.tried[itemId] = 1; if (Object.keys(S.tried).length > 1) inspire(I.newDish, 'dish'); }
function onCooked(recipeId) { if (!recipeId || S.cooked[recipeId]) return; S.cooked[recipeId] = 1; if (Object.keys(S.cooked).length > 1) inspire(I.newCook, 'cook'); G.emit('needsx:newcook', recipeId); }
function onActivity(id, r) {
  if (id !== 'sleep' || !r || !(r.minutes >= 240) || !isHome()) return; const n = N(); if (!n) return;
  if (n.get('comfort') >= C.soundSleep) { n.addMoodlet('slept_soundly'); n.add('energy', C.soundSleepEnergy); }
}

/* ---------- "where can I fix this?" ---------- */
const INSPIRE_IDS = ['museum', 'cinema', 'concerthall', 'playhouse', 'library', 'bookstore', 'skydeck_lobby', 'aquarium', 'conservatory', 'observatory', 'pub:47', 'pub:19', 'lighthouse'];
function fix(id, n = 3) {
  const P = safe(() => G.places.list(), []), p = safe(() => (G.scene && G.scene.id === 'city' ? G.player : G.state.phone.cityPos), null) || G.player, d = q => Math.hypot(q.x - p.x, q.y - p.y);
  const openOf = q => safe(() => { const v = q.venue; if (!v || !v.hours) return null; return G.places.isOpen ? G.places.isOpen(q.id) : null; }, null);
  let out = [];
  if (id === 'outdoors') out = greens().map(g => ({ id: g.id, name: g.name, d: d(g), open: null }));
  else if (id === 'inspiration') {
    out = P.filter(q => q && isFinite(q.x) && INSPIRE_IDS.includes(q.id)).map(q => ({ id: q.id, name: q.name, d: d(q), open: openOf(q) }));
    const fresh1 = P.filter(q => q && isFinite(q.x) && ['venue', 'spot', 'landmark'].includes(q.kind) && !/^lobby:|^lm:/.test(q.id) && !safe(() => G.places.known(q.id), true)).map(q => ({ id: q.id, name: 'Somewhere new: ' + q.name, d: d(q), open: null })).sort((a, b) => a.d - b.d)[0];
    out.sort((a, b) => a.d - b.d); out = out.slice(0, n - (fresh1 ? 1 : 0)); if (fresh1) out.push(fresh1); return out;
  } else if (id === 'comfort') {
    const h = safe(() => G.housing.current(), null), hp = h && P.find(q => q.id === 'home:' + h.id); if (hp) out.push({ id: hp.id, name: 'Home (tidy up, make it cosy)', d: d(hp), open: null });
    const low = safe(() => G.supplies.low(), []).filter(k => k === 'cleaner' || k === 'sponge'); if (low.length) { const s = safe(() => G.supplies.shops(low)[0], null); if (s) out.push({ id: s.id, name: s.name + ' (cleaning supplies)', d: s.d, open: null }); }
    const hg = P.filter(q => q && isFinite(q.x) && q.venue && /homegoods|furniture|plant|florist/i.test((q.venue.type || '') + ' ' + (q.venue.genType || '') + ' ' + q.id)).map(q => ({ id: q.id, name: q.name + ' (something for the home)', d: d(q), open: null })).sort((a, b) => a.d - b.d)[0]; if (hg) out.push(hg);
    return out.slice(0, n);
  }
  return out.sort((a, b) => a.d - b.d).slice(0, n);
}

export function init() {
  S = G.defineState('needsx', fresh);
  const rebind = () => { S = G.state.needsx || (G.state.needsx = fresh()); const f = fresh(); for (const k in f) if (S[k] === undefined) S[k] = f[k]; greenList = null; };
  rebind(); G.on('load', rebind);
  G.needsExtra = { homeComfort, comfortParts, comfortHere, inPark, rates, fix, inspire, greens };
  G.on('minutes', tick);
  G.on('places:built', () => { greenList = null; }); G.on('scene', () => { parkCache.t = -1; });
  G.on('place:discover', onDiscover);
  G.on('recipe:learned', () => inspire(I.recipe, 'recipe')); G.on('cooked', onCooked); G.on('shop:buy', onBuy);
  G.on('show:end', () => inspire(I.show, 'show'));
  G.on('media:read:done', () => inspire(I.read, 'read')); G.on('media:book:done', () => inspire(I.book, 'book')); G.on('media:film:done', () => inspire(I.film, 'film'));
  G.on('coach:lesson', () => inspire(I.lesson, 'lesson'));
  for (const k of Object.keys(I.visit)) G.on(k + ':visit', () => visit(k));
  for (const ev of ['museum:look', 'museum:tourstop', 'museum:sketch', 'museum:photo', 'museum:audio', 'museum:model', 'aquarium:spot', 'aquarium:sketch', 'aquarium:photo', 'aquarium:touch', 'conservatory:fact', 'conservatory:sketch', 'conservatory:photo', 'conservatory:tourstop',
    'observatory:look', 'observatory:constellation', 'observatory:sketch', 'observatory:stargaze', 'skydeck:scope', 'skydeck:plaque', 'skydeck:photo', 'lighthouse:top', 'lighthouse:watch', 'cityhall:tour', 'cityhall:record', 'photo', 'skill:work', 'post:wrote', 'lobby:notices']) G.on(ev, () => detail(ev));
  G.on('activity:done', onActivity);
}
