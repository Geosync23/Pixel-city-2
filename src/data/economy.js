// economy.js — money rules for Maple Bay: starting cash, transport fares, weekly rent & bills,
// overdraft, loans, mortgages, tipping, selling, delivery, and the target progression curve that
// every other price in src/data was balanced against. Pure design data. All amounts in dollars.
//
// DESIGN INTENT
//   Money is a pleasant pull, never a wall. An entry job covers a starter studio, food and transit
//   with ~$100-180 a week to spare; every promotion roughly adds a third. Nothing in this file can
//   evict, bankrupt or lock out the player.

export const START = {
  money: 600,
  weekday: 0, season: 'spring', dayOfSeason: 1, hour: 14, // Monday, Spring 1, 14:00
  place: 'airport',
  ownedItems: ['outfit_travel'],
  firstCabPrepaid: true, // story: your sibling pre-paid the airport cab, so the taxi tutorial costs $0
  firstWeekRent: 'paid on arrival when you pick a studio (homes.js rentPerWeek); next rent the following Monday',
};

// ---------------------------------------------------------------------------------------------
// TRANSPORT
// ---------------------------------------------------------------------------------------------
export const FARES = {
  taxi: {
    base: 4,
    perUnit: 0.07,           // per world unit of route length (world ~384 units across)
    nightMult: 1.25, nightHours: [22, 5],
    minFare: 5, maxFare: 38, // capped so a cross-city ride never stings
    airportFlat: 24,         // any ride to or from the airport
    // Typical: within a district $5-8; neighbouring district $9-14; across town $18-26.
    tipOptional: true,
  },
  bus: { single: 1.5 },
  train: { single: 2.5 },    // flat fare, any distance around the loop
  transitPass: { item: 'transit_pass', price: 18, days: 7, covers: ['bus', 'train'] }, // pays off after 8 train rides
  walking: 0,
};

// ---------------------------------------------------------------------------------------------
// WEEKLY BILLS — one combined charge every Monday at 08:00, shown itemised in the Bank app.
// ---------------------------------------------------------------------------------------------
export const BILLS = {
  due: { weekday: 0, hour: 8 },
  reminder: { weekday: 6, hour: 18 }, // Sunday evening phone notification with the amount
  items: [
    { id: 'rent', label: 'Rent', amount: 'homes.js rentPerWeek (if renting)' },
    { id: 'upkeep', label: 'Home upkeep', amount: 'homes.js upkeepPerWeekOwned (if owned)' },
    { id: 'utilities', label: 'Utilities', amount: 'homes.js SIZE_CLASSES[sizeClass].utilitiesPerWeek' },
    { id: 'phone', label: 'Phone plan', amount: 8 },
    { id: 'mortgage', label: 'Mortgage payment', amount: 'see MORTGAGE (if any)' },
    { id: 'loan', label: 'Loan repayment', amount: 'see LOAN (if any)' },
    { id: 'subscriptions', label: 'Auto-renewals', amount: 'gym_membership / transit_pass if set to auto-renew' },
  ],
  phonePlanPerWeek: 8,
};

// ---------------------------------------------------------------------------------------------
// WHEN MONEY RUNS SHORT — gentle by design.
// ---------------------------------------------------------------------------------------------
export const OVERDRAFT = {
  limit: -250,                 // the balance may go this low; no fees, no interest
  moodletBelowZero: 'money_worries',
  blockedWhileNegative: ['homegood', 'outfit', 'gift'], // only wants are blocked; food, transit, bills, clinic always go through
  billsBeyondLimit: 'unpaid part becomes ARREARS: carried to next Monday with no fee; no eviction, ever',
  arrearsNudge: 'after 2 weeks of arrears your sibling texts an offer to cover it (a 0% family IOU repaid at $25/week)',
  essentialsFloor: 'if balance <= limit, FreshWay and Dot\'s Diner still serve you "on the tab" up to $15/day',
};

export const LOAN = {
  venue: 'bank',
  maxByWeek: [ { fromDay: 0, max: 300 }, { fromDay: 14, max: 800 }, { fromDay: 28, max: 1500 } ],
  requiresJob: true,
  fee: 0.05,                   // flat 5% added once; no compounding
  repayWeeks: 6,               // equal instalments on the Monday bill
  oneAtATime: true,
  earlyRepay: 'any time in the Bank app, no charge',
};

export const MORTGAGE = {
  venue: 'bank',
  downPayment: 0.2,            // 20% of buyPrice
  terms: [ // pick one; total repaid = (buyPrice - down) * (1 + fee), split into equal weekly payments
    { weeks: 12, fee: 0.00 },
    { weeks: 24, fee: 0.04 },
    { weeks: 48, fee: 0.08 },
  ],
  missedPayment: 'term extends by one week; no fee, no repossession',
  payOffEarly: 'any time, remaining fee waived',
  // Example: The Marlowe 1BR $9,000 -> $1,800 down, then $312/week for 24 weeks (rent would be $290).
};

// ---------------------------------------------------------------------------------------------
// TIPPING (player as customer) — optional prompt at table-service venues.
// ---------------------------------------------------------------------------------------------
export const TIPPING = {
  venues: ['diner', 'ramen', 'restaurant', 'bar', 'cafe'],
  options: [
    { pct: 0, effect: {} },
    { pct: 0.10, effect: { relationshipWithStaff: 1 } },
    { pct: 0.20, effect: { relationshipWithStaff: 2, fun: 1 } },
  ],
  taxiOptions: [0, 1, 2],
  // Tips the PLAYER earns on shift are in jobs.js (`tips`).
};

// ---------------------------------------------------------------------------------------------
// SELLING & DISCOUNTS
// ---------------------------------------------------------------------------------------------
export const SELL_BACK = {
  homegood: 0.5,   // sold from build mode; Nest & Wire collects it
  outfit: 0.25,
  book: 0.4,       // at Dog-Eared Books
  misc: 0.25,
  fish: 3,         // $ per caught fish sold at market_stalls
  gardenProduce: 0.6, // of list price at market_stalls
  painting: 'items.js painting.sellBase + sellPerCreativityLevel * level, x easel artValueMult',
  home: 0.9,       // of buyPrice (minus any outstanding mortgage) when you buy another home
  food: 0,
};

export const DISCOUNTS = {
  staff: { barista: { venue: 'cafe', mult: 0.8 }, grocery_clerk: { venue: 'grocery', mult: 0.85 }, line_cook: { venue: 'diner', mult: 0.8 } },
  events: 'see calendar.js EVENTS[].special.discounts',
  stacking: 'multiply, floor at 0.5 of list price',
};

export const DELIVERY = {
  homegoodsNextMorningHour: 9, homegoodsFee: 0,  // Nest & Wire: free, arrives 09:00 next day as delivery boxes
  sameDayFee: 15, sameDayHours: 3,
  assemblyFee: 10,                               // per item, or do it yourself (activities.js assemble_furniture)
  onlineOrderFee: 5,                             // per online order from the home computer
  foodDelivery: { app: 'delivery', fee: 4, serviceRate: 0.15, minutes: [30, 45], homeOnly: true },
};

export const PRICE_RULES = {
  rounding: 'after all multipliers, round to the nearest $0.25',
  venuePriceMult: 'venues.js priceMult (Lucky Corner 1.2, Old Town Market 0.8)',
};

// ---------------------------------------------------------------------------------------------
// TYPICAL WEEKLY BUDGET (starter studio, level-1 entry job, cooks most meals)
// ---------------------------------------------------------------------------------------------
export const TYPICAL_WEEK = {
  income: { entryJobBase: [360, 640], tipsAndTaskBonuses: [20, 120], gigs: [0, 120] },
  spending: { rent: [130, 170], utilitiesAndPhone: 28, groceries: [45, 65], eatingOut: [20, 50], transit: 18, fun: [10, 30] },
  leftOver: [90, 250],
};

// ---------------------------------------------------------------------------------------------
// PROGRESSION TARGETS — what a relaxed player should be able to afford, by end of week N.
// `cashOnHand` is after that Monday's bills. Use as tuning asserts, not as gates.
// ---------------------------------------------------------------------------------------------
export const PROGRESSION = [
  { week: 1, cashOnHand: [450, 750], jobLevel: 1,
    canAfford: ['first week rent + taxi home', 'a fridge full of groceries', 'transit_pass', 'microwave_t0', 'sofa_t0 or tv_t0', 'one meal out a day'],
    feeling: 'Settled in. Found a job. The studio has a couch.' },
  { week: 2, cashOnHand: [600, 1100], jobLevel: 2,
    canAfford: ['gym_membership', 'computer_t0', 'tv_t0 + game_t0', 'outfit_smart_casual', 'a few plants and a rug (homey)'],
    feeling: 'First promotion. Starting hobbies. Dinner out with a friend.' },
  { week: 4, cashOnHand: [1300, 2400], jobLevel: 2,
    canAfford: ['bed_t1', 'stove_t1', 'fridge_t1', 'tv_t1', 'a night at The Gilded Gull', 'moving to The Marlowe (rent) is possible'],
    feeling: 'A proper home. A skill or two at level 4-5. Maybe a better job.' },
  { week: 8, cashOnHand: [3500, 6500], jobLevel: 3,
    canAfford: ['down payment on The Marlowe ($1,800) or Cannery Row Loft ($2,600)', 'two or three tier-2 pieces', 'cozy_home ambience'],
    feeling: 'End of year one. Owning (or about to own) a place. Level 3 title.' },
  { week: 16, cashOnHand: [9000, 16000], jobLevel: 4,
    canAfford: ['12 Sycamore Street down payment ($4,000) with comfortable payments', 'mostly tier-2 home'],
    feeling: 'Top of a career. A house full of friends.' },
  { week: 32, cashOnHand: [20000, 40000], jobLevel: 4,
    canAfford: ['Villa Belvedere or The Beacon Penthouse on a 48-week mortgage'],
    feeling: 'The long-term dream, for players who want one.' },
];
