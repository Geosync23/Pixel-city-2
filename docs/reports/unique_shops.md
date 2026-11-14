# Unique shop / service / grocery interiors (src/scenes/rooms/places_shops.js + places_shops2.js, art src/art/venue/places_shop_art.js)
27 hand-made rooms replace the generic templates for every converted SHOP, SERVICE and GROCERY (`pub:<n>`). Registered through `registerUnique` (key = place NAME, fallback pub id when kind matches;
food templates return null) and `registerInfo(name, { blurb, signature, tryThis, activities })` for the guide. Each def gets `pub: { tpl, kind, layout: 'unique' }`.
Helpers exported from places_shops.js: `define(name, n, key, info, build)`, `P/PY/PX` (pshop floor / back-wall / left-wall items), `CK`, `CKT` (adds the checkout tag), `U`, `FL`, `clock`, `neon`, `HL` (hanging light), `HG` (hanging decor).

## Places (size, concept)
Services: Otis & Sons Barbershop 10x7 (chrome chairs + bulb mirrors, check floor, pole) · Lacquer Lounge Nail Bar 9x8 (manicure row, pedicure thrones, polish wall, chandelier) · Black Cat Ink 8x9 (dark brick, screened booths, neon flash, cat) ·
Ink & Ivy Tattoo 11x7 (white + plants, open stations, paper flash) · Suds & Bubbles Laundromat 12x8 (8 numbered washers, stacked dryers, island, folding tables, soap machine).
Florists: Bloom & Paper 8x8 (potting shed, striped flower cart, wrapping bench = till) · Bloom & Paper Riverside 11x6 (concrete + black, 6-unit bucket wall, bouquet cooler, lanterns).
Bodegas: Coast Gas Mini Mart 9x6 (coffee/hot-dog bar, fridges, oil, snack gondolas) · Birch Lane Pantry 7x8 (jars round a lit fireplace, jam barrel, armchair) · Salt & Co. Provisions 9x7 (fish on ice, barrels, tins, rope, buoys).
Groceries: Marchetti's 13x9 (deli case + hanging salami, wine wall, two aisles, one lane) · Bay Thread Co-op 12x10 (bulk bins, produce island, sideways refill aisles, notice board, flowers).
Clothes: Marigold & Main 10x8 (mannequin platform, jewellery case, twin fitting rooms, chandelier) · Ink & Ivy Vintage 9x9 (three long racks, $2 bins, hat wall, hi-fi, changing room).
Books/records/comics: Paper Lantern Books 8x10 (stack rows, ladder, lantern-lit nook) · Wax & Wane Records 10x9 (purple brick, six labelled crates, two listening stations, moon lamp) · B-Side Records 7x7 (bare-brick basement, counter on back wall, 45s, guitar) ·
Spin City Vinyl 12x7 (turquoise/pink, white crates, DJ booth + dance square) · Ink & Ivy Comics & Zines 11x8 (long boxes, cover wall, figure cases, arcade, reading corner).
Retail: Old Post Stationers 8x7 (brass PO boxes, pen wall, writing desk) · Post Corner Pharmacy 11x9 (glass dispensary, five labelled aisles, waiting chairs, green cross) · Paws & Whiskers 12x9 (fish-tank wall, cages, puppy pen, bird stands) ·
Tin Robot Toys 10x10 (three-tier tower, cubby wall, train table, kites/planes, robot) · Salt & Co. Chandlery & Hardware 13x8 (parts drawers, pegboard, rope reels, lumber/pipes, buoys) · Tidewater Gallery 14x8 (white cube, 7 canvases, 6 plinths, mobile) ·
Studio 11 Art Supply 9x10 (rainbow paint racks, marker wall, flat files, demo easels) · The Rind & The Wheel 7x6 (glass cheese case, ageing racks, tasting barrel).

## New art `furn.pshop.*` (65 assets; `node tools/gallery.mjs pshop --scale 3 --out p`)
sign (wall text board: text,bg,fg,fr,fr2,lit) · shelf (themed goods shelf: w,h,kind,rows,pal,name,hc,c,back) · platform · hanging (kind basket|salami|mobile|buoy|kite|plane) · hanglight (bulb|lantern|chandelier|shade|tube) · barrel · crate ·
barber.armchair / .pole / .station · laundry.washer / .dryer / .foldtable / .cart / .soap · nail.tableset / .polishwall (wall) / .pedi.armchair · tattoo.bench / .cart · flash (wall; dark, board) ·
record.bin (kind 'box' = comic long boxes; name) / .wall (wall; kind 'comic') / .listen · comic.figures · pet.tanks / .cages / .pen / .birdcage / .foodbags · toy.tower / .cubby / .traintable / .robot ·
flower.buckets / .coldcase / .worktable / .cart · hw.pegwall (wall) / .bins / .paint / .rope / .lumber / .lifering (wall; kind anchor|oars) · rx.counter (checkout) / .cross (wall) · pen.wall (wall) · post.boxes (wall) · paper.rolls · writing.desk ·
art.paintrack / .canvases / .flatfile · gal.plinth (6 kinds) / .canvas (wall; 6 kinds) · cheese.counter (checkout; kind deli|fish) · deli.case (same, no till / no checkout tag) · cheese.wheels · tasting · bulk.bins · coffee.station · icefish · thrift.bins / .hatwall (wall) · jewel.case.
Wall pieces draw from local z 0, so always pass a mount. NOTE: `generic.clock`, `generic.picture`, `bar.neon` draw at absolute heights AND get their default mount added (they float above the wall in older rooms) — pass mount 0 (helpers `clock`, `neon`).
Indoors `glow()` pixels are always visible, so never draw a glow over the lit part of a fixture.

## Activities (need the lead: activities.js is owned elsewhere)
No venue activity currently fires in any `pub:<n>` room because `forTags` filters `where: 'venue'` by fixed `venues` ids. Already-existing tags present in the rooms: seat (all service rooms + most shops), fitting_room (Marigold, Vintage),
book_browse + reading_nook (Paper Lantern, Comics), arcade (Comics), dancefloor (Spin City), jukebox (Wax & Wane); home-tagged props: stereo/music (Vintage, Wax & Wane, B-Side), instrument (B-Side guitar), easel (Studio 11).
New fixture tags on the signature pieces (proposed activities): record_bin "Dig Through the Crates" 15 min fun; listening_station "Listen at the Station" 10 min fun; pet_pen "Meet the Animals" 10 min fun+social;
fish_tank "Watch the Fish" 10 min fun, calm; toy_demo "Play with the Display" 10 min fun; flower_display "Smell the Flowers" 5 min fun; tasting_board "Taste the Samples" 5 min hunger+fun; artwork "Contemplate the Art" 15 min fun, creativity xp;
pen_tester "Test the Pens" 5 min fun, creativity xp; flash_wall "Flip Through the Flash" 10 min fun; laundry_machine "Do a Load of Laundry" 45 min (paid, hygiene/clean-clothes moodlet); coffee_station "Pour a Coffee" $2, energy; browse "Browse" 10 min fun (generic shelves).

## Verified / gaps
- Build passes; one eval entered all 27 rooms: all `layout: unique`, 27 distinct sizes + signature sets, exactly 1 checkout each, staff + use spots reachable from the exit, 7-12 npcSpots, service rooms have armchair/tableset/bench seats, no overlaps / out-of-bounds, no page errors.
- Only flag: Spin City's DJ staff spot lies inside the `bar.dj` footprint (same convention as the bar: snap, don't pathfind).
- Text on the left ('x') wall renders rough in the 3x5 font (engine-wide); names are on the back wall where the wall is free.
- Not done: night-time look, the service flow / shop window actually played through in these rooms, NPCs occupying the new seats; converted buildings keep their facades.
