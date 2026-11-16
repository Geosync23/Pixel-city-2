# Mini-games A: cooking and the gym fit what you are doing (2026-11-16)

Owner msgs 158, 162-164 (BIBLE Direction updates 30, 32, 33 + CORRECTION). The audit of everything that existed is `docs/reports/minigames_audit.md`.
Worker B builds the new categories (laundry, dishes, shower, pets ...) from section 5 of the audit.

## What changed for the player

- **Cooking**: 10 games; every one of the 212 recipes opens the ONE that fits the dish. The game shows the dish (its icon, its colour, its ingredients as the things you chop or stack).
- **Gym and home exercise kit**: the game is chosen by the MACHINE. The bike and the rower have their own activities now (they used to say "Run on the Treadmill"), the punching bag and the mats (outside class hours) can be used, and the character pedals / rows / punches / holds a pose instead of sitting still.
- **Settings > Game > Mini-games: On / Off** (the same switch as the one in the Me app, which still works).
- **A hint** "Tip: you can turn mini-games off in Settings." above the game sheet the 2nd, 3rd and 4th time any mini-game opens in a save; never again after that. It blocks nothing and can be tapped away.
- Mini-games appear EVERY time (the old "one watering game a day" rule in skillplay is removed, per the CORRECTION). Auto and Stop work as before.
- A side effect worth knowing: every kit game had the browser's blue tap flash over the canvas on Android-style touch (seen in the screenshots as a blue wash right after a tap). `.mg-cv` now turns it off.

## Cooking: the games and the mapping

| Game key | Kit kind | What you do | Recipes | Examples |
|---|---|---|---|---|
| `flip` (existed) | timing | tap in the green to turn it | 36 | pancakes, omelette, grilled cheese, burgers, pan fish, stir-fries and fried rice (the wok toss), crepes |
| `ck_stir` | **stir** (new) | circle the pot at a steady speed | 53 | all soups and stews, pasta sauces, curries, risotto, porridge, scrambled eggs, hot chocolate, chai |
| `ck_oven` | **golden** (new) | take it out in the golden window, 3 trays | 47 | everything with the oven flag: cakes, cookies, pies, roasts, pizza, lasagne |
| `ck_build` | **sequence** (new) | place the pieces in the order on the card | 26 | sandwiches, wraps, tacos, burritos, maki, onigiri, bowls, parfait, tiramisu |
| `ck_fry` | golden, fryer picture | lift the basket when golden | 11 | fish & chips, karaage, fried chicken, samosas, churros, donuts |
| `ck_knead` | rhythm, 2 lanes | push, fold in time | 10 | sourdough, focaccia, bagels, croissants, cinnamon rolls, bao, gnocchi, flatbreads, mochi |
| `ck_chop` | **sweep** (new) | tap as the knife crosses each mark, 3 ingredients | 9 | salads, guacamole, bruschetta, fruit salad |
| `ck_pour` | aim (pour; existed) | fill to the line, 3 cups | 8 | tea, coffee, juice, lemonade, spritz, iced latte, ice pops, maple taffy |
| `ck_blend` | **hold** (new) | hold to blend, let go before it overflows | 7 | smoothies, lassi, milkshake, horchata, hummus |
| `ck_boil` | golden, pot picture | lift it out at the right moment | 5 | boiled eggs, dumplings, dim sum, mussels, seafood boil |

Where it lives: `src/data/cookgames.js`. `cookGameOf(recipe)` = the override table `BY_GAME` (every dish that needed a decision, listed under its game: about 100 ids) and then a rule
(drinks: blended names -> blend, simmered with 3+ ingredients -> stir, else pour; oven flag -> oven; soups / pasta / rice -> stir; no-cook: salads -> chop, the rest -> build).
A recipe the rule does not reach returns null and **`node src/data/validate.mjs` fails** ("recipe X: no cooking mini-game"); it also fails on an override naming a recipe or game that does not exist.
A new recipe therefore needs either to fall under the rule or one word in `BY_GAME`.

Results are exactly the flip's: the dish is made as usual; playing adds bonus cooking xp by score; three stars (0.85+) gives one extra serving (the existing `cooked` hook in skillplay);
a poor score only changes the line on the card; Auto / off = the usual result, never a penalty.

`src/sim/activities.js` now passes `recipe: r.id` in the cook activity's ctx (one field) so the game knows the dish.

Also fixed from the audit: the Chapter's apple-maple pie is the oven game (`_chapters_play.js`), the pancakes step passes its recipe; dates "cook together" use the recipe's own game (`_rel_play.js`).
NOT changed: the line cook's job play (flip at the grill: fits), the university kitchen practical (searing a steak on a timing bar: fits).

## Gym and exercise: one game per machine

| Machine (art id) | Activity | Animation | Game key | Kit kind |
|---|---|---|---|---|
| treadmill (gym, home) | Run on the Treadmill / Work Out | `treadmill`, standing on the belt | `stride` (existed) | rhythm, left-right |
| exercise bike, spin bike | **Ride the Exercise Bike** (new `gym_bike`) / Work Out | **`cycle`** (new) | `spin` | **cadence** (new): tap to pedal, hold the speed in the band over the hills |
| rowing machine | **Row** (new `gym_row`) / Work Out | **`row`** (new) | `row` | **stroke** (new): press at the catch, hold the pull, let go at the finish |
| punching bag | **Hit the Bag** (new `gym_bag`) / Work Out | **`punch`** (new) | `punch` | **targets** (new): hit the spot that lights |
| yoga mat, balance trainer | **Stretch on a Mat** (new `gym_stretch`, any time) / yoga class / Work Out | **`yoga`** (new) | `pose` (existed) | balance |
| bench, squat rack, dumbbells, kettlebells, cable, power tower | Lift Weights / Work Out | `lift` | `reps` (existed; now shows a lifter and a barbell) | timing |
| home climbing wall | Work Out | `lift` | `climb` | targets (holds on a wall) |
| home ping-pong table | Work Out | `lift` | `rally` | rhythm, 2 lanes |
| home basketball hoop | Work Out | `lift` | `hoops` (existed) | aim |

`machineGameOf(machineId(fx))` in `src/data/cookgames.js` (regex on the art id + goods kind; default `reps`). `gameFor(activityId, ctx)` is the single lookup skillplay uses
(`G.skillplay.gameFor(id, ctx)`): recipe for `cook` / `prep_cold`, machine for `MACHINE_ACTS`, `GAME_FOR` for everything else.
Fitness gains as before: the activity's own fitness per hour, plus Fitness +(score x 1.0 to 1.4) when played, +0.35 to 0.5 on Auto.

Gym data: 4 activities in `src/data/activities.js`, function tags `exbike`, `rower`, `punchbag`, `yoga_mat` (+ `src/data/venues.js`), `tagsFor` in `src/sim/activities.js` sends each cardio machine to its own tag.
The player now stands ON the treadmill / mat (the fixture's pose spot) when it is free. Four new character animations in `src/art/chars/char.js` (`cycle`, `row`, `punch`, `yoga`: pose data only, a few lines),
their frame rates in `src/core/char.js` and `_crowd_core.js`; the gym's NPCs use them too (`_crowd_rooms.js` AMAP).

## The kit (`src/ui/minigame.js`): new kinds and the hook for worker B

| Kind | Options | Touch | Keys / pad |
|---|---|---|---|
| `hold` | `o.need` secs of holding, `o.rise` | hold, let go | Space / Confirm held |
| `cadence` | `o.need`, `o.zone` | tap anywhere | Space / Confirm pressed |
| `stir` | `o.need`, `o.zone` | draw circles round the pot | Space / Confirm held and released (a pad's press lands on the middle of the pot = hold-to-stir) |
| `targets` | `o.spots [[x, y]]`, `o.n`, `o.life`, `o.r`, `def.scene` | tap the lit spot | Space / Confirm hits the lit spot (`snap`) |
| `sequence` | `o.pieces [[label, colour, icon?]]`, `o.rounds`, `o.len` | tap the tiles in order | Space / Confirm places the next piece (`snap`) |
| `sweep` | `o.rounds`, `o.marks`, `o.speed`, `theme.icons`, `theme.pal` | tap anywhere on the mark | Space / Confirm pressed |
| `golden` | `o.rounds`, `o.zone`, `o.style 'fry'`, `theme.color2` | tap anywhere | Space / Confirm pressed |
| `stroke` | `o.strokes`, `o.period`, `o.zone` | press, hold, let go | Space / Confirm held |

None of the new kinds is lane-based, so the pad's lane buttons are unchanged; kneading and the rally are the old `rhythm` kind and get the lane buttons as before. The `PAD HOOK` markers are intact; one was added
(an untrusted pointer = a pad's Confirm lands on `want().x / y` when the game sets `snap: true`).

**registerKind** (documented at the top of minigame.js): `import { registerKind, draw, W, H } from './minigame.js'; registerKind('name', E => gameObject)`, or `G.minigame.registerKind(name, impl)` at run time
(false when the name is taken). `G.minigame.kinds` lists them, `G.minigame.draw` has the pixel helpers. The hint is shown by `play()` itself, so any game opened through the kit counts.
Counters in the save: `G.state.skillplay.n.mgSeen` / `mgTip`.

## How each thing was checked

`node tools/minigames_check.mjs` (new; `walk`, `play`, `gym`, `rules`, `pad` run one part). Built game, headless Chromium, touch. State is set up through `G` (ingredients in the fridge, recipes learned, cooking level,
the save's hot plate turned into a range, a gym pass, teleport home / to the gym); everything the player does is a real touch at a screen position. The games are played by following each game's own hint.

| What | How | Result |
|---|---|---|
| All 212 recipes: the mapped game exists and starts (opens, draws, stops) | script, 390x844 and 375x812 | pass, 0 page errors |
| 23 machine types (gym + home goods): mapped game exists and starts | script (a stand-in fixture id for the home goods) | pass |
| One dish per cooking game from the real kitchen: tap the stove / fridge, the recipe window, Cook, play by touch, the dish arrives | played by touch: pancakes, berry smoothie, garden salad, tomato soup, choc chip cookies, fish & chips, boiled eggs, cheese sandwich, lemonade, flatbreads | 10 of 10 pass; screenshots `out/shots/mg_cook_*.png` (looked at every one) |
| Every gym machine from the gym floor: tap the machine, 15 min, play by touch; the animation and the game are the right ones | played by touch: treadmill, bike, rower, bag, mat, bench, squat rack | 7 of 7 pass; `mg_gym_*.png` (looked at), `mg_gym_anims.png` = the six animations close up |
| Auto (touch on Auto) on a dish and on the bike | touch | usual servings, no game result |
| Settings switch by touch; with it off a dish and the bike run with no game | touch | pass; `mg_settings.png`, `mg_settings_off.png` |
| The hint: five games in a row | script + screenshot `mg_tip.png` | shown on 2, 3, 4; not on 1 or 5; counter in the save = 3 |
| Fake gamepad (`tools/pad_lib.mjs`), Confirm only | 8 games: punch, blend, build, oven, row, spin, stir, chop | all finish with 2-3 stars |
| `validate.mjs`, `build.mjs`, `navcheck --rooms all`, `jobs_check`, `perf --verify`, lookbehind count | run | all pass, 0 page errors, lookbehind 0 |

**Nobody ran / only read in code:** the home exercise goods through a real placed fixture (the test save has none: the mapping and the game start were checked with a stand-in id, the animation code path is shared with the gym);
the Chapter pie step and the date "cook together" step in their scenes (the game key they now call was played from the kitchen); the climbing-wall, ping-pong and home-hoop games from a real fixture (started by key only);
keyboard play by hand (the Space path is the same code the pad test exercises through hold / tap); landscape; sound. No human thumb has played these: difficulty and feel (especially the stir circle speed and the rowing window) are tuned by reasoning and a robot that follows the hints, so they may want a pass after the owner tries them.

## Size

`dist/index.html`: 14,853,644 bytes before, 14,899,219 after: **+45.6 KB** (of the 16 MB limit: 14.21 MiB used). Nearly all of it is this work: the 8 kit kinds 27 KB, `cookgames.js` 8 KB, the skillplay games 8 KB, the rest small edits (other workers' changes in the same hours are in the number too, but small). No art files were added: every picture is drawn by the kit with rectangles and the existing item icons.

## Questions for the owner

1. Stir-fries, fried rice and noodles use the pan flip (as a wok toss). Fine, or should they stir?
2. The yoga class and stretching show a flexing-arm picture in "Hold the pose" (the old game). A small yoga figure there would be a cheap follow-up.
3. Kneading and the ping-pong rally reuse the falling-notes game with new words. If they should have their own pictures, say so.
4. The hint appears above the game for about 7 seconds. Long enough?

## Files changed

New: `src/data/cookgames.js`, `tools/minigames_check.mjs`, `docs/reports/minigames_audit.md`, `docs/reports/minigames_a.md`.
Owned and edited: `src/ui/minigame.js`, `src/ui/minigame.css`, `src/sim/skillplay.js`, `src/data/skills_extra.js` (GAME_FOR), `src/data/activities.js` (gym activities, tags, anim names), `src/data/venues.js` (gym function tags), `src/data/validate.mjs`, `src/ui/phone_settings.js` (one card).
Small edits in shared files (each re-read right before editing): `src/sim/activities.js` (recipe in ctx, gym tags, machine animation + pose spot, `boxing` in RAW), `src/art/chars/char.js` + `src/core/char.js` + `src/sim/_crowd_core.js` + `src/sim/_crowd_rooms.js` (four animations),
`src/sim/_chapters_play.js` (2 lines), `src/sim/_rel_play.js` (2 lines), `src/ui/phone_me.js` (the skill page lists every game of the skill), `src/sim/_guide_data.js`, `src/sim/traits.js`, `src/data/traits.js` (the new gym activity ids in three lists).
