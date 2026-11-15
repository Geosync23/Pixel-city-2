// Bay Fish Hall — the market hall (room `fishmarket`, 34 x 22: an iron-and-glass shed with two roller doors open to the quay). Gameplay lives in sim/fishmarket.js (G.fishmarket), data in data/fishmarket.js.
// City door `door:fishmarket` (added at runtime in front of the existing `bld.harbor.fishmarket` on the boardwalk). One exit: the doormat back to the boardwalk.
// Zones: the auction floor (rostrum, price clock, six lots, quay doors with the boats, ice machine, platform scale), aisle one (whole fish, Big Blue, shellfish), aisle two (cephalopods, oyster bar, smokery, lobster tank),
//   aisle three (sushi, salt, knives, tackle), the food court (fish & chips, chowder, mess tables), and by the door the Oyster Derby bar, the filleting bench, recipe cards, the catch board.
// The hall runs its own life (def.noCrowd): scene.fm = { sync(), stallOb(id), monger(id), weigh(stallId, itemId), throwFish(toPlayer) -> { p() 0..1, landed }, sold(n, who), spark(on), cat, gulls, lobsters, dockers, auctioneer,
//   crowd, walkers, count() }.
// Fixture tags handled here (only in this room): fish_stall, fish_block, fish_lot, fish_tank, fish_ice, fish_board, fish_shuck, fish_fillet, fish_sample, fish_recipes, fish_scale, fish_stamps, fish_quay.
import { G } from '../../core/game.js';
import { GT } from '../../engine/world.js';
import { Char, charArt } from '../../core/char.js';
import * as R from '../../engine/raster.js';
import { ambient } from '../../core/clock.js';
import { pixSprite } from '../../engine/sprites.js';
import { MODULES } from '../../art/registry.js';
import { defineRoom, registerFixture } from '../interior.js';
import { bubble } from '../../ui/kit.js';
import { crowd, walkers } from './_show_life.js';
import { registerInfo } from './unique_rooms.js';
import { SPECIES, stamp, fishAt } from '../../art/showpiece/_fish_lib.js';
import { STALL_NAMES, STALL_COLS, STALL_W } from '../../art/showpiece/fishmarket_stalls.js';
import { FM, NAME, HOURS, STALLS, STALL_BY_ID, BOATS } from '../../data/fishmarket.js';

export const O = 1, W = 34, D = 22;
const FS = () => G.fishmarket, pick = a => a[Math.floor(Math.random() * a.length)], inH = (h, r) => h >= r[0] && h < r[1];
export const setP = (o, q) => { if (!o) return; for (const k in q) if (JSON.stringify(o.p[k]) !== JSON.stringify(q[k])) { o.p = Object.assign({}, o.p, q); o._key = null; return; } };
export const only = fn => (fx, scene) => (scene.def && scene.def.showpiece === 'fishmarket' ? fn(fx, scene) : null);
/** which light is outside: dawn | day | grey | dusk | night */
export const viewNow = () => { const a = ambient(G.state.t, 'clear'), h = G.now().hf, wx = G.state.weather; if (a.dark >= .8) return 'night'; if (a.dark > .02 || a.amb !== '#ffffff') return h < 12 ? 'dawn' : 'dusk'; if (h < 7.4) return 'dawn'; return /rain|storm|fog|snow|cloud/.test(String(wx)) ? 'grey' : 'day'; };

const items = [], spots = [];
const H = (id, x, y, p, o) => { const it = Object.assign({ id: id.includes('.') ? id : 'furn.fish.' + id, x, y, p: p || {} }, o); items.push(it); return it; };
const Wl = (id, wall, at, p, o) => { const it = Object.assign({ id: id.includes('.') ? id : 'furn.fish.' + id, wall, at, p: p || {} }, o); items.push(it); return it; };
const S = (x, y, dir, o) => spots.push(Object.assign({ x, y, dir }, o));
const LINES = {
  shopper: ['I came for two fillets. I am leaving with a crab and a philosophy.', 'They THROW it. An actual salmon. Over your head.', 'The chowder man will not tell me what is in it.', 'Cheaper than FreshWay if you watch the board by the door.', 'Mind the floor, they hose it every hour.', 'The lobsters keep looking at me.', 'My grandmother bought her Friday fish at that very stall.', 'I only wanted to see the tuna. It is bigger than my sofa.', 'Smell that? That is the smokery. I could live in that smell.', 'Somebody said the lighthouse keeper buys his kippers here.'],
  chef: ['Six bass, firm ones, and whatever Kenji cut at five.', 'If the eyes are cloudy I walk. Basia knows.', 'The Gilded Gull takes the first box. Always has.', 'Dinner service starts here, at six in the morning.', 'Do not tell my sous-chef I paid that for mussels.'],
  buyer: ['Clock starts high. Wait. Wait. ...Not that long.', 'Lot four is the one. Do not bid on lot four.', 'Marlowe always blinks first.', 'Thirty years and my hand still goes up by itself.', 'It is all in the wrist. And the nerve.'],
  tourist: ['Is it always this... wet?', 'We saw them throw one! Dad nearly caught it with his face.', 'Take my picture with the swordfish.', 'I have never seen an urchin. I am not sure I have now.'],
};
// stalls: [stall id, x, y, flipped]
const PLACE = [['whole', 14.8, .9], ['tuna', 20.4, .9], ['shell', 26, .9], ['squid', 14.8, 7.6], ['oyster', 19.4, 7.6], ['smoke', 25.5, 7.6], ['sushi', 14.8, 13.4], ['salt', 19.4, 13.4], ['knife', 23.9, 13.4], ['tackle', 28.4, 13.4], ['chips', 1.3, 10.4, 1], ['chowder', 1.3, 15.2, 1]];
function build() {
  // walls: the quay side (back wall along x) and the brick gable (back wall along y)
  Wl('quaydoor', 'y', 1, { n: 1, boat: 1, time: 'dawn', name: BOATS[0].name, c: BOATS[0].c }, { quay: 0 }); Wl('quaydoor', 'y', 7.2, { n: 2, boat: 1, time: 'dawn', name: BOATS[1].name, c: BOATS[1].c }, { quay: 1 });
  Wl('glasswall', 'y', 12.6, { w: 6, time: 'day', seed: 1 }, { glass: 1 }); Wl('glasswall', 'y', 18.6, { w: 6, time: 'day', seed: 2 }, { glass: 1 }); Wl('glasswall', 'y', 24.6, { w: 6, time: 'day', seed: 3 }, { glass: 1 }); Wl('glasswall', 'y', 30.6, { w: 3.4, time: 'day', seed: 4 }, { glass: 1 });
  Wl('stampboard', 'x', 1, {}, { stamps: 1 }); Wl('banner', 'x', .5, {}); Wl('furn.lobby.restroom', 'x', 7.6, { c: '#5a4030', dc: '#2f6f9f' }); Wl('furn.lobby.restroom', 'x', 8.8, { c: '#5a4030', dc: '#c8402e' }); Wl('hose', 'x', 20.4, {}); Wl('buoys', 'x', 10.4, { w: 9 });
  // the auction floor
  H('block', 4, 1.3, { k: 0 }, { block: 1 }); for (let i = 0; i < 6; i++) H('lot', 2.6 + (i % 3) * 1.7, 4.4 + Math.floor(i / 3) * 1.5, { n: i + 1, sp: ['cod', 'cod'] }, { lot: i });
  H('cart', .8, 1.2, { n: 3 }, { flip: true }); H('cart', 12.9, 4.6, { n: 2, sp: 'herring' }, { catCart: 1 }); H('icemachine', 12.7, .3, {}, { ice: 1 }); H('scale', 9.4, 3.4, { kg: 0 }, { scale: 1 }); H('bins', 10.6, 6.6, {});
  // stalls
  for (const [id, x, y, flip] of PLACE) { const st = STALL_BY_ID[id]; H('stall', x, y, { kind: st.kind, w: STALL_W[st.kind] || 4, name: STALL_NAMES[st.kind], c: STALL_COLS[st.kind], sp: st.sp.length ? st.sp.slice(0, 4) : undefined, seed: id.length + x, lines: [], kg: 0 }, { stall: id, flip: !!flip }); }
  H('tank', 30.2, 7.5, { w: 3.4 }, { tank: 1 }); H('tankglass', 30.2, 8.56, { w: 3.4 });
  // food court + the door end
  for (const [x, y] of [[5, 10.6], [8.8, 10.6], [5, 14], [8.8, 14], [5, 17.4], [8.8, 17.4]]) H('table', x, y, {});
  H('shuck', 20.6, 18.6, {}, { shuck: 1 }); H('fillet', 25.4, 18.7, {}, { fillet: 1 }); H('recipes', 29.4, 19.2, {}); H('catchboard', 12.9, 18.9, { lines: [] }, { board: 1 }); H('sample', 13.4, 2.9, {}, { sample: 'salmon' }); H('sample', 24.2, 11.3, { c: '#f8e8d8' }, { sample: 'kipper' }); H('sample', 12, 12.2, { c: '#e8b050' }, { sample: 'chowder' });
  H('column', 12.7, 8.6, {}); H('column', 12.7, 15.6, {}); H('column', 30.6, 11.2, {}); H('bins', 31.8, 18.6, {}); H('cart', 32.6, 5.2, { n: 1, sp: 'crab' });
  // people: buyers and chefs at dawn, shoppers and tourists later (from / to = hours)
  for (const [x, y, d] of [[2, 7.9, 3], [3.3, 8.1, 3], [4.7, 7.8, 3], [6.2, 8.2, 3], [7.4, 7.6, 3], [8.3, 5.4, 2], [8.5, 6.6, 2], [1.4, 5.6, 0]]) S(x, y, d, { from: 5.3, to: 7.7, p: .9, label: 'Buyer', lines: LINES.buyer, buyer: 1 });
  for (const [x, y] of [[16.6, 3], [22.4, 3.1], [27.6, 3], [21.2, 9.8]]) S(x, y, 3, { from: 5.8, to: 10, p: .85, chef: 1, label: 'Chef', lines: LINES.chef });
  for (const [x, y, p] of [[18.4, 3.1, .7], [24.6, 3, .6], [16.2, 9.7, .7], [23, 9.8, .7], [27.4, 9.7, .6], [16.4, 15.6, .6], [21, 15.5, .6], [25.6, 15.6, .5], [30.4, 15.5, .6], [31.6, 9.9, .8]]) S(x, y, 3, { from: 7.5, to: 19, p });
  for (const [x, y, d] of [[3.6, 12.4, 2], [3.6, 17.2, 2], [22, 20.4, 3], [26.4, 20.3, 3]]) S(x, y, d, { from: 10, to: 19, p: .7, lines: LINES.tourist, label: 'Visitor' });
}
build();
const N = { door: [17.5, 20.6], a: [17.5, 17], b: [13.6, 11.6], c: [13.6, 5.2], d: [20, 5], e: [29, 5], f: [33, 5.4], g: [33, 11.4], h: [24, 11.4], i: [16, 11.4], j: [20, 16.6], k: [30, 16.8], l: [10.5, 9.4], m: [7.2, 12.6], n: [7.2, 19.6], q: [9, 8.6] };
const ROUTES = [['door', 'a', 'j', 'k*', 'g', 'f', 'e*', 'd*', 'c', 'b', 'a', 'door'], ['door', 'a', 'b', 'i*', 'h*', 'g', 'k', 'j', 'a', 'door'], ['door', 'a', 'b', 'c', 'd*', 'e', 'f', 'g*', 'h', 'i', 'b', 'a', 'door'], ['door', 'a', 'b', 'l', 'm*', 'n', 'a', 'door'], ['door', 'n', 'm', 'l', 'q*', 'c', 'd', 'e*', 'f', 'g', 'h', 'i*', 'b', 'a', 'door']];

/* ---------------- people ---------------- */
let POOL = null;
function people() {
  if (POOL) return POOL; const A = charArt(), r = R.rng(5521), base = o => { const s = Object.assign({}, A.randomSpec(r, Object.assign({ season: 1, age: 'adult' }, o))); s.outfit = null; s.bag = null; s.scarf = null; return s; };
  const monger = (i) => Object.assign(base({}), { top: 'long', topColor: ['#f4f0e8', '#7fa0c8', '#f4f0e8', '#9aa0a8'][i % 4], bottom: 'overalls', bottomColor: ['#e8a23a', '#f2c230', '#3a6a8a', '#e87a3a'][i % 4], hat: [null, 'beanie', 'flatcap', 'cap'][i % 4], hatColor: ['#2f6f9f', '#c8402e', '#4a4a58', '#2f8a6a'][i % 4], shoes: '#2f5a4a' });
  POOL = { monger: Array.from({ length: 14 }, (_, i) => monger(i)), chef: Array.from({ length: 4 }, () => Object.assign(base({}), { outfit: 'chef' })), cook: Array.from({ length: 3 }, () => Object.assign(base({}), { outfit: 'cook' })), dock: Array.from({ length: 3 }, () => Object.assign(base({}), { outfit: 'dockworker' })),
    auct: Object.assign(base({ age: 'elder' }), { top: 'coat', topColor: '#f4f0e8', bottom: 'slacks', bottomColor: '#2a2733', hat: 'flatcap', hatColor: '#4a4a58', shoes: '#2f2c3a' }) };
  return POOL;
}
const animal = (kind, variant, x, y) => { const e = { isAnimal: true, kind, variant, x, y, z: 0, t: Math.random() * 9, anim: 'stand', dir: 1, bb: [-.15, -.15, .15, .15, .4], hidden: false,
  sprite() { const A = MODULES['./chars/animals.js']; if (!A || !A.drawAnimal) return null; const n = this.anim === 'walk' && this.kind === 'cat' ? 4 : 2, f = Math.floor(this.t * (this.anim === 'walk' ? 7 : this.anim === 'fly' ? 9 : 1.1)) % n, k = this.kind, a = this.anim, d = this.dir, v = this.variant; return pixSprite('fm' + k + v + a + f + d, A.ANIMAL_SB, () => A.drawAnimal(k, { anim: a, frame: f, dir: d, variant: v })); },
  to(tx, ty, sp, dt) { const dx = tx - this.x, dy = ty - this.y, d = Math.hypot(dx, dy); if (d < .08) return true; const s = Math.min(d, sp * dt); this.x += dx / d * s; this.y += dy / d * s; this.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 0 : 2) : (dy > 0 ? 1 : 3); return false; } }; return e; };
const rot = m => { const w = m.reduce((a, r) => Math.max(a, r.length), 0), out = []; for (let i = 0; i < w; i++) { let s = ''; for (let j = m.length - 1; j >= 0; j--) s += m[j][i] || '.'; out.push(s); } return out; };
const SAL = SPECIES.salmon, SALV = rot(SAL.map);

defineRoom({ id: FM.room, name: NAME, w: W, d: D, zoom: 0, music: 'quiet', noCrowd: true, showpiece: 'fishmarket', venue: FM.place, floor: GT.f_concrete, bg: '#141a22', edge: '#2c3a40',
  wall: { color: '#a85a44', pattern: 'brick', trim: '#3f5a5c', h: 5.2 },
  exits: [{ x: 17.5, y: 21.4, label: 'Exit to the boardwalk', poi: 'door:fishmarket' }], spawn: { x: 17.5, y: 20.4, dir: 3 }, items, npcSpots: spots,
  setup(sc) {
    const Wd = sc.world, objs = Wd.objs, by = k => objs.filter(o => o.data && o.data[k] !== undefined), P = people();
    const stalls = {}; for (const o of by('stall')) stalls[o.data.stall] = o; const lots = by('lot').sort((a, b) => a.data.lot - b.data.lot), block = by('block')[0], quays = by('quay'), glass = by('glass'), iceM = by('ice')[0], board = by('board')[0], stampB = by('stamps')[0], scaleO = by('scale')[0], catCart = by('catCart')[0];
    // ---- floor: wet concrete, expansion joints, puddles that hold the lamps, the quay line, the auction box, the catching mark
    const LAMPS = [[13.95, 9], [13.1, 9.85], [13.95, 16], [13.1, 16.85], [31.85, 11.6], [31, 12.45], [17.3, 2.9], [22.9, 2.9], [28.2, 2.9], [17, 9.6], [22.2, 9.6], [27.7, 9.6], [17, 15.4], [21.4, 15.4], [26, 15.4], [31, 15.4], [5.6, 3.6]];
    Wd.decal({ x0: O, y0: O, x1: O + W, y1: O + D, draw(Rr) { Rr.qz(O, O + W, O, O + D, 0, (x, y) => { const X = x - O, Y = y - O, k = R.hash2(Math.floor(X * 16), Math.floor(Y * 16), 5), blob = R.hash2(Math.floor(X / 2.3), Math.floor(Y / 1.9), 9), fx = X / 2.3 - Math.floor(X / 2.3) - .5, fy = Y / 1.9 - Math.floor(Y / 1.9) - .5, wet = blob > .45 && fx * fx + fy * fy * 1.4 < (.06 + blob * .1) * (.7 + .6 * R.hash2(Math.floor(X * 3), Math.floor(Y * 3), 2));
      if (Y > 2.55 && Y < 2.7 && X > .6 && X < 12.4) return (Math.floor(X * 4) & 1) ? '#e8b83a' : '#2a2733';
      if (X > 1.9 && X < 8.2 && Y > 3.9 && Y < 7.5 && (X < 2 || X > 8.1 || Y < 4 || Y > 7.4)) return '#e8eef0';
      { const dx = X - 18.7, dy = Y - 3.3, e = dx * dx / .5 + dy * dy / .16; if (e < 1 && e > .72) return '#f2c230'; if (dx > .6 && dx < 1 && Math.abs(dy) < (dx - .5) * .9) return '#f2c230'; }
      for (const [dx, dy] of [[6, 9.3], [20, 5.2], [20, 11.6], [27, 17], [9, 20]]) if (Math.abs(X - dx) < .3 && Math.abs(Y - dy) < .3) return (Math.floor(X * 8) & 1) ? '#3a4448' : '#5a686c';
      if (X > 12.4 && X < 14.6 && Y > 1.4 && Y < 3.2 && k > .9) return '#f4fbfd';
      for (const L of LAMPS) { const sx = (X - Y) - (L[0] - L[1]), sy = (X + Y) - (L[0] + L[1]); if (Math.abs(sx) < .16 && sy > .1 && sy < 2.6 && (wet || k > .55) && k > sy * .3) return wet ? '#e8dcae' : '#b8b89c'; }
      if (wet) return k > .93 ? '#e8f4f8' : k > .5 ? '#a8bcc2' : '#9eb2b8';
      if (X % 3 < .06 || Y % 3 < .06) return '#7c8a8c'; return k > .94 ? '#a2aeb0' : k < .07 ? '#869496' : '#929fa1'; }); } }); Wd.version++;
    for (const L of LAMPS) Wd.lights.push({ x: O + L[0], y: O + L[1], z: 0, r: 4, c: '#ffe9b0' }); Wd.lights.push({ x: O + 5.6, y: O + 6, z: 0, r: 6, c: '#ffe9b0' }, { x: O + 7, y: O + 14.5, z: 0, r: 7, c: '#ffe2a0' }, { x: O + 23, y: O + 20, z: 0, r: 6, c: '#ffe9b0' });
    sc.env = t => { const o = ambient(t, G.state.weather); return { amb: o.amb === '#ffffff' ? o.amb : R.mix(o.amb, '#ffffff', .45), dark: Math.min(.6, (o.dark || 0) * .62), bg: Wd.bg, night: o.night }; };
    // ---- the mongers (one behind every stall), Dusty the thrower, the auctioneer, dock hands
    const mk = (spec, x, y, dir, label, use) => { const c = new Char(spec, x, y); c.dir = dir; c.kind = 'staff'; c.label = label; c.speed = 1.6; sc.ents.push(c); if (use) sc.interactables.push({ ent: c, x: c.x, y: c.y, label, h: 1.3, hit: 8, range: 2.3, visible: () => !c.hidden, use: () => { c._hold = 4; use(c); } }); return c; };
    const mongers = {}; sc.fixtures.filter(f => f.item.stall).forEach((f, i) => { const st = STALL_BY_ID[f.item.stall], s = f.staff || { x: f.x, y: f.y - 1, dir: 1 }, spec = /chowder|chips/.test(st.kind) ? P.cook[i % 3] : st.kind === 'sushi' ? P.chef[0] : P.monger[i % P.monger.length]; mongers[st.id] = mk(spec, s.x, s.y, s.dir === undefined ? 1 : s.dir, st.keeper + ' · ' + st.name, c => FS() && FS().talk(st.id, c)); mongers[st.id].home = { x: s.x, y: s.y, dir: s.dir === undefined ? 1 : s.dir }; });
    const dusty = mk(P.monger[13], O + 17.9, O + 6.3, 3, 'Dusty, who throws the fish', c => FS() && FS().talkDusty(c));
    const auct = mk(P.auct, O + 4.9, O + 1.9, 1, 'Mr. Pettibone, auctioneer', c => FS() && FS().talkAuctioneer(c)); auct.z = .45;
    const fx = k => sc.fixtures.find(f => f.item[k] !== undefined), sf = k => { const f = fx(k), s = f && f.staff; return s || { x: O + 20, y: O + 18, dir: 1 }; };
    const marg = mk(P.monger[4], sf('shuck').x, sf('shuck').y, 1, 'Oyster Derby steward', c => FS() && FS().shuck()), fil = mk(P.monger[7], sf('fillet').x, sf('fillet').y, 1, 'Rosa, filleting teacher', c => FS() && FS().fillet());
    const DOCK = [[3.4, 1.5], [3.4, 3.3], [1.5, 3.6], [1.5, 6.2], [1.5, 3.6], [3.4, 3.3]], DOCK2 = [[9.7, 1.5], [9.7, 3.2], [8.9, 5.9], [9.7, 3.2]];
    const dockers = [DOCK, DOCK2].map((pts, i) => { const c = mk(P.dock[i], O + pts[0][0], O + pts[0][1], 1, 'Dock hand', () => bubble(c, pick(['Mind your toes, crates coming through!', 'MARGO was first in. She always is.', 'Twelve boxes of cod, and my back knows it.']), 3200)); c.pts = pts; c.i = 1; c.wait = i * 2; return c; });
    // ---- customers
    const cr = crowd(sc, sc.def.npcSpots, { seed: 31, fill: 1, lines: LINES.shopper }); for (const c of cr.list) if (c.spot.chef) c.setSpec(P.chef[Math.floor(c.roll * 4)]);
    const lane = () => { const r = pick(ROUTES), pts = r.map(k => { const st = k.endsWith('*'), n = N[k.replace('*', '')]; return Object.assign({ x: n[0] + O + (Math.random() - .5) * .7, y: n[1] + O + (Math.random() - .5) * .5 }, st ? { wait: 6 + Math.random() * 9, pose: Math.random() < .25 ? 'phone' : null, dir: 3 } : null); }); return { pts, kind: Math.random() < .5 ? 'bag' : 'stroll' }; };
    const wk = walkers(sc, { n: 14, route: lane, lines: LINES.shopper, label: 'Shopper' });
    // ---- lobsters in the tank
    const TB = { x0: O + 30.45, x1: O + 33.35, y0: O + 7.75, y1: O + 8.4 };
    const lobsters = Array.from({ length: 5 }, (_, i) => { const e = { x: TB.x0 + Math.random() * (TB.x1 - TB.x0), y: TB.y0 + Math.random() * (TB.y1 - TB.y0), z: .74, tx: 0, ty: 0, wait: Math.random() * 4, t: Math.random() * 5, fl: i % 2 === 0, bb: [-.2, -.05, .2, .05, .2], sprite() { const f = this.wait > 0 ? 0 : Math.floor(this.t * 5) & 1, fl = this.fl; return pixSprite('fmlob' + (fl ? 1 : 0) + f, [-11, -6, 11, 6], () => { fishAt('lobster', 0, 0, 0, { flip: fl }); if (f) { const s = R.PW(0, 0, 0); R.px(s[0] - 2, s[1] + 4, R.C('#2a4250')); R.px(s[0] + 3, s[1] - 4, R.C('#2a4250')); } }); } }; e.tx = e.x; e.ty = e.y; sc.ents.push(e); return e; });
    // ---- the flying salmon
    const fish = { x: 0, y: 0, z: 0, hidden: true, k: 0, bb: [-.1, -.1, .1, .1, .3], sprite() { const f = Math.floor(this.k * 9) % 4; return pixSprite('fmfly2' + f, [-20, -20, 20, 20], () => { const s = R.PW(0, 0, 0), m = f % 2 ? SALV : SAL.map, w = m.reduce((a, r) => Math.max(a, r.length), 0), h = m.length; stamp(m, SAL.pal, Math.round(s[0]) - w, Math.round(s[1]) - h, { flip: f >= 2, k: 2, ol: '#2a2733' }); }); } }; sc.ents.push(fish);
    let fly = null;
    function throwFish(toPlayer) {
      if (fly) return fly; const a = { x: dusty.x, y: dusty.y - .2, z: 1.2 }, m = mongers.whole, b = toPlayer ? { x: G.player.x, y: G.player.y, z: 1.15 } : { x: m.x, y: m.y + .2, z: 1.2 }; dusty.pose = 'cheer'; dusty._hold = 1.6; dusty.dir = 3; bubble(dusty, toPlayer ? 'Hands up! Here she comes!' : pick(['Heads up! Salmon coming over!', 'One bay salmon, FLYING!', 'Low bridge! Mind your hats!']), 2200);
      if (!toPlayer) { m.dir = 1; m._hold = 2.4; } try { G.audio && G.audio.sfx && G.audio.sfx('whoosh'); } catch (e) { }
      let res; const landed = new Promise(r => { res = r; }); fly = { t: -.5, dur: 1.5, a, b, toPlayer, res, landed, p: () => Math.max(0, Math.min(1, fly ? fly.t / fly.dur : 1)) }; return fly;
    }
    // ---- animals: Biscuit the harbor cat, three gulls at the quay doors
    const cat = animal('cat', 2, O + 27.2, O + 10); cat.st = 0; cat.wait = 14; cat.anim = 'sit'; sc.ents.push(cat);
    sc.interactables.push({ ent: cat, x: cat.x, y: cat.y, label: 'Biscuit, the harbor cat', h: .5, hit: 9, range: 1.6, use: () => FS() && FS().pet(cat) });
    const gulls = [[2.2, 3.2], [6, 3], [10.4, 3.2]].map(([x, y]) => { const g = animal('seagull', 0, O + x, O + y); g.home = { x: O + x, y: O + y }; g.wait = 2 + Math.random() * 6; g.tx = g.x; g.ty = g.y; sc.ents.push(g); return g; });
    sc.interactables.push({ x: O + 18.7, y: O + 3.3, label: 'The catching spot', h: .3, hit: 12, range: 1, use: () => FS() && FS().askThrow() });
    // ---- state sync
    let iceT = 9, pourT = 0, weighT = 0, weighOb = null, throwSlot = -1, chantT = 3, sparkT = 0, lastKey = '';
    function sync() {
      const n = G.now(), h = n.hf, view = viewNow(), open = inH(h, HOURS.hall), auction = inH(h, HOURS.auction), retail = inH(h, HOURS.retail), FSm = FS(), c = FSm ? FSm.catch() : null, fest = FSm && FSm.festival();
      for (const o of glass) setP(o, { time: view }); const boats = c ? c.boats : 2, tide = h >= 4.8 && h < 9.5;
      quays.forEach((o, i) => setP(o, { time: view, boat: tide && boats > i ? 1 : 0, crates: Math.max(0, Math.round(5 * (1 - Math.max(0, h - 5.3) / 2.6))), name: BOATS[i].name, c: BOATS[i].c }));
      // lots: today's crates while the auction runs (sold ones carry a red flag, then leave)
      const L = FSm ? FSm.lots() : []; lots.forEach((o, i) => { const l = L[i], on = !!l && h >= 5 && h < 8 && !(l.sold && l.soldT !== undefined && G.state.t - l.soldT > 25); o.hidden = !on; if (l) setP(o, { n: l.n, sp: l.sp, sold: l.sold ? 1 : 0 }); });
      const slot = (h - HOURS.auction[0]) / (HOURS.auction[1] - HOURS.auction[0]) * 6, fr = slot - Math.floor(slot); setP(block, { on: auction ? 1 : 0, k: auction ? Math.round((1 - fr) * 20) / 20 : 0 });
      auct.hidden = !(h >= 5.2 && h < 7.8); for (const d of dockers) d.hidden = !(tide && boats > 0 && h < 8.2);
      // stalls: chalk prices follow the catch, closed stalls go dark
      for (const st of STALLS) { const o = stalls[st.id], m = mongers[st.id], on = open && (/chowder|sushi|chips/.test(st.kind) ? inH(h, HOURS.food) || fest : h >= 7 || /whole|tuna|shell/.test(st.kind)); if (m) m.hidden = !on; if (o && FSm && o !== weighOb) setP(o, { lines: on ? FSm.stallLines(st.id) : ['CLOSED'], pennant: st.id === 'smoke' && FSm.pennant() ? FSm.pennant() : null }); }
      dusty.hidden = !retail; marg.hidden = fil.hidden = !retail; if (board && c) setP(board, { lines: c.lines }); if (stampB && FSm) setP(stampB, { got: FSm.stampsGot() });
      for (const p of cr.list) { const s = p.spot; p.hidden = !open || !inH(h, [s.from, s.to]) || p.roll > (s.p === undefined ? .7 : s.p) * (fest ? 1.3 : 1); }
      wk.setActive(!open ? 0 : h < 7.5 ? 3 : fest ? 14 : h < 9 || h > 17.5 ? 7 : 11, true); cat.hidden = !open; for (const g of gulls) g.hidden = !open || view === 'night';
    }
    sc.fm = { sync, crowd: cr, walkers: wk, cat, gulls, lobsters, dockers, auctioneer: auct, dusty, stallOb: id => stalls[id], monger: id => mongers[id], throwFish, count: () => cr.count() + wk.count(),
      weigh(stallId, itemId, kg, sp) { const o = stalls[stallId]; if (!o) return; if (weighOb && weighOb !== o) setP(weighOb, { kg: 0, pan: null }); weighOb = o; weighT = 4.5; setP(o, { kg: Math.min(1, kg / 1.5), pan: sp || null }); if (scaleO) setP(scaleO, { kg: Math.min(1, kg / 6) }); },
      sold(n, who) { const b = cr.list.filter(c => c.spot.buyer && !c.hidden); if (who !== 'you' && b.length) { const c = pick(b); c.pose = 'wave'; c._hold = 1.8; } bubble(auct, who === 'you' ? `SOLD! Lot ${n}, to the newcomer by the rail!` : `SOLD! Lot ${n} to ${who}!`, 2600); auct.pose = 'cheer'; auct._hold = 1.2; },
      spark(on) { sparkT = on ? 3 : 0; }, pour() { pourT = 2.6; } };
    sync();
    sc.update = (dt) => {
      const h = G.now().hf, key = Math.floor(G.state.t / 3) + '|' + G.state.weather; if (key !== lastKey) { lastKey = key; sync(); }
      cr.update(dt); wk.update(dt);
      for (const k in mongers) { const m = mongers[k]; if (m.hidden) continue; m.t += dt; if (m._hold > 0) { m._hold -= dt; if (m._hold <= 0) { m.pose = null; m.dir = m.home.dir; } } else if (Math.random() < dt * .08) { m.pose = pick([null, 'work', 'work', 'talk', null]); } }
      for (const c of [dusty, auct, marg, fil]) { if (c.hidden) continue; c.t += dt; if (c._hold > 0) { c._hold -= dt; if (c._hold <= 0) c.pose = null; } else if (c !== auct && Math.random() < dt * .1) c.pose = pick([null, 'work', null]); }
      // the auctioneer's chant
      if (!auct.hidden && inH(h, HOURS.auction) && (chantT -= dt) <= 0 && !G.modal) { chantT = 5 + Math.random() * 4; const L = FS() ? FS().lots() : [], l = L.find(q => !q.sold); if (l) { auct.pose = 'talk'; auct._hold = 2; bubble(auct, pick([`Lot ${l.n}, off the ${l.boat}! Who will stop the clock?`, `${l.start}... ${l.start - 1}... ${l.start - 2}... a hand, anyone, a hand!`, `Fresh as the morning, lot ${l.n}! She is falling, she is falling!`]), 3000); } }
      // dock hands carry boxes from the boats to the lots
      for (const d of dockers) { if (d.hidden) continue; d.t += dt; if (d.wait > 0) { d.wait -= dt; d.moving = false; continue; } const q = d.pts[d.i], tx = O + q[0], ty = O + q[1], dx = tx - d.x, dy = ty - d.y, dd = Math.hypot(dx, dy), s = 1.5 * dt; if (dd <= s) { d.x = tx; d.y = ty; d.i = (d.i + 1) % d.pts.length; const half = Math.floor(d.pts.length / 2); if (d.i === 1 || d.i === half + 1) { d.wait = 1.6; d.carry = d.i === 1; d.poseOpts = d.carry ? { item: 'box' } : null; } } else { d.x += dx / dd * s; d.y += dy / dd * s; d.face(dx, dy); d.moving = true; } }
      // lobsters amble about the tank
      for (const e of lobsters) { e.t += dt; if (e.wait > 0) { e.wait -= dt; continue; } const dx = e.tx - e.x, dy = e.ty - e.y, dd = Math.hypot(dx, dy); if (dd < .04) { e.tx = TB.x0 + Math.random() * (TB.x1 - TB.x0); e.ty = TB.y0 + Math.random() * (TB.y1 - TB.y0); e.wait = 1 + Math.random() * 5; e.fl = e.tx > e.x; } else { e.x += dx / dd * .22 * dt; e.y += dy / dd * .22 * dt; } }
      // the ice machine, the scales, the grinder
      if (pourT > 0) { pourT -= dt; setP(iceM, { pour: pourT > 0 ? 1 + (Math.floor(pourT * 8) % 3) : 0 }); } else if ((iceT -= dt) <= 0 && inH(h, HOURS.hall)) { iceT = 16 + Math.random() * 14; pourT = 2.6; try { G.audio && G.audio.sfx && Math.hypot(G.player.x - iceM.x, G.player.y - iceM.y) < 9 && G.audio.sfx('clank'); } catch (e) { } }
      if (weighT > 0 && (weighT -= dt) <= 0 && weighOb) { setP(weighOb, { kg: 0, pan: null }); if (scaleO) setP(scaleO, { kg: 0 }); weighOb = null; sync(); }
      if (sparkT > 0) { sparkT -= dt; setP(stalls.knife, { spark: sparkT > 0 ? 1 + (Math.floor(sparkT * 10) % 3) : 0 }); }
      // the fish throw: on the clock during shop hours, or on request
      const slot = Math.floor(G.state.t / HOURS.throwEvery); if (slot !== throwSlot) { const first = throwSlot < 0; throwSlot = slot; if (!first && !fly && !dusty.hidden && !mongers.whole.hidden && !G.modal) throwFish(false); }
      if (fly) { fly.t += dt; const k = fly.t / fly.dur; if (k >= 0) { fish.hidden = false; fish.k = k; fish.x = fly.a.x + (fly.b.x - fly.a.x) * k; fish.y = fly.a.y + (fly.b.y - fly.a.y) * k; fish.z = fly.a.z + (fly.b.z - fly.a.z) * k + Math.sin(Math.PI * Math.min(1, k)) * 2.3; }
        if (k >= 1) { fish.hidden = true; const f = fly; fly = null; if (!f.toPlayer) { const m = mongers.whole; m.pose = 'cheer'; m._hold = 1.2; if (Math.random() < .5) bubble(m, pick(['Got her!', 'Every time.', 'Still warm from the sea!']), 1800); } f.res(true); } }
      // Biscuit: naps by the smokery, raids the herring cart, bolts
      if (!cat.hidden) { cat.t += dt; if (cat.st === 0) { cat.anim = 'sit'; if ((cat.wait -= dt) <= 0) cat.st = 1; } else if (cat.st === 1) { cat.anim = 'walk'; if (cat.to(O + 13.4, O + 6.2, 1.5, dt)) { cat.st = 2; cat.wait = 2.4; cat.anim = 'stand'; } } else if (cat.st === 2) { if ((cat.wait -= dt) <= 0) { cat.st = 3; const m = mongers.whole; if (m && !m.hidden && !G.modal) bubble(m, pick(['BISCUIT! That is the third herring today!', 'Oi! Cat! ...Fine. One. ONE.', 'She pays no rent, that cat.']), 2600); } } else if (cat.st === 3) { cat.anim = 'walk'; if (cat.to(O + 27.2, O + 10, 3.4, dt)) { cat.st = 0; cat.wait = 30 + Math.random() * 30; } } }
      for (const g of gulls) { if (g.hidden) continue; g.t += dt; if (g.wait > 0) { g.wait -= dt; g.anim = g.z > .05 ? 'fly' : 'stand'; if (g.z > 0) g.z = Math.max(0, g.z - dt * 1.5); continue; } g.anim = g.hop ? 'fly' : 'walk'; if (g.hop) g.z = Math.min(.9, g.z + dt * 2); if (g.to(g.tx, g.ty, g.hop ? 3 : .8, dt)) { g.wait = 1.5 + Math.random() * 5; g.hop = Math.random() < .3; g.tx = g.home.x + (Math.random() - .5) * 3; g.ty = g.home.y + Math.random() * 2.2; } }
    };
    const enter0 = sc.onEnter; sc.onEnter = (o, prev) => { enter0(o, prev); sync(); if (FS()) FS().arrived(sc, prev); };
  },
});

registerInfo(NAME, {
  blurb: 'The iron-and-glass fish market on the harbor boardwalk. The boats unload at its quay doors before dawn, the catch is sold by a falling clock at half past five, and by eight a dozen stalls are selling it off crushed ice: whole fish, a tuna the size of a sofa, crabs, oysters shucked to order, smoked kippers, chowder in a bread bowl. Twice an hour somebody throws a salmon.',
  signature: 'The dawn auction clock, and the fishmongers who throw a whole salmon across the aisle.',
  tryThis: ['Stop the auction clock at the right moment and win a crate (05:30 to 07:30)', 'Stand on the yellow fish painted on the floor and catch the thrown salmon', 'Read the catch board by the door: what the boats landed is cheaper and fresher', 'Race the clock at the Oyster Derby', 'Learn to fillet a salmon with Rosa', 'Taste the samples', 'Pick up the catch-of-the-day recipe card', 'Fill your Species of the Bay stamp book', 'Watch the lobsters', 'Say hello to Biscuit the cat'],
  activities: ['fm_auction', 'fm_catch', 'fm_shuck', 'fm_fillet', 'fm_sample', 'fm_recipe', 'fm_stamps'], kind: 'market',
});

export function init() {
  registerFixture('fish_stall', only(fx => ({ label: STALL_BY_ID[fx.item.stall].name, hit: 16, h: 1.4, shop: STALL_BY_ID[fx.item.stall].venue, use: () => FS() && FS().stall(fx.item.stall) })));
  registerFixture('fish_block', only(() => ({ label: 'The auction rostrum', hit: 16, h: 1.6, use: () => FS() && FS().bid() })));
  registerFixture('fish_lot', only(fx => ({ label: 'Auction lot', hit: 9, h: .6, visible: () => !fx.ob.hidden, use: () => FS() && FS().bid(fx.item.lot) })));
  registerFixture('fish_tank', only(() => ({ label: 'The lobster tank', hit: 16, h: 1.5, use: () => FS() && FS().tank() })));
  registerFixture('fish_ice', only((fx, sc) => ({ label: 'The ice machine', hit: 14, h: 2, use: () => FS() && FS().ice(sc) })));
  registerFixture('fish_board', only(() => ({ label: "Today's catch", hit: 14, h: 1.8, use: () => FS() && FS().board() })));
  registerFixture('fish_shuck', only(() => ({ label: 'The Oyster Derby', hit: 16, h: 1.2, use: () => FS() && FS().shuck() })));
  registerFixture('fish_fillet', only(() => ({ label: 'Learn to fillet', hit: 14, h: 1.2, use: () => FS() && FS().fillet() })));
  registerFixture('fish_sample', only(fx => ({ label: 'Taste a sample', hit: 9, h: 1.2, use: () => FS() && FS().sample(fx.item.sample) })));
  registerFixture('fish_recipes', only(() => ({ label: 'Recipe cards', hit: 12, h: 1.6, use: () => FS() && FS().recipe() })));
  registerFixture('fish_scale', only(() => ({ label: 'The platform scale', hit: 12, h: 1.6, use: () => FS() && FS().scale() })));
  registerFixture('fish_stamps', only(() => ({ label: 'Species of the Bay', hit: 16, h: 2, use: () => FS() && FS().stamps() })));
  registerFixture('fish_quay', only(fx => ({ label: 'The quay door', hit: 16, h: 2.4, use: () => FS() && FS().quay(fx.item.quay) })));
}
