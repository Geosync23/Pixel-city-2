// Museum of Maple Bay — room `museum` (46 x 32), entered by the city door `door:museum` at the head of Maple Avenue.
// Zones (room coords, (0,0) = back corner; def.zones / scene.mus.zoneAt(x, y)):
//   Grand Hall (x16-30, whole depth: Marge the tyrannosaur, the hanging whale, info desk, cloakroom, donation box, exit)        Natural History (x0-16, y0-16: dioramas, minerals, fossils, dig pit)
//   City History (x0-16, y16-26: photographs, timeline, city model, cases, the curator)   Cafe Ammonite (x0-16, y26-32)       Art Wing (x30-46, y0-18: 22 paintings, 6 sculptures, sketch benches)
//   Special Exhibition (x30-46, y18-27: changes with the season)                          The Museum Shop (x30-46, y27-32)
// The hall, cafe and shop are free; the four wings need a ticket (G.museum.hasTicket()): without one you are turned back at the columns.
// The room runs its own life (def.noCrowd): scene.life = { crowd, walkers, count() }, scene.mus = { tour, startTour(force), school, docent, curator, sync(), zoneAt, light(d), nodes }.
// Fixture tags handled here (only inside this room): mus_ex (item.ex), mus_dig, mus_model, mus_bench (+ item.pic = sketch bench), mus_donate, mus_audio (item.p.n), mus_photo (item.spot), mus_map, mus_board,
//   + item tags mus_shop (item.venue), mus_ticket, mus_cloak. Pictures on walls get their own "Look" interactables in setup. Gameplay lives in sim/museum.js (G.museum).
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
import { pic, picW, SEASON_C } from '../../art/showpiece/_mus_lib.js';
import { MUS_VENUES, MUS_HOURS, TOUR_TIMES, FREE_EVE, SPECIALS, EXHIBITS } from '../../data/museum.js';

const W = 46, D = 32, O = 1, pick = a => a[Math.floor(Math.random() * a.length)];
const MS = () => G.museum;
const items = [], spots = [];
const M = (id, x, y, p, o) => { const it = Object.assign({ id: 'furn.mus.' + id, x, y, p: p || {} }, o); items.push(it); return it; };
const Wl = (id, wall, at, p, o) => { const it = Object.assign({ id: 'furn.mus.' + id, wall, at, p: p || {} }, o); items.push(it); return it; };
const S = (x, y, dir, o) => spots.push(Object.assign({ x, y, dir }, o));

export const ZONES = [
  { id: 'nh', name: 'Natural History', x0: 0, y0: 0, x1: 15.65, y1: 16, ticket: 1 }, { id: 'hist', name: 'City History', x0: 0, y0: 16, x1: 15.65, y1: 26, ticket: 1 }, { id: 'cafe', name: 'Cafe Ammonite', x0: 0, y0: 26, x1: 16, y1: 32 },
  { id: 'art', name: 'Art Wing', x0: 30.35, y0: 0, x1: 46, y1: 18, ticket: 1 }, { id: 'special', name: 'Special Exhibition', x0: 30.35, y0: 18, x1: 46, y1: 27, ticket: 1 }, { id: 'shop', name: 'The Museum Shop', x0: 30, y0: 27, x1: 46, y1: 32 },
  { id: 'hall', name: 'Grand Hall', x0: 15.65, y0: 0, x1: 30.35, y1: 32 },
];
const LINES = {
  visitor: ['Forty teeth. I counted. Then I counted again from further away.', 'I only came in to get out of the rain and now I have opinions about amethyst.', 'They say two-thirds of Marge is real. Nobody will tell me which third is not.', 'The yellow umbrella is the best thing in the whole building.', 'My grandfather carried one of those whale ribs up the hill. So he said.', 'I could look at Harbour at Dawn for an hour. I have, actually.', 'The special exhibition changes every season. I never miss one.', 'Free on Friday evenings, you know. The whole town comes.'],
  kid: ['It is a REAL dinosaur! Mostly!', 'I found a tooth in the dig pit! A SHARK tooth!', 'Can we light up our street on the model again?', 'The robot looked at me. It did. It LOOKED at me.', 'Why is the whale on the ceiling?'],
  student: ['Shh. I am counting the pinks in the sky.', 'Our class has to draw one sculpture each. I got the knot. Typical.', 'If you sit here long enough the painting starts looking back.'],
  guard: ['Please do not touch the bones. They have been through enough.', 'Photography is fine. Flash is not. Marge is sensitive.', 'Thirty-one years on this floor and that whale has never once blinked.', 'Closing at six. Nine on Fridays.'],
  desk: ['Welcome to the Museum of Maple Bay. Tickets, audio guides and scavenger cards right here.', 'Tours leave from this desk at eleven, two and four.', 'Members walk straight in. It pays for itself in seven visits.'],
  cloak: ['Coats and bags, no charge. You will enjoy the paintings more with your hands free.', 'I have never lost a coat. One umbrella, in 1998. I still think about it.'],
  cafe: ['The soup is tomato. It is always tomato. People would riot.', 'Fossil shortbread came out of the oven ten minutes ago.', 'Sit anywhere. The paintings in here are real too, mind.'],
  shop: ['The plush Rex is our best seller. The geodes are a close second.', 'Every print is one of ours: you can go and see the real thing first.', 'The sketching kit pays for itself in the art wing.'],
  teacher: ['Two lines, please! Bartholomew, that is not a line.', 'Who can tell me what Marge ate? ...No, not "people".', 'We look with our eyes, not with our fingers.'],
};

/* ---------------- layout ---------------- */
const COLY = [1, 4.5, 8, 11.5, 15, 18.5, 22, 25.5];
function build() {
  // ---- grand hall
  for (const y of COLY) { M('column', 15.65, y); M('column', 29.65, y); } M('column', 29.65, 29);
  for (const [x, y, nm, c] of [[15.9, 5.3, 'NATURE', '#3f5a50'], [15.9, 19.3, 'HISTORY', '#6a4a3a'], [29.9, 5.3, 'ART', '#7a2f3a'], [29.9, 19.3, 'SPECIAL', '#2c3a5e']]) M('wingsign', x, y, { w: 2.6, name: nm, c }, { flip: true, z: 2.75 });
  for (const at of [17, 21.5, 26]) Wl('window', 'y', at, {}, { win: 1 });
  M('whale', 18.5, 2.2, {}, { z: 2.5, ex: 'whale' }); M('skeleton', 19.5, 8, {}, { ex: 'marge' });
  M('photospot', 20.5, 11, {}, { spot: 'marge' }); M('audiopost', 26.8, 10.8, { n: 1 }); M('audiopost', 17, 3.6, { n: 2 });
  M('banner', 16.7, 12.6, {}, { z: 1.75, seasonal: 1 }); M('banner', 28.1, 12.6, {}, { z: 1.75, seasonal: 1 });
  M('desk', 21, 20, { kind: 'info', w: 4 }, { tags: ['mus_ticket', 'info'] }); S(23, 19.55, 1, { kind: 'staff', label: 'Info & tickets', lines: LINES.desk });
  M('mapboard', 17.3, 23.5); M('donation', 27.4, 23.6); M('bench', 17, 16, { c: '#34506a' }); M('bench', 27, 16, { c: '#34506a' });
  M('shelf', 17, 26.9, { kind: 'coats', w: 3 }); M('desk', 17, 28.1, { kind: 'cloak', w: 3 }, { tags: ['mus_cloak'] }); S(18.5, 27.65, 1, { kind: 'staff', label: 'Cloakroom', lines: LINES.cloak });
  M('plant', 16.6, 30.6, { seed: 2 }); M('plant', 28.5, 24.6, { seed: 5 }); M('rope', 19.6, 11.2, { w: 2 }); M('rope', 24.4, 11.2, { w: 2 });
  S(27.6, 14.6, 2, { kind: 'staff', label: 'Gallery guard', lines: LINES.guard }); S(22.4, 12.4, 3, { p: .8 }); S(24.2, 12.6, 3, { age: 'kid', lines: LINES.kid, p: .7 }); S(25, 12.4, 3, { p: .6, anim: 'phone' }); S(21.2, 6.6, 1, { busy: 1 }); S(18.3, 22.6, 3, { p: .5 }); S(27, 21.3, 2, { busy: 1, anim: 'phone' }); S(22, 21.4, 3, { p: .6 }); S(24.2, 21.5, 3, { busy: 1 }); S(27.4, 24.8, 3, { busy: 1, age: 'elder' }); S(20.3, 13.6, 3, { busy: 1, age: 'kid', lines: LINES.kid });
  // ---- natural history
  [0, 1, 2].forEach(k => Wl('diorama', 'y', .5 + k * 5, { k }, { ex: 'dio' + k })); Wl('mural', 'x', 2, { kind: 'strata', w: 8 }, { ex: 'strata' });
  M('ptero', 5.6, 7.2, {}, { z: 2.6, ex: 'ptero' });
  M('case', 3.4, 4, { kind: 'minerals' }, { ex: 'minerals', anim: 1 }); M('case', 7, 4, { kind: 'fossils' }, { ex: 'fossils' }); M('case', 10.6, 4, { kind: 'shells' }, { ex: 'shells' });
  M('digpit', 8.5, 9, { stage: 1 }, { dig: 1 }); M('audiopost', 5.7, 5.3, { n: 3 }); M('audiopost', 13.3, 12.3, { n: 4 }); M('audiopost', 4.8, 1.2, { n: 5 });
  M('bench', 3.2, 9.6); M('plant', 1, 12.6, { seed: 7 }); M('plant', 14.4, .8, { seed: 4 });
  S(14.3, 13.6, 2, { kind: 'staff', label: 'Gallery guard', lines: LINES.guard }); S(2.4, 1.3, 3, { p: .7 }); S(7.4, 1.4, 3, { age: 'kid', lines: LINES.kid, p: .6 }); S(12.4, 1.4, 3, { busy: 1 }); S(4.4, 5.6, 3, { p: .6 }); S(8, 5.6, 3, { busy: 1, anim: 'phone' }); S(11.6, 5.6, 3, { p: .5, age: 'elder' });
  S(9.3, 12.5, 3, { age: 'kid', anim: 'work', lines: LINES.kid, p: .9 }); S(12.2, 12.5, 3, { age: 'kid', anim: 'work', lines: LINES.kid, p: .7 }); S(13.5, 10.4, 2, { age: 'kid', anim: 'work', lines: LINES.kid, busy: 1 }); S(7.9, 10.6, 0, { busy: 1 }); S(1.4, 5.8, 2, { busy: 1 });
  // ---- city history
  M('artwall', 0, 16, { w: 6.5, pics: ['ph_harbour', 'ph_crew', 'ph_cannery'], c: '#3f5a50', ph: .95 }, { pics: 1 }); M('artwall', 9.5, 16, { w: 6, pics: ['ph_viaduct', 'ph_tram', 'ph_air'], c: '#3f5a50', ph: .95 }, { pics: 1 });
  Wl('mural', 'x', 17.4, { kind: 'timeline', w: 8 }, { ex: 'timeline' }); M('citymodel', 6.5, 19, {}, { model: 1 });
  M('case', 1.2, 18.6, { kind: 'ship' }, { ex: 'ship' }); M('case', 1.2, 20.8, { kind: 'tins' }, { ex: 'tins' }); M('case', 1.2, 23, { kind: 'found' }, { ex: 'found', found: 1 });
  M('case', 12.8, 18.6, { kind: 'tram' }, { ex: 'tram' }); M('case', 12.8, 21, { kind: 'plane' }, { ex: 'plane' }); M('audiopost', 11.8, 23.3, { n: 8 }); M('audiopost', 3.5, 21.4, { n: 9 }); M('photospot', 5.2, 23.2, {}, { spot: 'model' });
  S(14.4, 23.6, 2, { kind: 'staff', label: 'Gallery guard', lines: LINES.guard }); S(2, 17.3, 3, { p: .6 }); S(4.4, 17.3, 3, { busy: 1, age: 'elder' }); S(11.2, 17.3, 3, { p: .5 }); S(13.4, 17.3, 3, { busy: 1 }); S(7.4, 23.6, 3, { age: 'kid', lines: LINES.kid, p: .7 }); S(10.6, 23.7, 3, { p: .6 }); S(12, 20.4, 0, { busy: 1 }); S(3.6, 19.4, 2, { busy: 1, anim: 'phone' }); S(5.8, 20.6, 0, { p: .4 });
  // ---- cafe
  M('artwall', 0, 26, { w: 11, pics: ['pears', 'ph_market', 'market', 'ph_pier'], c: '#e9e4d8', ph: 1 }, { pics: 1 });
  M('desk', 1, 28, { kind: 'cafe', w: 3 }, { tags: ['mus_shop'], venue: MUS_VENUES.cafe, label: 'Cafe Ammonite' }); S(2.5, 27.55, 1, { kind: 'staff', outfit: 'cook', label: 'Cafe Ammonite', lines: LINES.cafe });
  for (const [x, y] of [[5.6, 28], [9, 28], [5.6, 30], [9, 30], [12.4, 29]]) items.push({ id: 'furn.cafe.tableset', x, y, p: { c: '#7a2f3a', cc: '#f4ead0' }, cafe: 1 });
  M('plant', 11.4, 26.6, { seed: 3 }); M('plant', .6, 30.8, { seed: 9 }); S(2.5, 29.5, 3, { p: .6 }); S(3.4, 29.6, 3, { busy: 1, anim: 'phone' });
  // ---- art wing
  [['cannery', 30.6], ['field', 32.7], ['tide', 34.8], ['roofs', 40.4], ['fog', 42.5]].forEach(([k, at]) => Wl('painting', 'y', at, { k, h: 1.15 }, { pic: k })); Wl('painting', 'y', 37, { k: 'dawn', h: 1.9 }, { pic: 'dawn', mount: .9 });
  M('artwall', 31.3, 6, { w: 6.5, pics: ['bright', 'maple7', 'storm', 'wheel'] }, { pics: 1 }); M('artwall', 38.8, 6, { w: 7, pics: ['tram', 'cat', 'rain', 'diner'] }, { pics: 1 });
  M('artwall', 31.3, 12, { w: 6.5, pics: ['planes', 'koi', 'orbit', 'moon'] }, { pics: 1 }); M('artwall', 38.8, 12, { w: 7, pics: ['viaduct', 'conductor', 'six', 'dancers'] }, { pics: 1 });
  [[33.4, 3.2], [42.6, 3.2], [35.4, 9.2], [43.4, 9.2], [33.4, 15], [43, 15]].forEach(([x, y], k) => M('sculpture', x, y, { k }, { ex: 'sc' + k }));
  M('bench', 37.5, 3.4, {}, { pic: 'dawn' }); M('bench', 32, 8.4, {}, { pic: 'maple7' }); M('bench', 40.2, 14.4, {}, { pic: 'conductor' }); M('sketchboard', 36, 15.4, { ids: [] }, { board: 1 });
  M('audiopost', 36.3, 1.3, { n: 6 }); M('audiopost', 34.7, 3.5, { n: 7 }); M('plant', 45, 16.6, { seed: 6 });
  S(45.2, 4.4, 2, { kind: 'staff', label: 'Gallery guard', lines: LINES.guard }); S(38, 2, 3, { p: .7 }); S(39.6, 2.2, 3, { busy: 1, anim: 'phone' }); S(31.6, 1.5, 3, { p: .5 }); S(41.2, 1.5, 3, { p: .5, age: 'elder' }); S(43.8, 1.6, 3, { busy: 1 });
  S(33.2, 7.2, 3, { p: .6 }); S(36.2, 7.2, 3, { busy: 1 }); S(40.4, 7.3, 3, { p: .6 }); S(43.6, 7.4, 3, { busy: 1, anim: 'phone' }); S(34.6, 13.2, 3, { p: .5, anim: 'read', label: 'Art student', lines: LINES.student }); S(42, 13.3, 3, { p: .6 }); S(44.4, 13.3, 3, { busy: 1, age: 'kid', lines: LINES.kid }); S(34.6, 16.2, 0, { busy: 1 });
  // ---- special exhibition
  M('backdrop', 32.5, 18, { w: 13.5 }, { seasonal: 1, about: 1 }); items.push({ id: 'furn.mus.special', x: 37, y: 20.6, p: {}, seasonal: 1, ex: 'sp_centre' }); M('case', 33, 21.2, { kind: 'eggs' }, { ex: 'sp_side', side: 1 });
  M('photospot', 41.2, 22, {}, { spot: 'special' }); M('audiopost', 36.3, 23.4, { n: 10 }); M('bench', 42.4, 24.2); M('rope', 37, 23.2, { w: 3.4 });
  S(45.2, 22.6, 2, { kind: 'staff', label: 'Gallery guard', lines: LINES.guard }); S(35.6, 19.6, 3, { p: .6 }); S(41.6, 19.6, 3, { p: .5 }); S(38.4, 24.2, 3, { age: 'kid', lines: LINES.kid, p: .8 }); S(39.6, 24.3, 3, { p: .7 }); S(34, 22.8, 3, { busy: 1 }); S(43.8, 20.4, 3, { busy: 1, anim: 'phone' }); S(36.4, 24.6, 3, { busy: 1, age: 'elder' });
  // ---- shop
  M('shelf', 32.6, 27, { kind: 'gift', w: 3.4, seed: 4, name: 'MUSEUM SHOP' });   // (QA round 3: 'THE MUSEUM SHOP' ran off the shelf top) M('shelf', 36.2, 27, { kind: 'books', w: 3, seed: 6 }); M('shelf', 39.4, 27, { kind: 'gift', w: 3.2, seed: 9 }); M('shelf', 42.8, 27, { kind: 'books', w: 3, seed: 2 });
  M('desk', 41, 29.4, { kind: 'shop', w: 3 }, { tags: ['mus_shop'], venue: MUS_VENUES.shop, label: 'The Museum Shop' }); S(42.5, 28.95, 1, { kind: 'staff', label: 'The Museum Shop', lines: LINES.shop });
  M('giftstand', 32.6, 29.4, { seed: 3 }); M('giftstand', 36.4, 29.6, { seed: 8 }); M('plant', 45, 30.8, { seed: 8 });
  S(34.6, 28.2, 3, { p: .6 }); S(38, 28.2, 3, { p: .5 }); S(35.2, 30.6, 2, { busy: 1, age: 'kid', lines: LINES.kid }); S(40.4, 28.3, 3, { busy: 1 }); S(42.5, 31, 3, { busy: 1 });
}
build();

const TOUR = [
  { x: 23, y: 12.4, dir: 3, zone: 'hall', ex: 'marge', say: 'This is Marge. Sixty-six million years old, found by a road crew in 1962, and named after the foreman\'s mother, who was said to have the same smile.' },
  { x: 5.6, y: 5.7, dir: 3, zone: 'nh', ex: 'minerals', say: 'Our minerals. Hold still and watch the amethyst: the case lights are set so every crystal gets its moment.' },
  { x: 10.7, y: 12.7, dir: 3, zone: 'nh', ex: 'digpit', say: 'The dig pit. Under the sand is a real fossil bed. The children have found more this year than the university has.' },
  { x: 9, y: 23.7, dir: 3, zone: 'hist', ex: 'model', say: 'The whole city at one to fifteen hundred. Nine winters of work by the model railway club. Press a button; go on.' },
  { x: 38.4, y: 3, dir: 3, zone: 'art', ex: 'p:dawn', say: 'Harbour at Dawn, by Elspeth Marrow, 1907. She painted it in one cold morning from the fish pier. The museum was built to give it a wall.' },
  { x: 38.7, y: 24.2, dir: 3, zone: 'special', ex: 'sp_centre', say: 'And our special exhibition, new every season. Thank you all for walking with me. The cafe does a very good shortbread.' },
];
const SCHOOL = [[23, 12.6, 3], [10.7, 12.9, 3], [7.4, 1.8, 3], [9, 23.9, 3], [38.6, 24.4, 3], [23, 12.6, 3]];
const N = { h0: [23, 30.4], h1: [23, 22.6], hw: [18.2, 17.6], he: [28, 17.6], hn1: [18, 12.6], hn2: [28.2, 12.6], hs: [23.4, 12.9], hnw: [18, 6.6], hne: [28.4, 6.6],
  n1: [14.4, 6.5], n2: [9, 6.3], n3: [4.6, 6.4], n4: [2.6, 1.6], n5: [7.6, 1.7], n6: [12.6, 1.7], n7: [10.8, 13], n8: [8, 14.4], c1: [8, 17.6], c3: [3.2, 17.4], c4: [12.2, 17.5], c5: [9, 24], c6: [5.4, 21.2], c7: [14.4, 20.4], hc: [17.4, 20.4],
  a1: [30.8, 6.6], a2: [30.8, 3], a3: [35, 2.3], a4: [38.3, 3], a5: [43.4, 2.2], a6: [38.3, 9.6], a7: [34, 7.5], a8: [42, 7.5], a10: [38.3, 15.4], a11: [34.4, 13.5], a12: [41.6, 13.5], a13: [30.8, 15.6], a14: [30.9, 19.4],
  s0: [30.9, 20.5], s1: [35.4, 19.6], s3: [38.6, 24.6], s4: [43.6, 23.2], hx: [28.4, 20.5], g0: [28.6, 27.6], g1: [31.6, 28.6], g2: [35, 28.5], g3: [39.4, 30.8], k0: [16.7, 26.7], kh: [17.3, 24.8], k1: [13.4, 27.5], k2: [7.6, 29.3] };
const ROUTES = [
  ['h0', 'h1', 'hw', 'hn1', 'hnw', 'n1', 'n2*', 'n3', 'n4*', 'n5', 'n6*', 'n2', 'n7*', 'n8', 'c1', 'c3*', 'c1', 'c4*', 'c1', 'c6', 'c5*', 'c7', 'hc', 'h1', 'h0'],
  ['h0', 'h1', 'he', 'hn2', 'hne', 'a1', 'a2', 'a3*', 'a4*', 'a5*', 'a4', 'a6', 'a7*', 'a6', 'a8*', 'a6', 'a10', 'a11*', 'a10', 'a12*', 'a10', 'a13', 'a14', 's0', 's1*', 's3*', 's0', 'hx', 'h1', 'h0'],
  ['h0', 'h1', 'hs*', 'hn2', 'he', 'hx', 'g0', 'g1', 'g2*', 'g3*', 'g1', 'g0', 'h0'],
  ['h0', 'h1', 'hs*', 'hn1', 'hw', 'kh', 'k0', 'k1', 'k2*', 'k1', 'k0', 'kh', 'h1', 'h0'],
  ['h0', 'h1', 'hs*', 'hn1', 'hnw', 'n1', 'n2', 'n7*', 'n8', 'c1', 'c5*', 'c7', 'hc', 'h1', 'hx', 's0', 's1*', 's3*', 's4*', 's3', 's0', 'hx', 'h1', 'h0'],
];

/* ---------------- the room ---------------- */
defineRoom({ id: 'museum', name: 'Museum of Maple Bay', w: W, d: D, zoom: 0, music: 'quiet', noCrowd: true, showpiece: 'museum', venue: MUS_VENUES.place,
  floor: GT.f_stone, bg: '#1c1a22', edge: '#4a4038', wall: { color: '#ded6c2', trim: '#8a7a5a', h: 3.8, rail: 1.0 },
  exits: [{ x: 23, y: 31.5, label: 'Exit to Maple Avenue', poi: 'door:museum' }], spawn: { x: 23, y: 30.5, dir: 3 }, items, npcSpots: spots, zones: ZONES,
  setup(sc) {
    const Wd = sc.world, setP = (o, q) => { o.p = Object.assign({}, o.p, q); o._key = null; }, objs = Wd.objs, by = k => objs.filter(o => o.data && o.data[k]);
    const wins = by('win'), seasonal = by('seasonal'), anim = by('anim'), found = by('found'), board = by('board')[0], side = by('side')[0], model = by('model')[0], pit = by('dig')[0];
    // ---- floors (one decal; indoor, so no snow)
    Wd.decal({ x0: O, y0: O, x1: O + W, y1: O + D, draw(Rr) { const h2 = Rr.hash2, s = R.ENV.season || 0;
      const hall = (x, y) => { const X = x - O, Y = y - O, dd = Math.hypot(X - 23, (Y - 16.5)); if (dd < 3.2) { const a = Math.atan2(Y - 16.5, X - 23); if (dd > 2.9 || dd < .35) return '#8a6a48'; if (dd > 2.7) return '#f0e8d8'; return Math.abs(Math.sin(a * 4)) * 2.7 < dd - .3 ? '#e9e0cc' : (Math.floor((a + 3.1416) / .3927) & 1 ? '#34506a' : '#b8563a'); } const fx = X / 2 - Math.floor(X / 2), fy = Y / 2 - Math.floor(Y / 2), ex = Math.min(fx, 1 - fx) * 2, ey = Math.min(fy, 1 - fy) * 2; if (ex + ey < .14) return '#4a4652'; if (ex < .04 || ey < .04) return '#bdb5a2'; return (Math.floor(X / 2) + Math.floor(Y / 2)) & 1 ? '#ece5d4' : '#ddd5c2'; };
      const slate = (x, y) => { const r = Math.floor(y / .75), xx = x + (r & 1) * .5, c = Math.floor(xx), fx = xx - c, fy = y / .75 - r; if (fx < .06 || fy < .08) return '#3c4c48'; const k = h2(c, r, 3); return k > .66 ? '#5f736c' : k > .33 ? '#566a64' : '#4e625e'; };
      const oak = R.PAT.fboards('#d9c39a', .5), dark = R.PAT.fboards('#9a7350', .5);
      const herr = (x, y) => { const u = Math.floor(x * 2), v = Math.floor(y * 2), k = (u + v) & 1, f = k ? (x * 2 - u) : (y * 2 - v); if (f < .1) return '#7a5234'; return ((u >> 1) + (v >> 1) + k) % 3 ? '#b07a4e' : '#a26c44'; };
      const carpet = (x, y) => { const c = R.dk(SEASON_C[s][0], .25), k = h2(Math.floor(x * 16), Math.floor(y * 16), 5); return k > .9 ? R.lt(c, .12) : k < .1 ? R.dk(c, .12) : c; };
      const check = (x, y) => { const fx = x - Math.floor(x), fy = y - Math.floor(y); if (fx < .05 || fy < .05) return '#b8a890'; return (Math.floor(x) + Math.floor(y)) & 1 ? '#e8dcc4' : '#c8785a'; };
      for (const [x0, y0, x1, y1, f] of [[16, 0, 30, 32, hall], [0, 0, 16, 16, slate], [0, 16, 16, 26, herr], [0, 26, 16, 32, check], [30, 0, 46, 18, oak], [30, 18, 46, 27, carpet], [30, 27, 46, 32, dark]]) Rr.qz(O + x0, O + x1, O + y0, O + y1, 0, f); } }); Wd.version++;
    // ---- nav: the rope posts in front of Marge and the special piece are thin; the found case appears later
    for (const o of found) { o.hidden = true; Wd.free(o.B[0], o.B[1], o.B[3], o.B[4]); }
    Wd.lights.push({ x: O + 38.5, y: O + 1.6, z: 0, r: 4, c: '#ffe9b0' }, { x: O + 38.7, y: O + 23.4, z: 0, r: 5, c: '#ffe9b0' }, { x: O + 23, y: O + 21.4, z: 0, r: 4.5, c: '#ffe9b0' }, { x: O + 10.7, y: O + 12.6, z: 0, r: 4, c: '#ffe9b0' });
    // ---- pictures: one "Look" spot per picture
    for (const f of sc.fixtures) { const it = f.item, look = (id, x, y) => { const P = pic(id); if (P) sc.interactables.push({ x, y: y - .3, label: `Look: ${P.photo ? P.t : '"' + P.t + '"'}`, h: 1.5, hit: 9, range: 1.2, spot: { x, y }, pic: id, use: () => MS() && MS().look('p:' + id) }); };
      if (it.pics) { const ps = it.p.pics, sl = it.p.w / ps.length; ps.forEach((id, i) => look(id, O + it.x + (i + .5) * sl, O + it.y + 1)); } else if (it.pic && it.wall) look(it.pic, O + it.at + picW(it.pic, it.p.h) / 2, O + .75);
      if (it.about) sc.interactables.push({ x: O + it.x + 2, y: O + it.y + .2, label: 'About this exhibition', h: 1.6, hit: 10, spot: { x: O + it.x + 2, y: O + it.y + 1 }, use: () => MS() && MS().look('sp_about') }); }
    // ---- life: static crowd + lane walkers
    const seats = []; for (const f of sc.fixtures) { const id = f.asset.id; if (!/mus\.bench|cafe\.tableset/.test(id)) continue; f.seats.forEach((s, i) => seats.push({ x: s.x - O, y: s.y - O, z: s.z, dir: s.dir === undefined ? 1 : s.dir, seated: true, p: .4, busy: (seats.length + i) % 3 === 2 ? 1 : 0, lines: f.item.pic ? LINES.student : undefined, label: f.item.pic ? 'Art student' : undefined, anim: f.item.pic ? 'read' : undefined })); }
    const cr = crowd(sc, sc.def.npcSpots.concat(seats), { seed: 51, fill: .7, lines: LINES.visitor });
    const lane = () => { const r = pick(ROUTES), stay = r.map(k => k.endsWith('*')), keys = r.map(k => k.replace('*', '')); return { pts: keys.map((k, i) => Object.assign({ x: N[k][0] + O + (Math.random() - .5) * .4, y: N[k][1] + O + (Math.random() - .5) * .3 }, stay[i] ? { wait: 7 + Math.random() * 7, pose: Math.random() < .3 ? 'phone' : null, dir: 3 } : null)), kind: Math.random() < .5 ? 'stroll' : 'walk' }; };
    const wk = walkers(sc, { n: 16, route: lane, lines: LINES.visitor, label: 'Visitor' });
    sc.life = { crowd: cr, walkers: wk, count: () => cr.count() + wk.count() + (school.on ? 6 : 0), level: -1 };
    // ---- staff who walk: docent, curator, the school party
    const P = specs(), mk = (spec, label, x, y, dir) => { const c = new Char(spec, x + O, y + O); c.speed = 1.6; c.kind = 'staff'; c.label = label; c.dir = dir; sc.ents.push(c); return c; };
    const doc = mk(Object.assign({}, P.staff[4], { topColor: '#7a2f3a' }), 'Ines, docent', 26, 21.4, 1), cur = mk(Object.assign({}, P.elder[2], { top: 'long', topColor: '#2c3a5e', glasses: true }), 'Dr. Okafor, curator', 4.2, 23.9, 3), teach = mk(P.staff[6], 'Teacher', 23, 30, 3);
    const HOME = { x: O + 26, y: O + 21.4 }, CUR = [[4.2, 23.9, 2], [5.6, 19.6, 0], [3.4, 17.4, 3], [11.4, 17.4, 3]]; let ci = 0, cw = 8;
    sc.interactables.push({ ent: doc, x: doc.x, y: doc.y, label: 'Ines, the docent', h: 1.3, hit: 8, range: 1.8, visible: () => !doc.hidden, use: () => { doc._hold = 4; if (!tour.on) doc.faceTo(G.player.x, G.player.y); if (MS()) MS().talkDocent(doc, tour); } });
    sc.interactables.push({ ent: cur, x: cur.x, y: cur.y, label: 'Dr. Okafor, the curator', h: 1.3, hit: 8, range: 1.8, visible: () => !cur.hidden, use: () => { cur._hold = 6; cur.path = null; cur.faceTo(G.player.x, G.player.y); if (MS()) MS().talkCurator(cur); } });
    sc.interactables.push({ ent: teach, x: teach.x, y: teach.y, label: 'Teacher', h: 1.3, hit: 8, range: 1.8, visible: () => !teach.hidden, use: () => { teach._hold = 3; bubble(teach, pick(LINES.teacher)); } });
    const group = (n, pool, x, y) => Array.from({ length: n }, (_, i) => { const c = new Char(pool[(i * 3 + 1) % pool.length], O + x + i * .5, O + y); c.speed = 1.7; c.hidden = true; c.kind = 'customer'; sc.ents.push(c); return c; });
    const tgroup = group(3, P.adult, 24.6, 22.4), kids = group(5, P.kid, 21.5, 30.4); kids.forEach(k => sc.interactables.push({ ent: k, x: k.x, y: k.y, label: 'Schoolkid', h: 1, hit: 6, range: 1.7, visible: () => !k.hidden, use: () => bubble(k, pick(LINES.kid)) }));
    const follow = (list, lead, dt, sp) => list.forEach((c, i) => { if (c.hidden) return; const tx = lead.x - .5 + (i % 3 - 1) * .7, ty = lead.y + .9 + Math.floor(i / 3) * .6 + (i % 2) * .25; if ((c._rt = (c._rt || 0) - dt) <= 0 && Math.hypot(tx - c.x, ty - c.y) > 1.2) { c._rt = .8 + Math.random(); c.goTo(Wd, tx, ty); } c.speed = sp || 1.7; if (c.path) c.move(Wd, dt); else { c.moving = false; c.t += dt; c.faceTo(lead.x, lead.y - 2); } });
    const tour = { on: false, i: -1, wait: 0, joined: false, seen: 0, day: -1, hour: -1, group: tgroup, stops: {} };
    const startTour = force => { if (tour.on) return false; tour.on = true; tour.i = -1; tour.wait = force ? 1.5 : 8; tour.seen = 0; tour.stops = {}; tour.fast = false; doc.x = HOME.x; doc.y = HOME.y; doc.path = null; bubble(doc, 'Guided tour, starting now! This way to the dinosaur.'); tgroup.forEach((c, i) => { c.hidden = false; c.x = O + 24.4 + i * .6; c.y = O + 22.6; c.path = null; }); G.emit('museum:tourstart'); return true; };
    const endTour = () => { tour.on = false; tour.i = -1; tgroup.forEach(c => { c.hidden = true; }); doc.pose = null; doc.goTo(Wd, HOME.x, HOME.y); if (tour.joined && MS()) MS().tourDone(tour); tour.joined = false; };
    const school = { on: false, i: -1, wait: 0, day: -1, leaving: false };
    const startSchool = () => { if (school.on) return; school.on = true; school.leaving = false; school.i = -1; school.wait = 2; teach.hidden = false; teach.x = O + 23; teach.y = O + 30; teach.path = null; kids.forEach((k, i) => { k.hidden = false; k.x = O + 21.6 + i * .5; k.y = O + 30.6; k.path = null; }); };
    const endSchool = () => { school.on = false; teach.hidden = true; kids.forEach(k => { k.hidden = true; }); };
    teach.hidden = true;
    // ---- sync with the clock / season / state
    let view = null, seas = -1, open = null, tick = 0, ft = 0, fb = 0, lastT = 0, bz = null, hadFound = null, nsk = -1, stage = -1, hlT = 0, lastFree = { x: O + 23, y: O + 30 };
    const zoneAt = (x, y) => { for (const z of ZONES) if (x >= z.x0 && x < z.x1 && y >= z.y0 && y < z.y1) return z; return null; };
    const sync = () => {
      const n = G.now(), h = n.hf, hr = MUS_HOURS(n.weekday), am = ambient(G.state.t, 'clear'), v = am.dark >= .8 ? 'night' : am.dark > .02 || am.amb !== '#ffffff' ? 'dusk' : 'day', s = R.ENV.season || 0, isOpen = h >= hr[0] && h < hr[1];
      if (v !== view || s !== seas) { view = v; for (const o of wins) setP(o, { time: v, season: s }); }
      if (s !== seas) { seas = s; for (const o of seasonal) setP(o, { season: s }); if (side) setP(side, { kind: SPECIALS[s].side }); Wd.version++; }
      const hf = !!(MS() && MS().foundDone()); if (hf !== hadFound) { hadFound = hf; for (const o of found) { o.hidden = !hf; if (hf) Wd.block(o.B[0], o.B[1], o.B[3], o.B[4]); else Wd.free(o.B[0], o.B[1], o.B[3], o.B[4]); } }
      const sk = MS() ? MS().sketches() : []; if (sk.length !== nsk && board) { nsk = sk.length; setP(board, { ids: sk.slice(-6) }); }
      const st = MS() ? Math.min(3, 1 + (MS().stats().digs % 3)) : 1; if (st !== stage && pit) { stage = st; setP(pit, { stage: st }); }
      const free = n.weekday === FREE_EVE.weekday && h >= FREE_EVE.from, wkend = n.weekday >= 5, lvl = !isOpen ? 0 : (h < 11 ? .3 : h < 12.5 ? .52 : h < 16.5 ? .68 : .45) + (wkend || free ? .24 : 0), busy = isOpen && (wkend || free ? h >= 11 : h >= 13 && h < 16.5);
      if (lvl !== sc.life.level || busy !== bz || isOpen !== open) { sc.life.level = lvl; bz = busy; open = isOpen; for (const c of cr.list) { const sp = c.spot; c.hidden = sp.kind === 'staff' ? !isOpen && !/guard/i.test(sp.label || '') : !isOpen || (sp.busy ? !busy || c.roll > lvl + .25 : c.roll > (sp.p !== undefined ? Math.min(sp.p, lvl + .1) + (lvl > .8 ? .2 : 0) : lvl)); } wk.setActive(!isOpen ? 0 : Math.round(4 + lvl * 13), !isOpen); doc.hidden = !isOpen; cur.hidden = !isOpen; }
      if (isOpen && !tour.on) for (const th of TOUR_TIMES) if (h >= th && h < th + .25 && (tour.day !== n.day || tour.hour !== th)) { tour.day = n.day; tour.hour = th; startTour(false); }
      if (isOpen && !wkend && !school.on && h >= 10.2 && h < 12 && school.day !== n.day) { school.day = n.day; startSchool(); }
      if (school.on && !school.leaving && (h >= 12.6 || !isOpen)) school.leaving = true;
      sc.life.open = isOpen;
    };
    sc.mus = { tour, startTour, endTour, school, startSchool, endSchool, docent: doc, curator: cur, teacher: teach, sync, zoneAt: (x, y) => zoneAt(x, y), light(d) { if (model) { setP(model, { hl: d }); hlT = 14; } }, nodes: N, routes: ROUTES, view: () => view };
    sc.env = t => { const o = ambient(t, G.state.weather); return { amb: o.amb === '#ffffff' ? o.amb : R.mix(o.amb, '#ffffff', .55), dark: Math.min(.5, (o.dark || 0) * .5), bg: Wd.bg, night: o.night }; };
    sync();
    const u0 = sc.update; sc.update = (dt, gm) => {
      u0(dt, gm); cr.update(dt); wk.update(dt);
      if ((tick -= dt) <= 0) { tick = 1.5; sync(); }
      if ((ft += dt) > .32) { ft = 0; fb++; for (const o of anim) setP(o, { frame: fb % 4 }); }
      if (hlT > 0 && (hlT -= dt) <= 0 && model) setP(model, { hl: 0 });
      // ticket line at the columns
      const p = G.player, z = zoneAt(p.x - O, p.y - O);
      if (z && z.ticket && !G.busy && !(MS() && MS().hasTicket())) { p.x = lastFree.x; p.y = lastFree.y; p.stop(); G.target = null; G.pending = null; if (G.time - lastT > 3) { lastT = G.time; toast(sc.life.open ? `"Ticket, please!" The ${z.name} needs a museum ticket: the info desk is in the middle of the hall.` : 'The galleries are closed for the night.', 'info', 3600); } }
      else if (z && !z.ticket) { lastFree.x = p.x; lastFree.y = p.y; }
      // curator: drifts between her cases
      if (cur._hold > 0) { cur._hold -= dt; cur.moving = false; cur.t += dt; }
      else if (cur.path) { cur.pose = null; cur.move(Wd, dt); if (!cur.path) { cur.dir = CUR[ci][2]; cw = 10 + Math.random() * 12; cur.pose = Math.random() < .5 ? 'read' : null; } }
      else { cur.t += dt; cur.moving = false; if ((cw -= dt) <= 0) { ci = (ci + 1) % CUR.length; cur.pose = null; if (!cur.goTo(Wd, CUR[ci][0] + O, CUR[ci][1] + O)) cw = 3; } }
      // docent + tour group
      if (doc._hold > 0 && !tour.on) { doc._hold -= dt; doc.t += dt; doc.moving = false; }
      else if (tour.on) {
        if (doc.path) { doc.pose = null; doc.speed = tour.fast ? 3.4 : 1.6; doc.move(Wd, dt); if (!doc.path) { const st = TOUR[tour.i]; if (st) { doc.dir = 1; doc.pose = 'talk'; bubble(doc, st.say, 5600); tour.wait = tour.fast ? 2.5 : 9; tour.pend = st; } } }
        else { doc.t += dt; doc.moving = false; if (tour.pend && tour.joined && Math.hypot(p.x - doc.x, p.y - doc.y) < 5.5) { tour.seen++; tour.stops[tour.pend.ex] = 1; G.emit('museum:tourstop', tour.pend.zone); tour.pend = null; } if ((tour.wait -= dt) <= 0) { tour.pend = null; tour.i++; doc.pose = null; const st = TOUR[tour.i]; if (!st) endTour(); else if (!doc.goTo(Wd, st.x + O, st.y + O)) { doc.x = st.x + O; doc.y = st.y + O; doc.path = null; tour.wait = .1; tour.i--; tour._skip = (tour._skip || 0) + 1; if (tour._skip > 8) endTour(); } } }
        follow(tgroup, doc, dt, tour.fast ? 3.4 : 1.7);
        if (tour.on && tour.joined && !G.busy && !G.modal) { const d = Math.hypot(p.x - doc.x, p.y - doc.y); if ((tour._ft = (tour._ft || 0) - dt) <= 0 && d > 2.4) { tour._ft = .7; if (!p.goTo(Wd, doc.x + .9, doc.y + 1.3)) p.goTo(Wd, doc.x, doc.y + .8); } }
      } else { if (doc.path) doc.move(Wd, dt); else { doc.t += dt; doc.moving = false; doc.pose = null; doc.dir = 1; } }
      // the school party
      if (school.on) {
        if (teach._hold > 0) { teach._hold -= dt; teach.moving = false; teach.t += dt; }
        else if (teach.path) { teach.pose = null; teach.move(Wd, dt); if (!teach.path) { if (school.leaving) endSchool(); else { teach.dir = 1; teach.pose = 'talk'; school.wait = 16 + Math.random() * 10; if (Math.hypot(p.x - teach.x, p.y - teach.y) < 9) bubble(teach, pick(LINES.teacher), 3600); } } }
        else { teach.t += dt; teach.moving = false; if ((school.wait -= dt) <= 0) { teach.pose = null; if (school.leaving) { if (!teach.goTo(Wd, O + 23, O + 30.6)) endSchool(); } else { school.i = (school.i + 1) % SCHOOL.length; const q = SCHOOL[school.i]; if (!teach.goTo(Wd, q[0] + O, q[1] + O)) school.wait = 2; } } }
        if (school.on) follow(kids, teach, dt, 2);
      }
    };
    const e0 = sc.onEnter; sc.onEnter = (o, pv) => { e0(o, pv); view = null; lastFree = { x: O + 23, y: O + 30 }; sync(); if (MS()) MS().arrived(sc); };
    const x0 = sc.onExit; sc.onExit = () => { x0(); if (tour.on) tour.joined = false; };
  },
});

registerInfo('Museum of Maple Bay', {
  blurb: 'The limestone hall with the copper dome at the head of Maple Avenue. Marge the tyrannosaur stands in the Grand Hall under a hanging whale; around her are a natural history wing with a fossil dig pit, an art wing of twenty-two paintings and six sculptures, the story of the city with a lit model of every street, and a special exhibition that changes each season.',
  signature: 'Marge, the tyrannosaur a road crew found under Hillcrest, and Elspeth Marrow\'s "Harbour at Dawn".',
  tryThis: ['Brush a fossil out of the dig pit and add it to your finds', 'Stand in front of a painting and look closer', 'Sit on a gallery bench and sketch an artwork', 'Rent the audio guide and follow all ten stops', 'Take a scavenger hunt card from the info desk', 'Light up your own district on the city model', 'Join the guided tour at 11:00, 14:00 or 16:00', 'Fill your collection logbook in all four wings', 'Come on Friday evening, when it is free after five', 'Ask Dr. Okafor the curator about the empty case'],
  activities: ['mus_dig', 'mus_look', 'mus_sketch', 'mus_audio', 'mus_hunt', 'mus_model', 'mus_tour', 'mus_photo', 'mus_donate'],
});

const exN = ex => (EXHIBITS[ex] && EXHIBITS[ex].name) || (ex === 'sp_centre' ? 'the centrepiece' : ex === 'sp_side' ? 'the side case' : 'the exhibit');
const only = fn => (fx, scene) => (scene.def && scene.def.showpiece === 'museum' ? fn(fx, scene) : null);
export function init() {
  registerFixture('mus_ex', only(fx => (fx.item.ex ? { label: 'Look: ' + exN(fx.item.ex), hit: 12, range: 1.6, visible: () => !fx.ob.hidden, use: () => MS() && MS().look(fx.item.ex) } : null)));
  registerFixture('skeleton', only(fx => (fx.item.ex === 'whale' || fx.item.ex === 'ptero' ? { label: 'Look up: ' + exN(fx.item.ex), hit: 14, h: 3.2, range: 2.4, spot: { x: fx.x, y: fx.ob.B[4] + 1.6 }, use: () => MS() && MS().look(fx.item.ex) } : null)));
  registerFixture('mus_dig', only((fx, sc) => ({ label: 'Brush out a fossil', hit: 16, use: () => MS() && MS().dig(fx, sc) })));
  registerFixture('mus_model', only((fx, sc) => ({ label: 'The city model: press a button', hit: 16, use: () => MS() && MS().model(sc) })));
  registerFixture('mus_bench', only((fx, sc) => (fx.item.pic ? { label: `Sit and sketch "${pic(fx.item.pic).t}"`, hit: 12, use: () => MS() && MS().sketch(fx, sc) } : { label: 'Sit a while', hit: 12, use: () => MS() && MS().sit(fx, sc) })));
  registerFixture('mus_donate', only(() => ({ label: 'Donation box', hit: 12, use: () => MS() && MS().donate() })));
  registerFixture('mus_audio', only(fx => ({ label: 'Audio guide stop ' + fx.item.p.n, hit: 10, h: 1.2, use: () => MS() && MS().listen(fx.item.p.n) })));
  registerFixture('mus_photo', only(fx => ({ label: 'Photo spot', hit: 12, h: .3, range: .9, use: () => MS() && MS().photo(fx.item.spot) })));
  registerFixture('mus_map', only(() => ({ label: 'Floor plan', use: () => toast('You are in the Grand Hall. Left of Marge: Natural History, then City History and Cafe Ammonite by the door. Right of Marge: the Art Wing, then the Special Exhibition and the Museum Shop. Tickets, audio guides and hunt cards at the desk behind you.', 'info', 8000) })));
  registerFixture('mus_board', only(() => ({ label: 'Visitor sketches', hit: 12, use: () => MS() && MS().lookBoard() })));
  registerFixture('mus_shop', only(fx => ({ label: fx.item.label, hit: 14, shop: fx.item.venue, use: () => G.shop && G.shop.open(fx.item.venue, { checkHours: true }) })));
  registerFixture('mus_ticket', only(() => ({ label: 'Tickets, audio guide & tours', hit: 14, use: () => MS() && MS().desk() })));
  registerFixture('mus_cloak', only(() => ({ label: 'Cloakroom', hit: 14, use: () => MS() && MS().cloak() })));
}
