# HANDOFF — the always-current note (read FIRST after any compaction or restart; rewrite the "Now" section at every hand-off)
Rule: this file is updated every time a worker finishes, a build is published, or the owner gives direction. If memory and this file disagree, this file and the code win.

## Now (updated 2026-11-15 ~00:45 UTC) — FABLE LEAD SESSION; 4 WORKERS RUNNING
- Lead is now a Fable 5.2 session on the same branch `ccr-e622e92c-7t3ejy`. Last published build: Stage 15d (version 1794701780-3538; Stage 15 + door tap fix (msg 76) + kitchen storage (msg 77) + tip pacing (msg 78); lead files: core/game.js, sim/inventory.js, housing.js, sim/activities.js, apps.js, ui/phone_tips.js; built from a clean worktree without the workers' WIP) at https://claude.ai/artifact/JQ1cnxuWNmXT8VSrYKowbG
  (from this session: Artifact `action: read` on that url first, then publish dist/index.html with `url`).
- **Review of the previous session: DONE** (docs/LEAD_JOURNAL.md section H). Nothing broken found; 124 rooms swept clean; unverified items handed to the QA lane.
- **RUNNING (launched ~00:40 UTC; a completion notice arrives per worker; if this session restarted they are gone — check the owned files and re-brief "these files exist; continue"):**
  1. NAV ARROW EVERYWHERE (Fable, owner msg 72 / BIBLE update 15). Owns: src/ui/phone_map.js, src/sim/navigator.js, new src/ui/navarrow.js, nav hooks in src/sim/rail.js, src/scenes/trainride.js, src/sim/transit.js, src/sim/traffic.js, src/ui/phone_taxi.js.
  2. OPUS QA & DATA lane. Writes docs/reports/qa_wave_a.md. Owns: src/sim/guide.js, src/ui/phone_guide.js, src/data/activities.js, src/sim/stalls.js + small fixes in places_food*/places_shops*/lobbies* rooms, src/sim/lobbies.js, src/sim/bladder.js.
     Chores: wire placeInfo into the guide; conservatory in Things To Try; read_noticeboard + lobby_coffee activities; closed-office door glow.
  3. S3 OBSERVATORY (Fable). Owns new: src/sim/observatory.js, src/scenes/rooms/observatory*.js, src/data/observatory.js, src/art/showpiece/observatory*.js, _obs_lib.js. Converts bld.civic.observatory in place.
  4. S2 MUSEUM (Fable). Owns new: src/sim/museum.js, src/scenes/rooms/museum*.js, src/data/museum.js, src/art/showpiece/museum*.js, _mus_lib.js + ADD-ONLY edit of src/world/_blocks.js (new building on a free lot).
  5. OPUS WRITER (owner msg 79; writers do not count against the 3+1): creates src/story/ambient_lines.js (`LINES` pools: general 600+, district, timeOfDay, weather, season, weekday, kind, venue, and player.<state> contextual pools such as stinky/exhausted/soaked/new_in_town; target 3,000+ lines).
     ENGINE WRITTEN, NOT WIRED: src/sim/_crowd_lines.js (cityLine, playerStates, roomVenueKey, lineStats; shuffle bags in G.state.lines; imports ambient_lines.js so nothing may import it until the writer's file exists).
     LEAD TODO when the writer lands: make _crowd_core.js ambientLine() call cityLine (pass ctx.kind / ctx.venue via roomVenueKey / ctx.near when the citizen is within ~5 units of the player / event pools as ctx.legacy), in crowd.js chatter prefer a citizen near the player when playerStates() is non-empty, add bumped / staring triggers, test with lineStats() and a 500-draw no-repeat check, keep bubT timers as they are. Original note: shuffle-bag per pool persisted in G.state (no line repeats until its pool is exhausted), player-state contexts (needs bands, weather, outfit, money, days in town, shift soon...), SAME bubble frequency (bubT 5-10 s).
- **When each finishes (playbook loop):** docs/reports/<system>.md, build, 1-2 screenshots viewed by the lead, STATUS/BACKLOG/HISTORY, commit + push, publish a stage, rewrite this section, start the next queued item within ~10-15 min.
- **NEXT FREE SLOT (owner msg 77, BIBLE update 16): RECIPES x100+** — data/items.js RECIPES + new ingredients + meal icons (src/art/icons), sold in groceries; cook menu grouping/search for a long list (sim/activities.js cookMenu); recipe unlock sources. Kitchen storage part is DONE by the lead.
- **Queue after these (3 Fable + 1 Opus):** S4 Grand hotel -> S5 Arena -> S6 Aquarium -> S7 fish market + lighthouse -> S8 City Hall (drop `cityhall` from CLASS in src/sim/lobbies.js) -> S9 natatorium.
  Opus lane next: QA of nav arrow + observatory + museum; small open items below.
  Then Wave B: 2i clothes/hair/laundry | 2j traits/skills/mini-games | university | post offices. Wave C: 2k city events | 3 jobs (writer + engine) | 4b relationships/romance. Wave D: 4c goods + MANY home-goods stores
  (big-box home improvement, department stores, furniture showrooms...; map expansion OK, BIBLE update 13) | home design + shipping | 4 needs + Opportunities | 5 art. Wave E: 6 QA.
- **Lead TODOs left:** red-check table sets repeat (taqueria/soul kitchen); extra unique home listings need door pois in src/world/_blocks.js (after the museum worker releases that file); conservatory tour times not in the planner.
- **Small open items:** Circle app releases immediately; `app.*` icons; city-bench sit; two "Beacon" buildings; SkyDeck telescope discovery; weather isWet bug; show music never heard; fuel tanks near runway end;
  bus headways/walk speed; calendar "Add to planner" duplicates; NPCs mention Living Tips; MapleCab fare on free first ride; a tip banner can cover the clock/needs bar in portrait. Nobody has done a full hand playthrough from New Game yet.

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
