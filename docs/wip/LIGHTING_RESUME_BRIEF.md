# Brief: resume the NIGHT-LIGHT POOL OCCLUSION fix (owner msgs 219, 245-247)

Owner's plan (msg 247: "lets do it per your plan"). Since owner msg 249 the Fable session does this ITSELF (no lead/worker split); "report to the lead" below = write it in the report and tell the owner briefly.

## The problem (owner msg 219)
At night, the pools of light from street lamps, windows and headlights show THROUGH buildings: a pool on the far side of a building
is painted over the building's front. Pools must be hidden by buildings, except where a building is faded because the player
stands behind it (the see-through fade near the player).

## What exists
- The game as published (Stage 117) uses the engine files as they were at commit 49f9c4e. They are back in place in src/.
- The first Fable worker (2026-11-17) ran out of usage mid-job and left NO notes. Its unfinished edits (about 350 lines,
  mostly src/engine/render.js, small bits in src/engine/sprites.js, src/engine/world.js, src/world/_ctx.js) are saved as
  `docs/wip/lighting_pool_occlusion.patch` (`git apply docs/wip/lighting_pool_occlusion.patch` re-applies it cleanly on Stage 117).
  Its test tool is tools/poolocc_check.mjs. A perf run it made showed no slowdown. Nobody has checked whether it works.
- Background on the night pass: docs/reports/nightlight.md, docs/reports/performance.md, docs/reports/occlusion.md.

## NEW (owner msg 248): it was nearly done
The lead read the first worker's log: it was in its final step and its last full check run on the final build ALL PASSED
(0 pool-occlusion failures, nightcheck passed, no page errors, daytime pixels unchanged, speed about the same). Only its report
was missing. Everything it left (files, full log, pictures, check results, the chat before it started) is in docs/wip/lighting_as_left/
(README there). So step 1 below is mostly: apply the patch, read its log, re-run its checks, look at its pictures, write the report.

## How to work (the owner agreed to this plan, msg 246-247)
1. ASSESS FIRST, CHANGE NOTHING. Read the patch and the night pass. Write `docs/reports/pool_occlusion.md` (one page): what the patch does,
   whether its approach is sound, what is missing, and whether to CONTINUE it or START FRESH, with a rough size. Then STOP and report to the lead.
   The lead reads it (and may ask the owner) before any code is changed.
2. Then SMALL STEPS: one change at a time, each tested (tools/poolocc_check.mjs + night screenshots + tools/perf.mjs), committed,
   and noted in the report (a "Progress" list), so a cut-off loses almost nothing.
3. Report to the lead after every step. If a step is getting expensive or stuck, stop and say so; do not push on.
4. Done means: night screenshots before/after of at least 5 places (downtown, harbor, old town, a street with cars at night, the player
   standing behind a building), no pool through any building, the see-through fade still shows pools, no slowdown at phone size, zero page errors.
5. The worker owns only the files above + its report. It does not publish; the lead checks the pictures and publishes.
