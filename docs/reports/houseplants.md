# Houseplants in flower shops (+ some home-goods counters): notes
Owner (2026-11-16): "The flower shops in the game should allow you to buy houseplants as well. And maybe they should also be available at some of the home goods stores."

## What exists now
- **No new art, no new items.** The home-goods catalogue already had 49 drawn houseplants (`data/goods.js`, cat `plants`, ids `g_*`) plus the older `plant_t0/t1/t2`, `plant_fern`, the conservatory seedlings and the Galleria `mall_plant_*` pieces. Every one the owner listed exists: succulent, cactus tray, fern, snake plant, monstera, fiddle-leaf fig, pothos / hanging pieces, orchid, bonsai, herb pot. So this is a stocking change, and the single-file build grew by about 1 KB.
- `src/sim/houseplants.js` (new, order 54) appends venue ids to those items' `soldAt` at import time, so `public_places` florist instances copy them when the city is built. It does this again in `init` and on the city `scene` event.
  - API: `G.houseplants = { venues(), carryHome(itemId, venueId), FLORIST_PLANTS, EXTRA }`.

## Who sells what (prices are the catalogue's, x the venue's priceMult)
| venue | plants | why |
|---|---|---|
| **Florists**: type `gen_retail_florist` and every instance. In the city today: `pub:4` Bloom & Paper (door 172,215) and `pub:61` Bloom & Paper Riverside (244,158) | 20 plants, listed in the next table | they are the flower shops |
| **Old Town Market** `market_stalls` (the flower buckets), priceMult 0.8 | already had the Hanging Fern; now also Little Succulent, Cactus Trio Dish, Windowsill Herb Trio, Potted Lavender, Orchid (Pink), Snake Plant | a flower stall, so only small pots you can carry |
| **Nest & Wire** `homegoods` (downtown, "Furniture and gadgets") | already had Potted Succulent, Monstera, Indoor Lemon Tree and Hanging Fern; now also Snake Plant, ZZ Plant, Peace Lily, Pothos on a Stand, Orchid (Pink), Windowsill Herb Trio | the game's original home-goods store, which the owner most likely means |
| **Nest & Wire Home** `mall:nest` (Galleria) | none before; now Snake Plant, Peace Lily, Orchid (Pink), Glass Terrarium | a homeware shop; a small set, because Fern & Frond is next door |
| **Garden Gifts** `conservatory:gifts` | already had 5 seedlings; now also Orchid (White), Glass Terrarium, Moss Ball Garden, Air Plant Baubles, Juniper Bonsai | the conservatory gift shop |

The 20 florist plants, cheapest first:

| plant | price |
|---|---|
| Little Succulent | $8 |
| Potted Lavender | $12 |
| Trailing Ivy | $14 |
| Windowsill Herb Trio | $18 |
| Cactus Trio Dish | $19 |
| Moss Ball Garden | $26 |
| Air Plant Baubles (wall) | $28 |
| Snake Plant | $28 |
| String of Pearls on a Shelf (wall) | $34 |
| Boston Fern | $35 |
| Orchid, Pink | $35 |
| Orchid, White | $35 |
| Macramé Hanging Fern (wall) | $38 |
| Peace Lily | $40 |
| Glass Terrarium | $48 |
| Monstera (`plant_t1`) | $55 |
| Calathea | $55 |
| Pothos on a Stand | $65 |
| Juniper Bonsai | $75 |
| Fiddle-Leaf Fig | $95 |

Left as they were:
- Stores that already sell plants: Leaf & Loam (the plant house, 49), Fern & Frond `mall:fern` (24), Timber & Trowel (garden centre), Fjord & Fold (7), Bellwether (8 on the floor), Kestrel, Nord, Copper (herbs, aloe), Warp and Attic (a few each).
- Not given plants, because they do not fit: Lumen (lighting), Voltaic (electronics), Sleepyhead (beds), Spoke & Strum (hobby).
- The physical store rooms are untouched: displays are built from `GOODS.stores` and nothing was added there.

## How a bought plant gets home
- **Small, carry-able plants** (everything except the fern, peace lily, calathea, monstera, pothos and fig) bought over a NON-goods-store counter go into the goods **shopping bag**, the same way small pieces from a home-goods store shelf do.
  - Toast: "... is in your shopping bag. It goes into storage when you get home."
  - The bag unpacks into storage when you walk into your home, and then the plant appears in Decorate under "My things".
  - This goes through `G.goods.buy` (pays, then emits `goods:buy` and `shop:buy`).
  - A full bag (8), an online order, or a quantity above 1 falls back to normal delivery.
- **Big plants** use the normal counter delivery: `G.housing.addFurniture`, which arrives next day at 09:00 as boxes that unpack into the room.
- **Upkeep:** nothing new was added. The plant art carries the tag `plant`, so every placed plant gets "Water the Plants" (the existing `tend_plants` activity) and its ambience feeds Comfort. All of these plants count as decor, not furniture slots.

## ui/shop.js (controller's file; three lines, re-read right before editing)
1. In `buy()`, the homegood branch first asks `G.houseplants.carryHome(id, venueId)`. A null answer means "not handled", and the old path runs.
2. The home tab is named **"Houseplants"** when every home good at that counter is a plant. That applies to the florists, the market, Garden Gifts and Fern & Frond.
3. The `plant` section header reads **"Houseplants"** everywhere (it used to read "Plant"), and plants in the home tab are sorted by price. Other tags keep the tier sort.

## How it was checked
**Played, by touch.** A Playwright script at 390x844 (hasTouch, isMobile) on `dist/index.html`: `scratchpad/hp/play.mjs [homeId]`.
- Shopping trips:
  - Travel between shops was by `G.go`.
  - In each shop the player walks with real floor taps, taps the counter on the canvas, taps the Houseplants tab, then taps Buy.
  - Bloom & Paper: Orchid, Bonsai and Fiddle-Leaf Fig. Bloom & Paper Riverside: Snake Plant and Air Plant Baubles. Nest & Wire: Peace Lily and Herb Trio.
  - Result: 5 plants in the bag and 2 pending deliveries.
- At home:
  - `goHome` unpacked the bag into storage.
  - `deliverNow` and unpacking boxes placed the fig and the lily.
  - Decorate was opened with the on-screen chip. Under "My things", tapping the 5 tiles placed them. Then Done.
  - 7 plants placed; each one offers "Water the Plants".
- Save and reload: `G.save()`, reload, tap the title's Continue. The same 7 plants were at the same positions.
- Homes covered: Juniper Court (studio) and Sycamore House (house).
- 0 page errors.

**Script:** in all 23 home types, the 20 florist plants plus the ZZ plant were placed through `freeSpot` + `place`: 21/21 in every home, each with a watering target.

**Screenshots I looked at** (all `out/shots/plants_*.png`):
- bloom_paper, bloom_riverside_after, nest_wire
- decor_placed, home_reloaded, sycamore_house_home_placed, allhomes
- market, conservatory_375 (375x812), mallnest

**Other checks:**
- `validate.mjs` OK.
- Build: 14474 KB.
- `navcheck --rooms all`: all passed, 0 page errors.
- `perf --verify`: same pixels, 0 page errors.
- Lookbehind grep: 0.

## Known gaps / notes
- The florist rooms do not show the plants as physical display pieces; you buy them from the counter menu. The rooms already have flower buckets and carts.
- The market and Garden Gifts tab bars have 4-5 tabs and scroll sideways at 390 wide. This was already the case.
- Pre-existing, not touched: the conservatory seedlings show a cardboard-box icon in the shop list.
- Florists are not in the Roomy app's seller list, because `G.orders` only knows the 13 goods stores.
