// Wander guidebook — static editorial data (chapters, district notes, blurb templates, stamp-book experiences). Pure data, no DOM.
export const CHAPTERS = [
  { id: 'eat', name: 'Eat & Drink', glyph: 'cup', color: '#d9573a', line: 'Noodles, pastries, late-night slices and the best coffee on the bay.' },
  { id: 'shop', name: 'Shopping', glyph: 'bag', color: '#3b6bd0', line: 'From corner shops to the Galleria: where to spend it.' },
  { id: 'shows', name: 'Shows & Nightlife', glyph: 'mask', color: '#8a4fc0', line: 'Curtain up. Films, concerts, plays, bars and what is on this week.' },
  { id: 'arts', name: 'Arts & Culture', glyph: 'book', color: '#c2478a', line: 'Books, records, galleries, buskers and quiet reading rooms.' },
  { id: 'outdoors', name: 'Outdoors & Parks', glyph: 'tree', color: '#3f9a52', line: 'Ponds, piers, lookouts and lazy afternoons in the open air.' },
  { id: 'fitness', name: 'Fitness & Sport', glyph: 'bell', color: '#e08a2c', line: 'Work up a sweat, indoors or out.' },
  { id: 'sights', name: 'Sights & Landmarks', glyph: 'tower', color: '#2f9aa8', line: 'The postcards: towers, plazas, lighthouses and views.' },
  { id: 'services', name: 'Services', glyph: 'key', color: '#6f7a8c', line: 'Haircuts, health, money, laundry and where the jobs are.' },
  { id: 'transit', name: 'Getting Around', glyph: 'train', color: '#3a3644', line: 'Light rail, three bus lines, cabs and what they cost.' },
  { id: 'try', name: 'Things To Try', glyph: 'stamp', color: '#b8862c', line: 'Everything you can DO in Maple Bay. Collect the stamps.' },
];
export const CHAPTER_BY_ID = Object.fromEntries(CHAPTERS.map(c => [c.id, c]));
export const DISTRICT_INFO = {
  downtown: { color: '#5b7fd6', line: 'Glass towers, the Galleria and the SkyDeck. The city at full volume.' },
  oldtown: { color: '#c9773f', line: 'Brick lanes, lantern-lit noodle bars and the Saturday market.' },
  harbor: { color: '#3aa6b5', line: 'Salt air, the boardwalk, the Bay Wheel and a lighthouse at the end.' },
  hillcrest: { color: '#8a6fd0', line: 'Terraced streets, the campus and the best view in town.' },
  maplewood: { color: '#5fa84f', line: 'Leafy, friendly and residential. Gardens, a school, good bread.' },
  arts: { color: '#d0589a', line: 'Galleries, record shops, the Playhouse and the Symphony.' },
  railyard: { color: '#8c8478', line: 'Warehouses turning into lofts. Rough edges, honest diners.' },
  park: { color: '#3f9a52', line: 'Central Park and the River Walk: the green heart of the bay.' },
  airport: { color: '#7c8aa0', line: 'Where everyone arrives. Planes overhead and a tram underfoot.' },
};
export const hash = s => { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
export const pick = (arr, key) => arr[hash(key) % arr.length];
// label + blurb templates by generic template / kind. {n} = name, {d} = district name
export const TYPE_INFO = {
  cafe: ['Cafe', 'cup', ['A {d} regular: good coffee, window seats and nobody rushing you.', 'Stop in at {n} for something warm and a table to linger at.', 'Milk steamed properly and a quiet corner. A fine place to lose an hour.']],
  tea: ['Tea house', 'cup', ['Pots of proper leaf tea and small plates. {n} keeps the kettle on all day.', 'A calm room in {d} where the tea comes with a timer and a smile.']],
  bakery: ['Bakery', 'cup', ['Follow the smell of warm bread down the block. Go early for the best trays.', '{n} bakes from before dawn. The first batch never lasts.']],
  diner: ['Diner', 'cup', ['Bottomless coffee, vinyl booths and breakfast at any hour it is open.', 'A {d} diner of the old school. Order the special; do not ask what is in it.']],
  eatery: ['Eatery', 'cup', ['A small kitchen doing one thing very well. Locals queue; you should too.', 'Cheap, quick and far better than it needs to be. A {d} favourite.', '{n} is the kind of place you find once and keep coming back to.']],
  restaurant: ['Restaurant', 'cup', ['White napkins and a short menu. Book a table for something worth celebrating.', 'A proper sit-down dinner in {d}. Dress up a little.']],
  bar: ['Bar', 'mask', ['Low lights, good company and a long counter. Evenings start slowly here and end late.', 'A {d} local with stools at the bar and stories at every table.']],
  boutique: ['Boutique', 'bag', ['Racks of carefully chosen clothes. You will leave with something you did not plan on.', '{n} dresses {d}. Try things on; the mirrors are kind.']],
  thrift: ['Thrift shop', 'bag', ['Second-hand treasure for patient hunters. Every rail hides one great jacket.']],
  books: ['Bookshop', 'book', ['Shelves to the ceiling and a chair by the window. Browse as long as you like.']],
  records: ['Record shop', 'book', ['Crates of vinyl and a turntable that never stops. Ask what is playing.', 'Flip through the bins at {n}; the staff picks are always right.']],
  comics: ['Comic shop', 'book', ['New issues on Wednesdays, back issues in long boxes, opinions for free.']],
  bodega: ['Corner shop', 'bag', ['Milk, snacks, batteries and a cat on the counter. Open when you need it.', 'The {d} corner shop: small, crowded and somehow stocking everything.']],
  grocery_m: ['Grocery', 'bag', ['A neighbourhood market with proper produce and a deli counter. Stock the fridge here.', 'Everything for the week\'s cooking, a short walk from home in {d}.']],
  florist: ['Florist', 'bag', ['Buckets of fresh stems out front. A bunch from here fixes most apologies.']],
  cheese: ['Cheese shop', 'bag', ['Wheels, wedges and free tastes. Ask for something that bites back.']],
  stationery: ['Stationery', 'bag', ['Notebooks, good pens and paper that deserves better handwriting.']],
  pharmacy: ['Pharmacy', 'key', ['Plasters, remedies and sound advice across the counter.']],
  pets: ['Pet shop', 'bag', ['Treats, toys and a very loud parrot. Bring something home for a furry friend.']],
  hardware: ['Hardware', 'bag', ['Nails by the handful and someone who knows exactly which one you need.']],
  toys: ['Toy shop', 'bag', ['Wind-up robots, kites and board games. Grown-ups welcome.']],
  gallery: ['Gallery', 'book', ['White walls and local painters. Entry is free; opinions are encouraged.']],
  art: ['Art supplies', 'book', ['Tubes of colour, sketchbooks and brushes. Everything a new easel needs.']],
  barber: ['Barber', 'key', ['A hot towel, a sharp trim and all the neighbourhood gossip.']],
  salon: ['Salon', 'key', ['Walk in tired, walk out polished.']],
  nails: ['Nail studio', 'key', ['A fresh set and half an hour of peace.']],
  tattoo: ['Tattoo studio', 'key', ['Flash on the walls and a steady hand. Think it over first.']],
  laundry: ['Laundromat', 'key', ['Warm dryers and a paperback swap shelf. Clean clothes in under an hour.']],
  stall: ['Street food', 'cup', ['A walk-up window with a queue for good reason. Eat it on the nearest bench.', 'Order at the hatch, pay in coins, burn your tongue. Worth it.']],
  retail: ['Shop', 'bag', ['A {d} shopfront with a little of what you need and a lot of what you want.']],
  service: ['Service', 'key', ['Friendly hands and fair prices. Walk-ins welcome.']],
};
export const KIND_LABEL = { pho: 'Pho noodles', taqueria: 'Taqueria', falafel: 'Falafel', ethiopian: 'Ethiopian kitchen', donut: 'Doughnuts', bagels: 'Bagels', curry: 'Curry house', dimsum: 'Dim sum', hotpot: 'Hot pot', kbbq: 'Korean barbecue', boba: 'Bubble tea', seafood: 'Seafood', soul: 'Soul food', snack: 'Snack bar', juice: 'Juice bar' };
export const CORE = { // core venue ids -> [chapter, label, glyph, also[]]
  clinic: ['services', 'Clinic', 'key'], restaurant: ['eat', 'Restaurant', 'cup', ['shows']], warehouse: ['services', 'Workplace', 'key'], office: ['services', 'Workplace', 'key'], courier: ['services', 'Workplace', 'key'],
  bank: ['services', 'Bank & realtor', 'key'], clothing: ['shop', 'Clothing', 'bag'], homegoods: ['shop', 'Home goods', 'bag'], gym: ['fitness', 'Gym', 'bell'], deptstore: ['shop', 'Shopping mall', 'bag', ['sights', 'eat']],
  hotel: ['sights', 'Grand hotel', 'tower'], central_station: ['transit', 'Rail terminus', 'train', ['sights']], bakery: ['eat', 'Bakery', 'cup'], cafe: ['eat', 'Cafe', 'cup'], ramen: ['eat', 'Ramen bar', 'cup'], pizza: ['eat', 'Pizzeria', 'cup'], diner: ['eat', 'Diner', 'cup'],
  bookstore: ['shop', 'Bookshop', 'book', ['arts']], cornerstore: ['shop', 'Corner shop', 'bag'], grocery: ['shop', 'Supermarket', 'bag'], cinema: ['shows', 'Cinema', 'mask', ['arts']], bar: ['shows', 'Bar & live music', 'mask', ['eat']],
  library: ['arts', 'Public library', 'book', ['services']], concerthall: ['shows', 'Concert hall', 'mask', ['arts', 'sights']], playhouse: ['shows', 'Theatre', 'mask', ['arts']], skydeck_lobby: ['sights', 'Observation deck', 'tower'], airport: ['transit', 'Airport', 'train', ['sights']],
};
export const CORE_BLURB = {
  deptstore: 'Two floors of open-front shops under one roof: plants, gadgets, sneakers, bikes, a toy shop with arcade machines and a food court that smells of everything at once.',
  hotel: 'The grandest lobby in the city, all brass and marble. Worth a look even if you are not checking in.',
  central_station: 'A glass-vaulted concourse where all the lines meet. Coffee kiosks, ticket machines and a public piano anyone may play.',
  skydeck_lobby: 'Ride the lift to the top of the tallest tower downtown. Telescopes, a glass-floor ledge, a photo spot and a bar above the clouds.',
  concerthall: 'A 228-seat hall with a resident orchestra. Evening concerts daily and weekend matinees.',
  playhouse: 'An intimate 120-seat theatre in the Arts Quarter. One show a night, and a Sunday matinee.',
  airport: 'Where your Maple Bay story began. A fountain atrium, a tram to the gates and planes on the hour.',
};
export const SPOT = { // spot kind -> [chapter, label, glyph, activity tags, blurbs, also]
  duckpond: ['outdoors', 'Pond', 'tree', ['duck_pond', 'picnic_spot', 'bench'], ['Bring bread crusts. The ducks have opinions and the goose has more.']],
  busker: ['arts', 'Live music spot', 'mask', ['busker', 'bench'], ['Somebody is always playing here. Stop, listen, and drop a coin in the case.', 'An open-air stage for whoever turns up with a guitar.'], ['outdoors', 'shows']],
  picnic: ['outdoors', 'Picnic spot', 'tree', ['picnic_spot', 'bench'], ['Soft grass and dappled shade. Pack a lunch and stay all afternoon.']],
  chess: ['outdoors', 'Chess tables', 'tree', ['bench'], ['Stone tables and serious faces. The regulars will take on anyone.'], ['fitness']],
  playground: ['outdoors', 'Playground', 'tree', ['swing', 'bench'], ['Swings are for everyone. Nobody is checking your age.'], ['fitness']],
  lookout: ['sights', 'Viewpoint', 'tower', ['viewpoint', 'picnic_spot', 'bench'], ['Lean on the railing and watch the whole bay turn gold at dusk.', 'A view worth the walk. Come back after dark for the stars.'], ['outdoors']],
  fishing: ['outdoors', 'Fishing spot', 'tree', ['fishing_spot', 'bench'], ['Cast a line and wait. The fish are in no hurry and neither are you.'], ['fitness']],
  ferriswheel: ['sights', 'Fairground ride', 'tower', ['ferris_wheel'], ['One slow turn above the boardwalk. Best at sunset, magic after dark.'], ['outdoors']],
  beach: ['outdoors', 'Beach', 'tree', ['bench'], ['A crescent of pale sand below the lighthouse. Shoes off.']],
  shrine: ['sights', 'Shrine', 'tower', ['bench'], ['A small quiet shrine on the hillside. Ring the bell once, gently.'], ['arts']],
  garden: ['outdoors', 'Community garden', 'tree', ['garden_plot', 'bench'], ['Raised beds, shared tools and tomatoes with a waiting list.']],
  skate: ['fitness', 'Skate spot', 'bell', ['bench'], ['Ledges, rails and the clatter of boards. Watch a while or bring your own.'], ['outdoors']],
  cats: ['outdoors', 'Cat alley', 'tree', ['street_cat'], ['A sunny alley ruled by street cats. They accept tribute in the form of chin scratches.'], ['sights']],
  planespotting: ['outdoors', 'Viewpoint', 'tree', ['bench'], ['Sit by the fence as the jets come in low over the bay. Bring a flask.'], ['sights']],
};
export const LANDMARK_BLURB = ['A Maple Bay landmark. Everyone gives directions from here.', 'Worth a detour, and a good place to meet a friend.', 'One of the sights of {d}. You will know it when you see it.'];
// which chapters an activity also appears in
export const ACT_ALSO = { gym_treadmill: 'fitness', gym_weights: 'fitness', gym_yoga_class: 'fitness', gym_shower: 'fitness', jog: 'fitness', exercise_home: 'fitness', swing: 'fitness', dance: 'shows', dance_home: 'fitness',
  watch_movie: 'shows', play_arcade: 'shows', bar_hang_out: 'shows', watch_live_music: 'shows', open_mic: 'shows', library_study: 'arts', library_read: 'arts', library_computer: 'services', browse_books: 'arts', read_novel: 'arts',
  paint: 'arts', sketch_outdoors: 'arts', practice_instrument: 'arts', listen_busker: 'arts', linger: 'eat', try_on: 'shop', computer_find_job: 'services', computer_shop: 'shop', fish_pier: 'outdoors' };
export const ACT_SKIP = new Set(['store_groceries', 'grab_snack', 'microwave_meal', 'heat_on_stove', 'eat', 'drink', 'chat', 'check_phone', 'nap_sofa', 'prep_cold', 'assemble_furniture']);
export const ACT_BLURB = { home: ['One of the small pleasures of having your own place.', 'A quiet thing to do at home when the city can wait.'], venue: ['Ask inside; it is what the place is for.', 'A good reason to walk through the door.'], world: ['Free, outdoors and better than it sounds.', 'One of those Maple Bay moments you remember later.'], anywhere: ['Anywhere, any time: it is all on your phone.'] };
// stamp-book experiences beyond the plain activities: id, title, group, glyph, blurb, place (entry id to link) , need(room/venue id that must exist)
export const EXPERIENCES = [
  { id: 'x:ride_train', title: 'Ride the Light Rail', group: 'Getting around', glyph: 'train', place: 'place:st_central', blurb: 'Tap in, find a seat and watch the districts slide past. The loop takes in all eight stations.' },
  { id: 'x:ride_bus', title: 'Catch a Bus', group: 'Getting around', glyph: 'train', place: 'tr:bus1', blurb: 'Three colour-coded lines. Wait at any stop and hop on.' },
  { id: 'x:ride_taxi', title: 'Take a MapleCab', group: 'Getting around', glyph: 'train', place: 'tr:taxi', blurb: 'Door to door, meter running. Call one from your phone or find a stand.' },
  { id: 'x:ride_airtram', title: 'Ride the Airport Tram', group: 'Getting around', glyph: 'train', place: 'place:airport', need: 'airport', blurb: 'The little automated tram between the terminal and the gates. Stand at the front window.' },
  { id: 'x:central', title: 'Visit Central Station', group: 'Getting around', glyph: 'train', place: 'place:central_station', need: 'central_station', blurb: 'Stand under the glass vault and watch the departure board flip.' },
  { id: 'x:piano', title: 'Play the Station Piano', group: 'Big days out', glyph: 'mask', place: 'place:central_station', need: 'central_station', blurb: 'There is a public piano on the concourse at Central Station. Sit down; nobody minds wrong notes.' },
  { id: 'x:airport', title: 'Wander the Airport Terminal', group: 'Getting around', glyph: 'train', place: 'place:airport', need: 'airport', blurb: 'Fountain atrium, carousels, arrivals board. People-watching of the highest order.' },
  { id: 'x:skydeck', title: 'Go Up the SkyDeck', group: 'Big days out', glyph: 'tower', place: 'place:skydeck_lobby', need: 'skydeck_lobby', blurb: 'Buy a ticket in the lobby and ride the lift to the top of the city.' },
  { id: 'x:ledge', title: 'Stand on the Glass Ledge', group: 'Big days out', glyph: 'tower', place: 'place:skydeck_lobby', need: 'skydeck_lobby', blurb: 'A glass floor with a long, long way down underneath. Do not look. (Look.)' },
  { id: 'x:telescope', title: 'Look Through a Telescope', group: 'Big days out', glyph: 'tower', place: 'place:skydeck_lobby', need: 'skydeck_lobby', blurb: 'Five telescopes on the SkyDeck, one for each direction. You may spot places you have not found yet.' },
  { id: 'x:skyphoto', title: 'SkyDeck Souvenir Photo', group: 'Big days out', glyph: 'tower', place: 'place:skydeck_lobby', need: 'skydeck_lobby', blurb: 'Stand on the marked spot, smile, and take the skyline home with you.' },
  { id: 'x:mall', title: 'Stroll the Galleria', group: 'Big days out', glyph: 'bag', place: 'place:deptstore', need: 'deptstore', blurb: 'Window-shop your way round all ten bays and the food court.' },
  { id: 'x:mall_shop', title: 'Buy Something at the Galleria', group: 'Big days out', glyph: 'bag', place: 'place:deptstore', need: 'deptstore', blurb: 'Plants, sneakers, gadgets, a bicycle. Treat yourself.' },
  { id: 'x:arcade', title: 'Play the Arcade Cabinets', group: 'Big days out', glyph: 'stamp', place: 'mall:toy', need: 'deptstore', blurb: 'Two arcade machines at the back of Toy Galaxy in the Galleria. High scores go on the board.' },
  { id: 'x:haircut', title: 'Get a Fresh Haircut', group: 'Around town', glyph: 'key', place: 'mall:bloom', blurb: 'A new look from Bloom Beauty in the Galleria, or any barber or salon in town.' },
  { id: 'x:service', title: 'Treat Yourself to a Service', group: 'Around town', glyph: 'key', blurb: 'Nails, a tattoo, a wash-and-fold: let somebody else do the work for once.' },
  { id: 'x:show_cinema', title: 'See a Film at The Orpheum', group: 'Big days out', glyph: 'mask', place: 'place:cinema', need: 'cinema', blurb: 'Buy a ticket at the box office, find a seat and wait for the lights to dim.' },
  { id: 'x:show_concerthall', title: 'Hear the Symphony', group: 'Big days out', glyph: 'mask', place: 'place:concerthall', need: 'concerthall', blurb: 'Twenty-five players and a conductor. Evening concerts daily.' },
  { id: 'x:show_playhouse', title: 'Catch a Play', group: 'Big days out', glyph: 'mask', place: 'place:playhouse', need: 'playhouse', blurb: 'An evening at The Lantern Playhouse. Applaud loudly.' },
  { id: 'x:street_food', title: 'Eat Street Food', group: 'Around town', glyph: 'cup', blurb: 'Buy something hot from a stand, stall or walk-up window and eat it standing up.' },
  { id: 'x:market', title: 'Shop the Old Town Market', group: 'Around town', glyph: 'bag', place: 'place:market_stalls', need: 'market_stalls', blurb: 'Fresh produce under striped awnings. Saturdays are the big day.' },
  { id: 'x:first_buy', title: 'Buy Something, Anywhere', group: 'Around town', glyph: 'bag', blurb: 'Your first purchase in Maple Bay. Keep the receipt.' },
  { id: 'x:cooked', title: 'Cook a Meal at Home', group: 'At home', glyph: 'cup', blurb: 'Groceries in, dinner out. Cheaper than eating out and it trains your Cooking.' },
  { id: 'x:furnish', title: 'Decorate Your Home', group: 'At home', glyph: 'key', blurb: 'Move a sofa, hang a picture, make it yours.' },
  { id: 'x:photo', title: 'Take a Photo', group: 'Around town', glyph: 'stamp', blurb: 'Use your phone camera somewhere worth remembering.' },
  { id: 'x:met', title: 'Meet Someone New', group: 'People & work', glyph: 'stamp', blurb: 'Say hello to a stranger. Half the city is friendlier than it looks.' },
  { id: 'x:hangout', title: 'Hang Out with a Friend', group: 'People & work', glyph: 'stamp', blurb: 'Invite someone along. Most things are better with company.' },
  { id: 'x:gift', title: 'Give a Gift', group: 'People & work', glyph: 'stamp', blurb: 'Flowers, a book, a box of something sweet.' },
  { id: 'x:hired', title: 'Land a Job', group: 'People & work', glyph: 'key', place: 'place:library', blurb: 'Browse listings on your phone, your own computer or the free ones at the library.' },
  { id: 'x:shift', title: 'Finish a Work Shift', group: 'People & work', glyph: 'key', blurb: 'Clock in, do the job, get paid.' },
];
export const STAMP_GROUPS = ['Out & about', 'Around town', 'Big days out', 'Getting around', 'At home', 'People & work', 'Districts'];
