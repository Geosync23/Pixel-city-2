# QA: navigation arrow, trips and phone nav apps (Opus QA & data lane, round 2, 2026-11-15)
Scope: the guide arrow (ui/navarrow.js), trips (sim/navigator.js), Map route card, MapleCab, rail/bus hooks, plus 12 known items.
Almost everything ran in portrait 390x844, headless Chromium, from `src/` (not `--dist`).
Driver: `/tmp/claude-0/-home-user-Pixel-city-2/ab4bf52b-889a-5288-a866-29c2e55d0472/scratchpad/nav/drv.mjs` + `help.js`.
It has real pathfinder walking (`walk`, `use`, `follow` = walk to / use whatever the arrow points at), real mouse clicks on the canvas, and a gap monitor.
The gap monitor counts every frame where a waypoint or trip is active, nothing modal is open, and the arrow is NOT shown (or is off screen).
Scenarios are `a_walk b_central e_train c_bus d_cab f_rooms g_intro2 h_map i_save j_night k_*.mjs` in the same folder. Screenshots are in its `shots/`.

## Defects
| # | what | where | severity | status |
|---|---|---|---|---|
| 1 | The trip strip (#nav-trip, fixed at top 58px) **covered the clock + needs bar** in portrait. It was 3-4 lines tall, and its close "x" wrapped onto its own line. | sim/navigator.js | high (portrait) | **Fixed**. The strip now sits under the HUD's top cluster (`clearTop()`). In portrait it shows only the current step: "To X: walk to Y". The x stays on the same line. The goals widget and #toasts are moved down under it while it shows, and put back after. Landscape is unchanged (top 58, no overlap). |
| 2 | Phone notification banners (#ph-banners, top 8px) covered the clock + needs bar and the trip strip (known item 3). | ui/phone.js | high (portrait) | **Fixed**. `placeBanners()` drops them below the HUD, the strip and the "This is your stop" banner. It re-checks every 400 ms while a banner shows. Exposed as `G.phone.placeBanners()`. Checked from the screenshot (j_night) and from the rects. The slide-in animation still passes over the HUD for 0.22 s. |
| 3 | Units: the route card said "WALK · 46 min" next to "Walk 144 m", and the arrow said "125 m" for a 40-minute walk (known item 6). | navigator.js, navarrow.js, phone_map.js | medium | **Fixed**. `G.nav.fmtDist(units)` uses `M_PER_U = 25`, which is about 80 m per walking minute, so it matches the shown time. Now "Walk 3.6 km", "· 3.1 km". The arrow, the route card, the Map place card and the Where-to list all use it. **Not mine:** ui/hud.js:92 (the need chooser) still prints `q.d` rounded as metres. Use `G.nav.fmtDist(q.d)` there. |
| 4 | **Bus estimates were 3-4x too optimistic, and buses were slower than walking.** Measured: a ridden bus covered 165 units in 90 game minutes (1.8 u/min; 22 of 60 real seconds stopped at lights and stops). Walking is about 3.1 u/min. The route card promised 35 min for clinic -> Jade Rabbit; the real trip took about 2 h. The estimate used straight-line Manhattan distance between stops at 7 u/min, but buses follow one-way loops. | navigator.js, transit.js | high (the card lied) | **Fixed in my files, but this is a tuning decision for the lead.** (a) The bus you ride drives at `BUS_RIDE_V = 10` (cab-ride pace), restored when you get off. (b) Bus rides pass game time at 1 game-min per real second instead of 1.5 (cabs stay at 1.5). (c) The estimate now uses the bus's own loop distance (`G.traffic.loops[r].stops[].u`) at `BUS_V = 3.8` u/min plus `BUS_DWELL = 5` min per stop on the way. Result: the bus is about as fast as walking, so it is now offered rarely (e.g. Blue Heron area -> Old Town, University & Western -> Western & Market). Clinic -> Jade Rabbit no longer offers it. If buses should matter, the traffic owner needs faster buses or fewer light stops. |
| 5 | Indoor MapleCab request: the app said "Your cab is on its way" before the cab was called (known item 4). | ui/phone_taxi.js | medium | **Fixed**. It now says "Head outside to meet your cab", "Requested" is the current step, the pick-up reads "once you are outside, then 3-8 min", and it explains that the cab is called on the street. Verified in int:cafe. |
| 6 | MapleCab's "Cancel ride (free)" called `G.transit.cancelTaxi()`, which does not exist. The cab was never cancelled and kept coming. Cancelling an indoor request also left the guided trip running (`taxi:cancel` only ended the trip when `!t.call`). | phone_taxi.js, navigator.js | medium | **Fixed** (`cancelTaxi \|\| cancel`; `taxi:cancel` ends any stage-0 cab trip). Inferred from the code; the cancel button was not clicked live. |
| 7 | The SkyDeck had no exit the arrow knew about (known item 1). | sim/showpieces.js + navarrow.js | medium | **Fixed**. The lifts get `navTo` (deck -> 'int:skydeck_lobby', lobby -> 'int:skydeck'), and navarrow's `edges()` follows any interactable with `navTo`. Verified by walking: deck "Lift down to the lobby" -> lift ride -> lobby "Exit to the street" -> city. |
| 8 | Mall shops were not places (known item 2). | sim/showpieces.js (+ navigator find) | medium | **Fixed**. `G.places.get('mall:<key>')` returns a place at the Galleria door with `room: 'deptstore'`, and `G.places.inner()` lists all 13. `known()` follows the Galleria. They are deliberately NOT in `G.places.list()`: that avoids 13 pins on one door, proximity toasts, and guide.js side effects. `G.nav.find` includes them (Food lists Tapioca Sky, Seoul Ember Express, La Mariposa Tacos, Twist & Salt Pretzels). Walked for real: Map card for mall:boba -> Set waypoint -> route card -> Walk -> "Go in: Maple Bay Galleria -> Tapioca Sky" -> door -> inside, arrow on the counter -> arrived. |
| 9 | The Map opened with `{place}` still showed the previous route card (`navDest` was not cleared). | ui/phone_map.js | low | **Fixed**. |
| 10 | Unused #ph-way CSS (known item 5). | ui/phone.css | cosmetic | **Removed** (3 rules and 2 selector mentions). |
| 11 | Wander bus-route stop rows set a plain waypoint (known item 7). | ui/phone_guide.js | low | **Fixed**. They go through `G.phone.routeTo`. Verified: a tap on a stop row opens the Map route card. |
| 12 | Circle released at once, because family counts as "known" (known item 8). | sim/apps.js | low | **Fixed**. It counts non-family only (`G.social.isFamily`). Live: known = 6 family + kit -> not released. Also found: the release pacing line ("at most one release per game hour") had been **commented out by accident**: it was on the same line as a `//` comment. That caused several "New app" banners in a row. **Fixed** (moved to its own line). |
| 13 | `isWet()` stayed true while rain faded out (known item 9). | sim/weather.js | low | **Fixed**. A hard `setWeather('clear')` already cleared it (verified). The smooth or natural fade kept `S.kind = 'rain'` until intensity < 0.3. Now it is dry once intensity <= 0.6 if the target sky is dry. Verified: wet at 1 to 0.65, dry from 0.58. |
| 14 | A planned city event showed twice: the automatic event row plus your own entry (known item 10). | ui/phone_planner.js | low | **Fixed**. `dedupe()` hides the event row when you have an entry with the same eventId/guide id, or the same title on the same day. The event detail shows "In your Planner: hh:mm - open it" instead of "Plan to go". Verified: 2 -> 1 row. |
| 15 | MapleCab showed a fare on the free first ride (known item 11). | sim/transit.js | low | **Fixed** in the hail/stand destination picker, which listed `$fare` per destination even when pre-paid. The app quote, the status and the route card already said "Free — prepaid". Verified in the intro: "Fare Free — prepaid". |
| 16 | The Wander drop cap 'B' looked like 'E' (known item 12). | ui/phone_guide.css | cosmetic | **Fixed**. It is the font's own capital B at 34px (checked side by side with weights 400/700). The drop cap now uses a book serif (Georgia), which suits a guidebook. |
| 17 | Saving on the train and pressing Continue put you at the **airport curb**: title.js goes to `flags.lastDoor`, which was stale. | scenes/trainride.js | medium | **Fixed**. The ride sets `flags.lastDoor` to the station the train last stopped at (Central = its door). Verified: save on the train -> Continue -> at Arts Quarter Station, trip re-routed (walk 69 min). Your ticket is spent. |
| 18 | After Continue the trip strip did not come back until the next scene change. | navigator.js | low | **Fixed** (render on `game:start`). |
| 19 | The bus-trip strip and route text said "toward Cooper St & Mill St ... get off at Cooper St & Mill St": loop buses have no terminus, so `toward` was the alight stop. | navigator.js | cosmetic | **Fixed**. `toward` is left out when it equals the alight stop. |
| 20 | Toasts (#toasts, top 104 from hud.css) overlap the arrow when it sits at the top edge, and the waiting chip. | kit/hud.css (not mine) | low | Partly fixed: the toasts move under the trip strip while it shows. The arrow edge vs toast overlap is left (transient). |
| 21 | Train route card from pub:40 at 11:00 picked Hillcrest Station (3.1 km away) over Arts Quarter (1 km), because of the timetable. | navigator.js trainOption | low (design) | Not changed. It is the honest fastest total, but it looks odd. |
| 22 | When a trip starts at Central, the Map label "Next: Hillcrest Station" overlaps the station's own label. | phone_map.js | cosmetic | Not fixed. |

## Played for real (results)
"Real" means: pathfinder walking with Char.move, interactables used by walking to them, DOM buttons clicked, and several canvas taps with the mouse (Arts station entrance, Central's street door, a train door, a bus stop).
Teleports were used only to place the start of a scenario.
Every run: 0 page errors from the game; the only errors were my own harness mistakes. The gap monitor recorded 0 frames with a missing or off-screen arrow in every scenario.
- **a. Walk across two districts** (airport curb -> Wax & Wane Records, arts): picked "Walk" on the route card. The arrow was edge-clamped the whole way, about 125 units of real walking. Arrival cleared it with the "You have arrived" toast.
- **b1. Train ending at Central** (owner's bug): Wax & Wane -> Rope Works Smokehouse.
  - Route card: TRAIN. Walked to Arts Quarter; the arrow switched to "Tap the station". Tapped the entrance on the canvas.
  - Panel pre-selected Central; bought a ticket, then "Wait on platform". The waiting chip showed. Train scene: chip "Stay on: Central in 81 min".
  - Red arrow "YOUR STOP IS NEXT" + banner, then "THIS IS YOUR STOP" + banner. Tapped the train door on the canvas.
  - Central hall: arrow "Exit to Downtown -> Rope Works Smokehouse" (it did NOT vanish). Used the exit, walked, arrived. Run twice.
- **b2/e. Train from Central + missed stop**: pub:60 -> Elm House Bakery.
  - Arrow to Central's door; tapped the door. Hall arrow "Platforms: Loop A to Hillcrest"; used the gates. The panel said "Your trip - to Hillcrest".
  - Boarded and rode. At Hillcrest I stayed on: banner "You missed your stop", chip "Missed your stop: get off at the next station".
  - At Arts Quarter: arrow "Get off at Arts Quarter: you will be re-routed". Got off and was re-routed: walk 55 min to the bakery.
- **c. Bus** (clinic -> Jade Rabbit, before fix #4): arrow to the stop -> "Tap the stop". Tapped the stop on the canvas; the panel had "Wait for bus 3 (your trip)" marked.
  The bus was there, so I boarded at once (the wait chip was seen in the second run). Ride: "Get off at ... · 2 stops", then red "YOUR STOP IS NEXT" + banner, then "THIS IS YOUR STOP" + banner.
  Clicked "Get off here", walked, arrived. **Missed bus stop** (University & Western -> Tudor Arms, after fix #4): waited for the bus (chip "Waiting for the bus: 1 Ring to ..."), rode, stayed on at my stop.
  Banner "You missed your stop", arrow "Missed it: get off at the next stop". Got off at the next stop: re-routed, walk 28 min.
- **d. Cab from the street**: MapleCab quote, then "Request ride". Arrow "Cab pick-up: wait at the kerb" -> boarded -> ride HUD + arrow on the destination -> "walk to the door" -> arrived.
  **Cab from inside the cafe**: the new "Head outside" status screen; arrow "Exit -> meet your cab outside". Used the exit: the cab was called on the street ("coming"), then "Your MapleCab: hop in", walked to it, rode.
  The arrival of this second ride was not observed: the script ended while riding.
- **f. Waypoint set while inside** (set waypoint -> follow the arrow out by walking and using exits): all reached the city, each with a sensible label.
  - home:juniper_court:bath -> "Back to the living room" -> "Leave"
  - home:sycamore_house -> "Leave"
  - lobby:7 -> "Exit to the street"
  - deptstore -> "Exit to the street"
  - cinema:screen1 -> "Lobby" -> "Exit"
  - concerthall:hall and playhouse:hall -> "Lobby" -> "Exit"
  - skydeck -> "Lift down to the lobby" (10 s lift) -> "Exit to the street"
  - conservatory -> "Exit to Central Park"
  - airport:terminal -> "Exit to the curb"
  - airport:concourse -> "Tram to Baggage Claim", then a chip during the tram
  - pub:9 -> "Exit"
- **g. Intro** (`?scene=city&intro`): walked the cabin aisle and used "Leave the plane", took the tram to Baggage Claim, grabbed the bag, used "Exit to the curb", walked the curb.
  Then the phone tutorial (phone, Messages, MapleCab, Call Cab home). No arrow or strip appeared anywhere in the airport. The cab tutorial produced a guided cab trip with "Fare Free — prepaid".
  After that: the arrow showed "Cab pick-up: wait at the kerb", the cab arrived, you are boarded automatically at the kerb, and during the ride (Manny's lines) the arrow sat on "Juniper Court".
  Arrived: trip ended, `firstCabFree` cleared, and the intro moved to "Click your door". Nothing odd. The strip "To Juniper Court: meet your MapleCab at the kerb" shows together with the intro caption; they do not overlap.
- **h. Map**: the dashed route + flag + "Next:" ring were seen for walk, train (Next: station), cab (pick-up -> destination) and indoors (from the cafe's street position).
  Bus: not seen after fix #4, because the bus was not offered for that pair. "Take me there" in Wander (bus-stop row) opened the route card. Map `{place:'mall:boba'}` opened its card.
- **i. Save mid-trip -> page reload -> title "Continue"** (real button):
  - Walking to the station: OK, the trip and arrow came back.
  - Waiting on the platform: OK, the activity is dropped; the arrow is "Tap the station" again and the ticket is kept.
  - On the train: was a bug (#17), fixed.
  - Inside Central's hall: OK, Continue puts you at Central's street door with the arrow on the destination.
  - Walk leg: OK -> arrived.
  - Bus and cab mid-ride saves were not run; a ride is never saved, and the navigator watchdog re-plans (from code).
- **j. Night 22:00 + rain**: the arrow, the red stop banner, the trip strip, a phone banner and the goals widget were all readable and did not overlap after the fixes (screenshot `m_j.png`). Landscape 1000x640 was checked once.

## Not tested / limits
- Touch input: mouse clicks only (`hasTouch` was off). Sound (the banner sfx). Bike mode. Real phones.
- A ride from the bus or train HUD "Get off at next stop" pre-arm. Airtram with an active trip from inside the terminal (chip only). Museum / observatory (other workers are building them).
- Bus and cab save/load mid-ride. The second cab ride's arrival.
- The tuning in fix #4 was measured on one bus route (bus3) only.
- Wander "Take me there" on a place entry and the need-bar chooser -> route card were not clicked this round. The worker before me did them, and the code path is the same `G.phone.routeTo`.

## Files changed
src/sim/navigator.js, src/ui/navarrow.js, src/ui/phone_map.js, src/ui/phone_taxi.js, src/ui/phone.js, src/ui/phone.css, src/sim/transit.js, src/scenes/trainride.js, src/sim/showpieces.js, src/sim/apps.js, src/sim/weather.js, src/ui/phone_planner.js, src/ui/phone_guide.js, src/ui/phone_guide.css.
New API: `G.nav.fmtDist(u)`, `G.nav.clearTop(x0, x1, skip?)`, `G.nav.M_PER_U`; `G.places.inner()`, mall ids in `G.places.get`; `G.phone.placeBanners()`; interactable field `navTo` (navarrow scene graph).
Tuning: `BUS_RIDE_V = 10` and bus ride time at 1 game-min/s (transit.js); `BUS_V = 3.8`, `BUS_DWELL = 5`, `M_PER_U = 25` (navigator.js).
Cross-owner side effect: while the trip strip shows, navigator.js sets an inline `top` on `#goalsw` and `#toasts` and resets it afterwards.
