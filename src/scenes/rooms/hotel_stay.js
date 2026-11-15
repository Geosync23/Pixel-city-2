// The Grand Maple Hotel — The Tidewater Spa (room `hotel_spa`, 24 x 16: pool, whirlpool, sauna, massage, loungers, lockers, showers), the seventh-floor corridor (room `hotel_floor`, 22 x 7)
// and the guest room (room `hotel_room`, dynamic: built for the tier of the current stay, G.hotel.stay(); classic 10 x 7, bay 12 x 8, suite 15 x 9).
//   spa   scene.hot = { sync(), open(), swimmers, me (the player's swimmer), lane() -> { x0, x1, y } (world), soakSpot, soakMe(on), swimMe(on, x) }
//   floor scene.hot = { sync(), doors: { no: ob }, maid }
//   room  scene.hot = { tier, tray (ob), deliver(cb) (a waiter brings the dome to the tray table), trayState(p) }
// Fixture tags handled here (hotel rooms only): hotel_lounger, hotel_sauna, hotel_massage, hotel_roomdoor (item.p.no), hotel_bed, hotel_phone, hotel_closet, hotel_minibar, hotel_tray;
//   + item fields: locker, wash ('shower' | 'bath'), view (windows of the guest room), pool / whirl interactables added in setup.
import { G } from '../../core/game.js';
import { GT } from '../../engine/world.js';
import * as R from '../../engine/raster.js';
import { defineRoom, registerFixture } from '../interior.js';
import { bubble } from '../../ui/kit.js';
import { crowd, walkers } from './_show_life.js';
import { specs } from './_airport_life.js';
import { O, HS, pick, setP, viewNow, only, people, mk, step, go, propEnt, softEnv, dress, seatsOf, LOBBY_AT } from './hotel.js';
import { HR, SPA_NAME, HOURS, TIERS, inH } from '../../data/hotel.js';

const mkItems = () => { const items = [], spots = []; return { items, spots, H: (id, x, y, p, o) => { const it = Object.assign({ id: id.includes('.') ? id : 'furn.hotel.' + id, x, y, p: p || {} }, o); items.push(it); return it; }, Wl: (id, wall, at, p, o) => { const it = Object.assign({ id: id.includes('.') ? id : 'furn.hotel.' + id, wall, at, p: p || {} }, o); items.push(it); return it; }, S: (x, y, dir, o) => spots.push(Object.assign({ x, y, dir }, o)) }; };

/* ================= The Tidewater Spa ================= */
const POOL = { x0: 2, y0: 7, x1: 14.6, y1: 12.6 }, WH = { x: 3.3, y: 3.1, r: 1.7 };
{
  const W = 24, D = 16, { items, spots, H, Wl, S } = mkItems();
  Wl('window', 'y', 1.2, { w: 4.2, view: 'bay', c: '#2f6a6a' }, { win: 1 }); Wl('window', 'x', 5.6, { w: 3, c: '#2f6a6a', seed: 8 }, { win: 1 }); Wl('window', 'x', 11, { w: 3, c: '#2f6a6a', seed: 9 }, { win: 1 });
  H('sauna', 6.6, .2, { part: 'back' }, { sauna: 1 }); H('sauna', 6.48, .2, { part: 'side' }); H('sauna', 6.6, 2.5, { part: 'front' }); H('sauna', 9.8, .2, { part: 'glass' });
  H('bathwall', 10.6, .1, { d: 3.2 }); H('bathwall', 13.45, .1, { d: 3.2 }); H('massage', 11.1, .5, {}, { massage: 1 });
  H('furn.generic.lockers', 14.2, .15, {}, { locker: 1 }); H('furn.generic.lockers', 16.3, .15, {}, { locker: 1 }); H('furn.home.bath.shower', 18.7, .2, { tier: 2 }, { wash: 'shower' }); H('furn.home.bath.shower', 19.8, .2, { tier: 2 }, { wash: 'shower' });
  Wl('lift', 'y', 21.2, { at: .33 }, { lift: 1 });
  [2.4, 4.4, 6.4, 8.4, 10.4, 12.4].forEach((x, i) => H('lounger', x, 13.5, { c: i % 2 ? '#e8a23a' : '#3f8a8a' }, { lounger: 1 }));
  H('desk', 17, 6.6, { kind: 'spa', w: 2.6 }, { spa: 1 }); H('poolrail', 14.7, 9.5, {}, { flip: true });
  for (const [x, y, s] of [[.5, .5, 3], [.6, 14.9, 4], [15.6, 14.8, 6], [22.9, 5.6, 2], [5.6, .5, 9]]) H('palm', x, y, { seed: s });
  S(18.3, 6.15, 1, { kind: 'staff', label: SPA_NAME, lines: ['Welcome to the Tidewater. Day passes are at this desk; hotel guests walk straight in.', 'The sauna is at eighty degrees. Ten minutes is plenty.', 'Ingrid has hands like a tide. Book the massage.'] });
  S(15.6, 8.8, 2, { robe: 1, p: .5 }); S(8.6, 6.2, 1, { robe: 1, p: .5, anim: 'phone' }); S(16, 11.6, 2, { robe: 1, busy: 1 }); S(5.4, 5.9, 3, { robe: 1, busy: 1 }); S(19.4, 2.3, 3, { robe: 1, p: .4 });
  defineRoom({ id: HR.spa, name: SPA_NAME + ' & Pool', w: W, d: D, zoom: 0, music: 'quiet', noCrowd: true, showpiece: 'hotel', floor: GT.f_tile, bg: '#141a22', edge: '#3a4a50', wall: { color: '#dfe8e4', trim: '#3f8a8a', h: 3.7, rail: 1.2 },
    exits: [{ x: 22.6, y: 14.9, label: 'Stairs down to the lobby', to: 'int:' + HR.lobby, use: () => G.go('int:' + HR.lobby, LOBBY_AT.stairs) }, { x: 22.4, y: 1.3, label: 'Lift', to: 'int:' + HR.lobby, use: () => HS() && HS().lift() }], spawn: { x: 21.6, y: 13.8, dir: 2 }, items, npcSpots: spots,
    setup(sc) {
      const Wd = sc.world, by = k => Wd.objs.filter(o => o.data && o.data[k]), P = people(), wins = by('win');
      Wd.decal({ x0: O, y0: O, x1: O + W, y1: O + D, draw(Rr) { const h2 = Rr.hash2 || R.hash2; Rr.qz(O, O + W, O, O + D, 0, (x, y) => { const X = x - O, Y = y - O, dw = Math.hypot(X - WH.x, Y - WH.y);
        if (dw < WH.r + .3) { if (dw > WH.r) return '#2f6a6a'; if (dw > WH.r - .14) return '#1f7a8a'; return h2(Math.floor(X * 9), Math.floor(Y * 9), 3) > .7 ? '#e8fbfc' : (Math.floor(X * 6 + Y * 4) & 1 ? '#6fd0d8' : '#58c0cc'); }
        const ex = Math.max(POOL.x0 - X, X - POOL.x1), ey = Math.max(POOL.y0 - Y, Y - POOL.y1), e = Math.max(ex, ey);
        if (e < 0) { if (e > -.12) return '#1f7a8a'; const ln = (Y - POOL.y0) / 1.4, fl = ln - Math.floor(ln); if (fl < .06 && Math.floor(ln) > 0) return Math.floor(X * 2.5) & 1 ? '#e8483a' : '#f4f0e8'; const wv = Math.sin(X * 3.1 + Y * 1.7) + Math.sin(X * 1.3 - Y * 2.9); return wv > 1.3 ? '#a8ecf0' : wv < -1.2 ? '#3aa8bc' : (Math.abs(fl - .5) < .03 ? '#3898b0' : '#4ab8c8'); }
        if (e < .35) return '#f4f0e8'; if (e < .5) return '#2f6a6a';
        const fx = X - Math.floor(X), fy = Y - Math.floor(Y); if (fx < .04 || fy < .04) return '#b8c8c4'; return (Math.floor(X) + Math.floor(Y)) & 1 ? '#e6eeea' : '#d8e4e0'; }); } }); Wd.version++;
      Wd.block(O + POOL.x0, O + POOL.y0, O + POOL.x1, O + POOL.y1); Wd.block(O + WH.x - 1.5, O + WH.y - 1.5, O + WH.x + 1.5, O + WH.y + 1.5);
      Wd.lights.push({ x: O + 8, y: O + 9.8, z: 0, r: 7, c: '#b0f0f4' }, { x: O + WH.x, y: O + WH.y, z: 0, r: 3.5, c: '#b0f0f4' }, { x: O + 8.2, y: O + 1.6, z: 0, r: 3, c: '#ffb878' }, { x: O + 18.3, y: O + 7.6, z: 0, r: 4, c: '#ffe9b0' }, { x: O + 12, y: O + 2, z: 0, r: 3, c: '#ffe2a0' });
      const seats = seatsOf(sc, /hotel\.lounger|hotel\.sauna/, { add: (f, i, n) => ({ p: /sauna/.test(f.asset.id) ? .5 : .55, swim: /sauna/.test(f.asset.id) || n % 2 ? 1 : 0, robe: 1, busy: n % 4 === 3 ? 1 : 0, anim: /sauna/.test(f.asset.id) ? 'sit' : n % 3 === 0 ? 'read' : 'sit', label: 'Spa guest' }) });
      const LN = ['Twenty lengths. Well. Twelve. I counted generously.', 'I fell asleep on the lounger and woke up a better person.', 'The sauna, then the cold shower, then the sauna. That is the whole secret.', 'You can see the bay from the whirlpool. I am never leaving.'];
      const cr = crowd(sc, sc.def.npcSpots.concat(seats), { seed: 47, fill: .6, lines: LN });
      dress(cr, (s, c) => (s.kind === 'staff' ? Object.assign({}, P.concierge[0], { top: 'polo', topColor: '#f4f0e8', bottom: 'slacks', bottomColor: '#3f8a8a' }) : s.swim ? P.swim[Math.floor(c.roll * 97) % P.swim.length] : P.robe[Math.floor(c.roll * 89) % P.robe.length]));
      const therapist = mk(sc, Object.assign({}, P.concierge[1], { top: 'polo', topColor: '#f4f0e8', bottom: 'slacks', bottomColor: '#f4f0e8' }), 12.95, 2.4, 1, 'Ingrid, the massage therapist', c => HS() && HS().massage(sc.fixtures.find(f => f.item.massage), sc));
      // swimmers: three lanes of laps, lane 4 (nearest) is kept for the player
      const sw = (i, sp) => { const e = propEnt('furn.hotel.swimmer', { skin: sp.skin, hair: sp.hairColor, frame: 0, rev: 0 }, sc); e.lane = i; e.dirx = i % 2 ? 1 : -1; e.x = O + POOL.x0 + 1 + i * 3.2; e.y = O + POOL.y0 + .4 + i * 1.4; e.spd = 1.1 + i * .25; e.ft = 0; return e; };
      const swimmers = [0, 1, 2].map(i => sw(i, P.swim[i * 3])), me = sw(3, G.state.player.spec || {}); me.hidden = true; me.spd = 1.9; const soak = [0, 1].map(i => { const e = propEnt('furn.hotel.swimmer', { soak: 1, skin: P.swim[i + 4].skin, hair: P.swim[i + 4].hairColor }, sc); e.x = O + WH.x - .9 + i * 1.1; e.y = O + WH.y - .8 + i * .5; return e; }), soakMe = propEnt('furn.hotel.swimmer', { soak: 1 }, sc); soakMe.hidden = true; soakMe.x = O + WH.x - .2; soakMe.y = O + WH.y + .3;
      const lap = (e, dt) => { e.x += e.dirx * e.spd * dt; if (e.x > O + POOL.x1 - 1.4) { e.x = O + POOL.x1 - 1.4; e.dirx = -1; } else if (e.x < O + POOL.x0 + .2) { e.x = O + POOL.x0 + .2; e.dirx = 1; } if ((e.ft += dt) > .22) { e.ft = 0; e.set({ frame: ((e.p.frame || 0) + 1) % 4, rev: e.dirx < 0 ? 1 : 0 }); } };
      let view = null, tick = 0, lvl = -1; const open = () => inH(G.now().hf, HOURS.spa);
      const sync = () => { const v = viewNow(); if (v !== view) { view = v; for (const o of wins) setP(o, { time: v }); } const h = G.now().hf, op = open(), L = !op ? 0 : h < 9 ? .35 : h < 12 ? .55 : h < 17 ? .75 : .5;
        if (L !== lvl) { lvl = L; for (const c of cr.list) { const s = c.spot; c.hidden = s.kind === 'staff' ? !op : s.busy ? L < .7 || c.roll > L : c.roll > (s.p || .5) * (.3 + L); } swimmers.forEach((e, i) => { e.hidden = !op || i >= Math.round(L * 3.4); }); soak.forEach((e, i) => { e.hidden = !op || i >= Math.round(L * 2.2); }); therapist.hidden = !op; } sc.life.open = op; };
      sc.life = { crowd: cr, count: () => cr.count() + swimmers.filter(e => !e.hidden).length + soak.filter(e => !e.hidden).length };
      sc.hot = { sync, open, swimmers, me, soak, therapist, lane: () => ({ x0: O + POOL.x0 + .3, x1: O + POOL.x1 - 1.5, y: O + POOL.y0 + .4 + 3 * 1.4 }), soakSpot: { x: O + WH.x, y: O + WH.y + 2.1 },
        swimMe(on) { const sp = G.state.player.spec || {}; me.hidden = !on; if (on) { me.set({ skin: sp.skin, hair: sp.hairColor }); me.x = O + POOL.x0 + .3; me.dirx = 1; } }, soakMe(on) { const sp = G.state.player.spec || {}; soakMe.hidden = !on; if (on) soakMe.set({ soak: 1, skin: sp.skin, hair: sp.hairColor }); }, laps: () => me._laps || 0 };
      sc.interactables.push({ x: O + 8.3, y: O + POOL.y1 + .1, label: 'The pool', h: .3, hit: 26, range: 1.6, spot: { x: O + 8.3, y: O + POOL.y1 + .75 }, use: () => HS() && HS().swim(sc) });
      sc.interactables.push({ x: O + WH.x, y: O + WH.y + .6, label: 'The whirlpool', h: .3, hit: 20, range: 1.6, spot: sc.hot.soakSpot, use: () => HS() && HS().soak(sc) });
      for (const f of sc.fixtures) { if (f.item.locker) sc.interactables.push({ x: f.x, y: f.y, label: 'Lockers', h: 1.4, hit: 12, spot: f.use, fx: f, use: () => HS() && HS().locker(sc) }); if (f.item.wash) sc.interactables.push({ x: f.x, y: f.y, label: 'Shower', h: 1.6, hit: 12, spot: f.use, fx: f, use: () => HS() && HS().wash(f, 'shower') }); }
      sc.env = softEnv(Wd, .7, .4); sync();
      const u0 = sc.update; sc.update = (dt, gm) => { u0(dt, gm); cr.update(dt); if ((tick -= dt) <= 0) { tick = 1.5; sync(); } for (const e of swimmers) if (!e.hidden) lap(e, dt); if (!me.hidden) { const d0 = me.dirx; lap(me, dt * (G.busy ? 1 : 0)); if (d0 !== me.dirx) me._laps = (me._laps || 0) + 1; } therapist.t += dt; if (therapist._hold > 0) therapist._hold -= dt; else therapist.dir = 1; };
      const e0 = sc.onEnter; sc.onEnter = (o, pv) => { e0(o, pv); view = null; sync(); if (HS()) HS().arrivedIn('spa', sc); };
      const x0 = sc.onExit; sc.onExit = to => { x0(to); me.hidden = true; soakMe.hidden = true; if (HS()) HS().left('spa', sc); };
    } });
}

/* ================= seventh floor ================= */
export const DOORS = ['701', '702', '704', '706', '709', '710'];
{
  const W = 22, D = 7, { items, spots, H, Wl, S } = mkItems();
  DOORS.forEach((no, i) => Wl('roomdoor', 'y', 1.6 + i * 3.3, { no, dnd: i === 1 ? 1 : 0, tray: i === 3 ? 1 : 0, paper: i === 0 ? 1 : 0, c: no === '710' ? '#3a2a4a' : '#5a2a30' }, { door: no }));
  Wl('lift', 'x', 2.2, { at: .66 }, { lift: 1 }); H('carpet', 1.2, 2.3, { w: 20.4, d: 2.6, c: '#7a2030' }); H('hkcart', 12.2, 1.1, {}, { hk: 1 }); H('furn.generic.vending', 20.8, .15, {}); H('furn.lobby.settee', 8.6, 5.7, { c: '#2f5a4a', a: '#e8c06a' }); H('palm', 21, 5.8, { seed: 3 }); H('palm', .6, 5.9, { seed: 6 }); H('furn.generic.picture', 0, 0, {});
  items.pop(); Wl('furn.generic.picture', 'x', .4, { kind: 'sea', w: 1 }); Wl('furn.generic.picture', 'x', 5.2, { kind: 'sea', w: 1 });
  defineRoom({ id: HR.floor, name: 'Seventh Floor — Guest Rooms', w: W, d: D, zoom: 1, music: 'quiet', noCrowd: true, showpiece: 'hotel', floor: GT.f_darkwood, bg: '#14121c', edge: '#3a3038', wall: { color: '#e8dcc4', trim: '#6a4430', h: 3.1, rail: 1 },
    exits: [{ x: 1.5, y: 3.4, label: 'Lift', to: 'int:' + HR.bar, use: () => HS() && HS().lift() }], spawn: { x: 2.5, y: 3.5, dir: 0 }, items, npcSpots: spots,
    setup(sc) {
      const Wd = sc.world, P = people(), AP = specs(), doors = {}; for (const o of Wd.objs) if (o.data && o.data.door) doors[o.data.door] = o;
      Wd.lights.push({ x: O + 5, y: O + 3.4, z: 0, r: 4, c: '#ffe2a0' }, { x: O + 11, y: O + 3.4, z: 0, r: 4, c: '#ffe2a0' }, { x: O + 17, y: O + 3.4, z: 0, r: 4, c: '#ffe2a0' });
      const maid = mk(sc, P.maid[0], 13, 2.3, 3, 'Housekeeping', ['Fresh towels in every room by two.', 'Somebody in 706 has eaten four room-service breakfasts. FOUR.', 'If the sign says do not disturb, I do not disturb. I do wonder, though.']); maid.speed = 1.4; let mi = 0, mw = 4;
      const lane = () => { const i = Math.floor(Math.random() * DOORS.length), dx = 2.35 + i * 3.3, a = { x: O + 2.6, y: O + 3.4 + Math.random() * .6 }, b = { x: O + dx, y: O + 3 + Math.random() * .6 }, c = { x: O + dx, y: O + 1.1 }; return { pts: Math.random() < .5 ? [a, b, c] : [c, b, a], kind: Math.random() < .3 ? 'bag' : 'walk' }; };
      const wk = walkers(sc, { n: 3, route: lane, lines: ['Is the ice machine on this floor? It is ALWAYS on another floor.', 'Seven-oh-six... seven-oh-six... ah.', 'The lift goes to the roof. I only just found out.'], label: 'Hotel guest' });
      let tick = 0, mine = null;
      const sync = () => { const st = HS() && HS().stay ? HS().stay() : null, no = st ? st.no : null; if (no !== mine) { mine = no; for (const k in doors) setP(doors[k], { mine: k === no ? 1 : 0 }); } const h = G.now().hf; maid.hidden = h < 9 || h >= 17; wk.setActive(h < 6 ? 0 : h < 9 || h >= 21 ? 1 : 2); };
      sc.life = { walkers: wk, count: () => wk.count() + (maid.hidden ? 0 : 1) }; sc.hot = { sync, doors, maid }; sc.env = softEnv(Wd, .5, .55); sync();
      const u0 = sc.update; sc.update = (dt, gm) => { u0(dt, gm); wk.update(dt); if ((tick -= dt) <= 0) { tick = 1.5; sync(); }
        if (!maid.hidden && !step(maid, Wd, dt)) { if ((mw -= dt) <= 0) { mi = (mi + 1) % 4; const q = [[13, 2.3, 3], [9.9, 1.2, 3], [13.9, 2.3, 2], [16.5, 1.2, 3]][mi]; maid.pose = null; if (go(maid, Wd, q[0], q[1])) { mw = 5 + Math.random() * 6; maid._d = q[2]; } else mw = 2; } else { maid.dir = maid._d === undefined ? 3 : maid._d; maid.pose = mi % 2 ? 'work' : null; } } };
      const e0 = sc.onEnter; sc.onEnter = (o, pv) => { e0(o, pv); mine = undefined; sync(); if (HS()) HS().arrivedIn('floor', sc); };
    } });
}

/* ================= the guest room (dynamic) ================= */
const SIZE = { classic: [10, 7], bay: [12, 8], suite: [15, 9] };
function roomDef(arg) {
  const st = HS() && HS().stay ? HS().stay() : null, tid = (arg && arg.tier) || (st && st.tier) || 'classic', T = TIERS.find(t => t.id === tid) || TIERS[0], ti = TIERS.indexOf(T), [W, D] = SIZE[T.id], { items, H, Wl } = mkItems(), by = D - 2.9, nw = ti === 2 ? 5.5 : 3.2;
  H('closet', 1.2, .15, {}); H('furn.home.nightstand', 3.25, .3, { tier: 2 }); H('bed', 3.8, .3, { tier: ti }, { bedfx: 1 }); H('furn.home.nightstand', 6.3, .3, { tier: 2 });
  H('carpet', 3, 2.4, { w: 4.2, d: 2.2, c: ['#7a2030', '#22304e', '#b8862e'][ti], c2: '#e8c06a' });
  H('wdesk', .25, .95, {}, { flip: true }); H('minibar', .25, 2.6, {}, { flip: true });
  Wl('window', 'y', 7.2, { w: ti === 0 ? 2.4 : ti === 1 ? 4.4 : 3.4, view: ti ? 'bay' : 'city', c: ['#7a2030', '#22304e', '#b8862e'][ti], seed: 4 }, { win: 1, view: 1 }); if (ti === 2) Wl('window', 'y', 11, { w: 3.6, view: 'bay', c: '#b8862e', seed: 11 }, { win: 1, view: 1 });
  Wl('furn.generic.picture', 'x', by - .0 > 5 ? 4.3 : 0, { kind: 'sea', w: 1 }); if (by <= 5) items.pop();
  // bathroom nook behind a tiled partition
  H('bathwall', 0, by, { w: nw - 1, d: .15, h: 2.4 }); H('furn.home.bath.toilet', .3, by + .2, { tier: 2 }); H('furn.home.bath.sink', 1, by + .2, { tier: 2 }); if (ti === 2) { H('furn.home.bath.shower', 2.2, by + .2, { tier: 2 }, { wash: 'shower' }); H('furn.home.bath.bathtub', 3.4, by + 1.6, { tier: 2 }, { wash: 'bath' }); } else H('furn.home.bath.shower', nw - 1.05, by + 1.7, { tier: 2 }, { wash: 'shower' });
  H('furn.home.bath.mat', 1, by + 1.4, {});
  // sitting corner + the room-service table
  if (ti === 0) { H('furn.cafe.armchair', 7.6, 3, { c: '#7a2030' }); H('tray', 7.7, 4.6, { empty: 1 }, { tray: 1 }); H('luggage', 4.4, 5.6, {}); }
  else if (ti === 1) { H('furn.lobby.settee', 8, 3.2, { c: '#22304e', a: '#e8c06a' }); H('tray', 8.5, 4.9, { empty: 1 }, { tray: 1 }); H('furn.cafe.armchair', 10.6, 4.4, { c: '#2f5a4a' }, { flip: true }); H('luggage', 4.6, 6.6, {}); }
  else { H('furn.lobby.settee', 8.2, 3.4, { c: '#b8862e', a: '#f4ecd8', w: 3 }); H('tray', 9.2, 5.2, { empty: 1 }, { tray: 1 }); H('furn.cafe.armchair', 12, 4.6, { c: '#7a2030' }, { flip: true }); H('furn.home.fireplace', 12.6, .2, {}); H('chandelier', 8.6, 4, { r: .6 }, { z: 1.6 }); H('luggage', 6.4, 7.6, {}); H('palm', 14, 7.8, { seed: 2 }); }
  return { name: T.name + ' ' + T.no, w: W, d: D, tier: T.id, tierIndex: ti, zoom: 1, music: 'quiet', noCrowd: true, showpiece: 'hotel', guestRoom: true, floor: GT.f_wood, floors: [{ x0: 0, y0: by, x1: nw, y1: D, floor: GT.f_tile }], bg: '#14121c', edge: '#3a3038',
    wall: { color: ['#e8dcc4', '#dfe4e8', '#ead8c0'][ti], trim: '#6a4430', h: 3, rail: 1 }, exits: [{ x: W / 2 + 1.4, y: D - .5, label: 'Leave the room', to: 'int:' + HR.floor, use: () => HS() && HS().leaveRoom() }], spawn: { x: W / 2 + 1.4, y: D - 1.5, dir: 3 }, items, npcSpots: [] };
}
defineRoom({ id: HR.room, build: roomDef,
  setup(sc) {
    const Wd = sc.world, P = people(), wins = Wd.objs.filter(o => o.data && o.data.win), trayOb = Wd.objs.find(o => o.data && o.data.tray), def = sc.def;
    Wd.lights.push({ x: O + 5, y: O + 1.6, z: 0, r: 4.5, c: '#ffe2a0' }, { x: O + 1.4, y: O + 2, z: 0, r: 3, c: '#ffe2a0' }, { x: O + def.w - 2.4, y: O + 4, z: 0, r: 3.5, c: '#ffe9b0' });
    const waiter = mk(sc, P.waiter[5], def.w / 2 + 1.4, def.d - 1, 3, 'Room service', ['Shall I pour? No? Enjoy.']); waiter.hidden = true; waiter.speed = 2.2; let job = null, view = null, tick = 0;
    for (const f of sc.fixtures) { if (f.item.wash) sc.interactables.push({ x: f.x, y: f.y, label: f.item.wash === 'bath' ? 'Claw-foot tub' : 'Rain shower', h: 1.2, hit: 12, spot: f.use, fx: f, use: () => HS() && HS().wash(f, f.item.wash) }); if (f.item.view) sc.interactables.push({ x: f.x, y: f.y, label: 'Look out of the window', h: 2, hit: 14, spot: f.use, use: () => HS() && HS().view(def.tier) }); }
    const sync = () => { const v = viewNow(); if (v !== view) { view = v; for (const o of wins) setP(o, { time: v }); } };
    sc.hot = { tier: def.tier, tray: trayOb, trayState: q => setP(trayOb, Object.assign({ empty: 0, dome: true }, q)), sync,
      deliver(cb) { if (job) return false; const tf = sc.fixtures.find(f => f.item.tray), u = tf.use || { x: tf.x, y: tf.y + 1 }; waiter.hidden = false; waiter.x = O + def.w / 2 + 1.4; waiter.y = O + def.d - .9; waiter.carry = true; waiter.poseOpts = { item: 'tray' }; bubble(waiter, 'Room service!'); job = { st: 0, cb }; if (!go(waiter, Wd, u.x - O, u.y - O)) { waiter.x = u.x; waiter.y = u.y; } return true; } };
    sc.env = softEnv(Wd, .5, .6); sync();
    const u0 = sc.update; sc.update = (dt, gm) => { u0(dt, gm); if ((tick -= dt) <= 0) { tick = 2; sync(); }
      if (job && !step(waiter, Wd, dt)) { if (job.st === 0) { job.st = 1; waiter._hold = 1.2; waiter.pose = 'work'; } else if (job.st === 1) { job.st = 2; waiter.pose = null; waiter.carry = false; waiter.poseOpts = null; setP(trayOb, { empty: 0, dome: true }); if (job.cb) job.cb(); if (!go(waiter, Wd, def.w / 2 + 1.4, def.d - .9)) job.st = 3; } else { waiter.hidden = true; job = null; } } };
    const e0 = sc.onEnter; sc.onEnter = (o, pv) => { e0(o, pv); view = null; sync(); if (HS()) HS().arrivedIn('room', sc); };
    const x0 = sc.onExit; sc.onExit = to => { x0(to); if (HS()) HS().left('room', sc); };
  } });

export function init() {
  registerFixture('hotel_lounger', only((fx, sc) => ({ label: 'Pool lounger', hit: 12, use: () => HS() && HS().lounger(fx, sc) })));
  registerFixture('hotel_sauna', only((fx, sc) => (fx.item.sauna ? { label: 'Sauna', hit: 16, h: 1.6, spot: { x: fx.ob.B[0] + 2.6, y: fx.ob.B[4] + 1.9 }, use: () => HS() && HS().sauna(fx, sc) } : null)));
  registerFixture('hotel_massage', only((fx, sc) => ({ label: 'Massage table', hit: 12, use: () => HS() && HS().massage(fx, sc) })));
  registerFixture('hotel_roomdoor', only((fx, sc) => ({ label: 'Room ' + fx.item.p.no, hit: 12, h: 2, use: () => HS() && HS().roomDoor(fx.item.p.no, fx, sc) })));
  registerFixture('hotel_bed', only((fx, sc) => ({ label: 'The bed', hit: 16, use: () => HS() && HS().bed(fx, sc) })));
  registerFixture('hotel_phone', only((fx, sc) => ({ label: 'Telephone: room service', hit: 12, use: () => HS() && HS().phone(sc) })));
  registerFixture('hotel_closet', only(() => ({ label: 'Wardrobe', hit: 12, use: () => HS() && HS().closet() })));
  registerFixture('hotel_minibar', only(() => ({ label: 'Minibar', hit: 12, use: () => HS() && HS().minibar() })));
  registerFixture('hotel_tray', only((fx, sc) => ({ label: 'Room-service table', hit: 10, use: () => HS() && HS().tray(fx, sc) })));
}
