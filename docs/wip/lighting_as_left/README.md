# The night-light (pool occlusion) work, exactly as the Fable worker left it

Saved for owner msg 248 (2026-11-17): "save the lighting work as is separately. If this doesn't go well I'll come back at the reset
and it'll pick up where it left off. Put in this chat log until before it started working on the lighting so it has context."

Worker: Fable, agent id `aa491b05f2d98ad25`, in the lead session of 2026-11-14..17 (session ab4bf52b-...). It ran 02:31-06:00 UTC on
2026-11-17 and stopped when the Fable limit ran out (resets 2026-11-21 08:00 UTC).

## What is in this folder
- `files/` the four engine files as the worker left them (src/engine/render.js, src/engine/sprites.js, src/engine/world.js, src/world/_ctx.js)
  and its test tool (`tools_poolocc_check.mjs`; the same file is also at tools/poolocc_check.mjs). The same state is in git at commit `bf2e957`.
  `../lighting_pool_occlusion.patch` is the same change as a patch against the live game (Stage 117).
- `worker_transcript.jsonl` its complete raw log (its brief, every command, every result). `worker_transcript_readable.md` the same, readable.
- `chat_log_until_lighting_start.md` the owner/lead conversation from the start (2026-11-14) to the moment the job was launched, for context.
- `pictures/` its own before/after montages (16 places: central, viaduct, harbour, old town, lofts, rain, dusk, ...).
- `check_results/` its last check runs (x_* = the final build): pool-occlusion check 0 FAIL, nightcheck all passed, no page errors,
  "VERIFY OK: same pixels" (daytime unchanged), occl/nav checks, and a before/after speed run (x_perf.txt: about the same fps).

## Where it stopped (read from its log, 2026-11-17, by the lead)
It was in its LAST step: "final matched builds" then a full battery of checks on the final build, which ALL PASSED (05:57).
What was still missing: its report (docs/reports/pool_occlusion.md), the hand-back to the lead, and the lead's own check + publish.
So the work is probably nearly finished, but NOBODY besides the worker has checked it yet.

## To pick up where it left off
A. Same session, after the reset (2026-11-21 08:00 UTC), if this session still exists:
   1. Put its files back in place: `git checkout bf2e957 -- src/engine/render.js src/engine/sprites.js src/engine/world.js src/world/_ctx.js`
      (or `git apply docs/wip/lighting_pool_occlusion.patch`).
   2. SendMessage to `aa491b05f2d98ad25`: "the limit has reset; your files are back as you left them; your final checks passed at 05:57;
      write docs/reports/pool_occlusion.md and hand back".
   (A session's container is reclaimed after a period without use, so this route may not exist by then; B always works.)
B. Any session / account: a new Fable worker gets docs/wip/LIGHTING_RESUME_BRIEF.md + this folder. It applies the patch, reads
   `worker_transcript_readable.md` (what was tried and why) and the chat log, re-runs the checks in check_results/, and writes the report.
