# Chapters — the main story engine ("The Maple Bay Year") — worker report

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
| 4 | Theo Draws on a Napkin | SEE "REAL CHAIN" BELOW | real My Day sheet (walk-through, Add an idea), job board Apply, My Day again | |
| 5 | Echo | SEE "REAL CHAIN" BELOW | bought a piece at The Gilded Attic (delivery variant), Decorate with a real drag, wardrobe | |
| 6 | Nana's Attic | played with debug help | ladder, three boxes, the book's cover, the chair | 15 game min |
| 7 | Ninety-Seven Steps | played with debug help | the real stair (97 steps by taps), the real lamp game, Dad on the phone | 129 game min (waits for dusk) |
| 8 | The Only Honest Theatre | played with debug help | the real falling-clock auction, two pages, chowder | 23 game min |
| 9 | Pip Investigates | played with debug help | both microfilm frames, archive -> bookshop | 12 game min |
| 10 | Say Hello to Marge | played with debug help | the real dig pit (rubbed by pointer) | 24 game min |
| 11 | The Kettle in the Sky | played with debug help | **the kit's plain trace game ran, not the observatory's own tracer** (see gaps) | 33 game min |
| 12 | One Term Short | played with debug help | **fallback lecture** (sit, listen, one question): the University's open lecture is an evening event | 32 game min |
| 13 | The Copper Teapot | played with debug help | flour errand, flip game for the pie, the order-slip page | 11 game min |
| 14 | The Little Kettle | played with debug help | pour game, the bell choice | 10 game min |
| 15 | The Last Page | played with debug help | hailed cab, scene during the ride, write game, page 13 stored | 98 game min (the ride) |

Minutes are game minutes with instant text (`?chfast`); reading at a normal pace adds real time but no game time. All 15 are wired; none is unwired.

## Also verified
- Outside-the-window card (22:00 at Nana's): closed line, no Begin. Step out from the "..." menu and pick up from the marker ("Pick it up"): same step. Real page reload + Continue mid-dialogue and with a mini-game open: resumes on the same step (the play step is offered again). Old save (beats g1 + f1 done, k1 done, g2 scheduled, a job held): Chapters 1-4 credited, Chapter 5 open, 4 keepsakes kept, Nana 60, the scheduled g2 gone from the planner.
- Marker by day and at night; gold pin + her page pins on the Map; book reader; the book stool at home opens the reader; Dad's contact card (Text / Call work); bundled `dist` build runs a Chapter; `node src/data/validate.mjs` passes; 59-60 fps throughout; **zero page errors from Chapter code** (one exception seen in `ui/phone.js`, see hooks).

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
- Chapter 11: the observatory's own constellation tracer did not start in the test (the kit's trace game ran instead); the cause was not found.
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
