# In-store-only furniture and clothes (owner msgs 167-168, BIBLE "Direction update 35")
Owner: "You shouldn't be able to buy everything ... There should be a reason to have to go to the stores ... you still can see everything, but it says only available in store for some items ... it'll tell you where it's available and it'll take me there option will appear." The same goes for the clothes app.

## The rule (deterministic, written in `src/data/instore.js`)
No randomness: the result depends on tier, brand and tag, plus explicit override lists. The rule is applied once when the module loads.

**Home goods** (`data/goods.js`, 697 goods in 412 families). The rule decides per family, so every colourway of a piece gets the same answer.
1. The override lists `STORE_GOODS` / `ONLINE_GOODS` win. Festival and seasonal pieces are in store only: the Christmas tree, carved pumpkin, winter berry wreath, Maple Bay snow globe, paper star lantern, Moroccan floor lantern and the Orbit egg chair.
2. A family sold only at Atelier Nord and/or The Gilded Attic is in store only (designer showroom pieces, one-of-a-kind antiques).
3. In each of the 16 categories, the cheapest 42% of families (`ONLINE_SHARE`) can be ordered. The dearer, larger and nicer families are in store only.
4. The cheapest family in every category can always be ordered.

**Older tiered home goods** (`items.js` `*_t0 / _t1 / _t2`, sold at Nest & Wire and in the home computer's online shop):
- t0 and t1 can be ordered online; t2 is in store only.
- Untiered pieces are in store only from $300 up.

**Clothes** (1,366 pieces). The rule decides per piece:
1. The override lists `STORE_PIECE` / `ONLINE_PIECE` win. Both are empty today.
2. Catalogue exclusives (`online: true`, sold nowhere else) stay online.
3. Seasonal pieces are in store only.
4. Boutique and signature brands are in store only: Marigold, Hollowell & Sons, Nightjar, Juniper & Rye, Second Wind (vintage) and Little Lantern (handmade). These are what Marigold & Main, Ink & Ivy, the market and the hotel boutique are for.
5. Otters team merch is in store only (the team store, the gym and Kicks).
6. All of Maple Basics can be ordered.
7. For every other high-street brand, the rule looks at each brand + slot (accessories by kind): the cheapest 75% (`PIECE_SHARE`) can be ordered and the dearest 25% are in store only.
8. The cheapest non-seasonal piece of every slot / accessory kind can always be ordered.

**Scripted pieces:** none. I checked the story, chapters, Opportunities, first-time cards, tips and the guide: none of them tells the player to order a particular piece online. Chapter 5's purchase happens in The Gilded Attic, a physical shop. `SCRIPTED` is in place for future scripted pieces: any id listed there stays orderable.

**Stock:** an in-store-only clothing piece is now always on the rails at its first indoor shop (`anchorShop`: indoor shops come before the market stalls). Other shops still rotate it weekly as before. Seasonal pieces are stocked in their season only.

## The split (from `node tools/instore_check.mjs`, counted in the built game)
| Home goods | Goods | In store | Families | In store | Orderable families |
|---|---|---|---|---|---|
| Seating | 90 | 52 (58%) | 35 | 20 | 15 |
| Tables & desks | 50 | 28 (56%) | 28 | 16 | 12 |
| Beds | 32 | 18 (56%) | 16 | 9 | 7 |
| Storage | 52 | 30 (58%) | 32 | 19 | 13 |
| Lighting | 68 | 41 (60%) | 35 | 20 | 15 |
| Plants | 49 | 28 (57%) | 40 | 23 | 17 |
| Outdoor | 38 | 21 (55%) | 23 | 13 | 10 |
| Rugs | 45 | 28 (62%) | 20 | 12 | 8 |
| Wall decor | 57 | 33 (58%) | 34 | 20 | 14 |
| Electronics | 45 | 26 (58%) | 32 | 19 | 13 |
| Kitchen | 48 | 28 (58%) | 31 | 18 | 13 |
| Decor | 39 | 23 (59%) | 28 | 16 | 12 |
| Hobby | 33 | 20 (61%) | 24 | 14 | 10 |
| Bath | 21 | 12 (57%) | 13 | 8 | 5 |
| Fitness | 13 | 7 (54%) | 10 | 6 | 4 |
| Instruments | 17 | 9 (53%) | 11 | 6 | 5 |
| **All** | **697** | **404 (58%)** | **412** | **239 (58%)** | 173 |

The older tiered home goods add 20 of 66 in store only (30%: the t2 tier, plus the aquarium). Counting them in, furniture and decor together are 424 of 763 in store only (56%).

| Clothes | Pieces | In store |
|---|---|---|
| Tops | 309 | 174 (56%) |
| Outerwear | 215 | 127 (59%) |
| Dresses | 119 | 82 (69%) |
| Bottoms | 203 | 127 (63%) |
| Shoes | 158 | 88 (56%) |
| Hats | 150 | 97 (65%) |
| Neckwear | 53 | 35 (66%) |
| Glasses | 30 | 14 (47%) |
| Bags | 46 | 23 (50%) |
| Gloves | 15 | 8 (53%) |
| Socks | 15 | 6 (40%) |
| Watches | 15 | 3 (20%) |
| Belts | 15 | 7 (47%) |
| Tights | 14 | 7 (50%) |
| Earrings | 9 | 5 (56%) |
| **All** | **1,366** | **803 (59%)** |

Before this change the Closet catalogue offered only 424 pieces (31%) and did not show the other 942 at all. Now it lists all 1,366 and 563 of them can be ordered.

By brand (in store / total):
- Marigold 106/111, Hollowell 83/84, Nightjar 93/104, Juniper & Rye 72/72, Second Wind 102/117, Little Lantern 91/92
- Otterline 67/97, Tidepool 63/93, Thread & Co. 36/122, Fern & Field 27/84, Pixelpop 22/122, Saltline 21/72
- Kicks Lab 8/48, Lacquer 7/46, Maple Basics 5/102 (the 5 are seasonal)

## Which store carries the in-store pieces
**Home goods:** every in-store good is on the floor and at the counter of at least one of the 13 goods stores. All 13 are enterable, routable and open daily, from 07-11 until 18-21.

In-store goods per store (each good counted at its first verified store):

| Store | Goods |
|---|---|
| Bellwether | 73 |
| Gilded Attic | 72 |
| Atelier Nord | 60 |
| Spoke & Strum | 58 |
| Timber & Trowel | 51 |
| Voltaic | 48 |
| Kestrel & Pine | 46 |
| Warp & Weft | 45 |
| Leaf & Loam | 38 |
| Lumen | 38 |
| Fjord & Fold | 37 |
| Copper Pan | 29 |
| Sleepyhead | 27 |

The older t2 pieces are at Nest & Wire (downtown counter) and Nest & Wire Home (Galleria).

**Clothes:** each in-store piece is anchored at its first indoor shop.

| Shop | Pieces |
|---|---|
| Marigold & Main | 282 |
| Thread & Co. | 129 |
| Ink & Ivy Vintage | 102 |
| Iron Maple Gym | 90 |
| Thread & Co. Outlet (Galleria) | 90 |
| Old Town Market | 91 (Little Lantern / Tidepool also have an indoor shop) |
| Kicks | 8 |
| Bloom Beauty | 7 |
| Otters Team Store | 4 |

Opening hours on Monday:

| Shop | Hours |
|---|---|
| Thread & Co., Marigold & Main | 10-19 |
| Ink & Ivy Vintage | 11-19 |
| Galleria bays | 10-21 |
| Iron Maple Gym | 6-22 |
| Otters Team Store | 10-23 |
| Hotel boutique | 8-22 |
| Market | 8-19 |

**Orphans found: none.** The check script found no in-store piece without a reachable, sensibly-open shop that sells it. One near-orphan risk was fixed by design: the weekly rotation hid a piece at a shop one week in four, so an in-store-only piece is now always in stock at its anchor shop.

## What the player sees
- **Roomy** (`src/ui/phone_home.js`):
  - Lists show every piece. In-store pieces have a dark "Only in store" tag under the price. A row of filter buttons reads All / Order online / In store.
  - The piece page replaces "Who sells it" with an "Only available in store" box listing up to 3 shops, nearest first. Each entry shows name, district, price there, Open now (or "Opens tomorrow at 10:00"), distance, a "Take me there" button, and "Add to My Day" when the shop is closed.
  - "Add to cart" becomes "Only in store · Take me there" in the same place, so the layout does not jump.
  - In the wish list, the Cart button becomes Store. The hero line says how many pieces can be delivered.
  - `G.orders.add` refuses in-store pieces with a toast naming the shops.
- **Closet** (`src/ui/phone_closet.js`):
  - "The Closet catalogue" now lists all 1,366 pieces, with an "In store" corner tag and the same All / Order online / In store filter.
  - A piece page swaps "Order" for "Only in store · Take me there" and shows the same store box. An out-of-season piece says "On the rails in summer".
  - `G.clothesShop.order` refuses in-store pieces.
- **Design mode** (`src/ui/furnish.js`):
  - Shop tiles carry an "In store" badge. You can still try an in-store piece in your room.
  - Its "Add to cart" becomes "Only in store": a tap puts it on the Roomy wish list and a toast names the shops.
  - Leaving design mode does not offer to cart in-store try pieces.
- **Home computer online shop** (`G.shop.open('homegoods', { online: true })`, `src/ui/shop.js`): Buy becomes "In store", which closes the window and opens the route card. The row's text names the shops. `buy()` refuses as well.
- **Take me there** uses the existing `G.phone.routeTo(placeId)`: the Map's "How will you get there?" card (walk / bus / train / cab). Tapping a mode starts the guidance and closes the phone, exactly like every other Take me there. If there is no route, it falls back to a waypoint plus closing the phone.
- **Unaffected:**
  - Owned pieces.
  - Carts and parcels from old saves: `norm()` keeps the lines and checkout does not re-check them.
  - Pending clothes orders, gifts, rewards, in-store buying, and the counters.
  - ZipEats (food) and the media apps.

## Apps reviewed
| App | What it sells | Changed? |
|---|---|---|
| Roomy | home goods | yes |
| Closet | clothes | yes |
| Design mode Shop tray | home goods | yes |
| Home computer "online shop" (Nest & Wire online) | home goods | yes |
| ZipEats | food | no: food was out of scope |
| Appy | apps | no |
| Pages / Reel / Playbox | media | no |
| Maple Post | stamps / post | no |
| Nestly | homes | no |
| MapleCab | rides | no |
| Bank | | no |
| Porchlight | | no |

## API
- `src/data/instore.js`: `goodOnline`, `familyOnline`, `itemOnline`, `pieceOnline`, `applyClothes`, `anchorShop`, `splitGoods`, `splitClothes`, override lists, `ONLINE_SHARE` 0.42, `PIECE_SHARE` 0.75, `RULE_TEXT`.
- `G.instore` (`src/sim/instore.js`, order 61.5): `online(id)`, `where(id, n)` -> rows nearest first `{ shop, venue, place, name, district, districtName, d, dist, open, opens, opensT, inStock, season }`, `whereText(id)`, `take(placeId, name)`, `plan(row)` (planner stop at the next opening), `refuse(id)`, `hours(venueId)`, `venue(id)`, `pieces()`.
- `src/ui/phone_instore.js`: `storeTag`, `storePanel(id, { price })`, `storeButton(id, { cls })`, `availBar(st, redraw)`, `availOk`.
- To move a piece, add its id to `STORE_GOODS` / `ONLINE_GOODS` / `STORE_PIECE` / `ONLINE_PIECE` (or `SCRIPTED`), then re-run `node tools/instore_check.mjs`.

## How it was checked
**Played by touch** (Playwright, hasTouch + isMobile, 390x844 and again at 375x812, on `dist/index.html`; script `scratchpad/is/play.mjs`).

Roomy, from Old Town:
1. Tapped the HUD Phone button, then Roomy, Lighting, and the "In store" filter. Tapped Paper Star Lantern: the page shows Lumen (650 m), Warp & Weft and Fjord & Fold.
2. `G.orders.add` was refused.
3. Tapped "Take me there": the route card opened. Tapped WALK: the phone closed and the arrow pointed at Lumen.
4. The player walked the route by pathfinding to the waypoint door (7 s real, not by finger), so the route itself was walked by script.
5. Tapped "Go in: Lumen Lighting", tapped the lantern on the shop floor, and tapped Buy · $22: it went into the bag.

Closet, from downtown:
1. Opened Shops, then the catalogue (1,366 pieces), then the In store filter. Typed the name into the search box by script.
2. Tapped Fireside Roll-Neck (Juniper & Rye): Thread & Co. 230 m, Marigold & Main.
3. Order was refused. Take me there opened the route card, then WALK, the walk, and the door.
4. Tapped "Browse the tops": the piece was on rack 0. Tapped it, then Buy now $45: owned.

Online, as before:
- Roomy: Beds, then "Order online", a $95 bed, Add to cart, Cart, Order: 1 parcel, paid $100.
- Closet: catalogue, then "Order online", a piece, Order $18: 1 order.

By API with screenshots (`scratchpad/is/extra.mjs`):
- At 22:00 the store box says "Opens tomorrow at 10:00". Add to My Day (tapped) made "Shopping: Lumen Lighting" at 10:00 tomorrow.
- The home computer online shop: 41 of 102 home rows say "In store".
- Design mode with an in-store try piece: "Only in store" was tapped, the piece was wish-listed, and leaving did not cart it.
- Old save: an in-store cart line still checks out. A pending clothes order for an in-store piece is still delivered.
- An out-of-season piece shows its season.

Screenshots I looked at (`out/shots/instore_*.png`):
- roomy_filter_instore, roomy_item, roomy_route, roomy_at_door, roomy_sheet
- closet_catalogue, closet_item, closet_detail
- roomy_list_375, closet_item_375
- closed_added, computer_shop, design_tapped

Also taken: home, list, walking, in_store, bought, cart, ordered, the 375 set, debug.

**Script:**
- `node tools/instore_check.mjs` checks the split, the guarantees, and rule 2 for all 697 goods, 66 older pieces and 1,366 clothes: OK.
- `validate.mjs` OK, build OK (14,500 KB), `navcheck --rooms all` all passed with 0 page errors, `jobs_check` OK, lookbehind grep 0. Every play run had 0 page errors.

**Not verified:**
- A real phone.
- A bus, train or cab trip to a store (only WALK).
- The Galleria bays and the hotel / arena shops as the destination of a Take me there.
- Every in-store piece being on a specific rack (the till window always lists the whole stock).

## Owner questions
1. Is 58-59% in store the right amount? Two numbers in `data/instore.js` (`ONLINE_SHARE`, `PIECE_SHARE`) move it.
2. Should in-store-only pieces stay on the Roomy wish list with a reminder when you walk past the shop?
3. Some cheap pieces are in store only because they are seasonal or from a boutique brand (for example a $19 summer shirt). Is that right, or should price win?

## Files
- New: `src/data/instore.js`, `src/sim/instore.js`, `src/ui/phone_instore.js`, `tools/instore_check.mjs`, `docs/reports/instore.md`.
- Edited:
  - `src/sim/orders.js`: `add` guard.
  - `src/ui/phone_home.js`: Roomy.
  - `src/ui/furnish.js`: design mode.
  - `src/ui/shop.js`: the online window only. PAD HOOKs are untouched; the file has none.
  - `src/sim/clothes_shop.js`: import, anchor stock, order guard, detail button.
  - `src/ui/phone_closet.js`: catalogue, piece page.
