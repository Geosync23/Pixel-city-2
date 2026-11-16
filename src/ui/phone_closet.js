// The Closet app (replaces the outfit grid that lived in phone_minis.js): today's suggestion, every piece you own with filters / search / favourites,
// saved outfits, laundry states and timers, shop catalogues with "Take me there", the wish list, online orders, hair history.
// Lists are filled a page at a time (phone_closet_kit.js grid), so 1,300+ pieces stay smooth. The badge counts laundry / parcel news and clears when the app opens.
// Deep link: G.phone.open('closet', { tab: 'today' | 'closet' | 'outfits' | 'laundry' | 'shops' | 'wish' | 'hair' }).
import { G } from '../core/game.js';
import { el, section, chip, kv, empty, safe, money, btn } from './phone_util.js';
import { regDef, goTo, injectCss as storeCss } from './phone_store.js';
import { toast } from './kit.js';
import { PIECE_BY_ID, BRANDS, SHOPS, HAIR_BY_ID, CATALOG } from '../data/clothes.js';
import { storePanel, storeButton, availBar, css as storeCss2 } from './phone_instore.js';   /* in-store-only pieces (owner msgs 167-168) */
import { grid, filterBar, applyFilter, stage, thumb, injectCss, put } from './phone_closet_kit.js';

export const order = 126;
const V = { tab: 'today', sub: null }, fs = {};
const TABS = [['today', 'Today'], ['closet', 'Closet'], ['outfits', 'Outfits'], ['laundry', 'Laundry'], ['shops', 'Shops'], ['wish', 'Wish list'], ['hair', 'Hair']];
const STATE = ['Clean', 'Worn', 'Dirty', 'In the hamper', 'In the wash', 'At the cleaner'];
const C = () => G.clothesShop, W = () => G.wardrobe;
const take = (place, ctx, name) => { if (!place) return toast('Not on your map yet.'); if (G.phone.routeTo && safe(() => G.phone.routeTo(place), false)) return; goTo(place, ctx, name); };
const left = t => { const m = Math.max(0, Math.ceil(t - G.state.t)); return m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min`; };
const price$ = l => (l < .8 ? '$' : l < 1.1 ? '$$' : l < 1.4 ? '$$$' : '$$$$');

function pieceView(b, ctx, p, shop) {
  const own = W().owns(p.id), where = safe(() => C().whereSold(p.id), []), back = () => { V.sub = V.sub.from || null; ctx.refresh(); };
  put(b, btn('Back', back), el('div.cw-top', null, stage(W().specWithPieces([p]), 5), el('div', null, el('b', { text: p.name }), el('div', { text: (BRANDS[p.brand] || { name: '' }).name }), el('div', { text: p.styles.join(', ') }), el('div', { text: 'Warmth ' + '●'.repeat(p.warmth) + '○'.repeat(4 - p.warmth) }),
    own ? el('div', { text: STATE[W().state(p.id)] + (W().washable(p.id) ? ` · worn ${W().wears(p.id)}/${W().washable(p.id)}` : '') }) : null, W().delicate(p.id) ? el('div', { text: 'Dry clean only' }) : null)));
  const row = el('div.nl-acts');
  if (own) { put(row, btn(W().isFav(p.id) ? '♥ Favourite' : '♡ Favourite', () => { W().fav(p.id); ctx.refresh(); })); const sl = p.slot === 'acc' ? p.kind : p.slot, on = W().on()[sl] === p.id; put(row, btn(on ? 'Take off' : 'Put on', () => { if (on) W().takeOff(sl); else W().wearPiece(p.id); ctx.refresh(); }, 'pri')); }
  else { put(row, btn(W().isWish(p.id) ? '♥ On your wish list' : '♡ Wish list', () => { W().wish(p.id); ctx.refresh(); })); if (p.shops.includes('online')) put(row, btn(`Order ${money(C().priceAt(p, 'online') + 4)} · 2 days`, () => { if (C().order([p.id])) ctx.refresh(); }, 'pri')); else put(row, storeButton(p.id, { cls: 'pri' })); }
  put(b, row);
  if (!own && !p.shops.includes('online')) { put(b, storePanel(p.id, { price: r => money(C().priceAt(p, r.shop)) })); return; }
  if (!own) { put(b, section('Where to buy it this week')); const phys = where.filter(s => s !== 'online');
    if (!phys.length) put(b, el('p.as-note', { text: p.shops.includes('online') ? 'Only in this catalogue right now.' : 'Out of stock everywhere this week. Stock changes on Monday.' }));
    for (const s of phys) { const sh = C().shops().find(x => x.id === s); put(b, el('div.ph-card', null, kv(sh.name, money(C().priceAt(p, s))), btn('Take me there', () => take(sh.place, ctx, sh.name), '', 'ui.pin'))); } }
}
function shopView(b, ctx, shop) {
  const sh = C().shops().find(x => x.id === shop), all = shop === 'online', list = all ? CATALOG : C().stock(shop), st = fs[shop] || (fs[shop] = { slot: '', style: '', brand: '', q: '', sort: '', fav: false, avail: '' }), holder = el('div');   /* the catalogue lists every piece; in-store-only ones are tagged */
  put(b, btn('Back', () => { V.sub = null; ctx.refresh(); }), el('div.ph-card', null, el('b', { text: sh.name }), el('small', { text: shop === 'online' ? `Every piece in town. ${C().stock('online').length} can be delivered in 2 days ($4 a parcel); the ones marked In store are only sold in the shops.` : `${list.length} pieces this week · ${price$(sh.level)} · ${sh.taste.join(', ')}` }),
    shop !== 'online' ? btn('Take me there', () => take(sh.place, ctx, sh.name), 'pri', 'ui.pin') : null));
  const draw = () => { holder.textContent = ''; const out = applyFilter(list, st, { isFav: id => W().isWish(id) }).filter(p => !all || !st.avail || (st.avail === 'online') === p.shops.includes('online'));
    if (all) { put(holder, availBar(st, () => { ctx.refresh(); })); storeCss2(); }
    put(holder, el('p.as-note', { text: `${out.length} pieces` }), grid(out, { cell: p => { const off = all && !p.shops.includes('online'); return { sub: money(C().priceAt(p, off ? (p.shops.find(s => s !== 'online') || shop) : shop)), tag: W().owns(p.id) ? 'own' : off ? 'In store' : C().isNew(p, shop) ? 'new' : '', tagCls: W().owns(p.id) ? 'own' : off ? 'store' : 'new', fav: W().isWish(p.id) }; }, onPick: p => { V.sub = { piece: p.id, shop, from: V.sub }; ctx.refresh(); } })); };
  put(b, filterBar(st, draw), holder); draw();
}
function laundry(b, ctx) {
  const n = k => W().byState(k).length, L = G.laundry, ham = n(3);
  put(b, el('div.ph-card', null, kv('Clean', String(W().pieces().length + W().owned().length - n(1) - n(2) - n(3) - n(4) - n(5))), kv('Worn, still fine', String(n(1))), kv('Dirty', String(n(2))), kv('In the hamper', String(ham) + (safe(() => L.hasBag(), false) ? ' (bag is with you)' : '')), kv('Being washed', String(n(4) + n(5)))));
  const st = safe(() => L.status(), []); put(b, section('Machines and tickets', chip(String(st.length))));
  if (!st.length) put(b, el('p.as-note', { text: 'Nothing in a machine. Take the bag from your hamper to a washer when it fills up.' }));
  for (const s of st) put(b, el('div.ph-card', null, el('b', { text: s.text }), el('small', { text: s.done ? 'Waiting for you' : left(s.t) + ' left' })));
  if (ham) { put(b, section('In the hamper')); put(b, el('p.as-note', { text: W().byState(3).slice(0, 12).map(id => W().nameOf(id)).join(' · ') + (ham > 12 ? ' ...' : '') })); }
  put(b, el('div.nl-acts', null, btn('Nearest laundromat', () => take('pub:21', ctx, 'Suds & Bubbles Laundromat'), 'pri', 'ui.pin')), el('p.as-note', { text: 'Washer $3 for 30 min, dryer $2 for 40 min. Your own washer is free. Delicates go to the counter for dry cleaning.' }));
}
function shopsTab(b, ctx) {
  const orders = safe(() => C().orders(), []);
  put(b, el('div.ph-card', null, el('b', { text: 'The Closet catalogue' }), el('small', { text: `${CATALOG.length} pieces · ${C().stock('online').length} to order, parcel in 2 days · the rest only in the shops` + (orders.length ? ` · ${orders.reduce((n, o) => n + o.ids.length, 0)} on the way, due ${left(orders[0].t)}` : '') }), btn('Open the catalogue', () => { V.sub = { shop: 'online' }; ctx.refresh(); }, 'pri')));
  put(b, section('Shops in town'));
  for (const sh of C().shops()) { if (sh.id === 'online') continue; put(b, el('div.ph-card', null, el('b', { text: sh.name }), el('small', { text: `${sh.count} pieces this week · ${price$(sh.level)} · ${sh.taste.join(', ')}` }),
    el('div.nl-acts', null, btn('This week\'s stock', () => { V.sub = { shop: sh.id }; ctx.refresh(); }), btn('Take me there', () => take(sh.place, ctx, sh.name), 'pri', 'ui.pin')))); }
  put(b, el('p.as-note', { text: 'Every shop carries its own brands. Stock rotates each Monday and with the seasons; what you see here you buy in person.' }));
}
function hairTab(b, ctx) {
  const H = G.hair; if (!H) { put(b, empty('ui.scissors', 'No hair news', '')); return; } const cur = H.current(), h = HAIR_BY_ID[cur.hair];
  put(b, el('div.ph-card', null, el('b', { text: (h && h.name) || 'Your hair' }), el('small', { text: `Last cut ${H.daysSince()} day${H.daysSince() === 1 ? '' : 's'} ago` + (H.shaggy() ? ' · getting shaggy, a trim would tidy it' : '') })));
  put(b, section('Where to go'));
  for (const [place, name, what] of [['pub:22', 'Otis & Sons Barbershop', 'cuts, fades, beards'], ['deptstore', 'Bloom Beauty, the Galleria', 'styled looks and colour'], ['pub:17', 'Lacquer Lounge colour bar', 'every dye, ombre, dipped tips']]) put(b, el('div.ph-card', null, kv(name, what), btn('Take me there', () => take(place, ctx, name), '', 'ui.pin')));
  const hist = H.history().slice().reverse(); put(b, section('History', chip(String(hist.length)))); if (!hist.length) put(b, el('p.as-note', { text: 'No visits yet.' }));
  for (const x of hist.slice(0, 12)) put(b, el('div.ph-card', null, kv(x.what || 'Visit', 'day ' + (x.d + 1)), el('small', { text: safe(() => G.places.get(x.where).name, x.where === 'mall:bloom' ? 'Bloom Beauty' : '') })));
}
function render(b, ctx) {
  b.classList.add('as-body'); injectCss(); storeCss && storeCss(); if (G.state.clothes) G.state.clothes.news = 0;
  if (!W() || !W().PIECES || !C()) { put(b, empty('ui.hanger', 'Empty closet', 'No wardrobe here yet.')); return; }
  if (ctx.arg && ctx.arg.tab) { V.tab = ctx.arg.tab; V.sub = null; ctx.arg.tab = null; }
  if (V.sub && V.sub.piece && PIECE_BY_ID[V.sub.piece]) return pieceView(b, ctx, PIECE_BY_ID[V.sub.piece], V.sub.shop);
  if (V.sub && V.sub.shop && SHOPS[V.sub.shop]) return shopView(b, ctx, V.sub.shop);
  V.sub = null; const tabs = el('div.cw-chips'); for (const [k, n] of TABS) put(tabs, el('button' + (V.tab === k ? '.on' : ''), { text: n, onclick: () => { V.tab = k; ctx.refresh(); } })); put(b, tabs);
  if (V.tab === 'today' || V.tab === 'closet' || V.tab === 'outfits') {
    if (V.tab !== 'closet') put(b, el('div.cw-top', null, stage(G.state.player.spec, 4), W().summaryEl()));
    const host = el('div'); put(b, host); W().panel(V.tab === 'closet' ? 'drawers' : V.tab, host, () => ctx.refresh());
  } else if (V.tab === 'laundry') laundry(b, ctx);
  else if (V.tab === 'shops') shopsTab(b, ctx);
  else if (V.tab === 'hair') hairTab(b, ctx);
  else { const list = W().wishes().map(id => PIECE_BY_ID[id]).filter(Boolean); put(b, el('p.as-note', { text: list.length ? 'Tap a piece to see who stocks it this week.' : 'Nothing on your wish list. Tap the heart on anything in a shop or a catalogue.' }));
    put(b, grid(list, { empty: ' ', cell: p => ({ sub: money(p.price), fav: true }), onPick: p => { V.sub = { piece: p.id, shop: null, from: null }; ctx.refresh(); } })); }
}
export function init() {
  if (!G.phone || !G.phone.registerApp) return; injectCss();
  const news = () => { if (G.state.clothes && !(G.phone.viewing && safe(() => G.phone.viewing('closet'), false))) G.state.clothes.news = (G.state.clothes.news || 0) + 1; };
  G.phone.registerApp(Object.assign(regDef('closet'), { iconId: 'app.closet', render, badge: () => (G.state.clothes && G.state.clothes.news) || 0 }));
  G.on('wardrobe:dirty', news);
  const a = safe(() => G.apps.get('closet'), null);
  if (a) { a.tagline = 'What shall I wear?'; a.desc = 'Your whole wardrobe: every piece with filters and search, outfits you saved, what is clean or in the wash, laundry timers, shop catalogues and a wish list.'; a.does = ['Today\'s outfit for the weather', 'Laundry timers', 'Shop stock and Take me there', 'Order clothes to your door']; }
  const rel = () => safe(() => G.apps.release('closet')); G.on('wardrobe:buy', rel); G.on('wardrobe:dirty', rel); G.on('laundry:hamper', rel);
}
