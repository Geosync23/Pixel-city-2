// Unique food & drink interiors, part 2: diner, restaurant, bars and the counter-service eateries. Helpers + contract: see places_food.js.
import { P, R, V, WY, WX, S, GT, ST, SE, U, se, lamp, lantern, plant } from './places_food.js';

const CS = (x, y, kind) => S(x, y, 3, 'work', 'staff'); // a cook facing the back line

// ================================================================= DINER / RESTAURANT
// ---------------------------------------------------------------- Silver Spoon Diner (downtown) 15 x 7: chrome railcar diner, one long counter
P(14, 'Silver Spoon Diner', () => R('Silver Spoon Diner', 15, 7, { music: 'cafe', floor: GT.f_check, floors: [{ x0: 0, y0: 0, x1: 15, y1: 2.5, floor: GT.f_tile }],
  wall: { color: '#c8d8f0', trim: '#d5dbe0', pattern: 'tile', rail: 1.1 },
  items: [WX('bar.neon', 2.7, { kind: 'text', text: 'DINER', c: '#ff4a8a', c2: '#4ad8f0' }, 1), WX('generic.window', 4.8, { w: 1.8 }), WY('kitchen.walkin', 11.4), WY('generic.exit', 13.6, null, .7), WY('generic.clock', 13, null, .4),
    V('kitchen.range', .5, 0), V('kitchen.grill', 2, 0, { kind: 'pancake' }), V('kitchen.fryer', 3.5, 0), V('kitchen.prep', 4.5, 0), V('kitchen.dishpit', 7, 0), V('kitchen.shelf', 9.5, 0, { seed: 2 }),
    V('diner.counter', 1, 2.5, { w: 8, c: '#c0392b' }, { n: 'seats staff use', ns: 3 }), V('kitchen.pass', 9.5, 2.5, null, { n: 'staff' }), V('diner.jukebox', 13.5, 2.3, { c: '#c0392b' }, U), V('cornerstore.gumball', 12.5, 2.3, { c: '#c0392b' }),
    V('diner.booth', .5, 5.5, { c: '#c0392b' }, se(2)), V('diner.booth', 3, 5.5, { c: '#2f8f8a' }, se(1)), V('diner.booth', 5.5, 5.5, { c: '#c0392b' }, se(1)),
    V('diner.booth', 10, 5.5, { c: '#2f8f8a' }), V('diner.booth', 12.5, 5.5, { c: '#c0392b' }, se(1)), V('generic.coatrack', 14.5, 4.5),
    lamp(2.5, 2.9, '#c0392b'), lamp(5, 2.9, '#c0392b'), lamp(7.5, 2.9, '#c0392b')],
  npc: [CS(2.75, 1.5), CS(5.5, 1.5)], exits: [{ x: 8.5, y: 6.5 }] }),
{ blurb: 'A stainless railcar diner that never updated the menu and never needed to. Pancakes all day, bottomless coffee and a jukebox stuck in 1962.', signature: 'An eight-stool chrome counter running nearly the full length of the room.',
  tryThis: ['Grab a stool at the long counter', 'Slide into a red booth', 'Put a song on the jukebox'], activities: ['seat', 'till', 'jukebox'] });

// ---------------------------------------------------------------- The Heron's Table (old town) 13 x 10: white-tablecloth dining room around a fish tank
P(2, "The Heron's Table", () => R("The Heron's Table", 13, 10, { music: 'quiet', floor: GT.f_darkwood, floors: [{ x0: 8, y0: 1, x1: 13, y1: 7, floor: GT.f_carpet }],
  wall: { color: '#3a4a5a', trim: '#d8a848', rail: 1.2, h: 3.2 },
  items: [WY('generic.door', 6.2, { kind: 'staff' }), WY('generic.picture', 8, { kind: 3, w: 1.5, c: '#d8a848' }), WY('generic.picture', 10.4, { kind: 1, w: 1.5, c: '#d8a848' }), WX('generic.window', 2, { w: 2, curtain: '#8a2a2a' }), WX('generic.window', 5, { w: 2, curtain: '#8a2a2a' }),
    WX('bar.neon', 8, { kind: 'text', text: 'HERON', c: '#f6e8c8', c2: '#d8a848' }, 1),
    V('restaurant.winerack', .5, 0), V('restaurant.winerack', 2, 0, { seed: 4 }), V('restaurant.winerack', 3.5, 0, { seed: 7 }),
    V('restaurant.table', 1, 1.6, { n: 4, flower: true }, se(2)), V('restaurant.table', 1, 4.6, { n: 4 }, se(1)),
    V('restaurant.table', 9.5, 1.6, { n: 4 }, se(2)), V('restaurant.table', 9.5, 4.6, { n: 4, flower: true }, se(1)),
    V('restaurant.table', 5.5, 2, { flower: true }, SE), V('pf.tank', 5.5, 4.6, { w: 2, c: '#2a2733' }),
    V('restaurant.table', 1, 7.7, null, se(1)), V('restaurant.table', 10, 7.7, { flower: true }, se(1)), V('restaurant.host', 5, 8, null, ST),
    plant('g', 12.5, 0, 1.5, '#3a3644'), plant('fiddle', 0, 9.5, 1.4, '#3a3644'), plant('g', 12.5, 9.5, 1.4, '#3a3644'), plant('snake', 5, 0, 1.2, '#3a3644'),
    lamp(1.75, 2.35), lamp(1.75, 5.35), lamp(10.25, 2.35), lamp(10.25, 5.35), lamp(6.25, 2.25)],
  exits: [{ x: 7, y: 9.5 }] }),
{ blurb: 'Old Town\'s special-occasion room: midnight-blue walls, candlelight, a wine list longer than the ferry timetable and tonight\'s catch swimming past your elbow.', signature: 'The glowing fish tank that divides the dining room.',
  tryThis: ['Ask the host for a table for four', 'Watch the fish tank between courses'], activities: ['seat', 'host'] });

// ================================================================= BARS
// ---------------------------------------------------------------- Maple Brewing Co. Taproom (harbor) 14 x 9: brewery tanks, beer-hall table, pool and darts
P(7, 'Maple Brewing Co. Taproom', () => R('Maple Brewing Co. Taproom', 14, 9, { music: 'bar', floor: GT.f_concrete, floors: [{ x0: .5, y0: 4, x1: 8, y1: 9, floor: GT.f_wood }],
  wall: { color: '#7a4a3a', trim: '#d8a848', pattern: 'brick', h: 3.2 },
  items: [WX('bar.neon', 2.8, { kind: 'text', text: 'MAPLE BREW', c: '#ff8a3a', c2: '#f6e04a' }, 1.1), WX('bar.dartboard', 6.6), WY('pf.tv', 11.7, { kind: 'sport' }),
    V('pf.brewtank', .4, 0), V('pf.brewtank', 1.6, 0, { c: '#c8743a' }), V('pf.brewtank', 2.8, 0), V('generic.queuepost', .5, 1.5, { n: 3, kind: 'belt', c: '#d8a848' }), V('pf.keg', 4.4, .2, { n: 3 }),
    V('bar.backbar', 6, 0, { w: 5, name: 'ON TAP', seed: 3 }), V('bar.counter', 6, 1.5, { w: 5 }, ST),
    V('bar.stool', 8.5, 2.5, null, SE), V('bar.stool', 9.5, 2.5, null, SE), V('bar.stool', 10.5, 2.5),
    V('pf.communal', 1, 4.75, { w: 4, c: '#8a5a3a', items: ['#e8a040', '#f1ede4', '#e8a040', '#c8842a'], mid: false }, se(3)),
    V('bar.hightable', 5.8, 5.4, null, SE), V('bar.hightable', 1.5, 7.8, null, se(1)),
    V('bar.pool', 9.8, 5, { felt: '#2f6a55' }, U), V('pf.keg', 13, 3.2, { n: 2 }), V('pf.keg', 13, 8.4, { n: 2 }), V('bar.speaker', 13.4, 0),
    lamp(11, 5.6, '#3f8a55'), lamp(2.5, 5.6, '#d8a848'), lamp(4, 5.6, '#d8a848')],
  npc: [S(11.2, 4.4, 1), S(2.4, 2.6, 3)], exits: [{ x: 7.5, y: 8.5 }] }),
{ blurb: 'Brewed twelve feet from where you drink it. The Taproom is all brick, steel tanks and one long table where dock workers and tourists end up sharing a pitcher.', signature: 'Three working fermenter tanks behind a brass rope at the back.',
  tryThis: ['Order a flight at the long bar', 'Shoot a frame of pool', 'Throw darts by the neon sign', 'Catch the match on the big screen'], activities: ['bar_stool', 'seat', 'till', 'pool', 'darts', 'screen'] });

// ---------------------------------------------------------------- Paper Crane Izakaya (old town) 7 x 8: tiny lantern-lit counter bar with a tatami corner
P(38, 'Paper Crane Izakaya', () => R('Paper Crane Izakaya', 7, 8, { music: 'bar', floor: GT.f_darkwood, floors: [{ x0: 4.25, y0: 3.25, x1: 7, y1: 5.75, floor: GT.f_mat }, { x0: 0, y0: 0, x1: 7, y1: .5, floor: GT.f_stone }],
  wall: { color: '#3a3430', trim: '#a8553f', pattern: 'planks', h: 3 },
  items: [WY('pf.banner', 5, { text: 'SAKE', c: '#8a2a2a' }), WX('pf.bunting', 2.6, { kind: 'lanterns', w: 4.4, pal: ['#d63a3a', '#f1ede4'] }), WX('generic.picture', 7, { kind: 2, c: '#2a2733' }),
    V('ramen.bar', .5, .5, { w: 4, name: 'PAPER CRANE', nc: '#8a2a2a' }, { n: 'seats staff use', ns: 3 }),
    V('pf.keg', 5.5, .1, { n: 3, c: '#e8dcc4', band: '#c8a868', mark: '#8a2a2a' }),
    V('bar.hightable', .5, 3.6, { c: '#5a3a28' }, se(1)), V('bar.hightable', .5, 5.6, { c: '#5a3a28' }, SE),
    V('pf.lowtable', 4.6, 3.5, { c: '#2a2733', cc: '#2f3f6a', cc2: '#8a2a2a', pot: '#f1ede4' }, se(3)), V('generic.bench', 5, 6.9, { c: '#5a3a28' }, se(1)),
    lantern(1.5, 2.6), lantern(3.5, 2.6, '#f1ede4'), lantern(5.4, 4.3), plant('snake', 0, 7.5, 1.2, '#3a3644')],
  exits: [{ x: 3.25, y: 7.5 }] }),
{ blurb: 'Nine seats, one cook and a curtain of red lanterns. Paper Crane grills skewers until the sake barrels run dry or the last train goes, whichever is first.', signature: 'A four-stool counter where the cook works right in front of you.',
  tryThis: ['Take a stool at the counter and watch the grill', 'Kick off your shoes at the low table', 'Stand at a high table with a cold beer'], activities: ['seat', 'bar_stool', 'till'] });

// ================================================================= COUNTER-SERVICE EATERIES
// ---------------------------------------------------------------- Taqueria El Farolito (downtown) 10 x 8: al pastor spit, papel picado, bright tiles
P(9, 'Taqueria El Farolito', () => R('Taqueria El Farolito', 10, 8, { music: 'cafe', floor: GT.f_check, floors: [{ x0: 0, y0: 0, x1: 10, y1: 2.5, floor: GT.f_tile }],
  wall: { color: '#f0a850', trim: '#2f8f8a', rail: 1 },
  items: [WY('pf.bunting', .6, { kind: 'picado', w: 6 }), WY('cafe.menu', 7.4, { name: 'TACOS', b: '#8a2a2a' }, 1.2), WX('bar.neon', 2.7, { kind: 'text', text: 'TACOS', c: '#5af07a', c2: '#ff4a8a' }, 1), WX('generic.window', 4.8, { w: 1.8 }), WX('pf.bunting', 4.4, { kind: 'picado', w: 3.4 }),
    V('pf.trompo', .5, 0), V('kitchen.grill', 2, 0), V('kitchen.prep', 3.7, 0), V('cornerstore.fridge', 6.2, 0, { kind: 'drinks' }), V('bakery.sacks', 8.8, 0, { lc: '#3f8a55' }),
    V('pf.counter', .5, 2.5, { w: 3.5, text: 'EL FAROLITO', c: '#c0392b', c2: '#f6e08a', top: 'jars', ic: ['#c0392b', '#6fb858', '#e8843a', '#f1ede4'] }, ST), V('kitchen.pass', 4.5, 2.5, null, { n: 'staff' }), V('cafe.condiments', 8.5, 2.5, null, U),
    V('diner.table', .5, 4.5, { check: true, c: '#2f8f8a' }, SE), V('diner.table', 3.5, 4.5, { check: true, c: '#c0392b' }, se(1)), V('diner.table', 7.5, 4.5, { check: true, c: '#2f8f8a' }, SE),
    V('diner.table', .5, 6.5, { check: true, c: '#c0392b' }, se(1)), V('diner.table', 7.5, 6.5, { check: true, c: '#c0392b' }, se(1)),
    plant('cactus', 9.5, 7.5, 1.5, '#c0704a'), plant('cactus', 0, 3.4, 1.3, '#c0704a'), lantern(1.5, 4.75, '#f2c230'), lantern(4.5, 4.75, '#e87aa0'), lantern(8.5, 4.75, '#5af07a')],
  npc: [CS(1, 1.6), S(4.2, 3.7, 3)], exits: [{ x: 5.5, y: 7.5 }] }),
{ blurb: 'The little lighthouse of Fifth Street: pork turning on the spit, paper flags overhead and a salsa bar that will absolutely test you.', signature: 'The al pastor trompo, crowned with a pineapple, spinning behind the counter.',
  tryThis: ['Order tacos al pastor at the counter', 'Load up at the salsa bar', 'Grab a checkered table under the papel picado'], activities: ['seat', 'till'] });

// ---------------------------------------------------------------- Little Hanoi Pho (downtown) 8 x 9: steaming stock pots and two long shared tables
P(10, 'Little Hanoi Pho', () => R('Little Hanoi Pho', 8, 9, { music: 'quiet', floor: GT.f_lino, floors: [{ x0: 0, y0: 0, x1: 8, y1: 2.5, floor: GT.f_tile }],
  wall: { color: '#cfe0d8', trim: '#c0392b', pattern: 'tile', rail: 1.1 },
  items: [WY('cafe.menu', 5.2, { name: 'PHO', b: '#8a2a2a' }, 1.2), WY('generic.clock', 7.4, null, .4), WX('pf.banner', 3.4, { text: 'HANOI', c: '#c0392b', fg: '#f6e04a', a: '#f6e04a' }), WX('generic.window', 5.6, { w: 1.8 }), WX('pf.bunting', 5.4, { kind: 'lanterns', w: 3 }),
    V('pf.pots', .5, 0, { n: 3, soup: '#e8d8a0' }), V('kitchen.prep', 3, 0), V('kitchen.shelf', 5.5, 0, { seed: 5 }),
    V('pf.counter', .5, 2.5, { w: 3, text: 'PHO', c: '#c0392b', top: 'jars', ic: ['#6fb858', '#c0392b', '#3f8a55', '#f2c230'] }, ST), V('kitchen.pass', 4, 2.5, null, { n: 'staff' }),
    V('pf.communal', .5, 4.25, { w: 4, c: '#c8ccd0', bc: '#c0392b', items: ['#f1ede4', '#f1ede4', '#f1ede4', '#f1ede4'], mid: '#c0392b' }, { flip: true, n: 'seats', ns: 3 }),
    V('pf.communal', 5.5, 4.25, { w: 4, c: '#c8ccd0', bc: '#c0392b', items: ['#f1ede4', '#f1ede4', '#f1ede4', '#f1ede4'], mid: '#3f8a55' }, { flip: true, n: 'seats', ns: 3 }),
    plant('g', 7.5, 2.6, 1.2, '#c0392b'), lamp(1.5, 5.25, '#f1ede4'), lamp(1.5, 7.25, '#f1ede4'), lamp(6.5, 5.25, '#f1ede4'), lamp(6.5, 7.25, '#f1ede4')],
  npc: [CS(1.5, 1.6), S(3.4, 4, 3)], exits: [{ x: 4, y: 8.5 }] }),
{ blurb: 'Three stock pots have been simmering since before you woke up. Sit elbow-to-elbow on the red benches, tear in the herbs and say nothing until the bowl is empty.', signature: 'Three huge steaming broth pots on the line, in full view of the room.',
  tryThis: ['Order a bowl under the steaming pots', 'Squeeze onto a red bench at the long steel tables'], activities: ['seat', 'till'] });

// ---------------------------------------------------------------- Cedar & Olive Falafel (downtown) 11 x 7: blue-and-white Levantine counter with a shawarma spit
P(13, 'Cedar & Olive Falafel', () => R('Cedar & Olive Falafel', 11, 7, { music: 'cafe', floor: GT.f_stone, floors: [{ x0: 0, y0: 0, x1: 7, y1: 2.5, floor: GT.f_tile }],
  wall: { color: '#f1ede4', trim: '#3c64ad', rail: 1.2, pattern: 'plain' },
  items: [WY('generic.window', 6.4, { w: 1.4, cross: true, c: '#3c64ad' }), WY('cafe.menu', 8.2, { name: 'FALAFEL', b: '#2f3a5a' }, 1.2), WX('generic.picture', 3.2, { kind: 1, c: '#3c64ad' }), WX('generic.window', 4.6, { w: 1.6, cross: true, c: '#3c64ad' }),
    V('pf.trompo', .5, 0, { kind: 'shawarma' }), V('kitchen.fryer', 2, 0), V('kitchen.prep', 3.5, 0), V('grocery.crates', 6, 0, { items: ['tomato', 'lemon', 'lettuce'] }), plant('fiddle', 10.5, 0, 1.6, '#3c64ad'),
    V('pf.counter', .5, 2.5, { w: 3, text: 'FALAFEL', c: '#3c64ad', top: 'case', ic: ['#8a6a3a', '#6fb858', '#e8d8b0', '#c0392b'] }, ST), V('kitchen.pass', 3.75, 2.5, null, { n: 'staff' }),
    V('cafe.tableset', 7.5, 2.5, { c: '#f1ede4', cc: '#3c64ad' }, SE), V('cafe.tableset', 7.5, 4.6, { c: '#f1ede4', cc: '#3c64ad' }, se(1)),
    V('cafe.windowbar', .5, 5.5, { n: 4, sc: '#3c64ad', c: '#f1ede4' }, se(3)), plant('fiddle', 10.5, 6.5, 1.4, '#3c64ad'), plant('g', 6.3, 6.5, 1.1, '#3c64ad'),
    lamp(8.25, 2.75, '#3c64ad'), lamp(8.25, 4.85, '#3c64ad')],
  npc: [CS(1, 1.6), S(4.6, 3.8, 3)], exits: [{ x: 5.25, y: 6.5 }] }),
{ blurb: 'Whitewash and cobalt blue, like a postcard from the coast. The falafel is fried to order and the pickles are the owner\'s mother\'s recipe, which you will be told.', signature: 'A shawarma spit and a bubbling falafel fryer behind a blue-striped counter.',
  tryThis: ['Order a falafel wrap at the counter', 'Eat at the long window bar', 'Take a table under the olive trees'], activities: ['seat', 'till'] });

// ---------------------------------------------------------------- Addis Table (downtown) 9 x 10: shared platters at woven mesob basket tables
P(15, 'Addis Table', () => R('Addis Table', 9, 10, { music: 'quiet', floor: GT.f_wood, floors: [{ x0: 0, y0: 0, x1: 9, y1: 2.5, floor: GT.f_stone }],
  wall: { color: '#e0b060', trim: '#3f8a55', rail: 1 },
  items: [WY('pf.bunting', 2.6, { kind: 'flags', pal: 'eth', w: 3.6 }), WX('generic.picture', 3.2, { kind: 2, c: '#3f8a55' }), WX('generic.window', 5, { w: 1.8 }), WX('generic.picture', 7.6, { kind: 0, c: '#c0392b' }),
    V('kitchen.range', .5, 0, { soup: '#c8562a' }), V('kitchen.prep', 2.2, 0), V('bakery.sacks', 4.6, 0, { n: 4, lc: '#3f8a55' }), V('pf.jars', 6, 0, { pal: 'spice', seed: 8 }), plant('g', 8.5, 0, 1.4, '#c0704a'),
    V('pf.counter', .5, 2.5, { w: 3.5, text: 'ADDIS TABLE', c: '#3f8a55', c2: '#f6e08a', top: 'tea', ic: ['#c0392b', '#f2c230'] }, ST),
    V('generic.rug', .5, 4.6, { c: '#c0392b', c2: '#f2c230', w: 2, d: 2 }), V('generic.rug', 6.5, 3, { c: '#3f8a55', c2: '#f2c230', w: 2, d: 2 }), V('generic.rug', 3.5, 5.6, { c: '#f2c230', c2: '#c0392b', w: 2, d: 2 }),
    V('generic.rug', 6.5, 6.4, { c: '#c0392b', c2: '#3f8a55', w: 2, d: 2 }), V('generic.rug', .5, 7.6, { c: '#3f8a55', c2: '#c0392b', w: 2, d: 2 }),
    V('pf.mesob', .5, 4.6, null, se(2)), V('pf.mesob', 6.5, 3, null, se(1)), V('pf.mesob', 3.5, 5.6, null, se(2)), V('pf.mesob', 6.5, 6.4, null, se(1)), V('pf.mesob', .5, 7.6, null, se(1)),
    lantern(1.25, 5.35, '#f2c230'), lantern(7.25, 3.75, '#f2c230'), lantern(4.25, 6.35, '#f2c230'), lantern(7.25, 7.15, '#f2c230'), plant('snake', 8.5, 9.5, 1.3, '#c0704a')],
  npc: [CS(1.2, 1.6)], exits: [{ x: 4.5, y: 9.5 }] }),
{ blurb: 'No forks, no fuss. Dinner at Addis Table arrives on one great round of injera in a woven basket, and the coffee is roasted at your table if you ask nicely.', signature: 'Colourful woven mesob basket tables, each with a shared platter and low stools.',
  tryThis: ['Share a platter at a mesob table', 'Order the coffee ceremony at the counter'], activities: ['seat', 'till'] });

// ---------------------------------------------------------------- Halo Donuts (downtown) 8 x 7: pink donut shop, fryer and glazing racks in view
P(16, 'Halo Donuts', () => R('Halo Donuts', 8, 7, { music: 'cafe', floor: GT.f_check,
  wall: { color: '#f4b8c8', trim: '#f1ede4', pattern: 'tile', rail: 1.1 },
  items: [WY('bar.neon', 5.6, { kind: 'text', text: 'HOT NOW', c: '#ff4a8a', c2: '#f6e04a' }, 1.15), WX('generic.window', 4.2, { w: 2 }), WX('pf.tv', 2.4, { kind: 'menu', text: 'HALO', c: '#ff4a8a' }),
    V('pf.fryer', .5, 0), V('pf.rack', 3, 0, { kind: 'donut' }), V('pf.rack', 4.2, 0, { kind: 'donut', seed: 5 }), V('kitchen.shelf', 5.9, 0, { seed: 8 }),
    V('pf.counter', .5, 2.5, { w: 3.5, text: 'HALO DONUTS', c: '#e87aa0', top: 'case', ic: ['#e87aa0', '#5a3222', '#f6f0e0', '#f2c230', '#b07af8'] }, ST), V('cafe.bar', 4.5, 2.5, { c: '#e87aa0', mc: '#f1ede4', top: '#f1ede4' }, ST),
    V('cafe.windowbar', 0, 4, { n: 3, c: '#f1ede4', sc: '#e87aa0' }, { flip: true, n: 'seats', ns: 2 }),
    V('cafe.tableset', 5.5, 4.4, { sq: true, c: '#f1ede4', cc: '#e87aa0' }, SE), V('generic.bench', 5.9, 6.4, { c: '#e87aa0' }, se(1)), V('cornerstore.gumball', 7.5, 3.4, { c: '#e87aa0' }),
    lamp(6.25, 4.65, '#e87aa0'), lamp(2.5, 4.5, '#f1ede4')],
  npc: [CS(1.5, 1.6), S(3, 4.6, 3)], exits: [{ x: 3.75, y: 6.5 }] }),
{ blurb: 'Follow the sugar smell and the pink glow. When the HOT NOW sign is lit the glazed rings are still warm, and there is no dignified way to eat one.', signature: 'The donut fryer and two glazing racks working away behind the counter.',
  tryThis: ['Watch donuts bob through the fryer', 'Pick a half-dozen from the pink case', 'Perch at the window bar with a coffee'], activities: ['seat', 'till'] });

// ---------------------------------------------------------------- Baker House Bagels (old town) 9 x 7: brick-oven bagel shop with a boiling kettle
P(20, 'Baker House Bagels', () => R('Baker House Bagels', 9, 7, { music: 'cafe', floor: GT.f_wood, floors: [{ x0: 0, y0: 0, x1: 9, y1: 3, floor: GT.f_tile }],
  wall: { color: '#b8705a', trim: '#2a2733', pattern: 'brick' },
  items: [WX('cafe.menu', 3.3, { name: 'BAGELS', b: '#2a2733' }, 1.2), WX('cafe.menu', 5.4, { name: 'SCHMEAR', b: '#2a2733' }, 1.2), WY('generic.clock', 4.4, null, .4),
    V('pizza.oven', .5, 0, { c: '#8a4a34' }), V('pf.pots', 2.5, 0, { n: 1, soup: '#9fd0e8' }), V('pf.rack', 5, 0, { kind: 'bagel' }), V('pf.rack', 6.2, 0, { kind: 'bagel', seed: 3 }), V('bakery.sacks', 7.6, 0, { n: 4 }),
    V('pf.counter', .5, 3, { w: 3, text: 'BAGELS', c: '#2a2733', c2: '#e8dcc4', top: 'case', ic: ['#c8904a', '#d8a860', '#f1ede4', '#e87aa0'] }, ST), V('cafe.pastrycase', 3.5, 3, { c: '#2a2733', seed: 7 }, U),
    V('cafe.windowbar', .5, 5.5, { n: 3, c: '#8a5a3a', sc: '#2a2733' }, se(2)), V('cafe.tableset', 6.5, 4.3, { c: '#8a5a3a', cc: '#2a2733' }, SE), V('bar.hightable', 6.6, 6.2, { c: '#2a2733' }, se(1)),
    lamp(7.25, 4.55, '#2a2733'), lamp(2, 5.75, '#2a2733')],
  npc: [CS(1.25, 2.1), S(5.6, 4.2, 3)], exits: [{ x: 5, y: 6.5 }] }),
{ blurb: 'Boiled, then baked, the proper way, in a brick oven older than the tram line. Order fast, know your schmear and do not ask for it toasted.', signature: 'A brick bagel oven beside a steaming boiling kettle.',
  tryThis: ['Order an everything bagel with schmear', 'Read the chalkboards while you queue', 'Eat standing at the window bar'], activities: ['seat', 'till'] });

// ---------------------------------------------------------------- Nine Dragons Dim Sum (old town) 14 x 10: red-and-gold banquet hall with roaming carts
P(26, 'Nine Dragons Dim Sum', () => R('Nine Dragons Dim Sum', 14, 10, { music: 'quiet', floor: GT.f_carpet, floors: [{ x0: 0, y0: 0, x1: 14, y1: 1.5, floor: GT.f_tile }, { x0: 0, y0: 7.75, x1: 14, y1: 10, floor: GT.f_darkwood }],
  wall: { color: '#a8281a', trim: '#d8a848', rail: 1.2, h: 3.2 },
  items: [WY('generic.doorway', 4.6, { curtain: '#8a1a10' }), WY('pf.bunting', 9.4, { kind: 'lanterns', w: 4.2, pal: ['#d8a848', '#f6e04a'] }), WX('pf.bunting', 2, { kind: 'lanterns', w: 5, pal: ['#d8a848', '#f6e04a'] }), WX('pf.banner', 7.6, { text: 'NINE DRAGONS', c: '#d8a848', fg: '#8a1a10', a: '#8a1a10' }),
    V('pf.steamers', .5, 0), V('pf.steamers', 2.3, 0, { n: 5 }), V('pf.tank', 6.5, 0, { w: 3, c: '#2a2733' }), V('pf.steamcart', 12.2, 3.2), V('pf.steamcart', 2.6, 8.5, { c: '#d8a848' }),
    ...[[1, 2.5, 2], [4.5, 2.5, 1], [8, 2.5, 2], [1, 5.5, 1], [4.5, 5.5, 1], [8, 5.5, 1], [11.5, 5.5, 1]].map(([x, y, n], i) => V('restaurant.table', x, y, { n: 4, cl: i % 2 ? '#d8a848' : '#c0392b', cc: '#2a2733' }, se(n))),
    ...[[1, 2.5], [4.5, 2.5], [8, 2.5], [1, 5.5], [4.5, 5.5], [8, 5.5], [11.5, 5.5]].map(([x, y]) => lantern(x + .75, y + .75, '#d8a848')),
    V('restaurant.host', 5, 8.2, { c: '#8a1a10' }, ST), plant('g', 13.5, 0, 1.5, '#d8a848'), plant('g', 0, 9.5, 1.4, '#d8a848'), plant('g', 13.5, 9.5, 1.4, '#d8a848')],
  npc: [S(4, 8.9, 0, 'work', 'staff'), S(12.7, 4.2, 3, 'work', 'staff')], exits: [{ x: 7.5, y: 9.5 }] }),
{ blurb: 'Sunday morning at Nine Dragons is a contact sport: seven big round-the-family tables, trolleys of bamboo steamers rattling past and a stamp card you will lose track of.', signature: 'Dim sum trolleys stacked with bamboo steamers working the aisles of a red-and-gold hall.',
  tryThis: ['Flag down a steamer cart', 'Take a seat at one of the big tables', 'See what is swimming in the seafood tank'], activities: ['seat', 'host'] });

// ---------------------------------------------------------------- Bubbling Lantern Hot Pot (old town) 11 x 9: a grid of hot pot tables and a help-yourself bar
P(32, 'Bubbling Lantern Hot Pot', () => R('Bubbling Lantern Hot Pot', 11, 9, { music: 'quiet', floor: GT.f_darkwood, floors: [{ x0: 0, y0: 0, x1: 7, y1: 1.5, floor: GT.f_stone }],
  wall: { color: '#4a2f2f', trim: '#d8a03a', pattern: 'planks', h: 3 },
  items: [WX('bar.neon', 2.8, { kind: 'text', text: 'HOT POT', c: '#ff8a3a', c2: '#f6e04a' }, 1), WX('generic.window', 5.6, { w: 1.8 }), WY('pf.banner', 7.2, { text: 'LANTERN', c: '#c0392b', fg: '#f6e04a', a: '#f6e04a' }),
    V('cornerstore.fridge', .5, 0, { w: 2, kind: 'drinks' }), V('grocery.produce', 3, 0, { items: ['lettuce', 'broc', 'carrot', 'onion', 'pepper', 'tomato', 'eggplant', 'lime'] }, U), V('cafe.condiments', 5.5, 0),
    V('kitchen.shelf', 9.4, 0, { seed: 4 }), V('pf.counter', 7, 1.5, { w: 3.5, text: 'HOT POT', c: '#c0392b', c2: '#2a2733', stripes: false, top: 'jars', ic: ['#c0392b', '#8a5a2a', '#6fb858'] }, ST),
    ...[[.5, 2.5, 2], [3.5, 2.5, 1], [.5, 5.5, 2], [3.5, 5.5, 1], [7.5, 3.5, 2], [8.25, 6.5, 1]].map(([x, y, n], i) => V('pf.hotpot', x, y, i % 2 ? { c: '#2a2733', sc: '#d8a848' } : null, se(n))),
    ...[[.5, 2.5], [3.5, 2.5], [.5, 5.5], [3.5, 5.5], [7.5, 3.5], [8.25, 6.5]].map(([x, y]) => lantern(x + .75, y + .75, '#d63a3a')),
    plant('snake', 10.5, 3.2, 1.3, '#3a3644')],
  npc: [], exits: [{ x: 6.5, y: 8.5 }] }),
{ blurb: 'Pick a broth, pile a plate at the vegetable bar and cook it yourself. Half the pot is gentle and half is a dare, and the red lanterns hide how much you are sweating.', signature: 'Six tables each with a split red-and-white broth pot bubbling in the middle.',
  tryThis: ['Sit down at a bubbling pot', 'Fill a plate at the vegetable and sauce bar'], activities: ['seat', 'till'] });

// ---------------------------------------------------------------- Seoul Ember BBQ (old town) 12 x 9: charcoal grill tables under copper extraction pipes
P(36, 'Seoul Ember BBQ', () => R('Seoul Ember BBQ', 12, 9, { music: 'bar', floor: GT.f_stone, floors: [{ x0: 0, y0: 0, x1: 7, y1: 2.5, floor: GT.f_tile }],
  wall: { color: '#3a3f4c', trim: '#e8843a', h: 3.2 },
  items: [WY('bar.neon', 8.2, { kind: 'text', text: 'SOJU', c: '#5af07a', c2: '#ff4a8a' }, 1.15), WX('bar.neon', 4.6, { kind: 'text', text: 'EMBER', c: '#ff8a3a', c2: '#d63a3a' }, 1.1), WX('generic.window', 6.6, { w: 1.8 }),
    V('kitchen.prep', .5, 0), V('kitchen.grill', 2.8, 0), V('cornerstore.fridge', 4.6, 0, { w: 2, kind: 'drinks' }),
    V('kitchen.pass', 1.5, 2.3, null, { n: 'staff' }), V('pf.counter', 7.5, 1.5, { w: 3.5, text: 'SEOUL EMBER', c: '#e8843a', c2: '#2a2733', stripes: false, top: 'none' }, ST), V('pf.keg', 11.2, 1.5, { n: 1, c: '#3f8a55', band: '#f1ede4' }),
    ...[[.5, 4, 2], [3.5, 4, 1], [6.5, 4, 1], [9.5, 4, 1], [.5, 6.6, 2], [3.5, 6.6, 1], [8.5, 6.6, 1]].map(([x, y, n], i) => V('pf.grilltable', x, y, i % 2 ? { c: '#5a3a28', cc: '#2a2733' } : null, se(n))),
    plant('snake', 11.5, 8.5, 1.3, '#e8843a')],
  npc: [CS(3.5, 1.6)], exits: [{ x: 6.5, y: 8.5 }] }),
{ blurb: 'Every table is its own little bonfire. Seoul Ember brings the short rib raw, the banchan endless and the soju cold, and leaves the grilling to you.', signature: 'Seven charcoal grill tables, each under its own copper extraction pipe.',
  tryThis: ['Grill short rib at your own table', 'Order a round of soju at the counter'], activities: ['seat', 'till'] });

// ---------------------------------------------------------------- Cold Storage Boba & Ice (harbor) 8 x 6: icy-blue bubble tea counter in an old cold store
P(52, 'Cold Storage Boba & Ice', () => R('Cold Storage Boba & Ice', 8, 6, { music: 'cafe', floor: GT.f_lino,
  wall: { color: '#d0e8f0', trim: '#6fb6d8', pattern: 'tile', rail: 0 },
  items: [WY('pf.tv', 3.3, { kind: 'menu', text: 'BOBA', c: '#4ad8f0', w: 2 }), WY('bar.neon', 6.6, { kind: 'text', text: 'ICE', c: '#4ad8f0', c2: '#e87aa0' }, 1.15), WX('generic.window', 3, { w: 2 }),
    V('cornerstore.slushie', .5, 0), V('cornerstore.fridge', 1.9, 0, { kind: 'dairy' }), V('cornerstore.icecream', 6, 0, null, U),
    V('pf.counter', .5, 1.5, { w: 4, text: 'BOBA & ICE', c: '#6fb6d8', top: 'boba', ic: ['#c8904a', '#e87aa0', '#8cc84a', '#b07af8'] }, ST),
    V('cafe.windowbar', .5, 4.5, { n: 3, c: '#f1ede4', sc: '#e87aa0' }, se(2)), V('bar.hightable', 5.6, 3.3, { c: '#6fb6d8' }, SE), V('cornerstore.gumball', 7.5, 5.5, { c: '#6fb6d8' }), V('generic.bin', 7.5, 2),
    lamp(6.3, 3.3, '#e87aa0'), lamp(2, 4.6, '#6fb6d8')],
  npc: [S(5.4, 2.6, 2), S(6.6, 5, 2)], exits: [{ x: 4.75, y: 5.5 }] }),
{ blurb: 'They kept the freezer-room tiles and added tapioca. Cold Storage shakes bubble tea in forty flavours and scoops ice cream out of the old fish locker.', signature: 'A row of steel tea dispensers on a blue-striped counter, with a slushie machine behind.',
  tryThis: ['Order a brown sugar boba', 'Dig through the ice cream freezer', 'Sip at the pink-stool window bar'], activities: ['seat', 'till'] });

// ---------------------------------------------------------------- Rope Works Fish & Chips (harbor) 11 x 8: navy-striped chippy with picnic benches
P(55, 'Rope Works Fish & Chips', () => R('Rope Works Fish & Chips', 11, 8, { music: 'cafe', floor: GT.f_tile,
  wall: { color: '#f1ede4', color2: '#3c64ad', pattern: 'stripes', trim: '#2f3a5a', rail: 1.1 },
  items: [WX('pf.tv', 4, { kind: 'ocean' }), WX('generic.picture', 6.2, { kind: 0, c: '#2f3a5a' }), WY('generic.window', 8.2, { w: 1.2, cross: true, c: '#2f3a5a' }), WY('pf.bunting', 2, { kind: 'flags', w: 4, pal: ['#3c64ad', '#f1ede4', '#d63a3a'] }),
    V('kitchen.fryer', .5, 0), V('kitchen.fryer', 1.5, 0), V('kitchen.prep', 3, 0), V('kitchen.dishpit', 5.5, 0), V('cafe.condiments', 9.8, 0, null, U),
    V('pf.counter', .5, 2.5, { w: 4, text: 'FISH & CHIPS', c: '#3c64ad', top: 'case', ic: ['#d8a030', '#e8c060', '#c08820'] }, ST), V('kitchen.pass', 5, 2.5, null, { n: 'staff' }),
    V('pf.communal', .5, 4.9, { w: 3, c: '#d2a26a', items: ['#e8dcc4', '#d8a030', '#e8dcc4'], mid: '#8a5a2a' }, se(3)), V('pf.communal', 7.5, 4.9, { w: 3, c: '#d2a26a', items: ['#e8dcc4', '#d8a030', '#e8dcc4'], mid: '#8a5a2a' }, se(2)),
    V('generic.bench', 8.5, 2.8, { c: '#3c64ad' }, se(1)), V('pf.keg', 10.4, 7.4, { n: 1, c: '#3c64ad', band: '#f1ede4' }),
    lamp(2, 5.9, '#3c64ad'), lamp(9, 5.9, '#3c64ad')],
  npc: [CS(1.5, 1.6), S(4.4, 4, 3)], exits: [{ x: 5.5, y: 7.5 }] }),
{ blurb: 'Salt, vinegar and a view of nothing but navy stripes. The cod came off the boat this morning and the picnic benches came out of the old rope factory.', signature: 'Twin fryers behind the counter and two long picnic benches out front.',
  tryThis: ['Order cod and chips at the counter', 'Share a picnic bench', 'Drown everything at the vinegar station'], activities: ['seat', 'till'] });

// ---------------------------------------------------------------- Mama Opal's Soul Kitchen (railyard) 10 x 9: steam-table line, pews and gingham
P(57, "Mama Opal's Soul Kitchen", () => R("Mama Opal's Soul Kitchen", 10, 9, { music: 'cafe', floor: GT.f_wood, floors: [{ x0: 0, y0: 0, x1: 10, y1: 2.5, floor: GT.f_lino }],
  wall: { color: '#f0e0a8', trim: '#8a3a2a', rail: 1.1 },
  items: [WX('home.wall.photos', 4.4), WX('home.wall.photos', 6.6), WX('generic.picture', 3, { kind: 1, c: '#8a3a2a' }), WY('generic.clock', 9.3, null, .4),
    V('pf.pots', .5, 0, { n: 2, soup: '#d8a03a' }), V('kitchen.range', 2.8, 0, { soup: '#8a5a2a' }), V('kitchen.prep', 4.6, 0), V('kitchen.shelf', 7.2, 0, { seed: 9 }),
    V('pf.counter', .5, 2.5, { w: 4.5, text: "MAMA OPAL'S", c: '#8a3a2a', c2: '#f6e8c8', top: 'case', ic: ['#d8a03a', '#6fb858', '#c0563a', '#f2c230', '#8a5a2a'] }, ST), V('kitchen.pass', 5.5, 2.5, null, { n: 'staff' }), V('diner.jukebox', 9, 2.5, { c: '#8a3a2a' }, U),
    V('diner.booth', 0, 4.4, { c: '#8a3a2a', tc: '#d2a26a' }, { flip: true, n: 'seats', ns: 1 }), V('diner.booth', 0, 6.7, { c: '#8a3a2a', tc: '#d2a26a' }, { flip: true, n: 'seats', ns: 1 }),
    V('diner.table', 2.6, 4.8, { check: true, c: '#c0392b' }, SE), V('diner.table', 2.6, 7, { check: true, c: '#c0392b' }, se(1)),
    V('diner.table', 7.5, 4.8, { check: true, c: '#c0392b' }, SE), V('diner.table', 7.5, 7, { check: true, c: '#c0392b' }, se(1)),
    V('generic.coatrack', 9.5, 8.5), lamp(3.35, 5.05, '#f6e8c8'), lamp(8.25, 5.05, '#f6e8c8'), lamp(3.35, 7.25, '#f6e8c8'), lamp(8.25, 7.25, '#f6e8c8')],
  npc: [CS(1.5, 1.6)], exits: [{ x: 5.75, y: 8.5 }] }),
{ blurb: 'Mama Opal feeds the railyard night shift and anyone else who looks hungry. Point at what you want on the steam table and she will add a spoonful of something you didn\'t ask for.', signature: 'A long cafeteria steam-table counter fed by two giant pots of greens and gumbo.',
  tryThis: ['Point at your plate along the steam table', 'Sit in a church-pew booth', 'Play something slow on the jukebox'], activities: ['seat', 'till', 'jukebox'] });

// ---------------------------------------------------------------- Rope Works Smokehouse (harbor) 13 x 9: pit smokers, beer-hall tables and a whiskey shelf
P(60, 'Rope Works Smokehouse', () => R('Rope Works Smokehouse', 13, 9, { music: 'bar', floor: GT.f_darkwood, floors: [{ x0: 0, y0: 0, x1: 7, y1: 2.5, floor: GT.f_stone }],
  wall: { color: '#5a3a28', trim: '#c8683f', pattern: 'planks', h: 3 },
  items: [WX('bar.neon', 3.2, { kind: 'text', text: 'BBQ', c: '#ff8a3a', c2: '#f6e04a' }, 1), WX('generic.window', 5.4, { w: 1.8 }), WY('pf.tv', 6.9, { kind: 'menu', text: 'PIT', c: '#ff8a3a' }),
    V('pf.smoker', .5, 0), V('pf.smoker', 2.5, 0), V('kitchen.prep', 4.5, 0), V('bar.backbar', 8.6, 0, { w: 3, name: 'WHISKEY', seed: 6 }), V('pf.keg', 12, 0, { n: 3 }),
    V('pf.counter', .5, 2.5, { w: 4, text: 'SMOKEHOUSE', c: '#2a2733', c2: '#c8683f', stripes: false, top: 'case', ic: ['#7a3a1a', '#a8553f', '#8a5a2a'] }, ST), V('grocery.crates', 5, 2.4, { items: ['potato', 'potato', 'potato'], tall: true }),
    V('bar.hightable', 8.6, 2.2, { c: '#5a3a28' }, se(1)), V('bar.hightable', 10.6, 2.2, { c: '#5a3a28' }, se(1)), V('diner.jukebox', 12, 3.6, { c: '#c8683f' }, U),
    V('pf.communal', 1, 5, { w: 4, c: '#7a4e2d', items: ['#e8dcc4', '#a8553f', '#e8dcc4', '#d8a03a'], mid: '#c0392b' }, se(3)), V('pf.communal', 7.5, 5, { w: 4, c: '#7a4e2d', items: ['#e8dcc4', '#a8553f', '#e8dcc4', '#d8a03a'], mid: '#c0392b' }, se(3)),
    lamp(2.2, 6, '#c8683f'), lamp(3.8, 6, '#c8683f'), lamp(8.7, 6, '#c8683f'), lamp(10.3, 6, '#c8683f'), V('pf.keg', 0, 8.4, { n: 2 })],
  npc: [CS(1.3, 1.6)], exits: [{ x: 6.25, y: 8.5 }] }),
{ blurb: 'Twelve hours over oak, sold by the pound until it is gone. The Smokehouse serves brisket on butcher paper at long tables and does not own a single fork.', signature: 'Two black barrel smokers puffing away behind the butcher counter.',
  tryThis: ['Order brisket by the pound', 'Share a long beer-hall table', 'Pick a tune on the jukebox'], activities: ['seat', 'till', 'jukebox'] });
