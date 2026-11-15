// Maple Bay Aquarium — main room `aquarium` (40 x 24), entered by the city door `door:aquarium` on the harbor boardwalk. Other rooms: aquarium_deep.js ('aquarium:deep', 'aquarium:deck', 'aquarium:lab').
// Zones (room coords, (0,0) = back corner; def.zones / scene.aq.zoneAt(x, y)):
//   Bay Hall (free: the Big Blue cylinder tank with the diver, ticket desk, shows board, quiz stand, photo jaws, Finn the mascot)      Local Waters (x0-13.4, y0-15.4: kelp forest wall, harbor seal window, touch pool, sketch bench, the head aquarist, staff door)
//   Penguin Cove (x13.4-27.6, y0-7.2: six penguins, feeding show, adoption board)      Tropical Reef (x27.6-40, y0-12.4: reef wall, Ray Bay lagoon, seahorses, stairs down to the Deep)
//   Tide & Trinket gift shop (x0-13.4, y15.4-24; stairs up from the Deep)             The Galley cafe (x27.6-40, y12.4-24, beside the reef window; door to the Harbor Deck)
// The hall, shop and cafe are free; the exhibits need a ticket (G.aquarium.hasTicket()): without one you are turned back at the zone line.
// scene.aq = { tanks, big (cylinder: diver/wave/feed), penguins, rays, keeper, aquarist, mascot, show { penguin, rays, dive }, force(id, sec), sync(), zoneAt, routes, nodes, feedPoint }
// Fixture tags handled here (only inside aquarium rooms): aqua_plaque (item.sp), aqua_bench (item.sketch | item.kind), aqua_touchpool, aqua_lagoon, aqua_feeder, aqua_penguins, aqua_board (item.p.kind), aqua_quiz, aqua_photo (item.spot),
//   aqua_stairs (item.to), aqua_door, + item tags aqua_shop (item.venue), aqua_ticket, aqua_bigtank. Gameplay lives in sim/aquarium.js (G.aquarium).
import { G } from '../../core/game.js';
import { GT } from '../../engine/world.js';
import { Char } from '../../core/char.js';
import * as R from '../../engine/raster.js';
import { ambient } from '../../core/clock.js';
import { defineRoom, registerFixture } from '../interior.js';
import { toast, bubble } from '../../ui/kit.js';
import { crowd, walkers } from './_show_life.js';
import { specs } from './_airport_life.js';
import { registerInfo } from './unique_rooms.js';
import { wallTank, bigTank, Critter } from './aquarium_life.js';
import { AQ_VENUES, AQ_HOURS, SHOWS, SPECIES, LATE, SLEEPOVER, PENGUINS } from '../../data/aquarium.js';
import './aquarium_deep.js';

export const W = 40, D = 24, O = 1;
const pick = a => a[Math.floor(Math.random() * a.length)], AS = () => G.aquarium;
const items = [], spots = [];
const A = (id, x, y, p, o) => { const it = Object.assign({ id: 'furn.aqua.' + id, x, y, p: p || {} }, o); items.push(it); return it; };
const Wl = (id, wall, at, p, o) => { const it = Object.assign({ id: 'furn.aqua.' + id, wall, at, p: p || {} }, o); items.push(it); return it; };
const S = (x, y, dir, o) => spots.push(Object.assign({ x, y, dir }, o));

export const ZONES = [
  { id: 'local', name: 'Local Waters', x0: 0, y0: 0, x1: 13.4, y1: 15.4, ticket: 1 }, { id: 'cove', name: 'Penguin Cove', x0: 13.4, y0: 0, x1: 27.6, y1: 7.2, ticket: 1 }, { id: 'reef', name: 'Tropical Reef', x0: 27.6, y0: 0, x1: 40, y1: 12.4, ticket: 1 },
  { id: 'shop', name: 'Tide & Trinket', x0: 0, y0: 15.4, x1: 13.4, y1: 24 }, { id: 'cafe', name: 'The Galley', x0: 27.6, y0: 12.4, x1: 40, y1: 24 }, { id: 'hall', name: 'Bay Hall', x0: 13.4, y0: 7.2, x1: 27.6, y1: 24 },
];
export const LINES = {
  visitor: ['The shark went right over my head. I ducked. I actually ducked.', 'I could watch the jellyfish all day. I nearly have.', 'They say the octopus downstairs takes the filter apart when it is bored.', 'The sea otters hold paws when they sleep. I had to sit down.', 'Dive show at two. Wave and the diver waves back, you know.', 'My kid has touched the sea star four times and wants to go again.', 'Thursday evenings it is grown-ups only. Much quieter. Much bluer.', 'I adopted a penguin. Her name is Olive. We are very happy.'],
  kid: ['It LOOKED at me!', 'Can we touch the starfish again? Please please please.', 'I am going to be a diver. Or a penguin.', 'The big shark has a HUNDRED teeth.', 'That fish is the same colour as my lunchbox.', 'Why do the jellyfish change colour?'],
  toddler: ['Fish!', 'Fiiiiish.', 'Big one!', 'Again!', '*presses nose to the glass*'],
  desk: ['Welcome to the Maple Bay Aquarium! Day tickets, annual passes and today\'s shows, all here.', 'Dive show at two in the Big Blue, right behind you.', 'An annual pass pays for itself in six visits. And the jellies are different every time.'],
  shop: ['Finn the plush otter is our best seller. He comes with his own shell.', 'The jellyfish glows in the dark. Charge it on a windowsill.', 'Everything in here helps feed something downstairs.'],
  cafe: ['Chowder in a bread bowl. You eat the bowl. That is the whole idea.', 'Sit by the glass: the yellow tangs like to watch people eat.', 'Fish waffles are not made of fish. I get asked.'],
  touch: ['Two fingers, gently. They are tougher than they look, but they are not toys.', 'The anemone will feel sticky. It is deciding if you are food.', 'Wet your hand first. Dry hands feel like sandpaper to a sea star.'],
  rays: ['Flat hand, palm up, and let them come to you.', 'They feel like wet velvet. That is the mucus. You are welcome.', 'Feeding is at a quarter past twelve, but they will take a snack any time.'],
  keeper: ['Each bird has a wing band. The orange one is Pebble: she runs the place.', 'They bray like donkeys at dawn. The night guard has stopped jumping.', 'Feeding at half past eleven and half past three. Bring your loud voice.'],
  teacher: ['Hands off the glass, please! Noses too, Bartholomew.', 'Who remembers what the sea otter keeps in its pocket?', 'Stay together. If you are lost, stand by the big tank.'],
  mascot: ['*Finn does a little dance*', '*Finn offers a high five*', '*Finn points at the dive tank and mimes swimming*'],
};

/* ---------------- layout ---------------- */
export const BIG = { x: 20.5, y: 13.5, r: 2.6, h: 4 };
function build() {
  // ---- dividers (low, so nothing is hidden) and zone signs
  const low = { h: 1.1, c: '#dfe8ea', wave: 0 };
  A('partition', 13.2, 0, { w: 7.2, h: 1.1 }, { flip: true }); A('partition', 13.2, 7.2, { w: 1.8, h: 1.1 }, { flip: true }); A('partition', 13.2, 13, { w: 2.4, h: 1.1 }, { flip: true });
  A('partition', 0, 15.2, { w: 13.5, h: 2.4, wave: 1 }); A('partition', 13.2, 15.5, { w: 1.9, h: 1.1 }, { flip: true }); A('partition', 13.2, 21, { w: 3, h: 1.1 }, { flip: true });
  A('partition', 27.4, 0, { w: 4.4, h: 1.1 }, { flip: true }); A('partition', 27.4, 9.5, { w: 6.6, h: 1.1 }, { flip: true }); A('partition', 27.4, 20, { w: 4, h: 1.1 }, { flip: true });
  A('sign', 13.3, 9.2, { name: 'LOCAL WATERS', w: 3.6 }, { flip: true, z: 2.7 }); A('sign', 18.7, 7.1, { name: 'PENGUIN COVE', w: 3.6, c: '#2f6f78' }, { z: 2.9 }); A('sign', 27.5, 5.1, { name: 'TROPICAL REEF', w: 3.8, c: '#b8503a' }, { flip: true, z: 2.7 });
  A('sign', 13.3, 17.5, { name: 'GIFT SHOP', w: 3.2, c: '#b8503a' }, { flip: true, z: 2.7 }); A('sign', 27.5, 16.3, { name: 'THE GALLEY', w: 3.4, c: '#2f6f78' }, { flip: true, z: 2.7 });
  // ---- Bay Hall
  A('plinth', BIG.x - BIG.r, BIG.y - BIG.r, { r: BIG.r }, { tags: ['aqua_bigtank'] });
  A('desk', 22.8, 19.6, { kind: 'ticket', w: 4 }, { tags: ['aqua_ticket', 'info'] }); S(24.8, 19.15, 1, { kind: 'staff', label: 'Tickets & passes', lines: LINES.desk });
  A('board', 14.3, 21.9, { kind: 'shows' }); A('quiz', 14.2, 8.2); A('photospot', 24, 21.7, { k: 'jaws' }, { spot: 'jaws' });
  A('bench', 19.2, 16.7, {}, { kind: 'dive' }); A('bench', 21.7, 16.7, {}, { kind: 'dive' });
  A('board', 15.6, 14.2, { kind: 'plaque' }, { plaque: 1 });
  A('plant', 14, 23, { seed: 2 }); A('plant', 26.6, 23, { seed: 5 }); A('plant', 26.6, 7.6, { seed: 3 });
  S(17.3, 14.8, 0, { age: 'kid', label: 'Toddler', lines: LINES.toddler, p: .8 }); S(23.7, 12.4, 2, { age: 'kid', label: 'Toddler', lines: LINES.toddler, p: .6 }); S(17.6, 12, 0, { anim: 'phone', p: .5 }); S(23.6, 15, 2, { busy: 1 }); S(20.6, 18.4, 3, { busy: 1 }); S(18.4, 18.6, 3, { busy: 1, age: 'elder' });
  // ---- Local Waters
  A('touchpool', 3.5, 6, { w: 5, d: 3 }); S(9, 7.4, 2, { kind: 'staff', label: 'Touch pool guide', lines: LINES.touch });
  [['rockfish', 1.6], ['greenling', 4], ['perch', 6.6], ['garibaldi', 9], ['eel', 11.2]].forEach(([sp, x]) => A('plaque', x, 1, {}, { sp }));
  A('plaque', .3, 10, { c: '#17666f' }, { flip: true, sp: 'seal' }); A('plaque', 8.7, 9.3, { c: '#17666f' }, { sp: 'sunstar' });
  A('bench', 5, 3.5, { c: '#f0735a' }, { sketch: 1 }); A('bench', 2.2, 3.4, {}, { flip: true, kind: 'seal' }); A('board', 10.4, 12.6, { kind: 'sketch' }, { sketchboard: 1 });
  Wl('door', 'x', 11.3, { name: 'STAFF' }); A('plant', .4, 14.2, { seed: 4 }); A('plant', 12.2, .5, { seed: 1 });
  S(2.8, 2.1, 3, { age: 'kid', label: 'Toddler', lines: LINES.toddler, p: .7 }); S(7.6, 2.2, 3, { p: .6 }); S(1.3, 6.8, 2, { age: 'kid', label: 'Kid', lines: LINES.kid, p: .6 }); S(6, 9.6, 3, { age: 'kid', label: 'Kid', lines: LINES.kid, anim: 'work', p: .7 }); S(4.4, 9.6, 3, { busy: 1 }); S(8, 5.4, 1, { busy: 1, age: 'kid', lines: LINES.kid });
  // ---- Penguin Cove
  Wl('icewall', 'y', 13.9, { w: 13.6, h: 4.2 }); A('penguinrock', 14.2, 0, { w: 13 });
  A('bench', 16, 5.7, {}, { kind: 'penguin' }); A('bench', 21.6, 5.7, {}, { kind: 'penguin' }); A('plaque', 19.2, 4.75, {}, { sp: 'penguin' }); A('board', 24.6, 5.2, { kind: 'adopt' }, { adopt: 1 }); A('photospot', 14.5, 5.3, { k: 'penguin' }, { spot: 'penguin' });
  S(18.6, 5.2, 3, { age: 'kid', label: 'Toddler', lines: LINES.toddler, p: .8 }); S(23.6, 5.3, 3, { busy: 1 }); S(20.6, 5.2, 3, { busy: 1, age: 'kid', lines: LINES.kid });
  // ---- Tropical Reef
  A('lagoon', 29.5, 5, { w: 7, d: 4 }); A('feeder', 29.6, 9.3); S(37.3, 6.9, 2, { kind: 'staff', label: 'Ray Bay keeper', lines: LINES.rays });
  [['tang', 29.6], ['ytang', 32.2], ['butterfly', 34.8], ['clown', 37.2]].forEach(([sp, x]) => A('plaque', x, 1, { c: '#b8503a' }, { sp }));
  A('coltank', 38.3, 3.6, { k: 0 }, { anim: 1 }); A('plaque', 37.6, 5.2, { c: '#b8503a' }, { sp: 'seahorse' }); A('plaque', 33, 9.15, { c: '#b8503a' }, { sp: 'ray' });
  A('stairs', 37.6, 9.7, { name: 'THE DEEP' }, { to: 'deep' }); A('tankwall', 31.5, 11.6, { w: 7.5, h: 2.5 });
  S(31, 2.2, 3, { age: 'kid', label: 'Toddler', lines: LINES.toddler, p: .7 }); S(35.8, 2.3, 3, { p: .6, anim: 'phone' }); S(31.4, 9.6, 3, { busy: 1, age: 'kid', lines: LINES.kid }); S(35, 9.7, 3, { busy: 1 });
  // ---- The Galley
  A('desk', 28, 14.2, { kind: 'cafe', w: 3 }, { tags: ['aqua_shop'], venue: AQ_VENUES.cafe, label: 'The Galley: order' }); S(29.5, 13.75, 1, { kind: 'staff', outfit: 'cook', label: 'The Galley', lines: LINES.cafe });
  for (const [x, y] of [[32.6, 15.3], [35.8, 15.3], [32.6, 18], [35.8, 18], [30, 20.6], [33.6, 21], [29.4, 17.6]]) items.push({ id: 'furn.cafe.tableset', x, y, p: { c: '#2f6f78', cc: '#eef3f2' }, cafe: 1 });
  A('stairs', 37.5, 21.6, { name: 'DECK', up: 1 }, { to: 'deck' }); A('plant', 39, 13.6, { seed: 6 });
  S(34.4, 13.7, 3, { age: 'kid', label: 'Toddler', lines: LINES.toddler, p: .6 });
  // ---- Tide & Trinket
  A('shelf', 1, 15.6, { kind: 'plush', w: 3 }); A('shelf', 4.4, 15.6, { kind: 'mugs', w: 3 }); A('shelf', 7.8, 15.6, { kind: 'books', w: 3 }); A('plushbin', 7, 19.4); A('plushbin', 3.4, 18.4);
  A('desk', 2, 21, { kind: 'shop', w: 3 }, { tags: ['aqua_shop'], venue: AQ_VENUES.shop, label: 'Tide & Trinket: browse' }); S(3.5, 20.55, 1, { kind: 'staff', label: 'Tide & Trinket', lines: LINES.shop });
  A('stairs', 10.6, 21.6, { name: 'THE DEEP' }, { to: 'deep2' }); S(8.6, 17, 3, { p: .5 }); S(5.6, 17, 3, { busy: 1, age: 'kid', lines: LINES.kid });
}
build();

const N = { e0: [20.5, 23], e1: [20.5, 20.9], hw: [15.2, 18.2], hnw: [15.6, 9.6], hne: [25.6, 9.4], he: [25.4, 17.6], hs: [20.4, 18.6],
  l0: [12.6, 11], l1: [10.6, 10.6], l2: [10.6, 2.5], l3: [8.2, 2.5], l4: [3.6, 2.5], l5: [1.5, 2.8], l6: [1.5, 7.4], l7: [2.6, 10.6], l8: [6.4, 10.6],
  c1: [15.6, 7], c2: [19.6, 7.4], c3: [23.6, 7.2], r0: [28.7, 7], r1: [28.8, 2.6], r2: [33.2, 2.6], r3: [37, 2.8], r4: [37, 4.3], r5: [33, 4.3], r6: [28.8, 10.4], r7: [34.4, 10.4],
  k0: [26.2, 18], k1: [28.8, 18.2], k2: [30.6, 16.2], k3: [31.9, 13.8], k4: [34.6, 13.8], s0: [15, 19.4], s1: [12, 19.4], s2: [9.4, 17.1], s3: [3.2, 17], s4: [5.4, 22.2] };
const ROUTES = [
  ['e0', 'e1', 'hs*', 'hw', 'hnw', 'l0', 'l1', 'l2*', 'l3*', 'l4*', 'l5', 'l6*', 'l7', 'l8*', 'l1', 'l0', 'hnw', 'c1*', 'c2*', 'c3*', 'hne', 'he', 'e1', 'e0'],
  ['e0', 'e1', 'he', 'hne', 'r0', 'r1*', 'r2*', 'r3*', 'r4', 'r5*', 'r1', 'r0', 'r6', 'r7*', 'r6', 'r0', 'hne', 'c3*', 'c2*', 'c1*', 'hnw', 'hw', 'e1', 'e0'],
  ['e0', 'e1', 'hs*', 'he', 'k0', 'k1', 'k2*', 'k3', 'k4*', 'k3', 'k2', 'k1', 'k0', 'e1', 'e0'],
  ['e0', 'e1', 'hw', 's0', 's1', 's2*', 's3*', 's4*', 's1', 's0', 'e1', 'e0'],
  ['e0', 'e1', 'hw', 'hnw', 'c1*', 'c2*', 'hnw', 'l0', 'l1', 'l8*', 'l7', 'l6*', 'l5', 'l4*', 'l2*', 'l1', 'l0', 'hnw', 'hw', 'hs*', 'e1', 'e0'],
];
const SCHOOL = [[20.4, 18.4, 3], [11, 4.2, 3], [6.2, 10.8, 3], [20, 7.6, 3], [33.4, 10.5, 3], [20.4, 18.4, 3]];

/* ---------------- the room ---------------- */
defineRoom({ id: 'aquarium', name: 'Maple Bay Aquarium', w: W, d: D, zoom: 0, music: 'quiet', noCrowd: true, showpiece: 'aquarium', venue: AQ_VENUES.place,
  floor: GT.f_stone, bg: '#0c1a2c', edge: '#16324f', wall: { color: '#cfe0e6', trim: '#16324f', h: 4.4 },
  exits: [{ x: 20.5, y: 23.5, label: 'Exit to the boardwalk', poi: 'door:aquarium' }], spawn: { x: 20.5, y: 22.6, dir: 3 }, items, npcSpots: spots, zones: ZONES,
  setup(sc) {
    const Wd = sc.world, setP = (o, q) => { o.p = Object.assign({}, o.p, q); o._key = null; }, by = k => Wd.objs.filter(o => o.data && o.data[k]);
    const anim = by('anim'), adopt = by('adopt')[0], sboard = by('sketchboard')[0], plq = by('plaque')[0];
    // ---- floors (one decal)
    Wd.decal({ x0: O, y0: O, x1: O + W, y1: O + D, draw(Rr) { const h2 = Rr.hash2;
      const hall = (x, y) => { const X = x - O, Y = y - O, dd = Math.hypot(X - BIG.x, Y - BIG.y); if (dd < 4.6) { if (dd > 4.4) return '#16324f'; const a = Math.atan2(Y - BIG.y, X - BIG.x), k = Math.sin(a * 6 + dd * 3); return k > .3 ? '#58c4dc' : k < -.3 ? '#2f90c0' : '#9fdcf0'; } const fx = X / 2 - Math.floor(X / 2), fy = Y / 2 - Math.floor(Y / 2); if (fx < .03 || fy < .03) return '#aebcc2'; const wv = Math.sin(X * 1.1 + Math.sin(Y * .8) * 1.4); return Math.abs(Y - 20.2 - wv * .5) < .12 ? '#58c4dc' : (Math.floor(X / 2) + Math.floor(Y / 2)) & 1 ? '#e6eeee' : '#dbe6e6'; };
      const local = (x, y) => { const r = Math.floor(y / .75), xx = x + (r & 1) * .5, c = Math.floor(xx), fx = xx - c, fy = y / .75 - r; if (fx < .06 || fy < .08) return '#2f4c58'; const k = h2(c, r, 3); return k > .66 ? '#52808a' : k > .33 ? '#4a7680' : '#426c78'; };
      const ice = (x, y) => { const fx = x - Math.floor(x), fy = y - Math.floor(y); if (fx < .05 || fy < .05) return '#9ab8cc'; return h2(Math.floor(x), Math.floor(y), 5) > .5 ? '#d4e6f0' : '#c6dcea'; };
      const reef = (x, y) => { const k = Math.sin(x * 2.2 + Math.sin(y * 1.7) * 1.2) + Math.sin(y * 2.6 + x * .7); return k > 1.2 ? '#f4e6c0' : k < -1.1 ? '#d8c494' : h2(Math.floor(x * 8), Math.floor(y * 8), 7) > .93 ? '#f0735a' : '#e8d6a8'; };
      const cafe = (x, y) => { const fx = x - Math.floor(x), fy = y - Math.floor(y); if (fx < .05 || fy < .05) return '#8aa0a8'; return (Math.floor(x) + Math.floor(y)) & 1 ? '#eef3f2' : '#2f6f78'; };
      const shop = R.PAT.fboards('#d9c39a', .5);
      for (const [x0, y0, x1, y1, f] of [[13.4, 7.2, 27.6, 24, hall], [0, 0, 13.4, 15.4, local], [13.4, 0, 27.6, 7.2, ice], [27.6, 0, 40, 12.4, reef], [27.6, 12.4, 40, 24, cafe], [0, 15.4, 13.4, 24, shop]]) Rr.qz(O + x0, O + x1, O + y0, O + y1, 0, f); } }); Wd.version++;
    Wd.lights.push({ x: O + BIG.x, y: O + BIG.y + 3, z: 0, r: 7, c: '#8fd8ff' }, { x: O + 6, y: O + 3, z: 0, r: 6, c: '#8fe0d0' }, { x: O + 34, y: O + 3, z: 0, r: 6, c: '#8fd8ff' }, { x: O + 20.5, y: O + 5.5, z: 0, r: 6, c: '#dff4ff' }, { x: O + 34.5, y: O + 14, z: 0, r: 5, c: '#8fd8ff' }, { x: O + 3, y: O + 6, z: 0, r: 5, c: '#8fd8ff' }, { x: O + 24.8, y: O + 20.8, z: 0, r: 4, c: '#ffe9b0' }, { x: O + 5, y: O + 19, z: 0, r: 5, c: '#ffe9b0' });
    // ---- live tanks
    const tanks = { kelp: wallTank({ x: O + 1, y: O + .02, z: .5, w: 11.4, h: 3.5, axis: 'y', kind: 'kelp' }), seal: wallTank({ x: O + .02, y: O + 1.4, z: .5, w: 8.2, h: 3.2, axis: 'x', kind: 'seal' }), reef: wallTank({ x: O + 28.5, y: O + .02, z: .5, w: 11, h: 3.5, axis: 'y', kind: 'reef' }), cafe: wallTank({ x: O + 31.5, y: O + 12.42, z: .35, w: 7.5, h: 2, axis: 'y', kind: 'cafe' }) };
    for (const k in tanks) sc.ents.push(tanks[k].ent);
    const big = bigTank({ x: O + BIG.x, y: O + BIG.y, z: .5, r: BIG.r - .08, h: BIG.h }); sc.ents.push(big.ent);
    for (let a = 0; a < 6.3; a += .2) { const x = O + BIG.x + Math.cos(a) * (BIG.r - .3), y = O + BIG.y + Math.sin(a) * (BIG.r - .3); Wd.block(x - .26, y - .26, x + .26, y + .26); } Wd.block(O + BIG.x - 1.6, O + BIG.y - 1.6, O + BIG.x + 1.6, O + BIG.y + 1.6);
    // ---- critters: penguins on the rock, rays in the lagoon, Finn
    const RX = O + 14.2, penguins = PENGUINS.map((name, i) => { const c = new Critter({ kind: 'penguin', x0: RX + .7, y0: O + 1.3, x1: RX + 12.3, y1: O + 4.3, z: .5, water: { x0: RX, y0: O + 3.25, x1: RX + 13, y1: O + 4.6, z: .36 } }); c.name = name; c.jx = (i - 2.5) * .5; c.jy = (i % 2) * .4; sc.ents.push(c); return c; });
    const rays = [0, 1, 2, 3].map(i => { const c = new Critter({ kind: 'ray', x0: O + 30.2, y0: O + 5.7, x1: O + 35.8, y1: O + 8.3, z: .6 }); c.jx = (i - 1.5) * .5; c.jy = (i % 2) * .3 - .2; sc.ents.push(c); return c; });
    const mascot = new Critter({ kind: 'mascot', x0: O + 18.6, y0: O + 19.6, x1: O + 22.4, y1: O + 22, z: 0 }); sc.ents.push(mascot);
    sc.interactables.push({ ent: mascot, x: mascot.x, y: mascot.y, label: 'Finn the otter (high five!)', h: 1.4, hit: 9, range: 1.7, visible: () => !mascot.hidden, use: () => { mascot.wait = 4; mascot.tx = mascot.x; mascot.ty = mascot.y; mascot.waving = true; setTimeout(() => { mascot.waving = false; }, 2600); if (AS()) AS().highFive(mascot); } });
    penguins.forEach(pg => sc.interactables.push({ ent: pg, x: pg.x, y: pg.y, label: 'Penguin', h: .6, hit: 5, range: 3.2, spot: undefined, visible: () => false }));
    // touch pool: four creatures around the rim
    const tp = sc.fixtures.find(f => f.tags.includes('aqua_touchpool'));
    if (tp) [['sunstar', tp.ob.B[0] + 1, tp.ob.B[4] + .45, 0, -1], ['urchin', tp.ob.B[3] - 1, tp.ob.B[4] + .45, 0, -1], ['anemone', tp.ob.B[0] - .45, tp.y, 1, 0], ['crab', tp.x + .4, tp.ob.B[1] - .45, 0, 1]].forEach(([id, x, y, dx, dy]) => sc.interactables.push({ x: x + dx * .9, y: y + dy * .9, label: 'Touch: ' + { sunstar: 'ochre sea star', urchin: 'purple urchin', anemone: 'giant green anemone', crab: 'hermit crab' }[id], h: .8, hit: 9, range: 1.1, spot: { x, y }, touch: id, use: () => AS() && AS().touch(id) }));
    // ---- life
    const seats = []; for (const f of sc.fixtures) { const id = f.asset.id; if (!/aqua\.bench|cafe\.tableset/.test(id)) continue; f.seats.forEach((s, i) => seats.push({ x: s.x - O, y: s.y - O, z: s.z, dir: s.dir === undefined ? 1 : s.dir, seated: true, p: .4, busy: (seats.length + i) % 3 === 2 ? 1 : 0 })); }
    const cr = crowd(sc, sc.def.npcSpots.concat(seats), { seed: 77, fill: .7, lines: LINES.visitor });
    const lane = () => { const r = pick(ROUTES), stay = r.map(k => k.endsWith('*')), keys = r.map(k => k.replace('*', '')); return { pts: keys.map((k, i) => Object.assign({ x: N[k][0] + O + (Math.random() - .5) * .4, y: N[k][1] + O + (Math.random() - .5) * .3 }, stay[i] ? { wait: 6 + Math.random() * 8, pose: Math.random() < .3 ? 'phone' : null, dir: 3 } : null)), kind: Math.random() < .5 ? 'stroll' : 'walk' }; };
    const wk = walkers(sc, { n: 18, route: lane, lines: LINES.visitor, label: 'Visitor' });
    const P = specs(), mk = (spec, label, x, y, dir) => { const c = new Char(spec, x + O, y + O); c.speed = 1.6; c.kind = 'staff'; c.label = label; c.dir = dir; sc.ents.push(c); return c; };
    const aq = mk(Object.assign({}, P.staff[2], { topColor: '#1f8f9a' }), 'Dr. Reyes, head aquarist', 10.6, 5, 3), keeper = mk(Object.assign({}, P.staff[5], { topColor: '#f0735a' }), 'Tobias, penguin keeper', 20.6, 2.2, 1), teach = mk(P.staff[6], 'Teacher', 20.5, 22.4, 3);
    keeper.z = .5; keeper.hidden = true; teach.hidden = true; keeper.poseOpts = { item: 'box', itemColor: '#b9c6cc' };
    const AQP = [[10.6, 5, 3], [11, 9.8, 2], [3.4, 11.4, 3], [6.6, 12.6, 3]]; let ai = 0, aw = 8;
    sc.interactables.push({ ent: aq, x: aq.x, y: aq.y, label: 'Dr. Reyes, the head aquarist', h: 1.3, hit: 8, range: 1.8, visible: () => !aq.hidden, use: () => { aq._hold = 6; aq.path = null; aq.faceTo(G.player.x, G.player.y); if (AS()) AS().talkAquarist(aq); } });
    sc.interactables.push({ ent: keeper, x: keeper.x, y: keeper.y, label: 'Tobias: ask to feed a penguin', h: 1.6, hit: 9, range: 3.4, spot: { x: O + 20.6, y: O + 5.2 }, visible: () => !keeper.hidden, use: () => { if (AS()) AS().feedPenguin(sc); } });
    sc.interactables.push({ ent: teach, x: teach.x, y: teach.y, label: 'Teacher', h: 1.3, hit: 8, range: 1.8, visible: () => !teach.hidden, use: () => { teach._hold = 3; bubble(teach, pick(LINES.teacher)); } });
    const kids = Array.from({ length: 5 }, (_, i) => { const c = new Char(P.kid[(i * 3 + 1) % P.kid.length], O + 19.5 + i * .5, O + 22.6); c.speed = 1.8; c.hidden = true; c.kind = 'customer'; sc.ents.push(c); sc.interactables.push({ ent: c, x: c.x, y: c.y, label: 'Schoolkid', h: 1, hit: 6, range: 1.7, visible: () => !c.hidden, use: () => bubble(c, pick(LINES.kid)) }); return c; });
    const follow = (list, lead, dt, sp) => list.forEach((c, i) => { if (c.hidden) return; const tx = lead.x - .5 + (i % 3 - 1) * .7, ty = lead.y + .9 + Math.floor(i / 3) * .6 + (i % 2) * .25; if ((c._rt = (c._rt || 0) - dt) <= 0 && Math.hypot(tx - c.x, ty - c.y) > 1.2) { c._rt = .8 + Math.random(); c.goTo(Wd, tx, ty); } c.speed = sp || 1.8; if (c.path) c.move(Wd, dt); else { c.moving = false; c.t += dt; c.faceTo(lead.x, lead.y - 2); } });
    const school = { on: false, i: -1, wait: 0, day: -1, leaving: false };
    const startSchool = () => { if (school.on) return; school.on = true; school.leaving = false; school.i = -1; school.wait = 2; teach.hidden = false; teach.x = O + 20.5; teach.y = O + 22.4; teach.path = null; kids.forEach((k, i) => { k.hidden = false; k.x = O + 19.4 + i * .5; k.y = O + 22.8; k.path = null; }); };
    const endSchool = () => { school.on = false; teach.hidden = true; kids.forEach(k => { k.hidden = true; }); };
    // ---- shows: clock or forced
    const show = { penguin: false, rays: false, dive: false }, forced = {}, said = {}; let feedPoint = null, kt = 0, kx = 20.6, kdir = 1;
    const showOn = id => { if (forced[id] > 0) return true; const h = G.now().hf, sh = SHOWS.find(s => s.id === id); return !!sh && open && sh.at.some(t => h >= t && h < t + sh.dur); };
    let view = null, open = null, tick = 0, ft = 0, fb = 0, lastT = 0, bz = null, stage = -1, lastFree = { x: O + 20.5, y: O + 22 }, nAd = -1, nSk = -1, hadPl = null, dim = false;
    const zoneAt = (x, y) => { for (const z of ZONES) if (x >= z.x0 && x < z.x1 && y >= z.y0 && y < z.y1) return z; return null; };
    const sync = () => {
      const n = G.now(), h = n.hf, isOpen = AS() ? AS().isOpen() : (h >= 9 && h < 18), late = AS() ? AS().lateNow() : false;
      const ad = AS() ? AS().adopted() : []; if (ad.length !== nAd && adopt) { nAd = ad.length; setP(adopt, { names: ad.map(a => a.by.toUpperCase()) }); }
      const sk = AS() ? AS().stats().sketches : 0; if (sk !== nSk && sboard) { nSk = sk; setP(sboard, { n: Math.min(6, sk) }); }
      const pl = !!(AS() && AS().chain().st >= 4); if (pl !== hadPl && plq) { hadPl = pl; plq.hidden = !pl; if (pl) Wd.block(plq.B[0], plq.B[1], plq.B[3], plq.B[4]); else Wd.free(plq.B[0], plq.B[1], plq.B[3], plq.B[4]); }
      const wkend = n.weekday >= 5, lvl = !isOpen ? 0 : late ? .55 : (h < 10 ? .3 : h < 12 ? .55 : h < 16 ? .72 : .45) + (wkend ? .22 : 0), busy = isOpen && (wkend ? h >= 10.5 : h >= 11 && h < 16) && !late;
      if (lvl !== sc.life.level || busy !== bz || isOpen !== open) { sc.life.level = lvl; bz = busy; open = isOpen; for (const c of cr.list) { const sp = c.spot, kid = sp.age === 'kid'; c.hidden = sp.kind === 'staff' ? !isOpen : !isOpen || (late && kid) || (sp.busy ? !busy || c.roll > lvl + .25 : c.roll > (sp.p !== undefined ? Math.min(sp.p, lvl + .15) + (lvl > .8 ? .2 : 0) : lvl)); } wk.setActive(!isOpen ? 0 : Math.round(4 + lvl * 15), !isOpen); aq.hidden = !isOpen; mascot.hidden = !isOpen || late || h > 17; }
      dim = late || (AS() && AS().sleepoverNow());
      for (const id of ['penguin', 'rays', 'dive']) { const on = showOn(id); if (on !== show[id]) { show[id] = on; if (id === 'dive') { big.diver(on); if (on) { big.feed(40); if (Math.hypot(G.player.x - O - BIG.x, G.player.y - O - BIG.y) < 12) toast('A diver drops into the Big Blue in a column of bubbles. Wave from in front of the tank and see what happens.', 'good', 5200); } } if (id === 'penguin') { keeper.hidden = !on; kx = 20.6; if (on) bubble(keeper, 'Breakfast! Who is hungry? ...Everyone. As usual.', 4200); for (const pg of penguins) pg.target = on ? keeper : null; } if (id === 'rays') { tanks.reef.feed(20); if (on && zoneAt(G.player.x - O, G.player.y - O) && zoneAt(G.player.x - O, G.player.y - O).id === 'reef') toast('Ray Bay feeding time: the keeper has the bucket out. Take a cup from the dispenser, on the house.', 'good', 4800); } G.emit('aquarium:show', id, on); } }
      if (isOpen && !wkend && !late && !school.on && h >= 10 && h < 11.8 && school.day !== n.day) { school.day = n.day; startSchool(); }
      if (school.on && !school.leaving && (h >= 12.2 || !isOpen)) school.leaving = true;
      sc.life.open = isOpen;
    };
    sc.life = { crowd: cr, walkers: wk, count: () => cr.count() + wk.count() + (school.on ? 6 : 0), level: -1 };
    sc.aq = { tanks, big, penguins, rays, keeper, aquarist: aq, mascot, show, school, startSchool, endSchool, sync, zoneAt: (x, y) => zoneAt(x, y), routes: ROUTES, nodes: N, force(id, sec = 60) { forced[id] = sec; sync(); return true; }, feedRays(x, y, sec) { feedPoint = { x, y }; for (const r of rays) r.target = feedPoint; setTimeout(() => { for (const r of rays) r.target = null; }, sec * 1000); }, feedPenguin(x) { const pg = penguins.reduce((a, b) => (Math.abs(a.x - x) < Math.abs(b.x - x) ? a : b)); const t = { x, y: O + 4.25 }; pg.target = t; pg.jx = 0; pg.jy = 0; setTimeout(() => { pg.target = show.penguin ? keeper : null; }, 7000); return pg; } };
    sc.env = t => { const o = ambient(t, G.state.weather), a = o.amb === '#ffffff' ? o.amb : R.mix(o.amb, '#ffffff', .55); return dim ? { amb: R.mix(a, '#4a6ab0', .55), dark: .62, bg: Wd.bg, night: true } : { amb: a, dark: Math.min(.5, (o.dark || 0) * .5), bg: Wd.bg, night: o.night }; };
    sync();
    const u0 = sc.update; sc.update = (dt, gm) => {
      u0(dt, gm); cr.update(dt); wk.update(dt);
      for (const k in tanks) tanks[k].update(dt); big.update(dt); for (let i = 0; i < penguins.length; i++) penguins[i].tick(dt); for (let i = 0; i < rays.length; i++) rays[i].tick(dt); if (!mascot.hidden) mascot.tick(dt);
      for (const k in forced) if (forced[k] > 0) forced[k] -= dt;
      if ((tick -= dt) <= 0) { tick = 1.2; sync(); }
      if ((ft += dt) > .4) { ft = 0; fb++; for (const o of anim) setP(o, { frame: fb % 2 }); }
      // ticket line
      const p = G.player, z = zoneAt(p.x - O, p.y - O);
      if (z && z.ticket && !G.busy && !(AS() && AS().hasTicket())) { p.x = lastFree.x; p.y = lastFree.y; p.stop(); G.target = null; G.pending = null; if (G.time - lastT > 3) { lastT = G.time; toast(sc.life.open ? `"Ticket, please!" ${z.name} needs an aquarium ticket: the desk is by the door.` : 'The exhibits are closed for the night.', 'info', 3600); } }
      else if (z && !z.ticket) { lastFree.x = p.x; lastFree.y = p.y; }
      // head aquarist drifts round Local Waters
      if (aq._hold > 0) { aq._hold -= dt; aq.moving = false; aq.t += dt; }
      else if (aq.path) { aq.pose = null; aq.move(Wd, dt); if (!aq.path) { aq.dir = AQP[ai][2]; aw = 9 + Math.random() * 12; aq.pose = Math.random() < .5 ? 'read' : null; } }
      else { aq.t += dt; aq.moving = false; if ((aw -= dt) <= 0) { ai = (ai + 1) % AQP.length; aq.pose = null; if (!aq.goTo(Wd, AQP[ai][0] + O, AQP[ai][1] + O)) aw = 3; } }
      // penguin keeper paces the rock, throwing fish
      if (!keeper.hidden) { keeper.t += dt; kt -= dt; const tx = O + kx; if (Math.abs(tx - keeper.x) > .05) { keeper.x += Math.sign(tx - keeper.x) * Math.min(Math.abs(tx - keeper.x), dt * .9); keeper.moving = true; keeper.dir = tx > keeper.x ? 0 : 2; } else { keeper.moving = false; keeper.dir = 1; keeper.pose = 'work'; if (kt <= 0) { kt = 5 + Math.random() * 4; kx = 16.5 + Math.random() * 8.5; keeper.pose = null; if (Math.hypot(p.x - keeper.x, p.y - keeper.y) < 10 && Math.random() < .6) bubble(keeper, pick(['One each! ONE each, Admiral.', 'Pebble always gets the first fish. Those are the rules. Her rules.', 'Herring today. They prefer sprats, and they let me know it.', 'Anyone want to feed one? Come to the glass and ask!']), 3600); } } keeper.y = O + 2.2; keeper.z = .5; }
      // the school party
      if (school.on) {
        if (teach._hold > 0) { teach._hold -= dt; teach.moving = false; teach.t += dt; }
        else if (teach.path) { teach.pose = null; teach.move(Wd, dt); if (!teach.path) { if (school.leaving) endSchool(); else { teach.dir = 3; teach.pose = 'talk'; school.wait = 14 + Math.random() * 10; if (Math.hypot(p.x - teach.x, p.y - teach.y) < 9) bubble(teach, pick(LINES.teacher), 3600); } } }
        else { teach.t += dt; teach.moving = false; if ((school.wait -= dt) <= 0) { teach.pose = null; if (school.leaving) { if (!teach.goTo(Wd, O + 20.5, O + 22.6)) endSchool(); } else { school.i = (school.i + 1) % SCHOOL.length; const q = SCHOOL[school.i]; if (!teach.goTo(Wd, q[0] + O, q[1] + O)) school.wait = 2; } } }
        if (school.on) follow(kids, teach, dt, 2);
      }
    };
    const e0 = sc.onEnter; sc.onEnter = (o, pv) => { e0(o, pv); view = null; if (!o || o.x === undefined) lastFree = { x: O + 20.5, y: O + 22 }; else lastFree = { x: O + 20.5, y: O + 20 }; sync(); if (AS()) AS().arrived(sc, pv); };
  },
});

registerInfo('Maple Bay Aquarium', {
  blurb: 'Under a roof shaped like three breaking waves on the harbor boardwalk: a four-metre cylinder of reef fish with a diver in it, a kelp forest, harbor seals seen from underwater, a touch pool, penguins, a lagoon of rays you can feed, and downstairs a glass tunnel where sharks, rays and a sea turtle swim over your head on the way to a dark room full of glowing jellyfish.',
  signature: 'The Ocean Tunnel, and the Jellyfish Gallery that slowly changes colour.',
  tryThis: ['Walk the Ocean Tunnel and spot a sand tiger shark as it passes overhead', 'Sit and watch the jellyfish until your shoulders come down', 'Touch a sea star, an urchin, an anemone and a hermit crab at the touch pool', 'Feed the bat rays at Ray Bay', 'Wave to the diver in the Big Blue at 14:00', 'Ask the keeper to let you feed a penguin (11:30 and 15:30)', 'Watch the sea otter feeding on the Harbor Deck (13:00 and 16:30)', 'Fill the species logbook: six zones, six stamps', 'Take the Fish Detective quiz', 'Adopt a penguin and get your name on the board', 'Stay the night at Sleep with the Sharks', 'Ask Dr. Reyes about the turtle behind the staff door'],
  activities: ['aqua_spot', 'aqua_touch', 'aqua_feed_rays', 'aqua_feed_penguin', 'aqua_jellies', 'aqua_sketch', 'aqua_quiz', 'aqua_photo', 'aqua_adopt', 'aqua_dive', 'aqua_otters', 'aqua_sleepover'],
});

const only = fn => (fx, scene) => (scene.def && scene.def.showpiece === 'aquarium' ? fn(fx, scene) : null);
const spName = sp => (SPECIES[sp] && SPECIES[sp].name) || 'the animal';
export function init() {
  registerFixture('aqua_plaque', only((fx, sc) => (fx.item.sp ? { label: 'Spot: ' + spName(fx.item.sp), hit: 10, h: 1, use: () => AS() && AS().spot(fx.item.sp, sc) } : null)));
  registerFixture('aqua_bench', only((fx, sc) => (fx.item.sketch ? { label: 'Sit and sketch the kelp forest', hit: 12, use: () => AS() && AS().sketch(fx, sc) } : { label: { jelly: 'Sit and watch the jellies', dive: 'Sit and watch the Big Blue', penguin: 'Sit and watch the penguins', seal: 'Sit and watch the seals' }[fx.item.kind] || 'Sit a while', hit: 12, use: () => AS() && AS().sit(fx, sc, fx.item.kind) })));
  registerFixture('aqua_lagoon', only((fx, sc) => ({ label: 'Ray Bay: touch a ray', hit: 16, use: () => AS() && AS().touchRay(fx, sc) })));
  registerFixture('aqua_feeder', only((fx, sc) => ({ label: 'Feed the rays', hit: 12, use: () => AS() && AS().feedRays(fx, sc) })));
  registerFixture('aqua_penguins', only((fx, sc) => ({ label: 'Penguin Cove', hit: 20, h: 1.2, use: () => AS() && AS().penguins(sc) })));
  registerFixture('aqua_board', only((fx, sc) => { const k = fx.item.p.kind; return k === 'shows' ? { label: "Today's shows", hit: 14, use: () => AS() && AS().showsBoard() } : k === 'adopt' ? { label: 'Adopt a penguin', hit: 14, use: () => AS() && AS().adopt() } : k === 'sketch' ? { label: 'Visitor sketches', hit: 12, use: () => AS() && AS().lookBoard() } : k === 'chart' ? { label: 'Turtle chart', hit: 12, use: () => AS() && AS().chart() } : { label: 'Bronze plaque', hit: 10, visible: () => !fx.ob.hidden, use: () => AS() && AS().readPlaque() }; }));
  registerFixture('aqua_quiz', only(() => ({ label: 'Fish Detective quiz', hit: 12, use: () => AS() && AS().quiz() })));
  registerFixture('aqua_photo', only((fx, sc) => ({ label: 'Photo spot', hit: 12, h: fx.item.spot === 'jaws' ? 1.6 : .3, range: 1, use: () => AS() && AS().photo(fx.item.spot, sc) })));
  registerFixture('aqua_stairs', only(fx => { const T = { deep: ['Stairs down to the Ocean Tunnel', 'int:aquarium:deep'], deep2: ['Stairs down to the Deep', 'int:aquarium:deep'], deck: ['Door to the Harbor Deck', 'int:aquarium:deck'], reef: ['Stairs up to the Tropical Reef', 'int:aquarium'], shop: ['Stairs up to the gift shop', 'int:aquarium'] }[fx.item.to]; return T ? { label: T[0], hit: 14, h: 1, range: 1.2, navTo: T[1], spot: { x: fx.x, y: fx.y + .1 }, use: () => AS() && AS().travel(fx.item.to) } : null; }));
  registerFixture('aqua_door', only(() => ({ label: 'Staff door: Behind the Scenes', hit: 12, navTo: 'int:aquarium:lab', use: () => AS() && AS().travel('lab') })));
  registerFixture('aqua_shop', only(fx => ({ label: fx.item.label, hit: 14, shop: fx.item.venue, use: () => G.shop && G.shop.open(fx.item.venue, { checkHours: true }) })));
  registerFixture('aqua_ticket', only(() => ({ label: 'Tickets, passes & shows', hit: 14, use: () => AS() && AS().desk() })));
  registerFixture('aqua_bigtank', only((fx, sc) => ({ label: 'The Big Blue: wave to the diver', hit: 30, h: 2.4, range: 2.2, spot: { x: fx.x + .4, y: fx.ob.B[4] + .5 }, use: () => AS() && AS().wave(sc) })));
  registerFixture('aqua_stand', only((fx, sc) => ({ label: 'Sit in the stand', hit: 16, use: () => AS() && AS().sit(fx, sc, 'deck') })));
  registerFixture('aqua_scope', only(() => ({ label: 'Harbor telescope', hit: 10, use: () => AS() && AS().scope() })));
  registerFixture('aqua_rehab', only((fx, sc) => ({ label: 'The rehab pool', hit: 20, use: () => AS() && AS().care('pool', fx, sc) })));
  registerFixture('aqua_lab', only((fx, sc) => ({ label: fx.item.p.kind === 'nursery' ? 'Jelly nursery' : 'Microscope', hit: 12, use: () => AS() && AS().lab(fx.item.p.kind || 'scope') })));
  registerFixture('aqua_rack', only(() => ({ label: 'Quarantine tanks', hit: 12, use: () => AS() && AS().lab('rack') })));
  registerFixture('aqua_prep', only((fx, sc) => ({ label: 'Food prep bench', hit: 12, use: () => AS() && AS().care('prep', fx, sc) })));
  registerFixture('aqua_deckpool', only((fx, sc) => ({ label: fx.item.p.kind === 'seal' ? 'Harbor seal pool' : 'Sea otter pool', hit: 20, h: 1, use: () => AS() && AS().spot(fx.item.p.kind === 'seal' ? 'seal' : 'otter', sc) })));
}
