// Maple Bay Observatory — city entrance, tickets, planetarium schedule, telescopes, logbook, activities, star parties, Dr. Halvorsen's comet and guide wiring.
// Rooms: scenes/rooms/observatory.js ('observatory', 'observatory:planetarium', 'observatory:roof'); canvas painters: scenes/rooms/observatory2.js.
// Data: data/observatory.js. Art: art/showpiece/observatory*.js + _obs_lib.js.
//
// City (once per city world, order 56: before places / stalls): the existing `bld.civic.observatory` on Hillcrest gets a door poi `door:observatory`
//   (room 'observatory') + its interactable (the welcome glow comes from stalls.js). G.places id: 'observatory'.
// Hours 13:00-24:00 daily (closed toast at the door; visitors are walked out after midnight). The rotunda, Star Shop and Comet Cocoa are free; the gallery,
//   the planetarium and the roof need a $6 day ticket (flag G.state.flags.observatory_pass = free for life: Dr. Halvorsen gives it for the comet).
// G.observatory = {
//   isOpen(), hours, ticket, hasTicket(), buyTicket() -> bool, enter() (city door), desk(), goTheatre(), goRoof(),
//   sky() -> { time 'day'|'dusk'|'night', night, wx null|'cloud'|'rain', clear, observing (night && clear), moon (phase 0..1), moonUp, season, party },
//   shows: { times, programmes() -> [...], next(inclCurrent?) -> { h, T, prog } | null, current() -> { key, T, prog, at } | null, startNow(progId?) -> Promise<bool>, state(), crowd() },
//   scope: { targets() -> [{ id, name, kind, logged }], look(id?, fx?, scene?) -> Promise<{ id, q } | null>, snap(x?, y?), state(), cancel() },   log() -> [{ id, name, note, q }],
//   constellations() -> [{ id, name, season, got }], trace(fx?, scene?, id?) -> Promise<bool>, tracer: { state(), tap(i), auto() },
//   smallScope(fx, scene), sketchMoon(fx, scene), moonSketches() -> '0246' (phase indices of the pinned sketches), stargaze(fx, scene), partyCocoa(),
//   touch(i), coin(fx, scene), weigh(fx, scene), launch(fx, scene), crank(fx, scene), watchPendulum(), readFact(key), sitBench(fx, scene), talkInfo(scene), lookBoard(),
//   talk: { times, next(), start() (debug) }, party: { on(), next() -> abs day, weekday, hours },
//   talkAstronomer(char), talkDocent(char, key, talk), talkPresenter(char, star), chain() -> { st: 0 none | 1 sweeping | 2 found | 3 done, nights: [day] }, cometDone(), door(), stats() }
// State: G.state.observatory = { ticketDay, visits, shows: { progId: n }, showCount, log: { objId: q }, cons: { id: day }, sketches, moon: '...', touched: { i: day }, facts: { key: 1 },
//   coins, cranks, weighs, rockets, rocketBest, talks, gazes, party, partyDay, cocoaDay, pendDay, chain: { st, nights: [day] } }
// Events: 'observatory:visit'(first), ':ticket', ':doors'(progId), ':showstart'(progId), ':show'(progId, credited), ':look'(objId, q), ':constellation'(id, n), ':sketch'(n),
//   ':touch'(i, n), ':coin'(n), ':weigh', ':launch'(metres), ':crank', ':talkstart'(title), ':talk'(n), ':stargaze'(n), ':party'(n), ':sweep'(nights), ':chain'(st), ':meteor'.
// Guide stamps: x:obs_visit, x:obs_show, x:obs_scope, x:obs_const, x:obs_party (registered into _guide_data EXPERIENCES).
// Activity ids (for the guide): obs_show, obs_telescope, obs_constellation, obs_sketch_moon, obs_meteorite, obs_gravity_well, obs_weigh, obs_rocket, obs_orrery, obs_talk, obs_stargaze, obs_star_party.
import { G } from '../core/game.js';
import { el, root, toast, bubble, say, choose } from '../ui/kit.js';
import { enterRoom, exitRoom } from '../scenes/interior.js';
import { ambient } from '../core/clock.js';
import { OBS_HOURS, OBS_TICKET, OBS_VENUES, SHOW_TIMES, TALK_TIMES, PARTY, PROGRAMMES, OBJECTS, OBJ_BY_ID, METEORITES, FACTS } from '../data/observatory.js';
import { CORE, CORE_BLURB, EXPERIENCES } from './_guide_data.js';
import { getCity } from '../world/_city.js';
import { moonPhase, phaseIdx, PHASE_NAMES, CONSTELLATIONS, CONS_BY_ID } from '../art/showpiece/_obs_lib.js';
import { drawView, ctxText } from '../scenes/rooms/observatory2.js';
import { hash2 } from '../engine/raster.js';

export const order = 56;
const NAME = 'Maple Bay Observatory', DOOR = 'door:observatory', DAY = 1440, WHO = 'Dr. Halvorsen, astronomer';
CORE.observatory = ['arts', 'Observatory', 'tower', ['sights', 'shows', 'outdoors']];
CORE_BLURB.observatory = 'The white dome on top of Hillcrest. A Foucault pendulum knocks its pegs over as the Earth turns, the gallery lets you touch a meteorite and weigh yourself on Mars, the planetarium runs five shows a day, and on clear nights the dome opens and the 1894 Great Telescope swings round to Saturn. Open 13:00 to midnight. Star party every Saturday.';
for (const x of [
  { id: 'x:obs_visit', title: 'Visit the Observatory', group: 'Big days out', glyph: 'tower', place: 'place:observatory', need: 'observatory', blurb: 'Buy a day ticket on Hillcrest and watch the pendulum prove the Earth is turning.' },
  { id: 'x:obs_show', title: 'See a Planetarium Show', group: 'Big days out', glyph: 'tower', place: 'place:observatory', need: 'observatory', blurb: 'Recline in the Star Theatre at 14:00, 16:00, 18:00, 20:00 or 22:00. The lights go down and the sky comes out.' },
  { id: 'x:obs_scope', title: 'Look Through the Great Telescope', group: 'Big days out', glyph: 'tower', place: 'place:observatory', need: 'observatory', blurb: 'A clear night, the open dome, and something a very long way away in the eyepiece.' },
  { id: 'x:obs_const', title: 'Trace a Constellation', group: 'Big days out', glyph: 'tower', place: 'place:observatory', need: 'observatory', blurb: 'Join the dots at a finder on the observatory terrace. Twelve to collect, three each season.' },
  { id: 'x:obs_party', title: 'Join a Star Party', group: 'Big days out', glyph: 'tower', place: 'place:observatory', need: 'observatory', blurb: 'Saturday night on the observatory terrace: a row of home-made telescopes and free cocoa.' },
]) if (!EXPERIENCES.some(e => e.id === x.id)) EXPERIENCES.push(x);

let S = null, built = null, door = null;
const DEF = () => ({ ticketDay: -1, visits: 0, shows: {}, showCount: 0, log: {}, cons: {}, sketches: 0, moon: '', touched: {}, facts: {}, coins: 0, cranks: 0, weighs: 0, rockets: 0, rocketBest: 0, talks: 0, gazes: 0, party: 0, partyDay: -1, cocoaDay: -1, pendDay: -1, chain: { st: 0, nights: [] } });
const st = () => { S = G.state.observatory || (G.state.observatory = {}); const d = DEF(); for (const k in d) if (S[k] === undefined) S[k] = d[k]; if (!S.chain.nights) S.chain.nights = []; return S; };
const fmt = n => (G.money && G.money.fmt ? G.money.fmt(n) : '$' + n);
const safe = fn => { try { return fn(); } catch (e) { return undefined; } };
const stamp = id => safe(() => G.guide && G.guide.stamp && G.guide.stamp(id));
const pick = a => a[Math.floor(Math.random() * a.length)];
const clock = h => String(Math.floor(h) % 24).padStart(2, '0') + ':' + String(Math.round((h % 1) * 60)).padStart(2, '0');
const isOpen = () => { const h = G.now().hf; return h >= OBS_HOURS[0] && h < OBS_HOURS[1]; };
const scene = id => (G.scene && G.scene.roomId === (id || 'observatory') ? G.scene : null);
const inside = () => !!(G.scene && G.scene.def && G.scene.def.showpiece === 'observatory');
const has = id => !!safe(() => G.inv.count(id) > 0);
const xp = (k, n) => safe(() => G.skills.addXp(k, n)), need = (k, n) => safe(() => G.needs.add(k, n)), moodlet = id => safe(() => G.needs.addMoodlet(id));
const logMult = () => (has('obs_logbook') ? 1.25 : 1);
const playerName = () => (G.state.player && G.state.player.name) || 'Friend';
const syncAll = () => { const sc = G.scene; if (sc && sc.obs && sc.obs.sync) sc.obs.sync(); };

/* ---------- the sky ---------- */
const partyOn = () => { const n = G.now(); return n.weekday === PARTY.weekday && n.hf >= PARTY.hours[0] && n.hf < PARTY.hours[1]; };
function sky() {
  const n = G.now(), am = ambient(G.state.t, 'clear'), time = am.dark >= .8 ? 'night' : (am.dark > .02 || am.amb !== '#ffffff') ? 'dusk' : 'day', w = String(G.state.weather || 'clear');
  const wx = /rain|storm|snow/.test(w) ? 'rain' : /cloud|fog/.test(w) ? 'cloud' : null, moon = moonPhase(n.day), vis = moon > .06 && moon < .94 && (moon <= .5 ? (n.hf < 18 + moon * 24) : (n.hf >= 18 + (moon - .5) * 12));
  return { time, night: time === 'night', wx, clear: !wx, observing: time === 'night' && !wx, moon, moonUp: vis && time !== 'day', season: n.season, hf: n.hf, day: n.day, party: partyOn() };
}

/* ---------- city: the door ---------- */
function ensure(w) {
  if (built === w || !w || !Array.isArray(w.objs)) return; built = w;
  const ob = w.objs.find(o => o.id === 'bld.civic.observatory'); if (!ob) return;
  door = w.pois.find(p => p.id === DOOR);
  if (!door) {
    const B = ob.B, dr = ob.a.door || { at: (B[3] - B[0]) / 2 }, free = (x, y) => x > 1 && y > 1 && x < w.w - 1 && y < w.h - 1 && !w.isBlocked(x, y); let sp = null;
    for (const out of [.75, 1.25, 1.75, 2.25]) { for (const off of [0, .5, -.5, 1, -1, 1.5, -1.5]) { const a = ob.flip ? { x: B[3] + out, y: B[1] + dr.at + off, dir: 0 } : { x: B[0] + dr.at + off, y: B[4] + out, dir: 1 }; if (free(a.x, a.y)) { sp = a; break; } } if (sp) break; }
    if (!sp) return;
    door = w.poi({ type: 'door', id: DOOR, room: 'observatory', name: NAME, x: Math.round(sp.x * 2) / 2, y: Math.round(sp.y * 4) / 4, dir: sp.dir, district: (w.districtAt && w.districtAt(sp.x, sp.y)) || 'hillcrest', showpiece: true });
  }
}
function wire(s) { ensure(s.world); if (!door) return; if (!s.interactables.some(it => it.poi === door)) s.interactables.push({ x: door.x, y: door.y, label: NAME, h: 1.2, range: 1.3, poi: door, use: () => enter() }); }
function enter() {
  if (!isOpen()) { toast(`${NAME}: closed. Open daily ${clock(OBS_HOURS[0])} to midnight. Astronomers sleep in.`, 'info', 3800); return false; }
  enterRoom('observatory', DOOR); return true;
}

/* ---------- tickets + desk ---------- */
const hasPass = () => !!(G.state.flags && G.state.flags.observatory_pass);
const hasTicket = () => hasPass() || st().ticketDay === G.now().day;
function buyTicket() {
  if (hasPass()) { toast('"A Friend of the Observatory! Everything is open to you."', 'good'); return true; }
  if (hasTicket()) { toast('"Your ticket is good until midnight."', 'info'); return true; }
  if (G.money && !G.money.pay(OBS_TICKET, 'Observatory day ticket', { category: 'fun', venue: OBS_VENUES.place })) return false;
  st().ticketDay = G.now().day; G.emit('observatory:ticket'); stamp('x:obs_visit'); syncAll();
  toast(`Day ticket (${fmt(OBS_TICKET)}): the gallery, every planetarium show and the telescopes upstairs, until midnight.`, 'good', 4200); return true;
}
const avail = () => PROGRAMMES.filter(p => !p.bonus || cometDone());
const slotProg = (day, i) => { const a = avail(); return a[(day * SHOW_TIMES.length + i) % a.length]; };
function nextShow(incl) { const n = G.now(), t = G.state.t; for (let d = n.day; d <= n.day + 1; d++) for (let i = 0; i < SHOW_TIMES.length; i++) { const T = d * DAY + SHOW_TIMES[i] * 60; if (T > t || (incl && T + 3 > t)) return { h: SHOW_TIMES[i], T, prog: slotProg(d, i), day: d, i }; } return null; }
function currentShow() { const n = G.now(), t = G.state.t; for (let i = 0; i < SHOW_TIMES.length; i++) { const T = n.day * DAY + SHOW_TIMES[i] * 60, pr = slotProg(n.day, i); if (t >= T - 15 && t < T + pr.dur - 10) return { key: n.day + ':' + i, T, prog: pr, at: Math.max(0, t - T), h: SHOW_TIMES[i] }; } return null; }
const showCrowd = () => { const n = G.now(); return Math.round(7 + (n.hf >= 17.5 ? 6 : 0) + (n.weekday >= 5 ? 5 : 0) + (partyOn() ? 4 : 0) + Math.random() * 4); };
const nextTalk = () => { const h = G.now().hf; return TALK_TIMES.find(t => t > h) || null; };
const nextParty = () => { const n = G.now(); let d = n.day; for (let k = 0; k < 8; k++, d++) if (d % 7 === PARTY.weekday && (d > n.day || n.hf < PARTY.hours[1])) return d; return d; };
async function desk() {
  if (!isOpen()) { toast('The desk is closed. Tickets from 13:00.', 'info'); return; }
  const nx = nextShow(), nt = nextTalk(), tk = hasTicket(), pd = nextParty() - G.now().day;
  const v = await choose('Tickets & Showtimes', [
    { label: tk ? 'Day ticket (you have one)' : 'Day ticket', sub: tk ? 'Valid until midnight' : fmt(OBS_TICKET) + ' · gallery, planetarium, dome and terrace', value: 't', disabled: tk },
    { label: 'Planetarium shows', sub: nx ? `Next: "${nx.prog.title}" at ${clock(nx.h)}${nx.day > G.now().day ? ' tomorrow' : ''}. Tap to add it to your day.` : 'Daily at ' + SHOW_TIMES.map(clock).join(', '), value: 's' },
    { label: 'Astronomy talks', sub: nt ? 'Next talk at ' + clock(nt) + ' in the gallery. Free with a ticket.' : 'Daily at ' + TALK_TIMES.map(clock).join(' and ') + ' in the gallery.', value: 'i' },
    { label: 'Star party', sub: pd === 0 ? (partyOn() ? 'On right now, up on the terrace!' : 'Tonight from 20:00 on the terrace. Free cocoa.') : `Every Saturday night, 20:00 to midnight. Next one in ${pd} day${pd === 1 ? '' : 's'}.`, value: 'p' },
    { label: 'Never mind', value: null }], { text: 'Open daily 13:00 to midnight. The dome opens when it is dark and clear.' });
  if (v === 't') buyTicket();
  else if (v === 's' && nx) { const id = safe(() => G.planner.add({ title: 'Planetarium: ' + nx.prog.title, placeId: 'observatory', t: nx.T - 10, dur: 90, kind: 'personal' })); toast(id !== undefined ? `"${nx.prog.title}", ${clock(nx.h)}: it is on your day. Doors open fifteen minutes before.` : `"${nx.prog.title}" at ${clock(nx.h)}. Doors open fifteen minutes before.`, 'good', 4200); }
  else if (v === 'i') toast('"Gus gives the talk by the moon wall. Just sit on one of the benches when he starts."', 'info', 4200);
  else if (v === 'p') toast('"Bring a coat. If it clouds over, everybody ends up in the planetarium instead."', 'info', 4200);
}
function arrived(sc, pv) {
  if (pv && pv.def && pv.def.showpiece === 'observatory') return; const S = st(), first = !S.visits; S.visits++; safe(() => G.places.discover('observatory', true)); G.emit('observatory:visit', first);
  if (first) toast('Cool marble, brass and a very long wire. Somewhere above you a pendulum is swinging.', 'good', 4200);
  if (hasTicket()) stamp('x:obs_visit');
}
function needTicket(what) { if (!isOpen()) { toast('The observatory is closed.', 'info'); return false; } if (!hasTicket()) { toast(`${what} needs a day ticket (${fmt(OBS_TICKET)}). The desk is by the door.`, 'info', 3600); return false; } return true; }
function goRoof() { if (!needTicket('The dome and terrace')) return false; G.go('int:observatory:roof'); return true; }
async function goTheatre() {
  if (!needTicket('The planetarium')) return false; const cur = currentShow(), nx = nextShow();
  if (cur) { G.go('int:observatory:planetarium'); return true; }
  const mins = nx ? Math.ceil(nx.T - 12 - G.state.t) : 0, v = await choose('The Star Theatre', [nx && nx.day === G.now().day && mins > 0 ? { label: `Wait for "${nx.prog.title}"`, sub: `Starts at ${clock(nx.h)}. Doors open in ${mins} min.`, value: 'w' } : null, { label: 'Go in and look around', sub: 'Sit anywhere. Stella may run a show for you if you ask.', value: 'g' }, { label: 'Not now', value: null }].filter(Boolean), { text: nx ? `Next show: "${nx.prog.title}" at ${clock(nx.h)}${nx.day > G.now().day ? ' tomorrow' : ''}.` : 'No more shows today.' });
  if (v === 'g') G.go('int:observatory:planetarium');
  else if (v === 'w') G.startActivity({ label: 'Waiting for the show', anim: 'phone', minutes: mins, rate: Math.max(6, mins / 5), done: () => { if (scene()) G.go('int:observatory:planetarium'); } });
  return v !== null;
}
function showDone(pr, credited, frac) {
  const S = st(); G.emit('observatory:show', pr.id, !!credited);
  if (!credited) { if (frac > .05) toast('You caught part of the show. Sit through a whole one for the full effect.', 'info', 3800); return; }
  const first = !S.shows[pr.id]; S.shows[pr.id] = (S.shows[pr.id] || 0) + 1; S.showCount++; need('fun', 30); xp('logic', first ? 16 : 6); moodlet(pr.id === 'starbirth' || pr.id === 'planets' ? 'inspired' : 'starstruck'); stamp('x:obs_show');
  const n = Object.keys(S.shows).length; toast(`"${pr.title}". ${first ? `New to you (${n}/${avail().length} programmes seen). ` : ''}You walk out blinking, a little taller than you went in.`, 'good', 5200);
}
async function startNow(progId) {
  if (!scene('observatory:planetarium')) await G.go('int:observatory:planetarium'); const sc = scene('observatory:planetarium'); return !!(sc && sc.star.begin(progId, true));
}
function talkPresenter(pres, star) {
  if (star.phase !== 'idle') { bubble(pres, star.phase === 'doors' ? 'Take any seat you like. We start in a moment.' : 'Shh! Enjoy the show.'); return; }
  const nx = nextShow();
  say([{ who: 'Stella, presenter', text: nx && nx.day === G.now().day ? `Next scheduled show is "${nx.prog.title}" at ${clock(nx.h)}.` : 'That was the last scheduled show today.' }, { who: 'Stella, presenter', text: 'It is quiet, though. I can run one for you now if you like. The projector likes the exercise.' }])
    .then(() => choose('Ask Stella for a show?', avail().map(p => ({ label: p.title, sub: (st().shows[p.id] ? 'Seen · ' : 'New · ') + 'about ' + Math.round(p.dur / 10) * 10 + ' seconds', value: p.id })).concat([{ label: 'Maybe later', value: null }])))
    .then(v => { if (v && star.begin(v, true)) toast('Find a seat and tap it. The lights go down in a moment.', 'good', 3600); });
}

/* ---------- gallery ---------- */
function act(o) { if (G.busy) return null; return G.startActivity(o); }
const useAt = (fx, dirTo) => { const u = fx.use || { x: fx.x, y: fx.y + .8 }, dx = fx.x - u.x, dy = fx.y - u.y; return { x: u.x, y: u.y, z: 0, dir: dirTo !== undefined ? dirTo : Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 0 : 2) : (dy > 0 ? 1 : 3) }; };
function watchPendulum() {
  const S = st(), n = G.now(), dn = Math.max(0, Math.min(24, Math.floor((n.hf - OBS_HOURS[0]) / 11 * 24)));
  bubble(G.player, pick(['...tick. ...tick.', 'It really does turn.', 'Come on, hit the next one.'])); if (S.pendDay !== n.day) { S.pendDay = n.day; need('fun', 3); xp('logic', 3); }
  toast(dn ? `${dn} of 24 pegs are down. Each one falls as the floor turns under the swing: it must be about ${clock(n.hf)}.` : 'All 24 pegs are standing. The first one falls about half an hour after opening.', 'info', 4600);
}
function crank(fx, sc) {
  const S = st(); if (!act({ label: 'Turning the orrery', anim: 'work', minutes: 6, rate: 1, at: useAt(fx), done: () => { S.cranks++; need('fun', 4); xp('logic', S.cranks === 1 ? 8 : 3); G.emit('observatory:crank', S.cranks); toast(S.cranks === 1 ? 'Six planets wheel round the brass Sun. One turn of the handle is one year: you just aged the solar system by about twenty.' : 'Mercury laps everybody. Saturn pretends not to notice.', 'good', 4600); } })) return false;
  if (sc && sc.obs) sc.obs.spin(6); bubble(G.player, 'Round we go.'); return true;
}
function touch(i) {
  const S = st(), m = METEORITES[i] || METEORITES[0], fresh = S.touched[i] === undefined;
  return say([{ who: m.title, text: m.text }]).then(() => { if (!fresh) return; S.touched[i] = G.now().day; const n = Object.keys(S.touched).length; xp('logic', 5); need('fun', 2); G.emit('observatory:touch', i, n);
    if (n >= METEORITES.length) { need('fun', 6); moodlet('inspired'); toast('You have now touched three pieces of outer space. Wash your hands or never wash them again: both are reasonable.', 'good', 5000); } else toast(`Meteorite touched (${n}/${METEORITES.length}).`, 'good', 2800); });
}
function coin(fx, sc) {
  const S = st(); if (G.busy) return false; if (G.money && !G.money.pay(.25, 'A coin for the gravity well', { category: 'fun', venue: OBS_VENUES.place })) return false;
  S.coins++; if (sc && sc.obs) sc.obs.coin(); need('fun', 4); if (S.coins === 1) xp('logic', 4); bubble(G.player, pick(['Go on, go on...', 'Round and round.', 'Faster at the bottom!'])); G.emit('observatory:coin', S.coins);
  if (S.coins === 1) toast('Your coin rolls round the funnel, faster and faster as it falls in: a quarter in orbit. It all goes to the telescope fund.', 'good', 4800); else if (S.coins === 10) toast('Ten coins. The telescope fund salutes you.', 'good'); return true;
}
function weigh(fx, sc) {
  const S = st(), p = fx.pose || { x: fx.x, y: fx.y, z: .12, dir: 1 }, kg = 58 + Math.floor(hash2(playerName().length, playerName().charCodeAt(0) || 7, 3) * 24);
  if (!act({ label: 'Standing on the scale', anim: 'stand', minutes: 4, rate: 1, at: { x: p.x, y: p.y, z: p.z || .12, dir: 1 }, done: () => { S.weighs++; need('fun', 3); if (S.weighs === 1) xp('logic', 4); G.emit('observatory:weigh'); bubble(G.player, pick(['I am moving to the Moon.', 'Jupiter is rude.', 'Mars it is, then.'])); toast(`Earth ${kg} kg · Moon ${Math.round(kg * .166)} kg · Mars ${Math.round(kg * .38)} kg · Jupiter ${Math.round(kg * 2.53)} kg. Same you, different planet.`, 'good', 5200); } })) return false;
  if (sc && sc.obs) sc.obs.scaleLit(4); return true;
}
function launch(fx, sc) {
  const S = st(); if (!act({ label: 'Stomping the launcher', anim: 'work', minutes: 2, rate: 1, at: useAt(fx), done: () => { const lv = safe(() => G.skills.level('fitness')) || 1, h = sc && sc.obs ? sc.obs.launch(Math.min(1.4, .45 + Math.random() * .55 + lv * .04)) : 0; if (!h) { toast('Wait for the rocket to come down first!', 'info'); return; } const m = Math.round(h * 2.2 * 10) / 10; S.rockets++; const best = m > S.rocketBest; if (best) S.rocketBest = m; need('fun', 7); G.emit('observatory:launch', m);
    toast(`WHOOSH. ${m} metres${best ? (S.rockets === 1 ? '. The kids are impressed.' : ': a new personal best!') : ` (your best is ${S.rocketBest}).`}`, 'good', 3800); } })) return false;
  bubble(G.player, 'Three... two... one...'); return true;
}
function readFact(key) {
  const S = st(); if (key === 'comet') { say([{ who: 'Comet Halvorsen-' + playerName(), text: `First seen from this observatory on three clear nights by Dr. N. Halvorsen and ${playerName()}. A long-period comet: its last visit was about forty thousand years ago. The model above you is to scale. The comet is not.` }]); return; }
  const t = FACTS[key]; if (!t) return; say([{ who: 'Maple Bay Observatory', text: t }]).then(() => { if (S.facts[key]) return; S.facts[key] = 1; xp('logic', 4); need('fun', 1); });
}
function freeSeat(fx, sc) { for (const s of fx.seats || []) if (!sc.ents.some(e => e !== G.player && !e.hidden && Math.hypot(e.x - s.x, e.y - s.y) < .4)) return s; return null; }
function sitBench(fx, sc) {
  if (G.busy) return false; const s = freeSeat(fx, sc); if (!s) { toast('Both seats are taken.', 'info'); return false; } const p = G.player, tk = sc && sc.obs && sc.obs.talk, live = !!(tk && tk.on && fx.item.talkBench); p.poseOpts = { seated: true };
  const a = G.startActivity({ label: live ? 'Listening to the talk' : 'Sitting down', anim: 'sit', minutes: live ? 60 : 15, rate: live ? 1.5 : 2.5, at: { x: s.x, y: s.y, z: s.z || .46, dir: s.dir === undefined ? 1 : s.dir }, tick: gm => { need('energy', gm * .15); }, cancel: () => { p.poseOpts = null; if (live) tk.joined = false; }, done: () => { p.poseOpts = null; } });
  if (live) { a._obsTalk = true; tk.joined = true; tk.heard = tk.i; toast(`"${tk.topic.title}" Gus is talking. Stay to the end.`, 'good', 3600); } return true;
}
function talkDone(tk) {
  const S = st(), heard = tk.i - (tk.heard || 0); if (G.busy && G.busy._obsTalk) G.endActivity(true);
  if (heard >= 2) { S.talks++; xp('logic', 18); need('fun', 8); need('social', 4); moodlet('inspired'); G.emit('observatory:talk', S.talks); toast(`"${tk.topic.title}" You clap with everybody else, and think about it all the way to the door.`, 'good', 4800); }
  else toast('You caught the very end of the talk. Come a little earlier next time.', 'info', 3600);
}
async function talkInfo(sc) {
  const tk = sc && sc.obs && sc.obs.talk; if (tk && tk.on) { toast('The talk is on. Take a bench!', 'info'); return; } const nt = nextTalk();
  const v = await choose('Astronomy talks', [{ label: 'Ask Gus to give the talk now', sub: 'About half a minute. Sit on a bench when he starts.', value: 1, disabled: !isOpen() || !hasTicket() }, { label: 'Not now', value: 0 }], { text: nt ? `Next talk at ${clock(nt)}, right here.` : `Daily at ${TALK_TIMES.map(clock).join(' and ')}.` });
  if (v === 1 && sc && sc.obs) sc.obs.startTalk(true);
}
function talkDocent(doc, key, tk) {
  if (tk && tk.on) { bubble(doc, 'Take a bench, I am just getting started!'); return; } const nt = nextTalk(), who = 'Gus, docent';
  const T = { meteor: 'Go on, touch it. Everyone asks if it is radioactive. It is not. It is just very, very old.', orrery: FACTS.orrery, well: FACTS.well, scale: FACTS.scale, planets: FACTS.planets, moonwall: FACTS.moonwall, pendulum: FACTS.pendulum };
  say([{ who, text: T[key] || FACTS.pendulum }, { who, text: nt ? `I give a talk at ${clock(nt)} by the moon wall. Bring your questions.` : 'Have you been upstairs yet? If it is dark and clear, go now. Go!' }]);
}
function lookBoard() { const n = st().sketches; toast(n ? `Moon sketches by visitors. ${n === 1 ? 'Yours is' : 'The last few of yours are'} pinned here, dated and signed.` : 'Moon sketches by visitors, each a different phase. Draw one at the sketching stool on the terrace, on a clear night with the Moon up.', 'info', 4600); }

/* ---------- overlays: the eyepiece and the constellation finder ---------- */
function overlay(CW, CH, tipText, round) {
  const cv = el('canvas', { width: CW, height: CH }); cv.className = 'obs-view'; cv.setAttribute('data-pad-surface', 'cursor');   /* QA16: controller: A steps onto the eyepiece / star field, the stick aims, A taps */
  Object.assign(cv.style, { position: 'fixed', left: '50%', top: '48%', transform: 'translate(-50%,-50%)', width: round ? 'min(84vw, 62vh, 460px)' : 'min(94vw, 680px)', imageRendering: 'pixelated', zIndex: 55, border: '4px solid ' + (round ? '#a8762a' : '#2a2733'), borderRadius: round ? '50%' : '0', boxShadow: round ? '0 0 0 6px #2a2733, 6px 8px 0 6px #0008' : '6px 6px 0 #0006', background: '#04050f', cursor: 'pointer', touchAction: 'none' });
  const tip = el('div', { text: tipText }); Object.assign(tip.style, { position: 'fixed', left: '50%', bottom: '9%', transform: 'translateX(-50%)', zIndex: 56, background: '#f4ead0', color: '#2a2733', border: '2px solid #2a2733', padding: '6px 10px', fontSize: '14px', boxShadow: '3px 3px 0 #0006', textAlign: 'center', maxWidth: '90vw' });
  root().append(cv, tip); G.modal++; let open = true;
  return { cv, ctx: cv.getContext('2d'), tip, at: e => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * CW, y: (e.clientY - r.top) / r.height * CH }; }, close() { if (!open) return; open = false; cv.remove(); tip.remove(); G.modal = Math.max(0, G.modal - 1); } };
}
const QN = ['', 'a little soft', 'a good clear view', 'pin-sharp'];
let eye = null;
/** show an object in the eyepiece. o: { small, sweep: { sx, sy }, city, noFocus, sky } -> Promise<{ q, hit }> */
function eyepiece(ob, o = {}) {
  if (eye) return Promise.resolve(null); const SZ = 96, s = o.sky || sky(), sweep = ob.kind === 'sweep', focus = !o.noFocus && !sweep && ob.kind !== 'city';
  const ov = overlay(SZ, SZ, sweep ? 'Somewhere in this field is a faint fuzzy patch that is not a star. Tap it.' : focus ? 'Turn the focus: tap when the image is sharp' : 'Tap to step back from the eyepiece', true);
  const off = document.createElement('canvas'); off.width = off.height = SZ; const ox = off.getContext('2d'), tiny = document.createElement('canvas'), tx = tiny.getContext('2d'), t0 = performance.now(), ph = Math.random() * 6; let done = false, found = false;
  const vo = { moon: s.moon, small: o.small, season: s.season, time: s.time, seed: (s.day % 97) + 1 + (o.seed || 0), sx: o.sx, sy: o.sy, u0: o.u0 }, blurAt = t => (focus ? Math.abs(Math.sin(t * .9 + ph)) : 0);
  const draw = (t, b) => { vo.found = found; drawView(ox, SZ, ob, t, vo); const c = ov.ctx; c.imageSmoothingEnabled = b > .08; if (b <= .08) { c.drawImage(off, 0, 0); return; } const k = Math.max(6, Math.round(SZ / (1 + b * 9))); tiny.width = tiny.height = k; tx.imageSmoothingEnabled = true; tx.drawImage(off, 0, 0, k, k); c.fillStyle = '#04050f'; c.fillRect(0, 0, SZ, SZ); c.drawImage(tiny, 0, 0, SZ, SZ); };
  return new Promise(res => {
    const finish = (q, hit) => { if (done) return; done = true; window.removeEventListener('keydown', key); if (q && focus) draw((performance.now() - t0) / 1000, 0); setTimeout(() => { ov.close(); eye = null; res(q === null ? null : { q, hit: !!hit }); }, q === null ? 0 : sweep ? (hit ? 1300 : 500) : focus ? 1500 : 150); };
    const snap = (x, y) => { if (done) return; const t = (performance.now() - t0) / 1000; if (t < .3) return;
      if (sweep) { const dx = Math.sin(t * .23) * 3, dy = Math.cos(t * .17) * 2; if (x === undefined) { x = o.sx * SZ + dx; y = o.sy * SZ + dy; } const hit = Math.hypot(x - (o.sx * SZ + dx), y - (o.sy * SZ + dy)) < 9; if (hit) { found = true; draw(t, 0); finish(2, true); } else { ov.tip.textContent = 'That one is a star: sharp, not fuzzy. Keep looking.'; } return; }
      const b = blurAt(t); finish(!focus ? (o.small ? 1 : 2) : b < .14 ? 3 : b < .42 ? 2 : 1); };
    const key = e => { if (e.key === ' ' || e.key === 'Enter' || e.key === 'e' || e.key === 'E') { e.preventDefault(); snap(); } else if (e.key === 'Escape') finish(null); };
    ov.cv.addEventListener('pointerdown', e => { e.preventDefault(); const q = ov.at(e); snap(q.x, q.y); }); window.addEventListener('keydown', key);
    eye = { snap, cancel: () => finish(null), kind: ob.kind, id: ob.id, state: () => { const t = (performance.now() - t0) / 1000; return { id: ob.id, kind: ob.kind, blur: Math.round(blurAt(t) * 100) / 100, t: Math.round(t * 10) / 10, sx: o.sx, sy: o.sy }; }, sharp: () => finish(3) };
    const loop = () => { if (done) return; const t = (performance.now() - t0) / 1000; if (t > (sweep ? 22 : 26)) { if (sweep) finish(1, false); else snap(); return; } draw(t, blurAt(t)); requestAnimationFrame(loop); }; loop();
  });
}
const upNow = (o, s) => (o.id === 'moon' ? s.moonUp : o.id === 'comet' ? cometDone() : (o.before && s.hf > o.before) ? false : !o.seasons || o.seasons.includes(s.season));
function targets(s = sky()) { return OBJECTS.filter(o => upNow(o, s)).map(o => ({ id: o.id, name: o.name, kind: o.kind, logged: st().log[o.id] || 0 })); }
function logObj(ob, q, small) {
  const S = st(), best = S.log[ob.id] || 0, fresh = !best; if (q > best) S.log[ob.id] = q; const n = Object.keys(S.log).length, tot = OBJECTS.filter(o => !o.bonus || cometDone()).length;
  need('fun', 5 + q * 3); xp('logic', (fresh ? 8 : 2) + q * 3 * logMult()); G.emit('observatory:look', ob.id, q); if (!small) stamp('x:obs_scope'); if (q >= 3 && fresh) moodlet('starstruck');
  toast(`${ob.name}: ${QN[q]}. ${fresh ? `New in your logbook (${n}/${tot}). ` : q > best ? 'Better than last time. ' : ''}${ob.note}`, 'good', 6000);
  if (fresh && n >= tot) { moodlet('starstruck'); toast('Every object in the logbook. Dr. Halvorsen will want to see this.', 'good', 5000); }
}
const wait = ms => new Promise(r => setTimeout(r, ms));
async function look(id, fx, sc) {
  if (eye || G.busy) return null; if (!needTicket('The Great Telescope')) return null; const s = sky(), c = st().chain;
  if (!s.night) { toast('The Great Telescope is parked and the dome is shut. It opens when it is properly dark.', 'info', 4200); return null; }
  if (!s.clear) { toast(s.wx === 'rain' ? 'The dome stays shut in the wet: a twelve-inch lens and rain do not mix.' : 'Clouded out tonight. The dome stays shut; try the planetarium instead.', 'info', 4600); return null; }
  const list = targets(s), sweepOk = c.st === 1 && !c.nights.includes(s.day);
  if (!id) id = await choose('The Great Telescope: tonight', (sweepOk ? [{ label: 'Comet sweep for Dr. Halvorsen', sub: `Night ${c.nights.length + 1} of 3 · find the fuzzy patch`, value: 'sweep' }] : []).concat(list.map(t => ({ label: t.name, sub: t.logged ? 'In your logbook: ' + QN[t.logged] : 'Not yet in your logbook', value: t.id }))).concat([{ label: 'Step away', value: null }]), { text: `${PHASE_NAMES[phaseIdx(s.moon)]}${s.moonUp ? ', and it is up' : ''}. Pick a target and Dr. Halvorsen will swing the telescope round.` });
  if (!id) return null; const ob = id === 'sweep' ? { id: 'sweep', kind: 'sweep', name: 'Comet sweep' } : OBJ_BY_ID[id]; if (!ob || (id === 'sweep' ? !sweepOk : !list.some(t => t.id === id))) { toast('That is not up tonight.', 'info'); return null; }
  sc = sc || scene('observatory:roof'); const hsh = hash2(id.length, id.charCodeAt(0), 5), dur = sc && sc.obs ? sc.obs.slew(Math.floor(hsh * 5), Math.floor(hash2(id.charCodeAt(1) || 3, 2, 5) * 3)) : .3;
  if (sc && sc.obs && sc.obs.astro && !sc.obs.astro.hidden) bubble(sc.obs.astro, id === 'sweep' ? 'Sweeping the field in Lyra. Tell me if anything looks fuzzy.' : `${ob.name}. Coming round... there.`, 2600);
  G.modal++; await wait(Math.min(2600, dur * 1000)); G.modal = Math.max(0, G.modal - 1);
  if (id === 'sweep') { const r = await eyepiece(ob, { sx: .2 + hash2(s.day, 3, 8) * .6, sy: .22 + hash2(s.day, 5, 8) * .56, sky: s }); if (r && r.hit) sweepFound(s.day); else if (r) toast('You lost it in the star field. It will keep: try again.', 'info', 3800); return r && { id, q: r.q, hit: r.hit }; }
  const r = await eyepiece(ob, { sky: s }); if (!r) return null; logObj(ob, r.q); return { id, q: r.q };
}
async function smallScope(fx, sc) {
  if (eye || G.busy) return null; if (!isOpen()) return null; const s = sky(), n = (fx && fx.item && fx.item.n) || 0, guest = n >= 3;
  if (fx && fx.ob && fx.ob.p && fx.ob.p.cover) { toast(s.wx === 'rain' ? 'Covered up against the rain.' : 'Covered: nothing but cloud up there tonight.', 'info'); return null; }
  if (!s.night) { await eyepiece({ kind: 'city', id: 'city' }, { noFocus: true, sky: s, u0: [380, 150, 470, 60, 300, 520][n % 6] }); need('fun', 3); toast(pick(['A ferry, a crane, a row of tiny windows. The whole bay in a circle.', 'You follow a tram all the way down the hill.', 'Somebody on a roof terrace downtown is waving. Probably not at you.']), 'good', 3800); return { id: 'city', q: 1 }; }
  if (!s.clear) { toast('Nothing but cloud tonight.', 'info'); return null; }
  const easy = targets(s).filter(t => ['moon', 'planet', 'double', 'cluster'].includes(t.kind) || guest); if (!easy.length) { toast('Just stars in this one tonight. Thousands of them.', 'info'); need('fun', 3); return null; }
  const ob = OBJ_BY_ID[easy[(n + s.day) % easy.length].id]; if (guest) bubble(G.player, 'May I?');
  const r = await eyepiece(ob, { small: !guest, noFocus: true, sky: s }); if (!r) return null; logObj(ob, guest ? 2 : 1, true); if (guest) need('social', 4); return { id: ob.id, q: guest ? 2 : 1 };
}

/* ---------- constellations ---------- */
let tracer = null;
function trace(fx, sc, id) {
  if (tracer || G.busy) return Promise.resolve(false); const s = sky(), S = st();
  if (!isOpen()) return Promise.resolve(false);
  if (!s.observing) { toast(s.night ? 'No stars to join up tonight: it is all cloud.' : 'The finder is a star map of tonight\'s sky. Come back when it is dark and try it against the real thing.', 'info', 4600); return Promise.resolve(false); }
  const cs = CONSTELLATIONS.filter(c => c.season === s.season);
  const go = c => new Promise(res => {
    const CW = 176, CH = 120, bx = 38, by = 14, bw = 100, bh = 88, wheel = has('obs_starwheel'), ov = overlay(CW, CH, `${c.name}: tap the pulsing star, then the next, to join the dots`), P = c.stars.map(q => [Math.round(bx + q[0] * bw), Math.round(by + q[1] * bh), q[2]]), t0 = performance.now(); let i = 0, done = false;
    const draw = t => { const x = ov.ctx; x.fillStyle = '#070b22'; x.fillRect(0, 0, CW, CH); for (let k = 0; k < 110; k++) { x.fillStyle = hash2(k, 3, 71) < .2 ? '#8a9ad8' : '#3a4a86'; x.fillRect(Math.floor(hash2(k, 1, 71) * CW), Math.floor(hash2(k, 2, 71) * CH), 1, 1); }
      const ln = (a, b, col) => { const A = P[a], B = P[b], n = Math.max(Math.abs(B[0] - A[0]), Math.abs(B[1] - A[1])); x.fillStyle = col; for (let k = 0; k <= n; k++) x.fillRect(Math.round(A[0] + (B[0] - A[0]) * k / n), Math.round(A[1] + (B[1] - A[1]) * k / n), 1, 1); };
      for (const [a, b] of c.lines) { if (a < i && b < i) ln(a, b, '#7a8ae0'); else if (wheel && (Math.floor(t * 3) & 1 || true)) { const A = P[a], B = P[b], n = Math.max(Math.abs(B[0] - A[0]), Math.abs(B[1] - A[1])); x.fillStyle = '#2d3a6e'; for (let k = 0; k <= n; k += 3) x.fillRect(Math.round(A[0] + (B[0] - A[0]) * k / n), Math.round(A[1] + (B[1] - A[1]) * k / n), 1, 1); } }
      P.forEach((q, k) => { const hit = k < i; x.fillStyle = hit ? '#ffe9b0' : q[2] === 1 ? '#ffffff' : '#c8d0f0'; x.fillRect(q[0], q[1], 1, 1); x.fillRect(q[0] - 1, q[1], 3, 1); x.fillRect(q[0], q[1] - 1, 1, 3); if (hit || q[2] === 1) { x.fillRect(q[0] - 2, q[1], 5, 1); x.fillRect(q[0], q[1] - 2, 1, 5); }
        if (k === i && !done) { const r = 5 + Math.round(Math.abs(Math.sin(t * 4)) * 3); x.strokeStyle = '#7df0a0'; x.lineWidth = 1; x.strokeRect(q[0] - r + .5, q[1] - r + .5, r * 2, r * 2); } });
      ctxText(x, c.name.split(',')[0], CW / 2, 3, '#f4d68a', true); ctxText(x, i + '/' + P.length, CW - 20, CH - 9, '#8a94c8'); if (done) ctxText(x, c.name, CW / 2, CH - 9, '#7df0a0', true); };
    const finish = ok => { if (tracer && tracer.end) return; tracer.end = true; window.removeEventListener('keydown', key); setTimeout(() => { ov.close(); tracer = null; if (ok) gotCons(c); res(!!ok); }, ok ? 1700 : 0); };
    const tap = k => { if (done) return false; if (k !== i) { ov.tip.textContent = 'Not that one: follow the pulsing square.'; return false; } i++; if (i >= P.length) { done = true; ov.tip.textContent = c.note; draw(0); finish(true); } return true; };
    const key = e => { if (e.key === 'Escape') finish(false); else if (e.key === ' ' || e.key === 'Enter' || e.key === 'e') { e.preventDefault(); tap(i); } };
    ov.cv.addEventListener('pointerdown', e => { e.preventDefault(); const q = ov.at(e); let b = -1, bd = 12; P.forEach((s2, k) => { const d = Math.hypot(s2[0] - q.x, s2[1] - q.y); if (d < bd) { bd = d; b = k; } }); if (b >= 0) tap(b >= i && bd < 12 && P[i] && Math.hypot(P[i][0] - q.x, P[i][1] - q.y) < 12 ? i : b); }); window.addEventListener('keydown', key);
    tracer = { id: c.id, tap, auto() { while (!done) tap(i); return true; }, state: () => ({ id: c.id, i, n: P.length, done }), cancel: () => finish(false) };
    const loop = () => { if (!tracer || tracer.end) return; const t = (performance.now() - t0) / 1000; if (t > 90) { finish(false); return; } if (!done) draw(t); requestAnimationFrame(loop); }; loop();
  });
  if (id && CONS_BY_ID[id]) return go(CONS_BY_ID[id]);
  return choose('Constellation finder: tonight\'s sky', cs.map(c => ({ label: c.name, sub: S.cons[c.id] !== undefined ? 'Traced' : 'Not traced yet', value: c.id })).concat([{ label: 'Step away', value: null }]), { text: 'Three constellations are well placed this season. Pick one and join the dots.' }).then(v => (v ? go(CONS_BY_ID[v]) : false));
}
function gotCons(c) {
  const S = st(), fresh = S.cons[c.id] === undefined; if (fresh) S.cons[c.id] = G.now().day; const n = Object.keys(S.cons).length; need('fun', 8); xp('logic', (fresh ? 12 : 4) * logMult()); stamp('x:obs_const'); G.emit('observatory:constellation', c.id, n);
  toast(fresh ? `${c.name}: traced (${n}/${CONSTELLATIONS.length}). Now look up: it is right there above the city.` : `${c.name} again. An old friend by now.`, 'good', 4800);
  if (fresh && n >= CONSTELLATIONS.length) { moodlet('starstruck'); toast('All twelve constellations, a whole year of sky. You will never be lost at night again.', 'good', 5600); }
  else if (fresh && n % 3 === 0 && CONSTELLATIONS.filter(q => q.season === c.season).every(q => S.cons[q.id] !== undefined)) toast('That is all three for this season. The sky changes with the months: come back next season for three more.', 'good', 5200);
}

/* ---------- terrace ---------- */
function sketchMoon(fx, sc) {
  if (G.busy) return false; const S = st(), s = sky(), seat = (fx.seats || [])[0] || { x: fx.x, y: fx.y, z: .42, dir: 3 };
  if (!isOpen()) return false;
  if (!s.observing) { toast(s.night ? 'No Moon to draw through that cloud.' : 'The sketching stool is for the Moon. Come back after dark.', 'info', 3800); return false; }
  if (!s.moonUp) { toast(s.moon < .07 || s.moon > .93 ? 'New Moon tonight: nothing to draw, but the best night of the month for faint things in the big telescope.' : 'The Moon is not up yet. It rises later each night after full.', 'info', 4800); return false; }
  const p = G.player, torch = has('obs_redtorch'), mult = torch ? 1.25 : 1, pi = phaseIdx(s.moon); p.poseOpts = { seated: true, item: 'book', itemColor: '#f4f0e8' }; bubble(p, torch ? 'Red torch on. Pencil out.' : 'Squinting at the paper in the dark...');
  G.startActivity({ label: 'Sketching the Moon', anim: 'read', minutes: 40, rate: 5, at: { x: seat.x, y: seat.y, z: seat.z || .42, dir: seat.dir === undefined ? 3 : seat.dir }, tick: gm => { xp('creativity', gm * .9 * mult); need('fun', gm * .3); }, cancel: () => { p.poseOpts = null; },
    done: () => { p.poseOpts = null; S.sketches++; S.moon = (S.moon + pi).slice(-6); const lv = safe(() => G.skills.level('creativity')) || 1; if (S.sketches === 1) moodlet('inspired'); G.emit('observatory:sketch', S.sketches);
      toast(`${PHASE_NAMES[pi]}. ${lv >= 6 ? 'You caught the crater shadows along the edge of the dark: it looks like a real observer\'s drawing.' : lv >= 3 ? 'The seas are in roughly the right places. Recognisably the Moon.' : 'A circle with some smudges. But it is YOUR circle.'} Gus will pin it on the board downstairs.`, 'good', 5600); } });
  return true;
}
function stargaze(fx, sc) {
  if (G.busy) return false; const S = st(), s = sky(), seat = freeSeat(fx, sc); if (!seat) { toast('Somebody is in that one.', 'info'); return false; } const p = G.player; p.poseOpts = { seated: true };
  G.startActivity({ label: s.observing ? 'Stargazing' : s.night ? 'Watching the clouds go by' : 'Enjoying the view', anim: 'sit', minutes: 30, rate: 3.5, at: { x: seat.x, y: seat.y, z: seat.z || .3, dir: 3 }, tick: gm => { need('fun', gm * (s.observing ? .6 : .25)); need('energy', gm * .2); }, cancel: () => { p.poseOpts = null; },
    done: () => { p.poseOpts = null; if (s.observing) { S.gazes++; moodlet('starstruck'); G.emit('observatory:stargaze', S.gazes); toast(pick(['Two shooting stars and one satellite. You made a wish on all three, to be safe.', 'After ten minutes your eyes open up and there are suddenly thousands more.', 'The Milky Way goes right over the top of the dome. You had forgotten it was there.']), 'good', 4600); } else toast(s.night ? 'Clouds, lit orange from below by the city. Still rather nice.' : 'The whole bay, the harbour cranes, the tower. A good chair in a good place.', 'good', 3800); } });
  return true;
}
function partyCocoa() {
  const S = st(), d = G.now().day; if (S.cocoaDay === d) { toast('"One free cup each, love. The counter downstairs does a Supernova."', 'info', 3600); return false; }
  S.cocoaDay = d; need('fun', 8); need('energy', 5); need('hunger', 4); bubble(G.player, 'Ahh. Warm hands.'); toast('A free paper cup of cocoa, steaming in the cold. Star parties are the best parties.', 'good', 3800); return true;
}
const cloudyParty = () => partyOn() && isOpen() && !sky().clear;   // QA round 3: a clouded-out star party really moves into the planetarium (as the desk says)
function creditParty(text) { const S = st(), d = G.now().day; if (S.partyDay === d) return false; S.partyDay = d; S.party++; moodlet('starstruck'); need('social', 6); stamp('x:obs_party'); G.emit('observatory:party', S.party); toast(text, 'good', 5600); return true; }
function onTheatre() { if (cloudyParty()) creditParty('Star party, clouded out, so it has moved in here: Stella is running the sky back to back until midnight. Grab a seat.'); }
function onRoof(sc) {
  const S = st(), s = sky(), d = s.day;
  if (s.party && !s.clear && S.partyDay !== d) toast('Clouded out up here. The star party has moved down to the planetarium: Stella is running shows back to back until midnight.', 'info', 5600);
  else if (s.party && S.partyDay !== d) creditParty('Star party! A row of home-made telescopes, red lanterns, free cocoa. Have a look through every one.');
  else if (s.observing && !S._roofNight) { S._roofNight = 1; toast('The dome is open. Below the parapet, the whole city is lit up like a circuit board.', 'good', 4600); }
}

/* ---------- Dr. Halvorsen's comet ---------- */
const GOAL = 'obs_comet';
const cometDone = () => st().chain.st === 3;
const goalText = () => { const c = st().chain; return c.st === 2 ? 'Tell Dr. Halvorsen: the fuzzy patch moved!' : `Sweep for Dr. Halvorsen's comet on clear nights (${c.nights.length}/3)`; };
function setGoal() {
  const c = st().chain; if (!G.goals) return;
  if (c.st === 1 || c.st === 2) { const g = safe(() => G.goals.get(GOAL)); if (g) { g.text = goalText(); G.emit('goals:change'); } else safe(() => G.goals.add({ id: GOAL, text: goalText(), group: 'opportunity', placeId: 'observatory', hint: 'Dr. Halvorsen thinks there is an unknown comet in Lyra. On three different clear nights, go up to the dome of the Maple Bay Observatory (open until midnight), look through the Great Telescope, choose "Comet sweep" and tap the faint fuzzy patch among the stars.' })); }
  else if (c.st === 3) safe(() => { if (G.goals.get(GOAL) && !G.goals.isDone(GOAL)) G.goals.complete(GOAL); });
}
function sweepFound(day) {
  const c = st().chain; if (c.st !== 1 || c.nights.includes(day)) return; c.nights.push(day); const n = c.nights.length; if (n >= 3) c.st = 2; setGoal(); G.emit('observatory:sweep', n); if (n >= 3) G.emit('observatory:chain', 2); xp('logic', 10); need('fun', 8);
  toast(n === 1 ? 'There: a faint smudge that is not on the chart. Dr. Halvorsen notes the position. "One night proves nothing. We need two more."' : n === 2 ? 'Found it again, and it is not where it was last time. It MOVED. One more clear night to be sure.' : 'Third night, third position, in a perfect line. It is real. Tell Dr. Halvorsen!', 'good', 6000);
}
function talkAstronomer(a) {
  const c = st().chain, s = sky(), who = WHO;
  if (c.st === 0) say([{ who, text: s.night ? 'Mind the step, and do not touch the lens. ...Sorry. Good evening. I have been short with everyone this week.' : 'Oh! Hello. I am reducing last night\'s plates. Excuse the mess.' }, { who, text: 'I think there is something new in Lyra. A faint fuzzy patch that is not on any chart. If it moves from night to night, it is a comet, and nobody has seen it before.' }, { who, text: 'But I need three clear nights of sweeping, and my eyes are not what they were. Yours look fine. Would you take the eyepiece?' }])
    .then(() => choose('Help Dr. Halvorsen sweep for the comet?', [{ label: 'I will take the eyepiece', value: 1 }, { label: 'Not just now', value: 0 }])).then(v => { if (v === 1) { c.st = 1; setGoal(); G.emit('observatory:chain', 1); bubble(a, 'Wonderful. Clear nights only. I will swing her round for you.'); toast('New opportunity: sweep for the comet through the Great Telescope on three different clear nights.', 'good', 5000); } else bubble(a, 'Of course. The sky is not going anywhere.'); });
  else if (c.st === 1) { const n = c.nights.length, tonight = c.nights.includes(s.day); say([{ who, text: tonight ? `We have tonight's position. ${3 - n} more clear night${3 - n === 1 ? '' : 's'}. Go home, sleep, come back tomorrow.` : s.observing ? 'It is clear! Go to the eyepiece and choose the comet sweep. Look for the patch that is fuzzy, not sharp.' : s.night ? 'Cloud. Always cloud when it matters. We wait.' : `${n} of 3 so far. Come up after dark, on a clear night.` }]); }
  else if (c.st === 2) say([{ who, text: 'Three nights. Three positions. Let me see your notes... yes. Yes! It moves a quarter of a degree a night, and the line points straight at the Sun.' }, { who, text: 'I have telegraphed the bureau. It is a new long-period comet, and by tradition it carries the names of the people who found it. Mine, and yours.' }, { who, text: `Comet Halvorsen-${playerName()}. I am having a model hung in the rotunda and Stella is writing a planetarium show. And you never pay to come in here again.` }]).then(() => {
    c.st = 3; G.state.flags.observatory_pass = true; safe(() => G.money.add(60, 'Discovery bonus from the Observatory')); safe(() => G.inv.add('obs_comet_print', 1)); moodlet('inspired'); moodlet('starstruck'); setGoal(); G.emit('observatory:chain', 3); syncAll();
    toast(`Comet Halvorsen-${playerName()}! Friend of the Observatory (free entry for life), $60, a framed discovery print, a comet model in the rotunda, the comet in the terrace sky and a brand new planetarium show.`, 'good', 8000); });
  else say([{ who, text: pick(['Our comet is past Mars now and brightening. Look for it from the terrace, over the harbour.', 'They put the model up yesterday. Gus keeps dusting it.', 'Forty thousand years since its last visit. We were painting on cave walls. Imagine what it thinks of the street lamps.', 'A Friend of the Observatory gets the eyepiece whenever she likes. Or he. Or they. Go on.']) }]);
}

/* ---------- guide wiring ---------- */
function patchGuide() {
  const e = safe(() => G.guide.get('place:observatory')); if (!e) return; const tags = ['stars', 'telescope', 'planetarium', 'night', 'pendulum', 'cocoa', 'star party'];
  e.blurb = CORE_BLURB.observatory; e.price = fmt(OBS_TICKET) + ' day ticket · rotunda, shop and cocoa free'; e.type = 'Observatory'; e.chapter = 'arts'; e.also = ['sights', 'shows', 'outdoors', 'eat', 'shop']; e.tags = (e.tags || []).filter(t => !tags.includes(t)).concat(tags);
  e.tryThis = ['See a planetarium show (14:00, 16:00, 18:00, 20:00, 22:00)', 'Look through the Great Telescope on a clear night', 'Trace a constellation on the terrace', 'Sketch the Moon', 'Touch the meteorites', 'Stomp the rocket launcher', 'Star party every Saturday from 20:00', 'Astronomy talk at 15:00 and 17:00'];
}

export function init() {
  S = G.defineState('observatory', DEF); G.on('load', () => { st(); setGoal(); });
  G.observatory = {
    isOpen, hours: OBS_HOURS, ticket: OBS_TICKET, hasTicket, buyTicket, enter, desk, arrived, goRoof, goTheatre, sky, onRoof, onTheatre, cloudyParty,
    shows: { times: SHOW_TIMES, programmes: () => avail().map(p => ({ id: p.id, title: p.title, blurb: p.blurb, dur: p.dur, seen: st().shows[p.id] || 0 })), next: nextShow, current: currentShow, crowd: showCrowd, startNow, state: () => { const sc = scene('observatory:planetarium'); return sc ? sc.star.state() : null; }, set debugSpeed(v) { const sc = scene('observatory:planetarium'); if (sc) sc.star.speed = v; } },
    showEnv: () => ({ season: G.now().season, moon: moonPhase(G.now().day), name: playerName() }), showDone, talkPresenter,
    scope: { targets, look, snap: (x, y) => eye && eye.snap(x, y), sharp: () => eye && eye.sharp(), state: () => (eye ? eye.state() : null), cancel: () => eye && eye.cancel() },
    log: () => OBJECTS.filter(o => !o.bonus || cometDone()).map(o => ({ id: o.id, name: o.name, note: o.note, q: st().log[o.id] || 0 })),
    constellations: () => CONSTELLATIONS.map(c => ({ id: c.id, name: c.name, season: c.season, got: st().cons[c.id] !== undefined })), trace, tracer: { state: () => (tracer ? tracer.state() : null), tap: i => tracer && tracer.tap(i), auto: () => tracer && tracer.auto(), cancel: () => tracer && tracer.cancel() },
    smallScope, sketchMoon, moonSketches: () => st().moon || '', stargaze, partyCocoa, touch, coin, weigh, launch, crank, watchPendulum, readFact, sitBench, talkInfo, talkDone, lookBoard,
    talk: { times: TALK_TIMES, next: nextTalk, start: () => { const sc = scene(); return !!(sc && sc.obs.startTalk(true)); } }, party: { on: partyOn, next: nextParty, weekday: PARTY.weekday, hours: PARTY.hours },
    talkAstronomer, talkDocent, chain: () => st().chain, cometDone, sweepFound, door: () => door,
    stats: () => { const S = st(); return { visits: S.visits, shows: S.showCount, programmes: Object.keys(S.shows).length, log: Object.keys(S.log).length, constellations: Object.keys(S.cons).length, sketches: S.sketches, meteorites: Object.keys(S.touched).length, coins: S.coins, rocketBest: S.rocketBest, talks: S.talks, gazes: S.gazes, parties: S.party, chain: S.chain.st }; },
  };
  // the door must exist before a save made inside the observatory exits to a city that was never built this session
  G.on('room:build', sc => { if (sc && sc.def && sc.def.showpiece === 'observatory' && !built) safe(() => ensure(getCity())); });
  G.on('scene', s => { if (!s || s.id !== 'city' || s._observatory || !s.world) return; s._observatory = true; try { wire(s); } catch (e) { console.warn('observatory', e); } setGoal(); });
  G.on('guide:rebuilt', patchGuide);
  // closing time: after midnight everybody is walked to the door
  G.on('minutes', () => { const sc = G.scene; if (!inside() || G.busy || G.modal || G.cutscene) return; const h = G.now().hf; if (h >= .3 && h < OBS_HOURS[0] - .02) { if (sc._closing) return; sc._closing = true; toast('"Midnight! We are closing the dome." Gus walks you to the door with a torch.', 'info', 4200); exitRoom({ poi: DOOR }).then(() => { sc._closing = false; }, () => { sc._closing = false; }); } });
}
