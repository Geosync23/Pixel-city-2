# First evening rework (owner playtest list, 2026-11-18) — worker report

## Progress
- [x] 5. Sandwich mini-game once per meal. `src/sim/skillplay.js` ck_build `rounds: 3 -> 1`. Played in the build: one round, 4 taps, then "is ready! Eat now".
- [x] 1. Unpacking boxes / suitcase: no mini-game. `src/data/minigames_b.js`: `unpack_boxes: 'unbox'` removed from ACT_GAME_B (the unbox game stays in the kit, `G.mgB.demo('unbox')`). Played: 3 boxes + suitcase, plain 20-min action, "Unpacked: ..." toast.
- [x] 2. To-do tap -> guide arrow; "Unpack" auto-selected on arrival, then the suitcase, then on down the lesson. NEW `src/sim/first_evening.js` (G.todoNav + navgoals resolver 'todo'), `src/ui/myday.js` goal rows.
- [x] 3. HUD: My Day button removed; the To do chip opens the one menu (To do > My schedule > Tomorrow > Ideas > "More on your phone"); taught on the first evening.
- [x] 4. Lesson order: unpack > menu > needs (toilet, wash hands) > fridge / sandwich / eat > "the evening is yours" + ideas > Nana Bea tomorrow morning + perhaps a job (both added as to-dos).
- [x] checks at 390x844 and 360x780, old-save loads, existing check tools: see "Checks"

## What changed, by file
- `src/sim/skillplay.js` — ck_build kit `rounds: 1`. SHARED by every "build" dish (data/cookgames.js: sandwiches, toast, wraps, tacos, burritos, nachos, hot dogs, maki, onigiri, bowls): all of them are now built once. Score, xp and the 3-star extra serving are per score, unchanged. Other cooking games still repeat inside one game and were NOT changed: flip (5 flips), oven / fry / boil (3 trays / batches), pour (3 cups).
- `src/data/minigames_b.js` — `unpack_boxes` no longer opens a game.
- `src/story/intro.js` — GOAL_LISTS.first_evening: new to-do `bathroom` ("Freshen up in the bathroom") after `unpack`; `find_food` reworded "Make yourself something to eat" (same id / doneWhen `ate_meal`, so eating out still completes it). New export `FIRST_EVENING` (all lesson lines).
- NEW `src/sim/first_evening.js` (order 137) — `G.todoNav { has, pick, selected, WHERE }`, `G.firstEvening { step, skip(), start() }`, state `G.state.fe = { v, step, day0, toilet, said }`. Header comment has the full description.
- `src/ui/hud.js` — the My Day button is no longer attached to the HUD row (`H.day` still built so `G.hud.setMyDay` works; its `soon` pulse now also goes to `#goalsw.soon`).
- `src/ui/goals.js` / `goals.css` — the chip (`#goalsw.md .gw-head`) has a `›`, the pad's Y glyph slot, min-height 30 px, a leave-now pulse; `hint(text, target, { under: true })` puts the bubble under the chip and keeps the chip visible; toasts start below such a bubble.
- `src/ui/myday.js` / `myday.css` — chip never empty ("Nothing planned · N ideas for right now"); sheet order; to-do rows point the arrow (`G.todoNav`), pin icon on rows the arrow can reach; "More on your phone" row; walk-through rewritten (4 steps).
- `src/ui/padnav.js` — Y clicks the chip (falls back to `G.myDay.open()` as before). `tools/pad_touch_check.mjs` taps the chip instead of `.hud-myday`.
- NEW tools: `tools/fe_lib.mjs`, `tools/first_evening_check.mjs [w h]`, `tools/first_evening_saves.mjs`.

## What moved from My Day to where
Nothing was removed: the My Day sheet IS the merged menu. Only its door changed (HUD button -> the To do chip under the needs bar; gamepad Y still opens it).
Inside the sheet, top to bottom now: To do (+ Opportunities you took up) · Next / My schedule (+ the gold Chapter row, Later today, Any time today) · Tomorrow peek · Ideas (+ More ideas) · "More on your phone" (opens the My Day app) · How things work here / Fun right now. The header's "Week" button is unchanged.

## The new lines (story/intro.js FIRST_EVENING, ui/myday.js TUT)
- Bubbles: "Tap a moving box to unpack it." · "Now your suitcase, by the door." · "Tap To do: it shows what to do next." · "Long trip. Use the toilet: through the Bathroom door." / "Tap the toilet." · "Now wash your hands at the sink." · "Hungry? Tap the fridge." · "Fridge › Make a no-cook dish › a sandwich." · "Dinner is in the fridge. Open it and eat." · button "Skip tips" (toast "Tips off. Your To do list still has it all.")
- Caption at the start of the needs lesson: "The little bars up top are your needs. You look after them at the things around you."
- To-do: "Freshen up in the bathroom" (hint "Through the Bathroom door: use the toilet, then wash your hands."; done: "Better. That is how needs work: you look after them at the things around you.") · "Make yourself something to eat" (hint 'Tap the fridge, then "Make a no-cook dish". A sandwich is easy. (Or eat out: Maps on your phone shows what is close.)')
- Arrow labels: Unpack this box · Unpack your suitcase · Use the toilet · Wash your hands · Check the fridge · Make something to eat / Eat your dinner · Your bed · Cook a meal
- Cards (tap to go on): "Unpacked, washed, fed. The rest of the evening is yours." ("day" before 17:00) · "A few ideas: take a walk round the block and see what is near. Put your feet up on the sofa with a book. Text Nora that you made it." · "There are always more under Ideas, in the To do menu. And when you are tired, your bed is right there." · "Tomorrow morning: go and see Nana Bea. She will have breakfast on. 4 Thimble Street, Old Town, the blue door." · "After that, perhaps look for a job. The Jobs app on your phone has the whole board. No rush." · "Both are on your To do list for tomorrow."
- Menu walk-through ("How this menu works · n of 4"): "To do comes first: what is worth doing next. Tap an item and the arrow in the world points you to it." · "My schedule is under it: appointments and work shifts, plus anything you add yourself. The next one is always on top." · "Ideas are below: things you could do right now. They are only ideas until you tap Add." · "This is the short version. The My Day app on your phone has the complete one: the whole week, every idea, your alarm."

## Decisions made for the owner (to confirm)
- "Grandpa" = **Nana Bea**. The story's day-two morning is breakfast at Nana's (Chapter 1 / beat g1_breakfast; owner msg 137 made the same slip). No grandpa was invented.
- Tomorrow = two TO-DO rows tonight ("Breakfast at Nana's (Old Town)", "Find a job (...)"), not a timed appointment: the story itself sends Nana's text and makes the 08:00 appointment at 07:00 next morning; adding one tonight would double it.
- The menu and the phone app keep the name "My Day"; the chip's tag says TO DO / NEXT / NOW / STORY as before.
- The menu lesson comes after unpacking (the chip is highlighted until it is opened once). Opening the menu earlier counts as the lesson.
- All "build" dishes are built once now, not only the sandwich (one shared setting).
- A to-do tapped in the menu keeps the arrow until the lesson moves to its next step.
- Old saves: past the intro = no lesson (nothing forced), but to-do taps point the arrow; mid-intro = the lesson starts on reaching the flat.

## Known gaps
- Arrow targets exist only for to-dos inside your own home (unpack, bathroom, fridge, food, sleep, cook). Other to-dos keep their old behaviour (waypoint when they have a place, else the hint line). "Text Nora" has no arrow.
- A phone banner (Nora's text on arrival) still covers the chip for a few seconds (old gap); the bubble moves below the banner.
- First-time cards ("Cooking at home" etc.) still appear in their own time during the evening; the check tools switch them off.
- The walk in the check is partly scripted: when a thing is off the phone screen the script puts the player on its use spot instead of walking.

## Checks (2026-11-18, built game, touch)
- `node tools/first_evening_check.mjs` (390x844, dsf 2): ALL PASS, 22 checks, zero page errors. Same at `360 780`: ALL PASS. New game through the real buttons (Start > New Game > creator > Juniper Court > Move in; the intro itself is SKIPPED with its Skip buttons), then by touch: arrow on a box, 3 boxes + suitcase unpacked with no mini-game, arrow moves to the suitcase, chip highlighted, menu opens, 4-step walk-through, order To do < schedule < ideas < phone row, a to-do tap points the arrow (bed), bathroom door > toilet > sink, fridge > no-cook > Cheese & Tomato Sandwich (Build game once, 1 round) > Eat now, six cards, tomorrow's two to-dos, lesson off.
- `node tools/first_evening_saves.mjs`: ALL PASS. tools/perf_save.json (old, past the intro) loads, no lesson, chip opens the menu; a mid-intro save stripped of the new state resumes the intro and the lesson starts in the flat; a first-evening save stripped of the new state loads with no lesson and its to-do tap still points the arrow; a save made mid-lesson resumes the lesson.
- Gamepad (scripted pad, tools/pad_lib.mjs): Y opens the menu from the chip, B closes it, the Y glyph is drawn on the chip. Focus order inside the sheet was not walked row by row.
- `tools/wishnudge_check.mjs`: ALL PASS. `node src/data/validate.mjs`: OK.
- `tools/navcheck.mjs`: 45 pass, 1 FAIL ("In store: Galleria bay by bus (QA16 gap)": a first-time card hides the arrow in the city) — not in files touched here; looks older.
- `tools/minigames_b_check.mjs`: does not start (times out at its own title tap: the Start button; older). Its three moving-box asserts would now fail ON PURPOSE (no unbox game from the box).
- `tools/pad_check.mjs`: 27 FAILs starting at the title screen ("after Start the ring is on New Game" finds Settings) before it reaches the HUD: older (title Start button), not caused by this change. `tools/pad_touch_check.mjs` needs an old build dir argument: not run (its `.hud-myday` tap was changed to the chip).
- NOT tested: the un-skipped intro leading into the lesson (plane, cab, Walt); real walking to off-screen things (the script places the player on the use spot); sleeping mid-lesson (code path only); the leave-now pulse on the chip; eating out instead of cooking; other homes than Juniper Court; a real phone.

## Screenshots (out/shots/first_evening/, 390x844 @2x unless suffixed _360)
00_hud_before · 01_hud_after_arrow_boxes · 02_unpacking_plain · 03_arrow_suitcase · 04_menu_lesson · 05_menu_walk_1..4 · 06_menu_open · 06b_todo_tap_arrow_bed · 07_bathroom_lesson · 07b_in_bathroom · 07c_wash_hands · 08_food_lesson · 09_sandwich_minigame · 09b_sandwich_ready · 10_free_evening · 10b_free_evening_ideas · 11_tomorrow_nana · 11b_tomorrow_job · 12_menu_tomorrow_todos
