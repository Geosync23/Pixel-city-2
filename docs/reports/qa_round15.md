# QA round 15 (Opus QA lane, 2026-11-16): shows and the 0.85 clock in play, 2x/4x shifts and rides, Chapter 7, a friend arc, the let-down, the seating sweep, music

**Setup.** Round 14's driver copied to `/tmp/claude-0/-home-user-Pixel-city-2/ab4bf52b-889a-5288-a866-29c2e55d0472/scratchpad/r15/` (`srv.mjs` on port 7850; from Part C on restarted with `NOFREEZE=1` so animation frames, and with them the music scheduler, keep running between requests). New: `r15.js` (`TRAV` = board / get off / wait for the bus by tapping the on-screen button, else walk the arrow; `CH15`/`CH16` = the chapter loop plus "Close the book" and `.say` boxes), `mus.js` (music logger: every change of tune / context / gap with game clock, frame-seconds and wall-seconds), `sweep/` (Part B: `inv.mjs` seat inventory of all 234 rooms, `sweep.mjs` room seats, `city.mjs` outdoor seats, `sheets.mjs` / `zoom.mjs` / `full.mjs` contact sheets). Saves: `r15_d29_0722_onshift`, `r15_d31_0700`, `r15_d31_2245`, `r15_d32_ch7done`, `r15_d32_arcs`, `r15_c_bag`.
**Words.** "Touch" = `touchscreen.tap` / CDP drag at a point read off the screen. "Walked" = the pathfinder along the arrow or `use()` on a door (same movement as a tap; used when my taps landed on HUD buttons). "API", "clock", "teleport", "debug" = named where used. "Code" = read, not run.
**Checks (final build).** `node src/data/validate.mjs` OK; `node tools/build.mjs` OK (14,469 KB); `node tools/jobs_check.mjs` OK; `node tools/rel_check.mjs` OK; `node tools/navcheck.mjs --rooms all`: 277 rooms / 518 doors OK, **1 audit row failed** in the full run (courier: "Hand the parcel over at the counter" vs `/Exit → Deliver to/`) and **passed when re-run alone** (`--only audit --row courier`): flaky under load, not my change; 0 page errors. `grep -c '(?<[=!]' dist/index.html` = 0. Seat sweep and city pass: 0 page errors.

---

## Part A

### A1. Shows: advertised vs actual (game minutes)
| show | how | printed | entered hall / seated | lights dim | show runs | house empty | verdict |
|---|---|---|---|---|---|---|---|
| Film "The Last Ferry", d31, 1x | **played**: ticket bought by touch at the box office 13:08, "Wait in the lobby" (13:09→14:30, 81 min, 5 real s), seat tapped | 14:45 · about 100 min | 14:30 / 14:34 | 14:45 | **14:45 → 16:25 = 100 min** (60 real s) | 16:34 | exact (the round-14 fix holds) |
| Film "The Last Ferry", d33 | debug `G.shows.startNow` (printed = now + 15), seated by `seatHere` | 09:15 · 100 | 09:00 / 09:00 | 09:15 | 09:15 → 10:55 = 100 | 11:05 | exact |
| Concert "Harbour Lights Waltz", d31, 1x | debug `startNow` (walks you in at doors-open), seat tapped by touch | 20:36 · 110 min | 20:22 / 20:27 | 20:39 | **20:40 → 22:29 = 109 min** (86 real s) | 22:45 | 4 min late start; length right |

**"Starts ~10 min after the printed time" (not changed, owner decision).** Measured and read (`sim/shows.js` `step()`): the doors phase ends only when (a) at least `TUNE.doorsMin` = 15 **real** seconds have passed since *you* came into the hall, (b) you are seated and (c) 85% of the arrived audience is seated; meanwhile the free clock runs (0.85 game min per real s at 1x, 2x/4x faster). So lights dim at **your entry + at least ~13 game min at 1x** (~26 at 2x, ~51 at 4x). Come in when the doors open (printed − 15) and it starts on time (14:45 on the dot above; the concert, entered at −14 and seated at −9, started +4). Come in at printed − 8 (round 14: 12:22 for 12:30) and it starts ~+10 (12:40). **What the player sees:** the hall fills (people walk in and sit; after ~30 s unseated: "The room is nearly full. Tap your seat (the marked one) to sit down."), the clock in the HUD passes the printed time, and **at the printed time My Day says "Starting now: The Last Ferry at The Orpheum has started."** while the hall is still filling; then "The house lights dim. Phones away. A hush falls over the room." and the film.

### A2. Shift and rides at 2x / 4x
| # | what | quoted | actual | verdict | how |
|---|---|---|---|---|---|
| 1 | **4x shift** (d29, clocked in 07:22, "Work the shift", 4x tapped once at 07:27, speed never touched again) | 6 h | 07:27→13:00 = 333 game min in **193 real s (1.73 game min/s)**; tasks 246 min in 104 s, between tasks 85 min in 88 s (walking at 4x, ingredient sheets pause the clock); **75 tasks (23 perfect), 6 missed**, 6 × "A customer gave up waiting"; ★★★★★ 81/100 "clocked in late"; $146.25 (wages 5.6 h $73.25 + bonuses $60.50 + tips $12.50) | valid; 4x barely faster | played: round 14's `WORK` loop (answers the ingredient sheet from the ticket on screen, walks the arrow by taps), job-story dialogue tapped by hand |
| 2 | **2x shift** (d30, same loop, clocked in 06:30 automatically) | 6 h | 06:33→13:00 = 387 min in **257 real s (1.51 game min/s)**; tasks 315 min in 135 s, between 70 min in 122 s; **96 tasks (29 perfect), 5 missed**; ★★★★★ 84/100; $170 | 4x saves ~14% real time | played, same loop |
| 3 | walk 2x, home → Bean & Gone | 8 min | 05:50→05:59 at the door (9 min incl. flat + lobby), 7 real s | fine | walked (my first try by taps hit the Backpack button) |
| 4 | walk 2x, Juniper Court → Park St & Cooper St stop | 9 min | 14:17→14:33 = **16 min** | long (not explained; no detour seen in the timeline) | walked |
| 5 | **bus 2x** to the Aquarium | 31 min (walk 9, next 9, 3 stops, walk 10), $1.50 | bus at 14:39 (6 min wait; "Waiting for the bus" was cancelled once by "you really need the loo"); ride 14:39→14:48 = 9 min (54 real s: the ride runs at the fixed 0.2x clock, `transit.js` line 243, at any speed); walk 14:48→15:01 = 13; total **44** | late (the walk) | played (TRAV taps "Wait for bus 3", "Get off here: your stop") |
| 6 | cab 2x, cafe → school (requested **indoors**) | pick-up ~6, ride ~17, there by 13:31, $22.25 | outside 13:11, cab 13:20 (13 after the request), ride 13:20→13:38 (18), $22.50 | 7 min after "there by"; +$0.25 | played |
| 7 | **cab 4x**, school → home (outdoors) | ~6, ~21, by 14:09, $23.50 | cab 13:47 (5), ride 13:47→14:07 (20), $23.50 | on time | played |
| 8 | cab 1x, cafe → Orpheum, stayed inside eating to 12:29 | ~6, ~19, by 12:42, $22.25 | cab 12:39 (23 after the request), ride 19, $22.75 | "there by" not met when you stay in (the card says pick-up is at the kerb) | played |
| 9 | bus 4x, walk 4x | | not measured this round (the bus ride itself is speed-independent by code; round 14 has the 4x walk: 13 for 8) | - | - |

### A3. Story
| what | how | result |
|---|---|---|
| **Chapter 7 "Ninety-Seven Steps"**, start to finish | named shortcuts: clock advanced to the window with needs topped to 100 every 15 game min (API), `G.chapters.debug.toMarker()` (teleport); then **all by touch**: marker → card "Begin", dialogue and picks (first option), the stair climb (toasts "Forty-four. 53 to go."), "Close the book", the lamp pump (16 taps in 5.7 s), Silas's lines, the call with Dad, the log | card **"Chapter 7 · DONE"** at 17:16 (`r15_a3_ch7h`). Climb 15:07→15:28; then "Dusk in a few minutes" and **"You wait. The sun goes down…" = a 101-min skip** to 17:10 |
| **Friend arc "Legs", scene 2 "No Bike" (Dez, Dot)** | it was in `G.rel.debug.available()` on its own; `G.rel.debug.invite('dez.nobike', true)` sent the real invite text ("someone took my bike. from outside dots. im not ok. can you come") and took me to Dot's Diner (named); rose card "Begin" and all lines by touch | played 18:01→18:07 (21 real s; "the clock stands still while you talk"), Dez friendship 85 (`r15_a3_arc2/3`) |
| **Let-down of a second match** | set-up by debug (named): Felix → 'dating', Tasha friendship 60 + 'dating'; `fire('tasha.steady')` ("One Name on the Board", played by taps; it plays where you stand, here the lighthouse lantern); teleport to Nest & Wire; tapped "Talk to Felix" | Tasha → exclusive; your own text to Felix "Can we talk? Nothing bad. Well. A little bad."; talking to him ran the kind ending: narrator, your choice, Felix: "Oh. Right. Okay. Thank you for telling me in words…", "The lamp's still under guarantee. Unofficially. For life." → Felix 'none', friendship 33.9 (`r15_a3_letdown1-3`) |

Writing notes seen (not changed): (1) Ch7: Silas "Dusk in a few minutes" is followed by a 101-minute wait. (2) Ch7, the 97 branch: Dad says "You've missed the doorstep. Everybody misses the doorstep." and then "...Who told you about the doorstep." (only reads right after the 98 branch). (3) Ch7: "One hundred and thirty years, every night" vs the hook "lit every night since 1871". (4) "No Bike" says "eleven drops this afternoon … You come back round to Dot's at five" and can be played at 18:01 (its window starts 08:00). (5) My Ch7 attempt on d31 failed only because my loop idled (harness); `toWindow(7)` once returned true at 18:01 while `row()` said "closed" a minute later (debug only).

### A4. The phone's sticky tip line: **found and fixed**
Not visible on screen: `r14_a2_zip1.png` and my reproduction (`r15_a4_tip1.png`) show no tip. Cause (`src/ui/phone.js` `tip()`): the tip faded by CSS (opacity 0) but kept its text in a `role="status"` live region, so anything that reads text (round 14's `PH()` text reader, a screen reader) found the last tip in every app for days. **Fix:** 250 ms after the fade the text is emptied unless a new tip is showing. Verified in the rebuilt game: "Ask for your next shift off?…" shown, 3.3 s later `className "ph-tip"`, text `""`; MapleCab opened afterwards has no tip text.

### A5. "Sleep until morning" on a work night (not changed)
**Played** (d28 21:21, shift d29 07:00, energy 37): the bed menu by touch (`r15_a5_bed`) offers "Sleep until morning · Wake at 07:00 · 9 h 37 min" first and "Sleep until it is time for work · Wake at 05:44, 75 min before your shift · 8 h 21 min" second, nothing marked. Chose "until morning": during the sleep the notices fire unseen ("In 30 min: Shift…" 06:30, "Leave now… 8 min on foot" 06:42, "Starting now" 07:00); wake 07:00 with "Good morning!" (Energy 100) and "Starting now: Shift at Bean & Gone" on top. Walking straight there by touch on d31: **clocked in 07:14 (inside the 15-min grace: not late)**; with my two detours on d29: 07:22 "Clocked in (late)" (−5 points; pay from clock-in). From farther homes (> ~13 min) the player is always late. Code: `sim/activities.js` `menu()`, lines 466-468.
- **Option 1 (smallest):** on a night before a shift that starts before ~07:45, label the row "Sleep until morning · Wake at 07:00 · late for work" (or grey it out) and keep "until it is time for work" as the first row.
- **Option 2:** make "until morning" mean "until your morning": wake at the earlier of 07:00 and 75 min before the next shift, and say so ("Wake at 05:44, before work").

---

## Part B: seating sweep (Stage 76)
**Method (script, real game code):** `inv.mjs` loaded all 234 rooms (dev build) and listed every seat-bearing piece: 189 rooms, 119 furniture types, 549 room × piece × facing combinations; deduplicated per venue type (all pubs one type, all homes one, …) = **329 cases**. `sweep.mjs` seated the player on one free seat of each case with **the same call the generic Sit makes** (`activities.js sitOn`: `G.startActivity({anim:'sit', at: seat})` + `poseOpts.seated` for raised seats; no walk) at 13:00 with the room's NPCs, and took a 390×844 screenshot: **313 shots `out/shots/r15_seat_NNN_<room>_<piece>_d<facing>.png`** (14 lie-down seats — beds, bathtubs — skipped; 2 aquarium sub-rooms not reachable by `G.go`). City: `city.mjs`, 26 outdoor piece × facing cases, `r15_seat_city_NN_*.png`. I looked at every case on 22 contact sheets (crops around the player) and opened the full shots / 3x zooms of every doubtful one. 27 room cases landed on a seat an NPC already held (no free seat of that facing): harness doubles, not reported.

| # | where (room, piece, facing) | screenshot | what is wrong | kind / suggestion |
|---|---|---|---|---|
| B1 | `library`, `furn.cafe.armchair` d1, seat (14, 10.05, z .42) | `r15_seat_213_*` | **the floor lamp's cream shade covers the seated player's face** | data/layout: `src/scenes/rooms/venues_fun.js` library: `generic.floorlamp` at (13.5, 9.5) stands one tile camera-side of `cafe.armchair` (12.5, 8.5). Move the lamp behind or beside the chair (lead's call: it is layout, not seat data, so I did not move it) |
| B2 | `airport:concourse`, `furn.airport.seats` d1 (back row) | `r15_seat_002_*` | seated player **completely hidden** behind the hanging "TRAM + BAGGAGE" sign | render: a tall thing in front of a *seated* player does not fade (the see-through copy is off for sitters) |
| B3 | `arena:bowl`, `furn.arena.bench` d1 (team bench) | `r15_seat_018_*` | player completely hidden behind the centre-hung scoreboard | same as B2 |
| B4 | `deptstore`, `furn.clothing.pouf` d1 | `r15_seat_102_*` | player completely hidden behind a tall shelving unit | same as B2 |
| B5 | `school_classroom`, `job.school.carpet` d2 / d1 | `r15_seat_093_*`, `_094_*` | hidden / cut at the neck by the reading-corner divider | the known "seated behind a low object is hidden" rule (seating.md §7) |
| B6 | `clinic` and `pub:34`, `furn.clinic.chairs` d1 | `r15_seat_231_*`, `_297_*` | neighbours on the chair row overlap the player by about half a body | art: `src/art/venue/clinic.js` line 15, the row is `n × 0.5` wide (seats 0.5 apart); same class as the known diner booth |
| B7 | `university`, `furn.cityhall.bench` d1 (4 seats) | `r15_seat_171_*` | four sitters on one bench, each overlapping the next | same class (seat spacing in the bench art) |
| B8 | `gym`, `furn.gym.bike` d2, seat (6.55, 2.75, z .88) on the bike at (6.25, 2.75) | `r15_seat_205_*` | the player's back floats to the right of the bike frame, floor under him | art seat offset (`src/art`), please re-check the bike's seat point |
| B9 | `pub:36`, `furn.pf.grilltable` d0 / d2 | `r15_seat_298_*`, `_299_*` | the player's own table is drawn see-through (it fades as a tall piece) | render; minor |
| B10 | city, `prop.rail.bench` at (73, 117.5) and (370.4, 205) | `r15_seat_city_01/02_*` | the player is drawn sitting in mid-air above the street, ~6 units above the drawn bench | `sim/activities.js` ~line 503 (city "Sit"): seat z = `ob.z + q.z`; these benches have `ob.z` 8.625 / 7.625 while the ground at the Sit button is 3.0 / 2.0. **Code + harness shot**; the game's own Sit on (73, 117.5) opened its Bench menu at ground 3.0 but my script did not complete the People-Watch step, so the floating sitter was not seen through the real menu |
| B11 | city, `prop.park.rowboat` d1 at (150.5, 220), seat z −0.7 | `r15_seat_city_20_*` | sitter drawn under the boat, in the water | seat data of the rowboat (one facing only; d0 at (93,156.5) is right) |
| B12 | floor seats: school carpet, `pf.lowtable` cushions, `home.yogamat`, `park.blanket` | `_092`, `_289`-`_292`, `_320`, `city_05/06` | the chair pose at floor level reads as sitting on an invisible stool (blanket: ~0.45 above it) | no cross-legged pose exists; owner question |

Everything else read correctly: facing-the-camera seats show the piece behind the body, back-to-camera seats are covered by backrests and table edges, booths and counters cover the lap, no wrong facing, no NPC drawn inside a piece. Not re-reported: sit / stand cut, loungers upright, diner booth overlap, gazebo / pergola roof. **No seat data was changed** (no plain facing / offset mistake in a room file was found). Not checked: the city benches that have no "Sit" button of their own (my city pass placed the player on every seat-bearing prop; three of them, 1018 / 1021 / 1026, turned out to have no Sit nearby, so their odd look is my harness and not reported), night lighting, a real phone.

---

## Part C: music (`G.audio.debug.music()` logged every 250 ms; played on the d32-d33 saves; wall seconds)
| # | place / event | how | pool and tune | verdict |
|---|---|---|---|---|
| C1 | street, Dot's Diner door, golden hour | loaded | `out:golden:harbor:2` "High Tide Reel" | right |
| C2 | hops to Old Town, Downtown, Arts Quarter, Maplewood while it played | teleport in the street (named; the controller reads only the position) | context changed 4 times (`…market`, `…downtown`, `…arts`, `…suburb`), **tune kept playing** | right |
| C3 | natural end → next | waited | **gap 28.5 s**, then "Last Light on the Water" (`out:evening:suburb:2`) | in 20-50 |
| C4 | rain starts | `setWeather('rain')` (API) | tune carries on, context `rain`; next: "Gutter Song", "Blue Hour Tram", "Rain on the Pane" | right |
| C5 | Skip | Settings › Now playing › **Skip by touch** (and once by API) | 1.0 s gap, next tune of the same pool; the row's title updates | right |
| C6 | Mute | Settings **Mute by touch** | tune stops in 0.2 s, `music: null`, bed null, master 0 | silent |
| C7 | Sound on | touch | new tune 8.1 s later | right |
| C8 | Music slider → 0 | **CDP drag by touch** | tune stops; "Music 0" | silent (restored to 60 by API: my drag back missed) |
| C9 | save → reload | driver save + boot | bags, `recent`, play count kept; the saved `rain` bag [blue_tram, pane] drew blue_tram first. **The tune held as "next" (Street of Umbrellas) was in no bag and misses that round** | as the music report says |
| C10 | home (raining), lobby, cafe, clothing shop, Nest & Wire | `G.go` (teleport) | `home_rain` "Rain on the Pane"; lobby **keeps** the tune; `cafe` "Open Shutters"; `shop` "Aisle Seven" / "Escalator Up"; each change: bar ends, gap 2.6-4.9 s | right |
| C11 | film | `startNow` (debug) | **silent from doors to the end**; back **20.1 s after `show:end`** ("Walk Me Home", `hotel`) | right (12 + 8) |
| C12 | TV (Nest & Wire, "Watch TV 15 min", by touch) | touch | stops at the start; back **20.0 s** after the TV ends | right |
| C13 | cab ride (real, 1x) | played | rain tune winds down at pick-up → `cab` "Neon Laundry" → cut 11 s in at arrival → `festival` "Noon Whistle" at Market Square (Harvest Festival day; festival beats rain) | works, but churns (C-odd 1) |
| C14 | work shift | `G.jobs.debugStart('barista')` (debug) | `work` "Steady Hands"; after the shift `cafe` "Lantern Street" | right |
| C15 | date scene | `G.rel.debug.fire('tasha.partner')` | `date` "Candle for Two" | right |
| C16 | night, clear | clock 23:40 + `setWeather('clear')` (named) | `out:late:harbor:2` "Bay Express", Skip → "Meter Running" | right |
| C17 | bus ride, title screen | not run | - | - |

**Odd, not changed (audio.js is not mine):**
1. **A cab ride churns three tunes in ~30 s.** At 1x a cab ride is ~17 real s: the outdoor tune winds down, 4 s gap, a cab tune plays ~11 s, then winds down at arrival. *Patch suggestion* (`sim/audio.js` `musicCtx()`): let the cab keep the kind of place while a tune is playing, so the cab pool only picks the next tune: `if (rideKind === 'taxi') return { g: player && cur ? cur.g : 'ride:cab', key: 'cab' };` (same idea for the bus if wanted).
2. Walking through doors often cuts a tune in its first seconds (Open Shutters at 3 s, Blue Hour Tram at 13 s); they go back in the bag (by design), but the player hears many starts. Owner question with the music report's Q2.
3. The gap counts down on frame time (`musicGap -= dt`), so a throttled tab stretches it (read, not tested).

## Other things seen
- **"Leave now: The Last Ferry … starts at 14:45 (in 11 min). The Orpheum is 1 min on foot away."** fired at 14:34 while I was **already seated in Screen 1** (the planner's "you are there" check knows the lobby, not the hall). Not changed (planner); suggested: treat the venue's hall as "there".
- The box office offered **"Wait in the lobby" for 877 min** (an overnight wait for tomorrow's 12:30) (`r15_a1_box`).
- The "Starting now" HUD card sits over the phone's title bar when the phone is open (`r15_a5_entry`).
- Loading a save made mid-shift ends the shift ("Shift at Bean & Gone wrapped up: $0.25 paid") and the cafe does not clock you in again that day (`jobs.js` `recover`, by design).
- In Nest & Wire my tap walk put the player on Felix's spot behind the counter (two figures on one spot, `r15_a3_letdown1`): harness path, worth a look (the staff tile is walkable).
- Harness failures this round (not game bugs): a cab "gave up waiting" because my loop never walked to it, followed by a hunger pass-out (clinic, −$40); a `toWindow` jump drained needs into another pass-out; my `leave()` did not know the hall's exit is labelled "Lobby".

## Decisions for the owner
1. Sleep until morning on a work night: option 1 (label "late for work") or option 2 (wake for work).
2. Shows: start at the printed time when you are seated by then? (measured above.)
3. Cab music: keep the street tune through a short ride (patch above)?
4. B1 library lamp: move it (layout change, tiny)?
5. Floor seats with the chair pose (B12): fine, or a cross-legged pose?

## Files changed
- `src/ui/phone.js` (the tip's text is emptied after it fades; one line + comment).
- `docs/reports/qa_round15.md` (this report). `dist/index.html` rebuilt by the checks.
