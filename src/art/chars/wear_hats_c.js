// Headwear shapes, batch C (artist C). API: see wear_hats_ex.js / docs/reports/clothes_drawing.md.
// Rows: 0 = chin, 4 = brow, 5 = forehead, 6 = top of the skull, 7+ above. x -3..3 is the head; +x is the face side in the front view.
// Hats that must hide the hair entirely (hijabs) paint over the wearer's hair silhouette (hair_lookup.js) since the engine only cuts rows >= 6.
import { regShape } from './_shapes.js';
import { hairPx, hairTop } from './hair_lookup.js';

const P = (g, x, r, c) => g.p(g.cx + x, g.yb - r, c);
const top = g => Math.min(8, hairTop(g.k.hair, g.front)); // where a headband-type piece sits on this hairstyle

/** paint every hair pixel at or below row `rmax` that sits outside the face opening with colour fn(x, r) (hijab-type cover) */
function coverHair(g, rmax, fn) {
  for (const [x, r] of hairPx(g.k.hair, g.front)) {
    if (r > rmax) continue;
    if (g.front && x >= -1 && r >= 1 && r <= 4) { // inside the face opening: put the face back
      P(g, x, r, x === -1 && r === 3 ? '#f6efe6' : g.k.skin); if (r === 4 && (x === 0 || x === 2) && !g.k.kid) P(g, x, r, g.mix(g.dk(g.k.skin, .35), g.k.hairC, .45));
      continue;
    }
    P(g, x, r, fn(x, r));
  }
}

// Trucker cap: tall foam front panel (band colour) with a patch, mesh back half, curved brim.
regShape('hat', 'trucker', { draw(g) {
  const c = g.c, f = g.band || '#f4f0e8', m = g.dk(c, .32), a = g.accent || g.dk(f, .4);
  g.R(-2, 2, 8, c); g.R(-3, 3, 7, c); g.R(-3, 3, 6, c); g.R(-3, 3, 5, g.dk(c, .15));
  if (g.front) {
    g.R(0, 2, 8, f); g.R(0, 3, 7, f); g.R(0, 3, 6, f); P(g, 1, 7, a); P(g, 2, 7, a); P(g, 1, 6, g.dk(a, .2)); P(g, 2, 6, g.dk(a, .2));
    for (let x = -3; x <= -1; x++) for (let r = 6; r <= 8; r++) if ((x + r) & 1) P(g, x, r, m);
    g.R(4, g.bf, 5, c); P(g, g.bf, 5, g.dk(c, .25));
  } else {
    for (let x = -3; x <= 3; x++) for (let r = 6; r <= 8; r++) if ((x + r) & 1 && !(r === 8 && Math.abs(x) > 2)) P(g, x, r, m);
    P(g, -1, 5, g.lt(c, .3)); P(g, 0, 5, g.lt(c, .3)); P(g, 1, 5, g.lt(c, .3)); g.R(4, g.bf, 5, c);
  }
  P(g, -1, 8, g.lt(c, .25));
} });

// Fisherman watch cap: sits HIGH above the ears (fringe shows), two-row ribbed cuff, short crown.
regShape('hat', 'watchcap', { draw(g) {
  const c = g.c, d = g.dk(c, .22);
  g.R(-2, 1, 8, c); g.R(-3, 3, 7, c); g.R(-3, 3, 6, c);
  for (let x = -3; x <= 3; x++) if (x & 1) { P(g, x, 7, d); P(g, x, 6, d); }
  P(g, -1, 8, g.lt(c, .3)); P(g, -3, 7, g.dk(c, .3)); P(g, -3, 6, g.dk(c, .3));
} });

// Chullo / ear-flap beanie: peaked, Fair Isle band, flaps over the ears with braided ties and tassels.
regShape('hat', 'earflap', { draw(g) {
  const c = g.c, b = g.band || '#f4f0e8', a = g.accent || g.lt(c, .4), d = g.dk(c, .25);
  P(g, -1, 10, a); P(g, -1, 9, c); g.R(-2, 1, 8, c); for (let x = -3; x <= 3; x++) P(g, x, 7, (x & 1) ? b : c);
  g.R(-3, 3, 6, c); for (let x = -2; x <= 2; x += 2) P(g, x, 6, a); g.R(-3, 3, 5, d);
  const flap = x => { P(g, x, 4, c); P(g, x, 3, c); P(g, x, 2, b); P(g, x, 1, d); P(g, x, 0, d); P(g, x, -1, a); };
  flap(-3); P(g, -4, 4, d); P(g, -4, 3, d); if (!g.front) { flap(3); P(g, 4, 4, d); P(g, 4, 3, d); }
  P(g, -2, 8, g.lt(c, .25));
} });

// Bowler / derby: rounded dome, dark band, short brim curled up at both ends.
regShape('hat', 'bowler', { draw(g) {
  const c = g.c, b = g.band || g.dk(c, .45);
  g.R(-1, 1, 9, c); g.R(-2, 2, 8, c); g.R(-3, 3, 7, c); g.R(-3, 3, 6, b); g.R(-4, 4, 5, c);
  P(g, -4, 6, c); P(g, 4, 6, c); P(g, -4, 5, g.dk(c, .2)); P(g, -3, 5, g.dk(c, .2));
  P(g, -1, 9, g.lt(c, .3)); P(g, -2, 8, g.lt(c, .2)); P(g, -3, 7, g.dk(c, .15));
} });

// Panama: woven straw (dither), pinched crown, black band, brim snapped down at the front and up at the back.
regShape('hat', 'panama', { draw(g) {
  const c = g.c, b = g.band || '#33303f', w = (x, r) => ((x + 2 * r) % 3 === 0 ? g.dk(c, .1) : c);
  for (let x = -2; x <= 2; x++) P(g, x, 8, w(x, 8)); for (let x = -3; x <= 3; x++) P(g, x, 7, w(x, 7)); g.R(-3, 3, 6, b);
  for (let x = -4; x <= 4; x++) P(g, x, 5, x < -2 ? g.dk(c, .14) : w(x, 5)); P(g, -5, 6, c); P(g, 5, 4, c);
  P(g, 0, 8, g.dk(c, .25)); P(g, -1, 8, g.lt(c, .3)); if (g.front) P(g, 3, 6, g.accent || b);
} });

// Floppy sun hat: deep crown, ribbon, very wide brim whose edges droop two rows.
regShape('hat', 'floppy', { draw(g) {
  const c = g.c, b = g.band || g.accent || g.dk(c, .3);
  g.R(-1, 1, 8, c); g.R(-2, 2, 7, c); g.R(-3, 3, 6, b); g.R(-5, 5, 5, c); g.R(-5, -3, 5, g.dk(c, .14));
  P(g, -6, 4, g.dk(c, .1)); P(g, -6, 3, g.dk(c, .2)); P(g, 6, 4, c); P(g, 6, 3, g.dk(c, .12)); P(g, -5, 4, g.dk(c, .22)); P(g, 5, 4, g.dk(c, .18));
  P(g, -1, 8, g.lt(c, .35)); P(g, 2, 5, g.lt(c, .2)); P(g, -2, 7, g.lt(c, .15));
} });

// Durag: smooth satin cap with a sheen, centre seam, long ties hanging at the nape.
regShape('hat', 'durag', { draw(g) {
  const c = g.c, d = g.dk(c, .2), sh = g.lt(c, .42);
  g.R(-2, 2, 7, c); g.R(-3, 3, 6, c); g.R(-3, 3, 5, c);
  if (g.front) {
    P(g, -1, 7, sh); P(g, 0, 7, g.lt(c, .25)); P(g, 1, 6, g.lt(c, .2)); g.R(0, 3, 5, g.dk(c, .12));
    P(g, -4, 5, c); P(g, -4, 4, d); P(g, -5, 4, c); P(g, -4, 3, c); P(g, -5, 3, d); P(g, -5, 2, c); P(g, -4, 2, d); P(g, -5, 1, d);
  } else {
    for (let r = 5; r <= 7; r++) P(g, 0, r, d); P(g, -1, 7, sh); P(g, -2, 6, g.lt(c, .25));
    P(g, -1, 5, g.lt(c, .15)); P(g, 1, 5, g.lt(c, .15));
    for (let r = 4; r >= 0; r--) { P(g, -1, r, r & 1 ? c : d); P(g, 0, r, r & 1 ? d : c); }
  }
} });

// Headwrap (gele-style): tall wrapped fabric printed with diagonal stripes (band colour) and dots (accent), a fan knot at the front.
regShape('hat', 'headwrap', { draw(g) {
  const c = g.c, b = g.band || g.lt(c, .35), a = g.accent || g.dk(c, .3);
  const f = (x, r) => ((x - r + 40) % 3 === 0 ? b : (x + r) % 5 === 0 ? a : c);
  const rows = { 5: [-3, 3], 6: [-3, 3], 7: [-4, 3], 8: [-4, 4], 9: [-4, 3], 10: [-2, 1] };
  for (const r in rows) for (let x = rows[r][0]; x <= rows[r][1]; x++) P(g, x, +r, f(x, +r));
  g.R(-3, 3, 5, g.dk(c, .12)); P(g, -4, 7, g.dk(c, .2)); P(g, -4, 8, g.dk(c, .15));
  if (g.front) { P(g, 3, 9, g.lt(c, .2)); P(g, 4, 9, c); P(g, 4, 10, g.lt(c, .3)); P(g, 2, 10, c); P(g, 3, 10, b); P(g, 5, 8, g.dk(c, .1)); }
  else { P(g, -5, 8, c); P(g, -5, 9, g.lt(c, .2)); P(g, -3, 10, c); }
  P(g, -2, 9, g.lt(c, .3));
} });

// Headscarf tied under the chin (silk-scarf style): covers the crown and the back of the head, frames the face, knot under the chin.
regShape('hat', 'headscarf', { draw(g) {
  const c = g.c, b = g.band || g.lt(c, .4), d = g.dk(c, .18), f = (x, r) => (((x + 8) + 2 * r) % 4 === 0 ? b : c);
  for (let x = -2; x <= 2; x++) P(g, x, 7, f(x, 7)); for (let x = -3; x <= 3; x++) { P(g, x, 6, f(x, 6)); P(g, x, 5, f(x, 5)); }
  if (g.front) {
    P(g, 3, 5, d); P(g, 3, 6, d);
    for (let r = 4; r >= 1; r--) { P(g, -3, r, f(-3, r)); P(g, -2, r, r > 1 ? f(-2, r) : d); P(g, -4, r, d); }
    P(g, -2, 0, c); P(g, -1, 0, d); P(g, 0, -1, c); P(g, 1, -1, g.lt(c, .2)); P(g, 0, -2, d); P(g, 2, -2, c); P(g, 1, -2, c);
  } else {
    for (let r = 4; r >= 1; r--) for (let x = -3; x <= 3; x++) P(g, x, r, f(x, r));
    for (let x = -2; x <= 2; x++) P(g, x, 0, d); P(g, -1, -1, c); P(g, 0, -1, c); P(g, 0, -2, d);
  }
  P(g, -1, 7, g.lt(c, .3));
} });

// Hijab, draped: covers the head, frames the face and wraps under the chin, falls over the shoulders; a pin in the accent colour.
regShape('hat', 'hijabdrape', { hideHair: true, draw(g) {
  const c = g.c, d = g.dk(c, .16), e = g.dk(c, .28), hi = g.lt(c, .22);
  g.R(-1, 1, 8, c); g.R(-2, 2, 7, c); g.R(-3, 3, 6, c); g.R(-3, 3, 5, c);
  if (g.front) {
    for (let r = 4; r >= 1; r--) { P(g, -4, r, d); P(g, -3, r, c); P(g, -2, r, r === 1 ? d : c); }
    g.R(-3, 3, 0, c); P(g, 3, 0, d); g.R(-4, 3, -1, c); g.R(-4, 2, -2, d); g.R(-3, 1, -3, e);
    P(g, 3, 5, d); P(g, 3, 1, c); P(g, -1, 7, hi); P(g, -2, 6, hi); P(g, -3, 3, hi); P(g, 3, 0, g.accent || g.GOLD);
  } else {
    for (let r = 4; r >= 1; r--) g.R(-3, 3, r, c); g.R(-4, 3, 0, c); g.R(-4, 3, -1, d); g.R(-4, 2, -2, d); g.R(-3, 1, -3, e);
    P(g, -4, 4, d); P(g, -4, 3, d); P(g, -4, 2, d); P(g, -4, 1, d); P(g, 0, 7, hi); P(g, -1, 6, hi); P(g, -2, 3, d); P(g, 1, 2, d);
  }
} });

// Hijab, turban-wrapped: high rounded wrap with a twisted knot at the front, ears and neck free.
regShape('hat', 'hijabturban', { hideHair: true, draw(g) {
  const c = g.c, d = g.dk(c, .2), hi = g.lt(c, .3), a = g.band || g.dk(c, .35);
  g.R(-2, 1, 9, c); g.R(-3, 2, 8, c); g.R(-4, 3, 7, c); g.R(-4, 3, 6, c); g.R(-4, 3, 5, c); g.R(-4, -2, 4, c); P(g, -4, 3, d); P(g, -3, 3, d);
  P(g, -5, 7, d); P(g, -5, 6, d); P(g, -4, 5, d);
  if (g.front) { P(g, 1, 8, a); P(g, 2, 7, a); P(g, 1, 7, hi); P(g, 2, 8, hi); P(g, 0, 7, a); P(g, 3, 6, a); P(g, 3, 5, d); }
  else { P(g, 0, 8, a); P(g, -1, 7, a); P(g, 1, 7, a); P(g, 2, 6, d); P(g, 3, 6, d); P(g, 3, 4, c); P(g, 2, 4, c); P(g, 3, 3, d); }
  P(g, -2, 9, hi); P(g, -3, 8, hi);
} });

// Tam: big slouchy crochet hat in three stripes (main / accent / band), ribbed brim, the bulk leaning back (made for locs and big hair).
regShape('hat', 'tam', { draw(g) {
  const c = g.c, b = g.band || g.lt(c, .4), a = g.accent || g.dk(c, .3);
  g.R(-3, 3, 5, g.dk(b, .15)); for (let x = -3; x <= 3; x += 2) P(g, x, 5, g.dk(b, .3));
  g.R(-4, 3, 6, c); g.R(-5, 3, 7, a); g.R(-5, 2, 8, c); g.R(-5, 1, 9, b); g.R(-4, -1, 10, c);
  P(g, -5, 6, g.dk(c, .2)); P(g, -6, 7, g.dk(a, .2)); P(g, -6, 8, g.dk(c, .2)); P(g, -2, 10, g.lt(c, .3)); P(g, -3, 9, g.lt(b, .25));
} });

// Sou'wester: rain hat with a rounded crown, short front brim and a long back brim sloping down over the neck.
regShape('hat', 'souwester', { draw(g) {
  const c = g.c, d = g.dk(c, .18);
  g.R(-2, 1, 8, c); g.R(-3, 2, 7, c); g.R(-3, 3, 6, c); g.R(-4, 4, 5, d); P(g, 0, 7, d); P(g, -1, 8, g.lt(c, .4)); P(g, -2, 7, g.lt(c, .25));
  if (g.front) { P(g, 5, 5, d); P(g, -5, 4, c); P(g, -5, 3, d); P(g, -4, 4, c); P(g, -6, 3, d); P(g, -6, 2, g.dk(c, .3)); }
  else { for (const s of [-1, 1]) { P(g, 5 * s, 4, c); P(g, 5 * s, 3, d); P(g, 6 * s, 3, d); } g.R(-4, 4, 4, d); }
} });

// Cat-ear headband: two ears with pink insides, sat on top of whatever hair is underneath.
regShape('hat', 'catears', { cut: false, draw(g) {
  const c = g.c, t = top(g), pk = g.band || '#f4a8c0';
  for (let x = -2; x <= 2; x++) P(g, x, t, g.dk(c, .1));
  for (const s of [-1, 1]) { const o = s < 0 ? -2 : 1; P(g, o, t + 1, c); P(g, o + 1, t + 1, c); P(g, s < 0 ? o : o + 1, t + 2, c); P(g, s < 0 ? o + 1 : o, t + 1, pk); }
} });

// Reindeer antlers on a headband, a bell in the accent colour.
regShape('hat', 'antlers', { cut: false, draw(g) {
  const c = g.c, t = top(g), b = g.band || '#d9483b';
  for (let x = -2; x <= 2; x++) P(g, x, t, b);
  for (const x of [-2, 2]) { P(g, x, t + 1, c); P(g, x, t + 2, c); P(g, x + (x < 0 ? -1 : 1), t + 3, g.lt(c, .2)); P(g, x + (x < 0 ? -1 : 1), t + 2, c); P(g, x, t + 3, g.dk(c, .15)); }
  P(g, 0, t, g.GOLD);
} });

// Propeller beanie: segmented cap (main / band / accent panels), tiny brim, a propeller on top.
regShape('hat', 'propeller', { draw(g) {
  const c = g.c, b = g.band || '#e8b83a', a = g.accent || '#d9483b', seg = x => [c, b, a][((x + 9) >> 1) % 3];
  for (let x = -2; x <= 2; x++) P(g, x, 7, seg(x)); for (let x = -3; x <= 3; x++) { P(g, x, 6, seg(x)); P(g, x, 5, g.dk(seg(x), .15)); }
  g.R(4, g.bf - 1, 5, g.dk(c, .25)); P(g, 0, 8, '#c8ccd4'); P(g, -2, 9, a); P(g, -1, 9, g.lt(a, .2)); P(g, 0, 9, g.GOLD); P(g, 1, 9, b); P(g, 2, 9, g.dk(b, .15));
} });

// Fascinator: a small disc perched on the side of the head with a sweeping feather (band colour) and a pearl.
regShape('hat', 'fascinator', { cut: false, draw(g) {
  const c = g.c, t = top(g), f = g.band || g.lt(c, .35);
  P(g, -3, t - 1, g.dk(c, .2)); g.R(-3, -1, t, c); P(g, -2, t + 1, g.lt(c, .2)); P(g, -2, t, '#f4f0e8');
  P(g, -1, t + 1, f); P(g, 0, t + 2, f); P(g, 0, t + 3, g.lt(f, .3)); P(g, -4, t + 1, g.dk(f, .1)); P(g, -4, t, f);
} });
