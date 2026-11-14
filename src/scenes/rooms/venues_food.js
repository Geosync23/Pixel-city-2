// Venue interiors, food & drink: cafe, bakery, diner, ramen, pizza, restaurant. Format + metadata: see venues_lib.js.
import { GT } from '../../engine/world.js';
import { room, V, WY, WX, S } from './venues_lib.js';

// ---------------------------------------------------------------- Bean & Gone (cosy indie cafe) 10 x 8
room({ id: 'cafe', name: 'Bean & Gone', w: 10, d: 8, music: 'cafe', floor: GT.f_wood, floors: [{ x0: 0, y0: 0, x1: 7.5, y1: 1.5, floor: GT.f_check }, { x0: 6.5, y0: 2.5, x1: 10, y1: 5.5, floor: GT.f_carpet }],
  wall: { color: '#e8d4b0', trim: '#5f8a7a', rail: 1 },
  items: [WY('cafe.menu', .5), WY('cafe.menu', 3, { kind: 'lit' }), WY('generic.clock', 5.1), WY('generic.window', 7.7, { w: 2 }),
    WX('generic.window', 2.5), WX('generic.picture', 5.2, { kind: 3, w: 1.5 }), WX('home.wall.fairylights', 6.8),
    V('bakery.shelves', 5.5, 0), V('cafe.till', .5, 1.5, null, { n: 'staff use' }), V('cafe.bar', 2, 1.5, { c: '#3f6a5a', mc: '#d5dbe0', top: '#f1ede4' }, { n: 'staff use' }), V('cafe.pastrycase', 4.5, 1.5, null, { n: 'use' }),
    V('cafe.condiments', 8, 0), V('generic.plant', 9.5, 0, { kind: 'palm', s: 1.5, pot: '#f1ede4' }),
    V('cafe.tableset', .5, 4, null, { n: 'seats' }), V('cafe.tableset', 4, 4, { c: '#f1ede4', cc: '#c0563a' }, { n: 'seats' }),
    V('cafe.armchair', 7, 2.5, { c: '#c0704a' }, { n: 'seats' }), V('cafe.lowtable', 8.5, 3), V('cafe.armchair', 7, 4, { c: '#4a7a6a' }, { flip: true, n: 'seats' }),
    V('cafe.windowbar', .5, 6.5, { n: 3 }, { n: 'seats', ns: 2 }), V('cafe.tableset', 7, 6.5, { sq: true, c: '#8a5a3a', cc: '#e8c060' }, { n: 'seats', ns: 1 }),
    V('generic.pendant', 1.25, 4.25), V('generic.pendant', 4.75, 4.25), V('home.plant.monstera', 0, 2.5),
  ],
  npc: [S(1, 3.2, 3), S(5.2, 3, 3)],
  exits: [{ x: 5, y: 7.5 }] });

// ---------------------------------------------------------------- Rise & Shine Bakery 8 x 7
room({ id: 'bakery', name: 'Rise & Shine Bakery', w: 8, d: 7, music: 'cafe', floor: GT.f_tile, floors: [{ x0: 0, y0: 3, x1: 8, y1: 7, floor: GT.f_wood }],
  wall: { color: '#f0e0c0', trim: '#c0563a', rail: 1.1 },
  items: [WY('cafe.menu', .5, { name: 'BREAD', b: '#2a2733' }), WY('generic.clock', 7.2), WX('generic.window', 3.4), WX('generic.picture', 5.8, { kind: 2, c: '#d8a848' }),
    V('bakery.worktable', .5, 0), V('bakery.oven', 3, 0), V('bakery.shelves', 5, 0, { seed: 1 }), V('bakery.traycart', 7.5, 0),
    V('bakery.sacks', .5, 2.5), V('bakery.counter', 2.5, 2.5, null, { n: 'staff use' }), V('cafe.pastrycase', 5, 2.5, null, { n: 'use' }),
    V('bakery.shelves', 0, 3.5, { seed: 5 }, { flip: true, n: 'use' }),
    V('cafe.windowbar', 1.5, 6, { n: 3, sc: '#3f6a5a' }, { n: 'seats' }), V('cafe.condiments', 7, 4.5), V('generic.plant', 7.5, 6.5),
  ],
  npc: [S(4.4, 4.5, 3), S(1.5, 1.6, 3, 'work', 'staff'), S(3.6, 1.6, 3, 'work', 'staff')],
  exits: [{ x: 6, y: 6.5 }] });

// ---------------------------------------------------------------- Dot's Diner (chrome 50s diner, open kitchen line) 13 x 9
room({ id: 'diner', name: "Dot's Diner", w: 13, d: 9, music: 'cafe', floor: GT.f_check, floors: [{ x0: 0, y0: 0, x1: 13, y1: 2.5, floor: GT.f_tile }],
  wall: { color: '#9fd0c8', pattern: 'tile', trim: '#d5dbe0', rail: 1.1 },
  items: [WY('kitchen.walkin', .5), WY('generic.clock', 8.6), WY('generic.exit', 11.6),
    WX('bar.neon', 2.7, { kind: 'text', text: 'EAT', c: '#ff4a8a', c2: '#4ad8f0' }, 1), WX('generic.window', 4.5), WX('generic.window', 7),
    V('kitchen.range', 2.5, 0), V('kitchen.grill', 4, 0), V('kitchen.fryer', 5.5, 0), V('kitchen.prep', 6.5, 0), V('kitchen.dishpit', 9, 0), V('kitchen.shelf', 11.5, 0),
    V('kitchen.pass', .5, 2.5, null, { n: 'staff' }), V('diner.counter', 3, 2.5, { w: 5 }, { n: 'seats staff', ns: 3 }), V('diner.jukebox', 11.5, 2.5, null, { n: 'use' }),
    V('diner.booth', .5, 5, null, { n: 'seats', ns: 2 }), V('diner.booth', 3, 5, { c: '#2f8f8a' }, { n: 'seats', ns: 1 }),
    V('diner.booth', .5, 7.5, { c: '#2f8f8a' }, { n: 'seats', ns: 1 }), V('diner.booth', 3, 7.5, null),
    V('diner.table', 9.5, 5, { check: true }, { n: 'seats' }), V('diner.table', 9.5, 7.5, { check: true }, { n: 'seats', ns: 1 }),
    V('generic.coatrack', 12.5, 8.5), V('cornerstore.gumball', 6, 5),
  ],
  npc: [S(4.75, 1.5, 3, 'work', 'staff'), S(7.5, 1.5, 3, 'work', 'staff'), S(1.5, 3.6, 3)],
  exits: [{ x: 7, y: 8.5 }] });

// ---------------------------------------------------------------- Noodle Lantern (tiny lantern-lit ramen bar) 7 x 6
room({ id: 'ramen', name: 'Noodle Lantern', w: 7, d: 6, music: 'quiet', floor: GT.f_darkwood, floors: [{ x0: 0, y0: 0, x1: 7, y1: 2, floor: GT.f_stone }],
  wall: { color: '#d8c8a0', pattern: 'planks', trim: '#5a4030', rail: .9 },
  items: [WY('cafe.menu', 4.6, { name: 'RAMEN', b: '#8a2a2a' }), WX('generic.picture', 2.6, { kind: 1, c: '#2a2733' }), WX('generic.window', 3.8, { w: 1.5 }),
    V('kitchen.range', .5, 0, { soup: '#e8d8a0' }), V('kitchen.prep', 2, 0), V('kitchen.dishpit', 4, 0), V('bakery.sacks', 6, 0),
    V('ramen.bar', .5, 2, { w: 4 }, { n: 'seats staff' }), V('diner.table', 4.5, 4.5, { c: '#5a3a28', tc: '#a8703c' }, { n: 'seats' }),
    V('ramen.lantern', 1, 3.5), V('ramen.lantern', 3.5, 3.5, { c: '#f4f0e8' }), V('ramen.lantern', 5.5, 2.5), V('ramen.lantern', .25, 5.25, { c: '#f4f0e8' }),
    V('home.plant.snake', 6.5, 3),
  ],
  npc: [S(1.2, 4.6, 3), S(5.5, 3.6, 3)],
  exits: [{ x: 2.5, y: 5.5 }] });

// ---------------------------------------------------------------- Slice of Heaven (pizza by the slice) 9 x 7
room({ id: 'pizza', name: 'Slice of Heaven', w: 9, d: 7, music: 'cafe', floor: GT.f_check, floors: [{ x0: 0, y0: 0, x1: 9, y1: 2.5, floor: GT.f_tile }],
  wall: { color: '#f0e4c8', pattern: 'stripes', color2: '#e8d4b0', trim: '#3f8a55', rail: 1 },
  items: [WY('cafe.menu', 2.6, { name: 'PIZZA', b: '#3f8a55' }), WY('generic.clock', 6.9), WX('generic.window', 3.6), WX('generic.picture', 5.9, { kind: 0 }),
    V('pizza.oven', .5, 0), V('kitchen.prep', 2.5, 0), V('kitchen.dishpit', 5, 0), V('kitchen.shelf', 7.5, 0),
    V('pizza.counter', 2, 2.5, null, { n: 'staff use' }),
    V('diner.booth', .5, 4.5, { c: '#8a5a3a', tc: '#d2a26a' }, { n: 'seats', ns: 2 }), V('diner.booth', .5, 6, { c: '#3f8a55' }, { n: 'seats', ns: 1 }),
    V('diner.table', 6.5, 4, { c: '#3f8a55', check: true }, { n: 'seats' }), V('diner.table', 6.5, 5.5, { c: '#c0563a', check: true }, { n: 'seats', ns: 1 }),
    V('generic.vending', 6, 2.5, { c: '#3c64ad' }), V('generic.plant', 8.5, 6.5), V('generic.bin', 5, 2.5),
  ],
  npc: [S(3.2, 4.4, 3), S(1.25, 2, 3, 'work', 'staff'), S(6.5, 3.4, 3)],
  exits: [{ x: 4, y: 6.5 }] });

// ---------------------------------------------------------------- The Gilded Gull (elegant seafood restaurant) 13 x 10
room({ id: 'restaurant', name: 'The Gilded Gull', w: 13, d: 10, music: 'quiet', floor: GT.f_darkwood, floors: [{ x0: 3, y0: 1.5, x1: 13, y1: 8, floor: GT.f_carpet }],
  wall: { color: '#5a3040', trim: '#d8a848', rail: 1, h: 3 },
  items: [V('generic.rug', 5.5, 8, { w: 2, d: 2, c: '#8a2a3a', c2: '#d8a848' }),
    WY('generic.door', 4.6, { kind: 'staff', dc: '#a85a4a' }), WY('generic.window', 8.6, { w: 2 }), WY('generic.window', 10.8, { w: 2, seed: 4 }), WY('generic.picture', 3.3, { kind: 2, c: '#d8a848' }),
    WX('generic.window', 1.8), WX('generic.window', 4.6, { seed: 3 }), WX('generic.picture', 7.6, { kind: 3, w: 1.5 }),
    V('restaurant.winerack', .5, 0), V('restaurant.winerack', 2, 0, { seed: 4 }), V('kitchen.pass', 6, 0, null, { n: 'use', nk: 'staff' }),
    V('restaurant.table', .5, 2, { n: 4, flower: true }, { n: 'seats', ns: 2 }), V('restaurant.table', 4, 2.5, { n: 2, flower: true }, { n: 'seats' }),
    V('restaurant.table', 7.5, 2, { n: 4, flower: true }, { n: 'seats', ns: 2 }), V('restaurant.table', 11, 2.5, { n: 2 }, { n: 'seats', ns: 1 }),
    V('restaurant.table', .5, 6, { n: 2, flower: true }, { n: 'seats' }), V('restaurant.table', 4, 5.5, { n: 4, cc: '#2a2733', flower: true }, { n: 'seats', ns: 2 }),
    V('restaurant.table', 7.5, 6, { n: 2, flower: true }), V('restaurant.table', 10.5, 5.5, { n: 4, flower: true }, { n: 'seats', ns: 2 }),
    V('restaurant.host', 8.5, 8.5, null, { n: 'staff' }), V('generic.plant', .5, 9, { kind: 'palm', s: 1.5, pot: '#f1ede4' }), V('generic.plant', 12.5, 9, { kind: 'palm', s: 1.5, pot: '#f1ede4' }),
    V('generic.coatrack', 10.5, 9), V('generic.pendant', 1.25, 2.75), V('generic.pendant', 8.25, 2.75), V('generic.pendant', 4.75, 6.25), V('generic.pendant', 11.25, 6.25),
  ],
  npc: [S(6.5, 4.6, 0, 'stand', 'staff')],
  exits: [{ x: 6.5, y: 9.5 }] });
