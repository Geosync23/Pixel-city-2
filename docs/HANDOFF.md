# HANDOFF — the always-current note (read FIRST after any compaction or restart; rewrite the "Now" section at every hand-off)
Rule: this file is updated every time a worker finishes, a build is published, or the owner gives direction. If memory and this file disagree, this file and the code win.

## Now (updated 2026-11-14 ~21:25 UTC)
- **Running worker:** none at the moment of writing. A wake-up is scheduled for ~21:25 UTC to launch the GUIDE APP worker (owner msg 37: prioritised; working name "Wander — the Maple Bay guidebook";
  very comprehensive, fun, visual like a guide book; auto-built from game content: places, shops, stalls, venues, shows, events, activities/mini-games, transit; chapters + by district + near me + Things to try checklist with stamps; EVERY entry has active links: "Take me there" sets a waypoint, scheduled events/shows have "Add to planner" (owner msg 38)).
  If no worker is running when you read this, launch it. THEN 2f fix pack + navigator, then the rest in the order below.
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

## MOVING TO ANOTHER ACCOUNT (owner msg 43: planned for the end of this session)
The owner will continue this project from a different Claude account. Everything needed is in this repo; the conversation, the artifact link and any running worker do NOT transfer.
For the NEW lead (first session on the new account):
1. GitHub must be connected on that account with the Claude GitHub App installed for `Geosync23/Pixel-city-2`; work on branch `claude/pixel-city-life-sim-21h2e3` (or whatever branch that session is assigned — if it differs, start it from this branch's head).
2. Read CLAUDE.md, then this file top to bottom, then the docs it lists. `npm install` (esbuild), `node tools/build.mjs`, run one `tools/shot.mjs` smoke test.
3. Publish `dist/index.html` as a NEW artifact (the old slug 6723cacd-... belongs to the old account): update the slug/URL in CLAUDE.md and docs/LEAD_PLAYBOOK.md, and tell the owner the new link. Players' saves are per-link, so the owner starts a new game.
4. Check the "Now" section: if it names a worker as running, that worker is gone — look at the files it owned (listed there), read docs/BACKLOG.md for the item, and either finish the work yourself or brief a new worker with "these files exist; continue".
5. Keep following the standing orders (verbatim owner messages, HANDOFF updates, one worker at a time, steady pace).
For the CURRENT lead before the switch: let the running worker finish if possible, do the playbook loop, rewrite "Now", append anything from the conversation not yet in LEAD_JOURNAL.md, commit and push, and tell the owner the final commit id.
