# Mini-games B: chores, repairs, venues, the first box (2026-11-16)

Owner msgs 163-164 (BIBLE Direction update 33 + its CORRECTION). Builds on worker A (`docs/reports/minigames_a.md`, `docs/reports/minigames_audit.md` section 5).
**No human has played any of these.** A script played them by touch following each game's own hint; difficulty and feel are set by reasoning and want a pass once the owner has tried them.

**UPDATE Stage 122 (2026-11-18):** unpacking the moving boxes / suitcase has NO mini-game any more (`unpack_boxes` removed from ACT_GAME_B in src/data/minigames_b.js, owner playtest list). tools/minigames_b_check.mjs expects the plain action now (small items 2026-11-18). Rows and tests below that play `unbox` on the moving boxes are history.

## What changed for the player

- **The moving boxes** (day one) are the first mini-game of a new game: tap the tape three times, then tap each thing as it comes up out of the box. It shows what is really in that box (the ramen, the pyjamas, the umbrella). It cannot be failed.
- **Laundry**: starting a wash (at home or at the laundromat) now has you load the machine: sort lights from darks. Folding at the laundromat is a folding game.
- **Cleaning**: "A quick tidy" is the dishes (scrub the plates); "Clean the place properly" is a window, the counter and the plates, in a random order.
- **House plants**: watering is a watering game (it used to open the weeding game).
- **Repairs**: the shower tune-up is tightening dripping joints; the stove, TV and computer tune-ups are matching wires (they all used to sort parts into drawers).
- **Venues and the park**: the pool table, the park swings, the duck pond, the pet shop's pen (brushing a dog), the hotel pool's laps.
- **Fishing** is now cast, wait for the bite, reel (it was the reel only).
- **Painting**: every second session at the easel is mixing the colour on the card instead of brush strokes.
- **Studying a skill book** has a short recall round. **Dancing at home** to the stereo opens the dance game. **The shower** has a temperature dial.
- Every game: Auto and the Settings switch give exactly the plain activity; playing well adds a little; nothing is lost by skipping or doing badly. A's "you can turn mini-games off" hint counts these games too.

## The table

"Touch" = started from the real thing in the built game and played by touch (`tools/minigames_b_check.mjs`, 390x844). "Script start" = the walk to the thing or the start was done through `G`, the menu and the game by touch.

| # | Category | Activity (id or label) | Game key | Kit kind | Bonus for playing well | Proof |
|---|---|---|---|---|---|---|
| 1 | Moving boxes (REMOVED Stage 122: unpacking is a plain 20-min action again; the `unbox` kind still exists, unused) | `unpack_boxes` | `unbox` | **unbox** (new) | Fun up to +5, handiness xp | Touch; also Auto, mini-games off, 375 px, gamepad, and from a fresh New Game on day one |
| 2 | Laundry: sort | starting a wash, home washer or laundromat (new short activity "Loading the machine", 3 min, only when mini-games are on) | `sort` | **laundry** / sort (new) | Fresh Clothes lasts 1 to 2 hours longer | Touch at the laundromat (script walk: the washer is behind others on screen); 375 px. Home washer: same call, not run |
| 2 | Laundry: fold | "Folding laundry" (laundromat) | `fold` | **laundry** / fold (new) | Fun up to +3, Fresh Clothes +1 hour | Touch (script walk); 375 px; gamepad |
| 3 | Dishes | "A quick tidy" | `dishes` | **scrub** (new), plates | home cleanliness up to +3 | Touch (script walk: the cleaning cupboard is behind the sofa on screen); Auto; off; 375 px; gamepad |
| 3 | Cleaning, windows | "Cleaning the place properly" | `scrub` | **scrub**: window, counter, plates | home cleanliness up to +6, a little handiness xp | Touch (script walk) |
| 4 | Gardening | `tend_plants` | `water` | **water** (new) | Fresh Air moodlet, Fun up to +2, gardening xp | Touch; 375 px; gamepad |
| 4 | Gardening | `garden` (the beds) | `weed` (A's, unchanged) | quickdraw | as before | not touched: it already fits |
| 5 | Repairs | `sk_tune_shower` | `leak` | targets + a pipe picture | the tune-up as before (3 stars: one more day) | Touch |
| 5 | Repairs | `sk_tune_stove`, `sk_tune_tv`, `sk_tune_computer` | `wires` | **wires** (new) | the same | Stove: touch; 375 px; gamepad. TV and computer: same key, not run from a fixture |
| 6 | Venue timers | `play_pool` (the taproom) | `cue` | timing + a pool table picture | Fun up to +5, gaming xp | Touch |
| 6 | Venue timers | `swing` (the playground) | `swing` | stroke + a swing picture | Fun up to +4 | Touch |
| 6 / 17 | Venue timers / pets | `feed_ducks` | `ducks` | aim (throw) + the pond | Fun up to +4 | Touch |
| 17 | Pets | `meet_animals` (pet shop pen) | `brush` | **scrub**, a dog | Fun up to +5 | Touch |
| 7 | Fishing | `fish_pier` (+ the coach, the date) | `fish` (A's key, new game) | **cast** (new) | the catch as before (size and count by score) | Touch |
| 8 | Swimming | hotel pool "Swimming laps" | `laps` | stroke + a lane picture | Fitness up to +0.8, swimming xp | Touch |
| 11 | Studying | `read_skill_book` | `recall` | memory, 2 rounds | extra xp in the skill the book teaches | Touch |
| 13 | Dancing | `dance_home` (stereo) | `dance` (A's) | rhythm | Fun, as the club's game | Touch |
| 14 | Painting | `paint`, every second session | `paint` (A's key) | **mix** (new) | as the brush game (canvas progress) | Script start (no easel in the test flat), game by touch |
| 16 | Shower | `shower`, `gym_shower` | `dial` | balance + a shower picture | Hygiene up to +8 | Home shower: touch. Gym shower: same key, not run |

Where the character stands while the game runs: boxes `carry`; laundry, cleaning, watering, repairs `work`; shower `shower`; dancing `dance`; reading `read`; swing `sit`; hotel laps = the hotel's own swimmer in the water.
**No matching animation exists** for the pool table, the ducks, the pet pen and fishing: the character plays the activity's existing `stand`. None were added.

## Left out, and why

| Approved item | State |
|---|---|
| Bowling | There is no bowling venue in the game. |
| Darts, arcade cabinets | Already had games (A's audit); untouched. |
| Photography | `sk_photo` / `sk_snap` already have the focus-ring game over the real view; untouched. "Frame before the moment passes" would be a new game: not built. |
| Market: haggle / pick the ripest | Selling already has `haggle`. Buying at a stall opens the shop window (`ui/shop.js`) directly: a "pick the ripest" needs an entry point in that window, which is not mine. Not built. |
| Karaoke | No karaoke activity or venue exists. Instruments already have `song` / `busk`. |
| Club dancing | The club's `dance` already had a game; the home version now shares it. |
| Barber | The cut is already a picker with a preview and a confirm (`sim/hair.js`), then the chair. No game added, as the list says. |
| Pets: fetch, own pets | The player cannot own a pet. Brushing is at the pet shop pen; `pet_cat` (3 min) left plain. |
| Delivery boxes (`homedesign.js` "Unpack", 4-8 min) and the hotel suitcase | Not hooked (and since Stage 122 the moving boxes are not hooked either). The flat-pack already has "Tighten the bolts". |
| Other plain timers | `play_jukebox`, `play_display`, `dig_crates`, `listen_station`, `taste_samples`, `test_pens`, `flip_flash`, `ride_ferris_wheel`, `watch_game`, `bath`, `wash_hands`, brushing teeth, the natatorium / hotel showers: left plain (short or passive; "let's not overdo it"). |
| Folding at home | Home loads put themselves away when dry: there is no fold step to attach to. |

## How it is built

- `src/ui/minigame_b.js`: seven kinds registered through A's `registerKind`: `unbox`, `laundry` (o.mode sort / fold), `scrub` (o.scenes plate / window / counter / pet), `water`, `wires`, `cast`, `mix`. Each has `want()` (tests, keys, pad) and `snap` where a spot must be hit. Scrub also accepts taps, so a gamepad's Confirm scrubs.
- `src/sim/_mg_games.js`: the games (`BG`) and two ways to attach:
  1. a game with a `skill` is added to `G.skillplay.GAMES` and its activities to `GAME_FOR` at init (data `ACT_GAME_B`): skillplay runs it (bonus xp, records, Me app);
  2. a game without a skill runs on the B runner `G.mgB.ride(key, ctx, activity)` (same creep / whoosh, Auto, Stop, result card, no xp). It opens for ids in `ACT_GAME_B` and for any bare `G.startActivity({ ..., mgb: 'key', mgbCtx })`.
- `G.mgB = { ride, wash(load), demo(key, ctx), games, acts, current(), tune }`.
- `src/data/minigames_b.js`: `TUNE_B`, garments, wire colours, paint mixes, `ACT_GAME_B`.
- Changes to A's objects, at run time only, through the exposed `G.skillplay.GAMES` (A's files are not edited): `GAMES.fish.kit` replaced (cast game), `GAMES.paint.kit` wrapped (mix on even sessions), `GAME_FOR.tend_plants` weed -> water, `GAME_FOR.sk_tune_*` fixit -> leak / wires (`assemble_furniture` keeps `fixit`). The tune-up result is still A's `GAMES.fixit.result`.
- `MG-B HOOK` marks: `src/sim/laundry.js` (4: the fold activity's `mgb`, two `G.mgB.wash(load)` calls, `load.mgb` hours in `collect`), `src/sim/supplies.js` (1: `mgb` on the clean activity), `src/sim/hotel.js` (1: `mgb: 'laps'`).
- State: `load.mgb` on a laundry load; `G.state.skillplay.n.mgbPaint` (session counter). Nothing else is saved.

## Difficulty tunables (`TUNE_B` in `src/data/minigames_b.js`)

| Key | Now | Meaning |
|---|---|---|
| `unbox.par / per / floor` | 5 s + 1.6 s per item, floor 0.6 | time before the score drops; it never goes under the floor |
| `sort.n / secs` | 8 garments, 4.4 s each | missed when the garment's time runs out |
| `fold.n / secs` | 4 garments, 6 s | time per garment for full marks |
| `scrub.work / tap / par / secs` | 44 px, 0.5, 1.7 s per spot, 34 s | rubbing needed per spot, what one tap cleans, par, time limit |
| `water.pots / band` | 3, 0.085 | pots per plant, half-width of the green |
| `wires.secs / rounds` | 13 s, 2 | per panel; 5 wires from handiness level 6 |
| `cast.need / secs / bite` | 6.5 s, 20 s, 0.95 s | reel time in the green, reel limit, how long a bite lasts |
| `mix.rounds / secs` | 3, 12 s | colours per game; 2 drops at level 1, 3 from level 2, 4 from level 4 |
| `loadMinutes` | 3 | the "Loading the machine" activity |
| `bonus.*` | see file | the most a perfect game adds |

Pool, swing, ducks, shower, leak and recall use A's kinds; their options are in `BG` in `_mg_games.js`.

## How it was checked

`node tools/minigames_b_check.mjs [walk | home | town | pad | intro]` (built game, headless Chromium, touch; state such as supplies, a plant, dirty clothes, the time of day is set through `G`).

| Part | Result |
|---|---|
| walk: all 15 B games + fish + paint (both) + the 4 scrub pictures start, draw, stay inside the screen | pass at 390x844 and 375x812 |
| 375x812: unbox, sort, fold, wires, dishes, water played to the end by touch | pass (`mgb_375_*.png`) |
| home: boxes (played / Auto / off), quick tidy (played / Auto / off), proper clean, stove wires, plant, dance, skill book, shower dial, shower leak, paint mix | all pass |
| town: laundromat sort and fold, pet pen, ducks, swing, pier, hotel pool, pool table | all pass |
| pad: unbox, dishes, wires, fold, water with the fake gamepad, Confirm only | all 3 stars |
| intro: fresh New Game, creator, home picker, the intro's own Skip buttons, then the first box at one tap per 0.3 s | pass, 3 stars, it is mini-game number 1 of the save |
| page errors in every part | 0 |

Screenshots `out/shots/mgb_*.png` (26): every one was looked at; the pictures show the right things and nothing is clipped at 375 px.

**Not run by anyone:** the home washer's sort; `gym_shower`; TV and computer tune-ups from their fixtures; the fishing coach and the fishing date with the new game; paint from a real easel; the full 5-minute intro without Skip; keyboard; landscape; sound; a save / load in the middle of a B game. A poor score was never produced on purpose, so the "did badly" lines were only read in code.
The robot is faster and steadier than a thumb: 3 stars from it says the game can be finished, not that it is easy enough.

## Size

`dist/index.html`: 14,899,251 bytes before my files, 14,945,635 with them (builds 07:40 and 08:30): **+46.4 KB** (target: under +150 KB). The three source files are 66.6 KB before the build shrinks them.
The last build of this job (08:57) is 15,018,663 bytes: the further +73 KB came from the other workers' files in that half hour, none of mine changed. That leaves about 1.76 MB under the 16 MB limit (16,777,216).
No art files: every picture is drawn with the kit's rectangles and the existing item icons.

## The standard checks (run at the end, on the 08:57 build)

`node src/data/validate.mjs` exit 0; `node tools/build.mjs` ok; `node tools/navcheck.mjs --rooms all` all passed, 0 page errors; `node tools/jobs_check.mjs` all checks pass; `node tools/minigames_check.mjs` (worker A's, whole run) all passed;
`node tools/minigames_b_check.mjs` all passed; `node tools/perf.mjs --verify` VERIFY OK (the first run hung for 17 minutes with no output and was stopped; the second finished in the normal time: it reads the live source tree, so most likely another worker's file was half saved);
`grep -c '(?<[=!]' dist/index.html` = 0.

## Questions for the owner

1. Sorting adds a 3-minute "Loading the machine" step when mini-games are on (there was no moment to attach it to). Fine, or should sorting move to the hamper?
2. Painting alternates brush strokes and colour mixing. Alternate, or mix first and then paint in the same session?
3. Watering plays for every plant, every day (three pours each). With many plants that is a lot: one pour per plant?
4. The pool table, ducks, pet pen and fishing have no matching character animation (the character stands). Worth adding?
5. Market "pick the ripest" and photography "frame the moment" were not built. Wanted?

## Files

New: `src/ui/minigame_b.js`, `src/sim/_mg_games.js`, `src/data/minigames_b.js`, `tools/minigames_b_check.mjs`, `docs/reports/minigames_b.md`.
Edited (marked `MG-B HOOK`): `src/sim/laundry.js`, `src/sim/supplies.js`, `src/sim/hotel.js`.
Not edited: any of worker A's files, `src/engine/*`, `src/sim/audio.js`, `_music_*.js`, the `PAD HOOK` lines.
