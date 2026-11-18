# Status — what exists right now (update whenever something lands)
Last updated: stage 15 (Wave A: unique interiors, lobbies, homes, bladder, conservatory) — 2026-11-14.

## Engine & tools (lead-written) — src/engine, src/core, tools/
- `raster.js` pixel rasteriser (16 px/unit, 2:1 iso, glow/lit light layer, flip mode, patterns, 3x5 font, season helpers); `world.js` (vertex-height terrain, ground types, objects, nav grid 0.5u, pois, decals);
  `ground.js` chunk painter; `sprites.js` LRU cache; `render.js` (depth sort, see-through fade of tall objects in front of the player, flat items drawn first, ambient multiply + light pools + lighten pass);
  `nav.js` A*; `core/game.js` (G: state/save, scenes, loop, interactions, activities, cutscene, sub-pixel smooth camera, zoom limits), `char.js`, `clock.js`, `input.js`.
- `src/scenes/interior.js` room builder (defineRoom, fixtures with use/seats/staff/pose/bed, exits, enterRoom/exitRoom).
- Tools: build, serve, shot (headless screenshots + eval), gallery (art sheets), mapview, modules/artfiles generators.

## Art (procedural, src/art/**) — see docs/reports/*_art.md
- COMPLETE: characters + animals (chars), airport exterior + aircraft (airport), transit/vehicles/rail kit/road furniture (transit), home furniture 88 (home), venue fixtures 205 (venue),
  rail interior + Central Station pieces (rail_interior), airport interior 45 (airport_interior).
- PARTIAL (artists cut off by usage limits; the city uses what exists): downtown, oldtown, residential, civic, harbor buildings; props (nature/street/park); icons (DONE: all 365 items — docs/reports/icons.md);
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
- stalls + welcome glow + VENDORS at the open gelato/grill carts during opening hours (src/sim/stalls.js, Stages 114-117), addresses (src/sim/addresses.js).
- bladder need + bathrooms as own rooms + restrooms everywhere (docs/reports/bladder_bath.md).
- Botanical Conservatory showpiece (docs/reports/conservatory.md).
- all 9 player homes unique (docs/reports/unique_homes.md).
- 46 apartment + office lobbies (docs/reports/lobbies.md).
- unique rooms for all 53 converted places: 26 food & drink + 27 shops/services/groceries (docs/reports/unique_food.md, unique_shops.md), with venue + browsing activities.
- public places: 53 generic enterable venues + 8 walk-up windows converted from existing buildings, 5 extra groceries, 50 new food/gift items; phone map shows street names + addresses.

- showpieces A: mall `deptstore` (10 shops + food court, 83 new items) and SkyDeck (`skydeck_lobby`, `skydeck`) — docs/reports/showpieces_a.md.
- shows: cinema with 4 real short films, Symphony Hall with animated orchestra (3 pieces), Lantern Playhouse (3 shows); shared ticket/audience/show engine G.shows — docs/reports/shows.md.
- guide: 'Wander' guidebook app (272 auto-built entries, What's On, Stamp Book, waypoint + planner links) — docs/reports/guide.md.
- fix pack 1: walkways keep right, deboarding order, plane-shaped cabin, station stairs (partial), flat-fee train tickets, sit anywhere (partial), goal/need waypoints, planner in Goals — docs/reports/fixpack1.md.
- fix pack 2 + navigator: station stairs, train flicker fix, data-driven need->place matching, Maps 'Where to?' navigator with walk/bus/train/cab routes and multi-leg trips (G.nav) — docs/reports/fixpack2.md.
- apps: Appy store with release notifications, Nestly properties browser, Bay Basics tips (G.tips), mini apps (showtime, transit, wallet, closet, friends, weather) — docs/reports/apps.md.
- navigator G.nav, Wander guide G.guide, item icons: see docs/reports/fixpack2.md, guide.md, icons.md.

- navigation arrow everywhere + 'This is your stop' (G.navArrow, docs/reports/navarrow.md); kitchen storage + starter pantry; door tap targets; first-hour tip pacing (lead, Stage 15b-16).

- QA round 1 (docs/reports/qa_wave_a.md): Wave A rooms swept and played; guide shows each place's own blurb / Don't miss / Try this; lobby activities; closed-office glow.

- Museum of Maple Bay showpiece (docs/reports/museum.md).

- Maple Bay Observatory showpiece (docs/reports/observatory.md).

- cooking: 212 recipes, 92 ingredients, cookbooks, tabbed cook menu, recipe learning (G.cooking, docs/reports/recipes.md).

- city-folk lines: 7,400+ written bubbles in no-repeat shuffle bags with player-state reactions and duets (docs/reports/city_lines.md).

- The Grand Maple Hotel showpiece (docs/reports/hotel.md).

- Maple Bay Arena showpiece (docs/reports/arena.md).

- Maple Bay Aquarium showpiece, 53 species (docs/reports/aquarium.md).

- Bay Fish Hall + Gull Point Lighthouse showpieces (docs/reports/fishmarket_lighthouse.md).

- Maple Bay City Hall showpiece + the fountain chain (docs/reports/cityhall.md); park fountains drawn again.

- Maple Bay Natatorium showpiece (docs/reports/natatorium.md). All nine signature showpieces S1-S9 are in.

- clothes / hair / laundry: 1,366 pieces, 95 hairstyles, shops with racks, hamper + laundromat loop, hair services, Closet app (docs/reports/clothes.md).

- traits (42), 21 skills, 26 in-world mini-games, coaches, Me app (docs/reports/traits_skills.md).

## Known issues / debts
generic eateries reuse the pizza counter art (a taqueria shows "PIZZA"): needs a neutral or per-cuisine counter sign; weather setWeather('clear') doesn't clear isWet(); item icons missing; MapleCab shows fare on free first ride; story recipes/discounts/keepsakes not wired into cooking/shop/home; seated player may sort behind flipped sofa;
duplicate "Discovered" toast; bus headways long; terminal has no glass roof; cabin passengers hidden by seat backs; no full human playthrough/QA pass yet; mobile layout only spot-checked.
- FINDABILITY (Stage 48): Wander quick tools, the Systems shelf (G.shelf), first-time windows (G.firstTime, 55), Settings toggle. docs/reports/findability.md.
- CHAPTERS (Stage 49): 15-Chapter main story engine, G.chapters, gold markers, book reader, attic, Dad. docs/reports/chapters.md, docs/story/CHAPTERS.md.

- JOBS (Stage 53): 21 hireable jobs with nine-beat story arcs (G.jobStory), clock-in choice (work / skip), one play per shift, staff door + pass; 4 more jobs wait for rooms (J3). CHAPTERS (Stage 52): all 15 played by taps from natural unlock; nine family moments (G.chapters.moments). See docs/reports/jobs_engine.md, chapters.md.

- RELATIONSHIPS & ROMANCE (Stage 59): G.rel, 12 friend/family arcs + 10 romances (205 scenes), dates on real systems, Porchlight app, move in, wedding. See docs/reports/relationships.md, docs/story/RELATIONSHIPS.md.

- SOUND (Stage 63): outdoor ambience = real recordings only (19 stretches, no-loop mixer, 'City sound' slider); indoors unchanged. PERFORMANCE (Stage 64): sprites/ground baked ahead (Web Worker + queue); tools/perf.mjs. MAILBOXES (Stage 61): lobbies + curb boxes. See docs/reports/ambience.md, performance.md, mailboxes.md.

## Added 2026-11-16 (Stages 94-102; lines prepared by the Opus bundle-2 worker, pasted by the lead)
- CLOTHING STORES (Stage 94): ten new enterable clothing stores in existing buildings (`cs_<key>`: Hollowell & Sons, Nightjar, Juniper & Rye, Second Wind Thrift, Cobble & Sole, Tidepool, Saltline Outfitters, Otterline Boathouse, Brim & Buckle, Little Lantern Atelier), each with its own room, hours, shopkeeper, till, racks, fitting room and lit sign; in-store-only clothes moved to their shops; 85 preset outfits in all 20 clothing shops with "Buy the look"; mannequins dressed in the looks. docs/reports/clothing_stores.md.
- CENTRAL STATION PLATFORMS (Stage 96): room `central_station:platforms` behind the hall's fare gates: two tracks, two platforms, head concourse, departures board, stationmaster's office; trains arrive and leave on the rail timetable; the train job works on the platforms (Information desk first, Opus bundle 1). docs/reports/central_station.md.
- INTRO LUGGAGE (Stage 95): the yellow suitcase with the red maple tag is towed from carousel 2 to the flat (G.luggage), parked by the door as a fourth intro box ("Unpack your moving boxes and suitcase (0/4)"); gives Tee & Jeans + Gym Kit; its unpack mini-game draws the case (zip, lid) since Opus bundle 2. docs/reports/luggage.md.
- WISH-LIST REMINDER (Stage 97): walking past the door of an open shop that stocks a wished in-store-only piece drops one phone banner (once per piece per day, never during scenes / shifts / rides / windows); tap = go in. docs/reports/wishnudge.md.
- REAL BATHROOMS (Stages 98, 101, batch 3 under review): `src/sim/restrooms.js` + rooms in `src/scenes/rooms/restrooms.js`: walk in, use a stall, wash your hands; 3 trial rooms + batch 2 (SkyDeck, Central Station, Galleria, library, museum, gym, Blue Heron, Arena; City Hall floors share the grand washroom) + batch 3 (hotel, four food places, Aquarium, Natatorium, Orpheum, Observatory, Fish Hall, University Commons, five coffee and tea places); the rest still use the old fade-out restroom. docs/reports/bathrooms.md.
- SEATING FOLLOW-UPS (Stage 99): whatever covers a seated player's head and chest fades; city benches no longer float or sink (shared `_benchseat.js`), rail-platform benches have no street Sit spot; Nana's rocking chair; a small hop when sitting down / standing up. docs/reports/seating_followups.md.
- OPUS BUNDLE 1 (Stage 101): the phone part-screen has no Bigger button and reading runs the normal clock; Station Agent starts at the Information desk; kneading and ping-pong have their own pictures; the Fireside Rocking Chair is for sale (Gilded Attic, Bellwether, Timber & Trowel). docs/reports/opus_bundle1.md.
- OPUS BUNDLE 2 (this job): props / trees / street signs off the lanes (`_furnish.js offRoad`, `tools/onroad_check.mjs`), arrow into a Galleria bay from in-store rows and trips, suitcase unpack art, intro hint yields to windows, Library lists the real reading time, navcheck holds noon. docs/reports/opus_bundle2.md.
- NIGHT-LIGHT POOL OCCLUSION (Stage 119): light pools (lamps, windows, headlights) are hidden where a building stands in front of the light; faded (see-through) buildings still show them. src/engine/render.js mainly; kill switch `?nightlight=noocc`; check with tools/poolocc_check.mjs. Report: docs/reports/pool_occlusion.md.
