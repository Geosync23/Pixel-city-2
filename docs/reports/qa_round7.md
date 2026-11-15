# QA round 7 (Opus QA lane, 2026-11-15): travel times, small fixes, homes / university / sound / performance

**Setup.** Headless Chromium, 390x844, `hasTouch`, the round-6 driver (`srv.mjs` + `p.py`) on ports 7807 / 7808 / 7809, plus `perf.mjs` (CPU throttling via CDP) on the single-file build. Scratch: `/tmp/claude-0/-home-user-Pixel-city-2/ab4bf52b-889a-5288-a866-29c2e55d0472/scratchpad/r7/` (screenshots in `shots/`, saves `ck7_crooked.json`, `uni_mid.json`, trip harness `trips.js` + `table.js`, raw tables `tbl_*.txt`, `perf4.txt`).
**What "played" means.** "Touch" = `touchscreen.tap` / CDP touch drag at the element or world point. "Walked" = the pathfinder walked the player (the same move as a tap on the ground). "API" = a direct call, named as such. Travel tables are API-driven trips (pathfinder walk, `callTaxi`, `boardBus`, `rideTrain`); the cab, bus and the stop wording were also replayed by touch.
`node tools/build.mjs` passes, `node src/data/validate.mjs` passes, `node tools/navcheck.mjs --rooms all`: **all audit rows pass; the only failure is the Chapter attic (`home:grandma -> home:grandma:attic`, left as asked).**

Shared-tree note: at 09:44 `src/sim/systems.js` (another worker) assigned `G.systems = {...}`, which replaced core's system list (`G.systems.push is not a function`, the game did not start). It was fixed by its owner a few minutes later; I only tested around it with a server-side overlay, no edit.

---

## Part A — fixes

### 1. Cab rides cost too much game time: **fixed** (measured on 5 trips x 3 speeds; replayed by touch)
**The rule now:** a cab ride's game time is set by its road route, not by how long the cut takes.
- `src/sim/transit.js`: `CAB_RIDE = { fixed: 1, perUnit: .06, detour: 1.3 }`: ride minutes = 1 + 0.06 x route length (units), where the billed length is at most 1.3 x the Manhattan distance + 15 (a one-way loop does not cost you 2.6x: Juniper Court -> Bayside Clinic is 106 units apart but 279 by road). The ride **owns the clock**: `G.cutscene.clock = true`, and `rideClock()` sets the clock to start + ride minutes x progress on every tick, at arrival and on Skip. So the ride costs the same at 1x, 2x, 4x and through red lights; the cut plays in whatever real time it takes (it is still sub-stepped by the game speed, so it is shorter at 4x).
- **Pick-up:** dispatched to take about `CAB_PICKUP = 6` game minutes (x the weather's `taxiWaitMult`, the number MapleCab already used). A cab that would arrive early waits off screen (`hold`); one that is still more than 12 units away 2 minutes before it is due is moved to the same street a few car lengths up from you and drives the rest (`lateCab`); the hard limit (placed at the kerb) is now due + 2 minutes (was 60 game minutes: the 18-44 minute waits of round 6).
- `G.transit.cabEstimate(to, from?) -> { wait, ride, minutes, len }` is the one estimate everybody shows. `src/sim/navigator.js` uses it for the cab option (`pickup` and `ride` fields; the route card text now reads "MapleCab: pick-up in about 6 min, then 14 min door to door"). My Day / Planner use `G.nav.routeTo`, so they follow.
- `src/ui/phone_taxi.js`: the quote shows "Pick-up in about 6 min" and "Ride about 14 min · there by 11:48" (was "3-8 min" and no ride time).
- **`src/core/game.js` (ride lines only), exactly one change** in `frame()`: `if (G.busy) { rate = G.busy.rate; }` became `if (G.busy) { rate = G.busy.rate; } else if (G.cutscene && G.cutscene.clock) rate = 0;` (a cab ride owns the clock). The round-6 ride sub-stepping block that the lead applied is unchanged.
- The free intro cab and the airport ride go through the same code (`callTaxi`), so they follow the same rule (not replayed).
- Also found and fixed while measuring:
  - **Trains** (`navigator.js trainOption`): the ride time subtracted the wait a second time (`pl.minutes - wait`; `plan().minutes` is the ride alone), and the plan used the train leaving NOW even when you could not walk to the station in time. Now `G.rail.plan(A, B, now + walk to the station)`; total = time until that train leaves + ride + walk. Before: Gilded Gull est 25 / actual 38, Slice of Heaven est 47 / actual 86.
  - **Buses** (`navigator.js busOption`): counted a bus that leaves the stop before you can get there; now the first bus due after your walk (else +`BUS_HEADWAY` 10). `transit.js waitBus`: while the bus you wait for is near, the clock ran at the game speed but an activity does not sub-step the world, so at 4x the bus you watch arriving cost 4x the minutes: the wait now runs at 1x for that last bit.
  - `routeTo(dest, from, { all: true })` returns the bus / train options even when they are not worth showing (for tests).
- Touch replay (port 7809): Map -> MapleCab -> Bay Realty & Trust: quote "pick-up about 6 min, ride about 15 min, there by 12:27"; requested 12:06, cab at the kerb 12:14, arrived **12:28.6** (est 12:27). And Bay Realty -> Wren Cottage the same way.

#### Travel table (game minutes, estimate the Map showed -> actual). From Juniper Court, day 0 from 19:03, needs frozen.
Walk and cab: the 5 trips are Noodle Lantern (85 units away), Kettle & Crumb (52), Bayside Clinic (106), Night Owl Coffee (227), Black Cat Ink (309).

| trip | walk 1x | walk 2x | walk 4x | cab 1x | cab 2x | cab 4x |
|---|---|---|---|---|---|---|
| Noodle Lantern | 18 -> 16 | 18 -> 16 | 18 -> 16 | 14 -> 16 | 14 -> 15 | 14 -> 14 |
| Kettle & Crumb | 11 -> 10 | 11 -> 10 | 11 -> 10 | 12 -> 12 | 12 -> 14 | 12 -> 12 |
| Bayside Clinic | 23 -> 20 | 23 -> 20 | 23 -> 20 | 16 -> 16 | 16 -> 18 | 16 -> 15 |
| Night Owl Coffee | 49 -> 43 | 49 -> 43 | 49 -> 45 | 22 -> 22 | 22 -> 24 | 22 -> 22 |
| Black Cat Ink | 66 -> 56 | 66 -> 56 | 66 -> 59 | 27 -> 27 | 27 -> 26 | 27 -> 29 |

Cab: every trip within 15% (worst 12 -> 14), pick-up 5-8 min. Before (same harness, current tree): 21 -> 44 at 1x; round 6: 43 / 51 / 57 at 1x / 2x / 4x. The cab is now 2-2.5x faster than walking from about 1.5 km; for a short hop (Kettle & Crumb, 900 m) walking stays as quick, which seems right. Walking runs 10-15% under its estimate (WALK .215 could go to .19; not changed).

Bus (Noodle Lantern, Night Owl Coffee, Black Cat Ink, Dot's Diner, Aquarium; "nobus" = not offered at that moment):

| trip | bus 1x (before) | bus 1x | bus 2x | bus 4x |
|---|---|---|---|---|
| Noodle Lantern | 16 -> 18 | nobus | nobus | 16 -> 28 |
| Night Owl Coffee | 42 -> 38 | 45 -> 40 | 47 -> 49 | 43 -> 35 |
| Black Cat Ink | 51 -> 56 | 57 -> 72 | 55 -> 66 | 52 -> 55 |
| Dot's Diner | 29 -> 31 | 29 -> 33 | 39 -> 41 | 29 -> 54 |
| Aquarium | 28 -> 30 | 34 -> 39 | 39 -> 45 | 34 -> 33 |

The 4x outliers (Noodle +75%, Dot's +86%) were the arrival-at-1x bug above; the re-run with that fix is in the addendum below the train table. Black Cat at 1x +26% is one long ride (55 min on the bus: a bus held at lights and stops). BUS_V (20 units per game minute) holds: the ride part matches on the other trips. Touch replay (Dot's Diner, 1x): Map said 34 min; at the stop 33.8 min after choosing; plus a walk of 8 = about 42 (+24%).

Train (6 trips, the Map's own plan, at 1x / 2x / 4x), after the fix:

| trip | 1x | 2x | 4x |
|---|---|---|---|
| Central Station | 47 -> 53 | 76 -> 85 | 74 -> 87 |
| Slice of Heaven | 84 -> 87 | 82 -> 85 | 77 -> 82 |
| Public Library | 84 -> 89 | 84 -> 89 | 81 -> 89 |
| The Orpheum | 69 -> 71 | 68 -> 71 | 66 -> 70 |
| The Blue Heron | 78 -> 79 | 77 -> 80 | 75 -> 80 |
| Aquarium | 72 -> 74 | 70 -> 73 | 68 -> 72 |

All within 18% (Central includes 4 min to walk out of the station hall, which the estimate does not count). The train itself is exact (departure and ride match the schedule to the minute). In the evening these trains were not worth offering against walking (waits of 30-60 min), and the Map now honestly does not offer them.

### 2. Round 6's small decisions
- **Arrow to a waiting cab: fixed** (`src/sim/navgoals.js`, new strong resolver `cab`, prio 95). Map / MapleCab trips already had navarrow's own cab guidance; this covers a cab called or hailed outside a Map trip (intro, story, hail). Coming: "Cab pick-up: wait at the kerb" at the pick-up spot; waiting: "Your MapleCab: tap it to get in" on the cab (it follows the cab). API check: states coming -> waiting -> walked away = arrow on the cab. Round 6's "no arrow" case (a MapleCab request from Nora's) was a Map/MapleCab trip, which does have the arrow in the current tree (touch replay above showed it).
- **Bus "Get off" wording: fixed** (`transit.js` ride HUD + `navigator.js` trip strip). On a Map bus trip: "Get off" is hidden until the stop before yours; then a gold "Get off at Harbor Blvd & Maple Ave (next)"; at your stop "THIS IS YOUR STOP: ..." and a gold "Get off here: your stop". At a wrong stop no "Get off here" is offered (Choose stop still lets you leave early). The subtitle counts down ("stay on, your stop X is 3 stops away"), and the trip strip's stop count is live ("(2 stops to go)", "(next stop)", "(your stop: get off now)"). Without a Map trip the buttons name the stop ("Get off at Cooper St"). **Touch replay** Juniper Court -> Dot's Diner: logged every change of the HUD (19:20-19:34, all as above), tapped "Get off here: your stop", got off at the right stop, the strip switched to "walk 8 min".
- **Bladder during long activities: fixed** (`src/sim/needs.js` guard): a long activity stops at Bladder 6 or less ("You stop (Put Your Feet Up): you really need the loo. Tap the Bladder bar for the nearest restroom."; asleep: "You wake up needing the loo..."). Not when the activity is the toilet / shower / bath. **Touch replay:** home, Bladder 9.6, sofa > Put Your Feet Up > 2 h: stopped at 19:58 with Bladder 5.7.
- **One notice per event: fixed / partly.** `src/sim/money.js`: the bills reminder no longer sends its own "Reminder" notice (the phone's `bills:soon` Bay Bank notice is the one), and "Weekly bills paid" is no longer banner + toast (the phone's `bills:due` Bay Bank banner is the one; only a part payment adds its own line). The "Tip: Monday bills" is now a one-time first-time window (another worker's file; it shows once ever). `src/sim/needs.js`: one notice per need per hour unless it got worse (the "Starving" banner twice in 5 min). Not replayed on a real Monday (API toast check below).
- **Welcome dinner / Nora's house: partly.** The welcome dinner is now Chapter 3 (`REHOUSED` in `src/sim/story.js`: its old calendar trigger and its "missed -> reschedule" are off), so rescheduling it belongs to the chapter engine (another worker): it should offer Chapter 3 again after "Tomorrow instead?". `src/ui/phone_taxi.js`: **Nora's House and Nana's House are MapleCab destinations from day 0** (Quick picks), even before you have walked past them. **Empty house while the phone says "At home":** `src/sim/social.js` `computeLoc` returns `{ placeId: null, label: 'At home' }` whenever the routine has no block, instead of their home. Patch for the lead (social.js is not in my list), line ~117: `const b = block(c, t); if (!b) return { placeId: null, label: 'At home', sceneId: null };` -> `const b = block(c, t); if (!b) return Object.assign(routineLoc(c, 'home'), { anim: 'stand' });` (routineLoc('home') puts Nora / Theo / Pip in `home:sibling`, or keeps "At home" for anyone without a home room). Not run.

### 3. Toasts: **fixed** (my part) + kit.js patch
- `src/ui/style.css`: never more than two toasts on screen (`#toasts .toast:nth-last-child(n+3){display:none}`: the newest two; older ones time out unseen); in portrait toasts are compact (13 px, padding 4x10, max 320 px). Shot `toast7`: five toasts + a Bay Bank banner: two toasts, both above y 246 (round 6: four deep to the middle).
- **`src/ui/kit.js` (lead), replace the body of `toast()`** (line 12) with:
```js
export function toast(text, kind = 'info', ms = 2600) { let box = document.getElementById('toasts'); if (!box) { box = el('div', { id: 'toasts' }); root().append(box); }
  for (const o of box.children) if (o.textContent === text && !o.classList.contains('out')) return o;   /* QA7: the same words twice at once: once */
  const live = [...box.children].filter(o => !o.classList.contains('out')); if (live.length >= 2) { const old = live[0]; old.classList.add('out'); setTimeout(() => old.remove(), 400); }   /* QA7: at most two; the oldest makes room */
  if (live.length) ms = Math.min(ms, 2200);   /* QA7: shorter while others queue */
  const t = el('div.toast.' + kind, { text }); box.append(t); setTimeout(() => t.classList.add('out'), ms); setTimeout(() => t.remove(), ms + 400); while (box.children.length > 4) box.firstChild.remove(); return t; }
```
- Keeping them off the centre: they are pushed down by three lead-owned helpers (navigator `placeBar` top, hud.js `toastsClear` margin under the arrow, phone.js `clearToasts` padding under a banner). With two compact toasts the worst stack I saw ends around y 300. If it is still too low, the cleanest rule is to cap the sum of those three pushes (e.g. 160 px) in hud.js.

### 4. navcheck audit: **fixed**
`tools/navcheck.audit.json`: the two "Need ... at home" rows now rent Juniper Court first if the test player lives elsewhere (`G.housing.rent('juniper_court')`). The courier row already passed in the current tree. `tools/navcheck.mjs`: a failing row now says why the arrow was hidden ("first-time window open" / "modal" / "not drawn"). Full run: all audit rows pass; room graph: only `home:grandma -> home:grandma:attic` (Chapter attic, left).

---

## Part B — playing what nobody played

### 5. More homes
- **Realtor window by touch** (Bay Realty & Trust > Listings): rent and buy rows by day (day 0: four rentals; day 47: all 23). **Buy Wren Cottage by touch**: Buy > Pre-furnished (+$1,460, 17 pieces) > 12 weeks at $500: paid $3,000 = $1,500 down + $1,460 + $40 van; mortgage `{left 6000, weekly 500}`. **There is no cash purchase**: buying is always 20% down + a mortgage; "Pay off the mortgage ($6,000)" is then on the Listings window (`furnish.js:393`) and in the bank app. Decision below.
- **Moving twice with your furniture:** Juniper -> Wren (bought, furnished) -> Crooked House (rented, empty): 7 boxes arrived (the three original moving boxes, the welcome kit, three FURNITURE boxes); after unpacking all 17 Wren pieces + 3 own pieces are in storage. **Bug fixed** (`src/ui/furnish.js`): moving out of a home you OWN sells it back silently: money went UP by $400 when signing a $350 lease (Wren's equity $750 credited, mortgage cleared) and the realtor's sheet did not say so (Nestly did). The lease sheet now says "You own Wren Cottage: moving out sells it back to the bank, and you get $750 (the mortgage is settled from the sale)" and the Sign row shows "$350 today, $750 back".
- **Crooked House door in its alley, from the street, by touch:** walked by taps from 7 units down Park St, tapped the door, in (shot `ck2`). The arrow says "The Crooked House · 120 m" then vanishes on arrival; fine.
- **Arrow from the street to an upstairs bed: bug found, partly fixed.** Street > "Go in" > "Stairs up" > upstairs "Ladder to the attic": following the arrow by taps, every tap toward the ladder sent you **back downstairs**, forever (logged 3 loops). Cause: you arrive upstairs standing on the "Stairs down" link, which has a door-sized tap target (core `pick`: doors get a capsule of max(hit,14) + 1.25 U world px, ~140 screen px at zoom 4), and the ladder lies beyond the stairwell on screen. Mine: `src/sim/housing.js` `goRoom` now steps you 1.3 tiles off the link into the room (`stepOff`), and `src/scenes/rooms/home_more.js` links have `hit: 6` (was 16). **Not enough on its own**: the loop only ends with the core patch below (tested through a test-server overlay of game.js, not in the tree): then the arrow taps reached the attic bed in 6 taps. **Lead patch, `src/core/game.js` `pick()`**: `if (isDoor(it)) {` -> `if (isDoor(it) && !(it.homelink && Math.hypot(it.x - G.player.x, it.y - G.player.y) < 3.5)) {` (a home's stairs / room doors right next to you use the normal tap radius).
- **Arrow to a bathroom on another floor:** Bladder > Home from the street to the Crooked House bathroom upstairs: street > Stairs up > Bathroom > The toilet, 5 taps, works (the bathroom is away from the stairwell).
- **Design mode upstairs:** Decorate in the attic by touch, tapped the Rattan Bed card: placed in the attic (`r: 'attic'`), Done.
- **Delivery + mail basket at a multi-room home** (API: `addFurniture` + `deliverNow`): the box stands in the main room, "Unpack: Boston Fern", placed, comfort 57 -> 58; the mail basket is there.
- **Every new home's door at night** (API walk + use, 23:10): all 14 doors answer (a "For rent" / "Not on the market yet" card; your own door lets you in), all reachable on foot; doors lit (shot `wrn`). Wren Cottage's mailbox stands 1.4 units from its door; a tap on the door still gets the door.
- **Old save in an old home:** round-6 save `ck6_d7_1430` (Juniper Court) loads: 8 placed pieces, storage, a delivery box, rooms main + bath, no errors.
- Not done: guests / family visiting a new home (only story homes have `invite`; nothing exists for player homes).

### 6. University
- **By touch:** door from the quad; the Registrar through the bottom name button ("Mrs. Hester Pym, Registrar"; tapping the desk from across the hall needs good aim); Enrol > Bay Ecology > section: $90 with the card; the Planner reminder "In 8 min"; the arrow "Ashby Lecture Theatre -> the lecture theatre"; in the theatre "take a seat (tap one)"; tapped a bench: the lecture sheet ("Begin", the professor's lines). Registrar > My courses > Change section (moved to Wed & Sat, Planner moved); Enrol a second course (Kitchen Science) > My courses > Withdraw > "Yes, withdraw" (Planner entry removed). Clubs board: joined the Chess Club, then Club night "Join in" ran its 45 minutes to the end ("A good club night").
- **Bugs fixed (`src/sim/university.js`):**
  - Sections were called "Day" / "Evening" by position: Bay Ecology's "Evening section" meets at 11:30, Computing's at 16:30. Now named by their hour (Morning / Afternoon / Evening), also on "Change to the ... section".
  - **Load in the middle of a lecture counted the class as missed** (save 11:51, load puts you in the street at 11:54, `checkMissed` saw 11:30 + 20 late minutes): `checkMissed` now skips a class you were in (`c.inClass`) until its end. Re-tested: after load `missed` stays, `current()` is that lecture. But you are put on the street, the class ends at T+40 and the walk back took 10+ minutes: in practice rejoining failed again (12:14). Recommendation: when a game is loaded mid-class, start the player at their seat (or give the lost minutes back).
  - **The pond class in the rain flipped between the pond and the lab tank as you went in and out:** `wet()` used `G.weather.isWet()`, which is false while YOU are indoors. Now it reads the weather itself (rain / storm / snow) or winter. API check of the cause (isWet indoors false / outdoors true in rain); the class itself not played in rain.
- **Closing time** (API time jump to 21:25 inside): at 21:31 "Closing up! Albie jingles his keys and walks you to the door", out in the street. **Sunday** (API): the hall opens 10:00; the Lecture Theatre and Workshops "Locked on Sundays. The Commons and the Reading Room are open."; the Commons and Reading Room open.
- **Certificate on a real shift's pay** (API: `jobs.debugStart('line_cook')` + `debugFinish`, cert set in state): without cert $114.50 paid; with Kitchen Science cert $114.75 + **$11 "Certificate bonus"** (10%). Not a hand-played shift.
- First lecture missed through my own harness (my tap landed on the trophy cabinet three times while the doors closed): the professor's note and the Planner moved on as designed.
- Not done: the practical, reading, project and final by touch; exam week; the pond class in rain in play; the Dean's scholarship; graduation.

### 7. Sound (API; nobody can hear here)
- **Title:** no AudioContext before a gesture (`state: 'none'`, 0 sfx) for 8 s on the title. The tap on Continue unlocks it (`running`, profile `city_night`, layers waves / air / traffic).
- **Simulated day** (walks at 4x, a cafe in and out with a purchase, the phone, a cab ride, then 20 h in 30-min steps, rain, storm): **0 errors, 0 unknown sounds**; 18 sounds in 5,468 frames (notify 12, achievement 3, honk 1, success 1, door sounds inside audio.js); **nothing fires every frame** (the most frequent, notify, in 11 frames). Ambience follows day / night (`city_night` -> `city_day` at 06:00) and weather (rain adds `rain`, storm adds `rumble`). Music track stayed "evening" through the night and next day, but only ~40 real seconds passed (it changes in real time), so not a finding.
- **Settings by touch:** dragged Music to 0 and tapped Effects at a quarter: `G.state.audio` and `G.audio.getVolume` follow at once (0 / 0.25).
- **For a human to listen for first:** (1) the notify ping (12 in one evening and the next day: is it pleasant that often?); (2) the door open / close pair entering and leaving a shop; (3) the cab honk on arrival; (4) rain and the storm rumble indoors vs outdoors; (5) the music loop seams and the quiet gaps; (6) the volume sliders really silencing music / effects. Note: buying a coffee at the counter made no sound in my run (the cafe menu path does not call `sfx('buy')`).

### 8. Performance (CPU throttled 4x via CDP, dist build, 390x844; the machine had a load average of ~3.8 on 4 cores from other workers, so these are pessimistic)

| scene | avg fps | p50 ms | p95 ms | worst ms | frames > 50 ms / > 100 ms |
|---|---|---|---|---|---|
| idle city, night, Old Town | 50.8 | 16.7 | 33 | 50 | 1 / 0 |
| walk 3 districts (Old Town > Downtown > Harborside), 1x | 38.2 | 16.7 | 50 | 417 | 170 / 33 |
| walk at 4x game speed | 37.3 | 16.7 | 50 | 167 | 23 / 5 |
| big-box store (Fjord) walking | 53.4 | 16.7 | 33 | 317 | 4 / 1 |
| parade (`blossom_parade`, 304 ents, 4,448 objects) | **29.3** | 33 | 67 | **700** | 54 / 8 |
| winter, snowing, walk | 38.2 | 16.7 | 50 | 283 | 70 / 17 |
| walk into unpainted ground (Hillcrest > Maplewood, first visit) | 39.1 | 16.7 | 50 | 433 | 74 / 17 |

Top offenders (profiled on the source build while walking): `drawImage` 16% (the blit), `engine/render.js draw` 3.1% + `poolSprite` 2.3%, **`getBoundingClientRect` 2.8%** (layout reads from the per-frame UI helpers: navarrow reads banner / toast rects every frame, hud.js `toastsClear`, phone.js `clearToasts`, navigator `placeBar`), `putImageData` 1.8% + `raster.js fill` 1.5% (ground / sprite painting: the 300-700 ms hitches), `getContext` 1.5% (called per frame somewhere: cache the context), **`G.nearestInteractable` 1.4%** (core: scans every interactable each frame), `rail.js placeCars` 1.2%, `hud.js fast` 0.9%. The parade halves the frame rate (30 fps) and has the worst single frame (700 ms when it stages). Nothing small and safe in my files, so no fix; suggestions for the owners: throttle navarrow's rect reads to ~5 Hz, cache `getContext`, let `nearestInteractable` use the scene's spatial grid, and spread new ground-chunk painting over frames.

---

### Addendum: bus re-run after the "arrival at 1x" fix (same five trips; Noodle Lantern was not offered at those moments)

| trip | bus 2x | bus 4x |
|---|---|---|
| Night Owl Coffee | 46 -> 41 | 43 -> 37 |
| Black Cat Ink | 52 -> 52 | 52 -> 49 |
| Dot's Diner | 31 -> 30 | 30 -> 34 |
| Aquarium | 28 -> 36 | 37 -> 29 |

4x is now within 22% (was +75% / +86%), 2x within 29% (one trip; the rest within 11%). What is left is the bus's arrival prediction (`nextBuses`), not the ride.

## Patches for lead-owned files (exact)
1. **`src/core/game.js` `pick()`** (stairs loop upstairs): `if (isDoor(it)) {` -> `if (isDoor(it) && !(it.homelink && Math.hypot(it.x - G.player.x, it.y - G.player.y) < 3.5)) {`. Tested via an overlay only.
2. **`src/ui/kit.js` `toast()`**: the body above (two at a time, no identical duplicates, shorter while queued).
3. **`src/sim/social.js` `computeLoc`**: `if (!b) return { placeId: null, label: 'At home', sceneId: null };` -> `if (!b) return Object.assign(routineLoc(c, 'home'), { anim: 'stand' });`. Not run.
4. **`src/ui/phone.js` `bills:soon`** text (optional, the one bills notice now): `Rent & bills tomorrow: ${money(...)}` -> `Rent & bills tomorrow at 8 AM: ${money(...)}`.
5. Round 6 patches C (addresses), D (story.js lines), E (wake card "null"), F, G: not re-checked this round.

## Decisions needed
1. Cab speed: ride = 1 + 0.06 per route unit (a cab about 4x walking pace) and a 6-minute pick-up. Faster or slower? (`CAB_RIDE`, `CAB_PICKUP` in transit.js.)
2. Buying a home: always 20% down + mortgage (no cash price at the realtor). Add "Pay in full" when you can afford it?
3. Moving out of a home you own sells it automatically. Keep (now explained on both sheets), or keep owned homes?
4. Loading mid-class: start the player in their seat, or count the class as attended?
5. Bus 4x residual and the 1x Black Cat +26%: the ride part is right; what remains is bus arrival prediction. Accept, or make on-screen buses keep to the timetable?
6. WALK estimate runs 10-15% long (.215 per unit; measured .19). Shorten?

## Not tested
- Real phone / real sound; any of the above at 2x/4x by touch (tables are API trips).
- The welcome-dinner reschedule (chapter engine); the social.js patch; kit.js and game.js patches in the real tree.
- University: practical, reading, project, final, exam week, pond in rain, scholarship, graduation in play.
- Homes: guests in a new home (does not exist); furnished buy of the villa / penthouse.
- Bills on a real Monday after the change (code path + phone banner only).

## Files changed
`src/sim/transit.js`, `src/sim/navigator.js`, `src/core/game.js` (one ride line), `src/sim/navgoals.js` (cab resolver), `src/ui/phone_taxi.js`, `src/sim/needs.js`, `src/sim/money.js`, `src/ui/style.css` (toast rules), `tools/navcheck.audit.json`, `tools/navcheck.mjs`, `src/sim/housing.js` (`stepOff`), `src/scenes/rooms/home_more.js` (link hit), `src/ui/furnish.js` (sale on the lease sheet), `src/sim/university.js` (section names, mid-class load, wet pond), `docs/reports/qa_round7.md`.
