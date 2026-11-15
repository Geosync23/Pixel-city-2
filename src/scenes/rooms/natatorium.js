// Maple Bay Natatorium — the Entrance Hall (room `natatorium`, 26 x 13) and the Changing Village (room `natatorium:change`, 20 x 11) + the helpers shared by the other natatorium rooms
// (natatorium_pool.js: competition pool + diving well, natatorium_leisure.js: leisure pool + wellness + cafe, natatorium_lido.js: the outdoor deck). Gameplay lives in sim/natatorium.js (G.natatorium).
// City door `door:natatorium` (added at runtime to the existing `bld.civic.pool`). Exits (doormats, all with `to` so the nav arrow can route):
//   hall:   street door -> city · "Spectator Stand" -> int:natatorium:pool (the stand side) · through the turnstiles "Changing Village" -> int:natatorium:change
//   change: "Entrance Hall" · "Competition Pool" (through the footbath; swimwear + a rinse needed) · "Leisure Pool"
// Each room exposes scene.nat: hall { gates(open), setBoards(), view, desk, life }, change { jets[], showerSpot(i), lockerNo, life }.
// The animated water of every natatorium room is drawn by one underlay registered in init() (scene.waters = [waterLayer...]).
import { G } from '../../core/game.js';
import { GT } from '../../engine/world.js';
import * as R from '../../engine/raster.js';
import { ambient } from '../../core/clock.js';
import { defineRoom } from '../interior.js';
import { bubble } from '../../ui/kit.js';
import { crowd, walkers } from './_show_life.js';
import { registerInfo } from './unique_rooms.js';
import { deck, TEAL } from '../../art/showpiece/_nat_lib.js';
import { NR, NAME, SHOP_NAME, HOURS, PRICE } from '../../data/natatorium.js';
import { board, jet, swimPeople, sweep } from './natatorium_fx.js';

/* ---------------- shared helpers ---------------- */
export const O = 1, NS = () => G.natatorium, pick = a => a[Math.floor(Math.random() * a.length)];
export const setP = (o, q) => { if (!o) return; for (const k in q) if (JSON.stringify(o.p[k]) !== JSON.stringify(q[k])) { o.p = Object.assign({}, o.p, q); o._key = null; return true; } return false; };
export const showOb = (W, o, on) => { if (!o || o.hidden === !on) return; o.hidden = !on; if (o.solid) { if (on) W.block(o.B[0], o.B[1], o.B[3], o.B[4]); else W.free(o.B[0], o.B[1], o.B[3], o.B[4]); } };
export const viewNow = () => { const a = ambient(G.state.t, 'clear'); return a.dark >= .8 ? 'night' : a.dark > .02 || a.amb !== '#ffffff' ? 'dusk' : 'day'; };
export const mkItems = () => { const items = [], spots = []; const fix = id => (id.includes('.') ? id : 'furn.nat.' + id); return { items, spots, H: (id, x, y, p, o) => { const it = Object.assign({ id: fix(id), x, y, p: p || {} }, o); items.push(it); return it; }, Wl: (id, wall, at, p, o) => { const it = Object.assign({ id: fix(id), wall, at, p: p || {} }, o); items.push(it); return it; }, S: (x, y, dir, o) => spots.push(Object.assign({ x, y, dir }, o)) }; };
/** light under the glass roof: full daylight by day, cool and lamp-lit at night. k = how much daylight gets in, d = how dark the night is allowed to get */
export const hallEnv = (Wd, k = .5, d = .5, tint) => t => { const o = ambient(t, G.state.weather); return { amb: o.amb === '#ffffff' ? o.amb : R.mix(R.mix(o.amb, '#ffffff', k), tint || '#ffffff', tint ? .25 : 0), dark: Math.min(d, (o.dark || 0) * d), bg: Wd.bg, night: o.night }; };
export const dress = (cr, fn) => { for (const c of cr.list) { const s = fn(c.spot, c); if (s && s !== c.spec) c.setSpec(s); } };
export const by = (Wd, k) => Wd.objs.filter(o => o.data && o.data[k]);
export const inNat = sc => !!(sc && sc.def && sc.def.showpiece === 'nat');
/** an interactable on a fixture found by an item flag */
export const hook = (sc, flag, label, use, o) => { for (const f of sc.fixtures) if (f.item[flag]) sc.interactables.push(Object.assign({ x: f.x, y: f.y, label: typeof label === 'function' ? label(f) : label, h: Math.min(1.6, f.ob.size[2]), hit: 12, spot: f.use || undefined, fx: f, use: () => NS() && use(f) }, o)); };
/** floor decal over the whole room: fn(x, y in room coords) -> hex */
export const floorDecal = (sc, w, d, fn) => { sc.world.decal({ x0: O, y0: O, x1: O + w, y1: O + d, draw(Rr) { Rr.qz(O, O + w, O, O + d, 0, (x, y) => fn(x - O, y - O)); } }); sc.world.version++; };
/** standard life wiring: sc.life.count(), the crowd update, the effect sweep */
export const wireLife = (sc, parts) => { sc.life = { parts, count: () => parts.reduce((n, p) => n + (p.count ? p.count() : 0), 0) }; };

/* ================= Entrance Hall ================= */
{
  const W = 26, D = 13, { items, spots, H, Wl, S } = mkItems();
  Wl('viewwin', 'y', 1, { w: 7.4 }, { view: 1, mount: .6 }); Wl('recordboard', 'y', 9.1, {}, { records: 1, mount: .7 }); Wl('honours', 'y', 12.8, {}, { honours: 1, mount: .7 }); Wl('noticeboard', 'y', 15.2, {}, { notice: 1, mount: .9 });
  Wl('doorway', 'y', 19.6, { t: 'STAND', w: 1.9, c: '#1f6fb8' }); Wl('doorway', 'y', 23.1, { t: 'CHANGING', w: 2.5, c: '#e8843a' });
  Wl('sign', 'x', 2.4, { t: 'SPLASH & DASH', w: 3.7, c: '#f2c230', fg: '#22304e', lit: 1 }, { mount: 2.45 }); Wl('mural', 'x', 9.1, {}, { mural: 1, mount: .9 });
  H('vending', 17.3, .15, { k: 'drinks' }, { vend: 1 }); H('vending', 18.4, .15, { k: 'snacks' }, { vend: 1 });
  H('turnstile', 22, 1.5, { n: 3 }, { gate: 1 }); H('rail', 22, 0, { len: 1.5 }, { flip: true }); H('rail', 22, 4.8, { len: 8.2 }, { flip: true });
  for (const [y, k] of [[1.3, 'goggles'], [3.5, 'suits'], [5.7, 'towels'], [7.9, 'floats']]) H('shoprack', .15, y, { k, seed: y * 3 | 0 }, { flip: true, shop: 1 });
  H('shopcounter', 3.2, 9.6, {}, { flip: true, shop: 1, till: 1 }); H('kit', 3.1, 6.6, { k: 'rings' }, { solid: false }); H('kit', 3.2, 2.4, { k: 'noodles' });
  H('desk', 11.5, 5.6, { w: 5 }, { desk: 1 });
  H('bench', 2, 1.5, { w: 3 }); H('bench', 5.6, 1.5, { w: 3, kit: 1 }); H('bench', 23.2, 7, { w: 2.4, kit: 2 }); H('plant', .3, 11.9, { h: 2.2, seed: 3 }); H('plant', 20.9, 11.9, { h: 1.9, seed: 7 }); H('plant', 9.2, .2, { h: 1.2, seed: 9, pot: '#1fa3b8' }, { z: 0 });
  H('wetsign', 20.6, 3.4); H('furn.generic.bin', 16.4, .3, {});
  S(12.4, 5.2, 1, { kind: 'staff', label: 'Priti at the front desk', desk: 1 }); S(15, 5.2, 1, { kind: 'staff', label: 'Front desk', p: .6 }); S(2.6, 10.4, 0, { kind: 'staff', label: SHOP_NAME, shopk: 1 });
  S(13.6, 7.6, 3, { p: .5, anim: 'talk' }); S(13.9, 8.5, 3, { p: .35 }); S(4.2, 2.6, 3, { p: .6, label: 'Watching the pool', lines: ['Lane five. That is my daughter. The fast one. The other fast one.', 'I come for the view. It is cheaper than the aquarium.'] }); S(5, 2.9, 3, { age: 'kid', p: .5, anim: 'wave' });
  S(2.8, 1.75, 1, { seated: true, z: .46, p: .5 }); S(6.4, 1.75, 1, { seated: true, z: .46, p: .5, anim: 'phone' }); S(1.6, 4.4, 2, { p: .5 }); S(1.7, 8.6, 2, { p: .4, age: 'kid' }); S(18, 1.5, 3, { p: .4 }); S(9.9, 2, 3, { p: .5, label: 'Reading the records', lines: ['One-oh-nine point eight. In 1974. In a wool costume, probably.', 'Somebody should find out who she was.'] }); S(24, 7.25, 1, { seated: true, z: .46, p: .5 });
  defineRoom({ id: NR.hall, name: NAME, w: W, d: D, zoom: 0, music: 'quiet', noCrowd: true, showpiece: 'nat', floor: GT.f_tile, bg: '#152028', edge: '#3a4a50', wall: { color: '#eef2ee', trim: TEAL, h: 3.4 },
    exits: [{ x: 13, y: 12.3, label: 'Exit to Harbor Boulevard', use: () => NS() && NS().leave() }, { x: 24.3, y: 1.1, label: 'Changing Village', to: 'int:' + NR.change, use: () => NS() && NS().go('change') }, { x: 20.5, y: 1.1, label: 'Spectator Stand', to: 'int:' + NR.pool, use: () => NS() && NS().go('stand') }],
    spawn: { x: 13, y: 11.4, dir: 3 }, items, npcSpots: spots,
    setup(sc) {
      const Wd = sc.world, P = swimPeople(), gate = by(Wd, 'gate')[0];
      floorDecal(sc, W, D, (x, y) => { const w = 6.2 + Math.sin(x * .9) * .5 + Math.sin(x * 2.3) * .2; if (x < 4.6 && y > .6) return ((Math.floor(x * 2) + Math.floor(y * 2)) & 1) ? '#f6e9b8' : '#f2e2a4'; if (x > 22.5) return deck('#cfe9ee', '#c2e0e6')(x, y); if (Math.abs(y - w - 3) < .16 || Math.abs(y - w - 3.5) < .1) return '#1fa3b8'; if (y > w + 3.6) return deck('#dcecee', '#d2e6ea', 1)(x, y); return deck('#f0f4f0', '#e8eeea', 1)(x, y); });
      Wd.lights.push({ x: O + 14, y: O + 7, z: 0, r: 6, c: '#fff0c8' }, { x: O + 4.7, y: O + 2.4, z: 0, r: 5, c: '#b0f0f4' }, { x: O + 2.5, y: O + 7, z: 0, r: 4, c: '#ffe9b0' }, { x: O + 24, y: O + 3, z: 0, r: 3.5, c: '#ffd9a0' });
      // the live window onto the pool
      const V = board(sc, { axis: 'y', x: O + 1.1, y: O + .13, z: .74, w: 7.2, h: 24, lit: true }), sw = Array.from({ length: 7 }, (_, i) => ({ l: i % 5, s: 9 + i * 2.3, ph: i * 37 })); let vt = 0;
      const drawView = () => { const t = G.time, n = G.now().hf, open = n >= HOURS.open && n < HOURS.close, night = viewNow() === 'night'; V.clear(night ? '#2f7fa8' : '#46b4d8'); V.rect(0, 0, V.w, 3, night ? '#3a5a70' : '#d8ecee'); V.rect(0, 22, V.w, 2, night ? '#3a5a70' : '#d8ecee');
        for (let u = 0; u < V.w; u++) { for (let l = 0; l < 4; l++) if (u % 3 === 0) V.rect(u, 6 + l * 4, 1, 1, (u / 3 | 0) % 4 ? '#3b8fd8' : '#f4f8f8'); if ((u * 7 + Math.floor(t * 3)) % 11 === 0) V.rect(u, 4 + (u * 5) % 17, 2, 1, '#bff0f8'); }
        if (open) for (const s of sw) { const L = V.w - 8, q = (t * s.s + s.ph) % (2 * L), u = 3 + (q < L ? q : 2 * L - q), v = 4 + s.l * 4; V.rect(u, v, 3, 1, '#e8b890'); V.rect(u + (q < L ? -2 : 3), v, 2, 1, '#ffffff'); V.rect(u + (q < L ? 3 : -1), v, 1, 1, '#2a2733'); } };
      const cr = crowd(sc, sc.def.npcSpots, { seed: 91, fill: .6, lines: ['Forty lengths. Then chips. That is the deal I have with myself.', 'The wave machine goes on the hour and the half. You hear the siren from the car park.', 'My kid is in the Starfish class. He floats now. Mostly.', 'Bring a towel. Trust me on this.'] });
      dress(cr, s => (s.kind === 'staff' ? P.staff[s.shopk ? 2 : s.desk ? 0 : 1] : null));
      for (const c of cr.list) { const it = sc.interactables.find(i => i.ent === c); if (c.spot.desk && it) it.use = () => { c._hold = 3; NS() && NS().desk(c); }; if (c.spot.shopk && it) it.use = () => NS() && NS().shop(); }
      const wk = walkers(sc, { n: 5, label: 'Swimmer', lines: ['Hair still wet. Worth it.', 'Is the fast lane free? It is never free.'], route: () => { const inn = Math.random() < .5, a = { x: O + 13 + (Math.random() - .5) * 2, y: O + 12.2 }, m = { x: O + 14 + Math.random() * 4, y: O + 8.3, wait: 3, dir: 3 }, g = { x: O + 21.3, y: O + 3.2 + Math.random() }; return { kind: 'bag', pts: inn ? [a, m, g] : [g, { x: O + 16, y: O + 9 }, a] }; } });
      let tick = 0, view = null, open = null;
      const gates = on => { on = !!on; if (open === on) return; open = on; setP(gate, { open: on ? 1 : 0 }); for (let i = 0; i < 3; i++) { const y = O + 1.5 + i + .5; if (on) Wd.free(O + 22, y, O + 22.5, y + .5); else Wd.block(O + 22, y, O + 22.5, y + .5); } };
      const setBoards = () => { const N = NS(); if (!N) return; const c = N.chain(); setP(by(Wd, 'records')[0], { filled: c.st >= 5 ? 1 : 0 }); setP(by(Wd, 'honours')[0], { name: c.st >= 5 ? N.playerName() : '' }); setP(by(Wd, 'mural')[0], { on: c.st >= 5 ? 1 : 0 }); };
      const sync = () => { const h = G.now().hf, op = h >= HOURS.open && h < HOURS.close, L = !op ? 0 : h < 8 ? .4 : h < 16 ? .65 : h < 20 ? .9 : .5; cr.show(op, L > .7); wk.setActive(Math.round(L * 5)); if (NS()) gates(NS().entryOk()); };
      sc.nat = { gates, setBoards, sync, view: V };
      hook(sc, 'desk', 'Front desk', () => NS().desk()); hook(sc, 'vend', 'Vending machine', () => NS().vending()); hook(sc, 'shop', f => (f.item.till ? SHOP_NAME + ': the till' : SHOP_NAME), () => NS().shop()); hook(sc, 'records', 'Club records', () => NS().records()); hook(sc, 'notice', 'Timetable', () => NS().timetable());
      hook(sc, 'honours', 'Friends of the Marlins', () => NS().honours()); hook(sc, 'mural', 'The community wall', () => NS().lookMural()); hook(sc, 'gate', 'Turnstiles', () => NS().turnstile(), { spot: { x: O + 21.4, y: O + 3.25 }, h: 1 });
      sc.interactables.push({ x: O + 4.7, y: O + .3, label: 'Watch the pool through the window', h: 1.6, hit: 22, range: 2.2, spot: { x: O + 4.7, y: O + 1.1 }, use: () => NS() && NS().lookWindow() });
      sc.env = hallEnv(Wd, .7, .35); wireLife(sc, [cr, wk]); sync(); setBoards(); drawView();
      const u0 = sc.update; sc.update = (dt, gm) => { u0(dt, gm); cr.update(dt); wk.update(dt); if ((vt -= dt) <= 0) { vt = .22; drawView(); } if ((tick -= dt) <= 0) { tick = 1.5; sync(); } };
      const e0 = sc.onEnter; sc.onEnter = (o, pv) => { e0(o, pv); open = null; sync(); setBoards(); if (NS()) NS().arrived('hall', sc, pv); };
    } });
}
registerInfo(NAME, { blurb: 'The public pool under the glass vault on Harbor Boulevard: an eight-lane competition pool, a diving well with a five-metre platform, a leisure pool with a lazy river, a wave machine, two slides and a tipping bucket, a sauna and cold plunge, a poolside cafe and a summer lido. Home of the Maple Bay Marlins.',
  signature: 'The wave-machine siren, and Saturday\'s swim meet from the stand.', tryThis: ['Change at a locker and rinse before you swim', 'Swim a timed 100 m and tap the rhythm', 'Take a lesson with Coach Okafor and earn a badge', 'Dive from the three-metre board for the judges', 'Lean into the bends on The Twister', 'Float once round the lazy river', 'Sauna, then the cold plunge', 'Watch the Saturday meet, or enter the Novice 50 m', 'Ask Walt about the gap on the record board'], activities: ['nat_swim', 'nat_dive', 'nat_slide', 'nat_river', 'nat_sauna', 'nat_meet'], kind: 'pool' });

/* ================= Changing Village ================= */
{
  const W = 20, D = 11, { items, spots, H, Wl, S } = mkItems();
  H('cubicles', .6, .1, { n: 6, seed: 4 }, { cubicle: 1 }); H('lockers', 7.9, .1, { w: 3, seed: 2 }, { locker: 1, no: 114 }); H('lockers', 11.1, .1, { w: 3, seed: 5 }, { locker: 1, no: 131 });
  Wl('dryer', 'y', 14.7, { n: 2 }, { dryer: 1, mount: .6 }); Wl('furn.lobby.restroom', 'y', 17.9, { c: '#3f8a8a', dc: '#1f6a7a' }); Wl('showers', 'x', 1.6, { n: 4 }, { shower: 1 }); Wl('sign', 'y', 8.4, { t: 'LOCKERS', w: 2, c: '#22304e' }, { mount: 2.3 }); Wl('sign', 'x', 6.2, { t: 'SHOWER FIRST PLEASE', w: 5, c: '#1fa3b8' }, { mount: 1.9 });
  H('bench', 5.4, 4.3, { w: 3, kit: 1 }); H('bench', 10.2, 4.3, { w: 3, kit: 2 }); H('bench', 7.8, 6.7, { w: 3 }); H('bench', .2, 6.4, { w: 2.4 }, { flip: true });
  H('towelcart', 16.4, 2.6, {}, { cart: 1 }); H('footbath', 2, 9, { w: 2.4 }); H('footbath', 9, 9, { w: 2.4 }); H('wetsign', 6, 8.6); H('plant', 18.9, .2, { h: 1.4, seed: 2 }); H('furn.generic.bin', 14.1, .3, {});
  S(17.6, 3.2, 2, { kind: 'staff', label: 'The changing-room attendant', lines: ['Towels are two dollars to hire, or bring your own next time.', 'Locker keys go round the wrist. I have fished forty out of the filter this year.', 'Rinse first, please. The showers are right there on the left.'] });
  S(6.2, 4.55, 1, { seated: true, z: .46, p: .6, swim: 1 }); S(7.6, 4.55, 1, { seated: true, z: .46, p: .5 }); S(11.4, 4.55, 1, { seated: true, z: .46, p: .5, swim: 1, age: 'kid' }); S(8.6, 6.95, 1, { seated: true, z: .46, p: .5, anim: 'phone' });
  S(9.2, 1.4, 3, { p: .6, swim: 1 }); S(12.8, 1.4, 3, { p: .5 }); S(15.6, 1.3, 3, { p: .5, label: 'Drying her hair', lines: ['WHAT? I CAN\'T HEAR YOU. HAIRDRYER.'] }); S(1.15, 3, 0, { p: .55, swim: 1, anim: 'shower', sh: 1 }); S(3.4, 8, 1, { p: .4, swim: 1, age: 'kid' }); S(11.2, 8.2, 1, { p: .4, swim: 1 });
  defineRoom({ id: NR.change, name: 'Changing Village', w: W, d: D, zoom: 0, music: 'quiet', noCrowd: true, showpiece: 'nat', floor: GT.f_tile, bg: '#152028', edge: '#3a4a50', wall: { color: '#e4eef0', pattern: 'tile', trim: TEAL, h: 3 },
    exits: [{ x: 19.2, y: 6, label: 'Entrance Hall', to: 'int:' + NR.hall, use: () => NS() && NS().go('hall') }, { x: 10.2, y: 10.4, label: 'Competition Pool', to: 'int:' + NR.pool, use: () => NS() && NS().go('pool') }, { x: 3.2, y: 10.4, label: 'Leisure Pool', to: 'int:' + NR.leisure, use: () => NS() && NS().go('leisure') }],
    spawn: { x: 18.2, y: 6, dir: 2 }, items, npcSpots: spots,
    setup(sc) {
      const Wd = sc.world, P = swimPeople();
      floorDecal(sc, W, D, (x, y) => { if (x < 2.1 && y > 1.3 && y < 5.9) { const fx = x * 3 - Math.floor(x * 3), fy = y * 3 - Math.floor(y * 3); return fx < .1 || fy < .1 ? '#8fc8d0' : Math.sin(x * 7 + y * 9) > .8 ? '#d8f6fa' : '#a8dce4'; } const k = R.hash2(Math.floor(x * 2.2), Math.floor(y * 2.2), 9); if (k > .93 && y > 2) return '#bfdfe6'; return deck('#dfeaea', '#d4e2e2', .5)(x, y); });
      Wd.lights.push({ x: O + 9, y: O + 4, z: 0, r: 6, c: '#fff0c8' }, { x: O + 1.4, y: O + 3.5, z: 0, r: 3, c: '#b0f0f4' }, { x: O + 16, y: O + 2, z: 0, r: 3, c: '#ffe9b0' });
      const jets = [0, 1, 2, 3].map(i => { const j = jet(sc, O + .55, O + 2 + i, .1, 'spray'); j.on = false; return j; });
      const cr = crowd(sc, sc.def.npcSpots, { seed: 23, fill: .6, lines: ['Which locker was I. One-one-something.', 'I always forget how cold the footbath is.', 'Left sock. Has anyone seen a left sock.', 'The secret is to get dressed while still slightly damp and regret it all day.'] });
      dress(cr, (s, c) => (s.kind === 'staff' ? P.staff[3] : s.swim ? (s.age === 'kid' ? P.kid : P.adult)[Math.floor(c.roll * 97) % (s.age === 'kid' ? P.kid.length : P.adult.length)] : null));
      const shw = cr.list.find(c => c.spot.sh); let tick = 0;
      const sync = () => { const h = G.now().hf, op = h >= HOURS.open && h < HOURS.close; cr.show(op, h > 16 && h < 20); if (shw) jets[1].on = !shw.hidden || jets[1].mine; };
      sc.nat = { jets, sync, showerSpot: i => ({ x: O + 1.15, y: O + 2 + i }), lockers: sc.fixtures.filter(f => f.item.locker) };
      hook(sc, 'locker', 'Lockers', f => NS().locker(f)); hook(sc, 'dryer', 'Hairdryer', () => NS().dryer(), { spot: { x: O + 15.9, y: O + .9 } }); hook(sc, 'cart', 'Towel hire', () => NS().towel()); hook(sc, 'cubicle', 'Changing cubicles', () => NS().cubicle());
      for (const i of [0, 2, 3]) sc.interactables.push({ x: O + .4, y: O + 2 + i, label: 'Shower', h: 1.8, hit: 12, range: 1.4, spot: { x: O + 1.15, y: O + 2 + i }, use: () => NS() && NS().shower(i) });
      sc.env = hallEnv(Wd, .75, .3); wireLife(sc, [cr]); sync();
      const u0 = sc.update; sc.update = (dt, gm) => { u0(dt, gm); cr.update(dt); sweep(sc); if ((tick -= dt) <= 0) { tick = 1.5; sync(); } };
      const e0 = sc.onEnter; sc.onEnter = (o, pv) => { e0(o, pv); sync(); if (NS()) NS().arrived('change', sc, pv); };
    } });
}

export function init() {
  G.underlays.push((ctx, cam) => { const sc = G.scene; if (!sc || !sc.waters) return; for (let i = 0; i < sc.waters.length; i++) sc.waters[i].draw(ctx, cam, G.time); });
}
