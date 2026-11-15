# More homes: nine houses, five apartments, "pre-furnished or furnish it yourself" (owner msg 107, BIBLE 21.4)
Full API in the headers of `src/sim/housing.js`, `src/scenes/rooms/home_more.js`, `src/sim/homes_city.js`, `src/data/homes_more.js`.

## The 14 new homes (23 listings in all now)
Every one stands in a building that was already on the map and had no use (houses) or shares a building with its lobby (apartments). Nothing was moved, removed or re-skinned.
Price columns: rent per week / buy price, then the one-off furniture package if you take it pre-furnished (number of pieces).

| id | name | type | district | door poi (x, y) | existing building | rooms (w x d) | rent / buy | furnished | on the market |
|---|---|---|---|---|---|---|---|---|---|
| lantern_garret | The Garret, Lantern Row | apartment (Tiny) | Old Town | 132.75, 208.5 | bld.oldtown.rowhouse.gable @123,206 (also lobby:27) | attic room 6x5, shower room 3x3 | $95 / - | +$510 (9) | day 1 |
| sunny_court_flat | Sunny Court, Garden Flat | apartment | Old Town | 69, 228.75 | bld.oldtown.apartment.garden @66,220 (lobby:25) | room 9x7 with a patio garden, shower room 4x3 | $190 / - | +$1,100 (13) | day 3 |
| inkwell_walkup | The Inkwell Walk-Up | apartment | Arts Quarter | 252.7, 82.75 | bld.arts.lofts @250,75 | studio room 10x7 with a sleeping nook, shower room 4x3 | $220 / $7,000 | +$1,380 (14) | day 5 |
| netloft_3 | Net Loft No. 3 | loft | Harborside | 204.75, 336.5 | bld.harbor.warehouse.timber @196,332 (lobby:47) | hall 12x8, gallery bedroom 8x5 up the stair, bathroom 5x4 | $330 / $11,500 | +$4,100 (22) | day 13 |
| meridian_1407 | Meridian Tower, Apt 1407 | apartment | Downtown | 230.75, 287.5 | bld.downtown.tower.round @222,282 (lobby:18) | living room 10x7, bedroom 7x6, bathroom 5x4 off the bedroom | $430 / $16,000 | +$3,560 (19) | day 19 |
| wren_cottage | Wren Cottage | house | Maplewood | 309.1, 183.75 | bld.res.cottage @308,178 | front room 8x7 with a herb bed, bedroom 5x5, bathroom 3x4 | $230 / $7,500 | +$1,460 (17) | day 6 |
| rosebank_bungalow | Rosebank Bungalow | house | Maplewood | 345.5, 245.75 | bld.res.bungalow @344,239 | living room 10x8 with a front porch, bedroom 7x5, bathroom 4x4 | $275 / $9,500 | +$2,900 (21) | day 9 |
| crooked_house | The Crooked House | house | Old Town | 132.5, 212 | bld.oldtown.rowhouse.timber @125,211 | kitchen-parlour 6x7, sitting room 6x7, attic bedroom 6x6, bathroom 4x3 (three floors) | $310 / $11,000 | +$4,420 (23) | day 11 |
| bluebird_house | Bluebird House | house (Cape Cod) | Maplewood | 278, 213.75 | bld.res.capecod @274,207 (next to Nora's) | lounge + kitchen 10x8, dormer bedroom 9x6, bathroom 5x4 upstairs | $350 / $12,500 | +$3,030 (23) | day 15 |
| thistle_house | Thistle House | house (craftsman) | Maplewood | 296.75, 275.65 | bld.res.craftsman @289,270 | lounge + kitchen 11x8 with a porch, bedroom + study 10x6, bathroom 6x4 | $420 / $15,500 | +$4,810 (26) | day 22 |
| larkspur_house | Larkspur House | house (gable) | Hillcrest | 99, 53.75 | bld.res.gablehouse @97,47 | lounge + kitchen 12x8, main bedroom 8x6, second bedroom 6x5, bathroom 6x5 | $500 / $21,000 | +$4,930 (26) | day 29 |
| stepdown_house | The Stepdown | house (split-level) | Hillcrest | 121.6, 89.75 | bld.res.splitlevel @117,83 | living level 11x7, bedroom level 9x6, den + garage 10x6, bathroom 6x4 | $540 / $24,000 | +$3,930 (26) | day 33 |
| orchard_end | Orchard End | house (L-house) | Maplewood | 311.3, 194.75 | bld.res.lhouse @307,187 | lounge + kitchen 13x10 round a back garden, main bedroom 9x7, bedroom two + playroom 8x6, bathroom 6x5 | $590 / $27,500 | +$5,620 (30) | day 39 |
| gulls_rest | Gull's Rest | house (cliff house) | Hillcrest | 54.6, 53.75 | bld.res.cliffhouse @51,46 | living room 12x8 with a sea deck, bedroom suite 10x6 on the lower level, bathroom 6x5 | $690 / $33,000 | +$5,480 (24) | day 46 |

The nine old homes keep their ids, shells, prices and unlock days. They gained a designer's set too (package: Juniper $640, Saltbox $670, Easel $790, Birch $660, Marlowe $1,490, Cannery $2,840, Sycamore $3,150, Villa $2,870, Penthouse $2,570). The game start is unchanged (the starter picker and the starter kit are as before).
New size class `nook` ("Tiny": 9 furniture spots, $12 utilities) for the garret.

## Pre-furnished or furnish it yourself
- Asked every time you rent or buy a home you do not live in: on the Nestly cost sheet (two chips), and in the realtor's listings window (a choice window before "Sign" / the mortgage terms).
- **Pre-furnished**: the designer's set stands in the rooms when you arrive. Cost: a ONE-OFF furniture package on top of the first costs = 60% of the list price of the pieces (`FURNISH.rate` in `src/data/homes.js`), shown as its own line. The pieces are YOURS: they move with you, you can sell them (selling pays 50%, so there is no profit in it).
- **Furnish it yourself**: no extra cost. Every home has the landlord's fridge, stove and shower (`included`), a toilet and basins. If you own no bed, a camp mattress (`bed_t0`) lies on the home's bed slot (in the bedroom, also upstairs). A "WELCOME KIT" moving box holds 2 instant ramen, 2 granola bars, 2 tea. The welcome toast points to the furniture shops and the Roomy app.
- Either way your own furniture comes along in "FURNITURE" moving boxes as before (4 pieces a box, the rest to storage).
- **Viewing**: tap the door of a home that is not yours -> its card -> "Look inside" (or "Look inside" on the Nestly listing when you stand within 9 tiles of the door; otherwise the listing says "Take me there"). You walk every room; only doors, stairs and seats work. A bar at the bottom: Furnished / Empty (the rooms are rebuilt on the spot), Listing (the Nestly page), Leave. Not saved.

## How multi-room homes work (for other workers)
- `SHELLS[id].rooms = { key: shell }`: scene `int:home:<id>:<key>`, room id `home:<id>:<key>`. Link pieces = shell items with `{ to, label, spot }` (stairs, `wall.door.room`, the attic hatch); tag `homelink`, interactable flag `homelink`, `navTo` set. `bath.from: '<key>'` puts the bathroom off another room.
- A placed piece carries `r: '<room key>'` (as `'bath'` did). `G.housing.room()` returns the room you stand in; check / place / move / design mode act on it. Boxes, the mail basket, the cleaning things and the hamper stay in the main room.
- `G.housing.isHome()` is true in every room of your home.

## Files
New: `src/data/homes_more.js`, `src/scenes/rooms/home_more.js` (14 shells, 23 furnished sets, room registration, `homelink` fixture), `src/sim/homes_city.js` (door pois, order 57.8), `src/ui/home_view.js` (viewing bar), `src/art/homes/more_art.js` (`furn.home.more.stairwell`, `.garagedoor`, `.trapdoor`), this report.
Edited (mine): `src/data/homes.js` (import + `HOMES.push(...MORE_HOMES)`, `FURNISH`, size class `nook`), `src/ui/phone_homes.js` (prices both ways on cards / detail, "Look inside", the choice on the cost sheet).
Edited (shared):
- `src/sim/housing.js`: rooms generalised (`roomOfScene`, `shOf`, `inRoom`, `roomKeys`, `sceneOf`, `linkItems`; `keepRects` / `spawnOf` know link spots; `included()` finds slots in extra rooms; `roomDef` builds extra rooms and guards homes that are not yours); `goRoom`, `guard`, `view` / `viewing` / `viewFurnished`, `pkgPrice`, `shown`, `roomWith`, `navEdges`, `seedNav`, `bedSlot`; `moveIn(id, owned, { furnished })` (set or starter kit); `rent(id, o)`, `buy(id, term, o)`; `homes()` rows gain `pkg`, `pieces`, `roomsN`; `place / move / rotate / migrateShell` use `it.r` for any room. No behaviour change for the old homes except: renting empty now also leaves a mattress (only when you own no bed) and the welcome box.
- `src/ui/furnish.js`: `inThisRoom` (any room), `homeBody` (package line), `askFurnished()` used by the Rent button and `buyFlow`, `showCard` (buttons Look inside / Listing / Not now).
No edit in world files, apps.js, core, engine, hud, phone, navgoals, unique_rooms.

## Hooks for the lead (exact lines)
1. `src/sim/navgoals.js`, first lines inside `export function fixEdges(sid, out, live) {` (before `const gs = ...`). Without it the arrow only knows the rooms of YOUR home and of the home you are viewing (housing seeds them into `G.state.nav.edges`), and `tools/navcheck.mjs --rooms all` fails the new multi-room rows:
```js
  const hx = OFF ? null : safe(() => G.housing.navEdges(sid), null);   /* more homes: stairs, room doors and "back" mats of multi-room homes (sim/housing.js) */
  if (hx) for (const e of hx) { const h0 = out.find(o => Math.abs(o.x - e.x) < .8 && Math.abs(o.y - e.y) < .8); if (h0) { h0.to = e.to; h0._g = 1; } else out.push({ x: e.x, y: e.y, spot: e.spot, label: e.label, to: e.to, exit: false, out: false, _g: 1 }); }
```
2. Same file, the `need` goal: the bed / fridge / shower may stand in another room (upstairs). Replace `rid = home && ROOMS.has(ctx.root + d[0]) ? ctx.root + d[0] : ctx.root,` by:
```js
hr = home ? safe(() => G.housing.roomWith({ energy: 'bed', hunger: 'fridge', hygiene: 'shower' }[s.need]), null) : null, rid = hr && ROOMS.has(hr) && rootOf(hr) === ctx.root ? hr : home && ROOMS.has(ctx.root + d[0]) ? ctx.root + d[0] : ctx.root,
```
3. Optional: `src/scenes/rooms/lobbies.js` has the unused hook `L.homeId`: the four apartments above share a building with lobby:27, :25, :47, :18. Setting `homeId` there would let the lift / stairs say "home" (the apartments work without it: their own street door).
4. Optional: `docs/STATUS.md`, `docs/INTERFACES.md` (`G.housing` row: rooms, viewing, furnished), Wander guide entries for the new addresses.

## API / events / state
- `G.housing`: `rent(id, { furnished })`, `buy(id, termIx, { furnished })`, `rooms(id?)`, `goRoom(id, to, from)`, `roomWith(tag)`, `navEdges(sceneId)`, `seedNav()`, `view(id, furnished = true)`, `viewing()`, `viewFurnished(bool)`, `pkgPrice(id)`, `furnishedSet(id)`; `homes()` rows: `pkg`, `pieces`, `roomsN`.
- `G.homesCity`: `sites()`, `door(id)`. Event `home:view`(id, furnished). State: `G.state.home.furnished` (0 / 1), items may carry any room key in `r`, boxes may carry `kit: 1`.
- Data: `FURNISH`, `MORE_HOMES`, `MORE_SHELLS`, `SETS`, `SITES`.

## Verified (2026-11-15)
With real taps (Playwright, 390x844, touch), montage `out/shots/hm_flow.png`: Nestly list (23 cards, real building thumbnails, both prices) -> Bluebird House listing -> "Take me there" (route card) -> standing at the door the HUD prompt reads "Bluebird House · 715 Maple Ave" -> tap -> door card -> "Look inside" -> viewing bar -> "Empty" (12 fittings left) -> "Furnished" (24) -> tap the stairs -> upstairs -> bar "Listing" -> "Rent" -> chips "Pre-furnished +$3,030" / "Furnish it yourself" (first-costs lines change) -> "Sign the lease" -> moved in empty: mattress upstairs, WELCOME KIT box, Bed / Shower / Toilet / Cook / fridge / mail basket / cleaning things all present.
Through the API (headless page, 0 page errors in every run):
- every furnished piece of all 23 homes passes `G.housing.check()` after a furnished move-in (0 failures); every interactable of every room of the 14 new homes is reachable by the pathfinder from the room's entry, furnished and empty (the 9 old homes: main rooms, furnished);
- money: Wren empty = $270 (rent 230 + van 40); Orchard End furnished = $6,250 (590 + 40 + 5,620); weekly bills follow the home (rent + utilities by size class);
- own furniture: 3 pieces from Juniper arrive in a FURNITURE box at Wren and again at Orchard End next to the 30 set pieces; the welcome box puts ramen in the fridge;
- rooms: main -> up -> up2 -> back, up -> bathroom -> back lands by the right door; save / load while standing in an upstairs room restores the same scene and an identical home state; a piece placed upstairs gets `r: 'up'`; a shower placed from upstairs is plumbed into the bathroom; design mode opens upstairs (60 fps) in the largest house; a delivery box and the mail basket show in the main room;
- an old-shape home slice (no new fields, Marlowe) loads and stays the player's home; `validate.mjs` and the build pass;
- arrow (real tree, no hook): in your own Crooked House main -> attic = main, up, attic and the arrow points at "Stairs up"; attic -> bathroom = attic, up, bath; a viewed home routes too.
- `tools/navcheck.mjs --rooms all --only graph`: in the real tree 43 new-home rows FAIL (the checker walks homes that are neither yours nor being viewed, so nothing is seeded); in a scratch copy with hook 1 applied the only failure left is `home:grandma -> home:grandma:attic` (the Chapter attic, not this job).
Screenshots looked at: every room of the 14 new homes furnished (`hm_fa/fb/fc/fd.png`), their main rooms empty (`hm_em.png`), the 9 old homes furnished (`hm_fo.png`), 13 of 14 doors from the street (`hm_city.png`), the new art (`out/gallery/hm_art.png`), the tap flow.

## Not verified / known gaps
- No real phone. No night / other seasons. The need guide ("go to bed" arrow from the street into an upstairs bedroom) needs hook 2: without it the arrow stops in the main room when the bed is upstairs. Hook 1 was only run in a scratch copy.
- The realtor window's furnished question and the Buy path were driven through the API only (the Nestly rent path had the real taps). Buying furnished was exercised for the buy-only villa and penthouse by the validator.
- The Crooked House door stands in the one-tile alley beside the building (132.5, 212): it was not in the street montage and its walk from the street was not checked by eye.
- Room pictures were reviewed zoomed out (700 px wide); at phone zoom you see part of a big room at a time, as in every home.
- Dining chairs stand behind their tables: reachable from the side, not checked that sitting on each one looks right. TVs and sofas stand at right angles (catalogue pieces cannot face the back wall).
- Guests / NPC visits in extra rooms, the laundry hamper and cleaning things in a multi-room home, and Comfort over a full day were not played.
- No door art or "for rent" sign on the facades; the apartments do not use their building's lobby (hook 3).
- The furnished sets of the nine old homes are modest (8 to 16 pieces).
- Renting empty gives a welcome box each time (about $10 of food); the mattress only when you own no bed.

## For the owner to decide
- Furnished = one-off package at 60% of list, yours to keep (alternative: a weekly rent premium with the landlord's furniture staying behind).
- Prices and unlock days above; whether the Garret (cheaper than every starter) should also be offered on the title screen's starter picker.
- Which further houses: 30-odd door-less houses remain (capes, duplexes, more cottages and split-levels).
