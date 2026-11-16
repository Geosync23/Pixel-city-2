// Real venue restrooms (owner msgs 151 + 192, BIBLE Direction update 28): a venue's "Restroom" door leads INTO a drawn room (no more fade-out relief there).
// Inside: toilet stalls (walk up, "Toilet": the existing use_toilet activity via G.bladder.useToilet, the door shuts and you are hidden behind it),
// a basin ("Wash hands": bladder.js's sink handler), and the way back, which lands you at the door you came in by. Leaving with unwashed hands is allowed;
// a one-line nudge shows once per visit. Rooms + venues: src/scenes/rooms/restrooms.js (WC); art: src/art/venue/restrooms_art.js; plan: docs/reports/bathrooms.md.
//
// How a venue gets its real restroom (on 'room:build', before bladder.js adds its own door):
//   - restroom interactables the venue already has (lobby.restroom fixtures, e.g. City Hall's rotunda) are rerouted into the room;
//   - otherwise the WC entry's `door` is placed (furn.wc.door) with a "Restroom" interactable; scene._wc = 'real' so bladder.js adds nothing more.
//   Rooms of a venue without a WC entry keep bladder.js's behaviour (the later batches add entries; no other file needs to change).
//
// G.restrooms = {
//   list() -> [{ venue, id, name }]          has(venueRoomId) -> bool          roomOf(venueRoomId) -> wc room id | null
//   enter(venueRoomId, from? {x, y, dir}) -> Promise      leave() -> Promise       (from = where to land on the way back; default: where the player stands)
// }
// State G.state.restrooms = { back: { venue, x, y, dir } | null, visits: { [wcId]: n } }.   Events: 'restroom:enter'(wcId), 'restroom:leave'(wcId, { washed })
// Fixture tags: wcstall (toilet stall: "Toilet"), wcmints (SkyDeck: "Take a mint"), wcsuggest (City Hall: "Suggestion box"); basins use the existing `sink` tag.
// Navigation: the "find a restroom" need goal (navgoals 'need') is extended by resolver 'wc' (prio 31): in a venue with a real restroom it marks the door,
// inside it marks a free stall and ends when you sit down. Room links are added to G.navGoals.graph (venue <-> wc room).
import { G } from '../core/game.js';
import { ROOMS, defineRoom, registerFixture } from '../scenes/interior.js';
import { asset } from '../art/registry.js';
import { toast, say } from '../ui/kit.js';
import { WC } from '../scenes/rooms/restrooms.js';

export const order = 134;   // before bladder.js (135): its 'room:build' handler must see scene._wc already set
const O = 1;
const BY_VENUE = new Map(WC.map(w => [w.venue, w])), BY_ID = new Map(WC.map(w => [w.id, w]));
const safe = (f, d) => { try { const v = f(); return v === undefined || v === null ? d : v; } catch (e) { return d; } };
const rid = () => (G.scene && /^int:/.test(G.scene.id) ? G.scene.id.slice(4) : null);
let S = null, going = false, visit = null;   // visit = { id, nudged } for the stay in progress

/* ---------- the rooms ---------- */
for (const w of WC) defineRoom(Object.assign({ id: w.id, wc: w.venue, noCrowd: true }, w.def, { exits: w.def.exits.map(e => Object.assign({ label: w.back, use: () => leave() }, e)) }));

/* ---------- in and out ---------- */
function enter(venue, from) {
  const w = BY_VENUE.get(venue); if (!w || going || G.busy) return Promise.resolve(false);
  const p = G.player, f = from || { x: p.x, y: p.y, dir: p.dir };
  S.back = { venue, x: f.x, y: f.y, dir: f.dir === undefined ? 1 : f.dir }; S.visits[w.id] = (S.visits[w.id] || 0) + 1; visit = { id: w.id, nudged: false };
  going = true; return G.go('int:' + w.id, { wc: true }).then(() => { G.emit('restroom:enter', w.id); return true; }).finally(() => { going = false; });
}
function leave() {
  const w = BY_ID.get(rid()); if (!w || going) return Promise.resolve(false);
  const B = G.state.bladder || {}, unwashed = !!B.unwashed && G.state.t - B.unwashed < 60;
  if (unwashed && (!visit || !visit.nudged)) { if (visit) visit.nudged = true; toast('Off without washing your hands? The basin is right there. (Your call.)', 'info', 3400); }
  const b = S.back && S.back.venue === w.venue ? S.back : null; S.back = null; visit = null;
  G.emit('restroom:leave', w.id, { washed: !unwashed });
  going = true; return G.go('int:' + w.venue, Object.assign({ wc: true }, b ? { x: b.x, y: b.y, dir: b.dir } : {})).finally(() => { going = false; });
}

/* ---------- the venue side: its door ---------- */
function wireVenue(scene, w) {
  const go = it => () => { const s = it.spot || { x: it.x, y: it.y }, dir = Math.abs(s.y - it.y) >= Math.abs(s.x - it.x) ? 1 : 0; return enter(w.venue, { x: s.x, y: s.y, dir }); };
  let n = 0;
  for (const it of scene.interactables) if (it.restroom) { it.use = go(it); it.navTo = 'int:' + w.id; it.wc = w.id; n++; }
  if (!n && w.door) {
    const d = w.door, W = scene.world; let a = null; try { a = asset('furn.wc.door'); } catch (e) { a = null; }
    if (a) W.place(a, O + d.x, O + d.y, { p: { style: d.style }, z: 0, flip: !!d.flip, solid: false });
    const it = { x: d.flip ? O + d.x + .1 : O + d.x + .5, y: d.flip ? O + d.y + .5 : O + d.y + .1, h: 1.7, hit: 16, spot: { x: O + d.spot.x, y: O + d.spot.y }, label: 'Restroom', restroom: true, navTo: 'int:' + w.id, wc: w.id };
    it.use = go(it); scene.interactables.push(it);
  }
  scene._wc = 'real';
}

/* ---------- inside: stalls, mints, suggestions ---------- */
const occ = (fx, on) => { if (!fx || !fx.ob) return; fx.ob.p = Object.assign({}, fx.ob.p, { occ: on ? 1 : 0 }); fx.ob._key = null; if (fx.ob.world) fx.ob.world.version++; };
function useStall(fx) {
  if (!G.bladder || !G.needs) return null;
  if (G.needs.get('bladder') >= 92) { toast('You do not need to go right now.', 'info', 2200); return null; }
  const act = G.bladder.useToilet(fx); if (!act) return null;
  G.player.hidden = true; occ(fx, true);
  const un = G.on('activityEnd', a => { if (a !== act) return; occ(fx, false); un(); });   // done or cancelled: the door opens again
  return act;
}
const MINT = ['A mint from the little silver dish. Cool, sharp, very level 52.', 'Another mint. Nobody is counting. Probably.', 'A mint. Your breath now matches the view.'];
const CARDS = [
  ['A card in the suggestion box', '"More hooks in the stalls. I had to hold my umbrella the whole time." — A.'],
  ['A card in the suggestion box', '"The first mayor\'s portrait watches you wash. I have never washed so thoroughly." — anon.'],
  ['A card in the suggestion box', '"Best restroom in the city. Don\'t tell the library." — a librarian'],
  ['A card in the suggestion box', '"Please keep the chain flush. My grandad pulled it in 1952 and so did I." — R.T.'],
  ['A card in the suggestion box', '"Can the fountain outside be fixed like these taps were?" — Every citizen'],
];
let mintN = 0;

/* ---------- navigation: venue door -> stall ---------- */
function nav() {
  const N = G.navGoals; if (!N || N._wcDone) return; N._wcDone = true;
  const gr = safe(() => N.graph, null); if (gr) for (const w of WC) gr.push(['int:' + w.venue, /^Restroom$/, 'int:' + w.id], ['int:' + w.id, /^Back to /, 'int:' + w.venue]);
  if (N.define) N.define('wc', 'default', 31, ctx => {
    const s = ctx.sel; if (!s || s.need !== 'bladder') return null; const r = rid(); if (!r) return null;
    if (G.busy && /toilet/i.test((G.busy.actId || '') + ' ' + (G.busy.label || ''))) return { done: true, quiet: 1 };
    const inWc = BY_ID.get(r), inVenue = BY_VENUE.get(r);
    if (inWc) return { room: inWc.id, find: { label: /^Toilet$/ }, label: 'A free stall', short: 'a free stall', name: inWc.def.name };
    if (inVenue) return { room: inVenue.venue, find: { label: /^Restroom$/ }, label: 'The restroom', short: 'the restroom', name: safe(() => ROOMS.get(inVenue.venue).name, 'the restroom') };
    return null;
  }, (ctx, s) => s && s.need === 'bladder');
}

export function init() {
  S = G.defineState('restrooms', () => ({ back: null, visits: {} }));
  G.on('load', () => { S = G.state.restrooms && typeof G.state.restrooms === 'object' ? G.state.restrooms : (G.state.restrooms = { back: null, visits: {} }); if (!S.visits) S.visits = {}; visit = null; going = false; });
  G.on('room:build', scene => { try { const w = BY_VENUE.get(scene.roomId); if (w) wireVenue(scene, w); } catch (e) { console.warn('restrooms: ' + e.message); } });
  registerFixture('wcstall', fx => ({ label: 'Toilet', toilet: true, guestOk: true, hit: 16, use: () => useStall(fx) }));
  registerFixture('wcmints', () => ({ label: 'Take a mint', hit: 10, use: () => { toast(MINT[mintN++ % MINT.length], 'good', 2600); } }));
  registerFixture('wcsuggest', () => ({ label: 'Suggestion box', hit: 14, use: () => say([{ who: CARDS[mintN % CARDS.length][0], text: CARDS[mintN++ % CARDS.length][1] }]) }));
  /* the SkyDeck view through the restroom window follows the clock like the deck's own glass */
  G.on('room:enter', sc => { if (!sc || sc.roomId !== 'skydeck:wc') return; const v = safe(() => G.showpieces.skydeck.viewNow(), 'day'); for (const o of sc.world.objs) if (o.data && o.data.sky && o.p.time !== v) { o.p = Object.assign({}, o.p, { time: v }); o._key = null; } sc.world.version++; });
  nav(); G.on('ready', nav);
  G.restrooms = { list: () => WC.map(w => ({ venue: w.venue, id: w.id, name: w.def.name })), has: v => BY_VENUE.has(v), roomOf: v => (BY_VENUE.get(v) || {}).id || null, enter, leave };
}
