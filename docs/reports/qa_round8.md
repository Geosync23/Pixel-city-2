# QA round 8 (Opus QA lane, 2026-11-15): a real first three days, university leftovers, performance

**Setup.** Headless Chromium 390x844, `hasTouch`, the round-7 persistent driver (`srv.mjs` + `p.py`, port 7811, source build, a server-side overlay available but not used for game files) and `perf.mjs` (CDP 4x CPU throttle) on single-file builds. Scratch: `/tmp/claude-0/-home-user-Pixel-city-2/ab4bf52b-889a-5288-a866-29c2e55d0472/scratchpad/r8/` (saves `d1_0844.json`, `d1_1410.json`, `d2_0700.json`, `d2_uni_enrolled.json`, `d3_wake.json`, `pre_prac.json`, `post_proj.json`, `mid_lecture.json`, `mid_final.json`; recorders `mon.js` (first-time windows, notices, things competing for the screen), `rec.js`; perf `perf_*.txt`). Screenshots: `out/shots/r8_*.png` (all looked at).
**What "played" means.** "Touch" = `touchscreen.tap` at a screen point I chose from what was on screen (the button, the bed, the door, the arrow). "Walked" = for a few long street walks I let the pathfinder walk to the arrow's point (the same as one long ground tap) because my short tap-steps were far slower than a person; said where. "API" = a direct call, named. No dev mode, intro not skipped, Chapter 1 played once and nothing beyond it.
`node src/data/validate.mjs` passes, `node tools/build.mjs` passes, `node tools/navcheck.mjs --rooms all`: all audit rows pass; the only failure is still the Chapter attic (`home:grandma -> home:grandma:attic`). Zero page errors in every run.
**Game speed note.** "1x" runs about 4 game minutes per real second, so several things below that look slow in game time were seconds in real time.

---

## Part A: the first three days by touch

### Diary (condensed per game hour; everything was tapped unless said)
**Day 0 (Mon)**
- 14:00-14:52 airport. Plane, concourse, tram, baggage, customs: the intro hints work. Problems: (1) the tutorial arrow for "Step onto the moving walkway" floated 130 px above its floor spot, i.e. **on the player's own head** (`r8_i8`); tapping the arrow did nothing; (2) the same for "Your bag is on the belt! Tap it": the arrow hung over a black pillar 150 px above the yellow bag (`r8_i10`). **Fixed** (goals.js, below). (3) "Open Messages..." / "Open the MapleCab app" bubble covered the phone's own header: the Chats/People tabs and the ride card's destination line (`r8_i5`, `r8_i15`, `r8_i16`). **Fixed** (goals.js/.css). (4) The hint jumped to "Open the MapleCab app" while Nora's four new texts were still unread; Nora's reply chips offered "Made it! Got my keys." before you have keys (`r8_i13`; intro, not mine).
- 14:53-15:33 arrival + free cab: banner "New app: Nestly" during the intro hint; "Your MapleCab is here" as banner AND toast with the same words; at the kerb two toasts "You have arrived: Juniper Court" and "Arrived: Juniper Court - ride pre-paid". Ride estimate exact (15:31 est, 15:32 actual). "Pick your home, then tap Request ride" card says "You pay when you arrive" next to "Free - prepaid".
- 15:33-15:45 Walt and Manny dialogue (12 taps), into the flat. "New app: Circle" banner shown twice (15:33, 15:35). "New stamp: Decorate Your Home" before decorating anything.
- 15:45 **first window: Wander** (header said "First time · The Stamp Book" for a window about Wander: **fixed**, header now "Wander"). Opened Wander: quick tools fine, but the "Fix a need" tile line was cut to "Lowest: Hunger ..." (`r8_d0_wander1`): **fixed**. Fun right now list good.
- 15:57-16:54 unpacked the three boxes by tapping them. Toast "Unpacked! A lamp, a mug, a blanket" after boxes that held a radio, an umbrella and postcards; "Unpacked: Flannel Pajamas, Poster Set, The Lighthouse Keeper's Cat. Tap Decorate to place it." (not mine).
- 17:16 My Day button: the 3-step walk-through is clear. Took "Get your bearings". **"Somewhere new: Cat Alley / Cat alley you have not been to"**: **fixed** ("Cat alley · not been yet"). The taken Opportunity was invisible: the To do section was folded because the three finished airport goals pushed it over 6: **fixed** (folds by what is still open). Closing the sheet, **the Opportunity window jumped up at once and ate my next tap** on the My Day button; and it said "That was an Opportunity... Take it or leave it" an hour after I had taken it (`r8_d0_md5b`). **Fixed both** (6 s quiet after any sheet / phone / banner; wording true either way).
- 17:22 "Check the fridge": toast "Empty. One lonely ketchup packet. Not even yours." while the fridge holds 17 starter items (story/intro.js:225; Nana later says "Your kitchen has a starter cupboard").
- 17:55 stove: window "Cooking at home" (fine). Cooked egg fried rice; the cooking mini-game ran unplayed (my recorder did not watch it), stamps "Play a Mini-Game" + "Cook".
- 18:41 tapped Leave: **window "Your first stamp" popped while I walked to the door and the walk was dropped**; it was my 8th stamp (`r8_d0_stampftw`). **Fixed** (no waiting window while walking to something; title "Collecting stamps").
- 18:53-21:39 walked to Market Square by taps. My tap-steps near a doorway twice took me back in through the door I had just come out of (and into a barbershop and a lobby): the door tap target is ~140 px around the door; when you stand on its mat almost any tap is "go back in". Round 7 fixed this for home stairs only; **lead patch 2 below** generalises it. 20:14 in the barbershop: window "Mini-games: ... a short game like that one" two hours after the cooking game: **wording fixed**.
- 20:16 toast "Need the loo. Tap the Bladder bar to find the nearest restroom": tapping the Bladder bar opened the whole wellness panel (not the restroom list), the game kept running, the TO DO chip and the nav arrow's label drew over the panel's header, and band words were cut ("Connec...", "Need..."): `r8_d0_bladder`. **Fixed** (a low meter opens "where can I fix this?" directly; chip/arrow hidden under the panel; band words wrap).
- 21:33 restroom list -> Home -> route card: window "The Map knows the way" over the route card; after "Got it" the route card was gone and the Map stayed open (dead end, had to pick Home again). After choosing WALK the Map stays open: the arrow is only seen after closing the phone yourself (navigator, not mine: question below).
- 22:02-23:31 home, toilet, 22:41 window "Running low" (energy/hygiene really low then: fine), shower, 00:20 bed (first two taps on the mattress failed: see below).
- **Day 0: 7 first-time windows (5 waiting + 2 "now"), 9 banners.** Moments where two things shared the screen: banner+tip arrow 14:28, toast+arrow 14:50, banner+toast+arrow 15:07 (cab), toast+dialogue 15:33, banner+toast+arrow 15:33 and 15:35.

**Day 1 (Tue)**
- 00:40 window "When nature calls" two hours after the loo was sorted (Bladder 90): **fixed** (needs windows wait until that need is low again).
- 01:28-08:44 slept ("Sleep until rested"). On waking, the two going-to-bed toasts ("The game saves when you sleep. Sweet dreams." / "Good night, Maple Bay.") appeared at 08:44, after waking (not mine).
- 08:47 Good morning banner + Chapter 1 toast + Opportunity banner. The morning line ended "...Chapter 1 · Breakfast at Nana's is there whenever" and was cut by the 2-line banner: **fixed** (Chapter first, shorter free line; tested on day 2 and 3: "Chapter 2 · The Long Way Round, whenever you're ready. Nothing else is on your day. Three ideas, like ...").
- The chip said "TO DO Breakfast at Nana's (Old Town)" (a story to-do duplicating Chapter 1) and the gold STORY line never showed: **fixed** (an open Chapter comes before to-dos; `r8_d1_load2`).
- 09:11 window "Talking to people" arrived the instant I closed a banner and ate my chip tap: **fixed** (banner close counts for the 6 s quiet).
- 09:13 gold Chapter row -> "Follow the gold marker", walked 540 m by taps. At "Nana Bea's blue door" the arrow ends; **tapping the door goes inside an empty house: no Nana, no arrow, no Chapter** (`r8_d1_nana`). The Chapter starts only from the gold signboard beside the door. Chapters worker: please start the Chapter from the door too, or put the marker on the door.
- 11:14 window "What do you like?" appeared exactly as I tapped the gold marker (tap eaten; fixed by the walking rule). Chapter 1 card -> Begin -> 40 dialogue taps, wash hands, the pancake flip game (missed, "a map of somewhere"), the chair, the ladder ("Not today"), done 13:55: "CHAPTER 1 · DONE" card. 14:07 window "That was a Chapter". During the Chapter: "Getting hungry. Eat something from your fridge at home" toasts at Nana's table, and Theo's "Family lunch! Slice of Heaven, 12:30" invitation landed in the middle of Chapter 1 (missed).
- 14:39 My Day: added Lamp Lighting at Gull Point 18:00 ("leave by 17:24"). Shelf "How things work here" -> Groceries -> "Take me to Old Town Market" -> route card -> Walk. 14:53 window "A new app is out". 16:32 market: groceries window, bought onion, carrot, eggs, tomato (stamp "Eat Street Food" for buying an onion).
- 17:19 **"My Day · Leave now ... starts at 18:00 (in 41 min)" is a sticky banner and stayed on screen until 21:07**, three hours after the event (`r8_d1_leavenow`); the queued "Starting now: ... has started" then showed at 21:29. Same on day 3: "Starving!" sticky banner up after eating. **Lead patch 1** (phone.js).
- 21:07 tapped the low Bladder bar -> restroom list directly (my fix, new code loaded) -> Home -> walked home, toilet; 22:37 window "You have post" on entering the bathroom (ate the toilet tap); cooked porridge, slept 23:30 -> 07:00.
- **Day 1: 7 windows (6 waiting + 1 "now"; the waiting cap of 6 was reached at 22:37), 13 banners.**

**Day 2 (Wed)**
- 07:00 Good morning (new line), Chapter 2 toast says the same thing again.
- 07:11 tapped the mattress: the **clothes rail opened instead** ("Wardrobe"); the Juniper Court bed's tap point sits at its left corner (~80 px from the mattress centre) so the rail wins. Window "Your dresser" over a menu titled "Wardrobe": **title now "Your clothes"**.
- 07:12 Jobs app: window "Finding work: These are a few starter jobs" over a "No job yet" page: **wording fixed** ("The Board tab has a few starter jobs").
- 07:18 Shelf -> University -> CAB ($25.75). The cab dropped me 490 m from the University door ("walk to the door"), and the toast said "Taxis go door to door, any hour". 08:11 "Getting better", 09:11 "Food goes off" windows.
- 09:24 University: window "The University", Registrar by the name button, Enrol > Bay Ecology: **both sections were labelled "Morning section"** (both 11:30, Tue&Fri / Wed&Sat): **fixed** (same-hour sections go by their days).
- 11:26 lecture theatre: my seat tap 120 px from the doormat **walked me back out to the hall** (door tap target, lead patch 2), back in at 11:41: window "You are enrolled" arrived as I hurried in (tap eaten): **fixed** (no waiting window from 20 min before to 20 min after a timed entry). Seated at 12:00: class missed (professor's note, fine).
- 13:13 chip "NEXT 11:30 Bay Ecology: Lecture 1" on Wednesday afternoon for Saturday's class: **fixed** ("Sat 11:30 ...").
- 13:40 low Bladder -> list offered Symphony Hall 600 m, not the University Commons restrooms next door (navigator `find`, not mine); NPC speech bubbles covered the player in the concert hall foyer. 14:4x Hunger list also missed the Commons cafe.
- 15:53 Sunnyside Cafe: on entering, the arrow ("eat here: order") was gone; ordered by finding the counter myself. 17:18 window "Eating out".
- 17:52 MapleCab home ($27.25). 19:10 **tapping my own front door opened the Chapter 2 card** (its gold marker stands on the door, "Dez knocks off at dark"). 19:18 window "A habit became a trait" 3.5 h after the trait (does not name it). Shower: tapping the shower glass gave the sink twice (tap targets overlap at that camera). Slept 20:19 -> 07:00.
- **Day 2: 8 windows (4 waiting + 4 "now"), about 17 banners.** Phone badge reached 98 unread.

### Counts
| day | first-time windows (waiting + now) | banners | moments two or more things shared the screen |
|---|---|---|---|
| 0 | 7 (5 + 2) | 9 | 6 (intro arrow + banner/toast; cab banner + toast) |
| 1 | 7 (6 + 1) | 13 | 4 logged + the sticky Leave-now for 3 h |
| 2 | 8 (4 + 4) | ~17 | 5 (banner + toast pairs) |
Windows that arrived at a bad moment (before fixes): 7 (opps after closing My Day, stamp mid-walk, talk on banner close, interests on the Chapter marker tap, uniclass while late for class, mail on the toilet tap, bladder after the fact). Untrue / stale texts: 9 (listed above). Dead or wrong taps: mattress -> rail, front door -> Chapter card, shower -> sink, doormat taps -> back out (several), My Day button under a fresh window.

### Part A fixes (my files)
- `src/sim/firsttime.js`: a waiting window now also waits 6 real seconds after any sheet, phone or banner goes away (`UI_QUIET`), while the player walks to something (`moving`), and from 20 min before to 20 min after a timed My Day entry (`due`); needs windows (`bladder`, `needs_tap`, `needs_soft`, `fun_ways`) only while that need is still low; a window may name its own header (`head`). Rush mode (tests) skips all three.
- `src/data/firsttime.js`: opps, stamp ("Collecting stamps"), sk_minis, dresser ("Your clothes"), jobsboard wording; `wander` header "Wander".
- `src/ui/goals.js/.css`: tutorial arrow height 1.3 for plain spots and props (2.7 kept for doors/characters/explicit `h`); with the phone open the intro bubble goes to the bottom unless its target is down there.
- `src/ui/hud.js/.css`: tapping a low / critical need meter opens its "where can I fix this?" list; the My Day chip and nav arrow hide under the wellness panel; band words wrap on phones; the tap-name button shrinks and wraps to two lines instead of "...208 M...".
- `src/ui/myday.js`: chip shows an open Chapter before to-dos; the next entry's day ("Sat 11:30", "Tomorrow 09:00"); To do folds by open items.
- `src/sim/myday.js`: "Somewhere new" line; the morning line puts the open Chapter first.
- `src/ui/phone_guide.css`: quick-tool tile lines wrap.
Re-tested after the fixes on the live game: the bladder list from the meter (twice), the morning line (days 2 and 3), the chip with the Chapter and with "Sat 11:30", the windows waiting while walking / after banners (no eaten taps after the reload), the arrow heights not re-run on the airport (the intro was behind me; checked by reading the targets: spots are plain `{x,y}`, the bag has a sprite).

---

## Part B: university leftovers (Bay Ecology, Wed & Sat 11:30)
- **Played by touch:** enrol at the Registrar; the **reading** at a Reading Room desk ("Field Notes of Maple Bay, part 1", check question, +44 xp); the **practical** at the pond deck (pond dipping sort game, C grade); the **project** at the pond deck ("A species list", 0.71); the **final paper in exam week** (Fri day 11, 10:00, eight questions, 61% Pass, certificate). **API between pieces:** Lecture 1 and Lecture 2 marked passed (`debug.pass`), time advanced with needs topped up, teleported to the quad twice, and the reading flag restored once after I reloaded an older save.
- **Mid-class load (round-7 open item): fixed, "count it attended".** `creditInterrupted()` in `src/sim/university.js` runs after a game is continued: if you were sitting a class when the game was saved and it is still within its time, a lecture counts (half participation marks, 60% xp) and a practical counts at 0.6; the professor's notice says "You were in Lecture 2 when you stopped for the day. It counts: you are down as present. Next: Fri 10:00." A final never counts this way: "Your final was interrupted ... It does not count as a try: sit it at your next class." The counted slot is not offered again (`doneT`), so you are not asked to sit the final in the slot you were just in. Tested with real saves made mid-lecture (`mid_lecture.json`) and mid-final (`mid_final.json`): unit, notes, next class, planner entries and no "missed" afterwards all as described. The practical path is the same code, not loaded mid-practical.
- **Also fixed in university.js:** (1) every load added a second class entry to My Day (the University's `load` handler ran before the planner's and could not find its own entry): three "Lecture 1" rows by day 3; now it waits for the planner and clears leftovers (old saves cleaned on load, tested on two saves); (2) a sticky "Leave now" banner appeared while I stood at the pond deck for the practical: being on the quad now counts as there; (3) "Project handed in ... You can sit the final now" while Lecture 2 was still to come: now "Your coursework is in: after your last lecture comes the final."; (4) section names (Part A).
- Seen, not mine: the pond game shows the same potted-plant picture for every item (a dragonfly nymph too); Campus app "Take me there" from inside the hall opens the Map with a "WALK 1 min, 10 m" card before the arrow appears; "In 30 min" banner shown 11 min late with the old wording; NPC line "You look like a sunny Saturday morning" on a Thursday.
- Not run: rain / winter pond class, study group, scholarship, graduation, a lecture played through by touch this round (round 7 did one).

---

## Part C: performance (4x CPU throttle, dist builds, 390x844)
Load average on the machine was 4-6 (other workers' browsers), so fps / p95 / worst move by +-10-20% between identical runs: the first two columns are the SAME build ("before" run twice) to show the noise. The trustworthy measure is the profiler's self time of the targeted calls (walk 3 districts / Fjord / parade / unpainted ground).

| scene | before (run 1) fps · p95 · worst · >50/>100 ms | before (run 2) | after (my changes) | after + kit.js patch 3 |
|---|---|---|---|---|
| idle city, night, Old Town | 54.1 · 33 · 67 · 1/0 | 58.4 · 17 · 67 · 1/0 | 55.3 · 33 · 50 · 1/0 | 48.2 · 33 · 83 · 3/0 |
| walk 3 districts, 1x | 49.4 · 33 · 433 · 69/10 | 47.2 · 33 · 383 · 103/24 | 43.6 · 50 · 383 · 131/27 | 45.4 · 50 · 317 · 119/28 |
| walk at 4x | 44.0 · 50 · 117 · 12/1 | 32.2 · 83 · 167 · 39/6 | 32.6 · 67 · 150 · 42/4 | 32.4 · 67 · 117 · 36/1 |
| big-box store (Fjord) | 58.7 · 17 · 200 · 2/1 | 50.5 · 33 · 400 · 10/4 | 54.0 · 33 · 217 · 9/1 | 54.2 · 33 · 417 · 3/1 |
| parade (304 ents) | 51.0 · 33 · 400 · 3/2 | 41.4 · 50 · 433 · 18/3 | 41.6 · 50 · 517 · 17/5 | 40.3 · 50 · 533 · 20/3 |
| winter snow walk | 42.0 · 50 · 250 · 42/12 | 41.5 · 50 · 217 · 54/14 | 42.6 · 50 · 300 · 52/13 | 45.9 · 33 · 233 · 45/12 |
| unpainted ground (first visit) | 41.4 · 50 · 333 · 64/19 | 38.4 · 50 · 317 · 98/17 | 42.7 · 50 · 333 · 81/13 | 44.1 · 33 · 367 · 55/15 |

Profiler self time (share of busy time), before -> after -> after + kit patch:
| call | walk 3 districts | Fjord | parade | unpainted ground |
|---|---|---|---|---|
| `getBoundingClientRect` | 2.6-3.2% -> 3.5% -> **0.5%** | 0.9-1.5% -> 1.0% -> **0.3%** | 2.7-2.8% -> 4.1% -> **0.8%** | 3.7-4.7% -> 4.6% -> **0.7%** |
| `G.nearestInteractable` | 1.3-1.4% -> **0.4%** -> 0.6% | 0.3% -> under 0.2% | 0.8-0.9% -> under 0.4% | 0.8% -> under 0.4% |
| `getContext` | 1.2% -> 1.1% -> 1.3% | 0.4-0.5% -> 0.2% -> 0.5% | 1.0-1.2% -> 1.2% -> 1.0% | 1.8-2.2% -> 2.1% -> 1.8% |

What was found and done:
- **Layout reads:** counted by stack on a city walk (6 s, 361 frames): `ui/kit.js:33` (speech bubbles) **358**, `ui/hud.js:157` (toastsClear, already 0.15 s) 38, nothing else per frame. navarrow already reads rects every 12th frame. So the cost is kit.js `bubble()`: it writes `left/top` and reads its rect every frame per bubble (a forced layout). **Lead patch 3** measures once; with it the share drops ~5x. Same positions: the clamp maths uses the first measured width and the same 6 px margins (the text never changes).
- **`getContext`:** `engine/render.js` fetched the night-tint and light buffers' contexts twice a frame: now cached at construction (`src/engine/render.js`, the canvases are only resized). The remaining `getContext` time is `engine/sprites.js:7-8`, one call per newly baked sprite (258 in 6 s while walking); that is sprite creation, not per frame, and stays.
- **`nearestInteractable`:** `src/ui/hud.js` runs the scan only when the player moved more than 0.2 tiles, the scene / busy / modal state changed, or every 6th frame (NPCs walking into range). The prompt can lag by at most ~0.1 s. Share 1.3% -> 0.4%. Core's scan itself is unchanged (no spatial grid: that is game.js).
- **Ground / sprite painting hitches (300-700 ms):** still there (worst frames above). They come from new chunks and sprite baking; `maxNewChunks` is already 2 per frame, and lowering it shows bare ground at the screen edge for a few frames (a visual change), so not done. Suggestion for the engine owner: pre-warm the chunks around a destination during the walk's first seconds, or bake new NPC sprites on idle frames.
- **fps:** no measurable change at this noise level; I do not claim one.
- **No visual change:** before/after screenshots of three scenes (night city with lights, day city, the Fjord store): `out/shots/r8_vis_1_city_night.png` (left before, right after), `r8_vis_3_store.png`; buildings, light pools, night tint and UI are identical; the differing pixels (16% city, 1.5% store) are the people and cars, who are elsewhere in each run. Zero page errors in all eight runs.

## Patches for lead-owned files (exact)
1. **`src/ui/phone.js` pump()**, sticky banners went stale for hours ("Leave now ... in 41 min" at 21:07; "Starving!" after eating):
   - `while (queue.length && queue[0].pri === 'high' && G.state.t - (queue[0].t || G.state.t) > 240) queue.shift();` -> `... > 60) queue.shift();`
   - `showing = b; bannerBox.append(b);` -> `showing = b; const shownAt = performance.now(); bannerBox.append(b);`
   - in the same line's interval: `/* a menu opened over it: take it back, show it again after */ else placeBanners(); }, 400);` -> `/* a menu opened over it: take it back, show it again after */ else if (sticky && G.state.t - (e.t || G.state.t) > 45 && performance.now() - shownAt > 20000) done(); else placeBanners(); }, 400);`
   Not run (phone.js is not mine).
2. **`src/core/game.js` pick()**, standing on a door's mat any tap ~140 px around went back out (lecture theatre, home, shops):
   `if (isDoor(it) && !(it.homelink && Math.hypot(it.x - G.player.x, it.y - G.player.y) < 3.5)) {` -> `if (isDoor(it) && !(Math.hypot(it.x - G.player.x, it.y - G.player.y) < (it.homelink ? 3.5 : 1.6))) {   /* QA8: on a door's mat, a tap nearby is not 'go back out' */`
   Not run.
3. **`src/ui/kit.js` bubble()** (perf: one forced layout per bubble per frame; 358 reads in 361 frames on a city walk):
```js
export function bubble(target, text, ms = 2800, cls = '') {
  const b = el('div.bubble' + (cls ? '.' + cls : ''), { text }); root().append(b); const t0 = performance.now(); let half = -1, ox = 0;
  const upd = () => { if (performance.now() - t0 > ms || !b.isConnected) { b.remove(); G.off('frame', upd); return; } const s = G.toScreen(target.x, target.y, (target.z || 0) + (target.bubbleH || 1.9));
    if (half < 0) { b.style.left = s.x + 'px'; b.style.top = s.y + 'px'; const r = b.getBoundingClientRect(); half = r.width / 2; ox = r.left + half - s.x; }   /* QA8: measured once (the text never changes): no layout read every frame */
    const dx = Math.max(6 - (s.x + ox - half), 0) + Math.min(innerWidth - 6 - (s.x + ox + half), 0); b.style.left = (s.x + dx) + 'px'; b.style.top = s.y + 'px'; };
  G.on('frame', upd); upd(); return b;
}
```
   Measured in a scratch copy of the tree (column "after + kit" below), not in the repo.
4. Round 7's patches 3-5 (social.js computeLoc, phone.js bills line, round-6 C-G) not re-checked.

## For other owners (seen, not changed)
- Chapters: the Chapter 1 door leads into an empty house (start from the door too); the Chapter 2 marker stands on the player's own front door and catches taps meant for it; the chapter toast repeats the morning banner.
- Intro (story/intro.js, sim/intro.js): fridge "Empty. One lonely ketchup packet" with 17 items inside; "Made it! Got my keys." offered before the keys; sleep toasts shown on waking; the unpack toasts' contents.
- Navigator: Bladder / Hunger lists skip the University Commons; after choosing WALK the Map stays open; the restroom chooser's route card vanished after the Map window's "Got it"; the arrow is gone on entering a cafe chosen from the Hunger list.
- Homes: the Juniper Court mattress tap point at its corner (the clothes rail wins); the shower and the sink overlap.
- Notices: "Your MapleCab is here" banner + identical toast; two arrival toasts; "New app: Circle" banner twice; stamps "Decorate Your Home" and "Eat Street Food" given for something else.

## Decisions needed
1. Windows: three days gave 7, 7 and 8 windows (the waiting cap of 6 was reached once). With the new quiet rules they come later and more often on entering a room. Is 6 waiting a day still right, or 4 for the first three days?
2. Should choosing WALK / BUS on the Map route card close the phone so the arrow is visible at once?
3. Sticky "Leave now" / "Starving" banners: auto-dismiss after 45 game minutes and 20 real seconds (patch 1), or end them when the event starts / the need is fixed?
4. Mid-class load: I chose "count it attended" (a final never counts). OK, or would you rather be put back in your seat?
5. Banners: 9-17 a day plus 98 unread on the phone by day 2 evening. Fewer "New app" banners (they were 6 of the day-0/1 banners)?

## Not tested
Real phone, sound; the lead patches in the tree; the practical loaded mid-way; the rain pond class; a whole lecture by touch this round; days beyond 2 by touch; Chapter 2 and later (not allowed); landscape.

## Files changed
`src/sim/firsttime.js`, `src/data/firsttime.js`, `src/ui/goals.js`, `src/ui/goals.css`, `src/ui/hud.js`, `src/ui/hud.css`, `src/ui/myday.js`, `src/sim/myday.js`, `src/ui/phone_guide.css`, `src/sim/university.js`, `src/engine/render.js`, `docs/reports/qa_round8.md`.
