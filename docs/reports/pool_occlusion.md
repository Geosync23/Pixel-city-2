# Night-light pool occlusion — resume report (2026-11-18)

## Progress
- [x] 0. Report file created; read LIGHTING_RESUME_BRIEF.md + lighting_as_left/README.md.
- [x] 1. 'Before' build (HEAD 3e2425a engine files = Stage 117/118) built; 9 night shots 500x900 zoom 2 in out/shots/poolocc/before_*.png (downtown 197,264; glass 189,150 t23; harbour 101,326; oldtown 123,263; cars_central 213,326 t22.5; cars_plaza 222,228; juniper 62,231; fade = player at 69.5,235 behind bld.res.loft; fade_oldtown = player behind the teahouse).
- [x] 2. Patch applied cleanly (git apply); the 4 engine files + tools/poolocc_check.mjs are byte-identical to docs/wip/lighting_as_left/files/. Built: dist/index.html (after).
- [x] 3. Read the patch in full (approach notes below when finished). Checks started in background (poolocc -> nightcheck -> perf --verify).
- [x] 4a. poolocc_check re-run by me on the after build (16 spots, --objs 4, --same before): 0 FAIL, [leak] 0 px at all 15 night spots, [ground] 0 px outside silhouettes, [fade] 0 px off, [same] 0 px, no page errors. Same numbers as the old worker's x_poolocc.txt.
- [x] 4b. nightcheck re-run on the after build: 'all checks passed' (8 spots; [7] pools-behind-buildings tiles vs direct 0 px). perf --verify first try: timed out starting the game (tool, not a check failure) - retrying.
- [x] 4c. perf --verify ("same pixels by day"): VERIFY OK, 0 differ everywhere, page errors 0. NOTE: tools/perf.mjs as committed cannot start the game on HEAD (it taps 195,440; the title's Start button is at 195,497 now) - fails the same on the before build, so not the patch. I ran a copy with the tap fixed: out/tools_tmp/perf_fix.mjs (tools/perf.mjs is not mine to edit).
- [x] 5a. 'After' shots taken (out/shots/poolocc/after_*.png) + side-by-side pair_*.png. Looked at juniper + fade so far: roof pool gone, pool still shows (dimmer) through the faded loft.
- [x] 4d. perf before/after (out/tools_tmp/perf_fix.mjs, 3 runs, 4x CPU slowdown, 390x844 dpr 2): out/perf/pocc_resume.md. night_rain fps 56.9 -> 56.3, JS p50 7.9 -> 8.2 ms; night_plaza 58.4 -> 58.2, 6.6 -> 7.2 ms; walk 59.2 -> 58.8, 4.0 -> 4.5 ms. 0 errors.
- [x] 5b. Looked at 9 pair/crop pictures (juniper, fade, downtown, harbour, oldtown + roof crop, cars_plaza, fade_oldtown, fade crop): pools gone from walls/roofs in every one; ground pools, window glow, lamps unchanged; pools still visible (dimmer) through faded buildings. No artefact found.
- [x] 5c. Moving case by numbers (my script, 500-frame walks at juniper and downtown, after build): on-screen stale mask tile in 4 and 7 of 500 frames, longest run 2 and 4 frames; 0 page errors. A filmstrip attempt was not usable (camera lag), so flicker was NOT judged by eye.
- [x] 4e. occl_check (day draw-order pops): watch_harbor x2 before / x2 after: WRONG 0 in all four; full run on after: TOTAL pops 204, wrong 0, page errors 0. (The old worker's one run with 'wrong 28' did not reproduce.)
- [x] 4f. navcheck on the patched tree: 1 FAILED ("In store: Galleria bay by bus (QA16 gap)"), 0 page errors - the same single failure the old worker had (guide-arrow test, unrelated to lighting; not re-run on the before tree by me).
- [x] 4g. Control: poolocc_check on the BEFORE build (2 spots) FAILS as it should: [leak] 5033 px (towers), 15161 px (juniper). So the check does detect the bug.
- [x] 6. Report finished (below). No code changed by me beyond applying the patch.

## Verdict
**It works.** Recommendation: **ship as is** (lead looks at the pictures, publishes), with the small follow-ups under "What's left" as optional later steps.

## What the patch does
Problem: the night light mask is flat, so a lamp's pool (an ellipse on screen) was painted across whatever stood in front of the lit ground (a circle of light on a tower wall or roof whose lamp is on the far side).

Rule (`takes()` in render.js; depends only on where things stand, never on camera or player, so nothing pops):
- lamp on the camera side of the thing (x >= its far-x edge or y >= its far-y edge), its own lamp, or a lamp inside its footprint: the thing takes the pool, as before;
- lamp BEHIND it: no pool on its silhouette (the pool stays on the ground beside it);
- thing well overhead (underside > `NL.over` 1.05 above the lamp, e.g. viaduct deck): no;
- low thing (< `NL.low` 0.5 high), top no higher than the lamp's foot, fountain, `nl:'ground'`: takes every pool, like the ground;
- moving lights (headlights via scene.lights): fade in over `NL.ramp` 0.75 tiles as the car comes out from behind.

How: in the silhouette of a thing where a pool it does not take reaches it, the mask is punched out with the thing's sprite and refilled with the thing's "own light" = ambient + only the pools it takes (`ownLight` / `occPut`), in draw order; anything in front of such a place gets its own light back the same way. For static lamps + placed objects this is baked once into the existing 256 px mask tiles (`_occBake` -> `_occPass`), so a normal frame does no extra work for them. Left to the frame (flag `ob._pd`): see-through (faded) things, members of a draw-order ring, things whose picture keeps changing; their own light is cached per object as a canvas (`_occOwn`, `ob._pl`, dropped after 1800 unused frames) and drawn with the thing's alpha, so a pool shows through a faded building in proportion (alpha x own light + (1 - alpha) x what is behind). Moving lights and big entities (train cars) are handled per frame. At dusk/dawn (mask painted directly) the same pass runs on the frame's item list. Only worlds with `world.poolOcc` (the city); rooms unchanged.

Switch: `?nightlight=noocc` or `G.renderer.nl.occ = false` = old behaviour (checked: pixel-identical to the before build).

## Files / functions touched (266 lines added, 64 removed; build +9.9 KB)
- `src/engine/render.js` (almost all of it): `NL` gets `occ, low: .5, over: 1.05, ramp: .75`; `addLight` now records each pool's world position (`LW/LA/LS`); `LightTap` + `unWS` (world position of hook-drawn pools); new `takes, hexBox, hidden, ownLight, occPut, mayHide, addQ`; `Renderer`: scratch canvas `F` replaces `E`, `_maskKey` (split out of `_maskTiles`; key now includes `world.orev`), `_tileStale`, `_occLoad`, `_occBake`, `_occPass`, `_occStale`, `_occPrep`, `_occOwn`; `_nightE` / `cutDraw` / `pushOp` (op types 3, 4) / `addE` (`EK`, `eSkip`) extended; the "copy of the mask" put-back path replaced by `occPut`; `sortItems` now also marks the placed objects of a ring (`ob._pd`) - its output order is unchanged; `perf()` gets `nlOcc`.
- `src/engine/sprites.js`: `objSpriteIf(ob)` (cached sprite or undefined, never bakes).
- `src/engine/world.js`: `world.orev` counter bumped in add/remove of objects.
- `src/world/_ctx.js`: `world.poolOcc = true` for the city.
- `tools/poolocc_check.mjs`: the test tool (86 lines).

## Checks (all run by me on 2026-11-18, build of the patched tree vs. build of the tree before the patch)
| check | result |
|---|---|
| patch = files in docs/wip/lighting_as_left/files | byte-identical (cmp), applies cleanly |
| validate.mjs, build, lookbehind grep | OK, 14874 KB, 0 |
| `poolocc_check --objs 4 --same before` (16 spots) | **0 FAIL**. [leak] 0 px at all 15 night spots; [ground] on-vs-off differs only inside silhouettes (0 px outside; e.g. towers 5033, juniper 15161, viaduct 11339 px inside); [fade] 0 px off by > 2 levels (worst 0.5); [same] occlusion off = before build, 0 px (incl. day); no page errors |
| same tool on the BEFORE build (2 spots) | FAILS as expected: leak 5033 px / 15161 px |
| `nightcheck` | all checks passed (8 spots; [7] tiles vs direct vs "own light put together" 0 px) |
| `perf --verify` (same pixels by day) | VERIFY OK: 3785 sprites, 784 chunks, 192 citizens, draw order 743 frames, 6 rooms, winter: 0 differ; page errors 0 |
| `occl_check` | full run on after: pops 204, **wrong 0**, page errors 0; watch_harbor 2x before + 2x after: wrong 0 each |
| `navcheck` | 1 FAILED (Galleria by bus, "QA16 gap", same as the old worker's run; unrelated), 0 page errors |
| page errors | 0 in every run above and in all screenshots |

Perf, phone size (390x844, dpr 2, CPU 4x slower, 3 interleaved runs, median; out/perf/pocc_resume.md):
| scene | fps before -> after | 1% low | JS ms p50 | JS ms p95 |
|---|---|---|---|---|
| night_rain | 56.9 -> 56.3 | 22.6 -> 21.2 | 7.9 -> 8.2 | 14.8 -> 16.0 |
| night_plaza | 58.4 -> 58.2 | 27.0 -> 24.5 | 6.6 -> 7.2 | 14.0 -> 14.6 |
| walk (day) | 59.2 -> 58.8 | 27.7 -> 24.8 | 4.0 -> 4.5 | 10.4 -> 11.3 |
So: a small but consistent cost, about +0.3 to +0.6 ms JS per frame at 4x slowdown, under 1 fps (not measured on a real phone). Where: night "amb" part of draw +0.3 ms (2.1 -> 2.4, 2.5 -> 2.8); mask tile bakes 38 -> ~100 per run (tiles repainted when a thing in them fades or gets its picture); by day "items" +0.1 ms (1.43 -> 1.57), probably from the extra ring walk in `sortItems` (my inference, not profiled). Heap unchanged (30.6 -> 32.8 MB). The old worker's run showed the same picture (x_perf.txt).

## Pictures (out/shots/poolocc/, 500x900, zoom 2; pair_X.png = before | after)
| place | camera | what I saw |
|---|---|---|
| downtown | 197,264 t22 | pool ellipse on the glass tower and on the left office wall: gone; street pools, windows, signs unchanged |
| glass (downtown 2) | 189,150 t23 | taken, not looked at |
| harbour | 101,326 t22 | big pool on the Sail Loft roof and warehouse wall: gone; its own wall lamp cone and ground pools unchanged |
| old town | 123,263 t22 | pools on two roofs: gone (crop_oldtown_roof.png) |
| cars_plaza | 222,228 t22 | pools across the tall wall (left) and the helipad roof: gone; plaza, fountain, taxi unchanged |
| cars_central | 213,326 t22.5 | station wall clean; pools still show through the faded warehouse, dimmer |
| juniper | 62,231 t22 | roof pool gone; loft is faded here (player inside its screen box): pool visible through it (crop_juniper_fade.png) |
| fade | player 69.5,235 behind bld.res.loft | see-through loft still shows the pools behind, a little dimmer than before (before: full strength, which was the bug's other face) |
| fade_oldtown | player behind the teahouse | 3 faded buildings, pools show through all, no hard edges |
No pool through a solid building in any picture; no missing ground light, no lost window/lamp glow, no hard-edged patches. The old worker's 16 montages are in docs/wip/lighting_as_left/pictures/ (not re-examined by me).

## What I verified vs. what only the old worker reported
- Verified by me: everything in the tables above, 10 before/after picture views (pairs and crops), reading the whole patch.
- Only the old worker: its 16-spot montages; the `mask_cost` / `prof` micro-benchmarks; the `?nightlight=noocc` third build in the perf run; `navcheck --rooms all`.

## Judgement of the approach
Sound. The rule is purely geometric and static, the result is exact at the silhouette (sprite used as the stencil), the heavy part is cached in the tiles that already existed, and there is a kill switch that is proven pixel-identical to the old game. The tests are independent of the renderer's bookkeeping (lamps really removed from the world) and fail on the old build.
Fragile spots (none failing today):
- It is intricate: ~270 dense lines in the hardest part of render.js, per-object state (`_pd, _pg, _ps, _pc, _pf, _pl, _no`) and tile staleness. Future changes to the night pass need the three checks (poolocc_check, nightcheck, perf --verify) every time.
- `ob._pd = true` (ring member / animated picture) is never cleared, and `sortItems` sets it by day too; such objects are handled per frame with a cached canvas. Over a very long session more objects could end up there (cost creep). Not measured beyond 40 s runs.
- The rule uses the object's box: an L-shaped or hollow object is treated as its bounding box; a lamp in front still lights the whole silhouette including the roof (as before the patch).
- A tile that became stale is shown as it is until repainted (one tile per frame): measured 4 and 7 of 500 walking frames with a stale tile on screen, longest 2 and 4 frames.

## Known gaps / what's left
1. Flicker while moving was checked by numbers only (above), not by eye; a human should walk around at night once on the published build.
2. Headlights behind a solid building: covered by the tool's [moving] test (0 px at all 15 spots) and nightcheck, but the tool's positive control ("light in front changes the thing") fired at only 3 spots, and I have no clear picture of it.
3. No long soak (10+ minutes at night) for the `_pd` growth / own-light canvas memory.
4. `tools/perf.mjs` cannot start the game on the current tree (taps 195,440; the title's Start button is at 195,497, then Continue at 195,440). Independent of this patch. I used a fixed copy, out/tools_tmp/perf_fix.mjs (3 changed lines: import paths + click "Start" first). The lead should fix tools/perf.mjs the same way.
5. Optional micro-optimisation: the day-time +0.1 ms in `sortItems` could be removed by doing the ring marking only at night.
6. Docs: docs/reports/nightlight.md / INTERFACES.md do not mention `NL.occ/low/over/ramp`, `world.poolOcc`, `world.orev`, `objSpriteIf` yet (not my files).

# Step 2: no ground pools on walls at all (owner, 2026-11-18)
Goal: a ground pool is light on the ground only; never on a building's wall or roof, whichever side the lamp is on (step 1 = Stage 119 only removed pools of lamps BEHIND a building).

## Progress (step 2)
- [x] S2-0. Section started. Before build = current tree (Stage 119).
- [x] S2-1. 9 'before' shots (Stage 119 build) in out/shots/poolocc2/before_*.png. Surveyed what keeps the pattern: bld.* (buildings) and some props (rail platform/canopy/pier, shelters, food truck, string lights). Assessment: contained - the rule lives in one function, takes(); change = for bld.* objects no pool from outside lamps at all (own lamps + lights inside the footprint stay). Props unchanged. Switch NL.walls / ?nightlight=nowalls. Edit made (9 lines), built.
- [x] S2-2. First try (outside lamps only) left the airport front lit: the remaining light is the terminal's OWN entrance pool (r 7, owned by the building). Second edit: buildings take no pool from their own lamps either (switch NL.wallOwn / ?nightlight=wallown keeps them). After shots + pairs made; airport front now clean (crop_airport.png). tools/poolocc_check.mjs extended with [walls].
- [x] S2-3. Quick tool runs: after build towers + oldtown pass ([walls] 0 px of 22359 / 16077 visible building px; [leak] 0); Stage 119 build fails as it should ([walls] 766 px, [leak] 702 px at towers). Tool: [moving] 'afterwards' now re-measured after the lit props are started afresh (229 px at oldtown were a lit prop keeping its brightness step, 0 after). Full battery started. Alternative shots with ?nightlight=wallown (own door pools kept on walls): alt_owndoor_*.png, trio_*.png = before | own-door-kept | after.
- [x] S2-4. First full battery found two real problems, both fixed in render.js and re-tested on the failing spots:
  (a) nightcheck [7] at the airport: 2828 px tiles-vs-direct. Cause: with NL.tiles off the mask key was not kept, so see-through things had no own-light copy (a test-only mode, but the real "tile missing" frame does keep it). Fix: the key is kept whenever occ is on (1 line in draw()). Now 0 px.
  (b) poolocc lofts: 38 px did not come back after lamps were removed and restored. Cause: a lamp post (lit-as-a-whole prop) in front of a wall took the wall's darkness when the building was in the tiles but kept the pool pattern when the building was left to the frame (see-through) -> two different pictures of the same world, and darker lamp posts than today. Fix: in _occPass a thing lit as a whole that stands in front of a worked place gets the full pattern back (props look as they did). Now 0 px.
  Tool: fresh() also resets the kept light colour; [walls] moved to the end and reports building px / all px separately.
- [x] S2-5. Second full battery (final render.js): nightcheck all passed; perf --verify VERIFY OK (day pixels unchanged); poolocc 15/16 spots pass, [walls] 0 px everywhere; 1 FAIL at central: [fade] 5 px (worst 19 levels) under the half-transparent edge pixels of a lit palm in front of the faded station - tool now leaves such pixels out (same exception nightcheck [6] has); re-run of central passes. occl_check full: wrong 11 (watch_plaza, vehicle/person; day code is untouched by step 2 - to be re-run before/after).
- [x] S2-6. Perf Stage 119 -> step 2 (3 runs, 4x CPU, 390x844 dpr 2; out/perf/pocc2_resume.md): night_rain 55.4 -> 55.5 fps, JS p50 8.6 -> 8.4 ms; night_plaza 57.9 -> 58.0, 7.2 -> 7.0; walk 59.0 -> 59.1, 4.3 -> 4.1. No measurable cost. 0 errors.
- [x] S2-7. Final full poolocc run with the final tool: 0 FAIL (16 spots). occl_check watch_plaza repeated: Stage 119 build 0, 0, 0, 0, 23 wrong; step-2 build 5, 4, 5, 0 wrong -> the "wrong" count of that watch is run-to-run noise (random traffic), present in both builds; step 2 touches no daytime code. Report section written.

## Step 2: verdict
**It works** for the stated goal: no ground pool is drawn on any building wall or roof. **One decision is needed before publishing: the door glow** (below).

## Step 2: what changed (render.js only, about 20 lines on top of step 1; no redesign)
- `takes()`: a placed object whose id starts with `bld.` (a building) takes NO pool from a lamp outside its footprint, whichever side the lamp is on, and (default) none from its own lamps either. It still takes: a light standing inside its footprint (canopy, depot, pavilion; a moving light ramps in over `NL.ramp`), and the old "low thing / top below the lamp's foot / fountain / nl:'ground'" cases. Props (rail platform/canopy/pier, shelters, food truck, string lights, airport canopy) and everything lit as a whole (people, cars, trees, lamp posts) are unchanged.
- New switches in `NL`: `walls` (default on; `?nightlight=nowalls` = Stage 119 behaviour) and `wallOwn` (default off; `?nightlight=wallown` = a building keeps its OWN door/window pool on its wall).
- `_occBake` / `_occPass`: things lit as a whole are now in the tile pass too and get the full pattern back where they stand in front of a wall that lost a pool (otherwise lamp posts in front of walls went dark, and differently depending on whether the building behind was faded).
- `draw()`: the mask key is kept whenever occ is on (also with `NL.tiles` off), so the direct-paint test mode matches a real direct-painted frame.
- tools/poolocc_check.mjs: new `[walls]` test; `[leak]`/`[moving]` use the step-2 rule; three test-hygiene fixes (kept light colour reset, "afterwards" after lit props are started afresh, pixels under half-transparent edges of sprites in front left out of `[fade]`).

## Step 2: THE DECISION - the door glow
The 178 building-owned lights in the city (r 2.5 to 11) are the door/shop-front spill pools = the warm glow at enterable doors. They are ordinary ground pools, half of which lies on the building's own wall. The airport example is exactly this: the light on the terminal's glass front is mostly the terminal's OWN entrance pool (r 7), not the curb lamp.
- Default as built (strict, owner's wording "no light pools on walls"): the own pool stays on the GROUND in front of the door but no longer lights the wall, the door leaf or a doorstep that is part of the building's picture. Entrances look darker than today (out/shots/poolocc2/crop_oldtown_door.png, trio_juniper.png right).
- Alternative (`NL.wallOwn = true`, one word in the NL line of render.js): street lamps, headlights and other buildings' pools are off the walls, but each building keeps its own door glow on its wall as today. Then the airport front stays lit (trio_airport.png middle).
The brief asked for both "no pools on walls" and "door glow unchanged"; for the wall part these contradict each other, so the lead/owner should pick from the trio pictures. Lit windows, signs, lamp heads and their halos are unchanged in both.

## Step 2: checks (run by me on the final build vs. the Stage 119 build)
| check | result |
|---|---|
| `poolocc_check --objs 4 --same stage119` (16 spots) | 0 FAIL. `[walls]` 0 px change on 1141 to 31945 visible building px per spot when the ~1000 lamps the buildings do not take are removed; `[leak]` 0 px (15/15); `[ground]` 0 px outside silhouettes; `[moving]` 0 px behind and 0 px in front; `[fade]` 0 px; `[same]` occlusion off = Stage 119, 0 px (15/15 + day) ; no page errors |
| same tool on the Stage 119 build (towers, lofts) | fails as it should: `[walls]` 766 px / 939 px, `[leak]` 702 px |
| `nightcheck` | all checks passed |
| `perf --verify` (day pixels) | VERIFY OK: same pixels, page errors 0 |
| `occl_check` | full run: page errors 0, wrong 11, all in watch_plaza; shown above to be noise that the Stage 119 build has too (0 to 23) |
| perf (out/perf/pocc2_resume.md) | night_rain 55.4 -> 55.5 fps (JS p50 8.6 -> 8.4 ms), night_plaza 57.9 -> 58.0 (7.2 -> 7.0), walk 59.0 -> 59.1 (4.3 -> 4.1): no measurable cost |

## Step 2: pictures (out/shots/poolocc2/, 500x900 zoom 2; pair_X = Stage 119 | step 2; trio_X = Stage 119 | own door glow kept | step 2 default)
airport (default spot), downtown 197,264, glass 189,150, harbour 101,326, oldtown 123,263, plaza 222,228, central 213,326, juniper 62,231, fade (player 69.5,235 behind the loft); crop_airport.png, crop_oldtown_door.png; trio_airport / trio_oldtown / trio_juniper.
Looked at by me: airport (pair, crop, trio), oldtown (pair, door crop), harbour, downtown, plaza, fade, trio_juniper. Seen: terminal front, house walls, warehouse wall clean; ground pools reach the wall foot with a straight edge, no dark fringe on the pavement; lamp heads/halos, lit windows and signs unchanged; pools still show through the faded loft. Not looked at: glass, central, trio_oldtown (final versions).

## Step 2: known gaps / what's left
1. The door-glow decision above.
2. A doorstep or plinth that is drawn as part of a building's picture goes dark with the wall (seen at the old-town door). Fixing that needs per-asset marking (out of scope).
3. A light inside a building's footprint still lights the whole silhouette (station hall, gas station, depot, pavilion), and props with roofs (airport canopy, rail canopy, bus shelter) still take pools: left as they are, as instructed.
4. Buildings are recognised by the id prefix `bld.`; a wall-like prop is not covered.
5. Not done: flicker by eye while walking, long night soak, headlights-on-wall picture (only the tool's `[moving]` test: 0 px in front at all 15 spots).
6. tools/perf.mjs still needs the Start-button fix (I used out/tools_tmp/perf_fix.mjs again).

# Step 3 (test): smooth, undithered light on walls (owner, 2026-11-18)
Test variants behind switches; the default build stays Stage 120 strict.

## Progress (step 3)
- [x] S3-0. Section started.
- [x] S3-1. Assessed: the dither is baked into the pool sprite (poolSprite: 5 rings, checker between them); the mask is multiplied over the frame. Walls already get their light re-assembled per building (ownLight/occPut from steps 1-2), so smooth wall light = draw a smooth twin of the pool sprite (smoothOf: one gradient through the ring averages) in ownLight when the thing is a building, and re-work a building's silhouette wherever ANY pool reaches it. ~12 lines, no redesign. Switches ?nightlight=smoothA / smoothB (NL.smooth + wallOwn / walls off). Built; first look at the old-town door: B gives a clean smooth glow on the wall.
