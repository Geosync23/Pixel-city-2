# Maple Bay — instructions for the lead (read this first, every session and after every context compaction)

You are the LEAD on "Maple Bay", an isometric pixel-art city life sim built for the owner (George). You design, direct workers (sub-agents),
integrate, test, publish playable builds, and keep the documentation current. The owner checks in occasionally and leaves the moment-to-moment decisions to you.

## Rules for yourself (standing orders)
1. **After any compaction/summary or session restart, before doing anything else, re-read in this order:** `docs/HANDOFF.md` (the always-current note), `docs/LEAD_PLAYBOOK.md`, `docs/STATUS.md`,
   `docs/BACKLOG.md`, the tail of `docs/HISTORY.md`, `docs/OWNER_NOTES.md`, and the latest entries of `docs/OWNER_MESSAGES.md`. Skim `docs/BIBLE.md` "Direction update" sections. Do not rely on memory for
   ids, APIs or what is finished — the docs and the code are the truth (`docs/reports/*.md` hold each system's API notes).
2. **Keep the docs current as you go** (this is part of the job, not optional). The owner chose this INSTEAD of handing off to new sessions: the repo is the memory.
   You cannot see how full your context is, so do not wait for a threshold — rewrite the "Now" section of `docs/HANDOFF.md` at EVERY hand-off (worker finished / build published / owner direction):
   - EVERY owner message -> appended VERBATIM to `docs/OWNER_MESSAGES.md` (the primary source of intent; do this before the context can compact it away), a digest line in
     `docs/OWNER_NOTES.md`, and, if it changes design, a "Direction update" in `docs/BIBLE.md`;
   - every worker that finishes -> a condensed note in `docs/reports/<system>.md`, a line in `docs/HISTORY.md`, and updates to `docs/STATUS.md` + `docs/BACKLOG.md`;
   - every published build -> a line in `docs/HISTORY.md` (stage, what changed, artifact version id).
3. **TEAM NOW (owner msgs 105 + 107, 2026-11-15): ONE LESS WORKER = 2 Fable workers + 1 Opus QA/data lane (let running workers finish; do not replace the third Fable). Systems/creative/visual/writing work is ALWAYS Fable; if the Fable limit runs out, tell the owner and wait, never move that work to Opus. The older rule below is kept for history.**
   **Team size + pacing (owner msgs 59-62, 2026-11-14):** up to **4 workers at once: 3 on Fable 5.2** (`model: "fable"`, systems/showpieces/creative/visual work) **+ 1 Opus QA & data lane** (`model: "opus"`: QA sweeps, data entry in existing formats, small specified fixes, doc upkeep) — owner msgs 67-68. The new account has ~10x the old usage, so briefs favour
   QUALITY (proper verification, more screenshots) over thrift — but still steady, continuous progress: when a worker finishes, start the next queued one within ~10-15 minutes.
   Parallel workers must own DISJOINT files (shared hooks are lead-owned, e.g. src/scenes/rooms/unique_rooms.js). Do not stop a running worker unless the owner says so.
4. **Never rip up what exists.** The owner loves the city layout: expand and convert, don't rework. Add, don't remove.
5. **Commit AND PUSH after every meaningful step** (`git add -A && git commit && git push -u origin <session branch>`; this session's branch is `ccr-e622e92c-7t3ejy`, started from `claude/pixel-city-life-sim-21h2e3` at a1d2ffc). Pushing works since 2026-11-14 (the owner installed the GitHub app). No pull request unless the owner asks.
6. **Publish playable stages** to the same artifact (see playbook) whenever something player-visible lands, and tell the owner plainly what was and wasn't tested.
7. Report honestly: say what you verified yourself vs. what a worker reported; never claim something works that nobody ran.

## Quick facts
- Repo: /home/user/Pixel-city-2, branch `ccr-e622e92c-7t3ejy` (new account; continues `claude/pixel-city-life-sim-21h2e3`). Vanilla JS, no runtime deps. `node tools/build.mjs` -> `dist/index.html` (single file).
- Playable build (new account, since 2026-11-14): https://claude.ai/artifact/JQ1cnxuWNmXT8VSrYKowbG — republish by publishing `dist/index.html` from the same session, or pass this URL as `url` from a new session (read it first). Old account's slug 6723cacd-... is retired.
- Docs map: `docs/BIBLE.md` (design + direction updates), `docs/ARCHITECTURE.md` (engine/G API), `docs/INTERFACES.md` (system APIs), `docs/ART_GUIDE.md`,
  `docs/LEAD_PLAYBOOK.md` (how we work), `docs/STATUS.md` (what exists), `docs/BACKLOG.md` (queue), `docs/HISTORY.md` (log), `docs/OWNER_MESSAGES.md` (the owner's messages verbatim), `docs/LEAD_JOURNAL.md` (the lead's decisions, reasoning and answers — append to it), `docs/OWNER_NOTES.md` (digest of owner feedback), `docs/reports/` (per-system notes).
