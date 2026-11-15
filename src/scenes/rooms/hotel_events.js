// The Grand Maple Hotel — The Bay Ballroom (room `hotel_ballroom`, 26 x 18). Hosts the scheduled events of data/hotel.js BALL: the dance class (Tue + Thu 19:00), a wedding reception (Sat 17:00)
// and the Lighthouse Fund charity gala (day 12 of every season, 19:00). Between events the room is laid for the next one and two members of staff polish glasses.
//   scene.hot = { sync(), event() -> 'class' | 'wedding' | 'gala' | null, force(id | null) (debug / tests: pin an event), pairs, band, partner, join(on) (a partner steps out for the player), spot() -> where the player dances }
// Fixture tags handled here: hotel_cake, hotel_auction, hotel_guestbook (+ the dance floor itself: an interactable added in setup). The steward's desk is handled in hotel.js (hotel_desk kind steward).
import { G } from '../../core/game.js';
import { GT } from '../../engine/world.js';
import * as R from '../../engine/raster.js';
import { defineRoom, registerFixture } from '../interior.js';
import { bubble } from '../../ui/kit.js';
import { crowd } from './_show_life.js';
import { specs } from './_airport_life.js';
import { O, HS, pick, setP, viewNow, only, people, mk, step, go, showOb, softEnv, dress, seatsOf, LOBBY_AT } from './hotel.js';
import { HR, BALL_NAME, BALL, ballEvent } from '../../data/hotel.js';

const W = 26, D = 18, items = [], spots = [];
const H = (id, x, y, p, o) => { const it = Object.assign({ id: id.includes('.') ? id : 'furn.hotel.' + id, x, y, p: p || {} }, o); items.push(it); return it; };
const Wl = (id, wall, at, p, o) => { const it = Object.assign({ id: id.includes('.') ? id : 'furn.hotel.' + id, wall, at, p: p || {} }, o); items.push(it); return it; };
const S = (x, y, dir, o) => spots.push(Object.assign({ x, y, dir }, o));
const LINES = {
  wedding: ['I have known the bride since she was this high. I am not crying. It is the flowers.', 'Open bar. That is all I am going to say.', 'They met on the 14 bus. The best man told the WHOLE story.', 'Nobody minds if you dance. That is what weddings are for.', 'The cake is lemon and elderflower. I asked.'],
  gala: ['I bid on the painting. I have no wall for it. I regret nothing.', 'It is for the lighthouse. The lamp room needs a new roof.', 'Black tie makes everybody stand up straighter.', 'The basket has a whole cheese in it. A WHOLE one.'],
  klass: ['One two three, one two three... do not look at your feet.', 'I have two left feet and Madame says that is one more than some.', 'We came for the anniversary. Forty years and we never learned.'],
  staff: ['The ballroom is resting. Dance class Tuesdays and Thursdays, a wedding every Saturday.', 'Four hundred glasses. Somebody has to polish them.', 'The gala is on the twelfth. Black tie. I will be pouring.'],
  band: ['Any requests? We know all three waltzes.', 'One more set and then the slow ones.'],
};
function build() {
  Wl('drape', 'y', 8, { w: 10 }, { drape: 1 }); for (const at of [1.4, 4.7, 19.2, 22.6]) Wl('window', 'y', at, { w: 2.8, c: '#22304e' }, { win: 1 }); for (const at of [2, 7.4, 12.8]) Wl('window', 'x', at, { w: 3, c: '#22304e', seed: 6 }, { win: 1 });
  for (const at of [.4, 18.3, 25.4]) Wl('furn.lobby.sconce', 'y', at, {}); for (const at of [.6, 5.6, 11, 16.6]) Wl('furn.lobby.sconce', 'x', at, {});
  H('chandelier', 8.2, 6.6, { r: 1 }, { z: 2.3 }); H('chandelier', 15.8, 6.6, { r: 1 }, { z: 2.3 }); H('chandelier', 12, 10.6, { r: .7 }, { z: 2.8 });
  H('carpet', 8.4, .7, { w: 9.4, d: 2.8, c: '#5a1826' }); H('furn.perf.piano', 8.8, .9, {}, { piano: 1 }); H('bass', 12.2, 1.1, {}); H('drums', 13.6, .8, {}); H('mic', 15.8, 2.5, {});
  [[1.2, 3.6], [1.2, 8.2], [1.2, 12.8], [21, 3.4], [21, 8]].forEach(([x, y], i) => H('dtable', x, y, { n: 6, centre: 'none' }, { table: 1, ti: i }));
  H('arch', 11.8, 3.5, {}, { ev: 'wedding' }); H('cake', 4.8, 15, {}, { ev: 'wedding', cake: 1 }); H('guestbook', 12.6, 15.8, {}, { ev: 'wedding' }); H('auction', 8, 15.9, {}, { ev: 'gala' });
  H('desk', 20.4, 13.4, { kind: 'steward', w: 2.2 }, { steward: 1 }); S(21.5, 12.95, 1, { kind: 'staff', label: 'Ballroom steward', lines: LINES.staff });
  for (const [x, y, s] of [[.6, .7, 2], [24.8, .8, 4], [.7, 16.8, 5], [18.6, 16.6, 7]]) H('palm', x, y, { seed: s });
  S(3.4, 2.2, 1, { kind: 'staff', label: 'Banqueting staff', lines: LINES.staff, idle: 1, anim: 'work' }); S(22.2, 6.9, 1, { kind: 'staff', label: 'Banqueting staff', lines: LINES.staff, idle: 1, anim: 'work' });
  for (const [x, y, d, o] of [[6.2, 5.2, 0], [6.3, 8.6, 0, { anim: 'drink' }], [6.2, 12, 0], [19.9, 5.6, 2, { anim: 'drink' }], [19.8, 10.6, 2], [9.4, 14.4, 3], [14.6, 14.5, 3, { anim: 'talk' }], [15.5, 14.6, 2, { anim: 'talk' }], [17.4, 14.2, 3], [5.4, 3, 1, { anim: 'talk' }], [18.2, 3.4, 1], [10.2, 3.8, 1, { anim: 'drink' }]]) S(x, y, d, Object.assign({ ev: 1, p: .8 }, o));
}
build();
const FLOOR = { x0: 7, y0: 4.8, x1: 19, y1: 13.4 }, FC = [13, 9.1];

defineRoom({ id: HR.ball, name: BALL_NAME, w: W, d: D, zoom: 0, music: 'quiet', noCrowd: true, showpiece: 'hotel', floor: GT.f_wood, bg: '#14121c', edge: '#4a3c34', wall: { color: '#e6dcc8', trim: '#8a6a3a', h: 4.6, rail: 1.1 },
  exits: [{ x: 24.4, y: 16.9, label: 'Back to the lobby', to: 'int:' + HR.lobby, use: () => G.go('int:' + HR.lobby, LOBBY_AT.ball) }], spawn: { x: 23.4, y: 15.6, dir: 2 }, items, npcSpots: spots,
  setup(sc) {
    const Wd = sc.world, by = k => Wd.objs.filter(o => o.data && o.data[k]), P = people(), AP = specs(), wins = by('win'), drape = by('drape')[0], evObs = Wd.objs.filter(o => o.data && o.data.ev), cake = by('cake')[0], tabs = by('table'), piano = sc.fixtures.find(f => f.item.piano);
    Wd.decal({ x0: O, y0: O, x1: O + W, y1: O + D, draw(Rr) { Rr.qz(O, O + W, O, O + D, 0, (x, y) => { const X = x - O, Y = y - O;
      if (X > FLOOR.x0 && X < FLOOR.x1 && Y > FLOOR.y0 && Y < FLOOR.y1) { const e = Math.min(X - FLOOR.x0, FLOOR.x1 - X, Y - FLOOR.y0, FLOOR.y1 - Y); if (e < .14) return '#c89a4a'; if (e < .3) return '#4a2e22'; const dd = Math.hypot(X - FC[0], (Y - FC[1]) * 1.3); if (dd < 2.2) { const a = Math.atan2(Y - FC[1], X - FC[0]); if (dd > 2.05) return '#c89a4a'; return Math.abs(Math.sin(a * 6)) * 2 < dd ? '#e8c890' : '#7a4a2e'; } const u = Math.floor(X), v = Math.floor(Y), fx = X - u, fy = Y - v, k = (u + v) & 1, f = k ? fx : fy; return (Math.floor(f * 5) & 1) ? (k ? '#c89862' : '#b8844e') : (k ? '#d4a670' : '#a87644'); }
      const fx = X / 1.5 - Math.floor(X / 1.5), fy = Y / 1.5 - Math.floor(Y / 1.5); if (fx < .04 || fy < .04) return '#3a1420'; return Math.abs(fx - .5) + Math.abs(fy - .5) < .16 ? '#c89a4a' : '#6a1c2c'; }); } }); Wd.version++;
    Wd.lights.push({ x: O + 9.4, y: O + 8, z: 0, r: 7, c: '#ffe9b0' }, { x: O + 17, y: O + 8, z: 0, r: 7, c: '#ffe9b0' }, { x: O + 13, y: O + 12, z: 0, r: 5, c: '#ffe2a0' }, { x: O + 13, y: O + 2.4, z: 0, r: 5, c: '#ffd0e0' });
    const seats = seatsOf(sc, /hotel\.dtable/, { add: (f, i) => ({ ev: 1, p: i % 6 === 5 ? .35 : .85, anim: 'talk' }) });
    const cr = crowd(sc, sc.def.npcSpots.concat(seats), { seed: 91, fill: .8, lines: c => (E === 'wedding' ? LINES.wedding : E === 'gala' ? LINES.gala : E === 'class' ? LINES.klass : LINES.staff) });
    const steward = cr.list.find(c => c.spot.kind === 'staff' && !c.spot.idle); if (steward) steward.setSpec(P.concierge[2]);
    // ---- dancers: pairs that travel the line of dance
    const pairs = Array.from({ length: 9 }, (_, i) => { const a = mk(sc, P.formal[(i * 2) % 30], 13, 9, 0, 'Dancer', c => bubble(c, pick(E === 'class' ? LINES.klass : E === 'gala' ? LINES.gala : LINES.wedding)), 'customer'), b = mk(sc, P.formal[(i * 2 + 1) % 30], 13, 9, 2, 'Dancer', c => bubble(c, pick(E === 'class' ? LINES.klass : E === 'gala' ? LINES.gala : LINES.wedding)), 'customer'); a.hidden = b.hidden = true; return { a, b, ph: i / 9 * 6.283, sp: .9 + (i % 3) * .12, on: false }; });
    const teacher = mk(sc, Object.assign({}, P.formal.find(s => s.top === 'dress') || P.formal[0], { topColor: '#b8242e', bottomColor: '#b8242e' }), 13, 5.6, 1, 'Madame Vasquez', c => HS() && HS().talkTeacher(c)); teacher.hidden = true;
    const partner = mk(sc, P.formal[7], 13, 12, 3, 'Your partner', ['You lead. No, I lead. Somebody lead.'], 'customer'); partner.hidden = true;
    const ps = piano && piano.seats[0], band = [mk(sc, P.formal.filter(s => s.top === 'suit')[3] || P.formal[4], 0, 0, 3, 'Pianist', LINES.band), mk(sc, P.formal.filter(s => s.top === 'suit')[4] || P.formal[5], 12.7, 2, 1, 'Bass', LINES.band), mk(sc, P.formal.filter(s => s.top === 'suit')[5] || P.formal[6], 14.3, 2.2, 1, 'Drums', LINES.band), mk(sc, P.formal.filter(s => s.top === 'dress')[2] || P.formal[8], 15.9, 3.1, 1, 'Singer', LINES.band)];
    if (ps) { band[0].x = ps.x; band[0].y = ps.y; band[0].z = ps.z || .46; band[0].poseOpts = { seated: true }; } band[2].poseOpts = { seated: true }; band[2].z = .45; for (const c of band) c.hidden = true;
    const trays = [0, 1].map(i => { const c = mk(sc, P.waiter[i + 2], 6 + i * 14, 14.2, 1, 'Waiter', ['Canape? They are very small. Take two.', 'Sparkling, or the other sparkling?']); c.speed = 1.5; c.hidden = true; c.ni = i * 3; c.carry = true; c.poseOpts = { item: 'tray' }; return c; }), TN = [[6.2, 14.2], [6, 4.2], [12, 4], [20, 4.4], [20, 12], [16, 14.3]];
    let E = undefined, forced, view = null, tick = 0, T = 0, joined = false, cut = null;
    const event = () => (forced !== undefined ? forced : (ballEvent(G.now()) || {}).id || null);
    const sync = () => {
      const v = viewNow(); if (v !== view) { view = v; for (const o of wins) setP(o, { time: v }); }
      const e = event(), n = G.now(), isCut = e === 'wedding' && (forced !== undefined ? false : n.hf >= 20); if (cake && isCut !== cut) { cut = isCut; setP(cake, { cut: isCut ? 1 : 0 }); }
      if (e === E) return; E = e;
      for (const o of evObs) showOb(Wd, o, o.data.ev === e); for (const o of evObs) if (!o.hidden && o.solid) Wd.block(o.B[0], o.B[1], o.B[3], o.B[4]);
      setP(drape, { c: e === 'gala' ? '#22304e' : e === 'class' ? '#2f5a4a' : '#7a2030', text: e === 'wedding' ? 'CONGRATULATIONS' : e === 'gala' ? 'LIGHTHOUSE FUND' : e === 'class' ? 'DANCE CLASS' : '' });
      for (const o of tabs) setP(o, { centre: e === 'wedding' ? 'flowers' : e === 'gala' ? 'candelabra' : 'none', c: e === 'gala' ? '#22304e' : '#f8f4ea', cc: e === 'gala' ? '#e8c06a' : '#7a2030', serve: e === 'wedding' || e === 'gala' ? [0, '#f4ecd0', 0, '#f2a7c3', '#e8b060', 0] : [] });
      const n2 = e === 'class' ? 5 : e === 'wedding' ? 8 : e === 'gala' ? 9 : 0;
      pairs.forEach((q, i) => { q.on = i < n2; q.a.hidden = q.b.hidden = !q.on; if (e === 'class') { q.a.setSpec(AP.adult[(i * 5 + 2) % AP.adult.length]); q.b.setSpec(AP.adult[(i * 5 + 9) % AP.adult.length]); } else { q.a.setSpec(e === 'wedding' && i === 0 ? P.bride : P.formal[(i * 2) % 30]); q.b.setSpec(e === 'wedding' && i === 0 ? P.groom : P.formal[(i * 2 + 1) % 30]); } q.a.label = e === 'wedding' && i === 0 ? 'The bride' : 'Dancer'; q.b.label = e === 'wedding' && i === 0 ? 'The groom' : 'Dancer'; });
      teacher.hidden = e !== 'class'; band.forEach((c, i) => { c.hidden = e === 'class' ? i > 0 : !(e === 'wedding' || e === 'gala'); }); trays.forEach(c => { c.hidden = !(e === 'wedding' || e === 'gala'); });
      dress(cr, (s, c) => (s.kind === 'staff' ? null : P.formal[Math.floor(c.roll * 997) % 30]));
      for (const c of cr.list) { const s = c.spot; c.hidden = s.idle ? !!e : s.kind === 'staff' ? !e : !(e === 'wedding' || e === 'gala') || c.roll > (s.p || .8); }
      if (HS() && HS().ballChanged) HS().ballChanged(e);
    };
    const spot = () => ({ x: O + 13, y: O + 12.4 });
    sc.life = { crowd: cr, count: () => cr.count() + pairs.filter(q => q.on).length * 2 + band.filter(c => !c.hidden).length };
    sc.hot = { sync, event: () => E, force(id) { forced = id; sync(); }, pairs, band, partner, teacher, spot, floor: FLOOR,
      join(on) { joined = !!on; partner.hidden = !on; if (on) { const s = spot(); partner.setSpec(E === 'class' ? AP.adult[11] : P.formal[13]); partner.x = s.x + .45; partner.y = s.y; partner.dir = 2; partner.pose = 'dance'; } else partner.pose = null; } };
    sc.interactables.push({ x: O + FC[0], y: O + FC[1] + 2.6, label: 'The dance floor', h: .4, hit: 34, range: 2.4, use: () => HS() && HS().dance(sc) });
    sc.env = softEnv(Wd, .6, .5); sync();
    const u0 = sc.update; sc.update = (dt, gm) => {
      u0(dt, gm); cr.update(dt); if ((tick -= dt) <= 0) { tick = 1.5; sync(); } T += dt;
      const cls = E === 'class';
      pairs.forEach((q, i) => { if (!q.on) return; let cx, cy; if (cls) { cx = 9.4 + (i % 3) * 3.4 + (i > 2 ? 1.7 : 0); cy = 8.2 + Math.floor(i / 3) * 2.6; } else if (E === 'wedding' && i === 0) { cx = FC[0] + Math.cos(T * .25) * .8; cy = FC[1] + Math.sin(T * .25) * .5; } else { const a = q.ph + T * .16 * q.sp; cx = FC[0] + Math.cos(a) * (4.4 + (i % 2) * .7); cy = FC[1] + Math.sin(a) * (2.7 + (i % 2) * .5); }
        const sp = cls ? Math.sin(T * 1.6) * .5 : q.ph * 3 + T * 1.5 * q.sp, r = .3; q.a.x = O + cx + Math.cos(sp) * r; q.a.y = O + cy + Math.sin(sp) * r * .7; q.b.x = O + cx - Math.cos(sp) * r; q.b.y = O + cy - Math.sin(sp) * r * .7; q.a.faceTo(q.b.x, q.b.y); q.b.faceTo(q.a.x, q.a.y); q.a.pose = q.b.pose = 'dance'; q.a.t += dt; q.b.t += dt; });
      if (!teacher.hidden) { teacher.t += dt; if (teacher._hold > 0) teacher._hold -= dt; else { teacher.dir = 1; teacher.pose = Math.floor(T / 4) % 3 === 0 ? 'talk' : 'dance'; if (Math.floor(T / 9) !== teacher._b) { teacher._b = Math.floor(T / 9); if (Math.hypot(G.player.x - teacher.x, G.player.y - teacher.y) < 10) bubble(teacher, pick(['And one, two, three. One, two, three.', 'Frames up! You are holding a person, not a shopping bag.', 'Lovely. Lovely! No. Lovely.', 'Rise and fall, like the tide.']), 3000); } } }
      band.forEach((c, i) => { if (c.hidden) return; c.t += dt; if (c._hold > 0) { c._hold -= dt; return; } c.pose = i === 0 ? 'type' : i === 1 ? 'work' : i === 2 ? 'type' : (Math.floor(T / 5) % 2 ? 'talk' : 'dance'); });
      for (const c of trays) { if (c.hidden) continue; if (!step(c, Wd, dt)) { c.ni = (c.ni + 1) % TN.length; if (!go(c, Wd, TN[c.ni][0], TN[c.ni][1])) c._hold = 2; else c._hold = 1.5 + Math.random() * 2; } }
      if (!partner.hidden) { partner.t += dt; const p = G.player; if (joined && G.busy) { const a = T * 1.5; partner.x = p.x + Math.cos(a) * .5; partner.y = p.y + Math.sin(a) * .34; partner.faceTo(p.x, p.y); partner.pose = 'dance'; } }
      if (HS() && HS().ballTick) HS().ballTick(dt, E);
    };
    const e0 = sc.onEnter; sc.onEnter = (o, pv) => { e0(o, pv); view = null; E = undefined; sync(); if (HS()) HS().arrivedIn('ball', sc); };
    const x0 = sc.onExit; sc.onExit = to => { x0(to); if (HS()) HS().left('ball', sc); };
  },
});

export function init() {
  registerFixture('hotel_cake', only(fx => ({ label: 'The wedding cake', hit: 12, visible: () => !fx.ob.hidden, use: () => HS() && HS().cake(fx) })));
  registerFixture('hotel_auction', only(fx => ({ label: 'Silent auction', hit: 14, visible: () => !fx.ob.hidden, use: () => HS() && HS().auction() })));
  registerFixture('hotel_guestbook', only(fx => ({ label: 'The guest book', hit: 10, visible: () => !fx.ob.hidden, use: () => HS() && HS().guestbook() })));
}
