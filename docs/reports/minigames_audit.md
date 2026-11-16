# Mini-games audit (MINI-GAMES WORKER A, 2026-11-16)

Owner msgs 158, 162-164 (BIBLE Direction updates 30, 32, 33 + the CORRECTION). This is the state of the game BEFORE worker A's build
(section 6 says what A changes; `docs/reports/minigames_a.md` is the record of what was built). Worker B: start at section 5.

How to read "fits": **yes** = the game is the thing the character is doing; **roughly** = same family, wrong picture; **NO** = a different action.
"Shared by" = how many different activities / places open that same game.

There are four families of mini-game in the code:

| Family | Where the code is | What it is |
|---|---|---|
| The shared KIT | `src/ui/minigame.js` (kinds), attached to activities in `src/sim/skillplay.js` (`GAMES`) through data `GAME_FOR` in `src/data/skills_extra.js` | A sheet at the bottom of the screen over the running activity. 8 kinds before this job: timing, rhythm, trace, memory, balance, aim (throw / pour), sort, quickdraw (+ custom: arcade cabinets, chess). Auto / Stop / Pause on every sheet |
| Job plays | `src/sim/_jobplay_kit.js` + `_jobplay_games.js` (25 jobs), ordinary tickets in `src/ui/jobs.js` (pick / meter / belt / mash) | One pink ticket per shift; purpose-built for each job; some reuse a kit game |
| Venue specials | each showpiece's own file (natatorium, hotel, museum, fish hall, lighthouse, observatory, conservatory, arena, aquarium, city hall, post office, university) | Own small DOM / canvas games, written for that one place |
| Phone games | `src/ui/phone_play*.js` (PlayBox, 7 games) | Games the character plays ON the phone: they are the activity |

## 1. Every activity that opens a kit game today (`GAME_FOR`)

| Activity (id) | What the character is visibly doing | Game key (kit kind) | Fits? | Shared by |
|---|---|---|---|---|
| Cook... (`cook`), all 181 stove recipes | stands at the stove, `work` anim | `flip` (timing bar, a pan) | **NO for most**: only flipped dishes (pancakes, omelettes, burgers...) | 2 activities + line cook job + 2 Chapters + dates = every one of 212 recipes |
| Make a No-Cook Dish (`prep_cold`), 31 recipes: salads, sandwiches, smoothies, juice | stands at the fridge / counter | `flip` | **NO** (the owner's "pan-flipping a smoothie") | as above |
| Lift Weights (`gym_weights`): bench, squat rack, dumbbells, kettlebells, cable | `lift` anim | `reps` (timing bar) | yes (the picture is only an icon: roughly) | 2 |
| Work Out at home (`exercise_home`): yoga mat, dumbbells, HOME TREADMILL, spin bike, rower, punching bag, kettlebells, power tower, balance trainer, ping-pong, climbing wall, hoop | `lift`, or `treadmill` on the treadmill, `sit` on bike / rower / mat | `reps` | **NO** on everything but the weights (the owner's "treadmill = lifting weights") | 2 |
| Run on the Treadmill (`gym_treadmill`) on a treadmill | `treadmill` anim | `stride` (2-lane rhythm) | yes | 2 |
| "Run on the Treadmill" on a gym EXERCISE BIKE or ROWER (both carry the art tag `cardio`, which `tagsFor` turns into `treadmill`) | sits still on the machine (`sit`) | `stride` | **NO** (wrong name, wrong game, no movement) | — |
| Gym punching bag (`gym.bag`) | nothing: it has no activity at all | — | **missing** | — |
| Join the Yoga Class (`gym_yoga_class`, only at 8 / 12 / 18 h) | `stand` on a mat | `pose` (balance) | yes; but the mats do nothing outside class hours | 1 |
| Go for a Jog (`jog`) | walks the path | `stride` | yes | 2 |
| Shoot Hoops (`sk_hoops`) | `lift` at the hoop | `hoops` (aim: throw) | yes | 1 (+ coach, Chapter) |
| Swim in the Bay (`sk_bay_swim`) | a swimmer drawn in the water | `swim` (2-lane rhythm) | yes | 1 (+ a date) |
| Study at a Desk / Online Course (`library_study`, `computer_study`) | reads / types | `study` (memory pads) | roughly (worker B: studying) | 2 |
| Sketch the Scene (`sketch_outdoors`) | sits on a bench | `sketch` (trace) | yes | 1 (+ Chapter) |
| Assemble It Yourself (`assemble_furniture`) | `work` at the box | `fixit` (sort parts into drawers) | roughly | 5 |
| Tune Up the Stove / Shower / TV / Computer (`sk_tune_*`) | `work` at the appliance | `fixit` | roughly: sorting parts is not repairing (worker B: repairs) | 5 |
| Practise an instrument (`practice_instrument`) | sits and plays | `song` (3-lane rhythm) | yes | 1 (+ coach) |
| Busk for Tips (`sk_busk`) | plays on the street | `busk` (rhythm) | yes | 1 |
| Paint (`paint`) | `work` at the easel | `paint` (trace: brush strokes stay on the canvas) | yes | 1 |
| Write (`computer_write`) | types | `write` (quickdraw: catch ideas) | yes | 1 (+ Chapter, uni) |
| Photograph the View / Street (`sk_photo`, `sk_snap`) | holds the phone up | `photo` (focus ring over the real view) | yes | 2 (+ coach) |
| Tend a Garden Bed (`garden`) | `work` in the bed | `weed` (quickdraw) | yes | 2 |
| Water the Plants (`tend_plants`) | `work` at a house plant | `weed` (pull weeds) | **NO**: watering is not weeding (worker B: gardening) | 2 |
| Hit the Dance Floor / Dance Along (`dance`, `sk_dance_home`) | `dance` | `dance` (3-4 lane rhythm) | yes | 2 |
| Fish off the Pier (`fish_pier`) | stands with a rod | `fish` (balance: line tension) | yes | 1 (+ coach, a date) |
| Play Games / Computer Games / Lobby Arcade (`play_games`, `computer_games`, `play_arcade`) + the mall cabinets | sits / stands at a screen | `arcade` (4 cabinets, pick one) | yes | 3 + mall |
| Play Chess (park / online) | sits at the board | `chess` (find the fork) | yes | 2 (+ coach, Chapter) |
| Mix a Drink (`sk_mix`) | `work` at the fridge | `pour` (aim: pour, three pours) | yes | 1 (+ bartender job, Chapter tea, cider festival) |
| Sell at the Market (`sk_sell`) | talks to the trader | `haggle` (timing) | yes | 1 |
| Put a Look Together (`sk_style`) | stands at the wardrobe | `outfit` (sort to rails) | yes | 1 (+ retail job) |
| Build an App / Code (`sk_code`, `sk_code_lib`) | types | `debug` (memory) | yes | 2 (+ uni) |
| Open Mic / Street Comedy / Jokes in the Mirror | talks | `punchline` (timing, a stage) | yes | 3 |
| Strike Up a Conversation (`sk_smalltalk`) | talks | `smalltalk` (pick the reply) | yes | 1 |
| Throw Darts (`play_darts`) | stands at the board | `darts` (aim: throw) | yes | 1 |

## 2. Other places a kit game is played

| Place | What is happening | Game | Fits? |
|---|---|---|---|
| Chapter step `minigame:flip` (`_chapters_play.js`) | Bea's Maple Oat Pancakes at Nana's stove | `flip` | yes |
| Chapter step `minigame:cook` | the apple-maple PIE with Nana | `flip` | **NO**: a pie is baked |
| Chapter steps `minigame:hoops / chess / sketch / write` | as named | same keys | yes |
| Chapter step `minigame:pour` | three cups of tea from the copper pot | `pour` | yes |
| Chapter steps `fm_auction`, `mus_dig`, `obs_trace` | the venue's own game (falls back to a kit game when the venue cannot run it) | own | yes |
| Dates / friend scenes: `cook` (`_rel_play.js`) | "two people, one stove", any recipe they like | `flip` | **NO** unless the dish is flipped |
| Dates: `activity:swim`, `fishing_spot`, `minigame:fixit` | as named | `swim`, `fish`, `fixit` | yes / yes / roughly |
| University practicals (`data/university.js` `game`) | sear a steak (timing), still life (trace), first draft (quickdraw), tests (memory), four chords (rhythm), speech (timing ring), pond dipping (sort), tap washer (balance) | kit defs of their own | yes (written for each class) |
| City festivals (`data/cityevents.js`) | petal shower (quickdraw), fireworks (rhythm), high striker (timing), ring toss (aim), cider press (pour), lantern wish (trace), light switch-on (timing ring) | kit defs of their own | yes |
| Coaches (`COACHES`) | chess, music, hoops, garden, fishing, photo lessons | the skill's game | yes |
| Job plays that reuse a kit game | line cook: `flip` at the grill (yes); bartender: `pour` (yes); retail: `outfit` (yes); hair stylist: trace (yes); observatory guide: focus ring / rhythm cues (yes); florist, barista, dock worker: timing (roughly, fine); fitness trainer: balance + timing (roughly) | | |

## 3. Job plays, venue specials, phone games (purpose-built: all fit)

- **Job plays** (25, `_jobplay_games.js`): barista (regulars + lever), grocery clerk (heavy to light), line cook (the rail + flip), office analyst (odd number), courier (route), fitness trainer, librarian (by the number), nurse (triage + pulse), dock worker (stacking), bartender (read the room + pour), gate agent (passes), baggage handler (belt), station agent (doors), retail (occasion + rails), museum guide (the group), florist (three kinds + wrap), aquarist (morning round), gull cook (timers), hotel bell (real places), observatory guide, hair stylist (the cut), radio host (hit the post), teacher (hands up), reporter (three voices), firefighter (turn out). Six of them are the same "put it in order" game with different skins: that is the thinnest spot in the jobs, but each skin matches its job.
- **Ordinary job tickets** (`ui/jobs.js`): pick / meter (timing or hold) / belt / mash. Generic, quick, labelled per task. Fine.
- **Venue specials**: natatorium (stroke rhythm for lengths, dive timing, the Novice race, aqua-aerobics and pool-party beat games), hotel (pour-and-shake cocktail, keep-the-beat dancing, auction), museum (dig pit: brush the sand), fish hall (falling-price auction clock, sweep, taps), lighthouse (the stair climb, the lamp), observatory (eyepiece focus, constellation trace), conservatory (butterfly photo timing), arena (half-court shot, T-shirt catch), aquarium (touch-pool order), city hall (microfilm reel, plaza busking, the stall), post office (parcel tape, sorting), university work-study (shelving sort), home design (tighten the bolts).
- **Phone games** (PlayBox): Market Match, Rooftop Pidge, One More Cast, Stack & Ship, Bay Pairs, Cab Connect, Tap the Beat.

## 4. The MISMATCH list and the fix

| # | Mismatch | Fix | Who |
|---|---|---|---|
| 1 | All 212 recipes play the pan flip (smoothies, salads, soups, cakes, tea...) | A set of cooking games (blender, chopping, stirring, pan flip, oven, deep fryer, assembling, pouring, kneading) and a mapping of EVERY recipe to one of them; `validate.mjs` fails on a recipe without a game | A |
| 2 | Home treadmill, spin bike, rower, punching bag, yoga mat, climbing wall, ping-pong, hoop: all play "Clean reps" | The game is chosen by the MACHINE, not the activity: treadmill = stride, bike = cadence, rower = strokes, bag = tap the targets, mat = hold the pose, weights = reps, hoop = hoops, climbing wall = reach the holds, ping-pong = rally | A |
| 3 | Gym exercise bike and rower say "Run on the Treadmill", play the stride game, and the character sits still | Their own activities (Ride the Exercise Bike, Row) with their own games and a moving animation | A |
| 4 | Gym punching bag does nothing | New activity "Hit the Bag" + the targets game | A |
| 5 | Gym yoga mats do nothing outside class hours | New activity "Stretch on a Mat" (any time) + hold the pose | A |
| 6 | Chapter: the apple-maple pie is a pan flip | The oven game | A |
| 7 | Dates: "cook together" is always a pan flip | The recipe's own game | A |
| 8 | Water the Plants = pulling weeds | A watering game (fill each pot to the line) | **B** (gardening) |
| 9 | Tune-ups / repairs = sorting parts into drawers | A repair game | **B** (repairs) |
| 10 | Studying = memory pads | fine as is, or a studying game | **B** (studying) |

Places where variety is thin (not wrong, just the same game often):

- `timing` (stop the marker) carries 9 different things: flip, reps, haggle, punchline, photo (ring), sear (uni), high striker, switch-on, florist / barista / dock in jobs. After this job cooking and the gym stop leaning on it.
- `rhythm` carries 8: stride, swim, song, busk, dance, fireworks, uni chords, observatory cues. Each has its own lanes and picture; acceptable.
- Six jobs share the "put it in order" play.
- `fixit` (sort) carries 5 activities: one repair game from B fixes that.

## 5. Activities with NO mini-game today (for worker B)

All ids below are in `src/data/activities.js` unless a file is named. "Plain timer" = the activity bar runs and that is all.

| Category (BIBLE 33) | Activity (id) | Tag / where | File of the flow |
|---|---|---|---|
| Laundry | wash + dry: "Watching the wash go round" / "Waiting for the dryer"; "Folding laundry" (no ids: `G.startActivity` labels) | home machine, laundromat (`service:laundry`, `laundry_machine`) | `src/sim/laundry.js` (2 `startActivity` calls) |
| Dishes / cleaning | "Cleaning the place properly" / "A quick tidy" / "Tidying up"; "Brushing your teeth" | home | `src/sim/supplies.js` (2 `startActivity` calls; dishes are counted in `addClean`) |
| Dishes | `wash_hands` (sink) | anywhere | `src/data/activities.js` |
| Shower dial | `shower`, `bath`, `gym_shower` (also the hotel / natatorium showers) | home shower / bath, gym lockers | `src/data/activities.js`; `src/sim/hotel.js`, `src/sim/natatorium.js` |
| Fishing | has `fish` on `fish_pier` (A leaves it); the fish hall / lighthouse have their own | | `src/sim/skillplay.js` GAMES.fish |
| Gardening | `tend_plants` plays `weed` (mismatch 8); house plants | home `plant` | `src/sim/houseplants.js`, `src/data/skills_extra.js` GAME_FOR |
| Repairs | `sk_tune_stove`, `sk_tune_shower`, `sk_tune_tv`, `sk_tune_computer`, `assemble_furniture` play `fixit` (mismatch 9); flat-pack "Tighten the bolts" exists | home | `src/data/skills_extra.js`, `src/sim/homedesign.js` |
| Pets | `meet_animals` (pet_pen), `pet_cat` (street cat), `feed_ducks` (duck pond) | venue / world | `src/data/activities.js`; animals: `src/sim/_crowd_animals.js` |
| Swimming | pool lanes: the natatorium has its own stroke game; hotel pool "SWIM_MIN 30" is a plain timer | | `src/sim/natatorium.js`, `src/sim/hotel.js` |
| Venue games that are plain timers | `play_pool` (pool table), `play_jukebox`, `play_display` (toy demo), `dig_crates`, `listen_station`, `taste_samples`, `test_pens`, `flip_flash`, `ride_ferris_wheel`, `swing`, `watch_game` | venue `*` / world | `src/data/activities.js` |
| Photography | `sk_photo`, `sk_snap` have `photo`; SkyDeck and the conservatory have their own; `enjoy_view`, `stargaze`, `watch_planes` are plain timers | | |
| Market | `browse_wares`, `browse_books`, shopping at stalls (`src/sim/stalls.js`); selling has `haggle` | | |
| Unpacking boxes | `unpack_boxes` (moving_box, `carry`); delivery boxes "Unpack" | home | `src/data/activities.js`; `src/sim/homedesign.js` (hd_box), `src/sim/goods_sheet.js` |
| Studying | `read_skill_book`, `library_read`, `library_computer` plain; `library_study`, `computer_study` play `study` | | |
| Karaoke / instruments | `practice_instrument` has `song`; `play_jukebox`, `listen_music`, `watch_live_music`, `listen_busker` plain; no karaoke activity exists | | |
| Club dancing | `dance` (bar dance floor) has `dance`; `dance_home` ("Dance Like Nobody's Watching", `music` tag) is a plain timer; hotel dancing has its own beat game | | |
| Painting | `paint` has `paint`; `contemplate_art` plain | | |
| Barber | haircut / colour: 1 `startActivity` in the chair | barbershop, Bloom Beauty | `src/sim/hair.js` |
| Other plain timers (probably should stay plain) | `sleep`, `nap`, `nap_sofa`, `lounge`, `store_groceries`, `grab_snack`, `microwave_meal`, `heat_on_stove`, `eat`, `drink`, `use_toilet`, `watch_tv`, `watch_cooking_show`, `read_novel`, `computer_find_job`, `computer_gig`, `computer_browse`, `computer_shop`, `change_outfit`, `chat`, `phone_call`, `check_phone`, `watch_movie`, `bar_hang_out`, `linger`, `try_on`, `people_watch`, `picnic`, `smell_flowers`, `watch_fish`, `read_noticeboard`, `lobby_coffee` | | |

Notes for B:

- A game attaches to a `G.activities` activity by ONE line of data: `GAME_FOR[activityId] = 'gameKey'` (`src/data/skills_extra.js`) plus an entry in `GAMES` (`src/sim/skillplay.js`): see the header of skillplay.js. Activities started with a bare `G.startActivity` (laundry, cleaning, the barber) need a call to `G.minigame.play(def)` in their own file.
- New kit kinds: `G.minigame.registerKind(name, impl)` (documented at the top of `src/ui/minigame.js`); register from your own `src/ui/minigame_b.js`.
- The switch (`G.skillplay.auto()` true = mini-games off) and the "you can turn mini-games off" hint are handled inside `play()` / skillplay: a game started through `G.minigame.play` counts towards the hint by itself. If a flow of yours bypasses skillplay, check `G.skillplay.auto()` before opening a game.

## 6. What worker A builds from this audit

Mismatches 1-7 above; new kit kinds; the Settings switch and the hint. Details, mapping tables and how each was checked: `docs/reports/minigames_a.md`.
