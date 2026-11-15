// items.js — every thing the player can buy, carry, eat, wear, read, give or place in Maple Bay.
// Pure design data. Exports one array per category plus ITEMS (all of them) and ITEM_BY_ID.
//
// COMMON FIELDS (every item)
//   id         unique snake_case id across ALL categories.
//   name       display name.
//   category   'ingredient' | 'snack' | 'drink' | 'ready_meal' | 'dish' | 'meal' | 'homegood' |
//              'outfit' | 'book' | 'gift' | 'misc'.
//   price      list price in dollars. The buying venue's `priceMult` (venues.js) is applied on top
//              (Lucky Corner x1.2, Old Town Market x0.8). 0 = cannot be bought (made or free).
//   icon       short brief for the 12x12 pixel icon artist.
//   effects    what using/consuming ONE unit does. Need keys (hunger, energy, hygiene, fun, social)
//              are instant deltas on the 0..100 need. Other keys:
//                moodlet: id in needs.js MOODLETS to apply;  caffeine: true -> applies 'caffeinated'
//                and is halved while already caffeinated;  alcohol: n drinks (3+ within 3 h -> 'tipsy').
//              Non-consumables use {} and describe themselves through category-specific fields.
//   stack      max units per inventory slot.
//   soldAt     venue ids (venues.js) that stock it. [] = not sold (cooked, caught, grown, found).
//
// CATEGORY-SPECIFIC FIELDS
//   ingredient  shelfLifeDays (null = never spoils), needsFridge (spoils 4x faster outside a fridge),
//               edibleRaw (true = can be eaten as-is using `effects`), eatMinutes.
//   snack/drink/ready_meal   eatMinutes, shelfLifeDays, needsFridge, heat ('microwave' = must be heated
//               in a microwave OR on any stove before eating; null = eat anywhere).
//   dish        restaurant/cafe/stand menu entry. venue (single venue id), eatMinutes, takeaway
//               (true = can be carried and eaten elsewhere within 4 game hours), course
//               ('drink' | 'snack' | 'main' | 'dessert'), seasons (optional availability).
//   meal        output of a recipe (see RECIPES); shelfLifeDays in the fridge; reheating is optional.
//   homegood    tag (function tag: bed, fridge, stove, microwave, sofa, tv, computer, bookshelf, game,
//               music, shower, bath, exercise, instrument, easel, plant, rug, decor), tier (0|1|2),
//               footprint [w, d] in floor tiles, placement ('floor' | 'wall' | 'surface'),
//               bonus { mult, ambience, ...tag-specific } — see HOME GOODS section.
//   outfit      outfit (art/sprite key), styles (tags used by dress codes & perks), perk.
//   book        kind ('skill' | 'novel'), skill, minLevel, maxLevel, xpTotal, readMinutes.
//   gift        relationship (base points when given), giftTags (matched against NPC likes/dislikes:
//               a liked tag doubles the points, a disliked tag halves them).
//   misc        see each entry (passes carry `grants`; cookbooks carry `cookbook: true, teaches: [recipeIds]`).
//
// THE BIG COOKBOOK lives in recipes_extra.js (65 more ingredients, ~150 more recipes, cookbooks, how recipes are learned). This file
// merges it in below, so INGREDIENTS / RECIPES / MEALS / RECIPE_BY_ID / ITEMS here are always the complete lists.
import { INGREDIENTS_EXTRA, RECIPES_EXTRA, LEGACY_PATCH, RECIPE_CATS, LEARN_FROM, LEGACY_RECIPES, buildCookbooks } from './recipes_extra.js';
export { RECIPE_CATS, LEARN_FROM, LEGACY_RECIPES };

// ---------------------------------------------------------------------------------------------
// INVENTORY rules
// ---------------------------------------------------------------------------------------------
export const INVENTORY = {
  backpackSlots: 12,            // +up to 4 from the Fitness stat (needs.js FITNESS.bonusesAt100)
  outsideFridgeSpoilMult: 4,    // needsFridge items age 4x faster in the backpack or on a counter
  marketFreshBonusDays: 2,      // anything bought at market_stalls gets +2 days of shelf life
  takeawayHours: 4,             // takeaway dishes must be eaten within this many game hours
  spoiledBehaviour: 'becomes_compost', // spoiled food silently turns into 'compost' (no sickness, no smell)
  largeItemsDelivered: true,    // homegoods never enter the backpack; see economy.js DELIVERY
};

// ---------------------------------------------------------------------------------------------
// INGREDIENTS — one unit = one recipe portion.
// ---------------------------------------------------------------------------------------------
const G = ['grocery'];                          // FreshWay only
const GC = ['grocery', 'cornerstore'];          // also at Lucky Corner (x1.2)
const GM = ['grocery', 'market_stalls'];        // also at the market (x0.8, fresher)
const GCM = ['grocery', 'cornerstore', 'market_stalls'];

export const INGREDIENTS = [
  { id: 'bread', name: 'Bread', category: 'ingredient', price: 1, icon: 'small brown loaf, cream slice', effects: { hunger: 8 }, stack: 10, soldAt: ['grocery', 'cornerstore', 'bakery'], shelfLifeDays: 4, needsFridge: false, edibleRaw: true, eatMinutes: 3 },
  { id: 'eggs', name: 'Eggs', category: 'ingredient', price: 1, icon: 'two white eggs', effects: {}, stack: 10, soldAt: GCM, shelfLifeDays: 10, needsFridge: true, edibleRaw: false },
  { id: 'milk', name: 'Milk', category: 'ingredient', price: 1.5, icon: 'white carton, blue stripe', effects: { hunger: 5 }, stack: 10, soldAt: GC, shelfLifeDays: 6, needsFridge: true, edibleRaw: true, eatMinutes: 2 },
  { id: 'butter', name: 'Butter', category: 'ingredient', price: 1, icon: 'yellow block in foil', effects: {}, stack: 10, soldAt: GC, shelfLifeDays: 14, needsFridge: true, edibleRaw: false },
  { id: 'cheese', name: 'Cheese', category: 'ingredient', price: 2, icon: 'yellow wedge with holes', effects: { hunger: 8 }, stack: 10, soldAt: GCM, shelfLifeDays: 12, needsFridge: true, edibleRaw: true, eatMinutes: 3 },
  { id: 'rice', name: 'Rice', category: 'ingredient', price: 1, icon: 'small white sack', effects: {}, stack: 10, soldAt: GC, shelfLifeDays: null, needsFridge: false, edibleRaw: false },
  { id: 'pasta', name: 'Pasta', category: 'ingredient', price: 1.5, icon: 'blue box, yellow spirals', effects: {}, stack: 10, soldAt: GC, shelfLifeDays: null, needsFridge: false, edibleRaw: false },
  { id: 'flour', name: 'Flour', category: 'ingredient', price: 1, icon: 'paper bag, wheat mark', effects: {}, stack: 10, soldAt: ['grocery', 'bakery'], shelfLifeDays: null, needsFridge: false, edibleRaw: false },
  { id: 'noodles', name: 'Dried Noodles', category: 'ingredient', price: 1.5, icon: 'wavy noodle brick', effects: {}, stack: 10, soldAt: GC, shelfLifeDays: null, needsFridge: false, edibleRaw: false },
  { id: 'sugar', name: 'Sugar', category: 'ingredient', price: 1, icon: 'white bag, pink label', effects: {}, stack: 10, soldAt: GC, shelfLifeDays: null, needsFridge: false, edibleRaw: false },
  { id: 'tomato_sauce', name: 'Tomato Sauce', category: 'ingredient', price: 2, icon: 'red jar, green lid', effects: {}, stack: 10, soldAt: GC, shelfLifeDays: null, needsFridge: false, edibleRaw: false },
  { id: 'beans', name: 'Canned Beans', category: 'ingredient', price: 1.5, icon: 'tin can, orange label', effects: { hunger: 12 }, stack: 10, soldAt: GC, shelfLifeDays: null, needsFridge: false, edibleRaw: true, eatMinutes: 5 },
  { id: 'chocolate_chips', name: 'Chocolate Chips', category: 'ingredient', price: 2.5, icon: 'brown pouch, dark dots', effects: {}, stack: 10, soldAt: G, shelfLifeDays: null, needsFridge: false, edibleRaw: false },
  { id: 'tomato', name: 'Tomato', category: 'ingredient', price: 1, icon: 'red tomato, green top', effects: { hunger: 4 }, stack: 10, soldAt: GM, shelfLifeDays: 6, needsFridge: true, edibleRaw: true, eatMinutes: 2 },
  { id: 'onion', name: 'Onion', category: 'ingredient', price: 0.5, icon: 'golden onion', effects: {}, stack: 10, soldAt: GCM, shelfLifeDays: 14, needsFridge: false, edibleRaw: false },
  { id: 'potato', name: 'Potato', category: 'ingredient', price: 1, icon: 'lumpy tan potato', effects: {}, stack: 10, soldAt: GM, shelfLifeDays: 14, needsFridge: false, edibleRaw: false },
  { id: 'carrot', name: 'Carrot', category: 'ingredient', price: 0.5, icon: 'orange carrot, green tuft', effects: { hunger: 4 }, stack: 10, soldAt: GM, shelfLifeDays: 12, needsFridge: true, edibleRaw: true, eatMinutes: 2 },
  { id: 'lettuce', name: 'Lettuce', category: 'ingredient', price: 1.5, icon: 'frilly green head', effects: {}, stack: 10, soldAt: GM, shelfLifeDays: 5, needsFridge: true, edibleRaw: false },
  { id: 'mushroom', name: 'Mushrooms', category: 'ingredient', price: 2, icon: 'two tan mushrooms', effects: {}, stack: 10, soldAt: GM, shelfLifeDays: 5, needsFridge: true, edibleRaw: false },
  { id: 'apple', name: 'Apple', category: 'ingredient', price: 1, icon: 'red apple, leaf', effects: { hunger: 8, energy: 1 }, stack: 10, soldAt: GCM, shelfLifeDays: 12, needsFridge: false, edibleRaw: true, eatMinutes: 3 },
  { id: 'banana', name: 'Banana', category: 'ingredient', price: 1, icon: 'yellow banana', effects: { hunger: 8, energy: 2 }, stack: 10, soldAt: GC, shelfLifeDays: 5, needsFridge: false, edibleRaw: true, eatMinutes: 2 },
  { id: 'berries', name: 'Berries', category: 'ingredient', price: 2.5, icon: 'punnet of red and blue dots', effects: { hunger: 6, fun: 2 }, stack: 10, soldAt: GM, shelfLifeDays: 4, needsFridge: true, edibleRaw: true, eatMinutes: 3 },
  { id: 'lemon', name: 'Lemon', category: 'ingredient', price: 1, icon: 'bright yellow lemon', effects: {}, stack: 10, soldAt: GM, shelfLifeDays: 14, needsFridge: false, edibleRaw: false },
  { id: 'chicken', name: 'Chicken', category: 'ingredient', price: 4, icon: 'pink drumstick on tray', effects: {}, stack: 10, soldAt: G, shelfLifeDays: 3, needsFridge: true, edibleRaw: false },
  { id: 'beef', name: 'Beef', category: 'ingredient', price: 5, icon: 'red steak, white marbling', effects: {}, stack: 10, soldAt: G, shelfLifeDays: 3, needsFridge: true, edibleRaw: false },
  { id: 'fish', name: 'Fresh Fish', category: 'ingredient', price: 5, icon: 'silver fish, blue back', effects: {}, stack: 10, soldAt: GM, shelfLifeDays: 2, needsFridge: true, edibleRaw: false }, // also caught with the fish_pier activity
  { id: 'bacon', name: 'Bacon', category: 'ingredient', price: 3, icon: 'wavy red-pink strips', effects: {}, stack: 10, soldAt: GC, shelfLifeDays: 7, needsFridge: true, edibleRaw: false },
  { id: 'tofu', name: 'Tofu', category: 'ingredient', price: 2.5, icon: 'white cube in tub', effects: {}, stack: 10, soldAt: G, shelfLifeDays: 7, needsFridge: true, edibleRaw: false },
  ...INGREDIENTS_EXTRA, // pantry staples, tins, dairy, meat, seafood and produce for the big cookbook (recipes_extra.js)
];

// ---------------------------------------------------------------------------------------------
// SNACKS, DRINKS & READY MEALS — shop-bought, eaten from the backpack or at home.
// ---------------------------------------------------------------------------------------------
export const PACKAGED_FOOD = [
  { id: 'granola_bar', name: 'Granola Bar', category: 'snack', price: 2, icon: 'tan bar, green wrapper', effects: { hunger: 10, energy: 2 }, stack: 10, soldAt: ['grocery', 'cornerstore', 'gym'], eatMinutes: 2, shelfLifeDays: null, needsFridge: false, heat: null },
  { id: 'chips', name: 'Potato Chips', category: 'snack', price: 2, icon: 'red crinkly bag', effects: { hunger: 8, fun: 4 }, stack: 10, soldAt: GC, eatMinutes: 5, shelfLifeDays: null, needsFridge: false, heat: null },
  { id: 'chocolate_bar', name: 'Chocolate Bar', category: 'snack', price: 2, icon: 'brown bar, gold foil corner', effects: { hunger: 6, fun: 6 }, stack: 10, soldAt: GC, eatMinutes: 2, shelfLifeDays: null, needsFridge: false, heat: null },
  { id: 'yogurt', name: 'Yogurt Cup', category: 'snack', price: 1.5, icon: 'white cup, berry lid', effects: { hunger: 10 }, stack: 10, soldAt: G, eatMinutes: 3, shelfLifeDays: 8, needsFridge: true, heat: null },
  { id: 'sandwich', name: 'Packed Sandwich', category: 'ready_meal', price: 5, icon: 'triangle sandwich in clear box', effects: { hunger: 30 }, stack: 5, soldAt: GC, eatMinutes: 8, shelfLifeDays: 2, needsFridge: true, heat: null },
  { id: 'instant_ramen', name: 'Cup Noodles', category: 'ready_meal', price: 2, icon: 'white cup, red swirl, steam', effects: { hunger: 25, fun: 1 }, stack: 10, soldAt: GC, eatMinutes: 8, shelfLifeDays: null, needsFridge: false, heat: 'microwave' },
  { id: 'frozen_dinner', name: 'Frozen Dinner', category: 'ready_meal', price: 5, icon: 'black tray, three coloured compartments', effects: { hunger: 40 }, stack: 5, soldAt: GC, eatMinutes: 12, shelfLifeDays: 28, needsFridge: true, heat: 'microwave' },
  { id: 'frozen_pizza', name: 'Frozen Pizza', category: 'ready_meal', price: 6, icon: 'flat box with pizza photo', effects: { hunger: 45, fun: 4 }, stack: 5, soldAt: G, eatMinutes: 15, shelfLifeDays: 28, needsFridge: true, heat: 'microwave' },
  { id: 'ice_cream_tub', name: 'Ice Cream Tub', category: 'snack', price: 5, icon: 'round tub, pink swirl', effects: { hunger: 10, fun: 12, moodlet: 'sweet_treat' }, stack: 3, soldAt: GC, eatMinutes: 10, shelfLifeDays: 28, needsFridge: true, heat: null },
  { id: 'soda', name: 'Fizz Cola', category: 'drink', price: 2, icon: 'red can, white wave', effects: { fun: 4, energy: 3 }, stack: 10, soldAt: GC, eatMinutes: 2, shelfLifeDays: null, needsFridge: false, heat: null },
  { id: 'juice', name: 'Orange Juice', category: 'drink', price: 2.5, icon: 'small orange bottle', effects: { hunger: 5, energy: 4 }, stack: 10, soldAt: GC, eatMinutes: 2, shelfLifeDays: 7, needsFridge: true, heat: null },
  { id: 'canned_coffee', name: 'Canned Coffee', category: 'drink', price: 2.5, icon: 'slim brown can', effects: { energy: 10, caffeine: true }, stack: 10, soldAt: GC, eatMinutes: 2, shelfLifeDays: null, needsFridge: false, heat: null },
  { id: 'energy_drink', name: 'Volt Energy', category: 'drink', price: 3, icon: 'neon green can, lightning', effects: { energy: 15, caffeine: true }, stack: 10, soldAt: ['grocery', 'cornerstore', 'gym'], eatMinutes: 2, shelfLifeDays: null, needsFridge: false, heat: null },
  { id: 'sports_drink', name: 'Hydro Blue', category: 'drink', price: 2.5, icon: 'blue bottle, white cap', effects: { energy: 6 }, stack: 10, soldAt: ['grocery', 'gym'], eatMinutes: 2, shelfLifeDays: null, needsFridge: false, heat: null },
  { id: 'kettle_corn', name: 'Kettle Corn', category: 'snack', price: 3.75, icon: 'paper cone of popcorn', effects: { hunger: 10, fun: 6 }, stack: 5, soldAt: ['market_stalls'], eatMinutes: 5, shelfLifeDays: 5, needsFridge: false, heat: null },
  { id: 'hot_cider', name: 'Hot Apple Cider', category: 'drink', price: 3.75, icon: 'steaming paper cup, cinnamon stick', effects: { fun: 8, energy: 3, moodlet: 'sweet_treat' }, stack: 1, soldAt: ['market_stalls'], eatMinutes: 5, shelfLifeDays: 1, needsFridge: false, heat: null, seasons: ['autumn', 'winter'] },
];

// ---------------------------------------------------------------------------------------------
// DISHES — menus. Eaten at the venue (anim: eat/drink). Prices include nothing extra; tipping is
// optional (economy.js TIPPING). Rough value: eating out costs $0.20-0.30 per hunger point,
// fine dining $0.50+ (you are paying for the fun and the moodlet), home cooking ~$0.03-0.11.
// ---------------------------------------------------------------------------------------------
const dish = (id, name, venue, price, effects, eatMinutes, course, icon, extra = {}) =>
  ({ id, name, category: 'dish', price, icon, effects, stack: 1, soldAt: [venue], venue, eatMinutes, course, takeaway: false, ...extra });
const TA = { takeaway: true };

export const DISHES = [
  // Bean & Gone (cafe)
  dish('cafe_espresso', 'Espresso', 'cafe', 3, { energy: 10, caffeine: true }, 5, 'drink', 'tiny white cup, dark coffee', TA),
  dish('cafe_latte', 'Maple Latte', 'cafe', 4.5, { energy: 10, fun: 4, caffeine: true }, 10, 'drink', 'tall cup, leaf latte art', TA),
  dish('cafe_iced_coffee', 'Iced Coffee', 'cafe', 4.5, { energy: 10, fun: 3, caffeine: true }, 8, 'drink', 'clear cup, ice, straw', TA),
  dish('cafe_tea', 'Pot of Tea', 'cafe', 3, { energy: 4, fun: 5 }, 12, 'drink', 'small blue teapot'),
  dish('cafe_hot_chocolate', 'Hot Chocolate', 'cafe', 4, { hunger: 5, fun: 8, moodlet: 'sweet_treat' }, 10, 'drink', 'mug with marshmallows', TA),
  dish('cafe_croissant', 'Butter Croissant', 'cafe', 3.5, { hunger: 15, fun: 2 }, 6, 'snack', 'golden crescent', TA),
  dish('cafe_muffin', 'Blueberry Muffin', 'cafe', 3, { hunger: 14, fun: 3 }, 6, 'snack', 'muffin, blue dots', TA),
  dish('cafe_avocado_toast', 'Avocado Toast', 'cafe', 8, { hunger: 35, fun: 3 }, 15, 'main', 'toast, green top, egg'),

  // Rise & Shine Bakery
  dish('bakery_cinnamon_roll', 'Cinnamon Roll', 'bakery', 3.5, { hunger: 16, fun: 6, moodlet: 'sweet_treat' }, 6, 'snack', 'spiral bun, white icing', TA),
  dish('bakery_bagel', 'Seeded Bagel', 'bakery', 3, { hunger: 20 }, 6, 'snack', 'bagel with seeds', TA),
  dish('bakery_sandwich', 'Sourdough Sandwich', 'bakery', 7, { hunger: 38, fun: 2 }, 12, 'main', 'thick sandwich, lettuce frill', TA),
  dish('bakery_fruit_tart', 'Fruit Tart', 'bakery', 5, { hunger: 15, fun: 10, moodlet: 'sweet_treat' }, 8, 'dessert', 'round tart, red berries', TA),
  dish('bakery_quiche', 'Slice of Quiche', 'bakery', 6, { hunger: 32, fun: 2 }, 10, 'main', 'yellow wedge, brown crust', TA),

  // Dot's Diner
  dish('diner_coffee', 'Bottomless Coffee', 'diner', 2.5, { energy: 12, caffeine: true }, 8, 'drink', 'thick white mug'),
  dish('diner_pancakes', 'Pancake Stack', 'diner', 8, { hunger: 42, fun: 6 }, 18, 'main', 'three pancakes, butter pat, syrup'),
  dish('diner_breakfast', 'All-Day Breakfast', 'diner', 10, { hunger: 55, fun: 4, moodlet: 'good_meal' }, 20, 'main', 'plate: eggs, bacon, toast'),
  dish('diner_burger', 'Cheeseburger & Fries', 'diner', 11, { hunger: 58, fun: 6, moodlet: 'good_meal' }, 20, 'main', 'burger with fries'),
  dish('diner_grilled_cheese', 'Grilled Cheese & Soup', 'diner', 8, { hunger: 45, fun: 4 }, 15, 'main', 'toastie beside red soup bowl'),
  dish('diner_pie', 'Slice of Cherry Pie', 'diner', 4.5, { hunger: 15, fun: 10, moodlet: 'sweet_treat' }, 8, 'dessert', 'pie wedge, red filling'),
  dish('diner_milkshake', 'Strawberry Milkshake', 'diner', 5, { hunger: 12, fun: 10 }, 10, 'drink', 'tall pink glass, cherry'),

  // Noodle Lantern (ramen)
  dish('ramen_shoyu', 'Shoyu Ramen', 'ramen', 11, { hunger: 55, fun: 6, moodlet: 'good_meal' }, 18, 'main', 'bowl, noodles, half egg'),
  dish('ramen_spicy_miso', 'Spicy Miso Ramen', 'ramen', 12, { hunger: 58, fun: 8, energy: 3, moodlet: 'good_meal' }, 18, 'main', 'red broth bowl, chili'),
  dish('ramen_veggie', 'Garden Ramen', 'ramen', 10, { hunger: 50, fun: 6 }, 18, 'main', 'bowl with greens and corn'),
  dish('ramen_gyoza', 'Gyoza (5)', 'ramen', 6, { hunger: 22, fun: 4 }, 10, 'snack', 'row of dumplings'),
  dish('ramen_matcha_soda', 'Matcha Soda', 'ramen', 3.5, { fun: 5, energy: 4 }, 5, 'drink', 'green fizzy glass'),

  // Slice of Heaven (pizza)
  dish('pizza_slice', 'Cheese Slice', 'pizza', 3.5, { hunger: 22, fun: 4 }, 6, 'snack', 'single triangle slice', TA),
  dish('pizza_margherita', 'Margherita Pie', 'pizza', 14, { hunger: 60, fun: 8, moodlet: 'good_meal' }, 25, 'main', 'whole pizza, basil leaves', { takeaway: true, shareable: 2 }),
  dish('pizza_pepperoni', 'Pepperoni Pie', 'pizza', 16, { hunger: 65, fun: 9, moodlet: 'good_meal' }, 25, 'main', 'whole pizza, red discs', { takeaway: true, shareable: 2 }),
  dish('pizza_garlic_knots', 'Garlic Knots', 'pizza', 5, { hunger: 18, fun: 3 }, 8, 'snack', 'three knotted rolls', TA),
  dish('pizza_tiramisu', 'Tiramisu', 'pizza', 6, { hunger: 14, fun: 10, moodlet: 'sweet_treat' }, 8, 'dessert', 'layered square, cocoa top'),
  dish('pizza_soda', 'Fountain Soda', 'pizza', 2.5, { fun: 4, energy: 3 }, 5, 'drink', 'paper cup, striped straw', TA),

  // The Gilded Gull (fine dining; dress code)
  dish('gull_oysters', 'Bay Oysters', 'restaurant', 16, { hunger: 18, fun: 14 }, 15, 'snack', 'three oysters on ice, lemon'),
  dish('gull_bisque', 'Lobster Bisque', 'restaurant', 14, { hunger: 28, fun: 10 }, 15, 'snack', 'orange soup, cream swirl'),
  dish('gull_catch', 'Catch of the Day', 'restaurant', 34, { hunger: 65, fun: 18, moodlet: 'fine_dining' }, 35, 'main', 'fish fillet, green sauce, gold rim plate'),
  dish('gull_steak', 'Steak Frites', 'restaurant', 38, { hunger: 70, fun: 18, moodlet: 'fine_dining' }, 35, 'main', 'steak, stacked fries'),
  dish('gull_tasting', "Chef's Tasting Menu", 'restaurant', 68, { hunger: 80, fun: 30, social: 5, moodlet: 'fine_dining' }, 90, 'main', 'three tiny plates in a row'),
  dish('gull_souffle', 'Chocolate Souffle', 'restaurant', 12, { hunger: 12, fun: 14, moodlet: 'sweet_treat' }, 12, 'dessert', 'risen souffle in ramekin'),
  dish('gull_sparkling', 'Glass of Sparkling', 'restaurant', 10, { fun: 10, alcohol: 1 }, 10, 'drink', 'flute with bubbles'),

  // The Blue Heron (bar)
  dish('bar_beer', 'Heron Draft', 'bar', 6, { fun: 8, social: 3, alcohol: 1 }, 15, 'drink', 'pint glass, foam head'),
  dish('bar_cocktail', 'Blue Heron', 'bar', 10, { fun: 14, social: 3, alcohol: 1 }, 15, 'drink', 'blue cocktail, orange twist'),
  dish('bar_mocktail', 'Garden Spritz (no alcohol)', 'bar', 6, { fun: 9, social: 3 }, 15, 'drink', 'green spritz, mint sprig'),
  dish('bar_nuts', 'Bar Nuts', 'bar', 4, { hunger: 10, fun: 2 }, 8, 'snack', 'small bowl of nuts'),
  dish('bar_nachos', 'Loaded Nachos', 'bar', 9, { hunger: 35, fun: 6, social: 2 }, 15, 'main', 'chip pile, cheese, green dots', { shareable: 2 }),

  // The Orpheum (cinema snack counter)
  dish('cinema_popcorn', 'Buttered Popcorn', 'cinema', 6, { hunger: 15, fun: 6 }, 10, 'snack', 'striped tub of popcorn', TA),
  dish('cinema_candy', 'Box of Sour Stars', 'cinema', 4, { hunger: 5, fun: 6, moodlet: 'sweet_treat' }, 5, 'snack', 'purple candy box', TA),
  dish('cinema_soda', 'Large Soda', 'cinema', 4, { fun: 4, energy: 3 }, 5, 'drink', 'big paper cup, lid', TA),

  // Street stands
  dish('stand_hotdog_classic', 'Classic Dog', 'stand_hotdog', 4, { hunger: 28, fun: 2 }, 6, 'main', 'hot dog, mustard zigzag', TA),
  dish('stand_hotdog_loaded', 'The Works', 'stand_hotdog', 6, { hunger: 36, fun: 4 }, 8, 'main', 'hot dog piled with toppings', TA),
  dish('stand_hotdog_pretzel', 'Soft Pretzel', 'stand_hotdog', 3, { hunger: 16, fun: 2 }, 5, 'snack', 'brown pretzel, salt dots', TA),
  dish('stand_coffee_drip', 'Drip Coffee', 'stand_coffee', 2.5, { energy: 10, caffeine: true }, 5, 'drink', 'paper cup, brown sleeve', TA),
  dish('stand_coffee_cocoa', 'Cocoa To Go', 'stand_coffee', 3, { hunger: 4, fun: 6 }, 5, 'drink', 'paper cup, whipped top', TA),
  dish('stand_coffee_danish', 'Cheese Danish', 'stand_coffee', 3, { hunger: 14, fun: 2 }, 5, 'snack', 'square pastry, pale centre', TA),
  dish('stand_icecream_cone', 'Single Scoop', 'stand_icecream', 3.5, { hunger: 8, fun: 12, moodlet: 'sweet_treat' }, 6, 'dessert', 'cone, pink scoop', TA),
  dish('stand_icecream_double', 'Double Scoop', 'stand_icecream', 5, { hunger: 12, fun: 16, moodlet: 'sweet_treat' }, 8, 'dessert', 'cone, two scoops', TA),
  dish('stand_icecream_popsicle', 'Rocket Pop', 'stand_icecream', 2.5, { hunger: 4, fun: 8 }, 5, 'dessert', 'red-white-blue ice lolly', TA),
  dish('stand_taco_single', 'Street Taco', 'stand_taco', 3.5, { hunger: 20, fun: 4 }, 5, 'snack', 'folded taco, green and red', TA),
  dish('stand_taco_burrito', 'Moon Burrito', 'stand_taco', 8, { hunger: 50, fun: 5, moodlet: 'good_meal' }, 12, 'main', 'foil-wrapped burrito', TA),
  dish('stand_taco_horchata', 'Horchata', 'stand_taco', 3, { fun: 6, energy: 3 }, 5, 'drink', 'milky drink, cinnamon', TA),

  // Old Town Market (list prices; the market's x0.8 priceMult applies)
  dish('market_dumplings', 'Steamed Dumplings', 'market_stalls', 6.25, { hunger: 28, fun: 5 }, 8, 'main', 'bamboo steamer, three dumplings', TA),
  dish('market_crepe', 'Lemon Sugar Crepe', 'market_stalls', 5, { hunger: 18, fun: 8, moodlet: 'sweet_treat' }, 6, 'dessert', 'folded crepe in paper', TA),
  dish('market_chestnuts', 'Roasted Chestnuts', 'market_stalls', 5, { hunger: 14, fun: 6 }, 6, 'snack', 'paper bag of brown chestnuts', { takeaway: true, seasons: ['autumn', 'winter'] }),
];

// ---------------------------------------------------------------------------------------------
// RECIPES — cooked with the `cook` activity (activities.js).
//   id           recipe id; the produced item id is 'meal_' + id.
//   name / icon  name and icon of the produced meal.
//   ingredients  { ingredientId: units } consumed per batch.
//   skill        minimum cooking level.
//   appliance    'none' (counter prep, no heat) | 'stove'.
//   stoveTier    minimum stove tier (0 hot plate, 1 range with oven, 2 chef's range). Ignored for 'none'.
//   cookMinutes  game minutes at cooking level = skill requirement on a tier-0/required stove.
//                Final time = cookMinutes * stove cookTimeMult * (1 - 0.03 * (cookingLevel - 1)).
//   servings     meals produced per batch (extra servings go to the fridge as leftovers).
//   effects      per serving. All home-cooked meals also apply the 'home_cooked' moodlet unless a
//                different moodlet is listed.
//   eatMinutes   time to eat one serving.
//   shelfLifeDays  leftovers in the fridge.
//   xp           cooking xp for cooking one batch.
//   giftable     true = a serving can be given as a gift (relationship in `gift`).
//   cat / oven / drink / learn   menu tab, needs-an-oven flag, drink flag and how the recipe is learned — see recipes_extra.js.
// Ingredient cost per serving is about $1.20-$5 (run validate.mjs --summary) — far cheaper than
// eating out, at the price of time. Big-batch recipes at higher skill are the best value.
// ---------------------------------------------------------------------------------------------
export const RECIPES = [
  { id: 'garden_salad', name: 'Garden Salad', icon: 'green bowl, red and orange bits', ingredients: { lettuce: 1, tomato: 1, carrot: 1, lemon: 1 }, skill: 1, appliance: 'none', stoveTier: 0, cookMinutes: 10, servings: 2, effects: { hunger: 25, energy: 3 }, eatMinutes: 10, shelfLifeDays: 2, xp: 15 },
  { id: 'scrambled_eggs', name: 'Scrambled Eggs on Toast', icon: 'yellow eggs on toast', ingredients: { eggs: 1, bread: 1, butter: 1 }, skill: 1, appliance: 'stove', stoveTier: 0, cookMinutes: 15, servings: 1, effects: { hunger: 35, fun: 2 }, eatMinutes: 10, shelfLifeDays: 1, xp: 20 },
  { id: 'grilled_cheese', name: 'Grilled Cheese', icon: 'golden toastie, cheese drip', ingredients: { bread: 1, cheese: 1, butter: 1 }, skill: 1, appliance: 'stove', stoveTier: 0, cookMinutes: 12, servings: 1, effects: { hunger: 36, fun: 4 }, eatMinutes: 10, shelfLifeDays: 1, xp: 20 },
  { id: 'noodle_soup', name: 'Egg Noodle Soup', icon: 'bowl, noodles, egg, carrot coins', ingredients: { noodles: 1, eggs: 1, carrot: 1 }, skill: 1, appliance: 'stove', stoveTier: 0, cookMinutes: 15, servings: 1, effects: { hunger: 40, fun: 2 }, eatMinutes: 12, shelfLifeDays: 2, xp: 20 },
  { id: 'bacon_and_eggs', name: 'Bacon & Eggs', icon: 'two eggs, bacon strips', ingredients: { bacon: 1, eggs: 1, bread: 1 }, skill: 2, appliance: 'stove', stoveTier: 0, cookMinutes: 20, servings: 1, effects: { hunger: 46, fun: 4 }, eatMinutes: 12, shelfLifeDays: 1, xp: 28 },
  { id: 'pancakes', name: 'Berry Pancakes', icon: 'pancake stack, berries on top', ingredients: { flour: 1, eggs: 1, milk: 1, berries: 1 }, skill: 2, appliance: 'stove', stoveTier: 0, cookMinutes: 25, servings: 2, effects: { hunger: 38, fun: 8 }, eatMinutes: 12, shelfLifeDays: 2, xp: 32 },
  { id: 'tomato_pasta', name: 'Tomato Pasta', icon: 'red spirals in bowl, basil', ingredients: { pasta: 1, tomato_sauce: 1, onion: 1 }, skill: 2, appliance: 'stove', stoveTier: 0, cookMinutes: 25, servings: 2, effects: { hunger: 45, fun: 4 }, eatMinutes: 15, shelfLifeDays: 3, xp: 32 },
  { id: 'veggie_stir_fry', name: 'Veggie Stir-Fry', icon: 'rice bowl, tofu cubes, greens', ingredients: { rice: 1, tofu: 1, carrot: 1, mushroom: 1 }, skill: 3, appliance: 'stove', stoveTier: 0, cookMinutes: 30, servings: 2, effects: { hunger: 48, fun: 6, energy: 2 }, eatMinutes: 15, shelfLifeDays: 3, xp: 40 },
  { id: 'choc_chip_cookies', name: 'Choc Chip Cookies', icon: 'round cookie, dark chips', ingredients: { flour: 1, butter: 1, sugar: 1, chocolate_chips: 1, eggs: 1 }, skill: 3, appliance: 'stove', stoveTier: 1, cookMinutes: 35, servings: 6, effects: { hunger: 12, fun: 10, moodlet: 'sweet_treat' }, eatMinutes: 4, shelfLifeDays: 7, xp: 45, giftable: true, gift: { relationship: 7, giftTags: ['sweet', 'homemade'] } },
  { id: 'chicken_rice_bowl', name: 'Chicken Rice Bowl', icon: 'rice bowl, glazed chicken', ingredients: { chicken: 1, rice: 1, onion: 1 }, skill: 3, appliance: 'stove', stoveTier: 0, cookMinutes: 35, servings: 2, effects: { hunger: 52, fun: 5 }, eatMinutes: 15, shelfLifeDays: 3, xp: 42 },
  { id: 'fish_and_chips', name: 'Fish & Chips', icon: 'battered fish, chips, lemon wedge', ingredients: { fish: 1, potato: 1, flour: 1 }, skill: 4, appliance: 'stove', stoveTier: 1, cookMinutes: 40, servings: 2, effects: { hunger: 55, fun: 8 }, eatMinutes: 15, shelfLifeDays: 2, xp: 52 },
  { id: 'beef_stew', name: 'Beef Stew', icon: 'brown stew pot, orange chunks', ingredients: { beef: 1, potato: 1, carrot: 1, onion: 1 }, skill: 5, appliance: 'stove', stoveTier: 1, cookMinutes: 60, servings: 4, effects: { hunger: 58, fun: 6, energy: 3 }, eatMinutes: 15, shelfLifeDays: 4, xp: 65 },
  { id: 'homemade_pizza', name: 'Homemade Pizza', icon: 'rustic pizza, uneven crust', ingredients: { flour: 1, tomato_sauce: 1, cheese: 1, mushroom: 1 }, skill: 5, appliance: 'stove', stoveTier: 1, cookMinutes: 50, servings: 4, effects: { hunger: 50, fun: 12 }, eatMinutes: 15, shelfLifeDays: 3, xp: 65 },
  { id: 'mushroom_risotto', name: 'Mushroom Risotto', icon: 'creamy rice, mushroom slices', ingredients: { rice: 1, mushroom: 1, cheese: 1, butter: 1, onion: 1 }, skill: 6, appliance: 'stove', stoveTier: 1, cookMinutes: 45, servings: 2, effects: { hunger: 56, fun: 10 }, eatMinutes: 18, shelfLifeDays: 3, xp: 75 },
  { id: 'lemon_tart', name: 'Lemon Tart', icon: 'yellow tart, crimped crust', ingredients: { flour: 1, butter: 1, sugar: 1, lemon: 1, eggs: 1 }, skill: 7, appliance: 'stove', stoveTier: 1, cookMinutes: 60, servings: 4, effects: { hunger: 18, fun: 16, moodlet: 'sweet_treat' }, eatMinutes: 6, shelfLifeDays: 4, xp: 85, giftable: true, gift: { relationship: 10, giftTags: ['sweet', 'homemade', 'fancy'] } },
  { id: 'sunday_roast', name: 'Sunday Roast', icon: 'roast chicken, potatoes around', ingredients: { chicken: 2, potato: 2, carrot: 1, onion: 1, butter: 1 }, skill: 8, appliance: 'stove', stoveTier: 2, cookMinutes: 90, servings: 4, effects: { hunger: 68, fun: 14, moodlet: 'good_meal' }, eatMinutes: 20, shelfLifeDays: 3, xp: 110 },
  { id: 'bay_paella', name: 'Bay Paella', icon: 'wide pan, yellow rice, fish, lemon', ingredients: { fish: 2, rice: 2, tomato: 1, onion: 1, lemon: 1 }, skill: 9, appliance: 'stove', stoveTier: 2, cookMinutes: 70, servings: 4, effects: { hunger: 68, fun: 18, moodlet: 'fine_dining' }, eatMinutes: 20, shelfLifeDays: 2, xp: 130 },
];
for (const r of RECIPES) Object.assign(r, LEGACY_PATCH[r.id]);   // menu tab / oven flag / how it is learned for the originals
RECIPES.push(...RECIPES_EXTRA);                                   // + the big cookbook

/** Cooked meals as inventory items, derived from RECIPES (id = 'meal_' + recipe id). */
export const MEALS = RECIPES.map((r) => ({
  id: 'meal_' + r.id, name: r.name, category: 'meal', price: 0, icon: r.icon,
  effects: r.effects.moodlet || r.drink ? r.effects : { ...r.effects, moodlet: 'home_cooked' },
  stack: 4, soldAt: [], recipe: r.id, ...(r.drink ? { course: 'drink' } : {}), eatMinutes: r.eatMinutes, shelfLifeDays: r.shelfLifeDays, needsFridge: true, heat: null,
  ...(r.giftable ? { giftable: true, relationship: r.gift.relationship, giftTags: r.gift.giftTags } : {}),
}));

// ---------------------------------------------------------------------------------------------
// HOME GOODS — sold at Nest & Wire ('homegoods'), delivered (economy.js DELIVERY).
// Canonical id = `${tag}_t${tier}`; extra decor pieces use `decor_<name>` / `plant_<name>`.
//
// HOW TIERS WORK
//   Activities in activities.js list their rates for a TIER 0 object. The object's `bonus.mult`
//   multiplies the activity's PRIMARY benefit (flagged `tierScales` on the activity):
//     bed -> energy/h while sleeping;  tv, game, music, bath(fun) -> fun/h;  shower, bath -> hygiene/h;
//     computer, bookshelf, exercise, instrument, easel -> skill xp/h (and computer fun/h);
//     sofa -> fun/h of any activity done sitting on it (tv, read, games);  microwave -> hunger of
//     heated ready meals.  Rule of thumb: tier 0 = x1.0, tier 1 = x1.25, tier 2 = x1.5.
//   `bonus.ambience` adds to the home's ambience score (homes.js AMBIENCE_TIERS -> 'homey' etc.).
//   Tag-specific extras:
//     fridge  { slots, shelfLifeMult }          stove { stoveTier, cookTimeMult, mealEffectMult }
//     microwave { heatMinutes }                 sofa  { seats, comfortEnergyPerHour }
//     bookshelf { capacity }                    computer { gigPayMult }
//     easel { artValueMult }                    game { players }
//     music { ambientFunPerHour } (fun trickle for everyone in the room while it plays)
//     bed { sleeps }                            shower/bath { moodlet } applied after a full use
// ---------------------------------------------------------------------------------------------
const hg = (tag, tier, name, price, footprint, placement, bonus, icon) =>
  ({ id: `${tag}_t${tier}`, name, category: 'homegood', price, icon, effects: {}, stack: 1, soldAt: ['homegoods'], tag, tier, footprint, placement, bonus });

export const HOMEGOODS = [
  hg('bed', 0, 'Floor Mattress', 60, [1, 2], 'floor', { mult: 1.0, ambience: 0, sleeps: 1 }, 'flat grey mattress, one pillow'),
  hg('bed', 1, 'Maple Frame Bed', 320, [1, 2], 'floor', { mult: 1.25, ambience: 1, sleeps: 1 }, 'wooden bed, blue duvet'),
  hg('bed', 2, 'Cloud Nine Double', 950, [2, 2], 'floor', { mult: 1.5, ambience: 2, sleeps: 2 }, 'wide bed, tufted headboard, white duvet'),

  hg('fridge', 0, 'Mini Fridge', 90, [1, 1], 'floor', { mult: 1.0, ambience: 0, slots: 8, shelfLifeMult: 1.0 }, 'small white cube fridge'),
  hg('fridge', 1, 'Two-Door Fridge', 380, [1, 1], 'floor', { mult: 1.0, ambience: 1, slots: 16, shelfLifeMult: 1.25 }, 'tall cream fridge, two doors'),
  hg('fridge', 2, 'SmartChill Pro', 900, [1, 1], 'floor', { mult: 1.0, ambience: 2, slots: 28, shelfLifeMult: 1.5 }, 'steel fridge, small blue screen'),

  hg('stove', 0, 'Hot Plate', 40, [1, 1], 'surface', { mult: 1.0, ambience: 0, stoveTier: 0, cookTimeMult: 1.0, mealEffectMult: 1.0 }, 'single black burner, red coil'),
  hg('stove', 1, 'Gas Range & Oven', 420, [1, 1], 'floor', { mult: 1.0, ambience: 1, stoveTier: 1, cookTimeMult: 0.85, mealEffectMult: 1.05 }, 'white cooker, four burners, oven door'),
  hg('stove', 2, "Chef's Range", 1100, [2, 1], 'floor', { mult: 1.0, ambience: 2, stoveTier: 2, cookTimeMult: 0.7, mealEffectMult: 1.1 }, 'wide steel range, red knobs'),

  hg('microwave', 0, 'Dorm Microwave', 45, [1, 1], 'surface', { mult: 1.0, ambience: 0, heatMinutes: 5 }, 'small beige microwave'),
  hg('microwave', 1, 'QuickWave 900', 120, [1, 1], 'surface', { mult: 1.1, ambience: 0, heatMinutes: 3 }, 'black microwave, green digits'),
  hg('microwave', 2, 'Combi Steam Oven', 340, [1, 1], 'surface', { mult: 1.2, ambience: 1, heatMinutes: 2 }, 'steel oven, glass door, dial'),

  hg('sofa', 0, 'Hand-Me-Down Futon', 80, [2, 1], 'floor', { mult: 1.0, ambience: 0, seats: 2, comfortEnergyPerHour: 1 }, 'saggy olive futon'),
  hg('sofa', 1, 'Corduroy Three-Seater', 360, [3, 1], 'floor', { mult: 1.1, ambience: 1, seats: 3, comfortEnergyPerHour: 2 }, 'mustard sofa, two cushions'),
  hg('sofa', 2, 'Velvet Chesterfield', 980, [3, 1], 'floor', { mult: 1.2, ambience: 3, seats: 4, comfortEnergyPerHour: 3 }, 'deep teal buttoned sofa'),

  hg('tv', 0, 'Thrifted Tube TV', 70, [1, 1], 'floor', { mult: 1.0, ambience: 0 }, 'boxy TV, rabbit-ear antenna'),
  hg('tv', 1, '40-inch Flatscreen', 340, [2, 1], 'floor', { mult: 1.25, ambience: 1 }, 'slim black screen on low stand'),
  hg('tv', 2, 'Cinema Wall OLED', 1200, [3, 1], 'wall', { mult: 1.5, ambience: 2 }, 'huge thin screen, soundbar'),

  hg('computer', 0, 'Refurbished Laptop', 220, [1, 1], 'surface', { mult: 1.0, ambience: 0, gigPayMult: 1.0 }, 'grey laptop, sticker on lid'),
  hg('computer', 1, 'Desktop Workstation', 650, [2, 1], 'floor', { mult: 1.25, ambience: 1, gigPayMult: 1.1 }, 'desk, monitor, tower'),
  hg('computer', 2, 'Creator Rig', 1500, [2, 1], 'floor', { mult: 1.5, ambience: 2, gigPayMult: 1.2 }, 'two monitors, glowing tower'),

  hg('bookshelf', 0, 'Crate Shelf', 35, [1, 1], 'floor', { mult: 1.0, ambience: 0, capacity: 6 }, 'stacked wooden crates, few books'),
  hg('bookshelf', 1, 'Oak Bookcase', 180, [1, 1], 'floor', { mult: 1.15, ambience: 1, capacity: 16 }, 'tall bookcase, colourful spines'),
  hg('bookshelf', 2, 'Library Wall', 620, [3, 1], 'wall', { mult: 1.3, ambience: 3, capacity: 40 }, 'wall of books with rolling ladder'),

  hg('game', 0, 'Board Game Stack', 30, [1, 1], 'surface', { mult: 1.0, ambience: 0, players: 4 }, 'three stacked game boxes'),
  hg('game', 1, 'PlayBox Console', 280, [1, 1], 'surface', { mult: 1.25, ambience: 0, players: 2 }, 'white console, two controllers'),
  hg('game', 2, 'Retro Arcade Cabinet', 850, [1, 1], 'floor', { mult: 1.5, ambience: 2, players: 2 }, 'tall arcade cabinet, glowing marquee'),

  hg('music', 0, 'Pocket Radio', 25, [1, 1], 'surface', { mult: 1.0, ambience: 0, ambientFunPerHour: 1 }, 'small red radio, antenna'),
  hg('music', 1, 'Bookshelf Stereo', 190, [1, 1], 'surface', { mult: 1.25, ambience: 1, ambientFunPerHour: 2 }, 'stereo with two small speakers'),
  hg('music', 2, 'Vinyl Hi-Fi', 700, [2, 1], 'floor', { mult: 1.5, ambience: 2, ambientFunPerHour: 3 }, 'turntable on cabinet, record sleeves'),

  hg('shower', 0, 'Basic Shower Stall', 120, [1, 1], 'floor', { mult: 1.0, ambience: 0 }, 'white stall, plain curtain'),
  hg('shower', 1, 'Rainfall Shower', 480, [1, 1], 'floor', { mult: 1.25, ambience: 1 }, 'glass stall, wide chrome head'),
  hg('shower', 2, 'Spa Steam Shower', 1300, [1, 1], 'floor', { mult: 1.5, ambience: 2, moodlet: 'squeaky_clean' }, 'slate stall, steam wisps'),

  hg('bath', 0, 'Compact Tub', 200, [2, 1], 'floor', { mult: 1.0, ambience: 0 }, 'short white tub'),
  hg('bath', 1, 'Clawfoot Bathtub', 620, [2, 1], 'floor', { mult: 1.25, ambience: 2, moodlet: 'squeaky_clean' }, 'white tub on brass feet'),
  hg('bath', 2, 'Whirlpool Tub', 1500, [2, 2], 'floor', { mult: 1.5, ambience: 3, moodlet: 'squeaky_clean' }, 'corner tub, bubbles'),

  hg('exercise', 0, 'Yoga Mat', 20, [1, 2], 'floor', { mult: 1.0, ambience: 0 }, 'rolled purple mat'),
  hg('exercise', 1, 'Dumbbells & Bench', 240, [1, 2], 'floor', { mult: 1.25, ambience: 0 }, 'black bench, two dumbbells'),
  hg('exercise', 2, 'Home Treadmill', 780, [1, 2], 'floor', { mult: 1.5, ambience: 1 }, 'treadmill, small display'),

  hg('instrument', 0, 'Ukulele', 45, [1, 1], 'wall', { mult: 1.0, ambience: 1 }, 'tiny four-string guitar'),
  hg('instrument', 1, 'Acoustic Guitar', 260, [1, 1], 'floor', { mult: 1.25, ambience: 1 }, 'honey guitar on stand'),
  hg('instrument', 2, 'Upright Piano', 1400, [2, 1], 'floor', { mult: 1.5, ambience: 3 }, 'walnut upright piano, stool'),

  hg('easel', 0, 'Tabletop Easel', 30, [1, 1], 'surface', { mult: 1.0, ambience: 0, artValueMult: 1.0 }, 'small easel, blank canvas'),
  hg('easel', 1, 'Studio Easel', 170, [1, 1], 'floor', { mult: 1.25, ambience: 1, artValueMult: 1.25 }, 'tall easel, paint-spattered'),
  hg('easel', 2, 'Atelier Set', 560, [2, 1], 'floor', { mult: 1.5, ambience: 2, artValueMult: 1.5 }, 'big easel, taboret, brushes in jar'),

  hg('plant', 0, 'Potted Succulent', 12, [1, 1], 'surface', { mult: 1.0, ambience: 1 }, 'tiny cactus, terracotta pot'),
  hg('plant', 1, 'Monstera', 55, [1, 1], 'floor', { mult: 1.0, ambience: 2 }, 'big split leaves, white pot'),
  hg('plant', 2, 'Indoor Lemon Tree', 180, [1, 1], 'floor', { mult: 1.0, ambience: 4 }, 'small tree, yellow lemons, blue pot'),

  hg('rug', 0, 'Woven Mat', 25, [2, 1], 'floor', { mult: 1.0, ambience: 1 }, 'striped flat mat'),
  hg('rug', 1, 'Wool Area Rug', 140, [3, 2], 'floor', { mult: 1.0, ambience: 2 }, 'cream rug, rust border'),
  hg('rug', 2, 'Hand-Knotted Rug', 520, [3, 2], 'floor', { mult: 1.0, ambience: 4 }, 'rich red patterned rug'),

  hg('decor', 0, 'Poster Set', 15, [1, 1], 'wall', { mult: 1.0, ambience: 1 }, 'two band posters, taped corners'),
  hg('decor', 1, 'Framed Prints', 110, [2, 1], 'wall', { mult: 1.0, ambience: 2 }, 'three framed prints in a row'),
  hg('decor', 2, 'Gallery Wall', 480, [3, 1], 'wall', { mult: 1.0, ambience: 4 }, 'mixed gold frames cluster'),

  // Extra decor / plants (same tags, non-canonical ids)
  { id: 'decor_string_lights', name: 'String Lights', category: 'homegood', price: 20, icon: 'wire with warm dots', effects: {}, stack: 1, soldAt: ['homegoods'], tag: 'decor', tier: 0, footprint: [2, 1], placement: 'wall', bonus: { mult: 1.0, ambience: 1 } },
  { id: 'decor_floor_lamp', name: 'Arc Floor Lamp', category: 'homegood', price: 75, icon: 'curved lamp, cream shade', effects: {}, stack: 1, soldAt: ['homegoods'], tag: 'decor', tier: 1, footprint: [1, 1], placement: 'floor', bonus: { mult: 1.0, ambience: 2 } },
  { id: 'decor_wall_clock', name: 'Station Clock', category: 'homegood', price: 40, icon: 'round clock, black rim', effects: {}, stack: 1, soldAt: ['homegoods'], tag: 'decor', tier: 0, footprint: [1, 1], placement: 'wall', bonus: { mult: 1.0, ambience: 1 } },
  { id: 'decor_aquarium', name: 'Little Reef Aquarium', category: 'homegood', price: 300, icon: 'glass tank, orange fish, bubbles', effects: {}, stack: 1, soldAt: ['homegoods'], tag: 'decor', tier: 2, footprint: [2, 1], placement: 'floor', bonus: { mult: 1.0, ambience: 3 } },
  { id: 'plant_fern', name: 'Hanging Fern', category: 'homegood', price: 30, icon: 'fern in macrame hanger', effects: {}, stack: 1, soldAt: ['homegoods', 'market_stalls'], tag: 'plant', tier: 0, footprint: [1, 1], placement: 'wall', bonus: { mult: 1.0, ambience: 1 } },
];

// ---------------------------------------------------------------------------------------------
// OUTFITS — sold at Thread & Co. Wearing is free and instant at home or in the fitting room.
//   outfit   sprite/art key for the character artist (uniforms use the keys in jobs.js).
//   styles   'casual' | 'smart' | 'formal' | 'sport' | 'cozy' | 'rain' | 'winter' | 'party'
//   perk     small contextual bonus while worn. Keys:
//              xpMult { skill: mult } (only during matching activities), sleepMult, funMult (bar/dance),
//              blocksMoodlets [ids], relationshipGainMult, tipMult.
//   The Gilded Gull's dress code accepts styles 'smart' or 'formal'.
// ---------------------------------------------------------------------------------------------
const TC = ['clothing'];
export const OUTFITS = [
  { id: 'outfit_travel', name: 'Travel Clothes', category: 'outfit', price: 0, icon: 'hoodie and jeans', effects: {}, stack: 1, soldAt: [], outfit: 'travel', styles: ['casual'], perk: {}, note: 'What you arrived in. Owned at start.' },
  { id: 'outfit_tee_jeans', name: 'Tee & Jeans', category: 'outfit', price: 35, icon: 'white tee, blue jeans', effects: {}, stack: 1, soldAt: TC, outfit: 'tee_jeans', styles: ['casual'], perk: {} },
  { id: 'outfit_summer', name: 'Boardwalk Summer Set', category: 'outfit', price: 45, icon: 'yellow shirt, shorts, sandals', effects: {}, stack: 1, soldAt: TC, outfit: 'summer', styles: ['casual'], perk: { outdoorFunMult: 1.05, seasons: ['summer'] } },
  { id: 'outfit_knit', name: 'Autumn Knit', category: 'outfit', price: 60, icon: 'rust sweater, scarf', effects: {}, stack: 1, soldAt: TC, outfit: 'knit', styles: ['casual', 'cozy'], perk: { relationshipGainMult: 1.05 } },
  { id: 'outfit_smart_casual', name: 'Smart Casual', category: 'outfit', price: 90, icon: 'navy blazer over tee', effects: {}, stack: 1, soldAt: TC, outfit: 'smart_casual', styles: ['smart'], perk: { xpMult: { charisma: 1.05 } } },
  { id: 'outfit_business', name: 'Business Suit', category: 'outfit', price: 180, icon: 'grey suit, tie', effects: {}, stack: 1, soldAt: TC, outfit: 'business', styles: ['smart', 'formal'], perk: { xpMult: { charisma: 1.05, logic: 1.05 } } },
  { id: 'outfit_evening', name: 'Evening Wear', category: 'outfit', price: 240, icon: 'black formalwear, gold accent', effects: {}, stack: 1, soldAt: TC, outfit: 'evening', styles: ['formal', 'party'], perk: { relationshipGainMult: 1.1 } },
  { id: 'outfit_party', name: 'Night Out', category: 'outfit', price: 85, icon: 'sequin top, dark trousers', effects: {}, stack: 1, soldAt: TC, outfit: 'party', styles: ['party'], perk: { funMult: 1.1 } },
  { id: 'outfit_sport', name: 'Gym Kit', category: 'outfit', price: 50, icon: 'tank top, shorts, trainers', effects: {}, stack: 1, soldAt: ['clothing', 'gym'], outfit: 'sport', styles: ['sport'], perk: { xpMult: { fitness: 1.1 } } },
  { id: 'outfit_pajamas', name: 'Flannel Pajamas', category: 'outfit', price: 30, icon: 'striped pajamas', effects: {}, stack: 1, soldAt: TC, outfit: 'pajamas', styles: ['cozy'], perk: { sleepMult: 1.05 } },
  { id: 'outfit_raincoat', name: 'Yellow Raincoat', category: 'outfit', price: 55, icon: 'yellow hooded coat, boots', effects: {}, stack: 1, soldAt: TC, outfit: 'raincoat', styles: ['casual', 'rain'], perk: { blocksMoodlets: ['soaked'] } },
  { id: 'outfit_winter', name: 'Winter Parka', category: 'outfit', price: 110, icon: 'puffy red parka, beanie', effects: {}, stack: 1, soldAt: TC, outfit: 'winter', styles: ['casual', 'winter'], perk: { blocksMoodlets: ['chilly'] } },
  { id: 'outfit_artist', name: 'Paint-Splattered Overalls', category: 'outfit', price: 65, icon: 'denim overalls, colour splats', effects: {}, stack: 1, soldAt: TC, outfit: 'artist', styles: ['casual'], perk: { xpMult: { creativity: 1.1 } } },
];

// ---------------------------------------------------------------------------------------------
// BOOKS — sold at Dog-Eared Books; every book can also be read or borrowed free at the library.
//   Skill books: reading grants xp at 60 xp per game hour (x bookshelf mult) until `xpTotal` has been
//   paid out; only useful while minLevel <= skill level <= maxLevel. readMinutes = xpTotal.
//   Novels: fun while reading (activities.js read_novel); finishing one grants 'good_book'.
// ---------------------------------------------------------------------------------------------
const BK = ['bookstore'];
const skillBook = (id, name, skill, minLevel, maxLevel, price, xpTotal, icon) =>
  ({ id, name, category: 'book', price, icon, effects: {}, stack: 1, soldAt: BK, kind: 'skill', skill, minLevel, maxLevel, xpTotal, readMinutes: xpTotal });
const novel = (id, name, price, readMinutes, icon) =>
  ({ id, name, category: 'book', price, icon, effects: { moodlet: 'good_book' }, stack: 1, soldAt: BK, kind: 'novel', skill: null, minLevel: 1, maxLevel: 10, xpTotal: 0, readMinutes });

export const BOOKS = [
  skillBook('book_cooking_1', 'One Pan, No Panic', 'cooking', 1, 4, 18, 240, 'orange book, frying pan'),
  skillBook('book_cooking_2', 'The Salt of the Bay', 'cooking', 4, 8, 42, 480, 'white book, gold fish'),
  skillBook('book_fitness_1', 'Couch to Lighthouse', 'fitness', 1, 4, 18, 240, 'red book, running shoe'),
  skillBook('book_fitness_2', 'Strong Like a Maple', 'fitness', 4, 8, 42, 480, 'dark red book, dumbbell'),
  skillBook('book_charisma_1', 'Small Talk, Big City', 'charisma', 1, 4, 18, 240, 'pink book, speech bubble'),
  skillBook('book_charisma_2', 'The Room Is Yours', 'charisma', 4, 8, 42, 480, 'magenta book, spotlight'),
  skillBook('book_logic_1', 'Puzzles for the 7:42', 'logic', 1, 4, 18, 240, 'navy book, grid'),
  skillBook('book_logic_2', 'Spreadsheets & Sorcery', 'logic', 4, 8, 42, 480, 'navy book, bar chart'),
  skillBook('book_creativity_1', 'Draw What You See', 'creativity', 1, 4, 18, 240, 'teal book, pencil'),
  skillBook('book_creativity_2', 'Colour Theory After Dark', 'creativity', 4, 8, 42, 480, 'purple book, palette'),
  skillBook('book_handiness_1', 'Righty Tighty', 'handiness', 1, 4, 18, 240, 'yellow book, wrench'),
  skillBook('book_handiness_2', 'The Weekend Carpenter', 'handiness', 4, 8, 42, 480, 'brown book, saw'),
  novel('novel_lighthouse', 'The Lighthouse Keeper\'s Cat', 12, 240, 'blue book, lighthouse beam'),
  novel('novel_last_train', 'Last Train to Hillcrest', 12, 300, 'dark green book, train window'),
  novel('novel_noodles', 'Love & Other Noodles', 10, 240, 'red book, heart in bowl'),
  novel('novel_maple_murders', 'The Maple Street Mysteries', 14, 360, 'black book, magnifying glass'),
  novel('novel_starfarers', 'Starfarers of the Tidal Moon', 14, 360, 'indigo book, ringed planet'),
];

// ---------------------------------------------------------------------------------------------
// GIFTS — give to an NPC from the inventory during a conversation.
// ---------------------------------------------------------------------------------------------
export const GIFTS = [
  { id: 'gift_flowers', name: 'Bouquet of Tulips', category: 'gift', price: 15, icon: 'pink and yellow tulips, paper wrap', effects: {}, stack: 3, soldAt: ['grocery', 'market_stalls'], relationship: 8, giftTags: ['floral'] },
  { id: 'gift_wildflowers', name: 'Wildflower Bunch', category: 'gift', price: 10, icon: 'loose mixed flowers, twine', effects: {}, stack: 3, soldAt: ['market_stalls'], relationship: 6, giftTags: ['floral', 'homemade'] },
  { id: 'gift_chocolates', name: 'Box of Chocolates', category: 'gift', price: 12, icon: 'heart-ish box, red ribbon', effects: {}, stack: 3, soldAt: ['grocery', 'cornerstore'], relationship: 6, giftTags: ['sweet'] },
  { id: 'gift_honey', name: 'Jar of Bay Honey', category: 'gift', price: 10, icon: 'gold jar, bee label', effects: {}, stack: 3, soldAt: ['market_stalls'], relationship: 6, giftTags: ['sweet', 'homemade'] },
  { id: 'gift_candle', name: 'Scented Candle', category: 'gift', price: 14, icon: 'cream candle in glass, flame', effects: {}, stack: 3, soldAt: ['grocery', 'cornerstore'], relationship: 6, giftTags: ['cozy'] },
  { id: 'gift_teddy', name: 'Teddy Bear', category: 'gift', price: 20, icon: 'brown bear, red bow', effects: {}, stack: 3, soldAt: ['cornerstore'], relationship: 8, giftTags: ['cozy', 'cute'] },
  { id: 'gift_wine', name: 'Bottle of Hillcrest Red', category: 'gift', price: 24, icon: 'dark bottle, cream label', effects: {}, stack: 3, soldAt: ['grocery'], relationship: 9, giftTags: ['fancy'] },
  { id: 'gift_postcards', name: 'Maple Bay Postcards', category: 'gift', price: 5, icon: 'fanned postcards, skyline', effects: {}, stack: 3, soldAt: ['cornerstore', 'bookstore'], relationship: 3, giftTags: ['cute'] },
  { id: 'gift_succulent', name: 'Gift Succulent', category: 'gift', price: 10, icon: 'mini cactus with bow', effects: {}, stack: 3, soldAt: ['market_stalls', 'grocery'], relationship: 5, giftTags: ['green'] },
  { id: 'gift_cake', name: 'Celebration Cake', category: 'gift', price: 22, icon: 'white cake, candles', effects: { hunger: 15, fun: 12, moodlet: 'sweet_treat' }, stack: 1, soldAt: ['bakery'], relationship: 6, giftTags: ['sweet', 'fancy'], birthdayRelationship: 14, servings: 6, shelfLifeDays: 4, needsFridge: true },
];

// ---------------------------------------------------------------------------------------------
// MISC — passes, tickets, tools.
//   grants  { access, days } = unlimited access for N days from purchase (activated on purchase).
// ---------------------------------------------------------------------------------------------
export const MISC = [
  { id: 'transit_pass', name: 'Weekly Transit Pass', category: 'misc', price: 18, icon: 'green card, loop symbol', effects: {}, stack: 1, soldAt: ['cornerstore'], grants: { access: 'transit', days: 7 }, note: 'Unlimited train and bus rides. Also sold at every station machine and in the phone Map app.' },
  { id: 'gym_day_pass', name: 'Gym Day Pass', category: 'misc', price: 6, icon: 'grey ticket, dumbbell', effects: {}, stack: 1, soldAt: ['gym'], grants: { access: 'gym', days: 1 } },
  { id: 'gym_membership', name: 'Gym Membership (week)', category: 'misc', price: 20, icon: 'red card, maple leaf, dumbbell', effects: {}, stack: 1, soldAt: ['gym'], grants: { access: 'gym', days: 7 }, note: 'Includes yoga classes and locker-room showers. Can be set to auto-renew in the Bank app.' },
  { id: 'movie_ticket', name: 'Movie Ticket', category: 'misc', price: 9, icon: 'cream ticket stub, star', effects: {}, stack: 5, soldAt: ['cinema'], note: 'One ticket gets you into one film. Half price on Cheap Tuesdays.' },
  { id: 'fishing_rod', name: 'Fishing Rod', category: 'misc', price: 25, icon: 'thin rod, red float', effects: {}, stack: 1, soldAt: ['cornerstore'], note: 'Lets you fish off the pier. Never breaks.' },
  { id: 'umbrella', name: 'Umbrella', category: 'misc', price: 12, icon: 'folded blue umbrella', effects: {}, stack: 1, soldAt: ['cornerstore', 'grocery'], blocksMoodlets: ['soaked'], note: 'Carried in the backpack; opens automatically in rain.' },
  { id: 'sketchbook', name: 'Sketchbook & Pencils', category: 'misc', price: 10, icon: 'black sketchbook, pencil', effects: {}, stack: 1, soldAt: ['bookstore'], note: 'Lets you sketch the scene from any bench. Never runs out.' },
  { id: 'canvas', name: 'Blank Canvas', category: 'misc', price: 8, icon: 'white square on stretcher', effects: {}, stack: 5, soldAt: ['bookstore'], note: 'One canvas per finished painting at your easel.' },
  { id: 'duck_feed', name: 'Bag of Duck Feed', category: 'misc', price: 1, icon: 'small paper bag, seeds', effects: {}, stack: 10, soldAt: ['cornerstore', 'stand_hotdog'], note: 'For feeding the ducks. Bread also works, but the ducks prefer this.' },
  { id: 'painting', name: 'Your Painting', category: 'misc', price: 0, icon: 'small framed colourful canvas', effects: {}, stack: 5, soldAt: [], note: 'Painted at your easel. Hang it at home or sell it at the Old Town Market: the better your Creativity, the more it fetches.', sellBase: 20, sellPerCreativityLevel: 12 },
  { id: 'compost', name: 'Compost', category: 'misc', price: 0, icon: 'brown crumbly heap, green sprout', effects: {}, stack: 10, soldAt: [], note: 'What spoiled food becomes. Use at the community garden for +25% yield on one harvest, or bin it.' },
];

// ---------------------------------------------------------------------------------------------
// Aggregates & tiny pure helpers
// ---------------------------------------------------------------------------------------------
/** Cookbooks & recipe cards ('misc' items with `teaches`), see recipes_extra.js. */
export const COOKBOOKS = buildCookbooks(RECIPES);
MISC.push(...COOKBOOKS);
export const ITEMS = [...INGREDIENTS, ...PACKAGED_FOOD, ...DISHES, ...MEALS, ...HOMEGOODS, ...OUTFITS, ...BOOKS, ...GIFTS, ...MISC];
export const ITEM_BY_ID = Object.fromEntries(ITEMS.map((i) => [i.id, i]));
export const RECIPE_BY_ID = Object.fromEntries(RECIPES.map((r) => [r.id, r]));

/** Everything a venue stocks (shop shelves and menu). */
export const itemsSoldAt = (venueId) => ITEMS.filter((i) => i.soldAt.includes(venueId));
/** All home goods for a function tag, ordered by tier. */
export const homegoodsForTag = (tag) => HOMEGOODS.filter((h) => h.tag === tag).sort((a, b) => a.tier - b.tier);
