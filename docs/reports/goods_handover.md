# Wave C goods + home-goods stores: HANDOVER (second worker, stopped on the lead's instruction)

Status: the catalogue, the system wiring, 13 store rooms and the city doors are built and the build passes. Nobody has looked at any store at phone size yet. The screenshots `out/shots/gk_r_timber.png` and `gk_r_fjord.png` were taken but never opened. None of this is committed (no git commands were run).

## Inherited from the first worker: inspected and KEPT
- `src/data/goods.js`: 697 goods and 13 stores, with every good drawn. The scratch check (`scratchpad/goods/check.mjs`) reports 0 problems: ids and names are unique, art and kinds exist, every render is pixel-distinct, and place matches wall/floor.
  By category: seating 90, tables 50, beds 32, storage 52, lighting 68, plants 49, rugs 45, wall 57, electronics 45, kitchen 48, decor 39, hobby 33, music 17, fitness 13, bath 21, outdoor 38.
- `src/art/goods/{_lib,beds_storage,hobby_bath_out,lamps,plants,rugs_wall,seats_tables,tech_small}.js`: parametric families `furn.home.g.<family>` (p.k = kind). I viewed the contact sheets for seating, lighting, electronics, kitchen, hobby and plants. They are fine, so I redrew nothing. Small surface items (kettles etc.) are tiny at 1x, which is realistic.
  Sheets for every category are in `scratchpad/goods/sheets/*.png` (script: `scratchpad/goods/catsheet.mjs <cat> 2 14`).
- `src/sim/housing.js` diff (`unlocked` honours `G.dev.all`): this is NOT from the goods worker (devmode). I left it alone.

## My edits to inherited files
- `src/data/goods.js`:
  - Renamed the plant shop from `goods:fern` "Fern & Frond" to `goods:loam` "Leaf & Loam Plant House", because the Galleria already has a Fern & Frond bay.
  - Added `SITE_INFO`, which sets `district` and `where` on every store.
  - Moved Copper Pan's site to Maplewood.

## New files (all mine)
| file | state |
|---|---|
| `src/art/goods/store.js` | done. Store fixtures `furn.goods.*`: dtable, bench, plinth, partition, racking, hangsign, arrow, cart, pallet, stand, tvwall. Viewed in a gallery (`out/gallery/g_store.png`). The arrow was redrawn after that and has not been re-checked. |
| `src/sim/goods.js` | done, untested in play. Order 57.6. Registers the items, the art mapping (VIS) and the store records; contains buy, the shopping bag, the lamp switch, the `gdisp` / `glamp` tap handlers and the `G.goods` API. |
| `src/sim/goods_sheet.js` | done, NEVER opened on screen. The inspect sheet: picture, colour swatches, price, facts, and Buy / Try it / Not now. Uses an injected `<style>`. |
| `src/sim/goods_city.js` | done. Order 57.7. SITES table, door pois, lit sign boards, the Fjord & Fold repaint, the new big-box building, and the city tap targets with an opening-hours check. |
| `src/scenes/rooms/goods_lib.js` | done. Layout engine `storeRoom(spec)` with zone kinds rows / set / table / wall / flat; caps the crowd at 12 customers plus staff. |
| `src/scenes/rooms/goods_stores.js` | done, not looked at. Specs for timber, fjord, bellwether, lumen, voltaic, loam. Exports SPECS. |
| `src/scenes/rooms/goods_stores2.js` | done, not looked at. Specs for attic, warp, copper, nord, kestrel, sleepy, spoke; `init()` builds every room. |

No edits to `housing.js`, `furnish.*`, `apps.js` or any other team's file. Goods reach housing by mutating its exported `VIS` and `ITEMS` / `ITEM_BY_ID` from my module.

## Stores and where each is placed (door pois `door:<store id>`, room id = store id)
All doors were confirmed to exist by a run. Coordinates are approximate door positions.
- `goods:timber` Timber & Trowel (big-box):
  - The ONE new building: `bld.ind.warehouse.corrugated` with params w18 d12, orange, sign "TIMBER & TROWEL HOME CENTRE".
  - It sits on empty grass at x8 y254, west of Old Town, by Old Town station. Trees standing on the lot (+1 margin) are removed at runtime.
  - Door at (27, 260), on the east side. Not yet looked at.
- `goods:fjord` Fjord & Fold: the existing COLD STORE warehouse at (219, 331), harbor. Repainted at runtime (wall blue, accent yellow, name FJORD & FOLD). Door (229, 335).
- Old Town 2-floor rows:
  - `goods:bellwether`: rowhouse.bay at (70, 214); door (79, 215).
  - `goods:lumen`: stucco at (126, 215); door (129, 220).
  - `goods:attic`: timber at (74, 253); door (75, 261).
  - `goods:warp`: stucco at (72, 246); door (79, 247).
  - `goods:loam`: mansard at (33, 230); door (41, 231).
- Maplewood houses:
  - `goods:voltaic`: duplex at (274, 145); door (278, 152).
  - `goods:spoke`: bungalow at (283, 158); door (285, 165).
  - `goods:kestrel`: craftsman at (273, 281); door (280, 289).
  - `goods:sleepy`: splitlevel at (343, 220); door (348, 227).
  - `goods:copper`: gablehouse at (273, 158). This was moved there after the original rowhouse had no reachable doorstep. The new door has NOT been verified.
- Hillcrest: `goods:nord`, cliffhouse at (96, 100); door (100, 108).
- Counters only (buy menu), stocked through `soldAt`: `homegoods` (Nest & Wire, 30 electronics and floor lamps), `mall:fern` (24 plants up to $160), `mall:nest` (30 small Bellwether decor pieces).
- Rows / houses get a lit `furn.pshop.sign` board placed in the city over the door (z = building base + 2.25). Never looked at; it may float or clip.

## Wiring
- **Items:** every good becomes `{ id: 'g_*', category: 'homegood', price, soldAt: stores, tag, tier, footprint, placement, bonus: { mult, ambience }, good: 1, cat, style }`. It is pushed to ITEMS / ITEM_BY_ID (NOT HOMEGOODS). `VIS[id] = { a: art, p, mount }`.
- **What a placed good can do:** comes from the art tags (g.seat → seat/sofa, g.tv → tv, ...), through activities.tagsFor.
- **Stores:** every store is a venue in VENUES + VENUE_BY_ID: type shop, `priceMult` = store.mult, hours from data, `goods: true`. The counter (`furn.homegoods.counter`, tag `till`) opens `G.shop.open(storeId)`, which shows the whole range (delivered).
- **Physical shopping:**
  - Display pieces are room items with `tags: ['gdisp'], gd, gs`. Tap → `openSheet`.
  - The sheet shows the family's colourways at that shop; seats and beds get "Try it" (4-minute sit / lie).
  - Generic activity / seat tap targets on display pieces are removed on 'scene' (`def.goodsStore`).
- **Buy:** `G.goods.buy(goodId, storeId)` → `G.money.pay`.
  - `carry` goods go into `G.state.goods.bag` (max 8), which empties into home storage on entering your home (`addFurniture instant`).
  - Other goods use `G.housing.addFurniture` (tomorrow 09:00).
  - Emits `goods:buy` (goodId, storeId, price, 'bag' | 'delivery') and `shop:buy`.
- **Lamps:** placed lamp goods (tag `glamp`) at home show "Switch on/off". The state is `G.state.goods.off[uid]`; it is applied on `room:build` by swapping `ob.p.on`, clearing `ob._key` and removing / restoring `world.lights`.
- **`G.goods` API:**
  - stores(), store(id), stock(id), price(goodId, storeId), whereSold, isOpen, hoursText
  - inspect(goodId, storeId, fx), buy, bag(), unpackBag(), lampOn(uid), setLamp(uid, on), sites(), BAG_MAX
- **State:** `G.state.goods = { bag, off, bought, spent, visits }`, normalised on load.
- **Events:** `goods:buy`, `goods:bag`, `goods:lamp`, `goods:visit`.

## Verified by running
- `node tools/build.mjs` passes; `node src/data/validate.mjs` passes.
- In the city, all 13 door pois exist and were found by `G.goods.stores()`. The Copper Pan door was moved after that run and is not re-checked.
- An eval entered all 13 rooms:
  - 819 of 903 families are on display (the rest are only at the counter). Per store, shown / hidden: timber 70/3, fjord 98/11, bellwether 110/7, lumen 36/0, voltaic 58/7, loam 62/2, attic 89/12, warp 33/15, copper 47/2, nord 56/8, kestrel 50/4, sleepy 38/5, spoke 72/8.
  - Every display had a tap target.
  - Every display's use spot was pathable from the entrance.
  - No solid pieces overlapped.
  - 1 staff spot per room.
  - 60 fps in timber and fjord, at a 390x844 viewport.
- The crowd cap was added after the eval and has not been re-run.

## NOT verified / known risks
- No screenshot of any interior, sign, door or the big-box has been looked at.
- No real tap on a display, the sheet, buying, "too little money", "bag full", bag unpacking at home, or delivery.
- No good placed and used at home, and no lamp toggle.
- No save → load, and no old save without `G.state.goods`.
- Zero-page-error state is unknown after the latest edits.
- Possible depth-sort issues for items standing on display tables (z = table height, solid: false).
- Wall sign boards on Maplewood / Hillcrest houses may sit at the wrong height.
- The Timber & Trowel door is on the east side.
- Lumen has about 36 light pools in one room (fps not measured).
- `routeTo` / nav-arrow targets for stores have not been checked.
- `data/goods.js` header still mentions the earlier file plan.

## What remains (exact)
1. Screenshot and look at all 13 interiors at 390x844 (zoomed and default); fix layout and visual problems; re-run the diag eval (`scratchpad/goods/diag.js`, run via shot.mjs `--eval "$(cat ...)"`).
2. Look at every store door and sign in the city, including the big-box lot near Old Town station and the Copper Pan door at (273, 158).
3. Drive physical shopping end to end:
   - tap a display, switch colours in the sheet, buy small and big pieces, try "Try it";
   - cases: too little money, bag full, closed store;
   - bag unpacking at home, next-day delivery, unbox.
4. Place at least six goods at home through Decorate and use them (sofa sit, TV watch, lamp switch, bed sleep, plant water, rug).
5. Save → load; an old save without `goods` state; check for zero page errors; measure fps in timber, fjord and lumen.
6. Icons (`src/art/icons/goods.js`): not started. Furnish thumbnails fall back to the sprite.
7. Final report `docs/reports/goods.md`, and lead hooks if any. Currently none needed: everything self-registers. An apps.js row is not needed.
