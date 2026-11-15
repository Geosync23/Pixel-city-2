# HANDOFF — the always-current note (read FIRST after any compaction or restart; rewrite the "Now" section at every hand-off)
Rule: this file is updated every time a worker finishes, a build is published, or the owner gives direction. If memory and this file disagree, this file and the code win.

## Now (updated 2026-11-15 ~01:25 UTC) — FABLE LEAD SESSION; 4 WORKERS + 1 WRITER RUNNING
- Branch `ccr-e622e92c-7t3ejy`. **Last published: STAGE 26 (1794711174-f3a7) = the 'Stage 22' commit + lead ui files (phone_taxi, phone_guide, phone, phone_planner, phone_wellness) + hotel + arena + aquarium + fishmarket + lighthouse files from the tree (+ world/_blocks.js from the 'Stage 25b' commit). NOT in it: city hall, natatorium, clothes (running), QA round 3 (mid-edit on museum/observatory/recipes/crowd/transit files — take those from the 'Stage 22' commit until it reports).**
- **HOW TO PUBLISH WHILE WORKERS ARE MID-WORK** (simple recipe since Stage 22): `git worktree add --detach <scratchpad>/clean HEAD`, symlink node_modules, `rm -rf clean/src && cp -r src clean/src && cp tools/*.mjs clean/tools/`,
  then DELETE the unfinished workers' files in the copy (now: src/**/aquarium*, fishmarket*, lighthouse*, cityhall*, src/art/showpiece/*aqua* *fish* *lh* *cityhall* *_ch_*, and sim/lobbies.js from the 'Stage 22' commit; and while QA round 3 runs, start the worktree from the 'Stage 22' commit instead of copying src) and restore any shared file an unfinished worker edits from the last good commit
  (now: src/world/_blocks.js from the 'Stage 20' commit, because the aquarium worker appends to it); validate + build + one smoke shot there; publish that dist with `url`; remove the worktree. Files a QA worker is editing mid-run are a risk: publish right after it finishes.
- **RUNNING (a completion notice arrives per worker; if the session restarted they are gone — check owned files and re-brief "these files exist; continue"):**
  1. OPUS QA lane ROUND 3 (launched ~03:40; rounds 1-2 DONE -> qa_wave_a.md, qa_nav.md). Plays museum, observatory, recipes, city-folk lines (indoor bubbles!), tunes buses to ~half the walking time; writes docs/reports/qa_round3.md.
     Owns: museum + observatory files, data/recipes_extra.js, items.js, validate.mjs, venues_extra.js, calendar.js, sim/activities.js, ui/shop.js, sim/_crowd_lines.js, _crowd_core.js, crowd.js, _crowd_rooms.js, sim/transit.js, navigator.js, traffic.js, _traffic_veh.js, ui/hud.js + hud.css.
  2. S8 CITY HALL (Fable, launched ~05:25; S5 Arena is DONE -> docs/reports/arena.md). New: src/sim/cityhall.js, src/scenes/rooms/cityhall*.js, src/data/cityhall.js, src/art/showpiece/cityhall*.js, _ch_lib.js, _ch_icons.js + ONE entry removed from CLASS in src/sim/lobbies.js (lobby ids must stay stable). Includes the fountain-finally-fixed chain.
  3. WAVE B 2i CLOTHES / HAIR / LAUNDRY (Fable, launched ~06:50; S7 fish hall + lighthouse are DONE -> docs/reports/fishmarket_lighthouse.md). Owns: src/sim/wardrobe.js, src/ui/creator.js, clothing/hair drawing in src/core/char.js + src/art/chars/**, new src/data/clothes.js, src/sim/laundry.js, src/sim/hair.js, src/ui/phone_closet*.js (+ the closet part of phone_minis.js), new icon files. 400+ pieces, 60+ hairstyles, hamper + laundromat loop, closet app.
  4. S9 NATATORIUM (Fable, launched ~06:00; the aquarium + its polish pass are DONE and published). New: src/sim/natatorium.js, src/scenes/rooms/natatorium*.js, src/data/natatorium.js, src/art/showpiece/natatorium*.js, _nat_lib.js, _nat_icons.js; converts bld.civic.pool in place, no world edits.
  5. (writer DONE: city-folk lines are live, docs/reports/city_lines.md lists the dormant pools that still need detection hooks or new citizen kinds.)
- **When each finishes (playbook loop):** docs/reports/<system>.md, build, 1-2 screenshots viewed by the lead, STATUS/BACKLOG/HISTORY, commit + push, publish a stage, rewrite this section, start the next queued item within ~10-15 min.
- **Queue (3 Fable + 1 Opus):** next free Fable slots: Wave B (2i clothes/hair/laundry, 2j traits/skills/mini-games, post offices) — see WAVE ORDER below.
  Opus lane next: QA of nav arrow (real walking between legs, lobbies/homes/halls/SkyDeck, night, the intro with the new arrow) + observatory + museum + recipes; small open items below.
  WAVE ORDER (owner msg 91, BIBLE update 18 — C and D swapped, university moved to D):
  Wave B: 2i clothes/hair/laundry | 2j traits/skills/mini-games | post offices.
  Wave C: 4c goods + MANY home-goods stores (big-box home improvement, department stores, furniture showrooms...; map expansion OK, BIBLE update 13) | home design + shipping | 4 needs + Opportunities | 5 art.
  Wave D: 2k city events | 3 jobs (writer + engine) | 4b relationships/romance | university.
  Wave E: 6 QA.
- **Lead TODOs left:** nav gaps (SkyDeck exit, mall shops in G.places, tip banners over the trip strip, MapleCab "on its way" text, unused #ph-way CSS); red-check table sets repeat (taqueria/soul kitchen);
  extra unique home listings need door pois in src/world/_blocks.js (after the museum worker releases that file); conservatory tour times not in the planner.
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
