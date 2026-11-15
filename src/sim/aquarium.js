// Maple Bay Aquarium — city entrance, tickets + annual pass, shows, the species logbook, activities, the sleepover, the head aquarist's turtle opportunity and guide wiring.
// Rooms: scenes/rooms/aquarium.js ('aquarium'), aquarium_turtles.js ('aquarium:turtles'), aquarium_deep.js ('aquarium:deep', 'aquarium:deck', 'aquarium:lab'), life in aquarium_life.js + aquarium_life2.js. Data: data/aquarium.js. Art: art/showpiece/aquarium.js, aquarium_ext.js, _aqua_lib.js, _aqua_icons.js.
//
// City: the building `bld.harbor.aquarium` (164-184, 331-339), its door poi `door:aquarium` (171, 339.75) and the whale tail come from world/_blocks.js. This module adds the opening-hours check to the door and,
//   while the turtle is ready for release, the release spot on Gull Point Beach (poi `aqua:release`, a crate, Dr. Reyes and a small crowd). G.places id 'aquarium'.
//   Hours 9:00-18:00, Thursdays to 22:00 (Jellies After Dark), all night on day 13 of each season (Sleep with the Sharks). Hall, shop and cafe are free; everything else needs an $8 day ticket
//   or the $45 annual pass (G.state.flags.aquarium_pass).
// G.aquarium = {
//   isOpen(), hours() -> [open, close], lateNow(), sleepoverNow(), ticket, pass, hasTicket(), hasPass(), buyTicket() -> bool, buyPass() -> bool, desk(), arrived(scene, prev), travel(to) ('deep'|'deep2'|'reef'|'shop'|'deck'|'lab'),
//   spot(speciesId, scene) -> Promise<bool> (tunnel animals must really be swimming near you), logbook() -> { zone: { name, got, of, need, stamp } }, species() -> [{ id, zone, name, got }],
//   touch(id), touchRay(fx, scene), feedRays(fx, scene), penguins(scene), feedPenguin(scene), adopt(name?) -> Promise, adopted() -> [{ name, by }], quiz(answers?) -> Promise<score>, photo(spot, scene), sketch(fx, scene), lookBoard(),
//   sit(fx, scene, kind), wave(scene), shows: { list() -> [{ id, name, at, where, next }], next(id), plan(id, hour?), start(id) (debug: run it now in the current room), state() }, showsBoard(), talkKeeper(char, scene), talkLine(n, scene),
//   scope(), highFive(), sleepover() (roll out your bag in the tunnel), talkAquarist(char), chain() -> { st 0 none | 1 caring | 2 ready | 3 release at the beach | 4 done, name, days, lastDay, step }, care(what, fx, scene), lab(kind),
//   chart(), readPlaque(), release() (at the beach), releaseSpot(), door(), stats() }
//   + plaque(speciesIds, scene) (a tank plaque listing several species), touchGame(scene) / touchState() (tide-pool challenge: touch the four animals in the order called), feedTurtle(scene) (lettuce on the lagoon pier),
//     talkDone(kind 'turtle'|'octo', scene), photoMode: { open(scene), snap() -> { list, over, score }, close(), state() } (the tunnel photo spot opens a viewfinder), travel also takes 'turtles'.
//     Extra state: turtleFed, bestShot, touchGame (best seconds). Extra events: ':turtle'(id), ':touchgame'(phase, seconds), ':talk'(kind). Extra stamp: x:aqua_turtles.
// State: G.state.aquarium = { ticketDay, visits, log: { speciesId: day }, zones: { zoneId: day }, touch: { id: n }, rays, rayTouch, penguinFed, photos: { spot: n }, quiz: { best, badge }, sketches, sits, jelly, adopt: { name, day } | null,
//                             waves, talks, sleepovers, five, chain: { st, name, days, lastDay, step } }
// Events: 'aquarium:visit'(first), ':ticket'(kind), ':spot'(speciesId, fresh), ':zone'(zoneId), ':touch'(id), ':rays'(n), ':penguin'(name), ':adopt'(name), ':quiz'(score), ':photo'(spot), ':sketch'(n), ':sit'(kind), ':wave', ':show'(id, on),
//         ':talk', ':sleepover', ':care'(day, step), ':chain'(st), ':release'.
// Guide stamps: x:aqua_visit, x:aqua_tunnel, x:aqua_touch, x:aqua_jelly, x:aqua_feed, x:aqua_log, x:aqua_sleep, x:aqua_release.
// Tuning: AQ_TICKET 8, AQ_PASS 45, AQ_FEED 2, AQ_ADOPT 25, CARE_DAYS 3 (data/aquarium.js); SKETCH_MIN 40, JELLY_MIN 20, SPOT_R 7 tiles, zone stamps need 6/8/4/6/4/5/2 species (53 species in 7 zones); closing walk-out 20 min after closing.
import { G } from '../core/game.js';
import { el, root, toast, bubble, say, choose } from '../ui/kit.js';
import { exitRoom } from '../scenes/interior.js';
import { Char } from '../core/char.js';
import { AQ_HOURS, AQ_TICKET, AQ_PASS, AQ_FEED, AQ_ADOPT, CARE_DAYS, LATE, SLEEPOVER, AQ_VENUES, SHOWS, ZONES, SPECIES, TOUCH, PENGUINS, TURTLE_NAMES, TURTLES, QUIZ } from '../data/aquarium.js';
import { AQUA_ICONS } from '../art/showpiece/_aqua_icons.js';
import { ICONS } from '../art/icons/icons.js';
import { CORE, CORE_BLURB, EXPERIENCES } from './_guide_data.js';
import { getCity } from '../world/_city.js';
import { near, iso } from '../scenes/rooms/aquarium_life.js';
import { specs } from '../scenes/rooms/_airport_life.js';

export const order = 57;
for (const k in AQUA_ICONS) if (!ICONS[k]) ICONS[k] = AQUA_ICONS[k];
const NAME = 'Maple Bay Aquarium', DOOR = 'door:aquarium', SKETCH_MIN = 40, JELLY_MIN = 20, SPOT_R = 7, DAY = 1440, O = 1, GOAL = 'aqua_turtle', REL = { x: 50.5, y: 346.4 };
CORE.aquarium = ['sights', 'Aquarium', 'tower', ['outdoors', 'eat', 'shop']];
CORE_BLURB.aquarium = 'The building with the wave roof on the harbor boardwalk, where the river meets the bay. Sharks, rays and a sea turtle swim over your head in the Ocean Tunnel; the Jellyfish Gallery glows and changes colour; there are penguins, sea otters, a touch pool and a diver who waves back. Open late on Thursdays, and all night once a month.';
for (const x of [
  { id: 'x:aqua_visit', title: 'Under the Wave Roof', group: 'Big days out', glyph: 'tower', place: 'place:aquarium', need: 'aquarium', blurb: 'Buy a ticket to the Maple Bay Aquarium and go and look at something that has never heard of you.' },
  { id: 'x:aqua_tunnel', title: 'A Shark Overhead', group: 'Big days out', glyph: 'tower', place: 'place:aquarium', need: 'aquarium', blurb: 'Stand in the Ocean Tunnel and spot the sand tiger shark as it really passes by.' },
  { id: 'x:aqua_touch', title: 'Two Fingers, Gently', group: 'Big days out', glyph: 'tower', place: 'place:aquarium', need: 'aquarium', blurb: 'Touch all four touch-pool animals: sea star, urchin, anemone and hermit crab.' },
  { id: 'x:aqua_jelly', title: 'Jellyfish Calm', group: 'Big days out', glyph: 'tower', place: 'place:aquarium', need: 'aquarium', blurb: 'Sit on a bench in the Jellyfish Gallery and watch until the colours have gone all the way round.' },
  { id: 'x:aqua_turtles', title: 'Lettuce for a Turtle', group: 'Big days out', glyph: 'tower', place: 'place:aquarium', need: 'aquarium', blurb: 'Walk out on the pier in the Turtle Lagoon, hold out a lettuce leaf and wait for a turtle to take it.' },
  { id: 'x:aqua_feed', title: 'Feeding Time', group: 'Big days out', glyph: 'tower', place: 'place:aquarium', need: 'aquarium', blurb: 'Feed the bat rays at Ray Bay, or a penguin at the feeding show.' },
  { id: 'x:aqua_log', title: 'Fill the Species Logbook', group: 'Big days out', glyph: 'tower', place: 'place:aquarium', need: 'aquarium', blurb: 'Earn the stamp of all six zones, from Local Waters to the Abyss.' },
  { id: 'x:aqua_sleep', title: 'Sleep with the Sharks', group: 'Big days out', glyph: 'tower', place: 'place:aquarium', need: 'aquarium', blurb: 'Spend the monthly sleepover night in a sleeping bag under the Ocean Tunnel.' },
  { id: 'x:aqua_release', title: 'Back to the Bay', group: 'Big days out', glyph: 'tower', place: 'place:aquarium', need: 'aquarium', blurb: 'Help Dr. Reyes nurse the rescued turtle and carry her down to the water at Gull Point Beach.' },
]) if (!EXPERIENCES.some(e => e.id === x.id)) EXPERIENCES.push(x);

let S = null, built = null, door = null, relPoi = null, relStuff = null;
const st = () => { S = G.state.aquarium || (G.state.aquarium = {}); for (const [k, v] of [['log', {}], ['zones', {}], ['touch', {}], ['photos', {}], ['quiz', { best: 0, badge: false }], ['chain', { st: 0, name: '', days: 0, lastDay: -1, step: 0 }]]) if (!S[k] || typeof S[k] !== 'object') S[k] = v; for (const k of ['visits', 'rays', 'rayTouch', 'penguinFed', 'sketches', 'sits', 'jelly', 'waves', 'talks', 'sleepovers', 'five']) S[k] = S[k] || 0; if (S.ticketDay === undefined) S.ticketDay = -9; if (S.adopt === undefined) S.adopt = null; const c = S.chain; c.st = c.st || 0; c.days = c.days || 0; c.step = c.step || 0; if (c.lastDay === undefined) c.lastDay = -1; c.name = c.name || ''; return S; };
const fmt = n => (G.money && G.money.fmt ? G.money.fmt(n) : '$' + n);
const safe = fn => { try { return fn(); } catch (e) { return undefined; } };
const stamp = id => safe(() => G.guide && G.guide.stamp && G.guide.stamp(id));
const clock = h => String(Math.floor(h % 24)).padStart(2, '0') + ':' + String(Math.round((h % 1) * 60)).padStart(2, '0');
const pick = a => a[Math.floor(Math.random() * a.length)];
const who = () => (G.state.player && G.state.player.name) || 'A friend of the aquarium';
const dom = d => (d % 14) + 1;
const hours = () => AQ_HOURS(G.now().weekday);
const sleepoverNow = () => { const n = G.now(); return (dom(n.day) === SLEEPOVER.day && n.hf >= SLEEPOVER.from) || (n.day > 0 && dom(n.day - 1) === SLEEPOVER.day && n.hf < SLEEPOVER.to - 24); };
const lateNow = () => { const n = G.now(); return n.weekday === LATE.weekday && n.hf >= LATE.from && n.hf < LATE.to; };
const isOpen = () => { const h = G.now().hf, hr = hours(); return (h >= hr[0] && h < hr[1]) || sleepoverNow(); };
const hasPass = () => !!(G.state.flags && G.state.flags.aquarium_pass);
const hasTicket = () => { const n = G.now(); return hasPass() || st().ticketDay === n.day || (S.ticketDay === n.day - 1 && n.hf < 8); };
const scene = () => (G.scene && G.scene.def && G.scene.def.showpiece === 'aquarium' ? G.scene : null);
const room = () => (scene() ? scene().roomId : null);
const xp = (k, n) => safe(() => G.skills.addXp(k, n)), need = (k, n) => safe(() => G.needs.add(k, n)), moodlet = id => safe(() => G.needs.addMoodlet(id));
const flash = () => { const f = el('div'); Object.assign(f.style, { position: 'fixed', inset: 0, background: '#fff', opacity: .85, zIndex: 60, pointerEvents: 'none', transition: 'opacity .5s' }); root().append(f); setTimeout(() => { f.style.opacity = 0; }, 60); setTimeout(() => f.remove(), 700); };

/* ---------- city: door hours + the release spot on Gull Point Beach ---------- */
function ensure(w) {
  if (built === w || !w || !Array.isArray(w.objs)) return; built = w;
  door = w.pois.find(p => p.id === DOOR); if (!door) return;
  door.onUse = () => { if (isOpen()) return false; toast(`${NAME}: closed. Open daily ${clock(9)} to ${clock(18)}, Thursdays until ${clock(LATE.to)}. The sharks are still going round in there.`, 'info', 4600); return true; };
  relPoi = w.pois.find(p => p.id === 'aqua:release') || w.poi({ type: 'aquarium', id: 'aqua:release', name: 'Turtle release', x: REL.x, y: REL.y, district: 'harbor' });
}
function relSync(s) {
  if (!s || s.id !== 'city' || !s.world) return; const c = st().chain, want = c.st === 3;
  if (want && !relStuff) {
    const w = s.world, P = specs(), ents = [], mk = (spec, x, y, dir, label) => { const ch = new Char(spec, x, y); ch.z = w.heightAt(x, y); ch.dir = dir; ch.label = label; s.ents.push(ch); ents.push(ch); return ch; };
    const crate = safe(() => w.place('prop.aqua.crate', REL.x - .7, REL.y - 1.9, { p: { open: 0 }, solid: false }));
    const doc = mk(Object.assign({}, P.staff[2], { topColor: '#1f8f9a' }), REL.x - 1.5, REL.y - .6, 0, 'Dr. Reyes');
    const crowd = [[-3.6, -1.6, 0], [-3, -.4, 0], [-2.6, -2.6, 0], [2.6, -2.4, 2], [3.2, -1.2, 2], [2.4, -.2, 2], [3.6, -2.8, 2], [-4, -3, 0]].map(([dx, dy, d], i) => mk(i % 3 === 0 ? P.kid[i % P.kid.length] : P.adult[(i * 7 + 3) % P.adult.length], REL.x + dx, REL.y + dy, d, 'Onlooker'));
    const it = { x: REL.x, y: REL.y - 1.4, label: `Release ${c.name || 'the turtle'}`, h: .9, hit: 14, range: 1.4, spot: { x: REL.x, y: REL.y - .2 }, scene: 'city', use: () => release() }; s.interactables.push(it);
    const it2 = { ent: doc, x: doc.x, y: doc.y, label: 'Dr. Reyes', h: 1.3, hit: 8, range: 1.8, scene: 'city', use: () => bubble(doc, pick(['Whenever you are ready. She has been ready since breakfast.', 'Open the crate facing the water. She will know the rest.', 'I never get used to this part. I hope I never do.'])) }; s.interactables.push(it2);
    crowd.forEach(ch => s.interactables.push({ ent: ch, x: ch.x, y: ch.y, label: 'Onlooker', h: 1.2, hit: 6, range: 1.7, scene: 'city', _aq: 1, use: () => bubble(ch, pick(['Is that the turtle from the net? She looks so much better.', 'I brought the whole family down.', 'Go on, little one. Go on.'])) }));
    relStuff = { s, crate, doc, crowd, ents, its: [it, it2] };
  } else if (!want && relStuff && !relStuff.running) clearRel();
}
function clearRel() { const r = relStuff; if (!r) return; relStuff = null; for (const e of r.ents) { const i = r.s.ents.indexOf(e); if (i >= 0) r.s.ents.splice(i, 1); } if (r.turtle) { const i = r.s.ents.indexOf(r.turtle); if (i >= 0) r.s.ents.splice(i, 1); } r.s.interactables = r.s.interactables.filter(it => !r.its.includes(it) && !it._aq); if (r.crate) safe(() => r.s.world.remove(r.crate)); }
function release() {
  const c = st().chain, r = relStuff; if (c.st !== 3 || !r || r.running || G.busy) return false; const h = G.now().hf; if (h < 7 || h > 20) { toast('Dr. Reyes wants daylight for this. Come back between seven in the morning and eight at night.', 'info', 4200); return false; }
  r.running = true; const w = r.s.world, S4 = iso('turtle'), T = { x: REL.x, y: REL.y - 1, z: 0, t: 0, bb: [-.3, -.3, .3, .3, .2], sprite() { return { c: S4[1][Math.floor(this.t * 3) & 1].c, l: null, x: S4[1][0].x, y: S4[1][0].y, w: S4[1][0].w, h: S4[1][0].h }; } }; T.z = w.heightAt(T.x, T.y) + .05;
  if (r.crate) { r.crate.p = { open: 1 }; r.crate._key = null; } r.s.ents.push(T); r.turtle = T; bubble(r.doc, `Here we go, ${c.name}. The whole bay is yours.`, 4200); let said = 0;
  G.startActivity({ label: `Releasing ${c.name}`, anim: 'work', minutes: 14, rate: 1.6, at: { x: REL.x + .9, y: REL.y - .9, dir: 1 },
    tick: gm => { T.t += gm * .5; T.y += gm * .34; const gz = w.heightAt(T.x, T.y); T.z = (gz < -.3 ? -.9 : gz + .05); if (T.y > REL.y + .9 && said < 1) { said = 1; for (const ch of r.crowd) ch.pose = 'cheer'; bubble(r.crowd[1], 'She is in! She is IN!', 3600); } if (T.y > REL.y + 3.4) T.alpha = Math.max(0, 1 - (T.y - REL.y - 3.4) / 1.6); },
    cancel: () => { r.running = false; const i = r.s.ents.indexOf(T); if (i >= 0) r.s.ents.splice(i, 1); r.turtle = null; if (r.crate) { r.crate.p = { open: 0 }; r.crate._key = null; } for (const ch of r.crowd) ch.pose = null; },
    done: () => { c.st = 4; const had = hasPass(); G.state.flags.aquarium_pass = true; safe(() => G.money.add(had ? 80 + AQ_PASS : 80, 'Thank-you from the aquarium')); safe(() => G.inv.add('aqua_release_photo', 1)); moodlet('sea_struck'); need('fun', 25); need('social', 10); stamp('x:aqua_release'); setGoal(); G.emit('aquarium:release'); G.emit('aquarium:chain', 4); flash();
      say([{ who: 'Dr. Reyes', text: `One wave, two, and she is gone. Did you see her lift her head? They always look back once. I have no science for that.` }, { who: 'Dr. Reyes', text: `There will be a plaque in the hall by tomorrow: "${c.name}, released at Gull Point Beach by ${who()}." And you never pay at our door again.` }])
        .then(() => { toast(`Annual pass for life${had ? ' (your pass is refunded)' : ''}, $80, and a photo of the moment ${c.name} reached the water. A bronze plaque with your name now stands in the aquarium hall.`, 'good', 8000); setTimeout(() => { if (relStuff) { relStuff.running = false; clearRel(); } }, 9000); }); } });
  return true;
}

/* ---------- tickets, pass, the desk ---------- */
function buyTicket() {
  if (!isOpen()) { toast('The desk is closed.', 'info'); return false; }
  if (hasPass()) { toast('"Annual pass! Go straight in. The otters have been asking for you."', 'good'); stamp('x:aqua_visit'); return true; }
  if (hasTicket()) { toast('"Your ticket is good until closing: every zone, the Deep and the Harbor Deck."', 'info'); return true; }
  if (G.money && !G.money.pay(AQ_TICKET, 'Aquarium day ticket', { category: 'fun', venue: AQ_VENUES.place })) return false;
  S.ticketDay = G.now().day; G.emit('aquarium:ticket', 'day'); stamp('x:aqua_visit'); toast(`Aquarium day ticket (${fmt(AQ_TICKET)}). Local Waters is on your left, penguins straight ahead, the reef on your right, and the stairs to the Ocean Tunnel are in the reef.`, 'good', 5600); return true;
}
function buyPass() {
  if (hasPass()) { toast('You already have an annual pass.', 'info'); return true; }
  if (G.money && !G.money.pay(AQ_PASS, 'Aquarium annual pass', { category: 'fun', venue: AQ_VENUES.place })) return false;
  G.state.flags.aquarium_pass = true; G.emit('aquarium:ticket', 'pass'); stamp('x:aqua_visit'); toast('Annual pass: walk in any day, any Thursday evening and every sleepover night.', 'good', 5200); return true;
}
const nextShow = id => { const sh = SHOWS.find(s => s.id === id), h = G.now().hf; return sh ? sh.at.find(t => t + sh.dur > h && t < hours()[1]) || null : null; };
const showList = () => SHOWS.map(s => ({ id: s.id, name: s.name, at: s.at.slice(), where: s.where, next: nextShow(s.id) }));
function planShow(id, hour) {
  const sh = SHOWS.find(s => s.id === id); if (!sh || !G.planner) return false; const n = G.now(), nx = hour || nextShow(id), d = nx && nx > n.hf ? n.day : n.day + 1, th = nx && nx > n.hf ? nx : sh.at[0], t = d * DAY + th * 60;
  if (safe(() => G.planner.list(t - 1, t + 1).some(a => a.data && a.data.aquaShow === id))) { toast('That show is already on your day.', 'info'); return true; }
  safe(() => G.planner.add({ title: `${sh.name} (Aquarium)`, placeId: 'aquarium', t, dur: sh.dur * 60, kind: 'event', data: { aquaShow: id } })); toast(`Added to your planner: ${sh.name}, ${d === n.day ? 'today' : 'tomorrow'} at ${clock(th)}, ${sh.where}.`, 'good', 4400); return true;
}
async function showsBoard() {
  const L = showList(), n = G.now(), so = dom(n.day) === SLEEPOVER.day;
  const v = await choose("Today's Shows", L.map(s => ({ label: `${s.at.map(clock).join(' & ')}  ${s.name}`, sub: `${s.where}${s.next ? ` · next ${clock(s.next)}` : ' · done for today'} · tap to add to your day`, value: s.id })).concat([{ label: 'Close', value: null }]),
    { text: `${n.weekday === LATE.weekday ? 'Tonight: Jellies After Dark, open until ' + clock(LATE.to) + '. ' : ''}${so ? 'Tonight: Sleep with the Sharks. Sleeping bags are in the Ocean Tunnel from ' + clock(SLEEPOVER.from) + '. ' : `Next sleepover night: day ${SLEEPOVER.day} of the season. `}All shows are included with your ticket.` });
  if (v) planShow(v);
}
async function desk() {
  if (!isOpen()) { toast('The desk is closed. Open from 9:00.', 'info'); return; }
  const tk = hasTicket(), L = logbook(), q = st().quiz;
  const v = await choose('Tickets & Passes', [
    { label: hasPass() ? 'Day ticket (you have a pass)' : tk ? 'Day ticket (you have one)' : 'Day ticket', sub: tk ? 'Every zone, until closing' : fmt(AQ_TICKET) + ' · the hall, shop and cafe are free', value: 't', disabled: tk },
    { label: hasPass() ? 'Annual pass (yours)' : 'Annual pass', sub: hasPass() ? 'Walk straight in' : fmt(AQ_PASS) + ' · every day, late Thursdays and sleepover nights', value: 'p', disabled: hasPass() },
    { label: "Today's shows", sub: showList().filter(s => s.next).map(s => `${clock(s.next)} ${s.name.split(' ')[0]}`).join(' · ') || 'No more shows today', value: 's' },
    { label: 'Species logbook', sub: Object.values(L).map(z => `${z.name.split(' ')[0]} ${z.got}/${z.need}${z.stamp ? '*' : ''}`).join(' · '), value: 'l' },
    { label: S.adopt ? `Your penguin: ${S.adopt.name}` : 'Adopt a penguin', sub: S.adopt ? 'Your name is on the board at Penguin Cove' : fmt(AQ_ADOPT) + ' · a certificate, and your name on the adoption board', value: 'a', disabled: !!S.adopt },
    { label: 'Never mind', value: null }], { text: `Open today ${clock(hours()[0])} to ${clock(hours()[1])}. Fish Detective quiz best: ${q.best}/${QUIZ.length}.` });
  if (v === 't') buyTicket(); else if (v === 'p') buyPass(); else if (v === 's') showsBoard(); else if (v === 'a') adopt();
  else if (v === 'l') await choose('Species Logbook', Object.values(L).map(z => ({ label: `${z.stamp ? '[STAMPED] ' : ''}${z.name}`, sub: `${z.got} of ${z.of} species spotted · stamp at ${z.need}`, value: 0 })).concat([{ label: 'Close', value: 0 }]), { text: 'Use the species plaques by each tank to log what you spot. In the Ocean Tunnel the animal has to be in sight: wait for it to come round.' });
}
let lastRoom = null;
function arrived(sc, pv) {
  const S = st(), from = lastRoom; lastRoom = sc.roomId;
  if (sc.roomId !== 'aquarium' && (sc.roomId === 'aquarium:lab' ? S.chain.st < 1 : !hasTicket())) { setTimeout(() => { if (G.scene === sc) { toast(sc.roomId === 'aquarium:lab' ? 'Staff only: a technician walks you back out to Local Waters.' : '"Ticket, please!" A keeper walks you back up to the hall: the desk is by the door.', 'info', 4400); G.go('int:aquarium', { x: O + 20.5, y: O + 21, dir: 3 }); } }, 400); return; }
  if (sc.roomId !== 'aquarium') { if (sc.roomId === 'aquarium:deep' && sleepoverNow() && !sc._so) { sc._so = true; toast('The tunnel lights are down to blue. Sleeping bags are laid out along the glass: yours is the empty one in the middle.', 'good', 5200); } return; }
  if (from && from.startsWith('aquarium')) return; const first = !S.visits; S.visits++; safe(() => G.places.discover('aquarium', true)); G.emit('aquarium:visit', first);
  if (first) toast('Cool blue light, the hum of pumps, and in the middle of the hall a column of water four metres tall with a reef inside it. Tickets are at the desk on your right.', 'good', 5600);
  else if (sleepoverNow()) toast('Sleep with the Sharks: the aquarium is open all night. Sleeping bags are down in the Ocean Tunnel.', 'good', 4600);
  else if (lateNow()) toast('Jellies After Dark: the lights are low and the building is yours until ten.', 'good', 4200);
  if (hasTicket()) stamp('x:aqua_visit');
}
const DEST = { turtles: ['int:aquarium:turtles', 13, 16.6, 3, 1], deep: ['int:aquarium:deep', 3.2, 9.5, 0, 1], deep2: ['int:aquarium:deep', 30.6, 17.7, 2, 1], reef: ['int:aquarium', 36.9, 10.5, 2, 0], shop: ['int:aquarium', 9.9, 22.4, 2, 0], deck: ['int:aquarium:deck', 2.6, 12, 3, 1], lab: ['int:aquarium:lab', 7, 8.7, 3, 0] };
function travel(to) {
  const d = DEST[to]; if (!d || G.busy) return false;
  if (d[4] && !hasTicket()) { toast('"Ticket, please!" The exhibits need an aquarium ticket: the desk is in the hall by the door.', 'info', 3800); return false; }
  if (to === 'deck' && G.now().hf >= 19 && !lateNow()) { toast('The Harbor Deck is closed after dark: the otters are asleep, holding paws.', 'info', 3800); return false; }
  if (to === 'lab' && st().chain.st < 1) { toast('STAFF ONLY. Through the porthole you can see a round blue pool and somebody in a teal shirt writing on a whiteboard. Dr. Reyes, the head aquarist, is usually out here in Local Waters.', 'info', 5600); return false; }
  G.go(d[0], { x: d[1] + O, y: d[2] + O, dir: d[3] }); return true;
}

/* ---------- the species logbook ---------- */
function logbook() {
  const S = st(), out = {}; for (const k in ZONES) out[k] = { name: ZONES[k].name, need: ZONES[k].need, got: 0, of: 0, stamp: S.zones[k] !== undefined };
  for (const id in SPECIES) { const z = out[SPECIES[id].zone]; if (z) { z.of++; if (S.log[id] !== undefined) z.got++; } } return out;
}
function logIt(sp) {
  const S = st(), e = SPECIES[sp]; if (!e) return false; const fresh = S.log[sp] === undefined; if (fresh) { S.log[sp] = G.now().day; xp('logic', 6); need('fun', 2); }
  G.emit('aquarium:spot', sp, fresh); if (sp === 'sandtiger') stamp('x:aqua_tunnel'); if (!fresh) return false;
  const Z = ZONES[e.zone], got = logbook()[e.zone].got;
  if (S.zones[e.zone] === undefined && got >= Z.need) { S.zones[e.zone] = G.now().day; G.emit('aquarium:zone', e.zone); const all = Object.keys(ZONES).every(k => S.zones[k] !== undefined); moodlet('sea_struck'); if (all) { stamp('x:aqua_log'); xp('logic', 40); } toast(`Logbook stamped: ${Z.name}!${all ? ' That is all six zones: the whole aquarium is in your book.' : ''}`, 'good', 5000); }
  else toast(`Spotted: ${e.name} (${Z.name} ${got}/${Z.need}).`, 'good', 2600);
  return true;
}
async function plaque(list, sc) {
  const S = st(), v = await choose('Species at this tank', list.map(id => ({ label: (S.log[id] !== undefined ? '[x] ' : '[ ] ') + SPECIES[id].name, sub: S.log[id] !== undefined ? 'In your logbook. Read it again' : 'Find it in the tank, then log it', value: id })).concat([{ label: 'Step back', value: null }]), { text: 'Look for each animal behind the glass.' });
  return v ? spot(v, sc) : false;
}
async function spot(sp, sc) {
  const e = SPECIES[sp]; if (!e || G.busy) return false; sc = sc || scene();
  if (e.live) { const kind = e.live === 1 ? sp : e.live, p = G.player, hit = sc && sc.aq && sc.aq.swimmers ? near(sc.aq.swimmers, kind, p.x, p.y, SPOT_R) : null;
    if (!hit) { toast(`${e.name}: not in sight just now. Keep watching the water: it comes round every minute or two.`, 'info', 3800); return false; }
    if (hit.name && hit.st) { const T = TURTLES.find(t => t.name === hit.name); toast(`${hit.name} is ${{ glide: 'gliding past', up: 'heading up for a breath', breath: 'at the surface, breathing', rest: 'asleep on the sand', visit: 'at the glass, looking straight at you', food: 'after the lettuce' }[hit.st] || 'swimming by'}.${T ? ' ' + T.note : ''}`, 'info', 4200); }
    bubble(p, hit.z > 2.8 && Math.abs(hit.y - p.y) < 2 ? 'Right over my head!' : 'There!'); }
  await say([{ who: e.name, text: e.fact }]); return logIt(sp);
}

/* ---------- touch pool, Ray Bay ---------- */
let tg = null;
function touchGame(sc) {
  if (G.busy) return false; if (tg) { toast(`Tide-pool challenge: find and touch the ${TOUCH.find(t => t.id === tg.seq[tg.i]).name}! (${tg.i}/${tg.seq.length})`, 'info', 3600); return true; }
  const seq = TOUCH.map(t => t.id).sort(() => Math.random() - .5); tg = { seq, i: 0, t0: Date.now(), miss: 0 }; bubble(G.player, 'Ready!'); G.emit('aquarium:touchgame', 'start');
  toast(`Tide-pool challenge! The guide calls out an animal and you find it by feel. Gentle hands. First: the ${TOUCH.find(t => t.id === seq[0]).name}.`, 'good', 5600); return true;
}
function touchStep(id) {
  if (!tg) return false; const want = tg.seq[tg.i];
  if (id !== want) { tg.miss++; toast(`That is the ${TOUCH.find(t => t.id === id).name}! ${{ sunstar: 'Look for five rough arms.', urchin: 'Look for purple spines.', anemone: 'Look for soft green tentacles.', crab: 'Look for a walking shell.' }[want]}`, 'info', 3800); return true; }
  tg.i++; if (tg.i < tg.seq.length) { toast(`Yes! Next: the ${TOUCH.find(t => t.id === tg.seq[tg.i]).name}. (${tg.i}/${tg.seq.length})`, 'good', 3400); return true; }
  const S = st(), sec = Math.round((Date.now() - tg.t0) / 1000), miss = tg.miss; tg = null; S.touchGame = S.touchGame ? Math.min(S.touchGame, sec) : sec; need('fun', 10 - Math.min(6, miss * 2)); xp('logic', 12); G.emit('aquarium:touchgame', 'done', sec);
  toast(`All four found in ${sec} seconds${miss ? ` with ${miss} wrong guess${miss > 1 ? 'es' : ''}` : ', and not one wrong'}! The guide rings a little brass bell. Best time: ${S.touchGame} s.`, 'good', 5600); return true;
}
function touch(id) {
  const T = TOUCH.find(t => t.id === id); if (!T || G.busy) return false; const S = st(); bubble(G.player, 'Two fingers. Gently.'); const game = !!tg;
  G.startActivity({ label: `Touching the ${T.name}`, anim: 'work', minutes: game ? 1 : 3, rate: game ? 2 : 1.2, done: () => { const fresh = !S.touch[id]; S.touch[id] = (S.touch[id] || 0) + 1; need('fun', fresh ? 6 : 2); xp('logic', fresh ? 5 : 1); G.emit('aquarium:touch', id); const n = Object.keys(S.touch).length; logIt(id);
    if (game && touchStep(id)) { if (n >= TOUCH.length && fresh) stamp('x:aqua_touch'); return; }
    toast(`${T.feel}${fresh ? ` (${n}/${TOUCH.length} touch-pool animals)` : ''}`, 'good', 5000); if (n >= TOUCH.length && fresh) { stamp('x:aqua_touch'); moodlet('sea_struck'); toast('That is all four touch-pool animals. The guide gives you a sticker of a sea star. You wear it with pride.', 'good', 5200); } } });
  return true;
}
function touchRay(fx, sc) {
  if (G.busy || !sc || !sc.aq || !sc.aq.rays) return false; const p = G.player, S = st(), tx = Math.max(fx.ob.B[0] + .8, Math.min(fx.ob.B[3] - .8, p.x)), ty = p.y > fx.ob.B[4] ? fx.ob.B[4] - .9 : p.y < fx.ob.B[1] ? fx.ob.B[1] + .9 : p.y, t = { x: p.x > fx.ob.B[3] ? fx.ob.B[3] - .9 : tx, y: ty };
  const close = () => sc.aq.rays.some(r => Math.hypot(r.x - t.x, r.y - t.y) < 1.3);
  bubble(p, 'Flat hand, palm up...');
  G.startActivity({ label: 'Waiting for a ray', anim: 'work', minutes: 4, rate: 1, tick: () => { if (!G.busy._lured && !close()) { G.busy._lured = 1; sc.aq.feedRays(t.x, t.y, 5); } },
    done: () => { if (!close() && Math.random() < .25) { toast('The rays circle the far side of the lagoon and do not come over. Try again: they are curious, but they are not in a hurry.', 'info', 4200); return; } S.rayTouch++; need('fun', 7); logIt('ray'); G.emit('aquarium:touch', 'ray'); toast('A bat ray glides under your hand and lifts to meet it: wet velvet, cool and smooth, and then it banks away with one flap.', 'good', 5200); } });
  return true;
}
function feedRays(fx, sc) {
  if (G.busy || !sc || !sc.aq) return false; const S = st(), free = sc.aq.show && sc.aq.show.rays;
  if (!free && G.money && !G.money.pay(AQ_FEED, 'Ray food', { category: 'fun', venue: AQ_VENUES.place })) return false;
  const lg = sc.fixtures.find(f => f.tags.includes('aqua_lagoon')), t = lg ? { x: lg.ob.B[0] + 1.4, y: lg.ob.B[4] - .8 } : { x: G.player.x, y: G.player.y - 1 }; sc.aq.feedRays(t.x, t.y, 9); if (sc.aq.tanks && sc.aq.tanks.reef) sc.aq.tanks.reef.feed(8);
  toast(free ? 'Feeding time: a cup of chopped clam, on the house.' : `A paper cup of chopped clam (${fmt(AQ_FEED)}). Hold it under the water.`, 'info', 3000);
  G.startActivity({ label: 'Feeding the rays', anim: 'work', minutes: 6, rate: .9, at: lg ? { x: lg.ob.B[0] + 1.4, y: lg.ob.B[4] + .45, dir: 3 } : undefined, done: () => { S.rays++; need('fun', 10); xp('logic', 4); stamp('x:aqua_feed'); logIt('ray'); G.emit('aquarium:rays', S.rays); toast(pick(['Four rays pile up at your hand like puppies. One hoovers the cup clean and splashes your sleeve on the way out.', 'They take it straight from your palm: a soft suck, like a vacuum cleaner with manners.', 'The biggest ray flaps the water over the edge. You are now slightly wet and extremely happy.']), 'good', 5200); } });
  return true;
}

/* ---------- the Turtle Lagoon ---------- */
function feedTurtle(sc) {
  if (G.busy || !sc || !sc.aq || !sc.aq.lure) return false; const S = st(), p = G.player; if (sc.aq.night && sc.aq.night()) { toast('The turtles are asleep on the sand. Leave the lettuce for the morning.', 'info'); return false; }
  const t = sc.aq.lure(p.x + (p.x < 14 ? -1.5 : 1.5), p.y - .3, 14); bubble(p, 'Come on, then...');
  G.startActivity({ label: 'Holding out a lettuce leaf', anim: 'work', minutes: 6, rate: .55, done: () => { const near = Math.hypot(t.x - p.x, t.y - p.y) < 3.2; if (!near) { toast(`${t.name} turns toward the lettuce, thinks about it, and glides on. Hold it out again: turtles do nothing in a hurry.`, 'info', 4600); return; }
    S.turtleFed = (S.turtleFed || 0) + 1; need('fun', 12); xp('logic', 4); stamp('x:aqua_turtles'); logIt(t.sp); G.emit('aquarium:turtle', t.id);
    toast({ moss: 'Moss arrives first, as always, takes the leaf in one neat bite and stays at the pier to see if there is more.', biscotti: 'Biscotti hauls herself off the sand, crosses the lagoon like a slow barge, and crunches the lettuce stalk and all.', opal: 'Opal darts in under the others, snips the leaf out of your fingers with her beak and is gone round the coral.', tom: 'The water darkens: Old Tom, two metres of him, rising under the pier. He takes the lettuce very gently, looks at you with one ancient eye, and sinks away.' }[t.id] || `${t.name} takes the lettuce.`, 'good', 6500); } });
  return true;
}
function talkDone(kind, sc) {
  if (scene() !== sc) return; const S = st(), p = G.player;
  if (kind === 'turtle') { S.talks++; xp('logic', 14); need('fun', 8); for (const t of TURTLES) logIt(t.sp); G.emit('aquarium:talk', 'turtle'); toast('Kekoa finishes to applause. In the lagoon the diver is down to the last lettuce and Old Tom has just noticed.', 'good', 5200); }
  else if (kind === 'octo' && p.x > 20) { S.talks++; xp('logic', 14); need('fun', 8); logIt('octopus'); G.emit('aquarium:talk', 'octo'); toast('Inky flushes brick red, pours herself across the tank from one den to the next, and puts one sucker on the glass exactly where your hand is.', 'good', 5600); }
}

/* ---------- penguins ---------- */
const OTHERS = [{ name: 'Skipper', by: 'Mia' }, { name: 'Waddles', by: 'Otis' }, { name: 'Admiral', by: 'Class 3B' }];
const adopted = () => OTHERS.concat(st().adopt ? [{ name: st().adopt.name, by: (who().split(' ')[0] || 'You') }] : []);
function penguins(sc) { const nx = nextShow('penguin'), a = st().adopt; toast(`Six Magellanic penguins: ${PENGUINS.join(', ')}.${a ? ` ${a.name} is yours: look for the green wing band.` : ''} ${sc && sc.aq && sc.aq.show && sc.aq.show.penguin ? 'It is feeding time: ask Tobias, up on the rock, if you can feed one.' : nx ? `Next feeding at ${clock(nx)}.` : 'Feedings at 11:30 and 15:30.'}`, 'info', 5600); return true; }
function feedPenguin(sc) {
  if (G.busy || !sc || !sc.aq) return false; if (!sc.aq.show.penguin) { toast('Tobias has put the bucket away. Feedings are at 11:30 and 15:30.', 'info'); return false; }
  const S = st(), p = G.player, pg = sc.aq.feedPenguin(p.x); bubble(sc.aq.keeper, 'Hold it by the tail, head first, and let go when they grab!', 3600);
  G.startActivity({ label: 'Feeding a penguin', anim: 'work', minutes: 4, rate: .8, done: () => { S.penguinFed++; need('fun', 12); need('social', 3); stamp('x:aqua_feed'); logIt('penguin'); G.emit('aquarium:penguin', pg.name); toast(`${pg.name} rockets across the pool, pops up at the glass and takes the herring out of your fingers in one gulp.${S.adopt && S.adopt.name === pg.name ? ' Your own penguin! She knew.' : ''} Then she looks at you as if you might be hiding another.`, 'good', 6000); } });
  return true;
}
async function adopt(name) {
  const S = st(); if (S.adopt) { toast(`You have adopted ${S.adopt.name}. Your name is on the board.`, 'info'); return false; }
  if (!name) name = await choose('Adopt a Penguin', PENGUINS.filter(n => !OTHERS.some(o => o.name === n)).map(n => ({ label: n, sub: { Pebble: 'Runs the colony. Gets the first fish.', Olive: 'Shy. Collects pebbles and guards them.', Pickles: 'Youngest. Still falls off the rock.' }[n] || 'A fine bird.', value: n })).concat([{ label: 'Not today', value: null }]), { text: `${fmt(AQ_ADOPT)} feeds your penguin for a month. You get a certificate, and your name goes on the adoption board at Penguin Cove.` });
  if (!name) return false; if (G.money && !G.money.pay(AQ_ADOPT, 'Penguin adoption', { category: 'fun', venue: AQ_VENUES.place })) return false;
  S.adopt = { name, day: G.now().day }; safe(() => G.inv.add('aqua_certificate', 1)); need('fun', 10); moodlet('sea_struck'); G.emit('aquarium:adopt', name); const sc = scene(); if (sc && sc.aq && sc.aq.sync) sc.aq.sync();
  toast(`${name} is officially your penguin. The certificate has a footprint on it (hers). Your name is on the adoption board at Penguin Cove.`, 'good', 6000); return true;
}

/* ---------- quiz, photos, sketching, sitting, the diver ---------- */
async function quiz(answers) {
  const S = st(); let score = 0;
  for (let i = 0; i < QUIZ.length; i++) { const q = QUIZ[i], v = answers ? answers[i] : await choose(`Fish Detective ${i + 1}/${QUIZ.length}`, q.a.map((a, k) => ({ label: a, value: k })).concat([{ label: 'Give up', value: -1 }]), { text: q.q }); if (v === -1 || v === null || v === undefined) return 0; if (v === q.ok) score++; }
  S.quiz.best = Math.max(S.quiz.best, score); xp('logic', score * 4); need('fun', 4 + score); G.emit('aquarium:quiz', score);
  if (score >= 5 && !S.quiz.badge) { S.quiz.badge = true; safe(() => G.inv.add('aqua_badge', 1)); moodlet('sea_struck'); toast(`${score} out of ${QUIZ.length}! The machine prints a badge: Junior Marine Biologist. It is still warm.`, 'good', 5600); }
  else toast(score >= 5 ? `${score} out of ${QUIZ.length}. You already have the badge, but the machine plays its little tune anyway.` : `${score} out of ${QUIZ.length}. The answers are all on the plaques by the tanks: five or more wins a badge.`, score >= 5 ? 'good' : 'info', 4800);
  return score;
}
let pm = null;
const SHOT = { sandtiger: 'sand tiger shark', leopard: 'leopard shark', blacktip: 'blacktip reef shark', hammerhead: 'hammerhead', ray: 'eagle ray', manta: 'manta ray', mola: 'sunfish', turtle: 'green turtle', hawks: 'hawksbill turtle', bass: 'giant sea bass', sardine: 'the sardine ball' };
function inShot(sc) { const p = G.player, got = {}; let over = false; for (const e of sc.aq.swimmers) { if (!SHOT[e.sp] || e.hidden || e.lead) continue; const d = Math.hypot(e.x - p.x, e.y - p.y); if (d < 5) { got[e.sp] = 1; if (e.z > 2.8 && d < 2.2) over = true; } } return { list: Object.keys(got), over }; }
function photoClose() { if (!pm) return; clearTimeout(pm.to); pm.box.remove(); pm = null; }
function photoSnap() {
  if (!pm) return null; const sc = pm.sc, S = st(), r = inShot(sc), n = r.list.length, score = n + (r.over ? 2 : 0); photoClose(); flash(); S.photos.tunnel = (S.photos.tunnel || 0) + 1; S.bestShot = Math.max(S.bestShot || 0, score); need('fun', 3 + Math.min(9, score * 2)); G.emit('aquarium:photo', 'tunnel', score);
  toast(n ? `Click! In the frame: ${r.list.map(k => SHOT[k]).join(', ')}${r.over ? ', with one of them right over your head' : ''}. ${score >= 5 ? 'That one is going on the wall.' : score >= 3 ? 'A good one.' : 'Not bad: wait for more to come round and try again.'} (best shot: ${S.bestShot})` : 'Click. A lovely photograph of blue water. Wait for something to swim into the frame and try again.', n ? 'good' : 'info', 6000); return { list: r.list, over: r.over, score };
}
function photoOpen(sc) {
  if (pm || !sc || !sc.aq || !sc.aq.swimmers) return false; const box = el('div'), cnt = el('div', { text: '' }), b = (t, fn, bg) => { const e = el('button', { text: t, onclick: fn }); Object.assign(e.style, { pointerEvents: 'auto', font: 'inherit', fontSize: '16px', padding: '8px 18px', margin: '0 6px', border: '2px solid #2a2733', background: bg, color: '#2a2733', boxShadow: '3px 3px 0 #0008', cursor: 'pointer' }); return e; };
  Object.assign(box.style, { position: 'fixed', inset: 0, zIndex: 55, pointerEvents: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: '84px', boxShadow: 'inset 0 0 0 28px #0b1220cc, inset 0 0 0 31px #e8fbff' });
  Object.assign(cnt.style, { color: '#e8fbff', textShadow: '2px 2px 0 #000', marginBottom: '10px', fontSize: '15px', textAlign: 'center', padding: '0 40px' }); const row = el('div', {}, b('SNAP', () => photoSnap(), '#f2c24a'), b('Lower the camera', () => photoClose(), '#eef3f2')); box.append(cnt, row); root().append(box);
  pm = { sc, box, to: setTimeout(photoClose, 30000) }; const upd = () => { if (!pm) return; const r = inShot(sc); cnt.textContent = r.list.length ? `In frame: ${r.list.map(k => SHOT[k]).join(', ')}${r.over ? ' · OVERHEAD!' : ''}` : 'Nothing in frame yet. Wait for it...'; setTimeout(upd, 300); }; upd(); return true;
}
function photo(spotId, sc) {
  if (G.busy) return false; if (spotId === 'tunnel' && sc && sc.aq && sc.aq.swimmers) return photoOpen(sc); const S = st(), p = G.player; let extra = '';
  if (spotId === 'tunnel' && sc && sc.aq && sc.aq.swimmers) { const sh = ['sandtiger', 'ray', 'turtle', 'leopard'].map(k => near(sc.aq.swimmers, k, p.x, p.y, 4.5)).find(Boolean); extra = sh ? ` And right behind your shoulder, perfectly in frame: a ${sh.sp === 'ray' ? 'spotted eagle ray' : sh.sp === 'turtle' ? 'green sea turtle' : sh.sp === 'leopard' ? 'leopard shark' : 'sand tiger shark'}.` : ' The water behind you is empty this time: wait for something big to come round and try again.'; if (sh) need('fun', 4); }
  const T = { jaws: ['In the jaws', 'You, grinning between the jaws of a megalodon. Everybody takes this picture. Everybody is right to.'], tunnel: ['In the Ocean Tunnel', 'You in blue light, looking up.' + extra], penguin: ['With the penguins', 'You crouch by the glass. A penguin waddles over and stands beside you like it was its idea.'] }[spotId] || ['Aquarium photo', 'Click.'];
  bubble(p, 'Say "sea cucumber"!'); flash(); const fresh = !S.photos[spotId]; S.photos[spotId] = (S.photos[spotId] || 0) + 1; need('fun', fresh ? 6 : 2); G.emit('aquarium:photo', spotId); toast(`${T[0]}: ${T[1]}${fresh ? ` (${Object.keys(S.photos).length}/3 photo spots)` : ''}`, 'good', 5200); return true;
}
function freeSeat(fx, sc) { for (const s of fx.seats || []) if (!sc.ents.some(e => e !== G.player && !e.hidden && Math.hypot(e.x - s.x, e.y - s.y) < .4)) return s; return null; }
function sketch(fx, sc) {
  if (G.busy) return false; const S = st(), s = freeSeat(fx, sc); if (!s) { toast('The sketching bench is full. Try again in a bit.', 'info'); return false; }
  const p = G.player, kit = !!safe(() => G.inv.count('mus_sketchkit') > 0 || G.inv.count('cons_sketchbook') > 0 || G.inv.count('aqua_book_sketch') > 0), mult = kit ? 1.25 : 1; p.poseOpts = { seated: true, item: 'book', itemColor: '#f4f0e8' }; bubble(p, 'The kelp will not hold still. Good.');
  G.startActivity({ label: 'Sketching the kelp forest', anim: 'read', minutes: SKETCH_MIN, rate: 5, at: { x: s.x, y: s.y, z: s.z || .45, dir: 3 }, tick: gm => { xp('creativity', gm * .95 * mult); need('fun', gm * .3); }, cancel: () => { p.poseOpts = null; },
    done: () => { p.poseOpts = null; S.sketches++; const lv = safe(() => G.skills.level('creativity')) || 1; if (S.sketches === 1) moodlet('inspired'); G.emit('aquarium:sketch', S.sketches); if (sc && sc.aq && sc.aq.sync) sc.aq.sync();
      toast((lv >= 6 ? 'A confident study: the garibaldi is just three strokes of orange and it is unmistakable.' : lv >= 3 ? 'Not bad at all: the kelp sways the right way and the rockfish looks suitably grumpy.' : 'Wobbly, but honest. You looked harder at a fish than you ever have.') + ' You pin a copy to the visitors\' board.', 'good', 5600); } });
  return true;
}
function lookBoard() { const n = st().sketches; toast(n ? `Visitor sketches. ${n === 1 ? 'Yours is' : 'The latest of your ' + n + ' are'} pinned in the middle, between a seahorse in crayon and somebody's very serious wolf eel.` : 'Visitor sketches: a seahorse in crayon, a very serious wolf eel. Sit on the orange bench in front of the kelp forest to add yours.', 'info', 4800); }
function sit(fx, sc, kind) {
  if (G.busy) return false; const S = st(), s = freeSeat(fx, sc); if (!s) { toast('Every seat is taken.', 'info'); return false; } const p = G.player; p.poseOpts = { seated: true };
  const jel = kind === 'jelly', deck = kind === 'deck', show = sc && sc.aq && sc.aq.show, talk = deck && show && show.otter, dive = kind === 'dive' && show && show.dive, pen = kind === 'penguin' && show && show.penguin; let heard = 0;
  if (dive && sc.aq.big) sc.aq.big.wave(8);
  G.startActivity({ label: jel ? 'Watching the jellies' : talk ? 'Watching the otter feeding' : dive ? 'Watching the dive show' : pen ? 'Watching the penguin feeding' : 'Sitting quietly', anim: 'sit', minutes: jel ? JELLY_MIN : talk || dive || pen ? 20 : 12, rate: jel ? 2.4 : talk || dive || pen ? 1.4 : 2, at: { x: s.x, y: s.y, z: s.z || .45, dir: s.dir === undefined ? 3 : s.dir },
    tick: gm => { need('fun', gm * (talk || dive || pen ? .9 : .4)); need('energy', gm * (jel ? .35 : .15)); if (talk || dive || pen) heard += gm; }, cancel: () => { p.poseOpts = null; },
    done: () => { p.poseOpts = null; S.sits++; G.emit('aquarium:sit', kind);
      if (jel) { S.jelly++; moodlet('jelly_calm'); stamp('x:aqua_jelly'); toast('Blue to violet to rose and back to blue. Somewhere in the second lap you stopped thinking about anything at all.', 'good', 5200); }
      else if (talk) { S.talks++; xp('logic', 14); need('social', 5); logIt('otter'); G.emit('aquarium:talk'); toast('The smallest otter cracks a clam on her chest with her own rock, looks straight at the stand, and gets a round of applause. You clap too.', 'good', 5600); }
      else if (dive) { S.waves++; xp('logic', 8); stamp('x:aqua_visit'); G.emit('aquarium:wave'); toast('The diver hangs upside down in front of your bench, waves with both hands, and writes HELLO on a slate. A cloud of yellow tangs photobombs it.', 'good', 5600); }
      else if (pen) { xp('logic', 8); logIt('penguin'); toast('Six penguins, one bucket, no table manners whatsoever. Admiral gets two and pretends he got none.', 'good', 5200); }
      else toast(pick(['You sit and watch the water move. Nobody hurries you.', 'A toddler presses both hands and a nose to the glass in front of you and says "fish". Fair.', 'The pumps hum. It is very easy to stay.']), 'good', 3800); } });
  return true;
}
function wave(sc) {
  sc = sc || scene(); const S = st(); if (!sc || !sc.aq || !sc.aq.big) return false;
  if (!sc.aq.big.diverOn()) { const nx = nextShow('dive'); toast(`The Big Blue: four metres of reef, and more yellow tangs than seems sensible. ${nx ? `A diver goes in at ${clock(nx)}.` : 'The diver goes in every day at 14:00.'}`, 'info', 4600); return false; }
  G.player.pose = 'wave'; setTimeout(() => { if (G.player.pose === 'wave') G.player.pose = null; }, 2200); sc.aq.big.wave(7); S.waves++; need('fun', 8); G.emit('aquarium:wave'); toast('You wave. The diver sees you, swims straight to the glass and waves back with both hands. Bubbles everywhere.', 'good', 4800); return true;
}
function talkKeeper(k, sc, kind) { if (kind === 'turtle') { const nt = nextShow('turtle'); bubble(k, sc && sc.aq && sc.aq.show.turtle ? 'The diver is in! Watch Moss: she always gets there first.' : nt ? `Turtle feeding and talk at ${clock(nt)}. Meanwhile there is lettuce at the end of the pier: hold a leaf out and wait.` : 'Feedings are at 10:45 and 15:00. There is lettuce at the end of the pier if you would like to try.', 4600); return; } const nx = nextShow('otter'); bubble(k, sc && sc.aq && sc.aq.show.otter ? 'Grab a seat in the stand! I am just getting to the good part.' : nx ? `Feeding and talk at ${clock(nx)}. The otters will tell you when: they start shouting.` : 'That was the last feeding today. One o\'clock and half past four, every day.', 4200); }
function talkLine(n, sc) { /* hook for the room: a line of the keeper talk was spoken */ if (n === 1 && scene() === sc) need('fun', 1); }
function scope() { const h = G.now().hf; need('fun', 2); toast(h < 7 || h > 19.5 ? 'Harbor lights, doubled in the water, and the lighthouse turning.' : pick(['Through the telescope: the cargo ship at anchor, a tug fussing round it, and gulls arguing on the Pier 7 roof.', 'You find the lighthouse, then the Bay Wheel, then a fisherman on the pier who has clearly caught nothing all day.', 'Out past the breakwater something dark rolls at the surface and is gone. A seal? You decide it was a whale.']), 'info', 4600); return true; }
function highFive(m) { const S = st(); S.five++; need('fun', S.five < 4 ? 4 : 1); bubble(m, pick(['*high five!*', '*Finn does a little dance*', '*Finn mimes swimming and points at the Big Blue*']), 2600); return true; }

/* ---------- Sleep with the Sharks ---------- */
function sleepover() {
  const S = st(); if (G.busy) return false; if (!sleepoverNow()) { toast('Sleeping bags come out once a month, on sleepover night.', 'info'); return false; }
  const n = G.now(), mins = Math.max(60, Math.round((n.hf >= SLEEPOVER.from ? 31 - n.hf : 7 - n.hf) * 60)), p = G.player; p.poseOpts = { blanket: '#3b6fd0' };
  toast('You wriggle into the sleeping bag. Above you a sand tiger slides past, slow as a cloud.', 'info', 4200);
  G.startActivity({ label: 'Sleeping with the sharks', anim: 'sleep', minutes: mins, rate: 60, at: { x: O + 11.8, y: O + 8.6, z: .05, dir: 0 }, tick: gm => { need('energy', gm * .2); }, cancel: () => { p.poseOpts = null; },
    done: () => { p.poseOpts = null; S.sleepovers++; moodlet('shark_sleeper'); stamp('x:aqua_sleep'); need('fun', 20); if (S.sleepovers === 1) safe(() => G.inv.add('aqua_sleepover_patch', 1)); G.emit('aquarium:sleepover'); toast(`Morning. The turtle is looking at you from a metre away, upside down.${S.sleepovers === 1 ? ' A keeper hands you cocoa and a sew-on patch: "Slept with the Sharks".' : ' Cocoa is by the stairs.'}`, 'good', 6500); } });
  return true;
}

/* ---------- Dr. Reyes and the turtle ---------- */
const goalText = () => { const c = st().chain; return c.st === 1 ? `Look after ${c.name} behind the scenes at the aquarium (${c.days}/${CARE_DAYS} days)` : c.st === 2 ? `Tell Dr. Reyes that ${c.name} is ready` : `Release ${c.name} at Gull Point Beach`; };
function setGoal() {
  const c = st().chain; if (!G.goals) return;
  if (c.st >= 1 && c.st <= 3) { const g = G.goals.get(GOAL); if (g) { g.text = goalText(); g.placeId = 'aquarium'; G.emit('goals:change'); } else safe(() => G.goals.add({ id: GOAL, text: goalText(), group: 'opportunity', placeId: 'aquarium', hint: 'A green sea turtle was cut out of a fishing net off Pier 7. Dr. Reyes needs a volunteer for three mornings: go through the STAFF door in Local Waters, prepare her food at the prep bench, feed her at the rehab pool, then check her flipper. One session a day. When she is strong enough she goes back to the bay at Gull Point Beach, at the west end of the boardwalk.' })); }
  else if (c.st === 4) safe(() => { if (G.goals.get(GOAL) && !G.goals.isDone(GOAL)) G.goals.complete(GOAL); });
}
function talkAquarist(a) {
  const c = st().chain, w = 'Dr. Reyes, head aquarist';
  if (c.st === 0) say([{ who: w, text: pick(['You have the look of somebody who reads every plaque. Good. I need one of those.', 'Do you have steady hands and three free mornings? That is not a normal question, I know.']) }, { who: w, text: 'A trawler cut a green sea turtle out of a ghost net off Pier 7 last week. Young female. One front flipper is badly chafed and she has not been eating.' }, { who: w, text: 'She is in the rehab pool behind that staff door. Three days of proper feeding and she can go home. My keepers are stretched thin with the penguin chicks. Would you help?' }])
    .then(() => choose('Volunteer to care for the turtle?', [{ label: 'Yes. Show me what to do', value: 1 }, { label: 'Not just now', value: 0 }])).then(v => { if (v !== 1) { bubble(a, 'Of course. She is not going anywhere. Yet.'); return null; } return choose('She needs a name for the chart', TURTLE_NAMES.map(n => ({ label: n, value: n })), { text: '"Keepers are superstitious. Nothing gets better until it has a name."' }); })
    .then(nm => { if (!nm) return; c.st = 1; c.name = nm; c.days = 0; c.step = 0; c.lastDay = -1; setGoal(); G.emit('aquarium:chain', 1); bubble(a, `${nm}. Good. The staff door is behind me.`); toast(`New opportunity: look after ${nm}. Go through the STAFF door in Local Waters. Each day: prepare her food, feed her, check her flipper. Three days and she can be released.`, 'good', 6500); });
  else if (c.st === 1) say([{ who: w, text: c.days ? `${c.days} day${c.days > 1 ? 's' : ''} down. ${c.name} ate everything yesterday and then splashed the technician, which I take as a good sign.${c.lastDay === G.now().day ? ' That is all for today: come back tomorrow.' : ' She is waiting for breakfast.'}` : `${c.name} is through the staff door. Prep bench first, then the pool. She likes her squid cut small.` }]);
  else if (c.st === 2) say([{ who: w, text: `I read the chart. Full weight, flipper healed, and she tried to climb out of the pool this morning. ${c.name} is ready.` }, { who: w, text: 'We release where the water is quiet: Gull Point Beach, at the west end of the boardwalk, past the fish market. I will have her down there in a crate. Meet me any time in daylight. People tend to turn up for these.' }])
    .then(() => { c.st = 3; setGoal(); G.emit('aquarium:chain', 3); safe(() => { const n = G.now(), t = (n.hf < 16 ? n.day : n.day + 1) * DAY + (n.hf < 16 ? Math.ceil(n.hf + 1) : 10) * 60; G.planner.add({ title: `Release ${c.name} at Gull Point Beach`, placeId: 'aquarium', t, dur: 60, kind: 'event', data: { aquaRelease: 1 } }); }); const cs = safe(() => G.sceneCache.get('city')); if (cs) relSync(cs); toast(`${c.name} is going home. Meet Dr. Reyes at Gull Point Beach (west end of the harbor boardwalk) in daylight.`, 'good', 6000); });
  else if (c.st === 3) say([{ who: w, text: `${c.name} is in her crate and not happy about it. Gull Point Beach, west end of the boardwalk. I am heading down now.` }]);
  else say([{ who: w, text: pick([`A fishing boat radioed in a green turtle with a healed flipper off the lighthouse last week. I am choosing to believe it was ${c.name}.`, 'Your plaque is in the hall. Children stop and read it out loud. I have seen two of them salute.', 'The rehab pool is empty this week. That is the best thing I can say about any week.']) }]);
}
function care(what, fx, sc) {
  const c = st().chain, today = G.now().day; if (G.busy) return false;
  if (c.st !== 1) { toast(what === 'prep' ? 'Squid, clam, a vitamin tablet hidden in a prawn. The prep bench is spotless.' : c.st >= 4 ? `The rehab pool is empty and very clean. A note on the rim: "${c.name}: released. Next patient: none. Long may it last."` : c.st >= 2 ? `${c.name} paddles a fast lap and slaps the water with a healed flipper. She is ready.` : 'A round blue pool, humming quietly.', 'info', 4800); return false; }
  if (c.lastDay === today) { toast(`${c.name} has been fed and checked today. She surfaces, looks at you, and goes back to sulking handsomely. Come back tomorrow.`, 'info', 4600); return false; }
  const stepWant = what === 'prep' ? 0 : c.step === 1 ? 1 : 2;
  if (what === 'prep' && c.step !== 0) { toast('Breakfast is already made. Take it to the rehab pool.', 'info'); return false; }
  if (what === 'pool' && c.step === 0) { toast(`${c.name} watches you from the bottom of the pool. She would like breakfast first: the prep bench is on the left.`, 'info', 4200); return false; }
  const L = [['Preparing breakfast', 'work', 6, `Squid cut small, two clams, and the vitamin tablet hidden in a prawn. Take it to the pool.`], [`Feeding ${c.name}`, 'work', 6, c.days === 0 ? `${c.name} ignores the first piece, considers the second, and takes the third so fast you nearly lose the tongs.` : c.days === 1 ? `${c.name} is waiting at the edge before you get there. She eats the lot, vitamin prawn included.` : `${c.name} eats everything, then swims a lap and splashes you on purpose.`], ['Checking her flipper', 'work', 5, c.days === 0 ? 'The chafed flipper is raw, but clean. You dab on the ointment and log her weight on the chart.' : c.days === 1 ? 'New skin on the flipper, and she pushes hard against your hand. You log her weight: up.' : 'The flipper is healed. She pushes off your hand like a swimmer off a wall. Weight: perfect.']][stepWant];
  if (stepWant >= 1 && sc && sc.aq && sc.aq.turtle && fx) sc.aq.turtle.target = { x: fx.x, y: fx.ob.B[4] - 1 };
  G.startActivity({ label: L[0], anim: L[1], minutes: L[2], rate: 1.2, cancel: () => { if (sc && sc.aq && sc.aq.turtle) sc.aq.turtle.target = null; }, done: () => {
    if (sc && sc.aq && sc.aq.turtle) sc.aq.turtle.target = null; c.step = stepWant + 1; xp(stepWant === 0 ? 'cooking' : 'logic', 6); need('fun', 4); G.emit('aquarium:care', c.days, stepWant);
    if (c.step >= 3) { c.step = 0; c.days++; c.lastDay = today; if (c.days >= CARE_DAYS) { c.st = 2; G.emit('aquarium:chain', 2); } setGoal(); if (sc && sc.aq && sc.aq.sync) sc.aq.sync(); toast(`${L[3]} ${c.st === 2 ? `That is day ${CARE_DAYS}: the chart is full. Tell Dr. Reyes.` : `Day ${c.days} of ${CARE_DAYS} done. Same again tomorrow.`}`, 'good', 6500); }
    else toast(L[3], 'good', 4800); } });
  return true;
}
function lab(kind) { need('fun', 1); toast({ scope: 'Under the microscope: a drop of tank water, alive with things that look like spaceships. One of them eats another one. You step back.', nursery: 'The jelly nursery: two jars of moon-jelly polyps, each the size of a grain of rice, pulsing in time like a very small orchestra.', rack: 'Quarantine tanks. New arrivals wait here thirty days before they meet the neighbours. A cardinalfish stares at you with open suspicion.' }[kind] || 'Humming equipment.', 'info', 5000); return true; }
function chart() { const c = st().chain; toast(c.st === 0 ? 'A whiteboard: weights, feeding times, a drawing of a turtle with a bandage.' : c.st >= 4 ? `"${c.name}: RELEASED, Gull Point Beach." Somebody has drawn a small heart and then tried to rub it out.` : `${c.name}'s chart: ${c.days} of ${CARE_DAYS} days ticked. Weight ${['low', 'climbing', 'nearly there', 'perfect'][Math.min(3, c.days)]}. Flipper ${['chafed', 'healing', 'new skin', 'healed'][Math.min(3, c.days)]}.`, 'info', 4800); return true; }
function readPlaque() { const c = st().chain; say([{ who: 'Bronze plaque', text: `${c.name || 'A green sea turtle'}. Cut from a ghost net off Pier 7, nursed at this aquarium, and released at Gull Point Beach by ${who()}. "They always look back once."` }]); return true; }

/* ---------- guide wiring ---------- */
function patchGuide() {
  const e = safe(() => G.guide.get('place:aquarium')); if (!e) return;
  e.blurb = CORE_BLURB.aquarium; e.price = `${fmt(AQ_TICKET)} day ticket · ${fmt(AQ_PASS)} annual pass · hall, shop and cafe free`; e.type = 'Aquarium'; e.chapter = 'sights'; e.also = ['outdoors', 'eat', 'shop']; const T = ['aquarium', 'sharks', 'jellyfish', 'penguins', 'otters', 'kids', 'cafe', 'rainy day']; e.tags = (e.tags || []).filter(t => !T.includes(t)).concat(T);
  e.tryThis = ['Spot a shark overhead in the Ocean Tunnel', 'Sit and watch the jellyfish change colour', 'Touch a sea star at the touch pool', 'Feed the rays at Ray Bay', `Wave to the diver at ${clock(14)}`, 'Feed a penguin at 11:30 or 15:30', 'Otter feeding on the Harbor Deck at 13:00 and 16:30', 'Fill the species logbook', 'Adopt a penguin', 'Ask Dr. Reyes about the turtle'];
  e.when = `Daily ${clock(9)} - ${clock(18)} · Thursdays to ${clock(LATE.to)} · sleepover night on day ${SLEEPOVER.day} of each season`;
}

export function init() {
  S = G.defineState('aquarium', () => ({ ticketDay: -9, visits: 0, log: {}, zones: {}, touch: {}, rays: 0, rayTouch: 0, penguinFed: 0, photos: {}, quiz: { best: 0, badge: false }, sketches: 0, sits: 0, jelly: 0, adopt: null, waves: 0, talks: 0, sleepovers: 0, five: 0, chain: { st: 0, name: '', days: 0, lastDay: -1, step: 0 } }));
  G.on('load', () => { st(); setGoal(); if (relStuff && !relStuff.running) clearRel(); const cs = safe(() => G.sceneCache.get('city')); if (cs) relSync(cs); const sc = scene(); if (sc && sc.aq && sc.aq.sync) sc.aq.sync(); });
  G.aquarium = {
    isOpen, hours, lateNow, sleepoverNow, ticket: AQ_TICKET, pass: AQ_PASS, hasTicket, hasPass, buyTicket, buyPass, desk, arrived, travel, spot, logbook,
    species: () => Object.keys(SPECIES).map(id => ({ id, zone: SPECIES[id].zone, name: SPECIES[id].name, got: st().log[id] !== undefined })),
    plaque, touch, touchGame, touchState: () => (tg ? { want: tg.seq[tg.i], i: tg.i, miss: tg.miss } : null), feedTurtle, talkDone, photoMode: { open: photoOpen, snap: photoSnap, close: photoClose, state: () => (pm ? inShot(pm.sc) : null) }, touchRay, feedRays, penguins, feedPenguin, adopt, adopted, quiz, photo, sketch, lookBoard, sit, wave,
    shows: { list: showList, next: nextShow, plan: planShow, start: (id, sec) => { const sc = scene(); return !!(sc && sc.aq && sc.aq.force && sc.aq.force(id, sec || 90)); }, state: () => { const sc = scene(); return sc && sc.aq && sc.aq.show ? Object.assign({}, sc.aq.show) : null; } },
    showsBoard, talkKeeper, talkLine, scope, highFive, sleepover, talkAquarist, chain: () => st().chain, care, lab, chart, readPlaque, release, releaseSpot: () => (relPoi ? { x: relPoi.x, y: relPoi.y, ready: !!relStuff } : null), door: () => door,
    stats: () => { const S = st(); return { visits: S.visits, spotted: Object.keys(S.log).length, zones: Object.keys(S.zones).length, touch: Object.keys(S.touch).length, rays: S.rays, rayTouch: S.rayTouch, penguinFed: S.penguinFed, photos: Object.keys(S.photos).length, quiz: S.quiz.best, sketches: S.sketches, sits: S.sits, jelly: S.jelly, adopt: S.adopt && S.adopt.name, waves: S.waves, talks: S.talks, turtleFed: S.turtleFed || 0, bestShot: S.bestShot || 0, touchGame: S.touchGame || 0, sleepovers: S.sleepovers, chain: S.chain.st, days: S.chain.days }; },
  };
  G.on('room:build', sc => {
    if (!sc || !sc.def || sc.def.showpiece !== 'aquarium') return; if (!built) safe(() => ensure(getCity()));
    if (sc.roomId === 'aquarium:deep') sc.interactables.push({ x: O + 11.8, y: O + 8.6, label: 'Your sleeping bag', h: .4, hit: 12, range: 1.2, spot: { x: O + 11.8, y: O + 9.4 }, visible: () => sleepoverNow(), use: () => sleepover() });
  });
  G.on('scene', s => { if (!s || s.id !== 'city' || !s.world) return; if (!s._aquarium) { s._aquarium = true; try { ensure(s.world); } catch (e) { console.warn('aquarium', e); } setGoal(); } try { relSync(s); } catch (e) { console.warn('aquarium', e); } });
  G.on('guide:rebuilt', patchGuide);
  G.on('scene', sc2 => { photoClose(); tg = null; if (!sc2 || !sc2.def || sc2.def.showpiece !== 'aquarium') lastRoom = null; });
  G.on('minutes', () => { const sc = scene(); if (!sc || G.busy || G.modal || G.cutscene) return; const h = G.now().hf, hr = hours(); if (!sleepoverNow() && (h >= hr[1] + .33 || h < hr[0] - 1)) { if (sc._closing) return; sc._closing = true; toast(h < 12 ? 'The night is over: a keeper with a cocoa urn walks the last sleepers out into the morning on the boardwalk.' : '"We are closing now. The sharks say goodnight." A keeper walks you out to the boardwalk.', 'info', 4400); exitRoom({ poi: DOOR }).then(() => { sc._closing = false; }, () => { sc._closing = false; }); } });
}
