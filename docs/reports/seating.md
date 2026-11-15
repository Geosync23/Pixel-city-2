# Seating (Fable worker, 2026-11-15)

Owner msgs 138 ("you sit the wrong way on the chair by the range at grandma's") and 140 ("sitting animations are weird all over: sometimes under it, sometimes over it with no occlusion", with the aquarium Big Blue benches).

**In short.** A seated character is now drawn as part of the piece of furniture it sits on: after the piece, and then the parts of the piece that stand between the sitter and the camera are drawn over the sitter. That is one change in the renderer, and it applies to every seat in the game (279 seat-bearing asset variants in 57 art files, the player, venue customers, showpiece crowds, city bench sitters, show audiences, the train car) without touching the furniture art. Nana's has a wooden chair by the range and Chapter 1 seats you on it, facing the room.

**Not tested:** a real phone; a lecture in session (the lecture theatre was shot empty: I did not stage a class); sitting at night in every room (the light pass was changed and runs without errors, but I only looked at the dim cinema and concert hall).

## 1. Diagnosis

Tool: `node tools/seatsheet.mjs --tag before` (new). It builds a test room per art file and seats the player on the first seat of every piece and NPCs on the others, for every non-colour variant and both flip states: 558 cells, 1,362 seats, one sheet per art file in `out/shots/seat_before_*.png`.

**The cause.** A sitter was an ordinary item in the depth sort, with a 0.4 x 0.4 box at the seat point. That box lies inside the furniture's box, so the sort fell through to "compare the centres": whoever's centre was nearer the camera was drawn **entirely** over the other. A seat point a little behind the piece's centre put the whole person behind the whole piece; a little in front, the whole person over it. Nothing could be half and half. For the player, "behind" also switched on the see-through copy (30% opacity over everything), which is the pasted-on look.

Counted by that rule over all 1,362 seats (it matches what the sheets show):

| what happened | seats |
|---|---|
| facing the camera, drawn entirely **behind** the piece (sunk into the sofa or bench; the player see-through) | 400 |
| back to the camera, drawn entirely **in front** of the piece (standing-looking, legs over the bench, pasted over the backrest) | 376 |
| back to the camera, drawn entirely behind the piece (the seat and the far parts over the body: half sunk) | 154 |
| facing the camera, drawn in front (right, unless the piece has a table or a row in front of the lap) | 432 |

388 of the 558 cells had at least one wrongly layered seat. The aquarium benches are the second and third rows at once: the bench is 0.7 deep with the seats exactly on its centre line, facing away, so the tie went one way or the other per visitor. The owner's screenshot is reproduced in `out/shots/seatscene_pair_aqua.png` (left half).

Other classes I looked for:
- **Wrong position or height:** one. `furn.clothing.pouf` had its two seats 0.4 apart (the two sitters overlapped); now 0.56.
- **Wrong facing:** one, the Chapter step (section 3). The seat data itself was consistent everywhere.
- **NPC standing on the seat spot:** none found in the sheets or the scenes; what looked like it was the "entirely in front" case.
- **Sitter and neighbour swapping order:** was possible on any two-seat piece (each sorted on its own); now a piece's sitters are always drawn far to near.

## 2. The model

`src/engine/render.js`, block "seating":
1. **Who is sitting.** An entity with `seated`, pose `sit`, or `poseOpts.seated` (and pose `type` when raised). No sim had to change: the crowd, the showpiece crowds, shows, the train and the activities all set one of these already.
2. **On what.** `seatObj()`: the world object whose footprint contains the sitter (smallest one; pieces with seat data preferred; a piece without seat data only counts if the sitter is really up on it). Cached on the entity until it moves.
3. **Order.** The sitter is taken out of the depth sort and attached to its piece. The piece keeps its place in the sort, so a table in front, a person walking past and the next chair sort against the piece as before. Per piece: legs of back-facing sitters, the piece, the sitters far to near, each followed by its **front overlay**.
4. **Front overlay.** The part of the piece on the camera side of a plane through the sitter:
   - back to the camera (dir 2 / 3): everything from 0.15 behind the sitter's back (backrest, the seat's front, the piece's legs, the rows in front);
   - facing the camera (dir 0 / 1): everything more than 0.5 in front (a table edge, a counter, the next row; nothing for a plain chair or sofa).
   It is made by painting the piece's art once more with a **depth cut** (`src/engine/raster.js` `setCut`, `src/engine/sprites.js` `frontSprite`): polygons and lines are clipped at the plane exactly, so a slatted chair back covers the sitter only where the slats are. A pixel is kept only if it is opaque and equal to the pixel of the whole sprite, so the overlay can never change how the piece looks where nobody sits.
5. **Back-facing legs.** Someone with their back to the camera has the legs on the far side: the sprite's rows below the seat line are drawn before the piece (hidden by a bench, visible between the legs of a chair), the rest after it.
6. **See-through.** The 30% copy is not drawn for a seated character. Tall things in front still fade, including the piece itself (the gazebo roof, a booth).

Why this and not layers in the art: 279 variants would each need their draw order split by hand, and the bake worker would need two sprites per piece. Here the piece's sprite, the bake queue, the worker and the depth sort are untouched; the overlay is baked on the main thread on first use (measured 6-9 ms at 4x CPU slowdown for a bench) and cached like any sprite, shared by identical pieces.

An asset can override the plane with `seatCut(p, seat) -> { ax, v } | null` (un-flipped local coords; `null` = nothing in front). No asset needed it.

## 3. Nana's and Chapter 1
- `src/scenes/rooms/homes.js`: one oak chair added in `home:grandma` at (2, 1), in front of the counter beside the stove, facing the room, tagged `rangechair`. Nothing else moved. Its Sit spot is free; `navcheck --rooms all` passes.
- `src/sim/_chapters_play.js` `activity:nap`: leads to that chair (elsewhere: nearest armchair, then any seat) and seats the player on the piece's **real seat**, facing the way it faces. It used to put the player on the armchair's centre at a made-up height facing +x.
- The armchairs by the fire are unchanged; they now read correctly from behind (`out/shots/seatscene_pair_nana_fire.png`).

## 4. Occupied seats, sitting down, standing up
- `src/sim/activities.js` `seatOf()` takes the first seat of a piece that nobody is on.
- Same file, on `activity`: whatever started it (a showpiece, a Chapter), if another character already sits there the player takes the nearest free seat. Venue-room customers are excluded because they already get up for the player.
- On `activityEnd` and `game:start`: a player left standing inside furniture is moved to the nearest free cell.
- Venue customers already refused seats near the player; city benches and the generic Sit already picked free seats. Unchanged.
- Sitting down and standing up are still a cut from the approach spot to the seat. There is no wrong-layer frame any more (the sitter is attached in the same frame it sits), but no hop animation: that lives in `src/core/game.js` `startActivity`, not my file.

## 5. Proof
- **Sheets, before above after, same layout:** `out/shots/seat_pair_<art file>.png` (61 sheets). Overview of 16 typical seats: `out/shots/seat_summary.png`. I read all 558 after-cells at 2x and the composite pieces (tables with chairs, booths, desks, loungers) at 4-5x.
- **Standing next to a bench:** `out/shots/seat_stand_*.png` (`--stand`): a person in front covers the bench, a person behind is covered.
- **Real scenes, 390x844 at dpr 2, before | after:** `out/shots/seatscene_pair_{aqua, aqua_player, nana, nana_fire, cafe, diner, cinema, symphony, park}.png` (`node tools/seatscenes.mjs`). Cinema and symphony: 27 of 31 and 50 of 58 of the audience seated, house lights dimming.
- **`node tools/perf.mjs --verify`: all 13 lines ok, none changed.** Those checks compare sprites and the sort order, not frames: furniture sprites are untouched, and sitters are simply no longer in the sorted list, which still matches the old sort item for item (740 frames). The frames themselves do differ wherever somebody sits; that is the fix.
- **Speed** (`after.html?noseat` vs `after.html`: the same build with the new drawing switched off, interleaved, CPU 4x, dpr 2):

| scene | build | fps | 1% low | worst frame ms | JS ms p50 / p95 / worst |
|---|---|---|---|---|---|
| rooms (3 runs) | off | 43.4 (42-47.1) | 3.3 | 800 (550-883) | 3.5 / 25.9 / 396 |
| rooms | on | 44.8 (41.9-44.9) | 3.1 | 833 (733-883) | 3.7 / 25.3 / 254 |
| busy_room (5 runs) | off | 53 (47.7-54.1) | 8.4 | 467 (317-567) | 5.3 / 15.9 / 177 |
| busy_room | on | 50.7 (49.2-54.2) | 8.1 | 467 (333-567) | 5.8 / 18 / 156 |

  All inside the run-to-run ranges (the machine was loaded by other workers). A first 3-run sample of busy_room showed a higher worst frame with seating on (550 vs 333); 5 more runs did not (467 vs 467).
- `node tools/build.mjs` ok; `node src/data/validate.mjs` ok; `node tools/navcheck.mjs --rooms all`: all passed, 0 page errors; sheets and scenes: 0 page errors.
- **Saves made while seated** (`node tools/seatsave.mjs --old <old build>`): saved in the old build on a cafe chair and in Nana's armchair, loaded in the new one: no errors, standing, can walk. The game never stored the seat: an indoor save resumes at the door.

## 6. Files
- `src/engine/render.js`: seating block, attach in `draw()`, draw loop, see-through, light pass. Test switch `?noseat`.
- `src/engine/sprites.js`: `frontSprite(ob, ax, v)`.
- `src/engine/raster.js`: `setCut()` + clipping in `fq` / `lw`, one null test in `PW`, `px`, `fill`. **This file was not on my list**; it is the only place the clip can live. With no cut set (every ordinary bake, and the worker) nothing changes, which `--verify` confirms.
- `src/sim/activities.js`, `src/sim/_chapters_play.js`, `src/scenes/rooms/homes.js`, `src/art/venue/shops.js` (pouf seats).
- New tools: `tools/seatsheet.mjs`, `tools/seatscenes.mjs`, `tools/seatsave.mjs`.
- Not touched: `src/core/char.js`, the crowd files, `src/story/chapters.js` (the step's label already says "the chair by the range"), `trainride.js`, `park.js` (the train seats and park pieces are ordinary world objects, so the fix reaches them; no patch needed).

## 7. Not fixed
- **No sit-down / stand-up movement** (section 4).
- **Loungers** (hotel, natatorium): the sitter sits upright on the edge; there is no reclining pose.
- **Boss desk** (`furn.office.bossdesk`): the art has no chair, so only head and shoulders show behind the desk. Correct for the geometry, but it reads as hidden.
- **Diner booth:** two people on one booth bench are 0.46 apart and overlap by about half a body. Moving the seats would put them off the bench.
- **Gazebo:** NPCs sitting inside are hidden by the roof until the player walks in and it fades.
- **Glass and other see-through parts** of a piece never cover a sitter.
- A seated player behind a low object that is not their seat (under 2.4 high) is now simply hidden, as NPCs always were.
- Pieces over 160,000 sprite pixels get no overlay (none of the current seat pieces is that big).

## 8. Owner questions
1. The chair by the range is a plain oak dining chair in front of the counter, right of the stove. Good there, or should it be a rocking chair?
2. Should sitting down get a short hop onto the seat instead of the cut? It is a small change in the core loop.
