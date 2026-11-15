// Home care: toiletries + cleaning supplies that run out with use, and how clean the home is (Wave C; numbers in src/data/supplies.js and
// SOFT.clean in src/data/needs.js). Nothing here nags: ONE friendly notice when something first runs low, then only a quiet basket chip in the HUD.
//
// State G.state.supplies = { stock: { key: usesLeft }, warned: { key: 1 }, lastNote: t, clean: 0..100, brush: { d, n }, said: { key: day }, washer: 0|1, v: 1 }
//   (old saves get the day-1 stock and a tidy home).
//
// G.supplies
//   all() -> [{ key, name, item, left, full, low: bool, out: bool, kind }]        left(key) -> uses left (may be fractional)
//   use(action) -> { used: [keys], missing: [keys] }     action: a key of data USE ('shower', 'bath', 'wash_hands', 'toilet', 'brush', 'clean', 'wash')
//   add(key, uses)        putAway(quiet?) -> n items moved from the backpack to the bathroom / cupboard (runs by itself when you come home)
//   low() -> [keys at or under their low mark]            shops(keys?) -> [{ id, name, d }] nearest known shops that sell them
//   clean() -> 0..100     cleanLabel()     addClean(d)    mess() -> how many bits of mess are showing at home
//   tidy('spot' | 'quick' | 'full') -> starts that cleaning activity (at home)        brush() -> brush your teeth (at the bathroom sink)
//   open()  the "Home supplies" window (also behind the HUD basket chip and the cleaning things at home)
// Events: 'supplies:change', 'supplies:low'(key), 'supplies:out'(key), 'supplies:restock'(key, uses), 'home:clean'(kind, cleanliness), 'home:brush'.
// In the home: a broom + bucket ("Cleaning things": quick tidy / proper clean / supplies) stands in a free corner of the main room, bits of mess
// (dust, a stray sock, a pizza box...) appear on the floor as the home gets dirtier ("Tidy this up"), and the bathroom sink asks "wash hands or brush teeth".
import { G } from '../core/game.js';
import { SUPPLIES, SUPPLY_BY_KEY, SUPPLY_BY_ITEM, USE, WITHOUT, BRUSH, syncSupplyShops } from '../data/supplies.js';
import { SOFT } from '../data/needs.js';
import { ITEM_BY_ID } from '../data/items.js';
import * as R from '../engine/raster.js';
import { toast, modal, choose, el } from '../ui/kit.js';
import { iconEl } from '../ui/_icons.js';
import '../art/icons/needs_extra.js';

export const order = 96;   /* after housing, inventory, bladder, laundry; before the HUD only matters for the chip, which is added on 'ready' */
const O = 1, C = SOFT.clean;
const safe = (f, d) => { try { const v = f(); return v === undefined || v === null ? d : v; } catch (e) { return d; } };
const clamp = (v, a = 0, b = 100) => Math.max(a, Math.min(b, v));
let S = null, chip = null, putting = false;
const fresh = () => ({ stock: Object.fromEntries(SUPPLIES.map(s => [s.key, s.start])), warned: {}, lastNote: -1e9, clean: C.start, brush: { d: -1, n: 0 }, said: {}, washer: 0, v: 1 });
const day = () => Math.floor(G.state.t / 1440);
const isHome = () => safe(() => G.housing.isHome(), false);
const homeId = () => safe(() => G.state.home.id, null);
const watched = s => !s.needs || !!S.washer;
const onceToday = (k, text, kind = 'info') => { if (S.said[k] === day()) return; S.said[k] = day(); toast(text, kind, 4200); };

/* ---------- stock ---------- */
const left = k => Math.max(0, S.stock[k] || 0);
const all = () => SUPPLIES.map(s => ({ key: s.key, name: s.name, item: s.item, kind: s.kind, left: left(s.key), full: s.uses, low: watched(s) && left(s.key) <= s.low, out: left(s.key) < (s.key === 'soap' ? 0.2 : 1) }));
const low = () => all().filter(s => s.low).map(s => s.key);
function sync() { G.emit('supplies:change'); syncChip(); }
function warn(key) {
  const s = SUPPLY_BY_KEY[key]; if (!s || S.warned[key] || !watched(s)) return; S.warned[key] = 1; G.emit('supplies:low', key);
  /* one notice, then quiet: a second thing running low within half a day only updates the basket chip */
  if (G.state.t - S.lastNote < 720) return; S.lastNote = G.state.t;
  const shop = shops([key])[0], text = `You are nearly out of ${s.name}.` + (shop ? ` ${shop.name} has it.` : ' Any grocery or corner shop has it.');
  if (G.phone && G.phone.notify) safe(() => G.phone.notify({ app: 'wellness', title: 'Running low', text, icon: s.item, priority: 'normal', data: { tab: 'me' } })); else toast(text, 'info', 4200);
}
function use(action) {
  const need = USE[action] || {}, used = [], missing = [];
  for (const k in need) {
    const s = SUPPLY_BY_KEY[k]; if (!s) continue; const n = need[k], had = left(k);
    if (had < Math.min(1, n) - 1e-6) { missing.push(k); if (watched(s)) warn(k); continue; }
    S.stock[k] = Math.max(0, Math.round((had - n) * 100) / 100); used.push(k);
    if (left(k) <= s.low) warn(k);
    if (left(k) < Math.min(1, n) && had >= Math.min(1, n)) G.emit('supplies:out', k);
  }
  if (used.length || missing.length) sync();
  return { used, missing };
}
function add(key, uses) { const s = SUPPLY_BY_KEY[key]; if (!s || !(uses > 0)) return 0; S.stock[key] = left(key) + uses; if (left(key) > s.low) delete S.warned[key]; G.emit('supplies:restock', key, uses); sync(); return S.stock[key]; }
/** coming home: toiletries and cleaning things go from the backpack to where they live */
function putAway(quiet) {
  if (putting || !G.inv || !isHome()) return 0; putting = true; let n = 0; const names = [];
  try { for (const s of SUPPLIES) { const c = safe(() => G.inv.count(s.item), 0); if (!c) continue; if (!safe(() => G.inv.remove(s.item, c), false)) continue; add(s.key, s.uses * c); n += c; names.push((ITEM_BY_ID[s.item] || {}).name || s.name); } } finally { putting = false; }
  if (n && !quiet) toast('Put away at home: ' + names.join(', ') + '.', 'good', 3600);
  return n;
}
function shops(keys) {
  keys = keys && keys.length ? keys : low(); if (!keys.length) keys = SUPPLIES.map(s => s.key);
  const items = keys.map(k => ITEM_BY_ID[(SUPPLY_BY_KEY[k] || {}).item]).filter(Boolean), p = safe(() => (G.scene && G.scene.id === 'city' ? G.player : G.state.phone.cityPos), null) || G.player, out = [];
  for (const q of safe(() => G.places.list(), [])) {
    if (!q || !isFinite(q.x) || !items.some(it => it.soldAt.includes(q.id))) continue;
    out.push({ id: q.id, name: q.name, d: Math.hypot(q.x - p.x, q.y - p.y), n: items.filter(it => it.soldAt.includes(q.id)).length });
  }
  return out.sort((a, b) => (b.n === items.length) - (a.n === items.length) || a.d - b.d).slice(0, 4);
}

/* ---------- cleanliness ---------- */
const cleanLabel = () => (C.labels.find(l => S.clean >= l.min) || C.labels[C.labels.length - 1]).label;
const messWanted = () => C.messAt.filter(m => S.clean < m).length;
function addClean(d) { const was = messWanted(); S.clean = clamp(S.clean + d); if (messWanted() !== was) syncMess(); G.emit('supplies:change'); return S.clean; }
function tick(dm) {
  if (!S || (G.dev && G.dev.frozen) || !homeId()) return;
  let r = C.perHour; if (isHome() && !(G.needs && G.needs.sleeping)) r += C.atHomeAwake;
  const was = messWanted(); S.clean = clamp(S.clean + r * dm / 60); if (messWanted() !== was) syncMess();
}
function tidy(kind, it) {
  if (!isHome()) { toast('That is a job for when you are at home.', 'info'); return null; }
  if (G.busy) return null;
  if (kind === 'full' && (left('cleaner') < 1 || left('sponge') < 1)) { toast(`A proper clean needs ${left('cleaner') < 1 ? 'all-purpose cleaner' : 'sponges and cloths'}. Any grocery or corner shop has them.`, 'info', 4200); return null; }
  if (kind === 'quick' && S.clean >= C.quickCap) { toast('It is already tidy. Only a proper clean would make it sparkle.', 'info', 3600); return null; }
  const minutes = kind === 'full' ? C.fullMinutes : kind === 'quick' ? C.quickMinutes : C.spotMinutes;
  return G.startActivity({ label: kind === 'full' ? 'Cleaning the place properly' : kind === 'quick' ? 'A quick tidy' : 'Tidying up', anim: 'work', minutes, rate: kind === 'spot' ? 6 : 10,
    done() {
      if (kind === 'full') { use('clean'); addClean(C.full); safe(() => G.needs.add('comfort', 8)); safe(() => G.needs.addMoodlet('spick_and_span')); safe(() => G.skills.addXp('handiness', 6)); toast(`All clean. Home is ${cleanLabel().toLowerCase()}.`, 'good', 3600); }
      else if (kind === 'quick') { S.clean = clamp(Math.min(Math.max(S.clean, C.quickCap), S.clean + C.quick)); syncMess(); safe(() => G.needs.add('comfort', 3)); toast(`That looks better. Home is ${cleanLabel().toLowerCase()}.`, 'good', 3200); }
      else { if (it && it.mess) it.mess.ob.hidden = true; addClean(C.spot); syncMess(); safe(() => G.needs.add('comfort', 2)); toast(['Gone.', 'One thing less.', 'Much better.', 'There.'][Math.floor(G.state.t) % 4], 'good', 1800); }
      G.emit('home:clean', kind, S.clean);
    } });
}
function brush(it) {
  if (G.busy) return null;
  return G.startActivity({ label: 'Brushing your teeth', anim: 'stand', minutes: BRUSH.minutes, rate: 6,
    done() {
      const r = use('brush'), d = day(); if (S.brush.d !== d) S.brush = { d, n: 0 };
      if (r.missing.length) { safe(() => G.needs.add('hygiene', 2)); onceToday('no_tp_paste', 'No toothpaste left, so you rinse and call it a day.'); }
      else { S.brush.n++; safe(() => G.needs.add('hygiene', S.brush.n <= BRUSH.perDay ? BRUSH.hygiene : 2)); safe(() => G.needs.addMoodlet(BRUSH.moodlet)); }
      G.emit('home:brush');
    } });
}

/* ---------- consumption hooks ---------- */
function onActivity(id, r) {
  if (!r || r.completed === false || !isHome()) return;
  if (id === 'shower' || id === 'bath') {
    const u = use(id), cost = u.missing.reduce((a, k) => a + ((WITHOUT[k] || {})[id] || 0), 0);
    if (cost) { safe(() => G.needs.add('hygiene', cost)); onceToday('no_' + u.missing[0], u.missing.includes('soap') ? 'No soap left, so that was more of a rinse.' : 'No shampoo left. Water does half the job.'); }
  } else if (id === 'wash_hands') use('wash_hands');
  else if (id === 'cook' || id === 'prep_cold') addClean(C.cook);
}
function onRelief(o) {
  if (!o || o.kind !== 'toilet' || !homeId() || !String(o.where || '').startsWith('home:' + homeId())) return;
  const u = use('toilet'); if (u.missing.length) { safe(() => G.needs.add('hygiene', WITHOUT.tp.toilet)); onceToday('no_tp', 'Out of toilet paper. You make do with tissues from your bag.'); }
}
function onWash(load) {
  if (!load || !load.home) return; S.washer = 1;
  const u = use('wash'); if (u.missing.length) onceToday('no_detergent', 'No laundry detergent: the wash runs on water alone. Any grocery has a jug.'); else safe(() => G.needs.add('comfort', 2));
}

/* ---------- the home: cleaning things, bits of mess, the sink ---------- */
const MESS = [
  { key: 'mess_dust', size: [.7, .6, .2], draw() { R.ball(.2, .25, 0, .13, '#b9b3c4'); R.ball(.42, .34, 0, .16, '#a7a1b4'); R.ball(.3, .12, 0, .09, '#c9c4d2'); R.ball(.56, .2, 0, .08, '#b9b3c4'); } },
  { key: 'mess_sock', size: [.7, .6, .2], draw() { R.box(.1, .2, 0, .36, .14, .07, '#e05a3a'); R.box(.4, .2, 0, .12, .26, .07, '#e05a3a'); R.box(.1, .2, .07, .1, .14, .02, '#fbf7ee'); R.box(.36, .42, 0, .22, .1, .05, '#3b82d6'); } },
  { key: 'mess_box', size: [.8, .8, .2], draw() { R.box(.08, .08, 0, .6, .6, .07, '#d8a868'); R.qz(.14, .62, .14, .62, .075, '#efe3c8'); R.qz(.3, .46, .3, .46, .08, '#e05a3a'); } },
  { key: 'mess_cups', size: [.7, .6, .4], draw() { R.cyl(.2, .22, 0, .09, .2, '#fbf7ee'); R.cyl(.44, .3, 0, .09, .16, '#6fb3e0'); R.box(.26, .42, 0, .3, .12, .03, '#efe3c8'); } },
  { key: 'mess_paper', size: [.8, .7, .2], draw() { R.qz(.08, .44, .1, .4, .02, '#fbf7ee'); R.qz(.3, .68, .26, .58, .03, '#efe3c8'); R.ball(.6, .16, 0, .08, '#fbf7ee'); R.ball(.2, .52, 0, .07, '#efe3c8'); } },
];
const CADDY = { key: 'clean_caddy', size: [.7, .6, 1.5], vb: [-.1, -.1, 0, .9, .8, 1.6], solid: false,
  draw() { R.cyl(.3, .32, 0, .2, .3, '#3b82d6'); R.cyl(.3, .32, .28, .21, .04, '#6fb3e0'); R.box(.54, .14, 0, .05, .05, 1.4, '#b8794a'); R.box(.46, .08, 0, .2, .16, .22, '#f2c230'); R.box(.2, .5, 0, .1, .1, .34, '#e0608e'); R.box(.22, .52, .34, .06, .06, .08, '#fbf7ee'); } };
let rt = null;   /* { scene, mess: [{ ob, it, gone }] } for the home main room that is built right now */
function freeSpots(scene) {
  const W = scene.world, def = scene.def, w = def.w, d = def.d, sp = typeof scene.spawn === 'function' ? null : scene.spawn; if (!sp) return [];
  const key = (x, y) => Math.round(x * 2) + ',' + Math.round(y * 2), seen = new Map(), q = [[Math.round(sp.x * 2) / 2, Math.round(sp.y * 2) / 2]]; seen.set(key(q[0][0], q[0][1]), q[0]);
  while (q.length) { const [x, y] = q.pop(); for (const [dx, dy] of [[.5, 0], [-.5, 0], [0, .5], [0, -.5]]) { const nx = x + dx, ny = y + dy, k = key(nx, ny); if (seen.has(k) || nx < O + .5 || ny < O + .5 || nx > O + w - .5 || ny > O + d - .5 || W.isBlocked(nx, ny)) continue; seen.set(k, [nx, ny]); q.push([nx, ny]); } }
  const its = scene.interactables.map(i => [i.x, i.y, i.spot, i.exit]), solid = (x, y) => scene.fixtures.some(f => !f.item.wall && f.ob.size[2] > .12 && f.ob.B[0] < x + .3 && f.ob.B[3] > x - .3 && f.ob.B[1] < y + .3 && f.ob.B[4] > y - .3);
  const out = [];
  for (const [x, y] of seen.values()) {
    if (solid(x, y)) continue;
    let ok = true; for (const [ix, iy, spot, exit] of its) { if (Math.hypot(ix - x, iy - y) < (exit ? 1.7 : .8) || (spot && Math.hypot(spot.x - x, spot.y - y) < .8)) { ok = false; break; } }
    if (ok) out.push({ x, y, wall: Math.min(x - O, y - O), exitD: Math.min(...its.filter(i => i[3]).map(i => Math.hypot(i[0] - x, i[1] - y)), 99) });
  }
  return out;
}
function dressHome(scene) {
  const hid = homeId(); if (!hid || !scene || !scene.def) return;
  const rid = String(scene.roomId || '');
  if (rid === 'home:' + hid + ':bath' || rid === 'home:' + hid) {
    for (const it of scene.interactables) { if (!it.fx || !it.fx.tags || !it.fx.tags.includes('sink') || it._sup || !/^Wash/.test(it.label || '')) continue; it._sup = 1; const orig = it.use; it.label = 'Sink';
      if (/:bath$/.test(rid) && scene.fixtures.some(f => f.tags.includes('shower') && f.ob && f.ob.size[2] > 1.2)) { it.z = (it.z || 0) + .95; it.h = .5; }   /* QA9: the tap point on the basin + mirror, above the shower curtain that hangs in front of it (taps on the curtain gave the sink) */
      it.use = (g, me) => choose('At the sink', [{ label: 'Wash your hands', sub: '1 min', value: 'w' }, { label: 'Brush your teeth', sub: left('toothpaste') >= 1 ? '3 min' : '3 min · no toothpaste left', value: 'b' }]).then(v => { if (v === 'w') return orig(g, me); if (v === 'b') brush(me); }); }
  }
  if (rid !== 'home:' + hid || scene._care) return; scene._care = 1;
  const W = scene.world, spots = freeSpots(scene); if (!spots.length) return;
  /* the broom + bucket: a free reachable tile against a back wall, not by the door */
  const corner = spots.slice().sort((a, b) => (a.wall - b.wall) || (b.exitD - a.exitD))[0];
  safe(() => W.placeCustom(CADDY, corner.x - .35, corner.y - .5, { z: 0 }));
  scene.interactables.push({ x: corner.x, y: corner.y - .2, h: 1.1, hit: 14, range: 1.5, label: 'Cleaning things', care: true, use: () => caddyMenu() });
  /* up to five bits of mess on open floor (hidden until the home is dirty enough) */
  const rnd = R.rng(hid.length * 131 + scene.def.w * 17 + scene.def.d), open = spots.filter(s => s !== corner && s.wall >= 1 && s.exitD > 1.6), mess = [];
  for (let i = 0; i < MESS.length && open.length; i++) {
    const j = Math.floor(rnd() * open.length), s = open.splice(j, 1)[0]; for (let k = open.length - 1; k >= 0; k--) if (Math.hypot(open[k].x - s.x, open[k].y - s.y) < 1.4) open.splice(k, 1);
    const m = MESS[i], ob = safe(() => W.placeCustom({ key: m.key, size: m.size, vb: [-.05, -.05, 0, m.size[0] + .05, m.size[1] + .05, m.size[2] + .1], solid: false, draw: m.draw }, s.x - m.size[0] / 2, s.y - m.size[1] / 2, { z: 0 }), null); if (!ob) continue;
    const rec = { ob }; ob.hidden = true;
    rec.it = { x: s.x, y: s.y, h: .5, hit: 13, range: 1.2, label: 'Tidy this up', mess: rec, visible: () => !ob.hidden, use: (g, me) => tidy('spot', me) };
    scene.interactables.push(rec.it); mess.push(rec);
  }
  rt = { scene, mess }; syncMess();
}
function syncMess() {
  if (!rt || !rt.scene) return; const want = messWanted(); let shown = rt.mess.filter(m => !m.ob.hidden).length;
  for (const m of rt.mess) { if (shown >= want) break; if (m.ob.hidden) { m.ob.hidden = false; shown++; } }
  for (const m of rt.mess.slice().reverse()) { if (shown <= want) break; if (!m.ob.hidden) { m.ob.hidden = true; shown--; } }
}
const mess = () => (rt ? rt.mess.filter(m => !m.ob.hidden).length : messWanted());
function caddyMenu() {
  const can = left('cleaner') >= 1 && left('sponge') >= 1;
  return choose(`Home is ${cleanLabel().toLowerCase()}`, [
    { label: 'Clean the place properly', sub: can ? `${C.fullMinutes} min · uses cleaner and a sponge` : 'needs all-purpose cleaner and sponges', value: 'full', disabled: !can },
    { label: 'A quick tidy', sub: S.clean >= C.quickCap ? 'already tidy' : `${C.quickMinutes} min · no supplies needed`, value: 'quick', disabled: S.clean >= C.quickCap },
    { label: 'Check the supplies', sub: low().length ? `${low().length} running low` : 'all stocked', value: 'list' },
  ]).then(v => { if (v === 'list') open(); else if (v) tidy(v); });
}

/* ---------- UI: the window + the HUD chip ---------- */
function open() {
  const m = modal({ title: 'Home supplies', cls: 'sup-win' }), L = all();
  m.body.append(el('div', { style: 'display:flex;align-items:center;gap:8px;margin-bottom:8px;font-weight:700' }, iconEl('ui.broom', 2), el('span', { style: 'flex:1', text: `Home: ${cleanLabel()}` }), el('small', { style: 'opacity:.7', text: mess() ? `${mess()} thing${mess() > 1 ? 's' : ''} to tidy` : 'nothing lying about' })));
  for (const s of L) {
    if (s.kind === 'laundry' && !S.washer && !s.left) continue;
    const pct = Math.min(100, s.left / s.full * 100), col = s.out ? '#e0452f' : s.low ? '#f0a020' : '#4fae4a';
    m.body.append(el('div', { 'data-sup': s.key, style: 'display:flex;align-items:center;gap:8px;margin:5px 0' }, iconEl(s.item, 2),
      el('div', { style: 'flex:1;min-width:0' }, el('div', { style: 'display:flex;justify-content:space-between;font-size:13px;font-weight:700' }, el('span', { text: s.name.replace(/^./, c => c.toUpperCase()) }), el('span', { style: 'opacity:.75;font-weight:600', text: s.out ? 'none left' : s.low ? 'running low' : `about ${Math.ceil(s.left)} uses` })),
        el('span', { style: 'display:block;height:7px;border:2px solid #2a2733;background:#2a27331c' }, el('i', { style: `display:block;height:100%;width:${pct}%;background:${col}` })))));
  }
  const lows = low(), sh = shops(lows);
  m.body.append(el('p', { style: 'font-size:12px;opacity:.75;margin:8px 0 6px', text: lows.length ? 'What you buy puts itself away when you get home.' : 'All stocked. Nothing to fetch.' }));
  if (lows.length && sh.length) m.body.append(el('button.go', { style: 'width:100%', 'data-sup-go': sh[0].id, text: `Take me to ${sh[0].name}`, onclick: () => { m.close(); safe(() => (G.phone.routeTo && G.phone.routeTo(sh[0].id)) || G.phone.setWaypoint(sh[0].id)); } }));
  return m;
}
function syncChip() {
  if (!G.hud || !G.hud.addIndicator) return; const n = low().length;
  if (!n) { if (chip) chip.set({ hidden: true }); return; }
  if (!chip) chip = safe(() => G.hud.addIndicator({ id: 'supplies', icon: 'ui.supplies', title: 'Home supplies running low', onclick: () => open() }), null);
  if (chip) chip.set({ hidden: false, text: String(n) });
}

export function init() {
  S = G.defineState('supplies', fresh);
  const rebind = () => { S = G.state.supplies || (G.state.supplies = fresh()); const f = fresh(); for (const k in f) if (S[k] === undefined) S[k] = f[k]; for (const k in f.stock) if (S.stock[k] === undefined) S.stock[k] = f.stock[k]; rt = null; syncChip(); };
  rebind(); G.on('load', rebind);
  G.supplies = { all, left, use, add, putAway, low, shops, clean: () => S.clean, cleanLabel, addClean, mess, tidy, brush, open, SUPPLIES };
  G.on('minutes', tick);
  G.on('activity:done', onActivity); G.on('bladder:relief', onRelief); G.on('laundry:start', onWash);
  G.on('scene', () => { if (isHome()) setTimeout(() => putAway(), 400); });
  G.on('inv:change', () => { if (isHome() && !putting) putAway(); });
  G.on('room:build', sc => safe(() => dressHome(sc)));
  G.on('room:enter', sc => { if (rt && sc !== rt.scene && String(sc.roomId) === 'home:' + homeId()) rt = null; if (rt && sc === rt.scene) syncMess(); });
  G.on('home:move', () => { rt = null; });
  G.on('places:built', () => safe(syncSupplyShops)); G.on('ready', () => { safe(syncSupplyShops); syncChip(); });
  G.on('game:start', syncChip);
}
