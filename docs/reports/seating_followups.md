# Seating follow-ups (Fable worker, 2026-11-16)

Owner msgs 138 / 140 / 180; the open items of `docs/reports/seating.md` section 7 and of QA round 15 part B, plus the two new owner wishes (Nana's rocking chair, a hop when sitting down and standing up).

**In short.** All seven items are done. The built file grows by **about 10 KB** for this job (limit was 60 KB). Nothing was pushed, committed or published by me.

**Not tested:** a real phone. A real 2x / 4x game-speed session with the hop. Winter (the picnic blanket is packed away then). Every tall prop in every room: the fade rule is general, I looked at five real cases. `tools/minigames_b_check.mjs` did not pass in one clean run (see Checks).

## How each item was checked first
Before changing anything I built the game, kept that build (`before.html`) and shot every case in it: `out/shots/seatfu_*_before.png`. The same drivers then shot the new build: `*_after.png`. Pairs side by side: `out/shots/seatfu_sheet_room_pairs.png`, `out/shots/seatfu_sheet_city_pairs.png`.

Already fixed in "fixes16", verified only (after shots `seatfu_chk_gymbike / chk_clinic / chk_uni / chk_library_after.png`): the gym bike rider sits on the frame, the clinic chair row and the university bench seat people a chair apart, the library lamp stands behind the armchair. Nothing changed there.

## 1. Tall props in front of a seated player
- **Was:** a seated player has no see-through copy (Stage 76), and things in front only faded when they were at least 2.4 high and wide. So the airport gate seats, the department-store shelving (2.1 high), the classroom partition (2.3) and the arena scoreboard hid the player completely.
- **Now** (`src/engine/render.js`, function `covers` + the fade loop in `draw()`): for a seated player the rule is "whatever covers the head and chest fades", at any height. The head and chest are a 7 x 15 pixel box above the seat point; an object fades (the same 0.28 fade walls use) when its solid pixels fill half the head or 40% of the box. The old tall-and-wide rule still applies as well. A standing player is treated exactly as before.
- **Cheap:** the pixel answer is looked up once per object and place and kept on the object; a frame costs a rectangle test and three compares per object in front. The box is copied to a 7 x 15 canvas of its own and read there, so no sprite canvas is read back.
- **Things that cannot fade** (the arena scoreboard's two faces are live canvases, not placed objects; a bus): the player's see-through copy is drawn after all, at 50%. In the arena the player now shows through the scoreboard as a ghost. It is the weakest of the cases (`seatfu_fade_arena_after.png`).
- **Checked:** airport concourse, arena bowl, department store, classroom (before / after pairs); department store and airport again by touch, day and night (`seatfu_sheet_touch.png`).
- **Left as it is:** in the classroom, facing the camera behind the partition, the head is clear and the body is covered (under the 40%): it does not fade (`seatfu_low_school_d1_after.png`). Say if it should.

## 2. City benches where the sitter floats
Three separate faults, all in how the city hands a seat to the player (`src/sim/activities.js`, new shared helper `src/sim/_benchseat.js`):
- **Height counted twice.** A prop's seat was passed with its absolute height, and the game adds the ground height again. On any ground not at 0 the sitter floated by the ground's height: 1 unit over the picnic blanket, 0.5 over the lake boat, 3 over the rail benches, and sank 1 unit at the harbour. Now the seat height is taken over the ground under it.
- **Rail platform benches** got a "Sit" spot on the street below and lifted the player up to the platform. Benches more than 1.6 above the ground under them get no Sit spot now (the platforms are their own rooms).
- **Sat backwards / between the seats.** A bench with a map marker seated the player on the marker's middle, facing the way the marker says the bench "looks": on the quay and lake benches that was facing the backrest. Player and city folk (`src/sim/crowd.js`) now take a real seat of the bench standing there, facing the way it faces, and so no longer sit on top of each other.
- **Checked:** real menu flow (Sit, People-Watch) before and after for a rail bench, a hill bench, a quay bench, both boats, the blanket; quay bench by touch day and night.

## 3. Rowboat
The seat data was right; the fault was the doubled height above. Lake: the sitter sits in the boat instead of half a unit over it. Harbour: in the boat instead of under water. Checked by touch (harbour by day, lake at night).

## 4. Grill table
- **Was:** the table is 2.6 high because of its copper flue, so it counted as "a tall thing in front of the player" and went see-through under its own guest.
- **Now:** the piece you sit on fades only when it is tall and its own front part covers your head (a gazebo roof, a booth back). The grill table stays solid, legs behind the table on the far side (`seatfu_grill_d0 / d2`).

## 5. Floor seats
- New cross-legged pose, composed in `src/art/chars/char.js` (`floorLegs`, used when the pose carries `floor`). It uses the same colour sources as the chair pose, so every bottom, skirt, dress and shoe layer follows; the body, arms, head, hair, bags and held items are the unchanged layers, lowered onto the floor. All four directions, kids and adults: `out/shots/seatfu_floorpose_chars.png` (7 outfits x 4 directions x sit and phone).
- **Who gets it:** a seat lower than 0.15 is a floor seat. The player on any such seat (`activities.js`), venue customers and city folk (`src/sim/_crowd_core.js`), the second-graders when they sit on the carpet (`src/scenes/rooms/job_rooms.js`).
- **Checked:** classroom carpet, the low tea table's cushions (4 directions), yoga mat, picnic blanket; a customer at the low table seen from behind (`seatfu_npc_lowtable_after.png`).
- **Not covered:** showpiece crowds with their own character code (e.g. the lido lawn picnickers) and a player seated by a system that sets its own pose after starting the activity keep the chair pose.

## 6. Nana's rocking chair
- **Art:** new piece `furn.home.rocker` in `src/art/home/seating.js`: slatted high back, arms, curved runners, red cushion, a blue knitted throw; five tilts. `out/shots/seatfu_rocker_art.png`.
- **Placed** where the oak chair stood (`src/scenes/rooms/homes.js`, same `rangechair` tag, so Chapter 1 finds it). The cactus moved a quarter of a tile aside, because the wider chair overlapped it.
- **Motion:** new `src/sim/rocking.js`. While someone sits in a rocker the chair steps through its tilts on a slow sine (2.3 s), the sitter moves with the seat, and after they get up it rocks on and comes to rest in about two seconds. Works for any rocker in any room.
- **Chapter 1 played by touch** from the step "Ten minutes in the chair by the range": the marker points at the rocker, tapping "Sit a while" seats the player on it, it rocks (tilt log 0, 1, 0, -1, -2, -1, 0, 1, 2), the step finishes and the Chapter moves on. `seatfu_ch1_after.png`, `seatfu_ch1_rock_after.png`, tilts: `seatfu_sheet_rocking.png`.
- The rocker is not in any shop.

## 7. The hop
- A lift of up to 4 pixels over 0.18 s along an arc, drawn by the renderer from a time stamp on the character (`e.hop`). Position, sorting and the seat the character is drawn with do not change, so seat occlusion is untouched.
- **Player** (`src/core/game.js`): on sitting down and on standing up, for sitting activities only. Not for hidden activities (bath, vehicles), lying down, cutscenes, or a seat more than 4 units from where the player stood. `noHop: true` on an activity switches it off.
- **City folk:** when a venue customer or a bench sitter arrives at a seat and when they leave it (`_crowd_rooms.js`, `crowd.js`). People who are placed already seated do not hop.
- **Checked:** measured frame by frame at Nana's and in Chapter 1: 1, 2, 3, 4, 4, 4, 4, 3, 2, 1, 0 pixels, same on standing up. City folk watched for 45 s at 4x in the cafe (16 sit / stand events) and by a park bench (6): every one hopped, none of the people seated at the start did. `tools/minigames_check.mjs` passes, including the seated rowing and cycling games.

## Checks (final tree)
- `node src/data/validate.mjs` OK. `node tools/build.mjs` OK. `grep -c '(?<[=!]' dist/index.html` = 0.
- `node tools/navcheck.mjs --rooms all`: all passed, 0 page errors (after the rocker and cactus were placed).
- `node tools/perf.mjs --verify`: 13 of 13 lines ok, "same pixels". `node tools/nightcheck.mjs`: all checks passed.
- `node tools/minigames_check.mjs`: all passed. `node tools/minigames_b_check.mjs`: the first run was cut off by a 30-minute limit after 30 PASS and 0 FAIL. The remaining groups run one by one: rules, pad and intro passed. Town showed 2 FAIL on the shared `dist/index.html` of that moment ("hotel pool laps" and "shoot pool": no game opened, a modal was open), so I ran the town group again on two fixed builds: the tree without this job 9 of 9 PASS, the tree with this job 9 of 9 PASS. The two failures did not come back; I did not find what the open modal was (another worker was rebuilding `dist` at the time). Worth one more run by the lead on the clean build.
- `node tools/seatscenes.mjs --tag seatfu` (cafe, diner, cinema, symphony, aquarium, park, Nana): no page errors; looked at as one reduced sheet, nobody cross-legged on a chair.
- All my drivers: 0 page errors.

**Frame rate** (CPU 4x slower, dpr 2, 390x844):

| case | before | after |
|---|---|---|
| seated behind the department-store shelving (fade active), 3 runs | 60.1 fps, item pass 1.88 ms | 60.1 fps, 1.94 ms |
| seated behind the classroom partition | 60.1 fps, 0.81 ms | 60.1 fps, 0.83 ms |
| seated in the open, cafe | 60.2 fps, 0.79 ms | 60.1 fps, 0.87 ms |
| city walk (`perf.mjs`), tree without / with this job | 54.9 fps, 1% low 16.7, worst 150 ms | 55.3 fps, 1% low 16.1, worst 117 ms |
| busy_room, build at job start / now (includes other workers' changes) | 57.2 | 56.4 |
| rooms, same | 48.2 | 47.6 |

All differences are inside the run-to-run spread. One thing for the lead: a `--no-audio` build of the current tree shows a 480 ms frame on the city walk in every run; the full build does not. I did not find the cause; a copy of the tree without the audio folder did not show it.

**Size.** At job start `dist/index.html` was 15,075,208 bytes. It is 15,138,683 now, which includes the other workers' changes. This job alone, measured by building the same tree with and without my changes: **+10,071 bytes**.

**Pictures I looked at, full size:** every `seatfu_city_*_before`; the sheets of all room before shots, all room after shots, all city after shots, the rocking tilts, the touch runs (10 seated + 5 standing up), the floor-pose character sheet, the rocker art, `seatfu_ch1_after`, `seatfu_ch1_rock_after`, `seatfu_npc_lowtable_after`, the two pair sheets. Looked at only reduced: the seven `seatscene_seatfu_*`.

## Files
- **New:** `src/sim/rocking.js`, `src/sim/_benchseat.js`, `docs/reports/seating_followups.md`.
- **Edited:** `src/engine/render.js`, `src/core/game.js`, `src/sim/activities.js`, `src/sim/crowd.js`, `src/sim/_crowd_core.js`, `src/sim/_crowd_rooms.js`, `src/art/chars/char.js`, `src/art/home/seating.js`, `src/scenes/rooms/homes.js`, `src/scenes/rooms/job_rooms.js`. `dist/index.html` and `src/modules.gen.js` were rebuilt.
- Drivers (not in the repo): `/tmp/claude-0/-home-user-Pixel-city-2/ab4bf52b-889a-5288-a866-29c2e55d0472/scratchpad/seatfu/` (`sf.mjs` runner, `rooms.mjs`, `city.mjs`, `touch.mjs`, `rock.mjs`, `ch1.mjs`, `npc.mjs`, `fadeperf.mjs`, `chars.mjs`).

## Questions for the owner
1. The arena scoreboard cannot fade; the seated player shows through it at 50%. Enough, or should the team bench under it move?
2. Behind the classroom partition, facing the camera, only the head shows. Fade the partition there too?
3. Should the rocking chair be sold in a furniture shop?
4. Is 4 pixels / 0.18 s the right size of hop?
