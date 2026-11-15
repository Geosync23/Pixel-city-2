# QA round 9 (Opus QA lane, 2026-11-15): round 8's leftovers, days 3-5 by touch, one lecture

**Setup.** The round-8 persistent driver, copied to `/tmp/claude-0/-home-user-Pixel-city-2/ab4bf52b-889a-5288-a866-29c2e55d0472/scratchpad/r9/` (`srv.mjs` on port 7821, `t`, `boot2.sh`, `help.js` / `rec.js` / `mon.js` / `tapit.js`, new: `probe.js` (tap probes), `ov.js` / `ov2.js` + `sweep.sh` (tap-target sweep of home rooms), `lec.js`). Headless Chromium 390x844, `hasTouch`, deviceScaleFactor 1, source build. Diary: `.../r9/diary.txt`. Saves: `d3_0819`, `d3_1052`, `d3_1621`, `d4_0745`, `d4_1600`, `d5_0700`, `d5_0734`, `d5_1037`, `d5_1610` (.json).
**What "played" means (same as round 8).** "Touch" = `touchscreen.tap` at a screen point I chose from what was on screen. "Walked" = a long street walk done by the pathfinder to the arrow's point (said where). "API" = a direct call, named. No dev mode, no Chapter 2 or later.
**Checks.** `node src/data/validate.mjs` passes; `node tools/build.mjs` passes; `node tools/navcheck.mjs --rooms all` (run after my navgoals/navigator changes): all 44 audit rows PASS; the only failure is still the Chapter attic (`home:grandma -> home:grandma:attic`); 0 page errors. Zero page errors in every play session.
**Not from a tapped New Game.** Part B continued from round 8's `d3_wake.json` (it loaded cleanly), so the real intro was not replayed this round.

---

## Part A: round 8's leftovers

| # | item | reproduced? | fix | re-tested |
|---|---|---|---|---|
| 1 | Fridge line "Empty. One lonely ketchup packet" with 17 items inside | by reading: every new game stocks `STARTER_PANTRY` (housing.js) | `ui/goals.js` `liveDone()`: the first-evening fridge line now reads the real fridge ("A starter cupboard: eggs, bread, butter and more. Enough to cook tonight."; the ketchup line only when truly empty). Data line changed too; stamp "The Ketchup Packet" -> "What's in the Fridge" / "Open your fridge for the first time"; the groceries goal's "The ketchup packet has company now" -> "The fridge is properly stocked now." | API: not shown in play (intro not replayed) |
| 1 | Sleep toasts on waking ("The game saves when you sleep. Sweet dreams." / "Good night, Maple Bay.") | yes (they fire on `activity:done` = waking) | texts made true for waking: "Game saved. It saves every time you sleep." and "Good morning, Maple Bay. First night done." (the save really happens on waking, hud.js) | woke twice by touch: no going-to-bed toasts (those tips were already used in this save) |
| 1 | Nora's reply "Made it! Got my keys." before the keys | by reading (the replies are fixed when sent, at the kerb) | replies that are true whenever you answer: "Made it! Landed safe." / "Here! Say hi to everyone." (`sim/intro.js`) | not replayed |
| 1 | Unpack toasts | the per-box toast (housing.js) lists the real contents; the untrue one was the goal line "Unpacked! A lamp, a mug, a blanket" | -> "All unpacked. It is starting to look like yours." | not replayed |
| 2 | Bladder / Hunger lists skip the University Commons | yes (the Great Hall has no restroom/menu; they are in `university:commons`) | `navgoals.js subRooms()`; `navigator.js` counts the other rooms of a building (restroom, menu, cafe for Coffee) and notes where: "Maple Bay University (restrooms in The Commons)", "· The Quill & Kettle, in The Commons"; `navgoals.js needRoom()` sends the arrow to that room ("The Commons → the restroom"); the need regex also takes "Order at ..." | touch + walked: bladder list at the University -> "Go in → the restroom" -> "The Commons → the restroom" -> restroom used; Map > Food from the hall -> "The Commons → eat here: order" -> Juno -> Thesis Soup |
| 2 | WALK / BUS on the Map route card must close the phone | lead decision | `phone_map.js`: after WALK/BUS/TRAIN the phone closes, toast "Follow the arrow." / "Trip started: walk to X first. Follow the arrow." | touch: WALK (home) and BUS (FreshWay): phone closed, arrow on screen at once (`r9_a2_g`, `r9_b3_bus1`) |
| 2 | Restroom chooser's route card gone after the Map window's "Got it" | NOT reproduced on current code (window arrived 6 s later over the card; after Got it the card stayed: `r9_a2_d`, `r9_a2_f`) | none; plus: choosing the building you are already in no longer opens the Map at all ("It is right here: follow the arrow.", `hud.js` and `phone_map.js`) | touch: FreshWay bladder + hunger from inside |
| 2 | Arrow gone on entering a cafe from the Hunger list | yes, Sunnyside Cafe: the street door's label "Sunnyside Cafe · ..." matched the counter regex `.*Cafe.*`, so the goal counted as "used" at the door and was cleared silently | `navgoals.js`: a use only counts inside (`lastUse.scene !== 'city'`) | touch: Sunnyside -> inside "Eat here: order" (`r9_a2_l`) -> counter -> "You have arrived: Sunnyside Cafe"; Rise & Shine Bakery the same |
| 3 | Juniper Court mattress tap -> clothes rail | yes: 44% of the mattress found nothing, its head end gave the Wardrobe | `activities.js`: long, low fixtures (beds; sofas/baths when low) get a hit radius covering their length | probe taps before/after (8 points: 2 wrong -> 0 wrong of the visible mattress; the pillow's far corner still goes to the rail); by touch on day 3: pillow -> Bed menu |
| 3 | Shower and sink overlap | yes: the shower curtain hangs in front of the sink; curtain taps gave the sink | `supplies.js`: in a bath with a tall shower the sink's tap point moves up to its basin + mirror | touch: curtain -> Shower, mirror -> "At the sink" (scene: `r9_b3_o`, `r9_b3_r`) |
| 4 | "Your MapleCab is here" banner + toast | yes | `transit.js`: the banner, or a toast only when there is no banner | touch: 3 cab rides, one banner each |
| 4 | Two arrival toasts | yes (navigator's "You have arrived" + transit's "Arrived: X - fare") | `navigator.js`: a cab trip ends quietly (the fare toast says it) | 3 rides: one toast each |
| 4 | "New app: Circle" twice + at most ONE "New app" banner per day in days 0-2 | the "twice" is the banner re-show after a menu covered it, plus duplicate notifies | `phone.js notify`: the same title+text within 30 min is logged once; days 0-2: the 2nd+ "New app" of a day is `low` (in the phone, no banner); `pump`: only a banner seen < 3 s comes back | API on a day-1 save (2nd New app = low, duplicate = dropped); play: day 3 "New app: Pages" shown twice (old page code), later none doubled |
| 4 | Stamps "Eat Street Food" for an onion, "Decorate Your Home" on unpacking | yes (any stall purchase; any `home:furnish`) | `guide.js`: street food only for ready-to-eat food at a stall/stand/market; Decorate only while Decorate mode is open | API: onion at `market_stalls` -> no stamp, a snack -> stamp; `home:furnish` outside Decorate -> no stamp |
| 5 | Bills notice "at 8 AM" | money.js: due Monday 08:00 (`BILLS.due`) | `phone.js`: "Rent & bills tomorrow at 8 AM: $X" (from the data) | not seen in play (Sunday 18:00 reminder not reached) |
| 6 | "12 Sycamore Street" vs Nora's "12 Sycamore Lane" | yes | renamed to **38 Sycamore Street** (id `sycamore_house` kept): `data/homes.js`, `world/_blocks.js`, `data/economy.js`, comments in `scenes/rooms/homes.js`. Note: no Sycamore Street exists on the map; the house's door address is "1108 Park St" | grep: no "12 Sycamore Street" left in src |

**Homes tap sweep (A3).** `sweep.sh` moves into each home (API `G.housing.start`) and samples ~27 points on every fixture's visible faces through a copy of `pick()`; it is pessimistic (it also samples faces hidden behind other things). Checked: starters **Juniper Court, Saltbox Lofts, The Easel House, Birch Lane Flats**; newer **The Garret Lantern Row, The Inkwell Walk-Up, Wren Cottage, Net Loft No. 3, 38 Sycamore Street**. Real problems found and fixed: Juniper bed (above); **Saltbox Lofts bed 41% own**: the broom-and-bucket "Cleaning things" were placed at the bed's foot -> `supplies.js` keeps them away from beds/sofas (bed 41% -> 70%, the rest is the hamper beside it); **Wren Cottage / Sycamore garden bed 59% own, 41% nothing** -> `scenes/rooms/homes.js` hit covers the bed (100%). Left as is (adjacent fixtures sharing an edge, 10-22% of samples): kitchen Sink/Cook/Fridge in every home, Wardrobe vs Bookshelf (Juniper), bath Sink vs Shower in the sampler (by touch the curtain/mirror split works).

---

## Part B: days 3, 4 and 5 by touch (from round 8's `d3_wake.json`)
Full hour-by-hour notes: `.../r9/diary.txt`. Condensed:
- **Day 3 (Thu).** Cooked an omelette (flip game tapped, 0 perfect, "A little scorched. Still dinner." at breakfast: **fixed** "Still edible."); level-up said three times (toast + banner + card): **fixed** (phone notice quiet); mattress, shower, mirror by touch (fixes verified); "Any restroom will do: tap the Bladder bar" in my own bathroom and "Bursting! Tap the Bladder bar" while walking to the toilet: **fixed** (silent while walking to a toilet; "The toilet / restroom is right here: tap it." when one is within 8 units); Jobs > Board > Apply (Shelf Stocker, FreshWay): "Hired!" three times in four toasts (goal line **changed**; jobs.js / achievement toast: see patches); Map > Work > BUS (phone closed); at the stop the "1 Ring here now" left while I read the FTW "A bus stop" (28 min wait); inside FreshWay the trip strip still said "walk 8 min": **fixed** ("you are here: follow the arrow inside"); a passer-by's bubble over the Backpack window: **fixed** (CSS); talked to Tariq Walker; cab home (one banner, one arrival toast: verified); cooked mac & cheese (Auto); the Opportunity's offer banner showed a minute after it was done: **fixed** (held Opportunity banners dropped when over); slept "until it is time for work".
- **Day 4 (Fri).** Continue from a save made at home put me on the pavement outside: **fixed** (`title.js`: continue at home; verified); cab to work: "Starting now: Shift" while waiting; the "Your MapleCab is here" banner held during the ride showed 40 min later at FreshWay: **fixed** (dropped when no cab waits); clocked in late, Priya's dialogue, "Work the shift", one task by API, Auto-work by touch, $57.50; FTW "On shift" 20 min into the shift ate a task tap; bladder/hunger lists from inside FreshWay: "It is right here" (**fixed**, before: a Map card "WALK 1 min, 10 m"); cab home; read a novel; fridge > mac & cheese; slept.
- **Day 5 (Sat).** Morning line lists "work 9 to 4, Bay Ecology: Lecture 1 at 11:30" (a clash, no word about it); called a cab; the FTW "Rain" opened exactly as it pulled up and the cab silently disappeared 8 minutes later: **fixed** (`transit.js`: its patience pauses while a window is open, and a called cab always says "Your cab gave up waiting. Call another in MapleCab."); second cab: "Arrived: Maple Bay University" 490 m from the door: **fixed** ("As close as the road goes: ... is 490 m on foot"); Commons cafe and restroom via the lists (verified); lecture (Part C); "You missed your shift at FreshWay Market." toast at 16:00, `warnings` stayed 0.

### Counts
| day | first-time windows | banner notices (distinct) | at a bad moment | untrue / stale texts | dead or wrong taps |
|---|---|---|---|---|---|
| 3 | 4: Washing day 08:30, A new recipe 09:41, You have a job 11:51, A bus stop 12:24 | ~13 (+5 re-shows on the old page code) | Washing day (ate a walk tap right after eating: **fixed**), A bus stop (the bus left meanwhile) | 6 (Still dinner, any restroom x2, Hired x3, walk 8 min inside, Opportunity offer after done) | 2 Bathroom taps that went out of the Leave door next to it (my walk-tap points on the path, not on the door); bus stop: first tap hit a bench |
| 4 | 3: On shift 11:16, The gentle needs 16:00 (right after Continue), Running low at home 18:28 | ~10 | On shift (ate a task tap) | 2 (cab banner 40 min late, clock-in arrow label for a few seconds after clocking in) | short walk-taps toward a shelf task stopped at the nearer shelf |
| 5 | 2: Rain 07:26, So many ways to have fun 13:41 | ~8 | Rain (cab pulled up; the cab was lost) | 3 ("Arrived" 490 m away, "Friday we go pond dipping" on a Wed/Sat course, "166h 39m left") | 0 |

---

## Part C: one university lecture by touch
Bay Ecology Lecture 1, Saturday 11:30, played by touch: arrow "Ashby Lecture Theatre → the lecture theatre" -> "Bay Ecology at 11:30: take a seat (tap one)" -> seat tap -> Begin -> three boards (Next) -> two questions answered (right both) -> Finish -> "Lecture 1 done. You answered 2 of 2 in class. +90 gardening xp. Homework: read Field Notes of Maple Bay, part 1" -> Leave the theatre (`r9_c_lt`, `r9_c_l1`, `r9_c_l2`). Found and fixed: the activity bar's "166h 39m left" (open-ended class, `hud.js`); the closing line "Friday we go pond dipping" on a Wed/Sat section (all 9 lecture lines that named a weekday now say "next class", `story/university.js`). Seen: the chip said "NOW 09:00 Shift at FreshWay Market" all through the class; ambient chatter bubbles float over the class.
**Not run:** the practical loaded mid-way, the pond class in rain (it rained on Saturday, but the practical is a later class; I did not force time or weather through the API).

---

## Fixed (files and what)
- `src/story/intro.js`: unpack / sleep / groceries / job goal lines; the `save` tip.
- `src/story/texts.js`: fridge stamp name/description.
- `src/ui/goals.js`: `liveDone()` (fridge line from the real fridge).
- `src/sim/intro.js`: Nora's two replies.
- `src/sim/navgoals.js`: `subRooms()`, `needRoom()`, "Order at ..." in the need regex, a door use no longer completes a need goal.
- `src/sim/navigator.js`: sub-room restroom / menu / cafe matching + where-inside notes; cab trips end without a second arrival toast; trip strip says "you are here" inside.
- `src/ui/phone_map.js`: route card WALK/BUS closes the phone + toast; a "Where to?" row for the building you are in skips the card.
- `src/ui/hud.js`: need chooser "It is right here" for the building you are in; open-ended activity bar.
- `src/sim/activities.js`: long low fixtures (beds) get a full-length hit.
- `src/sim/supplies.js`: bath sink tap point above the shower curtain; the cleaning caddy not at a bed's foot.
- `src/scenes/rooms/homes.js`: garden bed hit; comment rename.
- `src/sim/transit.js`: cab banner XOR toast; patience paused under a window + always a "gave up" message for a called cab; "As close as the road goes" when dropped far from the door.
- `src/ui/phone.js`: duplicate notices dropped; one "New app" banner a day in days 0-2; re-show only if barely seen; held Opportunity / cab banners dropped when stale; bills "at 8 AM".
- `src/data/phone.js`: `skill_up` notice `low`.
- `src/sim/guide.js`: street-food and decorate stamps made true.
- `src/sim/needs.js`: bladder notices aware of a toilet/restroom close by or being walked to.
- `src/sim/firsttime.js`: no waiting window within 5 s after a walk or an activity ends.
- `src/sim/skillplay.js`: "Still edible."
- `src/ui/style.css`: speech bubbles hidden over an open window.
- `src/ui/title.js`: Continue from inside your home continues at home.
- `src/story/university.js`: lecture lines without fixed weekdays.
- `src/data/homes.js`, `src/world/_blocks.js`, `src/data/economy.js`: 38 Sycamore Street.

## Patches for files I may not touch (exact)
1. **`src/sim/jobs.js` hire()** (line ~78): three "Hired!" at once (this toast, the goal line, the achievement). Suggest dropping the generic toast when the goal/achievement will speak, or reword:
   `toast(\`Hired! ${job.levels[lvl - 1].title} at ${L.venueName}.\`, 'good');` -> `toast(\`${job.levels[lvl - 1].title} at ${L.venueName}: your first shift is on My Day.\`, 'good');`
   (and in `src/story/intro.js` I already changed the goal line to "Your first shift is on My Day."; if you take this patch, change that goal line to `'Job found.'` so they do not repeat.)
2. **Missed shift** (jobs): a whole missed shift gave only a toast at 16:00 and `G.jobs.current().warnings` stayed 0; and taking a job whose days clash with a university section said nothing. Not patched: decide whether a missed shift should warn (and say so at the start time, not at the end).
3. **Clock-in arrow label**: for a few seconds after "Clocked in (late)" the arrow still read "Go in: FreshWay Market → clock in" (the `clockin` resolver in navgoals.js reads `G.jobs` state; it switches once the shift's dialogue closes). Cosmetic; not changed.

## For other owners (seen, not changed)
- My Day: the chip shows "NOW 09:00 Shift" (missed) all through a class that was actually happening; the morning line lists a work/class clash without a word.
- Chatter bubbles: NPC bubbles clamp to the top of the screen over the clock and money ("Someone's left a box of free kittens...") and float over the lecture.
- Taxi: the MapleCab card's pick-up line says "From: Maple Bay" in the street (vague; at home it says "Near Juniper Court"); estimates were 6 min late once (16:12 est, 16:18 actual).
- Supplies: the tidy toast "One thing less." does not say what was tidied (a stray tap on a bit of mess did it).
- Inventory: "Banana, Lettuce went off — now compost." toasted at 00:00 while asleep (unseen).
- Bus: a bus "here now" leaves while a first-time window covers the stop card.
- The first-time windows "You have a job" (the second a trip starts) and "The gentle needs" (right after Continue) arrive at slightly awkward times; not changed.
- Juniper Court: Leave and Bathroom doors are 1.5 units apart on one wall; a tap between them from a distance picks Leave.

## Decisions for the owner
1. **Continue from inside your home** now starts you at home (it used to put you on the pavement outside the last door, even after a night's sleep). Other interiors still start at their street door. OK?
2. **New-app banners**: days 0-2 one a day, the rest silent in the phone. Day 3 onwards unchanged (day 3 had two). Extend to the first week?
3. **A called cab that gives up**: now always says so. Should it also wait longer (80 real seconds now)?
4. **Taking a job that clashes with your classes**: warn at hiring, or let it be?

## Not verified
Real phone and sound; the intro (not replayed: fridge, unpack, sleep and Nora lines checked by reading and by the data only); the bills "8 AM" banner (Sunday 18:00 not reached); the held-cab-banner drop and the held-Opportunity drop (the code paths, not seen happening after the fix); the "New app" limit and the two stamps (API only); the practical loaded mid-way; the pond class in rain; a second lecture; landscape; Chapter 2+.

## Files changed
`src/story/intro.js`, `src/story/texts.js`, `src/story/university.js`, `src/ui/goals.js`, `src/ui/phone_map.js`, `src/ui/hud.js`, `src/ui/phone.js`, `src/ui/style.css`, `src/ui/title.js`, `src/sim/intro.js`, `src/sim/navgoals.js`, `src/sim/navigator.js`, `src/sim/activities.js`, `src/sim/supplies.js`, `src/sim/transit.js`, `src/sim/guide.js`, `src/sim/needs.js`, `src/sim/firsttime.js`, `src/sim/skillplay.js`, `src/scenes/rooms/homes.js`, `src/data/phone.js`, `src/data/homes.js`, `src/data/economy.js`, `src/world/_blocks.js`, `docs/reports/qa_round9.md`. (Some of these were already swept into the lead's "WIP of running workers" commits ffe6738 / 3b6888f while I worked.)
Screenshots cited (all looked at): `out/shots/r9_a2_d, r9_a2_f, r9_a2_g, r9_a2_i, r9_a2_l, r9_a3_bed2, r9_a3_p4, r9_a3_bath2, r9_b3_j, r9_b3_o, r9_b3_r, r9_b3_bus1, r9_b3_bus2, r9_b3_bag, r9_b4_wake, r9_b4_wc3, r9_c_lt, r9_c_l1, r9_c_l2`.
