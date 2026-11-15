# Last-metre guidance: the arrow leads to the exact thing (owner msg 102, BIBLE update 19) — worker report

Files: NEW `src/sim/navgoals.js` (objective model + all resolvers + room-graph fixes, API `G.navGoals`), NEW `tools/navcheck.mjs` + `tools/navcheck.audit.json` (regression check),
`src/ui/navarrow.js` (two hooks + one margins fix, about 8 lines). `src/sim/navigator.js` and `src/ui/phone_map.js` were NOT changed. No hook was needed in any system file.

## What was wrong (reproduced for real, portrait 390x844, before the change: `?ngoff`)
The arrow's arrival rule ("within 4 units of the destination the waypoint is cleared") fired at the DOOR, and nothing knew what the player had come to do.
| owner's case | what happened before |
|---|---|
| Courier, a delivery to Dot's Diner | Depot: no arrow at all until the bag was loaded (the shift task had no arrow). Street: arrow "Dot's Diner", 4 km. At the door: "You have arrived", waypoint cleared, arrow gone. The parcel is handed over by tapping a small gold marker AT the door; the owner tapped the door instead and went in. Inside: no arrow, no waypoint, nothing to deliver to (122 of 122 frames without an arrow). |
| Council meeting from the plaza | Arrow to City Hall, cleared at the door. Rotunda: no arrow. Nothing pointed at the Council Chamber or a seat. |
| A play at the Lantern Playhouse | Arrow to the Playhouse, cleared at the door. Lobby: no arrow to the box office, the "Auditorium" curtains or the seat. The arrow's room graph also did not know that "Auditorium" leads to the hall (its target was unknown), so even a waypoint into the hall would have pointed at the street exit. |

## The mechanism (general, not three patches)
- **Objective** = `{ room, find, label, short?, far?, near?, done?, quiet?, name? }`. `find` is an interactable label regex, a fixture tag, an asset id, an NPC id, an entity test, an explicit spot, a function, or a list of those.
- **Resolvers** (one per system, all in navgoals.js) derive the current objective from live public state about 5 times per second. Kinds: `strong` (active shift task, gig), `commit` (ticket held, appointment in its window, meeting signed up for: also picked up without a waypoint while you are inside the building), `default` (needs a waypoint: the till, the ticket desk, a chain step).
- **Which one wins**: a waypoint / trip destination selects the building; what the player tapped (goal row, appointment row, need-chooser row, the Map's "Where to?" row, a Wander entry) gets +1000; then resolver priority (commitments 60-80 > chain steps 5 > default 0). A trip that is still travelling (walk to the stop, ride, cab) keeps navarrow's own guidance.
- **Following**: `ui/navarrow.js compute()` asks `G.navGoals.guide(o)` first. City: the building door ("Go in: X → what"). Wrong room: the door toward it through the scene graph ("Stairs up → the Wedding Room"). Right room: the target itself with the label. Nothing to point at: a chip.
- **Arrival** is decided by the objective, not by the door: `done` (seated, handed over, talked to, clocked in...) or `near`. Then the waypoint / trip is cleared with the usual "You have arrived: ..." toast + sound. A door that refuses you (closed) falls back to the old arrival at the door after 2.6 s.
- The arrow label may now wrap to two lines (CSS in navgoals.js) so "Your seat: row C, seat 12. Tap it to sit" fits a phone.

## API (`G.navGoals`, documented at the top of src/sim/navgoals.js)
`guide(o)`, `current()`, `set({ room, find, label, done?: event | fn, near?, name? })` / `clear()` (pin an explicit objective: for any future system), `define(id, kind, prio, fn(ctx), selFn?)`, `select({ goal | appt | need | entry })`,
`locate(find)`, `rootOf(roomId)`, `doorOf(roomId)`, `fixEdges(sceneId, edges, live)`, `path(from, to)`, `list`, `off` (debug switch; URL `?ngoff`). Events `navgoal`(id), `navgoal:done`(id, step). State `G.state.navgoals = { sel, pin }`.
A system that wants to declare its own target: `G.navGoals.set({ room: 'cafe', find: { npc: 'rosa' }, label: 'Deliver to Rosa at the counter', done: 'mysystem:delivered' })`, or add a resolver with `define`.

## Hooks added per file
- `src/ui/navarrow.js`: (1) `edges()` returns `G.navGoals.fixEdges(...)` (1 line); (2) `compute()` asks `G.navGoals.guide(o)` before its own logic and stops if the objective completed there (3 lines). Both commented.
  (3) `margins()`: phone banners and toasts push the arrow's top edge down (max 42% of the height), the shift HUD `#jobhud` (bottom left in portrait) is kept clear, margins re-measured every 12 frames instead of 20; the final clamp line uses it (3 lines). Found from the screenshots: the arrow at the top edge sat under the banner / toast.
- `src/sim/_jobs_work.js`, `jobs.js`, `shows.js`, `ui/goals.js`, `planner.js`, showpiece sims, `hud.js`, `phone_guide.js`: **none**. Everything is read from public state: `_jobs_work.cur()` / `city.get()` (already exported), `G.shows.run / tickets()`, `G.cityhall.*`, `G.arena.*`, ... What the player picked is read from the click itself (`[data-g]`, `[data-a]`, `[data-fix]`, `[data-navrow]`, Wander's "Take me there").
- The courier's hand-over inside a venue is an interactable that navgoals adds to the room ("Hand over the parcel"); it calls the job's own city interactable, so pay, timing and the next stop are the job system's.

## Audit: every way the game points the player at a place
"Before" for every row with a waypoint: the arrow went to the door and was cleared there; inside there was nothing (unless noted).
| # | case | before | after: the arrow ends at (room · target · verb) | resolver |
|---|---|---|---|---|
| 1 | Job shift tasks, all 10 jobs (in-room) | only the small gold canvas markers, no arrow, no text | workplace · the fixture of the current ticket step · the task name ("Take Order"). Colour puzzles (shelve / stack): a chip "find the red marker (Fiction)" so the puzzle is not spoiled | `shift` (reads the work engine) |
| 2 | Courier: load the bag | no arrow | depot · the parcel shelf · "Load the Bag" | `shift` |
| 3 | Courier: each delivery / express parcel | arrow to the door, cleared at the door; delivery only at the door marker | street: stays on the door: "Deliver here: tap the gold marker, or go in". Inside the venue: the counter · "Hand the parcel over at the counter" (new hand-over spot). Homes / lobbies: door only | `shift` + hand-over |
| 4 | Courier: scan in after the last drop | nothing led back to the depot | "Back to work: Scan In" → depot door → the scanner | `shift` |
| 5 | Gigs (dog walking, flyers, furniture) | waypoint cleared 4 units from the spot although you must tap the teal marker | stays on the spot: "Post a flyer: tap the teal marker" | `gig` |
| 6 | Clock-in (shift appointment, "Shift at X" opportunity) | cleared at the door | "Go in: X → clock in"; walking in clocks you in, then row 1 takes over; early: chip with the time | `clockin` |
| 7 | Show ticket: Orpheum film, Symphony Hall concert, Lantern Playhouse play | cleared at the door | no ticket: lobby · Box office. Ticket: lobby · "Screen 1" / "Auditorium doors" / "Through the curtains: show your ticket" (before doors: "Doors open 19:45: tap the door to wait") → hall · your seat "row C, seat 12. Tap it to sit". Done when seated | `show` |
| 8 | City Hall council meeting (Tue/Thu 18:30; planner "Speak at the council meeting"; Wander event) | cleared at the door | rotunda "Council Chamber: this way" → chamber · a gallery bench "take a seat in the gallery" · done when watching. Signed up: "until the chair calls you", then the podium. Fountain chain: the speakers' list | `council` |
| 9 | City Hall wedding (yours / as a guest) | cleared at the door | stairs → Clerk's floor · "sit with the guests" (yours: the register in the Wedding Room) | `wedding` |
| 10 | Appointment with the mayor | cleared at the door | stairs → secretary until the time → "The Mayor's Office" → the mayor | `mayor` |
| 11 | Permits & Records queue | cleared at the door | Permits & Records · "Take a number" → a waiting seat "Ticket A29: 3 ahead of you" → "Your number is up: window 4" | `records` / `ch_chain` |
| 12 | Fountain chain steps | goal waypoint to the door | window 4 → archive microfilm / drawer 62-F → Mr. Bell → speakers' list → window 5; Marta in the city when the goal row is tapped | `ch_chain` |
| 13 | Arena event with a ticket | cleared at the door | concourse "Into the bowl → your seat" → bowl · "Your seat: tap it" · done when seated; before doors: the turnstiles with the time; no ticket during an event: box office | `arena` |
| 14 | Conservatory / Museum guided tour | cleared at the door | ticket desk if no ticket → the docent "Guided tour at 13:00: meet the docent here" / "tap the docent to join" | `cons_tour`, `mus_tour` |
| 15 | Planetarium show | cleared at the door | ticket desk if no ticket → "Planetarium → the Star Theatre" → a seat · done when seated | `obs_show` |
| 16 | Aquarium feedings / keeper talks (6) | cleared at the door | the room and spot of that show, e.g. Turtle Lagoon · "hold out a lettuce leaf" | `aqua_show` |
| 17 | Hotel restaurant (hunger / dinner appointment / room `hotel_restaurant`) | cleared at the door | "The Gilded Maple → your table" → Host stand or "Your table" | `hotel_dine` |
| 18 | Hotel ballroom events, your hotel room (energy) | cleared at the door | ballroom steward; lift → 7th floor → your bed | `hotel_event`, `hotel_room` |
| 19 | Fish auction (05:30-07:30) | cleared at the door | the auction rostrum "bid at the rostrum" | `fish_auction` |
| 20 | Lighting the lighthouse lamp | cleared at the door | cottage → stair → stair → watch room → ladder → lantern · "Light the lamp: the great lens" · done when lit | `lh_lamp` |
| 21 | Natatorium swim / lesson | cleared at the door | front desk "buy a swim" → lockers "change" → showers "rinse" → pool · Coach Midge (lesson) or the lanes | `nat_swim` |
| 22 | Showpiece opportunities (9 chains) | goal waypoint to the door | the person / fixture of the step (Benny → TEAM ONLY → Coach; Hattie; Dr. Okafor; Dr. Halvorsen / Great Telescope; rehab pool / Dr. Reyes; Odile; Old Halvorsen / rostrum / Silas; Walt). Scattered city items (cuttings, lost objects, suitcases, clues, the lucky ball, the release beach) when the goal row is tapped | `*_chain` |
| 23 | Appointment with a friend (invitation, your own plan) | cleared at the door | that NPC wherever they stand in the room: "Coffee with Kit: say hello to Kit"; not there yet: chip | `meet` |
| 24 | Story beats (appointments with `data.beat`) | cleared at the door | the first NPC of the beat; the scene starts by itself when you are there (done) | `story` |
| 25 | Need chooser (HUD) and the Map's "Where to?" (food / coffee) | cleared at the door | hunger: "Order" (home: Cook / fridge) · bladder: Restroom (home: Bathroom → Toilet) · energy: Order a coffee (home: Bed) · hygiene: shower | `need` |
| 26 | Wander "Take me there" on a place | cleared at the door | the counter / desk (row 28). Entries INSIDE a building (Galleria shops, SkyDeck features, station piano...): that shop / fixture | `wander` |
| 27 | Map "Set waypoint" on a Galleria shop (`mall:<key>`) | worked already (navarrow) | unchanged: the shop counter | navarrow |
| 28 | Plain waypoint to any venue (Map, tips, cab destination, taxi arrival, Wander) | cleared at the door | the till / counter / front desk / ticket desk ("Shop at the counter"); none found: arrival on entering. Closed venue: old arrival at the door | `default` |
| 29 | Home | arrival at the door | unchanged: nothing further (unless a need picked it, row 25) | - |
| 30 | Planner "Leave now" alert → Take me there | cleared at the door | whatever the appointment is: rows 7-24 | by place + time |
| 31 | Intro | own hint bubbles + cab trip arrow | unchanged (see "played") | - |
| 32 | City targets (bus stops, stations, stalls, park spots, friends on the street) | arrival within 4 units | unchanged | navarrow |

## Room graph (STEP 3)
`node tools/navcheck.mjs --only graph [--rooms all]` goes into every room, USES every door-like interactable (G.go intercepted) and compares with the arrow's edge list; then checks `G.navGoals.path` room → city and room → every other room of the same building, and that `G.navArrow.route` returns the first door of that path.
Result on the final code: 200 rooms, 377 doors used, 201 room-to-room routes, 0 problems (run with `--rooms all`; the default run samples pubs and lobbies: 107 rooms).
Gaps found and fixed (the `GRAPH` table in navgoals.js; `fixEdges` merges it into navarrow's edges):
- Homes (all 12): "Bathroom" is a plain interactable → the arrow could not lead to the toilet / shower. "Leave" of 6 homes had an unknown target.
- Playhouse + Symphony Hall "Auditorium" (the curtains): target unknown. Cinema "Screen 1" pointed at the retired room `cinema:hall` instead of `cinema:screen1`.
- Arena: "Into the bowl" x2, "Turnstiles" x2, "TEAM ONLY", "Tunnel to the court", "Team tunnel": no edges.
- Hotel: the four lifts were single guesses (lobby → 7th floor, 7th → roof bar, roof → lobby, spa → lobby), so e.g. lobby → roof bar had no path. Each lift now leads to the three other floors. "Room 7xx" → `hotel_room`; the second spa stair.
- Observatory: "Planetarium: the Star Theatre", "Stairs to the dome & terrace", the roof's second "Stairs down".
- Aquarium: the five inner doors were known only while standing in the hall (so Turtle Lagoon → Behind the Scenes had no path); the Deep's two stairs.
- SkyDeck lifts (known only live), airport tram both ways, Natatorium's street exit.
Not in the graph on purpose: `airport:plane` (one way), `cinema:hall` (retired), `lobby:4` (old id of City Hall).

## Played for real (pathfinder walking, interactables used by walking to them, DOM buttons clicked; portrait 390x844; from `src/`)
Every run follows ONLY the arrow (`G.navArrow.target()`), with a per-frame monitor: frames where a waypoint / trip / objective is active, nothing modal is open and no arrow or chip is shown.
The 30 case runs were made while the module was being finished; after the last small changes (banner margins, label wording, lamp window, "talk" steps) these were run again on the final code: the three owner cases, the intro, four cases with the occlusion monitor (fish auction, grocery job, librarian job, natatorium) and the whole of `tools/navcheck.mjs`. The other cases were not repeated after those changes.
| case | what the arrow said, in order | end | frames without arrow / frames | screenshots |
|---|---|---|---|---|
| **Owner 1: courier → Dot's Diner.** Shift started at the depot (`G.jobs.debugStart`), bag loaded by following the arrow, first drop set to the diner (test set-up), 4 km walked on the street, went IN through the diner door as the owner did, handed over at the counter, followed on to the next drop | "Load the Bag" → "Exit → Deliver to Dot's Diner" → "Deliver to Dot's Diner · 4.0 km" → "Deliver here: tap the gold marker, or go in" → (inside) "Hand the parcel over at the counter" → "Exit → Deliver to Paper Lantern Books" → (street) "Deliver to Paper Lantern Books · 1.1 km" | parcel delivered inside, next drop guided | 0/4611 + 0/326 + 0/120 | a_courier_1..7 |
| **Owner 2: council meeting from the plaza** (Tuesday 18:38, waypoint City Hall) | "Maple Bay City Hall" → "Go in: Maple Bay City Hall → the Council Chamber" → "Council Chamber: this way" → "Council in session: take a seat in the gallery" | seated, "Watching the council", toast "You have arrived: the council meeting" | 0/980 | a_council_1..4 |
| **Owner 3: a play at the Lantern Playhouse from the street** (19:37, no ticket yet; ticket bought at the box office by clicking Buy) | "The Lantern Playhouse" → "Go in: The Lantern Playhouse → box office" → "Box office: pick a show and buy a ticket" → "Through the curtains: show your ticket" → "Your seat: row C, seat 12. Tap it to sit" | seated, toast "You have arrived: your seat for The Understudy" | 0/1029 | a_play_1..5 |
| cinema film (ticket held): street -> Screen 1 -> seat | "The Orpheum" → "Go in: The Orpheum → your seat" → "Screen 1: show your ticket" → "Your seat: row C, seat 10. Tap it to sit" | done | 0/719 | r_cinema_1, r_cinema_2 |
| symphony concert (ticket held): street -> Auditorium -> seat | "Maple Bay Symphony Hall" → "Go in: Maple Bay Symphony Hall → your seat" → "Auditorium doors: show your ticket" → "Your seat: row D, seat 19. Tap it to sit" | done | 0/866 | r_concert_1, r_concert_2 |
| arena game: street -> turnstiles -> your seat | "Maple Bay Arena" → "Go in: Maple Bay Arena → your seat" → "Into the bowl → your seat" → "Your seat: tap it to sit down" | done | 0/1103 | r_arena_1 |
| conservatory: guided tour meeting point | "Maple Bay Botanical Conservatory" → "Go in: Maple Bay Botanical Conservatory → the tour" → "Guided tour at 13:00: meet the docent here" | done | 0/428 | r_constour_1 |
| museum: guided tour meeting point | "Museum of Maple Bay" → "Go in: Museum of Maple Bay → the tour" → "Guided tour at 14:00: meet the docent here" | done | 0/516 | r_mustour_1 |
| planetarium show: ticket desk passed -> Star Theatre -> a seat | "Maple Bay Observatory" → "Go in: Maple Bay Observatory → the Star Theatre" → "Planetarium → the Star Theatre" → "Take any seat: tap it" | done | 0/977 | r_planet_1 |
| aquarium: turtle feeding | "Maple Bay Aquarium" → "Go in: Maple Bay Aquarium → Turtle Feeding & Keeper Talk" → "Stairs to the Turtle Lagoon → Turtle Feeding & Keeper Talk" → "Turtle feeding: hold out a lettuce leaf (10:45)" → "Turtle feeding: hold out a lettuce leaf" | done | 0/775 | r_turtle_1 |
| hotel restaurant: your table | "The Grand Maple Hotel" → "Go in: The Grand Maple Hotel → your table" → "The Gilded Maple → your table" → "Your table: tap it to sit down" | done | 0/912 | r_hotel_1 |
| fish hall: the dawn auction | "Bay Fish Hall" → "Go in: Bay Fish Hall → the fish auction" → "Fish auction: bid at the rostrum" | done | 0/763 | r_auction_1 |
| lighthouse: light the lamp (5 rooms up) | "Go in: Gull Point Lighthouse → the lantern room" → "The tower stair → the lantern room" → "Climb the stair → the lantern room" → "Ladder up to the lantern → the lantern room" → "Light the lamp: the great lens" | done | 0/1677 | r_lamp_1 |
| City Hall: a wedding (guest) | "Maple Bay City Hall" → "Go in: Maple Bay City Hall → the Wedding Room" → "Stairs up → the Wedding Room" → "A wedding is on: sit with the guests" | done | 0/899 | r_wedding_1 |
| appointment with a friend inside a cafe | "Bean & Gone" → "Go in: Bean & Gone → Kit" → "Coffee with Kit: say hello to Kit" | done | 0/419 | r_friend_1 |
| job barista: street -> clock in -> first task | "Bean & Gone" → "Go in: Bean & Gone → clock in" → "Wipe Tables" → "Take Order" | done | 0/593 | j_barista_1 |
| job grocery_clerk: street -> clock in -> first task | "FreshWay Market" → "Go in: FreshWay Market → clock in" → "Tidy the Produce" → "Fetch Crate" | done | 0/763 | j_grocery_clerk_1 |
| job line_cook: street -> clock in -> first task | "Dot's Diner" → "Go in: Dot's Diner → clock in" → "Wash Dishes" → "Grab Ticket" | done | 0/690 | j_line_cook_1 |
| job office_analyst: street -> clock in -> first task | "Hartwell & Finch" → "Go in: Hartwell & Finch → clock in" → "Crunch Numbers" | done | 0/562 | j_office_analyst_1 |
| job fitness_trainer: street -> clock in -> first task | "Iron Maple Gym" → "Go in: Iron Maple Gym → clock in" → "Restock Towels" → "Spot a Lifter" | done | 0/801 | j_fitness_trainer_1 |
| job librarian: street -> clock in -> first task | "Maple Bay Public Library" → "Go in: Maple Bay Public Library → clock in" → "Straighten a Shelf" → "Load the Cart" | done | 0/766 | j_librarian_1 |
| job nurse: street -> clock in -> first task | "Bayside Clinic" → "Go in: Bayside Clinic → clock in" → "Tidy the Charts" → "Triage at Reception" | done | 0/738 | j_nurse_1 |
| job dock_worker: street -> clock in -> first task | "Pier 7 Freight" → "Go in: Pier 7 Freight → clock in" → "Unload the green crate" → "Stack on Pallet: find the green marker (green pallet)" | done | 0/777 | j_dock_worker_1 |
| job bartender: street -> clock in -> first task | "The Blue Heron" → "Go in: The Blue Heron → clock in" → "Polish Glasses" → "Take Order" | done | 0/697 | j_bartender_1 |
| need chooser: hunger (real clicks) -> order | "Dot's Diner" → "Go in: Dot's Diner → eat here: order" → "Eat here: order" | done | 0/514 | n_hunger_1 |
| need chooser: bladder (real clicks) -> restroom | "Bean & Gone" → "Go in: Bean & Gone → the restroom" → "The restroom" | done | 0/501 | n_bladder_1 |
| need chooser: energy (real clicks) -> home -> bed | "Juniper Court" → "Go in: Juniper Court → your bed: sleep" → "Your bed: sleep" | done | 0/581 | n_energy_1 |
| need chooser: bladder (real clicks) -> home -> bathroom -> toilet | "Juniper Court" → "Go in: Juniper Court → the toilet" → "Bathroom → the toilet" → "The toilet" | done | 0/525 | n_bladder_home_1 |
| Wander "Take me there" -> a mall shop counter | "Maple Bay Galleria" → "Go in: Maple Bay Galleria → Tapioca Sky" → "Tapioca Sky" | done | 0/527 | w_mall_1 |
| planner "Leave now" alert -> museum tour, followed to the end | "Museum of Maple Bay" → "Go in: Museum of Maple Bay → the tour" → "Museum ticket first: the ticket desk" → "The tour is leaving: tap the docent to join" | done | 0/1053 | p_leave_1, p_leave_2 |
| goal row tapped (arena opportunity) -> Benny -> Coach backstage | "Maple Bay Arena" → "Go in: Maple Bay Arena → Benny" → "Give the lucky ball back to Benny" → "TEAM ONLY → the locker corridor" → "Say hello to Coach Delacroix" | done | 0/1134 | g_benny_1, g_benny_2 |
| City Hall records queue (fountain chain, goal tapped): number -> wait -> window 4 | "Maple Bay City Hall" → "Go in: Maple Bay City Hall → Permits & Records" → "Permits & Records: this way" → "Take a number from the red machine" → "Ticket A29: sit and wait, 3 ahead of you" → "Ticket A29: sit and wait, 2 ahead of you" → "Ticket A29: 2 ahead of you" → "Ticket A29: 1 ahead of you" → "Your number is up: window 4, ask about the fountain work order" | done | 0/1417 | q_records_1, q_records_2, q_records_3 |
| natatorium: front desk -> lockers -> rinse -> pool -> swim lesson | "Maple Bay Natatorium" → "Go in: Maple Bay Natatorium → the pool" → "Front desk: buy a swim" → "Changing Village → the lockers" → "Lockers: change into your swimwear" → "Quick rinse first: the showers" → "Competition Pool → the pool" → "Swim lesson: talk to Coach Midge" | done | 0/2044 | s_swim_1, s_swim_2, s_swim_3 |

**Intro** (`?scene=city&intro`, the QA lane's scenario with the destination picker fixed, on the final code): walked the cabin aisle, "Leave the plane", tram, bag from the carousel, "Exit to the curb", the phone tutorial, MapleCab → Juniper Court (free first ride), the ride, the door, inside ("It's small. It's echoey. It's yours."). Arrow: none in the airport rooms (the intro's own hint bubbles lead there, as before), then "Cab pick-up: wait at the kerb" → "Your MapleCab: hop in" → "Juniper Court" during the ride → cleared on arrival; a home has no further objective. 0 frames without an arrow in 6984 guided frames, 0 page errors. A first run picked the Taxi app's new "For you now" suggestion instead of Home: that was the test script, not the game.

Occlusion (arrow box overlapping a banner / toast / the shift HUD / the trip strip), measured on four re-runs after the margins change: fish auction 2 of 763 frames, grocery job 0 of 763, librarian job 18 of 766, natatorium 7 of 2044.
All runs: 0 page errors. Screenshots (118 files; 45 looked at: 5 full size, 40 as contact sheets cropped to the top 600 px): `/tmp/claude-0/-home-user-Pixel-city-2/ab4bf52b-889a-5288-a866-29c2e55d0472/scratchpad/ng/shots/` (`a_*` owner cases after, `b_*` before, `r_* j_* n_* w_* p_* g_* q_* s_*` one per case at the moment the arrow marks the final target).


## Regression check
`node tools/navcheck.mjs` → room graph + 44 audit scenarios (placement checks: state set up, player put in each scene on the way, arrow label compared, target reachable on foot). Final run (`--rooms all`, on a snapshot of the repo taken after the other lanes' last changes): 200 rooms, 377 doors used for real, 201 room-to-room routes, 0 problems; audit 44 of 44 scenarios pass; "".
`--row <text>` runs one scenario, `--only graph|audit`, `--rooms all`, `--root <dir>`.

## Not done / limits / known gaps
- **Played vs only checked.** Played for real: the three owner cases and the 30 rows of the table above. Checked by placement only (navcheck audit, no walking): the mayor's appointment, the story beat (city leg), the gig marker, a hotel lift route to another floor, `G.navGoals.set()`. Written from the systems' code and NOT run at all: your own wedding, speaking at the council (speakers' list → podium), window 5 (Lost & Found), hotel ballroom events, your hotel room by need, the arena before doors open, all chain steps except Benny → Coach and the records queue, aquarium shows other than the turtle feeding, the museum / conservatory "no ticket" branch except in the planner case, the closed-door fallback (2.6 s), `far` city targets of chains (cuttings, lost objects, suitcases, clues, lucky ball, release beach).
- **Jobs.** The courier shift was started with `G.jobs.debugStart` (the hiring UI was not clicked) and the first drop was pointed at the diner. For the other 9 jobs the job record was written directly, then the player walked in from the street and really clocked in and did the first task; the office analyst's first task opens a mini-game, which was not played (the arrow's job ended there).
- **Courier parcels for homes / buildings you cannot enter** are still handed over at the door marker (the arrow now stays on the door and says so).
- **Intro**: see the note under the results table.
- **The Map app** still draws its dashed route to the building only, and the trip strip keeps its "walk to X" line while you are inside. Neither file was touched.
- **Objectives without a waypoint** (ticket held / appointment in its window, picked up inside the building) cannot be dismissed by the player; they end when done, when the time window passes, or outside the building. A pinned objective (`set`) is not restored after a load (waypoint-based ones are: they are derived from state).
- **Wander entries inside a building** are recognised by reading the entry title from the click on "Take me there" (no hook in ui/phone_guide.js) and matching interactable labels by words of the title. Played: one Galleria shop. Not played: SkyDeck features, the station piano, the library corner.
- **Overlap**: when a toast or phone banner pops up, the arrow at the top edge can be covered for up to 12 frames until the margins are re-measured (measured: 0 to 18 covered frames per run of 760 to 2040). Before this change it stayed covered for the whole life of the banner.
- **Not tested**: touch input (mouse and programmatic use only), sound, landscape after the label-wrap CSS, save / load in the middle of an objective, performance on a real phone (about 40 small resolver functions run 5 times a second).
- Two interactables with the same label (a desk and its clerk) → the desk is marked. Rooms whose target label changes (a renamed fixture) silently fall back to the building's default; `tools/navcheck.mjs` catches that for the rows in the audit file.


## For the lead to decide
1. **Arrival moved from the door to the counter for every venue** (rows 26-28): "You have arrived" now comes at the till / desk, or on entering when the room has none. This is what the owner asked for, but it changes every plain waypoint. A closed venue keeps the old arrival at the door.
2. **An arrow during the whole shift** for in-room job tasks, on top of the gold markers. Easy to switch off (`shift` resolver: return null when inside the workplace) if it feels like too much.
3. **Courier hand-over inside the venue** is a small gameplay addition made from navgoals.js ("Hand over the parcel" at the counter, same pay and timing, the door marker still works). Keep it there, or move it into sim/_jobs_work.js?
4. **Chain steps act as the default** when you head to a showpiece while its opportunity is open (priority 5, above the ticket desk). City-side chain items need the goal row to be tapped.
5. **ui/navarrow.js got a third small edit** in `margins()` (QA's area): phone banners and toasts now push the arrow down, and the shift HUD (bottom left in portrait) is avoided; re-measure every 12 frames instead of 20. Please make sure the QA worker's copy keeps these lines plus the two hooks.
6. **Wander**: a cleaner way than reading the click is one line in ui/phone_guide.js `goThere` (`G.navGoals.select({ entry: e })`); that file was not mine to edit.
7. The arrow label now wraps to two lines everywhere (also the red "YOUR STOP" labels). `tools/navcheck.audit.json` is a second file in tools/.
8. Wording of all labels is mine ("Through the curtains: show your ticket", "Hand the parcel over at the counter"...): worth a read by the writer lane.

