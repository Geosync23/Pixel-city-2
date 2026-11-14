// Maple Bay icon set: flat 16x16 pixel icons drawn with the raster kit (see _lib.js).
//
//   import { drawIcon, ICON_SIZE } from '../art/icons/icons.js';
//   const spr = toSprite(render([0, 0, 16, 16], () => drawIcon('apple')));   // sprite.c is a 22x22 canvas (3px pad)
//   // or render([0,0,16,16], () => drawIcon(id), null, 0) for an exact 16x16 buffer
//
// Ids: items use their exact item id ('apple', 'cafe_latte', 'bed_t1' ...). Everything else is namespaced:
//   need.*  skill.*  mood.*  rel.*  ui.*  weather.*  season.*  transport.*  app.*  venue.*  job.*  cat.*  glyph.*
// drawIcon(id, category?) never throws. Unknown ids fall back, in order, to: a glyph picked from the words of the id
// (WORDS below: 'spicy_taco_deluxe' -> the taco, 'desk_lamp' -> a lamp), then the category glyph (cat.<category>),
// then cat.misc (a parcel). Only unknown NAMESPACED ids ('ui.nope') get the '?' box.
//
// ADDING AN ICON FOR A NEW ITEM: add `item_id: () => { ...painters... }` to the table of the matching module
// (food.js / items_food.js, items_home.js, items_wear.js LOOKS for outfits, items_misc.js). Nothing else to register.
// If you add nothing, the word fallback still gives it a sensible picture; add a WORDS row for a new kind of thing.
import { icon, R, spr, OL } from './_lib.js';
import { UI, NEEDS, SKILLS, FACES, WEATHER, REL, TRANSPORT } from './ui.js';
import { INGREDIENTS, SNACKS, DRINKS, DISHES, MEALS, FOOD_CATS } from './food.js';
import { WORLD, WORLD_ALIAS } from './items_food.js';
import { HOME } from './items_home.js';
import { WEAR } from './items_wear.js';
import { MISC } from './items_misc.js';
import { JOBS, VENUES, VENUE_ALIAS, APPS, GLYPHX } from './extras.js';

export const ICON_SIZE = 16;

/** raw icon bodies by id (drawn into the 16x16 paint buffer). Add new icons to the module tables. */
const BODIES = Object.assign({}, UI, NEEDS, SKILLS, FACES, WEATHER, REL, TRANSPORT,
  INGREDIENTS, SNACKS, DRINKS, DISHES, MEALS, FOOD_CATS, WORLD, HOME, WEAR, MISC, JOBS, VENUES, APPS, GLYPHX);

/** id -> alias id (synonyms) */
const ALIAS = Object.assign({ 'cat.ready_meal': 'frozen_dinner', 'cat.meal': 'cat.dish', 'cat.food': 'cat.dish' }, WORLD_ALIAS, VENUE_ALIAS);

/** id -> draw fn (16x16, top-left at the current origin PW(0,0,0)) */
export const ICONS = {};
for (const [id, body] of Object.entries(BODIES)) ICONS[id] = icon(body);
for (const [id, to] of Object.entries(ALIAS)) if (ICONS[to] && !ICONS[id]) ICONS[id] = ICONS[to];

const unknown = icon(() => {
  R(1, 1, 14, 14, '#c9c2d8');
  spr(4, 3, ['.####.', '##..##', '....##', '...##.', '..##..', '..##..', '......', '..##..'], { '#': OL });
});
ICONS['ui.unknown'] = unknown;

export const hasIcon = id => Object.prototype.hasOwnProperty.call(ICONS, id);

/** word (singular, lower-case) -> icon id. First matching word of the id wins, scanning the id's words right to left
 *  (the last word is usually the noun: 'cheese_burger' -> burger). */
const WORDS = {};
const W = (target, words) => { for (const w of words.split(' ')) WORDS[w] = target; };
W('stand_taco_single', 'taco'); W('stand_taco_burrito', 'burrito wrap kebab shawarma');
W('cafe_latte', 'latte cappuccino mocha coffee flatwhite'); W('cafe_espresso', 'espresso'); W('cafe_tea', 'tea teapot chai'); W('cafe_hot_chocolate', 'cocoa chocolate');
W('cafe_iced_coffee', 'iced frappe'); W('gen_boba', 'boba bubble'); W('gen_smoothie', 'smoothie shake milkshake'); W('gen_fresh_juice', 'juice lemonade spritz punch');
W('soda', 'soda cola pop fizz can'); W('bar_beer', 'beer ale lager pint'); W('bar_cocktail', 'cocktail martini mojito'); W('gift_wine', 'wine champagne sake'); W('sports_drink', 'water drink');
W('ramen_shoyu', 'ramen noodle pho udon soba laksa'); W('meal_tomato_pasta', 'pasta spaghetti lasagna'); W('pizza_slice', 'pizza'); W('diner_burger', 'burger slider');
W('bakery_sandwich', 'sandwich sub panini toastie hoagie'); W('gen_bagel_egg', 'bagel'); W('stand_hotdog_classic', 'hotdog dog sausage'); W('gen_pretzel', 'pretzel');
W('gen_dimsum_basket', 'dumpling dimsum gyoza bao'); W('gen_curry_rice', 'curry'); W('meal_chicken_rice_bowl', 'rice bowl poke donburi'); W('gen_chowder', 'soup chowder bisque broth'); W('meal_beef_stew', 'stew hotpot chili');
W('meal_garden_salad', 'salad'); W('gen_soul_plate', 'chicken wing nugget'); W('gull_steak', 'steak beef rib bbq'); W('gull_catch', 'fish salmon seafood sushi'); W('gen_fish_chips', 'fries chips');
W('diner_pancakes', 'pancake waffle crepe'); W('meal_scrambled_eggs', 'egg omelette'); W('bread', 'bread loaf toast baguette'); W('cafe_croissant', 'croissant pastry danish');
W('cafe_muffin', 'muffin cupcake scone'); W('gen_donut', 'donut doughnut'); W('gift_cake', 'cake'); W('diner_pie', 'pie'); W('bakery_fruit_tart', 'tart'); W('meal_choc_chip_cookies', 'cookie biscuit');
W('stand_icecream_cone', 'icecream cone gelato sundae'); W('stand_icecream_popsicle', 'popsicle lolly'); W('cinema_popcorn', 'popcorn corn'); W('cinema_candy', 'candy sweet gum'); W('gen_mochi', 'mochi');
W('bar_nachos', 'nacho'); W('bar_nuts', 'nut'); W('cheese', 'cheese'); W('apple', 'apple fruit'); W('banana', 'banana'); W('berries', 'berry'); W('lemon', 'lemon lime'); W('tomato', 'tomato'); W('carrot', 'carrot veg vegetable');
W('milk', 'milk cream'); W('yogurt', 'yogurt yoghurt'); W('gen_samosa', 'samosa sambusa empanada'); W('gift_honey', 'honey jam'); W('glyph.jar', 'jar sauce');
W('glyph.dress', 'dress gown skirt'); W('glyph.jacket', 'jacket blazer suit'); W('glyph.coat', 'coat parka trench raincoat'); W('glyph.hoodie', 'hoodie'); W('glyph.sweater', 'sweater knit cardigan jumper');
W('cat.outfit', 'outfit shirt tee top polo kit clothes'); W('glyph.trousers', 'trouser jean pant short legging'); W('glyph.shoe', 'shoe kick sneaker runner trainer sandal'); W('glyph.boot', 'boot'); W('glyph.hat', 'hat cap beanie beret'); W('glyph.helmet', 'helmet lid');
W('cat.book', 'book novel guide manual comic magazine'); W('gen_notebook', 'notebook planner journal diary'); W('sketchbook', 'sketchbook'); W('glyph.pen', 'pen pencil marker');
W('glyph.bed', 'bed mattress'); W('glyph.fridge', 'fridge freezer'); W('stove_t1', 'stove oven range cooker'); W('microwave_t1', 'microwave'); W('glyph.sofa', 'sofa couch futon'); W('glyph.chair', 'chair stool bench');
W('glyph.table', 'table desk'); W('glyph.tv', 'tv television screen monitor'); W('glyph.laptop', 'laptop computer pc'); W('glyph.shelf', 'shelf bookshelf bookcase'); W('glyph.console', 'console controller gamepad');
W('game_t2', 'arcade'); W('game_t0', 'boardgame game'); W('glyph.speaker', 'speaker stereo radio hifi boombox'); W('glyph.record', 'vinyl record'); W('glyph.headphones', 'headphone earbud');
W('glyph.guitar', 'guitar ukulele instrument bass'); W('instrument_t2', 'piano keyboard'); W('easel_t1', 'easel'); W('painting', 'painting'); W('canvas', 'canvas'); W('glyph.frame', 'print poster frame art photo picture');
W('glyph.plant', 'plant monstera fern tree ivy'); W('glyph.cactus', 'cactus succulent'); W('glyph.flower', 'flower bouquet tulip rose'); W('glyph.rug', 'rug mat carpet'); W('glyph.lamp', 'lamp light lantern'); W('glyph.clock', 'clock watch');
W('decor_aquarium', 'aquarium'); W('glyph.bath', 'bath tub'); W('shower_t1', 'shower'); W('glyph.towel', 'towel'); W('glyph.soap', 'soap shampoo'); W('glyph.mirror', 'mirror'); W('glyph.candle', 'candle');
W('mall_beauty_perfume', 'perfume cologne'); W('mall_beauty_lipstick', 'lipstick makeup'); W('glyph.bike', 'bike bicycle'); W('mall_skate_cruiser', 'skate skateboard board'); W('glyph.ball', 'ball basketball');
W('exercise_t1', 'dumbbell weight'); W('exercise_t0', 'yoga'); W('glyph.ticket', 'ticket stub'); W('glyph.card', 'pass card membership'); W('glyph.key', 'key'); W('glyph.phone', 'phone'); W('glyph.camera', 'camera');
W('glyph.toy', 'toy robot'); W('gift_teddy', 'teddy plush bear'); W('mall_toy_puzzle', 'puzzle'); W('mall_toy_kite', 'kite'); W('umbrella', 'umbrella'); W('fishing_rod', 'rod'); W('glyph.tool', 'tool toolkit wrench hammer');
W('glyph.bottle', 'bottle flask'); W('glyph.box', 'box crate set pack'); W('glyph.bag', 'bag sack feed treat'); W('cat.gift', 'gift present souvenir'); W('sky_magnet', 'magnet'); W('sky_snowglobe', 'globe snowglobe');
const sing = w => WORDS[w] ? w : w.endsWith('ies') ? w.slice(0, -3) + 'y' : w.endsWith('es') && WORDS[w.slice(0, -2)] ? w.slice(0, -2) : w.endsWith('s') ? w.slice(0, -1) : w;

/** the icon id that will be drawn for an id that has no icon of its own (see header). Never returns an id without art. */
export function resolveFallback(id, category) {
  id = String(id == null ? '' : id);
  if (hasIcon(id)) return id;
  if (id.includes('.')) { const pre = id.split('.')[0]; if (pre !== 'item') return 'ui.unknown'; }
  const words = id.toLowerCase().split(/[^a-z]+/).filter(Boolean);
  for (let i = words.length - 1; i >= 0; i--) { const t = WORDS[sing(words[i])]; if (t && hasIcon(t)) return t; }
  if (words.length > 1) for (let i = words.length - 2; i >= 0; i--) { const t = WORDS[words[i] + words[i + 1]]; if (t && hasIcon(t)) return t; }
  if (category && hasIcon('cat.' + category)) return 'cat.' + category;
  return 'cat.misc';
}

/** draw icon `id` (16x16) with its top-left at the origin. category: optional fallback hint. Never throws. */
export function drawIcon(id, category) {
  let fn = null;
  try { fn = hasIcon(id) ? ICONS[id] : ICONS[resolveFallback(id, category)]; } catch (e) { fn = null; }
  try { (fn || unknown)(); } catch (e) { try { unknown(); } catch (e2) { /* nothing */ } }
}

export const galleryItems = Object.keys(ICONS).map(id => ({ id: 'icon.' + id, sb: [0, 0, 16, 16], draw: ICONS[id] }));
