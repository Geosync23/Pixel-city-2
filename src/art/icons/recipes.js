// Icons for the big cookbook (data/recipes_extra.js): every home-cooked meal `meal_<recipeId>`, every extra ingredient and the
// cookbooks / recipe cards. Same 16x16 kit and style as food.js / items_food.js; registered straight into ICONS (icons.js), so
// drawIcon / iconEl find them like any other item icon. Built from parametric painters (bowl, pan, sandwich, pie, cake, loaf ...).
// Preview: node tools/gallery.mjs icons/recipes --scale 4 --out rec_icons      (galleryItems below; ids 'icon.meal_*' etc.)
import { P, OL, r, R, ov, OV, pg, PG, p, ps, ln, st, sl, spr, clr, steam, sparkle, leafs, dk, lt, mix, icon } from './_lib.js';
import { plate, bowlBody, mug, glass } from './food.js';
import { bowl, stack, bunTop, tallGlass, boba, donut, dumpling, triangle, steamer } from './items_food.js';
import { ICONS } from './icons.js';

/* ---------- colours ---------- */
const BREAD = '#e0a858', CRUMB = '#f2d49a', CRUST = '#a8642e', RICE = '#fbf6ea', EGGW = '#fbf8f0', YOLK = '#f6b830', CHEESE = '#f8d050', TOM = '#e8483a', MEAT = '#c8642a', BEEF = '#8a4a2a',
  PORK = '#e8a088', SALMON = '#f08a5a', SHRIMP = '#f6a088', NOODLE = '#f2d48a', BROTH = '#e8b860', CREAM = '#f6ecd0', CHOC = '#6b3f2a', CURRY = '#d89a2a', SOY = '#5a3a2a', GRN = P.green, LEAF = P.leaf,
  STEAM = '#b9c4d6', WHITE = '#f4f0e6', PAN = '#3a3644', WOOD = '#c8925a', BERRY = '#e8384a', BLUEB = '#4a58c8', AVO = '#a8cc5a', BEAN = '#7a4428', NORI = '#2a4a3a', PINK = '#f28fb0';

/* ---------- painters ---------- */
const bits = (pts, c, w = 2, h = 1) => { for (const [x, y] of pts) r(x, y, w, h, c); };
const blobs = (pts, c, w = 3, h = 3) => { for (const [x, y] of pts) OV(x, y, w, h, c); };
/** part of an ellipse (flat): test(i, j) picks the pixels */
const ovIf = (x, y, w, h, c, test) => { const cx = x + w / 2, cy = y + h / 2, pts = []; for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) { const a = (i + .5 - cx) / (w / 2), b = (j + .5 - cy) / (h / 2); if (a * a + b * b <= 1.08 && test(i, j)) pts.push([i, j]); } ps(pts, c); };
/** side-view bowl: contents colour + toppings (rows 3..6) */
const B = (body, top, f) => bowl(body, top, f);
/** soup: bowl with a glossy surface */
const soup = (body, c, f, hot) => { bowl(body, c, () => { ps([[4, 5], [5, 5], [10, 6]], lt(c, .3)); if (f) f(); }); if (hot) steam(6, 0, STEAM); };
/** noodles on a bowl surface */
const strands = (c, y = 4) => ps([[3, y + 1], [4, y], [5, y + 1], [6, y], [7, y + 1], [8, y], [9, y + 1], [10, y], [11, y + 1], [4, y + 2], [6, y + 2], [8, y + 2], [10, y + 2]], c);
/** food on a plate (plate first, food on top) */
const PL = (f, c) => { plate(c); f(); };
/** top-down round dish / pan: rim + filling, inner area x 2..13, y 5..12 */
const pan = (rim, fill, f) => { OV(0, 3, 16, 12, rim); ov(1, 4, 14, 10, fill); if (f) f(); };
const skillet = (fill, f) => { OV(0, 4, 13, 11, PAN); r(12, 8, 4, 2, PAN); ov(1, 5, 11, 9, fill); if (f) f(); };
/** curry + rice on one plate, seen from above */
const curryRice = (sauce, f, rim = WHITE) => { pan(rim, RICE); ovIf(1, 4, 14, 10, sauce, (i, j) => i + j * .3 < 10); if (f) f(); };
/** sandwich from the side */
const sand = (fill, bread = BREAD) => stack(3, [[bread, 3], ...fill, [bread, 3]]);
/** burger / filled bun from the side */
const bun = (fill, c = '#d8924a', seeds) => { bunTop(c, 1); if (seeds) ps([[4, 3], [7, 2], [10, 3], [12, 4]], '#fbe8b8'); stack(6, [...fill, [c, 3]], 1, 14); };
/** a slice of toast seen from above with toppings */
const toastT = (f, c = BREAD) => { R(2, 3, 12, 11, c); r(3, 2, 10, 1, c); r(3, 4, 10, 9, CRUMB); if (f) f(); };
/** rolled wrap / burrito lying diagonally, open end top-right */
const wrap = (c, fill, f) => { PG([[1, 11], [10, 2], [14, 6], [5, 15]], c); OV(9, 1, 6, 6, fill); ln(3, 11, 6, 14, dk(c, .14)); if (f) f(); };
/** folded taco with three filling colours */
const taco = (x, y, w, shell, fill) => { for (let i = 1; i < w - 1; i++) p(x + i, y - 1 - (i % 3 === 1 ? 1 : 0), fill[i % 3]); PG([[x, y], [x + w, y], [x + w - 1, y + 3], [x + w - 3, y + 5], [x + 3, y + 5], [x + 1, y + 3]], shell); };
/** whole pie / tart from above */
const pie = (crust, fill, f) => { OV(0, 3, 16, 12, crust); ov(2, 5, 12, 8, fill); for (let i = 0; i < 6; i++) p(1 + i * 3, 13, dk(crust, .25)); if (f) f(); };
const lattice = c => { for (const x of [4, 7, 10]) ln(x, 6, x + 2, 11, c); ln(3, 8, 12, 8, c); ln(4, 10, 11, 10, c); };
/** layer cake from the side on a plate */
const cake = (sponge, icing, mid, f) => { plate(); R(2, 6, 12, 7, sponge); R(2, 4, 12, 3, icing); r(2, 9, 12, 1, mid); if (f) f(); };
/** loaf from the side */
const loaf = (c, f) => { OV(1, 4, 14, 8, c); R(1, 8, 14, 6, c); if (f) f(); };
const muffin = (top, cup, dots, dc) => { PG([[3, 9], [13, 9], [12, 15], [4, 15]], cup); for (const x of [5, 8, 11]) ln(x, 10, x, 14, dk(cup, .2)); OV(2, 2, 12, 8, top); if (dots) ps(dots, dc); };
const cookies = (c, dots, dc) => { OV(0, 6, 9, 9, c); OV(6, 2, 10, 10, c); ps(dots, dc); ps([[8, 4], [2, 8]], lt(c, .35)); };
/** baking dish from above with a baked top */
const bake = (dish, top, f) => { R(1, 4, 14, 10, dish); r(0, 7, 1, 4, dish); r(15, 7, 1, 4, dish); r(2, 5, 12, 8, top); if (f) f(); };
/** tray / sheet of small bakes */
const tray = (f, c = '#c2cad4') => { R(0, 9, 16, 6, c); r(1, 10, 14, 1, dk(c, .1)); f(); };
const skewer = (y, cols) => { ln(0, y, 15, y, '#c8a060'); cols.forEach((c, i) => R(2 + i * 3, y - 1, 3, 3, c)); };
const board = f => { R(0, 8, 16, 7, WOOD); r(1, 9, 14, 1, lt(WOOD, .2)); f(); };
const friedEgg = (x, y) => { OV(x, y, 7, 5, EGGW); ov(x + 2, y + 1, 3, 3, YOLK); p(x + 3, y + 1, '#fde08a'); };
const mugD = (c, liquid, hot) => { mug(c, liquid, 5); if (hot) steam(4, 0, STEAM); };
const hot = () => steam(6, 0, STEAM);
const garnish = pts => ps(pts, GRN);
const cup = (c, f) => { PG([[3, 6], [13, 6], [12, 15], [4, 15]], '#e6f2f6'); PG([[3.4, 7], [12.6, 7], [12, 14.6], [4, 14.6]], c); if (f) f(); };

/* ---------- home-cooked meals ---------- */
const MEALS = {
  // breakfast
  porridge: () => { soup('#7ab0d8', '#ecdcb8', () => { ps([[6, 4], [8, 6], [11, 5]], '#d8c498'); }, true); },
  banana_porridge: () => { B('#f2c230', '#ecdcb8', () => { blobs([[3, 4], [7, 3], [10, 4]], '#fbe690', 3, 2); ps([[4, 4], [8, 3], [11, 4]], '#c89a3a'); }); },
  boiled_eggs: () => { PG([[2, 8], [9, 8], [8, 15], [3, 15]], '#6fb3e0'); OV(2, 2, 7, 8, '#f2dcc0'); ov(4, 3, 3, 2, YOLK); for (const x of [10, 12, 14]) R(x, 6, 2, 9, BREAD); },
  cinnamon_toast: () => { toastT(() => { r(3, 4, 10, 9, '#e8b878'); ps([[4, 5], [7, 6], [10, 5], [5, 9], [9, 10], [11, 8], [6, 11]], '#a8642e'); ps([[6, 8], [9, 7]], '#fbe8c0'); }); },
  yogurt_parfait: () => { glass('#fbf6ea', 5); r(4, 8, 8, 2, '#d8a858'); r(4, 11, 8, 1, BERRY); blobs([[4, 2], [8, 1]], BERRY); OV(6, 3, 3, 3, BLUEB); },
  fruit_salad: () => { B('#8fdcb4', '#f6e6a0', () => { blobs([[2, 3], [9, 4]], '#e8403a'); blobs([[5, 2], [11, 2]], P.orange); ps([[4, 5], [8, 3], [8, 5]], '#fbe690'); ps([[7, 6], [12, 5]], LEAF); }); },
  french_toast: () => { PL(() => { PG([[1, 10], [6, 3], [11, 10]], '#e8a848'); PG([[6, 11], [11, 4], [15, 11]], '#d89238'); ps([[5, 7], [6, 6], [10, 8], [11, 7]], '#fbe8c0'); ps([[3, 9], [12, 6]], BERRY); }); },
  cheese_omelette: () => { PL(() => { OV(1, 4, 14, 8, '#f8d048'); ps([[3, 7], [5, 5], [9, 5]], '#fdf0a0'); ln(3, 10, 12, 10, '#e0a82a'); ps([[11, 8], [12, 9], [13, 9]], '#fbe690'); garnish([[7, 6], [8, 7]]); }); },
  congee: () => { soup('#c84a3a', '#f6f2e6', () => { OV(3, 3, 4, 3, EGGW); p(4, 4, YOLK); garnish([[9, 4], [11, 5], [10, 3]]); ps([[8, 6], [12, 4]], '#e8c070'); }, true); },
  maple_pancakes: () => { PL(() => { for (let i = 0; i < 3; i++) R(2, 9 - i * 3, 12, 3, '#d89a52'); R(6, 1, 4, 2, '#f8de6a'); ps([[3, 4], [4, 5], [4, 6], [11, 4], [12, 5], [12, 7], [12, 8], [7, 4], [8, 5]], '#a8501a'); }); },
  avocado_toast: () => { toastT(() => { r(3, 4, 10, 9, AVO); ps([[4, 5], [10, 11], [5, 10]], '#c8e07a'); friedEgg(5, 6); ps([[4, 12], [11, 5]], TOM); }); },
  breakfast_hash: () => { skillet('#c89a52', () => { bits([[3, 7], [6, 9], [8, 6], [4, 11]], '#e8c070', 2, 2); bits([[5, 6], [9, 10], [2, 9]], '#d8605a', 2, 1); friedEgg(5, 8); }); },
  breakfast_burrito: () => { wrap('#f2dcae', '#f8d850', () => { ps([[10, 3], [12, 5]], TOM); ps([[11, 2], [13, 4]], CHEESE); ps([[11, 4]], LEAF); }); },
  granola: () => { R(3, 4, 10, 11, '#dff0f6'); r(4, 6, 8, 8, '#d8a858'); ps([[5, 7], [8, 8], [10, 10], [6, 11], [9, 12]], '#a8703a'); ps([[7, 9], [10, 7], [5, 12]], '#f2d49a'); R(3, 1, 10, 3, P.red); r(4, 1, 8, 1, lt(P.red, .3)); },
  spanish_tortilla: () => { PL(() => { OV(1, 3, 14, 9, '#e8b848'); ovIf(1, 3, 14, 9, '#f8e08a', (i, j) => j < 6); PG([[8, 8], [12, 4], [14, 9]], '#fbecae'); ps([[4, 8], [7, 9], [10, 10]], '#c8922a'); }); },
  shakshuka: () => { skillet('#d8382c', () => { friedEgg(2, 6); friedEgg(6, 9); ps([[9, 6], [4, 12], [10, 8]], '#f08a5a'); garnish([[8, 7], [3, 11], [10, 12]]); }); },
  full_breakfast: () => { PL(() => { friedEgg(0, 4); OV(8, 3, 6, 3, '#b0623a'); for (let k = 0; k < 2; k++) ln(8, 7 + k * 2, 14, 6 + k * 2, '#d8605a'); OV(2, 9, 6, 4, '#c8642a'); ps([[3, 10], [5, 11], [6, 10]], '#e8a060'); r(9, 10, 5, 3, BREAD); }); },
  eggs_benedict: () => { PL(() => { for (const x of [0, 8]) { OV(x, 8, 8, 4, BREAD); r(x + 1, 7, 6, 2, PORK); OV(x + 1, 3, 6, 5, EGGW); OV(x + 1, 2, 6, 3, '#f8d850'); } garnish([[3, 2], [11, 2]]); }); },
  // sandwiches, salads, no-cook
  cheese_sandwich: () => { sand([[CHEESE, 2], [TOM, 2, 1]]); ps([[1, 8]], CHEESE); },
  pbj: () => { sand([['#b87a3a', 2], ['#a82a5a', 2]], '#f2e2c0'); ps([[2, 10], [13, 9]], '#a82a5a'); },
  ham_sandwich: () => { sand([[PORK, 2], ['#7ab04a', 1, 1], [PORK, 1]]); ps([[1, 6], [14, 7]], PORK); },
  ploughmans: () => { board(() => { PG([[1, 8], [6, 3], [8, 8]], CHEESE); OV(8, 3, 6, 6, '#d8302c'); r(11, 2, 1, 2, P.brown); R(2, 9, 6, 4, BREAD); r(3, 10, 4, 2, CRUMB); blobs([[10, 10], [12, 11]], '#6a9a3a', 3, 2); }); },
  veggie_wrap: () => { wrap('#f2dcae', LEAF, () => { ps([[10, 3], [12, 4]], P.orange); ps([[11, 2], [13, 5]], CHEESE); ps([[12, 2]], '#a8dc7a'); }); },
  tuna_salad: () => { B('#f2ece0', '#e8d8c0', () => { blobs([[2, 3], [8, 4]], '#e0b8a0', 4, 3); ps([[6, 3], [7, 5], [12, 4], [11, 6]], BEAN); garnish([[5, 6], [10, 3]]); ps([[13, 5]], P.lemon); }); },
  quesadilla: () => { PL(() => { PG([[1, 11], [8, 2], [15, 11]], '#f0d49a'); ln(8, 3, 8, 10, '#c89a52'); ps([[4, 8], [11, 8], [6, 6], [10, 6]], '#c8843a'); r(2, 11, 12, 1, CHEESE); ps([[4, 12], [10, 12]], CHEESE); }); },
  tuna_melt: () => { toastT(() => { r(3, 4, 10, 9, '#e8c8b0'); r(3, 4, 10, 5, CHEESE); ps([[4, 9], [8, 9], [11, 9], [6, 10]], CHEESE); ps([[5, 5], [9, 6]], '#fdf0a0'); ps([[5, 11], [9, 12]], '#c8a088'); }); },
  blt: () => { sand([['#d8605a', 2, -1], [LEAF, 1, -1], [TOM, 2, 1]], '#d8984e'); },
  egg_salad_sandwich: () => { sand([['#f8e08a', 3], [LEAF, 1, -1]], '#f2e2c0'); ps([[4, 7], [8, 8], [11, 7]], EGGW); ps([[6, 7]], GRN); },
  caprese: () => { PL(() => { for (let i = 0; i < 4; i++) { OV(i * 3.5, 5, 5, 6, i % 2 ? '#fbf8f0' : TOM); } leafs(7, 4, GRN); garnish([[3, 4], [12, 5]]); }); },
  greek_salad: () => { B('#3b5bdb', '#a8dc7a', () => { R(6, 2, 4, 3, '#fbf8f0'); blobs([[2, 4], [11, 3]], TOM, 3, 2); ps([[5, 5], [10, 6], [13, 5]], '#3a2a3a'); ps([[4, 3], [9, 6]], '#5fa84a'); }); },
  potato_salad: () => { B('#f2c230', '#f6ecc8', () => { blobs([[2, 3], [6, 2], [10, 3], [5, 5]], '#f2dc9a', 4, 3); ps([[4, 3], [9, 5], [12, 5]], GRN); ps([[7, 4], [11, 4]], '#fbf8f0'); }); },
  hummus_plate: () => { pan('#3a6ab0', '#ecd8a0', () => { ov(4, 6, 8, 6, '#f6e8bc'); ov(6, 8, 4, 2, '#d8a82a'); ps([[5, 7], [10, 10]], P.red); garnish([[9, 7]]); }); PG([[10, 2], [16, 4], [13, 8]], '#f0d49a'); },
  bruschetta: () => { PL(() => { for (const x of [0, 8]) { PG([[x, 10], [x + 2, 5], [x + 7, 5], [x + 6, 10]], BREAD); r(x + 2, 5, 4, 3, TOM); ps([[x + 3, 5], [x + 5, 6]], '#ff9a80'); ps([[x + 2, 6], [x + 4, 4]], GRN); } }); },
  guacamole: () => { B('#3a3644', AVO, () => { ps([[4, 5], [8, 4], [11, 5]], TOM); ps([[6, 6], [10, 6]], '#fbf8f0'); }); PG([[0, 6], [3, 1], [5, 6]], '#eab84a'); PG([[11, 5], [14, 0], [16, 5]], '#eab84a'); },
  summer_rolls: () => { PL(() => { for (const y of [3, 7]) { OV(1, y, 14, 4, '#eef4ec'); ps([[3, y + 1], [4, y + 2]], SHRIMP); ps([[6, y + 1], [7, y + 1], [10, y + 2]], LEAF); ps([[9, y + 1], [12, y + 1]], P.orange); } OV(10, 10, 5, 4, '#b87a3a'); }, '#2a6a5a'); },
  club_sandwich: () => { stack(1, [[BREAD, 2], [LEAF, 1, -1], [TOM, 1], ['#e8c8a8', 2], [BREAD, 2], ['#d8605a', 1, -1], [LEAF, 1], [CHEESE, 1], [BREAD, 2]]); r(7, 0, 1, 3, P.red); },
  caesar_salad: () => { B('#f2ece0', '#a8dc7a', () => { blobs([[2, 3], [8, 2]], '#e8c898', 4, 3); bits([[6, 5], [12, 4]], BREAD, 2, 2); ps([[4, 6], [10, 6], [7, 3]], '#fbf8f0'); ps([[13, 6], [3, 2]], '#5fa84a'); }); },
  banh_mi: () => { OV(0, 5, 16, 8, '#d8984e'); r(1, 7, 14, 3, PORK); ps([[2, 6], [5, 6], [8, 6], [11, 6], [13, 6]], P.orange); ps([[3, 6], [6, 6], [9, 6], [12, 6]], LEAF); ps([[4, 7], [10, 7]], '#e8f4d8'); r(1, 10, 14, 2, '#e8b068'); ps([[7, 6]], P.red); },
  // soups & stews
  egg_drop_soup: () => { soup('#f2ece0', '#f2d070', () => { sl(3, 5, 6, 4, '#fbf4d0'); sl(8, 6, 12, 4, '#fbf4d0'); garnish([[5, 6], [10, 3]]); }, true); },
  tomato_soup: () => { soup('#f2ece0', '#e8483a', () => { sl(6, 4, 9, 4, '#fbe8d8'); sl(7, 5, 10, 5, '#fbe8d8'); garnish([[4, 4]]); }); },
  veg_soup: () => { soup('#5fb84f', '#e8c070', () => { bits([[3, 4], [9, 3]], P.orange, 2, 2); bits([[6, 5], [12, 5]], '#f2e2b0', 2, 2); garnish([[5, 3], [11, 4], [8, 6]]); }, true); },
  corn_chowder: () => { soup('#f2c230', '#f6ecc0', () => { ps([[3, 5], [5, 4], [8, 5], [10, 4], [12, 5], [7, 3]], '#f6c830'); ps([[6, 6], [11, 6]], '#f2dc9a'); garnish([[9, 3]]); }); },
  lentil_soup: () => { soup('#8a5cc2', '#e08a3a', () => { ps([[3, 5], [6, 4], [9, 6], [12, 5]], '#f0a858'); sl(6, 5, 8, 5, '#fbf0d8'); garnish([[10, 3]]); }, true); },
  chicken_soup: () => { soup('#6fb3e0', '#f2dc90', () => { strands('#fbf0c0', 4); blobs([[3, 3], [9, 3]], '#f2dcc0', 3, 2); ps([[7, 4], [12, 5]], P.orange); garnish([[6, 3]]); }, true); },
  lantern_soup: () => { soup('#c92a2a', '#d8a868', () => { bits([[3, 4], [8, 3], [11, 5]], '#fbf8f0', 2, 2); garnish([[6, 5], [7, 3], [10, 4], [13, 5]]); }, true); },
  minestrone: () => { soup('#f2ece0', '#d8562c', () => { ps([[3, 5], [7, 4], [11, 5]], '#f8d880'); ps([[5, 4], [9, 6], [12, 4]], '#f2e2d0'); garnish([[4, 3], [8, 5], [10, 3]]); ps([[6, 6]], P.orange); }); },
  pumpkin_soup: () => { soup('#7a4a2e', '#f0942c', () => { sl(5, 4, 8, 4, '#fbf0d8'); sl(8, 5, 10, 5, '#fbf0d8'); ps([[4, 6], [11, 3]], '#3a6a3a'); }); },
  chili: () => { soup('#3a3644', '#a8381c', () => { ps([[3, 5], [6, 4], [9, 5], [12, 4]], BEAN); ps([[5, 6], [10, 6]], '#e8603a'); r(6, 3, 4, 1, '#fbf8f0'); garnish([[8, 2]]); }, true); },
  french_onion: () => { bowl('#a8643a', '#f2d070', () => { OV(2, 2, 12, 5, '#e8b048'); ps([[4, 3], [7, 4], [10, 3]], '#c8842a'); ps([[5, 5], [9, 5], [12, 5]], '#fbe690'); }); r(0, 8, 1, 2, '#a8643a'); r(15, 8, 1, 2, '#a8643a'); },
  harbor_chowder: () => { soup('#2c3e7a', '#f6f0dc', () => { blobs([[3, 3], [9, 4]], '#e8d8c0', 3, 2); ps([[6, 5], [12, 5]], '#f2dc9a'); garnish([[7, 3], [11, 3]]); ps([[5, 6]], P.orange); }, true); },
  goulash: () => { soup('#e8c070', '#b8401c', () => { bits([[3, 4], [8, 5], [11, 3]], BEEF, 2, 2); ps([[6, 4], [10, 6]], '#f2c070'); ps([[5, 6], [13, 5]], P.red); sl(7, 3, 9, 3, '#fbf0d8'); }, true); },
  gumbo: () => { soup('#2f9e44', '#8a5a2a', () => { OV(5, 2, 5, 3, RICE); ps([[3, 5], [11, 5]], SHRIMP); ps([[4, 4], [12, 4]], '#f6a088'); ps([[9, 6], [6, 6]], '#b0482a'); garnish([[2, 6], [13, 6]]); }, true); },
  hot_pot: () => { OV(0, 4, 16, 11, '#8a8f9a'); ov(1, 5, 14, 9, '#e8d8a0'); ovIf(1, 5, 14, 9, '#d8382c', i => i < 8); r(8, 5, 1, 9, '#5e6676'); r(0, 8, 1, 3, '#5e6676'); r(15, 8, 1, 3, '#5e6676'); ps([[3, 8], [5, 11], [6, 7]], '#f6c8b8'); ps([[10, 8], [12, 10], [11, 12]], LEAF); ps([[12, 7], [10, 11]], '#fbf8f0'); ps([[4, 10]], '#fbf8f0'); steam(5, 0, STEAM); },
  // pasta & noodles
  buttered_noodles: () => { B('#6fb3e0', NOODLE, () => { strands('#d8a848', 3); R(6, 2, 4, 2, '#f8de6a'); }); },
  garlic_pasta: () => { B('#f2ece0', '#f2dc90', () => { strands('#d8b048', 3); ps([[4, 3], [9, 3], [12, 5]], '#fbf8f0'); ps([[6, 5], [11, 3]], P.red); garnish([[7, 3]]); }); },
  mac_cheese: () => { B('#3b5bdb', '#f8c838', () => { for (const [x, y] of [[3, 4], [7, 3], [10, 5], [5, 6], [12, 3]]) ps([[x, y], [x + 1, y - 1], [x + 2, y]], '#fde890'); }); },
  fried_noodles: () => { PL(() => { OV(1, 3, 14, 9, '#c8843a'); for (const y of [5, 7, 9]) ps([[3, y], [4, y - 1], [5, y], [6, y - 1], [7, y], [8, y - 1], [9, y], [10, y - 1], [11, y], [12, y - 1]], '#e8b060'); ps([[4, 6], [9, 8], [11, 6]], LEAF); ps([[6, 8], [12, 8]], P.orange); }); },
  peanut_noodles: () => { B('#2a6a5a', '#d8a868', () => { strands('#f2d8a0', 3); ps([[3, 4], [4, 3], [5, 3]], '#a8dc7a'); ps([[10, 3], [11, 3], [12, 4]], '#a8dc7a'); ps([[7, 3], [9, 5]], '#8a5a2a'); }); },
  bolognese: () => { B('#f2ece0', '#f2d48a', () => { strands('#d8a848', 3); OV(4, 2, 8, 4, '#a8381c'); ps([[6, 3], [9, 4]], '#d8603a'); ps([[7, 2], [8, 2]], '#fbf8f0'); }); },
  pesto_pasta: () => { B('#f2ece0', '#8fc050', () => { for (const [x, y] of [[3, 4], [7, 3], [11, 4], [5, 6], [9, 6]]) spr(x, y, ['#.#', '.#.'], { '#': '#d8e890' }); ps([[8, 2], [12, 3]], '#fbf8f0'); ps([[6, 5]], '#3a7a2a'); }); },
  carbonara: () => { B('#3a3644', '#f6e6a8', () => { strands('#e0c070', 3); ps([[4, 3], [8, 5], [11, 3]], '#d8605a'); OV(6, 2, 4, 3, YOLK); ps([[10, 5], [3, 5]], '#3a3644'); }); },
  puttanesca: () => { B('#f2ece0', '#d8482c', () => { strands('#f2c870', 3); ps([[4, 3], [9, 5], [12, 4]], '#3a2a3a'); ps([[7, 3]], '#e8d8c0'); garnish([[10, 3], [5, 5]]); }); },
  mushroom_stroganoff: () => { B('#8a5cc2', '#e8d0a8', () => { for (const [x, y] of [[3, 3], [8, 2], [10, 5]]) { r(x, y, 3, 1, '#a8784a'); p(x + 1, y + 1, '#e8d8c0'); } strands('#f6e6c0', 4); garnish([[6, 4], [12, 3]]); }); },
  chow_mein: () => { PL(() => { OV(1, 3, 14, 9, '#e0a848'); for (const y of [5, 7, 9]) ps([[3, y], [5, y - 1], [7, y], [9, y - 1], [11, y], [12, y - 1]], '#f6d890'); blobs([[3, 5], [9, 7]], '#f2dcc0', 3, 2); ps([[6, 5], [7, 9], [12, 6]], LEAF); }); },
  baked_mac: () => { bake('#c0483a', '#f8c838', () => { ps([[3, 6], [6, 8], [9, 6], [12, 9], [4, 11], [8, 11], [11, 7]], '#c8842a'); ps([[5, 7], [10, 10]], '#fde890'); }); },
  pad_thai: () => { PL(() => { OV(1, 3, 13, 9, '#e8a050'); for (const y of [5, 7, 9]) ps([[3, y], [5, y - 1], [7, y], [9, y - 1], [11, y]], '#f8d8a0'); ps([[4, 6], [9, 8]], SHRIMP); ps([[6, 9], [11, 5]], '#c89a5a'); garnish([[7, 5], [3, 8]]); PG([[12, 9], [16, 8], [15, 12]], '#8ac83a'); }); },
  gnocchi: () => { PL(() => { for (const [x, y] of [[1, 6], [5, 4], [9, 5], [3, 9], [7, 8], [11, 8]]) { OV(x, y, 4, 3, '#f2dc9a'); p(x + 1, y + 1, '#d8b868'); } garnish([[6, 7], [10, 4]]); ps([[4, 5], [9, 10]], '#f8de6a'); }); },
  ramen: () => { B('#2a2733', '#b8742a', () => { strands('#f8dc90', 4); OV(2, 2, 4, 3, EGGW); p(3, 3, YOLK); R(10, 2, 3, 4, NORI); OV(6, 2, 4, 3, '#f2c0b0'); p(7, 3, '#e87a9a'); garnish([[9, 5]]); }); steam(7, 0, STEAM); },
  lasagna: () => { PL(() => { stack(3, [['#e8b048', 2], ['#c8381c', 1], ['#f6e6a8', 1], ['#a8381c', 1], ['#f6e6a8', 1], ['#c8381c', 1], ['#f2d48a', 2]]); ps([[4, 3], [9, 4]], '#c8842a'); garnish([[7, 2]]); }); },
  pho: () => { B('#f2ece0', '#c89a52', () => { strands('#fbf6ea', 4); R(3, 2, 4, 2, '#b06a5a'); ps([[9, 3], [10, 2], [11, 3], [12, 4]], GRN); ps([[8, 5]], P.red); ps([[12, 2]], '#8ac83a'); }); steam(4, 0, STEAM); },
  seafood_linguine: () => { B('#f2ece0', '#f2d48a', () => { strands('#d8a848', 3); OV(2, 2, 4, 3, '#2a3a5a'); p(3, 3, '#f0a858'); OV(10, 2, 4, 3, '#2a3a5a'); ps([[7, 3], [8, 2], [8, 4]], SHRIMP); garnish([[6, 5], [12, 5]]); }); },
  // rice & curries
  egg_fried_rice: () => { B('#e05a3a', RICE, () => { ps([[3, 4], [6, 3], [9, 5], [12, 4]], '#f8d048'); ps([[5, 5], [10, 3]], P.orange); ps([[7, 5], [11, 5]], GRN); }); },
  rice_and_beans: () => { B('#e0a248', RICE, () => { ovIf(1, 4, 14, 6, '#5a3020', i => i > 7); ps([[9, 5], [11, 4], [12, 6]], '#8a5030'); garnish([[5, 4]]); }); },
  dal: () => { curryRice('#e8b030', () => { ps([[3, 8], [5, 10], [6, 7]], '#f8d870'); garnish([[4, 6]]); ps([[7, 11]], P.red); }, '#3a6ab0'); },
  burrito_bowl: () => { B('#c86a3a', RICE, () => { ovIf(1, 4, 14, 6, '#5a3020', i => i < 5); ovIf(1, 4, 14, 6, LEAF, i => i > 10); ps([[6, 4], [8, 5]], TOM); ps([[7, 3], [9, 4]], CHEESE); }); },
  onigiri: () => { PL(() => { for (const x of [0, 8]) { PG([[x, 11], [x + 4, 3], [x + 8, 11]], RICE); r(x + 2, 8, 4, 4, NORI); } ps([[3, 6], [11, 6]], '#fbf8f0'); }); },
  chickpea_curry: () => { curryRice('#e0862a', () => { ps([[3, 7], [5, 9], [7, 7], [4, 11], [7, 10]], '#f6d898'); garnish([[5, 6]]); }); },
  kimchi_fried_rice: () => { B('#2a2733', '#e88a4a', () => { friedEgg(4, 2); ps([[3, 5], [12, 4], [10, 6]], '#c8301c'); garnish([[11, 3], [2, 4]]); ps([[12, 6], [4, 6]], '#fbf8f0'); }); },
  chicken_curry: () => { curryRice('#c8641c', () => { bits([[3, 7], [6, 9], [5, 11]], '#f2d0a0', 2, 2); garnish([[4, 6], [8, 8]]); sl(6, 6, 8, 6, '#fbf0d8'); }); },
  beef_broccoli: () => { B('#2a2733', RICE, () => { bits([[2, 4], [5, 3], [7, 5]], BEEF, 3, 2); blobs([[9, 2], [11, 4]], '#3a8a3a', 4, 3); ps([[10, 3], [12, 5]], '#6ac05a'); }); },
  stuffed_peppers: () => { PL(() => { for (const [x, c] of [[0, P.red], [8, '#f2c230']]) { R(x + 1, 5, 6, 8, c); OV(x, 3, 8, 4, RICE); ps([[x + 2, 4], [x + 5, 5]], BEEF); ps([[x + 3, 3]], CHEESE); r(x + 3, 2, 2, 1, GRN); } }); },
  poke_bowl: () => { B('#2c3e7a', RICE, () => { bits([[2, 4], [5, 3]], SALMON, 3, 2); blobs([[8, 3]], AVO, 3, 3); ps([[12, 3], [12, 5], [11, 4]], '#a8dc7a'); r(7, 6, 3, 1, NORI); ps([[4, 6]], '#fbf8f0'); }); },
  green_curry: () => { curryRice('#8ab848', () => { bits([[3, 8], [6, 10]], '#f2e2c0', 2, 2); ps([[5, 7], [4, 11]], '#3a8a3a'); ps([[7, 8]], P.red); ps([[6, 6]], '#d8e8a0'); }, '#2a2733'); },
  teriyaki_salmon: () => { B('#f2ece0', RICE, () => { R(3, 3, 7, 3, '#c8642a'); r(4, 3, 5, 1, '#e89a5a'); ps([[5, 4], [8, 5]], '#fbf0d8'); blobs([[10, 3]], '#3a8a3a', 4, 3); }); },
  bibimbap: () => { B('#2a2733', RICE, () => { ovIf(1, 4, 14, 6, '#3a8a3a', (i, j) => i < 5); ovIf(1, 4, 14, 6, P.orange, i => i > 10); ps([[3, 6], [4, 6]], BEEF); friedEgg(5, 3); ps([[11, 6]], '#c8301c'); }); },
  sweet_sour_pork: () => { curryRice('#e8662c', () => { bits([[3, 7], [6, 9]], '#f2a060', 2, 2); ps([[5, 7], [4, 10]], P.red); ps([[7, 8], [5, 11]], '#f6d24a'); ps([[3, 9]], GRN); }); },
  mapo_tofu: () => { B('#f2ece0', '#c8381c', () => { bits([[3, 4], [7, 3], [10, 5], [5, 6]], '#fbf8f0', 2, 2); ps([[6, 4], [12, 4], [9, 6]], BEEF); garnish([[10, 3], [3, 6]]); }); },
  katsu_curry: () => { curryRice('#a8642a', () => { ps([[3, 9], [5, 11]], P.orange); }); for (let i = 0; i < 4; i++) R(6 + i * 2, 4 + (i & 1), 2, 5, '#e0a040'); ps([[7, 6], [9, 7], [11, 6]], '#f6ecd0'); },
  biryani: () => { pan('#c8a04a', '#f6c83a', () => { ps([[3, 8], [6, 6], [9, 9], [11, 7], [5, 11], [8, 12]], RICE); bits([[4, 9], [9, 6]], MEAT, 2, 2); garnish([[7, 8], [11, 10], [5, 6]]); ps([[10, 11], [3, 7]], '#a8501a'); }); },
  // world kitchen
  hot_dogs: () => { for (const y of [2, 9]) { OV(0, y + 1, 16, 5, '#e2a85a'); r(1, y + 2, 14, 2, '#c84a3a'); ps([[2, y + 2], [4, y + 3], [6, y + 2], [8, y + 3], [10, y + 2], [12, y + 3]], '#f6d24a'); } },
  bean_tacos: () => { PL(() => { taco(0, 5, 9, '#eab84a', [BEAN, CHEESE, BEAN]); taco(6, 7, 9, '#eab84a', [CHEESE, BEAN, CHEESE]); }); },
  nachos: () => { PL(() => { for (const [x, y] of [[0, 8], [4, 5], [8, 8], [10, 4], [5, 9]]) PG([[x, y + 4], [x + 3, y], [x + 6, y + 4]], '#eab84a'); ps([[4, 8], [7, 7], [10, 8], [6, 10], [12, 7]], CHEESE); ps([[6, 6], [9, 10]], TOM); ps([[8, 6], [3, 10]], LEAF); ps([[11, 9]], BEAN); }); },
  chicken_tacos: () => { PL(() => { taco(0, 5, 9, '#f2dcae', [LEAF, '#e8c898', TOM]); taco(6, 7, 9, '#f2dcae', ['#e8c898', LEAF, TOM]); ps([[14, 4]], '#8ac83a'); }); },
  burgers: () => { bun([[LEAF, 1, -1], [TOM, 1], [CHEESE, 1, -1], [BEEF, 3]], '#d8924a', true); },
  agedashi_tofu: () => { B('#2a2733', '#b8742a', () => { for (const x of [2, 7]) { R(x, 2, 5, 4, '#f0d090'); r(x + 1, 3, 3, 2, '#fbf4dc'); } garnish([[12, 4], [13, 5], [11, 5]]); }); },
  patty_melt: () => { PG([[0, 13], [0, 4], [8, 13]], '#c8843a'); PG([[1, 12], [1, 7], [5, 12]], BEEF); PG([[2, 12], [2, 9], [4, 12]], CHEESE); PG([[7, 12], [16, 3], [16, 12]], '#d8984e'); PG([[9, 12], [15, 6], [15, 12]], BEEF); r(10, 11, 5, 1, CHEESE); ps([[2, 5], [12, 5]], '#a8642e'); },
  beef_burrito: () => { wrap('#f2dcae', BEEF, () => { ps([[10, 3], [12, 5]], RICE); ps([[11, 2]], CHEESE); ps([[12, 3]], TOM); PG([[1, 11], [4, 8], [8, 12], [5, 15]], '#c8d0da'); }); },
  falafel: () => { wrap('#f0d49a', '#a8dc7a', () => { blobs([[9, 1], [11, 3]], '#8a6a2a', 3, 3); ps([[10, 2], [12, 4]], '#b89a4a'); ps([[13, 2]], '#fbf8f0'); ps([[9, 4]], TOM); }); },
  potstickers: () => { PL(() => { for (const [x, y] of [[0, 4], [5, 3], [10, 4], [3, 8]]) { OV(x, y, 6, 4, '#f6efdc'); r(x + 1, y + 3, 4, 1, '#c8843a'); } OV(10, 9, 5, 4, '#8a5a3a'); }, '#3a6ab0'); },
  yakitori: () => { PL(() => { skewer(5, ['#c8742a', '#8ac83a', '#c8742a', '#8ac83a']); skewer(9, ['#b8642a', '#c8742a', '#8ac83a', '#c8742a']); ps([[3, 4], [9, 4], [6, 8]], '#e8a868'); }); },
  okonomiyaki: () => { pan('#c8925a', '#d89a4a', () => { for (const y of [6, 8, 10]) sl(3, y + 1, 12, y - 1, '#5a3020'); for (const y of [7, 9, 11]) sl(4, y + 1, 11, y - 1, '#fbf4dc'); garnish([[5, 6], [10, 11], [8, 8]]); }); },
  fish_tacos: () => { PL(() => { taco(0, 5, 9, '#f2dcae', ['#e8a848', '#d8c8e0', AVO]); taco(6, 7, 9, '#f2dcae', ['#d8c8e0', '#e8a848', AVO]); PG([[12, 2], [16, 2], [14, 5]], '#8ac83a'); }); },
  enchiladas: () => { bake('#3a6ab0', '#c8381c', () => { for (const y of [5, 8, 11]) r(2, y, 12, 2, '#e8a04a'); r(2, 7, 12, 1, '#c8381c'); r(2, 10, 12, 1, '#c8381c'); ps([[4, 5], [9, 6], [6, 8], [11, 9], [5, 11], [10, 12]], CHEESE); garnish([[7, 6], [12, 11]]); }); },
  dumplings: () => { PL(() => { dumpling(0, 4); dumpling(5, 3); dumpling(10, 4); dumpling(2, 8); dumpling(8, 8); }, '#c0483a'); },
  karaage: () => { PL(() => { blobs([[1, 5], [5, 3], [9, 5], [4, 8], [8, 8]], '#c8842a', 5, 4); ps([[3, 6], [7, 4], [11, 6], [6, 9], [10, 9]], '#e8b060'); PG([[12, 9], [16, 8], [15, 12]], P.lemon); garnish([[1, 10]]); }); },
  sambusas: () => { PL(() => { triangle(0, 4, 8, '#d89a3a'); triangle(7, 3, 8, '#e0a848'); triangle(4, 7, 7, '#c8842a'); ps([[13, 11]], P.red); }); },
  samosas: () => { PL(() => { triangle(1, 2, 7, '#e0a848'); triangle(8, 4, 8, '#d89a3a'); OV(1, 9, 6, 4, '#5fa84a'); p(3, 10, '#a8dc7a'); }); },
  shawarma: () => { PL(() => { PG([[9, 9], [12, 3], [16, 9]], '#f0d49a'); blobs([[1, 4], [4, 6], [6, 3]], '#b8642a', 4, 3); ps([[2, 5], [6, 7], [8, 4]], '#e89a5a'); OV(1, 9, 4, 3, '#fbf8f0'); ps([[6, 10], [8, 9]], TOM); ps([[7, 11], [9, 11]], '#a8dc7a'); }); },
  tacos_al_pastor: () => { PL(() => { taco(0, 5, 9, '#eab84a', ['#c8442a', '#f6d24a', GRN]); taco(6, 7, 9, '#eab84a', ['#f6d24a', '#c8442a', GRN]); OV(12, 1, 3, 3, '#f6d24a'); }); },
  fried_chicken: () => { PL(() => { OV(0, 3, 9, 7, '#c8842a'); r(8, 8, 3, 2, '#f6ead6'); OV(6, 6, 9, 6, '#d8943a'); ps([[2, 5], [4, 4], [5, 7], [9, 8], [12, 8], [10, 10]], '#f0c070'); ps([[3, 7], [11, 9]], '#a8642a'); }); },
  bao: () => { steamer(); OV(2, 3, 6, 5, '#fbf8f0'); OV(8, 3, 6, 5, '#fbf8f0'); ps([[4, 4], [5, 3], [10, 4], [11, 3]], '#d8d0c0'); steam(6, 0, STEAM); },
  maki_rolls: () => { PL(() => { for (const [x, y] of [[0, 4], [5, 3], [10, 4], [3, 8], [8, 8]]) { OV(x, y, 6, 5, NORI); ov(x + 1, y + 1, 4, 3, RICE); p(x + 2, y + 2, SALMON); p(x + 3, y + 2, AVO); } }, '#3a3644'); },
  korean_bbq: () => { OV(0, 4, 16, 11, '#3a3644'); ov(2, 5, 12, 8, '#5e6676'); for (const x of [4, 7, 10]) ln(x, 6, x, 12, '#2a2733'); bits([[3, 7], [8, 6], [9, 10]], '#b0482a', 3, 2); bits([[5, 10], [11, 8]], '#d8805a', 3, 2); garnish([[6, 8]]); ps([[12, 11]], '#fbf8f0'); steam(5, 0, STEAM); },
  injera_plate: () => { pan('#c8a878', '#e0c898', () => { OV(2, 5, 5, 4, '#c8381c'); OV(8, 5, 5, 4, '#e8b030'); OV(3, 9, 5, 4, '#5fa84a'); OV(9, 9, 4, 3, '#a8501a'); ps([[7, 8]], '#fbf8f0'); ps([[4, 6], [10, 6]], '#f6d898'); }); },
  dim_sum: () => { steamer(); dumpling(2, 4); dumpling(8, 4, '#f6e0d8'); OV(5, 6, 5, 3, '#f8d048'); p(7, 7, P.orange); ps([[10, 5]], SHRIMP); steam(6, 0, STEAM); },
  // roasts, fish & pizza
  pan_fish: () => { PL(() => { PG([[1, 8], [5, 4], [11, 4], [13, 7], [16, 4], [16, 11], [13, 8], [11, 11], [5, 11]], '#e0a848'); ps([[4, 7]], OL); ps([[6, 6], [8, 8], [10, 6]], '#f6d090'); PG([[1, 11], [5, 10], [4, 13]], P.lemon); }); },
  sausage_mash: () => { PL(() => { OV(1, 5, 10, 7, '#f6ecc0'); ps([[3, 7], [6, 6], [8, 9]], '#fbf8e0'); OV(6, 3, 9, 4, '#b0562a'); OV(7, 7, 9, 4, '#a84a24'); ps([[8, 4], [9, 8]], '#d88a5a'); r(3, 11, 6, 1, '#8a4a2a'); }); },
  flatbreads: () => { PL(() => { OV(0, 6, 13, 6, '#e8c888'); OV(2, 3, 13, 6, '#f2dcae'); ps([[5, 5], [9, 4], [11, 6], [7, 7]], '#b8843a'); ps([[4, 9], [8, 10]], '#c8a060'); }); },
  roast_veg: () => { tray(() => { bits([[1, 6], [8, 5]], '#f2c070', 3, 3); bits([[4, 8], [12, 7]], P.orange, 3, 2); bits([[5, 4], [10, 9]], P.red, 3, 2); bits([[2, 10], [13, 10]], '#e8c8d8', 2, 2); garnish([[7, 8], [11, 5]]); }, PAN); },
  pork_chops: () => { PL(() => { PG([[1, 6], [4, 3], [9, 3], [12, 6], [10, 11], [4, 11]], '#d8946a'); r(10, 4, 4, 2, '#f6ead6'); ps([[4, 5], [7, 8], [5, 9]], '#b8643a'); PG([[11, 8], [16, 9], [13, 12]], '#f2dc9a'); ps([[13, 10]], '#d8302c'); }); },
  chicken_tenders: () => { PL(() => { for (const [x, y] of [[0, 5], [4, 3], [8, 5]]) { PG([[x, y + 5], [x + 2, y], [x + 5, y], [x + 6, y + 5]], '#d8943a'); p(x + 3, y + 2, '#f0c070'); } OV(10, 8, 5, 4, '#c8381c'); }); },
  fish_cakes: () => { PL(() => { blobs([[0, 5], [5, 3], [9, 6]], '#d8983a', 7, 5); ps([[2, 6], [7, 4], [11, 8], [4, 8], [12, 7]], '#f0c878'); garnish([[5, 9], [1, 11]]); PG([[12, 10], [16, 10], [14, 13]], P.lemon); }); },
  garlic_shrimp: () => { skillet('#f2dc8a', () => { for (const [x, y] of [[2, 7], [6, 6], [4, 10], [8, 10]]) { ps([[x, y], [x + 1, y], [x + 2, y + 1], [x + 2, y + 2], [x + 1, y + 2]], SHRIMP); p(x, y + 1, '#e8603a'); } garnish([[5, 8], [9, 8], [3, 12]]); }); },
  lemon_chicken: () => { tray(() => { OV(1, 4, 7, 6, '#d8943a'); OV(7, 5, 7, 6, '#c8842a'); ps([[3, 6], [9, 7]], '#f0c070'); OV(11, 3, 4, 4, P.lemon); bits([[1, 11], [12, 11]], '#f2c070', 3, 2); garnish([[6, 4], [8, 11]]); }, PAN); },
  garlic_knots: () => { PL(() => { for (const [x, y] of [[0, 5], [5, 3], [10, 5], [3, 8], [8, 8]]) { OV(x, y, 6, 5, '#e2a85a'); p(x + 2, y + 2, '#a8642e'); p(x + 1, y + 1, '#fbe0a8'); p(x + 4, y + 1, GRN); } }); },
  baked_salmon: () => { PL(() => { PG([[1, 6], [9, 4], [12, 6], [11, 10], [2, 11]], '#f08a5a'); ps([[3, 7], [6, 6], [9, 7]], '#fbc8a8'); r(3, 9, 7, 1, '#c8642a'); blobs([[11, 8]], '#3a8a3a', 4, 3); PG([[10, 2], [14, 2], [12, 5]], P.lemon); }); },
  cottage_pie: () => { bake('#7a4a2e', '#f2dc9a', () => { for (const y of [6, 8, 10, 12]) ps([[3, y], [5, y], [7, y], [9, y], [11, y], [13, y]], '#c89a4a'); ps([[4, 7], [10, 9], [6, 11]], '#a8742a'); }); },
  ratatouille: () => { pan('#c0483a', '#e8603a', () => { for (let i = 0; i < 5; i++) { OV(2 + i * 2, 5 + (i & 1), 3, 3, [TOM, '#f2c230', '#8a5cc2', '#5fa84a', TOM][i]); OV(2 + i * 2, 9 + (i & 1), 3, 3, ['#5fa84a', TOM, '#f2c230', '#8a5cc2', '#5fa84a'][i]); } }); },
  meatloaf: () => { PL(() => { loaf('#8a4a2a', () => { R(1, 3, 14, 3, '#c8381c'); r(5, 6, 1, 8, '#6a3a22'); r(10, 6, 1, 8, '#6a3a22'); ps([[3, 9], [8, 11], [12, 8]], '#b87a4a'); }); }); },
  mussels_broth: () => { B('#f2ece0', '#f6ecc8', () => { for (const [x, y] of [[2, 2], [7, 1], [11, 3]]) { OV(x, y, 4, 4, '#2a3a5a'); p(x + 1, y + 1, '#f0a858'); p(x + 2, y + 2, '#f0a858'); } garnish([[6, 5], [10, 6]]); }); },
  margherita: () => { OV(0, 1, 16, 14, '#d89a4a'); ov(2, 3, 12, 10, '#e8483a'); blobs([[3, 4], [9, 4], [6, 8], [10, 9]], '#fbf8f0', 3, 3); leafs(7, 6, GRN); ps([[4, 10], [12, 7]], GRN); },
  sausage_pizza: () => { OV(0, 1, 16, 14, '#c88a3a'); ov(2, 3, 12, 10, '#f2c850'); blobs([[3, 5], [9, 4], [6, 9]], '#a8442a', 3, 3); ps([[7, 5], [11, 8], [4, 9], [10, 11]], P.red); ps([[6, 7], [9, 10], [12, 6]], '#5fa84a'); },
  quiche: () => { pie('#c8843a', '#f6d868', () => { ps([[4, 7], [8, 6], [11, 9], [6, 10]], '#d8605a'); ps([[6, 7], [9, 10], [10, 7]], '#e8a830'); garnish([[5, 9]]); }); },
  fish_pie: () => { bake('#3a6ab0', '#f6ecc0', () => { for (const [x, y] of [[3, 6], [7, 6], [11, 6], [5, 9], [9, 9], [3, 11], [11, 11]]) ps([[x, y], [x + 1, y - 1]], '#d8a848'); garnish([[7, 11]]); ps([[6, 12]], SHRIMP); }); },
  pulled_pork: () => { bun([['#d8c8e0', 1, -1], ['#a8442a', 3, -1], ['#c8642a', 1]], '#e0a04a'); ps([[2, 8], [5, 9], [9, 8], [12, 9]], '#d8805a'); },
  steak_frites: () => { PL(() => { OV(0, 4, 10, 7, '#7a3a22'); for (const x of [2, 4, 6]) ln(x, 5, x + 2, 9, '#4a2416'); r(3, 3, 3, 2, '#f8de6a'); for (let i = 0; i < 5; i++) r(10 + i, 3 + (i % 2), 1, 7, '#f6d24a'); garnish([[5, 2]]); }, '#e8c25a'); },
  bbq_ribs: () => { PL(() => { R(1, 4, 13, 7, '#8a3a1c'); for (const x of [3, 6, 9, 12]) { r(x, 3, 1, 9, '#f6ead6'); } r(1, 5, 13, 1, '#c85a2a'); ps([[2, 8], [5, 7], [8, 9], [11, 8]], '#b84a22'); OV(11, 10, 5, 3, '#f6c830'); }); },
  catch_of_the_day: () => { PL(() => { OV(1, 8, 9, 4, '#5fa84a'); PG([[2, 5], [10, 3], [13, 6], [11, 9], [3, 9]], '#f6ecd8'); ps([[4, 6], [7, 5], [9, 7]], '#d8a848'); r(4, 8, 6, 1, '#e8c070'); PG([[11, 9], [15, 9], [13, 12]], P.lemon); sparkle(13, 3); }, '#e8c25a'); },
  beef_wellington: () => { PL(() => { loaf('#d89a3a', () => { for (const x of [3, 6, 9, 12]) ln(x, 5, x - 1, 8, '#a8642a'); }); R(10, 5, 5, 9, '#e0a848'); ov(11, 6, 3, 7, '#c8504a'); r(12, 8, 1, 3, '#e88a8a'); }, '#e8c25a'); },
  seafood_boil: () => { R(0, 7, 16, 8, '#e8dcc0'); ps([[1, 9], [6, 12], [11, 9], [14, 13]], '#c8b898'); R(1, 5, 5, 3, '#f6c830'); ps([[2, 6], [4, 6]], '#fbe690'); OV(6, 2, 6, 5, '#e8483a'); ps([[5, 3], [12, 3], [5, 1], [12, 1]], '#e8483a'); OV(10, 8, 4, 4, '#2a3a5a'); ps([[2, 10], [3, 10], [4, 11], [4, 12], [3, 12]], SHRIMP); OV(6, 10, 4, 4, '#c8a068'); PG([[12, 12], [16, 12], [14, 15]], P.lemon); },
  // baking
  pb_cookies: () => { cookies('#d8a45a', [], CHOC); for (const [x, y] of [[8, 5], [1, 9]]) { ln(x, y, x + 5, y, '#b07a3a'); ln(x, y + 2, x + 5, y + 2, '#b07a3a'); ln(x + 1, y - 1, x + 1, y + 3, '#b07a3a'); ln(x + 4, y - 1, x + 4, y + 3, '#b07a3a'); } },
  shortbread: () => { PL(() => { for (const [x, y] of [[0, 6], [5, 3], [9, 7]]) { R(x, y, 7, 4, '#f0cc78'); ps([[x + 1, y + 1], [x + 3, y + 1], [x + 5, y + 1], [x + 2, y + 2], [x + 4, y + 2]], '#c8a458'); } }); },
  oat_cookies: () => { cookies('#c8975a', [[8, 5], [11, 7], [9, 9], [13, 5], [2, 9], [5, 11], [3, 12], [6, 8]], '#f2dcae'); ps([[10, 4], [4, 10]], '#8a5a2a'); },
  banana_bread: () => { loaf('#b8742a', () => { OV(3, 3, 10, 4, '#d89a4a'); ln(4, 5, 11, 5, '#f6e08a'); R(10, 7, 5, 8, '#f2d88a'); ps([[11, 9], [13, 11], [12, 13]], '#b8842a'); }); },
  no_knead_bread: () => { OV(0, 3, 16, 12, '#c8843a'); OV(2, 4, 12, 8, '#e0a858'); ln(4, 6, 11, 10, '#f6e6c0'); ln(11, 6, 4, 10, '#f6e6c0'); ps([[3, 9], [12, 8], [7, 5]], '#f6ecd8'); },
  cornbread: () => { OV(0, 4, 13, 11, PAN); r(12, 8, 4, 2, PAN); ov(1, 5, 11, 9, '#f2c230'); ln(6, 5, 6, 13, '#c89a1a'); ln(2, 9, 11, 9, '#c89a1a'); ps([[3, 7], [9, 7], [4, 11], [9, 11]], '#fbe690'); },
  muffins: () => { muffin('#e0a858', '#f4f0e6', [[4, 4], [7, 3], [10, 5], [6, 6], [11, 7], [4, 7]], BLUEB); },
  brownies: () => { PL(() => { R(1, 6, 8, 6, '#5a3020'); R(6, 3, 9, 6, '#6b3f2a'); r(7, 3, 7, 1, '#8a5a3a'); ps([[8, 5], [11, 6], [13, 4], [3, 8], [6, 10]], '#3a1e12'); ps([[9, 4], [2, 7]], '#a87a5a'); }); },
  scones: () => { PL(() => { OV(1, 6, 9, 6, '#e0a858'); OV(1, 3, 9, 5, '#e8b468'); r(2, 7, 7, 1, '#fbf8f0'); r(2, 8, 7, 1, '#c8284a'); OV(9, 6, 6, 5, '#e0a858'); ps([[3, 4], [6, 5], [11, 7]], '#f6dca0'); }); },
  focaccia: () => { R(0, 4, 16, 10, '#e0a848'); r(1, 5, 14, 8, '#f0c468'); for (const [x, y] of [[3, 6], [7, 6], [11, 6], [5, 9], [9, 9], [13, 9], [3, 11], [11, 11]]) p(x, y, '#c8862a'); garnish([[4, 8], [8, 7], [12, 7], [7, 11], [10, 10]]); ps([[6, 10], [13, 11]], '#fbf8f0'); },
  lemon_drizzle: () => { loaf('#f2d060', () => { R(1, 4, 14, 3, '#fbf8f0'); ps([[3, 7], [8, 8], [12, 7], [6, 7]], '#fbf8f0'); OV(5, 1, 5, 4, P.lemon); p(7, 2, '#fffad0'); r(5, 9, 1, 5, '#d8b040'); r(10, 9, 1, 5, '#d8b040'); }); },
  gingerbread: () => { spr(3, 1, ['...###...', '..#####..', '..#####..', '...###...', '#########', '#########', '..#####..', '..#####..', '..#####..', '..##.##..', '.###.###.', '.###.###.', '.###.###.'], { '#': '#b8702a' }, { shade: true }); ps([[6, 2], [8, 2]], OL); ps([[7, 6], [7, 8]], '#fbf8f0'); ps([[4, 6], [10, 6], [5, 12], [9, 12]], '#fbf8f0'); ps([[6, 4], [7, 4], [8, 4]], P.red); },
  berry_pie: () => { pie('#d8984e', '#8a2a5a', () => { lattice('#e8b068'); ps([[5, 7], [9, 9], [11, 7]], '#c84a7a'); }); },
  carrot_cake: () => { cake('#c8843a', '#fbf4e4', '#fbf4e4', () => { PG([[6, 2], [10, 2], [8, 5]], P.orange); ps([[8, 1], [9, 1]], GRN); ps([[4, 8], [9, 11], [12, 7]], P.orange); }); },
  apple_maple_pie: () => { pie('#c8843a', '#e8b048', () => { lattice('#d89a52'); ps([[5, 7], [10, 10]], '#f6d890'); PG([[6, 1], [10, 1], [8, 4]], '#c8442a'); }); steam(11, 0, STEAM); },
  cinnamon_rolls: () => { PL(() => { for (const [x, y] of [[0, 4], [8, 4], [4, 8]]) { OV(x, y, 8, 6, '#d89a4a'); ov(x + 1, y + 1, 6, 4, '#f6e8cc'); ps([[x + 2, y + 2], [x + 3, y + 3], [x + 4, y + 2], [x + 5, y + 3]], '#a8642a'); } }); },
  bagels: () => { donut(0, 5, 9, '#d89a4a', '#b87a32'); donut(7, 2, 9, '#e0a858', '#b87a32'); ps([[9, 3], [12, 4], [13, 6], [2, 7], [5, 6], [10, 7]], '#fbf0d0'); },
  donuts: () => { donut(0, 5, 9, PINK); donut(7, 2, 9, '#6b3f2a'); ps([[2, 6], [5, 7], [6, 9]], '#fbf8f0'); ps([[9, 3], [13, 5], [10, 7]], '#f6d24a'); },
  pumpkin_pie: () => { pie('#c8843a', '#d8742a', () => { OV(6, 7, 4, 4, '#fbf8f0'); ps([[4, 7], [11, 10]], '#e89a4a'); }); },
  choc_cake: () => { cake('#5a3020', '#3a1e12', '#8a5a3a', () => { ps([[4, 3], [7, 3], [10, 3]], '#8a5a3a'); OV(6, 1, 4, 3, BERRY); ps([[3, 7], [3, 8], [12, 7]], '#3a1e12'); }); },
  cheesecake: () => { PL(() => { PG([[1, 12], [1, 6], [14, 9], [14, 12]], '#f6e6b0'); r(1, 11, 13, 2, '#c8843a'); PG([[1, 6], [14, 9], [14, 10], [1, 7]], '#c8284a'); blobs([[2, 3], [6, 4]], BERRY, 3, 3); ps([[4, 9], [8, 10]], '#fbf4dc'); }); },
  sourdough: () => { OV(0, 2, 16, 13, '#b87430'); OV(2, 3, 12, 9, '#d89a4a'); for (const x of [4, 7, 10]) ln(x, 5, x + 2, 10, '#f6ecd8'); ps([[3, 8], [12, 6], [8, 4]], '#fbf4e4'); },
  croissants: () => { PL(() => { for (const [x, y] of [[0, 3], [3, 8]]) { PG([[x, y + 4], [x + 3, y], [x + 9, y], [x + 12, y + 4], [x + 9, y + 3], [x + 3, y + 3]], '#e0a040'); for (const k of [3, 5, 7]) ln(x + k, y, x + k + 1, y + 3, '#b8742a'); p(x + 2, y + 1, '#f6d890'); } }); },
  celebration_cake: () => { plate(); R(2, 8, 12, 5, '#fbf4e4'); R(4, 4, 8, 4, PINK); r(2, 10, 12, 1, '#c8284a'); ps([[3, 8], [6, 8], [9, 8], [12, 8]], PINK); for (const x of [5, 8, 10]) { r(x, 1, 1, 3, [P.sky, P.gold, P.mint][x % 3]); st([[x, 0]], '#f6a830'); } ps([[5, 6], [8, 5], [10, 6]], '#fbf8f0'); },
  // desserts
  fried_bananas: () => { PL(() => { for (const y of [4, 8]) { PG([[1, y + 1], [4, y], [12, y + 1], [15, y + 3], [11, y + 4], [4, y + 3]], '#f2c838'); ln(4, y + 2, 11, y + 3, '#c8842a'); } ps([[3, 5], [8, 9], [12, 6]], '#a8501a'); }); },
  mug_cake: () => { mug('#e05a3a', '#5a3020', 6); OV(2, 3, 10, 5, '#6b3f2a'); ps([[4, 4], [7, 3], [9, 5]], '#3a1e12'); ps([[5, 5], [8, 4]], '#fbf8f0'); },
  ice_pops: () => { for (const [x, c] of [[1, BERRY], [6, P.orange], [11, '#8a5cc2']]) { R(x, 1, 4, 9, c); r(x + 1, 2, 1, 4, lt(c, .4)); r(x + 1, 10, 2, 5, '#e8c890'); } },
  rice_pudding: () => { soup('#f28fb0', '#fbf4e4', () => { ps([[4, 4], [7, 5], [10, 4], [12, 5], [6, 3]], '#e8dcc0'); ps([[5, 5], [8, 4], [9, 6], [11, 3]], '#a8642a'); }); },
  apple_crumble: () => { bake('#c0483a', '#d8a858', () => { ps([[3, 6], [6, 7], [9, 6], [12, 8], [4, 10], [8, 11], [11, 11], [6, 9]], '#f2dcae'); ps([[5, 8], [10, 9], [7, 12]], '#a8742a'); ps([[2, 12], [13, 5]], '#e8c048'); }); },
  crepes: () => { PL(() => { PG([[1, 11], [8, 3], [15, 11]], '#f2d890'); PG([[4, 11], [8, 6], [12, 11]], '#e8c070'); ps([[5, 8], [10, 7], [8, 10]], '#c89a4a'); PG([[10, 2], [14, 2], [12, 5]], P.lemon); ps([[3, 10], [7, 8], [12, 10]], '#fbf8f0'); }); },
  mango_sticky_rice: () => { PL(() => { OV(1, 5, 8, 6, RICE); ps([[3, 6], [5, 8], [6, 6]], '#e8e0cc'); for (let i = 0; i < 3; i++) PG([[8 + i * 2, 11], [9 + i * 2, 4], [11 + i * 2, 4], [11 + i * 2, 11]], '#f6b030'); ps([[4, 5], [5, 5]], '#fbf8f0'); garnish([[2, 5]]); }); },
  churros: () => { for (let i = 0; i < 3; i++) { PG([[1 + i * 3, 13], [5 + i * 3, 1], [7 + i * 3, 2], [3 + i * 3, 14]], '#d89a4a'); ln(3 + i * 3, 10, 5 + i * 3, 4, '#f6dca0'); } OV(9, 9, 7, 6, '#fbf8f0'); ov(10, 10, 5, 3, '#5a3020'); },
  choc_mousse: () => { glass('#6b3f2a', 5); OV(4, 2, 8, 4, '#fbf8f0'); ps([[6, 2], [9, 3]], '#5a3020'); p(8, 1, BERRY); r(4, 13, 8, 1, '#3a1e12'); },
  mochi: () => { PL(() => { OV(0, 6, 7, 6, PINK); OV(5, 3, 7, 6, '#fbf8f0'); OV(9, 7, 7, 6, '#a8dc8a'); ps([[2, 7], [7, 4], [11, 8]], '#ffffff'); }, '#3a3644'); },
  tiramisu: () => { PL(() => { stack(3, [['#6b3f2a', 2], ['#fbf4e4', 2], ['#c89a5a', 2], ['#fbf4e4', 2], ['#c89a5a', 2]]); ps([[4, 3], [8, 4], [11, 3]], '#3a1e12'); }); },
  fruit_tart: () => { pie('#d8984e', '#fbf0c0', () => { blobs([[3, 6], [9, 6]], BERRY, 3, 3); blobs([[6, 5], [6, 9]], '#f6b030', 3, 3); blobs([[10, 9], [3, 9]], BLUEB, 3, 2); ps([[7, 8]], '#8ac83a'); }); },
  baklava: () => { PL(() => { for (const [x, y] of [[0, 6], [5, 3], [8, 7]]) { PG([[x, y + 3], [x + 4, y], [x + 8, y + 3], [x + 4, y + 6]], '#e0a040'); ln(x + 1, y + 3, x + 7, y + 3, '#a8642a'); p(x + 4, y + 2, '#8ac83a'); } sl(3, 5, 4, 5, '#f6d24a'); }); },
  souffle: () => { R(3, 8, 10, 7, '#fbf8f0'); for (const x of [5, 7, 9, 11]) ln(x, 9, x, 14, '#d8d0c0'); OV(2, 2, 12, 8, '#6b3f2a'); ps([[4, 4], [7, 3], [10, 4], [6, 6]], '#fbf8f0'); steam(11, 0, STEAM); },
  maple_taffy: () => { R(4, 5, 8, 6, '#d8862a'); r(5, 6, 6, 1, '#f6c060'); PG([[0, 3], [4, 6], [4, 10], [0, 13]], '#fbf0d0'); PG([[16, 3], [12, 6], [12, 10], [16, 13]], '#fbf0d0'); ps([[1, 6], [2, 8], [1, 10], [14, 6], [13, 8], [14, 10]], '#e8c890'); spr(6, 7, ['.#.#', '####', '.##.'], { '#': '#a8501a' }); },
  // drinks
  pot_of_tea: () => { OV(1, 5, 11, 9, '#3b5bdb'); r(4, 3, 5, 2, '#3b5bdb'); r(6, 2, 1, 1, P.gold); PG([[11, 8], [15, 5], [15, 7], [12, 11]], '#3b5bdb'); ps([[3, 7], [4, 6]], '#8aa8f0'); r(2, 13, 9, 1, '#2c3e7a'); steam(13, 0, STEAM); },
  pot_of_coffee: () => { PG([[3, 4], [11, 4], [12, 15], [2, 15]], '#dff0f6'); PG([[3, 8], [11, 8], [12, 14.5], [2, 14.5]], '#4a2a1a'); R(2, 2, 10, 2, PAN); r(12, 5, 3, 1, PAN); r(14, 6, 1, 6, PAN); r(12, 12, 3, 1, PAN); r(3, 8, 8, 1, '#7a4a2e'); steam(5, -1, STEAM); },
  hot_chocolate: () => { mugD('#e05a3a', '#6b3f2a', true); blobs([[3, 4], [6, 5], [8, 4]], '#fbf8f0', 3, 2); },
  banana_smoothie: () => { tallGlass('#f6e08a', { straw: P.red, foam: '#fbf4c8' }); PG([[10, 1], [14, 0], [15, 2], [12, 4]], P.yellow); },
  orange_juice: () => { tallGlass('#f6982a', { slice: P.orange, top: 5 }); ps([[5, 8], [9, 10]], '#fbc068'); },
  lemonade: () => { tallGlass('#f6f0a0', { ice: true, slice: P.lemon, leaf: true }); ps([[5, 9], [10, 7]], GRN); },
  berry_smoothie: () => { tallGlass('#c8407a', { straw: '#3b5bdb', foam: '#e88ab0' }); blobs([[10, 0]], BLUEB, 3, 3); },
  green_smoothie: () => { tallGlass('#7ac050', { straw: P.orange, foam: '#a8dc7a', leaf: true }); },
  mango_lassi: () => { tallGlass('#f6b848', { foam: '#fbf0d0', straw: '#2f9e44' }); ps([[6, 3], [8, 3]], '#c8842a'); },
  milkshake: () => { tallGlass('#f6a8c0', { straw: P.red, top: 5 }); OV(4, 1, 8, 5, '#fbf8f0'); OV(7, 0, 3, 3, '#e8384a'); },
  masala_chai: () => { PG([[3, 4], [13, 4], [12, 15], [4, 15]], '#e6f2f6'); PG([[3.4, 6], [12.6, 6], [12, 14.6], [4, 14.6]], '#c88a4a'); r(4, 6, 8, 1, '#e8c090'); ps([[6, 9], [9, 11]], '#a8642a'); ln(10, 1, 12, 5, '#8a4a2a'); steam(4, 0, STEAM); },
  mulled_cider: () => { mugD('#f4f0e6', '#c8742a', true); ln(8, 1, 10, 6, '#8a4a2a'); OV(3, 4, 4, 3, P.orange); },
  horchata: () => { tallGlass('#f6ecd8', { ice: true, straw: '#c8642a' }); ps([[5, 5], [8, 6], [10, 5], [6, 8]], '#a8642a'); },
  maple_latte: () => { tallGlass('#c89a6a', { ice: true, straw: PAN, layer: ['#7a4a2e', 10] }); r(4, 4, 8, 2, '#fbf4e4'); ps([[6, 4], [9, 5]], '#c8742a'); },
  garden_spritz: () => { tallGlass('#c8e8b0', { ice: true, slice: '#8ac83a', leaf: true }); ps([[5, 7], [9, 12], [10, 6]], '#5fa84a'); },
  boba_tea: () => { boba('#c8946a', '#3a2418', P.red); r(4, 6, 8, 1, '#f6ecd8'); },
};

/* ---------- ingredients ---------- */
const jar = (body, lid, f) => { R(3, 5, 10, 10, body); R(3, 2, 10, 3, lid); r(4, 2, 8, 1, lt(lid, .3)); if (f) f(); };
const tin = (label, f) => { R(3, 2, 10, 13, P.steel); r(3, 4, 10, 9, label); r(4, 2, 8, 1, '#e8ecf2'); if (f) f(); };
const bottle = (c, cap, label, f) => { R(4, 6, 8, 9, c); R(6, 2, 4, 4, c); r(6, 1, 4, 2, cap); if (label) r(4, 9, 8, 4, label); if (f) f(); };
const bag = (c, f) => { PG([[3, 2], [13, 2], [14, 15], [2, 15]], c); r(3, 3, 10, 1, dk(c, .2)); if (f) f(); };
const box = (c, f) => { R(2, 3, 12, 12, c); r(2, 3, 12, 2, lt(c, .2)); if (f) f(); };
const tub = (c, lid, f) => { PG([[2, 6], [14, 6], [13, 15], [3, 15]], c); R(1, 4, 14, 2, lid); if (f) f(); };
const meatTray = f => { R(0, 10, 16, 5, '#e4e8ee'); r(1, 10, 14, 1, '#ccd2da'); f(); };
const ING = {
  olive_oil: () => { bottle('#6a8a2a', '#3a3644', '#f6ecd0', () => { OV(6, 10, 4, 3, '#5fa84a'); r(5, 6, 1, 3, '#a8c85a'); }); },
  soy_sauce: () => { bottle('#3a2418', P.red, '#f6ecd0', () => { r(6, 10, 4, 1, P.red); r(5, 6, 1, 3, '#6a4a3a'); }); },
  stock: () => { box('#f2c230', () => { R(5, 7, 6, 6, '#c8842a'); r(6, 8, 4, 2, '#e8b050'); r(2, 13, 12, 1, P.red); }); },
  oats: () => { R(3, 3, 10, 12, '#e8d8b0'); OV(3, 1, 10, 4, '#3b5bdb'); r(3, 6, 10, 1, '#3b5bdb'); ps([[5, 9], [8, 8], [10, 10], [6, 11], [9, 12]], '#c8a868'); OV(6, 8, 4, 3, '#f6ecd0'); },
  peanut_butter: () => { jar('#c8924a', P.red, () => { r(4, 8, 8, 4, '#f6ecd0'); OV(6, 9, 4, 2, '#b87a3a'); }); },
  jam: () => { jar('#a8204a', '#f4f0e6', () => { ps([[4, 2], [6, 3], [8, 2], [10, 3], [12, 2], [5, 4], [9, 4], [11, 4]], P.red); r(5, 8, 6, 4, '#f6ecd0'); OV(7, 9, 2, 2, BERRY); p(9, 9, LEAF); }); },
  honey: () => { jar('#f0a82a', '#8a5a2a', () => { r(5, 8, 6, 4, '#fbe690'); ps([[6, 9], [8, 10], [9, 9]], '#3a3644'); p(5, 6, '#fbd870'); }); },
  maple_syrup: () => { PG([[4, 5], [12, 5], [13, 15], [3, 15]], '#b05a1a'); R(6, 1, 4, 4, '#b05a1a'); r(6, 0, 4, 1, P.red); r(11, 6, 3, 1, '#b05a1a'); r(13, 7, 1, 3, '#b05a1a'); r(5, 8, 6, 5, '#f6ecd0'); spr(6, 9, ['.#.#', '####', '.##.', '..#.'], { '#': P.red }); },
  cocoa: () => { tin('#6b3f2a', () => { r(4, 6, 8, 5, '#f6ecd0'); OV(6, 7, 4, 3, '#8a5a3a'); r(3, 13, 10, 1, P.gold); }); },
  cinnamon: () => { for (let i = 0; i < 3; i++) { PG([[1 + i * 2, 13 - i * 2], [11 + i, 2 - i * 0 + i], [13 + i, 4 + i], [3 + i * 2, 15 - i * 2]], '#a8642a'); } ln(3, 12, 12, 3, '#d89a5a'); r(6, 7, 4, 2, P.red); },
  curry_powder: () => { tin('#f2c230', () => { OV(5, 6, 6, 5, '#d8862a'); ps([[7, 7], [8, 9]], '#f6c860'); r(3, 13, 10, 1, P.red); }); },
  bbq_spice: () => { R(4, 5, 8, 10, '#c8301c'); R(4, 2, 8, 3, PAN); ps([[5, 3], [7, 3], [9, 3], [11, 3]], '#c2cad4'); spr(6, 7, ['.#..', '.##.', '####', '####', '.##.'], { '#': '#f6a830' }); p(8, 10, '#fbe690'); },
  berbere: () => { bag('#d8b888', () => { OV(4, 6, 8, 7, '#b0381c'); ps([[6, 8], [9, 10], [7, 11]], '#e0683a'); r(5, 2, 6, 1, '#a8825a'); }); },
  yeast: () => { R(3, 3, 10, 12, '#f6d24a'); ps([[3, 2], [5, 2], [7, 2], [9, 2], [11, 2]], '#f6d24a'); r(4, 6, 8, 5, '#fbf4dc'); OV(6, 7, 4, 3, '#c8a868'); r(3, 13, 10, 1, P.red); },
  cornmeal: () => { bag('#f6d868', () => { PG([[6, 12], [7, 5], [9, 5], [10, 12]], '#f2b020'); ps([[7, 7], [8, 9], [8, 6], [7, 10]], '#fbe690'); ps([[5, 9], [5, 11], [11, 9], [11, 11]], LEAF); }); },
  sesame: () => { jar('#f6ecd0', '#2a2733', () => { ps([[5, 7], [7, 8], [9, 7], [11, 8], [6, 10], [8, 11], [10, 10], [5, 12], [9, 13], [11, 12]], '#c8a868'); }); },
  tea: () => { box('#2f9e44', () => { R(5, 6, 6, 6, '#f6ecd0'); r(7, 7, 2, 3, '#a8642a'); ln(8, 3, 8, 6, '#f6ecd0'); r(11, 1, 3, 3, P.red); ln(8, 3, 12, 2, '#f6ecd0'); }); },
  coffee: () => { bag('#7a4a2e', () => { r(4, 2, 8, 2, P.gold); OV(5, 7, 6, 6, '#3a2418'); ln(8, 8, 7, 11, '#a8744a'); }); },
  lentils: () => { bag('#e6f2f6', () => { r(3, 6, 10, 9, '#e8742a'); ps([[5, 8], [8, 7], [10, 9], [6, 11], [9, 12], [11, 11], [4, 13]], '#f6a060'); r(4, 2, 8, 2, P.red); }); },
  rice_noodles: () => { OV(1, 2, 14, 13, '#f6f2e6'); for (const x of [3, 5, 7, 9, 11]) ln(x, 3, x, 13, '#d8d0c0'); R(1, 6, 14, 3, P.red); r(6, 7, 4, 1, '#f6ecd0'); },
  nori: () => { R(2, 2, 11, 12, '#1e3a2e'); R(4, 3, 11, 12, NORI); ps([[6, 5], [9, 8], [12, 6], [7, 11], [11, 12]], '#3a6a4a'); r(4, 8, 11, 3, '#f6ecd0'); r(8, 9, 3, 1, P.red); },
  tahini: () => { jar('#e8d0a0', '#fbf8f0', () => { r(4, 8, 8, 4, '#3a6ab0'); ps([[6, 9], [8, 10], [10, 9]], '#f6ecd0'); }); },
  coconut_milk: () => { tin('#fbf8f0', () => { OV(5, 6, 7, 6, '#7a4a2e'); ov(6, 7, 5, 4, '#fbf8f0'); r(3, 13, 10, 1, '#2f9e44'); }); },
  chickpeas: () => { tin('#f6d24a', () => { blobs([[4, 6], [8, 5], [6, 9], [10, 9]], '#e8c078', 3, 3); r(3, 13, 10, 1, '#2f9e44'); }); },
  corn: () => { tin('#2f9e44', () => { ps([[5, 6], [7, 6], [9, 6], [11, 6], [4, 8], [6, 8], [8, 8], [10, 8], [5, 10], [7, 10], [9, 10], [11, 10]], '#f6d24a'); r(3, 13, 10, 1, '#f6d24a'); }); },
  tuna: () => { R(1, 6, 14, 8, P.steel); OV(1, 3, 14, 6, '#3b5bdb'); r(1, 8, 14, 4, '#3b5bdb'); spr(4, 5, ['.###..#', '######.', '.###..#'], { '#': '#f6ecd0' }); r(1, 13, 14, 1, '#9aa0aa'); },
  salsa: () => { jar('#d8382c', '#f6d24a', () => { r(4, 8, 8, 4, '#f6ecd0'); PG([[5, 9], [10, 9], [11, 11], [8, 11]], GRN); ps([[5, 6], [10, 13], [6, 13]], '#f08a5a'); }); },
  pickles: () => { jar('#c8e0a0', '#2f9e44', () => { for (const x of [4, 7, 10]) { R(x, 6, 2, 8, '#5a9a3a'); p(x, 8, '#8ac860'); p(x + 1, 11, '#3a7a2a'); } }); },
  olives: () => { tub('#f4f0e6', '#c2cad4', () => { blobs([[3, 7], [9, 8], [6, 11]], '#6a8a2a', 4, 3); blobs([[6, 7], [10, 11], [3, 11]], '#3a2a3a', 4, 3); ps([[4, 8], [10, 9], [7, 12]], P.red); }); },
  peanuts: () => { bag('#3b5bdb', () => { r(4, 6, 8, 7, '#f6ecd0'); OV(5, 7, 3, 5, '#d8a858'); OV(8, 8, 3, 4, '#c8924a'); p(6, 9, '#a8743a'); }); },
  miso: () => { tub('#b87a3a', P.red, () => { r(4, 8, 8, 5, '#f6ecd0'); r(6, 9, 4, 1, '#3a3644'); r(7, 10, 2, 2, '#3a3644'); }); },
  kimchi: () => { jar('#e6f2f6', P.red, () => { r(4, 6, 8, 8, '#d8482c'); ps([[5, 7], [8, 8], [10, 7], [6, 10], [9, 11], [5, 12], [11, 12]], '#f6d8b0'); ps([[7, 9], [10, 10], [6, 13]], '#8ac860'); }); },
  tortillas: () => { for (let i = 0; i < 3; i++) OV(1, 9 - i * 3, 14, 5, i === 2 ? '#f6e4b8' : '#e8d09a'); ps([[5, 5], [9, 4], [11, 6], [7, 6]], '#c8a060'); },
  pita: () => { OV(0, 6, 13, 8, '#e8c888'); OV(3, 2, 13, 8, '#f2dcae'); ps([[6, 5], [10, 4], [12, 7], [8, 7]], '#c8a060'); ps([[3, 10], [7, 12]], '#c8a060'); },
  buns: () => { for (const [x, y] of [[0, 6], [6, 2]]) { OV(x, y, 10, 7, '#d8924a'); r(x + 1, y + 5, 8, 2, '#f2d49a'); OV(x, y + 6, 10, 3, '#c8843a'); ps([[x + 3, y + 1], [x + 5, y + 2], [x + 7, y + 1]], '#fbe8b8'); } },
  dumpling_wrappers: () => { for (let i = 0; i < 4; i++) OV(1, 10 - i * 2, 14, 5, i === 3 ? '#fbf8f0' : '#e8e0d0'); ps([[5, 5], [10, 6]], '#f0e8d8'); },
  cream: () => { PG([[4, 5], [8, 2], [12, 5]], '#fbf8f0'); R(4, 5, 8, 10, '#fbf8f0'); r(4, 8, 8, 3, P.red); r(9, 2, 2, 2, P.red); p(8, 9, '#fbf8f0'); },
  plain_yogurt: () => { tub('#fbf8f0', '#3b5bdb', () => { r(5, 9, 6, 3, '#3b5bdb'); ps([[6, 10], [8, 10], [9, 10]], '#fbf8f0'); }); },
  mozzarella: () => { PG([[2, 3], [14, 3], [13, 15], [3, 15]], '#dff0f6'); r(2, 3, 12, 2, '#2f9e44'); OV(4, 6, 8, 8, '#fbf8f0'); ps([[6, 8], [7, 7]], '#ffffff'); r(7, 1, 2, 2, '#dff0f6'); },
  parmesan: () => { PG([[1, 8], [12, 2], [15, 6], [15, 13], [1, 13]], '#f2dc9a'); r(1, 12, 14, 2, '#c8a04a'); r(1, 8, 14, 1, '#fbf0c8'); ps([[5, 10], [8, 9], [11, 10], [9, 6], [12, 8]], '#d8b868'); },
  cream_cheese: () => { R(1, 5, 14, 8, '#d4dae4'); r(1, 7, 14, 4, '#3b5bdb'); r(2, 5, 12, 1, '#f4f6fa'); OV(6, 7, 4, 4, '#fbf8f0'); },
  ham: () => { meatTray(() => { for (const [x, y] of [[1, 5], [6, 3]]) { OV(x, y, 9, 7, '#f2a0a0'); ov(x + 1, y + 1, 7, 5, '#f6b8b8'); ps([[x + 3, y + 2], [x + 5, y + 4]], '#fbd8d8'); } }); },
  sausage: () => { for (let i = 0; i < 3; i++) { OV(1 + i * 5, 3 + (i % 2) * 2, 5, 10, '#c86a4a'); p(2 + i * 5, 5 + (i % 2) * 2, '#e8a080'); } ps([[5, 4], [10, 14]], '#f6ead6'); },
  pork: () => { meatTray(() => { PG([[2, 5], [6, 2], [12, 3], [14, 7], [11, 11], [4, 11]], '#f0a098'); PG([[2, 5], [6, 2], [8, 3], [4, 7]], '#fbf0e8'); ps([[8, 6], [10, 8], [7, 9]], '#f8c8c0'); r(11, 3, 3, 2, '#f6ead6'); }); },
  ground_beef: () => { meatTray(() => { OV(1, 3, 14, 9, '#c8443a'); for (const y of [5, 7, 9]) ps([[3, y], [5, y + 1], [7, y], [9, y + 1], [11, y], [13, y + 1]], '#f0a098'); ps([[4, 6], [8, 8], [12, 6]], '#8a2a22'); }); },
  shrimp: () => { for (const [x, y] of [[1, 2], [8, 3], [4, 9]]) { PG([[x, y + 2], [x + 2, y], [x + 5, y], [x + 6, y + 3], [x + 4, y + 5], [x + 2, y + 5], [x + 3, y + 3], [x + 2, y + 2]], SHRIMP); ps([[x + 3, y + 1], [x + 5, y + 2]], '#e8603a'); p(x + 1, y + 2, OL); } },
  salmon: () => { meatTray(() => { PG([[1, 8], [4, 3], [13, 2], [15, 6], [12, 11], [3, 11]], '#f08a5a'); for (const x of [4, 7, 10]) ln(x, 4, x + 2, 10, '#fbd0b8'); r(2, 10, 11, 1, '#9aa0aa'); }); },
  mussels: () => { for (const [x, y] of [[0, 2], [7, 1]]) { PG([[x, y + 4], [x + 4, y], [x + 8, y + 3], [x + 6, y + 7], [x + 2, y + 7]], '#2a3a5a'); ln(x + 2, y + 4, x + 6, y + 2, '#5a7a9a'); } OV(3, 8, 10, 7, '#2a3a5a'); ov(4, 9, 8, 5, '#f6d8a8'); OV(6, 10, 4, 3, '#f0a050'); },
  garlic: () => { OV(2, 5, 12, 10, '#f6f0e0'); PG([[7, 1], [9, 1], [10, 6], [6, 6]], '#f6f0e0'); ln(8, 6, 8, 14, '#d8c8d8'); ln(5, 7, 4, 13, '#c8a8c8'); ln(11, 7, 12, 13, '#c8a8c8'); ps([[7, 15], [8, 15], [9, 15]], '#c8a868'); },
  ginger: () => { OV(1, 6, 9, 7, '#d8b070'); OV(7, 3, 6, 6, '#d8b070'); OV(10, 8, 5, 5, '#c8a060'); OV(3, 3, 4, 4, '#d8b070'); ps([[4, 9], [7, 10], [9, 5], [12, 10]], '#a8804a'); ps([[3, 7], [9, 4]], '#f0d8a0'); },
  chili: () => { PG([[1, 12], [8, 5], [11, 6], [5, 14]], P.red); PG([[6, 14], [12, 6], [15, 8], [10, 15]], '#c8201c'); ps([[9, 4], [10, 3], [13, 5], [14, 4]], GRN); ps([[4, 10], [10, 11]], '#ff9a80'); },
  herbs: () => { for (const [x, y] of [[1, 3], [5, 1], [9, 2], [3, 6], [8, 6]]) OV(x, y, 6, 5, [LEAF, '#3a8a3a', LEAF, '#3a8a3a', '#6ac05a'][(x + y) % 5]); r(6, 10, 4, 5, '#3a7a2a'); r(5, 11, 6, 2, '#c8a060'); ps([[3, 4], [7, 2], [11, 4]], '#a8dc7a'); },
  spring_onion: () => { for (const x of [3, 6, 9]) { PG([[x, 8], [x + 4, 0], [x + 5, 1], [x + 2, 9]], x === 6 ? '#3a8a3a' : LEAF); R(x - 1, 8, 3, 7, '#fbf8f0'); } r(1, 9, 12, 2, '#c84a8a'); },
  spinach: () => { for (const [x, y] of [[0, 5], [5, 2], [9, 5], [3, 8], [8, 9]]) { OV(x, y, 7, 6, '#2f7a34'); ln(x + 3, y + 1, x + 3, y + 4, '#6ac05a'); } },
  bell_pepper: () => { OV(1, 4, 8, 11, P.red); OV(7, 4, 8, 11, '#d8281c'); OV(4, 5, 8, 10, '#e8402a'); r(7, 1, 2, 4, GRN); ps([[4, 7], [4, 8], [5, 6]], '#ff9a80'); },
  cucumber: () => { PG([[1, 12], [10, 2], [14, 4], [15, 7], [6, 15], [2, 15]], '#3a8a3a'); ln(4, 12, 12, 4, '#6ac05a'); ps([[6, 12], [9, 9], [12, 7]], '#2a6a2a'); OV(0, 11, 5, 5, '#a8dc7a'); p(2, 13, '#e8f4c8'); },
  cabbage: () => { OV(1, 2, 14, 13, '#a8d47a'); OV(3, 4, 10, 10, '#c8e89a'); ln(8, 4, 8, 13, '#e8f4c8'); ln(8, 8, 4, 5, '#e8f4c8'); ln(8, 9, 12, 6, '#e8f4c8'); ps([[2, 9], [14, 8], [5, 13]], '#7ab850'); },
  broccoli: () => { R(6, 9, 4, 6, '#a8c870'); blobs([[1, 3], [5, 1], [9, 2], [3, 6], [8, 6]], '#2f8a34', 6, 5); ps([[3, 4], [7, 2], [11, 4], [6, 7], [10, 8]], '#6ac05a'); },
  avocado: () => { PG([[8, 1], [12, 5], [13, 11], [10, 15], [6, 15], [3, 11], [4, 5]], '#3a5a2a'); PG([[8, 3], [11, 6], [11, 11], [9, 13], [7, 13], [5, 11], [5, 6]], AVO); OV(6, 8, 4, 4, '#8a5a2a'); p(7, 9, '#b88a5a'); },
  pumpkin: () => { OV(0, 4, 16, 11, '#e8862a'); OV(4, 4, 8, 11, '#f09a3a'); ln(4, 6, 3, 13, '#c8641a'); ln(11, 6, 12, 13, '#c8641a'); ln(8, 5, 8, 14, '#c8641a'); r(7, 1, 2, 4, '#5a7a2a'); },
  peas: () => { bag('#2f9e44', () => { r(4, 6, 8, 7, '#fbf8f0'); OV(5, 8, 6, 3, '#5fb84f'); ps([[6, 9], [8, 9], [9, 9]], '#a8e07a'); st([[4, 3], [11, 4]], '#dff0f6'); }); },
  lime: () => { OV(1, 3, 14, 11, '#6ab82a'); p(0, 8, '#6ab82a'); p(15, 8, '#6ab82a'); ps([[4, 5], [5, 5]], '#c8f08a'); ps([[9, 2], [10, 1]], '#3a7a2a'); },
  orange: () => { OV(1, 2, 14, 13, '#f6922a'); ps([[4, 5], [5, 4], [4, 6]], '#fbc878'); ps([[10, 11], [12, 9], [8, 12]], '#d8721a'); r(8, 1, 1, 2, '#5a7a2a'); PG([[9, 1], [12, 0], [12, 2]], LEAF); },
  mango: () => { OV(1, 3, 13, 12, '#f6a82a'); ovIf(1, 3, 13, 12, '#e8482c', (i, j) => i + j < 12); ovIf(1, 3, 13, 12, '#8ac83a', (i, j) => i - j > 5); ps([[4, 6], [5, 5]], '#ff9a80'); r(11, 1, 1, 3, P.brown); },
};

/* ---------- cookbooks & recipe cards ---------- */
const bookI = (c, f) => { R(2, 1, 12, 14, c); r(2, 1, 2, 14, dk(c, .25)); r(4, 13, 10, 1, '#f6ecd0'); r(5, 3, 8, 1, lt(c, .35)); if (f) f(); };
const cardI = (c, f) => { R(1, 3, 14, 11, '#fbf4dc'); r(1, 3, 14, 3, c); r(3, 11, 6, 1, '#c8b890'); r(3, 9, 9, 1, '#c8b890'); if (f) f(); };
const BOOKS = {
  cookbook_student: () => bookI('#f2c230', () => { r(8, 5, 1, 7, PAN); ps([[7, 5], [7, 6], [9, 5], [9, 6]], PAN); r(11, 5, 1, 7, PAN); r(11, 5, 2, 3, PAN); }),
  card_smoothies: () => cardI(PINK, () => { PG([[9, 6], [14, 6], [13, 13], [10, 13]], '#c8407a'); r(12, 3, 1, 4, P.red); }),
  card_picnic: () => cardI('#5fb84f', () => { OV(9, 6, 6, 4, LEAF); PG([[9, 9], [15, 9], [13, 13], [11, 13]], '#f4f0e6'); ps([[11, 7], [13, 8]], TOM); }),
  cookbook_brunch: () => bookI('#f08a2c', () => { OV(5, 5, 8, 7, EGGW); OV(7, 7, 4, 3, YOLK); }),
  cookbook_soups: () => bookI('#c92a2a', () => { R(5, 8, 8, 4, '#3a3644'); r(4, 8, 10, 1, '#5e6676'); st([[7, 6], [8, 5], [10, 6], [11, 5]], '#fbf4dc'); }),
  cookbook_pasta: () => bookI('#2f9e44', () => { OV(5, 5, 8, 7, '#f6d880'); ps([[7, 7], [8, 6], [9, 7], [10, 8], [9, 9], [8, 10], [7, 9]], '#c8922a'); p(8, 8, P.red); }),
  cookbook_wok: () => bookI('#2a2733', () => { PG([[5, 7], [13, 7], [11, 11], [7, 11]], P.red); r(4, 7, 10, 1, '#e8603a'); st([[7, 5], [9, 4], [11, 5]], '#f6a830'); }),
  cookbook_izakaya: () => bookI('#2c3e7a', () => { OV(6, 5, 6, 7, P.red); r(7, 4, 4, 1, PAN); r(7, 12, 4, 1, PAN); ps([[8, 7], [9, 9]], '#f6d24a'); }),
  cookbook_spice: () => bookI('#d8a02a', () => { PG([[5, 10], [10, 5], [12, 6], [8, 12]], '#c8201c'); ps([[11, 4], [12, 4]], '#2f7a34'); ps([[7, 9]], '#ff9a80'); }),
  cookbook_taqueria: () => bookI('#2fa3a0', () => { PG([[5, 7], [13, 7], [12, 10], [10, 12], [8, 12], [6, 10]], '#eab84a'); ps([[6, 6], [8, 5], [10, 6], [12, 5]], LEAF); ps([[7, 6], [11, 6]], TOM); }),
  cookbook_bay: () => bookI('#3b5bdb', () => { spr(5, 6, ['.###..#', '#######', '######.', '.###..#'], { '#': '#dfe6ee' }); p(6, 7, OL); }),
  cookbook_roast: () => bookI('#8a5a36', () => { spr(6, 4, ['..#...', '..##..', '.###..', '.####.', '######', '######', '.####.'], { '#': '#f08a2c' }); ps([[8, 9], [9, 9], [8, 8]], '#f6d24a'); }),
  cookbook_baking: () => bookI('#f2e6c8', () => { r(8, 5, 1, 7, '#c89a3a'); ps([[7, 5], [9, 5], [7, 7], [9, 7], [7, 9], [9, 9], [6, 6], [10, 6], [6, 8], [10, 8]], '#d8a840'); }),
  cookbook_patisserie: () => bookI('#f28fb0', () => { R(6, 8, 6, 4, '#fbf4e4'); r(6, 10, 6, 1, '#c8284a'); R(7, 6, 4, 2, '#fbf4e4'); p(8, 5, BERRY); p(9, 4, '#f6a830'); }),
};

/* ---------- register ---------- */
export const RECIPE_ICONS = {};
for (const [id, body] of Object.entries(MEALS)) RECIPE_ICONS['meal_' + id] = body;
Object.assign(RECIPE_ICONS, ING, BOOKS);
for (const [id, body] of Object.entries(RECIPE_ICONS)) ICONS[id] = icon(body);
export const galleryItems = Object.keys(RECIPE_ICONS).map(id => ({ id: 'icon.' + id, sb: [0, 0, 16, 16], draw: ICONS[id] }));
