// Hand-made interiors for the converted SHOPS, SERVICES and GROCERIES (rooms `pub:<n>`, see src/sim/public_places.js + unique_rooms.js).
// One builder per place, keyed by the place NAME (fallback: pub id when the kind still matches). Part 1: services, florists, bodegas, groceries.
// Part 2 (places_shops2.js): boutique/thrift, books/records/comics, stationery, pharmacy, pets, toys, hardware, gallery, art supply, cheese.
// Signature fixtures: src/art/venue/places_shop_art.js (`furn.pshop.*`). Notes: docs/reports/unique_shops.md.
// Contract per room: one checkout-tagged counter with a staff spot, 6-12 npcSpots, `music`, exit on the front wall, everything reachable.
import { GT } from '../../engine/world.js';
import { V, WY, WX, S } from './venues_lib.js';
import { registerUnique, registerInfo } from './unique_rooms.js';

export const P = (a, x, y, p, o) => V('pshop.' + a, x, y, p, o);
export const PY = (a, at, p, m) => WY('pshop.' + a, at, p, m);
export const PX = (a, at, p, m) => WX('pshop.' + a, at, p, m);
export const CK = { n: 'staff use' }, CKT = { n: 'staff use', tags: ['checkout'] }, U = { n: 'use' };
export const FL = o => Object.assign({ flip: true }, o);
/** wall pieces that draw at absolute heights need mount 0 */
export const clock = (wall, at, c) => (wall === 'y' ? WY : WX)('generic.clock', at, c ? { c } : null, 0);
export const neon = (wall, at, p) => (wall === 'y' ? WY : WX)('bar.neon', at, p, 0);
export const HL = (x, y, kind, c, e) => P('hanglight', x, y, Object.assign({ kind, c }, e));
export const HG = (x, y, kind, e) => P('hanging', x, y, Object.assign({ kind }, e));
const FOOD = ['cafe', 'bakery', 'diner', 'eatery', 'restaurant', 'bar'];
const BY_NAME = new Map(), BY_ID = new Map();
/** define(name, n, key, info, build): key = place.kind || place.tpl (guards the pub-id fallback) */
export function define(name, n, key, info, build) { const e = { key, build }; BY_NAME.set(name, e); BY_ID.set('pub:' + n, e); registerInfo(name, info); }
registerUnique(pl => {
  if (!pl || FOOD.includes(pl.tpl)) return null;
  const key = pl.kind || pl.tpl; let e = BY_NAME.get(pl.name); if (!e) { e = BY_ID.get(pl.id); if (e && e.key !== key) e = null; }
  if (!e) return null;
  const d = e.build(pl); d.name = pl.name; d.pub = { tpl: pl.tpl, kind: pl.kind || '', layout: 'unique' }; return d;
});

/* =================================================================== SERVICES */
// ---- Otis & Sons Barbershop (Old Town) 10 x 7: three chrome-and-oxblood chairs facing a wall of bulb mirrors, checkerboard floor, spinning pole
define('Otis & Sons Barbershop', 22, 'barber', {
  blurb: 'Three generations of Otises have run clippers over Old Town from these oxblood chairs. The checkerboard floor is original; so are most of the jokes.',
  signature: 'The row of chrome barber chairs under bulb-lit mirrors, and the pole that never stops turning.',
  tryThis: ['Book a cut at the front desk and take the first chair', 'Wait your turn on the bench with a magazine'], activities: ['service:barber', 'seat'] },
() => ({ w: 10, d: 7, music: 'shop', floor: GT.f_check, wall: { color: '#e8dcc0', trim: '#7a2a2a', rail: 1.1 },
  items: [PX('sign', .3, { text: 'OTIS & SONS', bg: '#7a2a2a', fg: '#f6e8c0', fr2: '#d8a848' }, 2.05), WX('home.wall.photos', 1, { seed: 2 }, 1), WX('generic.window', 4.6), clock('y', 9.3, '#7a2a2a'), WY('home.wall.photos', 7.4, { seed: 5 }, 1.75),
    V('generic.rug', 3.5, 4, { w: 3, d: 2, c: '#7a2a2a', c2: '#d8a848' }),
    P('barber.station', .5, 0, { bulbs: 1 }), P('barber.station', 3, 0, { bulbs: 1 }), P('barber.station', 5.5, 0, { bulbs: 1 }),
    P('barber.armchair', 1, 1, null, { n: 'seats' }), P('barber.armchair', 3.5, 1, null, { n: 'seats' }), P('barber.armchair', 6, 1),
    P('shelf', 8, 0, { w: 1.5, h: 1.6, kind: 'household', rows: 3, c: '#5a3a28', back: '#2a1f18' }, U),
    V('clothing.counter', 7.5, 2.5, { c: '#5a3a28', top: '#e8dcc0', name: 'OTIS', ink: '#f6e8c0' }, CK),
    V('cornerstore.magrack', 0, 2, { seed: 4 }, FL()), V('generic.bench', 0, 3, { c: '#7a2a2a' }, FL({ n: 'seats' })), V('generic.bench', 0, 4.5, { c: '#7a2a2a' }, FL({ n: 'seats', ns: 1 })),
    V('generic.coatrack', 9.5, 6.5), P('barber.pole', 7, 6.5), V('generic.plant', 9.5, 4.5, { kind: 'palm', s: 1.4, pot: '#7a2a2a' }),
    HL(1, 1.5, 'shade', '#2f4a3a'), HL(3.5, 1.5, 'shade', '#2f4a3a'), HL(6, 1.5, 'shade', '#2f4a3a')],
  npc: [S(2.4, 1.6, 2, 'work', 'staff'), S(7.2, 1.6, 2, 'work', 'staff')], exits: [{ x: 5, y: 6.5 }] }));

// ---- Lacquer Lounge Nail Bar (Downtown) 9 x 8: pink-and-gold salon, manicure bar row, pedicure thrones along the side, polish wall, chandelier
define('Lacquer Lounge Nail Bar', 17, 'nails', {
  blurb: 'Blush walls, gold trim and four hundred shades of polish arranged like a paint chart. Downtown comes here to sit still for once.',
  signature: 'The wall of polish bottles behind the manicure bar, and the pedicure thrones with their little blue foot baths.',
  tryThis: ['Pick a colour off the polish wall and book a manicure at the desk', 'Sink into a pedicure throne'], activities: ['service:nails', 'seat', 'browse'] },
() => ({ w: 9, d: 8, music: 'shop', floor: GT.f_tile, floors: [{ x0: 0, y0: 3.5, x1: 2, y1: 8, floor: GT.f_stone }], wall: { color: '#f8e4e8', trim: '#d8a848' },
  items: [PY('nail.polishwall', .5, { w: 3 }, 1), WY('home.wall.mirror', 4), WY('home.wall.mirror', 5.2, { round: true }), PX('sign', 4, { text: 'LACQUER LOUNGE', bg: '#fbf2f2', fg: '#e8407a', fr: '#d8a848', lit: 1 }, 2.05), WX('generic.window', 1.4),
    V('generic.rug', 3, 4.5, { w: 3, d: 2, c: '#e87aa0', c2: '#f1ede4' }),
    P('shelf', 6.5, 0, { w: 2, kind: 'household', pal: 'polish', name: 'POLISH', hc: '#e8407a', c: '#f1ede4', back: '#f8e4e8' }, U),
    P('nail.tableset', .5, 1.5, null, { n: 'seats staff' }), P('nail.tableset', 2.5, 1.5, { a: '#b07ad8', seed: 4 }, { n: 'seats staff' }), P('nail.tableset', 4.5, 1.5, { a: '#6fb6d8', seed: 8 }, { n: 'staff' }),
    V('clothing.counter', 6.5, 3, { c: '#f4b8c8', top: '#f1ede4', name: 'LACQUER', ink: '#a82a4a' }, CK),
    P('nail.pedi.armchair', 0, 4, null, FL({ n: 'seats' })), P('nail.pedi.armchair', 0, 5.5, { c: '#c8b8e8' }, FL()), P('nail.pedi.armchair', 0, 7, { c: '#9fd0e8' }, FL({ n: 'seats' })),
    V('generic.sofa', 6.5, 5.5, { c: '#e87aa0' }, { n: 'seats', ns: 1 }), V('cafe.lowtable', 7, 7), HL(4, 5, 'chandelier'),
    V('generic.plant', 8.5, 7.5, { flower: '#e87aa0', s: 1.1, pot: '#f1ede4' }), V('home.plant.monstera', 2.5, 7.5)],
  npc: [S(5.2, 3.6, 3)], exits: [{ x: 4.5, y: 7.5 }] }));

// ---- Black Cat Ink (Arts) 8 x 9: dark brick studio, two screened booths with black benches, neon flash wall, red bulbs, a shop cat
define('Black Cat Ink', 41, 'tattoo', {
  blurb: 'Brick painted the colour of a midnight alley, red bulbs, and a shop cat who judges every design from the top of her tower.',
  signature: 'Glow-in-the-dark flash sheets wall to wall, and two screened booths with black leather benches.',
  tryThis: ['Flip through the flash and book a session at the counter', 'Say hello to the cat (she will ignore you)'], activities: ['service:tattoo', 'flash_wall', 'seat'] },
() => ({ w: 8, d: 9, music: 'bar', floor: GT.f_darkwood, wall: { color: '#2a2430', pattern: 'brick', trim: '#a82a2a' },
  items: [neon('y', .6, { kind: 'text', text: 'BLACK CAT', c: '#ff4a4a', c2: '#f4f0e8' }), PY('flash', 3.5, { w: 2, dark: 1, seed: 2 }, .8), PX('flash', 1, { w: 4, dark: 1, seed: 5 }, .9), PX('flash', 5.6, { w: 2, dark: 1, seed: 9 }, .9),
    V('home.rug', 3.5, 6.5, { w: 3, d: 2, pat: 'persian', c: '#7a1f2a', c2: '#d8a848', c3: '#2a2733' }),
    P('tattoo.bench', 1, 1.5, null, { n: 'seats staff' }), P('tattoo.cart', 3.5, 1.5, { seed: 1 }), V('clinic.screen', .5, 3, { c: '#a82a2a' }),
    P('tattoo.bench', 1, 4.5, { c: '#5a1f2a' }, { n: 'staff' }), P('tattoo.cart', 3.5, 4.5, { seed: 5 }),
    P('art.flatfile', 5.5, 0, { c: '#3a3f4c' }, U), V('bar.speaker', 7.5, 2),
    V('clothing.counter', 5.5, 5, { c: '#2a2733', top: '#a82a2a', name: 'INK', ink: '#f4f0e8' }, CK),
    V('cafe.armchair', .5, 6.5, { c: '#a82a2a' }, { n: 'seats' }), V('generic.floorlamp', 0, 8, { c: '#c0563a' }), V('home.cattree', 7, 8, { cat: true, catc: '#2a2733' }),
    HL(2, 2, 'bulb', '#ff8a6a'), HL(2, 5, 'bulb', '#ff8a6a'), HL(6, 6.5, 'bulb', '#ff8a6a')],
  npc: [S(3, 7.4, 2)], exits: [{ x: 4.5, y: 8.5 }] }));

// ---- Ink & Ivy Tattoo (Arts) 11 x 7: airy plant-filled studio, open stations in a row, paper flash, hanging baskets, consultation table
define('Ink & Ivy Tattoo', 43, 'tattoo', {
  blurb: 'The opposite of a back-alley parlour: white walls, pale wood and so much trailing ivy that the needles sound like a greenhouse in the rain.',
  signature: 'Open tattoo stations under a canopy of hanging plants, with botanical flash pinned in neat rows.',
  tryThis: ['Browse the botanical flash, then book at the front counter', 'Talk a design through at the consultation table'], activities: ['service:tattoo', 'flash_wall', 'seat'] },
() => ({ w: 11, d: 7, music: 'shop', floor: GT.f_wood, wall: { color: '#f1efe6', trim: '#3f6a4a' },
  items: [PY('flash', .5, { w: 3, seed: 1 }, .85), PY('flash', 4, { w: 2, seed: 7, board: '#e8dcc0' }, .85), WY('generic.window', 6.5, { plant: true }), PX('sign', .4, { text: 'INK & IVY', bg: '#3f6a4a', fg: '#f1efe6' }, 2.05), WX('generic.window', 4),
    V('generic.rug', 4, 4.5, { w: 3, d: 2, c: '#5f8a7a', c2: '#f1ede4' }),
    P('tattoo.bench', .5, 1.5, { c: '#3f6a4a' }, { n: 'seats staff' }), P('tattoo.cart', 3, 1.5, { seed: 2 }), P('tattoo.bench', 4, 1.5, { c: '#c0704a' }, { n: 'staff' }), P('tattoo.cart', 6.5, 1.5, { seed: 6 }),
    V('clothing.counter', 8.5, 2, { c: '#f1ede4', top: '#b07444', name: 'INK+IVY', ink: '#3f6a4a' }, CK), V('home.plant.monstera', 9, 0), V('home.plant.fiddle', 10.5, 0),
    V('cafe.tableset', 1, 4.5, { c: '#d2a26a', cc: '#3f6a4a' }, { n: 'seats', ns: 1 }), V('generic.sofa', 7.5, 4.5, { c: '#5f8a7a' }, { n: 'seats' }), V('cafe.lowtable', 8, 6),
    V('generic.plant', 10.5, 6.5, { kind: 'palm', s: 1.5, pot: '#f1ede4' }), V('home.plant.snake', 0, 6.5), V('home.plant.monstera', 0, 3),
    HG(1.5, 3, 'basket'), HG(5, 3, 'basket', { c: '#f2c230', seed: 3 }), HG(8, 4, 'basket', { seed: 5 }), HG(3.5, 5.5, 'basket', { c: '#f1ede4', seed: 8 }), HL(6, 5, 'shade', '#f1ede4')],
  npc: [S(6.2, 3.4, 3)], exits: [{ x: 5.5, y: 6.5 }] }));

// ---- Suds & Bubbles Laundromat (Old Town) 12 x 8: wall of numbered washers, stacked dryers down the side, island of machines, folding tables
define('Suds & Bubbles Laundromat', 21, 'laundry', {
  blurb: 'Eight washers, eight dryers, one heroic attendant and the best people-watching in Old Town. Bring quarters; leave with warm socks.',
  signature: 'The long wall of numbered front-loaders tumbling away under a blue tiled sign.',
  tryThis: ['Pay for a wash-and-fold at the attendant desk', 'Wait out the spin cycle on the bench', 'Buy soap from the machine by the door'], activities: ['service:laundry', 'laundry_machine', 'seat'] },
() => ({ w: 12, d: 8, music: 'shop', floor: GT.f_lino, floors: [{ x0: 2.5, y0: 2, x1: 8, y1: 6.5, floor: GT.f_check }], wall: { color: '#dfeaf0', pattern: 'tile', trim: '#3c64ad' },
  items: [PY('sign', 1, { text: 'SUDS & BUBBLES LAUNDROMAT', bg: '#3c64ad', fg: '#f4fbfc', lit: 1 }, 1.75), clock('y', 11.3, '#3c64ad'), WX('generic.window', 5.8),
    ...[0, 1, 2, 3, 4, 5, 6, 7].map(i => P('laundry.washer', .5 + i, 0, { on: i % 3 === 1, load: ['#e87aa0', '#f2c230', '#6fb6d8'][i % 3], num: i + 1 }, i === 2 || i === 5 ? U : null)),
    P('laundry.soap', 9, 0, null, U), V('generic.vending', 10, 0, null, U), V('generic.bin', 11.5, 0),
    ...[0, 1, 2, 3].map(i => P('laundry.dryer', 0, 1.5 + i, { on: i % 2 === 0, on2: i === 1 || i === 2, seed: i * 2, num: i + 1 }, FL(i === 2 ? U : null))),
    ...[0, 1, 2, 3].map(i => P('laundry.washer', 3 + i, 2.5, { c: '#f4e9cf', on: i === 2, load: '#3f8a55', num: 9 + i }, i === 1 ? U : null)),
    P('laundry.foldtable', 2.5, 4.5, null, U), P('laundry.foldtable', 5, 4.5, { seed: 4 }), P('laundry.cart', 1, 6.5, { rail: 1 }), P('laundry.cart', 8, 3.5, { seed: 4 }),
    V('cornerstore.counter', 9.5, 2.5, { c: '#3c64ad' }, CK),
    V('generic.bench', 9.5, 4.5, { c: '#6fb6d8' }, { n: 'seats' }), V('generic.bench', 9.5, 6, { c: '#6fb6d8' }, { n: 'seats', ns: 1 }), V('generic.plant', 11.5, 7.5),
    HL(4.5, 1.5, 'tube'), HL(4.5, 3.5, 'tube'), HL(9.5, 3.5, 'tube'), HL(4.5, 6, 'tube')],
  npc: [S(1.2, 2.4, 2)], exits: [{ x: 7.5, y: 7.5 }] }));

/* =================================================================== FLORISTS */
// ---- Bloom & Paper (Park) 8 x 8: potting-shed florist, striped flower cart in the middle, cold case, bucket steps, wrapping bench as the till
define('Bloom & Paper', 4, 'florist', {
  blurb: 'Half potting shed, half stationery drawer: plank walls, a stone floor still damp from the watering can, and a striped cart heaped with whatever was cut this morning.',
  signature: 'The red-striped flower cart parked in the middle of the shop.',
  tryThis: ['Choose stems from the cart and have them wrapped at the bench', 'Pick a card from the spinner to go with them'], activities: ['flower_display', 'browse'] },
() => ({ w: 8, d: 8, music: 'shop', floor: GT.f_stone, floors: [{ x0: 4.5, y0: 0, x1: 8, y1: 3, floor: GT.f_wood }], wall: { color: '#e4ecd8', pattern: 'planks', trim: '#5a8a6a', h: 3 },
  items: [PY('sign', 3, { text: 'BLOOM & PAPER', bg: '#5a8a6a', fg: '#f4f0e8' }, 2.3), WX('generic.window', 4.6),
    P('flower.coldcase', .5, 0, null, U), P('shelf', 3, 0, { w: 1.5, h: 1.8, kind: 'household', pal: 'paper', c: '#8a5a3a', back: '#3a2a20' }), P('paper.rolls', 7, 0),
    P('flower.worktable', 5, 1.5, null, CKT),
    P('flower.buckets', 0, 2, { seed: 1 }, FL(U)), P('flower.buckets', 0, 4.5, { seed: 4, c: '#8a5a3a' }, FL()),
    P('flower.cart', 3, 3.5, null, U), V('bookstore.spinner', 7.5, 3.5, { seed: 2 }, U), V('cornerstore.magrack', 7, 5, { seed: 5 }),
    V('home.plant.fiddle', 0, 7.5), V('generic.plant', 7.5, 7.5, { flower: '#f2c230', pot: '#c0704a' }), V('home.plant.monstera', 2, 7.5),
    HG(2, 2.5, 'basket'), HG(6, 4, 'basket', { c: '#f2c230', seed: 4 }), HG(2, 6, 'basket', { c: '#b07ad8', seed: 7 }), HG(6, 6.5, 'basket', { seed: 2 })],
  npc: [S(1.6, 5.5, 2), S(6, 6, 1)], exits: [{ x: 4, y: 7.5 }] }));

// ---- Bloom & Paper Riverside (Downtown) 11 x 6: sleek concrete-and-black branch, one long wall of buckets, bouquet cooler, paper lanterns
define('Bloom & Paper Riverside', 61, 'florist', {
  blurb: 'The downtown sibling traded the potting shed for polished concrete and matte black. Same flowers, sharper suit.',
  signature: 'A six-metre wall of black buckets in colour order, lit by paper lanterns.',
  tryThis: ['Walk the bucket wall end to end', 'Grab a ready-made bouquet from the cooler on your way to a date'], activities: ['flower_display', 'browse', 'seat'] },
() => ({ w: 11, d: 6, music: 'shop', floor: GT.f_concrete, wall: { color: '#f1efe8', trim: '#2a2733' },
  items: [PX('sign', .3, { text: 'BLOOM & PAPER', bg: '#2a2733', fg: '#f6e04a', lit: 1 }, 2.05),
    P('flower.buckets', .5, 0, { c: '#2a2733', m: '#3a3f4c', seed: 2 }, U), P('flower.buckets', 2.5, 0, { c: '#2a2733', m: '#3a3f4c', seed: 5 }), P('flower.buckets', 4.5, 0, { c: '#2a2733', m: '#3a3f4c', seed: 7 }, U),
    P('flower.coldcase', 7, 0, { c: '#2a2733', name: 'BOUQUETS', hc: '#2a2733' }, U), V('home.plant.fiddle', 9.5, 0),
    V('clothing.counter', 8.5, 2.5, { c: '#2a2733', top: '#f1ede4', name: 'BLOOM', ink: '#f1ede4' }, CK),
    P('flower.worktable', 3, 3, { c: '#d2a26a', paper: '#f4f0e8', a: '#f2c230' }, { n: 'staff' }),
    P('shelf', 0, 2, { w: 1.5, h: 1.6, kind: 'mags', rows: 3, c: '#2a2733', pal: 'paper' }, FL(U)), V('bookstore.spinner', 0, 4.5),
    V('homegoods.plinth', 6, 3.5, { item: 'vase', c: '#2a2733' }), V('generic.bench', 6.5, 5, { c: '#e8e2d4' }, { n: 'seats', ns: 1 }), V('generic.plant', 10.5, 5.5, { kind: 'palm', pot: '#2a2733' }),
    HL(2, 2, 'lantern', '#f6f0e0'), HL(5.5, 2.5, 'lantern', '#f6f0e0', { r: .27 }), HL(8, 4.5, 'lantern', '#f6f0e0')],
  npc: [S(1.5, 1.6, 3), S(9.5, 4.2, 2)], exits: [{ x: 4.5, y: 5.5 }] }));

/* =================================================================== BODEGAS */
// ---- Coast Gas Mini Mart (Railyard) 9 x 6: gas-station shop, coffee + hot-dog bar, beer cave fridges, motor oil, snack gondolas
define('Coast Gas Mini Mart', 6, 'bodega', {
  blurb: 'Fluorescent, orange and open when nothing else is. The coffee has been on since the morning shift; the hot dogs have been turning since the last one.',
  signature: 'The self-serve coffee and hot-dog roller bar, humming under an orange sign.',
  tryThis: ['Pour a truck-stop coffee', 'Stock up on snacks and a slushie for the road'], activities: ['coffee_station', 'browse'] },
() => ({ w: 9, d: 6, music: 'shop', floor: GT.f_lino, wall: { color: '#f0ead8', trim: '#e8843a', rail: 1.2 },
  items: [neon('x', .2, { kind: 'text', text: 'OPEN 24H', c: '#5af07a', c2: '#f6e04a' }), PX('sign', 3, { text: 'COAST GAS', bg: '#e8843a', fg: '#fff8e0' }, 2.05),
    P('coffee.station', .5, 0, null, U), V('cornerstore.fridge', 3, 0, null, U), V('cornerstore.fridge', 4, 0, { name: 'SODA', hc: '#c0392b', seed: 9 }), V('cornerstore.fridge', 5, 0, { name: 'BEER', hc: '#d8a03a', seed: 4 }),
    V('cornerstore.slushie', 6.5, 0, null, U), V('cornerstore.atm', 8, 0),
    V('cornerstore.counter', 6.5, 2, { c: '#e8843a' }, CK),
    P('shelf', 0, 1.5, { w: 1.5, h: 1.6, kind: 'cans', rows: 3, pal: 'oil', name: 'OIL', hc: '#2a2733' }, FL(U)), V('cornerstore.icecream', 0, 3.5, null, FL()), V('cornerstore.gumball', 0, 5.5),
    V('cornerstore.shelf', 2, 2.5, null, U), V('cornerstore.shelf', 4, 2.5, { seed: 4 }), V('cornerstore.shelf', 2, 4, { seed: 7 }), V('cornerstore.shelf', 4, 4, { seed: 2 }, U),
    V('grocery.promo', 7, 3.5, { name: 'SALE' }), V('generic.bin', 8.5, 5.5), HL(3.5, 3.5, 'tube'), HL(6.5, 4.5, 'tube')],
  npc: [S(1.4, 4.4, 2)], exits: [{ x: 6.5, y: 5.5 }] }));

// ---- Birch Lane Pantry (Maplewood) 7 x 8: a converted front room, jars on wooden shelves either side of a lit fireplace, jam tasting barrel
define('Birch Lane Pantry', 39, 'bodega', {
  blurb: 'Somebody\'s front room, minus the sofa, plus two hundred jars. The fire is lit from October and the jam on the barrel is always open.',
  signature: 'The old fireplace still burning between shelves of preserves.',
  tryThis: ['Taste the jam of the week on the barrel', 'Warm up in the armchair by the fire with your shopping'], activities: ['tasting_board', 'seat', 'browse'] },
() => ({ w: 7, d: 8, music: 'quiet', floor: GT.f_wood, wall: { color: '#efe2c8', trim: '#6a4a30', rail: 1 },
  items: [PX('sign', .5, { text: 'BIRCH LANE', bg: '#6a4a30', fg: '#f6e8c0' }, 2.05), WX('generic.window', 5.6, { curtain: '#c0563a' }), WY('home.wall.art', 3, { seed: 3 }, 1.5),
    V('home.rug', 1.5, 5.5, { w: 3, d: 2, pat: 'persian', c: '#8a3a2a', c2: '#e8c878', c3: '#3a2a20' }),
    P('shelf', .5, 0, { kind: 'liquor', pal: 'jar', c: '#8a5a3a', back: '#3a2a20' }, U), V('home.fireplace', 2.5, 0, { on: true }), V('bakery.shelves', 4.5, 0, { seed: 3 }, U),
    V('bakery.counter', 4, 2.5, { c: '#8a5a3a' }, CK),
    P('crate', 0, 2, { items: ['#d63a3a', '#f28a30', '#9ccc4a'] }, FL(U)), P('crate', 0, 3, { items: ['#c8a070', '#e8d8b0', '#6a3a7a'] }, FL()), V('cornerstore.fridge', 0, 4.5, { name: 'MILK', hc: '#6fb6d8' }, FL(U)),
    P('tasting', 2, 4, null, U), P('barrel', 0, 6, { fill: '#d63a3a', tag: 1 }), P('barrel', 0, 6.5, { fill: '#9ccc4a' }),
    V('cafe.armchair', 5.5, 5, { c: '#8a5a3a' }, { n: 'seats' }), V('generic.floorlamp', 6.5, 6), V('home.plant.fiddle', 6.5, 7.5),
    HG(1.5, 2.5, 'basket'), HL(3.5, 3, 'shade', '#c0704a'), HG(5, 4.5, 'basket', { c: '#f2c230', seed: 4 })],
  npc: [S(3.5, 1.4, 3), S(1.4, 5.2, 2)], exits: [{ x: 3.5, y: 7.5 }] }));

// ---- Salt & Co. Provisions (Harbor) 9 x 7: ship's-store grocer, fish on ice in the middle, barrels, tins, rope and buoys overhead
define('Salt & Co. Provisions', 51, 'bodega', {
  blurb: 'Provisioning boats since before the cannery: tins, hard bread, pickles by the barrel and the morning\'s catch laid out on ice.',
  signature: 'The blue ice table of whole fish in the middle of the floor.',
  tryThis: ['See what came off the boats this morning', 'Fish a pickle out of the barrel'], activities: ['browse'] },
() => ({ w: 9, d: 7, music: 'shop', floor: GT.f_darkwood, wall: { color: '#d8dfe0', pattern: 'planks', trim: '#2f4a6a' },
  items: [PX('hw.lifering', .8, { kind: 'oars' }, 1.3), PX('sign', 2.3, { text: 'SALT & CO.', bg: '#2f4a6a', fg: '#f6e8c0' }, 2.05), PX('hw.lifering', 5.6, { kind: 'anchor', bg: '#d8dfe0' }, 1.2), PY('hw.lifering', 5, { bg: '#d8dfe0' }, 1.4),
    P('shelf', .5, 0, { kind: 'cans', pal: 'tin', name: 'TINNED', hc: '#2f4a6a', c: '#c8b898' }, U), V('grocery.fridge', 3, 0, { kind: 'drinks', name: 'COLD', hc: '#2f4a6a', seed: 5 }), V('bakery.sacks', 5, 0), V('cornerstore.backshelf', 6.5, 0),
    V('cornerstore.counter', 6.5, 2, { c: '#2f4a6a' }, CK),
    P('icefish', 3, 3, null, U), P('crate', 0, 2, { items: ['#f6e04a', '#8cc84a', '#e04a3a'] }, FL(U)), P('crate', 0, 3.5, { items: ['#c8a070', '#e8d8b0'] }, FL()),
    P('barrel', 0, 5, { fill: '#5a8a4a', tag: 1 }), P('barrel', 0, 5.5, { fill: '#f1ede4', tag: 1 }), P('barrel', 0, 6, { fill: '#d8c090' }),
    P('hw.rope', 6.5, 4.5, { seed: 2 }, U), V('grocery.produce', 1.5, 5, { items: ['potato', 'onion', 'carrot', 'lemon', 'apple', 'potato', 'onion', 'lime'] }, U),
    HG(2, 2, 'buoy'), HG(5.5, 5, 'buoy', { c: '#f2c230' }), HL(4, 3, 'shade', '#2f4a6a'), HG(8, 3.5, 'buoy', { c: '#3c64ad' })],
  npc: [S(5.6, 3.4, 2), S(1.5, 1.4, 3)], exits: [{ x: 5.5, y: 6.5 }] }));

/* =================================================================== GROCERIES */
const G_ = (x, y, kind, name, hc, seed, o) => V('grocery.gondola', x, y, { kind, name, hc, seed }, o);
// ---- Marchetti's Delicatessen & Grocery (Old Town) 13 x 9: Italian deli counter with hanging salami under a tricolore sign, wine wall, two aisles, one lane
define("Marchetti's Delicatessen & Grocery", 28, 'grocery_m', {
  blurb: 'Nonna Marchetti\'s rules still hang by the slicer: no samples before noon, no arguing about the sauce. The salami curtain over the deli case has been there longer than the street sign.',
  signature: 'The long glass deli case under a row of hanging salami, with a wine wall behind it.',
  tryThis: ['Order at the deli case and taste what is on the barrel', 'Walk the pasta and sugo aisle, then pay at the lane by the door'], activities: ['tasting_board', 'browse'] },
() => ({ w: 13, d: 9, music: 'shop', floor: GT.f_wood, floors: [{ x0: 0, y0: 0, x1: 5.5, y1: 4, floor: GT.f_check }], wall: { color: '#f0e8d0', trim: '#a82a2a', h: 3 },
  items: [PX('sign', .4, { text: "MARCHETTI'S", bg: '#a82a2a', fg: '#f6e8c0', fr2: '#3f8a55' }, 2.3), WX('generic.window', 6),
    V('restaurant.winerack', .5, 0), V('restaurant.winerack', 2, 0, { seed: 4 }), P('shelf', 3.5, 0, { kind: 'cereal', pal: 'pasta', name: 'PASTA', hc: '#3f8a55' }, U), P('shelf', 5.5, 0, { kind: 'liquor', pal: 'jar', name: 'OLIO', hc: '#a82a2a', seed: 3 }),
    V('grocery.fridge', 7.5, 0, { kind: 'dairy', name: 'LATTE', hc: '#3f8a55' }, U), V('grocery.fridge', 9.5, 0, { kind: 'drinks', name: 'BIBITE', hc: '#a82a2a', seed: 5 }), V('grocery.bakery', 11.5, 0, null, U),
    P('deli.case', .5, 2, { w: 4, kind: 'deli', stripe: '#a82a2a' }, { n: 'staff use' }), HG(1, 2.5, 'salami'), HG(2, 2.5, 'salami', { seed: 3 }), HG(3, 2.5, 'salami', { seed: 6 }),
    P('cheese.wheels', 0, 3.5, null, FL(U)), V('grocery.produce', 0, 5.5, { items: ['tomato', 'lemon', 'eggplant', 'pepper', 'onion', 'tomato', 'lime', 'orange'], big: 'melon' }, FL(U)), P('tasting', 2, 4.5, { kind: 'deli' }, U),
    G_(6, 2.5, 'cans', 'SUGO', '#a82a2a', 1, U), G_(8, 2.5, 'cereal', 'BISCOTTI', '#d8a03a', 5), G_(11, 2.5, 'drinks', 'VINO', '#5a1f2a', 9, U),
    G_(6, 4.5, 'cereal', 'CAFFE', '#5a3a28', 11), G_(8, 4.5, 'cans', 'CONSERVE', '#3f8a55', 13, U), G_(11, 4.5, 'household', 'CASA', '#3c64ad', 15),
    V('grocery.aislesign', 7, 3.5, { n: 1, a: 'SUGO', b: 'CAFFE', c: '#a82a2a' }),
    V('grocery.checkout', 5, 6.5, null, CK), V('grocery.promo', 9, 6.5, { name: 'SALE', c: '#3f8a55' }), V('grocery.flowers', 12, 6.5), V('grocery.baskets', 12.5, 8.5), V('grocery.crates', 3, 7.5, { items: ['lemon', 'orange', 'tomato'] }),
    HL(2.5, 3.5, 'shade', '#a82a2a'), HL(7.5, 5.5, 'shade', '#3f8a55')],
  npc: [S(10.4, 3.6, 0), S(2.5, 1.5, 3, 'work', 'staff')], exits: [{ x: 10.5, y: 8.5 }] }));

// ---- Bay Thread Co-op Market (Arts) 12 x 10: member-run co-op, wall of bulk bins, big produce island on stone, sideways refill aisles, notice board
define('Bay Thread Co-op Market', 46, 'grocery_m', {
  blurb: 'Member-owned, volunteer-stacked and proudly unpackaged. Bring your own jar, weigh it, fill it, argue gently about oat milk at the till.',
  signature: 'The wall of gravity bulk bins and the heaped produce island in the middle.',
  tryThis: ['Scoop something from the bulk bins', 'Read the community notice board', 'Pick up a bunch of flowers by the door'], activities: ['browse', 'flower_display', 'tasting_board'] },
() => ({ w: 12, d: 10, music: 'shop', floor: GT.f_wood, floors: [{ x0: 1.5, y0: 2.5, x1: 6.5, y1: 6.5, floor: GT.f_stone }], wall: { color: '#e4ecd8', trim: '#3f6a4a', h: 3 },
  items: [PX('sign', .3, { text: 'BAY THREAD CO-OP', bg: '#3f6a4a', fg: '#f4f0e8' }, 2.3), PX('flash', 5, { w: 2, board: '#c8a068', seed: 3 }, .9), WX('generic.window', 7.5),
    P('bulk.bins', .5, 0, { seed: 1 }, U), P('bulk.bins', 2.5, 0, { seed: 6 }), V('grocery.fridge', 5, 0, { kind: 'drinks', name: 'KOMBUCHA', hc: '#3f6a4a', seed: 3 }, U), V('grocery.fridge', 7, 0, { kind: 'dairy', name: 'DAIRY', hc: '#6fb6d8' }),
    V('grocery.bakery', 9.5, 0, null, U), V('grocery.crates', 11, 0, { tall: true }),
    V('grocery.produce', 2, 3, { items: ['apple', 'pear', 'orange', 'lemon', 'lime', 'grape', 'apple', 'pear'], big: 'melon' }, U), V('grocery.produce', 4, 3, { items: ['lettuce', 'broc', 'carrot', 'pepper', 'tomato', 'eggplant', 'lettuce', 'carrot'] }),
    V('grocery.produce', 2, 5, { items: ['potato', 'onion', 'carrot', 'potato', 'onion', 'tomato', 'pepper', 'broc'] }, U), V('grocery.produce', 4, 5, { items: ['banana', 'orange', 'apple', 'grape', 'lemon', 'banana', 'pear', 'lime'] }), V('grocery.scale', 6, 4),
    V('grocery.gondola', 8, 2, { kind: 'cereal', name: 'GRAINS', hc: '#8a5a3a', seed: 2 }, FL(U)), V('grocery.gondola', 8, 4, { kind: 'cans', name: 'BEANS', hc: '#3f6a4a', seed: 5 }, FL()),
    V('grocery.gondola', 10, 2, { kind: 'drinks', name: 'OILS', hc: '#d8a03a', seed: 8 }, FL()), V('grocery.gondola', 10, 4, { kind: 'household', name: 'REFILL', hc: '#2f8f8a', seed: 9 }, FL(U)),
    P('barrel', 0, 2.5, { fill: '#e8d8a0', tag: 1 }), P('barrel', 0, 3, { fill: '#8a5a3a', tag: 1 }), P('barrel', 0, 3.5, { fill: '#c8842a' }),
    V('grocery.checkout', 1.5, 7.5, null, CK), P('tasting', 5.5, 7.5, null, U), P('flower.buckets', 9.5, 7, { c: '#8a5a3a' }, U), V('grocery.baskets', 5, 9.5), V('grocery.trolley', 10.5, 9, { n: 1 }), V('generic.plant', 11.5, 6, { s: 1.5 }),
    HG(3, 2, 'basket'), HG(6.5, 6.5, 'basket', { c: '#f2c230', seed: 3 }), HG(9, 6.5, 'basket', { seed: 6 }), HL(4, 4.5, 'shade', '#3f6a4a'), HL(9.5, 3.5, 'shade', '#3f6a4a')],
  npc: [S(7.2, 3.2, 2), S(11.2, 5, 2)], exits: [{ x: 7.5, y: 9.5 }] }));
