# Big city events (Wave D, BIBLE direction update 12) — worker report, condensed

Six staged street festivals / parades a year that happen in the city world (never a cutscene). One about every 7 days from Spring 13, at least one per season.

| # | Event (calendar id) | When | Where | What happens | What you do |
|---|---|---|---|---|---|
| 1 | Blossom Parade (`blossom_parade`) | Spring 13 (Sat), street closed 10:30-16:00, parade 13:00 | Riverside Drive y 114-170 beside the River Walk (+ the Airport Pkwy stub) | Banner bearers, a 12-piece band in pink, blossom-tree float, parasol dancers, giant swan, koi kites, tea-house float, petal kids, the Blossom Queen's float. 4 stalls on the promenade. | Petal baskets: a tap game (flowers / weeds); petals fly over you and the nearest float. Wildflowers + Festival Spirit. |
| 2 | Harbor Day (`harbor_day`) | Summer 6 (Sat), 15:30-23:00, boats 19:30, fireworks 22:00 | Dock Street x 82-112 (stage + 3 stalls on the street), boardwalk, fun pier | 9 lit boats (tug, sailboats, trawler, the paddle steamer Maple Queen, lantern dinghies) sail along the boardwalk and round the pier head; fireworks from a barge. | Firing desk on the pier (21:30-22:35): a 3-lane rhythm game; every hit launches a real rocket over the bay. $20 + Fireworks Awe. |
| 3 | River Walk Summer Fair (`river_fair`) | Summer 13 (Sat), 10:30-20:00, Rainbow Walk 15:00 | Riverside Drive y 232-264 + the east promenade | Stage with a dancing crowd, high striker, ring toss, food stalls; parade with flag walkers, rainbow float, band, pom-pom dancers, a giant rubber duck, balloon walkers. | High striker ($2, timing bar; 2+ stars wins a teddy) and Ring Toss ($2, aim game, teddy). |
| 4 | Harvest Festival (`harvest_parade`) | Autumn 6 (Sat), 9:30-18:00, tractor parade 14:00 (3 laps) | Chandler Street y 232-264 + Market Square | Hay bales, scarecrows, giant pumpkin on a scale, cider press; tractor pulling a hay wagon, harvest band, giant pumpkin float, sheaf carriers, basket float, scarecrow dancers. | Cider press (pour game): 2 hot ciders + $15. Hop on the hay wagon and ride it down the street. |
| 5 | Lantern Night Dragon Walk (`lantern_parade`) | Autumn 13 (Sat), 17:30-24:00, dragon 20:00, wish lanterns 21:30 | Chandler Street y 264-296 into Lantern Row | Lantern strings over the street and the Row; lantern bearers, drum cart, a 13-part paper dragon on poles that weaves, lantern kids, drummers. At 21:30 wish lanterns rise over Old Town. | Wish table: trace a brush stroke; your lantern lifts off. |
| 6 | Winter Lights Parade (`winter_parade`) | Winter 5 (Fri), 15:00-21:00, parade 17:00, tree 18:00 | Market Street x 206-234 in front of City Hall Plaza | Giant tree on the plaza (up from Winter 4 to 14, lit once switched on), band in red, toy-train float, candle walkers, gingerbread house, elves, snow globe, the sleigh with light reindeer. 3 stalls. | The big switch (17:45-18:35): a timing ring; you light the tree (the mayor does it at 18:09 if you do not). Cocoa + Festival Spirit. |

Build-up (all events): 3 days before at 06:00 posters + kerb banners + a phone notice; the day before bunting + arches + a notice; on the morning a notice and an Opportunity (`cev_<id>`, completes on `cityevent:join`); 30 min before opening the barriers go up and the street is closed. After closing the dressing stays till midnight, then everything is removed.
Announced in: Wander (calendar rows -> `event:<id>` entries with Take me there / Add to planner), the Planner's event feed, phone notices, the Opportunity. The arrow: waypoint `cev:<id>` (a virtual place) -> within 26 units it becomes a pinned navGoals objective on the thing to do ("Shower the parade: petal baskets").
Weather: Blossom Parade and Harbor Day are guaranteed clear by their calendar rows. The other four go ahead in rain (spectators x0.55, a notice) and the parade waits in 10-minute steps for a storm to pass (cancelled if still stormy 50 min before closing; stalls and games stay).

## Files
NEW: `src/sim/cityevents.js` (engine, `G.cityEvents`, order 131), `src/sim/_cityevents_stage.js` (dressing, stalls, spectators, parade line-up, marcher looks), `src/sim/_cityevents_fx.js` (petals, leaves, confetti, fireworks, wish lanterns, sparkles: one G.overlays hook), `src/data/cityevents.js` (the six events + TUNE), `src/art/events/_lib.js`, `common.js`, `floats.js`, `boats.js`, `props.js`.
Art: 40 new assets. common 8 (`prop.event.bunting / barrier / arch / poster / banner / stall / balloons / stage`, each in 6 colour schemes), 15 floats (`float.blossom.tree/swan/teahouse/throne`, `float.fair.duck/rainbow`, `float.harvest.tractor/wagon/pumpkin/basket`, `float.lantern.drum`, `float.winter.sleigh/globe/gingerbread/train`), 6 boats (`boat.harbor.tug/sail/trawler/queen/dinghy/barge`), 11 set pieces (`prop.winter.tree` dark/lit, `prop.winter.switch`, `prop.fair.striker`, `prop.harvest.bales/scarecrow/press/giant`, `prop.lantern.wish`, `prop.lantern.dragon` head/body/tail, `prop.blossom.basket`, `prop.harbor.plunger`). 24 marcher looks with 17 carried items (drum, horn, flute, tuba, cymbal, flag, standard, parasol, koi kite, pom-poms, bell, balloon, lantern, big lantern, candle, sheaf, pumpkin, crown) drawn over the standard characters.
EDITED shared files (add-only, guarded):
- `src/sim/_traffic_veh.js` chooseNext(), 1 condition: `|| (f.closed && !e.closed)` in the random-turn loop (a closed edge is never entered; a vehicle already on one may drive out).
- `src/sim/traffic.js`, 3 guards: trySpawn `if (e.closed) continue;`; housekeeping taxi stands `if (st.ref.e.closed) continue;`; offscreenLane `|| e.closed`.
- `src/data/calendar.js`: 6 new EVENTS rows (ids above) before the holidays block. Nothing else changed.
Not edited: crowd.js, _crowd_core.js, transit.js (not needed). Run-time hooks from my module instead: `G.places.get/known` are wrapped for ids `cev:*`; the road graph's `nearestLane / route / routePts` are wrapped (pass-through while nothing is closed; while closed, lane lookups skip closed edges and routes cost them 100000, so cabs go round and stop at the nearest open lane); the calendar rows get `place.poi = 'cev:<id>'` at init; the city scene's `lights` hook gets one wrapper (a light pool under each float at night).

## API
`G.cityEvents`: `list()`, `next()`, `current()` -> { ev, level 0-3, m, cur }, `live()`, `isClosed(roadId?)`, `place(id)`, `join()`, `stage`, `TUNE`,
`debug.start(id, hour?)` (stage that event now as if its clock said `hour`; default 20 min before the parade), `debug.at(hour)`, `debug.parade(u?)`, `debug.finale()`, `debug.moment()` (-> the spot to stand on), `debug.stop()`, `debug.snapshot()` (world/traffic counts + hash), `debug.fps(sec)`, `debug.fx`.
Events: `cityevent:level`(id, level), `cityevent:open`(id), `cityevent:parade`(id), `cityevent:finale`(id), `cityevent:join`(id, stars), `cityevent:game`(id, gameId, stars), `cityevent:close`(id), `cityevent:bang` (sound cue per firework burst).
State `G.state.cityEvents = { cur: { id, base, u (parade progress), pst, fin, delay, joined, lit, watch, mood, n (notices sent), games } | null, force, treeLit (year+1), seen }`. Everything else is derived from the clock, so a save mid-parade resumes where it was.
Tuning: `TUNE` in data/cityevents.js (announce 3 days, bunting 1 day, close lead 30 min, parade 1.15 units/s, 150 spectators at once, gather from 70 min before).

## Verified by running (headless Chromium 390x844; scripts in the scratchpad `events/`)
- validate + build pass; zero page errors/warnings in every run; the gallery renders the whole folder (day, night, winter).
- Real calendar flow for the Blossom Parade from day 0: level 1 on Wed Spring 10, level 2 on Fri 12, closed at 10:38 on Sat 13; Planner row + Wander entry `event:blossom_parade` (place `cev:blossom_parade`) + Opportunity present; notices a/e/t/s sent once each.
- Closure against traffic: with the corrected Blossom route 6 road edges closed, cars queue at / turn away from the barrier (seen in shots). An earlier run found real route-3 buses on Riverside 170-200 (the real bus loop differs from `world.busRoutes`), so that stretch was dropped; the engine now warns in the console if a closure touches a bus loop (no warning for any of the six).
- Every moment played with REAL mouse input end to end (tap the prop -> walk -> "Take part" -> the mini-game by pointer -> reward): petals (quickdraw), fireworks (rhythm), high striker (timing bar, paid $2, teddy), cider press (pour), wish lantern (trace), tree switch (timing ring, tree lit). Opportunity completed each time.
- Hay wagon ride via a pointer event on the wagon (player seated on the wagon). Storm delay (parade held 40 min, started when it turned to rain). Arrow: Opportunity accepted -> waypoint -> "Shower the parade: petal baskets - 160 m".
- Teardown: `debug.snapshot()` (object count + hash of every object, lights, pois, blocked nav cells, closed edges) identical before and after for all six events, after save/load, and after a natural end + midnight. Save/load mid-parade: level 3, 6 closed edges, parade progress kept. A save with no cityEvents state loads clean.
- fps at the parade peak, zoom 2 (largest view): Blossom 59.9 avg (worst frame 33 ms), Winter 59.6 (worst 50 ms) with ~100 spectators + 55 citizens, five browsers running at once.
- Looked at about 30 screenshots (`out/shots/cev_*.png`, `cevp_*.png`) and 4 gallery sheets.

## Not verified / known gaps
- No sound (there is no G.audio in the tree); bands are silent. `cityevent:bang` / `:parade` are there for an audio pass.
- Spectators in rain have no umbrellas (the character art has none); there are just fewer of them.
- All event objects are non-solid (so teardown is exact): you can walk through stalls, the tree and the floats. Spectators and marchers do not avoid the player.
- A vehicle that is on the stretch at the moment it closes drives out; anything still there after 22 s (and at parade start) is lifted off, which can be seen if you stand next to it.
- A cab already called to a point on the closed stretch before it closed still drives in (closure waits for an active ride / pending cab, but only until 6 min before the parade).
- The Winter route is short (21 units); floats fade in / out at the route ends instead of arriving from a depot. Harvest laps restart at the top of the street.
- Lantern Night's dragon reads as a row of red-gold segments; it has no legs/animation beyond the bob and weave. Float riders are static poses.
- Not played: Ring Toss with a real pointer (same kit as the striker); the stalls' buy menu was not clicked through; Harbor Day and the others were only run through the real calendar by `debug.start` (only Blossom from day 0). Guide "Add to planner" on the new rows not clicked.
- The existing calendar festivals on the same days (Spring Blossom Festival in the park, Summer Fireworks, Boardwalk Days, Harvest Fair, Lantern Night, Winter Lights Market) are untouched and still listed next to the new rows.

## For the owner / lead to decide
- Dates: the brief said "first six game months"; BIBLE update 12 (final cadence) says spread over the 56-day year. I followed the BIBLE: Spring 13, Summer 6, Summer 13, Autumn 6, Autumn 13, Winter 5.
- Blossom Parade is on Riverside Drive, not Main Street (Main has bus route 2; Riverside 170-200 has the real route-3 loop).
- Whether the six older festival rows should be merged into the new ones in Wander / Planner.
- Optional INTERFACES.md row: `G.cityEvents | sim/cityevents.js | list, next, current, live, isClosed, join, debug | cityevent:*`.
