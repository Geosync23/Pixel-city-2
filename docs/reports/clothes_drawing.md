# Clothes & hair DRAWING guide (for the three wardrobe artists)
Wave B item 2i. The owner wants **1,000+ purchasable clothing pieces and 60+ hairstyles**, each "distinguishable on the character at game scale".
The framework is in place and builds. Your job is shapes (pixel drawing code) and catalogue rows (data). The systems (shops, wearing, laundry, hair services,
closet app, save migration) are built afterwards by the wardrobe-systems worker on top of exactly what is described here.

## 1. How it fits together
- A **shape** is the cut of a garment: `raglan`, `trench`, `culottes`, `cowboyboot`, `newsboy`, `choker`. It is drawing code, registered with `regShape(slot, id, def)`
  (or `regHair`) from a file under `src/art/chars/`. Files there are auto-imported; nobody edits an index.
- A **catalogue item** is one thing a shop sells: shape + colours + optional pattern + name + brand + style tags + warmth. It is one `piece({...})` row in a data file.
- The engine `src/art/chars/char.js` draws the body and calls your shape at the right layer for **every pose, frame and direction** (stand, walk, run, sit, carry, dance...;
  front and back view, mirrored for the other two directions). It bends arms and legs, shades, outlines and animates. You only describe the garment on the canonical figure.
  The lying (sleep) pose uses the base colours only.
- The character is tiny: torso 5 px wide x 6 rows, legs 2 px wide x 6 rows, head 7 x 7. One pixel is a design decision.

### Slots and spec fields (what a piece sets on the character; `applyPiece` in src/data/clothes.js does it)
| slot | shape slot(s) | spec fields |
|---|---|---|
| top | `top` | top, topColor, topPat, topColor2, accent |
| dress (one-piece; replaces the bottom) | `dress` | same fields as top |
| outer (worn open over the top; the top's colour shows as `g.inner`) | `outer` (a `top` id also works) | outer, outerColor, outerPat, outerColor2 |
| bottom | `bottom` | bottom, bottomColor, botPat, bottomColor2 |
| shoes | `shoes` | shoes (colour), shoeType, shoeColor2 |
| hat | `hat` | hat, hatColor, hatBand (= c2) |
| acc, kind neck / glasses / bag | `neck` / `glasses` / `bag` | neck + neckColor / glasses + glassesColor / bag + bagColor |
| acc, kind belt / gloves / socks / tights / watch | no shape (colour only) | belt / gloves / socks / tights / watch = colour |
| hair, facial hair | `regHair` / `beard` | hair, hairColor (+ hairColor2, hairFx: ombre, tips, streak, split) / beard |

## 2. The drawing API (commented example)
```js
// src/art/chars/wear_tops_knit.js   (artist A)
import { regShape } from './_shapes.js';

// Cable-knit jumper: long sleeves, a lighter rolled collar, two darker cable columns, ribbed hem.
regShape('top', 'cableknit', {
  sleeve: 9,                        // 0 none | 2 short | 3 three-quarter | 9 long
  // arm: 'inner' | 'c2' | 'accent' | 'skin',   sleeve colour if it is not the body colour
  // tail: 2,                        rows of hem hanging over the hips (coats, tunics)
  body(c, x, j, g) {                // optional: colour of body pixel (x, j) AFTER the fabric pattern; return null to keep c
    return (x === -1 || x === 2) && j > 0 && j < g.T - 1 ? g.dk(c, .16) : null;
  },
  front(g) {                        // details in front view (the figure faces right: x = 1 is the centre line of the chest)
    g.row(0, g.lt(g.body, .28));    // collar
    g.row(g.T - 1, g.dk(g.body, .2)); // ribbed hem
  },
  back(g) { g.row(0, g.lt(g.body, .28)); g.row(g.T - 1, g.dk(g.body, .2)); },
});
```
`g` for torso shapes (top / outer / dress): `t(x, j, colour)` plot one torso pixel (x from `g.x0` to `g.x1`: -2..2 on an average build, -2..1 slim, -3..3 broad, so test `g.wide`
before touching x = 2; j = 0 shoulders .. `g.T - 1` hem; T is 6, 4 for kids), `row(j, colour)`, `p(x, y, colour)` raw plot, `body` (base colour), `inner` (colour of the layer
underneath / the shirt), `c2` (the item's second colour or null), `accent`, `sk` (skin), `front`, `seated`, `k` (the resolved look), and `dk, lt, mix, WHITE, GOLD`.
Always derive shades with `g.dk(colour, amount)` / `g.lt(...)`: never hard-code a shade of the garment colour, because one shape is sold in many colourways.

The other slots (full signatures at the top of each example file):
- **dress**: a torso shape plus `skirt: rows` (99 = ankle), `flare: px per side` or `(j, n) => px`, `skirtPx(c, x, j, n, k) -> colour | null`. See `wear_dress_ex.js`.
- **bottom**: `leg(i, n, c, k) -> colour | 'skin'` for leg row i of n (0 = hip), `px(i, n, near, c, c2, k) -> [col1, col2] | null`, `wide(i, n) -> bool` (extra outer pixel:
  flares, wide legs); skirts use `skirt / flare / skirtPx`. See `wear_bottoms_ex.js`.
- **shoes**: `rows` (leg rows the shaft covers) + `draw(g)`; the foot is 2 px (x, x+1) on rows fy-1 and fy plus the toe at x+2. See `wear_shoes_ex.js`.
- **hat**: `cut: false` keeps the hair above the brow (bands, bows, tiaras); `draw(g)` with `g.R(x0, x1, row, colour)`: row 5 = brow, 6 = top of the skull, 7+ above. See `wear_hats_ex.js`.
- **neck / glasses / bag**: `draw(g)`; bags `back(g)` (on the body) and / or `hand(g)` (carried). See `wear_acc_ex.js`.
- **hair**: `regHair(id, { f: [topRow, rows], b: [topRow, rows] })` with 11-character rows, or `regHair(id, hairFrom(capId, tailId))` from the caps and tails in `_wear.js`
  (`CAP`, `TAIL` are exported from `_shapes.js`; print them to see what exists). **beard**: `regShape('beard', id, { draw(g) })`. See `hair_ex.js`.
- To redraw a weak built-in, register the same id from your own file with `override: true` (hair: `regHair(id, tpl, true)`): your version wins. Do not edit the engine.

### Patterns and colour
Patterns are engine-side and work on every top, dress, outerwear (`pat`) and bottom: tops `stripes vstripes pinstripe plaid check dots floral colorblock argyle camo tiedye
ombre sparkle chevron leopard hearts`; bottoms `stripes pinstripe plaid camo sidestripe floral acid dots`. `c` = base, `c2` = pattern colour, `accent` = third colour.
A new pattern or print (graphic logos, wide stripes, band and team merch) is a **shape-level** job: draw it in `body()` / `front()` with `g.c2` and `g.accent`
(e.g. shape `logotee` = tee + a 2x2 chest print in the accent colour, shape `widestripe` = `body: (c, x, j, g) => (j % 4 < 2 ? null : g.c2)`), then sell it in many colourways.
If you need a new engine-wide pattern, list it in your report; do not edit `_wear.js`.

## 3. Declaring catalogue items
```js
// src/data/clothes_tops.js
P({ id: 'tp_cableknit_oat', slot: 'top', shape: 'cableknit', name: 'Lighthouse Cable Knit, Oat', brand: 'juniper_rye',
    styles: ['cozy', 'winter'], warmth: 3, c: '#ead9b8' }),
P({ id: 'tp_breton_navy', slot: 'top', shape: 'long', name: 'Breton Stripe Long Sleeve', brand: 'thread_co',
    styles: ['casual', 'smart'], warmth: 2, c: '#2f3f72', c2: '#f4f0e8', pat: 'stripes' }),
```
All fields, the 15 brands (each with a look, a price tier and its shops), the style tags, shops and the price rule are in **`src/data/clothes_brands.js`** (read it first; do not
edit it: ask in your report). Price and shops are derived from the brand; override with `price:` / `shops:` only for a reason. `season: 1` = summer stock only; `online: true` =
only in the Closet app. Rules:
- ids: lowercase, `tp_ ou_ dr_ bt_ sh_ ht_ ac_` + shape + variant; never rename or delete an id once another worker has reported (saves will hold them).
- Every item has its **own name** (no "Tee 14"): a product name in the brand's voice, plus the colourway when it is a colourway ("Quayside Trench, Camel").
- Stay inside the brand's look and pick honest style tags (the first tag is the main one; dress codes and NPC reactions read them). warmth 0 beachwear .. 4 deep winter.
- Spread across brands so every shop gets a distinct slice: no brand above ~12% of your items, every brand used. Team merch: Maple Bay Otters, red `#d2392f` + cream `#f4f0e8`
  (brand `otterline`). Band merch: invent tour tees for acts named in src/data (grep `_shows_music.js`), as shapes with a print.
- Variety comes from **shapes first, then patterns and prints, then curated colourways**: at most ~12 colourways of one shape + pattern. No palette spam.
- Generating rows with a small loop over a hand-written table of [shape, pattern, colours, name] is fine; a loop over a colour list with numbered names is not.

## 4. Art rules that apply (docs/ART_GUIDE.md)
- 1 px dark outline: the engine adds it around the whole figure. Never draw your own outline; never leave a 1 px hole inside the silhouette unless you want an outline there.
- Limited, harmonious palette: derive every shade from the item's colours with `dk / lt / mix`; highlights top-left, the darker side is the figure's left edge (the engine
  already darkens column `x0` and the far leg). Chunky and readable beats detailed: prefer one 2 px block of contrast over three scattered pixels.
- Stay inside the sprite box `CHAR_SB = [-16, -36, 16, 12]` (hats: nothing above row 11, nothing wider than x = -7..7).
- No transparency tricks, no randomness (`Math.random`); shapes must be deterministic.

## 5. "Distinguishable at game scale"
In game the character is shown at 3-4x; the piece must read **without the label**. The validator already fails pieces that draw nothing or that are pixel-identical to
another piece of the same slot, but passing it is not enough.
- Good: `trench` vs `coat`: the trench has a belt row, a gold buckle and double buttons, and hangs one row longer: the silhouette and the mid-line both change.
- Good: two colourways with clearly different hue or value (camel vs navy), or a pattern that changes the whole surface (plaid vs plain).
- Bad: "henley" that differs from "long" by one slightly darker pixel; `#4a6fa8` vs `#4a70aa`; a necklace in skin-adjacent gold on a cream top; two florals that swap accent only.
- Rule of thumb: a new SHAPE changes the silhouette or at least 4 pixels in a block or line; a new COLOURWAY differs from every sibling by an obviously different hue,
  or light vs dark. Tiny accessories (watch, choker, glasses) are allowed to be small, but must be visible on the contact sheet at scale 3 from arm's length.

## 6. Looking at your work (required)
```
node tools/gallery.mjs shape.top.   --scale 4 --out shapes_tops      # every SHAPE of a slot, neutral colours   (top outer dress bottom shoes hat neck glasses bag beard)
node tools/gallery.mjs wear.top.    --scale 3 --out clothes_tops     # every CATALOGUE ITEM of a slot            (top outer dress bottom shoes hat acc)
node tools/gallery.mjs wear.top.tp_cable --scale 4 --out one         # any substring of a cell id narrows it
node tools/gallery.mjs hairs.       --scale 3 --out hairs            # every hairstyle: front, back, under a cap, grown-out
```
Output `out/gallery/<name>.png`; open it with the Read tool (crop tall sheets into strips first, e.g. with PIL, so pixels stay visible). Each cell shows one piece four times:
**front, back, walking (other direction, mirrored), seated**. Check in every cell: the back view is drawn (not a blank back), nothing detaches while walking, the seated
figure still reads, long hems do not swallow the legs, hats do not float or clip the hair, light colours keep an edge against skin.
`node src/data/clothes_validate.mjs --list` prints every shape id per slot (built-ins included: you may sell built-ins in new colourways).

## 7. Ownership (work in parallel; never touch another artist's files)
| artist | shape files (create as many as you like) | data file | targets: shapes (now -> at least) | targets: catalogue items |
|---|---|---|---|---|
| A — tops + outerwear | `src/art/chars/wear_tops_*.js`, `wear_outer_*.js` | `src/data/clothes_tops.js` (`TOPS`, `OUTERS`) | tops 33 -> 45, outerwear 23 -> 32 | tops 300, outerwear 200 |
| B — bottoms + dresses + shoes | `wear_bottoms_*.js`, `wear_dress_*.js`, `wear_shoes_*.js` | `src/data/clothes_bottoms.js` (`BOTTOMS`, `DRESSES`, `SHOES`) | bottoms 27 -> 36, dresses 13 -> 24, shoes 15 -> 32 | bottoms 160, dresses 110, shoes 130 |
| C — headwear + accessories + hair | `wear_hats_*.js`, `wear_acc_*.js`, `hair_*.js` | `src/data/clothes_acc.js` (`HATS`, `ACCS`), `src/data/hair_styles.js` | hats 33 -> 42, neck 9 -> 14, glasses 10 -> 14, bags 11 -> 16, hair 78 -> 85 (and redraw weak built-ins), beards 10 -> 14 | hats 110, accessories 110 (at least 12 per kind incl. belt, gloves, socks, tights, watch), hairstyle rows 70+ (12 `starter: true`), facial 12+ |

Sum: **1,120 pieces** (the validator's floor is 1,000), 70+ hairstyles. The `*_ex.js` example files belong to the artist of that slot: keep the examples, add next to them.
**Do not edit**: `src/art/chars/char.js`, `_wear.js`, `_shapes.js`, `_grid.js`, `zz_wear_gallery.js`, `src/data/clothes.js`, `clothes_brands.js`, `clothes_validate.mjs`,
`src/sim/wardrobe.js`, `src/ui/creator.js`, anything outside the table. If the engine lacks a hook you need (e.g. earrings, a cape seen from the front, a new pattern),
describe it in your report in one line; the systems worker adds it.

## 8. Checklist before you report
1. `node tools/build.mjs` passes; `node src/data/validate.mjs` passes.
2. `node src/data/clothes_validate.mjs --min 0 --minhair 0` reports **zero problems** for your slots (the 1,000 floor only passes once all three artists have landed;
   the lead runs it without flags at the end). Quote its "by slot / by brand / by shop" lines.
3. Contact sheets of EVERY shape and EVERY item you added were rendered and looked at (say how many sheets); weak cells were redrawn, not waved through.
4. In game: `node tools/shot.mjs --url "?scene=city&x=196&y=262&t=13&zoom=3" --w 390 --h 844 --out wear_city --eval "G.wardrobe.mirror(['<3 of your ids>'])"` shows the mirror
   with your pieces, zero page errors, 60 fps; one more shot without the eval to confirm the crowd still draws.
5. Report: files, counts (shapes per slot, items per slot / brand / shop), anything in the engine you needed and did not get, known weak pieces.
