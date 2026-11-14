// Outfits and shoes: the garment drawn in the colours the game actually dresses the character in.
// outfit(look) paints a top over a bottom (and hat/scarf) from a compact look spec; shoe(colour, kind) paints footwear.
//   look = { top, tc, ic (inner), ac (accent), bottom, bc, hat, hc, scarf }
//   top: tee | polo | tank | long | sweater | hoodie | jacket | suit | cardigan | varsity | coat | puffer | flannel | stripe | graphic | dress | pj
//   bottom: jeans | slacks | cargo | sweats | leggings | shorts | skirt | longskirt | overalls | pj | none
//   hat: beanie | cap | sunhat | beret | headband
import { P, OL, r, R, ov, OV, pg, PG, p, ps, ln, st, spr, clr, sparkle, dk, lt } from './_lib.js';

const W = '#f4f0e8', INK = '#33303f', DENIM = '#4a6fa8', DDENIM = '#34507f';
function bottoms(kind, c, y, y0) {
  const h = 16 - y;
  if (kind === 'shorts') { R(4, y, 8, 3, c); clr(7, y + 2, 2, 1); return; }
  if (kind === 'skirt') { PG([[4, y], [12, y], [13, y + 4], [3, y + 4]], c); return; }
  if (kind === 'longskirt') { PG([[4, y], [12, y], [14, 16], [2, 16]], c); ln(6, y + 1, 5, 15, dk(c, .2)); ln(10, y + 1, 11, 15, dk(c, .2)); return; }
  const lw = kind === 'leggings' ? 2 : 3, x = 8 - lw - 1;
  R(x, y, lw * 2 + 2, h, c); clr(7, y + 2, 2, h - 2);
  if (kind === 'cargo') { r(x, y + 3, 2, 2, dk(c, .22)); r(x + lw * 2, y + 3, 2, 2, dk(c, .22)); }
  if (kind === 'sweats') { r(x, 15, lw, 1, lt(c, .3)); r(9, 15, lw, 1, lt(c, .3)); }
  if (kind === 'jeans') { p(x + 1, y + 1, lt(c, .3)); p(10, y + 1, lt(c, .3)); }
  if (kind === 'pj') for (let j = y + 1; j < 16; j += 2) { r(x, j, lw, 1, lt(c, .4)); r(9, j, lw, 1, lt(c, .4)); }
}
function tops(L, y) {
  const k = L.top, c = L.tc, sc = dk(c, .12), long = !['tee', 'polo', 'graphic', 'tank', 'dress'].includes(k), bh = k === 'coat' ? 11 : 8;
  if (k === 'dress') { PG([[5, y + 3], [11, y + 3], [14, 15], [2, 15]], c); R(5, y, 6, 4, c); clr(7, y, 2, 1); r(5, y + 4, 6, 1, dk(c, .2)); ps([[5, 11], [8, 12], [11, 10]], lt(c, .35)); return; }
  if (k === 'hoodie') R(5, y - 1, 6, 2, dk(c, .2));
  if (k !== 'tank') { const sl_ = long ? (k === 'coat' ? 8 : 7) : 3, s2 = k === 'varsity' ? W : sc; R(1, y + 1, 3, sl_, s2); R(12, y + 1, 3, sl_, s2); if (long && k !== 'pj') { r(1, y + sl_, 3, 1, dk(s2, .25)); r(12, y + sl_, 3, 1, dk(s2, .25)); } }
  R(k === 'tank' ? 5 : 4, y, k === 'tank' ? 6 : 8, bh, c);
  if (k === 'tank') { clr(7, y, 2, 2); r(5, y + 5, 6, 1, lt(c, .25)); }
  else if (['jacket', 'suit', 'cardigan', 'varsity', 'coat'].includes(k)) {
    const ic = L.ic || W; r(6, y, 4, 3, ic); r(7, y + 3, 2, 2, ic); ps([[5, y], [6, y + 2], [10, y], [9, y + 2]], dk(c, .3));
    if (k === 'suit') { r(7, y + 1, 2, 4, L.ac || P.crimson); p(5, y + 3, L.ac || P.gold); }
    r(7, y + 5, 2, bh - 5, dk(c, .3)); if (k === 'cardigan') ps([[8, y + 5], [8, y + 7]], P.gold);
    if (k === 'varsity') { r(4, y + 7, 8, 1, W); p(10, y + 3, W); }
    if (k === 'coat') { r(4, y + 6, 8, 1, dk(c, .3)); p(8, y + 6, P.gold); }
  } else clr(7, y, 2, 1);
  if (k === 'polo') { ps([[6, y], [9, y]], W); p(7, y + 1, W); p(8, y + 1, W); p(7, y + 2, dk(c, .3)); }
  if (k === 'hoodie') { r(6, y + 5, 4, 2, dk(c, .18)); ps([[7, y + 1], [7, y + 2], [8, y + 1], [8, y + 3]], W); }
  if (k === 'sweater') { r(4, y + 7, 8, 1, dk(c, .25)); ps([[6, y + 3], [9, y + 3], [7, y + 5], [10, y + 5], [5, y + 5]], lt(c, .25)); }
  if (k === 'puffer') { for (const j of [2, 5]) { r(4, y + j, 8, 1, dk(c, .2)); r(1, y + j + 1, 3, 1, dk(c, .25)); r(12, y + j + 1, 3, 1, dk(c, .25)); } r(8, y + 1, 1, 7, dk(c, .3)); }
  if (k === 'flannel') { for (const j of [2, 5]) r(1, y + j, 14, 1, dk(c, .3)); for (const i of [2, 5, 10, 13]) r(i, y + 1, 1, 7, dk(c, .3)); r(7, y + 1, 2, 7, lt(c, .25)); }
  if (k === 'stripe') for (const j of [2, 4, 6]) { r(4, y + j, 8, 1, W); r(1, y + j, 3, 1, W); r(12, y + j, 3, 1, W); }
  if (k === 'pj') { for (const i of [5, 7, 10]) r(i, y + 1, 1, 7, lt(c, .4)); r(2, y + 1, 1, 7, lt(c, .4)); r(13, y + 1, 1, 7, lt(c, .4)); ps([[8, y + 2], [8, y + 4], [8, y + 6]], W); }
  if (k === 'graphic') { r(6, y + 3, 4, 3, L.ac || P.gold); p(7, y + 4, c); }
  if (long) { const n = (k === 'coat' ? 8 : 7) - 2; clr(3, y + 3, 1, n + 1); clr(12, y + 3, 1, n + 1); }
}
function hat(kind, c) {
  if (kind === 'beanie') { R(5, 0, 6, 2, c); p(8, 0, lt(c, .5)); }
  else if (kind === 'cap') { R(5, 0, 5, 2, c); r(9, 1, 3, 1, dk(c, .2)); }
  else if (kind === 'sunhat') { R(6, 0, 4, 1, c); R(3, 1, 10, 1, c); }
  else if (kind === 'beret') { OV(4, 0, 8, 2, c); }
  else if (kind === 'headband') { R(4, 0, 8, 1, c); }
}
export function outfit(L) {
  const y = L.hat ? 3 : 1;
  if (L.bottom && L.bottom !== 'none' && L.top !== 'dress' && L.top !== 'coat') bottoms(L.bottom === 'overalls' ? 'jeans' : L.bottom, L.bc, y + 8, y);
  if (L.top === 'coat') { R(5, 12, 6, 4, L.bc || INK); clr(7, 14, 2, 2); }
  tops(L, y);
  if (L.bottom === 'overalls') { R(5, y + 3, 6, 5, L.bc); r(5, y, 1, 3, L.bc); r(10, y, 1, 3, L.bc); ps([[5, y + 3], [10, y + 3]], P.gold); r(7, y + 5, 2, 2, dk(L.bc, .2)); if (L.splat) ps([[6, y + 4], [9, y + 6], [5, 13], [10, 12]], P.red), ps([[8, y + 3], [6, 14]], P.gold), ps([[5, y + 6], [10, 14]], P.leaf); }
  if (L.scarf) { R(5, y, 6, 2, L.scarf); R(9, y + 2, 2, 3, L.scarf); }
  if (L.hat) hat(L.hat, L.hc);
  if (L.spark) { sparkle(12, 2); ps([[5, y + 2], [9, y + 4], [6, y + 6], [10, y + 1]], P.gold); }
}
/** side-view shoe. kind: 'runner' | 'court' | 'high' | 'boot' */
export function shoe(c, kind, o = {}) {
  const hi = kind === 'high' || kind === 'boot', sole = o.sole || P.white;
  if (hi) PG([[2, 2], [8, 2], [8, 8], [13, 9], [15, 11], [15, 13], [2, 13]], c); else PG([[1, 6], [6, 5], [8, 8], [13, 9], [15, 11], [15, 13], [1, 13]], c);
  R(1, 13, 15, 2, sole); if (kind === 'boot') { ps([[2, 15], [5, 15], [8, 15], [11, 15], [14, 15]], sole); r(2, 2, 6, 1, dk(c, .3)); }
  const ly = hi ? 4 : 7; ps([[8, ly + 2], [9, ly + 3], [7, ly], [8, ly + 4]].slice(0, hi ? 4 : 2), o.lace || W); if (hi) ps([[7, 4], [7, 6]], o.lace || W);
  if (o.stripe) { ln(4, 12, 7, 9, o.stripe); ln(5, 12, 8, 10, o.stripe); } if (kind === 'high') ov(3, 5, 3, 3, o.stripe || W);
  r(12, 11, 3, 2, o.toe || lt(c, .25));
}

const L = (top, tc, bottom, bc, x) => Object.assign({ top, tc, bottom, bc }, x);
export const LOOKS = {
  outfit_travel: L('hoodie', '#2f9a94', 'jeans', DENIM),
  outfit_tee_jeans: L('tee', W, 'jeans', DENIM),
  outfit_summer: L('polo', '#e8b83a', 'shorts', '#e8e2d4'),
  outfit_knit: L('sweater', '#b8563a', 'jeans', DDENIM, { scarf: '#ead9b8' }),
  outfit_smart_casual: L('jacket', '#2f3f72', 'slacks', '#4a4a58'),
  outfit_business: L('suit', '#8a8f98', 'slacks', '#8a8f98', { ac: '#b83a6a' }),
  outfit_evening: L('suit', INK, 'slacks', INK, { ac: '#e8b83a' }),
  outfit_party: L('graphic', '#7a55c8', 'slacks', INK, { ac: '#e8b83a', spark: 1 }),
  outfit_sport: L('tank', '#e8862c', 'shorts', '#3a3644'),
  outfit_pajamas: L('pj', '#7aa8d8', 'pj', '#7aa8d8'),
  outfit_raincoat: L('coat', '#e8b83a', 'slacks', '#d04a3a', { ic: '#f6d870' }),
  outfit_winter: L('puffer', '#d9483b', 'jeans', DDENIM, { hat: 'beanie', hc: '#d9483b', scarf: W }),
  outfit_artist: L('tee', W, 'overalls', DENIM, { splat: 1 }),
  mall_outfit_varsity: L('varsity', '#b83a6a', 'jeans', DDENIM),
  mall_outfit_flannel: L('flannel', '#d9483b', 'cargo', '#6f7a48'),
  mall_outfit_stripe: L('stripe', '#2f3f72', 'slacks', '#e8e2d4'),
  mall_outfit_hoodie: L('hoodie', '#9aa0a8', 'sweats', '#4a4a58'),
  mall_outfit_sundress: L('dress', '#e8b83a', 'none', null, { hat: 'sunhat', hc: '#ead9b8' }),
  mall_outfit_cardigan: L('cardigan', '#4fa860', 'slacks', '#7a5238'),
  mall_outfit_denim: L('jacket', DENIM, 'jeans', DENIM),
  mall_outfit_trench: L('coat', '#c8ad7a', 'slacks', INK, { scarf: '#b83a6a', ic: '#ead9b8' }),
  mall_outfit_beret: L('long', INK, 'longskirt', '#8a3848', { hat: 'beret', hc: '#b83a6a' }),
  mall_outfit_polo: L('polo', '#5ab0e0', 'shorts', '#c8ad7a'),
  mall_outfit_puffer: L('puffer', W, 'leggings', INK, { hat: 'beanie', hc: '#f08ab0' }),
  mall_outfit_graphic: L('graphic', INK, 'cargo', '#4a4a58', { ac: '#f07a5a' }),
  mall_outfit_linen: L('long', '#ead9b8', 'slacks', '#e8e2d4', { hat: 'sunhat', hc: '#c8a070' }),
  mall_outfit_overalls: L('stripe', '#f09a3a', 'overalls', '#6f7a48'),
  mall_outfit_velvet: L('suit', '#7a55c8', 'slacks', INK, { ic: INK, ac: '#e8b83a' }),
  mall_sport_track: L('long', '#d9483b', 'sweats', INK, { hat: 'headband', hc: W }),
  mall_sport_yoga: L('tank', '#2f9a94', 'leggings', INK),
  mall_sport_court: L('tee', W, 'shorts', '#3b6fd0', { hat: 'cap', hc: '#3b6fd0' }),
  mall_sport_gym: L('tank', '#5e6676', 'shorts', '#d04a3a'),
};
export const WEAR = {
  mall_kicks_red: () => shoe('#d04a3a', 'runner', { stripe: W }),
  mall_kicks_white: () => shoe('#f0ece4', 'court', { sole: '#d8d2c4', stripe: '#3fae5a', lace: '#b8b2a4', toe: '#fffdf6' }),
  mall_kicks_blue: () => shoe('#3b6fd0', 'high', { stripe: W }),
  mall_kicks_trail: () => shoe('#c8a070', 'boot', { sole: '#4a3a2e', lace: P.gold, toe: '#8a6a48' }),
  'cat.outfit': () => outfit(L('tee', '#8a5cc2', 'jeans', DENIM)),
  'glyph.dress': () => outfit(L('dress', P.rose, 'none')),
  'glyph.jacket': () => outfit(L('jacket', '#7a5238', 'none')),
  'glyph.coat': () => outfit(L('coat', '#c8ad7a', 'none')),
  'glyph.trousers': () => bottoms('jeans', DENIM, 1),
  'glyph.shoe': () => shoe('#e8862c', 'runner', { stripe: W }),
  'glyph.boot': () => shoe('#8a5a38', 'boot', { sole: '#4a3a2e', lace: P.gold }),
  'glyph.hat': () => { OV(3, 3, 10, 9, P.red); clr(3, 9, 10, 4); R(1, 9, 14, 2, P.red); r(4, 7, 8, 1, P.cream); },
  'glyph.hoodie': () => outfit(L('hoodie', '#9aa0a8', 'none')),
  'glyph.sweater': () => outfit(L('sweater', '#b8563a', 'none')),
};
for (const id of Object.keys(LOOKS)) WEAR[id] = () => outfit(LOOKS[id]);
