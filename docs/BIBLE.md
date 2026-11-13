# Maple Bay — game bible (decisions; keep short)

**Game**: open-world pixel-art city life sim in the browser. Charm of a toy city, structure of The Sims / inZOI:
live in an apartment, keep your needs up, work one of 10 jobs, ride the train/bus/taxi, shop, eat out, hit the gym,
make friends, follow a light family story. Clean UI: everything goes through your **phone**.

**Look**: 2:1 isometric pixel art, drawn procedurally in code (`src/engine/raster.js`), 16 px per world unit
(2x the reference `reference/Pixel_Station.html`). Warm, saturated, friendly; cool-purple shadows, cream highlights,
1 px dark outlines on silhouettes. Lots of small storytelling detail (signs, awnings, rooftop clutter, laundry, cats).

**Scale** (world units): person 1.4 tall; storey 2.0; door 0.9 wide x 1.6 high; road lane 2 wide; sidewalk 2 wide;
car 3.2 long x 1.5 wide x 1.3 high; bus 8 x 1.8 x 2.4; train car 12 x 2.2 x 2.6. World is about 384 x 384 units.

**City: Maple Bay.** Terrain is NOT flat: the land rises from the harbour (z=0) through terraces to Hillcrest (z up to ~10),
with stairs, ramps, retaining walls, a river with bridges, and an elevated light-rail viaduct looping the city.
Districts:
1. **Downtown** — glass towers, offices, city hall, Central Station, department store, hotel.
2. **Old Town** — brick rowhouses, cobbles, cafes, bakery, bookstore, market street, "Lantern Row" food street.
3. **Harborside** — boardwalk, pier, fish market, seafood restaurant, warehouses/lofts, lighthouse, boats.
4. **Hillcrest** — terraced upscale homes & villas, lookout park, winding stairs. Highest ground.
5. **Maplewood** — leafy suburb: family houses, school, community garden, corner store.
6. **Arts Quarter / University** — murals, theatre/cinema, library, music club, studios, campus green.
7. **Railyard / Industrial** — factory, depot, warehouses, silos, the courier hub.
8. **Central Park & Riverside** — big park, pond, playground, riverside path.
9. **Airport (Maple Bay Intl.)** — at the city edge: terminal with drop-off zone, control tower, runway, planes landing/taking off.

**Enterable interiors** (others are facades): player homes (starter studio in several districts; buyable 1BR, loft, house,
villa, penthouse), friends'/family homes, grocery store, corner store, cafe, bakery, diner, ramen bar, pizza place,
fine restaurant, gym, clothing shop, furniture & electronics shop, bookstore, library, office, clinic, bar/club,
cinema, courier hub/warehouse, bank/realtor, train interiors (cutaway).

**Jobs (10)**: barista, grocery clerk, line cook, office analyst, courier, fitness trainer, librarian, nurse,
dock/warehouse worker, bartender. Each has a workplace interior, shifts, pay, promotion levels. Jobs are found on a computer.

**Transit**: elevated light-rail loop with ~7 stations (ride = cutaway train interior with the city scrolling by);
bus routes with stops (ride in-world); taxis (hail on street or call from phone; ride in-world; costs money).

**Time**: day/night cycle; 7-day week; 4 months = 4 seasons (spring, summer, autumn, winter), 7 days... (see data).
**Needs**: hunger, energy, hygiene, fun, social, fitness(+money). Buy groceries -> carry home -> store in fridge -> cook; or eat out.
**Social**: talk to anyone; named NPCs with routines become friends; invite over / get invited; phone contacts & messages.
**Crowd**: faked ambient population (not agent-based) — walkers, cars, park-goers, queues; density by district/time/weather.

**Story**: you've just moved to Maple Bay. Intro: your plane lands, you start at the airport drop-off curb, the phone
tutorial teaches you to call a cab, the cab drives you across the city to your starter apartment.
Your older sibling already lives here (Maplewood), grandma lives in Old Town, an old friend from school works in the
Arts Quarter. Every couple of days a small story beat arrives on the phone (visit, dinner, a favour) — short, warm, optional.
