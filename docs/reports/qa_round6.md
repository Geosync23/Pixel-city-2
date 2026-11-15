# QA round 6 (Opus QA lane, 2026-11-15): the first-week fix pack

**Setup.** Headless Chromium, 390x844, `hasTouch`. Same persistent driver as round 5 (`srv.mjs` + `p.py`), now on port 7788 (main tree) and 7799 (a copy of `src/` used to test patches to lead-owned files without touching them). Scratch: `/tmp/claude-0/-home-user-Pixel-city-2/ab4bf52b-889a-5288-a866-29c2e55d0472/scratchpad/r6/` (screenshots in `shots/`, saves `ck6_*.json`, patches `apps_patch.diff`, `ride_patch.diff`, `apps_patched.js`, `game_patched.js`, `transit_patched.js`).

**What "played" means.** "Touch" = a real `touchscreen.tap` / CDP touch drag at the element or world point. "Walked" = the pathfinder walked the player to a point (the same move as a tap on the ground; used for long street walks). "API" = a direct call, named as such.

`node tools/build.mjs` passes, `node src/data/validate.mjs` passes, the dead-tap sweep over all 262 rooms / 3,537 interactables reports **0 dead taps** (round 5: 30).

---

## Fix list

### 1. Plane and airport start: **fixed** (touch-replayed)
- `src/scenes/rooms/airport.js`: new `airSeats(sc, G)` replaces the generic `activities.js` "Sit" in all three airport rooms (plane, concourse, terminal). During any intro step seats are **not offered at all**; afterwards the tap target is small and sits on the seat (`h .5, hit 7` instead of `h 1.2, hit 14`), so a tap on the aisle walks. The fountain rim keeps only its own "Sit by the fountain" (also hidden during the intro). This also fixed the 1 dead "Sit" in the terminal.
- Replay (touch, fresh New Game, Maya / Foodie-Curious-Early Bird / Juniper Court): 8 aisle taps in the plane, **0 sits** (round 5: 5 of 6). Left the plane at **14:15** (round 5: 16:13). Concourse 24 taps toward the tram, terminal 6 taps to the carousel + 12 to the exit: **0 sits** (round 5: ~20). Curb reached at **14:42** (round 5: 18:20). Shots `t6`, `t7`, `t8`, `t10`, `t12`.
- Hints, all checked on screen:
  - `src/story/intro.js`: "Tap the ground to walk", "Open the MapleCab app (the yellow cab)", "Pick your new home, then tap Request ride", "Tap the cab to hop in", "Tap your door to go inside"; goal hints "Tap a box / the fridge / your bed / the stove"; "Introduce yourself" hint now says "Walk up to someone and tap Talk at the bottom of the screen". Walt: "There you are" (was "four minutes early") and "Rent goes out with your bills every Monday morning" (bills really are weekly; was "every other Monday").
  - `src/sim/intro.js`: the curb caption shows the real clock ("Monday, 2:41 PM. Spring." in the replay; was hard-coded 2:00 PM).
  - `src/sim/intro_airport.js`: travellers in the airport **do** talk on a tap (their interactable is not a cast "Talk"), so the hint now reads "tap a traveller (or the name button at the bottom when you stand next to one) to say hi".
  - `src/ui/goals.js`: `tapWords()` turns "Click" into "Tap" in every hint bubble and goal-hint toast on a touch device.
- Not fixed (not my files, see Patches): the free intro cab took **61 game min** to reach the airport curb and the ride home took 107 game min at 1x (`t20`, `t21`). The arrival still awards "Eggs on Top" (starter pantry already has 3+ items).

### 2. Fridge / cooking: **fixed** (touch-replayed)
- `src/sim/inventory.js`: the item detail with its Eat / Take / Store buttons is now pinned at the **top** of the window (sticky), and empty slots are collapsed (3 shown, the head says "19/63 · 40 free"). Shot `f3`: the whole Kitchen & Backpack window fits on 844 px; tapped the banana, tapped Eat at y 291 (round 5: y 1069, off screen), ate it.
- `src/sim/activities.js` (cook menu only):
  - A family recipe someone wrote out for you (`learn.story`, i.e. Bea's Maple Oat Pancakes, skill 2) can be followed at any Cooking level. Before this it was "Needs Cooking level 2" and so never in "can cook now" or "one short" for a new player (the real cause of QA5 A7's second half).
  - Rows that need shopping now say where: "Missing: Maple Syrup · at FreshWay Market" (one shop that covers the most missing items, "+" when one shop is not enough). The detail page keeps its full "Shopping: … sells …" line.
  - Replay (touch, 7799): with flour / oats / eggs / milk in the fridge, Bea's pancakes showed under "One ingredient short · Missing: Maple Syrup · at FreshWay Market" (`ck3`); with syrup it was the **first** row of "Can cook now" (`ck4`); cooked it by touch (timing game), 3 servings.
- Nana's pancakes feed you: done without touching `story.js`: `src/sim/needs.js` adds the needs of a story beat on `story:beat` (table `SOCIAL.beats` in `src/data/needs.js`): `g1_breakfast` Hunger +45, Social +15. API check: Hunger 17 → 62, Social 46 → 61.
- `inventory.js` now emits `fridge:stored` when the player's own groceries go into the kitchen (put-away on coming home or the button). Used for the cooking tip, and offered to the lead for "Eggs on Top" (see Patches).

### 3. Social and low needs: **fixed / tuned** (touch-played days 4-7)
Why Social collapsed: it drained 2.5/h awake (40 a day) and only stranger chats, calls, texts (+4) and shifts filled it; family scenes, the till, and being among people gave nothing.
Changes:
- `src/data/needs.js`: Social `start 50 → 60`, `decayAwake -2.5 → -2.0` (a waking day costs 32). New `SOCIAL` table: `amongPeopleMult 0.5` (the drain is halved inside any public venue), `till 3` (a word at the till on a purchase, at most once an hour), `beatDefault {social 15}`, and per-beat meals: `g1_breakfast {hunger 45, social 15}`, `f1_welcome_dinner {hunger 50, social 25}`, `g3_sunday_baking {hunger 20, social 20}`, `f2_school_run`, `k1_reunion`, `k2_open_mic`.
- `src/sim/needs.js`: applies those; plus the low-need notices below.
Measured in play: a 3-verb stranger chat +17 (30 → 47), a phone call +14, the till +3, "Strike up a conversation" at the Duck Pond +9, people-watching 90 min +8. **Social never went below 46 on days 5-7** (round 5: 1-18 on four days). Morning values D5 49, D6 66, D7 46.

Low needs ("no warning strong enough to act on"):
- `LOW_NOTICE` in `src/data/needs.js`: every low notice says what to do and where ("Getting hungry. Eat something from your fridge at home, or Map > Where to? > Food…"), and a stronger line at the critical band ("Starving! Eat now: at 0 you pass out and wake up at Bayside Clinic ($40)…").
- **Bug found and fixed**: going low → critical never emitted anything (`check()` only fired `needs:low` for critical when the previous band was not `low`), so the step before a pass-out was silent. New event `needs:critical`; for Hunger / Energy it is a high-priority phone banner (`crit1`). Replayed: Hunger 14 → 12 showed the "Starving" banner.
- A long activity (feet up, sitting, auto-work…) now stops before Hunger reaches 0 or Energy 0 ("You stop (…): you are starving"). Sleep already had its own "Your stomach woke you up" (seen in play at Hunger 6, `bed2`).
- No low notices while you sleep: they are said when you wake. No "Getting hungry" while you are already eating (seen in play at Dot's Diner before the fix).
- `src/sim/intro.js`: the one-time `needs:low` tutorial toasts are removed (they doubled the new notice).

### 4. Shift screens in portrait: **fixed** (touch-played barista; line cook and grocery clerk screens checked)
- `src/ui/jobs.css` (portrait media query): the shift HUD is a column with **Auto-work / End shift right under the header** (round 5: y 847, below the fold; now y 552-566), narrower (196 px), tickets after the first show only their current step, buttons 34 px tall.
- `src/ui/jobs.js`: marks tickets after the first (`.rest`).
- `src/sim/_jobs_work.js`: you meet your boss when a shift starts, so Marlow is "Talk to Marlow" (a stray tap no longer opens small talk; core only ignores stray taps on labels starting "Talk") and bosses no longer stay "Stranger".
- Played by touch on 7799 (D7, real shift): tapped HUD tickets, the player walked to each station, drink-recipe minis by tapping the ingredients: 10 tasks, 4 perfect, $9 bonuses, then Auto-work by touch (`d7b`, `d7c`). Paid $90.75. Shots `j2`, `j5`, `j_grocery_clerk`, `j_line_cook`.

### 5. Notification flood: **partly** (my files done; apps patch for the lead, tested on a copy)
- `src/ui/phone_tips.js`: the cooking tip comes when groceries go into the kitchen or when you get home at dinner time (was: after the first cook); the talk tip the first time you are inside a place with people, or when Social first runs low (was: after the first chat); no tips while you sleep (they wait for the morning, one after each wake).
- `src/story/intro.js` + `src/sim/intro.js`: nudges have `unless`: no "when you're ready to job hunt" (or its "Hired!" goal toast) when you have a job, no cooking nudge after you cooked, no train nudge after a ride, no "say hello" nudge after three people; the "needs icons" tip moved from day 3 15:00 to day 1 11:00 and is skipped if the needs tip was already seen.
- **App releases (lead-owned `src/sim/apps.js`)**: patch below, tested on the 7799 copy. Same save, the night of day 0 → morning of day 1: current code **4 "New app" notices between 00:04 and 03:04**; patched **none overnight**, releases at D1 08:04 and 09:34, D2 08:04 and 13:04.
- Morning summary of overnight notices: needs `src/ui/phone.js` (lead). Recommendation in Decisions.

### 6. Text faults: **partly**
- Addresses: the map's addresses come from `src/sim/addresses.js` (nearest street), not a world file, so `_dress.js` cannot help; patch below (2 lines). Not applied.
- Family texts: `src/story/texts.js` `CHECK_INS.family` now holds only lines any relative can send; voiced / signed lines moved to `CHECK_INS.familyBy` (jules "- N", nana "Love Nana", dez "CUZ", theo "- Theo"); `src/sim/social.js` picks the sender's own list first (60%). Seen in play: Dez sent "Sunday. Food. Ours. You know the drill."
- `src/sim/_social_data.js`: "Nora' house" → "Nora's house" (QA4 D24 / QA5 B8).
- Story state: the nudges `unless` above. "Say Hi Back" now reads "Meet your first new face in Maple Bay" (it fires for Walt / Manny on arrival).
- Not fixed (other workers' files): "Eggs on Top" on arrival and "Before the Emails" on a 04:33 pass-out (`src/sim/story.js`, lines below); Theo / chapters say "Rent's every other Monday" (`src/story/chapters.js:571, 623`) while bills are weekly.

### 7. Staff discounts: **already applied** before this round; extended
- `src/ui/shop.js` already multiplied by the staff discount (verified by touch at Bean & Gone: Espresso $2.50, list $3). I replaced it with `perk(venueId)`: the best of staff discount, a friend who works there (`G.social.discount`, 5-10%, had no caller) and a story discount (`G.story.discount`, had no caller). They do not stack. The shop header says "Staff discount: 20% off." (`s2`, `d5f`). Goods sheets go through `G.shop.price` already.

### 8. Ring Toss: **fixed** (played by touch)
- `src/sim/_cityevents_fx.js` gives the fair's `ringtoss` game a stall scene (striped awning, a table with a pyramid of 12 bottles) and a red ring as the thrown thing; a ringer sits on the top bottle. `src/ui/minigame.js` got a one-line `def.projectile` hook in the aim game (the default ball is drawn otherwise). Played to the end by touch (`rt1`).

### 9. Dead taps: **fixed** (sweep: 0 of 3,537)
- Symphony Hall: the 24 dead "Sit" were the **orchestra chairs and piano bench on the stage** (generic `activities.js` Sit). `src/scenes/rooms/performance.js` now marks stage fixtures and seating rows as handled (`fx._sit`), so the per-seat "Sit" is the only one in the stalls (18 duplicate per-row targets also gone).
- Airport terminal: the fountain-rim generic seat (now skipped, see item 1).
- Natatorium: the bench on the deck side of the shut turnstiles (no path). It now has its own "Sit", offered only while the gates are open.

### 10. Days 5-7 diary: see below.

---

## Travel time: planner estimate vs. actual (game minutes)

From Juniper Court at about 19:00 day 0 (same save each time, needs frozen). Walk = Lucky Corner, cab = Gull Point Lighthouse (free cab, includes the wait), bus = Dot's Diner (walk to stop + wait + ride + walk). API-driven trips (pathfinder walk, `callTaxi`, `boardBus`).

| mode | estimate | 1x | 2x | 4x |
|---|---|---|---|---|
| walk | 21 | 19 | 19 | 22 |
| cab (wait) | 21 | 54 (7) | 69 (14) | 86 (8) |
| bus | 29-33 | 41 | 45 | 35 |
| cab, with `ride_patch` (7799 copy) | 21 | 43 (15) | 51 (8) | 57 (14) |

In play: walk to the Duck Pond at 4x est 20 / actual 17; walk Nora's → home at 4x est 47 / 66 (goPlace door walk); cab Dot's → home at 1x: 18 wait + 100 ride = **119** (Map said cab 41).

- Walking now holds at every speed (the lead's change works).
- **Cabs are 2.5-4x the estimate and get worse with speed.** Cause: in `src/core/game.js` the new sub-stepping runs only in the non-cutscene branch; a cab ride is a cutscene (`transit.js:81`), so the cab still moves at 1x while the clock runs at 2x / 4x. `ride_patch.diff` (below) sub-steps rides too and makes the ride clock +0.5/s at any speed: the speed effect shrinks (43/51/57) but does not vanish, and even at 1x a ride is about twice the planner's `CAB_V` figure. Recommendation: after the patch, re-measure `CAB_V` (navigator.js) from real rides, or base the cab estimate on the route length the cab will drive.
- Bus: the ride runs at its own clock (0.2x), so it holds; the gap to the estimate is the wait (the stop panel said "2 min" for the 1 Ring at 15:32 in play; the bus came at 16:01).

---

## Days 5-7 diary (touch-played on 7799, continuing the round-5 Day 4 13:26 save, which loads fine)

Character: Maya, Trainee Barista, Juniper Court. Speeds used: 1x for shifts, 2x / 4x for walks.

**Day 4 (Fri) afternoon / evening** (to finish the round-5 day)
- Outside Dot's Diner, Social 30. Walked up to a local, tapped the Talk chip: Lucia, 3 verbs, Social 30 → 47. Ate Grilled Cheese & Soup at the counter by touch ($8; +3 Social at the till).
- Map > Where to? Home: walk 71 / bus 46 / train 41 / cab 41. Took the bus by touch. **Bus trap**: the trip bar says "your stop: Western Ave & Market St" all ride long and "Get off at next stop" is always offered, so I got off one stop early (my error, but an easy one); at the right moment the panel shows "YOUR STOP IS NEXT" while the bus dwells at the stop before, with a "Get off here" button that drops you at the wrong stop; the trip bar still said "(5 stops)" (`d4n`). Missed it, "Missed it: get off at the next stop", got off far away. Gave up and called a cab: 18 min wait + 100 min ride ($25.75).
- Bladder hit 0 in the cab ("You cannot think about anything else"). Home 19:24: toilet, sink, 15 min shower (Hygiene 100), cooked Mac & Cheese by touch (timing game), phoned Nana from Messages > Contact > Call (+14). Slept "until morning" 21:27.
- Night: 1 new-app notice at 00:00 (Receipts), 3 content notices, the weather tip at 05:10 while asleep (now held to the morning), 3 "Today in Maple Bay". Calm compared to day 0.
- Bed needs: Hunger 95, Energy 46, Hygiene 97, Fun 96, Social 51.

**Day 5 (Sat)**, rain
- Woke 07:00, Energy 100. Ate Mac & Cheese from the fridge (detail pinned at the top, Eat at y 234). 58 unread notifications.
- Old Town Market: "closed right now" at 07:58 (opens 08:00); bought Maple Syrup, Berries, Apple at 08:09 (+3 Social). Talked to a stranger: Social 51 → 69.
- Bean & Gone: header "Staff discount: 20% off.", Maple Latte $3.50.
- Nana's House 09:28: door open, nobody home (Nana out). Watering the plants is offered.
- Opportunities app: "Move one thing" → home → Decorate → dragged the sofa by touch (first drag "Something is in the way", second worked): "Opportunity done: Move one thing", Comfort +.
- Duck Pond (Spring Blossom Festival day) at 4x: est 20, walked 17. "Strike Up a Conversation" (sort game by touch) Social +9; People-Watch 90 min Social +8, Fun +7. **Bladder ran from 15 to 1 during the 90 min** with no stop (bladder is not covered by the new guard; it never passes you out).
- Park restroom (Map nearest). Home 15:11 at 4x. Bookshelf: "No novel in your backpack" (the studio shelf has nothing to read). Feet up 2 h. Cooked Tomato Pasta by touch. Slept 19:15 "until morning".
- Night D5 → D6: **9 events, all low**: 2 content notices, a spoil toast, Hygiene low (at 05:09, while asleep: now deferred), 2 "Today in Maple Bay". No app releases.
- Day 5 log: 9 notices, 23 low notices, 12 banners, 31 toasts, 4 Opportunity offers, 1 done.

**Day 6 (Sun)**, fog
- Woke 07:00, Social 66. Planner: festival, brunches, shows; **no family plan**. The welcome dinner missed on day 3 ("Tomorrow instead? Theo will re-roast") **never came back** in days 4-6 (`G.story.beat('f1_welcome_dinner')` still `pending`, `G.story.active()` empty).
- MapleCab has **no "Nora's House"** (it lists only places you have been; you never went because the dinner was missed). Lost 200 game min with the app open waiting for a cab I had not requested (my error).
- Walked to Nora's at 4x (est 47, 66). **The house was empty** while Circle / `whereIs` says Nora, Theo and Pip are "At home" (placeId null). Phoned Nora instead (+14).
- Called a cab home: it took 44 min to arrive, I did not walk to it, it "gave up waiting" after 80 min. There is still no arrow to a waiting cab.
- 18:00: **three notices for one thing**: "Reminder: Bills are due tomorrow at 8: $188", "Bay Bank: Rent & bills tomorrow: $188", "Tip: Monday bills".
- Walked home at 4x (56 min). Hunger went to 13 on the way with **no notice** (the low → critical bug, fixed after this; replayed: the "Starving" banner now shows, `crit1`). Ate pasta, toilet. Bed menu offered "Sleep until it is time for work · Wake at 05:44, 75 min before your shift" (`bed3`, lead's change, works). The wake card shows a stray **"null"** line (activities.js, below).
- Day 6 log: 7 notices, 16 low, 7 banners, 22 toasts, 2 offers.

**Day 7 (Mon)**, clear
- Woke 05:44. Hygiene 17 ("No shampoo left. Water does half the job." in the shower). Walked to Bean & Gone, **clocked in 06:35, on time** for the first time this save.
- Played 10 tasks by touch with the new portrait HUD (tap a ticket, the player walks, recipe minis), then Auto-work by touch. "Weekly bills paid: $188" at 08:00 as banner + toast; the money delta sits left of the balance (`d7b`). Shift card: 5 stars, 73% auto, $90.75. During Auto-work Hunger 38 → 16, Hygiene → 4.
- Avocado Toast at the till (staff price). Home, toilet, shower. End of diary at 14:30.
- Needs at 14:26: Hunger 44, Energy 38, Hygiene 44, Fun 43, Social 65, Bladder 97, Comfort 30.
- Money over days 5-7: $288.50 → $176.75 (bills $188, shift +$90.75, food / groceries / fares).

**Where days 5-7 lose people (new this round)**
1. The family thread stalls after a missed welcome dinner: no reschedule, the sister's house stays empty and is not a cab destination.
2. Getting off the bus: the "your stop" wording and the always-there "Get off" buttons make the wrong stop easy (`d4n`).
3. Cabs: long waits, no arrow to a waiting cab, "gave up waiting".
4. Duplicate notices for one event (bills x3, bills paid banner + toast, the Starving banner shown twice 5 min apart).
5. Bladder empties during long activities with nothing stopping them.
6. The starter studio has no book; "No shampoo left" with no hint where to buy it.

---

## Patches for lead-owned files (exact)

**A. `src/sim/apps.js`** (calm first week; tested on the 7799 copy, see item 5). Full file: `scratchpad/r6/apps_patched.js`; diff `apps_patch.diff`:
```js
// CATALOG transit:
release: { day: 2, on: 'ride:end', when: kind => kind === 'train' || kind === 'bus', text: 'your first train or bus ride, or day 2' },   // a cab ride no longer releases Bay Transit
// CATALOG closet:
release: { day: 2, on: 'shop:buy', when: () => safe(() => G.wardrobe.owned().length, 0) >= 2, poll: () => safe(() => G.wardrobe.owned().length, 0) >= 2, text: 'your first clothes, or day 2' },   // any purchase used to release Closet
// release(): after `s.lastRel = G.state.t || 0;`
s.perDay = s.perDay || {}; s.perDay[day()] = (s.perDay[day()] || 0) + 1;
// check(): replace `const s = S(), t = G.state.t || 0; if (t - (s.lastRel || -9999) < 60 && t >= (s.lastRel || 0)) return;` with
const s = S(), t = G.state.t || 0, h = safe(() => G.now().hour, 12), early = day() < 7;
if (h < 8 || h >= 21 || safe(() => G.needs.sleeping, false)) return;
if (t - (s.lastRel || -9999) < (early ? 300 : 60) && t >= (s.lastRel || 0)) return;
s.perDay = s.perDay || {}; if (early && (s.perDay[day()] || 0) >= 2) return;
```

**B. Cab rides at 2x / 4x** (`src/core/game.js` + `src/sim/transit.js`; tested on the copy, partial, see the table). `ride_patch.diff`:
```js
// game.js, replace `if (G.cutscene) { G.cutscene.update(dt); p.t += dt; }` with
if (G.cutscene) {
  const spd = Math.max(1, G.state.speed || 1), sub = G.cutscene.ride ? Math.min(4, Math.round(spd)) : 1, sdt = dt * spd / sub, sgm = gm / sub;
  for (let q = 0; q < sub; q++) { G.cutscene.update(sub > 1 ? sdt : dt); if (q < sub - 1) { if (G.scene.update) G.scene.update(sdt, sgm); for (const s of G.systems) if (s.update) s.update(sdt, sgm); if (!G.cutscene) break; } }
  if (sub > 1) G._sub = [sdt, sgm]; p.t += dt; }
// transit.js:81  G.cutscene = { update: rideTick, ride: true };
// transit.js:90  const sp = G.state.speed || 0, extra = r.kind === 'bus' ? 0 : sp >= 1 ? .5 : 1.5 - sp;
```

**C. Addresses match the story** (`src/sim/addresses.js`, in the `G.on('scene')` loop):
```js
const CANON = { 'door:home:grandma': '4 Thimble Street', 'door:home:sibling': '12 Sycamore Lane' };   // docs/story/CHAPTERS.md
... seen.add(t); p.address = CANON[p.id] || t; }
```
The buyable house "12 Sycamore Street" (`src/world/_blocks.js:34`, `src/data/homes.js`) then sits next to Nora's "12 Sycamore Lane": suggest renaming it (e.g. "The Gable House").

**D. `src/sim/story.js`** (another worker's file):
- line 86: `on('inv:change', () => { if (safe(() => G.state.inv.fridge.length, 0) >= 3) setc('fridge_stocked', 1); });` → `on('fridge:stored', () => setc('fridge_stocked', 1));` (inventory.js now emits it for the player's own groceries; the starter pantry has 10+ items, so "Eggs on Top" fired on arrival).
- `ambientTrack()`: skip `outside_before` / `outside_after` for 2 h after a pass-out: add `let lastOut = -1e9; G.on('passout', () => { lastOut = G.state.t; });` and guard `if (G.state.t - lastOut > 120 && n.hf >= 4.5 && n.hf < 6.5) setc('outside_before', 1);`.

**E. `src/sim/activities.js` wakeSummary** (the stray "null" on the wake card): in `m.body.append(...)` change the last conditional's `: null,` to `: '',` (`Node.append(null)` writes the text "null").

**F. `src/ui/phone.js:240`**: the `need_low` notify duplicates the new actionable toast; drop it, or keep it only for `critical`.

**G. `src/core/game.js` `onTap`**: `/^talk/i` → `/^(talk|say hello)/i`, so an unmet cast member is not talked to by a stray tap (I fixed the boss case from `_jobs_work.js`; other cast still say "Say hello").

---

## Decisions needed
1. Cab ETAs: apply patch B, then re-measure `CAB_V` from real rides, or base the estimate on the route.
2. Overnight morning summary: batch everything that arrives while you sleep into one "While you slept: N" notice (phone.js).
3. One notice per event: bills (reminder + Bay Bank + tip), "bills paid" (banner + toast).
4. The welcome dinner: after "Tomorrow instead?", actually reschedule it (story / chapter engine), and let the sister's house be a cab destination from day 0.
5. Bus: hide "Get off at next stop" until the stop before yours, keep the trip bar's stop count live, and do not offer "Get off here" at the wrong stop while "YOUR STOP IS NEXT" shows.
6. A cab that is waiting should get the guide arrow.
7. Bladder during long activities: stop at 0 like hunger, or leave it.
8. Inspiration fills too easily (QA5 A.2): not touched.

## Not tested
- The full intro on a real phone; sound.
- Patches A and B in the real tree (only on the 7799 copy); patch C, D, E, F, G not run at all.
- The beat-needs table on a real breakfast scene (API `G.story.complete`); the welcome dinner beat (never offered in play).
- Friend / story discounts with a real friend tier (no friend at that tier in the save).
- The cooking tip on a fresh day 1 (code path only), tips held during sleep for a real tip (simulated night only).
- The "among people" drain halving in isolation (seen only as part of the totals).
- Chapters: the gold Chapter marker at my building door (`crit1`) did not get in the way this round.

## Files changed
`src/scenes/rooms/airport.js`, `src/scenes/rooms/performance.js`, `src/scenes/rooms/natatorium.js`, `src/sim/intro.js`, `src/sim/intro_airport.js`, `src/story/intro.js`, `src/ui/goals.js`, `src/sim/inventory.js`, `src/sim/activities.js` (cook menu only), `src/data/needs.js`, `src/sim/needs.js`, `src/ui/jobs.css`, `src/ui/jobs.js`, `src/sim/_jobs_work.js`, `src/ui/shop.js`, `src/sim/_cityevents_fx.js`, `src/ui/minigame.js` (one-line hook), `src/ui/phone_tips.js`, `src/story/texts.js`, `src/sim/social.js` (check-in pick), `src/sim/_social_data.js` (typo), `docs/reports/qa_round6.md`.
