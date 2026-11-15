// Phone app: ROOMY — home design + online ordering for the home (app id 'roomy'). Sim: src/sim/orders.js (G.orders); tables: src/data/shipping.js.
// Tabs: Shop (search; browse by room / category / style / shop; a piece's page with colours, sellers, "See it in my room", wish, cart), Wish list,
//       Cart (one parcel per seller, Express, assembly service, order), Orders (tracking steps, cancel, "Leave it at my door", history, boxes waiting at home).
// Deep links: G.phone.open('roomy', { tab: 'shop' | 'wish' | 'cart' | 'orders', good: goodId, ship: shipmentId }).
// "See it in my room" closes the phone and opens design mode (ui/furnish.js) with the piece as a try piece: only while you are at home.
import { G } from '../core/game.js';
import { GOODS, GOOD_BY_ID, CATS, STORES, STORE_BY_ID, familyOf } from '../data/goods.js';
import { ITEM_BY_ID } from '../data/items.js';
import { ROOMS, STYLES, FEE, COURIER, SELLER_DAYS, searchText, dayText } from '../data/shipping.js';
import { picture, facts, swatchOf, colourName } from '../sim/goods_sheet.js';
import { el, iconEl, hasIcon, btn, row, section, card, chip, kv, empty, tabs, safe, money, balance, when } from './phone_util.js';
import { toast } from './kit.js';

export const order = 123;
export const APP = 'roomy';
const O = () => G.orders, H = () => G.housing;
const U = { tab: 'shop', sort: 'price', express: {}, q: '' };
const atHome = () => !!safe(() => H().isHome(), false);
const short = id => ((ITEM_BY_ID[id] || {}).name || id).split(',')[0];
const whenLc = t => when(t).replace(/^(Today|Tomorrow|Yesterday)/, m => m.toLowerCase());
let CSS = false;
function css() {
  if (CSS) return; CSS = true;
  document.head.append(el('style', { text: `.rm-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:6px}.rm-grid button{display:flex;align-items:center;gap:6px;min-height:46px;padding:4px 8px;text-align:left;font-weight:700;font-size:13px}
.rm-pic{display:flex;align-items:flex-end;justify-content:center;height:132px;background:#efe6d2;border:2px solid var(--edge);margin:0 0 6px}.rm-pic canvas{image-rendering:pixelated}
.rm-sw{display:flex;flex-wrap:wrap;gap:6px;margin:4px 0 8px}.rm-sw button{width:36px;height:36px;border:2px solid var(--edge);padding:0;box-shadow:2px 2px 0 var(--edge)}.rm-sw button.on{outline:3px solid var(--gold);outline-offset:1px}
.rm-facts{margin:4px 0 8px;padding:0;list-style:none;font-size:13px;line-height:1.35}.rm-sell{display:flex;flex-direction:column;gap:4px;margin:4px 0 8px}
.rm-sell button{display:flex;justify-content:space-between;align-items:center;gap:8px;min-height:44px;padding:4px 8px;text-align:left}.rm-sell button.on{background:var(--gold)}.rm-sell small{display:block;font-weight:400;opacity:.85}
.rm-line{display:flex;align-items:center;gap:6px;padding:4px 0;border-bottom:2px solid var(--shade)}.rm-line>span{flex:1;min-width:0;font-size:13px;font-weight:700}.rm-line small{display:block;font-weight:400;opacity:.8}
.rm-line button{min-width:40px;min-height:40px;padding:2px 8px;flex:none}.rm-tog{display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:44px;width:100%;text-align:left;margin-top:6px;padding:4px 8px}
.rm-tog.on{background:var(--gold)}.rm-track{display:flex;margin:8px 0 2px}.rm-track i{flex:1;height:8px;border:2px solid var(--edge);background:#fffdf4;margin-right:-2px}.rm-track i.on{background:var(--good)}
.rm-steps{display:flex;justify-content:space-between;font-size:10px;opacity:.8;gap:2px}.rm-steps span{flex:1;text-align:center}.rm-steps span.on{font-weight:700;opacity:1}
.rm-more{width:100%;min-height:44px;margin-top:6px}.rm-sort{display:flex;gap:6px;margin:0 0 6px}.rm-sort button{flex:1;min-height:36px;font-size:12px;padding:2px}.rm-sort button.on{background:var(--gold)}` }));
}

/* ---------- lists ---------- */
let FAMS = null;
function fams() { if (FAMS) return FAMS; const by = new Map(); for (const g of GOODS) { let f = by.get(g.family); if (!f) by.set(g.family, f = { g, all: [], text: '' }); f.all.push(g); f.text += ' ' + searchText(g); if (g.price < f.g.price) f.g = g; } return FAMS = [...by.values()]; }
const bestPrice = id => safe(() => O().best(id).price, (GOOD_BY_ID[id] || {}).price || 0);
function listView(title, has) {
  let shown = 30;
  return (b, ctx) => {
    css(); let L = fams().filter(f => f.all.some(has));
    L = L.map(f => { const g = f.all.filter(has).sort((a, c) => a.price - c.price)[0]; return { f, g, price: bestPrice(g.id) }; });
    L.sort(U.sort === 'cosy' ? (a, c) => c.g.ambience - a.g.ambience || a.price - c.price : U.sort === 'dear' ? (a, c) => c.price - a.price : (a, c) => a.price - c.price);
    b.append(el('div.rm-sort', null, ...[['price', 'Cheapest'], ['dear', 'Dearest'], ['cosy', 'Cosiest']].map(([k, n]) => el('button' + (U.sort === k ? '.on' : ''), { text: n, onclick: () => { U.sort = k; ctx.refresh(); } }))));
    if (!L.length) return b.append(empty('ui.bag', 'Nothing here', 'Try another word or another shelf.'));
    b.append(el('p.ph-note', { text: `${L.length} ${L.length === 1 ? 'piece' : 'pieces'}` }));
    for (const r of L.slice(0, shown)) { const s = safe(() => O().best(r.g.id), null);
      b.append(row({ icon: r.g.id, cat: 'homegood', title: r.f.all.length > 1 ? short(r.g.id) : r.g.name, sub: `${r.f.all.length > 1 ? r.f.all.length + ' colours · ' : ''}${s ? s.short + ' · ' + dayText(s.days).toLowerCase() : ''}${r.g.ambience ? ' · cosy +' + r.g.ambience : ''}`, right: money(r.price), onclick: () => ctx.push(short(r.g.id), itemView(r.g.id)) })); }
    if (L.length > shown) b.append(el('button.rm-more', { text: `Show more (${L.length - shown} left)`, onclick: () => { shown += 40; ctx.refresh(); } }));
  };
}
function itemView(id0) {
  let id = id0, store = null;
  return (b, ctx) => {
    css(); const g = GOOD_BY_ID[id]; if (!g) return b.append(empty('ui.bag', 'Gone', 'That piece is no longer sold.'));
    const sellers = O().sellers(id); if (!store || !sellers.some(s => s.store === store)) store = (sellers[0] || {}).store; const s = sellers.find(q => q.store === store) || sellers[0];
    const fam = familyOf(id), wished = O().wished(id), n = O().inCart(id);
    b.append(el('div.rm-pic', null, picture(g, 270, 116, 5)), el('b', { text: g.name, style: { fontSize: '16px' } }));
    if (fam.length > 1) b.append(el('div.rm-sw', null, ...fam.map(q => el('button' + (q.id === id ? '.on' : ''), { title: colourName(q), 'aria-label': colourName(q), style: 'background:' + swatchOf(q), onclick: () => { id = q.id; ctx.refresh(); } }))));
    b.append(el('ul.rm-facts', null, ...facts(g, store).filter(t => !/shopping bag|Too big to carry/.test(t)).map(t => el('li', { text: t }))));
    b.append(section(sellers.length > 1 ? 'Who sells it' : 'Sold by'));
    b.append(el('div.rm-sell', null, ...sellers.map(q => el('button' + (q.store === store ? '.on' : ''), { onclick: () => { store = q.store; ctx.refresh(); } },
      el('span', null, el('b', { text: q.name }), el('small', { text: `Arrives in ${dayText(q.days).toLowerCase()}` + (q.flat ? ' · flat-pack, you build it' : '') + (q.size === 's' ? ' · left at your door' : ' · someone must be in') })), el('b', { text: money(q.price) })))));
    ctx.foot.append(el('div.ph-btns', null,
      btn(atHome() ? 'See it in my room' : 'See it in my room (at home)', () => { if (!atHome()) return ctx.tip('Go home first: then you can stand it in your own room before you buy.'); ctx.close(); setTimeout(() => safe(() => G.furnish.open({ tryId: id, store })), 350); }, atHome() ? 'pri' : ''),
      btn(wished ? 'On wish list' : 'Wish list', () => { O().toggleWish(id); ctx.refresh(); })),
      btn(n ? `Add another · ${money(s.price)} (${n} in cart)` : `Add to cart · ${money(s.price)}`, () => { if (O().add(id, { store })) { ctx.tip(`${short(id)} is in your cart.`); ctx.refresh(); } }, 'pri wide'));
  };
}

/* ---------- tabs ---------- */
function shopTab(b, ctx) {
  const boxes = safe(() => H().boxes().filter(x => x.k === 'd').length, 0), act = O().active();
  b.append(el('div.ph-hero', { style: { background: '#d9703a' } }, iconEl('sofa_t1', 3, 'homegood'), el('div', null, el('b', { text: 'Make it home.', style: { fontSize: '18px' } }), el('small', { text: `${GOODS.length} pieces from ${STORES.length} shops, to your door in 1-4 days.` }))));
  b.append(btn(atHome() ? 'Design my home' : 'Design my home (when you are in)', () => { if (!atHome()) return ctx.tip('Design mode opens when you are standing in your own home.'); ctx.close(); setTimeout(() => safe(() => G.furnish.open()), 350); }, 'wide' + (atHome() ? ' pri' : ''), 'sofa_t1'));
  if (boxes) b.append(row({ icon: 'ui.bag', title: `${boxes} ${boxes === 1 ? 'box is' : 'boxes are'} waiting at home`, sub: atHome() ? 'Tap a box in the room to unpack it.' : 'Unpack them when you get in.', cls: 'note' }));
  if (act.length) { const n = act.slice().sort((a, c) => a.eta - c.eta)[0]; b.append(row({ icon: 'ui.clock', title: `${act.length} ${act.length === 1 ? 'parcel' : 'parcels'} on the way`, sub: `Next: ${STORE_BY_ID[n.store].short}, ${whenLc(n.eta)}`, cls: 'note', onclick: () => { U.tab = 'orders'; ctx.refresh(); } })); }
  const inp = el('input.ph-input', { type: 'search', placeholder: `Search ${GOODS.length} pieces`, value: U.q, 'aria-label': 'Search', onkeydown: e => { if (e.key === 'Enter') go(); } });
  const go = () => { U.q = inp.value.trim(); if (!U.q) return; const words = U.q.toLowerCase().split(/\s+/); ctx.push(`"${U.q}"`, listView(U.q, g => words.every(w => searchText(g).includes(w)))); };
  b.append(el('div', { style: { display: 'flex', gap: '6px', margin: '8px 0' } }, inp, el('button', { text: 'Find', style: { minWidth: '64px', minHeight: '40px' }, onclick: go })));
  b.append(section('By room'), el('div.rm-grid', null, ...ROOMS.map(r => el('button', { onclick: () => ctx.push(r.name, listView(r.name, r.has)) }, hasIcon(r.icon) ? iconEl(r.icon, 1) : null, el('span', { text: r.name })))));
  b.append(section('By kind'), el('div.rm-grid', null, ...Object.keys(CATS).map(k => el('button', { onclick: () => ctx.push(CATS[k], listView(CATS[k], g => g.cat === k)) }, hasIcon('gcat.' + k) ? iconEl('gcat.' + k, 1) : null, el('span', { text: CATS[k] })))));
  const styles = Object.keys(STYLES).filter(k => GOODS.some(g => g.style === k));
  b.append(section('By style'), el('div.ph-chips', null, ...styles.map(k => chip(STYLES[k], '', () => ctx.push(STYLES[k], listView(STYLES[k], g => g.style === k))))));
  b.append(section('By shop'));
  for (const s of STORES) b.append(row({ icon: hasIcon('store.' + s.id) ? 'store.' + s.id : 'ui.bag', title: s.name, sub: `${s.kind} · ${SELLER_DAYS[s.id] <= 1 ? 'next day' : 'from ' + SELLER_DAYS[s.id] + ' days'}`, right: '$'.repeat(s.level || 2), onclick: () => ctx.push(s.short, listView(s.short, g => g.stores.includes(s.id))) }));
}
function wishTab(b, ctx) {
  const W = O().wish(); if (!W.length) return b.append(empty('ui.heart', 'Nothing wished for yet', 'Tap "Wish list" on any piece to keep it here.'));
  for (const id of W) b.append(el('div.rm-line', null, iconEl(id, 2, 'homegood'), el('span', { onclick: () => ctx.push(short(id), itemView(id)) }, GOOD_BY_ID[id].name, el('small', { text: `${money(bestPrice(id))} · ${safe(() => O().best(id).short, '')}` })),
    el('button', { text: 'Cart', 'aria-label': 'Add to cart', onclick: () => { if (O().add(id)) { ctx.tip(`${short(id)} is in your cart.`); ctx.refresh(); } } }), el('button', { text: 'x', 'aria-label': 'Remove', onclick: () => { O().toggleWish(id); ctx.refresh(); } })));
}
function cartTab(b, ctx) {
  const q = O().quote(U.express); if (!q.count) return b.append(empty('ui.bag', 'Your cart is empty', 'Find something in the Shop tab, or try pieces in your room with Design my home.'));
  for (const p of q.parcels) {
    const c = card(el('b', { text: p.name }), el('small', { text: `Arrives ${whenLc(p.eta)} (${dayText(p.days).toLowerCase()})` + (p.big ? '. Someone must be in.' : '. Left at your door.'), style: { display: 'block', opacity: .85 } }));
    for (const l of p.lines) { c.append(el('div.rm-line', null, iconEl(l.id, 2, 'homegood'), el('span', null, l.name, el('small', { text: money(l.price) + (l.pos ? ' · its place in the room is planned' : '') + (l.flat ? (l.asm ? ' · arrives built' : ' · flat-pack') : '') })),
      l.flat ? el('button' + (l.asm ? '.on' : ''), { text: l.asm ? 'Built' : 'Build', title: `Assembly service ${money(FEE.assembly)}`, style: l.asm ? { background: 'var(--gold)' } : null, onclick: () => { O().setAsm(l.ix, !l.asm); ctx.refresh(); } }) : null,
      el('button', { text: 'x', 'aria-label': 'Remove ' + l.name, onclick: () => { O().remove(l.ix); ctx.refresh(); } }))); }
    if (p.lines.some(l => l.flat)) c.append(el('p.ph-note', { text: `Flat-pack: build it yourself (a quick game), or tap Build to have it arrive built for ${money(FEE.assembly)}.` }));
    if (p.canExpress) c.append(el('button.rm-tog' + (p.express ? '.on' : ''), { onclick: () => { U.express[p.store] = !p.express; ctx.refresh(); } }, el('span', { text: p.express ? 'Express: arrives tomorrow' : `Express: tomorrow instead of ${dayText(p.stdDays).toLowerCase()}` }), el('b', { text: '+' + money(p.expressFee) })));
    c.append(kv('Things', money(p.sub)), kv(p.express ? 'Express postage' : 'Postage', p.fee ? money(p.fee) : 'Free')); if (p.asmFee) c.append(kv('Assembly', money(p.asmFee)));
    b.append(c);
  }
  const can = balance() >= q.total;
  ctx.foot.append(card(kv('Total', money(q.total), 'total'), kv('You have', money(balance()))),
    btn(can ? `Order · ${money(q.total)}` : 'Not enough money for all of it', () => { const out = O().checkout(U.express); if (!out) return ctx.tip('That did not go through. Check your balance.'); U.express = {}; U.tab = 'orders'; ctx.refresh(); ctx.tip(out.length === 1 ? `Ordered. ${COURIER} rings ${whenLc(out[0].eta)}.` : `Ordered: ${out.length} parcels. Times are in your Planner.`); }, 'pri wide big', 'ui.bag'));
  if (!can) ctx.foot.lastChild.disabled = true;
}
const STEPS = ['Ordered', 'Packed', 'On its way', 'Out for delivery', 'Delivered'];
function shipCard(sh, ctx) {
  const k = O().track(sh.id), st = STORE_BY_ID[sh.store] || { name: 'Shop', short: 'Shop' }, c = card();
  c.append(el('b', { text: st.name }), el('small', { style: { display: 'block', opacity: .85 }, text: sh.st === 'delivered' ? `Delivered ${whenLc(sh.at)}` + (sh.stored ? ` · ${sh.stored} straight to storage` : '') : sh.st === 'cancelled' ? `Cancelled ${whenLc(sh.at)} · ${money(sh.total)} refunded`
    : (k.missed ? 'We missed you. Next try: ' : sh.express ? 'Express. Arrives ' : 'Arrives ') + whenLc(sh.eta) + (k.big && !sh.safe && !O().safe() ? ' · someone must be in' : ' · left at your door') }));
  if (sh.st === 'transit') c.append(el('div.rm-track', null, ...STEPS.map((s, i) => el('i' + (i <= k.step ? '.on' : '')))), el('div.rm-steps', null, ...STEPS.map((s, i) => el('span' + (i === k.step ? '.on' : ''), { text: s }))));
  for (const l of sh.lines) c.append(el('div.rm-line', null, iconEl(l.id, 2, 'homegood'), el('span', null, (ITEM_BY_ID[l.id] || {}).name || l.id, el('small', { text: money(l.price) + (l.asm ? ' · arrives built' : '') }))));
  c.append(kv('Paid', money(sh.total)));
  if (sh.st === 'transit') { const bt = el('div.ph-btns');
    if (k.big && !sh.safe && !O().safe()) bt.append(btn('Leave it at my door', () => { O().leaveAtDoor(sh.id); ctx.refresh(); ctx.tip(k.missed ? 'Done: the boxes are inside your door.' : 'Noted: it will be left at your door.'); }));
    if (k.canCancel) bt.append(btn('Cancel order', () => { if (O().cancel(sh.id)) { ctx.refresh(); ctx.tip(`Cancelled. ${money(sh.total)} is back in your account.`); } })); else bt.append(el('p.ph-note', { text: 'Out for delivery: too late to cancel.' }));
    c.append(bt); }
  return c;
}
function ordersTab(b, ctx) {
  const all = O().ships(), act = all.filter(s => s.st === 'transit').sort((a, c) => a.eta - c.eta), past = all.filter(s => s.st !== 'transit'), boxes = safe(() => H().boxes().filter(x => x.k === 'd'), []);
  if (!all.length && !boxes.length) return b.append(empty('ui.clock', 'No orders yet', 'What you order shows up here, step by step, until it is at your door.'));
  if (boxes.length) { b.append(section('At home, still in boxes')); for (const x of boxes) b.append(row({ icon: x.items[0], cat: 'homegood', title: x.label, sub: (x.sz === 'f' && !x.asm ? 'Flat-pack: needs building' : 'Ready to unpack') + (x.from ? ' · ' + x.from : ''), cls: 'note' })); if (!atHome()) b.append(el('p.ph-note', { text: 'Tap the boxes in your room to unpack them.' })); }
  if (act.length) { b.append(section('On the way')); for (const sh of act) b.append(shipCard(sh, ctx)); }
  b.append(el('button.rm-tog' + (O().safe() ? '.on' : ''), { onclick: () => { O().setSafe(!O().safe()); ctx.refresh(); } }, el('span', { text: 'Always leave big parcels at my door' }), el('b', { text: O().safe() ? 'On' : 'Off' })));
  if (past.length) { b.append(section('Earlier')); for (const sh of past) b.append(shipCard(sh, ctx)); }
}
function render(b, ctx) {
  css(); const a = ctx.arg || {};
  if (a.tab && !a._done) U.tab = a.tab;
  if (a.good && !a._done && GOOD_BY_ID[a.good]) { a._done = 1; return ctx.push(short(a.good), itemView(a.good), 'good' + a.good); }
  a._done = 1;
  const nCart = O().cart().length, nAct = O().active().length, nWish = O().wish().length;
  b.append(tabs([{ id: 'shop', name: 'Shop' }, { id: 'wish', name: 'Wishes', badge: nWish || null }, { id: 'cart', name: 'Cart', badge: nCart || null }, { id: 'orders', name: 'Orders', badge: nAct || null }], U.tab, t => { U.tab = t; ctx.refresh(); }));
  ({ shop: shopTab, wish: wishTab, cart: cartTab, orders: ordersTab }[U.tab] || shopTab)(b, ctx);
}
export function init() {
  if (!G.phone || !G.phone.registerApp || !G.orders) return;
  const cat = safe(() => G.apps.get(APP), null);
  G.phone.registerApp({ id: APP, name: (cat && cat.name) || 'Roomy', question: (cat && cat.tagline) || 'What would make it home?', iconId: hasIcon('app.roomy') ? 'app.roomy' : 'sofa_t1', color: '#d9703a', slot: 50, render,
    badge: () => safe(() => O().active().filter(s => s.tries > 0).length + (H().boxes().some(x => x.k === 'd') ? 1 : 0), 0) });
}
