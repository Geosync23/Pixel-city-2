# Phone part-screen: watching and reading with the world going on (owner msg 173, BIBLE "Direction update 37")

> "When watching shows or reading on your phone, it should be part screen, on phone still, so you can see the world around you and time goes on."

Worker: PART-SCREEN (Fable lane), 2026-11-16. Everything below was checked in the BUILT game (dist/index.html) with Playwright, by touch at 390x844 and
375x812, plus one run with the fake gamepad (tools/pad_lib.mjs). Scripts live in the worker's scratchpad (not committed); the numbers are copied from their logs.

## 1. What the player gets

- **Reel** (every film / show, also "Next: Episode N"): pressing play docks the phone at the bottom of the screen, **43% of the height** (366 px at 844):
  the header (Back, title, **Bigger**, **Stop**), the picture full width (374 x 214 at 390 px) and the play / restart / scrub / time / Rotate row. The
  status bar, the phone's nav bar and the film's blurb go. "The end" lies over the picture. Above it: the world, the HUD clock + needs, the speed buttons,
  the bag / phone buttons (lifted to sit above the sheet) and the player character holding the phone.
- **Pages**: a short read, a sitting with an owned book (15 / 30 / 60 min) and **a letter in the Post app** dock as a taller sheet, **60% of the height**
  (506 px at 844), with the page's own scroll (`.md-text`), the Aa / night / bookmark tools and Back / Skim / Next. **Wander (the guide) entries** can be docked
  too, but open full (browsing the guide is not "reading"): their header has **Smaller**.
- **Bigger** = the full phone exactly as before (the world pauses behind it as every app does; Reel / Pages then run their old clock rules). **Smaller** = back
  to the dock. The HUD's phone button (and the M / Q keys) while docked = Bigger, not "put away". **Stop** = put the phone away (the position is saved).
- **The clock runs** while docked: video at the normal rate (G.CLOCK 0.85 game min per real second x the 1x / 2x / 4x speed); text you read yourself (short
  reads, letters, guide entries) at **reading pace** (TUNE.CLOCK.read = 0.1 game min per real second x the speed, see 3); book sittings at the normal rate.
  The HUD pause, a dialogue, a sheet or any other window over the game stops the clock as always AND holds the film / the page's pay.
- **World taps are ignored** while docked (decision: ignore, not a "Stop watching?" question). The player is busy holding the phone (G.busy), so taps,
  hold-to-walk, the keyboard and the pad's stick do nothing to the character; the HUD stays live. Stop / Back / Bigger are one tap away.
- **Seated stays seated**: on a sofa, bench, chair, a seat in a queue, the player keeps the seat; the seat's activity is taken over (its clock runs at the
  normal rate instead of its fast "sit" rate and it does not run out while you watch); after Stop they are still sitting, with the seat's original time left.
  Standing: a hold activity "Watching on your phone" / "Reading on your phone" with the existing `phone` pose (on a seat: the existing seated phone pose).
- **On a bus / cab ride** the ride keeps its clock; the docked phone works (the ride strip, Skip ride / Get off, is lifted above the sheet). Code-read +
  CSS only: not played (see 6).

## 2. Interruptions (how each behaves)

| What | Docked phone | Checked |
|---|---|---|
| **Leave now** (My Day, `appt:leave`) | the film PAUSES (tip "Paused: time to leave."), the sticky "My Day · Leave now" banner and the navigator's "Time to leave" banner show over the world above the sheet; the clock keeps running (you are standing there with the phone); Stop and go | played: a 60 s film, an appointment across town; banner fired 17 s in, at 12:16, on top (elementFromPoint), film held at 0:17 |
| a need at its floor (hunger 5, energy 3, bladder 6) | the needs guard ends the hold as it ends any activity ("You stop (Watching on your phone): you are starving..."), the phone is put away, position saved | script: hunger set to 4 |
| a Chapter / a scene / anything that calls `G.endActivity` | the hold ends -> the phone is put away (the TV way) | script: `G.endActivity(false)` |
| HUD pause, a dialogue, a sheet, the first-time window | clock stops (G.modal), film / page pay held, resumes after | played: HUD pause 3 s (clock and film both frozen); script: G.modal++ 2 s |
| scene change (a fade, closing time, a ride arriving) | phone put away | code |
| a phone banner (any app) | shows as a banner at the top (in the full phone it is a tip inside the phone, as before) | played (Leave now) |
| a visitor at the door | there is no interactive "visitor at the door" in the game today (a courier is a phone notification + toast); any dialogue a future visitor opens holds the session as above | code-read |

## 3. Effects: before / after (all numbers from the logs)

Rule: the TOTALS of a whole episode / read / sitting are unchanged; while docked they are paid as the film plays / the page is read / the game minutes of
the sitting pass, through `G.media.spend(..., { noAdvance: true })` (the docked clock has already moved, so spend must not move it again).

| | before (full phone, world paused) | after, docked at 1x |
|---|---|---|
| Reel "Low Tide" (40 s) | clock +20 game min, fun +2.17 (6.5/h x 20 min), screen time +20 | **clock +33 min** (0.85 x 40 s; 33 at 1x, 136 at 4x), **fun +2.166**, screen time **+19.99**; music off from play to 12 s after Stop (played: back ~17 s after) |
| same, on the lobby sofa | (same as above) | clock 0.851 game min / real s, fun +2.166, pool 19.99, still "Sitting" after Stop |
| short read "The 7:42" (519 words, listed 14 min) read at 230 wpm | clock ~+14 min, fun ~+1.4, screen time ~+14 | **clock +14.5 min**, fun ~+1.45, screen time **+14.5**; 10 pages at 390 (fits the sheet without scrolling at 17 px) |
| novel sitting, 15 min | clock +15 in 5 real s, book +12.75 (x0.85 pace), screen time +15 | **clock +15.2 in 18 real s**, book **+12.75**, screen time **+15.00**, creativity xp same per minute |
| 4x speed while watching | n/a | clock **3.40** game min / real s (normal 4x), the film still plays in real time, totals unchanged |

**Reading pace (a decision, please confirm).** The brief asks for the normal rate everywhere AND for a short read to take a believable amount of game time.
At the normal rate a 500-word piece read at a normal speed (~2 real minutes) would cost ~1 h 50 game minutes. So text you read yourself (short reads,
letters, guide entries) runs the clock at reading pace, 0.1 game min per real second x the 1x / 2x / 4x speed: the read costs the minutes the Library already
lists (col_742: 14 listed, 14.5 measured). The clock still visibly moves (1 minute every 10 s at 1x, every 2.5 s at 4x); the world (people, traffic) moves at
its normal pace. Video and book sittings use the normal rate. One number to change (`rate` in the `ctx.partScreen` calls) if the owner wants it otherwise.

Page position: remembered on every page turn and on leaving (played: left on page 2, Continue reopened page 2). Bigger / Smaller (and now Aa too) re-paginate
for the new size and open the page that holds the same words (word offset), not the same page number.

## 4. Files

- `src/ui/phone.js` — the part-screen state: `ctx.partScreen(kind, { start, refit, rate })`, `G.phone.part`, `G.phone.setPart`, event `'phone:part'`;
  G.modal / depth handling (docked = the phone no longer pauses), the hold (own activity / seat take-over / ride), `lost()` (something else ended the hold ->
  put away), the Bigger / Stop header buttons, banners instead of in-phone tips while docked, `open()` while docked = Bigger, keys (P / 1 2 4 / Tab reach the HUD
  while docked), scene change -> put away, `--phh` + `#ui.ph-part` for the HUD, `G.camDY` for the camera.
- `src/ui/phone.css` — the dock (43% / 60%), header buttons, the HUD's bottom row / prompt and the ride strip lifted over the sheet, activity strip hidden.
- `src/core/game.js` — one `PART-SCREEN HOOK` in the camera line: `+ (G.camDY || 0)` so the player is centred in the visible world above the sheet (phones
  only; 0 on wide screens where the phone sits at the side). The PAD HOOKs are untouched.
- `src/ui/phone_reel.js` — docks on play; pays per film-second with noAdvance when docked; holds while the game is paused under it; `appt:leave` pauses the
  phone player (full or docked); "The end" says "N min of screen time" (the clock now passes more than the screen time).
- `src/ui/phone_reader.js` — docks short reads (reading-pace clock, refit by word offset, also on Aa) and book sittings (game minutes that really pass).
- `src/sim/media.js` — `readBook(id, gm, o)` passes `o` (noAdvance) to `spend`; header notes.
- `src/ui/phone_media.css` — Reel docked layout; **fix**: `myday.css` also styles `.md-time` (width 50 px), which cut Reel's "0:10 / 0:40" off in BOTH modes.
- `src/ui/phone_post.js` — a letter / reply docks (reading pace). `src/ui/phone_guide.js` — an entry can dock (opens full, "Smaller").

## 5. Controller (pad)

Docked, the player is busy, so the focus layer treats the dock as the window: the ring is on the film's Play / Pause, the header's Bigger and Stop are
reachable, Back = the header's Back (to Reel's list), Start = put the phone away. Fake-pad run: Start -> Reel -> Play Low Tide -> Bigger -> Smaller -> clock
runs -> Stop, all five by the focus ring (`{"focus":5,"cursor":0}`). `node tools/pad_check.mjs` on the final build: 68 passed, 0 failed, 0 page errors.

## 5b. How each thing was checked

| Check | How | Result |
|---|---|---|
| one Reel episode docked, start to end, clock / needs / music logged every 5 s, Bigger + Smaller mid-episode, a world tap | played by touch, 390x844 and 375x812 | clock 12:05 -> 12:38, fun +2.166, pool 19.99, music `off` from play until ~17 s after Stop (then a tune), world tap: the player did not move |
| one short read end to end, Bigger / Smaller on page 3, leave on page 2 and Continue | played by touch, 390x844 and 375x812 | 14.5 game min (listed 14), page 3 kept its first words through both re-paginations, page 2 remembered |
| Leave now during a 60 s film | played by touch, both sizes | fired at 0:17, film paused, banner on top above the sheet |
| watching seated on a sofa (residential lobby 1) | played by touch | stays seated (pose `phone` seated), clock 0.851 / s, after Stop still "Sitting" |
| watching standing on a street | played by touch (the airport forecourt) | pose `phone`, busy "Watching on your phone" |
| fake gamepad: Start -> Reel -> Play -> Bigger -> Smaller -> Stop | tools/pad_lib.mjs | all by the focus ring |
| 4x, HUD pause, a dialog (G.modal), HUD phone button, need at floor, an activity ended by something else | script | as in section 2 |
| novel sitting 15 min docked | played by touch | 15.2 game min in 18 s, same totals |
| Wander entry Smaller | played by touch at 375 | docks, reading pace, Back -> full |
| `node src/data/validate.mjs`, `node tools/build.mjs`, `node tools/navcheck.mjs --rooms all`, `node tools/music_check.mjs`, `node tools/pad_check.mjs` | run | all pass (music 77 / 77, pad 68 / 68), 0 page errors; regex lookbehind in dist: 0 |

Screenshots (looked at): `out/shots/pps_watch_part_*`, `pps_watch_mid_*`, `pps_watch_bigger_*`, `pps_watch_end_*`, `pps_read_part_*`, `pps_read_bigger_*`,
`pps_read_end_*`, `pps_sofa_part_*`, `pps_sofa_after_*`, `pps_leave_*`, `pps_paused`, `pps_pad_part`, `pps_pad_bigger`, `pps_guide_part`, `pps_book_part`
(`*` = 390x844 / 375x812). In all of them the world is visible above the sheet with the player in it, nothing covers the HUD's clock / needs / speed row,
and the text reads at 375 px. Transient things (a phone banner, a toast, a speech bubble) can sit over the world for a few seconds, as anywhere.

## 6. Not done / not verified

- Not played: watching on a bus / cab ride (code + CSS only), a letter in Post docked (no letter in a fresh game; code-read), Wander's Smaller (code-read),
  the Rotate fullscreen while docked (unchanged code: it covers everything as before, the clock keeps running behind it).
- PlayBox (games) is not part-screen: the brief covers watching and reading only.
- The seat's own "rest" pays energy / fun by the minutes sat when you finally stand, so a long docked film on a bench adds that small sit bonus on top (as sitting
  that long would). "Put Your Feet Up" on a sofa keeps paying its fun 4/h while you watch on top of it.
- Reading pace for text (3) is a decision the owner may want to change.

## 7. Owner questions

1. Reading on the phone runs the clock at reading pace (a 500-word piece ~14 game min). Would you rather it ran at the full walking-world rate (~2 game hours
   for the same piece)?
2. Should the phone remember "Bigger" (open every film full until you press Smaller again)? Now every new film / read starts docked.
