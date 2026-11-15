// needs.js — needs, long-term stats, mood, moodlets and skills for Maple Bay.
// Pure design data. No engine code. All ids are snake_case and unique within their table.
//
// SCALE
//   Every need is a number 0..100 (100 = fully satisfied). Decay values are points per GAME HOUR
//   and are negative. A typical day (16 h awake, 8 h asleep) costs roughly:
//     hunger 84 (three normal meals refill ~100), energy 77 (8 h on the starter mattress refills 88),
//     hygiene 56 (one shower refills 60), fun 56, social 40, bladder ~160 (two or three short toilet visits; tuned down for owner msg 96).
//   Design intent: needs are a gentle rhythm, not a threat. A player who eats three times, sleeps
//   once and showers once never sees a red bar.
//
// NEEDS[] fields
//   id            key used everywhere in effect objects ({ hunger: 30, fun: 5 }).
//   name / icon   display name / hint for the 12x12 HUD icon.
//   start         value at game start (you just got off a plane).
//   decayAwake    points per game hour while awake.
//   decayAsleep   points per game hour while sleeping.
//   bands         ordered high -> low. The band whose `min` is the highest value <= current need applies.
//                 { id, min, label, moodlet } — moodlet is an id in MOODLETS (or null) that is active
//                 for as long as the need stays in that band.
//   atZero        what happens when the need hits 0. Always gentle; nobody dies in Maple Bay.
//                 { type: 'pass_out' | 'status', ... } — see each entry.
//
// BLADDER (added after an owner playtest: "TOILETS + a BLADDER/bathroom need"): 100 = empty and comfortable, 0 = bursting.
//   Decays 17/h awake and 5/h asleep, so a day costs ~310 (16 h awake + 8 h asleep) plus ~10-16 per drink (BLADDER.drink):
//   about five toilet visits a day, six if you like your coffee. It never passes you out and there is no "accident":
//   below 30 you get a mild "Need to Go", below 12 "Bursting" (you hurry, and it is hard to concentrate), at 0 only a toast.
//   Toilets are everywhere on purpose: your own bathroom, every venue with a counter ("Restroom"), stations, park pavilions.
//   Logic lives in src/sim/bladder.js.

export const NEED_MIN = 0;
export const NEED_MAX = 100;

export const NEEDS = [
  {
    id: 'hunger', name: 'Hunger', icon: 'fork and knife, warm orange',
    start: 55, decayAwake: -4.5, decayAsleep: -1.5,
    bands: [
      { id: 'full', min: 85, label: 'Full', moodlet: 'well_fed' },
      { id: 'ok', min: 30, label: 'Fine', moodlet: null },
      { id: 'low', min: 12, label: 'Hungry', moodlet: 'hungry' },
      { id: 'critical', min: 0, label: 'Starving', moodlet: 'starving' },
    ],
    atZero: {
      type: 'pass_out', wakeAt: 'clinic', skipHours: 3,
      setNeeds: { hunger: 55, energy: 50 }, bill: 40, billLabel: 'Bayside Clinic — observation & a sandwich',
      message: 'You got woozy and a passer-by walked you to Bayside Clinic. They fed you and sent you on your way.',
    },
  },
  {
    id: 'energy', name: 'Energy', icon: 'lightning bolt, yellow',
    start: 65, decayAwake: -4.8, decayAsleep: 0, // sleeping restores energy via the `sleep` activity. Was -5.5: 'drains just a bit too fast' (owner msg 101); a 16 h day now costs ~77
    bands: [
      { id: 'full', min: 85, label: 'Rested', moodlet: 'rested' },
      { id: 'ok', min: 30, label: 'Fine', moodlet: null },
      { id: 'low', min: 12, label: 'Tired', moodlet: 'tired' },
      { id: 'critical', min: 0, label: 'Exhausted', moodlet: 'exhausted' },
    ],
    atZero: {
      type: 'pass_out', wakeAt: 'home', skipHours: 6,
      setNeeds: { energy: 60 }, bill: 15, billLabel: 'Taxi home (a kind cabbie)',
      message: 'You nodded off on the spot. A kind cabbie drove you home and tucked the receipt under your door.',
    },
  },
  {
    id: 'hygiene', name: 'Hygiene', icon: 'water droplet with sparkle, light blue',
    start: 60, decayAwake: -3, decayAsleep: -1,
    bands: [
      { id: 'full', min: 85, label: 'Fresh', moodlet: 'fresh' },
      { id: 'ok', min: 30, label: 'Fine', moodlet: null },
      { id: 'low', min: 12, label: 'Grubby', moodlet: 'grubby' },
      { id: 'critical', min: 0, label: 'Stinky', moodlet: 'stinky' },
    ],
    // No pass-out. At 0 the 'stinky' moodlet simply stays on; NPCs wave a hand in front of their nose,
    // and venues with a dress code (The Gilded Gull) politely turn you away.
    atZero: { type: 'status', moodlet: 'stinky', blocksDressCodeVenues: true,
      message: 'People are giving you a wide berth. A shower would fix everything.' },
  },
  {
    id: 'fun', name: 'Fun', icon: 'smiling star, pink',
    start: 60, decayAwake: -3.5, decayAsleep: 0,
    bands: [
      { id: 'full', min: 85, label: 'Delighted', moodlet: 'delighted' },
      { id: 'ok', min: 30, label: 'Fine', moodlet: null },
      { id: 'low', min: 12, label: 'Bored', moodlet: 'bored' },
      { id: 'critical', min: 0, label: 'Burnt out', moodlet: 'burnt_out' },
    ],
    // No pass-out. Fun floors at 0 with 'burnt_out' active until fun is back above 12.
    atZero: { type: 'status', moodlet: 'burnt_out',
      message: 'Everything feels like a chore. Do something just for you.' },
  },
  {
    id: 'social', name: 'Social', icon: 'two speech bubbles, green',
    start: 50, decayAwake: -2.5, decayAsleep: 0,
    bands: [
      { id: 'full', min: 85, label: 'Connected', moodlet: 'connected' },
      { id: 'ok', min: 30, label: 'Fine', moodlet: null },
      { id: 'low', min: 12, label: 'A bit lonely', moodlet: 'a_bit_lonely' },
      { id: 'critical', min: 0, label: 'Lonely', moodlet: 'lonely' },
    ],
    // No pass-out. Once per day while at 0, your sibling phones to check in (free +15 social).
    atZero: { type: 'status', moodlet: 'lonely', siblingCheckInCall: { social: 15, maxPerDay: 1 },
      message: 'Your sibling calls: "Hey stranger. You okay? Come over this week."' },
  },
  {
    id: 'bladder', name: 'Bladder', icon: 'toilet roll, white and blue',
    start: 85, decayAwake: -9, decayAsleep: -2,   // owner msg 96 (was 70 / -17 / -5: 'drains too fast'): full -> 'Need to go' in about 8 waking hours, 2-3 visits a day, a night's sleep costs ~16
    bands: [
      { id: 'full', min: 85, label: 'Comfortable', moodlet: null },
      { id: 'ok', min: 30, label: 'Fine', moodlet: null },
      { id: 'low', min: 12, label: 'Need to go', moodlet: 'need_to_go' },
      { id: 'critical', min: 0, label: 'Bursting', moodlet: 'bursting' },
    ],
    // No pass-out and no accident. At 0 'bursting' simply stays on (you walk a little faster and learn/work a little worse)
    // until you find any toilet: home, a venue restroom, a station or a park pavilion.
    atZero: { type: 'status', moodlet: 'bursting',
      message: 'You cannot think about anything else. Any restroom will do: tap the Bladder bar to find the nearest one.' },
  },
  // ---- the three GENTLE needs (Wave C; BIBLE direction update 2: "Needs drive errands") --------------------------------------
  // `soft: true`: no clock decay here (decayAwake / decayAsleep stay 0) — src/sim/needs_extra.js moves them from where you are and what you do
  // (tuning: SOFT below). Three bands only, never 'critical', nothing happens at 0, not part of MOOD.weights: they colour the day through
  // their band moodlets and small bonuses. `lowText` is the one friendly line shown when the need first drops into its low band.
  {
    id: 'comfort', name: 'Comfort', icon: 'armchair, warm red', soft: true,
    start: 58, decayAwake: 0, decayAsleep: 0,
    bands: [
      { id: 'full', min: 80, label: 'Snug', moodlet: 'snug' },
      { id: 'ok', min: 32, label: 'Fine', moodlet: null },
      { id: 'low', min: 0, label: 'Unsettled', moodlet: 'unsettled' },
    ],
    atZero: { type: 'soft' },
    lowText: 'Home feels a little unloved. A tidy-up or something cosy would help.',
  },
  {
    id: 'outdoors', name: 'Outdoors', icon: 'green tree, blue sky', soft: true,
    start: 72, decayAwake: 0, decayAsleep: 0,
    bands: [
      { id: 'full', min: 80, label: 'Full of fresh air', moodlet: 'aired_out' },
      { id: 'ok', min: 30, label: 'Fine', moodlet: null },
      { id: 'low', min: 0, label: 'Cooped up', moodlet: 'cooped_up' },
    ],
    atZero: { type: 'soft' },
    lowText: 'You have been indoors a long while. A walk in the park would feel good.',
  },
  {
    id: 'inspiration', name: 'Inspiration', icon: 'lit lightbulb, violet', soft: true,
    start: 55, decayAwake: 0, decayAsleep: 0,
    bands: [
      { id: 'full', min: 80, label: 'Brimming with ideas', moodlet: 'brimming' },
      { id: 'ok', min: 30, label: 'Fine', moodlet: null },
      { id: 'low', min: 0, label: 'In a rut', moodlet: 'in_a_rut' },
    ],
    atZero: { type: 'soft' },
    lowText: 'The days are starting to look alike. Go and see something new.',
  },
];

// ---------------------------------------------------------------------------------------------
// SOFT — tuning of the three gentle needs (used by src/sim/needs_extra.js). All rates are points per GAME HOUR.
//   A normal day: Outdoors loses ~45 over 14 waking hours indoors + ~5 asleep and wins it back with about two hours outside (a commute on
//   foot and a park bench); Inspiration loses ~24 a day and one film, an hour with a novel plus a new place or two refill it; Comfort follows
//   your home (clean + cosy) while you are in it and fades slowly while you are out.
// ---------------------------------------------------------------------------------------------
export const SOFT = {
  outdoors: {
    indoors: -3.2, asleep: -0.6,          // per hour in any indoor scene (trains and stations included)
    terraceHomeMult: 0.5,                 // homes with the `homeViewpoint` perk (terrace / penthouse): the indoor drain is halved ("balcony a little")
    outside: 15, park: 26,                // per hour in the street / within `parkRadius` of a park, pier, beach, lookout, river walk or garden
    parkRadius: 15,
    weather: { clear: 1.25, cloudy: 1, fog: 0.8, snow: 0.9, rain: 0.45, storm: 0.15 },
    night: 0.8,
    energyTrickle: 0.3,                   // energy per waking hour given back while the need is in its full band
  },
  inspiration: {
    awake: -1.5, asleep: 0,
    discover: 6, discoverDayCap: 24,      // a place seen for the first time
    recipe: 8, newCook: 6, newDish: 5,    // learning a recipe / cooking one for the first time / tasting a dish for the first time
    show: 28,                             // a full show (concert, play, film at a hall)
    read: 6, book: 10, film: 8,           // Pages short read / a finished book / a film on Reel
    lesson: 8,                            // a coach lesson
    detail: 2, detailDayCap: 30,          // small "looked closely at something" moments inside the showpieces (exhibits, plaques, tanks...)
    visit: { museum: 12, aquarium: 10, observatory: 10, skydeck: 12, conservatory: 8, lighthouse: 8, cityhall: 5, arena: 6, fishmarket: 4, hotel: 3, mall: 2, natatorium: 2 },   // first visit of the day
  },
  comfort: {
    away: -0.9, asleepAway: 0,            // per hour while not at home
    toward: 14,                           // per hour, towards the home's comfort level, while at home
    base: 16, cleanShare: 0.42, cosyPer: 1.6, cosyMax: 36,   // home comfort = base + cleanliness x cleanShare + min(cosyMax, ambience x cosyPer)
    hotelRoom: 85, friendHome: 62,        // comfort level of a hotel room / a family or friend's home
    soundSleep: 80, soundSleepEnergy: 5,  // sleeping 4 h+ at home with Comfort at or above this: 'slept_soundly' + this much energy on waking
  },
  // home cleanliness 0..100 (state G.state.supplies.clean; shown as Tidy / Lived-in / Dusty / Messy)
  clean: {
    start: 76, perHour: -0.3, atHomeAwake: -0.22, cook: -2.5,    // ~ -9 a day when you live in it: about one proper clean every five or six days
    spot: 10, spotMinutes: 4,             // tidying one visible bit of mess (no supplies needed)
    quick: 16, quickMinutes: 10, quickCap: 70,   // a quick tidy without supplies cannot take the home past `quickCap`
    full: 55, fullMinutes: 30,            // a proper clean: one use of cleaner + one of sponges
    messAt: [68, 54, 40, 26, 14],         // one more visible bit of mess for each threshold the cleanliness is under
    labels: [{ min: 80, label: 'Sparkling' }, { min: 60, label: 'Tidy' }, { min: 40, label: 'Lived-in' }, { min: 20, label: 'Dusty' }, { min: 0, label: 'Messy' }],
  },
};
// What activities do to the gentle needs, in points per hour while they run (ids from data/activities.js and the runtime-registered ones).
// Unknown activities fall back to SOFT_ACT_RULES (first matching rule wins).
export const SOFT_ACT = {
  watch_movie: { inspiration: 13 }, contemplate_art: { inspiration: 30 }, read_novel: { inspiration: 10, comfort: 4 }, read_skill_book: { inspiration: 4 }, library_read: { inspiration: 10 },
  browse_books: { inspiration: 8 }, listen_music: { inspiration: 6, comfort: 3 }, dance_home: { inspiration: 4 }, watch_live_music: { inspiration: 18 }, open_mic: { inspiration: 24 },
  practice_instrument: { inspiration: 9 }, paint: { inspiration: 10 }, sketch_outdoors: { inspiration: 14, outdoors: 8 }, listen_busker: { inspiration: 16, outdoors: 6 }, enjoy_view: { inspiration: 14, outdoors: 10 },
  stargaze: { inspiration: 16, outdoors: 8 }, dig_crates: { inspiration: 8 }, listen_station: { inspiration: 8 }, computer_write: { inspiration: 6 }, watch_tv: { inspiration: 2, comfort: 3 }, watch_cooking_show: { inspiration: 5, comfort: 3 },
  ride_ferris_wheel: { inspiration: 20, outdoors: 10 }, watch_fish: { inspiration: 8 }, smell_flowers: { inspiration: 6 }, flip_flash: { inspiration: 6 }, play_jukebox: { inspiration: 6 }, test_pens: { inspiration: 4 },
  lounge: { comfort: 10 }, nap_sofa: { comfort: 6 }, bath: { comfort: 14 }, linger: { comfort: 6 }, nap: { comfort: 4 },
  people_watch: { outdoors: 8, inspiration: 3 }, feed_ducks: { outdoors: 12 }, fish_pier: { outdoors: 10 }, jog: { outdoors: 12 }, garden: { outdoors: 14 }, swing: { outdoors: 10 }, picnic: { outdoors: 14, comfort: 3 },
  pet_cat: { outdoors: 4 }, watch_planes: { outdoors: 8, inspiration: 4 }, tend_plants: { comfort: 6 },
};
export const SOFT_ACT_RULES = [
  { re: /museum|gallery|exhibit|sketch|paint|photo|concert|music|song|busk|poem|write|read|book|film|movie|show|planetar|telescope|star|comedy|dance/i, fx: { inspiration: 8 } },
  { re: /garden|weed|swim|beach|hoop|chess|picnic|fish|jog|run|walk|bench/i, fx: { outdoors: 8 } },
  { re: /spa|sauna|massage|soak|lounge|sofa/i, fx: { comfort: 10 } },
];

// Bladder tuning (used by src/sim/bladder.js). `drink` = points taken off the bladder need by one drink, by kind.
export const BLADDER = {
  drink: { default: 6, water: 5, caffeine: 9, alcohol: 11, soup: 3 },   // was 10 / 8 / 14 / 16 / 4 (owner msg 96)
  toiletMinutes: 4,        // a home / fixture toilet visit (activity `use_toilet`: +100 over these minutes)
  restroomMinutes: 5,      // a public "Restroom" visit (fade out / fade in), hand-washing included
  restroomHygiene: 3,      // hygiene gained in a public restroom (you wash your hands there)
  unwashedHygiene: -3,     // hygiene lost by using a toilet...
  washHygiene: 6,          // ...and gained by "Wash hands" at any sink (+3 more right after a toilet visit)
  relievedBelow: 35,       // using a toilet when the need was under this gives the 'relieved' moodlet
};

// ---------------------------------------------------------------------------------------------
// MOODLETS — small named status effects. Shown as chips in the Wellness app.
//   mood       flat points added to MOOD while active (see MOOD below).
//   workPerf   points added to the job performance score (see jobs.js PERFORMANCE) while active
//              during a shift. Averaged over the shift.
//   walkSpeed  multiplier on walking speed (1 = no change). Multiply all active ones together.
//   xpMult     multiplier on all skill xp gained (optional, default 1).
//   minutes    duration in game minutes once triggered; null = lasts while its condition holds
//              (need band, weather, being at home...).
//   source     who turns it on: 'need' (band above), 'item', 'activity', 'weather', 'home',
//              'event', 'money', 'job', 'story'.
// ---------------------------------------------------------------------------------------------
export const MOODLETS = {
  // --- need bands ---
  well_fed:     { name: 'Well Fed', desc: 'Pleasantly full.', mood: 4, workPerf: 2, walkSpeed: 1, minutes: null, source: 'need' },
  hungry:       { name: 'Hungry', desc: 'Your stomach is narrating.', mood: -8, workPerf: -5, walkSpeed: 1, minutes: null, source: 'need' },
  starving:     { name: 'Starving', desc: 'Everything looks like a sandwich.', mood: -18, workPerf: -12, walkSpeed: 0.9, minutes: null, source: 'need' },
  rested:       { name: 'Rested', desc: 'Bright-eyed and ready.', mood: 5, workPerf: 3, walkSpeed: 1.05, minutes: null, source: 'need' },
  tired:        { name: 'Tired', desc: 'Yawning between sentences.', mood: -8, workPerf: -5, walkSpeed: 0.9, minutes: null, source: 'need' },
  exhausted:    { name: 'Exhausted', desc: 'Running on fumes. Bed. Now.', mood: -18, workPerf: -12, walkSpeed: 0.75, minutes: null, source: 'need' },
  fresh:        { name: 'Fresh', desc: 'Clean, combed and confident.', mood: 3, workPerf: 2, walkSpeed: 1, minutes: null, source: 'need' },
  grubby:       { name: 'Grubby', desc: 'Could use a shower.', mood: -5, workPerf: -4, walkSpeed: 1, minutes: null, source: 'need' },
  stinky:       { name: 'Stinky', desc: 'A visible little cloud follows you. Social gains are halved.', mood: -12, workPerf: -10, walkSpeed: 1, minutes: null, source: 'need', socialGainMult: 0.5 },
  delighted:    { name: 'Delighted', desc: 'Life is good.', mood: 6, workPerf: 2, walkSpeed: 1, minutes: null, source: 'need' },
  bored:        { name: 'Bored', desc: 'Nothing feels very interesting.', mood: -8, workPerf: -4, walkSpeed: 1, minutes: null, source: 'need' },
  burnt_out:    { name: 'Burnt Out', desc: 'All work and no play.', mood: -16, workPerf: -12, walkSpeed: 0.95, xpMult: 0.75, minutes: null, source: 'need' },
  connected:    { name: 'Connected', desc: 'You feel part of the place.', mood: 5, workPerf: 2, walkSpeed: 1, minutes: null, source: 'need' },
  a_bit_lonely: { name: 'A Bit Lonely', desc: 'It would be nice to talk to someone.', mood: -6, workPerf: -2, walkSpeed: 1, minutes: null, source: 'need' },
  lonely:       { name: 'Lonely', desc: 'The city feels very big today.', mood: -14, workPerf: -6, walkSpeed: 1, minutes: null, source: 'need' },

  need_to_go:   { name: 'Need to Go', desc: 'You are starting to look for a restroom sign.', mood: -4, workPerf: -2, walkSpeed: 1, minutes: null, source: 'need' },
  bursting:     { name: 'Bursting', desc: 'Quick little steps. Nothing else matters right now.', mood: -12, workPerf: -10, walkSpeed: 1.1, xpMult: 0.85, minutes: null, source: 'need' },
  relieved:     { name: 'Relieved', desc: 'Ahh. The world is a kinder place again.', mood: 4, workPerf: 1, walkSpeed: 1, minutes: 60, source: 'activity' },
  // --- food & drink ---
  caffeinated:  { name: 'Caffeinated', desc: 'Buzzing. More coffee only gives half the kick while this lasts.', mood: 2, workPerf: 3, walkSpeed: 1.05, minutes: 180, source: 'item', caffeineGainMult: 0.5 },
  home_cooked:  { name: 'Home Cooked', desc: 'You made that. With your own hands.', mood: 4, workPerf: 0, walkSpeed: 1, minutes: 240, source: 'item' },
  good_meal:    { name: 'Good Meal', desc: 'That hit the spot.', mood: 4, workPerf: 0, walkSpeed: 1, minutes: 180, source: 'item' },
  fine_dining:  { name: 'Fine Dining', desc: 'Tiny portions, enormous feelings.', mood: 10, workPerf: 0, walkSpeed: 1, minutes: 360, source: 'item' },
  sweet_treat:  { name: 'Sweet Treat', desc: 'A little something sugary.', mood: 3, workPerf: 0, walkSpeed: 1, minutes: 90, source: 'item' },
  tipsy:        { name: 'Tipsy', desc: 'Pleasantly wobbly. Triggered by 3+ alcoholic drinks within 3 hours.', mood: 4, workPerf: -8, walkSpeed: 0.9, minutes: 150, source: 'item' },
  groggy:       { name: 'Groggy', desc: 'Last night was fun. This morning, less so. Follows Tipsy after sleeping.', mood: -3, workPerf: -3, walkSpeed: 0.95, minutes: 120, source: 'item' },

  // --- activities ---
  power_nap:    { name: 'Power Nap', desc: 'Twenty minutes that felt like two hours.', mood: 3, workPerf: 2, walkSpeed: 1, minutes: 120, source: 'activity' },
  squeaky_clean:{ name: 'Squeaky Clean', desc: 'Spa-level fresh.', mood: 4, workPerf: 1, walkSpeed: 1, minutes: 240, source: 'activity' },
  pumped:       { name: 'Pumped', desc: 'Post-workout glow.', mood: 5, workPerf: 2, walkSpeed: 1.05, minutes: 180, source: 'activity' },
  zen:          { name: 'Zen', desc: 'Breathing in. Breathing out.', mood: 6, workPerf: 3, walkSpeed: 1, minutes: 240, source: 'activity' },
  good_book:    { name: 'Good Book', desc: 'You finished a novel and you are still thinking about it.', mood: 5, workPerf: 0, walkSpeed: 1, minutes: 360, source: 'activity' },
  movie_magic:  { name: 'Movie Magic', desc: 'Still humming the theme tune.', mood: 6, workPerf: 0, walkSpeed: 1, minutes: 240, source: 'activity' },
  bay_view:     { name: 'Bay View', desc: 'You saw the whole city glitter from up high.', mood: 5, workPerf: 0, walkSpeed: 1, minutes: 180, source: 'activity' },
  great_night_out: { name: 'Great Night Out', desc: 'Music, dancing, good company.', mood: 7, workPerf: 0, walkSpeed: 1, minutes: 300, source: 'activity' },
  inspired:     { name: 'Inspired', desc: 'Ideas are fizzing. +15% creativity xp.', mood: 4, workPerf: 1, walkSpeed: 1, minutes: 240, source: 'activity', skillXpMult: { creativity: 1.15 } },
  fresh_air:    { name: 'Fresh Air', desc: 'A bit of green does wonders.', mood: 3, workPerf: 1, walkSpeed: 1, minutes: 120, source: 'activity' },
  stage_glow:   { name: 'Stage Glow', desc: 'They clapped. For you!', mood: 8, workPerf: 0, walkSpeed: 1, minutes: 300, source: 'activity' },
  checked_up:   { name: 'Clean Bill of Health', desc: 'The nurse says you are doing great.', mood: 3, workPerf: 2, walkSpeed: 1, minutes: 1440, source: 'activity' },

  // --- weather (applied only while outdoors without the right gear; see calendar.js) ---
  soaked:       { name: 'Soaked', desc: 'Squelch, squelch. An umbrella or raincoat prevents this.', mood: -5, workPerf: -2, walkSpeed: 0.95, minutes: 60, source: 'weather' },
  chilly:       { name: 'Chilly', desc: 'Brrr. A winter coat prevents this.', mood: -4, workPerf: -1, walkSpeed: 0.95, minutes: 45, source: 'weather' },
  sunny_day:    { name: 'Sunny Day', desc: 'Blue sky over the bay.', mood: 3, workPerf: 0, walkSpeed: 1, minutes: null, source: 'weather' },
  first_snow:   { name: 'Snow Day', desc: 'The whole city has gone quiet and white.', mood: 4, workPerf: 0, walkSpeed: 0.95, minutes: null, source: 'weather' },

  // --- home (active while inside your home; thresholds in homes.js AMBIENCE_TIERS) ---
  homey:        { name: 'Homey', desc: 'It is starting to feel like yours.', mood: 3, workPerf: 0, walkSpeed: 1, minutes: null, source: 'home' },
  cozy_home:    { name: 'Cozy Home', desc: 'Plants, rugs, soft light.', mood: 5, workPerf: 0, walkSpeed: 1, minutes: null, source: 'home' },
  dream_home:   { name: 'Dream Home', desc: 'You could be in a magazine.', mood: 8, workPerf: 0, walkSpeed: 1, minutes: null, source: 'home' },
  unpacked:     { name: 'All Unpacked', desc: 'The last moving box is gone.', mood: 5, workPerf: 0, walkSpeed: 1, minutes: 1440, source: 'home' },

  // --- events, money, job, story ---
  festival_spirit: { name: 'Festival Spirit', desc: 'Bunting, music and the smell of fried dough.', mood: 6, workPerf: 0, walkSpeed: 1, minutes: 240, source: 'event' },
  fireworks_awe:   { name: 'Fireworks!', desc: 'Oooh. Aaah.', mood: 10, workPerf: 0, walkSpeed: 1, minutes: 360, source: 'event' },
  holiday_cheer:   { name: 'Holiday Cheer', desc: 'A day off with people you like.', mood: 6, workPerf: 0, walkSpeed: 1, minutes: 720, source: 'event' },
  payday:       { name: 'Payday', desc: 'Money in the bank.', mood: 3, workPerf: 0, walkSpeed: 1, minutes: 120, source: 'money' },
  money_worries:{ name: 'Money Worries', desc: 'The account is in the red. Active while balance < 0.', mood: -5, workPerf: -2, walkSpeed: 1, minutes: null, source: 'money' },
  promoted:     { name: 'Promoted!', desc: 'New title, new badge, bigger paycheck.', mood: 10, workPerf: 3, walkSpeed: 1, minutes: 1440, source: 'job' },
  good_shift:   { name: 'Good Shift', desc: 'You nailed it today.', mood: 4, workPerf: 0, walkSpeed: 1, minutes: 180, source: 'job' },
  fresh_start:  { name: 'Fresh Start', desc: 'New city, new you. Active for your first 3 days.', mood: 6, workPerf: 2, walkSpeed: 1, minutes: 4320, source: 'story' },
  family_time:  { name: 'Family Time', desc: 'Nothing beats a kitchen full of people.', mood: 7, workPerf: 0, walkSpeed: 1, minutes: 480, source: 'story' },
};

// ---------------------------------------------------------------------------------------------
// MOOD — derived, never stored. 0..100.
//   mood = clamp( sum(need[id] * weights[id]) + sum(active moodlet.mood), 0, 100 )
// The mood tier feeds the work performance score (jobs.js) and a small xp multiplier.
// ---------------------------------------------------------------------------------------------
export const MOOD = {
  weights: { hunger: 0.20, energy: 0.25, hygiene: 0.15, fun: 0.20, social: 0.20 }, // sums to 1
  tiers: [ // ordered high -> low; first tier whose min <= mood applies
    { id: 'great',     min: 80, label: 'Great',     face: 'big grin',        xpMult: 1.10, workPerf: 10 },
    { id: 'good',      min: 60, label: 'Good',      face: 'smile',           xpMult: 1.05, workPerf: 5 },
    { id: 'okay',      min: 40, label: 'Okay',      face: 'neutral',         xpMult: 1.00, workPerf: 0 },
    { id: 'low',       min: 20, label: 'Low',       face: 'small frown',     xpMult: 0.95, workPerf: -6 },
    { id: 'miserable', min: 0,  label: 'Miserable', face: 'rain cloud brow', xpMult: 0.90, workPerf: -12 },
  ],
};

// ---------------------------------------------------------------------------------------------
// FITNESS — long-term body stat 0..100 ("how in shape am I"), separate from the `fitness` SKILL
// (what you know: technique, training). Activities list `fitness` gain per hour (activities.js).
// It drifts down slowly only on days with no exercise at all, and never below `floor`.
//   Bonuses scale linearly from 0 at value 0 to the listed max at value 100.
// ---------------------------------------------------------------------------------------------
export const FITNESS = {
  id: 'fitness', name: 'Fitness', icon: 'flexed arm, red',
  start: 30, min: 0, max: 100,
  decayPerIdleDay: -0.5, // applied at midnight if no activity with a `fitness` gain happened that day
  floor: 15,
  bonusesAt100: {
    walkSpeedMult: 1.15,        // +15% walk speed
    energyDecayAwakeMult: 0.85, // energy drains 15% slower while awake
    backpackSlots: 4,           // extra inventory slots (see items.js INVENTORY)
  },
  labels: [ { min: 80, label: 'Athletic' }, { min: 55, label: 'Fit' }, { min: 30, label: 'Average' }, { min: 0, label: 'Out of shape' } ],
};

// ---------------------------------------------------------------------------------------------
// SKILLS — levels 1..10. Everyone starts at level 1 with 0 xp in every skill.
//   SKILL_XP[level - 1] = total xp needed to BE that level. Level 10 is the cap.
//   Typical gain is 30-50 xp per game hour of focused practice, so:
//     level 2 ~ 2-3 h, level 4 ~ 10-15 h, level 7 ~ 35 h, level 10 ~ 80 h of practice.
//   Final xp = base xp * MOOD tier xpMult * moodlet xpMult * furniture tier mult (items.js).
// ---------------------------------------------------------------------------------------------
export const SKILL_MAX_LEVEL = 10;
export const SKILL_XP = [0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200];

export const SKILLS = [
  { id: 'cooking', name: 'Cooking', icon: 'chef hat, white',
    desc: 'Unlocks recipes; better meals, faster.',
    perLevel: { cookTimeMult: -0.03, mealHungerBonus: 1 }, // each level above 1: 3% faster, +1 hunger per serving
    trainedBy: ['cook', 'job:line_cook', 'book'] },
  { id: 'fitness', name: 'Fitness', icon: 'dumbbell, grey',
    desc: 'Training know-how. Workouts cost less energy and build the Fitness stat faster.',
    perLevel: { workoutEnergyCostMult: -0.03, fitnessGainMult: 0.05 },
    trainedBy: ['exercise', 'gym', 'jog', 'job:courier', 'job:fitness_trainer', 'job:dock_worker', 'book'] },
  { id: 'charisma', name: 'Charisma', icon: 'speech bubble with heart',
    desc: 'Conversations go further; better tips.',
    perLevel: { socialGainMult: 0.04, relationshipGainMult: 0.04, tipMult: 0.05 },
    trainedBy: ['chat', 'open_mic', 'job:barista', 'job:bartender', 'book'] },
  { id: 'logic', name: 'Logic', icon: 'chess knight, navy',
    desc: 'Study, puzzles and screens. Gates office and clinic work.',
    perLevel: { studyXpMult: 0.03, gigPayMult: 0.03 },
    trainedBy: ['study', 'computer', 'play_games', 'job:office_analyst', 'job:librarian', 'job:nurse', 'book'] },
  { id: 'creativity', name: 'Creativity', icon: 'paint palette',
    desc: 'Painting, music and writing. Your work sells for more.',
    perLevel: { artValueMult: 0.10, funFromCreatingMult: 0.03 },
    trainedBy: ['paint', 'instrument', 'write', 'sketch', 'book'] },
  { id: 'handiness', name: 'Handiness', icon: 'wrench, steel blue',
    desc: 'Building, fixing, growing. Assemble furniture yourself and garden better.',
    perLevel: { assembleTimeMult: -0.05, gardenYieldMult: 0.05 },
    trainedBy: ['assemble_furniture', 'garden', 'tend_plants', 'job:grocery_clerk', 'job:dock_worker', 'book'] },
];

// Tiny pure helpers -----------------------------------------------------------------------------
/** Level (1..10) for a total xp amount. */
export const levelForXp = (xp) => {
  let level = 1;
  for (let i = 0; i < SKILL_XP.length; i++) if (xp >= SKILL_XP[i]) level = i + 1;
  return level;
};
/** Band object of a need definition for a value. */
export const bandFor = (need, value) => need.bands.find((b) => value >= b.min) || need.bands[need.bands.length - 1];
