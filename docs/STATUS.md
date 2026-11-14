# Status — what exists right now (update whenever something lands)
Last updated: stage 7 (public places pass).

## Engine & tools (lead-written) — src/engine, src/core, tools/
- `raster.js` pixel rasteriser (16 px/unit, 2:1 iso, glow/lit light layer, flip mode, patterns, 3x5 font, season helpers); `world.js` (vertex-height terrain, ground types, objects, nav grid 0.5u, pois, decals);
  `ground.js` chunk painter; `sprites.js` LRU cache; `render.js` (depth sort, see-through fade of tall objects in front of the player, flat items drawn first, ambient multiply + light pools + lighten pass);
  `nav.js` A*; `core/game.js` (G: state/save, scenes, loop, interactions, activities, cutscene, sub-pixel smooth camera, zoom limits), `char.js`, `clock.js`, `input.js`.
- `src/scenes/interior.js` room builder (defineRoom, fixtures with use/seats/staff/pose/bed, exits, enterRoom/exitRoom).
- Tools: build, serve, shot (headless screenshots + eval), gallery (art sheets), mapview, modules/artfiles generators.

## Art (procedural, src/art/**) — see docs/reports/*_art.md
- COMPLETE: characters + animals (chars), airport exterior + aircraft (airport), transit/vehicles/rail kit/road furniture (transit), home furniture 88 (home), venue fixtures 205 (venue),
  rail interior + Central Station pieces (rail_interior), airport interior 45 (airport_interior).
- PARTIAL (artists cut off by usage limits; the city uses what exists): downtown, oldtown, residential, civic, harbor buildings; props (nature/street/park); icons (item icons mostly missing -> placeholder tiles);
  terrain/water painter upgrade (ground.js edits by the terrain artist may be partial); audio (src/sim/_audio_*.js exist, src/sim/audio.js missing?); weather (weather.js + fx exist; isWet bug); title/creator (work, unpolished).

## Data — src/data (complete): needs, items (232), activities (68), jobs (10 + gigs), homes (9), venues, economy, calendar, phone. src/story (complete first pass): cast (~32), dialogue, story (18 beats), intro, texts.

## World — src/world: Maple Bay 384x384, 9 districts, roads (37 unique street names), rail loop with 8 stations, 3 bus routes, airport, river + bridges, River Walk, Central Park, Hillcrest terraces. docs/reports/city.md.

## Systems (docs/reports/<name>.md has each API)
- simcore: needs/moodlets/skills, money + weekly bills, inventory + fridge + spoilage, activities by fixture tag, places registry, HUD, shop window.
- phone: shell + 9 apps (Messages/People, Planner, Map, MapleCab, Bank, Jobs, Wellness, ZipEats, Settings), G.messages, G.planner.
- traffic/transit: ambient vehicles with signals, buses on 3 routes (rideable), taxis (call/hail/ride), riders on two-wheelers.
- housing: 9 player homes + 3 story homes, Decorate mode, rent/buy/mortgage, deliveries/unpacking, wardrobe.
- venue rooms: 20 venues (+ cinema hall). crowd: pedestrians/animals/room customers+staff. social: cast on schedules, talk panel, relationships, gifts, invitations.
- story: intro steps (G.intro), story engine (G.story, 18 beats), goals widget (Goals/Opportunities/Appointments), planes landing/taking off, achievements.
- jobs: 10 jobs with work loops, auto-work, promotions, gigs.
- rail: trains on viaduct, cutaway ride scene, Central Station hall, passes.
- airport interior: plane cabin, concourse, tram, terminal; new opening sequence.
- stalls + welcome glow (src/sim/stalls.js), addresses (src/sim/addresses.js).
- public places: 53 generic enterable venues + 8 walk-up windows converted from existing buildings, 5 extra groceries, 50 new food/gift items; phone map shows street names + addresses.

## Known issues / debts
generic eateries reuse the pizza counter art (a taqueria shows "PIZZA"): needs a neutral or per-cuisine counter sign; weather setWeather('clear') doesn't clear isWet(); item icons missing; MapleCab shows fare on free first ride; story recipes/discounts/keepsakes not wired into cooking/shop/home; seated player may sort behind flipped sofa;
duplicate "Discovered" toast; bus headways long; terminal has no glass roof; cabin passengers hidden by seat backs; no full human playthrough/QA pass yet; mobile layout only spot-checked.
