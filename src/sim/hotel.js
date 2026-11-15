// The Grand Maple Hotel — gameplay for the converted downtown hotel (existing building `bld.downtown.hotel`, existing city door `door:hotel`; nothing in the city layout is touched).
// Rooms: scenes/rooms/hotel.js (lobby `hotel`), hotel_dine.js (`hotel_restaurant`, `hotel_bar`), hotel_events.js (`hotel_ballroom`), hotel_stay.js (`hotel_spa`, `hotel_floor`, `hotel_room`).
// Data: data/hotel.js. Art: art/showpiece/hotel.js, hotel_rooms.js, _hotel_lib.js, _hotel_icons.js.
//
// City (once per city world, order 57 = before places / stalls / addresses): three burgundy suitcases (pois `hcase:0..2`, type 'hotel', glow) stand beside Central Station, the airport kerb and a far taxi stand.
// G.places id 'hotel' (open 24 h). The lobby, restaurant room, ballroom, corridor and roof terrace are always open; the bar serves 16:00-01:00, the spa is open 07:00-21:00.
// G.hotel = {
//   stay() -> null | { tier, no, name, from, until }, book(tierId) -> bool, checkout(), lateCheckout() -> bool, tiers, prices, hasSpa(), buySpaPass() -> bool,
//   lift(dest?) -> Promise (floor menu, or straight to 'lobby' | 'spa' | 'floor' | 'bar'), toSpa(via), leaveRoom(), enterRoom(),
//   reception(), ringBell(scene), concierge(char), whereCan(kind) -> rows, callCab(placeId?), whatsOn() (menu -> planner), events(days) -> [{ id, name, day, from, to }], shop(), flowers(), staffWall(),
//   piano: { now() -> { id, title, by } | null, request(pieceId) -> bool, sets, pieces }, pianoMenu(), listen(fx, scene), talkPianist(c), talkDoorman(c),
//   host(scene), meal() -> 'breakfast' | 'brunch' | 'tea' | 'dinner' | null, buffet: { start() -> bool, take(id) -> bool, plate() -> [ids], eat(fx?, scene?) -> bool }, buffetTake(id, fx, scene), table(fx, scene),
//   tea(scene) -> bool, dinner(scene, courses 3 | 5, picks?) -> bool, service() -> { phase, course, of } | null,
//   bar(scene), barMenu(), mix(cocktailId, quality?) -> Promise<stars | null> (quality given = skip the mini-game), houseCocktail() -> name | null, heater(fx),
//   steward(scene), dance(scene, quality?) -> Promise<bool>, cake(fx), auction(lot?), guestbook(), talkTeacher(c), ticket(kind) -> bool,
//   spaDesk(), swim(scene), soak(scene), sauna(fx, scene), massage(fx, scene), lounger(fx, scene), locker(scene), wash(fx, kind),
//   roomDoor(no, fx, scene), bed(fx, scene), sleep(mode: 'morning' | 'rested' | 'nap', fx?) -> bool, phone(scene), order(itemId) -> bool, tray(fx, scene), closet(), robe(on?) , minibar(), view(tier),
//   chain() -> { st: 0 none | 1 looking | 2 all found | 3 done, got }, cases() -> [{ i, name, x, y, got }], takeCase(i), talkChain(), friend() -> bool (Friend of the House),
//   mini: { state(), act(), auto(quality) } (the open pour / beat mini-game), outfit() -> 'robe' | 'swim' | 'pajamas' | 'gym' | 'smart' | 'plain', arrived / arrivedIn / left (room hooks), stats() }
// State: G.state.hotel = { visits, lastDay, stay: null | { tier, no, from, until, late }, nights, sleeps, voucher: tierId | null, spaDay, spaCredits, buffetDay, plate: [ids], dinners, teas, mixes: { id: stars }, heard: { pieceId: n },
//   listens, dances, klassDay, galaDay, bids: { lot: day }, bookDay, cakeDay, swims, laps, saunas, massages, soaks, bell, order: null | { id, t }, tray: itemId | null, robe, swim, flowersWeek, jazzMin, jazzDay, chain: { st, got } }
// Events: 'hotel:visit'(first), ':bell', ':book'(tier), ':checkout', ':sleep'(minutes), ':lift'(dest), ':piano'(pieceId), ':listen', ':buffet'(id, n), ':meal'(kind), ':course'(name), ':mix'(id, stars), ':dance'(event, score),
//   ':ticket'(kind), ':bid'(lot), ':swim'(laps), ':sauna', ':massage', ':soak', ':order'(id), ':roomservice'(id), ':case'(i, n), ':chain'(st), ':concierge'(kind).
// Guide stamps: x:hotel_visit, x:hotel_piano, x:hotel_dinner, x:hotel_cocktail, x:hotel_dance, x:hotel_swim, x:hotel_stay.
// Tuning: data/hotel.js PRICE / TIERS / HOURS; LISTEN_MIN 20, SWIM_MIN 30, SAUNA_MIN 15, MASSAGE_MIN 45, DANCE_MIN 25, COURSE rate 2.2 game min / s, room service arrives after ORDER_MIN 12.
import { G } from '../core/game.js';
import { el, root, toast, bubble, say, choose, modal } from '../ui/kit.js';
import { ITEM_BY_ID } from '../data/items.js';
import { HR, HV, NAME, REST_NAME, BAR_NAME, SPA_NAME, BALL_NAME, SHOP_NAME, TIERS, PRICE, HOURS, CHECKOUT, PIANO_SETS, PIECES, JAZZ, SUNSET, FLOWERS, BUFFET, MENU, EXTRA, COCKTAILS, BALL, HOTEL_LOOKS, inH, meal, ballEvent, ballNext } from '../data/hotel.js';
import { HOTEL_ICONS } from '../art/showpiece/_hotel_icons.js';
import { ICONS } from '../art/icons/icons.js';
import { LOOKS } from './wardrobe.js';
import { CORE, CORE_BLURB, EXPERIENCES } from './_guide_data.js';
import { getCity } from '../world/_city.js';
import { AU, unlock, note } from './_shows_audio.js';
import { LOBBY_AT, O } from '../scenes/rooms/hotel.js';
import { DOORS } from '../scenes/rooms/hotel_stay.js';

export const order = 57;
Object.assign(LOOKS, HOTEL_LOOKS); for (const k in HOTEL_ICONS) if (!ICONS[k]) ICONS[k] = HOTEL_ICONS[k];
const DOOR = 'door:hotel', DAY = 1440, LISTEN_MIN = 20, SWIM_MIN = 30, SAUNA_MIN = 15, MASSAGE_MIN = 45, DANCE_MIN = 25, ORDER_MIN = 12;
CORE.hotel = ['sights', 'Grand hotel', 'tower', ['eat', 'shows', 'fitness']];
CORE_BLURB.hotel = 'Marble, brass and a revolving door on Harbor Street. A pianist in the lobby, breakfast buffet, afternoon tea and a five-course dinner at The Gilded Maple, dancing in the Bay Ballroom, a pool and sauna on the second floor, The Weathervane bar on the roof, and rooms for the night with room service and a bathrobe.';
for (const x of [
  { id: 'x:hotel_visit', title: 'Through the Revolving Door', group: 'Big days out', glyph: 'tower', place: 'place:hotel', need: 'hotel', blurb: 'Walk into the Grand Maple and ring the bell at reception. Somebody always comes.' },
  { id: 'x:hotel_piano', title: 'The Lobby Pianist', group: 'Big days out', glyph: 'mask', place: 'place:hotel', need: 'hotel', blurb: 'Sit in the lounge of the Grand Maple while Mr. Okonkwo plays: noon, five o\'clock and half past eight.' },
  { id: 'x:hotel_dinner', title: 'Five Courses', group: 'Big days out', glyph: 'cup', place: 'place:hotel', need: 'hotel', blurb: 'Order the tasting menu at The Gilded Maple and stay for every plate.' },
  { id: 'x:hotel_cocktail', title: 'Shaken on the Roof', group: 'Big days out', glyph: 'cup', place: 'place:hotel', need: 'hotel', blurb: 'Mix your own cocktail at The Weathervane, the rooftop bar of the Grand Maple.' },
  { id: 'x:hotel_dance', title: 'May I Have This Dance', group: 'Big days out', glyph: 'mask', place: 'place:hotel', need: 'hotel', blurb: 'Join the dance floor of the Bay Ballroom: a class, a wedding or the gala.' },
  { id: 'x:hotel_swim', title: 'Second-Floor Lengths', group: 'Big days out', glyph: 'bell', place: 'place:hotel', need: 'hotel', blurb: 'Swim laps in the pool of the Tidewater Spa.' },
  { id: 'x:hotel_stay', title: 'A Night at the Grand Maple', group: 'Big days out', glyph: 'tower', place: 'place:hotel', need: 'hotel', blurb: 'Book a room, sleep in the good sheets and wake up to the view.' },
]) if (!EXPERIENCES.some(e => e.id === x.id)) EXPERIENCES.push(x);

const CASES = [
  { short: 'Suitcase at Central Station', where: 'at Central Station, where the cab rank is', anchor: p => p.id === 'door:central_station', found: 'A burgundy suitcase beside a luggage trolley, GRAND MAPLE on the brass tag. Inside the lid, in pencil: "Hats. Do NOT sit on." You tie a hotel label to the handle.' },
  { short: 'Suitcase at the airport', where: 'out at the airport, by the kerb where the shuttle stops', anchor: p => p.id === 'spawn:airport', found: 'The second one, standing alone at the kerb like a passenger who missed the flight. It rattles: shoes, at a guess, a great many shoes.' },
  { short: 'Suitcase at the taxi stand', where: 'at a taxi stand across town, in Old Town or by the harbour', anchor: null, found: 'The third, under the taxi-stand sign with a florist\'s receipt tucked in the strap. It smells faintly of lilies. Somebody loaded it with the wedding flowers.' },
];
let S = null, built = null, mini = null, riding = false, svc = null; const cases = [];
const st = () => { S = G.state.hotel || (G.state.hotel = {}); for (const [k, v] of [['mixes', {}], ['heard', {}], ['bids', {}], ['plate', []], ['chain', { st: 0, got: {} }]]) if (!S[k]) S[k] = v; if (!S.chain.got) S.chain.got = {}; for (const k of ['visits', 'nights', 'sleeps', 'spaCredits', 'dinners', 'teas', 'listens', 'dances', 'swims', 'laps', 'saunas', 'massages', 'soaks', 'bell', 'jazzMin']) S[k] = S[k] || 0; for (const k of ['lastDay', 'spaDay', 'buffetDay', 'klassDay', 'galaDay', 'bookDay', 'cakeDay', 'flowersWeek', 'jazzDay']) if (S[k] === undefined) S[k] = -1; return S; };
const fmt = n => (G.money && G.money.fmt ? G.money.fmt(n) : '$' + n);
const safe = fn => { try { return fn(); } catch (e) { return undefined; } };
const stamp = id => safe(() => G.guide && G.guide.stamp && G.guide.stamp(id));
const clock = h => String(Math.floor(h) % 24).padStart(2, '0') + ':' + String(Math.round((h % 1) * 60)).padStart(2, '0');
const pick = a => a[Math.floor(Math.random() * a.length)];
const add = (k, v) => safe(() => G.needs.add(k, v)), xp = (k, v) => safe(() => G.skills.addXp(k, v)), moodlet = (id, h) => safe(() => G.needs.addMoodlet(id, h));
const pay = (n, why, cat) => !n || !G.money || G.money.pay(n, why, { category: cat || 'fun', venue: HV.place });
const who = () => (G.state.player && G.state.player.name) || 'our guest';
const inHotel = sc => !!(sc && sc.def && sc.def.showpiece === 'hotel');
const scn = id => (G.scene && G.scene.roomId === id ? G.scene : null);
const friend = () => !!(G.state.flags && G.state.flags.hotel_friend);
const stayNow = () => { const s = st().stay; return s && G.state.t < s.until ? s : null; };
const stayInfo = () => { const s = stayNow(); if (!s) return null; const T = TIERS.find(t => t.id === s.tier) || TIERS[0]; return { tier: T.id, no: T.no, name: T.name, from: s.from, until: s.until, late: !!s.late }; };
const freeSeat = (fx, sc) => { for (const s of fx.seats || []) if (!s.lie && !sc.ents.some(e => e !== G.player && !e.hidden && Math.hypot(e.x - s.x, e.y - s.y) < .4)) return s; return null; };

/* ---------- what you are wearing (dress-code flavour: nobody is ever turned away) ---------- */
function outfit() { const t = G.state.wardrobe && G.state.wardrobe.temp; if (t === 'hotel_robe') return 'robe'; if (t === 'swim') return 'swim'; const id = String(safe(() => G.wardrobe.wearing()) || ''); if (/robe/.test(id)) return 'robe'; if (/pajama/.test(id)) return 'pajamas'; if (/gym|sport|swim|run/.test(id)) return 'gym'; const sy = safe(() => G.wardrobe.styles()) || []; return sy.includes('formal') || sy.includes('smart') ? 'smart' : 'plain'; }
const DRESS = {
  door: { pajamas: '"Good day. ...Are those pajamas? Very good. Very comfortable. Carry on."', robe: '"The robe suits you. The spa is up the stairs, the street is that way. I only mention it."', swim: '"The pool is on the second floor. I say this with love."', gym: '"Straight from the gym! The spa showers are excellent."', smart: '"Looking sharp today. The Gilded Maple will be glad to see you."' },
  host: { pajamas: '"Flannel. A bold choice for the dining room. I shall give you the corner table."', robe: '"A robe at table. Very continental. This way."', swim: '"I will have a towel put on the chair."', gym: '"We have had cyclists in. We survived. This way."', smart: '"May I say: exactly right for the room."' },
  bar: { pajamas: '"Pajamas on the roof. You know what, the skyline does not mind."', robe: '"Robe and a cocktail. That is the dream, honestly."', swim: '"The pool is five floors down, sunshine."', gym: '"Post-workout? I will make it a tall one."', smart: '"Now THAT is rooftop attire."' },
  ball: { pajamas: '"Pajamas! How... avant-garde. Mind the candles."', robe: '"A bathrobe in the ballroom. I have seen stranger at weddings."', swim: '"Dripping on the parquet is discouraged."', gym: '"The trainers will grip the floor nicely, at least."', smart: '"You look as if you came to dance."' },
};
function dressNote(where, c) { const o = outfit(), t = DRESS[where] && DRESS[where][o]; if (!t || (o === 'smart' && Math.random() < .5)) return false; if (c) bubble(c, t.replace(/"/g, ''), 4200); else toast(t, 'info', 4400); return true; }

/* ---------- city: the three suitcases ---------- */
function ensure(w) {
  if (built === w || !w || !Array.isArray(w.objs)) return; built = w; cases.length = 0;
  const door = w.pois.find(p => p.id === DOOR); if (!door) return; const dOf = p => (w.districtAt ? w.districtAt(p.x, p.y) : null);
  const stands = w.pois.filter(p => p.type === 'taxistand' && isFinite(p.x)).sort((a, b) => Math.hypot(b.x - door.x, b.y - door.y) - Math.hypot(a.x - door.x, a.y - door.y)), far = stands.find(p => ['oldtown', 'harbor'].includes(dOf(p))) || stands[0];
  CASES.forEach((c, i) => {
    let poi = w.pois.find(p => p.id === 'hcase:' + i);
    if (!poi) { const a = c.anchor ? w.pois.find(c.anchor) : far; if (!a) return; let sp = null;
      for (const r of [2, 2.5, 3, 3.5, 1.5, 4.5]) { for (let k = 0; k < 10 && !sp; k++) { const an = k * .628 + i * 1.7 + 1, x = Math.round((a.x + Math.cos(an) * r) * 2) / 2, y = Math.round((a.y + Math.sin(an) * r) * 2) / 2; if (!w.isBlocked(x, y) && !w.isBlocked(x + .5, y + .5) && !w.isBlocked(x, y + 1) && !w.pois.some(q => Math.hypot(q.x - x, q.y - y) < 1.5)) sp = { x, y }; } if (sp) break; }
      if (!sp) return; const ob = safe(() => w.place('prop.hotel.suitcase', sp.x - .26, sp.y - .14, { p: { tag: 1 }, solid: false }));
      poi = w.poi({ type: 'hotel', id: 'hcase:' + i, name: c.short, x: sp.x, y: sp.y + .8, px: sp.x, py: sp.y, glow: true, district: dOf(sp), ob }); }
    cases[i] = poi; if (poi.ob) poi.ob.hidden = !!st().chain.got[i];
  });
}
function wire(s) { ensure(s.world); cases.forEach((p, i) => { if (!p || s.interactables.some(it => it.poi === p)) return; s.interactables.push({ x: p.px, y: p.py, label: 'A burgundy suitcase', h: .8, hit: 12, spot: { x: p.x, y: p.y }, poi: p, visible: () => !st().chain.got[i], use: () => takeCase(i) }); }); }

/* ---------- music: the lobby piano, the rooftop trio, the ballroom band ---------- */
const parse = pc => { let t = 0; const ev = []; for (const tok of pc.notes.split(' ')) { const [m, d] = tok.split(':'), dur = +d * 60 / pc.bpm; if (m !== '-') ev.push({ t, m: m.split('+').map(Number), d: dur }); t += dur; } return { ev, dur: t + 1 }; };
const SCORES = {}; const score = id => SCORES[id] || (SCORES[id] = parse(PIECES.find(p => p.id === id)));
function jazzScore() { if (SCORES._jazz) return SCORES._jazz; const b = 60 / 126, roots = [41, 46, 41, 41, 46, 46, 41, 41, 48, 46, 41, 48], ev = []; let t = 0; roots.forEach((rt, bar) => { const wk = [0, 4, 7, 9]; for (let k = 0; k < 4; k++) { ev.push({ t, m: [rt + (bar % 2 ? wk[3 - k] : wk[k])], d: b * .9, i: 'bass', v: .9 }); ev.push({ t, m: [70], d: .1, i: 'cym', v: .1 }); if (k % 2) ev.push({ t: t + .01, m: [rt + 28, rt + 34, rt + 38], d: b * .5, i: 'piano', v: .45 }); if ((bar + k) % 3 === 0) ev.push({ t: t + b * .66, m: [rt + 36 + [0, 3, 5, 6, 7, 10][(bar * 5 + k * 3) % 6]], d: b * .7, i: 'wind', v: .5 }); t += b; } }); ev.sort((a, c) => a.t - c.t); return SCORES._jazz = { ev, dur: t }; }
const mkPlayer = () => ({ key: null, pos: 0, i: 0 });
function playTick(P, sc, dt, vol, inst, gap = 2.5) {
  if (P.key !== sc) { P.key = sc; P.pos = 0; P.i = 0; } P.pos += dt; const ctx = AU.dead ? null : AU.ctx;
  while (P.i < sc.ev.length && sc.ev[P.i].t <= P.pos + .2) { const e = sc.ev[P.i++]; if (ctx && ctx.state === 'running' && vol > .03 && !G.modal) { const at = ctx.currentTime + Math.max(0, e.t - P.pos); for (const m of e.m) safe(() => note(e.i || inst, m, at, Math.min(2.4, e.d * 1.5 + .25), vol * (e.v || 1) * (m < 52 ? .7 : 1))); } }
  if (P.pos >= sc.dur + gap) { P.pos = 0; P.i = 0; return true; } return false;
}
const PP = mkPlayer(), JP = mkPlayer(), BP = mkPlayer(); let pieceI = 0, requested = null, pianoOn = false, lastSet = -1;
function pianoNow() { return pianoOn ? PIECES[pieceI] : null; }
function pianoTick(dt, set, dist) {
  if (set < 0) { pianoOn = false; lastSet = -1; return; } if (set !== lastSet) { lastSet = set; pieceI = (Math.floor(G.state.t / 60) + set * 2) % PIECES.length; PP.key = null; }
  pianoOn = true; const pc = PIECES[pieceI]; if (playTick(PP, score(pc.id), dt, Math.max(0, .9 - (dist || 0) / 26), 'piano')) { pieceI = requested !== null ? requested : (pieceI + 1) % PIECES.length; requested = null; G.emit('hotel:piano', PIECES[pieceI].id); }
}
function pianoStop() { pianoOn = false; PP.key = null; }
function jazzTick(dt, on) { if (on) playTick(JP, jazzScore(), dt, .5, 'piano', 0); }
function ballTick(dt, ev) { if (ev) playTick(BP, score('danube'), dt * (ev === 'class' ? .85 : 1), .6, 'piano', 1); }

/* ---------- mini-games: pour-and-shake, keep-the-beat ---------- */
const css = (e, o) => { Object.assign(e.style, o); return e; };
function pourGame(title, steps, shakes) {
  return new Promise(res => {
    const got = []; let i = 0, level = 0, raf = 0, done = false, sh = 0, phase = 'pour', last = performance.now(), left = 5;
    const fill = css(el('div'), { position: 'absolute', left: 0, right: 0, bottom: 0, height: '0%', background: '#e8a23a' }), line = css(el('div'), { position: 'absolute', left: '-6px', right: '-6px', height: '3px', background: '#d8342e', boxShadow: '0 0 0 1px #2a2733' });
    const glass = css(el('div', null, fill, line), { position: 'relative', width: '84px', height: '150px', margin: '8px auto 10px', border: '4px solid #2a2733', borderTop: 'none', background: '#eaf6fb', boxSizing: 'border-box', overflow: 'visible' });
    const cap = el('p', { style: 'margin:2px 4px;text-align:center;line-height:1.3' }), btn = el('button.opt', { onclick: () => act() }, el('span.opt-l', { text: 'Stop pouring' }));
    const m = modal({ title, cls: 'hotel-mini', onClose: () => finish(null) }); m.body.append(cap, glass, btn);
    const COL = ['#e8d8a0', '#f0b848', '#c8e8b0', '#f08a6a', '#b8d8f0'];
    const show = () => { cap.textContent = `${i + 1} of ${steps.length}: pour the ${steps[i][0].toLowerCase()} up to the red line`; line.style.bottom = Math.round(steps[i][1] * 100) + '%'; level = 0; fill.style.height = '0%'; fill.style.background = COL[i % COL.length]; };
    const end = () => { const a = got.reduce((x, y) => x + y, 0) / Math.max(1, got.length); finish(a * (shakes ? .65 + .35 * Math.min(1, sh / shakes) : 1)); };
    function act() { if (done) return; if (phase === 'pour') { got.push(Math.max(0, 1 - Math.abs(level - steps[i][1]) / .3)); i++; if (i < steps.length) show(); else if (shakes) { phase = 'shake'; line.style.display = 'none'; fill.style.height = '70%'; cap.textContent = `Now shake it: ${shakes} good shakes before the ice melts!`; btn.firstChild.textContent = 'Shake!'; } else end(); } else { sh++; glass.style.transform = `rotate(${sh % 2 ? 10 : -10}deg)`; cap.textContent = `Shake! ${Math.max(0, shakes - sh)} to go`; if (sh >= shakes) end(); } }
    function frame(now) { if (done) return; const dt = Math.min(.05, (now - last) / 1000); last = now; if (phase === 'pour') { level = Math.min(1, level + dt * .4); fill.style.height = Math.round(level * 100) + '%'; if (level >= 1) act(); } else if ((left -= dt) <= 0) end(); raf = requestAnimationFrame(frame); }
    function finish(v) { if (done) return; done = true; cancelAnimationFrame(raf); mini = null; if (v !== null) safe(() => m.close()); res(v); }
    mini = { kind: 'pour', act, auto: (q = 1) => finish(Math.max(0, Math.min(1, q))), state: () => ({ kind: 'pour', phase, step: i, of: steps.length, level, shakes: sh }) }; show(); raf = requestAnimationFrame(frame);
  });
}
function beatGame(title, text, n = 8, bpm = 92) {
  return new Promise(res => {
    const per = 60 / bpm, hits = new Array(n).fill(0); let t = -per, raf = 0, done = false, last = performance.now();
    const ring = css(el('div'), { position: 'absolute', left: '50%', top: '50%', width: '120px', height: '120px', margin: '-60px 0 0 -60px', border: '5px solid #e8c06a', borderRadius: '50%', boxSizing: 'border-box' }), core = css(el('div'), { position: 'absolute', left: '50%', top: '50%', width: '44px', height: '44px', margin: '-22px 0 0 -22px', background: '#7a2030', border: '4px solid #2a2733', borderRadius: '50%', boxSizing: 'border-box' });
    const stage = css(el('div', null, ring, core), { position: 'relative', height: '140px', margin: '4px 0 8px' }), cap = el('p', { text, style: 'margin:2px 4px;text-align:center;line-height:1.3' }), btn = el('button.opt', { onclick: () => act() }, el('span.opt-l', { text: 'Step!' }));
    const m = modal({ title, cls: 'hotel-mini', onClose: () => finish(null) }); m.body.append(cap, stage, btn);
    function act() { if (done || t < -per * .5) return; const k = Math.round(t / per), err = Math.abs(t - k * per) / (per / 2); if (k >= 0 && k < n) { hits[k] = Math.max(hits[k], 1 - Math.min(1, err)); core.style.background = err < .35 ? '#3f8a55' : err < .7 ? '#e8a23a' : '#d8342e'; } }
    function frame(now) { if (done) return; const dt = Math.min(.05, (now - last) / 1000); last = now; t += dt; const ph = ((t % per) + per) % per / per, sc = 1 + (1 - ph) * 1.1; ring.style.transform = `scale(${(sc / 2.1 * 1.6).toFixed(3)})`; cap.textContent = t < 0 ? 'Listen for it... and...' : `${text} (${Math.min(n, Math.floor(t / per) + 1)}/${n})`; if (t > (n - .4) * per) return finish(hits.reduce((a, b) => a + b, 0) / n); raf = requestAnimationFrame(frame); }
    function finish(v) { if (done) return; done = true; cancelAnimationFrame(raf); mini = null; if (v !== null) safe(() => m.close()); res(v); }
    mini = { kind: 'beat', act, auto: (q = 1) => finish(Math.max(0, Math.min(1, q))), state: () => ({ kind: 'beat', beat: Math.floor(t / per), of: n }) }; raf = requestAnimationFrame(frame);
  });
}

/* ---------- arriving, the lift, moving between the rooms ---------- */
function arrived(sc, prev) {
  const S = st(), n = G.now(), fromCity = !prev || prev.id === 'city', first = !S.visits; if (!fromCity) return;
  S.visits++; const reg = S.visits >= 3; S.lastDay = n.day; safe(() => G.places.discover('hotel', true)); G.emit('hotel:visit', first); stamp('x:hotel_visit');
  const gus = sc.hot && sc.hot.doorman; if (gus) { gus._hold = 4; gus.faceTo(G.player.x, G.player.y); if (!dressNote('door', gus)) bubble(gus, first ? 'Welcome to the Grand Maple. First time? Reception is straight ahead.' : reg ? pick([`Welcome back, ${who()}. Good to see you.`, `${who()}! The usual revolving door for you.`, `Evening, ${who()}. The pianist asked after you.`].map(t => (n.hf < 17 ? t.replace('Evening', n.hf < 12 ? 'Morning' : 'Afternoon') : t))) : 'Welcome back to the Grand Maple.', 4200); }
  if (first) toast('The revolving door sighs shut behind you. Marble, brass, a chandelier the size of a rowing boat, and somewhere a piano.', 'good', 5600);
}
const FLOORS = [{ id: 'bar', n: 'R', name: BAR_NAME + ' · rooftop bar', room: HR.bar, at: { x: O + 2.6, y: O + 1.7 } }, { id: 'floor', n: '7', name: 'Guest rooms', room: HR.floor, at: { x: O + 2.6, y: O + 3.5 } }, { id: 'spa', n: '2', name: SPA_NAME + ' & pool', room: HR.spa, at: { x: O + 22.4, y: O + 2.3 } }, { id: 'lobby', n: 'L', name: 'Lobby', room: HR.lobby, at: LOBBY_AT.lift }];
const spaOpen = () => inH(G.now().hf, HOURS.spa), barOpen = () => inH(G.now().hf, HOURS.bar);
async function lift(dest) {
  if (riding || G.busy) return false; const here = G.scene && G.scene.roomId === HR.room ? HR.floor : G.scene && G.scene.roomId;
  if (!dest) dest = await choose('Lift', FLOORS.map(f => ({ label: `${f.n} · ${f.name}`, sub: f.room === here ? 'You are here' : f.id === 'spa' && !spaOpen() ? `Closed. Open ${clock(HOURS.spa[0])} to ${clock(HOURS.spa[1])}` : f.id === 'bar' ? (barOpen() ? 'Open until 01:00' : 'Roof terrace · the bar serves from 16:00') : f.id === 'floor' ? (stayNow() ? 'Your room: ' + stayInfo().no : 'Rooms 701 to 710') : 'Reception, restaurant, ballroom, the street', value: f.id, disabled: f.room === here || (f.id === 'spa' && !spaOpen()) })).concat([{ label: 'Step back out', value: null }]), { text: 'A brass panel, four ivory buttons.' });
  const F = FLOORS.find(f => f.id === dest); if (!F || F.room === here) return false; if (F.id === 'spa' && !spaOpen()) { toast(`${SPA_NAME} is closed. Open ${clock(HOURS.spa[0])} to ${clock(HOURS.spa[1])}.`, 'info', 3600); return false; }
  riding = true; G.modal++; G.emit('hotel:lift', dest);
  const lamps = FLOORS.map(f => css(el('div', { text: f.n }), { width: '34px', height: '34px', lineHeight: '34px', textAlign: 'center', border: '3px solid #2a2733', background: '#f4ecd8', color: '#2a2733', fontWeight: 'bold', margin: '5px' })), i0 = Math.max(0, FLOORS.findIndex(f => f.room === here)), i1 = FLOORS.indexOf(F);
  const ov = css(el('div.hotel-lift', null, css(el('div', null, ...lamps), { padding: '10px 14px', background: '#d8a848', border: '4px solid #2a2733', boxShadow: '4px 4px 0 #0008' })), { position: 'fixed', inset: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#2a1c1c', zIndex: 50 }); root().append(ov);
  const lit = k => lamps.forEach((l, j) => { l.style.background = j === k ? '#ffb050' : '#f4ecd8'; });
  const steps = Math.abs(i1 - i0), dir = Math.sign(i1 - i0); lit(i0);
  for (let k = 1; k <= steps; k++) { await new Promise(r => setTimeout(r, 380)); lit(i0 + dir * k); } await new Promise(r => setTimeout(r, 300));
  try { await G.go('int:' + F.room, Object.assign({ fade: false }, F.at)); } catch (e) { console.warn('hotel lift', e); }
  ov.remove(); G.modal = Math.max(0, G.modal - 1); riding = false; if (F.id === 'bar' && !barOpen()) toast(`The roof terrace. ${BAR_NAME} serves from four in the afternoon until one.`, 'info', 4000); return true;
}
function toSpa() { if (!spaOpen()) { toast(`A velvet rope across the stairs: "${SPA_NAME} · open ${clock(HOURS.spa[0])} to ${clock(HOURS.spa[1])}".`, 'info', 4000); return false; } G.go('int:' + HR.spa); return true; }
const doorAt = no => ({ x: O + 2.35 + Math.max(0, DOORS.indexOf(no)) * 3.3, y: O + 1.3, dir: 1 });
function leaveRoom() { const s = stayInfo(); return G.go('int:' + HR.floor, doorAt(s ? s.no : '704')); }
function enterRoom() { const s = stayInfo(); if (!s) return false; G.go('int:' + HR.room, { arg: { tier: s.tier }, fresh: true }); return true; }
function arrivedIn(key, sc) {
  const S = st(), n = G.now();
  if (key === 'rest') { const m = meal(n); if (S.plate.length && S.buffetDay === n.day && (m === 'breakfast' || m === 'brunch')) carry(true); else { S.plate = []; carry(false); } }
  else if (key === 'bar') { if (sc.hot.golden()) toast('Golden hour on the roof: the whole bay is the colour of an Old Fashioned.', 'good', 4200); else if (sc.hot.jazz()) toast(`${JAZZ.name} is playing tonight.`, 'good', 3600); }
  else if (key === 'ball') { const e = sc.hot.event(); if (e) toast(e === 'wedding' ? 'Music, flowers and two hundred people in their best shoes: a wedding reception. Nobody is checking invitations.' : e === 'gala' ? 'The Lighthouse Fund gala. Tickets and the auction list are with the steward by the door.' : 'Dance class is under way. Madame Vasquez takes latecomers; the steward takes ten dollars.', 'good', 5000); }
  else if (key === 'spa') { if (!hasSpa()) toast(`${SPA_NAME}: day passes are at the desk (${fmt(PRICE.spa)}; hotel guests are free).`, 'info', 4200); }
  else if (key === 'room') { const s = stayInfo(); if (S.order && G.state.t >= S.order.t) { S.tray = S.order.id; S.order = null; } if (S.tray && sc.hot) sc.hot.trayState({ dome: true }); if (s && !S._seen) toast(`${s.name}. The door clicks shut and the city goes quiet. Bed, bathrobe in the wardrobe, room service on the telephone.`, 'good', 5600); S._seen = 1; }
}
function left(key, sc) { if (key === 'rest') { carry(false); if (svc) svc = null; } }
const carry = on => { const p = G.player; if (!p) return; p.carry = !!on; if (!G.busy) p.poseOpts = on ? { item: 'tray' } : null; };

/* ---------- reception, booking, checkout ---------- */
function until(t) { const d = Math.floor(t / DAY), h = (t - d * DAY) / 60; return (h < 6 ? d : d + 1) * DAY + CHECKOUT * 60; }
function book(tid) {
  const S = st(), T = TIERS.find(t => t.id === tid); if (!T || stayNow()) return false; const free = S.voucher && TIERS.findIndex(t => t.id === S.voucher) >= TIERS.indexOf(T);
  if (!free && !pay(T.price, `${NAME}: ${T.name}`, 'home')) return false; if (free) S.voucher = null;
  S.stay = { tier: T.id, no: T.no, from: G.state.t, until: until(G.state.t) }; S.nights++; S._seen = 0; G.emit('hotel:book', T.id);
  toast(`${T.name}, room ${T.no}${free ? ' (with the compliments of the house)' : ' · ' + fmt(T.price)}. Yours until ${clock(CHECKOUT)} tomorrow. Take the lift to 7; the spa and breakfast are included.`, 'good', 6500); return true;
}
function checkout(quiet) { const S = st(); if (!S.stay) return false; S.stay = null; S.tray = null; S.order = null; robe(false); G.emit('hotel:checkout'); if (!quiet) toast('"We hope to see you again at the Grand Maple." Your key goes back in its pigeonhole.', 'info', 4200); return true; }
function lateCheckout() { const s = stayNow(); if (!s || s.late) return false; if (!pay(PRICE.late, 'Late checkout', 'home')) return false; s.late = 1; s.until += 180; toast(`Late checkout: the room is yours until ${clock(CHECKOUT + 3)}.`, 'good', 3600); return true; }
function ringBell(sc) { const S = st(); S.bell++; G.emit('hotel:bell'); bubble(G.player, '*ding!*', 1400); if (sc && sc.hot) sc.hot.ring(); stamp('x:hotel_visit'); add('fun', S.bell < 4 ? 2 : 0); setTimeout(() => { if (G.scene === sc && !G.modal && !G.busy) reception(); }, 900); return true; }
async function reception() {
  const S = st(), s = stayInfo(), opts = [];
  if (s) { opts.push({ label: `Your room: ${s.name}, ${s.no}`, sub: `Yours until ${clock(((s.until % DAY) / 60))} · lift to floor 7`, value: 0, disabled: true }); if (!s.late) opts.push({ label: 'Late checkout', sub: `${fmt(PRICE.late)} · keep the room until ${clock(CHECKOUT + 3)}`, value: 'late' }); opts.push({ label: 'Check out now', value: 'out' }); }
  else for (const T of TIERS) { const free = S.voucher && TIERS.findIndex(t => t.id === S.voucher) >= TIERS.indexOf(T); opts.push({ label: `${T.name} · ${free ? 'your voucher' : fmt(T.price)}`, sub: T.blurb, value: 'b:' + T.id, disabled: !free && !!(G.money && G.money.canAfford && !G.money.canAfford(T.price)) }); }
  opts.push({ label: hasSpa() ? 'Spa: you are welcome upstairs' : `Spa day pass · ${fmt(PRICE.spa)}`, sub: 'Pool, whirlpool, sauna, loungers. Second floor.', value: 'spa', disabled: hasSpa() }, { label: "What's on in the hotel", value: 'on' }, { label: 'Never mind', value: null });
  const v = await choose('Reception', opts, { text: s ? '"Is everything to your liking?"' : '"A room for tonight? Checkout is at eleven, breakfast and the spa are included, and your own things stay safe at home."' });
  if (!v) return; if (v === 'late') lateCheckout(); else if (v === 'out') checkout(); else if (v === 'spa') buySpaPass(); else if (v === 'on') whatsOn(); else if (v.startsWith('b:')) book(v.slice(2));
}
const hasSpa = () => friend() || !!stayNow() || st().spaDay === G.now().day;
function buySpaPass() { const S = st(); if (hasSpa()) return true; if (S.spaCredits > 0) { S.spaCredits--; S.spaDay = G.now().day; toast(`Spa voucher used (${S.spaCredits} left). Enjoy the water.`, 'good'); return true; } if (!pay(PRICE.spa, SPA_NAME + ' day pass')) return false; S.spaDay = G.now().day; toast(`${SPA_NAME} day pass (${fmt(PRICE.spa)}): pool, whirlpool, sauna and loungers until nine.`, 'good', 4200); return true; }
async function spaDesk() { if (!spaOpen()) return toast('The desk is closed.', 'info'); const v = await choose(SPA_NAME, [{ label: hasSpa() ? 'Day pass (you are all set)' : `Day pass · ${fmt(PRICE.spa)}`, sub: friend() ? 'Friends of the house swim free' : stayNow() ? 'Included with your room' : 'Pool, whirlpool, sauna, loungers, showers', value: 'p', disabled: hasSpa() }, { label: `Massage · ${fmt(stayNow() ? PRICE.massage - 10 : PRICE.massage)}`, sub: 'Forty-five minutes with Ingrid. Ask at her table.', value: 'm' }, { label: 'Bath salts, oils and robes', sub: 'From the boutique', value: 's' }, { label: 'Not just now', value: null }], { text: `Open ${clock(HOURS.spa[0])} to ${clock(HOURS.spa[1])}. Swimwear and towels are in the lockers.` }); if (v === 'p') buySpaPass(); else if (v === 's') shop(); else if (v === 'm') toast('"Ingrid is just through there, beside the sauna."', 'info'); }
const shop = () => G.shop && G.shop.open(HV.gifts, { checkHours: true });

/* ---------- concierge ---------- */
const KINDS = [['A good dinner', 'food'], ['Coffee', 'coffee'], ['Groceries', 'groceries'], ['Something fun to do', 'fun'], ['Shopping', 'shopping'], ['A train or a bus', 'transit']];
function whereCan(kind) { const d = getDoor(); return safe(() => G.nav.find(kind, 4, d ? { x: d.x, y: d.y } : undefined)) || []; }
const getDoor = () => { const c = G.sceneCache && G.sceneCache.get('city'), w = (c && c.world) || built; return w ? w.pois.find(p => p.id === DOOR) : null; };
function callCab(placeId) { const pl = placeId && safe(() => G.places.get(placeId)); if (pl && G.nav && G.nav.routeTo) { const o = (safe(() => G.nav.routeTo(pl, getDoor() || undefined)) || []).find(q => q.mode === 'cab'); if (o) { safe(() => G.nav.start(o)); toast(`"A MapleCab for ${pl.name}. It will be at the kerb when you step outside."`, 'good', 4400); return true; } } safe(() => G.phone.open('taxi')); return !!G.phone; }
async function concierge(c) {
  const ch = st().chain, w = 'Odile, concierge'; if (c) { c._hold = 6; }
  const v = await choose('Concierge', [{ label: 'Where can I find...?', sub: 'Odile knows every door in Maple Bay', value: 'w' }, { label: 'Call me a cab', value: 'c' }, { label: "What's on in town?", value: 't' }, { label: "What's on in the hotel?", value: 'h' }, { label: ch.st === 0 ? 'You look worried.' : ch.st === 3 ? 'About those suitcases...' : 'About the three suitcases', sub: ch.st === 1 ? `${Object.keys(ch.got).length} of 3 found` : ch.st === 2 ? 'All three are tagged!' : '', value: 'x' }, { label: 'Nothing, thank you', value: null }], { text: '"Good ' + (G.now().hf < 12 ? 'morning' : G.now().hf < 18 ? 'afternoon' : 'evening') + '. How may I help?"' });
  if (v === 'w') { const k = await choose('Where can I find...?', KINDS.map(q => ({ label: q[0], value: q[1] })).concat([{ label: 'A restroom', value: 'bladder' }, { label: 'Never mind', value: null }])); if (!k) return; if (k === 'bladder') return say([{ who: w, text: 'Two doors to the right of the key rack, between reception and the lifts.' }]);
    const rows = whereCan(k); G.emit('hotel:concierge', k); if (!rows.length) return say([{ who: w, text: 'Do you know, for once I am not sure. Ask me again tomorrow.' }]);
    const p = await choose('Odile suggests', rows.map(r => ({ label: r.name, sub: `${Math.round(r.d)} m${r.open === false ? ' · closed now' : r.open ? ' · open' : ''}${r.note ? ' · ' + r.note : ''}`, value: r })).concat([{ label: 'Thank you, that is all', value: null }]), { text: '"I will mark it on your map."' }); if (!p) return;
    const pl = typeof p.id === 'string' ? safe(() => G.places.get(p.id)) : null, tgt = pl || { x: p.x, y: p.y, name: p.name }; if (!safe(() => G.nav.offer(tgt).length)) safe(() => G.phone.setWaypoint(tgt)); toast(`"${p.name}. Out of the revolving door and follow the arrow."`, 'good', 4200); }
  else if (v === 'c') { const pls = [safe(() => G.places.get('home'))].concat(safe(() => G.places.list('venue').filter(p => G.places.known(p.id) && p.id !== 'hotel').slice(0, 6)) || []).filter(Boolean); const d = await choose('A cab to...', pls.map(p => ({ label: p.name, value: p.id })).concat([{ label: 'Somewhere else (open MapleCab)', value: '?' }, { label: 'Never mind', value: null }])); if (d) callCab(d === '?' ? null : d); }
  else if (v === 't') { const ev = (safe(() => G.guide.whatsOn()) || []).filter(e => !/hotel_/.test(e.entryId || '')).slice(0, 4); say([{ who: w, text: ev.length ? 'This week: ' + ev.map(e => `${e.title} (${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][e.day % 7]} ${e.clock})`).join('; ') + '.' : 'A quiet week in town. All the more reason to stay in: tea at two, the pianist at five.' }]); }
  else if (v === 'h') whatsOn(); else if (v === 'x') talkChain();
}
function events(days = 7) {
  const n = G.now(), out = ballNext(n, days).map(e => Object.assign({ place: BALL_NAME }, e));
  for (let d = n.day; d < n.day + days; d++) { const wd = d % 7; if (JAZZ.nights.includes(wd) && (d > n.day || n.hf < JAZZ.hours[1])) out.push({ id: 'jazz', name: `${JAZZ.name} at ${BAR_NAME}`, day: d, from: JAZZ.hours[0], to: JAZZ.hours[1], place: 'Rooftop' }); if (wd === 6 && (d > n.day || n.hf < HOURS.brunch[1])) out.push({ id: 'brunch', name: 'Sunday Brunch at ' + REST_NAME, day: d, from: HOURS.brunch[0], to: HOURS.brunch[1], place: REST_NAME }); }
  return out.sort((a, b) => a.day * 24 + a.from - b.day * 24 - b.from);
}
async function whatsOn() {
  const n = G.now(), ev = events(7).slice(0, 6), set = PIANO_SETS.find(s => s[1] > n.hf), dn = d => (d === n.day ? 'Today' : d === n.day + 1 ? 'Tomorrow' : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][d % 7]);
  const v = await choose("What's On at the Grand Maple", ev.map(e => ({ label: e.name, sub: `${dn(e.day)} ${clock(e.from)} to ${clock(e.to)} · ${e.place} · add to planner`, value: e })).concat([{ label: 'Close', value: null }]), { text: `Every day: breakfast buffet ${clock(HOURS.breakfast[0])} to ${clock(HOURS.breakfast[1])}, afternoon tea ${clock(HOURS.tea[0])} to ${clock(HOURS.tea[1])}, dinner from ${clock(HOURS.dinner[0])}. Piano in the lounge: ${set ? `next set ${clock(set[0])}` : 'tomorrow at ' + clock(PIANO_SETS[0][0])}. This week's flowers: ${FLOWERS[Math.floor(n.day / 7) % FLOWERS.length].name.toLowerCase()}.` });
  if (!v || !G.planner) return; const t = v.day * DAY + v.from * 60; if (safe(() => G.planner.list(t - 1, t + 1, { events: false }).some(a => a.data && a.data.hotel === v.id))) return toast('That is already in your planner.', 'info');
  safe(() => G.planner.add({ title: v.name, placeId: 'hotel', t, dur: (v.to - v.from) * 60, kind: 'event', data: { hotel: v.id } })); toast(`Added to your planner: ${v.name}, ${dn(v.day).toLowerCase()} at ${clock(v.from)}.`, 'good', 3800);
}
function flowers() { const S = st(), wk = Math.floor(G.now().day / 7), F = FLOWERS[wk % FLOWERS.length], fresh = S.flowersWeek !== wk; if (fresh) { S.flowersWeek = wk; add('fun', 5); } toast(`${F.name}, taller than you are. ${fresh ? 'They are changed every Monday morning; you breathe in and feel better about everything.' : 'Still perfect. Somebody mists them at dawn.'}`, 'good', 4400); }
function staffWall() { toast(st().chain.st >= 3 ? `OUR PEOPLE. Gus, Odile, Marisol, Laurent... and in the middle, in the gold frame: ${who()}, "Friend of the House".` : 'OUR PEOPLE. Gus the doorman, thirty-one years. Odile the concierge. Marisol from the roof. The middle frame is empty, with a small brass plate waiting to be engraved.', 'info', 5600); }
function talkDoorman(c) { const S = st(); if (dressNote('door', c)) return; bubble(c, pick(S.visits >= 3 ? [`Anything you need, ${who()}, you ask for Gus.`, 'Thirty-one years on this door. I have opened it for two prime ministers and one escaped parrot.', 'Wedding on Saturday. I have polished the brass twice.'] : ['Reception is straight ahead, the restaurant to your left, lifts at the back.', 'The door looks after itself. I look after the people.', 'First rule of a revolving door: commit.']), 4200); }

/* ---------- the lobby piano ---------- */
async function pianoMenu() {
  const now = pianoNow(), n = G.now(), set = PIANO_SETS.find(s => s[1] > n.hf);
  const v = await choose('Piano in the Lounge', PIECES.map(p => ({ label: `${p.title} · ${p.by}`, sub: now && now.id === p.id ? 'Playing now' : now ? `Request it · ${fmt(PRICE.request)} in the tip glass` : `Heard ${st().heard[p.id] || 0} times`, value: p.id, disabled: !now || now.id === p.id })).concat([{ label: 'Close', value: null }]), { text: now ? `Now playing: ${now.title}. Sit on a lounge sofa to listen properly.` : `Mr. Okonkwo plays ${PIANO_SETS.map(s => clock(s[0]) + ' to ' + clock(s[1])).join(', ')}. ${set ? 'Next set at ' + clock(set[0]) + '.' : ''}` });
  if (v) pianoRequest(v);
}
function pianoRequest(id) { const i = PIECES.findIndex(p => p.id === id); if (i < 0 || !pianoOn) return false; if (!pay(PRICE.request, 'Tip for the pianist')) return false; requested = i; const sc = scn(HR.lobby); if (sc && sc.hot) bubble(sc.hot.pianist, `${PIECES[i].title}? With pleasure. Next.`, 3200); return true; }
function talkPianist(c) { const now = pianoNow(); bubble(c, now ? pick([`This one is ${now.title}. ${now.by} wrote it for rooms like this.`, 'Requests go in the glass. Rachmaninoff costs extra.', 'Sit. Nobody ever listens standing up.']) : 'On my break.', 3800); }
function listen(fx, sc) {
  if (G.busy) return false; const s = freeSeat(fx, sc); if (!s) { toast('Those seats are taken.', 'info'); return false; } const S = st(), p = G.player, on = () => !!pianoNow(); let got = 0;
  G.startActivity({ label: on() ? 'Listening to the pianist' : 'Sitting in the lounge', anim: 'sit', minutes: LISTEN_MIN, rate: 1.6, at: { x: s.x, y: s.y, z: s.z || .42, dir: s.dir === undefined ? 1 : s.dir }, tick: gm => { add('energy', gm * .12); if (on()) { add('fun', gm * .55); got += gm; } else add('fun', gm * .1); },
    done: () => { p.poseOpts = null; if (got >= LISTEN_MIN * .6) { const pc = pianoNow() || PIECES[pieceI]; S.heard[pc.id] = (S.heard[pc.id] || 0) + 1; S.listens++; moodlet('inspired'); xp('creativity', 8); stamp('x:hotel_piano'); G.emit('hotel:listen', pc.id); toast(`${pc.title}, ${pc.by}. The last note hangs under the chandelier and a few people forget to keep talking.`, 'good', 5200); } else toast('A deep sofa and nowhere to be. The piano lid is closed for now.', 'info', 3600); }, cancel: () => { p.poseOpts = null; } });
  p.poseOpts = { seated: true }; return true;
}

/* ---------- The Gilded Maple: buffet, tea, dinner ---------- */
const MD = 'Laurent, maitre d\'';
function buffetStart() { const S = st(), n = G.now(), m = meal(n); if (m !== 'breakfast' && m !== 'brunch') return false; if (S.buffetDay !== n.day) { const free = m === 'breakfast' && !!stayNow(), price = m === 'brunch' ? PRICE.brunch : PRICE.buffet; if (!free && !pay(price, m === 'brunch' ? 'Sunday brunch' : 'Breakfast buffet', 'dish')) return false; S.buffetDay = n.day; G.emit('hotel:meal', m); }
  S.plate = []; carry(true); toast('A warm plate. Fill it at the stations along the windows (up to five things), then sit down at your table. Come back as often as you like.', 'good', 5200); return true; }
function buffetTake(id, fx, sc) {
  const S = st(), n = G.now(), m = meal(n), b = BUFFET.find(q => q.id === id); if (!b) return false;
  if (m !== 'breakfast' && m !== 'brunch') { toast('The buffet is cleared away. Breakfast is 6:30 to 10:30.', 'info'); return false; } if (S.buffetDay !== n.day) { toast(`"A plate first!" See ${MD.split(',')[0]} at the host stand by the door.`, 'info', 3600); return false; }
  if (S.plate.length >= 5) { toast('Your plate is a small mountain already. Sit down and eat; you can come back.', 'info', 3600); return false; }
  S.plate.push(id); carry(true); bubble(G.player, '+ ' + b.name, 1600); G.emit('hotel:buffet', id, S.plate.length); return true;
}
function buffetEat(fx, sc) {
  sc = sc || scn(HR.rest); if (!sc || G.busy) return false; const S = st(); if (!S.plate.length) return false; fx = fx || sc.hot.mine.fx; const s = freeSeat(fx, sc); if (!s) { toast('That table is taken.', 'info'); return false; }
  const its = S.plate.map(id => BUFFET.find(b => b.id === id)).filter(Boolean), si = fx.seats.indexOf(s), sv = fx.seats.map((q, i) => (i === si ? '#f6d24a' : (fx.ob.p.serve || [])[i] || 0)), p = G.player; carry(false);
  fx.ob.p = Object.assign({}, fx.ob.p, { serve: sv }); fx.ob._key = null;
  const fin = part => { const k = part ? .5 : 1, e = { hunger: 0, fun: 0, energy: 0 }; for (const b of its) { e.hunger += b.hunger * k; e.fun += b.fun * k; e.energy += (b.energy || 0) * k; if (b.caffeine) e.caffeine = true; if (b.alcohol) e.alcohol = (e.alcohol || 0) + b.alcohol; } if (G.inv && G.inv.applyEffects) safe(() => G.inv.applyEffects(e)); else { add('hunger', e.hunger); add('fun', e.fun); add('energy', e.energy); } if (its.some(b => /juice|coffee|mimosa/.test(b.id))) add('bladder', -9);
    S.plate = []; p.poseOpts = null; const sv2 = (fx.ob.p.serve || []).slice(); sv2[si] = 0; fx.ob.p = Object.assign({}, fx.ob.p, { serve: sv2 }); fx.ob._key = null; if (!part) { moodlet('good_meal'); toast(`${its.map(b => b.name).join(', ')}. That is how a day should start.`, 'good', 4600); } };
  G.startActivity({ label: 'Breakfast at ' + REST_NAME, anim: 'eat', minutes: 6 + its.length * 4, rate: 2.4, at: { x: s.x, y: s.y, z: s.z || .45, dir: s.dir }, done: () => fin(false), cancel: () => fin(true) }); p.poseOpts = { seated: true }; return true;
}
/** one seated service at your table: courses [{ name, col, min, fx: effects | item }] arrive one by one, carried from the kitchen */
function runService(sc, courses, o) {
  if (G.busy || svc) return false; const seat = sc.hot.mySeat(), p = G.player; let i = -1, t = 0, t0 = G.time; const me = svc = { phase: 'coming', i: 0, of: courses.length, label: o.label };
  const apply = c => { const it = c.item ? ITEM_BY_ID[c.item] : null, e = it ? it.effects : c.fx; if (G.inv && G.inv.applyEffects) safe(() => G.inv.applyEffects(e)); else for (const k in e) add(k, e[k]); if (it) G.emit('inv:use', it.id); G.emit('hotel:course', c.name); };
  const next = () => { i++; me.i = i; if (i >= courses.length) { me.phase = 'end'; t0 = G.time; sc.hot.serveMe(null, () => { me.phase = 'done'; }); return; } me.phase = 'coming'; t0 = G.time; const c = courses[i]; sc.hot.serveMe(c.col, () => { if (svc !== me) return; me.phase = 'eat'; t = 0; p.pose = 'eat'; toast(c.name + (c.say ? '. ' + c.say : '.'), 'good', 3400); }); };
  const fin = ok => { if (svc === me) svc = null; p.poseOpts = null; sc.hot.myDone(); if (o.done) o.done(ok, Math.max(0, Math.min(courses.length, i + (me.phase === 'eat' ? 0 : 0)))); };
  G.startActivity({ label: o.label, anim: 'sit', minutes: 600, rate: 2.2, at: { x: seat.x, y: seat.y, z: seat.z || .45, dir: seat.dir }, canCancel: true,
    tick: gm => { if (me.phase === 'eat') { t += gm; if (t >= courses[i].min) { apply(courses[i]); p.pose = 'sit'; next(); } } else if (me.phase === 'done') G.endActivity(true); else if (G.time - t0 > 60) { if (me.phase === 'end') me.phase = 'done'; else { me.phase = 'eat'; t = 0; p.pose = 'eat'; } } },
    done: () => fin(true), cancel: () => fin(false) });
  p.poseOpts = { seated: true }; next(); return true;
}
function tea(sc) { sc = sc || scn(HR.rest); if (!sc || meal(G.now()) !== 'tea') return false; if (!pay(PRICE.tea, 'Afternoon tea', 'dish')) return false; const S = st(); G.emit('hotel:meal', 'tea');
  return runService(sc, [{ name: 'Afternoon tea: finger sandwiches, warm scones, clotted cream, tiny cakes and a pot of Maple Bay Breakfast', col: 'tea', min: 30, fx: { hunger: 34, fun: 16, energy: 6, caffeine: true } }], { label: 'Afternoon tea', done: ok => { if (ok) { S.teas++; moodlet('hotel_tea'); add('bladder', -10); toast('You reach the top tier. The last tiny cake is lemon. Of course it is.', 'good', 4400); } } }); }
function dinner(sc, n, picks) {
  sc = sc || scn(HR.rest); if (!sc || meal(G.now()) !== 'dinner') return false; n = n === 5 ? 5 : 3; picks = picks || {}; const S = st(), it = (k, i) => { const id = picks[k] || MENU[k][i || 0], q = ITEM_BY_ID[id]; return { name: q.name, col: { starter: '#f4ecd0', main: '#f08a6a', dessert: '#e8b060' }[k], min: q.eatMinutes, item: id }; };
  if (!pay(n === 5 ? PRICE.dinner5 : PRICE.dinner3, `${REST_NAME}: ${n} courses`, 'dish')) return false; G.emit('hotel:meal', 'dinner');
  const cs = []; if (n === 5) cs.push({ name: EXTRA.amuse.name, col: '#e8f0e0', min: EXTRA.amuse.min, fx: { hunger: EXTRA.amuse.hunger, fun: EXTRA.amuse.fun }, say: 'With the compliments of the kitchen' }); cs.push(it('starter', 0), it('main', 0)); if (n === 5) cs.push({ name: EXTRA.cheese.name, col: '#f6e2a0', min: EXTRA.cheese.min, fx: { hunger: EXTRA.cheese.hunger, fun: EXTRA.cheese.fun } }); cs.push(it('dessert', 0));
  return runService(sc, cs, { label: `Dinner at ${REST_NAME}`, done: (ok) => { if (!ok) return toast('You fold your napkin and leave early. The kitchen is quietly heartbroken.', 'info', 3800); S.dinners++; moodlet('well_dined'); if (n === 5) stamp('x:hotel_dinner'); add('social', 4); toast(`${n} courses at ${REST_NAME}. ${MD.split(',')[0]} pulls back your chair as if you were minor royalty.`, 'good', 5200); } });
}
async function host(sc) {
  sc = sc || scn(HR.rest); if (!sc || G.busy) return; const n = G.now(), m = meal(n), S = st(), hc = sc.life && sc.life.crowd.list.find(c => c.spot.kind === 'staff'); dressNote('host', hc);
  if (!m) return say([{ who: MD, text: `The kitchen is between sittings. Breakfast buffet ${clock(HOURS.breakfast[0])} to ${clock(HOURS.breakfast[1])}, afternoon tea ${clock(HOURS.tea[0])} to ${clock(HOURS.tea[1])}, dinner ${clock(HOURS.dinner[0])} to ${clock(HOURS.dinner[1])}. Sunday brunch until two.` }]);
  if (m === 'breakfast' || m === 'brunch') { const paid = S.buffetDay === n.day, free = m === 'breakfast' && !!stayNow(), pr = m === 'brunch' ? PRICE.brunch : PRICE.buffet;
    const v = await choose(REST_NAME, [{ label: paid ? 'A fresh plate' : m === 'brunch' ? `Sunday brunch · ${fmt(pr)}` : free ? 'Breakfast buffet · included with your room' : `Breakfast buffet · ${fmt(pr)}`, sub: 'Fill your own plate at the stations along the windows, as often as you like', value: 1 }, { label: 'Not just now', value: 0 }], { text: m === 'brunch' ? '"Sunday brunch: everything from breakfast, and the salmon, the Benedict and the mimosas."' : '"Good morning. Take a plate; sit anywhere you like."' }); if (v) buffetStart(); return; }
  if (m === 'tea') { const v = await choose(REST_NAME, [{ label: `Afternoon tea · ${fmt(PRICE.tea)}`, sub: 'Three tiers, brought to your table', value: 1 }, { label: 'Not just now', value: 0 }], { text: '"Tea is served until five."' }); if (v) tea(sc); return; }
  const v = await choose(REST_NAME, [{ label: `Three courses · ${fmt(PRICE.dinner3)}`, sub: 'Starter, main, dessert', value: 3 }, { label: `The tasting menu · ${fmt(PRICE.dinner5)}`, sub: 'Five courses: amuse-bouche, starter, main, cheese, dessert', value: 5 }, { label: 'Not tonight', value: 0 }], { text: '"Good evening. A table for one? I have just the one."' }); if (!v) return;
  const picks = {}; for (const k of ['starter', 'main', 'dessert']) { const c = await choose(k === 'starter' ? 'To start' : k === 'main' ? 'To follow' : 'And to finish', MENU[k].map(id => ({ label: ITEM_BY_ID[id].name, sub: safe(() => G.inv.effectText(ITEM_BY_ID[id])) || '', value: id }))); if (!c) return; picks[k] = c; }
  dinner(sc, v, picks);
}
function table(fx, sc) { const S = st(), m = meal(G.now()); if (svc) return; if (S.plate.length && (m === 'breakfast' || m === 'brunch')) return buffetEat(fx, sc); if ((m === 'breakfast' || m === 'brunch') && S.buffetDay === G.now().day) return toast('Fill your plate at the buffet first: the stations are along the windows.', 'info', 3600); return host(sc); }

/* ---------- The Weathervane ---------- */
const houseCocktail = () => (st().chain.st >= 3 ? 'The ' + who() : null);
function nameHouse() { const it = ITEM_BY_ID.hotel_ck_house; if (!it) return; const nm = houseCocktail(); it.name = nm || 'The House Special'; it.soldAt = nm ? [HV.bar] : []; }
async function mix(id, q) {
  const C = COCKTAILS.find(c => c.id === id), it = ITEM_BY_ID[id], S = st(), sc = scn(HR.bar); if (!C || !it || G.busy) return null; const gold = !!(sc && sc.hot.golden()), price = Math.max(1, PRICE.mix - (gold ? 2 : 0)); if (!pay(price, 'Mix your own: ' + it.name, 'dish')) return null;
  const s = q !== undefined ? q : await pourGame('Mix: ' + it.name, C.steps, C.shake); if (s === null || s === undefined) { toast('"No harm done. I will finish that one for you." Marisol slides it down the bar.', 'info', 3600); s0(it, .6); return 0; }
  const stars = s >= .82 ? 3 : s >= .55 ? 2 : 1; S.mixes[id] = Math.max(S.mixes[id] || 0, stars); xp('cooking', 6 + stars * 4); xp('charisma', 3); stamp('x:hotel_cocktail'); G.emit('hotel:mix', id, stars); s0(it, .7 + stars * .15);
  toast(`${it.name}: ${'*'.repeat(stars)}${stars === 3 ? ' "Perfect. You want a job?"' : stars === 2 ? ' "Not bad at all. A touch heavy on the pour."' : ' "It is... a drink. It is definitely a drink."'}${gold ? ' Golden hour: two dollars off.' : ''}`, 'good', 5200); return stars;
}
function s0(it, mult) { const sc = scn(HR.bar), fin = () => { if (G.inv && G.inv.applyEffects) safe(() => G.inv.applyEffects(it.effects, mult)); G.emit('inv:use', it.id); drank(); }; if (G.activities && G.activities.start) { const stl = sc && sc.fixtures.find(f => /bar\.stool/.test(f.asset.id) && freeSeat(f, sc)), seat = stl && freeSeat(stl, sc); const a = safe(() => G.activities.start('drink', { minutes: 12, at: seat || undefined, seated: !!seat, label: 'Drinking ' + it.name, onDone: fin, onCancel: fin, noSummary: true })); if (a) return; } fin(); }
function drank() { const sc = scn(HR.bar); if (sc && sc.hot.golden()) { moodlet('golden_hour'); moodlet('bay_view'); } }
async function bar(sc) {
  sc = sc || scn(HR.bar); if (!sc || G.busy) return; const b = sc.hot.bartender; if (!barOpen()) return toast(`${BAR_NAME} serves from ${clock(HOURS.bar[0])} until one in the morning. The terrace is yours in the meantime.`, 'info', 4200); if (b) { b._hold = 5; dressNote('bar', b); }
  const gold = sc.hot.golden(), S = st();
  const v = await choose(BAR_NAME, [{ label: 'Order from Marisol', sub: 'Cocktails, olives, crab sliders', value: 'o' }, { label: `Shake your own · ${fmt(PRICE.mix - (gold ? 2 : 0))}`, sub: gold ? 'Golden hour price. Pour to the line, then shake.' : 'Marisol lends you the shaker. Pour to the line, then shake.', value: 'm' }, { label: 'Never mind', value: null }], { text: gold ? '"You picked the hour. Look at that sky."' : sc.hot.jazz() ? `"${JAZZ.name} tonight. Sit where you can see the drummer's hands."` : '"What will it be?"' });
  if (v === 'o') safe(() => G.shop.open(HV.bar)); else if (v === 'm') { const list = COCKTAILS.filter(c => c.id !== 'hotel_ck_house' || houseCocktail()); const id = await choose('Which one?', list.map(c => ({ label: ITEM_BY_ID[c.id].name, sub: c.steps.map(q => q[0]).join(', ') + (c.shake ? ' · shaken' : ' · stirred') + (S.mixes[c.id] ? ' · best ' + '*'.repeat(S.mixes[c.id]) : ''), value: c.id })).concat([{ label: 'Changed my mind', value: null }])); if (id) mix(id); }
}
function barMenu() { const hc = houseCocktail(); toast(`COCKTAILS. The Weathervane, Maple Old Fashioned, Harbour Fog, Golden Hour, Rooftop Garden${hc ? `, and in gold chalk at the top: "${hc}" (sloe gin, cherry, sparkling wine).` : '. There is a blank line at the top where a house special ought to be.'}`, 'info', 5600); }
function heater(fx) { const sc = scn(HR.bar), on = sc && sc.hot.heatersOn(); if (on) add('fun', 1); toast(on ? 'You hold your hands out. Somebody at the next table sighs happily.' : 'A patio heater, cold. They are lit when the evenings turn.', 'info', 3200); }

/* ---------- The Bay Ballroom ---------- */
function ticket(kind) { const S = st(), d = G.now().day; if (kind === 'class') { if (S.klassDay === d) return true; if (!pay(PRICE.klass, 'Ballroom dance class')) return false; S.klassDay = d; G.emit('hotel:ticket', 'class'); toast(`Dance class (${fmt(PRICE.klass)}). Step onto the floor; Madame Vasquez will find you a partner.`, 'good', 4000); return true; }
  if (kind === 'gala') { if (S.galaDay === d) return true; if (!friend() && !pay(PRICE.gala, 'Lighthouse Fund gala ticket')) return false; S.galaDay = d; G.emit('hotel:ticket', 'gala'); toast(friend() ? 'The steward finds your name on the list in gold ink: "Friend of the House". In you go.' : `Gala ticket (${fmt(PRICE.gala)}), all of it to the lighthouse. The auction table is by the windows; the floor is open.`, 'good', 4600); return true; } return true; }
async function steward(sc) {
  sc = sc || scn(HR.ball); const e = sc && sc.hot.event(), S = st(), d = G.now().day, w = 'Ballroom steward', hc = sc && sc.life.crowd.list.find(c => c.spot.kind === 'staff' && !c.hidden); dressNote('ball', hc);
  if (e === 'class') { const v = await choose(BALL_NAME, [{ label: S.klassDay === d ? 'Dance class (you are in)' : `Join the dance class · ${fmt(PRICE.klass)}`, value: 1, disabled: S.klassDay === d }, { label: 'Just watching', value: 0 }], { text: '"Waltz tonight. Beginners in the middle, show-offs at the edges."' }); if (v) ticket('class'); return; }
  if (e === 'gala') { const v = await choose(BALL_NAME, [{ label: S.galaDay === d ? 'Gala ticket (you have one)' : friend() ? 'You are on the list' : `Gala ticket · ${fmt(PRICE.gala)}`, sub: 'Dancing and the silent auction', value: 1, disabled: S.galaDay === d }, { label: 'Just looking', value: 0 }], { text: '"The Lighthouse Fund gala. Every dollar goes to the lamp-room roof."' }); if (v) ticket('gala'); return; }
  if (e === 'wedding') return say([{ who: w, text: 'A wedding reception. No ticket, no list: the couple said the door stays open. The cake is cut at eight.' }]);
  const nx = ballNext(G.now(), 14).slice(0, 3); say([{ who: w, text: 'Nothing on just now. Coming up: ' + (nx.length ? nx.map(q => `${q.name} (${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][q.day % 7]} ${clock(q.from)})`).join('; ') : 'ask at reception') + '. You may practise on the floor; it likes the company.' }]);
}
async function dance(sc, q) {
  sc = sc || scn(HR.ball); if (!sc || G.busy) return false; const e = sc.hot.event(), S = st(), p = G.player;
  if (e === 'class' && !ticket('class')) return false; if (e === 'gala' && !ticket('gala')) return false;
  const s = q !== undefined ? q : await beatGame(e ? 'The Dance Floor' : 'An Empty Ballroom', e === 'class' ? 'One, two, three: step on the beat' : 'Step when the ring closes', 8, e === 'class' ? 84 : 96); if (s === null || s === undefined) return false; if (G.busy) return false;
  const sp = sc.hot.spot(); if (e) sc.hot.join(true);
  G.startActivity({ label: e === 'class' ? 'Learning to waltz' : e ? 'Dancing' : 'Practising your steps', anim: 'dance', minutes: e ? DANCE_MIN : 12, rate: 2.2, at: { x: sp.x, y: sp.y, dir: 0 }, tick: gm => { add('fun', gm * (.5 + s * .5)); add('energy', -gm * .14); if (e) add('social', gm * .3); safe(() => G.needs.addFitness(gm * .012)); },
    done: () => { sc.hot.join(false); S.dances++; xp('charisma', (e === 'class' ? 16 : 8) + s * 14); xp('fitness', 6); if (e) { moodlet('great_night_out'); stamp('x:hotel_dance'); } G.emit('hotel:dance', e, s);
      toast(e === 'class' ? (s > .75 ? '"There! THAT was a waltz." Madame Vasquez applauds with two fingers, which is the most anyone gets.' : s > .4 ? '"Better. Your feet are beginning to trust each other."' : '"We will call that a beginning. Come back Thursday."') : e === 'wedding' ? (s > .6 ? 'The band swings into another one and the bride gives you a thumbs-up over a stranger\'s shoulder.' : 'You tread on a toe, apologise, and are immediately swept into the next dance anyway.') : e === 'gala' ? 'Black tie, a slow waltz, the chandeliers going round. For three minutes you are in a film.' : 'Your steps echo off four walls and three chandeliers. Not bad. Better with a band.', 'good', 5400); },
    cancel: () => { sc.hot.join(false); } });
  return true;
}
function cake(fx) { const S = st(), n = G.now(); if (fx && !fx.ob.p.cut) return toast('Three tiers, lemon and elderflower, a sugar maple leaf on top. Not until the couple cut it at eight.', 'info', 4000); if (S.cakeDay === n.day) return toast('One slice is manners. Two is a habit.', 'info'); S.cakeDay = n.day; add('hunger', 12); add('fun', 8); moodlet('sweet_treat'); toast('A slice of wedding cake on a paper napkin. Lemon and elderflower. You did not even know them and you are moved.', 'good', 4600); }
function guestbook() { const S = st(), n = G.now(); if (S.bookDay === n.day) return toast(`Your line is there, between a drawing of a cat and "LOVE YOU BOTH, Auntie Pearl".`, 'info', 3800); S.bookDay = n.day; add('fun', 4); add('social', 5); toast(`You write: "Wishing you a long and happy life. ${who()}." Nobody will know who that is. It is nice anyway.`, 'good', 4600); }
const LOTS = [{ id: 'spa', name: 'Three spa days at the Tidewater', bid: 55, win: S => { S.spaCredits += 3; return 'Three spa vouchers are yours.'; } }, { id: 'night', name: 'A night in a Bay View Deluxe', bid: 140, win: S => { S.voucher = 'bay'; return 'A voucher for a Bay View Deluxe: show it at reception.'; } }, { id: 'hamper', name: 'The Gilded Maple hamper', bid: 40, win: () => { safe(() => { G.inv.add('hotel_chocolates', 2); G.inv.add('hotel_spa_salts', 1); }); return 'Chocolates and bath salts go into your bag.'; } }];
async function auction(lot) {
  const S = st(), d = G.now().day; if (S.galaDay !== d && !ticket('gala')) return false;
  const id = lot || await choose('Silent Auction', LOTS.map(l => ({ label: l.name, sub: S.bids[l.id] === d ? 'Yours!' : `Leading bid ${fmt(l.bid - 5)} · bid ${fmt(l.bid)}`, value: l.id, disabled: S.bids[l.id] === d || !!(G.money && G.money.canAfford && !G.money.canAfford(l.bid)) })).concat([{ label: 'Just reading', value: null }]), { text: 'Three lots, three clipboards, one pencil on a string. All proceeds to the Lighthouse Fund.' });
  const L = LOTS.find(l => l.id === id); if (!L || S.bids[L.id] === d) return false; if (!pay(L.bid, 'Lighthouse Fund auction: ' + L.name)) return false; S.bids[L.id] = d; add('fun', 6); G.emit('hotel:bid', L.id); toast(`You write ${fmt(L.bid)} and your name. At half past ten nobody has beaten it. ${L.win(S)}`, 'good', 5600); return true;
}
function talkTeacher(c) { bubble(c, pick(['Madame Vasquez. Thirty years of other people\'s feet.', 'The waltz is only walking with good manners.', 'See the steward, then step onto the floor. I will do the rest.']), 3800); }

/* ---------- The Tidewater Spa ---------- */
const needSpa = () => { if (!spaOpen()) { toast('The spa is closed for the night.', 'info'); return false; } if (hasSpa()) return true; toast(`"A day pass first, please: ${fmt(PRICE.spa)} at the desk. Hotel guests are free."`, 'info', 3800); return false; };
function swimwear(on) { const S = st(); if (!!S.swim === !!on) return; S.swim = on ? 1 : 0; if (on) { S.robe = 0; safe(() => G.wardrobe.wearTemp('swim')); } else safe(() => G.wardrobe.restore()); }
function locker(sc) { if (!spaOpen()) return toast('The lockers are shut for the night.', 'info'); const S = st(); swimwear(!S.swim); toast(S.swim ? 'Swimwear on, clothes in locker 12. The key goes round your wrist.' : 'Dry, dressed, and your hair will do what it likes for the rest of the day.', 'good', 3600); }
function swim(sc) {
  sc = sc || scn(HR.spa); if (!sc || G.busy || !needSpa()) return false; const S = st(), L = sc.hot.lane(), p = G.player; swimwear(true); sc.hot.me._laps = 0; sc.hot.swimMe(true);
  G.startActivity({ label: 'Swimming laps', anim: 'stand', hide: true, minutes: SWIM_MIN, rate: 2.5, tick: gm => { add('energy', -gm * .3); add('fun', gm * .28); add('hygiene', gm * .5); safe(() => G.needs.addFitness(gm * .03)); xp('fitness', gm * .5); },
    done: () => { const laps = sc.hot.laps() + 1; sc.hot.swimMe(false); S.swims++; S.laps += laps * 2; moodlet('pumped'); stamp('x:hotel_swim'); G.emit('hotel:swim', laps * 2); toast(`${laps * 2} lengths. You hang on the rail with your heart going and the water flat as glass behind you.`, 'good', 4600); }, cancel: () => { sc.hot.swimMe(false); } });
  return true;
}
function soak(sc) {
  sc = sc || scn(HR.spa); if (!sc || G.busy || !needSpa()) return false; const S = st(); swimwear(true); sc.hot.soakMe(true);
  G.startActivity({ label: 'Soaking in the whirlpool', anim: 'stand', hide: true, minutes: 20, rate: 2.4, tick: gm => { add('energy', gm * .25); add('fun', gm * .4); add('hygiene', gm * .3); }, done: () => { sc.hot.soakMe(false); S.soaks++; moodlet('poolside'); G.emit('hotel:soak'); toast('Bubbles up to your chin and the bay in the window. Your shoulders come down from around your ears.', 'good', 4400); }, cancel: () => { sc.hot.soakMe(false); } });
  return true;
}
function sauna(fx, sc) {
  if (G.busy || !needSpa()) return false; const s = freeSeat(fx, sc), S = st(), p = G.player; if (!s) { toast('The bench is full. Somebody ladles water on the stones and everyone groans happily.', 'info'); return false; } swimwear(true);
  G.startActivity({ label: 'In the sauna', anim: 'sit', minutes: SAUNA_MIN, rate: 2, at: { x: s.x, y: s.y, z: s.z || .48, dir: 1 }, tick: gm => { add('hygiene', gm * .6); add('energy', gm * .1); add('fun', gm * .2); }, done: () => { p.poseOpts = null; S.saunas++; moodlet('zen'); G.emit('hotel:sauna'); toast('Eighty degrees, cedar and silence. You come out pink, loose and about a kilo lighter in the head.', 'good', 4400); }, cancel: () => { p.poseOpts = null; } }); p.poseOpts = { seated: true }; return true;
}
function massage(fx, sc) {
  sc = sc || scn(HR.spa); if (!sc || G.busy || !fx) return false; if (!spaOpen()) { toast('Ingrid has gone home.', 'info'); return false; } const S = st(), p = G.player, price = stayNow() ? PRICE.massage - 10 : PRICE.massage, b = fx.bed, th = sc.hot.therapist; if (!pay(price, 'Massage at ' + SPA_NAME)) return false;
  if (th) { th._hold = 30; th.pose = 'work'; th.dir = 2; bubble(th, 'Face down, breathe out. Tell me if it is too much.', 3600); }
  G.startActivity({ label: 'Massage', anim: 'sleep', minutes: MASSAGE_MIN, rate: 3, at: b ? { x: b.x, y: b.y, z: b.z || .76, dir: b.dir } : undefined, tick: gm => { add('energy', gm * .5); add('fun', gm * .3); }, done: () => { p.poseOpts = null; if (th) { th._hold = 0; th.pose = null; } S.massages++; moodlet('pampered'); G.emit('hotel:massage'); toast('Forty-five minutes later you are returned to yourself in better condition than you were lent.', 'good', 4600); }, cancel: () => { p.poseOpts = null; if (th) { th._hold = 0; th.pose = null; } } }); p.poseOpts = { blanket: '#f4f0e8' }; return true;
}
function lounger(fx, sc) { if (G.busy || !needSpa()) return false; const s = freeSeat(fx, sc), p = G.player; if (!s) { toast('Somebody has left a towel on it. The oldest claim in the world.', 'info'); return false; }
  G.startActivity({ label: 'Lying by the pool', anim: 'sit', minutes: 30, rate: 3, at: { x: s.x, y: s.y, z: s.z || .36, dir: 1 }, tick: gm => { add('energy', gm * .3); add('fun', gm * .12); }, done: () => { p.poseOpts = null; moodlet('poolside'); toast('Half an hour of ceiling. You could not say what you thought about, which is the point.', 'good', 3800); }, cancel: () => { p.poseOpts = null; } }); p.poseOpts = { seated: true }; return true; }
function fruitWater() { add('energy', 2); add('fun', 1); add('bladder', -5); bubble(G.player, pick(['Cucumber. Fancy.', 'Ahh.', 'Orange slices in the water. I live here now.']), 1800); return true; }
function wash(fx, kind) {
  if (G.busy) return false; const bath = kind === 'bath', p = G.player, seat = fx.seats && fx.seats[0];
  G.startActivity({ label: bath ? 'A long bath' : 'Showering', anim: bath ? 'sit' : 'shower', minutes: bath ? 25 : 10, rate: 3, at: seat ? { x: seat.x, y: seat.y, z: seat.z || .1, dir: seat.dir === undefined ? 1 : seat.dir } : undefined, tick: gm => { add('hygiene', gm * (bath ? 4.4 : 10.5)); if (bath) { add('fun', gm * .4); add('energy', gm * .2); } },
    done: () => { p.poseOpts = null; moodlet('squeaky_clean'); toast(bath ? 'A claw-foot tub, hot to the brim. You get out when your fingers have gone to raisins.' : 'Rain-head shower, the good soap, a towel the size of a sail.', 'good', 3800); }, cancel: () => { p.poseOpts = null; } }); if (bath) p.poseOpts = { seated: true }; return true;
}

/* ---------- the room ---------- */
function roomDoor(no, fx, sc) { const s = stayInfo(); if (s && s.no === no) return enterRoom(); const T = TIERS.find(t => t.no === no); if (T) return toast(`Room ${no}: ${T.name}. ${T.blurb} Book it at reception (${fmt(T.price)} a night).`, 'info', 4600); bubble(G.player, '*knock knock*', 1200); toast(pick(['Behind the door a television is laughing at its own jokes.', '"Not today, thank you!"', 'Silence. Then, faintly, a hair dryer.', 'Somebody is practising a best-man speech. It is not going well.', 'A room-service trolley rattles somewhere inside.']), 'info', 3400); }
function sleep(mode, fx) {
  const sc = scn(HR.room); if (!sc || G.busy) return false; if (!stayNow()) { toast('Your stay is over: the bed has already been stripped.', 'info'); return false; } fx = fx || sc.fixtures.find(f => f.item.bedfx); const S = st(), T = TIERS.find(t => t.id === sc.def.tier) || TIERS[0], n = G.now(), b = fx.bed, p = G.player, e0 = safe(() => G.needs.get('energy')) || 0, robed = outfit() === 'robe';
  const toM = Math.round((((7 - n.hf) % 24) + 24) % 24 * 60) || 1440, cap = Math.max(10, Math.floor(S.stay.until - G.state.t)), mins = Math.min(cap, mode === 'nap' ? 30 : mode === 'morning' ? toM : 600); let el = 0;
  if (G.needs) G.needs.sleeping = true;
  const end = () => { if (G.needs) G.needs.sleeping = false; p.poseOpts = null; S.sleeps++; G.emit('hotel:sleep', el); if (el >= 240) { moodlet('hotel_rested'); stamp('x:hotel_stay'); toast(`You wake in ${T.name} with the curtains glowing. ${Math.round(el / 60)} hours, and you did not move once.`, 'good', 5200); } else if (el >= 25) { moodlet('power_nap'); toast('A hotel nap: the deepest kind.', 'good', 3200); } };
  G.startActivity({ label: mode === 'nap' ? 'Napping' : 'Sleeping', anim: 'sleep', minutes: mins, rate: Math.max(6, Math.min(48, mins / 6)), at: b ? { x: b.x, y: b.y, z: b.z || .58, dir: b.dir } : undefined, tick: gm => { el += gm; add('energy', T.sleep * (robed ? 1.05 : 1) * gm / 60); if (mode === 'rested' && el >= 60 && (safe(() => G.needs.get('energy')) || 0) >= 99.5) G.endActivity(true); else if ((safe(() => G.needs.get('hunger')) || 50) < 5) G.endActivity(true); }, done: end, cancel: end });
  p.poseOpts = { blanket: ['#7a2030', '#22304e', '#b8862e'][TIERS.indexOf(T)] }; return true;
}
async function bed(fx, sc) {
  if (G.busy) return; if (!stayNow()) return toast('Your stay is over. Reception will be glad to book you another night.', 'info'); const n = G.now(), toM = Math.round((((7 - n.hf) % 24) + 24) % 24 * 60) || 1440, e = safe(() => G.needs.get('energy')) || 50, hm = m => `${Math.floor(m / 60)} h ${String(Math.round(m % 60)).padStart(2, '0')}`;
  const v = await choose('The bed', [{ label: 'Sleep until morning', sub: `Wake at 07:00 · ${hm(toM)}`, value: 'morning', disabled: !(toM >= 150 && toM <= 780 && (n.hf >= 18 || n.hf < 5)) || e > 93 }, { label: 'Sleep until rested', sub: e > 93 ? 'You are wide awake' : 'Pressed sheets, four pillows', value: 'rested', disabled: e > 93 }, { label: 'Take a nap', sub: '30 min', value: 'nap', disabled: e > 97 }, { label: 'Not yet', value: null }], { text: 'Turned down, a chocolate on the pillow.' }); if (v) sleep(v, fx);
}
function orderRS(id) { const it = ITEM_BY_ID[id], S = st(); if (!it || !stayNow() || S.order || S.tray) return false; if (!pay(it.price + 3, 'Room service: ' + it.name, 'dish')) return false; S.order = { id, t: G.state.t + ORDER_MIN }; G.emit('hotel:order', id); toast(`"${it.name}, room ${stayInfo().no}. About ten minutes."`, 'good', 3600); return true; }
async function phone(sc) {
  if (G.busy) return; const S = st(); if (!stayNow()) return toast('The line is dead. So is your booking.', 'info'); if (S.order) return toast('"Your tray is on its way up."', 'info'); if (S.tray) return toast('"Is everything all right with your order?" The tray is on the table.', 'info');
  const list = Object.values(ITEM_BY_ID).filter(i => (i.soldAt || []).includes(HV.room));
  const v = await choose('Room Service · dial 0', list.map(i => ({ label: `${i.name} · ${fmt(i.price + 3)}`, sub: safe(() => G.inv.effectText(i)) || 'Brought to your door under a silver dome', value: i.id, disabled: !!(G.money && G.money.canAfford && !G.money.canAfford(i.price + 3)) })).concat([{ label: stayNow().late ? 'Late checkout (arranged)' : `Late checkout · ${fmt(PRICE.late)}`, value: 'late', disabled: !!stayNow().late }, { label: 'Hang up', value: null }]), { text: '"Room service, good ' + (G.now().hf < 12 ? 'morning' : 'evening') + '." A tray charge of $3 applies.' });
  if (v === 'late') lateCheckout(); else if (v) orderRS(v);
}
function tray(fx, sc) {
  const S = st(), p = G.player; if (G.busy) return false; if (!S.tray) { toast(S.order ? 'Nothing yet. It is on its way.' : 'A little table with a white cloth, waiting for a silver dome. The telephone is on the desk.', 'info', 3400); return false; } const it = ITEM_BY_ID[S.tray]; if (!it) { S.tray = null; return false; }
  if (sc && sc.hot) sc.hot.trayState({ dome: false }); const fin = () => { if (G.inv && G.inv.applyEffects) safe(() => G.inv.applyEffects(it.effects)); G.emit('inv:use', it.id); G.emit('hotel:roomservice', it.id); S.tray = null; if (sc && sc.hot) sc.hot.trayState({ empty: 1 }); moodlet('good_meal'); toast(`${it.name}, eaten with your feet up. There is no finer restaurant than this one.`, 'good', 4200); };
  G.startActivity({ label: 'Room service: ' + it.name, anim: 'eat', minutes: it.eatMinutes || 12, rate: 2.5, done: fin, cancel: fin }); return true;
}
function robe(on) { const S = st(); if (on === undefined) on = !S.robe; if (!!S.robe === !!on) return !!S.robe; S.robe = on ? 1 : 0; if (on) { S.swim = 0; safe(() => G.wardrobe.wearTemp('hotel_robe')); } else safe(() => G.wardrobe.restore()); return !!S.robe; }
async function closet() { const S = st(), own = safe(() => G.wardrobe.owns('outfit_hotel_robe')); const v = await choose('Wardrobe', [{ label: S.robe ? 'Hang the bathrobe back up' : 'Put on the bathrobe', sub: S.robe ? 'Back into your own clothes' : 'White terry, a gold maple leaf on the pocket', value: 1 }, { label: 'Close the door', value: 0 }], { text: own ? 'Two robes, slippers in paper bands. You own one of these already, which makes this one feel like an old friend.' : `Two robes, slippers in paper bands, and a card: "Robes may be purchased at ${SHOP_NAME}."` }); if (!v) return; robe(); toast(S.robe ? 'It weighs about the same as a sleeping cat. You are never taking it off.' : 'Back in the wardrobe.', 'good', 3200); }
async function minibar() { const v = await choose('Minibar', [{ label: 'Sparkling water · $4', value: ['water', 4, { energy: 3, fun: 1 }] }, { label: 'Dark chocolate · $5', value: ['chocolate', 5, { hunger: 6, fun: 7 }] }, { label: 'Salted cashews · $6', value: ['cashews', 6, { hunger: 12, fun: 2 }] }, { label: 'Close it', value: null }], { text: 'Tiny bottles, enormous prices. It was ever thus.' }); if (!v) return; if (!pay(v[1], 'Minibar', 'dish')) return; for (const k in v[2]) add(k, v[2][k]); bubble(G.player, pick(['*crack, fizz*', 'Mmm.', 'Worth it.']), 1600); }
function view(tier) { const n = G.now(), bay = tier !== 'classic', nt = n.hf >= 20 || n.hf < 6; add('fun', 3); if (bay) moodlet('bay_view'); toast(bay ? (nt ? 'The bay at night: the lighthouse counting to three, the ferris wheel, a late ferry dragging its lights across the water.' : 'The whole bay, from the cranes to the lighthouse, and gulls turning below your window.') : nt ? 'Harbor Street from seven floors up: taxi roofs, the lit canopy, the last tram sliding by.' : 'Harbor Street, the viaduct, and a slice of bay between two towers.', 'good', 4800); }

/* ---------- Odile's opportunity: the three burgundy suitcases ---------- */
const GOAL = 'hotel_cases';
const goalText = () => { const c = st().chain, n = Object.keys(c.got).length; return c.st === 2 ? 'Tell Odile the three suitcases are tagged' : `Find the Grand Maple's lost suitcases (${n}/3)`; };
function setGoal() { const c = st().chain; if (!G.goals) return; if (c.st === 1 || c.st === 2) { const g = G.goals.get(GOAL); if (g) { g.text = goalText(); G.emit('goals:change'); } else safe(() => G.goals.add({ id: GOAL, text: goalText(), group: 'opportunity', placeId: 'hotel', hint: 'Three identical burgundy suitcases left the Grand Maple with the wrong luggage: one went to Central Station, one out to the airport kerb, one to a taxi stand across town. Each has a brass hotel tag and glows softly. Tie a label on each, then tell Odile the concierge.' })); } else if (c.st === 3) safe(() => { if (G.goals.get(GOAL) && !G.goals.isDone(GOAL)) G.goals.complete(GOAL); }); }
function takeCase(i) {
  const c = st().chain, d = CASES[i]; if (G.busy || !d || c.got[i]) return false;
  if (c.st !== 1) { toast('A burgundy suitcase with a brass GRAND MAPLE tag, quite alone. Somebody at the hotel on Harbor Street must be frantic.', 'info', 4600); return false; }
  G.startActivity({ label: 'Checking the suitcase', anim: 'work', minutes: 5, rate: 2, done: () => { c.got[i] = 1; const n = Object.keys(c.got).length; if (n >= 3) c.st = 2; if (cases[i] && cases[i].ob) cases[i].ob.hidden = true; setGoal(); G.emit('hotel:case', i, n); if (n >= 3) G.emit('hotel:chain', 2); say([{ who: d.short, text: d.found }]).then(() => toast(`Labelled for collection: the hotel van will fetch it (${n}/3).${n >= 3 ? ' That is all three. Back to Odile.' : ''}`, 'good', 4600)); } }); return true;
}
function talkChain() {
  const c = st().chain, w = 'Odile, concierge';
  if (c.st === 0) return say([{ who: w, text: 'It shows? Twenty-two years at this desk and I have never lost so much as an umbrella. Until Saturday.' }, { who: w, text: 'Mrs. Halloran-Voss checked out during the wedding rush. Three burgundy suitcases, identical. In the crush at the kerb, one went into a cab for Central Station, one onto the airport shuttle, and one, I am told, into the florist\'s van with the lilies.' }, { who: w, text: 'She sails on Friday. If anyone were to come across them, a hotel label on each handle and our van would do the rest.' }])
    .then(() => choose('Look out for the three suitcases?', [{ label: 'I will find them', value: 1 }, { label: 'Not just now', value: 0 }])).then(v => { if (v === 1) { c.st = 1; setGoal(); G.emit('hotel:chain', 1); toast('New opportunity: three burgundy suitcases, at Central Station, the airport kerb and a taxi stand across town. Each one glows softly.', 'good', 5600); } });
  if (c.st === 1) { const left = CASES.filter((d, i) => !c.got[i]).map(d => d.where); return say([{ who: w, text: Object.keys(c.got).length ? `The van has been out! Still missing: the one ${left.join('; and the one ')}.` : `Nothing yet? I would start ${left[0]}.` }]); }
  if (c.st === 2) return say([{ who: w, text: 'All three? ALL three. The hats, the shoes and the one that smells of lilies. Mrs. Halloran-Voss wept on the telephone. Happily. I think.' }, { who: w, text: 'The management would like to say thank you properly. Marisol is putting your name on the cocktail list. Gus is hanging your photograph. And you, my friend, swim free in this house for as long as it stands.' }]).then(() => {
    c.st = 3; G.state.flags.hotel_friend = true; st().voucher = st().voucher || 'classic'; safe(() => G.money.add(90, 'Thank-you from the Grand Maple')); safe(() => G.inv.add('hotel_tag', 1)); nameHouse(); setGoal(); G.emit('hotel:chain', 3); const sc = scn(HR.lobby); if (sc && sc.hot) sc.hot.sync();
    toast(`Friend of the House: $90, a night in a Classic Room on the house, the spa free for life and a place on every gala list. Your photograph hangs on the "Our People" wall, and on the roof there is a new cocktail: "${houseCocktail()}".`, 'good', 9000); });
  say([{ who: w, text: pick(['Mrs. Halloran-Voss sent a postcard from Lisbon. It is addressed to "the clever one".', `They order "${houseCocktail()}" upstairs without knowing who it is. I always tell them.`, 'Your photograph is slightly crooked. Gus says it gives it character.']) }]);
}

/* ---------- guide wiring ---------- */
function patchGuide() {
  const e = safe(() => G.guide.get('place:hotel')); if (!e) return; const n = G.now();
  e.blurb = CORE_BLURB.hotel; e.type = 'Grand hotel'; e.chapter = 'sights'; e.also = ['eat', 'shows', 'fitness']; e.price = `Lobby free · rooms from ${fmt(TIERS[0].price)} · dinner from ${fmt(PRICE.dinner3)} · spa ${fmt(PRICE.spa)}`;
  const T = ['hotel', 'restaurant', 'bar', 'rooftop', 'cocktails', 'piano', 'jazz', 'dancing', 'ballroom', 'spa', 'pool', 'sauna', 'brunch', 'tea', 'sleep']; e.tags = (e.tags || []).filter(t => !T.includes(t)).concat(T);
  e.tryThis = ['Ring the bell at reception', 'Ask Odile the concierge where to find anything in town', `Sit in the lounge for the pianist (${PIANO_SETS.map(s => clock(s[0])).join(', ')})`, 'Fill your own plate at the breakfast buffet', 'Afternoon tea at two, Sunday brunch until two', 'Order the five-course tasting menu', 'Shake your own cocktail on the roof at golden hour', 'Rooftop jazz, Thursday to Saturday from 20:30', 'Dance class Tuesday and Thursday at seven; a wedding every Saturday', 'Swim laps, sauna, whirlpool, a massage', 'Book a room: sleep, room service, the bathrobe, the view', 'Find the three burgundy suitcases for Odile'];
  const ev = events(7)[0]; e.when = ev ? `Next: ${ev.name}, ${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][ev.day % 7]} ${clock(ev.from)}` : `Flowers this week: ${FLOWERS[Math.floor(n.day / 7) % FLOWERS.length].name.toLowerCase()}`;
}

export function init() {
  S = G.defineState('hotel', () => ({ visits: 0, lastDay: -1, stay: null, nights: 0, sleeps: 0, voucher: null, spaDay: -1, spaCredits: 0, buffetDay: -1, plate: [], dinners: 0, teas: 0, mixes: {}, heard: {}, listens: 0, dances: 0, klassDay: -1, galaDay: -1, bids: {}, bookDay: -1, cakeDay: -1, swims: 0, laps: 0, saunas: 0, massages: 0, soaks: 0, bell: 0, order: null, tray: null, robe: 0, swim: 0, flowersWeek: -1, jazzMin: 0, jazzDay: -1, chain: { st: 0, got: {} } }));
  G.on('load', () => { st(); nameHouse(); setGoal(); svc = null; }); nameHouse();
  G.hotel = {
    stay: stayInfo, book, checkout, lateCheckout, tiers: TIERS, prices: PRICE, hasSpa, buySpaPass, lift, toSpa, leaveRoom, enterRoom,
    reception, ringBell, concierge, whereCan, callCab, whatsOn, events, shop, flowers, staffWall,
    piano: { now: () => { const p = pianoNow(); return p ? { id: p.id, title: p.title, by: p.by } : null; }, request: pianoRequest, sets: PIANO_SETS, pieces: PIECES.map(p => ({ id: p.id, title: p.title, by: p.by })) }, pianoMenu, pianoTick, pianoStop, listen, talkPianist, talkDoorman, jazzTick, ballTick,
    host, meal: () => meal(G.now()), buffet: { start: buffetStart, take: id => buffetTake(id), plate: () => st().plate.slice(), eat: buffetEat }, buffetTake, table, tea, dinner, service: () => (svc ? { phase: svc.phase, course: svc.i, of: svc.of } : null),
    bar, barMenu, mix, houseCocktail, heater, steward, dance, cake, auction, guestbook, talkTeacher, ticket, ballChanged() { BP.key = null; },
    spaDesk, swim, soak, sauna, massage, lounger, locker, wash, fruitWater, roomDoor, bed, sleep, phone, order: orderRS, tray, closet, robe, minibar, view,
    chain: () => st().chain, cases: () => cases.map((p, i) => p && { i, name: CASES[i].short, x: p.x, y: p.y, got: !!st().chain.got[i] }).filter(Boolean), takeCase, talkChain, friend,
    mini: { state: () => (mini ? mini.state() : null), act: () => mini && mini.act(), auto: q => mini && mini.auto(q) }, outfit, arrived, arrivedIn, left,
    stats: () => { const S = st(); return { visits: S.visits, nights: S.nights, sleeps: S.sleeps, dinners: S.dinners, teas: S.teas, mixes: Object.keys(S.mixes).length, listens: S.listens, dances: S.dances, swims: S.swims, laps: S.laps, saunas: S.saunas, massages: S.massages, bell: S.bell, chain: S.chain.st, stay: stayInfo() }; },
  };
  G.on('room:build', sc => { if (inHotel(sc) && !built) safe(() => ensure(getCity())); });
  G.on('scene', (s, prev) => {
    if (s && s.id === 'city' && !s._hotel && s.world) { s._hotel = true; try { wire(s); } catch (e) { console.warn('hotel', e); } setGoal(); }
    const S = st(), was = inHotel(prev), now = inHotel(s);
    // the lift is a hub: keep the nav arrow on the static exits (def.exits `to`) instead of whichever floor was visited last
    if (was || now) { const L = G.state.nav && G.state.nav.edges; if (L) for (const k of Object.values(HR)) delete L['int:' + k]; }
    if (S.swim && !(s && s.roomId === HR.spa)) swimwear(false);
    if (S.robe && !now) robe(false);
    if (was && !now) { carry(false); pianoStop(); }
  });
  G.on('guide:rebuilt', patchGuide);
  G.on('inv:use', () => { if (scn(HR.bar)) drank(); });
  G.on('minutes', d => {
    const S = st(), sc = G.scene, t = G.state.t; if (!sc) return;
    if (S.stay && t >= S.stay.until) { const inRoom = sc.roomId === HR.room, no = S.stay.no; if (G.busy && inRoom) return; checkout(true); toast(`${clock(CHECKOUT)}: checkout. ${inRoom ? 'Housekeeping knocks, smiles, and holds the door.' : 'Your room key has been returned for you.'}`, 'info', 4600); if (inRoom && !G.modal) G.go('int:' + HR.floor, doorAt(no)); }
    if (S.order && t >= S.order.t && sc.roomId === HR.room && sc.hot && !G.busy) { const id = S.order.id; if (sc.hot.deliver(() => { S.tray = id; })) S.order = null; }
    if (sc.roomId === HR.spa && !spaOpen() && !G.busy && !G.modal && !sc._closing) { sc._closing = true; toast(`"${SPA_NAME} is closing for the night." An attendant hands you a last warm towel.`, 'info', 4200); G.go('int:' + HR.lobby, LOBBY_AT.stairs).then(() => { sc._closing = false; }, () => { sc._closing = false; }); }
    if (sc.roomId === HR.bar && sc.hot && sc.hot.jazz()) { const day = G.now().day; if (S.jazzDay !== day) { S.jazzMin = (S.jazzMin || 0) + (d || 1); if (S.jazzMin >= 20) { S.jazzDay = day; S.jazzMin = 0; moodlet('great_night_out'); toast(`${JAZZ.name}, a brushed snare and the skyline behind the bass player. Nights like this are why people move to cities.`, 'good', 5200); } } }
  });
  G.on('frame', () => { const sc = G.scene, p = G.player; if (!sc || sc.roomId !== HR.rest || !p) return; if (p.carry && !G.busy && !p.poseOpts) p.poseOpts = { item: 'tray' }; });
  if (typeof window !== 'undefined') window.addEventListener('pointerdown', () => { if (inHotel(G.scene)) safe(() => unlock()); }, { passive: true });
}
