// Clothes shopping: every clothing-selling place gets its own slice of the catalogue (data/clothes.js), weekly + seasonal rotation, physical racks,
// the fitting-room mirror, a basket you carry to the till, and online orders with a two-day delivery.
//
// Shop ids (data/clothes_brands.js SHOPS) -> venues: clothing (Thread & Co.), pub:12 (Marigold & Main), pub:44 (Ink & Ivy Vintage), mall:thread, mall:kicks, mall:bloom (Galleria bays),
//   gym (Iron Maple), arena -> arena:store (The Otter Den), hotel -> hotel:gifts (The Bellhop's Trunk), market -> market_stalls (street market stalls), online (Closet app).
// G.clothesShop
//   shops() -> [{ id, name, venue, place, level, taste, count }]      stock(shopId) -> [piece] in stock this week      priceAt(piece, shopId) -> $      isNew(piece, shopId)
//   whereSold(pieceId) -> [shopId] that stock it this week            browse(shopId, { slot?, rack? })  the rack / catalogue window      detail(piece, shopId)
//   basket() -> [{ id, shop }]   addToBasket(id, shop)   checkout(shopId) -> bool   buy(id, shopId) -> bool (straight from the menu)   fitting() -> bool (mirror; true when in a shop)
//   order(ids) -> bool   online order: pay now + DELIVERY_FEE, arrives ORDER_DAYS mornings later   orders() -> [{ ids, t }]   gift(style?) -> piece id | null (a present from a friend)
// How other windows reach it: G.shop.open(venueId) is wrapped (from here, not in ui/shop.js): at a clothes-selling venue it first asks "Clothes" or the classic shop window.
// Fixtures: clothing racks / round racks / shelves / fold tables / shoe wall / accessories stand get "Browse" interactables (tag `clothing`); the vintage bins and hat wall are re-pointed here.
// State G.state.clothes = { basket: [{ id, shop }], orders: [{ ids, t }], bought: n }.   Events: 'wardrobe:buy'(ids, shopId, total), 'clothes:order'(ids, t), 'clothes:delivered'(ids).
import { G } from '../core/game.js';
import { modal, el, toast, choose } from '../ui/kit.js';
import { registerFixture } from '../scenes/interior.js';
import { VENUE_BY_ID, isOpen } from '../data/venues.js';
import { CATALOG, PIECE_BY_ID, SHOPS, BRANDS, soldAt } from '../data/clothes.js';
import { EXPERIENCES, STAMP_GROUPS } from './_guide_data.js';
import { grid, filterBar, applyFilter, stage, thumb, injectCss, put } from '../ui/phone_closet_kit.js';

export const order = 131;
export const ORDER_DAYS = 2, DELIVERY_FEE = 4, IN_STOCK = 3 / 4;
export const VENUE = { clothing: 'clothing', 'pub:12': 'pub:12', 'pub:44': 'pub:44', 'mall:thread': 'mall:thread', 'mall:kicks': 'mall:kicks', 'mall:bloom': 'mall:bloom', gym: 'gym', arena: 'arena:store', hotel: 'hotel:gifts', market: 'market_stalls' };
const PLACE = { 'mall:thread': 'deptstore', 'mall:kicks': 'deptstore', 'mall:bloom': 'deptstore', arena: 'arena', hotel: 'hotel' };
const BY_VENUE = Object.fromEntries(Object.entries(VENUE).map(([k, v]) => [v, k]));
if (!STAMP_GROUPS.includes('Wardrobe')) STAMP_GROUPS.push('Wardrobe');
EXPERIENCES.push(
  { id: 'x:clothes_buy', title: 'Buy Something Off the Rack', group: 'Wardrobe', glyph: 'bag', place: 'clothing', blurb: 'Tap a rack, pick a piece, carry it to the till. Every shop in town stocks different things.' },
  { id: 'x:fitting', title: 'Try It On in the Fitting Room', group: 'Wardrobe', glyph: 'stamp', place: 'clothing', blurb: 'Take a few pieces behind the curtain and see yourself in the mirror before you pay.' },
  { id: 'x:look_saved', title: 'Put an Outfit Together', group: 'Wardrobe', glyph: 'stamp', blurb: 'Dress from your drawers at home and save the combination under a name of your own.' },
  { id: 'x:laundry', title: 'Do a Load of Laundry', group: 'Wardrobe', glyph: 'key', blurb: 'Hamper, laundry bag, washer, dryer. Warm socks at the end.' },
  { id: 'x:laundromat', title: 'Wait Out the Spin Cycle', group: 'Wardrobe', glyph: 'key', place: 'pub:21', blurb: 'Wash and dry a bag at Suds & Bubbles. The people-watching is free.' },
  { id: 'x:hair_new', title: 'Leave With a Different Head', group: 'Wardrobe', glyph: 'key', place: 'pub:22', blurb: 'Pick a style from the lookbook, sit in the chair, wait for the reveal.' },
  { id: 'x:hair_dye', title: 'Dye Your Hair a New Colour', group: 'Wardrobe', glyph: 'stamp', place: 'pub:17', blurb: 'The colour bar at Lacquer Lounge does naturals, pastels and things that glow a bit.' },
  { id: 'x:closet_50', title: 'Own Fifty Pieces', group: 'Wardrobe', glyph: 'bag', blurb: 'A proper wardrobe. The drawers are starting to complain.' },
  { id: 'x:online_order', title: 'Order Clothes to Your Door', group: 'Wardrobe', glyph: 'bag', blurb: 'The Closet app has a catalogue of its own. Two days, then a parcel.' });

let S = null;
const safe = (fn, fb) => { try { const v = fn(); return v === undefined || v === null ? fb : v; } catch (e) { return fb; } };
const hash = s => { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const week = () => Math.floor((G.state.t || 0) / 10080), W = () => G.wardrobe, fmt = n => (G.money && G.money.fmt ? G.money.fmt(n) : '$' + n);
const stamp = id => safe(() => G.guide.stamp(id));
const inStock = (p, shop, w = week()) => shop === 'online' || (hash(p.id + shop) + w) % 4 !== 0;
const cacheKey = () => week() + ':' + G.now().season; const cache = new Map();
function stock(shop) { const k = shop + cacheKey(); let v = cache.get(k); if (!v) { if (cache.size > 40) cache.clear(); v = soldAt(shop, G.now().season).filter(p => inStock(p, shop)); cache.set(k, v); } return v; }
const isNew = (p, shop) => shop !== 'online' && week() > 0 && !inStock(p, shop, week() - 1);
const priceAt = (p, shop, bin) => Math.max(1, Math.round(p.price * ((SHOPS[shop] || { level: 1 }).level) * (bin ? .45 : 1)));
const whereSold = id => { const p = PIECE_BY_ID[id]; return p ? p.shops.filter(s => inStock(p, s)) : []; };
const placeOf = shop => PLACE[shop] || (shop === 'market' ? safe(() => (G.places.list().find(p => /stall/i.test(p.kind + p.id) && /market|stall/i.test(p.name)) || G.places.list().find(p => /market (square|stalls)|farmers/i.test(p.name)) || {}).id, null) : VENUE[shop]) || null;
const shops = () => Object.keys(SHOPS).map(id => ({ id, name: id === 'hotel' ? "The Bellhop's Trunk" : id === 'arena' ? 'The Otter Den' : SHOPS[id].name, venue: VENUE[id] || null, place: placeOf(id), level: SHOPS[id].level, taste: SHOPS[id].taste, count: stock(id).length }));
const shopName = id => (shops().find(s => s.id === id) || { name: 'the shop' }).name;

/* ---------- basket, paying ---------- */
const basketOf = shop => S.basket.filter(b => b.shop === shop), total = shop => basketOf(shop).reduce((n, b) => n + priceAt(PIECE_BY_ID[b.id], shop, b.bin), 0);
function addToBasket(id, shop, bin) { if (W().owns(id) || S.basket.some(b => b.id === id)) return false; S.basket.push({ id, shop, bin: bin ? 1 : 0 }); toast(`${PIECE_BY_ID[id].name} is over your arm. Pay at the till, or try it on first.`, 'good', 3200); return true; }
function got(ids, shop, sum) { for (const id of ids) W().add(id, true); S.bought = (S.bought || 0) + ids.length; stamp('x:clothes_buy'); if (W().pieces().length >= 50) stamp('x:closet_50'); G.emit('wardrobe:buy', ids, shop, sum); }
function checkout(shop) {
  const b = basketOf(shop); if (!b.length) return false; const sum = total(shop);
  if (!safe(() => G.money.pay(sum, `Clothes — ${shopName(shop)}`, { category: 'outfit', venue: VENUE[shop] }), false)) return false;
  S.basket = S.basket.filter(x => x.shop !== shop); got(b.map(x => x.id), shop, sum);
  toast(`${b.length} piece${b.length > 1 ? 's' : ''} for ${fmt(sum)}. They are in your dresser; change at home, or in the Closet app.`, 'good', 4200); return true;
}
function buy(id, shop, bin) {
  const p = PIECE_BY_ID[id]; if (!p || W().owns(id)) return false; const sum = priceAt(p, shop, bin);
  if (!safe(() => G.money.pay(sum, `${p.name} — ${shopName(shop)}`, { category: 'outfit', venue: VENUE[shop] }), false)) return false;
  got([id], shop, sum); toast(`${p.name} is yours.`, 'good'); return true;
}
function placeOrder(ids) {
  ids = ids.filter(id => PIECE_BY_ID[id] && !W().owns(id) && !S.orders.some(o => o.ids.includes(id))); if (!ids.length) return false;
  const sum = ids.reduce((n, id) => n + priceAt(PIECE_BY_ID[id], 'online'), 0) + DELIVERY_FEE;
  if (!safe(() => G.money.pay(sum, 'Closet app order', { category: 'outfit' }), false)) return false;
  const t = (Math.floor(G.state.t / 1440) + ORDER_DAYS) * 1440 + 9 * 60; S.orders.push({ ids, t }); stamp('x:online_order'); G.emit('clothes:order', ids, t);
  toast(`Ordered. ${fmt(sum)} with delivery; the parcel arrives in ${ORDER_DAYS} days, about 09:00.`, 'good', 4200); return true;
}
function deliveries() {
  if (!S || !S.orders.length) return; const due = S.orders.filter(o => o.t <= G.state.t); if (!due.length) return;
  S.orders = S.orders.filter(o => o.t > G.state.t); const ids = due.flatMap(o => o.ids); for (const id of ids) W().add(id, true);
  const text = `${ids.length} piece${ids.length > 1 ? 's' : ''} from your order: ${ids.slice(0, 3).map(id => PIECE_BY_ID[id].name).join(', ')}${ids.length > 3 ? '...' : ''}. Unpacked into your dresser.`;
  if (G.phone && G.phone.notify) safe(() => G.phone.notify({ app: 'closet', title: 'Parcel delivered', text, icon: 'app.closet' })); else toast(text, 'good', 4200);
  G.emit('clothes:delivered', ids);
}
function gift(style) {
  const pool = CATALOG.filter(p => !W().owns(p.id) && !p.online && p.price <= 60 && (p.slot === 'hat' || p.slot === 'acc' || p.slot === 'top') && (!style || p.styles.includes(style)));
  if (!pool.length) return null; const p = pool[hash('gift' + G.state.t) % pool.length]; W().add(p.id, true); return p.id;
}

/* ---------- windows ---------- */
const SLOT_WORD = { top: 'tops', bottom: 'bottoms', dress: 'dresses and one-pieces', outer: 'coats and jackets', shoes: 'shoes', hat: 'hats', acc: 'accessories' };
function detail(p, shop, o = {}) {
  injectCss(); const online = shop === 'online', own = W().owns(p.id), price = priceAt(p, shop, o.bin), inB = S.basket.some(b => b.id === p.id), m = modal({ title: p.name, cls: 'wardrobe' });
  const st = stage(W().specWithPieces([p]), 6);
  put(m.body, el('div.cw-top', null, st, el('div', null, el('b', { text: fmt(price) }), el('div', { text: (BRANDS[p.brand] || { name: '' }).name }), el('div', { text: p.styles.join(', ') }), el('div', { text: 'Warmth ' + '●'.repeat(p.warmth) + '○'.repeat(4 - p.warmth) }),
    W().delicate(p.id) ? el('div', { text: 'Dry clean only' }) : W().washable(p.id) ? el('div', { text: `Wash after ${W().washable(p.id)} days of wear` }) : el('div', { text: 'Never needs washing' }), isNew(p, shop) ? el('div', { style: { color: '#2f7a3a' }, text: 'New in this week' }) : null)));
  put(m.body, el('p.cw-note', { text: own ? 'You own this.' : 'The mirror shows it with what you are wearing now. Tap the mirror to turn round.' }));
  const row = el('div.cw-row');
  if (!own && !online && !o.menu && !o.view) put(row, el('button.opt', { disabled: inB, onclick: () => { addToBasket(p.id, shop, o.bin); m.close(); o.after && o.after(); } }, el('span.opt-l', { text: inB ? 'In your basket' : 'Take it (basket)' })));
  if (!own && !online && !o.view) put(row, el('button.opt', { onclick: () => { if (buy(p.id, shop, o.bin)) { S.basket = S.basket.filter(b => b.id !== p.id); m.close(); o.after && o.after(); } } }, el('span.opt-l', { text: 'Buy now ' + fmt(price) })));
  if (!own && online) put(row, el('button.opt', { onclick: () => { if (placeOrder([p.id])) { m.close(); o.after && o.after(); } } }, el('span.opt-l', { text: `Order ${fmt(price + DELIVERY_FEE)} (2 days)` })));
  if (!own) put(row, el('button.opt', { onclick: e => { const on = W().wish(p.id); e.currentTarget.lastChild.textContent = on ? '♥ On your wish list' : '♡ Wish list'; } }, el('span.opt-l', { text: W().isWish(p.id) ? '♥ On your wish list' : '♡ Wish list' })));
  put(m.body, row); return m;
}
const fsts = {};
function browse(shop, o = {}) {
  injectCss(); const list = o.list || stock(shop), key = shop + (o.title || ''), fs = fsts[key] || (fsts[key] = { slot: o.slot || '', style: '', brand: '', q: '', sort: '', fav: false });
  const m = modal({ title: o.title || shopName(shop), cls: 'wardrobe' }), head = el('div'), holder = el('div');
  const drawHead = () => { head.textContent = ''; const b = basketOf(shop); if (shop === 'online') put(head, el('p.cw-note', { text: `Delivery ${fmt(DELIVERY_FEE)}, ${ORDER_DAYS} days. ${S.orders.length ? S.orders.reduce((n, x) => n + x.ids.length, 0) + ' piece(s) on the way.' : ''}` }));
    else if (b.length) put(head, el('div.cw-row', null, el('button.opt', { onclick: () => { m.close(); fitting(); } }, el('span.opt-l', { text: `Basket: ${b.length} · ${fmt(total(shop))}` }), el('span.opt-s', { text: 'look in the mirror' })), el('button.opt', { onclick: () => { if (checkout(shop)) { drawHead(); draw(); } } }, el('span.opt-l', { text: 'Pay ' + fmt(total(shop)) }))));
    else put(head, el('p.cw-note', { text: o.note || `${list.length} pieces here this week. Stock changes every Monday and with the seasons.` })); };
  const draw = () => { holder.textContent = ''; const out = applyFilter(list, fs, { isFav: id => W().isWish(id) });
    put(holder, grid(out, { empty: 'Nothing matches. Try another rack, or another shop.', cell: p => ({ sub: fmt(priceAt(p, shop, o.bin)), tag: W().owns(p.id) ? 'own' : S.basket.some(b => b.id === p.id) ? 'basket' : isNew(p, shop) ? 'new' : '', tagCls: W().owns(p.id) ? 'own' : 'new', fav: W().isWish(p.id) }),
      onPick: p => detail(p, shop, { bin: o.bin, menu: o.menu, after: () => { drawHead(); draw(); } }) })); };
  put(m.body, head, filterBar(fs, draw, { slots: o.slot ? [] : undefined, fav: true }), holder); drawHead(); draw(); return m;
}
/** the fitting-room mirror: you in everything from your basket; toggle pieces, then pay or put back */
function fitting() {
  const shop = roomShop(G.scene); if (!shop) return false; injectCss();
  const b = basketOf(shop), on = new Set(b.map(x => x.id)), m = modal({ title: 'Fitting room', cls: 'wardrobe' }), st = stage(W().specWithPieces([...on]), 7), lines = el('div');
  const draw = () => { st.set(W().specWithPieces([...on])); lines.textContent = '';
    for (const x of basketOf(shop)) { const p = PIECE_BY_ID[x.id]; put(lines, el('div.cw-line', null, thumb(p, 2), el('span', null, el('div', { text: p.name }), el('small', { style: { opacity: .7 }, text: fmt(priceAt(p, shop, x.bin)) })),
      el('button.ph-btn', { onclick: () => { if (on.has(p.id)) on.delete(p.id); else on.add(p.id); draw(); } }, el('span', { text: on.has(p.id) ? 'Take off' : 'Try on' })), el('button.ph-btn', { 'aria-label': 'Put back', onclick: () => { S.basket = S.basket.filter(q => q.id !== p.id); on.delete(p.id); draw(); } }, el('span', { text: 'Put back' })))); }
    if (!basketOf(shop).length) put(lines, el('p.cw-note', { text: 'Nothing over your arm. Tap a rack, take a few pieces, then come back to the mirror.' }));
    else put(lines, el('button.opt', { style: { marginTop: '8px' }, onclick: () => { if (checkout(shop)) m.close(); } }, el('span.opt-l', { text: `Buy all ${basketOf(shop).length} · ${fmt(total(shop))}` }))); };
  put(m.body, el('div', { style: { display: 'flex', justifyContent: 'center', marginBottom: '6px' } }, st), el('p.cw-note', { style: { textAlign: 'center' }, text: 'Tap the mirror to turn round' }), lines); draw(); stamp('x:fitting'); G.emit('wardrobe:fitting', shop); return true;
}

/* ---------- fixtures ---------- */
function roomShop(scene, fx) {
  if (!scene) return null; const id = scene.roomId || String(scene.id || '').replace(/^int:/, ''); if (BY_VENUE[id]) return BY_VENUE[id];
  let best = null, bd = 64; const at = fx || G.player; for (const f of scene.fixtures || []) { const v = f.item && f.item.venue; if (!v || !BY_VENUE[v]) continue; const d = (f.x - at.x) ** 2 + (f.y - at.y) ** 2; if (d < bd) { bd = d; best = BY_VENUE[v]; } }
  return best;
}
const RACK_SLOTS = { rack: ['top', 'outer', 'bottom', 'dress'], roundrack: ['dress', 'top', 'outer'], shelves: ['top', 'bottom'], foldtable: ['bottom', 'top'], shoewall: ['shoes'], accessories: ['hat', 'acc'], hatwall: ['hat', 'acc'], bins: ['top', 'bottom', 'shoes', 'acc'], jewel: ['acc'] };
function rackInfo(fx, scene) {
  const kind = Object.keys(RACK_SLOTS).find(k => fx.asset.id.endsWith('.' + k) || fx.asset.id.includes(k)); if (!kind) return null;
  const shop = roomShop(scene, fx); if (!shop) return null;
  const same = (scene.fixtures || []).filter(f => f.asset.id === fx.asset.id && roomShop(scene, f) === shop), i = Math.max(0, same.indexOf(fx)), slots = RACK_SLOTS[kind], slot = slots[i % slots.length];
  const peers = same.filter((f, j) => slots[j % slots.length] === slot), k = Math.max(0, peers.indexOf(fx));
  return { shop, slot, kind, k, n: Math.max(1, peers.length) };
}
function rackList(r) { const all = stock(r.shop).filter(p => p.slot === r.slot || (r.slot === 'acc' && r.kind === 'jewel' && p.slot === 'acc')); let out = all.filter((p, i) => i % r.n === r.k); if (r.kind === 'bins') out = stock(r.shop).slice().sort((a, b) => a.price - b.price).filter((p, i) => i % r.n === r.k).slice(0, 16); return out; }
function useRack(fx, scene) { const r = rackInfo(fx, scene); if (!r) return; const list = rackList(r); if (!list.length) return toast('This rack is nearly bare this week. Try the next one.', 'info');
  browse(r.shop, { list, slot: r.kind === 'bins' ? undefined : r.slot /* QA round 4: the bins are a mix; a slot filter emptied them */, bin: r.kind === 'bins', title: r.kind === 'bins' ? 'The rummage bins' : `${shopName(r.shop)}: ${SLOT_WORD[r.slot]}`, note: r.kind === 'bins' ? 'Everything in the bins is less than half price. Dig.' : `${list.length} on this rack. The other racks carry different things.` }); }
function onRoom(scene) {
  if (!scene || !roomShop(scene, { x: 0, y: 0 }) && !BY_VENUE[scene.roomId]) return;
  for (const it of scene.interactables) { const a = it.fx && it.fx.asset.id; if (a && /thrift\.(bins|hatwall)|jewel\.case/.test(a) && rackInfo(it.fx, scene)) { it.label = /bins/.test(a) ? 'Rummage in the bins' : /hat/.test(a) ? 'Hats and bags' : 'Jewellery case'; it.use = () => useRack(it.fx, scene); } }
}
function leaveShop(scene, prev) { if (S && S.basket.length && prev && scene && scene.id !== prev.id) { const n = S.basket.length; S.basket = []; toast(`You hang ${n} unpaid piece${n > 1 ? 's' : ''} back on the rack on your way out.`, 'info', 3400); } }

export function init() {
  S = G.defineState('clothes', () => ({ basket: [], orders: [], bought: 0 }));
  const fix = () => { S = G.state.clothes || G.defineState('clothes', () => ({ basket: [], orders: [], bought: 0 })); S.basket = (S.basket || []).filter(b => PIECE_BY_ID[b.id]); S.orders = (S.orders || []).map(o => ({ ids: o.ids.filter(id => PIECE_BY_ID[id]), t: o.t })); cache.clear(); };
  fix(); G.on('load', fix); G.on('game:new', () => { G.state.clothes = { basket: [], orders: [], bought: 0 }; fix(); });
  G.clothesShop = { shops, stock, priceAt, isNew, whereSold, browse, detail, basket: () => S.basket.slice(), addToBasket, checkout, buy, fitting, order: placeOrder, orders: () => S.orders.slice(), gift, roomShop, shopName, VENUE, placeOf };
  registerFixture('clothing', (fx, scene) => { const r = rackInfo(fx, scene); if (!r || /thrift|jewel/.test(fx.asset.id)) return null; return { label: r.slot === 'shoes' ? 'Shoe wall' : r.slot === 'hat' || r.slot === 'acc' ? 'Hats and accessories' : 'Browse the ' + SLOT_WORD[r.slot].split(' ')[0], hit: 14, shopRack: r.shop, use: () => useRack(fx, scene) }; });
  G.on('room:build', onRoom); G.on('scene', leaveShop); G.on('hour', deliveries); G.on('load', deliveries);
  G.on('wardrobe:open', () => { if (safe(() => G.wardrobe.looks().length, 0)) stamp('x:look_saved'); });
  G.on('friend:up', id => { if (hash('fg' + id + G.state.t) % 3) return; const pid = gift(); if (!pid) return; safe(() => G.messages.send({ from: id, text: `Saw this and thought of you: ${PIECE_BY_ID[pid].name}. It is in your dresser already, I am quick like that.` })); });
  // the till / counter / stall of a clothes-selling venue: clothes first, the classic window one tap away
  if (G.shop && G.shop.open && !G.shop._clothes) {
    const orig = G.shop.open; G.shop._clothes = true;
    G.shop.open = (venueId, o = {}) => {
      const shop = BY_VENUE[venueId], v = VENUE_BY_ID[venueId], n = G.now();
      if (!shop || o.classic || o.online || G.modal || (v && !isOpen(v, n.weekday, n.hf))) return orig(venueId, o);
      const b = basketOf(shop), opts = [];
      if (b.length) opts.push({ label: `Pay for your basket · ${fmt(total(shop))}`, sub: `${b.length} piece${b.length > 1 ? 's' : ''}`, value: 'pay' });
      opts.push({ label: 'Clothes', sub: `${stock(shop).length} pieces in stock this week`, value: 'clothes' }, { label: shop === 'gym' ? 'Front desk' : 'Everything else', sub: 'the regular shop window', value: 'classic' });
      choose(v ? v.name : shopName(shop), opts).then(val => { if (val === 'pay') checkout(shop); else if (val === 'clothes') browse(shop, { menu: !G.scene || !G.scene.indoor }); else if (val === 'classic') orig(venueId, Object.assign({}, o, { classic: true })); });
      return true;
    };
  }
}
