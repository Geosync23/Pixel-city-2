// Relationships base (helper of sim/rel.js): the state slice, the people, the two tracks, remembered details, conditions, effects, places, texts.
// Everything the other _rel_*.js helpers share lives here so that they never import each other in a circle; functions that live in rel.js or in a later
// helper are reached through HOOK (filled in at init).
//
//   st()                       G.state.rel (created / migrated lazily: old saves simply gain it)
//   who(id, look?)             speaker card { id, name, short, spec, kid }; look = 'date' | 'home' dresses a romanceable in that outfit variant
//   stage(id) / stageIdx(id)   romance stage id / index in ROMANCE_STAGES        warmth(id)        addWarmth(id, n, src)   src 'verb' | 'gift' are capped a day
//   setStage(id, stage)        friendStage(id)        partner() -> id | null     openTo(id)   isBoss(id)   canStart(id) -> true | 'boss' | 'closed' | 'no'
//   openTrack(id, how)         remember(id, key) / remembers(id, key)            flag(id) / setFlag(id)
//   test(cond, person)         a COND_PREFIXES condition string ('!' negates)    apply(fx, person, src)   EFFECT_KEYS as data
//   dest(placeKey, person)     -> { key, name, room, x, y, spot, any, phone, placeId } | null         at(dest) -> the player is there now
//   queueText(o) / pumpTexts() relationship texts through Messages, paced (PACING: 3 a day, 1 a person, 90 minutes apart, never 21:30-07:30)
import { G } from '../core/game.js';
import { CAST_BY_ID } from '../story/cast.js';
import { MOODLETS } from '../data/needs.js';
import { RECIPE_BY_ID } from '../data/items.js';
import { ROOMS } from '../scenes/interior.js';
import { UI } from '../ui/chapters_ui.js';
import { toast } from '../ui/kit.js';
import { ROMANCE_STAGES } from '../story/_rel_kit.js';
import { ROMANCE_TRACK, WARMTH, PACING, REL_MOODLETS, ROMANCE_RULES } from '../story/rel_rules.js';
import { ROMANCEABLE, PEOPLE } from '../story/rel_people.js';
import { SPEAKERS_EXTRA, ITEMS_NEW, SCENE_TEXTS, FAMILY_REACTS } from '../story/rel_romance.js';
import { ARC_ITEMS, ARC_TEXTS, PAGES } from '../story/rel_arcs.js';
import { SMALL, NEWS } from '../story/rel_small.js';
import { who as chWho } from './_chapters_cast.js';
import { resolve, here, cityWorld, freeNear } from './_chapters_places.js';
import { buildSpecs, OUTDOOR, HOME_ROOM } from './_social_data.js';

export const DAY = 1440, SEASONS = ['spring', 'summer', 'autumn', 'winter'], WDL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export const safe = (f, d) => { try { const v = f(); return v === undefined || v === null ? d : v; } catch (e) { return d; } };
export const sleep = ms => new Promise(r => setTimeout(r, ms));
export const cl = (v, a, b) => Math.max(a, Math.min(b, v));
export const today = () => Math.floor(G.state.t / DAY);
export const HOOK = {};          /* run(sceneId), offerScene(id), runSteps(steps, o), bookDate(o) ... filled by rel.js and the later helpers */
export const ITEMS = Object.assign({}, ITEMS_NEW, ARC_ITEMS), TEXTS = Object.assign({}, SCENE_TEXTS, ARC_TEXTS);
export const isRom = id => ROMANCEABLE.includes(id);
export const pname = () => (G.state.player && G.state.player.name) || 'you';

/* ---------- state ---------- */
const fresh = () => ({ v: 1, openTo: ['w', 'm', 'n'], looking: 'Not sure yet', ro: {}, mem: {}, picks: {}, seen: {}, arcs: {}, off: {}, threads: {}, small: { day: -1, n: 0, texts: 0, waves: 0, lastText: -999, per: {}, bag: {}, said: {} },
  app: { hidden: [], chats: {}, paused: false, prompts: {}, day: -1, n: 0 }, wedding: null, told: {}, cur: null, held: {}, q: [], sent: {}, dates: {}, lastOffer: -9, gap: 2, lastScene: -9, keeps: [], pages: {}, fr: {}, vcd: {}, live: null, wait: {}, news: [], once: {} });
export function st() { let s = G.state.rel; if (!s || typeof s !== 'object') s = G.state.rel = fresh(); const f = fresh(); for (const k in f) if (s[k] === undefined) s[k] = f[k]; for (const k in f.small) if (s.small[k] === undefined) s.small[k] = f.small[k]; for (const k in f.app) if (s.app[k] === undefined) s.app[k] = f.app[k]; return s; }
export const resetState = () => { G.state.rel = fresh(); return G.state.rel; };
export const ror = id => { const s = st(); return s.ro[id] || (s.ro[id] = { pts: 0, stage: 'none', since: today(), dates: 0, firstDateDay: null, hearts: [0, 0, 0], keys: 0, lives: 0, weddingDay: null, flirts: 0, cap: [-1, 0], types: {}, talks: [], lastDate: -9, partnerDay: null }); };
export const frr = id => { const s = st(); return s.fr[id] || (s.fr[id] = {}); };       /* per-person friendship extras: keys, lastAsk ... (the points stay in G.social) */

/* ---------- people ---------- */
const xspec = {};
const PRON = { 'she/her': 'w', 'he/him': 'm', 'they/them': 'n' };
export const castOf = id => CAST_BY_ID[id] || null;
/* on first-name terms once there is Something There (cast.js shorts are "Chef Haru", "Coach Tasha", "Mr. Quill") */
export const short = id => { const c = castOf(id); if (c && isRom(id) && G.state.rel && G.state.rel.ro[id] && G.state.rel.ro[id].stage !== 'none') return c.name.split(' ')[0]; return c ? c.short || c.name : (SPEAKERS_EXTRA[id] || {}).short || id; };
export const full = id => { const c = castOf(id); return c ? c.name : (SPEAKERS_EXTRA[id] || {}).name || id; };
export function who(id, look) {
  const w = chWho(id);
  if (!w.spec && SPEAKERS_EXTRA[id] && id !== 'narrator' && id !== 'player') {
    const x = SPEAKERS_EXTRA[id]; w.name = x.name; w.short = x.short || x.name;
    const fig = safe(() => G.scene.ents.find(e => e && e.spec && !e.isPlayer && new RegExp(id === 'clerk_bell' ? 'clerk|bell' : id, 'i').test(String(e.label || e.name || e.who || ''))), null);
    w.spec = (fig && fig.spec) || xspec[id] || (xspec[id] = safe(() => buildSpecs({ id: 'rel_' + id, age: 60, look: id === 'wendell' ? 'grey hair, green apron, glasses' : 'grey hair, dark suit, glasses', spec: id === 'wendell' ? { hair: 'short', hairColor: '#b8b8b8', top: 'cardigan', topColor: '#4f772d', bottom: 'slacks', glasses: 'round', age: 'elder' } : { hair: 'balding', hairColor: '#c9c9c9', top: 'suit', topColor: '#2b2d42', bottom: 'slacks', bottomColor: '#2b2d42', glasses: 'round', age: 'elder' } }).base, null));
  }
  if (isRom(id)) w.short = short(id);
  const P = PEOPLE[id]; if (look && P && P.looks && P.looks[look] && w.spec) { const k = id + ':' + look; w.spec = xspec[k] || (xspec[k] = Object.assign({}, w.spec, P.looks[look])); }
  return w;
}
export const fill = (t, x) => { let s = String(t || ''); const p = partner(); s = s.replace(/\{partner\}/g, (x && x.partner) || (p ? short(p) : 'them')).replace(/\{place\}/g, (x && x.place) || 'the place').replace(/\{npc\}/g, (x && x.npc) || '').replace(/\{thing\}/g, (x && x.thing) || 'this').replace(/\{event\}/g, (x && x.event) || 'it').replace(/\{other\}/g, (x && x.other) || 'my friend');
  return safe(() => G.chapters.fill(s), null) || s.replace(/\{name\}|\{title\}/g, pname()); };

/* ---------- friendship (the social system's own meter) ---------- */
export const fr = id => safe(() => G.social.rel(id === 'kids' ? 'pip' : id), 0);
export const addFr = (id, n) => { if (!id || !n || !castOf(id)) return 0; return safe(() => { if (!(G.social.known() || []).includes(id)) G.social.meet(id); return G.social.addRel(id, n, { raw: true }); }, 0); };
export const flags = () => G.state.flags || (G.state.flags = {});
export const flag = id => !!flags()[id] || !!safe(() => G.chapters.flag(id), false);
export const setFlag = id => { if (!flags()[id]) { flags()[id] = 1; G.emit('flag', id); } };
export function friendStage(id) { const t = safe(() => G.social.tier(id === 'kids' ? 'pip' : id), 'stranger'); return t === 'close' && flag((id === 'pip' || id === 'milo' ? 'kids' : id) + '_arc_done') ? 'confidant' : t; }
export const FRIEND_LABEL = { stranger: 'Stranger', acquaintance: 'Acquaintance', friend: 'Friend', close: 'Close Friend', confidant: 'Confidant' };

/* ---------- romance ---------- */
export const stage = id => (st().ro[id] ? st().ro[id].stage : 'none');
export const stageIdx = id => ROMANCE_STAGES.indexOf(stage(id));
export const stageLabel = id => (ROMANCE_TRACK.find(r => r.id === stage(id)) || {}).label || '';
export const warmth = id => (st().ro[id] ? st().ro[id].pts : 0);
export const partner = () => { const s = st(); return Object.keys(s.ro).find(id => ROMANCE_STAGES.indexOf(s.ro[id].stage) >= 3) || null; };
export const dating = () => { const s = st(); return Object.keys(s.ro).filter(id => ['spark', 'dating'].includes(s.ro[id].stage)); };
export const openTo = id => { const P = PEOPLE[id]; return !!P && st().openTo.includes(PRON[P.pronouns] || 'n'); };
export const isBoss = id => { const P = PEOPLE[id], j = safe(() => G.jobs.current(), null); return !!(P && P.work && P.work.bossOf && j && j.id === P.work.bossOf); };
/** may a romance track START with this person now?  true | 'boss' | 'closed' (ended less than 28 days ago) | 'taken' (you have a partner) | 'no' */
export function canStart(id) {
  if (!isRom(id) || ROMANCE_RULES.family.includes(id) || safe(() => G.social.isFamily(id), false) || (castOf(id) || {}).age < 21) return 'no';
  if (stage(id) !== 'none') return true; const r = st().ro[id];
  if (partner()) return 'taken'; if (isBoss(id)) return 'boss'; if (r && r.closed !== undefined && today() - r.closed < 28) return 'closed'; if (!openTo(id)) return 'no';
  return true;
}
export function addWarmth(id, n, src) {
  if (!n || stage(id) === 'none') return 0; const r = ror(id), d = today();
  if (n > 0 && (src === 'verb' || src === 'gift' || src === 'app')) { if (r.cap[0] !== d) r.cap = [d, 0]; n = Math.min(n, Math.max(0, WARMTH.dailyCap - r.cap[1])); r.cap[1] += n; if (n <= 0) return 0; }
  const old = r.pts; r.pts = cl(Math.round((r.pts + n) * 10) / 10, 0, 100); if (r.pts !== old) G.emit('rel:warmth', id, r.pts, src); return r.pts - old;
}
const GOLD = { spark: n => `Something there, with ${n}.`, dating: n => `You and ${n} are dating.`, exclusive: n => `You and ${n} are together.`, partner: n => `${n} is your partner.`, engaged: n => `You and ${n} are engaged.`, married: n => `You and ${n} are married.` };
export function setStage(id, sg, quiet) {
  if (!isRom(id) || !ROMANCE_STAGES.includes(sg)) return false; const r = ror(id), old = r.stage; if (old === sg) return false;
  r.stage = sg; r.since = today(); if (sg === 'partner') r.partnerDay = today(); const min = (ROMANCE_TRACK.find(x => x.id === sg) || {}).min || 0; if (sg !== 'none' && r.pts < Math.min(min, 12)) r.pts = Math.min(min, 12);
  if (!quiet && GOLD[sg]) UI.toastGold(GOLD[sg](short(id)), 5200);
  G.emit('rel:stage', id, sg, old);
  if (sg === 'exclusive' || sg === 'partner' || sg === 'engaged') { safe(() => HOOK.familyReacts(sg === 'exclusive' ? 'together' : sg, id)); pushNews(sg === 'exclusive' ? 'together' : sg === 'partner' ? 'together' : 'engaged'); }
  if (sg === 'engaged') G.emit('rel:engaged', id); if (sg === 'married') { G.emit('rel:married', id); pushNews('married'); }
  return true;
}
export function openTrack(id, how) {
  if (canStart(id) !== true || stage(id) !== 'none') return false; const r = ror(id); if (r.closed !== undefined) { remember(id, 'tried_before'); delete r.closed; }
  r.pts = Math.max(r.pts, 2); setStage(id, 'spark'); r.how = how || 'world'; return true;
}
export const pushNews = kind => { const s = st(); s.news = s.news.filter(n => n.kind !== kind && today() - n.day <= 2); s.news.push({ kind, day: today() }); };

/* ---------- remembered details ---------- */
export function remember(id, key) { if (!id || !key) return; const s = st(), ids = id === 'kids' ? ['pip', 'milo'] : [id]; for (const p of ids) { const m = s.mem[p] || (s.mem[p] = {}); if (m[key] === undefined) { m[key] = today(); G.emit('rel:mem', p, key); } } }
export const remembers = (id, key) => { const s = st(), ids = id === 'kids' ? ['pip', 'milo'] : [id]; return ids.some(p => !!(s.mem[p] && s.mem[p][key] !== undefined)); };
const anyRemembers = key => { const s = st(); for (const p in s.mem) if (s.mem[p][key] !== undefined) return true; return false; };

/* ---------- conditions ---------- */
export const wx = () => String(safe(() => G.weather.current().kind, 'clear'));
export const eventOn = id => safe(() => G.planner.eventsOn(today()), []).some(e => e.data && e.data.eventId === id) || safe(() => G.cityEvents.list(), []).some(e => e.id === id && e.day === today());
export function test(c, person) {
  if (!c) return true; if (c[0] === '!') return !test(c.slice(1), person);
  const i = c.indexOf(':'), k = c.slice(0, i), v = c.slice(i + 1), n = G.now(), s = st();
  switch (k) {
    case 'pick': { const [a, b] = v.split('='); return s.picks[a] === b || safe(() => G.chapters.pick(a), null) === b; }
    case 'flag': return flag(v);
    case 'done': return !!safe(() => G.chapters.done(v), false);
    case 'weather': return wx() === v || (v === 'rain' && wx() === 'storm');
    case 'season': return SEASONS[n.season] === v;
    case 'time': return v === 'morning' ? n.hf < 11 : v === 'evening' ? n.hf >= 18 && n.hf < 22 : v === 'night' ? n.hf >= 22 || n.hf < 5 : n.hf >= 11 && n.hf < 18;
    case 'festival': return eventOn(v);
    case 'day': return v === 'weekend' ? n.weekday >= 5 : v === 'weekday' ? n.weekday < 5 : WDL[n.weekday].toLowerCase().startsWith(v.toLowerCase());
    case 'fr': { const m = /^(\w+)\s*>=\s*(\d+)$/.exec(v); return m ? fr(m[1]) >= +m[2] : false; }
    case 'stage': { const m = /^(\w+)\s*>=\s*(\w+)$/.exec(v); return m ? stageIdx(m[1]) >= ROMANCE_STAGES.indexOf(m[2]) : false; }
    case 'seen': return s.seen[v] !== undefined;
    case 'mem': return person ? remembers(person, v) || anyRemembers(v) : anyRemembers(v);
    case 'job': return safe(() => G.jobs.current().id, null) === v;
    case 'lives': return !!(s.live && s.live.id);
    case 'date': return person && s.ro[person] ? s.ro[person].dates + 1 >= +v : false;
    default: return !!safe(() => G.chapters.test(c), false);
  }
}

/* ---------- effects ---------- */
export function regMoods() { for (const id in REL_MOODLETS) if (!MOODLETS[id]) MOODLETS[id] = Object.assign({ walkSpeed: 1, workPerf: 0, source: 'people' }, REL_MOODLETS[id]); }
export function mood(id) { regMoods(); if (MOODLETS[id]) safe(() => G.needs.addMoodlet(id)); }
export function give(id) {
  const s = st(), it = ITEMS[id]; if (!it || s.keeps.includes(id)) return false; s.keeps.push(id);
  UI.toastGold(`${it.kind === 'clothing' ? 'Something to wear' : it.kind === 'furniture' ? 'For your home' : it.kind === 'book' ? 'A book' : 'A keepsake'}: ${it.name}. ${it.desc}`, 8000); G.emit('rel:keepsake', id); safe(() => HOOK.grantItem(id)); return true;
}
export function givePage(id) { const s = st(), p = PAGES[id]; if (!p || s.pages[id] !== undefined) return false; s.pages[id] = today(); UI.toastGold(`A page for the book, in ${short(p.from)}'s hand: "${p.title}". It is with their card in Messages.`, 8000); G.emit('rel:page', id); return true; }
export function apply(e, person, src) {
  if (!e) return;
  for (const id in e.fr || {}) addFr(id, e.fr[id]);
  for (const id in e.ro || {}) addWarmth(id, e.ro[id], src || 'scene');
  for (const f of [].concat(e.flag || [])) setFlag(f);
  for (const m of [].concat(e.mem || [])) remember(person, m);
  for (const t of [].concat(e.text || [])) queueText({ id: t });
  if (e.mood) mood(e.mood);
  if (e.item) give(e.item);
  if (e.page) givePage(e.page);
  if (e.recipe && RECIPE_BY_ID[e.recipe]) { const got = safe(() => G.cooking.learn(e.recipe, 'friend'), false); if (got) toast(`You can cook ${RECIPE_BY_ID[e.recipe].name} now.`, 'good', 3600); }
  for (const k in e.need || {}) safe(() => G.needs.add(k, e.need[k]));
  for (const k in e.xp || {}) safe(() => G.skills.addXp(k, e.xp[k]));
}

/* ---------- places ---------- */
const ROOM_ALIAS = { 'museum:cafe': ['museum_cafe', 'museum'], 'conservatory:cafe': ['conservatory_cafe', 'conservatory'], 'university:cafe': ['university_cafe', 'uni_cafe', 'university'], post_main: ['post_main', 'post'], hotel_ballroom: ['hotel_ballroom', 'hotel'], hotel_restaurant: ['hotel_restaurant', 'hotel'], stand_coffee: ['stand_coffee'], airport: ['airport'], event: [] };
const SPOT_ALIAS = { poi_pier: 'pier', poi_ferris_wheel: 'poi_ferris_wheel', '@Bandstand': 'park', stand_coffee: 'spot:central_plaza' };
const SPOT_NAME = { stand_coffee: 'the Little Drip coffee cart, Central Station plaza', '@Bandstand': 'the bandstand in Central Park' };
export const homeRoomOf = id => { const c = castOf(id); return c && HOME_ROOM[c.home] && ROOMS.has(HOME_ROOM[c.home]) ? HOME_ROOM[c.home] : null; };
function spotDest(key, x, y, name, placeId) { const f = freeNear(cityWorld(), x, y); return { key, name, room: null, x: f.x, y: f.y, spot: true, placeId: placeId || null, pos: { x: f.x, y: f.y, name } }; }
function fromResolved(key, d) { if (!d) return null; const pid = d.room ? (safe(() => G.places.get(d.root || d.room), null) || {}).id || null : (safe(() => G.places.get(key), null) || {}).id || null; return { key, name: d.name, room: d.room || null, root: d.root || null, x: d.x, y: d.y, spot: !!d.spot, placeId: pid, pos: d.spot && !pid ? { x: d.x, y: d.y, name: d.name } : null }; }
export function dest(key, person) {
  if (!key || key === 'any') return { key: 'any', any: true, name: 'wherever you are' };
  if (key === 'phone') return { key, phone: true, name: 'on the telephone' };
  if (key === 'home') { const d = fromResolved('home', safe(() => resolve('home:player'), null)); if (d) d.home = true; return d; }
  if (key === 'theirs') {
    const P = PEOPLE[person], flat = safe(() => HOOK.flatOf(person), null); if (flat) { const d = fromResolved(key, safe(() => resolve(P.home.anchor), null)) || { key }; return Object.assign(d, flat); }
    const hr = homeRoomOf(person === 'kids' ? 'jules' : person); if (hr) return fromResolved(key, safe(() => resolve(hr), null));
    if (P && P.home && P.home.anchor) { const d = fromResolved(key, safe(() => resolve(P.home.anchor), null)); if (d) { d.door = true; d.name = 'their door'; return d; } }
    const c = castOf(person), w = c && c.work && c.work.venue; return w ? dest(w, person) : dest('spot:building_stoop', person);
  }
  let d = fromResolved(key, safe(() => resolve(key), null)); if (d) return d;
  for (const r of ROOM_ALIAS[key] || []) { d = fromResolved(key, safe(() => resolve(r), null)); if (d) return d; }
  const o = OUTDOOR[key] || OUTDOOR[SPOT_ALIAS[key]] || OUTDOOR[String(key).replace(/^spot:/, '')]; if (o) return spotDest(key, o.x, o.y, SPOT_NAME[key] || o.name, null);
  const p = safe(() => G.places.get(key), null) || safe(() => G.places.list().find(q => q.id === key || (q.poi && q.poi.id === key)), null); if (p) return spotDest(key, p.x, p.y, p.name, p.id);
  const poi = safe(() => cityWorld().pois.find(q => q.id === key || q.id === 'door:' + key || q.type === String(key).replace(/^poi_/, '')), null); if (poi) return spotDest(key, poi.x, poi.y + 1.5, (poi.name || String(key).replace(/^poi_|^spot:/, '').replace(/_/g, ' ')), null);
  return null;
}
export function at(d) {
  if (!d || !G.scene) return false; if (d.any || d.phone) return true;
  if (d.flat) return G.scene.id === 'int:' + d.flat;
  if (d.room) return G.scene.id === 'int:' + d.room || (d.root && G.scene.id === 'int:' + d.root && !ROOMS.has(d.room));
  return G.scene.id === 'city' && Math.hypot(G.player.x - d.x, G.player.y - d.y) < (d.door ? 5 : 7.5);
}
export { here };

/* ---------- windows ---------- */
export function nextWindow(w, from = G.state.t, days = 9) { w = w || { from: 9, to: 21 }; const wd = w.days || [0, 1, 2, 3, 4, 5, 6]; for (let d = Math.floor(from / DAY); d < Math.floor(from / DAY) + days; d++) { if (!wd.includes(d % 7)) continue; const a = d * DAY + Math.round(w.from * 60), z = d * DAY + Math.round(w.to * 60); if (z - 15 > from) return { from: a, to: z }; } return null; }
export const inWindow = w => { const x = nextWindow(w); return !!x && G.state.t >= x.from && G.state.t < x.to; };
export const hhmm = h => { const m = Math.round(h * 60); return `${Math.floor(m / 60) % 24}:${String(m % 60).padStart(2, '0')}`; };
export function windowWords(w) { if (!w) return 'any time'; const d = w.days && w.days.length < 7 ? (w.days.length === 1 ? WDL[w.days[0]] + 's' : w.days.map(x => WDL[x].slice(0, 3)).join(', ')) + ', ' : ''; return `${d}${hhmm(w.from)} to ${hhmm(w.to)}`; }

/* ---------- texts ---------- */
const quiet = () => safe(() => !!G.state.phone.settings.fewer, false) || !!st().fewer;
export const textCap = () => Math.max(1, Math.round(PACING.textsPerDay * (quiet() ? .5 : 1)));
function small() { const s = st().small, d = today(); if (s.day !== d) { s.day = d; s.n = 0; s.texts = 0; s.waves = 0; s.per = {}; } return s; }
export { small as smallDay };
/** o = { id (a TEXTS / SMALL text id) | from + text, after? (hours), inv?: sceneId, force? (an invitation or a reply: not counted against the small-bit budget), look? } */
export function queueText(o) {
  const s = st(); let from = o.from, text = o.text, after = o.after || 0;
  if (o.id) { const tx = TEXTS[o.id]; if (!tx || s.sent[o.id] !== undefined || s.q.some(q => q.id === o.id)) return false; from = tx.from; text = tx.text; after = tx.after || 0; }
  if (!from || !text) return false; s.q.push({ id: o.id || null, from, text, at: G.state.t + after * 60, inv: o.inv || null, force: o.force ? 1 : 0 }); return true;
}
export function pumpTexts(now) {
  const s = st(); if (!s.q.length || !G.messages) return 0; const n = G.now(), sm = small();
  if (!now && (n.hf >= 21.5 || n.hf < 7.5)) return 0; let sent = 0;
  for (let i = 0; i < s.q.length; i++) {
    const q = s.q[i]; if (q.at > G.state.t && !now) continue;
    if (!now && !q.force && (G.state.t - sm.lastText < PACING.textGapMin || sm.texts >= textCap() || sm.per[q.from])) continue;
    if (!now && q.force && G.state.t - sm.lastText < 20) continue;
    s.q.splice(i, 1); i--; if (q.id) s.sent[q.id] = today(); sm.lastText = G.state.t; if (!q.force) { sm.texts++; sm.n++; } sm.per[q.from] = 1;
    const c = castOf(q.from); safe(() => { if (c && !(G.social.known() || []).includes(q.from)) G.social.meet(q.from); });
    safe(() => G.messages.send({ from: q.from, name: c ? c.name : full(q.from), text: fill(q.text) }));
    if (q.inv) safe(() => HOOK.inviteArrived(q.inv));
    G.emit('rel:text', q.from, q.id || null); sent++; if (!now) break;
  }
  return sent;
}
/** the family has opinions (FAMILY_REACTS) and answers news (NEWS): texts, a few hours apart, only from people the player knows */
export function familyTexts(table, x, gapH = 3) {
  let k = 0; for (const id in table || {}) { const line = [].concat(table[id])[0]; if (!line || !safe(() => (G.social.known() || []).includes(id), false)) continue; if (id === 'dad' && !flag('dad_number') && !safe(() => G.chapters.done('ch07'), false)) continue;
    queueText({ from: id, text: fill(line, x), after: 1 + k * gapH, force: k < 2 }); k++; }
  return k;
}
HOOK.familyReacts = (kind, id) => familyTexts(FAMILY_REACTS[kind], { partner: short(id) });
export { SMALL, NEWS, PEOPLE, ROMANCEABLE, ROMANCE_STAGES, WARMTH, PACING, PAGES };
