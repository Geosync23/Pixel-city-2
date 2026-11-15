// recipes_extra.js — the big cookbook (Direction update 16, owner msg 77): extra ingredients, ~150 extra recipes, cookbooks / recipe
// cards and how every recipe is LEARNED. Pure data, no imports: items.js imports this file and merges it, so RECIPES / MEALS /
// RECIPE_BY_ID / INGREDIENTS / ITEMS keep working everywhere (always import from items.js, not from here).
//
//   INGREDIENTS_EXTRA   ingredient items in the items.js format.
//   RECIPES_EXTRA       recipes in the items.js RECIPES format, plus these optional fields (also patched onto the 17 original recipes
//                       through LEGACY_PATCH):
//       cat     one of RECIPE_CATS ids — the cook-menu tab.
//       oven    true = baked / roasted: needs a stove WITH an oven (stoveTier >= 1). Shown as "Oven" in the menu. No new furniture.
//       drink   true = the produced meal is drunk, not eaten (meal item gets course 'drink', no 'home_cooked' moodlet).
//       learn   how the recipe becomes known. Absent = known from the start. One of:
//                 { level: n }                 worked out by yourself when Cooking reaches level n
//                 { book: 'cookbook_id' }      from a cookbook / recipe card (COOKBOOKS; learned the moment you buy it)
//                 { eat: [itemIds], n }        after eating/drinking any of those restaurant dishes n times in total
//                 { friend: castId }           shared by that NPC once you are friends (relationship tier 'friend' or 'close')
//                 { story: castId }            given by the story (flag 'recipe:<id>', src/sim/story.js rewards)
//   COOKBOOKS           'misc' items with `teaches: [recipeIds]` (derived from the recipes' learn.book).
//   RECIPE_CATS         [{ id, name }] menu tabs in display order.          LEARN_FROM  castId -> "who, where" text for teasers.
//   LEGACY_RECIPES      the 17 recipe ids that existed before this file: a save from before recipe knowledge keeps all of them.
//
// BALANCE (same rules as the items.js header; run `node src/data/validate.mjs --summary`)
//   cost per serving  $0.50-$6.50 (drinks from $0.50; skill 1-2 dishes $1-3; showpieces $3-5.50 but they serve 4-6).
//   cookMinutes       by skill: 15 / 22 / 30 / 38 / 48 / 55 / 65 / 80 / 90 / 100 unless the dish says otherwise (no-cook: 8-20).
//   xp                by skill: 20 / 30 / 42 / 52 / 65 / 75 / 88 / 110 / 130 / 150; no-cook dishes 75%, drinks 50%.
//   hunger            skill 1: 22-40, skill 2-3: 34-52, skill 4-6: 44-62, skill 7+: 56-72; baking / desserts 12-24 with fun + 'sweet_treat'.
//   stove tiers       0 hot plate (anything in one pan or pot), 1 range with oven (`oven: true`, or a big pot), 2 chef's range (showpieces).

// ---------------------------------------------------------------------------------------------
// INGREDIENTS. Where they are sold makes the shops matter:
//   FreshWay ('grocery') has nearly everything packaged, meat and dairy; Lucky Corner ('cornerstore', x1.2) the tins, staples and
//   late-night basics; Old Town Market ('market_stalls', x0.8, +2 days fresh) the produce, herbs, seafood and speciality jars;
//   the bakeries flour, yeast, buns and pita; the cheese shops ('gen_retail_cheese') dairy, olives and ham.
//   venues_extra.js copies grocery stock to the neighbourhood groceries and corner-store stock to the bodegas by itself.
//   Every ingredient is sold in at least one of grocery / cornerstore / market_stalls / bakery (validate.mjs checks).
// ---------------------------------------------------------------------------------------------
const G = ['grocery'], GC = ['grocery', 'cornerstore'], GM = ['grocery', 'market_stalls'], GCM = ['grocery', 'cornerstore', 'market_stalls'], M = ['market_stalls'];
const CH = 'gen_retail_cheese', BK = 'bakery';
const ing = (id, name, price, soldAt, shelfLifeDays, needsFridge, icon, raw) => ({ id, name, category: 'ingredient', price, icon, effects: raw ? raw[0] : {}, stack: 10, soldAt, shelfLifeDays, needsFridge, edibleRaw: !!raw, ...(raw ? { eatMinutes: raw[1] } : {}) });

export const INGREDIENTS_EXTRA = [
  // pantry staples (never spoil)
  ing('olive_oil', 'Olive Oil', 1.5, GC, null, false, 'green bottle, gold oil'),
  ing('soy_sauce', 'Soy Sauce', 1.5, GC, null, false, 'small dark bottle, red cap'),
  ing('stock', 'Stock Cubes', 1, GC, null, false, 'yellow box, gold cube'),
  ing('oats', 'Rolled Oats', 1, GC, null, false, 'round tub, beige oats'),
  ing('peanut_butter', 'Peanut Butter', 2, GC, null, false, 'tan jar, red lid'),
  ing('jam', 'Berry Jam', 2, ['grocery', 'cornerstore', 'market_stalls', BK], null, false, 'red jar, checked lid'),
  ing('honey', 'Honey', 2.5, GM, null, false, 'gold jar, dipper'),
  ing('maple_syrup', 'Maple Syrup', 3, GM, null, false, 'amber jug, leaf label'),
  ing('cocoa', 'Cocoa Powder', 2, ['grocery', BK], null, false, 'brown tin, cream label'),
  ing('cinnamon', 'Cinnamon', 1.5, ['grocery', 'cornerstore', BK], null, false, 'bundle of brown sticks'),
  ing('curry_powder', 'Curry Powder', 2, G, null, false, 'yellow tin, orange powder'),
  ing('bbq_spice', 'Smoky Spice Rub', 2, G, null, false, 'red shaker, flame'),
  ing('berbere', 'Berbere Spice', 2.5, M, null, false, 'paper bag, brick-red powder'),
  ing('yeast', 'Baking Yeast', 0.5, ['grocery', BK], null, false, 'small yellow sachet'),
  ing('cornmeal', 'Cornmeal', 1, G, null, false, 'yellow paper bag, corn cob'),
  ing('sesame', 'Sesame Seeds', 1.5, G, null, false, 'small jar of pale seeds'),
  ing('tea', 'Tea Bags', 1, GC, null, false, 'green box, tea bag tag'),
  ing('coffee', 'Ground Coffee', 2.5, GC, null, false, 'brown bag, coffee bean'),
  ing('lentils', 'Red Lentils', 1, G, null, false, 'clear bag of orange lentils'),
  ing('rice_noodles', 'Rice Noodles', 1.5, G, null, false, 'bundle of white noodles, band'),
  ing('nori', 'Nori Sheets', 2, G, null, false, 'dark green sheets, wrapper'),
  ing('tahini', 'Tahini', 2.5, G, null, false, 'beige jar, white lid'),
  ing('coconut_milk', 'Coconut Milk', 2, G, null, false, 'white can, half coconut'),
  // tins & jars
  ing('chickpeas', 'Canned Chickpeas', 1.5, GC, null, false, 'tin can, yellow label'),
  ing('corn', 'Sweetcorn', 1, GC, null, false, 'tin can, green label, yellow kernels', [{ hunger: 8 }, 4]),
  ing('tuna', 'Canned Tuna', 2, GC, null, false, 'flat blue tin, fish', [{ hunger: 12 }, 4]),
  ing('salsa', 'Jar of Salsa', 2, GC, null, false, 'red jar, green chili label'),
  ing('pickles', 'Pickles', 2, G, null, false, 'jar of green pickles', [{ hunger: 4 }, 2]),
  ing('olives', 'Olives', 2.5, ['market_stalls', CH], null, false, 'tub of green and black olives', [{ hunger: 5 }, 3]),
  ing('peanuts', 'Roasted Peanuts', 1.5, GC, null, false, 'blue bag of peanuts', [{ hunger: 9 }, 3]),
  ing('miso', 'Miso Paste', 2.5, G, 60, true, 'brown tub, red lid'),
  ing('kimchi', 'Kimchi', 3, M, 30, true, 'jar of red cabbage', [{ hunger: 6 }, 3]),
  // bakery shelf
  ing('tortillas', 'Tortillas', 1.5, GC, 7, false, 'stack of pale round wraps'),
  ing('pita', 'Pita Bread', 1.5, ['grocery', BK], 5, false, 'two puffy flat breads', [{ hunger: 8 }, 3]),
  ing('buns', 'Burger Buns', 1.5, ['grocery', 'cornerstore', BK], 5, false, 'two seeded buns', [{ hunger: 8 }, 3]),
  ing('dumpling_wrappers', 'Dumpling Wrappers', 2, G, 10, true, 'stack of thin white rounds'),
  // dairy
  ing('cream', 'Cream', 1.5, ['grocery', CH], 7, true, 'small white carton, red stripe'),
  ing('plain_yogurt', 'Greek Yogurt', 1.5, ['grocery', CH], 10, true, 'white tub, blue lid', [{ hunger: 10 }, 3]),
  ing('mozzarella', 'Mozzarella', 2.5, ['grocery', CH], 8, true, 'white ball in a bag'),
  ing('parmesan', 'Parmesan', 3, ['market_stalls', CH], 40, true, 'pale hard wedge, rind'),
  ing('cream_cheese', 'Cream Cheese', 2, ['grocery', CH], 14, true, 'silver foil block, blue band'),
  // meat & fish
  ing('ham', 'Sliced Ham', 2.5, ['grocery', 'cornerstore', CH], 6, true, 'pink folded slices', [{ hunger: 10 }, 3]),
  ing('sausage', 'Sausages', 3, G, 5, true, 'three linked sausages'),
  ing('pork', 'Pork', 4, G, 3, true, 'pink chop on tray'),
  ing('ground_beef', 'Ground Beef', 3.5, G, 3, true, 'tray of red mince'),
  ing('shrimp', 'Shrimp', 5, GM, 2, true, 'three pink curled shrimp'),
  ing('salmon', 'Salmon Fillet', 6, GM, 2, true, 'orange fillet, white lines'),
  ing('mussels', 'Mussels', 4, M, 2, true, 'dark blue shells, one open'),
  // produce
  ing('garlic', 'Garlic', 0.5, GCM, 20, false, 'white bulb, purple streaks'),
  ing('ginger', 'Ginger', 1, GM, 14, false, 'knobbly tan root'),
  ing('chili', 'Chilies', 1, GM, 10, true, 'two red chilies, green stems'),
  ing('herbs', 'Fresh Herbs', 1.5, GM, 5, true, 'tied bunch of green leaves'),
  ing('spring_onion', 'Spring Onions', 1, GM, 7, true, 'bunch, white ends, green tops'),
  ing('spinach', 'Spinach', 1.5, GM, 4, true, 'pile of dark green leaves'),
  ing('bell_pepper', 'Bell Pepper', 1, GM, 8, true, 'red bell pepper, green stem', [{ hunger: 4 }, 2]),
  ing('cucumber', 'Cucumber', 1, GM, 7, true, 'long green cucumber', [{ hunger: 4 }, 2]),
  ing('cabbage', 'Cabbage', 1, GM, 14, true, 'pale green round head'),
  ing('broccoli', 'Broccoli', 1.5, GM, 6, true, 'green floret, pale stalk'),
  ing('avocado', 'Avocado', 1.5, GM, 4, false, 'halved avocado, brown stone', [{ hunger: 9 }, 3]),
  ing('pumpkin', 'Pumpkin', 2, GM, 30, false, 'orange ribbed pumpkin'),
  ing('peas', 'Frozen Peas', 1, GC, 28, true, 'green bag, pea pod'),
  ing('lime', 'Lime', 0.5, GM, 14, false, 'green lime'),
  ing('orange', 'Orange', 1, GCM, 12, false, 'bright orange, leaf', [{ hunger: 7, energy: 2 }, 3]),
  ing('mango', 'Mango', 2, M, 5, false, 'red-gold mango', [{ hunger: 8, fun: 2 }, 3]),
];

// ---------------------------------------------------------------------------------------------
// Menu tabs
// ---------------------------------------------------------------------------------------------
export const RECIPE_CATS = [
  { id: 'breakfast', name: 'Breakfast' },
  { id: 'light', name: 'Sandwiches & Salads' },
  { id: 'soup', name: 'Soups & Stews' },
  { id: 'pasta', name: 'Pasta & Noodles' },
  { id: 'rice', name: 'Rice & Curries' },
  { id: 'world', name: 'World Kitchen' },
  { id: 'mains', name: 'Roasts, Fish & Pizza' },
  { id: 'baking', name: 'Baking' },
  { id: 'sweet', name: 'Desserts' },
  { id: 'drink', name: 'Drinks' },
];

/** who teaches a friend / story recipe (teaser text: "Get to know <this>") */
export const LEARN_FROM = {
  nana: 'Nana Bea', theo: 'Theo', captain: 'the Captain', roz: 'Roz at Rise & Shine Bakery', haru: 'Chef Haru at Noodle Lantern',
  dot: "Dot at Dot's Diner", nico: 'Nico at Slice of Heaven', mr_oh: 'Mr. Oh at Lucky Corner', noor: 'Noor, your neighbour',
  vik: 'Mr. Sethi, the park chess champion', kit: 'Kit', walt: 'Walt, the building super',
};

export const LEGACY_RECIPES = ['garden_salad', 'scrambled_eggs', 'grilled_cheese', 'noodle_soup', 'bacon_and_eggs', 'pancakes', 'tomato_pasta', 'veggie_stir_fry', 'choc_chip_cookies',
  'chicken_rice_bowl', 'fish_and_chips', 'beef_stew', 'homemade_pizza', 'mushroom_risotto', 'lemon_tart', 'sunday_roast', 'bay_paella'];

// ---------------------------------------------------------------------------------------------
// Recipe builder (produces the exact items.js RECIPES shape)
// ---------------------------------------------------------------------------------------------
const MIN = [0, 15, 22, 30, 38, 48, 55, 65, 80, 90, 100], XP = [0, 20, 30, 42, 52, 65, 75, 88, 110, 130, 150];
const SHELF = { soup: 3, baking: 5, sweet: 3, drink: 1 };
const L = level => ({ level }), B = book => ({ book }), E = (n, ...eat) => ({ eat, n }), F = friend => ({ friend }), ST = story => ({ story });
/** rc(id, name, cat, skill, 'ing ing*2 ...', servings, hunger, fun, opts)
 *  opts: none (no-cook) | oven | tier | min | eat | shelf | xp | energy | social | moodlet | caffeine | drink | gift: [relationship, ...tags] | learn | icon */
function rc(id, name, cat, skill, ings, servings, hunger, fun, o = {}) {
  const ingredients = {}; for (const t of ings.split(' ')) { const [k, n] = t.split('*'); ingredients[k] = +(n || 1); }
  const drink = cat === 'drink', none = !!o.none, effects = {};
  if (hunger) effects.hunger = hunger; if (fun) effects.fun = fun; if (o.energy) effects.energy = o.energy; if (o.social) effects.social = o.social;
  if (o.caffeine) effects.caffeine = true; if (o.moodlet) effects.moodlet = o.moodlet;
  const r = {
    id, name, icon: o.icon || name.toLowerCase(), ingredients, skill, appliance: none ? 'none' : 'stove', stoveTier: none ? 0 : o.tier ?? (o.oven ? 1 : 0),
    cookMinutes: o.min ?? (drink ? 5 : none ? 5 + skill * 3 : MIN[skill]), servings, effects,
    eatMinutes: o.eat ?? (drink ? 4 : hunger >= 50 ? 15 : hunger >= 36 ? 12 : hunger >= 22 ? 8 : 5), shelfLifeDays: o.shelf ?? SHELF[cat] ?? 2,
    xp: o.xp ?? Math.round(XP[skill] * (drink ? .5 : none ? .75 : 1)), cat,
  };
  if (o.gift) { r.giftable = true; r.gift = { relationship: o.gift[0], giftTags: o.gift.slice(1) }; }
  if (o.oven) r.oven = true; if (drink) r.drink = true; if (o.learn) r.learn = o.learn;
  return r;
}
const SW = 'sweet_treat', GOOD = 'good_meal', FINE = 'fine_dining';

export const RECIPES_EXTRA = [
  // ============================================================ BREAKFAST
  rc('porridge', 'Creamy Porridge', 'breakfast', 1, 'oats milk', 1, 30, 1, { min: 10 }),
  rc('banana_porridge', 'Banana Oat Porridge', 'breakfast', 1, 'oats milk banana', 1, 36, 3, { min: 12, energy: 2 }),
  rc('boiled_eggs', 'Boiled Eggs & Soldiers', 'breakfast', 1, 'eggs bread', 1, 30, 2, { min: 10 }),
  rc('cinnamon_toast', 'Cinnamon Toast', 'breakfast', 1, 'bread butter sugar cinnamon', 2, 20, 6, { min: 8 }),
  rc('yogurt_parfait', 'Yogurt Parfait', 'breakfast', 1, 'plain_yogurt berries oats', 1, 26, 6, { none: true }),
  rc('fruit_salad', 'Fruit Salad', 'breakfast', 1, 'apple banana orange', 2, 18, 6, { none: true, energy: 3 }),
  rc('french_toast', 'French Toast', 'breakfast', 2, 'bread eggs milk sugar', 2, 34, 7),
  rc('cheese_omelette', 'Cheese Omelette', 'breakfast', 2, 'eggs*2 cheese butter', 1, 46, 4, { min: 15 }),
  rc('congee', 'Ginger Congee', 'breakfast', 2, 'rice ginger spring_onion eggs', 2, 38, 3, { min: 30, energy: 2, shelf: 3, learn: L(2) }),
  rc('maple_pancakes', "Bea's Maple Oat Pancakes", 'breakfast', 2, 'flour oats eggs milk maple_syrup', 3, 40, 10, { learn: ST('nana') }),
  rc('avocado_toast', 'Avocado Toast', 'breakfast', 2, 'bread avocado eggs lemon', 1, 44, 5, { min: 15, learn: E(3, 'cafe_avocado_toast') }),
  rc('breakfast_hash', 'Potato & Bacon Hash', 'breakfast', 3, 'potato bacon onion eggs', 2, 50, 5, { learn: L(3) }),
  rc('breakfast_burrito', 'Breakfast Burrito', 'breakfast', 3, 'tortillas eggs cheese salsa', 2, 46, 6, { min: 22, learn: B('cookbook_brunch') }),
  rc('granola', 'Honey Nut Granola', 'breakfast', 3, 'oats*2 peanuts honey', 6, 16, 4, { oven: true, min: 35, shelf: 14, energy: 2, gift: [5, 'homemade'], learn: B('cookbook_brunch') }),
  rc('spanish_tortilla', 'Spanish Tortilla', 'breakfast', 3, 'potato*2 eggs*2 onion olive_oil', 4, 38, 5, { min: 35, shelf: 3, learn: B('cookbook_brunch') }),
  rc('shakshuka', 'Shakshuka', 'breakfast', 4, 'eggs*2 tomato_sauce bell_pepper onion garlic', 2, 48, 8, { min: 30, learn: F('noor') }),
  rc('full_breakfast', 'Full Diner Breakfast', 'breakfast', 4, 'eggs*2 bacon sausage beans bread', 2, 60, 8, { min: 30, moodlet: GOOD, learn: E(3, 'diner_breakfast') }),
  rc('eggs_benedict', 'Eggs Benedict', 'breakfast', 6, 'eggs*2 ham bread butter lemon', 2, 52, 12, { min: 40, learn: B('cookbook_brunch') }),

  // ============================================================ SANDWICHES, SALADS & NO-COOK PLATES
  rc('cheese_sandwich', 'Cheese & Tomato Sandwich', 'light', 1, 'bread cheese tomato', 1, 32, 2, { none: true, min: 6 }),
  rc('pbj', 'PB&J Sandwich', 'light', 1, 'bread peanut_butter jam', 1, 30, 5, { none: true, min: 5 }),
  rc('ham_sandwich', 'Ham & Pickle Sandwich', 'light', 1, 'bread ham pickles', 1, 36, 3, { none: true, min: 6 }),
  rc('ploughmans', "Ploughman's Plate", 'light', 1, 'bread cheese apple pickles', 1, 42, 4, { none: true }),
  rc('veggie_wrap', 'Crunchy Veggie Wrap', 'light', 1, 'tortillas lettuce carrot cheese', 1, 34, 3, { none: true, energy: 2 }),
  rc('tuna_salad', 'Tuna & Bean Salad', 'light', 1, 'tuna beans onion lemon', 2, 34, 2, { none: true, learn: B('cookbook_student') }),
  rc('quesadilla', 'Cheese Quesadilla', 'light', 1, 'tortillas cheese', 1, 34, 5, { min: 10 }),
  rc('tuna_melt', 'Tuna Melt', 'light', 2, 'bread tuna cheese', 1, 44, 4, { min: 15 }),
  rc('blt', 'BLT', 'light', 2, 'bread bacon lettuce tomato', 1, 44, 5, { min: 15 }),
  rc('egg_salad_sandwich', 'Egg Salad Sandwich', 'light', 2, 'eggs bread spring_onion butter', 2, 34, 3, { min: 18, learn: L(2) }),
  rc('caprese', 'Caprese Salad', 'light', 2, 'mozzarella tomato herbs olive_oil', 2, 26, 7, { none: true, learn: B('card_picnic') }),
  rc('greek_salad', 'Greek Salad', 'light', 2, 'cucumber tomato olives cheese olive_oil', 2, 30, 5, { none: true, learn: B('card_picnic') }),
  rc('potato_salad', 'Picnic Potato Salad', 'light', 2, 'potato*2 eggs spring_onion pickles', 4, 30, 3, { min: 25, shelf: 3, learn: B('card_picnic') }),
  rc('hummus_plate', 'Hummus & Pita Plate', 'light', 2, 'chickpeas tahini lemon garlic pita', 2, 34, 6, { none: true, social: 2, shelf: 3, learn: E(3, 'gen_hummus_plate') }),
  rc('bruschetta', 'Tomato Bruschetta', 'light', 2, 'bread tomato garlic olive_oil herbs', 2, 28, 7, { min: 12, learn: B('cookbook_pasta') }),
  rc('guacamole', 'Guacamole & Chips', 'light', 2, 'avocado*2 lime tomato onion tortillas', 3, 22, 9, { none: true, social: 2, shelf: 1, learn: B('cookbook_taqueria') }),
  rc('summer_rolls', 'Fresh Summer Rolls', 'light', 3, 'rice_noodles shrimp lettuce carrot herbs peanut_butter', 4, 28, 9, { none: true, min: 20, shelf: 1, learn: L(4) }),
  rc('club_sandwich', 'Triple-Decker Club', 'light', 4, 'bread*2 chicken bacon lettuce tomato', 2, 54, 7, { min: 30, learn: E(3, 'bakery_sandwich', 'gen_pastrami') }),
  rc('caesar_salad', 'Chicken Caesar Salad', 'light', 4, 'lettuce chicken parmesan bread lemon', 2, 46, 7, { min: 30, learn: L(4) }),
  rc('banh_mi', 'Banh Mi', 'light', 4, 'bread pork carrot cucumber herbs chili', 2, 50, 9, { min: 32, learn: E(3, 'gen_banh_mi') }),

  // ============================================================ SOUPS & STEWS
  rc('egg_drop_soup', 'Egg Drop Soup', 'soup', 1, 'eggs stock spring_onion', 1, 26, 2, { min: 10 }),
  rc('tomato_soup', 'Tomato Soup', 'soup', 1, 'tomato_sauce onion stock', 2, 28, 3),
  rc('veg_soup', 'Chunky Vegetable Soup', 'soup', 2, 'carrot potato onion stock', 3, 34, 3, { min: 30, energy: 2 }),
  rc('corn_chowder', 'Sweetcorn Chowder', 'soup', 2, 'corn potato milk onion', 2, 40, 4, { min: 28, learn: L(2) }),
  rc('lentil_soup', 'Red Lentil Soup', 'soup', 2, 'lentils onion carrot garlic stock', 3, 40, 3, { min: 30, learn: B('cookbook_student') }),
  rc('chicken_soup', 'Chicken Noodle Soup', 'soup', 3, 'chicken noodles carrot onion stock', 3, 46, 5, { min: 40, energy: 3, learn: L(3) }),
  rc('lantern_soup', 'Lantern Night Miso Soup', 'soup', 3, 'miso tofu spring_onion noodles', 2, 40, 8, { min: 20, learn: ST('haru') }),
  rc('minestrone', 'Minestrone', 'soup', 3, 'pasta beans tomato_sauce carrot cabbage', 4, 42, 4, { min: 40, shelf: 4, learn: B('cookbook_soups') }),
  rc('pumpkin_soup', 'Roasted Pumpkin Soup', 'soup', 4, 'pumpkin onion cream stock', 3, 40, 8, { oven: true, min: 45, learn: B('cookbook_soups') }),
  rc('chili', 'Three-Alarm Chili', 'soup', 4, 'ground_beef beans*2 tomato_sauce onion chili', 4, 54, 7, { min: 50, shelf: 4, energy: 2, learn: B('cookbook_soups') }),
  rc('french_onion', 'French Onion Soup', 'soup', 5, 'onion*3 stock bread cheese butter', 2, 46, 10, { oven: true, min: 60, learn: B('cookbook_soups') }),
  rc('harbor_chowder', "Captain's Harbor Chowder", 'soup', 5, 'fish potato milk onion butter', 3, 56, 10, { min: 45, energy: 3, learn: ST('captain') }),
  rc('goulash', 'Paprika Goulash', 'soup', 6, 'beef potato bell_pepper onion bbq_spice', 4, 58, 8, { tier: 1, min: 75, shelf: 4, learn: B('cookbook_soups') }),
  rc('gumbo', 'Bay Gumbo', 'soup', 7, 'shrimp sausage rice bell_pepper onion stock', 4, 60, 12, { tier: 1, min: 70, moodlet: GOOD, learn: B('cookbook_bay') }),
  rc('hot_pot', 'Hot Pot Night', 'soup', 8, 'beef tofu mushroom cabbage noodles stock*2 chili', 4, 62, 18, { tier: 1, min: 50, social: 4, moodlet: GOOD, learn: E(3, 'gen_hotpot') }),

  // ============================================================ PASTA & NOODLES
  rc('buttered_noodles', 'Buttered Noodles', 'pasta', 1, 'noodles butter', 1, 30, 2, { min: 10 }),
  rc('garlic_pasta', 'Garlic & Oil Spaghetti', 'pasta', 1, 'pasta garlic olive_oil', 2, 36, 3),
  rc('mac_cheese', 'Stovetop Mac & Cheese', 'pasta', 2, 'pasta cheese milk butter', 2, 46, 7),
  rc('fried_noodles', 'Street-Style Fried Noodles', 'pasta', 2, 'noodles cabbage carrot soy_sauce', 2, 42, 5),
  rc('peanut_noodles', 'Cold Peanut Noodles', 'pasta', 2, 'noodles peanut_butter soy_sauce cucumber', 2, 44, 6, { min: 15, learn: B('cookbook_student') }),
  rc('bolognese', 'Spaghetti Bolognese', 'pasta', 3, 'pasta ground_beef tomato_sauce onion garlic', 3, 54, 7, { min: 40, shelf: 3, learn: L(3) }),
  rc('pesto_pasta', 'Pesto Pasta', 'pasta', 3, 'pasta herbs*2 parmesan olive_oil garlic', 2, 46, 8, { min: 22, learn: B('cookbook_pasta') }),
  rc('carbonara', 'Spaghetti Carbonara', 'pasta', 4, 'pasta bacon eggs parmesan', 2, 54, 9, { min: 28, learn: B('cookbook_pasta') }),
  rc('puttanesca', 'Harbor Puttanesca', 'pasta', 4, 'pasta tomato_sauce olives tuna garlic chili', 2, 50, 8, { min: 30, learn: B('cookbook_pasta') }),
  rc('mushroom_stroganoff', 'Mushroom Stroganoff', 'pasta', 4, 'pasta mushroom*2 cream onion', 2, 50, 8, { min: 35, learn: L(5) }),
  rc('chow_mein', 'Chicken Chow Mein', 'pasta', 4, 'noodles*2 chicken cabbage soy_sauce ginger', 3, 52, 8, { min: 30, learn: B('cookbook_wok') }),
  rc('baked_mac', 'Baked Mac & Cheese', 'pasta', 5, 'pasta*2 cheese*2 milk butter bread', 4, 52, 10, { oven: true, shelf: 3, learn: E(3, 'gen_mac_cheese') }),
  rc('pad_thai', 'Pad Thai', 'pasta', 5, 'rice_noodles shrimp eggs peanuts lime spring_onion', 2, 54, 11, { min: 35, learn: B('cookbook_wok') }),
  rc('gnocchi', 'Potato Gnocchi in Butter', 'pasta', 6, 'potato*2 flour eggs butter parmesan', 3, 54, 11, { min: 60, learn: B('cookbook_pasta') }),
  rc('ramen', 'Shoyu Ramen', 'pasta', 6, 'noodles*2 pork eggs soy_sauce spring_onion stock', 2, 60, 12, { tier: 1, min: 70, moodlet: GOOD, learn: F('haru') }),
  rc('lasagna', 'Sunday Lasagna', 'pasta', 7, 'pasta*2 ground_beef*2 tomato_sauce*2 mozzarella milk onion', 6, 60, 12, { oven: true, min: 80, shelf: 4, moodlet: GOOD, learn: B('cookbook_pasta') }),
  rc('pho', 'Slow-Simmered Pho', 'pasta', 7, 'beef rice_noodles onion ginger herbs stock*2', 4, 58, 12, { tier: 1, min: 100, energy: 4, shelf: 3, learn: E(3, 'gen_pho') }),
  rc('seafood_linguine', 'Mussel & Shrimp Linguine', 'pasta', 8, 'pasta*2 mussels shrimp garlic tomato herbs olive_oil', 4, 62, 16, { tier: 1, min: 55, moodlet: GOOD, learn: B('cookbook_bay') }),

  // ============================================================ RICE & CURRIES
  rc('egg_fried_rice', 'Egg Fried Rice', 'rice', 1, 'rice eggs carrot', 2, 36, 3, { min: 18 }),
  rc('rice_and_beans', 'Rice & Beans', 'rice', 1, 'rice beans onion', 2, 40, 2, { min: 20, shelf: 3 }),
  rc('dal', 'Golden Dal & Rice', 'rice', 2, 'lentils curry_powder onion garlic rice', 3, 44, 4, { min: 35, shelf: 4, learn: B('cookbook_spice') }),
  rc('burrito_bowl', 'Burrito Bowl', 'rice', 2, 'rice beans salsa cheese lettuce', 2, 46, 5, { min: 22, learn: B('cookbook_taqueria') }),
  rc('onigiri', 'Tuna Onigiri', 'rice', 2, 'rice tuna nori', 3, 26, 6, { min: 25, gift: [5, 'homemade', 'cute'], learn: B('cookbook_izakaya') }),
  rc('chickpea_curry', 'Chickpea Coconut Curry', 'rice', 3, 'chickpeas coconut_milk curry_powder onion rice', 3, 50, 6, { min: 35, shelf: 4, learn: B('cookbook_spice') }),
  rc('kimchi_fried_rice', 'Kimchi Fried Rice', 'rice', 3, 'rice kimchi eggs spring_onion sesame', 2, 48, 8, { min: 20, learn: F('mr_oh') }),
  rc('chicken_curry', 'Chicken Curry & Rice', 'rice', 4, 'chicken curry_powder onion tomato_sauce plain_yogurt rice', 3, 56, 8, { min: 45, shelf: 4, learn: B('cookbook_spice') }),
  rc('beef_broccoli', 'Beef & Broccoli', 'rice', 4, 'beef broccoli soy_sauce garlic ginger rice', 2, 56, 8, { min: 30, learn: B('cookbook_wok') }),
  rc('stuffed_peppers', 'Stuffed Peppers', 'rice', 4, 'bell_pepper*2 rice ground_beef tomato_sauce cheese', 4, 48, 7, { oven: true, min: 50, shelf: 3, learn: B('cookbook_roast') }),
  rc('poke_bowl', 'Bay Poke Bowl', 'rice', 4, 'salmon rice avocado cucumber soy_sauce nori', 2, 52, 12, { min: 25, shelf: 1, learn: B('cookbook_bay') }),
  rc('green_curry', 'Green Coconut Curry', 'rice', 5, 'chicken coconut_milk chili herbs broccoli rice', 3, 56, 10, { min: 40, shelf: 3, learn: B('cookbook_spice') }),
  rc('teriyaki_salmon', 'Teriyaki Salmon Bowl', 'rice', 5, 'salmon rice soy_sauce honey broccoli sesame', 2, 58, 12, { min: 35, learn: B('cookbook_bay') }),
  rc('bibimbap', 'Bibimbap', 'rice', 5, 'rice beef spinach carrot eggs kimchi sesame', 2, 60, 11, { min: 45, learn: E(3, 'gen_bibimbap') }),
  rc('sweet_sour_pork', 'Sweet & Sour Pork', 'rice', 5, 'pork bell_pepper orange sugar soy_sauce rice', 3, 56, 10, { min: 40, learn: B('cookbook_wok') }),
  rc('mapo_tofu', 'Mapo Tofu', 'rice', 5, 'tofu ground_beef chili garlic soy_sauce rice', 2, 54, 10, { min: 30, energy: 2, learn: B('cookbook_wok') }),
  rc('katsu_curry', 'Katsu Curry', 'rice', 6, 'pork flour eggs curry_powder rice carrot', 2, 62, 12, { min: 50, learn: L(6) }),
  rc('biryani', 'Festive Chicken Biryani', 'rice', 8, 'chicken*2 rice*2 plain_yogurt onion*2 curry_powder herbs', 6, 64, 14, { tier: 1, min: 85, shelf: 3, moodlet: GOOD, learn: B('cookbook_spice') }),

  // ============================================================ WORLD KITCHEN (tacos, dumplings, street food, the city's restaurants)
  rc('hot_dogs', 'Ballpark Hot Dogs', 'world', 1, 'buns sausage', 2, 34, 6, { min: 12 }),
  rc('bean_tacos', 'Bean & Cheese Tacos', 'world', 1, 'tortillas beans cheese', 2, 34, 5, { min: 12 }),
  rc('nachos', 'Loaded Nachos', 'world', 2, 'tortillas cheese beans salsa', 2, 36, 9, { min: 18, social: 2, learn: F('kit') }),
  rc('chicken_tacos', 'Chicken Tacos', 'world', 3, 'tortillas chicken salsa lettuce lime', 3, 44, 8, { min: 28, learn: E(3, 'stand_taco_single') }),
  rc('burgers', 'Smash Burgers', 'world', 3, 'buns ground_beef cheese lettuce tomato', 2, 58, 9, { min: 25, learn: E(3, 'diner_burger') }),
  rc('agedashi_tofu', 'Agedashi Tofu', 'world', 3, 'tofu flour soy_sauce stock spring_onion', 2, 30, 8, { min: 22, learn: B('cookbook_izakaya') }),
  rc('patty_melt', "Dot's Patty Melt", 'world', 4, 'bread ground_beef cheese onion butter', 2, 56, 8, { min: 28, learn: F('dot') }),
  rc('beef_burrito', 'Moon Burrito', 'world', 4, 'tortillas ground_beef rice beans cheese salsa', 2, 62, 7, { min: 35, learn: E(3, 'stand_taco_burrito') }),
  rc('falafel', 'Falafel Wraps', 'world', 4, 'chickpeas*2 pita herbs garlic tahini cucumber', 3, 50, 8, { min: 40, learn: E(3, 'gen_falafel_wrap') }),
  rc('potstickers', 'Mushroom Potstickers', 'world', 4, 'dumpling_wrappers mushroom cabbage garlic soy_sauce', 3, 38, 8, { min: 40, learn: B('cookbook_wok') }),
  rc('yakitori', 'Yakitori Skewers', 'world', 4, 'chicken spring_onion soy_sauce sugar', 3, 34, 10, { min: 30, learn: B('cookbook_izakaya') }),
  rc('okonomiyaki', 'Okonomiyaki', 'world', 4, 'cabbage*2 flour eggs bacon spring_onion', 2, 50, 10, { min: 30, learn: F('walt') }),
  rc('fish_tacos', 'Baja Fish Tacos', 'world', 5, 'tortillas fish cabbage lime flour avocado', 3, 50, 11, { min: 40, learn: B('cookbook_taqueria') }),
  rc('enchiladas', 'Cheesy Enchiladas', 'world', 5, 'tortillas*2 chicken tomato_sauce cheese*2 chili', 4, 54, 10, { oven: true, min: 55, shelf: 3, learn: B('cookbook_taqueria') }),
  rc('dumplings', 'Pork & Cabbage Dumplings', 'world', 5, 'dumpling_wrappers*2 pork cabbage ginger soy_sauce', 4, 44, 10, { min: 55, shelf: 3, learn: E(3, 'market_dumplings', 'gen_gyoza', 'ramen_gyoza') }),
  rc('karaage', 'Chicken Karaage', 'world', 5, 'chicken flour soy_sauce ginger garlic lemon', 3, 44, 12, { min: 40, learn: B('cookbook_izakaya') }),
  rc('sambusas', 'Lentil Sambusas', 'world', 5, 'flour lentils onion berbere olive_oil', 6, 20, 6, { min: 60, shelf: 3, gift: [6, 'homemade'], learn: E(3, 'gen_sambusa') }),
  rc('samosas', 'Potato Samosas', 'world', 5, 'flour potato*2 peas curry_powder olive_oil', 6, 22, 7, { min: 60, shelf: 3, gift: [6, 'homemade'], learn: B('cookbook_spice') }),
  rc('shawarma', 'Chicken Shawarma Plate', 'world', 6, 'chicken pita plain_yogurt garlic bbq_spice cucumber tomato', 3, 58, 11, { oven: true, min: 55, learn: B('cookbook_spice') }),
  rc('tacos_al_pastor', 'Tacos al Pastor', 'world', 6, 'tortillas*2 pork orange chili onion herbs', 4, 52, 12, { min: 60, learn: E(3, 'gen_taco_pastor') }),
  rc('fried_chicken', 'Soul-Kitchen Fried Chicken', 'world', 6, 'chicken*2 flour eggs bbq_spice olive_oil', 4, 58, 12, { tier: 1, min: 55, moodlet: GOOD, learn: E(3, 'gen_soul_plate') }),
  rc('bao', 'Fluffy Pork Bao', 'world', 7, 'flour*2 yeast pork soy_sauce sugar spring_onion', 6, 36, 12, { tier: 1, min: 90, shelf: 3, gift: [8, 'homemade', 'cute'], learn: E(3, 'gen_pork_bao') }),
  rc('maki_rolls', 'Maki Rolls', 'world', 7, 'rice*2 nori*2 salmon cucumber avocado soy_sauce', 4, 44, 16, { min: 50, shelf: 1, gift: [9, 'homemade', 'fancy'], learn: B('cookbook_izakaya') }),
  rc('korean_bbq', 'Korean BBQ at Home', 'world', 7, 'beef*2 soy_sauce garlic sugar sesame lettuce kimchi rice', 4, 64, 16, { tier: 1, min: 50, social: 4, moodlet: GOOD, learn: E(3, 'gen_kbbq_set') }),
  rc('injera_plate', 'Injera & Wot Platter', 'world', 8, 'flour*2 yeast lentils*2 berbere onion*2 cabbage carrot', 4, 62, 14, { tier: 1, min: 100, social: 4, moodlet: GOOD, learn: E(3, 'gen_injera_platter') }),
  rc('dim_sum', 'Dim Sum Spread', 'world', 9, 'dumpling_wrappers*2 shrimp pork flour mushroom spring_onion soy_sauce', 6, 56, 20, { tier: 1, min: 110, social: 3, moodlet: FINE, learn: E(5, 'gen_dimsum_basket') }),

  // ============================================================ ROASTS, FISH & PIZZA
  rc('pan_fish', 'Pan-Fried Fish & Lemon', 'mains', 2, 'fish butter lemon', 1, 46, 6, { min: 18 }),
  rc('sausage_mash', 'Bangers & Mash', 'mains', 2, 'sausage potato butter onion', 2, 52, 4, { min: 30 }),
  rc('flatbreads', 'Skillet Flatbreads', 'mains', 2, 'flour plain_yogurt olive_oil', 4, 20, 3, { min: 25, shelf: 3, learn: B('cookbook_student') }),
  rc('roast_veg', 'Tray-Roasted Vegetables', 'mains', 2, 'potato carrot bell_pepper onion olive_oil', 3, 34, 4, { oven: true, min: 40, energy: 2, learn: B('cookbook_roast') }),
  rc('pork_chops', 'Pork Chops & Apple', 'mains', 3, 'pork apple onion butter', 2, 52, 6, { learn: L(3) }),
  rc('chicken_tenders', 'Crispy Chicken Tenders', 'mains', 3, 'chicken flour eggs bread', 3, 42, 9, { learn: L(3) }),
  rc('fish_cakes', 'Fish Cakes', 'mains', 3, 'fish potato eggs flour herbs', 4, 42, 6, { min: 35, learn: B('cookbook_bay') }),
  rc('garlic_shrimp', 'Garlic Butter Shrimp', 'mains', 3, 'shrimp garlic butter lemon bread', 2, 44, 10, { min: 20, learn: B('cookbook_bay') }),
  rc('lemon_chicken', 'Lemon Herb Chicken Traybake', 'mains', 4, 'chicken*2 potato*2 lemon herbs garlic', 4, 56, 8, { oven: true, min: 60, shelf: 3, learn: B('cookbook_roast') }),
  rc('garlic_knots', 'Garlic Knots', 'mains', 4, 'flour yeast garlic butter herbs', 6, 18, 6, { oven: true, min: 50, gift: [6, 'homemade'], learn: E(3, 'pizza_garlic_knots') }),
  rc('baked_salmon', 'Honey-Glazed Salmon', 'mains', 5, 'salmon honey lemon broccoli potato', 2, 58, 11, { oven: true, min: 40, learn: L(5) }),
  rc('cottage_pie', 'Cottage Pie', 'mains', 5, 'ground_beef potato*2 carrot peas onion butter', 4, 56, 8, { oven: true, min: 65, shelf: 4, learn: L(5) }),
  rc('ratatouille', 'Ratatouille', 'mains', 5, 'bell_pepper tomato*2 onion garlic olive_oil herbs', 4, 40, 10, { oven: true, min: 60, shelf: 4, learn: L(6) }),
  rc('meatloaf', 'Diner Meatloaf', 'mains', 5, 'ground_beef*2 bread eggs onion tomato_sauce', 6, 52, 8, { oven: true, min: 70, shelf: 4, learn: B('cookbook_roast') }),
  rc('mussels_broth', 'Mussels in White Broth', 'mains', 5, 'mussels*2 garlic cream herbs bread', 2, 48, 14, { min: 30, shelf: 1, learn: B('cookbook_bay') }),
  rc('margherita', "Nico's Margherita", 'mains', 6, 'flour*2 yeast tomato_sauce mozzarella herbs olive_oil', 4, 54, 14, { oven: true, min: 70, shelf: 3, moodlet: GOOD, learn: F('nico') }),
  rc('sausage_pizza', 'Sausage & Pepper Pizza', 'mains', 6, 'flour*2 yeast tomato_sauce mozzarella sausage bell_pepper', 4, 58, 13, { oven: true, min: 70, shelf: 3, moodlet: GOOD, learn: E(3, 'pizza_pepperoni', 'pizza_margherita') }),
  rc('quiche', 'Quiche Lorraine', 'mains', 6, 'flour butter eggs*2 bacon cream cheese', 6, 40, 9, { oven: true, min: 70, shelf: 4, gift: [7, 'homemade'], learn: E(3, 'bakery_quiche') }),
  rc('fish_pie', 'Harbor Fish Pie', 'mains', 6, 'fish shrimp potato*2 milk butter peas', 4, 58, 10, { oven: true, min: 70, shelf: 3, learn: B('cookbook_bay') }),
  rc('pulled_pork', 'Pulled Pork Buns', 'mains', 7, 'pork*2 buns*2 bbq_spice onion cabbage sugar', 6, 56, 12, { oven: true, min: 110, shelf: 4, moodlet: GOOD, learn: B('cookbook_roast') }),
  rc('steak_frites', 'Steak Frites', 'mains', 7, 'beef potato*2 butter garlic herbs', 2, 68, 16, { tier: 1, min: 45, moodlet: FINE, learn: E(2, 'gull_steak') }),
  rc('bbq_ribs', 'Sticky BBQ Ribs', 'mains', 8, 'pork*3 bbq_spice honey tomato_sauce garlic corn', 6, 64, 14, { oven: true, min: 120, shelf: 4, moodlet: GOOD, learn: B('cookbook_roast') }),
  rc('catch_of_the_day', 'Catch of the Day', 'mains', 9, 'fish*2 butter lemon herbs potato spinach cream', 4, 66, 18, { tier: 2, min: 60, moodlet: FINE, learn: E(2, 'gull_catch') }),
  rc('beef_wellington', 'Beef Wellington', 'mains', 10, 'beef*2 mushroom*2 flour butter*2 eggs ham', 6, 72, 22, { oven: true, tier: 2, min: 120, shelf: 3, moodlet: FINE, learn: E(2, 'gull_tasting') }),
  rc('seafood_boil', 'Maple Bay Seafood Boil', 'mains', 10, 'shrimp*2 mussels*2 fish corn*2 potato*2 sausage lemon butter', 6, 72, 22, { tier: 2, min: 80, social: 5, moodlet: FINE, learn: L(10) }),

  // ============================================================ BAKING (most are giftable)
  rc('pb_cookies', 'Peanut Butter Cookies', 'baking', 2, 'peanut_butter sugar eggs', 6, 12, 8, { oven: true, min: 25, shelf: 7, moodlet: SW, gift: [6, 'sweet', 'homemade'] }),
  rc('shortbread', 'Butter Shortbread', 'baking', 2, 'flour butter sugar', 6, 12, 7, { oven: true, min: 30, shelf: 10, moodlet: SW, gift: [6, 'sweet', 'homemade'], learn: B('cookbook_baking') }),
  rc('oat_cookies', 'Oat & Honey Cookies', 'baking', 2, 'oats flour butter honey', 6, 12, 7, { oven: true, min: 28, shelf: 7, moodlet: SW, gift: [6, 'sweet', 'homemade'], learn: B('cookbook_baking') }),
  rc('banana_bread', 'Banana Bread', 'baking', 3, 'banana*2 flour sugar eggs butter', 6, 18, 8, { oven: true, min: 55, moodlet: SW, gift: [7, 'sweet', 'homemade', 'cozy'] }),
  rc('no_knead_bread', 'No-Knead Bread', 'baking', 3, 'flour*2 yeast', 6, 18, 2, { oven: true, min: 60, shelf: 4, gift: [5, 'homemade'], learn: B('cookbook_baking') }),
  rc('cornbread', 'Skillet Cornbread', 'baking', 3, 'cornmeal flour eggs milk butter', 6, 20, 5, { oven: true, min: 35, shelf: 4, gift: [5, 'homemade'], learn: B('cookbook_baking') }),
  rc('muffins', 'Blueberry Muffins', 'baking', 3, 'flour sugar eggs milk berries butter', 6, 16, 8, { oven: true, min: 35, moodlet: SW, gift: [7, 'sweet', 'homemade'], learn: E(3, 'cafe_muffin') }),
  rc('brownies', 'Fudgy Brownies', 'baking', 4, 'cocoa chocolate_chips butter sugar eggs flour', 6, 16, 12, { oven: true, min: 40, shelf: 6, moodlet: SW, gift: [8, 'sweet', 'homemade'], learn: B('cookbook_baking') }),
  rc('scones', 'Jam & Cream Scones', 'baking', 4, 'flour butter milk jam cream', 6, 18, 10, { oven: true, min: 35, shelf: 3, moodlet: SW, gift: [8, 'sweet', 'homemade', 'cozy'], learn: B('cookbook_baking') }),
  rc('focaccia', 'Rosemary Focaccia', 'baking', 4, 'flour*2 yeast olive_oil herbs', 6, 20, 5, { oven: true, min: 70, shelf: 4, gift: [6, 'homemade'], learn: B('cookbook_baking') }),
  rc('lemon_drizzle', 'Lemon Drizzle Loaf', 'baking', 4, 'flour sugar eggs butter lemon*2', 6, 18, 10, { oven: true, min: 55, moodlet: SW, gift: [8, 'sweet', 'homemade'], learn: B('cookbook_baking') }),
  rc('gingerbread', 'Gingerbread Folk', 'baking', 5, 'flour sugar butter ginger cinnamon honey', 6, 12, 12, { oven: true, min: 50, shelf: 10, moodlet: SW, gift: [9, 'sweet', 'homemade', 'cute'], learn: L(5) }),
  rc('berry_pie', 'Diner Berry Pie', 'baking', 5, 'flour butter berries*2 sugar', 6, 20, 12, { oven: true, min: 65, shelf: 4, moodlet: SW, gift: [9, 'sweet', 'homemade'], learn: E(3, 'diner_pie') }),
  rc('carrot_cake', 'Carrot Cake', 'baking', 5, 'carrot*2 flour sugar eggs cream_cheese cinnamon', 6, 20, 13, { oven: true, min: 65, moodlet: SW, gift: [10, 'sweet', 'homemade'], learn: B('cookbook_patisserie') }),
  rc('apple_maple_pie', 'Copper Kettle Apple-Maple Pie', 'baking', 6, 'flour butter apple*3 maple_syrup cinnamon', 6, 22, 15, { oven: true, min: 75, shelf: 4, moodlet: SW, gift: [11, 'sweet', 'homemade', 'cozy'], learn: ST('nana') }),
  rc('cinnamon_rolls', 'Cinnamon Rolls', 'baking', 6, 'flour*2 yeast butter sugar cinnamon milk', 6, 20, 13, { oven: true, min: 85, shelf: 3, moodlet: SW, gift: [9, 'sweet', 'homemade', 'cozy'], learn: F('roz') }),
  rc('bagels', 'Boiled Bagels', 'baking', 6, 'flour*2 yeast honey sesame', 6, 24, 5, { oven: true, min: 80, shelf: 4, gift: [6, 'homemade'], learn: E(3, 'bakery_bagel', 'gen_bagel_egg', 'gen_bagel_lox') }),
  rc('donuts', 'Glazed Donuts', 'baking', 6, 'flour*2 yeast sugar*2 milk olive_oil', 6, 18, 13, { min: 80, shelf: 2, moodlet: SW, gift: [8, 'sweet', 'homemade', 'fun'], learn: E(3, 'gen_donut', 'gen_donut_box') }),
  rc('pumpkin_pie', 'Harvest Pumpkin Pie', 'baking', 6, 'pumpkin flour butter eggs sugar cinnamon cream', 6, 20, 13, { oven: true, min: 80, shelf: 4, moodlet: SW, gift: [10, 'sweet', 'homemade', 'cozy'], learn: B('cookbook_patisserie') }),
  rc('choc_cake', 'Triple Chocolate Cake', 'baking', 7, 'flour cocoa chocolate_chips sugar eggs*2 butter cream', 6, 22, 16, { oven: true, min: 80, moodlet: SW, gift: [12, 'sweet', 'homemade', 'fancy'], learn: B('cookbook_patisserie') }),
  rc('cheesecake', 'Baked Cheesecake', 'baking', 7, 'cream_cheese*2 eggs sugar butter oats berries', 6, 22, 16, { oven: true, min: 85, moodlet: SW, gift: [11, 'sweet', 'homemade', 'fancy'], learn: B('cookbook_patisserie') }),
  rc('sourdough', 'Sourdough Loaf', 'baking', 8, 'flour*3 yeast', 6, 24, 6, { oven: true, min: 120, shelf: 6, gift: [8, 'homemade', 'fancy'], learn: L(8) }),
  rc('croissants', 'Butter Croissants', 'baking', 9, 'flour*2 butter*3 yeast milk sugar', 6, 22, 14, { oven: true, tier: 2, min: 120, shelf: 3, gift: [11, 'homemade', 'fancy'], learn: E(5, 'cafe_croissant') }),
  rc('celebration_cake', 'Celebration Layer Cake', 'baking', 9, 'flour*2 sugar*2 eggs*2 butter*2 cream berries jam', 6, 24, 20, { oven: true, min: 110, moodlet: SW, gift: [14, 'sweet', 'homemade', 'fancy'], learn: B('cookbook_patisserie') }),

  // ============================================================ DESSERTS
  rc('fried_bananas', 'Caramel Fried Bananas', 'sweet', 1, 'banana butter sugar', 1, 16, 8, { min: 8, moodlet: SW }),
  rc('mug_cake', 'Chocolate Mug Cake', 'sweet', 1, 'flour cocoa sugar milk', 1, 14, 9, { min: 8, shelf: 1, moodlet: SW, learn: B('cookbook_student') }),
  rc('ice_pops', 'Berry Ice Pops', 'sweet', 1, 'berries orange sugar', 4, 5, 9, { none: true, min: 10, shelf: 14, learn: B('card_smoothies') }),
  rc('rice_pudding', 'Cinnamon Rice Pudding', 'sweet', 2, 'rice milk sugar cinnamon', 3, 22, 8, { min: 35, moodlet: SW, learn: L(2) }),
  rc('apple_crumble', 'Apple Crumble', 'sweet', 3, 'apple*2 oats butter sugar', 4, 22, 10, { oven: true, min: 45, moodlet: SW, gift: [7, 'sweet', 'homemade', 'cozy'], learn: L(4) }),
  rc('crepes', 'Lemon Sugar Crepes', 'sweet', 3, 'flour eggs milk lemon sugar', 3, 24, 10, { min: 25, shelf: 2, moodlet: SW, learn: E(3, 'market_crepe') }),
  rc('mango_sticky_rice', 'Mango Sticky Rice', 'sweet', 4, 'rice coconut_milk mango sugar', 2, 30, 12, { min: 35, shelf: 2, moodlet: SW, learn: B('cookbook_wok') }),
  rc('churros', 'Churros & Chocolate', 'sweet', 5, 'flour sugar cinnamon olive_oil chocolate_chips milk', 4, 20, 14, { min: 40, shelf: 1, moodlet: SW, learn: B('cookbook_taqueria') }),
  rc('choc_mousse', 'Chocolate Mousse', 'sweet', 5, 'chocolate_chips cream eggs sugar', 4, 14, 14, { min: 30, moodlet: SW, gift: [8, 'sweet', 'homemade', 'fancy'], learn: L(7) }),
  rc('mochi', 'Mochi Trio', 'sweet', 6, 'rice*2 sugar berries cocoa', 6, 14, 12, { min: 60, moodlet: SW, gift: [9, 'sweet', 'homemade', 'cute'], learn: E(3, 'gen_mochi') }),
  rc('tiramisu', 'Tiramisu', 'sweet', 6, 'cream_cheese cream coffee sugar cocoa bread', 6, 16, 15, { none: true, min: 30, shelf: 4, moodlet: SW, gift: [10, 'sweet', 'homemade', 'fancy'], learn: E(3, 'pizza_tiramisu') }),
  rc('fruit_tart', 'Glazed Fruit Tart', 'sweet', 7, 'flour butter cream eggs berries sugar jam', 6, 18, 15, { oven: true, min: 80, shelf: 4, moodlet: SW, gift: [11, 'sweet', 'homemade', 'fancy'], learn: E(3, 'bakery_fruit_tart') }),
  rc('baklava', 'Honey Nut Baklava', 'sweet', 8, 'flour butter*2 peanuts*2 honey*2 cinnamon', 6, 16, 16, { oven: true, min: 90, shelf: 8, moodlet: SW, gift: [12, 'sweet', 'homemade', 'fancy'], learn: B('cookbook_spice') }),
  rc('souffle', 'Chocolate Souffle', 'sweet', 9, 'chocolate_chips eggs*3 sugar butter cocoa', 4, 14, 18, { oven: true, tier: 2, min: 45, shelf: 1, moodlet: SW, learn: E(2, 'gull_souffle') }),
  rc('maple_taffy', 'Festival Maple Taffy', 'sweet', 4, 'maple_syrup*2 butter', 6, 6, 12, { min: 40, shelf: 14, moodlet: SW, gift: [8, 'sweet', 'homemade', 'fun'], learn: ST('roz') }),

  // ============================================================ DRINKS (made at the counter or in a pot; drunk, not eaten)
  rc('pot_of_tea', 'Pot of Tea', 'drink', 1, 'tea', 2, 0, 5, { energy: 4 }),
  rc('pot_of_coffee', 'Fresh Pot of Coffee', 'drink', 1, 'coffee', 2, 0, 0, { energy: 10, caffeine: true }),
  rc('hot_chocolate', 'Hot Chocolate', 'drink', 1, 'milk cocoa sugar', 2, 5, 8, { min: 8, moodlet: SW }),
  rc('banana_smoothie', 'Banana Smoothie', 'drink', 1, 'banana milk', 1, 14, 3, { none: true, energy: 5 }),
  rc('orange_juice', 'Fresh-Squeezed Orange Juice', 'drink', 1, 'orange*2', 1, 6, 2, { none: true, energy: 6 }),
  rc('lemonade', 'Mint Lemonade', 'drink', 1, 'lemon*2 sugar herbs', 4, 0, 7, { none: true, min: 8, energy: 3, shelf: 4 }),
  rc('berry_smoothie', 'Berry Blast Smoothie', 'drink', 1, 'berries plain_yogurt banana', 2, 14, 5, { none: true, energy: 6, learn: B('card_smoothies') }),
  rc('green_smoothie', 'Green Smoothie', 'drink', 2, 'spinach apple banana lemon', 2, 14, 2, { none: true, energy: 8, learn: B('card_smoothies') }),
  rc('mango_lassi', 'Mango Lassi', 'drink', 2, 'mango plain_yogurt sugar', 2, 8, 8, { none: true, learn: B('cookbook_spice') }),
  rc('milkshake', 'Strawberry Milkshake', 'drink', 2, 'milk berries sugar cream', 2, 12, 10, { none: true, moodlet: SW, learn: E(3, 'diner_milkshake') }),
  rc('masala_chai', 'Masala Chai', 'drink', 2, 'tea milk cinnamon ginger sugar', 3, 0, 7, { min: 12, energy: 5, learn: F('vik') }),
  rc('mulled_cider', 'Mulled Apple Cider', 'drink', 2, 'apple*2 cinnamon orange sugar', 4, 0, 8, { min: 20, energy: 3, shelf: 3, moodlet: SW, learn: E(3, 'hot_cider') }),
  rc('horchata', 'Horchata', 'drink', 3, 'rice milk cinnamon sugar', 4, 0, 6, { none: true, min: 15, energy: 3, shelf: 3, learn: E(3, 'stand_taco_horchata') }),
  rc('maple_latte', 'Iced Maple Latte', 'drink', 3, 'coffee milk maple_syrup', 2, 0, 5, { min: 8, energy: 10, caffeine: true, learn: E(5, 'cafe_latte', 'cafe_iced_coffee') }),
  rc('garden_spritz', 'Garden Spritz', 'drink', 3, 'cucumber lime herbs sugar', 3, 0, 9, { none: true, min: 8, social: 2, learn: E(3, 'bar_mocktail') }),
  rc('boba_tea', 'Brown Sugar Boba', 'drink', 5, 'tea milk sugar*2 flour', 2, 4, 12, { min: 35, energy: 5, moodlet: SW, learn: E(3, 'gen_boba', 'gen_taro_boba') }),
];

/** cat / oven / learn for the 17 original recipes (items.js applies this; the recipes themselves are untouched) */
export const LEGACY_PATCH = {
  garden_salad: { cat: 'light' }, scrambled_eggs: { cat: 'breakfast' }, grilled_cheese: { cat: 'light' }, noodle_soup: { cat: 'soup' }, bacon_and_eggs: { cat: 'breakfast' },
  pancakes: { cat: 'breakfast' }, tomato_pasta: { cat: 'pasta' }, veggie_stir_fry: { cat: 'rice' }, choc_chip_cookies: { cat: 'baking', oven: true }, chicken_rice_bowl: { cat: 'rice' },
  fish_and_chips: { cat: 'mains', learn: L(4) }, beef_stew: { cat: 'soup', learn: L(5) }, homemade_pizza: { cat: 'mains', oven: true, learn: L(5) },
  mushroom_risotto: { cat: 'rice', learn: B('cookbook_pasta') }, lemon_tart: { cat: 'baking', oven: true, learn: B('cookbook_patisserie') },
  sunday_roast: { cat: 'mains', oven: true, learn: ST('theo') }, bay_paella: { cat: 'rice', learn: B('cookbook_bay') },
};

// ---------------------------------------------------------------------------------------------
// COOKBOOKS & RECIPE CARDS — 'misc' items. Buying one teaches every recipe in it at once (src/sim/activities.js cooking section);
// the book then lives on your kitchen shelf (G.state.cook.books), not in the backpack.
// ---------------------------------------------------------------------------------------------
const BOOKSHOP = ['bookstore'];
const cb = (id, name, price, soldAt, icon, blurb) => ({ id, name, category: 'misc', price, icon, effects: {}, stack: 1, soldAt, cookbook: true, blurb });
const BOOK_DEFS = [
  cb('cookbook_student', "The Broke Student's Kitchen", 8, ['grocery', 'cornerstore', 'bookstore'], 'yellow paperback, fork', 'Cheap, fast and filling'),
  cb('card_smoothies', 'Recipe Card: Blender Basics', 3, ['grocery', 'cornerstore'], 'pink card, glass with straw', 'Smoothies and ice pops'),
  cb('card_picnic', 'Recipe Card: Picnic Plates', 3, ['grocery', 'bookstore'], 'green card, salad bowl', 'Salads for a sunny day'),
  cb('cookbook_brunch', 'Brunch All Day', 12, ['bookstore', 'grocery'], 'orange book, fried egg', 'Eggs every way and slow mornings'),
  cb('cookbook_soups', 'A Pot of Something', 12, BOOKSHOP, 'red book, steaming pot', 'Soups and stews for cold evenings'),
  cb('cookbook_pasta', 'Nonna Said No Cream', 14, BOOKSHOP, 'green book, pasta swirl', 'Italian classics'),
  cb('cookbook_wok', 'Wok Hei at Home', 14, BOOKSHOP, 'black book, red wok', 'Stir-fries, noodles and potstickers'),
  cb('cookbook_izakaya', 'Izakaya Nights', 14, BOOKSHOP, 'indigo book, paper lantern', 'Small Japanese plates'),
  cb('cookbook_spice', 'The Spice Road', 14, BOOKSHOP, 'gold book, chili', 'Curries, samosas and sweets'),
  cb('cookbook_taqueria', 'Masa & Fuego', 12, ['bookstore', 'cornerstore'], 'teal book, taco', 'Tacos, enchiladas and churros'),
  cb('cookbook_bay', 'Catch of the Bay', 16, BOOKSHOP, 'blue book, silver fish', 'Maple Bay seafood'),
  cb('cookbook_roast', 'Low & Slow', 16, BOOKSHOP, 'brown book, flame', 'Roasts, ribs and traybakes'),
  cb('cookbook_baking', 'Flour Power', 14, ['bookstore', 'grocery'], 'cream book, wheat ear', 'Bread, cookies and everyday baking'),
  cb('cookbook_patisserie', 'Sugar & Patience', 18, BOOKSHOP, 'pink book, layer cake', 'Cakes and pies worth giving away'),
];
/** finish the cookbook items once the full recipe list (originals + extras) is known. items.js calls this. */
export function buildCookbooks(allRecipes) {
  return BOOK_DEFS.map(b => {
    const rs = allRecipes.filter(r => r.learn && r.learn.book === b.id);
    return { ...b, teaches: rs.map(r => r.id), note: `${b.blurb}: ${rs.length} recipes (${rs.slice(0, 3).map(r => r.name).join(', ')}${rs.length > 3 ? '...' : ''}). Yours the moment you buy it.` };
  });
}
