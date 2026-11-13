// Inventory: the carried backpack, the home fridge/pantry storage, freshness, using items, and the inventory / fridge windows.
// Item data comes from src/data/items.js.
//
// State slices
//   G.state.inv = { bag: [stack], fridge: [stack], fridgeSlots, books: { bookId: minutes read (novel) | xp paid out (skill book) },
//                   access: { gym | transit: untilT }, drinks: [t...] (alcohol log), paint: minutes at the easel }
//     stack = { id, qty, day (abs day acquired), age (spoil-days so far; negative = extra fresh), exp? (abs minute a takeaway dish goes off), q? (meal quality mult) }
//   G.state.owned = { furniture: [{ id, day, t }] bought home goods waiting for the housing system (it should drain this list, e.g. as delivery boxes
//                     next morning 09:00), outfits: [itemId] owned outfits (wardrobe system reads/extends this) }
//
// G.inv (backpack)
//   items() -> [{ id, qty, day, ... }] (live stacks; treat as read-only)     capacity (12 + up to 4 from Fitness)     free() -> empty slots
//   add(id, qty = 1, opts?) -> bool   all-or-nothing; opts: { fresh: extra shelf days, exp: abs minute, q, silent }       canAdd(id, qty)
//   remove(id, qty = 1) -> bool       count(id)        has(id)        find(pred) -> [item defs carried]
//   use(id, opts?)                    eat/drink (short activity, then effects) / read a book / explain what a thing is for. opts: { from: 'fridge', at: seat, heated, extra: {need: +n} }
//   applyEffects(effects, mult = 1)   apply an item `effects` object to the player (needs, moodlet, caffeine, alcohol)
//   open()                            backpack window        openFridge(fx?)  fridge <-> backpack window (only meant to be called at a fridge/pantry fixture at home)
//   grant(access, days) / hasAccess(access)   passes ('gym', 'transit')
//   daysLeft(stack, inFridge) -> days until it spoils | null       effectText(item) -> 'Hunger +30 · Fun +4'       item(id) -> item def
// G.inv.fridge   same shape: items(), add, remove, count, has, capacity, free(), canAdd
// Events: 'inv:change', 'inv:use'(itemId), 'inv:spoiled'([names])
import { G } from '../core/game.js';
import { ITEM_BY_ID, INVENTORY, homegoodsForTag } from '../data/items.js';
import { FITNESS, MOODLETS, SKILLS, NEEDS } from '../data/needs.js';
import { el, modal, toast } from '../ui/kit.js';
import { iconEl } from '../ui/_icons.js';

export const order = 52;
let S = null, win = null;
const fresh = () => ({ bag: [], fridge: [], fridgeSlots: 8, books: {}, access: {}, drinks: [], paint: 0 });
const FOOD = ['ingredient', 'snack', 'drink', 'ready_meal', 'dish', 'meal'];
const NEED_NAME = Object.fromEntries(NEEDS.map(n => [n.id, n.name]));
const isFood = it => !!it && (FOOD.includes(it.category) || it.id === 'gift_cake');
const edible = it => isFood(it) && (it.category !== 'ingredient' || it.edibleRaw) && Object.keys(it.effects || {}).length > 0;
const changed = () => { G.emit('inv:change'); if (win) win.render(); };

function makeStore(arr, cap, isFridge) {
  const st = {
    items: () => arr(),
    get capacity() { return cap(); },
    free: () => Math.max(0, cap() - arr().length),
    count: id => arr().reduce((a, s) => a + (s.id === id ? s.qty : 0), 0),
    has: id => arr().some(s => s.id === id),
    find: pred => [...new Set(arr().map(s => s.id))].map(id => ITEM_BY_ID[id]).filter(it => it && pred(it)),
    canAdd(id, qty = 1) { const it = ITEM_BY_ID[id]; if (!it || it.category === 'homegood') return false; let room = st.free() * it.stack; for (const s of arr()) if (s.id === id && !s.exp) room += Math.max(0, it.stack - s.qty); return room >= qty; },
    add(id, qty = 1, o = {}) {
      const it = ITEM_BY_ID[id]; if (!it || qty <= 0) return false;
      if (!st.canAdd(id, qty) && !(o.exp && st.free() * it.stack >= qty)) { if (!o.silent) toast(isFridge ? 'The fridge is full.' : 'Your backpack is full.', 'bad'); return false; }
      const day = G.now().day, age0 = -(o.fresh || 0);
      if (!o.exp) for (const s of arr()) { if (s.id !== id || s.exp || s.qty >= it.stack || !qty) continue; const n = Math.min(qty, it.stack - s.qty); s.age = ((s.age || 0) * s.qty + (o.age ?? age0) * n) / (s.qty + n); if (o.q || s.q) s.q = Math.min(s.q || 1, o.q || 1); s.qty += n; qty -= n; }
      while (qty > 0) { const n = Math.min(qty, it.stack), s = { id, qty: n, day, age: o.age ?? age0 }; if (o.exp) s.exp = o.exp; if (o.q && o.q !== 1) s.q = o.q; arr().push(s); qty -= n; }
      changed(); return true;
    },
    remove(id, qty = 1) {
      if (st.count(id) < qty) return false; const a = arr();
      for (let i = a.length - 1; i >= 0 && qty > 0; i--) { const s = a[i]; if (s.id !== id) continue; const n = Math.min(qty, s.qty); s.qty -= n; qty -= n; if (s.qty <= 0) a.splice(i, 1); }
      changed(); return true;
    },
  };
  return st;
}
const bag = makeStore(() => S.bag, () => INVENTORY.backpackSlots + Math.round(FITNESS.bonusesAt100.backpackSlots * (G.needs ? G.needs.fitness() : 0) / 100));
const fridge = makeStore(() => S.fridge, () => S.fridgeSlots || 8, true);

/* ---------- freshness ---------- */
const spoilRate = (it, inFridge) => inFridge ? 1 / (S.fridgeMult || 1) : (it.needsFridge ? INVENTORY.outsideFridgeSpoilMult : 1);
function daysLeft(s, inFridge) { const it = ITEM_BY_ID[s.id]; if (!it || !it.shelfLifeDays) return null; return Math.max(0, Math.ceil((it.shelfLifeDays - (s.age || 0)) / spoilRate(it, inFridge))); }
function spoilPass(byDay) {
  const gone = [];
  for (const [a, inF] of [[S.bag, false], [S.fridge, true]]) for (let i = a.length - 1; i >= 0; i--) {
    const s = a[i], it = ITEM_BY_ID[s.id]; if (!it) { a.splice(i, 1); continue; }
    let off = false;
    if (byDay && it.shelfLifeDays) { s.age = (s.age || 0) + spoilRate(it, inF); off = s.age >= it.shelfLifeDays; }
    if (s.exp && G.state.t >= s.exp) off = true;
    if (off) { gone.push(it.name); a.splice(i, 1); }
  }
  if (gone.length) { const st = bag.canAdd('compost', gone.length) ? bag : null; if (st) st.add('compost', gone.length, { silent: true }); toast(`${gone.slice(0, 3).join(', ')}${gone.length > 3 ? ' and more' : ''} went off${st ? ' — now compost' : ''}.`, 'bad', 3600); G.emit('inv:spoiled', gone); changed(); }
}

/* ---------- effects & use ---------- */
function effectText(it, mult = 1) {
  const e = it.effects || {}, out = [];
  for (const k in NEED_NAME) if (e[k]) out.push(`${NEED_NAME[k]} ${e[k] > 0 ? '+' : ''}${Math.round(e[k] * mult)}`);
  if (e.caffeine) out.push('Caffeine'); if (e.moodlet && MOODLETS[e.moodlet]) out.push(MOODLETS[e.moodlet].name);
  if (it.category === 'book') out.push(it.kind === 'skill' ? `${it.skill[0].toUpperCase() + it.skill.slice(1)} skill, levels ${it.minLevel}-${it.maxLevel}` : 'A novel');
  if (it.grants) out.push(`${it.grants.days}-day ${it.grants.access} access`);
  if (it.category === 'gift') out.push('A gift for someone');
  if (it.category === 'homegood') { const b = it.bonus || {}; if (b.mult > 1) out.push(`x${b.mult} benefit`); if (b.ambience) out.push(`Ambience +${b.ambience}`); if (b.slots) out.push(`${b.slots} slots`); }
  if (it.category === 'outfit') out.push((it.styles || []).join(', '));
  if (it.category === 'ingredient' && !it.edibleRaw) out.push('Cooking ingredient');
  if (it.heat) out.push('Needs heating');
  return out.join(' · ');
}
function applyEffects(e, mult = 1) {
  if (!e || !G.needs) return;
  const caf = e.caffeine && G.needs.hasMoodlet('caffeinated') ? (MOODLETS.caffeinated.caffeineGainMult || .5) : 1;
  for (const k in NEED_NAME) if (e[k]) G.needs.add(k, e[k] * mult * (k === 'energy' ? caf : 1));
  if (e.moodlet) G.needs.addMoodlet(e.moodlet);
  if (e.caffeine) G.needs.addMoodlet('caffeinated');
  if (e.alcohol) { const t = G.state.t; for (let i = 0; i < e.alcohol; i++) S.drinks.push(t); S.drinks = S.drinks.filter(x => t - x <= 180); if (S.drinks.length >= 3) G.needs.addMoodlet('tipsy'); }
}
function mealMult(it, s) { let m = (s && s.q) || 1; return m; }
function use(id, o = {}) {
  const it = ITEM_BY_ID[id], st = o.from === 'fridge' ? fridge : bag; if (!it || !st.has(id)) return false;
  if (G.busy) { toast('You are busy right now.', 'info'); return false; }
  if (edible(it)) {
    if (it.heat && !o.heated) { toast(`${it.name} needs heating first — use a microwave or stove.`, 'info'); return false; }
    const stack = st.items().find(s => s.id === id), mult = mealMult(it, stack) * (o.mult || 1), drink = it.category === 'drink' || it.course === 'drink';
    const fin = () => {
      if (!st.remove(id, 1)) return;
      applyEffects(it.effects, mult);
      if (it.category === 'meal' && G.skills) G.needs.add('hunger', (SKILLS.find(k => k.id === 'cooking').perLevel.mealHungerBonus || 0) * (G.skills.level('cooking') - 1));
      if (o.extra) for (const k in o.extra) G.needs.add(k, o.extra[k]);
      G.emit('inv:use', id); if (o.onDone) o.onDone();
    };
    closeWin();
    if (G.activities) G.activities.start(drink ? 'drink' : 'eat', { minutes: it.eatMinutes || 5, label: (drink ? 'Drinking ' : 'Eating ') + it.name, at: o.at, seated: !!o.at, onDone: fin, summary: `${it.name}: ${effectText(it, mult)}` }); else fin();
    return true;
  }
  if (it.category === 'book') { closeWin(); if (G.activities) G.activities.start(it.kind === 'skill' ? 'read_skill_book' : 'read_novel', { book: id, at: o.at }); return true; }
  if (id === 'compost') { toast('Compost. The community garden would love it — or bin it.', 'info'); return false; }
  toast(it.note ? it.note.split('.')[0] + '.' : it.category === 'gift' ? 'A gift — offer it to someone while you chat.' : it.category === 'ingredient' ? `${it.name} — an ingredient. Cook with it at a stove.` : `${it.name}.`, 'info', 3600);
  return false;
}

/* ---------- windows ---------- */
function closeWin() { if (win) { const w = win; win = null; w.m.close(); } }
function slotBtn(s, inF, sel, on) {
  const it = ITEM_BY_ID[s.id], d = daysLeft(s, inF);
  const fr = s.exp ? 'warn' : d === null ? '' : d <= 1 ? 'bad' : d <= 3 ? 'warn' : 'ok';
  return el('button.iv-slot' + (sel ? '.sel' : ''), { onclick: on, title: it.name, 'aria-label': it.name }, iconEl(s.id, 2, it.category), s.qty > 1 && el('span.iv-qty', { text: s.qty }), fr && el('span.iv-fresh.' + fr));
}
function openWindow(withFridge, title) {
  if (G.modal && !win) return; closeWin();
  let sel = null; // { from: 'bag'|'fridge', id }
  const m = modal({ title: title || (withFridge ? 'Fridge & Backpack' : 'Backpack'), cls: 'iv-win', onClose: () => { if (win && win.m === m) win = null; } });
  const render = () => {
    m.body.textContent = '';
    const grid = (st, name, key) => {
      const a = st.items(), cells = a.map(s => slotBtn(s, key === 'fridge', sel && sel.from === key && sel.id === s.id && sel.s === s, () => { sel = { from: key, id: s.id, s }; render(); }));
      for (let i = a.length; i < st.capacity; i++) cells.push(el('span.iv-slot.empty'));
      return el('div.iv-sec', null, el('div.iv-head', null, iconEl(key === 'fridge' ? 'fridge_t0' : 'ui.bag', 1, key === 'fridge' ? 'homegood' : undefined), el('span', { text: name }), el('span.iv-count', { text: `${a.length}/${st.capacity}` })), el('div.iv-grid', null, cells));
    };
    if (withFridge) {
      m.body.append(grid(fridge, 'Fridge', 'fridge'));
      const n = S.bag.filter(s => { const it = ITEM_BY_ID[s.id]; return isFood(it) && !s.exp; }).length;
      m.body.append(el('div.iv-bar', null, el('button', { disabled: !n, onclick: storeAll }, 'Put groceries away'), el('span.iv-hint', { text: 'Food keeps up to 4x longer in the fridge.' })));
    }
    m.body.append(grid(bag, 'Backpack', 'bag'));
    if (sel && !(sel.from === 'fridge' ? S.fridge : S.bag).includes(sel.s)) sel = null;
    const det = el('div.iv-det');
    if (!sel) det.append(el('span.iv-hint', { text: S.bag.length || (withFridge && S.fridge.length) ? 'Tap an item.' : 'Nothing here yet. Shops are marked on your map.' }));
    else {
      const it = ITEM_BY_ID[sel.id], s = sel.s, inF = sel.from === 'fridge', d = daysLeft(s, inF), src = inF ? fridge : bag, dst = inF ? bag : fridge;
      const life = s.exp ? `Best within ${Math.max(1, Math.ceil((s.exp - G.state.t) / 60))} h` : d === null ? '' : d <= 0 ? 'Goes off tonight' : `Fresh for ${d} more day${d === 1 ? '' : 's'}` + (!inF && it.needsFridge ? ' (keep it in a fridge!)' : '');
      const acts = [];
      if (edible(it)) acts.push(el('button.go', { onclick: () => use(it.id, { from: sel.from }) }, it.category === 'drink' || it.course === 'drink' ? 'Drink' : 'Eat'));
      else if (it.category === 'book') acts.push(el('button.go', { onclick: () => { if (inF) return; use(it.id); } }, 'Read'));
      if (withFridge) { const mv = n => { if (dst.canAdd(it.id, n) || true) { const cp = { age: s.age, q: s.q, exp: s.exp, silent: false }; if (dst.add(it.id, n, cp)) { removeFrom(src, s, n); } } }; acts.push(el('button', { onclick: () => mv(1) }, inF ? 'Take 1' : 'Store 1')); if (s.qty > 1) acts.push(el('button', { onclick: () => mv(s.qty) }, inF ? 'Take all' : 'Store all')); }
      if (!withFridge || it.id === 'compost') acts.push(el('button.quiet', { onclick: () => { removeFrom(src, s, s.qty); toast(`Binned ${it.name}.`, 'info'); } }, 'Bin'));
      det.append(iconEl(it.id, 3, it.category), el('div.iv-info', null, el('b', { text: it.name + (s.qty > 1 ? ` x${s.qty}` : '') }), el('span', { text: effectText(it, mealMult(it, s)) || (it.note ? it.note.split('.')[0] + '.' : '') }), life && el('span.iv-life', { text: life })), el('div.iv-acts', null, acts));
    }
    m.body.append(det);
  };
  win = { m, render }; render();
}
function removeFrom(st, s, n) { const a = st.items(); s.qty -= n; if (s.qty <= 0) { const i = a.indexOf(s); if (i >= 0) a.splice(i, 1); } changed(); }
function storeAll() {
  let moved = 0, full = false;
  for (const s of S.bag.slice()) { const it = ITEM_BY_ID[s.id]; if (!isFood(it) || s.exp) continue; let n = s.qty; while (n > 0 && !fridge.canAdd(s.id, n)) n--; if (n < s.qty) full = true; if (n > 0 && fridge.add(s.id, n, { age: s.age, q: s.q, silent: true })) { removeFrom(bag, s, n); moved += n; } }
  toast(moved ? `Put away ${moved} item${moved === 1 ? '' : 's'}.${full ? ' The fridge is full.' : ''}` : 'The fridge is full.', moved ? 'good' : 'bad');
}
function openFridge(fx) {
  // capacity / shelf life from the fridge's tier when known (fixture def: item.p.tier, item.tier or item.good = 'fridge_t1')
  const it = fx && fx.item, good = it && ITEM_BY_ID[it.good], tier = good ? good.tier : it && it.p && it.p.tier !== undefined ? it.p.tier : it && it.tier, pantry = fx && fx.tags && fx.tags.includes('pantry') && !fx.tags.includes('fridge');
  if (fx && !pantry) { const g = homegoodsForTag('fridge')[tier || 0]; if (g) { S.fridgeSlots = Math.max(g.bonus.slots, S.fridge.length); S.fridgeMult = g.bonus.shelfLifeMult; } }
  openWindow(true, pantry ? 'Pantry & Backpack' : 'Fridge & Backpack');
}

export function init() {
  S = G.defineState('inv', fresh); G.defineState('owned', () => ({ furniture: [], outfits: ['outfit_travel'] }));
  const rebind = () => { S = G.state.inv || (G.state.inv = fresh()); const f = fresh(); for (const k in f) if (S[k] === undefined) S[k] = f[k]; if (!G.state.owned) G.state.owned = { furniture: [], outfits: ['outfit_travel'] }; closeWin(); G.emit('inv:change'); };
  rebind(); G.on('load', rebind);
  G.inv = Object.assign(bag, {
    fridge, use, applyEffects, effectText, daysLeft, isFood, edible, item: id => ITEM_BY_ID[id],
    open: () => openWindow(false), openFridge, close: closeWin,
    grant(access, days) { const t = G.state.t; S.access[access] = Math.max(S.access[access] > t ? S.access[access] : t, t) + days * 1440; G.emit('inv:change'); },
    hasAccess: a => (S.access[a] || 0) > G.state.t, accessUntil: a => S.access[a] || 0,
  });
  G.on('day', () => spoilPass(true));
  G.on('hour', () => { if (S.bag.some(s => s.exp) || S.fridge.some(s => s.exp)) spoilPass(false); });
  G.on('key', k => { if (k === 'i' || k === 'b') openWindow(false); });
}
