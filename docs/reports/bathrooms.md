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
| SkyDeck lobby (skydeck_lobby) | A door | small street-level cloakroom loo behind the ticket desk, or a sign "Restrooms on Level 52" and the lobby door removed (owner?) |
| City Hall upper / records / council | B | point all City Hall restroom doors to the one washroom (one line per room in WC), or a small clerks' loo with a filing-cabinet towel stack |
| Bayside Clinic (clinic) | A sign | clinical white tile, grab rails, sample hatch, hand-sanitiser pump |
| The Gilded Gull (restaurant) | A sign | dark-red flock wallpaper, gold taps, nautical sconces, a ship-in-a-bottle on the shelf |
| Pier 7 Freight (warehouse) | A door | staff washroom: concrete, steel trough sink, hi-vis vests on hooks |
| Hartwell & Finch (office) | A door | corporate grey, motion-sensor taps, a passive-aggressive "please flush" note |
| Bay Realty & Trust (bank) | A sign | marble-lite, brass, a "for staff and customers" plaque, vault-door styled stall |
| Thread & Co. (clothing) | A sign | fitting-room-style loo with a full-length mirror and a mannequin torso |
| Iron Maple Gym (gym) | A door | locker-room loo: benches, rubber floor, protein-shaker on the sink |
| Maple Bay Galleria (deptstore) | A door | mall restroom block off the corner WC doorway (already drawn), baby-change, long mirror wall |
| Grand Maple Hotel (hotel, events, guest floor) | B (2 doors) | Art-deco lobby powder room: velvet stool, attendant's tray, fresh flowers |
| Central Station (central_station) | A sign | big tiled station loo with turnstile, departure board, tile mosaic of the old steam train (door hook only in stations.js) |
| Rise & Shine Bakery (bakery) | A door | flour-dusted staff loo, a sack in the corner, bread-shaped soap |
| Dog-Eared Books (bookstore) | A door | tiny loo lined with paperback shelves ("take one, leave one") |
| Bean & Gone (cafe) | A sign | plant-filled loo, chalkboard wall with customers' doodles |
| Lucky Corner (cornerstore) | A sign | cramped stock-room loo, cases of soda stacked to the ceiling |
| Noodle Lantern (ramen) | A sign | paper lanterns, wooden tub-sink, slippers at the door |
| FreshWay Market (grocery) | A sign | customer loo past the dairy cold room, rolling bins, recycling posters |
| The Orpheum (cinema) | A sign | red velvet + film-poster frames, popcorn on the floor, an usher's torch on the hook |
| Slice of Heaven (pizza) | A door | green-white-red tiles, a flour-sack bin, pizza-peel towel holder |
| The Blue Heron (bar) | A sign | dim bar loo, band stickers everywhere, a condom machine replaced by a gumball machine |
| Maple Bay Public Library (library) | A door | "cleanest in the city" (ambient lines say so): silent sign, book-return slot for hand towels, reading lamp |
| ZipParcel Depot (courier) | A door | staff loo with a parcel-scale, cardboard everywhere |
| Museum of Maple Bay (museum) | A door | gallery loo with a museum-label next to the hand dryer ("Untitled, 1998") |
| Maple Bay Aquarium (aquarium) | A door | blue tiles, a fish-tank wall over the basins |
| Symphony Hall (concerthall) | A door | intermission queue, gilt mirrors, programme left on the sink |
| Lantern Playhouse (playhouse) | A sign | backstage-style: bulb-ringed mirror, costume rail |
| Fire Station No. 2 (fire_station) | A door | crew washroom, boots by the door, red tiles, a brass pole poster |
| Maplewood Elementary (school_classroom) | A sign | low kid-size basins, colourful tiles, hand-wash song poster |
| The Maple Bay Gazette (gazette_newsroom) | A door | headlines papered on the walls, a typewriter on the cistern |
| Bay Radio 98.6 (radio_studio) | A sign | "ON AIR - QUIET FLUSH" light, foam acoustic tiles |
| Observatory (observatory) | A sign | star-map ceiling, dark-adapted red night light |
| Conservatory (conservatory) | A sign | greenhouse loo by the gift shop (lines say so): ferns, a watering can, glass roof |
| Bay Fish Hall (fishmarket) | B (2 doors) | wet-floor fish-market loo, rubber boots, fish-scale tiles, ice-machine hum |
| Gull Point Lighthouse (lighthouse) | B | narrow round room under the stair, porthole, ship's lamp |
| General Post Office (post_main), Downtown Postcard Counter | B | stamp-mosaic tiles, a "first-class" brass plate, letter-rack towel holder |
| Office lobbies (lobby:1-24, lobby:48, 20 rooms) | B | one line each, by the building's theme: BayJet (aircraft-lav), Harbor Authority (ship's head), Ironside Foundry (cast-iron), Meridian Twin Towers (glass + chrome), Garnet Exchange (red stone), Harbor Trust (banker's marble), Kessler Block (old brick), Tidewater Insurance (beige corporate), Lanternworks (loft industrial), Northgate (municipal green), Carrow & Finch (law-firm walnut), Bayline Telecom (90s teal), Pelican Mutual (pelican tile), Quay Street Labs (lab-white with eyewash), Gas & Light (vintage gas lamps), Silver One (silver mirrors), Hollis Price (chambers oak), Brightwater Health (pastel clinic), Atlas Maritime (map mural), Shed 5 Works (shipping-container loo) |
| Maple Bay Arena (arena) | C (2) | stadium restroom block: long trough of basins, team colours, a queue at half-time |
| City park pavilion (city) | D | park pavilion loo: pine soap, timber walls, wildflower posters (a real room behind the pavilion door) |
| Maple Bay Natatorium (natatorium, leisure) | B | changing-room loo, tiled benches, chlorine-blue, flip-flops |
| Maple Bay University Commons (university) | B | student loo, flyers + graffiti equations on the stall doors |
| Home-goods stores (goods:timber, fjord, bellwether, lumen, copper, attic, warp, loam, voltaic, spoke, kestrel, sleepy, nord) | A door | each store's loo is its own showroom: Timber (plywood + tool rack), Fjord (pale birch), Bellwether (department-store marble), Lumen (lamp-lit), Copper Pan (copper basin), Gilded Attic (antique washstand), Warp & Weft (textile-lined), Leaf & Loam (plants), Voltaic (sensor everything), Spoke & Strum (bike-hook), Kestrel & Pine (cabin), Sleepyhead (fluffy towels), Atelier Nord (minimal concrete) |
| Clothing stores (cs_hollowell, nightjar, juniper, secondwind, sole, tidepool, outfitters, otterline, brim, lantern) | A door/sign | tailor's mirror (Hollowell), neon-black (Nightjar), knit cosy (Juniper & Rye), thrift-shop mismatched (Second Wind), shoe-box shelves (Cobble & Sole), beach-hut (Tidepool), outdoor-gear (Saltline), boathouse (Otterline), hat-stand (Brim & Buckle), kids' pastel (Little Lantern) |
| Public places pub:1-61 (55 shops / cafes / restaurants) | A door/sign | one each from its trade: Tea Garden (bamboo), Heron's Table (rustic farm), Bloom & Paper (flowers), Coast Gas Mini Mart (gas-station loo with key on a hubcap), Maple Brewing Taproom (barrel sink), Night Owl Coffee (dark + owl print), El Farolito (talavera tiles), Little Hanoi (bamboo + lanterns), Flour & Fig (fig-tree mural), Marigold & Main (marigold wallpaper), Cedar & Olive (olive-wood), Silver Spoon Diner (chrome diner #2, NOT Dot's look: blue-white), Addis Table (woven baskets), Halo Donuts (pink sprinkles tile), Lacquer Lounge (nail-bar pink + gold), Rind & Wheel (cheese-cave stone), Paper Lantern Books (paper lanterns), Baker House Bagels (subway tile), Suds & Bubbles (laundromat: washer as the sink stand), Otis & Sons (barber-pole stripes), Jade Rabbit (jade green), Nine Dragons (red + dragon screen), Marchetti's (deli-counter tiles), Kettle & Crumb (kettle collection), Old Post Stationers (letterpress posters), Bubbling Lantern (steam + lanterns), Post Corner Pharmacy (white + sample shelf), Paws & Whiskers (dog bowl by the door), Seoul Ember (charcoal + K-pop poster), Paper Crane Izakaya (paper cranes), Birch Lane Pantry (jars), Wax & Wane / B-Side / Spin City (record-sleeve walls, three different eras), Black Cat Ink / Ink & Ivy Tattoo (flash-sheet walls), Ink & Ivy Vintage (clawfoot tub as planter), Sunnyside Cafe (sunflower yellow), Bay Thread Co-op (patchwork), Tidewater Gallery (white cube with one framed loo roll), Studio 11 (paint-splattered), Ink & Ivy Comics (comic-page wallpaper), Salt & Co. Provisions / Chandlery (ship's chandlery brass), Cold Storage Boba (ice-blue), Cannery Coffee (tin-can lamps), Rope Works Fish & Chips / Smokehouse (rope + smoke-stained timber), Harbor Tea & Spice (spice-tin wall), Mama Opal's (family photos), Elm House Bakery (elm wood), Tin Robot Toys (toy robot on the cistern), Bloom & Paper Riverside (river view window) |
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
- Size: the same tree built without the three new files 15,082,325 B, with them 15,106,898 B = **+24.6 KB** (budget 50 KB).
- `node tools/restrooms_check.mjs` (390x844, touch, New Game + `G.intro.skip()`, every step by a finger tap on the canvas; rooms are bigger than the
  phone screen so the script walks there by tapping the floor first, as a player does): **all passed, 0 page errors**:
  for each of the three: door present and leads to the room; tap -> walk -> inside; Toilet: activity runs, player hidden, stall door shut, bladder
  17-18 -> 100, door open again after; Wash hands: hygiene +8.8..+8.9; bladder full -> "You do not need to go right now." and no visit; way out ->
  back in the venue at exactly the door spot; diner: leaving unwashed -> the nudge once; night (22:30): in, toilet, out. Guide: need goal from the
  diner -> arrow "The restroom" on the door -> inside "A free stall" -> goal ends on the seat. A home bathroom (Juniper Court): in, toilet, bladder 100.
- navcheck / nightcheck / perf --verify: see the end of this file.
- Screenshots looked at, full size, by the worker: `out/shots/bath_<diner|skydeck|cityhall>_{0_door,1_room_day,2_inuse,3_wash,4_back,5_room_night,
  6_inuse_night}.png`, `bath_guide_1_venue.png`, `bath_guide_2_room.png`, `bath_home_inuse.png`; wide views of each whole room at 1200-1400 px
  (`out/shots/v_*.png`) and the asset sheets (`out/gallery/wc*.png`).

## 7. Not tested / known gaps

- The SkyDeck LOBBY still has its old fade-out restroom door (a different room, street level). Question for the owner below.
- City Hall's other floors (council, records, upper), and every other venue, still use the old fade-out until their batch.
- No NPCs use or queue for the stalls (crowd files were off limits); all stalls are free. The stall interactable does not check "occupied by someone else".
- Leaving in the middle of a toilet visit is the activity's own Stop (tested only through the code path, not by tapping Stop).
- Save + reload while standing inside a restroom: by code it lands at the venue's street door (title.js rule for venues); not played.
- Not tried on iOS Safari; no new regex syntax (the lookbehind grep is 0).
- The navigator's "nearest restroom" rows are unchanged (they name the venue, which is right); Map / Wander shortcuts not re-played.
- At phone zoom the bigger rooms do not fit the screen (like every room); the arrow and the walk work.

## 8. Questions for the owner

1. SkyDeck lobby: give it its own small street-level restroom (a 4th room), or take its door away and send people up to Level 52?
2. Should all of City Hall's restroom doors (upper floor, records, council) lead to the one grand washroom, or should the offices upstairs get a plainer one?
3. Would you like city folk in the restrooms (a queue at the Arena at half-time, someone at the basin), or keep them quiet?
