# Chapters — the main story engine ("The Maple Bay Year") — worker report

> **Part 2 (below, 2026-11-15) supersedes this first part where they differ**: Chapters 6-15 have now been played from their natural unlock by taps, the family moments are built (`G.chapters.moments`), Chapter 3 goes to Maplewood Park, and most of "Known gaps" is closed.

Owner msg 107, BIBLE direction update 21, design + scripts in `docs/story/CHAPTERS.md` and `src/story/chapters.js` (the designer's data: **not changed, no id fixes were needed**).

## What is built
- **The engine** `src/sim/chapters.js` runs the data as written: the 15 Chapters are compiled to flat lists of ops (say / choice / if / go / walk / play / wait / give / flag / rel / stage / page / beat) with a saved program counter, so a Chapter survives save/load and closing the game on any line.
- **A Chapter in the world**: a gold bookmark marker at its `marker` place (animated, drawn after lighting so it glows at night, with a warm light pool; a tap on it always wins over doors, passers-by and speech bubbles), a gold pin on the phone Map, a gold row `Chapter 4 · Theo Draws on a Napkin — whenever you're ready` in the Goals list (id `chapter`, also `G.chapters.row()`, which My Day and the HUD strip already read), **one** gold notice when it opens. Tap the marker: a start card (title, hook, who is there, about how long, Begin / Not now). Outside the `window` the card shows the Chapter's own `closed` line and only "All right". On a work shift it says "You're on the clock just now. It'll keep until after work."
- **Unlocks**: previous Chapter + a breath (the next 06:00, or n of them) + the two light life conditions (`worked:1`, `cooked:1`), which lapse after `orMornings`. While waiting, the gold row shows the `waiting` line.
- **Dialogue** (own UI, `src/ui/chapters_ui.js` + `chapters.css`; `kit.js` / `talk.css` untouched): a bottom sheet with portrait + name, text that types out (tap = finish, tap = next), choices as big buttons under the line they answer, a **Log** of the last 40 lines, a **...** menu with "Let's pick this up later". Narrator lines are italic captions; Mom's lines and the book are in a handwriting face; Dad on the telephone and Nana calling up the attic ladder are marked as voices ("on the phone", "calling up the ladder").
- **Companions** really stand and walk with the player (own `Char`s; the social system's copy of the person is tucked away meanwhile and handed back afterwards). On a bus / train / cab they are waiting at the other end. Existing room figures speak for themselves: Silas Marrow, Hester Quill, Mrs. Pym and the auctioneer are found in their rooms and used as the speaker (portrait from their own sprite); a fallback look exists for each.
- **`go` steps**: the guide arrow (`G.navGoals.set`) leads there, a small gold chip says what the Chapter asks, the player travels any way they like; walking up to the door takes you in (closed hours, tickets and invitations do not stop a Chapter). Inside one building the chip has a **Go** button (lift, stairs, ladder). `went:train|bus|walk|cab` is remembered from the real ride.
- **`play` steps** start the real thing and continue on its result (`src/sim/_chapters_play.js`, table below). Nothing can block: every adapter has a way through.
- **Must-build list**: Dad (Frank) as a cast member added at load (portrait, phone contact with Text / Call, phone-call bubble in Chapter 7, walks with you in Chapter 15); the book (`nells_book`: reader screen, pages found one by one, the family's pages after Chapter 15, your own page 13; a little stool with the book in your home; Map pins with her one-liners); Nana's attic (new room `home:grandma:attic`: trunk, three boxes, dust-sheeted armchair, round window, hatch; ladder on her landing); the Little Kettle stall (event stall prop on Market Street from Chapter 13 done, the bell hangs on it after Chapter 14); the spot by the Second Wind with the brass bell; the two microfilm frames (text + a small picture each); the cab ride that plays a scene (the rank cab is hailed for you, pre-paid; the scene plays while it drives); item rows (`ITEMS_NEW` registered next to `STORY_ITEMS`; keepsakes live in `G.state.chapters.keeps` and in the old `G.story.keepsakes()` list, real items go to the bag / kitchen, `nana_armchair` and `wobbly_shelf` also arrive as furniture deliveries).
- **Nice-to-have done**: "A page from the book" Opportunities for pages 6-10 (one at a time from Chapter 6, never timed: going to the place opens the page and pins it); `sunday_dinner` + `kettle_corner_tea` as weekly family appointments through the old story engine's `recur` list.
- **Re-housing**: nine old beats are off the calendar (`g1 f1 g2 g3 f3 g4 g5 f4 s3`); Kit's five, `f2_school_run`, `s1`, `s2`, `s4` stay as optional moments (k1 after Chapter 2, f2 after Chapter 3, k5 after Chapter 14, s4 after Chapter 15). Finishing a Chapter credits its old beats silently (flags, discounts, recipes, home access). No old beat starts while a Chapter is being played.
- **Old saves**: `g1_breakfast` done -> Chapter 1 done; `f1_welcome_dinner` done -> Chapters 1-3; and a job held -> Chapter 4; and `f3_booth_building` done -> Chapter 5. Never past Act One (the book is new to everyone). Credited Chapters give recipes / contacts / places silently; keepsakes and relationships are untouched; a re-housed beat that was already scheduled is taken off the calendar.
- **Dev**: `G.chapters.debug` = `start(n)`, `skipTo(n, step)`, `finish(n)`, `reset()`, `unlock(n)`, `toWindow(n)`, `toMarker()`, `menu()` (a ready chooser), `dest()`, `ops(n)`, `state()`.

## How the clock and needs behave inside a Chapter
- Dialogue is a modal sheet: **the clock stands still while people talk**, and needs do not move. Between lines (travel, mini-games, activities) the clock runs as always.
- While a Chapter is running no need can fall below **30** (`NEED_FLOOR`), so nobody passes out for listening. Meals in a Chapter really feed (`give meal`: hunger +46).
- Two adapters move the clock on purpose: the lamp (waits for dusk if you climbed early) and the fish auction (waits for half past five).
- The cab scene of Chapter 15 is the one non-modal dialogue: it plays while the cab drives.
- Old beats, shifts and appointments are not cancelled or moved by a Chapter; a Chapter cannot be begun on shift.

## Per-Chapter status
"taps" = started from the marker and played with real touch input at 390x844 (Playwright, `hasTouch`); "debug help" = `G.chapters.debug.unlock(n)` + clock moved into the window + set down at each destination's door, everything else by taps (dialogue, choices, chip buttons, mini-games, shop, Decorate, dig, auction, lamp).

| # | Chapter | Status | The play piece | Notes |
|---|---|---|---|---|
| 1 | Breakfast at Nana's | **played end to end by taps, real flow** (New Game -> Skip intro button -> first night -> notice -> walked to the marker) | wash hands (activity), flip game (5 touches), upstairs, chair | 30 game min |
| 2 | The Long Way Round | **played end to end by taps, real flow** | Map card -> Set waypoint -> ways offered -> Walk; walked across town; lift; telescope | 59 game min; "You WALKED?" line fired |
| 3 | Pip's Fun Survey | **played end to end by taps, real flow** | survey sheet; walked both children to Central Park and home; sketch game (real drags) | 152 game min, two walks of about an hour each (see questions) |
| 4 | Theo Draws on a Napkin | **played end to end by taps, real flow** | the real My Day sheet (walk-through Next / Next / Got it, then Add an idea), Job Board -> Apply (hired), My Day again | walked from Sycamore Lane to the Arts Quarter; a bus-stop window opened by a stray tap on the way was closed |
| 5 | Echo | **played end to end by taps, real flow** | walked to The Gilded Attic with Nora, tapped a piece, Buy ($182 desk: the delivery variant), walked home, Decorate with a real pointer drag, wardrobe + dresser | 30 game min; opened after two mornings (the test player never worked a shift) |
| 6 | Nana's Attic | played with debug help | ladder, three boxes, the book's cover, the chair | 15 game min |
| 7 | Ninety-Seven Steps | played with debug help | the real stair (97 steps by taps), the real lamp game, Dad on the phone | 129 game min (waits for dusk) |
| 8 | The Only Honest Theatre | played with debug help | the real falling-clock auction, two pages, chowder | 23 game min |
| 9 | Pip Investigates | played with debug help | both microfilm frames, archive -> bookshop | 12 game min |
| 10 | Say Hello to Marge | played with debug help | the real dig pit (rubbed by pointer) | 24 game min |
| 11 | The Kettle in the Sky | played with debug help (weather set clear) | the observatory's own tracer: Leo, nine stars, by taps | 2 game min + the talk; the window now uses the observatory's own "clear night" test |
| 12 | One Term Short | played with debug help | **fallback lecture** (sit, listen, one question): the University's open lecture is an evening event | 32 game min |
| 13 | The Copper Teapot | played with debug help | flour errand, flip game for the pie, the order-slip page | 11 game min |
| 14 | The Little Kettle | played with debug help | pour game, the bell choice | 10 game min |
| 15 | The Last Page | played with debug help | hailed cab, scene during the ride, write game, page 13 stored | 98 game min (the ride) |

Minutes are game minutes with instant text (`?chfast`); reading at a normal pace adds real time but no game time. All 15 are wired; none is unwired.

How the real run of Act One was done (honest notes): one continuous save, New Game to the end of Chapter 5, every input a touch tap, pointer drag or the on-screen buttons. The intro was passed with its own "Skip intro" button, not walked. Between Chapters the clock was simply left running (dev fast-forward 16x with needs frozen, both switched off again before each Chapter began); nothing was jumped or unlocked. The test player walked everywhere: its stray taps also opened a bus-stop window, a bench menu (it people-watched for five minutes), a pub door and the clinic door on the way, which is the generous door tap target at work, not the Chapters. Kit's optional evening (k1) was offered after Chapter 2 and sat in My Day beside the gold row, and the first-time window for Opportunities appeared between Chapters and was dismissed.

## Also verified
- Outside-the-window card (22:00 at Nana's): closed line, no Begin. Step out from the "..." menu and pick up from the marker ("Pick it up"): same step. Real page reload + Continue mid-dialogue and with a mini-game open: resumes on the same step (the play step is offered again). Old save (beats g1 + f1 done, k1 done, g2 scheduled, a job held): Chapters 1-4 credited, Chapter 5 open, 4 keepsakes kept, Nana 60, the scheduled g2 gone from the planner.
- Marker by day and at night; gold pin + her page pins on the Map; book reader; the book stool at home opens the reader; Dad's contact card (Text / Call work); bundled `dist` build runs a Chapter; `node src/data/validate.mjs` passes; 59-60 fps throughout; **zero page errors from Chapter code** (one exception seen in `ui/phone.js`, see hooks).

- Final regression on the finished code: all 15 Chapters run from marker to end card with debug help, 0 page errors, 59-60 fps (scratchpad `regress.txt`).
- Screenshots looked at (out/shots): `ch_marker_t10`, `ch_marker_t22` (marker day / night), `r1_card`, `t_closed_card`, `t_resume_card`, `r1_choice`, `c14_choice`, `c15_choice3` (choices, also during the cab ride), `t_log`, `t_menu`, `t_phonecall`, `r1_endcard`, `c8_endcard`, `t_book_light`, `c9_film`, `c3_survey`, `attic1`, `css_dbg` (the ladder), `stall1`, `t_map_pins_zoom`, `t_map_marker`, `r2_route`, `c4_myday3`, `r5_decorate2`, `c15_ride`, `t_walk_night` (companions), `dad_contact`.
- In the Decorate screenshot of the real run the Undo button is still greyed after the test drag, so the piece may not have moved; the Chapter continues on Done either way.

## Files
New: `src/sim/chapters.js`, `_chapters_places.js`, `_chapters_cast.js`, `_chapters_play.js`, `_chapters_world.js`; `src/ui/chapters_ui.js`, `src/ui/chapters.css`; `src/scenes/rooms/chapter_attic.js`; `src/art/story/chapter_art.js`.
Edited (mine to edit): `src/sim/story.js` (re-housing: `REHOUSED`, `ALSO_AFTER`, `beatOk`, `offer` refuses re-housed beats, `tick` waits while a Chapter runs, `unschedule()` on load, `G.story.credit(id)`, `G.story.rehoused(id)`, `skipTo` forces). `src/story/story.js` not touched.
Shared edit (one add-only line): `src/ui/phone_map.js`, end of `draw()` before the selected-place box: `for (const f of G.mapPins || []) { try { f(g, X, Y, z, label, W, H); } catch (e) { } }`.
Data fixes in `src/story/chapters.js`: none.

## Hooks for the lead
1. Dev menu (`src/ui/devmode.js`), next to "Hire me as… / Teleport…": `if (G.chapters) row(act('Chapters…', () => G.chapters.debug.menu()));` (the chooser lists the 15 with their state, then: jump to its marker / start it here / mark it done / reset the story).
2. `src/ui/phone.js` `pump()`: after the two expiry `while` loops add `if (!queue.length) return;` (a clock jump empties the queue and `queue.shift()` then throws `Cannot read properties of undefined (reading 'pri')`).
3. `src/ui/style.css`: speech bubbles take taps (`#ui>*{pointer-events:auto}` beats `.bubble{pointer-events:none}`): add `#ui>.bubble{pointer-events:none}`. The marker already works through them.
4. `src/story/intro.js` goal `nana_breakfast` hint says "Check your Calendar for the address": suggest "Follow the gold marker to the blue door on Thimble Street." (the goal still completes: `beat_done:g1_breakfast` is true once Chapter 1 is done).
5. Optional: a phone app for the book (`G.chapters.book.open()`), and a row for the 1985 photograph as wall art.

## API, events, state
- `G.chapters`: `list()`, `row()`, `current()`, `active()`, `done(id)`, `open(id?)`, `begin(id)`, `stepOut()`, `resume()`, `pick(choiceId)`, `flag(id)`, `test(cond)`, `fill(text)`, `book { has(), open(pageId?), pages(), pins() }`, `keepsakes()`, `marker()`, `windowOpen(n)`, `debug {...}`.
- Events: `chapter:open`, `chapter:start`, `chapter:step`, `chapter:choice`, `chapter:out`, `chapter:done` (also emits `story:beat` with the Chapter id so goal lists re-check), `chapter:page`, `chapter:box`, `chapter:microfilm`, `chapter:meal`, `chapters:change`.
- State `G.state.chapters = { v, done: { id: { t, day, credit? } }, cur: { id, pc, paused, t0, went, scene, back }, picks, flags, pages: { pageId: day }, keeps, note, introT, worked, page13, pageDay, credited }`. All 68 choices are stored in `picks` for later writers.
- `G.mapPins` (array of `fn(g, X, Y, z, label, W, H)`): a general hook for extra Map layers.

## Play adapters (`src/sim/_chapters_play.js`)
`wash_hands`, `use_toilet`, `nap` (activities at Nana's), `flip` / `hoops` / `chess` / `sketch` / `pour` / `write` (`G.skillplay.demo`), `map_pick:<place>` (opens the Map on the place card), `skydeck_scope` (`G.showpieces.skydeck.scope`), `interests_pick` (own survey sheet -> `G.skills.setInterests`), `myday_open` / `myday_add` (**`MYDAY.open` / `MYDAY.add`: they call `G.myDay.open()` / `G.myDay.addIdea()` when present, which they now are; the Planner fallback is still there**), `jobs_apply` (`G.jobs.openBoard`, loops until hired), `goods:any` (waits for `goods:buy`; a delivery sets `ch05_delivery`), `decorate_place` (`G.furnish.open`), `wardrobe_change`, `unpack_box:*` (attic), `lighthouse_stairs` (the real stair rooms), `lh_light_lamp` (`G.lighthouse.light`), `fm_auction` (`G.fishmarket.bid`), `ch_microfilm:1988|1985`, `mus_dig` (`G.museum.dig`), `obs_trace` (`G.observatory.trace`), `uni_open_lecture` (`G.university.sitIn` if it ever exists, else the fallback), `cook:<recipe>` (flip game at Nana's stove).

## Known gaps
- Chapter 12: no daytime open lecture exists; the fallback is a seat, half an hour of listening with Kit's lines as captions, and one question.
- `FAMILY_MOMENTS` (six festival moments, three standing ones) are not built. The festival variants inside Chapters use `festival:<id>` and were not seen on a festival day.
- `stage` steps are implemented but the data has none; `walk` steps walk the player to the named thing only where an interactable with a matching label exists (panorama glass, dig pit, tram case), otherwise the talk simply plays.
- The Little Kettle does not lean (the event stall prop cannot); the bell on Roz's door hook afterwards is not placed; `nell_credit` (a free course) is only a flag; the 1985 photograph and the year photograph are keepsakes, not wall art; no arrivals rail inside the terminal (the kerb at the taxi rank is used).
- The handwriting face is the device's `cursive` font (italic serif where there is none); no font file was added.
- Dad can be "invited out" from his contact card like anyone; he is in Pinehollow and will not come.
- A trait prompt for old saves, shop windows or phone banners can still open over a Chapter between lines; they close normally.
- Not tested: landscape / desktop layout of the sheet, sound, Chapters 6-15 from their natural unlock (only with the debug unlock), rain / winter / evening variants, a Chapter begun with a need at zero.

## Questions for the owner
1. Chapter 3 walks Pip and Milo from Sycamore Lane to Central Park and back: about an hour of game time each way on foot (bus or cab also work, the children are then waiting at the park). The script speaks as if the park is round the corner. Keep Central Park, or use Maplewood Park next to the house?
2. Chapter 12 needs a daytime open lecture to be the real thing. Should the University run one on weekday mornings, or is the short fallback enough?
3. Old saves are credited up to Chapter 5 at most. Is that the right line?

---

# Part 2 — Chapters 6-15 from their natural unlock, the family moments, the gaps (2026-11-15)

Worker: Chapters Part 2. Scripts: scratchpad `ch2/` (`play.mjs` = the natural-play driver, `chain.sh`, `sum.mjs`, `t_mom.mjs`, `t_var.mjs`, `t_land.mjs`, `t_lect.mjs`, `t_furn.mjs`). Screenshots: `out/shots/ch2_*.png` (sheets: `ch2_sheet_7/9/10/11/lect.png`, `ch2_land_sheet.png`).

## How Chapters 6-15 were played
One continuing save (the previous worker's `b5`: Act One finished by taps), Chapter after Chapter, each run saved and the next started from it (`c6` ... `c15`). No `debug.unlock`, no setting down at doors. Per Chapter the driver: lets the clock run (dev 16x, needs frozen) until the gold row appears; then **walks to the marker by taps even while its hours are shut and reads the kind closed card** (from Chapter 11 on); waits for the window; switches speed and frozen needs off; opens **My Day with the HUD button and taps the gold row** (sets the arrow: "Follow the gold marker. No rush."); taps the marker; Begin; then every line, choice, chip button, mini-game and trip by touch. All travel was **on foot** (taps along the streets), which is the slowest way a player could do it; no bus, train or cab except the Chapter 15 cab.
Honest limits: the driver finds its way with the game's pathfinder, not by reading the arrow (the arrow and its label were present every time and are in the screenshots, but nobody "followed" it by eye). Its stray taps opened bus-stop windows, a cab menu, the plaza fountain, pubs and an ice-cream stand on the way; those were closed and walked on from. Text was instant (`?chfast`), so "real seconds" is the test's time; "lines" x about 4 s is a fair reading time. The test player never worked, cooked or slept (needs frozen while waiting), so it was $90 to $290 overdrawn from Chapter 9 on: that showed the auction needed a fix (below).

| # | Chapter | Opened (rule -> what happened) | Notice / My Day row / marker | Guidance to the spot | Play pieces, all played by taps | Lines / choices | Real s | Game min | Notes |
|---|---|---|---|---|---|---|---|---|---|
| 6 | Nana's Attic | next morning -> day 8 06:00, 18 h after Ch 5; begun 09:45 | gold notice yes, gold row yes, marker at the blue door | walked from Juniper Court (14 min); indoors the chip's Go button (ladder up, ladder down) | three boxes (walk to each, 4 min each), the book's cover, the chair | 38 / 3 | 21 | 15 | clean |
| 7 | Ninety-Seven Steps | next morning -> day 9 06:00; window from 16:09 (dusk - 2:30); begun 16:50 | yes / yes / marker at the foot of the Light | walked from Thimble Street (40 min); cottage door, then the real stair rooms, Go for the lantern | page 1; the stair (two real stair rooms, tapped); the lighthouse's own lamp game (14 pumps); Dad on the phone | 51-77 / 5 | 45-50 | 75 | played twice (two option sets). The clock waits for dusk on purpose. Fixed: a stair caption stayed on top of the choice buttons |
| 8 | The Only Honest Theatre | after one home-cooked meal, or three mornings -> "waiting" row from day 10 06:00, opened day 13 06:00 (never cooked); begun 06:45, half an hour before the window shut | yes / the waiting line, then the gold row / marker at the fish hall | walked from Gull Point; chip Go to the rostrum (a 7 s walk across the hall) | page 2; the real falling-clock auction (hand up); pontoon walk; page 3 | 50 / 3 | 25 | 12 | The script says "lot nine" and "Sold!" whatever happens; the adapter took the first lot and could lose it. Fixed (below) |
| 9 | Pip Investigates | next morning -> day 14 06:00, but day 14 is Founders' Day and City Hall is shut: played on day 15, begun 12:17 | yes / yes / marker on the City Hall steps | walked from the harbour (1 h 45); archive entered at the door; then 53 min on foot to the bookshop | both microfilm reels (4 min each) and frames; Ambrose at the bookshop | 62 / 4 | 85 | 69 | **Found and fixed: on the holiday the Chapter could be begun and Officer Ray walked you out, so the whole archive scene played in the street.** Also moved the marker clear of the plaza fountain |
| 10 | Say Hello to Marge | next morning -> day 16 06:00; begun 12:43 | yes / yes / marker at the museum steps | walked from the bookshop (2 h 18 with detours); ticket paid for you; chip Go to the dig pit | page 4; the real dig pit (rubbed with the finger, 2 passes); the tram case | 51 / 7 | 27 | 24 | clean |
| 11 | The Kettle in the Sky | next morning -> day 17 06:00; day 17 night was cloud; first clear dark hour day 18 20:43 | yes / yes / marker at the observatory | walked 94 min in the morning, read the closed card ("Clear nights only"), waited; Go to the roof | page 5; the observatory's own tracer (Cygnus, 7 stars, by taps) | 53 / 4 | 19 | 2 | Added: the cloud breaks for you after two cloudy days (see pacing) |
| 12 | One Term Short | next morning -> day 19 (a Saturday) 06:00; window Monday day 21 09:30; begun 09:42 | yes / yes / marker on the campus green | walked 80 min on Saturday, read the closed card; University Hall at the door; Go to the theatre; then 57 min on foot to the school | page 11; the morning open lecture (36 game min, three boards, the lens question); the school gate | 64 / 5 | 106 | 106 | The lecture is now a real talk (below). "The end of school" is reached at about 11:30, which nobody will mind |
| 13 | The Copper Teapot | next morning -> day 22 06:00; begun 09:04 | yes / yes / marker at the blue door | walked from the school (100 min), read the closed card; flour run to the bakery and back (22 min each way) | the pie (flip game at Nana's range); the order slip page | 64 / 5 | 91 | 70 | clean |
| 14 | The Little Kettle | two mornings -> day 24 06:00; next market day Saturday day 26; begun 10:08 | yes / yes / marker at the stall on Market Street | 16 min walk, closed card ("a weekend thing") | pour game; who rings the bell | 77 / 3 | 20 | 9 | Day 26 is the River Walk Summer Fair: **the fair variant line played by itself, on the real calendar** |
| 15 | The Last Page | three mornings -> day 29 06:00 (Autumn 2); begun 10:35 | yes / yes / marker on the Arrivals kerb | walked 2 h 05 from Market Street, read the closed card; **the cab** (hailed for you, pre-paid, the scene and its three choices play during the 30 min ride; Skip ride tapped near the end); then 2 h 30 on foot up to the Lookout with detours | the three things you narrate; the write game (10 touches); the last page (your pick is stored as page 13) | 105 / 7 | 306 | 243 | The autumn line played by itself ("the maples ... the colour of the jam"). First run failed: the marker stood on the taxi stand (fixed). The Lookout is a long way on foot from Thimble Street; the train to Hillcrest is right there |

Chapter 3 was replayed by taps from the previous worker's `b2` save with the new park (twice): the walk is now 10 to 11 game minutes each way; the Chapter took 37 and 52 game minutes instead of 152.

## What changed (all in the Chapter files)
**Bugs found by natural play**
1. **Holiday at City Hall (Chapter 9).** On Founders' Day (and the two other all-day holidays) City Hall is shut; the engine went in anyway, the building's closing sweep walked the player out one minute later, and both microfilm reels and the whole archive scene then played on the plaza. Now: the Chapter is not startable that day and its card says why ("City Hall is shut for the holiday, archive and all. Pip has moved the investigation to tomorrow. In pen."); while any Chapter runs, the two closing sweeps that have a switch (City Hall, Post Office: `debug.stay`) are held; and if the player leaves the scene's place while a Chapter waits for them at a thing, the chip leads them back ("Back to ...") instead of running the step where they stand (twice; the third time it is done from wherever they are, so nothing can loop).
2. **One tap too many walked you out of the room.** Tapping through lines at the bottom of the screen, the tap after the last line landed on the world, where a room's exit is. Now the world ignores taps for 0.4 s after the sheet closes (buttons, the chip and the HUD stay live).
3. **Festival lines always played.** `festival:<id>` was true whenever that festival was anywhere in the next 56 days, so Chapter 14 always said both the Harvest and the Summer Fair line. Now only on the festival's own day.
4. **The armchair and the shelf never arrived.** The furniture ids were not real items, so Nana's armchair and Theo's shelf were keepsakes only. They are now real home pieces (`ch_nana_armchair`, green velvet, with tomorrow's deliveries; `ch_wobbly_shelf`, straight into storage). Saves that already own the keepsakes get them once on load.
5. **The auction (Chapter 8)** now bids on lot nine when it is still on the ice (as the script says), Theo stands the price if your purse is short of the opening bid (your balance ends as it began), and a lot that gets away is followed by one you do get, so "Sold! To the new face" is always true.
6. A caption from the stair / a walk / a mini-game could sit on top of the dialogue sheet's choices: cleared when the sheet speaks.
7. The Log was empty when a choice was the first thing on screen after a reload: the line it answers is logged.
8. The City Hall marker stood 2.5 units from the plaza fountain, whose tap target is very wide; it is 6 units along the steps now. The Arrivals marker stood on the taxi stand's "Take taxi" spot (a tap just off the marker opened the cab chooser, and the test player rode to Campus Green for $24); it is 4 units along the kerb now.
9. Pressing a chip's Go button again while already walking there no longer starts the walk over.

10. The kit mini-games named themselves after the skill ("Mix: Blue Heron" for pouring tea, "Writing: haiku" for the last page, "Flip it!" for the pie): in a Chapter the sheet now says what you are doing ("Pour the tea", "The last page", "The apple-maple pie", "Bea's Maple Oat Pancakes").

**Lead decision, Chapter 3.** The walk goes to **Maplewood Park, round the corner from the yellow house on Sycamore Lane** (48 units; Central Park was 212). Note: the brief said "nearest Nana's house"; the walk starts and ends at Nora's, so I used the park nearest Nora's, which is what "round the corner" needs. Lines changed: the two labels, the scene title, the ducks became squirrels (there is no pond), and Milo now points "west, over the rooftops" at the glass house "in the big park". Maplewood Park had no hoop, so one stands by the cherry tree now (a story prop placed by `_chapters_world.js`, not solid, never removed). The meeting spot is the open lawn in front of it.

**Chapter 12.** The University's open lecture is Wednesday 19:30; the Chapter is a weekday morning and ends at the school gate at home time, so the real event cannot be reached. The fallback is now deliberate: the morning public lecture of the same series, staged with the theatre's own pieces. The University's own talk "How a lighthouse throws a candle twenty miles" (it sends you up the Light, page one of the book), Mr. Kowal at the lectern, an audience, the three boards on the wall screen, the class camera, Kit whispering, then the talk's own question (right answer = the "good" lines) and his answer. +12 Inspiration and the talk counts on your list, as on a Wednesday. If `G.university.sitIn({ chapter, talk })` ever exists it is used instead.

**Family moments (`FAMILY_MOMENTS`, new file `src/sim/_chapters_moments.js`).** All nine are built. On a festival day, on Sunday 17:30-20:30 at Nora's, Saturday 15:00-17:00 at the bakery, and for the first week of each season after Chapter 15 (Dad), the people are standing in the real place with a soft gold ring on the ground. Within a few steps a small gold strip offers "Join them" / "Not today" (a tap on them works too); a few lines play in the Chapter sheet; keepsakes and the roast recipe are given once. Rules: only between Chapters, at most one a day, each needs its Chapter; festival moments play once ever; the standing ones come round again (Sunday dinner really feeds you; the Kettle Corner is tea and company). On a festival day and while Dad is in town one quiet Opportunity row says who is where; it goes away unremarked. Nothing has a timer or a penalty. `G.chapters.moments = { list(), playing(), debug: { due(), stage(id), play(id), reset(), where(id) } }`, event `chapter:moment`, state `G.state.chapters.moments`.

**The other gaps**
- **Variants**: all eleven forced and seen (weather system set to rain; the festival staged with `G.cityEvents.debug.start`; the clock moved into autumn and winter; the hour moved to evening): Chapter 1 rain and evening, 7 winter, 8 rain, 11 winter, 14 Harvest / Summer Fair / winter / none, 15 autumn / winter / evening. These used `debug.skipTo` and a set-down at the door (API, not natural play). The Summer Fair line also played naturally (Chapter 14 fell on the fair).
- **Dad asked out**: he answers in his own words and does not come ("Too far for these knees today. Go, and ring me from there. Tell me what I am looking at."; a different line while he is in town). Nobody is left waiting at a cafe. The "Invite out" button is still on his card (not my file; line below).
- **Photographs**: the 1985 Courier print and the Lookout photograph arrive framed with the next day's deliveries and hang from Decorate (`ch_kettle_photo`, `ch_year_photo`; two small wall pieces drawn in `chapter_art.js`).
- **The bell**: after Chapter 14 it stands by the door in Rise & Shine (a bracket post, "The Copper Kettle's bell", it rings and Roz looks up); it hangs on the stall only from the moment it is rung until the Chapter ends.
- **Handwriting**: the headless Chromium (and any device without a script face) rendered `cursive` as a plain italic serif. The UI now tests for a real script face; without one `<html>` gets `.ch-nohand` and her pages use a chosen italic book hand (Georgia and friends) in the same blue ink on the ruled page. Comic Sans is out of the list. iOS has Bradley Hand / Snell Roundhand and Android maps `cursive` to Dancing Script, so phones get a real hand.
- **Landscape (844 x 390)**: the start card's buttons were cut off, the book's page buttons and the microfilm button were off screen. One media query (`max-height: 480px`) fixes them (wider cards, sticky buttons, two-column microfilm, the book fills the height, shorter choices). Portrait is untouched (re-measured).

## Pacing (for the lead)
Natural gaps as they are now, if every Chapter is played the first moment it can be:

| Chapter | opens | earliest day (day 0 = Spring 1) | what can make it later |
|---|---|---|---|
| 1 | morning after the first night | 1 | |
| 2, 3, 4 | next morning each | 2, 3, 4 | 3 needs after school (15:30) or a weekend |
| 5 | next morning + one shift worked, else 2 more mornings | 5 (7) | |
| 6, 7 | next morning each | 6, 7 | 7 starts in the last 2.5 h before dusk |
| 8 | next morning + one meal cooked, else 3 more mornings | 8 (11) | dawn only (from 06:00 on the first morning it is open, 05:15-07:15 after); sleeping through it costs a day |
| 9 | next morning | 9 | not Sundays, not the three holidays |
| 10 | next morning | 10 | |
| 11 | next morning | 10 (same evening if 10 was done by day) or 11 | a clear night, else the cloud breaks on the third evening |
| 12 | next morning | 12 | weekdays only: a Friday-night Chapter 11 waits until Monday |
| 13 | next morning | 13 | |
| 14 | two mornings | 15 | Saturday or Sunday: up to 5 more days |
| 15 | three mornings | 18 to 23 | |

- **Too fast?** No. The fastest possible run is about 18 game days and realistically three to four weeks (the natural run here reached Chapter 14 on day 26 and Chapter 15 on day 29), all inside spring and summer. That is the bible's "about three weeks". In real time it is 15 Chapters of 6 to 12 minutes plus the days between, which a player fills or sleeps through.
- **Stuck waiting?** Three places, none of them a dead end: Chapter 8 (three mornings if you never cook; the row says exactly what to do), Chapter 14 (up to five days for a weekend, after two mornings) and Chapter 15 (three mornings). The one real trap was **Chapter 11 in a cloudy spell**: this save's winter has eleven nights in a row without a clear evening. Adjusted: once the Chapter has been open two whole days, the evening will do, and on Begin the cloud breaks (a narrator line first: "All day the cloud has sat on Hillcrest like a lid. Now, as if somebody had asked it nicely, it is tearing open."), so the script and the tracer stay true. An early clear evening that is not dark yet now waits for the stars the way the Light waits for dusk.
- **Walks inside Chapters** (on foot, the slowest way): Chapter 9 City Hall to the bookshop about 50 game minutes; Chapter 12 the University to the school about 55; Chapter 13 Nana's to the bakery and back 22 each way; Chapter 15 Thimble Street up to the Lookout about two hours ("all together", with Nana, 78). A bus or cab is offered by the arrow as always and the company is waiting at the other end. Listed as a question, not changed.
- A year is 56 days (14-day seasons): a player who drifts reaches the Lookout in autumn or winter, and Dad's "first week of the season" is half a season.

## Questions for the owner (Part 2), with my recommendation
1. **Chapter 3 now goes to Maplewood Park** (round the corner; a hoop was added there, the ducks became squirrels). *Recommendation: keep.*
2. **Long trips inside Chapters 9, 12 and 15** (50 minutes to two hours on foot; a bus, the train or a cab is always offered). I added one line each, said after a minute on the road, that names the quicker way (Pip has exact change for the bus; Kit texts about a cab; Nana's knees vote for the train). Should the far end move closer instead (for example the family simply meets you at the Lookout)? *Recommendation: keep the trips; they are the game's travel doing its job, and the line now points at it.*
3. **Festival family moments play once ever**, the standing ones every week / season. *Recommendation: keep; a second year can get new lines later.*
4. **Chapter 11 in a cloudy week**: the cloud now breaks on the third evening. *Recommendation: keep; ten cloudy nights in a row do happen in winter.*
5. **Dad on the contact card**: he declines by text in his own voice. Hide the "Invite out" button as well? *Recommendation: yes (one line, below).*
6. Still open from Part 1: Chapter 8 can only be begun at dawn; old saves are credited to Chapter 5 at most.

## Lines for the lead (other files)
1. `src/ui/phone_messages.js`, contact card buttons: hide "Invite out" for Dad, e.g. `id === 'dad' ? null : btn('Invite out', ...)` (optional: he now declines kindly by text).
2. `docs/story/CHAPTERS.md` table row 3 and the Chapter 3 paragraph: "Central Park" -> "Maplewood Park"; "sketching the pond" -> "the squirrels".
3. **My Day banners during a Chapter**: "My Day · Starting now: Meet Kit at the Blue Heron" and "My Day · In 24 min: Pick up Pip & Milo" slid in over Chapters 7 and 12 (screenshots `ch2_sheet_7.png`, `ch2_sheet_lect.png`). Suggest the same guard the morning line has: skip (or hold) those two notices while `G.chapters.active()`.
4. First-time windows: none opened during a Chapter in any run (the guard in `sim/firsttime.js` works). They do open between Chapters, also on top of a bus-stop window opened a second earlier ("First time · Buses & trains" over the stop's own window).
5. Optional dev menu row next to "Chapters…": `row(act('Family moments…', async () => { const v = await choose('Family moments', G.chapters.moments.list().map(m => ({ label: m.title, sub: m.when, value: m.id }))); if (v) G.chapters.moments.debug.stage(v); }))`.
6. Optional, `src/sim/university.js`: a public `sitIn({ chapter, talk })` that runs `CL.openLecture` for a given talk; the Chapter would use it at once.
7. Optional, `src/data/goods.js`: nothing needed; the four story pieces register themselves.

## Still not verified
- Chapters 6-15 with a player who works, cooks, sleeps and uses transit (the natural run walked everywhere with frozen needs between Chapters); a Chapter begun with a need near zero.
- After the natural run (day 29, all 15 done): the save has the armchair and the 1985 print in delivery boxes, the Lookout photograph due next morning, the shelf in storage, page 13 stored. Final regression on the finished code: all 15 Chapters marker to end card with debug help, 0 page errors (`ch2/g1..g15.txt`).
- The family moments on their real calendar days (they were staged with `G.cityEvents.debug.start` and by moving the clock; the weekly windows and Dad's week were reached by `G.advance`). The festival crowd can stand in front of the family; the ring and the strip are how you find them.
- The auction's second lot after a lost one: code only (the loan was run: purse -$50 before and after, the fish bought; lot nine was never on the ice in the three runs, so the 'first lot up' branch is the one seen). The 0.4 s tap guard is in every run since it was added, not measured on a real phone.
- Run on purpose with the API helping (`debug.skipTo` or the clock moved, then taps): the cloud breaking on the third cloudy evening of Chapter 11 (rain forced for three nights: shut, shut, open; Begin clears the sky, a narrator line says so, the real tracer ran); the lead-back (left the attic by its ladder while the box waited: chip "Back to Nana Bea's attic" + Go, then the box again); the morning lecture (`ch2_sheet_lect.png`); the holiday card.
- The framed photographs were placed with the housing API and looked at in the art gallery sheet (`out/gallery/ch2_story.png`), not hung by hand in Decorate.
- Sound; a real device; the handwriting on a real iPhone / Android.
