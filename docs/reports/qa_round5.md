# QA round 5 (Opus QA lane, 2026-11-15): a first week from New Game, then the newest systems

**Setup.** Headless Chromium at 390x844 with `hasTouch`. Taps were real touch taps (`touchscreen.tap`). Drags and pinches were CDP touch events.

The driver is a persistent page I sent commands to: `srv.mjs` + `p.py` + helpers. Scratch folder: `/tmp/claude-0/-home-user-Pixel-city-2/ab4bf52b-889a-5288-a866-29c2e55d0472/scratchpad/r5/`. Screenshots are in its `shots/` (a*–h*, g_*, ce*, hd*). Save files are `ck_d*.json`.

**What "played" means in Part A:**
- Every UI action was a tap at the element's screen position.
- In-world taps were made on screen points: doors, counters, people chips, the arrow tip.
- Long street walks (more than about 300 m) were driven by the pathfinder toward the arrow's target. That is the same move a tap on the ground makes, but without hand-picking a free point each step. Arrival taps were real.
- Where I used an API call, the line says so.

**Interruptions.**
- The browser page crashed once, on Day 4 at 13:43 (memory? no message).
- I replayed Day 4 from the 00:56 save.
- Days 5-7 were **not** played by hand (time). Their notification counts come from a time-skip with frozen needs (see A.3).

---

## Part A — the first week as a new player

**Character.** "Maya" (preset), traits Foodie / Curious / Early Bird, home Juniper Court (studio, Old Town, $160/week).

### Diary

#### Day 0 (Mon, from New Game, landing 14:00)

**Title → creator → traits → home picker.** All clear by finger.

**First notice: "Tip: Decorate mode".**
- It fires during the landing cinematic and covers the plane (`a05`). This is QA4 D26, still open.
- Rent of $160 is taken at once: $600 → $440.

**Plane: the biggest trap of the week (A1).**
- After "Your turn! Tap where you want to walk. Head for the door at the front", **every tap on the aisle sat me in a seat**: 5 out of 6 taps.
- Each sit is a "Sitting · 1h 21m" activity, and game time races while you sit.
- I left the plane at **16:13 instead of about 14:15**: two hours lost before the game had taught anything.
- The red hint arrow also eats taps (A2): it is a DOM element that sits exactly where you tap.
- At the edge of the screen, the arrow parks under the phone button (`b16`).

**Concourse.**
- Hint: "Step onto the moving walkway". The marker sits *beside* the belt. When you reach it, nothing happens; you have to guess to tap further along the belt.
- Hint: "tap a traveller to say hi". **Tapping a person does not talk.** Only the bottom "Talk"/"Traveller" chip does (by design, owner request). The hint teaches the wrong gesture (A3).
- The hint box sits on top of Nora's phone banner three times (`a19`, `b13`, `b27`). Her text is hidden behind "Bzzt! A text from your sibling".
- Gate seating also captured taps: 9 "Sit" picks in about 20 taps toward the tram.

**Messages and baggage.**
- Messages → Nora → reply: clear.
- Baggage: clear.
- The backpack opens by itself with only "Tap an item."

**Curb.**
- Caption: "Monday, **2:00 PM**". Real time was 18:20.
- Hint: "**Click** the ground to walk". On touch this should say "Tap".
- Hint: "Open the Taxi app". The app is called **MapleCab**.
- Hint: "tap Call Cab". The button says **"Request ride"**.

**Cab.**
- 18:44 → 20:25.
- Walt: "You are **four minutes early**". We were 6 hours late.
- Walt: "Rent is due every other Monday". The picker said "$160 / week".

**Arrival toasts.**
- Four toasts stacked, covering two thirds of the screen (`b36`).
- **"Eggs on Top — carry groceries home"** and **"Say Hi Back — talk to your first stranger"** were awarded without doing either (A4).

**Evening.**
- No direction until I opened "Goals 4/8": unpack boxes, check fridge, eat nearby, sleep. That list is good, but it is hidden behind a small chip.
- The **green front door sits next to the bathroom door**. My first try at the bathroom walked me out into the street.
- Fridge (A5): tapping the banana showed nothing. The Eat button renders **below the fold** (y 1069 on an 844 screen) under 55 empty slots. You must scroll the window to find it.
- The banana was "First dinner in the new city!" and gave Hunger +8.
- "Make a no-cook dish → Cheese & Tomato Sandwich" opens a *flip* mini-game for a sandwich. It worked; +30.

**Notifications, Day 0 → morning.**
- About 30 notices.
- **7 "New app" banners overnight**: Bay Transit, Pages, Roomy, Skies, Closet, Reel, Maple Post. Closet arrived before I owned any clothes.
- **Morning badge: "39 new notifications"** (`c02`).
- "Good night, Maple Bay." toast shown at 07:00 on waking.

**Needs at bedtime (00:52):** Hunger 44, Energy 35, Hygiene 92, Fun 60, Social 40, Bladder 70, Comfort 45, Outdoors 93, Inspiration 41.

**Money:** −$160.

#### Day 1 (Tue)

**Nana's breakfast.**
- Clear Planner card with "Take me there".
- Her message says **"4 Thimble Street, blue door"**. The map says **Nana's House · 208 Mill St** (A6).
- The breakfast scene is lovely, but **pancakes give no Hunger**: 31 → 27 after "Full of pancakes" (A7).
- "Breakfast at Nana's" stays in the Planner afterwards, still with "Take me there".

**Stale reminder (A8).**
- "Planner · Leave now … starts at 08:00 (in 17 min)" was re-shown 5 times between 07:43 and 08:41, after the event had started.
- Two banners showed at once ("Starting now" + "Leave now… in 17 min").
- This repeated all week for every Planner reminder, sometimes for 6+ hours. Days later it popped in a different season.

**Opportunities.**
- "Get your bearings" (Market Square). Reward "+$$".
- "Halo Donuts, still warm": "gone by half past nine", card says "until 11:00", and the shop was **3.9 km away**. An odd first offer.

**Jobs.**
- Jobs app → Board → Barista "Apply" → hired instantly. Very clear.

**Food.**
- Map "Where to? Food" is excellent: 7 places with distances and OPEN.
- Bean & Gone: muffin + avocado toast.
- The **20% staff discount** is never applied (A9).

**Groceries.**
- Map "Where to? Groceries" → Marchetti's.
- 90 ingredients with no hint which ones my recipes need.
- I bought oats + maple syrup for Nana's pancakes. **Bea's pancakes never appeared** in "can cook now" or "one short".

**Dez and the gym.**
- Dez: "Gym at 3:00 PM?" I tapped "I'm in!".
- Planner said "18 by cab". **The cab took 80 min (14:30 → 15:47).** Missed Dez entirely; no word from him.
- The gym needs a pass to do anything.
- Talked to a stranger with the Talk chip: Social 15 → 28.

**Cooking at home.**
- Egg Noodle Soup (flip game).
- **Inspiration jumped 60 → 97 in one cook** (4 new recipes, first cook…).
- The "Cooking at home: tap the stove" tip arrived *after* I had cooked. The same for the talking and bladder tips: tips arrive after the fact.

**Apps.**
- Installed 6 apps by tapping Get.
- Pages: a lovely reader. Inspiration +6.
- Circle: shows "Now: **Nora' house**" (QA4 D24 still open).
- Phone call to Dez: Social +14.

**Bed.**
- "Sleep until morning — **Wake at 07:00**". My shift starts at 07:00, and there is **no wake-for-work option** (A10).
- The game warned me at 06:30 / 06:40 while I was asleep.

**Needs at 20:29:** Hunger 64, Energy 43, Hygiene 99, Fun 94, Social 37, Bladder 74, Comfort 47, Outdoors 96, Inspiration 95.

**Money:** +$5 (opportunity), −$9 café, −$14 groceries, −$12.75 cab. Net −$30.75.

#### Day 2 (Wed)

**First shift, an hour late.**
- The barista shift is hard in portrait (A11):
  - the shift panel (210x320 px) covers the left half of the screen, **including the till**;
  - Marlow's "Say hello" sits on the till spot, so taps at the till open small talk with your boss;
  - customers "gave up waiting" 14 times.
- **Auto-work** is reachable only by scrolling the shift panel; its buttons sit at y 847 on an 844 screen.
- Paid $72.
- **Bladder hit 0** while auto-working.

**Stale story texts (A12).**
- At 13:00, after the shift: Nora: "when you're ready to job hunt…"
- Toast: "Hired! Check your Calendar for your first shift."

**Warp & Weft by finger.**
- Tapped a floor-cushion display → sheet → Buy → into the bag.
- At the counter, a rug → "delivered tomorrow at 09:00". That toast showed twice.
- Every rug is "Ambience +2", from $65 to $950.

**Decorate by finger.**
- The tray tile placed the cushion. A drag onto a blocked spot sprang back ("Something is in the way").
- A drag to free floor worked. Colour swap worked. The poster went onto the wall.
- Pinch zoom worked in design mode.
- Comfort level 48 → 50.

**Opportunity "Out to Gull Point".**
- Walked 2.2 km at 4x: 2 h 20 min of game time. Done.

**Cab fiasco.**
- The cab home **took 83 min to arrive** at Gull Point.
- I was not standing at it (my error). It waited 5 h 20 min, then "gave up".
- I passed out at 04:33: **Bayside Clinic, −$40**.
- "Achievement: Before the Emails — be outside before 6:30 AM" was awarded for collapsing at 04:33.

**Needs before the fiasco (17:39):** Hunger 36, Energy 52, Hygiene 54, Fun 99, Social 50, Bladder 61, Comfort 44, Outdoors 100, Inspiration 100.

**Money:** +$72; −$6.50; −$60 cushion; −$65 rug; −$40 clinic.

#### Day 3 (Thu)

**Bus home from the clinic.**
- It was a 1-stop ride. It needs "Get off at next stop" pressed in about 20 seconds.
- I missed it, and "Get off at next stop" then delivered me back to my starting stop (the ring went round).
- I cancelled and walked.

**Late to work again.**
- At 2x, a "6 min" walk costs 25 game minutes (A13). Walking time is real seconds, so every speed step doubles its game-time cost. At 1x I measured 8 game min for 570 m, so the estimates are right only at 1x.
- I played 4 tasks by hand (the drink-recipe game is good), then Auto-work.
- **Auto-work pays about the same as playing**: $66.50 at 95% auto vs $67.50 manual.

**Evening.**
- Needs crashed: Hygiene 0, Energy 4, Hunger 15, Social 18.
- Hygiene 0 drew a good stranger line: "Long day, friend? Smells like a long day."
- Showered, then "Sleep until rested" at 16:10 (woke 00:56).
- Slept through **Nora & Theo's welcome dinner**. It was put in the Planner without my accepting. The game handled it kindly: "No stress… Tomorrow instead?"
- **Theo signs "- J"** and other relatives send each other's lines (A14).

**Needs at 16:10:** Hunger 38, Energy 4, Hygiene 58, Fun 65, Social 18, Bladder 73, Comfort 45, Outdoors 89, Inspiration 95.

**Money:** −$1.50 bus, +$67.50, −$6.50.

#### Day 4 (Fri)

**Night.**
- Unpacked the rug box (one tap). Took out the cardboard. Tidied.
- Cooked Tomato Pasta.
- **Supplies "Running low: shampoo" arrived exactly once** (04:19). Good.
- The supplies window's "Take me to…" button was **white text on pale green**: unreadable (A15, **fixed**).
- Reel (a cartoon): Fun +1. Pages gives far more.

**Replay after the crash, and the second collapse.**
- Two "feet up" blocks at home took Hunger to 2.
- I passed out mid-cooking: **clinic again, −$40, shift missed**.
- "You missed your shift": one toast, no other consequence seen.

**Lunch with Dez.**
- Social was **1**.
- Dez's invite was Dot's Diner, 12:30, 5.6 km away. Took the Ring bus (real "Wait for bus 3" / "Get off at next stop").
- **Inside the diner an hour early, the arrow said "Exit → Dez"**, sending me to his depot (A16, **fixed**).
- Dez sat in a booth and the bottom chip offered "Linger a While", not Talk (A17). I talked to him via the API.
- Nora's chat contains Dez's line "CUZ. Saw you on Market St…" (A14).

**Needs at 13:26:** Hunger 37, Energy 78, Hygiene 71, Fun 86, Social 31, Bladder 53, Comfort 41, Outdoors 80, Inspiration 99.

**Money (replay):** −$40 clinic, −$2.50 coffee.

#### Days 5-7

Not hand-played.

### A.2 Need tuning (measured over 4.5 played days)

- **Inspiration does NOT drain fast.** It sat 83-100 from Day 1 on. New places, recipes, books and showpieces refill it far faster than −1.5/h drains it. A single first cook gave +37. If anything it is too easy; the "In a Rut" band never appeared.
- **Comfort** sits at 25-55 all week. That is the starter studio's level (45-54) minus time out. Two decor pieces moved the level 48 → 50.
  - **"Slept Soundly" (needs Comfort ≥ 80 at home) is unreachable for a new player in week 1.**
  - Comfort is the only gentle need that is permanently "middling".
- **Outdoors** is healthy (63-100) for anyone who goes to work or shops. Overnight indoors it drops about 10.
- **Social is the need that hurts.** It reached 1-18 on four days.
  - It is not refilled by family scenes (breakfast gave nothing visible).
  - Only work shifts (+30-40), phone calls (+14) and stranger chats (+9-13) moved it.
- The two clinic visits ($80) came from Hunger 0 and Energy 0. Both followed sleeping or "putting feet up" with low Hunger: nothing warns you before a long rest.
- The low-supply notice fired once, on day 4 (shampoo), not on the first clean. I never did a proper clean.
- **Opportunities:** 12 offered in 4.5 days, 4 accepted, 3 done by me + 1 automatically ("Freshen up", on showering).
  - Sources: story / place / need / people / event.
  - The donut (3.9 km) and "Coffee among people" (offered while I was in a menu, then "ignored") made the least sense.
  - Cards show no distance.

### A.3 Notification load

| day | notices (normal) | notices (low) | banners | toasts | Opportunity offers |
|---|---|---|---|---|---|
| D0 (intro + night) | about 15 | about 6 | about 14, including 7 new-app banners | about 25, including 4 stacked on arrival | 0 |
| D1 morning badge | 39 unread | | | | |
| D1 | about 20 | about 10 | about 18, of which 5 were the stale "Leave now" | about 30 | 3 |
| D5* | 5 | 16 | 1 | 2 | 2 |
| D6* | 5 | 10 | – | 1 | 1 |
| D7* | 9 | 9 | 2 | 2 | 3 |
| D8* | 10 | 5 | 9 | 3 | 2 |

\* Days 5-8 are a time-skip with frozen needs and the player idle (passive load only). "Today in Maple Bay" alone is 3-5 low notices a day.

**Overlaps seen:**
- intro hint over phone banners (3x);
- the stale Planner banner over the Reel header, the Wellness app and the HUD clock/needs (`ce5`);
- toasts over the morning sheet title;
- the arrival toast stack.

### Where a new player gets lost (ranked)

1. **The plane / airport seats.** Tapping toward the door sits you down. Two hours are lost before anything is taught. Fix: no "Sit" interactables on the plane during the walk-off; seat tap targets must not cover aisles.
2. **No wake-up for work.** "Sleep until morning" wakes exactly at shift start. Every shift this week started late.
3. **Walking at 2x / 4x costs 2x / 4x game time.** Every "Leave now / 6 min on foot" estimate is wrong at the speeds people actually use. Either scale walking with speed or make the reminders speed-aware.
4. **The stale "Leave now" banner** repeats for hours and covers the UI. You stop trusting banners.
5. **The fridge's Eat button below the fold**; recipes with no shopping list; Nana's recipe uncookable.
6. **Social collapses with no obvious fix.** Nothing says "call someone" until it is red. Family hangouts happen at fixed times, often missed while asleep.
7. **Cabs take 60-80 min** in game time, while the Planner says 18. A taxi that is here gives no arrow to it.
8. **Tips arrive after the act** they explain (cooking, talking, bladder, needs "red icons" on day 3).
9. **The shift UI in portrait** covers the till. Auto-work is hidden below the fold.
10. **39 notifications on morning one.** New apps arrive by night, in a heap.

**Suggestions for the tutorial / My Day designers:**
- Teach eat / wash / sleep with a *wake time* (sleep "until 06:15 for your shift").
- Show one "Next" line at a time (the Goals list is good but hidden behind a chip).
- Release apps when their system is first touched, not on a timer.
- Make family meals feed Social and Hunger.
- Have My Day show travel time at the current speed.

---

## Part B — newest systems

### B1 Goods + stores

**Played:**
- Warp & Weft by finger: display sheet → Buy → bag → home unpack; counter menu → delivery next day 09:00; box at the door → one tap unpacks.
- Voltaic, Copper Pan, Kestrel & Pine, Sleepyhead looked at in-game at 390 px and 1000 px (`out/shots/qa5_g_grid.png`). No art or overlap faults.
  - In portrait the entrance view is about 40% black void below the floor (the camera centres on the doormat). Kestrel shows bare floor at the door.

**Seen, not fixed:**
- Store sign "WARP & WEFT" reads "WARF" from the street (`d19`).
- Harbor Day's banner reads "HAREUR DAY".
- The inspect sheet stays open across `G.go` to another room (seen in a scripted hop only).
- Not tested by hand: TV / stereo / instrument / exercise goods used at home (the studio has none), and the arrow to a store counter.

### B2 Home design + Roomy + shipping

**Played by finger:** tray place, drag (blocked spring-back and a valid move), Colour, wall piece, pinch zoom in design mode.

**Through the API:**
- Kestrel two-seater order → Planner "Delivery: Kestrel & Pine (be in)" with "Leave now" and "In 30 min" reminders → out at 09:05 → "Bay Parcel: sorry we missed you" → next day "put inside your door".
- Save / load while design mode was open: loads clean, mode closed, the in-progress move kept.
- R key with a piece selected turns it (keyboard in the touch context).

**Not tested:** "Shop for the home" on a home computer (the studio has no computer; the code line exists in activities.js:454); Store / Sell / Undo by finger this round; try piece → cart; the flat-pack bolt game.

### B3 Needs / supplies / Opportunities

**Done:**
- Opportunities completed by real play: 3 (Get your bearings, Gull Point, Freshen up) plus Harbor Day (event moment) = 4. I did not reach 10.
- Reading a novel (book added via the API, then real "Read a Novel"): Inspiration +8.5 net in 1 h, Fun +4. It works.
- Supplies window: readability fixed (A15). One "Running low" notice.

**Not done:** "Slept Soundly" (not reachable in a starter home).

### B4 Last-metre guidance

**Fixed in navgoals.js:**
- The 13 goods stores had no arrow way out: "Exit to the street" was not a known exit.
- `tools/navcheck.mjs --only graph` and `--rooms all` (219 rooms) now report one failure only: `home:grandma` → attic. That ladder is hidden until Chapter 5/6 by design. I added its GRAPH link for when it is visible.
- The planetarium "landed in city" result depends on the time of day (you are walked out when there is no show); it passed on the second run.

**Played:**
- The Dot's Diner meeting case: led out of the meeting venue → fixed (A16).
- Bus trip arrows and the "YOUR STOP IS NEXT" banner.
- Arrows to a home, the café till and a shift's tasks.

**Not run:** council speaking, window 5, hotel ballroom / room, aquarium shows, closed-door fallback, save / load mid-objective, post-office window, city-event spot by arrow.

### B5 City events (real calendar via dev time-skip)

**Harbor Day (day 19, Summer 6):**
- Reached level 3 by the calendar; Dock Street closed at 15:30.
- Notices a / e / t / opp / s sent once each.
- Stall menu by finger: Kettle Corn $3.75.
- Firing desk by finger: rhythm game 0.94 → "The sky over the bay is yours", +$20, Opportunity done.

**River Walk Fair (day 26):**
- Ring Toss by finger: $2 → aim game → "You win: Teddy Bear!".
- **But the Ring Toss mini-game draws the basketball hoop and ball** (`ce8`): there are no rings or bottles.

**Harvest Festival (day 33) in a forced storm:**
- "Goes ahead in the rain. The cider is hot." notice.
- The parade was held 70 min, then started 10 min after the weather cleared. Correct.

**Calendar:** the moved small festivals are on the Direction update 20 days (data checked: Blossom Fest Spring 6-7, Boardwalk Summer 3-4, Harvest Fair Autumn 2-3, Fireworks Summer 10, Lantern Night Autumn 10, Winter Lights Market Winter 7/9/10/12/13).

**Not tested:** a bus route during a closure; Dragon Walk; the Blossom Parade day.

### B6 Dead-tap sweep (with the new core 1.6 fallback)

70 → 38 dead out of 3,566 interactables in 219 rooms; **30 after my fixes**.

**Fixed:**
- 8 "Take a seat" in the university lecture theatre (row 2). The gap behind it is 0.4 wide, so those seats now use the aisle in front.
- 4 goods corner sofas (the spot was inside the sofa; display sheets now have no spot and range 2.2). Re-tested: the sheet opens.

**Still dead (not my files):**

| room | label | count | notes |
|---|---|---|---|
| concerthall:hall | "Sit" | 24 | path ends 2.7-2.8 away; scenes/rooms concert hall |
| airport:terminal | "Sit" | 1 | 2.05 |
| natatorium | "Sit" | 1 | no path |

### University

Certificate job hook verified through the API:
- `cook` Pass → `jobBonus('cooking')` = 1; Distinction → 2.
- The line-cook board showed "cooking need 2, have 4, met".
- `job:shift:end` {pay 100} → "Certificate bonus: $10 on top of your shift."

**Not played:** classes, Registrar, clubs, closing walk-out (time).

### HUD money delta (lead's file)

- `.hud-deltas{position:absolute;right:0;top:36px}` (hud.css:37) puts "-$80" at y 44-64.
- The speed row `.hud-speed` is at y 51-77 at 390 px, so the delta draws over the 4x / 2x buttons (`h_delta`).
- Suggestion: `.hud-deltas{top:4px;right:calc(100% + 6px)}`. The delta then pops to the left of the money pill.

---

## Defects

| # | what | where | sev | status |
|---|---|---|---|---|
| A1 | Plane / concourse / atrium: taps on the aisle pick "Sit" (5 of 6 in the plane, about 20 in the airport). Sitting runs the clock: 2 h lost before leaving the plane. | airport.js / intro_airport.js / seat hit radius | high | Report. Hide "Sit" on the plane during the intro's walk-off; seat `hit` must not cover the aisle. |
| A2 | `.tut-arrow` eats taps: `#ui > *{pointer-events:auto}` beats `.tut-arrow{pointer-events:none}`. At the screen edge it parks under the phone button. | goals.css | med | Report. Fix: `#ui > .tut-arrow{pointer-events:none}`; clamp it clear of the HUD buttons. |
| A3 | Intro hint "tap a traveller to say hi": taps on people never talk. Curb hints say "Click", "the Taxi app", "Call Cab" (the app is MapleCab; the button says "Request ride"). Curb caption hard-codes "2:00 PM". Walt says "four minutes early". | intro_airport.js, story/intro.js | med | Report |
| A4 | Arrival awards "Eggs on Top" (carry groceries) and "Say Hi Back" (talk to a stranger) without doing either. "Before the Emails" is awarded on passing out at 04:33. | achievements / intro | low | Report |
| A5 | Fridge / backpack window: the item detail (Eat / Take) renders below the fold under 55 empty slots. | inventory.js | high | Report: put the detail above the grid or open it as an overlay. |
| A6 | Addresses: Nana "4 Thimble Street" vs map "208 Mill St"; Nora "12 Sycamore Lane" vs map "212 Oak St" (and "12 Sycamore Street" is another house). | story.js / texts.js | low | Report |
| A7 | Nana's breakfast ("Full of pancakes") gives no Hunger. Her recipe never shows as cookable or as "one short". | story.js g1_breakfast rewards; recipes | med | Report: add `needs:{hunger:45}` |
| A8 | **Phone banners are re-queued every time a menu opens and never expire.** "Leave now… (in 17 min)" was re-shown 5-6 times, for 6+ hours, over apps and the HUD. A Spring "Blossom Parade" banner appeared on Autumn 6. | src/ui/phone.js `pump()` | high | Report (lead file). In the interval: `if ((e.back=(e.back||0)+1)<=2 && G.state.t-e.t<30) queue.unshift(e); done();`. At the top of `pump()`: `while (queue.length && queue[0].pri!=='high' && G.state.t-queue[0].t>90) queue.shift();` |
| A9 | Job staff discounts ("20% off at Bean & Gone", Dot's, FreshWay) are never applied: `G.jobs.discount()` has no caller. | shop.js | med | Report: multiply the price by `G.jobs.discount(venueId)` |
| A10 | Bed: "Sleep until morning" wakes at 07:00 even with a 07:00 shift. There is no "wake in time for …". | activities.js bed menu | high | Report |
| A11 | Barista shift in portrait: the shift panel covers the till. Marlow's "Say hello" overlaps "Take Order". Auto-work / End shift sit below the panel's fold (y 847). Marlow and Walt stay "Stranger" after 3 shifts. | _jobs_work.js / jobs UI | med | Report |
| A12 | Story texts ignore state: "when you're ready to job hunt" and "Hired! Check your Calendar for your first shift" arrive after the first shift. | story / texts | low | Report |
| A13 | Walking at 2x / 4x costs 2x / 4x game minutes, so Planner "Leave now" and ETAs ("6 min on foot", cab "18 min" when the real wait was 80) are wrong. Cab pick-up waits of 60-83 min. | nav / planner / taxi | high | Report (design) |
| A14 | The family text pool is shared: Nora sends Dez's "CUZ…" and Nana's "Love Nana" soup line; Theo signs "- J". | story/texts.js `family:` | med | Report: tag lines by sender |
| A15 | All `.win` "go" buttons (Start the day, Buy, Cook it, Eat now, supplies "Take me to…") were **white text on #c8ecc0**. | furnish.css (global `button.go`) + hud.css `.win .go` | high | **Fixed:** `.win button.go{color:var(--ink)}` (seen: Buy · $448 now dark on green) |
| A16 | A meeting at a place: inside the venue before the friend arrives, the arrow sent you out to wherever they were ("Exit → Dez"). | navgoals.js meet | med | **Fixed** ("… is on the way, wait here"). Build passes; **not re-played**. |
| A17 | A friend seated in a booth cannot be talked to: the bottom chip prefers "Linger a While". | chip ranking (hud / game) | med | Report |
| B1 | 13 goods stores: no arrow route out ("Exit to the street" unknown to the graph); 26 navcheck fails. | navgoals.js GRAPH | med | **Fixed** (navcheck all: one expected fail left) |
| B2 | 8 lecture-theatre seats dead (row 2 spot inside row 3) | scenes/rooms/university.js | med | **Fixed** (sweep) |
| B3 | 4 goods corner sofas dead (spot inside the piece) | sim/goods.js | low | **Fixed** (sheet opens from the door) |
| B4 | 26 "Sit" still dead (concert hall 24, airport terminal 1, natatorium 1) | room files | low | Report |
| B5 | Ring Toss draws the basketball hoop | cityevents / minigame aim theme | low | Report |
| B6 | Money delta over the speed buttons | hud.css:37 | low | Report (fix above) |
| B7 | Stale crowd lines in the wrong place: "Forty years I've walked this street" (airport); "Waiting for the bus?" (fireworks crowd) | _crowd_lines | cosmetic | Report |
| B8 | "Nora' house" (QA4 D24) still in Circle | src/world | low | Report |
| B9 | The game saved inside the home but Continue resumes outside the door (by design in title.js). On a phone that means "always wake up in the street". | title.js | decision | — |
| B10 | Groceries (chicken, bread) went off after about 2.5 days in the fridge despite "keeps 4x longer in the fridge" | inventory / food decay | low | Report (not investigated) |

## Files changed

- `src/ui/furnish.css`: `.win button.go{color:var(--ink)}` (A15).
- `src/sim/navgoals.js`:
  - GRAPH `[/^int:goods:[^:]+$/, /^Exit to the street$/, 'city']` and `['int:home:grandma', /^The attic ladder$/, 'int:home:grandma:attic']` (B1).
  - meet resolver: wait in the venue (A16).
- `src/sim/goods.js`: gdisp interactable `spot: null, range: 2.2` (B3).
- `src/scenes/rooms/university.js`: seat spots for a row blocked behind (B2).
- `docs/reports/qa_round5.md` (this file).
- `node tools/build.mjs` passes. `navcheck --rooms all`: one expected failure (the gated attic). Sweep: 30 dead, none in my files.

## Decisions needed

1. Should walking time scale with game speed, or should ETAs and reminders account for speed?
2. A wake-for-commitments bed option.
3. Auto-work pay (about 99% of manual).
4. Rug and decor ambience flat at +2 regardless of price.
5. Comfort / "Slept Soundly" are unreachable in a starter home.
6. Inspiration is too easy to fill (rather than too fast to drain).
7. Continue resumes outside the door.
8. App release by timer: 7 apps on night one.

## Not tested

- Days 5-7 by hand.
- Ten Opportunities.
- TV / stereo / instruments at home.
- Shop for the home on a computer.
- Flat-pack bolt game.
- Undo / Store / Sell by finger.
- Most navgoals not-run cases.
- Dragon Walk, Blossom Parade day, a bus during a closure.
- University classes, Registrar, clubs, closing walk-out.
- The re-play of the A16 fix.
- Chapters (landed mid-round; only seen: the Chapter 2 card at my building door, which took my door taps twice).
- Real phones and sound.
