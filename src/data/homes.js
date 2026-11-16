// homes.js — housing: the four starter studios, the five homes you can move up to, what a studio
// contains on day 1, moving boxes, size classes and the home ambience tiers. Pure design data.
//
// HOMES[] fields
//   id              home id.
//   name            building / address name.
//   kind            'starter_studio' | 'apartment' | 'loft' | 'house' | 'villa' | 'penthouse'.
//   district        district id;  station = nearest train station id (venues.js STATIONS).
//   where           one-line location hint for level designers.
//   sizeClass       key of SIZE_CLASSES (furniture slots, utilities; its `tiles` is only a rough class size).
//   tiles           [w, d] real floor size of this home's main room (src/scenes/rooms/homes.js SHELLS: every home is a different size and shape).
//   layout          one or two sentences on what makes this floor plan its own (shown in the listing).
//   rentPerWeek     weekly rent if rented (null = cannot be rented).
//   buyPrice        purchase price (null = cannot be bought). Mortgage terms: economy.js MORTGAGE.
//   upkeepPerWeekOwned  maintenance + building fee per week once OWNED (replaces rent).
//                   Utilities (SIZE_CLASSES[..].utilitiesPerWeek) are charged on top, rented or owned.
//   rooms           [{ id, name, suggested: [home function tags] }] — `suggested` is what the
//                   catalogue/build mode proposes for the room; nothing is enforced.
//   maxGuests       how many NPCs can be invited over at once.
//   included        item ids (items.js) already in the home when you move in, placed in rooms.
//   pros / cons     listing bullet points.
//   perk            { id, desc, effect } one light mechanical quirk of the address.
//   unlock          when the listing appears at Bay Realty & Trust: { day: absolute game day (0 = first Monday) }.
//   blurb           listing headline.

import { MORE_HOMES } from './homes_more.js';

export const SIZE_CLASSES = {
  nook:   { label: 'Tiny',   tiles: [6, 5], furnitureSlots: 9, utilitiesPerWeek: 12 },      // more homes: the attic room that is cheaper than a starter studio
  studio: { label: 'Studio', tiles: [7, 6], furnitureSlots: 14, utilitiesPerWeek: 20 },
  small:  { label: 'Small',  tiles: [10, 8], furnitureSlots: 24, utilitiesPerWeek: 30 },
  medium: { label: 'Medium', tiles: [13, 10], furnitureSlots: 34, utilitiesPerWeek: 40 },
  large:  { label: 'Large',  tiles: [16, 12], furnitureSlots: 48, utilitiesPerWeek: 55 },
  xlarge: { label: 'Grand',  tiles: [20, 14], furnitureSlots: 64, utilitiesPerWeek: 80 },
};

// What EVERY starter studio contains on day 1 (each studio adds one unique freebie, see `included`).
// There is deliberately no microwave, sofa, TV or computer: those are the first week's small goals.
export const STARTER_KIT = ['bed_t0', 'fridge_t0', 'stove_t0', 'shower_t0'];

// Three moving boxes wait in the studio. Unpacking one (activities.js unpack_boxes, 20 min) gives its
// contents; unpacking the last one applies the 'unpacked' moodlet. Purely a cosy first-evening ritual.
export const MOVING_BOXES = [
  { id: 'box_kitchen', label: 'KITCHEN (fragile!!)', gives: [{ item: 'instant_ramen', qty: 2 }, { item: 'granola_bar', qty: 2 }, { item: 'rice', qty: 1 }, { item: 'pasta', qty: 1 }] },
  { id: 'box_bedroom', label: 'BEDROOM', gives: [{ item: 'outfit_pajamas', qty: 1 }, { item: 'decor_t0', qty: 1 }, { item: 'novel_lighthouse', qty: 1 }] },
  { id: 'box_misc', label: 'MISC / ???', gives: [{ item: 'music_t0', qty: 1 }, { item: 'umbrella', qty: 1 }, { item: 'gift_postcards', qty: 1 }] },
];
// The suitcase you towed home from the airport (sim/luggage.js, owner msg 165): it stands by the front door as a fourth intro "moving box" and unpacks the same way.
export const SUITCASE_BOX = { id: 'box_suitcase', label: 'SUITCASE', gives: [{ item: 'outfit_tee_jeans', qty: 1 }, { item: 'outfit_sport', qty: 1 }] };
export const MOVING_BOXES_DONE_MOODLET = 'unpacked';

// Home ambience: sum of `bonus.ambience` of all placed home goods (drooping plants count 0).
// The highest tier reached applies its moodlet while you are at home.
export const AMBIENCE_TIERS = [
  { min: 24, moodlet: 'dream_home' },
  { min: 14, moodlet: 'cozy_home' },
  { min: 6, moodlet: 'homey' },
];

const STUDIO_ROOMS = [
  { id: 'main', name: 'Main Room', suggested: ['bed', 'fridge', 'stove', 'microwave', 'sofa', 'tv', 'bookshelf', 'music', 'plant', 'rug', 'decor'] },
  { id: 'bath', name: 'Bathroom', suggested: ['shower'] },
];

export const HOMES = [
  // ------------------------------------------------------------------ starter studios (pick one at game start)
  { id: 'juniper_court', tiles: [7, 9],
    layout: 'L-shaped walk-up: the stairwell cuts a corner out of the room. Bare brick, a bay window seat, the bakery flue warming one corner; tiny tiled shower room.', name: 'Juniper Court', kind: 'starter_studio', district: 'oldtown', station: 'st_oldtown',
    where: 'Old Town, second floor of a brick rowhouse above the market street',
    sizeClass: 'studio', rentPerWeek: 160, buyPrice: null, upkeepPerWeekOwned: null,
    rooms: STUDIO_ROOMS, maxGuests: 2, included: [...STARTER_KIT, 'bookshelf_t0'],
    pros: ['Cafe, bakery, corner store and ramen within a minute\'s walk', 'A bay window seat, and the bakery flue keeps one corner warm', 'Grandma lives around the corner', 'Saturday market on the doorstep'],
    cons: ['One window, and it looks at the neighbours\' bricks', 'Market set-up noise early on Saturdays'],
    perk: { id: 'bakery_mornings', desc: 'You wake to the smell of fresh bread.', effect: { wakeFunBonus: 3 } },
    unlock: { day: 0 }, blurb: 'Cobbles, brick and the best croissant in town downstairs.' },
  { id: 'saltbox_lofts', tiles: [10, 6],
    layout: 'One long, low room under a high whitewashed ceiling: two tall sea windows, a boarded sleeping nook with a porthole, galley at the far end; porthole shower room.', name: 'Saltbox Lofts', kind: 'starter_studio', district: 'harbor', station: 'st_harbor',
    where: 'Harborside, top corner of a converted net-loft on the boardwalk',
    sizeClass: 'studio', rentPerWeek: 150, buyPrice: null, upkeepPerWeekOwned: null,
    rooms: STUDIO_ROOMS, maxGuests: 2, included: [...STARTER_KIT, 'rug_t0'],
    pros: ['Tall sea windows, a porthole over the bed and the pier next door', 'Two extra furniture slots (high ceilings)', 'Close to Pier 7 Freight and The Gilded Gull'],
    cons: ['Nearest grocery is a train ride away', 'Foggy mornings'],
    perk: { id: 'sea_air', desc: 'Sea air does you good.', effect: { sleepEnergyMult: 1.05, extraFurnitureSlots: 2 } },
    unlock: { day: 0 }, blurb: 'Gulls for neighbours, sunrise for an alarm clock.' },
  { id: 'easel_house', tiles: [8, 8],
    layout: 'The mustard box in the corner is the bathroom and the room wraps around it: sleeping alcove, studio corner on paint-splattered concrete under a strip of north light.', name: 'The Easel House', kind: 'starter_studio', district: 'arts', station: 'st_arts',
    where: 'Arts Quarter, a mural-covered walk-up between the cinema and the campus green',
    sizeClass: 'studio', rentPerWeek: 170, buyPrice: null, upkeepPerWeekOwned: null,
    rooms: STUDIO_ROOMS, maxGuests: 3, included: [...STARTER_KIT, 'easel_t0'],
    pros: ['Library, cinema, pizza and The Blue Heron on your street', 'A studio corner under north light (the floor is already paint-splattered)', 'Your old school friend works nearby', 'Room for one more guest'],
    cons: ['Highest starter rent', 'Lively street on Friday and Saturday nights'],
    perk: { id: 'creative_block', desc: 'The whole building hums with projects.', effect: { xpMultAtHome: { creativity: 1.1 } } },
    unlock: { day: 0 }, blurb: 'Paint on the stairs, music through the floor, inspiration included.' },
  { id: 'birch_lane_flats', tiles: [9, 7],
    layout: 'Garden-level dog-leg room with striped wallpaper: carpeted bed corner, a garden window full of pots, the bathroom tucked behind the kitchen wall.', name: 'Birch Lane Flats', kind: 'starter_studio', district: 'maplewood', station: 'st_maplewood',
    where: 'Maplewood, ground floor of a low block with a shared garden',
    sizeClass: 'studio', rentPerWeek: 130, buyPrice: null, upkeepPerWeekOwned: null,
    rooms: STUDIO_ROOMS, maxGuests: 2, included: [...STARTER_KIT, 'plant_t0'],
    pros: ['Cheapest rent in town', 'Garden window with the landlady\'s pots', 'FreshWay Market and the community garden nearby', 'Your sibling lives two streets away', 'Quiet nights'],
    cons: ['Longest commute to Downtown and the Arts Quarter', 'Not much open after 21:00'],
    perk: { id: 'leafy_and_quiet', desc: 'Nothing but crickets.', effect: { sleepEnergyMult: 1.05 } },
    unlock: { day: 0 }, blurb: 'Leafy, quiet, friendly. The sensible choice (your sibling says so).' },

  // ------------------------------------------------------------------ moving up
  { id: 'marlowe_1br', tiles: [11, 9],
    layout: 'Pre-war layout: a walled bedroom with its own doorway, chequered kitchen behind a breakfast bar, picture rail, a window on the skyline; chequered bathroom.', name: 'The Marlowe, Apt 5C', kind: 'apartment', district: 'downtown', station: 'st_central',
    where: 'Downtown, mid-rise two blocks from Central Station',
    sizeClass: 'small', rentPerWeek: 290, buyPrice: 9000, upkeepPerWeekOwned: 45,
    rooms: [
      { id: 'living', name: 'Living Room & Kitchenette', suggested: ['sofa', 'tv', 'fridge', 'stove', 'microwave', 'bookshelf', 'music', 'game', 'plant', 'rug', 'decor'] },
      { id: 'bedroom', name: 'Bedroom', suggested: ['bed', 'computer', 'decor', 'rug', 'plant'] },
      { id: 'bath', name: 'Bathroom', suggested: ['shower', 'bath'] },
    ],
    maxGuests: 4, included: ['shower_t0', 'fridge_t0', 'stove_t1'],
    pros: ['Five minutes from offices, shops, gym and the bank', 'A real bedroom door', 'Comes with a proper range'],
    cons: ['City noise', 'No outdoor space'],
    perk: { id: 'central_living', desc: 'Everything is close.', effect: { taxiFareMultFromHome: 0.9 } },
    unlock: { day: 7 }, blurb: 'One bedroom in the middle of everything.' },
  { id: 'cannery_loft', tiles: [14, 10],
    layout: 'One raw brick hall: arched factory windows on the bay, cast-iron columns under riveted beams, a sleeping platform of old boards, a sunlit studio nook.', name: 'Cannery Row Loft', kind: 'loft', district: 'harbor', station: 'st_harbor',
    where: 'Harborside, top floor of the old sardine cannery, brick and iron beams',
    sizeClass: 'medium', rentPerWeek: 360, buyPrice: 13000, upkeepPerWeekOwned: 60,
    rooms: [
      { id: 'open_plan', name: 'Open-Plan Living', suggested: ['sofa', 'tv', 'game', 'music', 'bookshelf', 'rug', 'plant', 'decor', 'instrument'] },
      { id: 'kitchen', name: 'Kitchen Corner', suggested: ['fridge', 'stove', 'microwave', 'plant'] },
      { id: 'mezzanine', name: 'Sleeping Mezzanine', suggested: ['bed', 'decor', 'rug'] },
      { id: 'studio_nook', name: 'Studio Nook', suggested: ['easel', 'computer', 'exercise'] },
      { id: 'bath', name: 'Bathroom', suggested: ['shower', 'bath'] },
    ],
    maxGuests: 6, included: ['shower_t1', 'fridge_t1', 'stove_t1'],
    pros: ['Huge windows over the bay', 'A nook made for an easel or a home gym', 'Great for parties'],
    cons: ['Drafty in winter', 'Groceries are still a train ride away'],
    perk: { id: 'north_light', desc: 'Artists pay extra for light like this.', effect: { xpMultAtHome: { creativity: 1.1 }, ambienceBonus: 2 } },
    unlock: { day: 14 }, blurb: 'Brick, beams and a wall of glass.' },
  { id: 'sycamore_house', tiles: [17, 12],
    layout: 'A real house: kitchen-diner, fireplace lounge, walled main bedroom, stairs, and a back garden behind a picket fence with a vegetable bed; family bathroom with tub and shower.', name: '38 Sycamore Street', kind: 'house', district: 'maplewood', station: 'st_maplewood',
    where: 'Maplewood, yellow two-storey house with a porch and a small back garden',
    sizeClass: 'large', rentPerWeek: 480, buyPrice: 20000, upkeepPerWeekOwned: 85,
    rooms: [
      { id: 'living', name: 'Living Room', suggested: ['sofa', 'tv', 'game', 'music', 'bookshelf', 'rug', 'plant', 'decor'] },
      { id: 'kitchen', name: 'Kitchen-Diner', suggested: ['fridge', 'stove', 'microwave', 'plant', 'decor'] },
      { id: 'master', name: 'Main Bedroom', suggested: ['bed', 'decor', 'rug', 'plant'] },
      { id: 'second_bed', name: 'Second Bedroom / Guest Room', suggested: ['bed', 'bookshelf', 'decor'] },
      { id: 'study', name: 'Study', suggested: ['computer', 'bookshelf', 'instrument', 'easel'] },
      { id: 'bath', name: 'Bathroom', suggested: ['shower', 'bath'] },
      { id: 'garden', name: 'Back Garden', suggested: ['plant', 'exercise', 'decor'] },
    ],
    maxGuests: 8, included: ['shower_t1', 'bath_t0', 'fridge_t1', 'stove_t1'],
    pros: ['Your own garden (a private garden bed: the `garden` activity at home)', 'Guest room: friends and family can stay over', 'Next to your sibling, the school and FreshWay'],
    cons: ['Long ride to nightlife', 'A lot of rooms to furnish'],
    perk: { id: 'home_garden', desc: 'A vegetable bed out back.', effect: { homeGardenPlot: true } },
    unlock: { day: 28 }, blurb: 'A porch swing, a garden, and room for everyone at dinner.' },
  { id: 'villa_belvedere', tiles: [18, 14],
    layout: 'White stone and arches: terrace doors over the bay, an arch into the chef\'s kitchen, a columned loggia onto the balustraded terrace with lemon trees; stone bathroom.', name: 'Villa Belvedere', kind: 'villa', district: 'hillcrest', station: 'st_hillcrest',
    where: 'Hillcrest, terraced white villa just below the lookout',
    sizeClass: 'xlarge', rentPerWeek: null, buyPrice: 36000, upkeepPerWeekOwned: 140,
    rooms: [
      { id: 'salon', name: 'Salon', suggested: ['sofa', 'tv', 'music', 'instrument', 'rug', 'plant', 'decor'] },
      { id: 'kitchen', name: 'Chef\'s Kitchen', suggested: ['fridge', 'stove', 'microwave', 'plant'] },
      { id: 'dining', name: 'Dining Room', suggested: ['decor', 'rug', 'plant'] },
      { id: 'master', name: 'Master Suite', suggested: ['bed', 'bath', 'decor', 'rug'] },
      { id: 'guest', name: 'Guest Room', suggested: ['bed', 'decor'] },
      { id: 'library', name: 'Library', suggested: ['bookshelf', 'computer', 'sofa', 'decor'] },
      { id: 'gym', name: 'Home Gym', suggested: ['exercise', 'music'] },
      { id: 'bath', name: 'Bathroom', suggested: ['shower', 'bath'] },
      { id: 'terrace', name: 'Terrace', suggested: ['plant', 'easel', 'decor'] },
    ],
    maxGuests: 12, included: ['shower_t2', 'bath_t1', 'fridge_t1', 'stove_t2'],
    pros: ['The view: the terrace counts as a `viewpoint` (enjoy_view, stargaze at home)', 'Space for every hobby', 'Hillcrest quiet'],
    cons: ['A lot of stairs up from the station', 'Highest upkeep outside the penthouse'],
    perk: { id: 'terrace_view', desc: 'The whole bay from your breakfast table.', effect: { homeViewpoint: true, ambienceBonus: 4 } },
    unlock: { day: 42 }, blurb: 'Terraces, lemon trees and the city at your feet.' },
  { id: 'beacon_penthouse', tiles: [19, 13],
    layout: 'Walls of glass on the skyline, a sunken lounge, a glazed master suite and a roof terrace; a bathroom with a view.', name: 'The Beacon Penthouse', kind: 'penthouse', district: 'downtown', station: 'st_central',
    where: 'Downtown, top two floors of the Beacon Tower, private lift',
    sizeClass: 'xlarge', rentPerWeek: null, buyPrice: 52000, upkeepPerWeekOwned: 180,
    rooms: [
      { id: 'great_room', name: 'Great Room', suggested: ['sofa', 'tv', 'game', 'music', 'instrument', 'rug', 'plant', 'decor'] },
      { id: 'kitchen', name: 'Show Kitchen', suggested: ['fridge', 'stove', 'microwave'] },
      { id: 'master', name: 'Master Suite', suggested: ['bed', 'bath', 'decor', 'rug'] },
      { id: 'guest', name: 'Guest Suite', suggested: ['bed', 'shower', 'decor'] },
      { id: 'office', name: 'Home Office', suggested: ['computer', 'bookshelf', 'decor'] },
      { id: 'bath', name: 'Bathroom', suggested: ['shower', 'bath'] },
      { id: 'roof_terrace', name: 'Roof Terrace', suggested: ['plant', 'exercise', 'easel', 'decor'] },
    ],
    maxGuests: 12, included: ['shower_t2', 'bath_t2', 'fridge_t2', 'stove_t2'],
    pros: ['The best address in Maple Bay', 'Roof terrace with fireworks view (Summer Fireworks and New Year visible from home)', 'Doorman holds your deliveries: same-day delivery is free'],
    cons: ['The price', 'The upkeep'],
    perk: { id: 'top_of_the_town', desc: 'You made it.', effect: { homeViewpoint: true, ambienceBonus: 6, freeSameDayDelivery: true } },
    unlock: { day: 56 }, blurb: 'Above the clouds on a foggy day. The end-game home.' },
];

// MORE HOMES (owner msg 107): nine houses and five apartments in buildings that already stand in the city (data: homes_more.js).
HOMES.push(...MORE_HOMES);

// PRE-FURNISHED or FURNISH IT YOURSELF (every home, old and new).
//   Pre-furnished: the designer's set (src/scenes/rooms/home_more.js SETS) stands in the rooms on move-in. You pay a ONE-OFF furniture package on top of the
//   first costs: `rate` x the list price of the pieces (so it is cheaper than buying them one by one), and every piece is YOURS: it moves with you, you can sell it.
//   Furnish it yourself: the rooms are empty apart from the landlord's kitchen and bathroom (`included`). If you own no bed, a camp mattress (`kitBed`) lies
//   on the bedroom floor, and a welcome box (`kitGives`) holds a few meals. Nothing extra to pay.
export const FURNISH = { rate: 0.6, kitBed: 'bed_t0', kitGives: [{ item: 'instant_ramen', qty: 2 }, { item: 'granola_bar', qty: 2 }, { item: 'tea', qty: 2 }] };

export const HOME_BY_ID = Object.fromEntries(HOMES.map((h) => [h.id, h]));
export const STARTER_HOMES = HOMES.filter((h) => h.kind === 'starter_studio');

// Moving rules (kept simple and kind).
export const MOVING = {
  moveFee: 40,                 // a van moves ALL your furniture; it arrives placed in a pile of delivery-free boxes
  includedItemsStay: true,     // `included` items belong to the home you leave unless you bought them
  starterLease: 'weekly, cancel any Monday at no cost',
  ownMoreThanOne: false,       // selling the old home is automatic when you buy a new one (economy.js SELL_BACK.home)
};
