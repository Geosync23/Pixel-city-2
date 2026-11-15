// Phone app: ZipEats (food delivery). Menus of venues with `delivers: true` that are open now; fee / service / ETA from economy.js DELIVERY.
// Orders are kept in G.state.phone.orders = [{ id, venue, items: [{ id, qty }], total, at (arrival t) }]; on arrival the food goes into the
// backpack via G.inv.add (needs G.inv and G.money). Emits 'delivery:order'(order), 'delivery:arrived'(order); notification type delivery_update.
import { G } from '../core/game.js';
import { VENUES, VENUE_BY_ID } from '../data/venues.js';
import { DELIVERY } from '../data/economy.js';
import * as ITEMS from '../data/items.js';
import { el, row, empty, btn, card, section, kv, money, when, openState, safe, iconEl } from './phone_util.js';

const D = DELIVERY.foodDelivery, S = () => G.state.phone;
let cart = {}, cartVenue = null;
const menuOf = v => (ITEMS.ITEMS || []).filter(i => i.category === 'dish' && (i.venue === v.id || (i.soldAt || []).includes(v.id)) && (i.takeaway || i.course === 'main'));
const price = (i, v) => Math.round(i.price * (v.priceMult || 1) * 4) / 4;
function arrive() {
  const t = G.state.t, due = (S().orders || []).filter(o => o.at <= t); if (!due.length) return; S().orders = S().orders.filter(o => o.at > t);
  for (const o of due) { let ok = true; for (const it of o.items) { let r; try { r = G.inv.add(it.id, it.qty); } catch (e) { r = false; } if (r === false) ok = false; }
    G.emit('delivery:arrived', o); G.phone.notify({ type: 'delivery_update', app: 'delivery', title: 'ZipEats', text: ok ? (safe(() => G.housing.isHome(), false) ? `Ding-dong! Your order from ${VENUE_BY_ID[o.venue].name} is here.` : `Your courier found you: the order from ${VENUE_BY_ID[o.venue].name} is in your backpack.`) /* QA12: a doorbell only at home (it came in the lobby, the street, a park) */ : 'Your order arrived, but your backpack was full. Some of it went back.', icon: 'ui.bag' }); }
}
function venueView(v) {
  return (b, ctx) => {
    if (cartVenue !== v.id) { cart = {}; cartVenue = v.id; }
    const M = menuOf(v); let sub = 0, n = 0;
    for (const i of M) { const q = cart[i.id] || 0; sub += q * price(i, v); n += q;
      b.append(row({ icon: i.id, cat: 'dish', title: i.name, sub: money(price(i, v)), right: el('span.ph-step', null, el('button', { text: '-', 'aria-label': 'Less ' + i.name, disabled: !q, onclick: () => { cart[i.id] = q - 1; ctx.refresh(); } }), el('b', { text: String(q), style: { fontSize: '16px', minWidth: '18px' } }), el('button', { text: '+', 'aria-label': 'More ' + i.name, disabled: q >= 4, onclick: () => { cart[i.id] = q + 1; ctx.refresh(); } })) })); }
    const svc = Math.round(sub * D.serviceRate * 4) / 4, total = sub + (n ? D.fee + svc : 0);
    ctx.foot.append(card(kv('Food', money(sub)), kv('Delivery + service', money(n ? D.fee + svc : 0)), kv('Total', money(total), 'total')),
      btn(n ? `Order · arrives in ${D.minutes[0]}-${D.minutes[1]} min` : 'Add something tasty', () => {
        if (!n) return; if (!G.inv || !G.money) return ctx.tip('ZipEats kitchens are offline right now. Try again later.');
        if (!G.money.pay(total, 'ZipEats: ' + v.name, { venue: v.id })) return ctx.tip('Not enough money for this order.');
        const o = { id: ++G.state.phone.seq, venue: v.id, items: Object.keys(cart).filter(k => cart[k]).map(k => ({ id: k, qty: cart[k] })), total, at: G.state.t + D.minutes[0] + Math.floor((G.state.t * 7) % (D.minutes[1] - D.minutes[0] + 1)) };
        (S().orders = S().orders || []).push(o); cart = {}; G.emit('delivery:order', o); ctx.open('delivery'); G.phone.tip('Order placed! Put the phone away and it will be here soon.');
      }, 'pri wide big', 'ui.bag')); if (!n) ctx.foot.lastChild.disabled = true;
  };
}
export default {
  id: 'delivery',
  badge: () => (S().orders || []).length,
  setup() { G.on('minutes', arrive); },
  render(b, ctx) {
    const orders = S().orders || [];
    b.append(el('div.ph-hero', { style: { background: '#f08a2c' } }, iconEl('ui.bag', 3), el('div', null, el('b', { text: 'Dinner, delivered.', style: { fontSize: '18px' } }), el('small', { text: `${money(D.fee)} delivery + ${Math.round(D.serviceRate * 100)}% service · ${D.minutes[0]}-${D.minutes[1]} min` }))));
    if (orders.length) { b.append(section('On the way')); for (const o of orders) b.append(row({ icon: 'ui.bag', title: VENUE_BY_ID[o.venue].name, sub: o.items.map(i => `${i.qty}x ${(ITEMS.ITEM_BY_ID[i.id] || {}).name || i.id}`).join(', '), right: when(o.at).replace('Today ', '~'), cls: 'note' })); }
    const vs = VENUES.filter(v => v.delivers && menuOf(v).length);
    if (!vs.length) return b.append(empty('ui.bag', 'No kitchens yet', 'Partner restaurants are still signing up.'));
    b.append(section('Restaurants'));
    for (const v of vs) { const os = openState({ venue: v, id: v.id }); b.append(row({ icon: 'need.hunger', title: v.name, sub: v.blurb, cls: 'note', right: os.open ? 'OPEN' : 'CLOSED', rightCls: os.open ? 'good' : 'bad', onclick: os.open ? () => ctx.push(v.name, venueView(v)) : () => ctx.tip(`${v.name} is closed right now. ${os.hours}`) })); }
    if (!G.inv || !G.money) b.append(el('p.ph-note', { text: 'Ordering opens once the kitchens are online.' }));
  },
};
