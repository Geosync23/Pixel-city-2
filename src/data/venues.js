// venues.js — every place in Maple Bay the player can visit: shops, food, services, workplaces,
// street stands, market stalls, the airport, outdoor points of interest and train stations.
// Pure design data. Positions on the map are owned by the world team; this file only says WHAT a
// place is, WHEN it is open and WHAT it offers.
//
// DISTRICT ids: downtown, oldtown, harbor, hillcrest, maplewood, arts, railyard, park, airport.
//
// VENUES[] fields
//   id          stable id (used by items.js `soldAt`, jobs.js `venue`, calendar.js events, phone map).
//   name        sign text.
//   type        'shop' | 'food' | 'service' | 'leisure' | 'workplace' | 'stall' | 'transit'.
//   district    one of the district ids above.
//   where       one-line location hint for level designers.
//   station     nearest train station id (see STATIONS).
//   interior    true = enterable interior scene; false = interact from the street (stands, stalls).
//   hours       array of 7 entries, index 0 = Monday .. 6 = Sunday. Each entry is [open, close] in
//               hours (decimals allowed: 6.5 = 06:30) or null = closed that day.
//               close may exceed 24 to run past midnight ([17, 26] = 17:00 to 02:00 next day).
//               [0, 24] = open around the clock.
//   seasons     optional array of season ids the venue operates in (default: all year).
//   offers      what the place provides:
//                 shop:      item categories sold here (the exact stock is every item in items.js
//                            whose `soldAt` includes this venue id).
//                 menu:      true if it serves `dish` items eaten on the premises (items.js).
//                 services:  ids of SERVICES (below) available at the counter.
//                 functions: function tags of interactive objects inside (activities.js).
//   priceMult   multiplier applied to the list price of everything sold here (default 1).
//   jobId       id of the job (jobs.js) worked here, or null.
//   dressCode   optional: 'smart' = needs an outfit tagged smart or formal, and hygiene above 0.
//   delivers    true if its menu is available through the ZipEats phone app.
//   blurb       flavour line for the map app.

const DAILY = (open, close) => [[open, close], [open, close], [open, close], [open, close], [open, close], [open, close], [open, close]];

export const VENUES = [
  // ---------------------------------------------------------------- shops
  { id: 'grocery', name: 'FreshWay Market', type: 'shop', district: 'maplewood', where: 'Maplewood edge, on the avenue towards Downtown',
    station: 'st_maplewood', interior: true,
    hours: [[8, 21], [8, 21], [8, 21], [8, 21], [8, 21], [8, 21], [9, 19]],
    offers: { shop: ['ingredient', 'ready_meal', 'snack', 'drink', 'gift'], functions: ['shelf', 'till'] },
    priceMult: 1, jobId: 'grocery_clerk', blurb: 'Everything for the fridge, under one green awning.' },
  { id: 'cornerstore', name: 'Lucky Corner', type: 'shop', district: 'oldtown', where: 'Old Town, on a cobbled corner under a neon clover',
    station: 'st_oldtown', interior: true,
    hours: DAILY(6, 26),
    offers: { shop: ['ingredient', 'ready_meal', 'snack', 'drink', 'misc', 'gift'], functions: ['shelf', 'till'] },
    priceMult: 1.2, jobId: null, blurb: 'Open late, a bit pricey, always has what you forgot.' },
  { id: 'clothing', name: 'Thread & Co.', type: 'shop', district: 'downtown', where: 'Downtown shopping street',
    station: 'st_central', interior: true,
    hours: [[10, 19], [10, 19], [10, 19], [10, 19], [10, 20], [10, 20], [11, 17]],
    offers: { shop: ['outfit'], functions: ['clothes_rack', 'fitting_room', 'till'] },
    priceMult: 1, jobId: null, blurb: 'Outfits for work, rain, and nights out.' },
  { id: 'homegoods', name: 'Nest & Wire', type: 'shop', district: 'downtown', where: 'Downtown, two floors: furniture below, electronics above',
    station: 'st_central', interior: true,
    hours: [[10, 19], [10, 19], [10, 19], [10, 19], [10, 20], [10, 20], [11, 17]],
    offers: { shop: ['homegood'], functions: ['showroom', 'till'] },
    priceMult: 1, jobId: null, blurb: 'Furniture and gadgets. Free next-morning delivery.' },
  { id: 'bookstore', name: 'Dog-Eared Books', type: 'shop', district: 'oldtown', where: 'Old Town, narrow shopfront with a sleeping dog in the window',
    station: 'st_oldtown', interior: true,
    hours: [[10, 18], [10, 18], [10, 18], [10, 18], [10, 20], [10, 20], [11, 16]],
    offers: { shop: ['book', 'misc'], functions: ['book_browse', 'till'] },
    priceMult: 1, jobId: null, blurb: 'New and second-hand. The dog is not for sale.' },

  // ---------------------------------------------------------------- food
  { id: 'cafe', name: 'Bean & Gone', type: 'food', district: 'oldtown', where: 'Old Town square, striped awning',
    station: 'st_oldtown', interior: true,
    hours: [[7, 19], [7, 19], [7, 19], [7, 19], [7, 19], [8, 19], [8, 17]],
    offers: { menu: true, functions: ['till', 'seat'] },
    priceMult: 1, jobId: 'barista', blurb: 'Espresso, pastries and a window seat.' },
  { id: 'bakery', name: 'Rise & Shine Bakery', type: 'food', district: 'oldtown', where: 'Old Town market street',
    station: 'st_oldtown', interior: true,
    hours: [[6, 15], [6, 15], [6, 15], [6, 15], [6, 15], [6, 15], [7, 13]],
    offers: { menu: true, shop: ['ingredient', 'gift'], functions: ['till', 'seat'] },
    priceMult: 1, jobId: null, blurb: 'Warm bread from six. Sells out by mid-afternoon.' },
  { id: 'diner', name: "Dot's Diner", type: 'food', district: 'railyard', where: 'Railyard edge, chrome diner by the tracks',
    station: 'st_railyard', interior: true,
    hours: DAILY(0, 24),
    offers: { menu: true, functions: ['till', 'seat'] },
    priceMult: 1, jobId: 'line_cook', delivers: true, blurb: 'Breakfast all day, all night. Dot remembers your order.' },
  { id: 'ramen', name: 'Noodle Lantern', type: 'food', district: 'oldtown', where: 'Lantern Row, Old Town food street',
    station: 'st_oldtown', interior: true,
    hours: [null, [11.5, 22], [11.5, 22], [11.5, 22], [11.5, 23], [11.5, 23], [11.5, 21]],
    offers: { menu: true, functions: ['till', 'seat'] },
    priceMult: 1, jobId: null, delivers: true, blurb: 'Eight stools, one pot, a queue at lunch. Closed Mondays.' },
  { id: 'pizza', name: 'Slice of Heaven', type: 'food', district: 'arts', where: 'Arts Quarter, next to the cinema',
    station: 'st_arts', interior: true,
    hours: [[11, 23], [11, 23], [11, 23], [11, 23], [11, 25], [11, 25], [12, 22]],
    offers: { menu: true, functions: ['till', 'seat'] },
    priceMult: 1, jobId: null, delivers: true, blurb: 'By the slice or by the pie.' },
  { id: 'restaurant', name: 'The Gilded Gull', type: 'food', district: 'harbor', where: 'Harborside boardwalk, bay-view terrace',
    station: 'st_harbor', interior: true,
    hours: [null, [17, 23], [17, 23], [17, 23], [17, 23], [12, 23], [12, 22]],
    offers: { menu: true, functions: ['host_stand', 'seat'] },
    priceMult: 1, jobId: null, dressCode: 'smart', blurb: 'Fine dining over the water. Smart dress, please.' },

  // ---------------------------------------------------------------- services & leisure
  { id: 'gym', name: 'Iron Maple Gym', type: 'leisure', district: 'downtown', where: 'Downtown, second floor with big windows',
    station: 'st_central', interior: true,
    hours: [[6, 22], [6, 22], [6, 22], [6, 22], [6, 22], [7, 20], [8, 18]],
    offers: { shop: ['misc'], services: ['gym_day_entry'], functions: ['till', 'treadmill', 'weights', 'yoga_studio', 'locker_shower'] },
    priceMult: 1, jobId: 'fitness_trainer', blurb: 'Treadmills, free weights, yoga at 8, 12 and 18.' },
  { id: 'library', name: 'Maple Bay Public Library', type: 'leisure', district: 'arts', where: 'Arts Quarter, on the campus green',
    station: 'st_arts', interior: true,
    hours: [[9, 19], [9, 19], [9, 19], [9, 19], [9, 19], [10, 17], [11, 16]],
    offers: { services: ['borrow_book'], functions: ['study_desk', 'reading_nook', 'public_computer', 'book_browse'] },
    priceMult: 1, jobId: 'librarian', blurb: 'Free books, free computers, free quiet.' },
  { id: 'office', name: 'Hartwell & Finch', type: 'workplace', district: 'downtown', where: 'Hartwell Tower, 14th floor, Downtown',
    station: 'st_central', interior: true,
    hours: [[8, 18], [8, 18], [8, 18], [8, 18], [8, 18], null, null],
    offers: { functions: [] },
    priceMult: 1, jobId: 'office_analyst', blurb: 'Numbers go in, charts come out. Staff only.' },
  { id: 'clinic', name: 'Bayside Clinic', type: 'service', district: 'park', where: 'Riverside, by the footbridge',
    station: 'st_central', interior: true,
    hours: DAILY(7, 21), // walk-in hours; the door always opens for pass-out recoveries
    offers: { services: ['checkup'], functions: ['reception', 'seat'] },
    priceMult: 1, jobId: 'nurse', blurb: 'Friendly check-ups. Lollipops for all ages.' },
  { id: 'bar', name: 'The Blue Heron', type: 'leisure', district: 'arts', where: 'Arts Quarter, basement music club with a neon heron',
    station: 'st_arts', interior: true,
    hours: [null, [17, 25], [17, 25], [17, 25], [17, 26], [17, 26], [17, 24]],
    offers: { menu: true, functions: ['bar_stool', 'dancefloor', 'stage', 'seat'] },
    priceMult: 1, jobId: 'bartender', blurb: 'Cocktails, a dance floor, live music Fridays.' },
  { id: 'cinema', name: 'The Orpheum', type: 'leisure', district: 'arts', where: 'Arts Quarter, old marquee with chasing lights',
    station: 'st_arts', interior: true,
    hours: [[12, 24], [12, 24], [12, 24], [12, 24], [12, 25], [11, 25], [11, 23]],
    offers: { menu: true, shop: ['misc'], functions: ['till', 'cinema_seat', 'arcade'] },
    priceMult: 1, jobId: null, blurb: 'One screen, red velvet seats, real butter.' },
  { id: 'courier', name: 'ZipParcel Depot', type: 'workplace', district: 'railyard', where: 'Railyard, yellow roller doors',
    station: 'st_railyard', interior: true,
    hours: [[7, 19], [7, 19], [7, 19], [7, 19], [7, 19], [8, 14], null],
    offers: { services: ['collect_parcel'], functions: ['reception'] },
    priceMult: 1, jobId: 'courier', blurb: 'Parcels in, parcels out. Online orders can be collected here.' },
  { id: 'warehouse', name: 'Pier 7 Freight', type: 'workplace', district: 'harbor', where: 'Harborside, the long shed on Pier 7',
    station: 'st_harbor', interior: true,
    hours: [[6, 18], [6, 18], [6, 18], [6, 18], [6, 18], null, null],
    offers: { functions: [] },
    priceMult: 1, jobId: 'dock_worker', blurb: 'Crates, forklifts and gulls. Staff only.' },
  { id: 'bank', name: 'Bay Realty & Trust', type: 'service', district: 'downtown', where: 'Downtown, stone columns opposite Central Station',
    station: 'st_central', interior: true,
    hours: [[9, 17], [9, 17], [9, 17], [9, 17], [9, 17], [10, 14], null],
    offers: { services: ['loan', 'view_property', 'buy_property', 'rent_property'], functions: ['reception', 'seat'] },
    priceMult: 1, jobId: null, blurb: 'Your account, small loans, and the keys to your next home.' },
  { id: 'airport', name: 'Maple Bay International', type: 'transit', district: 'airport', where: 'City edge; terminal with drop-off curb',
    station: 'st_airport', interior: false,
    hours: DAILY(0, 24),
    offers: { functions: ['bench', 'taxi_rank'] },
    priceMult: 1, jobId: null, blurb: 'Where it all started. Good plane-spotting from the curb.' },

  // ---------------------------------------------------------------- street food stands
  { id: 'stand_hotdog', name: "Frank's Franks", type: 'stall', district: 'park', where: 'Central Park main gate',
    station: 'st_central', interior: false,
    hours: DAILY(11, 20),
    offers: { menu: true, functions: ['till'] }, priceMult: 1, jobId: null, blurb: 'Hot dogs with everything.' },
  { id: 'stand_coffee', name: 'Little Drip Coffee Cart', type: 'stall', district: 'downtown', where: 'Central Station plaza',
    station: 'st_central', interior: false,
    hours: [[6, 15], [6, 15], [6, 15], [6, 15], [6, 15], [8, 14], null],
    offers: { menu: true, functions: ['till'] }, priceMult: 1, jobId: null, blurb: 'Commuter fuel on wheels.' },
  { id: 'stand_icecream', name: 'Scoop Dreams', type: 'stall', district: 'harbor', where: 'Harborside boardwalk, by the ferris wheel',
    station: 'st_harbor', interior: false, seasons: ['spring', 'summer', 'autumn'],
    hours: DAILY(11, 21),
    offers: { menu: true, functions: ['till'] }, priceMult: 1, jobId: null, blurb: 'Two scoops and a sea breeze. Closed in winter.' },
  { id: 'stand_taco', name: 'Taco Luna', type: 'stall', district: 'arts', where: 'Arts Quarter, parked outside The Blue Heron',
    station: 'st_arts', interior: false,
    hours: [null, [17, 25], [17, 25], [17, 25], [17, 26], [12, 26], [12, 22]],
    offers: { menu: true, functions: ['till'] }, priceMult: 1, jobId: null, blurb: 'Late-night tacos from a moon-painted truck.' },
  { id: 'market_stalls', name: 'Old Town Market', type: 'stall', district: 'oldtown', where: 'Market street, Old Town (doubles in size for the Saturday Farmers\' Market)',
    station: 'st_oldtown', interior: false,
    hours: [null, [9, 15], [9, 15], [9, 15], [9, 15], [8, 14], null],
    offers: { menu: true, shop: ['ingredient', 'gift', 'snack', 'drink'], functions: ['till'] },
    priceMult: 0.8, // produce is cheaper AND fresher here: +2 days shelf life on anything bought (see items.js)
    jobId: null, blurb: 'Crates of vegetables, buckets of flowers, a man who only sells honey.' },
];

// ---------------------------------------------------------------------------------------------
// SERVICES — counter services that are not inventory items.
//   id, name, venue, price, minutes (time it takes), effect (plain-language + data), requires.
// ---------------------------------------------------------------------------------------------
export const SERVICES = [
  { id: 'checkup', name: 'Check-up', venue: 'clinic', price: 30, minutes: 30,
    effect: { moodlet: 'checked_up', removeMoodlets: ['groggy', 'soaked', 'chilly'], needs: { energy: 5 } },
    desc: 'A once-over from the nurse. Clears minor ailments.' },
  { id: 'gym_day_entry', name: 'Day Entry', venue: 'gym', price: 6, minutes: 1,
    effect: { grantsAccess: 'gym', accessMinutes: 1440 },
    desc: 'Same as buying the gym_day_pass item at the till; listed for the front-desk prompt.' },
  { id: 'borrow_book', name: 'Borrow a Book', venue: 'library', price: 0, minutes: 2,
    effect: { lendsItemCategory: 'book', loanDays: 7, maxLoans: 2 },
    desc: 'Take any book home for a week. Late returns just get a gentle reminder text.' },
  { id: 'collect_parcel', name: 'Collect Parcel', venue: 'courier', price: 0, minutes: 2,
    effect: { collectsOnlineOrders: true },
    desc: 'Pick up small online orders yourself instead of waiting for delivery.' },
  { id: 'loan', name: 'Small Loan', venue: 'bank', price: 0, minutes: 10,
    effect: { opens: 'loan_dialog' }, desc: 'See economy.js LOAN.' },
  { id: 'view_property', name: 'View Listings', venue: 'bank', price: 0, minutes: 5,
    effect: { opens: 'property_listings' }, desc: 'Browse homes.js listings; free viewing trips.' },
  { id: 'rent_property', name: 'Sign a Lease', venue: 'bank', price: 0, minutes: 10,
    effect: { opens: 'lease_dialog' }, desc: 'Move to a rented home. First week due on signing.' },
  { id: 'buy_property', name: 'Buy a Home', venue: 'bank', price: 0, minutes: 15,
    effect: { opens: 'mortgage_dialog' }, desc: 'See economy.js MORTGAGE.' },
];

// ---------------------------------------------------------------------------------------------
// POIS — outdoor points of interest with interactive function tags (activities.js).
// Generic street furniture (benches, cats, buskers) is everywhere and not listed.
// ---------------------------------------------------------------------------------------------
export const POIS = [
  { id: 'poi_duck_pond', name: 'Duck Pond', district: 'park', functions: ['duck_pond', 'bench', 'picnic_spot'], blurb: 'Fourteen ducks and one very confident goose.' },
  { id: 'poi_park_loop', name: 'Park Loop', district: 'park', functions: ['jog_path', 'bench'], blurb: 'A 1 km loop under the maples.' },
  { id: 'poi_playground', name: 'Playground', district: 'park', functions: ['swing', 'bench'], blurb: 'Swings are for everyone.' },
  { id: 'poi_riverside_path', name: 'Riverside Path', district: 'park', functions: ['jog_path', 'bench', 'picnic_spot'], blurb: 'Follows the river from the park to the bay.' },
  { id: 'poi_pier', name: 'Fishing Pier', district: 'harbor', functions: ['fishing_spot', 'bench'], blurb: 'Bring a rod. The old-timers will judge your cast.' },
  { id: 'poi_ferris_wheel', name: 'The Bay Wheel', district: 'harbor', functions: ['ferris_wheel'], hours: [12, 23], blurb: 'Fifteen minutes above everything.' },
  { id: 'poi_lighthouse', name: 'Gull Point Lighthouse', district: 'harbor', functions: ['viewpoint', 'bench'], blurb: 'End of the breakwater.' },
  { id: 'poi_lookout', name: 'Hillcrest Lookout', district: 'hillcrest', functions: ['viewpoint', 'bench', 'picnic_spot'], blurb: 'The whole bay at your feet.' },
  { id: 'poi_community_garden', name: 'Maplewood Community Garden', district: 'maplewood', functions: ['garden_plot', 'bench'], blurb: 'Raised beds, shared tools, competitive tomatoes.' },
  { id: 'poi_campus_green', name: 'Campus Green', district: 'arts', functions: ['bench', 'picnic_spot', 'busker'], blurb: 'Students, frisbees, a guitar somewhere.' },
  { id: 'poi_city_plaza', name: 'City Hall Plaza', district: 'downtown', functions: ['bench', 'busker'], blurb: 'Fountain, pigeons, lunch breaks.' },
];

// ---------------------------------------------------------------------------------------------
// STATIONS — light-rail loop. `order` is the suggested clockwise order around the loop (the world
// team may reorder to fit the map; fares do not depend on order, see economy.js).
// ---------------------------------------------------------------------------------------------
export const STATIONS = [
  { id: 'st_airport', name: 'Airport', district: 'airport', order: 0 },
  { id: 'st_railyard', name: 'Railyard', district: 'railyard', order: 1 },
  { id: 'st_central', name: 'Central', district: 'downtown', order: 2 },
  { id: 'st_oldtown', name: 'Old Town', district: 'oldtown', order: 3 },
  { id: 'st_harbor', name: 'Harborside', district: 'harbor', order: 4 },
  { id: 'st_arts', name: 'Arts Quarter', district: 'arts', order: 5 },
  { id: 'st_hillcrest', name: 'Hillcrest', district: 'hillcrest', order: 6 },
  { id: 'st_maplewood', name: 'Maplewood', district: 'maplewood', order: 7 },
];

// Service pattern for the loop and buses (fares live in economy.js).
export const TRANSIT_SERVICE = {
  train: { firstDeparture: 5, lastDeparture: 25, headwayMinutes: { peak: 8, offPeak: 12, night: 20 }, minutesBetweenStations: 6, dwellMinutes: 1,
    peakHours: [[7, 9.5], [16.5, 19]], nightFrom: 22 },
  bus:   { firstDeparture: 5.5, lastDeparture: 24, headwayMinutes: { peak: 10, offPeak: 15, night: 30 } },
  taxi:  { available: [0, 24], pickupWaitMinutes: { hail: 1, phoneMin: 3, phoneMax: 8 } },
};

export const DISTRICTS = [
  { id: 'downtown', name: 'Downtown' }, { id: 'oldtown', name: 'Old Town' }, { id: 'harbor', name: 'Harborside' },
  { id: 'hillcrest', name: 'Hillcrest' }, { id: 'maplewood', name: 'Maplewood' }, { id: 'arts', name: 'Arts Quarter' },
  { id: 'railyard', name: 'Railyard' }, { id: 'park', name: 'Central Park & Riverside' }, { id: 'airport', name: 'Airport' },
];

// Tiny pure helpers -----------------------------------------------------------------------------
export const VENUE_BY_ID = Object.fromEntries(VENUES.map((v) => [v.id, v]));

/** Is a venue open? weekday 0 = Monday; hour is a decimal 0..24. Handles past-midnight closing. */
export const isOpen = (venue, weekday, hour) => {
  const today = venue.hours[weekday];
  if (today && hour >= today[0] && hour < today[1]) return true;
  const yesterday = venue.hours[(weekday + 6) % 7];
  return !!(yesterday && yesterday[1] > 24 && hour < yesterday[1] - 24);
};
