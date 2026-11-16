// Shop / menu window for every venue in data/venues.js (stock = items.js `soldAt`), plus eating in.
//
// G.shop
//   open(venueId, opts?)        buy window. opts: { online: true (adds the online order fee, no eat-in), tab: category id }
//   close()
//   stock(venueId) -> [item]    what the venue sells right now (seasonal items filtered)
//   price(itemOrId, venueId, opts?) -> dollars  list price x venue priceMult x running event discounts x staff discount, floored at half price, rounded to $0.25
//   buy(itemId, qty, venueId, opts?) -> bool    pay + deliver: food/books/gifts/tools -> backpack (capacity checked; takeaway dishes spoil after 4 h),
//                               passes (items with `grants`) are activated at once (G.inv.grant), home goods -> G.housing.addFurniture(itemId) if present
//                               else G.state.owned.furniture.push({ id, day, t }), outfits -> G.wardrobe.add(itemId) if present else G.state.owned.outfits
//   eatIn(dishId, venueId?) -> bool   pay, walk to a free seat in the room (if it has one) and eat/drink there; effects apply at the end
//   purchased(venueId) -> bool  bought anything here this visit? (activities.js `purchasedHere`; cleared when you leave the room)
//   onService(serviceId, fn)    make a data/venues SERVICES entry appear at its venue's counter: fn(service, venueId). 'checkup' is built in.
// Fixtures: furniture tagged checkout / till / host_stand / host / reception inside a room whose id is a venue id opens that venue's window.
// City: world pois that name a non-interior venue (poi.venue = id, or id 'stall:<venueId>' / '<venueId>') become "shop here" interactables.
// Events: 'shop:buy'(itemId, qty, venueId), 'shop:open'(venueId), 'service'(serviceId, venueId)
import { G } from '../core/game.js';
import { ITEM_BY_ID, itemsSoldAt, INVENTORY } from '../data/items.js';
import { VENUE_BY_ID, SERVICES, isOpen } from '../data/venues.js';
import { EVENTS, eventOnDay, seasonOf } from '../data/calendar.js';
import { DISCOUNTS, DELIVERY, OVERDRAFT } from '../data/economy.js';
import { registerFixture } from '../scenes/interior.js';
import { el, modal, toast } from './kit.js';
import { iconEl } from './_icons.js';

export const order = 60;
let win = null; const bought = {}, services = {}, seen = new WeakSet(), cityRemovers = [];
const fmt = n => (G.money ? G.money.fmt(n) : '$' + n);
const q25 = n => Math.round(n * 4) / 4;
const TABS = [['dish', 'Menu'], ['ingredient', 'Groceries'], ['ready_meal', 'Meals'], ['snack', 'Snacks'], ['drink', 'Drinks'], ['homegood', 'Home'], ['outfit', 'Outfits'], ['book', 'Books'], ['gift', 'Gifts'], ['misc', 'More']];
const COURSE = { drink: 0, snack: 1, main: 2, dessert: 3 };

function stock(venueId) { const s = seasonOf(G.now().day).id; return itemsSoldAt(venueId).filter(i => i.price > 0 && (!i.seasons || i.seasons.includes(s))); }
/* QA6: the best of your perks at this venue (they do not stack): staff discount (your job), a friend who works here (G.social.discount, 5-10%),
   a story discount (G.story.discount, percent). Returns { mult, why } */
function perk(venueId) {
  let best = 1, why = '';
  try { const job = G.jobs && G.jobs.current && G.jobs.current(), jid = job && (job.id || job.jobId || job), st = jid && DISCOUNTS.staff[jid]; if (st && st.venue === venueId && st.mult < best) { best = st.mult; why = 'Staff discount'; } } catch (e) { /* optional */ }
  try { const f = G.social && G.social.discount ? G.social.discount(venueId) || 0 : 0; if (f > 0 && 1 - f < best) { best = 1 - f; why = 'Friends discount'; } } catch (e) { /* optional */ }
  try { const p = G.story && G.story.discount ? G.story.discount(venueId) || 0 : 0; if (p > 0 && 1 - p / 100 < best) { best = 1 - p / 100; why = 'Family discount'; } } catch (e) { /* optional */ }
  return { mult: best, why };
}
const perkMult = venueId => perk(venueId).mult;
function price(it, venueId, o = {}) {
  it = typeof it === 'string' ? ITEM_BY_ID[it] : it; const v = VENUE_BY_ID[venueId] || {}, n = G.now(); let m = v.priceMult || 1, d = 1;
  for (const ev of EVENTS) { const ds = ev.special && ev.special.discounts; if (!Array.isArray(ds) || !eventOnDay(ev, n.day)) continue; for (const x of ds) if (x.venue === venueId && (!x.categories || x.categories.includes(it.category)) && (!x.items || x.items.includes(it.id))) d *= x.mult; }
  d *= perkMult(venueId);
  return Math.max(.25, q25(it.price * Math.max(.5, m * d)));
}
const ownedBook = id => !!(ITEM_BY_ID[id] && ITEM_BY_ID[id].cookbook && G.state.cook && (G.state.cook.books || []).includes(id));   // QA round 3: a cookbook on your shelf shows Owned
const ownedOutfit = id => (G.wardrobe && G.wardrobe.owns ? G.wardrobe.owns(id) : (G.state.owned.outfits || []).includes(id));
function dressOk(venueId) {
  const v = VENUE_BY_ID[venueId]; if (!v || !v.dressCode) return true;
  if (G.needs && G.needs.get('hygiene') <= 0) { toast('"Perhaps... freshen up first?" The host looks pained.', 'bad'); return false; }
  const st = G.wardrobe && G.wardrobe.styles && G.wardrobe.styles(); if (st && !st.includes('smart') && !st.includes('formal')) { toast(`${v.name} has a dress code: smart or formal wear, please.`, 'bad'); return false; }
  return true;
}
function buy(id, qty, venueId, o = {}) {
  const it = ITEM_BY_ID[id]; if (!it || qty < 1) return false; if (ownedBook(id)) { toast('That one is already on your kitchen shelf.', 'info'); return false; } const cost = price(it, venueId) * qty + (o.online ? DELIVERY.onlineOrderFee : 0), payO = { category: it.category, venue: venueId };
  const done = () => { bought[venueId] = true; G.emit('shop:buy', id, qty, venueId); G.audio && G.audio.sfx && G.audio.sfx('buy'); return true; };
  if (it.category === 'homegood') {
    if (!o.online && qty === 1 && G.houseplants && G.houseplants.carryHome) { const r = G.houseplants.carryHome(id, venueId); if (r !== null) { if (r) bought[venueId] = true; return r; } }   // houseplants: small plants from a flower shop go home in your shopping bag
    if (!G.money.pay(cost, it.name, payO)) return false;
    for (let i = 0; i < qty; i++) { if (G.housing && G.housing.addFurniture) G.housing.addFurniture(id); else G.state.owned.furniture.push({ id, day: G.now().day, t: Math.floor(G.state.t) }); }
    toast(`${it.name} ordered — delivered to your home tomorrow at ${DELIVERY.homegoodsNextMorningHour}:00.`, 'good', 3600); return done();
  }
  if (it.category === 'outfit') {
    if (ownedOutfit(id)) { toast('You already own that.', 'info'); return false; } if (!G.money.pay(cost, it.name, payO)) return false;
    if (G.wardrobe && G.wardrobe.add) G.wardrobe.add(id); else G.state.owned.outfits.push(id);
    toast(`${it.name} is yours. Change at a wardrobe${VENUE_BY_ID[venueId] && venueId === 'clothing' ? ' or the fitting room' : ''}.`, 'good', 3600); return done();
  }
  if (it.grants) { if (!G.money.pay(cost, it.name, payO)) return false; G.inv.grant(it.grants.access, it.grants.days * qty); toast(`${it.name} activated: ${it.grants.days * qty} day${it.grants.days * qty > 1 ? 's' : ''}.`, 'good'); return done(); }
  const addO = { silent: true }; if (it.category === 'dish') addO.exp = G.state.t + INVENTORY.takeawayHours * 60; if (venueId === 'market_stalls') addO.fresh = INVENTORY.marketFreshBonusDays;
  if (!(addO.exp ? G.inv.free() >= qty : G.inv.canAdd(id, qty))) { toast('Your backpack is full.', 'bad'); return false; }
  if (!G.money.pay(cost, qty > 1 ? `${it.name} x${qty}` : it.name, payO)) return false;
  G.inv.add(id, qty, addO); return done();
}

/* ---------- eating in ---------- */
function standNear(w, x, y) { for (const r of [.6, .9, 1.3]) for (let a = 0; a < 8; a++) { const px = x + Math.cos(a * Math.PI / 4 + .4) * r, py = y + Math.sin(a * Math.PI / 4 + .4) * r; if (!w.isBlocked(px, py)) return { x: px, y: py }; } return null; }
function freeSeat() {
  const sc = G.scene; if (!sc || !sc.fixtures) return null; let best = null, bd = 1e9;
  for (const f of sc.fixtures) { if (!f.seats || !f.seats.length || !f.tags.some(t => t === 'seating' || t === 'seat' || t === 'booth' || t === 'sofa')) continue; if (f.tags.includes('bed')) continue;
    for (const s of f.seats) { if (sc.ents.some(e => e !== G.player && Math.hypot(e.x - s.x, e.y - s.y) < .45)) continue; const d = Math.hypot(s.x - G.player.x, s.y - G.player.y) + (f.tags.includes('checkout') ? 6 : 0); if (d < bd) { bd = d; best = { f, s }; } } }
  return best;
}
function eatIn(id, venueId) {
  const it = ITEM_BY_ID[id]; venueId = venueId || (G.scene && G.scene.roomId) || it.venue; if (!it || !dressOk(venueId)) return false;
  if (!G.money.pay(price(it, venueId), it.name, { category: 'dish', venue: venueId })) return false;
  bought[venueId] = true; G.emit('shop:buy', id, 1, venueId); close();
  const drink = it.course === 'drink' || it.category === 'drink';
  const begin = seat => { if (G.busy) return; const fin = () => { G.inv.applyEffects(it.effects); G.emit('inv:use', id); };
    if (G.activities) G.activities.start(drink ? 'drink' : 'eat', { minutes: it.eatMinutes || 8, at: seat || undefined, seated: !!seat, label: (drink ? 'Drinking ' : 'Eating ') + it.name, onDone: fin, onCancel: fin, summary: `${it.name}: ${G.inv.effectText(it)}`, noSummary: false }); else fin(); };
  const fs = freeSeat();
  if (!fs) { begin(null); return true; }
  const spot = fs.f.use || standNear(G.world, fs.s.x, fs.s.y); let fired = false;
  if (spot) G.useInteractable({ x: fs.s.x, y: fs.s.y, spot, label: 'Seat', use: () => { fired = true; begin(fs.s); } });
  if (!fired && !G.pending) begin(fs.s);
  return true;
}

/* ---------- window ---------- */
function close() { if (win) { const w = win; win = null; w.close(); } }
function open(venueId, o = {}) {
  const v = VENUE_BY_ID[venueId]; if (!v || (G.modal && !win)) return false; close();
  const n = G.now();
  if ((!v.interior || o.checkHours) && !o.online && !isOpen(v, n.weekday, n.hf)) { toast(`${v.name} is closed right now.`, 'info'); return false; }
  if (!o.online && !dressOk(venueId)) return false;
  const items = stock(venueId), svcs = o.online ? [] : SERVICES.filter(s => s.venue === venueId && services[s.id]);
  if (!items.length && !svcs.length) { toast(`${v.name} has nothing for sale.`, 'info'); return false; }
  const tabs = TABS.filter(([c]) => items.some(i => i.category === c && !(o.online && c === 'dish'))).map(([c, nm]) => [c, c === 'homegood' && items.every(i => i.category !== 'homegood' || i.tag === 'plant') ? 'Houseplants' : nm]); if (svcs.length) tabs.push(['service', 'Services']);
  let tab = o.tab && tabs.some(t => t[0] === o.tab) ? o.tab : tabs[0][0]; const qty = {};
  const canSit = !o.online && !!G.scene && !!G.scene.roomId && ((v.interior && G.scene.roomId === venueId) || String(venueId).startsWith(G.scene.roomId + ':'));   // QA round 3: also a cafe counter inside a bigger room (museum:cafe, observatory:cocoa)
  const m = modal({ title: v.name + (o.online ? ' — online' : ''), cls: 'shop-win', onClose: () => { if (win === m) win = null; } }); win = m;
  const head = el('div.shop-top'), tabBar = el('div.shop-tabs'), listEl = el('div.shop-list'); m.body.append(head, tabBar, listEl);
  const render = () => {
    const bal = G.money.get(), top = listEl.scrollTop;
    head.textContent = ''; head.append(el('span.shop-blurb', { text: o.online ? `Delivery fee ${fmt(DELIVERY.onlineOrderFee)} per order.` : v.blurb || '' }, (() => { const k = perk(venueId); return k.mult < 1 ? el('b.shop-perk', { text: ` ${k.why}: ${Math.round((1 - k.mult) * 100)}% off.`, style: { color: 'var(--good, #2f8f3a)' } }) : null; })()), el('span.shop-wallet' + (bal < 0 ? '.neg' : ''), null, iconEl('ui.coin', 1), fmt(bal)), el('span.shop-bag', null, iconEl('ui.bag', 1), `${G.inv.items().length}/${G.inv.capacity}`));
    tabBar.textContent = ''; if (tabs.length > 1) for (const [c, name] of tabs) tabBar.append(el('button.shop-tab' + (c === tab ? '.on' : ''), { onclick: () => { tab = c; listEl.scrollTop = 0; render(); } }, name)); tabBar.style.display = tabs.length > 1 ? '' : 'none';
    listEl.textContent = '';
    if (tab === 'service') { for (const s of svcs) listEl.append(el('div.shop-row', null, iconEl('ui.heart', 2), el('div.shop-info', null, el('b', { text: s.name }), el('span', { text: s.desc })), el('div.shop-buy', null, el('span.shop-price', { text: s.price ? fmt(s.price) : 'Free' }), el('button.go', { onclick: () => { close(); G.emit('service', s.id, venueId); services[s.id](s, venueId); } }, 'Go')))); return; }
    const rows = items.filter(i => i.category === tab).sort((a, b) => tab === 'dish' ? (COURSE[a.course] ?? 9) - (COURSE[b.course] ?? 9) || a.price - b.price : tab === 'homegood' ? a.tag.localeCompare(b.tag) || (a.tag === 'plant' ? a.price - b.price : a.tier - b.tier) : a.price - b.price);
    let lastTag = null;
    for (const it of rows) {
      if (tab === 'homegood' && it.tag !== lastTag) { lastTag = it.tag; listEl.append(el('div.shop-sep', { text: it.tag === 'plant' ? 'Houseplants' : it.tag[0].toUpperCase() + it.tag.slice(1) })); }
      const p = price(it, venueId), sale = p < q25(it.price * (v.priceMult || 1)), single = it.category === 'homegood' || it.category === 'outfit' || it.category === 'dish' || it.stack === 1 || !!it.grants, n = single ? 1 : qty[it.id] || 1;
      const owned = (it.category === 'outfit' && ownedOutfit(it.id)) || ownedBook(it.id), blockedWant = bal < 0 && OVERDRAFT.blockedWhileNegative.includes(it.category), poor = !G.money.canAfford(p * n, { category: it.category, venue: venueId });
      const acts = el('div.shop-buy');
      acts.append(el('span.shop-price' + (sale ? '.sale' : ''), { text: fmt(p * n) }));
      if (!single) acts.append(el('span.shop-qty', null, el('button', { 'aria-label': 'Less', disabled: n <= 1, onclick: () => { qty[it.id] = n - 1; render(); } }, '−'), el('b', { text: n }), el('button', { 'aria-label': 'More', disabled: n >= it.stack, onclick: () => { qty[it.id] = n + 1; render(); } }, '+')));
      if (owned) acts.append(el('span.shop-owned', { text: 'Owned' }));
      else if (it.category === 'dish') {
        if (!o.online) acts.append(el('button.go', { disabled: poor, onclick: () => eatIn(it.id, venueId) }, canSit ? (it.course === 'drink' || it.category === 'drink' ? 'Drink here' : 'Eat here') : it.course === 'drink' || it.category === 'drink' ? 'Drink' : 'Eat'));
        if (it.takeaway) acts.append(el('button', { disabled: poor, onclick: () => { if (buy(it.id, 1, venueId, o)) { toast(`${it.name} to go — best within ${INVENTORY.takeawayHours} hours.`, 'good'); render(); } } }, 'To go'));
      } else acts.append(el('button.go', { disabled: poor || blockedWant, onclick: () => { if (buy(it.id, n, venueId, o)) { if (!['homegood', 'outfit'].includes(it.category) && !it.grants) toast(`Bought ${it.name}${n > 1 ? ' x' + n : ''}.`, 'good', 1600); qty[it.id] = 1; render(); if (it.cookbook) setTimeout(() => { if (win === m) render(); }, 350); }   /* QA round 3: the book is shelved a moment after buying: show Owned */ } }, 'Buy'));
      const have = G.inv.count(it.id), sub = G.inv.effectText(it) || (it.note ? it.note.split('.')[0] + '.' : '');
      listEl.append(el('div.shop-row' + (poor ? '.poor' : ''), null, iconEl(it.id, 2, it.category), el('div.shop-info', null, el('b', null, it.name, have ? el('i', { text: ` · have ${have}` }) : null), el('span', { text: sub + (it.shelfLifeDays && it.category !== 'homegood' ? ` · keeps ${it.shelfLifeDays + (venueId === 'market_stalls' ? INVENTORY.marketFreshBonusDays : 0)} d` : '') })), acts));
    }
    listEl.scrollTop = top;
  };
  render(); G.emit('shop:open', venueId); return true;
}

export function init() {
  G.shop = { open, close, stock, price, buy, eatIn, purchased: id => !!bought[id], onService: (id, fn) => { services[id] = fn; } };
  services.checkup = (s) => { if (!G.money.pay(s.price, s.name, { force: true, category: 'clinic' })) return; G.startActivity({ label: s.name, anim: 'sit', minutes: s.minutes, canCancel: false, done: () => { const e = s.effect; for (const id of e.removeMoodlets || []) G.needs.removeMoodlet(id); if (e.moodlet) G.needs.addMoodlet(e.moodlet); for (const k in e.needs || {}) G.needs.add(k, e.needs[k]); toast('"Fit as a fiddle!" The nurse hands you a lollipop.', 'good', 3600); } }); };
  for (const t of ['checkout', 'till', 'host_stand', 'host', 'reception']) registerFixture(t, (fx, scene) => {
    const v = VENUE_BY_ID[scene.roomId]; if (!v || seen.has(fx)) return null;
    if (!itemsSoldAt(v.id).length && !SERVICES.some(s => s.venue === v.id)) return null;
    seen.add(fx); return { label: v.type === 'food' || (v.offers && v.offers.menu && !v.offers.shop) ? 'Order' : itemsSoldAt(v.id).length ? 'Shop' : 'Front desk', shop: v.id, use: () => open(v.id) };
  });
  G.on('scene', s => {
    for (const k in bought) delete bought[k];
    if (!s || s.id !== 'city' || !s.world || !Array.isArray(s.world.pois)) return; while (cityRemovers.length) cityRemovers.pop()();
    for (const p of s.world.pois) { if (!p || !isFinite(p.x)) continue; const vid = p.venue || String(p.id || '').replace(/^(stall|venue|stand):/, ''), v = VENUE_BY_ID[vid]; if (!v || v.interior || v.id === 'airport' || String(p.id || '').startsWith('door:')) continue;
      cityRemovers.push(G.addInteractable({ scene: 'city', x: p.x, y: p.y, label: v.name, h: 1, range: 2, spot: p.spot || p.stand, use: () => open(v.id, { checkHours: true }) })); }
  });
}
