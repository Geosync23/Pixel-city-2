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
- Shopping clarification: KEEP the buy menu for stalls/carts/counters and all online shopping. Larger stores offer BOTH: physical browsing (click an item on a
  rack/display -> character holds it / basket -> pay at the counter) and the buy menu at the counter. GROCERY STORES are big with sensible aisles; each shelf
  SECTION is clickable and opens a small picker for that section's items (not every product rendered individually) -> basket -> checkout. Other shoppers active.
  Everything displayed must be buyable; layouts must make sense.

## Direction update 7 — performance venues (showpieces)
CONCERT HALL (orchestra walks on, tunes, plays a short piece; animated sections; synthesised music), MOVIE THEATER (a ~1-minute animated pixel short actually plays on the
screen; several films in rotation), THEATER (a short stage show: curtain, sets, actors, lighting). All share one flow that is fully built, animated and simulated:
buy a ticket -> the audience pours in and sits -> you sit with them -> the show happens -> applause -> everyone leaves. Simple, but real.

## Direction update 8 — City Guide app + lots more to do
A phone app "City Guide": a VISUAL guidebook (like a tour guide book) with categories (Eat & Drink, Shopping, Music & Nightlife, Arts & Culture, Outdoors, Sport & Fitness,
Sights, Services, Getting Around): every place with picture, blurb, hours, address, waypoint/cab buttons; a WHAT'S ON list (today / this week; add to planner); and a
"Things to try" list of activities so every system is discoverable (it is also the tutorial reference). Fill it with new things using existing spaces: small LIVE-MUSIC
venues in a few bars/clubs (stage + rotating bands), OUTDOOR CONCERTS at the park bandstand, open mic, jazz brunch, night food market on Lantern Row, outdoor movie night
on the River Walk, pier fireworks, farmers' market, gallery openings, pickup basketball / 5K fun run, chess tournaments, trivia + karaoke nights, stargazing at the
Hillcrest lookout, seasonal festivals. The lead is asked to invent a good list beyond what the owner dictated.

## Direction update 9 — trip planner; future city expansion
- Any destination picked on the map offers Take Cab, TAKE BUS and TAKE TRAIN; transit options show which stop/station to board at and where to get off.
- FUTURE PROJECT (not now): make the city 50-100% larger with new districts and interesting areas. The lead may already expand at the edges when new content needs room.

## Direction update 10 — post offices
Post offices with interiors (a main one downtown + small branches): queue line, counters with clerks, PO boxes, packing table. SENDING A PACKAGE requires going there: pack,
wait in line with other customers, pick destination/speed, pay. LETTERS are sent from home (mailbox) or street mailboxes. Orders/gifts arrive at home; missed/oversized parcels
may need collecting. Tie into the story: an Opportunity to send something back to where you came from (care package, returning a keepsake); family can mail things to you.

## Direction update 11 — playtest notes (2026-11-14 evening). Praise: "Airport interior is incredible."
QUICK FIXES: moving walkways keep right (US style); deboarding: stand up when the queue reaches your row, not after everyone; plane cabin shell must look like a plane, not a box;
station stairs must work; train requires a flat-fee ticket; traffic-light arms/street signs show the wrong/duplicate names ("MAIN and MAIN"); train flickers passing overhead; rename the character Jules;
relationship meters fill too fast + daily cap; sit on ANY chair; talking requires pressing the Talk button (tapping people while walking is accidental); backpack items need real icons, not colour squares;
tap a goal -> waypoint; tap a need -> nearest place that satisfies it.
NAVIGATION: in the Map app, "what do you need / want to do?" (food, groceries, work, home, fun...) -> nearest suitable place + how to get there by foot/bike, bus or train; waypoints let you choose the mode.
PLANNER drives the Goals list (today's appointments show in the quick list).
UNIQUE INTERIORS: every restaurant/interior must be unique — no more repeated rooms with different signs. MANY more enterable buildings: apartment buildings = lobby only; office buildings = lobby only (unless you work there).
CLOTHES & HAIR: an absurd amount — only ~16 starting outfits and a starter set of hairstyles in the creator, HUNDREDS of clothing items in stores (each store different stock), many more hairstyles at barbers/stylists (each different).
FULL CLOTHING SYSTEM: change clothes daily at a dresser/wardrobe; worn clothes go in a hamper; take the hamper to do laundry (laundromat or own washer); dirty clothes can't be worn until clean. More fun realistic systems like this.
TOILETS + a BLADDER/bathroom need. In apartments the BATHROOM IS ITS OWN ROOM.
CHARACTER DEPTH: traits + more skills; more activities to get skilled at, each with an in-world mini-game/mechanic (no abstraction).
UNIVERSITY: a small campus (quad, lecture hall, commons) where you enrol and take classes.
APPS: an APP STORE on the phone — lots of apps covering the game's systems, new ones "release" with a notification instead of silently unlocking; a PROPERTIES browser app (find/rent/buy better homes); a LIVING TIPS app explaining systems
(laundry etc.), plus in-game tutorials and characters mentioning them; the THINGS TO DO guide app listing ALL content (every shop, arcade game, activity, place).

## Direction update 12 — big city events (build later)
5-6 large staged events sprinkled through the first six in-game months (a month = 14 days): street festivals and parades that physically happen in the city — route/street closed to traffic,
floats/marching band/performers, dense crowds, stalls and activities, a possible story moment; listed in the guide app with "Add to planner". Candidates: Spring Blossom Parade (Main St),
Lantern Row Night Festival, Harbor Day (boat parade + pier fireworks), Summer Street Fair / Pride on the River Walk, Autumn Harvest Festival (Central Park), Winter Lights Parade + tree lighting (City Hall Plaza).
- Cadence (owner: "scale it proportionally"): game year = 56 days (4 x 14-day seasons); "first six months" = first half-year = spring + summer (28 days). So ~one big event every 5 game days:
  5-6 in spring + summer, the same rhythm continuing through autumn and winter (so the year has ~10-11, with seasonal ones in their seasons).
- FINAL cadence (owner msg 41, supersedes the line above): the 5-6 big events are SPREAD ACROSS THE WHOLE YEAR (56 days) — about one every 9-10 days, at least one per season
  (e.g. Spring Blossom Parade; Lantern Row Night Festival; Harbor Day + Summer Street Fair; Autumn Harvest Festival; Winter Lights Parade).
- HARD RULE (owner msg 42): big events are DYNAMIC and happen IN THE WORLD — never cutscenes, never separate locked-away scenes. Parades move along real streets (traffic rerouted), crowds line real
  sidewalks, stalls stand in real plazas; the player walks through freely and can join, watch or ignore.

## Direction update 13 — unique homes; big stores for home goods; map expansion OK (owner msg 64, new account)
- Every player home is UNIQUE: the four starter studios must differ from each other (today they share an 8x7 shell family), and every property you can rent or buy (Nestly) has its own layout,
  size, shape, views, fittings and character — no repeats. More properties can be added as long as each one is unique (new ones may live in the new lobby buildings).
- Wave D (goods/home) needs MANY interesting stores to buy home goods: a big-box home-improvement store (warehouse aisles, lumber, paint mixing, garden centre), department stores (several floors/sections),
  several furniture showrooms of different styles, plant nursery, kitchenware, lighting, rugs/textiles, electronics, thrift/antiques — each physical (pick from displays, pay at the counter) and different.
- Expanding the map is allowed whenever it makes sense (owner: "please feel free"): new districts/lots at the edges for big-box stores, the university, a museum etc. Never re-lay-out what exists.

## Direction update 14 — SIGNATURE INTERIORS = the big showpieces (owner msg 66)
"Signature interiors" means the special, unique, big places like Symphony Hall. Done so far: airport terminal + cabin, Central Station, Maple Bay Galleria mall, SkyDeck, Symphony Hall, cinema, Lantern Playhouse.
Showpiece track (one big worker each, highest priority for free slots after Wave A; each with in-world activities, crowds, a story hook and a Wander guide entry):
 S1 Botanical Conservatory (existing bld.civic.conservatory) — glass palm house, biomes, koi pond, seasonal flower show.
 S2 Museum of Maple Bay (NEW building — the old museum became Symphony Hall; new lot at the map edge or Arts district) — natural history hall with a skeleton, art wing, city history, special exhibitions.
 S3 Observatory (existing bld.civic.observatory) — dome, telescope at night, planetarium show.
 S4 Grand hotel (NEW or converted downtown tower) — lobby, concierge, restaurant, rooftop bar.
 S5 Arena (existing bld.civic.arena) — basketball games + concerts with crowds, concourse food, scoreboard.
 S6 Aquarium (NEW, harbor) — tunnel tank, touch pool, jellyfish room.
 S7 Harbor fish market hall + lighthouse climb (existing). S8 City Hall rotunda (existing; story/civic). S9 Natatorium / public pool (existing bld.civic.pool). S10 University (already planned 2j; existing bld.arts.unihall).

## Direction update 15 — navigation arrow follows you everywhere (owner msg 72) — TOP PRIORITY for the next worker
- The trip chooser (walk/train/bus/cab estimates) is "perfect" — keep it.
- The waypoint arrow must NEVER disappear: when the target is off-screen it sits at the screen EDGE pointing the way; it works in every scene (city, Central Station hall, platforms, airport, any interior),
  pointing to the exit/door/stairs that leads toward the next leg, so the player goes "from space to space".
- Every mode is guided end to end: walk to the cab / bus stop / station entrance -> through the station to the right platform -> board -> ride -> get off -> walk to the destination door. No leg relies on text notes alone.
- On a train or bus: a red arrow marks your station/stop on approach, and a clear "This is your stop" notice pops up (sound + banner). The player still gets off themselves.

## Direction update 16 — cooking: a ton of recipes; ingredients live in the kitchen (owner msg 77)
- Ingredients are never carried around at home: they live in the KITCHEN (fridge + cupboards). Shopping bags empty themselves into the kitchen when you come home. DONE (lead, Stage 15c).
- A new game starts with a kitchen you can cook from on day 1. DONE (STARTER_PANTRY).
- A TON of recipes (target 100+, from 18): breakfasts, sandwiches, salads, soups, pastas, rice bowls, stir-fries, curries, tacos, roasts, baking, desserts, drinks/smoothies, world cuisines matching the city's restaurants;
  more ingredients sold across the groceries/markets/delis; every meal with its own icon; skill tiers 1-10; recipes learned from books, friends, restaurants and the story as well as known from the start. QUEUED: next free worker slot.

## Direction update 17 — the Aquarium must be excellent (owner msg 85)
"Really make the aquarium really excellent and detailed. Sea turtles too among many other things!" Sea turtles are a headline (a turtle lagoon with named individuals of several species, feeding, a hatchling nursery, turtles in the tunnel,
the rescue-and-release chain). 50+ distinct animated species with ID plaques and a logbook; rich detail (caustics, bubbles, kelp, night look); more to do (keeper talks, touch pool game, adoption board, release event). Sent to the S6 worker mid-run.

## Direction update 18 — wave order (owner msg 91)
- Wave B: 2i clothes/hair/laundry | 2j traits/skills/in-world mini-games | post offices.   (the university moved out)
- Wave C (was D): 4c goods + MANY home-goods stores (big-box home improvement, department stores, furniture showrooms; map expansion OK) | home design + shipping | 4 new needs + Opportunities | 5 unfinished art (building sets, props, terrain/water, audio, weather, title/creator).
- Wave D (was C): 2k big city events | 3 jobs expansion (writer + engine) | 4b relationships / vignettes / romance | the UNIVERSITY campus with classes (moved here from B).
- Wave E: 6 full QA.

## Direction update 19 — the arrow leads to the exact thing, not just the building (owner msg 102)
Arriving at the destination building must not end the guidance. Inside, the arrow continues to the specific target of what the player is doing: the person/counter to deliver to (courier and every job task), the room and seat of a meeting or show
(City Hall council chamber, the theatre's curtains, cinema screen, arena gate and seat), the desk/NPC of an appointment, the fixture of an opportunity or story step, the nearest thing that fixes a need. It chains through as many rooms as needed,
and a short label says what to do there ("Deliver to Rosa at the counter", "Council chamber — take a seat"). Every system that sends the player somewhere declares the final in-room target; an audit covers all existing ones.

## Direction update 20 — festivals spread out (owner msg 106)
Small seasonal festivals and the six big city events never share a day; the calendar is spread so something is on roughly every few days: Spring 6-7 Blossom Festival, Spring 13 Blossom Parade; Summer 3-4 Boardwalk Days, Summer 6 Harbor Day, Summer 10 Summer Fireworks, Summer 13 River Walk Summer Fair; Autumn 2-3 Harvest Fair, Autumn 6 Harvest Festival, Autumn 10 Lantern Night, Autumn 13 Dragon Walk; Winter 5 Winter Lights Parade, Winter 7/9/10/12/13 Winter Lights Market. New events should take a free day rather than stack.

## Direction update 21 — "Sims with a story": Chapters, My Day, findability, more homes (owner msg 107; the lead's design, owner asleep)
The owner's words are in OWNER_MESSAGES #107. What they add up to: the game has a lot of content and no clear way INTO it, and no thrust. Four linked answers.

### 21.1 CHAPTERS — the main story (proper noun: "Chapter"; working title of the story: "The Maple Bay Year")
- Structure like an open-world game: a Chapter is a marker on the map (and a row in the schedule, in its own colour: warm gold) that you walk to and START WHEN YOU ARE READY. Chapters never expire, never nag and are never on the clock. Everything else stays on the clock (work, needs, appointments, events).
  A Chapter may have a natural window ("Nana is home in the daytime", "after dark on a clear night"): outside it the marker says so kindly and nothing is lost. Wording rule: never state mechanics; say "whenever you're ready", "no rush", "it'll keep".
- About 15 Chapters, each 5-12 minutes: character-driven, dialogue-heavy, with choices that colour relationships (not branching plots), one small piece of play each (reuse the mini-game kit and existing systems), and a place the player may not have found yet.
  Only one or two are available at a time; finishing one opens the next after a breath (usually the next morning, sometimes "after you have done X in your own life": got a job, cooked a meal, made a friend).
- ACT ONE = the tutorial in disguise (Chapters 1-5, the first few days; a gentle push): arriving and Nana Bea's dinner (needs: eat, sleep, wash); the family shows you the town (travel, Map, Wander); "what do you do for fun?" (interests: every way to fill Fun, taking up an interest); "you'll want work" (jobs, the schedule); making the flat yours (furniture stores, delivery, design mode). Each teaches by doing with a family member, never by lecture.
- ACT TWO / THREE = the larger story, about FAMILY (expanding the existing cast: Nana Bea, Nora, Theo, Pip, Milo, Dez; canon from the post-office letters: Mom has died, she grew up in Maple Bay, Nana Bea is her mother, Dad and Aunt June are back in Pinehollow).
  Premise for the story designer to develop: you came to the town your mother left. Nobody quite says why she left. Across the Chapters you find her traces around the city (the showpieces are the stages: lighthouse, harbor, City Hall archive, museum, observatory, university, the big festivals), each family member holds one piece and one unhealed thing, and the year ends with the family doing together the thing she never finished. Warm, funny, a little bittersweet; no villains.
- Existing story beats (src/story/story.js, 18 beats) are not thrown away: they are re-housed as Chapters or become smaller optional family moments.
- In the schedule a Chapter shows as "Chapter 4 · Nana's Attic — whenever you're ready". On the map and in the city: a distinct gold marker.

### 21.2 MY DAY — schedule vs. ideas (replaces the Planner's mixed list)
- Two clearly different things. MY SCHEDULE: only what you chose to do, plus the few things life puts there (work shifts, Chapters, family invitations you accepted, booked classes/tickets). IDEAS: everything you COULD add, pulled from all content (events, shows, classes, Opportunities, friends, places for a low need, festivals, sales), ranked for you right now, each with one tap "Add to my day" (pick a time if it needs one).
  Nothing arrives pre-added except Chapters and family/story items. The old calendar tab the owner dislikes is replaced by a simple day timeline (today / tomorrow / this week).
- It gets its own button on the game screen, UPPER-LEFT, the only phone feature with one: "My Day". One tap opens a compact sheet: what is next (with Take me there), the rest of today, 3-5 suggestions, the open Chapter. It drives "what do I do next".
- An early explainer (a Chapter in Act One uses it for real) shows how adding things fills a day.

### 21.3 FINDABILITY — quick tools + first-time windows
- Wander (the guide app) keeps its encyclopedic categories and gains a front page of quick tools: "Fun right now" (what is open and near, by interest), "Something new" (never tried), "Fix a need", "Tonight", "This weekend", and a SYSTEMS shelf: one-tap ways into every system (cook, decorate, clothes, classes, post, jobs, friends, events, opportunities...), each with a two-line "how it works".
- FIRST-TIME WINDOWS: the first time the player touches a system, one short friendly window explains the loop and where it leads (first furniture move: "Shops around town sell furniture; big pieces arrive the next morning"). Once each, dismissible, all re-readable in Tips. Not hand-holdy; the game stays free-form.

### 21.4 MORE HOMES
- More places to live: build real interiors for houses that already stand on the map (several styles and sizes: cottage, bungalow, craftsman, split-level, townhouse, a cliff house), plus a few more apartments for variety (loft, garden flat, a tower one-bedroom). Add, never re-lay-out.
- Moving in offers a choice: PRE-FURNISHED (as designed today, costs more) or FURNISH IT YOURSELF (empty, cheaper, with a starter kit so needs can be met on night one).

### 21.5 Order and team
- Team from now: 2 Fable + 1 Opus QA (owner: one less worker; let running workers finish).
- Order: (1) CHAPTERS story design + writing (a Fable story designer writes the full 15-Chapter plan and scripts as data) and, in parallel, (2) MORE HOMES; then (3) the Chapter engine + map markers + Act One played through, (4) MY DAY, (5) quick tools + first-time windows. The remaining Wave D items (jobs expansion, relationships/romance) follow, shaped by the Chapters' family cast. Full QA wave last.

## Direction update 22 (owner msg 109, 2026-11-15) — more jobs in the new buildings; pay in full; cab cheat
- JOBS grow from 25 to 42: vet assistant and software developer return as jobs 26 and 27, plus 15 more. Place the new jobs in the buildings/rooms made since the original ten wherever possible (showpieces, stores, university, post offices, hotel, arena, City Hall, natatorium, lighthouse, fish market, mall, performance venues, the new job rooms ...), each with cast, nine-beat arc, stations and a play, same standard as J1-J3.
- Buying a home offers PAY IN FULL beside the mortgage.
- A called cab never makes the player wait long: if it is taking too long, it spawns just off screen and drives in. The wait before it gives up is not lengthened.
- Confirmed: full jobs board on the phone; romance rules (date several early, one partner once together, no jealousy, Kit a friend only); first-time window amount stays as it is (lead's reading of "Yes").

## Direction update 23 (owner msg 115, 2026-11-15) — where mail arrives
- No more mail basket inside the home. Apartments (starting with the starter apartments, which get a LOBBY like the other apartment buildings) have a wall of mailboxes in the lobby with the player's own box; houses have a mailbox at the curb by the front path. Letters, parcels slips and bills notices are collected there. Existing lobbies' mailboxes work the same way for rented/bought apartments. Old saves: mail waiting in the basket moves to the mailbox.

## Direction update 24 (owner msgs 111-118, 2026-11-15) — city ambience = real recordings only
- The outdoor city ambience is built ONLY from real recordings (public domain / CC0, sources and licences kept in docs/audio/SOURCES.md). No white-noise or generated bed anywhere, no generated car / footstep / fountain layer. Music and the existing one-shot effects stay.
- Long samples (a minute or more each), several per kind of place (busy street, quiet street, park, harbor, night, rain, airport), mixed so no loop is heard: random entry points, long crossfades between different stretches every 40-70 s, occasional layers that drift in and out (gulls, birds), level and tone following time of day, weather and indoors (muffled). Follows the district the player is in.
- Budget: keep the added download to a few MB; the game stays one file unless the size forces a separate asset.

## Direction update 25 (owner msg 142, 2026-11-15) — pace
- The game clock runs a little slower than one game minute per real second: 0.85 at 1x (`G.CLOCK`). Travel estimates and reminders must follow it.
- The first push to find a job (Nora's text + the to-do) comes on the second day, in the evening.

## Direction update 26 (owner msg 143, 2026-11-15) — controller support
- The game stays touch-first, and gains full gamepad support: move with the stick, interact / talk / enter with one button, every menu, phone app, sheet, dialogue, shop, mini-game and the map usable with a pad (focus ring, sensible order, back button), on-screen button glyphs that appear only while a pad is in use, nothing touch-only left behind. Works with the standard Gamepad API (Xbox / PlayStation / Switch-style pads on phone, tablet and desktop). Keyboard gets the same focus navigation for free where cheap.

## Direction update 27 (owner msg 145, 2026-11-15) — smarter traffic, same density
- Traffic density stays exactly as it is (the owner loves it). The driving gets smarter so jams are rare and clear themselves: buses pull fully into stops / bays and do not block the lane while loading, gaps are kept at junctions (no entering a junction that cannot be cleared), sensible right-of-way and turn yielding, vehicles route around a blocked lane or re-plan, dwell times and bus bunching controlled, stuck detection that resolves a gridlock gracefully and invisibly (off screen first), the player's cab never stuck behind a jam. Measure jams before and after; no visible thinning of traffic.

## Direction update 28 (owner msg 151, 2026-11-15) — real bathrooms; night light under the people
- BATHROOMS are always real, drawn rooms. No "tap the Restroom door and you are relieved" anywhere (the SkyDeck was his example). Always: walk in, use a toilet, then wash hands at a sink. Bathrooms are unique per place (size, tiles, fixtures, mood matching the venue), not copies.
- NIGHT LIGHT: the dithered streetlight pools are loved, but they must not be painted over the characters as a top layer. Direction shown to the owner as a before / after (docs/shots/light_compare_*.png; trial code in HISTORY): pools fall on the ground; each person / object is lit as a whole by the nearest light. IMPLEMENT ONLY AFTER HIS GO-AHEAD.

## Direction update 29 (owner msg 155, 2026-11-16) — night light approved
- The owner approved the trial look from docs/shots/light_compare_*.png: the dithered streetlight pools fall on the GROUND only; each person / object is drawn clean and lit as a whole by the nearest light; nothing is painted over characters as a top layer. Implement it (Fable work) in docket order.

## Direction update 30 (owner msg 158, 2026-11-16) — cooking mini-games match the dish; music quieter
- COOKING: many more cooking mini-games, and the one played must fit what is being made (a smoothie is a BLENDER game, not a pan flip; chopping for salads / prep, stirring for soups / sauces, and so on). One mini-game per dish is enough: build the set, then give every recipe the most appropriate one.
- MUSIC: a bit too loud by default: the music bus is trimmed (x0.6 instead of x0.9).

## Direction update 31 (owner msg 159, 2026-11-16) — Central Station platforms
- Central Station must have its train platforms 1 and 2 visible and walkable, the way the other stations do (add to the station, do not rework it).
- (owner msg 160) Once the platforms are built, the train job (station / rail job play) must take place on them.

## Direction update 32 (owner msg 162, 2026-11-16) — mini-games fit the activity; audit + new categories
- Every mini-game must fit what the character is doing (gym: a game per machine or 3-4 fitting ones: running for the treadmill, lifting for weights ...; cooking as in update 30). A Fable agent audits ALL existing mini-games for fit and variety, and proposes whole new categories where a quick, functional mini-game makes sense. Not overdone: nothing trivial (no door opening). The owner wants the ideas BEFORE any action.

## Direction update 33 (owner msg 163, 2026-11-16) — mini-game plan approved in full
- Approved: GYM one fitting game per machine (treadmill stride rhythm, weights timed reps, bike cadence band, rower strokes, punching bag targets, yoga pose); COOKING one per dish (blender, chopping, stirring, pan flip only for flipped dishes, oven window, assembling, pouring); a full AUDIT table of every existing mini-game (skills, 25 jobs, phone, festivals, dates, Chapters) for fit and variety; NEW CATEGORIES: laundry (sort, fold), dishes / cleaning, a light shower temperature dial, fishing (cast / reel), gardening (water, weed), home repairs, pets, swimming, venue games that are plain timers (bowling, darts, pool, arcade), photography, market haggle / pick the ripest, unpacking the moving boxes on day one, studying recall, karaoke / instruments, club dancing, painting colour match, barber picker. Leave alone: sleeping, eating, walking, doors, toilets, calls, bills.
- Rules (agreed): always optional (Auto and mini-games-off work exactly as now); 15-30 s, one thumb, portrait; playing well gives a small bonus, skipping never punishes; daily chores offer the game the first time and then only occasionally.
- Work order is the lead's decision.
- CORRECTION (owner msg 164): mini-games appear EVERY time, daily chores included (not 'first time then occasionally'). The player chooses: a Settings switch turns mini-games off (the existing mini-games-off / Auto switch, made easy to find in the menu). A tooltip points to that switch when a mini-game comes up for the second time; show it only the first few such times in a save (about 3), then never again.

## Direction update 34 (owner msg 165, 2026-11-16) — custom alarm, featured classic song, luggage
- SLEEP: all existing sleep options stay; a button at the bottom lets the player set the alarm to any time.
- MUSIC: one of the original eight loops (it played a lot) is a favourite: it returns as a FEATURED song. Bring the eight originals back as "Classics" (same sound as before), in the jukebox and in the pools, so the owner can name it; featured songs come up more often. He will keep naming favourites.
- INTRO LUGGAGE: at the carousel the player takes the suitcase and TOWS it behind them (a rolling-suitcase animation) through the airport, into the cab, out of the cab and up to the flat; inside the door it leaves the hand and stands by the door as one more thing to unpack (tap, like the moving boxes). The left-over red bag standing outside the airport (from when the game started outdoors) is removed.
- (owner msg 166) The OPENING plays as it used to: from landing through the cab ride to the apartment (about the first 5 minutes of a new game) the old soundtrack's songs play in the places they played before (title, interior at the airport, the day / time-of-day street loop, the ride, the interior at home: reconstruct exactly from the old code at commit e834cfe: src/sim/audio.js + _audio_music.js); the new songbook takes over afterwards, with the classics kept in the pools as featured songs.

## Direction update 35 (owner msg 167, 2026-11-16) — some furniture is in-store only
- The Roomy app keeps showing the whole catalogue, but a good share of the pieces cannot be ordered online: they are marked "Only available in store", list the store(s) that stock them, and offer "Take me there" (the existing route guidance). The stores must have a reason to be visited. The same principle applies to any other 'buy everything from the phone' app.
- (owner msg 168) The same for the CLOTHES app and every other shopping app: a significant share (more than half is fine) of clothes and of furniture is in-store only, shown in the app with the store name(s) and "Take me there". The lead decides the split: basics online, the nicer / signature / brand pieces in store.

## Direction update 36 (owner msg 170, 2026-11-16) — trailer (ON HOLD until the owner says go)
- A 45-second WIDE trailer, no voice-over: real gameplay clips + motion-graphic title cards in the game's pixel style + the game's own music; tone cosy with a bit of upbeat. It must say how many enterable and specialised buildings there are and show many of them (aquarium, airport, and more), plus the city at rush hour, night under the streetlights, a festival, cooking, a date, a job. Fable work. Do not start before the owner's go.

## Direction update 37 (owner msg 173, 2026-11-16) — phone shows and reading are part-screen, time runs
- Watching a show (Reel and any other video app) or reading (short reads, the guide, books, letters) on the phone no longer takes the whole screen and no longer stops the clock: the phone shrinks to a part-screen player / reader (the character visibly holds the phone; the world, the HUD clock and needs stay visible around it) and game time goes on, with the activity's effects accruing as time passes. The player can stop any time. Music stays off while watching, as now.

## Direction update 38 (owner msg 176, 2026-11-16) — all four ways, always
- Map navigation and every "Take me there" always offer ALL of: on foot, bus, train, cab (even when one is slow or silly for the distance). Never hide an option.

## Direction update 39 (owner msg 177, 2026-11-16) — many more clothing stores
- Quite a few more enterable clothing stores (today about five). Direction: the clothing BRANDS that already exist in the catalogue get their own shops with their own look (the boutiques Marigold, Hollowell, Nightjar, Juniper & Rye, Second Wind, Little Lantern, Tidepool; a shoe shop or two, a hat / accessories shop, a sportswear shop, a formal-wear / tailor, a kids-free thrift second branch, a department-store fashion floor), spread over the districts in existing buildings / empty shopfronts (add, never rework the city), each stocking its brand's in-store-only pieces so the in-store rule sends the player to different places. Unique interiors, not copies.
- (owner msg 178) PRESET OUTFITS: every clothing store offers a few ready-made outfits put together from pieces it already sells (buy the whole look in one tap, pieces you own are not charged again), some of them displayed on mannequins on the shop floor (tap the mannequin to see / try / buy the look). Plus a handful of NEW outfits made of new pieces, each of which is also sold on its own.

## Direction update 40 (owner msg 181, 2026-11-16) — the classics are day one; trailer at the end of the list
- MUSIC: on the FIRST DAY of a new game only the eight original songs play, each in its old place (title, interior, morning / day / evening / night streets, rainy, train). From day two the new songbook plays, with the eight classics in the pools of their places, weighted to come up a bit more often than other tunes (about 2x a normal tune; the owner's favourites 'interior' and 'day' about 2.5x): noticeable, not dominant. This replaces 'the first ~5 minutes' in update 34's note.
- TRAILER (update 36): no longer on hold; it is the LAST item of the to-do list.
- (owner msg 183) Central Station: the platform area must be VERY detailed and unique (a showpiece, not a copy of the other stations).

## Direction update 41 (owner msgs 196 + 198, 2026-11-16): questionnaire decisions
- Suitcase stays yellow; no red luggage beside the player at the kerb. Central Station: terminus is fine; the hall's information desk stays a brief part of the Station Agent shift; platform brightness at night fine.
- Traffic: 28 buses stay for now; a few more cars at the bus junctions (not too many); right turn on red stays.
- Night light: six steps stay; TREES are lit as a whole too (no dotted pool pattern on tree crowns); rim darkness fine.
- Mini-games: wok dishes keep the pan flip; kneading and ping-pong get their OWN pictures; hint 7 s; laundry / watering / simple venue animations fine as built; no new games (pick the ripest, photo) for now.
- Music: classics volume fine; NO vinyl crackle.
- Phone: the slow reading clock applies only to the book reading app (Pages).
- Wish-list reminder: as built (4.5 tiles, once a day, weekly stock counts, x does not silence longer).
- (owner msg 199, same day) PHONE: no 'Bigger' button on shows / reading: always part-screen, the world must be seen to keep going. Reading runs the NORMAL clock everywhere (the slow reading pace is dropped, Pages included).
