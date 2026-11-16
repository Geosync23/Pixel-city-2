# Real bathrooms (owner msgs 151 + 192, BIBLE Direction update 28) — trial batch of three

Owner's rule: a bathroom is always a real, drawn room: walk in, use a toilet, wash hands at a sink. Every place's bathroom is its own (size, tiles,
fixtures, mood), no copies, no "tap the Restroom door and you are relieved". This batch = the shared mechanism + three finished rooms, so the lead
can judge the quality before the rest is built. Worker: Opus. Nothing committed / published by the worker.

## 1. Survey: where restrooms exist today (before this batch)

How it worked (all of it in `src/sim/bladder.js` unless said otherwise):
- **A. Auto restroom of a venue** (`addRestroom` on `'room:build'`): every non-home room with a counter fixture (`COUNTER_TAGS`) gets either a
  **door** (`furn.home.wall.door.room` + blue sign) on a free piece of back wall, or a **sign stand** in the room. Tap = `useRestroom()`: fade out,
  5 game min, bladder 100, +3 hygiene, toast. No room. Measured on the current build over the 163 rooms reachable from `G.places`:
  **44 doors, 63 sign stands**.
- **B. `lobby.restroom` door fixtures** (tags `toilet` + `lobby_restroom`): same fade-out via bladder.js's `toilet` handler. In the office lobbies
  (`lobbies.js`, 20 lobbies), City Hall rotunda (2 doors) + council / records / upper floors, the Grand Maple Hotel lobby (2) + events floor + guest
  floor corridor, Bay Fish Hall (2), Gull Point Lighthouse, the General Post Office (2) + Downtown Postcard Counter, the Natatorium (+ leisure hall),
  the University Commons. 26 entrance rooms had this ('own').
- **C. Arena**: `arena_restroom` fixtures (2) -> `G.arena.restroom()` -> the same fade with its own lines (src/sim/arena.js).
- **D. City park pavilion** (`bld.civic.restroom`, one, at 82,188): "Public restroom", the same fade.
- **E. Real rooms already**: the bathrooms of the 9 player homes + 3 story homes (`home:<id>:bath`, docs/reports/bladder_bath.md); the hotel guest
  room has a toilet + basin in the room (hotel_stay.js). The mall corner has a decorative "WC" doorway (mall.js, art only, not wired).
- **F. None**: the 24 residential lobbies (residents go home), the three small post branches without a counter, the 7 street stations, trains,
  planes, the University's Great Hall (its restroom is in the Commons).

## 2. Plan table (every venue: what it has now -> one-line idea for its own bathroom)

Status: **real** = done in this batch. A = auto door/sign (fade), B = lobby.restroom fixture (fade), C/D as above.

| Venue (room id) | Now | Its own bathroom (idea) |
|---|---|---|
| **SkyDeck (skydeck)** | **real** | **DONE: level 52, slate + walnut + brass, the whole bay behind the glass, orchid, dish of mints** |
| **Dot's Diner (diner)** | **real** | **DONE: tiny pink-tile 50s loo, one teal stall carved "D+J", chrome dryer, mop bucket** |
| **City Hall rotunda (cityhall)** | **real** | **DONE: 1891 public washroom, marble, oak stalls with high cisterns, maple-leaf medallion, first mayor's portrait** |
| **SkyDeck lobby (skydeck_lobby)** | **real (batch 2)** | **DONE: plain service loo off the corridor: painted block, concrete with a drain, one grey steel stall, pipes, a hard hat and hi-vis on the hook** |
| **City Hall council / records / clerk floors** | **real (batch 2)** | **DONE: every City Hall restroom door leads to the one grand washroom; leaving returns you to the door you came from** |
| Bayside Clinic (clinic) | **real (batch 4)** | **DONE (batch 4): pale-green tile, speckled vinyl, elbow-lever basin, sharps box, samples hatch, red pull cord, grab rail** |
| The Gilded Gull (restaurant) | **real (batch 4)** | **DONE (batch 4): wine-red flock carpet, white marble with gold taps, black-and-brass stalls, oval gilt mirrors, rolled linen towels** |
| Pier 7 Freight (warehouse) | A door | staff washroom: concrete, steel trough sink, hi-vis vests on hooks |
| Hartwell & Finch (office) | A door | corporate grey, motion-sensor taps, a passive-aggressive "please flush" note |
| Bay Realty & Trust (bank) | A sign | marble-lite, brass, a "for staff and customers" plaque, vault-door styled stall |
| Thread & Co. (clothing) | A sign | fitting-room-style loo with a full-length mirror and a mannequin torso |
| **Iron Maple Gym (gym)** | **real (batch 2)** | **DONE: locker-room loo: rubber floor, two orange stalls, steel basins with pump bottles, lockers, a bench, a scale ("Step on the scale")** |
| **Maple Bay Galleria (deptstore)** | **real (batch 2)** | **DONE: through the corner WC doorway: lilac stalls to the ceiling, quartz counter with sensor taps, one long mirror, a baby-change table with a forgotten duck** |
| **Grand Maple Hotel (hotel, ballroom, spa)** | **real (batch 3)** | **DONE (batch 3): art-deco powder room: blush walls, black lacquer stalls with gold sunrays, black marble vanity on gold legs, fan mirrors, roses, a velvet pouf; the ballroom and spa doors lead here too** |
| **Central Station (central_station)** | **real (batch 2)** | **DONE: railed steps down in the hall; below: white subway tile, green trim, terrazzo, a steel trough, four blue stalls with old 10c locks, a tile mosaic of the steam train** |
| Rise & Shine Bakery (bakery) | **real (batch 3)** | **DONE (batch 3): staff loo and flour store: butter walls, floury boards, enamel washbowl and jug, flour sacks** |
| Dog-Eared Books (bookstore) | A door | tiny loo lined with paperback shelves ("take one, leave one") |
| Bean & Gone (cafe) | **real (batch 3)** | **DONE (batch 3): chalkboard wall of doodles, trailing pothos, green tiles, a bowl on a reclaimed shelf** |
| Lucky Corner (cornerstore) | A sign | cramped stock-room loo, cases of soda stacked to the ceiling |
| Noodle Lantern (ramen) | **real (batch 3)** | **DONE (batch 3): dark wood, paper screen, stone basin fed by bamboo, noren curtain on the stall, toilet slippers** |
| FreshWay Market (grocery) | A sign | customer loo past the dairy cold room, rolling bins, recycling posters |
| The Orpheum (cinema) | **real (batch 3)** | **DONE (batch 3): red velvet stripes, cinema carpet with a few popcorn kernels, oxblood stalls, bulb-ringed mirror, framed poster** |
| Slice of Heaven (pizza) | **real (batch 3)** | **DONE (batch 3): white tile with green trim, terracotta floor, farmhouse sink, Nonna photo + calendar** |
| **The Blue Heron (bar)** | **real (batch 2)** | **DONE: one black stall, band stickers everywhere, red bulb, steel bowl, a lipstick heart on the mirror, the gumball machine** |
| **Maple Bay Public Library (library)** | **real (batch 2)** | **DONE: "the cleanest in the city": sage and cream stripes, oak herringbone, green stalls I and II, pedestal basins, QUIET sign, a swap shelf ("Swap shelf")** |
| ZipParcel Depot (courier) | A door | staff loo with a parcel-scale, cardboard everywhere |
| **Museum of Maple Bay (museum)** | **real (batch 2)** | **DONE: white gallery loo, polished concrete, minimal white stalls with black edges, black stone bowls on plinths, a hand dryer exhibited with a museum label ("Read the label")** |
| Maple Bay Aquarium (aquarium) | **real (batch 3)** | **DONE (batch 3): deep-blue tile, a wave across the floor, teal stalls with portholes, scallop-shell basins, a fish tank in the wall (door in the gift shop: no ticket needed)** |
| Symphony Hall (concerthall) | **real (batch 4)** | **DONE (batch 4): cream + gold stripes, parquet with a piano-key border, green marble on walnut, oval mirrors, 3 walnut stalls, the night's programme** |
| Lantern Playhouse (playhouse) | **real (batch 4)** | **DONE (batch 4): backstage loo: black stage floor with spike tape, dressing-table basin, BRAVO mirror with bulbs, costume rail, poster** |
| Fire Station No. 2 (fire_station) | **real (batch 4)** | **DONE (batch 4): red quarry tile, steel scrub sink, steel stalls with a red band, the old brass pole photo + helmets, a helmet on the floor** |
| Maplewood Elementary (school_classroom) | **real (batch 4)** | **DONE (batch 4): child-height basins in bright tiles, confetti floor, blue + green cubicles, WASH SING! poster, low mirror** |
| The Maple Bay Gazette (gazette_newsroom) | A door | headlines papered on the walls, a typewriter on the cistern |
| Bay Radio 98.6 (radio_studio) | A sign | "ON AIR - QUIET FLUSH" light, foam acoustic tiles |
| Observatory (observatory) | **real (batch 3)** | **DONE (batch 3): midnight walls, star-burst floor, brass, a constellation chart, a red night light low on the wall** |
| Conservatory (conservatory) | **real (batch 4)** | **DONE (batch 4): gardeners' washroom: glass wall onto the palm house, brick floor, potting-bench sink, 2 green stalls, watering can** |
| Bay Fish Hall (fishmarket) | **real (batch 3)** | **DONE (batch 3): wet white tile, red quarry floor with a drain and a puddle, galvanised stalls and sink, rubber boots** |
| Gull Point Lighthouse (lighthouse) | **real (batch 4)** | **DONE (batch 4): the keeper's head: whitewashed boards, teak ship's washstand, navy stall with a porthole, tide chart, ship in a bottle** |
| Maple Bay International (airport:terminal, airport:concourse) | **real (batch 4)** | **DONE (batch 4): long and bright, 5 numbered stalls, 4-basin terrazzo counter, 3 hand dryers, DEPARTURES board (Boston LATE), BABY CHANGE sign (tap), a forgotten luggage trolley; works during the intro** |
| Post offices (post_main, post_downtown, post_maplewood, post_hillcrest, post_harbor) | **real (batch 4)** | **DONE (batch 4): one layout, five colours + one detail each (section 11); Maplewood, Hillcrest and Harbor had no restroom and got a door** |
| Office lobbies (lobby:1-24, lobby:48, 20 rooms) | **real (batch 4): the plain office restroom (section 11b)**; ideas kept for later: | one line each, by the building's theme: BayJet (aircraft-lav), Harbor Authority (ship's head), Ironside Foundry (cast-iron), Meridian Twin Towers (glass + chrome), Garnet Exchange (red stone), Harbor Trust (banker's marble), Kessler Block (old brick), Tidewater Insurance (beige corporate), Lanternworks (loft industrial), Northgate (municipal green), Carrow & Finch (law-firm walnut), Bayline Telecom (90s teal), Pelican Mutual (pelican tile), Quay Street Labs (lab-white with eyewash), Gas & Light (vintage gas lamps), Silver One (silver mirrors), Hollis Price (chambers oak), Brightwater Health (pastel clinic), Atlas Maritime (map mural), Shed 5 Works (shipping-container loo) |
| **Maple Bay Arena (arena)** | **real (batch 2)** | **DONE: Otters-red block: five stalls, a round wash fountain, the score on a TV, an OTTERS sign, a queue rail; the half-time queue (wait) is kept** |
| City park pavilion (city) | **real (batch 4)** | **DONE (batch 4): rough block reached from the city: concrete, a trough with push taps, 2 green steel stalls, NOT FOR DRINKING notice, cobweb, leaves blown in** |
| Maple Bay Natatorium (natatorium, leisure) | **real (batch 3)** | **DONE (batch 3): pool-side tile with a blue stripe, non-slip floor, tiled basin ledge, wall hair dryer, lost-property box** |
| Maple Bay University Commons (university) | **real (batch 3)** | **DONE (batch 3): painted block, speckled lino, navy stalls with flyers and E=MC2, notice board, forgotten textbook** |
| Home-goods stores (goods:timber, fjord, bellwether, lumen, copper, attic, warp, loam, voltaic, spoke, kestrel, sleepy, nord) | **real (batch 4)** | **DONE (batch 4): the plain shop restroom in the store's wall colour (owner msg 208; section 11b)** |
| Clothing stores (cs_hollowell, nightjar, juniper, secondwind, sole, tidepool, outfitters, otterline, brim, lantern) | **real (batch 4)** | **DONE (batch 4): the plain shop restroom in the store's wall colour (owner msg 208; section 11b)** |
| Public places pub:1-61 (55 shops / cafes / restaurants) | **5 own rooms in batch 3** (pub:8, 45, 53, 29, 24, section 10); **the other 48: the plain shop restroom (batch 4, section 11b)**; ideas kept for later: | one each from its trade: Tea Garden (bamboo), Heron's Table (rustic farm), Bloom & Paper (flowers), Coast Gas Mini Mart (gas-station loo with key on a hubcap), Maple Brewing Taproom (barrel sink), Night Owl Coffee (dark + owl print), El Farolito (talavera tiles), Little Hanoi (bamboo + lanterns), Flour & Fig (fig-tree mural), Marigold & Main (marigold wallpaper), Cedar & Olive (olive-wood), Silver Spoon Diner (chrome diner #2, NOT Dot's look: blue-white), Addis Table (woven baskets), Halo Donuts (pink sprinkles tile), Lacquer Lounge (nail-bar pink + gold), Rind & Wheel (cheese-cave stone), Paper Lantern Books (paper lanterns), Baker House Bagels (subway tile), Suds & Bubbles (laundromat: washer as the sink stand), Otis & Sons (barber-pole stripes), Jade Rabbit (jade green), Nine Dragons (red + dragon screen), Marchetti's (deli-counter tiles), Kettle & Crumb (kettle collection), Old Post Stationers (letterpress posters), Bubbling Lantern (steam + lanterns), Post Corner Pharmacy (white + sample shelf), Paws & Whiskers (dog bowl by the door), Seoul Ember (charcoal + K-pop poster), Paper Crane Izakaya (paper cranes), Birch Lane Pantry (jars), Wax & Wane / B-Side / Spin City (record-sleeve walls, three different eras), Black Cat Ink / Ink & Ivy Tattoo (flash-sheet walls), Ink & Ivy Vintage (clawfoot tub as planter), Sunnyside Cafe (sunflower yellow), Bay Thread Co-op (patchwork), Tidewater Gallery (white cube with one framed loo roll), Studio 11 (paint-splattered), Ink & Ivy Comics (comic-page wallpaper), Salt & Co. Provisions / Chandlery (ship's chandlery brass), Cold Storage Boba (ice-blue), Cannery Coffee (tin-can lamps), Rope Works Fish & Chips / Smokehouse (rope + smoke-stained timber), Harbor Tea & Spice (spice-tin wall), Mama Opal's (family photos), Elm House Bakery (elm wood), Tin Robot Toys (toy robot on the cistern), Bloom & Paper Riverside (river view window) |
| Residential lobbies (24) | none | none needed (residents go home); keep as is |
| Street stations (7), trains, planes | none | later: a tiny train / plane lavatory as a room on long rides (owner?) |

Batches after this: 8-12 rooms each, the venues the player visits most first (cafe, bar, library, station hall, mall, arena, office lobbies),
then the home-goods and clothing stores, then the 55 pub venues. Small venues can share the mechanism and a size-4 shell, never the look.

## 3. The mechanism (new: `src/sim/restrooms.js`, data `src/scenes/rooms/restrooms.js`)

- `WC` (scenes/rooms/restrooms.js): one entry per venue: `{ venue, id: '<venue>:wc', back: 'Back to ...', door?: { x, y, flip, style, spot }, def }`.
  `def` is a normal room def (defineRoom format, interior.js). The `:wc` id makes `navgoals.rootOf()` file the room under its building.
- On `'room:build'` of the venue (order 134, before bladder.js's handler at 135):
  - restroom interactables the venue already has (City Hall's `lobby.restroom` doors) get a new `use` (enter the room), `navTo` and `wc`;
  - else the entry's `door` is placed (`furn.wc.door`, style per venue) with a "Restroom" interactable; `scene._wc = 'real'` so bladder.js adds nothing.
  - Venues without an entry are untouched (bladder.js as before). **Adding a venue later = one WC entry + its art; no other file changes.**
- Inside: stalls tag `wcstall` -> "Toilet" (refused with "You do not need to go right now." at bladder >= 92) -> `G.bladder.useToilet(fx)` (the existing
  `use_toilet` activity: 4 game min, +100 bladder, -3 hygiene, relieved moodlet), the player is hidden and the stall drawn with its door shut
  (`p.occ`: red lock, feet under the door where the partitions have a gap) until the activity ends or is stopped. Basins carry the existing `sink`
  tag -> bladder.js's "Wash hands". Exit mat "Back to ..." -> back into the venue **at the spot in front of the door you used**.
  Leaving within 60 min of a toilet visit without washing: one toast per visit ("Off without washing your hands? The basin is right there. (Your call.)").
- `G.restrooms = { list(), has(venueRoomId), roomOf(venueRoomId), enter(venueRoomId, from?), leave() }`;
  state `G.state.restrooms = { back, visits: { [wcId]: n } }` (created by defineState: old saves load; a save made inside lands at the venue's
  street door like any other venue). Events `'restroom:enter'(wcId)`, `'restroom:leave'(wcId, { washed })`.
- Navigation: rows added to `G.navGoals.graph` (venue <-> wc room, add-only, at 'ready'); a resolver `wc` (prio 31) for the need chooser's bladder
  goal: in a venue with a real restroom it marks the Restroom door, inside it marks a stall ("A free stall") and ends when you sit down.
  `navgoals.js` and `navigator.js` are not edited; the "nearest restroom" list still comes from `G.bladder.hasRestroom` (true for these venues).
- Room flags: `noCrowd: true` (no NPCs in the restrooms this batch; crowd files untouched), `wc: <venue>`.
- Small extras: SkyDeck "Take a mint" (`wcmints`), City Hall "Suggestion box" (`wcsuggest`, five comment cards); the SkyDeck window follows
  the clock (day / dusk / night panorama, `G.showpieces.skydeck.viewNow()`).

## 4. The three rooms

| | SkyDeck (skydeck:wc) | Dot's Diner (diner:wc) | City Hall (cityhall:wc) |
|---|---|---|---|
| size, walls | 9 x 6, h 4, charcoal walls, brass trim | 5 x 4, h 2.6, pink 50s tile + black bullnose rail | 12 x 8, h 3.8, cream walls, City-Hall green trim + rail |
| floor | large slate tiles, brass inlay line | white penny tile with black dots | white marble, black cabochons, green border, maple-leaf medallion |
| stalls | 3, walnut floor-to-ceiling, black stone pilasters, brass rail, wall-hung toilets + brass flush plate, lit green/red lock | 1, teal metal on chrome posts, gap top + bottom, close-coupled toilet, "D+J" + heart carved | 4, oak raised-panel, marble pilasters, brass top rail, Victorian high cisterns with pull chain, wooden seats |
| basins | floating black stone slab, 2 white vessel bowls, tall brass taps, warm under-light | one wall-hung porcelain basin on chrome legs (chipped), H/C taps, pink soap | long marble vanity on a green panelled cabinet, 3 basins, brass cross taps |
| mirrors | 2 round backlit | small square one, cracked | 3 arched gilt |
| drying, bin | rolled towels in a basket, brushed-steel bin | chrome "push" dryer, cream pedal bin (dented) | linen towels on a brass tray, brass urn bin |
| light | 2 amber glass pendants | fluorescent tube (one end grey) | crystal chandelier (existing furn.hotel.chandelier, small) |
| signage | "LEVEL 52" in brass letters | "WASH HANDS" enamel sign | brass plaque "PUBLIC WASHROOM" |
| story detail | floor-to-ceiling window on the bay (existing furn.skydeck.pano), orchid, dish of mints (tap: a mint), leather bench at the glass | mop bucket + wet-floor sign, graffiti, a little window, a framed picture | portrait of the first mayor (existing furn.cityhall.portrait), suggestion box (tap: a card), fern |
| venue door | walnut "WC" door on the side of the lift core (by Cloud Nine) | red door with porthole + chrome kick plate, teal "WC" plaque, past the jukebox | the two existing rotunda restroom doors |

Shared between them: only the toilet-bowl core (`bowl()` in the art file; tank type, seat and colours differ per room).

## 5. Files

New: `src/sim/restrooms.js` (mechanism), `src/scenes/rooms/restrooms.js` (the three rooms + venue doors), `src/art/venue/restrooms_art.js`
(14 assets `furn.wc.*`: stall, vanity, sink, mirror, dryer, pendant, tube, sign, door, floor, mints, bin, mop, suggest), `tools/restrooms_check.mjs`
(the touch play-through), this report. `src/modules.gen.js` is regenerated by the build. **No existing source file was edited.**

## 6. Checks run (by the worker)

- `node src/data/validate.mjs` exit 0. `node tools/build.mjs` OK. `grep -c '(?<[=!]' dist/index.html` = 0.
- Size: the same tree built without the three new files 15,082,325 B, with them 15,106,146 B = **+23.8 KB** (budget 50 KB; the whole file is 14.75 MB of 16).
- `node tools/restrooms_check.mjs` (390x844, touch, New Game + `G.intro.skip()`; every USE (door, toilet, basin, way out) is a finger tap on the
  canvas; rooms are bigger than the phone screen, so when the target is off screen the script first walks the player near it with the game's
  pathfinder `G.player.goTo`, the call a floor tap makes; venues are reached by `G.go('int:<venue>')`, not by walking the city): **30/30 passed, 0 page errors**:
  for each of the three: door present and leads to the room; tap -> walk -> inside; Toilet: activity runs, player hidden, stall door shut, bladder
  17-18 -> 100, door open again after; Wash hands: hygiene +8.8..+8.9; bladder full -> "You do not need to go right now." and no visit; way out ->
  back in the venue at exactly the door spot; diner: leaving unwashed -> the nudge once; night (22:30): in, toilet, out. Guide: need goal from the
  diner -> arrow "The restroom" on the door -> inside "A free stall" -> goal ends on the seat. A home bathroom (Juniper Court): in, toilet, bladder 100.
- `node tools/navcheck.mjs --rooms all`: all passed, 0 page errors (291 rooms, incl. `skydeck:wc`, `diner:wc`, `cityhall:wc`: 1 door each, routes to
  the venue and the city found). `node tools/nightcheck.mjs`: all checks passed. `node tools/perf.mjs --verify`: VERIFY OK (same pixels), 0 page errors.
- Screenshots looked at, full size, by the worker: `out/shots/bath_<diner|skydeck|cityhall>_{0_door,1_room_day,2_inuse,3_wash,4_back,5_room_night,
  6_inuse_night}.png`, `bath_guide_1_venue.png`, `bath_guide_2_room.png`, `bath_home_inuse.png`; wide views of each whole room at 1200-1400 px
  (`out/shots/v_*.png`) and the asset sheets (`out/gallery/wc*.png`).

## 7. Not tested / known gaps

- (batch 1 note, now done in batch 2) The SkyDeck lobby has its own small restroom.
- Every venue without a WC entry still uses the old fade-out until its batch (City Hall's floors are done in batch 2).
- No NPCs use or queue for the stalls (crowd files were off limits); all stalls are free. The stall interactable does not check "occupied by someone else".
- Leaving in the middle of a toilet visit is the activity's own Stop (tested only through the code path, not by tapping Stop).
- Save + reload while standing inside a restroom: by code it lands at the venue's street door (title.js rule for venues); not played.
- Not tried on iOS Safari; no new regex syntax (the lookbehind grep is 0).
- The navigator's "nearest restroom" rows are unchanged (they name the venue, which is right); Map / Wander shortcuts not re-played.
- At phone zoom the bigger rooms do not fit the screen (like every room); the arrow and the walk work.

## 8. Questions for the owner (batch 1; the lead answered 1-3 with defaults, see batch 2)

1. SkyDeck lobby: give it its own small street-level restroom (a 4th room), or take its door away and send people up to Level 52?
2. Should all of City Hall's restroom doors (upper floor, records, council) lead to the one grand washroom, or should the offices upstairs get a plainer one?
3. Would you like city folk in the restrooms (a queue at the Arena at half-time, someone at the basin), or keep them quiet?

## 9. Batch 2 (eight more rooms, 2026-11-16)

Chosen by how often a player is there: the SkyDeck lobby (lead decision: its own small street-level loo), Central Station's hall (every train trip),
the Galleria (biggest shop), the library and the museum (daytime regulars), the gym (daily routine), the Blue Heron (nightlife, the busiest
evening venue) and the Arena (game nights; its two restroom doors existed). The hotel lobby is next in line. Plus, without a new room: City Hall's
council, records and clerk floors now open into the grand washroom (`also` in the WC entry; leaving returns to the room and door you came from).

| room id | size | look | venue door |
|---|---|---|---|
| skydeck_lobby:wc | 4x4, h 2.6 | painted grey block, concrete with a drain, grey steel stall, small steel basin + paper-towel box, copper/grey pipes, hard hat + hi-vis, caged bulb | new grey service door with a blue WC plate, right of the lifts |
| central_station:wc | 10x6, h 3.2 | white subway tile, green trim + rail, terrazzo with a yellow edge line, steel trough on a tiled plinth (4 taps), 4 blue-grey stalls with brass 10c locks, steel-framed mirrors, tile mosaic of the steam train, green litter bin | railed steps down with a TOILETS sign, standing in the hall by the vending machines (no wall edit in stations.js) |
| deptstore:wc | 9x6, h 3.0 | beige stone tiles, lilac full-height stalls, quartz counter with sensor taps and a lilac under-glow, long mirror strip, baby-change table with a duck, palm | the Galleria's existing WC doorway (corner, behind the escalator) now leads in |
| library:wc | 6x5, h 3.0 | sage/cream stripes, green rail, oak herringbone, 2 green panelled stalls (I, II), pedestal basins, oval wood mirrors, green-shade sconce, QUIET sign, swap shelf | new oak panelled door with a brass WC plate, corner of the stacks |
| museum:wc | 8x5, h 3.6 | gallery white, polished concrete slabs, white stalls with black edges, black stone bowls on white plinths, tall black-framed mirrors, track lights, the exhibited hand dryer + label, a gallery bench | new white door with black WC lettering, in the cafe corner |
| gym:wc | 7x5, h 2.8 | rubber floor, red trim, 2 orange stalls (numbers), steel counter with pump bottles, big frameless mirror, lockers (existing art), bench, scale | new orange door, by the yoga mats |
| bar:wc | 4x4, h 2.6 | black brick, neon-pink trim, red/black worn checker, one black stall with stickers, steel bowl, round mirror with a lipstick heart, sticker wall (MOTHS LIVE!), red bulb, gumball machine (existing art) | new black door covered in stickers, pink neon WC, under the EXIT sign |
| arena:wc | 12x6, h 3.2 | grey epoxy with the team stripe, white block + red rail, 5 red stalls, round wash fountain, TV with the score, OTTERS sign, queue rail (existing art) | the two existing concourse restroom doors |

Art: `src/art/venue/restrooms_art2.js` (new: basin, glass, floor2, deco, prop, lamp, each with per-room styles) + new styles in `restrooms_art.js`
(stall: 8 styles with their own marks: rivets, 10c lock, chrome rail, numerals, black edge, numbers, stickers, team stripe; bin, door, sign kinds).
Mechanism additions (`src/sim/restrooms.js`): `also` rooms, door kinds `existing` / `stairs`, the Arena's half-time queue kept (`gate: 'arena'`),
fixtures `wcbooks`, `wcscale`, `wcbaby`, `wclabel`; the room-graph row for a restroom's way out now matches its own exit label (Central Station's
is "Up to the station hall"). Suggestion-box cards no longer use em dashes.

Checks (batch 2, by the worker):
- validate exit 0; build OK; lookbehind grep 0.
- Size: the tree with batch 1 only (Stage 98 versions of the three files, no restrooms_art2.js) 15,119,163 B; with batch 2 15,138,683 B = **+19.1 KB** (budget 70 KB).
- `node tools/restrooms_check.mjs --shots bath2` (DIST=... overrides the build): **all 12 venue flows + guide + Stop + save/reload + home passed, 0 page errors**
  (the first full run had one false FAIL: City Hall records has two doors and the script compared with the other one; fixed in the script, re-run for that room passed).
  Stop during a visit: activity ends, player visible, stall open, bladder part-filled (10 -> 51). Save inside the library restroom + reload + Continue: back in the
  city at the library's street door, visible, no errors.
- navcheck --rooms all: first run 1 FAIL in the OBSERVATORY ("Stairs to the dome" led to the city): the run is longer now (299 rooms) and the game clock passed
  00:18, when the observatory walks everyone out; a second run of the room graph on the same tree: 299 rooms, 0 problems. The audit part passed.
  Suggestion for the lead: navcheck could set the time per room (T(null, 14)) to make it independent of run length.
- nightcheck: all checks passed. perf --verify: VERIFY OK (same pixels), 0 page errors (the first try was cut off by my own timeout while other checks ran; re-run alone).
- Pictures looked at full size: `out/shots/bath2_<room>_wide.png` (whole room), `bath2_<venue>_{0_door,1_room_day,2_inuse,3_wash,4_back,5_room_night,6_inuse_night}.png`,
  `bath2_stop.png`, `bath2_reload.png`; asset sheets `out/gallery/b2_*.png`. Redrawn after looking: terrazzo and gym floors were too speckled, globe lamps in the
  station floated like puffs (removed), sticker text ran into the mirror, the half-unit room depths showed a strip of the base floor (now whole units),
  the SkyDeck mints sat on top of the Wash hands spot (taps went to the mints), cyl() colour functions crashed two bins and the fountain.


## 10. Batch 3 (twelve layouts, sixteen venues)

Chosen by how often a player is there: the hotel lobby (lead's first pick; the ballroom and spa doors lead there too), the busiest food and drink places
(Bean & Gone, Noodle Lantern, Slice of Heaven, Rise & Shine), the big day-out places (Aquarium, Natatorium, Orpheum, Observatory, Bay Fish Hall), the
University Commons (students live there), and one shared layout for five small coffee and tea places. The concert hall, the playhouse, the conservatory
and the clinic are next.

| room id | size | look | way in |
|---|---|---|---|
| hotel:wc | 8x6 | blush walls, black/ivory diamond floor with brass lines, 3 black lacquer stalls with gold sunrays, black marble vanity on gold legs, fan mirrors, roses, lotion tray, velvet pouf | the lobby's two restroom doors; also from the ballroom and the spa |
| cafe:wc | 4x4 | cream + green trim, green tiles, light plank stall, ceramic bowl on a reclaimed shelf, round wood mirror, trailing pothos, chalkboard ("BEAN THERE") | the sign stand bladder.js found room for (no free wall) |
| ramen:wc | 4x4 | plank walls, pebble-and-slate floor, dark stall with an indigo noren curtain, stone basin with a bamboo spout, paper screen, lantern, slippers | sign stand |
| pizza:wc | 4x4 | white tile with green rail, terracotta floor, green stall with a red band, farmhouse sink with a flour-sack towel, oval mirror with flag ribbon, Nonna's photo + calendar | new green door with a cream WC plate |
| bakery:wc | 4x4 | butter-yellow walls, floury boards, pale-blue panelled stall, enamel washbowl and jug on a stand, flour sacks (existing art) | new pale-blue door |
| aquarium:wc | 8x5 | deep-blue tile, wave across a blue floor, 3 teal stalls with portholes, scallop-shell basins on coral, porthole mirrors, fish tank in the wall | new teal door with a porthole, in the gift shop (outside the ticketed zones) |
| natatorium:wc | 9x5 | white tile + blue stripe, non-slip pale-blue floor with a drain, 3 aqua stalls (numbered), tiled ledge with 3 basins, long mirror, hair dryer, lost-property box | the leisure hall's restroom door |
| university:wc | 7x5 | painted block, speckled lino, 3 navy stalls with flyers and E=MC2, white counter, a forgotten textbook, notice board | the Commons' restroom doors |
| cinema:wc | 7x5 | red velvet stripes, cinema carpet with a few kernels, 3 oxblood stalls with brass, black counter, bulb-ringed mirror, framed poster | sign stand |
| fishmarket:wc | 6x4 | white tile + harbour-blue rail, red quarry floor with drain and puddle, 3 galvanised stalls, galvanised sink with hose, steel mirror, rubber boots | the hall's two restroom doors |
| observatory:wc | 5x4 | midnight walls, star-burst floor, midnight stall with brass stars, copper bowl on dark wood, constellation chart, red night light | sign stand |
| pub:N:wc (one layout) | 4x4 | one stall, a bowl on a wooden shelf, round mirror, plank floor; walls, wood, stall colour and story piece per venue (below) | the venue's own door or sign stand |

The shared small-cafe layout (counts as one of the twelve), venue by venue:
- Night Owl Coffee (pub:8): midnight-violet walls, violet stall, brass mirror, an owl print.
- Sunnyside Cafe (pub:45): sunflower-yellow walls, yellow stall, orange trim, a sun plaque and a sunflower in a pot.
- Cannery Coffee Roasters (pub:53): grey brick, steel-grey stall, a shelf of old tins.
- Kettle & Crumb (pub:29): blush walls, red stall, a shelf of three kettles.
- Jade Rabbit Tea House (pub:24): pale green walls, jade stall, a rabbit plate.

Mechanism: door kind `auto` (keep the door or sign stand bladder.js places, then lead it into the room; a second 'room:build' handler registered at
'ready' runs after bladder.js). Stall colour override (`p.c`, `p.c2`) for the shared layout. Exit label check in the test script now matches
"Back to / Up to / Leave the ..." (the hotel's is "Leave the powder room", since you may have come from the ballroom or the spa).
Art: new `src/art/venue/restrooms_art3.js` (basin3, glass3, floor3, deco3, prop3); 12 more stall styles + 4 door styles in `restrooms_art.js`.
Lead's fixes: Central Station terrazzo and the gym rubber floor calmed down (far fewer, low-contrast flecks); the batch 3 floors were calmed the same way
after the first look (cafe grout, pizza grout, bakery flour, cinema carpet, aquarium wave).

Size: Stage 101 tree with the Stage 101 versions of my files 15,140,184 B; with batch 3 15,168,821 B = **+28.0 KB** (budget 60 KB).
All bathroom work so far: batch 1 +23.8 KB, batch 2 +19.1 KB, batch 3 +28.0 KB = **about 70.9 KB** (measured per batch against the tree of the time).

What remains after batch 3: of the 133 venue entrance rooms that had a fade-out restroom (survey), 22 now lead into real rooms (plus City Hall's
floors, the hotel ballroom and spa, the SkyDeck deck); **111 entrance rooms remain**, plus the park pavilion and a few inner rooms (airport, post office, lobbies' upper floors).
Biggest groups left: 50 pub venues (shops and small restaurants), 20 office lobbies, 13 home-goods stores, 10 clothing stores.

Checks (batch 3, by the worker; the dist built after the last source edit, 15,168,821 B):
- validate exit 0; build OK; lookbehind grep 0.
- `node tools/restrooms_check.mjs --shots bath3`, run once from start to finish AFTER the last edit to the script: **240 PASS, 0 FAIL, 0 page errors**
  (all 29 restroom entry points incl. the hotel ballroom and the five small cafes, the guide, Stop (bladder 10 -> 48), save + reload inside a restroom, a home bathroom).
  Found and fixed on the way: the Aquarium's door first stood inside the ticketed Tropical Reef (a visitor without a ticket was pushed back);
  it is now in the gift shop. The script takes a per-venue hour (the Observatory opens at 13:00).
- navcheck --rooms all: all passed, 0 page errors (315 rooms, 0 with problems). nightcheck: all checks passed. perf --verify: VERIFY OK (same pixels), 0 page errors.
- Pictures looked at full size: `out/shots/bath3_<room>_wide.png` (all 16 venues, plus central_station and gym for the calmer floors),
  `bath3_<venue>_{0_door,1_room_day,2_inuse,3_wash,4_back,5_room_night,6_inuse_night}.png`; asset sheets `out/gallery/b3_*.png`.
- Not done: the sign-stand venues (cafe, ramen, cinema, observatory, four of the five small cafes) still show bladder.js's blue sign stand as the way in
  (no free wall I could place a door on without editing the venue); no city folk in restrooms.

## 11. Batch 4 (eleven one-off rooms, the post layout x5, two plain layouts for everything else; 2026-11-16)

**Owner ruling mid-batch (msg 208): "bathrooms can be simple, let's not go crazy except for signature buildings. All shops' bathrooms should be very simple."**
So the signature / one-off venues below each have their own room, and every shop, restaurant, cafe, office lobby and office (and the friends' flats)
got one of TWO plain layouts from a tiny table (section 11b). The per-brand shop rooms I had first drawn for the 10 clothing and 13 home-goods stores
were replaced by the plain layout before anything was published, and their brand-only art pieces were taken out again.

Every room below is entered from the venue's Restroom door (or sign stand, or the city's pavilion door), has working stalls (Toilet: the stall door shuts,
you are hidden) and a basin (Wash hands), and the way out lands you at the door you used. Each has one story piece you can tap ("wcstory" fixture:
a short line or two in the room's own voice). New art: `src/art/venue/restrooms_art4.js` (basin4, glass4, floor4, deco4, prop4); `restrooms_art.js`
stall() now takes brand overrides (`c`, `deco`, `m` metal) and door() a colour (`c`, the post offices).

| room id | size | look | way in |
|---|---|---|---|
| concerthall:wc | 7x5 | cream + gold stripes, parquet with a piano-key border, green marble on walnut with brass taps, 2 oval mirrors, 3 walnut panelled stalls, the night's programme (tap) | the hall's restroom door (auto) |
| playhouse:wc | 5x4 | the backstage loo: black stage floor with spike-tape marks, an old dressing table as the basin (greasepaint, wig stand), BRAVO in lipstick on a bulb-lit mirror, costume rail (tap), poster | sign stand |
| conservatory:wc | 6x4 | the gardeners' washroom: pale-green tile, brick floor, potting-bench stone sink, arched mirror, a glass wall onto the palm house with a fern poking in (tap), 2 green stalls, watering can | sign stand |
| clinic:wc | 5x4 | pale-green tile, speckled vinyl, elbow-lever wall basin with sanitiser and a sharps box, dryer, samples hatch + red pull cord + grab rail (tap), one wide stall | sign stand |
| airport:wc | 14x6 | long and bright: blue-trimmed white tile, big pale tiles, 4-basin terrazzo counter with one long mirror, 3 hand dryers, 5 numbered stalls, DEPARTURES board (YVR ON, BOS LATE; tap), BABY CHANGE sign (tap: the changing table), a luggage trolley, bin | the terminal's and Concourse B's sign stands (`also`); leaving returns you to the one you used |
| park:wc | 6x4 | rough outdoor block: grey brick, bare concrete with a drain and blown-in leaves, concrete trough with push taps and a pine-soap dispenser, polished-steel mirror, 2 green steel stalls, cobweb, NOT FOR DRINKING notice (tap) | the city's park pavilion door ("Public restroom") |
| lighthouse:wc | 4x4 | the keeper's head: whitewashed boards, teak ship's washstand with a brass rim, navy stall with a porthole, tide chart, ship in a bottle (tap) | the cottage's own restroom fixture (rerouted) |
| restaurant:wc | 6x4 | the Gilded Gull: wine-red stripes, flock carpet, white marble with gold taps, 2 oval gilt mirrors, 2 black-and-brass sunray stalls, rolled linen towels (tap) | sign stand |
| school:wc | 6x4 | Maplewood Elementary: child-height basins in bright tiles with a step stool, confetti floor, a low mirror, blue and green cubicles, WASH SING! poster (tap) | sign stand |
| fire_station:wc | 6x4 | red quarry tile, steel scrub sink with knee taps and a brush, polished-steel mirror, steel stalls with a red band, the first brass pole photo with helmets (tap), a yellow helmet on the floor | the station's restroom door (auto) |
| post_<branch>:wc (one layout) | 5x4 | white tile, calm tiled floor with a coloured border, pedestal basin, mirror, hand dryer, 2 panelled stalls; colour and one detail per branch (below) | Main + Downtown: their own restroom fixtures (rerouted); Maplewood, Hillcrest, Harbor: a new door on the back wall beside the counter |
| <venue>:wc, plain (section 11b) | 4x4 / 5x4 | one stall, one basin, a mirror, a bin (office: + dryer); the venue's own wall colour | the venue's own door, fixture or sign stand (auto) |

Post offices (the one different detail): **General Post Office** red + cream, a framed sheet of the first stamp (one printed upside down);
**Downtown Postcard Counter** postcard blue, the rack of typo postcards ("Greetings from Mapel Bay"); **Maplewood** rose, children's drawings of the
postman; **Hillcrest Post & Telegraph** brown + cream, the telegraph office clock stopped in 1979; **Harbor Mail Boat Office** harbour blue, tide chart + life ring.

### 11b. The plain restroom (owner msg 208)
Data: `PLAIN` (two layouts) and `PLAIN_TABLE` (venue ids per layout) in `src/scenes/rooms/restrooms.js`; one `plain(venue, kind)` call makes each entry.
- **shop** (4x4): pale tiles, a pedestal basin, a plain grey-framed mirror, a bin, one grey steel stall. Used by the 10 clothing stores, 13 home-goods
  stores, 48 pub venues (shops, cafes, restaurants), FreshWay Market, Lucky Corner, Thread & Co., Dog-Eared Books and the four friends' flats (rel_flat_*).
- **office** (5x4): grey tiles, a dark counter basin, a wider mirror, a hand dryer, a bin, one white full-height stall with black edges. Used by the
  20 office lobbies, Bay Realty & Trust, Hartwell & Finch, ZipParcel, Pier 7 Freight, the Gazette newsroom and Bay Radio.
- Fitting the place without hand design: on 'ready' (and again on entering) `src/sim/restrooms.js` gives each plain room its venue's name
  ("<venue> Restroom") and the venue's own wall colour + trim. The way out reads "Leave the restroom". Cost: about 0.1 KB per venue.
- The old cinema hall (unreachable) also leads to the cinema's room (`also`), so nothing is left on the old fade-out.

Arena inner rooms: `arena:bowl` and `arena:backstage` have no restroom of their own (not checked what the
need goal does there); `arena:store` does not exist. Nothing to convert there; a door in the bowl concourse would be a venue-file change.

Mechanism added: the park restroom is reached from the city (WC entry `venue: 'city'`; a 'scene' handler registered at 'ready', after bladder.js's
wireCity, leads the city's "Public restroom" doors into `park:wc`; leaving lands you at the pavilion door you used; nav graph `city <-> park:wc`).
A tappable story piece: item `{ tags: ['wcstory'], story: { label, who, lines } }`. No intro or venue file was edited: the airport restroom uses the
sign stand bladder.js already places in the terminal (2, 21.5) and on Concourse B.

Also in batch 4 (nearly free, data only): the inner rooms of buildings that already had a real restroom now lead into it too: the hotel's restaurant and
bar (`hotel:wc`), the Natatorium's changing room (`natatorium:wc`, its way out now reads "Back to the pool"), Cinema screen 1 (`cinema:wc`, "Back to the
cinema") and the planetarium (`observatory:wc`). Mechanism: a room of a building's `also` list that has no restroom of its own on the first pass is left
to bladder.js (it adds its sign stand), and the late 'room:build' handler then leads that stand into the room. (A first try set scene._wc = 'real' on
that empty first pass, so bladder.js added nothing and the hotel restaurant and bar briefly had no restroom at all; caught by the survey below, fixed.)

### What remains
Survey of every room in the build (each room built, every restroom door / sign looked at): **159 rooms have a restroom door, 159 lead into a real
restroom, 0 still fade out.** (Before batch 4: 71 real, 88 fading.) Rooms with no restroom door at all (homes have bathrooms; residential lobbies,
street stations, the plane, the Arena bowl and backstage) were not given one: adding a door there would mean editing a venue file. Later, if wanted:
signature rooms for some of the 48 pub venues / 20 lobbies (the plan table above keeps the one-line ideas), and city folk in restrooms.
