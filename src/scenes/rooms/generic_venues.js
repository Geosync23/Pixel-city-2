// Generic venue interiors for converted shopfronts (rooms 'pub:<n>', see src/sim/public_places.js).
// 12 hand-authored TEMPLATES, each with 2 layouts (small / roomy) and per-instance variation (wall, floor and accent colours, wall decor,
// sign text on menu boards / neon, which plants and extras show) picked from a seed, so every instance is stable across visits and saves.
//   genericRoom(tpl, seed, { name, sign, kind }) -> interior.js room def (no id / venue: the caller adds those and passes it to venues_lib room()).
//   TEMPLATES: cafe (kind 'tea'), bakery, diner, eatery (counter service; kind = cuisine), restaurant, bar, boutique (kind 'thrift'),
//              books (kinds 'records' | 'comics'), bodega, grocery_m, retail (kind hardware|pets|toys|florist|pharmacy|stationery|art|gallery|cheese),
//              service (kind barber|salon|nails|tattoo|laundry)
// Every room has a checkout-tagged counter with a staff spot, seats where food is eaten in, 6-12 npcSpots and `music`.
import { GT } from '../../engine/world.js';
import { V, WY, WX, S } from './venues_lib.js';

const WALLS = ['#e8d4b0', '#f0e0c0', '#d8e4d0', '#e8d0d4', '#d0dce8', '#f0d8a8', '#e0c8b0', '#cfe0d8', '#ecd9c6', '#d9cfe6', '#f1ead8', '#e6dcc0'];
const DARKS = ['#3a2a48', '#2f3a4a', '#4a2f2f', '#2f4038', '#3a3430'];
const ACC = ['#5f8a7a', '#c0563a', '#3f6a9a', '#8a5a3a', '#7a55b0', '#2f8f8a', '#d8a03a', '#b0486a', '#3f8a55', '#4a4a6a', '#c8683f', '#3c64ad'];
const NEON = ['#ff4a8a', '#4ad8f0', '#f6e04a', '#5af07a', '#b07af8', '#ff8a3a'];
const PLANTS = ['generic.plant', 'home.plant.monstera', 'home.plant.fiddle', 'home.plant.snake', 'home.plant.cactus'];
const ASIAN = { pho: 1, dimsum: 1, kbbq: 1, hotpot: 1, curry: 1, boba: 1, tea: 1 };
const SOUP = { pho: '#e8d8a0', curry: '#c8862a', hotpot: '#c0392b', soul: '#d8a03a', kbbq: '#a8553f' };

function ctx(seed, o) {
  let a = (seed * 2654435761 + 97) >>> 0; const r = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const pick = arr => arr[Math.floor(r() * arr.length)], c = { r, pick, L: seed % 2, kind: o.kind || '', name: o.name || 'Shop', sign: (o.sign || 'OPEN').toUpperCase().slice(0, 10), items: [], npc: [] };
  c.wall = pick(WALLS); c.acc = pick(ACC); c.acc2 = pick(ACC.filter(x => x !== c.acc)); c.neon = pick(NEON); c.neon2 = pick(NEON.filter(x => x !== c.neon));
  c.add = (...its) => { for (const it of its) if (it) c.items.push(it); };
  c.plant = (x, y) => c.add(V(pick(PLANTS), x, y, { s: 1 + r() * .4, pot: pick(['#f1ede4', '#c0704a', '#4a7a6a', '#3a3644']) }));
  // wall decor in free 2-wide slots (back wall 'y' / left wall 'x')
  c.decor = (wall, slots, extra) => { const W_ = wall === 'y' ? WY : WX; for (const at of slots) { const k = Math.floor(r() * 6); c.add(k === 0 ? W_('generic.window', at) : k === 1 ? W_('generic.picture', at + .5, { kind: Math.floor(r() * 4), c: c.acc }) : k === 2 ? W_('home.wall.photos', at + .2) : k === 3 ? W_('home.wall.art', at + .5) : k === 4 ? W_('generic.picture', at + .2, { kind: Math.floor(r() * 4), w: 1.5 }) : (extra || W_('home.wall.poster', at + .6))); } };
  c.neonSign = (wall, at, text) => c.add((wall === 'y' ? WY : WX)('bar.neon', at, { kind: 'text', text: text || c.sign, c: c.neon, c2: c.neon2 }, 1.1));
  return c;
}
const out = (c, w, d, def) => Object.assign({ name: c.name, w, d, items: c.items, npc: c.npc }, def);

const T = {
  // ---------------------------------------------------------------- small cafe / tea house: 9x7 or 11x8
  cafe(c) {
    const big = c.L === 1, w = big ? 11 : 9, d = big ? 8 : 7, tea = c.kind === 'tea', lamp = tea ? 'ramen.lantern' : 'generic.pendant';
    c.add(WY('cafe.menu', .5, { name: c.sign, b: tea ? '#2f4a3a' : '#2a2733' }), WY('cafe.menu', 3, { kind: 'lit' }), WY('generic.clock', 5.1)); c.decor('x', big ? [2.5, 5.2] : [3, 5]); if (big) c.add(WY('generic.window', 8.6));
    c.add(V('bakery.shelves', 5.5, 0, { seed: 1 + Math.floor(c.r() * 8) }), V('cafe.till', .5, 1.5, null, { n: 'staff use' }), V('cafe.bar', 2, 1.5, { c: c.acc, mc: '#d5dbe0', top: '#f1ede4' }, { n: 'staff use' }), V('cafe.pastrycase', 4.5, 1.5, null, { n: 'use' }),
      V('cafe.condiments', big ? 8 : 7.5, 0)); c.plant(w - .5, 0);
    const tb = (x, y, o) => { c.add(V('cafe.tableset', x, y, { c: c.pick(['#f1ede4', '#8a5a3a', '#c9a27a']), cc: c.pick([c.acc, c.acc2, '#c0563a']) }, o), V(lamp, x + .75, y + .25, tea ? { c: c.acc2 } : null)); };
    if (!big) { tb(.5, 3.5, { n: 'seats' }); tb(3.5, 3.5, { n: 'seats', ns: 1 }); tb(6.5, 3.5, { n: 'seats' }); tb(.5, 5.5, { n: 'seats', ns: 1 }); tb(6.5, 5.5, null); }
    else { tb(.5, 3.5, { n: 'seats' }); tb(3.5, 3.5, { n: 'seats', ns: 1 }); tb(.5, 6, { n: 'seats', ns: 1 }); tb(3.5, 6, { n: 'seats' });
      c.add(V('cafe.armchair', 8, 3, { c: c.acc }, { n: 'seats' }), V('cafe.lowtable', 9.5, 3.5), V('cafe.armchair', 8, 4.5, { c: c.acc2 }, { flip: true, n: 'seats' }), V('cafe.tableset', 8.5, 6.5, { sq: true, c: '#8a5a3a', cc: '#e8c060' }, { n: 'seats', ns: 1 })); }
    c.npc.push(S(1.2, 2.8, 3), S(5.2, 2.8, 3));
    return out(c, w, d, { music: tea ? 'quiet' : 'cafe', floor: tea ? GT.f_darkwood : GT.f_wood, floors: [{ x0: 0, y0: 0, x1: 7.5, y1: 1.5, floor: tea ? GT.f_stone : GT.f_check }].concat(big ? [{ x0: 7.5, y0: 2.5, x1: 11, y1: 6, floor: GT.f_carpet }] : []),
      wall: { color: c.wall, trim: c.acc, rail: 1, pattern: tea ? 'planks' : 'plain' }, exits: [{ x: big ? 6.5 : 4.5, y: d - .5 }] });
  },
  // ---------------------------------------------------------------- bakery + coffee: 8x7 or 10x7
  bakery(c) {
    const big = c.L === 1, w = big ? 10 : 8, d = 7;
    c.add(WY('cafe.menu', .5, { name: c.sign, b: '#2a2733' }), WY('generic.clock', 7.2)); c.decor('x', [3.4, 5.6]);
    c.add(V('bakery.worktable', .5, 0), V('bakery.oven', 3, 0), V('bakery.shelves', 5, 0, { seed: 1 + Math.floor(c.r() * 6) }), V('bakery.traycart', 7.5, 0),
      V('bakery.sacks', .5, 2.5), V('bakery.counter', 2.5, 2.5, null, { n: 'staff use' }), V('cafe.pastrycase', 5, 2.5, null, { n: 'use' }),
      V('bakery.shelves', 0, 3.5, { seed: 5 }, { flip: true, n: 'use' }), V('cafe.windowbar', 1.5, 6, { n: 3, sc: c.acc }, { n: 'seats' }), V('cafe.condiments', 7, 4.5));
    if (big) { c.add(V('cafe.tableset', 8, 2.5, { cc: c.acc }, { n: 'seats' }), V('cafe.tableset', 8, 4.5, { cc: c.acc2 }, { n: 'seats', ns: 1 }), WY('generic.window', 8)); c.plant(9.5, 6.5); } else c.plant(7.5, 6.5);
    c.npc.push(S(4.4, 4.5, 3), S(1.5, 1.6, 3, 'work', 'staff'), S(3.6, 1.6, 3, 'work', 'staff'), S(5.6, 4.2, 3));
    return out(c, w, d, { music: 'cafe', floor: GT.f_tile, floors: [{ x0: 0, y0: 3, x1: w, y1: 7, floor: GT.f_wood }], wall: { color: c.wall, trim: c.acc, rail: 1.1 }, exits: [{ x: 6, y: 6.5 }] });
  },
  // ---------------------------------------------------------------- diner with an open kitchen line: 13x9 or 10x8
  diner(c) {
    const big = c.L === 0, w = big ? 13 : 10, d = big ? 9 : 8, bc = c.pick(['#2f8f8a', '#c0563a', '#3c64ad']);
    c.add(WX('bar.neon', 2.7, { kind: 'text', text: c.sign, c: c.neon, c2: c.neon2 }, 1), WX('generic.window', 4.5));
    if (big) { c.add(WY('kitchen.walkin', .5), WY('generic.clock', 8.6), WY('generic.exit', 11.6), WX('generic.window', 7),
      V('kitchen.range', 2.5, 0), V('kitchen.grill', 4, 0), V('kitchen.fryer', 5.5, 0), V('kitchen.prep', 6.5, 0), V('kitchen.dishpit', 9, 0), V('kitchen.shelf', 11.5, 0),
      V('kitchen.pass', .5, 2.5, null, { n: 'staff' }), V('diner.counter', 3, 2.5, { w: 5 }, { n: 'seats staff', ns: 3 }), V('diner.jukebox', 11.5, 2.5, null, { n: 'use' }),
      V('diner.booth', .5, 5, null, { n: 'seats', ns: 2 }), V('diner.booth', 3, 5, { c: bc }, { n: 'seats', ns: 1 }), V('diner.booth', .5, 7.5, { c: bc }, { n: 'seats', ns: 1 }), V('diner.booth', 3, 7.5, null),
      V('diner.table', 9.5, 5, { check: true }, { n: 'seats' }), V('diner.table', 9.5, 7.5, { check: true }, { n: 'seats', ns: 1 }), V('generic.coatrack', 12.5, 8.5), V('cornerstore.gumball', 6, 5));
      c.npc.push(S(4.75, 1.5, 3, 'work', 'staff'), S(7.5, 1.5, 3, 'work', 'staff'), S(1.5, 3.6, 3)); }
    else { c.add(WY('generic.clock', 7.4), V('kitchen.range', .5, 0), V('kitchen.grill', 2, 0), V('kitchen.prep', 3.5, 0), V('kitchen.dishpit', 5.5, 0), V('kitchen.shelf', 8, 0),
      V('diner.counter', .5, 2.5, { w: 5 }, { n: 'seats staff', ns: 3 }), V('kitchen.pass', 6, 2.5, null, { n: 'staff' }), V('diner.jukebox', 8.5, 2.5, null, { n: 'use' }),
      V('diner.booth', .5, 5.5, null, { n: 'seats', ns: 2 }), V('diner.booth', 3, 5.5, { c: bc }, { n: 'seats', ns: 1 }), V('diner.table', 7, 5.5, { check: true }, { n: 'seats' }), V('cornerstore.gumball', 9.5, 7.5));
      c.npc.push(S(2.75, 1.5, 3, 'work', 'staff'), S(7, 3.8, 3)); }
    return out(c, w, d, { music: 'cafe', floor: GT.f_check, floors: [{ x0: 0, y0: 0, x1: w, y1: 2.5, floor: GT.f_tile }], wall: { color: c.pick(['#9fd0c8', '#f0c8c0', '#c8d8f0', '#f0e0a8']), pattern: 'tile', trim: '#d5dbe0', rail: 1.1 }, exits: [{ x: big ? 7 : 5.5, y: d - .5 }] });
  },
  // ---------------------------------------------------------------- counter-service eatery (taqueria, pho, falafel, ...): 9x7 or 10x8
  eatery(c) {
    const big = c.L === 1, w = big ? 10 : 9, d = big ? 8 : 7, as = !!ASIAN[c.kind], tbl = as ? 'diner.table' : c.pick(['cafe.tableset', 'restaurant.table', 'diner.table']);
    c.add(WY('cafe.menu', 6, { name: c.sign, b: c.pick(['#8a2a2a', '#2a2733', '#2f4a3a', '#2f3a5a']) }), WX('bar.neon', 2.7, { kind: 'text', text: c.sign, c: c.neon, c2: c.neon2 }, 1), WX('generic.window', 4.4));
    c.add(V('kitchen.range', .5, 0, SOUP[c.kind] ? { soup: SOUP[c.kind] } : null), V('kitchen.prep', 2, 0), V(c.pick(['kitchen.grill', 'kitchen.fryer']), 4, 0), V('bakery.sacks', w - 1.5, 0),
      V('pizza.counter', .5, 2.5, null, { n: 'staff use' }), V('kitchen.pass', 3, 2.5, null, { n: 'staff' }), V('cafe.condiments', w - 1.5, 2.5));
    const tp = () => (tbl === 'cafe.tableset' ? { c: '#f1ede4', cc: c.acc } : tbl === 'diner.table' ? (as ? { c: '#5a3a28', tc: '#a8703c' } : { check: c.r() < .5 }) : null);
    const xs = big ? [.5, 3.5, 7.5] : [.5, 3.5, 6.5]; xs.forEach((x, i) => { c.add(V(tbl, x, 4.5, tp(), { n: 'seats', ns: i === 1 ? 1 : 2 })); if (as) c.add(V('ramen.lantern', x + .75, 4.75, i % 2 ? { c: c.acc } : null)); });
    if (big) { c.add(V(tbl, .5, 6.5, tp(), { n: 'seats', ns: 1 }), V(tbl, 7.5, 6.5, tp(), { n: 'seats' })); c.plant(9.5, 3.5); }
    c.npc.push(S(1.7, 3.7, 3), S(4, 3.7, 3), S(1.5, 1.6, 3, 'work', 'staff'));
    return out(c, w, d, { music: as ? 'quiet' : 'cafe', floor: as ? GT.f_darkwood : c.pick([GT.f_tile, GT.f_wood, GT.f_check]), floors: [{ x0: 0, y0: 0, x1: w, y1: 2.5, floor: as ? GT.f_stone : GT.f_tile }],
      wall: { color: c.wall, pattern: as ? 'planks' : c.pick(['plain', 'tile', 'plain']), trim: c.acc, rail: 1 }, exits: [{ x: big ? 5 : 4.5, y: d - .5 }] });
  },
  // ---------------------------------------------------------------- sit-down restaurant with a host stand: 12x9 or 10x9
  restaurant(c) {
    const big = c.L === 0, w = big ? 12 : 10, d = 9, xs = big ? [1, 5, 9] : [.5, 4, 7.5], cloth = c.pick(['#f1ede4', '#f4e4d0', '#e8d0d0']);
    c.add(V('restaurant.winerack', .5, 0), V('restaurant.winerack', 2.5, 0, { seed: 4 }), WY('generic.door', big ? 6 : 5, { kind: 'staff' }), WX('generic.window', 2.5), WX('generic.window', 5.5)); c.decor('y', big ? [7.6, 9.8] : [6.8]); c.neonSign('x', .8);
    let k = 0; for (const y of [2, 4.5]) for (const x of xs) { c.add(V('restaurant.table', x, y, { c: cloth }, { n: 'seats', ns: (k++ % 3) ? 2 : 1 }), V('generic.pendant', x + .75, y + .25)); }
    c.add(V('restaurant.table', xs[0], 7, { c: cloth }, { n: 'seats' }), V('restaurant.table', xs[2], 7, { c: cloth }, { n: 'seats', ns: 1 }), V('restaurant.host', big ? 4 : 3, 7.5, null, { n: 'staff use' })); c.plant(w - .5, 0); c.plant(big ? 7.5 : 6.5, 8.5);
    return out(c, w, d, { music: 'quiet', floor: c.pick([GT.f_darkwood, GT.f_carpet, GT.f_wood]), wall: { color: c.pick(['#e8d8c0', '#d8c8b8', '#e4d0c8', '#d0d8d0']), trim: c.pick(['#5a3a3a', '#3a3a5a', '#4a3a28']), rail: 1.2, h: 3 }, exits: [{ x: w / 2, y: 8.5 }] });
  },
  // ---------------------------------------------------------------- bar / pub: 11x9 or 9x8
  bar(c) {
    const big = c.L === 0, w = big ? 11 : 9, d = big ? 9 : 8, CK = { n: 'staff use', tags: ['checkout'] };
    c.add(WX('bar.dartboard', 2.2), WX('bar.neon', 5, { kind: 'text', text: c.sign, c: c.neon, c2: c.neon2 }, 1.1), WY('bar.neon', big ? 7.2 : 5.5), V('bar.backbar', .5, 0), V('bar.counter', .5, 1.5, null, CK));
    if (big) c.add(V('bar.backbar', 3.5, 0, { seed: 5 }), V('bar.counter', 3.5, 1.5, null, { n: 'staff' }), V('bar.glasswasher', 6.5, 1.5), V('bar.stool', 1, 2.5, null, { n: 'seats' }), V('bar.stool', 2.5, 2.5, null, { n: 'seats' }), V('bar.stool', 4, 2.5), V('bar.stool', 5.5, 2.5, null, { n: 'seats' }),
      V('bar.booth', 0, 4, null, { n: 'seats', ns: 2 }), V('bar.booth', 0, 6.5, null, { n: 'seats', ns: 2 }), V('bar.hightable', 4, 4.5, null, { n: 'seats', ns: 1 }), V('bar.hightable', 4, 6.5, null, { n: 'seats', ns: 1 }), V('bar.pool', 7, 4.5), V('diner.jukebox', 9.5, 0, null, { n: 'use' }), V('bar.speaker', 10.5, 2.5));
    else c.add(V('bar.glasswasher', 3.5, 1.5), V('bar.stool', 1, 2.5, null, { n: 'seats' }), V('bar.stool', 2.5, 2.5, null, { n: 'seats' }), V('bar.stool', 4, 2.5),
      V('bar.booth', 0, 4, null, { n: 'seats', ns: 2 }), V('bar.booth', 0, 6.5, null, { n: 'seats', ns: 2 }), V('bar.hightable', 4, 4.5, null, { n: 'seats', ns: 1 }), V('bar.hightable', 6.5, 4.5, null, { n: 'seats' }), V('diner.jukebox', 7.5, 0, null, { n: 'use' }));
    c.npc.push(S(big ? 8 : 6, 3.4, 2), S(big ? 6 : 5.5, 6.2, 1, 'dance'));
    return out(c, w, d, { music: 'bar', floor: GT.f_darkwood, wall: { color: c.pick(DARKS), pattern: c.pick(['brick', 'planks', 'brick']), trim: '#2a1f38', rail: 1, h: 3 }, exits: [{ x: big ? 7 : 5.5, y: d - .5 }] });
  },
  // ---------------------------------------------------------------- boutique / thrift: 10x8 or 8x7
  boutique(c) {
    const big = c.L === 0, w = big ? 10 : 8, d = big ? 8 : 7, th = c.kind === 'thrift', sd = () => ({ seed: 1 + Math.floor(c.r() * 9) });
    c.add(V('generic.rug', big ? 3.5 : 3, big ? 5.8 : 4.8, { c: c.acc }), V('clothing.shelves', .5, 0, sd()), V('clothing.shelves', 2.5, 0, sd()), V('clothing.fitting', w - 1.5, 0, null, { n: 'use' }), V('clothing.counter', w - 3, 2, null, { n: 'staff use' }),
      V('clothing.rack', .5, 2.5, sd(), { n: 'use' }), V('clothing.rack', .5, 4.5, sd()), WX('home.wall.mirror', 3.3)); c.decor('x', [d - 2.6]);
    if (big) { c.add(WY('clothing.shoewall', 5.2), V('clothing.roundrack', 3.5, 2.5, sd(), { n: 'use' }), V(th ? 'clothing.rack' : 'clothing.foldtable', 3.5, 4.5, sd(), { n: 'use' }), V('clothing.mannequin', 6.5, 4.5), V('clothing.pouf', 7, 6, null, { n: 'seats', ns: 1 }), V('clothing.mirror', 9.5, 4), V('clothing.mannequin', .5, 6.5), V(th ? 'books.piles' : 'clothing.accessories', 9.5, 6.5)); c.npc.push(S(5.5, 3.6, 2), S(2, 6.6, 3)); }
    else { c.add(WY('generic.picture', 4.8, { kind: 2, c: c.acc }), V('clothing.roundrack', 3.5, 3.5, sd(), { n: 'use' }), V('clothing.mannequin', 7, 4.5), V('clothing.pouf', 6, 5.5, null, { n: 'seats', ns: 1 }), V(th ? 'books.piles' : 'clothing.accessories', 7.5, 6.5)); c.npc.push(S(5, 4, 2), S(2.2, 6, 3)); }
    return out(c, w, d, { music: 'shop', floor: th ? GT.f_wood : c.pick([GT.f_wood, GT.f_carpet, GT.f_darkwood]), wall: { color: c.wall, trim: c.acc, rail: th ? 1 : 0 }, exits: [{ x: big ? 5 : 4.5, y: d - .5 }] });
  },
  // ---------------------------------------------------------------- bookshop / record shop / comics: 8x8 or 10x7
  books(c) {
    const big = c.L === 1, w = big ? 10 : 8, d = big ? 7 : 8, rec = c.kind === 'records', com = c.kind === 'comics', sd = () => ({ seed: 1 + Math.floor(c.r() * 9) }), tx = w - 2.5;
    c.add(V('generic.rug', tx - .5, big ? 3.3 : 3.8, { c: c.acc }), V('books.shelf', .5, 0, sd()), V('books.shelf', 2.5, 0, sd()), big ? V('books.shelf', 4.5, 0, sd()) : null, V('bookstore.till', tx, 1.5, null, { n: 'staff use' }),
      V(com ? 'cornerstore.magrack' : 'books.shelf', 0, 2.5, sd(), { flip: true, n: 'use' }), V(rec ? 'books.lowshelf' : 'books.shelf', 0, big ? 4.5 : 5, sd(), { flip: true }));
    if (rec) { c.neonSign('y', big ? 7 : 5.2, 'VINYL'); c.add(WX('home.wall.poster', 1.2), WX('home.wall.poster', 2.2)); } else c.decor('y', [big ? 7 : 5.2], WY('home.wall.shelf', big ? 7.5 : 5.7));
    const ex = (x, y) => c.add(rec ? V('diner.jukebox', x, y, null, { n: 'use' }) : com ? V('cornerstore.magrack', x, y, sd(), { n: 'use' }) : V('library.cart', x, y));
    if (!big) { c.add(V('bookstore.table', 2.5, 3, sd(), { n: 'use' }), V('books.lowshelf', 2.5, 5, sd(), { n: 'use' }), V('cafe.armchair', 6, 4, { c: c.acc2 }, { n: 'seats' }), V('generic.floorlamp', 7.5, 4), V('bookstore.spinner', 7.5, 6), V('books.piles', 7.5, 7.5)); ex(5.5, 6); if (rec) c.add(V('bar.speaker', .5, 7.5)); c.npc.push(S(4, 6.3, 3), S(1.2, 4.7, 2)); }
    else { c.add(V('bookstore.table', 3, 3, sd(), { n: 'use' }), V('books.lowshelf', 3, 5, sd(), { n: 'use' }), V('cafe.armchair', 7.5, 3.5, { c: c.acc2 }, { n: 'seats' }), V('generic.floorlamp', 9, 3.5), V('bookstore.spinner', 6, 3.5), V('books.piles', 9.5, 6.5)); ex(7.5, 5.5); if (rec) c.add(V('bar.speaker', 9.5, 0)); c.npc.push(S(1.5, 5.5, 2), S(6.4, 5, 0)); }
    return out(c, w, d, { music: rec ? 'bar' : 'quiet', floor: c.pick([GT.f_wood, GT.f_darkwood]), wall: { color: rec ? c.pick(DARKS) : c.wall, trim: c.acc, rail: 0, pattern: rec ? 'brick' : 'plain' }, exits: [{ x: big ? 5.5 : 4, y: d - .5 }] });
  },
  // ---------------------------------------------------------------- bodega / mini mart: 7x6 or 8x7
  bodega(c) {
    const big = c.L === 1, w = big ? 8 : 7, d = big ? 7 : 6;
    c.add(WY('bar.neon', big ? 7.2 : 6.1, { kind: 'text', text: 'OPEN', c: c.neon, c2: c.neon2 }, 1), WX('generic.picture', 1.6, { kind: 1, c: '#2a2733' }), WX('generic.clock', 5.2),
      V('cornerstore.backshelf', .5, 0), V('cornerstore.fridge', 3, 0, null, { n: 'use' }), V('cornerstore.fridge', 4, 0, { name: 'TEA', hc: '#2f8f8a', seed: 6 }), V('cornerstore.counter', .5, 1.5, null, { n: 'staff use' }),
      V('cornerstore.magrack', 0, 3, { seed: 3 }, { flip: true, n: 'use' }));
    if (!big) { c.add(V('cornerstore.atm', 5.5, 0), V('cornerstore.shelf', 3.5, 2.5, null, { n: 'use' }), V('cornerstore.magrack', 5, 2.5), V('cornerstore.icecream', .5, 4.5), V('cornerstore.slushie', 5.5, 4.5, null, { n: 'use' }), V('cornerstore.gumball', 6.5, 5.5)); c.npc.push(S(5.75, 1.2, 3), S(4.2, 3.6, 3), S(2, 3.6, 3)); }
    else { c.add(V('cornerstore.fridge', 5, 0, { name: 'SODA', hc: '#c0392b', seed: 9 }), V('cornerstore.atm', 6.5, 0), V('cornerstore.slushie', 7, 0), V('cornerstore.shelf', 3.5, 2.5, null, { n: 'use' }), V('cornerstore.shelf', 5.5, 2.5, { seed: 4 }),
      V('cornerstore.shelf', 3.5, 4.5, { seed: 7 }, { n: 'use' }), V('grocery.produce', 5.5, 4.5, { items: ['apple', 'banana', 'tomato', 'onion', 'potato', 'lemon', 'orange', 'carrot'] }, { n: 'use' }), V('cornerstore.icecream', .5, 5), V('cornerstore.gumball', 7.5, 6.5)); c.npc.push(S(2, 3.6, 3), S(6, 1.3, 3)); }
    return out(c, w, d, { music: 'shop', floor: GT.f_lino, wall: { color: c.wall, trim: c.pick(['#3f8a55', '#c0392b', '#3c64ad', '#d8a03a']), rail: 1.2 }, exits: [{ x: big ? 2.5 : 3.2, y: d - .5 }] });
  },
  // ---------------------------------------------------------------- medium neighbourhood grocery: 11x9 or 12x10
  grocery_m(c) {
    const big = c.L === 1, w = big ? 12 : 11, d = big ? 10 : 9, g = c.pick(['#3f8a55', '#c0563a', '#3c64ad', '#8a5a3a']), rx = big ? 9 : 8.5, cy = big ? 8 : 6.5;
    const G_ = (x, y, kind, name, hc, seed, n) => V('grocery.gondola', x, y, { kind, name, hc, seed }, n ? { n: 'use' } : null);
    c.add(WY('generic.clock', 6.4), WX('generic.window', 7), WX('generic.picture', .8, { kind: 0 }),
      V('grocery.fridge', .5, 0, { kind: 'dairy', name: 'DAIRY' }, { n: 'use' }), V('grocery.fridge', 2.5, 0, { kind: 'drinks', name: 'DRINKS', hc: '#e8843a', seed: 3 }), V('grocery.fridge', 4.5, 0, { kind: 'frozen', name: 'FROZEN', hc: '#3c64ad', seed: 7 }),
      V('grocery.bakery', 7, 0, null, { n: 'use' }), V('grocery.crates', 9, 0), V('grocery.crates', 10, 0),
      V('grocery.produce', 0, 2, { items: ['apple', 'orange', 'banana', 'lime', 'lemon', 'pear', 'grape', 'apple'], big: 'melon' }, { flip: true, n: 'use' }), V('grocery.produce', 0, 4.5, { items: ['lettuce', 'tomato', 'carrot', 'eggplant', 'potato', 'pepper', 'onion', 'broc'] }, { flip: true }),
      G_(3, 2.5, 'cereal', 'CEREAL', '#e8843a', 1, 1), G_(5, 2.5, 'cereal', 'SNACKS', '#c0392b', 5), G_(3, 4.5, 'drinks', 'PANTRY', '#8a5a3a', 11), G_(5, 4.5, 'cereal', 'PASTA', '#d8a03a', 13, 1),
      G_(rx, 2.5, 'drinks', 'JUICE', g, 9, 1), V('grocery.freezer', rx, 4.5, { seed: 3 }, { n: 'use' }), V('grocery.aislesign', 4, 3.5, { n: 1, a: 'CEREAL', b: 'PASTA', c: g }),
      V('grocery.checkout', 2, cy, null, { n: 'staff use' }));
    if (big) c.add(G_(3, 6.5, 'cereal', 'HOME', '#7a55b0', 15), G_(5, 6.5, 'drinks', 'CARE', '#2f8f8a', 17, 1), V('grocery.checkout', 5.5, cy, null, { n: 'staff use' }), V('grocery.promo', 9, 6.5), V('grocery.flowers', 10.5, 6.5, null, { n: 'use' }), V('grocery.baskets', 11.5, 8.5), V('grocery.crates', 11, .5));
    else c.add(V('grocery.promo', 5.5, 6.5), V('grocery.flowers', 9.5, 6.5, null, { n: 'use' }), V('grocery.baskets', 10.5, 8));
    c.npc.push(S(2, 3.6, 0), S(7.6, 3.6, 0), S(big ? 8.2 : 7.6, 6, 3));
    return out(c, w, d, { music: 'shop', floor: GT.f_lino, floors: [{ x0: 0, y0: 2, x1: 1.5, y1: 6.5, floor: GT.f_wood }], wall: { color: c.pick(['#e8e4d0', '#f0e8d8', '#e4ecd8']), trim: g, rail: 2.3, h: 3 }, exits: [{ x: big ? 9.5 : 7.5, y: d - .5 }] });
  },
  // ---------------------------------------------------------------- general retail with themed shelves: 9x7 or 10x8
  retail(c) {
    const big = c.L === 1, w = big ? 10 : 9, d = big ? 8 : 7, sd = () => 1 + Math.floor(c.r() * 9);
    const K = ({
      hardware: { back: ['homegoods.techshelf', 'clothing.shelves', 'homegoods.techshelf'], mid: ['homegoods.demotable', 'homegoods.appliance'], small: ['homegoods.kiosk', 'generic.bin', 'books.piles'], side: 'cornerstore.shelf' },
      pets: { back: ['clothing.shelves', 'bakery.shelves', 'cornerstore.backshelf'], mid: ['clothing.foldtable', 'grocery.promo'], small: ['home.plant.fiddle', 'cornerstore.gumball', 'generic.plant'], side: 'cornerstore.shelf' },
      toys: { back: ['clothing.shelves', 'books.lowshelf', 'clothing.shelves'], mid: ['bookstore.table', 'homegoods.plinth'], small: ['cornerstore.gumball', 'bookstore.spinner', 'library.globe'], side: 'books.lowshelf' },
      florist: { back: ['bakery.shelves', 'clothing.shelves', 'grocery.flowers'], mid: ['clothing.foldtable', 'homegoods.plinth'], small: ['home.plant.monstera', 'home.plant.fiddle', 'home.plant.snake'], side: 'grocery.flowers', flowers: 1 },
      pharmacy: { back: ['cornerstore.backshelf', 'grocery.fridge', 'clothing.shelves'], mid: ['grocery.gondola', 'cornerstore.shelf'], small: ['clothing.accessories', 'bookstore.spinner', 'generic.plant'], side: 'cornerstore.shelf' },
      stationery: { back: ['books.shelf', 'books.lowshelf', 'clothing.shelves'], mid: ['bookstore.table', 'clothing.foldtable'], small: ['bookstore.spinner', 'library.globe', 'books.piles'], side: 'cornerstore.magrack' },
      art: { back: ['clothing.shelves', 'books.lowshelf', 'homegoods.techshelf'], mid: ['homegoods.demotable', 'homegoods.plinth'], small: ['clothing.mannequin', 'books.piles', 'generic.plant'], side: 'books.lowshelf' },
      gallery: { back: [], mid: ['homegoods.plinth', 'homegoods.plinth'], small: ['generic.plant', 'generic.floorlamp', 'home.plant.snake'], side: null, pics: 1 },
      cheese: { back: ['grocery.fridge', 'bakery.shelves', 'restaurant.winerack'], mid: ['grocery.produce', 'cafe.pastrycase'], small: ['generic.plant', 'home.plant.cactus', 'cornerstore.gumball'], side: 'bakery.shelves' },
    })[c.kind] || { back: ['clothing.shelves', 'books.lowshelf', 'clothing.shelves'], mid: ['clothing.foldtable', 'homegoods.plinth'], small: ['generic.plant', 'bookstore.spinner', 'books.piles'], side: 'books.lowshelf' };
    const P = id => (id === 'grocery.fridge' ? { kind: c.kind === 'cheese' ? 'dairy' : 'drinks', name: c.kind === 'cheese' ? 'CHEESE' : 'COLD', seed: sd() } : id === 'grocery.gondola' ? { kind: 'drinks', name: 'CARE', hc: '#2f8f8a', seed: sd() } : id === 'grocery.produce' ? { items: ['pear', 'grape', 'apple', 'lemon', 'pear', 'grape', 'apple', 'lemon'] } : { seed: sd(), c: c.acc });
    K.back.forEach((id, i) => c.add(V(id, .5 + i * 2, 0, P(id), i === 1 ? { n: 'use' } : null)));
    if (K.pics) { c.add(WY('generic.picture', .6, { kind: 0, w: 1.5 }), WY('generic.picture', 2.8, { kind: 3, w: 1.5, c: c.acc }), WY('home.wall.art', 5), WX('generic.picture', 2.6, { kind: 1, w: 1.5 }), WX('home.wall.art', 4.8), V('generic.bench', 2, 5.5, null, { n: 'seats' })); }
    else { c.neonSign('x', 5, c.sign.slice(0, 8)); if (big) c.add(WY('generic.window', 7.2)); }
    c.add(V('clothing.counter', w - 2.5, 1.5, null, { n: 'staff use' }), K.side ? V(K.side, 0, 2.5, P(K.side), { flip: true, n: 'use' }) : null, V(K.mid[0], 1.5, 3, P(K.mid[0]), { n: 'use' }), V(K.mid[1], 5, 4, P(K.mid[1]), { n: 'use' }));
    c.add(V(K.small[0], w - 1, 4.5, P(K.small[0])), V(K.small[1], .5, d - 1, P(K.small[1])), V(K.small[2], w - 1, d - 1, P(K.small[2])));
    if (K.flowers) c.add(V('grocery.flowers', 1.5, 5, null, { n: 'use' }), V('grocery.flowers', 6.5, 5.5));
    if (big && !K.pics && !K.flowers) c.add(V(K.back[1] === 'grocery.fridge' ? 'cornerstore.shelf' : K.back[1], 1.5, 5.5, P(K.back[1]), { n: 'use' }));
    c.npc.push(S(w - 1.5, 3.2, 3), S(4.2, 3.2, 2), S(4.4, 5.6, 1));
    return out(c, w, d, { music: c.kind === 'gallery' ? 'quiet' : 'shop', floor: c.kind === 'gallery' ? GT.f_concrete : c.pick([GT.f_wood, GT.f_lino, GT.f_tile, GT.f_wood]), wall: { color: c.kind === 'gallery' ? '#f1efe8' : c.wall, trim: c.kind === 'gallery' ? '#3a3644' : c.acc, rail: 0 }, exits: [{ x: big ? 5 : 4.5, y: d - .5 }] });
  },
  // ---------------------------------------------------------------- service room (barber, salon, nail bar, tattoo, laundromat): 8x7 or 9x7
  service(c) {
    const big = c.L === 1, w = big ? 9 : 8, d = 7, k = c.kind;
    c.add(V('clothing.counter', w - 2.5, 1.5, null, { n: 'staff use' }), V('generic.sofa', .5, 4.5, { c: c.acc }, { n: 'seats' }), V('cafe.lowtable', 3, 4.5), V('cornerstore.magrack', w - 1.5, 4.5, { seed: 2 }, { n: 'use' }), WX('generic.window', 2.4)); c.plant(w - .5, 6.5); c.plant(.5, 6.5); c.neonSign('x', 5, c.sign.slice(0, 8));
    if (k === 'laundry') { for (let i = 0; i < 5; i++) c.add(V('homegoods.appliance', .5 + i, 0, { kind: 'washer', c: i % 2 ? '#e8e4d8' : '#d5dbe0' }, i === 1 || i === 3 ? { n: 'use' } : null)); c.add(V('clothing.foldtable', 1.5, 2.5, null, { n: 'use' }), V('generic.vending', w - 1.5, 0, null, { n: 'use' }), V('generic.bin', 4.5, 2.5)); }
    else if (k === 'nails') { c.add(WY('home.wall.mirror', 1), WY('home.wall.photos', 3), V('cafe.tableset', .5, 1, { c: '#f1ede4', cc: c.acc }, { n: 'seats' }), V('cafe.tableset', 3, 1, { c: '#f1ede4', cc: c.acc2 }, { n: 'seats', ns: 1 }), V('clothing.accessories', 5, 0)); }
    else if (k === 'tattoo') { c.add(WY('home.wall.poster', .6), WY('home.wall.poster', 1.6), WY('home.wall.art', 2.8), WY('home.wall.poster', 4.2), V('cafe.armchair', 1, .5, { c: '#2a2733' }, { n: 'seats' }), V('generic.floorlamp', 2.5, .5), V('generic.bench', 3.5, .5, null, { n: 'seats', ns: 1 }), V('books.piles', 5, 0)); }
    else { c.add(WY('home.wall.mirror', 1), WY('home.wall.mirror', 3), V('cafe.armchair', 1, .5, { c: k === 'barber' ? '#8a2a2a' : c.acc }, { n: 'seats' }), V('cafe.armchair', 3, .5, { c: k === 'barber' ? '#8a2a2a' : c.acc2 }, { n: 'seats' }), V('clothing.mirror', 4.5, 0), V('clothing.accessories', 5.5, 0)); }
    c.npc.push(S(2, 2.2, 3, 'work', 'staff'), S(5, 3.4, 0), S(w - 1.5, 3, 3));
    return out(c, w, d, { music: k === 'tattoo' ? 'bar' : 'shop', floor: k === 'laundry' ? GT.f_lino : c.pick([GT.f_check, GT.f_tile, GT.f_wood]), wall: { color: k === 'tattoo' ? c.pick(DARKS) : c.wall, trim: c.acc, rail: 1, pattern: k === 'laundry' ? 'tile' : 'plain' }, exits: [{ x: w / 2, y: 6.5 }] });
  },
};
export const TEMPLATES = Object.keys(T);
export function genericRoom(tpl, seed, o = {}) { const c = ctx(seed, o), def = (T[tpl] || T.retail)(c); def.pub = { tpl: T[tpl] ? tpl : 'retail', kind: c.kind, layout: c.L }; return def; }
