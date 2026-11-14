// Maple Bay Botanical Conservatory — room `conservatory` (40 x 28), entered by the city door `door:conservatory` on the park's glass palm house.
// One big glasshouse with connected zones (room coords, (0,0) = back corner):
//   Entrance hall (x13-27, y20-28: ticket desk, map, exit)      Garden Gifts + The Glasshouse Cafe (x0-13, y20-28)      Seasonal Flower Show (x27-40, y21-28)
//   Lily pool (centre, x16.5-23.5, y13-20)                       Tropical Palm House (x13-27, y0-13: waterfall + stream)  Desert House (x27-40, y0-11)
//   Orchid & Fern Grotto (x0-13, y0-10)                          Butterfly Room (x0-11, y10-20)                           Koi Garden (x27-40, y11-21: pond + arched bridge)
// The hall, shop, cafe and flower show are free; everything north of the two ticket gates (y < 20) needs a day ticket (G.conservatory.hasTicket()).
// The room runs its own life (def.noCrowd): scene.life = { crowd, walkers, count() }, scene.cons = { koi, flies, feed(x, y), gardener, docent, tour, sync(), zoneAt(x, y) }.
// Fixture tags handled here (all only inside this room): cons_bench, cons_plaque (item.fact), cons_koifeed (item.feed), cons_bfly, cons_sketch, cons_board, cons_seedling,
//   cons_map, cons_pool, cons_waterfall, cons_gate + item tags cons_shop (item.venue), cons_ticket. Gameplay lives in sim/conservatory.js (G.conservatory).
import { G } from '../../core/game.js';
import { GT } from '../../engine/world.js';
import { Char } from '../../core/char.js';
import { pixSprite } from '../../engine/sprites.js';
import * as R from '../../engine/raster.js';
import { ambient } from '../../core/clock.js';
import { defineRoom, registerFixture } from '../interior.js';
import { toast, bubble } from '../../ui/kit.js';
import { crowd, walkers } from './_show_life.js';
import { specs } from './_airport_life.js';
import { registerInfo } from './unique_rooms.js';
import { POND, pondIn, archZ } from '../../art/showpiece/_cons_lib.js';
import { CONS_VENUES, CONS_HOURS, BUTTERFLIES, TOUR_TIMES } from '../../data/conservatory.js';

const W = 40, D = 28, O = 1, pick = a => a[Math.floor(Math.random() * a.length)];
const CS = () => G.conservatory;
const items = [], spots = [];
const A = (id, x, y, p, o) => { const it = Object.assign({ id: 'furn.' + id, x, y, p: p || {} }, o); items.push(it); return it; };
const Cn = (id, x, y, p, o) => A('cons.' + id, x, y, p, o);
const inBed = (id, x, y, p) => Cn(id, x, y, p, { z: .35 });
const S = (x, y, dir, o) => spots.push(Object.assign({ x, y, dir }, o));

export const ZONES = [
  { id: 'hall', name: 'Entrance Hall', x0: 13, y0: 20, x1: 27, y1: 28 }, { id: 'shop', name: 'Garden Gifts & The Glasshouse Cafe', x0: 0, y0: 20, x1: 13, y1: 28 }, { id: 'show', name: 'Seasonal Flower Show', x0: 27, y0: 21, x1: 40, y1: 28 },
  { id: 'lily', name: 'Lily Pool', x0: 11, y0: 11, x1: 27, y1: 20 }, { id: 'palm', name: 'Tropical Palm House', x0: 13, y0: 0, x1: 27, y1: 13 }, { id: 'desert', name: 'Desert House', x0: 27, y0: 0, x1: 40, y1: 11 },
  { id: 'grotto', name: 'Orchid & Fern Grotto', x0: 0, y0: 0, x1: 13, y1: 10 }, { id: 'butterfly', name: 'Butterfly Room', x0: 0, y0: 10, x1: 11, y1: 20 }, { id: 'koi', name: 'Koi Garden', x0: 27, y0: 11, x1: 40, y1: 21 },
];
const PX = 29, PY = 12.5, BR = POND.bridge; // pond origin (room coords)
const LINES = {
  visitor: ['It is like breathing soup in here. Nice soup.', 'My glasses fogged up the second I walked in.', 'I come every week in winter. It is the only place my shoulders come down.', 'Have you seen the lily pads? You could serve dinner on one.', 'The big orange koi is called Marmalade. She runs this place.', 'Shh. Listen. Water, and nothing else.', 'They say a saguaro waits seventy years for its first arm. I waited forty for a garden.', 'Hold still! There is a butterfly on your shoulder. ...It left.'],
  kid: ['A butterfly landed on my HEAD!', 'The cactus looks like it is waving!', 'Can we feed the fish again? Pleeease?', 'I found a banana! A real one! On a TREE!'],
  student: ['Shh. I am trying to get the lip of the orchid right.', 'Third attempt. The first two looked like cabbages.', 'Our whole drawing class comes on Thursdays.'],
  staff: ['Welcome to the glasshouse! Tours leave from the lily pool at ten, one and four.', 'Day tickets are four dollars. The flower show and the cafe are free to wander.', 'Mind the misters in the Palm House. They are not shy.'],
  cafe: ['Hibiscus iced tea is the one everybody orders twice.', 'Sit anywhere. The ferns do not mind.', 'The rose cake came out ten minutes ago.'],
  gifts: ['Every seedling was grown right here, in the back house.', 'The flytrap is the one children choose. And some grown-ups.', 'A plant on the windowsill changes a whole flat.'],
};

/* ---------------- layout ---------------- */
function build() {
  for (let at = 0; at < W; at += 4) items.push({ id: 'furn.cons.glasswall', wall: 'y', at, p: { w: 4, u0: at }, sky: 1 });
  for (let at = 0; at < D; at += 4) items.push({ id: 'furn.cons.glasswall', wall: 'x', at, p: { w: 4, u0: 50 + at }, sky: 1 });
  // light shafts (hidden at night)
  for (const [x, y] of [[14, 21], [21, 21.5], [13.5, 13.5], [22.5, 3], [29, 22], [30, 2], [14, 3.5], [31, 13]]) A('cons.shaft', x, y, {}, { shaft: 1 });
  // ---- tropical palm house
  Cn('waterfall', 17.5, 0, {}, { anim: 3 }); Cn('stream', 19, 2.5, { len: 10.5, slabs: [3, 8.5] }, { anim: 2 });
  Cn('bed', 13.5, 1, { w: 3.5, d: 3.5, kind: 'tropical', seed: 2 }); inBed('palm', 14, 1.5, { kind: 'coconut', h: 4.2, seed: 3 }); inBed('palm', 15.5, 2.5, { kind: 'date', h: 3.2, seed: 8 }); inBed('banana', 14, 3.5, { seed: 2 }); inBed('cycad', 16, 1.5, { seed: 2 });
  Cn('bed', 13.5, 7.5, { w: 4, d: 3.5, kind: 'tropical', seed: 5 }); inBed('palm', 14, 8, { kind: 'areca', h: 2.6, seed: 5 }); inBed('palm', 16, 9.5, { kind: 'coconut', h: 3.6, seed: 12, lean: -.4 }); inBed('treefern', 14.5, 10, { seed: 3, h: 1.6 }); inBed('banana', 16.5, 8, { seed: 5, h: 1.8 });
  Cn('bed', 23, 1, { w: 3.5, d: 3.5, kind: 'tropical', seed: 9 }); inBed('palm', 25, 1.5, { kind: 'coconut', h: 4.4, seed: 6 }); inBed('palm', 23.5, 3, { kind: 'date', h: 3, seed: 4 }); inBed('banana', 25.5, 3.5, { seed: 4 });
  Cn('bed', 22.5, 7.5, { w: 4, d: 3.5, kind: 'tropical', seed: 11 }); inBed('palm', 25, 8, { kind: 'areca', h: 2.8, seed: 9 }); inBed('palm', 23, 9, { kind: 'coconut', h: 3.8, seed: 7, lean: .4 }); inBed('banana', 25, 10, { seed: 6 }); inBed('cycad', 23.5, 8, { seed: 9 });
  Cn('mister', 13.5, 5, { w: 4 }, { z: 3.2, anim: 4, mist: 1 }); Cn('mister', 22.5, 5, { w: 4 }, { z: 3.2, anim: 4, mist: 1 });
  Cn('bench', 14, 11); Cn('bench', 24.5, 11); Cn('lamp', 17, 11); Cn('lamp', 22.5, 11); Cn('lamp', 17, 4.5);
  Cn('plaque', 15, 4.5, {}, { fact: 'coconut' }); Cn('plaque', 24.5, 4.5, {}, { fact: 'banana' }); Cn('plaque', 16.5, 11, {}, { fact: 'cycad' });
  S(18.3, 3.3, 0, { anim: 'phone' }); S(21.7, 3.4, 2); S(15.3, 5.4, 3, { p: .6 }); S(24.8, 5.4, 3, { p: .6 }); S(18.4, 7.6, 0, { busy: 1 }); S(21.6, 9.4, 2, { busy: 1, age: 'kid', lines: LINES.kid });
  // ---- lily pool (centre)
  Cn('lilypool', 16.5, 13, {}, { anim: 2 }); Cn('plaque', 20, 20, {}, { fact: 'lily' });
  S(15.6, 15, 0); S(15.8, 17.6, 0, { age: 'kid', lines: LINES.kid }); S(24.4, 16.6, 2, { anim: 'phone' }); S(24.4, 15, 2, { busy: 1 }); S(15.6, 13.8, 0, { busy: 1, anim: 'talk' }); S(14.9, 13.6, 0, { busy: 1, anim: 'talk' });
  Cn('bench', 24, 13.5); Cn('bench', 11.5, 18.5); Cn('barrow', 11.5, 12); Cn('lamp', 26, 19);
  // ---- entrance hall
  Cn('gate', 13, 20, { w: 3.5 }, { gate: 1 }); Cn('gate', 23.5, 20, { w: 3.5 }, { gate: 1 });
  Cn('counter', 22.5, 22, { kind: 'ticket', w: 2.5 }, { tags: ['cons_ticket'] }); S(23.75, 21.55, 1, { kind: 'staff', label: 'Ticket desk', lines: LINES.staff });
  Cn('mapboard', 18, 22.5); Cn('urn', 18, 26.5, { seed: 2 }, { seasonal: 1 }); Cn('urn', 21.5, 26.5, { seed: 5 }, { seasonal: 1 }); Cn('lamp', 17.5, 21); Cn('lamp', 22, 21);
  Cn('bed', 13.5, 25.5, { w: 2, d: 1, kind: 'orchid', seed: 21 }, { rare: 1, solid: false }); Cn('plaque', 14, 26.5, { c: '#b8562a' }, { rare: 1, fact: 'rare' });
  S(18.8, 23.5, 3, { p: .6 }); S(19, 24.6, 1, { anim: 'phone', p: .5 }); S(24, 25, 3, { p: .5 }); S(24.6, 24.9, 3, { busy: 1 }); S(20.3, 20.9, 3, { p: .5 });
  // ---- Garden Gifts + The Glasshouse Cafe
  Cn('partition', 0, 20, { w: 13 });
  Cn('shelf', .5, 20.5, { kind: 'gift', w: 3 }); Cn('counter', .5, 21.5, { kind: 'gift', w: 3 }, { tags: ['cons_shop'], venue: CONS_VENUES.gifts, label: 'Garden Gifts' }); S(2, 21.05, 1, { kind: 'staff', label: 'Garden Gifts', lines: LINES.gifts });
  Cn('shelf', 5, 20.5, { kind: 'cafe', w: 4 }); Cn('counter', 5.5, 21.5, { kind: 'cafe', w: 3 }, { tags: ['cons_shop'], venue: CONS_VENUES.cafe, label: 'The Glasshouse Cafe' }); S(7, 21.05, 1, { kind: 'staff', outfit: 'cook', label: 'The Glasshouse Cafe', lines: LINES.cafe });
  for (const [x, y] of [[5, 24], [8.5, 24], [5, 26], [8.5, 26], [10.5, 22]]) A('cafe.tableset', x, y, { c: '#2f6a58', cc: '#f4ead0' }, { cafe: 1 });
  Cn('seedtable', .5, 23.5, { seed: 4 }, { flip: true }); Cn('seedtable', .5, 25.5, { seed: 9 }, { flip: true }); Cn('urn', 12, 20.5, { kind: 'topiary' }); Cn('urn', 12, 27, { kind: 'fern', seed: 4 }); Cn('basket', 3.5, 23, { kind: 'fuchsia', seed: 7 }, { z: 2.2 }); Cn('basket', 11, 24.5, { kind: 'fern', seed: 3 }, { z: 2.3 });
  S(7, 22.75, 3, { p: .7 }); S(1.9, 24.6, 2, { p: .6 }); S(2.1, 22.75, 3, { p: .5 }); S(7.7, 22.9, 3, { busy: 1, anim: 'phone' });
  // ---- butterfly room
  Cn('partition', 0, 10, { w: 4 }); Cn('arch', 4, 10, { w: 3, name: 'BUTTERFLIES' }); Cn('partition', 7, 10, { w: 4 });
  Cn('partition', 11, 10, { w: 4.5 }, { flip: true }); Cn('arch', 11, 14.5, { w: 3, name: 'BUTTERFLIES' }, { flip: true }); Cn('partition', 11, 17.5, { w: 2.5 }, { flip: true });
  Cn('bed', .5, 10.5, { w: 3, d: 2, kind: 'butterfly', seed: 3 }, { perch: 1 }); Cn('bed', 7.5, 10.5, { w: 3, d: 2, kind: 'butterfly', seed: 6 }, { perch: 1 }); Cn('bed', .5, 17.5, { w: 4.5, d: 2, kind: 'butterfly', seed: 8 }, { perch: 1 }); Cn('bed', 6, 17.5, { w: 4.5, d: 2, kind: 'butterfly', seed: 12 }, { perch: 1 }); Cn('bed', 4, 13.5, { w: 3, d: 2.5, kind: 'butterfly', seed: 15 }, { perch: 1 });
  Cn('puparium', .5, 13.5, {}, { flip: true, fact: 'pupae' }); Cn('nectar', 2.5, 15.5, {}, { perch: 2 }); Cn('nectar', 8, 15, {}, { perch: 2 }); Cn('bench', 1, 12.5); Cn('plaque', 5, 16, {}, { fact: 'butterfly' });
  Cn('basket', 2.5, 12.5, { kind: 'fuchsia', seed: 4 }, { z: 2.2 }); Cn('basket', 9, 13, { kind: 'orchid', seed: 5 }, { z: 2.3 });
  S(3.6, 15.9, 2, { anim: 'phone' }); S(7.3, 16.7, 3, { age: 'kid', lines: LINES.kid }); S(1.6, 14.7, 2, { p: .6 }); S(3.2, 13, 3, { busy: 1 }); S(8.9, 16.6, 2, { busy: 1, anim: 'phone' });
  // ---- orchid & fern grotto
  Cn('rock', 12, .5, { w: 1, d: 2, h: 1.6, moss: 1, seed: 3 }); Cn('rock', 12, 2.5, { w: 1, d: 2, h: 1.9, moss: 1, seed: 7 }); Cn('arch', 12, 4.5, { w: 2.5, name: 'GROTTO' }, { flip: true }); Cn('rock', 12, 7, { w: 1, d: 2, h: 1.8, moss: 1, seed: 9 }); Cn('rock', 11.5, 9, { w: 1.5, d: 1, h: 1.4, moss: 1, seed: 12 });
  Cn('bed', .5, .5, { w: 3, d: 2, kind: 'fern', seed: 4 }); inBed('treefern', 1, 1, { seed: 7, h: 2.2 }); inBed('treefern', 2.5, 1.5, { seed: 3, h: 1.4 });
  Cn('orchidlog', 4, .5); Cn('sketchspot', 5, 2.5); Cn('plaque', 7, 1.5, {}, { fact: 'orchid' });
  Cn('bed', 8, .5, { w: 3.5, d: 1.5, kind: 'orchid', seed: 5, gap: .1 }); Cn('sketchboard', 8.5, 2.5, { n: 0 }, { board: 1 });
  Cn('bed', .5, 4, { w: 1.5, d: 4.5, kind: 'fern', seed: 8 }); inBed('treefern', .5, 5.5, { seed: 5, h: 1.8 }); Cn('plaque', 2, 6, {}, { flip: true, fact: 'treefern' });
  Cn('rock', 6, 7, { w: 2, d: 1.5, h: 1.1, moss: 1, seed: 5 }); Cn('bench', 2.5, 8.5); Cn('lamp', 3.5, 4.5); Cn('lamp', 10.5, 4); Cn('treefern', 10.5, 7, { seed: 9, h: 1.7 });
  for (const [x, y, k, z, sd] of [[2, 3, 'orchid', 2.3, 5], [8.5, 4.5, 'fern', 2.4, 3], [10.5, 2, 'fuchsia', 2.5, 7], [7, 6, 'orchid', 2.4, 9], [9.5, 8, 'fern', 2.3, 6], [4, 6.5, 'fern', 2.5, 2]]) Cn('basket', x, y, { kind: k, seed: sd }, { z });
  S(4.4, 2.3, 3, { anim: 'read', label: 'Art student', lines: LINES.student }); S(7, 2.6, 3, { anim: 'read', label: 'Art student', lines: LINES.student, p: .7 }); S(9.6, 3.4, 3, { p: .5 }); S(3.1, 6.3, 2, { p: .5 }); S(8.2, 6.6, 3, { busy: 1, anim: 'read', label: 'Art student', lines: LINES.student });
  // ---- desert house
  Cn('partition', 27, 0, { w: 5 }, { flip: true }); Cn('arch', 27, 5, { w: 2, name: 'DESERT' }, { flip: true }); Cn('partition', 27, 7, { w: 4 }, { flip: true });
  Cn('partition', 27, 11, { w: 6 }); Cn('arch', 33, 11, { w: 2, name: 'KOI' }); Cn('partition', 35, 11, { w: 5 });
  Cn('mesa', 35.5, .5); Cn('rock', 33, .5, { w: 2, d: 1, h: 1, c: '#c8764a', seed: 8 }); Cn('rock', 28, .5, { w: 1.5, d: 1, h: .8, c: '#c8764a', seed: 4 });
  Cn('cactus', 29, 1.5, { kind: 'saguaro', h: 3 }); Cn('cactus', 32.5, 2, { kind: 'saguaro', h: 2.4, seed: 5 }); Cn('cactus', 38.5, 4.5, { kind: 'organ', seed: 4 }); Cn('cactus', 30.5, 4, { kind: 'barrel', seed: 7 }); Cn('cactus', 36.5, 7.5, { kind: 'barrel', seed: 9 }); Cn('cactus', 33.5, 5, { kind: 'barrel', seed: 4 });
  Cn('cactus', 28.5, 3.5, { kind: 'prickly' }); Cn('cactus', 36.5, 4, { kind: 'prickly', seed: 3 }); Cn('cactus', 31.5, 8, { kind: 'agave', seed: 2, spike: 1 }); Cn('cactus', 38.5, 8.5, { kind: 'agave', seed: 6 }); Cn('cactus', 28.5, 8.5, { kind: 'yucca' }); Cn('cactus', 34.5, 3, { kind: 'aloe' }); Cn('cactus', 30, 9.5, { kind: 'aloe', seed: 5 });
  Cn('bed', 28, 6.5, { w: 1.5, d: 1.5, kind: 'desert', seed: 7 }); Cn('bench', 36.5, 9.5); Cn('plaque', 30, 2.5, {}, { fact: 'saguaro' }); Cn('plaque', 31.5, 4.5, {}, { fact: 'barrel' }); Cn('lamp', 39, 10);
  S(30.4, 3.5, 3, { p: .6 }); S(33, 6.8, 3); S(35.2, 4.4, 3, { anim: 'phone' }); S(37.6, 6.6, 0, { busy: 1 }); S(32, 5.5, 3, { busy: 1, age: 'kid', lines: LINES.kid });
  // ---- koi garden
  Cn('bed', 27, 11.5, { w: 3.5, d: .5, kind: 'hedge' }, { flip: true }); Cn('arch', 27, 15, { w: 2, name: 'KOI' }, { flip: true }); Cn('bed', 27, 17, { w: 3.5, d: .5, kind: 'hedge' }, { flip: true }); Cn('bed', 27, 20.5, { w: 13, d: 1, kind: 'hedge', seed: 3 });
  Cn('koipond', PX, PY, {}, { anim: 2, pond: 1 }); Cn('bridge', PX + BR.x0, PY + BR.y0, { len: BR.x1 - BR.x0 }); Cn('bridgerail', PX + BR.x0, PY + BR.y1, { len: BR.x1 - BR.x0 });
  Cn('feeder', 28.5, 14, {}, { feed: [30.5, 14.6] }); Cn('feeder', 39, 17.5, {}, { feed: [37.6, 17.4] }); Cn('plaque', 28.5, 17.5, {}, { fact: 'koi' }); Cn('bench', 28, 18.5, {}, { flip: true });
  Cn('maple', 38.5, 19.5); Cn('lantern', 36, 19.5); Cn('bamboo', 38.5, 11.5, { seed: 4 }); Cn('reeds', 31, 12.5, { seed: 3 }); Cn('reeds', 36.5, 13, { seed: 6 }); Cn('reeds', 30.5, 18.5, { seed: 9 });
  S(28.9, 15.3, 0, { age: 'kid', lines: LINES.kid }); S(39.3, 15.2, 2, { p: .5 }); S(34.5, 19.8, 3, { busy: 1, anim: 'phone' }); S(33, 12, 1, { busy: 1 });
  // ---- seasonal flower show
  Cn('bed', 27, 21.5, { w: 2, d: .5, kind: 'hedge', seed: 2 }, { flip: true }); Cn('arch', 27, 23.5, { w: 2, name: 'FLOWERS' }, { flip: true }); Cn('bed', 27, 25.5, { w: 2.5, d: .5, kind: 'hedge', seed: 5 }, { flip: true });
  for (const [x, y, v] of [[28.5, 22.5, 0], [36.5, 22.5, 2], [28.5, 26, 3], [36.5, 26, 1]]) Cn('flowerbed', x, y, { w: 3, d: 2, v, seed: v + 1 }, { seasonal: 1 });
  Cn('showpiece', 32.5, 23.5, {}, { seasonal: 1 }); Cn('banner', 31, 21.5, {}, { seasonal: 1 }); Cn('plaque', 33.5, 26.5, {}, { fact: 'show' }); Cn('urn', 39.5, 25, { seed: 8 }, { seasonal: 1 });
  S(30, 25, 3); S(38, 25, 3, { anim: 'phone' }); S(34.8, 27.4, 3, { p: .6 }); S(33.4, 22.1, 1, { busy: 1 }); S(30.4, 22, 1, { busy: 1, age: 'elder' }); S(37.4, 25.4, 1, { busy: 1, age: 'kid', lines: LINES.kid });
}
build();

/* ---------------- small animated creatures ---------------- */
const KOI = [['#f4f0e8', '#f08a2a', '#f4f0e8', '#f08a2a', '#f08a2a', '#f4f0e8', '#f4e8d8'], ['#e8483b', '#f4f0e8', '#e8483b', '#f4f0e8', '#f4f0e8', '#e8483b', '#f4e0d8'], ['#f0a02a', '#f0a02a', '#f8c84a', '#f0a02a', '#f8c84a', '#f0a02a', '#f8d880'], ['#2a2733', '#f08a2a', '#2a2733', '#f08a2a', '#f4f0e8', '#2a2733', '#8a8a94'], ['#f4f0e8', '#f4f0e8', '#f4f0e8', '#e8483b', '#f4f0e8', '#f4f0e8', '#f4f0e8'], ['#f8d04a', '#f8d04a', '#f4f0e8', '#f8d04a', '#f8d04a', '#f4f0e8', '#f8e8a0']];
function drawKoi(pat, d, f, big) {
  const a = d / 16 * Math.PI * 2, ux = Math.cos(a), uy = Math.sin(a), s = R.PW(0, 0, 0), X = Math.round(s[0]), Y = Math.round(s[1]), L = big ? 5 : 3, P = KOI[pat];
  for (let i = -L; i <= L; i++) { const k = Math.min(6, Math.max(0, Math.round((L - i) * 6 / (2 * L)))), tail = i <= -L + 1, wg = tail ? (f ? 1 : -1) * (i === -L ? 1.2 : .5) : 0, x = X + Math.round(ux * i - uy * wg), y = Y + Math.round(uy * i * .8 + ux * wg * .8);
    R.px(x, y, R.C(P[k])); if (Math.abs(i) < L - 1) { R.px(x - Math.round(uy), y + Math.round(ux), R.C(P[k])); if (big) R.px(x + Math.round(uy), y - Math.round(ux), R.C(P[k])); } if (i === -L) { R.px(x - Math.round(uy), y + Math.round(ux), R.C(P[6])); R.px(x + Math.round(uy), y - Math.round(ux), R.C(P[6])); } }
  R.px(X + Math.round(ux * (L - 1)), Y + Math.round(uy * (L - 1) * .8), R.C('#2a2733'));
}
const angDiff = (a, b) => { let d = (a - b) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; };
class Koi {
  constructor(i, ox, oy) { this.i = i; this.pat = i % KOI.length; this.big = i === 0; this.ox = ox; this.oy = oy; this.a = Math.random() * 6.28; this.sp = .3 + Math.random() * .35; this.t = Math.random() * 9; this.turn = 0; this.v = .3; this.z = .03; this.bb = [-.1, -.1, .1, .1, .04];
    do { this.lx = 1 + Math.random() * (POND.w - 2); this.ly = 1 + Math.random() * (POND.d - 2); } while (pondIn(this.lx, this.ly) < .5); this.x = ox + this.lx; this.y = oy + this.ly; this.jx = (Math.random() - .5) * 1.1; this.jy = (Math.random() - .5) * .9; }
  sprite() { const sx = Math.cos(this.a) - Math.sin(this.a), sy = (Math.cos(this.a) + Math.sin(this.a)) / 2, d = ((Math.round(Math.atan2(sy, sx) / (Math.PI * 2) * 16) % 16) + 16) % 16, f = Math.floor(this.t * (3 + this.v * 5)) & 1; return pixSprite('koi|' + this.pat + '|' + d + '|' + f + (this.big ? 'B' : ''), [-9, -7, 9, 7], () => drawKoi(this.pat, d, f, this.big)); }
  tick(dt, feed) {
    this.t += dt; let v = this.sp, want = null;
    if (feed) { const tx = feed.x + this.jx, ty = feed.y + this.jy, dd = Math.hypot(tx - this.lx, ty - this.ly); want = Math.atan2(ty - this.ly, tx - this.lx); v = dd > .5 ? 1.5 + this.sp : .25; if (dd < .5) want += 1.3; }
    else { this.turn += (Math.random() - .5) * dt * 3; this.turn *= 1 - dt * .8; this.a += this.turn * dt; }
    const nx = this.lx + Math.cos(this.a) * .55, ny = this.ly + Math.sin(this.a) * .55;
    if (pondIn(nx, ny) < .28) want = Math.atan2(POND.d / 2 - this.ly, POND.w / 2 - this.lx);
    else if (!feed) for (const p of POND.pads) if (Math.hypot(p[0] + .15 - nx, p[1] + .1 - ny) < .42) { want = Math.atan2(this.ly - p[1], this.lx - p[0]); break; }
    if (want !== null) this.a += Math.max(-1, Math.min(1, angDiff(want, this.a))) * dt * (feed ? 5 : 3);
    this.v = v; this.lx += Math.cos(this.a) * v * dt; this.ly += Math.sin(this.a) * v * dt; this.x = this.ox + this.lx; this.y = this.oy + this.ly;
    const t = (this.lx - BR.x0) / (BR.x1 - BR.x0), dz = t > 0 && t < 1 ? archZ(t) : -1; this.hidden = dz >= 0 && this.ly + dz > BR.y0 + .05 && this.ly + dz < BR.y1 - .05;
  }
}
function drawFly(sp, f) {
  const s = R.PW(0, 0, 0), X = Math.round(s[0]), Y = Math.round(s[1]), c = R.C(sp.c), e = R.C(sp.c2), b = R.C('#2a2733');
  R.px(X, Y, b); R.px(X, Y - 1, b);
  if (f === 0) { for (const sd of [-1, 1]) { R.px(X + sd, Y - 2, c); R.px(X + sd * 2, Y - 2, c); R.px(X + sd, Y - 1, c); R.px(X + sd * 2, Y - 1, c); R.px(X + sd * 3, Y - 2, e); R.px(X + sd, Y, c); R.px(X + sd * 2, Y, e); R.px(X + sd * 2, Y - 3, e); } }
  else if (f === 1) { for (const sd of [-1, 1]) { R.px(X + sd, Y - 2, c); R.px(X + sd, Y - 1, c); R.px(X + sd, Y - 3, e); R.px(X + sd, Y, e); } }
  else { R.px(X, Y - 2, c); R.px(X, Y - 3, c); R.px(X + 1, Y - 2, c); R.px(X + 1, Y - 3, e); R.px(X, Y - 4, e); }
}
class Fly {
  constructor(i, B, perches) { this.sp = BUTTERFLIES[i % BUTTERFLIES.length]; this.si = i % BUTTERFLIES.length; this.B = B; this.perches = perches; this.x = B[0] + Math.random() * (B[2] - B[0]); this.y = B[1] + Math.random() * (B[3] - B[1]); this.h = .6 + Math.random() * 1.4; this.z = this.h; this.t = Math.random() * 9; this.bb = [-.1, -.1, .1, .1, .2]; this.rest = 0; this.vx = 0; this.vy = 0; this.pickT(); }
  pickT() { if (this.perches.length && Math.random() < .3) { const p = pick(this.perches); this.tx = p.x + (Math.random() - .5) * p.r; this.ty = p.y + (Math.random() - .5) * p.r; this.tz = p.z; this.land = true; } else { this.tx = this.B[0] + Math.random() * (this.B[2] - this.B[0]); this.ty = this.B[1] + Math.random() * (this.B[3] - this.B[1]); this.tz = .5 + Math.random() * 1.8; this.land = false; } }
  sprite() { const f = this.rest > 0 ? (Math.floor(this.t * 1.2) % 3 === 0 ? 0 : 2) : Math.floor(this.t * 10) % 2; return pixSprite('bfly|' + this.si + '|' + f, [-4, -5, 5, 2], () => drawFly(this.sp, f)); }
  tick(dt) {
    this.t += dt; if (this.rest > 0) { if ((this.rest -= dt) <= 0) this.pickT(); return; }
    const dx = this.tx - this.x, dy = this.ty - this.y, dz = this.tz - this.h, d = Math.hypot(dx, dy) || 1e-6, sp = 1.1;
    this.vx += (dx / d * sp - this.vx) * dt * 2 + (Math.random() - .5) * dt * 5; this.vy += (dy / d * sp - this.vy) * dt * 2 + (Math.random() - .5) * dt * 5;
    this.x = Math.max(this.B[0], Math.min(this.B[2], this.x + this.vx * dt)); this.y = Math.max(this.B[1], Math.min(this.B[3], this.y + this.vy * dt)); this.h += Math.max(-.6, Math.min(.6, dz)) * dt * 1.5; this.z = this.h + (this.land && d < .5 ? 0 : Math.sin(this.t * 8) * .06);
    if (d < .22) { if (this.land && Math.abs(dz) < .2) { this.rest = 2 + Math.random() * 6; this.z = this.tz; this.x = this.tx; this.y = this.ty; } else if (!this.land) this.pickT(); }
  }
}
function drawPuff(k) { const s = R.PW(0, 0, 0); R.ellipse(s[0], s[1], 5 + k * 2, 2 + k, '#f4fdff', 'glass'); R.ellipse(s[0] + 1, s[1] - 1, 2 + k, 1 + k * .5, '#ffffff', 'glass'); }
class Puff {
  constructor(src) { this.src = src; this.bb = [-.1, -.1, .1, .1, .2]; this.k = Math.floor(Math.random() * 3); this.reset(true); }
  reset(first) { const s = pick(this.src); this.x = s.x + (Math.random() - .5) * s.w; this.y = s.y + (Math.random() - .5) * s.d; this.z0 = s.z; this.up = s.up; this.life = 2.5 + Math.random() * 3; this.age = first ? Math.random() * this.life : 0; this.dx = (Math.random() - .5) * .3; }
  sprite() { return pixSprite('puff|' + this.k, [-9, -5, 9, 5], () => drawPuff(this.k)); }
  tick(dt) { this.age += dt; if (this.age > this.life) this.reset(); const t = this.age / this.life; this.z = this.z0 + this.up * t; this.x += this.dx * dt; this.alpha = .75 * Math.sin(Math.PI * t); }
}

/* ---------------- walking staff ---------------- */
const GARDEN_SPOTS = [[18, 8.6, 2], [22, 8.6, 0], [7.5, 2.9, 3], [3, 12.9, 3], [32, 25, 0], [18, 3.4, 2], [22.6, 5.6, 3], [30, 25.2, 3], [5.6, 16.6, 3]];
const TOUR = [
  { x: 15.5, y: 16.5, dir: 0, zone: 'lily', say: 'The giant water lily, Victoria amazonica. Every pad could carry a small child. We have tested this. With permission.' },
  { x: 18, y: 9.6, dir: 3, zone: 'palm', say: 'The Palm House. Eighty-five percent humidity, twenty-six degrees, and one waterfall that has run since 1908.' },
  { x: 6.5, y: 4.6, dir: 3, zone: 'grotto', say: 'The grotto. Orchids grow on bark with their roots in the air. They drink mist. Do not water them; they will sulk.' },
  { x: 8.6, y: 13.6, dir: 2, zone: 'butterfly', say: 'Stand still and they will come to you. The blue ones are morphos: no blue pigment at all, only light playing tricks.' },
  { x: 31, y: 6.6, dir: 3, zone: 'desert', say: 'From the wettest room to the driest. That saguaro is younger than it looks, and it still has no arms. Patience.' },
  { x: 28.3, y: 16, dir: 0, zone: 'koi', say: 'Our koi. The big orange lady is Marmalade. She is thirty-one and has opinions about lunch.' },
  { x: 34, y: 27.3, dir: 3, zone: 'show', say: 'And the flower show, new every season. Twelve thousand bulbs, planted by hand. Thank you all for walking with me!' },
];
function makeStaff(sc, spec, label, x, y) { const c = new Char(spec, x + O, y + O); c.speed = 1.5; c.kind = 'staff'; c.label = label; sc.ents.push(c); return c; }

/* ---------------- the room ---------------- */
defineRoom({ id: 'conservatory', name: 'Maple Bay Botanical Conservatory', w: W, d: D, zoom: 0, music: 'quiet', noCrowd: true, showpiece: 'conservatory', venue: CONS_VENUES.place,
  floor: GT.brickpave, bg: '#17222a', edge: '#4a3a34', wall: { color: '#b8674e', trim: '#3d7a68', h: .5 },
  floors: [{ x0: 0, y0: 0, x1: 13, y1: 10, floor: GT.cobble }, { x0: 27, y0: 0, x1: 40, y1: 11, floor: GT.sand }, { x0: 0, y0: 10, x1: 11, y1: 20, floor: GT.gravel }, { x0: 0, y0: 20, x1: 13, y1: 28, floor: GT.f_wood }, { x0: 27, y0: 21, x1: 40, y1: 28, floor: GT.f_tile }, { x0: 27, y0: 11, x1: 40, y1: 21, floor: GT.f_stone }, { x0: 13, y0: 20, x1: 27, y1: 28, floor: GT.plaza }],
  exits: [{ x: 20, y: 27.5, label: 'Exit to Central Park', poi: 'door:conservatory' }], spawn: { x: 20, y: 26.6, dir: 3 }, items, npcSpots: spots, zones: ZONES,
  setup(sc) {
    const Wd = sc.world, setP = (o, q) => { o.p = Object.assign({}, o.p, q); o._key = null; }, objs = Wd.objs, by = k => objs.filter(o => o.data && o.data[k]);
    const sky = by('sky'), anim = by('anim'), seasonal = by('seasonal'), shafts = by('shaft'), gates = by('gate'), rare = by('rare'), board = by('board')[0], mist = by('mist');
    // ---- nav: water blocks, the bridge deck and the stepping slabs do not
    for (let gy = 0; gy < POND.d * 2; gy++) for (let gx = 0; gx < POND.w * 2; gx++) { const lx = gx / 2 + .25, ly = gy / 2 + .25; if (pondIn(lx, ly) > -.12) Wd.block(O + PX + gx / 2, O + PY + gy / 2, O + PX + gx / 2 + .5, O + PY + gy / 2 + .5); }
    Wd.free(O + PX + BR.x0, O + PY + BR.y0 + .5, O + PX + BR.x1, O + PY + BR.y1 - .5); Wd.free(O + PX + BR.x0 - .5, O + PY + BR.y0, O + PX + BR.x0, O + PY + BR.y1); Wd.free(O + PX + BR.x1, O + PY + BR.y0, O + PX + BR.x1 + .5, O + PY + BR.y1);
    Wd.block(O + 19.5, O + 2.5, O + 20.5, O + 13); Wd.free(O + 19.5, O + 5.5, O + 20.5, O + 6.5); Wd.free(O + 19.5, O + 11, O + 20.5, O + 12);
    for (const o of rare) Wd.free(o.B[0], o.B[1], o.B[3], o.B[4]);
    // ---- creatures
    const koi = []; for (let i = 0; i < 14; i++) { const k = new Koi(i, O + PX, O + PY); koi.push(k); sc.ents.push(k); }
    const perches = []; for (const o of by('perch')) { if (o.data.perch === 2) perches.push({ x: o.x + .3, y: o.y + .3, z: .82, r: .3 }, { x: o.x + .3, y: o.y + .3, z: 1.05, r: .1 }); else for (let i = 0; i < 3; i++) perches.push({ x: o.B[0] + .4 + Math.random() * (o.B[3] - o.B[0] - .8), y: o.B[1] + .4 + Math.random() * (o.B[4] - o.B[1] - .8), z: .85 + Math.random() * .3, r: .2 }); }
    const flies = []; for (let i = 0; i < 26; i++) { const f = new Fly(i, [O + .5, O + 10.5, O + 10.6, O + 19.6], perches); flies.push(f); sc.ents.push(f); }
    const src = [{ x: O + 20, y: O + 2.9, z: .1, w: 2.2, d: .5, up: .9 }, { x: O + 20, y: O + 1.6, z: 1.3, w: 1.6, d: .3, up: .8 }];
    for (const o of mist) for (let k = .5; k < 4; k += 1) src.push({ x: o.x + k, y: o.y + .2, z: 2.9, w: .3, d: .3, up: -1.3 });
    const puffs = []; for (let i = 0; i < 16; i++) { const p = new Puff(src); puffs.push(p); sc.ents.push(p); }
    // ---- life: static crowd + lane walkers
    const seats = []; for (const f of sc.fixtures) { const id = f.asset.id; if (!/cons\.bench|cafe\.tableset/.test(id)) continue; f.seats.forEach((s, i) => seats.push({ x: s.x - O, y: s.y - O, z: s.z, dir: s.dir === undefined ? 1 : s.dir, seated: true, p: .45, busy: (seats.length + i) % 3 === 2 ? 1 : 0, bench: /bench/.test(id) })); }
    const cr = crowd(sc, sc.def.npcSpots.concat(seats), { seed: 33, fill: .7, lines: LINES.visitor });
    const N = { h0: [20, 26.6], h1: [15, 22], h2: [26.2, 22.3], hc: [25.8, 24.2], hm: [20, 24.5], w1: [14.8, 19.2], w2: [14.8, 12.3], w3: [13, 16], p1: [18.2, 12.3], p2: [18.2, 5.9], p3: [20, 6.1], g0: [15, 5.8], g1: [12.6, 5.9], g2: [9.5, 5.8], g3: [6.3, 4.4], g4: [4.9, 9.3], b0: [5.5, 10.2], b1: [5.5, 12.7], b2: [9.4, 13.3], b3: [9.6, 16], b4: [11.2, 16], e1: [21.8, 5.9], e2: [26.8, 5.9], e3: [25.4, 16.2], e4: [25.4, 19.4], d1: [30.6, 6.3], d2: [34, 8.4], d3: [34, 11.1], k1: [34, 12.1], k2: [28.3, 12.6], k3: [28.3, 16.25], k4: [27.2, 16.2], k5: [39.3, 16.25], k6: [39.4, 12.9], kb: [34, 16.25], f1: [27.2, 24.6], fa: [28.3, 25.25], fb: [32, 25.25], f2: [32, 27.2], f3: [36, 27.2], f4: [36, 22], f5: [32, 22], cf: [11.6, 24.6] };
    const ROUTES = [['h0', 'h1', 'w1', 'w2', 'p1', 'p2', 'g0', 'g1', 'g2', 'g3*', 'g4', 'b0', 'b1*', 'b2', 'b3', 'b4', 'w3', 'w1', 'h1', 'h0'], ['h0', 'h2', 'e4', 'e3', 'k4', 'k3*', 'k2', 'k1', 'd3', 'd2*', 'd1', 'e2', 'e1', 'p3', 'p2*', 'p1', 'w2', 'w1', 'h1', 'h0'], ['h0', 'h2', 'f1', 'fa', 'fb', 'f2*', 'f3', 'f4', 'f5*', 'fb', 'fa', 'f1', 'h2', 'hc', 'hm', 'h1', 'cf*', 'h1', 'h0'], ['h0', 'h2', 'e4', 'e3', 'k4', 'k3', 'kb*', 'k5', 'k6', 'k1', 'd3', 'd2*', 'd1', 'e2', 'e1', 'p3', 'p2', 'p1', 'w2', 'w1', 'h1', 'h0'], ['h0', 'h1', 'w1', 'w2*', 'p1', 'p2*', 'p3', 'e1', 'e2', 'd1*', 'd2', 'd3', 'k1', 'k2', 'k3*', 'k4', 'e3', 'e4', 'h2', 'f1', 'fa', 'fb', 'f2*', 'fb', 'fa', 'f1', 'h2', 'h0']];
    const lane = () => { const r = pick(ROUTES), stay = r.map(k => k.endsWith('*')), keys = r.map(k => k.replace('*', '')); if (Math.random() < .35) { keys.reverse(); stay.reverse(); }
      return { pts: keys.map((k, i) => Object.assign({ x: N[k][0] + O + (Math.random() - .5) * .5, y: N[k][1] + O + (Math.random() - .5) * .4 }, stay[i] ? { wait: 6 + Math.random() * 6, pose: Math.random() < .4 ? 'phone' : null } : null)), kind: Math.random() < .5 ? 'stroll' : 'walk' }; };
    const wk = walkers(sc, { n: 14, route: lane, lines: LINES.visitor, label: 'Visitor' });
    sc.life = { crowd: cr, walkers: wk, count: () => cr.count() + wk.count(), level: -1 };
    // ---- gardener + docent
    const P = specs(), gspec = Object.assign({}, P.adult[7], { bottom: 'overalls', bottomColor: '#3f6a58', hat: 'sunhat', top: 'long', topColor: '#e8dcc0' });
    const gard = makeStaff(sc, gspec, 'Hattie, head gardener', 18, 8.6); let gi = 0, gw = 5; gard.pose = 'work'; gard.dir = 2;
    sc.interactables.push({ ent: gard, x: gard.x, y: gard.y, label: 'Hattie, head gardener', h: 1.3, hit: 8, range: 1.8, visible: () => !gard.hidden, use: () => { gard._hold = 6; gard.faceTo(G.player.x, G.player.y); gard.pose = null; if (CS()) CS().talkGardener(gard); } });
    const dspec = Object.assign({}, P.staff[2], { topColor: '#2f6a58', hat: 'flatcap' });
    const doc = makeStaff(sc, dspec, 'Wendell, docent', 21.5, 22.4); doc.dir = 1;
    const tour = { on: false, i: -1, wait: 0, joined: false, seen: 0, day: -1, hour: -1, group: [] };
    sc.interactables.push({ ent: doc, x: doc.x, y: doc.y, label: 'Wendell, the docent', h: 1.3, hit: 8, range: 1.8, visible: () => !doc.hidden, use: () => { doc._hold = 4; if (!tour.on) doc.faceTo(G.player.x, G.player.y); if (CS()) CS().talkDocent(doc, tour); } });
    for (let i = 0; i < 3; i++) { const c = new Char(P.adult[10 + i * 3], O + 20.5 + i * .6, O + 23.2); c.speed = 1.6; c.hidden = true; c.kind = 'customer'; sc.ents.push(c); tour.group.push(c); }
    const startTour = force => { if (tour.on) return false; tour.on = true; tour.i = -1; tour.wait = force ? 1.5 : 8; tour.seen = 0; tour.stops = {}; doc.x = O + 21.5; doc.y = O + 22.4; doc.path = null; bubble(doc, 'Guided tour, starting now! Gather round, please.'); tour.group.forEach((c, i) => { c.hidden = false; c.alpha = undefined; c.x = O + 20.4 + i * .6; c.y = O + 23.3; c.path = null; }); G.emit('conservatory:tourstart'); return true; };
    const endTour = () => { tour.on = false; tour.i = -1; tour.group.forEach(c => { c.hidden = true; }); doc.goTo(Wd, O + 21.5, O + 22.4); if (tour.joined && CS()) CS().tourDone(tour); tour.joined = false; };
    // ---- sync with the clock / season / tickets
    let view = null, seas = -1, open = null, tick = 0, wf = 0, ft = 0, fb = 0, lastT = 0, gateOpen = null, hadRare = null, sk = -1, feed = null, bz = false;
    const sync = () => {
      const n = G.now(), h = n.hf, am = ambient(G.state.t, 'clear'), v = am.dark >= .8 ? 'night' : am.dark > .02 || am.amb !== '#ffffff' ? 'dusk' : 'day', wx = /rain|storm|drizzle/.test(String(G.state.weather || '')) ? 'rain' : null, s = n.season || 0, isOpen = h >= CONS_HOURS[0] && h < CONS_HOURS[1];
      if (v !== view || s !== seas || wx !== sc._wx) { view = v; sc._wx = wx; for (const o of sky) setP(o, { time: v, season: s, wx, frame: 0 }); for (const o of shafts) o.hidden = v !== 'day' || !!wx; Wd.bg = v === 'night' ? '#0e1424' : v === 'dusk' ? '#3a2c3c' : s === 3 ? '#8a9aa8' : '#7fa8a0'; }
      if (s !== seas) { seas = s; for (const o of seasonal) setP(o, { season: s }); }
      const tk = !!(CS() && CS().hasTicket()), go = isOpen && tk; if (go !== gateOpen) { gateOpen = go; for (const o of gates) setP(o, { open: go ? 1 : 0 }); }
      const hr = !!(CS() && CS().rareDone()); if (hr !== hadRare) { hadRare = hr; for (const o of rare) o.hidden = !hr; }
      const ns = CS() ? CS().sketches() : 0; if (ns !== sk && board) { sk = ns; setP(board, { n: Math.min(8, ns) }); }
      // crowd level: quiet at opening, busier in the afternoon and on weekends
      const wkend = n.weekday >= 5, lvl = !isOpen ? 0 : (h < 10.5 ? .28 : h < 12 ? .5 : h < 17 ? .68 : .42) + (wkend ? .22 : 0), busy = isOpen && (wkend ? h >= 10.5 && h < 18 : h >= 13 && h < 16.5);
      if (lvl !== sc.life.level || busy !== bz || isOpen !== open) { sc.life.level = lvl; bz = busy; open = isOpen; for (const c of cr.list) { const sp = c.spot; c.hidden = sp.kind === 'staff' ? false : !isOpen || (sp.busy ? !busy || c.roll > lvl + .25 : c.roll > (sp.p !== undefined ? Math.min(sp.p, lvl + .1) + (lvl > .8 ? .2 : 0) : lvl)); } wk.setActive(!isOpen ? 0 : Math.round(3 + lvl * 12), !isOpen); gard.hidden = false; doc.hidden = !isOpen; }
      // guided tours at the set hours
      if (isOpen && !tour.on) for (const th of TOUR_TIMES) if (h >= th && h < th + .25 && (tour.day !== n.day || tour.hour !== th)) { tour.day = n.day; tour.hour = th; startTour(false); }
      sc.life.open = isOpen;
    };
    sc.cons = { koi, flies, puffs, gardener: gard, docent: doc, tour, startTour, endTour, sync, feed(x, y, sec = 14) { feed = { x: x - PX, y: y - PY, t: sec }; }, feeding: () => !!feed, view: () => view, routes: ROUTES, zoneAt: (x, y) => { for (const z of ZONES) if (x >= z.x0 && x < z.x1 && y >= z.y0 && y < z.y1) return z; return null; }, nodes: N };
    sc.env = t => { const o = ambient(t, G.state.weather); return { amb: o.amb === '#ffffff' ? o.amb : R.mix(o.amb, '#ffffff', .22), dark: Math.min(.9, (o.dark || 0) * .92), bg: Wd.bg, night: o.night }; };
    sync();
    const onBridge = c => { const lx = c.x - O - PX, ly = c.y - O - PY, t = (lx - BR.x0) / (BR.x1 - BR.x0); return t > 0 && t < 1 && ly > BR.y0 - .1 && ly < BR.y1 + .1 ? archZ(t) : 0; };
    const u0 = sc.update; sc.update = (dt, gm) => {
      u0(dt, gm); cr.update(dt); wk.update(dt);
      if ((tick -= dt) <= 0) { tick = 1.5; sync(); }
      // water + mist frames
      if ((ft += dt) > .22) { ft = 0; fb++; for (const o of anim) { const div = o.data.anim === 3 ? 1 : 2; if (fb % div === 0) setP(o, { frame: (fb / div) % (o.a.frames || 4) }); } if ((seas === 3 || sc._wx) && fb % 3 === 0) { wf = (wf + 1) % 4; for (const o of sky) setP(o, { frame: wf }); } }
      if (feed && (feed.t -= dt) <= 0) feed = null;
      for (let i = 0; i < koi.length; i++) koi[i].tick(dt, feed); for (let i = 0; i < flies.length; i++) flies[i].tick(dt); for (let i = 0; i < puffs.length; i++) puffs[i].tick(dt);
      // the arched bridge lifts whoever is on it
      const p = G.player; if (!G.busy) { const z = onBridge(p); if (z > 0 || p._consZ) { p.zoff = z; p._consZ = z > 0; } }
      for (let i = 0; i < wk.list.length; i++) { const c = wk.list[i].ch; if (!c.hidden) c.z = onBridge(c); }
      // ticket line: the two gates north of the hall
      if (!gateOpen && p.y < O + 20.2 && p.x > O + 13 && p.x < O + 27 && !G.busy) { p.y = O + 20.45; p.stop(); G.target = null; G.pending = null; if (G.time - lastT > 3) { lastT = G.time; toast(sc.life.open ? '"Ticket, please!" Day tickets are at the desk just behind you.' : 'The garden gates are locked for the night.', 'info', 3200); } }
      // gardener: potter between beds, watering
      if (gard._hold > 0) { gard._hold -= dt; gard.moving = false; gard.t += dt; }
      else if (gard.path) { gard.pose = null; gard.move(Wd, dt); if (!gard.path) { gard.dir = GARDEN_SPOTS[gi][2]; gard.pose = 'work'; gw = 9 + Math.random() * 9; } }
      else { gard.t += dt; gard.moving = false; if (!gard.pose) { gard.pose = 'work'; gard.dir = GARDEN_SPOTS[gi][2]; } if ((gw -= dt) <= 0) { gi = (gi + 1 + Math.floor(Math.random() * 3)) % GARDEN_SPOTS.length; if (!gard.goTo(Wd, GARDEN_SPOTS[gi][0] + O, GARDEN_SPOTS[gi][1] + O)) gw = 3; } }
      // docent + tour group
      if (doc._hold > 0 && !tour.on) { doc._hold -= dt; doc.t += dt; doc.moving = false; }
      else if (tour.on) {
        if (doc.path) { doc.pose = null; doc.speed = tour.fast ? 3.3 : 1.5; doc.move(Wd, dt); if (!doc.path) { const st = TOUR[tour.i]; if (st) { doc.dir = st.dir; doc.pose = 'talk'; bubble(doc, st.say, 5200); tour.wait = tour.fast ? 1.5 : 9; if (Math.hypot(p.x - doc.x, p.y - doc.y) < 5.5 && tour.joined) { tour.seen++; tour.stops[st.zone] = 1; G.emit('conservatory:tourstop', st.zone); } } } }
        else { doc.t += dt; doc.moving = false; if ((tour.wait -= dt) <= 0) { tour.i++; doc.pose = null; const st = TOUR[tour.i]; if (!st) endTour(); else if (!doc.goTo(Wd, st.x + O, st.y + O)) { doc.x = st.x + O; doc.y = st.y + O; } } }
        tour.group.forEach((c, i) => { if (c.hidden) return; const tx = doc.x - .5 + (i - 1) * .7, ty = doc.y + .9 + (i % 2) * .5; if ((c._rt = (c._rt || 0) - dt) <= 0 && Math.hypot(tx - c.x, ty - c.y) > 1.3) { c._rt = 1 + Math.random(); c.goTo(Wd, tx, ty); } if (c.path) c.move(Wd, dt); else { c.moving = false; c.t += dt; c.faceTo(doc.x, doc.y); } c.z = onBridge(c); });
        if (tour.joined && !G.busy && !G.modal) { const d = Math.hypot(p.x - doc.x, p.y - doc.y); if (d > 2.4 && !p.path && (tour._ft = (tour._ft || 0) - dt) <= 0) { tour._ft = .8; p.goTo(Wd, doc.x - .3, doc.y + 1.3); } }
      } else { if (doc.path) doc.move(Wd, dt); else { doc.t += dt; doc.moving = false; doc.pose = null; doc.dir = 1; } }
    };
    const e0 = sc.onEnter; sc.onEnter = (o, pv) => { e0(o, pv); view = null; sync(); if (CS()) CS().arrived(sc); };
    const x0 = sc.onExit; sc.onExit = () => { x0(); const p = G.player; if (p._consZ) { p.zoff = 0; p._consZ = false; } if (tour.on) { tour.joined = false; } };
  },
});

registerInfo('Maple Bay Botanical Conservatory', {
  blurb: 'A Victorian glass palm house in Central Park. Walk from a steaming jungle with a waterfall to a bone-dry desert, a dim orchid grotto, a room full of loose butterflies and a koi pond with a red bridge. The flower show by the door changes every season.',
  signature: 'The giant Victoria water-lily pool under the central dome, and Marmalade the koi.',
  tryThis: ['Feed the koi from the dispenser and watch them race over', 'Photograph a butterfly at a nectar dish: wait for the wings to open', 'Sketch the orchids in the grotto and pin your drawing to the board', 'Join the guided tour at 10:00, 13:00 or 16:00', 'Read all twelve plant plaques', 'Sit on a bench and just breathe', 'Take a seedling home from Garden Gifts', 'Ask Hattie the head gardener if she needs anything'],
  activities: ['cons_feed_koi', 'cons_read_plaque', 'cons_sketch', 'cons_photo', 'cons_breathe', 'cons_tour', 'cons_seedling'],
});

const only = fn => (fx, scene) => (scene.def && scene.def.showpiece === 'conservatory' ? fn(fx, scene) : null);
export function init() {
  registerFixture('cons_bench', only((fx, sc) => ({ label: 'Sit and breathe', hit: 12, use: () => CS() && CS().sit(fx, sc) })));
  registerFixture('cons_plaque', only((fx, sc) => (fx.item.fact ? { label: fx.item.fact === 'rare' ? 'Plaque: Rare Finds' : 'Read the plaque', hit: 10, visible: () => !fx.ob.hidden, use: () => CS() && CS().readFact(fx.item.fact) } : null)));
  registerFixture('cons_koifeed', only((fx, sc) => ({ label: 'Feed the koi (50c)', hit: 12, use: () => CS() && CS().feedKoi(fx, sc) })));
  registerFixture('cons_bfly', only((fx, sc) => ({ label: 'Photograph a butterfly', hit: 12, use: () => CS() && CS().photograph(sc) })));
  registerFixture('cons_sketch', only((fx, sc) => ({ label: 'Sketch the orchids', hit: 14, use: () => CS() && CS().sketch(fx, sc) })));
  registerFixture('cons_board', only(() => ({ label: 'Visitor sketches', hit: 12, use: () => CS() && CS().lookBoard() })));
  registerFixture('cons_seedling', only((fx, sc) => ({ label: 'Buy a seedling', hit: 12, use: () => CS() && CS().buySeedling() })));
  registerFixture('cons_shop', only(fx => ({ label: fx.item.label, hit: 14, shop: fx.item.venue, use: () => G.shop && G.shop.open(fx.item.venue, { checkHours: true }) })));
  registerFixture('cons_ticket', only(() => ({ label: 'Tickets & tours', hit: 14, use: () => CS() && CS().desk() })));
  registerFixture('cons_map', only(() => ({ label: 'Map of the glasshouse', use: () => toast('You are in the Entrance Hall. Ahead: the Lily Pool, then the Palm House and its waterfall. Left: the Grotto and the Butterfly Room. Right: the Desert House and the Koi Garden. The Flower Show and the cafe are either side of the door.', 'info', 7000) })));
  registerFixture('cons_pool', only(() => ({ label: 'Lily pool: make a wish', hit: 20, range: 1.2, use: () => CS() && CS().wish() })));
  registerFixture('cons_waterfall', only(() => ({ label: 'The waterfall', hit: 20, range: 1.6, use: () => { bubble(G.player, pick(['Ahh. Cool mist.', 'I could stand here all day.', 'Is that a tiny frog? ...No. A leaf.'])); try { G.needs.add('fun', 2); } catch (e) { } } })));
  registerFixture('cons_gate', only(() => ({ label: 'Garden gate', hit: 10, range: 1.6, use: () => { const c = CS(); toast(!c || !c.isOpen() ? 'Locked. The garden opens at 9:00.' : c.hasTicket() ? 'Your ticket is good all day. Go on through.' : 'Garden tickets are $4 at the desk. The flower show and the cafe are free.', 'info', 3600); } })));
}
