// FIRST-TIME WINDOWS (owner msg 107, BIBLE 21.3): the first time the player touches a system, ONE short friendly window explains the loop and where it leads.
// These ARE the tips of the Bay Basics app (src/ui/phone_tips.js merges them into its list by id: an entry with the id of an older tip replaces its words),
// shown as a window at the right moment instead of a banner. Engine, queue and triggers: src/sim/firsttime.js. Each belongs to a Systems card (`sys`, src/data/systems.js).
//
// A window: { id, sys (Systems card id), topic (Bay Basics topic), title, text (two or three short sentences), icon?,
//             go?: { app, arg? } | { find: navigator kind } | { place: id } | { sys: card id } (that card's jump), goLabel? ("Show me" by default) }
// The trigger of each one is listed next to it (the code is the TRIGGERS table in src/sim/firsttime.js). "now" = shown at once, on top of what you just opened;
// "soon" = waits for a calm moment (no window, banner, Chapter, mini-game, shift task or cutscene; a gap since the last one; a few a day at most).
export const WINDOWS = [
  /* ---------- getting around ---------- */
  { id: 'navigator', sys: 'map', topic: 'around', title: 'The Map knows the way',   /* now: the Map app is opened for the first time */
    text: 'Tap "Where to?" and pick a place. The Map compares the walk, the bus, the train and a cab, with times and fares. Choose one and an arrow leads you right to the door.' },
  { id: 'bus', sys: 'transit', topic: 'around', title: 'A bus stop',   /* now: a bus stop sign is tapped */
    text: 'The sign shows which buses are coming and how long they will be. Wait here and get on when yours pulls in. Buses are cheap, so it is worth a look before you walk.' },
  { id: 'train', sys: 'transit', topic: 'around', title: 'The light-rail loop',   /* now: a station entrance is tapped */
    text: 'Eight stations ring the town. Pick where you are going on the line map, buy a ticket and wait on the platform. One fare takes you any distance.' },
  { id: 'pass', sys: 'transit', topic: 'around', title: 'Riding often?',   /* soon: the second bus or train ride ends */
    text: 'A day pass or a week pass covers every bus and train, and it soon pays for itself. Station panels sell them.' },
  { id: 'wander', sys: 'stamps', head: 'Wander', topic: 'around', title: 'Wander, your guidebook',   /* soon: after Nora's first text is answered / the arrival is over */
    text: 'Wander lists every place in town with its hours and what you can do there. Its front page has quick ideas for right now, and "How things work here" has a card for everything in the game.',
    go: { app: 'guide' }, goLabel: 'Open Wander' },
  /* ---------- food ---------- */
  { id: 'groceries', sys: 'groceries', topic: 'food', title: 'Buying groceries',   /* now: the till of a grocer, market or corner shop is opened */
    text: 'What you buy here goes in your backpack, and into your fridge by itself when you get home. Cooking at home is the cheap way to eat well.' },
  { id: 'cooking', sys: 'cooking', topic: 'food', title: 'Cooking at home',   /* now: your stove is tapped · soon: groceries go into your kitchen */
    text: 'Your stove cooks from what is in the fridge. Every meal makes you a better cook, and better cooks learn more recipes. Books, cooking shows and friends teach new ones too.' },
  { id: 'eatout', sys: 'eatout', topic: 'food', title: 'Eating out',   /* now: the counter of a cafe, diner or restaurant is opened */
    text: 'Order here, then find a seat and eat. Every dish you have never tried is a small treat of its own. Places you have eaten at may bring dinner to your door later on.' },
  { id: 'spoiled', sys: 'groceries', topic: 'food', title: 'Food goes off',   /* soon: something spoils */
    text: 'Something of yours went off. Fresh food keeps for days in the fridge and far less in a backpack. Eat the oldest first.' },
  { id: 'recipe_new', sys: 'cooking', topic: 'food', title: 'A new recipe',   /* soon: a recipe is learned after the arrival */
    text: 'You have learned a recipe. Your stove lists every dish you know, and what each one still needs from the shops.' },
  /* ---------- home ---------- */
  { id: 'decorate', sys: 'decor', topic: 'home', title: 'Making it yours',   /* now: Decorate is opened */
    text: 'Drag a piece to move it. Tap it to turn it, store it or sell it. Shops around town sell furniture and big pieces arrive at your door the next morning; the Shop tab here lets you try a piece in your room first.',
    go: { sys: 'furniture' }, goLabel: 'Show me a furniture shop' },
  { id: 'furnshop', sys: 'furniture', topic: 'home', title: 'A furniture shop',   /* now: the first furniture shop is entered */
    text: 'Everything on the floor is for sale. Tap a piece to look it over. Small things go home in your bag today; big pieces arrive at your door the next morning.' },
  { id: 'deliveries', sys: 'roomy', topic: 'home', title: 'Your order is on its way',   /* soon: the first order is placed */
    text: 'The courier rings in the morning on the day. A big piece needs you at home to take it in; small parcels wait at the door. Roomy tracks every one.', go: { app: 'roomy' }, goLabel: 'Open Roomy' },
  { id: 'boxes', sys: 'roomy', topic: 'home', title: 'A box has arrived',   /* soon: a box lands in your home */
    text: 'Tap a box to unpack it, or to build it if it is a flat-pack. The piece lands where you planned it. Take the cardboard out afterwards and the room feels better for it.' },
  { id: 'moving', sys: 'homes', topic: 'home', title: 'Somewhere new to live',   /* now: Nestly is opened */
    text: 'Nestly lists every flat and house in town. Walk round one before you decide. Take it furnished as you see it, or bare and cheaper with a starter kit; a van brings your own things over.' },
  { id: 'viewing', sys: 'homes', topic: 'home', title: 'Just looking',   /* now: a viewing starts */
    text: 'Have a walk round. Nothing here is yours yet, so nothing can be used. If you like it, the listing lets you rent or buy.' },
  { id: 'cleaning', sys: 'house', topic: 'home', title: 'Running low at home',   /* soon: a household supply runs low */
    text: 'Soap, shampoo and cleaner run out with use. Grocers and corner shops sell them, and they go into your cupboard by themselves when you get home.', go: { sys: 'groceries' }, goLabel: 'Show me a shop' },
  { id: 'sleep', sys: 'needs', topic: 'home', title: 'It is late',   /* soon: past midnight and still up */
    text: 'Tap your bed and choose when to wake. A full night sets you up for tomorrow; stay up and the next day is harder.' },
  { id: 'dresser', sys: 'closet', topic: 'home', title: 'Your clothes',   /* QA8: it opens on a wardrobe or a rail too */   /* now: the dresser is opened */
    text: 'This is everything you own to wear. Put an outfit together piece by piece and save the ones you like. Clothes worn for a few days go to the hamper for a wash.' },
  { id: 'clothesshop', sys: 'clothesshop', topic: 'home', title: 'A clothes shop',   /* now: the first clothes shop is entered */
    text: 'Take anything off a rack to look at it. The fitting room shows it on you before you pay. Every shop in town has its own style and prices.' },
  { id: 'laundry', sys: 'laundry', topic: 'home', title: 'Washing day',   /* soon: clothes turn dirty for the first time */
    text: 'Some of your clothes need a wash. They drop into your hamper when you change; take the laundry bag from there to a laundromat. A washer of your own does it for free.',
    go: { sys: 'laundry' }, goLabel: 'Show me a laundromat' },
  { id: 'haircut', sys: 'hair', topic: 'home', title: 'A new look',   /* now: a barber or salon is entered */
    text: 'Have a leaf through the lookbook. Pick a cut or a colour, sit in the chair and see it in the mirror. It grows out in time, so nothing is for ever.' },
  /* ---------- work & money ---------- */
  { id: 'jobsboard', sys: 'jobs', topic: 'work', title: 'Finding work',   /* now: the Jobs app is opened */
    text: 'The Board tab lists every job in town, and so do the free computers at the library. Apply and you hear back at once.', go: { find: 'library' }, goLabel: 'To the library' },
  { id: 'shift', sys: 'jobs', topic: 'work', title: 'You have a job',   /* soon: hired */
    text: 'Your shifts are on My Day. Be at the door when one starts and you clock in by walking through it. Good shifts lead to promotions.' },
  { id: 'autowork', sys: 'jobs', topic: 'work', title: 'On shift',   /* soon: the first shift starts */
    text: 'Do the tasks that light up; each one done well counts. Not in the mood? Auto-work does the day for you at a steady pace, for the same hourly pay.' },
  { id: 'promoted', sys: 'jobs', topic: 'work', title: 'A promotion',   /* soon: promoted */
    text: 'Better pay from your next shift. The step after this one may ask for a skill; the Jobs app shows which.', go: { app: 'jobs' }, goLabel: 'Open Jobs' },
  { id: 'gigs', sys: 'jobs', topic: 'work', title: 'A gig',   /* soon: the first gig starts */
    text: 'A gig is a one-off job that pays the same day. Follow the arrow to each stop. You can take a few a day from the Jobs app.' },
  { id: 'bills', sys: 'money', topic: 'work', title: 'Monday bills',   /* soon: the evening before the first bills */
    text: 'Rent and bills come out every Monday morning. If you are short, the balance dips below zero for a while and nothing worse happens. Bay Bank shows what is due.', go: { app: 'bank' }, goLabel: 'Open Bay Bank' },
  { id: 'money_low', sys: 'money', topic: 'work', title: 'When money is tight',   /* soon: the balance drops under $50 */
    text: 'Cooking at home, walking and a gig or two from the Jobs app all help. Nobody is ever turned out of their home in Maple Bay.' },
  { id: 'opps', sys: 'opps', topic: 'work', title: 'An Opportunity',   /* soon: the first Opportunity is offered */
    text: 'Opportunities are small things someone in town would like, with a thank-you at the end. Take one up or let it pass: nothing is lost, and more come along. The ones you take are on My Day.', go: { app: 'opps' }, goLabel: 'Open Opportunities' },
  { id: 'uni', sys: 'university', topic: 'work', title: 'The University',   /* now: the campus is entered */
    text: 'The Registrar signs you up for a course. Your classes then appear on My Day, and a certificate at the end helps you at work.' },
  { id: 'uniclass', sys: 'university', topic: 'work', title: 'You are enrolled',   /* soon: the first course is taken */
    text: 'Come to class at the times on My Day and keep up with the coursework. Sit the final when you feel ready.' },
  /* ---------- people ---------- */
  { id: 'talk', sys: 'friends', topic: 'people', title: 'Talking to people',   /* soon: the first time you are inside a place with people; or Social runs low */
    text: 'Tap someone and choose Talk. What goes down well depends on the person, and what you learn about them is remembered. Regular chats turn strangers into friends.' },
  { id: 'gifts', sys: 'friends', topic: 'people', title: 'Getting on well',   /* soon: a friendship moves up */
    text: 'A small gift goes a long way. Carry it in your bag and choose Give while you talk. Ask what they like first.' },
  { id: 'invites', sys: 'friends', topic: 'people', title: 'It is on your day',   /* soon: an invitation is accepted */
    text: 'Turning up on time is good for a friendship. My Day will tell you when to set off, and show the way.' },
  { id: 'mail', sys: 'post', topic: 'people', title: 'You have post',   /* soon: the first letter is delivered */
    text: 'Letters wait in the basket by your front door. To write back, any post office has paper, stamps and a counter for parcels.', go: { sys: 'post' }, goLabel: 'Show me a post office' },
  { id: 'postoffice', sys: 'post', topic: 'people', title: 'The post office',   /* now: a post office is entered */
    text: 'Write a letter or a card at the desk, buy stamps, or pack up a present at the parcel table. You can rent a box here for your own mail too.' },
  { id: 'chapter_after', sys: 'chapters', topic: 'people', title: 'That was a Chapter',   /* soon: the first Chapter ends */
    text: 'The story goes on at your pace. The next Chapter opens after a breath, and a gold marker shows where it starts. Whenever you\'re ready: it will keep.' },
  /* ---------- wellbeing ---------- */
  { id: 'needs_tap', sys: 'needs', topic: 'well', title: 'Running low',   /* soon: a need goes low for the first time */
    text: 'One of your needs is getting low. Tap its icon on screen for the nearest places that fix it, with the way there. Nobody comes to harm in Maple Bay.' },
  { id: 'needs_soft', sys: 'needs', topic: 'well', title: 'The gentle needs',   /* soon: Comfort, Outdoors or Inspiration goes low */
    text: 'Comfort, Outdoors and Inspiration are gentler than the rest. A cosy home, some fresh air, and anything new or beautiful fill them. They only colour your mood.' },
  { id: 'fun_ways', sys: 'skills', topic: 'well', title: 'So many ways to have fun',   /* soon: Fun runs low */
    text: 'A film, a game of chess, music, a swim, a friend, a book on your phone: Fun comes from all over town. Wander picks a few for right now.', go: { app: 'guide', arg: { tool: 'fun' } }, goLabel: 'Fun right now' },
  { id: 'interests', sys: 'skills', topic: 'well', title: 'What do you like?',   /* soon: the second morning, if no interests are picked */
    text: 'Pick a few interests in the Me app. Those things become more fun and quicker to learn, and the ideas the town offers lean your way.', go: { app: 'me', arg: { tab: 'me' } }, goLabel: 'Open Me' },
  { id: 'skills', sys: 'skills', topic: 'well', title: 'Getting better',   /* soon: the first skill level */
    text: 'You are getting better at that. Each level makes it easier and opens something new. The Me app shows what every skill gives you.', go: { app: 'me', arg: { tab: 'skills' } }, goLabel: 'Open Me' },
  { id: 'sk_minis', sys: 'coaches', topic: 'well', title: 'Mini-games',   /* soon: the first mini-game is played */
    text: 'Cooking, fixing things and most other skills come with a short game. Play well and you learn faster. Rather watch? The Me app can set them to play themselves.', go: { app: 'me', arg: { tab: 'me' } }, goLabel: 'Open Me' },
  { id: 'trait_earned', sys: 'traits', topic: 'well', title: 'A habit became a trait',   /* soon: a trait is earned */
    text: 'Do something often enough and it becomes part of you. The new trait sits beside the three you chose; switch it off in the Me app if it does not suit.', go: { app: 'me', arg: { tab: 'traits' } }, goLabel: 'Open Me' },
  { id: 'weather', sys: 'weather', topic: 'well', title: 'Rain',   /* soon: the first wet weather */
    text: 'Walks are slower and soggier in the rain, and indoor places fill up. A cab keeps you dry, and Wander has ideas for a rainy day.', go: { app: 'guide', arg: { tool: 'rainy' } }, goLabel: 'Rainy day ideas' },
  { id: 'passout', sys: 'needs', topic: 'well', title: 'Run right down',   /* soon: a need hits the bottom */
    text: 'No harm done, though you lose a little time. When a need turns red, tap it and the nearest fix is one more tap away.' },
  { id: 'stamp', sys: 'stamps', topic: 'out', title: 'Collecting stamps',   /* soon: the first stamp */
    text: 'Wander keeps a Stamp Book of everything there is to try in Maple Bay. Do a thing once, anywhere, and it is stamped for good.', go: { app: 'guide', arg: { tab: 'stamps' } }, goLabel: 'Open the Stamp Book' },
  /* ---------- going out ---------- */
  { id: 'shows', sys: 'shows', topic: 'out', title: 'You have a ticket',   /* soon: the first ticket is bought */
    text: 'Wait in the lobby. When the doors open, go through and find your seat. My Day has the time, and the arrow leads you to your row.' },
  { id: 'events', sys: 'events', topic: 'out', title: 'A big day in town',   /* soon: a city event opens */
    text: 'Today is one of the six big days of the year. A street is closed for stalls, games and a parade. Add it to your day and the arrow takes you there.', go: { sys: 'events' }, goLabel: 'Take me there' },
  { id: 'sight', sys: 'sights', topic: 'out', title: 'One of the big places',   /* now: the first showpiece is entered */
    text: 'Get a ticket at the desk, then wander. Every room has something to do, and the place changes through the day. Its page in Wander lists what not to miss.' },
  { id: 'mall', sys: 'clothesshop', topic: 'out', title: 'The Galleria',   /* now: the mall is entered */
    text: 'Clothes, furniture, a salon and a food court under one roof. A good place to be when it rains.' },
  { id: 'skydeck', sys: 'sights', topic: 'out', title: 'The SkyDeck',   /* now: the SkyDeck is entered */
    text: 'The lift goes to the top of the tower for the best view in town. Go at sunset if you can.' },
  /* ---------- phone ---------- */
  { id: 'phonefun', sys: 'phonefun', topic: 'phone', title: 'Fun in your pocket',   /* soon: the first sitting with Pages, Reel or PlayBox */
    text: 'Reading, watching and playing on your phone all fill Fun, and more so on a ride or in a queue. A little goes a long way, so mix it with getting out.' },
  { id: 'store', sys: 'appy', topic: 'phone', title: 'A new app is out',   /* soon: an app comes out on Appy after the first day */
    text: 'New apps are free on Appy. Install the ones you fancy; more appear as the days pass and as you try new things.', go: { app: 'store' }, goLabel: 'Open Appy' },
];
export const WINDOW_BY_ID = Object.fromEntries(WINDOWS.map(w => [w.id, w]));
