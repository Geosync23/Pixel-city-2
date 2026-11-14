// Maple Bay Botanical Conservatory — city entrance, tickets, activities, guided tour, the head gardener's opportunity and guide wiring.
// Room: scenes/rooms/conservatory.js (room id 'conservatory'). Data: data/conservatory.js. Art: art/showpiece/conservatory*.js.
//
// City (once per city world, before places / stalls / addresses build — order 57):
//   - the existing `bld.civic.conservatory` in Central Park gets a door poi `door:conservatory` (room 'conservatory') + its interactable (welcome glow comes from stalls.js);
//   - three "curious plant" spots (pois `cutting:0..2`, type 'conservatory', glow) with a small plant each, near benches in the park, Maplewood/Hillcrest and the Harbor.
//   G.places id: 'conservatory'. Hours 9:00-19:00 daily (closed toast at the door). The hall, shop, cafe and flower show are free; the garden needs a $4 day ticket
//   (flag G.state.flags.conservatory_pass = free for life: Hattie gives it for the cuttings).
// G.conservatory = {
//   isOpen(), hours, ticket (price), hasTicket(), buyTicket() -> bool, enter() (from the city door), desk() (ticket desk menu),
//   facts() -> [{ id, zone, title, text, got }], readFact(id), photos() -> [{ id, name, note, quality 0-3 }], photograph(scene) -> Promise<{ id, q } | null>, photo.snap() (take the shot now),
//   sketches() -> n, sketch(fx, scene), sit(fx, scene), feedKoi(fx, scene), buySeedling(itemId?) -> Promise, wish(), lookBoard(),
//   tour: { times, next() -> hour | null, start() (debug / private tour), join(), state() }, talkDocent(char, tour), tourDone(tour),
//   talkGardener(char), chain() -> { st: 0 none | 1 looking | 2 collected | 3 done, got: { i: 1 } }, cuttings() -> [{ i, name, x, y, got }], rareDone(), stats() }
// State: G.state.conservatory = { ticketDay, visits, facts: { id: day }, photos: { id: q }, sketches, koi, sits, tours, wishDay, chain: { st, got } }
// Events: 'conservatory:visit'(first), ':ticket', ':fact'(id, n), ':koi'(n), ':photo'(id, quality), ':sketch'(n), ':sit'(n), ':seedling'(itemId), ':tourstart', ':tourstop'(zone),
//         ':tour'(stopsSeen), ':cutting'(i, n), ':chain'(st), ':wish'.   Guide stamps: x:cons_visit, x:cons_koi, x:cons_photo (registered into _guide_data EXPERIENCES).
// Activities (ids for the guide): cons_feed_koi, cons_read_plaque, cons_sketch, cons_photo, cons_breathe, cons_tour, cons_seedling.
import { G } from '../core/game.js';
import { el, root, toast, bubble, say, choose } from '../ui/kit.js';
import { enterRoom, exitRoom } from '../scenes/interior.js';
import { ITEM_BY_ID } from '../data/items.js';
import { MOODLETS } from '../data/needs.js';
import { CONS_HOURS, CONS_TICKET, CONS_VENUES, SEEDLINGS, CONS_VIS, FACTS, BUTTERFLIES, TOUR_TIMES } from '../data/conservatory.js';
import { VIS } from './housing.js';
import { CORE, CORE_BLURB, EXPERIENCES } from './_guide_data.js';
import { getCity } from '../world/_city.js';

export const order = 57;
Object.assign(VIS, CONS_VIS);
const NAME = 'Maple Bay Botanical Conservatory', DOOR = 'door:conservatory';
CORE.conservatory = ['arts', 'Botanical garden', 'tree', ['outdoors', 'sights']];
CORE_BLURB.conservatory = 'A Victorian glass palm house in Central Park: a steaming jungle with a waterfall, a bone-dry desert, a dim orchid grotto, a room of loose butterflies and a koi pond with a red bridge. Feed the koi, sketch the orchids, photograph a morpho, join the docent\'s tour, and see what the flower show is doing this season.';
for (const x of [
  { id: 'x:cons_visit', title: 'Wander the Glasshouse', group: 'Big days out', glyph: 'tree', place: 'place:conservatory', need: 'conservatory', blurb: 'Buy a day ticket and walk from jungle to desert without leaving Central Park.' },
  { id: 'x:cons_koi', title: 'Feed the Koi', group: 'Big days out', glyph: 'tree', place: 'place:conservatory', need: 'conservatory', blurb: 'Fifty cents of pellets from the red dispenser by the pond. Marmalade will get there first.' },
  { id: 'x:cons_photo', title: 'Photograph a Butterfly', group: 'Big days out', glyph: 'tree', place: 'place:conservatory', need: 'conservatory', blurb: 'Wait by a nectar dish in the Butterfly Room and press the shutter when the wings open.' },
]) if (!EXPERIENCES.some(e => e.id === x.id)) EXPERIENCES.push(x);

const CUT = [{ name: 'Ghost Fern', a: 'furn.cons.cycad', p: { seed: 9 }, where: 'Central Park', d: ['park'] }, { name: 'Flame Aloe', a: 'furn.cons.cactus', p: { kind: 'aloe', seed: 5 }, where: 'the leafy streets up the hill', d: ['maplewood', 'hillcrest', 'arts'] }, { name: 'Blue Sea-Agave', a: 'furn.cons.cactus', p: { kind: 'agave', seed: 6 }, where: 'the waterfront', d: ['harbor', 'oldtown', 'railyard', 'downtown'] }];
let S = null, built = null, door = null; const cuts = [];
const st = () => { S = G.state.conservatory || (G.state.conservatory = {}); for (const [k, v] of [['facts', {}], ['photos', {}], ['chain', { st: 0, got: {} }]]) if (!S[k]) S[k] = v; if (!S.chain.got) S.chain.got = {}; for (const k of ['visits', 'sketches', 'koi', 'sits', 'tours']) S[k] = S[k] || 0; if (S.ticketDay === undefined) S.ticketDay = -1; return S; };
const fmt = n => (G.money && G.money.fmt ? G.money.fmt(n) : '$' + n);
const safe = fn => { try { return fn(); } catch (e) { return undefined; } };
const stamp = id => safe(() => G.guide && G.guide.stamp && G.guide.stamp(id));
const clock = h => String(Math.floor(h)).padStart(2, '0') + ':00';
const isOpen = () => { const h = G.now().hf; return h >= CONS_HOURS[0] && h < CONS_HOURS[1]; };
const scene = () => (G.scene && G.scene.roomId === 'conservatory' ? G.scene : null);

/* ---------- city: the door and the three curious plants ---------- */
function ensure(w) {
  if (built === w || !w || !Array.isArray(w.objs)) return; built = w; cuts.length = 0;
  const ob = w.objs.find(o => o.id === 'bld.civic.conservatory'); if (!ob) return;
  door = w.pois.find(p => p.id === DOOR);
  if (!door) {
    const B = ob.B, dr = ob.a.door || { at: (B[3] - B[0]) / 2 }, free = (x, y) => x > 1 && y > 1 && x < w.w - 1 && y < w.h - 1 && !w.isBlocked(x, y); let sp = null;
    for (const out of [.75, 1.25, 1.75, 2.25]) { for (const off of [0, .5, -.5, 1, -1, 1.5, -1.5]) { const a = ob.flip ? { x: B[3] + out, y: B[1] + dr.at + off, dir: 0 } : { x: B[0] + dr.at + off, y: B[4] + out, dir: 1 }; if (free(a.x, a.y)) { sp = a; break; } } if (sp) break; }
    if (!sp) return;
    door = w.poi({ type: 'door', id: DOOR, room: 'conservatory', name: NAME, x: Math.round(sp.x * 2) / 2, y: Math.round(sp.y * 4) / 4, dir: sp.dir, district: (w.districtAt && w.districtAt(sp.x, sp.y)) || 'park', showpiece: true });
  }
  // curious plants: next to a bench in three different parts of town (deterministic)
  const benches = w.pois.filter(p => p.type === 'bench' && isFinite(p.x)).sort((a, b) => (a.x * 1000 + a.y) - (b.x * 1000 + b.y)), used = [];
  const dOf = p => (w.districtAt ? w.districtAt(p.x, p.y) : null);
  CUT.forEach((c, i) => {
    let poi = w.pois.find(p => p.id === 'cutting:' + i);
    if (!poi) {
      let cand = benches.filter(b => c.d.includes(dOf(b)) && Math.hypot(b.x - door.x, b.y - door.y) > 18 && !used.some(u => Math.hypot(u.x - b.x, u.y - b.y) < 30)); if (!cand.length) cand = benches.filter(b => !used.some(u => Math.hypot(u.x - b.x, u.y - b.y) < 30) && Math.hypot(b.x - door.x, b.y - door.y) > 18);
      const b = cand[Math.floor(cand.length * (.37 + i * .21)) % Math.max(1, cand.length)]; if (!b) return; used.push(b); let sp = null;
      for (const r of [2, 2.5, 3, 1.5, 3.5]) { for (let k = 0; k < 8 && !sp; k++) { const a = k * .785 + i, x = Math.round((b.x + Math.cos(a) * r) * 2) / 2, y = Math.round((b.y + Math.sin(a) * r) * 2) / 2; if (!w.isBlocked(x, y) && !w.isBlocked(x + .5, y + .5) && !w.isBlocked(x, y + 1.2) && !w.pois.some(q => Math.hypot(q.x - x, q.y - y) < 1.2)) sp = { x, y }; } if (sp) break; }
      if (!sp) return;
      safe(() => w.place(c.a, sp.x - .4, sp.y - .4, { p: c.p, solid: false }));
      poi = w.poi({ type: 'conservatory', id: 'cutting:' + i, name: c.name, x: sp.x, y: sp.y + .6, px: sp.x, py: sp.y, glow: true, district: dOf(sp) });
    }
    cuts[i] = poi;
  });
}
function wire(s) {
  const w = s.world; ensure(w); if (!door) return;
  if (!s.interactables.some(it => it.poi === door)) s.interactables.push({ x: door.x, y: door.y, label: NAME, h: 1.2, range: 1.3, poi: door, use: () => enter() });
  cuts.forEach((p, i) => { if (!p || s.interactables.some(it => it.poi === p)) return; s.interactables.push({ x: p.px, y: p.py, label: 'A curious plant', h: .8, hit: 12, spot: { x: p.x, y: p.y }, poi: p, use: () => takeCutting(i) }); });
}
function enter() {
  if (!isOpen()) { toast(`${NAME}: closed. Open daily ${clock(CONS_HOURS[0])} to ${clock(CONS_HOURS[1])}. The palms are asleep.`, 'info', 3800); return false; }
  enterRoom('conservatory', DOOR); return true;
}

/* ---------- tickets ---------- */
const hasTicket = () => !!(G.state.flags && G.state.flags.conservatory_pass) || st().ticketDay === G.now().day;
function buyTicket() {
  if (G.state.flags && G.state.flags.conservatory_pass) { toast('"A Friend of the Glasshouse! Go straight through."', 'good'); return true; }
  if (hasTicket()) { toast('"Your ticket is good all day. The gates are open for you."', 'info'); return true; }
  if (G.money && !G.money.pay(CONS_TICKET, 'Conservatory day ticket', { category: 'fun', venue: CONS_VENUES.place })) return false;
  st().ticketDay = G.now().day; G.emit('conservatory:ticket'); const sc = scene(); if (sc && sc.cons) sc.cons.sync();
  toast(`Garden day ticket (${fmt(CONS_TICKET)}). The gates either side of the lily pool are open for you.`, 'good', 3800); return true;
}
const nextTour = () => { const h = G.now().hf; return TOUR_TIMES.find(t => t > h && t < CONS_HOURS[1]) || null; };
async function desk() {
  if (!isOpen()) { toast('The desk is closed. Tickets from 9:00.', 'info'); return; }
  const nt = nextTour(), opts = [{ label: hasTicket() ? 'Garden day ticket (you have one)' : 'Garden day ticket', sub: hasTicket() ? 'Valid all day' : fmt(CONS_TICKET) + ' · the hall, cafe and flower show are free', value: 't', disabled: hasTicket() }, { label: 'Guided tours', sub: nt ? 'Next one at ' + clock(nt) + ', from the lily pool. Free with a ticket.' : 'No more tours today. Daily at ' + TOUR_TIMES.map(clock).join(', ') + '.', value: 'i' }, { label: 'Never mind', value: null }];
  const v = await choose('Tickets & Tours', opts, { text: 'Open daily ' + clock(CONS_HOURS[0]) + ' to ' + clock(CONS_HOURS[1]) + '.' });
  if (v === 't') buyTicket(); else if (v === 'i') toast(nt ? `"Next tour at ${clock(nt)}. Wendell waits by the desk. Just tap him to join."` : '"Wendell has done his last tour for today. Ask him anyway: he never minds."', 'info', 4200);
}
function arrived(sc) {
  const S = st(), first = !S.visits; S.visits++; safe(() => G.places.discover('conservatory', true)); G.emit('conservatory:visit', first);
  if (first) toast('Warm, wet air and the sound of water. The whole glasshouse smells of rain.', 'good', 4200);
  if (hasTicket()) stamp('x:cons_visit');
}

/* ---------- plaques: the plant-facts collection ---------- */
function readFact(id) {
  const S = st();
  if (id === 'rare') { say([{ who: 'Rare Finds', text: `Ghost Fern, Flame Aloe and Blue Sea-Agave. Found growing wild around Maple Bay and brought in as cuttings by ${(G.state.player && G.state.player.name) || 'a friend of the glasshouse'}. They have settled in nicely.` }]); return; }
  const f = FACTS.find(x => x.id === id); if (!f) return; const fresh = S.facts[id] === undefined;
  say([{ who: f.title, text: f.text }]).then(() => {
    if (!fresh) return; S.facts[id] = G.now().day; const n = Object.keys(S.facts).length;
    safe(() => G.skills.addXp('logic', 8)); safe(() => G.needs.add('fun', 2)); G.emit('conservatory:fact', id, n);
    if (n >= FACTS.length) { safe(() => G.needs.addMoodlet('inspired')); toast(`Plant facts ${n}/${FACTS.length}: the whole collection! You could give the tour yourself.`, 'good', 4600); }
    else toast(`Plant fact noted (${n}/${FACTS.length}): ${f.zone}.`, 'good', 3000);
  });
}

/* ---------- koi ---------- */
function feedKoi(fx, sc) {
  if (G.busy) return false; const S = st(), tg = fx.item.feed || [34, 16];
  if (G.money && !G.money.pay(.5, 'Koi pellets', { category: 'fun', venue: CONS_VENUES.place })) return false;
  const u = fx.use || { x: fx.x, y: fx.y + .6 }, tx = tg[0] + 1, ty = tg[1] + 1, dx = tx - u.x, dy = ty - u.y;
  if (sc && sc.cons) sc.cons.feed(tg[0], tg[1], 16);
  bubble(G.player, 'Here, fishy fishy...');
  G.startActivity({ label: 'Feeding the koi', anim: 'work', minutes: 9, rate: 1, at: { x: u.x, y: u.y, z: 0, dir: Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 0 : 2) : (dy > 0 ? 1 : 3) },
    done: () => { S.koi++; safe(() => G.needs.add('fun', 10)); G.emit('conservatory:koi', S.koi); stamp('x:cons_koi'); toast(S.koi === 1 ? 'The water boils with orange and white. Marmalade gets there first, as promised.' : 'Fourteen open mouths and not one thank-you. Wonderful.', 'good', 4200); } });
  return true;
}

/* ---------- benches: sit and breathe ---------- */
function freeSeat(fx, sc) { for (const s of fx.seats || []) if (!sc.ents.some(e => e !== G.player && !e.hidden && Math.hypot(e.x - s.x, e.y - s.y) < .4)) return s; return null; }
function sit(fx, sc) {
  if (G.busy) return false; const S = st(), s = freeSeat(fx, sc); if (!s) { toast('Both seats are taken. Try the next bench along.', 'info'); return false; }
  const p = G.player; p.poseOpts = { seated: true };
  G.startActivity({ label: 'Sitting among the leaves', anim: 'sit', minutes: 20, rate: 2.2, at: { x: s.x, y: s.y, z: s.z || .45, dir: s.dir === undefined ? 1 : s.dir },
    tick: gm => { safe(() => { G.needs.add('fun', gm * .5); G.needs.add('energy', gm * .12); }); },
    cancel: () => { p.poseOpts = null; },
    done: () => { p.poseOpts = null; S.sits++; if (MOODLETS.green_calm) safe(() => G.needs.addMoodlet('green_calm')); G.emit('conservatory:sit', S.sits); toast('In through the nose, out through the mouth. You feel green and calm.', 'good', 3800); } });
  return true;
}

/* ---------- sketching ---------- */
function sketch(fx, sc) {
  if (G.busy) return false; const S = st(), s = freeSeat(fx, sc); if (!s) { toast('Somebody is using the stool.', 'info'); return false; }
  const p = G.player, book = !!safe(() => G.inv.count('cons_sketchbook') > 0), mult = book ? 1.25 : 1; p.poseOpts = { seated: true, item: 'book', itemColor: '#f4f0e8' };
  bubble(p, book ? 'Right. Sketchbook out.' : 'A pencil and the back of the map will do.');
  G.startActivity({ label: 'Sketching the orchids', anim: 'read', minutes: 45, rate: 5, at: { x: s.x, y: s.y, z: s.z || .42, dir: s.dir === undefined ? 3 : s.dir },
    tick: gm => { safe(() => { G.skills.addXp('creativity', gm * .9 * mult); G.needs.add('fun', gm * .3); }); },
    cancel: () => { p.poseOpts = null; },
    done: () => { p.poseOpts = null; S.sketches++; const lv = safe(() => G.skills.level('creativity')) || 1; if (S.sketches === 1) safe(() => G.needs.addMoodlet('inspired')); G.emit('conservatory:sketch', S.sketches); if (sc && sc.cons) sc.cons.sync();
      toast((lv >= 6 ? 'A lovely study: you caught the curl of the lip exactly.' : lv >= 3 ? 'Not bad at all. It is clearly an orchid.' : 'It is... a flower of some kind. Still, yours.') + ' You pin it to the visitor board.', 'good', 4600); } });
  return true;
}
function lookBoard() { const n = st().sketches; toast(n ? `Visitor sketches. ${n === 1 ? 'Yours is the one' : n + ' of them are yours: the ones'} pinned slightly crooked.` : 'Visitor sketches: wobbly orchids, one very good fern, a koi with a top hat. Room for one more.', 'info', 4200); }

/* ---------- butterfly photography: a short timing moment ---------- */
const QN = ['', 'a bit blurry', 'a good shot', 'a perfect shot'];
let photoRun = null;
function photograph(sc) {
  if (photoRun || G.busy) return Promise.resolve(null); const S = st();
  // rarer species come up less often
  const wts = BUTTERFLIES.map((b, i) => (i < 4 ? 4 : i < 6 ? 2 : 1)), tot = wts.reduce((a, b) => a + b, 0); let k = Math.random() * tot, bi = 0; for (; bi < wts.length; bi++) if ((k -= wts[bi]) <= 0) break; const sp = BUTTERFLIES[Math.min(bi, BUTTERFLIES.length - 1)];
  const CW = 160, CH = 110, cv = el('canvas', { width: CW, height: CH }); cv.className = 'cons-photo';
  Object.assign(cv.style, { position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: 'min(92vw, 640px)', imageRendering: 'pixelated', zIndex: 55, border: '4px solid #2a2733', boxShadow: '6px 6px 0 #0006', background: '#1f3a30', cursor: 'pointer', touchAction: 'none' });
  const tip = el('div', { text: 'Tap when the butterfly is in the ring with its wings open' }); Object.assign(tip.style, { position: 'fixed', left: '50%', bottom: '12%', transform: 'translateX(-50%)', zIndex: 56, background: '#f4ead0', color: '#2a2733', border: '2px solid #2a2733', padding: '6px 10px', fontSize: '14px', boxShadow: '3px 3px 0 #0006', textAlign: 'center', maxWidth: '90vw' });
  root().append(cv, tip); G.modal++; const ctx = cv.getContext('2d'), t0 = performance.now(); let done = false, frozen = null;
  const pos = t => { const land = (t % 4.2) > 2.9; return land ? { x: CW / 2 + Math.sin(t * 9) * .8, y: CH / 2 - 6, open: Math.sin(t * 3.2) > -.2, land } : { x: CW / 2 + Math.sin(t * 1.9 + 1) * 52 + Math.sin(t * 5.3) * 6, y: CH / 2 - 4 + Math.sin(t * 2.7) * 28 + Math.cos(t * 6.1) * 5, open: Math.floor(t * 9) % 2 === 0, land }; };
  const draw = (t, b) => {
    ctx.fillStyle = '#2f6a48'; ctx.fillRect(0, 0, CW, CH); for (let i = 0; i < 26; i++) { const x = (i * 53) % CW, y = (i * 37) % CH; ctx.fillStyle = ['#3f8a55', '#2a5a40', '#58a868'][i % 3]; ctx.fillRect(x, y, 14 + (i % 4) * 5, 6 + (i % 3) * 3); }
    ctx.fillStyle = '#4a9a50'; ctx.fillRect(CW / 2 - 1, CH / 2, 2, CH / 2); for (const [dx, dy, c] of [[0, 0, '#ffe070'], [-4, 0, '#f08ab0'], [4, 0, '#f08ab0'], [0, -4, '#f08ab0'], [0, 4, '#f08ab0'], [-3, -3, '#e86a9a'], [3, -3, '#e86a9a'], [-3, 3, '#e86a9a'], [3, 3, '#e86a9a']]) { ctx.fillStyle = c; ctx.fillRect(CW / 2 - 2 + dx, CH / 2 - 2 + dy, 4, 4); }
    const X = Math.round(b.x), Y = Math.round(b.y), w = b.open ? 9 : 3; ctx.fillStyle = sp.c2; ctx.fillRect(X - w - 1, Y - 8, w + 1, 13); ctx.fillRect(X + 1, Y - 8, w + 1, 13); ctx.fillStyle = sp.c; ctx.fillRect(X - w, Y - 7, w, 7); ctx.fillRect(X + 1, Y - 7, w, 7); ctx.fillRect(X - w + 1, Y, w - 1, 4); ctx.fillRect(X + 1, Y, w - 1, 4);
    if (b.open) { ctx.fillStyle = '#ffffffaa'; ctx.fillRect(X - w + 2, Y - 5, 2, 2); ctx.fillRect(X + w - 3, Y - 5, 2, 2); } ctx.fillStyle = '#2a2733'; ctx.fillRect(X, Y - 8, 1, 14); ctx.fillRect(X - 2, Y - 11, 1, 3); ctx.fillRect(X + 2, Y - 11, 1, 3);
    // viewfinder
    ctx.strokeStyle = '#f4ead0'; ctx.lineWidth = 1; ctx.strokeRect(CW / 2 - 22.5, CH / 2 - 24.5, 45, 37); ctx.fillStyle = '#f4ead0'; for (const [x, y] of [[6, 6], [CW - 14, 6], [6, CH - 8], [CW - 14, CH - 8]]) { ctx.fillRect(x, y, 8, 1); ctx.fillRect(x + (x < 20 ? 0 : 7), y - (y < 20 ? 0 : 5), 1, 6); }
    ctx.fillStyle = '#e8483b'; ctx.fillRect(CW - 12, 12, 4, 4);
  };
  return new Promise(res => {
    const finish = (b, t) => { if (done) return; done = true; let q = 0;
      if (b) { const d = Math.hypot(b.x - CW / 2, b.y - (CH / 2 - 6)); q = d < 9 && b.open ? 3 : d < 22 ? (b.open ? 2 : 1) : d < 34 ? 1 : 0; }
      if (b) { frozen = b; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, CW, CH); setTimeout(() => { draw(t, frozen); }, 90); }
      setTimeout(() => { cv.remove(); tip.remove(); G.modal = Math.max(0, G.modal - 1); photoRun = null; window.removeEventListener('keydown', key);
        if (!b) { toast('It flew off before you were ready. Butterflies keep no appointments.', 'info', 3600); res(null); return; }
        if (!q) { toast('Click! ...A very nice photo of a leaf. The butterfly was elsewhere.', 'info', 3600); G.emit('conservatory:photo', sp.id, 0); res({ id: sp.id, q: 0 }); return; }
        const best = S.photos[sp.id] || 0, fresh = !best; if (q > best) S.photos[sp.id] = q; const n = Object.keys(S.photos).length;
        safe(() => { G.needs.add('fun', 5 + q * 3); G.skills.addXp('creativity', 3 + q * 3); }); G.emit('conservatory:photo', sp.id, q); stamp('x:cons_photo');
        toast(`Click! ${sp.name}: ${QN[q]}. ${fresh ? `New in your butterfly album (${n}/${BUTTERFLIES.length}). ` : q > best ? 'Better than your last one. ' : ''}${sp.note}`, 'good', 5200); res({ id: sp.id, q });
      }, b ? 1300 : 200); };
    const snap = () => { if (done) return; const t = (performance.now() - t0) / 1000; if (t < .35) return; finish(pos(t), t); };
    const key = e => { if (e.key === ' ' || e.key === 'Enter' || e.key === 'e' || e.key === 'E') { e.preventDefault(); snap(); } };
    cv.addEventListener('pointerdown', e => { e.preventDefault(); snap(); }); window.addEventListener('keydown', key);
    photoRun = { snap, species: sp.id, pos: () => pos((performance.now() - t0) / 1000), cancel: () => finish(null) };
    const loop = () => { if (done) return; const t = (performance.now() - t0) / 1000; if (t > 16) { finish(null); return; } draw(t, pos(t)); requestAnimationFrame(loop); }; loop();
  });
}

/* ---------- seedlings ---------- */
async function buySeedling(itemId) {
  if (!isOpen()) { toast('The shop is closed.', 'info'); return false; }
  const price = id => safe(() => G.shop.price(id, CONS_VENUES.gifts)) || ITEM_BY_ID[id].price;
  if (!itemId) itemId = await choose('Seedlings — grown in the back house', SEEDLINGS.map(id => ({ label: ITEM_BY_ID[id].name, sub: fmt(price(id)) + ' · ' + ITEM_BY_ID[id].icon, value: id, disabled: !!(G.money && G.money.canAfford && !G.money.canAfford(price(id), { category: 'homegood', venue: CONS_VENUES.gifts })) })).concat([{ label: 'Just looking', value: null }]), { text: 'Pick one up and it is delivered to your home, potted and labelled.' });
  if (!itemId || !ITEM_BY_ID[itemId]) return false;
  const ok = G.shop && G.shop.buy ? G.shop.buy(itemId, 1, CONS_VENUES.gifts) : false; if (!ok) return false;
  G.emit('conservatory:seedling', itemId); bubble(G.player, 'Come on, little one. You are coming home with me.'); toast(`${ITEM_BY_ID[itemId].name}: wrapped in newspaper and on its way to your place. Look for it with your deliveries.`, 'good', 4600); return true;
}
function wish() {
  const S = st(), d = G.now().day; if (S.wishDay === d) { toast('One wish a day. The lilies are strict about it.', 'info'); return false; }
  if (G.money && !G.money.pay(.25, 'A coin for the lily pool', { category: 'fun', venue: CONS_VENUES.place })) return false;
  S.wishDay = d; safe(() => G.needs.add('fun', 4)); bubble(G.player, pick(['*plink*', 'I wish... no, cannot say it out loud.'])); G.emit('conservatory:wish'); toast('Your coin slides off a lily pad and winks at the bottom.', 'good', 3400); return true;
}
const pick = a => a[Math.floor(Math.random() * a.length)];

/* ---------- the guided tour ---------- */
function talkDocent(doc, tour) {
  if (tour.on) { if (!tour.joined) { if (!hasTicket()) { bubble(doc, 'You will need a garden ticket to come through the gates with us!'); return; } tour.joined = true; bubble(doc, 'Welcome along! Stay close, I talk quietly.'); toast('You join the tour. You will follow Wendell on your own; walk off whenever you like.', 'good', 4200); } else bubble(doc, 'Keep up at the back!'); return; }
  const nt = nextTour();
  say([{ who: 'Wendell, docent', text: nt ? `Next tour is at ${clock(nt)}, from right here. Seven stops, every house in the garden.` : 'That was my last scheduled tour today. Daily at ten, one and four.' }, { who: 'Wendell, docent', text: 'But it is quiet just now. I could take you round myself, if you like.' }]).then(() => choose('Take a tour with Wendell?', [{ label: 'Yes, show me round now', sub: 'About two hours of game time. Free with a ticket.', value: 1, disabled: !hasTicket() }, { label: 'Maybe later', value: 0 }], hasTicket() ? {} : { text: 'You need a garden day ticket first (the desk is right here).' })).then(v => { if (v !== 1) return; const sc = scene(); if (sc && sc.cons && sc.cons.startTour(true)) { tour.joined = true; toast('The tour sets off. Follow Wendell: he stops at every house.', 'good', 3800); } });
}
function tourDone(tour) {
  const S = st(), n = tour.seen || 0;
  if (n >= 5) { S.tours++; safe(() => { G.needs.add('fun', 14); G.needs.add('social', 6); G.skills.addXp('logic', 20); G.needs.addMoodlet('inspired'); }); const M = { lily: 'lily', palm: 'coconut', grotto: 'orchid', butterfly: 'butterfly', desert: 'saguaro', koi: 'koi', show: 'show' }; for (const z in tour.stops || {}) if (M[z] && S.facts[M[z]] === undefined) S.facts[M[z]] = G.now().day;
    G.emit('conservatory:tour', n); toast(`Tour complete (${n} of 7 stops). Wendell shakes your hand. Plant facts: ${Object.keys(S.facts).length}/${FACTS.length}.`, 'good', 5200); }
  else toast(`You drifted away from the tour after ${n} stop${n === 1 ? '' : 's'}. Wendell waves anyway.`, 'info', 3800);
}

/* ---------- Hattie's opportunity: three rare cuttings ---------- */
const GOAL = 'cons_cuttings';
const goalText = () => { const c = st().chain, n = Object.keys(c.got).length; return c.st === 2 ? 'Bring the three cuttings to Hattie at the conservatory' : `Find rare cuttings for Hattie (${n}/3)`; };
function setGoal() {
  const c = st().chain; if (!G.goals) return;
  if (c.st === 1 || c.st === 2) { const g = G.goals.get(GOAL); if (g) { g.text = goalText(); G.emit('goals:change'); } else G.goals.add({ id: GOAL, text: goalText(), group: 'opportunity', placeId: 'conservatory', hint: 'Hattie wants cuttings of three plants growing wild: a Ghost Fern somewhere in Central Park, a Flame Aloe up in the leafy streets, and a Blue Sea-Agave near the waterfront. Each grows beside a bench and glows softly.' }); }
  else if (c.st === 3) safe(() => { if (G.goals.get(GOAL) && !G.goals.isDone(GOAL)) G.goals.complete(GOAL); });
}
function takeCutting(i) {
  const c = st().chain, d = CUT[i]; if (G.busy) return;
  if (c.st !== 1 || c.got[i]) { toast(c.got[i] ? `The ${d.name}. It has already forgiven you for the cutting.` : `A ${d.name}, growing wild where nobody planted it. Somebody who knows plants would love to see this.`, 'info', 4200); return; }
  G.startActivity({ label: 'Taking a cutting', anim: 'work', minutes: 6, rate: 2, done: () => { c.got[i] = 1; const n = Object.keys(c.got).length; if (n >= 3) c.st = 2; setGoal(); G.emit('conservatory:cutting', i, n); if (n >= 3) G.emit('conservatory:chain', 2); toast(`${d.name} cutting wrapped in damp paper (${n}/3).${n >= 3 ? ' That is all three: back to Hattie.' : ''}`, 'good', 4200); } });
}
function talkGardener(g) {
  const c = st().chain, who = 'Hattie, head gardener';
  if (c.st === 0) say([{ who, text: pick(['Morning! Mind the hose. I have watered this bed every day for nineteen years and it has never once said thank you.', 'You look like somebody who notices plants. Most people only notice the gift shop.']) }, { who, text: 'There are three plants growing wild in this city that I cannot get hold of. A Ghost Fern somewhere in the park, a Flame Aloe up the hill, and a Blue Sea-Agave down by the water.' }, { who, text: 'If you ever happen across them, a cutting of each would make an old gardener very happy. No hurry. Plants are patient and so am I.' }])
    .then(() => choose('Keep an eye out for Hattie\'s plants?', [{ label: 'I will keep an eye out', value: 1 }, { label: 'Maybe another time', value: 0 }])).then(v => { if (v === 1) { c.st = 1; setGoal(); G.emit('conservatory:chain', 1); bubble(g, 'Bless you. Take a cutting, never the whole plant!'); toast('New opportunity: rare cuttings for Hattie. Each plant grows beside a bench and glows softly.', 'good', 4600); } else bubble(g, 'Quite right. The offer keeps.'); });
  else if (c.st === 1) { const n = Object.keys(c.got).length, left = CUT.filter((d, i) => !c.got[i]).map(d => `the ${d.name} (${d.where})`); say([{ who, text: n ? `${n} so far! Still missing ${left.join(' and ')}.` : `Nothing yet? No hurry. Try ${left[0]} first.` }]); }
  else if (c.st === 2) say([{ who, text: 'You found all three? Let me see... oh. Oh, look at the roots on that agave. You wrapped them damp, too. Somebody raised you right.' }, { who, text: 'These go in a bed of their own by the front door, with your name on the label. And you take this: a Friend of the Glasshouse pass. The gates are always open for you.' }]).then(() => {
    c.st = 3; G.state.flags.conservatory_pass = true; safe(() => G.money.add(40, 'Thank-you from Hattie'));
    safe(() => G.housing.addFurniture('cons_seed_orchid')); safe(() => G.needs.addMoodlet('inspired')); setGoal(); G.emit('conservatory:chain', 3); const sc = scene(); if (sc && sc.cons) sc.cons.sync();
    toast('Friend of the Glasshouse: free entry for life, $40, and a Moth Orchid on its way to your home. Your Rare Finds bed is by the front door.', 'good', 6500); });
  else say([{ who, text: pick(['Your sea-agave has put on two new leaves. Go and look, it is by the door.', 'The ghost fern sulked for a week and now it will not stop growing. Typical.', 'Friends of the Glasshouse get the good gossip. The orchids are plotting something.']) }]);
}

/* ---------- guide wiring ---------- */
function patchGuide() {
  const e = safe(() => G.guide.get('place:conservatory')); if (!e) return;
  e.price = fmt(CONS_TICKET) + ' garden ticket · hall, cafe and flower show free'; e.type = 'Botanical garden'; e.chapter = 'arts'; e.also = ['outdoors', 'sights', 'eat', 'shop']; e.tags = (e.tags || []).filter(t => !['garden', 'plants', 'butterflies', 'koi', 'tour', 'cafe'].includes(t)).concat(['garden', 'plants', 'butterflies', 'koi', 'tour', 'cafe']);
  e.tryThis = ['Feed the koi', 'Photograph a butterfly', 'Sketch the orchids', 'Join the guided tour (10:00, 13:00, 16:00)', 'Read all twelve plaques', 'Sit and breathe', 'Buy a seedling'];
}

export function init() {
  S = G.defineState('conservatory', () => ({ ticketDay: -1, visits: 0, facts: {}, photos: {}, sketches: 0, koi: 0, sits: 0, tours: 0, wishDay: -1, chain: { st: 0, got: {} } })); G.on('load', () => { st(); setGoal(); });
  G.conservatory = {
    isOpen, hours: CONS_HOURS, ticket: CONS_TICKET, hasTicket, buyTicket, enter, desk, arrived,
    facts: () => FACTS.map(f => Object.assign({ got: st().facts[f.id] !== undefined }, f)), readFact,
    photos: () => BUTTERFLIES.map(b => ({ id: b.id, name: b.name, note: b.note, quality: st().photos[b.id] || 0 })), photograph, photo: { snap: () => photoRun && photoRun.snap(), state: () => (photoRun ? { species: photoRun.species, pos: photoRun.pos() } : null), cancel: () => photoRun && photoRun.cancel() },
    sketches: () => st().sketches, sketch, sit, feedKoi, buySeedling, wish, lookBoard,
    tour: { times: TOUR_TIMES, next: nextTour, start: () => { const sc = scene(); return !!(sc && sc.cons && sc.cons.startTour(true)); }, join: () => { const sc = scene(); if (sc && sc.cons && sc.cons.tour.on && hasTicket()) { sc.cons.tour.joined = true; return true; } return false; }, state: () => { const sc = scene(), t = sc && sc.cons && sc.cons.tour; return t ? { on: t.on, stop: t.i, joined: t.joined, seen: t.seen } : null; } },
    talkDocent, tourDone, talkGardener, takeCutting, chain: () => st().chain, cuttings: () => cuts.map((p, i) => p && { i, name: CUT[i].name, x: p.x, y: p.y, got: !!st().chain.got[i] }).filter(Boolean), rareDone: () => st().chain.st === 3,
    door: () => door, stats: () => { const S = st(); return { visits: S.visits, facts: Object.keys(S.facts).length, photos: Object.keys(S.photos).length, sketches: S.sketches, koi: S.koi, sits: S.sits, tours: S.tours, chain: S.chain.st }; },
  };
  // the door must exist before a save made inside the conservatory exits to a city that was never built this session
  G.on('room:build', sc => { if (sc && sc.def && sc.def.showpiece === 'conservatory' && !built) safe(() => ensure(getCity())); });
  G.on('scene', s => { if (!s || s.id !== 'city' || s._conservatory || !s.world) return; s._conservatory = true; try { wire(s); } catch (e) { console.warn('conservatory', e); } setGoal(); });
  G.on('guide:rebuilt', patchGuide);
  // closing time: visitors are walked to the door
  G.on('minutes', () => { const sc = scene(); if (!sc || G.busy || G.modal || G.cutscene) return; const h = G.now().hf; if (h >= CONS_HOURS[1] + .3 || h < CONS_HOURS[0] - 3) { if (sc._closing) return; sc._closing = true; toast('"Closing time, I am afraid." A gardener walks you to the door.', 'info', 4200); exitRoom({ poi: DOOR }).then(() => { sc._closing = false; }, () => { sc._closing = false; }); } });
}
