// phone.js — the player's phone: the hub for every menu in Maple Bay. Pure design data.
//
// DESIGN RULES
//   - One screen of apps, 3x3 grid, never more than 9 icons. Seven are there at the start, two unlock.
//   - Every app answers ONE question ("who?", "when?", "where?", "how much?", "how am I?").
//   - Opening the phone slows time to 0 only during the tutorial; otherwise the world keeps moving at
//     1x so checking the phone on a train feels natural (character plays the `phone` anim).
//   - Cut on purpose: a separate Contacts app (it is the "People" tab inside Messages — one place for
//     everybody) and a Camera app (photo mode is a button in Settings; no gallery to manage).
//
// APPS[] fields
//   id         app id.     name / icon   label and 12x12 icon brief.
//   slot       position 0..8 in the 3x3 grid (row-major).
//   question   the one question the app answers (also its subtitle).
//   unlock     { at: 'start' } | { at: 'tutorial', step } | { at: 'condition', desc, flag }.
//   badge      what makes the red dot / number appear on the icon.
//   tabs       [{ id, name, shows, actions: [..] }] — plain-language spec of each screen.
//   notes      extra rules.

export const PHONE = {
  grid: [3, 3],
  openAnim: 'phone',
  statusBar: ['clock', 'weekday', 'weather icon', 'money'], // always visible at the top of the phone
  quickActions: ['call_taxi', 'next_appointment'],            // long-press / shortcut row under the grid
  knownPlaces: 'A place becomes "known" (pickable as a taxi/map destination) when visited once or mentioned in a message. Your home, the airport, all train stations, and your sibling\'s and grandma\'s homes are known from the start.',
};

export const APPS = [
  { id: 'messages', name: 'Messages', icon: 'green speech bubble', slot: 0, question: 'Who wants me?',
    unlock: { at: 'start' }, badge: 'unread messages',
    tabs: [
      { id: 'chats', name: 'Chats', shows: 'Conversation threads, newest first. Story beats, invitations, job texts, landlord, delivery updates.',
        actions: ['reply with 2-3 canned choices', 'accept / decline invitation (accept adds it to Planner)', 'open sender in People'] },
      { id: 'people', name: 'People', shows: 'Contacts list: portrait, name, relationship hearts, where they usually are right now (if friend+), birthday, liked gift tags you have discovered.',
        actions: ['call (phone_call activity)', 'text', 'invite out (pick a known venue + time -> Planner)', 'invite over (needs home; max guests per homes.js)', 'show their home/work on Map'] },
    ],
    notes: 'A contact is added the first time you finish a `chat` with a named NPC. Family (sibling, grandma) and your old school friend are there from the start.' },

  { id: 'planner', name: 'My Day', icon: 'calendar page with a red ring', slot: 1, question: 'What is on my day, and what could be?',   // was 'Planner' (owner msg 107: schedule vs ideas; ui/phone_planner.js has My Schedule / Ideas / Week)
    unlock: { at: 'start' }, badge: 'an appointment within the next 2 hours',
    tabs: [
      { id: 'today', name: 'Today', shows: 'Timeline of today: work shift, appointments, venue events, bills due; weather now + 3-day forecast (calendar.js WEATHER_RULES.forecastDays).',
        actions: ['tap an entry -> show on Map / call taxi there', 'set wake-up alarm (used by the sleep activity)'] },
      { id: 'calendar', name: 'Calendar', shows: 'The 14-day season grid with event dots (all calendar.js EVENTS are pre-filled), birthdays, shift days, rent day.',
        actions: ['tap a day -> list', 'add appointment'] },
      { id: 'add', name: 'Add Appointment', shows: 'Form: title (preset list: Gym, Dinner, Meet <contact>, Shopping, Custom), day, time, place (known places), reminder (15 min / 1 h / none), optional invitee.',
        actions: ['save -> appears in Today/Calendar and fires a reminder notification', 'invitee gets a message and answers within the hour'] },
    ],
    notes: 'Keeping an appointment with a contact on time gives a small relationship bonus; missing one sends a gentle "rain check?" text, nothing worse.' },

  { id: 'map', name: 'Map', icon: 'folded map with a red pin', slot: 2, question: 'Where is it, and is it open?',
    unlock: { at: 'start' }, badge: null,
    tabs: [
      { id: 'city', name: 'City', shows: 'Stylised map: districts, the light-rail loop with the 8 stations, bus lines, you-are-here, home, work, pins for known venues (icon by venue type). Unknown venues show as grey dots.',
        actions: ['tap a venue -> card: name, blurb, today\'s hours, OPEN/CLOSED now, nearest station', 'set as destination (draws a walking guide line in the world)', 'call taxi there', 'filter: food / shops / fun / services / friends'] },
      { id: 'transit', name: 'Transit', shows: 'Loop line diagram with next train times at the nearest station, bus stops nearby, fares (economy.js FARES), your pass status and days left.',
        actions: ['buy / renew Weekly Transit Pass', 'plan a trip: station A -> B shows ride minutes'] },
    ],
    notes: 'Working as a courier reveals every venue on the map (jobs.js courier perk).' },

  { id: 'taxi', name: 'MapleCab', icon: 'yellow cab front, checker stripe', slot: 3, question: 'Can someone just drive me?',
    unlock: { at: 'tutorial', step: 'intro_airport' }, badge: 'cab arriving',
    tabs: [
      { id: 'ride', name: 'Ride', shows: 'Pick-up = your current location (nearest kerb). Destination list: Home, Work, recent, then all known places grouped by district. Fare quote before confirming (economy.js FARES.taxi) and ETA (venues.js TRANSIT_SERVICE.taxi).',
        actions: ['confirm ride -> cab drives to you in-world; get in by clicking it', 'cancel (free until the cab arrives)', 'tip $0 / $1 / $2 at the end'] },
    ],
    notes: 'The very first ride (airport -> your new studio) is the tutorial and is pre-paid by your sibling. If you cannot afford a fare the app offers the nearest station instead.' },

  { id: 'bank', name: 'Bay Bank', icon: 'gold coin with maple leaf', slot: 4, question: 'How much do I have?',
    unlock: { at: 'start' }, badge: 'bill due within 24 h, or balance below 0',
    tabs: [
      { id: 'balance', name: 'Balance', shows: 'Big balance number, this week\'s in/out bar, next Monday\'s bill itemised (economy.js BILLS).', actions: ['pay bills early'] },
      { id: 'activity', name: 'Activity', shows: 'Last 30 transactions with icons (pay, shop, fare, tip...).', actions: [] },
      { id: 'home_and_loans', name: 'Home & Loans', shows: 'Lease or mortgage status, weeks left, loan balance, auto-renewals (gym, transit pass).',
        actions: ['toggle auto-renewals', 'repay loan early', 'note: new loans, leases and purchases need a visit to Bay Realty & Trust'] },
    ],
    notes: null },

  { id: 'jobs', name: 'Jobs', icon: 'brown briefcase', slot: 5, question: 'How do I earn?',
    unlock: { at: 'start' }, badge: 'shift starts within 1 hour, or new gig available',
    tabs: [
      { id: 'my_job', name: 'My Job', shows: 'Title, level, hourly pay, next shift, promotion progress bar and missing skill requirements, last 5 shift scores.',
        actions: ['request a day off (1 per week)', 'show workplace on Map', 'quit (confirm)'] },
      { id: 'board', name: 'Board (Lite)', shows: 'Only jobs with `listedOn: "phone"` (barista, grocery clerk, courier, dock worker) and gigs with `source: "phone"` (dog walking, flyers, furniture assembly).',
        actions: ['apply (entry jobs: hired on the spot, first shift = next scheduled day)', 'accept gig -> adds to Planner'] },
    ],
    notes: 'The FULL board — all 10 jobs and computer gigs — needs a home computer or a free public computer at the library. The Lite board tells you so in a footer line.' },

  { id: 'wellness', name: 'Wellness', icon: 'pink heart with pulse line', slot: 6, question: 'How am I doing?',
    unlock: { at: 'start' }, badge: 'any need in the critical band',
    tabs: [
      { id: 'needs', name: 'Me', shows: 'Mood face + tier, the five need bars with band labels, Fitness stat, active moodlets as chips with time left (tap for description).',
        actions: ['tap a low need -> one suggestion with a Map link ("Hungry? Dot\'s Diner is open and 4 min away")'] },
      { id: 'skills', name: 'Skills', shows: 'Six skills with level, xp bar, what the next level unlocks (recipes, job levels, gigs).', actions: [] },
      { id: 'journal', name: 'Journal', shows: 'Small achievements & firsts ("First home-cooked meal", "Rode the Bay Wheel"), recipes known, books read.', actions: [] },
    ],
    notes: 'The HUD shows only the mood face and any need below 30; the full picture lives here.' },

  { id: 'delivery', name: 'ZipEats', icon: 'paper bag with a lightning bolt', slot: 7, question: 'Can dinner come to me?',
    unlock: { at: 'condition', flag: 'ate_at_delivery_venue', desc: 'After your first meal at Dot\'s Diner, Noodle Lantern or Slice of Heaven you get a flyer with a download code.' },
    badge: 'order on the way',
    tabs: [
      { id: 'order', name: 'Order', shows: 'Menus (takeaway-able mains and snacks) of venues with `delivers: true` that are open now; fee and ETA from economy.js DELIVERY.foodDelivery.',
        actions: ['order to home only', 'reorder last'] },
    ],
    notes: 'A ZipParcel courier NPC rings your doorbell 30-45 game minutes later. Convenient, never cheaper than cooking.' },

  { id: 'settings', name: 'Settings', icon: 'grey cog', slot: 8, question: 'Game stuff.',
    unlock: { at: 'start' }, badge: null,
    tabs: [
      { id: 'save', name: 'Save', shows: '3 save slots + autosave (every game morning at 06:00 and on entering home).', actions: ['save', 'load', 'export / import save file'] },
      { id: 'options', name: 'Options', shows: 'Game speed (1x / 3x), music & sound volume, text size, colour-blind need icons, edge scrolling.', actions: [] },
      { id: 'photo', name: 'Photo Mode', shows: 'Hides the UI, free camera pan/zoom, time-of-day stays live.', actions: ['save PNG'] },
      { id: 'help', name: 'Help', shows: 'Replay tutorials; the game\'s gentle rules in one page (nobody dies, nobody gets evicted).', actions: [] },
    ],
    notes: null },
];

// ---------------------------------------------------------------------------------------------
// NOTIFICATIONS — banners that slide in at the top of the screen and land in the matching app.
//   id        notification type id.
//   app       app that owns it (tapping the banner opens it).
//   priority  'low' (silent, badge only) | 'normal' (banner + soft chime) | 'high' (banner stays until tapped).
//   trigger   when it fires.
//   example   sample text ({placeholders} filled by the game).
//   cooldownMinutes  minimum game minutes between two of the same type (0 = none).
// At most 1 banner is visible at a time; others queue. Low-priority ones never interrupt an activity.
// ---------------------------------------------------------------------------------------------
export const NOTIFICATIONS = [
  { id: 'message_received', app: 'messages', priority: 'normal', trigger: 'an NPC texts you', example: '{name}: "Dumplings on Lantern Row tonight?"', cooldownMinutes: 0 },
  { id: 'story_beat', app: 'messages', priority: 'high', trigger: 'a story beat from family/old friend arrives (every 2-3 days, 09:00-20:00 only)', example: 'Grandma: "I made too much soup. Come by?"', cooldownMinutes: 0 },
  { id: 'invitation', app: 'messages', priority: 'normal', trigger: 'a contact invites you somewhere', example: '{name} invited you to The Orpheum, Fri 20:00', cooldownMinutes: 0 },
  { id: 'new_contact', app: 'messages', priority: 'low', trigger: 'a named NPC is added to People', example: '{name} added to People', cooldownMinutes: 0 },
  { id: 'appointment_reminder', app: 'planner', priority: 'normal', trigger: 'reminder time of a Planner entry', example: 'In 1 hour: Dinner with {name} at Noodle Lantern', cooldownMinutes: 0 },
  { id: 'event_today', app: 'planner', priority: 'low', trigger: 'calendar.js EVENTS[].notify hours before an event', example: 'Today: Saturday Farmers\' Market, 8:00-14:00, Old Town', cooldownMinutes: 0 },
  { id: 'weather_alert', app: 'planner', priority: 'low', trigger: '05:00 roll gives rain, storm or snow', example: 'Rain today. Umbrella weather!', cooldownMinutes: 720 },
  { id: 'shift_reminder', app: 'jobs', priority: 'normal', trigger: '60 game minutes before a shift (and 15 before if not yet at the workplace)', example: 'Shift at Bean & Gone starts at 7:00', cooldownMinutes: 0 },
  { id: 'shift_result', app: 'jobs', priority: 'normal', trigger: 'clock-out', example: 'Solid shift! +$84 pay, +$11 tips. Promotion: 62%', cooldownMinutes: 0 },
  { id: 'promotion', app: 'jobs', priority: 'high', trigger: 'promotion earned', example: 'You are now Head Barista! $18/hour', cooldownMinutes: 0 },
  { id: 'gig_available', app: 'jobs', priority: 'low', trigger: 'a new phone gig appears', example: 'New gig: Dog Walking, $22-34', cooldownMinutes: 240 },
  { id: 'bill_reminder', app: 'bank', priority: 'normal', trigger: 'Sunday 18:00 (economy.js BILLS.reminder)', example: 'Rent & bills tomorrow: $188', cooldownMinutes: 0 },
  { id: 'bill_paid', app: 'bank', priority: 'low', trigger: 'Monday 08:00 charge', example: 'Paid: rent $160, utilities $20, phone $8', cooldownMinutes: 0 },
  { id: 'low_balance', app: 'bank', priority: 'normal', trigger: 'balance drops below $50, or below 0', example: 'Balance is low: $38', cooldownMinutes: 1440 },
  { id: 'need_low', app: 'wellness', priority: 'normal', trigger: 'a need enters its low band', example: 'Getting hungry...', cooldownMinutes: 180 },
  { id: 'need_critical', app: 'wellness', priority: 'high', trigger: 'a need enters its critical band', example: 'You are exhausted. Find a bed (or a cab home).', cooldownMinutes: 90 },
  { id: 'skill_up', app: 'wellness', priority: 'normal', trigger: 'a skill gains a level', example: 'Cooking is now level 3! New recipes unlocked.', cooldownMinutes: 0 },
  { id: 'journal_first', app: 'wellness', priority: 'low', trigger: 'a Journal "first" is recorded', example: 'Journal: First ride on the Bay Wheel', cooldownMinutes: 0 },
  { id: 'taxi_arriving', app: 'taxi', priority: 'normal', trigger: 'the cab is 1 minute away / has arrived', example: 'Your MapleCab is outside', cooldownMinutes: 0 },
  { id: 'delivery_update', app: 'delivery', priority: 'normal', trigger: 'food order at the door; furniture delivered; parcel ready at ZipParcel', example: 'Ding-dong! Your pizza is here', cooldownMinutes: 0 },
  { id: 'food_spoiling', app: 'wellness', priority: 'low', trigger: 'something in the fridge has 1 day left (max once a day, lists all)', example: 'Use soon: Fresh Fish, Berries', cooldownMinutes: 1440 },
  { id: 'pass_expiring', app: 'map', priority: 'low', trigger: 'transit pass or gym membership has 1 day left and auto-renew is off', example: 'Transit pass ends tomorrow', cooldownMinutes: 1440 },
  { id: 'autosave', app: 'settings', priority: 'low', trigger: 'autosave completed', example: 'Saved', cooldownMinutes: 0 },
];

export const APP_BY_ID = Object.fromEntries(APPS.map((a) => [a.id, a]));
