# Opus bundle 1 (owner msgs 196, 198, 199, 205), 2026-11-16

Opus worker. Nothing committed, pushed or published by me. Note: the lead's "WIP of running workers" commits (18e3731, d4f0a1d) already contain most of
these edits; diff against **493d093** to see the whole bundle. Everything below was checked in the BUILT game (dist/index.html), Playwright, 390x844,
hasTouch + isMobile, New Game + `G.intro.skip()`. Drivers (not in the repo): `/tmp/claude-0/-home-user-Pixel-city-2/ab4bf52b-889a-5288-a866-29c2e55d0472/scratchpad/bundle_play.mjs`
(`a`, `b`, `c`) and `.../scratchpad/rocker.mjs` (D).

## A. Phone part-screen: no Bigger, normal clock while reading

**What changed**
- The header's **Bigger / Smaller button is gone** (`sizeTo` / `sizeLabel` removed). Watching (Reel) and reading (Pages short reads, owned-book sittings,
  Post letters) always stay docked with the world above; the header keeps **Stop**.
- The HUD phone button and the M / Q keys while docked now **put the phone away** (= Stop) instead of making it bigger.
- **Reading runs the normal clock** (0.85 game min per real second x 1x/2x/4x, the same as video): the `rate` option is no longer passed by Pages
  (`TUNE.CLOCK.read`) or Post (`.1`). `ctx.partScreen`'s `o.rate` is kept in the API but nothing uses it.
- **Wander (guide) entries**: their docking was the same toggle ("Smaller", opened full). Decision: removed that call; an entry opens full and pauses time like
  the rest of the guide (browsing, not reading). Easy to undo if the owner wants entries docked: call `ctx.partScreen('read')` again in `entryPage`.
- What still uses the slow number: `TUNE.CLOCK.read` is now only the **pay unit** of a short read (fun / screen time per real second read), so a piece's
  totals are unchanged and still match its Library listing, exactly as a film pays its 20 minutes while the clock passes ~33. Book sittings were already on
  the normal clock. Need drains, alarms and Leave-now run off the clock, so they now simply arrive at the normal rate while you read (nothing keyed to the
  slow pace). The full-phone fallback (only when part-screen is not allowed: the phone opened over a sheet, or busy at a non-seat activity) is unchanged:
  world paused, old rules, for video and reading alike.
- `PART-SCREEN HOOK` markers untouched.

**Files**: `src/ui/phone.js`, `src/ui/phone_reader.js`, `src/ui/phone_post.js`, `src/ui/phone_guide.js`, `src/data/media.js` (comment only).

**Checked (played by touch, city street)**: Reel film docks, header = Stop only, **video 8.51 game min / 10 real s**; Pages "The Fog Bell Affair 1" docks,
header = Stop only, **reading 8.53 game min / 10 real s** (busy "Reading on your phone", rate 0.85); Stop put away (G.modal 0); M while docked put away.
0 page errors. Shots: `out/shots/bundle_a_reel_part.png`, `bundle_a_read_part.png` (looked at: world, HUD clock and the player visible above the sheet).

**Not tested**: a Post letter docked (no letter in a fresh game; same one-line change), a book sitting (unchanged code), the pad focus ring on the header.
**Question**: the Library still lists a short read as "14 min" (its pay), but at the normal clock reading it takes ~1 h 40 of game time. Keep, or relabel?

## B. Station Agent: the Information desk as a brief first part

**What changed** (the engine can switch rooms; no large change needed)
- `story/jobs_new.js`: the job gets `deskRoom: 'central_station'` (the hall). Pay, hours, levels, texts unchanged.
- `sim/jobs.js`: `atWork` accepts the job room OR its deskRoom, so walking into the HALL in the window clocks you in (the story beat and the card play there),
  and going up the stairs does not end the shift. `debugStart` still clocks in on the platforms (the job's own room).
- `sim/_jobs_work.js` (engine): a shift clocked in in `deskRoom` starts with only its `desk: 1` ticket(s); when that ticket is finished, `handOff()` switches
  `W.roomId` to the platforms, restores the normal tickets, shows "Thank you. Now up through the gates: the rest of your shift is on the platforms." and sets a
  guide pin (`G.navGoals.set`, room = platforms) so the arrow reads "Platforms 1 & 2 → the platforms". Walking up before answering skips the desk ticket (no
  penalty). For a deskRoom job no ticket spawns or goes cold while you are not in its current room. Customers left behind in the room you came from are removed
  from that cached scene. Clocking in directly on the platforms: no desk step (as before).
- `sim/_jobstory_stations.js`: the desk ticket ("A traveller at the Information desk", step "Answer at the Information Desk", a "Which platform" question at
  the desk); `station_info` resolves to the help point on the platforms and to the hall's Information desk in the hall (`first:` row).
- `sim/jobstory.js` (`defineNav` 'jobroom', 3 lines): the clock-in arrow uses `deskRoom` when there is one (here the venue, so the existing 'clockin' goal leads).
- Old saves: no new saved fields; a save made mid-shift still ends the shift on load (unchanged rule).

**Checked (by touch unless said)**: hired + a Tuesday 05:45 set by script; walked into the hall -> clocked in; dialogue tapped through, "Work the shift";
first ticket = the desk traveller (only one); walked to the desk, answered ("To the minute. It is the clock that is fast.") -> 1 task, +$1; toast + arrow
"Platforms 1 & 2 → the platforms"; no tickets while still in the hall; through the gates -> on the platforms, still on shift, "Loop A is in on Platform 1" +
"Somebody is lost" running; did "Somebody is lost" from the HUD ticket -> 2 tasks; rest of the shift by `G.jobs.debugFinish()` -> pay card **7 h x $13 + $2 =
$93**. `debugStart` on the platforms -> no desk step. 0 page errors. Driver note: floor taps in the hall sometimes sat the player on a bench (the known bench
tap-area rule); the driver then stood up and walked to the gates by script and tapped the gates by touch.
Shots: `bundle_b_card.png`, `bundle_b_desk_step.png` (the desk question), `bundle_b_arrow_platforms.png`, `bundle_b_platforms_first.png`, `bundle_b_platform_ticket.png`, `bundle_b_paycard.png`.

**Not tested**: a save made during the desk step and loaded (code: the shift ends 'load' as always); "Skip to the end" chosen in the hall then walking up; pad.

## C. Own pictures for kneading and ping-pong

**What changed**: `KINDS.rhythm` takes `o.look`; with a look, only the drawing changes (same notes, lanes = left / right half, timing windows, scoring, pad
hints). `src/ui/minigame.js` `LOOK.knead` and `LOOK.pingpong`; `src/sim/skillplay.js` passes `look` and rewords the two hints.
- **Kneading** (ck_knead): worktop, floured board with flour specks; a ball of dough on a flour patch; each cue is a floury hand (left = pink sleeve, flat:
  push; right = blue sleeve, curled: fold) coming down to the dough; a good push squashes it flat and long with flour flying off, a fold rolls it up taller
  with a crease and flap, a miss slumps it with a flour puff; lumps disappear as the dough comes together.
- **Ping-pong** (rally): the table from your end in perspective, net, white lines, legs, the other player's red bat at the far end; the ball is served once your
  return crossed, flies over the net, bounces once on your half (a landing ring), comes up to your end; your bat swings to the side you tap (black rubber =
  backhand left, red = forehand right) and the ball flies back.

**Checked**: both started with `G.skillplay.demo` (ck_knead with flatbreads, rally) and played by touch to the end: score 1.00, 3 stars each; 0 page errors.
Shots: `bundle_c_knead_1.png`, `_2`, `bundle_c_pingpong_1.png`, `_2`, `_3` (looked at full size; I redrew the hands once, they were crude, and made ping-pong
show one ball at a time instead of two). **Not tested**: from a real kitchen / a placed ping-pong table (same game key), pad lane buttons.

## D. Rocking chair in the shops (owner msg 205)

**What changed**: `src/data/goods.js`, a new section on art `furn.home.rocker` (the seating worker's art; tag sofa, seat, ambience 2 like the wingbacks and the
porch rocker): **Fireside Rocking Chair** (red cushion, blue throw) $340 at the Gilded Attic (x0.7 = $238) and Bellwether ($374); **Fireside Rocking Chair, Sage**
(dark oak) $320 at the Gilded Attic and Timber & Trowel. One family, two colourways. In-store only (the instore split decided that by itself).
**rocking.js needed no hook**: it rocks any fixture whose asset is `furn.home.rocker` in any room. Nothing edited in seating.js / rocking.js.

**Checked by touch**: Gilded Attic counter list shows both (and the Fireside one stands on the shop floor as a display); bought -> a delivery; delivery landed by
`G.housing.deliverNow()` (driver shortcut instead of waiting for 09:00); unpacked by tapping its box -> placed at home; Decorate shows it; tapped Sit -> it rocks
(tilts -2..2, player carried); turned the other way (flip set by script) -> sit by touch, rocks. Roomy page: picture, both colour swatches, "Ambience +1"
(shown before I raised it to 2), the two shops with prices. 0 page errors. Shots: `bundle_rocker_1_shop_list.png`, `_2_bought`, `_3_design`, `_4_sit_a`, `_4_sit_b`,
`_4_sit_turned`, `_5_roomy`. **Not tested**: turning it with the design-mode Turn button by touch; an NPC visitor sitting in it.

## Size
Source added by this bundle vs 493d093: about +17 KB (13 files). dist/index.html now 15,139,450 bytes (was 15,106,791 at 493d093, which includes other workers' changes since).

## Checks run
All run on the final build. `node src/data/validate.mjs` OK. `node tools/build.mjs` OK. Regex lookbehind in dist: 0. `minigames_b_check` all passed.
`jobs_check` OK. `navcheck --rooms all` all passed with 0 page errors. `instore_check` OK (the new rockers are in-store only and sold in reachable shops).
`minigames_check`: every part passed (knead played by touch from the stove: 1.00) except one 'walk' line at 390x844, where ck_stir, ck_boil and ck_oven
"did not start" for three recipes. Those are not my games, and the same line passed at 375x812. A rerun of `minigames_check walk` on its own passed all of it at
both sizes, so I read it as a timing flake under load.

## Files
Edited: `src/ui/phone.js`, `src/ui/phone_reader.js`, `src/ui/phone_post.js`, `src/ui/phone_guide.js`, `src/data/media.js`, `src/story/jobs_new.js`, `src/sim/jobs.js`,
`src/sim/jobstory.js`, `src/sim/_jobstory_stations.js`, `src/sim/_jobs_work.js`, `src/ui/minigame.js`, `src/sim/skillplay.js`, `src/data/goods.js`, `dist/index.html` (build).
Created: this report.
