// Maple Bay International, inside: three rooms (the game's opening, and a normal place to visit afterwards).
//   airport:plane      22 x 5   the cabin cutaway. scene.cabin = { pax, start(), remaining(), fast(), reset(), mine (player seat), attendant }
//   airport:concourse  64 x 14  pier B: gates B1-B6 (lounges, desks, apron windows), duty free + newsstand bay, moving walkways (3 runs, both
//                               directions), koi pond + rain curtain garden, coffee bar, noodle bar, flight boards, tram station at the east end.
//   airport:terminal   40 x 24  tram platform, baggage claim (carousels 1-3; scene.claim[1] is carousel 2), lost & found, oversize desk, customs green
//                               channel, arrivals rail with greeters, atrium fountain, info desk, car rental row, exchange, cafe, gift shop, exit doors.
// All rooms: def.noCrowd (they run their own crowd from def.npcSpots: scene.life = { statics, walkers, gate?, belts, update }), music 'quiet'.
// Hooks: scene.belts (world rects {x0,x1,y0,y1,dir}), scene.fx(k) fixture by item key, scene.spots (named room-coord points as world coords),
//   scene.gate (boarding cycle at B6), events 'airport:belt' (player first carried), 'airport:talk'(char), 'airport:pa'(text).
// Job station tags for a later pass: gate_desk, boarding_door, baggage_carousel, bag_cart, lost_found, info_desk (+ oversize_desk, rental_desk, exchange_desk).
// Tuning: TUNE in _airport_life.js (belt speed, walker speeds, crowd fill), WALKERS / PA_EVERY below.
import { GT } from '../../engine/world.js';
import { V, WY, WX, S } from './venues_lib.js';
import { defineRoom } from '../interior.js';
import { asset } from '../../art/registry.js';
import { toast } from '../../ui/kit.js';
import { caption } from '../../ui/goals.js';
import { populate, walkers, gateCycle, carouselBags, cabinLife, beltAt, TUNE } from './_airport_life.js';

const H = 3.6, O = 1, WALKERS = { concourse: 26, terminal: 18 }, PA_EVERY = [34, 58];
const A = (n, x, y, p, o) => V('airport.' + n, x, y, p, o);
const win = (W, at, view, liv, w = 5) => Object.assign(W('airport.window', at, { w, h: H, view, liv: liv || 0, seed: at + 2 }), { sky: true });
const NAVY = '#3b5a8c', TEALS = '#2f8f96', ORNG = '#d9822b';
const WP = (a) => a.map(q => Object.assign({ x: q[0] + O, y: q[1] + O }, q[2] || null));
const pick = a => a[Math.floor(Math.random() * a.length)];
const shop = (G, id) => () => { if (G.shop && G.shop.open) G.shop.open(id); else toast('Closed right now.'); };

/* room definition with lazy npcSpots (like venues_lib.room, plus per-item fill `np` and `outfit`) */
function spots(def) {
  const out = [], r2 = v => Math.round(v * 100) / 100;
  for (const it of def.items || []) {
    if (!it.n || it.wall) continue; let a; try { a = asset(it.id); } catch (e) { continue; }
    const P = it.p || {}, fl = !!it.flip, fnv = v => typeof v === 'function' ? v(P) : v, want = it.n.split(' ');
    const ix = Math.round(it.x * 2) / 2, iy = Math.round(it.y * 2) / 2, L = (q, anim, kind, ddir) => ({ x: r2(ix + (fl ? q.y : q.x)), y: r2(iy + (fl ? q.x : q.y)), z: q.z || 0, dir: q.dir !== undefined ? (fl ? [1, 0, 3, 2][q.dir] : q.dir) : ddir, anim, kind, fixture: it.id, p: it.np, outfit: kind === 'staff' ? it.outfit : undefined });
    if (want.includes('seats')) for (const q of fnv(a.seats) || []) out.push(L(q, 'sit', 'customer', 1));
    if (want.includes('staff') && fnv(a.staff)) out.push(L(fnv(a.staff), 'work', 'staff', fl ? 0 : 1));
    if (want.includes('use') && fnv(a.use)) out.push(L(fnv(a.use), 'stand', 'customer', fl ? 2 : 3));
  }
  return out.concat(def.npc || []);
}
function mkRoom(def) { let cache = null; Object.defineProperty(def, 'npcSpots', { enumerable: true, configurable: true, get() { return cache || (cache = spots(def)); } }); return defineRoom(def); }

/* shared room plumbing: keyed fixtures, sky-dependent art, animated frames, PA */
function plumbing(sc, G) {
  sc.fx = k => sc.fixtures.find(f => f.item && f.item.k === k);
  sc.add = (k, label, use, o) => { const f = typeof k === 'string' ? sc.fx(k) : k; if (!f) return null; const it = Object.assign({ x: f.x, y: f.y, h: Math.min(1.6, f.ob.size[2]), hit: 14, spot: f.use || undefined, label, use, fx: f }, o); sc.interactables.push(it); return it; };
  const objs = sc.world.objs, skyObs = objs.filter(o => o.data && o.data.sky), anim = objs.filter(o => o.a && o.a.frames), belts = objs.filter(o => o.id === 'furn.airport.walkway');
  const setP = (o, q) => { o.p = Object.assign({}, o.p, q); o._key = null; }; sc.setP = setP;
  let cur = -1, skyT = 0, fa = 0, fb = 0, pa = 20 + Math.random() * 20;
  const sky = () => { const h = G.now().hf, s = h < 5.5 || h >= 20.5 ? 2 : h < 7 || h >= 18.5 ? 1 : 0; if (s === cur) return; cur = s; for (const o of skyObs) setP(o, { sky: s }); };
  sc.pa = t => { if (G.modal || G.cutscene) return; caption('PA', t, 4600); G.emit('airport:pa', t); };
  const e0 = sc.onEnter; sc.onEnter = (o, p) => { e0(o, p); sky(); };
  return dt => {
    if ((skyT -= dt) <= 0) { skyT = 3; sky(); }
    fa += dt * 8; if (fa >= 1) { fa = 0; fb = (fb + 1) % 8; for (const o of belts) setP(o, { frame: fb % 4 }); if (fb % 2 === 0) for (const o of anim) if (o.id !== 'furn.airport.walkway') setP(o, { frame: (fb / 2) % 4 }); }
    if (sc.paLines && (pa -= dt) <= 0) { pa = PA_EVERY[0] + Math.random() * (PA_EVERY[1] - PA_EVERY[0]); sc.pa(pick(sc.paLines).replace('{clock}', G.now().clock)); }
  };
}
const sitHere = (G, at, label, text) => () => { const p = G.player; p.poseOpts = { seated: true }; const end = () => { p.poseOpts = null; }; G.startActivity({ label, anim: 'sit', minutes: 20, at, done: () => { end(); try { G.needs.add('fun', 10); G.needs.add('energy', 3); } catch (e) { } toast(text, 'good'); }, cancel: end }); };

/* ================= the plane ================= */
{
  const items = [WY('airport.cabin.wall', 0, { n: 19 }), WY('airport.cabin.door', 19), WY('airport.cabin.bulkhead', 20.5, { w: 1.5 }), WX('airport.cabin.bulkhead', 0, { w: 5 }),
    A('cabin.aisle', 0, 2, { len: 22 }), A('cabin.bins', 0, 0, { len: 19, open: 1, seed: 4 }, { z: 1.72, solid: false }), A('cabin.galley', 20.5, .5), A('cabin.galley', 20.5, 3.5)];
  for (let i = 0; i < 17; i++) { items.push(A('cabin.seats', 1.5 + i, .5, { c: i < 3 ? '#2f7f86' : NAVY }), A('cabin.seats', 1.5 + i, 3, { c: i < 3 ? '#2f7f86' : NAVY })); }
  mkRoom({ id: 'airport:plane', name: 'Maple Air MB 417', venue: 'airport', w: 22, d: 5, zoom: 0, music: 'quiet', noCrowd: true, floor: GT.f_carpet, wall: { color: '#e6eaee', trim: '#8e9aaa', h: 2.2 }, bg: '#10131c',
    items, npc: [Object.assign(S(19.2, 2.2, 2, 'stand', 'staff'), { outfit: 'pilot', key: 'attendant', label: 'Flight attendant' })],
    exits: [{ x: 19.75, y: .9, label: 'Leave the plane', use: G => G.go('int:airport:concourse', { x: 6.5 + O, y: 2.3 + O, dir: 1 }) }], spawn: { x: 18.6, y: 2.5, dir: 2 },
    setup(sc, G) {
      const st = populate(sc, {}); sc.cabin = cabinLife(sc, { aisleY: 2.5 + O, doorX: 19.75 + O, doorY: .5 + O, seat: { x: 9.9 + O, y: 3.25 + O } }); sc.cabin.attendant = st.list.find(c => c.key === 'attendant');
      for (const x of [3, 8, 13, 18]) sc.world.lights.push({ x: x + O, y: 2.5 + O, z: 0, r: 3.4, c: '#fff1d0' });
      const u0 = sc.update; sc.update = (dt, gm) => { u0(dt, gm); st.update(dt); sc.cabin.update(dt); };
    } });
}

/* ================= concourse B ================= */
{
  const GATES = [{ g: 'B1', x: 0, dest: 'SEATTLE', st: 'ARRIVED', view: 'nose', liv: 0, arr: 1 }, { g: 'B2', x: 8, dest: 'TOKYO', st: 'ON TIME', view: 'nose', liv: 1 }, { g: 'B3', x: 16, dest: 'LISBON', st: 'DELAYED', view: 'tail', liv: 2 },
    { g: 'B4', x: 32, dest: 'PARIS', st: 'ON TIME', view: 'nose', liv: 3 }, { g: 'B5', x: 40, dest: 'OSLO', st: 'ON TIME', view: 'tug', liv: 5 }, { g: 'B6', x: 48, dest: 'NAIROBI', st: 'ON TIME', view: 'nose', liv: 4, board: 1 }];
  const items = [], npc = [], RUNS = [[8, 20], [30, 40], [46, 54]];
  GATES.forEach((q, i) => {
    const x = q.x, c = i % 2 ? TEALS : NAVY, fill = q.arr ? .22 : q.board ? .5 : .72;
    items.push(win(WY, x, q.view, q.liv), Object.assign(WY('airport.gatesign', x + 4.75, { gate: q.g, text: q.dest, status: q.st }), { k: 'sign' + q.g }));
    items.push(q.arr ? A('jetbridge', x + 5.25, 0, { text: q.g }, { k: 'jet' }) : Object.assign(WY('airport.gatedoor', x + 5.25, { open: 0 }), { k: 'door' + q.g }));
    items.push(A('decal', x + .25, 1.7, { kind: 'carpet', w: 5, d: 3.9, c: i % 2 ? '#3a6a78' : '#4a5a86' }), A('decal', x + 5.5, 2.5, { kind: 'gate', text: q.g, w: 2, d: 1 }));
    items.push(A('gatedesk', x + 2.8, .9, { text: q.g, c: i % 2 ? '#2f8f96' : undefined }, { k: 'desk' + q.g, n: 'staff' }), A('totem', x + 7.5, .3, { text: q.g }));
    for (const [y, back, post] of [[2, 0, 1], [3.5, 1, 0], [3.5, 0, 0], [5, 1, 1]]) items.push(A('seats', x + .5, y, { n: 8, c, back, post }, { n: 'seats', np: fill }));
    npc.push(S(x + .9, .9, 3), S(x + 1.9, .85, 3, 'phone'), S(x + 3.8, 1.9, 3)); if (!q.arr) npc.push(S(x + 7.6, 3.9, 2, 'talk'), S(x + 6.9, 4, 0, 'talk'));
  });
  // retail bay
  items.push(A('shop.back', 24.4, .1, { kind: 'dutyfree', w: 4 }), A('shop.counter', 24.9, 1.7, { kind: 'dutyfree', w: 3 }, { k: 'dutyfree', n: 'staff use' }), A('shop.back', 28.8, .1, { kind: 'news', w: 3 }), A('shop.counter', 28.8, 1.7, { kind: 'news', w: 3 }, { k: 'news', n: 'staff use' }),
    A('island', 25, 3.7, { kind: 'perfume' }, { n: 'use' }), A('island', 28.2, 3.7, { kind: 'choc', seed: 4 }, { n: 'use' }), A('decal', 24.3, 1.2, { kind: 'carpet', w: 7.5, d: 4, c: '#7a4e6a' }));
  // tram station
  items.push(Object.assign(WY('airport.tram.pdoors', 57.5, { w: 6, text: 'TRAM > BAGGAGE CLAIM' }), { k: 'tram' }), A('decal', 57.5, .5, { kind: 'line', w: 6, d: .5 }), A('decal', 59.5, 1.4, { kind: 'arrow', w: 2, d: 1, dir: 1, c: '#2f8f96' }), A('column', 56.6, .4), A('column', 63.4, .4),
    A('seats', 57.2, 4.4, { n: 6, back: 1, c: ORNG }, { n: 'seats' }), win(WX, 1, 'takeoff', 3), WX('airport.greenwall', 7, { w: 6, text: 'MAPLE BAY' }));
  // spine: walkways, garden, coffee
  for (const [a, b] of RUNS) { const len = b - a; items.push(A('walkway', a, 6.5, { len, dir: 1 }), A('walkway', a, 8, { len, dir: -1 }), A('walkway.rail', a, 6, { len, d: .5, at: .36 }), A('walkway.rail', a, 7.5, { len, d: .5 }), A('walkway.rail', a, 9, { len, d: .5, at: .02 }), A('decal', a - 2, 6.5, { kind: 'arrow', dir: 1 }), A('decal', b, 8, { kind: 'arrow', dir: -1 })); }
  items.push(A('fids', 1.5, 7.4, { w: 5 }, { k: 'fids1', fids: 1 }), A('tree', 20.8, 6.9, { kind: 'ficus', bench: 1 }, { n: 'seats' }), A('raincurtain', 23.5, 6.3), A('pond', 23, 7.1, null, { k: 'pond' }), A('tree', 27.6, 6.9, { kind: 'maple' }),
    A('mobile', 22.5, 6.3, { w: 5, d: 3, seed: 3 }, { z: 2.9, solid: false }), A('shop.back', 41, 6.3, { kind: 'coffee', w: 4 }), A('shop.counter', 41.5, 7.7, { kind: 'coffee', w: 3 }, { k: 'coffee', n: 'staff use', outfit: 'cook' }), A('column', 54.75, 7.5));
  for (const [x, text, w, c] of [[2.5, 'TRAM + BAGGAGE >', 5], [20.3, '< B1-B3   B4-B6 >', 5, '#2f8f96'], [40.2, 'TRAM + BAGGAGE >', 5], [53.5, 'TRAM >', 3, '#2f8f96']]) items.push(A('sign', x, 5.55, { text, w, c }, { z: 2.6, solid: false }));
  // south side
  items.push(A('tree', .8, 11.6, { kind: 'palm', bench: 1 }, { n: 'seats' }), A('shop.back', 10, 10.9, { kind: 'noodle', w: 4 }), A('shop.counter', 10, 12.2, { kind: 'noodle', w: 4 }, { k: 'noodle', n: 'staff seats', outfit: 'cook' }), A('fids', 16, 11.4, { w: 5 }, { k: 'fids2', fids: 1 }),
    A('planter', 26.6, 11.2, { len: 3, flowers: 1 }), V('generic.vending', 30, 11, { seed: 2 }), V('generic.vending', 31.1, 11, { c: '#d2412f', seed: 5 }), V('generic.bin', 32.3, 11), A('tree', 49.3, 11.4, { kind: 'maple', bench: 1 }, { n: 'seats' }), A('planter', 56.6, 11.2, { len: 3 }), A('tree', 61, 11.4, { kind: 'palm' }), A('planter', 6.6, 11.2, { len: 2.5 }));
  for (const [x, c] of [[3.2, ORNG], [22.5, NAVY], [33.5, TEALS], [52.2, NAVY]]) items.push(A('seats', x, 11.3, { n: 6, c, post: 1 }, { n: 'seats' }), A('seats', x, 13.3, { n: 6, c, back: 1 }, { n: 'seats' }));
  for (const [x, y] of [[40.5, 11.5], [43.5, 11.5], [46.5, 11.5], [37.5, 11.5]]) items.push(V('cafe.tableset', x, y, { c: '#f1ede4', cc: '#2f8f96' }, { n: 'seats' }));
  npc.push(S(3, 8.7, 3), S(4.3, 9, 3, 'phone'), S(2.1, 8.8, 3), S(43, 8.75, 3), S(43.1, 9.45, 3, 'phone'), S(17, 12.7, 3), S(18.6, 12.9, 3), S(19.8, 12.6, 3, 'phone'), S(25, 9.7, 3), S(26.3, 9.6, 3, 'phone'), S(30.5, 11.8, 3), S(60.2, 2.4, 3), S(61.4, 2.8, 3, 'phone'), S(58.9, 2.9, 3),
    Object.assign(S(36.5, 5.6, 0, 'talk', 'staff'), { outfit: 'pilot' }), Object.assign(S(37.3, 5.7, 2, 'talk', 'staff'), { outfit: 'pilot' }), S(13.5, 5.6, 1, 'phone'), S(47.5, 10.2, 0, 'talk'), S(48.3, 10.3, 2, 'talk'), S(8.9, 3.4, 1, 'wave'));
  const FL = [['1420', 'LISBON', 'B3', 'DELAY', '#ff8a70'], ['1425', 'NAIROBI', 'B6', 'ON TIME'], ['1440', 'TOKYO', 'B2', 'ON TIME'], ['1455', 'PARIS', 'B4', 'ON TIME'], ['1510', 'OSLO', 'B5', 'ON TIME'], ['1535', 'DENVER', 'B1', 'ON TIME'], ['1550', 'HONOLULU', 'B2', 'ON TIME']];
  const BOARD = [{ dest: 'NAIROBI', fl: 'MB 204' }, { dest: 'DENVER', fl: 'MB 77' }, { dest: 'HONOLULU', fl: 'MB 310' }];
  mkRoom({ id: 'airport:concourse', name: 'Maple Bay Intl - Concourse B', venue: 'airport', w: 64, d: 14, zoom: 0, music: 'quiet', noCrowd: true, floor: GT.f_stone, floors: [{ x0: 0, y0: 5.5, x1: 64, y1: 10.5, floor: GT.f_tile }],
    wall: { color: '#eef1f3', trim: '#9aa5b0', h: H }, items, npc, exits: [{ x: 60.5, y: 1.1, label: 'Tram to Baggage Claim', use: G => (G.airtram ? G.airtram.ride('terminal') : G.go('int:airport:terminal')) }], spawn: { x: 6.5, y: 2.3, dir: 1 },
    setup(sc, G) {
      const tick = plumbing(sc, G), W = sc.world;
      sc.belts = []; for (const [a, b] of RUNS) sc.belts.push({ x0: a + O + .1, x1: b + O - .1, y0: 6.5 + O, y1: 7.5 + O, dir: 1 }, { x0: a + O + .1, x1: b + O - .1, y0: 8 + O, y1: 9 + O, dir: -1 });
      sc.spots = { jet: { x: 6.5 + O, y: 2.3 + O }, belt: { x: 8.6 + O, y: 7 + O }, tram: { x: 60.5 + O, y: 1.2 + O }, coffee: { x: 43 + O, y: 8.75 + O }, pond: { x: 25 + O, y: 8.1 + O } };
      sc.add('coffee', 'Bay Brew coffee bar', shop(G, 'stand_coffee')); sc.add('noodle', 'Noodle bar', shop(G, 'ramen')); sc.add('news', 'News & Books', shop(G, 'bookstore')); sc.add('dutyfree', 'Duty free', shop(G, 'cornerstore'));
      sc.add('pond', 'Watch the koi', () => G.startActivity({ label: 'Watching the koi', anim: 'stand', minutes: 12, done: () => { try { G.needs.add('fun', 8); } catch (e) { } toast('Five koi. One of them is definitely the boss.', 'good'); } }));
      sc.interactables.push({ x: 2.5 + O, y: .4 + O, h: 1.8, hit: 16, range: 1.6, label: 'Watch the planes', use: () => G.startActivity({ label: 'Watching the planes', anim: 'stand', minutes: 15, done: () => { try { G.needs.add('fun', 9); } catch (e) { } toast(pick(['A Maple Air jet pushes back, slow as a ferry.', 'A tiny tug hauls a very long train of bags.', 'Wheels up - there goes the 2:40 to Lisbon.']), 'good'); } }) });
      for (const k of ['fids1', 'fids2']) sc.add(k, 'Departures', () => toast('Now boarding: ' + gate.flight().dest + ' at B6. The tram to Baggage Claim is at the east end.'));
      for (const q of GATES) sc.add('desk' + q.g, 'Gate ' + q.g, () => toast(q.arr ? 'Gate B1 - MB 417 from Seattle has arrived. That was you!' : 'Gate ' + q.g + ' to ' + q.dest + '. "Boarding passes only, please."'));
      // flight boards
      const fids = W.objs.filter(o => o.data && o.data.fids); let ft = 0, fo = 0;
      const boards = () => { const b = gate.flight(), ph = gate.st.phase, rows = []; for (let i = 0; i < 3; i++) { const f = FL[(fo + i) % FL.length], isB = f[2] === 'B6', dest = isB ? b.dest : f[1], stt = isB ? (ph === 'board' || ph === 'hold' ? 'BOARD' : ph === 'gap' ? 'CLOSED' : 'GO GATE') : f[3]; rows.push([f[0] + ' ' + dest.padEnd(9).slice(0, 9) + f[2] + ' ' + stt, isB ? (ph === 'gap' ? '#ff8a70' : '#7df0a0') : f[4]]); } for (const o of fids) sc.setP(o, { rows, title: 'DEPARTURES  ' + G.now().clock }); };
      // boarding gate B6
      const g6 = GATES[5], sign = sc.fx('signB6'), door = sc.fx('doorB6');
      const gate = sc.gate = gateCycle(sc, { door: { x: g6.x + 6.5 + O, y: .5 + O }, head: { x: g6.x + 6.5 + O, y: 1.5 + O }, step: [0, .6], from: { x: g6.x + 6.6 + O, y: 5.4 + O }, n: 7, flights: BOARD,
        onPhase(ph, f) { if (sign) sc.setP(sign.ob, { text: f.dest, status: ph === 'hold' || ph === 'board' ? 'BOARDING' : ph === 'gap' ? 'CLOSED' : 'GO TO GATE' }); if (door) sc.setP(door.ob, { open: ph === 'board' ? 1 : 0 }); if (ph === 'hold') sc.pa('Flight ' + f.fl + ' to ' + f.dest[0] + f.dest.slice(1).toLowerCase() + ' is now boarding at gate B6.'); boards(); } });
      sc.paLines = ['The tram to Baggage Claim and the Main Terminal leaves from the east end of Concourse B.', 'Please keep your bags with you at all times. Unattended snacks will be eaten.', 'Passenger Wendell Okafor, please return to the noodle bar. You forgot your noodles.', 'Welcome to Maple Bay International. Local time is {clock}.', 'Maple Air flight MB 118 to Lisbon is delayed. We are very sorry. The plane is also sorry.'];
      // walkers
      const east = () => { const k = Math.random(), tail = [[56.6, 5.4], [60.5, 2.2], [60.5, 1.1]]; const st = Math.random() < .3 ? [[6.5, 2], [6.7, 5.7]] : [[.8, k < .75 ? 5.7 : 10.5]];
        if (k < .5) return { pts: WP([...st, [7, 5.7], [7.7, 7], [20.4, 7], [20.6, 5.7], [29.4, 5.7], [29.7, 7], [40.3, 7], [40.6, 5.7], [45.4, 5.7], [45.7, 7], [54.3, 7], ...tail]) };
        if (k < .75) return { pts: WP([...st, [15 + Math.random() * 30, 5.7, Math.random() < .3 ? { wait: 4, pose: 'phone' } : null], [56.5, 5.7], ...tail]) };
        return { pts: WP([[.8, 10.5], [16.5 + Math.random() * 3, 12.6, { wait: 5, dir: 3 }], [22, 10.5], [44.6, 9.6, Math.random() < .4 ? { wait: 5, dir: 3 } : null], [55, 10.4], [58.5, 5.4], ...tail.slice(1)]) }; };
      const west = () => { const k = Math.random(), head = [[60.5, 1.2], [59.4, 4.4]];
        if (k < .5) return { pts: WP([...head, [55.6, 8.5], [45.7, 8.5], [45.4, 10.5], [40.6, 10.5], [40.3, 8.5], [29.7, 8.5], [29.4, 10.5], [20.6, 10.5], [20.3, 8.5], [7.7, 8.5], [5.5, 10.4], [.8, 10.4]]) };
        const g = pick(GATES.slice(1)); if (k < .8) return { pts: WP([...head, [56.5, 5.7], [g.x + 7.3, 5.7], [g.x + 7.1, 3 + Math.random(), { wait: 6, pose: 'phone' }], [g.x + 6.5, 1.3]]) };
        return { pts: WP([...head, [55.5, 10.5], [32 + Math.random() * 6, 10.6, Math.random() < .5 ? { wait: 4, pose: 'phone' } : null], [.8, 10.5]]) }; };
      const st = populate(sc, {}), wk = walkers(sc, { n: WALKERS.concourse, belts: sc.belts, route: () => (Math.random() < .55 ? east() : west()) });
      sc.life = { statics: st, walkers: wk, gate }; gate.start(); boards();
      let onBelt = 0; const u0 = sc.update;
      sc.update = (dt, gm) => {
        u0(dt, gm); tick(dt); st.update(dt); wk.update(dt); gate.update(dt); if ((ft -= dt) <= 0) { ft = 22; fo++; boards(); }
        const p = G.player, b = !G.busy && !G.cutscene && !p.hidden ? beltAt(sc.belts, p.x, p.y) : 0;
        if (b) { const nx = p.x + b * TUNE.BELT * dt; if (!W.isBlocked(nx, p.y)) { p.x = nx; if (!p.moving) p.dir = b > 0 ? 0 : 2; } onBelt += dt; if (!sc.rode && onBelt > .5) { sc.rode = true; G.emit('airport:belt'); } }
      };
    } });
}

/* ================= main terminal ================= */
{
  const CAR = [[22.5, 4, '1', 'KX 88'], [22.5, 9.5, '2', 'MB 417'], [31.5, 9.5, '3', 'AO 52']], items = [], npc = [];
  items.push(win(WY, 1, 'tower', 0), win(WY, 7, 'takeoff', 1), WY('airport.greenwall', 13, { w: 6, text: 'MAPLE BAY' }), win(WX, 1, 'tug', 2), win(WX, 7, 'tail', 5), Object.assign(WX('airport.exitdoors', 13.5, { w: 4, text: 'EXIT - TAXI' }), { sky: true, k: 'exit' }), win(WX, 18.5, 'tower', 3),
    Object.assign(WY('airport.tram.pdoors', 32.5, { w: 6, text: 'TRAM > GATES B1-B6' }), { k: 'tram' }), A('decal', 32.5, .5, { kind: 'line', w: 6, d: .5 }));
  // partitions + customs + arrivals rail
  items.push(A('partition', 19.6, 0, { len: 9 }, { flip: true }), A('partition', 19.6, 12, { len: 5.3 }, { flip: true }), A('customs', 19.6, 9, { kind: 'green' }, { flip: true, k: 'customs' }), A('partition', 20, 17.3, { len: 10, text: 'BAGGAGE CLAIM' }), A('partition', 30, 17.3, { len: 10 }),
    A('barrier', 17, 8.5, { len: 4.5 }, { flip: true }), A('barrier', 17, 8, { len: 2.5 }));
  // baggage hall
  for (const [x, y, num, text] of CAR) items.push(A('carousel', x, y, null, { car: num }), A('carousel.island', x + 1, y + 1, { num, text }, { k: 'car' + num }));
  items.push(A('shop.back', 22.3, .1, { kind: 'lostfound', w: 4 }), A('shop.counter', 22.8, 1.7, { kind: 'lostfound', w: 3 }, { k: 'lost', n: 'staff', tags: ['lost_found'] }), A('shop.back', 27, .1, { kind: 'oversize', w: 4 }), A('shop.counter', 27.5, 1.7, { kind: 'oversize', w: 3 }, { k: 'oversize', n: 'staff', tags: ['oversize_desk'] }),
    { id: 'prop.airport.trolleycorral', x: 31.6, y: 5.6 }, { id: 'prop.airport.trolley', x: 21, y: 13.4 }, { id: 'prop.airport.trolley', x: 30.2, y: 13.6 }, { id: 'prop.airport.trolley', x: 38.6, y: 14.4 }, { id: 'veh.airport.baggagecart', x: 35.4, y: 14.8, tags: ['bag_cart'], k: 'cart' },
    A('column', 20.5, 5.2), A('column', 39.2, 8), A('sign', 22.5, 8.1, { text: '< CUSTOMS + EXIT', w: 5, c: '#3fa45b' }, { z: 2.6, solid: false }), A('sign', 31, 4.3, { text: 'BAGGAGE CLAIM 1-3', w: 5 }, { z: 2.6, solid: false }));
  // atrium
  items.push(A('decal', 4.5, 3.5, { kind: 'carpet', w: 10, d: 10, c: '#2f6f8a' }), V('station.shaft', 2.5, 2, null, { shaft: true }), V('station.shaft', 11, 1, null, { shaft: true }), A('fountain', 8.5, 7.5, null, { k: 'fountain', n: 'seats' }),
    A('tree', 2.4, 3, { kind: 'ficus', bench: 1 }, { n: 'seats' }), A('tree', 14.6, 2.6, { kind: 'palm', bench: 1 }, { n: 'seats' }), A('tree', 1.6, 9.6, { kind: 'maple' }), A('tree', 14.8, 13, { kind: 'ficus' }), A('planter', 5.5, 1, { len: 3, flowers: 1 }), A('planter', 10.5, 1, { len: 3 }),
    A('shop.counter', 7.6, 13.6, { kind: 'info', w: 3 }, { k: 'info', n: 'staff', tags: ['info_desk'] }), A('beacon', 11, 13.6), A('fids', 11.6, 15.2, { w: 5, title: 'ARRIVALS', rows: [['1358 SEATTLE   BELT 2', '#7df0a0'], ['1405 DENVER    BELT 1'], ['1412 HONOLULU  BELT 3']] }, { k: 'fids' }),
    A('mobile', 3.5, 16, { w: 6, d: 4, seed: 5 }, { z: 3.1, solid: false }), A('sign', 3, 12.6, { text: '< EXIT - TAXI - RAIL', w: 5.5, c: '#3fa45b' }, { z: 2.6, solid: false }), A('column', 18.6, 5), A('column', 18.6, 15.2));
  // south hall
  items.push(A('shop.back', 2.5, 18.4, { kind: 'coffee', w: 4 }), A('shop.counter', 3, 19.7, { kind: 'coffee', w: 3 }, { k: 'cafe', n: 'staff use', outfit: 'cook' }), V('cafe.tableset', 8, 19.2, null, { n: 'seats' }), V('cafe.tableset', 8, 21.4, { c: '#f1ede4', cc: '#c0563a' }, { n: 'seats' }), V('cafe.tableset', 11, 20.3, null, { n: 'seats' }),
    A('shop.back', 14.5, 18.6, { kind: 'exchange', w: 3 }), A('shop.counter', 14.5, 19.9, { kind: 'exchange', w: 3 }, { k: 'exchange', n: 'staff use', tags: ['exchange_desk'] }), A('beacon', 17.8, 18.6, { text: '$', c: '#2f6f5f' }),
    A('shop.back', 35, 18, { kind: 'souvenir', w: 4 }), A('shop.counter', 35.5, 19, { kind: 'souvenir', w: 3 }, { k: 'gifts', n: 'staff use' }), V('generic.vending', 39, 20.6, { seed: 3 }), A('planter', 19.4, 23.2, { len: 3 }), A('planter', 30, 23.2, { len: 3, flowers: 1 }));
  [['ZIP CARS', '#d2412f'], ['BAYDRIVE', '#2f6fb0'], ['LEAF RENT', '#3fa45b']].forEach(([name, c], i) => items.push(A('shop.back', 20.6 + i * 4.6, 18, { kind: 'rental', w: 4, name, c }), A('shop.counter', 21.1 + i * 4.6, 19, { kind: 'rental', w: 3, c }, { k: 'rent' + i, n: 'staff' + (i === 1 ? ' use' : ''), tags: ['rental_desk'] })));
  for (const [x, c] of [[20.5, NAVY], [26, TEALS], [31.5, NAVY]]) items.push(A('seats', x, 21.2, { n: 8, c, post: 1 }, { n: 'seats' }));
  // people
  const cl = (x, y, d, a) => Object.assign(S(x, y, d, a || 'stand'), { role: 'claim', p: .8 });
  for (const [x, y] of [[22.5, 9.5], [31.5, 9.5]]) npc.push(cl(x + 1, y + 3.5, 3), cl(x + 2.1, y + 3.6, 3, 'phone'), cl(x + 4.9, y + 3.5, 3), cl(x + 6, y + 3.6, 3), cl(x + 1.5, y - .5, 1), cl(x + 3.2, y - .55, 1, 'phone'), cl(x + 5.4, y - .5, 1));
  npc.push(cl(24, 7.5, 3), cl(26.2, 7.6, 3, 'phone'), cl(28.4, 7.5, 3), cl(21.8, 5.5, 0), cl(30, 11, 2));
  [[8.9], [9.8, 'kid'], [10.7], [11.6], [12.4]].forEach(([y, age], i) => npc.push(Object.assign(S(16.3, y, 0, i === 1 ? 'wave' : 'stand'), { role: 'greeter', p: 1, age, key: 'greet' + i })));
  items.push(A('namesign', 16.5, 8.5, { text: 'MR P.', c: '#e8f0ff' }, { flip: true }), A('namesign', 16.5, 10.5, { text: 'HI', text2: 'MOM', c: '#f2a7c3' }, { flip: true }), A('namesign', 16.5, 12, { text: 'BAO' }, { flip: true }));
  npc.push(S(13.2, 16.5, 3), S(14.6, 16.7, 3, 'phone'), S(9.2, 15, 3), S(22.6, 20.2, 3), S(27.2, 20.2, 3, 'talk'), S(31.8, 20.3, 3), S(4.5, 20.9, 3), S(4.7, 21.6, 3, 'phone'), S(16, 21.1, 3), S(37, 20.2, 3), S(5.5, 6.2, 0, 'talk'), S(6.3, 6.4, 2, 'talk'), S(13.4, 11.8, 1, 'phone'),
    S(34.4, 2.6, 1), S(36.8, 2.4, 1, 'phone'), S(24.3, 2.85, 3), S(29, 2.85, 3), Object.assign(S(12.8, 5.2, 1, 'talk', 'staff'), { outfit: 'pilot' }), Object.assign(S(13.6, 5.3, 2, 'talk', 'staff'), { outfit: 'pilot' }));
  mkRoom({ id: 'airport:terminal', name: 'Maple Bay International', venue: 'airport', w: 40, d: 24, zoom: 0, music: 'quiet', noCrowd: true, floor: GT.f_stone, floors: [{ x0: 20, y0: 0, x1: 40, y1: 17.3, floor: GT.f_tile }, { x0: 0, y0: 17.6, x1: 19, y1: 24, floor: GT.f_wood }],
    wall: { color: '#eef1f3', trim: '#9aa5b0', h: H }, items, npc, spawn: { x: 2.6, y: 15.5, dir: 0 },
    exits: [{ x: 1.1, y: 15.5, label: 'Exit to the curb', use: G => { if (G.scene.canLeave && !G.scene.canLeave()) return; G.go('city', { poi: 'spawn:airport' }); } }, { x: 35.5, y: 1.1, label: 'Tram to Gates B1-B6', use: G => (G.airtram ? G.airtram.ride('concourse') : G.go('int:airport:concourse', { x: 60.5 + O, y: 2.2 + O })) }],
    setup(sc, G) {
      const tick = plumbing(sc, G), W = sc.world; sc.belts = [];
      sc.spots = { tram: { x: 35.5 + O, y: 1.9 + O }, claim: { x: 26 + O, y: 13.1 + O }, customs: { x: 19.8 + O, y: 10.5 + O }, corridor: { x: 18.3 + O, y: 13.4 + O }, exit: { x: 1.1 + O, y: 15.5 + O }, fountain: { x: 9.7 + O, y: 8.7 + O } };
      // nav: fountain basin, carousels
      for (let y = 5; y < 12.5; y += .5) for (let x = 6; x < 13; x += .5) if (Math.hypot(x + .25 - 9.7, y + .25 - 8.7) < 3.05) W.block(x + O, y + O, x + O + .5, y + O + .5);
      for (const [x, y] of CAR) W.block(x + O, y + O, x + O + 7, y + O + 3);
      sc.claim = CAR.map(([x, y], i) => carouselBags(sc, x + O, y + O, i === 1 ? 7 : 9, i + 1));
      const shafts = W.objs.filter(o => o.data && o.data.shaft);
      const ff = sc.fx('fountain'); if (ff) { const s = ff.seats[3]; sc.interactables.push({ x: ff.x, y: ff.y, h: 1.4, hit: 22, range: 4.2, spot: { x: s.x + .0, y: s.y + .55 }, label: 'Sit by the fountain', use: sitHere(G, { x: s.x, y: s.y, z: s.z, dir: s.dir }, 'Listening to the fountain', 'Water, a red maple and a hundred little reunions. Not a bad airport.') }); }
      sc.add('cafe', 'Arrivals cafe', shop(G, 'stand_coffee')); sc.add('gifts', 'Maple Gifts', shop(G, 'cornerstore')); sc.add('info', 'Information', () => toast('"Taxis and the light rail are right outside. The tram back to the gates is past baggage claim."'));
      sc.add('exchange', 'Currency exchange', () => toast('"Maple dollars only today. Your wallet is already in the right currency."')); sc.add('rent1', 'Car rental', () => toast('"All out of cars until Thursday. The light rail is honestly faster."'));
      sc.add('lost', 'Lost & Found', () => toast('"One umbrella, one teddy bear, nine single gloves. Nothing with your name on it."')); sc.add('oversize', 'Oversize baggage', () => toast('"Skis, surfboards, cellos. If it is weird-shaped, it comes out here."'));
      sc.add('fids', 'Arrivals board', () => toast('MB 417 from Seattle: bags on carousel 2.'));
      for (const [, , num] of CAR) sc.add('car' + num, 'Carousel ' + num, () => toast(num === '2' ? 'Carousel 2 - MB 417 from Seattle.' : 'Carousel ' + num + '. Not your flight.'), { range: 2.6, spot: undefined });
      sc.paLines = ['Bags from flight MB 417 from Seattle are arriving on carousel 2.', 'Taxis, buses and the light rail are just outside the arrivals hall.', 'Please check that the bag you take is yours. Many bags look alike. Yours is the nice one.', 'Welcome to Maple Bay. Local time is {clock}.'];
      const arr = () => ({ kind: 'bag', pts: WP([[35.5, 1.6], [35.5, 3.2], [30.5, 3.5], [30.5, 8.2], [21.3, 8.3], [20.9, 10.5], [18.3, 10.5], [18.3, 14.2], [17.6, 16.6], [12, 17.1], [2.4, 15.7], [1, 15.6]]) });
      const routes = [arr, arr, arr, () => ({ pts: WP([[39.3, 22.6], [19, 22.6], [10, 17.4], [2.4, 15.8], [1, 15.6]]) }), () => ({ pts: WP([[1, 15.4], [9, 16.8], [18, 22.2], [39.3, 22.4]]) }),
        () => ({ kind: 'stroll', pts: WP([[1, 15.4], [5, 13.2, { wait: 4 }], [5.4, 4.9], [13.6, 4.7, { wait: 5, pose: 'phone' }], [13.9, 12.4], [9.6, 12.9, { wait: 4, dir: 3 }], [3, 15.4], [1, 15.6]]) }), () => ({ pts: WP([[1, 15.5], [6, 17.4], [5.6, 20.9, { wait: 6, dir: 3 }], [10, 22.9], [39.3, 22.6]]) })];
      const st = populate(sc, {}), wk = walkers(sc, { n: WALKERS.terminal, belts: [], route: () => pick(routes)() }); sc.life = { statics: st, walkers: wk };
      const day = () => { const h = G.now().hf, d = h >= 7 && h < 18.5; for (const o of shafts) o.hidden = !d; };
      const e0 = sc.onEnter, x0 = sc.onExit; sc.onEnter = (o, p) => { e0(o, p); day(); }; sc.onExit = to => { const p = G.player; p.carry = false; if (p.poseOpts && p.poseOpts.item) p.poseOpts = null; x0(to); };
      const u0 = sc.update; sc.update = (dt, gm) => { u0(dt, gm); tick(dt); st.update(dt); wk.update(dt); for (const c of sc.claim) c.update(dt); };
    } });
}
