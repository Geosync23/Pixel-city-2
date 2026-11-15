# Home goods + home-goods stores (Wave C item 1): condensed report
Full API in the headers of `src/sim/goods.js`, `goods_city.js`, `goods_sheet.js`, `src/scenes/rooms/goods_lib.js`, `src/data/goods.js`. Supersedes `goods_handover.md`.

## What exists
- **Catalogue** `src/data/goods.js`: 697 goods, every one drawn and pixel-distinct (seating 90, tables 50, beds 32, storage 52, lighting 68, plants 49, rugs 45, wall 57, decor 39, electronics 45, kitchen 48, hobby 33, music 17, fitness 13, bath 21, outdoor 38).
  Row fields: id (`g_*`), name, price, cat, style, place (floor / wall / surface), tag (function), tier, art + p, family + colour (colourways), stores, tags, carry, lamp, mount, ambience. Helpers `GOOD_BY_ID`, `goodsAt(storeId)`, `familyOf(id)`, `STORES`, `CATS`.
- **Art** `src/art/goods/*`: about 400 kinds in parametric families `furn.home.g.<family>` (`p.k` = kind): lampf / lampt / lampw, plant / plants / plantw, seat, table, bed, store, books, rug, wall, tv, audio, game, pc, gadget, small, kit, hobby, inst, fit, art, bath, out, outseat. Store fixtures `furn.goods.*` in `store.js`.
  Contact sheets: `node <scratch>/goods/sheet.mjs out.png 3 10 g.seat g.table`.
- **Icons** `src/art/icons/goods.js`: a 16px icon for every good (shrunk from its own art, built on first use), 13 store emblems `store.goods:<key>`, 16 category glyphs `gcat.<cat>`.
- **13 stores** (room id = venue id = store id; door poi `door:<id>`):

| id | name | kind | price | where / how placed |
|---|---|---|---|---|
| goods:timber | Timber & Trowel Home Centre | big-box home improvement (32x24, racking, aisles, garden centre) | x1 | the ONE new building: corrugated warehouse 18x12 on empty grass at x 8-26, y 254-266 (west edge of Old Town). Door on the front at (17, 267), paved forecourt y 266-270 |
| goods:fjord | Fjord & Fold | flat-pack warehouse | x0.8 | existing COLD STORE warehouse (219, 331), harbor, repainted blue and yellow |
| goods:bellwether | Bellwether Department Store | department store, 4 departments (26x20) | x1.1 | rowhouse.bay (70, 214), Old Town |
| goods:lumen | Lumen Lighting | lighting | x1 | rowhouse.stucco (126, 215) |
| goods:attic | The Gilded Attic | antiques / thrift | x0.7 | rowhouse.timber (74, 253) |
| goods:warp | Warp & Weft | rugs / textiles | x1 | rowhouse.stucco (72, 246) |
| goods:loam | Leaf & Loam Plant House | plants | x1 | rowhouse.mansard (33, 230) |
| goods:voltaic | Voltaic Electronics | electronics | x1 | duplex (274, 145), Maplewood |
| goods:spoke | Spoke & Strum | hobby | x1 | bungalow (283, 158) |
| goods:copper | Copper Pan Kitchen Co. | kitchen / homeware | x1 | gablehouse (273, 158) |
| goods:kestrel | Kestrel & Pine | mid-century showroom | x1.15 | craftsman (273, 281) |
| goods:sleepy | Sleepyhead Beds & Linen | beds / bedding | x1 | splitlevel (343, 220) |
| goods:nord | Atelier Nord | designer showroom | x1.5 | cliffhouse (96, 100), Hillcrest |

  All converted buildings had no door before. Each gets a lit sign board over the door. Doors are added on the city 'scene' event at order 57.7 (after public places and lobbies, before places), so no other system's ids shift.
  A slice is also sold over three existing counters: `homegoods`, `mall:fern`, `mall:nest`.

## How it plays
- Every piece on a shop floor is the real good (fixture tag `gdisp`). Tap -> inspect sheet: picture, colourways this shop has, price, what it does, Buy, and "Try it" / "Lie down on it" for seats and beds.
- `carry` goods go into the shopping bag (8 max) and land in home storage when you walk in; the rest use `G.housing.addFurniture` (next day 09:00 as boxes).
- The counter ("Shop") opens the classic buy menu with the store's whole range.
- At home, through the existing Decorate mode: seats sit, beds sleep, TVs / stereos / games / instruments / exercise kit / easels / bookcases work through the art's function tags; plants are watered; lamps (tag `glamp`) switch on and off, remembered per piece.
- Small `surface` goods placed over a table, counter, dresser or console stand on top of it.
- Ambience of placed goods feeds `G.housing.ambience()`, so the new Comfort need rises with decoration (measured: 48 -> 74 with 11 goods).

## API / state / events
- `G.goods`: stores(), store(id), stock(id), price(goodId, storeId), whereSold, isOpen, hoursText, inspect, buy(goodId, storeId, { quiet }) -> 'bag' | 'delivery' | null, bag(), unpackBag(), lampOn(uid), setLamp(uid, on), surfaceZ(defs), sites(), BAG_MAX.
- State `G.state.goods = { bag, off, bought, spent, visits }` (normalised on load; an old save gets a blank one).
- Events: `goods:buy`(goodId, storeId, price, how), `goods:bag`(ids), `goods:lamp`(uid, on), `goods:visit`(storeId), plus the standard `shop:buy`.

## Edits outside the goods files
- `src/sim/housing.js`, one added line in `roomDef` before the sort: `if (G.goods && G.goods.surfaceZ) G.goods.surfaceZ(list);`
- Nothing else. Items and art reach housing through its exported `VIS` and `ITEMS` / `ITEM_BY_ID`.

## Hook the lead should apply
- `src/sim/navgoals.js` `rootOf`: `/^(home|pub|lobby)$/` -> `/^(home|pub|lobby|goods)$/`. Today `rootOf('goods:lumen')` returns `'goods'`, so `G.navGoals.doorOf` finds no door for a store. The plain waypoint to the door works (stores are in `G.places`).

## Verified by running (second pass, 390x844 unless noted)
- Build and `validate.mjs` pass; catalogue check 697 goods, 0 problems; no page errors in any run.
- All 13 rooms entered by script: every display has a tap target, every use spot is reachable from the entrance, no solid overlaps, one staff spot each. Shown / counter-only families: timber 70/3, fjord 98/11, bellwether 111/7, lumen 45/0, voltaic 58/7, loam 65/2, attic 89/12, warp 33/15, copper 60/2, nord 56/8, kestrel 51/4, sleepy 39/5, spoke 72/8.
- Looked at: overviews of timber, fjord, bellwether, lumen, warp, loam, nord, spoke, attic; phone-size Lumen; the sheet; the counter menu; the big-box lot and forecourt; Copper Pan and Spoke signs at night; a home with goods placed.
- All 13 doors reachable by path from the cafe door.
- Bought a sofa (delivery) and a lamp (bag); bag full at 8 refuses; too little money refuses; left by the mat to the store's own door; bag unpacked on walking in at home; `deliverNow` -> boxes -> unpack -> storage.
- Placed 11 goods, a table lamp ON a side table (z 0.56) and a bonsai on the record console (z 0.94); labels offered: Sofa, TV, Stereo, Water the Plants, Switch off.
- Lamp switch removes its light pool; the off state survives save -> load. An old save without `goods` state loads.
- Closed store refuses with its hours. "Lie down on it" starts the activity.
- 60 fps in Timber & Trowel and in Lumen (47 light pools).

## Not verified / known gaps
- Interiors of voltaic, copper, kestrel and sleepy were checked by the script only, not by eye. The Bellwether, Nord and Old Town row signs were not seen in a screenshot.
- Activities were started from the menu only for the sofa (menu shown) and the bed try-out; TV / stereo / instruments rely on the existing tag handlers and were not run to the end.
- Real finger taps, Decorate mode by hand, and the raised z of a surface piece inside the Decorate preview (the preview uses the same room def, not looked at).
- Warp & Weft shows 33 families; the largest rugs are counter-only.
- The nav arrow inside a store has no target (no objective declared); see the hook above.
- Bicycles and skateboards are furniture only (no riding). No online ordering, no design mode: left for the next worker; the catalogue fields are ready for them.
- The big-box removes the trees that stood on its lot at runtime (nothing else is touched).
