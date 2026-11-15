// Bay Fish Hall — gameplay for the harbor fish market, converted in place from the existing building `bld.harbor.fishmarket` on the boardwalk (nothing in the city layout is touched).
// Room: scenes/rooms/fishmarket.js (`fishmarket`, 34 x 22). Mini-games: scenes/rooms/fishmarket_mini.js. Data: data/fishmarket.js. Art: art/showpiece/fishmarket.js, fishmarket_stalls.js, _fish_lib.js, _fish_icons.js.
//
// City (once per city world, order 57 = before places / stalls / addresses): a door poi `door:fishmarket` (type door, room 'fishmarket', showpiece) in front of the hall's double doors + its interactable; the old walk-up
//   "Old Town Market" counter that sim/stalls.js put on this building is re-pointed at the hall. G.places id 'fishmarket'. Hours 05:00-19:00 daily (walk-out 19:20); auction 05:30-07:30; stalls from 07:00/07:30; hot food 10:00-19:00.
// G.fishmarket = {
//   isOpen(), enter(), door(), festival() -> bool, catch() -> { boats, wx, of: { id: { level, t, mult, fresh } }, top, lines }, price(itemId, stallId) -> $, stallLines(stallId) -> [chalk lines],
//   stall(stallId) -> Promise (the stall menu), buy(stallId, itemId, mode?: 'here' | 'go') -> bool, talk(stallId, char), talkDusty(c), talkAuctioneer(c),
//   lots() -> [{ n, name, sp, give, retail, start, floor, rival, boat, sold: who | null, soldT }], bid(lotIndex?, quality?) -> Promise<{ won, price, lot } | null> (quality given = skip the clock; 0 = lose),
//   askThrow(quality?) -> Promise<bool> (catch the thrown salmon), shuck(quality?) -> Promise<n opened | null>, fillet(quality?) -> Promise<score | null>, sample(kind) -> bool, recipe() -> recipeId | null,
//   stamps() (the stamp book window), stampsGot() -> { species: 1 }, see([species]) -> n new, tank(), ice(scene), board(), scale(), quay(i), pet(cat), pennant() -> name | null,
//   mini: { state(), act(), auto(q) }, arrived(scene, prev), stats() }
// State: G.state.fishmarket = { visits, lastDay, wx: { day, kind }, lotDay, sold: { n: { who, t } }, wins, bestBuy, catches, throws, shuckBest, shucks, fillets, seen: { species: day }, bookDone, samples: { kind: day }, recipeDay, pets, spent }
// Events: 'fishmarket:visit'(first), ':buy'(itemId, stallId, price), ':lot'(n, who, price), ':win'(lot, price), ':catch'(ok), ':shuck'(n), ':fillet'(score), ':stamp'(species), ':book', ':recipe'(id), ':sample'(kind).
// Guide stamps: x:fm_visit, x:fm_auction, x:fm_catch, x:fm_shuck, x:fm_stamps.
// Tuning: data/fishmarket.js HOURS / CATCH levels / lotsOf; THROW window 0.70-0.98 of the flight; SHUCK fee $3, prize $10 for 6/6 (x2 on festival day); FILLET fee $5 (free with your own knife), xp 20 + 45 x score.
import { G } from '../core/game.js';
import { el, toast, bubble, say, choose, modal, pixCanvas } from '../ui/kit.js';
import { ITEM_BY_ID } from '../data/items.js';
import { FM, NAME, HOURS, STALLS, STALL_BY_ID, CATCH, BOATS, RECIPE_OF, catchOf, priceOf, weightOf, lotsOf, isFestival } from '../data/fishmarket.js';
import { FISH_ICONS } from '../art/showpiece/_fish_icons.js';
import { SPECIES, SPECIES_IDS, stamp as stampPix } from '../art/showpiece/_fish_lib.js';
import { ICONS } from '../art/icons/icons.js';
import { CORE, CORE_BLURB, EXPERIENCES } from './_guide_data.js';
import { getCity } from '../world/_city.js';
import { enterRoom, exitRoom } from '../scenes/interior.js';
import { pixSprite } from '../engine/sprites.js';
import { PW } from '../engine/raster.js';
import { MINI, clockGame, sweepGame, floatButton } from '../scenes/rooms/fishmarket_mini.js';

export const order = 57;
for (const k in FISH_ICONS) if (!ICONS[k]) ICONS[k] = FISH_ICONS[k];
const DOOR = 'door:fishmarket', BLD = 'bld.harbor.fishmarket', RIVALS = ["Marlowe's", 'The Gilded Gull', 'Chowder Pot', 'Tide & Rice', 'the Grand Maple kitchen', 'Big Blue', 'Noodle Bar Haru'];
CORE.fishmarket = ['shop', 'Fish market hall', 'bag', ['eat', 'sights']];
CORE_BLURB.fishmarket = 'The iron-and-glass fish hall on the harbor boardwalk. Boats unload at its quay doors before dawn, the catch goes under the falling auction clock at half past five, and a dozen stalls sell it off crushed ice all day: whole fish, crab, oysters shucked to order, kippers, chowder. Twice an hour somebody throws a salmon across the aisle.';
for (const x of [
  { id: 'x:fm_visit', title: 'Into the Fish Hall', group: 'Around town', glyph: 'bag', place: 'place:fishmarket', need: 'fishmarket', blurb: 'Walk the wet floor of the Bay Fish Hall and read the catch board by the door.' },
  { id: 'x:fm_auction', title: 'Stop the Clock', group: 'Big days out', glyph: 'bell', place: 'place:fishmarket', need: 'fishmarket', blurb: 'Be at the Bay Fish Hall between 05:30 and 07:30 and win a lot at the dawn auction.' },
  { id: 'x:fm_catch', title: 'Nice Catch', group: 'Big days out', glyph: 'bag', place: 'place:fishmarket', need: 'fishmarket', blurb: 'Stand on the yellow fish painted on the floor and catch the salmon Dusty throws.' },
  { id: 'x:fm_shuck', title: 'The Oyster Derby', group: 'Around town', glyph: 'cup', place: 'place:fishmarket', need: 'fishmarket', blurb: 'Open five oysters or more against the clock at the Bay Fish Hall.' },
  { id: 'x:fm_stamps', title: 'Species of the Bay', group: 'Big days out', glyph: 'bag', place: 'place:fishmarket', need: 'fishmarket', blurb: 'Fill the fish stamp book: look at every stall on the ice until you have all twenty-four.' },
]) if (!EXPERIENCES.some(e => e.id === x.id)) EXPERIENCES.push(x);

let S = null, built = null, door = null;
const st = () => { S = G.state.fishmarket || (G.state.fishmarket = {}); for (const [k, v] of [['sold', {}], ['seen', {}], ['samples', {}], ['wx', { day: -1, kind: 'clear' }]]) if (!S[k]) S[k] = v; for (const k of ['visits', 'wins', 'catches', 'throws', 'shuckBest', 'shucks', 'fillets', 'pets', 'spent']) S[k] = S[k] || 0; for (const k of ['lastDay', 'lotDay', 'recipeDay']) if (S[k] === undefined) S[k] = -1; return S; };
const fmt = n => (G.money && G.money.fmt ? G.money.fmt(n) : '$' + n);
const safe = fn => { try { return fn(); } catch (e) { return undefined; } };
const gstamp = id => safe(() => G.guide && G.guide.stamp && G.guide.stamp(id));
const pick = a => a[Math.floor(Math.random() * a.length)];
const add = (k, v) => safe(() => G.needs.add(k, v)), xp = (k, v) => safe(() => G.skills.addXp(k, v)), moodlet = (id, h) => safe(() => G.needs.addMoodlet(id, h));
const sfx = n => safe(() => G.audio && G.audio.sfx && G.audio.sfx(n));
const inH = (h, r) => h >= r[0] && h < r[1], clock = h => String(Math.floor(h)).padStart(2, '0') + ':' + String(Math.round((h % 1) * 60)).padStart(2, '0');
const scene = () => (G.scene && G.scene.roomId === FM.room ? G.scene : null);
const isOpen = () => inH(G.now().hf, HOURS.hall);
const festival = () => { const n = G.now(); return isFestival(n) && inH(n.hf, HOURS.festival); };
const chain = () => safe(() => G.lighthouse && G.lighthouse.chain && G.lighthouse.chain()) || { st: 0 };

/* ---------- the daily catch ---------- */
function wxOf(day) { const S = st(); if (S.wx.day !== day) { let kind = 'clear'; const f = safe(() => G.weather.forecast(day - G.now().day)); if (Array.isArray(f) && f[4] && f[4].kind) kind = f[4].kind; else if (G.state.weather) kind = String(G.state.weather); S.wx = { day, kind: /storm/.test(kind) ? 'storm' : /fog/.test(kind) ? 'fog' : /snow/.test(kind) ? 'snow' : /rain/.test(kind) ? 'rain' : /cloud/.test(kind) ? 'cloudy' : 'clear' }; } return S.wx.kind; }
const today = () => { const d = G.now().day; return catchOf(d, wxOf(d)); };
const price = (itemId, stallId) => { const d = G.now().day; return priceOf(itemId, stallId, d, wxOf(d), festival()); };
function stallLines(stallId) { const s = STALL_BY_ID[stallId]; if (!s) return []; return s.sells.filter(q => ITEM_BY_ID[q.id]).slice(0, 2).map(q => { const p = price(q.id, stallId), ps = '$' + (Number.isInteger(p) ? p : p.toFixed(1)), w = (q.catch ? CATCH.find(c => c.id === q.catch).name : ITEM_BY_ID[q.id].name.split(' ').pop()).toUpperCase().slice(0, 8 - ps.length); return w + ' ' + ps; }); }

/* ---------- city: the door ---------- */
function ensure(w) {
  if (built === w || !w || !Array.isArray(w.objs)) return; built = w; const ob = w.objs.find(o => o.id === BLD); if (!ob) return;
  door = w.pois.find(p => p.id === DOOR);
  if (!door) { const B = ob.B, dr = ob.a.door || { at: 1.5 }, free = (x, y) => !w.isBlocked(x, y); let sp = null;
    for (const out of [.75, 1.25, 1.75]) { for (const off of [0, .5, -.5, 1]) { const a = ob.flip ? { x: B[3] + out, y: B[1] + dr.at + off, dir: 0 } : { x: B[0] + dr.at + off, y: B[4] + out, dir: 1 }; if (free(a.x, a.y)) { sp = a; break; } } if (sp) break; }
    if (!sp) return; door = w.poi({ type: 'door', id: DOOR, room: FM.room, name: NAME, x: Math.round(sp.x * 2) / 2, y: Math.round(sp.y * 4) / 4, dir: sp.dir, district: (w.districtAt && w.districtAt(sp.x, sp.y)) || 'harbor', showpiece: true }); }
  door.bld = ob;
}
function wire(s) {
  ensure(s.world); if (!door) return;
  if (!s.interactables.some(it => it.poi === door)) s.interactables.push({ x: door.x, y: door.y, label: NAME, h: 1.2, range: 1.3, poi: door, use: () => enter() });
  // stalls.js (order 60) hangs a walk-up counter on this building after us: re-point it at the hall once every 'scene' handler has run
  const fix = () => { const B = door.bld && door.bld.B; if (!B) return; for (const it of s.interactables) if (!it.poi && !it._fm && it.x > B[0] && it.x < B[3] && it.y > B[1] && it.y < B[4] && it.spot) { it._fm = true; it.label = NAME; it.use = () => enter(); } };
  Promise.resolve().then(fix); setTimeout(fix, 0);
}
function enter() {
  if (!isOpen()) { toast(`${NAME}: shut. The doors open at ${clock(HOURS.hall[0])} for the auction and close at ${clock(HOURS.hall[1])}. A gull is guarding the step.`, 'info', 4200); return false; }
  enterRoom(FM.room, DOOR); return true;
}
function arrived(sc, prev) {
  const S = st(), n = G.now(), first = !S.visits; if (S.lastDay !== n.day || first) S.visits++; S.lastDay = n.day; safe(() => G.places.discover(FM.place, true)); G.emit('fishmarket:visit', first); gstamp('x:fm_visit'); moodlet('sea_air');
  if (first) { safe(() => G.inv.add('fm_stampbook', 1, { silent: true })); toast('Ice, salt and a wet floor. Somebody presses a little blue stamp book into your hand: "Species of the Bay. Look at every stall."', 'good', 6000); }
  else if (festival()) toast('Quayside Seafood Festival: every stall is fifteen percent off today and the Oyster Derby pays double.', 'good', 4600);
  else if (inH(n.hf, HOURS.auction)) toast('The auction is on: lots on the floor by the quay doors. Tap the rostrum or a crate to bid.', 'info', 4600);
}

/* ---------- species stamps ---------- */
function see(list) {
  const S = st(), got = []; for (const id of list || []) if (SPECIES[id] && !S.seen[id]) { S.seen[id] = G.now().day; got.push(id); G.emit('fishmarket:stamp', id); }
  if (got.length) { const n = Object.keys(S.seen).length; toast(`Stamp book: ${got.map(id => SPECIES[id].name).join(', ')} (${n}/${SPECIES_IDS.length}).`, 'good', 3800); sfx('page');
    if (n >= SPECIES_IDS.length && !S.bookDone) { S.bookDone = G.now().day; gstamp('x:fm_stamps'); safe(() => G.money.add(40, 'Species of the Bay: a full stamp book')); safe(() => G.inv.add('fm_float', 1)); moodlet('inspired'); G.emit('fishmarket:book'); toast('The stamp book is FULL: all twenty-four. Basia rings the auction bell for you. $40 from the Fish Hall Association and a glass net float.', 'good', 8000); }
    const sc = scene(); if (sc && sc.fm) sc.fm.sync(); }
  return got.length;
}
const specCanvas = (id, on) => { const s = SPECIES[id], w = s.map.reduce((a, r) => Math.max(a, r.length), 0), h = s.map.length, spr = pixSprite('fmbook' + id + (on ? 1 : 0), [-13, -6, 13, 6], () => { const q = PW(0, 0, 0); stampPix(s.map, on ? s.pal : {}, Math.round(q[0]) - (w >> 1), Math.round(q[1]) - (h >> 1), on ? {} : { ol: '#9a9488' }); }); return pixCanvas(spr.c, 3); };
function stamps() {
  const S = st(), n = Object.keys(S.seen).length, m = modal({ title: `Species of the Bay · ${n}/${SPECIES_IDS.length}`, cls: 'fm-book' });
  m.body.append(el('p', { text: n >= SPECIES_IDS.length ? 'Every stamp. The book is full.' : 'A stamp for every kind of seafood you have looked at on the ice. Visit the stalls (and the lobster tank).', style: 'margin:2px 6px 8px;line-height:1.3' }));
  const grid = el('div', { style: 'display:grid;grid-template-columns:repeat(auto-fill,minmax(104px,1fr));gap:6px;max-height:56vh;overflow:auto;padding:2px' });
  for (const id of SPECIES_IDS) { const on = !!S.seen[id], c = el('div', { style: 'border:2px solid #2a2733;background:' + (on ? '#eaf6fb' : '#e6dfd0') + ';padding:4px;text-align:center;font-size:11px;line-height:1.2', title: on ? SPECIES[id].note : '' }); let cv = null; try { cv = specCanvas(id, on); } catch (e) { } if (cv) c.append(cv); c.append(el('div', { text: on ? SPECIES[id].name : '? ? ?', style: 'font-weight:bold' })); if (on) c.append(el('div', { text: SPECIES[id].note, style: 'font-size:10px;opacity:.85' })); grid.append(c); }
  m.body.append(grid); return m;
}

/* ---------- stalls ---------- */
const stallOpen = s => { const h = G.now().hf; return isOpen() && (/chowder|sushi|chips/.test(s.kind) ? inH(h, HOURS.food) || festival() : h >= 7 || /whole|tuna|shell/.test(s.kind)); };
const freeSeat = sc => { for (const f of sc.byTag('seating')) for (const s of f.seats || []) if (!sc.ents.some(e => e !== G.player && !e.hidden && Math.hypot(e.x - s.x, e.y - s.y) < .4)) return s; return null; };
function buy(stallId, itemId, mode) {
  const s = STALL_BY_ID[stallId], it = ITEM_BY_ID[itemId], q = s && s.sells.find(x => x.id === itemId), sc = scene(); if (!s || !it || !q || G.busy) return false; if (!stallOpen(s)) { toast(`${s.name} is not open yet.`, 'info'); return false; }
  const p = price(itemId, stallId), c = q.catch ? today().of[q.catch] : null, kg = weightOf(itemId), eat = it.category === 'dish' && mode !== 'go';
  if (!eat && G.inv && G.inv.canAdd && !G.inv.canAdd(itemId, 1)) { toast('Your backpack is full.', 'bad'); return false; }
  if (G.money && !G.money.pay(p, it.name, { category: it.category === 'dish' ? 'dish' : 'groceries', venue: s.venue })) return false;
  st().spent += p; if (sc && sc.fm) sc.fm.weigh(stallId, itemId, kg, q.catch ? (CATCH.find(k => k.id === q.catch) || {}).sp : s.sp[0]); sfx('coin'); G.emit('shop:buy', itemId, 1, s.venue); G.emit('fishmarket:buy', itemId, stallId, p);
  const m = sc && sc.fm && sc.fm.monger(stallId); if (m) { m.pose = 'work'; m._hold = 2.5; }
  if (eat) { const seat = sc ? freeSeat(sc) : null, fin = () => { safe(() => G.inv.applyEffects(it.effects)); G.emit('inv:use', itemId); };
    if (G.activities && G.activities.start) safe(() => G.activities.start(it.course === 'drink' ? 'drink' : 'eat', { minutes: it.eatMinutes || 8, at: seat || undefined, seated: !!seat, label: 'Eating ' + it.name, onDone: fin, onCancel: fin, summary: `${it.name}: ${G.inv.effectText(it)}` })); else fin();
    toast(`${it.name}, ${fmt(p)}.${seat ? ' You carry it to a mess table.' : ''}`, 'good', 3200); return true; }
  safe(() => G.inv.add(itemId, 1, it.category === 'dish' ? { exp: G.state.t + 240 } : c && c.fresh ? { fresh: c.fresh } : {}));
  toast(`${kg.toFixed(2).replace(/0$/, '')} kg on the scale: ${it.name}, ${fmt(p)}.${c && c.level === 3 ? ' Landed this morning: it will keep a day longer.' : ''}`, 'good', 3600); return true;
}
async function stall(stallId) {
  const s = STALL_BY_ID[stallId]; if (!s || G.busy) return; if (!stallOpen(s)) { toast(`${s.name}: ${/chowder|sushi|chips/.test(s.kind) ? 'the fryers and pots start at ' + clock(HOURS.food[0]) : 'setting up. Stalls open at seven'}.`, 'info', 3400); return; }
  see(s.sp); const c = today();
  for (;;) {
    const opts = s.sells.filter(q => ITEM_BY_ID[q.id]).map(q => { const it = ITEM_BY_ID[q.id], k = q.catch ? c.of[q.catch] : null; return { label: it.name, sub: fmt(price(q.id, stallId)) + (k ? (k.level === 3 ? ' · landed this morning, plenty' : k.level === 1 ? ' · scarce today' : k.level === 0 ? ' · none landed: yesterday\'s ice' : '') : '') + (it.category === 'dish' ? ' · ' + safe(() => G.inv.effectText(it)) : ''), value: q.id }; });
    if (s.kind === 'knife') opts.push({ label: 'Have your knives sharpened', sub: fmt(4) + ' · sparks included', value: '#sharp' });
    if (s.kind === 'oyster') opts.push({ label: 'Enter the Oyster Derby', sub: 'Six oysters against the clock', value: '#shuck' });
    if (s.kind === 'whole') opts.push({ label: 'What is the catch of the day?', value: '#top' });
    opts.push({ label: 'Just looking', value: null });
    const v = await choose(s.name, opts, { text: `${s.keeper}: "${pick(s.lines)}"` }); if (!v) return;
    if (v === '#sharp') { if (G.money && !G.money.pay(4, 'Knife sharpening', { category: 'services', venue: s.venue })) return; const sc = scene(); if (sc && sc.fm) sc.fm.spark(true); sfx('clank'); G.state.flags.fm_sharp = G.now().day; xp('cooking', 6); toast('Abel leans into the wheel. Sparks, a hiss of water, and an edge you could shave with. (Filleting goes better today.)', 'good', 4600); return; }
    if (v === '#shuck') return shuck(); if (v === '#top') return board();
    const it = ITEM_BY_ID[v]; let mode = 'go'; if (it.category === 'dish') { mode = await choose(it.name, [{ label: 'Eat it here', sub: 'At a mess table', value: 'here' }, { label: 'Wrap it to go', sub: 'Good for four hours', value: 'go' }, { label: 'Never mind', value: null }]); if (!mode) continue; }
    if (!buy(stallId, v, mode) || mode === 'here') return;
  }
}
function talk(stallId, c) {
  const s = STALL_BY_ID[stallId]; if (!s) return; if (stallId === 'smoke' && safe(() => G.lighthouse.chainTalk && G.lighthouse.chainTalk('halvorsen', c))) return;
  if (c) bubble(c, pick(s.lines), 3800); add('social', 1);
}
function talkDusty(c) { if (G.busy) return; bubble(c, pick(['Stand on the yellow fish and say when. I have never hit anyone. Hard.', 'Eight kilos of salmon at forty kilometres an hour. It is all in the follow-through.', 'Basia catches left-handed. Show-off.']), 3800); }
function talkAuctioneer(c) { const n = G.now(); bubble(c, inH(n.hf, HOURS.auction) ? 'The clock starts high and falls. First hand up takes the lot. Tap a crate when you are ready.' : `Auction is at half past five, every morning the boats go out. ${today().boats ? 'Bring your nerve.' : 'No boats today, mind. Storm.'}`, 4200); }

/* ---------- the dawn auction ---------- */
function lots() { const S = st(), d = G.now().day; if (S.lotDay !== d) { S.lotDay = d; S.sold = {}; } return lotsOf(d, wxOf(d)).map(l => Object.assign(l, { sold: S.sold[l.n] ? S.sold[l.n].who : null, soldT: S.sold[l.n] ? S.sold[l.n].t : undefined })); }
function sell(l, who, p) { const S = st(); if (S.sold[l.n]) return; S.sold[l.n] = { who, t: G.state.t, p }; G.emit('fishmarket:lot', l.n, who, p); const sc = scene(); if (sc && sc.fm) { sc.fm.sold(l.n, who); sc.fm.sync(); } }
function auctionTick() {
  const h = G.now().hf; if (h < HOURS.auction[0]) return; const L = lots(); if (!L.length) return; const slot = (h - HOURS.auction[0]) / (HOURS.auction[1] - HOURS.auction[0]) * L.length, i = Math.floor(slot), fr = slot - i;
  L.forEach((l, k) => { if (l.sold) return; if (k < i || h >= HOURS.auction[1] || (k === i && fr > .5 + ((l.n * 37) % 40) / 100)) sell(l, RIVALS[(l.n + G.now().day) % RIVALS.length], l.rival); });
}
async function bid(idx, quality) {
  if (G.busy) return null; const n = G.now(), c = today();
  if (!inH(n.hf, HOURS.auction)) { toast(n.hf < HOURS.auction[0] ? `The auction starts at ${clock(HOURS.auction[0])}. The boats are still unloading.` : `The dawn auction runs ${clock(HOURS.auction[0])} to ${clock(HOURS.auction[1])}, every morning the boats go out.`, 'info', 4000); return null; }
  if (!c.boats) { toast('No auction today: the fleet stayed in harbour for the storm.', 'info', 3600); return null; }
  const L = lots(), l = (idx !== undefined && L[idx] && !L[idx].sold ? L[idx] : null) || L.find(q => !q.sold); if (!l) { toast('Every lot is sold. Come back tomorrow at half past five.', 'info', 3400); return null; }
  const give = Object.entries(l.give).map(([id, q]) => `${q} x ${ITEM_BY_ID[id] ? ITEM_BY_ID[id].name : id}`).join(', ');
  if (quality === undefined) { const v = await choose(`Lot ${l.n} · off the ${l.boat}`, [{ label: 'Bid on it', sub: `The clock starts at ${fmt(l.start)} and falls. Stop it before another buyer does.`, value: 1 }, { label: 'Let it go', value: 0 }], { text: `${l.name}. On the ice: ${give}. In the shops that is about ${fmt(l.retail)}.` }); if (!v) return null; }
  const r = quality !== undefined ? (quality <= 0 ? { won: false, price: l.rival } : { won: true, price: Math.max(l.floor, Math.round(l.rival + 1 + (1 - Math.min(1, quality)) * (l.start - l.rival - 1))) }) : await clockGame({ title: `Lot ${l.n}: the clock is falling`, text: `${l.name}. Raise your hand to take it at the price shown. Wait too long and somebody else will.`, start: l.start, floor: l.floor, rival: l.rival, secs: 7, fmt });
  if (!r) return null; const S = st();
  if (lots()[l.n - 1].sold) { toast('Too slow: the lot went while you were thinking.', 'info'); return null; }
  if (!r.won || (G.money && G.money.canAfford && !G.money.canAfford(r.price))) { const who = RIVALS[(l.n + n.day) % RIVALS.length]; sell(l, who, l.rival); toast(r.won ? `You cannot cover ${fmt(r.price)}. Lot ${l.n} goes to ${who}.` : `A hand goes up across the floor at ${fmt(l.rival)}. Lot ${l.n} goes to ${who}. Stop the clock sooner next time.`, 'info', 4600); return { won: false, price: l.rival, lot: l }; }
  safe(() => G.money.pay(r.price, `Auction lot ${l.n}`, { category: 'groceries', venue: FM.place })); sell(l, 'you', r.price); const kept = [], left = [];
  for (const [id, q] of Object.entries(l.give)) { const ok = safe(() => G.inv.add(id, q, ITEM_BY_ID[id] && ITEM_BY_ID[id].category === 'dish' ? { exp: G.state.t + 360, silent: true } : { fresh: 1, silent: true })) || safe(() => G.inv.fridge.add(id, q, { fresh: 1, silent: true })); (ok ? kept : left).push(`${q} x ${ITEM_BY_ID[id] ? ITEM_BY_ID[id].name : id}`); }
  S.wins++; S.spent += r.price; const save = l.retail - r.price; if (!S.bestBuy || save > S.bestBuy) S.bestBuy = save; moodlet('market_bargain'); add('fun', 10); xp('charisma', 8); gstamp('x:fm_auction'); sfx('achievement'); G.emit('fishmarket:win', l, r.price); safe(() => G.lighthouse.chainEvent && G.lighthouse.chainEvent('won'));
  toast(`SOLD to you: lot ${l.n} for ${fmt(r.price)} (about ${fmt(Math.max(0, save))} under shop prices). ${kept.join(', ')}${left.length ? '. No room for: ' + left.join(', ') + ' (given to the food bank table)' : ''}. Extra fresh: it keeps a day longer.`, 'good', 8000);
  return { won: true, price: r.price, lot: l };
}

/* ---------- catch the thrown salmon ---------- */
async function askThrow(quality) {
  const sc = scene(); if (!sc || !sc.fm || G.busy) return false; if (sc.fm.dusty.hidden || sc.fm.monger('whole').hidden) { toast('Nobody is throwing fish yet. Dusty starts when the stalls open at half past seven.', 'info', 3600); return false; }
  const f = sc.fm.throwFish(true); if (f.toPlayer !== true) { await f.landed; return askThrow(quality); }
  let pressed = null; const rm = quality === undefined ? floatButton('Catch it!', () => { pressed = f.p(); }, 5000) : null; G.player.faceTo(sc.fm.dusty.x, sc.fm.dusty.y); await f.landed; if (rm) rm();
  const S = st(), ok = quality !== undefined ? quality >= .5 : pressed !== null && pressed >= .7 && pressed <= .985; S.throws++; G.emit('fishmarket:catch', ok);
  if (ok) { S.catches++; G.player.pose = 'cheer'; setTimeout(() => { if (G.player.pose === 'cheer') G.player.pose = null; }, 1400); moodlet('nice_catch'); add('fun', 14); xp('fitness', 6); gstamp('x:fm_catch'); sfx('cheer'); const first = S.catches === 1; if (first) safe(() => G.inv.add('salmon', 1, { fresh: 1, silent: true }));
    bubble(sc.fm.monger('whole'), pick(['WHOA! Look at that!', 'Hired. Start Monday.', 'Clean as a whistle!']), 2600); toast(first ? 'CAUGHT IT. Eight cold kilos of bay salmon, square in the arms. The whole aisle cheers, and Basia cuts you a fillet to take home.' : `Caught it! That is ${S.catches} now. The aisle applauds; you toss it on to Basia.`, 'good', 5200); }
  else { add('fun', 4); toast(pressed === null ? 'You never got your hands up. The salmon slaps the wet floor and slides under a stall. Dusty fetches it, laughing.' : pressed < .7 ? 'Too early: you grab at air and the salmon sails past your ear.' : 'Too late: it bounces off your chest and skids across the floor. Cold. Very cold.', 'info', 4600); }
  return ok;
}

/* ---------- oyster derby, filleting, samples, recipe card ---------- */
async function shuck(quality) {
  if (G.busy) return null; if (!inH(G.now().hf, HOURS.retail)) { toast('The Oyster Derby opens with the stalls at half past seven.', 'info'); return null; }
  if (quality === undefined) { const v = await choose('The Oyster Derby', [{ label: 'Take a knife', sub: `${fmt(3)} entry · you eat what you open${festival() ? ' · festival: double prize' : ''}`, value: 1 }, { label: 'Not today', value: 0 }], { text: `Six oysters. Find the hinge, twist, pop. Six clean ones wins ${fmt(festival() ? 20 : 10)}. House best: ${Math.max(6, st().shuckBest)} of 6.` }); if (!v) return null; }
  if (G.money && !G.money.pay(3, 'Oyster Derby', { category: 'fun', venue: FM.place })) return null;
  const q = quality !== undefined ? quality : await sweepGame({ title: 'The Oyster Derby', text: 'Slip the knife in at the hinge', rounds: 6, speed: 1.25, zone: .2, label: 'Twist!' }); if (q === null) return null;
  const S = st(), n = Math.round(q * 6); S.shucks++; S.shuckBest = Math.max(S.shuckBest, n); see(['oyster']); add('hunger', n * 2.5); add('fun', 6 + n); xp('cooking', 4 + n * 2); G.advance(8); G.emit('fishmarket:shuck', n);
  if (n >= 5) { moodlet('shucker'); gstamp('x:fm_shuck'); } if (n >= 6) safe(() => G.money.add(festival() ? 20 : 10, 'Oyster Derby prize'));
  toast(n >= 6 ? `Six for six! Marguerite rings the bell and counts ${fmt(festival() ? 20 : 10)} into your hand. You eat all six with lemon.` : n >= 5 ? `${n} of 6, clean. "Fast hands," says Marguerite. You eat them standing up, with lemon.` : n >= 2 ? `${n} of 6 open, the rest fought back. They taste of the tide all the same.` : 'One mangled oyster and a nicked thumb. Marguerite opens you a consolation one.', n >= 5 ? 'good' : 'info', 5200);
  return n;
}
async function fillet(quality) {
  if (G.busy) return null; if (!inH(G.now().hf, HOURS.retail)) { toast('Rosa teaches when the stalls are open, from half past seven.', 'info'); return null; }
  const own = safe(() => G.inv.count('fm_knife')) > 0, sharp = G.state.flags.fm_sharp === G.now().day, fee = own ? 0 : 5;
  if (quality === undefined) { const v = await choose('Learn to fillet', [{ label: 'Tie on an apron', sub: (fee ? fmt(fee) + ' with a borrowed knife' : 'Free with your own knife') + ' · 25 minutes · Cooking', value: 1 }, { label: 'Just watch', value: 0 }], { text: 'Rosa: "Behind the gill, down to the bone, then let the knife ride the spine all the way to the tail. Three cuts. Do not saw."' }); if (!v) return null; }
  if (fee && G.money && !G.money.pay(fee, 'Filleting lesson', { category: 'fun', venue: FM.place })) return null;
  const q = quality !== undefined ? quality : await sweepGame({ title: 'Filleting a salmon', text: 'Cut when the knife is on the line', rounds: 3, speed: 1, zone: sharp || own ? .26 : .2, label: 'Cut', hint: i => ['Behind the gill.', 'Along the spine.', 'Off the tail.'][i] || '' }); if (q === null) return null;
  const S = st(); S.fillets++; const sc = scene(), fxo = sc && sc.world.objs.find(o => o.data && o.data.fillet); if (fxo) { fxo.p = Object.assign({}, fxo.p, { step: 3 }); fxo._key = null; setTimeout(() => { fxo.p = Object.assign({}, fxo.p, { step: 0 }); fxo._key = null; }, 6000); }
  const gain = Math.round((20 + 45 * q) * (own ? 1.25 : 1)); xp('cooking', gain); add('fun', 5); G.advance(25); see(['salmon']); if (q >= .5) safe(() => G.inv.add('salmon', 1, { fresh: 1, silent: true })); G.emit('fishmarket:fillet', q);
  toast(q >= .85 ? `Two clean sides and a bare spine. Rosa holds one up to the light: "I could sell that." Cooking +${gain} xp, and the fillet is yours.` : q >= .5 ? `A decent fillet and a slightly meaty spine. "The cat will thank you." Cooking +${gain} xp, and you keep the fillet.` : `It looks like it was filleted by a propeller. Rosa makes it into fishcake mix. Cooking +${gain} xp.`, q >= .5 ? 'good' : 'info', 5600);
  return q;
}
const SAMPLE = { salmon: ['a curl of cold-smoked salmon on a toothpick', ['salmon']], kipper: ['a flake of warm kipper', ['kipper']], chowder: ['a thimble of chowder', []] };
function sample(kind) { const S = st(), d = G.now().day, t = SAMPLE[kind] || SAMPLE.salmon; if (!isOpen()) return false; if (S.samples[kind] === d) { toast('One sample each, the sign says. In small letters. You have had yours today.', 'info'); return false; } S.samples[kind] = d; add('hunger', 4); add('fun', 3); see(t[1]); sfx('munch'); G.emit('fishmarket:sample', kind); toast(`You try ${t[0]}. It is unfairly good. That is the idea.`, 'good', 3400); return true; }
function recipe() {
  const S = st(), c = today(), d = G.now().day; if (!c.top) { toast('No card today: no boats, no catch of the day.', 'info'); return null; } const id = RECIPE_OF[c.top], name = CATCH.find(k => k.id === c.top).name;
  if (!G.cooking || !G.cooking.learn) { toast(`Catch of the day: ${name}. The card says: salt, lemon, a hot pan, and do not fuss with it.`, 'info', 4200); return null; }
  if (safe(() => G.cooking.knows(id))) { toast(`Catch of the day: ${name}. The card is for a dish you already know by heart.`, 'info', 3800); return null; }
  if (S.recipeDay === d) { toast('One card a day. Tomorrow the boats bring something else.', 'info'); return null; }
  const ok = safe(() => G.cooking.learn(id, 'card')); if (!ok) { toast(`Catch of the day: ${name}. You read the card twice; it will come in handy when your cooking catches up.`, 'info', 4200); return null; }
  S.recipeDay = d; sfx('page'); G.emit('fishmarket:recipe', id); toast(`Catch of the day: ${name}. You take the recipe card from the rack. New recipe learned.`, 'good', 4600); return id;
}

/* ---------- small things ---------- */
function tank() { if (G.busy) return; see(['lobster']); G.startActivity({ label: 'Watching the lobsters', anim: 'stand', minutes: 6, rate: 3, done: () => { add('fun', 5); toast(pick(['The big one with one claw has walked the same lap eleven times. You have named him Admiral.', 'Two of them are having a very slow argument over a rock.', 'A lobster looks at you. You look at the lobster. Neither of you blinks. It cannot.']), 'info', 4200); } }); }
function ice(sc) { if (sc && sc.fm) sc.fm.pour(); sfx('clank'); toast('The machine shudders and half a tonne of crushed ice thunders into the bin. Every stall takes forty shovels a day.', 'info', 3800); }
function board() {
  const c = today(), L = lots(), lvl = ['none landed', 'scarce', 'fair', 'plenty'], rows = CATCH.map(k => `${k.name}: ${lvl[c.of[k.id].level]}`).join(' · ');
  return say([{ who: "Today's catch", text: c.boats ? `${c.boats} of 3 boats landed this morning (${c.wx} at sea). ${rows}.` : `No boats out: storm at sea. Everything on the ice is yesterday's, and priced like it.` }, c.top ? { who: 'Catch of the day', text: `${CATCH.find(k => k.id === c.top).name}: plenty landed, thirty percent off and it keeps a day longer. The recipe card is in the rack by the door.` } : null,
    L.length ? { who: 'Dawn auction', text: L.every(l => l.sold) ? `All ${L.length} lots sold${L.some(l => l.sold === 'you') ? ', ' + L.filter(l => l.sold === 'you').length + ' of them to you' : ''}. Next auction ${clock(HOURS.auction[0])} tomorrow.` : `${L.filter(l => !l.sold).length} of ${L.length} lots still to go under the clock.` } : null, festival() ? { who: 'Quayside Seafood Festival', text: 'Today: fifteen percent off at every stall, double prize at the Oyster Derby, and the lighthouse turns in colour tonight.' } : null].filter(Boolean));
}
function scale() { toast(pick(['You step onto the platform scale. The needle swings to "ONE LARGE HALIBUT".', 'The dial says you weigh the same as eleven crates of mackerel. Flattering, somehow.', 'A dock hand taps the dial: "Reads two kilos heavy. So do I."']), 'info', 3600); add('fun', 2); }
function quay(i) {
  const n = G.now(), c = today(), b = BOATS[i] || BOATS[0], in_ = n.hf >= 4.8 && n.hf < 9.5 && c.boats > i;
  if (i === 0 && safe(() => G.lighthouse.chainTalk && G.lighthouse.chainTalk('brandt', null, in_))) return;
  toast(in_ ? `The ${b.name}, ${b.skipper}, tied up at the quay and swinging fish boxes ashore. Diesel, gulls, and the whole bay turning pink behind her.` : n.hf >= 9.5 ? `Quay ${i + 1}: empty water. The ${b.name} went back out on the tide; she lands again before dawn.` : `Quay ${i + 1}: the ${b.name} is not in. ${c.boats ? '' : 'Nobody went out in this weather.'}`, 'info', 4400);
}
function pet(cat) { const S = st(); S.pets++; add('fun', 4); add('social', 1); sfx('meow'); toast(pick(['Biscuit allows it. She smells powerfully of herring.', 'Biscuit rolls over on the wet concrete, then remembers her dignity.', 'Biscuit head-butts your shin. This is a shakedown. You have no fish.']), 'good', 3400); }
const pennant = () => (chain().st >= 6 ? (G.state.player && G.state.player.name) || 'YOU' : null);

function patchGuide() {
  const e = safe(() => G.guide.get('place:fishmarket')); if (!e) return; const c = safe(() => today());
  e.blurb = CORE_BLURB.fishmarket; e.type = 'Fish market hall'; e.chapter = 'shop'; e.also = ['eat', 'sights']; e.price = 'Free to walk in · fish from $4 · chowder $7';
  const T = ['fish', 'seafood', 'market', 'auction', 'oysters', 'chowder', 'sushi', 'fish and chips', 'ingredients', 'harbor']; e.tags = (e.tags || []).filter(t => !T.includes(t)).concat(T);
  e.tryThis = ['Win a crate at the dawn auction: stop the falling clock (05:30 to 07:30)', 'Catch the salmon Dusty throws: stand on the yellow fish on the floor', 'Read the catch board: what the boats landed is cheaper and keeps longer', 'Six oysters against the clock at the Oyster Derby', 'Learn to fillet with Rosa (Cooking)', 'Take the catch-of-the-day recipe card', 'Fill the Species of the Bay stamp book', 'Chowder in a bread bowl at a mess table', 'Quayside Seafood Festival on the 8th of every season'];
  e.when = c && c.top ? `Catch of the day: ${CATCH.find(k => k.id === c.top).name.toLowerCase()} · auction daily ${clock(HOURS.auction[0])}` : `Auction daily ${clock(HOURS.auction[0])}`;
}

export function init() {
  S = G.defineState('fishmarket', () => ({ visits: 0, lastDay: -1, wx: { day: -1, kind: 'clear' }, lotDay: -1, sold: {}, wins: 0, bestBuy: 0, catches: 0, throws: 0, shuckBest: 0, shucks: 0, fillets: 0, seen: {}, bookDone: 0, samples: {}, recipeDay: -1, pets: 0, spent: 0 }));
  G.on('load', () => { st(); });
  G.fishmarket = { isOpen, enter, door: () => door, festival, catch: today, price, stallLines, stall, buy, talk, talkDusty, talkAuctioneer, lots, bid, askThrow, shuck, fillet, sample, recipe, stamps, stampsGot: () => Object.assign({}, st().seen), see, tank, ice, board, scale, quay, pet, pennant, arrived,
    mini: { state: () => (MINI.cur ? MINI.cur.state() : null), act: () => MINI.cur && MINI.cur.act(), auto: q => MINI.cur && MINI.cur.auto(q) },
    stats: () => { const S = st(); return { visits: S.visits, wins: S.wins, bestBuy: S.bestBuy, catches: S.catches, throws: S.throws, shuckBest: S.shuckBest, fillets: S.fillets, stamps: Object.keys(S.seen).length, of: SPECIES_IDS.length, spent: S.spent, pets: S.pets }; } };
  // the door must exist before a save made inside the hall exits to a city that was never built this session
  G.on('room:build', sc => { if (sc && sc.def && sc.def.showpiece === 'fishmarket' && !built) safe(() => ensure(getCity())); });
  G.on('scene', s => { if (!s || s.id !== 'city' || s._fishmarket || !s.world) return; s._fishmarket = true; try { wire(s); } catch (e) { console.warn('fishmarket', e); } });
  G.on('guide:rebuilt', patchGuide);
  G.on('minutes', () => { safe(auctionTick); const sc = scene(); if (!sc || G.busy || G.modal || G.cutscene) return; const h = G.now().hf; if (h >= HOURS.hall[1] + .33 || h < HOURS.hall[0] - .2) { if (sc._closing) return; sc._closing = true; toast('The hoses come out and the shutters come down. "We open at five, love." You are steered to the door.', 'info', 4400); exitRoom({ poi: DOOR }).then(() => { sc._closing = false; }, () => { sc._closing = false; }); } });
}
