# History (newest at the bottom). Dates are UTC from the container clock.

## 2026-11-13 — day 1
- Owner brief: build an open-world pixel city life sim from his "Pixel Station" sample (kept at reference/Pixel_Station.html): verticality, varied neighbourhoods, enterable shops/cafes/restaurants,
  light rail with cutaway ride, buses, taxis, ~10 jobs, apartments/homes, needs, day/night/week/month/seasons, lively faked crowd, relationships, phone as the hub. Later same day: story with sibling/family/old friend;
  intro at an airport with a cab tutorial.
- Lead built the engine (2x resolution rasteriser, terrain with height, chunked ground, lighting, flip trick, gallery tool), wrote BIBLE/ART_GUIDE/ARCHITECTURE, and launched 13 workers at once (11 artists, 2 designers).
- Owner clarified: world resolution is fine, CHARACTERS need the detail; zoomed-in camera; modern diverse US city; downtown with glass towers; River Walk. Lead set zoom limits, updated bible.
- First usage-limit wall: all workers died mid-task. Resumed; launched 5 more (Opus) -> second wall within minutes. Owner: "massively cut the worker count". New rule: 2 at a time.
- Completed in this period: characters, airport exterior art, systems-design data, sim core + HUD, city generator (stage 1 published), phone, transit art, home furniture art, traffic/taxis/buses, housing.

## 2026-11-14 — day 2
- Container restarted once (work survived). Venue fixture art, 20 venue rooms, crowd -> Stage 2 published. Third usage wall -> rule tightened to ONE worker at a time.
- Owner reported diagonal scroll judder -> lead added sub-pixel smooth camera.
- Social system; intro + story engine + planes + goals (Stage 3); jobs (Stage 4); rail + Central Station (Stage 5).
- Owner direction update 2: opening inside the airport (plane -> concourse -> tram -> baggage -> curb), mall, Central Station dome, observation deck, more groceries, clear enterable markers,
  needs chains, Opportunities/Appointments, stronger narrative. Update 3: 15 more jobs. Update 4: every job has a story arc, unique mechanics, skip-shift. Update 5: deep relationship vignettes + romance (dating app,
  partners, move in, marriage). Update 6: interests, mechanics for every activity, physical shopping, hundreds of goods, furniture/plant/clothes stores, online ordering, home design mode; keep the city layout.
- Lead fixes from playtest: all stands/stalls sell + open daily; welcome glow on enterable doors; unique street names; address system; train ride single track; riders on scooters.
- Airport interior + new opening (Stage 6 published, artifact version 1794674822-3cd0).
- Owner: pace usage (don't stop workers, don't downgrade models); write extensive docs + self-check rules -> CLAUDE.md, LEAD_PLAYBOOK, STATUS, HISTORY, OWNER_NOTES created.
- Running: public-places pass (generic enterable venues, walk-up counters, more groceries, street names + addresses on the phone map).
- Public-places pass landed: 61 buildings converted (53 enterable, 8 walk-up), groceries near every starter home, street names + addresses on the phone map. Stage 7 published.
- Owner asked to continue with showpiece interiors and for GitHub instructions. Launched showpieces A (mall + SkyDeck).
- Owner direction update 7: concert hall, cinema with real short films, theater show (queued as showpieces B).
- GitHub access fixed by the owner; branch pushed for the first time (full history).
- Owner direction update 8: City Guide app + more events/live music (queued as 2d).
- Fixed vehicle draw-order flicker (render.js behind(): diagonal separation uses centre depth; flipping pairs 14 -> 4 in a 25 s rush-hour test). Queued trip planner; noted future city expansion.
- Owner direction update 10: post offices (queued in 2c).
- Showpieces A landed: Maple Bay Galleria mall + SkyDeck observation deck, 83 new items. Stage 8 published.
- Owner asked for his messages to be saved verbatim: docs/OWNER_MESSAGES.md created (31 messages) and made a standing rule in CLAUDE.md. Answered questions on GitHub checks and moving accounts (no action).
- docs/LEAD_JOURNAL.md written (the lead's side: decisions, reasoning, answers given).
- Owner clarified pacing (steady, not stop-start); cancelled the 40-min timer and launched showpieces B (performance venues) immediately.
- Owner chose continuous handoff notes in the repo over new-session handoffs: docs/HANDOFF.md created (always-current 'Now' section) and made the first thing to read.
- 5-hour limit hit again ~18:00 UTC with ONE worker running (performance venues cut off; resets 21:00 UTC). Owner sent big playtest notes (msg 36) -> BIBLE update 11, backlog 2f-2j.
- Lead quick fixes from msg 36: traffic-light arm street names, Talk-button-only, Jules -> Nora, relationship rate x0.4 + daily cap 5. Performance worker resumed 21:02 UTC.
- Performance venues landed (cinema films, Symphony Hall, Lantern Playhouse). Stage 9 published.
- Owner msg 37: guide app prioritised ahead of the fix pack.
- Owner msgs 38-39: guide app active links; big city events added to the design (backlog 2k).
- 21:25 UTC: owner asked to stop after running workers (none were running) ahead of moving the project to another account; scheduled launch cancelled; clean stop point documented in HANDOFF.md.
- 21:29 UTC: owner (msg 45) chose to keep working this window before the move; guide app worker launched; plan = guide app, then trimmed fix pack if usage allows, then clean stop.
- Wander guidebook app landed (272 entries, stamp book, waypoint/planner links). Stage 10 published.
- 21:40 UTC: trimmed playtest fix pack worker launched (last worker before the account move).
- Fix pack 1 landed (6 of 8 items done, 2 partial). Stage 11 published (artifact version 1794692688-4db5). CLEAN STOP for the account move: no workers running, everything pushed.
- 21:57 UTC: owner reported 41% used; fix pack 2 + navigator worker launched; plan to continue one worker at a time until ~85%.
- Fix pack 2 + navigator landed (stairs, train flicker, need matching, Maps navigator with walk/bus/train/cab). Stage 12 published.
- 22:24 UTC: item-icons worker launched.
- Lead fix (owner msg 49): the old curb view no longer flashes between the landing shot and the cabin (intro.js: camera stays on the plane; instant cut to black before the cabin loads). Traced: fade is on from the step change until the cabin is shown.
- Lead fix (owner msg 50): the opening landing clears all other aircraft first (G.planes.clear()); tested: 2 flights before, only the landing during.
- Lead fix (owner msg 51): landing plane now starts to pull off toward the taxiway and the opening shot ends 1.6 s into that turn (plane still fully visible; traced: turn at 10.0 s, cut at 11.6 s); captions tightened; static aircraft parked on grass are hidden (planes.js).
- Lead fix (owner msg 52): the landing plane rolls to the END of the runway, stops, TURNS 90 degrees (y-axis sprite) and starts taxiing; the opening shot cuts 1.4 s after the turn. Verified by trace (turn at 10.1 s) and a screenshot of the turned plane. Note: fuel tanks sit near the taxi path at the runway end — a planner tweak could move them.
- Lead fix (owner msg 53): removed the runway-end turn; the plane keeps rolling straight and the opening cuts to the cabin 3.6 s after touchdown while it is still moving (traced: cut at 8.7 s, plane at v=9, fully visible). Ambient landings roll and fade near the runway end.
- Lead fix (owner msg 55): walkway chevrons now point in the direction of travel (gates.js); checked in a gallery render for both directions.
- Item icons landed (365/365 items, 558 icons). Stage 13 published.
- 22:52 UTC: apps worker launched (app store, Properties browser, Living Tips) — the last worker of this window.
- Apps landed (Appy store, Nestly, Bay Basics, mini apps). Stage 14 published (artifact version 1794695264-28f5). CLEAN STOP for the account move: no workers running, everything pushed.
- 2026-11-14 (new account): new lead took over on branch ccr-e622e92c-7t3ejy (from a1d2ffc). npm install + build OK, smoke screenshot OK. Stage 14 republished as a NEW artifact https://claude.ai/artifact/JQ1cnxuWNmXT8VSrYKowbG (version 1794695918-0180).
- 2026-11-14 (new account): 2g split into 2g-1..2g-4; worker 2g-1 (unique food & drink interiors, ~33 pub rooms + taqueria PIZZA sign fix) launched.
- 2026-11-14: owner msg 59 -> stopped the 2g-1 worker (no files written yet) and relaunched it on Fable 5.2; workers use Fable from now on.
- 2026-11-14: owner msgs 61-62 -> team of up to 4 Fable workers, ~10x usage. Lead added src/scenes/rooms/unique_rooms.js hook. Wave A launched: 2g-1 food, 2g-2 shops, 2g-3 lobbies, 2g-4 bladder+bathrooms. Wave plan B-E in HANDOFF.
- 2026-11-14: 2g-1 landed — 26 unique food & drink rooms (places_food.js, places_food2.js, 19 new furn.pf.* fixtures, guide info registered). Worker eval 26/26 pass; lead viewed taqueria, Mama Opal's, Halo Donuts. Activity matching for pub rooms is a lead TODO.
- 2026-11-14: S1 Botanical Conservatory worker launched (first signature showpiece). Not publishing yet: other workers' half-done files (bladder HUD, lobbies) are in the tree.
