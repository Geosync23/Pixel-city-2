# Last-metre guidance: the arrow leads to the exact thing (owner msg 102, BIBLE update 19) — worker report

Files: NEW `src/sim/navgoals.js` (objective model + all resolvers + room-graph fixes, API `G.navGoals`), NEW `tools/navcheck.mjs` + `tools/navcheck.audit.json` (regression check),
`src/ui/navarrow.js` (two small hooks, 4 lines). `src/sim/navigator.js` and `src/ui/phone_map.js` were NOT changed. No hook was needed in any system file.

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
Result on the final code: 194 rooms, 368 doors used, 201 room-to-room routes, 0 problems (run with `--rooms all`; default samples pubs / lobbies: 101 rooms).
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
RESULTS_TABLE

## Regression check
`node tools/navcheck.mjs` → room graph + AUDIT_N audit scenarios (placement checks: state set up, player put in each scene on the way, arrow label compared, target reachable on foot). Final run: NAVCHECK_RESULT.
`--row <text>` runs one scenario, `--only graph|audit`, `--rooms all`, `--root <dir>`.

## Not done / limits / known gaps
LIMITS

## For the lead to decide
DECISIONS
