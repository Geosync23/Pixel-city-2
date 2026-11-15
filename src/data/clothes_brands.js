// Clothing catalogue RULES (owned by the wardrobe system; the three catalogue files only reference these): brands, style tags, warmth, shops,
// the price rule and the piece() / hair() declaration helpers. Pure data, no imports: safe for node tools and the game.
//
// A catalogue ITEM is one purchasable piece:
//   piece({ id, slot, shape, name, brand, styles: [...], warmth, c, c2?, accent?, pat?, kind? (slot 'acc' only), price?, shops?, season?, online?, band? })
//     id      unique, lowercase, prefix by slot: tp_ (top) ou_ (outer) dr_ (dress) bt_ (bottom) sh_ (shoes) ht_ (hat) ac_ (accessory)
//     slot    'top' | 'outer' | 'dress' | 'bottom' | 'shoes' | 'hat' | 'acc'
//     shape   a shape id drawn by src/art/chars (built-in or regShape'd). Colour-only accessories (belt, gloves, socks, tights, watch) have no shape.
//     kind    accessories only: 'neck' | 'glasses' | 'bag' | 'belt' | 'gloves' | 'socks' | 'tights' | 'watch'
//     c / c2 / accent   main colour, second colour (pattern / trim / sole / band), accent (prints, logos); hex strings
//     pat     fabric pattern id (PATTERNS for tops, dresses, outerwear; BOT_PATTERNS for bottoms) or null
//     styles  1-3 of STYLES (first = main);  warmth 0 (beachwear) .. 4 (deep winter);  brand: a BRANDS key
//     price   optional override; otherwise priceOf() = slot base x brand tier x pattern bump
//     shops   optional override; otherwise the brand's shops.  season: 0 spring | 1 summer | 2 autumn | 3 winter (or a list) = only stocked then.
//     online  true = only through the Closet app's catalogue (multi-day delivery)
export const SLOTS = ['top', 'outer', 'dress', 'bottom', 'shoes', 'hat', 'acc'];
export const ACC_KINDS = ['neck', 'glasses', 'bag', 'belt', 'gloves', 'socks', 'tights', 'watch'];
export const STYLES = ['casual', 'smart', 'formal', 'sporty', 'cozy', 'party', 'rain', 'winter', 'summer', 'artsy', 'vintage', 'work', 'street', 'outdoor'];
export const SLOT_NAME = { top: 'Tops', outer: 'Outerwear', dress: 'Dresses & one-pieces', bottom: 'Bottoms', shoes: 'Shoes', hat: 'Hats & headwear', acc: 'Accessories' };
/** shops that sell clothes (ids are G.places / venue ids). level = price multiplier of the shop itself, taste = styles it leans to. */
export const SHOPS = {
  clothing: { name: 'Thread & Co.', level: 1, taste: ['casual', 'smart', 'work'] },
  'pub:12': { name: 'Marigold & Main', level: 1.25, taste: ['formal', 'smart', 'party'] },
  'pub:44': { name: 'Ink & Ivy Vintage', level: .7, taste: ['vintage', 'artsy', 'street'] },
  'mall:thread': { name: 'Thread & Co. Outlet', level: .85, taste: ['casual', 'cozy', 'summer'] },
  'mall:kicks': { name: 'Kicks', level: 1, taste: ['sporty', 'street'] },
  'mall:bloom': { name: 'Bloom Beauty', level: 1.1, taste: ['party', 'smart'] },
  gym: { name: 'Iron Maple Gym', level: 1, taste: ['sporty'] },
  arena: { name: 'Otters Team Store', level: 1.1, taste: ['sporty', 'street'] },
  hotel: { name: 'The hotel boutique', level: 1.5, taste: ['formal', 'party'] },
  market: { name: 'Market stalls', level: .6, taste: ['artsy', 'summer', 'vintage'] },
  online: { name: 'Closet app catalogue', level: 1, taste: [] },
};
/** tier: price multiplier. look: what the brand reads as (for the artists: stay inside it). shops: where its pieces are stocked by default. */
export const BRANDS = {
  maple_basics: { name: 'Maple Basics', tier: .6, look: 'plain everyday staples in solid, slightly faded colours; no prints', shops: ['mall:thread', 'clothing', 'online'] },
  thread_co: { name: 'Thread & Co.', tier: 1, look: 'clean high-street casual and smart-casual; stripes, checks, tidy collars', shops: ['clothing', 'mall:thread'] },
  marigold: { name: 'Marigold', tier: 2.4, look: 'boutique luxury: cream, gold, deep jewel tones, belts and gold buttons', shops: ['pub:12', 'hotel'] },
  hollowell: { name: 'Hollowell & Sons', tier: 2.8, look: 'tailoring: suits, coats and oxfords in navy, charcoal, camel; pinstripes', shops: ['pub:12', 'clothing'] },
  nightjar: { name: 'Nightjar', tier: 1.9, look: 'going-out wear: black, plum, sequins and sparkle, metallic accents', shops: ['pub:12', 'mall:bloom', 'hotel'] },
  otterline: { name: 'Otterline Athletics', tier: 1.2, look: 'sportswear and Otters team merch: teal and orange, side stripes, numbers', shops: ['gym', 'arena', 'mall:kicks'] },
  kicks_lab: { name: 'Kicks Lab', tier: 1.4, look: 'sneakers and street shoes: white soles, loud two-colour pairs', shops: ['mall:kicks', 'online'] },
  pixelpop: { name: 'Pixelpop', tier: 1.1, look: 'graphic streetwear: big prints, colour-block, tie-dye, bright on black', shops: ['mall:thread', 'pub:44', 'online'] },
  second_wind: { name: 'Second Wind', tier: .5, look: 'second-hand finds: faded denim, plaid, corduroy browns, odd florals from another decade', shops: ['pub:44', 'market'] },
  juniper_rye: { name: 'Juniper & Rye', tier: 1.6, look: 'cosy knitwear: oatmeal, rust, forest green; argyle and chunky ribs', shops: ['clothing', 'pub:12'] },
  saltline: { name: 'Saltline', tier: 1.3, look: 'harbour workwear and rain gear: yellow slickers, navy, rubber boots, canvas', shops: ['clothing', 'market'] },
  fern_field: { name: 'Fern & Field', tier: 1.7, look: 'outdoor and hiking: olive, khaki, burnt orange; gilets, cargo, sturdy boots', shops: ['gym', 'clothing', 'online'] },
  little_lantern: { name: 'Little Lantern', tier: 1.3, look: 'handmade and artsy: block prints, florals, indigo and marigold, paint flecks', shops: ['market', 'pub:44'] },
  tidepool: { name: 'Tidepool', tier: .8, look: 'summer and beach: aqua, coral, sand; florals, sandals, straw hats', shops: ['mall:thread', 'market'] },
  lacquer: { name: 'Lacquer', tier: 1.8, look: 'jewellery, bags and eyewear: gold, pearl, glossy black, one bright jewel colour', shops: ['mall:bloom', 'pub:12', 'online'] },
};
/** base price by slot (accessories by kind) */
export const BASE_PRICE = { top: 24, outer: 70, dress: 60, bottom: 38, shoes: 55, hat: 20, neck: 16, glasses: 28, bag: 45, belt: 14, gloves: 14, socks: 6, tights: 10, watch: 60 };
const FANCY = { sparkle: 1.35, leopard: 1.2, floral: 1.15, argyle: 1.15, plaid: 1.1, tiedye: 1.1, camo: 1.1, hearts: 1.1 };
export function priceOf(it) {
  if (it.price !== undefined) return it.price;
  const b = BRANDS[it.brand] || { tier: 1 }, base = BASE_PRICE[it.slot === 'acc' ? it.kind : it.slot] || 20;
  const v = base * b.tier * (FANCY[it.pat] || 1) * (it.warmth >= 3 ? 1.15 : 1); return Math.max(3, v < 40 ? Math.round(v) : Math.round(v / 5) * 5);
}
/** declare a catalogue piece (fills defaults; validation happens in clothes_validate.mjs) */
export function piece(o) {
  const it = Object.assign({ c2: null, accent: null, pat: null, warmth: 1, styles: ['casual'], season: null, online: false }, o);
  it.price = priceOf(it); it.shops = o.shops || (it.online ? ['online'] : (BRANDS[it.brand] || { shops: ['clothing'] }).shops.slice());
  return it;
}
/** declare a hairstyle sold as a service: hair({ id (= hair shape id), name, len: 'short'|'medium'|'long', books: ['barber'|'salon'|'colorbar'], price? }) */
export const HAIR_PRICE = { short: 18, medium: 28, long: 40 };
export function hair(o) { const h = Object.assign({ len: 'short', books: ['salon'] }, o); if (h.price === undefined) h.price = HAIR_PRICE[h.len] || 25; return h; }
/** facial hair: facial({ id (= beard shape id), name, price? }) — barbers only */
export function facial(o) { return Object.assign({ price: 12, books: ['barber'] }, o); }
