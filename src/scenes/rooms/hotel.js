// The Grand Maple Hotel — the Grand Lobby (room `hotel`, 30 x 20, two storeys with a mezzanine gallery) + the helpers shared by the other hotel rooms
// (hotel_dine.js: restaurant + rooftop bar, hotel_events.js: ballroom, hotel_stay.js: spa, guest corridor, guest room). Gameplay lives in sim/hotel.js (G.hotel).
// City door `door:hotel` (the existing Grand Maple Hotel building on Harbor Street). Exits (doormats, all with `to` so the nav arrow can route): the revolving door -> city,
//   "The Gilded Maple" -> int:hotel_restaurant, "The Bay Ballroom" -> int:hotel_ballroom, the grand staircase -> int:hotel_spa, the lifts -> floor menu (static edge: int:hotel_floor).
// The lobby runs its own life (def.noCrowd): scene.life = { crowd, walkers, count() }; scene.hot = { sync(), arrive() (a guest checks in with a bellhop + luggage cart), depart(), ring() (desk bell),
//   pianist, doorman, concierge, bellhops, carts, playing() -> piece index | -1, nodes }.
// Fixture tags handled here (only in hotel rooms): hotel_reception, hotel_bell, hotel_desk (item.p.kind concierge | shop | spa | host | steward), hotel_lift, hotel_flowers, hotel_staffwall, hotel_easel, hotel_board,
//   hotel_stairs. Listening seats: any settee / armchair of the lounge (item.listen).
import { G } from '../../core/game.js';
import { GT } from '../../engine/world.js';
import { Char, charArt } from '../../core/char.js';
import * as R from '../../engine/raster.js';
import { ambient } from '../../core/clock.js';
import { asset } from '../../art/registry.js';
import { assetSprite } from '../../engine/sprites.js';
import { defineRoom, registerFixture } from '../interior.js';
import { toast, bubble } from '../../ui/kit.js';
import { crowd, walkers } from './_show_life.js';
import { specs } from './_airport_life.js';
import { registerInfo } from './unique_rooms.js';
import { marbleFloor } from '../../art/showpiece/_hotel_lib.js';
import { HR, HV, NAME, REST_NAME, BALL_NAME, SPA_NAME, BAR_NAME, SHOP_NAME, FLOWERS, PIANO_SETS, inH, ballEvent, ballNext } from '../../data/hotel.js';

/* ---------------- shared helpers ---------------- */
export const O = 1, HS = () => G.hotel, pick = a => a[Math.floor(Math.random() * a.length)];
export const setP = (o, q) => { if (!o) return; for (const k in q) if (JSON.stringify(o.p[k]) !== JSON.stringify(q[k])) { o.p = Object.assign({}, o.p, q); o._key = null; return; } };
export const viewNow = () => { const a = ambient(G.state.t, 'clear'); return a.dark >= .8 ? 'night' : a.dark > .02 || a.amb !== '#ffffff' ? 'dusk' : 'day'; };
export const only = fn => (fx, scene) => (scene.def && scene.def.showpiece === 'hotel' ? fn(fx, scene) : null);
export const LOBBY_AT = { door: { x: O + 15, y: O + 16.8 }, rest: { x: O + 2.2, y: O + 7.2 }, ball: { x: O + 2.2, y: O + 16.3 }, stairs: { x: O + 23, y: O + 6.4 }, lift: { x: O + 16.1, y: O + 2.2 } };
let POOL = null;
/** dressed-up guests, staff uniforms, swimmers and bathrobes */
export function people() {
  if (POOL) return POOL; const A = charArt(), r = R.rng(9041), JEWEL = ['#7a2030', '#22304e', '#2f5a4a', '#5a2a6a', '#b8862e', '#8a3848', '#2f6a7a', '#c8404a', '#3a3a5a'], DARK = ['#2a2733', '#22304e', '#33303f', '#3a2a30', '#4a4a58'];
  const base = o => { const s = Object.assign({}, A.randomSpec(r, Object.assign({ season: 1 }, o))); s.outfit = null; s.bag = null; s.scarf = null; if (s.hat !== 'turban') s.hat = null; return s; };
  const formal = () => { const s = base({ age: r() < .16 ? 'elder' : 'adult', style: 'business' }); if (r() < .5 && !s.beard) { s.top = 'dress'; s.topColor = JEWEL[Math.floor(r() * JEWEL.length)]; s.bottom = 'longskirt'; s.bottomColor = s.topColor; s.shoes = '#2f2c3a'; } else { s.top = 'suit'; s.topColor = DARK[Math.floor(r() * DARK.length)]; s.bottom = 'slacks'; s.bottomColor = R.dk(s.topColor, .1); s.shoes = '#2f2c3a'; s.innerColor = '#f4f0e8'; } return s; };
  const uni = (o, n) => Array.from({ length: n }, () => Object.assign(base({ age: 'adult' }), o));
  POOL = { formal: Array.from({ length: 30 }, formal), bellhop: uni({ top: 'jacket', topColor: '#a8342e', bottom: 'slacks', bottomColor: '#2a2733', hat: 'cap', hatColor: '#a8342e', shoes: '#2f2c3a', accent: '#e8c06a', glasses: false }, 3),
    waiter: uni({ outfit: 'bartender' }, 6), chef: uni({ outfit: 'chef' }, 2), swim: Array.from({ length: 10 }, () => Object.assign(base({}), { outfit: 'swim' })), robe: uni({ top: 'coat', topColor: '#f6f2ea', bottom: 'sweats', bottomColor: '#f6f2ea', shoes: '#f0ece4' }, 8),
    maid: uni({ top: 'dress', topColor: '#3a4a6a', bottom: 'longskirt', bottomColor: '#3a4a6a', accent: '#f4f0e8' }, 2), concierge: uni({ top: 'suit', topColor: '#2a2733', bottom: 'slacks', bottomColor: '#2a2733', accent: '#e8c06a', innerColor: '#f4f0e8' }, 3),
    bride: Object.assign(base({ age: 'adult' }), { top: 'dress', topColor: '#fbf7ee', bottom: 'longskirt', bottomColor: '#fbf7ee', hair: 'bun', beard: false, shoes: '#f0ece4' }), groom: Object.assign(base({ age: 'adult' }), { top: 'suit', topColor: '#2a2733', bottom: 'slacks', bottomColor: '#2a2733', innerColor: '#f4f0e8', shoes: '#2f2c3a' }) };
  return POOL;
}
/** a named walking character (room coords). lines: array | fn(c) -> opens something. returns the Char */
export function mk(sc, spec, x, y, dir, label, lines, kind) {
  const c = new Char(spec, x + O, y + O); c.speed = 1.7; c.dir = dir === undefined ? 1 : dir; c.kind = kind || 'staff'; c.label = label; sc.ents.push(c);
  if (lines) sc.interactables.push({ ent: c, x: c.x, y: c.y, label, h: 1.3, hit: 8, range: 1.8, visible: () => !c.hidden && (c.alpha === undefined || c.alpha > .5), use: () => { c._hold = 4; c.path = null; if (!c.poseOpts || !c.poseOpts.seated) c.faceTo(G.player.x, G.player.y); if (typeof lines === 'function') lines(c); else bubble(c, pick(lines), 3600); } });
  return c;
}
/** advance a path-walking char; returns true while it is still walking */
export const step = (c, W, dt) => { if (c._hold > 0) { c._hold -= dt; c.moving = false; c.t += dt; return true; } if (c.path) { c.move(W, dt); return !!c.path; } c.moving = false; c.t += dt; return false; };
export const go = (c, W, x, y) => c.goTo(W, x + O, y + O);
/** a prop that moves (luggage cart, swimmer): entity drawing an asset at its min corner */
export function propEnt(id, p, sc) { const a = asset(id), sz = q => (typeof a.size === 'function' ? a.size(q) : a.size), e = { x: 0, y: 0, z: 0, p: p || {}, flip: false, hidden: false, bb: [0, 0, 1, 1, 1], sprite() { return assetSprite(a, this.p, this.flip); }, set(q) { this.p = Object.assign({}, this.p, q); return this; }, fit() { const s = sz(this.p); this.bb = this.flip ? [0, 0, s[1], s[0], s[2]] : [0, 0, s[0], s[1], s[2]]; return this; } }; e.fit(); if (sc) sc.ents.push(e); return e; }
/** show / hide a placed object together with its footprint in the nav grid */
export const showOb = (W, o, on) => { if (!o || o.hidden === !on) return; o.hidden = !on; if (o.solid) { if (on) W.block(o.B[0], o.B[1], o.B[3], o.B[4]); else W.free(o.B[0], o.B[1], o.B[3], o.B[4]); } };
/** soft indoor light: bright by day, lamp-lit and warm at night */
export const softEnv = (Wd, k = .55, d = .5) => t => { const o = ambient(t, G.state.weather); return { amb: o.amb === '#ffffff' ? o.amb : R.mix(o.amb, '#ffffff', k), dark: Math.min(d, (o.dark || 0) * d), bg: Wd.bg, night: o.night }; };
/** re-dress a static crowd: fn(spot, char) -> spec | null */
export const dress = (cr, fn) => { for (const c of cr.list) { const s = fn(c.spot, c); if (s && s !== c.spec) c.setSpec(s); } };
export const seatsOf = (sc, re, o) => { const out = []; for (const f of sc.fixtures) { if (!re.test(f.asset.id) || (o && o.skip && o.skip(f))) continue; f.seats.forEach((s, i) => out.push(Object.assign({ x: s.x - O, y: s.y - O, z: s.z, dir: s.dir === undefined ? 1 : s.dir, seated: true, p: .5, fx: f, si: i }, o && o.add ? o.add(f, i, out.length) : null))); } return out; };

/* ---------------- the lobby ---------------- */
const W = 30, D = 20, items = [], spots = [];
const H = (id, x, y, p, o) => { const it = Object.assign({ id: id.includes('.') ? id : 'furn.hotel.' + id, x, y, p: p || {} }, o); items.push(it); return it; };
const Wl = (id, wall, at, p, o) => { const it = Object.assign({ id: id.includes('.') ? id : 'furn.hotel.' + id, wall, at, p: p || {} }, o); items.push(it); return it; };
const S = (x, y, dir, o) => spots.push(Object.assign({ x, y, dir }, o));
const LINES = {
  guest: ['They still turn the bed down and leave a chocolate. I checked. Twice.', 'I only came in for the pianist and somehow I have a room key.', 'The chandelier has four thousand crystals. A bellhop told me. He has counted.', 'Tea in the restaurant at two. Do not eat lunch first, that was my mistake.', 'The rooftop bar opens at four. The lift knows the way.', 'Somebody gets married here every Saturday. You can hear the band from the street.', 'Thirty years I walked past that revolving door. Thirty years!', 'The pool is on the second floor. A POOL. On the second FLOOR.'],
  reception: ['Welcome to the Grand Maple. Ring the bell if we are both busy.', 'Checkout is at eleven. Nobody has ever been ready at eleven.', 'Every room has the good pillows. That is the policy.'],
  shop: ['The bathrobes are the same ones upstairs. People ask.', 'The bear in the bellhop hat is called Mr. Buttons.', 'Bath salts for the tub, chocolates for the pillow.'],
  bellhop: ['Mind your ankles, coming through!', 'Seventh floor? I will have it there before you are.', 'Eleven bags, one cart. It is all in how you stack them.'],
};
function build() {
  Wl('gallery', 'y', 0, { w: 30 }, { mount: 3.25 }); Wl('gallery', 'x', 0, { w: 20 }, { mount: 3.25 });
  Wl('keyrack', 'y', 6.5, { w: 5 }); Wl('furn.lobby.restroom', 'y', 12.4, { c: '#5a4030', dc: '#7a2030' }); Wl('furn.lobby.restroom', 'y', 13.55, { c: '#5a4030', dc: '#22304e' });
  Wl('lift', 'y', 14.9, {}, { lift: 1, n: 0 }); Wl('lift', 'y', 17.5, {}, { lift: 1, n: 1 });
  for (const at of [1.4, 4.4, 20.6, 29]) Wl('furn.lobby.sconce', 'y', at, {}); for (const at of [1.6, 9.6, 18.6]) Wl('furn.lobby.sconce', 'x', at, {});
  Wl('doorway', 'x', 5, { name: 'THE GILDED MAPLE', w: 4.4, lit: 1 }); Wl('staffwall', 'x', 10.4, {}, { staffwall: 1 }); Wl('doorway', 'x', 14.6, { name: 'BAY BALLROOM', c: '#22304e', w: 3.4, lit: 1 });
  H('reception', 6, 2.3, { w: 6 }); H('bell', 11.25, 2.75, {}, { z: 1.13, bell: 1 }); S(7.5, 1.85, 1, { kind: 'staff', label: 'Reception', lines: LINES.reception }); S(10.3, 1.85, 1, { kind: 'staff', label: 'Reception', lines: LINES.reception });
  H('desk', 7.2, 10.2, { kind: 'concierge' }, { concierge: 1 });
  H('flowers', 14.1, 8.1, {}, { flowers: 1 }); H('chandelier', 13.8, 7.8, { r: 1.1 }, { z: 2.9 }); H('chandelier', 5.6, 5.6, { r: .7 }, { z: 3.3 }); H('chandelier', 23.4, 10.4, { r: .7 }, { z: 3.3 });
  for (const [x, y] of [[10.6, 5.6], [19, 5.6], [10.6, 13.4], [19, 13.4]]) H('furn.lobby.column', x, y, { kind: 'marble', h: 5.2 });
  H('grandstair', 21.5, .3, { n: 13 }); H('shopcase', 25.4, .15, { w: 3 }); H('desk', 25.8, 2.4, { kind: 'shop', w: 2.2 }, { venue: HV.gifts }); S(26.9, 1.9, 1, { kind: 'staff', label: SHOP_NAME, lines: LINES.shop });
  H('carpet', 13.5, 10.4, { w: 3, d: 6.8 }); H('carpet', 21.6, 9, { w: 7.4, d: 6.6, c: '#22304e' });
  H('furn.perf.piano', 24.4, 13, {}, { piano: 1 }); H('easel', 27.4, 14.2, {}, { easel: 1 });
  H('furn.lobby.settee', 22.4, 9.5, { c: '#7a2030', a: '#e8c06a' }, { listen: 1 }); H('furn.lobby.settee', 25.4, 9.5, { c: '#7a2030', a: '#e8c06a' }, { listen: 1 }); H('furn.cafe.lowtable', 24.3, 11.2, {});
  H('furn.cafe.armchair', 21.9, 11.6, { c: '#2f5a4a' }, { flip: true, listen: 1 }); H('furn.cafe.armchair', 21.9, 13.2, { c: '#2f5a4a' }, { flip: true, listen: 1 });
  H('furn.lobby.settee', 1.6, 1.1, { c: '#2f5a4a', w: 3 }); H('furn.cafe.lowtable', 2.6, 2.4, {}); H('furn.cafe.armchair', 4.9, 1.2, { c: '#7a2030' });
  for (const [x, y, s] of [[.6, .6, 1], [28.9, .7, 2], [.7, 18.6, 3], [28.8, 18.6, 4], [20.4, 16.6, 5], [12.2, 1, 6]]) H('palm', x, y, { seed: s });
  H('board', 3, 11.4, { lines: ['TODAY', 'WELCOME'] }, { board: 1 }); H('cart', 18.2, 16.3, { n: 0 }, { solid: true });
  H('prop.hotel.suitcase', 8.2, 4.5, { c: '#2f5a4a' }); H('prop.hotel.suitcase', 8.8, 4.6, { c: '#8a3a2e', flat: 1 });
  H('revdoor', 13.7, 17.3, {}, { rev: 1 });
  S(7.6, 4, 3, { p: .75 }); S(10.2, 4.05, 3, { busy: 1 }); S(18.7, 2.5, 3, { p: .5, anim: 'phone' }); S(16.9, 10.6, 2, { p: .5, anim: 'phone' }); S(4.4, 13, 3, { p: .55 }); S(27.4, 3.9, 3, { p: .6 }); S(28.2, 3.6, 3, { busy: 1 });
  S(2.3, 10, 0, { busy: 1, anim: 'talk' }); S(3.2, 10.1, 2, { busy: 1, anim: 'talk' }); S(27.9, 12.4, 1, { p: .5 }); S(5.2, 3.4, 3, { busy: 1, age: 'kid', lines: ['Can I ring the bell? Can I? Just once?', 'The door goes ROUND. I went round FOUR times.'] }); S(20.3, 9.6, 2, { busy: 1 }); S(12.6, 12.2, 0, { p: .4, anim: 'phone' });
}
build();
const N = { d0: [15, 16.7], d1: [16.9, 14.6], m: [17.2, 8.4], r1: [12.6, 4.5], rcp: [9.4, 4.2], l1: [16.3, 2.5], st: [23, 6.2], s0: [20.6, 6.8], sh: [27, 4], sv: [20.3, 4.4], lg: [21.2, 12.6], c1: [13, 12], c2: [11.9, 9.4], c3: [5, 7.6], rd: [1.7, 7.2], b1: [12.4, 14.7], b2: [6, 14.9], bd: [1.7, 16.3] };
const ROUTES = [['d0', 'd1', 'm', 'r1', 'rcp*', 'r1', 'l1'], ['l1', 'm', 'd1', 'd0'], ['d0', 'c1', 'c2', 'c3', 'rd'], ['rd', 'c3', 'c2', 'c1', 'd0'], ['l1', 'sv', 'sh*', 'sv', 'l1'], ['d0', 'b1', 'b2', 'bd'], ['l1', 'm', 'lg*', 'm', 'l1'], ['d0', 'd1', 'm', 's0', 'st'], ['st', 's0', 'm', 'l1'], ['rd', 'c3', 'c2', 'm', 'l1'], ['bd', 'b2', 'b1', 'd0']];

defineRoom({ id: HR.lobby, name: NAME + ' — Grand Lobby', w: W, d: D, zoom: 0, music: 'quiet', noCrowd: true, showpiece: 'hotel', venue: HV.place, floor: GT.f_stone, bg: '#181420', edge: '#4a3c34',
  wall: { color: '#ead9bd', trim: '#7a5a34', h: 5.3, rail: 3.2 },
  exits: [{ x: 15, y: 19.4, label: 'Exit to Harbor Street', poi: 'door:hotel' },
    { x: 1.2, y: 7.2, label: REST_NAME + ' (restaurant)', to: 'int:' + HR.rest, use: () => G.go('int:' + HR.rest) }, { x: 1.2, y: 16.3, label: BALL_NAME, to: 'int:' + HR.ball, use: () => G.go('int:' + HR.ball) },
    { x: 23, y: 5.9, label: 'Stairs up to ' + SPA_NAME, to: 'int:' + HR.spa, use: () => HS() && HS().toSpa('stairs') }, { x: 16.1, y: 1.3, label: 'Lift', to: 'int:' + HR.floor, use: () => HS() && HS().lift() }, { x: 18.7, y: 1.3, label: 'Lift', to: 'int:' + HR.floor, use: () => HS() && HS().lift() }],
  spawn: { x: 15, y: 16.8, dir: 3 }, items, npcSpots: spots,
  setup(sc) {
    const Wd = sc.world, objs = Wd.objs, by = k => objs.filter(o => o.data && o.data[k]), P = people(), AP = specs();
    const flowers = by('flowers')[0], board = by('board')[0], easel = by('easel')[0], staffwall = by('staffwall')[0], lifts = by('lift'), bell = by('bell')[0], rev = by('rev')[0], piano = sc.fixtures.find(f => f.item.piano);
    // ---- floor: cream / honey marble with a dark border and a brass compass under the flowers
    Wd.decal({ x0: O, y0: O, x1: O + W, y1: O + D, draw(Rr) { const mf = marbleFloor('#f0e6d2', '#e2d2b4', 2, '#b8a888'), cx = O + 15, cy = O + 9;
      Rr.qz(O, O + W, O, O + D, 0, (x, y) => { const X = x - O, Y = y - O, e = Math.min(X, Y, W - X, D - Y), dd = Math.hypot(x - cx, y - cy); if (e < .35) return '#5a4638'; if (e < .5) return '#c89a4a';
        if (dd < 3.4) { const a = Math.atan2(y - cy, x - cx); if (dd > 3.2) return '#c89a4a'; if (dd > 3) return '#5a4638'; const k = Math.abs(((a / (Math.PI / 4)) % 2 + 2) % 2 - 1); return dd < 2.9 * (.32 + .68 * Math.pow(k, 2.2)) ? (Math.floor((a + 6.283) / (Math.PI / 4)) & 1 ? '#7a2030' : '#c89a4a') : '#f6eede'; }
        const fx = X / 2 - Math.floor(X / 2), fy = Y / 2 - Math.floor(Y / 2); if (Math.abs(fx - .5) + Math.abs(fy - .5) > .9) return '#5a4638'; return mf(X, Y); }); } }); Wd.version++;
    Wd.lights.push({ x: O + 15, y: O + 9, z: 0, r: 8, c: '#ffe9b0' }, { x: O + 9, y: O + 3.6, z: 0, r: 5, c: '#ffe9b0' }, { x: O + 24.6, y: O + 12, z: 0, r: 6, c: '#ffe2a0' }, { x: O + 15, y: O + 17, z: 0, r: 4, c: '#ffe9b0' }, { x: O + 8.5, y: O + 11, z: 0, r: 3.5, c: '#ffe9b0' }, { x: O + 26.8, y: O + 2.6, z: 0, r: 3.5, c: '#ffe9b0' });
    // ---- static crowd + lane walkers
    const seats = seatsOf(sc, /settee|armchair/, { add: (f, i, n) => ({ busy: n % 3 === 1 ? 1 : 0, anim: n % 4 === 0 ? 'read' : undefined }) });
    const cr = crowd(sc, sc.def.npcSpots.concat(seats), { seed: 77, fill: .7, lines: LINES.guest });
    dress(cr, (s, c) => (s.kind === 'staff' ? P.concierge[Math.floor(c.roll * 3)] : null));
    const lane = () => { const r = pick(ROUTES), pts = r.map(k => { const st = k.endsWith('*'), n = N[k.replace('*', '')]; return Object.assign({ x: n[0] + O + (Math.random() - .5) * .5, y: n[1] + O + (Math.random() - .5) * .4 }, st ? { wait: 7 + Math.random() * 8, pose: Math.random() < .3 ? 'phone' : null, dir: 3 } : null); }); return { pts, kind: Math.random() < .35 ? 'bag' : Math.random() < .4 ? 'stroll' : 'walk' }; };
    const wk = walkers(sc, { n: 12, route: lane, lines: LINES.guest, label: 'Hotel guest' });
    // ---- named staff
    const doorman = mk(sc, Object.assign({}, AP.elder[1], { outfit: null, top: 'coat', topColor: '#7a2030', bottom: 'slacks', bottomColor: '#2a2733', hat: 'cap', hatColor: '#7a2030', accent: '#e8c06a', shoes: '#2f2c3a' }), 13.1, 16.6, 0, 'Gus, the doorman', c => HS() && HS().talkDoorman(c));
    const concierge = mk(sc, P.concierge[0], 8.5, 9.75, 1, 'Odile, the concierge', c => HS() && HS().concierge(c));
    const pianist = mk(sc, Object.assign({}, P.formal.find(s => s.top === 'suit') || P.formal[0]), 0, 0, 3, 'Mr. Okonkwo, the pianist', c => HS() && HS().talkPianist(c)); const ps = piano && piano.seats[0];
    if (ps) { pianist.x = ps.x; pianist.y = ps.y; pianist.z = ps.z || .46; pianist.poseOpts = { seated: true }; pianist.pose = 'type'; }
    // ---- bellhops, carts, arriving and departing guests
    const bh = [0, 1].map(i => { const c = mk(sc, P.bellhop[i], 17 + i * 2.6, 17.2, 3, 'Bellhop', LINES.bellhop); c.speed = 2.1; c.home = [17 + i * 2.6, 17.2]; c.cart = propEnt('furn.hotel.cart', { n: 0, seed: i + 2 }, sc); c.cart.hidden = true; c.job = null; return c; });
    const guests = [0, 1].map(i => { const c = mk(sc, AP.adult[i * 7 + 3], 15, 16.7, 3, 'Arriving guest', ['Is this where I check in? It is so... shiny.', 'Careful with the blue one, it has the wedding present in it.']); c.hidden = true; c.kind = 'customer'; return c; });
    const cartFollow = b => { const c = b.cart; if (c.hidden) return; const v = [[1, 0], [0, 1], [-1, 0], [0, -1]][b.dir], fl = b.dir === 1 || b.dir === 3; if (c.flip !== fl) { c.flip = fl; c.fit(); } c.x = b.x + v[0] * 1.15 - (fl ? .4 : .75); c.y = b.y + v[1] * 1.15 - (fl ? .75 : .4); };
    const fade = (c, out, dt) => { c.alpha = Math.max(0, Math.min(1, (c.alpha === undefined ? (out ? 1 : 0) : c.alpha) + (out ? -dt * 2.5 : dt * 2.5))); if (!out && c.alpha >= 1) c.alpha = undefined; return out ? c.alpha <= 0 : c.alpha === undefined; };
    const liftOpen = (n, on) => setP(lifts[n % lifts.length], { open: on ? 1 : 0, at: on ? 0 : .66 });
    // a job is a list of steps; each step: fn(job, dt) -> true when done
    const jobs = []; let jobT = 6;
    const walk = (who, x, y) => j => { const c = j[who]; if (!j['_' + who]) { j['_' + who] = 1; c.pose = null; if (!go(c, Wd, x, y)) { c.x = x + O; c.y = y + O; } } if (step(c, Wd, 0)) return false; j['_' + who] = 0; return true; };
    const both = (a, b) => (j, dt) => { const x = a(j, dt), y = b(j, dt); return x && y; };
    const wait = s => (j, dt) => { j._w = (j._w === undefined ? s : j._w) - dt; if (j._w > 0) return false; j._w = undefined; return true; };
    const run = fn => j => { fn(j); return true; };
    function arrive(force) {
      const b = bh.find(q => !q.job), g = guests.find(q => q.hidden && !q.job); if (!b || !g) return false; const ln = jobs.length % 2;
      g.setSpec(pick(Math.random() < .4 ? P.formal : AP.adult)); g.x = O + 15; g.y = O + 16.8; g.hidden = false; g.alpha = 0; g.carry = true; g.poseOpts = { item: 'bag', itemColor: pick(['#8a3a2e', '#2f5a4a', '#22304e']) }; g.label = 'Arriving guest';
      const j = { b, g, kind: 'in', i: 0, steps: [
        run(() => { bubble(b, pick(['Welcome to the Grand Maple!', 'Let me take those for you.', 'Right this way.'])); b.cart.hidden = false; b.cart.set({ n: 0 }); }), walk('b', 16.4, 15.6), run(() => { b.cart.set({ n: 3 + Math.floor(Math.random() * 3) }); g.carry = false; g.poseOpts = null; }), wait(.8),
        both(walk('g', 8.9, 4.15), walk('b', 12.6, 6.6)), run(() => { g.dir = 3; g.pose = 'talk'; }), wait(7), run(() => { g.pose = null; liftOpen(ln, true); }), both(walk('g', 15.9 + ln * 2.6, 1.7), walk('b', 16.6 + ln * 2.6, 3)),
        (jj, dt) => { const a = fade(g, true, dt), c = fade(b, true, dt); b.cart.alpha = b.alpha; return a && c; }, run(() => { g.hidden = true; b.hidden = true; b.cart.hidden = true; liftOpen(ln, false); }), wait(force ? 4 : 14 + Math.random() * 10),
        run(() => { b.hidden = false; b.alpha = 0; b.cart.hidden = false; b.cart.alpha = undefined; b.cart.set({ n: 0 }); b.x = O + 16.6 + ln * 2.6; b.y = O + 2.4; b.dir = 1; liftOpen(ln, true); }), (jj, dt) => fade(b, false, dt), run(() => liftOpen(ln, false)), walk('b', b.home[0], b.home[1]), run(() => { b.dir = 3; b.cart.hidden = true; })] };
      b.job = g.job = j; jobs.push(j); return true;
    }
    function depart() {
      const b = bh.find(q => !q.job), g = guests.find(q => q.hidden && !q.job); if (!b || !g) return false; const ln = (jobs.length + 1) % 2;
      const j = { b, g, kind: 'out', i: 0, steps: [walk('b', 16.6 + ln * 2.6, 3), run(() => { liftOpen(ln, true); g.setSpec(pick(AP.adult)); g.x = O + 15.9 + ln * 2.6; g.y = O + 1.8; g.dir = 1; g.hidden = false; g.alpha = 0; g.carry = false; g.poseOpts = null; g.label = 'Departing guest'; b.cart.hidden = false; b.cart.set({ n: 2 + Math.floor(Math.random() * 3) }); }),
        (jj, dt) => fade(g, false, dt), run(() => liftOpen(ln, false)), both(walk('g', 10.6, 4.15), walk('b', 14.6, 14.6)), run(() => { g.dir = 3; g.pose = 'talk'; }), wait(5), run(() => { g.pose = null; }), walk('g', 15, 16.4), run(() => { bubble(b, pick(['Safe travels!', 'Your cab is at the kerb.', 'Come back soon.'])); b.cart.set({ n: 0 }); g.carry = true; g.poseOpts = { item: 'bag', itemColor: '#8a3a2e' }; }),
        (jj, dt) => fade(g, true, dt), run(() => { g.hidden = true; }), walk('b', b.home[0], b.home[1]), run(() => { b.dir = 3; b.cart.hidden = true; })] };
      b.job = g.job = j; jobs.push(j); return true;
    }
    // ---- sync with the clock and the story
    let tick = 0, ft = 0, fr = 0, week = -1, lvl = -1, bellT = 0, lastBoard = '', revT = 0, you = null;
    const playing = () => { const n = G.now(), i = PIANO_SETS.findIndex(s => inH(n.hf, s)); return i; };
    const sync = () => {
      const n = G.now(), h = n.hf, wkI = Math.floor(n.day / 7) % FLOWERS.length; if (wkI !== week) { week = wkI; setP(flowers, { c: FLOWERS[wkI].c, seed: wkI + 1 }); }
      const set = playing(); pianist.hidden = set < 0; setP(easel, { on: set >= 0 ? 1 : 0 });
      const ev = ballEvent(n), nx = ballNext(n, 3)[0], ln = ev ? ['NOW ON', ev.short, 'BALLROOM'] : nx ? [nx.day === n.day ? 'TONIGHT' : ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'][nx.day % 7], (BALLSHORT[nx.id] || 'EVENT'), String(Math.floor(nx.from)) + ':00'] : ['WELCOME', 'TEA 2 - 5', 'BAR FROM 4'], key = ln.join('|'); if (key !== lastBoard) { lastBoard = key; setP(board, { lines: ln, lit: ev ? 1 : 0 }); }
      const st = HS() && HS().chain ? HS().chain().st : 0, me = st >= 3 ? JSON.stringify(G.state.player.spec || {}) : null; if (me !== you) { you = me; const sp = G.state.player.spec || {}; setP(staffwall, { you: st >= 3 ? { skin: sp.skin, hair: sp.hairColor, top: sp.topColor } : null }); }
      const L = h < 6 ? .15 : h < 9 ? .45 : h < 12 ? .6 : h < 14 ? .55 : h < 19 ? .8 : h < 23 ? .6 : .3, busy = (h >= 14 && h < 19) || !!ev;
      if (L !== lvl || busy !== sc.life.busy) { lvl = L; sc.life.busy = busy; for (const c of cr.list) { const s = c.spot; c.hidden = s.kind === 'staff' ? false : s.busy ? !busy || c.roll > L + .3 : c.roll > (s.p !== undefined ? Math.min(s.p, L + .1) : L); } wk.setActive(Math.round(2 + L * 11)); }
      doorman.hidden = false; concierge.hidden = h < 6.5 || h >= 23.5;
    };
    sc.life = { crowd: cr, walkers: wk, count: () => cr.count() + wk.count() + jobs.length * 2 + 2, busy: null };
    sc.hot = { sync, arrive, depart, pianist, doorman, concierge, bellhops: bh, guests, playing, nodes: N, routes: ROUTES, jobs, ring() { bellT = .9; setP(bell, { ring: 1 }); const r = cr.list.find(c => c.spot.kind === 'staff' && c.spot.label === 'Reception'); if (r) bubble(r, pick(['Coming!', 'With you in one moment!', 'Good ' + (G.now().hf < 12 ? 'morning' : G.now().hf < 18 ? 'afternoon' : 'evening') + '!'])); } };
    sc.env = softEnv(Wd, .6, .45); sync();
    const u0 = sc.update; sc.update = (dt, gm) => {
      u0(dt, gm); cr.update(dt); wk.update(dt);
      if ((tick -= dt) <= 0) { tick = 1.5; sync(); }
      if (bellT > 0 && (bellT -= dt) <= 0) setP(bell, { ring: 0 });
      // the revolving door turns while somebody is near it
      const p = G.player, near = Math.hypot(p.x - (O + 15), p.y - (O + 18.6)) < 2.6 || wk.list.some(w => !w.ch.hidden && Math.hypot(w.ch.x - (O + 15), w.ch.y - (O + 18)) < 2) || guests.some(g => !g.hidden && g.y > O + 15.5); if (near && (revT += dt) > .12) { revT = 0; fr = (fr + 1) % 4; setP(rev, { frame: fr }); }
      // jobs
      for (let i = jobs.length - 1; i >= 0; i--) { const j = jobs[i]; let guard = 0; while (j.i < j.steps.length && guard++ < 4 && j.steps[j.i](j, dt)) j.i++; if (j.i >= j.steps.length) { j.b.job = j.g.job = null; jobs.splice(i, 1); } }
      for (const b of bh) { if (b.job) { step(b, Wd, dt); cartFollow(b); } else { b.t += dt; b.moving = false; } } for (const g of guests) if (!g.hidden) step(g, Wd, dt);
      if ((jobT -= dt) <= 0) { const h = G.now().hf; jobT = (h >= 14 && h < 20 ? 16 : h < 6 ? 90 : 30) + Math.random() * 14; if (h >= 6 && h < 12.5 && Math.random() < .65) depart(); else arrive(); }
      if (!pianist.hidden) { pianist.t += dt; if (pianist._hold > 0) pianist._hold -= dt; pianist.pose = 'type'; }
      doorman.t += dt; if (doorman._hold > 0) doorman._hold -= dt; else doorman.dir = 0; concierge.t += dt; if (concierge._hold > 0) concierge._hold -= dt; else { concierge.dir = 1; concierge.pose = Math.floor(G.time / 7) % 3 === 0 ? 'work' : null; }
      if (HS() && HS().pianoTick) HS().pianoTick(dt, pianist.hidden ? -1 : playing(), Math.hypot(p.x - pianist.x, p.y - pianist.y));
    };
    const e0 = sc.onEnter; sc.onEnter = (o, pv) => { e0(o, pv); sync(); if (HS()) HS().arrived(sc, pv); };
    const x0 = sc.onExit; sc.onExit = to => { x0(to); if (HS() && HS().pianoStop) HS().pianoStop(); };
  },
});
const BALLSHORT = { class: 'DANCE CLASS', wedding: 'WEDDING', gala: 'CHARITY GALA' };

registerInfo('Grand Maple Hotel', {
  blurb: 'The grand hotel of Maple Bay, under the red canopy on Harbor Street. Through the revolving door: a two-storey marble lobby with a four-thousand-crystal chandelier and a pianist, The Gilded Maple restaurant, the Bay Ballroom, a spa with a pool on the second floor, guest rooms on the seventh and The Weathervane bar on the roof.',
  signature: 'The lobby pianist at noon, five and half past eight, and the skyline from the rooftop bar at sunset.',
  tryThis: ['Ring the bell at reception', 'Ask Odile the concierge where to find anything in town', 'Sit in the lounge and listen to the pianist (12:00, 17:00, 20:30)', 'Fill your own plate at the breakfast buffet, 6:30 to 10:30', 'Take afternoon tea at two', 'Order the five-course dinner and watch the waiters work', 'Shake your own cocktail on the roof at sunset', 'Join the dance class on Tuesday or Thursday at seven', 'Slip into a Saturday wedding reception and dance', 'Swim laps, sit in the sauna, book a massage', 'Book a room for the night and order room service', 'Help Odile untangle the three burgundy suitcases'],
  activities: ['hotel_bell', 'hotel_concierge', 'hotel_piano', 'hotel_buffet', 'hotel_tea', 'hotel_dinner', 'hotel_cocktail', 'hotel_dance', 'hotel_swim', 'hotel_sauna', 'hotel_massage', 'hotel_stay', 'hotel_roomservice'], kind: 'hotel',
});
registerInfo(NAME, { blurb: 'The grand hotel of Maple Bay: lobby pianist, restaurant, ballroom, spa and pool, rooftop bar and rooms for the night.', signature: 'The lobby pianist and the rooftop at sunset.', tryThis: ['Ring the bell at reception', 'Shake your own cocktail on the roof', 'Book a room for the night'], activities: ['hotel_stay'], kind: 'hotel' });

export function init() {
  registerFixture('hotel_reception', only(() => ({ label: 'Reception', hit: 16, use: () => HS() && HS().reception() })));
  registerFixture('hotel_bell', only((fx, sc) => ({ label: 'Ring the bell', hit: 9, h: 1.3, z: 0, spot: { x: fx.x + .1, y: fx.ob.B[4] + 1.15 }, use: () => HS() && HS().ringBell(sc) })));
  registerFixture('hotel_desk', only((fx, sc) => { const k = fx.item.p.kind || 'concierge'; if (k === 'concierge') return { label: 'Concierge desk', hit: 14, use: () => HS() && HS().concierge(sc.hot && sc.hot.concierge) }; if (k === 'shop') return { label: SHOP_NAME, hit: 14, shop: HV.gifts, use: () => HS() && HS().shop() }; if (k === 'spa') return { label: SPA_NAME + ' desk', hit: 14, use: () => HS() && HS().spaDesk() }; if (k === 'host') return { label: 'Host stand', hit: 14, use: () => HS() && HS().host(sc) }; return { label: 'Ballroom steward', hit: 14, use: () => HS() && HS().steward(sc) }; }));
  registerFixture('hotel_lift', only(fx => ({ label: 'Lift', hit: 16, h: 2.2, use: () => HS() && HS().lift() })));
  registerFixture('hotel_stairs', only(() => ({ label: 'Stairs up to ' + SPA_NAME, hit: 16, h: 1.6, use: () => HS() && HS().toSpa('stairs') })));
  registerFixture('hotel_flowers', only(() => ({ label: 'The flowers', hit: 14, h: 1.8, use: () => HS() && HS().flowers() })));
  registerFixture('hotel_staffwall', only(() => ({ label: 'Our People', hit: 12, h: 1.6, use: () => HS() && HS().staffWall() })));
  registerFixture('hotel_easel', only(() => ({ label: 'Piano programme', hit: 10, use: () => HS() && HS().pianoMenu() })));
  registerFixture('hotel_board', only((fx, sc) => ({ label: sc.roomId === HR.bar ? 'Cocktail list' : "What's on", hit: 12, use: () => HS() && (sc.roomId === HR.bar ? HS().barMenu() : HS().whatsOn()) })));
  registerFixture('seating', only((fx, sc) => (fx.item.listen ? { label: 'Sit and listen', hit: 12, use: () => HS() && HS().listen(fx, sc) } : null)));
}
