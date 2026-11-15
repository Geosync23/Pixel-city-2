// Wander's QUICK TOOLS (owner msg 107, BIBLE 21.3) — the picks behind the front page of src/ui/phone_guide.js. Helper file (no init): phone_guide.js imports it.
// It does NOT rank anything itself: every pick is an idea from the My Day engine (src/sim/myday.js, G.myDay.ideas), filtered and grouped per tool. What the engine
// did not gather yet (things you can PLAY or practise at a place, fun on your phone, an evening in) is offered to it through G.myDay.addSource() below, so those
// are scored by the same rules (interests, traits, distance, never tried, what you taught it) and can be added to the day like any other idea.
//
// TOOLS  fun (Fun right now) · new (Something new) · need (Fix a need) · tonight · weekend (This weekend) · rainy (On a rainy day)
// picks(toolId) -> [{ id, title, why, icon, head? (a group heading before this row), idea? (My Day idea: "Add to my day" + "Take me there"), dest? (place id | {x,y,name}),
//                     entryId? (Wander page), open? { app, arg }, sysId? (Systems card: its jump), need? (need id), meter? 0..100, go? (label of the main button) }]
// Cached per game minute, scene and tool; cleared on 'myday:change'.
import { G } from '../core/game.js';
import { ACTIVITIES } from '../data/activities.js';
import { NEEDS } from '../data/needs.js';
import { FAMILY_OF } from '../data/skills_extra.js';
import { safe, cityPos } from './phone_util.js';

const DAY = 1440, WALK0 = .215, WALK = () => WALK0 * (G.CLOCK || .85);   /* QA13: slower clock (owner msg 142) */
export const TOOLS = [
  { id: 'fun', name: 'Fun right now', icon: 'sys.fun', color: '#c2478a', line: 'What is open and near, picked for you. Every way to fill Fun is in here somewhere.' },
  { id: 'new', name: 'Something new', icon: 'myday.new', color: '#2f9aa8', line: 'Things you have never done: a place, a dish, a skill, a part of the game.' },
  { id: 'need', name: 'Fix a need', icon: 'ui.heart', color: '#d9573a', line: 'The nearest good way to fix each need, lowest first.' },
  { id: 'tonight', name: 'Tonight', icon: 'sys.tonight', color: '#4a557a', line: 'What the evening has to offer.' },
  { id: 'weekend', name: 'This weekend', icon: 'sys.weekend', color: '#b8862c', line: 'Saturday and Sunday in Maple Bay.' },
  { id: 'rainy', name: 'On a rainy day', icon: 'sys.rainy', color: '#3b6bd0', line: 'Dry, warm and worth the trip.' },
];
export const TOOL_BY_ID = Object.fromEntries(TOOLS.map(t => [t.id, t]));
const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return ((h >>> 0) % 10000) / 10000; };
const hh = t => { const m = ((Math.round(t) % DAY) + DAY) % DAY; return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
const now = () => G.state.t, today = () => Math.floor(G.state.t / DAY);
const walkOf = p => { const c = cityPos(); return p && isFinite(p.x) ? Math.max(1, Math.round((Math.abs(p.x - c.x) + Math.abs(p.y - c.y)) * WALK())) : 0; };
const walkText = w => (w <= 1 ? 'right here' : w + ' min walk');
const openNow = e => safe(() => G.guide.openNow(e).open, null);
const visits = id => safe(() => G.state.traits.visits[id], 0) || 0;
const inRoom = id => { const sc = G.scene ? String(G.scene.id) : ''; return !!id && sc !== 'city' && (sc === id || sc === 'int:' + id || sc.endsWith(':' + id)); };
const places = () => safe(() => G.guide.all(), []).filter(e => e.kind === 'place' && !e.parent && e.placeId && isFinite(e.x) && e.chapter !== 'transit' && !/^home:/.test(e.placeId) && !/lobby|workplace|clinic|office|Job listings/i.test(e.type || '') && !/^ch_/.test(e.placeId));
const hasApp = id => !safe(() => G.apps.hides(id), false) && safe(() => G.phone.isUnlocked(id), false);
const ACT_BY_ID = Object.fromEntries(ACTIVITIES.map(a => ['act:' + a.id, a]));
const SKILL_NAME = () => Object.fromEntries(safe(() => G.skills.defs.map(d => [d.id, d.name]), []));

/* ---------- extra idea sources for the My Day engine (gathered only for ideas({ all: true })) ---------- */
const PHONE_FUN = [['pages', 'Read a short story on Pages', 'words'], ['reel', 'Watch something on Reel', 'words'], ['playbox', 'A quick game on PlayBox', 'games']];
function sourcePlay(c) {   /* things to DO at a place: fishing, chess, the arcade, sketching, darts, open mic ... (guide entries of kind 'activity' with a `where`) */
  if (!c.isToday || c.at !== undefined) return;
  const all = safe(() => G.guide.all(), []), byId = id => safe(() => G.guide.get(id), null), d0 = today(), blk = d0 + '|' + Math.floor(c.T / 360), stamps = safe(() => G.state.guide.stamps, {}), out = [];
  for (const e of all) { if (e.kind !== 'activity' || !e.where || !e.where.length) continue; const a = ACT_BY_ID[e.id]; if (!a || !(a.perHour && a.perHour.fun > 0)) continue; if (a.requires && a.requires.item) continue;
    const skill = a.xpPerHour ? Object.keys(a.xpPerHour)[0] : null; let best = null, bw = 1e9;
    for (const id of e.where) { const p = byId(id); if (!p || !p.placeId || !isFinite(p.x) || inRoom(p.placeId) || openNow(p) === false) continue; const w = walkOf(p); if (w < bw) { bw = w; best = p; } }
    if (!best) continue; out.push({ e, a, p: best, w: bw, skill, fresh: stamps[e.id] === undefined }); }
  out.sort((x, y) => (x.w + (x.fresh ? -6 : 0) + hash(x.e.id + blk) * 14) - (y.w + (y.fresh ? -6 : 0) + hash(y.e.id + blk) * 14));
  const seen = new Set(), names = SKILL_NAME(); let n = 0;
  for (const r of out) { if (n >= 5) break; if (seen.has(r.p.placeId)) continue; seen.add(r.p.placeId); n++;
    c.push({ id: 'play:' + r.e.id.slice(4), key: 'play:' + r.e.id, kind: 'play', cat: 'play', base: 45, fam: r.skill ? FAMILY_OF[r.skill] : null, title: `${r.e.title} at ${r.p.title}`, why0: r.skill && names[r.skill] ? `Fun, and good for your ${names[r.skill]}` : r.fresh ? 'You have not tried this' : r.p.type,
      icon: r.skill ? 'skill.' + r.skill : 'need.fun', outdoor: r.a.where === 'world' || r.p.chapter === 'outdoors', placeId: r.p.placeId, dur: (r.a.minutes && r.a.minutes.default) || 45, fixed: false, entryId: r.e.id, blurb: r.e.blurb, price: r.a.cost && r.a.cost.amount ? r.a.cost.amount : undefined, fresh: r.fresh }); }
}
function sourcePhone(c) {   /* fun on the phone: no walk at all */
  if (!c.isToday || c.at !== undefined) return;
  for (const [app, title, fam] of PHONE_FUN) { if (hasApp(app)) c.push({ id: 'app:' + app, key: 'app:' + app, kind: 'app', cat: 'app', base: 38, fam, title, why0: 'On your phone, wherever you are', icon: 'app.' + app, open: { app }, dur: 30, fixed: false, walk: 0 });
    else if (safe(() => G.apps.get(app).released, false)) c.push({ id: 'app:' + app, key: 'app:' + app, kind: 'app', cat: 'app', base: 34, fam, title: `Get ${safe(() => G.apps.get(app).name, app)} on Appy`, why0: 'Free, and good for a ride or a queue', icon: 'app.' + app, open: { app: 'store', arg: { app } }, dur: 10, fixed: false, walk: 0 }); }
}
function sourceHome(c) {   /* an evening in */
  if (!c.isToday || c.at !== undefined) return; const h = safe(() => G.housing.current().id, null); if (!h || safe(() => G.housing.isHome(G.scene.id), false)) return;
  const hf = (c.T % DAY) / 60, wet = safe(() => G.weather.isWet(), false); if (!(hf >= 17 || wet)) return;
  c.push({ id: 'home:in', key: 'home:in', kind: 'home', cat: 'home', base: wet ? 44 : 38, title: 'An evening in', why0: 'The TV, a book, the stove, a room to rearrange', icon: 'ui.home', placeId: 'home:' + h, dur: 90, fixed: false });
}
let wired = false;
export function registerSources() { if (wired || !G.myDay || !G.myDay.addSource) return; wired = true; G.myDay.addSource(sourcePlay); G.myDay.addSource(sourcePhone); G.myDay.addSource(sourceHome); }

/* ---------- picks ---------- */
const row = (i, extra) => Object.assign({ id: i.id, title: i.title, why: i.why || i.why0 || '', icon: i.icon || 'myday.idea', idea: i, dest: i.open ? null : i.placeId || i.pos || null, entryId: i.entryId || null, open: i.open || null, poor: !!i.poor }, extra);
/** greedy variety: at most `perKind` of a kind and one per place */
function vary(L, n, perKind = 2) { const out = [], kinds = {}, pl = {}; for (const i of L) { if (out.length >= n) break; const k = i.kind, p = i.placeId || i.id; if ((kinds[k] || 0) >= perKind || pl[p]) continue; kinds[k] = (kinds[k] || 0) + 1; pl[p] = 1; out.push(i); } return out; }
const ideasAll = () => safe(() => G.myDay.ideas({ n: 0, all: true }), []);

function funPicks(n = 8) {
  const T = now(), wet = safe(() => G.weather.isWet(), false), L = ideasAll().filter(i => !i.ahead && !i.clash && /^(show|event|big|interest|friend|coach|class|weather|play|app|home)$/.test(i.kind) && (!i.t || i.window || i.t - T <= 180 || !i.fixed)
    && !(wet && (i.kind === 'coach' || i.outdoor || i.fam === 'nature' && i.kind === 'interest')));   /* in the rain, nothing that leaves you standing in it */
  /* the engine's own lists stop at two of a kind; here every source of fun gets a look-in: one of each kind first, then the best of the rest */
  const first = vary(L, n, 1), rest = vary(L.filter(i => !first.includes(i)), n - first.length, 2);
  return first.concat(rest).slice(0, n).map(i => row(i));   /* one of each kind leads (best first), then the best of the rest */
}
function newPicks() {
  const out = [], used = new Set(), P = places().filter(e => openNow(e) !== false && !inRoom(e.placeId)), blk = today() + '|' + Math.floor(now() / 360);
  const mk = (e, title, why, icon, cat) => ({ id: 'new:' + e.placeId, key: 'new:' + e.placeId, kind: 'new', cat: cat || 'new', title, why: why + ' · ' + walkText(walkOf(e)), icon, placeId: e.placeId, dur: 60, fixed: false, day: today(), entryId: e.id, blurb: e.blurb });
  const near = (a, b) => walkOf(a) + hash(a.id + blk) * 20 - walkOf(b) - hash(b.id + blk) * 20;
  /* two places never visited, from different chapters */
  const fresh = P.filter(e => !safe(() => G.guide.known(e), true) || !visits(e.placeId)).sort(near), chs = new Set();
  for (const e of fresh) { if (out.length >= 2) break; if (e.chapter === 'eat' || chs.has(e.chapter)) continue; chs.add(e.chapter); used.add(e.placeId); out.push(row(mk(e, e.title, `${e.type || 'A place'} you have not been to`, 'myday.new'), { head: out.length ? null : 'A place' })); }
  /* a dish: somewhere to eat you have never been */
  const eat = fresh.find(e => e.chapter === 'eat' && !used.has(e.placeId)); if (eat) { used.add(eat.placeId); out.push(row(mk(eat, `Eat at ${eat.title}`, `${eat.type}: every dish there is new to you`, 'need.hunger', 'int:food'), { head: 'A food' })); }
  /* a recipe you know and have never cooked */
  const cooked = safe(() => G.state.needsx.cooked, {}), rec = safe(() => G.cooking.known().find(id => !cooked[id] && G.cooking.status(id).can), null), home = safe(() => G.housing.current().id, null);
  if (rec && home) { const nm = safe(() => G.inv.item(rec).name, null) || rec.replace(/_/g, ' ').replace(/^./, c => c.toUpperCase()); out.push({ id: 'cook:' + rec, title: `Cook ${nm} for the first time`, why: 'You have everything for it at home', icon: 'sys.cook', sysId: 'cooking', head: eat ? null : 'A food',
    idea: { id: 'cook:' + rec, key: 'cook:new', kind: 'home', cat: 'home', title: `Cook ${nm}`, placeId: 'home:' + home, dur: 45, fixed: false, day: today() }, dest: null }); }
  /* a thing to try: one of the play ideas you have no stamp for; a skill you have never practised */
  const plays = ideasAll().filter(i => i.kind === 'play' || i.kind === 'coach'), xp = k => safe(() => G.skills.xp(k), 0), skillOf = i => (i.icon || '').replace(/^skill\./, '');
  const t1 = plays.find(i => i.kind === 'play' && i.fresh && !used.has(i.placeId)); if (t1) { used.add(t1.placeId); out.push(row(t1, { head: 'A thing to try', why: 'No stamp for this yet · ' + walkText(t1.walk || 0) })); }
  const t2 = plays.find(i => i !== t1 && /^skill\./.test(i.icon || '') && !xp(skillOf(i)) && !used.has(i.placeId || i.id)); if (t2) { const nm = SKILL_NAME()[skillOf(t2)] || 'this'; out.push(row(t2, { head: 'A skill', why: `You have never tried ${nm} · ` + walkText(t2.walk || 0) })); }
  /* parts of the game you have not touched: two Systems cards that are still "new to you" */
  const sys = safe(() => G.shelf.list().filter(c => c.isNew && c.jump), []).sort((a, b) => hash(a.id + blk) - hash(b.id + blk)).slice(0, 2);
  sys.forEach((c, k) => out.push({ id: 'sys:' + c.id, title: c.name, why: c.how[0], icon: c.icon, sysId: c.id, go: c.jump.label, head: k ? null : 'A part of the game' }));
  return out;
}
const SOFT = Object.fromEntries(NEEDS.filter(n => n.soft).map(n => [n.id, 1])), HOME_FIX = { hunger: 'Cook at home', energy: 'Sleep at home', hygiene: 'A shower at home', fun: 'Feet up at home', comfort: 'Home', bladder: 'Home' };
function needPicks() {
  const out = [];
  for (const n of NEEDS) { const v = safe(() => G.needs.get(n.id), 100), band = safe(() => G.needs.band(n.id), null);
    const rows = SOFT[n.id] ? safe(() => G.needsExtra.fix(n.id, 3), []) : safe(() => G.nav.find(n.id, 3), []), q = rows.find(r => r && r.open !== false && !(typeof r.id === 'string' && inRoom(r.id))) || rows[0] || null;
    if (!q) { out.push({ id: 'need:' + n.id, title: n.name, why: 'Nothing on the map for this yet. Explore a little.', icon: 'need.' + n.id, need: n.id, meter: v, band: band && band.label }); continue; }
    const isStr = typeof q.id === 'string', home = q.home || (isStr && /^home:/.test(q.id)), nm = String(q.name || '').replace(/ \(.*\)$/, ''), title = home && HOME_FIX[n.id] ? HOME_FIX[n.id] : nm, dist = safe(() => G.nav.fmtDist(q.d), '');
    out.push({ id: 'need:' + n.id, title: n.name, sub: title, why: [q.note && !q.friend && !home ? q.note : '', dist, q.open === false ? 'closed now' : ''].filter(Boolean).join(' · '), icon: 'need.' + n.id, need: n.id, meter: v, band: band && band.label, dest: q.id, needPlace: isStr ? q.id : null,
      idea: Object.assign({ id: 'need:' + n.id + ':' + (isStr ? q.id : 'spot'), key: 'need:' + n.id, kind: 'need', cat: 'need', title: `${n.name}: ${title}`, dur: 45, fixed: false, day: today(), needId: n.id }, isStr ? { placeId: q.id } : { pos: { x: q.id.x, y: q.id.y, name: q.id.name || nm } }) }); }
  return out.sort((a, b) => a.meter - b.meter);
}
function tonightPicks() {
  const T = now(), d0 = today() * DAY, hf = (T - d0) / 60, out = [];
  if (hf >= 4 && hf < 17) {   /* asked in the daytime: what the evening holds (things with a time first, then places that are open then) */
    const L = safe(() => G.myDay.ideas({ n: 0, at: d0 + 18 * 60, until: d0 + DAY - 1 }), []).filter(i => i.kind !== 'opp' && i.kind !== 'pin'), timed = L.filter(i => i.t && (i.fixed || i.window)).sort((a, b) => a.t - b.t), open = L.filter(i => !timed.includes(i));
    const why = i => [i.t ? (i.window && i.end ? `${hh(Math.max(i.t, d0 + 17 * 60))} to ${hh(i.end)}` : 'At ' + hh(i.t)) : 'Open this evening', i.venue && !String(i.title).includes(i.venue) ? i.venue : '', i.price ? '$' + i.price : '', i.walk ? walkText(i.walk) : ''].filter(Boolean).join(' · ');
    return vary(timed, 6, 4).concat(vary(open, 3, 2)).map(i => row(i, { why: why(i) })); }
  const late = hf < 4 || hf >= 23, wet = safe(() => G.weather.isWet(), false), L = ideasAll().filter(i => !i.ahead && /^(show|event|big|interest|friend|weather|play|app|home|coach)$/.test(i.kind) && (!i.t || i.t - T <= 300 || i.window) && !(wet && (i.kind === 'coach' || i.outdoor)));
  for (const i of vary(L, 8, 3)) out.push(row(i));
  if (late && out.length) out[0].head = 'It is late. What is still going:';
  return out;
}
function weekendPicks() {
  const d = today(), wd = d % 7, days = wd === 5 ? [d, d + 1] : wd === 6 ? [d] : [d + (5 - wd), d + (6 - wd)], out = [], seen = new Set();
  for (const day of days) { const L = safe(() => G.myDay.ideas({ n: 0, day }), []).filter(i => !seen.has(i.key)), top = vary(L.filter(i => i.fixed || i.window).concat(L.filter(i => !i.fixed && !i.window)), 5, 3);
    top.sort((a, b) => (a.t || 1e12) - (b.t || 1e12)).forEach((i, k) => { seen.add(i.key); out.push(row(i, { head: k ? null : (day === d ? 'Today, ' : day === d + 1 ? 'Tomorrow, ' : '') + (day % 7 === 5 ? 'Saturday' : 'Sunday') })); }); }
  return out;
}
const DRY = /Cinema|Museum|Aquarium|library|Botanical|Gallery|Shopping mall|Swimming pool|Cafe|Tea house|Bookshop|Record shop|Concert hall|Theatre|Observatory|Arena|Grand hotel|Fish market|Comic shop|Gym/i;
function rainyPicks() {
  const blk = today() + '|' + Math.floor(now() / 360), P = places().filter(e => DRY.test(e.type || '') && openNow(e) !== false && !inRoom(e.placeId)), types = new Set(), out = [];
  P.sort((a, b) => walkOf(a) + (visits(a.placeId) ? 8 : 0) + hash(a.id + blk) * 10 - walkOf(b) - (visits(b.placeId) ? 8 : 0) - hash(b.id + blk) * 10);
  for (const e of P) { if (out.length >= 6) break; if (types.has(e.type)) continue; types.add(e.type);
    out.push(row({ id: 'wx:' + e.placeId, key: 'wx:' + e.placeId, kind: 'weather', cat: 'wx', title: e.title, why: `${e.type} · ${walkText(walkOf(e))}` + (visits(e.placeId) ? '' : ' · new to you'), icon: 'sys.rainy', placeId: e.placeId, dur: 60, fixed: false, day: today(), entryId: e.id, blurb: e.blurb })); }
  const extra = ideasAll().filter(i => i.kind === 'app' || i.kind === 'home'); extra.forEach((i, k) => out.push(row(i, { head: k ? null : 'Or stay in' })));
  return out;
}
const FN = { fun: funPicks, new: newPicks, need: needPicks, tonight: tonightPicks, weekend: weekendPicks, rainy: rainyPicks };
let memo = new Map(), hooked = false, holdT = 0;
/** keep the lists as they are for a moment: the page that just added a pick to the day re-renders, and the pick should stay where it was, marked "On your day" */
export const hold = () => { holdT = performance.now() + 1500; };
export function picks(tool) {
  registerSources(); if (!hooked) { hooked = true; G.on('myday:change', () => { if (performance.now() > holdT) memo.clear(); }); G.on('needs:change', () => { memo.delete('need'); }); }
  const key = Math.floor(now()) + '|' + (G.scene && G.scene.id); let m = memo.get(tool);
  if (!m || m.key !== key) { m = { key, list: safe(() => FN[tool](), []) }; memo.set(tool, m); }
  return m.list;
}
/** the small live line under each tile on the front page (cheap: no tool is built for it except Fun, which the page shows anyway) */
export function tileSub(tool) {
  if (tool === 'fun') { const n = picks('fun').length; return n ? `${n} ideas near you` : 'A quiet hour'; }
  if (tool === 'need') { const a = safe(() => G.needs.all(), {}), k = Object.keys(a).sort((x, y) => a[x] - a[y])[0], nm = (NEEDS.find(n => n.id === k) || {}).name; return k ? `Lowest: ${nm} ${Math.round(a[k])}` : ''; }
  if (tool === 'new') { const n = safe(() => G.shelf.list().filter(c => c.isNew).length, 0), s = safe(() => G.guide.stats(), null); return s ? `${s.stamps - s.stamped} still untried` : n ? `${n} parts of the game` : ''; }
  if (tool === 'tonight') { const d = today(), n = safe(() => G.guide.whatsOn().filter(o => o.day === d && o.t > now() && (o.t % DAY) >= 17 * 60).length, 0); return n ? `${n} on this evening` : 'A quiet one'; }
  if (tool === 'weekend') { const wd = today() % 7; return wd === 5 ? 'It is Saturday' : wd === 6 ? 'It is Sunday' : `In ${5 - wd} day${5 - wd === 1 ? '' : 's'}`; }
  if (tool === 'rainy') { const w = safe(() => G.weather.current(), null); return w && w.wet ? 'It is raining now' : safe(() => /rain|storm/.test(G.weather.daySummary(1).kind), false) ? 'Rain due tomorrow' : 'For when it pours'; }
  return '';
}
