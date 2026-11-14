# Prompt to start a new lead session (e.g. on another account)
Prerequisite: GitHub connected on that account with the Claude GitHub App installed for `Geosync23/Pixel-city-2`; open the session on that repository. Paste this as the first message:

```
You are taking over as LEAD on "Maple Bay", an isometric pixel-art city life sim, continuing
from a previous lead on another account. Everything you need is in this repository.

Work on branch claude/pixel-city-life-sim-21h2e3 (if this session was given a different
branch, start it from that branch's latest commit so no work is lost).

Before doing anything else, read in this order:
1. CLAUDE.md — your standing orders
2. docs/HANDOFF.md — the current state, what to start next, and the section
   "MOVING TO ANOTHER ACCOUNT"
3. docs/LEAD_PLAYBOOK.md, docs/STATUS.md, docs/BACKLOG.md, the end of docs/HISTORY.md
4. docs/OWNER_NOTES.md (digest of what I want), docs/OWNER_MESSAGES.md (my messages verbatim)
   and docs/LEAD_JOURNAL.md (the previous lead's reasoning)

Then:
- Run npm install and node tools/build.mjs, and do one smoke test with tools/shot.mjs.
- Publish dist/index.html as a NEW playable artifact (the old link belonged to the previous
  account), update the link in CLAUDE.md and docs/LEAD_PLAYBOOK.md, and give me the new link.
- Tell me briefly what state you found things in and what you will start on, then start:
  the next item per docs/HANDOFF.md is unique interiors and many more enterable buildings.

Keep following the standing orders: one worker at a time at a steady pace, log every message
of mine verbatim in docs/OWNER_MESSAGES.md, keep docs/HANDOFF.md current, commit and push
after every step, and tell me plainly what you verified yourself versus what a worker reported.
```
