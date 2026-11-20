# My Day — schedule vs. ideas, the HUD button, the walk-through (owner msg 107, BIBLE 21.2) — worker report, condensed

**UPDATE Stage 122 (2026-11-18): the HUD My Day button is GONE.** The To do chip under the needs bar (ui/goals.js `#goalsw`) opens the one menu (To do > My schedule > Tomorrow > Ideas > 'More on your phone'); the pad's Y opens it too (src/ui/padnav.js). `H.day` is still built in src/ui/hud.js but not attached, so `G.hud.setMyDay` (leave-now pulse) now pulses the chip. The walk-through is 4 steps. Lines below that mention the button are history. Details: docs/reports/first_evening.md.

## What it is
- **MY SCHEDULE** = `G.planner` entries: only what the player chose, plus what life puts there (work shifts, story / family, tickets, enrolled classes, deliveries, accepted invitations). Each row carries a small tag saying why it is there ("Work", "Family", "Class", "Booked", "Delivery", "With a friend", "You added").
- **IDEAS** = everything they could add, gathered from all content by `src/sim/myday.js` and ranked for right now. Nothing becomes an entry until the player taps **Add** (an Opportunity: **Take**).
- **City events are no longer on the schedule.** `G.planner.list()` leaves the calendar's virtual event rows out unless asked (`{ events: true }`); they are Ideas.
- **"Any time today"**: an open-ended idea (a place, a friend, a need) is added with one tap and no clock time. It is done the moment the player arrives and lapses quietly at the end of the day. Ideas with a time of their own keep it; a market / fair (a window) is put at "as soon as you can get there"; a city event at 20 min before its parade.
- **The My Day button** (REMOVED in Stage 122, see the top): top-left corner of the HUD, first in the row, before the clock. One tap opens a compact sheet (the sim pauses, like the phone): NEXT (what, when, how far, "Take me there") · the open Chapter in gold · the rest of today (+ "any time today") · 3-5 ideas for the free time ahead (Add / x = "Not interested") · To do (the Goals list) · Opportunities taken up · a peek at tomorrow. With nothing planned the sheet leads with the ideas.
- **The Goals chip merged into it**: the old Goals widget is now one line under the needs bar ("NEXT 09:00 Shift at ...", "TO DO Unpack your moving boxes", gold "STORY Chapter 2 · ...", "FREE 5 ideas for right now"); a tap opens My Day. Goals / Opportunities / appointments are sections of the sheet. `G.goals`, the "done" toast, the hint bubble and captions are unchanged.
- **Walk-through**: the first time the sheet opens, 3 steps on the real UI (this is your schedule / these are ideas / tap Add), Skip any time; `G.myDay.explain()` replays it.
- **Phone app** (id still `planner`, shown as "My Day"): tabs My Schedule (Next, Today / Tomorrow timeline with a now-line and tappable free gaps "2 h free · 3 ideas for this gap", any-time entries, alarm) · Ideas (Today + 6 days, or one gap; idea page with a time picker and a kind conflict note) · Week (seven readable day cards; tap one for its timeline). The old 14-day calendar grid is gone.
- **Recommendations**: one morning line ("On your day: work 9 to 5. Free this evening: two ideas, like Open Mic Night at 20:00."; also names a city event, wet weather and the open Chapter), at most one "idea for tonight" notice (only if the evening is free and that category was not turned down), and the existing leave-now alert (the HUD button pulses while it is time to go). The planner's own "Today in Maple Bay" and 06:00 weather notices are folded into the morning line.

## Mapping of every existing planner add
| Caller | Before | Now |
|---|---|---|
| calendar events (virtual rows in `list()`) incl. the six city events | shown in Today / Calendar as if planned | **Idea** (`ev:` / `big:`) |
| aquarium.js: "Release <name> at Gull Point Beach" (added by itself at chain step 3) | entry | **pinned Idea** (`G.planner.pins()`, shown first, "They are expecting you") |
| jobs.js shifts | entry | life item "Work" |
| story.js beats (kind `story`) and `recur` family meals | entry | life item "Family" |
| university.js enrolled classes | entry | life item "Class" |
| orders.js deliveries | entry | life item "Delivery" |
| shows.js tickets, arena.js tickets, natatorium race entry, observatory planetarium, city hall wedding | entry | life item "Booked" (the player paid / booked) |
| social.js hangouts, messages.js accepted invitations | entry | life item "With a friend" / "Family" |
| opportunities.js accepted Opportunity with a time | entry | entry ("You added"); on offer it is an Idea (`opp:`), Add = `G.opps.accept` |
| museum tour, aquarium show board, hotel events, city hall board / council / mayor, Wander "Add to planner", Showtime "Add to planner", the phone's own add form | entry | entry "You added" (the player tapped it) |
Any system may now suggest instead of add: `G.planner.add({ ..., offer: true })` or `G.planner.suggest(o)` -> a pinned Idea.
Old saves (`planner.v < 2`): auto-added entries not yet started become pinned Ideas (today that is only the aquarium release); everything else stays; the old virtual event rows were never stored.

## Idea sources
pins · calendar events + shows / films / concerts / games (`G.guide.whatsOn`, max 3 showings a venue) · calendar rows without a guide page · a city event up to 4 days ahead · Opportunities on offer · a place for each need under 42 (`G.nav.find`, `G.needsExtra.fix`) · up to two friends / family who are out and not working (`G.social.whereIs/schedule`) · one place per interest family (guidebook) · somewhere never visited · the weather (clear night: Observatory; wet: cinema / museum / aquarium / library; fine: park / pier / lookout) · a University course when not enrolled and the Registrar is open · a coach who is out.

## Ranking (`rank()` in sim/myday.js; rebuilt at most once per game minute, cached)
base by kind (pin 90, city event today 80, need 40-90 by how low, Opportunity 62, event 52, show 50, weather 50, friend 48, interest 46, coach 44, new 42, class 40) · starts within 90 min +12, within 4 h +6, open now +8 · walk minutes / 2.5 off (max 18) · cannot afford -30 · a sale +6 · matches an interest +10, a trait +4..8 · fixes a need that is getting low +8..12 · never been +5, been a lot -4 · clashes with something on the schedule -22 · one of that category already on today -12 · added in the last 2 days -15 · learning: Add +3 per category (max +12), "Not interested" -6 (max -24) and that idea stays away 7 days · a small stable shuffle per 6 h. The short lists pick greedily for variety (one per category and place first, at most two of a kind).

## HUD arrangement (390x844)
Row 1: **[My Day] [clock chip]** · row 2: needs bar · row 3: the one-line chip (old Goals position; toasts now start under it). Screenshots in out/shots: `md_hud1` (city), `md_t5_hud_after` (indoors), `md_t9_shift` (during a shift), `md_t9_phone_home` (phone open), `md_t10_hud_chapter` (gold line), `md_t9_hud_land` (landscape); sheet: `md_t1_tut1..3`, `md_t1_added_opp`, `md_t3_added` (conflict), `md_t5_added3` (Chapter row), `md_t8_bigday_added`, `md_t9_12items`, `md_t9_12items_land`, `md_t6_ch4_teach2`; app: `md_t3_sched`, `md_t3_gapideas`, `md_t3_conflict`, `md_t3_week`.

## API
`G.myDay` = `open(opts?) -> Promise<bool added>` (resolves on close; opts `{ teach, explain, gap }`), `close()`, `addIdea(opts?) -> Promise<bool>` (teach mode: closes itself after the first Add; this is what `_chapters_play.js` MYDAY.add awaits), `explain()`, `isOpen`, `ideas({ n = 5 (0 = all), day, at, until, varied })`, `idea(id)`, `add(ideaOrId, time?) -> apptId | true | null`, `dismiss(idea)`, `undismiss(idea)`, `schedule() -> { next, travel, today, flex, tomorrow, chapter, goals, opps, free }`, `gaps(day?)`, `summary()`, `onAdd(fn) -> off`, `defaultTime(idea, from?)`, `state()`.
`G.myDayUI` = `chip()`, `refresh()`. `G.hud.setMyDay({ soon, badge })`.
`G.planner` gained: `suggest(o)`, `pins()`, `conflicts(t, dur, exceptId?)`, `srcOf(a)`, `isLife(a)`, `SRC_LABEL`, `atPlace(a)`, `add({ flex: true })`, `add({ offer: true })`, `add({ src, chosen })`, entries at a spot with no place id (`data.pos {x,y,name}`); `next()` now prefers the running / soon timed entry, then an any-time one; `list()` default is without events; `update(id, { t })` turns an any-time entry into a timed one and emits `appt:change`.
Events: `myday:open`(opts), `myday:close`(added), `myday:add`({ idea, apptId, oppId }), `myday:dismiss`(idea), `myday:change`; planner: `appt:pin`, `appt:unpin`, `appt:change` (all the old ones unchanged).
State: `G.state.myday = { v, seen, like: { cat: n }, no: { key: day }, last: { key: t }, sumDay, nudgeDay, n: { add, no, open }, todoShut? }`; `G.state.planner` gained `v: 2`, `pins: []`; an entry may carry `flex`, `src`, `arr`.

## Files
NEW: `src/sim/myday.js`, `src/ui/myday.js`, `src/ui/myday.css`, `src/art/icons/myday.js` (8 icons: `myday.btn / idea / film / festival / new / stars / class / free`).
EDITED (mine): `src/sim/planner.js`, `src/ui/phone_planner.js` (rewritten around the three tabs; the add form and `detail()` kept).
EDITED (shared, small): `src/ui/hud.js` (1 import, the `H.day` button + `div.hud-tlrow` in build(), `setMyDay` on G.hud, 2 header comment lines) · `src/ui/hud.css` (8 rules after `.hud-time`, 1 reduced-motion selector) · `src/ui/goals.js` (header note; head `onclick` opens My Day when `G.myDayUI` is there; `render()` early branch draws the one-line chip; `'myday:change'` added to the refresh list) · `src/ui/goals.css` (6 rules for `#goalsw.md` + 1 rule moving `#toasts` under the chip) · `src/data/phone.js` (app name 'Planner' -> 'My Day' + its question line).
The Chapter engine's gold row keeps working: `G.goals` still holds the `chapter` goal; My Day's gold row carries `data-g="chapter"` so `_chapters_world.js`'s tap listener still points the arrow, and reads `G.chapters.row()` / `marker()`.

## Wanted from the lead (files I may not edit)
- `src/sim/apps.js:22` name `'Planner'` -> `'My Day'`, tagline -> `'What is on my day, and what could be?'`, desc / does lines (timeline, ideas, week); `:21`, `:44`, `:62` say "Planner / planner".
- `src/ui/phone.js:163` lock-screen line `'Nothing planned'` is fine; optional: open `{ myday: 1 }` instead of `null`.
- Wording sweep "planner / Planner / Calendar" -> "My Day / your day" (player text only): phone_guide.js 96-99, 223 ("Add to planner" -> "Add to my day"); phone_minis.js 33; phone_messages.js 102; phone_jobs.js 41; phone_home.js 109; phone_uni.js 42; phone_taxi.js 69 ("Planner · " prefix); phone_tips.js 47, 55, 67, 70 (the Planner tip should describe schedule vs. ideas); story/intro.js 237, 246, 296; story/texts.js 293-419 ("on your calendar"); aquarium.js 124-129; museum.js 112-113; hotel.js 239-240; cityhall.js 198; observatory.js 118.
- Font: in headless Chromium "fi" renders as a broken ligature ("first" -> "Arst") all over the game; `font-variant-ligatures:none` on `body` fixes it (I set it on the sheet and the chip only).

## Verified
Real taps (Playwright, hasTouch, 390x844, dist build): New Game -> creator -> traits -> home picker; then `G.intro.skip()` + a time skip to the first morning (API); HUD button -> walk-through (3 steps) -> Add a timed show, an open-ended place, Take an Opportunity -> sheet re-orders; "Take me there" -> Map route card -> Walk -> waypoint; arrival completes the entry ("Done: River Lookout") — the long walk itself was driven by the pathfinder; conflict box (Add it anyway / Leave it); row open -> Remove (+ undo line); "Not interested" + Undo; chip tap opens the sheet; Week / day card / gap -> ideas for the gap / idea page with the conflict note; Chapter 4 `myday_add` step: "Add one" -> teach sheet -> Add -> the Chapter went on (pc 18 -> 21); pinned Idea from an old save added; Escape closes.
API / eval: old-save migration; save -> load identical; university enrol -> "Class" life item; city event day (ideas, morning line, add = 20 min before the parade); a simulated week, top 5 at six times of day (72 distinct ideas over 42 lists, no flooding; listing in the session log); ideas build 1.7 ms avg / 3.3 ms max with the what's-on list warm, ~35 ms once per 30 game minutes when it is rebuilt; notices over a day; 12 items; long titles; landscape 844x390.
Zero page errors in every run. `node src/data/validate.mjs` clean, `node tools/build.mjs` ok.
NOT verified: a whole hand-played day; the leave-now banner together with the pulsing button on a real walk; the evening "idea for tonight" notice firing in a started game (its conditions were exercised only by reading the code and by a day where it correctly stayed silent); friend ideas with a real friend out in town; coach idea arrival; behaviour while a cab / train trip is running.

## Known gaps
- The one-line chip sits where phone banners appear; a banner covers it until it goes.
- Other systems' buttons and toasts still say "planner" (list above).
- A friend idea is "drop in where they are now": they may have moved on by the time you arrive (the entry then lapses quietly). Inviting a friend to a time is still the phone form ("Plan your own").
- The Opportunity idea's "Not interested" only stops My Day suggesting it; it stays on offer in its own app.
- Removing a "Booked" entry in the app does not refund the ticket (unchanged behaviour); work / class / delivery / story entries cannot be removed there.
- Ideas for a later gap or another day contain only things with a time plus places open then (no needs / friends / Opportunities).

## Owner decisions
- Name: "My Day" is used for the button, the sheet and the phone app (the app's first tab is "My Schedule"). Alternative for the app only: "Planner" as the full view of My Day.
- Should the planner's per-event "Today in Maple Bay" notices stay off (they are folded into the morning line and one evening idea)?
- Is one tap = "any time today" right for open-ended ideas, or should Add always ask for a time?

- Owner msg 279 (2026-11-20, Stage 132): people ideas skip family members until the story Chapter where you first meet them is done (storyMet in src/sim/myday.js; first chapter per person is read from the CHAPTERS casts).
