// =============================================================================
// Maple Bay — TEXTS  (src/story/texts.js)
// Every other bit of writing: phone messages, barks, headlines, signs, tips,
// achievements. Voice: modern American, warm, short. Phone messages <= 160 chars,
// spoken barks <= 90. Tokens: {name} player, {npc} sender/other person's short name,
// {venue} venue sign name, {time} e.g. "7:30 PM", {day} e.g. "Saturday" / "tonight",
// {amount} money, {job} job title, {level} new job title, {building} building name.
//
// EXPORTS
//   VENUE_TYPES     { [type]: venueId[] }  categories used by invites.
//   FRIEND_INVITES  [{ from, minTier, venueType, when, text }]
//       Random "let's hang out" texts. The game picks an eligible friend, resolves a
//       concrete venue from venueType (a VENUE_TYPES key or a venueId), picks a time
//       matching `when`, fills {venue}/{time}/{day}, and creates a pending appointment.
//       from     'any-friend' (tier friend+) | 'any-close' (tier close) | 'any-family'
//                | a specific npcId
//       when     'morning' | 'lunch' | 'afternoon' | 'evening' | 'night' | 'weekend'
//   INVITE_REPLIES  { playerAccept, playerDecline, npcOnAccept, npcOnDecline, npcReminder,
//                     npcStoodUp, npcAfterGood }   string[] each. Player lines are the reply
//                   buttons; npc lines are what comes back.
//   VISIT_REPLIES   responses when the PLAYER invites an NPC over / out:
//       accept[tier], decline.tooLate, decline.tooEarly, decline.atWork, decline.lowRelationship,
//       decline.busy, arriving, leaving   (string[] each; tier = acquaintance|friend|close|family)
//   CHECK_INS       { friend: string[], close: string[], family: string[] }  no-reply-needed
//                   friendly texts ("thinking of you") by tier.
//   OCCASIONS       { birthdayToPlayer: { family, close, friend }, birthdayReminder,
//                     seasonStart: {spring,summer,autumn,winter}: [{from,text}],
//                     holidays: [{ id, season, day, name, texts: [{from,text}] }] }
//                   season days are 1..14. from may be an npcId or 'any-friend'.
//   LANDLORD        { rentReminder, rentDueToday, rentPaid, rentLate, rentVeryLate, misc } (from 'walt')
//   JOB_TEXTS       { [jobId]: { boss, offer, firstDay, goodShift, promotion: string[3], warning,
//                     lastWarning, letGo } }   all sent by JOBS[jobId].boss. promotion[i] is
//                   sent on reaching level i+2. Even "letGo" is kind and leaves the door open.
//   JOB_LEVELS      { [jobId]: string[4] }  titles for levels 1-4, used for {level}.
//   VENUE_BARKS     { [venueId]: { speaker, greeting: string[], thanks: string[], closing? } }
//                   speaker = npcId who says it when present (otherwise generic staff).
//   HEADLINES       [{ text, tag? }]  The Maple Bay Gazette daily headline. tag (optional)
//                   restricts when it can appear: a season id, a weather id, or an event id.
//   SIGNS           { shops: string[], small: string[], posters: string[], murals: string[],
//                     chalkboards: string[] }
//                   shops/small are ALL CAPS and <= 12 chars (fit a pixel sign).
//   LOADING_TIPS    string[]
//   ACHIEVEMENTS    [{ id, name, desc, when }]   `when` is a suggested trigger for programmers.
// =============================================================================

export const VENUE_TYPES = {
  coffee:   ['cafe', 'bakery'],
  food:     ['diner', 'ramen', 'pizza'],
  fancy:    ['restaurant'],
  drinks:   ['bar'],
  active:   ['gym', 'park', 'lookout'],
  culture:  ['cinema', 'bookstore', 'library'],
  outdoors: ['park', 'pier', 'lookout'],
  shopping: ['clothing', 'homegoods', 'grocery'],
};

export const FRIEND_INVITES = [
  { from: 'any-friend', minTier: 'friend', venueType: 'coffee',   when: 'morning',   text: "Coffee at {venue}? I'm headed there around {time} and it's better with company." },
  { from: 'any-friend', minTier: 'friend', venueType: 'coffee',   when: 'weekend',   text: "Slow {day} morning. {venue}, {time}? I'll grab the good table." },
  { from: 'any-friend', minTier: 'friend', venueType: 'food',     when: 'lunch',     text: "Lunch? {venue} at {time}. I've been thinking about it since breakfast." },
  { from: 'any-friend', minTier: 'friend', venueType: 'food',     when: 'evening',   text: "I refuse to cook tonight. {venue}, {time}. You in?" },
  { from: 'any-friend', minTier: 'friend', venueType: 'food',     when: 'evening',   text: "Hungry? {venue} at {time}. I'll save you a seat and maybe a fry." },
  { from: 'any-friend', minTier: 'friend', venueType: 'drinks',   when: 'night',     text: "Long week. {venue} at {time}? First round's on me. Second's on you. That's math." },
  { from: 'any-friend', minTier: 'friend', venueType: 'drinks',   when: 'night',     text: "There's a band at {venue} {day}. They might be good! {time}?" },
  { from: 'any-friend', minTier: 'friend', venueType: 'culture',  when: 'evening',   text: "The Orpheum's showing something old and weepy {day}. {time}. I'll bring tissues, you bring popcorn money." },
  { from: 'any-friend', minTier: 'friend', venueType: 'outdoors', when: 'afternoon', text: "It's too nice to be inside. {venue}, {time}? I'll bring snacks." },
  { from: 'any-friend', minTier: 'friend', venueType: 'outdoors', when: 'evening',   text: "Sunset at {venue} is supposed to be ridiculous {day}. Meet me there at {time}?" },
  { from: 'any-friend', minTier: 'friend', venueType: 'active',   when: 'morning',   text: "I'm trying to be a morning-exercise person. Be one with me? {venue}, {time}." },
  { from: 'any-friend', minTier: 'friend', venueType: 'shopping', when: 'weekend',   text: "I need a second opinion and you have opinions. {venue}, {day} at {time}?" },
  { from: 'any-close',  minTier: 'close',  venueType: 'food',     when: 'evening',   text: "I had a day. I need noodles and your face. {venue}, {time}?" },
  { from: 'any-close',  minTier: 'close',  venueType: 'fancy',    when: 'evening',   text: "Hear me out: we get dressed up for no reason. {venue}, {day}, {time}. I already booked. Say yes." },
  { from: 'any-close',  minTier: 'close',  venueType: 'outdoors', when: 'night',     text: "Can't sleep. Walk with me? {venue} in a bit, say {time}. No agenda." },
  { from: 'any-close',  minTier: 'close',  venueType: 'coffee',   when: 'morning',   text: "I have news and I'm not texting it. {venue}. {time}. Bring your listening face." },
  { from: 'any-family', minTier: 'friend', venueType: 'food',     when: 'lunch',     text: "Family lunch! {venue}, {time}. Don't make me send Pip to get you." },
  { from: 'kit',     minTier: 'friend', venueType: 'bar',       when: 'night',     text: "slow night at the Heron. come keep me company at {time}? I'll invent a drink and name it after you" },
  { from: 'kit',     minTier: 'friend', venueType: 'cinema',    when: 'evening',   text: "monday classics at the Orpheum, {time}. it's black and white and somebody definitely dies. come??" },
  { from: 'dez',     minTier: 'friend', venueType: 'ramen',     when: 'lunch',     text: "CUZ. Noodle Lantern. {time}. I'm between deliveries and starving. You're buying, I'm tipping." },
  { from: 'dez',     minTier: 'friend', venueType: 'gym',       when: 'afternoon', text: "Gym at {time}? I'll spot you. I've never dropped anyone. On purpose." },
  { from: 'jules',   minTier: 'friend', venueType: 'cafe',      when: 'weekend',   text: "Theo has the kids for an hour. AN HOUR. Bean & Gone at {time}? I need adult conversation." },
  { from: 'jules',   minTier: 'friend', venueType: 'park',      when: 'weekend',   text: "We're taking the kids to the park {day} around {time}. Come get pushed on a swing by a six-year-old?" },
  { from: 'nana',    minTier: 'friend', venueType: 'bakery',    when: 'morning',   text: "Darling, meet me at Rise & Shine at {time}. Roz has a new bun and I need a second opinion. Love Nana" },
  { from: 'theo',    minTier: 'friend', venueType: 'pizza',     when: 'lunch',     text: "I'm at Slice of Heaven at {time} like every weekday of my life. Join me? I'll expense it to 'family'." },
  { from: 'tav',     minTier: 'friend', venueType: 'park',      when: 'morning',   text: "River loop at {time}? We can walk it. I'll only jog in place a little." },
  { from: 'vik',     minTier: 'friend', venueType: 'park',      when: 'afternoon', text: "Table three is free at {time}. Come and lose with dignity. I will bring the tea." },
  { from: 'noor',    minTier: 'friend', venueType: 'ramen',     when: 'evening',   text: "hi! I'm getting ramen at {time} after practice. want to come? no worries if not!! (but it'd be nice)" },
  { from: 'captain', minTier: 'friend', venueType: 'pier',      when: 'morning',   text: "TIDE IS IN. GOOD LIGHT. COME SIT. THE CAPTAIN. (Kit typed this for me.)" },
  { from: 'marlow',  minTier: 'friend', venueType: 'bar',       when: 'night',     text: "Off the clock for once. Heron at {time}? I promise not to judge anyone's coffee order for a whole evening." },
  { from: 'barnaby', minTier: 'close',  venueType: 'restaurant', when: 'evening',  text: "I require a dining companion with honest taste buds. The Gilded Gull, {time}. The Gazette pays." },
  { from: 'tasha',   minTier: 'friend', venueType: 'lookout',   when: 'weekend',   text: "Hillcrest stairs, {day}, {time}. All 301. We stop at Mercy bench exactly once. You've got this!" },
];

export const INVITE_REPLIES = {
  playerAccept: ["I'm in!", 'Yes! See you there.', "Wouldn't miss it.", 'Save me a seat.', "Say less. I'll be there."],
  playerDecline: ["Can't today, so sorry!", 'Rain check?', "I'm wiped. Next time for sure.", 'Working, ugh. Soon?'],
  npcOnAccept: [
    'Yay! See you at {time}.',
    'Perfect. {venue}, {time}. Bring your appetite.',
    "It's a date. Not a DATE date. Unless? Kidding. See you there.",
    "Great! I'll be the one waving too much.",
    "Love it. Don't be late. Or be late, I'll order snacks.",
  ],
  npcOnDecline: [
    'No worries at all! Next time.',
    "Totally fine. Rain check accepted and filed.",
    "Aw, okay! Rest up. The offer doesn't expire.",
    "All good. I'll eat your share in your honor.",
  ],
  npcReminder: [
    'Still on for {venue} at {time}?',
    "Heading to {venue} soon! See you in a bit.",
    "I'm early. I'm never early. Hurry up before I get weird about it.",
  ],
  npcStoodUp: [
    "Hey, missed you at {venue}! Everything okay? No stress, let's try again soon.",
    "I waited a bit and then ate both desserts. So really, thank you. Next time?",
    "No-show, huh? You're forgiven. This city eats schedules. Rain check!",
  ],
  npcAfterGood: [
    'That was fun. Same time next week? Or sooner. Sooner works.',
    "Home safe! Thanks for today. I needed that.",
    "I'm still laughing about the thing. You know the thing.",
    "Good food, good company. 10/10, would hang again.",
  ],
};

export const VISIT_REPLIES = {
  accept: {
    acquaintance: ["Oh! Sure, why not. I'll swing by for a bit.", "That's nice of you. Okay! Give me the address."],
    friend: ["On my way! I'm bringing snacks. Don't argue.", "Yes! I've been wanting to see the place.", "Be there in a bit. Is there a couch? I love a couch."],
    close: ["Already putting my shoes on.", "Coming. I'm bringing dessert and zero judgment about the boxes.", "Door open? I'm basically there."],
    family: ["Coming over! Do you have enough plates? I'm bringing plates.", "On my way, darling. I have baked. Naturally.", "Be right there. Is the fridge still sad? I'm bringing food."],
  },
  decline: {
    tooLate: ["It's so late! I'm already in pajamas. Tomorrow?", "At this hour? I'm a pumpkin after ten. Soon, though!", "Zzz. I mean: rain check. Zzz."],
    tooEarly: ["The sun's barely up! Ask me again after coffee.", "It's SO early. Admirable. No."],
    atWork: ["Stuck at work! Come say hi here instead?", "On shift till later. After?", "Can't, I'm on the clock. Don't tell my boss I'm texting."],
    lowRelationship: ["Oh, that's kind! Maybe once we know each other a little better?", "Thanks for asking! I'm a bit shy about house visits. Coffee first?"],
    busy: ["Ah, I've got plans tonight. Another day?", "Can't today, but ask me again. I mean it.", "Swamped! Soon, I promise."],
  },
  arriving: ["Knock knock! Nice place. Small! But nice.", "I'm here! Ooh, you have a lamp now.", "Hi hi hi. Where do shoes go?", "It smells good in here. Is that food or a candle?"],
  leaving: ["I should head out. This was really nice.", "Thanks for having me! Your place is coming together.", "Okay, I'm off before I fall asleep on your couch.", "Next time, my place. Fair's fair."],
};

export const CHECK_INS = {
  friend: [
    'Saw a dog in a raincoat and thought of you. No reason.',
    "How's the new place treating you? Hot water behaving?",
    "The bakery has those knots again. This is a public service announcement.",
    "Hope work's going okay! You've got this.",
    "Random: have you tried the pier at sunset yet? Do that.",
    "Just walked past your street. Waved at your window like a weirdo.",
  ],
  close: [
    "Thinking about you. That's it. That's the text.",
    "Did you eat today? Real food. Chips are not a meal. (They're a side.)",
    "I told someone about my friend {name} today and realized I meant 'best friend'. Anyway. Hi.",
    "You'd tell me if you weren't okay, right? Good. Just checking.",
    "The city's better with you in it. Okay bye.",
  ],
  family: [
    "Are you sleeping enough? You never slept enough. - J",
    "Milo wants to know if you have seen any dinosaurs yet. Please advise.",
    "Darling, I made soup. Too much soup. Come and take some. Love Nana",
    "Pip made a pie chart of our family. You're 14%. It's a lot, apparently.",
    "Proud of you. No occasion. Just am. - J",
    "CUZ. Saw you on Market St but I was going 25 mph. Waved with my heart.",
  ],
};

export const OCCASIONS = {
  birthdayToPlayer: {
    family: [
      { from: 'jules', text: "HAPPY BIRTHDAY {name}!!! Dinner at ours tonight, no arguments. The kids made a banner. It's 9 feet long." },
      { from: 'nana', text: 'Happy birthday my darling. I remember the day you were born. You were loud then too. Cake is on my table. Love Nana' },
      { from: 'dez', text: 'HBD CUZ!! I got you something. It fell off my bike. I got you something else.' },
      { from: 'theo', text: 'Happy birthday! I built you a thing. It mostly stands. Many happy returns.' },
    ],
    close: [
      "Happy birthday, you! I'm so glad you were born and then moved here specifically.",
      "HAPPY BIRTHDAY! Drinks on me tonight. Cake on me too. Actual cake, on my shirt, I dropped it. Buying another.",
      "It's your birthday!! I refuse to let you spend it doing laundry. Call me.",
    ],
    friend: [
      'Happy birthday, {name}! Hope the day is good to you.',
      'A little bird (Birdie) told me it is your birthday. Happy birthday!',
      "Happy birthday! Stop by, there's a treat with your name on it.",
    ],
  },
  birthdayReminder: [
    "It's {npc}'s birthday tomorrow! A little gift goes a long way.",
    "Psst. {npc}'s birthday is today.",
  ],
  seasonStart: {
    spring: [
      { from: 'jules', text: "First day of spring! The garden plots open Saturday. I'm putting you down for weeding. It's 'optional'." },
      { from: 'any-friend', text: "It's officially spring. I'm officially sitting outside. Join me?" },
    ],
    summer: [
      { from: 'dez', text: 'SUMMER. Swimming off the breakwater is legal again. Probably. Come on!!' },
      { from: 'any-friend', text: 'First day of summer! The pier has soft-serve again. This is not a drill.' },
    ],
    autumn: [
      { from: 'nana', text: 'Autumn, darling. Our season. The Maple Festival is the first Saturday. I am warming up the oven and my elbows. Love Nana' },
      { from: 'any-friend', text: "The whole city just turned orange overnight. Go look at the park. I'll wait." },
    ],
    winter: [
      { from: 'walt', text: 'Winter. Heat is on. If the radiator bangs, that is normal. If it sings, call me.' },
      { from: 'any-friend', text: 'First frost! Lantern Night is the first Saturday. Start thinking about your wish.' },
    ],
  },
  holidays: [
    { id: 'blossom_day', season: 'spring', day: 7, name: 'Blossom Day', texts: [
      { from: 'any-friend', text: "Happy Blossom Day! The trees on Thimble Street are showing off. Picnic in the park at noon, everyone's going." },
    ] },
    { id: 'harbor_lights', season: 'summer', day: 6, name: 'Harbor Lights', texts: [
      { from: 'any-friend', text: "Harbor Lights tonight! Fireworks off the pier at 9. Get there early, the good railing goes fast." },
      { from: 'jules', text: "Fireworks tonight! We'll be on the pier with a blanket and too many snacks. Find us!" },
    ] },
    { id: 'summer_fair', season: 'summer', day: 13, name: 'Maplewood Summer Fair', texts: [
      { from: 'pip', text: 'This is Pip on Moms phone. The Summer Fair is today. Attendance is expected. Bring coins.' },
    ] },
    { id: 'maple_festival', season: 'autumn', day: 6, name: 'The Maple Festival', texts: [
      { from: 'any-friend', text: 'HAPPY MAPLE FESTIVAL! Parade at 11, tree tapping at noon, pie contest at 1. Wear something leafy.' },
      { from: 'roz', text: "Festival day! I've got maple taffy coming out of my ears. Come by the bakery stall before it's gone." },
    ] },
    { id: 'spooky_night', season: 'autumn', day: 13, name: 'Lantern Row Fright Night', texts: [
      { from: 'dez', text: "Fright Night on Lantern Row tonight. Costumes, dumplings, a guy in a very bad ghost sheet (me). Come!" },
    ] },
    { id: 'lantern_night', season: 'winter', day: 6, name: 'Lantern Night', texts: [
      { from: 'any-friend', text: 'Lantern Night tonight. Pier at 9. Bring a wish and a warm coat.' },
      { from: 'haru', text: 'Lantern Night. Noodle Lantern closes at 6. Free soup at the pier after. Come hungry.' },
    ] },
    { id: 'new_year', season: 'winter', day: 14, name: "New Year's Eve", texts: [
      { from: 'kit', text: "NYE at the Heron!! Lou's letting me pick the midnight song. come count down with us. wear something sparkly or don't" },
      { from: 'nana', text: 'Happy New Year my darling. I will be asleep by ten but I am celebrating in spirit. Love Nana' },
    ] },
  ],
};

export const LANDLORD = {
  rentReminder: [
    'Walt here. Rent is due Monday. {amount}. This is the friendly reminder.',
    'Rent due in 2 days. {amount}. The second reminder is also friendly. Just shorter.',
  ],
  rentDueToday: [
    'Rent day. {amount}. Pay in the Bank app. Or bring cash. I count slow but I count right.',
    'It is Monday. You know what Monday is. {amount}.',
  ],
  rentPaid: [
    'Got it. Thanks. You are officially my favorite tenant until someone else pays.',
    'Rent received. Right on time. I did not expect that. Good.',
    'Paid. Thank you. I fixed your porch light as a bonus. It was bugging me.',
  ],
  rentLate: [
    'Rent is a day late. Happens. Get it to me this week and we are square.',
    'Walt again. Still no rent. I am not mad. I am a little mad. Mostly not. Call me if you are in a bind.',
  ],
  rentVeryLate: [
    'Kid. A week late now. Come talk to me. We can work something out. I have been broke too. It is not a crime.',
  ],
  misc: [
    'Water off 10 to noon Tuesday. Pipe work. Fill a pot. Do not ask what I found in the pipe.',
    'Package for you at my door. It rattles. Not my business.',
    'Somebody left the front door propped again. It was not you. I am telling everyone it was not them.',
    'Heat is on. If you are cold, kick the radiator. Gently. Left side.',
    'Mr. Pike says thanks for the visit. He told me the fog story after. All of it.',
    'Building potluck Sunday, 5 PM, the stoop. Bring a dish. Noor is bringing dal. I am bringing a chair.',
  ],
};

export const JOB_LEVELS = {
  barista:         ['Trainee Barista', 'Barista', 'Senior Barista', 'Shift Lead'],
  grocery_clerk:   ['Bagger', 'Clerk', 'Senior Clerk', 'Assistant Manager'],
  line_cook:       ['Dishwasher', 'Prep Cook', 'Line Cook', 'Head Cook'],
  office_analyst:  ['Junior Analyst', 'Analyst', 'Senior Analyst', 'Associate Partner'],
  courier:         ['Runner', 'Courier', 'Express Courier', 'Route Captain'],
  fitness_trainer: ['Front Desk', 'Floor Coach', 'Trainer', 'Head Trainer'],
  librarian:       ['Page', 'Library Assistant', 'Librarian', 'Senior Librarian'],
  nurse:           ['Nursing Aide', 'Nurse', 'Senior Nurse', 'Charge Nurse'],
  dock_worker:     ['Loader', 'Dock Hand', 'Forklift Operator', 'Crew Lead'],
  bartender:       ['Barback', 'Bartender', 'Senior Bartender', 'Bar Manager'],
};

export const JOB_TEXTS = {
  barista: {
    boss: 'marlow',
    offer: "Hi {name}, Marlow from Bean & Gone. Got your application! You're hired. First shift's on your calendar. Wear shoes you can stand in.",
    firstDay: "First day! Don't stress. Everyone burns the milk once. I'll be right next to you.",
    goodShift: "Smooth shift today. Three regulars asked your name. That's the whole job, honestly.",
    promotion: [
      "You've earned it: you're a {level} now. Raise starts today. Also you get to draw in the foam.",
      "Making you {level}. You taught the new kid the grinder without being asked. I saw that.",
      "{level}. You get keys now. That's trust. And early mornings. Mostly trust.",
    ],
    warning: "Hey. You've been late a couple times. Everything okay? I need you here on time. The morning rush doesn't wait.",
    lastWarning: "{name}, I like you a lot, but I can't keep covering your shifts. Next missed one and I have to rethink this. Talk to me.",
    letGo: "I'm so sorry, but I have to let you go. It's the schedule, not you. You're still welcome here. First cup's always on me.",
  },
  grocery_clerk: {
    boss: 'priya',
    offer: "Hello {name}! Priya at FreshWay. Welcome to the team! Your apron is waiting. First shift is on your calendar. Eggs on top!",
    firstDay: 'First day tip: smile, scan, bag heavy to light. And nobody knows where the capers are. Aisle 6.',
    goodShift: 'Lovely work today. A customer said you bag "like an artist". High praise. I teared up a little.',
    promotion: [
      "Congratulations, {level}! More pay, and you get the price gun. Use it wisely.",
      "You're now {level}. You handled the Saturday rush like a pro. My mother would approve, and she approves of nothing.",
      "{level}! You get the stockroom keys and a say in the produce order. Choose good peaches.",
    ],
    warning: "{name}, you've missed some shift time lately. I need to be able to count on you. Is something going on? My door is open.",
    lastWarning: "This is hard to write. One more no-show and I'll have to give your hours away. Please come talk to me first.",
    letGo: "I have to let you go, {name}, and I hate it. You're a good person in a bad stretch. Come back in a season and ask me again.",
  },
  line_cook: {
    boss: 'dot',
    offer: "Dot here. You start this week. Shift's on your calendar. Bring an apron if you got one. If not I got forty.",
    firstDay: "First day, hon. Rule one: hot plate, say 'hot plate'. Rule two: there's no rule two till you learn rule one.",
    goodShift: "Not bad today. Trucker at table 4 said the hash browns were 'like his mother's'. He never says anything.",
    promotion: [
      "Moving you up to {level}. Don't make a thing of it. Raise is in your check.",
      "You're {level} now. You kept your head in the lunch rush. I've seen grown cooks cry in that rush.",
      "{level}. I'm showing you the pie recipe. Nobody's seen that recipe. You tell anyone, I'll know.",
    ],
    warning: "Hon. You've been late. Eggs don't flip themselves. Get here on time, we're square.",
    lastWarning: "I don't like this text. One more missed shift and I gotta find somebody else. Don't make me. I like how you do the bacon.",
    letGo: "I gotta let you go, hon. Kitchen needs somebody every day. No hard feelings. Your booth's still your booth. Pie's on me.",
  },
  office_analyst: {
    boss: 'margaret',
    offer: 'Hartwell & Finch is pleased to offer you a position. Your start time is on your calendar. Business casual. We define casual narrowly. - M. Hartwell',
    firstDay: 'Welcome. Your desk is by the window. The fern is yours now. Water it Mondays. Reports are due Fridays. Do not confuse the two.',
    goodShift: 'Your report was clear, correct, and early. I read it twice, voluntarily. - MH',
    promotion: [
      'Effective today you are {level}. The raise is automatic. The respect you already had. - MH',
      "Promoting you to {level}. Your numbers are good. Your instincts are better. Don't let it go to your head.",
      '{level}. You get an office with a door. Finch never had a door. Make of that what you will. - MH',
    ],
    warning: 'A note on punctuality: you have been late three times. I notice everything. Please correct this. - MH',
    lastWarning: '{name}, I would prefer not to lose you. One more unexplained absence leaves me no choice. My door is open before 9. - MH',
    letGo: 'I am sorry. We are ending your position. You are capable; the timing was not. I will give you a reference that will make you blush. - MH',
  },
  courier: {
    boss: 'rhonda',
    offer: "ZipParcel dispatch, Rhonda! You're hired, hon! Shift's on your calendar. Bring legs. We supply the bag, the bike, and the gossip.",
    firstDay: "Day one! Rule: package gets there dry, on time, and right side up. Two out of three is a talk with me. Go get 'em!",
    goodShift: "Dispatch to {name}: every drop on time today. A lady on Hillcrest called to say you were 'a delight'. Over!",
    promotion: [
      "Copy this: you're a {level} now! More pay, better routes. Dez is jealous. Don't tell him I said that.",
      "Bumping you to {level}. You did the Hillcrest stairs with a floor lamp. Legends get raises.",
      "{level}! You pick your routes now. And you get the good radio. Use the power wisely. Over and out.",
    ],
    warning: "Hey hon, dispatch here. Couple of late starts this week. Packages can't wait and neither can I. Everything okay?",
    lastWarning: "Rhonda, serious voice. One more missed shift and I have to pull your routes. I don't want to. Call me, we'll figure it out.",
    letGo: "Hon, I have to let you go. Hate it. The routes need a body every day. You're still family here. Coffee's always on at the depot.",
  },
  fitness_trainer: {
    boss: 'tasha',
    offer: "{name}! Coach Tasha, Iron Maple. YOU'RE HIRED! First shift's on your calendar. Bring water and a good attitude. I supply the whistle.",
    firstDay: "Day one! Remember: we don't yell AT people, we yell FOR people. Big difference. Let's go!",
    goodShift: "Great shift! Mr. Alvarez did his first push-up in ten years and he says it's because of you. I may cry.",
    promotion: [
      "PROMOTION! You're {level} now! Raise included! I am doing a lap of the gym about it!",
      "You're moving up to {level}. Members ask for you by name. That's the only metric I care about.",
      "{level}!! You get your own class slot. Name it whatever you want. (Not 'Leg Day Forever', that's mine.)",
    ],
    warning: "Hey. You've missed some shift time. Showing up is 90% of this job and this life. What's going on? Talk to me.",
    lastWarning: "{name}, coach to athlete: one more no-show and I have to bench you for good. I believe in you. Prove me right.",
    letGo: "This is the worst part of my job. I have to let you go. You're always welcome on the floor. Lifetime guest pass. I mean it.",
  },
  librarian: {
    boss: 'ines',
    offer: 'Dear {name}, the Maple Bay Public Library would be glad to have you. Your first shift is on your calendar. Soft shoes, please. - Ines Castillo',
    firstDay: 'Welcome. Three rules: shelve by number, shush by eyebrow, and never tell a child a book is too old for them.',
    goodShift: 'A patron left a note: "the new one found my book in two minutes." I have pinned it to the staff board.',
    promotion: [
      'I am pleased to make you {level}. A small raise, and your own date stamp. Guard it.',
      'You are now {level}. Story hour attendance has doubled since you started doing the voices.',
      '{level}. You now hold the key to Local History. The ghost is harmless. Say good morning anyway.',
    ],
    warning: 'A quiet word: you have been late several times. The library opens at 8:30 whether we are ready or not. Please be ready.',
    lastWarning: '{name}, I say this with care: one more missed shift and I must give your hours to another. Come and see me.',
    letGo: 'I am sorry to end your position. The desk must be staffed. Your card remains valid forever, and so does my good opinion.',
  },
  nurse: {
    boss: 'samira',
    offer: "Hi {name}, Samira at Bayside Clinic. We'd love to have you. First shift's on your calendar. Comfortable shoes. I can't stress the shoes enough.",
    firstDay: "First day. Wash hands, listen first, chart everything. And eat lunch. Nurses who skip lunch become patients.",
    goodShift: "You were wonderful with Mrs. Okafor today. She's scared of needles and she left laughing. That's the work.",
    promotion: [
      "Good news: you're now {level}. More pay, more responsibility. You've earned both.",
      "Promoting you to {level}. You stayed calm when the waiting room didn't. I noticed.",
      "{level}. You'll be running the floor some days. I wouldn't hand it to just anyone.",
    ],
    warning: "{name}, you've been late to a few shifts. Patients are counting on us. Are you okay? Tell me if you need a schedule change.",
    lastWarning: "I have to be direct: another missed shift and I can't keep you on the roster. Please come talk to me before it gets there.",
    letGo: "I'm sorry, {name}. I have to let you go. The clinic needs certainty. You have the heart for this. Rest, then try again.",
  },
  dock_worker: {
    boss: 'gus',
    offer: 'Gus. Pier 7. You start this week. Calendar has it. Boots. Gloves. Coffee is there.',
    firstDay: 'First day. Yellow line. Lift with legs. Ask if unsure. Cats have right of way.',
    goodShift: 'Good work today. Bosun sat on your jacket. He does not sit on just any jacket.',
    promotion: [
      'You are {level} now. More pay. You earned it. That is all.',
      'Moving you to {level}. You watch out for the others. I see it.',
      '{level}. You run the crew when I am out. I am never out. But still.',
    ],
    warning: 'You were late. Ship does not wait. Tide does not wait. Be on time.',
    lastWarning: 'Do not want to write this. One more miss and I need a new hand. Come see me. I will listen.',
    letGo: 'Have to let you go. Sorry. Pier needs every hand, every day. Come by anyway. Cats will ask about you.',
  },
  bartender: {
    boss: 'lou',
    offer: "Lou at the Heron. Kit vouched for you, and I trust her ears. You're hired. Shift's on your calendar. Wear black. It hides everything.",
    firstDay: "First night. Pour slow, listen fast, and cut off anyone who requests a song before nine.",
    goodShift: "Good night tonight. Tip jar's heavy and nobody cried who didn't want to. That's a bar done right.",
    promotion: [
      "You're {level} now, kid. Raise is in the till. You've got the touch.",
      "Making you {level}. You talked a guy out of texting his ex. That's senior-level work.",
      "{level}. You close on your own now. Keys are on the hook. Don't let the band talk you into a lock-in.",
    ],
    warning: "Kid. You've been late. A bar runs on rhythm. You're throwing off the band. Fix it?",
    lastWarning: "I don't like playing the heavy. One more missed night and I gotta give the shift away. Come see me before then.",
    letGo: "Gotta let you go, kid. It's the schedule, not the person. Your stool's still your stool. First one's on the house.",
  },
};

export const VENUE_BARKS = {
  grocery:     { speaker: 'priya',   greeting: ['Welcome to FreshWay! Baskets on your left.', 'Peaches are perfect today. Just saying.'],
                 thanks: ['Thanks! Eggs on top, okay?', 'See you soon. Cook something good!'], closing: 'We close in ten! Grab your milk!' },
  cornerstore: { speaker: 'mr_oh',   greeting: ['Welcome. Take your time.', 'Evening. Milk is in the back.'],
                 thanks: ['Thank you. Come again.', 'Good choice. The cat approves.'], closing: 'Closing at nine. Like always.' },
  cafe:        { speaker: 'marlow',  greeting: ['Hey! What can I get started?', "Morning! The usual, or feeling brave?"],
                 thanks: ["Enjoy! It's a good batch today.", 'Thanks! Corner seat is open.'], closing: "Last call for lattes. I'm turning off the machine." },
  bakery:      { speaker: 'roz',     greeting: ['Morning, sunshine! Everything is warm.', 'Welcome! The knots just came out.'],
                 thanks: ['Enjoy, honey! Come back hungry.', "Thank you! Say hi to Bea for me."], closing: 'Sold out! Come earlier tomorrow, sleepyhead.' },
  diner:       { speaker: 'dot',     greeting: ['Sit anywhere, hon.', 'Coffee? That was not a question.'],
                 thanks: ['Thanks, hon. Come back hungry.', "Take a mint. Take two, I'm not your mother."], closing: "Kitchen's closing, hon. Last call for pie." },
  ramen:       { speaker: 'haru',    greeting: ['Welcome. Sit. Slurping is encouraged.', 'One moment. The noodles are deciding.'],
                 thanks: ['Thank you. You finished the broth. Good.', 'Come again. Tomorrow the broth is better.'], closing: 'Last bowl. Then the lantern goes out.' },
  pizza:       { speaker: 'nico',    greeting: ['Ciao! Welcome to Slice of Heaven!', 'Hungry? Wrong question. HOW hungry?'],
                 thanks: ["Enjoy! Careful, it's lava!", 'Grazie! Tell your friends! Tell your enemies!'], closing: "Last slices! Half price! They're lonely!" },
  restaurant:  { speaker: 'celeste', greeting: ['Good evening. Welcome to The Gilded Gull.', 'Right this way. Mind the gull.'],
                 thanks: ['A pleasure. Do come again.', 'Good night. Chef sends his regards.'], closing: 'We are no longer seating, I am afraid. Tomorrow?' },
  gym:         { speaker: 'tasha',   greeting: ["Welcome to Iron Maple! Let's go!", 'Hey hey! Hydrated? Stretched?'],
                 thanks: ['Great work today! Proud of you!', 'See you tomorrow! Yes, tomorrow!'], closing: 'Last set, everybody! Make it count!' },
  clothing:    { speaker: 'imani',   greeting: ['Ooh, hello! Come in, come in.', 'Welcome to Thread & Co. Browsing is free.'],
                 thanks: ["You're going to look SO good.", 'Wear it somewhere fun! Report back.'], closing: 'Closing up! Last looks, people.' },
  homegoods:   { speaker: 'felix',   greeting: ['Oh! Hi. Welcome to Nest & Wire.', 'Sofas left, wires right. Um. Enjoy.'],
                 thanks: ["Good pick. Seriously. That's the good one.", 'Thanks! Keep the receipt. Just in case.'], closing: "We're closing in a few. Sorry! Sorry." },
  bookstore:   { speaker: 'ambrose', greeting: ['Hm? Oh! A customer. Marvelous.', 'Welcome. Mind the cat.'],
                 thanks: ['A fine choice. Tell me how it ends.', 'Enjoy it. Chapter approves.'], closing: 'Closing time. The books need their rest.' },
  library:     { speaker: 'ines',    greeting: ['Welcome. Indoor voice, please.', 'Good day. Computers are upstairs.'],
                 thanks: ['Due back in two weeks. Enjoy.', 'Happy reading.'], closing: '(whispering) We close in ten minutes.' },
  office:      { speaker: 'margaret', greeting: ['Good morning. You are on time. Noted.', 'Hartwell & Finch. Do you have an appointment?'],
                 thanks: ['Good work today.', 'Go home. The spreadsheets will keep.'], closing: 'Lights off when you leave. Finch hates waste.' },
  clinic:      { speaker: 'samira',  greeting: ['Welcome to Bayside Clinic. Have a seat.', 'Hi there. What brings you in?'],
                 thanks: ['Feel better. Drink water!', 'Rest up. Nurse’s orders.'], closing: 'We are closing, but urgent care is always open.' },
  bar:         { speaker: 'lou',     greeting: ['Evening. Welcome to the Heron.', 'Take a stool. Music starts when it feels like it.'],
                 thanks: ['Get home safe.', 'Night. Tip your bartender. Thanks, you did.'], closing: "Last call, folks. You don't have to go home... you know the rest." },
  cinema:      { speaker: 'vera',    greeting: ['One ticket to somewhere else?', 'Welcome to the Orpheum. Real butter.'],
                 thanks: ['Row F is the best. Enjoy the show.', 'Good night. Did you cry? I cried.'], closing: 'Last show has started. Come back tomorrow.' },
  courier:     { speaker: 'rhonda',  greeting: ['ZipParcel! Sending or collecting, hon?', 'Sign here. And here. And one more.'],
                 thanks: ["It'll get there. On my honor.", 'Thanks, hon! Over and out.'], closing: "Depot's closing! Packages sleep too." },
  warehouse:   { speaker: 'gus',     greeting: ['Mm. Morning. Mind the forklift.', 'Hard hats on the hook.'],
                 thanks: ['Good work.', 'Mm. See you tomorrow.'], closing: 'Shift is over. Go home. Feed your cat.' },
  bank:        { speaker: 'theo',    greeting: ['Welcome to Bay Realty & Trust. How can I help?', 'Have a seat. I make the numbers friendly.'],
                 thanks: ["All set. That wasn't so bad, right?", 'Thanks for coming in. Take a lollipop. They are for adults too.'], closing: "We're closing, but the app never sleeps." },
  airport:     { speaker: null,      greeting: ['Welcome to Maple Bay International.', 'Arrivals to your left. Pretzels to your right.'],
                 thanks: ['Safe travels!', 'Welcome home.'], closing: 'Last flight has landed. Good night.' },
};

export const HEADLINES = [
  { text: 'LOCAL GULL STEALS FOURTH LOBSTER; GILDED GULL "DECLINES TO COMMENT"' },
  { text: 'CITY HALL FOUNTAIN TO BE FIXED "SOON," OFFICIALS SAY FOR NINTH YEAR' },
  { text: 'MYSTERY KNITTER STRIKES AGAIN: STATUES NOW HAVE MITTENS' },
  { text: 'LIGHT RAIL ON TIME ALL WEEK; RIDERS SUSPICIOUS' },
  { text: 'PARK CHESS MATCH ENTERS FOURTH MONTH, BOTH SIDES "CONFIDENT"' },
  { text: 'LEMONADE STAND POSTS RECORD QUARTER, CEO (10) CREDITS "ICE"' },
  { text: 'ONE-FOOTED PIGEON GERALD NAMED HONORARY CROSSING GUARD' },
  { text: 'WHO IS FINCH? GAZETTE INVESTIGATION ENTERS 26TH YEAR' },
  { text: 'LIGHTHOUSE BLINKS TWICE ON FRIDAY, AS USUAL; CITY SHRUGS' },
  { text: "DOT'S DINER PIE RECIPE REMAINS CLASSIFIED, SOURCES CONFIRM" },
  { text: 'AREA MAN CARRIES SOFA UP HILLCREST STAIRS, REGRETS EVERYTHING' },
  { text: 'LIBRARY REPORTS BOOK RETURNED 41 YEARS LATE; "NO HARD FEELINGS"' },
  { text: 'COUNCIL DEBATES NEW BENCH; CURRENT BENCHES "FEEL THREATENED"' },
  { text: 'TAXI DRIVER CLAIMS TO KNOW "A PLACE," DOES IN FACT KNOW A PLACE' },
  { text: 'BOOKSTORE CAT PROMOTED TO ASSISTANT MANAGER' },
  { text: 'FOOD CRITIC AWARDS FOUR STARS, HINTS A FIFTH "MAY EXIST"' },
  { text: 'NOODLE LANTERN BROTH ENTERS 19TH HOUR; CHEF "NOT TAKING QUESTIONS"' },
  { text: 'STREETCAR NO. 9 RESTORATION "ONLY 400 BOLTS TO GO," SAYS CONDUCTOR' },
  { text: 'BUSKER PLAYS SAME SONG NINE TIMES; CROWD REQUESTS A TENTH' },
  { text: 'OPEN MIC NIGHT: OWL IMPRESSION "DISTURBINGLY ACCURATE"' },
  { text: 'DUCKS HOLD POND; GEESE NEGOTIATIONS STALL' },
  { text: 'MAPLEWOOD GARDEN CLUB WAITLIST NOW LONGER THAN GARDEN' },
  { text: 'GYM OWNER CHEERS SO LOUD, NEIGHBORING OFFICE STARTS DOING SQUATS' },
  { text: 'LUCKY CORNER CAT STILL WAVING AFTER 30 YEARS; "TIRELESS," SAYS OWNER' },
  { text: 'LOCAL COURIER SETS STAIR RECORD WHILE CARRYING LAMP' },
  { text: 'ORPHEUM AUDIENCE GASPS ON CUE; PROJECTIONIST "VERY PROUD"' },
  { text: 'PIER 7 KITTEN POPULATION UP 12%; FOREMAN DENIES INVOLVEMENT' },
  { text: 'NEW MURAL IS EITHER A FISH OR "GRIEF," ARTIST WON\'T SAY' },
  { text: 'BAKERY SELLS OUT BY 9 A.M.; LATE SLEEPERS DEVASTATED' },
  { text: 'RESIDENT GETS LOST IN OLD TOWN, FINDS THREE NEW FAVORITE SHOPS' },
  { text: 'POLL: 94% OF MAPLE BAY SAYS HELLO TO STRANGERS; 6% "JUST SHY"' },
  { text: 'FERRY "FASHIONABLY LATE" FOR 11,000TH CONSECUTIVE DAY' },
  { text: 'CELLIST PRACTICES SAME EIGHT BARS; BUILDING NOW HUMS ALONG' },
  { text: 'FRESHWAY PEACHES "PERFECT TODAY," MANAGER REPORTS, AS EVERY DAY' },
  { text: 'JOGGER ENTERS FIFTH YEAR OF TRAINING FOR HALF MARATHON' },
  { text: 'NEWCOMER SPOTTED CARRYING GROCERIES LIKE A LOCAL' },
  { text: 'CITY\'S OLDEST MAPLE DROPS LEAF ON CHESS BLUNDER; "IT KNOWS"' },
  { text: 'SUPERINTENDENT FIXES EVERYTHING WITH ONE WRENCH, WON\'T NAME WRENCH' },
  { text: 'PIZZA DEBATE: PINEAPPLE HEARINGS POSTPONED UNTIL AFTER NOON' },
  { text: 'DISPATCHER KNOWS WHERE YOUR PACKAGE IS. AND WHERE YOU ARE.' },
  { text: 'LANTERN ROW DUMPLING COUNT REACHES ONE MILLION; NOBODY COUNTED' },
  { text: 'HARBOR SEAL RETURNS TO SAME ROCK; ROCK UNAVAILABLE FOR COMMENT' },
  { text: 'AIRPORT PRETZEL STAND VOTED "BEST GATE-ADJACENT SNACK" OF TWO' },
  { text: 'KIDS\' NEWSPAPER SCOOPS GAZETTE ON SCHOOL FAIR STORY. AGAIN.' },
  { text: 'BLOSSOMS ARRIVE ON THIMBLE STREET; SNEEZING UP 40%', tag: 'spring' },
  { text: 'DUCKLING CROSSING HALTS MARKET STREET; NO ONE MINDS', tag: 'spring' },
  { text: 'SPRING CLEANING UNCOVERS WINTER SANDWICH; OWNER "NOT PROUD"', tag: 'spring' },
  { text: 'GARDEN PLOTS OPEN; SLUGS REPORTEDLY "THRILLED"', tag: 'spring' },
  { text: 'SOFT-SERVE RETURNS TO PIER; CITY PRODUCTIVITY PLUMMETS', tag: 'summer' },
  { text: 'FOUNTAIN NOT FOR WADING, SAYS SIGN NOBODY IS READING', tag: 'summer' },
  { text: 'SUMMER FAIR CAKE WEIGHS EIGHT POUNDS, SAME AS EVERY YEAR', tag: 'summer' },
  { text: 'TEACHERS DUNKED AT SCHOOL FAIR; STUDENTS CALL IT "JUSTICE"', tag: 'summer_fair' },
  { text: 'HARBOR LIGHTS FIREWORKS TONIGHT; GULLS FILE FORMAL COMPLAINT', tag: 'fireworks' },
  { text: 'ENTIRE CITY TURNS ORANGE OVERNIGHT; RESIDENTS "KNEW IT WAS COMING"', tag: 'autumn' },
  { text: 'LEAF PILE IN PARK SURVIVES ELEVEN MINUTES, A NEW RECORD', tag: 'autumn' },
  { text: 'SOUP SEASON DECLARED OPEN BY UNANIMOUS VOTE', tag: 'autumn' },
  { text: 'MAPLE FESTIVAL TODAY: PIE CONTEST EXPECTED TO "GET TENSE"', tag: 'maple_festival' },
  { text: 'BIG MAPLE TAPPED AT NOON; FIRST CUP GOES TO SMALLEST CITIZEN', tag: 'maple_festival' },
  { text: 'FIRST SNOW! SNOW GULL APPEARS ON PIER, SCULPTOR UNKNOWN', tag: 'snow' },
  { text: 'RADIATORS CITYWIDE BEGIN ANNUAL CONCERT SEASON', tag: 'winter' },
  { text: 'LANTERN NIGHT: A THOUSAND WISHES CLEAR THE BREAKWATER', tag: 'lantern_night' },
  { text: 'MITTEN FOUND ON MARKET STREET; SECOND MITTEN "STILL AT LARGE"', tag: 'winter' },
  { text: 'HOT CHESTNUT CART RETURNS; LINE FORMS IMMEDIATELY', tag: 'winter' },
  { text: 'RAIN EXPECTED; UMBRELLAS CITYWIDE REMAIN AT HOME', tag: 'rain' },
  { text: 'PUDDLE ON 3RD AVENUE NOW DEEP ENOUGH TO HAVE A NAME', tag: 'rain' },
  { text: 'FOG SO THICK, HILLCREST REPORTED MISSING; LATER FOUND', tag: 'fog' },
  { text: 'FOGHORN WAKES CITY AT 5 A.M.; CITY ROLLS OVER', tag: 'fog' },
  { text: 'WIND STEALS HAT, RETURNS IT TWO BLOCKS LATER', tag: 'wind' },
  { text: 'HEAT WAVE: GROWN ADULTS SEEN IN LEMONADE LINE', tag: 'heat' },
  { text: 'SUN OUT; EVERY CAFE TABLE IN CITY OCCUPIED BY 9:04 A.M.', tag: 'sunny' },
  { text: 'SIDEWALK "TOO HOT," CONFIRMS MAN WHO TESTED IT', tag: 'heat' },
];

export const SIGNS = {
  // Shop-front sign ideas for facade buildings. ALL CAPS, <= 12 characters.
  shops: [
    'FRESHWAY', 'LUCKY CORNER', 'BEAN & GONE', 'RISE & SHINE', "DOT'S DINER", 'NOODLES', 'SLICE', 'GILDED GULL',
    'IRON MAPLE', 'THREAD & CO.', 'NEST & WIRE', 'DOG-EARED', 'LIBRARY', 'BLUE HERON', 'ORPHEUM', 'ZIPPARCEL',
    'PIER 7', 'BAY TRUST', 'CLINIC', 'TACOS LUPITA', 'PHO 88', 'BAO BAO', 'GYRO KING', 'JERK SHACK',
    'BODEGA 24H', 'LAUNDROMAT', 'BARBER', 'NAILS & CO.', 'HALAL CART', 'BOBA BAY', 'VINYL VAULT', 'PAWN & LOAN',
    'FLORIST', 'HARDWARE', 'BAIT & TACKLE', 'FISH MARKET', 'DONUTS', 'DELI', 'TAQUERIA', 'PANADERIA',
    'KIM\'S TAILOR', 'SARI PALACE', 'TEA HOUSE', 'BIKE FIX', 'PET SUPPLY', 'THRIFT', 'ARCADE', 'YOGA LOFT',
    'PRINT SHOP', 'ART SUPPLY', 'RECORDS', 'CHECK-IN', 'ARRIVALS', 'TAXI',
  ],
  // Tiny door / window signs.
  small: [
    'OPEN', 'CLOSED', 'BACK IN 5', 'CASH ONLY', 'HELP WANTED', 'NOW HIRING', 'SALE', 'PUSH', 'PULL', 'HOT COFFEE',
    'FRESH PIE', 'NO GULLS', 'WET PAINT', 'FOR RENT', 'SOLD', 'TICKETS', 'PICK UP', 'WE DELIVER', 'EST. 1961',
    'OPEN LATE', 'FREE WIFI', 'ICE COLD', 'HAPPY HOUR', 'SHHH', 'MIND THE CAT', 'ABIERTO', 'WELCOME',
  ],
  // Paper posters / flyers for walls and poles (mixed case allowed, 2 short lines max).
  posters: [
    'OPEN MIC FRIDAYS / The Blue Heron, 8 PM',
    'LOST: one mitten. / Sentimental value. Also cold.',
    'MAPLE FESTIVAL / First Saturday of Autumn',
    'LANTERN NIGHT / Pier, 9 PM. Bring a wish.',
    'SUMMER FAIR / Maplewood Elementary. Bring coins.',
    'CELLO LESSONS / Ask for Noor. Patient!',
    'CHESS, TABLE 3 / Every day. Bring courage.',
    'SAVE STREETCAR NO. 9 / Volunteers & rags wanted',
    'LEMONADE / 1 coin. Advice 2 coins.',
    'ROOMMATE WANTED / Must like trumpet.',
    'MONDAY CLASSICS / The Orpheum. Real butter.',
    'IRON MAPLE GYM / We cheer for everybody.',
    'HAVE YOU SEEN FINCH? / Gazette tip line open',
    'GARDEN CLUB / Waitlist only. Sorry.',
    'YARD SALE SAT / Everything must go. Even Gary.',
    'DOG WALKER / Cats considered.',
    'HARBOR LIGHTS / Fireworks off the pier',
    'VOTE PIP / Mayor. Eventually.',
    'FREE PIANO / You haul. 3rd floor. Sorry.',
    'STORY HOUR / Library, Saturdays 10 AM',
  ],
  // Mural slogans for the Arts Quarter and beyond.
  murals: [
    'COME AS YOU ARE, STAY AS YOU LIKE',
    'A LIGHT FOR ANYONE NOT HOME YET',
    'THE BAY KEEPS YOUR PLACE',
    'EVERYBODY IS FROM SOMEWHERE',
    'SAY HI BACK',
    'MADE HERE, BY ALL OF US',
    'SLOW DOWN, IT\'S MAPLE BAY',
    'MANY ROOTS, ONE TREE',
    'YOU ARE EXACTLY ON TIME',
    'BE SOMEBODY\'S REGULAR',
    'SOFT CITY',
    'HOLA / HELLO / ANNYEONG / SALAAM / KUMUSTA',
    'TODAY IS A GOOD DAY TO START OVER',
    'FEED THE DUCKS, NOT THE DRAMA',
    'HOME IS A VERB',
    'WELCOME TO MAPLE BAY',
  ],
  chalkboards: [
    "Today's special: soup. It's always soup. It's always good.",
    'Come in, we are awake-ish.',
    'Hot coffee, warm people, cold brew.',
    'Pie of the day: yes.',
    'Unattended children will be given espresso and a kitten.',
    'Now serving: the broth you deserve.',
    "No Wi-Fi. Talk to each other. Or read. Reading's good.",
    'Be nice or be quiet. Both is best.',
    'Fresh knots at 7. Gone by 9. Set an alarm.',
    'Tonight: live music, loud feelings.',
  ],
};

export const LOADING_TIPS = [
  'Cooking at home is cheaper than eating out. Nana would also like you to know it is better.',
  'People have routines. If you want to find someone, learn their week.',
  'Everyone has favorite gifts. Listen when they talk; they drop hints.',
  'The light rail loops the whole city. Miss your stop? Stay on. It comes around.',
  'Taxis cost more than trains, but Manny throws in the commentary for free.',
  'Jobs are posted on computers. Until you own one, the library has you covered.',
  'Showing up on time is most of a promotion. The rest is also showing up on time.',
  'Rent is due every other Monday. Walt will remind you. Several times.',
  'Groceries have to be carried home and put in the fridge. Eggs on top!',
  'A red need icon means stop and take care of yourself first.',
  'Hanging out with friends fills your Social and Fun at the same time. Efficient!',
  'Missed a plan? Nobody holds a grudge in Maple Bay. They will text to reschedule.',
  'The bakery sells out early. The ramen shop opens late. Plan your cravings.',
  'Rainy days are quieter outside and cozier inside.',
  'The gym is cheaper than new pants.',
  'Talk to strangers. That is how they stop being strangers.',
  'Different people like different conversations. Jokes land better on jokers.',
  'A hot shower fixes about 40% of problems.',
  'The Blue Heron has open mic every Friday. Clapping is free.',
  'Nana is home most afternoons. The kettle is always on. It is a house rule.',
  'Furniture makes home feel like home. Even a wobbly shelf.',
  'You can invite friends over once you know them well. Tidy first. Or do not. They are friends.',
  'The lookout at Hillcrest is worth the stairs. All 301 of them.',
  'Sleeping saves your game. Also your mood.',
  'The lighthouse blinks twice on Fridays. Nobody will tell you why. Ask the Captain.',
  'Story moments wait for you. There is no wrong pace for a fresh start.',
  'Seasons change every two weeks. So does the menu at the bakery.',
  'Pigeons remember kindness. So does Birdie.',
];

export const ACHIEVEMENTS = [
  { id: 'wheels_down',     name: 'Wheels Down',            desc: 'Arrive in Maple Bay.',                               when: 'intro_complete' },
  { id: 'keys',            name: 'Two Keys',               desc: 'Get the keys to your first apartment.',              when: 'entered_home' },
  { id: 'unpacked',        name: 'Out of the Box',         desc: 'Unpack your last moving box.',                       when: 'boxes_unpacked:3' },
  { id: 'ketchup',         name: 'The Ketchup Packet',     desc: 'Open your empty fridge for the first time.',         when: 'fridge_opened' },
  { id: 'first_groceries', name: 'Eggs on Top',            desc: 'Carry groceries home without incident.',             when: 'fridge_stocked' },
  { id: 'first_meal',      name: 'Food-Shaped',            desc: 'Cook your first meal at home.',                      when: 'cooked_meal' },
  { id: 'five_recipes',    name: 'Recipe Box',             desc: 'Learn 5 recipes.',                                   when: 'recipes:5' },
  { id: 'nana_pie',        name: 'Cold Hands, Warm Kitchen', desc: "Bake Nana's apple-maple pie on your own.",         when: 'cooked:apple_maple_pie' },
  { id: 'first_train',     name: 'All Aboard',             desc: 'Ride the light rail.',                               when: 'rode_train' },
  { id: 'full_loop',       name: 'Loop de Loop',           desc: 'Ride the whole rail loop without getting off.',      when: 'rode_full_loop' },
  { id: 'all_stations',    name: 'Station to Station',     desc: 'Visit all 8 stations.',                              when: 'stations_visited:8' },
  { id: 'cab_regular',     name: "Manny's Favorite",       desc: 'Take 10 cab rides.',                                 when: 'taxi_rides:10' },
  { id: 'all_districts',   name: 'Nine for Nine',          desc: 'Set foot in every district.',                        when: 'districts_visited:9' },
  { id: 'stairs',          name: 'Mercy Bench',            desc: 'Climb all 301 Hillcrest stairs.',                    when: 'climbed_hillcrest_stairs' },
  { id: 'first_hello',     name: 'Say Hi Back',            desc: 'Talk to your first stranger.',                       when: 'met_npcs:1' },
  { id: 'ten_names',       name: 'Ten Names',              desc: 'Meet 10 named residents.',                           when: 'met_npcs:10' },
  { id: 'knows_everyone',  name: 'Like Your Nana',         desc: 'Meet every named resident of Maple Bay.',            when: 'met_npcs:all' },
  { id: 'first_friend',    name: 'New Contact',            desc: 'Make your first friend.',                            when: 'friends:1' },
  { id: 'five_friends',    name: 'Good Company',           desc: 'Have 5 friends.',                                    when: 'friends:5' },
  { id: 'close_friend',    name: 'My Person',              desc: 'Become close friends with someone.',                 when: 'close_friends:1' },
  { id: 'perfect_gift',    name: 'How Did You Know?',      desc: 'Give someone a gift they love.',                     when: 'gift_loved' },
  { id: 'bad_joke',        name: 'Bold. Not Funny. But Bold.', desc: 'Tell a joke that does not land.',                when: 'joke_failed' },
  { id: 'host',            name: 'Two Whole Mugs',         desc: 'Have a friend over to your place.',                  when: 'hosted_visit' },
  { id: 'regular',         name: "Somebody's Regular",     desc: 'Visit the same spot 10 times.',                      when: 'venue_visits_same:10' },
  { id: 'foodie',          name: 'Four Stars and a Borrowed Fifth', desc: 'Eat at every restaurant in town.',          when: 'ate_at_all_food_venues' },
  { id: 'broth',           name: 'To the Last Drop',       desc: 'Finish a bowl at the Noodle Lantern.',               when: 'ate_at:ramen' },
  { id: 'first_job',       name: 'Hired!',                 desc: 'Get your first job.',                                when: 'job_accepted' },
  { id: 'first_paycheck',  name: 'Payday',                 desc: 'Get paid for the first time.',                       when: 'paychecks:1' },
  { id: 'on_time',         name: 'Suspiciously Punctual',  desc: 'Be on time to 10 shifts in a row.',                  when: 'on_time_streak:10' },
  { id: 'promoted',        name: 'Moving Up',              desc: 'Earn a promotion.',                                  when: 'promotions:1' },
  { id: 'top_job',         name: 'Keys to the Place',      desc: 'Reach the top level of any job.',                    when: 'job_level:4' },
  { id: 'career_tour',     name: 'Jack of All Trades',     desc: 'Work 3 different jobs.',                             when: 'jobs_held:3' },
  { id: 'rent_streak',     name: "Walt's Favorite Tenant", desc: 'Pay rent on time 4 times in a row.',                 when: 'rent_on_time:4' },
  { id: 'savings',         name: 'Rainy Day Fund',         desc: 'Save up 1,000.',                                     when: 'money:1000' },
  { id: 'furnished',       name: 'Feels Like Home',        desc: 'Place 10 pieces of furniture.',                      when: 'furniture_placed:10' },
  { id: 'move_up',         name: 'Room to Grow',           desc: 'Move out of your starter studio.',                   when: 'moved_home' },
  { id: 'gym_rat',         name: 'We Cheer for Everybody', desc: 'Work out 10 times.',                                 when: 'workouts:10' },
  { id: 'early_bird',      name: 'Before the Emails',      desc: 'Be outside before 6:30 AM.',                         when: 'outside_before:06:30' },
  { id: 'night_owl',       name: 'The Cats Own the Streets', desc: 'Be out past 2 AM.',                                when: 'outside_after:02:00' },
  { id: 'rain_walk',       name: 'Lovely Weather for Ducks', desc: 'Take a walk in the rain. On purpose.',             when: 'walked_in_rain' },
  { id: 'sunset',          name: 'Spilled Peaches',        desc: 'Watch the sunset from the pier or the lookout.',     when: 'watched_sunset' },
  { id: 'open_mic',        name: 'Clap on Two and Four',   desc: 'Attend a Friday open mic at the Blue Heron.',        when: 'attended:open_mic' },
  { id: 'the_bell',        name: 'A Bell Wants Asking For', desc: 'Find the Copper Kettle bell.',                      when: 'beat_done:g5_the_bell' },
  { id: 'little_kettle',   name: 'The Little Kettle',      desc: 'Ring in the first customer at the Summer Fair.',     when: 'beat_done:f4_summer_fair' },
  { id: 'the_song',        name: 'First of Forty',         desc: 'Hear Kit play the whole song.',                      when: 'beat_done:k5_the_song' },
  { id: 'four_seasons',    name: 'Four Seasons',           desc: 'Spend a full year in Maple Bay.',                    when: 'beat_done:s3_one_year' },
  { id: 'pigeon_friend',   name: 'The Flock Took a Vote',  desc: 'Befriend Birdie (and Gerald).',                      when: 'friend:birdie' },
  { id: 'chess_win',       name: 'The Tree Plays, Too',    desc: 'Finally beat Mr. Sethi at table three.',             when: 'chess_won' },
];
