# Unique food & drink interiors — notes (src/scenes/rooms/places_food.js, places_food2.js, src/art/venue/places_food_art.js)
- All 26 enterable food & drink public places (`cat === 'food'`, rooms `pub:<n>`) now have their own hand-written room. Shops/services still use generic_venues.js.
- Hook: each file registers through `registerUnique` (src/scenes/rooms/unique_rooms.js). `P(n, name, build, info)` in places_food.js keys a builder by place NAME with a fallback by `pub:<n>`, and calls `registerInfo(name, { blurb, signature, tryThis, activities })` for the guide (26 entries). The builder returns null for anything that is not one of these places. public_places.js was not edited by this worker.
- Helpers exported from places_food.js for part 2: `P, R, V, WY, WX, S, GT, ST, SE, U, se(n), lamp, lantern, plant`.
- Contract per room (checked by eval, see below): one checkout-tagged counter with staff + use spot, eat-in seats, 6-12 npcSpots, `music`, front exit, every seat reachable, no two rooms share a size.

## Places (pub n, size, concept)
| n | Place | Size | Concept / signature |
|---|---|---|---|
| 1 | The Tea Garden | 12x8 | conservatory tea room, indoor garden bed in the middle, jam + tea jar wall |
| 24 | Jade Rabbit Tea House | 9x9 | floor seating at low lacquer tables on mats, lanterns, tea tin wall |
| 56 | Harbor Tea & Spice | 7x10 | narrow brick merchant shop, spice-jar wall down the left, tasting bar |
| 8 | Night Owl Coffee | 8x8 | dark late-night espresso bar, open-mic stage, neon, sofa nook |
| 29 | Kettle & Crumb | 10x7 | striped-wallpaper parlour, velvet armchairs on a rug, pie rack |
| 45 | Sunnyside Cafe | 12x7 | yellow brunch cafe around one long communal table, local art |
| 53 | Cannery Coffee Roasters | 13x8 | industrial roastery: drum roaster + sacks, 5-stool cupping bar |
| 11 | Flour & Fig Bakery | 9x8 | open bakehouse in view (oven, worktable, bread racks), plum accents |
| 58 | Elm House Bakery | 7x6 | tiny front-room patisserie, pink cake counter, two armchairs |
| 14 | Silver Spoon Diner | 15x7 | railcar diner, 8-stool chrome counter, booth row, jukebox |
| 2 | The Heron's Table | 13x10 | fine dining, 4-tops, wine wall, fish tank divider, host stand |
| 7 | Maple Brewing Co. Taproom | 14x9 | brew tanks behind a rope, long bar, beer-hall table, pool, darts, sports TV |
| 38 | Paper Crane Izakaya | 7x8 | tiny counter bar with the cook in front, sake barrels, low-table corner |
| 9 | Taqueria El Farolito | 10x8 | al pastor trompo, papel picado, salsa bar, checkered tables (no PIZZA sign) |
| 10 | Little Hanoi Pho | 8x9 | three steaming stock pots on the line, two long steel shared tables |
| 13 | Cedar & Olive Falafel | 11x7 | blue-and-white, shawarma spit + fryer, long window bar |
| 15 | Addis Table | 9x10 | five woven mesob basket tables on rugs, spice shelf |
| 16 | Halo Donuts | 8x7 | pink tile, donut fryer + two glazing racks, HOT NOW neon |
| 20 | Baker House Bagels | 9x7 | brick oven + boiling kettle, bagel racks, chalkboards |
| 26 | Nine Dragons Dim Sum | 14x10 | red/gold banquet hall, seven 4-tops, steamer towers, two dim sum carts, seafood tank |
| 32 | Bubbling Lantern Hot Pot | 11x9 | six split-broth hot pot tables, vegetable + sauce bar, red lanterns |
| 36 | Seoul Ember BBQ | 12x9 | seven charcoal grill tables under copper extraction pipes |
| 52 | Cold Storage Boba & Ice | 8x6 | icy tile, boba dispenser counter, slushie machine, ice cream freezer |
| 55 | Rope Works Fish & Chips | 11x8 | navy stripes, twin fryers, two picnic benches |
| 57 | Mama Opal's Soul Kitchen | 10x9 | steam-table line fed by big pots, pew booths, gingham tables, jukebox |
| 60 | Rope Works Smokehouse | 13x9 | two barrel smokers, butcher counter, beer-hall tables, whiskey shelf |

## New art (src/art/venue/places_food_art.js, 19 assets `furn.pf.*`)
counter (params w, text, c, c2, stripes, top: case|jars|tea|boba|juice|none, ic; tags till/counter/checkout, staff + use), pots (n, soup), steamers (n), steamcart, hotpot (4 seats), grilltable (2 seats),
lowtable (4 floor seats), mesob (4 seats), communal (w; 2*w seats), fryer, rack (kind donut|bagel|bread|pie), tv (wall; kind sport|menu|ocean), bunting (wall; kind picado|flags|lanterns, w, pal),
banner (wall; text, c), roaster, smoker, tank (w), brewtank, jars (pal tea|spice|jam, w), trompo (kind shawarma), keg (n, c, mark). Preview: `node tools/gallery.mjs furn.pf. --scale 3 --out pf`.
Wall-mount note: wall items are lifted by their `mount`; the three pf wall assets use mount .9 with art drawn at absolute height. Existing generic.clock / generic.exit float above the wall at their default mount, so rooms here pass a lower mount (.4 / .7).

## Verify
Eval that enters all 26 rooms (kept in the worker scratchpad, not the repo): size, fixture count, exactly one checkout with staff + reachable use spot, every seat within .75 of a cell flood-filled from the exit, all standing npc spots unblocked, 6-12 npcSpots, music, no fixture out of bounds, no solid overlaps, no duplicate size or (size + fixture set). Result: 26/26 pass, 0 page errors.

## Activities / known gaps
- Venue activities in data/activities.js are matched by ROOM ID (`venues: ['bar', 'cafe', ...]`), so no `where: 'venue'` activity (linger, bar_hang_out, watch_live_music, open_mic, dance) fires in any `pub:<n>` room, generic or unique. What works today: buy at the counter, eat-in at seats, sit, plus whatever handlers key on fixture tags.
- Fixtures placed for future activities: bar.stage (Night Owl), bar.pool + bar.dartboard + pf.tv (Taproom), diner.jukebox (Silver Spoon, Mama Opal's, Smokehouse), bar stools (Taproom).
- `f_mat` renders as a blue mat, not straw tatami (Jade Rabbit, Paper Crane).
- Names on left-wall (WX) banners are mirrored by the wall flip and read less cleanly than back-wall ones.
- Only 26 food places exist (brief guessed ~33): one each of dim sum, pho, hot pot etc. No curry, juice or snack place is enterable today.
