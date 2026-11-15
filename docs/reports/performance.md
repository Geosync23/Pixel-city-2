# Performance and smoothness (Fable worker, 2026-11-15)

**In short.** The freezes while moving through the city (0.2-0.4 s whenever new ground, buildings or people scrolled into view) are gone in the benchmark. On a city walk the worst frame fell from about 220 ms to about 100 ms, frames over 100 ms from 3-5 per walk to none, and the frame rate over the slowest 1% of frames rose from 11 to 18 fps; cab rides, snow and night rain improved the same way. Nothing looks or plays differently: 17 still scenes and 7 scenes full of moving people, cars and snow are pixel-for-pixel the same before and after, and every sprite of the city was compared drawn the old way and the new way.

**Nobody has run this on a real phone.** All numbers are a desktop Chromium slowed down 4x (and 6x). That imitates a phone's processor, not its graphics chip and not its memory limits.

## 1. Method (what is measured, and how far to trust it)
- `tools/perf.mjs` (new, reusable; usage in its header). Headless Chromium through Playwright, 390x844, touch, `deviceScaleFactor` 2 (and 3), CPU slowed with CDP `Emulation.setCPUThrottlingRate` 4 (and 6). The single-file build is served from memory; the save `tools/perf_save.json` (day 0, at home in Old Town: QA's `ck6_d0_home.json`) is loaded, `Math.random` is seeded, tips and needs are off.
- Every run is a **fresh page**, so the ground and sprite caches are cold: each scene is a first visit, the worst case for hitches.
- Scenes: `walk` (40 s on foot Old Town -> river park -> Downtown, midday), `night_rain` (the same walk at 21:30 in rain), `cab` (taxi from the Old Town market to The Orpheum), `train` (light rail Old Town -> Central, 45 s), `parade` (Blossom Parade staged with `G.cityEvents.debug.start`, then marching, 25 s), `rooms` (into and out of five rooms: cafe, bookstore, grocery, gym, cinema), `busy_room` (the Galleria and Central Station on foot), `phone` (phone open over the city, then the Map app), `walk4x` (city walk at game speed 4), `snow` (winter walk in snowfall).
- Per run: frame times from rAF to rAF (fps; **1% low** = the frame rate over the slowest 1% of frames; worst frame; frames over 50 ms per 10 s; frames over 100 ms), the **JS time inside the frame callbacks** (p50 / p95 / worst: the game's own work without the browser's painting), the JS heap after a forced GC at the start and the end, page errors. `--profile` adds a CPU profile: top self-time functions, browser calls by caller, and the long frames (JS over 40 ms) split by cause. `--soak N` wanders for N minutes and reads the heap every 30 s. `--verify` runs the same-pixels checks of section 5.
- **Before and after are two builds measured in interleaved runs** (`--html before.html,after.html`: before, after, before, after ...), three runs each, because other workers load this machine (load average 2.5-6 on 4 cores during my runs). Tables give the median and (min-max); when the ranges overlap, the difference is noise and I say so. "Before" is a snapshot of the tree taken at 15:24 (without `sim/rel.js`, which did not build then); "after" is that snapshot with only my files replaced, so nobody else's change is in the comparison.
- What the numbers do **not** show. (1) A phone's GPU: here the canvas is rasterised in software on the main thread, and 40-50% of the busy time in every scene is the browser's own painting ("(program)" in the profiles; measured with a trace: `LayerTreeHost::DoUpdateLayers` and canvas snapshots). The game cannot change that and a phone does it on its graphics chip, so the fps column is pessimistic and moves little; the hitch columns (worst frame, frames over 50 / 100 ms, 1% low, JS worst) are what my changes act on. (2) The bake worker (section 3) runs on another core at full speed here, because CDP only slows the page's main thread. On a phone that core is about as slow as the main one, so sprites arrive later than in the benchmark; they are then finished on the spot as before (never a missing picture). Table 2's "no worker" row is the floor if the worker gives nothing.

## 2. What was wrong (from profiles)
Long frames (JS over 40 ms in one frame) on the walk before any change: 70 frames, 5.2 s of a 40 s walk. Their time by cause:

| cause | walk | night_rain | parade |
|---|---|---|---|
| object sprites baked when they scroll into view (trees, buildings) | 29% | 33% | 3% |
| ground chunks painted when they scroll into view | 21% | 37% | 25% |
| garbage collector | 13% | 7% | 13% |
| character sprites baked on first use | 9% | 2% | 19% |
| vehicle / float sprites (`assetSprite`) | 5% | under 2% | 15% |
| everything else (sim updates, HUD, draw) | 23% | 20% | 25% |

- One ground chunk (16x16 tiles, 516x290 px) costs 9-12 ms on this machine, so 40-50 ms at 4x, and two could land in one frame. A big tree or building costs 10-40 ms (40-160 ms at 4x). The city has 3,785 distinct object sprites, 1,696 of them trees (each has its own seed); 61 cost over 10 ms.
- Inside baking, about a quarter of the time was `mix` / `dk` / `lt` (colour blending by parsing and formatting hex strings, per pixel) and the `C()` lookups of the fresh strings they returned.
- Steady state by day is light: JS p50 4-5 ms of a 16.7 ms frame at 4x. At night in rain it is 10-11 ms: the ambient and window-glow passes (about 2.7 ms), and the weather overlay (about 2.2 ms: ~300 rain streaks, each one `drawImage`).
- Already fine, left alone: the canvas is rendered at the art's resolution (131x283 backing pixels on a phone at the default zoom; the zoom is an integer and CSS scales it up), at dpr 2 and 3 alike; `dt` is clamped to 50 ms, so a hitch never caused a jump or a double step; a save takes 0.3-0.4 ms (26 KB); crowd and traffic updates are each under 1% of the time.

## 3. What was changed (biggest first)
1. **Bake worker** (`src/engine/sprites.js`). Sprites that are plain data (a registry asset + params: every building, tree, prop and vehicle; a character's spec + pose) are drawn by a Web Worker when they are about to come on screen. The worker is a second copy of the game's own script (the single-file build's inline `<script>`, loaded from a Blob) in which only the art library and the rasteriser run; it stops loading right after them. It sends back the pixel buffers; the main thread only turns them into canvases. A sprite that is needed before the worker has delivered it is baked on the spot exactly as before, so the picture never depends on the worker. If the worker cannot start (dev server, a sandbox that forbids `blob:` workers, a device that reports under 4 GB of memory) or stops answering, everything falls back to item 2. Why a worker and not slicing: object art plots pixel by pixel in its own loops, so drawing a band of rows costs as much as the whole sprite (measured: a quarter-height band costs 98% of the whole for trees, 36-71% for buildings).
2. **Bake-ahead queue with a per-frame time allowance** (`sprites.js` `prebake*`, `bakeTick`; `render.js` `_ahead`). Every 6th frame the renderer looks at a ring around the screen (20 px, stretched in the direction the camera moves by 80 frames of travel, at most 240 px; 150 frames / 420 px for ground) and queues what is not painted yet: ground chunks, objects, and entities that offer `prebake(pri)`. The queue gets 1.2-5 ms per frame: it backs off while frames come late and creeps back up while they are on time; a job about to come on screen always gets the 5 ms.
3. **Ground chunks painted in bands** (`raster.js` `renderJob / renderStep`, `ground.js` `chunkJob`). Ground is filled polygons, so it can be drawn a band of rows per slice at no extra cost: a chunk is spread over several frames ahead of the camera instead of 40-50 ms in the frame it appears. Exact by construction: every pixel write goes through `px()` or `fill()`, nothing reads the target back, so a band pass writes exactly the pixels a full pass writes in those rows, in the same order.
4. **Faster baking**: `mix` / `dk` / `lt` remember their results (they are pure): 25-30% less time for the same bakes (a sweep of 99 chunks + their objects: 2.2-2.5 s -> 1.5-1.9 s). `C()` keeps the last colour. Pixel buffers are pooled instead of allocated per sprite.
5. **Scene changes**: `Renderer.warm()` (called by `G.go` under the fade) now also bakes the objects in view, so that happens while the screen is black, not in the first frames after it.
6. **Per-frame garbage and draw calls** (`render.js`): the item list, the depth sort's work arrays and the object query are reused (the game allocated 40 KB per frame, now 26 KB); off-screen lights are rejected before their pool sprite is looked up (the loop runs over all 1,078 lights of the city every night frame); the window-glow pass only cuts an item out of the light buffer where light has been drawn (at one night spot: 17 -> 9 cut-outs per frame); the sprite cache refreshes "recently used" once a second instead of on every hit; ground chunks are evicted by last use instead of by age (a chunk still on screen could be evicted and painted again).
7. **Entities announce their next sprite**: citizens (`Cit.prebake`, and the next walk frame while visible), vehicles (`Veh.prebake`, at spawn and near the screen), and, outside my file list, named characters (`Char.prebake`), parade marchers and floats (`Mar.prebake`, `Flt.prebake`).
8. **Small per-frame UI things**: the HUD's toast check does no layout read when there is no toast; the guide arrow reads its wrapper's size every 12th frame and writes styles only when they change; speech bubbles write their position only when it moved; `G.nearestInteractable` no longer builds a list (same scan, same order).

No visual or gameplay change anywhere, so **no adaptive-quality step was built**. The tunables are one object, `BAKE` in `src/engine/sprites.js` (`G.renderer.bake` at run time): `on`, `worker`, `minMemGB` 4, `msMax` 5 / `msMin` 1.2 (ms per frame), `ring` 20, `look` 80, `lookMax` 240, `entRing` 36, `chunkLook` 150, `chunkLookMax` 420, `urgent` 56, `flying` 4, `patience` 15000. A wider ring means fewer sprites finished on the spot but more baked and never seen: with the first setting (ring 32, look 150) the walk had 1.2 frames over 50 ms per 10 s instead of 2.7, at 44% more sprite pixels in memory than the old behaviour instead of 26%. For testing on a device: add `?nobakeworker` (queue only) or `?nobake` (old behaviour) to the page address. `G.renderer.perf()` returns the counters, including `worker: "on"` or `"off: <reason>"`.

## 4. Results
**Table 1. Before vs after, all scenes** (CPU 4x, dpr 2, 3 interleaved runs each, median (min-max), 60 runs, 0 page errors).

| scene | build | fps | 1% low fps | worst frame ms | frames >50 ms per 10 s | frames >100 ms | JS ms p50 / p95 | JS worst ms | page errors |
|---|---|---|---|---|---|---|---|---|---|
| walk | before | 54.8 (53.7-55.6) | 11 (9.9-12.5) | 217 (200-250) | 5.5 (5-6.2) | 5 (3-5) | 4.2 / 16.7 | 224 (205-255) | 0 |
| walk | after | 56.1 (55.8-57.4) | 18.1 (17.4-20) | 100 (83-100) | 2.7 (2.2-3) | 0 (0-0) | 5.5 / 16 | 75 (75-79) | 0 |
| night_rain | before | 43.4 (37.9-45.4) | 8.5 (6.8-8.9) | 333 (233-333) | 11.2 (10.2-18.4) | 6 (6-16) | 11.2 / 28.6 | 331 (235-337) | 0 |
| night_rain | after | 47.1 (43.8-50.3) | 16.1 (15.6-17.9) | 100 (83-100) | 5.2 (2-5.2) | 0 (0-0) | 10.8 / 21.9 | 73 (67-78) | 0 |
| cab | before | 55.6 (53.7-55.7) | 11.7 (10.5-13.3) | 317 (300-317) | 5.8 (4.2-6.3) | 4 (2-4) | 5.5 / 17 | 309 (301-321) | 0 |
| cab | after | 58 (57.6-58.3) | 20.8 (20.6-23.6) | 100 (83-100) | 1.3 (0.8-1.7) | 0 (0-0) | 5.9 / 13.2 | 73 (64-75) | 0 |
| train | before | 59.4 (59.4-59.7) | 30.5 (29.5-39) | 133 (117-217) | 0.2 (0.2-0.2) | 1 (1-1) | 8.1 / 14.3 | 112 (96-174) | 0 |
| train | after | 59.2 (59.1-59.6) | 25.8 (24.7-34.2) | 233 (217-250) | 0.2 (0.2-0.4) | 1 (1-1) | 8 / 13.1 | 123 (122-161) | 0 |
| parade | before | 57.1 (56.2-57.3) | 14.4 (13.3-16.5) | 167 (117-217) | 2.1 (2.1-2.5) | 3 (2-3) | 5.7 / 14.3 | 162 (119-171) | 0 |
| parade | after | 56.1 (54.6-56.6) | 16.2 (15.9-16.9) | 150 (100-183) | 2.5 (1.3-3) | 1 (0-1) | 5.8 / 15.9 | 84 (79-96) | 0 |
| rooms | before | 51.1 (50-51.1) | 4.2 (3.8-4.2) | 600 (583-667) | 6.4 (5.5-6.9) | 7 (7-8) | 3.1 / 15.6 | 324 (266-327) | 0 |
| rooms | after | 52.3 (50.6-52.4) | 4.7 (4.2-5.1) | 583 (483-617) | 6.2 (5.3-7.6) | 8 (7-8) | 3.1 / 13.8 | 150 (109-175) | 0 |
| busy_room | before | 57.7 (57.2-58.1) | 14.6 (13.7-16.4) | 283 (250-400) | 1 (0.6-1.3) | 2 (2-2) | 5.3 / 13.2 | 223 (167-270) | 0 |
| busy_room | after | 58 (57.1-58.3) | 13.5 (12.9-15.9) | 383 (250-400) | 1.3 (1-1.6) | 2 (2-3) | 5.3 / 12.4 | 119 (97-158) | 0 |
| phone | before | 57.9 (56.4-58.1) | 13.8 (11.2-15.9) | 217 (183-250) | 2 (2-4.6) | 2 (1-3) | 2.6 / 9.7 | 175 (156-205) | 0 |
| phone | after | 57 (55.6-57) | 10.4 (10-12.3) | 283 (250-317) | 3.3 (3.3-3.3) | 2 (2-2) | 2.9 / 10 | 241 (209-248) | 0 |
| walk4x | before | 37.1 (35.6-39.9) | 5 (4.3-5.4) | 317 (300-367) | 27.5 (25.2-27.9) | 23 (19-23) | 10 / 58.6 | 313 (288-359) | 0 |
| walk4x | after | 38 (35.4-42.6) | 9 (8.4-10.4) | 133 (133-167) | 18.3 (10.6-24.9) | 6 (6-9) | 13.2 / 39.5 | 131 (128-135) | 0 |
| snow | before | 49.7 (47.3-52.2) | 9.7 (8.3-11.2) | 267 (233-333) | 9.6 (7.3-10.3) | 4 (3-7) | 8.8 / 25 | 267 (241-329) | 0 |
| snow | after | 53.1 (50.8-56.8) | 17.4 (14.7-23.7) | 83 (67-100) | 3.3 (1.3-5.6) | 0 (0-0) | 8.2 / 20 | 77 (55-95) | 0 |

heap MB (after a forced GC, start -> end of the scene): walk/before 27->29.5, walk/after 27.6->28.7, night_rain/before 26.7->29.5, night_rain/after 26.9->28.7, cab/before 26.7->30.3, cab/after 28.1->29.6, train/before 26.7->27.7, train/after 26.9->28.1, parade/before 26.9->29, parade/after 28->29.5, rooms/before 27->29.7, rooms/after 27.8->30.3, busy_room/before 26.9->28.7, busy_room/after 27.3->28.7, phone/before 27.3->28, phone/after 27.4->28.1, walk4x/before 26.7->30.8, walk4x/after 27.1->29.9, snow/before 27.3->29.4, snow/after 27.6->29

Reading it:
- `walk`, `night_rain`, `cab`, `snow`: clear, outside the noise. Worst frame 217-333 -> 83-100 ms, frames over 100 ms 4-6 -> 0, frames over 50 ms per 10 s halved or better, 1% low up 65-90%.
- `walk4x`: clear on hitches (frames over 100 ms 23 -> 6, worst 317 -> 133 ms); fps unchanged inside the noise (37 -> 38). The JS p50 rose from 10 to 13 ms: the baking that used to arrive in lumps is now spread over the frames.
- `parade`: JS worst 162 -> 84 ms and the 1% low 14.4 -> 16.2 are outside the ranges; fps, worst frame and frames over 50 ms are inside the noise. The parade's worst frame is the frame the event is staged in (all its props placed in view at once, see section 9).
- `rooms`, `busy_room`, `train`, `phone`: the JS worst inside a frame fell in rooms (324 -> 150) and busy rooms (223 -> 119); everything else is inside the noise, including the phone (JS worst 175 -> 241 here, 247 -> 166 in the earlier session below: it is the Map app opening). Their worst FRAME is the scene change or the phone opening, which is not frame work (section 7).
- JS p50 is 0.3-1.3 ms higher on walks (the bake-ahead's share, about 1.6 ms per frame at 4x); it is lower or equal elsewhere.

**Table 2. What each part gives** (same method, the build before the last tuning step; "bake-ahead off" = items 4-6 and 8 only, "no worker" = plus the queue and banded ground, "after" = plus the worker).

| scene | build | fps | 1% low fps | worst frame ms | frames >50 ms per 10 s | frames >100 ms | JS ms p50 / p95 | JS worst ms | page errors |
|---|---|---|---|---|---|---|---|---|---|
| walk | before | 55.8 (55-57) | 11.6 (9.5-13.1) | 233 (217-283) | 5.2 (4-6.5) | 3 (2-7) | 3.6 / 15.5 | 241 (219-278) | 0 |
| walk | after | 57.8 (57.2-58.2) | 23.8 (19.7-26) | 83 (83-100) | 1 (0.5-1.2) | 0 (0-0) | 5.1 / 13.7 | 66 (64-81) | 0 |
| walk | after?nobakeworker | 57.3 (55.6-57.3) | 15.9 (14.3-17.5) | 150 (133-200) | 2.7 (1.7-3.7) | 2 (2-2) | 5.5 / 14.9 | 148 (139-199) | 0 |
| walk | after?nobake | 56.8 (55.7-56.8) | 14.1 (12.8-14.7) | 183 (150-200) | 4 (4-4.7) | 3 (1-3) | 3.8 / 13.5 | 180 (142-212) | 0 |
| parade | before | 57.4 (57.3-57.7) | 15 (14-16.8) | 133 (133-133) | 3 (2.5-3.4) | 2 (1-4) | 5.1 / 13.4 | 139 (130-140) | 0 |
| parade | after | 57.4 (57.3-57.6) | 19.5 (18.7-20.5) | 150 (117-167) | 1.3 (0.8-3) | 1 (1-1) | 5.5 / 14 | 104 (81-108) | 0 |
| parade | after?nobakeworker | 56.2 (54.4-56.7) | 15.3 (14.2-15.6) | 150 (133-183) | 2.9 (2.1-3) | 2 (2-2) | 6.4 / 15.5 | 129 (116-154) | 0 |
| parade | after?nobake | 57.4 (57-58.1) | 18.3 (15-18.3) | 133 (117-150) | 2.1 (1.3-3) | 1 (1-2) | 5.2 / 14.3 | 99 (94-101) | 0 |

On the walk every step helps; on the parade only the JS worst and the 1% low move, the rest is inside the noise.

**Table 3. dpr 3** (CPU 4x, 2 runs each; build with ring 32 / look 150, before the last tuning step).

| scene | build | fps | 1% low fps | worst frame ms | frames >50 ms per 10 s | frames >100 ms | JS ms p50 / p95 | JS worst ms | page errors |
|---|---|---|---|---|---|---|---|---|---|
| walk | before | 56.8 (56.6-56.8) | 12.9 (12.2-12.9) | 317 (217-317) | 4.2 (3.2-4.2) | 3 (3-3) | 3.7 / 14.8 | 316 (217-316) | 0 |
| walk | after | 58.8 (58-58.8) | 26.2 (21.9-26.2) | 100 (50-100) | 1 (0.2-1) | 0 (0-0) | 4.8 / 13.7 | 64 (48-64) | 0 |
| night_rain | before | 54.4 (52.1-54.4) | 12.2 (10.8-12.2) | 217 (217-217) | 5.5 (5-5.5) | 5 (4-5) | 8.9 / 20.1 | 211 (209-211) | 0 |
| night_rain | after | 57.3 (55.7-57.3) | 25.1 (22.4-25.1) | 83 (67-83) | 1.2 (0.7-1.2) | 0 (0-0) | 8.2 / 15.9 | 68 (49-68) | 0 |
| parade | before | 57.8 (57.6-57.8) | 16.1 (15.6-16.1) | 150 (133-150) | 3 (2.5-3) | 2 (2-2) | 5.1 / 12.8 | 143 (110-143) | 0 |
| parade | after | 58.3 (57.5-58.3) | 21.5 (19.5-21.5) | 167 (100-167) | 0.8 (0.8-0.8) | 1 (0-1) | 5.7 / 14.5 | 108 (71-108) | 0 |
| busy_room | before | 58.4 (56.4-58.4) | 17.1 (14.2-17.1) | 333 (300-333) | 1.3 (0.6-1.3) | 2 (2-2) | 5.7 / 14.9 | 216 (211-216) | 0 |
| busy_room | after | 58 (57-58) | 15.4 (14.6-15.4) | 333 (300-333) | 1.3 (1-1.3) | 2 (2-2) | 4.9 / 13 | 141 (107-141) | 0 |

**Table 4. CPU 6x** (dpr 2, 2 runs each; same earlier build).

| scene | build | fps | 1% low fps | worst frame ms | frames >50 ms per 10 s | frames >100 ms | JS ms p50 / p95 | JS worst ms | page errors |
|---|---|---|---|---|---|---|---|---|---|
| walk | before | 51.7 (49-51.7) | 8.9 (7.6-8.9) | 517 (300-517) | 9 (8-9) | 9 (7-9) | 6.2 / 24.8 | 513 (307-513) | 0 |
| walk | after | 50.8 (49.7-50.8) | 16.2 (15.6-16.2) | 100 (83-100) | 5 (4-5) | 0 (0-0) | 8.2 / 21.8 | 87 (73-87) | 0 |
| night_rain | before | 32.5 (32.2-32.5) | 6.7 (6.1-6.7) | 467 (333-467) | 21.9 (19.7-21.9) | 15 (13-15) | 15.9 / 43.3 | 451 (316-451) | 0 |
| night_rain | after | 35.3 (32.2-35.3) | 11.8 (11.1-11.8) | 117 (100-117) | 19.4 (12-19.4) | 1 (1-1) | 17.3 / 36.4 | 103 (93-103) | 0 |
| parade | before | 44.7 (44.3-44.7) | 7.6 (7.2-7.6) | 233 (200-233) | 11.8 (9.3-11.8) | 7 (6-7) | 9.2 / 27.3 | 219 (187-219) | 0 |
| parade | after | 47.2 (46.9-47.2) | 10.5 (10.2-10.5) | 233 (233-233) | 7.6 (5.9-7.6) | 3 (2-3) | 9.1 / 25 | 140 (139-140) | 0 |

At 6x the fps itself does not improve on the walk (51.7 -> 50.8, noise) and night rain stays near 33-35 fps: that is the steady cost of section 7, not hitches. The hitches fall as at 4x (walk worst 517 -> 100 ms).

**Table 5. The same ten scenes on the earlier build** (ring 32 / look 150, an independent session of 60 runs, 0 errors), to show how much a session moves:

| scene | build | fps | 1% low fps | worst frame ms | frames >50 ms per 10 s | frames >100 ms | JS ms p50 / p95 | JS worst ms | page errors |
|---|---|---|---|---|---|---|---|---|---|
| walk | before | 54.8 (54.1-55.4) | 10.6 (9.4-11) | 250 (200-400) | 6.2 (6-6.2) | 5 (3-5) | 4.4 / 16.2 | 259 (210-393) | 0 |
| walk | after | 56.8 (52.7-56.8) | 19.4 (13.5-23) | 83 (67-150) | 1.2 (0.5-4.7) | 0 (0-2) | 5.6 / 15.2 | 55 (54-96) | 0 |
| night_rain | before | 47.3 (46.4-49.4) | 9.7 (9.6-9.9) | 300 (283-367) | 9 (8-10) | 4 (4-6) | 10.5 / 24.8 | 287 (281-360) | 0 |
| night_rain | after | 49 (46.8-49.9) | 14.5 (14.1-18.4) | 100 (67-100) | 4.7 (2.7-6) | 0 (0-0) | 10.2 / 22.4 | 72 (53-96) | 0 |
| cab | before | 55.2 (53.5-55.6) | 11.8 (9.4-11.9) | 267 (267-267) | 5.3 (5-7.3) | 4 (3-11) | 4.9 / 17.5 | 272 (263-274) | 0 |
| cab | after | 58.4 (57.6-58.5) | 23.8 (21.2-24) | 83 (67-100) | 0.9 (0.7-1.7) | 0 (0-0) | 5.7 / 12.7 | 71 (61-76) | 0 |
| train | before | 59.3 (58.9-59.4) | 28 (20.8-30.5) | 217 (183-217) | 0.4 (0.4-0.6) | 1 (1-2) | 8.3 / 13.9 | 182 (161-191) | 0 |
| train | after | 59.3 (59.1-59.4) | 27.1 (25.1-29.9) | 183 (167-267) | 0.2 (0.2-0.2) | 1 (1-1) | 7.8 / 13.6 | 112 (101-161) | 0 |
| parade | before | 56.1 (55.8-56.2) | 13.4 (12.4-14.4) | 150 (150-217) | 3.4 (3-3.4) | 2 (2-3) | 5.9 / 15 | 127 (111-145) | 0 |
| parade | after | 57.2 (56.5-58) | 17.7 (16.5-20) | 167 (150-183) | 0.8 (0.8-2.1) | 1 (1-2) | 5.6 / 14.1 | 103 (85-107) | 0 |
| rooms | before | 50.4 (48.9-51.3) | 4.1 (3.4-4.1) | 667 (550-667) | 7.3 (6.4-7.7) | 8 (7-8) | 3.1 / 17.8 | 315 (284-407) | 0 |
| rooms | after | 51.8 (50.9-52.2) | 4.7 (4.2-4.8) | 550 (550-633) | 5.8 (5.8-5.8) | 8 (7-9) | 3.1 / 14.1 | 151 (123-192) | 0 |
| busy_room | before | 57.8 (57.3-58.6) | 14.8 (13.3-17.7) | 333 (300-400) | 0.6 (0.6-1.3) | 2 (2-2) | 5.7 / 13 | 208 (204-274) | 0 |
| busy_room | after | 57.2 (56.6-57.9) | 15.2 (14-15.4) | 333 (317-417) | 0.6 (0.6-1.3) | 2 (2-2) | 5.3 / 13.7 | 122 (105-170) | 0 |
| phone | before | 57.3 (57.2-57.8) | 11.7 (10.8-12.9) | 283 (283-317) | 2 (2-4) | 2 (1-2) | 3 / 10.4 | 247 (225-261) | 0 |
| phone | after | 57.8 (57.6-58.1) | 13.2 (12.6-14.6) | 200 (200-267) | 2.6 (2-2.6) | 2 (2-2) | 3.1 / 9.2 | 166 (157-214) | 0 |
| walk4x | before | 34.1 (32.1-35.3) | 4.2 (4-4.4) | 367 (367-383) | 27 (26.6-34.2) | 23 (20-25) | 12.1 / 62.9 | 371 (368-391) | 0 |
| walk4x | after | 37.8 (37-37.9) | 9.4 (8.8-9.6) | 150 (117-150) | 16.3 (14.9-17.6) | 5 (4-7) | 14.4 / 38.8 | 138 (110-138) | 0 |
| snow | before | 47.9 (46.7-48.8) | 9.8 (8.7-9.9) | 250 (183-300) | 9 (7.6-9.6) | 4 (4-5) | 10.1 / 24.7 | 242 (189-307) | 0 |
| snow | after | 51.7 (50.1-54.2) | 18.5 (17-18.8) | 83 (67-83) | 2.3 (1.7-2.7) | 0 (0-0) | 9.4 / 19.6 | 52 (51-73) | 0 |

**Profiles** (one profiled run each, un-minified build; profiling itself slows the page). Long frames = JS over 40 ms in one frame.

| scene | long frames before | long frames after | what is left after |
|---|---|---|---|
| walk | 70 frames, 5.2 s | 10 frames, 0.5 s | garbage collector 60%, bake-ahead slices 16%, vehicle sprites 15% |
| night_rain | 32 frames, 2.4 s | 10 frames, 0.5 s | garbage collector 39%, draw 25%, vehicle sprites 18% |
| parade | 23 frames, 1.8 s | 4 frames, 0.2 s | float sprites 30%, garbage collector 21%, marcher sprites 19% |

Top self time, share of busy time:

| scene | before | after |
|---|---|---|
| walk | (program) 45.9%, drawImage 4.1%, GC 3.5%, putImageData 2.5%, raster `fill` 2.3%, `Renderer.draw` 2.0%, `frame` 1.8%, char art `flush` 1.7%, getContext 1.6%, `rail.js placeCars` 1.6%, `cached` 1.5%, tree art 1.1% | (program) 51.2%, drawImage 4.4%, GC 3.8%, putImageData 3.0%, `fill` 2.3%, `Renderer.draw` 2.1%, getContext 1.6%, `frame` 1.3%, `cached` 1.0%, `placeCars` 1.0%, `qz` 0.9% |
| night_rain | (program) 38.7%, drawImage 26.4%, `Renderer.draw` 3.6%, `poolSprite` 2.4%, GC 2.4%, `fill` 1.6%, putImageData 1.5%, `frame` 1.2%, `flush` 1.1% | (program) 41.6%, drawImage 28.2% (15.0% the renderer's passes, 11.1% rain), `Renderer.draw` 2.4%, GC 2.2%, putImageData 1.9%, `fill` 1.7%, `frame` 0.9%, `nearestInteractable` 0.9% |
| parade | (program) 46.9%, drawImage 5.1%, GC 3.2%, `flush` 3.2%, putImageData 2.6%, `Renderer.draw` 2.5%, getContext 2.4%, `cached` 1.8%, `placeCars` 1.6% | (program) 49.5%, drawImage 6.0%, putImageData 3.0%, GC 2.9%, `Renderer.draw` 2.4%, getContext 1.9%, `flush` 1.9%, `fill` 1.5% |

The shares barely move because the total did: the busy time of the profiled walk fell from 34.4 s to 28.2 s, and what is left is the browser's painting and the per-frame drawing. `poolSprite` (2.4% at night) is gone from the list: that was the lookup for off-screen lights.

## 5. Proof that nothing looks different
1. **Sprite by sprite** (`node tools/perf.mjs --verify`, run on the final build and again on the live tree with everyone's changes of today; it exits 1 on any difference). 3,776 distinct city object sprites painted in one go vs in bands: 0 differ. 3,770 of them painted by the worker vs on the main thread: 0 differ (12 custom railings cannot be sent and stay on the main thread; 3 sprites whose art throws fall back to it, section 9). All 784 ground chunks of the city including the outskirts, whole vs bands: 0 differ. 192 citizen sprites (12 looks, stand / walk, 4 directions, 2 frames), worker vs main: 0 differ. Six rooms (cafe, Galleria, Central Station, Fjord & Fold, museum, grocery): 930 checks, 0 differ. A winter sample: 2,004 checks, 0 differ. The draw order of 744 live frames (a city walk and the Blossom Parade, about 37 items each) against the old depth sort, kept word for word in the engine as `sortItemsRef`: 0 differ.
2. **Whole screenshots, still scenes** (scratch `perf/vis.mjs <before> <after> <dir> static`; Playwright's virtual clock, so both builds run the same frames; the sim is frozen, only the player is drawn of the moving things, and overlays and the DOM are hidden because weather particles and birds are random). 17 scenes at 780x1688, before vs after, worker running: **17 of 17 pixel-identical**: Old Town, the park, Downtown, the harbor and the hillside edge with outskirts by day; Downtown, Old Town and Central Station at night with all lights and window glow; dusk in the Arts Quarter; the Blossom Parade's dressing; cafe, Galleria, station, museum; the phone open; winter day and winter night. The same build shot twice is identical too.
3. **Whole screenshots, everything moving** (the same script without `static`: a fresh page per scene, the game seeded and stepped by the virtual clock, each build shot twice, worker running). **7 of 12 scenes are pixel-identical including every moving thing**: the day city with crowd and traffic, the marching parade, the cafe, the Galleria (123 entities), Central Station, the phone open over the city, and snowfall over the park with the crowd. The other five (three walks, the night city, rain at dusk) are not repeatable in this harness even for one build shot twice: 0.1-10% of the pixels differ between two runs of the SAME build, because the page boot is real time. Before vs after differs by no more than that. For the day city I also hashed the simulation state: the vehicles came out identical in all eight runs (four per build), and the crowd took the same two variants (38 or 39 citizens) in both builds; on the walk the state differs from run to run in both builds alike. On an earlier build the night city was identical as well. I looked at before / after pairs of the non-identical ones myself (rain at dusk, night city, day walk): the same picture with a car or a person in a different place.
4. The screenshots are in the scratchpad: `/tmp/claude-0/-home-user-Pixel-city-2/ab4bf52b-889a-5288-a866-29c2e55d0472/scratchpad/perf/vis_final_static/` and `/tmp/claude-0/-home-user-Pixel-city-2/ab4bf52b-889a-5288-a866-29c2e55d0472/scratchpad/perf/vis_final/` (`<scene>_a1.png` before, `<scene>_b1.png` after).
5. Saves: nothing in `G.state` is touched. Save -> reload gives the same scene and position in both builds, and the same list of state slices has moved on two seconds after the reload in both (scratch `perf/savechk.mjs`).

## 6. Checks
- `node src/data/validate.mjs`: OK. `node tools/build.mjs`: OK. `node tools/navcheck.mjs --rooms all`: all passed, 0 page errors, in three of four runs on the final tree. One run reported 1 failure while my CPU profiler was running on the same machine; I had kept only its last lines, so I do not know which check it was, and the two runs after it passed.
- Zero page errors in all 180 benchmark runs, in `--verify`, in both soaks and in the screenshot runs; no console error or warning from the worker. The dev server (`tools/shot.mjs` without `--dist`) works: the worker reports "off: no inline script (dev build)" and the queue does the baking.
- 10-minute soak (`--soak 10`: city walks, a room every minute, the phone, a 4x stretch; heap after a forced GC every 30 s): after 28.7 -> 31.9 MB, flat for the last three minutes (31.8-32.1); before 29.4 -> 32.7 MB with the same shape. No leak and no difference between the builds. (Soak run on the build with ring 32.)
- Memory: with bake-ahead on, the walk ends with 26% more sprite pixels cached than the old behaviour (15.0 vs 11.9 million; the cache's 36 million cap is unchanged). The worker adds roughly 30 MB to the page's process (medians of three: 418 MB with, 391 MB without, on the current build (about 9 MB of script); single readings vary by 40 MB, so this is an estimate). Before the worker stopped loading after the art it was about 70 MB.

## 7. Not fixed, and why
- **Scene changes still block for 0.2-0.6 s at 4x** (the worst frame of `rooms`, `busy_room`, `train`): building a room's world and filling it (`scenes/rooms/*`, not my files), and now, on purpose, baking its objects there. It happens while the screen is black. Measured unthrottled: 10-50 ms to enter a room, 20-140 ms to come back to the city. Opening the phone's Map app is the same kind of stall (0.2-0.3 s at 4x) and is the phone's own work.
- **Night + rain steady state** (JS p50 about 11 ms at 4x, 43-50 fps here): the ambient and window-glow passes change blend mode per lit sprite, and the rain is ~300 `drawImage` calls a frame (`sim/_weather_fx.js`, already allocation-free). Both are the look itself; I found no exact rewrite that is cheaper. Caching the glow buffer between frames was rejected: some entities redraw their sprite canvas in place (the natatorium clock), so a cached buffer could show a stale glow.
- **Game speed 4x** runs the whole simulation four times per frame by design (QA round 5: so that travel times stay honest). Hitches fell, the walk is still 38 fps here. The cost is spread thin over many systems; the largest single function is `rail.js placeCars` (1.0-2.9%).
- **Characters and vehicles that appear in view all at once** (coming back to the city from a room: the crowd is spawned on screen) are still baked in that frame. There is no "ahead" to bake them in; that first frame is still under the fade.
- **The train ride**: 23% of its time is the scenery behind the windows, drawn by the scene's own underlay (`scenes/trainride.js`, `_trainbg.js`).
- **Garbage collector**: most of what is left of the long frames on a walk (17-23 ms full collections at 4x, a couple per 30 s without the profiler). The largest remaining sources of garbage are outside my files: the door-glow underlay in `sim/stalls.js` (5.3 KB per frame: one `WS()` array per door of the city every frame) and `core/char.js sprite()` (4.1 KB per frame: it builds its cache key string every frame).
- Not done on purpose: lowering quality on slow devices (it would change the look, and the hitches did not need it); smaller ground chunks; a spatial index for `world.lights` (other systems push into and replace that array freely).

## 8. Risks
- **The worker has not run inside the claude.ai artifact frame or on a phone.** If that frame forbids `blob:` workers, the game notices (an error, or no answer within 30 s) and uses the main-thread queue: table 2's "no worker" row. `G.renderer.perf().worker` says which.
- The worker is a second copy of the game script: memory (above) and a second parse at start, in the background. (The ambience recordings added to the build today sit outside the script, so they are not paid twice.) It is not started on devices that report under 4 GB (`navigator.deviceMemory`; iPhones do not report, so they get it).
- It relies on the bundle loading without errors in a worker up to `engine/sprites.js` (true today: art first, then the engine). The worker then stops loading on purpose with an error it marks as handled. If the import order ever changes so that the art is not registered at that point, it loads everything as before; if a module before it touches the DOM at load, the worker fails and the game falls back to the queue. `tools/perf.mjs --verify` reports "worker off" in that case: run it after big merges.
- Dressed objects (`world/_dress.js`) are recognised by their cache key ending in the JSON of their extra params. If that format changes, those 13 buildings go back to the main thread; if another wrapper used the same key format with a different drawing, the worker would draw it wrong. `--verify` compares all of them.
- Not every number is from the very last build. Tables 3, 4, 5 and the soak are from the build with the wider ring (32 / 150). Table 1 has the final ring but was measured before the last step (the worker stops loading after the art; the 4 GB gate), which changes nothing on the main thread; I did not repeat the 60 runs for it. `--verify`, the screenshots, navcheck and the memory reading are from the final code.
- **Edits outside my file list**, additive, for the lead to accept or revert: `src/core/char.js` (`Char.prebake`, 5 lines) and `src/sim/_cityevents_stage.js` (`Mar.prebake`, `Flt.prebake`, 9 lines). The hook that lets the renderer bake a character ahead has to live on the entity; without them named characters, marchers and floats are baked on first sight as before. Nothing else depends on them.
- `Renderer.sortCheck / sliceCheck / workerCheck / chunkCheck / charCheck / bakeCost` and `sortItemsRef` are test hooks; the game never calls them.

## 9. For other owners (seen, not changed)
- **Art errors**: `prop.park.dock` with `{len:4, boat:true}` and `prop.park.gazebo` (two placements) throw "e.slice is not a function" while drawing. `world/_ctx.js safe()` swallows it, so those three sprites are probably incomplete in the city today.
- `sim/cityevents.js`: staging an event while the player stands in the street places all its props in view at once, and they are baked in that frame (the parade's worst frame, 150 ms here; QA saw 700 ms). Staging a few props per frame, or behind a short fade with `G.renderer.warm(G.world, G.cam)`, would hide it.
- `sim/rail.js`: `placeCars` runs every frame (1.0-2.9% of all time), and train cars are baked on first sight (7-17 ms each at 4x). One line in `mkCar`'s object fixes the second: `prebake(pri) { if (this.p) prebakeAsset(carA, this.p, this.flip, pri, this.key); }` (import `prebakeAsset` from `engine/sprites.js`). Not run.
- `sim/_crowd_animals.js`, `sim/planes.js`: the same hook with `prebakePix` and the key and drawing of their `sprite()`; pigeons, ducks, dogs and aircraft are baked on first sight (6-59 ms at 4x). Not run.
- `sim/stalls.js` door-glow underlay and `core/char.js sprite()`: the per-frame garbage of section 7.

## 10. Questions for the owner
1. Please play a few minutes on your phone: do walking the city, a cab ride and the parade feel smooth now? If it still stutters, the lead needs one value from the browser console, `G.renderer.perf().worker`: it says at once whether your phone is using the background worker.
2. The worker costs about 30 MB of memory. I switch it off on phones that report under 4 GB. Keep that limit, or should every phone get it?
3. Night in the rain is the heaviest view. On a slow phone, would you accept thinner rain there as an automatic fallback when the frame rate stays low? Nothing of the kind is built.
4. Do you watch the city at game speed 4x, or is it for waiting? If it is for waiting, it could draw every other frame.

## Files
New: `tools/perf.mjs`, `tools/perf_save.json`, `docs/reports/performance.md`.
Changed (mine): `src/engine/raster.js`, `sprites.js`, `render.js`, `ground.js`; `src/core/game.js` (`G.nearestInteractable` only); `src/sim/_crowd_core.js` (`Cit.prebake`, `_pre`), `src/sim/_traffic_veh.js` (`Veh.prebake`), `src/sim/traffic.js` (one call in `spawn`); `src/ui/hud.js` (`toastsClear`), `src/ui/navarrow.js` (`frame`), `src/ui/kit.js` (`bubble`).
Changed (outside my list, see Risks): `src/core/char.js`, `src/sim/_cityevents_stage.js`.
Public API: `G.*` unchanged. Added: `G.renderer.perf()`, `G.renderer.bake`, the optional entity hook `e.prebake(pri)`, `prebake / prebakeObj / prebakeAsset / prebakeChar / prebakePix` in `engine/sprites.js`, `renderJob / renderStep / renderResult / recycle` in `engine/raster.js`, `chunkJob` in `engine/ground.js`, the URL switches `?nobake` and `?nobakeworker`.
Results of every run: `out/perf/*.json` and `*.md` (not in git). Scratch drivers: `/tmp/claude-0/-home-user-Pixel-city-2/ab4bf52b-889a-5288-a866-29c2e55d0472/scratchpad/perf/` (`vis.mjs` screenshots, `savechk.mjs`, `mem.mjs`, `alloc.mjs` garbage by function, `gc.mjs`, `trace.mjs`, `mk.sh` the before / after builds).
