// Maple Bay Arena — city entrance + plaza dressing, the schedule, tickets, watching, the in-seat activities, player cards, autographs, the lucky-ball
// chain and guide wiring. Rooms: scenes/rooms/arena.js ('arena' concourse, 'arena:backstage'), arena_bowl.js ('arena:bowl'); painters: arena2.js.
// Data + the deterministic league / game simulator: data/arena.js. Art: art/showpiece/arena.js, arena_bowl.js, _arena_lib.js, _arena_icons.js.
//
// City (once per city world, order 57.5: before places / stalls): the existing `bld.civic.arena` (212,32) gets a door poi `door:arena` (room 'arena') + its
//   interactable, and Arena Plaza is dressed at runtime: a box-office kiosk, an LED marquee with the next event and two flags. On event nights a crowd in team
//   colours gathers on the plaza and streams in; afterwards it pours out. G.places id 'arena'. Concourse open 10:00-23:00 daily (free); the bowl needs a ticket
//   from doors (one hour before the start) until it empties. Flag G.state.flags.arena_pass = a free lower-bowl seat for life (the chain reward).
// Week: Wed + Sat 19:00 Otters home games · Fri 20:00 concert (3 acts rotate) · Sun 14:00 family show (ice show / mini monster trucks alternate).
// G.arena = {
//   isOpen(), hours, now() -> { ph: 'none'|'doors'|'intro'|'live'|'final'|'exit', ev, w (world min since the start), half, won }, events(n) -> next events, eventOn(day),
//   tiers(ev) -> [{ id, name, price, sold }], buy(evOrKey, tierId) -> ticket | null, tickets(), ticketFor(ev), boxOffice(), enter() (city door), enterBowl(gate), gatesOpen(),
//   standings() -> league table, results(n), schedule(n) -> the Otters' next fixtures (home + away), game(ev) -> the simulated game, boardRows(which), lookBoard(which),
//   bowl() -> the bowl scene's state object when you are in it (scene.arena), state() -> bowl state summary | null, sitMySeat(), leaveSeat(), ff(on), cheer(), vendor(),
//   contest: { open(), enter() -> Promise<bool>, shoot(pos 0..1) , state() },  tee: { state(), grab() },  cam: { state(), react(kind) },  mascot: { state(), move(i) },
//   cards() -> [{ id, name, n, signed }], openPack(n?) -> [ids], album(), swap(), autographs() -> { id: day }, autograph(player, char), autoPlayers(ev),
//   shootAround(fx, scene), statue(), restroom(fx, scene), talkBenny(char), talkCoach(char), talkPlayer(p, char), talkPriya(char), suit(), teamDoor(), tunnelToCourt(), tunnelToBackstage(),
//   chain() -> { st: 0 none | 1 searching | 2 ball found | 3 ball returned (backstage open) | 4 asked to be Ollie | 5 in the suit | 6 done, found: [i] }, searchSpot(i), backstageOpen(),
//   debug: { goto(evKind, w) -> set the clock to w world minutes into the next event of that kind }, door(), stats() }
// State: G.state.arena = { visits, tix: [{ key, kind, tier, seat, T0, out, title }], watch: { key: min }, cred: { key: 1 }, seen: { game, concert, ice, trucks }, wins, buzzers,
//   cards: { id: n }, autos: { id: day }, packs, gold, tees, teeKey, cam, camKey, contest: { key, tries, made }, hoops, statueDay, coolerDay, encores, chain: { st, found, key } }
// Events: 'arena:visit'(first), ':ticket'(t), ':enterbowl', ':sit'(seatId), ':play'(possession), ':buzzer'(homeWon), ':final'(ev, credited), ':encore', ':contest'(made), ':tee'(caught),
//   ':cam'(kind), ':cards'(ids), ':album', ':autograph'(playerId, n), ':hoops'(made), ':chain'(st), ':mascot'(hits).
// Guide stamps: x:arena_game, x:arena_contest, x:arena_tee, x:arena_cards, x:arena_autos, x:arena_concert, x:arena_family (registered into _guide_data EXPERIENCES).
// Activity ids (for the guide): arena_watch_game, arena_shot_contest, arena_tshirt_catch, arena_fan_cam, arena_foam_finger, arena_cards, arena_autographs, arena_concert, arena_family_show, arena_shootaround.
import { G } from '../core/game.js';
import { el, root, toast, bubble, say, choose, modal } from '../ui/kit.js';
import { caption } from '../ui/goals.js';
import { enterRoom, exitRoom } from '../scenes/interior.js';
import { Char, charArt } from '../core/char.js';
import { nearestFree } from '../engine/nav.js';
import { dk, hash2, rng } from '../engine/raster.js';
import { ARENA_HOURS, ARENA_VENUES, TEAM, LEAGUE, ROSTER, CARDS, STAFF, TIERS, TUNE, ACTS, FAMILY, eventOn, nextEvents, fixture, game, gameAt, standings, results, ARENA_LOOKS, LINES } from '../data/arena.js';
import { CORE, CORE_BLURB, EXPERIENCES } from './_guide_data.js';
import { getCity } from '../world/_city.js';
import { LOOKS } from './wardrobe.js';
import { seatsOf, seatById, BOWL_ENTRY } from '../scenes/rooms/arena_bowl.js';
import { COURT } from '../art/showpiece/_arena_lib.js';
import '../art/showpiece/_arena_icons.js';

export const order = 57.5;
const NAME = 'Maple Bay Arena', DOOR = 'door:arena', DAY = 1440, O = 1, GOAL = 'arena_ball';
Object.assign(LOOKS, ARENA_LOOKS);
CORE.arena = ['shows', 'Arena', 'mask', ['fitness', 'sights', 'eat', 'shop']];
CORE_BLURB.arena = 'The big red-and-cream drum at the top of the Arts District, home of the Maple Bay Otters. Basketball on Wednesdays and Saturdays at 19:00, a concert every Friday at 20:00 and a family show on Sunday afternoons. Hot dogs on the concourse, a scoreboard the size of a bus, a mascot with a T-shirt cannon. Buy ahead for the big nights.';
for (const x of [
  { id: 'x:arena_game', title: 'Watch the Otters Play', group: 'Big days out', glyph: 'mask', place: 'place:arena', need: 'arena', blurb: 'Buy a ticket at the arena box office and sit through a whole Otters home game. Wednesdays and Saturdays, tip-off 19:00.' },
  { id: 'x:arena_contest', title: 'Shoot from Half Court', group: 'Big days out', glyph: 'mask', place: 'place:arena', need: 'arena', blurb: 'At half-time somebody from the crowd shoots from the centre circle for sixty dollars. It could be you.' },
  { id: 'x:arena_tee', title: 'Catch a Cannon T-Shirt', group: 'Big days out', glyph: 'mask', place: 'place:arena', need: 'arena', blurb: 'Ollie the Otter fires T-shirts into the stands at every time-out. Hands up, eyes open.' },
  { id: 'x:arena_cards', title: 'Complete the Otters Album', group: 'Big days out', glyph: 'mask', place: 'place:arena', need: 'arena', blurb: 'Twelve cards, three to a pack, at The Otter Den on the arena concourse. Whitlock is the shiny one.' },
  { id: 'x:arena_autos', title: 'Get an Otter\'s Autograph', group: 'Big days out', glyph: 'mask', place: 'place:arena', need: 'arena', blurb: 'After the final buzzer three players stop by the tunnel rail to sign. Bring a programme or their card.' },
  { id: 'x:arena_concert', title: 'Stay for the Encore', group: 'Big days out', glyph: 'mask', place: 'place:arena', need: 'arena', blurb: 'Friday Night Live at the arena. The lights go out, eight thousand people shout for one more song, and they always play it.' },
  { id: 'x:arena_family', title: 'See a Sunday Family Show', group: 'Big days out', glyph: 'mask', place: 'place:arena', need: 'arena', blurb: 'Maple Bay on Ice one Sunday, Mini Monster Truck Mayhem the next. 14:00 at the arena.' },
]) if (!EXPERIENCES.some(e => e.id === x.id)) EXPERIENCES.push(x);

let S = null, built = null, door = null, marq = null, kiosk = null;
const DEF = () => ({ visits: 0, tix: [], watch: {}, cred: {}, seen: { game: 0, concert: 0, ice: 0, trucks: 0 }, wins: 0, buzzers: 0, cards: {}, autos: {}, packs: 0, gold: 0, tees: 0, teeKey: '', cam: 0, camKey: '', contest: { key: '', tries: 0, made: 0 }, hoops: 0, statueDay: -1, coolerDay: -1, encores: 0, bowlSeen: 0, chain: { st: 0, found: [], key: '' } });
const st = () => { S = G.state.arena || (G.state.arena = {}); const d = DEF(); for (const k in d) if (S[k] === undefined) S[k] = d[k]; if (!S.chain.found) S.chain.found = []; if (!S.contest) S.contest = d.contest; return S; };
const fmt = n => (G.money && G.money.fmt ? G.money.fmt(n) : '$' + n);
const safe = fn => { try { return fn(); } catch (e) { return undefined; } };
const stamp = id => safe(() => G.guide && G.guide.stamp && G.guide.stamp(id));
const pick = a => a[Math.floor(Math.random() * a.length)];
const clock = h => String(Math.floor(h) % 24).padStart(2, '0') + ':' + String(Math.round((h % 1) * 60)).padStart(2, '0');
const WD = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'], WDL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const isOpen = () => { const h = G.now().hf; return h >= ARENA_HOURS[0] && h < ARENA_HOURS[1]; };
const inside = () => !!(G.scene && G.scene.def && G.scene.def.showpiece === 'arena');
const bowl = () => (G.scene && G.scene.roomId === 'arena:bowl' ? G.scene.arena : null);
const has = id => !!safe(() => G.inv.count(id) > 0);
const xp = (k, n) => safe(() => G.skills.addXp(k, n)), need = (k, n) => safe(() => G.needs.add(k, n)), moodlet = id => safe(() => G.needs.addMoodlet(id));
const playerName = () => (G.state.player && G.state.player.name) || 'Friend';
const hasPass = () => !!(G.state.flags && G.state.flags.arena_pass);
const when = ev => { const d = ev.day - G.now().day, hh = clock((ev.T0 % DAY) / 60); return (d === 0 ? 'Today' : d === 1 ? 'Tomorrow' : WDL[ev.day % 7]) + ' ' + hh; };

/* ---------- schedule ---------- */
const EVC = new Map();
const evOn = day => { let e = EVC.get(day); if (e === undefined) { e = eventOn(day) || null; if (e && e.kind === 'game') e.game = game(e.year, e.r); EVC.set(day, e); if (EVC.size > 60) EVC.delete(EVC.keys().next().value); } return e; };
function now() {
  const t = G.state.t, d = Math.floor(t / DAY);
  for (const dd of [d, d - 1]) { const ev = evOn(dd); if (!ev || t < ev.doors || t >= ev.out) continue; const w = t - ev.T0, ph = w < 0 ? (ev.kind === 'game' && w >= -TUNE.INTRO ? 'intro' : 'doors') : w < ev.len ? 'live' : w < ev.len + TUNE.FINAL ? 'final' : 'exit';
    return { ph, ev, w, half: ev.kind === 'game' && ph === 'live' && gameAt(ev.game, w).ph === 'half', won: ev.kind === 'game' && ev.game.won }; }
  return { ph: 'none', ev: null, w: 0, half: false, won: false };
}
const events = (n = 6) => nextEvents(G.now().day, n, G.state.t).map(e => evOn(e.day));
const byKey = key => { const d = G.now().day; for (let i = -1; i < 40; i++) { const e = evOn(d + i); if (e && e.key === key) return e; } return null; };
function schedule(n = 6) { const out = []; for (let d = G.now().day; out.length < n && d < G.now().day + 30; d++) { const f = fixture(d); if (f && f.T0 + 115 > G.state.t) out.push(f); } return out; }
const nextLine = () => { const e = events(1)[0]; return e ? ['NEXT: ' + WD[e.day % 7] + ' ' + clock((e.T0 % DAY) / 60), (e.kind === 'game' ? 'OTTERS V ' + e.opp.nick : e.title).toUpperCase()] : ['', '']; };
function boardRows(which) {
  if (which === 'next') return events(4).map((e, i) => (i === 0 ? '*' : '') + (WD[e.day % 7] + ' ' + clock((e.T0 % DAY) / 60) + ' ' + (e.kind === 'game' ? 'OTTERS V ' + e.opp.nick : e.kind === 'concert' ? e.act.name : e.title).toUpperCase()).slice(0, 26));
  return standings(G.state.t).map((r, i) => (r.id === 'otters' ? '*' : '') + (i + 1) + ' ' + r.abbr + ' ' + r.w + '-' + r.l);
}
async function lookBoard(which) {
  if (which === 'next') { const L = events(5), v = await choose('What\'s on at the arena', L.map(e => ({ label: e.title, sub: when(e) + ' · ' + e.sub + (ticketFor(e) ? ' · you have a ticket' : e.big ? ' · selling fast' : ''), value: e.key })).concat([{ label: 'Close', value: null }]), { text: 'Home games Wednesday and Saturday, concerts on Friday, a family show on Sunday afternoon. Tap one for tickets.' }); if (v) boxOffice(v); return; }
  const tb = standings(G.state.t), rs = results(G.state.t, 4), nx = schedule(3);
  const m = modal({ title: 'Bay Coast League' }); m.body.append(el('p.menu-text', { text: tb.every(r => r.w + r.l === 0) ? 'The season is just starting: thirty-two games each, eight weeks.' : 'Top of the table after ' + (tb[0].w + tb[0].l) + ' games.' }));
  const tbl = el('div'); Object.assign(tbl.style, { fontFamily: 'monospace', fontSize: '14px', lineHeight: '1.5', whiteSpace: 'pre' }); tbl.textContent = tb.map((r, i) => `${String(i + 1).padStart(2)}  ${r.name.padEnd(24)} ${String(r.w).padStart(2)}-${String(r.l).padEnd(2)}  ${r.pf - r.pa >= 0 ? '+' : ''}${r.pf - r.pa}${r.id === 'otters' ? '  <' : ''}`).join('\n'); m.body.append(tbl);
  if (rs.length) m.body.append(el('p.menu-text', { text: 'Otters, last results: ' + rs.map(r => `${r.won ? 'W' : 'L'} ${r.us}-${r.them} ${r.home ? 'v' : 'at'} ${r.opp.nick}${r.buzzer ? ' (buzzer-beater)' : ''}`).join(' · ') }));
  if (nx.length) m.body.append(el('p.menu-text', { text: 'Next: ' + nx.map(f => `${WDL[f.day % 7].slice(0, 3)} ${f.home ? 'v' : 'at'} ${f.opp.nick}`).join(' · ') }));
}

/* ---------- tickets ---------- */
const prune = () => { const S = st(), t = G.state.t; S.tix = S.tix.filter(k => k.out > t - 60); for (const k of Object.keys(S.watch)) if (!S.tix.some(q => q.key === k) && Object.keys(S.watch).length > 12) delete S.watch[k]; const ck = Object.keys(S.cred); if (ck.length > 40) for (const k of ck.slice(0, ck.length - 40)) delete S.cred[k]; };
const ticketFor = ev => (ev ? st().tix.find(k => k.key === ev.key) || null : null);
function tiers(ev) {
  const hrs = (ev.T0 - G.state.t) / 60, out = [];
  for (const id of ['nose', 'lower', 'court', 'floor']) { const T = TIERS[id], price = T.price[ev.kind]; if (price === undefined) continue; const lim = id === 'floor' ? 6 : TUNE.SELL[id];
    out.push({ id, name: T.name, sub: T.sub, price: hasPass() && id === 'lower' ? 0 : price, sold: ev.big ? hrs < lim : id === 'court' && hrs < .8 }); }
  return out;
}
function buy(evk, tierId) {
  const ev = typeof evk === 'string' ? byKey(evk) : evk, S = st(); if (!ev) return null; if (G.state.t >= ev.end) { toast('That one is over.', 'info'); return null; }
  const old = ticketFor(ev); if (old) { toast('You already have a ticket for that: ' + (old.seat ? seatById(old.seat).label : 'standing floor') + '.', 'info', 3600); return old; }
  const T = tiers(ev).find(q => q.id === tierId); if (!T) return null; if (T.sold) { toast(`${T.name} is sold out for ${ev.title}.`, 'info', 3600); return null; }
  if (T.price > 0 && G.money && !G.money.pay(T.price, 'Arena ticket: ' + ev.title, { category: 'fun', venue: ARENA_VENUES.place })) return null;
  let seat = null; if (tierId !== 'floor') { const L = seatsOf(tierId).filter(s => ev.kind === 'concert' ? s.st !== 'W' && s.tier !== 'court' : ev.kind === 'game' || s.tier !== 'court' || s.st < 'C2'), mid = L.filter(s => s.st[0] === 'C' || (s.a > 4 && s.a < 20)); const P = mid.length ? mid : L; seat = P[Math.floor(hash2(ev.day, S.tix.length + 3, 17) * P.length) % P.length].id; }
  const tk = { key: ev.key, kind: ev.kind, tier: tierId, seat, T0: ev.T0, out: ev.out, title: ev.title }; S.tix.push(tk);
  safe(() => G.planner.add({ title: (ev.kind === 'game' ? 'Basketball: ' : ev.kind === 'concert' ? 'Concert: ' : 'Show: ') + ev.title, placeId: 'arena', t: ev.T0 - 30, dur: ev.len + 30, kind: 'personal' }));
  G.emit('arena:ticket', tk); toast(`${ev.title}, ${when(ev)}. ${seat ? seatById(seat).label : 'Standing floor'}${T.price ? ' · ' + fmt(T.price) : ' · with your season pass'}. Doors open an hour before; it is in your planner.`, 'good', 5600); return tk;
}
async function boxOffice(key) {
  const h = G.now().hf; if (h < ARENA_HOURS[0] || h >= 22.5) { toast('The box office is shut. Open 10:00 to 22:30.', 'info'); return null; }
  let ev = key ? byKey(key) : null;
  if (!ev) { const L = events(6); const v = await choose('Box office', L.map(e => { const tk = ticketFor(e), ts = tiers(e), all = ts.every(q => q.sold); return { label: e.title, sub: `${when(e)} · ${e.sub}${tk ? ' · YOU HAVE A TICKET' : all ? ' · SOLD OUT' : ' · from ' + fmt(Math.min(...ts.filter(q => !q.sold).map(q => q.price)))}${e.big && !all && !tk ? ' · big night, selling fast' : ''}`, value: e.key, disabled: all && !tk }; }).concat([{ label: 'Never mind', value: null }]), { text: 'Otters home games Wednesday and Saturday. Friday Night Live. Sunday family show. Seven days ahead.' }); if (!v) return null; ev = byKey(v); }
  if (!ev) return null; const tk = ticketFor(ev); if (tk) { toast(`You are in ${tk.seat ? seatById(tk.seat).label : 'the standing floor'} for ${ev.title}, ${when(ev)}.`, 'info', 4200); return tk; }
  const v = await choose(ev.title, tiers(ev).map(T => ({ label: T.name + (T.sold ? ' (sold out)' : ''), sub: (T.price ? fmt(T.price) : 'Free with your season pass') + ' · ' + T.sub, value: T.id, disabled: T.sold })).concat([{ label: 'Not now', value: null }]), { text: `${when(ev)} · ${ev.sub}.${ev.kind === 'game' ? ' ' + ev.opp.name + ' are ' + ordinal(standings(G.state.t).findIndex(r => r.id === ev.opp.id) + 1) + ' in the league.' : ev.kind === 'concert' ? ' ' + ev.act.blurb : ' ' + ev.show.blurb}` });
  return v ? buy(ev, v) : null;
}
const ordinal = n => n + (['th', 'st', 'nd', 'rd'][n % 10 > 3 || (n % 100 >= 11 && n % 100 <= 13) ? 0 : n % 10]);
const gatesOpen = () => { const s = now(); return isOpen() && (s.ph === 'none' || !!ticketFor(s.ev)); };
function enterBowl(gate) {
  if (!isOpen()) { toast('The arena is closed.', 'info'); return false; } const s = now(), S = st();
  if (s.ph !== 'none') { const tk = ticketFor(s.ev); if (!tk) { toast(s.ph === 'exit' ? 'The show is over. Everybody is on their way out.' : `"Ticket, please!" ${s.ev.title} is on. The box office is by the main doors, on the left.`, 'info', 4200); return false; } }
  else if (!S.bowlSeen) toast('No event on right now. The house lights are up and the bowl is yours.', 'info', 4200);
  G.emit('arena:enterbowl'); G.go('int:arena:bowl', { x: O + BOWL_ENTRY.x + (gate ? .6 : -.6), y: O + BOWL_ENTRY.y, dir: 3 }); return true;
}

/* ---------- city: door, plaza dressing, the crowd outside ---------- */
function ensure(w) {
  if (built === w || !w || !Array.isArray(w.objs)) return; built = w;
  const ob = w.objs.find(o => o.id === 'bld.civic.arena'); if (!ob) return;
  door = w.pois.find(p => p.id === DOOR);
  if (!door) {
    const B = ob.B, dr = ob.a.door || { at: (B[3] - B[0]) / 2 }, free = (x, y) => x > 1 && y > 1 && x < w.w - 1 && y < w.h - 1 && !w.isBlocked(x, y); let sp = null;
    for (const out of [.75, 1.25, 1.75, 2.25]) { for (const off of [0, .5, -.5, 1, -1, 1.5, -1.5]) { const a = ob.flip ? { x: B[3] + out, y: B[1] + dr.at + off, dir: 0 } : { x: B[0] + dr.at + off, y: B[4] + out, dir: 1 }; if (free(a.x, a.y)) { sp = a; break; } } if (sp) break; }
    if (!sp) return;
    door = w.poi({ type: 'door', id: DOOR, room: 'arena', name: NAME, x: Math.round(sp.x * 2) / 2, y: Math.round(sp.y * 4) / 4, dir: sp.dir, district: (w.districtAt && w.districtAt(sp.x, sp.y)) || 'arts', showpiece: true });
  }
  // plaza dressing (runtime props on the paved plaza in front of the doors; nothing existing is touched)
  if (!ob.flip && !w.objs.some(o => o.id === 'prop.arena.marquee')) { const fr = (x0, y0, x1, y1) => { for (let x = x0; x <= x1; x += .5) for (let y = y0; y <= y1; y += .5) if (w.isBlocked(x, y)) return false; return true; }, x0 = ob.B[0], y1 = ob.B[4];
    safe(() => { if (fr(x0 + 12.5, y1 + .5, x0 + 15, y1 + 2.2)) kiosk = w.place('prop.arena.boxoffice', x0 + 12.5, y1 + .5, {}); });
    safe(() => { if (fr(x0 + 1, y1 + 1, x0 + 7, y1 + 1.5)) marq = w.place('prop.arena.marquee', x0 + 1, y1 + 1, { p: { a: '', b: '', c: '' } }); });
    for (const dx of [7.4, 10.2]) safe(() => { if (!w.isBlocked(x0 + dx, y1 + .5)) w.place('prop.arena.flag', x0 + dx, y1 + .3, { solid: false }); }); }
  else { marq = w.objs.find(o => o.id === 'prop.arena.marquee') || null; kiosk = w.objs.find(o => o.id === 'prop.arena.boxoffice') || null; }
  // the three places the lucky ball might be
  if (!w.pois.some(p => p.id === 'arenaball:0')) { const SP = [['door:conservatory', 3.5, 2.5, 'by the Conservatory in Central Park'], ['door:cinema', -3, 2, 'outside the Orpheum'], ['door:concerthall', 4, 2, 'on the Symphony Hall steps']];
    SP.forEach(([pid, dx, dy, where], i) => { const p = w.pois.find(q => q.id === pid) || { x: ob.B[0] - 20 - i * 14, y: ob.B[4] + 14 + i * 9 }, c = nearestFree(w, Math.round((p.x + dx) * 2), Math.round((p.y + dy) * 2), 14); if (c) w.poi({ type: 'spot', id: 'arenaball:' + i, x: c[0] / 2 + .25, y: c[1] / 2 + .25, where, quest: true }); }); }
}
const CITY = { ents: [], t: 0, key: '', sc: null };
function wire(s) {
  ensure(s.world); if (!door) return; const w = s.world;
  if (!s.interactables.some(it => it.poi === door)) s.interactables.push({ x: door.x, y: door.y, label: NAME, h: 1.2, range: 1.3, poi: door, use: () => enter() });
  if (kiosk && !s.interactables.some(it => it._arenaBox)) s.interactables.push({ x: kiosk.x + 1.2, y: kiosk.B[4], label: 'Arena box office', h: 1.6, hit: 18, range: 1.6, spot: { x: kiosk.x + 1.2, y: kiosk.B[4] + .6 }, _arenaBox: true, use: () => boxOffice() });
  for (const p of w.pois) if (/^arenaball:/.test(p.id || '') && !s.interactables.some(it => it.poi === p)) { const i = +p.id.split(':')[1];
    s.interactables.push({ x: p.x, y: p.y, label: 'Look for the lucky ball', h: .8, hit: 14, range: 1.5, poi: p, visible: () => st().chain.st === 1 && !st().chain.found.includes(i), use: () => searchSpot(i) });
    const sp = { x: p.x, y: p.y, z: w.heightAt(p.x, p.y) + .5, bb: [-.1, -.1, .1, .1, .3], get hidden() { return !(S && S.chain.st === 1 && !S.chain.found.includes(i)); }, sprite: () => sparkleSpr(Math.floor(G.time * 4) % 4) }; s.ents.push(sp); }
  // plaza crowd: a pool of fans, driven by updateCity
  if (!CITY.sc) { CITY.sc = s; const A = charArt(), r = rng(515); for (let i = 0; i < 40; i++) { const spec = Object.assign({}, A.randomSpec(r, { season: G.now().season, age: i % 9 === 4 ? 'kid' : undefined })); spec.bag = null; if (r() < .6) { spec.topColor = r() < .2 ? TEAM.c2 : TEAM.c; if (r() < .3) { spec.hat = 'cap'; spec.hatColor = TEAM.c; } } const c = new Char(spec, door.x, door.y + 1); c.hidden = true; c.i = i; c.roll = r(); c.speed = 1.6 + r() * 1.2; c.isArenaFan = true; s.ents.push(c); CITY.ents.push(c);
    s.interactables.push({ ent: c, x: c.x, y: c.y, label: 'Fan', h: 1.2, hit: 6, range: 1.7, visible: () => !c.hidden && (c.alpha === undefined || c.alpha > .6), use: () => { c._hold = 3; c.faceTo(G.player.x, G.player.y); const q = now(); bubble(c, pick(q.ph === 'exit' || q.ph === 'final' ? (q.ev.kind !== 'game' ? LINES.concert : q.won ? LINES.post_w : LINES.post_l) : q.ev && q.ev.kind === 'concert' ? LINES.concert : q.ev && q.ev.kind !== 'game' ? LINES.family : LINES.fan)); } }); } }
  syncCity(true);
}
let sprk = null;
function sparkleSpr(f) { if (!sprk) sprk = []; if (sprk[f]) return sprk[f]; const c = document.createElement('canvas'); c.width = c.height = 9; const x = c.getContext('2d'); x.fillStyle = '#fff2a8'; const r = [1, 2, 3, 2][f]; x.fillRect(4, 4 - r, 1, r * 2 + 1); x.fillRect(4 - r, 4, r * 2 + 1, 1); x.fillStyle = '#ffffff'; x.fillRect(4, 4, 1, 1); return sprk[f] = { c, l: c, x: -4, y: -4, w: 9, h: 9 }; }
function syncCity(force) {
  if (!marq) return; const L = events(2), e = L[0], s = now(), a = !e ? 'MAPLE BAY ARENA' : s.ev === e ? (s.ph === 'doors' || s.ph === 'intro' ? 'DOORS OPEN' : s.ph === 'live' ? 'ON NOW' : 'THANK YOU') : e.day === G.now().day ? 'TONIGHT ' + clock((e.T0 % DAY) / 60) : WD[e.day % 7] + ' ' + clock((e.T0 % DAY) / 60);
  const b = !e ? 'HOME OF THE OTTERS' : (e.kind === 'game' ? 'OTTERS VS ' + e.opp.nick : e.kind === 'concert' ? e.act.name : e.title).toUpperCase().slice(0, 22), c = !e ? '' : e.kind === 'game' ? (e.opp.rival ? 'THE FERRY DERBY' : e.big ? 'SELLING FAST' : 'BAY COAST LEAGUE') : e.kind === 'concert' ? 'FRIDAY NIGHT LIVE' : 'SUNDAY FAMILY SHOW', f = Math.floor(G.time / 1.2) & 1;
  if (force || marq.p.a !== a || marq.p.b !== b || marq.p.c !== c || marq.p.f !== f) { marq.p = { a, b, c, f }; marq._key = null; }
}
function updateCity(dt) {
  const sc = G.scene; if (!sc || sc.id !== 'city' || sc !== CITY.sc || !door) return; const p = G.player, near = Math.abs(p.x - door.x) < 46 && Math.abs(p.y - door.y) < 40;
  if ((CITY.t -= dt) <= 0) { CITY.t = 1; syncCity(); }
  const s = now(), w = sc.world, arriving = s.ph === 'doors' || s.ph === 'intro' || (s.ph === 'live' && s.w < 12), leaving = s.ph === 'final' || s.ph === 'exit', n = !near ? 0 : arriving ? Math.round(40 * (s.ev.big ? 1 : .7) * (s.w > 0 ? .3 : 1)) : leaving ? (s.w < s.ev.len + TUNE.OUT - 6 ? 40 : 6) : 0, dx = door.x, dy = door.y;
  for (const c of CITY.ents) {
    if (c.i >= n) { if (!c.hidden) { c.alpha = (c.alpha === undefined ? 1 : c.alpha) - dt * 2; if (c.alpha <= 0) { c.hidden = true; c.alpha = undefined; } } continue; }
    if (c.hidden) { if ((c.wait = (c.wait || Math.random() * 4) - dt) > 0) continue; c.hidden = false; c.alpha = 0; c.pose = null; c.mode = leaving ? 'out' : c.roll < .34 ? 'hang' : 'in';
      if (c.mode === 'out') { c.x = dx + (Math.random() - .5) * 1.6; c.y = dy + .2; c.tx = dx + (Math.random() - .5) * 26; c.ty = dy + 3.4 + Math.random() * 1.2; c.far = true; }
      else if (c.mode === 'in') { c.x = dx + (Math.random() < .5 ? -1 : 1) * (8 + Math.random() * 5); c.y = dy + 2.2 + Math.random() * 1.4; c.tx = dx + (Math.random() - .5) * 1.4; c.ty = dy + .15; }
      else { c.x = dx + (Math.random() - .5) * 20; c.y = dy + 1.4 + Math.random() * 2; c.tx = c.x; c.ty = c.y; c.dir = Math.floor(Math.random() * 4); c.pose = pick([null, 'talk', 'phone', 'wave', null, 'talk']); c.life = 14 + Math.random() * 30; }
      if (w.isBlocked(c.x, c.y)) { c.hidden = true; c.wait = 1; continue; } }
    c.t += dt; if (c.alpha !== undefined) { c.alpha += dt * 2.2; if (c.alpha >= 1) c.alpha = undefined; } c.z = w.heightAt(c.x, c.y);
    if (c._hold > 0) { c._hold -= dt; c.moving = false; continue; }
    if (c.mode === 'hang') { c.moving = false; if ((c.life -= dt) <= 0 || leaving) { c.mode = leaving ? 'out' : 'in'; c.pose = null; c.tx = leaving ? dx + (Math.random() - .5) * 26 : dx + (Math.random() - .5) * 1.4; c.ty = leaving ? dy + 4 : dy + .15; c.far = leaving; } continue; }
    const ex = c.tx - c.x, ey = c.ty - c.y, d = Math.hypot(ex, ey), stp = c.speed * dt;
    if (d <= stp + .05) { if (c.mode === 'out' && c.far) { c.far = false; c.ty += 3 + Math.random() * 3; c.tx += (Math.random() - .5) * 6; c.fade = true; } else { c.hidden = true; c.alpha = undefined; c.wait = (arriving ? .3 : .2) + Math.random() * (arriving ? 5 : 2.5); } continue; }
    const nx = c.x + ex / d * stp, ny = c.y + ey / d * stp; if (w.isBlocked(nx, ny)) { c.hidden = true; c.wait = 1; continue; } c.x = nx; c.y = ny; c.face(ex, ey); c.moving = true; if (c.fade) { c.alpha = Math.max(0, (c.alpha === undefined ? 1 : c.alpha) - dt * .5); if (c.alpha <= 0) { c.hidden = true; c.alpha = undefined; c.fade = false; c.wait = Math.random() * 2; } }
  }
}
function enter() {
  if (!isOpen()) { toast(`${NAME}: closed. The concourse is open daily ${clock(ARENA_HOURS[0])} to ${clock(ARENA_HOURS[1])}.`, 'info', 3800); return false; }
  enterRoom('arena', DOOR); return true;
}
function arrived(sc, pv) {
  if (pv && pv.def && pv.def.showpiece === 'arena') return; const S = st(), first = !S.visits; S.visits++; safe(() => G.places.discover('arena', true)); G.emit('arena:visit', first); const s = now();
  if (first) toast('Popcorn, floor polish and an echo. Somewhere behind the wall a ball is bouncing.', 'good', 4200);
  else if (s.ph === 'doors' || s.ph === 'intro') toast(`${s.ev.title}: ${ticketFor(s.ev) ? 'your ticket scans green. Through the turnstiles when you are ready.' : 'doors are open. The box office is on your left if you need a ticket.'}`, 'info', 4600);
}
function arrivedBowl(sc, pv) {
  const S = st(), s = now(); S.bowlSeen = 1; const tk = s.ev && ticketFor(s.ev);
  if (tk && s.ph !== 'none') { toast(tk.seat ? `${seatById(tk.seat).label}. Follow the gold arrow and tap your seat.` : 'Standing floor: walk out in front of the stage and find a spot. Tap the crowd to dance.', 'good', 4600); }
}
const arrivedBack = sc => { if (st().chain.st === 3) toast('Liniment, laundry and a whiteboard nobody is allowed to photograph. Coach Delacroix looks up.', 'good', 4600); };

/* ---------- watching ---------- */
function watchTick(gm, B) {
  const S = st(), ev = B.ev; if (!ev || B.ph === 'none') { need('fun', gm * .1); need('energy', gm * .15); return; }
  if (B.ph === 'live' || B.ph === 'intro' || B.ph === 'final') { S.watch[ev.key] = (S.watch[ev.key] || 0) + gm; need('fun', gm * (ev.kind === 'concert' ? .45 : .36)); need('social', gm * .08); }
}
function onPlay(p, pl, big) { G.emit('arena:play', p); }
function onFinal(ev, B) {
  const S = st(); if (S.cred[ev.key]) return; const frac = (S.watch[ev.key] || 0) / ev.len, ok = frac >= TUNE.MIN_WATCH && !!ticketFor(ev); S.cred[ev.key] = ok ? 1 : 2; G.emit('arena:final', ev, ok);
  if (!ok) { if (ticketFor(ev)) toast('You caught the end of it. Sit through more of the next one for the full effect.', 'info', 4200); return; }
  S.seen[ev.kind] = (S.seen[ev.kind] || 0) + 1;
  if (ev.kind === 'game') { const g = ev.game; stamp('x:arena_game'); if (g.won) { S.wins++; moodlet('arena_buzz'); need('fun', 12); } else { moodlet('arena_loss'); need('fun', 3); } if (g.buzzer) S.buzzers++;
    toast(`FINAL: Otters ${g.final[0]}, ${g.a.nick} ${g.final[1]}. ${g.won ? (g.buzzer ? 'Won it at the buzzer. You will be telling this one for years.' : 'A win! The whole bowl is singing.') : (g.buzzer ? 'Lost it on the last shot. That one is going to sting until Saturday.' : 'A loss. They will go again.')} Top scorer: ${g.top.name}, ${g.top.pts}. Three Otters are signing by the tunnel.`, 'good', 8000); }
  else if (ev.kind === 'concert') { moodlet('great_night_out'); need('fun', 12); toast(`${ev.act.name}: what a night. Your ears will forgive you by Sunday.`, 'good', 5600); }
  else { stamp('x:arena_family'); need('fun', 12); moodlet('inspired'); toast(`${ev.show.name}: the whole place is on its feet for the curtain call. Every child in the building wants ${ev.kind === 'ice' ? 'skates' : 'a monster truck'}.`, 'good', 5600); }
}
function onEncore(ev, B) { const S = st(); if (!ticketFor(ev) || S.cred['e' + ev.key]) return; S.cred['e' + ev.key] = 1; S.encores++; moodlet('arena_encore'); stamp('x:arena_concert'); G.emit('arena:encore'); toast(`They came back. "${ev.act.encore}", and everybody knows every word.`, 'good', 5000); }

/* ---------- the seat bar (non-modal: the show goes on) ---------- */
let bar = null, pop = null, coolT = 0;
const btn = (label, fn, cls) => { const b = el('button', { text: label, onclick: e => { e.stopPropagation(); fn(b); } }); Object.assign(b.style, { font: 'inherit', fontSize: '14px', padding: '7px 10px', border: '2px solid #2a2733', background: cls === 'go' ? '#f2c230' : cls === 'red' ? '#d2392f' : '#f4ead0', color: cls === 'red' ? '#fff' : '#2a2733', boxShadow: '3px 3px 0 #0006', cursor: 'pointer', touchAction: 'manipulation' }); return b; };
const mkBar = (bottom) => { const d = el('div'); Object.assign(d.style, { position: 'fixed', left: '50%', bottom, transform: 'translateX(-50%)', zIndex: 40, display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '96vw', pointerEvents: 'auto' }); root().append(d); return d; };
function seatBar(on, B) {
  if (bar) { bar.remove(); bar = null; } if (!on || !B) return; const ev = B.ev, live = ev && B.ph !== 'none';
  bar = mkBar('64px'); bar.id = 'arena-bar';
  bar.append(btn(ev && ev.kind === 'concert' ? 'Cheer' : 'Cheer!', () => cheer()));
  if (has('arena_foam_finger')) bar.append(btn('Wave the finger', () => cheer('foam')));
  if (live) { const ff = btn('Fast-forward', b => { const v = B.ff(!B.ffOn); b.textContent = v ? 'Normal speed' : 'Fast-forward'; b.style.background = v ? '#f2c230' : '#f4ead0'; }); ff.id = 'arena-ff'; bar.append(ff); bar.append(btn('Hot dog! ($5)', () => vendor())); }
  bar.append(btn('Leave seat', () => leaveSeat(), 'red'));
}
function cheer(kind) { const B = bowl(); if (!B || !G.busy || !G.busy._arena) return false; B.react(kind === 'foam' ? 'wave' : 'cheer'); B.cheer(); if (G.time > coolT) { coolT = G.time + 6; need('fun', kind === 'foam' ? 2.5 : 1.5); need('social', 1); bubble(G.player, pick(B.mode === 'concert' ? ['WOOO!', 'ONE MORE!', 'YEAH!'] : ['LET\'S GO OTTERS!', 'DE-FENSE!', 'COME ON!', 'YES!'])); } return true; }
function vendor() { const B = bowl(); if (!B || !G.busy || !G.busy._arena) return false; if (G.money && !G.money.pay(5, 'Hot dog from the vendor', { category: 'food', venue: ARENA_VENUES.grill })) return false; need('hunger', 28); need('fun', 3); G.player.pose = 'eat'; B._rt = G.time + 4; toast('"HOT DOGS! Get your hot dogs!" It comes down the row hand to hand, and your five dollars goes back the same way.', 'good', 4200); return true; }
function leaveSeat() { if (G.busy && G.busy._arena) G.endActivity(false); }
function sitMySeat() { const B = bowl(); if (!B) return false; const s = B.mySeat(); if (!s) return false; const ok = B.sit(s); if (ok) G.emit('arena:sit', s.id); return ok; }

/* ---------- half-court shot contest ---------- */
let con = null;
function closePop() { if (pop) { pop.remove(); pop = null; } }
function contestOpen(B, ga) {
  const S = st(), ev = B.ev; if (!ev || S.contest.key === ev.key || !ticketFor(ev) || S.chain.st === 5) return; closePop();
  pop = mkBar('112px'); pop.append(btn('Enter the half-court shot contest!', () => contestEnter(), 'go')); setTimeout(() => { if (pop && !con) closePop(); }, 16000);
}
function contestClose(B) { if (!con) closePop(); }
async function contestEnter() {
  const B = bowl(), S = st(); if (!B || con || !B.ev || B.ev.kind !== 'game') return false; const ga = gameAt(B.ev.game, B.w); if (ga.ph !== 'half') { toast('The contest is at half-time.', 'info'); return false; } if (S.contest.key === B.ev.key) { toast('One go per game. Leave some glory for the others.', 'info'); return false; }
  closePop(); const seat = B.mine; if (G.busy) G.endActivity(false); S.contest.key = B.ev.key; B.pass = true; B.contestBusy = true; for (const c of B.actors.homeP) void c;
  const p = G.player; p.x = O + COURT.cx - .2; p.y = O + COURT.cy; p.dir = 0; p.stop(); G.startActivity({ label: 'Half-court shot', anim: 'stand', minutes: 6, rate: TUNE.WATCH, cancel: () => { }, done: () => { } }); G.busy._con = true;
  caption('Big Stan', `From section ${seat ? seat.label.split(',')[0].replace('Section ', '') : 'somewhere'}: ${playerName().toUpperCase()}! One shot from the centre circle. Stop the marker in the gold!`, 5000);
  let made = false; for (let tr = 0; tr < TUNE.CONTEST_TRIES && !made; tr++) { const q = await meter(tr); S.contest.tries++; const lv = safe(() => G.skills.level('fitness')) || 1, win = .075 + lv * .012, off = q - .5; made = Math.abs(off) <= win; p.pose = 'cheer'; setTimeout(() => { if (G.busy && G.busy._con) p.pose = 'stand'; }, 500);
    await B.throwBall(made, { long: off > 0, side: off > 0 ? .7 : -.7, arc: 3.4 });
    if (made) { S.contest.made++; B.cheer('stand'); B.jumbo({ mode: 'text', lines: ['WINNER!', playerName().toUpperCase().slice(0, 11)], c: '#f2c230', ollie: 1 }, 6); safe(() => G.money.add(TUNE.CONTEST_PRIZE, 'Half-court shot contest')); moodlet('arena_star'); need('fun', 20); xp('fitness', 20); stamp('x:arena_contest'); caption('Big Stan', `NOTHING BUT NET! ${playerName().toUpperCase()} wins sixty dollars! Somebody sign this fan!`, 5600); }
    else caption('Big Stan', Math.abs(off) < win * 2.2 ? (off > 0 ? 'Off the back iron! So close!' : 'Front rim! Oh, that was close!') : off > 0 ? 'That one is still going. Somebody check the car park.' : 'Short! The floor says thank you.', 3600);
    if (!made && tr < TUNE.CONTEST_TRIES - 1) await new Promise(r => setTimeout(r, 900)); }
  G.emit('arena:contest', made); if (!made) { need('fun', 6); xp('fitness', 6); toast('No sixty dollars today, but eight thousand people clapped anyway. Ollie gives you a consolation high-five.', 'good', 4600); }
  await new Promise(r => setTimeout(r, 1200)); if (G.busy && G.busy._con) G.endActivity(false); B.pass = false; B.contestBusy = false; con = null;
  if (bowl() === B && seat) { p.x = O + seat.spot.x; p.y = O + seat.spot.y; B.sit(seat); } return made;
}
/** the power meter: a marker sweeps a bar; tap to stop it. Resolves 0..1 (.5 = perfect). Non-modal. */
function meter(tryN) {
  return new Promise(res => { closePop(); const wrap = mkBar('112px'); pop = wrap; const track = el('div'), gold = el('div'), mark = el('div'), lv = safe(() => G.skills.level('fitness')) || 1, win = (.075 + lv * .012) * 2;
    Object.assign(track.style, { position: 'relative', width: 'min(80vw, 360px)', height: '26px', background: '#2a2733', border: '2px solid #2a2733', boxShadow: '3px 3px 0 #0006' }); Object.assign(gold.style, { position: 'absolute', left: (50 - win * 50) + '%', width: (win * 100) + '%', top: 0, bottom: 0, background: '#f2c230' }); Object.assign(mark.style, { position: 'absolute', top: '-4px', width: '6px', height: '34px', background: '#fff', border: '1px solid #2a2733', left: '0%' });
    track.append(gold, mark); const b = btn(tryN ? 'SHOOT (last try)' : 'SHOOT', () => stop(), 'go'); wrap.append(track, b); const t0 = performance.now(), ph = Math.random() * 6; let done = false, pos = 0;
    const at = () => { const t = (performance.now() - t0) / 1000; return .5 + .5 * Math.sin(t * 3.1 + ph); };
    const stop = v => { if (done) return; done = true; pos = v === undefined ? at() : v; con = null; closePop(); res(pos); };
    con = { stop, state: () => ({ pos: Math.round(at() * 100) / 100, win, tryN }) };
    const loop = () => { if (done) return; if (performance.now() - t0 > 14000) return stop(); mark.style.left = 'calc(' + (at() * 100) + '% - 3px)'; requestAnimationFrame(loop); }; loop(); });
}

/* ---------- T-shirt cannon ---------- */
let teeS = null;
function wantTee(ev, seat) { const S = st(); if (S.teeKey === ev.key || teeS || con || !seat) return false; const p = seat.tier === 'court' ? .5 : seat.tier === 'lower' ? .4 : .25; if (Math.random() > p && !(S.tees === 0 && G.state.t - ev.T0 > 60)) return false; S.teeKey = ev.key; return true; }
function teeIncoming(e, B) {
  closePop(); const wrap = mkBar('112px'); pop = wrap; const b = btn('CATCH!', () => grab(), 'go'); b.style.fontSize = '18px'; wrap.append(b); caption('Big Stan', 'Ollie is aiming at YOUR section! Hands up!', 2600);
  teeS = { e, caught: false, tapped: false, state: () => ({ k: Math.round(e.t / e.dur * 100) / 100, tapped: teeS ? teeS.tapped : false }) };
  const grab = () => { if (!teeS || teeS.tapped) return; teeS.tapped = true; const k = e.t / e.dur; teeS.caught = k > 1 - TUNE.CATCH_WINDOW * 2.4 && k <= 1.02; b.textContent = teeS.caught ? 'GOT IT!' : k < .5 ? 'Too early!' : 'Fingertips...'; G.player.pose = 'cheer'; };
  teeS.grab = grab;
  e.onLand = () => { const S = st(), ok = teeS && teeS.caught; closePop(); teeS = null; if (G.busy && G.busy._arena) G.player.pose = 'sit'; G.emit('arena:tee', !!ok);
    if (ok) { S.tees++; stamp('x:arena_tee'); need('fun', 12); B.cheer(); const fresh = safe(() => G.wardrobe.add('arena_tshirt')); toast(fresh ? 'CAUGHT IT. A warm, tightly rolled Otters T-shirt, fired from a cannon by an otter. It is in your wardrobe.' : 'Another one! You pass it to the kid behind you, who will remember this for the rest of her life.', 'good', 5200); if (!fresh) need('social', 6); }
    else toast(teeS === null && !ok ? 'It bounces off your hands and the row behind you dives for it. Next time-out!' : 'Missed.', 'info', 3600); };
}

/* ---------- fan-cam ---------- */
let camS = null;
function wantCam(ev, ga) { const S = st(); if (S.camKey === ev.key || camS || con || teeS) return false; if (Math.random() > .45 && ga.q < 3) return false; S.camKey = ev.key; return true; }
function fanCam(B, kiss) {
  const S = st(), p = G.player, spr = safe(() => p.sprite()); closePop(); kiss = !!kiss && Math.random() < .6;
  B.jumbo({ mode: 'fancam', spr, kiss, label: kiss ? 'KISS CAM' : playerName().toUpperCase().slice(0, 14), bounce: 1 }, 7); caption('Big Stan', kiss ? 'KISS CAM! And it has landed on... oh, this fan is here on their own. Give us SOMETHING!' : 'FAN CAM! Look up, you are on the big screen!', 4200);
  const wrap = mkBar('112px'); pop = wrap; const done = kind => { if (!camS) return; camS = null; closePop(); S.cam++; G.emit('arena:cam', kind);
    if (kind === 'hide') { need('fun', 2); toast('You hide behind your programme. Eight thousand people go "awww".', 'info', 3600); return; }
    B.react(kind === 'dance' ? 'dance' : kind === 'foam' ? 'wave' : kind === 'kiss' ? 'wave' : 'wave'); B.cheer('stand'); moodlet('arena_star'); need('fun', 10); need('social', 6); xp('charisma', 10);
    toast({ wave: 'You wave with both arms. The whole bowl waves back.', dance: 'You dance. Badly, joyfully, twelve feet tall on the big screen. The crowd roars.', foam: 'Foam finger up. The camera operator zooms in. You are, briefly, the number one fan in Maple Bay.', kiss: 'You blow a kiss to the upper bowl. The upper bowl blows eight hundred back.' }[kind] || 'You are on the big screen!', 'good', 4800); };
  wrap.append(btn('Wave', () => done('wave'), 'go'), btn('Dance', () => done('dance'))); if (has('arena_foam_finger')) wrap.append(btn('Foam finger!', () => done('foam'))); if (kiss) wrap.append(btn('Blow a kiss', () => done('kiss'))); wrap.append(btn('Hide', () => done('hide')));
  camS = { react: done, kiss, t: G.time }; setTimeout(() => { if (camS) { camS = null; closePop(); toast('The camera moves on. You realise you were on the big screen the whole time.', 'info', 3600); } }, 9000);
}

/* ---------- player cards ---------- */
const cards = () => { const S = st(); return CARDS.map(c => ({ id: c.id, name: c.name, num: c.num, pos: c.pos, rare: c.rare, n: S.cards[c.id] || 0, signed: !!S.autos[c.id] })); };
function openPack(n = 1) {
  const S = st(), got = []; for (let k = 0; k < n; k++) { for (let i = 0; i < TUNE.PACK; i++) { const miss = CARDS.filter(c => !S.cards[c.id] && !got.includes(c.id)); let c; if (miss.length && Math.random() < .5) c = pick(miss); else { const wts = CARDS.map(q => [4, 2, 1][q.rare]), tot = wts.reduce((a, b) => a + b, 0); let v = Math.random() * tot; c = CARDS[0]; for (let j = 0; j < CARDS.length; j++) { v -= wts[j]; if (v <= 0) { c = CARDS[j]; break; } } } got.push(c.id); } S.packs++; }
  const fresh = got.filter((id, i) => !S.cards[id] && got.indexOf(id) === i); for (const id of got) S.cards[id] = (S.cards[id] || 0) + 1; const have = CARDS.filter(c => S.cards[c.id]).length; G.emit('arena:cards', got);
  toast(`Card pack: ${got.map(id => { const c = CARDS.find(q => q.id === id); return c.name + (fresh.includes(id) ? ' (NEW' + (c.rare === 2 ? ', shiny!)' : ')') : ''); }).join(', ')}. Album: ${have}/${CARDS.length}.`, 'good', 5600);
  if (have >= CARDS.length && !S.gold) { S.gold = 1; safe(() => G.inv.add('arena_gold_card', 1)); stamp('x:arena_cards'); moodlet('inspired'); need('fun', 15); G.emit('arena:album'); toast('THE ALBUM IS COMPLETE. The Otter Den hands you a Gold Otter Card, one of one hundred, and takes your photograph for the wall.', 'good', 7000); }
  return got;
}
function swap() { const S = st(), dup = CARDS.filter(c => (S.cards[c.id] || 0) > 1); let n = 0; for (const c of dup) n += S.cards[c.id] - 1; if (n < 3) { toast('Three spare cards swap for one new pack. You have ' + n + ' spare.', 'info'); return false; } let left = 3; for (const c of dup) while (left > 0 && S.cards[c.id] > 1) { S.cards[c.id]--; left--; } openPack(1); return true; }
function album() {
  const S = st(), m = modal({ title: 'Otters Album ' + CARDS.filter(c => S.cards[c.id]).length + '/' + CARDS.length }), grid = el('div'); Object.assign(grid.style, { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(92px, 1fr))', gap: '8px' });
  for (const c of CARDS) { const n = S.cards[c.id] || 0, cv = document.createElement('canvas'); cv.width = 46; cv.height = 62; const x = cv.getContext('2d'); x.imageSmoothingEnabled = false; x.fillStyle = n ? (c.rare === 2 ? '#f2c230' : c.rare ? '#d2392f' : '#f4f0e8') : '#3a3f4e'; x.fillRect(0, 0, 46, 62); x.fillStyle = n ? (c.rare === 2 ? '#fff2a8' : '#f4ead0') : '#2a2f3d'; x.fillRect(3, 3, 40, 40);
    if (n) { const pl = ROSTER.find(p => p.id === c.id), spec = pl ? playerSpec(pl, TEAM) : c.id === 'coach' ? { top: 'suit', topColor: '#33303f', innerColor: '#f4f0e8', hair: 'bob', hairColor: '#a9a9b4', skin: '#ecba90' } : null;
      if (spec) { const sp = safe(() => { const A = charArt(), ch = new Char(spec, 0, 0); ch.t = 0; ch.dir = 1; return ch.sprite(); }); if (sp && sp.c) x.drawImage(sp.c, 5, 4, 24, 20, -1, 3, 48, 40); } else { x.fillStyle = '#9a6a3c'; x.fillRect(13, 10, 20, 26); x.fillStyle = '#d2392f'; x.fillRect(13, 24, 20, 12); x.fillStyle = '#2a2230'; x.fillRect(18, 15, 2, 2); x.fillRect(26, 15, 2, 2); x.fillStyle = '#f0dcb8'; x.fillRect(19, 18, 8, 5); }
      if (S.autos[c.id]) { x.strokeStyle = '#2f3f72'; x.lineWidth = 1; x.beginPath(); x.moveTo(6, 36); x.bezierCurveTo(14, 26, 18, 44, 26, 34); x.bezierCurveTo(30, 28, 34, 42, 40, 32); x.stroke(); } }
    else { x.fillStyle = '#565c70'; x.font = '20px monospace'; x.fillText('?', 17, 30); }
    cv.style.width = '92px'; cv.style.height = '124px'; cv.style.imageRendering = 'pixelated'; cv.style.border = '2px solid #2a2733';
    grid.append(el('div', null, cv, el('div', { text: n ? (c.num ? '#' + c.num + ' ' : '') + c.name : '???' }, ), el('div', { text: n ? c.pos + (n > 1 ? ' · x' + n : '') + (S.autos[c.id] ? ' · signed' : '') : 'Not found yet' }))); grid.lastChild.style.fontSize = '12px'; grid.lastChild.title = c.bio; }
  m.body.append(el('p.menu-text', { text: 'Twelve cards. Packs of three are $4 at The Otter Den counter. Players sign their own card by the tunnel after a home game.' }), grid);
  const spare = CARDS.reduce((a, c) => a + Math.max(0, (S.cards[c.id] || 0) - 1), 0); m.body.append(el('button.opt', { disabled: spare < 3, onclick: () => { m.close(); swap(); } }, el('span.opt-l', { text: 'Swap 3 spares for a new pack' }), el('span.opt-s', { text: 'You have ' + spare + ' spare card' + (spare === 1 ? '' : 's') })));
}

/* ---------- autographs ---------- */
function autoPlayers(ev) { if (!ev || ev.kind !== 'game') return []; const g = ev.game, out = [g.top.id]; for (let i = 0; out.length < TUNE.AUTOS_PER_GAME && i < 20; i++) { const p = ROSTER[Math.floor(hash2(ev.day, i, 31) * ROSTER.length) % ROSTER.length]; if (!out.includes(p.id)) out.push(p.id); } return out; }
function autograph(p, ch) {
  const S = st(); if (S.autos[p.id]) { bubble(ch, 'I already got you! Look after that one.'); return false; }
  const card = (S.cards[p.id] || 0) > 0, prog = has('arena_program'); if (!card && !prog) { bubble(ch, 'Happy to sign. Got anything to sign ON?'); toast(`Bring ${p.last}'s card or a Game Night Programme (The Otter Den, $3).`, 'info', 4200); return false; }
  S.autos[p.id] = G.now().day; const n = Object.keys(S.autos).length; bubble(ch, pick(LINES.player)); need('fun', 8); need('social', 5); stamp('x:arena_autos'); G.emit('arena:autograph', p.id, n);
  toast(`#${p.num} ${p.name} signs your ${card ? 'card' : 'programme'}. Autographs: ${n}/${ROSTER.length}.`, 'good', 4200);
  if (n >= ROSTER.length) { moodlet('arena_star'); toast('All ten Otters. The programme seller says nobody has done that since ninety-eight.', 'good', 5600); } return true;
}

/* ---------- small things ---------- */
function shootAround(fx, sc) {
  const B = sc.arena, S = st(); if (!B || B.mode !== 'idle' || G.busy) { toast('Not during an event!', 'info'); return false; } const p = G.player; let live = true, made = 0, n = 0;
  const loop = async () => { while (live && G.busy && G.busy._hoops) { const lv = safe(() => G.skills.level('fitness')) || 1, ok = Math.random() < .3 + lv * .05; p.pose = 'cheer'; setTimeout(() => { if (live) p.pose = 'stand'; }, 350); await B.throwBall(ok, { arc: 1.5, dur: 1.3, side: Math.random() < .5 ? .6 : -.6, long: Math.random() < .5 }); n++; if (ok) { made++; need('fun', 1.5); } await new Promise(r => setTimeout(r, 500)); } };
  B.shoot = true; const end = fin => { live = false; B.shoot = false; S.hoops += made; G.emit('arena:hoops', made); toast(n ? `${made} of ${n} from the free-throw line${made >= 5 ? '. The janitor stops mopping to watch.' : '. The empty seats are not judging you.'}` : 'You bounce the ball twice and put it back.', 'good', 4200); };
  G.startActivity({ label: 'Shooting hoops', anim: 'stand', minutes: 25, rate: 1.6, at: { x: O + COURT.x1 - 4.4, y: O + COURT.cy, z: 0, dir: 0 }, tick: gm => { xp('fitness', gm * .9); need('fun', gm * .2); need('energy', -gm * .12); }, cancel: () => end(false), done: () => end(true) }); G.busy._hoops = true; loop(); return true;
}
function statue() { const S = st(), d = G.now().day; bubble(G.player, pick(['Say otter!', 'Rub the nose for luck.', 'Smile, Ollie.'])); if (S.statueDay !== d) { S.statueDay = d; need('fun', 3); toast('Bronze Ollie, paid for by supporters in 1999. His nose is polished gold by ten thousand lucky rubs.', 'good', 4200); } }
async function restroom(fx, sc) {
  if (!isOpen()) return false; const q = (sc.arena && sc.arena.queue && sc.arena.queue.wc) || 0, wait = q > 2 ? Math.round(q * 1.3) : 0;
  if (wait) { toast(`Half-time rush: ${q} people ahead of you. ${wait} minutes of shuffling and small talk about the second quarter.`, 'info', 3600); safe(() => G.advance(wait)); need('social', 2); }
  if (G.bladder && G.bladder.useRestroom) return G.bladder.useRestroom({ where: 'arena', text: wait ? 'Worth the wait. You are back before the third quarter. Probably.' : 'Spotless, and the hand dryer sounds like a jet. Much better.' });
  need('bladder', 100); toast('Much better.', 'good'); return true;
}
function lookTrophy() { const c = st().chain; say([{ who: 'The Bay Cup, 1998', text: 'Otters 71, Herons 70. Okonjo at the buzzer, from the corner, with a hand in his face. The net from that basket is folded in the case.' }, { who: 'The Bay Cup, 1998', text: c.st >= 3 ? `And beside it, back where it belongs: the game ball, signed by all twelve. A small card reads "Returned by ${playerName()}".` : 'There is an empty brass stand beside the cup, with a ring worn into the felt. Something round usually sits there.' }]); }
function whiteboard() { say([{ who: 'Coach\'s whiteboard', text: 'PLAY 24: ELBOW. Rivas to the corner, Tree sets the screen, Whitlock curls. Underlined three times: "IF IN DOUBT, GIVE IT TO JALEN".' }]); xp('fitness', 1); }
function cage() { say([{ who: 'Equipment cage', text: 'Forty basketballs, a mountain of towels and a label-maker that has clearly been used on everything, including the label-maker.' }]); }
function cooler() { const S = st(), d = G.now().day; if (S.coolerDay === d) { toast('"One each!" says a voice from the kit room.', 'info'); return; } S.coolerDay = d; need('energy', 8); need('fun', 2); toast('An orange sports drink, so cold it hurts. Property of the Maple Bay Otters, and now of you.', 'good', 3600); }
function lookLockers(ids) { const L = ids.map(id => ROSTER.find(p => p.id === id)).filter(Boolean); say(L.slice(0, 5).map(p => ({ who: '#' + p.num + ' ' + p.name, text: p.bio }))); }
function sitBench(fx, sc) { if (G.busy) return false; const s = (fx.seats || []).find(q => !sc.ents.some(e => e !== G.player && !e.hidden && Math.hypot(e.x - q.x, e.y - q.y) < .4)); if (!s) { toast('Both ends are taken.', 'info'); return false; } const p = G.player; p.poseOpts = { seated: true }; G.startActivity({ label: 'Sitting in the locker room', anim: 'sit', minutes: 15, rate: 2.5, at: { x: s.x, y: s.y, z: s.z || .48, dir: 1 }, tick: gm => need('energy', gm * .2), cancel: () => { p.poseOpts = null; }, done: () => { p.poseOpts = null; } }); return true; }
const SPECS = new Map();
function playerSpec(p, team) { const k = p.id + team.id; let s = SPECS.get(k); if (s) return s; const A = charArt(), L = p.look || {}; s = { age: 'adult', skin: (A.SKINS || [])[L.skin] || '#c4875a', hair: L.hair || 'short', hairColor: L.hairColor || '#2b2433', height: L.height || 'tall', build: L.build || 'avg', top: 'tank', topColor: team.c, accent: team.c2, innerColor: team.c2, bottom: 'shorts', bottomColor: dk(team.c, .25), shoes: '#f0ece4', beard: !!L.beard, hat: L.hat || null, hatColor: L.hatColor || null, bag: null, glasses: false }; SPECS.set(k, s); return s; }

/* ---------- the lucky ball (Benny) and the otter suit (Coach Delacroix) ---------- */
const backstageOpen = () => st().chain.st >= 3;
const goalText = () => { const c = st().chain; return c.st === 1 ? `Find the Otters' lucky game ball (${c.found.length}/3 places searched)` : c.st === 2 ? 'Take the lucky ball back to Benny at the arena' : c.st === 3 ? 'See Coach Delacroix in the Otters locker corridor' : c.st === 4 ? 'Put on the Ollie suit during an Otters home game (before half-time)' : 'Be Ollie: dance at centre court at half-time'; };
function setGoal() {
  const c = st().chain; if (!G.goals) return;
  if (c.st >= 1 && c.st <= 5) { const g = safe(() => G.goals.get(GOAL)); if (g) { g.text = goalText(); G.emit('goals:change'); } else safe(() => G.goals.add({ id: GOAL, text: goalText(), group: 'opportunity', placeId: 'arena', hint: 'Benny, the Otters\' equipment manager (by the TEAM ONLY door on the arena concourse), has lost the 1998 lucky game ball. It went out on the team\'s community day: look by the Conservatory in Central Park, outside the Orpheum cinema and on the Symphony Hall steps. Then take it back to him. After that, Coach Delacroix in the locker corridor has a bigger favour to ask, on a game night (Wednesday or Saturday).' })); }
  else if (c.st === 6) safe(() => { if (G.goals.get(GOAL) && !G.goals.isDone(GOAL)) G.goals.complete(GOAL); });
}
function talkBenny(ch) {
  const c = st().chain, who = STAFF.equip;
  if (c.st === 0) say([{ who, text: 'You have not seen a basketball, have you? Old one. Brown. Covered in signatures. No? No. Of course not.' }, { who, text: 'It is the ninety-eight ball. Every Otter touches it before tip-off, every game, for twenty-six years. It went out in the kit van on community day last week and it did not come back.' }, { who, text: 'We did a kids\' clinic by the Conservatory in Central Park, a signing outside the Orpheum, and photographs on the Symphony Hall steps. It is at one of those. If Coach finds out before I find it, I am the one going in the trophy case.' }])
    .then(() => choose('Help Benny find the lucky ball?', [{ label: 'I will have a look', value: 1 }, { label: 'Not just now', value: 0 }])).then(v => { if (v === 1) { c.st = 1; setGoal(); G.emit('arena:chain', 1); bubble(ch, 'You are a lifesaver. Do not tell Coach.'); toast('New opportunity: search three places in the city for the Otters\' lucky ball. They sparkle when you are close.', 'good', 5200); } else bubble(ch, 'If you change your mind. I will be here. Sweating.'); });
  else if (c.st === 1) say([{ who, text: c.found.length ? `${c.found.length} down, ${3 - c.found.length} to go. It is always the last place you look. That is not a saying, that is just how looking works.` : 'The Conservatory, the Orpheum, the Symphony Hall steps. Please. Tip-off waits for nobody.' }]);
  else if (c.st === 2) say([{ who, text: 'Is that... it IS. Oh, come here. No, not you. The ball. Come here, you beautiful old thing.' }, { who, text: 'In a flower bed! Twenty-six years of history in a flower bed. I am putting it back in the case tonight and it is never leaving the building again.' }, { who, text: 'Listen. That door behind me says TEAM ONLY. As far as I am concerned, that now includes you. Go and say hello. Coach has been wanting to meet whoever saved my job.' }]).then(() => {
    c.st = 3; safe(() => G.inv.remove('arena_lucky_ball', 1)); safe(() => G.money.add(40, 'A thank-you from Benny')); need('fun', 8); setGoal(); G.emit('arena:chain', 3); const sc = G.scene; if (sc && sc.arena && sc.arena.sync) sc.arena.sync();
    toast('The lucky ball is home. $40 from Benny\'s own pocket, and the TEAM ONLY door is open to you: the locker corridor, the cooler and the tunnel to the court.', 'good', 7000); });
  else if (c.st < 6) say([{ who, text: c.st === 3 ? 'Go on through. Coach is at the whiteboard. She does not bite. Much.' : 'Priya has the flu, the suit is on the rack and Coach says you are our otter. I have seen stranger. Not much stranger.' }]);
  else say([{ who, text: pick([`${playerName()}! Honorary Otter! Your banner is up, did you see? I ironed it myself.`, 'The ball has not left the case. I check. Hourly.', 'You were a better otter than Priya. Do not tell Priya.']) }]);
}
function searchSpot(i) {
  const c = st().chain; if (c.st !== 1 || c.found.includes(i)) return false; c.found.push(i); const n = c.found.length, where = ['the Conservatory flower beds', 'the pavement outside the Orpheum', 'the Symphony Hall steps'][i];
  if (n < 3) { say([{ who: '', text: n === 1 ? `You search ${where}. No ball. But a gardener leaning on a rake says: "Basketball? A spaniel had one, Tuesday. Proud as anything. Went off toward town."` : `You search ${where}. Nothing but a flattened paper cup. A busker stops playing: "Old brown ball? Some kids were kicking one about. An usher took it off them. Try wherever you have NOT tried."` }]); xp('charisma', 3); }
  else { c.st = 2; safe(() => G.inv.add('arena_lucky_ball', 1)); say([{ who: '', text: `Third time lucky. Wedged behind a planter at ${where}, scuffed, slightly chewed and covered in twenty-six-year-old signatures: the 1998 game ball.` }]); need('fun', 8); toast('You found the lucky ball! Take it back to Benny on the arena concourse.', 'good', 5200); }
  setGoal(); G.emit('arena:chain', c.st); return true;
}
function teamDoor() { if (!isOpen()) return false; if (!backstageOpen()) { toast('TEAM ONLY. Benny, the equipment manager, is standing right next to it and has noticed you looking.', 'info', 3600); return false; } G.go('int:arena:backstage'); return true; }
function tunnelToCourt() { const s = now(); if (s.ph !== 'none' && st().chain.st !== 5 && !ticketFor(s.ev)) { toast('"Not during the show without a ticket, even for you." A steward smiles and does not move.', 'info', 3600); return false; } G.go('int:arena:bowl', { x: O + 27.6, y: O + 2.2, dir: 1 }); return true; }
function tunnelToBackstage() { if (!backstageOpen()) { toast('A steward steps across the tunnel. "Team only, I am afraid."', 'info', 3200); return false; } G.go('int:arena:backstage', { x: O + 1.6, y: O + 2.2, dir: 0 }); return true; }
function talkCoach(ch) {
  const c = st().chain, who = STAFF.coach, s = now(); ch.pose = null;
  if (c.st === 3) say([{ who, text: 'So you are the one who found the ball. Benny has not stopped talking about you. He has not stopped sweating either, but that is medical.' }, { who, text: 'I have a problem and you have lucky hands. Priya, who is Ollie, has the flu. Ollie has not missed a home game since nineteen ninety-nine. I am not having it happen on my watch.' }, { who, text: 'The suit is on the rack. It is warm, it smells of fabric freshener and you cannot see your own feet. Come on a game night, put it on before half-time, and dance at centre court. That is all. Will you be our otter?' }])
    .then(() => choose('Be Ollie the Otter for a night?', [{ label: 'I will be your otter', value: 1 }, { label: 'I need to think about it', value: 0 }])).then(v => { if (v === 1) { c.st = 4; setGoal(); G.emit('arena:chain', 4); bubble(ch, 'Good. Do not talk in the suit. Otters do not talk.'); toast('On a Wednesday or Saturday game night, come to the locker corridor before half-time and put on the Ollie suit.', 'good', 5600); } else bubble(ch, 'Think fast. The otter waits for no one.'); });
  else if (c.st === 4) say([{ who, text: s.ev && s.ev.kind === 'game' && s.ph !== 'exit' && s.ph !== 'final' ? 'It is game night. The suit is right there. Go on.' : 'Game night. Wednesday or Saturday. Before half-time. The suit will be on the rack.' }]);
  else if (c.st === 6) say([{ who, text: pick(['You did the worm. Nobody asked you to do the worm. It was magnificent.', 'Your banner is in the rafters next to Okonjo\'s. He has been told. He approves.', `Lower bowl is yours whenever you want it, ${playerName()}. Just tell the box office.`]) }]);
  else say([{ who, text: 'Play twenty-four. Elbow. If in doubt, give it to Jalen. That is the whole of basketball.' }]);
}
function talkPlayer(p, ch, sc) { const c = st().chain, s = now(); if (c.st >= 3 && !st().autos[p.id] && ((st().cards[p.id] || 0) > 0 || has('arena_program'))) { autograph(p, ch); return; } bubble(ch, c.st >= 6 ? pick(['The otter! Nice moves out there.', 'Honorary Otter. Has a ring to it.']) : pick(LINES.player.concat(['You are the one who found the ball? Legend.', p.pos === 'C' ? 'Mind your head. Everybody else has to.' : 'Play twenty-four. Works every time.']))); need('social', 1); }
function talkPriya(ch) { say([{ who: STAFF.mascot, text: pick(['I watched the tape. You did a spin I have been trying to land for three seasons. I am not angry. I am a little angry.', 'Flu is gone. The suit still smells of you. That is fine. That is how otters bond.', 'If I ever get the flu again, I know who to call.']) }]); }
function suit(fx, sc) {
  const c = st().chain, s = now();
  if (c.st < 4) { say([{ who: 'The Ollie suit', text: c.st >= 3 ? 'Ollie, off duty: a brown fur suit on a rack, an enormous head on the shelf above it, and a note in marker pen: "PRIYA\'S. HANDS OFF. (get well soon P!)"' : 'An otter suit.' }]); return false; }
  if (c.st === 6) { toast('Priya is back, and the suit is hers again. She has left you a spare ear as a souvenir.', 'info', 3600); return false; }
  if (c.st === 5) return false;
  const g = s.ev && s.ev.kind === 'game' ? gameAt(s.ev.game, s.w) : null, ok = s.ev && s.ev.kind === 'game' && (s.ph === 'doors' || s.ph === 'intro' || (s.ph === 'live' && (g.q <= 2) && !(g.ph === 'half' && g.f > .36)));
  if (!ok) { toast(s.ev && s.ev.kind === 'game' ? 'Too late tonight: half-time has been and gone. Next home game, before half-time.' : 'The suit is for game nights: Wednesday or Saturday, before half-time.', 'info', 4200); return false; }
  c.st = 5; c.key = s.ev.key; setGoal(); G.emit('arena:chain', 5); toast('The head goes on. The world becomes a small mesh window that smells of fabric freshener. You are Ollie. Otters do not talk.', 'good', 5200);
  G.go('int:arena:bowl', { x: O + 26.4, y: O + 6.6, dir: 1 }); return true;
}
// while you are in the suit: the mascot entity is you; at half-time the dance routine runs
let mas = null;
const MOVES = [['WAVE', 2], ['DANCE', 4], ['SPIN', 6], ['FLEX', 3]];
function suitTick(dt) {
  const S = st(), c = S.chain; if (c.st !== 5) { if (mas) endMascot(false); return; } const s = now(), B = bowl(), p = G.player;
  if (!s.ev || s.ev.key !== c.key || s.ph === 'final' || s.ph === 'exit' || s.ph === 'none') { c.st = 4; setGoal(); if (B) { B.inSuit = false; B.pass = false; } p.hidden = false; if (mas) endMascot(false); toast('The game is over and you never got to centre court. Coach says: next home game.', 'info', 4600); return; }
  if (!B) { p.hidden = false; return; }
  const o = B.actors.ollie; B.inSuit = true; B.pass = true; p.hidden = true; o.hidden = false; o.x = p.x; o.y = p.y; o.z = p.z; o.t = (o.t || 0) + dt; if (!mas || !mas.pose) o.f = p.moving ? 8 + (Math.floor(o.t * 7) & 1) : Math.floor(o.t * 1.5) & 1; else o.f = mas.pose === 6 ? [4, 6, 5, 7][Math.floor(o.t * 8) % 4] : mas.pose === 4 ? 4 + Math.floor(o.t * 6) % 4 : mas.pose + (Math.floor(o.t * 5) & 1);
  const g = gameAt(s.ev.game, s.w); if (!mas && g.ph === 'half' && g.f >= .1 && g.f < .4) startMascot(B); else if (!mas && !G.busy && g.ph !== 'half' && !S._suitHint) { S._suitHint = 1; toast('You are Ollie. Walk about, wave at people. At half-time, get to centre court: the routine starts when the dancers come out.', 'info', 5600); }
  if (mas && mas.t0 && G.time - mas.t0 > 4 && !mas.done) mascotMove(-1);
}
function startMascot(B) {
  const p = G.player; p.stop(); p.x = O + COURT.cx; p.y = O + COURT.cy + .3; closePop(); const wrap = mkBar('112px'); pop = wrap; const lab = el('div'); Object.assign(lab.style, { width: '100%', textAlign: 'center', background: '#2a2733', color: '#f2c230', padding: '6px 10px', fontSize: '16px', border: '2px solid #2a2733' }); wrap.append(lab);
  mas = { B, i: 0, hits: 0, seq: Array.from({ length: 6 }, () => Math.floor(Math.random() * 4)), lab, pose: 0, t0: G.time, done: false }; MOVES.forEach((m, k) => wrap.append(btn(m[0], () => mascotMove(k), 'go')));
  G.startActivity({ label: 'Being Ollie', anim: 'stand', minutes: 8, rate: TUNE.WATCH, cancel: () => { }, done: () => { } }); G.busy._mas = true;
  caption('Big Stan', 'And here he is... OLLIE! Show us what you have got, big fella!', 4200); showMove();
}
const showMove = () => { if (mas) { mas.lab.textContent = mas.i < 6 ? `Ollie says: ${MOVES[mas.seq[mas.i]][0]}!   (${mas.i + 1}/6)` : 'TA-DAAA!'; mas.t0 = G.time; } };
function mascotMove(k) {
  if (!mas || mas.done) return false; const want = mas.seq[mas.i], ok = k === want; if (ok) { mas.hits++; mas.pose = MOVES[k][1]; mas.B.cheer(mas.hits >= 4 ? 'stand' : undefined); mas.B.jumbo({ mode: 'text', lines: [MOVES[k][0] + '!', 'OLLIE!'], c: '#f2c230', ollie: 1 }, 2.5); } else { mas.pose = 0; if (k >= 0) bubble(mas.B.actors.ollie, '(wrong paw)'); }
  mas.i++; if (mas.i >= 6) { mas.done = true; showMove(); const h = mas.hits; for (let i = 0; i < 3; i++) setTimeout(() => { const B = bowl(); if (B) B.tee(); }, 500 + i * 700); setTimeout(() => endMascot(true, h), 3200); } else showMove(); return ok;
}
function endMascot(fin, hits = 0) {
  const B = mas && mas.B, S = st(), c = S.chain; mas = null; closePop(); if (G.busy && G.busy._mas) G.endActivity(false); if (!fin) return;
  c.st = 6; G.state.flags.arena_pass = true; const p = G.player; p.hidden = false; if (B) { B.inSuit = false; B.pass = false; p.x = O + 26.2; p.y = O + 6.8; B.cheer('stand'); B.jumbo({ mode: 'text', lines: ['HONORARY OTTER', playerName().toUpperCase().slice(0, 11)], c: '#f2c230', ollie: 1 }, 9); }
  safe(() => G.money.add(80, 'Appearance fee: one otter')); safe(() => G.inv.add('arena_signed_ball', 1)); moodlet('arena_star'); moodlet('inspired'); need('fun', 25); xp('charisma', 30); setGoal(); G.emit('arena:mascot', hits); G.emit('arena:chain', 6); safe(() => G.guide.rebuild && 0);
  say([{ who: STAFF.coach, text: hits >= 5 ? 'I have coached for nineteen years and I have never seen an otter move like that.' : hits >= 3 ? 'A little rough round the edges. So is this team. They loved you.' : 'Well. You stayed upright. Mostly. The crowd did not seem to mind.' }, { who: STAFF.coach, text: `From tonight you are an Honorary Otter. Your name goes up in the rafters and on the big screen, there is a lower-bowl seat for you at every event for as long as this building stands, and the lads have signed you a ball.` }])
    .then(() => toast(`HONORARY OTTER: a banner with your name in the rafters, your name on the jumbotron, a free lower-bowl seat for life, $80 and a signed game ball.`, 'good', 9000));
}

/* ---------- guide wiring ---------- */
function patchGuide() {
  const e = safe(() => G.guide.get('place:arena')); if (!e) return; const tags = ['basketball', 'otters', 'concert', 'game', 'sport', 'hot dog', 'ice show', 'monster trucks', 'tickets'], nx = events(3);
  e.blurb = CORE_BLURB.arena; e.price = 'Concourse free · games from ' + fmt(TIERS.nose.price.game) + ' · concerts from ' + fmt(TIERS.nose.price.concert); e.type = 'Arena'; e.chapter = 'shows'; e.also = ['fitness', 'sights', 'eat', 'shop']; e.tags = (e.tags || []).filter(t => !tags.includes(t)).concat(tags);
  e.when = nx.length ? 'Next: ' + nx.map(q => `${q.title} (${when(q)})`).join(' · ') : 'Wed + Sat 19:00 basketball · Fri 20:00 concert · Sun 14:00 family show';
  e.tryThis = nx.map(q => `${when(q)}: ${q.title}${q.big ? ' (big night: buy ahead)' : ''}`).concat(['Watch a whole Otters home game from your seat (fast-forward if you must)', 'Enter the half-court shot contest at half-time', 'Catch a T-shirt from Ollie\'s cannon', 'Wave when the fan-cam finds you', 'Collect the twelve player cards and get them signed by the tunnel', 'Stand on the floor at Friday Night Live and stay for the encore', 'Shoot hoops on the empty court on a quiet afternoon', 'Ask Benny by the TEAM ONLY door what he has lost']);
}

/* ---------- debug ---------- */
function gotoEv(kind, w = -30) { const d = G.now().day; for (let i = 0; i < 16; i++) { const e = evOn(d + i); if (e && (!kind || e.kind === kind) && e.T0 + w > G.state.t - 1) { G.state.t = e.T0 + w; return e; } } return null; }

export function init() {
  S = G.defineState('arena', DEF); G.on('load', () => { st(); prune(); setGoal(); EVC.clear(); });
  G.arena = {
    isOpen, hours: ARENA_HOURS, now, events, eventOn: evOn, tiers, buy, tickets: () => st().tix.slice(), ticketFor, boxOffice, enter, enterBowl, gatesOpen, arrived, arrivedBowl, arrivedBack,
    standings: () => standings(G.state.t), results: n => results(G.state.t, n), schedule, game: ev => (ev && ev.game) || null, boardRows, lookBoard, nextLine, playerName, playerSpec,
    bowl, state: () => { const B = bowl(); return B ? B.state() : null; }, sitMySeat, leaveSeat, ff: on => { const B = bowl(); return B ? B.ff(on) : false; }, cheer, vendor, seatBar, watchTick, onPlay, onFinal, onEncore,
    contest: { open: () => { const B = bowl(); if (B) contestOpen(B); }, enter: contestEnter, shoot: v => (con ? (con.stop(v), true) : false), state: () => (con ? con.state() : null) }, contestOpen, contestClose,
    tee: { state: () => (teeS ? teeS.state() : null), grab: () => (teeS ? (teeS.grab(), true) : false) }, wantTee, teeIncoming,
    cam: { state: () => (camS ? { kiss: camS.kiss } : null), react: k => (camS ? (camS.react(k), true) : false) }, wantCam, fanCam,
    mascot: { state: () => (mas ? { i: mas.i, hits: mas.hits, want: mas.seq[mas.i], done: mas.done } : null), move: mascotMove },
    cards, openPack, album, swap, autographs: () => Object.assign({}, st().autos), autograph, autoPlayers, hasFoam: () => has('arena_foam_finger'), floorOk: ev => { const t = ticketFor(ev); return !!(t && t.tier === 'floor'); },
    shootAround, statue, restroom, lookTrophy, whiteboard, cage, cooler, lookLockers, sitBench, talkBenny, talkCoach, talkPlayer, talkPriya, suit, teamDoor, tunnelToCourt, tunnelToBackstage,
    chain: () => st().chain, searchSpot, backstageOpen, hasPass, debug: { goto: gotoEv }, door: () => door,
    stats: () => { const S = st(); return { visits: S.visits, tickets: S.tix.length, seen: Object.assign({}, S.seen), wins: S.wins, buzzers: S.buzzers, cards: CARDS.filter(c => S.cards[c.id]).length, packs: S.packs, autos: Object.keys(S.autos).length, tees: S.tees, cam: S.cam, contest: Object.assign({}, S.contest), hoops: S.hoops, encores: S.encores, chain: S.chain.st }; },
  };
  // the door must exist before a save made inside the arena exits to a city that was never built this session
  G.on('room:build', sc => { if (!sc || !sc.def || sc.def.showpiece !== 'arena') return; if (!built) safe(() => ensure(getCity()));
    if (sc.roomId === 'arena:bowl') { const B = sc.arena; for (const c of B.actors.homeP) sc.interactables.push({ ent: c, x: c.x, y: c.y, label: 'Autograph: #' + c.pl.num + ' ' + c.pl.name, h: 1.4, hit: 9, range: 2, visible: () => !c.hidden && B.ph === 'exit' && B.mode === 'game', use: () => { c.keepPose = true; c.faceTo(G.player.x, G.player.y); autograph(c.pl, c); } });
      sc.interactables.push({ x: O + 18.5, y: O + COURT.cy, label: 'Dance in the crowd', h: 1, hit: 60, range: 30, visible: () => B.mode === 'concert' && B.ph === 'live' && !G.busy && B.ev && G.arena.floorOk(B.ev) && G.player.x - O > 13.2 && G.player.x - O < COURT.x1 && G.player.y - O > COURT.y0 && G.player.y - O < COURT.y1, get spot() { return { x: G.player.x, y: G.player.y }; },
        use: () => { const p = G.player, ev = B.ev; p.dir = 2; G.startActivity({ label: 'Dancing at the front', anim: 'dance', minutes: Math.max(3, ev.end - G.state.t + 2), rate: TUNE.CONCERT.watch, tick: gm => { watchTick(gm, B); need('fun', gm * .25); xp('fitness', gm * .3); }, cancel: () => seatBar(false), done: () => seatBar(false) }); G.busy._arena = true; G.busy.base = TUNE.CONCERT.watch; seatBar(true, B); } }); } });
  G.on('scene', s => { if (!s || s.id !== 'city' || s._arena || !s.world) return; s._arena = true; try { wire(s); } catch (e) { console.warn('arena', e); } setGoal(); });
  G.on('guide:rebuilt', patchGuide);
  G.on('shop:buy', (id, qty) => { if (id !== 'arena_card_pack') return; const n = Math.max(1, qty || 1); safe(() => G.inv.remove('arena_card_pack', n)); setTimeout(() => openPack(n), 300); });
  G.on('day', () => { prune(); });
  G.addSystem({ name: 'arena', update(dt) { safe(() => updateCity(dt)); if (S && S.chain && (S.chain.st === 5 || mas)) suitTick(dt); } });
  // closing time: after 23:00 everybody is walked to the doors
  G.on('minutes', () => { const sc = G.scene; if (!inside() || G.modal || G.cutscene) return; const h = G.now().hf; if (h >= ARENA_HOURS[1] + .1 || h < ARENA_HOURS[0] - .02) { if (now().ph !== 'none') return; if (sc._closing) return; sc._closing = true; if (G.busy) G.endActivity(false); toast('"Closing up!" The house lights go to half and a steward walks you to the doors.', 'info', 4200); exitRoom({ poi: DOOR }).then(() => { sc._closing = false; }, () => { sc._closing = false; }); } });
}
