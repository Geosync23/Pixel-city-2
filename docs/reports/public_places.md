# Public places pass — notes (src/sim/public_places.js, src/scenes/rooms/generic_venues.js, src/data/venues_extra.js; phone map edited in src/ui/phone_map.js)
- 61 existing buildings converted in place: 53 enterable (`door:pub:<n>` pois, rooms `pub:<n>`) + 8 walk-up windows (`stall:pubw:<n>` pois). Each instance is its own venue record cloned from a generic type
  (room id = venue id, so shop window, eat-in, crowds, map pins, hours, welcome glow all work unchanged).
- 12 room templates x 2 layouts, seeded variation: cafe, bakery, diner, eatery (by cuisine), restaurant, bar, boutique, books (records/comics), bodega, grocery_m, retail (hardware, pets, toys, florist, pharmacy, stationery, art, gallery, cheese), service (barber, salon, nails, tattoo, laundry: paid timed service).
- Venue type ids `gen_*` in VENUE_BY_ID (exports GEN_TYPES, registerInstance(typeId, id, name, district, extra)). 50 new items `gen_*` (40 dishes, 10 gifts) with placeholder icons.
- Groceries near starter homes: Marchetti's Delicatessen & Grocery (Old Town, medium), Salt & Co. Provisions (Harbor bodega), Bay Thread Co-op Market (Arts, medium), Birch Lane Pantry (Maplewood bodega, a converted house), Coast Gas Mini Mart (Railyard). FreshWay + Lucky Corner unchanged.
- `G.publicPlaces`: list(), get(id), byDistrict(), census(), nearest(type, x, y) (type: gen type | template | 'food' | 'shop' | 'service' | 'grocery'), groceries(), debugRoom(typeId, seed).
- Phone map: street names along roads (by zoom), district labels, addresses in place cards, searchable "Streets" list.
- Duplicate "Discovered" toast worked around (same-named places within 30 units are discovered quietly). Cause: generator emits `lm:<room>` landmark twins that places.js registers.
- Gaps: deptstore / hotel / museum / theatre / arena etc. still have no rooms; converted buildings keep their facade art; some addresses snap to an odd street (park cafe); Lantern Row walk-ups get a double glow.
