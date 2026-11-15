# QA sweep, Wave A (Opus QA & data lane, 2026-11-15)
This covers the 124 Wave A rooms (53 `pub:<n>`, 46 `lobby:<n>`, 24 home rooms, conservatory) and the data and wiring chores. Unless a line says "inferred from code", I ran it myself:
headless Chromium with a scratchpad driver that uses one browser for many steps, real `G.useInteractable` walks, real DOM clicks on shop, choose and decorate buttons, and real Playwright mouse moves and clicks in Decorate.
All screenshots were taken from `src/` (not `--dist`) and looked at by me as montages.

## Defects
| room / area | what | severity | status |
|---|---|---|---|
| pub:9, 10, 11, 13, 15, 16, 20, 24, 52, 55, 57, 58, 60 (food rooms with the counter against the left wall) | The venue "Restroom" door was put on the left wall in the staff aisle **behind the counter**. Customers walked round the counter end into the kitchen side to reach it. (Coordinates checked: door spot y < counter B[1], with the staff standing at that side.) | medium | **Fixed** in `src/sim/bladder.js`: `okSpot` now rejects spots between a counter and the wall its staff face (±0.75 tile past the ends). These 13 rooms now get a sign stand on the customer side. Doors went from 25 rooms to 12; signs went from 30 to 41. Re-surveyed all 53 pub rooms + cafe/bar/grocery/central_station/deptstore/conservatory: every restroom has a pathfinder path from the spawn. A real walk-and-use was run in pub:2 (door), pub:9, pub:57 and cafe (signs). |
| office lobbies (restroom doors `furn.lobby.restroom`, tags `toilet` + `lobby_restroom`) | bladder.js's `toilet` handler turned the restroom DOOR into "Toilet", a sit-down activity in front of a wall (inferred from code; lobbies.md also says so). | medium | **Fixed** (bladder.js): a `lobby_restroom` / `restroom` fixture without seats gets "Restroom", the fade-out visit. Verified in lobby:7: label "Restroom", bladder 20 -> 100, event `bladder:relief` kind restroom. |
| office lobbies at night | The welcome glow stayed on at closed offices. | low | **Fixed** in `src/sim/stalls.js` `refresh()`: lobby doors use `G.lobbies.isOpen`, and the conservatory door uses `G.conservatory.isOpen()`. Measured by counting mat-sprite draws at 21:00: closed offices draw 0, forced-open draws 18 per 300 ms, residential always 18, an office at 11:00 draws 18. The static warm light pool (`w.lights`) at each door is still lit: it is not toggleable without touching the world lights. |
| Wander guide | The barber's "Fresh cut" service stamped "Treat Yourself to a Service" instead of "Get a Fresh Haircut" (the regex looked only at the service id). | low | **Fixed** (guide.js): it also matches cut/trim/shave/fade and barber/salon place kinds. |
| lobby coffee kiosks | Kiosk drinks did not cost any bladder. | low | **Fixed** (rooms/lobbies.js): `G.bladder.drinkAmount` is applied (espresso and flat white count as caffeine). Verified live: before the tweak a flat white cost 10; after it an espresso costs 14 (the caffeine rate). |
| HUD goals panel (`src/ui/goals.js:55`) | The header shows the literal text **"null"** ("Goals null · 1 more") when there is an opportunity but no appointment today, because `null` is passed to `replaceChildren`, which stringifies it. Seen after Hattie's opportunity started. | medium (visible text) | **Needs the owner of goals.js**: filter the children (`[...].filter(Boolean)`) before `replaceChildren`. |
| shop window (`src/ui/shop.js:121`) | Drinks whose `course` is not 'drink' (e.g. Matcha Soda, Fountain Soda) get an **"Eat here"** button, although `eatIn` treats them as drinks. | low | Needs the owner of shop.js: test `it.category === 'drink'` too. |
| lobby:36 (and lobby:42 nearly) | A standing NPC spot sits on top of the parked bicycle, so the NPC appears to stand on it. | low | Not fixed (layout coordinates; for the lobby builder). |
| residential walk-up lobbies (e.g. lobby:34, 41, 44, 45) | Sparse and a bit dead: a bench, a runner, mailboxes and stairs on a large empty floor. | low (taste) | Not fixed. Suggest a plant, a shoe rack, or a pram or parcel pile in the walk-up family. |
| sign stands (non-solid) | A few stand in the open floor rather than against a wall: pub:17 between manicure tables, pub:43 near the counter, pub:18 by the fridge. They do not block anything. | low | Not fixed. The placement prefers back walls but falls back to the open floor. |
| home bathrooms (housing.js, known gap) | A second shower placed in Decorate is auto-fitted right beside the first. In Easel House it stands against the sink. | low | Already in bladder_bath.md. For the housing owner. |
| office lobbies after 20:00 | Nothing walks the player out at closing time, and the staff NPCs stay. Only the door refuses entry. | low | Not fixed (it is a feature, not a small fix). |
| laundromat | The activity bar once read "99m left" for the 45 min "Wash & dry". | ? | Not reproduced on a clean run (42m left, `minutes` 45). Most likely state left over from earlier steps in that run. |
| conservatory guide entry | `patchGuide` in sim/conservatory.js overwrites the info's 8-item try-list with its own 7 items. | cosmetic | Left as is. |

Visual sweep: I looked at all 124 rooms at 13:00 (zoom 3, cropped montages), 15 rooms at 21:30, and 10 rooms in portrait 390x844. Apart from the rows above I found nothing wrong.
- No clipped or overlapping furniture, nothing floating half inside walls, no sort glitches.
- The player spawn never faces a wall: dir 3 at front exits, and the three side-door homes face into the room.
- Counter signs match their places.
- Text on the back walls reads cleanly. Text on the left walls is rough, as already noted in the reports, and none of it is mirrored.
- Night lighting in the rooms looks right.
- The conservatory cannot be seen at night: entering after 19:18 walks you out, as designed.

## Played end to end (results)
- **Eat-in at 6 food rooms** (Night Owl, Silver Spoon, Nine Dragons, Addis Table, Seoul Ember, Jade Rabbit): walked to the counter ("Order"), the shop window opened, I clicked the first "Eat/Drink here" button, paid, the player walked to a free seat and the eat/drink activity ran. Seated pose was seen at the diner booth, Jade Rabbit floor seating, mesob and grill table; the summary toast and bladder cost applied. All 6 OK. Most picks were drinks because of the row order. "Linger a While" was offered afterwards.
- **Services**: Otis & Sons "Fresh cut" $18 (barber chair, sit), Lacquer Lounge "Manicure" $20 (manicure table), Suds & Bubbles "Wash & dry a load" $4 (bench), Black Cat Ink and Ink & Ivy "Flip through flash art" (tattoo bench). All charged, sat, finished, and emitted `service`. A paid tattoo was not picked.
- **Bladder over a simulated day**: 100 -> 83 -> ... -> 15 at 12:00 (17/h). `need_to_go` at 12:00, `bursting` from 13:00, the `bladder` tip shown at 12:00, a "Bladder" bar in the HUD, and the "Bladder: need to go" toast.
- **Restrooms**: venue door (pub:2) and sign stands (pub:9, pub:57, cafe) by real walking took 2-4 s, bladder -> 100, then the `relieved` moodlet. The office lobby restroom (lobby:7) worked after the fix.
- **Home toilet + sink** (Juniper, after `housing.start`): Bathroom door -> bathroom, "Use the Toilet" seated (zoff .42), bladder 15 -> 100, `relieved`; "Wash hands" hygiene 47 -> 56 (+3 bonus included).
- **Old-save migration** (a crafted pre-Wave-A save, written into localStorage and loaded with `G.load()`, then entered from the city door):
  - The save had no `shellV` and no `bathV`, `needs.v.bladder` deleted, no `G.state.bladder`, and 14 pieces at v1-style coordinates: a sofa in the stairwell void, a plant in the void, a wall clock on the bath-door wall spot, a tub and a shower in the main room.
  - Result: nothing lost, all placed pieces pass `check()`, every interactable has a pathfinder path, the shower and tub went to `:bath`, bladder = 70, `G.state.bladder` was created, and the "rebuilt: 8 of your things were moved" toast showed.
  - A second save/load left the items byte-identical (idempotent).
- **Decorate with real pointer input** (Easel House):
  - Picked "Hand-Me-Down Futon" in the tray. The ghost followed the mouse, green then "tap again to place", and a click placed it.
  - Clicked the placed sofa to select it, then Move. A spot behind the moving boxes was refused in red ("Something is in the way").
  - Picked "Rainfall Shower" and clicked the main-room floor: it was plumbed into the bathroom.
  - In the bathroom, Decorate opened and a Monstera was placed by mouse ("Water the Plants" appeared). Done rebuilt the rooms and the modal count was back to 0.
- **Conservatory**: entered from the city door; ticket bought at "Tickets & tours" ($4, the gates open, stamp `x:cons_visit`); fed the koi (50c, `x:cons_koi`); photo viewfinder opened and an early snap gave "photo of a leaf" (good-shot timing not attempted); sketched the orchids (stamp, sketch count 1); joined the tour via Wendell (it reached stop 4 of 7 in ~35 s at speed 4; the full tour was not finished); Hattie's chain started (`cons_cuttings` goal, 3 cutting pois listed). The "Rare Finds" plaque stays hidden at chain 0.
- **Lobbies**:
  - Notice board (lobby:26): 3 notices, then the real `read_noticeboard` activity ran, with stamp `act:read_noticeboard`.
  - Directory (lobby:19): tenant list and `lobby:directory`.
  - Coffee kiosk "Fuel Coffee Cart": menu, $4 flat white, the real `lobby_coffee` activity (6 min), energy up, stamp.
  - Residential lift: "Residents only..." toast.
  - Closed-hours toast at 21:00: "Quay Street Labs is closed. The lobby is open 07:00 – 20:00."
- Regression after all changes: entered all 124 rooms with 0 console warnings or errors. `node src/data/validate.mjs` OK. `node tools/build.mjs` OK (dist 3429 KB).

## Part 2 — data / wiring done
- **Guide <- placeInfo** (`src/sim/guide.js`):
  - `placeEntry` looks up `placeInfo(name)`. A hand-made room's own blurb replaces the template, and `signature` / `tryThis` are stored on the entry.
  - Lobbies get type "Office lobby" / "Apartment lobby", chapter Sights (+ Services for offices), price Free, tags lobby/office/apartment, and real hours (offices 07-20, residential 24 h), so OPEN/CLOSED badges work.
  - Search also matches the signature and try-this text.
  - Checked in game: all 100 infos land on entries, with 100 signatures and 100 try-lists.
- **Venue activities with `venues: ['*']`** used to be skipped by the guide because no place id matched. They now link to the places whose info lists the activity id or its fixture tag.
  - Venue-specific ones (e.g. `linger`) also link to converted places through the same PUB_ALIAS table as sim/activities.js.
  - Results: dig_crates 4 places, read_noticeboard 21 lobbies, lobby_coffee 4, linger 33, browse_books 4, meet_animals 1.
  - Guide totals after the change: 348 entries, 125 stamps.
- **Entry page** (`src/ui/phone_guide.js`): a "Don't miss:" hint box for the signature and a "Try this" list under the prose. Looked at in portrait for Wax & Wane Records and the Conservatory.
- **Conservatory Things To Try**: 7 new experiences, stamped from conservatory events in `wire()`:
  - Sketch the Orchids
  - Join the Glasshouse Tour (≥ 5 stops)
  - Read All Twelve Plaques
  - Sit and Breathe
  - Take a Seedling Home
  - Make a Wish at the Lily Pool
  - Help Hattie the Gardener (chain 3)

  These and the conservatory's own 3 stamps form a new stamp page, "The Glasshouse", after "Big days out". The sketch stamp was verified live.
- **Activities** (`src/data/activities.js`):
  - New `read_noticeboard` (tag `noticeboard`) and `lobby_coffee` (tag `coffee_kiosk`, fixed 6 min), both `venues: ['*']`. Both tags were added to `FUNCTION_TAGS.venue`.
  - New tag names were used on purpose: the lobby art keeps `lobby_board` / `lobby_coffee`, so the generic activity handler never adds a second interactable.
  - `src/scenes/rooms/lobbies.js` runs them: the board shows its notices and then `G.activities.start('read_noticeboard')`. The kiosk keeps its priced menu, then starts `lobby_coffee` with the drink's effects in `onDone`, and falls back to the old timer.
  - `src/sim/lobbies.js` now registers `read_noticeboard` / `lobby_coffee` in each lobby's info `activities` when the room really has a cork board / kiosk (read from the room def's items).
- **Closed-office glow**: see the defect table (`src/sim/stalls.js`).

## Not tested / limits
- NPCs using the new seats, toilets or turnstiles (the crowd was not inspected).
- Touch input on a real phone. Decorate was driven with the mouse only.
- Hattie's chain past step 1 (collecting the cuttings in the city), a full 7-stop tour, a quality-3 butterfly photo, buying a seedling, the lily-pool wish, and reading all 12 plaques. The stamps for these are wired from code and have not been triggered live.
- The title-screen "Continue" path: the old save was loaded with `G.load()` and the city door was entered in the same page, not after a page reload.
- Moving home with bathroom furniture, other seasons, audio.
- A test-harness note: `?scene=city` test pages open with a story `say()` dialog that holds `G.modal`. Interactions silently do nothing until it is dismissed. This is not a game bug, but it is worth knowing for future QA scripts.
