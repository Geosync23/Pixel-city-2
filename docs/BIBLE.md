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

**Time**: day/night cycle; 7-day week; a month is 14 days and each of the 4 months is a season (spring, summer, autumn, winter); 1 game minute ≈ 1 real second by default.
**Needs**: hunger, energy, hygiene, fun, social, fitness(+money). Buy groceries -> carry home -> store in fridge -> cook; or eat out.
**Social**: talk to anyone; named NPCs with routines become friends; invite over / get invited; phone contacts & messages.
**Crowd**: faked ambient population (not agent-based) — walkers, cars, park-goers, queues; density by district/time/weather.

**Story**: you've just moved to Maple Bay. Intro: your plane lands, you start at the airport drop-off curb, the phone
tutorial teaches you to call a cab, the cab drives you across the city to your starter apartment.
Your older sibling already lives here (Maplewood), grandma lives in Old Town, an old friend from school works in the
Arts Quarter. Every couple of days a small story beat arrives on the phone (visit, dinner, a favour) — short, warm, optional.

## Direction update (from the owner)
- **Modern American city** with lots of diversity (people of every background, age, body type, style; varied neighbourhoods and food).
- **Downtown** is a showpiece: glass skyscrapers with lots of cool detail. A **River Walk** — a pedestrian riverside park promenade
  (boardwalk/paving, trees, benches, lamps, food carts, buskers, footbridges) runs through the city next to downtown.
- **Camera is zoomed in** and cannot zoom out much: the world must reward close looking — dense detail, parks, interesting shops,
  things happening everywhere (moving cars, buses, pedestrians, animals, events).
- Characters are the high-resolution element (~22 px tall, expressive pixel art); the world stays chunky pixel art, rich in detail.

## Direction update 2 (from the owner) — a narrative adventure inside a free-form life sim
- **You cannot drive.** You get around on foot, bus, light rail and taxi. Places and errands exist to pull you out into the city.
- **Opening = inside the airport.** You start seated on the plane; everyone stands and files off first, then you. Jet bridge -> a long, busy
  CONCOURSE (many gates full of waiting passengers, moving walkways, shops, a water feature, flight boards) -> a little TRAM -> the MAIN
  TERMINAL (baggage claim carousel where you collect your bag, arrivals hall, a few shops, big modern-international-airport feel) ->
  outside to the curb -> tutorial: call a cab on your phone -> ride to your first apartment while the story is told. The airport must feel
  as alive as the city streets.
- **Big showpiece interiors** (expand, don't rework): the airport; a SHOPPING MALL (an L-shaped concourse with ~10 small enterable shops);
  CENTRAL STATION (grand modern-European hall with a glass dome); a skyscraper OBSERVATION DECK (with a story moment up there); a few more
  unique places with reasons to visit (designer's choice, e.g. museum, botanical conservatory, hotel lobby/rooftop bar, arcade, laundromat, pharmacy).
  Several GROCERY STORES of different sizes near the starter homes (one really detailed supermarket). Not every building is enterable — and the
  player must be able to tell at a glance which ones are (clear door markers).
- **Needs drive errands ("chains")**, not just meters: being hungry means groceries, which means a trip to the store, carrying them home, cooking.
  Every need should have a chain that sends you somewhere. Add a few more interesting needs beyond the standard ones:
  **Comfort** (how nice/clean/cosy home is: furniture, decor, cleaning supplies), **Outdoors** (fresh air: parks, river walk, lookout; drains indoors),
  **Inspiration** (culture and novelty: museum, cinema, books, music, observation deck, discovering new places). Consumables that run out
  (food, toiletries, cleaning supplies, clean laundry until you own a washer) create natural errands.
- **Opportunities & Appointments** are the names of the "quest" systems (never "missions"): Opportunities are optional things that pop up
  (from needs, people, places, events, jobs, the story); Appointments are scheduled ones in the planner. A stronger MAIN STORY — a gentle
  narrative adventure advanced at the player's own pace — leads through all the showpiece places while the life sim stays free-form.
- **Housing ladder**: cool apartments and houses to slowly work up to. **Workplaces**: every job's workplace is interesting and enterable.

## Direction update 3 — 15 more jobs (25 total), each with an interior workplace
gate agent (airport concourse), baggage handler (airport baggage hall), station agent (Central Station), retail associate (shopping mall),
museum guide (city museum), florist (botanical conservatory / flower shop), radio DJ (radio station studio), teacher (Maplewood school classroom),
vet assistant (vet clinic), sous-chef (The Gilded Gull kitchen), hotel concierge (downtown hotel lobby), software developer (tech startup loft),
reporter (Maple Bay Gazette newsroom; assignments around the city), hair stylist (salon; the player can also change hair there), firefighter (fire station).

## Direction update 4 — jobs have stories
Every job (all 25) gets: its own NARRATIVE ARC with a small cast (boss, coworkers, regulars) that unfolds across shifts and promotions (short scenes at
work, messages, occasional off-shift beats), UNIQUE MECHANICS (short tactile interactions; a few jobs get a real mini-game), UNIQUE MOMENTS (one-off
events) and UNIQUE AMBIENCE. The player can always SHOW UP AND SKIP a shift (clear choice at clock-in: "Work the shift" / "Skip to the end") and still gets
credit and pay for attending.

## Direction update 5 — deeper relationships, vignettes, romance
- Keep the main narrative; add IN-DEPTH relationship arcs for each family member and friend. Format: VIGNETTES — they invite you out for an evening / to hang out,
  and during it a piece of what's going on in their life unfolds; many such nuggets connect over time into a larger personal story per character.
  Writing: more verbose, more human, some genuinely emotional and real. Choices are remembered.
- PACING: a constant gentle stream — a few small narrative bits per day (texts, run-ins, favours) and a deeper vignette every few days — never dominating;
  the game stays free-roam and everything waits for the player.
- EXPANDED SOCIAL INTERACTIONS: more verbs that depend on context/history; visible relationship meters; friendship and romance as separate tracks.
- ROMANCE: meet people anywhere (introduce yourself to strangers) or via a DATING APP (phone + computer: profiles, matching, setting up dates). Interacting a certain
  way (flirting, choices) takes a relationship down the romantic path: ask on a date (appointments at real venues), dating -> partners -> ask to MOVE IN (partner lives
  in your home with a routine) -> PROPOSE and get MARRIED (a wedding scene). Children: maybe later, not now.

## Direction update 6 — interests, mechanics everywhere, physical shopping, hundreds of goods, home design
- A FEW unique needs (not many). FUN is split into INTEREST categories chosen at character creation (gaming, music, art, reading, sport, cooking, nature, tech,
  fashion, film...): activities matching your interests satisfy far more.
- EVERY ACTIVITY HAS A MECHANIC where it makes sense (video games, computer/browsing, cooking, instruments, painting, exercise, social things): small simple
  minigames, lots of them. Where a meter/progress bar remains it must have a good ANIMATION and visible IMPACT when done (e.g. unpacking: boxes open and vanish and
  their contents visibly appear in the room).
- SHOPPING ETHOS: fewer menus, more one-to-one interaction — walk up to a rack/shelf/display and click the actual item to buy it. Menus only where natural.
- HUNDREDS of consumer goods: decor AND functional things that lead into activities (lamps you switch on/off, a bicycle or skateboard kept in the apartment and taken
  out to ride, instruments, consoles, hobby gear...). Almost everything in the home is interactive. Several FURNITURE STORES, PLANT STORES (one in the mall), many
  CLOTHES SHOPS, electronics, hobby shops. ONLINE ORDERING (phone/computer) with real multi-day shipping: the parcel arrives and you unpack it.
- HOME DESIGN MODE: a real decoration mode (also launched from a phone app): move/rotate everything, hang wall decor, big catalogue.
- CITY: keep the layout (the owner loves it). Add enterable places mainly by CONVERTING existing non-enterable buildings (ground floor becomes a storefront, or swap the
  building for a fitting one); expand at the edges if needed. Never remove what exists.
