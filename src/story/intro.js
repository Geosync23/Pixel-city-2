// =============================================================================
// Maple Bay — INTRO  (src/story/intro.js)
// The opening sequence and the first three days of gentle onboarding.
// Voice: modern American, warm, brief. Tutorial prompts <= 60 chars, speech
// bubbles <= 90, phone messages <= 160. {name} = player name.
//
// EXPORTS
//   INTRO_SEQUENCE  Step[]  played strictly in order on a new game (day 0, Monday, Spring 1).
//     Common fields: id, type, and optionally `next` conditions in `waitFor`.
//     type 'screen'    { screen: 'title'|'creator', text?, sub?, fields? }
//     type 'cutscene'  { shot, lines: [{ speaker, text }], durationSec }   speaker 'narrator'|'pa'|npcId
//     type 'message'   { from: npcId, texts: string[] }   phone buzzes; texts arrive in order
//     type 'tutorial'  { prompt, waitFor, highlight? }    tiny hint; advances when `waitFor`
//                      event fires. waitFor ids are suggestions for the UI programmer:
//                      'phone_opened' | 'app_opened:taxi' | 'cab_called' | 'cab_arrived'
//                      | 'entered_cab' | 'entered_home' | 'moved' | 'message_read'
//     type 'ride'      { driver: npcId, script: 'TAXI_RIDE' }   uses TAXI_RIDE below
//     type 'scene'     { place, steps: [{ speaker, text, anim? }] }
//     type 'goals'     { listId }   shows a checklist from GOAL_LISTS
//     type 'narration' { text }
//
//   TAXI_RIDE  everything Manny says on the intro ride (and reusable for later cab rides).
//     pickup        string[]   said in order as the player gets in
//     districts     { [districtId]: string[] }  2-3 lines said in order when the cab ENTERS
//                   that district. The route depends on the starter apartment, so every
//                   district has lines; only the ones driven through are used.
//     landmarks     { [id]: { district, line } }  optional one-liners if the cab passes one.
//     filler        string[]   random chatter if a district takes a long time to cross
//     arrival       { [districtId]: string[] }  said in order on pulling up at the building
//     fare          string[]   the goodbye (this first ride is free)
//     laterRides    string[]   random lines for ordinary cab rides after the intro
//
//   STARTER_BUILDINGS  { [districtId]: { name, blurb, walt } }  flavour for each possible
//                   starter-apartment district: building name, creator-screen blurb, and
//                   the one line Walt adds about that neighborhood.
//   KEY_HANDOVER    Step[]  the scene with Walt at the front stoop (same for any building,
//                   with {building} replaced and STARTER_BUILDINGS[d].walt inserted at 'DISTRICT_LINE').
//   GOAL_LISTS      { [listId]: { title, goals: [{ id, text, hint, doneWhen, doneText }] } }
//   NUDGES (unless: skip the nudge and its goal when already done: 'job' or an achievement counter like 'cooked_meal')          [{ id, day, at, from, text, goal? }]  day 1-3 friendly pushes (day index,
//                   0 = arrival day). from: npcId | 'system' (a phone notification).
//                   goal = { id, text, hint, doneWhen } adds an item to the to-do widget.
//                   Each nudge is skipped if its goal is already done.
//   TUTORIAL_HINTS  { [id]: string }  one-time context hints (first hunger warning, etc.).
// =============================================================================

export const INTRO_SEQUENCE = [
  { id: 'title', type: 'screen', screen: 'title', text: 'MAPLE BAY', sub: 'a small life in a friendly city', prompt: 'Press any key' },
  {
    id: 'creator', type: 'screen', screen: 'creator',
    text: 'Who is getting off the plane?',
    fields: {
      name: 'Your name',
      look: 'Your look',
      home: 'Your first apartment',
      confirm: 'Wheels down!',
    },
    sub: 'You can change your clothes later. And your mind. That is sort of the point.',
  },
  {
    id: 'landing', type: 'cutscene', shot: 'plane_descends_over_bay', durationSec: 12,
    lines: [
      { speaker: 'pa', text: 'Folks, we are beginning our descent into Maple Bay International.' },
      { speaker: 'pa', text: "It's 68 and sunny, 2 p.m. local. On your left: the lighthouse. On your right: also nice." },
      { speaker: 'narrator', text: 'One suitcase. One phone. One whole new city.' },
    ],
  },
  { id: 'curb', type: 'narration', text: 'Maple Bay Intl., Arrivals. Monday, 2:00 PM. Spring.' },
  { id: 'tut_move', type: 'tutorial', prompt: 'Tap the ground to walk. Stretch those legs!', waitFor: 'moved' },
  {
    id: 'sibling_welcome', type: 'message', from: 'jules',
    texts: [
      "YOU LANDED!! I tracked your flight like a weirdo. Welcome to Maple Bay, {name}!",
      "I'm so sorry, I couldn't get out of class to pick you up. Third graders. They sense weakness.",
      "Grab a cab from the curb, my treat next time. Text me when you've got your keys. So glad you're here!",
    ],
  },
  { id: 'tut_phone', type: 'tutorial', prompt: 'Bzzt! Open your phone to read it.', waitFor: 'phone_opened', highlight: 'phone_button' },
  { id: 'tut_read', type: 'tutorial', prompt: "Messages live here. So does everything else.", waitFor: 'message_read', highlight: 'app:messages' },
  { id: 'tut_taxi_app', type: 'tutorial', prompt: 'Open the MapleCab app (the yellow cab).', waitFor: 'app_opened:taxi', highlight: 'app:taxi' },
  { id: 'tut_call_cab', type: 'tutorial', prompt: 'Pick your new home, then tap Request ride.', waitFor: 'cab_called', highlight: 'taxi:call' },
  { id: 'tut_wait', type: 'tutorial', prompt: 'Cab 22 is on the way. Stay by the curb.', waitFor: 'cab_arrived' },
  { id: 'tut_get_in', type: 'tutorial', prompt: 'Tap the cab to hop in.', waitFor: 'entered_cab', highlight: 'cab' },
  { id: 'ride', type: 'ride', driver: 'manny', script: 'TAXI_RIDE' },
  { id: 'handover', type: 'scene', place: 'spot:building_stoop', steps: 'KEY_HANDOVER' },
  { id: 'tut_enter', type: 'tutorial', prompt: 'Tap your door to go inside.', waitFor: 'entered_home', highlight: 'home_door' },
  { id: 'home_first_look', type: 'narration', text: "It's small. It's echoey. It's yours." },
  { id: 'first_evening', type: 'goals', listId: 'first_evening' },
];

export const TAXI_RIDE = {
  pickup: [
    "Cab 22! That's me. Manny. Toss the suitcase in back, hop in, hop in.",
    "First time in Maple Bay? I can tell. You've got the hopeful suitcase.",
    "Sit back. I give the tour for free. You can't stop me, people have tried.",
  ],
  districts: {
    airport: [
      "Maple Bay International. Two gates and a pretzel stand. We love her.",
      "See the tower? My cousin works up there. Waves at every plane. Not required. He just does.",
    ],
    railyard: [
      "This is the Railyard. Not pretty, but everything you own came through here.",
      "That's Dot's Diner. Best pancakes in the city. Dot will call you 'hon'. Let her.",
      "Old streetcar barn's back there. They say Streetcar No. 9 is still inside, napping.",
    ],
    downtown: [
      "Downtown! Glass, suits, and the best people-watching in the state.",
      "Central Station, right there under the clock. Trains loop the whole city. I don't hold a grudge.",
      "City Hall's on the left. More pigeons than politicians. Better attendance, too.",
    ],
    park: [
      "Central Park. Yeah, we have one too. Ours has better ducks.",
      "See the big maple? Older than the city. The whole bay's named after it.",
      "Guys at the chess tables have been on the same game since March.",
    ],
    oldtown: [
      "Old Town. Roll your window down. Smell that? That's the bakery. You're welcome.",
      "Cobblestones. Hang on to your teeth.",
      "Lantern Row's down that alley. Noodles, dumplings, the works. Go hungry.",
    ],
    harbor: [
      "Harborside! Boats, boardwalk, and seagulls with zero manners.",
      "There's the lighthouse. Blinks twice on Fridays. Nobody'll tell me why. I've asked.",
      "Fish market's best before eight. After eight you're buying from the gulls.",
    ],
    hillcrest: [
      "Hillcrest. Fancy. My ears pop every time.",
      "From the lookout you can see the whole bay. First date spot. Trust me. Twenty-two years married.",
      "Three hundred and one stairs down to the river. I counted once. Never again.",
    ],
    maplewood: [
      "Maplewood. Porches, sprinklers, kids on bikes. Slow down and wave, that's the law here.",
      "There's a lemonade stand on the corner. The kid's ruthless. Bring exact change.",
      "Lucky Corner's open till nine every night of the year. Mr. Oh has never been closed. Not once.",
    ],
    arts: [
      "Arts Quarter. Murals, students, a guy on a unicycle. It's a whole thing.",
      "That's the Blue Heron. Friday is open mic. Bring earplugs or bring a poem.",
      "Library's the big one with the columns. Free computers upstairs, if you're job hunting.",
    ],
  },
  landmarks: {
    viaduct:    { district: 'downtown', line: "That's the light rail up there. Goes everywhere I go, but can it recommend a taco? No." },
    river:      { district: 'park',     line: 'Maple River. Nine bridges. I have a favorite. It is the bumpy one.' },
    lighthouse: { district: 'harbor',   line: "They call her Old Marigold. Don't ask me which came first, the ferry or the name." },
    orpheum:    { district: 'arts',     line: 'The Orpheum. One screen, real butter. Monday is classics night.' },
    freshway:   { district: 'downtown', line: "FreshWay Market. You'll need it. Something tells me your fridge is empty." },
  },
  filler: [
    "So what brings you? Job? Family? Running from something? Kidding. Unless?",
    "Family here, huh? Good. This is a good town to have people in.",
    "Twenty-six years I've driven this cab. Never the same ride twice. Okay, twice.",
    "You like music? Good. You have no choice. This station only plays oldies.",
    "The hula gull on the dash? Gift from my daughter. He's seen things.",
    "Traffic's light. Everybody's at lunch. This town takes lunch seriously.",
    "You'll get the hang of it fast. It's a small city pretending to be a big one.",
    "Tip from a local: say hi to people. They say hi back here. It's weird. You'll love it.",
  ],
  arrival: {
    downtown:  ["Here we are. Right in the middle of everything. You'll never need an alarm clock."],
    oldtown:   ["And here's you. Old Town. You'll wake up to the bakery every morning. Lucky."],
    harbor:    ["This is it. Harborside. Leave the window open, the foghorn's a lullaby. Eventually."],
    hillcrest: ["Here you go. Hillcrest. Starter place with a million-dollar view. Don't tell the landlord."],
    maplewood: ["Home sweet home. Maplewood. Quiet street. The loudest thing here is the sprinklers."],
    arts:      ["Here's your stop. Arts Quarter. You'll hear a trumpet at midnight. It grows on you."],
    railyard:  ["This is you. Railyard. Rent's good, trains are loud, Dot's is a two-minute walk. Fair trade."],
    park:      ["Here we are, right by the park. You've basically got a hundred-acre front yard."],
    airport:   ["Well, that was a short one. You live... at the airport? No judgment. Great pretzels."],
  },
  fare: [
    "That's Walt on the stoop. Looks grumpy. Is grumpy. Heart of gold. Don't tell him I said so.",
    "This one's on the house. Welcome-to-town special. Next one, I charge double. Kidding!",
    "Cab 22 is in your phone now. You ever need a ride or a restaurant opinion, you call Manny.",
    "Welcome home, {name}.",
  ],
  laterRides: [
    "Where to, boss? Don't say 'surprise me'. I will.",
    "Hey, it's my airport kid! How's the city treating you?",
    "Buckle up. I know a shortcut. It's not shorter, but it's prettier.",
    "You hungry? You look hungry. I know a place. I always know a place.",
    "Scenic route's the same price. That's a lie. But it's close.",
    "My cousin says rain by five. He's a baker, not a weatherman, but he's never wrong.",
    "Late night, huh? I'll get you home. Close your eyes if you want.",
    "You know half the town now, I hear. Word gets around. Mostly through me.",
  ],
};

export const STARTER_BUILDINGS = {
  downtown:  { name: 'The Meridian Arms', blurb: 'Studio above the bustle. Steps from Central Station and everything else.',
               walt: 'Trash is Thursday. Sirens are every day. You stop hearing them by Friday.' },
  oldtown:   { name: 'Thimble Court', blurb: 'Brick walk-up over a flower shop. Smells like bread at 6 a.m.',
               walt: 'Stairs creak on the fourth step. Building is ninety years old. So is the fourth step.' },
  harbor:    { name: 'The Netloft', blurb: 'Converted cannery studio with a sliver of water view and a lot of gull.',
               walt: "Keep the window latched when you cook fish. The gulls know. They always know." },
  hillcrest: { name: 'Stairway House', blurb: 'Tiny garden-level studio halfway up the hill. Great view, great calves.',
               walt: 'Mailbox is at the bottom of the stairs. Think of it as free exercise.' },
  maplewood: { name: 'Sycamore Flats', blurb: 'Quiet garage-top studio on a leafy street, around the corner from family.',
               walt: 'Street parking only. Not that you have a car. Sprinklers come on at six. You have been warned.' },
  arts:      { name: 'The Easel Building', blurb: 'Sunny studio over a print shop. Murals outside, trumpets at midnight.',
               walt: 'Somebody on three plays cello seven to nine. I have decided it is nice. You should too.' },
  railyard:  { name: 'Switchman Lofts', blurb: 'Cheap, roomy, and the 7:10 freight is your alarm clock.',
               walt: 'The windows rattle at ten past. Nothing is broken. That is just the train saying hello.' },
};

export const KEY_HANDOVER = [
  { speaker: 'narrator', text: 'On the front stoop: gray coveralls, a push-broom mustache, a ring of keys.' },
  { speaker: 'walt', text: 'You the new tenant? {name}? There you are. Hm. Good.', anim: 'stand' },
  { speaker: 'walt', text: 'Walt. I am the super. Also the landlord. Also the plumber, most days.', anim: 'talk' },
  { speaker: 'walt', text: 'Welcome to {building}. Two keys. Front door, your door. Lose one, tell me. Lose two, also tell me.' },
  { speaker: 'walt', text: 'DISTRICT_LINE' },
  { speaker: 'walt', text: 'Rent goes out with your bills every Monday morning. I send a reminder. I am told it is "a lot of reminders".' },
  { speaker: 'walt', text: 'Your boxes came this morning. I carried them up. My back says you are welcome.' },
  { speaker: 'manny', text: 'Be nice, Walt! This one is good people!', anim: 'wave' },
  { speaker: 'walt', text: 'I am always nice. ...Radiator sticks. Kick it. Gently. Left side.', anim: 'talk' },
  { speaker: 'walt', text: 'Go on up. And welcome to the building, kid.' },
];

export const GOAL_LISTS = {
  first_evening: {
    title: 'First night in Maple Bay',
    goals: [
      { id: 'unpack', text: 'Unpack your moving boxes (0/3)', hint: 'Tap a box to unpack it.',
        doneWhen: 'boxes_unpacked:3', doneText: "All unpacked. It is starting to look like yours." },
      { id: 'fridge', text: 'Check the fridge', hint: 'Tap the fridge.',
        doneWhen: 'fridge_opened', doneText: 'A starter cupboard: eggs, bread, rice, the basics. Enough to cook tonight.' },
      { id: 'find_food', text: 'Find something to eat nearby', hint: 'Open Maps on your phone to see what is close.',
        doneWhen: 'ate_meal', doneText: 'Much better. First dinner in the new city!' },
      { id: 'text_jules', text: 'Text Nora that you made it', hint: 'Messages > Nora > Reply.',
        doneWhen: 'replied:jules', doneText: 'Nora sent back eleven hearts and a dinosaur. The dinosaur is from Milo.' },
      { id: 'sleep', text: 'Get some sleep', hint: 'Tap your bed when you are ready.',
        doneWhen: 'slept', doneText: 'Good morning, Maple Bay. First night done.' },
    ],
  },
  settling_in: {
    title: 'Settling in',
    goals: [
      { id: 'nana_breakfast', text: "Breakfast at Nana's (Old Town)", hint: 'Follow the gold marker to the blue door on Thimble Street.',
        doneWhen: 'beat_done:g1_breakfast', doneText: 'Full of pancakes. Armed with a recipe.' },
      { id: 'groceries', text: 'Buy groceries and stock the fridge', hint: 'FreshWay Market or Lucky Corner. Carry the bags home.',
        doneWhen: 'fridge_stocked', doneText: 'The fridge is properly stocked now.' },
      { id: 'cook', text: 'Cook your first meal at home', hint: 'Tap the stove. Pancakes are hard to mess up.',
        doneWhen: 'cooked_meal', doneText: 'You made that! It is even food-shaped.' },
      { id: 'ride_train', text: 'Ride the light rail', hint: 'Walk up to any station. Tap your phone at the gate.',
        doneWhen: 'rode_train', doneText: 'All aboard. A train every few minutes, and the loop never gets old.' },
      { id: 'library_job', text: 'Find a job (the Jobs app, or a library computer)', hint: 'Phone › Jobs › Board: entry jobs hire on the spot. Or the Public Library, Arts Quarter, upstairs.',   /* QA14: the whole board is on the phone; the library is the other way */
        doneWhen: 'job_accepted', doneText: 'Your first shift is on My Day.' },
      { id: 'say_hi', text: 'Introduce yourself to 3 people', hint: 'Walk up to someone and tap Talk at the bottom of the screen. Most people here like it.',
        doneWhen: 'met_npcs:3', doneText: 'Three names learned. Only a few thousand to go.' },
    ],
  },
};

export const NUDGES = [
  { id: 'd1_nana', day: 1, at: '07:00', from: 'nana', text: 'STORY_BEAT:g1_breakfast',
    goal: { id: 'nana_breakfast', list: 'settling_in' } },
  { id: 'd1_jules_groceries', day: 1, at: '12:30', from: 'jules',
    text: "How was night one?? Real talk: is your fridge empty? FreshWay downtown has everything, or Lucky Corner by us if you're nearby. Carry the bags home!",
    goal: { id: 'groceries', list: 'settling_in' } },
  { id: 'd1_cook', day: 1, at: '17:30', from: 'system',
    text: 'Tip: cooking at home is cheaper than eating out, and Nana will ask if you used her recipe.',
    goal: { id: 'cook', list: 'settling_in' }, unless: 'cooked_meal' },
  { id: 'd2_dez_train', day: 2, at: '09:00', from: 'dez',
    text: "CUZ. Welcome!! Pro tip from a courier: the light rail loops the whole city, 8 stops, cheap. Ride it once just to look out the window. Trust me.",
    goal: { id: 'ride_train', list: 'settling_in' }, unless: 'rode_train' },
  { id: 'd2_jules_job', day: 1, at: '19:00', from: 'jules',   /* owner msg 142: the job-hunt push comes on day 2 (the day after you arrive), late in the day (was the third day at 13:00) */
    text: "No pressure AT ALL but when you're ready to job hunt: open Jobs on your phone, the whole board's in there and the entry ones hire on the spot. Or the library in the Arts Quarter has free computers upstairs, if you like a big screen and a quiet room.",
    goal: { id: 'library_job', list: 'settling_in' }, unless: 'job' },
  { id: 'd2_walt', day: 2, at: '18:00', from: 'walt',
    text: 'Walt, your super. Radiator OK? Also: people here say hello. Say it back. It is not a trick.',
    goal: { id: 'say_hi', list: 'settling_in' }, unless: 'met_npcs:3' },
  { id: 'd3_theo_bank', day: 3, at: '10:00', from: 'theo',
    text: "Theo here. Boring but useful: your Bank app shows rent day and what's left after. If the numbers ever look scary, come see me. I do scary numbers kindly.",
    goal: null },
  { id: 'd3_system_needs', day: 1, at: '11:00', from: 'system', unless: 'tip:needs_tap',   // QA6: was day 3 15:00, after most players had already met their first red need
    text: 'Tip: the little icons by your portrait are your needs. If one turns red, drop everything and take care of you.',
    goal: null },
];

export const TUTORIAL_HINTS = {
  hungry:        "Stomach's growling. Eat at home or find a spot on Maps.",
  tired:         'Running on fumes. Your bed misses you.',
  grubby:        'A shower would be a public service right now.',
  bored:         'All work, no play. Go do something fun!',
  lonely:        'Feeling a little lonely. Say hi to someone, or text a friend.',
  out_of_shape:  "Legs feel like noodles. A walk or the gym would help.",
  low_money:     'Money is tight. Cook at home and pick up a shift.',
  first_talk:    'Pick how to respond. Different people like different things.',
  first_friend:  'New contact! Friends text you, invite you out, and remember your birthday.',
  first_gift:    'Gifts go a long way. Everyone has favorites. Listening helps.',
  first_shift:   'Show up on time, do the tasks, get paid. Bosses notice effort.',
  first_train:   'Stations show the next train. The whole loop is one line. You cannot get lost. Much.',
  first_bus:     'Buses are slower than trains but stop closer to things.',
  first_taxi:    'Taxis go door to door, any hour. Manny charges by distance, not by story.',
  carry_bags:    'Groceries ride in your hands until you get home. Put them in the fridge!',
  rent_due:      'Rent is due tomorrow. Check your Bank app.',
  appointment:   'My Day keeps track of plans. Nobody here minds if you are a little late.',
  story_missed:  "Missed a plan? No stress. They'll text to reschedule. They always do.",
  rain:          'Raining! Fewer people out, cozier cafes. Umbrellas at Lucky Corner.',
  night:         "It's late. Shops close, the Heron opens, the lighthouse does its thing.",
  save:          'Game saved. It saves every time you sleep.',
};
