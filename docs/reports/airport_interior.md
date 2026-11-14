# Airport interior + new opening — notes (src/scenes/rooms/airport.js, _airport_life.js, src/scenes/airtram.js, src/sim/intro_airport.js, art src/art/airport_interior/)
- Rooms: `airport:plane` 22x5, `airport:concourse` 64x14 (gates B1-B6, walkways, shops, pond), `airport:terminal` 40x24 (tram platform, 3 carousels, customs, arrivals, fountain atrium, desks, exit to city `spawn:airport`). All `noCrowd` with their own crowd/walkers (`_airport_life.js`).
- Intro chain: arrival_plane_cinematic -> cabin -> concourse -> tramride -> baggage -> curb -> (existing). State in G.state.intro.ap. Clock runs 0.12x during these steps.
- `G.airtram.ride('terminal'|'concourse')`; city terminal doors enter `airport:terminal`.
- Job station tags present: gate_desk, boarding_door, baggage_carousel, bag_cart, lost_found, info_desk, oversize_desk, rental_desk, exchange_desk. Scene hooks: scene.gate, scene.claim[i], scene.belts, scene.pa(text).
- Art ids `furn.airport.*` (cabin.*, tram.*, window, seats, gatedesk, gatesign, gatedoor, totem, walkway, fids, sign, decal, column, partition, barrier, shop.back/shop.counter (kind coffee|news|noodle|dutyfree|exchange|rental|lostfound|oversize|souvenir|info), island, fountain, pond, raincurtain, tree, planter, greenwall, mobile, carousel, bag, customs, exitdoors).
- Reusable pattern for big lively halls with lane walkers: `_airport_life.js`.
