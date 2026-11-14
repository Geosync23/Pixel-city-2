# Maple Bay Botanical Conservatory — notes (src/sim/conservatory.js, src/scenes/rooms/conservatory.js, src/data/conservatory.js, art src/art/showpiece/conservatory.js + conservatory_plants.js + _cons_lib.js)
- City: the existing `bld.civic.conservatory` (Central Park, 122,132) is converted in place: door poi `door:conservatory` at (129, 140.75) + interactable + welcome glow. G.places id `conservatory`. Hours 9-19 daily
  (closed toast at the door; visitors still inside at 19:18 are walked out). Hall, shop, cafe and flower show are free; the garden (north of the two gates) needs a $4 day ticket from the desk
  (`G.state.flags.conservatory_pass` = free for life).
- Room `conservatory` (40 x 28, noCrowd, own life). Zones (`def.zones`, `scene.cons.zoneAt(x, y)`): hall, shop (Garden Gifts `conservatory:gifts` + The Glasshouse Cafe `conservatory:cafe`), show (seasonal flower show),
  lily (Victoria lily pool + fountain), palm (waterfall, stream, palms, misters), desert, grotto (orchids, ferns, ivy glass, slate floor), butterfly (26 butterflies), koi (pond, 14 koi, arched bridge).
  Glass walls show the park outside by time of day / season (snow, rain); floors are one ground decal (indoor: no winter snow). Flower show follows `ENV.season`: tulips / sunflowers / chrysanthemums / poinsettias + lights.
- `G.conservatory`: isOpen(), hasTicket(), buyTicket(), enter(), desk(), facts(), readFact(id), photos(), photograph(scene), photo.snap()/state(), sketches(), sketch(fx, sc), sit(fx, sc), feedKoi(fx, sc),
  buySeedling(id?), wish(), tour { times [10, 13, 16], next(), start(), join(), state() }, talkDocent, talkGardener, chain(), cuttings(), takeCutting(i), rareDone(), door(), stats().
  State `G.state.conservatory` { ticketDay, visits, facts, photos, sketches, koi, sits, tours, wishDay, chain { st 0-3, got } }.
  Events `conservatory:visit|ticket|fact|koi|photo|sketch|sit|seedling|tourstart|tourstop|tour|cutting|chain|wish`.
- Activities (in-world fixtures, own tags; data/activities.js untouched): Feed the koi (50c; koi race to the spot; fun +10) · Read the plaque (12 facts collection; logic xp; all 12 -> inspired) ·
  Sketch the orchids (45 min; creativity xp ~45, x1.25 with `cons_sketchbook`; your sketch is pinned on the grotto board) · Photograph a butterfly (viewfinder timing moment; 8-species album, quality 1-3) ·
  Sit and breathe (benches; moodlet `green_calm`, added to MOODLETS from data/conservatory.js) · Guided tour (docent Wendell walks 7 stops at 10/13/16 or on request; tap him to join, you follow; >= 5 stops -> inspired + facts) ·
  Buy a seedling (5 house plants with their own art `furn.home.plant.cons_*`, delivered home) · lily-pool wish (25c, once a day).
- Items (17, ids `cons_*`): 5 seedlings (homegood/plant), 5 gifts, Field Sketchbook (misc), 6 cafe dishes. VIS for the seedlings is merged into housing VIS.
- Opportunity: Hattie the head gardener (walks the beds, watering) asks for 3 cuttings (G.goals id `cons_cuttings`, group opportunity). Plants are city pois `cutting:0..2` (glow) beside benches in the park,
  uphill and by the waterfront. Reward: lifetime pass, $40, a Moth Orchid, and a "Rare Finds" bed + plaque appears in the hall.
- Guide: entry `place:conservatory` is chapter Arts & Culture (+ outdoors, sights, eat, shop) via `_guide_data` CORE / CORE_BLURB (registered from the sim module, guide.js untouched); stamps `x:cons_visit`, `x:cons_koi`,
  `x:cons_photo` pushed into EXPERIENCES and awarded with `G.guide.stamp`. `registerInfo('Maple Bay Botanical Conservatory', ...)` is called (lead: wire placeInfo into the guide; the activity ids listed there
  — cons_feed_koi, cons_read_plaque, cons_sketch, cons_photo, cons_breathe, cons_tour, cons_seedling — are not entries of data/activities.js).
- Art ids `furn.cons.*` (53 assets): glasswall, partition, arch, gate, shaft, lilypool, waterfall, stream, koipond, bridge, bridgerail, bench, plaque, lamp, lantern, feeder, nectar, puparium, sketchboard, sketchspot,
  seedtable, counter, shelf, banner, mister, mapboard, barrow + palm, banana, treefern, cycad, bamboo, maple, bed, cactus, rock, mesa, orchidlog, basket, flowerbed, showpiece, urn, reeds. Koi / butterflies / mist are entities drawn in the room file.
- Gaps: existing park trees partly hide the door; fixed crowd lanes (walkers do not avoid the player); no job / no rain-on-roof sound; tour pace is slow (about 3 real minutes); the planner does not list tour times;
  cafe dishes use the plain shop window; the three curious plants glow even before Hattie asks.
