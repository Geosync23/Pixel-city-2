// Accessory shapes, batch C (artist C): neck pieces, glasses, bags. API: see wear_acc_ex.js / docs/reports/clothes_drawing.md.
//   neck:    draw(g)  g = { p, yS (shoulder row), L (lean), x0, x1, T, c, front }   torso x0..x1 (-2..2 avg); x = 1 is the chest centre line
//   glasses: draw(g)  g = { p, cx, yb, c, front, sk, EYE }   eyes at cx / cx+2 on rows yb-3 (top) and yb-2; brows on yb-4; mouth (cx+1, yb-1)
//   bag:     back(g)  g = { p, yS, x0, x1, ax, T, c, front, accent } over the body;   hand(g)  g = { p, x, y (hand), c, accent } carried
import { regShape } from './_shapes.js';

const WOOD = '#d9a05a';

/* ---------------- neck ---------------- */
// Infinity scarf / snood: a chunky ribbed loop, two rows deep, sagging into a second loop on the chest.
regShape('neck', 'infinity', { draw(g) {
  const c = g.c, L = g.L, y = g.yS, d = g.dk(c, .2), rib = x => ((x + 8) & 1 ? g.dk(c, .1) : c);
  for (let x = g.x0 - 1; x <= g.x1 + 1; x++) g.p(x + L, y, x < g.x0 + 1 ? d : rib(x));
  if (g.front) { for (let x = g.x0; x <= g.x1; x++) g.p(x + L, y + 1, x === g.x0 ? d : rib(x + 1)); for (let x = 0; x <= Math.min(2, g.x1); x++) g.p(x + L, y + 2, x === 1 ? g.lt(c, .15) : d); g.p(L - 1, y, g.lt(c, .25)); }
  else for (let x = g.x0; x <= g.x1; x++) g.p(x + L, y + 1, d);
} });
// Lanyard: a cord in the item colour down to a white ID card with a coloured stripe.
regShape('neck', 'lanyard', { draw(g) {
  const c = g.c, L = g.L, y = g.yS;
  if (!g.front) { for (let x = -1; x <= 1; x++) g.p(x + L, y, c); return; }
  g.p(L - 1, y, c); g.p(L, y + 1, c); g.p(L + 2, y, c); g.p(L + 2, y + 1, g.dk(c, .2)); g.p(L + 1, y + 2, g.dk(c, .2));
  g.p(L, y + 3, '#f4f0e8'); g.p(L + 1, y + 3, '#f4f0e8'); g.p(L, y + 4, c); g.p(L + 1, y + 4, g.lt(c, .2));
} });
// Pendant: a fine gold chain dipping to a two-pixel drop stone in the item colour.
regShape('neck', 'pendant', { draw(g) {
  const c = g.c, L = g.L, y = g.yS, G = g.GOLD;
  if (!g.front) { g.p(L - 1, y, G); g.p(L + 1, y, G); return; }
  g.p(L - 1, y, G); g.p(L, y + 1, G); if (g.x1 > 1) g.p(L + 2, y + 1, G); g.p(L + 1, y + 2, G); g.p(L + 1, y + 3, c); g.p(L + 1, y + 4, g.dk(c, .3));
} });
// Pearls: a double strand, the lower one hanging a row deeper; highlights alternate so the beads read.
regShape('neck', 'pearls', { draw(g) {
  const c = g.c, L = g.L, y = g.yS, l = g.lt(c, .3), d = g.dk(c, .15);
  if (!g.front) { for (let x = -1; x <= 1; x++) g.p(x + L, y, x & 1 ? d : c); return; }
  for (let x = -1; x <= Math.min(2, g.x1); x++) g.p(x + L, y, x & 1 ? l : c);
  g.p(L - 1, y + 1, d); g.p(L, y + 2, c); g.p(L + 1, y + 2, l); if (g.x1 > 1) { g.p(L + 2, y + 2, c); g.p(L + 2, y + 1, d); }
} });
// Chunky chain: two-pixel links (item colour = the metal) and a 2x2 medallion.
regShape('neck', 'chain', { draw(g) {
  const c = g.c, L = g.L, y = g.yS, d = g.dk(c, .3), l = g.lt(c, .35);
  if (!g.front) { for (let x = -2; x <= 1; x++) g.p(x + L, y, x & 1 ? d : c); return; }
  g.p(L - 1, y, c); g.p(L - 1, y + 1, d); g.p(L, y + 2, c); g.p(L + 2, y, c); if (g.x1 > 1) g.p(L + 2, y + 1, d);
  g.p(L, y + 3, l); g.p(L + 1, y + 3, c); g.p(L, y + 4, c); g.p(L + 1, y + 4, d); g.p(L + 1, y + 2, d);
} });
// Ascot: a puffed silk cravat filling the open collar, dotted, with a gold pin.
regShape('neck', 'ascot', { draw(g) {
  const c = g.c, L = g.L, y = g.yS, d = g.dk(c, .22), l = g.lt(c, .35);
  if (!g.front) { for (let x = -1; x <= 1; x++) g.p(x + L, y, c); return; }
  for (let x = 0; x <= Math.min(2, g.x1); x++) g.p(x + L, y, x === 1 ? l : c);
  g.p(L, y + 1, d); g.p(L + 1, y + 1, g.GOLD); if (g.x1 > 1) g.p(L + 2, y + 1, c); g.p(L + 1, y + 2, c); g.p(L, y + 2, l); g.p(L + 1, y + 3, d);
} });
// Skinny tie: one pixel wide, long (to the belt), knot and a gold tie bar.
regShape('neck', 'skinnytie', { draw(g) {
  const c = g.c, L = g.L, y = g.yS;
  if (!g.front) { g.p(L, y, c); return; }
  g.p(L + 1, y, g.dk(c, .25)); for (let j = 1; j < g.T; j++) g.p(L + 1, y + j, j === g.T - 1 ? g.dk(c, .2) : c);
  g.p(L, y + 2, g.GOLD); g.p(L + 1, y + 2, g.GOLD); if (g.x1 > 1) g.p(L + 2, y + 2, g.GOLD);
} });
// Headphones resting round the neck: two padded cups at the collar bones, the band behind the neck.
regShape('neck', 'neckphones', { draw(g) {
  const c = g.c, L = g.L, y = g.yS, d = g.dk(c, .3), pad = '#33303f';
  if (g.front) { g.p(L - 2, y, d); g.p(L - 2, y + 1, d); g.p(L - 1, y, pad); for (const x of [Math.min(2, g.x1), Math.min(2, g.x1) + 1]) { g.p(L + x, y, x === Math.min(2, g.x1) ? pad : c); g.p(L + x, y + 1, x === Math.min(2, g.x1) ? d : g.lt(c, .2)); } }
  else { for (let x = -1; x <= 1; x++) g.p(x + L, y, d); g.p(L - 2, y, c); g.p(L - 2, y + 1, d); g.p(L + 2, y, c); g.p(L + 2, y + 1, d); }
} });
// Striped knit scarf: wrapped once, one long end down the chest with stripes and a fringe.
regShape('neck', 'stripescarf', { draw(g) {
  const c = g.c, L = g.L, y = g.yS, s = g.lt(c, .45), d = g.dk(c, .2);
  for (let x = g.x0 - 1; x <= g.x1 + 1; x++) g.p(x + L, y, x < g.x0 + 1 ? d : (x & 1 ? s : c));
  if (g.front) { for (let j = 1; j <= 4; j++) { g.p(L + 1, y + j, j & 1 ? c : s); g.p(L + 2, y + j, j & 1 ? d : g.dk(s, .1)); } g.p(L + 1, y + 5, d); g.p(L + 2, y + 5, s); }
  else for (let j = 1; j <= 3; j++) g.p(L - 1, y + j, j & 1 ? c : s);
} });
// Lace collar (detachable Peter-Pan style): a scalloped rounded collar on the shoulders.
regShape('neck', 'lacecollar', { draw(g) {
  const c = g.c, L = g.L, y = g.yS, d = g.dk(c, .14);
  for (let x = g.x0; x <= g.x1; x++) g.p(x + L, y, x === g.x0 ? d : c);
  if (g.front) { g.p(L - 1, y + 1, d); g.p(L, y + 1, c); if (g.x1 > 1) { g.p(L + 2, y + 1, c); } g.p(L + 1, y, g.dk(c, .3)); }
  else for (let x = g.x0 + 1; x <= g.x1 - 1; x += 2) g.p(x + L, y + 1, d);
} });
// Bolo tie: two dark cords from a turquoise-and-silver slide, metal tips.
regShape('neck', 'bolo', { draw(g) {
  const c = g.c, L = g.L, y = g.yS, cord = '#2f2c3a';
  if (!g.front) { for (let x = -1; x <= 1; x++) g.p(x + L, y, cord); return; }
  g.p(L, y, cord); g.p(L + 2, y, cord); g.p(L + 1, y + 1, c); g.p(L + 1, y + 2, '#c8ccd4'); g.p(L, y + 1, '#c8ccd4'); if (g.x1 > 1) g.p(L + 2, y + 1, '#c8ccd4');
  g.p(L + 1, y + 3, cord); g.p(L + 1, y + 4, cord); g.p(L + 1, y + 5, '#c8ccd4');
} });
// Flower lei: a garland of blossoms (item colour, white, gold) with leaf pixels, hanging to the chest.
regShape('neck', 'lei', { draw(g) {
  const c = g.c, L = g.L, y = g.yS, fl = [c, '#f4f0e8', c, '#f0c040', g.lt(c, .3)], lf = '#5aa84f';
  for (let x = g.x0 - 1; x <= g.x1 + 1; x++) g.p(x + L, y, fl[(x + 9) % 5]);
  if (g.front) { g.p(L - 1, y + 1, lf); g.p(L - 1, y + 2, c); g.p(L, y + 3, '#f4f0e8'); g.p(L + 1, y + 3, c); if (g.x1 > 1) { g.p(L + 2, y + 2, fl[3]); g.p(L + 2, y + 1, c); } g.p(L + 1, y + 4, lf); }
  else for (let x = g.x0; x <= g.x1; x++) g.p(x + L, y + 1, (x & 1) ? lf : c);
} });

/* ---------------- glasses ---------------- */
const temple = (g, c) => g.p(g.cx + 3, g.yb - 3, c);
// Square: bold rectangular frames, two rows tall, eyes inside.
regShape('glasses', 'square', { draw(g) {
  const c = g.c || '#33303f'; if (!g.front) return temple(g, c);
  for (const x of [-1, 1, 3]) { g.p(g.cx + x, g.yb - 3, c); g.p(g.cx + x, g.yb - 2, g.dk(c, .15)); } g.p(g.cx - 2, g.yb - 3, c);
  g.p(g.cx, g.yb - 3, '#dff4fa'); g.p(g.cx + 2, g.yb - 3, '#dff4fa'); g.p(g.cx, g.yb - 2, g.EYE); g.p(g.cx + 2, g.yb - 2, g.EYE);
} });
// Wayfarer-style sunglasses: heavy angled top bar in the item colour over dark lenses with a glint.
regShape('glasses', 'wayfarer', { draw(g) {
  const c = g.c || '#22202c', L = '#2a2836'; if (!g.front) return temple(g, c);
  for (let x = -2; x <= 3; x++) g.p(g.cx + x, g.yb - 3, x === 0 || x === 2 ? L : c); g.p(g.cx + 3, g.yb - 4, c); g.p(g.cx - 1, g.yb - 4, c);
  g.p(g.cx, g.yb - 2, L); g.p(g.cx + 2, g.yb - 2, L); g.p(g.cx, g.yb - 3, '#6a6a8a');
} });
// Half-moon reading glasses low on the nose (eyes peek over them) with a chain behind the ear.
regShape('glasses', 'reading', { draw(g) {
  const c = g.c || '#c8a040'; if (!g.front) { g.p(g.cx + 3, g.yb - 2, c); g.p(g.cx + 3, g.yb - 1, g.GOLD); return; }
  for (const x of [-1, 1, 3]) g.p(g.cx + x, g.yb - 2, c); g.p(g.cx, g.yb - 1, c); g.p(g.cx + 2, g.yb - 1, c);
  g.p(g.cx - 2, g.yb - 2, g.GOLD); g.p(g.cx - 2, g.yb - 1, g.GOLD); g.p(g.cx - 2, g.yb, g.GOLD);
} });
// Browline (clubmaster): a heavy bar in the item colour along the brow, thin gold rims below.
regShape('glasses', 'browline', { draw(g) {
  const c = g.c || '#33303f'; if (!g.front) return temple(g, c);
  for (let x = -1; x <= 3; x++) g.p(g.cx + x, g.yb - 4, x === 1 ? g.GOLD : c); g.p(g.cx - 2, g.yb - 3, c);
  for (const x of [-1, 1, 3]) g.p(g.cx + x, g.yb - 3, g.GOLD); g.p(g.cx, g.yb - 3, '#dff4fa'); g.p(g.cx + 2, g.yb - 3, '#dff4fa'); g.p(g.cx, g.yb - 2, g.EYE); g.p(g.cx + 2, g.yb - 2, g.EYE);
} });
// Shield: a single wraparound visor lens (item colour, mirrored highlight) across both eyes.
regShape('glasses', 'shield', { draw(g) {
  const c = g.c || '#5ab0e0'; if (!g.front) { temple(g, c); g.p(g.cx + 3, g.yb - 2, g.dk(c, .2)); return; }
  for (let x = -2; x <= 4; x++) g.p(g.cx + x, g.yb - 3, x < 0 ? g.dk(c, .2) : x < 2 ? g.lt(c, .45) : c);
  for (let x = -1; x <= 3; x++) g.p(g.cx + x, g.yb - 2, g.dk(c, .25)); g.p(g.cx + 1, g.yb - 2, g.sk);
} });
// Oversized round sunglasses: two 2x2 tinted lenses (item colour) with a light rim highlight.
regShape('glasses', 'oversized', { draw(g) {
  const c = g.c || '#3a2a28'; if (!g.front) return temple(g, c);
  for (const x of [-1, 0, 2, 3]) { g.p(g.cx + x, g.yb - 3, c); g.p(g.cx + x, g.yb - 2, g.dk(c, .25)); } g.p(g.cx + 1, g.yb - 3, g.dk(c, .3)); g.p(g.cx - 2, g.yb - 3, g.dk(c, .3));
  g.p(g.cx - 1, g.yb - 3, g.lt(c, .4)); g.p(g.cx + 2, g.yb - 3, g.lt(c, .4));
} });
// Novelty star glasses: big star points round each eye (eyes stay visible), a gold glint.
regShape('glasses', 'star', { draw(g) {
  const c = g.c || '#f07aa8'; if (!g.front) return temple(g, c);
  g.p(g.cx, g.yb - 5, c); g.p(g.cx + 2, g.yb - 5, c); for (let x = -1; x <= 3; x++) g.p(g.cx + x, g.yb - 4, x === 1 ? g.lt(c, .3) : c);
  for (const x of [-2, -1, 1, 3, 4]) g.p(g.cx + x, g.yb - 3, x === -2 || x === 4 ? g.lt(c, .2) : c); g.p(g.cx - 1, g.yb - 1, c); g.p(g.cx + 3, g.yb - 1, c);
  g.p(g.cx, g.yb - 3, '#dff4fa'); g.p(g.cx + 2, g.yb - 3, '#dff4fa'); g.p(g.cx, g.yb - 2, g.EYE); g.p(g.cx + 2, g.yb - 2, g.EYE); g.p(g.cx - 1, g.yb - 4, g.GOLD);
} });
// Ski / snow goggles: one big mirrored lens (item colour) in a dark frame on a strap.
regShape('glasses', 'goggles', { draw(g) {
  const c = g.c || '#f09a3a', f = '#33303f'; if (!g.front) { for (let x = -3; x <= 3; x++) g.p(g.cx + x, g.yb - 3, f); return; }
  for (let x = -1; x <= 3; x++) { g.p(g.cx + x, g.yb - 4, f); g.p(g.cx + x, g.yb - 3, x === 1 ? g.dk(c, .2) : x < 1 ? g.lt(c, .35) : c); g.p(g.cx + x, g.yb - 2, x === 1 ? f : g.dk(c, .2)); }
  g.p(g.cx - 2, g.yb - 3, f); g.p(g.cx - 3, g.yb - 3, f); g.p(g.cx + 4, g.yb - 3, f);
} });

/* ---------------- bags ---------------- */
// Crossbody: a small zipped pouch worn on the FRONT of the hip, strap across the chest.
regShape('bag', 'crossbody', { back(g) {
  const c = g.c, n = g.T - 2, y = g.yS + g.T - 2, a = g.accent || g.lt(c, .4);
  for (let j = 0; j <= n; j++) g.p(g.front ? g.x1 - Math.round(j * (g.x1 - g.x0) / n) : g.x0 + Math.round(j * (g.x1 - g.x0) / n), g.yS + j, g.dk(c, .35));
  if (g.front) { for (let x = -1; x <= 1; x++) { g.p(x, y, g.lt(c, .15)); g.p(x, y + 1, x === -1 ? g.dk(c, .15) : c); g.p(x, y + 2, g.dk(c, .2)); } g.p(0, y + 1, a); }
  else { g.p(g.x1 + 1, y + 1, c); g.p(g.x1 + 1, y + 2, g.dk(c, .2)); }
} });
// Satchel: a boxy flap bag carried by its top handle, two gold buckles.
regShape('bag', 'satchel', { hand(g) {
  const c = g.c, d = g.dk(c, .3); g.p(g.x - 1, g.y + 1, d); g.p(g.x + 1, g.y + 1, d); g.p(g.x, g.y, d);
  for (let j = 0; j < 4; j++) for (let i = -1; i <= 2; i++) g.p(g.x + i, g.y + 2 + j, j < 2 ? (i === -1 ? g.dk(c, .25) : g.dk(c, .12)) : i === -1 ? g.dk(c, .15) : c);
  g.p(g.x, g.y + 3, g.GOLD); g.p(g.x + 2, g.y + 3, g.GOLD); g.p(g.x + 1, g.y + 5, g.lt(c, .2));
} });
// Clutch: a slim envelope held in the hand, a flap line and a clasp in the accent colour.
regShape('bag', 'clutch', { hand(g) {
  const c = g.c, a = g.accent || g.GOLD;
  for (let i = -2; i <= 2; i++) { g.p(g.x + i, g.y, i === -2 ? g.dk(c, .2) : g.lt(c, .1)); g.p(g.x + i, g.y + 1, i === -2 ? g.dk(c, .25) : Math.abs(i) === 1 ? g.dk(c, .15) : c); }
  g.p(g.x, g.y + 1, a);
} });
// Drawstring gym sack: thin cords over the shoulders, a soft sack on the back with a logo patch.
regShape('bag', 'drawstring', { back(g) {
  const c = g.c, cord = g.dk(c, .45), a = g.accent || g.lt(c, .45);
  if (g.front) { for (let j = 0; j < g.T - 1; j++) { g.p(g.x0 + 1, g.yS + j, cord); g.p(g.ax[0] - 1, g.yS + 1 + j, j === 0 ? g.lt(c, .2) : c); } g.p(g.x1, g.yS, cord); g.p(g.x1, g.yS + 1, cord); }
  else {
    for (let j = 0; j < g.T - 1; j++) for (let x = -2; x <= 1; x++) g.p(x, g.yS + j, j === 0 ? g.dk(c, .2) : x === -2 ? g.dk(c, .15) : c);
    g.p(-2, g.yS - 1, cord); g.p(1, g.yS - 1, cord); g.p(-1, g.yS + 2, a); g.p(0, g.yS + 2, a); g.p(-2, g.yS + g.T - 1, cord); g.p(1, g.yS + g.T - 1, cord);
  }
} });
// Paper shopping bag: tall, string handles, a printed logo square in the accent colour.
regShape('bag', 'shopper', { hand(g) {
  const c = g.c, a = g.accent || g.dk(c, .5);
  g.p(g.x - 1, g.y + 1, '#33303f'); g.p(g.x + 1, g.y + 1, '#33303f'); g.p(g.x, g.y, '#33303f');
  for (let j = 0; j < 5; j++) for (let i = -1; i <= 2; i++) g.p(g.x + i, g.y + 2 + j, j === 0 ? g.lt(c, .25) : i === -1 ? g.dk(c, .18) : c);
  g.p(g.x + 1, g.y + 4, a); g.p(g.x + 1, g.y + 5, a); g.p(g.x, g.y + 4, a);
} });
// Sling bag: strap over the shoulder and a pill-shaped pouch riding high on the CHEST, zip highlight.
regShape('bag', 'sling', { back(g) {
  const c = g.c, n = g.T - 2, a = g.accent || g.lt(c, .45);
  for (let j = 0; j <= n; j++) g.p(g.front ? g.x0 + Math.round(j * (g.x1 - g.x0) / n) : g.x1 - Math.round(j * (g.x1 - g.x0) / n), g.yS + j, g.dk(c, .35));
  if (g.front) { for (let x = -1; x <= Math.min(2, g.x1); x++) { g.p(x, g.yS + 1, x === -1 ? g.dk(c, .2) : g.lt(c, .1)); g.p(x, g.yS + 2, x === -1 ? g.dk(c, .25) : c); } g.p(0, g.yS + 1, a); g.p(1, g.yS + 1, a); }
  else { for (let x = -1; x <= 1; x++) { g.p(x, g.yS + 1, c); g.p(x, g.yS + 2, g.dk(c, .2)); } }
} });
// Wicker market basket: woven checker body, arched handle, a baguette and greens poking out.
regShape('bag', 'basket', { hand(g) {
  const c = g.c, d = g.dk(c, .25);
  g.p(g.x - 1, g.y, d); g.p(g.x + 2, g.y, d); g.p(g.x, g.y - 1, d); g.p(g.x + 1, g.y - 1, d);
  for (let j = 0; j < 3; j++) for (let i = -2; i <= 2; i++) g.p(g.x + i, g.y + 2 + j, j === 0 ? g.lt(c, .2) : ((i + j) & 1) ? d : c);
  g.p(g.x - 1, g.y + 1, WOOD); g.p(g.x - 2, g.y, WOOD); g.p(g.x - 2, g.y + 1, g.dk(WOOD, .2)); g.p(g.x + 1, g.y + 1, '#5aa84f'); g.p(g.x + 2, g.y + 1, '#d9483b');
} });
// Guitar case slung on the back: the neck rises past the shoulder, the body hangs to the thigh.
regShape('bag', 'guitarcase', { back(g) {
  const c = g.c, d = g.dk(c, .25), l = g.lt(c, .2), y = g.yS, T = g.T;
  if (g.front) {
    const x = g.ax[0] - 1; for (let j = -4; j < 0; j++) g.p(x - 1, y + j, j === -4 ? g.dk(c, .35) : c);
    for (let j = 0; j < T + 2; j++) { g.p(x, y + j, j < 2 ? c : l); if (j >= 2) g.p(x - 1, y + j, d); }
    for (let j = 0; j <= T - 2; j++) g.p(g.x1 - Math.round(j * (g.x1 - g.x0) / (T - 2)), y + j, '#33303f');
  } else {
    for (let j = -4; j < 1; j++) { g.p(-1, y + j, j === -4 ? g.dk(c, .35) : c); g.p(0, y + j, d); }
    for (let j = 1; j < T + 3; j++) for (let x = -2; x <= 1; x++) g.p(x, y + j, x === -2 ? d : j === 1 ? l : c);
    g.p(-1, y + 3, g.accent || g.GOLD); g.p(0, y + T + 2, d); g.p(-1, y + T + 2, d);
  }
} });
// Roll-top backpack: tall pack, the rolled top (accent colour) above the shoulders, a buckle strap down the front.
regShape('bag', 'rolltop', { back(g) {
  const c = g.c, d = g.dk(c, .2), a = g.accent || g.lt(c, .35), y = g.yS, T = g.T;
  if (g.front) {
    for (let j = 0; j < T - 1; j++) { g.p(g.x0 + 1, y + j, g.dk(c, .3)); g.p(g.x1, y + j, g.dk(c, .3)); g.p(g.ax[0] - 1, y + j, j === T - 2 ? d : c); }
    g.p(g.ax[0] - 1, y - 1, a); g.p(g.ax[0], y - 1, g.dk(a, .2)); g.p(g.x0 + 1, y + 2, '#c8ccd4');
  } else {
    for (let j = 0; j < T; j++) for (let x = -2; x <= 2 && x <= g.x1; x++) g.p(x, y + j, x === -2 ? d : c);
    for (let x = -2; x <= Math.min(2, g.x1); x++) { g.p(x, y - 1, a); g.p(x, y, g.dk(a, .2)); }
    for (let j = 1; j < T - 1; j++) g.p(0, y + j, g.dk(c, .35)); g.p(0, y + 2, '#c8ccd4'); g.p(-1, y + T - 2, g.lt(c, .3));
  }
} });
