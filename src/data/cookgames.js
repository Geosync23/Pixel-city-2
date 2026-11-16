// Which mini-game fits WHAT IS BEING DONE (owner msgs 158, 162): every recipe -> one cooking game, every exercise machine -> one fitness game.
// Game keys are defined in src/sim/skillplay.js GAMES; the kinds in src/ui/minigame.js. validate.mjs fails when a recipe has no game.
//
//   cookGameOf(recipe) -> key      1. BY_GAME (the override table: every dish that needs a decision is listed under its game)
//                                  2. the rule: drinks (blended names -> ck_blend; simmered with 3+ things -> ck_stir; else ck_pour) · oven -> ck_oven · soups, pasta, rice -> ck_stir
//                                     · no-cook: salads -> ck_chop, the rest -> ck_build.      Anything the rule does not reach returns null (validate.mjs then fails).
//   COOK_GAMES   key -> what the player does (for the report, the Me app and validate)
//   dishTheme(recipe) -> { icon, color, pal, icons, pieces }   the look of the game: the meal's icon, a colour from its main ingredient, its ingredients as chopping / stacking pieces
//   machineGameOf(machineId(fx)) -> key  by the fixture's art id + goods kind (home goods and the gym share it); MACHINE_ACTS = the activities that ask it; machineAnim(id) -> the player's animation
//   gameFor(activityId, ctx) -> key | null     the one lookup skillplay uses (ctx.recipe / ctx.fx decide; everything else is GAME_FOR)
import { RECIPE_BY_ID, ITEM_BY_ID } from './items.js';
import { GAME_FOR } from './skills_extra.js';

export const COOK_GAMES = {
  flip: 'Pan flip: tap in the green to turn it',
  ck_blend: 'Blender: hold to blend, let go before it overflows',
  ck_chop: 'Chopping: tap as the knife crosses each mark',
  ck_stir: 'Stirring: circle the pot at a steady speed',
  ck_oven: 'Oven: take it out in the golden window',
  ck_fry: 'Deep fryer: lift the basket when it is golden',
  ck_boil: 'Boil / steam: lift it out at the right moment',
  ck_build: 'Assembling: place the pieces in the order on the card',
  ck_pour: 'Pouring: fill to the line',
  ck_knead: 'Kneading: push and fold in time',
};

const BY_GAME = {
  flip: 'grilled_cheese bacon_and_eggs pancakes maple_pancakes french_toast cheese_omelette cinnamon_toast breakfast_hash spanish_tortilla full_breakfast quesadilla tuna_melt patty_melt burgers okonomiyaki potstickers yakitori korean_bbq '
    + 'pan_fish pork_chops fish_cakes garlic_shrimp steak_frites catch_of_the_day fried_bananas crepes veggie_stir_fry egg_fried_rice kimchi_fried_rice beef_broccoli sweet_sour_pork chicken_rice_bowl teriyaki_salmon fried_noodles chow_mein pad_thai',
  ck_stir: 'scrambled_eggs porridge banana_porridge congee shakshuka eggs_benedict sausage_mash injera_plate mug_cake rice_pudding mango_sticky_rice choc_mousse boba_tea',
  ck_fry: 'fish_and_chips katsu_curry agedashi_tofu falafel karaage sambusas samosas fried_chicken chicken_tenders donuts churros',
  ck_boil: 'boiled_eggs dumplings dim_sum mussels_broth seafood_boil',
  ck_build: 'avocado_toast breakfast_burrito blt egg_salad_sandwich club_sandwich banh_mi hot_dogs bean_tacos nachos chicken_tacos beef_burrito fish_tacos tacos_al_pastor maki_rolls onigiri burrito_bowl poke_bowl bibimbap',
  ck_chop: 'potato_salad bruschetta caesar_salad',
  ck_knead: 'gnocchi bao flatbreads mochi sourdough focaccia bagels cinnamon_rolls croissants garlic_knots',
  ck_blend: 'hummus_plate',
  ck_pour: 'ice_pops maple_latte maple_taffy',
};
export const COOK_OVERRIDE = {}; for (const k in BY_GAME) for (const id of BY_GAME[k].split(' ')) if (id) COOK_OVERRIDE[id] = k;

export function cookGameOf(r) {
  if (!r) return null; if (COOK_OVERRIDE[r.id]) return COOK_OVERRIDE[r.id];
  if (r.drink) return /smoothie|lassi|shake|horchata/i.test(r.name) ? 'ck_blend' : r.appliance === 'stove' && Object.keys(r.ingredients).length >= 3 ? 'ck_stir' : 'ck_pour';
  if (r.oven) return 'ck_oven';
  if (r.cat === 'soup' || r.cat === 'pasta' || r.cat === 'rice') return 'ck_stir';
  if (r.appliance === 'none') return /salad|caprese|guacamole/i.test(r.name) ? 'ck_chop' : 'ck_build';
  return null;
}

/* a colour for the dish from its most telling ingredient (first match in this order wins) */
const ING_COL = { berries: '#c0408a', mango: '#f2a23a', spinach: '#5fa84f', pumpkin: '#e88a2c', tomato_sauce: '#c8402e', cocoa: '#6a4030', chocolate_chips: '#6a4030', curry_powder: '#d9a441', miso: '#c89a5a', lentils: '#d8843a', coffee: '#5a3a28', tea: '#b8703a',
  orange: '#f08a2c', banana: '#f2dc7a', lemon: '#f2e25a', lime: '#a8d84a', tomato: '#d8342e', carrot: '#f08a2c', avocado: '#8fb84f', lettuce: '#6fbf4f', cucumber: '#7fc86a', cabbage: '#a8d08a', broccoli: '#4f9a4a', bell_pepper: '#e0453a', apple: '#d8483a', maple_syrup: '#c8782a',
  beans: '#8a4a34', beef: '#8a4a34', ground_beef: '#8a4a34', pork: '#d89a8a', ham: '#e89aa0', bacon: '#c8584a', sausage: '#b8643a', chicken: '#e8c890', fish: '#dfe6ee', salmon: '#f29a7a', shrimp: '#f2a08a', tuna: '#c8a090', tofu: '#f4efd8', mushroom: '#b89a7a',
  cheese: '#f2c230', mozzarella: '#fbf6ea', eggs: '#f6e27a', chickpeas: '#e0c080', coconut_milk: '#efe6c8', stock: '#d8b060', oats: '#e6d2a0', potato: '#e8d08a', onion: '#e8d8f0', rice: '#f4efe0', noodles: '#f0dc9a', pasta: '#f0dc9a', rice_noodles: '#f4efe0',
  bread: '#e0b46a', buns: '#e0b46a', tortillas: '#ecd9a8', pita: '#ecd9a8', nori: '#2f4a3a', flour: '#f6efdc', milk: '#f6efdc', cream: '#f6efdc', plain_yogurt: '#fbf6ea', butter: '#f6e08a', sugar: '#ffffff', peanut_butter: '#c8904a', jam: '#b8306a', pickles: '#7fa84a', kimchi: '#d85a3a', salsa: '#d8482e', herbs: '#4f9a4a' };
const colOf = id => ING_COL[id] || '#d9c9a6';
export function dishTheme(r) {
  if (!r) return { icon: 'skill.cooking', color: '#d9a441', pal: ['#f08a2c', '#5fb84f', '#d8342e'], icons: [], pieces: null };
  const ings = Object.keys(r.ingredients), main = Object.keys(ING_COL).find(k => r.ingredients[k]) || ings[0], solid = ings.filter(k => !['sugar', 'butter', 'olive_oil', 'flour', 'milk', 'cream', 'stock', 'soy_sauce'].includes(k));
  const chop = (solid.length ? solid : ings).slice(0, 3), stack = ings.slice(0, 5).map(k => [(ITEM_BY_ID[k] || {}).name || k, colOf(k), k]);
  if (stack.length < 4 || /sandwich|toast|burger|blt|club|melt|banh|bun|dog/i.test(r.name + r.id)) stack.push(stack[0].slice()); while (stack.length < 4) stack.push(['A pinch of salt', '#ffffff', null]);
  return { icon: 'meal_' + r.id, color: colOf(main), pal: chop.map(colOf), icons: chop, pieces: stack };
}

/* ---- exercise machines (art ids: gym.treadmill, gym.bike, gym.rower, gym.bag, gym.mat, gym.bench ...; home.treadmill, home.yogamat, home.dumbbells; g.fit.spinbike, g.fit.rower, g.fit.bag ...) ---- */
export const MACHINE_GAMES = [[/treadmill/, 'stride'], [/bike/, 'spin'], [/rower/, 'row'], [/\.bag|punch/, 'punch'], [/climb/, 'climb'], [/pingpong/, 'rally'], [/hoop/, 'hoops'], [/mat\b|yogamat|balance|\.balls/, 'pose']];
export const MACHINE_ACTS = ['exercise_home', 'gym_treadmill', 'gym_bike', 'gym_row', 'gym_bag', 'gym_stretch', 'gym_weights'];
export const machineGameOf = aid => { for (const [re, k] of MACHINE_GAMES) if (re.test(aid || '')) return k; return 'reps'; };
const MACHINE_ANIM = { stride: 'treadmill', spin: 'cycle', row: 'row', punch: 'punch', pose: 'yoga' };
/** the animation that goes with the machine's game (null = the activity's own) */
export const machineAnim = aid => MACHINE_ANIM[machineGameOf(aid)] || null;

/** a fixture's machine id: its art id plus the goods kind (the fitness goods share one art family: 'g.fit' + p.k 'spinbike' | 'bag' | 'rower' ...) */
export const machineId = fx => (fx && fx.asset ? (fx.asset.id || '') + '.' + (((fx.item && fx.item.p) || {}).k || '') : '');

export function gameFor(id, ctx) {
  if (id === 'cook' || id === 'prep_cold') return cookGameOf(RECIPE_BY_ID[ctx && ctx.recipe]) || 'flip';
  if (MACHINE_ACTS.includes(id)) { const mid = machineId(ctx && ctx.fx); if (mid) return machineGameOf(mid); }
  return GAME_FOR[id] || null;
}
