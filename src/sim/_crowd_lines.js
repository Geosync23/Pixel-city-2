// City-folk lines engine (owner msg 79): a very large pool of written bubbles (src/story/ambient_lines.js LINES + the older AMBIENT pools of
// src/story/dialogue.js), drawn WITHOUT REPEATS: every pool is a shuffle bag; a line is not heard again until every other line of its pool has fired.
// The bubble FREQUENCY is not decided here (crowd.js / _crowd_rooms.js timers are unchanged) — this module only answers "what do they say".
//
// cityLine(c, ctx) -> string | null
//   c    the citizen ({ district, kind, x, y })      ctx { venue?: LINES.venue key, kind?: LINES.kind key, legacy?: string[] (extra pool, e.g. an event), near?: bool (close to the player) }
//   Order: player-state line (only from someone near the player, PLAYER_CHANCE) -> what the person is doing (kind) -> where we are (venue) -> the general mix.
// playerStates() -> ['stinky', 'soaked', ...]  the LINES.player pools that apply right now (exported for tests / other systems).
// roomVenueKey(roomId) -> LINES.venue key for an interior.
// State: G.state.lines = { [poolKey]: { s: seed, i: next index, n: pool size } }  (tiny: the order is rebuilt from the seed).
import { G } from '../core/game.js';
import { LINES } from '../story/ambient_lines.js';
import { AMBIENT } from '../story/dialogue.js';

export const PLAYER_CHANCE = .4;      // chance that a bubble from someone standing near the player is about the player's visible state (when one applies)
const MIX = [['general', .5], ['district', .14], ['timeOfDay', .11], ['weather', .1], ['season', .08], ['weekday', .07]];   // the general mix (weights)

const safe = (f, d) => { try { const v = f(); return v === undefined ? d : v; } catch (e) { return d; } };
const usable = s => typeof s === 'string' && s && s.indexOf('{npc}') < 0 && s.indexOf('{gift}') < 0 && s.indexOf('{venue}') < 0;
const merged = new Map();
/** the lines of a pool: LINES first, then the matching legacy AMBIENT pool, de-duplicated */
function poolOf(group, key) {
  const k = group + (key ? '.' + key : ''); let a = merged.get(k); if (a) return a;
  const flat = p => Array.isArray(p) ? p : p && typeof p === 'object' ? [].concat(...Object.values(p).map(flat)) : [];   // `general` is an object of themes: one bag
  const pick = (root, g, kk) => { const p = root && root[g]; return kk ? flat(p && p[kk]) : flat(p); };
  const seen = new Set(); a = [];
  for (const s of [...pick(LINES, group, key), ...(group === 'events' || group === 'kind' || group === 'near' || group === 'player' ? [] : pick(AMBIENT, group, key))]) { if (!usable(s)) continue; const n = s.toLowerCase(); if (!seen.has(n)) { seen.add(n); a.push(s); } }
  merged.set(k, a); return a;
}
/* ---------- shuffle bags ---------- */
const orders = new Map();
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function orderOf(key, n, seed) {
  const id = key + ':' + seed + ':' + n; let o = orders.get(id); if (o) return o;
  o = Array.from({ length: n }, (_, i) => i); const r = rng(seed); for (let i = n - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)), t = o[i]; o[i] = o[j]; o[j] = t; }
  orders.set(id, o); return o;
}
let lastLine = '';
/** next line of a pool; never repeats before the whole pool has been used */
function draw(key, arr) {
  if (!arr || !arr.length) return null; const S = G.state.lines || (G.state.lines = {});
  let b = S[key]; if (!b || b.n !== arr.length || b.i >= arr.length) b = S[key] = { s: (Math.random() * 4294967296) >>> 0, i: 0, n: arr.length };
  let s = arr[orderOf(key, arr.length, b.s)[b.i++]];
  if (s === lastLine && arr.length > 1) { if (b.i >= arr.length) b = S[key] = { s: (Math.random() * 4294967296) >>> 0, i: 0, n: arr.length }; s = arr[orderOf(key, arr.length, b.s)[b.i++]]; }   // a reshuffle must not put the same line back to back
  return (lastLine = s);
}
const DNAME = { downtown: 'Downtown', oldtown: 'Old Town', harbor: 'Harborside', hillcrest: 'Hillcrest', maplewood: 'Maplewood', arts: 'the Arts Quarter', railyard: 'the Railyard', park: 'Central Park', airport: 'the airport' };
const fill = (s, c) => s.replace(/\{name\}/g, (G.state.player && G.state.player.name) || 'friend').replace(/\{district\}/g, DNAME[c && c.district] || 'Maple Bay');

/* ---------- what is true right now ---------- */
function weatherKey(fine) { const w = safe(() => G.weather.current(), null), k = w ? w.kind : 'clear'; if (fine && (k === 'storm' || k === 'wind' || k === 'windy')) return k === 'storm' ? 'storm' : 'wind'; return k === 'rain' || k === 'storm' ? 'rain' : k === 'snow' ? 'snow' : k === 'fog' ? 'fog' : k === 'cloudy' ? 'cloudy' : w && w.tempC > 28 ? 'heat' : 'sunny'; }
const dayPart = h => h < 5 ? 'night' : h < 7 ? 'dawn' : h < 11 ? 'morning' : h < 14 ? 'midday' : h < 18 ? 'afternoon' : h < 21 ? 'evening' : 'late';
const weekdayKey = now => ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'][now.weekday] || null;
/** LINES.player pools that apply to the player right now */
export function playerStates() {
  const out = [], N = G.needs, band = k => safe(() => N.band(k).id, 'ok'), now = G.now(), h = now.hf !== undefined ? now.hf : now.hour, wk = weatherKey(), indoor = !!(G.scene && G.scene.indoor);
  const hy = band('hygiene'); if (hy === 'critical') out.push('filthy', 'filthy', 'stinky'); else if (hy === 'low') out.push('stinky', 'stinky');
  if (band('energy') === 'critical') out.push('exhausted'); if (band('hunger') === 'critical') out.push('starving'); if (band('bladder') === 'critical') out.push('bursting', 'bursting');
  const so = band('social'); if (so === 'critical' || so === 'low') out.push('lonely');
  const mood = safe(() => N.mood(), 50); if (mood < 25) out.push('gloomy'); else if (mood > 85) out.push('glowing');
  const day0 = Math.floor((G.state.t || 0) / 1440) - safe(() => G.state.intro.day0, 0), fit0 = safe(() => G.wardrobe.wearing(), '');
  if (safe(() => G.state.t - G.state.acts.last.shower, 999) < 45 || safe(() => G.state.t - G.state.acts.last.bath, 999) < 45) out.push('fresh');
  if (day0 >= 3 && day0 < 21) out.push('settling_in'); if (fit0 === 'outfit_sport') out.push('sporty'); if (fit0 === 'outfit_artist') out.push('artist_outfit');
  if (!indoor && wk === 'rain' && (fit0 === 'outfit_raincoat')) out.push('raincoat'); if (!indoor && wk === 'rain' && safe(() => G.inv.has('umbrella'), false)) out.push('umbrella');
  if (!indoor && (wk === 'snow' || G.now().season === 3) && (fit0 === 'outfit_summer' || fit0 === 'outfit_tee_jeans' || fit0 === 'outfit_pajamas')) out.push('underdressed_cold');
  if (safe(() => G.inv.items().some(st => (G.inv.item(st.id) || {}).category === 'gift'), false)) out.push('carrying_gift'); if (safe(() => G.inv.items().some(st => st.exp), false)) out.push('carrying_food');
  if (!indoor) { if (wk === 'rain' && !safe(() => G.inv.has('umbrella'), false) && safe(() => G.wardrobe.wearing(), '') !== 'outfit_raincoat') out.push('soaked', 'soaked'); if (wk === 'snow') out.push('snowy'); if (wk === 'heat') out.push('sweaty'); }
  const day = Math.floor((G.state.t || 0) / 1440) - safe(() => G.state.intro.day0, 0); if (day < 3) out.push('new_in_town'); else if (day >= 21) out.push('regular');
  const bal = safe(() => G.money.balance(), null); if (bal !== null && isFinite(bal)) { if (bal < 20) out.push('broke'); else if (bal > 5000) out.push('flush'); }
  const fit = safe(() => G.wardrobe.wearing(), ''); if (fit === 'outfit_pajamas') out.push('pajamas', 'pajamas'); else if (fit === 'outfit_business' || fit === 'outfit_evening' || fit === 'outfit_party') out.push('dressed_up'); else if (fit === 'outfit_travel' && day < 3) out.push('travel_outfit');
  if (h >= 1 && h < 4) out.push('night_owl'); else if (h >= 5 && h < 6.5) out.push('early_bird');
  if (safe(() => G.inv.free(), 1) === 0) out.push('loaded_bag');
  const job = safe(() => G.jobs.current(), null); if (!job) { if (day >= 1) out.push('unemployed'); }
  else { const nx = safe(() => G.jobs.nextShift(), null), mins = nx && (nx.t !== undefined ? nx.t - G.state.t : nx.inMinutes); if (isFinite(mins) && mins > 0 && mins < 90) out.push('on_way_to_work'); const last = safe(() => G.jobs.lastSummary(), null); if (last && isFinite(last.t) && G.state.t - last.t < 90) out.push('after_work'); }
  if (safe(() => G.housing.current().owned, false)) out.push('homeowner');
  const b = G.state.player && G.state.player.birthday; if (b && (b.day === now.dayOfMonth) && (b.season === now.season || b.season === ['spring', 'summer', 'autumn', 'winter'][now.season])) out.push('birthday', 'birthday', 'birthday');
  return out.filter(k => poolOf('player', k).length);
}
const ROOM_KEY = [[/^central/, 'station'], [/^deptstore/, 'mall'], [/^cinema/, 'cinema'], [/^concerthall/, 'concert'], [/^playhouse/, 'theatre'], [/^conservatory/, 'conservatory'], [/^observatory/, 'observatory'], [/^museum/, 'museum'],
  [/^skydeck/, 'skydeck'], [/^airport|^terminal|^concourse/, 'airport'], [/^(grocery|cornerstore)/, 'grocery'], [/^(clothing|homegoods|courier)/, 'shop'], [/^(ramen|pizza)/, 'restaurant']];
const TPL_KEY = { eatery: 'restaurant', books: 'bookstore', boutique: 'shop', bodega: 'grocery', market: 'grocery', deli: 'grocery', nails: 'salon', barber: 'salon', tattoo: 'salon', pharmacy: 'shop', gallery: 'shop', records: 'shop', toys: 'shop', pets: 'shop', florist: 'shop' };
/** LINES.venue key of an interior room id */
export function roomVenueKey(rid) {
  if (!rid) return null; rid = String(rid).replace(/^int:/, '');
  if (rid.startsWith('pub:')) { const p = safe(() => G.publicPlaces.get(rid), null), t = p && (p.tpl || p.kind || ''); const k = TPL_KEY[t] || t; return poolOf('venue', k).length ? k : poolOf('venue', TPL_KEY[p && p.kind] || (p && p.kind)).length ? (TPL_KEY[p.kind] || p.kind) : p && p.cat === 'food' ? 'restaurant' : 'shop'; }
  if (rid.startsWith('lobby:')) return safe(() => G.lobbies.get(rid).kind, 'res') === 'office' ? 'lobby_office' : 'lobby_res';
  for (const [re, k] of ROOM_KEY) if (re.test(rid)) return k;
  const base = rid.split(':')[0]; return poolOf('venue', base).length ? base : null;
}

/* ---------- landmarks (LINES.near) ---------- */
const NEAR_RE = [['fountain', /city_plaza|fountain/i], ['pier', /pier/i], ['lighthouse', /lighthouse/i], ['ferris_wheel', /ferris/i], ['duck_pond', /duck_pond|pond/i], ['river_walk', /riverside|river.?walk/i], ['market_square', /market.?sq/i],
  ['central_station', /central/i], ['bandstand', /bandstand/i], ['lookout', /lookout|viewpoint/i], ['campus', /campus/i], ['stadium', /arena|stadium/i], ['symphony_hall', /symphony|concerthall/i], ['galleria', /galleria|deptstore/i],
  ['skydeck_tower', /skydeck/i], ['conservatory', /conservatory/i], ['museum', /museum/i], ['observatory', /observatory/i], ['taxi_stand', /taxi/i]];
let nearPts = null, nearWorld = null;
function nearKey(c) {
  const w = G.world; if (!w || !w.pois || (G.scene && G.scene.indoor)) return null;
  if (nearWorld !== w) { nearWorld = w; nearPts = []; for (const p of w.pois) { const t = (p.id || '') + ' ' + (p.name || '') + ' ' + (p.type || ''); if (p.type === 'busstop') { nearPts.push({ k: 'bus_stop', x: p.x, y: p.y, r: 4 }); continue; } for (const [k, re] of NEAR_RE) if (re.test(t)) { nearPts.push({ k, x: p.x, y: p.y, r: k === 'taxi_stand' ? 4 : 10 }); break; } } }
  let best = null, bd = 1e9; for (const q of nearPts) { const d = Math.hypot(q.x - c.x, q.y - c.y); if (d < q.r && d < bd && poolOf('near', q.k).length) { bd = d; best = q.k; } } return best;
}
const KIND_ALIAS = { parent: 'parent_with_stroller', chess: 'bench', listener: null, window: null, event: null };
const kindKey = k => { if (!k) return null; const a = k in KIND_ALIAS ? KIND_ALIAS[k] : k; return a && poolOf('kind', a).length ? a : null; };
/** a two-line exchange for two people standing together: [lineA, lineB] | null   (ctx.venue / ctx.kind pick the themed sets some of the time) */
export function duet(c, ctx = {}) {
  const by = LINES.duets_by || {}, r = Math.random(); let key = 'duets', arr = LINES.duets || [];
  const kk = ctx.kind === 'kid' || ctx.kind === 'parent' ? 'kid' : ctx.kind === 'couple' ? 'couple' : null;
  if (kk && by.kind && by.kind[kk] && r < .6) { key = 'duets.kind.' + kk; arr = by.kind[kk]; } else if (ctx.venue && by.venue && by.venue[ctx.venue] && r < .6) { key = 'duets.venue.' + ctx.venue; arr = by.venue[ctx.venue]; }
  const d = draw(key, arr); return Array.isArray(d) && d.length === 2 ? [fill(d[0], c), fill(d[1], c)] : null;
}
/** what an anonymous citizen says right now (already filled); null when no pool has anything */
export function cityLine(c, ctx = {}) {
  const now = G.now(), h = now.hf !== undefined ? now.hf : now.hour, r = Math.random(); let s = null;
  if (ctx.state) s = draw('player.' + ctx.state, poolOf('player', ctx.state));                                         // forced (bumped / staring)
  if (!s && ctx.near && Math.random() < PLAYER_CHANCE) { const st = playerStates(); if (st.length) { const k = st[Math.floor(Math.random() * st.length)]; s = draw('player.' + k, poolOf('player', k)); } }
  if (!s && ctx.legacy && ctx.legacy.length && r < .6) s = draw('legacy.' + (ctx.legacyKey || 'x'), ctx.legacy.filter(usable));
  if (!s && ctx.eventId && r < .6) s = draw('events.' + ctx.eventId, poolOf('events', ctx.eventId));
  const kd = kindKey(ctx.kind); if (!s && kd && r < .55) s = draw('kind.' + kd, poolOf('kind', kd));
  if (!s && !ctx.venue && Math.random() < .4) { const nk = nearKey(c); if (nk) s = draw('near.' + nk, poolOf('near', nk)); }
  if (!s && ctx.venue && r < .7) s = draw('venue.' + ctx.venue, poolOf('venue', ctx.venue));
  if (!s) {
    let x = Math.random(), g = 'general'; for (const [k, w] of MIX) { if ((x -= w) < 0) { g = k; break; } }
    const key = g === 'district' ? c && c.district : g === 'timeOfDay' ? dayPart(h) : g === 'weather' ? (poolOf('weather', weatherKey(true)).length ? weatherKey(true) : weatherKey()) : g === 'season' ? ['spring', 'summer', 'autumn', 'winter'][now.season] : g === 'weekday' ? weekdayKey(now) : null;
    if (g !== 'general' && key) s = draw(g + '.' + key, poolOf(g, key));
    if (!s) s = draw('general', poolOf('general'));
  }
  return s ? fill(s, c) : null;
}
export const lineStats = () => { let n = 0; const o = {}; for (const g of Object.keys(LINES)) { if (g === 'duets') { o.duets = LINES.duets.length; n += o.duets; } else if (g === 'duets_by') { let d = 0; for (const a of Object.values(LINES.duets_by)) for (const b of Object.values(a)) d += b.length; o.duets_by = d; n += d; } else if (g === 'general') { o.general = poolOf('general').length; n += o.general; } else { let t = 0; for (const k of Object.keys(LINES[g])) t += poolOf(g, k).length; o[g] = t; n += t; } } o.total = n; return o; };
