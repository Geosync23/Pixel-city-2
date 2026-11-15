// The Grand Maple Hotel — The Gilded Maple restaurant (room `hotel_restaurant`, 24 x 16) and The Weathervane rooftop bar (room `hotel_bar`, 22 x 15).
// Restaurant: breakfast buffet (stations along the windows, item.k; brunch-only stations appear on Sundays), afternoon tea, dinner service. Twelve clothed tables; table `mine` is kept free for the player.
//   scene.hot = { sync(), meal() , tables, waiters, mySeat() -> world seat, serveMe(colour | 'tea' | null, cb) (a waiter walks the plate from the kitchen pass to your table; null = clear), stations }
//   Waiters run their own service loop for the other tables: bring plates -> diners eat -> clear.
// Bar: skyline glass (furn.skydeck.pano, time-synced) on both back walls, the bar with Marisol, cocktail tables, heaters (lit when it is cold), string lights, the jazz corner.
//   scene.hot = { sync(), open(), golden(), jazz(), heatersOn(), bartender, band }
// Fixture tags handled here (hotel rooms only): hotel_buffet (item.k), hotel_table, hotel_bar, hotel_heater.
import { G } from '../../core/game.js';
import { GT } from '../../engine/world.js';
import * as R from '../../engine/raster.js';
import { ambient } from '../../core/clock.js';
import { defineRoom, registerFixture } from '../interior.js';
import { bubble } from '../../ui/kit.js';
import { crowd, walkers } from './_show_life.js';
import { specs } from './_airport_life.js';
import { FRAMES } from '../../art/showpiece/_pano.js';
import { O, HS, pick, setP, viewNow, only, people, mk, step, go, showOb, softEnv, dress, seatsOf, LOBBY_AT } from './hotel.js';
import { HR, HV, REST_NAME, BAR_NAME, HOURS, JAZZ, SUNSET, BUFFET, inH, meal } from '../../data/hotel.js';

const mkItems = () => { const items = [], spots = []; return { items, spots, H: (id, x, y, p, o) => { const it = Object.assign({ id: id.includes('.') ? id : 'furn.hotel.' + id, x, y, p: p || {} }, o); items.push(it); return it; }, Wl: (id, wall, at, p, o) => { const it = Object.assign({ id: id.includes('.') ? id : 'furn.hotel.' + id, wall, at, p: p || {} }, o); items.push(it); return it; }, S: (x, y, dir, o) => spots.push(Object.assign({ x, y, dir }, o)) }; };
const FOOD = { starter: ['#f4ecd0', '#b8343e', '#8fb85a'], main: ['#f08a6a', '#8a4a2e', '#e8d8a8', '#d8a25a'], dessert: ['#e8b060', '#6b3f2a', '#f2a7c3'], breakfast: ['#f6d24a', '#d8a25a', '#e8483a', '#a8442e'] };
const DLINES = {
  diner: ['The halibut. Always the halibut.', 'They fold the napkin again if you stand up. Watch.', 'We had our wedding breakfast at this table. Forty-one years ago.', 'I am pretending to understand the wine list.', 'Save room for the maple tart. I am serious.', 'The souffle takes twenty minutes and it is worth every one.'],
  morning: ['I have been to the buffet three times. Nobody has said anything.', 'The pancakes are the size of the plate. I respect that.', 'Coffee first. Then I can be a person.', 'Did you see the pastry tower? It was taller an hour ago.'],
  tea: ['The little cucumber ones go first. Be quick.', 'Scone, cream, then jam. I will not be argued with.', 'Three tiers. I intend to reach the top.'],
  waiter: ['Right away.', 'Mind the plate, it is hot.', 'Chef recommends the duck tonight.', 'Still or sparkling?'],
  host: ['Good evening. The Gilded Maple.', 'Breakfast from half past six, tea at two, dinner from six.', 'One moment and I will find you a lovely table.'],
};

/* ================= The Gilded Maple ================= */
{
  const W = 24, D = 16, { items, spots, H, Wl, S } = mkItems();
  for (const at of [1.2, 6, 10.8]) Wl('window', 'y', at, { w: 3 }, { win: 1 }); for (const at of [1.6, 6.6, 11.6]) Wl('window', 'x', at, { w: 3, seed: 5 }, { win: 1 });
  Wl('pass', 'y', 19.4, {}, { pass: 1 }); H('furn.restaurant.winerack', 16.2, .1, {}); H('furn.restaurant.winerack', 17.75, .1, { seed: 4 }); for (const at of [4.6, 9.4, 14.6, 22.4]) Wl('furn.lobby.sconce', 'y', at, {});
  ['eggs', 'bacon', 'pancakes', 'pastry', 'fruit', 'juice', 'coffee', 'salmon', 'benedict'].forEach((k, i) => H('bstation', 1 + i * 1.6, 1, { k }, { k, station: 1 }));
  H('bstation', 15.4, 2.6, { k: 'mimosa' }, { k: 'mimosa', station: 1 });
  let ti = 0; for (const y of [3.5, 7.5, 11.5]) for (const x of [1, 5, 9, 13]) { const mine = x === 9 && y === 7.5; H('dtable', x, y, { n: mine ? 2 : (ti % 3 === 1 ? 2 : 4), centre: 'candle' }, { table: 1, mine: mine ? 1 : 0, ti: ti++ }); }
  H('desk', 18.6, 11.6, { kind: 'host', w: 1.8 }, { host: 1 }); H('board', 19.4, 14.3, { w: 3, lines: ['THE GILDED', 'MAPLE'] }, { board: 1 });
  H('chandelier', 5.8, 5, { r: .8 }, { z: 2.2 }); H('chandelier', 13, 9, { r: .8 }, { z: 2.2 }); H('palm', .6, 15, { seed: 2 }); H('palm', 22.8, .8, { seed: 7 }); H('palm', 17.2, 15, { seed: 3 });
  S(19.5, 11.15, 1, { kind: 'staff', label: 'Laurent, the maitre d\'', lines: DLINES.host });
  defineRoom({ id: HR.rest, name: REST_NAME, w: W, d: D, zoom: 0, music: 'quiet', noCrowd: true, showpiece: 'hotel', floor: GT.f_darkwood, bg: '#181420', edge: '#4a3c34', wall: { color: '#e4d2b4', trim: '#6a4430', h: 4, rail: 1.1 },
    exits: [{ x: 22.6, y: 14.9, label: 'Back to the lobby', to: 'int:' + HR.lobby, use: () => G.go('int:' + HR.lobby, LOBBY_AT.rest) }], spawn: { x: 21.8, y: 13.6, dir: 2 }, items, npcSpots: spots,
    setup(sc) {
      const Wd = sc.world, by = k => Wd.objs.filter(o => o.data && o.data[k]), P = people(), AP = specs(), wins = by('win'), stations = by('station'), board = by('board')[0];
      Wd.decal({ x0: O, y0: O, x1: O + W, y1: O + D, draw(Rr) { Rr.qz(O, O + W, O, O + D, 0, (x, y) => { const X = x - O, Y = y - O; if (X > 17.6 || Y < 2.9) { const fx = X - Math.floor(X), fy = Y - Math.floor(Y); return fx < .05 || fy < .05 ? '#b8a888' : (Math.floor(X) + Math.floor(Y)) & 1 ? '#efe6d2' : '#d8c8a8'; }
        const e = Math.min(X, Y - 2.9, 17.6 - X, D - Y); if (e < .3) return '#c89a4a'; if (e < .42) return '#5a1826'; const u = Math.floor(X * 2), v = Math.floor(Y * 2), fx = X * 2 - u, fy = Y * 2 - v; return Math.abs(fx - .5) + Math.abs(fy - .5) < .2 ? '#c89a4a' : ((u + v) & 1 ? '#7a2030' : '#701c2c'); }); } }); Wd.version++;
      Wd.lights.push({ x: O + 7, y: O + 6.2, z: 0, r: 6, c: '#ffe2a0' }, { x: O + 14.2, y: O + 10.2, z: 0, r: 6, c: '#ffe2a0' }, { x: O + 20.6, y: O + 2, z: 0, r: 3.5, c: '#fff0c0' }, { x: O + 19.5, y: O + 12.6, z: 0, r: 3, c: '#ffe2a0' });
      const tfx = sc.fixtures.filter(f => f.item.table), tables = tfx.map(f => ({ fx: f, ob: f.ob, mine: !!f.item.mine, chars: [], phase: 'wait', t: 3 + Math.random() * 14, serve: [], busy: false }));
      const seats = seatsOf(sc, /hotel\.dtable/, { skip: f => f.item.mine, add: (f, i) => ({ p: i === 0 ? .82 : i === 1 ? .7 : .45, lines: () => (M === 'dinner' ? DLINES.diner : M === 'tea' ? DLINES.tea : DLINES.morning), label: 'Diner', anim: 'talk' }) });
      const cr = crowd(sc, sc.def.npcSpots.concat(seats), { seed: 31, fill: .7, lines: DLINES.diner });
      for (const c of cr.list) if (c.spot.fx) { const t = tables.find(q => q.fx === c.spot.fx); if (t) t.chars.push(c); } const host = cr.list.find(c => c.spot.kind === 'staff'); if (host) host.setSpec(P.concierge[1]);
      const waiters = [0, 1, 2].map(i => { const c = mk(sc, P.waiter[i], 20 + i * .8, 1.7 + (i % 2) * .7, 1, 'Waiter', DLINES.waiter); c.speed = 2.3; c.home = [20 + i * .8, 1.7 + (i % 2) * .7]; c.task = null; return c; });
      const useOf = t => (t.fx.use ? { x: t.fx.use.x - O, y: t.fx.use.y - O } : { x: t.ob.B[3] - O + .4, y: (t.ob.B[1] + t.ob.B[4]) / 2 - O });
      const tray = (c, on) => { c.carry = on; c.poseOpts = on ? { item: 'tray' } : null; };
      const send = (w, t, fn) => { w.task = { t, fn, st: 0 }; w.pose = null; tray(w, true); const u = useOf(t); if (!go(w, Wd, u.x, u.y)) { w.x = u.x + O; w.y = u.y + O; } };
      let M = null, view = null, tick = 0, lvl = -1, mine = tables.find(t => t.mine), myJob = null;
      const sync = () => {
        const n = G.now(), m = meal(n), v = viewNow(); if (v !== view) { view = v; for (const o of wins) setP(o, { time: v }); }
        if (m !== M) { M = m; const buf = m === 'breakfast' || m === 'brunch';
          for (const o of stations) { const b = BUFFET.find(q => q.id === o.data.k), on = buf && (m === 'brunch' || !b.brunch); if (o.data.k === 'mimosa') showOb(Wd, o, on); else setP(o, { k: on ? o.data.k : 'closed' }); o.data.on = on; }
          setP(board, { lines: m === 'breakfast' ? ['BREAKFAST', 'BUFFET', 'TILL 10:30'] : m === 'brunch' ? ['SUNDAY', 'BRUNCH', 'TILL 2'] : m === 'tea' ? ['AFTERNOON', 'TEA', '2 - 5'] : m === 'dinner' ? ['DINNER', 'IS SERVED', 'TILL 10:30'] : ['THE GILDED', 'MAPLE', n.hf < 6.5 || n.hf >= 22.5 ? 'OPENS 6:30' : n.hf < 14 ? 'TEA AT 2' : 'DINNER AT 6'], lit: m ? 1 : 0 });
          for (const t of tables) { t.phase = 'wait'; t.t = 2 + Math.random() * 16; t.serve = []; if (!t.mine || !myJob) setP(t.ob, { serve: [], centre: m === 'dinner' ? 'candle' : m === 'tea' ? 'none' : 'flowers' }); }
          dress(cr, (s, c) => (s.kind === 'staff' ? null : m === 'dinner' ? P.formal[Math.floor(c.roll * 997) % P.formal.length] : m === 'breakfast' && c.roll < .12 ? P.robe[Math.floor(c.roll * 60) % P.robe.length] : AP.adult[Math.floor(c.roll * 991) % AP.adult.length]));
          lvl = -1; }
        const h = n.hf, L = !m ? 0 : m === 'dinner' ? (h < 19 ? .6 : h < 21.3 ? .95 : .55) : m === 'brunch' ? .9 : m === 'tea' ? .5 : (h < 7.5 ? .35 : h < 9.6 ? .75 : .45);
        if (L !== lvl) { lvl = L; for (const c of cr.list) { if (c.spot.kind === 'staff') { c.hidden = false; continue; } c.hidden = !m || c.roll > Math.min(1, (c.spot.p || .5) * (.25 + L * 1.1)); } for (const t of tables) if (!t.mine && !t.chars.some(c => !c.hidden)) { t.serve = []; setP(t.ob, { serve: [] }); } waiters.forEach((w, i) => { w.hidden = !m && i > 0; }); }
      };
      const paint = t => setP(t.ob, { serve: t.serve.slice(), centre: M === 'tea' && t.serve.length ? 'tea' : M === 'dinner' ? 'candle' : M === 'tea' ? 'none' : 'flowers' });
      sc.life = { crowd: cr, count: () => cr.count() + waiters.filter(w => !w.hidden).length };
      sc.hot = { sync, meal: () => M, tables, waiters, stations, mine,
        mySeat() { const s = mine.fx.seats[0]; return { x: s.x, y: s.y, z: s.z, dir: s.dir }; },
        serveMe(col, cb) { myJob = { col, cb }; return true; }, myDone() { myJob = null; mine.serve = []; paint(mine); setP(mine.ob, { centre: M === 'dinner' ? 'candle' : 'flowers' }); } };
      sc.env = softEnv(Wd, .6, .5); sync();
      const u0 = sc.update; sc.update = (dt, gm) => {
        u0(dt, gm); cr.update(dt); if ((tick -= dt) <= 0) { tick = 1.5; sync(); }
        // the player's order jumps the queue
        if (myJob && !myJob.sent) { const w = waiters.find(q => !q.task && !q.hidden) || waiters.find(q => !q.hidden && q.task && !q.task.mine); if (w) { if (w.task && w.task.t) w.task.t.busy = false; myJob.sent = true; const job = myJob; send(w, mine, () => { if (job.col === 'tea') { mine.serve = ['#f4e0b0']; setP(mine.ob, { serve: [], centre: 'tea' }); } else { mine.serve = job.col ? [job.col] : []; setP(mine.ob, { serve: mine.serve.slice(), centre: job.col === null && M !== 'dinner' ? 'none' : 'candle' }); } if (job.col) bubble(w, pick(['Enjoy.', 'Bon appetit.', 'Careful, the plate is warm.'])); if (myJob === job) myJob = null; if (job.cb) job.cb(); }); w.task.mine = true; } }
        for (const t of tables) { if (t.mine || t.busy || !M) continue; const act = t.chars.filter(c => !c.hidden); if (!act.length) continue; if ((t.t -= dt) > 0) continue;
          if (M === 'breakfast' || M === 'brunch') { if (!t.serve.length) { t.serve = t.chars.map(c => (c.hidden ? 0 : pick(FOOD.breakfast))); paint(t); for (const c of act) c.anims = ['eat', 'eat', 'drink', 'talk', 'sit']; } t.t = 20; continue; }
          const w = waiters.find(q => !q.task && !q.hidden); if (!w) { t.t = 2; continue; } t.busy = true;
          send(w, t, () => { t.busy = false; if (t.phase === 'wait') { t.phase = 'eat'; t.course = ((t.course || 0) % 3) + 1; const pal = M === 'tea' ? ['#f4e0b0'] : FOOD[['starter', 'main', 'dessert'][t.course - 1]]; t.serve = t.chars.map(c => (c.hidden ? 0 : pick(pal))); t.t = 16 + Math.random() * 16; for (const c of act) { c.anims = ['eat', 'eat', 'eat', 'talk', 'drink']; c.pose = 'eat'; } } else { t.phase = 'wait'; t.serve = []; t.t = 5 + Math.random() * 10; for (const c of act) { c.anims = ['sit', 'talk', 'drink', 'talk']; c.pose = 'talk'; } } paint(t); }); }
        for (const w of waiters) { if (w.hidden) continue; const k = w.task; if (step(w, Wd, dt)) continue;
          if (k && k.st === 0) { k.st = 1; w._hold = 1.3; w.faceTo((k.t.ob.B[0] + k.t.ob.B[3]) / 2, (k.t.ob.B[1] + k.t.ob.B[4]) / 2); w.pose = 'work'; }
          else if (k && k.st === 1) { k.st = 2; w.pose = null; k.fn(); tray(w, false); if (!go(w, Wd, w.home[0], w.home[1])) { w.x = w.home[0] + O; w.y = w.home[1] + O; } }
          else if (k) { w.task = null; w.dir = 1; } }
      };
      const e0 = sc.onEnter; sc.onEnter = (o, pv) => { e0(o, pv); view = null; sync(); if (HS()) HS().arrivedIn('rest', sc); };
      const x0 = sc.onExit; sc.onExit = to => { x0(to); if (HS()) HS().left('rest', sc); };
    } });
}

/* ================= The Weathervane (rooftop) ================= */
{
  const W = 22, D = 15, { items, spots, H, Wl, S } = mkItems();
  for (let at = 0; at < W; at += 4) { const w = Math.min(4, W - at); items.push({ id: 'furn.skydeck.pano', wall: 'y', at, p: { w, u0: 300 + at * 16 }, sky: 1 }); }
  items.push({ id: 'furn.skydeck.pano', wall: 'x', at: 11, p: { w: 4, u0: 300 - 11 * 16, rev: 1 }, sky: 1 }); items.push({ id: 'furn.skydeck.pano', wall: 'x', at: 2.9, p: { w: 1.3, u0: 300 - 2.9 * 16, rev: 1 }, sky: 1 });
  Wl('lift', 'x', .3, { at: 1, name: 'LIFT' }, { lift: 1 });
  H('backbar', .2, 4.2, { w: 6.6 }, { flip: true }); H('barcounter', 1.9, 4.2, { w: 6.6 }, { flip: true, bar: 1 }); for (const y of [4.5, 5.6, 8.6, 9.7]) H('furn.bar.stool', 3.2, y, { c: '#2f6a6a' }, { flip: true });
  H('board', 3.4, 11.6, { w: 3, lines: ['COCKTAILS', 'WEATHERVANE', 'GOLDEN HOUR'] }, { board: 1 });
  [[6, 2.2], [9.8, 2.2], [13.6, 2.2], [17.4, 2.2], [7.6, 6.4], [12.4, 6.6], [17.2, 6.4]].forEach(([x, y], i) => H('dtable', x, y, { n: 2, r: .5, c: '#22304e', cc: '#2f6a6a', centre: 'candle' }, { table: 1, ti: i }));
  H('furn.lobby.settee', 5.6, 10.6, { c: '#2f6a6a', a: '#e8c06a' }); H('furn.lobby.settee', 8.4, 10.6, { c: '#2f6a6a', a: '#e8c06a' }); H('furn.cafe.lowtable', 7.4, 12, {});
  for (const [x, y] of [[5, 5.2], [11.2, 4.8], [15.8, 5], [20.6, 4.4], [11.6, 10.6], [14.4, 12.8]]) H('heater', x, y, {}, { heater: 1 });
  H('carpet', 15.4, 10.2, { w: 6, d: 3.6, c: '#3a2a4a' }); H('bass', 16, 10.5, {}, { band: 1 }); H('drums', 19.2, 10.4, {}, { band: 1 }); H('mic', 17.7, 12.4, {}, { band: 1 });
  for (const x of [4, 8.4, 12.8]) H('planter', x, 14.3, { w: 4.2, lights: 1 }); H('palm', 20.8, 14, { seed: 5 }); H('palm', 3.6, .9, { seed: 8 });
  H('stringlights', 3.4, 3.8, { w: 18, sw: 3 }, { z: 3 }); H('stringlights', 3.4, 9, { w: 18, sw: 3 }, { z: 3 });
  S(4.6, .9, 3, { p: .6 }); S(8.6, .9, 3, { anim: 'phone', p: .6 }); S(12.4, .95, 3, { p: .5 }); S(16.4, .9, 3, { busy: 1 }); S(20.2, 1, 3, { busy: 1, anim: 'phone' }); S(21, 1.6, 3, { busy: 1 }); S(.9, 12.4, 2, { busy: 1 }); S(1, 13.6, 2, { p: .5, anim: 'drink' });
  S(4.4, 6.8, 2, { p: .5, anim: 'drink' }); S(10.6, 9.2, 1, { busy: 1, anim: 'talk' }); S(11.5, 9.3, 2, { busy: 1, anim: 'talk' }); S(14.6, 8.6, 1, { jazz: 1 }); S(15.4, 9, 1, { jazz: 1, anim: 'drink' }); S(13.6, 9.4, 0, { jazz: 1 }); S(20.4, 8.8, 1, { jazz: 1 });
  const BLINES = ['You can see the lighthouse blink from here. Count three seconds.', 'I come for the sunset and stay for the trio.', 'The Maple Old Fashioned. Trust me.', 'Stand by a heater and it is practically July.', 'That tower with the red light is the SkyDeck. We are prettier.', 'Marisol lets you shake your own if you ask nicely.'];
  defineRoom({ id: HR.bar, name: BAR_NAME + ' — Rooftop Bar', w: W, d: D, zoom: 0, music: 'bar', noCrowd: true, showpiece: 'hotel', venue: HV.bar, floor: GT.f_darkwood, bg: '#0e1020', edge: '#3a3440', wall: { color: '#39424e', trim: '#2a2733', h: 4 },
    exits: [{ x: 1.6, y: 1.5, label: 'Lift', to: 'int:' + HR.lobby, use: () => HS() && HS().lift() }], spawn: { x: 2.6, y: 1.7, dir: 0 }, items, npcSpots: spots,
    setup(sc) {
      const Wd = sc.world, by = k => Wd.objs.filter(o => o.data && o.data[k]), P = people(), heaters = by('heater'), bandObs = by('band'), board = by('board')[0];
      const panes = Wd.objs.filter(o => o.data && o.data.sky);
      Wd.decal({ x0: O, y0: O, x1: O + W, y1: O + D, draw(Rr) { const bd = R.PAT.fboards('#8a6a4c', .5); Rr.qz(O, O + W, O, O + D, 0, (x, y) => { const X = x - O, Y = y - O; if (X < 3.1 && Y > 3.9 && Y < 11) { const fx = X * 2 - Math.floor(X * 2), fy = Y * 2 - Math.floor(Y * 2); return fx < .08 || fy < .08 ? '#2a2733' : '#4a4f5c'; } return bd(X, Y); }); } }); Wd.version++;
      const hl = heaters.map(o => ({ x: (o.B[0] + o.B[3]) / 2, y: (o.B[1] + o.B[4]) / 2 + .4, z: 0, r: 3.2, c: '#ffb878' }));
      Wd.lights.push({ x: O + 3.6, y: O + 7.2, z: 0, r: 5, c: '#ffe2a0' }, { x: O + 9, y: O + 4, z: 0, r: 5, c: '#ffe9b0' }, { x: O + 15, y: O + 4, z: 0, r: 5, c: '#ffe9b0' }, { x: O + 9, y: O + 9.4, z: 0, r: 5, c: '#ffe9b0' }, { x: O + 18, y: O + 11.6, z: 0, r: 4.5, c: '#d8a0ff' });
      const seats = seatsOf(sc, /hotel\.dtable|settee|bar\.stool/, { add: (f, i, n) => ({ p: .6, busy: n % 3 === 2 ? 1 : 0, anim: 'drink', dir: undefined }) }); for (const s of seats) { const q = s.fx.seats[s.si]; s.dir = q.dir === undefined ? 1 : q.dir; }
      const cr = crowd(sc, sc.def.npcSpots.concat(seats), { seed: 63, fill: .65, lines: BLINES });
      const bartender = mk(sc, P.waiter[4], 1.45, 7.2, 0, 'Marisol, the bartender', c => HS() && HS().bar(sc));
      const band = [mk(sc, P.formal.filter(s => s.top === 'suit')[1] || P.formal[1], 16.5, 11.3, 1, 'Lowell Finch (bass)', ['We take requests. We do not always play them.']), mk(sc, P.formal.filter(s => s.top === 'suit')[2] || P.formal[2], 19.9, 11.9, 1, 'Dot (drums)', ['*brush, brush, tss*']), mk(sc, P.formal.filter(s => s.top === 'dress')[0] || P.formal[3], 17.9, 12.9, 1, 'Celeste (voice & horn)', ['Next one is for the lady by the heater.'])];
      band[1].poseOpts = { seated: true }; band[1].z = .45;
      let view = null, tick = 0, fr = 3, ft = 0, lvl = -2, hOn = null, jz = null, nm = '';
      const open = () => inH(G.now().hf, HOURS.bar), golden = () => inH(G.now().hf, SUNSET[G.now().season & 3]) && open(), jazz = () => { const n = G.now(), wd = n.hf < 3 ? (n.weekday + 6) % 7 : n.weekday; return JAZZ.nights.includes(wd) && inH(n.hf, JAZZ.hours); };
      const heatersOn = () => { const n = G.now(), s = n.season & 3; return s === 3 || (s === 2 && (n.hf >= 16 || n.hf < 9)) || (s === 0 && (n.hf >= 20 || n.hf < 7)); };
      const sync = () => {
        const n = G.now(), h = n.hf, v = viewNow(); if (v !== view) { view = v; for (const o of panes) setP(o, { time: v, frame: fr }); }
        const ho = heatersOn(); if (ho !== hOn) { hOn = ho; for (const o of heaters) setP(o, { on: ho ? 1 : 0 }); for (const l of hl) { const i = Wd.lights.indexOf(l); if (ho && i < 0) Wd.lights.push(l); else if (!ho && i >= 0) Wd.lights.splice(i, 1); } }
        const j = jazz(); if (j !== jz) { jz = j; for (const c of band) c.hidden = !j; for (const o of bandObs) o.hidden = false; }
        const my = HS() && HS().houseCocktail ? HS().houseCocktail() : null, key = my || ''; if (key !== nm) { nm = key; setP(board, { lines: ['COCKTAILS', my ? my.toUpperCase().slice(0, 11) : 'WEATHERVANE', 'GOLDEN HOUR'], lit: 1 }); }
        const op = open(), g = golden(), wet = G.weather && G.weather.isWet && G.weather.isWet(), L = (!op ? (h >= 9 && h < 16 ? .14 : 0) : g ? .9 : j ? .92 : h >= 23 || h < 2 ? .4 : .55) * ((n.season & 3) === 3 ? .75 : 1) * (wet ? .35 : 1);
        if (L !== lvl) { lvl = L; for (const c of cr.list) { const s = c.spot; c.hidden = s.jazz ? !j || c.roll > .85 : s.busy ? !(g || j) || c.roll > L : c.roll > (s.p !== undefined ? s.p * (.2 + L) : L); } bartender.hidden = !op; }
        sc.life.open = op; sc.life.golden = g; sc.life.jazz = j;
      };
      sc.life = { crowd: cr, count: () => cr.count() + (jz ? 3 : 0) + (bartender.hidden ? 0 : 1) };
      sc.hot = { sync, open, golden, jazz, heatersOn, bartender, band, view: () => view };
      sc.env = t => { const o = ambient(t, G.state.weather); return { amb: o.amb, dark: Math.min(.82, (o.dark || 0) * .85), bg: Wd.bg, night: o.night }; };
      sync();
      const u0 = sc.update; sc.update = (dt, gm) => {
        u0(dt, gm); cr.update(dt); if ((tick -= dt) <= 0) { tick = 1.5; sync(); }
        if ((ft += dt) > 2.2) { ft = 0; fr = (fr + 1) % FRAMES; for (const o of panes) setP(o, { frame: fr }); }
        bartender.t += dt; if (bartender._hold > 0) bartender._hold -= dt; else { bartender.dir = 0; bartender.pose = Math.floor(G.time / 5) % 2 ? 'work' : null; }
        if (jz) { band[0].t += dt; band[0].pose = 'work'; band[1].t += dt; band[1].pose = 'type'; band[2].t += dt; band[2].pose = Math.floor(G.time / 6) % 2 ? 'talk' : 'dance'; }
        if (HS() && HS().jazzTick) HS().jazzTick(dt, !!jz);
      };
      const e0 = sc.onEnter; sc.onEnter = (o, pv) => { e0(o, pv); view = null; sync(); if (HS()) HS().arrivedIn('bar', sc); };
      const x0 = sc.onExit; sc.onExit = to => { x0(to); if (HS()) HS().left('bar', sc); };
    } });
}

export function init() {
  registerFixture('hotel_buffet', only((fx, sc) => { const b = BUFFET.find(q => q.id === fx.item.k); return b ? { label: 'Buffet: ' + b.name, hit: 12, visible: () => !fx.ob.hidden && !!fx.ob.data.on, use: () => HS() && HS().buffetTake(b.id, fx, sc) } : null; }));
  registerFixture('hotel_table', only((fx, sc) => (sc.roomId === HR.rest ? { label: fx.item.mine ? 'Your table' : 'Table', hit: 14, visible: () => !!fx.item.mine || !(sc.hot && sc.hot.tables.find(t => t.fx === fx).chars.some(c => !c.hidden)), use: () => HS() && HS().table(fx, sc) } : null)));
  registerFixture('hotel_bar', only((fx, sc) => ({ label: BAR_NAME + ' bar', hit: 16, use: () => HS() && HS().bar(sc) })));
  registerFixture('hotel_heater', only(fx => ({ label: 'Patio heater', hit: 9, h: 1.8, use: () => HS() && HS().heater(fx) })));
}
