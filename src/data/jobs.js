// jobs.js — the 10 careers of Maple Bay, their work loops, the performance/promotion rules and
// one-off gigs. Pure design data.
//
// HOW WORK PLAYS
//   Arrive at the workplace inside the clock-in window, click the staff door / time clock, and the
//   uniform goes on automatically. Then either:
//     ACTIVE  — play the work loop: tasks pop up at stations inside the workplace (click a station,
//               the character walks there and plays the task anim for `minutes`). Each finished task
//               pays its `bonus` immediately and counts toward the shift's task score.
//     AUTO    — press "Auto-work": the shift fast-forwards (WORK_RULES.autoWorkSpeed) and is scored
//               at a flat, decent task score. No task bonuses or tips beyond the auto share.
//   The player can switch between the two at any time during a shift; the task score is pro-rated.
//   Pay lands in the bank at clock-out, every shift (no waiting for payday).
//
// JOBS[] fields
//   id            job id (venues.js `jobId` points here).
//   name          career name;  venue = workplace venue id.
//   blurb         listing text on the jobs board.
//   requires      { skillId: minLevel } to be hired. {} = anyone.
//   listedOn      'phone' = also on the phone Jobs app (entry jobs) | 'computer' = computer/library only.
//   shifts        { days: [0..6, 0 = Monday], start, end } hours; end > 24 = past midnight.
//   levels        4 entries: { level, title, hourly, requires: { skillId: minLevel } } — the skill
//                 requirement is checked in addition to promotion points (WORK_RULES.promotion).
//   trains        { primary: skillId, secondary: skillId|null, xpPerHour: { skillId: xp } } while on shift.
//   uniform       outfit art key worn on shift (not an inventory item; you change back at clock-out).
//   workDrain     extra need change per game hour on shift, ADDED to normal decay (needs.js).
//                 Also `fitnessPerHour` for physical jobs.
//   tips          { perShift: [min, max] } dollars at performance 100 during ACTIVE play, scaled by
//                 score/100 and charisma (needs.js SKILLS charisma.perLevel.tipMult). Auto-work earns
//                 WORK_RULES.autoTipShare of it. null = no tips.
//   perk          small standing benefit of having the job.
//   workLoop      { summary, stations: [function tags inside the workplace], targetTasksPerHour,
//                   tasks: [{ id, name, station, minutes, anim, bonus, desc, unlockLevel? }],
//                   flow: plain-language order/rules for the task spawner, special: rare fun event }
//                 `bonus` is dollars paid per completed task. `targetTasksPerHour` tasks/hour = full
//                 task score (more than that still pays bonuses but does not raise the score).
// Anim names are the shared set: stand walk sit sleep eat drink phone talk wave type work lift
// treadmill carry dance read shower cheer.

export const WORK_RULES = {
  clockIn: { earlyMinutes: 30, graceMinutes: 15 }, // may clock in 30 min early (no extra pay); up to 15 min late is fine
  autoWorkSpeed: 30,     // time multiplier while auto-working (an 8 h shift = 16 real seconds)
  payout: 'at_clock_out',
  leaveEarly: 'paid for hours worked; counts as a shift with a -10 score penalty',
  autoTipShare: 0.4,

  // ---- PERFORMANCE: a 0..100 score computed at clock-out. ----
  //   score = clamp( base + moodPart + skillPart + needsPart + punctuality + taskPart, 0, 100 )
  performance: {
    base: 45,
    moodPart: 'MOOD tier workPerf (needs.js MOOD.tiers: -12..+10) + average of active moodlet workPerf over the shift, total clamped to [-20, +15]',
    skillPart: { perLevelAboveRequirement: 3, max: 15, skill: 'trains.primary' }, // "requirement" = current level's requires (or 1)
    needsPart: 'already inside moodlets (hungry/tired/... carry workPerf); no separate term',
    punctuality: { onTime: 5, late: -5, veryLateAfterMinutes: 60, veryLate: -15 },
    taskPart: { max: 30, active: 'max * min(1, tasksDone / (targetTasksPerHour * activeHours))', auto: 15 },
    // Typical results: auto-work in an okay mood ~65; auto in a great mood ~80; active & happy 90-100.
  },
  // ---- What the score does ----
  payBands: [ // first band whose min <= score applies; multiplies base hourly pay for the shift
    { min: 90, label: 'Outstanding', payMult: 1.15, moodlet: 'good_shift' },
    { min: 70, label: 'Solid', payMult: 1.0, moodlet: null },
    { min: 40, label: 'Off day', payMult: 1.0, moodlet: null },
    { min: 0, label: 'Rough', payMult: 0.9, moodlet: null },
  ],
  // ---- PROMOTION: each completed shift adds its score to promotion points. ----
  promotion: {
    pointsPerShift: 'score',            // 0..100
    pointsToReachLevel: [0, 450, 1100, 2000], // points needed (since the last promotion) to reach level 1,2,3,4
    // => level 2 after ~5-7 shifts, level 3 after another ~11-17, level 4 after another ~20-30.
    alsoNeeds: 'levels[n].requires skills',
    onPromotion: { moodlet: 'promoted', bonus: 'one shift of pay at the new rate' },
  },
  // ---- Being gentle ----
  missedShift: { pointsPenalty: 40, warningAfter: 2, letGoAfterInARow: 4, reapplyAfterDays: 2,
    note: 'A missed shift costs no money. Four in a row and the manager "gives your slot away" — you can re-apply two days later at the same level minus one (never below 1).' },
  dayOff: { requestsPerWeek: 1, viaApp: 'jobs', note: 'One free day off per week via the phone, no penalty. Holidays in calendar.js are paid days off for jobs whose venue is closed.' },
  maxJobs: 1,
  quitting: 'instant, no penalty; promotion points at that employer are kept for 14 days',
};

export const JOBS = [
  // ------------------------------------------------------------------ 1. BARISTA
  { id: 'barista', name: 'Barista', venue: 'cafe', listedOn: 'phone',
    blurb: 'Bean & Gone needs a morning person. Or someone who can fake it with espresso.',
    requires: {},
    shifts: { days: [0, 1, 2, 3, 4], start: 7, end: 13 },
    levels: [
      { level: 1, title: 'Trainee Barista', hourly: 13, requires: {} },
      { level: 2, title: 'Barista', hourly: 15, requires: { charisma: 2 } },
      { level: 3, title: 'Head Barista', hourly: 18, requires: { charisma: 4 } },
      { level: 4, title: 'Cafe Manager', hourly: 23, requires: { charisma: 6, cooking: 2 } },
    ],
    trains: { primary: 'charisma', secondary: 'cooking', xpPerHour: { charisma: 14, cooking: 4 } },
    uniform: 'barista',
    workDrain: { energy: -1, fun: -1, social: 5, hygiene: -1 },
    tips: { perShift: [8, 18] },
    perk: 'One free coffee per shift; 20% off at Bean & Gone.',
    workLoop: {
      summary: 'Take the order, pull the shot, hand it over with a smile.',
      stations: ['till', 'espresso_machine', 'pastry_case', 'pickup_counter', 'cafe_table'],
      targetTasksPerHour: 5,
      tasks: [
        { id: 'take_order', name: 'Take Order', station: 'till', minutes: 3, anim: 'talk', bonus: 0.5, desc: 'A customer walks up with a speech bubble showing a drink (and sometimes a pastry).' },
        { id: 'make_drink', name: 'Make Drink', station: 'espresso_machine', minutes: 5, anim: 'work', bonus: 1, desc: 'Steam, hiss, pour. Level 3+ adds latte art (+$0.50 tip).' },
        { id: 'plate_pastry', name: 'Plate Pastry', station: 'pastry_case', minutes: 2, anim: 'carry', bonus: 0.5, desc: 'Only when the order has a pastry icon.' },
        { id: 'serve', name: 'Serve', station: 'pickup_counter', minutes: 2, anim: 'wave', bonus: 0.5, desc: 'Call the name (always slightly wrong). Customer leaves a heart if under 12 minutes total.' },
        { id: 'wipe_tables', name: 'Wipe Tables', station: 'cafe_table', minutes: 4, anim: 'work', bonus: 0.75, desc: 'Fills quiet moments; a sparkle shows which table.' },
      ],
      flow: 'Orders arrive every 8-14 game minutes (faster 7:30-9:00 rush). Each order chains take_order -> make_drink (-> plate_pastry) -> serve. Up to 3 orders can queue. wipe_tables appears when the queue is empty.',
      special: 'Once a week a food blogger orders "something surprising": pick any drink; charisma check for a $10 tip.',
    } },

  // ------------------------------------------------------------------ 2. GROCERY CLERK
  { id: 'grocery_clerk', name: 'Grocery Clerk', venue: 'grocery', listedOn: 'phone',
    blurb: 'FreshWay Market: stack it, scan it, bag it. Staff discount on everything.',
    requires: {},
    shifts: { days: [1, 2, 3, 4, 5], start: 9, end: 16 },
    levels: [
      { level: 1, title: 'Shelf Stocker', hourly: 12, requires: {} },
      { level: 2, title: 'Cashier', hourly: 14, requires: { handiness: 2 } },
      { level: 3, title: 'Department Lead', hourly: 17, requires: { handiness: 3, charisma: 2 } },
      { level: 4, title: 'Store Manager', hourly: 22, requires: { handiness: 5, charisma: 4 } },
    ],
    trains: { primary: 'handiness', secondary: 'charisma', xpPerHour: { handiness: 12, charisma: 5 } },
    uniform: 'grocer',
    workDrain: { energy: -1.5, fun: -1.5, social: 3, hygiene: -1 },
    tips: null,
    perk: '15% off at FreshWay Market; take home one "wonky veg" ingredient per shift.',
    workLoop: {
      summary: 'Keep the shelves full and the checkout moving.',
      stations: ['stockroom', 'shelf', 'till', 'produce_stand', 'cart_bay'],
      targetTasksPerHour: 4,
      tasks: [
        { id: 'fetch_crate', name: 'Fetch Crate', station: 'stockroom', minutes: 3, anim: 'carry', bonus: 0.5, desc: 'Pick up the crate matching the blinking shelf icon.' },
        { id: 'restock_shelf', name: 'Restock Shelf', station: 'shelf', minutes: 5, anim: 'work', bonus: 1, desc: 'Empty shelf segments blink; carry the crate there and fill it.' },
        { id: 'checkout', name: 'Ring Up Customer', station: 'till', minutes: 4, anim: 'work', bonus: 1, desc: 'Beep, beep, beep. A queue forms if left too long.', unlockLevel: 2 },
        { id: 'mist_produce', name: 'Mist the Produce', station: 'produce_stand', minutes: 3, anim: 'work', bonus: 0.5, desc: 'Veg looks sad until sprayed. Very satisfying sparkle.' },
        { id: 'collect_carts', name: 'Round Up Carts', station: 'cart_bay', minutes: 6, anim: 'carry', bonus: 1, desc: 'Stray carts in the car park; walk them back in a wobbly line.' },
      ],
      flow: 'Every 12-18 game minutes a shelf empties (fetch_crate -> restock_shelf). From level 2 a customer reaches the till every 10-15 minutes. mist_produce hourly; collect_carts twice per shift.',
      special: '"Clean-up on aisle 3": a dropped jar; mop it within 10 minutes for a $3 bonus.',
    } },

  // ------------------------------------------------------------------ 3. LINE COOK
  { id: 'line_cook', name: 'Line Cook', venue: 'diner', listedOn: 'computer',
    blurb: "Dot's Diner. Fast hands, cool head, must respect the pancake.",
    requires: { cooking: 2 },
    shifts: { days: [2, 3, 4, 5, 6], start: 11, end: 19 },
    levels: [
      { level: 1, title: 'Prep Cook', hourly: 14, requires: { cooking: 2 } },
      { level: 2, title: 'Line Cook', hourly: 16, requires: { cooking: 4 } },
      { level: 3, title: 'Sous Chef', hourly: 20, requires: { cooking: 6 } },
      { level: 4, title: 'Head Chef', hourly: 26, requires: { cooking: 8, charisma: 3 } },
    ],
    trains: { primary: 'cooking', secondary: null, xpPerHour: { cooking: 18 } },
    uniform: 'cook',
    workDrain: { energy: -2, fun: -1, social: 2, hygiene: -3 },
    tips: { perShift: [4, 10] },
    perk: 'One free staff meal per shift (hunger +50); 20% off at Dot\'s.',
    workLoop: {
      summary: 'Tickets on the rail, food on the pass.',
      stations: ['ticket_rail', 'prep_counter', 'grill', 'fryer', 'pass_window', 'dish_sink'],
      targetTasksPerHour: 4,
      tasks: [
        { id: 'read_ticket', name: 'Grab Ticket', station: 'ticket_rail', minutes: 1, anim: 'stand', bonus: 0.25, desc: 'Shows the dish and its two steps (e.g. prep + grill).' },
        { id: 'prep', name: 'Prep Ingredients', station: 'prep_counter', minutes: 4, anim: 'work', bonus: 0.75, desc: 'Chop chop chop.' },
        { id: 'grill', name: 'Work the Grill', station: 'grill', minutes: 6, anim: 'work', bonus: 1, desc: 'Burgers, pancakes, eggs. A timing ring: collect in the green for a "perfect" (+$0.50).' },
        { id: 'fry', name: 'Drop the Fries', station: 'fryer', minutes: 4, anim: 'work', bonus: 0.75, desc: 'Basket down, basket up.' },
        { id: 'plate_up', name: 'Plate & Ring the Bell', station: 'pass_window', minutes: 2, anim: 'carry', bonus: 0.75, desc: 'Ding! The server takes it away.' },
        { id: 'wash_dishes', name: 'Wash Dishes', station: 'dish_sink', minutes: 5, anim: 'work', bonus: 0.75, desc: 'Level 1 filler task between tickets.' },
      ],
      flow: 'Tickets arrive every 10-16 game minutes (every 7-10 during 12-14 lunch rush and 17:30-19 dinner). Each ticket: read_ticket -> prep -> grill OR fry -> plate_up. Two tickets can overlap at level 2+. wash_dishes fills gaps.',
      special: 'Dot\'s "Blue Plate Special": a mystery ticket once a shift using a recipe you know at home — $5 bonus if your cooking level meets it.',
    } },

  // ------------------------------------------------------------------ 4. OFFICE ANALYST
  { id: 'office_analyst', name: 'Office Analyst', venue: 'office', listedOn: 'computer',
    blurb: 'Hartwell & Finch seeks a sharp mind for spreadsheets with a view (14th floor).',
    requires: { logic: 3 },
    shifts: { days: [0, 1, 2, 3, 4], start: 9, end: 17 },
    levels: [
      { level: 1, title: 'Junior Analyst', hourly: 20, requires: { logic: 3 } },
      { level: 2, title: 'Analyst', hourly: 25, requires: { logic: 5 } },
      { level: 3, title: 'Senior Analyst', hourly: 32, requires: { logic: 7, charisma: 3 } },
      { level: 4, title: 'Department Director', hourly: 42, requires: { logic: 9, charisma: 5 } },
    ],
    trains: { primary: 'logic', secondary: 'charisma', xpPerHour: { logic: 16, charisma: 3 } },
    uniform: 'office',
    workDrain: { energy: -0.5, fun: -2.5, social: 2, hygiene: 0 },
    tips: null,
    perk: 'Free coffee machine on the floor; paid holidays; quarterly bonus = 1 shift of pay each season end.',
    workLoop: {
      summary: 'Reports, meetings, and the long walk to the printer.',
      stations: ['own_desk', 'printer', 'meeting_room', 'boss_office', 'coffee_machine', 'filing_cabinet'],
      targetTasksPerHour: 3,
      tasks: [
        { id: 'crunch_numbers', name: 'Crunch Numbers', station: 'own_desk', minutes: 12, anim: 'type', bonus: 1.5, desc: 'Fill the progress bar on the report. Core task.' },
        { id: 'print_report', name: 'Print the Report', station: 'printer', minutes: 3, anim: 'stand', bonus: 0.5, desc: '1-in-6 paper jam: an extra 3-minute "fix" (handiness 3+ skips it).' },
        { id: 'deliver_report', name: 'Deliver to the Boss', station: 'boss_office', minutes: 3, anim: 'talk', bonus: 1.5, desc: 'Ends a report chain. A thumbs-up or a "hmm".' },
        { id: 'attend_meeting', name: 'Attend Meeting', station: 'meeting_room', minutes: 20, anim: 'sit', bonus: 2, desc: 'At 10:00 and 15:00. Counts as 2 tasks.' , countsAs: 2 },
        { id: 'file_documents', name: 'File Documents', station: 'filing_cabinet', minutes: 5, anim: 'work', bonus: 0.75, desc: 'Filler between reports.' },
        { id: 'coffee_run', name: 'Coffee for the Team', station: 'coffee_machine', minutes: 4, anim: 'carry', bonus: 0.5, desc: 'Optional once per shift: +5 social and you get one too (energy +10).' },
      ],
      flow: 'A report chain (crunch_numbers x2 -> print_report -> deliver_report) is always available. Meetings are fixed-time. file_documents appears while waiting. The printer and coffee machine are deliberately at opposite ends of the floor.',
      special: 'Friday 16:30 "cake in the kitchen": 10 minutes, +8 fun, +8 social, counts as a task.',
    } },

  // ------------------------------------------------------------------ 5. COURIER
  { id: 'courier', name: 'Courier', venue: 'courier', listedOn: 'phone',
    blurb: 'ZipParcel wants legs. See the whole city, get paid per parcel.',
    requires: {},
    shifts: { days: [0, 1, 2, 3, 4], start: 8, end: 14 },
    levels: [
      { level: 1, title: 'Runner', hourly: 12, requires: {} },
      { level: 2, title: 'Courier', hourly: 14, requires: { fitness: 2 } },
      { level: 3, title: 'Express Courier', hourly: 17, requires: { fitness: 4 } },
      { level: 4, title: 'Route Captain', hourly: 21, requires: { fitness: 6, logic: 3 } },
    ],
    trains: { primary: 'fitness', secondary: null, xpPerHour: { fitness: 16 } },
    uniform: 'courier',
    workDrain: { energy: -2.5, fun: 0.5, social: 2, hygiene: -3, fitnessPerHour: 1 },
    tips: { perShift: [5, 15] },
    perk: 'Free transit while in uniform; you learn every door in town (all venues appear on the Map).',
    workLoop: {
      summary: 'Load up at the depot, find the marked doors, beat the clock. The only job played out in the open city.',
      stations: ['sorting_bench', 'depot_scanner', 'marked_door', 'parcel_locker'],
      targetTasksPerHour: 3,
      tasks: [
        { id: 'load_parcels', name: 'Load the Bag', station: 'sorting_bench', minutes: 4, anim: 'carry', bonus: 0, desc: 'Take a run of 3 parcels (4 at level 3+) for ONE district. Destinations appear as pins on the map/minimap.' },
        { id: 'deliver_door', name: 'Deliver to Door', station: 'marked_door', minutes: 2, anim: 'wave', bonus: 2.5, desc: 'Walk/ride to the glowing door, knock, hand over. Each parcel has a generous timer (45 game min for the run\'s first, +20 each next); on time = +$1.' },
        { id: 'locker_drop', name: 'Locker Drop', station: 'parcel_locker', minutes: 1, anim: 'carry', bonus: 2, desc: 'Some parcels go to a station parcel locker instead of a door — quick and no timer.' },
        { id: 'scan_in', name: 'Scan Back In', station: 'depot_scanner', minutes: 2, anim: 'stand', bonus: 1, desc: 'Return to the depot to close the run and unlock the next.' },
        { id: 'express_parcel', name: 'Express Parcel', station: 'marked_door', minutes: 2, anim: 'wave', bonus: 6, desc: 'A red-flag single parcel across town with a tight (but train-able) 40-minute timer.', unlockLevel: 3 },
      ],
      flow: 'Runs: load_parcels -> deliver_door/locker_drop x3-4 -> scan_in. About 3 runs fit a shift. Run districts start near the depot (Railyard, Downtown, Old Town) and widen with level. Train, bus and taxi are allowed; transit is free in uniform. Late parcels still pay the base bonus — never a penalty. Auto-work resolves runs off-screen.',
      special: '"Fragile: Cake" parcel: do not run (walk speed only) for a $5 bonus from a very relieved customer.',
    } },

  // ------------------------------------------------------------------ 6. FITNESS TRAINER
  { id: 'fitness_trainer', name: 'Fitness Trainer', venue: 'gym', listedOn: 'computer',
    blurb: 'Iron Maple Gym: motivate humans, re-rack weights, own a whistle.',
    requires: { fitness: 4, charisma: 2 },
    shifts: { days: [0, 1, 3, 4, 5], start: 8, end: 14 },
    levels: [
      { level: 1, title: 'Floor Assistant', hourly: 16, requires: { fitness: 4, charisma: 2 } },
      { level: 2, title: 'Trainer', hourly: 19, requires: { fitness: 5, charisma: 3 } },
      { level: 3, title: 'Senior Trainer', hourly: 24, requires: { fitness: 7, charisma: 4 } },
      { level: 4, title: 'Head Coach', hourly: 31, requires: { fitness: 9, charisma: 6 } },
    ],
    trains: { primary: 'fitness', secondary: 'charisma', xpPerHour: { fitness: 14, charisma: 8 } },
    uniform: 'trainer',
    workDrain: { energy: -2.5, fun: 0, social: 5, hygiene: -3, fitnessPerHour: 0.8 },
    tips: { perShift: [5, 14] },
    perk: 'Free gym membership while employed.',
    workLoop: {
      summary: 'Spot, coach, count reps, keep the floor tidy.',
      stations: ['front_desk', 'weights', 'treadmill', 'yoga_studio', 'towel_station'],
      targetTasksPerHour: 4,
      tasks: [
        { id: 'greet_member', name: 'Check In Member', station: 'front_desk', minutes: 2, anim: 'wave', bonus: 0.5, desc: 'Scan the card, hand over a towel.' },
        { id: 'spot_lifter', name: 'Spot a Lifter', station: 'weights', minutes: 6, anim: 'lift', bonus: 1.25, desc: 'A member with a "!" at the bench needs a spotter.' },
        { id: 'coach_runner', name: 'Coach a Runner', station: 'treadmill', minutes: 5, anim: 'cheer', bonus: 1, desc: 'Cheer them through their last minute.' },
        { id: 'rerack_weights', name: 'Re-rack Weights', station: 'weights', minutes: 4, anim: 'carry', bonus: 0.75, desc: 'Somebody never puts the dumbbells back.' },
        { id: 'restock_towels', name: 'Restock Towels', station: 'towel_station', minutes: 3, anim: 'carry', bonus: 0.5, desc: 'Fluffy filler task.' },
        { id: 'lead_class', name: 'Lead the Class', station: 'yoga_studio', minutes: 45, anim: 'stand', bonus: 8, desc: 'Lead the 12:00 class; counts as 4 tasks.', unlockLevel: 2, countsAs: 4 },
      ],
      flow: 'A member needs something every 8-14 game minutes (random of greet/spot/coach). Clutter tasks (re-rack, towels) accumulate one per 30 minutes. From level 2 you lead the 12:00 class.',
      special: 'A nervous first-timer: stay with them through three stations for a $6 tip and a new contact.',
    } },

  // ------------------------------------------------------------------ 7. LIBRARIAN
  { id: 'librarian', name: 'Librarian', venue: 'library', listedOn: 'computer',
    blurb: 'Maple Bay Public Library: guardians of quiet. Cardigan optional but encouraged.',
    requires: { logic: 2 },
    shifts: { days: [1, 2, 3, 4, 5], start: 10, end: 17 },
    levels: [
      { level: 1, title: 'Library Page', hourly: 14, requires: { logic: 2 } },
      { level: 2, title: 'Library Assistant', hourly: 16, requires: { logic: 3 } },
      { level: 3, title: 'Librarian', hourly: 20, requires: { logic: 5, charisma: 2 } },
      { level: 4, title: 'Head Librarian', hourly: 26, requires: { logic: 7, charisma: 4 } },
    ],
    trains: { primary: 'logic', secondary: 'creativity', xpPerHour: { logic: 13, creativity: 4 } },
    uniform: 'librarian',
    workDrain: { energy: -0.5, fun: -0.5, social: 2, hygiene: 0 },
    tips: null,
    perk: 'Calmest job in town (lowest fun drain); skill books read at the library give +25% xp.',
    workLoop: {
      summary: 'Shelve, stamp, shush, recommend.',
      stations: ['return_cart', 'bookshelf_section', 'front_desk', 'reading_room', 'story_corner'],
      targetTasksPerHour: 4,
      tasks: [
        { id: 'collect_returns', name: 'Load the Cart', station: 'return_cart', minutes: 2, anim: 'carry', bonus: 0.25, desc: 'Take 3 colour-coded books from the returns slot.' },
        { id: 'shelve_books', name: 'Shelve by Colour', station: 'bookshelf_section', minutes: 4, anim: 'work', bonus: 0.75, desc: 'Each book goes to the section with the matching colour band.' },
        { id: 'check_out', name: 'Stamp a Loan', station: 'front_desk', minutes: 3, anim: 'work', bonus: 0.75, desc: 'Ka-chunk. Patron leaves happy.' },
        { id: 'recommend', name: 'Recommend a Book', station: 'front_desk', minutes: 4, anim: 'talk', bonus: 1, desc: 'Patron shows a genre icon; pick the matching cover out of three.', unlockLevel: 2 },
        { id: 'shush', name: 'Shush', station: 'reading_room', minutes: 1, anim: 'talk', bonus: 0.5, desc: 'A noise squiggle appears over a chatty table. Shhh!' },
        { id: 'story_time', name: 'Read Story Time', station: 'story_corner', minutes: 30, anim: 'read', bonus: 6, desc: 'Saturdays 11:00, for a carpet of kids; counts as 3 tasks.', unlockLevel: 3, countsAs: 3 },
      ],
      flow: 'Returns pile up one batch per 20 game minutes (collect_returns -> shelve_books x3). A patron reaches the desk every 12-18 minutes. shush pops randomly about twice an hour.',
      special: 'A rare book turns up in the returns: deliver it to the archive room for a $5 bonus and a line of city lore.',
    } },

  // ------------------------------------------------------------------ 8. NURSE
  { id: 'nurse', name: 'Nurse', venue: 'clinic', listedOn: 'computer',
    blurb: 'Bayside Clinic. Steady hands, warm bedside manner, endless lollipops.',
    requires: { logic: 4, charisma: 3 },
    shifts: { days: [0, 1, 2, 3, 4], start: 8, end: 16 },
    levels: [
      { level: 1, title: 'Nursing Assistant', hourly: 22, requires: { logic: 4, charisma: 3 } },
      { level: 2, title: 'Staff Nurse', hourly: 27, requires: { logic: 5, charisma: 4 } },
      { level: 3, title: 'Senior Nurse', hourly: 34, requires: { logic: 7, charisma: 5 } },
      { level: 4, title: 'Head Nurse', hourly: 44, requires: { logic: 9, charisma: 7 } },
    ],
    trains: { primary: 'logic', secondary: 'charisma', xpPerHour: { logic: 12, charisma: 10 } },
    uniform: 'nurse',
    workDrain: { energy: -2, fun: -1.5, social: 5, hygiene: -1 },
    tips: null,
    perk: 'Free check-ups; pass-out bills are waived.',
    workLoop: {
      summary: 'Call them in, check them over, send them home smiling.',
      stations: ['reception', 'waiting_room', 'exam_room', 'supply_cabinet', 'chart_desk'],
      targetTasksPerHour: 3,
      tasks: [
        { id: 'call_patient', name: 'Call Next Patient', station: 'waiting_room', minutes: 2, anim: 'wave', bonus: 0.5, desc: 'Patient follows you to a free exam room.' },
        { id: 'take_vitals', name: 'Take Vitals', station: 'exam_room', minutes: 6, anim: 'work', bonus: 1.5, desc: 'Thermometer, cuff, "say aah".' },
        { id: 'fetch_supplies', name: 'Fetch Supplies', station: 'supply_cabinet', minutes: 3, anim: 'carry', bonus: 0.75, desc: 'The patient bubble shows what is needed: bandage, ice pack or lollipop.' },
        { id: 'treat', name: 'Patch Up', station: 'exam_room', minutes: 6, anim: 'work', bonus: 2, desc: 'Apply what you fetched. Patient leaves with a heart.' },
        { id: 'update_chart', name: 'Update Charts', station: 'chart_desk', minutes: 5, anim: 'type', bonus: 1, desc: 'Paperwork closes the case; can be batched.' },
      ],
      flow: 'A patient arrives every 15-25 game minutes: call_patient -> take_vitals -> fetch_supplies -> treat -> update_chart. Up to 2 patients in parallel at level 2+. Nothing here is ever scary: scraped knees, sniffles, a kid with a bead up their nose.',
      special: 'An NPC you know comes in; treating them gives a relationship boost and a thank-you text later.',
    } },

  // ------------------------------------------------------------------ 9. DOCK WORKER
  { id: 'dock_worker', name: 'Dock Worker', venue: 'warehouse', listedOn: 'phone',
    blurb: 'Pier 7 Freight. Early starts, heavy crates, the best sunrise in town.',
    requires: { fitness: 2 },
    shifts: { days: [0, 1, 2, 3, 4], start: 6, end: 14 },
    levels: [
      { level: 1, title: 'Dock Hand', hourly: 16, requires: { fitness: 2 } },
      { level: 2, title: 'Freight Handler', hourly: 18, requires: { fitness: 3, handiness: 2 } },
      { level: 3, title: 'Forklift Operator', hourly: 22, requires: { fitness: 5, handiness: 4 } },
      { level: 4, title: 'Dock Supervisor', hourly: 28, requires: { fitness: 6, handiness: 6 } },
    ],
    trains: { primary: 'handiness', secondary: 'fitness', xpPerHour: { handiness: 11, fitness: 11 } },
    uniform: 'dockworker',
    workDrain: { energy: -3, fun: -1, social: 2, hygiene: -4, fitnessPerHour: 1.2 },
    tips: null,
    perk: 'Done by 14:00 with the whole afternoon free; fishing at the pier catches +20% while employed.',
    workLoop: {
      summary: 'Crates off the truck, onto the right pallet, out on the right boat.',
      stations: ['truck_bay', 'colour_pallet', 'manifest_board', 'forklift', 'ship_ramp'],
      targetTasksPerHour: 4,
      tasks: [
        { id: 'unload_crate', name: 'Unload Crate', station: 'truck_bay', minutes: 3, anim: 'lift', bonus: 0.5, desc: 'Each crate has a colour stripe.' },
        { id: 'stack_crate', name: 'Stack on Pallet', station: 'colour_pallet', minutes: 3, anim: 'carry', bonus: 0.75, desc: 'Carry it to the pallet of the same colour. 4 crates complete a pallet.' },
        { id: 'check_manifest', name: 'Tick the Manifest', station: 'manifest_board', minutes: 2, anim: 'stand', bonus: 0.5, desc: 'After each full pallet.' },
        { id: 'drive_forklift', name: 'Forklift Run', station: 'forklift', minutes: 6, anim: 'sit', bonus: 2.5, desc: 'Move a full pallet to the ship ramp. Beep beep beep.', unlockLevel: 3 },
        { id: 'load_ship', name: 'Hand-Load the Boat', station: 'ship_ramp', minutes: 5, anim: 'carry', bonus: 1.25, desc: 'Before level 3, pallets go aboard crate by crate.' },
      ],
      flow: 'A truck arrives every 40 game minutes with 8 crates (unload_crate -> stack_crate each). Full pallet -> check_manifest -> load_ship (or drive_forklift from level 3, which is quicker and pays more). 09:30-09:45 is tea break: sit on a crate, +6 energy, +6 social.',
      special: 'A crate marked "LIVE CRABS" scuttles off the pallet once a week; catch it for a $5 bonus.',
    } },

  // ------------------------------------------------------------------ 10. BARTENDER
  { id: 'bartender', name: 'Bartender', venue: 'bar', listedOn: 'computer',
    blurb: 'The Blue Heron, nights. Pour, shake, listen. Tips are yours.',
    requires: { charisma: 2 },
    shifts: { days: [2, 3, 4, 5, 6], start: 18, end: 24 },
    levels: [
      { level: 1, title: 'Barback', hourly: 12, requires: { charisma: 2 } },
      { level: 2, title: 'Bartender', hourly: 14, requires: { charisma: 4 } },
      { level: 3, title: 'Mixologist', hourly: 17, requires: { charisma: 6, creativity: 3 } },
      { level: 4, title: 'Bar Manager', hourly: 22, requires: { charisma: 8, creativity: 4 } },
    ],
    trains: { primary: 'charisma', secondary: 'creativity', xpPerHour: { charisma: 15, creativity: 5 } },
    uniform: 'bartender',
    workDrain: { energy: -1.5, fun: 1, social: 7, hygiene: -1.5 },
    tips: { perShift: [20, 45] }, // the low wage is on purpose: this job lives on tips (double on live-music Fridays)
    perk: 'Free entry and front-row view on live music nights; mornings free.',
    workLoop: {
      summary: 'Read the room, mix the drink, keep the glasses coming.',
      stations: ['bar_counter', 'beer_taps', 'cocktail_station', 'glass_washer', 'bar_stool'],
      targetTasksPerHour: 5,
      tasks: [
        { id: 'take_order', name: 'Take Order', station: 'bar_counter', minutes: 2, anim: 'talk', bonus: 0.25, desc: 'Customer bubble: beer, cocktail or mocktail.' },
        { id: 'pour_beer', name: 'Pour a Draft', station: 'beer_taps', minutes: 2, anim: 'work', bonus: 0.5, desc: 'Tilt, pour, perfect head.' },
        { id: 'mix_cocktail', name: 'Shake a Cocktail', station: 'cocktail_station', minutes: 5, anim: 'work', bonus: 1.25, desc: 'Three ingredient icons in order, then shake. Level 3+ unlocks the signature Blue Heron (+$1 tip).', unlockLevel: 2 },
        { id: 'serve_drink', name: 'Slide It Over', station: 'bar_counter', minutes: 1, anim: 'wave', bonus: 0.25, desc: 'Tip jar clinks.' },
        { id: 'wash_glasses', name: 'Wash Glasses', station: 'glass_washer', minutes: 4, anim: 'work', bonus: 0.5, desc: 'Clean-glass counter drops as you serve; refill it.' },
        { id: 'lend_an_ear', name: 'Lend an Ear', station: 'bar_stool', minutes: 6, anim: 'talk', bonus: 1.5, desc: 'A regular wants to talk. Charisma xp and a bigger tip.' },
      ],
      flow: 'Orders every 6-10 game minutes (every 4-6 from 21:00, and on event nights): take_order -> pour_beer OR mix_cocktail -> serve_drink. Every 6 drinks needs wash_glasses. lend_an_ear once or twice a shift. Level 1 barbacks pour beer and wash; cocktails start at level 2.',
      special: 'Friday band request: carry a round to the stage mid-set for a shout-out (+$8 tip, +10 fun).',
    } },
];

// ---------------------------------------------------------------------------------------------
// GIGS — one-off paid tasks. No commitment, no promotion; a way to earn before (or beside) a job.
//   id, name, blurb
//   source        'computer' (home computer only) | 'phone' (Jobs app; also listed on computers).
//   where         'home_computer' | district/poi/venue hint for outdoor gigs.
//   requires      { skillId: minLevel }
//   minutes       game minutes; fast-forwardable.
//   pay           [min, max] dollars: min at the required skill level, +1/9 of the range per level of
//                 `paySkill` above it, x computer gigPayMult for computer gigs.
//   xp            { skillId: xp } for one completion.
//   needs         total need change over the gig (on top of normal decay);  fitness = Fitness stat gain.
//   anim          animation while doing it.
//   availability  hours window and weekdays it is offered;  outdoor gigs are cancelled in storms.
//   loop          for outdoor gigs: the simple playable version.
// GIG_RULES: at most `maxPerDay` gigs per day; each gig id has a cooldown so the list rotates.
// ---------------------------------------------------------------------------------------------
export const GIG_RULES = { maxPerDay: 2, cooldownHoursPerGig: 20, offeredAtOnce: 3 };

export const GIGS = [
  { id: 'gig_data_entry', name: 'Data Entry', blurb: 'Type what the scan says. Then again. Then again.',
    source: 'computer', where: 'home_computer', requires: {}, minutes: 60, pay: [16, 24], paySkill: 'logic',
    xp: { logic: 15 }, needs: { fun: -6, energy: -2 }, anim: 'type', availability: { hours: [0, 24], days: [0, 1, 2, 3, 4, 5, 6] } },
  { id: 'gig_freelance_writing', name: 'Freelance Writing', blurb: 'The Maple Bay Gazette needs 400 words on "Our Best Benches".',
    source: 'computer', where: 'home_computer', requires: { creativity: 2 }, minutes: 120, pay: [40, 85], paySkill: 'creativity',
    xp: { creativity: 50 }, needs: { fun: -4, energy: -4 }, anim: 'type', availability: { hours: [0, 24], days: [0, 1, 2, 3, 4, 5, 6] } },
  { id: 'gig_online_tutoring', name: 'Online Tutoring', blurb: 'Help a Hillcrest teenager survive algebra.',
    source: 'computer', where: 'home_computer', requires: { logic: 3 }, minutes: 90, pay: [45, 90], paySkill: 'logic',
    xp: { logic: 30, charisma: 15 }, needs: { fun: -3, energy: -3, social: 10 }, anim: 'type', availability: { hours: [15, 21], days: [0, 1, 2, 3, 4, 6] } },
  { id: 'gig_dog_walking', name: 'Dog Walking', blurb: 'Biscuit, Noodle and Sir Barksalot need their loop of the park.',
    source: 'phone', where: 'poi_park_loop', requires: {}, minutes: 60, pay: [22, 34], paySkill: 'fitness',
    xp: { fitness: 20 }, needs: { fun: 10, social: 6, energy: -6, hygiene: -4 }, fitness: 1, anim: 'walk',
    availability: { hours: [7, 19], days: [0, 1, 2, 3, 4, 5, 6] },
    loop: 'Collect 1-3 dogs from a Maplewood/Old Town doorstep, walk the park loop past 4 sniff-spots (click each), return them. Dogs trot behind on leads.' },
  { id: 'gig_flyers', name: 'Flyer Distribution', blurb: 'Slice of Heaven has a new topping and the city must know.',
    source: 'phone', where: 'downtown', requires: {}, minutes: 90, pay: [24, 38], paySkill: 'charisma',
    xp: { charisma: 25 }, needs: { fun: -2, social: 12, energy: -5 }, fitness: 0.5, anim: 'wave',
    availability: { hours: [10, 18], days: [0, 1, 2, 3, 4, 5] },
    loop: 'Pick up a stack at the client venue, hand a flyer to 12 passers-by (click walkers; charisma raises the accept rate) or pin them on 6 notice boards.' },
  { id: 'gig_furniture_assembly', name: 'Furniture Assembly', blurb: 'A neighbour bought a wardrobe with 214 parts.',
    source: 'phone', where: 'client_home', requires: { handiness: 2 }, minutes: 75, pay: [30, 60], paySkill: 'handiness',
    xp: { handiness: 40 }, needs: { fun: -2, energy: -5, social: 6 }, anim: 'work',
    availability: { hours: [9, 19], days: [5, 6] } },
];

export const JOB_BY_ID = Object.fromEntries(JOBS.map((j) => [j.id, j]));
/** Hours in a job's shift. */
export const shiftHours = (job) => job.shifts.end - job.shifts.start;
/** Base weekly pay at a level (1..4) with no bonuses or tips. */
export const weeklyBasePay = (job, level) => job.levels[level - 1].hourly * shiftHours(job) * job.shifts.days.length;
