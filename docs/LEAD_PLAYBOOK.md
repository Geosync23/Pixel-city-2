# Lead playbook — how this project is run

## Roles
- **Owner (George)**: sets direction in bursts of voice-typed messages (typos are normal; read for intent), playtests the artifact, wants autonomy from the lead.
- **Lead (you)**: design decisions, worker briefs, integration, small fixes yourself, testing, publishing, documentation.
- **Workers**: sub-agents launched with the Agent tool (background). Each owns specific files/folders, verifies its own work, and returns a final report.

## The loop
1. Pick the top item of `docs/BACKLOG.md`. Write a brief (template below). Launch ONE worker. Tell the owner in one or two sentences.
2. While it runs: answer the owner, record feedback in docs, do small fixes yourself that don't touch the worker's files (build + one screenshot max), commit.
3. When the worker reports: write `docs/reports/<system>.md` (condensed API + gotchas), run `node tools/build.mjs`, take 1-2 screenshots of the new thing
   (`node tools/shot.mjs --dist --url "?scene=..." --w 1000 --h 640 --out name`, then Read the PNG), commit, publish the stage, update STATUS/BACKLOG/HISTORY.
4. Pause (pacing), then next item.
If a worker dies on a usage limit: its files are on disk; when the limit resets, `SendMessage` to its agent id to resume ("continue from where you stopped; files X exist; be economical").
After a container restart only the agents listed in the restart notice can be resumed.

## Worker brief template (what has worked)
- Who you are + repo path + the owner's own words for this feature (quote them).
- "Read first": BIBLE, ARCHITECTURE, the relevant `docs/reports/*.md`, the specific source files and data files (say which are essential).
- "USAGE IS VERY TIGHT": write each file in one pass, test via `tools/shot.mjs --eval` text, view at most N small screenshots, don't re-read own files.
- "You own (create): <files>. Do not edit anything else. No git commands."
- Numbered build list with concrete APIs/ids/events to implement and hooks to other systems (defensive calls: `G.x?.y`).
- "Verify": build passes, specific evals returning text, a few screenshots, zero page errors; "if the build breaks in a file that is not yours, wait and retry".
- "Final report (concise)": files, public API, events, state, tuning constants, known gaps.
Conventions that prevent collisions: one owner per file; modules self-register via `export function init(G)` (generated index — nobody edits main.js);
art modules auto-discovered; cross-system calls go through `G.<system>` APIs documented in `docs/INTERFACES.md` + `docs/reports/`.

## Building, testing, publishing
- Build: `node tools/build.mjs` -> `dist/index.html`. Dev server: `node tools/serve.mjs`. Art preview: `node tools/gallery.mjs <filter> --scale 3 --out name [--night] [--flip] [--season n]`.
- Screenshot/drive: `node tools/shot.mjs --dist --url "?scene=city&x=..&y=..&t=<hour>&zoom=2" --eval "<async js using window.G>" --wait ms --out name`. Rooms: `?scene=int:<roomId>`. Intro replay: `?scene=city&intro`. Map preview: `node tools/mapview.mjs`.
- Publish: `mcp__claude-artifacts__publish_files` with files [{as:'index.html', path:'/home/user/Pixel-city-2/dist/index.html'}], slug `6723cacd-7010-466b-a6d7-f100f5510757`,
  `base_version` = the version returned by the last publish (or call `get_artifact` to read the live version), and a short label. Then give the owner the link and what changed.
- Git: commit locally after each step with the attribution trailer. `git push -u origin claude/pixel-city-life-sim-21h2e3` currently fails with 403 (GitHub app not installed for the repo) — owner must fix at https://claude.ai/connect-github.

## Design guard-rails (from the owner; see OWNER_NOTES for the full digest)
- Chunky pixel art world, high-detail characters, zoomed-in camera, modern diverse US city, lots of visible life.
- Free-roam life sim first; story is a constant gentle stream that never dominates. "Opportunities" and "Appointments", never "missions".
- No driving. Walk, bus, light rail, taxi.
- Enterable places are marked by the warm glow at the door, not arrows. Not every building is enterable, but every obvious public place is (or has a walk-up counter).
- Shopping: buy menus for stalls/counters/online; big stores are physical (pick from racks/shelves, pay at counter) AND offer the menu.
- Activities should have small mechanics; progress bars need good animation and a visible result. Always allow "show up and skip" for work shifts (Auto-work).
- Expand and convert; never remove or re-lay-out the city.
