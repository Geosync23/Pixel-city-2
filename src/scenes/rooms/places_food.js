// Unique hand-made interiors for the FOOD & DRINK public places (rooms 'pub:<n>', see src/sim/public_places.js + unique_rooms.js).
// One builder per place, keyed by the place NAME with a fallback by pub id. This file: shared helpers + tea houses, cafes, bakeries.
// places_food2.js: diner, restaurant, bars and the counter-service eateries. Signature fixture art: src/art/venue/places_food_art.js (furn.pf.*).
// Contract of every room: exactly one checkout-tagged counter with a staff spot, seats where food is eaten in, 6-12 npcSpots, music, front exit.
import { GT } from '../../engine/world.js';
import { V, WY, WX, S } from './venues_lib.js';
import { registerUnique, registerInfo } from './unique_rooms.js';

const BY_NAME = new Map(), BY_ID = new Map();
/** register a place: P(pubNumber, name, () => roomDef, guideInfo) */
export function P(n, name, build, info) { BY_NAME.set(name, build); BY_ID.set('pub:' + n, build); if (info) registerInfo(name, info); }
export const FOOD_PLACES = BY_NAME;
registerUnique(place => { if (!place) return null; const f = BY_NAME.get(place.name) || BY_ID.get(place.id); if (!f) return null; const def = f(place); def.name = place.name || def.name; return def; });

export const ST = { n: 'staff use' }, SE = { n: 'seats' }, U = { n: 'use' }, se = ns => ({ n: 'seats', ns });
export const lamp = (x, y, c) => V('generic.pendant', x, y, c ? { c } : null);
export const lantern = (x, y, c) => V('ramen.lantern', x, y, c ? { c } : null);
export const plant = (k, x, y, s, pot) => V(k === 'g' ? 'generic.plant' : 'home.plant.' + k, x, y, { s: s || 1.2, pot: pot || '#f1ede4' });
export const R = (name, w, d, o) => Object.assign({ name, w, d }, o);
export { V, WY, WX, S, GT };

// ================================================================= TEA
// ---------------------------------------------------------------- The Tea Garden (park) 12 x 8: a glass-walled conservatory tea room full of plants
P(1, 'The Tea Garden', () => R('The Tea Garden', 12, 8, { music: 'quiet', floor: GT.f_stone, floors: [{ x0: 0, y0: 0, x1: 4.5, y1: 2, floor: GT.f_tile }, { x0: 4.5, y0: 2.5, x1: 8, y1: 5.5, floor: GT.f_wood }],
  wall: { color: '#dfe8d4', trim: '#4f7a5a', rail: 0 },
  items: [WY('generic.window', 4.6, { w: 2, plant: true, cross: true }), WY('generic.window', 7, { w: 2, cross: true }), WY('generic.window', 9.4, { w: 2, plant: true, cross: true }),
    WX('generic.window', 2.6, { w: 2, cross: true }), WX('generic.window', 5.2, { w: 2, plant: true, cross: true }), WX('pf.bunting', 0, { kind: 'flags', w: 2.4, pal: ['#f1ede4', '#9fd0a8', '#f4b8c8'] }),
    V('pf.jars', .5, 0, { pal: 'tea', c: '#f1ede4' }), V('pf.jars', 2.5, 0, { pal: 'jam', c: '#f1ede4', seed: 4 }, U),
    V('pf.counter', .5, 1.5, { w: 3, text: 'TEA GARDEN', c: '#4f7a5a', top: 'tea', ic: ['#f4b8c8', '#9fd0a8'] }, ST),
    // the indoor garden bed in the middle
    plant('fiddle', 5.5, 3.5, 1.6, '#c0704a'), plant('monstera', 6.2, 3.6, 1.4, '#c0704a'), V('grocery.flowers', 5.5, 4.3, { seed: 3 }), plant('snake', 6.8, 4.2, 1.2, '#c0704a'), plant('g', 5, 4, 1.3, '#c0704a'),
    V('cafe.tableset', 1, 4, { c: '#f1ede4', cc: '#5f8a7a' }, SE), V('cafe.tableset', 1, 6, { c: '#f1ede4', cc: '#b0486a' }, se(1)),
    V('cafe.tableset', 9, 2.5, { c: '#f1ede4', cc: '#5f8a7a' }, SE), V('cafe.tableset', 9, 4.5, { c: '#f1ede4', cc: '#d8a03a' }, se(1)), V('cafe.tableset', 9, 6.5, { c: '#f1ede4', cc: '#b0486a' }, SE),
    V('generic.bench', 4.2, 6.3, { c: '#f1ede4' }, se(1)),
    plant('fiddle', 11.5, 0, 1.6), plant('monstera', 11.5, 7.5, 1.4), plant('monstera', 0, 7.5, 1.3), plant('g', 0, 3, 1.4), plant('snake', 4.5, 0, 1.3), plant('cactus', 7.5, 0, 1.2),
    lamp(1.75, 4.25, '#f1ede4'), lamp(9.75, 2.75, '#f1ede4'), lamp(9.75, 6.75, '#f1ede4')],
  npc: [S(7.6, 5, 2)], exits: [{ x: 6.5, y: 7.5 }] }),
{ blurb: 'A little glasshouse on the edge of the park where the teapots arrive under knitted cosies and the ferns outnumber the customers.', signature: 'The indoor garden bed in the middle of the room, ringed by white cafe tables.',
  tryThis: ['Order a pot at the TEA GARDEN counter and drink it by the windows', 'Browse the wall of jam jars and tea tins', 'Sit on the white bench beside the fig tree'], activities: ['seat', 'till', 'shelf'] });

// ---------------------------------------------------------------- Jade Rabbit Tea House (old town) 9 x 9: traditional floor seating at low tables on tatami
P(24, 'Jade Rabbit Tea House', () => R('Jade Rabbit Tea House', 9, 9, { music: 'quiet', floor: GT.f_darkwood, floors: [{ x0: .5, y0: 3.5, x1: 3, y1: 8.5, floor: GT.f_mat }, { x0: 5.75, y0: 2.75, x1: 8.75, y1: 8.5, floor: GT.f_mat }],
  wall: { color: '#e6dcc0', trim: '#5a3a28', rail: 1, pattern: 'planks' },
  items: [WY('pf.banner', 5.2, { text: 'TEA', c: '#2f6a55' }), WY('generic.window', 6.6, { w: 2, cross: true }), WX('pf.bunting', 2.6, { kind: 'lanterns', w: 3, pal: ['#d63a3a', '#d8a848'] }), WX('generic.picture', 6.4, { kind: 2, c: '#2a2733', w: 1.5 }),
    V('pf.jars', .5, 0, { pal: 'tea', c: '#5a3a28', seed: 2 }), V('pf.jars', 2.5, 0, { pal: 'tea', c: '#5a3a28', seed: 7 }),
    V('pf.counter', .5, 1.5, { w: 3.5, text: 'JADE RABBIT', c: '#2f6a55', stripes: false, top: 'tea', ic: ['#9fd0a8', '#d8a848'], slab: '#5a3a28' }, ST),
    V('pf.lowtable', .75, 3.75, { c: '#5a3a28', cc: '#8a2a2a' }, se(2)), V('pf.lowtable', .75, 6.25, { c: '#5a3a28', cc: '#2f6a55', cc2: '#d8a848' }, se(2)),
    V('pf.lowtable', 6.25, 3, { c: '#2a2733', cc: '#2f6a55', pot: '#8a2a2a' }, se(3)), V('pf.lowtable', 6.25, 6, { c: '#2a2733', cc: '#8a2a2a', cc2: '#d8a848' }, se(1)),
    lantern(1.5, 4.5, '#e8c060'), lantern(1.5, 7, '#e8c060'), lantern(7, 3.75, '#e8c060'), lantern(7, 6.75, '#e8c060'),
    plant('snake', 8.5, 0, 1.4, '#3a3644'), plant('g', 4.5, 0, 1.2, '#3a3644'), V('generic.coatrack', 3.5, 8.5)],
  exits: [{ x: 4.5, y: 8.5 }] }),
{ blurb: 'Shoes off, voices down. Jade Rabbit pours gongfu tea at knee-high tables under paper lanterns, the way it has for three generations.', signature: 'Low lacquer tables on tatami mats with floor cushions instead of chairs.',
  tryThis: ['Kneel at a low table and share a pot', 'Pick a tin from the wall of teas behind the counter'], activities: ['seat', 'till'] });

// ---------------------------------------------------------------- Harbor Tea & Spice (harbor) 7 x 10: a narrow merchant's shop with a tasting bar
P(56, 'Harbor Tea & Spice', () => R('Harbor Tea & Spice', 7, 10, { music: 'quiet', floor: GT.f_wood, floors: [{ x0: 0, y0: 0, x1: 7, y1: 2, floor: GT.f_stone }],
  wall: { color: '#b8805a', trim: '#3a2a20', pattern: 'brick', h: 3 },
  items: [WY('generic.window', 1, { w: 2, cross: true }), WY('generic.clock', 3.6, null, .4), WX('pf.banner', .4, { text: 'SPICE', c: '#8a2a2a' }),
    V('bakery.sacks', .5, 0, { n: 4 }), V('bakery.sacks', 1.5, 0, { lc: '#c0392b' }), V('grocery.crates', 3, 0, { items: ['lemon', 'orange', 'pepper'], tall: true }), V('pf.jars', 4.5, 0, { pal: 'spice', seed: 3 }),
    V('pf.counter', 3, 2, { w: 3.5, text: 'TEA & SPICE', c: '#8a2a2a', c2: '#e8dcc4', top: 'jars', ic: ['#e8843a', '#f2c230', '#c0392b', '#8a5a2a'] }, ST), V('grocery.scale', 2.25, 2),
    V('pf.jars', 0, 3, { pal: 'spice', seed: 5 }, { flip: true, n: 'use' }), V('pf.jars', 0, 5.2, { pal: 'tea', seed: 9 }, { flip: true }),
    V('cafe.tableset', 4.5, 4.5, { sq: true, c: '#8a5a3a', cc: '#8a2a2a' }, SE), V('cafe.tableset', 4.5, 6.5, { sq: true, c: '#8a5a3a', cc: '#d8a03a' }, se(1)),
    V('cafe.windowbar', .5, 8.5, { n: 3, sc: '#8a2a2a' }, se(2)), V('bakery.sacks', 6, 9.4, { lc: '#d8a03a' }),
    lamp(5.25, 4.75, '#d8a848'), lamp(5.25, 6.75, '#d8a848'), lantern(1.5, 3.5, '#e8843a'), lantern(1.5, 6, '#e8843a')],
  npc: [S(1.5, 6.2, 2), S(2.6, 7.6, 3)], exits: [{ x: 5, y: 9.5 }] }),
{ blurb: 'Part tea room, part ship\'s chandler for the kitchen: sacks of cardamom by the door and a wall of jars that smells like the far side of the ocean.', signature: 'Floor-to-ceiling spice and tea jars down the whole left wall.',
  tryThis: ['Sniff your way along the spice wall', 'Take a stool at the tasting bar by the door', 'Buy a tin of harbor blend at the counter'], activities: ['seat', 'till', 'shelf'] });

// ================================================================= CAFES
// ---------------------------------------------------------------- Night Owl Coffee (downtown) 8 x 8: dark late-night espresso bar with an open-mic corner
P(8, 'Night Owl Coffee', () => R('Night Owl Coffee', 8, 8, { music: 'cafe', floor: GT.f_darkwood, floors: [{ x0: 4.5, y0: 2.5, x1: 8, y1: 7, floor: GT.f_carpet }],
  wall: { color: '#2f3a4a', trim: '#d8a848', h: 3 },
  items: [WY('cafe.menu', .5, { kind: 'lit' }, 1.2), WY('bar.neon', 5.2, { kind: 'text', text: 'NIGHT OWL', c: '#f6e04a', c2: '#b07af8' }, 1.15), WX('generic.window', 3.6, { w: 1.6, z1: 2.3 }), WX('generic.window', 5.6, { w: 1.6, z1: 2.3 }), WX('home.wall.fairylights', .3),
    V('kitchen.shelf', .5, 0, { seed: 3 }), V('cafe.till', .5, 1.5, { c: '#2a2733', top: '#d8a848' }, ST), V('cafe.bar', 2, 1.5, { c: '#2a2733', mc: '#d8a848', top: '#3a3f4c' }, ST),
    V('bar.stage', 5, 0, { w: 3, kit: false }), V('bar.speaker', 4.5, .2),
    V('cafe.windowbar', 0, 3.5, { n: 4, c: '#5a3a28', sc: '#f6e04a' }, { flip: true, n: 'seats', ns: 3 }),
    V('generic.sofa', 5.5, 3, { c: '#7a55b0' }, SE), V('cafe.lowtable', 6, 4.3, { c: '#3a3f4c' }), V('cafe.armchair', 6.9, 5.6, { c: '#d8a03a' }, SE),
    V('cafe.tableset', 2.4, 4, { sq: true, c: '#3a3f4c', cc: '#f6e04a' }, se(1)), V('cafe.tableset', 2.4, 6, { sq: true, c: '#3a3f4c', cc: '#b07af8' }, se(1)),
    V('generic.floorlamp', 7.5, 2.5, { c: '#f6e04a' }), lamp(3.15, 4.25, '#f6e04a'), lamp(3.15, 6.25, '#b07af8'), plant('monstera', 7.5, 7.5, 1.2, '#3a3644')],
  exits: [{ x: 5, y: 7.5 }] }),
{ blurb: 'Open until the last bus and then a bit longer. Night Owl keeps its lights low, its espresso short and a tiny stage free for anyone brave enough.', signature: 'A corner open-mic stage under a yellow neon owl sign.',
  tryThis: ['Nurse a late coffee at the window bar', 'Sink into the purple sofa', 'Step up on the little stage'], activities: ['seat', 'till', 'stage'] });

// ---------------------------------------------------------------- Kettle & Crumb (old town) 10 x 7: grandmother's-parlour cake shop with armchairs
P(29, 'Kettle & Crumb', () => R('Kettle & Crumb', 10, 7, { music: 'cafe', floor: GT.f_wood, floors: [{ x0: 5.5, y0: 2.5, x1: 10, y1: 7, floor: GT.f_carpet }],
  wall: { color: '#f0d8d4', color2: '#e6c2c2', pattern: 'stripes', trim: '#8a5a3a', rail: 1 },
  items: [WY('generic.window', 6.5, { w: 1.6, curtain: '#b0486a' }), WY('generic.window', 8.3, { w: 1.6, curtain: '#b0486a' }), WX('home.wall.photos', 3), WX('generic.picture', 5.2, { kind: 1, c: '#d8a848' }), WX('generic.clock', 4.5, null, .4),
    V('bakery.shelves', .5, 0, { seed: 3 }), V('pf.rack', 3, 0, { kind: 'pie', seed: 2 }),
    V('cafe.pastrycase', .5, 1.5, { c: '#b0486a' }, U), V('pf.counter', 2, 1.5, { w: 4, text: 'KETTLE & CRUMB', c: '#b0486a', c2: '#f6e8e0', top: 'tea', ic: ['#f4b8c8', '#f6e08a'] }, ST),
    V('generic.rug', 6.2, 3.1, { c: '#b0486a', w: 3.2, d: 1.6 }), V('cafe.armchair', 6, 3, { c: '#b0486a' }, SE), V('cafe.lowtable', 7.25, 3.1, { c: '#8a5a3a' }), V('cafe.armchair', 8.5, 3, { c: '#5f8a7a' }, SE),
    V('cafe.tableset', 6.5, 5.3, { c: '#f1ede4', cc: '#b0486a' }, SE), V('cafe.tableset', .5, 3.5, { c: '#f1ede4', cc: '#5f8a7a' }, se(1)), V('cafe.tableset', .5, 5.5, { c: '#f1ede4', cc: '#d8a03a' }, SE),
    V('generic.floorlamp', 9.5, 2.5, { c: '#f4b8c8' }), V('generic.coatrack', 9.5, 6.5), plant('fiddle', 9.4, 0, 1.3, '#c0704a'), lamp(1.25, 3.75, '#f4b8c8'), lamp(1.25, 5.75, '#f4b8c8')],
  npc: [S(3.2, 3.6, 0)], exits: [{ x: 4.5, y: 6.5 }] }),
{ blurb: 'Striped wallpaper, mismatched armchairs and a Victoria sponge the size of a hatbox. Kettle & Crumb is where Old Town comes to gossip.', signature: 'Two velvet armchairs on a rose rug by the curtained windows.',
  tryThis: ['Claim an armchair with a slice of pie', 'Look over the cake case before you order'], activities: ['seat', 'till'] });

// ---------------------------------------------------------------- Sunnyside Cafe (arts) 12 x 7: bright brunch cafe around one big shared table
P(45, 'Sunnyside Cafe', () => R('Sunnyside Cafe', 12, 7, { music: 'cafe', floor: GT.f_wood, floors: [{ x0: 0, y0: 0, x1: 5, y1: 1.5, floor: GT.f_check }],
  wall: { color: '#f6e08a', trim: '#e8843a', rail: 0 },
  items: [WY('pf.banner', .5, { text: 'SUNNYSIDE', c: '#e8843a' }), WY('cafe.menu', 3.4, { kind: 'lit' }, 1.2), WY('home.wall.art', 6.2), WY('generic.picture', 7.6, { kind: 3, w: 1.5, c: '#e8843a' }), WY('home.wall.art', 9.6),
    WX('generic.window', 2.4, { w: 2 }), WX('generic.window', 4.8, { w: 2, plant: true }),
    V('cafe.till', .5, 1.5, { c: '#f1ede4', top: '#e8843a' }, ST), V('cafe.bar', 2, 1.5, { c: '#f2c230', mc: '#f1ede4', top: '#f1ede4' }, ST), V('cafe.condiments', 5.5, 0),
    V('pf.communal', 5.5, 2.75, { w: 5, c: '#d2a26a', items: ['#f6e04a', '#f1ede4', '#e8843a', '#f1ede4'], mid: '#3f8a55' }, se(3)),
    V('cafe.tableset', .5, 3.5, { c: '#f1ede4', cc: '#f2c230' }, SE), V('cafe.tableset', .5, 5.5, { c: '#f1ede4', cc: '#e8843a' }, se(1)),
    V('cafe.windowbar', 7, 5.5, { n: 4, sc: '#f2c230' }, se(2)),
    plant('fiddle', 11.5, 0, 1.5, '#e8843a'), plant('monstera', 11.5, 6.5, 1.3, '#e8843a'), plant('g', 6.7, 0, 1.2, '#f1ede4'),
    lamp(6.5, 3.5, '#f2c230'), lamp(8, 3.5, '#e8843a'), lamp(9.5, 3.5, '#f2c230'), lamp(1.25, 3.75, '#f2c230')],
  exits: [{ x: 4.5, y: 6.5 }] }),
{ blurb: 'All-day brunch in a room painted the colour of egg yolk. Local painters hang their work on the walls and argue about it over the big table.', signature: 'One long communal brunch table under a row of yellow lamps.',
  tryThis: ['Squeeze onto the shared table', 'Check out this month\'s paintings on the back wall'], activities: ['seat', 'till'] });

// ---------------------------------------------------------------- Cannery Coffee Roasters (harbor) 13 x 8: industrial roastery with a cupping bar
P(53, 'Cannery Coffee Roasters', () => R('Cannery Coffee Roasters', 13, 8, { music: 'cafe', floor: GT.f_concrete, floors: [{ x0: 4.5, y0: 4.5, x1: 12, y1: 7, floor: GT.f_wood }],
  wall: { color: '#8a5a4a', trim: '#3a3f4c', pattern: 'brick', h: 3.2 },
  items: [WY('cafe.menu', 5.6, { name: 'ROAST', b: '#3a3f4c' }, 1.2), WY('generic.window', 8.2, { w: 2, z1: 2.6 }), WY('generic.window', 10.6, { w: 2, z1: 2.6 }), WX('bar.neon', 3.4, { kind: 'text', text: 'CANNERY', c: '#ff8a3a', c2: '#f6e04a' }), WX('generic.window', 5.8, { w: 2, z1: 2.6 }),
    V('pf.roaster', .5, .3), V('bakery.sacks', 2.5, 0, { n: 4, lc: '#3f6a4a' }), V('bakery.sacks', 3.5, 0, { lc: '#8a2a2a' }), V('bakery.sacks', 2.6, .9, { n: 4 }), V('grocery.crates', .5, 2.6, { items: ['potato', 'potato', 'onion'], tall: true }),
    V('kitchen.shelf', 6.5, 0, { seed: 6 }), V('cafe.condiments', 12, 0),
    V('diner.counter', 5.5, 2, { w: 5, c: '#3a3f4c' }, { n: 'seats staff use', ns: 3 }),
    V('bar.hightable', 1, 4.8, { c: '#3a3f4c' }, se(1)), V('bar.hightable', 1, 6.6, { c: '#3a3f4c' }, SE),
    V('cafe.tableset', 5, 5.2, { c: '#8a5a3a', cc: '#3a3f4c' }, SE), V('cafe.tableset', 9.5, 5.2, { c: '#8a5a3a', cc: '#c8683f' }, se(1)),
    V('grocery.crates', 12, 2.5), V('grocery.crates', 12, 7.4, { tall: true, items: ['potato', 'onion', 'potato'] }), plant('snake', 0, 7.5, 1.3, '#3a3644'),
    lamp(6.5, 2.4, '#3a3f4c'), lamp(8, 2.4, '#3a3f4c'), lamp(9.5, 2.4, '#3a3f4c'), lamp(5.75, 5.45, '#c8683f'), lamp(10.25, 5.45, '#c8683f')],
  npc: [S(1.3, 2.2, 3, 'work', 'staff'), S(3.6, 2.4, 3)], exits: [{ x: 7.75, y: 7.5 }] }),
{ blurb: 'The old sardine cannery now roasts beans instead. You can smell it from the ferry dock, and the cupping bar pours whatever came out of the drum this morning.', signature: 'A working drum roaster with burlap sacks of green coffee stacked around it.',
  tryThis: ['Watch a batch tumble in the roaster', 'Take a stool at the long cupping bar', 'Lean on a high table with a flat white'], activities: ['seat', 'till'] });

// ================================================================= BAKERIES
// ---------------------------------------------------------------- Flour & Fig Bakery (downtown) 10 x 8: modern open bakery, ovens in full view
P(11, 'Flour & Fig Bakery', () => R('Flour & Fig Bakery', 9, 8, { music: 'cafe', floor: GT.f_tile, floors: [{ x0: 0, y0: 3.5, x1: 9, y1: 8, floor: GT.f_wood }],
  wall: { color: '#f1ead8', trim: '#8a5a3a', pattern: 'tile', rail: 1.1 },
  items: [WX('pf.banner', 3.4, { text: 'FLOUR & FIG', c: '#6a4a8a' }), WX('generic.window', 6, { w: 1.6 }), WY('generic.clock', 8.4, null, .4),
    V('bakery.oven', .5, 0), V('bakery.worktable', 2.5, 0), V('pf.rack', 5, 0, { kind: 'bread' }), V('pf.rack', 6.2, 0, { kind: 'bread', seed: 4 }), V('bakery.traycart', 7.4, 0, { seed: 2 }), V('bakery.sacks', 8, 1.2, { n: 4 }),
    V('bakery.counter', .5, 2.5, { c: '#6a4a8a' }, ST), V('cafe.pastrycase', 3, 2.5, { c: '#6a4a8a', seed: 3 }, U),
    V('bakery.shelves', 0, 4, { seed: 5 }, { flip: true, n: 'use' }),
    V('cafe.windowbar', 1, 6.5, { n: 3, sc: '#6a4a8a' }, se(2)), V('cafe.tableset', 6.5, 4.5, { c: '#f1ede4', cc: '#6a4a8a' }, SE), V('cafe.tableset', 6.5, 6.5, { c: '#f1ede4', cc: '#8a5a3a' }, se(1)),
    plant('fiddle', 8.5, 3, 1.3, '#6a4a8a'), lamp(7.25, 4.75, '#f1ede4'), lamp(7.25, 6.75, '#f1ede4'), lamp(2.5, 6.75, '#f1ede4')],
  npc: [S(1.2, 1.7, 3, 'work', 'staff'), S(3.5, 1.7, 3, 'work', 'staff'), S(5.3, 3.8, 3)], exits: [{ x: 5, y: 7.5 }] }),
{ blurb: 'White tile, plum aprons and nothing hidden: the bakers shape the sourdough right behind the till, and the fig danish sells out by ten.', signature: 'The open bakehouse: deck oven, floured worktable and bread racks in plain view.',
  tryThis: ['Watch the bakers at the worktable', 'Pick a loaf from the wall shelves', 'Eat a danish at the window bar'], activities: ['seat', 'till', 'shelf'] });

// ---------------------------------------------------------------- Elm House Bakery (hillcrest) 7 x 6: tiny front-room patisserie
P(58, 'Elm House Bakery', () => R('Elm House Bakery', 7, 6, { music: 'quiet', floor: GT.f_wood,
  wall: { color: '#e8d0d4', trim: '#b0486a', rail: 1.1 },
  items: [WX('generic.window', 2.4, { w: 1.6, curtain: '#f1ede4' }), WX('generic.picture', 4.5, { kind: 0, c: '#d8a848' }), WY('home.wall.photos', 3.2),
    V('generic.rug', 2.4, 3.2, { c: '#b0486a', c2: '#f1ede4', w: 2.4, d: 1.6 }),
    V('bakery.shelves', .5, 0, { seed: 6 }), V('pf.rack', 2.6, 0, { kind: 'pie' }), V('bakery.oven', 5.2, 0),
    V('pf.counter', .5, 1.5, { w: 3, text: 'ELM HOUSE', c: '#b0486a', top: 'case', ic: ['#f4b8c8', '#f6f0e0', '#e8b860', '#8a3a4a'] }, ST), V('cafe.pastrycase', 3.5, 1.5, { c: '#f1ede4', seed: 5 }, U),
    V('cafe.armchair', .4, 3.3, { c: '#5f8a7a' }, SE), V('cafe.armchair', .4, 4.8, { c: '#d8a03a' }, SE), V('cafe.tableset', 4.7, 3.6, { sq: true, c: '#f1ede4', cc: '#b0486a' }, SE),
    V('generic.floorlamp', 0, 4.35, { c: '#f4b8c8' }), plant('g', 6.5, 5.5, 1.2, '#b0486a'), V('grocery.flowers', 5.6, 5.4, { seed: 2 }), lamp(5.4, 3.85, '#f4b8c8')],
  npc: [S(5.6, 1.4, 3, 'work', 'staff')], exits: [{ x: 3.5, y: 5.5 }] }),
{ blurb: 'Somebody\'s front parlour, more or less, with a cake counter where the piano used to be. Hillcrest queues out the door for the lemon tart.', signature: 'A pink patisserie counter squeezed into a house-sized front room.',
  tryThis: ['Choose a tart from the glass case', 'Take the armchair by the window'], activities: ['seat', 'till'] });
