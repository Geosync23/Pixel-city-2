# Night light: pools on the ground, people and things lit as a whole

Owner msg 151 / 155, BIBLE direction updates 28 + 29. Worker: NIGHT LIGHT (Fable), 2026-11-16.
Files: `src/engine/render.js` (nearly all of it), `src/engine/sprites.js` (three sprite fields), `tools/perf.mjs` (one new scene), `tools/nightcheck.mjs` (new), this report.

**In short.** The dithered light pools are no longer painted across people. The ground, roads, buildings, walls and trees look exactly as before (checked pixel by pixel). Everybody and everything that moves, and every small upright thing on the street (posts, lamps, signs, bins, benches, barrels, planters, parked cars, small furniture indoors), is lit as a whole in one colour: the light at its feet, in steps. Somebody behind a tree, a post or a building is still hidden by it. The old look is one call away for A / B pictures: `G.renderer.nightLight('old' | 'new')` or `?nightlight=old`.

## 1. How it worked before
`Renderer.draw()` painted the frame in this order:
1. ground chunks, underlays, then every object and entity in depth order (the whole picture, in day colours);
2. **the light mask** `M`: a canvas filled with the ambient colour (`env.amb`, night `#46548c`), then every pool of `world.lights` on screen added with `lighter` at strength `al = min(1, dark * 0.5)` (a pool = a cached dithered ellipse sprite, `poolSprite(r, colour)`), then the moving pools of `scene.lights(m, cam, pool)` (headlights, stage lights);
3. `M` multiplied over the whole frame. This is where the pattern landed on people: the mask knows nothing about what stands where;
4. the glow pass: the light layers of sprites (`sprite.l`: lit windows, lamp heads, screens) collected in a buffer, with everything drawn later cut out of it, then put over the frame with `lighten`;
5. overlays (weather, markers).

## 2. The new pipeline
Steps 1, 3, 4 and 5 are unchanged in what they paint. Step 2 gets a second half (`Renderer._nightE`), and two things became cheaper to make room for it (section 6).

After the mask is painted as before, the renderer walks the frame's sorted item list once more (the same list, same order, sitters included) and, for each item:
- **decides** whether it is lit as a whole (section 3);
- if so, **samples** the light at its feet (entities) or at the middle of its footprint (placed objects, never counting their own lamp): the pools that reach that point, summed, each with a fall-off that follows the average of the pool's own dithered rings (1 in the core, 0.7 at 65 % of the radius, 0.35 at 90 %, 0 at the rim). The pools are taken from what was actually drawn into the mask this frame (the hooks draw through a small pass-through object, `LightTap`, so headlights and stage lights count too);
- turns that into a **band** and a flat **colour** (section 4);
- **puts its shape into the mask** in that colour. Two ways that give the same pixels: (a) the sprite is punched out of the mask (`destination-out`) and the hole is filled with the colour (a `destination-over` fill of its box only reaches the hole); (b) for a sprite that keeps being lit in the same colour, a flat-colour copy of the sprite is made once and from then on simply drawn (one plain draw);
- if it is **not** lit as a whole (a building, a wall, a tree, a large piece) and stands **in front of** something that is, its shape is punched out the same way and the hole is filled with the mask as it was before any of this (ambient + pools), so the pools show on it again and the thing behind is hidden in the mask exactly as it is on the frame.
Because all of this happens in draw order, "who is in front wins" needs no extra bookkeeping. Fading citizens, see-through objects in front of the player and the player's 30 % ghost use the same alpha as on the frame, so they blend the same way.

Seated characters: a sitter on a piece that is lit as a whole (a bench, a cafe chair) takes the piece's colour: one thing, no seam. A sitter on a large piece that keeps the pattern (a cinema row, a train bench block) is lit by the light on the ground under it, and the part of the piece in front of it (the seating system's overlay) gets the pattern back. The legs-behind / body-in-front split of somebody sitting with the back to the camera is followed row for row.

What only costs when needed: nothing happens by day (no pools: `dark <= 0.05`), and at night nothing happens for a thing that no pool reaches (the mask there is the ambient colour already). A thing that stands in the dark and is only grazed by a pool is only worked on where the pool is.

## 3. What is "ground" and what is "lit as a whole"
Lit as a whole (`isWhole` for entities, `wholeOb` for placed objects):
- every entity (player, citizens, pets and birds, vehicles of any size, event actors, carried and towed things, loose props in rooms), **except** an entity whose sprite is larger than 26,000 px and is not a vehicle (train cars, airliners, parade floats, stage screens: they keep the pattern like a building), one that lies flat (`bb` height under 0.08: shadows, ripples), and one whose picture is all light (`sprite.l === sprite.c`: screens, tanks);
- placed objects that stand up (more than 0.12 high), have a footprint of at most 4.5 x 4.5 tiles and a painted box of at most 7,000 px: street lamps and posts, traffic lights, signs, bins, benches, barrels, suitcases, newspaper boxes, hydrants, planters, carts, railings pieces, kiosks; indoors chairs, small tables, plants. Parked cars (`veh.*`) count whatever their size, to match the moving ones. A lamp is not lit by its own pool (its post stays a dark shape in front of its light).
Ground / pattern as before: the ground itself, buildings and walls (a wall takes a pool like the ground does: decided, see the pictures), every tree (asset tag `tree`, small or large: a first version lit the small ones as a whole and left the big ones patterned, which looked inconsistent side by side), fountains, gazebos, shelters, big furniture, anything flat.
An asset or an object can overrule this with `nl: 'whole' | 'ground'`, an entity with `e.nl`.
Counts on ten city views at night: about 90 placed objects lit as a whole (lamps 18, street props 10, railings 15, cars 7, ...) against about 70 that keep the pattern (35 trees, the buildings).

## 4. Bands and colours
- One band = 0.175 of a pool's full strength (`NL.step`): the pool's own rings are 1 / 0.7 / 0.35 with dithered halves in between, so one band is one ring. A single street lamp gives bands 0 to 5 or 6 from rim to core; overlapping pools add up, to at most 8 (`NL.max`). (The trial used four bands; with the rings of the pool as steps a walk into a pool changes in smaller steps and matches the ground under the feet better.)
- The band is rounded slightly down (`floor(v + 0.4)`), so a thing is never brighter than the average of the ground it stands on.
- **Hysteresis**: a band only changes once the light is 0.22 of a band past the edge (`NL.hyst`), and only one band per 3 frames (`NL.rate`): a jump of several bands (a car's headlights, a lamp switching on) is walked through, never jumped. Somebody who comes on screen starts at the right band at once (no fade-in).
- **Colour** = ambient + light colour x band x 0.175 x `al` x 255, per channel, 6 bits a channel. The light colour is the mix of the pools that reach the feet (kept until it has clearly changed). In the city nearly all pools are the warm default `#ffd9a0` (and `#ffcf80` door glows); headlights are `#ffe6b0`; festival, stage and pool-party lights bring their own colours, and people take them.
- At dusk and dawn `al` and the ambient colour move with the clock, and the flat colours move with them (bands stay put).

## 5. Caches (bound and memory)
- **Flat-colour copies** (`silGet`): only for sprites of the sprite cache, the size of the sprite's own pixels (not its padded canvas). A sprite remembers up to 4 colours (`NL.slots`); a colour that was asked for in 6 frames (3 for sprites over 2,000 px) gets its copy; at most 2 new copies per frame. Bound: `NL.budget` = 2.5 million px in all = **10 MB**, least recently drawn first to go; copies not drawn for 1,800 frames are dropped (checked every 512 frames, day or night). Measured on the perf walks: 0.37 to 0.41 million px (about 1.5 MB), 440 to 590 copies.
- **Mask tiles** (`_maskTiles`, section 6): at most 24 tiles of 256 x 256 px = **6.3 MB**; 11 to 24 in use on the perf walks.
- Per sprite two boxes of four numbers (`bx`, `lb`), per placed object one cached outline (7 numbers) and a few numbers of band state; per entity the same band state. No per-frame allocation: the pool list, the step list and the box lists are reused typed arrays (they grow by doubling when a scene needs more).

## 6. What was made cheaper to pay for it (same pixels)
1. **Mask tiles.** The mask of the world's own lights (the fill + 20 to 40 pool draws per frame in town) is kept in 256 px tiles while the ambient colour, `al` and `world.lights` stay as they are (a checksum over the lights every frame): all night outdoors, all day indoors. A frame then draws 2 to 6 tiles. While something changes (dusk, dawn, a lamp switched on) the mask is painted directly as before; one missing tile is painted per frame. The tiles also serve the "put the pattern back" step (no copy of the mask is needed unless a moving light reaches the place, or there are no tiles).
2. **Glow pass.** An item used to be cut out of the glow buffer whenever it overlapped the box around *all* glowing sprites so far (soon the whole screen: about 32 cuts per frame on the plaza, each a draw of a whole sprite). Now each sprite knows the box of its glowing pixels (`sprite.lb`) and of its own pixels (`sprite.bx`), a placed object also its six-sided outline (`hexOf`), and an item is only cut where these overlap, and only that part of it (about 10 to 17 small cuts on the same view). Light layers are drawn by their box too.
`G.renderer.nl.tiles = false` (or `?nightlight=notiles`) paints the mask directly every frame, for comparison.

## 7. Performance
`node tools/perf.mjs`, CPU 4x slower, dpr 2, 390x844, fresh page per run, the three builds interleaved in every run. "before" = the build of the tree when this job started; "old mode" = the new build with `?nightlight=old` (the old look: shows what the two savings of section 6 give on their own). New scene `night_plaza` (City Hall Plaza and the streets around it at 22:00: many people, props, cabs, headlights) added to the tool. Median (min to max) of the runs.

PERF_TABLE

Per frame on these walks (new mode): 10 to 13 things lit as a whole, of which 6 to 8 by a plain draw of a flat-colour copy; about 3 put-backs; 0.25 to 0.37 new copies. `node tools/perf.mjs --verify`: VERIFY_LINE.

How to read it, honestly: PERF_VERDICT

Things that were tried and measured on the way (so nobody has to repeat them): flat-colour copies for everything, made on first use (a new copy costs about as much as 20 draws: 3 per frame cost more than it saved); a separate coverage layer + colour layer (two extra full-canvas composites per frame); putting the pattern back from a copy of the whole mask every frame (a full-canvas copy and a forced flush in the middle of the frame); lighting trees and other large sprites as a whole (cost by the pixel: a tree is 15 to 30 thousand px). In this headless Chromium a canvas draw costs about 10 microseconds plus about 5 per thousand pixels touched, twice that for the punching modes: so the design is "few calls, small boxes".

## 8. Checks
- `node tools/nightcheck.mjs [--before old_build.html]` (new; frozen frames at eight city spots at night; exits 1 on any failure). On the final build, all passed:
  - before build vs this build in old mode, nobody on screen, no moving lights: **identical** at all eight spots (the glow pass and the mask tiles changed no pixel);
  - mask tiles on vs off: 0 px differ;
  - old vs new with `noprops`, nobody on screen: **0 px differ** (ground, roads, walls, everything static untouched);
  - old vs new: every differing pixel lies inside the sprite box of something that is lit as a whole (0 outside), with and without people;
  - the pattern put back from the mask tiles vs from a copy of the mask: 0 px differ;
  - the mask itself: every pixel is either unchanged or exactly the flat colour of one of the things lit this frame (the only others: 16 to 21 px under half-transparent sprite pixels, soft shadows, which blend). This last check exists because a bug slipped through the others for an hour (the first flat-colour copy of a frame was *added* to the mask instead of drawn: a bright bench).
- Band stability: standing still at nine places across a pool (ring edges included) for 2.5 s each: 0 band changes. Walking slowly out of a pool: 5 4 3 2 1 0, one at a time.
- `node src/data/validate.mjs` OK; `node tools/build.mjs` OK; `grep -c '(?<[=!]' dist/index.html` = 0; `node tools/navcheck.mjs --rooms all`: NAV_LINE; zero page errors in every run of every tool above and in all the pictures.
- Pictures, 390x844, before | after of the same frozen frame, all looked at full size by me (`out/shots/nl_*.png`, the right half alone as `nl_*_new.png`): `cmp1`, `cmp2` (the two spots of the owner's comparison pictures, Central Station), `crowd` (nine people under a lamp), `halfpool` (the player at the rim of a pool, others inside and outside), `headlights` (a cab passing people at a bus stop), `bench` (the player and a citizen on a plaza bench in a crowd), `rain`, `snow`, `fog`, `lantern` (Lantern Night), `park`, `harbour`, `airport` (forecourt), `cafe`, `bar`, `home` (interiors at 22:00 / 23:00), `dusk1` 18:29, `dusk2` 19:05, `dusk3` 19:41, `dawn` 05:59, `train` (light-rail ride at night), `cab` (cab ride at night), `photo` (Photo mode), `w375` (375x812), and `walk` (8 frames of the player walking from under a tree into a lamp's pool). No pattern on any character, vehicle or small prop; no halos or cut-out edges; nothing brighter than the ground it stands on; the people at the pool's rim are dark, the ones in the core light.
  Not photographed: the title screen at night (it shows the city through the same renderer at the save's time of day; nothing separate to break), fireworks on Harbor Day, the lighthouse lamp room and the observatory show (their beams and stars are overlays and hook lights: the hook lights go through the same code as headlights, which is covered).

## 9. API and switches
- `G.renderer.nightLight('old' | 'new')` -> mode (default `new`); `nightLight('noprops' | 'props')`: only what moves / placed objects too (default). URL: `?nightlight=old | noprops | notiles`.
- `G.renderer.nl` = the tunables (`NL` in render.js): `step, max, hyst, rate, big, propFoot, propBig, promote, promoteBig, perFrame, slots, budget, tiles, tile, tileMax, tileWait`.
- `G.renderer.perf()` gained `tNl` (ms in the night pass), `nlLit, nlCut, nlCopy, nlSil, nlMade, nlPx, nlCount, nlTiles, nlTileBakes`.
- Art / scene hooks: `nl: 'whole' | 'ground'` on an asset, a placed object or an entity. Sprites of the sprite cache carry `bx` (box of their pixels), `lb` (box of their glow) and `im` (never drawn on again).
- `scene.lights(m, cam, pool)` hooks keep working unchanged; `m` may now be the pass-through object, which supports what the hooks use today (`drawImage`, `globalAlpha`, `globalCompositeOperation`, `fillStyle`, `fillRect`, `save`, `restore`). A pool only counts as light on people if it is drawn with `drawImage(pool(r, colour), x, y)`.

## 10. Still imperfect
- A long vehicle (a bus) is one colour from the light at its middle: it does not brighten end by end as it passes a lamp.
- The light is taken where the pool is drawn on screen: a bird flying over a pool brightens although it is above the light.
- Trees keep the pattern (as always), so a pool can still be seen across a tree crown that stands in front of it. Lighting trees as a whole looked fine in the first pictures but costs by the pixel; it is a one-line change (`wholeOb`) if wanted.
- A soft (half-transparent) shadow under a lit thing blends the ground's pattern towards the thing's colour where the shadow is.
- At game speed 4x the band still steps once per 3 frames, so it lags a little more behind a fast walker.
- During dusk and dawn (about 80 real seconds each at 1x) the mask tiles are off and the flat-colour copies are remade as the colours move: those two periods cost about what "new mode without section 6" costs.
- The put-back of the pattern on a thing in front uses that thing's sprite box and outline, not its exact silhouette versus the lit thing: correct pixels, but more area is worked on than strictly needed when a big building stands in front of many people.

## 11. Questions for the owner
1. Steps: people now change brightness in the pool's own ring steps (about six from the rim to the middle of a street lamp). The trial had four, coarser. Finer or coarser?
2. Lamp posts and other small props are now one flat colour too, and a lamp post is not lit by its own lamp (a dark post in front of its pool). Trees and walls keep the pools on them. Is that the split you want, or should trees go flat as well?
3. People at the rim of a pool are deliberately a touch darker than the ground under them rather than brighter. If they read as too dark in the pools, one number makes them a step lighter.
