// Maple Bay City Hall — the Rotunda (room `cityhall`, 28 x 22, marble, two storeys with a gallery) + the helpers and fixture handlers shared by the other City Hall rooms
// (cityhall_council.js: council chamber; cityhall_records.js: permits & records hall + basement archive; cityhall_upper.js: clerk's office with the wedding room, mayor's office, clock tower).
// Gameplay lives in sim/cityhall.js (G.cityhall). City door `door:cityhall` (runtime poi on the existing building). Exits (doormats with `to`, so the nav arrow can route):
//   front doors -> city, "Council Chamber" -> int:cityhall_council, "Permits & Records" -> int:cityhall_records, the grand stair -> int:cityhall_clerk, "Archive" -> int:cityhall_archive.
// The rotunda runs its own life (def.noCrowd): scene.life = { crowd, walkers, count() }; scene.hot = { sync(), info, guard, janitor, mayor, aides, kids, teacher, mayorWalk(to?) (the mayor crosses with staff),
//   school(on) (force the school party), group }.
// Fixture tags handled here (only inside City Hall rooms): ch_seal, ch_model, ch_portrait, ch_desk (item.p.kind), ch_directory, ch_ballot, ch_statue, ch_seat, ch_notices, ch_podium, ch_board, ch_signup, ch_ticket, ch_window,
//   ch_wait, ch_photo, ch_forms, ch_registrar, ch_mayordesk, ch_keycase, ch_shelves, ch_mapcase, ch_microfilm, ch_photos, ch_news, ch_clockwork, ch_bell, ch_scope, ch_plaque, window (item.balcony).
import { G } from '../../core/game.js';
import { GT } from '../../engine/world.js';
import { defineRoom, registerFixture } from '../interior.js';
import { bubble } from '../../ui/kit.js';
import { crowd, walkers } from './_show_life.js';
import { specs } from './_airport_life.js';
import { registerInfo } from './unique_rooms.js';
import { O, setP, mk, step, go, showOb, softEnv, dress, seatsOf, people } from './hotel.js';
import { marbleFloor } from '../../art/showpiece/_hotel_lib.js';
import { CR, CV, NAME, PEOPLE, MODEL_D, hallOpen, councilOn, weddingAt } from '../../data/cityhall.js';

/* ---------------- shared helpers ---------------- */
export const CH = () => G.cityhall, pick = a => a[Math.floor(Math.random() * a.length)];
export const only = fn => (fx, scene) => (scene.def && scene.def.showpiece === 'cityhall' ? fn(fx, scene) : null);
/** arrival spots (room coords) of every door of every room */
export const AT = {
  hall: { door: { x: 14, y: 19.6, dir: 3 }, council: { x: 2.4, y: 5.2, dir: 0 }, records: { x: 2.4, y: 13.4, dir: 0 }, stairs: { x: 14, y: 6.4, dir: 1 }, archive: { x: 17.9, y: 2.5, dir: 1 } },
  council: { door: { x: 12.2, y: 16.3, dir: 3 } }, records: { door: { x: 13, y: 14.3, dir: 3 } }, clerk: { stairs: { x: 5, y: 12.1, dir: 3 }, mayor: { x: 2.5, y: 2.4, dir: 1 }, tower: { x: 8.95, y: 2.4, dir: 1 } },
  mayor: { door: { x: 8, y: 10.3, dir: 3 } }, archive: { door: { x: 11, y: 12.1, dir: 3 } }, tower: { door: { x: 7, y: 9.2, dir: 3 } },
};
/** go to a City Hall room, arriving at one of its doors */
export const goRoom = (room, at) => G.go('int:' + CR[room], Object.assign({}, AT[room][at], { x: AT[room][at].x + O, y: AT[room][at].y + O }));
/** item list builders for a room definition */
export function kit() { const items = [], spots = []; const fid = id => (id.includes('.') ? id : 'furn.cityhall.' + id);
  return { items, spots, H: (id, x, y, p, o) => { const it = Object.assign({ id: fid(id), x, y, p: p || {} }, o); items.push(it); return it; }, Wl: (id, wall, at, p, o) => { const it = Object.assign({ id: fid(id), wall, at, p: p || {} }, o); items.push(it); return it; }, S: (x, y, dir, o) => spots.push(Object.assign({ x, y, dir }, o)) }; }
export const by = (sc, k) => sc.world.objs.filter(o => o.data && o.data[k]);
export const fade = (c, out, dt) => { c.alpha = Math.max(0, Math.min(1, (c.alpha === undefined ? (out ? 1 : 0) : c.alpha) + (out ? -dt * 2.5 : dt * 2.5))); if (!out && c.alpha >= 1) c.alpha = undefined; return out ? c.alpha <= 0 : c.alpha === undefined; };
export const idle = (c, dt) => { c.t += dt; c.moving = false; if (c._hold > 0) c._hold -= dt; };
export const LINES = {
  citizen: ['I only came in to ask one question. That was Tuesday.', 'Look up. No, really. Look UP.', 'The fountain will be fixed soon. I have it in writing. From 2019.', 'Window three is the nice one. Do not tell window two I said so.', 'My grandfather voted in this room. He voted against it being built.',
    'They marry people upstairs on Saturdays. You can hear the cheering from the stairs.', 'Council is Tuesday and Thursday. Bring a cushion.', 'The plinth has been "reserved" since 1934. For WHOM?', 'A hundred and twelve steps to the clock. I counted. Then I lay down.', 'I love a building that echoes.',
    'The little model lights up if you press the buttons. I pressed all of them.', 'It still says TOWN HALL over the door. We have been a city since 1961.'],
  lawyer: ['My client denies everything, including the hedge.', 'We settle by Friday or I buy the coffee.', 'It is a boundary dispute. Eleven inches. Since 1949.', 'I bill in six-minute units. This chat is free. Mostly.'],
  kid: ['Is the mayor a king?', 'I pressed the button and the airport lit UP.', 'Miss said do not touch the seal. I touched the seal.', 'There is a pigeon statue vote! I am voting pigeon.', 'When I am mayor the fountain will be lemonade.'],
  teacher: ['Walking feet, year four. WALKING feet.', 'Who can tell me what a council does? No, Dmitri, not "argue".', 'This is the seal of the city. We do not lick the seal.'],
  guard: ['Morning. Anything metal? Keys, coins, valve keys? Go on through.', 'Chamber is to the left, permits past that, weddings upstairs.', 'Thirty years on this door. The only thing ever stolen was my sandwich.', 'If you find a square brass key, half the building is looking for it.'],
  janitor: ['Mind the wet patch. The seal has to shine.', 'Hundred and thirty years of feet on this marble. I know every scuff.', 'They never fix the fountain but they wax the floor weekly. Priorities.', 'The leaf is the hard part. All those points.'],
  aide: ['The mayor has four minutes.', 'Walk and talk, walk and talk.', 'She has read it. She has thoughts. They are in the margins.'],
  mayor: ['Good to see you! Lovely day for democracy.', 'The fountain? Soon. Very soon. Ask me again soon.', 'Walk with me. No, not that fast.'],
};

/* ---------------- the rotunda ---------------- */
const W = 28, D = 22, K = kit(), { items, spots, H, Wl, S } = K, CX = 14, CY = 11;
function build() {
  Wl('furn.hotel.gallery', 'y', 0, { w: 28 }, { mount: 3.6 }); Wl('furn.hotel.gallery', 'x', 0, { w: 22 }, { mount: 3.6 });
  [0, 1, 2].forEach(k => Wl('portrait', 'y', 1 + k * 2, { k }, { portrait: k })); [3, 4, 5].forEach(k => Wl('portrait', 'y', 20 + (k - 3) * 1.8, { k }, { portrait: k }));
  Wl('niche', 'y', 7.2, {}); H('statue', 7.8, .35, {}, { statue: 1 }); Wl('furn.lobby.restroom', 'y', 10.2, { c: '#5a4030', dc: '#2f6f5f' }); Wl('furn.lobby.restroom', 'y', 11.35, { c: '#5a4030', dc: '#22304e' });
  H('furn.hotel.grandstair', 12.5, .3, { n: 12 }); Wl('furn.hotel.doorway', 'y', 16.4, { name: 'ARCHIVE', c: '#3a4250', w: 3, lit: 1 }); Wl('noticeboard', 'y', 25.5, {});
  Wl('furn.hotel.doorway', 'x', 3, { name: 'COUNCIL CHAMBER', c: '#2f6f5f', w: 4.4, lit: 1 }); Wl('plaque', 'x', 8, { t: 'RESERVED' }, { plaque: 1 }); Wl('furn.hotel.doorway', 'x', 11, { name: 'PERMITS + RECORDS', c: '#22304e', w: 4.8, lit: 1 });
  for (const at of [.3, 6.6, 9.9, 15.8, 19.5, 27.4]) Wl('furn.lobby.sconce', 'y', at, {}); for (const at of [1.4, 9.6, 17.2, 20.6]) Wl('furn.lobby.sconce', 'x', at, {});
  for (const at of [1, 10, 19]) Wl('bunting', 'y', at, { w: 8 }, { bunt: 1 }); for (const at of [1, 12]) Wl('bunting', 'x', at, { w: 9 }, { bunt: 1 });
  H('seal', CX - 3, CY - 3, {}, { seal: 1 }); H('furn.hotel.chandelier', CX - 1.2, CY - 1.2, { r: 1.2 }, { z: 4 });
  for (let k = 0; k < 8; k++) { const a = Math.PI / 8 + k * Math.PI / 4; H('furn.hotel.column', Math.round((CX + Math.cos(a) * 5.6 - .4) * 2) / 2, Math.round((CY + Math.sin(a) * 5.6 - .4) * 2) / 2, { h: 5.75 }); }
  H('flagpole', 11.5, 4.4, {}); H('flagpole', 16, 4.4, { k: 'bay' });
  H('desk', 5, 16.4, { kind: 'info', w: 3.4 }, { info: 1 }); H('directory', 9.4, 18.6, {});
  H('desk', 16.6, 18.4, { kind: 'guard', w: 2.5 }); H('detector', 13.35, 19, {});
  H('model', 20.6, 13.6, {}, { model: 1 }); H('ballotbox', 19.6, 5.4, {}, { ballot: 1 });
  H('desk', 22.6, 2.6, { kind: 'shop', w: 3 }, { venue: CV.shop }); H('furn.hotel.shopcase', 22.6, .2, { w: 3 }); S(24.1, 2.15, 1, { kind: 'staff', label: 'The Civic Shop', lines: ['The pigeon plush outsells the flag three to one.', 'Toy gavels are behind the mugs. Bang responsibly.', 'Everything here is tax, lovingly recycled.'] });
  H('bench', 2, 7.6, { w: 3 }, { flip: true }); H('bench', 2, 16.2, { w: 3 }, { flip: true }); H('bench', 25.6, 6, { w: 3, dir: 3 }, { flip: true }); H('bench', 25.6, 9.6, { w: 3, dir: 3 }, { flip: true }); H('bench', 21.2, 18.4, { w: 3 });
  for (const [x, y, s] of [[9.4, 20.4, 1], [17, 20.4, 2], [3.4, 1, 3], [18.2, 6.2, 4]]) H('planter', x, y, { seed: s }, { plant: 1 });
  H('furn.hotel.carpet', 12.9, 15, { w: 2.2, d: 5.6, c: '#2f6f5f' });
  // people
  S(4.2, 18.6, 3, { p: .7 }); S(6.4, 18.5, 3, { busy: 1 }); S(21, 17.7, 3, { p: .6 }); S(24.4, 17.5, 3, { busy: 1, anim: 'phone' }); S(19.9, 7, 2, { p: .5 }); S(10.3, 5.6, 1, { p: .5, anim: 'phone' }); S(26.6, 3.9, 3, { p: .5 });
  S(4.6, 10.4, 0, { p: .8, anim: 'talk', label: 'Lawyer', lines: LINES.lawyer, law: 1 }); S(5.5, 10.5, 2, { p: .8, anim: 'talk', label: 'Lawyer', lines: LINES.lawyer, law: 1 }); S(23.4, 9.2, 1, { busy: 1, anim: 'talk', label: 'Lawyer', lines: LINES.lawyer, law: 1 }); S(23.6, 10.2, 3, { busy: 1, label: 'Lawyer', lines: LINES.lawyer, law: 1 });
  S(8.5, 2.9, 3, { p: .5 }); S(3, 3.4, 3, { busy: 1, age: 'elder' }); S(21.2, 3.2, 3, { p: .45 });
}
build();
const N = { d0: [14, 20.3], d1: [14, 17], cl: [9.6, 12.6], cr: [18.4, 12.6], n: [14, 6.6], st: [14, 5.6], co: [2.2, 5.2], re: [2.2, 13.4], ar: [17.9, 2.2], inf: [6.7, 18.2], mod: [22.8, 17.5], sh: [24.1, 4.3], bal: [20, 6.9], nb: [26.6, 1.9], w1: [8.4, 8.2], e1: [19.6, 8.6] };
const ROUTES = [['d0', 'd1', 'cl', 're'], ['re', 'cl', 'd1', 'd0'], ['d0', 'd1', 'cl', 'w1', 'co'], ['co', 'w1', 'cl', 'd1', 'd0'], ['d0', 'd1', 'inf*', 'cl', 're'], ['d0', 'd1', 'cr', 'mod*', 'cr', 'd1', 'd0'], ['d0', 'd1', 'cr', 'e1', 'n', 'st'], ['st', 'n', 'w1', 'cl', 'd1', 'd0'],
  ['d0', 'd1', 'cr', 'e1', 'ar'], ['ar', 'e1', 'cr', 'd1', 'd0'], ['re', 'cl', 'w1', 'n', 'st'], ['d0', 'd1', 'cr', 'e1', 'sh*', 'e1', 'cr', 'd1', 'd0'], ['co', 'w1', 'n', 'e1', 'bal*', 'e1', 'cr', 'd1', 'd0'], ['d0', 'd1', 'cr', 'e1', 'nb*', 'e1', 'cr', 'd1', 'd0']];
const FACTS = [['mod', 'This is all of Maple Bay, in miniature. Find your street. No, do not lean on the glass.'], ['por', 'These are the mayors. That one kept bees. That one lost a fountain key.'], ['seal', 'The seal: a maple leaf over the bay, 1887. Now everybody look UP at the dome.'], ['sta', 'This plinth has been waiting for a statue since 1934. The city votes on it. Democracy is slow, year four.']];
const GSTOP = { mod: [22.8, 18.2], por: [3.6, 2.6], seal: [14, 15.6], sta: [8.4, 3.2] };

defineRoom({ id: CR.hall, name: NAME + ' — the Rotunda', w: W, d: D, zoom: 0, music: 'quiet', noCrowd: true, showpiece: 'cityhall', venue: CV.place, floor: GT.f_stone, bg: '#15161f', edge: '#5a5448',
  wall: { color: '#ece2cc', trim: '#8a6a3a', h: 5.8, rail: 3.55 },
  exits: [{ x: 14, y: 21.4, label: 'Exit to City Hall Plaza', poi: 'door:cityhall' },
    { x: 1.2, y: 5.2, label: 'Council Chamber', to: 'int:' + CR.council, use: () => goRoom('council', 'door') }, { x: 1.2, y: 13.4, label: 'Permits & Records', to: 'int:' + CR.records, use: () => goRoom('records', 'door') },
    { x: 14, y: 5.4, label: 'Stairs up: City Clerk, Weddings, Mayor, Clock Tower', to: 'int:' + CR.clerk, use: () => goRoom('clerk', 'stairs') }, { x: 17.9, y: 1.3, label: 'Stairs down to the Archive', to: 'int:' + CR.archive, use: () => CH() && CH().toArchive() }],
  spawn: { x: 14, y: 19.6, dir: 3 }, items, npcSpots: spots,
  setup(sc) {
    const Wd = sc.world, P = people(), AP = specs(), statue = by(sc, 'statue')[0], model = by(sc, 'model')[0], ballot = by(sc, 'ballot')[0], plaque = by(sc, 'plaque')[0], bunts = by(sc, 'bunt'), plants = by(sc, 'plant');
    // floor: cream / grey marble, a dark border, a ring of green marble around the seal with eight brass rays
    Wd.decal({ x0: O, y0: O, x1: O + W, y1: O + D, draw(Rr) { const mf = marbleFloor('#efe8da', '#ddd3c0', 2, '#b8ad98'), cx = O + CX, cy = O + CY;
      Rr.qz(O, O + W, O, O + D, 0, (x, y) => { const X = x - O, Y = y - O, e = Math.min(X, Y, W - X, D - Y), dd = Math.hypot(x - cx, y - cy); if (e < .35) return '#4a5a50'; if (e < .5) return '#c89a4a';
        if (dd < 4.6) { if (dd > 4.45) return '#c89a4a'; if (dd > 4.25) return '#4a5a50'; if (dd > 3.05) { const a = Math.atan2(y - cy, x - cx), k = Math.abs(((a / (Math.PI / 8)) % 2 + 2) % 2 - 1); return k < .1 ? '#c89a4a' : (Math.floor((a + 6.283) / (Math.PI / 8)) & 1) ? '#2f6f5f' : '#3a7a68'; } return '#f4eee0'; }
        if (dd < 7.2 && dd > 7.05) return '#c89a4a'; const fx = X / 2 - Math.floor(X / 2), fy = Y / 2 - Math.floor(Y / 2); if (Math.abs(fx - .5) + Math.abs(fy - .5) > .92) return '#4a5a50'; return mf(X, Y); }); } }); Wd.version++;
    Wd.lights.push({ x: O + CX, y: O + CY, z: 0, r: 9, c: '#ffe9b0' }, { x: O + 6.7, y: O + 17.6, z: 0, r: 4, c: '#ffe9b0' }, { x: O + 22.8, y: O + 15.4, z: 0, r: 5, c: '#ffe2a0' }, { x: O + 14, y: O + 19, z: 0, r: 4, c: '#ffe9b0' }, { x: O + 24, y: O + 3, z: 0, r: 4, c: '#ffe9b0' }, { x: O + 8.4, y: O + 1.6, z: 0, r: 3.5, c: '#ffe9b0' }, { x: O + 14, y: O + 3, z: 0, r: 4.5, c: '#ffe9b0' });
    // static crowd + lane walkers
    const seats = seatsOf(sc, /cityhall\.bench/, { add: (f, i, n) => ({ busy: n % 3 === 1 ? 1 : 0, anim: n % 4 === 0 ? 'read' : undefined, p: .45 }) });
    const cr = crowd(sc, sc.def.npcSpots.concat(seats), { seed: 1887, fill: .7, lines: LINES.citizen });
    dress(cr, (s, c) => (s.law ? P.formal[Math.floor(c.roll * P.formal.length)] : s.kind === 'staff' ? P.concierge[Math.floor(c.roll * 3)] : null));
    const lane = () => { const r = pick(ROUTES), pts = r.map(k => { const st = k.endsWith('*'), n = N[k.replace('*', '')]; return Object.assign({ x: n[0] + O + (Math.random() - .5) * .5, y: n[1] + O + (Math.random() - .5) * .4 }, st ? { wait: 6 + Math.random() * 8, pose: Math.random() < .3 ? 'phone' : null, dir: 3 } : null); }); return { pts, kind: Math.random() < .25 ? 'bag' : Math.random() < .3 ? 'stroll' : 'walk' }; };
    const wk = walkers(sc, { n: 12, route: lane, lines: LINES.citizen, label: 'Citizen' });
    // named staff
    const info = mk(sc, P.concierge[1], 6.7, 15.95, 1, PEOPLE.info, c => CH() && CH().info(c));
    const guard = mk(sc, Object.assign({}, AP.adult[5], { outfit: 'police' }), 17.85, 17.95, 1, PEOPLE.guard, c => CH() && CH().guard(c));
    const janitor = mk(sc, Object.assign({}, AP.elder[2], { outfit: null, top: 'jacket', topColor: '#5a7a8a', bottom: 'slacks', bottomColor: '#3a4a58', hat: 'cap', hatColor: '#5a7a8a' }), 17.6, 12.4, 2, PEOPLE.janitor, LINES.janitor); janitor.speed = 1; let jan = 0, janT = 0;
    const mayor = mk(sc, CH() && CH().mayorSpec ? CH().mayorSpec() : P.formal[0], 14, 5.8, 1, PEOPLE.mayor, c => CH() && CH().talkMayor(c, 'hall')); mayor.hidden = true; mayor.speed = 1.9;
    const aides = [0, 1].map(i => { const c = mk(sc, P.formal[3 + i * 5], 14, 5.8, 1, 'Mayoral aide', LINES.aide); c.hidden = true; c.speed = 2; c.carry = true; c.poseOpts = { item: 'box', itemColor: '#c8b088' }; return c; });
    const teacher = mk(sc, AP.staff[2], 22.8, 18.2, 3, 'Ms. Okoro, year four', LINES.teacher), kids = [0, 1, 2, 3, 4, 5].map(i => { const c = mk(sc, AP.kid[i % AP.kid.length], 22 + (i % 3) * .7, 19 + Math.floor(i / 3) * .6, 3, 'Schoolkid', LINES.kid); c.speed = 2.2; return c; }); teacher.speed = 1.5;
    let gi = 0, gT = 4, gSaid = false, schoolForce = null, walk = null, walkT = 30, tick = 0, lvl = -1, lastLook = '';
    const groupTo = i => { gi = i % FACTS.length; gSaid = false; const g = GSTOP[FACTS[gi][0]]; if (!go(teacher, Wd, g[0], g[1])) { teacher.x = g[0] + O; teacher.y = g[1] + O; } kids.forEach((k, j) => { const x = g[0] + ((j % 3) - 1) * .8 + .2, y = g[1] + .9 + Math.floor(j / 3) * .7; if (!go(k, Wd, x, y)) go(k, Wd, g[0], g[1] + .8); }); };
    const schoolOn = () => { if (schoolForce !== null) return schoolForce; const n = G.now(); return n.weekday < 5 && n.hf >= 10 && n.hf < 12 && hallOpen(n); };
    function mayorWalk(to) { if (walk) return false; const dest = to || (councilOn(G.now()) || Math.random() < .5 ? 'co' : 'd0'), from = dest === 'st' ? 'd0' : 'st', a = N[from], b = N[dest], grp = [mayor].concat(aides);
      grp.forEach((c, i) => { c.hidden = false; c.alpha = 0; c.x = a[0] + O + (i ? (i === 1 ? -.7 : .7) : 0); c.y = a[1] + O + (i ? .5 : 0); c.path = null; go(c, Wd, b[0] + (i ? (i === 1 ? -.5 : .5) : 0), b[1] + (i ? .4 : 0)); });
      walk = { grp, t: 0, said: false }; return true; }
    const sync = () => {
      const n = G.now(), h = n.hf, S0 = CH() && CH().look ? CH().look() : {}, key = JSON.stringify(S0); if (key !== lastLook) { lastLook = key;
        setP(statue, { k: S0.statue || null }); for (const p of plants) setP(p, { k: S0.flowers || 'fern' }); for (const b of bunts) { b.hidden = !S0.bunting; if (S0.bunting) setP(b, { c: S0.buntingC }); }
        setP(model, { fixed: S0.fixed ? 1 : 0 }); setP(ballot, { shut: S0.ballotOpen ? 0 : 1 }); plaque.hidden = !S0.fixed; if (S0.fixed) setP(plaque, { t: 'FOUNTAIN RESTORED', t2: 'BY ' + String(S0.hero || 'A CITIZEN').toUpperCase().slice(0, 14) }); }
      const open = hallOpen(n), L = !open ? .1 : h < 9 ? .45 : h < 12 ? .8 : h < 14 ? .6 : h < 17 ? .75 : .5, busy = (h >= 10 && h < 16 && n.weekday < 5) || councilOn(n) || !!weddingAt(n);
      if (L !== lvl || busy !== sc.life.busy) { lvl = L; sc.life.busy = busy; for (const c of cr.list) { const s = c.spot; c.hidden = s.kind === 'staff' ? !open : s.busy ? !busy || c.roll > L + .3 : c.roll > (s.p !== undefined ? Math.min(s.p, L + .1) : L); } wk.setActive(Math.round(1 + L * 12)); }
      info.hidden = !open; guard.hidden = false; janitor.hidden = !open && h > 6 && h < 22 ? false : !(h >= 7 && h < 19); const sch = schoolOn(); if (teacher.hidden !== !sch) { teacher.hidden = !sch; kids.forEach(k => { k.hidden = !sch; }); if (sch) { gT = 3; groupTo(0); } }
    };
    sc.life = { crowd: cr, walkers: wk, count: () => cr.count() + wk.count() + (teacher.hidden ? 0 : 7) + 3, busy: null };
    sc.hot = { sync, info, guard, janitor, mayor, aides, kids, teacher, mayorWalk, school(on) { schoolForce = on === undefined ? null : on; sync(); }, group: () => gi, nodes: N, model };
    sc.env = softEnv(Wd, .62, .42); sync();
    const u0 = sc.update; sc.update = (dt, gm) => {
      u0(dt, gm); cr.update(dt); wk.update(dt); if ((tick -= dt) <= 0) { tick = 1.5; sync(); }
      idle(info, dt); if (!(info._hold > 0)) { info.dir = 1; info.pose = Math.floor(G.time / 6) % 3 === 0 ? 'work' : null; } idle(guard, dt); if (!(guard._hold > 0)) guard.dir = 1;
      // the janitor polishes his way round the seal
      if (!janitor.hidden) { if (!step(janitor, Wd, dt)) { janitor.pose = 'work'; if ((janT -= dt) <= 0) { janT = 6 + Math.random() * 5; jan = (jan + 1) % 8; const a = jan * Math.PI / 4; janitor.pose = null; go(janitor, Wd, CX + Math.cos(a) * 3.7, CY + Math.sin(a) * 3.7); } else janitor.faceTo(O + CX, O + CY); } }
      // the school party
      if (!teacher.hidden) { const mv = step(teacher, Wd, dt); for (const k of kids) { if (!step(k, Wd, dt) && !(k._hold > 0)) { k.faceTo(teacher.x, teacher.y); k.pose = Math.floor(G.time / 3 + k.x * 7) % 5 === 0 ? 'cheer' : null; } else k.pose = null; }
        if (!mv) { if (!gSaid) { gSaid = true; gT = 13; teacher.dir = 1; bubble(teacher, FACTS[gi][1], 5200); } else if ((gT -= dt) <= 0) groupTo(gi + 1); if (gSaid && Math.abs(gT - 6) < dt) bubble(pick(kids), pick(LINES.kid), 3200); } }
      // the mayor crossing with staff
      if (walk) { walk.t += dt; let moving = false; for (const c of walk.grp) { if (step(c, Wd, dt)) moving = true; if (walk.t < 1) fade(c, false, dt); } if (!walk.said && walk.t > 2.5) { walk.said = true; bubble(walk.grp[1 + Math.floor(Math.random() * 2)], pick(LINES.aide), 3200); }
        if (!moving || walk.t > 40) { let gone = true; for (const c of walk.grp) if (!fade(c, true, dt)) gone = false; if (gone) { for (const c of walk.grp) { c.hidden = true; c.alpha = undefined; } walk = null; walkT = 50 + Math.random() * 70; } } }
      else if ((walkT -= dt) <= 0) { const n = G.now(); walkT = 60; if (hallOpen(n) && n.weekday < 5 && n.hf >= 9 && n.hf < 20.4 && !(CH() && CH().mayorBusy && CH().mayorBusy())) mayorWalk(); }
    };
    const e0 = sc.onEnter; sc.onEnter = (o, pv) => { e0(o, pv); sync(); if (CH()) CH().arrived(sc, pv); };
  },
});

registerInfo(NAME, {
  blurb: 'The marble hall under the clock tower on City Hall Plaza (the stone over the door still says TOWN HALL). A rotunda with a painted dome and the whole city under glass, the Council Chamber with its live vote board, the Permits & Records hall, the clerk and the Saturday wedding room upstairs, the mayor behind a door, the archive in the basement and 112 steps up to the clock.',
  signature: 'A council evening (Tuesday and Thursday, 18:30): four motions, a podium anybody may use, and the vote lighting up on the board.',
  tryThis: ['Stand on the seal and look up at the dome', 'Press the brass buttons on the model of the city', 'Read the plaques under the mayors', 'Take a number in Permits & Records and get a Resident Card with your photo', 'Pay or dispute a bill in person at window 1', 'Look up the history of any home at window 4', 'Sit in the gallery on a council evening, or sign up to speak', 'Vote in the weekly public ballot', 'Throw confetti at a Saturday wedding (11, 1 and 3)', 'Spin the microfilm reader in the archive', 'Climb to the clock tower at lunchtime and wind the clock', 'Find out why the plaza fountain has been "fixed soon" for years'],
  activities: ['ch_dome', 'ch_model', 'ch_queue', 'ch_resident_id', 'ch_bills', 'ch_records', 'ch_council', 'ch_speak', 'ch_ballot', 'ch_wedding', 'ch_microfilm', 'ch_clock', 'seat'], kind: 'civic',
});

export function init() {
  const F = (tag, fn) => registerFixture(tag, only(fn)), c = () => CH();
  F('ch_seal', () => ({ label: 'Stand on the seal and look up', hit: 20, h: .3, range: 2.2, use: () => c() && c().lookUp() }));
  F('ch_model', (fx, sc) => ({ label: 'The model of Maple Bay', hit: 18, use: () => c() && c().model(fx, sc) }));
  F('ch_portrait', fx => ({ label: 'Portrait of a mayor', hit: 10, h: 2.2, use: () => c() && c().portrait(fx.item.p.k || 0) }));
  F('ch_desk', (fx, sc) => { const k = fx.item.p.kind || 'info'; if (k === 'info') return { label: 'Information desk', hit: 14, use: () => c() && c().info(sc.hot && sc.hot.info) }; if (k === 'shop') return { label: 'The Civic Shop', hit: 14, shop: CV.shop, use: () => c() && c().shop() }; if (k === 'guard') return { label: 'Security desk', hit: 12, use: () => c() && c().guard(sc.hot && sc.hot.guard) };
    if (k === 'clerk') return { label: 'City Clerk', hit: 14, use: () => c() && c().clerk(sc) }; if (k === 'licence') return { label: 'Marriage licences', hit: 14, use: () => c() && c().licence(sc) }; if (k === 'sec') return { label: "The mayor's secretary", hit: 14, use: () => c() && c().secretary(sc) }; return { label: 'Archive desk', hit: 14, shop: CV.archive, use: () => c() && c().archivist(sc) }; });
  F('ch_directory', () => ({ label: 'Brass directory', hit: 14, h: 2, use: () => c() && c().directory() }));
  F('ch_ballot', () => ({ label: 'Ballot box', hit: 12, use: () => c() && c().ballot.open() }));
  F('ch_statue', () => ({ label: 'The reserved plinth', hit: 14, h: 2, use: () => c() && c().statue() }));
  F('ch_seat', (fx, sc) => ({ label: sc.roomId === CR.council ? 'Sit in the public gallery' : fx.item.wed ? 'Sit with the wedding guests' : 'Sit', hit: 12, use: () => c() && c().sit(fx, sc) }));
  F('ch_notices', () => ({ label: 'Public notices', hit: 12, h: 1.8, use: () => c() && c().notices() }));
  F('ch_podium', (fx, sc) => ({ label: 'The podium', hit: 12, use: () => c() && c().podium(fx, sc) }));
  F('ch_board', (fx, sc) => ({ label: 'Vote board', hit: 16, h: 2.4, use: () => c() && c().board(sc) }));
  F('ch_signup', (fx, sc) => ({ label: 'Sign up to speak', hit: 12, use: () => c() && c().signup(sc) }));
  F('ch_ticket', (fx, sc) => ({ label: 'Take a number', hit: 12, use: () => c() && c().takeNumber(sc) }));
  F('ch_window', (fx, sc) => ({ label: 'Window ' + (fx.item.p.n || 1) + ' · ' + (fx.item.wname || ''), hit: 16, use: () => c() && c().window(fx.item.p.n || 1, sc) }));
  F('ch_wait', (fx, sc) => ({ label: 'Sit and wait for your number', hit: 12, use: () => c() && c().wait(fx, sc) }));
  F('ch_photo', (fx, sc) => ({ label: 'Photo booth', hit: 14, use: () => c() && c().photo(fx, sc) }));
  F('ch_forms', () => ({ label: 'Fill in a form', hit: 12, use: () => c() && c().forms() }));
  F('ch_registrar', (fx, sc) => ({ label: 'The register', hit: 12, use: () => c() && c().registrar(sc) }));
  F('ch_mayordesk', (fx, sc) => ({ label: "The mayor's desk", hit: 16, use: () => c() && c().mayorDesk(sc) }));
  F('ch_keycase', () => ({ label: 'Glass case', hit: 12, h: 2, use: () => c() && c().keycase() }));
  F('ch_shelves', fx => ({ label: fx.item.p.kind === 'books' ? 'Bookcase' : fx.item.p.kind === 'rolls' ? 'Rolled maps' : 'Archive boxes', hit: 14, use: () => c() && c().shelves(fx) }));
  F('ch_mapcase', (fx, sc) => ({ label: 'Map drawers', hit: 14, use: () => c() && c().mapcase(fx, sc) }));
  F('ch_microfilm', (fx, sc) => ({ label: 'Microfilm reader', hit: 14, use: () => c() && c().microfilm(fx, sc) }));
  F('ch_photos', fx => ({ label: 'Old photographs', hit: 12, h: 2, use: () => c() && c().photos(fx.item.p.k || 0) }));
  F('ch_news', () => ({ label: 'Newspaper rack', hit: 12, use: () => c() && c().news() }));
  F('ch_clockwork', (fx, sc) => ({ label: 'The clock mechanism', hit: 16, use: () => c() && c().wind(fx, sc) }));
  F('ch_bell', (fx, sc) => ({ label: 'The hour bell', hit: 14, use: () => c() && c().bell(sc) }));
  F('ch_scope', () => ({ label: 'Telescope', hit: 12, use: () => c() && c().scope() }));
  F('ch_plaque', fx => ({ label: 'Brass plaque', hit: 12, h: 1.8, visible: () => !fx.ob.hidden, use: () => c() && c().plaque() }));
  F('window', fx => (fx.item.balcony ? { label: 'Step out onto the balcony', hit: 18, h: 2.4, use: () => c() && c().balcony() } : fx.item.view ? { label: 'Look out', hit: 14, h: 2, use: () => c() && c().view(fx.item.view) } : null));
  F('ch_cchair', (fx, sc) => (fx.item.mayor ? { label: "The mayor's chair", hit: 10, use: () => c() && c().mayorChair(fx, sc) } : null));
}
