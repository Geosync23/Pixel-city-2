// Maple Bay Post — post offices and the mail (order 56.7: after City Hall, before lobbies / places / stalls). Nothing in the world files is touched.
// Rooms: scenes/rooms/post.js (`post_main` hall, `post_sort` sorting gallery, fixture handlers), post_branches.js (`post_maplewood`, `post_hillcrest`, `post_harbor`, `post_downtown`), post_views.js (pictures).
// Data: data/post.js. Letters: story/letters.js. Art: art/showpiece/post.js, post_ext.js, _post_lib.js, _post_icons.js. App: ui/phone_post.js ("Maple Post", id `post`).
//
// City (once per city world, all runtime): door pois `door:post_main` on the existing bld.civic.postoffice (Old Town) and `door:post_maplewood` (a cottage), `door:post_hillcrest` (a gabled house),
//   `door:post_harbor` (the quay boathouse), `door:post_downtown` (the Visitor Info pavilion); scene ENTITIES (not world objects): a blue pillar box + a hanging sign at every office, five mail carriers who walk
//   a round of the nearest street mailboxes 07:30 - 11:30 on delivery days, Ada and the Captain on the quay after the chain. Every existing `prop.street.mailbox` (110) becomes "Mailbox: post a letter".
//   Home: a mail basket by your own front door (placed when the home room is built). Lobbies: the mailbox wall gets "Post your letters" while you carry any.
// Hours: General Post Office Mon - Fri 08 - 18 (Thu until 20), Sat 09 - 14; branches Mon - Fri 09 - 17, Sat 09 - 12:30 (harbor 08 - 16 / 08 - 12; downtown counter Mon - Sat 09 - 18). Sundays + holidays closed, no delivery.
// THE MAIL MODEL
//   Letters / postcards: write at any post-office desk (free) or at your mail basket (Writing Paper) -> a Sealed Letter in the bag -> one stamp each -> post in ANY box (street, pillar, counter, lobby, home basket).
//     Collected 17:00. In town: delivered next morning. Home town: two mornings later. The answer comes 3 - 4 days after that, written by that person about what you said and sent.
//   Parcels: packing table (pick things from the backpack; box S 2 / M 5 / L 9 units; wrap it: three strips of tape) -> a Wrapped Parcel -> the counter (take a number at the G.P.O., stand in line at a branch)
//     -> weighed on the scale -> Standard 3 days / Express 2 / Overnight 1 (in town: next morning / same day). Price = (box base + 1.50 per started kg) x speed (x 0.6 in town). To family, to friends, or to yourself.
//   Incoming: the round is 09:30 Mon - Sat. Post lands in the basket by your door (or your rented P.O. box); small parcels arrive at home as delivery boxes (housing flow) at 11:00,
//     big ones need you in: if you are out you get a pink Collection Slip for your nearest office. Junk, flyers with real coupons, the weekly paper bill and catalogues come too.
// G.post = {
//   offices() -> [{ key, room, name, short, x, y, open, hours, master }], office(keyOrRoom), nearest(x?, y?) -> office, isOpen(key), enter(key), arrived(key, scene, prev), look() -> { box, boxMail, wall, comm },
//   queue: { state() -> { serving, win, ticket, ahead, called, mine }, take() -> ticket | null, canServe() }, takeNumber(scene), wait(fx, scene), window(n, scene), counter(scene), service(key, scene, kinds?),
//   stamps: { owned() -> { id: n }, count(), album() -> { id: day }, onSale(key) -> [stamp], buy(id, n = 1, key?) -> bool, use() -> id | null }, philately(scene), covers() ,
//   compose(opts) (UI), write({ to, kind: 'letter' | 'card', tone, topics: [..], card? }) -> held letter | null, held() -> [..], recipients() -> [{ id, name, type: 'home' | 'npc' | 'self' | 'keeper' }],
//   postLetters(where) -> n posted, desk(fx, scene), pack(fx, scene) (UI), packItems([{ id, qty }], wrap 0-3) -> packed | null, packed(), unpack() (take the things out again), wrapGame() -> Promise<0-3>,
//   sendParcel({ to, speed }, scene?) -> out | null, quote(to, speed) -> $, out() -> [..], track(id),
//   mail() -> [..] (everything delivered), inbox() -> collected mail, waiting(where = 'home' | 'pobox') -> uncollected, collect(where) -> [mail], read(id) (paper view), text(id) -> { hand, greet, paras, sign, .. }, unseen(), seen(),
//   homeMail() (the basket menu), poBox(scene), rentBox(key) -> bool, box() -> { office, no, until } | null,
//   round(force?) (the morning delivery), deliverNow() (land everything in transit: debug), parcels() -> incoming, collectParcel(id) -> bool, coupons(),
//   telegram(scene), teleOn(), bottle(scene), keeper(scene), cards(scene), photoCard(scene), cityMap(scene), tide(scene), board(scene), fair(scene), fairOn(), eventOn(key), glass(scene), watchSort(scene), wall(scene),
//   master(scene, char) / talkMaster(key, scene, char), chain() -> { st 0..6, day }, deadCabinet(scene), homeAsk() -> 0 | 1 | 2, carriers(), city(), stats(), debug: { stay, setChain(n), mail(letterId), parcelIn(label, gives, big) } }
// Chain "The Letter That Waited" (goal `post_deadletter`): 0 ask Postmaster Fairweather (or open the dead-letter cabinet in the sorting gallery) -> 1 look up "Tannery Steps" in the City Hall archive
//   (shelves / map case) or in Mr. Vance's street directories at Hillcrest -> 2 ask the old-timer at the harbor (the Captain, or Skipper Dolly) whose hand it is -> 3 hand it to Mr. Vance at Hillcrest for the
//   morning round -> 4 next morning a letter from Miss Ada Lindqvist arrives; read it -> 5 tell the Postmaster -> 6 done: your photo on the Friends wall of every office, you choose the landmark on the new
//   commemorative stamp (on sale from then on), $120, Ada and the Captain meet on the quay every afternoon. Second thread (goal `post_home_parcel`): Dad's third letter asks for a box of Maple Bay things.
// State: G.state.post = { v, visits: { key: n }, q: { k, day, served }, stamps: { id: n }, album: { id: day }, cards: { k: day }, covers: { id: day }, pobox, held: [..], packed, out: [..], mail: [..], parcels: [..],
//   replies: [..], sched: { sender: { n, day } }, seq, unseen, coupons: { venue: { pct, until } }, chain: { st, day }, sentTo: { sender: { n, tone, parcel } }, lastRound, junk: { id: day }, tele, bottle, keeper,
//   comm, wall, homeAsk, bill, stats: { letters, cards, parcels, got, replies } }.  Flags: post_friend.
// Events: 'post:visit'(key, first), ':number'(ticket), ':served'(key), ':stamp'(id), ':wrote'(held), ':posted'(n, where), ':packed'(packed), ':sent'(out), ':delivered'(out), ':mail'([mail]) (the round came),
//   ':collected'([mail]), ':read'(mail), ':parcel'(parcel, 'home' | 'slip' | 'counter'), ':box'(office), ':telegram'(to), ':bottle', ':chain'(st), ':comm'(stampId).
// Guide stamps: x:post_visit, x:post_letter, x:post_parcel, x:post_reply, x:post_album, x:post_set, x:post_branches, x:post_telegram, x:post_bottle, x:post_dead.
// Tuning: data/post.js TUNE, PRICE, BOXES, SPEEDS.
import { G } from '../core/game.js';
import { el, toast, bubble, say, choose, modal } from '../ui/kit.js';
import { ITEM_BY_ID } from '../data/items.js';
import { RECIPES } from '../data/items.js';
import { EVENTS, eventOnDay } from '../data/calendar.js';
import { Char } from '../core/char.js';
import { enterRoom, registerFixture } from '../scenes/interior.js';
import { PR, NAME, OFFICES, OFFICE_BY_ROOM, OFFICE_BY_KEY, TUNE, PRICE, BOXES, SPEEDS, STAMPS, STAMP_BY_ID, STAMP_SETS, LANDMARK_CHOICES, COVERS, POSTCARDS, POST_VIS, isHoliday, officeHours, officeOpen, hoursText, weightOf, volOf, postage, isLocal, isPostcard } from '../data/post.js';
import { SENDERS, HOME_SENDERS, LETTERS, LETTER_BY_ID, REPLIES, COMPOSE, JUNK, JUNK_BY_ID } from '../story/letters.js';
import { POST_ICONS } from '../art/showpiece/_post_icons.js';
import { ICONS } from '../art/icons/icons.js';
import { VIS } from './housing.js';
import { CORE, CORE_BLURB, EXPERIENCES } from './_guide_data.js';
import { getCity } from '../world/_city.js';
import { specs } from '../scenes/rooms/_airport_life.js';
import { O, propEnt } from '../scenes/rooms/hotel.js';
import { uniforms } from '../scenes/rooms/post.js';
import { letterView, stampCanvas, postcardCanvas, slipCanvas, wrapCanvas, PLAYER_HAND } from '../scenes/rooms/post_views.js';

export const order = 56.7;
Object.assign(VIS, POST_VIS); for (const k in POST_ICONS) if (!ICONS[k]) ICONS[k] = POST_ICONS[k];
const DAY = 1440, G1 = 'post_deadletter', G2 = 'post_home_parcel';
for (const o of OFFICES) { CORE[o.room] = ['services', 'Post office', 'key', o.key === 'main' ? ['sights'] : []]; CORE_BLURB[o.room] = o.blurb; }
for (const x of [
  { id: 'x:post_visit', title: 'Brass Boxes', blurb: 'Walk into the General Post Office in Old Town. It smells of paper, gum and floor wax, as it should.' },
  { id: 'x:post_letter', title: 'With a Stamp', blurb: 'Write a letter at a desk with a pen on a chain, stamp it, and drop it in a mailbox.' },
  { id: 'x:post_parcel', title: 'Weighed and Sent', blurb: 'Pack a parcel, wrap it, wait your turn, and watch it weighed on the scale.' },
  { id: 'x:post_reply', title: 'By Return of Post', blurb: 'Get an answer from home to something you posted.' },
  { id: 'x:post_album', title: 'Stamp Fever', blurb: 'Put ten different stamps in your album.' },
  { id: 'x:post_set', title: 'The Full Set', blurb: 'Complete any one set of stamps: all the birds, all the landmarks, all the Otters.' },
  { id: 'x:post_branches', title: 'Every Counter in Town', blurb: 'Stand in the line at all four branch offices: Maplewood, Hillcrest, the Harbor mail boat and the Downtown postcard counter.' },
  { id: 'x:post_telegram', title: 'Dot Dot Dash', blurb: 'Send a telegram from the brass key at Hillcrest Post & Telegraph.' },
  { id: 'x:post_bottle', title: 'The Slow Way', blurb: 'Send a message in a bottle from the Harbor Mail Boat Office.' },
  { id: 'x:post_dead', title: 'The Letter That Waited', blurb: 'Help a letter that has been in the dead-letter drawer for fifty-eight years find its way home.' },
]) if (!EXPERIENCES.some(e => e.id === x.id)) EXPERIENCES.push(Object.assign({ group: 'Big days out', glyph: 'key', place: 'place:' + PR.main, need: PR.main }, x));

let S = null, built = null, C = null, teleBusy = 0; const debug = { stay: false };
const fresh = () => ({ v: 1, visits: {}, q: {}, stamps: {}, album: {}, cards: {}, covers: {}, pobox: null, held: [], packed: null, out: [], mail: [], parcels: [], replies: [], sched: {}, seq: 0, unseen: 0, coupons: {}, chain: { st: 0 }, sentTo: {}, lastRound: -1, junk: {}, tele: null, bottle: null, keeper: null, comm: null, wall: false, homeAsk: 0, bill: 0, stats: { letters: 0, cards: 0, parcels: 0, got: 0, replies: 0 } });
const st = () => { S = G.state.post || (G.state.post = fresh()); const d = fresh(); for (const k in d) if (S[k] === undefined || (d[k] && typeof d[k] === 'object' && !Array.isArray(d[k]) && (S[k] === null || typeof S[k] !== 'object') && k !== 'pobox' && k !== 'packed' && k !== 'tele' && k !== 'bottle' && k !== 'keeper')) S[k] = d[k]; for (const k of ['held', 'out', 'mail', 'parcels', 'replies']) if (!Array.isArray(S[k])) S[k] = []; if (S.chain.st === undefined) S.chain.st = 0; return S; };
const safe = fn => { try { return fn(); } catch (e) { return undefined; } };
const fmt = n => (G.money && G.money.fmt ? G.money.fmt(n) : '$' + n);
const pick = a => a[Math.floor(Math.random() * a.length)];
const stamp = id => safe(() => G.guide && G.guide.stamp && G.guide.stamp(id));
const add = (k, v) => safe(() => G.needs.add(k, v)), moodlet = id => safe(() => G.needs.addMoodlet(id));
const pay = (n, why, venue) => !n || !G.money || G.money.pay(n, why, { category: 'service', venue: venue || PR.main });
const give = (id, n = 1) => safe(() => G.inv.add(id, n)), take = (id, n = 1) => safe(() => G.inv.remove(id, n)), has = id => safe(() => G.inv.count(id)) || 0;
const who = () => (G.state.player && G.state.player.name) || 'Friend';
const clock = h => String(Math.floor(h) % 24).padStart(2, '0') + ':' + String(Math.round((h % 1) * 60)).padStart(2, '0');
const inPost = sc => !!(sc && sc.def && sc.def.post);
const keyOf = sc => (sc && sc.def && sc.def.post === 'sort' ? 'main' : sc && sc.def && sc.def.post) || null;
const nameOf = id => (ITEM_BY_ID[id] || {}).name || id;
const deliveryDay = n => n.weekday !== 6 && !isHoliday(n.day);
const notify = (text, data, icon, pri) => { safe(() => { if (G.apps && !G.apps.isInstalled('post')) { G.apps.release('post', true); G.apps.install('post'); } }); if (G.phone && G.phone.notify) safe(() => G.phone.notify({ app: 'post', title: 'Maple Post', text, icon: icon || 'post_letter', data, priority: pri })); else toast(text, 'info', 4200); };
const listAnd = a => (a.length <= 1 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]);
const pic = (title, nodes, cls) => { const m = modal({ title, cls: 'post-pic ' + (cls || '') }); for (const n of [].concat(nodes)) if (n) m.body.append(typeof n === 'string' ? el('p', { text: n, style: 'margin:6px 6px;line-height:1.35' }) : n); return m; };
const btn = (label, fn, sub) => el('button.opt', { onclick: fn }, el('span.opt-l', { text: label }), sub ? el('span.opt-s', { text: sub }) : null);

/* ---------- context for letters ---------- */
const SEEN = { lighthouse: ['lighthouse'], hotel: ['hotel'], cityhall: ['cityhall'], aquarium: ['aquarium'], museum: ['museum'], observatory: ['observatory'], conservatory: ['conservatory'], arena: ['arena'], fishmarket: ['fishmarket'] };
function ctx(to) {
  const n = G.now(), F = G.state.flags || {}, P = G.state.player || {}, job = safe(() => G.jobs.current()), home = safe(() => G.housing.current()), money = safe(() => G.money.get()) || P.money || 0, T = S.sentTo[to] || {};
  const seen = []; for (const k in SEEN) if (SEEN[k].some(id => safe(() => G.places.known(id)) || (G.state[k] && G.state[k].visits))) seen.push(k);
  const fr = safe(() => G.social.known().filter(id => !G.social.isFamily(id)).length) || 0;
  return { name: who(), job: String((job && (job.title || job.name)) || '').toLowerCase(), home: (home && home.home && home.home.name) || '', dist: (home && home.home && safe(() => G.places.get('home:' + home.id).districtName)) || '', season: ['spring', 'summer', 'autumn', 'winter'][n.season] || n.seasonName || 'spring',
    rich: money > 1200 ? 1 : 0, broke: money < 60 ? 1 : 0, friends: fr, kit: safe(() => G.social.npc('kit').met) ? 1 : 0, seen, fountain: F.fountain_fixed ? 1 : 0, wrote: T.n || 0, sent: T.parcel || '', tone: T.tone || '', day: n.day };
}
const openCtx = c => Object.assign({}, c, { seen: Object.fromEntries(Object.keys(SEEN).map(k => [k, (c.seen || []).includes(k)])) });
const dateLine = day => { const d = ((day % 56) + 56) % 56, s = Math.floor(d / 14); return `${['Spring', 'Summer', 'Autumn', 'Winter'][s]} ${d % 14 + 1}`; };

/* ---------- the city ---------- */
const freeNear = (w, x, y, far = 5) => { for (let r = 0; r <= far; r += .5) for (let k = 0; k < (r ? 12 : 1); k++) { const a = k * .5236, px = Math.round((x + Math.cos(a) * r) * 2) / 2, py = Math.round((y + Math.sin(a) * r) * 2) / 2; if (!w.isBlocked(px, py) && !w.isBlocked(px + .4, py) && !w.isBlocked(px, py + .4) && !w.isBlocked(px - .4, py)) return { x: px, y: py }; } return null; };
const closedText = o => { const n = G.now(), h = officeHours(o, n); return `${o.name} is closed${isHoliday(n.day) ? ' for the holiday' : n.weekday === 6 ? ' on Sundays' : ''}. ${h && n.hf < h[0] ? 'It opens at ' + clock(h[0]) + ' today.' : hoursText(o)}`; };
function ensure(w) {
  if (built === w || !w || !Array.isArray(w.objs)) return; built = w; C = { w, off: {}, boxes: [], car: [] }; if (G.query && G.query.has('postbefore')) { C = null; return; }
  for (const o of OFFICES) {
    const b = w.objs.find(q => q.id === o.bld.id && q.B && (o.bld.x === undefined || (q.x === o.bld.x && q.y === o.bld.y))); if (!b) continue;
    let poi = w.pois.find(p => p.id === 'door:' + o.room);
    if (!poi) { const d = b.a && b.a.door, at = d && d.side === 'y' && !b.flip ? b.B[0] + d.at : (b.B[0] + b.B[3]) / 2, sp = freeNear(w, at, b.B[4] + .75, 3) || { x: at, y: b.B[4] + .75 };
      poi = w.poi({ type: 'door', id: 'door:' + o.room, room: o.room, name: o.name, x: sp.x, y: sp.y, dir: 1, district: o.district, post: o.key, blurb: o.blurb, locked: () => (officeOpen(o, G.now()) || debug.stay ? null : closedText(o)) }); }
    C.off[o.key] = { o, b, poi };
  }
  C.boxes = w.objs.filter(q => q.id === 'prop.street.mailbox' && !q.hidden);
}
const CLINES = { carrier: ['Morning! Second house on the left gets all the catalogues. I have a theory about her.', 'Rain, snow, gulls. Mostly gulls.', 'I know every dog on this round by name and by temperament.', 'Nothing for you in THIS bag. Try the basket by your door.', 'Forty boxes before eleven. Good for the knees, they tell me.'],
  ada: ['He takes his cap off every time. Every single time. I had forgotten men did that.', 'Fifty-eight years. And it was a perfectly good letter.', 'We are making up for lost conversation. There is a great deal of it.'], cap: ['I wrote that letter by a hurricane lamp. Took me four tries to spell "Lindqvist".', 'I thought the door was shut. The door was shut because she was asleep. Imagine a whole life hanging on a lie-in.', 'You carried it the last mile. I will not forget that.'] };
function wire(s) {
  ensure(s.world); if (!C || s._postWired) return; s._postWired = true; const w = s.world, U = uniforms();
  for (const k in C.off) { const f = C.off[k], p = f.poi, o = f.o;
    if (!s.interactables.some(it => it.poi === p)) s.interactables.push({ x: p.x, y: p.y, label: o.name, h: 1.2, range: 1.3, poi: p, use: () => enter(k) });
    const bx = freeNear(w, p.x + 1.6, p.y + .2, 3); if (bx) { const e = propEnt('prop.postoffice.pillar', {}, s); e.x = bx.x - .25; e.y = bx.y - .25; e.z = w.heightAt(bx.x, bx.y); f.pillar = e; s.interactables.push({ x: bx.x, y: bx.y, label: 'Pillar box: post a letter', h: 1.3, hit: 8, range: 1.4, use: () => postLetters('pillar') }); }
    if (k !== 'main') { const e = propEnt('prop.postoffice.hangsign', { t: o.sign }, s); e.x = p.x - .9; e.y = f.b.B[4]; e.z = w.heightAt(p.x, p.y); f.sign = e; }
    // the carrier of this office: a round of the nearest street mailboxes
    const near = C.boxes.map(q => ({ x: (q.B[0] + q.B[3]) / 2, y: (q.B[1] + q.B[4]) / 2, d: Math.hypot(q.x - p.x, q.y - p.y) })).filter(q => q.d < 80).sort((a, b) => a.d - b.d).slice(0, 5).map(q => freeNear(w, q.x, q.y + .9, 2)).filter(Boolean);
    const c = new Char(U.carrier[OFFICES.indexOf(o) % U.carrier.length], p.x, p.y + .6); c.z = w.heightAt(c.x, c.y); c.speed = 2.1; c.label = 'Mail carrier'; c.hidden = true; c.stops = [{ x: p.x, y: p.y + .8 }].concat(near); c.leg = 0; c.wait = 2 + OFFICES.indexOf(o); c.key = k; s.ents.push(c);
    s.interactables.push({ ent: c, x: c.x, y: c.y, label: 'Mail carrier', h: 1.3, hit: 8, range: 1.9, visible: () => !c.hidden, use: () => { c._hold = 4; c.path = null; c.faceTo(G.player.x, G.player.y); const nw = waiting('home').length; bubble(c, nw ? `There ${nw === 1 ? 'is one thing' : 'are ' + nw + ' things'} in the basket by your door. I put ${nw === 1 ? 'it' : 'them'} there myself.` : pick(CLINES.carrier), 4200); add('social', 1); } });
    const bag = propEnt('prop.postoffice.satchel', {}, s); bag.hidden = true; c.bag = bag; C.car.push(c);
  }
  for (const q of C.boxes) { const x = (q.B[0] + q.B[3]) / 2, y = (q.B[1] + q.B[4]) / 2; s.interactables.push({ x, y, label: 'Mailbox: post a letter', h: 1.1, hit: 7, range: 1.5, use: () => postLetters('street') }); }
  const hb = C.off.harbor; if (hb) { const sp = freeNear(w, hb.poi.x + 3.5, hb.poi.y + 2.2, 4) || { x: hb.poi.x + 3, y: hb.poi.y + 1 }; const AP = specs(); C.pair = [[Object.assign({}, AP.elder[0], { outfit: null, top: 'coat', topColor: '#2f5a9a', hair: 'bun', hairColor: '#e4e4e8', beard: false, hat: null, bag: null }), 'Miss Ada Lindqvist', CLINES.ada, 0], [Object.assign({}, AP.elder[3], { outfit: null, top: 'sweater', topColor: '#22304e', hat: 'cap', hatColor: '#22304e', beard: true, hairColor: '#e4e4e8', bag: null }), 'Captain Elias Thorne', CLINES.cap, .9]].map(([spec, label, lines, dx], i) => { const c = new Char(spec, sp.x + dx, sp.y); c.z = w.heightAt(c.x, c.y); c.dir = i ? 2 : 0; c.label = label; c.hidden = true; s.ents.push(c); s.interactables.push({ ent: c, x: c.x, y: c.y, label, h: 1.3, hit: 8, range: 1.8, visible: () => !c.hidden, use: () => { c._hold = 4; bubble(c, pick(lines), 4600); } }); return c; }); }
}
let cityT = 0;
function cityTick(dt) {
  if (!C || !G.scene || G.scene.id !== 'city') return; const n = G.now(), w = C.w, on = deliveryDay(n) && n.hf >= TUNE.CARRIER_FROM && n.hf < TUNE.CARRIER_TO, P = G.player;
  if ((cityT -= dt) <= 0) { cityT = 1; if (C.pair) { const show = S.chain.st >= 5 && n.hf >= 14.5 && n.hf < 18.5 && !safe(() => G.weather.isWet()); for (const c of C.pair) c.hidden = !show; } }
  if (C.pair) for (const c of C.pair) if (!c.hidden) { c.t += dt; if (c._hold > 0) c._hold -= dt; else c.pose = Math.floor(G.time / 3 + (c.dir ? 1 : 0)) % 2 ? 'talk' : null; }
  for (const c of C.car) { const bag = c.bag; if (!on || c.stops.length < 2) { c.hidden = true; bag.hidden = true; continue; } c.hidden = false; const far = Math.abs(c.x - P.x) + Math.abs(c.y - P.y) > 64;
    if (c._hold > 0) { c._hold -= dt; c.moving = false; c.t += dt; }
    else if (c.path && !far) c.move(w, dt);
    else if (c.path && far) { c.path = null; const sp = c.stops[c.leg]; c.x = sp.x; c.y = sp.y; c.wait = 3; }
    else { c.moving = false; c.t += dt; c.pose = c.leg ? 'work' : null; if ((c.wait -= dt) <= 0) { c.pose = null; c.leg = (c.leg + 1) % c.stops.length; const sp = c.stops[c.leg]; c.wait = far ? 14 : 2.6; if (far || !c.goTo(w, sp.x, sp.y)) { c.x = sp.x; c.y = sp.y; } } }
    c.z = w.heightAt(c.x, c.y); const dx = [1, 0, -1, 0][c.dir], dy = [0, 1, 0, -1][c.dir]; bag.hidden = false; bag.x = c.x - dx * .55 - .25; bag.y = c.y - dy * .55 - .2; bag.z = c.z; }
}

/* ---------- offices, hours, arriving ---------- */
const officeOf = k => OFFICE_BY_KEY[k] || OFFICE_BY_ROOM[k] || null;
const offices = () => OFFICES.map(o => { const f = C && C.off[o.key], n = G.now(); return { key: o.key, room: o.room, name: o.name, short: o.short, master: o.master, district: o.district, x: f ? f.poi.x : 0, y: f ? f.poi.y : 0, open: officeOpen(o, n), hours: hoursText(o), blurb: o.blurb }; });
const cityPos = () => { if (G.scene && G.scene.id === 'city') return G.player; const k = keyOf(G.scene); if (k && C && C.off[k]) return C.off[k].poi; const d = C && G.state.flags && C.w.pois.find(p => p.id === G.state.flags.lastDoor); return d || safe(() => G.state.phone.cityPos) || (C && C.off.main && C.off.main.poi) || { x: 120, y: 230 }; };
function nearest(x, y) { if (!C) safe(() => ensure(getCity())); const L = offices().filter(o => o.x); if (!L.length) return null; if (x === undefined) { const p = cityPos(); x = p.x; y = p.y; } return L.sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y))[0]; }
function homeOffice() { if (!C) safe(() => ensure(getCity())); const h = safe(() => G.housing.current()), p = h && C && C.w.pois.find(q => q.id === 'door:' + h.roomId); return (p && nearest(p.x, p.y)) || nearest() || offices()[0]; }
function enter(k) { const o = officeOf(k); if (!o) return false; if (!officeOpen(o, G.now()) && !debug.stay) { toast(closedText(o), 'info', 4600); return false; } enterRoom(o.room, 'door:' + o.room); return true; }
function arrived(k, sc, prev) {
  const o = officeOf(k); if (!o) return; if (prev && inPost(prev) && keyOf(prev) === o.key) return; const first = !S.visits[o.key]; S.visits[o.key] = (S.visits[o.key] || 0) + 1; safe(() => G.places.discover(o.room, true)); G.emit('post:visit', o.key, first); if (o.key === 'main') stamp('x:post_visit');
  if (first) toast(o.key === 'main' ? 'The General Post Office. Take a number at the red machine for the windows; the desks and the packing table are free to use.' : `${o.name}. ${o.master} is at the counter; join the line.`, 'info', 5200);
  const slips = S.parcels.filter(p => p.st === 'slip' && p.office === o.key).length; if (slips) toast(`You have ${slips === 1 ? 'a parcel' : slips + ' parcels'} waiting at this counter.`, 'good', 4200);
}
const fairOn = () => { const n = G.now(), e = EVENTS.find(q => q.id === 'post_stamp_fair'); return !!(e && safe(() => eventOnDay(e, n.day))) && n.hf >= 10 && n.hf < 14 && !isHoliday(n.day); };
const eventOn = k => { const n = G.now(); if (k === 'harbor') { const e = EVENTS.find(q => q.id === 'post_lighthouse_letters'); return !!(e && safe(() => eventOnDay(e, n.day)) && n.hf >= 14 && n.hf < 17); } return k === 'main' && fairOn(); };
const look = () => { const b = S.pobox; return { box: b ? b.no : undefined, boxOffice: b ? b.office : null, boxMail: waiting('pobox').length, wall: !!S.wall, comm: S.comm }; };

/* ---------- the queue at the General Post Office ---------- */
function qState() { const n = G.now(), o = OFFICES[0], h = officeHours(o, n), serving = 9 + (h ? Math.max(0, Math.floor(((Math.min(n.hf, h[1]) - h[0]) * 60 + .02) / TUNE.QUEUE_MIN)) : 0), mine = S.q.day === n.day ? S.q.k : undefined;
  return { serving, win: serving % 4 + 1, ticket: mine, ahead: mine === undefined ? 0 : Math.max(0, mine - serving), called: mine !== undefined && mine <= serving, mine: mine !== undefined && mine <= serving && !S.q.served }; }
function qTake() { const n = G.now(); if (!officeOpen(OFFICES[0], n)) return null; const q = qState(); if (q.ticket !== undefined && !S.q.served) return q.ticket; const busy = n.hf < 9.5 ? 2 : n.hf < 12.5 ? 4 : n.hf < 14 ? 3 : 4; S.q = { k: q.serving + 1 + ((n.day * 3 + n.hour) % busy), day: n.day }; G.emit('post:number', S.q.k); return S.q.k; }
function takeNumber(sc) { const had = qState(); const k = qTake(); if (k === null) return toast('The windows are shut.', 'info'); const q = qState(); toast(had.ticket !== undefined && !S.q.served && had.ticket === k ? `You already hold A${k}. Now serving A${q.serving}.` : q.called ? `Ticket A${k}. No wait: go straight to a window.` : `Ticket A${k}. Now serving A${q.serving}: ${q.ahead} ahead of you. Sit down, or use a desk while you wait.`, 'good', 4600); if (sc && sc.hot) sc.hot.sync(); }
function wait(fx, sc) { const q = qState(); if (q.ticket === undefined || S.q.served) return toast('Take a number first: the red machine by the door.', 'info'); if (q.called) return toast(`A${q.ticket}: that is you. Any window.`, 'good'); const seat = (fx.seats || []).find(s => !sc.ents.some(e => e !== G.player && !e.hidden && Math.hypot(e.x - s.x, e.y - s.y) < .4)) || (fx.seats || [])[0]; if (!seat) return;
  const n = G.now(), h = officeHours(OFFICES[0], n), into = ((n.hf - h[0]) * 60) % TUNE.QUEUE_MIN; G.startActivity({ label: `Waiting for A${q.ticket}`, anim: 'sit', minutes: Math.max(1, q.ahead * TUNE.QUEUE_MIN - into + .6), rate: 2.2, at: { x: seat.x, y: seat.y, z: seat.z || .45, dir: seat.dir === undefined ? 3 : seat.dir }, done: () => { toast(`NOW SERVING A${q.ticket}. That is you: any window.`, 'good', 4200); add('fun', -1); } }); }
const canServe = () => qState().called;
function windowUse(n, sc) { const o = OFFICES[0]; if (!officeOpen(o, G.now()) && !debug.stay) return toast('This window is shut. ' + hoursText(o), 'info', 4200); const q = qState(); if (!q.called && !debug.stay) return toast(q.ticket === undefined || S.q.served ? 'Take a number first: the red machine by the door.' : `Now serving A${q.serving}. You are A${q.ticket}: ${q.ahead} ahead of you.`, 'info', 4200);
  service('main', sc, n === 1 ? ['stamps', 'post', 'shop'] : n === 2 ? ['parcel'] : n === 3 ? ['collect', 'box'] : null); }
function counter(sc) {
  const k = keyOf(sc), o = officeOf(k), L = sc.hot && sc.hot.line; if (!o || !L) return; if (!officeOpen(o, G.now()) && !debug.stay) return toast(closedText(o), 'info', 4200); if (L.ahead() >= 0) return;
  const ahead = L.count(), p = L.join(), sp = L.slot();
  if (ahead > 0 && sp) { toast(`${ahead} ahead of you. The line moves.`, 'info', 2600); G.startActivity({ label: 'Waiting in line', anim: 'stand', minutes: 600, rate: 1.6, line: 1, at: { x: O + sp.x, y: O + sp.y, z: 0, dir: 3 }, tick() { const q = L.slot(); if (q) { const P = G.player, tx = O + q.x, ty = O + q.y; P.x += (tx - P.x) * .08; P.y += (ty - P.y) * .08; P.pose = Math.hypot(tx - P.x, ty - P.y) > .15 ? 'walk' : 'stand'; P.dir = 3; } }, cancel() { L.leave(); } }); }
  p.then(ok => { if (G.busy && G.busy.line) { G.busy.cancel = null; G.endActivity(true); } if (!ok) return; const fr = L.front(); if (fr) { G.player.x = O + fr.x; G.player.y = O + fr.y; G.player.dir = 3; G.player.stop(); } S.served = S.served || {}; S.served[k] = 1; if (['maple', 'hill', 'harbor', 'down'].every(q => S.served[q])) stamp('x:post_branches'); service(k, sc); });
}

/* ---------- the counter service menu ---------- */
function service(k, sc, kinds) {
  const o = officeOf(k), opts = [], can = t => !kinds || kinds.includes(t), slips = S.parcels.filter(p => p.st === 'slip' && p.office === k), held = S.held.length;
  if (can('parcel') && S.packed) opts.push({ label: 'Send my parcel', sub: 'Weigh it, choose where and how fast', value: 'parcel' });
  if (can('collect') && slips.length) opts.push({ label: `Collect ${slips.length === 1 ? 'my parcel' : slips.length + ' parcels'}`, sub: 'Hand over the pink slip', value: 'collect' });
  if (can('post') && held) opts.push({ label: `Post ${held === 1 ? 'my letter' : 'my ' + held + ' letters'}`, sub: 'Over the counter', value: 'post' });
  if (can('stamps')) opts.push({ label: 'Buy stamps', sub: `You have ${stampCount()}`, value: 'stamps' });
  if (can('box') && k !== 'down') opts.push({ label: S.pobox && S.pobox.office === k ? 'My P.O. box' : 'Rent a P.O. box', sub: S.pobox && S.pobox.office === k ? `Box ${S.pobox.no + 100}, paid until ${dateLine(S.pobox.until)}` : `${fmt(PRICE.pobox)} for ${PRICE.poboxWeeks} weeks: your post waits here instead of at home`, value: 'box' });
  if (can('shop')) opts.push({ label: 'Postcards, paper and gifts', sub: 'The shop shelf', value: 'shop' });
  if (can('parcel') && !S.packed) opts.push({ label: 'How do I send a parcel?', value: 'how' });
  G.emit('post:served', k); if (k === 'main') S.q.served = true;
  if (!opts.length) return say([{ who: o.master, text: 'Nothing for this window today. Parcels are window 2, collections window 3, and window 4 does a bit of everything.' }]);
  return choose(k === 'main' ? 'At the window' : o.master, opts, { text: k === 'main' ? pick(['"Next, please."', '"What can I do for you?"', '"Good day. Anything fragile, liquid or alive?"']) : MASTER[k].hello }).then(v => {
    if (v === 'parcel') return sendFlow(k, sc); if (v === 'collect') return collectAll(k, sc); if (v === 'post') return postLetters('counter', k); if (v === 'stamps') return stampShop(k); if (v === 'box') return (S.pobox && S.pobox.office === k ? poBox(sc) : rentBox(k));
    if (v === 'shop') return safe(() => G.shop.open(o.room)); if (v === 'how') return say([{ who: o.master, text: 'Go to the packing table. Choose what goes in from your backpack, pick a box, and wrap it: three strips of tape. Then bring it back to me and I will weigh it.' }]); });
}

/* ---------- stamps ---------- */
const stampCount = () => Object.values(S.stamps).reduce((a, b) => a + (b || 0), 0);
function onSale(k) { const n = G.now(); return STAMPS.filter(s => (s.set === 'def' || (s.set === 'season' && s.season === n.season) || (s.set === 'land' && k !== 'maple') || (s.set === 'bird' && (k === 'main' || k === 'hill' || k === 'maple')) || (s.set === 'sea' && (k === 'main' || k === 'harbor')) || ((s.set === 'otter' || s.set === 'transit') && (k === 'main' || k === 'down')) || (s.id === 'fair' && k === 'main' && fairOn()) || (s.id === 'comm' && !!S.comm))); }
function gotStamp(id, quiet) { const fresh1 = S.album[id] === undefined; if (fresh1) { S.album[id] = G.now().day; const n = Object.keys(S.album).length; if (n >= 10) stamp('x:post_album'); const s = STAMP_BY_ID[id], set = STAMPS.filter(q => q.set === s.set); if (s.set !== 'special' && set.every(q => S.album[q.id] !== undefined)) { stamp('x:post_set'); if (!quiet) toast(`Set complete: ${(STAMP_SETS.find(q => q[0] === s.set) || [])[1]}!`, 'good', 4200); } } G.emit('post:stamp', id); return fresh1; }
function buyStamp(id, n = 1, k) { const s = STAMP_BY_ID[id]; if (!s || !(n > 0)) return false; if (!pay(s.price * n, 'Stamps: ' + s.name, officeOf(k || 'main').room)) return false; S.stamps[id] = (S.stamps[id] || 0) + n; if (gotStamp(id)) moodlet('post_stampbug'); return true; }
function useStamp() { const ids = Object.keys(S.stamps).filter(id => S.stamps[id] > 0); if (!ids.length) return null; ids.sort((a, b) => (STAMP_BY_ID[a].set === 'def' ? 0 : 1) - (STAMP_BY_ID[b].set === 'def' ? 0 : 1) || S.stamps[b] - S.stamps[a]); S.stamps[ids[0]]--; return ids[0]; }
function stampShop(k) {
  const m = modal({ title: 'Stamps', cls: 'post-stamps' }), draw = () => { m.body.replaceChildren(el('p', { text: `One stamp sends one letter or postcard anywhere. Every design goes into your album. You have ${stampCount()} to use.`, style: 'margin:4px 6px 8px;line-height:1.3' }));
    for (const [set, title] of STAMP_SETS) { const L = onSale(k).filter(s => s.set === set); if (!L.length) continue; m.body.append(el('div', { text: title, style: 'font-weight:bold;margin:8px 6px 2px' })); const row = el('div', { style: 'display:flex;flex-wrap:wrap;gap:6px;padding:0 4px' });
      for (const s of L) row.append(el('button', { class: 'post-st', title: s.name, style: 'display:flex;flex-direction:column;align-items:center;gap:2px;padding:4px;min-width:74px;background:#fff8e8;border:2px solid #2a2733;cursor:pointer', onclick: () => { if (buyStamp(s.id, 1, k)) { toast(`${s.name}: into the album.`, 'good', 1800); draw(); } } }, stampCanvas(s.id, 2, { comm: S.comm }), el('small', { text: fmt(s.price) + (S.stamps[s.id] ? ' · ' + S.stamps[s.id] : ''), style: 'font-size:11px' }))); m.body.append(row); }
    const cv = coverToday(); if (cv && k === 'main') m.body.append(btn(`Today only: ${cv.name}`, () => { if (S.covers[cv.id] !== undefined) return toast('You already have today\'s cover.', 'info'); if (!pay(PRICE.cover, 'First-day cover', PR.main)) return; S.covers[cv.id] = G.now().day; toast(`${cv.name}: cancelled with today's postmark while you watch.`, 'good', 3600); draw(); }, S.covers[cv.id] !== undefined ? 'In your collection' : fmt(PRICE.cover))); };
  draw(); return m;
}
function coverToday() { const n = G.now(); for (const id in COVERS) { const e = EVENTS.find(q => q.id === id); if (e && safe(() => eventOnDay(e, n.day))) return { id, name: COVERS[id] }; } return null; }
function philately(sc) { if (!officeOpen(OFFICES[0], G.now()) && !debug.stay) return toast('The philately counter is closed.', 'info'); stampShop('main'); }

/* ---------- writing ---------- */
function recipients(forParcel) {
  const L = []; for (const id of HOME_SENDERS) if (id === 'dad' || S.sched[id] || G.now().day >= 7) L.push({ id, name: SENDERS[id].name, sub: SENDERS[id].from, type: 'home' });
  const kn = safe(() => G.social.known()) || []; for (const id of kn.filter(q => q && q !== '_anon').sort((a, b) => (safe(() => G.social.rel(b)) || 0) - (safe(() => G.social.rel(a)) || 0)).slice(0, 9)) { const n = safe(() => G.social.npc(id)); if (n) L.push({ id, name: n.short || n.name, sub: 'In Maple Bay', type: 'npc' }); }
  if (forParcel) L.push({ id: 'self', name: 'Myself', sub: 'Forward it to my home', type: 'self' }); else if (S.visits.harbor) L.push({ id: 'keeper', name: 'The Lighthouse Keeper', sub: 'Maple Bay Light, by the mail boat', type: 'keeper' });
  return L;
}
const typeOf = id => (SENDERS[id] && HOME_SENDERS.includes(id) ? 'home' : id === 'self' ? 'self' : id === 'keeper' || id === 'bottle' ? id : 'npc');
const toName = id => (SENDERS[id] ? SENDERS[id].name : id === 'self' ? 'yourself' : (safe(() => G.social.npc(id).short) || safe(() => G.social.npc(id).name) || id));
const myCards = () => (safe(() => G.inv.items()) || []).filter(i => isPostcard(ITEM_BY_ID[i.id]) && i.qty > 0);
function letterParts(h) { const c = openCtx(h.c || ctx(h.to)), T = COMPOSE.topics(c, h.to), lines = (h.topics || []).map(t => (T.find(q => q.id === t) || {}).text).filter(Boolean), nm = SENDERS[h.to] ? SENDERS[h.to].short : toName(h.to);
  return { hand: PLAYER_HAND, greet: `Dear ${nm},`, paras: h.kind === 'card' ? lines.concat(h.to === 'keeper' ? ['What is it like out there?'] : []) : [COMPOSE.open[h.tone] || COMPOSE.open.warm].concat(lines, h.to === 'keeper' ? ['What is it like out there, at the end of the street made of water?'] : [], [COMPOSE.close[h.tone] || COMPOSE.close.warm]), sign: who(), from: h.kind === 'card' ? '' : 'Maple Bay', date: dateLine(h.day === undefined ? G.now().day : h.day) }; }
/** make the letter (no UI). Consumes the postcard item for a card. */
function write(o) { const kind = o.kind === 'card' ? 'card' : 'letter'; if (!o.to) return null; let card = null; if (kind === 'card') { const it = ITEM_BY_ID[o.card] && has(o.card) ? o.card : (myCards()[0] || {}).id; if (!it) return null; take(it, 1); card = it; S.cards[it] = S.cards[it] === undefined ? G.now().day : S.cards[it]; }
  const h = { id: ++S.seq, to: o.to, kind, tone: o.tone || 'warm', topics: (o.topics || []).slice(0, kind === 'card' ? 1 : 3), card, day: G.now().day, c: ctx(o.to) }; S.held.push(h); if (give('post_letter', 1) === false) toast('Your backpack is full; the letter is tucked in your pocket.', 'info'); moodlet('post_wrote'); add('fun', 6); add('social', 5); G.emit('post:wrote', h); return h; }
function compose(opt = {}) {
  const R = recipients(false); return choose('Who are you writing to?', R.map(r => ({ label: r.name, sub: r.sub, value: r.id })), { text: opt.text || 'A sheet of cream paper, a blotter, and a pen on a brass chain.' }).then(to => { if (!to) return null; const cards = myCards();
    return (cards.length ? choose('A letter or a postcard?', [{ label: 'A letter', sub: 'Three things to say', value: 'letter' }].concat(cards.map(c => ({ label: 'Postcard: ' + nameOf(c.id).replace(/^Postcard: /, ''), sub: 'One line on the back', value: c.id })))) : Promise.resolve('letter')).then(kind => { if (!kind) return null; const card = kind === 'letter' ? null : kind;
      return (card ? Promise.resolve('warm') : choose('How do you want it to sound?', COMPOSE.tones.map(t => ({ label: t.label, sub: t.sub, value: t.id })))).then(tone => { if (!tone) return null; return new Promise(res => {
        const c = openCtx(ctx(to)), T = COMPOSE.topics(c, to), max = card ? 1 : 3, sel = []; let done = false; const m = modal({ title: card ? 'On the back of the card' : `To ${toName(to)}`, cls: 'post-compose', onClose: () => { if (!done) res(null); } }), prev = el('div', { style: 'margin:6px 0' }), list = el('div'), go = el('button.opt', { onclick: () => { if (!sel.length) return; done = true; m.close(); res({ to, kind: card ? 'card' : 'letter', tone, topics: sel.slice(), card }); } }, el('span.opt-l', { text: card ? 'Sign it' : 'Sign and seal it' }));
        const draw = () => { list.replaceChildren(el('p', { text: `Choose ${max === 1 ? 'one line' : 'three things to say'} (${sel.length}/${max}).`, style: 'margin:4px 6px' })); for (const t of T) list.append(el('button.opt', { style: sel.includes(t.id) ? 'outline:3px solid #2756a8;background:#e4edf6' : '', onclick: () => { const i = sel.indexOf(t.id); if (i >= 0) sel.splice(i, 1); else { if (sel.length >= max) sel.shift(); sel.push(t.id); } draw(); } }, el('span.opt-l', { text: t.text, style: 'font-size:13px;white-space:normal;text-align:left' })));
          go.disabled = !sel.length; prev.replaceChildren(letterView(PLAYER_HAND, letterParts({ to, kind: card ? 'card' : 'letter', tone, topics: sel, c: ctx(to) }), 300)); };
        m.body.append(list, go, prev); draw(); }); }); }); });
}
function desk(fx, sc, home) {
  if (home && !has('post_paper')) return toast('You need Writing Paper & Envelopes to write at home (any post office sells them). The desks at a post office are free.', 'info', 4600);
  compose().then(o => { if (!o) return; const at = fx && fx.use ? { x: fx.use.x, y: fx.use.y, z: 0, dir: 3 } : undefined; G.startActivity({ label: o.kind === 'card' ? 'Writing a postcard' : 'Writing a letter', anim: 'work', minutes: o.kind === 'card' ? TUNE.CARD_MIN : TUNE.WRITE_MIN, rate: 3, at, done: () => { const h = write(o); if (!h) return; if (home) take('post_paper', 1); toast(`${o.kind === 'card' ? 'Postcard' : 'Letter'} to ${toName(o.to)}: sealed. It needs a stamp and any mailbox.`, 'good', 4200); } }); });
}
const collectDay = n => n.day + (n.hf >= TUNE.COLLECT ? 1 : 0);
/** post every held letter: one stamp each. where: 'street' | 'pillar' | 'slot' | 'counter' | 'lobby' | 'home' */
function postLetters(where, k) {
  if (!S.held.length) { toast(where === 'counter' ? 'You have nothing to post.' : 'A mailbox. Collection at 17:00, every day but Sunday. You have nothing to post: write a letter at any post-office desk.', 'info', 4200); return 0; }
  let need = S.held.length - stampCount(); if (need > 0) { if (where === 'counter' || where === 'slot') { if (!buyStamp('leaf_red', need, k)) return 0; } else { toast(`You need ${need === 1 ? 'a stamp' : need + ' stamps'}. Any post office counter sells them.`, 'bad', 4200); return 0; } }
  const n = G.now(), d0 = collectDay(n) + (where === 'home' ? 1 : 0); let cnt = 0;
  for (const h of S.held.splice(0)) { const ty = typeOf(h.to), local = ty === 'npc' || ty === 'keeper', used = useStamp(), due = (d0 + (ty === 'bottle' ? 6 : local ? 1 : 2)) * DAY + TUNE.ROUND * 60 - 40;
    S.out.push({ id: h.id, kind: h.kind, to: h.to, ty, tone: h.tone, topics: h.topics, card: h.card, stamp: used, sentT: G.state.t, due, st: 'transit', c: h.c, day: h.day }); S.stats[h.kind === 'card' ? 'cards' : 'letters']++; cnt++; }
  take('post_letter', has('post_letter')); moodlet('post_sent'); stamp('x:post_letter'); G.emit('post:posted', cnt, where);
  toast(`${cnt === 1 ? 'It drops' : cnt + ' letters drop'} into the box. ${where === 'home' ? 'The carrier takes them on the morning round.' : n.hf >= TUNE.COLLECT ? 'Tomorrow\'s collection.' : 'Collected at 17:00.'}`, 'good', 4200); trim(); return cnt;
}
const trim = () => { if (S.out.length > 30) S.out = S.out.filter(o => o.st === 'transit').concat(S.out.filter(o => o.st !== 'transit').slice(-18)).sort((a, b) => a.id - b.id); if (S.mail.length > 70) { const keep = S.mail.filter(m => !m.got || m.type === 'letter' || m.type === 'reply'), rest = S.mail.filter(m => m.got && m.type !== 'letter' && m.type !== 'reply').slice(-10); S.mail = keep.concat(rest).sort((a, b) => a.id - b.id); } };

/* ---------- parcels ---------- */
const NOSEND = /^(post_letter|post_parcel|post_slip|post_deadletter)$/;
const sendable = () => (safe(() => G.inv.items()) || []).filter(i => { const it = ITEM_BY_ID[i.id]; return it && i.qty > 0 && !NOSEND.test(i.id) && !it.grants && !/_(permit|licence|resident_id|city_key|valve_key|workorder)$/.test(i.id); });
const describe = items => { const L = items.map(i => { const nm = nameOf(i.id).replace(/^Postcard: /, 'the postcard of ').replace(/^(Aunt June's|Sam's) /, ''); return (i.qty > 1 ? i.qty + ' x ' : /^the /.test(nm) ? '' : 'the ') + nm; }); return listAnd(L.slice(0, 4)) + (L.length > 4 ? ' and more' : ''); };
function packItems(list, wrap = 2) {
  if (S.packed) { toast('You already carry a wrapped parcel. Send it first (or unpack it at a packing table).', 'info', 4200); return null; } list = (list || []).filter(i => i && i.qty > 0 && has(i.id) >= i.qty && !NOSEND.test(i.id)); if (!list.length) return null;
  const vol = list.reduce((a, i) => a + volOf(ITEM_BY_ID[i.id]) * i.qty, 0), box = BOXES.find(b => b.cap >= vol); if (!box) { toast('That will not fit in the largest box (9 units).', 'bad'); return null; } if (!pay(box.price, box.name, PR.main)) return null;
  for (const i of list) take(i.id, i.qty); const kg = Math.round(list.reduce((a, i) => a + weightOf(ITEM_BY_ID[i.id]) * i.qty, .15) * 10) / 10;
  S.packed = { items: list.map(i => ({ id: i.id, qty: i.qty })), size: box.id, wrap: Math.max(0, Math.min(3, Math.round(wrap))), kg, local: list.some(i => isLocal(ITEM_BY_ID[i.id])) ? 1 : 0, value: list.reduce((a, i) => a + ((ITEM_BY_ID[i.id] || {}).price || 0) * i.qty, 0) }; give('post_parcel', 1); G.emit('post:packed', S.packed); return S.packed;
}
function unpack() { const p = S.packed; if (!p) return false; for (const i of p.items) give(i.id, i.qty); take('post_parcel', 1); S.packed = null; toast('You cut the tape and take everything out again.', 'info'); return true; }
function wrapGame() { return new Promise(res => { let pos = 0, dir = 1, raf = 0, last = performance.now(), closed = false; const state = { pos: 0, done: [], i: 0 }, B = wrapCanvas(), fin = () => { if (closed) return; closed = true; cancelAnimationFrame(raf); const sc = state.done.length ? state.done.reduce((a, b) => a + b, 0) / 3 : 0; m.close(); res(Math.round(sc * 3)); };
  const m = modal({ title: 'Wrap it: three strips of tape', cls: 'post-wrap', onClose: () => { if (!closed) { closed = true; cancelAnimationFrame(raf); res(Math.round((state.done.reduce((a, b) => a + b, 0) / 3) * 3)); } } }), tip = el('p', { text: 'Press TAPE when the roll is over the marked seam.', style: 'margin:6px;text-align:center' });
  const hit = () => { if (state.i >= 3) return; const target = (34 + state.i * 26 - 14) / 92, q = Math.max(0, 1 - Math.abs(pos - target) * 7); state.done[state.i] = q; state.i++; tip.textContent = q > .8 ? 'Dead straight.' : q > .4 ? 'It will hold.' : 'A bit skew. It has character.'; if (state.i >= 3) { B.draw(state); setTimeout(fin, 700); } };
  const loop = t => { const dt = Math.min(.05, (t - last) / 1000); last = t; pos += dir * dt * (.55 + state.i * .12); if (pos > 1) { pos = 1; dir = -1; } if (pos < 0) { pos = 0; dir = 1; } state.pos = pos; B.draw(state); if (!closed && state.i < 3) raf = requestAnimationFrame(loop); };
  B.canvas.addEventListener('pointerdown', hit); m.body.append(B.canvas, tip, el('button.opt', { onclick: hit, style: 'text-align:center' }, el('span.opt-l', { text: 'TAPE' }))); m._hit = hit; wrapGame.cur = { hit, state }; raf = requestAnimationFrame(loop); }); }
function pack(fx, sc) {
  if (S.packed) return choose('The packing table', [{ label: 'Unpack my parcel', sub: describe(S.packed.items), value: 'un' }, { label: 'Leave it', value: null }], { text: 'You already carry a wrapped parcel. Take it to the counter to be weighed.' }).then(v => { if (v) unpack(); });
  const bag = sendable(); if (!bag.length) return toast('Flat boxes, brown paper, tape and string. You have nothing in your backpack to send.', 'info', 4200);
  const sel = {}, m = modal({ title: 'Pack a parcel', cls: 'post-pack' }), list = el('div'), foot = el('div');
  const draw = () => { const vol = Object.keys(sel).reduce((a, id) => a + volOf(ITEM_BY_ID[id]) * sel[id], 0), box = BOXES.find(b => b.cap >= vol); list.replaceChildren(el('p', { text: 'Choose what goes in. Then you wrap it yourself.', style: 'margin:4px 6px' }));
    for (const i of bag) { const q = sel[i.id] || 0; list.append(el('div', { style: 'display:flex;align-items:center;gap:6px;padding:3px 6px;border-bottom:1px solid #d8cfc0' }, el('span', { text: nameOf(i.id), style: 'flex:1;font-size:13px' }), el('small', { text: `have ${i.qty}` }), el('button', { text: '-', disabled: !q, style: 'width:30px;height:30px', onclick: () => { sel[i.id] = q - 1; if (!sel[i.id]) delete sel[i.id]; draw(); } }), el('b', { text: String(q), style: 'min-width:16px;text-align:center' }), el('button', { text: '+', disabled: q >= i.qty, style: 'width:30px;height:30px', onclick: () => { sel[i.id] = q + 1; draw(); } }))); }
    foot.replaceChildren(el('p', { text: vol ? (box ? `${box.name} (${vol}/${box.cap}) · box ${fmt(box.price)}` : 'Too much for the largest box.') : 'Nothing chosen yet.', style: 'margin:6px;font-weight:bold' }), el('button.opt', { disabled: !vol || !box, onclick: () => { const items = Object.keys(sel).map(id => ({ id, qty: sel[id] })); m.close(); wrapGame().then(w => { G.startActivity({ label: 'Wrapping the parcel', anim: 'work', minutes: TUNE.WRAP_MIN, rate: 3, at: fx && fx.use ? { x: fx.use.x, y: fx.use.y, z: 0, dir: 3 } : undefined, done: () => { const p = packItems(items, w); if (p) toast(`${['A lumpy parcel, held together by hope', 'A parcel. It will get there', 'A tidy parcel', 'A parcel wrapped square as a brick'][p.wrap]}: ${p.kg.toFixed(1)} kg. Take it to the counter.`, 'good', 4600); } }); }); } }, el('span.opt-l', { text: 'Wrap it' }))); };
  m.body.append(list, foot); draw(); return m;
}
const isLocalTo = to => { const t = typeOf(to); return t === 'npc' || t === 'self'; };
const quote = (to, speed) => (S.packed ? postage(S.packed.size, S.packed.kg, speed, isLocalTo(to)) : 0);
function sendParcel(o, sc) {
  const p = S.packed; if (!p || !o || !o.to) return null; const sp = SPEEDS.find(s => s.id === (o.speed || 'std')) || SPEEDS[0], local = isLocalTo(o.to), cost = postage(p.size, p.kg, sp.id, local); if (!pay(cost, `Parcel to ${toName(o.to)} (${sp.name})`, (officeOf(keyOf(sc || G.scene)) || OFFICES[0]).room)) return null;
  const n = G.now(), due = local ? (sp.id === 'std' ? (n.day + 1) * DAY + TUNE.PARCELS * 60 : G.state.t + 240) : (n.day + sp.days) * DAY + TUNE.PARCELS * 60;
  const out = { id: ++S.seq, kind: 'parcel', to: o.to, ty: typeOf(o.to), speed: sp.id, items: p.items, desc: describe(p.items), n: p.items.reduce((a, i) => a + i.qty, 0), wrap: p.wrap, kg: p.kg, local: p.local, value: p.value, cost, sentT: G.state.t, due, st: 'transit', c: ctx(o.to), day: n.day };
  S.out.push(out); S.packed = null; take('post_parcel', 1); S.stats.parcels++; moodlet('post_sent'); stamp('x:post_parcel'); G.emit('post:sent', out); trim(); return out;
}
function sendFlow(k, sc) {
  const p = S.packed, o = officeOf(k), clerk = k === 'main' ? 'Clerk Bram Pallister' : o.master; if (!p) return; if (sc && sc.hot && sc.hot.weigh) sc.hot.weigh(p.kg, true);
  const done = () => { if (sc && sc.hot && sc.hot.weigh) sc.hot.weigh(0, false); };
  return say([{ who: clerk, text: `On the scale, please. ...${p.kg.toFixed(1)} kilos. ${p.wrap >= 3 ? 'Now THAT is a parcel. Square corners. I could weep.' : p.wrap <= 0 ? 'I will put a bit more tape on that, if you do not mind. For the van\'s sake.' : 'That will travel.'} Where is it going?` }]).then(() => choose('Send it to', recipients(true).map(r => ({ label: r.name, sub: r.sub, value: r.id })))).then(to => { if (!to) { done(); return null; }
    const local = isLocalTo(to); return choose('How fast?', SPEEDS.filter(s => !local || s.id !== 'ovn').map(s => ({ label: `${s.name} · ${fmt(postage(p.size, p.kg, s.id, local))}`, sub: local ? (s.id === 'std' ? 'Tomorrow morning' : 'This afternoon, by van') : `${s.days} day${s.days > 1 ? 's' : ''}`, value: s.id }))).then(speed => { if (!speed) { done(); return null; } const out = sendParcel({ to, speed }, sc); done(); if (!out) return null;
      toast(`Stamped, stickered and into the cage. To ${toName(to)}, arriving ${dateLine(Math.floor(out.due / DAY))}. Track it in Maple Post.`, 'good', 5200); return out; }); });
}

/* ---------- incoming mail ---------- */
const waiting = where => S.mail.filter(m => !m.got && m.where === where);
const where = () => (S.pobox && S.pobox.until >= G.now().day ? 'pobox' : 'home');
function addMail(m) { const e = Object.assign({ id: ++S.seq, t: G.state.t, where: where(), got: 0, read: 0 }, m); S.mail.push(e); return e; }
function deliverLetter(key, quiet) { const L = LETTER_BY_ID[key]; if (!L) return null; const e = addMail({ type: 'letter', from: L.from, key, c: ctx(L.from) }); if (L.parcel) S.parcels.push({ id: ++S.seq, from: L.from, label: L.parcel.label, gives: L.parcel.gives, big: L.parcel.big ? 1 : 0, t: G.now().day * DAY + TUNE.PARCELS * 60, st: 'due' }); if (L.ask === 'home_parcel' && !S.homeAsk) S.homeAsk = 1; return e; }
function round(force) {
  const n = G.now(), got = []; if (!force && (S.lastRound >= n.day || n.hf < TUNE.ROUND || !deliveryDay(n))) return got; S.lastRound = n.day;
  if (S.pobox && S.pobox.until < n.day) { for (const m of waiting('pobox')) m.where = 'home'; S.pobox = null; toast('Your P.O. box rental has run out. Anything in it has been sent on to your door.', 'info', 4600); }
  let cnt = 0; const ord = HOME_SENDERS.slice(n.day % 6).concat(HOME_SENDERS.slice(0, n.day % 6));
  for (const id of ord) { if (cnt >= TUNE.MAX_LETTERS_DAY) break; const sc = S.sched[id] || { n: 0, day: -99 }, L = LETTERS.find(l => l.from === id && l.n === sc.n + 1); if (!L || n.day < L.minDay || n.day < sc.day + L.gap) continue; S.sched[id] = { n: L.n, day: n.day }; got.push(deliverLetter(L.id)); cnt++; }
  for (const r of S.replies.filter(q => q.t <= G.state.t)) { got.push(r.key ? addMail({ type: 'letter', from: r.from, key: r.key, c: ctx(r.from) }) : addMail({ type: 'reply', from: r.from, o: r.o, c: ctx(r.from) })); if (!r.key) S.stats.replies++; } S.replies = S.replies.filter(q => q.t > G.state.t);
  if (S.chain.st === 4 && n.day > (S.chain.day || 0) && !S.mail.some(m => m.key === 'ada1')) got.push(addMail({ type: 'letter', from: 'ada', key: 'ada1', c: ctx('ada') }));
  if (S.bill) { S.bill = 0; const b = safe(() => G.money.bills()); if (b && b.total) got.push(addMail({ type: 'bill', from: 'bill', data: { items: b.items.slice(0, 8), total: b.total, arrears: b.arrears || 0 } })); }
  if (n.day % TUNE.JUNK_EVERY === 1 || force === 'junk') { const pool = JUNK.filter(j => S.junk[j.id] === undefined || n.day - S.junk[j.id] > 20), j = pool[(n.day * 5 + 3) % Math.max(1, pool.length)]; if (j) { S.junk[j.id] = n.day; got.push(addMail({ type: 'junk', from: 'junk', key: j.id })); } }
  if (got.length) { S.unseen += got.length; const lt = got.filter(m => m.type === 'letter' || m.type === 'reply'), first = lt[0] || got[0], wh = first.where === 'pobox' ? `in your P.O. box at ${officeOf(S.pobox.office).short}` : 'in the basket by your door';
    notify(lt.length ? `A letter from ${SENDERS[first.from].name}${got.length > 1 ? ' and ' + (got.length - 1) + ' more' : ''}: waiting ${wh}.` : `The post has come: ${got.length} item${got.length > 1 ? 's' : ''} ${wh}.`, { tab: 'inbox' }, 'post_letter'); G.emit('post:mail', got); syncHome(); trim(); }
  return got;
}
function mailTitle(m) { return m.type === 'letter' || m.type === 'reply' ? `${m.type === 'reply' ? 'A reply from' : 'A letter from'} ${SENDERS[m.from].name}` : m.type === 'junk' ? (JUNK_BY_ID[m.key] || {}).title || 'A flyer' : m.type === 'bill' ? 'Your weekly bill' : m.type === 'slip' ? 'Collection slip: a parcel is waiting' : m.type === 'telegram' ? 'A telegram' : 'Post'; }
function text(id) { const m = S.mail.find(q => q.id === id); if (!m || (m.type !== 'letter' && m.type !== 'reply')) return null; const sd = SENDERS[m.from], c = openCtx(m.c || ctx(m.from)), L = m.key && LETTER_BY_ID[m.key];
  return { hand: sd.hand, greet: sd.greet(c), paras: m.type === 'reply' ? REPLIES[m.from](c, Object.assign({ topics: [], items: '', wrap: 2 }, m.o)) : L.text(c), sign: sd.sign, from: sd.from, date: dateLine(Math.max(0, Math.floor(m.t / DAY) - (HOME_SENDERS.includes(m.from) ? 2 : 0))), note: L && L.note, enc: L && L.enc }; }
function enclose(m) {
  const L = m.key && LETTER_BY_ID[m.key], e = L && L.enc; if (!e || m.e) return null; m.e = 1; let msg = '';
  if (e.kind === 'money') { safe(() => G.money.add(e.n, 'Tucked in a letter from ' + SENDERS[m.from].short)); msg = `+${fmt(e.n)}`; }
  else if (e.kind === 'item') { give(e.id, e.qty || 1); msg = nameOf(e.id); }
  else if (e.kind === 'stamp') { gotStamp(e.id, true); msg = 'Album: ' + STAMP_BY_ID[e.id].name; }
  else if (e.kind === 'photo') { if (safe(() => G.housing.addFurniture('post_photo', { instant: true })) !== true) give('post_photo', 1); msg = 'Photo: The Old Porch (in your home storage: hang it with Decorate)'; }
  else if (e.kind === 'recipe') { const r = (RECIPES || []).find(q => q.learn && !safe(() => G.cooking.knows(q.id))); if (r && safe(() => G.cooking.learn(r.id, 'friend'))) msg = 'Recipe learned: ' + r.name; else { safe(() => G.skills.addXp('cooking', 20)); msg = 'A recipe card (cooking practice)'; } }
  return msg;
}
/** open one piece of mail on paper */
function read(id) {
  const m = S.mail.find(q => q.id === id); if (!m) return null; const was = m.read; m.read = 1; let w = null;
  if (m.type === 'letter' || m.type === 'reply') { const t = text(id), got = enclose(m); w = pic(mailTitle(m), [letterView(t.hand, t, Math.min(330, (window.innerWidth || 390) - 44)), t.note ? el('p', { text: t.note, style: 'margin:8px 6px;font-style:italic;line-height:1.35' }) : null, got ? el('p', { text: 'Enclosed: ' + got, style: 'margin:4px 6px;font-weight:bold;color:#2f6f3f' }) : null, m.type === 'letter' && HOME_SENDERS.includes(m.from) ? el('p', { text: 'Write back from any post-office desk.', style: 'margin:4px 6px;opacity:.7' }) : null], 'letter');
    if (!was) { moodlet('post_letter'); add('social', 10); add('fun', 5); if (m.type === 'reply') stamp('x:post_reply'); if (m.key === 'ada1' && S.chain.st === 4) setChain(5); if ((LETTER_BY_ID[m.key] || {}).ask === 'home_parcel') setGoal2(); } }
  else if (m.type === 'junk') { const j = JUNK_BY_ID[m.key] || { title: 'A flyer', text: '', from: '' }; if (!was && j.coupon) { S.coupons[j.coupon.venue] = { pct: j.coupon.pct, until: G.now().day + 10 }; }
    w = pic(j.title, [el('div', { style: 'background:#fff8e0;border:2px dashed #2a2733;padding:10px;margin:4px;line-height:1.4' }, el('b', { text: j.from }), el('p', { text: j.text, style: 'margin:6px 0 0' })), j.coupon ? el('p', { text: `Coupon clipped: ${j.coupon.pct}% back on your next purchase there (10 days).`, style: 'margin:6px;font-weight:bold;color:#2f6f3f' }) : null, j.place && safe(() => G.places.get(j.place)) ? btn('Take me there', () => { w.close(); safe(() => G.phone.routeTo(j.place)); }) : null], 'junk'); }
  else if (m.type === 'bill') { const d = m.data || { items: [], total: 0 }; w = pic('Your weekly bill', [el('div', { style: 'background:#f4f7f2;border:2px solid #2a2733;padding:10px;margin:4px;font-family:monospace;font-size:12px;line-height:1.5' }, el('b', { text: 'CITY OF MAPLE BAY · STATEMENT' }), ...d.items.map(i => el('div', { style: 'display:flex;justify-content:space-between' }, el('span', { text: i.label }), el('span', { text: fmt(i.amount) }))), el('div', { style: 'display:flex;justify-content:space-between;border-top:1px solid #2a2733;margin-top:4px;font-weight:bold' }, el('span', { text: 'DUE MONDAY 08:00' }), el('span', { text: fmt(d.total) })), d.arrears ? el('div', { text: 'ARREARS: ' + fmt(d.arrears), style: 'color:#c8402e' }) : null),
      'It is taken from your account on Monday morning. Arrears can be paid, and a bill disputed, at window 1 of Permits & Records in City Hall.', btn('Open Bay Bank', () => { w.close(); safe(() => G.phone.open('bank')); }), safe(() => G.places.get('cityhall')) ? btn('Take me to City Hall', () => { w.close(); safe(() => G.phone.routeTo('cityhall')); }) : null], 'bill'); }
  else if (m.type === 'slip') { const p = S.parcels.find(q => q.id === m.data), o = p && officeOf(p.office); w = pic('Sorry we missed you', [slipCanvas({ office: o ? o.name : 'the post office', from: p ? (SENDERS[p.from] ? SENDERS[p.from].name : 'you') : '', until: 'you collect it' }), 'Take the slip to that counter and wait your turn.', o ? btn('Take me there', () => { w.close(); safe(() => G.phone.routeTo(o.room)); }) : null], 'slip'); }
  else if (m.type === 'telegram') w = pic('TELEGRAM', [el('div', { style: 'background:#f6e2a8;border:2px solid #2a2733;padding:10px;margin:4px;font-family:monospace;line-height:1.5', text: m.data })], 'tele');
  if (!was) G.emit('post:read', m); return w;
}
function collect(wh) { const L = waiting(wh); if (!L.length) return L; for (const m of L) { m.got = 1; if (m.type === 'slip') give('post_slip', 1); } S.stats.got += L.length; S.unseen = Math.max(0, S.unseen - L.length); safe(() => G.phone.syncBadge()); G.emit('post:collected', L); syncHome(); return L; }
function showCollected(L) { if (!L.length) return; const first = L.find(m => m.type === 'letter' || m.type === 'reply') || L[0], rest = L.filter(m => m !== first); const w = read(first.id); if (rest.length && w) w.body.append(el('p', { text: `Also in the post: ${rest.map(mailTitle).join('; ')}. Everything is in Maple Post on your phone.`, style: 'margin:8px 6px;opacity:.8' })); }
/* the basket by your own door */
let homeOb = null;
function syncHome() { const sc = G.scene; if (!homeOb || !sc || !sc.world || !sc.world.objs.includes(homeOb)) return; const L = waiting('home'), n = Math.min(4, L.length), slip = L.some(m => m.type === 'slip') ? 1 : 0; if (homeOb.p.n !== n || homeOb.p.slip !== slip) { homeOb.p = { n, slip }; homeOb._key = null; } }
function homeBuild(sc) {
  const h = safe(() => G.housing.current()); if (!h || !sc || sc.roomId !== h.roomId || !sc.world) return; const ex = sc.interactables.find(i => i.exit); if (!ex) return; const W = sc.world; let at = null;
  for (const [dx, dy] of [[-1.7, .1], [1.1, .1], [-1.7, -.3], [1.1, -.3], [-2.5, .1], [1.9, .1], [-1.7, .9], [1.1, .9], [-2.5, .9], [1.9, .9]]) { const x = Math.round((ex.x + dx) * 2) / 2, y = Math.round((ex.y + dy) * 2) / 2; if (x < 1.1 || y < 1.15 || x > W.w - 1.8 || y > W.h - 1.6) continue;
    if (W.isBlocked(x + .3, y + .2) || W.isBlocked(x + .3, y + .7)) continue; if (sc.interactables.some(i => i !== ex && Math.hypot(i.x - x - .3, i.y - y - .2) < 1.05)) continue;
    if (W.objs.some(o => o.B && x + .6 > o.B[0] && x < o.B[3] && y + .4 > o.B[1] && y < o.B[4] && o.B[5] - o.B[2] > .12 && o.solid !== false)) continue; at = { x, y }; break; }
  if (!at) at = { x: Math.max(1.2, ex.x - 1.7), y: Math.max(1.2, ex.y + .1) }; homeOb = safe(() => W.place('furn.postoffice.basket', at.x, at.y, { p: { n: 0, slip: 0 }, solid: false })); if (!homeOb) return;
  sc.interactables.push({ x: at.x + .3, y: at.y + .2, label: 'Mail basket', h: .5, hit: 12, range: 1.5, guestOk: true, use: () => homeMail() }); syncHome();
}
function homeMail() {
  const L = waiting('home'), opts = []; if (L.length) opts.push({ label: `Pick up the post (${L.length})`, sub: L.slice(0, 3).map(mailTitle).join('; '), value: 'get' });
  if (S.held.length) opts.push({ label: `Leave ${S.held.length === 1 ? 'my letter' : 'my ' + S.held.length + ' letters'} for the carrier`, sub: 'Collected on the morning round', value: 'post' });
  opts.push({ label: 'Write a letter here', sub: has('post_paper') ? `Writing paper: ${has('post_paper')} left` : 'Needs Writing Paper & Envelopes', value: 'write' }); opts.push({ label: 'Open Maple Post', value: 'app' });
  return choose('The basket by your door', opts, { text: L.length ? 'There is post.' : 'Nothing today. The carrier comes at half past nine, every day but Sunday.' }).then(v => { if (v === 'get') showCollected(collect('home')); else if (v === 'post') postLetters('home'); else if (v === 'write') desk(null, G.scene, true); else if (v === 'app') safe(() => G.phone.open('post')); });
}
/* P.O. boxes */
function rentBox(k) { const o = officeOf(k); if (!o || o.key === 'down') return false; if (S.pobox && S.pobox.until >= G.now().day && S.pobox.office !== o.key) { toast(`You already rent a box at ${officeOf(S.pobox.office).short}.`, 'info'); return false; } if (!pay(PRICE.pobox, 'P.O. box, ' + o.short, o.room)) return false;
  const n = G.now(), base = S.pobox && S.pobox.until >= n.day ? S.pobox.until : n.day; S.pobox = { office: o.key, no: S.pobox ? S.pobox.no : 7 + (n.day * 5 + o.key.length * 3) % 11, until: base + PRICE.poboxWeeks * 7 }; G.emit('post:box', o.key); toast(`Box ${S.pobox.no + 100} at ${o.short} is yours until ${dateLine(S.pobox.until)}. A small brass key. Your post will wait here from tomorrow.`, 'good', 5200); const sc = G.scene; if (sc && sc.hot && sc.hot.sync) sc.hot.sync(); syncBoxes(); return true; }
function syncBoxes() { const sc = G.scene; if (!inPost(sc)) return; const k = keyOf(sc), b = S.pobox; for (const o of sc.world.objs) if (o.data && o.data.boxes) { const mine = b && b.office === k ? b.no : -1, hasM = b && b.office === k && waiting('pobox').length ? 1 : 0; if (o.p.mine !== mine || o.p.has !== hasM) { o.p = Object.assign({}, o.p, { mine, has: hasM }); o._key = null; } } }
function poBox(sc) { const k = keyOf(sc), o = officeOf(k), b = S.pobox; if (!b || b.office !== k) return choose('P.O. boxes', [{ label: `Rent a box here · ${fmt(PRICE.pobox)}`, sub: `${PRICE.poboxWeeks} weeks. Your post waits here instead of at your door.`, value: 1 }, { label: 'Not today', value: null }], { text: b ? `Your box is at ${officeOf(b.office).short}.` : 'Rows of little brass doors, each with a number and a keyhole. Somebody has had number 114 for fifty years.' }).then(v => { if (v) rentBox(k); });
  const L = waiting('pobox'); if (!L.length) return choose(`Box ${b.no + 100}`, [{ label: `Add ${PRICE.poboxWeeks} weeks · ${fmt(PRICE.pobox)}`, value: 1 }, { label: 'Close the little door', value: null }], { text: `Empty. Paid until ${dateLine(b.until)}.` }).then(v => { if (v) rentBox(k); }); showCollected(collect('pobox')); syncBoxes(); }

/* ---------- outgoing deliveries, incoming parcels (every game minute) ---------- */
const GIFTREL = v => Math.max(3, Math.min(14, Math.round(3 + v / 4)));
function delivered(o) {
  o.st = 'delivered'; const T = S.sentTo[o.to] || (S.sentTo[o.to] = { n: 0 }), nm = toName(o.to);
  if (o.ty === 'home') { if (o.kind === 'parcel') { T.parcel = o.desc; if (o.local && S.homeAsk === 1) { S.homeAsk = 2; safe(() => G.goals.complete(G2)); moodlet('post_package'); toast('The box of Maple Bay things has reached Quarry Road.', 'good', 4600); } } else { T.n++; T.tone = o.tone; }
    const d = TUNE.REPLY_DAYS[0] + ((o.id * 7) % (TUNE.REPLY_DAYS[1] - TUNE.REPLY_DAYS[0] + 1)); S.replies.push({ t: (Math.floor(G.state.t / DAY) + d + 2) * DAY, from: o.to, o: { kind: o.kind, tone: o.tone || 'warm', topics: o.topics || [], items: o.desc || '', n: o.n || 0, wrap: o.wrap === undefined ? 2 : o.wrap, card: o.card ? nameOf(o.card).replace(/^Postcard: /, '') : '', local: o.local || 0 } }); }
  else if (o.ty === 'npc') { const gain = o.kind === 'parcel' ? GIFTREL(o.value || 0) + (o.wrap >= 3 ? 1 : 0) : o.kind === 'card' ? 3 : 4; safe(() => G.social.addRel(o.to, gain)); T.n++;
    safe(() => G.messages.send({ from: o.to, text: o.kind === 'parcel' ? pick([`A PARCEL. With my name on it. ${o.desc.charAt(0).toUpperCase() + o.desc.slice(1)}! You did not have to do that. (I am glad you did.)`, `The carrier just handed me a box from you. ${o.desc.charAt(0).toUpperCase() + o.desc.slice(1)}. Nobody posts things any more. Thank you!`]) : o.kind === 'card' ? 'Your postcard came! It is on my fridge. You live ten minutes away and you sent me a POSTCARD. I love it.' : pick(['I got your letter. An actual letter, in an envelope. I read it twice. Thank you.', 'A letter! From you! With a stamp! I am keeping it.']) })); }
  else if (o.ty === 'self') { S.parcels.push({ id: ++S.seq, from: 'self', label: 'Your own parcel', gives: o.items.map(i => ({ item: i.id, qty: i.qty })), big: 0, t: G.state.t, st: 'due' }); }
  else if (o.ty === 'keeper') { S.replies.push({ t: G.state.t + 2 * DAY, from: 'keeper', key: 'keeper1' }); }
  else if (o.ty === 'bottle') { S.replies.push({ t: G.state.t + DAY, from: 'bottle', key: 'bottle1' }); }
  if (o.ty !== 'self' && o.ty !== 'bottle') notify(`Delivered: your ${o.kind === 'card' ? 'postcard' : o.kind} reached ${nm}.`, { tab: 'sent', out: o.id }, o.kind === 'parcel' ? 'post_parcel' : 'post_letter', 'low'); G.emit('post:delivered', o);
}
const atHome = () => !!safe(() => G.housing.isHome());
function landParcel(p, how) {
  p.st = 'done'; const lab = p.label + (SENDERS[p.from] ? '' : ''); let ok = false;
  if (how !== 'counter' && G.housing && safe(() => G.housing.current())) ok = !!safe(() => { const B = G.housing.boxes(), H = G.state.home; if (B.length >= 8) return false; const b = { uid: 'b' + (H.n++), k: 'd', label: lab.toUpperCase().slice(0, 22), items: [], gives: p.gives.map(g => ({ item: g.item, qty: g.qty })) }; B.push(b); G.emit('home:delivery', b); if (atHome()) G.housing.refresh(); return true; });
  if (!ok) { const got = []; for (const g of p.gives) { const it = ITEM_BY_ID[g.item]; if (!it) continue; got.push(it.name + (g.qty > 1 ? ' x' + g.qty : '')); if (it.category === 'homegood') { if (safe(() => G.housing.addFurniture(g.item, { instant: true })) !== true) give(g.item, g.qty); } else if (give(g.item, g.qty) === false) safe(() => G.inv.fridge.add(g.item, g.qty)); } toast('Opened: ' + got.join(', ') + '.', 'good', 5200); }
  moodlet('post_package'); G.emit('post:parcel', p, how || 'home'); return ok;
}
function parcelStep() {
  const t = G.state.t, n = G.now(); if (!deliveryDay(n) || n.hf < 8 || n.hf >= 19) return;
  for (const p of S.parcels) { if (p.st !== 'due' || p.t > t) continue; const fromN = SENDERS[p.from] ? SENDERS[p.from].name : 'you';
    if (!p.big || atHome()) { const ok = landParcel(p, 'home'); if (ok) { if (atHome()) toast(`A knock at the door: ${p.label.toLowerCase()}. It is by the door; unpack it.`, 'good', 5200); else notify(`${p.label} has been left at your home. Unpack it there.`, { tab: 'inbox' }, 'post_parcel'); } }
    else { p.st = 'slip'; p.office = (homeOffice() || { key: 'main' }).key; S.unseen++; addMail({ type: 'slip', from: 'slip', data: p.id, where: 'home' }); notify(`Sorry we missed you: a parcel from ${fromN} is waiting at ${officeOf(p.office).short}. The slip is in your basket.`, { tab: 'inbox' }, 'post_slip'); G.emit('post:parcel', p, 'slip'); syncHome(); } }
  if (S.parcels.length > 14) S.parcels = S.parcels.filter(p => p.st !== 'done').concat(S.parcels.filter(p => p.st === 'done').slice(-6));
}
function collectParcel(id) { const p = S.parcels.find(q => q.id === id && q.st === 'slip'); if (!p) return false; take('post_slip', 1); landParcel(p, 'counter'); return true; }
function collectAll(k, sc) { const L = S.parcels.filter(p => p.st === 'slip' && p.office === k), o = officeOf(k); if (!L.length) return; return say([{ who: k === 'main' ? 'Clerk Sunita Rao' : o.master, text: `${has('post_slip') ? 'One pink slip, thank you.' : 'No slip? I know your face. Sign here.'} ...here we are. It has been sitting on the shelf looking important.` }]).then(() => { for (const p of L) collectParcel(p.id); }); }
function minutes() {
  const t = G.state.t; for (const o of S.out) if (o.st === 'transit' && o.due <= t) delivered(o); round(); parcelStep();
  if (S.tele && S.tele.t <= t) { const m = S.tele; S.tele = null; S.unseen++; addMail({ type: 'telegram', from: 'tele', data: m.text, where: where() }); notify(`A telegram from ${m.name}: waiting with your post.`, { tab: 'inbox' }, 'post_slip'); syncHome(); }
  const sc = G.scene; if (inPost(sc) && !debug.stay && !G.busy && !G.modal && !sc._postOut) { const o = officeOf(keyOf(sc)), n = G.now(), h = officeHours(o, n), late = !h || n.hf >= h[1] + TUNE.WALKOUT / 60 || n.hf < h[0] - .01; if (late) { sc._postOut = true; toast(`"Closing!" ${o.master} turns the sign round and holds the door for you.`, 'info', 4600); G.go('city', { poi: 'door:' + o.room }).then(() => { sc._postOut = false; }, () => { sc._postOut = false; }); } }
}

/* ---------- little things at the branches ---------- */
const MASTER = {
  maple: { hello: '"Now then, dear. What are we sending?"', lines: ['That is Second Class on the counter. He was a stray. He has never once been in a hurry.', 'I weigh by hand first and by scale second. I am usually right and the scale is usually sulking.', 'The board is the real post office. This counter is only for stamps.', 'Your sister\'s lot are in every Saturday. The little one buys one stamp and licks it very seriously.'] },
  hill: { hello: '"Good day. By post, or by wire?"', lines: ['Hillcrest Post and Telegraph, since 1891. I am Vance. I have the key, the directories and the only sleeve garters in the city.', 'A telegram should cost a little too much. It concentrates the mind.', 'The directories go back to 1890: every street, every householder. Streets change their names. People are slower about it.', 'Elm House, the terraces, the lookout: my carrier does the steps twice a day and has calves like a racehorse.'] },
  harbor: { hello: '"Mornin\'. Boat goes at ten. What have you got?"', lines: ['Dolly Marsh. Skipper of the Petrel and postmistress of this shed. The lighthouse, the boats and the far end of the pier are all mine.', 'I have delivered a birthday cake by boat-hook. It arrived the right way up.', 'The keeper answers every letter. Do not tell the children it takes him all winter.', 'Bottles go out on the ebb. You would be surprised what comes back.'] },
  down: { hello: '"Hi! Postcards, stamps, or where-is-the-lighthouse?"', lines: ['Kenji. I do visitor information and post, which is the same job: people who are a long way from somewhere.', 'Stand in front of the backdrop and I will have you on a postcard in two minutes.', 'The most posted card is the lighthouse. The most BOUGHT card is the otter. Nobody posts the otter. They keep it.', 'The map is to scale. The hills are not. Nobody believes me until they walk to the observatory.'] },
};
function talkMaster(k, sc, c) {
  const o = officeOf(k), M = MASTER[k], opts = [], cs = S.chain.st; if (!o || !M) return;
  if (k === 'hill' && cs === 1) opts.push({ label: 'Ask about "Tannery Steps"', sub: 'The old street directories', value: 'dir' }); if (k === 'harbor' && cs === 2) opts.push({ label: 'Show her the handwriting', sub: 'Blue ink, a ship\'s hand', value: 'hand' }); if (k === 'hill' && cs === 3) opts.push({ label: 'Hand over the undelivered letter', sub: 'For Elm House', value: 'give' });
  opts.push({ label: 'Just saying hello', value: 'chat' }); opts.push({ label: 'I need the counter', sub: 'Join the line', value: 'line' });
  if (opts.length === 2 && cs !== 0) { bubble(c, pick(M.lines), 4600); add('social', 2); return; }
  return choose(o.master, opts, { text: M.hello }).then(v => { if (v === 'chat') { bubble(c, pick(M.lines), 4600); add('social', 2); } else if (v === 'line') counter(sc); else if (v === 'dir') chainDir(o.master); else if (v === 'hand') chainHand(o.master); else if (v === 'give') chainGive(); });
}
function telegram(sc) {
  if (!officeOpen(OFFICE_BY_KEY.hill, G.now()) && !debug.stay) return toast('The key is under its cover. Mr. Vance has gone home.', 'info'); const kn = (safe(() => G.social.known()) || []).filter(q => q && q !== '_anon').slice(0, 10);
  if (!kn.length) return say([{ who: 'Mr. Leopold Vance', text: 'A telegram wants an address, and you do not seem to know anybody in town yet. Come back when you do. I shall keep the key warm.' }]);
  return choose(`Send a telegram · ${fmt(PRICE.telegram)}`, kn.map(id => ({ label: toName(id), value: id })), { text: 'Mr. Vance flexes his fingers. "Ten words. I shall send it while you wait. They will have it within the hour."' }).then(to => { if (!to) return; return choose('What does it say?', [['ARRIVED SAFE STOP TOWN IS GOOD STOP THINKING OF YOU STOP', 'Kind'], ['MEET ME STOP BRING AN APPETITE STOP NO EXCUSES STOP', 'An invitation'], ['THIS COST THREE DOLLARS STOP YOU ARE WORTH IT STOP JUST', 'Funny'], ['NO NEWS STOP WANTED TO SEND A TELEGRAM STOP HELLO STOP', 'For the fun of it']].map(([t, s]) => ({ label: s, sub: t, value: t }))).then(tx => { if (!tx || !pay(PRICE.telegram, 'Telegram', PR.hill)) return;
    teleBusy = 5; if (sc && sc.hot) sc.hot.sync(); G.startActivity({ label: 'Dot dot dash...', anim: 'stand', minutes: 4, rate: 1.4, done: () => { teleBusy = 0; safe(() => G.social.addRel(to, 3)); safe(() => G.messages.send({ from: to, delay: 45, text: pick(['A boy on a bicycle just handed me a TELEGRAM. From you. I thought somebody had died. Nobody has died. It is wonderful.', 'I got your telegram!! I read it out loud in a 1940s voice. STOP.']) })); S.tele = { t: G.state.t + 180, name: toName(to), text: pick(['RECEIVED WITH JOY STOP HOW DOES ONE REPLY TO THESE STOP', 'TELEGRAM RECEIVED STOP YOU ARE RIDICULOUS STOP DINNER SOON STOP']) + ' — ' + toName(to).toUpperCase() }; stamp('x:post_telegram'); add('fun', 8); G.emit('post:telegram', to); toast(`Sent. Mr. Vance blots the form. "They will have it within the hour. One does not get that from a text message. One gets it FASTER, but one does not get THAT."`, 'good', 6200); } }); }); });
}
function bottle(sc) { if (S.bottle && S.bottle.day + 14 > G.now().day) return toast('Your last bottle is still out there somewhere. One at a time; the tide gets confused.', 'info', 4200);
  return choose(`Bottle post · ${fmt(PRICE.bottle)}`, [{ label: 'Write a note to nobody in particular', sub: 'Dolly corks it and it goes out on the ebb', value: 1 }, { label: 'Not today', value: null }], { text: 'A rack of green bottles, a box of corks and a pencil on a string. "No address," says the card. "That is the point."' }).then(v => { if (!v || !pay(PRICE.bottle, 'Bottle post', PR.harbor)) return; S.bottle = { day: G.now().day }; S.replies.push({ t: G.state.t + (6 + G.now().day % 3) * DAY, from: 'bottle', key: 'bottle1' }); stamp('x:post_bottle'); add('fun', 10); moodlet('post_wrote'); G.emit('post:bottle'); toast('You write three lines, roll it up and push in the cork. Skipper Dolly holds it up to the light. "She will float. Ask me in a week."', 'good', 6200); }); }
function keeper(sc) { const on = eventOn('harbor'); if (S.keeper && S.keeper.day + 14 > G.now().day) return toast('You have written to the keeper already this month. The mail boat only goes out once a week.', 'info', 4200);
  return choose('Letters to the lighthouse keeper', [{ label: 'Write to the keeper', sub: 'Free. It goes out on the mail boat', value: 1 }, { label: 'Leave it for the children', value: null }], { text: on ? 'It is Letters to the Lighthouse day: the bench is full of children with their tongues out, writing.' : 'A red box with a lighthouse painted on it. "The keeper answers every one."' }).then(v => { if (!v) return; G.startActivity({ label: 'Writing to the lighthouse', anim: 'work', minutes: TUNE.CARD_MIN, rate: 3, done: () => { S.keeper = { day: G.now().day }; S.replies.push({ t: G.state.t + 3 * DAY, from: 'keeper', key: 'keeper1' }); add('fun', 8); moodlet('post_wrote'); toast('You fold it and post it in the red box. It goes out with the lamp oil and the newspapers.', 'good', 4600); } }); }); }
function cards(sc) { return safe(() => G.shop.open(sc.roomId)) || toast('A rack of postcards: the light, the clock, the otter.', 'info'); }
function photoCard(sc) { if (!pay(PRICE.photocard, 'Photo postcard', PR.down)) return; G.startActivity({ label: 'Say "Maple Bay"...', anim: 'wave', minutes: 2, rate: 1, done: () => { const cv = postcardCanvas('me', 4, safe(() => G.player.sprite().c)); S.cards.me = S.cards.me === undefined ? G.now().day : S.cards.me; give('post_pc_skyline', 1); const R = recipients(false).filter(r => r.type === 'home'); const w = pic('Greetings from Maple Bay', [cv, 'Kenji hands it over, still warm. You, the skyline and the lighthouse. It counts as a postcard: write on the back at the desk and post it.'], 'photo'); for (const r of R.slice(0, 3)) w.body.append(btn(`Send it straight to ${r.name}`, () => { const h = write({ to: r.id, kind: 'card', card: 'post_pc_skyline', topics: ['town'] }); if (h) { h.photo = 1; toast(`Addressed to ${r.name}. It needs a stamp and the posting box by the door.`, 'good', 4200); } w.close(); })); add('fun', 6); } }); }
function cityMap() { const L = offices(); return choose('Map of Maple Bay', L.map(o => ({ label: o.name, sub: (o.open ? 'Open now' : 'Closed') + ' · ' + o.hours.split('.')[0], value: o.room })), { text: 'Five little gold post horns are pinned to the map.' }).then(v => { if (v) safe(() => G.phone.routeTo(v)); }); }
function tide() { const n = G.now(); say([{ who: 'Tide board', text: `High water 06:12, low water 12:40. The mail boat Petrel sails at ten for the lighthouse, the moorings and the pier head. ${n.weekday === 6 ? 'No boat on Sundays.' : n.hf < 10 ? 'She has not gone yet today.' : 'She has gone for today.'}` }]); }
const NOTES = { maple: ['BAKE SALE Saturday, school hall. Lemon drizzle expected. — O.G.', 'LOST: one tortoise ("Gerald"). Walk beside him and tell me where he is going.', 'Knitting circle, Tuesdays, the back room. Bring your own wool and an opinion.', 'WANTED: someone who understands the school boiler.'], hill: ['Residents are reminded that telegrams are delivered BY HAND and the boy is to be tipped.', 'Stargazing at the lookout, clear Fridays. The Observatory lends blankets.', 'FOR SALE: one harpsichord, will not fit down the terrace steps. Buyer collects.', 'The 1890 to 1975 street directories may be consulted on request. Clean hands.'], harbor: ['PETREL sails 10:00 sharp. Post after 09:45 goes tomorrow.', 'Found on the shingle: one bottle, one message, one very small boot. Enquire within.', 'Letters to the Lighthouse: third day of every season, two till five. Pencils provided.', 'Net mending, Thursdays, Sail Loft. Tea. No singing before noon.'], down: ['YOU ARE HERE. The lighthouse is at the far west end of the harbor; the observatory is uphill of everything.', 'Photo postcards: four dollars, two minutes, one smile.', 'Lost property from the tram goes to City Hall, window 5.', 'Stamp Fair: second Saturday of every season, General Post Office, Old Town.'] };
function board(sc) { const k = keyOf(sc), L = NOTES[k] || NOTES.maple, d = G.now().day; pic('Community notice board', L.map((t, i) => el('div', { style: `background:${['#fff8c8', '#ffe0e0', '#e0f0ff', '#e8ffe0'][(i + d) % 4]};border:1px solid #2a2733;padding:6px 8px;margin:6px;transform:rotate(${((i * 37 + d) % 5) - 2}deg);line-height:1.35`, text: t }))); add('fun', 2); safe(() => G.places.discover(PR.main, true)); }
function fair(sc) { if (!fairOn()) return; return choose('The Stamp Fair', [{ label: 'Look through the albums', sub: 'Ten quiet minutes', value: 'look' }, { label: 'Buy the fair overprint', sub: 'Today only, at the philately counter', value: 'buy' }]).then(v => { if (v === 'look') G.startActivity({ label: 'Leafing through albums', anim: 'read', minutes: 10, rate: 4, done: () => { add('fun', 12); safe(() => G.skills.addXp('knowledge', 6)); toast('Penny blacks, triangle capes and a whole page of misprinted otters. The dealer watches your fingers like a hawk.', 'good', 4600); } }); else if (v === 'buy') stampShop('main'); }); }
function glass(sc) { const w = pic('Through the glass', ['Pigeonholes to the ceiling, a belt of parcels sliding by, and three sorters reading addresses at a speed you can hardly follow.']); w.body.append(btn('Go round to the gallery', () => { w.close(); G.go('int:' + PR.sort, { x: O + 11, y: O + 11.2, dir: 3 }); })); }
function watchSort(sc) { G.startActivity({ label: 'Watching the sorters', anim: 'stand', minutes: TUNE.WATCH_MIN, rate: 2.5, done: () => { add('fun', 10); toast(pick(['Harbor, Old Town, Hillcrest: each parcel in the right bin without a glance. You could watch it all day.', 'A van backs up to the dock, beeping. Six sacks go in before you have counted three.']), 'good', 4200); } }); }
function wall(sc) { say([{ who: 'Friends of the Post', text: S.wall ? `Five photographs in gilt frames: a carrier, a postmistress, the man who tied the tidiest bag on the line... and, in the middle, you. The brass plate says: "${who()}. Carried one the last mile."` : 'Four photographs in gilt frames and one empty one with a question mark. The brass plate under it is blank.' }]); }

/* ---------- the chain: the letter that waited ---------- */
const GTEXT = ['', 'The undelivered letter: look up "Tannery Steps" in the City Hall archive', 'The undelivered letter: ask the old-timer at the harbor whose handwriting it is', 'The undelivered letter: take it to Mr. Vance at Hillcrest Post & Telegraph', 'The undelivered letter: it goes out on the Hillcrest round tomorrow morning', 'The undelivered letter: tell Postmaster Fairweather'],
  GHINT = ['', 'Tannery Steps is on no modern map. The City Archive (basement of City Hall) keeps the old street index; so does Mr. Vance at the Hillcrest post office.', 'Blue ink, a ship\'s hand, "E.T." The Captain is usually on the pier; Skipper Dolly at the Harbor Mail Boat Office knows every hand on the quay.', 'Miss Lindqvist lives at Elm House now. The Hillcrest round delivers there.', 'Check the basket by your door after the morning round (09:30).', 'He is by the philately counter in the General Post Office.'];
function setGoal() { if (!G.goals) return; safe(() => { const c = S.chain, g = G.goals.get(G1); if (c.st >= 1 && c.st <= 5) { const text = c.st === 1 && !G.cityhall ? 'The undelivered letter: ask Mr. Vance at Hillcrest about "Tannery Steps"' : GTEXT[c.st], placeId = c.st === 1 ? (G.cityhall ? 'cityhall' : PR.hill) : c.st === 2 ? PR.harbor : c.st === 3 ? PR.hill : c.st === 5 ? PR.main : undefined; if (g) { g.text = text; g.hint = GHINT[c.st]; g.placeId = placeId; G.emit('goals:change'); } else G.goals.add({ id: G1, text, group: 'opportunity', placeId, hint: GHINT[c.st] }); } else if (c.st >= 6 && g && !G.goals.isDone(G1)) G.goals.complete(G1); }); }
function setGoal2() { if (!G.goals || S.homeAsk !== 1) return; safe(() => { if (!G.goals.get(G2)) G.goals.add({ id: G2, text: 'Send a parcel of Maple Bay things back home', group: 'opportunity', placeId: PR.main, hint: 'Dad asked: a postcard of the lighthouse, something to eat, anything with the town\'s name on it. Pack it at a packing table, wrap it, and take it to a counter. It must hold at least one thing from Maple Bay.' }); }); }
function setChain(n) { S.chain.st = n; if (n === 4) S.chain.day = G.now().day; setGoal(); G.emit('post:chain', n); const sc = G.scene; if (sc && sc.hot && sc.hot.sync) sc.hot.sync(); return n; }
function chainStart() { if (S.chain.st !== 0) return false; give('post_deadletter', 1); setChain(1);
  say([{ who: 'Postmaster Fairweather', text: 'Every post office of any age has a drawer like this one. Letters we could not deliver, and could not bear to burn.' }, { who: 'Postmaster Fairweather', text: 'This is the oldest. "Miss Ada Lindqvist, The Blue Door, Tannery Steps, Maple Bay." Posted fifty-eight years ago, at this very counter. Stamped NO SUCH STREET the next morning, which was a lie: there WAS such a street. We had simply renamed it that week and nobody told the sorters.' }, { who: 'Postmaster Fairweather', text: 'I have looked at it every day for thirty years. I am too old for the stairs in the City Archive, and my carriers are too busy. You have the look of someone who finishes things. Find out where Tannery Steps went. Take it.' }]); return true; }
function master(sc, c) {
  const cs = S.chain.st; if (cs === 0) return choose('Postmaster Fairweather', [{ label: 'What is in the dead-letter drawer?', value: 'dead' }, { label: 'Tell me about this place', value: 'chat' }], { text: '"Augustin Fairweather. Thirty-one years behind this counter. Stamps? Or are you one of the curious ones?"' }).then(v => { if (v === 'dead') chainStart(); else if (v === 'chat') say([{ who: 'Postmaster Fairweather', text: 'Built in 1898. A hundred and eighty brass boxes, four windows and one clock, which is two minutes fast on purpose so that nobody misses the last collection. The sorting floor is through that doorway; you may watch from the gallery. Most people stay longer than they meant to.' }]); });
  if (cs === 5) return chainEnd(c);
  if (cs >= 1 && cs <= 4) return say([{ who: 'Postmaster Fairweather', text: cs === 1 ? 'The City Archive keeps the old street index, in the basement of City Hall. Failing that, Vance up at Hillcrest hoards directories like a dragon.' : cs === 2 ? 'Lantern Row, was it? I might have known. And the hand: blue ink, that slope... a ship\'s hand. Ask along the harbor. The old-timers know each other\'s writing.' : cs === 3 ? 'Elias Thorne. Well, well. Take it up to Vance: Elm House is on his round. It should arrive by POST, properly, as it was meant to.' : 'Tomorrow morning, then. I shall not sleep.' }]);
  return say([{ who: 'Postmaster Fairweather', text: pick(['The drawer is one letter lighter. I open it every morning to make sure.', `The ${STAMP_BY_ID[S.comm] ? STAMP_BY_ID[S.comm].name : 'commemorative'} stamp is selling very nicely. You have an eye.`, 'Miss Lindqvist came in herself last week. To buy stamps. "I have a great deal of writing to catch up on," she said.']) }]);
}
function deadCabinet(sc) { if (S.chain.st === 0) return choose('The dead-letter cabinet', [{ label: 'Ask the Postmaster about them', sub: 'He is in the hall, by the stamps', value: 1 }, { label: 'Leave them be', value: null }], { text: 'Behind glass: a dozen envelopes nobody could deliver. Faded ink, old stamps, streets that are not on any map. The oldest is addressed to "Miss Ada Lindqvist, The Blue Door, Tannery Steps".' }).then(v => { if (v) toast('Postmaster Fairweather is in the main hall, at the philately counter.', 'info', 4200); });
  say([{ who: 'The dead-letter cabinet', text: S.chain.st >= 6 ? 'One gap in the row, with a small card: "DELIVERED. 58 years. With our apologies and our thanks."' : 'There is a gap in the row where the Lindqvist letter was. The others wait.' }]); }
function chainArchive() { if (S.chain.st !== 1) return; say([{ who: 'The street index, 1890 to 1975', text: 'T... Tallow Lane... Tanner\'s Yard... here. "TANNERY STEPS. The stair from Quay Street up to the old tannery. Renamed LANTERN ROW (the Steps end) by order of council. All householders renumbered."' }, { who: 'The street index, 1890 to 1975', text: 'And in pencil, in the margin: "Blue Door = No. 9. Lindqvist family removed to the harbor side the same year." So the street was there all along, and the family had moved. Somebody on the harbor will know the rest.' }]).then(() => setChain(2)); }
function chainDir(nm) { say([{ who: nm, text: 'Tannery Steps! There is a name. One moment... 1960 directory... "Tannery Steps, see Lantern Row." They renamed it in the same week your letter was posted. A sorter with a new list and an old envelope: it happens.' }, { who: nm, text: '"No. 9, the Blue Door: Lindqvist, A., seamstress." And then nothing: the family moved harborside. As for the sender, that is a ship\'s hand if ever I saw one. Ask on the quay.' }]).then(() => setChain(2)); }
function chainHand(nm) { say([{ who: nm, text: 'Give it here. ...Oh. Oh, I know that hand. That is Elias Thorne. The Captain. He signed for his post in that blue ink for forty years.' }, { who: nm, text: 'Ada Lindqvist. She is up at Elm House now, in Hillcrest. Sharp as a marlinspike. The two of them have nodded at each other across this harbor for half a century and never said a word. I always wondered.' }, { who: nm, text: 'Do not hand it to her yourself. It was posted, so it should ARRIVE. Elm House is on Vance\'s round. Take it up the hill.' }]).then(() => setChain(3)); }
function chainCaptain() { if (S.chain.st !== 2 || !has('post_deadletter')) return; say([{ who: 'The Captain', text: 'What have you got there? ...Where did you get that.' }, { who: 'The Captain', text: 'That is my hand. That is my letter. I wrote that the night before the Corriveau sailed, by a hurricane lamp, and I posted it myself at the big office in Old Town.' }, { who: 'The Captain', text: 'She never had it? All these years I thought... never mind what I thought. She is at Elm House, up in Hillcrest. Do NOT give it to me. It is hers. Take it to the Hillcrest post office and let it come through her door the way it was meant to.' }]).then(() => setChain(3)); }
function chainGive() { if (S.chain.st !== 3) return; take('post_deadletter', 1); say([{ who: 'Mr. Leopold Vance', text: 'Fifty-eight years. Good heavens. Give it to me.' }, { who: 'Mr. Leopold Vance', text: 'I shall cancel the old mark, so, and strike a new one, so. "DELIVERED LATE. WITH THE APOLOGIES OF THE POST OFFICE." And it goes in the Elm House bundle, on top, for the first round tomorrow. I shall carry it up the steps myself.' }, { who: 'Mr. Leopold Vance', text: 'You will hear, I expect. People generally write back.' }]).then(() => setChain(4)); }
function chainEnd(c) {
  say([{ who: 'Postmaster Fairweather', text: 'She wrote to you. Of course she did. ...He took his cap off? He took his CAP off.' }, { who: 'Postmaster Fairweather', text: 'Thirty years I have looked at that envelope. Come here. Stand there. No, in the light.' }, { who: 'Postmaster Fairweather', text: 'Your photograph goes on the Friends of the Post wall, in this hall and at every branch. And one more thing. We issue a commemorative stamp this year, and the Postmaster chooses the picture. I should like you to choose it.' }])
    .then(() => choose('The commemorative stamp', LANDMARK_CHOICES.map(([id, nm]) => ({ label: nm, value: id, icon: stampCanvas('comm', 2, { comm: id }) })), { text: 'Which of Maple Bay\'s landmarks goes on the stamp?' })).then(v => { S.comm = v || 'l_light'; S.wall = true; S.stamps.comm = (S.stamps.comm || 0) + 3; gotStamp('comm', true); safe(() => G.money.add(TUNE.REWARD, 'Postmaster\'s reward')); moodlet('post_hero'); (G.state.flags || (G.state.flags = {})).post_friend = true; stamp('x:post_dead'); setChain(6); G.emit('post:comm', S.comm);
      toast(`The Maple Bay commemorative: ${STAMP_BY_ID[S.comm].name}. Three for your album, ${fmt(TUNE.REWARD)}, and your face in a gilt frame. It goes on sale at every counter tomorrow.`, 'good', 9000); });
}

/* ---------- coupons ---------- */
function onBuy(itemId, qty, venueId) { const c = S.coupons[venueId]; if (!c || c.until < G.now().day) return; const it = ITEM_BY_ID[itemId]; if (!it || !it.price) return; delete S.coupons[venueId]; const back = Math.max(.25, Math.round(it.price * (qty || 1) * c.pct / 100 * 4) / 4); safe(() => G.money.add(back, 'Coupon from the post')); toast(`Coupon: ${fmt(back)} back.`, 'good', 3200); }

function patchGuide() { for (const o of OFFICES) { const e = safe(() => G.guide.get('place:' + o.room)); if (!e) continue; e.blurb = o.blurb; e.type = 'Post office'; e.chapter = 'services'; e.price = `Stamps from ${fmt(1)} · parcels from ${fmt(4)}`; const T = ['post', 'post office', 'mail', 'stamps', 'parcel', 'letters', 'postcards'].concat(o.key === 'main' ? ['restroom', 'sorting', 'philately'] : []); e.tags = (e.tags || []).filter(t => !T.includes(t)).concat(T);
  e.tryThis = o.key === 'main' ? ['Write home at the desk with the pens on chains', 'Pack a parcel, wrap it, take a number and have it weighed', 'Start a stamp album at the philately counter', 'Watch the sorting floor from the gallery', 'Rent a brass P.O. box', S.chain.st >= 6 ? 'Find your photograph on the Friends of the Post wall' : 'Ask the Postmaster about the dead-letter drawer'] : o.key === 'hill' ? ['Send a telegram from the brass key', 'Join the line at the counter', 'Read the notice board'] : o.key === 'harbor' ? ['Send a message in a bottle', 'Write to the lighthouse keeper', 'Read the tide board'] : o.key === 'down' ? ['Get a photo postcard with you on it', 'Spin the postcard racks', 'Find every post office on the wall map'] : ['Join the line on pension day', 'Read the notice board that knows everything', 'Sit in the rocking chair']; e.when = o.key === 'main' && fairOn() ? 'The Stamp Fair is on now' : ''; } }

export function init() {
  S = G.defineState('post', fresh); st();
  G.on('load', () => { st(); setGoal(); setGoal2(); syncHome(); });
  G.post = {
    offices, office: k => { const o = officeOf(k); return o ? offices().find(q => q.key === o.key) : null; }, nearest, homeOffice, isOpen: k => { const o = officeOf(k); return !!o && officeOpen(o, G.now()); }, enter, arrived, look, fairOn, eventOn, teleOn: () => teleBusy > 0,
    queue: { state: qState, take: qTake, canServe }, takeNumber, wait, window: windowUse, counter, service,
    stamps: { owned: () => Object.assign({}, S.stamps), count: stampCount, album: () => Object.assign({}, S.album), onSale, buy: buyStamp, use: useStamp, all: () => STAMPS, sets: () => STAMP_SETS }, philately, stampShop, covers: () => Object.assign({}, S.covers), postcards: () => Object.assign({}, S.cards), coverToday,
    compose, write, held: () => S.held.slice(), recipients, letterParts, postLetters, desk, pack, packItems, packed: () => S.packed, unpack, wrapGame, sendParcel, sendFlow, quote, out: () => S.out.slice(), track: id => S.out.find(o => o.id === id) || null, toName,
    mail: () => S.mail.slice(), inbox: () => S.mail.filter(m => m.got), waiting, collect, read, text, title: mailTitle, unseen: () => S.unseen, seen: () => { S.unseen = 0; safe(() => G.phone.syncBadge()); }, homeMail, poBox, rentBox, box: () => S.pobox,
    round, deliverNow: () => { for (const o of S.out) if (o.st === 'transit') { o.due = G.state.t; delivered(o); } }, parcels: () => S.parcels.slice(), collectParcel, coupons: () => Object.assign({}, S.coupons),
    telegram, bottle, keeper, cards, photoCard, cityMap, tide, board, fair, glass, watchSort, wall, master, talkMaster, chain: () => S.chain, chainStart, deadCabinet, homeAsk: () => S.homeAsk, carriers: () => (C ? C.car : []), city: () => C, sender: id => SENDERS[id],
    stats: () => Object.assign({ stamps: Object.keys(S.album).length, held: S.held.length, transit: S.out.filter(o => o.st === 'transit').length, chain: S.chain.st }, S.stats),
    debug: Object.assign(debug, { setChain: n => { if (n >= 1 && n <= 3 && !has('post_deadletter')) give('post_deadletter', 1); return setChain(n); }, mail: id => { const e = deliverLetter(id); S.unseen++; syncHome(); return e; }, parcelIn: (label, gives, big) => { const p = { id: ++S.seq, from: 'june', label: label || 'A box', gives: gives || [{ item: 'post_jam', qty: 1 }], big: big ? 1 : 0, t: G.state.t, st: 'due' }; S.parcels.push(p); return p; }, archive: chainArchive, captain: chainCaptain }),
  };
  G.addSystem({ name: 'post', update(dt) { cityTick(dt); if (teleBusy > 0) teleBusy -= dt; } });
  G.on('minutes', () => { try { minutes(); } catch (e) { console.warn('post', e); } });
  G.on('room:build', sc => { if (inPost(sc) && !built) safe(() => ensure(getCity())); try { homeBuild(sc); } catch (e) { console.warn('post home', e); } if (inPost(sc)) setTimeout(syncBoxes, 0); });
  G.on('scene', (s, prev) => { if (s && s.id === 'city' && s.world) { try { wire(s); } catch (e) { console.warn('post', e); } setGoal(); setGoal2(); } if (prev && prev.roomId === PR.main && !(s && inPost(s)) && S.q.served) S.q = {}; if ((inPost(s) || inPost(prev)) && G.state.nav && G.state.nav.edges) for (const k of [PR.main, PR.sort]) delete G.state.nav.edges['int:' + k]; syncHome(); if (inPost(s)) syncBoxes(); });
  G.on('places:built', () => { for (const o of OFFICES) { const pl = G.places && G.places.get(o.room); if (pl) { pl.open = () => officeOpen(o, G.now()); if (!pl.blurb) pl.blurb = o.blurb; } } });
  G.on('guide:rebuilt', patchGuide); G.on('bills:soon', () => { S.bill = 1; }); G.on('shop:buy', onBuy);
  G.on('social:talk', id => { if (id === 'captain') setTimeout(chainCaptain, 600); });
  G.on('home:unpack', b => { if (b && b.gives && b.gives.some(g => g.item === 'post_scarf')) { const sc = Object.values(ITEM_BY_ID).find(i => /scarf/i.test(i.id) && i.id !== 'post_scarf' && i.category !== 'gift' && i.category !== 'misc'); if (sc) safe(() => G.wardrobe.add(sc.id, true)); } });
  // the mailbox walls of the apartment lobbies take your letters too; the City Archive's shelves and map case hold the old street index
  registerFixture('lobby_mail', (fx, sc) => ({ label: 'Post your letters', visible: () => S.held.length > 0, use: () => postLetters('lobby') }));
  for (const t of ['ch_mapcase']) registerFixture(t, (fx, sc) => (sc.roomId === 'cityhall_archive' ? { label: 'Old street index: look up "Tannery Steps"', visible: () => S.chain.st === 1, use: () => chainArchive() } : null));
  setGoal(); setGoal2();
}
