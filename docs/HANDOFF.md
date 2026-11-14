# HANDOFF — the always-current note (read FIRST after any compaction or restart; rewrite the "Now" section at every hand-off)
Rule: this file is updated every time a worker finishes, a build is published, or the owner gives direction. If memory and this file disagree, this file and the code win.

## Now (updated 2026-11-14 ~17:55 UTC)
- **Running worker:** showpieces B — performance venues (concert hall + orchestra, cinema hall playing real ~1-min pixel short films, theater show; shared ticket/audience/seat/show/applause/exit engine).
  Files it owns: src/sim/shows.js, src/sim/_shows_*.js, src/scenes/rooms/performance.js, src/art/performance/. Launched ~17:50 UTC. When it reports: follow the playbook loop
  (write docs/reports/shows.md, build, 1-2 screenshots, commit + push, publish, update STATUS/BACKLOG/HISTORY and this file), then start the next item within ~10-15 minutes.
- **Next items (docs/BACKLOG.md has detail):** 2c museum + botanical conservatory + hotel lobby + POST OFFICES -> 2d City Guide app + events/live music -> 2e trip planner (Take Bus / Take Train from the map)
  -> 3 jobs expansion (15 new jobs, story arcs for all 25, skip-shift choice) -> 4b relationships/vignettes/romance -> 4c goods, physical shopping, home design, activity mechanics, interests
  -> 4 new needs + Opportunities -> 5 resume cut-off art (icons, buildings, props, terrain, audio, weather) -> 6 QA/playthrough.
- **Live build:** artifact slug 6723cacd-7010-466b-a6d7-f100f5510757, last published version `1794677949-384a` (Stage 8: mall + SkyDeck). Use that as base_version for the next publish (or call get_artifact).
- **Git:** branch claude/pixel-city-life-sim-21h2e3, pushing works; commit + push after every step. No PR (owner hasn't asked).
- **Pacing:** one worker at a time, continuously (owner wants steady progress, doesn't care about total usage). Workers are told to be token-economical.
- **Open small things the lead may do between workers:** rename one of the two "Beacon" buildings; taqueria counter shows "PIZZA" (generic eateries reuse the pizza counter); telescope discovery unverified;
  weather isWet bug; MapleCab shows a fare on the free first ride.
- **Owner's last word:** steady pace, keep going; wants handoff notes kept constantly current instead of new sessions (this file); every owner message is appended verbatim to docs/OWNER_MESSAGES.md.

## How to resume cold
1. Read CLAUDE.md -> this file -> docs/LEAD_PLAYBOOK.md -> docs/STATUS.md -> docs/BACKLOG.md -> tail of docs/HISTORY.md -> docs/OWNER_NOTES.md (digest) / OWNER_MESSAGES.md (verbatim) / LEAD_JOURNAL.md (why).
2. `git status`, `git log --oneline | head`, `node tools/build.mjs` to confirm the tree is healthy.
3. Check for a running worker (a completion notification will arrive; do not start a second one). If none is running, launch the next backlog item.
