# Alarm clock in the bed menus (2026-11-16)

Owner: "let's create an ability to create a custom wake up time. So keep those options and those recommendations, but at the bottom, you click a button and you can actually set the alarm clock to whatever time you want."

## What was added
- **`src/ui/alarm.js` (new) + `src/ui/alarm.css` (new)**: one shared picker.
  - `pickAlarm({ maxMin = 840, text })` -> `Promise<{ minutes, hour } | null>`. A small window in the kit's own look (`modal()`, the standard buttons): hours + / − (1 h) above and below a big HH, minutes + / − (5 min) around MM (64 x 48 px buttons), the line "Wake at HH:MM · sleeps X h Y min", then **Sleep** (gold) / **Not yet**.
  - Limits: at least 30 min, at most 14 h (the longest existing sleep-until choice, "until it is time for work" goes to 840 min; the data `sleep.minutes.max` is 600 but the menu already exceeded it). A step past a limit lands on the limit; at the limit the buttons that would cross it are greyed.
  - Start value = the last chosen alarm, kept in the save as the planner's wake-up alarm (`G.planner.alarm()` / `setAlarm()`, already in the planner slice and shown in the phone's My Schedule "Wake-up alarm" row: the bed and the phone now share one alarm). Default 07:00. If the saved time is out of range now, the nearest limit.
  - Note line (information only, never blocks): when a job shift or a timed planner entry starts after now and before wake + 45 min: "Your shift starts at 07:00" / "Dentist starts at 07:30".
  - `commitNote(fromT, untilT, cap?)`, `firstCommit(fromT, untilT)`, `ALARM_LABEL` ("Set the alarm…"), `ALARM_SUB`.
- **Home beds (`src/sim/activities.js` `menu()`)**: every existing row unchanged and in the same order; one new last row of the sleep group "Set the alarm… · Wake at a time you choose" (greyed with the same "You are wide awake" as the other sleep rows). Picks -> `start('sleep', { fx, minutes, untilRested: false })` (so it does not stop early at full energy; hunger and the loo still wake you, as for every sleep).
- **"Sleep until morning" note**: when a shift or planner entry starts before 07:45 the next morning the sub-line gets " · your shift starts at 07:00" (or " · Dentist starts at 07:30"). Nothing reordered or disabled.
- **Hotel bed (`src/sim/hotel.js` `bed()`)**: the same row before "Not yet", the same picker (capped at the end of the stay too; its own line "The bedside clock-radio…"); `sleep(mode, fx, alarmMin)` takes mode `'alarm'`. Same morning note. The aquarium sleepover has no sleep-until choices, so it has no row. No other bed menus exist (grep "Sleep until", "Take a nap").
- **Ghost-tap fix in `src/ui/kit.js` `modal()`** (small, see below).

## Found on the way: a tap on the bed chose a sleep option by itself
Tapping a bed (or anything) the player is already standing next to opens its window on the canvas `pointerup`; the browser's `click` for that same tap is then delivered to whatever button is now under the finger. Reproduced by touch at 390x844: three taps on the bed, two of them started "Sleep 8 hours" without the menu ever being seen. This is old (not from the alarm) and hits every window opened by a tap in range. Fix in `modal()`: a trusted click (`isTrusted`, `detail > 0`) with no pointerdown inside the window within its first 600 ms is dropped. Pad / keyboard presses (`padnav.js` dispatches untrusted clicks; keyboard clicks have `detail 0`) are never affected. After the fix the same three taps leave the menu open every time. **kit.js belongs to the CONTROLLER worker's area: the lead should tell them (the edit is 2 lines plus a comment, at the end of `modal()`).**

## How it was checked
**Script that plays by touch** (`tools/alarm_check.mjs`, also in the scratchpad): the real built game (`dist/index.html`), loaded from `tools/perf_save.json` through the title screen, at **390x844 and 375x812** (`hasTouch`, `isMobile`). Time, energy, hunger, the job, the dentist entry and the hotel booking are set with `G`; every menu / picker / Sleep press is a touchscreen tap. 30 / 30 PASS, 0 page errors:
- bed menu by tapping the bed; rows: until morning, until rested, 8 hours, nap, **Set the alarm…** last;
- picker set to **05:35** with the +/- buttons, Sleep -> wake window and game clock **05:35** (both sizes);
- 30-min floor and 14-h ceiling (buttons grey at the limits);
- **save -> reload** through the title screen: the picker opens at 05:35;
- barista job (shift 07:00): "Sleep until morning · Wake at 07:00 · 9 h 29 min · your shift starts at 07:00"; picker at 07:30 shows "Your shift starts at 07:00"; at 05:00 no line;
- planner "Dentist" 07:30: the morning note and the picker line;
- hotel: booked, room entered, "The bed" tapped, row present, set 06:20, slept, game clock **06:20** (first run woke at 03:00 because the test player was starving: the hotel's own hunger wake, unchanged).
Screenshots I looked at: `out/shots/alarm_job_menu_390x844.png`, `alarm_job_picker_375x812.png`, `alarm_wake_0535_390x844.png`, `alarm_hotel_picker_390x844.png` (all the others `alarm_*.png` are there too).
Also: `node src/data/validate.mjs` OK, `node tools/build.mjs` OK, `node tools/navcheck.mjs --rooms all` all passed / 0 page errors, `grep -c '(?<[=!]' dist/index.html` = 0.

Not checked: a real phone; the controller walking through the picker (the buttons are ordinary kit buttons with `onclick`, so padnav can focus them, but no pad run was made); the phone's alarm still does not wake you by itself (it did nothing before either: the data says `wake.alarm: true` but nothing reads it) — the bed is where the alarm is set and used.
