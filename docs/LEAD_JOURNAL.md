# Lead's journal — the lead's side of the conversation (decisions, reasoning, what the owner was told)
Companion to `docs/OWNER_MESSAGES.md` (numbers in brackets refer to the owner's messages there). Written retroactively on day 2; append as the project continues.

## A. Founding decisions (after [1], [2], [3])
- **Read the sample first.** `reference/Pixel_Station.html` is a single-file isometric scene: a software rasteriser drawing boxes/quads into pixel buffers, cached as sprites,
  depth-sorted with a topological sort, 8 px per world unit, day/night by rendering two sprite variants. I kept its approach and style and rebuilt it as an engine.
- **All art is code.** No image files: every asset is a draw function calling the rasteriser. Reason: workers ("artists") can produce and iterate art as code, preview it to PNG with
  `tools/gallery.mjs`, and the game ships as one HTML file. This is why art sets could be made in parallel by different workers without an art pipeline.
- **Resolution.** I doubled the sample's scale to 16 px per unit and sized characters at ~22 px. When the owner clarified [3] that the WORLD resolution was fine and the CHARACTERS needed the
  detail, I kept 16 px (work was underway and the extra world detail serves his "lots of cool details") and addressed the intent with a zoomed-in camera (default 3x, limited zoom-out) so the
  world still reads chunky while characters are expressive. Told him so.
- **Lighting model.** One render per sprite produces a colour layer and a "light" layer (pixels that glow at night). Frame = sprites -> multiply by an ambient colour map (with warm
  lamp pools added) -> light layer composited with 'lighten' (max). Gives a continuous day/dusk/night with any ambient tint and cheap lit windows.
- **Flip trick.** Any asset can be drawn mirrored across the x/y diagonal with lighting and text staying correct, so artists design one orientation and vehicles/furniture/buildings get the other free.
- **Terrain.** Continuous vertex heights (flat pads, ramps, stairs tiles; steep tiles render as cliffs and block walking) — real verticality (Hillcrest terraces, river below embankments, elevated rail)
  without a second engine. Constraint told to the planner: land should mostly rise toward the back of the screen so high ground doesn't hide walkable areas.
- **Interiors are small Worlds** built from declarative room definitions (floor, two back walls, furniture with function tags). Gameplay binds to furniture by tag ("fridge", "checkout", "bed"),
  which let art, rooms and systems be built by different workers.
- **Module convention.** Every system is its own file with `init(G)`, auto-registered by a generated index, one owner per file, cross-system calls through `G.<system>` — chosen specifically so
  many workers never edit the same file.
- **City: "Maple Bay"**, 384x384 units, nine districts (Downtown, Old Town, Harborside, Hillcrest, Maplewood, Arts Quarter, Railyard, Central Park/Riverside, Airport), a river with a River Walk, an elevated
  rail loop with 8 stations. Time: 1 game minute = 1 real second; 7-day week; 14-day months, one per season. Start: Monday, Spring 1, 14:00, $600 (the systems designer later set $440 after first rent).
- **Named venues** (Bean & Gone, Dot's Diner, FreshWay Market, The Blue Heron, Hartwell & Finch, etc.) and the 10 starting jobs were fixed by me up front so designers, writers and artists used the same names.
- **Delivery.** GitHub pushes were refused, so I published each stage as a single-file build to a private artifact link the owner can play; pushes started working on day 2 after he installed the GitHub app.

## B. The usage walls and how the process changed ([4], [5], [21])
- I first launched 13 workers at once (11 artists, 2 designers) because the brief said "hire as many people as you need". All hit the 5-hour limit mid-task. After the reset I resumed them and added 5
  more on Opus (the owner had said Opus helpers were fine if the main model ran out) — the window was exhausted within minutes; the limit turned out to be shared across models.
- Owner: "massively cut down the worker count". Rule became 2 at a time, then (after a third wall) ONE at a time, then (owner [21]) one at a time with pauses, never stopping a running worker and never
  downgrading models on my own. I use a scheduled wake-up to start the next worker after a pause.
- Consequence to remember: several ART workers were cut off and never resumed (downtown, old town, residential, civic, harbor buildings; props; icons; terrain/water; audio; weather; title/creator polish).
  The city generator uses whatever they had delivered. Resuming or redoing them is backlog item 5. I told the owner this in the status report.
- Workers were told to be "token-economical" (few screenshots, test via text). This keeps cost down but means verification is lighter; I say so each time I publish.

## C. Things I fixed myself and why (owner playtest feedback)
- **[8] Diagonal judder**: the low-res canvas scrolled in whole pixels, so vertical motion (slower in iso) stepped unevenly. Fix: integer canvas scroll + CSS shift of the remainder quantised to real
  screen pixels (`placeCam` in `core/game.js`). Trade-off told to the owner: the player sprite can shimmer by up to half a pixel.
- **Tall buildings hid the player**: added see-through fading for tall static objects drawn in front of the player (`render.js`).
- **[12] Stands didn't sell**: the game starts on a Monday and the designer's data closed the market on Mondays. I wrote `src/sim/stalls.js`: every stand/cart/stall/kiosk prop opens its venue's
  shop, stands open daily; and the **welcome glow** (pulsing warm mat + night light) at every enterable door and usable stall as the "you can go in" language the owner asked for (he floated several ideas;
  I chose the glow and said he can ask to restyle it).
- **[13] Street names/addresses**: only one true duplicate existed (four "Crest Way" connectors) — renamed; I could not find a second "Market" street and told him so. Added `src/sim/addresses.js`
  (block-numbered, odd/even sides, unique) and show addresses in door prompts.
- **[14] Train on two tracks**: the cutaway car is deliberately wider than a real one, so it straddled both drawn tracks; I redrew the deck with one track centred under the car.
- **[20] Riderless scooters**: the traffic vehicle sprite for two-wheelers now composes a seated random character (parked ones stay empty).
- **[27] Vehicle flicker**: measured it (instrumented the renderer; 14 vehicle pairs flipping order repeatedly in 25 s). Cause: for boxes separated diagonally the sorter's x-first rule made an
  arbitrary choice that formed cycles with a third object (lamp, sign, pedestrian). New rule uses centre depth in that case; flipping pairs dropped to 4. Told him some residual flips may be legitimate.
- Small ones: rugs/flat items draw under furniture; `G.go` rejects when a scene fails to build; taxi ride clock slowed from 4x to 1.5x so the intro cab doesn't burn 3 game hours.

## D. Design positions I took on the owner's direction updates
- **[9] Opening inside the airport**: built as extra intro steps registered before the existing curb step (plane cabin -> concourse -> tram -> baggage -> curb), so the cab tutorial was kept, not rewritten.
- **New needs**: Comfort (home quality/cleanliness), Outdoors (fresh air), Inspiration (culture/novelty); consumables that run out create errands. "Opportunities" + "Appointments" are the quest vocabulary.
- **[11] 15 more jobs**: I chose them to pull players into the showpiece places — gate agent, baggage handler, station agent, mall retail associate, museum guide, florist, radio DJ, teacher, vet assistant,
  sous-chef, hotel concierge, software developer, reporter, hair stylist, firefighter.
- **[15] Job stories**: each of the 25 jobs gets a cast, an arc across shifts/promotions, unique mechanics and moments; a clear "Work the shift / Skip to the end" choice at clock-in. Plan: writer first, then programmer.
- **[17] Relationships/romance**: vignette evenings that unfold a character's life in connected pieces; pacing = a few small bits per day, a deeper vignette every few days, everything waits for the player;
  romance track from flirting -> dates -> partners -> move in -> wedding; dating app on phone and computer; children deferred.
- **[18]/[19] Goods and shopping**: interests chosen at character creation scale how satisfying activities are; every activity gets a small mechanic; progress bars need animation + visible result;
  big stores are physical (pick from rack/shelf -> carry/basket -> pay at counter) and still offer the buy menu; groceries use clickable shelf sections; online orders ship over days. I pointed out that a
  Decorate mode already exists and will be grown rather than replaced.
- **[24] Performance venues**: concert hall, cinema with real ~1-minute pixel shorts in rotation, theater show — one shared ticket/audience/seat/show/applause/exit flow.
- **[26] City Guide app**: guidebook with categories, What's On, and "Things to try"; I proposed the extra events list (live bands in small venues, bandstand concerts, open mic, jazz brunch, Lantern Row night
  market, River Walk movie night, pier fireworks, gallery openings, pickup basketball, 5K, chess tournaments, trivia, karaoke, stargazing at the lookout, seasonal festivals).
- **[27] Trip planner** (Take Bus / Take Train with stops) queued; **city expansion 50-100%** recorded as a future project, with permission to expand at the edges now if needed.
- **[28] Post offices**: main + branches; packages must be sent in person (queue, counter); letters from home; collect slips; story hook to send something "back home".
- **Throughout**: convert existing buildings rather than re-lay-out the city (he loves the layout); never remove what exists.

## E. Questions the owner asked and what I answered
- **GitHub push vs pull request [26]**: push = upload the working branch (backup, browsable); pull request = a proposal to merge that branch into `main`, with a review page. No PR opened; I will open one when asked.
- **Why no long GitHub checks [29]**: those were GitHub Actions workflows in his earlier repos; this repo has none, so pushes just store code. Testing here = each worker's headless-browser checks plus my
  build + spot-check; faster but lighter, and nobody has played the whole game start to finish yet. He said don't change anything. A small build+smoke-test check could be added later; a full QA pass is on the backlog.
- **Moving to another account [30]**: the repo and docs move cleanly; the conversation, the artifact link, browser saves and running workers do not. A new session should read `CLAUDE.md` and continue.
  Not planned soon. Hence OWNER_MESSAGES.md and this journal.

## F. Honest state of verification (as of this entry)
I have personally looked at: the engine test town, city screenshots (airport curb, downtown night, Market Square, traffic at rush hour), starter studio, diner, cafe, Central Station, the train ride, the airport
concourse, one generic eatery, the mall food-court corner, the SkyDeck at night, and several measured evals (camera steps, sort flips, stall counts, addresses). Everything else is as reported by the worker
that built it. No one has done a full New Game playthrough by hand, a mobile-layout pass, or a balance pass.

## G. Final entries before the account move (2026-11-14 evening)
- Performance venues shipped as Stage 9; I verified one screenshot of the orchestra mid-concert; the worker ran all ten programmes in its own tests. Nobody has heard the audio.
- Owner's playtest (msg 36) praised the airport interior and listed many fixes/systems; I fixed four immediately (sign names, Talk-button-only, Jules -> Nora, relationship rate + daily cap) and queued the rest as 2f-2j.
  On "streets named multiple times": the street data is unique; the repeated word was the traffic-light arm's default "MAIN" text, now fixed.
- Guide app made top priority (msgs 37-38); big city events added to the design (msgs 39-42): 5-6 across the whole year, dynamic and in-world, never cutscenes.
- Owner will move the project to another Claude account at the end of this session (msgs 43-44) and asked for work to stop once running workers reported back. None were running, so I cancelled the scheduled
  guide-app launch and left a clean stop point: everything integrated, published and pushed; HANDOFF.md says exactly what to start next.
- Lessons for the next lead: (1) even ONE worker can exhaust the 5-hour window — briefs must demand economy and there should be a gap between workers; (2) workers' reports are honest about what they did not
  verify — relay that to the owner; (3) the owner plays on a tablet/phone in portrait and sends many small voice-typed messages — log each verbatim, answer briefly, and batch small fixes;
  (4) he reacts best to visible, lively, physical things (crowds, the airport, the train) and wants menus replaced by in-world interaction wherever sensible.
- Final window: guide app (189k-token worker) and a trimmed fix pack (142k) both fit after the owner reported 26% used; I verified the guide cover and the new plane cabin by screenshot, the rest is worker-reported. Stopped cleanly with no workers running.
- Final window total: six workers (performance resume, guide, fix pack 1, fix pack 2, icons, apps) plus many small lead fixes fit inside one 5-hour window by keeping briefs tight (150-200k tokens each). Stopped cleanly after Stage 14.

## H. Review of the previous (Opus-lead) session, by the new Fable lead (2026-11-15; commits a1d2ffc..c5dd78c, ~5,200 lines, 50 files)
What I ran myself:
- Build, `src/data/validate.mjs`, city smoke screenshot: all pass.
- A scripted sweep that enters every room added in Wave A (53 `pub:<n>`, 46 `lobby:<n>`, 24 home rooms incl. bathrooms, the conservatory = 124 rooms): 0 build failures, 0 console warnings (no missing assets),
  every room has an exit, every interactable's use spot is path-reachable from the spawn (real A*, snap 1.5 units).
- All 53 enterable public places resolve to a unique builder (none falls back to the generic template). 100 guide infos registered (53 + 46 + conservatory); every place and lobby has a Wander entry.
- Activities in a converted room: the Taproom offers darts / pool / watch the match / bar hang-out / linger; `play_darts` started and raised fun (30 -> 39 in the test window).
- Looked at: portrait city HUD (6 need bars fit at 390 px), conservatory entrance with the tour group, one office lobby, Juniper Court in portrait.
The previous lead's own code (unique_rooms.js, uniqueRoom call sites, vkey/PUB_ALIAS, 15 '*' activities, validate '*' skip): read line by line; correct and small. Two things to know, neither a bug today:
 (1) `uniqueRoom` swallows a builder exception with console.warn and silently falls back to the generic room — a future typo in a places_*.js builder would not fail loudly (the sweep above would show it as a warning);
 (2) activities with venues ['*'] fire in ANY non-home interior that carries the fixture tag (train, airport, lobbies) — intended, but new fixture tags must be chosen with that in mind.
Not wrong but unfinished (already listed as lead TODOs; now assigned to the Opus QA/data lane): guide entries still show the generic template blurb (placeInfo not wired into guide.js); lobby activities; closed-office door glow.
NOT verified by anyone (worker reports say so; now in the QA lane's brief): real pointer drags in Decorate in the new homes/bathrooms; old-save migration of homes with real furniture; buying/eating/services actually
played in the new rooms; night look of most rooms; NPC behaviour around the new seats/bathrooms; the conservatory chain end to end by hand; any audio. Still no full New Game playthrough by hand.
Docs: CLAUDE.md / playbook edits are consistent; playbook step 1 still says "FOUR Fable workers" (rule is 3 Fable + 1 Opus) — corrected. `dist/index.html` is tracked in git (3 MB per build) — left as is.
