// Venue interiors, shops: grocery, cornerstore, clothing, homegoods, bookstore. Format + metadata: see venues_lib.js.
import { GT } from '../../engine/world.js';
import { room, V, WY, WX, S } from './venues_lib.js';

// ---------------------------------------------------------------- FreshWay Market (bright supermarket with aisles) 15 x 12
room({ id: 'grocery', name: 'FreshWay Market', w: 15, d: 12, music: 'shop', floor: GT.f_lino, floors: [{ x0: 0, y0: 2, x1: 1.5, y1: 8, floor: GT.f_wood }, { x0: 10, y0: 0, x1: 15, y1: 1.5, floor: GT.f_concrete }],
  wall: { color: '#e8e4d0', trim: '#3f8a55', rail: 2.3, h: 3 },
  items: [WY('generic.door', 10.5, { kind: 'staff' }), WY('generic.clock', 6.3), WY('generic.exit', 14), WX('generic.window', 8.6), WX('generic.picture', 1, { kind: 0 }),
    V('grocery.fridge', .5, 0, { kind: 'dairy', name: 'DAIRY' }, { n: 'use' }), V('grocery.fridge', 2.5, 0, { kind: 'frozen', name: 'FROZEN', hc: '#3c64ad', seed: 7 }), V('grocery.fridge', 4.5, 0, { kind: 'drinks', name: 'DRINKS', hc: '#e8843a', seed: 3 }),
    V('grocery.bakery', 7, 0, null, { n: 'use' }), V('grocery.bakery', 8.5, 0), V('grocery.crates', 12, 0), V('grocery.crates', 13, 0), V('grocery.crates', 14, .5),
    V('grocery.produce', 0, 2.5, { items: ['apple', 'orange', 'banana', 'lime', 'lemon', 'pear', 'grape', 'apple'], big: 'melon' }, { flip: true, n: 'use' }), V('grocery.produce', 0, 5, { items: ['lettuce', 'tomato', 'carrot', 'eggplant', 'potato', 'pepper', 'onion', 'broc'] }, { flip: true }), V('grocery.scale', 0, 7.5),
    V('grocery.gondola', 3, 2.5, { kind: 'cereal', name: 'CEREAL', hc: '#e8843a' }, { n: 'use' }), V('grocery.gondola', 5, 2.5, { kind: 'drinks', name: 'DRINKS', hc: '#3c64ad' }),
    V('grocery.gondola', 9, 2.5, { kind: 'cereal', name: 'SNACKS', hc: '#c0392b', seed: 5 }), V('grocery.gondola', 11, 2.5, { kind: 'drinks', name: 'JUICE', hc: '#3f8a55', seed: 9 }, { n: 'use' }),
    V('grocery.gondola', 3, 4.5, { kind: 'drinks', name: 'PANTRY', hc: '#8a5a3a', seed: 11 }), V('grocery.gondola', 5, 4.5, { kind: 'cereal', name: 'PASTA', hc: '#d8a03a', seed: 13 }, { n: 'use' }),
    V('grocery.gondola', 9, 4.5, { kind: 'cereal', name: 'HOME', hc: '#7a55b0', seed: 15 }, { n: 'use' }), V('grocery.gondola', 11, 4.5, { kind: 'drinks', name: 'CARE', hc: '#2f8f8a', seed: 17 }),
    V('grocery.aislesign', 3.5, 3.5, { n: 1, a: 'CEREAL', b: 'DRINKS', c: '#3f8a55' }), V('grocery.aislesign', 9.5, 3.5, { n: 2, a: 'SNACKS', b: 'JUICE', c: '#3f8a55' }),
    V('grocery.freezer', 3, 6.5), V('grocery.freezer', 5, 6.5, { seed: 3 }, { n: 'use' }), V('grocery.promo', 9.5, 6.5), V('grocery.flowers', 11.5, 6.5, null, { n: 'use' }),
    V('grocery.checkout', 1.5, 9, null, { n: 'staff use' }), V('grocery.checkout', 5, 9, null, { n: 'staff use' }),
    V('grocery.trolley', 12, 9, { n: 1 }), V('grocery.trolley', 13.5, 9, { n: 1, full: true }), V('grocery.baskets', 14.5, 7), V('generic.plant', 14.5, 11),
  ],
  npc: [S(8, 3.6, 0), S(13.5, 1.2, 3, 'work', 'staff')],
  exits: [{ x: 10.5, y: 11.5 }] });

// ---------------------------------------------------------------- Lucky Corner (cramped late-night corner store) 7 x 6
room({ id: 'cornerstore', name: 'Lucky Corner', w: 7, d: 6, music: 'shop', floor: GT.f_lino,
  wall: { color: '#e8d8b0', trim: '#3f8a55', rail: 1.2 },
  items: [WY('bar.neon', 6.1, { kind: 'text', text: 'OPEN', c: '#5af07a', c2: '#f6e04a' }, 1), WX('generic.picture', 1.6, { kind: 1, c: '#2a2733' }), WX('generic.clock', 5.2),
    V('cornerstore.backshelf', .5, 0), V('cornerstore.fridge', 3, 0, null, { n: 'use' }), V('cornerstore.fridge', 4, 0, { name: 'TEA', hc: '#2f8f8a', seed: 6 }), V('cornerstore.atm', 5.5, 0),
    V('cornerstore.counter', .5, 1.5, null, { n: 'staff use' }), V('cornerstore.shelf', 3.5, 2.5, null, { n: 'use' }), V('cornerstore.magrack', 5, 2.5),
    V('cornerstore.magrack', 0, 3, { seed: 3 }, { flip: true, n: 'use' }), V('cornerstore.icecream', .5, 4.5), V('cornerstore.slushie', 5.5, 4.5, null, { n: 'use' }), V('cornerstore.gumball', 6.5, 5.5),
  ],
  npc: [S(5.75, 1.2, 3)],
  exits: [{ x: 3.2, y: 5.5 }] });

// ---------------------------------------------------------------- Thread & Co. (clothing) 10 x 8
room({ id: 'clothing', name: 'Thread & Co.', w: 10, d: 8, music: 'shop', floor: GT.f_wood,
  wall: { color: '#f0d8d0', trim: '#b8607a', rail: 1 },
  items: [WY('clothing.shoewall', .5), WY('gym.mirror', 8.7, { w: 1 }), WX('generic.window', 6.6, { w: 1.2 }), WX('generic.picture', 1, { kind: 2, c: '#d8a848' }),
    V('clothing.shelves', 3, 0, null, { n: 'use' }), V('clothing.fitting', 5.5, 0), V('clothing.fitting', 6.5, 0, { open: true, cc: '#3c5a8a' }), V('clothing.mirror', 8, 0),
    V('clothing.rack', 0, 2, null, { flip: true, n: 'use' }), V('clothing.rack', 0, 4.5, { seed: 5, pal: 'pastel', sale: true }, { flip: true }),
    V('clothing.roundrack', 3, 2.5, null, { n: 'use' }), V('clothing.foldtable', 5.5, 2.5, null, { n: 'use' }), V('clothing.mannequin', 9, 2.5), V('clothing.mannequin', 9.5, 3.5, { shirt: '#f2c230', pant: '#f1ede4' }),
    V('clothing.pouf', 8.5, 1.5, null, { n: 'seats' }), V('clothing.rack', 2.5, 5, { seed: 9 }, { n: 'use' }),
    V('clothing.counter', 7, 5.5, null, { n: 'staff use' }), V('clothing.accessories', 9.5, 5.5),
    V('clothing.mannequin', .5, 7, { shirt: '#3c64ad' }), V('clothing.mannequin', 1.5, 7, { shirt: '#e87aa0', pant: '#2a2733' }), V('generic.plant', 9.5, 7.5),
  ],
  npc: [S(6, 1.6, 3), S(8.2, 1.1, 3), S(5.8, 5, 2, 'stand', 'staff')],
  exits: [{ x: 4.5, y: 7.5 }] });

// ---------------------------------------------------------------- Nest & Wire (furniture + electronics) 13 x 10
room({ id: 'homegoods', name: 'Nest & Wire', w: 13, d: 10, music: 'shop', floor: GT.f_tile, floors: [{ x0: 1.5, y0: 2, x1: 10, y1: 5.5, floor: GT.f_carpet }],
  wall: { color: '#e4e0d4', trim: '#3a5a8a', rail: 2.4 },
  items: [WY('homegoods.tvwall', .5), WX('generic.window', 5.5), WX('generic.picture', 8.3, { kind: 3, w: 1.5 }),
    V('homegoods.techshelf', 4, 0, null, { n: 'use' }), V('homegoods.lamps', 6.5, 0), V('homegoods.appliance', 8.5, 0), V('homegoods.appliance', 9.5, 0, { kind: 'washer' }, { n: 'use' }), V('homegoods.appliance', 10.5, 0, { kind: 'oven' }),
    V('homegoods.tvstand', 0, 2, null, { flip: true }),
    V('homegoods.sofa', 2, 2.5, null, { n: 'seats', ns: 2 }), V('homegoods.bed', 7, 2.5), V('homegoods.kiosk', 11, 3, null, { n: 'use' }), V('homegoods.rugrolls', 11.5, 5),
    V('homegoods.demotable', 2, 6, null, { n: 'use' }), V('homegoods.plinth', 5, 6, { item: 'speaker' }), V('homegoods.plinth', 7, 6, { item: 'vase', c: '#3a3f4c' }, { n: 'use' }),
    V('homegoods.counter', 9.5, 7.5, null, { n: 'staff use' }), V('homegoods.tvstand', .5, 8.5), V('generic.plant', 12.5, 9), V('generic.floorlamp', 5.5, 2.5),
  ],
  npc: [S(2, 1.2, 3), S(8.2, 5.6, 3), S(11, 1.6, 2, 'stand', 'staff'), S(1.4, 3, 2)],
  exits: [{ x: 5.5, y: 9.5 }] });

// ---------------------------------------------------------------- Dog-Eared Books (narrow second-hand bookshop) 8 x 8
room({ id: 'bookstore', name: 'Dog-Eared Books', w: 8, d: 8, music: 'quiet', floor: GT.f_wood, floors: [{ x0: 5, y0: 4, x1: 8, y1: 6, floor: GT.f_carpet }],
  wall: { color: '#3f5a4a', trim: '#e8dcc4', rail: 1 },
  items: [WX('generic.window', 6.6, { w: 1.2 }), WY('generic.picture', 6.6, { kind: 1, c: '#2a2733' }, 1.5),
    V('books.shelf', .5, 0, { seed: 9, c: '#e8dcc4' }, { n: 'use' }), V('books.shelf', 2.5, 0, { seed: 15, c: '#3a4a5a', face: true }), V('books.shelf', 4.5, 0, { seed: 3 }, { n: 'use' }), V('books.ladder', 6.5, 0), V('books.piles', 7.5, 0),
    V('books.shelf', 0, 2, { seed: 21 }, { flip: true, n: 'use' }), V('books.lowshelf', 0, 4.5, { c: '#e8dcc4', seed: 8, plant: true }, { flip: true }),
    V('bookstore.table', 2.5, 2.5, null, { n: 'use' }), V('books.lowshelf', 5.5, 2.5, { seed: 5 }),
    V('bookstore.spinner', 3.5, 4.5), V('cafe.armchair', 6.5, 4.5, { c: '#c8a850' }, { n: 'seats' }), V('books.piles', 6, 5),
    V('bookstore.till', 1.5, 5.5, null, { n: 'staff use' }), V('home.petbed', 7, 6.5), V('books.piles', .5, 7.5),
  ],
  npc: [S(6.5, 3.6, 3), S(4.2, 5.6, 2)],
  exits: [{ x: 5, y: 7.5 }] });
