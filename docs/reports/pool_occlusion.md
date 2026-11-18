# Night-light pool occlusion — resume report (2026-11-18)

## Progress
- [x] 0. Report file created; read LIGHTING_RESUME_BRIEF.md + lighting_as_left/README.md.
- [x] 1. 'Before' build (HEAD 3e2425a engine files = Stage 117/118) built; 9 night shots 500x900 zoom 2 in out/shots/poolocc/before_*.png (downtown 197,264; glass 189,150 t23; harbour 101,326; oldtown 123,263; cars_central 213,326 t22.5; cars_plaza 222,228; juniper 62,231; fade = player at 69.5,235 behind bld.res.loft; fade_oldtown = player behind the teahouse).
- [x] 2. Patch applied cleanly (git apply); the 4 engine files + tools/poolocc_check.mjs are byte-identical to docs/wip/lighting_as_left/files/. Built: dist/index.html (after).
- [x] 3. Read the patch in full (approach notes below when finished). Checks started in background (poolocc -> nightcheck -> perf --verify).
