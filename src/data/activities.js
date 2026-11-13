// activities.js — every interaction the player can start by clicking an object, a venue fixture,
// a point of interest or (for a few) the phone. Pure design data.
//
// HOW AN ACTIVITY RUNS
//   The player clicks something with a FUNCTION TAG. The engine lists the activities whose `tag`
//   matches and whose `requires` pass. Running one plays `anim`, advances time, and each game hour
//   applies `perHour` (need deltas), `xpPerHour` (skill xp) and `fitnessPerHour` (Fitness stat).
//   These rates are ADDED to the normal need decay from needs.js (so `energy: -8` on a treadmill
//   means 8 extra per hour on top of being awake). Rates are pro-rated per minute.
//
// ACTIVITIES[] fields
//   id            unique id.
//   name          menu label.
//   tag           function tag of the object/fixture/POI that offers it (see FUNCTION_TAGS).
//   where         'home' | 'venue' | 'world' | 'anywhere' (phone or backpack; no object needed).
//   venues        for where = 'venue': venue ids that have this fixture.
//   minutes       { min, default, max } game minutes. min === max = fixed length. The player can
//                 always cancel early and keep pro-rated effects, except `fixed: true` ones.
//   durationFrom  optional: 'item' (eatMinutes) | 'recipe' (cookMinutes) | 'film' etc. — the minutes
//                 block is then only a fallback/preview.
//   perHour       need deltas per game hour at tier 0 / base.
//   xpPerHour     { skillId: xp } per game hour at tier 0 / base.
//   fitnessPerHour  Fitness stat points per game hour (needs.js FITNESS).
//   tierScales    which numbers the object's `bonus.mult` (items.js home goods) multiplies:
//                 array of 'perHour.<need>' | 'xp' | 'fitness'. Omitted = tier does not matter.
//   cost          { amount, per: 'use' | 'hour', item?: id } — dollars, or an item consumed per use.
//   requires      all optional:
//                   item: id or [ids] (any one, must be in backpack; not consumed unless in cost)
//                   skill: { skillId: minLevel }     access: 'gym' | 'transit' (a valid pass)
//                   hours: [from, to] time-of-day window (to may exceed 24)
//                   weather: [allowed weather ids]   notWeather: [blocked weather ids]
//                   venueOpen: true                  companion: true (needs a friend along)
//                   event: calendar event id that must be running
//   onComplete    applied once when the full default duration (or more) was done:
//                   { moodlet, needs: {...}, gives: [{ item, qty, chance }], money: [min, max], opens: uiId }
//   fastForward   true = time may run at high speed while it plays (sleep, work-like things).
//   outdoor       true = weather modifiers from calendar.js apply (fun multiplier, soaked/chilly).
//   social        true = can be done with a companion; then add COMPANION_BONUS.
//   anim          one of ANIMS.
//   flavour       short line shown in the activity bubble.

export const ANIMS = ['stand', 'walk', 'sit', 'sleep', 'eat', 'drink', 'phone', 'talk', 'wave', 'type', 'work',
  'lift', 'treadmill', 'carry', 'dance', 'read', 'shower', 'cheer'];

// Function tags. `home` tags match the home goods catalogue in items.js exactly.
export const FUNCTION_TAGS = {
  home: ['bed', 'fridge', 'stove', 'microwave', 'sofa', 'tv', 'computer', 'bookshelf', 'game', 'music', 'shower', 'bath',
    'exercise', 'instrument', 'easel', 'plant', 'rug', 'decor'],
  homeFixed: ['moving_box', 'delivery_box', 'front_door', 'wardrobe'], // props placed by the game, not sold
  venue: ['till', 'shelf', 'seat', 'host_stand', 'reception', 'showroom', 'clothes_rack', 'fitting_room', 'book_browse',
    'treadmill', 'weights', 'yoga_studio', 'locker_shower', 'study_desk', 'reading_nook', 'public_computer',
    'bar_stool', 'dancefloor', 'stage', 'cinema_seat', 'arcade', 'taxi_rank'],
  world: ['bench', 'duck_pond', 'fishing_spot', 'ferris_wheel', 'jog_path', 'viewpoint', 'garden_plot', 'swing',
    'picnic_spot', 'busker', 'street_cat'],
  none: ['self'], // activities started from the backpack or phone
};

// Doing a `social: true` activity with a friend adds this on top (per game hour).
export const COMPANION_BONUS = { perHour: { social: 12, fun: 4 }, relationshipPerHour: 4 };

export const ACTIVITIES = [
  // ============================================================ HOME: rest
  { id: 'sleep', name: 'Sleep', tag: 'bed', where: 'home', minutes: { min: 60, default: 480, max: 600 },
    perHour: { energy: 11 }, tierScales: ['perHour.energy'], fastForward: true, anim: 'sleep',
    wake: { atEnergy: 100, alarm: true, onNeedCritical: ['hunger'] }, // wakes when full, at the Planner alarm, or if starving
    flavour: 'Zzz... the city hums you to sleep.' },
  { id: 'nap', name: 'Nap', tag: 'bed', where: 'home', minutes: { min: 20, default: 30, max: 120 },
    perHour: { energy: 9 }, tierScales: ['perHour.energy'], fastForward: true, anim: 'sleep',
    onComplete: { moodlet: 'power_nap' }, flavour: 'Just resting your eyes.' },
  { id: 'nap_sofa', name: 'Nap on the Sofa', tag: 'sofa', where: 'home', minutes: { min: 20, default: 30, max: 90 },
    perHour: { energy: 7 }, fastForward: true, anim: 'sleep',
    onComplete: { moodlet: 'power_nap' }, flavour: 'The TV is still on. You do not mind.' },
  { id: 'lounge', name: 'Put Your Feet Up', tag: 'sofa', where: 'home', minutes: { min: 10, default: 30, max: 120 },
    perHour: { energy: 2, fun: 4 }, social: true, anim: 'sit', flavour: 'Doing nothing, expertly.' },

  // ============================================================ HOME: food
  { id: 'store_groceries', name: 'Put Groceries Away', tag: 'fridge', where: 'home', minutes: { min: 2, default: 2, max: 2 },
    perHour: {}, anim: 'carry', onComplete: { opens: 'fridge_inventory' }, flavour: 'Tetris, but with yogurt.' },
  { id: 'grab_snack', name: 'Grab Something', tag: 'fridge', where: 'home', minutes: { min: 2, default: 5, max: 20 }, durationFrom: 'item',
    perHour: {}, anim: 'eat', onComplete: { opens: 'fridge_inventory' }, flavour: 'The fridge light is the best light.' },
  { id: 'cook', name: 'Cook...', tag: 'stove', where: 'home', minutes: { min: 10, default: 30, max: 90 }, durationFrom: 'recipe',
    perHour: { fun: 4, hygiene: -2 }, xpPerHour: {}, // xp comes from the recipe (items.js RECIPES[].xp), not per hour
    requires: {}, anim: 'work', onComplete: { opens: 'serve_or_store' }, flavour: 'Sizzle, stir, taste, adjust.' },
  { id: 'prep_cold', name: 'Make a No-Cook Dish...', tag: 'fridge', where: 'home', minutes: { min: 10, default: 10, max: 15 }, durationFrom: 'recipe',
    perHour: { fun: 3 }, anim: 'work', onComplete: { opens: 'serve_or_store' },
    note: 'Lists only recipes with appliance "none".', flavour: 'Chop chop.' },
  { id: 'microwave_meal', name: 'Heat a Ready Meal', tag: 'microwave', where: 'home', minutes: { min: 2, default: 5, max: 5 }, durationFrom: 'item',
    perHour: {}, tierScales: ['item.hunger'], anim: 'stand', flavour: 'Ding!' },
  { id: 'heat_on_stove', name: 'Heat a Ready Meal', tag: 'stove', where: 'home', minutes: { min: 8, default: 8, max: 8 },
    perHour: {}, anim: 'work', note: 'Fallback when there is no microwave. No tier bonus.', flavour: 'The slow way.' },
  { id: 'eat', name: 'Eat', tag: 'self', where: 'anywhere', minutes: { min: 2, default: 12, max: 90 }, durationFrom: 'item',
    perHour: {}, social: true, anim: 'eat', note: 'Applies the item effects once at the end. Sitting (sofa, seat, bench, picnic_spot) is optional.',
    flavour: 'Nom.' },
  { id: 'drink', name: 'Drink', tag: 'self', where: 'anywhere', minutes: { min: 2, default: 5, max: 15 }, durationFrom: 'item',
    perHour: {}, social: true, anim: 'drink', flavour: 'Ahh.' },

  // ============================================================ HOME: hygiene
  { id: 'shower', name: 'Take a Shower', tag: 'shower', where: 'home', minutes: { min: 5, default: 15, max: 20 },
    perHour: { hygiene: 240, energy: 4 }, tierScales: ['perHour.hygiene'], anim: 'shower',
    note: 'Default 15 min = +60 hygiene at tier 0. Tier 2 also applies its `bonus.moodlet`.',
    flavour: 'Concert in the shower: sold out.' },
  { id: 'bath', name: 'Soak in the Bath', tag: 'bath', where: 'home', minutes: { min: 15, default: 40, max: 60 },
    perHour: { hygiene: 110, fun: 10, energy: 4 }, tierScales: ['perHour.hygiene', 'perHour.fun'], anim: 'sit',
    flavour: 'Bubbles up to your chin.' },

  // ============================================================ HOME: fun & skills
  { id: 'watch_tv', name: 'Watch TV', tag: 'tv', where: 'home', minutes: { min: 15, default: 60, max: 180 },
    perHour: { fun: 14, energy: -1 }, tierScales: ['perHour.fun'], social: true, anim: 'sit',
    flavour: 'Tonight on Bay Kitchen: a souffle falls. Drama!' },
  { id: 'watch_cooking_show', name: 'Watch a Cooking Show', tag: 'tv', where: 'home', minutes: { min: 30, default: 60, max: 120 },
    perHour: { fun: 9 }, xpPerHour: { cooking: 12 }, tierScales: ['perHour.fun'], anim: 'sit',
    flavour: '"And now we fold. Gently. GENTLY."' },
  { id: 'play_games', name: 'Play Games', tag: 'game', where: 'home', minutes: { min: 15, default: 60, max: 180 },
    perHour: { fun: 18, energy: -2 }, xpPerHour: { logic: 6 }, tierScales: ['perHour.fun'], social: true, anim: 'sit',
    flavour: 'One more round. (It is never one more round.)' },
  { id: 'listen_music', name: 'Put Music On', tag: 'music', where: 'home', minutes: { min: 10, default: 30, max: 120 },
    perHour: { fun: 8 }, tierScales: ['perHour.fun'], social: true, anim: 'stand',
    note: 'Can keep playing in the background while doing something else; then only the object\'s ambientFunPerHour applies.',
    flavour: 'This one is a banger.' },
  { id: 'dance_home', name: 'Dance Like Nobody\'s Watching', tag: 'music', where: 'home', minutes: { min: 10, default: 20, max: 60 },
    perHour: { fun: 18, energy: -5, hygiene: -3 }, xpPerHour: { fitness: 8 }, fitnessPerHour: 0.8, tierScales: ['perHour.fun'], social: true, anim: 'dance',
    flavour: 'Nobody is watching. Probably.' },
  { id: 'read_skill_book', name: 'Study a Skill Book', tag: 'bookshelf', where: 'home', minutes: { min: 15, default: 60, max: 180 },
    perHour: { fun: -2, energy: -1 }, xpPerHour: { $bookSkill: 60 }, tierScales: ['xp'], requires: { itemCategory: 'book', bookKind: 'skill' }, anim: 'read',
    note: '$bookSkill = the `skill` of the chosen book. xp stops when the book\'s xpTotal is used up. Books can also be read on a sofa, bed, bench or train seat at x1.0.',
    flavour: 'Chapter 3: It Gets Harder.' },
  { id: 'read_novel', name: 'Read a Novel', tag: 'bookshelf', where: 'home', minutes: { min: 15, default: 60, max: 180 },
    perHour: { fun: 12, energy: -1 }, xpPerHour: { creativity: 4 }, requires: { itemCategory: 'book', bookKind: 'novel' }, anim: 'read',
    note: 'Finishing a novel (its readMinutes in total) applies its `good_book` moodlet once.', flavour: 'Just until the end of the chapter.' },
  { id: 'computer_find_job', name: 'Browse Job Listings', tag: 'computer', where: 'home', minutes: { min: 10, default: 10, max: 10 },
    perHour: {}, anim: 'type', onComplete: { opens: 'jobs_board_full' }, flavour: 'Maple Bay is hiring.' },
  { id: 'computer_gig', name: 'Do a Freelance Gig...', tag: 'computer', where: 'home', minutes: { min: 60, default: 90, max: 120 }, durationFrom: 'gig',
    perHour: { fun: -4, energy: -2 }, tierScales: ['pay'], anim: 'type', fastForward: true, onComplete: { opens: 'gig_payout' },
    note: 'Opens the list of jobs.js GIGS with source "computer". Pay is multiplied by the computer\'s gigPayMult.',
    flavour: 'Deadline is a strong word. Let\'s say "suggestion".' },
  { id: 'computer_browse', name: 'Browse the Web', tag: 'computer', where: 'home', minutes: { min: 10, default: 30, max: 120 },
    perHour: { fun: 10, energy: -1 }, tierScales: ['perHour.fun'], anim: 'type', flavour: 'Forty tabs. All essential.' },
  { id: 'computer_games', name: 'Play Computer Games', tag: 'computer', where: 'home', minutes: { min: 15, default: 60, max: 180 },
    perHour: { fun: 16, energy: -2 }, xpPerHour: { logic: 8 }, tierScales: ['perHour.fun'], anim: 'type', flavour: 'gg.' },
  { id: 'computer_study', name: 'Take an Online Course', tag: 'computer', where: 'home', minutes: { min: 30, default: 60, max: 180 },
    perHour: { fun: -4, energy: -2 }, xpPerHour: { logic: 36 }, tierScales: ['xp'], anim: 'type', flavour: 'Module 4 of 97.' },
  { id: 'computer_write', name: 'Write', tag: 'computer', where: 'home', minutes: { min: 30, default: 60, max: 180 },
    perHour: { fun: 4, energy: -2 }, xpPerHour: { creativity: 30 }, tierScales: ['xp'], anim: 'type', flavour: 'Chapter One. Again.' },
  { id: 'computer_shop', name: 'Shop Online', tag: 'computer', where: 'home', minutes: { min: 5, default: 10, max: 30 },
    perHour: { fun: 4 }, anim: 'type', onComplete: { opens: 'online_shop' },
    note: 'Catalogues of Nest & Wire, Thread & Co. and Dog-Eared Books at list price + economy.js DELIVERY.onlineOrderFee.',
    flavour: 'Add to cart. Remove from cart. Add to cart.' },
  { id: 'exercise_home', name: 'Work Out', tag: 'exercise', where: 'home', minutes: { min: 15, default: 45, max: 90 },
    perHour: { energy: -10, hygiene: -10, fun: 2, hunger: -3 }, xpPerHour: { fitness: 30 }, fitnessPerHour: 1.6, tierScales: ['xp', 'fitness'], anim: 'lift',
    onComplete: { moodlet: 'pumped' }, note: 'Use anim "treadmill" for the tier-2 home treadmill.', flavour: 'Three more. Two more. One... more.' },
  { id: 'practice_instrument', name: 'Practise', tag: 'instrument', where: 'home', minutes: { min: 15, default: 45, max: 120 },
    perHour: { fun: 8, energy: -2 }, xpPerHour: { creativity: 36 }, tierScales: ['xp'], anim: 'sit', flavour: 'It almost sounds like the song now.' },
  { id: 'paint', name: 'Paint', tag: 'easel', where: 'home', minutes: { min: 30, default: 120, max: 180 },
    perHour: { fun: 10, energy: -2, hygiene: -2 }, xpPerHour: { creativity: 40 }, tierScales: ['xp'], cost: { amount: 0, per: 'use', item: 'canvas' }, anim: 'work',
    onComplete: { gives: [{ item: 'painting', qty: 1, chance: 1 }], moodlet: 'inspired' },
    note: 'A painting is finished after 120 minutes at the easel (may be split over sessions). Value: see items.js `painting`.',
    flavour: 'Happy little maple trees.' },
  { id: 'tend_plants', name: 'Water the Plants', tag: 'plant', where: 'home', minutes: { min: 3, default: 3, max: 3 },
    perHour: { fun: 40 }, xpPerHour: { handiness: 60 }, anim: 'work',
    note: 'Once per plant per day (= +2 fun, +3 handiness xp each). Plants never die; unwatered ones just droop and give no ambience until watered.',
    flavour: 'Drink up, little guy.' },
  { id: 'assemble_furniture', name: 'Assemble It Yourself', tag: 'delivery_box', where: 'home', minutes: { min: 15, default: 30, max: 45 },
    perHour: { fun: 2, energy: -4 }, xpPerHour: { handiness: 50 }, anim: 'work',
    note: 'Every delivered home good arrives as a box. Tier 0: 15 min, tier 1: 30, tier 2: 45 (x handiness perLevel.assembleTimeMult). Or pay economy.js DELIVERY.assemblyFee and skip it.',
    flavour: 'There is always one screw left over.' },
  { id: 'unpack_boxes', name: 'Unpack a Moving Box', tag: 'moving_box', where: 'home', minutes: { min: 20, default: 20, max: 20 }, fixed: true,
    perHour: { fun: 6 }, xpPerHour: { handiness: 15 }, anim: 'carry',
    onComplete: { gives: 'see homes.js MOVING_BOXES' }, flavour: 'So THAT is where the phone charger went.' },
  { id: 'change_outfit', name: 'Change Outfit', tag: 'wardrobe', where: 'home', minutes: { min: 2, default: 2, max: 2 },
    perHour: {}, anim: 'stand', onComplete: { opens: 'wardrobe' }, flavour: 'New fit, who dis.' },

  // ============================================================ SOCIAL (anywhere)
  { id: 'chat', name: 'Chat', tag: 'self', where: 'anywhere', minutes: { min: 5, default: 15, max: 60 },
    perHour: { social: 30, fun: 6 }, xpPerHour: { charisma: 14 }, anim: 'talk',
    note: 'Target: any NPC. Relationship gain is owned by the social system; this is the need/xp side.',
    flavour: 'So, come here often?' },
  { id: 'phone_call', name: 'Call a Friend', tag: 'self', where: 'anywhere', minutes: { min: 5, default: 15, max: 45 },
    perHour: { social: 20, fun: 4 }, xpPerHour: { charisma: 6 }, anim: 'phone',
    note: 'Target: a contact with relationship >= acquaintance. Started from the Messages app.', flavour: '"No, YOU hang up."' },
  { id: 'check_phone', name: 'Scroll Your Phone', tag: 'self', where: 'anywhere', minutes: { min: 5, default: 10, max: 30 },
    perHour: { fun: 6, social: 3 }, anim: 'phone', flavour: 'A cat video. Another cat video.' },

  // ============================================================ GYM
  { id: 'gym_treadmill', name: 'Run on the Treadmill', tag: 'treadmill', where: 'venue', venues: ['gym'], minutes: { min: 15, default: 45, max: 90 },
    perHour: { energy: -11, hygiene: -12, fun: 3, hunger: -4 }, xpPerHour: { fitness: 45 }, fitnessPerHour: 2.6,
    requires: { access: 'gym', venueOpen: true }, anim: 'treadmill', onComplete: { moodlet: 'pumped' },
    flavour: 'Going nowhere, fast, and loving it.' },
  { id: 'gym_weights', name: 'Lift Weights', tag: 'weights', where: 'venue', venues: ['gym'], minutes: { min: 15, default: 45, max: 90 },
    perHour: { energy: -13, hygiene: -10, fun: 2, hunger: -5 }, xpPerHour: { fitness: 50 }, fitnessPerHour: 2.4,
    requires: { access: 'gym', venueOpen: true }, anim: 'lift', onComplete: { moodlet: 'pumped' },
    flavour: 'Lift with your legs. And your heart.' },
  { id: 'gym_yoga_class', name: 'Join the Yoga Class', tag: 'yoga_studio', where: 'venue', venues: ['gym'], minutes: { min: 60, default: 60, max: 60 }, fixed: true,
    perHour: { energy: -4, hygiene: -4, fun: 10, social: 6 }, xpPerHour: { fitness: 34 }, fitnessPerHour: 1.6,
    requires: { access: 'gym', venueOpen: true }, schedule: { startHours: [8, 12, 18], joinWindowMinutes: 10 },
    social: true, anim: 'stand', onComplete: { moodlet: 'zen' }, flavour: 'Downward dog. Upward mood.' },
  { id: 'gym_shower', name: 'Use the Locker-Room Shower', tag: 'locker_shower', where: 'venue', venues: ['gym'], minutes: { min: 5, default: 15, max: 20 },
    perHour: { hygiene: 260, energy: 4 }, requires: { access: 'gym', venueOpen: true }, anim: 'shower',
    flavour: 'Great water pressure. Mysterious shampoo.' },

  // ============================================================ ARTS QUARTER: cinema, bar, library
  { id: 'watch_movie', name: 'Watch the Film', tag: 'cinema_seat', where: 'venue', venues: ['cinema'], minutes: { min: 120, default: 120, max: 120 }, fixed: true,
    perHour: { fun: 26, energy: 1 }, cost: { amount: 0, per: 'use', item: 'movie_ticket' }, requires: { venueOpen: true },
    schedule: { startHours: [12.5, 15, 17.5, 20, 22.5], joinWindowMinutes: 15 }, social: true, fastForward: true, anim: 'sit',
    onComplete: { moodlet: 'movie_magic' }, flavour: 'Shhh. It is starting.' },
  { id: 'play_arcade', name: 'Play the Lobby Arcade', tag: 'arcade', where: 'venue', venues: ['cinema'], minutes: { min: 10, default: 10, max: 10 },
    perHour: { fun: 30 }, xpPerHour: { logic: 6 }, cost: { amount: 1, per: 'use' }, requires: { venueOpen: true }, social: true, anim: 'stand',
    flavour: 'INSERT COIN. High score: DOT 999,990.' },
  { id: 'bar_hang_out', name: 'Hang Out at the Bar', tag: 'bar_stool', where: 'venue', venues: ['bar'], minutes: { min: 15, default: 45, max: 180 },
    perHour: { fun: 10, social: 14, energy: -1 }, xpPerHour: { charisma: 8 }, requires: { venueOpen: true }, social: true, anim: 'sit',
    note: 'Ordering drinks/food is separate (items.js bar_* dishes).', flavour: 'The bartender knows everyone. Soon, you too.' },
  { id: 'dance', name: 'Hit the Dance Floor', tag: 'dancefloor', where: 'venue', venues: ['bar'], minutes: { min: 10, default: 30, max: 120 },
    perHour: { fun: 24, social: 8, energy: -7, hygiene: -6 }, xpPerHour: { fitness: 10, charisma: 6 }, fitnessPerHour: 1,
    requires: { venueOpen: true, hours: [20, 26] }, social: true, anim: 'dance', onComplete: { moodlet: 'great_night_out' },
    flavour: 'The floor is sticky. The beat is not.' },
  { id: 'watch_live_music', name: 'Watch the Band', tag: 'stage', where: 'venue', venues: ['bar'], minutes: { min: 15, default: 60, max: 180 },
    perHour: { fun: 22, social: 6, energy: -2 }, xpPerHour: { creativity: 8 }, requires: { venueOpen: true, event: 'live_music_friday' },
    social: true, anim: 'cheer', onComplete: { moodlet: 'great_night_out' }, flavour: 'Encore! Encore!' },
  { id: 'open_mic', name: 'Take the Open Mic', tag: 'stage', where: 'venue', venues: ['bar'], minutes: { min: 20, default: 20, max: 20 }, fixed: true,
    perHour: { fun: 30, social: 30, energy: -6 }, xpPerHour: { charisma: 90, creativity: 45 },
    requires: { venueOpen: true, event: 'open_mic_wednesday', skillAny: { charisma: 3, creativity: 3 } },
    anim: 'wave', onComplete: { moodlet: 'stage_glow', money: [8, 40] },
    note: 'One slot per night. Tips scale with max(charisma, creativity) level: $8 at level 3 up to $40 at level 10.',
    flavour: 'Is this thing on?' },
  { id: 'library_study', name: 'Study at a Desk', tag: 'study_desk', where: 'venue', venues: ['library'], minutes: { min: 30, default: 60, max: 180 },
    perHour: { fun: -4, energy: -2 }, xpPerHour: { logic: 48 }, requires: { venueOpen: true }, anim: 'read',
    note: 'Best logic xp in the game, and free. With a skill book in hand: that book\'s skill at 72 xp/h instead.',
    flavour: 'Somebody shushes somebody. Not you. This time.' },
  { id: 'library_read', name: 'Read in the Nook', tag: 'reading_nook', where: 'venue', venues: ['library'], minutes: { min: 15, default: 60, max: 180 },
    perHour: { fun: 12, energy: 1 }, xpPerHour: { creativity: 4 }, requires: { venueOpen: true }, anim: 'read',
    note: 'Any novel from the shelves, free; progress on each title is remembered.', flavour: 'The armchair has claimed you.' },
  { id: 'library_computer', name: 'Use a Public Computer', tag: 'public_computer', where: 'venue', venues: ['library'], minutes: { min: 10, default: 10, max: 60 },
    perHour: { fun: 2 }, requires: { venueOpen: true }, anim: 'type', onComplete: { opens: 'jobs_board_full' },
    note: 'How a newcomer without a computer finds a job: full job listings and applications. No gigs, no games, no shopping.',
    flavour: 'The space bar sticks. The listings are fresh.' },
  { id: 'browse_books', name: 'Browse the Shelves', tag: 'book_browse', where: 'venue', venues: ['bookstore', 'library'], minutes: { min: 10, default: 20, max: 60 },
    perHour: { fun: 9 }, requires: { venueOpen: true }, anim: 'read', flavour: 'That new-book smell. And that old-book smell.' },

  // ============================================================ CAFES & SEATS
  { id: 'linger', name: 'Linger a While', tag: 'seat', where: 'venue', venues: ['cafe', 'bakery', 'diner', 'ramen', 'pizza', 'restaurant', 'bar'],
    minutes: { min: 10, default: 30, max: 120 }, perHour: { fun: 7, social: 5, energy: 2 }, requires: { venueOpen: true, purchasedHere: true },
    social: true, anim: 'sit', note: 'Available after buying anything at the venue; books can be read here too.',
    flavour: 'Watching the world through a steamy window.' },
  { id: 'try_on', name: 'Try Things On', tag: 'fitting_room', where: 'venue', venues: ['clothing'], minutes: { min: 5, default: 10, max: 20 },
    perHour: { fun: 12 }, requires: { venueOpen: true }, anim: 'stand', onComplete: { opens: 'outfit_preview' }, flavour: 'Does this say "new in town" or "mysterious local"?' },

  // ============================================================ OUT IN THE CITY
  { id: 'people_watch', name: 'People-Watch', tag: 'bench', where: 'world', minutes: { min: 5, default: 20, max: 90 },
    perHour: { fun: 8, social: 5, energy: 2 }, xpPerHour: { charisma: 3 }, outdoor: true, social: true, anim: 'sit',
    flavour: 'That man is walking four dachshunds. FOUR.' },
  { id: 'feed_ducks', name: 'Feed the Ducks', tag: 'duck_pond', where: 'world', minutes: { min: 10, default: 10, max: 10 },
    perHour: { fun: 36, social: 6 }, cost: { amount: 0, per: 'use', item: ['duck_feed', 'bread'] }, outdoor: true, social: true, anim: 'stand',
    onComplete: { moodlet: 'fresh_air' }, flavour: 'You are now very popular with fourteen ducks.' },
  { id: 'fish_pier', name: 'Fish off the Pier', tag: 'fishing_spot', where: 'world', minutes: { min: 30, default: 60, max: 180 },
    perHour: { fun: 10, energy: -1 }, requires: { item: 'fishing_rod', notWeather: ['storm'] }, outdoor: true, social: true, fastForward: true, anim: 'stand',
    yieldPerHour: [{ item: 'fish', qty: 1, chance: 0.6 }], note: 'Dawn (05-07) and evening (18-21) raise the catch chance to 0.85.',
    onComplete: { moodlet: 'fresh_air' }, flavour: 'The float bobs. Or was that a wave?' },
  { id: 'ride_ferris_wheel', name: 'Ride the Bay Wheel', tag: 'ferris_wheel', where: 'world', minutes: { min: 15, default: 15, max: 15 }, fixed: true,
    perHour: { fun: 64 }, cost: { amount: 5, per: 'use' }, requires: { hours: [12, 23], notWeather: ['storm'] }, outdoor: true, social: true, anim: 'sit',
    onComplete: { moodlet: 'bay_view' }, flavour: 'From up here, your apartment is a single lit window.' },
  { id: 'jog', name: 'Go for a Jog', tag: 'jog_path', where: 'world', minutes: { min: 15, default: 30, max: 90 },
    perHour: { energy: -10, hygiene: -10, fun: 5, hunger: -4 }, xpPerHour: { fitness: 36 }, fitnessPerHour: 2.2,
    requires: { notWeather: ['storm'] }, outdoor: true, social: true, anim: 'walk', onComplete: { moodlet: 'pumped' },
    note: 'Play the walk cycle at 1.6x speed while following the path.', flavour: 'Overtaken by a labrador. Twice.' },
  { id: 'enjoy_view', name: 'Take In the View', tag: 'viewpoint', where: 'world', minutes: { min: 5, default: 10, max: 30 },
    perHour: { fun: 24, energy: 2 }, outdoor: true, social: true, anim: 'stand', onComplete: { moodlet: 'bay_view' },
    flavour: 'There is the harbour. There is the train. There is home.' },
  { id: 'stargaze', name: 'Stargaze', tag: 'viewpoint', where: 'world', minutes: { min: 15, default: 30, max: 90 },
    perHour: { fun: 14, energy: 1 }, xpPerHour: { logic: 8 }, requires: { hours: [21, 28], weather: ['clear'] }, outdoor: true, social: true, anim: 'sit',
    flavour: 'That bright one is a planet. Or a plane. Probably a plane.' },
  { id: 'garden', name: 'Tend a Garden Bed', tag: 'garden_plot', where: 'world', minutes: { min: 20, default: 45, max: 120 },
    perHour: { fun: 7, energy: -5, hygiene: -6 }, xpPerHour: { handiness: 34 }, fitnessPerHour: 0.6,
    requires: { hours: [6, 20], notWeather: ['storm', 'snow'] }, outdoor: true, social: true, anim: 'work',
    yieldPerHour: [{ item: ['tomato', 'carrot', 'lettuce', 'potato', 'onion'], qty: 1, chance: 0.8 }], // random pick; not in winter
    onComplete: { moodlet: 'fresh_air' }, flavour: 'Dirt under the nails, tomatoes in the bag.' },
  { id: 'swing', name: 'Have a Swing', tag: 'swing', where: 'world', minutes: { min: 5, default: 10, max: 20 },
    perHour: { fun: 30 }, outdoor: true, social: true, anim: 'sit', flavour: 'Higher! Higher!' },
  { id: 'picnic', name: 'Have a Picnic', tag: 'picnic_spot', where: 'world', minutes: { min: 10, default: 20, max: 60 }, durationFrom: 'item',
    perHour: { fun: 12, energy: 2 }, requires: { itemCategory: ['meal', 'ready_meal', 'dish', 'snack'], notWeather: ['rain', 'storm', 'snow'] },
    outdoor: true, social: true, anim: 'eat', onComplete: { moodlet: 'fresh_air' },
    note: 'Eats one food item from the backpack with the picnic fun on top.', flavour: 'Everything tastes better on grass.' },
  { id: 'listen_busker', name: 'Listen to the Busker', tag: 'busker', where: 'world', minutes: { min: 5, default: 10, max: 30 },
    perHour: { fun: 16, social: 3 }, xpPerHour: { creativity: 4 }, cost: { amount: 1, per: 'use', optional: true }, outdoor: true, social: true, anim: 'stand',
    note: 'The optional $1 tip makes the busker wave and adds +2 fun.', flavour: 'An accordion cover of a pop song. It works.' },
  { id: 'sketch_outdoors', name: 'Sketch the Scene', tag: 'bench', where: 'world', minutes: { min: 20, default: 45, max: 120 },
    perHour: { fun: 9, energy: -1 }, xpPerHour: { creativity: 30 }, requires: { item: 'sketchbook', notWeather: ['rain', 'storm', 'snow'] },
    outdoor: true, anim: 'sit', onComplete: { moodlet: 'inspired' }, flavour: 'The pigeon will not hold still.' },
  { id: 'pet_cat', name: 'Pet the Cat', tag: 'street_cat', where: 'world', minutes: { min: 3, default: 3, max: 3 },
    perHour: { fun: 60, social: 40 }, outdoor: true, anim: 'stand',
    note: '= +3 fun, +2 social per pet. 1-in-5 chance the cat follows you for a block.', flavour: 'Prrrrrrrr.' },
  { id: 'watch_planes', name: 'Watch the Planes', tag: 'bench', where: 'world', district: 'airport', minutes: { min: 5, default: 15, max: 60 },
    perHour: { fun: 12, energy: 2 }, outdoor: true, social: true, anim: 'sit', flavour: 'Somebody up there is about to start their own Maple Bay story.' },
];

export const ACTIVITY_BY_ID = Object.fromEntries(ACTIVITIES.map((a) => [a.id, a]));
/** Activities offered by a function tag. */
export const activitiesForTag = (tag) => ACTIVITIES.filter((a) => a.tag === tag);
