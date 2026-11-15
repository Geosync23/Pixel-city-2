# QA round 3 (Opus QA & data lane, 2026-11-15): museum, observatory, recipes, city-folk lines, buses, pedestrians on the road
Everything below ran in headless Chromium from `src/` (not `--dist`), mostly in portrait 390x844. The driver is in
`/tmp/claude-0/-home-user-Pixel-city-2/ab4bf52b-889a-5288-a866-29c2e55d0472/scratchpad/r3/`:
- `drv.mjs` + `help.js`: the scenario runner and its helpers.
- `bubs.mjs`: a parallel bubble logger.
- `peds.mjs`: a logger for pedestrians stopped on the asphalt.
- `bustrip.mjs`: a door-to-door trip timer.
- `reach.mjs`: the recipe reachability check.
- Scenario files `cook*.mjs`, `mus*.mjs`, `obs*.mjs`, `react.mjs`, `ctx.mjs`, `bench.mjs`, `roadsyn.mjs`.

Screenshots are in its `shots/`.

**What "real" means here:**
- The player walks by the pathfinder (Char.move) and uses interactables by walking up to them.
- DOM buttons are clicked.
- Canvas mini-games are played with Playwright mouse drags and taps: the dig pit, the telescope focus, constellation tracing, and the Decorate placement.

Teleports only set the start of a scenario. Where I set up a situation through the API, the line says **(setup via API)**.

The shared build stopped loading three times because another worker's file was mid-edit: `src/art/chars/char.js` threw "shoe is not a function", and `src/sim/clothes_shop.js` declared `order` twice. Each time I waited and re-ran.

**Two of my own mistakes, both found and fixed before the final runs:**
- A `// comment` inserted mid-line disabled code in four places for part of the session: `_crowd_core.js` talkTo, the `museum.js` shelf row, the observatory roof party sync, and one `venues_extra.js` stock line. I re-ran the affected checks afterwards: reachability, museum shots, the roof party and the tap test.
- My first two museum scripts did not close the exhibit dialog. Those runs are not counted.

## Defects
| # | what | where | sev | status |
|---|---|---|---|---|
| D1 | **Indoor bubbles almost never appeared.** The room chatter picked ONE random slot of the 18-slot pool. With 4-7 people in a room, most ticks hit an empty slot: about one bubble a minute, and in the cafe the lead saw none in 30 s. | src/sim/_crowd_rooms.js | high | **Fixed.** The speaker is now picked among settled people who are visible. A failed try retries in 2 s. Measured below: 3-5.6 per minute indoors, gaps 7-15 s. |
| D2 | Bubbles could sit off screen or on the HUD. Near the right edge an absolutely positioned bubble also shrank to the space left (116 px wide, 6 lines tall), and it covered the money/speed cluster at Central Station (4 of 15 bubbles). | src/sim/_crowd_core.js `speak()` | medium | **Fixed.** The bubble now gets its natural width (`max-content`) and is slid sideways onto the screen. It is measured, and removed before it is ever painted if it would still be cut off or overlap `.hud-tl/.hud-tr/.hud-br/.hud-bc/#nav-trip/#nav-arrow/.ride-hud`. A duet's answer may take a bubble slot but must still fit. After the fix: 0 off-screen and 0 HUD overlaps in every logged run. |
| D3 | Lines about the player came every ~6 s: the general picker drew player-state lines for anyone within 5 units, outside the 18 s reaction limit. | _crowd_lines.js, crowd.js | medium | **Fixed.** There is now one shared limit (`REACT`, 18 s) for every line about the player. Measured minimum gaps were 30.7 / 18.0 / 38.7 s (smelly / soaked / pajamas, 150 s walks). |
| D4 | **Bumps were never noticed.** The bump test ran only at the 5-10 s chatter tick, so the moment was missed: 0 bump lines in 4 deliberate walk-throughs. | crowd.js | medium | **Fixed.** Bumps are caught every frame, and the reaction follows within 0.4 s (subject to the 18 s limit). 4 of 5 walk-throughs now got a bump line ("Ouch! I'll survive. Probably.", "Oops-a-daisy! Everybody okay?", "Slow down a bit, friend!"). |
| D5 | Standing still in a crowd gave a "staring" line every ~20 s (8 of 23 bubbles in the park). | crowd.js | low | **Fixed.** At most one staring line per 45 s, never twice from the same person. |
| D6 | Showpiece rooms (museum, observatory, Galleria, SkyDeck…) run their own crowds, which spoke only when tapped. No city-folk lines appeared there at all. | _crowd_rooms.js | medium | **Fixed.** The same 7-15 s ambient chatter now runs there, from visible unnamed people with the room's `LINES.venue` pool, and is silent during a planetarium show. Measured 5.6 per minute in each of museum, observatory and Galleria, with lines like "Do not touch the dinosaur. I touched the sign.", "The Galleria's so big I've lost my partner…". |
| D7 | Indoor lines that do not fit: a "picnic, sandwiches, ants" weather line in the observatory, and "New year, same fountain" in the mall. | _crowd_lines.js | low | **Fixed.** No weather lines from the general mix indoors, and new-year lines only outdoors. Spring 1, the first day of every new game, is New Year's Day in this calendar, so new players hear new-year talk outdoors on day 1. That is intended by the calendar, but worth knowing. |
| D8 | Dormant line contexts. | _crowd_lines.js | — | **Wired:** player `sitting_bench`, `taking_photo` (phone camera, or museum / conservatory / aquarium / observatory photo events; 30 s), `lost` (Map app opened 3 times within a real minute outdoors; 90 s), `promoted` (1 game day), `full`, `caffeinated`; events `rent_day` (bills due within 24 h, or due less than 10 h ago), `payday` (Fridays), `new_year`, `star_party` (Saturday party today or tomorrow), `flower_show` (at or near the conservatory); weather `rainbow` (rain stopped less than 60 game min ago, 06-20 h) and `first_snow` (snowing on the first snow day of a winter). Verified live: lost and taking_photo detection; rainbow lines after rain (about 10% of lines once tuned); rent_day and payday correctly absent on a Monday afternoon. NOT seen live: sitting_bench (people-watching fast-forwards, so it was over in about 2 s), first_snow, star_party lines, flower_show lines, payday on a Friday. |
| D9 | **Pedestrians stopping on the road** (owner bug, from the coordinator). | crowd.js, _crowd_core.js | high | **Fixed defensively.** Not reproduced naturally in 80 watched minutes (see "Pedestrians"). Five suspects confirmed in the code, all now impossible: (1) `hold` from a tap froze a crossing pedestrian for 3.2 s, or 600 s while a talk dialog was open; (2) chat / phone / stroll pauses could begin at a node on the asphalt; (3) a follower stopped wherever its stopped leader stood; (4) a walker with no free cell paused in place; (5) nobody hurried when traffic came. New rule: on asphalt, nobody pauses, chats, answers a tap or waits. A tap on a pedestrian on the road is ignored. Anyone who stands still on the roadway for 0.5 s ESCAPEs: runs straight to the nearest kerb, then strolls on. Crossers whose road is no longer clear switch to the run pose at 1.9x speed. Vehicles still yield as before. |
| D10 | Buses were not worth taking: a bus every ~90 min per route, rides about walking pace. The route card's **walking** estimate was also 40-58% too slow (measured), which made every comparison wrong. | traffic.js, transit.js, navigator.js | high | **Fixed (tuning, see "Buses").** |
| D11 | An off-screen bus could pass the waiting player unseen. The wait runs at 10x and the bus is spawned only in a ring just off screen, so one wait took 53 min against a card estimate of 2. | transit.js | medium | **Fixed.** The wait drops to 1x when the bus is 6 min or less away. Not reproduced after the change (inferred: rare). |
| D12 | The ridden bus got stuck behind a bunched bus of its own route and stopped at every stop with it. Half the ride was spent at red lights. | traffic.js, transit.js | medium | **Fixed.** The ridden bus gets transit signal priority (the existing cab `pre` mechanism). A real bus with the ridden one close behind it drives at ride pace with priority. Headway control: a bus that has caught up with the one ahead waits up to 6 extra minutes at a stop. |
| D13 | `busOption` compared walk-leg **minutes** with the trip distance in **units**, so bus routes with long walks were offered. | navigator.js | low | **Fixed.** |
| D14 | Cookbook shop: an owned cookbook kept its Buy button, and a second copy was taken without a refund. | src/ui/shop.js | medium | **Fixed.** The row shows "Owned" (re-rendered 350 ms after the purchase, once the book is shelved), and buy() refuses with "That one is already on your kitchen shelf." Verified by a real purchase at Dog-Eared Books. |
| D15 | Shop notes leaked internal ids: "Required for sketch_outdoors.", "(paint activity)", "watch_movie", "fish_pier", "feed_ducks", "market_stalls … artValueMult". | src/data/items.js | low | **Fixed.** Six notes rewritten in player language. |
| D16 | Gallery stock data error: sketchbook and canvas (category misc) were stocked at `gen_retail_gallery`, which sells only gifts. validate had relaxed its check for generic types. | venues_extra.js, validate.mjs | low | **Fixed.** Galleries no longer stock them (their postcards come from the gift line). validate checks generic types again and passes. |
| D17 | Tasting dish "Pastrami on Rye" (club sandwich teaser) was sold only at `gen_eatery_deli`, a type with no venue in the city. | venues_extra.js | low | **Fixed.** It is also on the diner menus (Dot's Diner + generic diners). Re-check: all 212 recipes pass (below). |
| D18 | Farmers' market event stalls listed none of the new produce. | src/data/calendar.js | cosmetic | **Fixed** (farm stand +9 vegetables, fish stall + salmon/shrimp/mussels, honey stall + honey/maple syrup/jam). Note: no runtime code reads `special.stalls[].sells`. The market's real stock is the `market_stalls` venue, which already had everything. |
| D19 | "THE MUSEUM SHOP" ran off the shelf top. A shorter "MUSEUM SHOP" still clipped its last letter. | src/scenes/rooms/museum.js | cosmetic | **Fixed:** "SHOP" (looked at). |
| D20 | The timeline mural's title "THE STORY OF MAPLE BAY" ran over the pictures. | src/art/showpiece/museum.js | cosmetic | **Fixed.** A navy title band with a gold rule at the top (looked at). |
| D21 | The hall banners hung in mid-air. | src/art/showpiece/museum.js | cosmetic | **Fixed.** A brass rod with finials, hung from the ceiling on two wires (looked at). The asset height is now 3.3. |
| D22 | **The curator's three boxes could not be found by following the arrow.** They are not map places, and the goal pointed at the museum. | src/sim/museum.js | medium | **Fixed.** On accepting and after each find, the waypoint goes to the nearest box still to find. After the third it goes back to the museum. While searching, the goal has no placeId, so a tap cannot pull the arrow back to the museum. See the museum section for the live result. |
| D23 | **Planetarium seated view:** in portrait, a seated player saw only the lower-left corner of the dome sky. | src/scenes/rooms/observatory.js | high (the show is the point) | **Fixed.** While you are seated and the show is dimming / running / in applause, the camera looks at the corner where the two sky walls meet (`camTarget`). It is released when the show ends, when you stand, and on exit. Looked at in portrait 390x844 and landscape 844x390 and 1000x640: the sky fills the screen and the captions stay readable. In portrait the picture is wider than the phone, so a planet drawn far right (Mars in "Journey to the Planets") can sit just off the right edge. |
| D24 | **Cloudy star parties did not move into the planetarium**, although the desk says they do, and the roof toast said everyone stands around on the terrace. | src/sim/observatory.js, rooms/observatory.js | medium | **Fixed.** On a clouded-out party, the roof is empty (telescopes, lanterns and guests hidden) and its toast says the party has moved down. Entering the planetarium credits the party (stamp, moodlet, counter) with a toast, and Stella starts a show 8 s after the theatre goes idle, back to back until midnight. Verified live at 23:12 Saturday, cloudy. |
| D25 | A save loaded mid-show left the theatre idle with the show marked done. | src/scenes/rooms/observatory.js | medium | **Fixed.** `load` resets seats, audience and the seated activity, then re-checks the clock. Verified: save at t=24 s, watch to the end, `G.load()` → the show resumed at t=27 (14:27), and the player could sit and rejoin. Continue from the title screen puts you in the city at the door (title.js). When you walk back in, the same check joins the show mid-way. |
| D26 | The guide arrow (z 20) sat on top of toasts (z 6) when clamped to the top edge. | src/ui/hud.js | low | **Fixed.** While they would overlap, the toast column slides under the arrow (margin-top, so navigator.js keeps control of #toasts' own top). Inferred from the code plus a DOM check, not watched over a whole trip. |
| D27 | The phone's "New app: Nestly" banner sits over the cook menu's top tabs right after a new game. | src/ui/phone.js (not mine) | low | **Needs the owner of phone.js:** `placeBanners()` should avoid an open `.win` header, or delay banners while a modal is open. |
| D28 | Cars stop for the player standing on the kerb corner, because vehicles test peds within 0.98 of the lane line. 10 such stops in 20 min at Central. | _traffic_veh.js | low | Not changed (the brief says to keep yielding to the player). If wanted: ignore the player when they are on a non-asphalt tile. |
| D29 | Venue pools are not time-aware: "Wait your turn. It's the moon" was heard in the observatory gallery at 14:30. | src/story/ambient_lines.js (data) | cosmetic | Not changed. I deleted no lines: none was plainly wrong for its pool. |

## Played for real: results
### A. Museum (portrait; scenarios mus3, mus5, mus6)
- **Entry:** walked from the street to `door:museum` and in ("Cool stone, hushed voices…").
- **Ticket:** "Tickets, audio guide & tours" → Day ticket, $6 charged. The clerk labelled "Info & tickets" only answers with a bubble; the desk is the fixture.
- **Ten exhibits** looked at by walking up and tapping. The text panels (Marge, minerals, fossils, Pteranodon, cannery, timeline, whale) open a dialog. "Rain on Maple Avenue" and "Cat on a Windowsill" open the picture viewer ("Step back"). The city model has its own menu. Logbook: Natural 3/6, Art 2/10, City 3/6.
- **Dig pit** with a real mouse drag: about 36 sweeps across the canvas cleared the sand and found a "Raptor Claw".
- **Sketch** from an Art Wing bench: 46 game min, 1 sketch pinned, "Logged: Maple No. 7".
- **Scavenger hunt:** all 8 clues found by walking to the right exhibits (8/8, "take your card back to the info desk"). For the badge claim, see MUSEUM_HUNT.
- **Membership** ($40) bought at the desk. The audio guide is then free; all 10 stops were walked ("Audio trail complete").
- **Scheduled 14:00 tour:** joined by tapping Ines, then followed on foot to the end. "Tour complete (6 of 6 stops)" after 140 game min.
- **Closing walk-out:** at 18:31 "We are closing, I am afraid." A guard walked me past Marge; I was in the city at 18:36.
- MUSEUM_REST

### B. Observatory (portrait; obs1, obs3, obs4)
- **Entry and ticket:** walked in from the street; day ticket $6 at the desk.
- **Gallery toys**, each tapped for real: meteorite (Pallasite text), gravity well (a quarter in orbit), weight on other worlds, rocket launcher (7.4 m), orrery crank, pendulum (pegs vs clock).
- **Scheduled show:** joined "Tonight's Sky" mid-show at 14:20 and sat. It was credited at the end ("New to you (1/4 programmes seen)").
- **Saturday 20:32, clear** (time and weather set via API): the star-party toast showed on the roof.
- **Great Telescope:** chose the Moon and tapped the eyepiece when it was sharp: "The Moon: pin-sharp. New in your logbook (1/12)".
- **Constellation finder:** picked Leo and tapped its 9 stars on the canvas: "Leo, the Lion: traced (1/12)".
- **Moon sketch** ("Waxing Gibbous…") and the party's free cocoa both worked.
- **Cloudy party at 23:12** (weather via API): see D24.
- **Comet chain:** Dr. Halvorsen → "I will take the eyepiece" → chain st 1, "New opportunity: sweep for the comet…". The three sweep nights were NOT played; the observatory worker ran them by eval.

### C. Recipes / cooking (portrait; cook1, cook3, cook4, cook5)
- **New game → stove:** "Open your recipes" shows "Can cook now · 13" and 51 of 212 known. Cooked Banana Oat Porridge: 12 min, "+30 cooking xp (first time — bonus!)", saved to the kitchen.
- **Tabs** checked by eye: Baking ("Needs Cooking level 2/3", then "Needs an oven (Gas Range & Oven)" on Juniper's hot plate once level 2), "To learn · 161" teasers ("? ? ? You will work this one out yourself at Cooking level 2", cookbook names, "Taste it first…"), and Drinks. The fridge opens "No-cook dishes & drinks" (25 recipes, 3 ready).
- **Shopping trip, walked:** Juniper Court → Dog-Eared Books (bought "Brunch All Day": "4 new recipes", known 51 → 55) → Rise & Shine Bakery (flour, yeast) → Old Town Market stall (bell pepper, mushrooms, garlic) → Lucky Corner (peanut butter) → home. "Groceries put away in the kitchen: Flour, Baking Yeast, Bell Pepper, Mushrooms and 2 more." The backpack was empty and the items were in the kitchen.
- **Level-up learning:** 3 real dishes → "Cooking skill is now level 2!" and "4 new recipes: Ginger Congee, Egg Salad Sandwich, Sweetcorn Chowder and 1 more!"
- **Tasting:** 3 Avocado Toasts eaten in at Bean & Gone (the real cafe) → "New recipe: Avocado Toast!"
- **Owned badge:** see D14.

### D. City-folk lines
See the measurements. Duets read as A, then B 1.9 s later; B always appeared while A was still up. No line repeated in any run (0 repeats over about 400 logged bubbles).

### E. Buses
Four trips ridden through the route card, the stop panel ("Wait for bus") and the ride HUD ("Get off here"), plus the same four trips walked. See the measurements.

### Pedestrians on the road (coordinator's request)
Four signalised junctions (downtown 206,232 · Old Town 82,296 · Harbor 112,296 · by Central 206,296), 10 min at 1x + 10 min at 4x each. The player stood on the corner kerb. The logger sampled every 250 ms. It counted a citizen as stopped when it stood on asphalt and moved less than 0.02 per sample for more than 2 s. It counted a vehicle as blocked when it was stopped for more than 5 s with a pedestrian inside its forward lane box, using the same geometry as `_traffic_veh.js`. Raw `pedWait` is no use here: it grows at every red light.

| | stopped pedestrians (1x / 4x) | vehicles blocked by a pedestrian | vehicles blocked by the player |
|---|---|---|---|
| **before** (4 junctions x 20 min) | 0 / 5* | 2* | 13 |
| **after** (same) | **0 / 0** | **0** | 17 |

\* All five "stops" and both bus blocks happened at 03:14 game time at all four junctions at once, with the player 300+ units away. The player had passed out (energy), the city froze while they were indoors, and frozen people were logged. That is a logger artefact, not the bug. The after run kept needs topped up.

**So the owner's bug did NOT reproduce naturally in 80 watched minutes.** The fix is defensive, for the five code paths in D9. Synthetic check, after the fix **(setup via API: real citizens placed on a roadway cell in the state each suspect describes)**:
- tapped through the real interactable: still on the road 0 s, no dialog opened;
- `hold = 600` (an open talk dialog): 0 s;
- paused and chatting: 0 s;
- leader standing still on the road: 0.6 s, then it ran to the kerb;
- its follower: 0.6 s.

Before the fix the same situations freeze for the hold, pause or wait time. That is inferred from the code, not run, because the old code is gone.

Crowds still look natural:
- 273 sidewalk pause samples and 249 follower samples in 10 s at Central (people still chat and wait at kerbs);
- 0 citizens on asphalt except while crossing;
- fps 58-60 with 4 pages at once.

## Measurements
### Buses (tuning)
**Network** (unchanged routes and stops):
- 1 Ring: loop 880 u, 9 stops.
- 2 Airport-Maplewood: 596 u, 8 stops.
- 3 Old Town-Harbor: 572 u, 7 stops.

**Before:** 2 buses per route, off-screen speed 6 u/min, 5 min dwell. That is a lap of about 190 min, so a bus every ~95 min.

**Now:**
- Buses per route = lap time / 10 min: 12 / 8 / 8.
- Off-screen speed 9 u/min, dwell 2 min (2 real s on screen).
- Bus-stop panels showed e.g. "3, 14, 26, 35, 47, 58 …" min: one every ~11 min in the daytime.
- A ridden bus runs at 10 u/s on screen with signal priority. The clock runs at 0.2x during the ride (`BUS_CLOCK`, the same idea as intro_airport's slow clock; a cab ride runs at 1.5x). The real-time length of a ride is unchanged; it costs less game time.
- Ridden pace measured: 9.6-17.7 u per game min, including stops.
- Navigator: `WALK = .215` min per Manhattan unit (measured: .203-.233; was .32), `BUS_V = 20`, `BUS_DWELL = .6`, `M_PER_U = 17` (keeps about 80 m per walking minute).

Real door-to-door trips (walk to the stop, wait, ride, walk), all through the route card:

| trip | card bus | real bus | err | card walk | real walk | bus / walk (real) |
|---|---|---|---|---|---|---|
| The Sail Loft → Lantern Playhouse (1 Ring, 5 stops) | 41 | 47 | -13% | 69 | 74 | 0.64 |
| Tidewater Insurance Plaza → Addis Table (1 Ring, 3) | 34 | 32 | +7% | 47 | 49 | 0.65 |
| Noodle Lantern → Rope Works Smokehouse (3, 2 stops) | 22 | 23 | -4% | 38 | 36 | 0.64 |
| Harbor Tea & Spice → Tidewater Gallery | 39 | 38 | +2% | 58 | 66 | 0.58 |

**Result:**
- Estimates are within -13%..+7% for buses and -12%..+7% for walking (target ±20%).
- A real bus trip takes 0.58-0.65 of the walking time, not the asked ~0.5. Example breakdown (trip 1): walk 8 + wait 7 + ride 25 + walk 8.
- The remaining gap is the walk to and from stops: stops are about 90 units apart, so each leg takes 8-20 min. That needs more stops or more routes, which I was not allowed to change.
- Before the tuning, the same first trips measured 1.0, 1.9 and 1.3 of walking (bus slower than walking).
- Route-card scan, 125 random cross-district pairs (at least 120 units apart): a bus is offered for 86 of them, with a median estimate of 0.66 x walking.

### Cooking pacing (simulated week, 2 meals a day)
The game's own `G.skills.addXp` is fed with real recipe xp and the x1.5 first-time bonus, from a cook who always picks the highest-level recipe they have not cooked yet (the fastest realistic pace):
- days 1-7: L1, L2, L2, L3, L4, L4, **L5 on day 7**.

That is not before day 5, so the first-time bonus is unchanged. In real play, 3 dishes reached level 2 on day 1 (30 + 11 + 30 xp + mood multipliers = 112 xp).

### Recipe reachability (script, live city)
Reachable = venue and stall places plus places inside buildings (mall shops) plus pois with a venue plus `<venue>:<sub>` venues of reachable buildings. That gives 160 venue ids.
- Every one of the 212 recipes passes: every ingredient is sold at a reachable place, every cookbook at a reachable shop, and every tasting recipe has at least one reachable dish.
- The only failing dish was gen_pastrami, which is fixed (D17).

### Bubbles per place
Portrait, 1x, the player standing still. Counts are for 180 s unless noted. "Rate" is bubbles per minute; the target is 6-12 in the city and 4-8.5 indoors.

| place | bubbles / time | rate | gaps (s) | repeats | off-screen | on HUD |
|---|---|---|---|---|---|---|
| downtown street | 23 | 7.7 | 5.1-13.6 (1.9 = duet B) | 0 | 0 | 0 |
| harbor | 26 | 8.7 | 5-10.7 | 0 | 0 | 0 |
| Central Park | 23 | 7.7 | 5.3-12.6 | 0 | 0 | 0 |
| Old Town | 24 | 8.0 | 5-9.9 | 0 | 0 | 0 |
| Arts Quarter | 21 | 7.0 | 5.2-14.8 | 0 | 0 | 0 |
| Hillcrest | 23 | 7.7 | 4-12.9 | 0 | 0 | 0 |
| cafe (mid-room) | 15 | 5.0 | 7.6-21.9 | 0 | 0 | 0 |
| library (mid-room) | 15 | 5.0 | 7.4-19.1 | 0 | 0 | 0 |
| bank (mid-room) | 13 | 4.3 | 7.4-13.3 (one 49.7) | 0 | 0 | 0 |
| grocery (mid-room) | 13 | 4.3 | 8.1-18.7 | 0 | 0 | 0 |
| Central Station (mid-room) | 15 | 5.0 | 7-17.4 | 0 | 0 (4 before D2) | 0 |
| diner | 4 in 40 s (direct watch) | ~6 | — | 0 | 0 | 0 |
| museum / observatory / Galleria (150 s each) | 14 each | 5.6 | 7.2-15.4 | 0 | 0 | 0 |

- **Before D1** the cafe gave 0 bubbles in 40 s, and the diner and grocery 0 in 180 s.
- **Where the line fits:** city spots mix general, district, timeOfDay, near-landmark (campus, conservatory) and duet lines. Rooms are mostly `venue.<their key>` (cafe, library, bank, station, grocery, museum, observatory, mall). I saw no beach or other out-of-place talk except D7 and D29.
- **Portrait framing:** standing on a room's door mat, the camera shows only the lower part of most rooms. In the diner the only visible person was a cook cut off under the HUD, so no bubble shows there (correctly). Once you walk in, bubbles come.

## Not tested / limits
- MUSEUM_NOT
- Touch input (mouse only); sound; real phones.
- Observatory: the comet sweep nights 2-3, the chain reward, and a clear star party's guest telescopes were not played; "Tonight's Sky" ran mid-show only.
- A Friday (payday lines) and a winter (first snow) were not simulated. Bench sitting (`sitting_bench`) was not seen live.
- Buses: route 2 was not ridden in the final trip set. The 53-minute wait was not reproduced after the fix, and it was not reproduced before it either, so the cause is inferred.
- Pedestrians: the owner's bug was not reproduced naturally (see above). The "before" behaviour of the fixed code paths is inferred from the code.
- The toast-vs-arrow change (D26) was not watched over a full trip.

## Files changed
- src/sim/_crowd_lines.js, _crowd_core.js, crowd.js, _crowd_rooms.js
- src/sim/transit.js, traffic.js, _traffic_veh.js, navigator.js
- src/ui/shop.js, src/ui/hud.js
- src/data/items.js, venues_extra.js, validate.mjs, calendar.js
- src/sim/museum.js, src/scenes/rooms/museum.js, src/art/showpiece/museum.js
- src/sim/observatory.js, src/scenes/rooms/observatory.js
- docs/reports/qa_round3.md (this file)

**New API:**
- Event `crowd:say(citizen, text)`.
- `bubbleOk(c)` in _crowd_core.
- `REACT` in _crowd_lines (the shared 18 s limit).
- `G.observatory.cloudyParty()` and `onTheatre()`.
- `sc.star.reset()` and `sc.star.check()` (planetarium).
- traffic `BUS_HEADWAY`, `BUS_REAL_V`; transit `BUS_CLOCK`.
- Vehicle fields `ride`, `leadFast`.
