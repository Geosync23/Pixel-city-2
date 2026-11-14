// =============================================================================
// Maple Bay — STORY  (src/story/story.js)
// The light main storyline: 14 beats over the first four weeks (one every ~2 days)
// plus 4 seasonal follow-ups, in three interleaved threads:
//   'family'  — Nora, Theo, Pip, Milo: settling in, the school Summer Fair.
//   'grandma' — Nana Bea: her recipes, the Copper Kettle tearoom, the lost brass bell.
//   'friend'  — Kit: reconnecting, the open mic, finishing her first real song.
// The quiet secret underneath: Nora turned down the tearoom years ago, Nana said one
// sharp thing, and each has believed ever since that the other never forgave her.
// The bell and the fair bring them back to the same table.
//
// CALENDAR  day index 0 = Monday, Spring 1 (the day the player lands, 14:00).
//   week = 7 days, month/season = 14 days: Spring 0-13, Summer 14-27, Autumn 28-41,
//   Winter 42-55, then year two starts at day 56.
//
// EXPORTS
//   STORY_ITEMS  { [id]: { name, kind, desc } }   kind: 'keepsake'|'decor'|'furniture'|'food'|'wearable'
//   RECIPES      { [id]: { name, from, ingredients: string[], desc } }  cookable at home once learned.
//   BEATS        Beat[]  in intended order.
//   BEATS_BY_ID  { [id]: Beat }
//   THREADS      { [threadId]: { title, npc, summary } }  for the phone's "Story" tab.
//
// BEAT SHAPE
//   id        string
//   thread    'family' | 'grandma' | 'friend'   (seasonal beats set seasonal: true)
//   title     string   shown in the calendar / story log
//   summary   string   one-line log entry once completed
//   trigger   { minDay, after: beatId[], sendAt: 'HH:MM' }
//             The beat's messages are sent at the first sendAt on or after day `minDay`
//             once every beat in `after` is done. Nothing ever expires: if the player is
//             slow, later beats simply slide. At most one new beat should be sent per day.
//   delivery  { messages: [{ from: npcId, text }], appointment }
//             messages arrive in order, ~1 game minute apart. Text <= 160 chars.
//             appointment { title, place, dayOffset, weekday?, from, to, with: npcId[] }
//               place     venueId | homeId | 'spot:<id>' | 'player_home'
//               dayOffset days after the message day. If `weekday` is given, use the first
//                         matching weekday on or after messageDay + dayOffset.
//               from/to   the window in which showing up at `place` starts the scene.
//               with      NPCs who must be placed at `place` for the window (overrides routine).
//   scene     Step[]  played in order when the player arrives.
//             Step = { speaker, text, anim? }      speaker: npcId | 'narrator' | 'player'
//                  | { choice: { id, options: [{ text, reply: Step[], effects? }] } }
//             effects { relationship?: {npcId: +n}, flag?: string }. Choices never fail a beat.
//             anim is one of the character animation names. Text <= 90 chars.
//   rewards   { relationship: {npcId: n}, items: itemId[], recipes: recipeId[], money: number,
//               unlocks: [{ type, ... }], flags: string[] }
//             unlock types: { type:'discount', venue, percent } | { type:'home', home }
//               | { type:'contact', npc } | { type:'recurring', id, title, place, weekday, from, to }
//               | { type:'music', track }
//   missed    { messages: [{ from, text }], rescheduleDays, weekday? }
//             If the window passes: send these, then re-create the same appointment
//             `rescheduleDays` later (honouring weekday). Repeats forever, always gently.
// =============================================================================

export const THREADS = {
  family:  { title: 'Sycamore Lane',     npc: 'jules', summary: 'Your sister, her family, and a stall for the Summer Fair.' },
  grandma: { title: 'The Copper Kettle', npc: 'nana',  summary: "Nana's recipes, her old tearoom, and a bell that went missing." },
  friend:  { title: 'Forty Half-Songs',  npc: 'kit',   summary: 'An old friend, a small stage, and a song that needs an ending.' },
};

export const STORY_ITEMS = {
  nana_jam:          { name: "Nana's Plum Jam",        kind: 'food',      desc: 'Label reads "PLUM. EAT IT." in firm handwriting.' },
  milo_drawing:      { name: "Milo's Drawing",         kind: 'decor',     desc: 'You (tall), a train (long), a dinosaur (approving). Goes on the fridge.' },
  leftover_roast:    { name: 'Tub of Leftover Roast',  kind: 'food',      desc: 'Theo packed it. Nora added more. Then Theo added more.' },
  heron_coaster:     { name: 'Blue Heron Coaster',     kind: 'decor',     desc: 'Kit drew a tiny you on the back. The hair is accurate.' },
  cinnamon_knots:    { name: 'Box of Cinnamon Knots',  kind: 'food',      desc: 'Still warm. The box won\'t make it home full.' },
  fair_flyer:        { name: 'Summer Fair Flyer',      kind: 'decor',     desc: 'Designed by Pip. Eleven fonts. "BE THERE" underlined three times.' },
  nana_pie:          { name: "Nana's Apple-Maple Pie", kind: 'food',      desc: 'You crimped the edge yourself. Nana fixed it when you looked away.' },
  wobbly_shelf:      { name: "Theo's Wobbly Shelf",    kind: 'furniture', desc: 'Handmade with love and one leg slightly shorter. Holds books. Mostly.' },
  seaglass:          { name: 'Piece of Sea Glass',     kind: 'keepsake',  desc: 'Kit found it on the pier. Green, like an old bottle of something good.' },
  kettle_photo:      { name: 'Photo of the Copper Kettle', kind: 'decor', desc: 'Nana in the doorway, flour on her cheek, the brass bell above her head.' },
  copper_bell:       { name: 'The Copper Kettle Bell', kind: 'keepsake',  desc: 'Brass, palm-sized, a clear high note. Rang in every customer for 31 years.' },
  kit_poster:        { name: 'Hand-printed Gig Poster', kind: 'decor',    desc: 'Two-color linocut. Your name is in tiny letters under "thanks to".' },
  fair_ribbon:       { name: 'Best Stall Ribbon',      kind: 'decor',     desc: 'Blue rosette. Pip says it is "ours" but lives at your place on weekdays.' },
  kettle_teapot:     { name: 'The Copper Teapot',      kind: 'furniture', desc: "Nana's shop teapot, polished. Tea made in it tastes like being looked after." },
  kit_demo:          { name: "Kit's Demo Tape",        kind: 'keepsake',  desc: 'One song, recorded in the loft. Play it on any stereo at home.' },
  leaf_crown:        { name: 'Maple Leaf Crown',       kind: 'wearable',  desc: 'Woven by Pip. Sheds. Worth it.' },
  paper_lantern:     { name: 'Paper Lantern',          kind: 'decor',     desc: 'The spare one. Your wish went out with the other.' },
  year_photo:        { name: 'First Year Photo',       kind: 'decor',     desc: 'Everyone at the lookout, squinting. Milo is looking at a bird.' },
  tram_ticket:       { name: 'Lifetime Streetcar Ticket',   kind: 'keepsake',  desc: 'Punched by Mr. Pike. "No. 9 — ALL STOPS — FOREVER".' },
};

export const RECIPES = {
  maple_pancakes:   { name: "Bea's Maple Oat Pancakes", from: 'nana',    ingredients: ['flour', 'oats', 'egg', 'milk', 'maple_syrup'], desc: 'Fluffy, forgiving, impossible to eat just two.' },
  apple_maple_pie:  { name: 'Copper Kettle Apple-Maple Pie', from: 'nana', ingredients: ['flour', 'butter', 'apple', 'maple_syrup', 'cinnamon'], desc: 'The pie that won eleven ribbons. Cold hands, warm kitchen.' },
  harbor_chowder:   { name: "Captain's Harbor Chowder", from: 'captain', ingredients: ['fresh_fish', 'potato', 'milk', 'onion', 'butter'], desc: '"Feeds a crew of one for three days, or a crew of three once."' },
  sunday_roast:     { name: "Theo's Sunday Roast",       from: 'theo',    ingredients: ['chicken', 'potato', 'carrot', 'onion', 'butter'], desc: 'The secret is patience. And more butter than you would admit to.' },
  maple_taffy:      { name: 'Festival Maple Taffy',      from: 'roz',     ingredients: ['maple_syrup', 'butter'], desc: 'Pulled until golden. Sticks to teeth, memories, and door handles.' },
  lantern_soup:     { name: 'Lantern Night Miso Soup',   from: 'haru',    ingredients: ['miso', 'tofu', 'spring_onion', 'noodles'], desc: 'Served free at the pier every Lantern Night. Warms the hands first.' },
};

export const BEATS = [
  // =========================================================== WEEK 1
  {
    id: 'g1_breakfast', thread: 'grandma', title: "Breakfast at Nana's",
    summary: 'Nana Bea fed you pancakes and gave you your first recipe.',
    trigger: { minDay: 1, after: [], sendAt: '07:00' },
    delivery: {
      messages: [
        { from: 'nana', text: 'Good morning my darling. Nora showed me how to do the messages. Come for breakfast. 4 Thimble Street, blue door. Pancakes. Love Nana' },
        { from: 'nana', text: 'It is Nana.' },
      ],
      appointment: { title: "Breakfast at Nana's", place: 'home_nana', dayOffset: 0, from: '08:00', to: '11:30', with: ['nana'] },
    },
    scene: [
      { speaker: 'narrator', text: 'The blue door opens before you knock. The whole house smells of butter.' },
      { speaker: 'nana', text: 'There you are! Let me look at you. Too thin. Sit, sit.', anim: 'wave' },
      { speaker: 'nana', text: 'Maple oat pancakes. You ate nine of these when you were six.', anim: 'work' },
      { speaker: 'narrator', text: 'A stack arrives. Then a second stack, "in case".' },
      { speaker: 'nana', text: 'Now. A new city on an empty stomach is just a lot of walking.', anim: 'sit' },
      { speaker: 'narrator', text: 'On the wall: a photo of a shopfront. THE COPPER KETTLE. A brass bell over the door.' },
      { choice: { id: 'g1_photo', options: [
        { text: 'Is that your old shop?', effects: { relationship: { nana: 2 }, flag: 'asked_about_kettle' }, reply: [
          { speaker: 'nana', text: 'The Copper Kettle. Thirty-one years of scones and other people\'s secrets.' },
          { speaker: 'nana', text: 'It is a bakery now. A good one. I taught the baker. Eat.' },
        ] },
        { text: 'Could I have the recipe for these?', effects: { relationship: { nana: 2 } }, reply: [
          { speaker: 'nana', text: 'Could you! I wrote it out last night. I was hoping you would ask.' },
        ] },
        { text: 'Is there... a third stack?', effects: { relationship: { nana: 3 } }, reply: [
          { speaker: 'nana', text: 'Ha! There is my grandchild. I knew you were in there.' },
        ] },
      ] } },
      { speaker: 'nana', text: 'Here. The recipe card. And a jar of plum for your empty fridge.', anim: 'talk' },
      { speaker: 'nana', text: 'I know it is empty. A grandmother knows.' },
      { speaker: 'nana', text: 'Come by any morning. The kettle is always on. It is a house rule.' },
    ],
    rewards: {
      relationship: { nana: 5 }, items: ['nana_jam'], recipes: ['maple_pancakes'], money: 0,
      unlocks: [{ type: 'home', home: 'home_nana' }, { type: 'contact', npc: 'nana' }], flags: [],
    },
    missed: {
      messages: [{ from: 'nana', text: 'No rush my darling. Pancakes keep. Well they do not, but I will make more. Tomorrow? Love Nana' }],
      rescheduleDays: 1,
    },
  },
  {
    id: 'f1_welcome_dinner', thread: 'family', title: 'Welcome Dinner on Sycamore Lane',
    summary: 'Dinner at Nora and Theo\'s. Pip interviewed you. Milo drew you.',
    trigger: { minDay: 2, after: [], sendAt: '16:00' },
    delivery: {
      messages: [
        { from: 'jules', text: 'Right. Official welcome dinner. Tomorrow, ours, 6ish. 12 Sycamore Lane, yellow house, bike on the lawn. Theo is doing The Roast.' },
        { from: 'jules', text: 'Pip has prepared questions for you. I\'m so sorry in advance.' },
      ],
      appointment: { title: 'Welcome dinner at Nora & Theo\'s', place: 'home_jules', dayOffset: 1, from: '18:00', to: '21:00', with: ['jules', 'theo', 'pip', 'milo'] },
    },
    scene: [
      { speaker: 'narrator', text: 'A yellow house, a porch swing, a bike on the lawn. Something smells amazing.' },
      { speaker: 'jules', text: 'You found it! Come in, shoes anywhere, mind the dinosaurs.', anim: 'wave' },
      { speaker: 'theo', text: 'Welcome! The roast is resting. I\'m not. Sit anywhere that isn\'t sticky.', anim: 'work' },
      { speaker: 'pip', text: 'Hello. I am Pip. I have a clipboard and seven questions.', anim: 'talk' },
      { speaker: 'pip', text: 'Question one. What is your favorite thing about Maple Bay so far?' },
      { choice: { id: 'f1_interview', options: [
        { text: 'The pancakes, honestly.', effects: { relationship: { pip: 2 }, flag: 'interview_food' }, reply: [
          { speaker: 'pip', text: '"Pancakes." Correct. That was a test and you passed.' },
        ] },
        { text: 'The people. Everyone says hello.', effects: { relationship: { pip: 1, jules: 2 }, flag: 'interview_people' }, reply: [
          { speaker: 'pip', text: '"The people." Mom, they said the people. Write that I am a people.' },
        ] },
        { text: 'That my family is here.', effects: { relationship: { jules: 3, theo: 1 }, flag: 'interview_family' }, reply: [
          { speaker: 'jules', text: 'Oh, do not. I have gravy to make. I can\'t cry into gravy.' },
        ] },
      ] } },
      { speaker: 'narrator', text: 'Dinner is loud, long and excellent. Someone refills your plate twice.', anim: 'eat' },
      { speaker: 'milo', text: '...This is for you. That is you. That is a train. He is a dinosaur.', anim: 'stand' },
      { speaker: 'theo', text: 'High honor. I waited two years for a drawing.' },
      { speaker: 'jules', text: 'I meant to ask Nana tonight, but... she\'s busy Thursdays. I think.' },
      { speaker: 'narrator', text: 'Nora is suddenly very interested in the dishes.' },
      { speaker: 'theo', text: 'Take leftovers. This isn\'t a question. Sunday roast is a standing invite.' },
      { speaker: 'jules', text: 'I\'m really glad you\'re here. Text me when you\'re home. Humor me.' },
    ],
    rewards: {
      relationship: { jules: 5, theo: 5, pip: 4, milo: 4 }, items: ['milo_drawing', 'leftover_roast'], recipes: [], money: 0,
      unlocks: [{ type: 'home', home: 'home_jules' }, { type: 'contact', npc: 'theo' }], flags: [],
    },
    missed: {
      messages: [{ from: 'jules', text: 'No stress, moving week is chaos. The roast became sandwiches. Tomorrow instead? Theo will re-roast. He lives for it.' }],
      rescheduleDays: 1,
    },
  },
  {
    id: 'k1_reunion', thread: 'friend', title: 'A Familiar Face at the Blue Heron',
    summary: 'You found Kit behind the bar at the Blue Heron. Ten years fell away in a minute.',
    trigger: { minDay: 4, after: [], sendAt: '17:30' },
    delivery: {
      messages: [
        { from: 'kit', text: 'ok a courier called Dez just told my whole bar that his cousin {name} moved to Maple Bay. THE {name}?? it\'s Kit. from school. KIT.' },
        { from: 'kit', text: 'I work at the Blue Heron, Arts Quarter, under the big blue bird. come by tomorrow night. first drink is on me. second is on Dez.' },
      ],
      appointment: { title: 'Meet Kit at the Blue Heron', place: 'bar', dayOffset: 1, from: '18:00', to: '23:30', with: ['kit', 'lou'] },
    },
    scene: [
      { speaker: 'narrator', text: 'Low lights, a small stage, a blue neon heron. Behind the bar: teal hair. That grin.' },
      { speaker: 'kit', text: 'NO. Look at you! You got tall! Or I got short. Come here!', anim: 'cheer' },
      { speaker: 'lou', text: 'So this is the famous school friend. She has polished that glass for an hour.', anim: 'work' },
      { speaker: 'kit', text: 'Lou. Lou, please. I\'m being cool. Sit, sit. What are you drinking?' },
      { speaker: 'kit', text: 'Ten years! Last I saw you, we were on the gym roof with stolen chips.' },
      { choice: { id: 'k1_memory', options: [
        { text: 'You sang the whole bus ride home.', effects: { relationship: { kit: 3 }, flag: 'remembered_singing' }, reply: [
          { speaker: 'kit', text: 'You remember that? Everyone told me to shut up. Except you.' },
        ] },
        { text: 'You still owe me a pencil.', effects: { relationship: { kit: 2 } }, reply: [
          { speaker: 'kit', text: 'I KNEW you would say that. Here. A bar pencil. We\'re square.' },
        ] },
        { text: 'I should have written. I\'m sorry.', effects: { relationship: { kit: 4 } }, reply: [
          { speaker: 'kit', text: 'Me too. Hey. We were kids. We\'re here now. That counts double.' },
        ] },
      ] } },
      { speaker: 'kit', text: 'I pour drinks, I paint a bit, I host the Friday open mic.', anim: 'drink' },
      { speaker: 'lou', text: 'She also writes songs. She won\'t tell you that. So I have.' },
      { speaker: 'kit', text: 'Half-songs. Forty of them. Nobody gets to hear a half-song.' },
      { speaker: 'kit', text: 'But I\'m playing Friday. Just a cover. Come? I sing better at one face.' },
      { speaker: 'narrator', text: 'She draws something on a coaster and slides it over, face down.' },
    ],
    rewards: {
      relationship: { kit: 8, lou: 3 }, items: ['heron_coaster'], recipes: [], money: 0,
      unlocks: [{ type: 'contact', npc: 'kit' }], flags: [],
    },
    missed: {
      messages: [{ from: 'kit', text: 'no worries!! new city, I get it. I\'m behind the bar tue to sat from 5. the drink offer doesn\'t expire. neither do I' }],
      rescheduleDays: 1,
    },
  },
  // =========================================================== WEEK 2
  {
    id: 'g2_copper_kettle', thread: 'grandma', title: 'An Errand to the Bakery',
    summary: 'Roz showed you where the Copper Kettle\'s bell used to hang.',
    trigger: { minDay: 7, after: ['g1_breakfast'], sendAt: '08:00' },
    delivery: {
      messages: [
        { from: 'nana', text: 'Darling, an errand for young legs. My good pie tin is at Rise & Shine. Roz borrowed it in the SPRING. Fetch it for me? Love Nana' },
      ],
      appointment: { title: "Fetch Nana's pie tin from Roz", place: 'bakery', dayOffset: 0, from: '08:30', to: '14:00', with: ['roz'] },
    },
    scene: [
      { speaker: 'roz', text: 'Bea\'s grandkid! She said you were coming. She says it to everyone.', anim: 'wave' },
      { speaker: 'roz', text: 'The tin, the tin. I\'ve been hiding from that tin for weeks.', anim: 'work' },
      { speaker: 'roz', text: 'You know this was her shop? The Copper Kettle. I washed up here at sixteen.' },
      { speaker: 'roz', text: 'Same ovens. Same corner table. I never had the heart to change them.' },
      { speaker: 'narrator', text: 'Above the door there\'s a small iron hook, with nothing on it.' },
      { choice: { id: 'g2_hook', options: [
        { text: 'What used to hang there?', effects: { flag: 'knows_about_bell' }, reply: [
          { speaker: 'roz', text: 'The bell. Brass, about so big. You heard it from the streetcar stop.' },
          { speaker: 'roz', text: 'Bea took it down on the last day. Nobody has seen it since.' },
        ] },
        { text: 'Why did the Kettle close?', effects: { flag: 'knows_about_bell', relationship: { roz: 1 } }, reply: [
          { speaker: 'roz', text: 'Ah. She was tired, and there was nobody to hand it to. Family things.' },
          { speaker: 'roz', text: 'She took the door bell down that last day. Nobody has seen it since.' },
        ] },
      ] } },
      { speaker: 'roz', text: 'She says she can\'t remember where it went. Bea!' },
      { speaker: 'roz', text: 'That woman remembers what I wore to my interview. In 1999.' },
      { speaker: 'roz', text: 'Here, the tin. And knots, warm. One box for her, one for the walk.', anim: 'talk' },
      { speaker: 'roz', text: 'Family price for you from now on. Bea would haunt me otherwise.' },
    ],
    rewards: {
      relationship: { roz: 6, nana: 3 }, items: ['cinnamon_knots'], recipes: [], money: 0,
      unlocks: [{ type: 'discount', venue: 'bakery', percent: 15 }, { type: 'contact', npc: 'roz' }], flags: ['knows_about_bell'],
    },
    missed: {
      messages: [{ from: 'nana', text: 'No hurry for the tin darling. It has waited since spring, it can wait for you. Roz is there every day but Wednesday.' }],
      rescheduleDays: 1,
    },
  },
  {
    id: 'f2_school_run', thread: 'family', title: 'The School Run',
    summary: 'You picked up Pip and Milo. Pip has plans for the Summer Fair. Big plans.',
    trigger: { minDay: 8, after: ['f1_welcome_dinner'], sendAt: '18:30' },
    delivery: {
      messages: [
        { from: 'jules', text: 'Tiny favor? Staff meeting tomorrow and Theo is stuck at the bank. Could you collect the kids at 3? School gate, Maplewood.' },
        { from: 'jules', text: 'They walk themselves home really, they just need a tall person nearby. You\'re tall enough.' },
      ],
      appointment: { title: 'Pick up Pip & Milo', place: 'spot:school', dayOffset: 1, from: '14:45', to: '16:00', with: ['pip', 'milo'] },
    },
    scene: [
      { speaker: 'narrator', text: 'The bell goes. Children pour out of Maplewood Elementary like marbles.' },
      { speaker: 'pip', text: 'You are on time. Noted. Milo, our escort is here.', anim: 'wave' },
      { speaker: 'milo', text: '...I told Speed you were coming. Speed is a snail.', anim: 'stand' },
      { speaker: 'pip', text: 'News. The Summer Fair is in two and a half weeks. Every class runs a stall.' },
      { speaker: 'pip', text: 'I want ours to be a pie stall. Like Nana\'s old shop. With a sign.', anim: 'talk' },
      { speaker: 'milo', text: 'Mom goes quiet when we say the Kettle.' },
      { speaker: 'pip', text: 'Milo. That is classified.' },
      { speaker: 'narrator', text: 'On the corner by Lucky Corner, a boy in a clip-on tie waves a jug.' },
      { choice: { id: 'f2_lemonade', options: [
        { text: 'Lemonade for everyone. My treat.', effects: { relationship: { pip: 2, milo: 2, otis: 3 }, flag: 'bought_lemonade' }, reply: [
          { speaker: 'otis', text: 'Three cups! A bulk order! Pleasure doing business.', anim: 'cheer' },
          { speaker: 'milo', text: 'This is the best day.' },
        ] },
        { text: 'Straight home. I promised your mom.', effects: { relationship: { jules: 2 } }, reply: [
          { speaker: 'pip', text: 'Responsible. I will put it in my report. With regret.' },
        ] },
      ] } },
      { speaker: 'narrator', text: 'Sycamore Lane. Nora arrives ten minutes later, juggling folders.' },
      { speaker: 'jules', text: 'Lifesaver. Were they good? Don\'t answer, I can see Pip\'s face.', anim: 'wave' },
      { speaker: 'pip', text: 'Mom, can our stall be a pie stall? Like the Copper Kettle?' },
      { speaker: 'jules', text: '...We\'ll see, honey. Go wash your hands.' },
      { speaker: 'jules', text: 'Thank you. Really. Here, take a flyer. She made forty.' },
    ],
    rewards: {
      relationship: { jules: 4, pip: 4, milo: 4 }, items: ['fair_flyer'], recipes: [], money: 0,
      unlocks: [{ type: 'contact', npc: 'pip' }], flags: ['fair_announced'],
    },
    missed: {
      messages: [{ from: 'jules', text: 'All fine! Mrs. Bell walked them back with Otis. Could you do tomorrow instead? Pip says she has "an agenda" for you.' }],
      rescheduleDays: 1,
    },
  },
  {
    id: 'k2_open_mic', thread: 'friend', title: 'Friday Open Mic',
    summary: 'Kit sang a cover, then thirty seconds of something of her own. It has no ending yet.',
    trigger: { minDay: 10, after: ['k1_reunion'], sendAt: '15:00' },
    delivery: {
      messages: [
        { from: 'kit', text: 'open mic tomorrow, 8pm. I\'m on third, after a man who does bird impressions. I\'ve changed my shirt four times already.' },
        { from: 'kit', text: 'you don\'t have to come. (please come.)' },
      ],
      appointment: { title: "Kit's set at the open mic", place: 'bar', dayOffset: 1, weekday: 'fri', from: '19:30', to: '23:00', with: ['kit', 'lou', 'fenn', 'dez'] },
    },
    scene: [
      { speaker: 'narrator', text: 'The Heron is full. On stage, a man finishes a very convincing owl.' },
      { speaker: 'kit', text: 'You came. Okay. Okay okay. My hands are doing a thing. Look.', anim: 'stand' },
      { choice: { id: 'k2_pep', options: [
        { text: 'Sing it to me. Forget the room.', effects: { relationship: { kit: 4 }, flag: 'pep_one_face' }, reply: [
          { speaker: 'kit', text: 'One face. Right. I can do one face. Don\'t move from that stool.' },
        ] },
        { text: 'You followed a bird man. The bar is low.', effects: { relationship: { kit: 3 }, flag: 'pep_joke' }, reply: [
          { speaker: 'kit', text: 'Ha! Okay. I\'m at least better than an owl. Probably.' },
        ] },
        { text: 'Nervous means it matters.', effects: { relationship: { kit: 3 }, flag: 'pep_matters' }, reply: [
          { speaker: 'kit', text: '...Yeah. It does. Hold my drink. Hold my whole life.' },
        ] },
      ] } },
      { speaker: 'lou', text: 'Next up, our own Kit Navarro. Be nice, she pours your drinks.', anim: 'talk' },
      { speaker: 'narrator', text: 'She plays an old harbor song, slow. The room goes quiet. Even Dez.', anim: 'sit' },
      { speaker: 'dez', text: 'THAT IS MY COUSIN\'S FRIEND! Sorry. Carry on.', anim: 'cheer' },
      { speaker: 'narrator', text: 'Applause. Someone shouts "one more". Kit looks at you, then at her guitar.' },
      { speaker: 'kit', text: 'This one is... not finished. It\'s about coming somewhere new.' },
      { speaker: 'narrator', text: 'Thirty seconds. A verse like an open window. Then she stops.' },
      { speaker: 'kit', text: 'That\'s all there is. Sorry. Thank you. Tip your bartender. It\'s me.' },
      { speaker: 'lou', text: 'Kid. Finish that one. That\'s an order from management.', anim: 'drink' },
      { speaker: 'kit', text: 'A song about a place needs the place in it. I only know the bar.' },
      { speaker: 'kit', text: 'You\'re out there meeting everyone. Help me find the rest of it?' },
    ],
    rewards: {
      relationship: { kit: 8, lou: 3, fenn: 2 }, items: [], recipes: [], money: 0,
      unlocks: [{ type: 'discount', venue: 'bar', percent: 10 }, { type: 'contact', npc: 'lou' }], flags: ['song_started'],
    },
    missed: {
      messages: [{ from: 'kit', text: 'missed you last night! honestly I lost my nerve and didn\'t go on. so. next friday? I\'ll be brave if you\'re on the good stool' }],
      rescheduleDays: 7, weekday: 'fri',
    },
  },
  {
    id: 'g3_sunday_baking', thread: 'grandma', title: 'Sunday Baking Lesson',
    summary: 'Nana taught you the pie, and told you about the last day of the Copper Kettle.',
    trigger: { minDay: 12, after: ['g2_copper_kettle'], sendAt: '10:00' },
    delivery: {
      messages: [
        { from: 'nana', text: 'Now I have my tin back, you are learning The Pie. Tomorrow at 2. Bring nothing but clean hands. Love Nana' },
      ],
      appointment: { title: 'Baking lesson with Nana', place: 'home_nana', dayOffset: 1, from: '13:30', to: '17:30', with: ['nana'] },
    },
    scene: [
      { speaker: 'nana', text: 'Apron. Sleeves. Good. Cold hands, warm kitchen. Say it.', anim: 'work' },
      { speaker: 'narrator', text: 'Flour, butter, apples, a slow pour of maple. Your crimping is... brave.' },
      { speaker: 'nana', text: 'Lovely. Very rustic. I will just tidy that one bit. And that bit.' },
      { speaker: 'narrator', text: 'The pie goes in. The kitchen ticks. Nana looks at the photo on the wall.' },
      { speaker: 'nana', text: 'Roz told you about the bell. She cannot keep a thing in. Never could.', anim: 'sit' },
      { speaker: 'nana', text: 'I hoped your sister would take the Kettle. She chose her classroom.' },
      { speaker: 'nana', text: 'I said, "Then it ends with me." Sharp, like that. Over the dishes.' },
      { speaker: 'nana', text: 'I was sorry before the plate was dry. I never found a way to unsay it.' },
      { choice: { id: 'g3_listen', options: [
        { text: 'Does Nora know you\'re sorry?', effects: { relationship: { nana: 3 }, flag: 'nana_confided' }, reply: [
          { speaker: 'nana', text: 'She is busy on Thursdays. And Sundays. I can take a hint, darling.' },
        ] },
        { text: 'And the bell?', effects: { relationship: { nana: 2 }, flag: 'nana_confided' }, reply: [
          { speaker: 'nana', text: 'I could not hear it without my heart going. So I let it go.' },
        ] },
        { text: '(Just hold her hand.)', effects: { relationship: { nana: 4 }, flag: 'nana_confided' }, reply: [
          { speaker: 'nana', text: 'Mm. You were always the one who knew when to be quiet.' },
        ] },
      ] } },
      { speaker: 'nana', text: 'The bell I left on Ambrose\'s counter, at the bookshop. With a note.' },
      { speaker: 'nana', text: 'I never asked after it. Foolish. I would like to hear it once more.' },
      { speaker: 'narrator', text: 'The timer rings. The pie is gold and gently hissing.' },
      { speaker: 'nana', text: 'There. Now you know the pie and the story. Take both home. Mind the tin.', anim: 'talk' },
    ],
    rewards: {
      relationship: { nana: 8 }, items: ['nana_pie'], recipes: ['apple_maple_pie'], money: 0,
      unlocks: [], flags: ['nana_confided', 'bell_trail_started'],
    },
    missed: {
      messages: [{ from: 'nana', text: 'The apples will keep another day darling. So will I. Any afternoon this week, just come. Love Nana' }],
      rescheduleDays: 1,
    },
  },
  // =========================================================== WEEK 3
  {
    id: 'f3_booth_building', thread: 'family', title: 'Building the Booth',
    summary: 'You and Theo built a fair stall. Nora told you why she avoids talking about the Kettle.',
    trigger: { minDay: 14, after: ['f2_school_run', 'g3_sunday_baking'], sendAt: '12:30' },
    delivery: {
      messages: [
        { from: 'theo', text: 'Booth emergency. I have timber, a plan drawn by a nine-year-old, and no second pair of hands. Tomorrow after work? I\'ll feed you.' },
      ],
      appointment: { title: 'Help Theo build the fair booth', place: 'home_jules', dayOffset: 1, from: '17:30', to: '20:30', with: ['theo', 'jules', 'pip', 'milo'] },
    },
    scene: [
      { speaker: 'theo', text: 'Welcome to the workshop. It\'s a garage. Hold this. No, the other this.', anim: 'work' },
      { speaker: 'pip', text: 'The plan says striped awning, a counter, and a hook for a bell.', anim: 'talk' },
      { speaker: 'narrator', text: 'An hour of sawdust. The booth stands. It leans slightly, with confidence.', anim: 'lift' },
      { speaker: 'theo', text: 'Structural lemonade. Back in a minute. Don\'t lean on anything.' },
      { speaker: 'narrator', text: 'Nora comes out with a box of old paint. On top: a menu. THE COPPER KETTLE.' },
      { speaker: 'jules', text: 'Pip found this in my sock drawer. Nothing is safe.', anim: 'sit' },
      { speaker: 'jules', text: 'Nana wanted me to have the shop. I said no. Badly. In her own kitchen.' },
      { speaker: 'jules', text: 'She closed it that winter. I\'ve never been sure she forgave me.' },
      { speaker: 'jules', text: 'So I\'m busy on Thursdays. And I hate that I am.' },
      { choice: { id: 'f3_secret', options: [
        { text: 'She thinks YOU are avoiding HER.', effects: { relationship: { jules: 4 }, flag: 'told_jules_truth' }, reply: [
          { speaker: 'jules', text: 'She what? But I... oh. Oh, we\'re both idiots. It runs in the family.' },
        ] },
        { text: 'You should hear it from her, not me.', effects: { relationship: { jules: 3 }, flag: 'nudged_jules' }, reply: [
          { speaker: 'jules', text: 'That\'s annoyingly wise. When did you get wise? Stop it.' },
        ] },
        { text: 'A pie stall might say it for you.', effects: { relationship: { jules: 3, pip: 2 }, flag: 'nudged_jules' }, reply: [
          { speaker: 'jules', text: 'Ha. Let the pastry do the talking. Very on-brand for us.' },
        ] },
      ] } },
      { speaker: 'pip', text: 'I have named the stall. "The Little Kettle." It is on the form already.' },
      { speaker: 'jules', text: '...Fine. Yes. But we need her pie. Would you ask her? I\'ll fold.' },
      { speaker: 'theo', text: 'Lemonade! Why is everyone misty? Is it the varnish? Open a window.', anim: 'drink' },
      { speaker: 'theo', text: 'Oh, and I made you a shelf. It wobbles. That\'s how you know it\'s mine.' },
    ],
    rewards: {
      relationship: { jules: 8, theo: 6, pip: 3, milo: 2 }, items: ['wobbly_shelf'], recipes: ['sunday_roast'], money: 0,
      unlocks: [], flags: ['little_kettle_planned'],
    },
    missed: {
      messages: [{ from: 'theo', text: 'No trouble at all. I held both ends myself. It went poorly. The timber and I\'ll be here tomorrow, same time, humbler.' }],
      rescheduleDays: 1,
    },
  },
  {
    id: 'k3_song_hunting', thread: 'friend', title: 'Song Hunting on the Pier',
    summary: 'You and Kit collected lines from the harbor. The song has a chorus now.',
    trigger: { minDay: 16, after: ['k2_open_mic'], sendAt: '11:00' },
    delivery: {
      messages: [
        { from: 'kit', text: 'song hunting. tomorrow, the pier, 1ish, before my shift. bring your ears and that face people tell things to.' },
      ],
      appointment: { title: 'Song hunting with Kit', place: 'pier', dayOffset: 1, from: '12:30', to: '16:30', with: ['kit', 'captain', 'fenn'] },
    },
    scene: [
      { speaker: 'kit', text: 'Rules. We ask people one question: what does the Bay sound like?', anim: 'wave' },
      { speaker: 'kit', text: 'I write. You charm. Go. That one, with the cap and the rod.' },
      { speaker: 'captain', text: 'Sound like? The lighthouse horn. A light for anyone not home yet.', anim: 'sit' },
      { speaker: 'kit', text: '"A light for anyone not home yet." Oh, that\'s going straight in.', anim: 'read' },
      { speaker: 'fenn', text: 'It sounds like the train on the viaduct. Like the city humming to itself.', anim: 'dance' },
      { speaker: 'fenn', text: 'Try it in D. Everything about this town is in D.' },
      { speaker: 'narrator', text: 'By three, the notebook has gulls, bells, kettles and a taxi horn in it.' },
      { speaker: 'kit', text: 'It needs a chorus. One line to come home to. You pick. I trust you.' },
      { choice: { id: 'k3_chorus', options: [
        { text: '"A light for anyone not home yet."', effects: { flag: 'chorus_light', relationship: { kit: 3, captain: 3 } }, reply: [
          { speaker: 'kit', text: 'Yes. The Captain gets a writing credit and a free drink.' },
        ] },
        { text: '"The Bay will keep your place."', effects: { flag: 'chorus_place', relationship: { kit: 4 } }, reply: [
          { speaker: 'kit', text: 'Did you just... that\'s yours? I\'m keeping it. Too late.' },
        ] },
        { text: '"Come as you are, stay as you like."', effects: { flag: 'chorus_stay', relationship: { kit: 3 } }, reply: [
          { speaker: 'kit', text: 'That\'s this whole city in eight words. Okay. Okay!' },
        ] },
      ] } },
      { speaker: 'kit', text: 'I haven\'t finished a song in three years. I think this one wants out.' },
      { speaker: 'kit', text: 'Here. Sea glass. For luck. I found it right where you\'re standing.', anim: 'talk' },
    ],
    rewards: {
      relationship: { kit: 8, captain: 4, fenn: 3 }, items: ['seaglass'], recipes: [], money: 0,
      unlocks: [{ type: 'contact', npc: 'fenn' }], flags: ['song_has_chorus'],
    },
    missed: {
      messages: [{ from: 'kit', text: 'pier got rained on by my nerves anyway. tomorrow? the gulls have agreed to an interview' }],
      rescheduleDays: 1,
    },
  },
  {
    id: 'g4_bookshop_clue', thread: 'grandma', title: 'A Note on the Counter',
    summary: 'Ambrose kept the bell for ten years, then lent it to the Captain for the ferry\'s last crossing.',
    trigger: { minDay: 18, after: ['g3_sunday_baking'], sendAt: '09:30' },
    delivery: {
      messages: [
        { from: 'nana', text: 'Ambrose at Dog-Eared Books says he has something to show you. He was being mysterious. He is not good at it. Love Nana' },
      ],
      appointment: { title: 'See Ambrose at Dog-Eared Books', place: 'bookstore', dayOffset: 1, from: '10:00', to: '18:00', with: ['ambrose'] },
    },
    scene: [
      { speaker: 'ambrose', text: 'Ah! The grandchild. Come in, come in. Mind Chapter, he is mid-nap.', anim: 'wave' },
      { speaker: 'ambrose', text: 'Bea said you were asking about the bell. I have been turning out drawers.', anim: 'read' },
      { speaker: 'narrator', text: 'He lifts the cat. Under the cat: a photograph and a folded note.' },
      { speaker: 'ambrose', text: 'Her note. "Ambrose, mind this for me until I can bear it. B."' },
      { speaker: 'ambrose', text: 'I minded it ten years. Top shelf, between Poetry and Maps.' },
      { speaker: 'ambrose', text: 'Then the old ferry made her last crossing, and she had no bell.' },
      { speaker: 'ambrose', text: 'Captain Thorne asked. I lent it. He rang her in, all the way to the dock.' },
      { choice: { id: 'g4_ask', options: [
        { text: 'And he never brought it back?', effects: { relationship: { ambrose: 2 } }, reply: [
          { speaker: 'ambrose', text: 'I never asked. One does not like to un-lend a thing from a sailor.' },
        ] },
        { text: 'You kept her note all this time.', effects: { relationship: { ambrose: 4 } }, reply: [
          { speaker: 'ambrose', text: 'Thirty years of Saturday scones. One keeps the note, my dear.' },
        ] },
      ] } },
      { speaker: 'ambrose', text: 'He is on the pier most mornings, before eleven. Take him something sweet.' },
      { speaker: 'ambrose', text: 'And take the photograph. It belongs on a wall that knows her.', anim: 'talk' },
    ],
    rewards: {
      relationship: { ambrose: 6, nana: 2 }, items: ['kettle_photo'], recipes: [], money: 0,
      unlocks: [{ type: 'discount', venue: 'bookstore', percent: 10 }, { type: 'contact', npc: 'ambrose' }], flags: ['bell_with_captain'],
    },
    missed: {
      messages: [{ from: 'nana', text: 'Ambrose says no hurry, the mystery will keep and so will he. He is open every day but Monday. Love Nana' }],
      rescheduleDays: 1,
    },
  },
  // =========================================================== WEEK 4
  {
    id: 'g5_the_bell', thread: 'grandma', title: 'The Captain and the Bell',
    summary: 'You found the Copper Kettle\'s bell on a houseboat called Second Wind.',
    trigger: { minDay: 20, after: ['g4_bookshop_clue'], sendAt: '18:00' },
    delivery: {
      messages: [
        { from: 'kit', text: 'ambrose came into the bar (!!) to say: the Captain is on the pier every morning 6:30 to 11 and "likes jam". very specific intel' },
      ],
      appointment: { title: 'Ask the Captain about the bell', place: 'pier', dayOffset: 1, from: '06:30', to: '11:00', with: ['captain'] },
    },
    scene: [
      { speaker: 'captain', text: 'Ahoy. You have the look of someone on an errand.', anim: 'sit' },
      { speaker: 'narrator', text: 'You tell him: the Kettle, the note, the bookshop, the last crossing.' },
      { speaker: 'captain', text: 'Bea\'s bell. Aye. Come aboard. Mind the step, and the opinions of the cat.', anim: 'walk' },
      { speaker: 'narrator', text: 'On the houseboat Second Wind, by the cabin door, hangs a small brass bell.' },
      { speaker: 'captain', text: 'I ring it at dusk on Fridays. For the Marigold. For anyone not home yet.' },
      { choice: { id: 'g5_why', options: [
        { text: 'Why did you never take it back?', effects: { relationship: { captain: 3 } }, reply: [
          { speaker: 'captain', text: 'Nobody asked. A bell wants asking for. I have kept it warm.' },
        ] },
        { text: 'It\'s for a pie stall. And an apology.', effects: { relationship: { captain: 4 }, flag: 'told_captain_plan' }, reply: [
          { speaker: 'captain', text: 'Best use of brass I ever heard. Bea sent pies to my crew in gales.' },
        ] },
      ] } },
      { speaker: 'narrator', text: 'He lifts it down and rings it once. One clear, high note across the water.' },
      { speaker: 'captain', text: 'There. She still sings. Take her home.', anim: 'talk' },
      { speaker: 'captain', text: 'And take my chowder recipe. A trade. I shall want a slice at that fair.' },
      { speaker: 'narrator', text: 'The bell is warm from the sun, and heavier than it looks.' },
    ],
    rewards: {
      relationship: { captain: 8, ambrose: 2 }, items: ['copper_bell'], recipes: ['harbor_chowder'], money: 0,
      unlocks: [{ type: 'contact', npc: 'captain' }], flags: ['has_bell'],
    },
    missed: {
      messages: [{ from: 'kit', text: 'captain update: still on the pier, still likes jam. he\'s there every single morning, so whenever you\'re up early. no rush' }],
      rescheduleDays: 1,
    },
  },
  {
    id: 'k4_rehearsal', thread: 'friend', title: 'The Loft on Easel Lane',
    summary: 'Kit played you the whole song in her loft. You named it.',
    trigger: { minDay: 22, after: ['k3_song_hunting'], sendAt: '10:30' },
    delivery: {
      messages: [
        { from: 'kit', text: 'IT HAS A SECOND VERSE. and a bridge!! come to the loft tomorrow afternoon, above the print shop on Easel Lane. bring ears. I have cookies' },
      ],
      appointment: { title: "Hear the song at Kit's loft", place: 'home_kit', dayOffset: 1, from: '13:00', to: '16:30', with: ['kit'] },
    },
    scene: [
      { speaker: 'narrator', text: 'A big cold room, a wall of windows, paint on everything, one good chair.' },
      { speaker: 'kit', text: 'You get the chair. It\'s the chair. Don\'t look at the dishes.', anim: 'wave' },
      { speaker: 'kit', text: 'Okay. Whole thing. Start to finish. If it\'s bad, lie to me kindly.' },
      { speaker: 'narrator', text: 'She plays. Gulls, bells and kettles. The chorus lands like a porch light.', anim: 'sit' },
      { speaker: 'narrator', text: 'The last chord hangs in the four o\'clock light. It isn\'t bad. It\'s lovely.' },
      { speaker: 'kit', text: '...Well? Say something. Your face is doing a thing.' },
      { speaker: 'kit', text: 'It needs a name. I\'ve crossed out nine. You choose.' },
      { choice: { id: 'k4_title', options: [
        { text: '"Not Home Yet"', effects: { flag: 'title_not_home_yet', relationship: { kit: 3 } }, reply: [
          { speaker: 'kit', text: '"Not Home Yet." Oh. Because by the end, you are. Yes.' },
        ] },
        { text: '"Fresh Start"', effects: { flag: 'title_fresh_start', relationship: { kit: 3 } }, reply: [
          { speaker: 'kit', text: '"Fresh Start." Ha. It\'s about you, you know. A bit. A lot.' },
        ] },
        { text: '"Maple Bay, Tuesday"', effects: { flag: 'title_tuesday', relationship: { kit: 3 } }, reply: [
          { speaker: 'kit', text: '"Maple Bay, Tuesday." It\'s perfect. It\'s so ordinary. I love it.' },
        ] },
      ] } },
      { speaker: 'kit', text: 'Also, your niece called the bar. The landline. She has "booked" me.', anim: 'phone' },
      { speaker: 'kit', text: 'I\'m playing a school fair. A pie stall is my first real venue.' },
      { speaker: 'kit', text: 'Then Sunday at the Heron, properly. Lou gave me the whole night.' },
      { speaker: 'kit', text: 'I printed posters. Take one. Your name is on it. Very small. But on it.', anim: 'talk' },
    ],
    rewards: {
      relationship: { kit: 10 }, items: ['kit_poster'], recipes: [], money: 0,
      unlocks: [{ type: 'home', home: 'home_kit' }], flags: ['song_finished'],
    },
    missed: {
      messages: [{ from: 'kit', text: 'no stress, I used the time to fix the bridge. it had a wobble. loft\'s open tomorrow afternoon too, cookies are holding' }],
      rescheduleDays: 1,
    },
  },
  {
    id: 'f4_summer_fair', thread: 'family', title: 'The Little Kettle',
    summary: 'At the Summer Fair the bell rang again, and Nora and Nana finally said it out loud.',
    trigger: { minDay: 24, after: ['f3_booth_building', 'g5_the_bell', 'k4_rehearsal'], sendAt: '16:30' },
    delivery: {
      messages: [
        { from: 'jules', text: 'FROM PIP: "You\'re officialy invited to The Little Kettle, Saturday 11 o clock, school yard. Bring the SURPRISE. Don\'t be late."' },
        { from: 'jules', text: 'From me: Nana said yes to the pies. She sounded odd on the phone. Good odd, I think. What surprise?? I\'m nervous. Come early?' },
      ],
      appointment: { title: 'Summer Fair: The Little Kettle', place: 'spot:school', dayOffset: 2, weekday: 'sat', from: '10:30', to: '15:00', with: ['jules', 'theo', 'pip', 'milo', 'nana', 'kit', 'otis', 'barnaby', 'captain', 'roz'] },
    },
    scene: [
      { speaker: 'narrator', text: 'Bunting, a bouncy castle, a tuba. In the corner: a striped, leaning stall.' },
      { speaker: 'pip', text: 'You have the surprise? Hook is ready. I measured it twice.', anim: 'talk' },
      { speaker: 'narrator', text: 'You hang the brass bell over the counter. It catches the sun.' },
      { speaker: 'jules', text: 'Is that... no. Where did you... that\'s THE bell. That\'s her bell.', anim: 'stand' },
      { speaker: 'narrator', text: 'Across the yard, a small upright figure with a stack of pie tins stops walking.' },
      { speaker: 'nana', text: 'Well. There you are, old thing.', anim: 'stand' },
      { speaker: 'theo', text: 'I\'ll take those pies, Bea. And I\'ll take the children. Over there. Far.' },
      { speaker: 'jules', text: 'Nana. I should have said this years ago. I\'m sorry I didn\'t take it.', anim: 'talk' },
      { speaker: 'nana', text: 'Hush. I was never cross with you. I was cross with the calendar.' },
      { speaker: 'nana', text: 'You opened a classroom. I closed a shop. Both true. Nobody to blame.' },
      { speaker: 'jules', text: 'I thought you couldn\'t forgive me. So I stayed busy.' },
      { speaker: 'nana', text: 'And I thought you were ashamed of an old woman\'s tearoom. Pair of fools.' },
      { speaker: 'narrator', text: 'It\'s a long hug. The pies, wisely, have been put down first.' },
      { speaker: 'pip', text: 'Is the feelings part done? We open in two minutes. Who rings the bell?' },
      { choice: { id: 'f4_ring', options: [
        { text: 'Nana. It\'s her bell.', effects: { relationship: { nana: 4 }, flag: 'bell_rung_nana' }, reply: [
          { speaker: 'nana', text: 'Thirty-one years. I know the wrist of it. Stand back.', anim: 'cheer' },
        ] },
        { text: 'Nora. First day of the new shop.', effects: { relationship: { jules: 4 }, flag: 'bell_rung_jules' }, reply: [
          { speaker: 'jules', text: 'Me? Oh. Right. Nana, how do I... like this?', anim: 'cheer' },
          { speaker: 'nana', text: 'Like you mean it, honey.' },
        ] },
        { text: 'Milo. He hasn\'t asked, but look at him.', effects: { relationship: { milo: 5 }, flag: 'bell_rung_milo' }, reply: [
          { speaker: 'milo', text: '...Really? Me? ...I will be very careful.', anim: 'cheer' },
        ] },
      ] } },
      { speaker: 'narrator', text: 'One clear high note over the school yard. Somewhere, a tuba stops to listen.' },
      { speaker: 'kit', text: 'That\'s my cue. This one is new. It\'s for a pie stall. One, two...', anim: 'dance' },
      { speaker: 'barnaby', text: 'One slice. Hm. Mm. Four stars. And a fifth, which I have borrowed.', anim: 'eat' },
      { speaker: 'captain', text: 'I was promised a slice. I see I am in a line. Good. As it should be.' },
      { speaker: 'narrator', text: 'The Little Kettle sells out by two. Pip counts the tin three times.' },
      { speaker: 'nana', text: 'You did this, you know. You went and found my bell.' },
      { speaker: 'nana', text: 'It stays with the stall. But the teapot is yours. No arguing with your Nana.' },
      { speaker: 'jules', text: 'Sunday dinner. All of us. Nana\'s chair is at the head. It always was.' },
    ],
    rewards: {
      relationship: { jules: 10, nana: 10, theo: 5, pip: 6, milo: 6, kit: 4, roz: 2, captain: 2 },
      items: ['fair_ribbon', 'kettle_teapot'], recipes: [], money: 40,
      unlocks: [
        { type: 'recurring', id: 'sunday_dinner', title: 'Sunday dinner on Sycamore Lane', place: 'home_jules', weekday: 'sun', from: '17:30', to: '20:30' },
        { type: 'discount', venue: 'cornerstore', percent: 10 },
      ],
      flags: ['reconciled', 'bell_returned'],
    },
    missed: {
      messages: [
        { from: 'jules', text: 'Fair got rained out!! Pip is furious at the sky. It\'s moved to next Saturday, same time. The stall is in the garage, sulking.' },
      ],
      rescheduleDays: 7, weekday: 'sat',
    },
  },
  {
    id: 'k5_the_song', thread: 'friend', title: 'Sunday at the Heron',
    summary: 'Kit played her first finished song to a full house. You were in the front row.',
    trigger: { minDay: 27, after: ['f4_summer_fair'], sendAt: '11:00' },
    delivery: {
      messages: [
        { from: 'kit', text: 'tonight. 8. the Heron. the whole song, with a name and everything. I saved you the good stool and put a sign on it. the sign says your name' },
        { from: 'lou', text: 'Lou here. She has rehearsed since dawn. Come. Clap loudly. I\'m not asking as your barman, I\'m asking as a fan.' },
      ],
      appointment: { title: "Kit's song at the Blue Heron", place: 'bar', dayOffset: 0, weekday: 'sun', from: '19:30', to: '23:30', with: ['kit', 'lou', 'jules', 'theo', 'nana', 'dez', 'noor', 'fenn'] },
    },
    scene: [
      { speaker: 'narrator', text: 'The Heron is packed. Front table: Nora, Theo, Dez, and Nana with a sherry.' },
      { speaker: 'nana', text: 'I have not been in a bar since 1974. It is exactly as I left it.', anim: 'drink' },
      { speaker: 'lou', text: 'Ladies, gentlemen, regulars. Four weeks ago she had half a song.', anim: 'talk' },
      { speaker: 'lou', text: 'Tonight she has a whole one. Kit Navarro.' },
      { speaker: 'kit', text: 'Hi. This is for someone who got off a plane with one suitcase.', anim: 'stand' },
      { speaker: 'kit', text: 'And for everyone who left a light on.' },
      { speaker: 'narrator', text: 'She plays it all the way through. Nobody touches a glass.', anim: 'sit' },
      { speaker: 'narrator', text: 'On the last chorus the whole room sings the line you chose.' },
      { speaker: 'dez', text: 'I AM NOT CRYING, IT IS THE ONIONS. THERE ARE NO ONIONS. FINE.', anim: 'cheer' },
      { speaker: 'narrator', text: 'Later, on the steps outside. The neon heron hums. The last train rattles by.' },
      { speaker: 'kit', text: 'I finished something. I actually finished something.', anim: 'sit' },
      { choice: { id: 'k5_after', options: [
        { text: 'First of forty.', effects: { relationship: { kit: 4 }, flag: 'k5_first_of_forty' }, reply: [
          { speaker: 'kit', text: 'Thirty-nine to go. You\'re helping with every single one. Sorry.' },
        ] },
        { text: 'I\'m proud of you, Kit.', effects: { relationship: { kit: 5 }, flag: 'k5_proud' }, reply: [
          { speaker: 'kit', text: 'Do not. I just got my face back under control. ...Thank you.' },
        ] },
        { text: '(Sit with her and listen to the city.)', effects: { relationship: { kit: 5 }, flag: 'k5_quiet' }, reply: [
          { speaker: 'narrator', text: 'A foghorn. A late taxi. Somewhere, a small brass bell, or the memory of one.' },
        ] },
      ] } },
      { speaker: 'kit', text: 'New rule. We don\'t lose each other again. I made you a tape. Sign here.', anim: 'talk' },
      { speaker: 'narrator', text: 'Four weeks in Maple Bay. It\'s starting to feel like yours.' },
    ],
    rewards: {
      relationship: { kit: 12, lou: 4, nana: 2, jules: 2 }, items: ['kit_demo'], recipes: [], money: 0,
      unlocks: [{ type: 'music', track: 'kit_song' }, { type: 'discount', venue: 'bar', percent: 20 }],
      flags: ['first_month_complete'],
    },
    missed: {
      messages: [{ from: 'kit', text: 'I couldn\'t do it without the good stool filled, so Lou moved me to next Sunday. same time. the sign\'s still on your seat' }],
      rescheduleDays: 7, weekday: 'sun',
    },
  },
  // =========================================================== SEASONAL FOLLOW-UPS
  {
    id: 's1_maple_festival', thread: 'grandma', seasonal: true, title: 'The Maple Festival',
    summary: 'Nana entered the pie contest one last time, and pinned the ribbon on Roz.',
    trigger: { minDay: 31, after: ['k5_the_song'], sendAt: '09:00' },
    delivery: {
      messages: [
        { from: 'nana', text: 'Darling. I have done something rash. I have entered the Festival pie contest. First time in nine years. I need a taster and a carrier.' },
        { from: 'roz', text: 'Tell your Nana I\'m ALSO entering and I\'ve been practicing. Saturday, the park, noon. May the best crust win. (Hers. It will be hers.)' },
      ],
      appointment: { title: 'Maple Festival pie contest', place: 'park', dayOffset: 2, weekday: 'sat', from: '10:00', to: '18:00', with: ['nana', 'roz', 'jules', 'theo', 'pip', 'milo', 'kit', 'barnaby', 'imani', 'vik'] },
    },
    scene: [
      { speaker: 'narrator', text: 'The whole park is red and gold. Leaf crowns, a parade tuba, syrup in the air.' },
      { speaker: 'pip', text: 'Hold still. This is your leaf crown. I made it regulation size.', anim: 'talk' },
      { speaker: 'nana', text: 'Carry it level, darling. Level! That pie has traveled worse, but still.', anim: 'walk' },
      { speaker: 'roz', text: 'Bea. May your bottom be soggy. I say it with love.', anim: 'wave' },
      { speaker: 'nana', text: 'Rosalind. May your lattice slip. I taught you that lattice.' },
      { speaker: 'barnaby', text: 'Silence at the judging table. I am approaching the pies.', anim: 'eat' },
      { choice: { id: 's1_cheer', options: [
        { text: 'Cheer for Nana.', effects: { relationship: { nana: 3 } }, reply: [
          { speaker: 'nana', text: 'I heard that. Louder next time. My rivals should hear it too.' },
        ] },
        { text: 'Cheer for both. Loudly.', effects: { relationship: { nana: 2, roz: 3 } }, reply: [
          { speaker: 'roz', text: 'A diplomat! Bea, your grandchild is going places.' },
        ] },
      ] } },
      { speaker: 'barnaby', text: 'The ribbon goes to... the Copper Kettle Apple-Maple. Mrs. Beatrice. Again.' },
      { speaker: 'nana', text: 'Twelve. Hm. Eleven was plenty for anybody.', anim: 'cheer' },
      { speaker: 'narrator', text: 'She crosses the grass and pins the ribbon to Roz\'s apron.' },
      { speaker: 'nana', text: 'It is the same recipe, in the same ovens. This one is yours, my girl.' },
      { speaker: 'roz', text: 'Bea, you can\'t just... oh, now I\'m crying into the taffy.' },
      { speaker: 'kit', text: 'From the bandstand: this next one is about a city. You may know it.', anim: 'dance' },
      { speaker: 'narrator', text: 'They tap the big maple at noon. The first cup goes to Milo.' },
    ],
    rewards: {
      relationship: { nana: 6, roz: 6, jules: 2, pip: 2, milo: 2, kit: 2 }, items: ['leaf_crown'], recipes: ['maple_taffy'], money: 0,
      unlocks: [{ type: 'discount', venue: 'bakery', percent: 25 }], flags: ['festival_done'],
    },
    missed: {
      messages: [{ from: 'nana', text: 'You missed the pie, darling, but I saved you a slice and the gossip. Festival runs Sunday too. Come and wear a silly crown with me.' }],
      rescheduleDays: 1,
    },
  },
  {
    id: 's2_lantern_night', thread: 'friend', seasonal: true, title: 'Lantern Night',
    summary: 'You floated a wish from the pier. Kit told you about the tour.',
    trigger: { minDay: 45, after: ['s1_maple_festival'], sendAt: '12:00' },
    delivery: {
      messages: [
        { from: 'kit', text: 'Lantern Night on saturday. the whole city floats wishes off the pier at 9. I need to tell you something and I want to do it by lantern' },
        { from: 'jules', text: 'Lantern Night! We\'ll all be on the pier from 6. Wrap up. Milo has written his wish already and won\'t show anyone. It\'s a dinosaur.' },
      ],
      appointment: { title: 'Lantern Night at the pier', place: 'pier', dayOffset: 2, weekday: 'sat', from: '18:00', to: '22:00', with: ['kit', 'jules', 'theo', 'pip', 'milo', 'nana', 'captain', 'haru'] },
    },
    scene: [
      { speaker: 'narrator', text: 'Snow on the boardwalk. A thousand paper lanterns waiting to be lit.' },
      { speaker: 'haru', text: 'Soup. Free tonight. Hold it with both hands. That is the point.', anim: 'work' },
      { speaker: 'milo', text: 'My wish is secret. It is a dinosaur. That is all I can say.', anim: 'stand' },
      { speaker: 'captain', text: 'It began for the boats. A light for everyone not home yet.', anim: 'talk' },
      { speaker: 'kit', text: 'So. A label heard the tape. They want me on a little tour. In spring.', anim: 'stand' },
      { speaker: 'kit', text: 'Three towns up the coast. Two weeks. I\'ve never left for two weeks.' },
      { choice: { id: 's2_tour', options: [
        { text: 'Go. We\'ll keep the light on.', effects: { relationship: { kit: 5 }, flag: 'tour_encouraged' }, reply: [
          { speaker: 'kit', text: 'You\'re quoting my own chorus at me. That\'s cheating. ...Okay. I\'ll go.' },
        ] },
        { text: 'I\'ll miss you. Go anyway.', effects: { relationship: { kit: 6 }, flag: 'tour_encouraged' }, reply: [
          { speaker: 'kit', text: 'Two weeks. I\'ll send a postcard from every single town. Boring ones.' },
        ] },
        { text: 'What do YOU want?', effects: { relationship: { kit: 5 }, flag: 'tour_encouraged' }, reply: [
          { speaker: 'kit', text: 'To go. And to have somewhere to come back to. I think I have both now.' },
        ] },
      ] } },
      { speaker: 'nana', text: 'Write your wish, darling. Small writing. The sea does not need the details.' },
      { speaker: 'narrator', text: 'At nine the lanterns go out past the breakwater, one by one, like slow stars.' },
      { speaker: 'jules', text: 'Yours cleared the wall. That means it counts. I don\'t make the rules.', anim: 'cheer' },
    ],
    rewards: {
      relationship: { kit: 8, jules: 3, nana: 3, captain: 2, haru: 3 }, items: ['paper_lantern'], recipes: ['lantern_soup'], money: 0,
      unlocks: [{ type: 'discount', venue: 'ramen', percent: 10 }], flags: ['lantern_night_done', 'kit_tour_planned'],
    },
    missed: {
      messages: [{ from: 'kit', text: 'missed you at the pier. I floated one for you (it cleared the wall). the Heron\'s doing a little lantern thing tomorrow, come find me' }],
      rescheduleDays: 1,
    },
  },
  {
    id: 's3_one_year', thread: 'family', seasonal: true, title: 'One Year in Maple Bay',
    summary: 'A year to the day since your plane landed. Everyone came to the lookout.',
    trigger: { minDay: 56, after: ['s2_lantern_night'], sendAt: '14:00' },
    delivery: {
      messages: [
        { from: 'jules', text: 'Do you know what time it is? One year ago, this exact minute, your plane landed. I wrote it on the calendar. In pen.' },
        { from: 'jules', text: 'Picnic at the Hillcrest Lookout this Sunday, noon. Everyone\'s coming. Manny is driving Nana up. He refuses to charge her.' },
      ],
      appointment: { title: 'One-year picnic at the Lookout', place: 'lookout', dayOffset: 2, weekday: 'sun', from: '12:00', to: '16:00', with: ['jules', 'theo', 'pip', 'milo', 'nana', 'kit', 'dez', 'manny', 'gordon'] },
    },
    scene: [
      { speaker: 'narrator', text: 'The whole bay below: harbor, viaduct, Old Town roofs, the lighthouse.' },
      { speaker: 'manny', text: 'A year ago I drove this one in with a single suitcase. Look at this crowd!', anim: 'cheer' },
      { speaker: 'theo', text: 'I built a picnic bench for the occasion. Sit gently. Sit in shifts.', anim: 'sit' },
      { speaker: 'kit', text: 'Back from tour! Three towns. Nobody in any of them makes pie like here.', anim: 'wave' },
      { speaker: 'pip', text: 'I have prepared a speech. It is eleven pages. I will do the highlights.', anim: 'talk' },
      { speaker: 'pip', text: 'Highlight one: you came. Highlight two: you stayed. The end. Clap.' },
      { speaker: 'gordon', text: 'And from the old streetcar lines: a lifetime ticket. No. 9 runs again this summer.' },
      { choice: { id: 's3_toast', options: [
        { text: 'To fresh starts.', effects: { relationship: { jules: 2, kit: 2 } }, reply: [
          { speaker: 'jules', text: 'To fresh starts. And to finishing them here.' },
        ] },
        { text: 'To the people who left a light on.', effects: { relationship: { nana: 2, kit: 2 } }, reply: [
          { speaker: 'nana', text: 'It was never off, darling. Not for a minute.' },
        ] },
        { text: 'To second helpings.', effects: { relationship: { theo: 2, dez: 2 } }, reply: [
          { speaker: 'dez', text: 'Finally, someone speaks for the people.' },
        ] },
      ] } },
      { speaker: 'nana', text: 'Everyone squeeze in. Milo, look at the camera. Milo. The camera, sweetie.', anim: 'stand' },
      { speaker: 'milo', text: 'There is a bird.' },
      { speaker: 'narrator', text: 'Click. One year. It looks good on you.' },
    ],
    rewards: {
      relationship: { jules: 5, theo: 4, pip: 4, milo: 4, nana: 5, kit: 5, dez: 4, manny: 4, gordon: 4 },
      items: ['year_photo', 'tram_ticket'], recipes: [], money: 0,
      unlocks: [{ type: 'contact', npc: 'manny' }], flags: ['year_one_complete'],
    },
    missed: {
      messages: [{ from: 'jules', text: 'We ate your share but saved the view. Re-do next Sunday? Theo\'s bench survived, which honestly deserves its own celebration.' }],
      rescheduleDays: 7, weekday: 'sun',
    },
  },
  {
    id: 's4_harbor_lights', thread: 'grandma', seasonal: true, title: 'Harbor Lights & Streetcar No. 9',
    summary: 'Streetcar No. 9 ran again, the Kettle Corner opened, and you rang two bells in one night.',
    trigger: { minDay: 73, after: ['s3_one_year'], sendAt: '10:00' },
    delivery: {
      messages: [
        { from: 'nana', text: 'Darling. Roz and I have a SCHEME. Saturday teas at the corner table. "The Kettle Corner". I pour, she bakes. Opening this Saturday at 5.' },
        { from: 'roz', text: 'She forgot to say: Mr. Pike is running Streetcar No. 9 down Market Street at 6 for the Harbor Lights, and he insists YOU ring the bell.' },
      ],
      appointment: { title: 'Kettle Corner opening & Harbor Lights', place: 'bakery', dayOffset: 2, weekday: 'sat', from: '17:00', to: '22:00', with: ['nana', 'roz', 'jules', 'theo', 'pip', 'milo', 'gordon', 'kit', 'captain', 'ambrose'] },
    },
    scene: [
      { speaker: 'narrator', text: 'Rise & Shine, summer evening. On the hook above the door: the brass bell.' },
      { speaker: 'roz', text: 'The school lent it back for Saturdays. Pip negotiated. There were terms.', anim: 'wave' },
      { speaker: 'nana', text: 'Corner table, my teapot, her scones. I am un-retired on Saturdays only.', anim: 'work' },
      { speaker: 'jules', text: 'I\'ve signed up for the till. Don\'t look at me like that. I want to.', anim: 'talk' },
      { speaker: 'ambrose', text: 'Thirty years of Saturday scones, and now thirty more. Chapter sends regards.' },
      { speaker: 'narrator', text: 'Outside, on Market Street, something old and green and polished hums.' },
      { speaker: 'gordon', text: 'All aboard the No. 9! First run since ninety-one. You. The cord. Go on.', anim: 'cheer' },
      { choice: { id: 's4_bell', options: [
        { text: '(Ring it like you mean it.)', effects: { relationship: { gordon: 5 }, flag: 'rang_tram_bell' }, reply: [
          { speaker: 'gordon', text: 'Ha! Hear that? That is thirty years of quiet, ended. Thank you.' },
        ] },
        { text: 'Together, Mr. Pike.', effects: { relationship: { gordon: 6 }, flag: 'rang_tram_bell' }, reply: [
          { speaker: 'gordon', text: 'Together. On three. I always was soft on a polite passenger.' },
        ] },
      ] } },
      { speaker: 'narrator', text: 'The streetcar bell. Then, from the bakery door, the brass bell, answering.' },
      { speaker: 'captain', text: 'Two bells and a lighthouse. Nobody will be lost in this town tonight.' },
      { speaker: 'kit', text: 'I\'m writing that down. Song number two. Thirty-eight to go.', anim: 'read' },
      { speaker: 'narrator', text: 'Fireworks over the harbor. You know every face on this street.' },
      { speaker: 'nana', text: 'Tea, darling? The kettle is always on. It is a house rule.' },
    ],
    rewards: {
      relationship: { nana: 6, roz: 5, jules: 5, gordon: 6, kit: 3, captain: 3, ambrose: 3 }, items: [], recipes: [], money: 0,
      unlocks: [
        { type: 'recurring', id: 'kettle_corner_tea', title: 'Saturday tea at the Kettle Corner', place: 'bakery', weekday: 'sat', from: '15:00', to: '17:00' },
        { type: 'contact', npc: 'gordon' },
      ],
      flags: ['kettle_corner_open', 'tram_runs'],
    },
    missed: {
      messages: [{ from: 'nana', text: 'Mr. Pike would not run the streetcar without his bell-ringer. He has polished it again instead. Next Saturday, darling. We will all be there.' }],
      rescheduleDays: 7, weekday: 'sat',
    },
  },
];

export const BEATS_BY_ID = Object.fromEntries(BEATS.map((b) => [b.id, b]));
