// calendar.js — time, date, day parts, seasons, weather and the city events calendar.
// Pure design data plus a few tiny pure date helpers.
//
// TIME MODEL
//   1 game minute = 1 real second at 1x. A day = 1440 game minutes = 24 real minutes.
//   Week = 7 days (Monday first). Month = 14 days = one season. Year = 4 seasons = 56 days = 8 weeks,
//   so every season starts on a Monday and day-of-season N always falls on the same weekday:
//     days 1-7  = Mon..Sun of week A,  days 8-14 = Mon..Sun of week B.
//   "Absolute day" = days since the game started; day 0 = Monday, Spring 1.
//   Hours are decimals (14.5 = 14:30). Ranges that pass midnight use end > 24.

export const TIME = {
  realSecondsPerGameMinute: 1,
  minutesPerDay: 1440, daysPerWeek: 7, daysPerSeason: 14, seasonsPerYear: 4, daysPerYear: 56,
  speeds: { normal: 1, fast: 3, sleep: 60, autoWork: 30, movie: 20, waitingForTransit: 6 }, // multipliers on game time
  autoPause: ['phone_open_in_tutorial', 'dialogue_choice', 'shop_ui'], // time stops in menus that need thought
};

export const WEEKDAYS = [
  { id: 'mon', name: 'Monday', short: 'Mon', weekend: false },
  { id: 'tue', name: 'Tuesday', short: 'Tue', weekend: false },
  { id: 'wed', name: 'Wednesday', short: 'Wed', weekend: false },
  { id: 'thu', name: 'Thursday', short: 'Thu', weekend: false },
  { id: 'fri', name: 'Friday', short: 'Fri', weekend: false },
  { id: 'sat', name: 'Saturday', short: 'Sat', weekend: true },
  { id: 'sun', name: 'Sunday', short: 'Sun', weekend: true },
];

// sunrise/sunset drive the day-night lighting; tempC is flavour for the weather widget.
export const SEASONS = [
  { id: 'spring', name: 'Spring', index: 0, sunrise: 6, sunset: 19.5, tempC: [9, 18], palette: 'fresh greens, pink blossom', blurb: 'Blossom on the maples, showers off the bay.' },
  { id: 'summer', name: 'Summer', index: 1, sunrise: 5, sunset: 21, tempC: [17, 29], palette: 'deep greens, golden light', blurb: 'Long evenings, ice cream, boardwalk crowds.' },
  { id: 'autumn', name: 'Autumn', index: 2, sunrise: 6.5, sunset: 18.5, tempC: [7, 17], palette: 'red and amber maples', blurb: 'The city turns red and gold. Fog on the harbour.' },
  { id: 'winter', name: 'Winter', index: 3, sunrise: 7.5, sunset: 17, tempC: [-4, 5], palette: 'blue-white snow, warm windows', blurb: 'Snow on the terraces, lights in every window.' },
];

// Day parts: [from, to) hours. `ambient` hints lighting; `npcDensity` multiplies crowd density.
export const DAY_PARTS = [
  { id: 'night', name: 'Night', from: 0, to: 5, ambient: 'deep blue, lit windows, street lamps', npcDensity: 0.15 },
  { id: 'dawn', name: 'Dawn', from: 5, to: 7, ambient: 'pink-orange horizon, long shadows', npcDensity: 0.35 },
  { id: 'morning', name: 'Morning', from: 7, to: 11, ambient: 'clear warm light', npcDensity: 1.0 },
  { id: 'midday', name: 'Midday', from: 11, to: 14, ambient: 'bright, short shadows', npcDensity: 1.1 },
  { id: 'afternoon', name: 'Afternoon', from: 14, to: 18, ambient: 'golden, lengthening shadows', npcDensity: 1.0 },
  { id: 'evening', name: 'Evening', from: 18, to: 21, ambient: 'sunset then dusk, lamps come on', npcDensity: 0.9 },
  { id: 'late', name: 'Late Evening', from: 21, to: 24, ambient: 'night, neon and windows', npcDensity: 0.45 },
];
// Rush hours add commuters on top (trains fuller, more cars): weekdays only.
export const RUSH_HOURS = [{ from: 7.5, to: 9, npcDensity: 1.3 }, { from: 17, to: 18.5, npcDensity: 1.3 }];

// ---------------------------------------------------------------------------------------------
// WEATHER
//   WEATHER_TYPES[id]:
//     outdoorFunMult   multiplies fun gained from activities flagged `outdoor` (activities.js).
//     npcDensity       multiplies the ambient crowd outdoors.
//     walkSpeedMult    multiplies walking speed outdoors.
//     moodlet          applied while outdoors (null = none); `blockedBy` = outfit style or item id
//                      that prevents it; `afterMinutes` = exposure needed before it triggers.
//     taxiWaitMult     multiplies phone-taxi wait time (fares never surge).
//     visuals          hint for the renderer.
//   WEATHER_BY_SEASON[season][weatherId] = probability (each row sums to 1).
//   Rolling: one roll per day at 05:00 for the main weather, plus WEATHER_RULES.
// ---------------------------------------------------------------------------------------------
export const WEATHER_TYPES = {
  clear:  { name: 'Clear', outdoorFunMult: 1.15, npcDensity: 1.15, walkSpeedMult: 1, moodlet: 'sunny_day', blockedBy: [], afterMinutes: 0, taxiWaitMult: 1, visuals: 'blue sky, crisp shadows, occasional gull' },
  cloudy: { name: 'Cloudy', outdoorFunMult: 1.0, npcDensity: 1.0, walkSpeedMult: 1, moodlet: null, blockedBy: [], afterMinutes: 0, taxiWaitMult: 1, visuals: 'soft flat light, slow cloud shadows' },
  fog:    { name: 'Fog', outdoorFunMult: 0.95, npcDensity: 0.8, walkSpeedMult: 1, moodlet: null, blockedBy: [], afterMinutes: 0, taxiWaitMult: 1.2, visuals: 'pale haze, distant buildings fade, foghorn from the harbour' },
  rain:   { name: 'Rain', outdoorFunMult: 0.75, npcDensity: 0.55, walkSpeedMult: 1, moodlet: 'soaked', blockedBy: ['rain', 'umbrella'], afterMinutes: 10, taxiWaitMult: 1.5, visuals: 'streaks, puddle ripples, umbrellas, reflections' },
  storm:  { name: 'Storm', outdoorFunMult: 0.5, npcDensity: 0.25, walkSpeedMult: 0.9, moodlet: 'soaked', blockedBy: ['rain'], afterMinutes: 5, taxiWaitMult: 2, visuals: 'heavy rain, wind, lightning flashes; ferris wheel and pier fishing closed' },
  snow:   { name: 'Snow', outdoorFunMult: 1.05, npcDensity: 0.7, walkSpeedMult: 0.92, moodlet: 'chilly', blockedBy: ['winter'], afterMinutes: 20, taxiWaitMult: 1.5, visuals: 'drifting flakes, white roofs, footprints', bonusMoodlet: 'first_snow' },
};

export const WEATHER_BY_SEASON = {
  spring: { clear: 0.40, cloudy: 0.25, rain: 0.22, storm: 0.03, snow: 0.00, fog: 0.10 },
  summer: { clear: 0.60, cloudy: 0.18, rain: 0.10, storm: 0.08, snow: 0.00, fog: 0.04 },
  autumn: { clear: 0.28, cloudy: 0.27, rain: 0.22, storm: 0.05, snow: 0.02, fog: 0.16 },
  winter: { clear: 0.27, cloudy: 0.25, rain: 0.06, storm: 0.02, snow: 0.32, fog: 0.08 },
};

export const WEATHER_RULES = {
  rollAtHour: 5,
  persistence: 0.35,            // chance today simply repeats yesterday's weather before rolling
  fogBurnsOffAt: 10,            // fog turns to clear (60%) or cloudy (40%) mid-morning
  stormMaxHours: 4,             // storms are a 2-4 h spell inside an otherwise rainy day, never all day
  rainSpells: 'rain days have 1-2 dry breaks of 1-2 h',
  winterChilly: 'in winter, clear and cloudy days also apply `chilly` after 30 outdoor minutes without a winter outfit',
  forcedClear: 'outdoor seasonal events (EVENTS with special.guaranteedWeather) override the roll',
  forecastDays: 3,              // shown in the Planner app
  day0: 'clear',                // arrival day is always sunny
};

// ---------------------------------------------------------------------------------------------
// EVENTS
//   id         event id (activities.js `requires.event` refers to these).
//   name, blurb
//   kind       'weekly' | 'seasonal' | 'holiday'
//   when       weekly:   { weekday: 0..6 }
//              seasonal/holiday: { season, days: [day-of-season 1..14] }
//   hours      [start, end] (end > 24 = past midnight)
//   place      { venue | poi | district } ids from venues.js
//   special    what is different while it runs. Keys (all optional):
//                crowdMult          ambient crowd multiplier at the place
//                stalls             extra temporary stalls: [{ id, name, sells: [item ids] }]
//                discounts          [{ venue, mult, categories?: [...], items?: [...] }]
//                activities         activity ids enabled/boosted;  funMult for activities at the place
//                moodlet            applied to the player on attending (10+ minutes)
//                fireworks          { atHour, minutes, visibleFrom: [districts] }
//                closures           venue ids closed all day;  paidDayOff = jobs at closed venues are paid
//                guaranteedWeather  weather id forced during the event hours
//                story              hook for the story team
//   notify     hours before start that the phone reminds you (Planner auto-adds all events).
// ---------------------------------------------------------------------------------------------
/* QA11: the blurbs of the small festivals now promise only what is there (sim/calevents.js adds an arrival line, the moodlet and small sky effects) */
export const EVENTS = [
  // ------------------------------------------------------------ weekly
  { id: 'cheap_tuesday', name: 'Two-for-Tuesday at The Orpheum', kind: 'weekly', when: { weekday: 1 }, hours: [12, 24],
    place: { venue: 'cinema' }, blurb: 'Every ticket half price, all day.',
    special: { discounts: [{ venue: 'cinema', mult: 0.5, items: ['movie_ticket'] }], crowdMult: 1.3 }, notify: 3 },
  { id: 'open_mic_wednesday', name: 'Open Mic Night', kind: 'weekly', when: { weekday: 2 }, hours: [20, 23],
    place: { venue: 'bar' }, blurb: 'Poets, ukuleles, one brave magician. Sign up at the bar.',
    special: { activities: ['open_mic'], crowdMult: 1.2 }, notify: 3 },
  { id: 'live_music_friday', name: 'Live at The Blue Heron', kind: 'weekly', when: { weekday: 4 }, hours: [20, 25],
    place: { venue: 'bar' }, blurb: 'A different band every Friday. Gets busy by nine.',
    special: { activities: ['watch_live_music', 'dance'], funMult: 1.2, crowdMult: 1.8, moodlet: 'great_night_out', bartenderTipsMult: 2 }, notify: 4 },
  { id: 'farmers_market', name: 'Saturday Farmers\' Market', kind: 'weekly', when: { weekday: 5 }, hours: [8, 14],
    place: { venue: 'market_stalls' }, blurb: 'The busiest morning on the Old Town market street: fruit and veg 15% off on top of the usual market prices. Come early.',
    special: { crowdMult: 1.8,
      discounts: [{ venue: 'market_stalls', mult: 0.85, categories: ['ingredient'] }], // on top of the market's usual x0.8
      stalls: [
        { id: 'stall_farm', name: 'Hillcrest Farm Stand', sells: ['tomato', 'carrot', 'potato', 'lettuce', 'onion', 'apple', 'berries', 'eggs', 'mushroom', 'garlic', 'herbs', 'spring_onion', 'spinach', 'bell_pepper', 'cucumber', 'cabbage', 'broccoli', 'pumpkin'] },
        { id: 'stall_fish', name: 'Pier Fresh Fish', sells: ['fish', 'salmon', 'shrimp', 'mussels'] },
        { id: 'stall_flowers', name: 'Petal Pushers', sells: ['gift_flowers', 'gift_wildflowers', 'gift_succulent', 'plant_fern'] },
        { id: 'stall_honey', name: 'The Honey Man', sells: ['gift_honey', 'honey', 'maple_syrup', 'jam'] },
        { id: 'stall_treats', name: 'Crepes & Kettle Corn', sells: ['market_crepe', 'kettle_corn', 'market_dumplings'] },
      ],
      sellYourOwn: 'paintings, caught fish and garden produce sell here for +20%',
      story: 'Grandma shops here every Saturday around 9:00.' }, notify: 12 },
  { id: 'sunday_jazz_brunch', name: 'Sunday Jazz Brunch', kind: 'weekly', when: { weekday: 6 }, hours: [12, 15],
    place: { venue: 'restaurant' }, blurb: 'The Gilded Gull loosens its tie: brunch prices, a quarter off the whole menu from twelve till three.',
    special: { discounts: [{ venue: 'restaurant', mult: 0.75 }], funMult: 1.15, dressCodeRelaxed: true }, notify: 3 },

  // ------------------------------------------------------------ seasonal
  { id: 'blossom_festival', name: 'Spring Blossom Festival', kind: 'seasonal', when: { season: 'spring', days: [6, 7] }, hours: [10, 20],
    place: { district: 'park', poi: 'poi_duck_pond' }, blurb: 'Petals on the wind by the Duck Pond, fine weather promised, half the town out on the grass, and paper lanterns on the pond at seven.',
    special: { crowdMult: 2, guaranteedWeather: 'clear', moodlet: 'festival_spirit', funMult: 1.25,
      stalls: [
        { id: 'stall_blossom_tea', name: 'Blossom Tea Tent', sells: ['cafe_tea', 'bakery_fruit_tart'] },
        { id: 'stall_blossom_snacks', name: 'Festival Snacks', sells: ['market_dumplings', 'market_crepe', 'kettle_corn'] },
        { id: 'stall_blossom_flowers', name: 'Cherry Branches', sells: ['gift_flowers', 'gift_wildflowers'] },
      ],
      activities: ['picnic', 'people_watch', 'feed_ducks', 'sketch_outdoors'],
      highlight: 'Paper-lantern launch on the pond at 19:00 (10 min, +10 fun).',
      story: 'Family picnic invitation from your sibling.' }, notify: 24 },
  { id: 'summer_fireworks', name: 'Summer Fireworks', kind: 'seasonal', when: { season: 'summer', days: [10] }, hours: [17, 23],
    place: { district: 'harbor', poi: 'poi_ferris_wheel' }, blurb: 'A busy evening on the boardwalk by the Bay Wheel, fine weather promised, and fireworks over the water at ten.',
    special: { crowdMult: 2.2, guaranteedWeather: 'clear', moodlet: 'festival_spirit',
      fireworks: { atHour: 22, minutes: 15, visibleFrom: ['harbor', 'hillcrest', 'downtown'], moodlet: 'fireworks_awe' },
      stalls: [
        { id: 'stall_fair_food', name: 'Boardwalk Bites', sells: ['stand_hotdog_classic', 'stand_hotdog_pretzel', 'kettle_corn', 'stand_icecream_cone'] },
        { id: 'stall_fair_tacos', name: 'Taco Luna (on tour)', sells: ['stand_taco_single', 'stand_taco_burrito', 'stand_taco_horchata'] },
      ],
      activities: ['ride_ferris_wheel', 'enjoy_view'],
      highlight: 'Riding the Bay Wheel during the fireworks doubles the fireworks_awe duration.',
      transit: 'trains run until 02:00' }, notify: 24 },
  { id: 'boardwalk_days', name: 'Boardwalk Days', kind: 'seasonal', when: { season: 'summer', days: [3, 4] }, hours: [11, 21],
    place: { district: 'harbor', poi: 'poi_pier' }, blurb: 'Two busy days on the pier: half-price scoops at the ice-cream stand, and the rail full of people fishing.',
    special: { crowdMult: 1.6, moodlet: 'festival_spirit',
      discounts: [{ venue: 'stand_icecream', mult: 0.5 }],
      activities: ['fish_pier'],
      highlight: 'Fishing derby: each fish caught today can be weighed in for a $6 prize (instead of $3 sale).' }, notify: 24 },
  { id: 'harvest_fair', name: 'Autumn Harvest Fair', kind: 'seasonal', when: { season: 'autumn', days: [2, 3] }, hours: [9, 19],
    place: { venue: 'market_stalls', district: 'oldtown' }, blurb: 'Market produce a quarter off, the bakery a fifth off, autumn leaves on the wind, and Old Town smells of cinnamon.',
    special: { crowdMult: 2, moodlet: 'festival_spirit',
      discounts: [{ venue: 'market_stalls', mult: 0.75, categories: ['ingredient'] }, { venue: 'bakery', mult: 0.8 }],
      stalls: [
        { id: 'stall_cider', name: 'Cider Press', sells: ['hot_cider', 'apple'] },
        { id: 'stall_chestnuts', name: 'Chestnut Cart', sells: ['market_chestnuts', 'kettle_corn'] },
        { id: 'stall_harvest_gifts', name: 'Preserves & Honey', sells: ['gift_honey', 'gift_candle'] },
      ],
      highlight: 'Bake-off at 15:00 on day 7: enter any home-cooked meal; prize $20-$80 by recipe skill requirement, and a ribbon decor item.',
      story: 'Grandma enters the pie contest and wants a taster.' }, notify: 24 },
  { id: 'lantern_night', name: 'Lantern Night', kind: 'seasonal', when: { season: 'autumn', days: [10] }, hours: [18, 24],
    place: { venue: 'ramen', district: 'oldtown' }, blurb: 'After dark the paper lanterns drift up over Lantern Row, and the ramen bar is a fifth off.',
    special: { crowdMult: 1.8, moodlet: 'festival_spirit', funMult: 1.2,
      discounts: [{ venue: 'ramen', mult: 0.8 }],
      stalls: [{ id: 'stall_lantern_food', name: 'Night Market Grills', sells: ['market_dumplings', 'ramen_gyoza', 'stand_taco_single', 'hot_cider'] }],
      highlight: 'Write a wish on a lantern (5 min, +8 fun, +5 social).' }, notify: 12 },
  { id: 'winter_lights', name: 'Winter Lights Market', kind: 'seasonal', when: { season: 'winter', days: [7, 9, 10, 12, 13] }, hours: [15, 22],
    place: { district: 'downtown', poi: 'poi_city_plaza' }, blurb: 'City Hall Plaza busy under the lights after four, and winter coats and knits a fifth off at Thread & Co.',
    special: { crowdMult: 1.8, moodlet: 'festival_spirit', funMult: 1.2,
      discounts: [{ venue: 'clothing', mult: 0.8, items: ['outfit_winter', 'outfit_knit'] }],
      stalls: [
        { id: 'stall_winter_drinks', name: 'Mug & Mitten', sells: ['hot_cider', 'stand_coffee_cocoa'] },
        { id: 'stall_winter_food', name: 'Chestnuts & Crepes', sells: ['market_chestnuts', 'market_crepe', 'bakery_cinnamon_roll'] },
        { id: 'stall_winter_gifts', name: 'Gift Hut', sells: ['gift_candle', 'gift_teddy', 'gift_chocolates', 'gift_postcards', 'decor_string_lights'] },
      ],
      highlight: 'Tree lighting at 18:00 on day 5.' }, notify: 24 },
  { id: 'season_end_sale', name: 'End-of-Season Sale', kind: 'seasonal', when: { season: 'any', days: [14] }, hours: [10, 19],
    place: { district: 'downtown' }, blurb: 'Thread & Co. and Nest & Wire clear the floor on the last day of every season.',
    special: { discounts: [{ venue: 'clothing', mult: 0.75 }, { venue: 'homegoods', mult: 0.85 }], crowdMult: 1.4 }, notify: 24 },

  // ------------------------------------------------------------ the six BIG CITY EVENTS (staged by sim/cityevents.js from data/cityevents.js; that system sets place.poi = 'cev:<id>' at start-up and resolves it)
  { id: 'blossom_parade', name: 'Blossom Parade', kind: 'seasonal', when: { season: 'spring', days: [13] }, hours: [11, 16],
    place: { district: 'downtown' }, blurb: 'Floats, a marching band and a swan the size of a bus roll down Riverside Drive at one. Petal baskets by the River Walk.',
    special: { bigEvent: true, guaranteedWeather: 'clear', moodlet: 'festival_spirit', highlight: 'Parade at 13:00. Throw petals from the baskets by the River Walk.' }, notify: 24 },
  { id: 'harbor_day', name: 'Harbor Day', kind: 'seasonal', when: { season: 'summer', days: [6] }, hours: [16, 23],
    place: { district: 'harbor' }, blurb: 'Music and food on Dock Street, a parade of lit boats round the pier at half past seven, fireworks from the barge at ten.',
    special: { bigEvent: true, guaranteedWeather: 'clear', moodlet: 'festival_spirit', highlight: 'Boat parade 19:30. Fireworks 22:00: the Harbor Master wants a volunteer at the firing desk on the pier.' }, notify: 24 },
  { id: 'river_fair', name: 'River Walk Summer Fair', kind: 'seasonal', when: { season: 'summer', days: [13] }, hours: [11, 20],
    place: { district: 'downtown' }, blurb: 'A fairground on the River Walk: high striker, ring toss, a band on the stage, and the Rainbow Walk with a giant duck at three.',
    special: { bigEvent: true, moodlet: 'festival_spirit', highlight: 'Rainbow Walk at 15:00. Ring the bell on the high striker to win a bear.' }, notify: 24 },
  { id: 'harvest_parade', name: 'Harvest Festival', kind: 'seasonal', when: { season: 'autumn', days: [6] }, hours: [10, 18],
    place: { district: 'oldtown' }, blurb: 'Hay bales and pumpkins fill Market Square, the tractor parade does laps of Chandler Street at two, and you can ride the hay wagon.',
    special: { bigEvent: true, moodlet: 'festival_spirit', highlight: 'Tractor parade at 14:00. Press cider at the big press on the square.' }, notify: 24 },
  { id: 'lantern_parade', name: 'Lantern Night Dragon Walk', kind: 'seasonal', when: { season: 'autumn', days: [13] }, hours: [18, 24],
    place: { district: 'oldtown' }, blurb: 'The paper dragon dances down Chandler Street into Lantern Row at eight; at half past nine the wish lanterns go up.',
    special: { bigEvent: true, moodlet: 'festival_spirit', highlight: 'Dragon at 20:00. Write a wish at the table on Lantern Row; lanterns rise at 21:30.' }, notify: 12 },
  { id: 'winter_parade', name: 'Winter Lights Parade', kind: 'seasonal', when: { season: 'winter', days: [5] }, hours: [15.5, 21],
    place: { district: 'downtown' }, blurb: 'Floats covered in lights roll past City Hall at five, and at six the giant tree on the plaza is lit.',
    special: { bigEvent: true, moodlet: 'festival_spirit', highlight: 'Parade at 17:00. Tree lighting at 18:00: somebody has to throw the switch.' }, notify: 24 },

  // ------------------------------------------------------------ holidays
  { id: 'founders_day', name: "Founders' Day", kind: 'holiday', when: { season: 'summer', days: [1] }, hours: [0, 24],
    place: { district: 'downtown', poi: 'poi_city_plaza' }, blurb: 'Maple Bay turns another year older. Free cake on the plaza, all day.',
    special: { closures: ['office', 'bank', 'library', 'courier', 'warehouse'], paidDayOff: true, crowdMult: 1.6, moodlet: 'holiday_cheer',
      highlight: 'Parade along the Downtown avenue 12:00-13:00; free slice of cake at the plaza (hunger +15, fun +10).' }, notify: 24 },
  { id: 'gratitude_supper', name: 'Gratitude Supper', kind: 'holiday', when: { season: 'autumn', days: [11] }, hours: [0, 24],
    place: { district: 'maplewood' }, blurb: 'A holiday: Maplewood talks of nothing but the supper it is cooking tonight. Shops, offices and shifts keep their usual hours.',   /* QA12: the closures, the day off and the family supper below are not built yet */
    special: { closures: ['office', 'bank', 'library', 'courier', 'warehouse', 'clothing', 'homegoods'], paidDayOff: true, moodlet: 'holiday_cheer',
      story: 'Dinner at your sibling\'s at 18:00 with grandma: bring any home-cooked dish for a big relationship boost and `family_time`.' }, notify: 24 },
  { id: 'midwinter_day', name: 'Midwinter Day', kind: 'holiday', when: { season: 'winter', days: [11] }, hours: [0, 24],
    place: { district: 'oldtown' }, blurb: 'The shortest day of the year. Old Town talks of candles and gifts; shops, offices and shifts keep their usual hours.',   /* QA12: the closures, the day off and the gift exchange at Nana\'s are not built yet */
    special: { closures: ['office', 'bank', 'library', 'courier', 'warehouse', 'clothing', 'homegoods', 'gym'], paidDayOff: true, moodlet: 'holiday_cheer',
      giftRelationshipMult: 1.5,
      story: 'Gift exchange at grandma\'s at 16:00; every contact with friendship level "friend" or higher sends a small gift by message.' }, notify: 24 },
  { id: 'new_years_eve', name: "New Year's Eve", kind: 'holiday', when: { season: 'winter', days: [14] }, hours: [20, 25],
    place: { district: 'harbor', poi: 'poi_lighthouse' }, blurb: 'Countdown by the lighthouse, fireworks at midnight, then it is Spring again.',
    special: { crowdMult: 2, moodlet: 'festival_spirit', guaranteedWeather: 'clear',
      fireworks: { atHour: 24, minutes: 15, visibleFrom: ['harbor', 'hillcrest', 'downtown', 'arts'], moodlet: 'fireworks_awe' },
      transit: 'trains run all night', highlight: 'The year-in-review card appears on your phone at 00:15.' }, notify: 24 },
];

// ---------------------------------------------------------------------------------------------
// Tiny pure date helpers (absolute day 0 = Monday, Spring 1)
// ---------------------------------------------------------------------------------------------
export const weekdayOf = (absDay) => absDay % 7;
export const seasonOf = (absDay) => SEASONS[Math.floor(absDay / 14) % 4];
export const dayOfSeason = (absDay) => (absDay % 14) + 1;
export const yearOf = (absDay) => Math.floor(absDay / 56) + 1;
export const dayPartOf = (hour) => DAY_PARTS.find((p) => hour >= p.from && hour < p.to) || DAY_PARTS[0];
/** "Mon, Spring 1, Year 1" */
export const formatDate = (absDay) => `${WEEKDAYS[weekdayOf(absDay)].short}, ${seasonOf(absDay).name} ${dayOfSeason(absDay)}, Year ${yearOf(absDay)}`;
/** Is an event scheduled on this absolute day? (hours not checked) */
export const eventOnDay = (event, absDay) =>
  event.when.weekday !== undefined
    ? event.when.weekday === weekdayOf(absDay)
    : (event.when.season === 'any' || event.when.season === seasonOf(absDay).id) && event.when.days.includes(dayOfSeason(absDay));
