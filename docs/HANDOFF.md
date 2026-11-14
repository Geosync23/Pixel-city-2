# HANDOFF — the always-current note (read FIRST after any compaction or restart; rewrite the "Now" section at every hand-off)
Rule: this file is updated every time a worker finishes, a build is published, or the owner gives direction. If memory and this file disagree, this file and the code win.

## Now (updated 2026-11-14, NEW ACCOUNT — first session)
- **LEAD SWITCH PLANNED (owner msgs 67-70):** this session's lead runs on Opus and /model will not stick. When the 4 running workers finish, the Opus lead integrates them,
  publishes, commits, and creates a NEW lead session configured with Fable 5.2 (create_session model claude-fable-5-2, same repo/branch). No new workers are started in the old
  session meanwhile (the new lead starts the queue incl. the Opus QA/data lane). FIRST TASK of the new Fable lead: REVIEW everything the Opus-lead session did — `git log a1d2ffc..HEAD`,
  the lead's own edits (src/scenes/rooms/unique_rooms.js, public_places.js call sites, src/sim/activities.js vkey/PUB_ALIAS + 4 bar activities in src/data/activities.js, CLAUDE.md/playbook
  changes) and each worker's output (reports unique_food, bladder_bath, unique_shops, lobbies, conservatory, unique_homes) — then report findings to the owner.
- **New lead on the new account.** Branch `ccr-e622e92c-7t3ejy` (started from `claude/pixel-city-life-sim-21h2e3` @ a1d2ffc; push here). Artifact: https://claude.ai/artifact/JQ1cnxuWNmXT8VSrYKowbG
  (Stage 14 republished, version 1794695918-0180).
- **Team (owner msg 68): 3 Fable 5.2 + 1 Opus QA & data worker.** Transition: currently 4 Fable running; when the NEXT Fable worker finishes, its slot goes to the Opus QA/data lane (don't stop anyone).
  Opus lane queue: (1) QA sweep of every new room (26 food rooms, shops, lobbies, homes, bathrooms): walk/enter/use/screenshot, list defects; (2) small open items list below; (3) data: red-check table sets variety, watch_kitchen activity, `app.*` icons spec; (4) docs upkeep checks.
- (old line) **Team: up to 4 Fable 5.2 workers in parallel** (owner msgs 59-62; ~10x usage now -> briefs favour quality). Disjoint files per worker; lead owns shared hooks.
- **RUNNING — Wave A (2g), 4 workers:**
  - 2g-1 DONE (26 rooms — only 26 food places exist; docs/reports/unique_food.md). Was: owns src/scenes/rooms/places_food*.js, src/art/venue/places_food_art.js, docs/reports/unique_food.md (registers via unique_rooms.js; told NOT to edit public_places.js).
  - S1 CONSERVATORY (running, took 2g-1's slot): owns src/sim/conservatory.js, src/scenes/rooms/conservatory*.js, src/art/showpiece/conservatory*.js, src/data/conservatory.js, docs/reports/conservatory.md.
  - 2g-2 shops/services/groceries unique rooms: places_shops*.js, src/art/venue/places_shop_art.js, docs/reports/unique_shops.md.
  - 2g-3 apartment + office lobbies (25+): src/sim/lobbies.js (order 60), src/scenes/rooms/lobbies*.js, src/art/venue/lobby_art.js, docs/reports/lobbies.md.
  - 2g-4 DONE (docs/reports/bladder_bath.md: G.bladder, bathrooms `bathDoor`/`bath` in SHELLS, 79 venue rooms get a restroom, G.nav.addSource). Was: 2g-4 bladder need + toilets + home bathrooms as own rooms + venue/park restrooms: src/sim/bladder.js; may edit data/needs.js, sim/needs.js, data/activities.js, sim/activities.js, HUD needs file, rooms/homes.js, sim/housing.js, interior.js (additive), navigator need data. docs/reports/bladder_bath.md.
  - Lead-owned hook added: src/scenes/rooms/unique_rooms.js (registerUnique/uniqueRoom + registerInfo/placeInfo/allInfo for guide blurbs) + call sites in src/sim/public_places.js.
  - Owner msg 65: interiors must have activities + be in the Wander guide. Workers 2g-1/2/3 were told to tag signature fixtures with existing activity tags, list NEW activities in their reports, and registerInfo() per place.
    DONE by lead: converted `pub:` rooms now get venue activities (src/sim/activities.js vkey/PUB_ALIAS: linger, bar stool, stage, browse...), new activities play_pool/play_darts/play_jukebox/watch_game (venues ['*'] = any non-home interior with the fixture). Not added: watch_kitchen. Still open: red-check table sets repeat (taqueria/soul kitchen).
    LEAD TODO after Wave A: wire placeInfo() into src/sim/guide.js entries (blurb/signature/try-this), add the new activities the workers list to data/activities.js, verify in the guide app.
  - If a worker is gone after a restart: check its files above, then brief a new worker "these files exist; continue".
- **PLAN (waves of up to 4; next wave's workers start as slots free up):**
  - **SIGNATURE SHOWPIECES (owner msg 66 — top priority for free slots):** S1 Conservatory -> S2 new Museum -> S3 Observatory -> S4 Grand hotel -> S5 Arena -> S6 Aquarium -> S7 fish market + lighthouse -> S8 City Hall -> S9 natatorium (BIBLE update 14). The first two start in the first slots that free up from 2g-1/2g-2/2g-3.
  - NEXT as soon as 2g-4 frees homes.js/housing.js: **2g-5 UNIQUE HOMES** (owner msg 64; BIBLE update 13) — every starter studio and every Nestly property its own layout/size/character, no repeats; optionally more unique listings (some in the new lobby buildings).
  - Wave B: 2i clothes/hair/laundry (uses 2g-4 bathrooms/washers) | 2j traits + skills + in-world mini-games | 2j university campus (new lots at the city edge) | 2c museum + conservatory + hotel lobby + post offices.
  - Wave C: 2k big city events (5-6/year, in-world parades/festivals) | 3 jobs expansion: writer (25 job arcs as data) | 3 jobs: 15 new jobs + workplaces + job-story engine | 4b relationships/vignettes/romance + dating app.
  - Wave D: 4c goods catalogue + MANY home-goods stores (big-box home-improvement store, department stores, several furniture showrooms, nursery, kitchenware, lighting, electronics, antiques; map expansion at the edges OK) + physical shopping | 4c home design mode + online shipping | 4 new needs + Opportunities | 5 art catch-up (building sets, props, terrain/water, audio, weather, title/creator).
  - Wave E: 6 QA — full New Game playthrough, mobile pass, performance, save/load, balance; plus the small open items below. FUTURE: city +50-100%.
  - Publish a stage whenever a worker's player-visible work is integrated and checked.
- **Small open items:** Circle app releases immediately; `app.*` icons for new apps; city-bench sit; two "Beacon" buildings; SkyDeck telescope discovery; weather isWet bug; show music never heard;
  fuel tanks near runway end; bus headways/walk speed; calendar "Add to planner" duplicates; NPCs mention Living Tips; MapleCab fare on free first ride.
- **Nobody has done a full hand playthrough from New Game yet** (Wave E).

## Previous "Now" (old account, Stage 14 clean stop) — kept for reference
- **Running worker: NONE. No timers pending. Nothing half-done on disk.** Everything is integrated, published (Stage 14, artifact version `1794695264-28f5`) and pushed.
- **Done in the final window (Stages 9-14):** performance venues; Wander guidebook; fix pack 1; fix pack 2 + Maps navigator (G.nav); item icons (365/365); apps (Appy store with releases, Nestly properties browser,
  Bay Basics living tips + G.tips, mini apps: showtime, transit, wallet, closet, friends, weather — docs/reports/apps.md); lead fixes for owner msgs 36 and 49-55 (see docs/HISTORY.md tail).
- **START HERE NEXT (new account):** 2g UNIQUE INTERIORS + MANY MORE ENTERABLE BUILDINGS (owner msg 36: every restaurant/interior unique — replace the 12 generic templates in src/scenes/rooms/generic_venues.js with
  hand-made rooms per place; lobbies for apartment and office buildings; home bathrooms as their own room; toilets + a bladder need). Then: 2i clothes/hair/laundry -> 2j traits/skills/mini-games + university ->
  2c museum (needs a new building), conservatory, hotel, post offices -> 2k big in-world city events -> 3 jobs expansion (15 new jobs + story arcs for all 25) -> 4b relationships/vignettes/romance ->
  4c goods, physical shopping, home design, activity mechanics, interests -> 4 new needs + Opportunities -> 5 remaining cut-off art (building sets, props, terrain/water, audio, weather, title/creator polish) -> 6 full QA.
- **Small open items (good warm-ups):** Circle app releases immediately (count only non-family); `app.*` icon art for the new apps; confirm an actual in-game sit on a city bench; taqueria counter shows PIZZA;
  two "Beacon" buildings; SkyDeck telescope discovery unverified; weather isWet bug; nobody has HEARD the show music; fuel tanks near the runway end; bus headways long / walking slow (tuning);
  "Add to planner" on calendar events duplicates the planner's own row; NPCs should mention Living Tips.
- **Nobody has done a full hand playthrough from New Game yet** — most verification is worker evals + the lead's spot screenshots. A QA pass is item 6.
- **Live build (old account):** artifact slug 6723cacd-7010-466b-a6d7-f100f5510757, version `1794695264-28f5` (Stage 14). The new account must publish its own artifact (see MOVING section below).
- **NEXT, in order (nothing started):**
  1. [DONE] GUIDE APP — working name "Wander — the Maple Bay guidebook" (owner msgs 37-38: TOP PRIORITY; very comprehensive; fun and visual like a guide book; auto-built from game content: every enterable place, shop, stall,
     venue, show, event, activity/mini-game, transit line; chapters + by district + near me; "Things to try" checklist with stamps; active links: "Take me there" waypoint, "Add to planner" for scheduled shows/events
     (use G.shows.schedule, data/calendar.js events, G.places, G.publicPlaces.list(), G.showpieces.mall.shops(), G.planner.add, G.phone.registerApp / setWaypoint)).
  2. [PARTLY DONE — see docs/reports/fixpack1.md] 2f playtest fix pack + navigator (BIBLE update 11): walkways keep right; deboarding — stand when the line reaches your row; plane-shaped cabin shell; station stairs; train flat-fee ticket; train flicker overhead;
     sit on any chair; real item icons; tap goal -> waypoint; tap need -> nearest place; Map "what do you need?" navigator with foot/bike, bus, train (merges the trip planner 2e); planner feeds the Goals list.
  3. 2g unique interiors (no repeated templates) + many more enterable buildings (apartment/office lobbies) + separate bathroom rooms + toilets/bladder need.
  4. 2h remaining apps: app store with release notifications, Properties browser, Living Tips.   5. 2i clothes/hair/laundry system.   6. 2j traits/skills/mini-games + university campus.
  7. 2c museum (needs a new building — the old museum became Symphony Hall), botanical conservatory, hotel lobby, post offices.   8. 2k big in-world city events (5-6 across the year, dynamic, never cutscenes).
  9. 3 jobs expansion (15 new jobs, story arcs for all 25).   10. 4b relationships/vignettes/romance.   11. 4c goods, physical shopping, home design, activity mechanics, interests.   12. 4 new needs + Opportunities.
  13. 5 resume cut-off art (icons, building sets, props, terrain/water, audio, weather, title/creator polish).   14. 6 full QA/playthrough, mobile pass, balance.   FUTURE: city 50-100% larger.
- **Lead fixes already in from msg 36:** traffic-light arm names; talking only via the Talk prompt/E; Jules renamed Nora (id stays `jules`); relationship gain x0.4 with +5/day cap (REL_RATE / REL_DAILY_CAP in src/sim/social.js).
- **Open small things:** two "Beacon" buildings; taqueria counter shows PIZZA; SkyDeck telescope discovery unverified; weather isWet bug; MapleCab shows a fare on the free first ride; show music never heard by anyone (headless tests);
  concert marquee text clipped.
- **Git:** branch claude/pixel-city-life-sim-21h2e3, everything pushed. No PR opened (owner hasn't asked).
- **Pacing rule:** ONE worker at a time, steady; even one worker has hit the 5-hour limit, so leave ~15-20 min between workers and keep lead usage light. Owner doesn't care about total usage, only about steady progress.

- A ready-made first message for a new session is in docs/NEW_SESSION_PROMPT.md.

## How to resume cold
1. Read CLAUDE.md -> this file -> docs/LEAD_PLAYBOOK.md -> docs/STATUS.md -> docs/BACKLOG.md -> tail of docs/HISTORY.md -> docs/OWNER_NOTES.md (digest) / OWNER_MESSAGES.md (verbatim) / LEAD_JOURNAL.md (why).
2. `git status`, `git log --oneline | head`, `node tools/build.mjs` to confirm the tree is healthy.
3. Check for a running worker (a completion notification will arrive; do not start a second one). If none is running, launch the next backlog item.

## MOVING TO ANOTHER ACCOUNT (owner msg 43: planned for the end of this session)
The owner will continue this project from a different Claude account. Everything needed is in this repo; the conversation, the artifact link and any running worker do NOT transfer.
For the NEW lead (first session on the new account):
1. GitHub must be connected on that account with the Claude GitHub App installed for `Geosync23/Pixel-city-2`; work on branch `claude/pixel-city-life-sim-21h2e3` (or whatever branch that session is assigned — if it differs, start it from this branch's head).
2. Read CLAUDE.md, then this file top to bottom, then the docs it lists. `npm install` (esbuild), `node tools/build.mjs`, run one `tools/shot.mjs` smoke test.
3. Publish `dist/index.html` as a NEW artifact (the old slug 6723cacd-... belongs to the old account): update the slug/URL in CLAUDE.md and docs/LEAD_PLAYBOOK.md, and tell the owner the new link. Players' saves are per-link, so the owner starts a new game.
4. Check the "Now" section: if it names a worker as running, that worker is gone — look at the files it owned (listed there), read docs/BACKLOG.md for the item, and either finish the work yourself or brief a new worker with "these files exist; continue".
5. Keep following the standing orders (verbatim owner messages, HANDOFF updates, one worker at a time, steady pace).
For the CURRENT lead before the switch: let the running worker finish if possible, do the playbook loop, rewrite "Now", append anything from the conversation not yet in LEAD_JOURNAL.md, commit and push, and tell the owner the final commit id.
