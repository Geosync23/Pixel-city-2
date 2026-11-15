// Laundry: the hamper, the laundry bag, laundromat washers and dryers, your own washer / dryer / drying rack, the dry cleaner's counter.
//
// The loop: clothes worn too many days turn DIRTY (sim/wardrobe.js) -> taking them off drops them in the HAMPER -> at the hamper you pick up the LAUNDRY BAG ->
//   laundromat (any room with `laundry_machine` fixtures): tap a WASHER: $WASH_PRICE, WASH_MIN minutes -> tap a DRYER: $DRY_PRICE, DRY_MIN minutes -> collect (fold or stuff).
//     Wait on the spot (time skips) or leave and come back; the phone pings at each step. Left for FORGOT_MIN minutes, the attendant moves it to a basket (still yours).
//   at home (fixture tag `laundry` = a washer you own): free, HOME_WASH[tier] minutes, then the dryer (fixture `dryer`, HOME_DRY minutes), the drying rack (`dryrack`, RACK_MIN)
//     or hung around the flat (AIR_MIN). Home loads put themselves away when dry.
//   delicates (formal wear, sequins, expensive coats) are skipped by machines: the laundromat FRONT DESK dry-cleans them ($CLEAN_PRICE each, CLEAN_MIN minutes) and also
//     sells a wash-and-fold of the whole bag ($FOLD_PRICE, FOLD_MIN minutes).
// While a piece is in the hamper, a machine or at the cleaner it cannot be worn. Nothing clean at all -> the bathrobe (wardrobe.wearRobe), with reactions.
//
// G.laundry
//   hamper() -> [ids]   gather() move dirty things you are not wearing into the hamper   hasBag()   takeBag() / dropBag()   loads() -> [{ id, where, home, ids, stage, t }]
//   status() -> [{ text, t?, done? }] for the Closet app   startWash(where, opts) / startDry(load, kind) / collect(load, fold)   tick()
// State G.state.laundry = { bag: 0|1, n, loads: [{ id, where (room id), home: 0|1, ids, stage: 'wash'|'washed'|'dry'|'done', t (end minute), basket?: 1, kind? }], hamperHome: homeId, done: n }
// Events: 'laundry:hamper'(id), 'laundry:start'(load), 'laundry:washed'(load), 'laundry:dry'(load), 'laundry:done'(load), 'laundry:clean'(ids)
// Home goods registered here at runtime (not in data/items.js): hamper_t0, hamper_t1, washer_t0, washer_t1, washer_t2, dryer_t1, dryrack_t0 (sold at `homegoods`).
import { G } from '../core/game.js';
import { toast, choose } from '../ui/kit.js';
import { registerFixture } from '../scenes/interior.js';
import { ITEMS, ITEM_BY_ID, HOMEGOODS } from '../data/items.js';
import { VIS } from './housing.js';
import { CLEAN, WORN, DIRTY, HAMPER, WASH, CLEANER } from './wardrobe.js';

export const order = 132;
export const WASH_PRICE = 3, DRY_PRICE = 2, WASH_MIN = 30, DRY_MIN = 40, FORGOT_MIN = 120, LOAD_MAX = 14, HOME_WASH = [70, 50, 35], HOME_DRY = 45, RACK_MIN = 300, AIR_MIN = 480, CLEAN_PRICE = 6, CLEAN_MIN = 240, FOLD_PRICE = 9, FOLD_MIN = 180;
const hg = (id, tag, tier, name, price, fp, icon, amb) => ({ id, name, category: 'homegood', price, icon, effects: {}, stack: 1, soldAt: ['homegoods'], tag, tier, footprint: fp, placement: 'floor', bonus: { mult: 1, ambience: amb || 0 } });
const GOODS = [hg('hamper_t0', 'hamper', 0, 'Wicker Laundry Hamper', 18, [1, 1], 'woven basket of clothes'), hg('hamper_t1', 'hamper', 1, 'Canvas Hamper with Lid', 45, [1, 1], 'white canvas hamper', 1),
  hg('washer_t0', 'laundry', 0, 'Second-Hand Top Loader', 160, [1, 1], 'old washing machine'), hg('washer_t1', 'laundry', 1, 'Front-Load Washer', 420, [1, 1], 'white washing machine', 1), hg('washer_t2', 'laundry', 2, 'Whisper Wash 9000', 880, [1, 1], 'dark washing machine, gold door', 2),
  hg('dryer_t1', 'dryer', 1, 'Tumble Dryer', 380, [1, 1], 'white tumble dryer', 1), hg('dryrack_t0', 'dryrack', 0, 'Folding Drying Rack', 22, [2, 1], 'drying rack with clothes')];
for (const it of GOODS) if (!ITEM_BY_ID[it.id]) { ITEMS.push(it); ITEM_BY_ID[it.id] = it; HOMEGOODS.push(it); }
Object.assign(VIS, { hamper_t0: { a: 'laundry.hamper', p: { tier: 0 } }, hamper_t1: { a: 'laundry.hamper', p: { tier: 1 } }, washer_t0: { a: 'bath.washer', p: { tier: 0 } }, washer_t1: { a: 'bath.washer', p: { tier: 1 } }, washer_t2: { a: 'bath.washer', p: { tier: 2 } },
  dryer_t1: { a: 'laundry.dryer', p: {} }, dryrack_t0: { a: 'laundry.dryrack', p: {} } });

let S = null;
const safe = (fn, fb) => { try { const v = fn(); return v === undefined || v === null ? fb : v; } catch (e) { return fb; } };
const W = () => G.wardrobe, now = () => G.state.t || 0, fmt = n => (G.money && G.money.fmt ? G.money.fmt(n) : '$' + n), plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
const stamp = id => safe(() => G.guide.stamp(id)), roomId = () => (G.scene ? G.scene.roomId || String(G.scene.id).replace(/^int:/, '') : '');
const isHome = () => safe(() => G.housing.isHome(), false);
const left = t => { const m = Math.max(0, Math.ceil(t - now())); return m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min`; };
const notify = (title, text) => { if (G.phone && G.phone.notify && !G.modal) safe(() => G.phone.notify({ app: 'closet', title, text, icon: 'app.closet' })); else toast(text, 'info', 4200); };

const hamper = () => W().byState(HAMPER);
function gather() { const worn = W().wornIds(), ids = W().byState(DIRTY).filter(id => !worn.includes(id)); if (ids.length) W().setState(ids, HAMPER); return ids.length; }
function carry(on) { const p = G.player; if (!p) return; p.carry = !!on; if (on) p.poseOpts = { item: 'bag', itemColor: '#e8e2d4' }; else if (p.poseOpts && p.poseOpts.item === 'bag') p.poseOpts = null; }
function takeBag() { gather(); if (!hamper().length) { toast('The hamper is empty. Clothes land here when you change out of dirty ones.', 'info'); return false; } S.bag = 1; carry(true); toast(`Laundry bag over your shoulder: ${plural(hamper().length, 'piece')}. Any washer will do.`, 'good', 3400); return true; }
function dropBag(quiet) { if (!S.bag) return; S.bag = 0; carry(false); if (!quiet) toast('The laundry bag goes back in the hamper.', 'info'); }
const washables = () => hamper().filter(id => !W().delicate(id)), delicates = () => hamper().filter(id => W().delicate(id));
const mine = where => S.loads.filter(l => l.where === where);

function startWash(where, o = {}) {
  const ids = washables().slice(0, o.max || LOAD_MAX); if (!ids.length) return null;
  W().setState(ids, WASH); const load = { id: ++S.n, where, home: o.home ? 1 : 0, ids, stage: 'wash', t: now() + (o.minutes || WASH_MIN), no: o.no || 0 }; S.loads.push(load);
  if (!hamper().length) dropBag(true); G.emit('laundry:start', load); return load;
}
function startDry(load, kind, minutes) { load.stage = 'dry'; load.kind = kind; load.t = now() + minutes; delete load.basket; G.emit('laundry:dry', load); }
function collect(load, fold) {
  S.loads = S.loads.filter(l => l !== load); W().setState(load.ids, CLEAN, true); S.done = (S.done || 0) + 1;
  safe(() => G.needs.addMoodlet('fresh_clothes', fold ? 5 : 3)); if (fold) safe(() => G.needs.add('fun', 3));
  stamp('x:laundry'); if (!load.home) stamp('x:laundromat'); G.emit('laundry:clean', load.ids); G.emit('laundry:done', load);
  toast(`${plural(load.ids.length, 'clean piece')}${fold ? ', folded in a neat stack' : ''}. Back in your drawers.`, 'good', 3600);
}
function tick() {
  if (!S || !S.loads.length) return; const t = now();
  for (const l of S.loads.slice()) {
    if (l.stage === 'wash' && t >= l.t) { l.stage = 'washed'; l.t0 = l.t; G.emit('laundry:washed', l); notify('Wash finished', l.home ? 'Your washer has finished. Dry the load: dryer, rack, or hang it around the flat.' : `Washer ${l.no || ''} has finished. Move your things to a dryer.`.replace('  ', ' ')); }
    else if (l.stage === 'dry' && t >= l.t) {
      if (l.home) { collect(l, false); continue; }
      l.stage = 'done'; l.t0 = l.t; notify('Laundry is dry', l.kind === 'service' ? 'Your wash-and-fold is ready at the front desk.' : l.kind === 'cleaner' ? 'Your dry cleaning is ready at the front desk.' : 'Your dryer has stopped. Warm clothes are waiting.');
    }
    else if (!l.home && !l.basket && !l.kind && (l.stage === 'washed' || l.stage === 'done') && t - (l.t0 || l.t) > FORGOT_MIN) { l.basket = 1; notify('Laundry moved', 'Someone needed the machine. The attendant put your things in a basket by the folding table.'); }
  }
}

/* ---------- laundromat ---------- */
async function wait(load) {
  const m = Math.max(1, Math.ceil(load.t - now()));
  G.startActivity({ label: load.stage === 'wash' ? 'Watching the wash go round' : 'Waiting for the dryer', anim: 'stand', minutes: m, done: () => { tick(); } });
}
async function machine(fx, scene) {
  const where = roomId(), dryer = /dryer/.test(fx.asset.id), no = (fx.item.p && fx.item.p.num) || 0, ls = mine(where), opts = [];
  for (const l of ls) {
    if (l.kind) continue;
    if (l.stage === 'wash' || l.stage === 'dry') opts.push({ label: `${l.stage === 'wash' ? 'Washing' : 'Drying'}: ${left(l.t)} left`, sub: `${plural(l.ids.length, 'piece')} · wait here (time skips)`, value: ['wait', l] });
    else if (l.stage === 'washed') opts.push({ label: `Move the wet load to a dryer · ${fmt(DRY_PRICE)}`, sub: `${plural(l.ids.length, 'piece')}${l.basket ? ' (from the basket)' : ''} · ${DRY_MIN} min`, value: ['dry', l] });
    else if (l.stage === 'done') { opts.push({ label: 'Fold it neatly', sub: `${plural(l.ids.length, 'warm piece')} · 6 min · a better mood`, value: ['fold', l] }, { label: 'Stuff it in the bag', sub: 'quick', value: ['take', l] }); }
  }
  const w = washables();
  if (S.bag && w.length && !dryer) opts.push({ label: `Wash a load · ${fmt(WASH_PRICE)}`, sub: `${plural(Math.min(w.length, LOAD_MAX), 'piece')} · ${WASH_MIN} min${delicates().length ? ' · ' + delicates().length + ' delicate stay in the bag' : ''}`, value: ['wash'] });
  if (!opts.length) return toast(S.bag ? (w.length ? 'That is a dryer. Start with a washer.' : delicates().length ? 'Only delicates left in your bag: the front desk does dry cleaning.' : 'Your laundry bag is empty.') : hamper().length ? 'Your dirty clothes are in the hamper at home. Bring the laundry bag.' : 'Nothing to wash. Clothes need a wash after a few days of wear.', 'info', 3600);
  const v = await choose(dryer ? 'Dryer' : `Washer ${no || ''}`.trim(), opts.concat([{ label: 'Never mind', value: null }])); if (!v) return;
  const l = v[1];
  if (v[0] === 'wash') { if (!safe(() => G.money.pay(WASH_PRICE, 'Laundromat wash', { category: 'service', venue: where }), false)) return; const load = startWash(where, { no }); if (load) { toast(`In it goes. ${WASH_MIN} minutes. Wait, or wander off: your phone will ping.`, 'good', 3800); safe(() => G.audio.sfx('coin')); } }
  else if (v[0] === 'dry') { if (!safe(() => G.money.pay(DRY_PRICE, 'Laundromat dryer', { category: 'service', venue: where }), false)) return; startDry(l, null, DRY_MIN); toast(`Tumbling. ${DRY_MIN} minutes.`, 'good'); }
  else if (v[0] === 'wait') wait(l);
  else if (v[0] === 'take') collect(l, false);
  else if (v[0] === 'fold') G.startActivity({ label: 'Folding laundry', anim: 'work', minutes: 6, done: () => collect(l, true), cancel: () => collect(l, false) });
}
async function desk(orig) {
  const where = roomId(), ready = mine(where).filter(l => l.kind && l.stage === 'done'), pending = mine(where).filter(l => l.kind && l.stage !== 'done'), d = delicates(), w = washables(), opts = [];
  for (const l of ready) opts.push({ label: `Collect your ${l.kind === 'cleaner' ? 'dry cleaning' : 'wash-and-fold'}`, sub: plural(l.ids.length, 'piece'), value: ['take', l] });
  for (const l of pending) opts.push({ label: `${l.kind === 'cleaner' ? 'Dry cleaning' : 'Wash-and-fold'}: ready in ${left(l.t)}`, sub: plural(l.ids.length, 'piece'), value: null, disabled: true });
  if (S.bag && d.length) opts.push({ label: `Dry-clean the delicates · ${fmt(CLEAN_PRICE * d.length)}`, sub: `${plural(d.length, 'piece')} · ready in ${CLEAN_MIN / 60} hours`, value: ['clean'] });
  if (S.bag && w.length) opts.push({ label: `Wash-and-fold the whole bag · ${fmt(FOLD_PRICE)}`, sub: `${plural(w.length, 'piece')} · ready in ${FOLD_MIN / 60} hours, no waiting about`, value: ['service'] });
  if (!opts.length) return orig();
  opts.push({ label: 'Front desk', sub: 'the other services', value: ['orig'] });
  const v = await choose('Laundry counter', opts); if (!v) return;
  if (v[0] === 'orig') return orig();
  if (v[0] === 'take') return collect(v[1], true);
  const ids = v[0] === 'clean' ? d : w, price = v[0] === 'clean' ? CLEAN_PRICE * d.length : FOLD_PRICE;
  if (!safe(() => G.money.pay(price, v[0] === 'clean' ? 'Dry cleaning' : 'Wash-and-fold', { category: 'service', venue: where }), false)) return;
  W().setState(ids, v[0] === 'clean' ? CLEANER : WASH); const load = { id: ++S.n, where, home: 0, ids, stage: 'dry', kind: v[0] === 'clean' ? 'cleaner' : 'service', t: now() + (v[0] === 'clean' ? CLEAN_MIN : FOLD_MIN) }; S.loads.push(load);
  if (!hamper().length) dropBag(true); G.emit('laundry:start', load); toast(`Ticket in your pocket. Ready in ${left(load.t)}.`, 'good', 3400);
}
const isLaundromat = scene => !!scene && ((scene.fixtures || []).some(f => f.tags.includes('laundry_machine')) || safe(() => G.publicPlaces.get(scene.roomId).kind, '') === 'laundry');
function onRoom(scene) {
  if (!isLaundromat(scene)) return;
  for (const it of scene.interactables) if (it.fx && it.fx.tags.includes('checkout') && !it._laundry) { const orig = it.use; it._laundry = 1; it.use = (g, x) => desk(() => orig && orig(g, x)); }
}

/* ---------- home ---------- */
async function homeWasher(fx, scene) {
  const tier = (fx.item.p && fx.item.p.tier) || 0, ls = S.loads.filter(l => l.home), opts = [], has = tag => (scene.fixtures || []).some(f => f.tags.includes(tag)); gather();
  for (const l of ls) {
    if (l.stage === 'wash') opts.push({ label: `Washing: ${left(l.t)} left`, sub: plural(l.ids.length, 'piece'), value: null, disabled: true });
    else if (l.stage === 'dry') opts.push({ label: `${l.kind === 'dryer' ? 'In the dryer' : l.kind === 'rack' ? 'On the drying rack' : 'Hanging around the flat'}: ${left(l.t)} left`, sub: plural(l.ids.length, 'piece'), value: null, disabled: true });
    else if (l.stage === 'washed') {
      if (has('dryer')) opts.push({ label: 'Into the tumble dryer', sub: `${HOME_DRY} min`, value: ['dry', l, 'dryer', HOME_DRY] });
      if (has('dryrack')) opts.push({ label: 'Hang it on the drying rack', sub: `${RACK_MIN / 60} hours`, value: ['dry', l, 'rack', RACK_MIN] });
      opts.push({ label: 'Hang it around the flat', sub: `${AIR_MIN / 60} hours, socks on every doorknob`, value: ['dry', l, 'air', AIR_MIN] });
    }
  }
  const w = washables(), cap = [8, 11, 14][tier] || 8;
  if (w.length && !ls.some(l => l.stage === 'wash')) opts.push({ label: 'Wash what is in the hamper', sub: `${plural(Math.min(w.length, cap), 'piece')} · ${HOME_WASH[tier] || 60} min · free${delicates().length ? ' · delicates need the cleaner' : ''}`, value: ['wash'] });
  if (!opts.length) return toast(delicates().length ? 'Only delicates in the hamper. The laundromat counter dry-cleans those.' : 'Nothing to wash. Dirty clothes land in the hamper when you change.', 'info', 3400);
  const v = await choose('Washing machine', opts.concat([{ label: 'Close', value: null }])); if (!v) return;
  if (v[0] === 'wash') { const load = startWash('home', { home: 1, minutes: HOME_WASH[tier] || 60, max: cap }); if (load) toast(`The drum starts to turn. ${left(load.t)}.`, 'good'); }
  else if (v[0] === 'dry') { startDry(v[1], v[2], v[3]); toast(v[2] === 'dryer' ? 'Tumbling.' : v[2] === 'rack' ? 'Pegged out on the rack.' : 'Shirts on chair backs, socks on doorknobs. It will dry.', 'good'); }
}
async function hamperUse() {
  const moved = gather(), n = hamper().length;
  if (S.bag) { const v = await choose('Laundry hamper', [{ label: 'Put the laundry bag back', sub: plural(n, 'piece'), value: 1 }, { label: 'Keep it', value: null }]); if (v) dropBag(); return; }
  if (!n) return toast('The hamper is empty. Clothes go in when you change out of dirty ones at the dresser.', 'info', 3200);
  const names = hamper().slice(0, 4).map(id => W().nameOf(id)).join(', ') + (n > 4 ? '...' : '');
  const v = await choose('Laundry hamper', [{ label: 'Take the laundry bag', sub: `${plural(n, 'piece')}: ${names}`, value: 1 }, { label: 'Leave it', sub: moved ? `${plural(moved, 'dirty piece')} tidied in from the drawers` : 'not today', value: null }]);
  if (v) takeBag();
}
const myHome = scene => { const c = safe(() => G.housing.current(), null); return !!(c && c.id && scene && String(scene.roomId || '').indexOf('home:' + c.id) === 0); };
const free = (H, x, y) => { try { return H.check({ itemId: 'hamper_t0', x, y }) === null; } catch (e) { return false; } };
/* owner msg 112: the hamper used to take the FIRST free cell, which is by the back wall, in front of the fridge. It now takes the free cell that keeps the most
   distance (up to 2.5 tiles) from everything you can tap; a hamper already standing within 1.5 tiles of a fixture is moved once per home. */
const others = () => safe(() => G.interactables(), []).filter(i => !/hamper/i.test(i.label || '') && typeof i.x === 'number');
const gap = (L, x, y) => { let m = 9; for (const i of L) m = Math.min(m, Math.hypot(i.x - (x + .5), i.y - (y + .5))); return m; };
function clearSpot(H, w, d) { const L = others(); let best = null, bs = -1; for (let y = .5; y < d - 1; y += .5) for (let x = .5; x < w - 1; x += .5) { if (!free(H, x, y)) continue; const sc = Math.min(gap(L, x, y), 2.5); if (sc > bs) { bs = sc; best = { x, y }; } } return best; }
function unblockHamper() {
  const H = G.housing, cur = safe(() => H.current(), null); if (!cur || !cur.id || !H.isHome() || safe(() => H.room(), 'main') !== 'main') return;
  const M = S.hamperMoved || (S.hamperMoved = {}); if (M[cur.id]) return; M[cur.id] = 1;
  const it = ((G.state.home || {}).items || []).find(i => /^hamper_/.test(i.itemId) && typeof i.x === 'number'); if (!it) return;
  if (gap(others(), it.x, it.y) >= 1.5) return;
  const def = safe(() => H.roomDef(cur.id, 'main'), null), spot = clearSpot(H, (def && def.w) || 8, (def && def.d) || 8); if (!spot || gap(others(), spot.x, spot.y) < 1.5) return;
  it.x = spot.x; it.y = spot.y; safe(() => H.refresh());
}
/** every home gets a hamper: placed in the first free spot, else it waits in storage */
function ensureHamper() {
  const H = G.housing, cur = safe(() => H.current(), null); if (!cur || !cur.id || S.hamperHome === cur.id || !H.isHome() || safe(() => H.room(), 'main') !== 'main') return;
  const st = G.state.home || {}, hasOne = (st.items || []).some(i => /^hamper_/.test(i.itemId)) || (st.storage || []).some(i => /^hamper_/.test(i)) || (st.stay || []).some(i => /^hamper_/.test(i)) || (st.boxes || []).some(b => (b.items || []).some(i => /^hamper_/.test(i)));
  S.hamperHome = cur.id; if (hasOne) return;
  if (!safe(() => H.addFurniture('hamper_t0', { instant: true }), false)) return;
  const def = safe(() => H.roomDef(cur.id, 'main'), null), w = (def && def.w) || 8, d = (def && def.d) || 8; let done = null;
  const spot = clearSpot(H, w, d); if (spot) done = safe(() => H.place('hamper_t0', spot, { quiet: true }), null);   /* owner msg 112: not in front of the fridge */
  toast(done ? 'A laundry hamper has turned up in your home. Dirty clothes go in it when you change.' : 'A laundry hamper is in your storage. Place it with Decorate.', 'info', 4600);
  if (done) safe(() => H.refresh());
}
function status() {
  const out = []; for (const l of S.loads) { const where = l.home ? 'at home' : safe(() => G.places.get(l.where).name, 'the laundromat'), n = plural(l.ids.length, 'piece');
    out.push(l.stage === 'wash' ? { text: `Washing ${where}: ${n}`, t: l.t } : l.stage === 'washed' ? { text: `Wet load waiting ${where}${l.basket ? ' (in a basket)' : ''}: ${n}. Needs drying.`, done: 1 } : l.stage === 'dry' ? { text: `${l.kind === 'cleaner' ? 'At the dry cleaner' : l.kind === 'service' ? 'Wash-and-fold' : 'Drying'} ${where}: ${n}`, t: l.t } : { text: `Ready to collect ${where}: ${n}`, done: 1 }); }
  return out;
}

export function init() {
  const mk = () => ({ bag: 0, n: 0, loads: [], hamperHome: null, done: 0 });
  S = G.defineState('laundry', mk); const fix = () => { S = G.state.laundry || G.defineState('laundry', mk); S.loads = S.loads || []; carry(!!S.bag); };
  G.on('load', fix); G.on('game:new', () => { G.state.laundry = mk(); fix(); });
  G.laundry = { hamper, gather, hasBag: () => !!S.bag, takeBag, dropBag, loads: () => S.loads.slice(), status, startWash, startDry, collect, tick, delicates, washables, isLaundromat, ensureHamper };
  registerFixture('laundry_machine', (fx, scene) => ({ label: /dryer/.test(fx.asset.id) ? 'Dryer' : 'Washer', hit: 12, use: () => machine(fx, scene) }));
  registerFixture('laundry', (fx, scene) => (fx.tags.includes('laundry_machine') || !fx.asset.id.endsWith('bath.washer') || !myHome(scene) ? null : { label: 'Washing machine', hit: 12, use: () => homeWasher(fx, scene) }));
  registerFixture('hamper', (fx, scene) => (myHome(scene) ? { label: 'Laundry hamper', hit: 10, use: hamperUse } : null));
  registerFixture('dryer', (fx, scene) => (myHome(scene) ? { label: 'Tumble dryer', hit: 12, use: () => { const l = S.loads.find(x => x.home && x.stage === 'washed'); if (l) { startDry(l, 'dryer', HOME_DRY); toast('Tumbling.', 'good'); } else toast(S.loads.some(x => x.home && x.kind === 'dryer') ? 'Still tumbling.' : 'Nothing wet to dry. Run the washer first.', 'info'); } } : null));
  registerFixture('dryrack', (fx, scene) => (myHome(scene) ? { label: 'Drying rack', hit: 12, use: () => { const l = S.loads.find(x => x.home && x.stage === 'washed'); if (l) { startDry(l, 'rack', RACK_MIN); toast('Pegged out on the rack.', 'good'); } else toast('Nothing wet to hang. Run the washer first.', 'info'); } } : null));
  G.on('room:build', onRoom); G.on('minutes', tick); G.on('scene', () => { setTimeout(() => { safe(ensureHamper); setTimeout(() => safe(unblockHamper), 300); }, 400); if (S.bag) carry(true); }); G.on('activityEnd', () => { if (S && S.bag) carry(true); });
  safe(() => G.tips.register({ id: 'laundry', topic: 'home', title: 'Laundry', text: 'Clothes need a wash after a few days of wear. Change at your dresser and the dirty ones drop into the hamper. Take the laundry bag to a washer (the laundromat, or your own), then a dryer. The Closet app shows the timers.', go: { app: 'closet' } }));
  safe(() => G.tips.register({ id: 'dresser', topic: 'home', title: 'Getting dressed', text: 'Your dresser holds every piece you own. Mix tops, bottoms, coats, shoes and extras, save outfits under a name, or tap Today for a suggestion that suits the weather.', go: { app: 'closet' } }));
  safe(() => G.tips.register({ id: 'haircut', topic: 'home', title: 'Hair', text: 'Barbers and salons each have their own lookbook. Pick a style, sit in the chair, see the reveal. The colour bar at Lacquer Lounge does dyes. Hair grows out after a few weeks.', go: { find: 'hygiene' } }));
}
