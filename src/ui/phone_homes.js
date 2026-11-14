// Phone app: NESTLY — the properties browser (app id 'homes', released through the app store). Data: G.housing.homes(); styles in phone_apps.css.
// Pages: list (My home card, filters: rent/buy, district, weekly budget) -> listing (picture, facts, walk times, pros/cons, Take me there, Rent, Buy) -> cost sheet (confirm).
// Deep link: G.phone.open('homes', { home: id }).
import { G } from '../core/game.js';
import { objSprite } from '../engine/sprites.js';
import { el, iconEl, btn, section, chip, kv, empty, safe, money, balance, place, DISTRICT_NAME, when } from './phone_util.js';
import { toast } from './kit.js';
import { SIZE_CLASSES, MOVING } from '../data/homes.js';
import { MORTGAGE } from '../data/economy.js';
import { ITEM_BY_ID } from '../data/items.js';
import { regDef, goTo, cityPois, walkMin, walkText, injectCss } from './phone_store.js';
export const order = 122;

const H = () => G.housing, F = { mode: 'all', district: '', budget: 0 };
const KIND = { starter_studio: 'Studio', apartment: 'Apartment', loft: 'Loft', house: 'House', villa: 'Villa', penthouse: 'Penthouse' };
const door = id => cityPois().find(p => p.id === 'door:home:' + id) || place('home:' + id) || null;
const dn = k => DISTRICT_NAME[k] || k || '';
const weekly = l => (l.rent || 0) + ((SIZE_CLASSES[l.home.sizeClass] || {}).utilitiesPerWeek || 0);
const mortWeekly = (l, ix) => { const t = MORTGAGE.terms[ix]; return Math.ceil((l.price - l.down) * (1 + t.fee) / t.weeks); };

/* ---------- pictures: the real building next to the door, or a floor-plan sketch ---------- */
let bw = null, blds = [];
function building(p) {
  const w = safe(() => G.sceneCache.get('city').world, null); if (!w || !w.objs || !p) return null;
  if (bw !== w) { bw = w; blds = w.objs.filter(o => o.B && o.a && (/^bld\./.test(o.id) || (o.B[3] - o.B[0]) * (o.B[4] - o.B[1]) >= 20 && o.B[5] - o.B[2] >= 2)); }
  let best = null, bd = 7;
  for (const o of blds) { const B = o.B, dx = Math.max(B[0] - p.x, 0, p.x - B[3]), dy = Math.max(B[1] - p.y, 0, p.y - B[4]), d = Math.hypot(dx, dy) + (/^bld\./.test(o.id) ? 0 : 1.5); if (d < bd) { bd = d; best = o; } }
  return best;
}
const WALL = '#2a2733', TINT = ['#f3d9a4', '#bfe0d0', '#f2c4b0', '#c9d4f0', '#e6d0ee', '#d8e6a8'];
function plan(x, w, h, home) {
  x.fillStyle = '#e9f0f4'; x.fillRect(0, 0, w, h); x.fillStyle = '#d5e0e8'; for (let i = 0; i < w; i += 8) x.fillRect(i, 0, 1, h); for (let j = 0; j < h; j += 8) x.fillRect(0, j, w, 1);
  const t = (SIZE_CLASSES[home.sizeClass] || { tiles: [8, 6] }).tiles, k = Math.min((w - 16) / t[0], (h - 14) / t[1]), pw = Math.round(t[0] * k), ph = Math.round(t[1] * k), ox = Math.round((w - pw) / 2), oy = Math.round((h - ph) / 2);
  const rooms = home.rooms || [{}], n = rooms.length; let cx = ox;
  rooms.forEach((r, i) => { const rw = i === n - 1 ? ox + pw - cx : Math.round(pw * (i === 0 ? (n > 1 ? .46 : 1) : .54 / (n - 1))); x.fillStyle = TINT[i % TINT.length]; x.fillRect(cx, oy, rw, ph); x.fillStyle = WALL; x.fillRect(cx, oy, 2, ph); cx += rw; });
  x.fillStyle = WALL; x.fillRect(ox, oy, pw, 2); x.fillRect(ox, oy + ph - 2, pw, 2); x.fillRect(ox + pw - 2, oy, 2, ph); x.fillStyle = '#e9f0f4'; x.fillRect(ox + 6, oy + ph - 2, 8, 2);
}
const cache = new Map();
function thumb(l, w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; c.className = 'pix nl-thumb'; const key = l.id + '|' + w; let src = cache.get(key);
  if (!src) {
    src = document.createElement('canvas'); src.width = w; src.height = h; const x = src.getContext('2d'), ob = building(door(l.id)), sp = ob && safe(() => objSprite(ob), null);
    if (sp && sp.c && sp.w > 4) {
      const hr = safe(() => G.now().hf, 12), night = hr < 6 || hr >= 20.5; x.fillStyle = night ? '#1d2440' : '#8fd0f0'; x.fillRect(0, 0, w, h); x.fillStyle = night ? '#33406a' : '#d8f0fa'; x.fillRect(0, Math.round(h * .45), w, h);
      x.fillStyle = '#9aa78a'; x.fillRect(0, h - Math.round(h * .18), w, h);
      const k = Math.min((w - 6) / sp.w, (h - 3) / sp.h); x.imageSmoothingEnabled = k < 1; x.imageSmoothingQuality = 'medium'; x.drawImage(sp.c, Math.round((w - sp.w * k) / 2), Math.round(h - sp.h * k - 1), Math.round(sp.w * k), Math.round(sp.h * k));
    } else plan(x, w, h, l.home);
    cache.set(key, src);
  }
  c.getContext('2d').drawImage(src, 0, 0); return c;
}

/* ---------- distances ---------- */
const dcache = new Map();
function near(l) {
  const p = door(l.id); if (!p) return {}; const job = safe(() => G.jobs.current(), null), key = l.id + '|' + ((job && (job.venue || job.jobId)) || ''); if (dcache.has(key)) return dcache.get(key);
  const o = {};
  const st = safe(() => G.rail.stations(), []).map(s => ({ s, m: walkMin(p, s.entrance || s) })).sort((a, b) => a.m - b.m)[0]; if (st) o.station = { name: st.s.name + ' Station', m: st.m };
  const bus = safe(() => G.transit.stops(), []).map(s => ({ s, m: walkMin(p, s) })).sort((a, b) => a.m - b.m)[0]; if (bus) o.bus = { name: bus.s.name, m: bus.m };
  const gro = safe(() => G.nav.find('groceries', 12), []).filter(g => typeof g.x === 'number').map(g => ({ g, m: walkMin(p, g) })).sort((a, b) => a.m - b.m)[0]; if (gro) o.grocery = { name: gro.g.name, m: gro.m };
  const wp = job && job.venue ? (place(typeof job.venue === 'string' ? job.venue : job.venue.id) || (typeof job.venue === 'object' && typeof job.venue.x === 'number' ? job.venue : null)) : null;
  if (wp && typeof wp.x === 'number') o.work = { name: wp.name || 'Work', m: walkMin(p, wp) };
  dcache.set(key, o); return o;
}
const availText = l => (l.available ? '' : `On the market from day ${l.unlockDay + 1}` + (safe(() => G.now().day, 0) < l.unlockDay ? ` (in ${l.unlockDay - G.now().day} day${l.unlockDay - G.now().day === 1 ? '' : 's'})` : ''));

/* ---------- pages ---------- */
function myHome(b, ctx) {
  const cur = safe(() => H().current(), null); b.append(section('My home'));
  if (!cur || !cur.id) { b.append(el('p.as-note', { text: 'No home yet. Pick a place below and move in today.' })); return; }
  const l = H().homes().find(x => x.id === cur.id), h = (l && l.home) || cur.home || {}, m = safe(() => H().mortgage(), null), bills = safe(() => G.money.bills(), null);
  const c = el('div.ph-card.nl-mine', null, el('div.nl-mine-top', null, l ? thumb(l, 96, 64) : null, el('div', null, el('b', { text: h.name || 'Home' }), el('span', { text: `${KIND[h.kind] || 'Home'} · ${dn(h.district)}` }), el('small', { text: cur.owned ? 'You own it' : 'Rented, weekly lease' }))));
  if (cur.owned) { c.append(kv('Upkeep', money(h.upkeepPerWeekOwned || 0) + ' / week')); if (m) c.append(kv('Mortgage', `${money(m.weekly)} / week · ${money(m.left)} left`)); }
  else c.append(kv('Rent', money(h.rentPerWeek || 0) + ' / week'));
  c.append(kv('Utilities', money((SIZE_CLASSES[h.sizeClass] || {}).utilitiesPerWeek || 0) + ' / week'));
  if (bills) c.append(kv('Next bill', `${money(bills.total)} · ${when(bills.dueT)}`));
  const acts = el('div.nl-acts', null, btn('Take me home', () => goTo(cur.door || 'door:home:' + cur.id, ctx, h.name), '', 'ui.pin'));
  if (safe(() => H().isHome(), false) && H().decorate) acts.append(btn('Decorate', () => { ctx.close(); safe(() => H().decorate(), 0); }, 'gold'));
  c.append(acts); if (!safe(() => H().isHome(), false)) c.append(el('small.nl-dim', { text: 'Decorate mode opens from here while you are at home.' }));
  b.append(c);
}
function card(l, ctx) {
  const h = l.home, n = near(l), bits = [];
  if (n.work) bits.push(`Work ${n.work.m} min`); if (n.station) bits.push(`Train ${n.station.m} min`); if (n.grocery) bits.push(`Groceries ${n.grocery.m} min`);
  return el('button.nl-card' + (l.available ? '' : '.off') + (l.current ? '.cur' : ''), { 'aria-label': h.name, onclick: () => ctx.push(h.name, (bb, c) => detail(bb, c, l.id), 'home:' + l.id) },
    thumb(l, 96, 72),
    el('span.nl-t', null, el('b', null, h.name, l.current ? el('em.as-new', { text: l.owned ? 'YOURS' : 'HOME' }) : null),
      el('small', { text: `${KIND[h.kind] || 'Home'} · ${dn(h.district)} · ${(SIZE_CLASSES[h.sizeClass] || {}).label || ''}, ${(h.rooms || []).length} room${(h.rooms || []).length === 1 ? '' : 's'}` }),
      el('span.nl-price', null, l.rent ? el('b', { text: money(l.rent) + '/wk' }) : null, l.price ? el('i', { text: (l.rent ? 'or ' : '') + 'buy ' + money(l.price) }) : null),
      l.available ? (bits.length ? el('small.nl-dim', { text: bits.join(' · ') }) : null) : el('small.nl-lock', null, iconEl('ui.lock', 1), availText(l))));
}
function list(b, ctx) {
  if (!H() || !H().homes) { b.append(empty('ui.warning', 'No listings', 'The estate agents are out to lunch.')); return; }
  if (ctx.arg && ctx.arg.home) { const id = ctx.arg.home; ctx.arg.home = null; setTimeout(() => ctx.push((H().homes().find(x => x.id === id) || { home: {} }).home.name || 'Listing', (bb, c) => detail(bb, c, id), 'home:' + id), 0); return; }
  b.classList.add('as-body'); const all = H().homes(); myHome(b, ctx);
  b.append(section('Find a place', chip(money(balance()) + ' in the bank')));
  const dists = [...new Set(all.map(l => l.home.district))];
  const pick = (k, v) => () => { F[k] = v; ctx.refresh(); };
  b.append(el('div.nl-filters', null, [['all', 'All'], ['rent', 'To rent'], ['buy', 'To buy']].map(([k, n]) => chip(n, F.mode === k ? 'on' : '', pick('mode', k)))),
    el('div.nl-filters', null, chip('Anywhere', !F.district ? 'on' : '', pick('district', '')), dists.map(d => chip(dn(d), F.district === d ? 'on' : '', pick('district', d)))),
    el('div.nl-filters', null, [[0, 'Any budget'], [200, 'Up to $200/wk'], [350, 'Up to $350/wk'], [600, 'Up to $600/wk']].map(([v, n]) => chip(n, F.budget === v ? 'on' : '', pick('budget', v)))));
  const cost = l => (F.mode === 'buy' ? mortWeekly(l, 1) : l.rent || mortWeekly(l, 1));
  const out = all.filter(l => (F.mode !== 'rent' || l.rent) && (F.mode !== 'buy' || l.price) && (!F.district || l.home.district === F.district) && (!F.budget || cost(l) <= F.budget))
    .sort((a, c) => (c.available - a.available) || ((a.rent || a.price / 30) - (c.rent || c.price / 30)));
  if (!out.length) b.append(empty('ui.pin', 'Nothing matches', 'Loosen a filter. New listings also come on the market as the weeks go by.'));
  for (const l of out) b.append(card(l, ctx));
  b.append(el('p.as-note', { text: 'Rents are weekly and you can move any time. Your furniture always moves with you, in boxes.' }));
}
function detail(b, ctx, id) {
  const l = safe(() => H().homes().find(x => x.id === id), null); if (!l) { b.append(empty('ui.warning', 'Listing gone', '')); return; }
  const h = l.home, sc = SIZE_CLASSES[h.sizeClass] || {}, n = near(l); b.classList.add('as-body');
  b.append(el('div.nl-hero', null, thumb(l, 176, 104)), el('b.nl-name', { text: h.name }), el('p.as-desc', { text: h.blurb || '' }), el('small.nl-dim', { text: h.where || dn(h.district) }));
  if (h.layout) b.append(el('p.as-desc', { text: h.layout }));          // what makes this floor plan its own (data/homes.js)
  if (!l.available) b.append(el('p.nl-lock.big', null, iconEl('ui.lock', 1), availText(l) + '. You can still walk past and have a look.'));
  if (l.current) b.append(el('p.as-note', { text: l.owned ? 'This is your home, and you own it.' : 'You live here now.' }));
  const c = el('div.ph-card');
  if (l.rent) c.append(kv('Rent', money(l.rent) + ' / week'));
  if (l.price) c.append(kv('Buy', `${money(l.price)} (${money(l.down)} down)`), kv('Upkeep once owned', money(h.upkeepPerWeekOwned || 0) + ' / week'));
  c.append(kv('Utilities', money(sc.utilitiesPerWeek || 0) + ' / week'), kv('Size', `${sc.label || '?'} · ${(h.tiles || sc.tiles || []).join(' x ')} tiles · ${sc.furnitureSlots || '?'} furniture spots`),
    kv('Rooms', (h.rooms || []).map(r => r.name).join(', ')), kv('Guests', 'Up to ' + (h.maxGuests || 2)));
  b.append(c, section('Close by')); const d = el('div.ph-card');
  if (n.work) d.append(kv(n.work.name, walkText(n.work.m))); if (n.station) d.append(kv(n.station.name, walkText(n.station.m))); if (n.bus) d.append(kv('Bus: ' + n.bus.name, walkText(n.bus.m))); if (n.grocery) d.append(kv(n.grocery.name, walkText(n.grocery.m)));
  if (!d.firstChild) d.append(el('small.nl-dim', { text: 'Step outside once and the distances fill in.' })); b.append(d);
  if ((h.pros || []).length || (h.cons || []).length) b.append(section('Good and less good'), el('ul.nl-pc', null, (h.pros || []).map(t => el('li.pro', { text: t })), (h.cons || []).map(t => el('li.con', { text: t }))));
  if (h.perk) b.append(el('p.nl-perk', null, iconEl('ui.sparkle', 1), el('span', { text: 'Perk: ' + h.perk.desc })));
  if ((h.included || []).length) b.append(el('small.nl-dim', { text: 'Comes with: ' + h.included.map(i => (ITEM_BY_ID[i] && ITEM_BY_ID[i].name) || i).join(', ') + '.' }));
  ctx.foot.append(el('div.nl-acts', null, btn('Take me there', () => goTo(door(id) || 'home:' + id, ctx, h.name), '', 'ui.pin'),
    l.canRent ? btn('Rent', () => ctx.push('Rent ' + h.name, (bb, cc) => sheet(bb, cc, id, 'rent'), 'sheet'), 'pri') : null,
    l.canBuy ? btn('Buy', () => ctx.push('Buy ' + h.name, (bb, cc) => sheet(bb, cc, id, 'buy'), 'sheet'), 'gold') : null));
}
let term = 1;
function sheet(b, ctx, id, mode) {
  const l = safe(() => H().homes().find(x => x.id === id), null); if (!l) return; const h = l.home, sc = SIZE_CLASSES[h.sizeClass] || {}, cur = safe(() => H().current(), null), moving = !!(cur && cur.id && cur.id !== id);
  const eq = moving || !cur ? safe(() => H().equity(), 0) : 0, fee = moving ? MOVING.moveFee : 0, bal = balance(), lim = safe(() => G.money.limit, 0) || 0; b.classList.add('as-body');
  const first = el('div.ph-card'), week = el('div.ph-card'); let total = 0;
  if (mode === 'rent') { total = l.rent + fee; first.append(kv("First week's rent", money(l.rent))); week.append(kv('Rent', money(l.rent))); }
  else {
    const t = MORTGAGE.terms[term] || MORTGAGE.terms[0], w = mortWeekly(l, term); total = l.down + fee - eq;
    b.append(section('Mortgage term'), el('div.nl-filters', null, MORTGAGE.terms.map((tt, i) => chip(`${tt.weeks} weeks`, term === i ? 'on' : '', () => { term = i; ctx.refresh(); }))));
    first.append(kv('Down payment (20%)', money(l.down))); week.append(kv(`Mortgage, ${t.weeks} weeks`, money(w)), kv('Upkeep', money(h.upkeepPerWeekOwned || 0)));
    week.append(el('small.nl-dim', { text: `You repay ${money(Math.round((l.price - l.down) * (1 + t.fee)))} in all${t.fee ? ` (${Math.round(t.fee * 100)}% fee)` : ' (no fee)'}. Miss a week and the term just gets a week longer. Pay it off early any time at the bank app.` }));
  }
  if (fee) first.append(kv('Moving van', money(fee))); if (eq) first.append(kv(mode === 'rent' ? 'Sale of your old home (paid to you)' : 'Sale of your old home', '+' + money(eq)));
  first.append(kv('To pay today', money(Math.max(0, total)), 'tot'), kv('In the bank', money(bal)));
  week.append(kv('Utilities', money(sc.utilitiesPerWeek || 0)));
  b.append(section('First costs'), first, section('Every week (billed Monday)'), week, section('Your things'),
    el('p.as-desc', { text: moving ? `A van moves everything you own to ${h.name}. It arrives in boxes; unpack them and place things in Decorate mode. Furniture that came with your old place stays there.` : 'Anything you buy is delivered here in boxes. Unpack and place it in Decorate mode.' }));
  const can = bal - total >= lim;
  if (!can) b.append(el('p.nl-lock.big', null, iconEl('ui.coin', 1), `You need ${money(total - bal + lim)} more for this.`));
  ctx.foot.append(el('div.nl-acts', null, btn('Not now', () => ctx.back()), btn(mode === 'rent' ? `Sign the lease · ${money(total)}` : `Buy it · ${money(Math.max(0, total))}`, () => {
    const ok = safe(() => (mode === 'rent' ? H().rent(id) : H().buy(id, term)), false);
    if (ok) { dcache.clear(); safe(() => G.phone.notify({ app: 'homes', title: 'Nestly', text: `Keys to ${h.name} are yours. Your boxes are waiting inside.`, priority: 'low' }), 0); ctx.home(); G.phone.open('homes'); }
    else toast(can ? 'That did not go through.' : 'Not enough money for that yet.');
  }, mode === 'rent' ? 'pri' : 'gold')));
}

export function init() {
  injectCss(); if (!G.phone || !G.phone.registerApp) return;
  G.phone.registerApp(Object.assign(regDef('homes'), { render: list }));
  G.on('scene', () => dcache.clear()); G.on('job:hired', () => dcache.clear());
}
