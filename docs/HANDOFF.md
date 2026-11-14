# HANDOFF — the always-current note (read FIRST after any compaction or restart; rewrite the "Now" section at every hand-off)
Rule: this file is updated every time a worker finishes, a build is published, or the owner gives direction. If memory and this file disagree, this file and the code win.

## Now (updated 2026-11-14 ~21:15 UTC)
- **Running worker:** showpieces B — performance venues (RESUMED at 21:02 UTC after a 5-hour-limit cut-off; its files exist: src/sim/shows.js, _shows_*.js, src/scenes/rooms/performance.js, src/art/performance/).
  When it reports: playbook loop (docs/reports/shows.md, build, 1-2 screenshots, commit + push, publish, update STATUS/BACKLOG/HISTORY + this file), then start the next item ~15-20 min later
  (the limit was hit even with one worker, so leave a slightly longer gap and keep lead usage light).
- **NEXT (owner's playtest, BIBLE update 11 — do these BEFORE the older queue):** 2f playtest fix pack + navigator (walkways keep right, deboarding order, plane-shaped cabin, station stairs, train flat-fee ticket,
  train flicker overhead, sit on any chair, item icons, tap goal -> waypoint, tap need -> nearest place, Map "what do you need" navigator with foot/bus/train, planner feeds Goals)
  -> 2g unique interiors + many more enterable buildings (lobbies; separate bathrooms; toilets + bladder need) -> 2h apps (app store, Properties, Living Tips, Things To Do guide)
  -> 2i clothes/hair/laundry -> 2j traits/skills/mini-games + university -> then 2c (museum, conservatory, hotel, post offices), 3 jobs, 4b romance, 4c goods, 5 art, 6 QA. Details in docs/BACKLOG.md.
- **Lead already fixed from msg 36:** traffic-light arm names (now the crossed street, not always MAIN); talking only via the Talk prompt/E (taps on people ignored); Jules renamed Nora (display name; id stays `jules`);
  relationship gain x0.4 with a +5/day cap per person (REL_RATE / REL_DAILY_CAP in src/sim/social.js; story awards with raw:true exempt).
- **Live build:** artifact slug 6723cacd-7010-466b-a6d7-f100f5510757; base_version for the next publish = the version printed by the last publish (see docs/HISTORY.md tail) or call get_artifact.
- **Git:** branch claude/pixel-city-life-sim-21h2e3, pushing works; commit + push after every step. No PR.
- **Pacing:** one worker at a time, steady; owner doesn't care about total usage, wants continuous progress without slamming the 5-hour window.
- **Other open small things:** two "Beacon" buildings; taqueria counter shows PIZZA; telescope discovery unverified; weather isWet bug; MapleCab fare shown on free ride.

## How to resume cold
1. Read CLAUDE.md -> this file -> docs/LEAD_PLAYBOOK.md -> docs/STATUS.md -> docs/BACKLOG.md -> tail of docs/HISTORY.md -> docs/OWNER_NOTES.md (digest) / OWNER_MESSAGES.md (verbatim) / LEAD_JOURNAL.md (why).
2. `git status`, `git log --oneline | head`, `node tools/build.mjs` to confirm the tree is healthy.
3. Check for a running worker (a completion notification will arrive; do not start a second one). If none is running, launch the next backlog item.
