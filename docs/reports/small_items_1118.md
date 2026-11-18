# Small items 2026-11-18 (Opus helper, owner msg 263)

## Progress
- [x] A. Test tools vs the Start button. DONE. NEW shared helper tools/title_lib.mjs `titleTo(pg, 'Continue' | 'New Game')`: finds the Start button by
  its text and taps its centre (touch), then the wanted button; no fixed positions. Results (all on the Stage 122 build + the two tree moves):
  - tools/perf.mjs: was tapping 195,440 -> now titleTo. `--scenes walk --runs 1`: runs (48 fps, JS p50 8.6 ms, 0 errors). out/tools_tmp/perf_fix.mjs not needed.
  - tools/minigames_b_check.mjs: titleTo in open(). First full run 38 PASS / 5 FAIL: 3 = the moving-box asserts (intended change, unpack has no game since
    Stage 122) -> rewritten to expect the plain action (box goes, no game opens; the day-one check unpacks ONE box: the old retry loop would now unpack
    them all); 2 = hotel pool laps + shoot pool "NO GAME OPENED, modal:1": a phone notification banner was under a thumb tap and opened the phone
    (screenshot out/shots/small_items/A_mgb_fails.png) -> tool fix: put the phone away before/while tapping a thing. Also: the boxes are now tapped ONCE
    and the tool waits for the box to go (repeated taps could land just as the walk-and-unpack started). After: home 15/15, intro 3/3, town all pass
    (walk / rules / pad passed in the first run). Under heavy machine load (3 browsers at once) "moving box again" and "tune up the stove" failed once
    each and passed on the quiet re-run: timing, not the game (a direct probe unpacked 3 boxes in a row by touch fine).
  - tools/pad_check.mjs: first run 8 PASS / 33 FAIL, all from step 2: after Start the ring is ALREADY on New Game (no save), the tool pressed Down
    once more and landed on Settings -> Down only when needed. Second run 67 / 2: reload -> Continue needed the Start button first (also in --from).
    Third run: 69 PASS / 0 FAIL, 0 page errors.
  - tools/pad_touch_check.mjs: needs an OLD build dir (owner msg 143 comparison). Ran `dist dist` (same build twice): 17 PASS / 0 FAIL, incl. "myday"
    via the To do chip, and no pad layer in a touch session. No change needed (it already taps Start by text).
  - tools/restrooms_check.mjs: no change needed (taps Start by text). 469 PASS / 0 real FAIL until the run hit my 20-min timeout at 'bank' (7 "script
    stopped" = the timeout); the rest re-run with --only: 50 PASS, all passed. Round-trip batch (--only all): 3 PASS (158 rooms, 165 restroom doors, each into its restroom and back; home bathroom), all passed.
  - tools/wishnudge_check.mjs: no change; ALL PASS (11).
  - Also fixed: tools/navcheck.mjs (item C).
- [x] B. Trees under the rail viaduct + rule. DONE. Poplar (54.5,121.5) -> (54.5,128) on the same sidewalk south of the deck (between the drinking fountain at 126 and the
  lamp at 130.5; north side was blocked by the traffic light at 118.5); birch (270.5,121.5) -> (270.5,115.5) same sidewalk north of the deck (south side has the
  bus stop, shelter and a bicycle). How: src/world/_furnish.js RAIL_TREE_MOVES (keyed by the pre-snap spot 54.25/270.25; same random draws, so a dump of all
  4371 city objects before/after differs in exactly these two lines). Rule: NEW tools/railpath_check.mjs (exports LEGS from src/world/_rail.js): an object
  whose footprint overlaps a viaduct deck rectangle and whose top is above the track bed + 0.25 (deckZ, i.e. z ~8.25 north leg, ~6.25 south leg) FAILS;
  top between the deck underside (deckZ - 0.6) and that = warning. Height threshold is relative to the deck, any kind (trees, lamps, signs, poles).
  Before the move: 2 FAIL (exactly the poplar 9.74 and birch 9.55). After: 0 FAIL, exit 0. 10 warnings (things touching the slab underside, train clear):
  cherry (40.5,291.5) top 6.10; palm (114.5,303.5) 5.74; lamp.modern (231.5,121.5) 7.60; birch (236.5,121.5) 7.95; lamp.double (261.5,121.5) 7.95;
  lamp.double at y 303.5 x 261.5/299.5/365.5 top 6.14 (bed 6.0); fir (373,175.5) 6.61; willow (142,120) 7.84. Not moved: none is in the train's path, and the
  lamps carry night light pools (moving them changes lighting). tools/onroad_check.mjs still 0. Shots out/shots/small_items/B_montage.png (poplar
  before/after, birch before/after with a train on the deck), B_birch_full.png, birch_after_spot.png. Needs a rebuild (dist was not rebuilt by me while tests ran).
- [x] C. navcheck "Galleria bay by bus (QA16 gap)". DONE. OLD and a TEST TIMING problem, not a game bug: the Stage 118 tree (git worktree out/wt_118 at
  4a045fd) fails the same row the same way in a full audit run (1 FAILED). Cause: on reaching the city by the Galleria door a first-time window
  ("FIRST TIME · CLOTHES SHOPS The Galleria ...") opens just AFTER the check's dismiss(); the arrow is correctly hidden under it, so the row reads
  "(arrow hidden: modal: FIRST TIME ...)". Intermittent: the row alone (--row Galleria) passes, an --only audit run of the current tree passed.
  Fix (tool only, tools/navcheck.mjs RUN): if the arrow is hidden while a first-time window is up, close it as a player would and read the arrow again.
  After: full navcheck = all passed, 0 page errors.
- [x] D. Long traffic soak. DONE. tools/traffic_check.mjs got `--series` (sample every 10 game minutes: vehicles, vehicles standing > 20 s with where and why,
  JS heap via CDP with a forced GC every 2 game hours, page errors; `--shots` takes a picture when >= 3 stand > 20 s). Run: `--plan soak --days 3 --series
  --shots --jobs 2 --out soak_1118b` = 3 worst-known downtown/maplewood junctions + the walking tour, 3 FULL game days each (05:00 -> 05:00, both rush hours
  three times), honest fast-forward at 60 Hz (the game's own frame()), FLOW_BUS .95 as in the build. 432 samples per run.
  - Gridlock: 0 episodes in all 4 runs. Stop > 60 s: 0.00%. Stop > 20 s: 0.10% of vehicle-time; longest stop 48.4 s (am rush); causes of > 20 s stops:
    junction held by crossing traffic 19, signal 16, other 4. Stuck-queue s/h 0.9 overall (am rush 7.7). Box events 0.4/h. Ghost (drive-through unstick) 0.4/h.
  - Vehicles around the camera: mean 10.3, peak 19 (am rush 12.1 / pm rush 12.2 mean). Per run min/mean/max: 5/10.2/16, 4/9.7/15, 5/11.3/17, 2/9.7/18.
  - Buses: 3174 dwells on screen, all 2.0 s; 16 (0.5%) held anyone up (20.5 vehicle-s). Headway table in out/traffic/soak_1118b.md.
  - Heap (after GC, every 2 game hours): 28.0 -> 31.7 (day 2) -> 32.0 MB (end), same shape in all 4 runs: a plateau, no growth. Page errors 0.
  - Samples with any vehicle standing > 20 s: 0 / 3 / 5 / 0 of 432; only one with >= 3: day 1 22:01 at the downtown 234,296 junction (a truck and a
    delivery van at the signal for 28 s at 235,303-310, a sedan held by crossing traffic at 233,288.7): it cleared by the next sample. Picture
    out/shots/soak_1118b_soak_downtown_234_296_1.png is not useful (camera under the viaduct; and the fast-forward piles up overheard-chat bubbles).
  - Not a jam anywhere. Overlap pair-s/h 30.8 (3.6 visible) and stuck-despawn 29/h are the tool's usual background numbers (see traffic2.md).
  - Raw: out/traffic/soak_1118b.{md,json} (series per run in the json), heat map out/shots/soak_1118b_heat.png. (First try soak_1118 had heap from
    performance.memory, which is bucketed in headless Chromium: replaced by CDP.)
- [ ] E. Long night lighting soak
- [ ] F. Touch pass (night walls, first evening from a new game incl. arrival intro)
- [ ] G. Doc upkeep
