# HANDOFF — the always-current note (read FIRST after any compaction or restart; rewrite the "Now" section at every hand-off)
Rule: this file is updated every time a worker finishes, a build is published, or the owner gives direction. If memory and this file disagree, this file and the code win.

## Now (updated 2026-11-14 21:42 UTC) — FINAL STRETCH BEFORE THE ACCOUNT MOVE
- **Done this window:** Wander guidebook app (Stage 10 published, version `1794692270-3939`; docs/reports/guide.md).
- **Running worker (LAST one this window):** TRIMMED PLAYTEST FIX PACK, launched 21:40 UTC. It may EDIT EXISTING FILES. Items in order: (1) airport walkways keep right [src/scenes/rooms/airport.js, _airport_life.js],
  (2) deboarding: player released when the line reaches their row [src/sim/intro_airport.js], (3) plane-shaped cabin shell [src/art/airport_interior/cabin.js + airport:plane room], (4) station stairs/elevators usable
  [src/sim/rail.js], (5) flat-fee train ticket required [src/sim/rail.js], (6) sit in any chair [src/sim/activities.js], (7) tap goal -> waypoint [src/ui/goals.js] + tap need -> nearest place [src/ui/hud.js],
  (8) planner appointments in the Goals widget [src/ui/goals.js]. It reports DONE/PARTIAL/NOT STARTED per item. If this session ends before it reports: run `node tools/build.mjs` and `git diff --stat` to see what it
  touched, test those items, and finish the remainder.
- **After it reports:** playbook loop, publish, rewrite this section as a clean stop, push, tell the owner the final commit. Do NOT launch another worker this window.
- **Live build (old account):** artifact slug 6723cacd-7010-466b-a6d7-f100f5510757, version `1794692270-3939` (Stage 10). The new account must publish its own artifact (see MOVING section below).
- **NEXT, in order (nothing started):**
  1. [DONE] GUIDE APP — working name "Wander — the Maple Bay guidebook" (owner msgs 37-38: TOP PRIORITY; very comprehensive; fun and visual like a guide book; auto-built from game content: every enterable place, shop, stall,
     venue, show, event, activity/mini-game, transit line; chapters + by district + near me; "Things to try" checklist with stamps; active links: "Take me there" waypoint, "Add to planner" for scheduled shows/events
     (use G.shows.schedule, data/calendar.js events, G.places, G.publicPlaces.list(), G.showpieces.mall.shops(), G.planner.add, G.phone.registerApp / setWaypoint)).
  2. 2f playtest fix pack + navigator (BIBLE update 11): walkways keep right; deboarding — stand when the line reaches your row; plane-shaped cabin shell; station stairs; train flat-fee ticket; train flicker overhead;
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
