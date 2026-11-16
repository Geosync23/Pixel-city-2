# Clothing stores, preset outfits, mannequins (owner msgs 177-178, BIBLE "Direction update 39")
Worker: CLOTHING STORES (Fable), 2026-11-16.

**In short.** Ten new enterable clothing stores, each with its own room and shopkeeper, in existing buildings. The in-store-only clothes moved to "their" shop: Marigold & Main anchors 106 pieces instead of 282. All 20 clothing shops now offer preset outfits (85 looks) with a one-tap "Buy the look", shown on mannequins dressed by the real character renderer. 25 new pieces make up 7 signature looks.

**Not tested:** a real phone; a bus / train / cab trip to a new store (only WALK); buying at the gym, arena store, hotel boutique and market stalls through their windows (their looks were bought by API); the seats in the new rooms (the "Sit" spots exist and are reachable, nobody sat down).

## 1. The ten stores
Every one is its own shop id = venue id = room id = Map place (`cs_<key>`). None of the central districts had a free building left (a script found only houses in Hillcrest / Maplewood and the rowing club), so six stores are a second shopfront on a free stretch of an occupied building. Nothing was moved, replaced or renamed. The Galleria has no empty bay.

| Store (id) | Sells | Address, building | Hours | What makes the room its own |
|---|---|---|---|---|
| Hollowell & Sons, Tailors (`cs_hollowell`) | Hollowell & Sons: suits, coats, oxfords | 824 Main St, Downtown: the side front of The Marlowe | Mon-Sat 10-18, Sun 12-17 | Bottle-green panelling, dark boards, a wall of cloth bolts, the cutting table, a three-way mirror on a podium, a window platform |
| Nightjar (`cs_nightjar`) | Nightjar: going-out wear | 612 University Ave, Arts Quarter: the lofts next to the Easel House door | Mon-Thu 12-22, Fri 12-23, Sat 11-23, Sun 12-20 | A black box: lit catwalk with three mannequins under spots, mirror ball, neon, gold rails |
| Juniper & Rye Knitwear (`cs_juniper`) | Juniper & Rye: knitwear | 338 University Ave, Hillcrest: a craftsman house (was free) | daily 9-18 | A front room: lit fireplace, two armchairs, wool sorted by colour in cubbies, jumper tables |
| Second Wind Thrift (`cs_secondwind`) | Second Wind (second branch): denim, coats, shoes, hats | 218 Mill St, Old Town: beside Suds & Bubbles | Mon-Sat 10-18, Sun 11-17 | Check floor, mustard stripes, four packed rails, denim in apple crates, a $2 bin, hat wall, hi-fi |
| Cobble & Sole (`cs_sole`) | Shoes of the high-street brands, socks, tights, belts | 214 Chandler St, Old Town: under Cobbler's Row Court | Mon-Sat 9-18, Sun 11-16 | Brick, shoe walls on three sides, shoe boxes to the ceiling, try-on benches with foot mirrors, a cobbler's bench |
| Tidepool Beach Shop (`cs_tidepool`) | Tidepool: beachwear | 214 Dock St, Harborside: Cannery Row | daily 9-19 | Aqua boards, sea-blue mat and decking, surfboards, a striped beach-hut fitting room, buoys |
| Saltline Outfitters (`cs_outfitters`) | Saltline + Fern & Field: rain gear, workwear, hiking | 422 Dock St, Harborside: the quay front of the Salt & Co warehouse | Mon-Sat 7-18, Sun 9-16 | Timber and concrete, a canoe hung from the rafters, the oilskin rail, boot racks, rope, lanterns |
| Otterline Boathouse (`cs_otterline`) | Otterline Athletics, team merch included | 513 Dock St, Harborside: the rowing club (was free) | Mon-Sat 6-20, Sun 8-18 | White and team red, oars and pennants, a rowing machine and a treadmill, lockers |
| Brim & Buckle (`cs_brim`) | Hats, bags, jewellery, eyewear (Lacquer + the high street) | 406 College St, Arts Quarter: Sunnyside, left of the cafe | Mon-Sat 10-19, Sun 11-17 | Rose stripes, two walls of hats, hat trees, two lit jewellery cases, hat boxes, a chandelier |
| Little Lantern Atelier (`cs_lantern`) | Little Lantern: handmade prints | 708 Linden St, Maplewood: a cottage (was free) | Tue-Sat 10-18, Sun 10-17, closed Mon | A workshop: the print table, a washing line of prints overhead, paper lanterns, fabric rolls |

Each store has a lit sign over the door, the door glow, a Map entry, an address, and refuses entry with its hours when closed. Each room has one till, racks that open the existing Browse windows, a fitting room or mirror, a seat, one to three mannequins and a named shopkeeper behind the counter with four lines (tap to talk): Mr. Ambrose Hollowell, Vesper, Maeve, Dot, Mr. Iosif, Koa, Captain Bea, Coach Renny, Odette, Wren.

Two speciality shops deviate from "racks of clothes": Cobble & Sole has only shoe walls and Brim & Buckle only hat and accessory fixtures.

## 2. Re-anchoring (in-store pieces per shop that always has them)
828 pieces are in store only (803 before, plus the 25 new ones). The rule is `homeShop()` / `alsoAt()` in `src/data/clothing_stores.js`: a brand's pieces go to its own shop; shoes, hats and accessories of brands without a shop go to Cobble & Sole and Brim & Buckle; Second Wind is split (bottoms, shoes, outerwear, hats at the new branch; tops, dresses, trinkets stay at Ink & Ivy); Kicks Lab stays at Kicks; catalogue exclusives are untouched. Which pieces can be ordered online did not change (563 before and after).

| Shop | Before | After |
|---|---|---|
| Marigold & Main | 282 | 106 |
| Ink & Ivy Vintage | 193 | 41 |
| Thread & Co. | 129 | 27 |
| Iron Maple Gym | 90 | 0 |
| Thread & Co. Outlet | 90 | 16 |
| Kicks | 8 | 8 |
| Bloom Beauty | 7 | 0 |
| Otters Team Store | 4 | 0 |
| Nightjar | - | 97 |
| Little Lantern Atelier | - | 94 |
| Hollowell & Sons | - | 88 |
| Juniper & Rye Knitwear | - | 76 |
| Otterline Boathouse | - | 70 |
| Tidepool Beach Shop | - | 66 |
| Second Wind Thrift | - | 61 |
| Saltline Outfitters | - | 51 |
| Brim & Buckle | - | 19 |
| Cobble & Sole | - | 8 |

"Before" is counted by `anchorShop` on the old catalogue (instore.md counted the market separately, hence its 102 for Ink & Ivy). The gym, the team store and Bloom still stock those pieces on weekly rotation; they are just no longer the guaranteed place.

## 3. Preset outfits
`src/data/clothing_outfits.js`: a hand-curated table, 85 looks in 20 shops (drafts came from a one-off generator, then I looked at all of them on contact sheets and fixed them).

| Shop | Looks |
|---|---|
| Hollowell & Sons | The Morning Suit (new), Boardroom Charcoal, Black Tie, Country Weekend, The Town Overcoat (autumn / winter), Corner Office |
| Nightjar | After Midnight (new), Wild Side, Little Black Everything, Second Encore, Opening Night |
| Juniper & Rye | Hearthside (new), Fireside Rust, A Sunday In, Cottage Stripes, Lighthouse Keeper |
| Second Wind Thrift | Charity-Shop Sunday, Seventies Denim, League Night, Tea Dance |
| Cobble & Sole (sets) | The Sunday Polish, Town and Tweed, Autumn Leaves, Dancing Shoes |
| Tidepool | Boardwalk (new), Lifeguard Off Duty, Picnic Dots; summer only: Reef Day, Lido Afternoon, Promenade |
| Saltline Outfitters | Squall Line (new), Harbour Shift, Dock Hand, Ridgeway, Trailhead |
| Otterline Boathouse | Dawn Row (new), Practice Day, Tiebreak, Match Day, Studio Hour |
| Brim & Buckle (sets) | Derby Day, The Riviera, City Gent, Left Bank |
| Little Lantern | Block Print Day (new), Studio Hours, Meadow Walk, Saffron Market, Allotment Saturday |
| Thread & Co. | Weekend Breton, Pleats and Flats, Nine to Five, Sage Saturday, Mod Teal |
| Marigold & Main | Emerald Evening, Ivory Power, Cornflower Cocktail, Garden Party, Gilded Gala |
| Ink & Ivy Vintage | Grandad's Cardigan, Colour-Block Commute, Flower Power, Rodeo Summer |
| Thread & Co. Outlet | All Black Basics, Sofa Sunday, Candy Pop, Stone and Chalk |
| Kicks | Courtside, Grass Court, Sole Club |
| Bloom Beauty | Spotlight, Cherry Cocktail, Jet Set |
| Iron Maple Gym | Leg Day, Trail Before Work, Court Session |
| Otters Team Store | Home Game, The Letterman, Warm-Up |
| Hotel boutique | Tea at Two, Cocktail Hour, Ballroom |
| Market stalls | Indigo Dip, Picnic Blanket, Thrift Ringer |

- **Where the player finds them:** the till's chooser has a new first option "Outfits", and every rack window has an "Outfits · n ready-made looks" button. The Outfits window lists the looks on your own character with the price; a look opens its sheet: the mirror (tap to turn), every piece with its own price button, "Buy the look · $sum".
- **Price:** the sum of the pieces you do not own yet, one payment. Owned pieces are marked "Owned". When you own it all, the button becomes "Wear it now".
- **Stock:** a piece that is part of a shop's look never rotates out of that shop.
- **Seasons:** a look with seasonal pieces is offered only in that season.
- **Validation:** `validate.mjs` now fails if a look names a missing piece, a piece that shop does not sell, a catalogue exclusive, two pieces for one slot, a seasonal piece outside the look's season, a look without top + bottom (or dress) and shoes, or a shop with fewer than 3 looks in any season or more than 6.

Two deviations to decide on (owner question 1): the shoe shop and the hat shop sell no full wardrobe, so their looks are **sets** (shoes + socks + belt; hat + scarf + bag + glasses) shown on your own clothes.

## 4. Mannequins
- `furn.cs.manq` (`src/art/venue/clothing_stores_art.js`): the character renderer draws the look on a flat-toned figure with no hair and no face (white, black, wood or gold), on a small stand. It is an ordinary placed object, so the sprite is cached and the night-light pipeline lights it as a whole.
- The new stores have 1 to 3 each (21 in all). The old painted dummies in Thread & Co. (4), Marigold & Main (3), Ink & Ivy Vintage (1) and the Galleria bays of Thread & Co. Outlet (2) and Kicks (1) are replaced on the same spot at run time.
- Which look a mannequin wears changes every Monday; mannequins side by side wear different looks.
- Tap a mannequin: the same look sheet.
- No mannequins: Bloom Beauty's bay, the gym, the team store, the hotel boutique, the market stalls (they have none on the floor today).
- One line was added to the character engine for this (`manq` in `src/art/chars/char.js`: skips the face).

## 5. New pieces (25, in 7 signature looks, each sold on its own)
Shapes in `src/art/chars/wear_cs_new.js`, rows in `src/data/clothing_new.js`. All are in store only, at their brand's new shop.

| Look | Pieces |
|---|---|
| The Morning Suit (Hollowell) | Morning Coat, Dove Grey · Wing-Collar Shirt and Claret Cravat · Cashmere-Stripe Morning Trousers · Homburg, Pearl Grey · Co-Respondent Shoes, Cream and Tan |
| After Midnight (Nightjar) | Midnight Fringe Dress · Sequin Capelet, Plum · Feathered Headband, Gold · T-Strap Dance Heels |
| Hearthside (Juniper & Rye) | Hearthside Yoke Jumper, Rust · Shawl-Collar Toggle Cardigan, Oatmeal · Striped Bobble Hat, Forest and Oat · Sheepskin Hearth Boots |
| Boardwalk (Tidepool) | Hibiscus Camp Shirt, Coral · Breaker Shorts, Aqua · String Beach Bag |
| Squall Line (Saltline) | Squall Oilskin Long Coat, Yellow · Harbour Guernsey, Navy · Deck Boots, Navy and Yellow |
| Dawn Row (Otterline) | Crew Zephyr, Cream and Red · Splash Jacket, Red and Black · Regatta Racers |
| Block Print Day (Little Lantern) | Patchwork Pinafore, Indigo and Marigold · Block-Print Kerchief, Marigold · Knot Bundle Bag, Indigo |

25 new shapes (5 tops, 5 outerwear, 2 dresses, 2 bottoms, 5 shoes, 4 hats, 2 bags). The signature looks are completed with existing pieces (for example Squall Line uses the existing sou'wester and sailor trousers). Weakest: the homburg reads as a wide-brimmed hat at game scale; the shawl cardigan is subtle over a pale top.

## 6. How each thing was checked
**Played by touch** (Playwright, hasTouch + isMobile, 390x844, on `dist/index.html`; a script taps, I looked at the screenshots):
- All ten stores: tapped the door from the street and went in, tapped a rack and bought one piece with "Buy now", tapped the till, "Outfits", a look, "Buy the look", tapped a mannequin and bought its look, tapped the shopkeeper (line shown), tapped the exit (back on the doorstep). All ten passed every step, with these notes:
  - Inside Otterline and Brim & Buckle the walk to each fixture was pathfinding; the taps on the fixtures were touch. In the other eight the walking was floor taps too.
  - At Cobble & Sole the mannequin wore the set just bought at the till, so its "Buy the look" was tested in a second run a week later (passed).
  - The Hollowell door needed up to four taps in one run: that corner is crowded and a tap can land on a passer-by. The doors of the new stores got a larger tap radius afterwards.
- Closet app: tapped Phone, Closet, Shops, the catalogue, "In store", searched, tapped Hearthside Yoke Jumper: the box names "Juniper & Rye Knitwear (Hillcrest) · $47 · Open now · 610 m". "Take me there", then WALK: phone closed, waypoint set to the store. The 610 m walk was pathfinding; then the door by touch, and the piece was on the rails. Same for the Midnight Fringe Dress to Nightjar.
- 375x812: Juniper & Rye and Nightjar played through (all steps passed); the Outfits window and the look sheet do not overflow (buttons 36 px high or more).
- Fake gamepad (`tools/pad_lib.mjs`), Juniper & Rye: walk to the door, in, rack, buy a piece, till, Outfits, buy a look, mannequin, buy its look, exit: 8 of 8 steps, focus ring only.
- Old shops: tapped a mannequin and bought its look at Thread & Co., Marigold & Main, Ink & Ivy Vintage and the Outlet bay in the Galleria.

**By script / API:** weekly rotation (looks change after 7 days, labels follow); a look with one piece owned costs the rest ($279 -> $232) and cannot be bought twice; not enough money buys nothing; a closed store refuses with its hours; save inside a store and reload starts without errors; looks of the gym, team store and hotel boutique bought through `buyLook`.

**Looked at:** `out/shots/cs_<store>.png` (ten whole rooms at 390x844) and `cs_sheet.png` (all ten side by side: no floating fixtures, no blocked doors, keepers behind their counters, signs readable, ten different rooms); the ten shopfronts by day and three by night (`cs_front_*`, `cs_night_front_*`: lit signs and door glow); `cs_night_nightjar.png`, `cs_night_hollowell.png` (mannequins lit like the people next to them); `cs_newpieces.png` (25 pieces x 11 poses: front, three other directions, walk, run, sit both ways, dance, talk) and contact sheets of all 85 looks. Fixed after looking: mannequins sinking into display platforms, dark dummies in dark clothes, a feather that read as rabbit ears, the homburg's crown, and shoe walls that lose their shoes on the left wall (an old bug of `furn.clothing.shoewall` when flipped: the new rooms use their own `furn.cs.shoewall` there; Marigold's is on the back wall and fine).

**Checks:** `validate.mjs` OK (1,391 pieces, 85 looks); build OK; `navcheck --rooms all` all passed, 0 page errors; `instore_check` OK (60% of clothes in store); `perf --verify` same pixels; `nightcheck` all passed; lookbehind grep 0; every play run 0 page errors.

## 7. Size
`dist/index.html`: 14,945,590 bytes before, 15,027,433 after: **+82 KB** of the +350 KB budget (other workers' changes in the same period are inside that number). My new source files are 106 KB unminified.

## 8. What is left
- Tidepool is thin outside summer (57 of its pieces are summer stock): three looks all year, six in summer.
- Bloom Beauty, the gym, the team store, the hotel boutique and the market have looks but no mannequin.
- The shopkeepers only talk; they are not cast members and have no schedule.
- The rowing machine and treadmill at Otterline are decoration (the machine activities only exist in the gym).
- Saltline Outfitters shares the Salt & Co warehouse with the Chandlery (different fronts).
- The guide / Wander entries exist through `registerInfo`; no Opportunity, first-time card or map tip points at the new stores yet.

## 9. Owner questions
1. The shoe shop and the hat shop offer **sets** (shoes + socks + belt; hat + bag + scarf + glasses) instead of whole outfits, because they sell nothing else. Keep it, or give them a small rail of clothes so their looks are complete?
2. Team merch now has its guaranteed home at Otterline Boathouse instead of the gym. Should The Otter Den at the arena be the home of the Otters pieces instead?
3. Six stores sit in buildings that already hold something else (a second door). Is that fine, or would you rather have fewer stores in the centre?
4. Should the tailor and the others get proper cast shopkeepers (schedules, friendship) later?

## 10. API
- `src/data/clothing_stores.js`: `STORES`, `STORE_BY_ID`, `homeShop(piece)`, `alsoAt(piece)`, `reanchor(CATALOG)`.
- `src/data/clothing_outfits.js`: `OUTFITS`, `LOOK_BY_ID`, `PARTIAL`, `lookPiece(id, shop)`, `looksFor(shop, season)`, `checkOutfits()`.
- `src/data/clothing_new.js`: `NEW_PIECES`, `NEW_IDS`.
- `G.clothingStores` (`src/sim/clothing_stores.js`, order 57.75): `stores()`, `isOpen(id)`, `hoursText(id)`, `enter(id)`, `looks(shop)`, `lookPrice(shop, look)`, `outfits(shop)`, `lookSheet(shop, lookId)`, `buyLook(shop, lookId)`, `mannequinLook(shop, i)`. Events `cs:look`, `cs:buylook`, `cs:talk`.
- `G.clothesShop.buyMany(ids, shop, label)` (new).
- Room defs: `clothingStore: true`, `keeper` character at `scene.keeper`; mannequin items `furn.cs.manq` with `mq: n`.

## 11. Files
New: `src/data/clothing_stores.js`, `clothing_outfits.js`, `clothing_new.js`; `src/sim/clothing_stores.js`; `src/scenes/rooms/clothing_stores.js`; `src/art/venue/clothing_stores_art.js`; `src/art/chars/wear_cs_new.js`; this report.

Edited:
- `src/data/clothes.js`: the catalogue takes the new pieces and runs `reanchor`.
- `src/data/instore.js`: `STORE_PIECE` = the new ids.
- `src/data/validate.mjs`: the outfit check.
- `src/sim/clothes_shop.js`: the new shops in `VENUE`, look pieces always in stock, `buyMany`, the Outfits entries.
- `src/ui/shop.js`: the till and stall handlers call `G.shop.open` instead of the local `open`. Before this the clothes chooser never appeared at a till inside a room (the wrapper was bypassed), so the tills of Thread & Co., Marigold, Ink & Ivy and the gym's front desk now ask "Outfits / Clothes / Everything else (Front desk)" first: one more tap to reach the classic window.
- `src/art/chars/char.js`: the `manq` flag (two lines).

## 12. For the lead
- Nothing has to be added to `unique_rooms.js`: the rooms register themselves and call `registerInfo`.
- Store ids are `cs_<key>` with an underscore on purpose: `rootOf()` in `sim/navgoals.js` only treats `home | pub | lobby | goods` as two-part ids, so `cs:<key>` made navcheck see one building with ten rooms.
- `tools/instore_check.mjs --verbose` prints hours for a fixed list of shops; the new ones are not in that list (the check itself covers them).
- Not updated by me: STATUS, BACKLOG, HISTORY, `docs/reports/instore.md` (its "which store carries" table is now section 2 here), `enterable_buildings.md`.
