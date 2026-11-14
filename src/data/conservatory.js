// conservatory.js — venue records, stock, plant facts and butterflies for the Maple Bay Botanical Conservatory (room 'conservatory').
// Registered additively at import time (same pattern as venues_showpiece.js): VENUE_BY_ID gets 'conservatory' (the place itself: hours, blurb),
// 'conservatory:gifts' (Garden Gifts) and 'conservatory:cafe' (The Glasshouse Cafe); ITEMS / ITEM_BY_ID get the `cons_*` items; MOODLETS gets 'green_calm'.
//   CONS_HOURS [open, close]   CONS_TICKET ($)   CONS_VENUES { place, gifts, cafe }   SEEDLINGS [itemId]   CONS_VIS { itemId: { a, p } } (merge into housing VIS)
//   FACTS [{ id, zone, title, text }] (the plaque collection)   BUTTERFLIES [{ id, name, c, c2, note }]   TOUR_TIMES [hours]   NEW_ITEM_IDS
import './venues_extra.js';
import { VENUE_BY_ID } from './venues.js';
import { ITEMS, ITEM_BY_ID, DISHES, HOMEGOODS, GIFTS, MISC } from './items.js';
import { MOODLETS } from './needs.js';

export const CONS_HOURS = [9, 19], CONS_TICKET = 4, TOUR_TIMES = [10, 13, 16];
export const CONS_VENUES = { place: 'conservatory', gifts: 'conservatory:gifts', cafe: 'conservatory:cafe' };
const DAILY = (o, c) => [0, 1, 2, 3, 4, 5, 6].map(() => [o, c]);
const venue = (id, name, type, offers, blurb) => (VENUE_BY_ID[id] = VENUE_BY_ID[id] || { id, name, type, district: 'park', where: 'Central Park, in the glass palm house', station: null, interior: true, hours: DAILY(CONS_HOURS[0], CONS_HOURS[1]), offers, priceMult: 1, jobId: null, delivers: false, blurb, showpiece: true });
venue(CONS_VENUES.place, 'Maple Bay Botanical Conservatory', 'leisure', { functions: [] }, 'A Victorian glass palm house in Central Park: jungle, desert, orchids, butterflies and a koi pond, all under one roof.');
venue(CONS_VENUES.gifts, 'Garden Gifts', 'shop', { shop: ['homegood', 'gift', 'misc'], functions: ['till'] }, 'Seedlings, seeds and small green souvenirs by the conservatory door.');
venue(CONS_VENUES.cafe, 'The Glasshouse Cafe', 'food', { menu: true, functions: ['seat', 'till'] }, 'Tea and cake among the ferns. The hibiscus iced tea is the colour of a sunset.');

if (!MOODLETS.green_calm) MOODLETS.green_calm = { name: 'Green & Calm', desc: 'Time among the leaves. Everything is a little quieter.', mood: 6, workPerf: 1, walkSpeed: 1, minutes: 240, source: 'activity' };

const GF = [CONS_VENUES.gifts], CF = [CONS_VENUES.cafe];
const plant = (id, name, price, tier, amb, icon) => ({ id, name, category: 'homegood', price, icon, effects: {}, stack: 1, soldAt: GF, tag: 'plant', tier, footprint: [1, 1], placement: 'floor', bonus: { mult: [1, 1.15, 1.3][tier], ambience: amb }, seedling: true });
const gift = (id, name, price, icon, relationship, giftTags) => ({ id, name, category: 'gift', price, icon, effects: {}, stack: 3, soldAt: GF, relationship, giftTags });
const dish = (id, name, price, effects, eatMinutes, course, icon) => ({ id, name, category: 'dish', price, icon, effects, stack: 1, soldAt: CF, venue: CF[0], eatMinutes, course, takeaway: false });
const NEW = [
  plant('cons_seed_orchid', 'Moth Orchid', 22, 1, 2, 'white orchid spray, cream pot'),
  plant('cons_seed_palm', 'Parlour Palm Seedling', 14, 0, 1, 'small feathery palm, terracotta pot'),
  plant('cons_seed_barrel', 'Golden Barrel Cactus', 12, 0, 1, 'round ribbed cactus, navy pot'),
  plant('cons_seed_flytrap', 'Venus Flytrap', 16, 1, 2, 'green jaws with red mouths, small pot'),
  plant('cons_seed_birdsnest', "Bird's Nest Fern", 18, 1, 2, 'glossy wavy fronds, cream pot'),
  gift('cons_gift_seeds', 'Wildflower Seed Packet', 4, 'paper seed packet, meadow print', 4, ['floral', 'green']),
  gift('cons_gift_postcards', 'Butterfly Postcards', 3, 'fan of postcards, blue butterfly', 3, ['cute']),
  gift('cons_gift_honey', 'Glasshouse Honey', 7, 'small hexagonal jar, gold lid', 6, ['sweet', 'homemade']),
  gift('cons_gift_koi', 'Plush Koi', 12, 'orange and white soft fish', 7, ['cute']),
  gift('cons_gift_print', 'Botanical Print', 14, 'framed drawing of a fern', 8, ['fancy', 'green']),
  { id: 'cons_sketchbook', name: 'Field Sketchbook', category: 'misc', price: 9, icon: 'green cloth sketchbook, pencil loop', effects: {}, stack: 1, soldAt: GF, note: 'Sketching at the conservatory goes a quarter faster with a proper book.' },
  dish('cons_hibiscus_tea', 'Hibiscus Iced Tea', 3.5, { fun: 6, energy: 4 }, 6, 'drink', 'tall glass, ruby red, ice'),
  dish('cons_flat_white', 'Greenhouse Flat White', 3.75, { energy: 12, fun: 3, caffeine: true }, 6, 'drink', 'small cup, fern latte art'),
  dish('cons_rose_cake', 'Rose & Pistachio Cake', 5, { hunger: 16, fun: 9 }, 10, 'dessert', 'pink slice, green crumbs'),
  dish('cons_shortbread', 'Lavender Shortbread', 3, { hunger: 9, fun: 5 }, 5, 'snack', 'two pale biscuits, purple flecks'),
  dish('cons_cucumber_sandwich', 'Cucumber Sandwiches', 6, { hunger: 28, fun: 3 }, 12, 'main', 'crustless triangles on a plate'),
  dish('cons_garden_bowl', 'Garden Salad Bowl', 8, { hunger: 38, fun: 4 }, 15, 'main', 'bowl of leaves, edible flowers'),
];
export const NEW_ITEM_IDS = NEW.map(i => i.id);
const LISTS = { homegood: HOMEGOODS, gift: GIFTS, misc: MISC, dish: DISHES };
for (const it of NEW) { if (ITEM_BY_ID[it.id]) continue; ITEMS.push(it); ITEM_BY_ID[it.id] = it; if (LISTS[it.category]) LISTS[it.category].push(it); }
export const SEEDLINGS = NEW.filter(i => i.seedling).map(i => i.id);
export const CONS_VIS = { cons_seed_orchid: { a: 'plant.cons_orchid', p: {} }, cons_seed_palm: { a: 'plant.cons_palm', p: {} }, cons_seed_barrel: { a: 'plant.cons_barrel', p: {} }, cons_seed_flytrap: { a: 'plant.cons_flytrap', p: {} }, cons_seed_birdsnest: { a: 'plant.cons_birdsnest', p: {} } };

export const FACTS = [
  { id: 'lily', zone: 'Lily Pool', title: 'Giant Water Lily — Victoria amazonica', text: 'Each pad grows up to three metres across and can carry a small child, thanks to ribs underneath like the beams of a bridge. The flower opens white on its first night, pink on its second, and then sinks.' },
  { id: 'coconut', zone: 'Palm House', title: 'Coconut Palm — Cocos nucifera', text: 'A coconut can float across an ocean for months and still sprout on the beach it lands on. Ours arrived by post in 1962 and has been sulking about the weather ever since.' },
  { id: 'banana', zone: 'Palm House', title: 'Banana — Musa', text: 'Not a tree at all: the "trunk" is rolled-up leaves, and the whole plant is technically a giant herb. Each stem fruits exactly once, then makes way for its pups.' },
  { id: 'cycad', zone: 'Palm House', title: 'Sago Cycad — Cycas revoluta', text: 'Cycads were already old when the dinosaurs arrived. This one adds a single ring of leaves a year, and is in absolutely no hurry.' },
  { id: 'treefern', zone: 'Orchid & Fern Grotto', title: 'Tree Fern — Dicksonia antarctica', text: 'The trunk is not wood but a tower of old roots. It drinks through its crown, so the gardeners water it from the top, like a very tall cup.' },
  { id: 'orchid', zone: 'Orchid & Fern Grotto', title: 'Moth Orchid — Phalaenopsis', text: 'In the wild it grows on tree bark with its roots in the air, sipping mist. An orchid seed is fine as dust and carries no food at all: it needs a fungus to feed it before it can sprout.' },
  { id: 'saguaro', zone: 'Desert House', title: 'Saguaro — Carnegiea gigantea', text: 'A saguaro grows its first arm at around seventy years old. The pleats let it swell like an accordion after rain, storing up to a tonne of water.' },
  { id: 'barrel', zone: 'Desert House', title: 'Golden Barrel & Agave', text: 'The barrel cactus leans slowly toward the sun and is nicknamed the compass cactus. The agave beside it flowers once, on a spike as tall as a lamp post, and then retires.' },
  { id: 'butterfly', zone: 'Butterfly Room', title: 'Blue Morpho — Morpho peleides', text: 'There is no blue pigment in a morpho wing. The colour is made by microscopic ridges that bounce blue light back, which is why it flashes on and off as the wings beat.' },
  { id: 'pupae', zone: 'Butterfly Room', title: 'The Emergence Case', text: 'Inside each chrysalis the caterpillar dissolves almost completely and rebuilds itself. New butterflies hang for an hour to pump up and dry their wings. Please do not tap the glass: they are busy.' },
  { id: 'koi', zone: 'Koi Garden', title: 'Nishikigoi — the Koi', text: 'Koi can live for fifty years and learn to recognise the person who feeds them. The big orange one is called Marmalade and is first to every meal. She has never once been late.' },
  { id: 'show', zone: 'Flower Show', title: 'The Seasonal Flower Show', text: 'Four shows a year: tulips in spring, sunflowers in summer, chrysanthemums in autumn and poinsettias with lights in winter. Twelve thousand bulbs go in by hand each November.' },
];
export const BUTTERFLIES = [
  { id: 'morpho', name: 'Blue Morpho', c: '#3a8af0', c2: '#1a3a70', note: 'Flashes like a signal lamp.' },
  { id: 'monarch', name: 'Monarch', c: '#f08a2a', c2: '#2a2733', note: 'Orange stained glass with black leading.' },
  { id: 'swallowtail', name: 'Tiger Swallowtail', c: '#f4d83a', c2: '#2a2733', note: 'Yellow, striped, with little tails.' },
  { id: 'cabbage', name: 'Cabbage White', c: '#f8f8f0', c2: '#8a8a94', note: 'Plain, cheerful, everywhere.' },
  { id: 'postman', name: 'Postman', c: '#e8483b', c2: '#2a2733', note: 'Black with a red sash. Visits the same flowers daily, like a round.' },
  { id: 'glasswing', name: 'Glasswing', c: '#c8f0e8', c2: '#7a5a4a', note: 'You can see straight through the wings.' },
  { id: 'atlas', name: 'Atlas Moth', c: '#b8663e', c2: '#f0d8a8', note: 'Not a butterfly. As big as a dinner plate. Sleeps all day.' },
  { id: 'emerald', name: 'Emerald Swallowtail', c: '#3ac878', c2: '#1f3a30', note: 'A green stripe that glitters when it turns.' },
];
