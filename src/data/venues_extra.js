// venues_extra.js — GENERIC venue types for the "public places" system (src/sim/public_places.js) + the extra dishes/items they sell.
// A generic TYPE (gen_cafe, gen_eatery_pho, gen_bodega ...) is a venue record in the same shape as data/venues.js entries; it is registered in
// VENUE_BY_ID (not in VENUES: it has no place on the map). Every converted building is an INSTANCE of a type: registerInstance() clones the type
// into its own venue record (id 'pub:<n>' / 'pubw:<n>', own sign name) in VENUES + VENUE_BY_ID and stocks it with everything its type sells.
//   GEN_TYPES   { [typeId]: venue record + { tpl (room template in scenes/rooms/generic_venues.js), kind (template flavour), sign, names[] } }
//   registerInstance(typeId, id, name, district, extra?) -> venue record        NEW_ITEM_IDS  ids of the items added here
import { VENUES, VENUE_BY_ID } from './venues.js';
import { ITEMS, ITEM_BY_ID, DISHES } from './items.js';

const DAILY = (o, c) => [0, 1, 2, 3, 4, 5, 6].map(() => [o, c]);
const T = (id, name, type, tpl, hours, offers, blurb, x) => Object.assign({ id, name, type, district: 'downtown', where: 'generic type (see sim/public_places.js)', station: null, interior: true, hours, offers, priceMult: 1, jobId: null, delivers: false, blurb, generic: true, tpl, names: [] }, x);
const FOOD = { menu: true, functions: ['seat', 'till'] }, EAT = (id, name, sign, blurb, names, x) => T('gen_eatery_' + id, name, 'food', 'eatery', DAILY(11, 22), FOOD, blurb, Object.assign({ kind: id, sign, names }, x));
const RET = (id, name, sign, cats, blurb, names, x) => T('gen_retail_' + id, name, 'shop', 'retail', DAILY(9, 19), { shop: cats, functions: ['shelf', 'till'] }, blurb, Object.assign({ kind: id, sign, names }, x));
const SVC = (id, name, sign, blurb, names, services) => T('gen_service_' + id, name, 'service', 'service', DAILY(9, 20), { functions: ['seat'] }, blurb, { kind: id, sign, names, pubServices: services });

export const GEN_TYPE_LIST = [
  T('gen_cafe', 'Neighbourhood Cafe', 'food', 'cafe', DAILY(6.5, 20), FOOD, 'Good coffee, mismatched chairs, somebody always writing a novel.', { sign: 'COFFEE', names: ['Kettle & Crumb', 'Night Owl Coffee', 'Driftwood Coffee', 'Second Cup Social', 'Copper Pot Cafe', 'Little Sparrow Cafe', 'Tall Tales Coffee'] }),
  T('gen_tea', 'Tea House', 'food', 'cafe', DAILY(9, 21), FOOD, 'A quiet pot of tea and something sweet on the side.', { kind: 'tea', sign: 'TEA', names: ['Jade Rabbit Tea House', 'Camellia Tea Room', 'Steep & Stay'] }),
  T('gen_bakery', 'Bakery & Coffee', 'food', 'bakery', DAILY(6, 18), { menu: true, shop: ['ingredient', 'gift'], functions: ['seat', 'till'] }, 'Warm bread from five in the morning; the coffee is just an excuse.', { sign: 'BREAD', names: ['Flour & Fig Bakery', 'Golden Crust Bakery', 'Panaderia La Luna', 'Sweet Proof Bakehouse'] }),
  T('gen_diner', 'Diner', 'food', 'diner', DAILY(6, 24), FOOD, 'Bottomless coffee and pie under buzzing neon.', { sign: 'EAT', names: ['Silver Spoon Diner', 'Moonlight Diner', "Ruby's Lunch Counter"] }),
  EAT('taqueria', 'Taqueria', 'TACOS', 'Hand-pressed tortillas, three salsas, zero pretension.', ['Taqueria El Farolito', 'La Mariposa Taqueria', 'Tres Hermanas Tacos']),
  EAT('pho', 'Pho Shop', 'PHO', 'Broth that has been simmering since yesterday.', ['Pho Saigon Lantern', 'Little Hanoi Pho', 'Pho & Banh Mi 88']),
  EAT('falafel', 'Falafel Counter', 'FALAFEL', 'Crisp falafel, warm pita and a mountain of pickles.', ['Cedar & Olive Falafel', "Yasmin's Falafel House", 'Pita Palace']),
  EAT('dimsum', 'Dim Sum House', 'DIM SUM', 'Steaming baskets wheeled past until you say stop.', ['Nine Dragons Dim Sum', 'Lucky Gyoza', 'Bao Bao', "Auntie Mei's Bao"]),
  EAT('ethiopian', 'Ethiopian Kitchen', 'INJERA', 'Share a platter, eat with your hands, stay for the coffee.', ['Addis Table', 'Blue Nile Kitchen']),
  EAT('kbbq', 'Korean BBQ', 'BBQ', 'A grill in the table and more side dishes than table.', ['Seoul Ember BBQ', 'Han River Grill']),
  EAT('soul', 'Soul Food Kitchen', 'SOUL FOOD', 'Fried chicken, collards and somebody calling you baby.', ["Mama Opal's Soul Kitchen", 'Sunday Table', 'Rope Works Smokehouse']),
  EAT('bagels', 'Bagel Shop', 'BAGELS', 'Boiled, baked and gone by noon.', ['Baker House Bagels', 'Hole Truth Bagels', 'Schmear Campaign'], { hours: DAILY(6, 16) }),
  EAT('curry', 'Curry House', 'CURRY', 'Slow curries and fluffy rice, mild to "are you sure?".', ['Golden Curry Stand', 'Lantern Row Curry House', 'Masala Junction']),
  EAT('hotpot', 'Hot Pot', 'HOT POT', 'One bubbling pot, a table of friends, a long evening.', ['Bubbling Lantern Hot Pot', 'Red Kettle Hot Pot'], { hours: DAILY(12, 24) }),
  EAT('deli', 'Deli', 'DELI', 'Sandwiches the size of your head.', ["Abe's Deli", 'Corner Rye Deli']),
  EAT('seafood', 'Fish & Chips', 'FISH', 'Straight off the boat and into the fryer.', ['Rope Works Fish & Chips', "Skipper's Catch", 'The Salty Fry']),
  EAT('boba', 'Boba & Ice', 'BOBA', 'Chewy pearls, too many flavours, a loyalty card.', ['Cold Storage Boba & Ice', 'Tapioca Sky', 'Bubble Harbor'], { hours: DAILY(10, 22) }),
  EAT('donut', 'Donut Shop', 'DONUTS', 'Hot glazed rings and coffee in a paper cup.', ['Halo Donuts', 'Glaze Days Donuts', 'Dunk Tank Donuts'], { hours: DAILY(5, 17) }),
  EAT('juice', 'Juice Bar', 'JUICE', 'Squeezed while you wait.', ['Sunny Squeeze Juice Bar', 'Pulp Friction'], { hours: DAILY(8, 19) }),
  EAT('snack', 'Snack Window', 'SNACKS', 'Pretzels, lemonade and something cold.', ['Paddle Co. Snack Window', 'The Snack Hatch'], { hours: DAILY(9, 20) }),
  T('gen_restaurant', 'Bistro', 'food', 'restaurant', DAILY(11.5, 23), FOOD, 'White tablecloths without the white-tablecloth prices.', { sign: 'BISTRO', priceMult: .8, names: ["The Heron's Table", 'Bistro Marguerite', 'Olive & Ember', 'The Copper Fork'] }),
  T('gen_bar', 'Bar', 'food', 'bar', DAILY(15, 26), FOOD, 'Cold beer, warm light, a jukebox with opinions.', { sign: 'BAR', names: ['Paper Crane Izakaya', 'The Rusty Anchor', 'Maple Brewing Co. Taproom', 'The Thirsty Gull', 'Low Tide Tavern'] }),
  T('gen_boutique', 'Boutique', 'shop', 'boutique', DAILY(10, 19), { shop: ['outfit'], functions: ['till'] }, 'Small racks, good taste.', { sign: 'STYLE', names: ['Marigold & Main', 'Honeycomb Boutique', 'Atelier Soleil', 'Needle & Tide'] }),
  T('gen_thrift', 'Thrift & Vintage', 'shop', 'boutique', DAILY(11, 19), { shop: ['outfit'], functions: ['till'] }, 'Pre-loved everything. Dig for treasure.', { kind: 'thrift', sign: 'THRIFT', priceMult: .7, names: ['Second Story Thrift', 'Ink & Ivy Vintage', 'Moth & Moon Vintage'] }),
  T('gen_books', 'Bookshop', 'shop', 'books', DAILY(10, 20), { shop: ['book', 'gift', 'misc'], functions: ['shelf', 'till'] }, 'Crooked shelves and a cat asleep on the bestsellers.', { sign: 'BOOKS', names: ['Paper Lantern Books', 'The Bent Spine', 'Marginalia Books'] }),
  T('gen_records', 'Record Shop', 'shop', 'books', DAILY(11, 21), { shop: ['gift', 'misc'], functions: ['shelf', 'till'] }, 'Crates of vinyl and a clerk who has heard of everything.', { kind: 'records', sign: 'VINYL', names: ['Wax & Wane Records', 'B-Side Records', 'Spin City Vinyl', 'Groove Yard'] }),
  T('gen_comics', 'Comics & Zines', 'shop', 'books', DAILY(11, 20), { shop: ['book', 'gift', 'misc'], functions: ['shelf', 'till'] }, 'New issues on Wednesday. Do not bend the covers.', { kind: 'comics', sign: 'COMICS', names: ['Ink & Ivy Comics & Zines', 'Panel Nine Comics', 'Cape & Cowl Comics'] }),
  T('gen_bodega', 'Bodega', 'shop', 'bodega', DAILY(6, 26), { shop: ['ingredient', 'ready_meal', 'snack', 'drink', 'misc'], functions: ['shelf', 'till'] }, 'The basics, open late, a few cents more.', { sign: 'OPEN', priceMult: 1.15, names: ['Salt & Co. Provisions', 'Coast Gas Mini Mart', 'Birch Lane Pantry', 'Sunrise Bodega', 'Three Kings Bodega', 'Night & Day Market'] }),
  T('gen_grocery_m', 'Neighbourhood Grocery', 'shop', 'grocery_m', DAILY(7, 22), { shop: ['ingredient', 'ready_meal', 'snack', 'drink', 'gift'], functions: ['shelf', 'till'] }, 'A proper neighbourhood grocery: most of what you need, none of the queues.', { sign: 'MARKET', priceMult: 1.05, names: ["Marchetti's Delicatessen & Grocery", 'Bay Thread Co-op Market', 'Green Door Grocery', 'Cornucopia Market'] }),
  RET('hardware', 'Hardware Store', 'TOOLS', ['misc', 'gift'], 'Nails by the pound and advice for free.', ['Salt & Co. Chandlery & Hardware', 'Hammer & Hinge Hardware', 'Fix-It Felix Hardware']),
  RET('pets', 'Pet Shop', 'PETS', ['misc', 'gift'], 'Treats, toys and a very loud parrot.', ['Paws & Whiskers Pet Supply', 'The Wagging Tail']),
  RET('toys', 'Toy Shop', 'TOYS', ['gift', 'misc'], 'Wind-up robots, kites and a train that goes round the ceiling.', ['Tin Robot Toys', 'Kite & Caboose Toys']),
  RET('florist', 'Florist', 'FLOWERS', ['gift'], 'Buckets of blooms and brown paper.', ['Bloom & Paper', 'Petal Pushers', 'Wild Stem Florist']),
  RET('pharmacy', 'Pharmacy', 'PHARMACY', ['snack', 'drink', 'gift', 'misc'], 'Plasters, vitamins and an umbrella when you need one.', ['Post Corner Pharmacy', 'Bayview Pharmacy', 'Good Neighbor Drugs'], { hours: DAILY(8, 22) }),
  RET('stationery', 'Stationery Shop', 'PAPER', ['gift', 'misc', 'book'], 'Notebooks you will be too afraid to write in.', ['Old Post Stationers', 'Design Lab Paper Goods', 'Inkwell & Co.']),
  RET('art', 'Art Supply', 'ART', ['misc', 'gift'], 'Every colour, in every kind of tube.', ['Studio 11 Art Supply', 'Cadmium Corner']),
  RET('gallery', 'Gallery', 'GALLERY', ['gift'], 'Local artists, white walls, tiny price cards.', ['Tidewater Gallery', 'Gallery Nine']),
  RET('cheese', 'Cheese Shop', 'CHEESE', ['ingredient', 'gift'], 'Ask for a taste. Leave with three wedges.', ['The Rind & The Wheel', 'Curds & Company']),
  SVC('barber', 'Barbershop', 'BARBER', 'A hot towel, a sharp fade and the neighbourhood news.', ["Otis & Sons Barbershop", 'Fresh Fade Barbers'], [['Fresh cut', 18, 25, { hygiene: 20, fun: 6, social: 8 }], ['Hot towel shave', 12, 15, { hygiene: 14, energy: 4, social: 5 }]]),
  SVC('salon', 'Hair Salon', 'SALON', 'Walk in tired, walk out fabulous.', ['Velvet Comb Salon', 'Shear Delight'], [['Wash & style', 28, 35, { hygiene: 28, fun: 10, social: 8 }], ['Quick trim', 16, 20, { hygiene: 16, fun: 4, social: 5 }]]),
  SVC('nails', 'Nail Bar', 'NAILS', 'Forty shades of pink and a massage chair.', ['Lacquer Lounge Nail Bar', 'Ten Little Gems'], [['Manicure', 20, 30, { fun: 14, hygiene: 8, social: 8 }], ['Hand massage', 10, 15, { fun: 8, energy: 6 }]]),
  SVC('tattoo', 'Tattoo Studio', 'TATTOO', 'Flash on the walls, a buzz in the air.', ['Black Cat Ink', 'Ink & Ivy Tattoo'], [['Flip through flash art', 0, 15, { fun: 10, social: 4 }], ['Tiny flash tattoo', 45, 40, { fun: 26, energy: -6, social: 6 }]]),
  SVC('laundry', 'Laundromat', 'WASH', 'Warm, humming and smelling of soap.', ['Suds & Bubbles Laundromat', 'Spin Cycle Wash & Fold'], [['Wash & dry a load', 4, 45, { hygiene: 12, fun: -2 }], ['Express wash & fold', 9, 15, { hygiene: 12 }]]),
];
export const GEN_TYPES = Object.fromEntries(GEN_TYPE_LIST.map(t => [t.id, t]));
for (const t of GEN_TYPE_LIST) if (!VENUE_BY_ID[t.id]) VENUE_BY_ID[t.id] = t;

/* ---------- new menu dishes + shop items ---------- */
const TA = { takeaway: true }, E = k => 'gen_eatery_' + k;
const dish = (id, name, venues, price, effects, eatMinutes, course, icon, extra = {}) => ({ id, name, category: 'dish', price, icon, effects, stack: 1, soldAt: venues, venue: venues[0], eatMinutes, course, takeaway: false, ...extra });
const gift = (id, name, venues, price, icon, relationship, giftTags) => ({ id, name, category: 'gift', price, icon, effects: {}, stack: 3, soldAt: venues, relationship, giftTags });
const NEW = [
  dish('gen_taco_pastor', 'Tacos al Pastor', [E('taqueria')], 7, { hunger: 34, fun: 6 }, 10, 'main', 'two tacos, pineapple, cilantro', TA),
  dish('gen_burrito_bowl', 'Burrito Bowl', [E('taqueria')], 9, { hunger: 46, fun: 4 }, 14, 'main', 'bowl of rice, beans, salsa'),
  dish('gen_agua_fresca', 'Agua Fresca', [E('taqueria'), E('juice')], 3, { fun: 6, energy: 3 }, 4, 'drink', 'tall pink drink, ice', TA),
  dish('gen_pho', 'Beef Pho', [E('pho')], 10, { hunger: 48, energy: 4, fun: 5 }, 16, 'main', 'big bowl, noodles, herbs'),
  dish('gen_banh_mi', 'Banh Mi', [E('pho'), E('deli')], 7, { hunger: 36, fun: 4 }, 9, 'main', 'crusty roll, pickled carrot', TA),
  dish('gen_viet_coffee', 'Iced Viet Coffee', [E('pho'), 'gen_cafe'], 4, { energy: 12, fun: 4, caffeine: true }, 5, 'drink', 'glass, dark coffee over cream', TA),
  dish('gen_falafel_wrap', 'Falafel Wrap', [E('falafel')], 7.5, { hunger: 38, fun: 4 }, 9, 'main', 'pita wrap, green falafel', TA),
  dish('gen_hummus_plate', 'Hummus & Pita Plate', [E('falafel')], 8, { hunger: 32, fun: 6, social: 3 }, 12, 'main', 'swirled hummus, olive oil'),
  dish('gen_mint_lemonade', 'Mint Lemonade', [E('falafel'), E('snack'), E('juice')], 3.5, { fun: 7, energy: 3 }, 4, 'drink', 'green-flecked lemonade', TA),
  dish('gen_dimsum_basket', 'Dim Sum Basket', [E('dimsum')], 8, { hunger: 32, fun: 8 }, 10, 'main', 'bamboo steamer, dumplings', TA),
  dish('gen_pork_bao', 'Fluffy Bao (2)', [E('dimsum')], 5, { hunger: 24, fun: 5 }, 6, 'snack', 'two white buns', TA),
  dish('gen_gyoza', 'Pan-fried Gyoza', [E('dimsum')], 6, { hunger: 26, fun: 5 }, 7, 'snack', 'row of crisp dumplings', TA),
  dish('gen_injera_platter', 'Injera Platter', [E('ethiopian')], 13, { hunger: 55, fun: 8, social: 6 }, 22, 'main', 'round flatbread, colourful stews'),
  dish('gen_sambusa', 'Lentil Sambusa', [E('ethiopian')], 4, { hunger: 16, fun: 3 }, 5, 'snack', 'golden triangle pastry', TA),
  dish('gen_kbbq_set', 'BBQ Grill Set', [E('kbbq')], 18, { hunger: 62, fun: 12, social: 6 }, 28, 'main', 'tabletop grill, sliced beef'),
  dish('gen_bibimbap', 'Bibimbap', [E('kbbq')], 11, { hunger: 48, fun: 6 }, 15, 'main', 'stone bowl, egg on top'),
  dish('gen_soul_plate', 'Fried Chicken Plate', [E('soul')], 12, { hunger: 56, fun: 9 }, 18, 'main', 'fried chicken, greens, cornbread'),
  dish('gen_mac_cheese', 'Baked Mac & Cheese', [E('soul')], 6, { hunger: 30, fun: 6 }, 9, 'snack', 'golden crusted macaroni', TA),
  dish('gen_sweet_tea', 'Sweet Tea', [E('soul')], 2.5, { fun: 5, energy: 3 }, 3, 'drink', 'mason jar, lemon wedge', TA),
  dish('gen_bagel_lox', 'Lox & Schmear Bagel', [E('bagels'), E('deli')], 8, { hunger: 34, fun: 6 }, 8, 'main', 'bagel, salmon, cream cheese', TA),
  dish('gen_bagel_egg', 'Egg & Cheese Bagel', [E('bagels')], 5.5, { hunger: 30, energy: 3 }, 7, 'main', 'bagel sandwich, yellow egg', TA),
  dish('gen_drip_coffee', 'Drip Coffee', [E('bagels'), E('donut'), E('deli'), 'gen_bakery', 'gen_diner'], 2.5, { energy: 9, caffeine: true }, 4, 'drink', 'paper cup, lid', TA),
  dish('gen_curry_rice', 'Curry Rice', [E('curry')], 9, { hunger: 46, fun: 6 }, 13, 'main', 'brown curry beside white rice', TA),
  dish('gen_samosa', 'Samosas (2)', [E('curry')], 4, { hunger: 18, fun: 4 }, 5, 'snack', 'two fried triangles', TA),
  dish('gen_mango_lassi', 'Mango Lassi', [E('curry'), E('juice')], 4, { hunger: 6, fun: 8 }, 4, 'drink', 'orange yoghurt drink', TA),
  dish('gen_hotpot', 'Hot Pot for One', [E('hotpot')], 15, { hunger: 58, fun: 12, social: 5 }, 26, 'main', 'bubbling split pot'),
  dish('gen_pastrami', 'Pastrami on Rye', [E('deli')], 11, { hunger: 50, fun: 6 }, 12, 'main', 'tall stacked sandwich, pickle', TA),
  dish('gen_fish_chips', 'Fish & Chips', [E('seafood')], 10, { hunger: 48, fun: 7 }, 12, 'main', 'paper cone, golden fish', TA),
  dish('gen_chowder', 'Cup of Chowder', [E('seafood')], 6, { hunger: 28, energy: 3 }, 8, 'snack', 'cream soup, crackers', TA),
  dish('gen_boba', 'Brown Sugar Boba', [E('boba')], 5, { fun: 12, energy: 5, moodlet: 'sweet_treat' }, 6, 'drink', 'milk tea, black pearls', TA),
  dish('gen_taro_boba', 'Taro Slush', [E('boba')], 5.5, { fun: 12, hunger: 6 }, 6, 'drink', 'purple slush, fat straw', TA),
  dish('gen_soft_serve', 'Soft Serve Swirl', [E('boba'), E('snack')], 3.5, { hunger: 8, fun: 12, moodlet: 'sweet_treat' }, 5, 'dessert', 'white swirl in a cone', TA),
  dish('gen_donut', 'Glazed Donut', [E('donut'), 'gen_cafe', 'gen_diner'], 2, { hunger: 12, fun: 8 }, 3, 'snack', 'shiny ring donut', TA),
  dish('gen_donut_box', 'Half Dozen Donuts', [E('donut')], 9, { hunger: 40, fun: 14, moodlet: 'sweet_treat' }, 12, 'dessert', 'pink box of donuts', TA),
  dish('gen_fresh_juice', 'Fresh Orange Juice', [E('juice'), 'gen_cafe'], 4.5, { hunger: 6, energy: 8, fun: 4 }, 3, 'drink', 'tall glass, orange slice', TA),
  dish('gen_smoothie', 'Green Smoothie', [E('juice')], 6, { hunger: 14, energy: 8 }, 5, 'drink', 'green drink, straw', TA),
  dish('gen_pretzel', 'Soft Pretzel', [E('snack')], 3.5, { hunger: 16, fun: 4 }, 4, 'snack', 'brown twisted pretzel, salt', TA),
  dish('gen_tea_pot', 'Pot of Oolong', ['gen_tea'], 5, { energy: 6, fun: 8, social: 3 }, 14, 'drink', 'small iron teapot, cup'),
  dish('gen_matcha_latte', 'Matcha Latte', ['gen_tea', 'gen_cafe'], 5, { energy: 8, fun: 6, caffeine: true }, 8, 'drink', 'green latte, leaf art', TA),
  dish('gen_mochi', 'Mochi Trio', ['gen_tea'], 5, { hunger: 14, fun: 9 }, 6, 'dessert', 'three pastel rice cakes', TA),
  gift('gen_vinyl', 'Vinyl Record', ['gen_records'], 16, 'black disc, orange label', 8, ['music', 'cool']),
  gift('gen_mixtape', 'Mixtape Cassette', ['gen_records'], 6, 'cassette, handwritten label', 5, ['music', 'homemade']),
  gift('gen_comic', 'Comic Book', ['gen_comics', 'gen_retail_toys'], 5, 'bright cover, speech bubble', 4, ['fun', 'cute']),
  gift('gen_art_print', 'Local Art Print', ['gen_retail_gallery', 'gen_retail_art', 'gen_comics'], 22, 'framed abstract print', 9, ['fancy', 'art']),
  gift('gen_toy_robot', 'Wind-up Robot', ['gen_retail_toys'], 12, 'tin robot, red key', 6, ['cute', 'fun']),
  gift('gen_notebook', 'Fancy Notebook', ['gen_retail_stationery', 'gen_books'], 9, 'cloth-bound notebook, ribbon', 5, ['cozy']),
  gift('gen_pet_treats', 'Bag of Pet Treats', ['gen_retail_pets'], 6, 'paper bag, paw print', 4, ['cute']),
  gift('gen_cheese_board', 'Cheese Selection', ['gen_retail_cheese', 'gen_grocery_m'], 18, 'three wedges on a board', 8, ['fancy']),
  gift('gen_toolkit', 'Pocket Tool Kit', ['gen_retail_hardware'], 14, 'red roll of small tools', 5, ['handy']),
  gift('gen_bath_salts', 'Bath Salts', ['gen_retail_pharmacy'], 8, 'jar of blue crystals', 5, ['cozy']),
];
export const NEW_ITEM_IDS = NEW.map(i => i.id);
for (const it of NEW) if (!ITEM_BY_ID[it.id]) { ITEMS.push(it); ITEM_BY_ID[it.id] = it; if (it.category === 'dish') DISHES.push(it); }

/* ---------- existing items the generic types also stock (never mutate shared soldAt arrays in place) ---------- */
const also = (pred, ...types) => { for (const it of ITEMS) if (pred(it)) it.soldAt = it.soldAt.concat(types.filter(t => !it.soldAt.includes(t))); };
const at = (v, cats) => it => it.price > 0 && it.soldAt.includes(v) && (!cats || cats.includes(it.category));
const FOODCATS = ['ingredient', 'ready_meal', 'snack', 'drink'];
also(it => at('grocery', FOODCATS)(it) && !['flour', 'chocolate_chips', 'tofu', 'frozen_pizza', 'sports_drink'].includes(it.id), 'gen_grocery_m');
also(it => it.price > 0 && it.category === 'ingredient' && it.soldAt.includes('market_stalls') && !it.soldAt.includes('grocery'), 'gen_grocery_m');
also(it => ['gift_flowers', 'gift_chocolates', 'gift_wine'].includes(it.id), 'gen_grocery_m');
also(at('cornerstore', FOODCATS), 'gen_bodega'); also(it => ['umbrella', 'transit_pass', 'duck_feed', 'tomato', 'potato'].includes(it.id), 'gen_bodega');
also(at('cafe', ['dish']), 'gen_cafe'); also(it => ['cafe_tea', 'cafe_hot_chocolate', 'cafe_muffin', 'bakery_fruit_tart'].includes(it.id), 'gen_tea');
also(at('bakery'), 'gen_bakery'); also(at('diner', ['dish']), 'gen_diner'); also(at('bar', ['dish']), 'gen_bar'); also(at('restaurant', ['dish']), 'gen_restaurant');
also(it => ['ramen_gyoza', 'ramen_matcha_soda', 'bar_beer'].includes(it.id), E('dimsum'), E('hotpot'), E('kbbq')); also(it => ['stand_taco_single', 'stand_taco_burrito', 'stand_taco_horchata'].includes(it.id), E('taqueria'));
also(it => ['bakery_bagel', 'bakery_sandwich'].includes(it.id), E('bagels'), E('deli')); also(it => it.id === 'gen_pastrami', 'diner', 'gen_diner');   // QA round 3: no deli exists in the city, and the club sandwich teaser names this dish also(it => ['stand_icecream_cone', 'stand_icecream_popsicle', 'stand_hotdog_pretzel', 'pizza_soda'].includes(it.id), E('snack'));
also(it => ['pizza_soda', 'cafe_tea'].includes(it.id), E('pho'), E('falafel'), E('curry'), E('ethiopian'), E('soul'), E('seafood'), E('deli'), E('kbbq'), E('hotpot'));
also(it => ['cafe_iced_coffee', 'cafe_tea'].includes(it.id), E('boba'), E('donut'), E('bagels'));
{ const outs = ITEMS.filter(at('clothing', ['outfit'])); outs.forEach((it, i) => { it.soldAt = it.soldAt.concat(i % 2 ? ['gen_thrift'] : ['gen_boutique']); if (i % 3 === 0) it.soldAt = it.soldAt.concat(i % 2 ? ['gen_boutique'] : ['gen_thrift']); }); }
also(at('bookstore'), 'gen_books'); also(it => it.category === 'book' && /^novel_|creativity/.test(it.id), 'gen_comics', 'gen_retail_stationery'); also(it => ['sketchbook', 'canvas', 'gift_postcards'].includes(it.id), 'gen_retail_art', 'gen_retail_stationery', 'gen_comics', 'gen_records');   // (QA round 3: not the galleries, which sell gifts only; their postcards come from the next line)
also(it => it.category === 'gift' && (it.giftTags || []).some(t => t === 'floral' || t === 'green'), 'gen_retail_florist'); also(it => ['gift_candle', 'gift_postcards'].includes(it.id), 'gen_retail_florist', 'gen_retail_gallery', 'gen_retail_stationery');
also(it => ['gift_teddy'].includes(it.id), 'gen_retail_toys', 'gen_retail_pets'); also(it => ['duck_feed'].includes(it.id), 'gen_retail_pets'); also(it => ['fishing_rod', 'umbrella'].includes(it.id), 'gen_retail_hardware', 'gen_retail_toys');
also(it => ['granola_bar', 'chocolate_bar', 'juice', 'energy_drink', 'sports_drink', 'umbrella', 'gift_candle', 'gift_chocolates'].includes(it.id), 'gen_retail_pharmacy');
also(it => ['cheese', 'butter', 'milk', 'bread', 'gift_wine', 'gift_honey', 'eggs'].includes(it.id), 'gen_retail_cheese');

/** make a converted building its own venue: a copy of the type with its own id + sign name, stocked like the type */
export function registerInstance(typeId, id, name, district, extra) {
  const t = GEN_TYPES[typeId]; if (!t) return null; if (VENUE_BY_ID[id]) return VENUE_BY_ID[id];
  const v = Object.assign({}, t, { id, name, district, generic: false, genType: typeId, names: undefined, where: 'converted shopfront' }, extra);
  VENUE_BY_ID[id] = v; VENUES.push(v);
  for (const it of ITEMS) if (it.soldAt.includes(typeId)) it.soldAt = it.soldAt.concat(id);
  return v;
}
