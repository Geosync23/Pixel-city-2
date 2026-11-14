// World-cuisine dishes (gen_*) and Beacon Tower menu (sky_*): icons keyed by exact item id.
// Built from a few parametric painters (bowl, taco, stack, tallGlass, boba, donut, teapot ...), exported for reuse.
import { P, OL, r, R, ov, OV, pg, PG, p, ps, ln, st, sl, spr, clr, steam, sparkle, dk, lt } from './_lib.js';
import { plate, bowlBody, mug, paperCup, glass } from './food.js';

/* ---------- painters ---------- */
/** bowl seen from the side: top = contents colour, f = toppings drawn on the surface (rows 3..6) */
export const bowl = (body, top, f, y = 7) => { ov(1, y - 3, 14, 6, top); if (f) f(); bowlBody(body, y); };
/** folded taco, shell top-left at x,y (w wide, 6 tall incl. filling above) */
export const taco = (x, y, w = 9, shell = '#eab84a') => {
  for (let i = 1; i < w - 1; i++) p(x + i, y - 1 - (i % 3 === 1 ? 1 : 0), [P.leaf, '#c8562a', P.tomato][i % 3]);
  PG([[x, y], [x + w, y], [x + w - 1, y + 3], [x + w - 3, y + 5], [x + 3, y + 5], [x + 1, y + 3]], shell);
};
/** layered stack (sandwich/cake): layers [[colour, h, inset]] from y downwards */
export const stack = (y, layers, x = 2, w = 12) => { for (const [c, h, ins = 0] of layers) { R(x + ins, y, w - 2 * ins, h, c); y += h; } };
/** domed bun top */
export const bunTop = (c, y = 2, x = 1, w = 14, h = 5) => { OV(x, y, w, h * 2 - 2, c); clr(x, y + h, w, h); };
/** tall glass of liquid with extras: o.ice, o.straw colour, o.slice colour (rim garnish), o.foam colour, o.flecks colour, o.layer [colour, y] */
export const tallGlass = (liquid, o = {}) => {
  glass(liquid, o.top || 4);
  if (o.layer) { PG([[3.6, o.layer[1]], [12.4, o.layer[1]], [12, 14.5], [4, 14.5]], o.layer[0]); }
  if (o.foam) r(4, (o.top || 4) - 1, 8, 2, o.foam);
  if (o.ice) { r(6, 6, 2, 2, '#eefaff'); r(9, 9, 2, 2, '#eefaff'); r(6, 11, 2, 2, '#eefaff'); }
  if (o.flecks) ps([[5, 6], [9, 7], [7, 9], [10, 11], [6, 12], [10, 5]], o.flecks);
  if (o.straw) { r(9, 0, 1, 8, o.straw); p(10, 0, o.straw); }
  if (o.slice) { OV(10, 0, 5, 5, o.slice); p(12, 2, lt(o.slice, .5)); }
  if (o.leaf) ps([[5, 2], [6, 1], [6, 2], [7, 2], [5, 1]], P.leaf);
};
/** bubble-tea cup */
export const boba = (tea, pearl, straw) => {
  PG([[3, 4], [13, 4], [12, 15], [4, 15]], '#e6f2f6'); PG([[3.4, 6], [12.6, 6], [12, 14.6], [4, 14.6]], tea);
  ps([[5, 13], [7, 12], [9, 13], [11, 12], [6, 11], [10, 10], [8, 14], [5, 9]], pearl);
  R(2, 3, 12, 2, '#f4f6fa'); r(8, 0, 2, 10, straw);
};
/** ring donut seen from above */
export const donut = (x, y, w, glaze, dough = '#d89a52') => {
  OV(x, y + 1, w, w - 1, dough); OV(x, y, w, w - 2, glaze);
  const m = x + Math.floor(w / 2) - 1, n = y + Math.floor(w / 2) - 2; r(m, n, 2, 2, OL);
};
export const teapot = (c, x = 2, y = 3, lid) => {
  PG([[x - 2, y + 3], [x, y + 3], [x + 2, y + 6], [x + 2, y + 8], [x, y + 6]], c);
  r(x + 10, y + 3, 2, 1, c); r(x + 11, y + 4, 1, 4, c); r(x + 10, y + 8, 2, 1, c);
  OV(x + 1, y + 1, 10, 10, c); R(x + 3, y, 6, 2, lid || dk(c, .2)); r(x + 5, y - 1, 2, 1, lid || dk(c, .2));
};
export const dumpling = (x, y, c = '#f6efdc') => { OV(x, y, 6, 4, c); ps([[x + 1, y], [x + 3, y], [x + 5, y]], dk(c, .22)); };
export const triangle = (x, y, w, c) => { PG([[x + w / 2, y], [x + w, y + w * .8], [x, y + w * .8]], c); p(x + Math.floor(w / 2), y + Math.floor(w / 2), dk(c, .3)); };
export const steamer = () => { R(1, 8, 14, 7, '#d8a868'); r(1, 10, 14, 1, '#a8743a'); r(1, 13, 14, 1, '#a8743a'); ov(1, 4, 14, 6, '#e8c48a'); ov(2, 5, 12, 4, '#f4e2b8'); };
export const softCone = (c = '#d8a052') => { PG([[4, 9], [12, 9], [8.6, 16], [7.4, 16]], c); ln(5, 10, 8, 13, dk(c, .25)); ln(11, 10, 8, 13, dk(c, .25)); };
const bagel = (fill) => { bunTop('#d89448', 1); ps([[4, 2], [7, 1], [10, 2], [12, 4], [3, 4]], '#f6e6c0'); fill(); R(1, 11, 14, 4, '#c8843a'); };

const RICE = '#f8f4ea', BROTH = '#c89a5a';
export const WORLD = {
  gen_taco_pastor: () => { taco(0, 4); r(11, 1, 3, 3, P.yellow); p(12, 0, P.leaf); taco(6, 10); },
  gen_burrito_bowl: () => bowl('#e9dcc0', RICE, () => { OV(2, 4, 5, 3, '#7a4a2e'); OV(9, 4, 5, 3, P.tomato); ps([[7, 4], [8, 5], [7, 6]], P.leaf); r(6, 3, 3, 1, P.yellow); }),
  gen_agua_fresca: () => tallGlass('#f27a9a', { ice: 1, slice: P.lime, straw: P.white }),
  gen_pho: () => bowl('#f4f0e6', BROTH, () => { for (let i = 0; i < 5; i++) sl(2 + i * 2, 5, 4 + i * 2, 6, '#f6ecd0'); OV(2, 3, 5, 3, '#e08a7a'); ps([[9, 3], [10, 4], [11, 3], [12, 4], [10, 2]], P.leaf); p(8, 5, P.red); steam(6, 0); r(1, 9, 14, 1, P.blue); }),
  gen_banh_mi: () => { OV(0, 3, 16, 7, '#dca058'); ps([[3, 4], [6, 4], [9, 4], [12, 4]], '#f6d8a0'); r(1, 8, 14, 2, '#f6efdc'); for (let i = 0; i < 7; i++) p(1 + i * 2, 8, [P.orange, P.leaf, '#e88a8a'][i % 3]); ps([[2, 7], [6, 7], [10, 7], [13, 7]], P.leaf); R(0, 10, 16, 4, '#c8843a'); },
  gen_viet_coffee: () => { tallGlass('#4a2a18', { top: 3, layer: ['#f4e6c8', 11], ice: 1 }); r(4, 10, 8, 1, '#a87a4a'); },
  gen_falafel_wrap: () => { OV(3, 0, 5, 5, '#7a9a3a'); OV(8, 1, 5, 5, '#8aa844'); ps([[5, 1], [10, 2]], '#b8cc6a'); ps([[2, 4], [13, 5], [7, 5]], P.tomato); PG([[1, 5], [15, 5], [12, 15], [5, 15]], '#ecd6a4'); PG([[3.6, 10], [13.4, 10], [12, 15], [5, 15]], '#cfd6de'); ln(5, 11, 11, 13, '#f4f6fa'); },
  gen_hummus_plate: () => { plate('#3b7ea8'); OV(1, 6, 10, 7, '#ecd49a'); ov(3, 8, 5, 3, '#f6e4b4'); p(5, 9, P.gold); p(6, 9, '#c8862a'); p(8, 7, P.crimson); PG([[9, 2], [16, 4], [13, 10]], '#e8c48a'); ps([[12, 5], [13, 7]], '#c89a5a'); },
  gen_mint_lemonade: () => tallGlass('#f4e66a', { flecks: P.green, ice: 1, leaf: 1, slice: P.lemon }),
  gen_dimsum_basket: () => { steamer(); dumpling(2, 4); dumpling(8, 4); dumpling(5, 6, '#f6dcd0'); steam(6, 0); },
  gen_pork_bao: () => { plate(); OV(0, 5, 9, 8, '#fbf7ee'); OV(7, 3, 9, 8, '#f6efe2'); ps([[4, 6], [3, 7], [5, 7], [11, 4], [10, 5], [12, 5]], '#cfc4ae'); },
  gen_gyoza: () => { plate('#3a3644'); for (let i = 0; i < 3; i++) { OV(i * 5, 6 - (i & 1), 6, 6, '#f2dcae'); r(i * 5 + 1, 6 - (i & 1), 4, 2, '#c8843a'); } R(11, 11, 4, 3, P.white); r(12, 11, 2, 1, '#4a2a18'); },
  gen_injera_platter: () => { OV(0, 1, 16, 14, '#c9a57c'); ps([[3, 4], [12, 3], [13, 11], [3, 11], [8, 2]], '#a8845a'); OV(2, 5, 5, 4, P.crimson); OV(9, 4, 5, 4, P.gold); OV(8, 9, 5, 4, P.green); OV(3, 10, 4, 3, P.orange); OV(6, 7, 3, 3, '#f6efe2'); },
  gen_sambusa: () => { plate(); triangle(2, 1, 12, '#e0a040'); ps([[6, 5], [9, 6], [7, 8]], '#f6d47a'); r(12, 11, 3, 2, P.crimson); },
  gen_samosa: () => { plate(); triangle(0, 3, 9, '#d89a3a'); triangle(7, 2, 9, '#e8aa44'); OV(6, 11, 4, 3, P.leaf); },
  gen_kbbq_set: () => { st([[4, 2], [5, 1], [4, 0], [10, 2], [11, 1], [10, 0]], '#cfd6de'); OV(0, 4, 16, 7, '#4a4458'); ov(2, 5, 12, 5, '#2f2c3a'); for (let i = 0; i < 4; i++) r(3 + i * 3, 5, 1, 5, '#6a6478'); R(3, 6, 4, 2, '#c8503a'); R(9, 7, 4, 2, '#a85a3a'); p(4, 6, '#f6c8b0'); r(7, 5, 2, 1, P.leaf); R(4, 11, 8, 3, P.slate); ps([[6, 14], [9, 14], [7, 15], [8, 14]], P.orange); },
  gen_bibimbap: () => bowl('#3a3644', RICE, () => { r(2, 5, 3, 2, P.orange); r(11, 5, 3, 2, P.leaf); r(4, 3, 3, 2, '#7a4a2e'); r(9, 3, 3, 2, P.crimson); OV(5, 4, 6, 4, P.white); ov(7, 5, 2, 2, '#f6b830'); }),
  gen_soul_plate: () => { plate(); OV(1, 3, 9, 7, '#d8923a'); ps([[3, 4], [6, 5], [4, 7], [7, 7]], '#f2c06a'); r(9, 8, 3, 2, '#f6efe2'); OV(9, 3, 6, 5, P.green); ps([[10, 4], [13, 5]], P.leaf); R(10, 9, 5, 4, '#f2c84a'); },
  gen_mac_cheese: () => { ov(1, 2, 14, 7, '#f2b83a'); ps([[3, 4], [6, 3], [9, 4], [12, 5], [5, 6], [10, 6], [7, 5]], '#c8782a'); ps([[4, 5], [8, 3], [11, 4]], '#fde08a'); PG([[0, 6], [16, 6], [14, 14], [2, 14]], '#c94a3a'); r(0, 6, 16, 1, lt('#c94a3a', .3)); for (let i = 0; i < 6; i++) r(2 + i * 2 + 1, 8, 1, 5, dk('#c94a3a', .2)); },
  gen_sweet_tea: () => { R(3, 4, 10, 11, '#dff0f6'); r(4, 6, 8, 8, '#c8782a'); r(4, 6, 8, 1, '#e8a04a'); r(6, 9, 2, 2, '#f6d8a0'); R(4, 1, 8, 3, P.steel); r(13, 6, 2, 1, '#dff0f6'); r(14, 7, 1, 3, '#dff0f6'); r(13, 10, 2, 1, '#dff0f6'); OV(0, 1, 5, 5, P.lemon); p(2, 3, '#fffad0'); },
  gen_bagel_lox: () => bagel(() => { r(1, 7, 14, 2, P.white); r(0, 9, 16, 2, '#f08a6a'); ps([[3, 9], [7, 10], [11, 9]], '#f6b49a'); ps([[5, 8], [10, 8]], P.green); }),
  gen_bagel_egg: () => bagel(() => { r(0, 7, 16, 2, '#f8d84a'); ps([[2, 9], [3, 9], [13, 9]], '#f8d84a'); r(1, 9, 14, 2, P.orange); ps([[4, 11], [11, 11]], P.orange); }),
  gen_drip_coffee: () => { paperCup(P.white, '#3a3644', P.teal); r(7, 9, 2, 2, P.white); steam(6, -1, '#b9c4d6'); },
  gen_curry_rice: () => { plate(); OV(0, 4, 10, 8, '#a8642a'); ps([[2, 6], [5, 8]], P.orange); ps([[4, 6], [6, 9]], '#e8c88a'); p(3, 9, P.leaf); OV(7, 3, 9, 8, RICE); ps([[13, 9], [14, 8], [13, 8]], P.crimson); },
  gen_mango_lassi: () => tallGlass('#f6b040', { foam: '#fff4dc', straw: P.green }),
  gen_hotpot: () => { steam(3, 0); steam(9, 1); R(1, 7, 14, 7, P.steel); r(0, 8, 1, 2, P.slate); r(15, 8, 1, 2, P.slate); ov(1, 4, 14, 6, '#d8382c'); for (let y = 4; y < 10; y++) for (let x = 8; x < 15; x++) if (((x - 7.5) / 7) ** 2 + ((y - 6.5) / 3) ** 2 <= 1.08) p(x, y, '#f4e6c8'); r(7, 4, 1, 6, P.slate); ps([[3, 6], [5, 7]], '#f6b830'); ps([[10, 6], [12, 7]], P.leaf); p(4, 5, P.leaf); p(11, 5, '#f2a88a'); R(4, 14, 8, 2, P.dark); },
  gen_pastrami: () => { r(8, 0, 1, 3, P.wood); OV(6, 0, 4, 3, P.leaf); stack(3, [['#b8834a', 2], ['#d8607a', 2, -1], ['#b84a5a', 1], ['#e87a8a', 2, -1], ['#f2c84a', 1], ['#d8607a', 2, -1], ['#b8834a', 2]]); ps([[4, 3], [9, 3], [6, 13], [11, 13]], '#8a5a2e'); },
  gen_fish_chips: () => { for (let i = 0; i < 5; i++) r(2 + i * 2, 1 + (i & 1), 1, 7, '#f6d24a'); OV(6, 2, 8, 6, '#dc9a3a'); ps([[8, 3], [11, 4]], '#f6c870'); PG([[1, 7], [15, 7], [9, 16], [7, 16]], '#f4f0e6'); ln(4, 8, 7, 14, P.red); ln(8, 8, 8, 14, P.red); ln(12, 8, 9, 14, P.red); },
  gen_chowder: () => { mug('#3b7ea8', '#f6efd8', 5); ps([[5, 5], [8, 6]], P.leaf); R(3, 1, 4, 3, '#e8c88a'); R(8, 0, 4, 3, '#e8c88a'); ps([[4, 2], [9, 1], [10, 1]], '#b8905a'); },
  gen_boba: () => boba('#d8a878', '#2f2430', P.crimson),
  gen_taro_boba: () => boba('#b890d8', '#5a3a7a', P.pink),
  gen_soft_serve: () => { softCone(); OV(3, 6, 10, 4, '#fbf7ee'); OV(4, 3, 8, 4, '#fbf7ee'); OV(6, 1, 5, 3, '#fbf7ee'); p(9, 0, '#fbf7ee'); p(5, 4, P.white); },
  gen_donut: () => { donut(1, 1, 14, '#f2c078'); ps([[4, 3], [5, 3], [4, 4]], '#fff4dc'); },
  gen_donut_box: () => { PG([[0, 1], [16, 1], [14, 7], [2, 7]], '#f6b0c8'); R(0, 7, 16, 8, '#f28fb0'); r(1, 8, 14, 5, '#fbe6ec'); donut(1, 7, 6, '#f6d24a'); donut(6, 8, 6, '#6b3f2a'); donut(10, 7, 6, '#f08ab0'); r(5, 3, 6, 2, P.white); },
  gen_fresh_juice: () => tallGlass(P.orange, { slice: '#f6a030', top: 3 }),
  gen_smoothie: () => { PG([[3, 4], [13, 4], [12, 15], [4, 15]], '#e6f2f6'); PG([[3.4, 5], [12.6, 5], [12, 14.6], [4, 14.6]], '#7cc04a'); ps([[5, 7], [9, 10], [6, 12]], '#a8dc7a'); OV(3, 1, 10, 4, '#f4f6fa'); r(9, 0, 1, 8, P.orange); p(10, 0, P.orange); },
  gen_pretzel: () => { spr(1, 2, ['..###..###..', '.##.####.##.', '##...##...##', '##..####..##', '##.##..##.##', '.###....###.', '.###....###.', '##.##..##.##', '#...####...#', '##...##...##', '.##########.'], { '#': '#b8702e' }, { shade: true }); ps([[3, 4], [10, 4], [6, 6], [4, 9], [9, 10], [7, 12]], P.white); },
  gen_tea_pot: () => { teapot('#3a4450', 2, 2, '#5a6676'); p(6, 5, '#7a8696'); R(10, 11, 5, 4, '#e8e2d4'); r(11, 11, 3, 1, '#a8c44a'); },
  gen_matcha_latte: () => { mug(P.white, '#9cc85a', 4); ps([[6, 4], [7, 5], [8, 4], [7, 4]], '#e8f4c8'); steam(5, 0, '#b9c4d6'); },
  gen_mochi: () => { R(0, 11, 16, 3, '#7a4a2e'); OV(0, 6, 6, 6, '#f6b0c8'); OV(5, 5, 6, 6, '#bfe0a0'); OV(10, 6, 6, 6, '#fbf7ee'); ps([[1, 7], [6, 6], [11, 7]], P.white); },
  sky_cloud_latte: () => { mug('#6fb3e0', '#d8a878', 6); OV(1, 2, 6, 5, P.white); OV(4, 0, 7, 6, P.white); OV(8, 2, 5, 5, P.white); sparkle(13, 2); },
  sky_sunset_spritz: () => { tallGlass('#f6a030', { layer: ['#e8483a', 10], ice: 1, slice: P.orange, straw: P.navy }); },
  sky_high_tea: () => { r(7, 1, 2, 14, P.gold); p(7, 0, P.gold); p(8, 0, P.gold); R(5, 4, 6, 1, P.white); R(3, 9, 10, 1, P.white); R(1, 14, 14, 1, P.white); R(5, 2, 2, 2, P.pink); R(9, 2, 2, 2, P.lemon); R(3, 7, 3, 2, '#6b3f2a'); R(10, 7, 3, 2, P.pink); R(1, 12, 4, 2, '#f2dcae'); R(11, 12, 4, 2, P.mint); p(2, 11, P.red); p(12, 11, P.red); },
};
/** ids that reuse an existing dish drawing */
export const WORLD_ALIAS = {};
