// THE SYSTEMS SHELF — the live half of "How things work here" (owner msg 107, BIBLE 21.3). Cards: src/data/systems.js. Page: src/ui/phone_guide.js (Wander).
// For every game system: where the player stands in it right now (one line), ONE jump straight into it, and whether it is still "new to you".
//
// G.shelf = {
//   list() -> [{ id, group, name, icon, how: [2 lines], state: text, isNew: bool, jump: { label, icon } | null, tips: [first-time window ids], chips?: [{ label, id }] }]
//   get(id) -> one such card        groups() -> [{ id, name }]
//   jump(id, ctx?, chipId?) -> bool      do the card's button (opens its app, sets the arrow to its nearest place, or opens its screen). ctx = a phone app ctx when called
//                                         from inside the phone (optional).
//   touched(id) -> bool                  has the player used this system yet?        touch(id)   mark it used (other systems may call it)
//   open()                               open the shelf page in Wander
// }
// State G.state.shelf = { v: 1, t: { systemId: 1 } }.  Old saves: no slice -> what the save shows the player has done is marked used on load (infer()).
// Event: 'shelf:touch'(id) the first time a system is used.
import { G } from '../core/game.js';
import { SYSTEMS, SYSTEM_BY_ID, SYSTEM_GROUPS, BIG_PLACES } from '../data/systems.js';
import { NEEDS } from '../data/needs.js';
import { RECIPES } from '../data/items.js';
import { WINDOWS } from '../data/firsttime.js';
import { toast } from '../ui/kit.js';
import { cityPos } from '../ui/phone_util.js';
import '../art/icons/systems.js';

export const order = 134;
const DAY = 1440, WALK = .215;
const safe = (f, d) => { try { const v = f(); return v === undefined || v === null ? d : v; } catch (e) { return d; } };
const S = () => { let s = G.state.shelf; if (!s || typeof s !== 'object') s = G.state.shelf = { v: 1, t: {} }; s.t = s.t || {}; return s; };
const NEED_NAME = Object.fromEntries(NEEDS.map(n => [n.id, n.name]));
const WD = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const hh = t => { const m = ((Math.round(t) % DAY) + DAY) % DAY; return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
const whenText = t => { const d = Math.floor(t / DAY) - Math.floor(G.state.t / DAY); return (d <= 0 ? 'today' : d === 1 ? 'tomorrow' : WD[Math.floor(t / DAY) % 7]) + ' ' + hh(t); };
const plural = (n, one, many) => `${n} ${n === 1 ? one : many || one + 's'}`;
const fmt = n => safe(() => G.money.fmt(n), '$' + n);
const walkMin = p => { const c = cityPos(); return Math.max(1, Math.round((Math.abs(p.x - c.x) + Math.abs(p.y - c.y)) * WALK)); };
const homeId = () => safe(() => G.housing.current().id, null);
const atHome = () => safe(() => G.housing.isHome(G.scene.id), false);
const homePlace = () => { const h = homeId(); return h ? safe(() => G.places.get('home:' + h), null) : null; };

/* ---------- finding places ---------- */
/** nearest guidebook place whose type / title matches; open ones first */
export function nearestPlace(re, filter) {
  const L = safe(() => G.guide.all(), []).filter(e => e.kind === 'place' && e.placeId && isFinite(e.x) && re.test(e.type + ' ' + e.title) && (!filter || filter(e)));
  const c = cityPos(), d = e => Math.abs(e.x - c.x) + Math.abs(e.y - c.y), op = e => (safe(() => G.guide.openNow(e).open, null) === false ? 1 : 0);
  return L.sort((a, b) => op(a) - op(b) || d(a) - d(b))[0] || null;
}
const navFirst = kind => safe(() => G.nav.find(kind, 3).find(q => q.open !== false) || G.nav.find(kind, 1)[0], null);
const nearText = e => (e ? `Nearest: ${e.title || e.name}, ${walkMin(e)} min walk` : '');

/* ---------- doing a jump ---------- */
let CTX = null;
const closePhone = () => { if (CTX && CTX.close) CTX.close(); else safe(() => G.phone.close()); };
function app(id, arg) {
  if (safe(() => G.apps.hides(id), false)) { const a = safe(() => G.apps.get(id), null); if (a && a.released) { toast(`${a.name} is free on Appy. Install it and it is yours.`, 'info', 3200); return !!G.phone.open('store', { app: id }) || true; } return false; }
  if (!safe(() => G.phone.isUnlocked(id), false)) return false;
  G.phone.open(id, arg); return true;
}
const hasApp = id => !safe(() => G.apps.hides(id), false) && safe(() => G.phone.isUnlocked(id), false);
function route(dest, name, sel) {
  if (!dest) { toast('Not sure where that is yet. Try the Map.'); return false; }
  safe(() => G.navGoals.select(sel || null));
  const d = typeof dest === 'string' ? dest : dest.placeId && safe(() => G.places.get(dest.placeId), null) ? dest.placeId : dest.id && typeof dest.id === 'string' && safe(() => G.places.get(dest.id), null) ? dest.id : { x: dest.x, y: dest.y, name: name || dest.name || dest.title || 'There' };
  if (safe(() => G.phone.routeTo(d), false)) return true;
  safe(() => G.phone.setWaypoint(d)); closePhone(); toast(`Follow the arrow${name ? ' to ' + name : ''}.`, 'good', 3000); return true;
}
function goHome(then, label) {
  if (atHome()) { closePhone(); if (then) setTimeout(() => safe(then), 250); return true; }
  const p = homePlace(); if (!p) { toast('You have no home yet.'); return false; }
  toast(label || 'That happens at home. Here is the way.', 'info', 3000); return route(p.id, 'home');
}
let pinT = 0;
const unpin = () => { if (pinT) { clearTimeout(pinT); pinT = 0; safe(() => G.navGoals.clear()); } };
/* point the arrow at a thing in this room for a little while (it clears itself when you get there, leave the room, or after 40 s) */
const pointAt = (find, label) => safe(() => { unpin(); G.navGoals.set({ room: G.scene.id.replace(/^int:/, ''), find, label, near: 1.6 }); pinT = setTimeout(unpin, 40000); }, 0);

/* ---------- the live part of every card: st() = your state, jump() = { label, icon, run }, seen() = inferred from the save ---------- */
const skillRows = () => safe(() => G.skills.defs.map(d => ({ d, l: G.skills.level(d.id), x: G.skills.xp(d.id) })), []);
const coachNow = () => { const c = cityPos(); return safe(() => G.skillplay.coaches().filter(q => q.here && !q.doneToday && isFinite(q.x)).sort((a, b) => Math.abs(a.x - c.x) + Math.abs(a.y - c.y) - Math.abs(b.x - c.x) - Math.abs(b.y - c.y))[0], null); };
const bigVisits = id => safe(() => (id === 'museum' || id === 'aquarium' ? G.state[id].visits : G.state[id].visits) || 0, 0) || safe(() => G.state.traits.visits[id], 0) || 0;
const nextBig = () => { const c = cityPos(), L = BIG_PLACES.map(([id, name]) => ({ id, name, p: safe(() => G.places.get(id), null), v: bigVisits(id) })).filter(b => b.p); const d = b => Math.abs(b.p.x - c.x) + Math.abs(b.p.y - c.y);
  return L.filter(b => !b.v).sort((a, b) => d(a) - d(b))[0] || L.sort((a, b) => d(a) - d(b))[0] || null; };
const funApps = () => ['pages', 'reel', 'playbox'].filter(hasApp);
const LIVE = {
  needs: { st() { const a = safe(() => G.needs.all(), {}), k = Object.keys(a).sort((x, y) => a[x] - a[y])[0]; return k ? `Lowest just now: ${NEED_NAME[k] || k} ${Math.round(a[k])}` : ''; },
    jump: () => ({ label: 'Open Wellness', icon: 'ui.heart', run: () => app('wellness') }), seen: () => G.state.t > DAY + 600 },
  skills: { st() { const R = skillRows().filter(r => r.x > 0), b = R.slice().sort((x, y) => y.l - x.l || y.x - x.x)[0], n = safe(() => G.skills.interests().length, 0);
      return (R.length ? `${plural(R.length, 'skill')} started` + (b && b.l ? `, best: ${b.d.name} ${b.l}` : '') : 'Nothing practised yet') + ` · ${n ? plural(n, 'interest') : 'no interests picked'}`; },
    jump: () => ({ label: 'Open Me: skills', icon: 'app.me', run: () => app('me', { tab: 'skills' }) }), seen: () => skillRows().some(r => r.x > 0) },
  traits: { st() { const L = safe(() => G.traits.list().map(t => t.name), []); return L.length ? L.slice(0, 4).join(', ') : 'None picked yet'; },
    jump: () => ({ label: 'Open Me: traits', icon: 'app.me', run: () => app('me', { tab: 'traits' }) }), seen: () => safe(() => G.traits.picked().length, 0) > 0 },
  coaches: { st() { const c = coachNow(), n = safe(() => Object.keys(G.state.skillplay.best).length, 0); return c ? `${c.short || c.name} is out now (${c.role.toLowerCase()}), ${walkMin(c)} min walk` : n ? `${plural(n, 'game')} played so far` : 'No coach is out just now'; },
    jump() { const c = coachNow(); return c ? { label: `Take me to ${c.short || c.name}`, icon: 'ui.pin', run: () => route({ x: c.x, y: c.y, name: c.short || c.name }, c.short || c.name) } : { label: 'See the coaches in Me', icon: 'app.me', run: () => app('me', { tab: 'me' }) }; },
    seen: () => safe(() => Object.keys(G.state.skillplay.best).length + Object.keys(G.state.skillplay.coach).length, 0) > 0 },
  closet: { st() { const n = safe(() => G.wardrobe.pieces().length + G.wardrobe.owned().length, 0), d = safe(() => G.wardrobe.byState(2).length + G.wardrobe.byState(3).length, 0); return `${plural(n, 'thing')} to wear` + (d ? `, ${d} to wash` : ''); },
    jump: () => (hasApp('closet') || safe(() => G.apps.get('closet').released, false) ? { label: 'Open Closet', icon: 'app.closet', run: () => app('closet') } : { label: 'To my dresser', icon: 'ui.pin', run: () => goHome(() => pointAt(/dresser|wardrobe|closet/i, 'Your dresser'), 'Your dresser is at home. Here is the way.') }),
    seen: () => safe(() => G.wardrobe.pieces().length, 0) > 0 },
  clothesshop: { st: () => nearText(nearestPlace(/Clothing|Boutique|Thrift/)), jump() { const e = nearestPlace(/Clothing|Boutique|Thrift/); return e ? { label: `Take me to ${e.title}`, icon: 'ui.pin', run: () => route(e, e.title) } : null; },
    seen: () => safe(() => G.wardrobe.pieces().length, 0) > 0 },
  laundry: { st() { const h = safe(() => G.laundry.hamper().length, 0), l = safe(() => G.laundry.loads().length, 0), s = safe(() => G.laundry.status()[0].text, ''); return l && s ? s : h ? `${plural(h, 'thing')} in the hamper` : 'Nothing to wash'; },
    jump() { const e = nearestPlace(/Laundromat/); return e ? { label: `Take me to ${e.title}`, icon: 'ui.pin', run: () => route(e, e.title) } : null; }, seen: () => safe(() => G.state.laundry.n + (G.state.laundry.done || 0), 0) > 0 },
  hair: { st() { const d = safe(() => G.hair.daysSince(), 0), cut = safe(() => G.state.hair.hist.length, 0); return safe(() => G.hair.shaggy(), false) ? 'Getting shaggy' : cut ? `Last cut ${d === 0 ? 'today' : plural(d, 'day') + ' ago'}` : 'Still the hair you arrived with'; },
    jump() { const e = nearestPlace(/Barber|Salon|Nail studio/, x => !/Nail/.test(x.type) || true); return e ? { label: `Take me to ${e.title}`, icon: 'ui.pin', run: () => route(e, e.title) } : null; }, seen: () => safe(() => G.state.hair.hist.length, 0) > 0 },
  bag: { st: () => { const n = safe(() => G.inv.items().length, 0), c = safe(() => G.inv.capacity, 12); return n ? `${n} of ${c} pockets in use` : 'Empty'; },
    jump: () => ({ label: 'Open my backpack', icon: 'ui.backpack', run: () => { closePhone(); setTimeout(() => safe(() => G.inv.open()), 250); return true; } }), seen: () => G.state.t > DAY + 600 },
  cooking: { st() { const k = safe(() => G.cooking.known().length, 0), c = safe(() => Object.keys(G.state.needsx.cooked).length, 0); return `${k} of ${RECIPES.length} recipes` + (c ? `, ${c} cooked` : ', none cooked yet'); },
    jump: () => (atHome() ? { label: 'Show me my stove', icon: 'ui.pin', run: () => goHome(() => pointAt(/^cook\b|stove|cooker/i, 'Your stove: tap it to cook')) } : { label: 'Take me to my kitchen', icon: 'ui.pin', run: () => goHome(null, 'Your stove is at home. Here is the way.') }),
    seen: () => safe(() => Object.keys(G.state.needsx.cooked).length, 0) > 0 },
  groceries: { st() { const n = safe(() => G.inv.fridge.items().length, 0); return n ? `${plural(n, 'thing')} in your fridge` : 'Your fridge is empty'; },
    jump() { const q = navFirst('groceries'); return q ? { label: `Take me to ${String(q.name).replace(/ \(.*\)$/, '')}`, icon: 'ui.pin', run: () => route(q, q.name) } : null; }, seen: () => safe(() => G.inv.fridge.items().length, 0) > 0 || LIVE.cooking.seen() },
  eatout: { st() { const n = safe(() => Object.keys(G.state.needsx.tried).length, 0); return n ? `${plural(n, 'dish', 'dishes')} tried so far` : 'Nothing tried yet'; },
    jump() { const q = navFirst('food'); return q ? { label: `Take me to ${String(q.name).replace(/ \(.*\)$/, '')}`, icon: 'ui.pin', run: () => route(q, q.name) } : null; }, seen: () => safe(() => Object.keys(G.state.needsx.tried).length, 0) > 0 },
  decor: { st() { const c = safe(() => Math.round(G.needsExtra.homeComfort()), null), n = safe(() => G.housing.items().length, 0); return homeId() ? `${plural(n, 'piece')} at home` + (c !== null ? ` · Comfort settles at ${c}` : '') : 'No home yet'; },
    jump: () => (atHome() ? { label: 'Open Decorate', icon: 'sys.decor', run: () => goHome(() => G.furnish.open()) } : { label: 'Take me home to decorate', icon: 'ui.pin', run: () => goHome(null, 'Decorate is a button on screen while you are at home. Here is the way.') }),
    seen: () => safe(() => G.state.orders.ships.length, 0) > 0 || !!S().t.decor },
  roomy: { st() { const n = safe(() => G.orders.active().length, 0), c = safe(() => G.orders.cart().length, 0), b = safe(() => G.housing.boxes().length, 0); return n ? `${plural(n, 'parcel')} on the way` : b ? `${plural(b, 'box', 'boxes')} to unpack at home` : c ? `${plural(c, 'thing')} in your cart` : 'Nothing on order'; },
    jump: () => (hasApp('roomy') || safe(() => G.apps.get('roomy').released, false) ? { label: 'Open Roomy', icon: 'sys.parcel', run: () => app('roomy') } : atHome() ? { label: 'Open the shop in Decorate', icon: 'sys.decor', run: () => goHome(() => G.furnish.open({ tab: 'shop' })) } : { label: 'Take me home to try pieces', icon: 'ui.pin', run: () => goHome(null, 'At home, Decorate has a Shop tab where you can try any piece in your room.') }),
    seen: () => safe(() => G.state.orders.ships.length, 0) > 0 },
  furniture: { st() { const s = nearStore(); return s ? `Nearest: ${s.name}, ${walkMin(s)} min walk` : ''; },
    jump() { const s = nearStore(); return s ? { label: `Take me to ${s.short || s.name}`, icon: 'ui.pin', run: () => route(s.id, s.name) } : null; }, seen: () => safe(() => Object.keys(G.state.goods.seen || G.state.goods.visits || {}).length, 0) > 0 },
  house: { st() { const l = safe(() => G.supplies.low().length, 0), c = safe(() => G.supplies.cleanLabel(), ''); return homeId() ? [c ? `Your home is ${String(c).toLowerCase()}` : '', l ? `${plural(l, 'thing')} running low` : 'cupboard stocked'].filter(Boolean).join(' · ') : 'No home yet'; },
    jump: () => (atHome() ? { label: 'Look in the cupboard', icon: 'ui.supplies', run: () => goHome(() => G.supplies.open()) } : { label: 'Take me home', icon: 'ui.pin', run: () => goHome() }), seen: () => G.state.t > 3 * DAY },
  homes: { st() { const h = safe(() => G.housing.current(), null); if (!h) return 'No home yet'; const def = Object.assign({}, h.home, safe(() => G.housing.homes().find(x => x.id === h.id), null)), own = !!h.owned; return `${def.name || 'Your home'} · ${own ? 'yours' : 'renting' + (def.rent ? ' at ' + fmt(def.rent) + ' a week' : '')}`; },
    jump: () => (hasApp('homes') || safe(() => G.apps.get('homes').released, false) ? { label: 'Open Nestly', icon: 'ui.key', run: () => app('homes') } : { label: 'Take me to Bay Realty', icon: 'ui.pin', run: () => route('bank', 'Bay Realty & Trust') }), seen: () => !!S().t.homes },
  jobs: { st() { const j = safe(() => G.jobs.current(), null); return j ? `${j.title}${j.venueName ? ' at ' + j.venueName : ''}` + (j.onShift ? ' · on shift now' : j.nextShift ? ' · next shift ' + whenText(j.nextShift) : '') : 'No job yet'; },
    jump: () => ({ label: 'Open Jobs', icon: 'app.jobs', run: () => app('jobs') }), seen: () => !!safe(() => G.state.jobs.job || Object.keys(G.state.jobs.history).length, 0) },
  money: { st() { const b = safe(() => G.money.bills(), null); return `${fmt(safe(() => G.money.get(), 0))} in the bank` + (b ? ` · ${fmt(b.total)} due ${whenText(b.dueT).replace(/ \d\d:\d\d$/, '')}` : ''); },
    jump: () => ({ label: 'Open Bay Bank', icon: 'ui.coin', run: () => app('bank') }), seen: () => G.state.t > 7 * DAY },
  opps: { st() { const L = safe(() => G.opps.list(), []), o = L.filter(x => x.st === 0).length, a = L.filter(x => x.st === 1).length, d = safe(() => G.opps.stats().done, 0); return o || a ? [o ? `${o} on offer` : '', a ? `${a} taken up` : ''].filter(Boolean).join(', ') : d ? `${d} done so far. More will come.` : 'None yet. They turn up as you go about.'; },
    jump: () => ({ label: 'Open Opportunities', icon: 'app.opps', run: () => app('opps') }), seen: () => safe(() => G.opps.stats().accepted + G.opps.stats().done, 0) > 0 },
  university: { st() { const e = safe(() => G.university.enrolled(), []), c = safe(() => Object.keys(G.university.certs()).length, 0), n = safe(() => G.university.courses().length, 0); return e.length ? `Enrolled: ${e.map(id => safe(() => G.university.courses().find(q => q.id === id).name, id)).join(', ')}` : c ? `${plural(c, 'certificate')} earned` : `Not enrolled · ${n} courses on offer`; },
    jump: () => (hasApp('campus') && safe(() => G.university.enrolled().length, 0) ? { label: 'Open Campus', icon: 'myday.class', run: () => app('campus') } : { label: 'Take me to the University', icon: 'ui.pin', run: () => route('university', 'the University') }), seen: () => safe(() => G.university.stats().visits, 0) > 0 },
  chapters: { st() { const r = safe(() => G.chapters.row(), null), n = safe(() => G.chapters.list().filter(c => c.state === 'done').length, 0); return r ? `${r.text || r.title}: ${r.state === 'waiting' ? 'no hurry, it will come' : r.state === 'running' ? 'you are in it' : "whenever you're ready"}` : n ? `${plural(n, 'Chapter')} told so far. The next will come.` : 'It begins once you have settled in.'; },
    jump: () => ({ label: 'Show me where it starts', icon: 'sys.chapter', run() { const r = safe(() => G.chapters.row(), null), mk = safe(() => G.chapters.marker(), null), pl = (r && r.place) || (mk ? { x: mk.x, y: mk.y, name: mk.label } : null);
      if (pl && r && /open|paused/.test(r.state || '')) { safe(() => G.phone.setWaypoint({ id: null, name: pl.name || r.title, x: pl.x, y: pl.y })); closePhone(); toast('Follow the gold marker. No rush.', 'good', 2800); return true; }
      toast(r ? (r.state === 'waiting' ? (r.waiting || 'No hurry. The next Chapter will come.') : r.hook || "Whenever you're ready.") : 'Nothing to start just now. It will come to you.', 'info', 3600); return false; } }),
    seen: () => safe(() => G.chapters.list().some(c => c.state === 'done'), false) },
  friends: { st() { const k = safe(() => G.social.known(), []), f = k.filter(id => safe(() => G.social.tierInfo(id).idx, 0) >= 2 && !safe(() => G.social.isFamily(id), false)).length, fam = k.filter(id => safe(() => G.social.isFamily(id), false)).length; return `${plural(k.length, 'person', 'people')} you know · ${fam} family, ${plural(f, 'friend')}`; },
    jump: () => (hasApp('friends') ? { label: 'Open Circle', icon: 'rel.friend', run: () => app('friends') } : { label: 'Open Messages: people', icon: 'ui.speech', run: () => app('messages', { tab: 'people' }) }), seen: () => safe(() => G.social.known().length, 0) > 8 },
  messages: { st() { const u = safe(() => G.messages.unread(), 0), n = safe(() => G.messages.threads().length, 0); return u ? `${u} unread` : `${plural(n, 'conversation')}, all read`; },
    jump: () => ({ label: 'Open Messages', icon: 'ui.speech', run: () => app('messages') }), seen: () => G.state.t > DAY },
  post: { st() { const w = safe(() => G.post.waiting('home').length, 0), p = safe(() => G.post.parcels().length, 0), o = safe(() => G.post.out().length, 0); return w || p || o ? [w ? `${plural(w, 'letter')} waiting at home` : '', p ? `${plural(p, 'parcel')} coming` : '', o ? `${o} on its way out` : ''].filter(Boolean).join(', ') : 'No post just now'; },
    jump() { const o = safe(() => G.post.nearest(), null); return o ? { label: `Take me to the ${o.short || 'post office'}`.replace(/the the /i, 'the '), icon: 'ui.pin', run: () => route(o.room && safe(() => G.places.get(o.room), null) ? o.room : { x: o.x, y: o.y, name: o.name }, o.name) } : null; },
    seen: () => safe(() => G.post.mail().length, 0) > 0 },
  myday: { st() { const sc = safe(() => G.myDay.schedule(), null); if (!sc) return ''; const n = sc.today.length + sc.flex.length; return sc.next ? `Next: ${sc.next.flex ? '' : hh(sc.next.t) + ' '}${sc.next.title}` : n ? `${n} on your day` : 'Nothing on your day yet'; },
    jump: () => ({ label: 'Open My Day', icon: 'myday.btn', run: () => { closePhone(); setTimeout(() => safe(() => G.myDay.open()), 250); return true; } }), seen: () => safe(() => G.myDay.state().seen, 0) > 0 },
  map: { st() { const L = safe(() => G.guide.all().filter(e => e.kind === 'place' && !e.parent), []), k = L.filter(e => safe(() => G.guide.known(e), false)).length; return L.length ? `${k} of ${L.length} places found` : ''; },
    jump: () => ({ label: 'Open the Map', icon: 'sys.map', run: () => app('map') }), seen: () => G.state.t > DAY },
  transit: { st() { const r = safe(() => G.state.transit.rides, {}), b = (r.bus || 0), t = safe(() => G.state.rail.rides, 0) || r.train || 0, pass = safe(() => G.transit.hasPass(), false); return (pass ? 'You hold a pass · ' : '') + (b || t ? `${plural(b, 'bus ride')}, ${plural(t, 'train ride')}` : 'Not ridden yet'); },
    jump() { const q = navFirst('transit'); return q ? { label: `Take me to ${String(q.name).replace(/ \(.*\)$/, '')}`, icon: 'ui.pin', run: () => route(q, q.name) } : null; }, seen: () => safe(() => (G.state.transit.rides.bus || 0) + (G.state.rail.rides || 0), 0) > 0 },
  cab: { st() { const n = safe(() => G.state.transit.rides.taxi, 0); return n ? `${plural(n, 'ride')} so far` : 'Not used yet'; }, jump: () => ({ label: 'Open MapleCab', icon: 'transport.taxi', run: () => app('taxi') }), seen: () => safe(() => G.state.transit.rides.taxi, 0) > 0 },
  shows: { st() { const d = Math.floor(G.state.t / DAY), L = safe(() => G.guide.whatsOn().filter(o => o.kind === 'show' && o.day === d && o.t > G.state.t), []); return L.length ? `${plural(L.length, 'showing')} still to come today, next: ${L[0].title} ${L[0].clock}` : 'Nothing more today. See the week.'; },
    jump: () => (hasApp('showtime') ? { label: 'Open Showtime', icon: 'myday.film', run: () => app('showtime') } : { label: "See what's on", icon: 'ui.calendar', run: () => app('guide', { tab: 'whatson' }) }), seen: () => safe(() => Object.keys(G.state.shows.seen || G.state.shows.log || {}).length, 0) > 0 },
  sights: { st() { const v = BIG_PLACES.filter(([id]) => bigVisits(id) > 0).length; return `${v} of ${BIG_PLACES.length} visited`; },
    jump() { const b = nextBig(); return b ? { label: `Take me to the ${b.name}`, icon: 'ui.pin', run: () => route(b.id, b.name) } : null; },
    chips: () => BIG_PLACES.filter(([id]) => safe(() => G.places.get(id), null)).map(([id, name]) => ({ id, label: name, done: bigVisits(id) > 0 })),
    chip: id => route(id, (BIG_PLACES.find(b => b[0] === id) || [])[1]), seen: () => BIG_PLACES.some(([id]) => bigVisits(id) > 0) },
  events: { st() { const live = safe(() => G.cityEvents.live(), null), n = safe(() => G.cityEvents.next(), null), d = n ? n.day - Math.floor(G.state.t / DAY) : 0; return live ? `${live.name} is on right now` : n ? `Next: ${n.name}, ${d <= 0 ? 'today' : d === 1 ? 'tomorrow' : 'in ' + d + ' days'}` : ''; },
    jump() { const live = safe(() => G.cityEvents.live(), null); return live ? { label: `Take me to the ${live.name}`, icon: 'ui.pin', run: () => route('cev:' + live.id, live.name) } : { label: "See what's on", icon: 'ui.calendar', run: () => app('guide', { tab: 'whatson' }) }; },
    seen: () => !!S().t.events },
  weather: { st() { const w = safe(() => G.weather.current(), null), n = G.now(); return w ? `${w.name}, ${w.tempC}°C · ${n.seasonName}, day ${n.dayOfMonth} of 14` : ''; },
    jump: () => (hasApp('weather') || safe(() => G.apps.get('weather').released, false) ? { label: 'Open Skies', icon: 'weather.partly', run: () => app('weather') } : { label: 'What is tomorrow like?', icon: 'weather.partly', run() { const f = safe(() => G.weather.daySummary(1), null); toast(f ? `Tomorrow: ${f.name}, up to ${f.hiC}°C. The Skies app will be on Appy in a day or two.` : 'Hard to say.', 'info', 4200); return true; } }),
    seen: () => G.state.t > 2 * DAY },
  stamps: { st() { const s = safe(() => G.guide.stats(), null); return s ? `${s.stamped} of ${s.stamps} stamps` : ''; }, jump: () => ({ label: 'Open the Stamp Book', icon: 'ui.star', run: () => app('guide', { tab: 'stamps' }) }), seen: () => safe(() => G.guide.stats().stamped, 0) > 2 },
  phonefun: { st() { const A = funApps(), nm = { pages: 'Pages', reel: 'Reel', playbox: 'PlayBox' }; return A.length ? `On your phone: ${A.map(a => nm[a]).join(', ')}` : 'Not on your phone yet. They come out on Appy in your first days.'; },
    jump() { const A = funApps(), nm = { pages: 'Pages', reel: 'Reel', playbox: 'PlayBox' }; if (A.length) return { label: `Open ${nm[A[0]]}`, icon: 'app.' + A[0], run: () => app(A[0]) }; const r = ['pages', 'reel', 'playbox'].find(a => safe(() => G.apps.get(a).released, false)); return r ? { label: `Get ${nm[r]} on Appy`, icon: 'ui.phone', run: () => app(r) } : { label: 'Open Appy', icon: 'ui.phone', run: () => app('store') }; },
    seen: () => safe(() => G.media.stats().minutes || G.media.pool().minutes, 0) > 0 },
  appy: { st() { const C = safe(() => G.apps.catalog(), []), i = C.filter(a => a.installed).length, n = C.filter(a => a.released && !a.installed && !a.soon).length; return `${plural(i, 'app')} on your phone` + (n ? `, ${n} new to get` : ''); },
    jump: () => ({ label: 'Open Appy', icon: 'ui.phone', run: () => app('store') }), seen: () => !!S().t.appy },
};
function nearStore() { const c = cityPos(), L = safe(() => G.goods.stores(), []).filter(s => isFinite(s.x)); return L.sort((a, b) => (a.open === false ? 1 : 0) - (b.open === false ? 1 : 0) || Math.abs(a.x - c.x) + Math.abs(a.y - c.y) - Math.abs(b.x - c.x) - Math.abs(b.y - c.y))[0] || null; }

/* ---------- touched / new to you ---------- */
export function touch(id) { const s = S(); if (!SYSTEM_BY_ID[id] || s.t[id]) return; s.t[id] = 1; G.emit('shelf:touch', id); }
export const touched = id => !!S().t[id];
function infer() { for (const c of SYSTEMS) if (!S().t[c.id] && safe(() => LIVE[c.id].seen(), false)) S().t[c.id] = 1; }
const APP_SYS = { wellness: 'needs', me: 'skills', closet: 'closet', jobs: 'jobs', bank: 'money', wallet: 'money', opps: 'opps', campus: 'university', friends: 'friends', messages: 'messages', post: 'post', planner: 'myday', map: 'map', transit: 'transit', taxi: 'cab',
  showtime: 'shows', weather: 'weather', pages: 'phonefun', reel: 'phonefun', playbox: 'phonefun', store: 'appy', roomy: 'roomy', homes: 'homes' };
const EV_SYS = { 'needs:low': 'needs', 'skill:up': 'skills', 'trait:set': 'traits', 'minigame:done': 'coaches', 'coach:lesson': 'coaches', 'wardrobe:open': 'closet', 'wardrobe:fitting': 'clothesshop', 'wardrobe:buy': 'clothesshop', 'laundry:start': 'laundry',
  'hair:cut': 'hair', 'hair:change': 'hair', 'inv:use': 'bag', cooked: 'cooking', 'fridge:stored': 'groceries', 'home:furnish': 'decor', 'order:placed': 'roomy', 'goods:visit': 'furniture', 'goods:buy': 'furniture', 'home:clean': 'house', 'home:view': 'homes',
  'job:hired': 'jobs', 'bills:due': 'money', 'opp:accept': 'opps', 'university:visit': 'university', 'chapter:start': 'chapters', 'social:talk': 'friends', 'msg:reply': 'messages', 'post:visit': 'post', 'post:read': 'post', 'myday:open': 'myday',
  'nav:start': 'map', 'show:ticket': 'shows', 'cityevent:join': 'events', 'guide:stamp': 'stamps', 'media:session': 'phonefun', 'app:installed': 'appy', 'hotel:meal': 'eatout' };

/* ---------- API ---------- */
const TIPS_OF = {}; for (const w of WINDOWS) if (w.sys) (TIPS_OF[w.sys] = TIPS_OF[w.sys] || []).push(w.id);
export function get(id) {
  const c = SYSTEM_BY_ID[id], L = LIVE[id]; if (!c || !L) return null; const j = safe(() => L.jump(), null);
  return { id, group: c.group, name: c.name, icon: c.icon, how: c.how, state: safe(() => L.st(), '') || '', isNew: !touched(id), jump: j ? { label: j.label, icon: j.icon || 'ui.pin' } : null, tips: TIPS_OF[id] || [], chips: L.chips ? safe(() => L.chips(), []) : null };
}
export const list = () => SYSTEMS.map(c => get(c.id)).filter(Boolean);
export function jump(id, ctx, chipId) {
  const L = LIVE[id]; if (!L) return false; CTX = ctx || null;
  try { if (chipId && L.chip) return !!L.chip(chipId); const j = L.jump(); if (!j) { toast('Nothing to show for that just now.'); return false; } const ok = j.run(); if (ok === false && !document.querySelector('#toasts .toast')) toast('That is not on your phone yet. It will come.', 'info', 3000); if (ok !== false && /^(Open|See|Look|What)/.test(j.label)) touch(id); return ok !== false; }
  catch (e) { console.warn('shelf.jump', id, e); return false; } finally { CTX = null; }
}
export function init() {
  G.defineState('shelf', () => ({ v: 1, t: {} }));
  G.shelf = { list, get, jump, touched, touch, groups: () => SYSTEM_GROUPS.slice(), nearestPlace, open: () => safe(() => G.phone.open('guide', { tab: 'systems' })) };
  for (const ev in EV_SYS) G.on(ev, (...a) => { if (ev === 'minigame:done' && a[0] && a[0].auto) return; touch(EV_SYS[ev]); });
  G.on('phone:app', id => { if (APP_SYS[id] && safe(() => !!G.state.flags.introDone, true)) touch(APP_SYS[id]); if (id === 'me') touch('traits'); });
  G.on('ride:end', k => touch(k === 'taxi' || k === 'cab' ? 'cab' : /bus|train|rail/.test(k) ? 'transit' : 'map'));
  G.on('shop:buy', (item, q, venue) => { const v = String(venue || ''); if (/grocer|market|corner|deli|bakery/i.test(v + ' ' + safe(() => G.places.get(v).name, ''))) touch('groceries'); });
  G.on('shop:open', v => { const e = safe(() => G.guide.all().find(x => x.placeId === v), null); if (e && e.chapter === 'eat') touch('eatout'); });
  for (const [id] of BIG_PLACES) G.on(id + ':visit', () => touch('sights'));
  G.on('home:move', (id, prev) => { if (prev) touch('homes'); });
  G.on('weather', k => { if (/rain|storm|snow/.test(k) && G.state.t > DAY) touch('weather'); });
  G.on('scene', unpin); G.on('navgoal:done', () => { if (pinT) { clearTimeout(pinT); pinT = 0; } });
  G.on('load', () => { const fresh = !G.state.shelf || !Object.keys(G.state.shelf.t || {}).length; S(); if (fresh) infer(); });
  G.on('game:start', () => { if (!Object.keys(S().t).length) infer(); });
}
