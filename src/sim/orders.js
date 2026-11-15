// Online ordering for the home (Wave C): cart, wish list, checkout, multi-day shipping, the doorbell. UI: src/ui/phone_home.js (the Roomy app) and the Shop
// tab of design mode (src/ui/furnish.js). Tables: src/data/shipping.js. Boxes, unpacking: src/sim/housing.js (addBox) + src/sim/homedesign.js.
//
// One PARCEL per seller: everything in the cart from one shop travels together. Days = seller speed + 1 for a large piece (1..4); Express = next day for a fee.
// The courier (Bay Parcel) rings between 09:00 and 13:00 on the day; the exact time is fixed when you order and stands in the Planner.
// A parcel of small things is left at your door. One with a big piece needs you IN: if you are out the courier comes again the next day at the same time,
// and on the second try (or as soon as you tap "Leave it at my door" in the app) the boxes are put inside your door. A home holds BOX_MAX boxes: the rest goes
// straight to storage. Cancel for a full refund until 07:00 on the day it is due.
//
// G.orders
//   sellers(goodId) -> [{ store, name, short, price, days, size 's'|'m'|'l', flat }] cheapest first        best(goodId) -> the cheapest seller
//   cart() -> [{ id, store, pos?, asm? }]      add(goodId, { store?, pos?, asm? }) -> bool      remove(index)      setAsm(index, on)      clearCart()      inCart(goodId) -> n
//   quote(express = { storeId: true }) -> { parcels: [{ store, name, short, lines: [{ ix, id, name, price, size, flat, asm }], sub, fee, asmFee, days, express, canExpress,
//                                           expressFee, eta, big, total }], total, count }
//   checkout(express?) -> [shipment] | null (toast says why)
//   ships() -> all shipments, newest first      active() -> those on the way      get(id)
//   track(id) -> { ship, steps: [{ label, t, done }], step, canCancel, big, missed }
//   cancel(id) -> bool (refund)      leaveAtDoor(id) -> bool      setSafe(on) / safe()   "always leave big parcels at my door"
//   wish() -> [goodId]      toggleWish(goodId) -> bool (now on the list)      wished(goodId)
//   deliverNow(id?)   land one / every shipment now (debug)
// State G.state.orders = { seq, cart: [{ id, store, pos?, asm? }], wish: [goodId], ships: [{ id, store, lines: [{ id, price, pos?, asm? }], sub, fee, total, express, t0, eta,
//   tries, safe, st: 'transit' | 'delivered' | 'cancelled', at, appt, boxes, stored }], safe: 0 | 1, n, spent }
// Events: 'order:cart'(n), 'order:placed'([shipment]), 'order:delivered'(shipment), 'order:missed'(shipment), 'order:cancel'(shipment), 'order:wish'(goodId, on)
//   (+ 'goods:buy'(goodId, storeId, price, 'online') and the standard 'shop:buy' per line)
import { G } from '../core/game.js';
import { GOOD_BY_ID, STORE_BY_ID } from '../data/goods.js';
import { ITEM_BY_ID } from '../data/items.js';
import { COURIER, FEE, WINDOW, MISSED, CANCEL, CART_MAX, sizeOf, isFlat, shipDays, shipFee } from '../data/shipping.js';
import { toast } from '../ui/kit.js';

export const order = 62;
const DAY = 1440, APP = 'roomy';
let S = null;
const blank = () => ({ seq: 0, cart: [], wish: [], ships: [], safe: 0, n: 0, spent: 0 });
function norm() {
  S = G.state.orders; if (!S || typeof S !== 'object') S = G.state.orders = blank(); const b = blank(); for (const k in b) if (S[k] === undefined) S[k] = b[k];
  S.cart = S.cart.filter(l => l && GOOD_BY_ID[l.id] && STORE_BY_ID[l.store]); S.wish = S.wish.filter(id => GOOD_BY_ID[id]);
  for (const s of S.ships) s.lines = (s.lines || []).filter(l => ITEM_BY_ID[l.id]);
  return S;
}
const safe = (fn, fb) => { try { const v = fn(); return v === undefined || v === null ? fb : v; } catch (e) { return fb; } };
const fmt = n => (G.money && G.money.fmt ? G.money.fmt(n) : '$' + n);
const clock = t => String(Math.floor((t % DAY) / 60)).padStart(2, '0') + ':' + String(Math.floor(t % 60)).padStart(2, '0');
const sizeG = id => sizeOf(GOOD_BY_ID[id], safe(() => G.housing.visual(id).size, null));
const priceAt = (id, store) => safe(() => G.goods.price(id, store), Math.round((ITEM_BY_ID[id] || {}).price * ((STORE_BY_ID[store] || {}).mult || 1)));

/* ---------- sellers ---------- */
function sellers(goodId) {
  const g = GOOD_BY_ID[goodId]; if (!g) return []; const size = sizeG(goodId);
  return g.stores.filter(s => STORE_BY_ID[s]).map(s => ({ store: s, name: STORE_BY_ID[s].name, short: STORE_BY_ID[s].short, price: priceAt(goodId, s), days: shipDays(s, [size], false), size, flat: isFlat(g, s) }))
    .sort((a, b) => a.price - b.price || a.days - b.days);
}
const best = goodId => sellers(goodId)[0] || null;

/* ---------- cart + wish list ---------- */
function add(goodId, o = {}) {
  const g = GOOD_BY_ID[goodId]; if (!g) return false; if (S.cart.length >= CART_MAX) { toast('Your cart is full. Order what is in it first.', 'bad'); return false; }
  const store = o.store && g.stores.includes(o.store) ? o.store : (best(goodId) || {}).store; if (!store) return false;
  const l = { id: goodId, store }; if (o.pos) l.pos = o.pos; if (o.asm && isFlat(g, store)) l.asm = 1; S.cart.push(l); G.emit('order:cart', S.cart.length); return true;
}
function remove(ix) { if (ix < 0 || ix >= S.cart.length) return false; S.cart.splice(ix, 1); G.emit('order:cart', S.cart.length); return true; }
function setAsm(ix, on) { const l = S.cart[ix]; if (!l || !isFlat(GOOD_BY_ID[l.id], l.store)) return false; if (on) l.asm = 1; else delete l.asm; return true; }
function toggleWish(id) { if (!GOOD_BY_ID[id]) return false; const i = S.wish.indexOf(id); if (i >= 0) S.wish.splice(i, 1); else S.wish.unshift(id); G.emit('order:wish', id, i < 0); return i < 0; }

/* ---------- quote ---------- */
function slotOf(seq) { const n = Math.max(1, (WINDOW.to - WINDOW.from) * 2); return WINDOW.from * 60 + ((seq * 37 + 11) % n) * 30; }
function quote(express = {}) {
  const by = {}, t = Math.floor(G.state.t), parcels = []; let k = 0;
  S.cart.forEach((l, ix) => { (by[l.store] = by[l.store] || []).push(Object.assign({ ix }, l)); });
  for (const store in by) {
    const st = STORE_BY_ID[store], lines = by[store].map(l => { const g = GOOD_BY_ID[l.id], flat = isFlat(g, store); return { ix: l.ix, id: l.id, name: g.name, price: priceAt(l.id, store), size: sizeG(l.id), flat, asm: flat && l.asm ? 1 : 0, pos: l.pos }; });
    const sizes = lines.map(l => l.size), sub = lines.reduce((a, l) => a + l.price, 0), std = shipDays(store, sizes, false), canExpress = std > 1, ex = canExpress && !!express[store];
    const days = shipDays(store, sizes, ex), fee = shipFee(sub, sizes, ex), asmFee = lines.filter(l => l.asm).length * FEE.assembly, eta = (Math.floor(t / DAY) + days) * DAY + slotOf(S.seq + 1 + k++);
    parcels.push({ store, name: st.name, short: st.short, lines, sub, fee, asmFee, days, stdDays: std, express: ex, canExpress, expressFee: shipFee(sub, sizes, true) - shipFee(sub, sizes, false), eta, big: sizes.some(s => s !== 's'), total: sub + fee + asmFee });
  }
  return { parcels, total: parcels.reduce((a, p) => a + p.total, 0), count: S.cart.length };
}

/* ---------- checkout ---------- */
function checkout(express = {}) {
  const home = safe(() => G.housing.current(), null); if (!home) { toast('You need an address before anything can be delivered.', 'bad'); return null; }
  const q = quote(express); if (!q.count) return null;
  if (G.money && !safe(() => G.money.canAfford(q.total, { category: 'homegood' }), true)) { toast(`That comes to ${fmt(q.total)}. You do not have enough for it right now.`, 'bad', 3600); return null; }
  const out = [], t = Math.floor(G.state.t);
  for (const p of q.parcels) {
    if (G.money && !G.money.pay(p.total, 'Roomy: ' + p.short, { category: 'homegood', venue: p.store })) break;
    const sh = { id: ++S.seq, store: p.store, lines: p.lines.map(l => { const o = { id: l.id, price: l.price }; if (l.pos) o.pos = l.pos; if (l.asm) o.asm = 1; return o; }), sub: p.sub, fee: p.fee + p.asmFee, total: p.total, express: p.express ? 1 : 0, t0: t, eta: p.eta, tries: 0, st: 'transit' };
    sh.appt = safe(() => G.planner.add({ title: `Delivery: ${p.short}` + (p.big ? ' (be in)' : ''), placeId: p.big ? 'home:' + home.id : null, t: sh.eta + 5, dur: 20, kind: 'personal', remind: p.big ? 30 : 0, data: { ship: sh.id } }), null);
    S.ships.unshift(sh); out.push(sh); S.n += sh.lines.length; S.spent += sh.total;
    for (const l of sh.lines) { G.emit('goods:buy', l.id, sh.store, l.price, 'online'); G.emit('shop:buy', l.id, 1, sh.store); }
  }
  if (!out.length) return null;
  const gone = new Set(out.flatMap(sh => q.parcels.find(p => p.store === sh.store).lines.map(l => l.ix))); S.cart = S.cart.filter((l, ix) => !gone.has(ix));
  trim(); safe(() => G.audio.sfx('pay')); G.emit('order:cart', S.cart.length); G.emit('order:placed', out); return out;
}
function trim() { const done = S.ships.filter(s => s.st !== 'transit'); if (done.length > 12) { const drop = new Set(done.slice(12)); S.ships = S.ships.filter(s => !drop.has(s)); } }

/* ---------- tracking ---------- */
const bigShip = sh => sh.lines.some(l => sizeG(l.id) !== 's');
function track(id) {
  const sh = S.ships.find(s => s.id === id); if (!sh) return null; const t = G.state.t, st = STORE_BY_ID[sh.store] || { short: 'the shop' }, due = Math.floor(sh.eta / DAY) * DAY;
  const packed = Math.min(sh.t0 + 90, due + 6 * 60), road = Math.min(Math.max(packed + 60, (Math.floor(sh.t0 / DAY) + 1) * DAY + 5 * 60), due + 6.5 * 60), out = due + CANCEL.untilHour * 60;
  const steps = [{ label: 'Order placed', t: sh.t0 }, { label: `Packed at ${st.short}`, t: packed }, { label: 'On its way', t: road }, { label: 'Out for delivery', t: out }, { label: sh.st === 'delivered' ? 'Delivered' : 'At your door', t: sh.st === 'delivered' ? sh.at : sh.eta }];
  let step = 0; steps.forEach((s, i) => { s.done = sh.st === 'delivered' || (i < 4 && t >= s.t); if (s.done) step = i; });
  return { ship: sh, steps, step, canCancel: sh.st === 'transit' && t < out, big: bigShip(sh), missed: sh.st === 'transit' && sh.tries > 0 };
}
function cancel(id) {
  const k = track(id); if (!k || !k.canCancel) return false; const sh = k.ship; sh.st = 'cancelled'; sh.at = Math.floor(G.state.t);
  if (G.money) G.money.add(sh.total, 'Refund: ' + (STORE_BY_ID[sh.store] || {}).short); if (sh.appt) safe(() => G.planner.remove(sh.appt)); sh.appt = null; S.spent -= sh.total; S.n -= sh.lines.length;
  G.emit('order:cancel', sh); return true;
}

/* ---------- the doorbell ---------- */
function land(sh) {
  const H = G.housing, st = STORE_BY_ID[sh.store] || { short: 'the shop', name: 'the shop' }; let boxes = 0, stored = 0;
  const put = o => { if (H.addBox(o)) boxes++; else { for (const id of o.items) H.addFurniture(id, { instant: true, quiet: true }); stored += o.items.length; } };
  const small = sh.lines.filter(l => sizeG(l.id) === 's');
  for (let i = 0; i < small.length; i += 4) { const part = small.slice(i, i + 4); put({ label: part.length === 1 ? ITEM_BY_ID[part[0].id].name : `${st.short}: ${part.length} small things`, items: part.map(l => l.id), pos: part.map(l => l.pos || null), sz: 's', from: st.short }); }
  for (const l of sh.lines) { if (sizeG(l.id) === 's') continue; const flat = isFlat(GOOD_BY_ID[l.id], sh.store); put({ label: ITEM_BY_ID[l.id].name, items: [l.id], pos: [l.pos || null], sz: flat ? 'f' : 'l', asm: flat && l.asm ? 1 : 0, from: st.short }); }
  sh.st = 'delivered'; sh.at = Math.floor(G.state.t); sh.boxes = boxes; sh.stored = stored; if (sh.appt) safe(() => G.planner.remove(sh.appt)); sh.appt = null;
  const what = boxes ? `${boxes} ${boxes === 1 ? 'box' : 'boxes'} from ${st.short}` : `your order from ${st.short}`, extra = stored ? ` No room for more boxes, so ${stored === 1 ? 'one piece went' : stored + ' pieces went'} straight into storage.` : '';
  if (H.isHome()) { toast(`Ding-dong! ${COURIER}: ${what}.${extra}${boxes ? ' Tap a box to unpack it.' : ''}`, 'good', 5200); safe(() => G.audio.sfx('shop_bell')); safe(() => H.refresh()); }
  else safe(() => G.phone.notify({ app: APP, title: COURIER, text: `Delivered: ${what} ${sh.left ? 'put inside your door' : 'left at your door'}.${extra} Unpack at home.`, icon: sh.lines[0].id, data: { tab: 'orders', ship: sh.id } }));
  trim(); G.emit('order:delivered', sh);
}
function ring(sh) {
  const home = safe(() => G.housing.current(), null); if (!home) { sh.eta += DAY; return; }
  const big = bigShip(sh), inNow = G.housing.isHome();
  if (big && !inNow && !sh.safe && !S.safe && sh.tries + 1 < MISSED.tries) {
    sh.tries++; sh.eta += DAY; if (sh.appt) safe(() => G.planner.update(sh.appt, { t: sh.eta + 5 }));
    safe(() => G.phone.notify({ app: APP, title: COURIER + ': sorry we missed you', text: `Your ${(STORE_BY_ID[sh.store] || {}).short} order needs someone in. We will ring again tomorrow at ${clock(sh.eta)}, or tap to have it left at your door.`, icon: 'ui.bag', priority: 'high', data: { tab: 'orders', ship: sh.id } }));
    G.emit('order:missed', sh); return;
  }
  if (big && !inNow) sh.left = 1;
  land(sh);
}
function tick() { if (!S || !S.ships.length) return; const t = G.state.t; for (const sh of S.ships.slice()) if (sh.st === 'transit' && sh.eta <= t) ring(sh); }
function leaveAtDoor(id) { const sh = S.ships.find(s => s.id === id && s.st === 'transit'); if (!sh) return false; sh.safe = 1; if (sh.tries > 0) { sh.left = 1; land(sh); } return true; }

export function init() {
  G.defineState('orders', blank); norm();
  G.orders = {
    sellers, best, cart: () => S.cart.slice(), add, remove, setAsm, clearCart: () => { S.cart = []; G.emit('order:cart', 0); }, inCart: id => S.cart.filter(l => l.id === id).length,
    quote, checkout, ships: () => S.ships.slice(), active: () => S.ships.filter(s => s.st === 'transit'), get: id => S.ships.find(s => s.id === id) || null, track, cancel, leaveAtDoor,
    safe: () => !!S.safe, setSafe: on => { S.safe = on ? 1 : 0; }, wish: () => S.wish.slice(), toggleWish, wished: id => S.wish.includes(id),
    deliverNow: id => { for (const sh of S.ships.slice()) if (sh.st === 'transit' && (id === undefined || sh.id === id)) { sh.safe = 1; sh.left = G.housing.isHome() ? 0 : 1; land(sh); } },
    stats: () => ({ n: S.n, spent: S.spent }), APP,
  };
  G.on('load', norm);
  G.on('minutes', tick);
}
