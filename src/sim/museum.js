// Museum of Maple Bay — city entrance, tickets + membership, the collection logbook, activities, guided tours, the curator's opportunity and guide wiring.
// Room: scenes/rooms/museum.js (room id 'museum'). Data: data/museum.js. Art: art/showpiece/museum.js, museum_ext.js, _mus_lib.js (pictures), _mus_icons.js.
//
// City (once per city world, before places / stalls / addresses build — order 57): the building `bld.arts.museum2` and its door poi `door:museum` come from world/_blocks.js;
//   this module adds the opening-hours check to the door and three "lost object" spots (pois `lost:0..2`, type 'museum', glow) with an old box each, beside benches around town.
//   G.places id 'museum'. Hours 10:00-18:00, Fridays to 21:00. Hall, cafe and shop are free; the four wings need a $6 day ticket, a $40 membership
//   (G.state.flags.museum_member = free for life) — or come on Friday after 17:00, when everything is free.
// G.museum = {
//   isOpen(), hours() -> [open, close] today, ticket, member, freeNow(), hasTicket(), isMember(), buyTicket() -> bool, buyMembership() -> bool, desk() (info desk menu), arrived(scene),
//   look(exId) -> Promise (read an exhibit / open a picture; exId 'p:<picture>' for paintings and photographs), exName(exId), logbook() -> { wing: { name, got, of, need, stamp } }, exhibits() -> [{ id, wing, name, got }],
//   audio: { has(), rent() -> bool, got() -> [n] }, listen(n), hunt: { start(), state() -> { on, got, of, done, claimed }, clues() -> [{ clue, got }], claim() },
//   dig(fx?, scene?) -> Promise<fossilId | null>, digging: { brush(x, y, r?), auto(), state() }, fossils() -> [{ id, name, note, n }],
//   sketch(fx, scene), sketches() -> [picture ids], lookBoard(), sit(fx, scene), donate(amount?) -> Promise, donated(), photo(spot), model(scene, district?), cloak(),
//   tour: { times, next() -> hour | null, start() (private / debug), join(), state(), plan() (adds the next one to the planner) }, talkDocent(char, tour), tourDone(tour),
//   talkCurator(char), chain() -> { st: 0 none | 1 looking | 2 found all | 3 done, got }, lost() -> [{ i, name, x, y, got }], takeLost(i), foundDone(), door(), stats(), closeViewer() }
// State: G.state.museum = { ticketDay, visits, log: { exId: day }, wings: { wing: day }, audioDay, audio: { n: 1 }, audioDone, hunt: { on, got: {}, done, claimed }, fossils: { id: n }, digs,
//                           sketches: [picture id], sits, donated, photos: { spot: n }, tours, cloakDay, chain: { st, got } }
// Events: 'museum:visit'(first), ':ticket'(kind), ':look'(exId, fresh), ':wing'(wingId), ':audio'(n, count), ':hunt'(clueId, count), ':huntdone', ':dig'(fossilId, fresh), ':sketch'(pictureId, n), ':sit', ':donate'(amount, total),
//         ':photo'(spot), ':model'(district), ':tourstart', ':tourstop'(zone), ':tour'(stops), ':lost'(i, n), ':chain'(st), ':cloak'.
// Guide stamps: x:mus_visit, x:mus_dig, x:mus_sketch, x:mus_wings, x:mus_hunt.   Activity ids (guide): mus_dig, mus_look, mus_sketch, mus_audio, mus_hunt, mus_model, mus_tour, mus_photo, mus_donate.
// Tuning: MUS_TICKET 6, MUS_MEMBER 40, MUS_AUDIO 3 (data/museum.js); SKETCH_MIN 40; DIG_MIN 15; wing stamps need 6 / 10 / 6 / 3 exhibits; closing walk-out 20 min after closing.
import { G } from '../core/game.js';
import { el, root, toast, bubble, say, choose, modal } from '../ui/kit.js';
import { exitRoom } from '../scenes/interior.js';
import { ITEM_BY_ID } from '../data/items.js';
import { MOODLETS } from '../data/needs.js';
import { MUS_HOURS, MUS_TICKET, MUS_MEMBER, MUS_AUDIO, FREE_EVE, TOUR_TIMES, MUS_VENUES, MUS_VIS, WINGS, EXHIBITS, SPECIALS, SPECIAL_EX, AUDIO, HUNT, FOSSILS } from '../data/museum.js';
import { pic, pencil, PAINTINGS } from '../art/showpiece/_mus_lib.js';
import { MUS_ICONS } from '../art/showpiece/_mus_icons.js';
import { ICONS } from '../art/icons/icons.js';
import { VIS } from './housing.js';
import { CORE, CORE_BLURB, EXPERIENCES } from './_guide_data.js';
import { getCity } from '../world/_city.js';

export const order = 57;
Object.assign(VIS, MUS_VIS); for (const k in MUS_ICONS) if (!ICONS[k]) ICONS[k] = MUS_ICONS[k];
const NAME = 'Museum of Maple Bay', DOOR = 'door:museum', SKETCH_MIN = 40, DIG_MIN = 15, DAY = 1440;
CORE.museum = ['arts', 'Museum', 'mask', ['sights', 'eat', 'shop']];
CORE_BLURB.museum = 'The limestone hall with the copper dome at the head of Maple Avenue. Marge the tyrannosaur under a hanging whale, minerals that glitter, a fossil pit you can dig in, twenty-two paintings, the story of the city with a lit model of every street, and a special exhibition that changes with the season. Free on Friday evenings.';
for (const x of [
  { id: 'x:mus_visit', title: 'Meet Marge', group: 'Big days out', glyph: 'mask', place: 'place:museum', need: 'museum', blurb: 'Buy a ticket (or come on a free Friday evening) and stand under sixty-six million years of teeth.' },
  { id: 'x:mus_dig', title: 'Dig Up a Fossil', group: 'Big days out', glyph: 'mask', place: 'place:museum', need: 'museum', blurb: 'Take a brush to the dig pit in Natural History. The stone lets go when it is ready.' },
  { id: 'x:mus_sketch', title: 'Sketch a Masterpiece', group: 'Big days out', glyph: 'mask', place: 'place:museum', need: 'museum', blurb: 'Sit on a gallery bench in the Art Wing and draw what you see. Yours goes on the visitors\' board.' },
  { id: 'x:mus_wings', title: 'Fill the Logbook', group: 'Big days out', glyph: 'mask', place: 'place:museum', need: 'museum', blurb: 'Earn the stamp of all four wings: Natural History, Art, City History and the Special Exhibition.' },
  { id: 'x:mus_hunt', title: 'Junior Curator', group: 'Big days out', glyph: 'mask', place: 'place:museum', need: 'museum', blurb: 'Solve all eight clues on the scavenger hunt card and claim your badge at the desk.' },
]) if (!EXPERIENCES.some(e => e.id === x.id)) EXPERIENCES.push(x);

const LOST = [
  { name: "the cannery's steam whistle", short: 'Cannery whistle', where: 'down by the harbour, where the cannery stood', d: ['harbor', 'oldtown'], found: 'Under a coil of rope: a brass steam whistle, green with age, stamped MAPLE BAY CANNERY 1911. You give it a careful breath. It still has opinions.' },
  { name: "the stationmaster's lantern", short: "Stationmaster's lantern", where: 'near the railway, around the rail yard or downtown', d: ['railyard', 'downtown'], found: 'Wrapped in a 1962 newspaper: a red signal lantern with a brass plate, "Depot No. 4". The night the last tram ran, somebody took it home.' },
  { name: "the airmail pilot's goggles", short: "Airmail pilot's goggles", where: 'out east, in Maplewood or by the airport', d: ['maplewood', 'airport', 'hillcrest'], found: 'In a biscuit tin: cracked leather flying goggles, and inside the strap, in ink, "J. Achebe". Josephine flew the first airmail out of Bay Airfield.' },
];
let S = null, built = null, door = null, viewer = null, digRun = null; const lost = [];
const st = () => { S = G.state.museum || (G.state.museum = {}); for (const [k, v] of [['log', {}], ['wings', {}], ['audio', {}], ['hunt', { on: false, got: {} }], ['fossils', {}], ['sketches', []], ['photos', {}], ['chain', { st: 0, got: {} }]]) if (!S[k]) S[k] = v; if (!S.chain.got) S.chain.got = {}; if (!S.hunt.got) S.hunt.got = {}; for (const k of ['visits', 'digs', 'sits', 'donated', 'tours']) S[k] = S[k] || 0; for (const k of ['ticketDay', 'audioDay', 'cloakDay']) if (S[k] === undefined) S[k] = -1; return S; };
const fmt = n => (G.money && G.money.fmt ? G.money.fmt(n) : '$' + n);
const safe = fn => { try { return fn(); } catch (e) { return undefined; } };
const stamp = id => safe(() => G.guide && G.guide.stamp && G.guide.stamp(id));
const clock = h => String(Math.floor(h)).padStart(2, '0') + ':' + String(Math.round((h % 1) * 60)).padStart(2, '0');
const pick = a => a[Math.floor(Math.random() * a.length)];
const hours = () => MUS_HOURS(G.now().weekday);
const isOpen = () => { const h = G.now().hf, hr = hours(); return h >= hr[0] && h < hr[1]; };
const freeNow = () => { const n = G.now(); return n.weekday === FREE_EVE.weekday && n.hf >= FREE_EVE.from && n.hf < 21; };
const isMember = () => !!(G.state.flags && G.state.flags.museum_member);
const hasTicket = () => isMember() || st().ticketDay === G.now().day || freeNow();
const scene = () => (G.scene && G.scene.roomId === 'museum' ? G.scene : null);
const season = () => (G.now().season === undefined ? 0 : (typeof G.now().season === 'number' ? G.now().season : ['spring', 'summer', 'autumn', 'winter'].indexOf(String(G.now().season.id || G.now().season).toLowerCase()))) & 3;
const who = () => (G.state.player && G.state.player.name) || 'a friend of the museum';

/* ---------- city: door hours + the three lost objects ---------- */
function ensure(w) {
  if (built === w || !w || !Array.isArray(w.objs)) return; built = w; lost.length = 0;
  door = w.pois.find(p => p.id === DOOR); if (!door) return;
  door.onUse = () => { if (isOpen()) return false; const hr = hours(); toast(`${NAME}: closed. Open daily ${clock(10)} to ${clock(18)}, Fridays until ${clock(21)}${G.now().hf < hr[0] ? '' : '. Marge needs her sleep'}.`, 'info', 4200); return true; };
  // a paved apron from the steps to the Campus Drive sidewalk (a ground decal only: tile types, occupancy and nav are untouched)
  safe(() => { w.decal({ x0: 262, y0: 53, x1: 270, y1: 54, draw(Rr, zAt) { Rr.qz(262.5, 269.5, 53, 54, zAt(266, 53.5), (x, y) => { const fx = x - Math.floor(x), fy = (y * 2) - Math.floor(y * 2); return fx < .06 || fy < .1 ? '#b0a892' : (Math.floor(x) + Math.floor(y * 2)) & 1 ? '#d8d0bc' : '#cec6b0'; }); } }); w.version++; });
  const benches = w.pois.filter(p => p.type === 'bench' && isFinite(p.x)).sort((a, b) => (a.y * 1000 + a.x) - (b.y * 1000 + b.x)), used = w.pois.filter(p => /^cutting:/.test(String(p.id || ''))), dOf = p => (w.districtAt ? w.districtAt(p.x, p.y) : null);
  LOST.forEach((c, i) => {
    let poi = w.pois.find(p => p.id === 'lost:' + i);
    if (!poi) {
      const far = b => Math.hypot(b.x - door.x, b.y - door.y) > 40 && !used.some(u => Math.hypot(u.x - b.x, u.y - b.y) < 24); let cand = benches.filter(b => c.d.includes(dOf(b)) && far(b)); if (!cand.length) cand = benches.filter(far);
      const b = cand[Math.floor(cand.length * (.43 + i * .17)) % Math.max(1, cand.length)]; if (!b) return; used.push(b); let sp = null;
      for (const r of [2, 2.5, 1.5, 3, 3.5]) { for (let k = 0; k < 8 && !sp; k++) { const a = k * .785 + i * 1.3 + 2, x = Math.round((b.x + Math.cos(a) * r) * 2) / 2, y = Math.round((b.y + Math.sin(a) * r) * 2) / 2; if (!w.isBlocked(x, y) && !w.isBlocked(x + .5, y + .5) && !w.isBlocked(x, y + 1.2) && !w.pois.some(q => Math.hypot(q.x - x, q.y - y) < 1.4)) sp = { x, y }; } if (sp) break; }
      if (!sp) return;
      safe(() => w.place('prop.mus.lostbox', sp.x - .4, sp.y - .3, { p: { k: i }, solid: false }));
      poi = w.poi({ type: 'museum', id: 'lost:' + i, name: c.short, x: sp.x, y: sp.y + .7, px: sp.x, py: sp.y, glow: true, district: dOf(sp) });
    }
    lost[i] = poi;
  });
}
function wire(s) {
  ensure(s.world); if (!door) return;
  lost.forEach((p, i) => { if (!p || s.interactables.some(it => it.poi === p)) return; s.interactables.push({ x: p.px, y: p.py, label: 'An old box', h: .7, hit: 12, spot: { x: p.x, y: p.y }, poi: p, use: () => takeLost(i) }); });
}

/* ---------- tickets, membership, the info desk ---------- */
function buyTicket() {
  if (!isOpen()) { toast('The desk is closed.', 'info'); return false; }
  if (isMember()) { toast('"A member! Walk straight in. Marge has been asking after you."', 'good'); return true; }
  if (freeNow()) { toast('"It is Free Friday evening. Put your purse away and go and look at things."', 'good', 3600); stamp('x:mus_visit'); return true; }
  if (st().ticketDay === G.now().day) { toast('"Your ticket is good until closing. All four wings."', 'info'); return true; }
  if (G.money && !G.money.pay(MUS_TICKET, 'Museum day ticket', { category: 'fun', venue: MUS_VENUES.place })) return false;
  S.ticketDay = G.now().day; G.emit('museum:ticket', 'day'); stamp('x:mus_visit'); toast(`Museum day ticket (${fmt(MUS_TICKET)}). All four wings are open to you until closing.`, 'good', 3800); return true;
}
function buyMembership() {
  if (isMember()) { toast('You are already a member.', 'info'); return true; }
  if (G.money && !G.money.pay(MUS_MEMBER, 'Museum membership', { category: 'fun', venue: MUS_VENUES.place })) return false;
  G.state.flags.museum_member = true; G.emit('museum:ticket', 'member'); stamp('x:mus_visit'); toast('Member of the Museum of Maple Bay: free entry for life, and the audio guide is always free.', 'good', 5200); return true;
}
const nextTour = () => { const h = G.now().hf; return TOUR_TIMES.find(t => t > h && t < hours()[1]) || null; };
function planTour() {
  const n = G.now(), nt = nextTour(), d = nt ? n.day : n.day + 1, th = nt || TOUR_TIMES[0], t = d * DAY + th * 60; if (!G.planner) return false;
  if (safe(() => G.planner.list(t - 1, t + 1).some(a => a.data && a.data.museumTour))) { toast('That tour is already on your day.', 'info'); return true; }
  safe(() => G.planner.add({ title: 'Guided tour: Museum of Maple Bay', placeId: 'museum', t, dur: 45, kind: 'event', data: { museumTour: th } })); toast(`Added to your planner: guided tour ${nt ? 'today' : 'tomorrow'} at ${clock(th)}. Meet Ines at the info desk.`, 'good', 4200); return true;
}
async function desk() {
  if (!isOpen()) { toast('The desk is closed. Open from 10:00.', 'info'); return; }
  const S = st(), nt = nextTour(), tk = hasTicket(), hs = huntState(), au = audioHas();
  const opts = [
    { label: isMember() ? 'Day ticket (you are a member)' : freeNow() ? 'Day ticket (free this evening)' : tk ? 'Day ticket (you have one)' : 'Day ticket', sub: tk ? 'All four wings, until closing' : fmt(MUS_TICKET) + ' · the hall, cafe and shop are free', value: 't', disabled: tk },
    { label: isMember() ? 'Membership (yours)' : 'Become a member', sub: isMember() ? 'Free entry for life' : fmt(MUS_MEMBER) + ' · free entry for life + free audio guide', value: 'm', disabled: isMember() },
    { label: au ? 'Audio guide (you have one)' : 'Rent the audio guide', sub: au ? `Stops heard today: ${Object.keys(S.audio).length}/${AUDIO.length}` : (isMember() ? 'Free for members' : fmt(MUS_AUDIO)) + ' · ten numbered stops, look for the blue signs', value: 'a', disabled: au },
    hs.done && !hs.claimed ? { label: 'Claim your scavenger hunt prize', sub: 'All eight found!', value: 'c' } : { label: hs.on ? `Scavenger hunt card (${hs.got}/${hs.of})` : hs.claimed ? 'Scavenger hunt (done)' : 'Take a scavenger hunt card', sub: hs.on ? 'Read your clues' : hs.claimed ? 'You have the badge to prove it' : 'Free · eight clues, a prize at the end', value: 'h', disabled: hs.claimed },
    { label: 'Guided tours', sub: nt ? `Next at ${clock(nt)}, from this desk. Add it to your day.` : `No more today. Daily at ${TOUR_TIMES.map(clock).join(', ')}. Add tomorrow's first to your day.`, value: 'p' },
    { label: 'Collection logbook', sub: Object.entries(logbook()).map(([k, v]) => `${v.name.split(' ')[0]} ${v.got}/${v.need}${v.stamp ? '*' : ''}`).join(' · '), value: 'l' },
    { label: 'Never mind', value: null }];
  const hr = hours(), v = await choose('Info Desk', opts, { text: `Open today ${clock(hr[0])} to ${clock(hr[1])}. Free for everyone on Friday evenings from ${clock(FREE_EVE.from)}.` });
  if (v === 't') buyTicket(); else if (v === 'm') buyMembership(); else if (v === 'a') audioRent(); else if (v === 'c') huntClaim(); else if (v === 'p') planTour();
  else if (v === 'h') { if (!hs.on) huntStart(); else await choose('Scavenger Hunt', huntClues().map(c => ({ label: (c.got ? '[x] ' : '[ ] ') + c.clue, value: 0, disabled: c.got })).concat([{ label: 'Back', value: 0 }]), { text: 'Find each thing and take a good look at it.' }); }
  else if (v === 'l') { const L = logbook(); await choose('Collection Logbook', Object.values(L).map(w => ({ label: `${w.stamp ? '[STAMPED] ' : ''}${w.name}`, sub: `${w.got} of ${w.of} exhibits read · stamp at ${w.need}`, value: 0 })).concat([{ label: 'Close', value: 0 }]), { text: 'Look closely at exhibits to log them. Each wing stamps your book when you have seen enough of it.' }); }
}
function arrived(sc) {
  const S = st(), first = !S.visits; S.visits++; safe(() => G.places.discover('museum', true)); G.emit('museum:visit', first);
  if (first) toast('Cool stone, hushed voices, and above you a skeleton the length of a bus. Tickets are at the desk beyond Marge.', 'good', 5200);
  else if (freeNow()) toast('Free Friday evening: every wing is open to everyone.', 'good', 3600);
  if (hasTicket()) stamp('x:mus_visit');
}

/* ---------- looking at things: the logbook ---------- */
const exKey = ex => (ex.startsWith('sp_') ? ex + '@' + season() : ex);
function exInfo(ex) {
  const s = season();
  if (ex === 'sp_centre' || ex === 'sp_side') { const q = SPECIAL_EX[s][ex === 'sp_centre' ? 0 : 1]; return { wing: 'special', name: q[0], text: q[1] }; }
  if (ex === 'sp_about') return { wing: 'special', name: SPECIALS[s].title, text: SPECIALS[s].blurb + ' This room changes with every season: four exhibitions a year.' };
  if (ex === 'found') return { wing: 'hist', name: 'Found in Maple Bay', text: `The cannery's steam whistle, the stationmaster's lantern from Depot No. 4, and the flying goggles of airmail pilot Josephine Achebe. Lost for sixty years; tracked down around the city and returned to the museum by ${who()}.` };
  return EXHIBITS[ex] || null;
}
const exName = ex => { const e = exInfo(ex); return e ? e.name : 'exhibit'; };
function logbook() {
  const S = st(), out = {}; for (const k in WINGS) out[k] = { name: WINGS[k].name, need: WINGS[k].need, got: 0, of: 0, stamp: S.wings[k] !== undefined };
  for (const id in EXHIBITS) { const w = EXHIBITS[id].wing; if (out[w] && !(id === 'found' && S.chain.st < 3)) out[w].of++; }
  for (const key in S.log) { const id = key.split('@')[0], e = EXHIBITS[id]; if (e && out[e.wing]) out[e.wing].got++; }
  out.special.got = Math.min(out.special.got, 12); out.special.of = 3; return out;
}
function logIt(ex) {
  const S = st(), key = exKey(ex), e = exInfo(ex); if (!e) return false; const fresh = S.log[key] === undefined;
  if (fresh) { S.log[key] = G.now().day; safe(() => { G.skills.addXp(e.wing === 'art' || e.wing === 'cafe' ? 'creativity' : 'logic', 6); G.needs.add('fun', 2); }); }
  G.emit('museum:look', ex, fresh);
  // scavenger hunt
  const h = HUNT.find(c => c.ex === ex); if (h && S.hunt.on && !S.hunt.done && !S.hunt.got[h.id]) { S.hunt.got[h.id] = 1; const n = Object.keys(S.hunt.got).length; G.emit('museum:hunt', h.id, n); if (n >= HUNT.length) { S.hunt.done = true; G.emit('museum:huntdone'); toast('Scavenger hunt: all eight found! Take your card back to the info desk for your prize.', 'good', 5200); } else toast(`Scavenger hunt: "${h.clue}" — found! (${n}/${HUNT.length})`, 'good', 3800); }
  if (!fresh) return false;
  const W = WINGS[e.wing]; if (W && S.wings[e.wing] === undefined) { const got = e.wing === 'special' ? Object.keys(S.log).filter(k => k.startsWith('sp_') && k.endsWith('@' + season())).length : logbook()[e.wing].got;
    if (got >= W.need) { S.wings[e.wing] = G.now().day; safe(() => G.needs.addMoodlet('cultured')); G.emit('museum:wing', e.wing); const all = Object.keys(WINGS).every(k => S.wings[k] !== undefined); if (all) stamp('x:mus_wings'); toast(`Logbook stamped: ${W.name}!${all ? ' That is all four wings. The whole museum is in your book.' : ''}`, 'good', 5000); }
    else if (!h) toast(`Logged: ${e.name} (${W.name} ${got}/${W.need}).`, 'good', 2600); }
  return true;
}
function showPicture(P, title, caption, f) {
  return new Promise(res => {
    const H = 72, Wd = Math.round(H * P.asp), cv = el('canvas', { width: Wd, height: H }), ctx = cv.getContext('2d'), fn = f || P.f;
    for (let y = 0; y < H; y++) for (let x = 0; x < Wd; x++) { ctx.fillStyle = fn((x + .5) / Wd, (y + .5) / H); ctx.fillRect(x, y, 1, 1); }
    Object.assign(cv.style, { display: 'block', margin: '4px auto 8px', width: `min(100%, ${Wd * 5}px)`, imageRendering: 'pixelated', border: '6px solid ' + (P.photo ? '#4a3626' : '#c8a050'), boxShadow: '3px 3px 0 #0006', boxSizing: 'border-box' });
    const m = modal({ title, cls: 'mus-pic', onClose: () => { viewer = null; res(); } }); m.body.append(cv, el('p', { text: caption, style: 'margin:0 2px 8px;line-height:1.35' }), el('button.opt', { onclick: () => m.close() }, el('span.opt-l', { text: 'Step back' }))); viewer = m;
  });
}
async function look(ex) {
  const e = exInfo(ex); if (!e || viewer) return false;
  if (ex.startsWith('p:')) { const P = pic(ex.slice(2)); if (!P) return false; await showPicture(P, P.photo ? P.t : `"${P.t}"`, P.photo ? P.note : `${P.by}, ${P.yr}. ${P.note}`); }
  else await say([{ who: e.name, text: e.text }]);
  return logIt(ex);
}

/* ---------- audio guide ---------- */
const audioHas = () => st().audioDay === G.now().day;
function audioRent() {
  if (audioHas()) return true; const free = isMember();
  if (!free && G.money && !G.money.pay(MUS_AUDIO, 'Museum audio guide', { category: 'fun', venue: MUS_VENUES.place })) return false;
  S.audioDay = G.now().day; S.audio = {}; toast(`Audio guide${free ? ' (free for members)' : ''}: ten stops, each marked with a round blue sign. Start with number one, at Marge.`, 'good', 4600); return true;
}
function listen(n) {
  const a = AUDIO.find(x => x.n === n); if (!a) return false;
  if (!audioHas()) { toast('A numbered audio stop. Rent a guide at the info desk and something will speak to you here.', 'info', 3800); return false; }
  const S = st(), fresh = !S.audio[n]; bubble(G.player, '*click*');
  say([{ who: `Audio guide · stop ${n}`, text: a.text }]).then(() => { if (!fresh) return; S.audio[n] = 1; const c = Object.keys(S.audio).length; safe(() => { G.skills.addXp('logic', 5); G.needs.add('fun', 3); }); G.emit('museum:audio', n, c); logIt(a.ex);
    if (c >= AUDIO.length) { S.audioDone = (S.audioDone || 0) + 1; safe(() => G.needs.addMoodlet('cultured')); toast('Audio trail complete: all ten stops. You know this building better than some of the guards.', 'good', 5000); } else toast(`Audio trail ${c}/${AUDIO.length}.`, 'info', 2200); });
  return true;
}

/* ---------- scavenger hunt ---------- */
const huntState = () => { const h = st().hunt; return { on: !!h.on, got: Object.keys(h.got).length, of: HUNT.length, done: !!h.done, claimed: !!h.claimed }; };
const huntClues = () => HUNT.map(c => ({ id: c.id, clue: c.clue, got: !!st().hunt.got[c.id] }));
function huntStart() { const h = st().hunt; if (h.on || h.claimed) return false; h.on = true; h.got = {}; h.done = false; toast('Scavenger hunt card: eight clues. Find each thing and take a good look at it. Read your clues again at the desk any time.', 'good', 5200); for (const c of HUNT) if (S.log[c.ex] !== undefined && c.ex === 'marge') { /* already seen things still need a second look */ } return true; }
function huntClaim() { const h = st().hunt; if (!h.done || h.claimed) return false; h.claimed = true; h.on = false; safe(() => G.inv.add('mus_badge', 1)); safe(() => { G.needs.add('fun', 12); G.needs.addMoodlet('cultured'); G.skills.addXp('logic', 25); }); stamp('x:mus_hunt'); toast('"Eight out of eight! By the power vested in me by this desk: Junior Curator." A brass badge with a tiny dinosaur goes in your bag.', 'good', 6000); return true; }

/* ---------- the dig pit: brush the sand away ---------- */
const SH = {
  ammonite: (x, y) => { const r = Math.hypot(x - .5, y - .5), a = Math.atan2(y - .5, x - .5); return r < .32 && (Math.abs(((r * 9 - a / 6.283 + 9) % 1) - .5) > .22 || r < .05); },
  trilobite: (x, y) => ((x - .5) ** 2 / .05 + (y - .5) ** 2 / .12 < 1) && (Math.floor(y * 16) % 2 === 0 || Math.abs(x - .5) < .05 || y < .32),
  fern: (x, y) => Math.abs(x - .5) < .015 && y > .12 && y < .9 || (y > .15 && y < .85 && Math.abs(x - .5) < (.9 - y) * .42 && Math.floor((y + Math.abs(x - .5) * .8) * 14) % 2 === 0),
  fish: (x, y) => ((x - .45) ** 2 / .07 + (y - .5) ** 2 / .018 < 1 && (Math.floor(x * 24) % 2 === 0 || Math.abs(y - .5) < .02 || x < .3)) || (x > .68 && x < .88 && Math.abs(y - .5) < (x - .68) * .9),
  tooth: (x, y) => y > .2 && y < .82 && Math.abs(x - .5) < (y < .4 ? .2 : .2 * (.82 - y) / .42),
  claw: (x, y) => { const r = Math.hypot(x - .42, y - .62), a = Math.atan2(y - .62, x - .42); return a < .3 && a > -2.6 && Math.abs(r - .3) < .07 * (1 - (a + 2.6) / 3.4 * .2) * (a < -2.2 ? (a + 2.6) / .4 : 1); },
};
function dig(fx, sc) {
  if (digRun || G.busy || viewer) return Promise.resolve(null); const S = st();
  const wts = FOSSILS.map((f, i) => (S.fossils[f.id] ? 1 : 3) * (i === 5 ? .5 : 1)), tot = wts.reduce((a, b) => a + b, 0); let k = Math.random() * tot, fi = 0; for (; fi < wts.length - 1; fi++) if ((k -= wts[fi]) <= 0) break; const F = FOSSILS[fi], shape = SH[F.id];
  const CW = 120, CH = 84, sand = new Float32Array(CW * CH).fill(1), mask = new Uint8Array(CW * CH); let need = 0; for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) if (shape((x + .5 - 18) / 84, (y + .5) / CH)) { mask[y * CW + x] = 1; need++; }
  const cv = el('canvas', { width: CW, height: CH, 'data-pad-surface': 'cursor' }), ctx = cv.getContext('2d'), bar = el('div', { style: 'height:10px;border:2px solid #2a2733;background:#f4ead0;margin:6px 0' }, el('div', { style: 'height:100%;width:0;background:#d8a848' })), tip = el('p', { text: 'Rub the sand with your finger or the mouse. Slowly: the stone lets go when it is ready.', style: 'margin:0 0 6px' });
  Object.assign(cv.style, { display: 'block', width: 'min(100%, 600px)', imageRendering: 'pixelated', border: '4px solid #5e3c28', boxSizing: 'border-box', touchAction: 'none', cursor: 'crosshair' });
  const h2 = (x, y) => { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const draw = () => { for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) { const i = y * CW + x, s = sand[i], n = h2(x, y); let c; if (s > .66) c = n > .9 ? '#f2e4bc' : n < .1 ? '#cbb784' : '#e4d2a4'; else if (s > .33) c = (x + y) & 1 ? '#d8c494' : (mask[i] ? '#c8b89a' : '#8a7c68'); else c = mask[i] ? (n > .8 ? '#f4ecd8' : '#eadfc4') : (n > .85 ? '#7a6c5c' : '#6a5e52'); ctx.fillStyle = c; ctx.fillRect(x, y, 1, 1); } };
  return new Promise(res => {
    let done = false, down = false; const m = modal({ title: 'The Dig Pit', cls: 'mus-dig', onClose: () => finish(false) }); m.body.append(tip, cv, bar);
    const prog = () => { let c = 0; for (let i = 0; i < mask.length; i++) if (mask[i] && sand[i] < .33) c++; return c / Math.max(1, need); };
    const brush = (X, Y, r = 7) => { if (done) return 0; for (let y = Math.max(0, Math.floor(Y - r)); y <= Math.min(CH - 1, Y + r); y++) for (let x = Math.max(0, Math.floor(X - r)); x <= Math.min(CW - 1, X + r); x++) { const d = Math.hypot(x - X, y - Y); if (d <= r) sand[y * CW + x] = Math.max(0, sand[y * CW + x] - (.5 - d / r * .3)); } draw(); const p = prog(); bar.firstChild.style.width = Math.round(Math.min(1, p / .9) * 100) + '%'; if (p >= .9) finish(true); return p; };
    const at = e => { const b = cv.getBoundingClientRect(); brush((e.clientX - b.left) / b.width * CW, (e.clientY - b.top) / b.height * CH); };
    cv.addEventListener('pointerdown', e => { down = true; e.preventDefault(); at(e); }); cv.addEventListener('pointermove', e => { if (down || e.pointerType === 'mouse' && e.buttons) at(e); }); window.addEventListener('pointerup', () => { down = false; }, { once: false });
    function finish(ok) {
      if (done) return; done = true; digRun = null;
      if (!ok) { safe(() => m.close()); toast('You put the brush down. The fossil will wait: it is good at that.', 'info', 3200); res(null); return; }
      for (let i = 0; i < sand.length; i++) sand[i] = Math.min(sand[i], mask[i] ? 0 : .5); draw(); tip.textContent = `A ${F.name}! ${F.note}`;
      setTimeout(() => { safe(() => m.close()); const fresh = !S.fossils[F.id]; S.fossils[F.id] = (S.fossils[F.id] || 0) + 1; S.digs++; const n = Object.keys(S.fossils).length;
        safe(() => { G.needs.add('fun', 9); G.skills.addXp('logic', 12); G.skills.addXp('handiness', 6); }); safe(() => G.advance(DIG_MIN)); logIt('digpit'); stamp('x:mus_dig'); G.emit('museum:dig', F.id, fresh); const s2 = scene(); if (s2 && s2.mus) s2.mus.sync();
        toast(`${F.name}! ${F.note} ${fresh ? `New in your finds (${n}/${FOSSILS.length}).` : 'You have found one before, but this one is yours too.'}${n >= FOSSILS.length && fresh ? ' That is every fossil in the pit!' : ''}`, 'good', 5600); if (n >= FOSSILS.length && fresh) safe(() => G.needs.addMoodlet('cultured')); res(F.id); }, 1500);
    }
    digRun = { brush, fossil: F.id, auto() { for (let y = 4; y < CH && !done; y += 5) for (let x = 4; x < CW && !done; x += 5) { brush(x, y, 6); brush(x, y, 6); brush(x, y, 6); } return F.id; }, state: () => ({ fossil: F.id, progress: prog() }), cancel: () => finish(false) }; draw();
  });
}

/* ---------- sketching, sitting ---------- */
function freeSeat(fx, sc) { for (const s of fx.seats || []) if (!sc.ents.some(e => e !== G.player && !e.hidden && Math.hypot(e.x - s.x, e.y - s.y) < .4)) return s; return null; }
function sketch(fx, sc) {
  if (G.busy) return false; const S = st(), id = fx.item.pic, P = pic(id), s = freeSeat(fx, sc); if (!P) return false; if (!s) { toast('The bench is full of art students. Try again in a bit.', 'info'); return false; }
  const p = G.player, kit = !!safe(() => G.inv.count('mus_sketchkit') > 0 || G.inv.count('cons_sketchbook') > 0 || G.inv.count('sketchbook') > 0), mult = kit ? 1.25 : 1; p.poseOpts = { seated: true, item: 'book', itemColor: '#f4f0e8' };
  bubble(p, kit ? 'Pencils out.' : 'The back of the floor plan will have to do.');
  G.startActivity({ label: `Sketching "${P.t}"`, anim: 'read', minutes: SKETCH_MIN, rate: 5, at: { x: s.x, y: s.y, z: s.z || .45, dir: 3 },
    tick: gm => { safe(() => { G.skills.addXp('creativity', gm * .95 * mult); G.needs.add('fun', gm * .3); }); }, cancel: () => { p.poseOpts = null; },
    done: () => { p.poseOpts = null; S.sketches.push(id); if (S.sketches.length > 40) S.sketches.shift(); const lv = safe(() => G.skills.level('creativity')) || 1; if (S.sketches.length === 1) safe(() => G.needs.addMoodlet('inspired')); stamp('x:mus_sketch'); logIt('p:' + id); G.emit('museum:sketch', id, S.sketches.length); if (sc && sc.mus) sc.mus.sync();
      showPicture(P, 'Your sketch', (lv >= 6 ? 'A confident study. A guard stops to look over your shoulder and nods.' : lv >= 3 ? 'Not bad at all: the big shapes are right where they should be.' : 'Wobbly, but honest. You looked harder at it than anyone has all day.') + ' You pin a copy to the visitors\' board.', pencil(P.f, Math.min(1, lv / 8))); } });
  return true;
}
function lookBoard() { const n = st().sketches.length; toast(n ? `Visitor sketches. ${n === 1 ? 'Yours is' : 'The latest of your ' + n + ' are'} pinned in the middle, slightly crooked.` : 'Visitor sketches: a careful lighthouse, a furious cat, somebody\'s lunch. Sit on a bench marked for sketching to add yours.', 'info', 4400); }
function sit(fx, sc) {
  if (G.busy) return false; const S = st(), s = freeSeat(fx, sc); if (!s) { toast('Both seats are taken.', 'info'); return false; } const p = G.player; p.poseOpts = { seated: true };
  G.startActivity({ label: 'Sitting quietly', anim: 'sit', minutes: 15, rate: 2.2, at: { x: s.x, y: s.y, z: s.z || .45, dir: s.dir === undefined ? 3 : s.dir }, tick: gm => { safe(() => { G.needs.add('fun', gm * .4); G.needs.add('energy', gm * .15); }); }, cancel: () => { p.poseOpts = null; },
    done: () => { p.poseOpts = null; S.sits++; G.emit('museum:sit'); toast(pick(['A school party goes by in a whisper that is not a whisper. You feel rested.', 'You watch the light move across the floor. Nobody hurries you.', 'A museum bench: the most comfortable uncomfortable seat in the world.']), 'good', 3800); } });
  return true;
}

/* ---------- donation, photo spots, the city model, cloakroom ---------- */
async function donate(amount) {
  const S = st(); if (!amount) amount = await choose('Donation Box', [1, 5, 20].map(n => ({ label: 'Give ' + fmt(n), value: n, disabled: !!(G.money && G.money.canAfford && !G.money.canAfford(n)) })).concat([{ label: 'Not today', value: null }]), { text: `"Every dollar keeps Marge dusted." You have given ${fmt(S.donated)} so far.` });
  if (!amount) return false; if (G.money && !G.money.pay(amount, 'Museum donation', { category: 'fun', venue: MUS_VENUES.place })) return false;
  S.donated += amount; safe(() => { G.needs.add('fun', 2 + Math.min(6, amount / 3)); if (amount >= 5 && MOODLETS.mus_patron) G.needs.addMoodlet('mus_patron'); }); G.emit('museum:donate', amount, S.donated); bubble(G.player, '*clink*');
  toast(amount >= 20 ? 'The coins make a rich sound. A guard catches your eye and touches his cap.' : 'Your coin joins the others under the glass.', 'good', 3600); return true;
}
function photo(spot) {
  if (G.busy) return false; const S = st(), T = { marge: ['Photo with Marge', 'You, grinning, under forty teeth. The best picture anyone has ever taken of you.'], model: ['Giant over the city', 'You loom over Maple Bay like a weather system. Your street is by your left elbow.'], special: ['At the special exhibition', `You and "${SPECIALS[season()].title.split(':')[0]}". One for the fridge.`] }[spot] || ['Museum photo', 'Click.'];
  bubble(G.player, 'Say "fossil"!'); const f = el('div'); Object.assign(f.style, { position: 'fixed', inset: 0, background: '#fff', opacity: .85, zIndex: 60, pointerEvents: 'none', transition: 'opacity .5s' }); root().append(f); setTimeout(() => { f.style.opacity = 0; }, 60); setTimeout(() => f.remove(), 700);
  const fresh = !S.photos[spot]; S.photos[spot] = (S.photos[spot] || 0) + 1; safe(() => G.needs.add('fun', fresh ? 6 : 2)); G.emit('museum:photo', spot); toast(`${T[0]}: ${T[1]}${fresh ? ` (${Object.keys(S.photos).length}/3 photo spots)` : ''}`, 'good', 4400); return true;
}
const DISTRICTS = ['', 'Harbor', 'Old Town', 'Downtown', 'Arts District', 'Rail Yard', 'Airport'];
async function model(sc, d) {
  if (!d) d = await choose('The City in Miniature', DISTRICTS.slice(1).map((n, i) => ({ label: 'Light up: ' + n, value: i + 1 })).concat([{ label: 'Read the label', value: 'r' }, { label: 'Step back', value: null }]), { text: 'Six brass buttons along the edge of the table.' });
  if (d === 'r') return look('model'); if (!d) return false; sc = sc || scene(); if (sc && sc.mus) sc.mus.light(d);
  const home = safe(() => G.places.get('home')) || null, mine = home && { harbor: 1, oldtown: 2, downtown: 3, arts: 4, railyard: 5, airport: 6 }[home.district] === d;
  G.emit('museum:model', d); safe(() => G.needs.add('fun', 2)); logIt('model'); toast(`Hundreds of tiny windows come on across ${DISTRICTS[d]}.${mine ? ' One of them is yours.' : d === 4 ? ' The little gold building is this museum.' : ''}`, 'good', 3600); return true;
}
function cloak() {
  const S = st(), d = G.now().day; if (!isOpen()) { toast('The cloakroom is closed.', 'info'); return false; }
  if (S.cloakDay === d) { toast('"Number forty-one. It is quite safe, I promise."', 'info'); return true; }
  S.cloakDay = d; if (MOODLETS.mus_light) safe(() => G.needs.addMoodlet('mus_light')); G.emit('museum:cloak'); toast('You hand over your coat and bag and get a brass tag, number 41. Hands free.', 'good', 3600); return true;
}

/* ---------- guided tour ---------- */
function talkDocent(doc, tour) {
  if (tour.on) { if (!tour.joined) { if (!hasTicket()) { bubble(doc, 'You will need a ticket to come into the wings with us!'); return; } tour.joined = true; bubble(doc, 'Welcome along! We are a friendly group.'); toast('You join the tour. You will follow Ines on your own; walk away whenever you like.', 'good', 4200); } else bubble(doc, 'Do keep up, there is a dinosaur waiting.'); return; }
  const nt = nextTour();
  say([{ who: 'Ines, docent', text: nt ? `The next tour leaves from this desk at ${clock(nt)}. Six stops: Marge, the minerals, the dig pit, the city model, Harbour at Dawn and the special exhibition.` : 'That was the last scheduled tour today. Eleven, two and four, every day.' }, { who: 'Ines, docent', text: 'Mind you, it is quiet at the moment. I could take you round myself.' }])
    .then(() => choose('Take a tour with Ines?', [{ label: 'Yes, show me round now', sub: 'About an hour and a half of game time. Free with a ticket.', value: 1, disabled: !hasTicket() }, { label: 'Put the next one on my day', value: 2 }, { label: 'Maybe later', value: 0 }], hasTicket() ? {} : { text: 'You need a museum ticket first (the desk is right here).' }))
    .then(v => { if (v === 2) planTour(); if (v !== 1) return; const sc = scene(); if (sc && sc.mus && sc.mus.startTour(true)) { tour.joined = true; toast('The tour sets off. Follow Ines: she stops at six exhibits.', 'good', 3800); } });
}
function tourDone(tour) {
  const S = st(), n = tour.seen || 0;
  if (n >= 4) { S.tours++; safe(() => { G.needs.add('fun', 14); G.needs.add('social', 6); G.skills.addXp('logic', 20); G.needs.addMoodlet('cultured'); }); for (const ex in tour.stops || {}) logIt(ex); G.emit('museum:tour', n); toast(`Tour complete (${n} of 6 stops). Ines shakes your hand and recommends the shortbread.`, 'good', 5200); }
  else toast(`You drifted away from the tour after ${n} stop${n === 1 ? '' : 's'}. Ines waves anyway.`, 'info', 3800);
}

/* ---------- Dr. Okafor's opportunity: three lost things ---------- */
const GOAL = 'mus_lost';
const goalText = () => { const c = st().chain, n = Object.keys(c.got).length; return c.st === 2 ? 'Bring the three lost objects to Dr. Okafor at the museum' : `Find the museum's lost objects (${n}/3)`; };
function setGoal() {
  const c = st().chain; if (!G.goals) return;
  if (c.st === 1 || c.st === 2) { const g = G.goals.get(GOAL); if (g) { g.text = goalText(); g.placeId = c.st === 2 ? 'museum' : undefined; G.emit('goals:change'); } else G.goals.add({ id: GOAL, text: goalText(), group: 'opportunity', placeId: c.st === 2 ? 'museum' : undefined, /* (QA round 3: while looking, tapping the goal must not move the arrow off the boxes) */ hint: 'Dr. Okafor is missing three things for the City History wing: the cannery\'s steam whistle (somewhere by the harbour), the stationmaster\'s lantern (near the railway or downtown) and the airmail pilot\'s goggles (out east, Maplewood or the airport). Each is in an old box beside a bench, and glows softly.' }); }
  else if (c.st === 3) safe(() => { if (G.goals.get(GOAL) && !G.goals.isDone(GOAL)) G.goals.complete(GOAL); });
}
/* QA round 3: the boxes are not map places, so the goal could only point at the museum. Now the guide arrow points at the nearest box still to find
   (on accepting, after each find, and when the goal is tapped), and back at the museum once all three are wrapped up. */
function pointToBox(say) {
  const c = st().chain; if (!G.phone || !G.phone.setWaypoint) return;
  if (c.st === 2) { safe(() => G.phone.setWaypoint('museum')); return; } if (c.st !== 1) return;
  const pos = (G.scene && G.scene.id === 'city') ? G.player : (safe(() => G.places.get('museum')) || G.player); let best = null, bd = 1e9;
  lost.forEach((q, i) => { if (!q || c.got[i]) return; const d = Math.abs(q.x - pos.x) + Math.abs(q.y - pos.y); if (d < bd) { bd = d; best = i; } });
  if (best === null) return; const q = lost[best]; safe(() => G.phone.setWaypoint({ id: 'lost:' + best, name: 'Old box: ' + LOST[best].short + '?', x: q.x, y: q.y }));
  if (say) toast(`Waypoint set: the nearest old box (${LOST[best].where}).`, 'good', 3600);
}
function takeLost(i) {
  const c = st().chain, d = LOST[i]; if (G.busy || !d) return false;
  if (c.st !== 1 || c.got[i]) { toast(c.got[i] ? 'The empty box. You left a note inside: "Gone to the museum."' : 'An old box somebody has left by the bench. There is something heavy inside, wrapped in newspaper. It feels like it belongs in a museum.', 'info', 4400); return false; }
  G.startActivity({ label: 'Looking through the box', anim: 'work', minutes: 6, rate: 2, done: () => { c.got[i] = 1; const n = Object.keys(c.got).length; if (n >= 3) c.st = 2; setGoal(); G.emit('museum:lost', i, n); if (n >= 3) G.emit('museum:chain', 2); pointToBox(false); say([{ who: d.short, text: d.found }]).then(() => toast(`${d.short}: wrapped up safe (${n}/3).${n >= 3 ? ' That is all three: back to Dr. Okafor.' : ''}`, 'good', 4400)); } });
  return true;
}
function talkCurator(g) {
  const c = st().chain, w = 'Dr. Okafor, curator';
  if (c.st === 0) say([{ who: w, text: pick(['Do you see this empty case? I have been building the City History wing for twenty years and I am three objects short.', 'Ah, a visitor who reads the labels. I can always tell. May I show you my embarrassment? This empty case.']) }, { who: w, text: 'The cannery\'s steam whistle. The stationmaster\'s lantern from the old tram depot. And the flying goggles of Josephine Achebe, who flew our first airmail. All three were in the old museum. All three vanished in the move.' }, { who: w, text: 'Things like that do not leave a town. They end up in sheds, in boxes, beside benches. If you ever come across one, I would be more grateful than I can say.' }])
    .then(() => choose('Keep an eye out for the lost objects?', [{ label: 'I will keep an eye out', value: 1 }, { label: 'Maybe another time', value: 0 }])).then(v => { if (v === 1) { c.st = 1; setGoal(); G.emit('museum:chain', 1); pointToBox(false); bubble(g, 'Thank you. Truly.'); toast('New opportunity: the museum\'s three lost objects. Each is in an old box beside a bench somewhere in town, and glows softly.', 'good', 5200); } else bubble(g, 'Of course. The case will keep.'); });
  else if (c.st === 1) { const n = Object.keys(c.got).length, left = LOST.filter((d, i) => !c.got[i]).map(d => `${d.name} (${d.where})`); say([{ who: w, text: n ? `${n} found! I hardly dared hope. Still missing: ${left.join('; and ')}.` : `Nothing yet? These things take time. I would start with ${left[0]}.` }]); }
  else if (c.st === 2) say([{ who: w, text: 'You have... all three? Let me see. Oh. Oh, the whistle. My grandmother set her kitchen clock by this whistle.' }, { who: w, text: 'They go in the case today, and the label will say who brought them home. And please: you are a member of this museum for life. It is the least we can do.' }]).then(() => {
    c.st = 3; const was = isMember(); G.state.flags.museum_member = true; safe(() => G.money.add(was ? 60 + MUS_MEMBER : 60, 'Thank-you from the museum')); safe(() => G.housing.addFurniture('mus_dino_model')); safe(() => G.needs.addMoodlet('cultured')); setGoal(); G.emit('museum:chain', 3); const sc = scene(); if (sc && sc.mus) sc.mus.sync();
    toast(`Member for life${was ? ' (your membership fee is refunded)' : ''}, $60, and a desk-size Marge on its way to your home. A new case stands in City History: "Found in Maple Bay", with your name on the label.`, 'good', 7500); });
  else say([{ who: w, text: pick(['Children press their noses to your case all day. I have stopped wiping the glass. It seems wrong to.', 'Somebody asked me yesterday who you were. I said: "The person who looked in the box."', 'I wound the lantern\'s wick this morning. Just to see. Do not tell the guards.']) }]);
}

/* ---------- guide wiring ---------- */
function patchGuide() {
  const e = safe(() => G.guide.get('place:museum')); if (!e) return;
  e.blurb = CORE_BLURB.museum; e.price = `${fmt(MUS_TICKET)} day ticket · members free · free Friday evenings from ${clock(FREE_EVE.from)}`; e.type = 'Museum'; e.chapter = 'arts'; e.also = ['sights', 'eat', 'shop']; const T = ['museum', 'dinosaur', 'art', 'history', 'fossils', 'tour', 'cafe', 'kids']; e.tags = (e.tags || []).filter(t => !T.includes(t)).concat(T);
  e.tryThis = ['Brush out a fossil in the dig pit', 'Look closely at the paintings', 'Sketch an artwork from a gallery bench', 'Follow the ten-stop audio guide', 'Take a scavenger hunt card', 'Light up the city model', `Join the guided tour (${TOUR_TIMES.map(clock).join(', ')})`, 'Fill the collection logbook', 'Ask the curator about her empty case'];
  e.when = `This season: ${SPECIALS[season()].title}`;
}

export function init() {
  S = G.defineState('museum', () => ({ ticketDay: -1, visits: 0, log: {}, wings: {}, audioDay: -1, audio: {}, hunt: { on: false, got: {} }, fossils: {}, digs: 0, sketches: [], sits: 0, donated: 0, photos: {}, tours: 0, cloakDay: -1, chain: { st: 0, got: {} } })); G.on('load', () => { st(); setGoal(); });
  G.museum = {
    isOpen, hours, ticket: MUS_TICKET, member: MUS_MEMBER, freeNow, hasTicket, isMember, buyTicket, buyMembership, desk, arrived, look, exName, logbook,
    exhibits: () => Object.keys(EXHIBITS).filter(id => !id.startsWith('sp_')).map(id => ({ id, wing: EXHIBITS[id].wing, name: exName(id), got: st().log[id] !== undefined })),
    audio: { has: audioHas, rent: audioRent, got: () => Object.keys(st().audio).map(Number) }, listen, hunt: { start: huntStart, state: huntState, clues: huntClues, claim: huntClaim },
    dig, digging: { brush: (x, y, r) => digRun && digRun.brush(x, y, r), auto: () => digRun && digRun.auto(), state: () => (digRun ? digRun.state() : null), cancel: () => digRun && digRun.cancel() }, fossils: () => FOSSILS.map(f => Object.assign({ n: st().fossils[f.id] || 0 }, f)),
    sketch, sketches: () => st().sketches.slice(), lookBoard, sit, donate, donated: () => st().donated, photo, model, cloak, paintings: () => PAINTINGS.map(p => ({ id: p.id, title: p.t, by: p.by, year: p.yr })),
    tour: { times: TOUR_TIMES, next: nextTour, plan: planTour, start: () => { const sc = scene(); return !!(sc && sc.mus && sc.mus.startTour(true)); }, join: () => { const sc = scene(); if (sc && sc.mus && sc.mus.tour.on && hasTicket()) { sc.mus.tour.joined = true; return true; } return false; }, state: () => { const sc = scene(), t = sc && sc.mus && sc.mus.tour; return t ? { on: t.on, stop: t.i, joined: t.joined, seen: t.seen } : null; } },
    talkDocent, tourDone, talkCurator, takeLost, chain: () => st().chain, lost: () => lost.map((p, i) => p && { i, name: LOST[i].short, x: p.x, y: p.y, got: !!st().chain.got[i] }).filter(Boolean), foundDone: () => st().chain.st === 3,
    door: () => door, closeViewer: () => { if (viewer) viewer.close(); },
    stats: () => { const S = st(); return { visits: S.visits, logged: Object.keys(S.log).length, wings: Object.keys(S.wings).length, audio: Object.keys(S.audio).length, hunt: Object.keys(S.hunt.got).length, fossils: Object.keys(S.fossils).length, digs: S.digs, sketches: S.sketches.length, donated: S.donated, photos: Object.keys(S.photos).length, tours: S.tours, chain: S.chain.st }; },
  };
  G.on('room:build', sc => { if (sc && sc.def && sc.def.showpiece === 'museum' && !built) safe(() => ensure(getCity())); });
  // the pois must exist before stalls / places read them: build on the first city scene and also eagerly when another module asks for the city first
  G.on('scene', s => { if (!s || s.id !== 'city' || s._museum || !s.world) return; s._museum = true; try { wire(s); } catch (e) { console.warn('museum', e); } setGoal(); });
  G.on('guide:rebuilt', patchGuide);
  G.on('minutes', () => { const sc = scene(); if (!sc || G.busy || G.modal || G.cutscene) return; const h = G.now().hf, hr = hours(); if (h >= hr[1] + .33 || h < hr[0] - 3) { if (sc._closing) return; sc._closing = true; toast('"We are closing, I am afraid." A guard walks you past Marge to the door.', 'info', 4200); exitRoom({ poi: DOOR }).then(() => { sc._closing = false; }, () => { sc._closing = false; }); } });
}
