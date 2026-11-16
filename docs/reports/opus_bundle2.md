# Opus bundle 2: seven small known flaws (2026-11-16)

Opus worker. Nothing committed, pushed or published by me. Note: the lead's WIP commit **c254a45** already contains my first version of item 1
(`src/world/_furnish.js`, `tools/onroad_check.mjs`) and it is the final one; diff against **3b1a1d2** to see the whole bundle.
Everything was checked in the BUILT game (dist/index.html), Playwright 390x844, hasTouch + isMobile, unless said otherwise. "Before" pictures came from
the unchanged code: a scratch worktree of HEAD built separately (items 1, 4, 5), or the old route reproduced in the new build (item 2, said there).
Drivers (not in the repo): `/tmp/claude-0/-home-user-Pixel-city-2/ab4bf52b-889a-5288-a866-29c2e55d0472/scratchpad/` `mall.mjs` + `mall2*.js` (item 2),
`mg.mjs` + `lug.mjs` (item 3), `intro.mjs` (item 4), `read.mjs` (item 5).

## 1. Objects on asphalt
**Cause.** Two separate things. (a) The rocks / reeds / grass / willow "along the upper river" (`_furnish.js`, last loop) are scattered at x 146-149 and
163-166 for y 42-120, and the bridge road at y ~110-118 lies inside that band; their placement only asks "is the nav cell free", and asphalt is walkable.
The Maplewood yard dressing (`_blocks.js`, style maplewood) had the same blind spot at three cul-de-sac turning circles (trees, hedge, leaf pile,
raised bed, flowerbed in the asphalt bulb). (b) Street furniture at the kerb line: the harbour crates / barrels (1.4 deep) hung 0.4 over the road;
the A-frame boards ("CAFE" outside Nightjar) stood on the very kerb edge; the street-name sign at 38 signal corners stood in the carriageway (the +0.5
shift that keeps it off the traffic light pushed it into the road).
**Change** (`src/world/_furnish.js offRoad`, the existing last world step, extended; nothing removed): OFFROAD now also matches
`prop.harbor.crates|barrels`; A-frames keep 0.45 off asphalt; a second rule (CARRIAGE: `prop.nature.*`, `prop.park.raisedbed|birdbath|bikerack`,
`prop.road.sign.street`) tests the CARRIAGEWAY (generator occupancy 1) and rail ballast only, so trees planted on purpose in parking lots stay;
greenery prefers a verge to a sidewalk and never lands on water (reeds / lilypads / rocks may: pond reeds and lilypads did not move), on a parking
space or on a door. 63 objects moved (list from a before/after diff of the generated world): 3 A-frames, 3 crates/barrels, 38 street signs, 6 river-bank
pieces, 13 cul-de-sac pieces. The willow went furthest: (148,114) -> (142,120), off the bridge to the bank by the falls.
**New tool** `tools/onroad_check.mjs [--all]`: generates the city in node and lists every placed prop / tree overlapping a lane or rail ballast; skips
vehicles, buildings, rail structures (viaduct, piers, track, platforms over the street), road markings / signals (`prop.road.*` except street signs and
bike racks), overhead string lights. `--all` also prints props on lot asphalt as info. On the old generator: **60** hits (38 signs, 19 river-bank / cul-de-sac pieces, 3 crates / barrels; the A-frames were on the kerb tile, so the tool does not count them); after: **0**. Info (left on
purpose): 2 trees in the Beacon Tower car park, the FreshWay bike rack at the edge of its car park.
**Left / not touched:** viaduct piers that stand 0.5 into a kerb lane at 5 places (structural, part of the rail art; moving them would misalign the
viaduct); the string lights over the street at the Old Town food carts (overhead). Runtime additions (city events, clothing-store signs) are not in the
tool (it reads the generated world only).
**Checked:** `fix2_1_before/after_{rocks,crates,bulb,bulb2,sign,aframe}.png` (looked at all, full size: rocks / willow / grass gone from the bridge,
crates on the quay sidewalk, the turning circle clear, the sign on the corner, the A-frame half a tile in from the kerb). traffic_check quick on the
old and the new build (see Checks). **Note:** the A-frame outside Nightjar still says CAFE (variant picked at random for the street); only moved.

## 2. Guide arrow inside the Galleria to a bay shop
**Cause** (QA16's "Closet -> CAB -> a Galleria bay": guidance ends at the street door). The in-store rows route to `G.clothesShop.placeOf('mall:thread')`
= `'deptstore'` (the mall itself). A waypoint / trip to `deptstore` resolves the `default` objective: it looks for a till inside the mall, finds none
(the bays' counters are not "Order/Shop") and ends ("You have arrived") at the door. Second hole on the same path: `G.phone.routeTo(p)` built the
route-card destination without `room`, and the navigator's trip `pt()` dropped it too, so a bus / cab trip to `mall:<key>` had goal `city` and ended at
the door as well. (A plain Map waypoint to `mall:<key>` already worked: row 27 of navgoals.md.)
**Change** (3 lines): `src/sim/instore.js where()`: a piece sold in a bay is routed to the bay's own place (`mall:<key>`, which has `room: 'deptstore'`)
when the venue's place has a room; the row text is unchanged. `src/ui/phone_map.js routeTo`: keeps `room` on the destination. `src/sim/navigator.js pt()`:
fills `room` from the place when the caller left it out. Only the 13 Galleria places have `room` (checked: `G.places.list() + inner()`).
**Checked:** in the built game: in-store rows now give `place=mall:thread`; bus trip and cab trip (ride ends emitted by script, the rest real):
city "Go in: Maple Bay Galleria -> Thread & Co. Outlet" -> through the door (used the real door interactable) -> inside "Thread & Co. Outlet" at the
bay counter (29.5, 3.15); standing at the counter ends it. Before (the old route place `deptstore` replayed in the new build): inside = no arrow,
"You have arrived". `fix2_2_before.png` / `fix2_2_after.png`. New navcheck audit row "In store: Galleria bay by bus (QA16 gap)": PASS.
**Not tested:** a full cab ride driven in real time (the ride end was emitted), the Map card tapped by touch.

## 3. The suitcase's unpack mini-game draws the yellow case
**Change:** `src/ui/minigame_b.js` 'unbox' takes `o.lug`; with it, a new `suitcase()` drawing replaces the box: yellow shell (LUG.C #f2c230), two ribs,
wheels, carry handle, the red tag with a white maple leaf; closed, a zip pull (gold ring) runs along the lid seam a third further with each tap (the same
three taps, same tap area); open, the lid stands up behind (teal lining) and things rise out of the case. Caption "Tap the zip". Rules, timing, scoring,
`want()` unchanged; without `o.lug` the box is pixel-for-pixel the old code path. `src/sim/_mg_games.js` unbox kit passes `lug` from the box and the
hint "Tap the zip to open the case. Then tap each thing to lift it out."
**Checked:** kit played by touch (2 items) to the end: closed / one zip tap / open / all out (`fix2_3_after_*.png`, crops looked at); a box still draws
the box (`fix2_3_boxstill_*`, `fix2_3_before.png` = what the suitcase looked like before). In a real game: intro skipped, `G.housing.addLuggage()`,
went home, TAPPED the suitcase in the flat: the mini-game opened with lug, played by touch to the end, the case was unpacked (`fix2_3_after_ingame*.png`).

## 4. Intro hint bubble yields to a window
**Cause:** the bubble (`.tut`, ui/goals.css, z-index 70, top 98 px) sits over a kit window's head; at 390 px the shop's Close (x) was under it
(`elementFromPoint` on the Close centre hit the bubble; a touch on Close did not close the shop).
**Change:** `src/ui/goals.js frame()`: while a `.modal` window is open the bubble gets `.yield` (`display:none`, ui/goals.css), unless what it points at is
inside that window; it comes back when the window closes. (The hint lives in goals.js, called by sim/intro.js hint(); no intro.js change needed.)
**Checked:** intro run to the concourse with the "Bzzt!" hint, Bay Brew coffee cart opened by its interactable: before = bubble over Close, a touch on
Close left the shop open (`fix2_4_before.png`); after = bubble hidden, Close is the top element, a touch on Close closes the shop, bubble back. Same at
375x812 (`fix2_4_after_375.png`).

## 5. Library label
**Choice: relabel to the truth, pay unchanged.** The listing now shows the game time a read takes at reading speed on the NORMAL clock at 1x
(words / 230 wpm x 0.85 game min per real second, rounded to 5 min): "about 1 h 55 min" for the 523-word pieces (was "14 min"). The end card's "X min
read" is now the game time that really went by (clock delta) instead of the pay minutes. Why: the owner's rule is that the world keeps going at the normal
clock while you read; making pages advance "the read's own minutes" would make the label true only by bending that rule, and scaling the pay up 8x would
blow through the 45-minute daily screen-time pool with one read. Fun / screen time per piece are unchanged (`minutes` stays the pay unit).
Files: `src/sim/media.js` (`clockMin` on each read), `src/ui/phone_reader.js` (row label, end chip).
**Checked:** Library before ("14 min") / after ("about 1 h 55 min", "about 2 h 50 min" for a longer story) `fix2_5_before/after.png`; a read played by
touch (Next every 3 s): end card "26 min read" with 29 game min passed since opening the app.
**Question for the owner:** is "about 1 h 55 min" the right thing to show (it is what the clock does), or would he rather have the reading slower again?

## 6. navcheck robustness
**Change:** `tools/navcheck.mjs` GRAPH: `T(null, 12)` before each room (noon of the same day, needs and money topped up), so a long `--rooms all` run cannot
drift past closing. Checks unchanged. Before: the unchanged navcheck `--rooms all --only graph` on HEAD failed (aquarium:deep: 4 routes "expected a
door to int:aquarium", i.e. walked out). After: `--rooms all` 315 rooms, 592 doors used, 443 routes, 0 problems; every audit row PASS; 0 page errors.

## 7. Ready-to-paste lines for docs/STATUS.md (the lead edits STATUS)
- CLOTHING STORES (Stage 94): ten new enterable clothing stores in existing buildings (`cs_<key>`: Hollowell & Sons, Nightjar, Juniper & Rye, Second Wind Thrift, Cobble & Sole, Tidepool, Saltline Outfitters, Otterline Boathouse, Brim & Buckle, Little Lantern Atelier), each with its own room, hours, shopkeeper, till, racks, fitting room and lit sign; in-store-only clothes moved to their shops; 85 preset outfits in all 20 clothing shops with "Buy the look"; mannequins dressed in the looks. docs/reports/clothing_stores.md.
- CENTRAL STATION PLATFORMS (Stage 96): room `central_station:platforms` behind the hall's fare gates: two tracks, two platforms, head concourse, departures board, stationmaster's office; trains arrive and leave on the rail timetable; the train job works on the platforms (Information desk first, Opus bundle 1). docs/reports/central_station.md.
- INTRO LUGGAGE (Stage 95): the yellow suitcase with the red maple tag is towed from carousel 2 to the flat (G.luggage), parked by the door as a fourth intro box ("Unpack your moving boxes and suitcase (0/4)"); gives Tee & Jeans + Gym Kit; its unpack mini-game draws the case (zip, lid) since Opus bundle 2. docs/reports/luggage.md.
- WISH-LIST REMINDER (Stage 97): walking past the door of an open shop that stocks a wished in-store-only piece drops one phone banner (once per piece per day, never during scenes / shifts / rides / windows); tap = go in. docs/reports/wishnudge.md.
- REAL BATHROOMS (Stages 98, 101, batch 3 under review): `src/sim/restrooms.js` + rooms in `src/scenes/rooms/restrooms.js`: walk in, use a stall, wash your hands; 3 trial rooms + batch 2 (SkyDeck, Central Station, Galleria, library, museum, gym, Blue Heron, Arena; City Hall floors share the grand washroom) + batch 3 (hotel, four food places, Aquarium, Natatorium, Orpheum, Observatory, Fish Hall, University Commons, five coffee and tea places); the rest still use the old fade-out restroom. docs/reports/bathrooms.md.
- SEATING FOLLOW-UPS (Stage 99): whatever covers a seated player's head and chest fades; city benches no longer float or sink (shared `_benchseat.js`), rail-platform benches have no street Sit spot; Nana's rocking chair; a small hop when sitting down / standing up. docs/reports/seating_followups.md.
- OPUS BUNDLE 1 (Stage 101): the phone part-screen has no Bigger button and reading runs the normal clock; Station Agent starts at the Information desk; kneading and ping-pong have their own pictures; the Fireside Rocking Chair is for sale (Gilded Attic, Bellwether, Timber & Trowel). docs/reports/opus_bundle1.md.
- OPUS BUNDLE 2 (this job): props / trees / street signs off the lanes (`_furnish.js offRoad`, `tools/onroad_check.mjs`), arrow into a Galleria bay from in-store rows and trips, suitcase unpack art, intro hint yields to windows, Library lists the real reading time, navcheck holds noon. docs/reports/opus_bundle2.md.

## Checks run
- `node src/data/validate.mjs`: OK. `node tools/build.mjs`: OK. `grep -c '(?<[=!]' dist/index.html`: 0.
- `node tools/onroad_check.mjs`: 4371 objects, 0 on a road or rail track.
- `node tools/navcheck.mjs --rooms all`: all passed (315 rooms, 592 doors, 443 routes; every audit row incl. the new one), 0 page errors.
- `node tools/perf.mjs --verify`: VERIFY OK, same pixels, 0 page errors.
- `node tools/traffic_check.mjs --plan quick` on the old build (scratch build of 3b1a1d2's `_furnish.js`) and the new one: ALL bands vehicles 10.1 / 10.2,
  speed 3.06 / 3.06, stop > 20 s 0.47% / 0.34%, stops > 20 /h 15.4 / 17.0, gridlock 0 / 0, teleports 0 / 0, page errors 0 / 0. Moving props changes the
  object order and so the random sequence of the run; I read the differences as run-to-run variation (nothing moved INTO a lane: the tool says 0).
- `node tools/minigames_b_check.mjs` (everything): 43 PASS, 0 FAIL, exit 0, zero page errors in every group (walk, home, town, rules, pad, intro).
- Played by touch with zero page errors: items 2 (door + inside), 3 (kit + real suitcase in the flat), 4 (Close by touch at 390 and 375), 5 (a read).

## Size
Built file, measured on a clean HEAD worktree with only my files applied: 15,157,142 -> 15,159,659 bytes = **+2.5 KB** (limit 15 KB).

## Files
Edited: `src/world/_furnish.js` (already in c254a45), `src/sim/instore.js`, `src/sim/navigator.js`, `src/ui/phone_map.js`, `src/ui/minigame_b.js`,
`src/sim/_mg_games.js`, `src/ui/goals.js`, `src/ui/goals.css`, `src/sim/media.js`, `src/ui/phone_reader.js`, `tools/navcheck.mjs`, `tools/navcheck.audit.json`.
New: `tools/onroad_check.mjs` (already in c254a45), `docs/reports/opus_bundle2.md`. Screenshots `out/shots/fix2_*`.
