// The ten brand / speciality CLOTHING STORES (owner msgs 177-178, BIBLE "Direction update 39"). Rooms `cs_<key>` (= venue id = shop id of data/clothing_stores.js).
// Every room is its own shop: floor, walls, palette, layout and a signature set of fixtures (src/art/venue/clothing_stores_art.js `furn.cs.*`), no copies.
// Contract (same as places_shops*.js): one checkout counter, racks / shelves / shoe walls that sim/clothes_shop.js turns into "Browse" spots, a mirror or fitting room,
// a seat where it fits, the exit on the front wall with a clear lane, one to three `cs.manq` mannequins (item field `mq`: dressed by sim/clothing_stores.js),
// and the SHOPKEEPER: a named character behind the counter (def.keeper, placed by setup(); tap to talk).
// The city side (which building, door, sign, hours) is sim/clothing_stores.js. Notes: docs/reports/clothing_stores.md.
import { GT } from '../../engine/world.js';
import { G } from '../../core/game.js';
import { Char } from '../../core/char.js';
import { say } from '../../ui/kit.js';
import { V, WY, WX, S, room } from './venues_lib.js';
import { P, PY, PX, U, FL, HL, HG, neon } from './places_shops.js';
import { registerInfo } from './unique_rooms.js';
import { STORE_BY_ID } from '../../data/clothing_stores.js';

const C = (a, x, y, p, o) => V('cs.' + a, x, y, p, o);
const TILL = { n: 'use' };                                   // the shopkeeper is ours (setup), so no ambient staff at the counter
const MQ = (x, y, i, dir, tone, o) => C('manq', x, y, { ids: [], dir: dir === undefined ? 1 : dir, tone: tone || 0 }, Object.assign({ mq: i }, o));
const SPOT = (x, y) => C('spot', x, y);
let talkN = 0;
function keeper(scene, st) {
  const fx = scene.fixtures.find(f => f.tags.includes('checkout') && f.staff); if (!fx) return;
  const k = st.keeper, c = new Char(Object.assign({}, k.spec), fx.staff.x, fx.staff.y); c.dir = fx.staff.dir === undefined ? 1 : fx.staff.dir; c.kind = 'staff'; c.named = true; c.label = k.name; scene.ents.push(c); scene.keeper = c;
  scene.interactables.push({ ent: c, x: c.x, y: c.y, label: `${k.name}, ${k.role}`, h: 1.3, hit: 8, range: 2.4, spot: fx.use || undefined, use: () => { c.pose = 'talk'; say([{ who: k.name, text: k.lines[talkN++ % k.lines.length] }]).then(() => { c.pose = null; }); G.emit('cs:talk', st.id); } });
}
function store(id, info, def) {
  const st = STORE_BY_ID[id]; registerInfo(st.name, Object.assign({ blurb: st.blurb }, info));
  return room(Object.assign({ id, venue: id, name: st.name, music: 'shop', clothingStore: true, tags: ['shop', 'clothes'], setup: scene => keeper(scene, st) }, def));
}

/* ---- Hollowell & Sons, Tailors (Downtown) 10 x 8: bottle-green panelled tailor's, cloth bolts to the ceiling, a cutting table, the three-way mirror on its oxblood podium */
store('cs_hollowell', { signature: 'The three-way mirror on its podium, and the wall of cloth bolts behind the cutting table.', tryThis: ['Stand at the three-way mirror with a basket of pieces', 'Buy a whole look off a mannequin', 'Ask Mr. Hollowell about the cutting table'], activities: ['browse', 'seat'] },
  { w: 10, d: 8, floor: GT.f_darkwood, wall: { color: '#2f4a40', trim: '#5a3a26', rail: 1.1, h: 3 },
    items: [PY('sign', 3, { text: 'HOLLOWELL & SONS', bg: '#1f3a34', fg: '#e8d8a8', fr: '#d8a848' }, 2.4), WX('generic.window', 2.5, { w: 3 }), WX('cs.shoewall', 6, { c: '#5a3a26', seed: 4 }, 0),
      V('generic.rug', 3.5, 3.5, { w: 3, d: 2, c: '#7a2a2a', c2: '#d8a848', inner: '#8a3a3a' }),
      C('cubby', .5, 0, { w: 3, h: 2.3, kind: 'bolts', c: '#5a3a26', cols: ['#3a3f4c', '#2f3f72', '#c0a078', '#5a6272', '#4a3a30', '#8a9098'], seed: 2 }), C('podium', 4, 0, { top: '#7a2a2a' }, U),
      C('shelves', 6, 0, { w: 2, h: 2.1, c: '#5a3a26', cols: ['#f4f0e8', '#bcd4ec', '#e8c8d0', '#f4f0e8', '#cfc8e8'], seed: 5 }, U), V('clothing.fitting', 8.5, 0, { c: '#2f4a40', cc: '#7a2a2a' }, U),
      P('platform', 0, 2.5, { w: 1, d: 3, c: '#5a3a26', top: '#7a2a2a' }), MQ(0, 3, 0, 0, 0, { z: .25 }), MQ(0, 4.5, 1, 0, 0, { z: .25 }),
      C('rack', 2, 2, { w: 2.5, wood: '#5a3a26', cols: ['#f4f0e8', '#bcd4ec', '#3a3f4c', '#c0a078', '#4a4a58'], seed: 3, trim: .6, tc: '#8a3848' }, U), C('rack', 2, 5.5, { w: 2.5, wood: '#5a3a26', cols: ['#c0a078', '#3a3f4c', '#2f3f72', '#6a2a30'], long: true, seed: 8 }, U),
      C('rack', 6.5, 2, { w: 2.5, wood: '#5a3a26', cols: ['#4a4a58', '#8a9098', '#c0a078', '#2f3f72'], seed: 12, trim: 0 }), C('worktable', 6.5, 3.5, { w: 2.5, c: '#6a4428', cloth: '#2f3f72' }),
      V('clothing.accessories', 5, 2.5), V('clothing.counter', 7.5, 6, { c: '#3a2a20', top: '#d8a848', name: 'HOLLOWELL', ink: '#e8d8a8' }, TILL),
      V('cafe.armchair', 1, 6.5, { c: '#7a2a2a' }, { n: 'seats' }), MQ(3.5, 7, 2, 1, 0), V('generic.plant', 9.5, 7.5, { kind: 'palm', s: 1.5, pot: '#d8a848' }),
      HL(4.5, 4, 'shade', '#2f4a40'), HL(2.5, 3.5, 'shade', '#2f4a40'), SPOT(.5, 3.5)],
    npc: [S(3.2, 3.2, 3), S(7.7, 3.2, 3)], exits: [{ x: 5.5, y: 7.5 }] });

/* ---- Nightjar (Arts Quarter) 11 x 7: a black box with a lit catwalk down the middle, mannequins under spots, a mirror ball, neon on the wall */
store('cs_nightjar', { signature: 'The lit runway with three mannequins under spotlights, and the mirror ball that never quite stops.', tryThis: ['Walk the length of the runway', 'Tap a mannequin and buy the whole look', 'Try a dress behind the plum curtain'], activities: ['browse', 'seat'] },
  { w: 11, d: 7, floor: GT.f_stone, floors: [{ x0: 2.5, y0: 2, x1: 8.5, y1: 4, floor: GT.f_dance }], wall: { color: '#1c1622', trim: '#e87ad0', h: 3 },
    items: [PY('sign', 4, { text: 'NIGHTJAR', bg: '#1c1622', fg: '#e87ad0', fr: '#e87ad0', lit: 1 }, 2.3), neon('y', 1.5, { kind: 'star' }), neon('y', 8, { kind: 'heart' }), WX('cs.shoewall', 1, { c: '#2a2733', seed: 9 }, 0), WX('gym.mirror', 4, { w: 2 }),
      C('rack', .5, .5, { w: 2.5, cols: ['#2a2733', '#6a3a7a', '#e87ad0', '#2a2733', '#c8c0d8'], bar: '#d8a848', seed: 2, trim: .7, tc: '#f4f0e8' }, U), C('rack', 3.5, .5, { w: 2.5, cols: ['#3a2a48', '#2a2733', '#b83a6a', '#d8b060'], bar: '#d8a848', seed: 6 }), C('rack', 6.5, .5, { w: 2.5, cols: ['#2a2733', '#4a4a58', '#6a3a7a', '#2a2733'], bar: '#d8a848', seed: 7, trim: 0 }, U),
      V('clothing.fitting', 9.5, 0, { c: '#2a2733', cc: '#6a3a7a' }, U),
      C('runway', 3, 2.5, { w: 5, d: 1 }), MQ(3.5, 2.5, 0, 1, 0, { z: .25 }), MQ(5.5, 2.5, 1, 1, 3, { z: .25 }), MQ(7, 2.5, 2, 1, 0, { z: .25 }), SPOT(3.5, 3), SPOT(5.5, 3), SPOT(7, 3), C('hang', 4.5, 2, { kind: 'disco' }),
      C('rack', 1, 5, { w: 2.5, cols: ['#2a2733', '#b83a6a', '#6a3a7a', '#d8b060', '#3a2a48'], bar: '#d8a848', long: true, seed: 11, trim: .6, tc: '#ffe680' }, U),
      P('jewel.case', 9, 2.5, { c: '#2a2733', velvet: '#6a3a7a', fr: '#e87ad0' }, U), V('clothing.accessories', 10, 4, { hats: true }),
      V('clothing.counter', 8.5, 5.5, { c: '#2a2733', top: '#e87ad0', name: 'NIGHTJAR', ink: '#e87ad0' }, TILL), V('clothing.pouf', 0, 4, { c: '#6a3a7a' }, FL({ n: 'seats', ns: 1 })), V('clothing.pouf', 6, 6, { c: '#b83a6a' }, { n: 'seats', ns: 1 })],
    npc: [S(2, 1.7, 3), S(4.4, 4.2, 3), S(7.6, 1.7, 3)], exits: [{ x: 5, y: 6.5 }] });

/* ---- Juniper & Rye Knitwear (Hillcrest) 9 x 8: somebody's front room: a lit fire, two armchairs, wool in every cubby */
store('cs_juniper', { signature: 'The fire with its two armchairs, and the wall of wool sorted by colour.', tryThis: ['Sit by the fire', 'Browse the jumper tables', 'Ask Maeve which sheep it was'], activities: ['browse', 'seat'] },
  { w: 9, d: 8, floor: GT.f_wood, wall: { color: '#f4e8d0', trim: '#7a3a22', rail: 1, h: 3 },
    items: [PY('sign', 2.5, { text: 'JUNIPER & RYE', bg: '#7a3a22', fg: '#f4e4c0', fr2: '#d8a848' }, 2.35), WX('generic.window', 2.5, { w: 2.5 }), WX('home.wall.photos', 6, { seed: 3 }, 1.5),
      V('home.rug', 2.5, 1, { w: 4, d: 2, pat: 'persian', c: '#a8452a', c2: '#ead9b8', c3: '#3f6a4a' }), V('generic.rug', 3.5, 4.5, { w: 2, d: 2, c: '#3f6a4a', c2: '#ead9b8', inner: '#4f7a5a' }),
      C('shelves', .5, 0, { w: 2.5, h: 2.1, kind: 'yarn', c: '#c8a068', cols: ['#ead9b8', '#a8452a', '#3f6a4a', '#e8b83a', '#7a5238', '#8fa8b8'], seed: 4 }, U), V('home.fireplace', 3.5, 0, { tier: 0, on: true }),
      C('cubby', 6, 0, { w: 2.5, h: 2.1, kind: 'yarn', c: '#c8a068', cols: ['#a8452a', '#ead9b8', '#d9722e', '#3f6a4a', '#f4f0e8'], seed: 9 }),
      V('cafe.armchair', 2.5, 1.5, { c: '#a8452a' }, { n: 'seats' }), V('cafe.armchair', 5.5, 1.5, { c: '#3f6a4a' }, { n: 'seats' }), P('barrel', 6.5, 2, { c: '#c8a068', fill: '#ead9b8' }), V('generic.floorlamp', 8.5, 1, { c: '#f4e4c0', base: '#7a3a22' }),
      P('platform', 0, 3, { w: 1, d: 2.5, c: '#c8a068' }), MQ(0, 3.5, 0, 0, 2, { z: .25 }), MQ(0, 4.5, 1, 0, 2, { z: .25 }),
      C('foldtable', 1.5, 3.5, { c: '#c8a068', cols: ['#ead9b8', '#a8452a', '#3f6a4a', '#e8b83a', '#7a5238'], seed: 1 }, U), C('foldtable', 1.5, 5.5, { c: '#c8a068', cols: ['#3f6a4a', '#ead9b8', '#d9722e', '#8fa8b8'], seed: 4 }),
      C('rack', 6, 3, { w: 2.5, wood: '#c8a068', cols: ['#ead9b8', '#d9722e', '#3f6a4a', '#8a6a48'], seed: 8 }, U), C('rack', 6, 4.5, { w: 2.5, wood: '#c8a068', cols: ['#7a5238', '#ead9b8', '#3f6a4a', '#a8452a'], long: true, seed: 5 }),
      V('clothing.accessories', 4.5, 3.5, { hats: true }), V('clothing.accessories', 4.5, 5.5), V('clothing.mirror', 8.5, 2, { c: '#c8a068' }),
      V('clothing.counter', 6.5, 6.5, { c: '#c8a068', top: '#7a3a22', name: 'JUNIPER', ink: '#7a3a22' }, TILL), V('generic.plant', 0, 7.5, { s: 1.2, pot: '#a8452a' }),
      HL(2.5, 4.5, 'lantern', '#f4e4c0'), HL(6.5, 4, 'lantern', '#f4e4c0')],
    npc: [S(2.4, 4.8, 3), S(7.2, 5.6, 3)], exits: [{ x: 4.5, y: 7.5 }] });

/* ---- Second Wind Thrift (Old Town) 8 x 9: long, narrow and crammed: rails by the decade, denim in crates, a five-dollar rail along the back wall */
store('cs_secondwind', { signature: 'The five-dollar rail along the back wall, and denim stacked in apple crates.', tryThis: ['Elbow through the five-dollar rail', 'Rummage in the bins', 'Try a find on behind the teal curtain'], activities: ['browse', 'seat', 'music'] },
  { w: 8, d: 9, floor: GT.f_check, wall: { color: '#e8d9a8', pattern: 'stripes', color2: '#dcc88c', trim: '#2f6a6a' },
    items: [PY('sign', 2, { text: 'SECOND WIND', bg: '#2f6a6a', fg: '#ffe9a8' }, 2.1), PX('thrift.hatwall', 1.5, { w: 3, seed: 3 }, .95), WX('generic.window', 5.5, { w: 2 }), WY('home.wall.photos', 5.6, { seed: 8 }, 1.7),
      C('rack', .5, .5, { w: 3, cols: ['#c0704a', '#3c64ad', '#e8b83a', '#8a3848', '#3f8a55', '#f1ede4', '#7a55b0'], seed: 2, tag: 1 }, U), V('home.wardrobe', 4, 0), V('clothing.fitting', 7, 0, { c: '#e8d9a8', cc: '#2f6a6a' }, U),
      C('rack', 1, 2.5, { w: 3, cols: ['#7fa0c8', '#8a5a3a', '#6f7a48', '#c8ad7a', '#3a3f4c'], long: true, seed: 5 }, U), C('rack', 1, 4, { w: 3, cols: ['#4a6fa8', '#34507f', '#7fa0c8', '#8a5a3a', '#2a2733'], seed: 7, trim: 0 }), C('rack', 1, 5.5, { w: 3, cols: ['#e87aa0', '#f2c230', '#3f8a55', '#c0704a', '#6fb6d8'], long: true, seed: 9 }, U),
      C('foldtable', 5, 2.5, { w: 2, crate: 1, c: '#c8a068', cols: ['#7fa0c8', '#34507f', '#4a6fa8', '#2a2733'], seed: 2 }, U), P('thrift.bins', 5, 4.5, { name: '$2 BIN', c: '#2f6a6a', c2: '#e8b83a', seed: 3 }, U),
      C('shoewall.boots', .5, 7, { w: 2.5, c: '#8a6a48', cols: ['#8a5a3a', '#2a2733', '#d04a3a', '#f1ede4', '#3a2a20'] }, U),
      V('clothing.counter', 5.5, 7, { c: '#2f6a6a', top: '#e8d9a8', name: '2ND WIND', ink: '#ffe9a8' }, TILL), V('home.stereo', 7, 4.5, { on: true }), V('clothing.mirror', 7.5, 2, { c: '#3a3f4c' }),
      MQ(7.5, 8, 0, 1, 2), MQ(7.5, 5.5, 1, 1, 2), V('cafe.armchair', 0, 8, { c: '#c0704a' }, { n: 'seats' }), HL(2, 3, 'bulb'), HL(5.5, 3.5, 'shade', '#e8b83a'), HL(2, 6, 'bulb')],
    npc: [S(2, 1.7, 3), S(4.4, 4.4, 0), S(2.6, 4.7, 3)], exits: [{ x: 4.5, y: 8.5 }] });

/* ---- Cobble & Sole (Old Town) 9 x 7: shoes on three walls, boxes to the ceiling, try-on benches on a rug, the cobbler's bench under its lamp */
store('cs_sole', { signature: 'Shoe walls on three sides, and the cobbler\'s bench with its little lamp.', tryThis: ['Sit on a try-on bench', 'Browse all three shoe walls', 'Ask Mr. Iosif how you walk'], activities: ['browse', 'seat'] },
  { w: 9, d: 7, floor: GT.f_wood, wall: { color: '#9a5a44', pattern: 'brick', trim: '#5a3a26', h: 3.1 },
    items: [PY('sign', 2.5, { text: 'COBBLE & SOLE', bg: '#5a3a26', fg: '#f2d27a', fr2: '#d8a848' }, 2.5), WY('clothing.shoewall', .5, { w: 3, c: '#e8dcc0', seed: 2 }, 0), WY('clothing.shoewall', 4, { w: 2, c: '#3a2a20', seed: 7 }, 0), WX('cs.shoewall', 1, { w: 3, c: '#e8dcc0', seed: 11 }, 0), WX('generic.window', 4.5, { w: 2 }),
      V('generic.rug', 2.5, 2, { w: 3, d: 2.5, c: '#7a2a2a', c2: '#f2d27a', inner: '#8a3a3a' }),
      C('cubby', 6.5, 0, { w: 2.5, h: 2.1, kind: 'boxes', c: '#5a3a26', cols: ['#f1ede4', '#c8a068', '#2f6a6a', '#8a3848', '#3a3f4c'], seed: 4 }),
      C('shoebench', 2.5, 2.5, { c: '#7a2a2a' }, { n: 'seats', ns: 1 }), C('shoebench', 2.5, 4, { c: '#2f6a6a' }, { n: 'seats', ns: 1 }),
      C('shoewall.boots', .5, 5.5, { w: 2, c: '#5a3a26', cols: ['#6a4428', '#2a2733', '#8a5a3a', '#c8a070', '#3a2a20'] }, U),
      C('worktable', 6.5, 2, { w: 2, kind: 'cobbler', c: '#5a3a26' }), V('clothing.accessories', 5.5, 2), V('clothing.mirror', 5.5, 4, { c: '#5a3a26' }),
      V('clothing.counter', 6.5, 4.5, { c: '#5a3a26', top: '#f2d27a', name: 'SOLE', ink: '#f2d27a' }, TILL), MQ(8.5, 6, 0, 1, 2), V('generic.plant', 0, 6.5, { kind: 'snake', s: 1.3, pot: '#5a3a26' }),
      HL(3, 3.5, 'shade', '#7a2a2a'), HL(7, 3.5, 'bulb')],
    npc: [S(1.7, 1.2, 3), S(4.7, 1.2, 3), S(1.2, 3.2, 2)], exits: [{ x: 4.5, y: 6.5 }] });

/* ---- Tidepool Beach Shop (Harborside, Cannery Row) 10 x 8: aqua boards, a sea-blue mat and a strip of decking, surfboards against the wall, a beach hut for a fitting room */
store('cs_tidepool', { signature: 'The surfboards along the back wall, and the striped beach hut you change in.', tryThis: ['Change in the beach hut', 'Sit on the deck bench under the buoys', 'Buy the whole boardwalk look off a mannequin'], activities: ['browse', 'seat'] },
  { w: 10, d: 8, floor: GT.f_mat, floors: [{ x0: 0, y0: 6, x1: 10, y1: 8, floor: GT.f_wood }], wall: { color: '#7fd0cc', pattern: 'planks', trim: '#fff3c8' },
    items: [PX('sign', 5, { text: 'TIDEPOOL', bg: '#1f8a9a', fg: '#fff3c8', fr2: '#f07a5a' }, 2.1), WY('cs.boards', 3, { w: 3 }, 0), PY('hw.lifering', 6.3, { c: '#f07a5a', bg: '#7fd0cc' }, 1.3), WX('cs.shoewall', 1.5, { w: 2.5, c: '#fff3c8', seed: 14 }, 0),
      C('rack', .5, .5, { w: 2, wood: '#f4f0e8', cols: ['#f07a5a', '#3fb8a8', '#fff3c8', '#f2c230', '#5ab0e0'], seed: 3 }, U), V('clothing.fitting', 7.5, 0, { c: '#f4f0e8', cc: '#f07a5a' }, U), V('clothing.fitting', 8.5, 0, { open: true, c: '#f4f0e8', cc: '#3fb8a8' }),
      P('platform', 0, 4.5, { w: 1, d: 2.5, c: '#ead9b8', top: '#f4e4b8' }), MQ(0, 5, 0, 0, 0, { z: .25 }), MQ(0, 6, 1, 0, 0, { z: .25 }),
      C('rack', 2.5, 2.5, { w: 2.5, wood: '#f4f0e8', cols: ['#3fb8a8', '#f07a5a', '#f08ab0', '#fff3c8', '#2f9a94'], long: true, seed: 6 }, U), V('clothing.roundrack', 6, 2, { seed: 7, pal: 'pastel' }, U),
      C('foldtable', 2.5, 4.5, { w: 2, crate: 1, c: '#c8a068', cols: ['#f07a5a', '#5ab0e0', '#f2c230', '#3fb8a8'], seed: 5 }, U), V('clothing.accessories', 5.5, 4, { hats: true }), V('clothing.accessories', 5.5, 5.5), P('barrel', 6.5, 4.5, { c: '#c8a068', fill: '#f4e4b8' }),
      V('clothing.counter', 7.5, 5, { c: '#f4f0e8', top: '#1f8a9a', name: 'TIDEPOOL', ink: '#1f8a9a' }, TILL), V('generic.bench', 2, 7, { c: '#e8e2d4' }, { n: 'seats', ns: 1 }), V('generic.plant', 9.5, 7.5, { kind: 'palm', s: 1.6, pot: '#f07a5a' }), V('clothing.mirror', 9.5, 2.5, { c: '#f1ede4' }),
      HG(2.5, 3.5, 'buoy', { c: '#f07a5a' }), HG(4.5, 5.5, 'buoy', { c: '#f2c230' }), HG(7.5, 3.5, 'buoy', { c: '#3fb8a8' }), HL(4, 2, 'lantern', '#fff3c8'), SPOT(.5, 5.5)],
    npc: [S(3.2, 3.7, 3), S(1.7, 1.7, 3), S(6.2, 3.7, 3)], exits: [{ x: 5, y: 7.5 }] });

/* ---- Saltline Outfitters (Harborside) 11 x 8: a timber chandlery of rain gear under a hung canoe: oilskins, rubber boots, rope, lanterns */
store('cs_outfitters', { signature: 'The canoe hung from the rafters, and the long rail of yellow oilskins.', tryThis: ['Walk under the canoe', 'Browse the boot racks', 'Ask Captain Bea about the glass'], activities: ['browse', 'seat'] },
  { w: 11, d: 8, floor: GT.f_concrete, wall: { color: '#8a6a48', pattern: 'planks', trim: '#22384a', h: 3 },
    items: [PY('sign', 3, { text: 'SALTLINE OUTFITTERS', bg: '#22384a', fg: '#f2c230' }, 2.35), PY('hw.lifering', .5, { kind: 'anchor', bg: '#8a6a48' }, 1.2), PX('hw.lifering', 6, { kind: 'oars' }, 1.2), WX('generic.window', 2, { w: 2.5 }),
      C('rack', 2.5, 2.5, { w: 2.5, wood: '#5a4030', cols: ['#f4f0e8', '#22384a', '#d9722e', '#6f7a48', '#c8ad7a'], seed: 5 }, U),
      C('rack', 2, .5, { w: 3, wood: '#5a4030', cols: ['#e8b83a', '#e8b83a', '#22384a', '#6f7a48', '#e8b83a', '#d9722e'], long: true, seed: 2, trim: .5, tc: '#f4f0e8' }, U), C('shelves', 5.5, 0, { w: 2.5, h: 2.1, c: '#5a4030', cols: ['#f4f0e8', '#22384a', '#6f7a48', '#c8ad7a', '#d9722e'], seed: 7 }, U), P('hw.rope', 8, 0), V('clothing.fitting', 10, 0, { c: '#8a6a48', cc: '#22384a' }, U),
      C('hang', 3.5, 3.5, { kind: 'canoe', l: 4, c: '#a8452a' }),
      C('rack', 2.5, 4.5, { w: 2.5, wood: '#5a4030', cols: ['#34507f', '#6f7a48', '#c8ad7a', '#3a3f4c'], seed: 9, trim: 0 }),
      C('shoewall.boots', 6.5, 2.5, { w: 2.5, cols: ['#e8b83a', '#3f5a48', '#22384a', '#d04a3a', '#2a2733'] }, U), C('shoewall.boots', 6.5, 4.5, { w: 2.5, c: '#5a4030', cols: ['#6a4428', '#8a5a3a', '#3a2a20', '#c8a070'], seed: 2 }),
      P('barrel', .5, 5, { tag: 1 }), P('barrel', .5, 6, { c: '#5a4030', fill: '#e8b83a' }), P('crate', 0, 7, { items: ['#e8b83a', '#22384a', '#d9722e'] }), V('clothing.accessories', 5.5, 3, { hats: true }), V('clothing.accessories', 5.5, 5),
      V('clothing.counter', 8.5, 6, { c: '#5a4030', top: '#22384a', name: 'SALTLINE', ink: '#f2c230' }, TILL), V('generic.bench', 9.5, 2, { c: '#8a6a48' }, FL({ n: 'seats', ns: 1 })), V('clothing.mirror', 10.5, 4, { c: '#3a3f4c' }),
      MQ(3, 7, 0, 1, 2), MQ(7, 7, 1, 1, 2), HL(1.5, 3.5, 'lantern', '#ffd070'), HL(8, 3.5, 'lantern', '#ffd070'), SPOT(5, 6.5)],
    npc: [S(3.2, 1.7, 3), S(7.4, 3.7, 3), S(6.4, 1.2, 3)], exits: [{ x: 5, y: 7.5 }] });

/* ---- Otterline Boathouse (Harborside rowing club) 10 x 9: white and team red, oars on the wall, a rowing machine and a treadmill to try the kit on */
store('cs_otterline', { signature: 'The row of oars, the pennants, and the rowing machine in the middle of the shop.', tryThis: ['Look at the kit on the mannequins by the machine', 'Browse the wall of runners', 'Ask Coach Renny about the six o\'clock eight'], activities: ['browse', 'seat'] },
  { w: 10, d: 9, floor: GT.f_lino, floors: [{ x0: 3, y0: 3, x1: 7.5, y1: 6.5, floor: GT.f_mat }], wall: { color: '#f4f0e8', trim: '#d2392f', rail: 1.3, h: 3 },
    items: [PY('sign', 6, { text: 'OTTERLINE', bg: '#d2392f', fg: '#f4f0e8', lit: 1 }, 2.35), WY('cs.boards', .5, { w: 2.5, kind: 'oars', cols: ['#d2392f', '#f4f0e8'] }, 0), WY('clothing.shoewall', 3.5, { w: 2.5, c: '#f4f0e8', seed: 21 }, 0), WX('gym.mirror', 2, { w: 3 }), WX('generic.window', 6, { w: 2 }),
      V('generic.lockers', 6.5, 0, { w: 2, c: '#d2392f' }), V('clothing.fitting', 9, 0, { c: '#f4f0e8', cc: '#d2392f' }, U),
      C('hang', 2.5, 2.5, { kind: 'pennants', l: 5 }),
      C('rack', .5, 2, { w: 2, cols: ['#d2392f', '#f4f0e8', '#2a2733', '#d2392f', '#8a9098'], seed: 3, trim: .8, tc: '#f4f0e8' }, U), C('rack', .5, 3.5, { w: 2, cols: ['#2a2733', '#d2392f', '#34507f', '#f4f0e8'], seed: 6 }), C('rack', .5, 5, { w: 2, cols: ['#2a2733', '#8a9098', '#d2392f', '#34507f'], seed: 8, trim: .9, tc: '#f4f0e8' }, U),
      V('gym.rower', 3.5, 3.5), V('gym.treadmill', 4, 5), MQ(6.5, 3.5, 0, 1, 0), MQ(6.5, 5, 1, 1, 0),
      C('foldtable', 7.5, 2, { w: 2, c: '#f4f0e8', cols: ['#d2392f', '#f4f0e8', '#2a2733', '#8a9098'], seed: 3 }, U), V('clothing.accessories', 8, 4.5, { hats: true }), V('clothing.accessories', 9, 4.5),
      V('clothing.counter', 7.5, 7, { c: '#f4f0e8', top: '#d2392f', name: 'OTTERLINE', ink: '#d2392f' }, TILL), V('generic.bench', 1, 7.5, { c: '#e8e2d4' }, { n: 'seats', ns: 1 }),
      HL(2.5, 4.5, 'tube'), HL(5.5, 4.5, 'tube'), HL(8, 4.5, 'tube')],
    npc: [S(1.7, 3.1, 3), S(4.6, 1.2, 3), S(8.6, 3.6, 3)], exits: [{ x: 4.5, y: 8.5 }] });

/* ---- Brim & Buckle (Arts Quarter) 8 x 8: a rose-striped box of hats to the ceiling, hat boxes, jewellery under glass, a chandelier */
store('cs_brim', { signature: 'Two walls of hats, the trees of hats between them, and the lit jewellery cases.', tryThis: ['Try the hat trees', 'Peer into both jewellery cases', 'Ask Odette for the honest answer'], activities: ['browse', 'seat'] },
  { w: 8, d: 8, floor: GT.f_carpet, wall: { color: '#f2d8d0', pattern: 'stripes', color2: '#eac8c4', trim: '#7a2a4a', h: 3.1 },
    items: [PY('sign', 2, { text: 'BRIM & BUCKLE', bg: '#7a2a4a', fg: '#ffd9a0', fr2: '#d8a848' }, 2.45), PY('thrift.hatwall', .5, { w: 3, seed: 1 }, 1), PX('thrift.hatwall', 1.5, { w: 3, seed: 4 }, 1), WX('generic.window', 5.5, { w: 2 }),
      V('generic.rug', 2.5, 3, { w: 3, d: 2.5, c: '#7a2a4a', c2: '#ffd9a0', inner: '#8a3a5a' }),
      C('cubby', 4, 0, { w: 2.5, h: 2, kind: 'boxes', c: '#f1ede4', cols: ['#7a2a4a', '#2f9a94', '#f2c230', '#f4b8c8', '#3a3f4c'], back: '#eac8c4', seed: 6 }), V('clothing.mirror', 7, .5, { c: '#d8a848' }),
      C('accessories.hats', 1, 2.5, { seed: 1 }, U), C('accessories.hats', 1, 4.5, { seed: 3, cols: ['#2f9a94', '#f2c230', '#f1ede4', '#7a2a4a', '#3a3f4c', '#c0704a'] }, U),
      P('jewel.case', 3, 2.5, { velvet: '#7a2a4a' }, U), P('jewel.case', 3, 4.5, { velvet: '#2f6a6a' }, U), V('clothing.accessories', 5.5, 2.5), V('clothing.accessories', 5.5, 4.5, { hats: true }),
      V('clothing.counter', 5.5, 6.5, { c: '#f1ede4', top: '#7a2a4a', name: 'BRIM', ink: '#7a2a4a' }, TILL), V('clothing.pouf', 6.5, 3, { c: '#2f9a94' }, { n: 'seats', ns: 1 }),
      MQ(.5, 6.5, 0, 1, 3), MQ(1.5, 7, 1, 1, 3), V('generic.plant', 7.5, 7.5, { flower: '#e87aa0', s: 1.2, pot: '#f1ede4' }), HL(3.5, 3.5, 'chandelier'), SPOT(1, 6.5)],
    npc: [S(1.7, 1.2, 3), S(4.7, 3.7, 2), S(2.2, 5.7, 2)], exits: [{ x: 4, y: 7.5 }] });

/* ---- Little Lantern Atelier (Maplewood cottage) 9 x 8: a workshop you can shop in: the big print table, cloth on a line overhead, paper lanterns, rolls of fabric */
store('cs_lantern', { signature: 'The print table in the middle of the room, the washing line of fresh prints above it, and the paper lanterns.', tryThis: ['Look over the print table', 'Browse the indigo rail', 'Ask Wren why the lanterns lean'], activities: ['browse', 'seat'] },
  { w: 9, d: 8, floor: GT.f_wood, floors: [{ x0: 2.5, y0: 2, x1: 6.5, y1: 4.5, floor: GT.f_tile }], wall: { color: '#f6efe0', trim: '#2a3a6a', h: 3 },
    items: [PY('sign', 3, { text: 'LITTLE LANTERN', bg: '#2a3a6a', fg: '#f2c230' }, 2.35), WX('generic.window', 1.5, { w: 2.5 }), WX('home.wall.photos', 5, { seed: 6 }, 1.6),
      C('cubby', .5, 0, { w: 2.5, h: 2, kind: 'rolls', c: '#c8a068', cols: ['#2a3a6a', '#e8b83a', '#f4f0e8', '#c0563a', '#3f6a4a'], back: '#8a6a48', seed: 3 }), V('generic.plant', 3.5, 0, { flower: '#e8b83a', s: 1.1, pot: '#c0563a' }),
      C('rack', 5, .5, { w: 2, wood: '#c8a068', cols: ['#f4f0e8', '#e8b83a', '#2a3a6a', '#f08ab0', '#c0563a'], seed: 2, trim: .7, tc: '#2a3a6a' }, U), V('clothing.fitting', 8, 0, { c: '#f6efe0', cc: '#2a3a6a' }, U),
      C('worktable', 3, 2.5, { w: 3, kind: 'print', c: '#c8a068' }), C('hang', 3, 3, { kind: 'line', l: 3.5 }), C('hang', 1, 6, { kind: 'lanterns', l: 3 }),
      P('platform', 0, 4.5, { w: 1, d: 2.5, c: '#c8a068' }), MQ(0, 5, 0, 0, 2, { z: .25 }), MQ(0, 6, 1, 0, 2, { z: .25 }),
      C('rack', 1.5, 5, { w: 2, wood: '#c8a068', cols: ['#2a3a6a', '#34507f', '#e8b83a', '#f4f0e8'], long: true, seed: 5, trim: .7, tc: '#f2c230' }, U), C('rack', 1.5, 6.5, { w: 2, wood: '#c8a068', cols: ['#34507f', '#2a3a6a', '#c8ad7a', '#c0563a'], seed: 8 }),
      V('clothing.roundrack', 7.5, 2, { seed: 4, pal: 'warm' }, U), C('foldtable', 7, 4, { w: 2, c: '#c8a068', cols: ['#2a3a6a', '#f4f0e8', '#e8b83a', '#c0563a'], seed: 6 }),
      V('clothing.accessories', 1, 2.5, { hats: true }), V('clothing.accessories', 2, 2.5), V('clothing.mirror', 8.5, 5.5, { c: '#c8a068' }),
      V('clothing.counter', 5.5, 6.5, { c: '#c8a068', top: '#2a3a6a', name: 'LANTERN', ink: '#f2c230' }, TILL), V('generic.bench', 4.5, 5, { c: '#c8a068' }, { n: 'seats', ns: 1 }), V('generic.plant', 8.5, 7.5, { s: 1.4, pot: '#2a3a6a' })],
    npc: [S(4.4, 4.2, 3), S(6.2, 1.7, 3), S(2.6, 6.2, 3)], exits: [{ x: 4.5, y: 7.5 }] });
