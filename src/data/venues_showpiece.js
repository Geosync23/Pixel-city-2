// venues_showpiece.js — venue records + stock for the two showpiece interiors (Maple Bay Galleria, SkyDeck at Beacon Tower).
// Every mall shop is its own venue record (same shape as data/venues.js entries) registered in VENUE_BY_ID only (they live inside ONE room, 'deptstore',
// and have no map poi of their own). Stock = existing catalogue items that fit + a first tranche of new goods (ids `mall_*`, SkyDeck `sky_*`).
//   MALL_SHOPS  [{ key, name, sign, venueId, kind (art flavour), c (brand colour), wall, floor: [pat, c, c2], blurb }] in bay order
//   FOOD_COURT  [{ venueId, name, sign, c }]      KIOSKS [{ kind, venueId | null, name }]      SKY_VENUES { bar, gifts }
//   MALL_VIS    { itemId: { a (furn.home.<a>), p, z? } }  -> merged into sim/housing.js VIS       MALL_LOOKS { outfitKey: spec overrides } -> merged into sim/wardrobe.js LOOKS
//   NEW_ITEM_IDS, NEW_BY_GROUP { plants, clothes, kicks, tech, toys, wheels, beauty, stationery, sky }
// Bikes and skateboards are category 'homegood' (tag 'decor', extra field vehicle: 'bike'|'skateboard'): they are delivered and kept in the apartment
// (visible furniture) until a riding system picks them up. Helmets are 'misc'. (There is no 'vehicle' item category in the shop/inventory code.)
import './venues_extra.js'; // first: the generic types' dishes/gifts must exist before we copy their stock
import { VENUE_BY_ID } from './venues.js';
import { ITEMS, ITEM_BY_ID, DISHES, HOMEGOODS, OUTFITS, GIFTS, MISC } from './items.js';

const DAILY = (o, c) => [0, 1, 2, 3, 4, 5, 6].map(() => [o, c]);
export const MALL_HOURS = [10, 21];
const venue = (id, name, type, offers, blurb, x) => (VENUE_BY_ID[id] = Object.assign({ id, name, type, district: 'downtown', where: 'inside Maple Bay Galleria, Downtown', station: null, interior: true, hours: DAILY(10, 21), offers, priceMult: 1, jobId: null, delivers: false, blurb, showpiece: true }, x));
const SHOP = cats => ({ shop: cats, functions: ['shelf', 'till'] }), FOOD = { menu: true, functions: ['seat', 'till'] };

export const MALL_SHOPS = [
  { key: 'fern', name: 'Fern & Frond', sign: 'FERN & FROND', kind: 'plants', c: '#3f8a55', wall: '#dfeeda', floor: ['plank', '#c99a66', '#a87c4c'], cats: ['homegood', 'gift'], blurb: 'A jungle in a shop unit. Mind the mister.' },
  { key: 'nest', name: 'Nest & Wire Home', sign: 'NEST & WIRE HOME', kind: 'home', c: '#b8763a', wall: '#efe2cc', floor: ['plank', '#d8b98a', '#b8966a'], cats: ['homegood'], blurb: 'Sofas you may sit on, beds you may not nap in.' },
  { key: 'pixel', name: 'Pixel Hut', sign: 'PIXEL HUT', kind: 'tech', c: '#2f3f72', fg: '#7df0a0', wall: '#27304a', floor: ['check', '#3a4258', '#2e3548'], cats: ['homegood'], blurb: 'Screens, consoles and things that go beep.' },
  { key: 'thread', name: 'Thread & Co. Outlet', sign: 'THREAD & CO. OUTLET', kind: 'clothes', c: '#b8342e', wall: '#f6ead8', floor: ['plank', '#e2d2b4', '#c4b08c'], cats: ['outfit'], blurb: 'Last season, this season, next season. Mostly on sale.' },
  { key: 'kicks', name: 'Kicks', sign: 'KICKS', kind: 'shoes', c: '#e8862c', wall: '#e8eef4', floor: ['check', '#f4f0e8', '#d8dde4'], cats: ['outfit', 'misc', 'gift'], blurb: 'Sneakers and sportswear. Try a lap of the shop.' },
  { key: 'bloom', name: 'Bloom Beauty', sign: 'BLOOM BEAUTY', kind: 'beauty', c: '#d86a8f', wall: '#f8dfe6', floor: ['diamond', '#f8eaee', '#eebccb'], cats: ['gift'], blurb: 'Mirrors, bulbs and a chair that spins. Haircuts while you wait.' },
  { key: 'paper', name: 'Paper Moon', sign: 'PAPER MOON', kind: 'books', c: '#5a4a8a', wall: '#e9d9bc', floor: ['plank', '#a8774a', '#8a5e38'], cats: ['book', 'gift', 'misc'], blurb: 'Books, pens and paper that smells like a fresh start.' },
  { key: 'toy', name: 'Toy Galaxy', sign: 'TOY GALAXY', kind: 'toys', c: '#7a55c8', fg: '#ffe9a0', wall: '#fbe9a8', floor: ['check', '#f8d070', '#5ab0e0'], cats: ['gift', 'misc'], blurb: 'Everything beeps, bounces or glows. Two arcade cabinets at the back.' },
  { key: 'wheel', name: 'Wheel House', sign: 'WHEEL HOUSE', kind: 'bikes', c: '#2f7f86', wall: '#d9e4ea', floor: ['plain', '#9aa4ae', '#8e98a4'], cats: ['homegood', 'misc'], blurb: 'Bikes, boards and lids. Free air for your tyres.' },
].map(s => Object.assign(s, { venueId: 'mall:' + s.key }));
for (const s of MALL_SHOPS) venue(s.venueId, s.name, 'shop', SHOP(s.cats), s.blurb);
export const FOOD_COURT = [
  { venueId: 'mall:boba', name: 'Tapioca Sky', sign: 'BOBA', c: '#8a5aa8', from: 'gen_eatery_boba' },
  { venueId: 'mall:kbbq', name: 'Seoul Ember Express', sign: 'K-BBQ', c: '#b8342e', from: 'gen_eatery_kbbq' },
  { venueId: 'mall:taco', name: 'La Mariposa Tacos', sign: 'TACOS', c: '#e8862c', from: 'gen_eatery_taqueria' },
];
for (const f of FOOD_COURT) venue(f.venueId, f.name, 'food', FOOD, 'Food court counter. Grab a tray, find a table.');
export const KIOSKS = [{ kind: 'pretzel', venueId: 'mall:pretzel', name: 'Twist & Salt Pretzels' }, { kind: 'cases', venueId: null, name: 'Case Closed Phone Cases' }, { kind: 'shades', venueId: null, name: 'Shady Business Sunglasses' }];
venue('mall:pretzel', 'Twist & Salt Pretzels', 'food', { menu: true, functions: ['till'] }, 'Warm pretzels from a cart. The smell does the selling.');
export const SKY_VENUES = { bar: 'skydeck:bar', gifts: 'skydeck:gifts' };
venue(SKY_VENUES.bar, 'Cloud Nine', 'food', FOOD, 'Drinks at 52 floors. The view is on the house.', { where: 'SkyDeck, Beacon Tower, level 52', hours: DAILY(9, 23) });
venue(SKY_VENUES.gifts, 'SkyDeck Gift Nook', 'shop', SHOP(['gift', 'homegood']), 'Proof you were up here.', { where: 'SkyDeck, Beacon Tower, level 52', hours: DAILY(9, 23) });

/* ---------- new goods ---------- */
const M = id => ['mall:' + id];
const hg = (id, name, price, at, tag, tier, footprint, placement, ambience, icon, x) => Object.assign({ id, name, category: 'homegood', price, icon, effects: {}, stack: 1, soldAt: at, tag, tier, footprint, placement, bonus: { mult: [1, 1.15, 1.3][tier], ambience } }, x);
const fit = (id, name, price, at, styles, icon, look, perk = {}) => ({ id, name, category: 'outfit', price, icon, effects: {}, stack: 1, soldAt: at, outfit: id, styles, perk, look });
const gift = (id, name, price, at, icon, relationship, giftTags) => ({ id, name, category: 'gift', price, icon, effects: {}, stack: 3, soldAt: at, relationship, giftTags });
const misc = (id, name, price, at, icon, note, x) => Object.assign({ id, name, category: 'misc', price, icon, effects: {}, stack: 1, soldAt: at, note }, x);
const dish = (id, name, price, at, effects, eatMinutes, course, icon) => ({ id, name, category: 'dish', price, icon, effects, stack: 1, soldAt: at, venue: at[0], eatMinutes, course, takeaway: false });
const plant = (id, name, price, tier, amb, icon) => hg('mall_plant_' + id, name, price, M('fern'), 'plant', tier, [1, 1], 'floor', amb, icon);
const V = (a, p, x) => Object.assign({ a, p: p || {} }, x);
export const MALL_VIS = {};
const vis = (item, v) => { MALL_VIS[item.id] = v; return item; };
const H0 = { hat: null, scarf: null };

const G_ = {
  plants: [
    vis(plant('monstera_baby', 'Baby Monstera', 18, 0, 1, 'small split-leaf plant, terracotta pot'), V('plant.monstera', { tier: 0, seed: 2 })),
    vis(plant('monstera', 'Monstera Deliciosa', 45, 1, 2, 'big split leaves, white pot'), V('plant.monstera', { tier: 1, seed: 5 })),
    vis(plant('monstera_xl', 'Swiss Cheese Giant', 120, 2, 3, 'huge split-leaf plant, woven basket'), V('plant.monstera', { tier: 2, seed: 9 })),
    vis(plant('fiddle_s', 'Fiddle Leaf Sprout', 30, 0, 1, 'thin stem, three big leaves'), V('plant.fiddle', { tier: 0, seed: 3 })),
    vis(plant('fiddle', 'Fiddle Leaf Fig', 75, 1, 2, 'tall plant, violin-shaped leaves'), V('plant.fiddle', { tier: 1, seed: 6 })),
    vis(plant('fiddle_xl', 'Fiddle Leaf Tree', 180, 2, 4, 'indoor tree, glossy leaves, brass pot'), V('plant.fiddle', { tier: 2, seed: 8 })),
    vis(plant('snake_s', "Mother-in-Law's Tongue", 16, 0, 1, 'short striped upright leaves'), V('plant.snake', { tier: 0, seed: 2 })),
    vis(plant('snake', 'Snake Plant Trio', 38, 1, 2, 'three striped spears, grey pot'), V('plant.snake', { tier: 1, seed: 4 })),
    vis(plant('snake_xl', 'Sansevieria Tower', 85, 2, 3, 'tall striped spears, stand'), V('plant.snake', { tier: 2, seed: 7 })),
    vis(plant('cactus', 'Tiny Cactus', 9, 0, 1, 'round cactus, pink flower'), V('plant.cactus', { tier: 0, kind: 'ball' })),
    vis(plant('cactus_tall', 'Saguaro Jr.', 34, 1, 2, 'two-armed cactus, clay pot'), V('plant.cactus', { tier: 1 })),
    vis(plant('cactus_gold', 'Golden Barrel Cactus', 60, 2, 3, 'fat golden cactus, glazed bowl'), V('plant.cactus', { tier: 2, kind: 'ball' })),
    vis(plant('pothos', 'Trailing Pothos', 22, 0, 1, 'hanging pot, trailing vines'), V('plant.hanging', { tier: 0, seed: 2 }, { z: 1.4 })),
    vis(plant('ivy', 'English Ivy Basket', 28, 1, 2, 'hanging basket, ivy'), V('plant.hanging', { tier: 1, seed: 5 }, { z: 1.4 })),
    vis(plant('pearls', 'String of Pearls', 48, 2, 3, 'hanging pot, bead-like strands'), V('plant.hanging', { tier: 2, seed: 8 }, { z: 1.4 })),
  ],
  clothes: [
    fit('mall_outfit_varsity', 'Varsity Jacket Set', 70, M('thread'), ['casual', 'sporty'], 'red letterman jacket', { top: 'varsity', topColor: '#b83a6a', bottom: 'jeans', bottomColor: '#34507f', ...H0 }),
    fit('mall_outfit_flannel', 'Lumber Flannel', 48, M('thread'), ['casual', 'cozy'], 'red check shirt, cargo trousers', { top: 'flannel', topColor: '#d9483b', bottom: 'cargo', bottomColor: '#6f7a48', ...H0 }),
    fit('mall_outfit_stripe', 'Breton Stripes', 42, M('thread'), ['casual'], 'navy striped top, cream trousers', { top: 'stripe', topColor: '#2f3f72', bottom: 'slacks', bottomColor: '#e8e2d4', ...H0 }),
    fit('mall_outfit_hoodie', 'Cloud Hoodie & Sweats', 55, M('thread'), ['casual', 'cozy'], 'grey hoodie, joggers', { top: 'hoodie', topColor: '#9aa0a8', bottom: 'sweats', bottomColor: '#4a4a58', ...H0 }, { sleepMult: 1.03 }),
    fit('mall_outfit_sundress', 'Sunflower Sundress', 65, M('thread'), ['casual'], 'yellow dress, straw hat', { top: 'dress', topColor: '#e8b83a', bottom: 'skirt', bottomColor: '#e8b83a', hat: 'sunhat', hatColor: '#ead9b8', scarf: null }, { outdoorFunMult: 1.05 }),
    fit('mall_outfit_cardigan', 'Library Cardigan', 58, M('thread'), ['casual', 'cozy', 'smart'], 'green cardigan, brown trousers', { top: 'cardigan', topColor: '#4fa860', innerColor: '#f4f0e8', bottom: 'slacks', bottomColor: '#7a5238', ...H0 }),
    fit('mall_outfit_denim', 'Double Denim', 75, M('thread'), ['casual'], 'denim jacket, denim jeans', { top: 'jacket', topColor: '#4a6fa8', innerColor: '#f4f0e8', bottom: 'jeans', bottomColor: '#4a6fa8', ...H0 }),
    fit('mall_outfit_trench', 'Harbor Trench', 140, M('thread'), ['smart'], 'tan trench coat, red scarf', { top: 'coat', topColor: '#c8ad7a', bottom: 'slacks', bottomColor: '#33303f', scarf: '#b83a6a', hat: null }, { blocksMoodlets: ['chilly'] }),
    fit('mall_outfit_beret', 'Gallery Opening', 95, M('thread'), ['smart', 'artsy'], 'black top, wine skirt, beret', { top: 'long', topColor: '#33303f', bottom: 'longskirt', bottomColor: '#8a3848', hat: 'beret', hatColor: '#b83a6a', scarf: null }, { xpMult: { creativity: 1.05 } }),
    fit('mall_outfit_polo', 'Sunday Polo', 40, M('thread'), ['casual'], 'sky polo, khaki shorts', { top: 'polo', topColor: '#5ab0e0', bottom: 'shorts', bottomColor: '#c8ad7a', ...H0 }),
    fit('mall_outfit_puffer', 'Marshmallow Puffer', 120, M('thread'), ['casual', 'cozy'], 'white puffer, pink beanie', { top: 'puffer', topColor: '#f4f0e8', bottom: 'leggings', bottomColor: '#33303f', hat: 'beanie', hatColor: '#f08ab0' }, { blocksMoodlets: ['chilly'] }),
    fit('mall_outfit_graphic', 'Band Tee & Cargo', 38, M('thread'), ['casual'], 'black band tee, grey cargos', { top: 'graphic', topColor: '#33303f', accent: '#f07a5a', bottom: 'cargo', bottomColor: '#4a4a58', ...H0 }),
    fit('mall_outfit_linen', 'Linen Weekend', 85, M('thread'), ['casual', 'smart'], 'cream linen shirt and trousers', { top: 'long', topColor: '#ead9b8', bottom: 'slacks', bottomColor: '#e8e2d4', hat: 'sunhat', hatColor: '#c8a070', scarf: null }),
    fit('mall_outfit_overalls', 'Garden Overalls', 62, M('thread'), ['casual'], 'olive dungarees, orange stripes', { top: 'stripe', topColor: '#f09a3a', bottom: 'overalls', bottomColor: '#6f7a48', ...H0 }),
    fit('mall_outfit_velvet', 'Velvet Blazer', 160, M('thread'), ['smart', 'formal'], 'purple velvet jacket, gold pin', { top: 'suit', topColor: '#7a55c8', innerColor: '#33303f', accent: '#e8b83a', bottom: 'slacks', bottomColor: '#33303f', shoes: '#2f2c3a', ...H0 }, { relationshipGainMult: 1.05 }),
  ],
  kicks: [
    fit('mall_kicks_red', 'Redline Runners', 80, M('kicks'), ['casual', 'sporty'], 'red running shoes', { shoes: '#d04a3a' }, { xpMult: { fitness: 1.03 } }),
    fit('mall_kicks_white', 'Cloud Court Classics', 70, M('kicks'), ['casual'], 'white leather sneakers', { shoes: '#f0ece4' }),
    fit('mall_kicks_blue', 'Bay Blue High-Tops', 90, M('kicks'), ['casual'], 'blue high-top sneakers', { shoes: '#3b6fd0' }),
    fit('mall_kicks_trail', 'Trail Stompers', 110, M('kicks'), ['casual', 'sporty'], 'tan hiking boots', { shoes: '#c8a070', bottom: 'cargo', bottomColor: '#6f7a48' }, { outdoorFunMult: 1.05 }),
    fit('mall_sport_track', 'Track Day Set', 75, M('kicks'), ['sporty', 'casual'], 'red track top, headband', { top: 'long', topColor: '#d9483b', bottom: 'sweats', bottomColor: '#33303f', shoes: '#f0ece4', hat: 'headband', hatColor: '#f4f0e8', scarf: null }, { xpMult: { fitness: 1.05 } }),
    fit('mall_sport_yoga', 'Flow Yoga Set', 68, M('kicks'), ['sporty'], 'teal tank, black leggings', { top: 'tank', topColor: '#2f9a94', bottom: 'leggings', bottomColor: '#33303f', shoes: '#f0ece4', ...H0 }, { xpMult: { fitness: 1.05 } }),
    fit('mall_sport_court', 'Court Kit', 60, M('kicks'), ['sporty', 'casual'], 'white tee, blue shorts, cap', { top: 'tee', topColor: '#f4f0e8', bottom: 'shorts', bottomColor: '#3b6fd0', shoes: '#f0ece4', hat: 'cap', hatColor: '#3b6fd0', scarf: null }, { xpMult: { fitness: 1.04 } }),
    fit('mall_sport_gym', 'Gym Rat Set', 50, M('kicks'), ['sporty'], 'tank top and gym shorts', { outfit: 'gymwear', ...H0 }, { xpMult: { fitness: 1.05 } }),
    misc('mall_sport_bottle', 'Steel Water Bottle', 14, M('kicks'), 'brushed steel bottle, teal cap', 'Keeps cold things cold for a whole lap of the bay.'),
    gift('mall_sport_ball', 'Basketball', 22, M('kicks'), 'orange ball, black seams', 6, ['fun', 'sporty']),
  ],
  tech: [
    vis(hg('mall_tv_retro', 'Retro Cube TV', 120, M('pixel'), 'tv', 0, [1, 1], 'floor', 1, 'small boxy tv, antenna'), V('tv.small', { tier: 0, show: 'toon' })),
    vis(hg('mall_tv_ultra', 'UltraWide 65', 1400, M('pixel'), 'tv', 2, [2, 1], 'floor', 3, 'very wide thin tv on a stand'), V('tv.large', { tier: 2, show: 'game' })),
    vis(hg('mall_tv_frame', 'Gallery Frame TV', 1100, M('pixel'), 'tv', 2, [2, 1], 'wall', 3, 'tv that looks like a framed painting'), V('tv.wall', { tier: 2, show: 'news' })),
    vis(hg('mall_laptop_air', 'Featherbook Air', 780, M('pixel'), 'computer', 1, [1, 1], 'floor', 1, 'thin silver laptop'), V('laptop', { tier: 1 })),
    vis(hg('mall_pc_rig', 'Nebula Gaming Rig', 1650, M('pixel'), 'computer', 2, [2, 1], 'floor', 2, 'glowing tower pc, two monitors'), V('desk', { tier: 2, show: 'game' })),
    vis(hg('mall_console_pico', 'PicoBox Mini', 180, M('pixel'), 'game', 0, [1, 1], 'floor', 0, 'tiny white console, one pad'), V('console', { tier: 0 })),
    vis(hg('mall_console_pro', 'PicoBox Pro', 420, M('pixel'), 'game', 1, [1, 1], 'floor', 1, 'black console, two pads'), V('console', { tier: 1 })),
    vis(hg('mall_arcade_cab', 'Star Hopper Arcade Cabinet', 990, M('pixel').concat(M('toy')), 'game', 2, [1, 1], 'floor', 3, 'purple arcade cabinet, joystick'), V('arcade', { tier: 2, c: '#7a55c8' })),
    vis(hg('mall_speaker_boom', 'Boombox Mini', 90, M('pixel'), 'music', 0, [1, 1], 'floor', 0, 'small red boombox'), V('stereo', { tier: 0 })),
    vis(hg('mall_hifi', 'Walnut Hi-Fi Tower', 640, M('pixel'), 'music', 2, [1, 1], 'floor', 3, 'wood record player and speakers'), V('stereo', { tier: 2 })),
  ],
  toys: [
    gift('mall_toy_blocks', 'Brick Bucket (500 pcs)', 25, M('toy'), 'red bucket of plastic bricks', 6, ['fun', 'cute']),
    gift('mall_toy_kite', 'Dragon Kite', 18, M('toy'), 'green dragon kite, long tail', 6, ['fun']),
    gift('mall_toy_puzzle', '1000-Piece Bay Puzzle', 20, M('toy'), 'puzzle box, lighthouse picture', 6, ['cozy', 'fun']),
    gift('mall_toy_gull', 'Plush Seagull', 14, M('toy'), 'soft white gull, orange beak', 6, ['cute']),
    gift('mall_toy_yoyo', 'Light-up Yo-yo', 6, M('toy'), 'blue yo-yo, glowing rim', 3, ['fun']),
    gift('mall_toy_boardgame', 'Settlers of Maple Bay', 35, M('toy'), 'board game box, hex tiles', 9, ['fun', 'cozy']),
    gift('mall_toy_rc_car', 'RC Rally Car', 45, M('toy'), 'red toy car, antenna', 9, ['fun', 'cool']),
    gift('mall_toy_cards', 'Deck of Cards', 5, M('toy'), 'card box, maple leaf back', 3, ['fun']),
    gift('mall_toy_rocket', 'Model Rocket Kit', 28, M('toy'), 'white rocket, red fins', 7, ['fun', 'cool']),
    gift('mall_toy_dino', 'Wind-up Dinosaur', 10, M('toy'), 'green tin dinosaur, key', 5, ['cute', 'fun']),
  ],
  wheels: [
    vis(hg('mall_bike_city', 'Bayline City Bike', 320, M('wheel'), 'decor', 1, [2, 1], 'floor', 1, 'teal step-through bike, basket', { vehicle: 'bike', note: 'Kept at home. Riding comes later.' }), V('bicycle', { c: '#2f9a94', basket: 1 })),
    vis(hg('mall_bike_road', 'Redline Road Bike', 540, M('wheel'), 'decor', 2, [2, 1], 'floor', 2, 'red drop-bar racing bike', { vehicle: 'bike', note: 'Kept at home. Riding comes later.' }), V('bicycle', { c: '#d9483b' })),
    vis(hg('mall_skate_classic', 'Classic Popsicle Deck', 85, M('wheel'), 'decor', 0, [1, 1], 'floor', 1, 'yellow skateboard standing on its tail', { vehicle: 'skateboard', note: 'Leans against a wall at home. Riding comes later.' }), V('skateboard', { c: '#e8b83a' })),
    vis(hg('mall_skate_cruiser', 'Sunset Cruiser Board', 120, M('wheel'), 'decor', 1, [1, 1], 'floor', 1, 'coral cruiser board, big wheels', { vehicle: 'skateboard', note: 'Kept at home. Riding comes later.' }), V('skateboard', { c: '#f07a5a', flat: 1 })),
    misc('mall_helmet', 'Commuter Helmet', 45, M('wheel'), 'white bike helmet, vents', 'Safety first. Looks second. This one manages both.', { vehicle: 'helmet' }),
    misc('mall_helmet_skate', 'Skate Lid & Pads', 55, M('wheel'), 'black skate helmet, knee pads', 'For the day gravity wins.', { vehicle: 'helmet' }),
  ],
  beauty: [
    gift('mall_beauty_lipstick', 'Coral Crush Lipstick', 16, M('bloom'), 'gold tube, coral tip', 6, ['fancy']),
    gift('mall_beauty_perfume', 'Sea Fig Perfume', 48, M('bloom'), 'square glass bottle, teal cap', 10, ['fancy', 'floral']),
    gift('mall_beauty_masks', 'Sheet Mask Set', 12, M('bloom'), 'three pastel sachets', 5, ['cozy']),
    gift('mall_beauty_polish', 'Nail Polish Trio', 12, M('bloom'), 'three small bottles, pink red gold', 5, ['cute']),
    gift('mall_beauty_soap', 'Lavender Soap Bar', 7, M('bloom'), 'purple soap, paper band', 4, ['cozy', 'floral']),
  ],
  stationery: [
    gift('mall_stat_pens', 'Gel Pen Rainbow (12)', 9, M('paper'), 'row of coloured pens', 4, ['cute', 'art']),
    gift('mall_stat_planner', 'Linen Day Planner', 18, M('paper'), 'grey cloth planner, elastic', 6, ['cozy']),
    gift('mall_stat_washi', 'Washi Tape Stack', 6, M('paper'), 'stack of patterned tape rolls', 3, ['cute', 'art']),
    gift('mall_stat_fountain', 'Fountain Pen', 42, M('paper'), 'black pen, gold nib', 9, ['fancy']),
    gift('mall_stat_cards', 'Letterpress Card Set', 11, M('paper'), 'cream cards, envelope', 5, ['cozy']),
  ],
  sky: [
    dish('sky_cloud_latte', 'Cloud Nine Latte', 6, [SKY_VENUES.bar], { energy: 10, fun: 6, caffeine: true }, 8, 'drink', 'latte, cloud of foam'),
    dish('sky_sunset_spritz', 'Sunset Spritz', 9, [SKY_VENUES.bar], { fun: 14, social: 4, alcohol: 1 }, 10, 'drink', 'orange drink, tall glass'),
    dish('sky_high_tea', 'Sky-High Tea Tier', 14, [SKY_VENUES.bar], { hunger: 30, fun: 10 }, 15, 'dessert', 'three-tier stand of small cakes'),
    gift('sky_snowglobe', 'Beacon Tower Snow Globe', 15, [SKY_VENUES.gifts], 'glass globe, tiny tower', 6, ['cute']),
    gift('sky_magnet', 'Skyline Magnet', 5, [SKY_VENUES.gifts], 'fridge magnet, city silhouette', 3, ['cute']),
    gift('sky_model', 'Tin Skyline Model', 26, [SKY_VENUES.gifts], 'small metal skyline on a base', 8, ['fancy', 'cool']),
    vis(hg('sky_poster', 'Maple Bay Panorama Print', 24, [SKY_VENUES.gifts], 'decor', 1, [2, 1], 'wall', 2, 'wide framed print of the bay'), V('wall.art', { tier: 1, art: 'sea', w: 1.5, h: 1 })),
  ],
};
export const NEW_BY_GROUP = Object.fromEntries(Object.entries(G_).map(([k, a]) => [k, a.map(i => i.id)]));
export const MALL_LOOKS = {};
const NEW = Object.values(G_).flat();
export const NEW_ITEM_IDS = NEW.map(i => i.id);
const LISTS = { homegood: HOMEGOODS, outfit: OUTFITS, gift: GIFTS, misc: MISC, dish: DISHES };
for (const it of NEW) { if (it.look) { MALL_LOOKS[it.outfit] = it.look; delete it.look; } if (ITEM_BY_ID[it.id]) continue; ITEMS.push(it); ITEM_BY_ID[it.id] = it; if (LISTS[it.category]) LISTS[it.category].push(it); }

/* ---------- existing catalogue items the showpiece shops also stock (never mutate shared soldAt arrays in place) ---------- */
const also = (venueId, pred) => { for (const it of ITEMS) if (it.price > 0 && !it.soldAt.includes(venueId) && pred(it)) it.soldAt = it.soldAt.concat(venueId); };
const at = v => it => it.soldAt.includes(v), TECH = ['tv', 'computer', 'game', 'music', 'microwave'];
also('mall:fern', it => (it.category === 'homegood' && it.tag === 'plant') || (it.category === 'gift' && (it.giftTags || []).some(t => t === 'floral' || t === 'green')));
also('mall:nest', it => it.category === 'homegood' && at('homegoods')(it) && !TECH.includes(it.tag) && it.tag !== 'plant');
also('mall:pixel', it => it.category === 'homegood' && at('homegoods')(it) && TECH.includes(it.tag));
also('mall:thread', it => it.category === 'outfit' && at('clothing')(it) && it.outfit !== 'sport');
also('mall:kicks', it => it.category === 'outfit' && it.outfit === 'sport');
also('mall:bloom', it => ['gen_bath_salts', 'gift_candle'].includes(it.id));
also('mall:paper', it => at('bookstore')(it) || ['gen_notebook', 'sketchbook', 'gift_postcards'].includes(it.id));
also('mall:toy', it => ['gen_toy_robot', 'gift_teddy', 'gen_comic'].includes(it.id));
for (const f of FOOD_COURT) also(f.venueId, at(f.from));
also('mall:pretzel', it => ['gen_pretzel', 'stand_hotdog_pretzel', 'pizza_soda', 'gen_soft_serve'].includes(it.id));
also(SKY_VENUES.bar, it => it.category === 'dish' && it.course === 'drink' && (at('cafe')(it) || at('gen_tea')(it)));
also(SKY_VENUES.gifts, it => it.id === 'gift_postcards');
