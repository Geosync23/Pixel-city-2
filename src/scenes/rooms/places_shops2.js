// Hand-made interiors for the converted SHOPS, part 2: boutique / thrift, books / records / comics, stationery, pharmacy, pets, toys,
// hardware, gallery, art supply, cheese. Helpers + registration live in places_shops.js; fixtures in src/art/venue/places_shop_art.js.
import { GT } from '../../engine/world.js';
import { V, WY, WX, S } from './venues_lib.js';
import { define, P, PY, PX, CK, U, FL, clock, neon, HL, HG } from './places_shops.js';

const BB = { tags: ['book_browse'] }, BBU = { tags: ['book_browse'], n: 'use' }, NOOK = c => ({ n: 'seats', tags: ['reading_nook'] });

/* =================================================================== CLOTHES */
// ---- Marigold & Main (Downtown) 10 x 8: gold-trimmed boutique, mannequins on a window platform, jewellery case, twin fitting rooms, chandelier
define('Marigold & Main', 12, 'boutique', {
  blurb: 'Carpet you sink into, a chandelier that cost more than the stock, and three mannequins on a platform who are better dressed than anyone on Main Street.',
  signature: 'The lit jewellery case under the chandelier, and the marigold-curtained fitting rooms.',
  tryThis: ['Try something on in the fitting rooms', 'Peer into the jewellery case', 'Browse the shoe wall'], activities: ['fitting_room', 'browse', 'seat'] },
() => ({ w: 10, d: 8, music: 'shop', floor: GT.f_carpet, floors: [{ x0: 0, y0: 1.5, x1: 1.5, y1: 6, floor: GT.f_wood }], wall: { color: '#f6ead0', trim: '#d8a03a', h: 3 },
  items: [PY('sign', 2.5, { text: 'MARIGOLD & MAIN', bg: '#f6ead0', fg: '#a8621a', fr: '#d8a03a' }, 2.3), WY('clothing.shoewall', .3, null, 0), WX('generic.window', 2.4, { w: 3 }),
    V('generic.rug', 4, 3.5, { w: 3, d: 1.5, c: '#d8a03a', c2: '#f6ead0' }),
    V('clothing.shelves', 2.5, 0, { seed: 3, pal: 'warm' }, U), V('clothing.shelves', 4.5, 0, { seed: 6, pal: 'pastel' }), V('clothing.fitting', 7, 0, { cc: '#d8a03a' }, U), V('clothing.fitting', 8, 0, { open: true, cc: '#d8a03a' }),
    P('platform', 0, 2, { w: 1, d: 3.5, c: '#f1ede4' }),
    V('clothing.mannequin', 0, 2.5, { shirt: '#f2a030', pant: '#f1ede4' }, { z: .18 }), V('clothing.mannequin', 0, 3.5, { shirt: '#3a3f4c', pant: '#8a5a3a', scarf: '#f2c230' }, { z: .18 }), V('clothing.mannequin', 0, 4.5, { shirt: '#f1ede4', pant: '#c0a078', scarf: '#d8a03a' }, { z: .18 }),
    V('clothing.roundrack', 3, 2.5, { seed: 4, pal: 'warm' }, U), V('clothing.foldtable', 2.5, 5, { pal: 'warm', c: '#f1ede4' }, U), P('jewel.case', 5.5, 3, null, U), V('clothing.rack', 5, 5.5, { seed: 5, pal: 'pastel' }),
    V('clothing.counter', 7.5, 5, { c: '#f1ede4', top: '#d8a03a', name: 'MARIGOLD', ink: '#a8621a' }, CK),
    V('clothing.pouf', 8, 2.5, { c: '#f2a030' }, { n: 'seats', ns: 1 }), V('clothing.mirror', 9.5, 1.5), V('generic.plant', 9.5, 7.5, { flower: '#f2a030', s: 1.2, pot: '#f1ede4' }), V('generic.plant', 0, 7.5, { flower: '#f2a030', s: 1.2, pot: '#f1ede4' }),
    HL(4.5, 4, 'chandelier')],
  npc: [S(1.6, 3.6, 2), S(6.2, 4.2, 3)], exits: [{ x: 5, y: 7.5 }] }));

// ---- Ink & Ivy Vintage (Arts) 9 x 9: crammed thrift store, three long racks, dig bins, hat-and-bag wall, old hi-fi, curtained changing room
define('Ink & Ivy Vintage', 44, 'thrift', {
  blurb: 'Every rack is a decade. Dig long enough in the two-dollar bin and you will find the jacket your uncle swears he never owned.',
  signature: 'The $2 dig bins and the wall of hats and handbags above the racks.',
  tryThis: ['Rummage in the $2 bin', 'Try a find on behind the plum curtain', 'Put a record on the old hi-fi'], activities: ['fitting_room', 'browse', 'music', 'seat'] },
() => ({ w: 9, d: 9, music: 'shop', floor: GT.f_wood, wall: { color: '#d8c8a8', pattern: 'stripes', color2: '#cdbb96', trim: '#6a4a30' },
  items: [PX('thrift.hatwall', 1.5, { w: 3 }, .95), PX('sign', 5.5, { text: 'VINTAGE', bg: '#6a3a5a', fg: '#f6e8c0' }, 2.0), neon('y', 6.2, { kind: 'heart' }),
    V('home.rug', 3.5, 6.5, { w: 3, d: 2, pat: 'persian', c: '#8a3a2a', c2: '#e8c878', c3: '#2a3a5a' }),
    V('clothing.shelves', .5, 0, { seed: 8 }), V('clothing.rack', 3, 0, { w: 3, seed: 2, long: true }, U), V('home.wardrobe', 6, 0), V('clothing.fitting', 8, 0, { cc: '#6a3a5a' }, U),
    V('clothing.rack', .5, 2.5, { w: 3, seed: 3, pal: 'warm' }, U), V('clothing.rack', .5, 4, { w: 3, seed: 7, pal: 'cool', sale: true }), V('clothing.rack', .5, 5.5, { w: 3, seed: 9, long: true }, U),
    P('thrift.bins', 4.5, 3, { seed: 1 }, U), P('thrift.bins', 4.5, 5, { shoes: 1, name: 'SHOES', c: '#3f8a55', c2: '#f2c230', seed: 4 }),
    V('clothing.counter', 6.5, 2, { c: '#6a4a30', top: '#d8c8a8', name: 'VINTAGE', ink: '#f6e8c0' }, CK),
    V('home.stereo', 8, 4, { on: true }), V('books.piles', 8.5, 5), V('clothing.mannequin', 6.5, 6.5, { shirt: '#c0704a', pant: '#3a4a6a', scarf: '#f2c230' }), V('clothing.mirror', 8.5, 6.5),
    V('cafe.armchair', 7, 7.5, { c: '#8a5a3a' }, { n: 'seats' }), V('generic.floorlamp', 8.5, 8),
    HL(2, 3.5, 'shade', '#c0704a'), HL(5.5, 4.5, 'shade', '#3f6a5a'), HL(4, 7, 'bulb')],
  npc: [S(2, 6.6, 3), S(6.2, 4.4, 2)], exits: [{ x: 4.5, y: 8.5 }] }));

/* =================================================================== BOOKS / RECORDS / COMICS */
// ---- Paper Lantern Books (Downtown) 8 x 10: deep, narrow bookshop, stacks in rows, rolling ladder, carpeted reading nook under paper lanterns
define('Paper Lantern Books', 19, 'books', {
  blurb: 'A long thin shop that gets quieter the further in you go. The lanterns were meant to be temporary, about twenty years ago.',
  signature: 'Glowing paper lanterns floating over rows of dark-wood stacks.',
  tryThis: ['Browse the stacks', 'Claim an armchair in the carpeted nook at the front and read'], activities: ['book_browse', 'reading_nook', 'seat'] },
() => ({ w: 8, d: 10, music: 'quiet', floor: GT.f_darkwood, floors: [{ x0: 4.5, y0: 5.5, x1: 8, y1: 10, floor: GT.f_carpet }], wall: { color: '#e8dcc4', trim: '#7a2a2a' },
  items: [PX('sign', .5, { text: 'PAPER LANTERN', bg: '#7a2a2a', fg: '#f6e8c0' }, 2.05), WX('generic.window', 6.2),
    V('books.shelf', .5, 0, { seed: 1 }, BBU), V('books.shelf', 2.5, 0, { seed: 4 }, BB), V('books.shelf', 4.5, 0, { seed: 7 }, BB), V('books.ladder', 6.5, 0), V('library.globe', 7.5, 0),
    V('bookstore.till', 5.5, 2, { c: '#7a2a2a' }, CK),
    V('books.shelf', .5, 3, { seed: 2 }, BBU), V('books.lowshelf', 2.5, 3, { seed: 3 }, BB), V('books.shelf', .5, 5, { seed: 5 }, BB), V('books.lowshelf', 2.5, 5, { seed: 6, plant: true }, BBU), V('books.shelf', .5, 7, { seed: 8 }, BBU),
    V('bookstore.table', 3, 7, { seed: 2 }, U), V('bookstore.spinner', 5.5, 4, { seed: 2 }), V('library.cart', 6.5, 4),
    V('cafe.armchair', 5.5, 6, { c: '#7a2a2a' }, NOOK()), V('cafe.armchair', 7, 6, { c: '#2f5a48' }, NOOK()), V('generic.floorlamp', 6.5, 6), V('cafe.lowtable', 6, 7.5), V('books.piles', 7.5, 9.5), V('books.piles', 5.5, 9.5, { seed: 3 }),
    HL(1.5, 2, 'lantern', '#f6e8c0'), HL(4, 4, 'lantern', '#f2c890', { r: .26 }), HL(2, 6, 'lantern', '#f0b8a0'), HL(6.5, 7, 'lantern', '#f6e8c0', { r: .28 }), HL(3.5, 8.5, 'lantern', '#f2c890')],
  npc: [S(1.6, 2, 1), S(3.4, 6.2, 3)], exits: [{ x: 4, y: 9.5 }] }));

// ---- Wax & Wane Records (Arts) 10 x 9: moody purple-brick record shop, six labelled crates in rows, cover wall, twin listening stations, moon lamp
define('Wax & Wane Records', 40, 'records', {
  blurb: 'Purple brick, gold lettering and a paper moon over the listening corner. The owner files by mood, not alphabet, and will not be argued with.',
  signature: 'Two headphone listening stations under a glowing paper moon.',
  tryThis: ['Dig through the labelled crates', 'Put the headphones on at a listening station', 'Sink into the sofa by the jukebox'], activities: ['record_bin', 'listening_station', 'music', 'seat'] },
() => ({ w: 10, d: 9, music: 'bar', floor: GT.f_darkwood, wall: { color: '#2f2840', pattern: 'brick', trim: '#d8a848' },
  items: [PY('record.wall', .5, { w: 4, seed: 2 }, 1), neon('y', 5, { kind: 'note', c: '#f6e04a', c2: '#b07af8' }), PX('record.wall', 1.5, { w: 3, seed: 8 }, 1), PX('sign', 5.2, { text: 'WAX & WANE', bg: '#1e1a28', fg: '#f6e04a', lit: 1 }, 2.05),
    P('record.bin', 1, 2, { seed: 1, name: 'ROCK' }, U), P('record.bin', 3, 2, { seed: 2, name: 'SOUL' }), P('record.bin', 1, 4, { seed: 3, name: 'JAZZ' }), P('record.bin', 3, 4, { seed: 4, name: 'FUNK' }, U),
    P('record.bin', 1, 6, { seed: 5, name: 'NEW IN' }, U), P('record.bin', 3, 6, { seed: 6, name: '$1 BIN', c: '#5a3a28' }),
    V('bar.speaker', 6, 0), V('clothing.counter', 6.5, 1.5, { c: '#3a2a48', top: '#d8a848', name: 'WAX', ink: '#f6e04a' }, CK), V('bar.speaker', 8, 0), V('home.stereo', 9, 0, { on: true }),
    P('record.listen', 6.5, 4, { a: '#f6e04a' }, U), P('record.listen', 8, 4, { a: '#b07af8', seed: 6 }, U),
    V('generic.sofa', 6.5, 6.5, { c: '#5a3a6a' }, { n: 'seats' }), V('diner.jukebox', 9, 6, null, U), V('home.plant.snake', 9.5, 8.5),
    HL(2.5, 3.5, 'shade', '#d8a848'), HL(2.5, 5.5, 'shade', '#d8a848'), HL(7.5, 5, 'lantern', '#f6e8a0', { r: .3 })],
  npc: [S(5.6, 3.4, 2)], exits: [{ x: 5.5, y: 8.5 }] }));

// ---- B-Side Records (Arts) 7 x 7: tiny bare-brick basement, counter jammed against the back wall, 45s crate, long box of singles, bare bulbs, a guitar
define('B-Side Records', 42, 'records', {
  blurb: 'Seven paces wide, bare brick, bare bulbs. They only stock the songs that were on the other side, and they are right about every one of them.',
  signature: 'The hand-lettered orange sign over a counter wedged against the back wall.',
  tryThis: ['Flip through the 45s', 'Try the listening deck in the corner', 'Pick up the shop guitar'], activities: ['record_bin', 'listening_station', 'music', 'instrument'] },
() => ({ w: 7, d: 7, music: 'bar', floor: GT.f_concrete, wall: { color: '#7a5244', pattern: 'brick', trim: '#2a2733' },
  items: [PY('record.wall', .3, { w: 2, seed: 5 }, 1.15), PY('sign', 2.6, { text: 'B-SIDE', bg: '#2a2733', fg: '#ff8a3a', lit: 1 }, 1.9), WY('home.wall.poster', 5, { seed: 2 }, 1.7), WX('home.wall.poster', 2, { seed: 1 }), WX('home.wall.poster', 3.1, { seed: 4 }), WX('home.wall.poster', 4.2, { seed: 6 }), neon('x', 5.2, { kind: 'note', c: '#ff8a3a', c2: '#f6e04a' }),
    V('home.stereo', 0, 0, { on: true }), V('clothing.counter', 2.5, 1, { c: '#2a2733', top: '#c8a068', name: 'B-SIDE', ink: '#ff8a3a' }, CK), P('record.listen', 5.5, 0, { a: '#ff8a3a' }, U),
    P('record.bin', .5, 2.5, { seed: 7, c: '#c8a068', name: 'B-SIDES' }, U), P('record.bin', .5, 4.5, { seed: 9, c: '#c8a068', name: '45S' }, U), P('record.bin', 5, 2.5, { kind: 'box', seed: 3 }, FL(U)),
    V('bar.stool', 3.5, 4, { c: '#ff8a3a' }, { n: 'seats' }), V('home.guitar', 6.5, 5.5), V('bar.speaker', 0, 6.5), V('books.piles', 6.5, 6.5),
    HL(1.5, 4, 'bulb'), HL(4, 2.5, 'bulb'), HL(5.5, 5.5, 'bulb')],
  npc: [S(3.2, 3.2, 2), S(4.4, 5.6, 0)], exits: [{ x: 3.5, y: 6.5 }] }));

// ---- Spin City Vinyl (Arts) 12 x 7: turquoise-and-pink pop shop, white crates in two long rows, DJ booth and a lit dance square, disco ball
define('Spin City Vinyl', 50, 'records', {
  blurb: 'Turquoise walls, hot-pink neon and a resident DJ who treats Tuesday afternoon like Saturday night. Half the customers came in to dance.',
  signature: 'The DJ booth and light-up dance square under a disco ball, right there in the shop.',
  tryThis: ['Dance on the lit floor while the DJ plays', 'Dig the disco and house crates', 'Listen before you buy at the deck'], activities: ['record_bin', 'listening_station', 'dancefloor', 'seat'] },
() => ({ w: 12, d: 7, music: 'bar', floor: GT.f_check, wall: { color: '#2fb0a8', trim: '#ff4a8a' },
  items: [PY('record.wall', .5, { w: 4, seed: 11 }, 1), PY('sign', 4.8, { text: 'SPIN CITY VINYL', bg: '#1e1a28', fg: '#ff4a8a', fr2: '#4ad8f0', lit: 1 }, 1.9), neon('x', 1, { kind: 'heart' }), neon('x', 3.2, { kind: 'note' }), neon('x', 5.2, { kind: 'glass' }),
    V('bar.dancetile', 9.5, 4),
    P('record.bin', .5, 2, { seed: 1, c: '#f1ede4', name: 'POP' }, U), P('record.bin', 2.5, 2, { seed: 2, c: '#f1ede4', name: 'DISCO' }), P('record.bin', 4.5, 2, { seed: 3, c: '#f1ede4', name: 'HOUSE' }, U),
    P('record.bin', .5, 4, { seed: 4, c: '#f1ede4', name: 'HIP HOP' }), P('record.bin', 2.5, 4, { seed: 5, c: '#f1ede4', name: 'INDIE' }, U), P('record.bin', 4.5, 4, { seed: 6, c: '#ff4a8a', name: 'SALE' }),
    V('clothing.counter', 7, 2, { c: '#ff4a8a', top: '#f1ede4', name: 'SPIN', ink: '#f4f0e8' }, CK), V('bar.speaker', 9, 0), V('bar.dj', 9.5, 0, { a: '#ff4a8a' }, { n: 'staff' }), V('bar.speaker', 11.5, 0),
    P('record.listen', 7, 4, { a: '#4ad8f0', c: '#f1ede4' }, U), V('generic.sofa', 1, 5.5, { c: '#ff4a8a' }, { n: 'seats', ns: 1 }), V('home.plant.cactus', 11.5, 6.5),
    V('bar.discoball', 10.5, 5), HL(3, 3.5, 'tube', '#ff9ad0'), HL(6, 5.5, 'tube', '#9af0ff')],
  npc: [S(10.2, 5.2, 1, 'dance'), S(11, 4.6, 2, 'dance'), S(8.6, 3.4, 3)], exits: [{ x: 6, y: 6.5 }] }));

// ---- Ink & Ivy Comics & Zines (Arts) 11 x 8: striped yellow comic shop, long boxes on tables, wall of covers, figure cases, arcade, reading corner
define('Ink & Ivy Comics & Zines', 49, 'comics', {
  blurb: 'New issues on the wall every Wednesday, back issues in white long boxes, and a zine rack stapled together by half the neighbourhood.',
  signature: 'The floor-to-ceiling wall of new-issue covers above the long boxes.',
  tryThis: ['Thumb through the long boxes', 'Read in the armchairs by the lamp', 'Play the cabinet in the corner'], activities: ['book_browse', 'reading_nook', 'arcade', 'record_bin', 'seat'] },
() => ({ w: 11, d: 8, music: 'shop', floor: GT.f_carpet, wall: { color: '#f6e7a8', pattern: 'stripes', color2: '#f2dc8c', trim: '#c0392b' },
  items: [PY('record.wall', .5, { kind: 'comic', w: 4, seed: 3 }, 1.4), PX('sign', .3, { text: 'COMICS & ZINES', bg: '#c0392b', fg: '#f6e04a', fr2: '#2a2733' }, 2.05), PX('record.wall', 4.6, { kind: 'comic', w: 3, seed: 8 }, 1),
    V('books.lowshelf', .5, 0, { seed: 2, c: '#c0392b' }, BBU), V('books.lowshelf', 2.5, 0, { seed: 6, c: '#c0392b' }, BB), V('cornerstore.magrack', 5, 0, { seed: 2 }, BBU), V('cornerstore.magrack', 6, 0, { seed: 5 }, BB),
    P('comic.figures', 7.5, 0, null, U), P('comic.figures', 8.5, 0, { seed: 3, c: '#c0392b' }), V('cinema.arcade', 10, 0, null, U),
    P('record.bin', 1, 2.5, { kind: 'box', seed: 1 }, U), P('record.bin', 3.5, 2.5, { kind: 'box', seed: 4, c: '#5a6272' }), P('record.bin', 1, 4.5, { kind: 'box', seed: 7 }, U), P('record.bin', 3.5, 4.5, { kind: 'box', seed: 9, c: '#5a6272' }),
    V('clothing.counter', 7, 2.5, { c: '#c0392b', top: '#f6e04a', name: 'COMICS', ink: '#f6e04a' }, CK),
    V('cafe.armchair', 8, 5, { c: '#3c64ad' }, NOOK()), V('cafe.armchair', 9.5, 5, { c: '#f2c230' }, NOOK()), V('cafe.lowtable', 8.5, 6.5), V('generic.floorlamp', 10.5, 4), V('books.piles', 10.5, 6.5),
    V('cinema.standee', 6, 5, { frame: 2 }), P('toy.robot', 0, 6.5, { c: '#3c64ad' }), V('bookstore.spinner', 0, 2.5, { seed: 3 }, BB), V('bookstore.spinner', 0, 4.5, { seed: 6 }, BB),
    HL(2.5, 4, 'shade', '#c0392b'), HL(5, 4, 'shade', '#3c64ad'), HL(9, 6, 'lantern', '#f6e04a')],
  npc: [S(6.2, 3.4, 2)], exits: [{ x: 5.5, y: 7.5 }] }));

/* =================================================================== RETAIL */
// ---- Old Post Stationers (Old Town) 8 x 7: the old sorting office, brass PO boxes over a card catalogue, pen wall, antique writing desk
define('Old Post Stationers', 30, 'stationery', {
  blurb: 'The old sorting office kept its brass post boxes and filled the rest with ink. The fountain pens are for trying, and the blotter proves people do.',
  signature: 'The wall of brass P.O. boxes, and the antique writing desk where you can test any pen in the shop.',
  tryThis: ['Test a fountain pen at the writing desk', 'Run a finger along the pen wall', 'Pick out a card from the spinner'], activities: ['pen_tester', 'browse'] },
() => ({ w: 8, d: 7, music: 'quiet', floor: GT.f_darkwood, wall: { color: '#d8ccb0', trim: '#5a3a28', rail: 1 },
  items: [PY('post.boxes', .4, { w: 3, name: 'P.O. BOXES' }, 1.45), PX('pen.wall', 1.2, { w: 3 }, .9), PX('sign', 4.4, { text: 'OLD POST', bg: '#5a3a28', fg: '#f6e8c0', fr2: '#d8a848' }, 1.9), clock('y', 7.2, '#d8a848'),
    V('home.rug', 2, 4.5, { w: 3, d: 2, pat: 'persian', c: '#2f5a48', c2: '#d8a848', c3: '#5a1f1f' }),
    V('library.catalog', .5, 0, null, U), V('library.globe', 2.5, 0), P('shelf', 4, 0, { kind: 'books', pal: 'paper', c: '#6a3a28', back: '#2a1f18', name: 'JOURNALS', hc: '#5a3a28', ink: '#f6e8c0' }, U), P('paper.rolls', 6, 0), P('paper.rolls', 7, 0, { seed: 5 }),
    P('writing.desk', 2.5, 3, null, U), V('clothing.counter', 5.5, 2, { c: '#5a3a28', top: '#2f5a48', name: 'POST', ink: '#f6e8c0' }, CK),
    V('bookstore.spinner', 0, 5, { seed: 4 }, U), V('bookstore.spinner', 7.5, 4, { seed: 7 }), V('cornerstore.magrack', 6.5, 5.5, { seed: 6 }),
    V('generic.floorlamp', 0, 6.5), V('home.plant.fiddle', 7.5, 6.5), HL(3.5, 3.5, 'shade', '#2f5a48'), HL(6, 4, 'shade', '#2f5a48')],
  npc: [S(1.4, 2.6, 2), S(5.6, 4.6, 0)], exits: [{ x: 4, y: 6.5 }] }));

// ---- Post Corner Pharmacy (Old Town) 11 x 9: clinical white-and-green chemist, raised dispensary behind glass, four labelled aisles, waiting chairs
define('Post Corner Pharmacy', 34, 'pharmacy', {
  blurb: 'White tile, a green cross that never switches off, and a pharmacist who knows the whole street by ailment. Take a seat; your name will be called.',
  signature: 'The glass-fronted dispensary counter under the PHARMACY sign, with the wall of white boxes behind it.',
  tryThis: ['Hand a prescription over the dispensary counter', 'Wait in the green chairs', 'Step on the old scale'], activities: ['browse', 'seat'] },
() => ({ w: 11, d: 9, music: 'quiet', floor: GT.f_tile, floors: [{ x0: 0, y0: 0, x1: 11, y1: 1.5, floor: GT.f_lino }], wall: { color: '#f1f4f0', trim: '#3f8a55' },
  items: [PX('sign', .4, { text: 'POST CORNER PHARMACY', bg: '#f1f4f0', fg: '#2a6a40', fr: '#3f8a55' }, 2.05), PX('rx.cross', 6.8, null, 1.5), clock('y', 8.8, '#3f8a55'),
    V('grocery.fridge', .5, 0, { kind: 'drinks', name: 'WATER', hc: '#3f8a55', seed: 4 }, U), P('shelf', 3, 0, { kind: 'med', name: 'RX', hc: '#3f8a55', c: '#f1ede4', back: '#dfe8e4' }), P('shelf', 5, 0, { kind: 'med', seed: 5, name: 'RX', hc: '#3f8a55', c: '#f1ede4', back: '#dfe8e4' }),
    V('clinic.cabinet', 7.5, 0), V('generic.vending', 9.5, 0, { c: '#3c64ad', kind: 'snacks', seed: 5 }),
    P('rx.counter', 3.5, 1.5, null, CK),
    V('grocery.gondola', .5, 3.5, { kind: 'med', name: 'COLD+FLU', hc: '#3c64ad', seed: 1 }, U), V('grocery.gondola', 2.5, 3.5, { kind: 'household', name: 'SKIN', hc: '#e87aa0', seed: 3 }),
    V('grocery.gondola', .5, 5.5, { kind: 'med', name: 'VITAMINS', hc: '#e8843a', seed: 6 }, U), V('grocery.gondola', 2.5, 5.5, { kind: 'household', name: 'BABY', hc: '#6fb6d8', seed: 8 }),
    V('bookstore.spinner', 7.5, 2.5, { seed: 3 }), V('clinic.scale', 10.5, 2.5), V('clinic.chairs', 8, 4, { c: '#3f8a55' }, { n: 'seats', ns: 2 }), V('clinic.magtable', 9.5, 4),
    V('grocery.gondola', 5.5, 3.5, { kind: 'household', name: 'BEAUTY', hc: '#b07ad8', seed: 12 }, U), V('grocery.promo', 6, 5, { name: 'SPF', c: '#f2c230' }), V('cornerstore.shelf', 7.5, 6.5, { seed: 2 }, U), V('grocery.baskets', 3.5, 8.5), V('generic.plant', 10.5, 8.5),
    HL(2.5, 4.5, 'tube'), HL(5, 3, 'tube'), HL(8, 5.5, 'tube'), HL(4.5, 7, 'tube')],
  npc: [S(5, 4.2, 3), S(4.4, 1, 3, 'work', 'staff')], exits: [{ x: 5, y: 8.5 }] }));

// ---- Paws & Whiskers Pet Supply (Old Town) 12 x 9: glowing fish-tank wall, stacked small-animal cages, puppy pen on a mat, bird stands, kibble stacks
define('Paws & Whiskers Pet Supply', 35, 'pets', {
  blurb: 'You came in for cat litter. You will leave forty minutes later knowing the name of every puppy in the pen.',
  signature: 'The puppy pen in the middle of the floor, ringed by a wall of glowing fish tanks.',
  tryThis: ['Lean over the pen and meet the puppies', 'Watch the tropical fish', 'Whistle at the parrots'], activities: ['pet_pen', 'fish_tank', 'browse'] },
() => ({ w: 12, d: 9, music: 'shop', floor: GT.f_lino, floors: [{ x0: 4, y0: 3.5, x1: 7.5, y1: 6.5, floor: GT.f_mat }], wall: { color: '#e0ecf0', trim: '#2f8f8a' },
  items: [PX('sign', .3, { text: 'PAWS & WHISKERS', bg: '#2f8f8a', fg: '#f4fbfc' }, 2.05), WX('generic.window', 5.4),
    P('pet.tanks', .5, 0, { name: 'TROPICAL' }, U), P('pet.tanks', 2.5, 0, { seed: 9, c: '#2a4a5a' }), P('pet.cages', 5, 0, null, U), P('pet.cages', 7, 0, { seed: 3, kinds: ['bird', 'bird', 'ham', 'bun'] }), V('home.cattree', 10, 0, { cat: true }),
    V('cornerstore.counter', 9, 2.5, { c: '#2f8f8a' }, CK),
    P('pet.pen', 4.5, 4, { name: 'ADOPT ME' }, U), P('pet.birdcage', 3, 2.5), P('pet.birdcage', 3.5, 2.5, { bird: '#f2c230', c: '#c4c9ce' }),
    P('pet.foodbags', 0, 2.5, null, FL(U)), P('pet.foodbags', 0, 3.5, { seed: 2, three: 1 }, FL()), V('grocery.gondola', 0, 5, { kind: 'cans', name: 'CHOW', hc: '#e8843a', seed: 4 }, FL()),
    P('shelf', 1.5, 4.5, { w: 1.5, h: 1.6, kind: 'snacks', rows: 3, pal: 'pet', name: 'TOYS', hc: '#7a55b0' }, U), V('home.petbed', 2, 6.5, { c: '#e87aa0' }), V('home.petbed', 2, 7.5, { c: '#6fb6d8' }),
    V('home.aquarium', 8.5, 4.5), P('pet.foodbags', 10.5, 7.5, { seed: 1 }), P('pet.birdcage', 0, 8, { bird: '#6fb6d8' }), P('shelf', 9.5, 5.5, { kind: 'household', pal: 'pet', name: 'GROOMING', hc: '#2f8f8a' }, U), V('generic.plant', 11.5, 8.5),
    HL(5.5, 4.5, 'shade', '#2f8f8a'), HL(2, 3.5, 'tube'), HL(9, 4, 'tube')],
  npc: [S(6.8, 6.2, 3), S(1.5, 1.2, 3), S(10.4, 6.6, 3)], exits: [{ x: 7.5, y: 8.5 }] }));

// ---- Tin Robot Toys (Old Town) 10 x 10: square toy shop around a three-tier display tower, cubby wall, train table, kites and planes overhead, giant tin robot
define('Tin Robot Toys', 59, 'toys', {
  blurb: 'A proper toy shop: nothing needs batteries except the robot on top of the tower, and he has been waving since 1962.',
  signature: 'The three-tier toy tower in the middle of the carpet, crowned by a tin robot.',
  tryThis: ['Circle the tower and find the robot', 'Drive the train round the play table', 'Look up at the kites and planes'], activities: ['toy_demo', 'browse', 'seat'] },
() => ({ w: 10, d: 10, music: 'shop', floor: GT.f_wood, floors: [{ x0: 2.5, y0: 3, x1: 7, y1: 7.5, floor: GT.f_carpet }], wall: { color: '#f6e8b0', pattern: 'stripes', color2: '#f2d890', trim: '#d63a3a' },
  items: [PX('sign', .4, { text: 'TIN ROBOT TOYS', bg: '#d63a3a', fg: '#f6e04a', fr2: '#3c64ad' }, 2.05), WX('generic.window', 5.5),
    P('toy.cubby', .5, 0, null, U), P('toy.cubby', 2.5, 0, { seed: 5 }), P('toy.cubby', 4.5, 0, { seed: 9 }, U), P('shelf', 7, 0, { kind: 'cereal', pal: 'toy', name: 'GAMES', hc: '#3c64ad' }), V('cornerstore.gumball', 9.5, 0),
    V('clothing.counter', 7, 2.5, { c: '#d63a3a', top: '#f2c230', name: 'TOYS', ink: '#f4f0e8' }, CK),
    P('toy.tower', 4, 4, null, U), P('toy.traintable', .5, 6.5, null, U), P('toy.robot', 8, 8),
    V('books.lowshelf', 0, 2.5, { seed: 3, c: '#3c64ad' }, FL(U)), V('bookstore.spinner', 0, 5), V('clothing.pouf', 8, 4.5, { c: '#3c64ad' }, { n: 'seats' }), V('bookstore.table', 7.5, 6, { seed: 2 }, U),
    HG(2, 3, 'kite'), HG(6.5, 3.5, 'plane'), HG(3, 6, 'kite', { c: '#3f8a55' }), HG(7, 5, 'plane', { c: '#3c64ad' }), HL(2, 5, 'shade', '#f2c230'), HL(7.5, 4, 'shade', '#3c64ad'), HL(5, 8, 'shade', '#d63a3a')],
  npc: [S(3.4, 5, 0), S(6.2, 5, 2)], exits: [{ x: 5.5, y: 9.5 }] }));

// ---- Salt & Co. Chandlery & Hardware (Harbor) 13 x 8: long concrete shop, parts-drawer walls, pegboard of tools, rope reels, lumber + pipe racks, buoys
define('Salt & Co. Chandlery & Hardware', 54, 'hardware', {
  blurb: 'If it holds a boat together, it is in a drawer here, and the drawer is labelled in pencil. Ask for the size; nobody has ever found anything alone.',
  signature: 'The pegboard wall of tools and the rope reels you cut to length yourself.',
  tryThis: ['Browse the tool wall', 'Rattle through the nut-and-bolt drawers', 'Measure off some rope'], activities: ['browse'] },
() => ({ w: 13, d: 8, music: 'shop', floor: GT.f_concrete, wall: { color: '#cfd6d4', pattern: 'planks', trim: '#2f4a6a', h: 3 },
  items: [PX('hw.pegwall', 1, { w: 4, seed: 2 }, .85), PX('sign', .6, { text: 'SALT & CO. CHANDLERY', bg: '#2f4a6a', fg: '#f6e8c0' }, 2.35), PX('hw.lifering', 6.6, { bg: '#cfd6d4' }, 1.3),
    P('hw.bins', .5, 0, { name: 'BOLTS' }, U), P('hw.bins', 2.5, 0, { name: 'SCREWS', seed: 4 }), P('hw.paint', 5, 0, null, U), P('hw.lumber', 7, 0), P('hw.lumber', 8, 0, { pipes: 1, seed: 3 }), V('books.ladder', 9.5, 0), P('hw.rope', 11, 0, { seed: 1 }, U),
    P('shelf', 2, 3, { kind: 'cans', pal: 'oil', name: 'VARNISH', hc: '#2f4a6a', c: '#8a9098' }, U), V('homegoods.techshelf', 4, 3, { name: 'TOOLS', hc: '#e8843a' }),
    P('hw.bins', 2, 5, { name: 'NAILS', seed: 7, c: '#2f4a6a' }), P('shelf', 4, 5, { kind: 'household', name: 'MARINE', hc: '#2f8f8a', c: '#8a9098' }, U),
    V('homegoods.counter', 9.5, 2.5, { c: '#2f4a6a', name: 'CHANDLER' }, CK), V('homegoods.kiosk', 12.5, 2.5),
    P('barrel', 7.5, 3, { fill: '#b8bcc0', tag: 1 }), P('barrel', 8, 3, { fill: '#c8683f', tag: 1 }), P('hw.rope', 8, 5, { seed: 3 }), P('crate', .5, 7, { items: ['#e8643a', '#f2c230', '#3c64ad'] }), P('barrel', 2, 7, { fill: '#d8c090', tag: 1 }), P('barrel', 2.5, 7, { fill: '#8a9098' }), P('hw.lumber', 12, 4.5, { seed: 6 }), P('crate', 11.5, 7, { items: ['#c8a068', '#b8bcc0', '#8a5a3a'] }), V('homegoods.demotable', 10, 5.5, { c: '#8a9098' }, U),
    HG(7, 2, 'buoy'), HG(9, 4, 'buoy', { c: '#f2c230' }), HG(6.5, 6, 'buoy', { c: '#3c64ad' }), HL(3, 4, 'tube'), HL(5, 6.5, 'tube'), HL(10.5, 4, 'tube')],
  npc: [S(1.4, 3, 2), S(8.6, 6.2, 3)], exits: [{ x: 7, y: 7.5 }] }));

// ---- Tidewater Gallery (Arts) 14 x 8: wide white cube, big canvases under picture lights, six plinths, a mobile, white benches, almost nothing else
define('Tidewater Gallery', 47, 'gallery', {
  blurb: 'Fourteen metres of white wall and a concrete floor you are afraid to scuff. This month: the bay, painted by people who have clearly been in it.',
  signature: 'The big seascape under its brass picture light, and the red-and-yellow mobile turning slowly overhead.',
  tryThis: ['Stand in front of the seascape for a while', 'Walk the plinths', 'Sit on a white bench and say "hm"'], activities: ['artwork', 'seat'] },
() => ({ w: 14, d: 8, music: 'quiet', floor: GT.f_concrete, floors: [{ x0: 10, y0: 4, x1: 14, y1: 8, floor: GT.f_wood }], wall: { color: '#f6f5f0', trim: '#2a2733', h: 3.2 },
  items: [PY('gal.canvas', .8, { w: 3, h: 1.6, kind: 'sea' }, .9), PY('gal.canvas', 4.6, { w: 1.5, h: 1.6, kind: 'field' }, .9), PY('gal.canvas', 6.8, { w: 2.5, h: 1.4, kind: 'drip', seed: 4 }, 1), PY('gal.canvas', 10, { w: 1.5, h: 1.5, kind: 'portrait' }, .95), PY('gal.canvas', 12, { w: 1.5, h: 1.5, kind: 'night' }, .95),
    PX('gal.canvas', .6, { w: 2.5, h: 1.5, kind: 'geo' }, .9), PX('gal.canvas', 3.5, { w: 1.5, h: 1.4, kind: 'field', c: '#2f4a6a', c2: '#6fb6d8', c3: '#f1ede4' }, 1), PX('sign', 5.2, { text: 'TIDEWATER', bg: '#f6f5f0', fg: '#2a2733', fr: '#2a2733' }, 1.6),
    P('gal.plinth', 2, 2.5, { kind: 'twist' }, U), P('gal.plinth', 5, 2, { kind: 'spheres', a: '#d63a3a' }), P('gal.plinth', 8, 3, { kind: 'ring', a: '#d8a848', h: 1 }, U), P('gal.plinth', 4, 5, { kind: 'bust' }, U), P('gal.plinth', 7, 5.5, { kind: 'glass' }), P('gal.plinth', 11, 2, { kind: 'stack', a: '#3f8a55' }, U),
    V('generic.bench', 2, 6, { c: '#e8e2d4' }, { n: 'seats' }), V('generic.bench', 9.5, 1.5, { c: '#e8e2d4' }, { n: 'seats', ns: 1 }),
    V('clothing.counter', 11, 5.5, { c: '#f6f5f0', top: '#2a2733', name: 'GALLERY', ink: '#2a2733' }, CK), V('bank.brochures', 13, 7), V('home.plant.fiddle', 13.5, 4),
    HG(6, 4, 'mobile'), HL(2.5, 1.5, 'shade', '#f1ede4'), HL(5.5, 1, 'shade', '#f1ede4'), HL(8, 1.5, 'shade', '#f1ede4'), HL(11.5, 1, 'shade', '#f1ede4')],
  npc: [S(7.8, 1.3, 3), S(1.2, 4.4, 2)], exits: [{ x: 6.5, y: 7.5 }] }));

// ---- Studio 11 Art Supply (Arts) 9 x 10: rainbow walls of paint tubes, marker wall, flat files, stacked canvases, two demo easels on a wood patch
define('Studio 11 Art Supply', 48, 'art', {
  blurb: 'Paint tubes shelved in spectrum order, which the staff will re-sort while glaring if you put cadmium back next to cobalt.',
  signature: 'The rainbow wall of paint tubes, and two demo easels anyone can paint on.',
  tryThis: ['Paint at a demo easel', 'Test markers on the scrap pad', 'Flip through the flat files of paper'], activities: ['easel', 'pen_tester', 'browse'] },
() => ({ w: 9, d: 10, music: 'shop', floor: GT.f_concrete, floors: [{ x0: 2, y0: 5.5, x1: 7, y1: 9, floor: GT.f_wood }], wall: { color: '#f4f1ea', trim: '#e8643a' },
  items: [PX('pen.wall', 1.2, { w: 3, c: '#3a3f4c', seed: 5 }, .9), PX('gal.canvas', 4.8, { w: 1.5, h: 1.2, kind: 'drip', light: false }, 1.1), PX('sign', 6.6, { text: 'STUDIO 11', bg: '#e8643a', fg: '#f4f1ea' }, 2.05), WY('home.wall.art', 5, { seed: 4 }, 2),
    P('art.paintrack', .5, 0, null, U), P('art.paintrack', 2.5, 0, { c: '#5a3a28' }), P('hw.paint', 4.5, 0, { c: '#f1ede4' }, U), P('art.canvases', 6.5, 0, null, U), P('art.canvases', 7.5, 0, { cs: ['#f4b8c8', '#d63a3a'] }),
    V('clothing.counter', 6, 2, { c: '#e8643a', top: '#f4f1ea', name: 'STUDIO', ink: '#f4f0e8' }, CK), P('art.flatfile', 3, 3, null, U),
    V('home.easel', 2.5, 6, { art: 'land' }), V('home.easel', 4.5, 6.5, { art: 'portrait', wip: true }), V('homegoods.demotable', 6.5, 5, { c: '#d2a26a' }, U),
    P('paper.rolls', 0, 5, { c: '#3a3f4c' }, FL()), P('shelf', 0, 6.5, { h: 1.6, kind: 'books', rows: 3, pal: 'paper', name: 'PADS', hc: '#e8643a' }, FL(U)), V('books.piles', 8.5, 8), V('generic.plant', 8.5, 9.5),
    HL(4, 3.5, 'shade', '#e8643a'), HL(3.5, 7, 'shade', '#f1ede4'), HG(7, 7.5, 'mobile')],
  npc: [S(1.4, 2.6, 2), S(3, 7.2, 3), S(7.4, 4, 3)], exits: [{ x: 5, y: 9.5 }] }));

// ---- The Rind & The Wheel (Downtown) 7 x 6: pocket cheesemonger, glass case across the room, ageing racks of wheels, tasting barrel, salami overhead
define('The Rind & The Wheel', 18, 'cheese', {
  blurb: 'Six metres of shop, forty cheeses and one opinionated monger. Something is always open on the barrel; it is rude not to.',
  signature: 'The glass cheese case that fills the room, backed by racks of ageing wheels.',
  tryThis: ['Taste whatever is on the barrel today', 'Ask the monger what goes with it'], activities: ['tasting_board', 'browse'] },
() => ({ w: 7, d: 6, music: 'quiet', floor: GT.f_stone, wall: { color: '#f0e4c0', trim: '#8a5a3a', rail: 1 },
  items: [PX('sign', .4, { text: 'RIND & WHEEL', bg: '#8a5a3a', fg: '#f6e8c0', fr2: '#f2d040' }, 2.1), WX('generic.window', 4.2, { w: 1 }),
    P('cheese.wheels', .5, 0, null, U), P('cheese.wheels', 2, 0, { seed: 5 }), V('restaurant.winerack', 3.5, 0, { seed: 2 }), V('cornerstore.fridge', 5.5, 0, { name: 'BRIE', hc: '#8a5a3a' }),
    P('cheese.counter', .5, 2, { w: 4, top: '#8a5a3a' }, CK), P('tasting', 5.5, 3.5, null, U),
    P('crate', 0, 4, { items: ['#e8d8a0', '#c8a070', '#f4e9cf'] }, FL()), P('barrel', 0, 5.5, { fill: '#5a8a4a', tag: 1 }), V('generic.plant', 6.5, 5.5),
    HG(1.5, 2.5, 'salami'), HG(3, 2.5, 'salami', { seed: 4 }), HL(6, 4, 'shade', '#8a5a3a'), HL(3, 4.5, 'shade', '#8a5a3a')],
  npc: [S(2, 3.6, 3), S(1.2, 1.2, 3, 'work', 'staff'), S(1.4, 4.6, 2)], exits: [{ x: 3, y: 5.5 }] }));
