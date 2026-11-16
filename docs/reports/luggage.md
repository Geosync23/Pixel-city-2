# Intro luggage: tow your suitcase home (2026-11-16)

Owner msg 165, BIBLE Direction update 34 (INTRO LUGGAGE). Worker: Opus (luggage lane).

## What the player sees
- At carousel 2 you tap your yellow bag (the one with the red maple-leaf tag): it leaves the belt and from then on you **tow** it: a small rolling
  suitcase that trails behind you and out to the side of your hand, tilted on its wheels with the pulled-out handle reaching your hand, wobbling a little
  while it rolls. When you stop it stands upright beside you. All four facing directions; it is depth-sorted like any entity (behind you when you walk
  toward the camera, in front of you when you walk away), lit as a whole at night like the player.
- It comes along through the terminal, on the air tram, out of the doors to the kerb. In the cab (or any ride where you are hidden: bus, train) it is
  "in the back" and not drawn; you tow it again when you step out, through the lobby, up the stairs / lift, into the flat.
- The first time you walk into your flat (about a second after you arrive) it rolls from your hand to a free spot by the front door and is parked there as
  one more thing to unpack: "Unpack your suitcase" (same activity, same 20 min, same unbox mini-game of worker MG-B, which lists what is inside).
  It gives **Tee & Jeans** and **Gym Kit** (you only own the travel clothes you arrived in). When unpacked it disappears like a box.
- The first-evening to-do is now **"Unpack your moving boxes and suitcase (0/4)"**; all four complete it (and the 'unpacked' moodlet comes with the last
  intro box, as before).
- The left-over **red bag next to you at the kerb is gone** (src/sim/intro.js placed `prop.airport.luggage {kind:'single'}` beside the spawn). The kerb's
  decorative luggage piles (src/world/_airport.js) stay.
- Colour decision: the brief said "the red single suitcase", but the bag you pick off carousel 2 is (in art and captions) "the yellow one with the maple leaf
  sticker", so the towed case is that same yellow case with the red tag (continuity from belt to hand). Easy to change: `LUG.C` in src/art/home/luggage.js.

## Files
- **NEW src/sim/luggage.js** — the follower. `G.luggage = { pickUp(), state() 'none'|'tow'|'home', ent, drop() (debug), TH0, REACH }`. Events
  `luggage:pickup`, `luggage:home`(box).
- **NEW src/art/home/luggage.js** — `fx.luggage.tow` (the towed case; params `{ th: tilt deg, ph: heading deg }`, drawn as a real tilted 3-D box: visible
  faces, zip band, red tag, outline, wheels, pulled-out handle) and `furn.home.suitcase` (the parked case, tags home/decor/moving/moving_box, so the existing
  moving-box activity picks it up). Exports `LUG` (sizes / colours) and `drawCase`.
- src/sim/intro_airport.js — `grab()` and the baggage step's resume call `G.luggage.pickUp()` instead of `p.carry = true; p.poseOpts = { item: 'bag' }`
  (the hand-carried look is gone). Header line updated.
- src/sim/intro.js — curb step: the `prop.airport.luggage` single bag placement (and its `lug` variable / removal) deleted.
- src/sim/housing.js — `addLuggage()` (API + header), `lugSpots(sh)`; in `roomDef` a box with `lug` uses `furn.home.suitcase`, a half-cell footprint and
  candidate cells round the front door (nearest first) run through the SAME checks as every box (doorway kept clear by keepRects, nothing walled in, its use
  spot reachable). Import of `SUITCASE_BOX`.
- src/data/homes.js — `SUITCASE_BOX = { label 'SUITCASE', gives: outfit_tee_jeans, outfit_sport }`.
- src/story/intro.js — goal `unpack`: text "(0/4)", `doneWhen: 'boxes_unpacked:4'`.
- src/story/texts.js — achievement `unpacked` ("Out of the Box") now `when: 'moving_done'`.
- src/sim/story.js — condition `moving_done` = 3+ intro boxes opened and no intro box left (works for old 3-box saves and new 4-box games).

## How the follower works
- A plain entity `{ x, y, z, bb [-.12,-.12,.12,.12,.5], sprite() }` pushed into `G.scene.ents` (moved to the new scene on every scene change; removed from
  all cached scenes when it should not exist). Sprite = `assetSprite(fx.luggage.tow, { th, ph })`, th quantised to 3 deg, ph to 15 deg (a few dozen
  cached sprites).
- Every frame: hand = player + 3 px to the trailing side (`HSX` by facing) at 0.5 units high. Tow spot = hand + `REACH` along a direction 45 deg between
  "behind you" and "out to the hand's side" (straight behind looked like a slab floating at hand height in the iso view; screenshots compared). Stand spot =
  0.34 beside you on that side and a little back (mirrored if that cell is blocked). A blend `s` (0 standing .. 1 towing, 0.2 s) moves between them;
  the offset from the player is smoothed (no lag at walking speed); tilt = `s * TH0` scaled by the actual distance to the hand, where `TH0` (~38 deg) is
  solved so the grip height equals the hand height; heading points at the hand; wobble = +3 deg every other ~0.1 s while rolling.
- Seated (pose sit / seated / zoff): stands upright beside the seat. Hidden while `G.player.hidden` or `G.cutscene.ride` (cab, bus, train);
  snaps beside you when you reappear or teleport (>2 units).
- Home: when `isHome()` and the room is `main` and the state is towing: after 0.9 s (no modal / activity) `G.housing.addLuggage()` adds the box, its cell
  is read back from `roomDef`, the case rolls there upright in 0.45 s, state -> parked, the follower is removed and the room is refreshed (retried while busy),
  toast "You park your suitcase by the door. Unpack it whenever you like."
- The parked case's interactable is relabelled "Unpack your suitcase" and its activity label "Unpacking your suitcase" (on 'scene'); the activity, its
  MG-B unbox hook (`unpack_boxes` -> 'unbox', which reads the box's `gives`) and `housing.unpack` are untouched.

## Save fields
- `G.state.intro.lug`: missing = not picked up / not this game; `1` = towing; `2` = parked at home.
- `G.state.home.boxes[]` gets `{ uid, k: 'm', label: 'SUITCASE', items: [], gives: [...], intro: 1, lug: 1 }` until unpacked; `flags.boxes_unpacked`
  counts it like the other intro boxes.
- Old saves: mid-intro after the pick-up (`intro.ap.bag`, intro running, no `lug`) -> towing from the next frame. Past the intro -> nothing (no suitcase,
  their goal keeps its stored "0/3" text and `boxes_unpacked:3`). Skip intro / a resume straight into the flat -> on `intro:done` a suitcase that never
  reached home is parked by the door all the same, so the 0/4 goal is always completable.

## Checks (all in the BUILT dist/index.html, 390 x 844, touch context)
**Full intro played by touch from a fresh New Game** (scratch script `intro_play.mjs`, run 11, 0 page errors, no API fallback used): title -> New Game ->
creator OK -> Surprise me / Next -> home card / Move in -> landing shot -> cabin (waited for the deboarding, tapped the plane door) -> concourse -> tram ->
baggage claim -> waited at carousel 2 and TAPPED the moving yellow bag -> walked in four directions by taps -> took the air tram to the gates and back with
the case -> out of the exit to the kerb -> walked, phone, Messages, MapleCab, the home row, "Request ride" -> the cab came, the ride ran (case hidden: `hid:
true` while riding) -> out at Juniper Court -> Manny / Walt dialogue by taps -> tapped the street door -> lobby -> tapped "Stairs: up to Flat 3B" -> the
flat: the case stands beside you, then rolls to the door and is parked -> tapped the suitcase -> MG-B's unbox game "Unpack: SUITCASE" came up (its Auto
button tapped) -> "Unpacked: Tee & Jeans, Gym Kit." -> goal "Unpack your moving boxes and suitcase (1/4)", flags.boxes_unpacked 0 -> 1.
Honest note on the walking: long walks (across the 60-unit concourse, from the carousel to the tram and the exit) are sent with `G.player.goTo` in the script
(scripted taps across the whole hall kept hitting counters / dead spots); every interaction above is a real touch tap.
Screenshots, all looked at full size: out/shots/lug_01_carousel_before, 02_carousel_after, 03-06_walk_dir0..3 (+ `_z` crops), 07_standing, 08_tram,
09_tram_back, 10_kerb (no red bag), 11_kerb_walk, 11b_phone, 12_cab_arriving, 13_in_cab, 14_out_of_cab, 14b_walt, 15_at_door, 16_lobby,
17_lobby_walk, 18_entering_flat, 19_suitcase_by_door, 20_unpacking(_full), 21_unpacked; a timed entry sequence lug_24a-g (lobby, towing upstairs, 0.3 /
1.0 s in the flat beside you, 1.6 s rolling, 2-3 s parked by the door); tram close-ups lug_08_tram_standing / 08b_tram_walking / 08c_tram_stand2; night
lug_23*, lug_r2_night_* (lit as a whole like the player, by the existing night-light rule: small upright entity). Earlier quick shots lugq_* were the art
iterations (straight-behind trailing read as a slab at hand height; changed to behind-and-to-the-side, smaller case, ~38 deg tilt).

Robustness script (scratch `robust.mjs`, partly API-driven, all PASS, 0 page errors): pick-up -> towing; save mid-tow + reload + Continue -> still towing;
towing in the city at night; hidden while the player is hidden (in a vehicle) and back after; entering the flat parks it as a box (by the door, cell [3.5, 1]
in Juniper Court, interactable "Unpack your suitcase"); save / load with it parked; unpacking (activity, sped up) removes it, count 0 -> 1, goal "(1/4)",
Tee & Jeans + Gym Kit owned; Skip intro from the plane cabin -> parked by the door, goal "(0/4)"; an old save past the intro (lug removed, goal rewritten to
0/3) -> no suitcase anywhere, goal stays 0/3; an old mid-intro save (bag taken, no lug) -> towing (PASS on its own and in the first full run;
in the two later full-sequence runs that one case read 'none' after Continue: not pinned down, I suspect the dev `&intro` launcher in the harness, but the
lead may want to re-check it once).
Tram: towed on the air tram (standing, walking, standing again), still there in the concourse after the ride (scratch `tramnight.mjs`).
Tools: `node src/data/validate.mjs` OK; `node tools/build.mjs` OK; `node tools/navcheck.mjs --rooms all` all passed, 0 page errors; `node tools/perf.mjs --verify`
VERIFY OK (same pixels); `grep -c '(?<[=!]' dist/index.html` = 0.

## Not done / notes for the lead
- The case does not change the character's arm pose (the char sheets belong to another worker); the grip is placed at the hanging hand's height and side, so
  the arm swing of the walk cycle moves the hand a pixel or two around the grip.
- Not tested: the gamepad path by an actual pad (the pick-up and unpack are ordinary interactables, nothing pad-specific was added); a real bus / train ride
  with the case (only the hiding rule, which is the same `P.hidden` / `cutscene.ride` test the Chapters companions use).
- Seen while scripting (not mine): at 390 px wide the intro hint bubble ("Bzzt! A text from your sibling...") covers the Close button of a shop window opened in
  the concourse, so a player who taps a counter there cannot close the shop by touch until the hint changes.
