# QA round 14 (Opus QA lane, 2026-11-15/16): two played days at the 0.85 clock, plays by hand, a promotion, job-nudge wording

**Setup.** Round 13's driver copied to `/tmp/claude-0/-home-user-Pixel-city-2/ab4bf52b-889a-5288-a866-29c2e55d0472/scratchpad/r14/` (`srv.mjs`, dist build, port 7844; a second instance on 7845 for parallel checks; `srv.mjs` gained a `hold` step = a real CDP touchStart, poll, touchEnd). New helpers: `tl.js` (a timeline of every timed thing: game clock, **real seconds summed from frame dt while unfrozen**, speed, activity start/end with game minutes and real seconds, notifications, toasts, money, rides, shows, orders, laundry, scenes), `r14.js` (`NTW` arrow-follow by taps, `TAPW` tap an interactable, `AW` "walked" = pathfinder along the arrow, `WORK` shift loop with the ingredient sheet answered from the on-screen ticket, `BARI` the Regulars answered from what is printed on each card, `RIDE2`, `NEXTSHIFT`). Saves (new): `r14_d28_2116.json` (after the work day), `r14_d30_0544.json` (after the free day). Timelines: `tl_day1.json`, `tl_day2.json`.
**Measured frame rate.** Headless Chromium ran at 60 fps; 10 real s = 8.50 game min at 1x (`G.CLOCK` .85 exactly; no dt capping).
**What "played" means.** "Touch" = `touchscreen.tap` at a point read off the screen (or a CDP touch hold). "Walked" = the pathfinder along the arrow / `use()` on a door (same movement as a tap; used from Tuesday 08:47 on because my walk-taps kept landing on sinks, seats, stalls and shop doors). "API" / "clock" / "teleport" = named where used.
**Checks (final build).** `node src/data/validate.mjs` passes; `node tools/build.mjs` passes (14,456 KB); `node tools/jobs_check.mjs` passes; `node tools/rel_check.mjs` passes; `node tools/navcheck.mjs --rooms all`: **all passed, 0 page errors** (`scratchpad/r14/navcheck.txt`).
**Part C** was dropped by the lead mid-round; no script or measurements were made (one bus observation from Part A is in the table, as it happened on my trip).

---

## Part A: the 0.85 clock, played

### The two days (r13_d27_h2done save; Sun d27 set-up, **Mon d28 = work day**, **Tue d29 = free day**)
Set-up, named: money +$500 by API (the save was at -$143 after round 13's clock skips). Sunday afternoon: hired as **Trainee Barista** at Bean & Gone by touch in the Jobs app (my card finder hit the first "Apply" on the board instead of Florist; I kept it: Mon-Fri 07:00-13:00). Energy was 5 from the save; a 40-tap harness loop on a University restroom cost 4 game hours (each use is a 5-min `G.advance`, not an activity, so my loop never saw it "busy"), then a cab home and a pass-out at energy 0 inside my own flat (finding A16).

### Table (promise vs actual; game minutes; real seconds where it matters)
| # | where (file / screen) | the game promised | what happened | verdict | done |
|---|---|---|---|---|---|
| A1 | `core/game.js` free clock | .85 game min per real s | 8.50 per 10.0 s at 60 fps | fine | - |
| A2 | `sim/planner.js` "Leave now" (walk + `LEAD.buffer` 10) | Pip & Milo 14:45, "57 min on foot" (Sun) | fired 13:39, "in 66 min" | fine (by design it uses the **walking** time) | - |
| A3 | same | shift 07:00, "8 min walk · leave by 06:42" (My Day) | My Day row and banner agree (06:40 "in 20 min") | fine | - |
| A4 | same, **on a Map trip already** | (none) | on the train to work at 06:40: "Leave now: Shift … (in 20 min). Bean & Gone is 10 min on foot away." | wrong moment | **fixed**: no "Leave now" while a Map trip to that place runs |
| A5 | same, **during a fast activity** | Pip & Milo 14:45, Leave now 13:48 | "Linger a While · 2 h" runs at 20 game min/s: the banner came at 13:48 and the clock was at 14:06 before a tap could land (≈1 real s) | **late**: 18 min gone | **fixed**: "Leave now" ends a leisure activity (`actId`, not sleep/nap, not on shift / auto-work / class / transport wait) with "Time to go: Pick up Pip & Milo at 14:45." Re-played: linger stopped at 13:49 with that toast (`r14_a1` vs driver 2 on d30) |
| A6 | first version of A5's fix | - | it also ended **Auto-working** on a shift when a class's Leave-now fired (d37 10:28: shift cut to 3.5 h) | my regression | **fixed** (guard above). Re-played a full auto-worked shift 07:27-12:59: not interrupted. (The class row had moved off that day, so the exact Leave-now-during-auto-work recurrence was verified by code, not re-seen) |
| A7 | Leave-now text for a date at a spot | "A walk with Felix starts at 20:30 (in 37 min). **there is** 31 min on foot" | wording | **fixed**: uses the spot's name ("the River Walk is 31 min on foot") |
| A8 | Leave-now for the date (spot position) | fired 19:53, walk 31 | walked 19:54 → **20:25** (31) | on time | - |
| A9 | route card WALK estimates | 5 / 8 / 18 / 21 / 31 / 7 / 11 | 4-5 / 10 / 24 / 25 / 31 / 9 / 13 | within ~20%; the extra is leaving a building (fades + door walk ~1-3 min) and, for 18 → 24, ~3 min of my stray detours; the quote is to the building door, lobby + stairs add ~1-2 | fine |
| A10 | TRAIN card (Mon 06:13) | "29 min, next in 9" → one game minute later "36 min, next in 16" | the 9-min train is uncatchable after an 8-min walk at 06:14 (honest). Walk to the panel 10 min (flat + lobby incl.) vs 8; panel "Train in 3 min"; boarded 06:28 | fine | - |
| A11 | train ride | "about 9 min on board, 1 stop" | my ride helper never matched the HUD; the train went round until 08:46 (harness). The HUD and arrow were right the whole time ("Stay on: Harborside in 8 min", then "Get off at Arts Quarter: you will be re-routed") | harness | - |
| A12 | MapleCab pick-up / ride (4 rides) | 9 / 18 (rain); 9 / 18; 6 / 23; (cancel) | 11.0 / 18; 8 / 18; 6 / 23; arrival "there by" 2-3 min late when the request is made indoors (the card says so) | fine | - |
| A13 | cab fare | $25.75 quoted | $24.25 charged | in your favour | - |
| A14 | bus stop panel (Mon 15:51, Harbor Blvd & Cooper St) | "1 Ring · 1 min" | waited 38 game min (44 real s: the wait runs at .85 because the bus is "≤ 6 min"), no bus; at 19:27 **four 1 Ring buses sat "1-2 min" away, three at the same point (88.1, 299), speed 0, stuck 83-254 s**, ~5 units before the stop (`r14_a1_busjam.png`) | **no-show** | not touched (traffic is the next worker's) |
| A15 | bus at 2x (Wed 14:07, same stop) | "3 min" | bus "here now" at 14:10; boarded | fine | - |
| A16 | pass-out at energy 0 **at home** | - | "A kind cabbie drove you home… Taxi home: $15" while already in the flat | untrue + charged | **fixed** (`sim/needs.js`): at home, no cab, no bill, own line |
| A17 | sleep "until it is time for work" | wake 05:44, 6 h 9 min | 05:44, 369 min, 8 real s | exact | - |
| A18 | sleep "until morning" | 07:00, 9 h 37 min | 07:00, 577 min, 12 real s | exact | - |
| A19 | bed menu on a work night | "Sleep until morning · Wake at 07:00" with a shift at 07:00 | offered without a warning (the "until work" row is right below) | owner decision (small) | - |
| A20 | bills | "Rent & bills tomorrow at 8 AM: $188" | paid Mon 08:00 exactly, $188 | exact | - |
| A21 | shift length | 07:00-13:00 at `SHIFT_SPEED` 2 | 1.7 game min/s; clocked in late 09:17, play ticket at 10:24 (30% of 09:17-13:00, by design), end 13:00; a 6 h shift ≈ 3.5 real min | as round 13 said | - |
| A22 | a job play pauses the shift ("costs no shift time") | - | The Regulars: 24 real s open, clock 11:02 → 11:10 (the walk to the station and the gaps between parts) | ~fine | - |
| A23 | activities' own rates | shower 5 min, eating 15-26, cooking 18 (with the mini-game), haircut 25, laundry wash 30, dryer 40, folding 6 | all exact in game minutes; 1-10 real s each | fine | - |
| A24 | ZipEats | "arrives in 30-45 min · ~07:46" | 07:47 | on time | - |
| A25 | laundromat | wash 30 (09:41 → 10:11), dry 40 (10:15 → 10:55) | exact; phone pinged both | fine | - |
| A26 | **a film** (`sim/shows.js`) | "12:30 · about 100 min" (doors 12:15) | show started 12:40 (the doors phase waits for the house to fill after you enter), **ended 15:17: 157 game min** of film. The show phase advances `prog.minutes` AND the free clock runs under the show's cutscene (67.5 real s × .85 = 57) | **57 min too long** (was 67 at the old clock) | **fixed**: the show's cutscene owns the clock (`clock: true`, as the cab ride does), so a film costs its minutes. Verified by code; my in-game re-run was spoiled by a stray talk sheet (not a player path) |
| A27 | Leave-now during a film | Pip & Milo at 14:45: Leave now 14:00 | arrived mid-film (the player can "Leave early") | fine once A26 is fixed (the film would end ~14:20) | - |
| A28 | a date at a spot ("a walk", 60 min on My Day) | 20:30-21:30 | scene 20:25-20:28 (dialogue pauses the clock) | short; harmless | - |
| A29 | Opportunity with a deadline | "New season, new look · until today 19:30" | took a "Fresh cut" at Otis & Sons' front desk at 09:04; it did **not** complete (only the lookbook emits `hair:cut`); expired 19:30 | broken | **fixed** (`sim/public_places.js`): a front-desk "cut" emits `hair:cut` |
| A30 | needs across the work day | three meals, not exhausted by 21:00 | breakfast missed (empty fridge), lunch 13:04, dinner 19:50; energy 41 at 20:16, 37 at 21:13 ("Fine") | fits | - |
| A31 | needs across the free day | | breakfast (delivery) 08:08, slice 18:18; energy 36 at 20:56 | fits | - |
| A32 | pacing at 1x | | a played day is ~20-25 real min awake + ~10 s of sleep; a shift ~3.5 min | fine | - |
| A33 | **2x** walk | 11 min to the stop | 13 (incl. leaving the cafe) | fine | - |
| A34 | **2x** bus | 41 min (walk 11, next 17, 3 stops, walk 9) | walked 13, bus at 14:10, then my loop did not tap "Get off here" and the bus went on (by design you get off yourself; harness). Skip ride from 8 stops on: 14:32 → 15:09 | partly measured | - |
| A35 | after missing a bus stop | arrow: "Missed it: get off at the next stop"; ride HUD: "stay on, your stop … is 8 stops away" | the two disagreed | **fixed** (`sim/transit.js`): the HUD follows `nav:stop` 'missed' ("You missed your stop: get off at the next one…", button "Get off at next stop") |
| A36 | **4x** walk | 8 min | 13 (5 real s): the street part 9; the flat → lobby → street fades cost 4 game min at 4x (they take fixed real time) | ok; fades scale with speed | - |
| A37 | **4x** shift | | 06:33 → 13:00 in 121 real s (≈3.2 game min/s). My loop re-tapped 4x every time the speed was not 4 and never started a task (0 done, 16 missed): **no verdict** on 4x play | not measured properly | - |
| A38 | dev 8x / 16x | | not run | - | - |
| A39 | intro airport `TUNE.CLOCK .12` | | not run | - | - |
| A40 | `setTimeout` / `setInterval` (95 files) re-searched | | all UI/animation (toasts, banners, scrolls, mini-game result delays, aquarium/natatorium animation, a museum close). `trainride.js:95` skip and `transit.js:156/261` cab/bus skip advance game time by the timetable (round 13) | fine | - |
| A41 | per-frame `G.advance(… dt)` (searched) | | only `shows.js` (A26) | fixed | - |
| A42 | job tasks (`_jobs_work.js`) | `rate = minutes / dur(≤3.4 s)` | exact in game minutes; customers' patience is game minutes, so walking between stations at 4x costs 4x | design | - |
| A43 | classes (`_uni_class.js`) | 50 min | padded to `TUNE.classMin` 50 by `G.advance`; the hold uses `rate .0001` | fine by code; no class played (the Wed class moved) | - |
| A44 | reading / phone games (`data/media.js CLOCK`) | .1 / .2 game min per real s with the world paused | unchanged by `G.CLOCK` | fine | - |
| A45 | ZipEats, Roomy, post, laundry, opportunities, delivery | `G.state.t` | game minutes | fine | - |

### Notes from the days (seen, not changed)
- Sunday: "Leave now" for Pip & Milo was right; I missed it (harness). Nora's text afterwards: "All fine! Mrs. Bell walked them back…".
- Monday: the train ride into a 07:00 shift from 8 minutes' walk away is silly but listed (owner rule); clock-in late at 09:17 ("Clocked in (late)"), the Duchess clock-in beat; "Doors in five… until nine" said at 09:19.
- The Regulars (by hand, see Part B) **★★★, $4.25**. Shift: 27 tasks, 8 missed, $77.75, "Off day 66/100", promotion 41/450.
- The hire toast says "Ask for a day off, or move the other thing", but **no screen could ask** (`G.jobs.requestDayOff` had no caller). **Fixed**: Jobs › My Job › "Next shift off" (tap twice; once a week). Used by touch: "Day off booked. Enjoy it." Next shift moved to Wed.
- Tuesday: "Pick up Pip & Milo" missed (the 157-min film); Wednesday's pickup played (Part B).
- The phone's bottom tip line keeps the last tip across every app for days ("You got the job! Welcome aboard." in MapleCab the next morning; "Ask for your next shift off?…" in ZipEats). Not changed.
- Backpack holds 13: three groceries filled it.
- Rice & Beans cooked with the "Flip it!" pan game (seen in round 12).
- A cab requested from inside a cinema waited 3 game hours "once you are outside" without timing out.
- Milo's "this is milo. i drew you" came again (d28).

## Part B: by hand
- **Play 1, Barista "The Regulars" (Bean & Gone), by touch, Mon d28 11:02**: six customers, each answered by reading the card (strangers name the drink; regulars say "The usual. X" the first time, then only nod, and I answered the nod from what they had said earlier in the play), ~1.5 s per card; then the lever ("let go in the green") by taps timed to the needle. **★★★ "Beautifully done", bonus $4.25** (`r14_b1_play2/3/4`).
- **Play 2, Radio Host "Hit the Post" (Bay Radio Studio B, a J3 room), by touch, d13**: c_d13_radio_hired save, **clock to 20:40 and teleport to the side door (named)**, door by `use()`, Hattie's clock-in beat by taps, routine tasks by round 12's WORK6 helper (one caller and one "pull the next hour" answered by hand). Ticket at 22:03 (30%). First attempt: record by hand, then a **real CDP touch hold**: the hold registered but my release check never fired: "You talk over the first line" ★, $3. **Replayed from the save**: caller "the lighthouse… something that will not frighten the fog" → "Lullaby for a Ferry"; take 1 held 2.65 s, released at fill 54.2% / mark 58.0%; take 2 held 2.43 s, released at 64.0 / 67.8: **★★★ "Beautifully done", $4.50** (`r14_b2_play7`). Found: the result line said "the right record for a long wait **on the taxi rank**" for the lighthouse caller (fixed: "for the caller").
- **Promotion** (Barista): shift 1 (played, late) +41, shift 2 (4x, harness did nothing) +54, then **driver clock to each next workday 06:50, needs topped to 70, teleport to the cafe door (all named)** and "Skip to the end" by touch: +77, +77, … **Promoted on d37**: "Promoted! You are now Barista! $15/h from today · bonus $90", Marlow's text "You've earned it… you get to draw in the foam." (`r14_b3_promoted`). That shift was cut at 10:28 by my A6 regression (fixed).
- **Friend-level talk verbs, by touch** (Pip, Friend 58, at the school, d30): the list adds **Deep talk** ("What's the thing you're proudest of that nobody knows?" → "Did you know the lighthouse has one hundred and twelve steps?"), Ask about their day, Compliment ("You're too kind. Correctly kind, but too kind."), Tell a joke; each goes "later" after use. Found: the lighthouse has **97** steps (Chapter 7's whole point; `sim/lighthouse.js`); two ambient lines said 112 (the clock tower's count): fixed to ninety-seven.
- **Family-arc scene, by touch** (d30, story beat "Pick up Pip & Milo", reached by bus at 2x + skip): Pip, Milo, the pie-stall plan, Otis's lemonade ("Lemonade for everyone. My treat."), Nora at Sycamore Lane, the flyer (`r14_b4_family`: after the scene, Nora and Pip by the school). Seen there: a passer-by says "Nice to see someone smiling on a Monday" on a Wednesday. Seen: Pip opens "You are on time. Noted." at 15:21 for 14:45.
- Found on the way: at the bus stop 430 m from the school the arrow said "**Pick up Pip & Milo: Pip is on the way, wait here**" (round 13 fixed this indoors only). **Fixed** for story beats (`sim/navgoals.js`): in the street, more than 12 units from the place, the place arrow leads. (The friend 'meet' goal was left as is: its street "Go in: X → Kit" arrow is a navcheck row.)
- **Walk date with Felix** (Together), booked by touch (Messages › People › Felix › Invite out › A walk › The River Walk › Tue › 20:30; "Today" was greyed out at 20:16), played by touch on the free day ("lovely").
- **Not run**: the kind let-down of a **second** match (nobody else is dating in any save; it needs a new Porchlight match first); a **friend-arc** scene (`G.rel.debug.available()` empty: no gates open; not forced); Chapter 7 (its window ran out while my harness sat in the cinema).

## Part D: the job-hunt nudge
- `src/story/intro.js` `d2_jules_job` (Nora): "No pressure AT ALL but when you're ready to job hunt: open Jobs on your phone, the whole board's in there and the entry ones hire on the spot. Or the library in the Arts Quarter has free computers upstairs, if you like a big screen and a quiet room."
- To-do `library_job`: "Find a job (the Jobs app, or a library computer)", hint "Phone › Jobs › Board: entry jobs hire on the spot. Or the Public Library, Arts Quarter, upstairs." (Jobs is pre-installed: `apps.js` `pre: 1`.)
- **Played at 1x** on round 12's `j_d1_1630` (day 1 16:51, no clock skip): Nora's text at **19:00 on day 1** (the second day) with the new words; the to-do row and hint in My Day (`r14_d_todo.png`). The 17:30 cooking tip did not show (that save had already cooked: `unless: cooked_meal`); nudges fire one per tick, so 17:30 and 19:00 cannot collide. Chapter 1's window was open until 19:30 but not being played. **Added a guard** (`sim/intro.js nudges()`): a nudge text waits while a Chapter or relationship scene is active (it already waited for open modals, but not for the walking parts of a scene).
- Also re-worded: the "Ride the light rail" to-do's done line said "The loop takes 30 minutes" (it is 80 since round 13): "A train every few minutes, and the loop never gets old."

## Fixed (my files this round)
1. `src/sim/planner.js`: no "Leave now" while a Map trip to that place is running; "Leave now" stops a long fast leisure activity (guarded: `actId`, not sleep/nap/work/auto-work/class/transport); the spot name in the text.
2. `src/sim/needs.js`: a pass-out inside your own home has no cab and no $15.
3. `src/ui/phone_jobs.js`: "Next shift off" (calls the existing `G.jobs.requestDayOff`).
4. `src/sim/shows.js`: the show's cutscene owns the clock (a film costs its minutes).
5. `src/sim/public_places.js`: a front-desk cut emits `hair:cut`.
6. `src/sim/transit.js`: the bus ride HUD agrees with the arrow after a missed stop.
7. `src/sim/navgoals.js`: no "wait here" for a story meeting from far away in the street.
8. `src/story/jobs_new.js`: the radio play's good line fits every caller.
9. `src/story/ambient_lines.js`: the lighthouse has 97 steps.
10. `src/story/intro.js`, `src/sim/intro.js`: Part D wording, the loop line, the nudge guard.

## Patches for files I may not touch
None needed.

## Decisions for the owner
1. **Sleep until morning on a work night** offers 07:00 when the shift starts at 07:00. *Recommendation: grey it out or add "(late for work)" when a shift starts before 07:45.*
2. **A show's doors phase** starts the film ~15 real seconds after you sit, not at the printed time (12:30 film started 12:40 when I came in at 12:22). *Recommendation: start at the printed time when you are seated by then.*
3. **Bus no-show** (A14): for the traffic worker's brief.

## Not run / not verified
The show fix in play (code only); the class at 2x/4x; dev 8x/16x; the intro at the new clock; a properly played 4x shift; the let-down of a second match; a friend-arc scene; Chapter 7; Safari / a real phone / sound; landscape.

## Files changed
`src/sim/planner.js`, `src/sim/needs.js`, `src/ui/phone_jobs.js`, `src/sim/shows.js`, `src/sim/public_places.js`, `src/sim/transit.js`, `src/sim/navgoals.js`, `src/story/jobs_new.js`, `src/story/ambient_lines.js`, `src/story/intro.js`, `src/sim/intro.js`, `docs/reports/qa_round14.md` (`dist/index.html` rebuilt by the checks).
Screenshots cited (looked at): `out/shots/r14_a0_start, r14_a1_route, r14_a1_tr5, r14_a1_cafe1, r14_b1_play1, r14_b1_play2, r14_b1_play3, r14_b1_play4, r14_a1_busjam, r14_a1_needs, r14_a1_cook3, r14_a1_felix4, r14_a1_cafe7, r14_a1_cafe8, r14_a2_hall2, r14_b2_play1, r14_b2_play3, r14_b2_play4, r14_b2_play7, r14_a3_bus_missed, r14_b5_pip1, r14_b5_pip3, r14_b5_pip4, r14_d_todo, r14_x_modal, r14_b3_promoted, r14_b4_family`.
