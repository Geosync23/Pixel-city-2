// traits.js — character TRAITS for Maple Bay. Pure design data (logic: src/sim/traits.js; UI: src/ui/phone_me.js).
//
// A character has 3 PICKED traits (chosen at creation, or through the friendly one-time prompt on an older save; changeable
// once a week in the Me app) plus any number of EARNED traits that grow out of habits (see HABITS below).
//
// TRAITS[] fields (every effect is small, legible and mostly positive; `down` is the single gentle downside, if any)
//   id, name, family (see FAMILIES), icon (any icon id), blurb (one line of character)
//   plus[]        short effect lines shown in the UI (they describe exactly what the fields below do)
//   down          one short downside line, or absent
//   xp            { '<skillId>' | 'fam:<interest family>' | '*': multiplier }   skill xp multipliers (see skills_extra.js FAMILIES)
//   xpHours       { from, to, mult }            xp multiplier for every skill inside a time-of-day window (to may wrap past midnight)
//   decay         [{ need, mult, when? }]       multiplier on a need's awake decay. when: 'home' | 'out' | 'night' (21-04) | 'morning' (05-11) | absent = always
//   sleep         multiplier on energy gained while asleep
//   acts          [{ ids: [activity ids] | tags: [fixture tags], moodlet?, fun?, social? }]   after finishing one of these (5+ min): a moodlet and/or a need bonus
//   mood          moodlet id that is on while `moodWhen` holds: 'always' | 'home' | 'out' | 'morning' | 'night' | 'poor' (< $60) | 'clean' (hygiene >= 70)
//   cash          fraction of every purchase quietly saved (shown once a day as "saved $x")
//   treat         { over: dollars, moodlet }    a single purchase at or above `over` gives the moodlet
//   tips / sell   multipliers on tips (busking, open mic) / on what you get for your own work (paintings, photos, fish)
//   discover      { moodlet, fun }              on discovering a new place
//   luck          added to the chance of a "lucky find" (see traits.js) per game hour outdoors
//   mini          multiplier on the bonus xp of every mini-game you actually play
//   emote         idle flourish animation ('cheer' | 'wave' | 'dance' | 'phone' | 'read' | 'lift')
//   thoughts[]    thought bubbles (first person, short)
//   said[]        things passers-by say about / to you (short, kind)
//   earned        true = cannot be picked; it comes from a HABIT

export const TRAIT_PICKS = 3;            // how many traits a character picks
export const TRAIT_CHANGE_DAYS = 7;      // picked traits can be changed again after this many game days

export const FAMILIES = [
  { id: 'social', name: 'Social', icon: 'need.social', color: '#e0527a' },
  { id: 'mind', name: 'Mind', icon: 'skill.logic', color: '#3b5bdb' },
  { id: 'body', name: 'Body', icon: 'need.fitness', color: '#d9534a' },
  { id: 'taste', name: 'Taste', icon: 'need.hunger', color: '#e0703a' },
  { id: 'outlook', name: 'Outlook', icon: 'weather.sun', color: '#c79a2a' },
  { id: 'quirk', name: 'Quirks', icon: 'ui.sparkle', color: '#7a55c8' },
  { id: 'earned', name: 'Earned', icon: 'ui.trophy', color: '#2f9e8f' },
];

const T = (id, name, family, icon, blurb, o) => Object.assign({ id, name, family, icon, blurb, plus: [], thoughts: [], said: [] }, o);

export const TRAITS = [
  // ------------------------------------------------------------------ social
  T('outgoing', 'Outgoing', 'social', 'need.social', 'Talks to the bus driver. And the bus.', {
    plus: ['Charisma and Comedy grow 20% faster', '"Life of the Party" after dancing, the bar or an open mic'],
    down: 'Social need drops 15% faster',
    xp: { charisma: 1.2, comedy: 1.2 }, decay: [{ need: 'social', mult: 1.15 }],
    acts: [{ ids: ['dance', 'bar_hang_out', 'open_mic', 'sk_street_comedy', 'sk_busk', 'sk_smalltalk'], moodlet: 'life_of_party' }], emote: 'wave',
    thoughts: ['I should say hi to somebody.', 'Wonder what everyone is up to tonight.', 'That person looks like they have a story.'],
    said: ['Oh, it is you! Everyone knows you.', 'You again! Hello, hello.'] }),
  T('shy', 'Shy', 'social', 'mood.okay', 'Rehearses the coffee order twice.', {
    plus: ['Social need drops 35% slower', 'Writing, Painting and Photography grow 10% faster'],
    down: 'Charisma grows 10% slower',
    xp: { writing: 1.1, painting: 1.1, photography: 1.1, charisma: 0.9 }, decay: [{ need: 'social', mult: 0.65 }], emote: 'phone',
    thoughts: ['Nobody is looking. Good.', 'I will just... stand over here.', 'That went fine. I think that went fine.'],
    said: ['Take your time, no rush.', 'Quiet ones notice everything.'] }),
  T('charmer', 'Charmer', 'social', 'skill.charisma', 'Gets the last pastry. Somehow always.', {
    plus: ['Charisma grows 25% faster', 'Tips are 15% bigger'],
    xp: { charisma: 1.25 }, tips: 1.15, emote: 'wave',
    thoughts: ['A smile costs nothing.', 'I bet I could get a free refill.', 'Eye contact. Easy does it.'],
    said: ['Well, are you not a ray of sunshine.', 'You could sell sand at the beach, you.'] }),
  T('good_listener', 'Good Listener', 'social', 'ui.heart', 'People tell them things on trains.', {
    plus: ['A good chat on a bench fills more Social (+6)', '"Connected" lingers after small talk'],
    acts: [{ ids: ['sk_smalltalk', 'people_watch', 'phone_call'], moodlet: 'heard', social: 6 }], xp: { charisma: 1.1 },
    thoughts: ['Everyone has something on their mind.', 'I wonder how that story ended.', 'Mm-hm. Go on.'],
    said: ['You are easy to talk to, you know that?', 'Thanks for listening the other day.'] }),
  T('joker', 'Joker', 'social', 'mood.great', 'Has a pun for this. Has a pun for everything.', {
    plus: ['Comedy grows 30% faster', 'A laugh keeps Fun from dropping: Fun need 10% slower'],
    xp: { comedy: 1.3 }, decay: [{ need: 'fun', mult: 0.9 }], emote: 'cheer',
    thoughts: ['Why did the gull cross the pier? ...workshop it.', 'That would be funnier with a pause.', 'Heh. Good one, me.'],
    said: ['Do the one about the ferry again!', 'You crack me up.'] }),

  // ------------------------------------------------------------------ mind
  T('bookworm', 'Bookworm', 'mind', 'ui.book', 'Owns a bookmark collection. Uses receipts.', {
    plus: ['Skill books and study give 25% more xp', '"Lost in a Book" after reading'],
    xp: { 'src:book': 1.25, logic: 1.1, writing: 1.1 },
    acts: [{ ids: ['read_novel', 'read_skill_book', 'library_read', 'browse_books'], moodlet: 'lost_in_book' }], emote: 'read',
    thoughts: ['One more chapter.', 'I wonder if the library has the sequel.', 'This would make a good first line.'],
    said: ['Is that a new book? What is it about?', 'The bookshop was asking after you.'] }),
  T('curious', 'Curious', 'mind', 'ui.info', 'Reads every plaque. Every single one.', {
    plus: ['The first practice of the day in any skill gives double the usual bonus', 'New places: +6 Fun and "Wanderlust"'],
    firstMult: 2, discover: { moodlet: 'wanderlust', fun: 6 },
    thoughts: ['What is down that street?', 'How does that actually work?', 'I have never tried that. Yet.'],
    said: ['You ask the best questions.', 'Go on then, have a look. Everybody does.'] }),
  T('daydreamer', 'Daydreamer', 'mind', 'weather.cloud', 'Missed the stop. Twice. Worth it.', {
    plus: ['Creativity, Painting, Writing and Music grow 15% faster', 'Sitting on a bench is extra restful (+5 Fun)'],
    down: 'Logic grows 10% slower',
    xp: { creativity: 1.15, painting: 1.15, writing: 1.15, music: 1.15, logic: 0.9 },
    acts: [{ ids: ['people_watch', 'enjoy_view', 'stargaze', 'lounge'], fun: 5 }],
    thoughts: ['That cloud looks like a ferry.', 'What if the lighthouse could walk?', 'Sorry, what? I was somewhere else.'],
    said: ['Penny for your thoughts?', 'Earth to you! Hello!'] }),
  T('perfectionist', 'Perfectionist', 'mind', 'ui.star', 'The picture frame is level. Now it is level.', {
    plus: ['Mini-games you play well pay out 20% more bonus xp', 'What you make sells for 10% more'],
    down: 'A poor result stings a little ("Not My Best")',
    mini: 1.2, sell: 1.1, flop: 'not_my_best',
    thoughts: ['It could be a little straighter.', 'Again. From the top.', 'Nearly. Nearly!'],
    said: ['Did you measure that? Of course you did.', 'Looks perfect to me. No? No.'] }),
  T('tinkerer', 'Tinkerer', 'mind', 'skill.handiness', 'Has taken the toaster apart. It is fine. Mostly.', {
    plus: ['Handiness and Tech grow 20% faster', 'Tune-ups last 2 days longer'],
    xp: { handiness: 1.2, tech: 1.2 }, tuneDays: 2,
    thoughts: ['I could fix that.', 'What happens if I press this?', 'Left over screws mean I improved it.'],
    said: ['Can you look at my bike some time?', 'You fixed the hall light! Hero.'] }),

  // ------------------------------------------------------------------ body
  T('athletic', 'Athletic', 'body', 'need.fitness', 'Takes the stairs. Two at a time.', {
    plus: ['Fitness, Swimming and Dancing grow 20% faster', 'Energy drops 8% slower'],
    xp: { fitness: 1.2, swimming: 1.2, dancing: 1.2 }, decay: [{ need: 'energy', mult: 0.92 }], emote: 'lift',
    thoughts: ['I could run there.', 'Legs feel good today.', 'One more lap would be nice.'],
    said: ['Slow down, some of us are walking!', 'Training for something?'] }),
  T('night_owl', 'Night Owl', 'body', 'weather.moon', 'Does their best thinking at 1 a.m.', {
    plus: ['All skills grow 15% faster between 21:00 and 03:00', 'Energy drops 20% slower at night'],
    down: 'Mornings are slow: energy drops 10% faster before 11:00',
    xpHours: { from: 21, to: 27, mult: 1.15 }, decay: [{ need: 'energy', mult: 0.8, when: 'night' }, { need: 'energy', mult: 1.1, when: 'morning' }],
    mood: 'night_spark', moodWhen: 'night',
    thoughts: ['The city is better with the lights on.', 'Who decided mornings were a thing?', 'Finally. Quiet.'],
    said: ['Still up? Me too.', 'You keep lighthouse hours.'] }),
  T('early_bird', 'Early Bird', 'body', 'weather.sun', 'Has seen the bakery open. Often.', {
    plus: ['All skills grow 15% faster between 05:00 and 10:00', '"Bright Morning" while up before 9'],
    down: 'Energy drops 10% faster after 21:00',
    xpHours: { from: 5, to: 10, mult: 1.15 }, decay: [{ need: 'energy', mult: 1.1, when: 'night' }],
    mood: 'bright_morning', moodWhen: 'morning',
    thoughts: ['Best light of the day.', 'The bread is still warm at this hour.', 'Up before the gulls again.'],
    said: ['Morning! You are always first.', 'Saw you out at dawn. Madness.'] }),
  T('heavy_sleeper', 'Heavy Sleeper', 'body', 'need.energy', 'Slept through the fireworks. All of them.', {
    plus: ['Sleep restores 15% more Energy', 'Naps count double for "Power Nap"'],
    sleep: 1.15,
    thoughts: ['Five more minutes.', 'That bed has my name on it.', 'I could sleep on this bench, honestly.'],
    said: ['You look well rested. Annoyingly so.', 'Did you even hear the storm last night?'] }),
  T('iron_stomach', 'Iron Stomach', 'body', 'need.hunger', 'Extra hot. No, hotter.', {
    plus: ['Hunger drops 12% slower', 'Street food is a treat: +4 Fun after eating out'],
    decay: [{ need: 'hunger', mult: 0.88 }], eatOut: { fun: 4 },
    thoughts: ['I could eat.', 'Is that the taco cart I smell?', 'Second lunch is a real thing.'],
    said: ['You finished the whole thing? Respect.', 'The hot sauce guy talks about you.'] }),
  T('water_baby', 'Water Baby', 'body', 'weather.rain', 'First in the pool. Last out. Pruney.', {
    plus: ['Swimming and Fishing grow 25% faster', 'Rain does not bother you: Fun drops 15% slower outdoors'],
    xp: { swimming: 1.25, fishing: 1.25 }, decay: [{ need: 'fun', mult: 0.85, when: 'out' }],
    thoughts: ['I wonder how cold the bay is today.', 'Low tide smells like home.', 'A little rain never hurt.'],
    said: ['You are half fish, I swear.', 'Saw you down by the water again.'] }),

  // ------------------------------------------------------------------ taste
  T('foodie', 'Foodie', 'taste', 'skill.cooking', 'Photographs dinner. Then eats it cold. Happy.', {
    plus: ['Cooking and Mixology grow 20% faster', '"Savoured" after any home-cooked or restaurant meal'],
    xp: { cooking: 1.2, mixology: 1.2 }, savour: 'savoured',
    thoughts: ['What is that smell? I need to know.', 'That needed more lemon.', 'Dinner plans. Important dinner plans.'],
    said: ['Where should I eat tonight? You always know.', 'Is it true about the new ramen place?'] }),
  T('neat_freak', 'Neat Freak', 'taste', 'need.hygiene', 'Alphabetised the spice rack. By cuisine.', {
    plus: ['"Spotless" (+4 mood) whenever Hygiene is 70 or more', 'Style grows 15% faster'],
    down: 'Hygiene need drops 10% faster',
    xp: { style: 1.15 }, mood: 'spotless', moodWhen: 'clean', decay: [{ need: 'hygiene', mult: 1.1 }],
    thoughts: ['Is that a smudge?', 'A place for everything.', 'I should wash my hands.'],
    said: ['You always look so put together.', 'Not a hair out of place. How?'] }),
  T('slob', 'Easygoing Slob', 'taste', 'mood.good', 'The floor is also a shelf.', {
    plus: ['Hygiene need drops 30% slower', 'Lounging on the sofa is extra fun (+6)'],
    decay: [{ need: 'hygiene', mult: 0.7 }], acts: [{ ids: ['lounge', 'watch_tv', 'nap_sofa'], fun: 6 }],
    thoughts: ['It is not a mess, it is a system.', 'I showered. Recently. Ish.', 'This shirt passes the sniff test.'],
    said: ['Love the relaxed look.', 'Is that... yesterday\'s shirt? Bold.'] }),
  T('green_thumb', 'Green Thumb', 'taste', 'skill.gardening', 'Talks to the ferns. The ferns thrive.', {
    plus: ['Gardening grows 25% faster', 'Garden beds ripen a stage faster', '"Green Peace" after tending plants'],
    xp: { gardening: 1.25 }, grow: 1, acts: [{ ids: ['garden', 'tend_plants', 'smell_flowers'], moodlet: 'green_peace' }],
    thoughts: ['That planter needs water.', 'Tomatoes should be in by now.', 'Everything is greener after rain.'],
    said: ['My basil is dying. Help.', 'Your windowsill is the talk of the block.'] }),
  T('animal_lover', 'Animal Lover', 'taste', 'ui.heart', 'Knows every dog on the block by name.', {
    plus: ['Petting cats, feeding ducks and meeting animals: +8 Fun and "Furry Friend"'],
    acts: [{ ids: ['pet_cat', 'feed_ducks', 'meet_animals', 'watch_fish'], moodlet: 'furry_friend', fun: 8 }],
    thoughts: ['Was that a dog? I heard a dog.', 'The ducks will be wondering where I am.', 'Hello, pigeon. Looking sharp.'],
    said: ['The cat on Lantern Row only likes you.', 'My dog pulled the whole way to say hi to you.'] }),
  T('music_lover', 'Music Lover', 'taste', 'skill.music', 'Has a song for this street. And the next one.', {
    plus: ['Music and Dancing grow 20% faster', 'Listening to music or a busker: +6 Fun'],
    xp: { music: 1.2, dancing: 1.2 }, acts: [{ ids: ['listen_music', 'listen_busker', 'watch_live_music', 'play_jukebox', 'listen_station', 'dig_crates'], fun: 6 }], emote: 'dance',
    thoughts: ['This needs a soundtrack.', 'What was that song? Da da dum...', 'I can hear a bass line somewhere.'],
    said: ['What are you humming? I know that one.', 'You should come to the Friday gig.'] }),
  T('fashionista', 'Fashionista', 'taste', 'skill.style', 'Dresses for the day they want.', {
    plus: ['Style grows 25% faster', '"Looking Sharp" lasts twice as long'],
    xp: { style: 1.25 }, sharp: 2,
    thoughts: ['Those shoes with that coat? Brave.', 'I need a mirror.', 'Autumn colours. Finally.'],
    said: ['Where did you get that? I need one.', 'You make the pavement a catwalk.'] }),

  // ------------------------------------------------------------------ outlook
  T('optimist', 'Optimist', 'outlook', 'mood.great', 'The bus is late. More time to enjoy the bench.', {
    plus: ['"Sunny Outlook": +3 mood, always'],
    mood: 'sunny_outlook', moodWhen: 'always', emote: 'cheer',
    thoughts: ['Today is going to be a good one.', 'It will work out. It usually does.', 'Look at that sky.'],
    said: ['You are in a good mood. Again!', 'I needed that smile today, thanks.'] }),
  T('worrier', 'Worrier', 'outlook', 'mood.low', 'Did lock the door. Went back to check anyway.', {
    plus: ['Double-checks everything: Logic, Tech and Chess grow 15% faster', 'Always has a little saved: 2% of every purchase'],
    down: '"On Edge" (-2 mood) while you have less than $60',
    xp: { logic: 1.15, tech: 1.15, chess: 1.15 }, cash: 0.02, mood: 'on_edge', moodWhen: 'poor',
    thoughts: ['Did I lock the door?', 'What time is the last train again?', 'Better to be early.'],
    said: ['It will be fine. Really.', 'You brought an umbrella. Of course you did.'] }),
  T('thrifty', 'Thrifty', 'outlook', 'ui.coin', 'Knows what day the bakery marks things down.', {
    plus: ['Quietly saves 5% of everything you spend', 'Bartering grows 20% faster'],
    xp: { bartering: 1.2 }, cash: 0.05,
    thoughts: ['I can get that cheaper on Tuesday.', 'Is there a coupon for this?', 'A dollar saved is a pastry earned.'],
    said: ['You always find the bargains.', 'How much did you pay? No!'] }),
  T('big_spender', 'Big Spender', 'outlook', 'ui.bag', 'It was on sale. That is basically earning money.', {
    plus: ['"Treat Yourself" (+5 mood, 4 h) after any purchase of $30 or more', 'Sells own work for 10% more: knows what things are worth'],
    treat: { over: 30, moodlet: 'treat_yourself' }, sell: 1.1,
    thoughts: ['I deserve something nice.', 'It would look good in my place.', 'Window shopping is still shopping.'],
    said: ['New bags again? Good for you.', 'The shops light up when you walk in.'] }),
  T('homebody', 'Homebody', 'outlook', 'ui.home', 'Best seat in the city: their own sofa.', {
    plus: ['"Nest" (+3 mood) while at home', 'Fun and Social drop 25% slower at home'],
    mood: 'nest', moodWhen: 'home', decay: [{ need: 'fun', mult: 0.75, when: 'home' }, { need: 'social', mult: 0.75, when: 'home' }],
    thoughts: ['I wonder what my sofa is doing.', 'Could have stayed in. Would have been nice.', 'Home soon. Slippers soon.'],
    said: ['We never see you out! Come round.', 'Your place must be cosy.'] }),
  T('wanderer', 'Wanderer', 'outlook', 'ui.pin', 'Took the long way. On purpose.', {
    plus: ['Fun drops 20% slower outdoors', 'New places: +8 Fun and "Wanderlust"', 'Photography grows 15% faster'],
    xp: { photography: 1.15 }, decay: [{ need: 'fun', mult: 0.8, when: 'out' }], discover: { moodlet: 'wanderlust', fun: 8 },
    thoughts: ['Never been down this one.', 'What is over the hill?', 'The scenic route is the route.'],
    said: ['You get everywhere, you do.', 'Seen you in three districts today.'] }),
  T('ambitious', 'Ambitious', 'outlook', 'ui.trophy', 'Has a five-year plan. Laminated.', {
    plus: ['Every level-up gives "On the Rise" (+5 mood, 6 h)', 'Lessons with a coach teach 20% more'],
    levelUp: 'on_the_rise', coach: 1.2,
    thoughts: ['What is the next step?', 'I could be better at this by Friday.', 'Onwards.'],
    said: ['Going places, that one.', 'Do you ever take a day off?'] }),
  T('laid_back', 'Laid-Back', 'outlook', 'mood.good', 'It will get done. Probably.', {
    plus: ['A poor mini-game result never hurts: you always get at least the auto result', 'Energy drops 6% slower'],
    floor: 1, decay: [{ need: 'energy', mult: 0.94 }],
    thoughts: ['No rush.', 'It is what it is.', 'There is always tomorrow.'],
    said: ['Nothing rattles you, does it?', 'Wish I had your calm.'] }),

  // ------------------------------------------------------------------ quirks
  T('lucky', 'Lucky', 'quirk', 'ui.sparkle', 'Finds a dollar. Every. Single. Week.', {
    plus: ['Finds small change in the street now and then', 'Fishing: bigger fish bite a little more often'],
    luck: 0.05, fish: 1.15,
    thoughts: ['I have a good feeling about today.', 'Heads. Called it.', 'Something good is round the corner.'],
    said: ['You won the raffle AGAIN?', 'Rub some of that luck on me.'] }),
  T('gamer', 'Gamer at Heart', 'quirk', 'skill.gaming', 'Just one more level. (It was not one more level.)', {
    plus: ['Gaming grows 25% faster', 'Games are 25% more fun'],
    xp: { gaming: 1.25 }, acts: [{ ids: ['play_games', 'computer_games', 'play_arcade', 'sk_arcade_mall'], fun: 6 }],
    thoughts: ['I wonder if my high score still stands.', 'That jump was pixel perfect.', 'Life needs a pause button.'],
    said: ['Is it true you beat the arcade record?', 'Player one has entered the street.'] }),
  T('competitive', 'Competitive', 'quirk', 'ui.trophy', 'It is not a race. (It is a race.)', {
    plus: ['Beating a personal best gives "New Record!" (+6 mood, 5 h)', 'Chess and Fitness grow 10% faster'],
    xp: { chess: 1.1, fitness: 1.1 }, record: 'new_record',
    thoughts: ['I can beat that.', 'Second place is first loser. Kidding. Mostly.', 'Rematch.'],
    said: ['Fancy a rematch?', 'You never let anyone win, do you?'] }),
  T('stage_struck', 'Stage-Struck', 'quirk', 'ui.star', 'Bows when the microwave beeps.', {
    plus: ['Tips are 20% bigger', '"Stage Glow" after any performance in front of people'],
    tips: 1.2, acts: [{ ids: ['sk_busk', 'sk_street_comedy', 'open_mic'], moodlet: 'stage_glow' }], emote: 'cheer',
    thoughts: ['Is anyone watching? I hope so.', 'And the crowd goes wild.', 'I should have a stage name.'],
    said: ['Encore! Encore!', 'I saw you perform. You were great.'] }),
  T('collector', 'Collector', 'quirk', 'ui.bag', 'Needs one more to finish the set. Always.', {
    plus: ['Every new stamp, photo or finished work gives +4 Fun', 'Records and albums in the Me app show a completion count'],
    collect: 4,
    thoughts: ['Only three more to go.', 'That would complete the set.', 'Ooh. I do not have that one.'],
    said: ['Still filling that stamp book?', 'You kept the ticket stubs? All of them?'] }),

  // ------------------------------------------------------------------ earned (see HABITS)
  T('morning_person', 'Morning Person', 'earned', 'weather.sun', 'Earned by waking early, again and again.', {
    earned: true, plus: ['Energy drops 10% slower before 11:00'], decay: [{ need: 'energy', mult: 0.9, when: 'morning' }],
    thoughts: ['Mornings are mine now.'], said: ['You are up with the bakers these days.'] }),
  T('regular', 'Regular', 'earned', 'ui.heart', 'Earned by coming back to the same place.', {
    earned: true, plus: ['"The Usual" (+4 mood, 3 h) when you walk into your regular place', '5% off there, quietly'], regular: { moodlet: 'the_usual', cash: 0.05 },
    thoughts: ['They know my order.'], said: ['The usual? Thought so.'] }),
  T('gym_rat', 'Gym Rat', 'earned', 'skill.fitness', 'Earned by working out ten times.', {
    earned: true, plus: ['Fitness grows 10% faster', '"Pumped" lasts longer'], xp: { fitness: 1.1 }, acts: [{ ids: ['gym_weights', 'gym_treadmill', 'gym_yoga_class', 'exercise_home', 'jog', 'sk_hoops'], moodlet: 'pumped' }],
    thoughts: ['Leg day. Every day is leg day.'], said: ['Looking strong lately!'] }),
  T('local', 'True Local', 'earned', 'ui.pin', 'Earned by discovering forty places.', {
    earned: true, plus: ['Fun drops 10% slower outdoors', 'Passers-by greet you more often'], decay: [{ need: 'fun', mult: 0.9, when: 'out' }], greet: 2,
    thoughts: ['I know a shortcut.'], said: ['Ask them, they know every corner of this town.'] }),
  T('home_chef', 'Home Chef', 'earned', 'skill.cooking', 'Earned by cooking fifteen meals.', {
    earned: true, plus: ['Cooking grows 10% faster', '"Savoured" after home-cooked meals'], xp: { cooking: 1.1 }, savour: 'savoured',
    thoughts: ['I could make that better at home.'], said: ['Something smelled amazing from your window.'] }),
  T('quick_hands', 'Quick Hands', 'earned', 'ui.sparkle', 'Earned by playing thirty mini-games well.', {
    earned: true, plus: ['Mini-games pay 10% more bonus xp'], mini: 1.1,
    thoughts: ['Fingers feel fast today.'], said: ['How do you do that so quickly?'] }),
  T('night_regular', 'Creature of the Night', 'earned', 'weather.moon', 'Earned by being out after midnight ten times.', {
    earned: true, plus: ['Energy drops 10% slower between 21:00 and 04:00'], decay: [{ need: 'energy', mult: 0.9, when: 'night' }],
    thoughts: ['The night shift suits me.'], said: ['The late crowd all know you now.'] }),
];
export const TRAIT_BY_ID = Object.fromEntries(TRAITS.map(t => [t.id, t]));

// Opposites cannot be picked together.
export const CONFLICTS = [['outgoing', 'shy'], ['night_owl', 'early_bird'], ['neat_freak', 'slob'], ['thrifty', 'big_spender'], ['homebody', 'wanderer'], ['optimist', 'worrier'], ['ambitious', 'laid_back'], ['perfectionist', 'laid_back']];

// HABITS — the simple tracker behind earned traits. Each habit is a counter in G.state.traits.habits; when it reaches `need` the trait is earned
// (a phone notification + a line in the Me app). Counters only go up; an earned trait is kept for good (it can be switched off in the Me app).
//   count: what bumps the counter (implemented in src/sim/traits.js)
export const HABITS = [
  { id: 'early', trait: 'morning_person', need: 5, label: 'Wake up before 07:00', count: 'a sleep that ends between 04:30 and 07:00 (once a day)' },
  { id: 'regular', trait: 'regular', need: 8, label: 'Visit the same place', count: 'entering the same venue (once a day per venue); the place with the most visits becomes "your" place' },
  { id: 'gym', trait: 'gym_rat', need: 10, label: 'Finish a workout', count: 'gym weights / treadmill / yoga, home workout, a jog, shooting hoops' },
  { id: 'places', trait: 'local', need: 40, label: 'Discover places', count: 'place:discover' },
  { id: 'cooked', trait: 'home_chef', need: 15, label: 'Cook a meal', count: 'cooked' },
  { id: 'minis', trait: 'quick_hands', need: 30, label: 'Play a mini-game well (2+ stars)', count: 'minigame:done with 2 or 3 stars, not auto' },
  { id: 'late', trait: 'night_regular', need: 10, label: 'Be out after midnight', count: 'being awake outdoors between 00:00 and 04:00 (once a day)' },
];

// New moodlets used by traits (pushed into data/needs.js MOODLETS by src/data/skills_extra.js at import).
export const TRAIT_MOODLETS = {
  sunny_outlook:  { name: 'Sunny Outlook', desc: 'Glass half full. Trait: Optimist.', mood: 3, workPerf: 1, walkSpeed: 1, minutes: null, source: 'trait' },
  bright_morning: { name: 'Bright Morning', desc: 'Up with the light. Trait: Early Bird.', mood: 4, workPerf: 2, walkSpeed: 1.03, minutes: null, source: 'trait' },
  night_spark:    { name: 'Night Spark', desc: 'The small hours are yours. Trait: Night Owl.', mood: 3, workPerf: 1, walkSpeed: 1, minutes: null, source: 'trait' },
  spotless:       { name: 'Spotless', desc: 'Clean and in order. Trait: Neat Freak.', mood: 4, workPerf: 1, walkSpeed: 1, minutes: null, source: 'trait' },
  nest:           { name: 'Nest', desc: 'Nowhere better than home. Trait: Homebody.', mood: 3, workPerf: 0, walkSpeed: 1, minutes: null, source: 'trait' },
  on_edge:        { name: 'On Edge', desc: 'The account is looking thin. Trait: Worrier.', mood: -2, workPerf: 0, walkSpeed: 1, minutes: null, source: 'trait' },
  life_of_party:  { name: 'Life of the Party', desc: 'You were on form tonight.', mood: 5, workPerf: 0, walkSpeed: 1, minutes: 240, source: 'trait' },
  heard:          { name: 'Good Talk', desc: 'A proper conversation.', mood: 4, workPerf: 0, walkSpeed: 1, minutes: 240, source: 'trait' },
  lost_in_book:   { name: 'Lost in a Book', desc: 'Still half inside the story.', mood: 4, workPerf: 0, walkSpeed: 1, minutes: 240, source: 'trait' },
  wanderlust:     { name: 'Wanderlust', desc: 'Somewhere new. What else is out there?', mood: 5, workPerf: 0, walkSpeed: 1.05, minutes: 180, source: 'trait' },
  savoured:       { name: 'Savoured', desc: 'You tasted every bite.', mood: 4, workPerf: 0, walkSpeed: 1, minutes: 240, source: 'trait' },
  green_peace:    { name: 'Green Peace', desc: 'Soil under the fingernails, calm in the head.', mood: 4, workPerf: 1, walkSpeed: 1, minutes: 240, source: 'trait' },
  furry_friend:   { name: 'Furry Friend', desc: 'A small animal approved of you.', mood: 5, workPerf: 0, walkSpeed: 1, minutes: 180, source: 'trait' },
  treat_yourself: { name: 'Treat Yourself', desc: 'A little luxury.', mood: 5, workPerf: 0, walkSpeed: 1, minutes: 240, source: 'trait' },
  on_the_rise:    { name: 'On the Rise', desc: 'You levelled up. Onwards!', mood: 5, workPerf: 2, walkSpeed: 1, minutes: 360, source: 'trait' },
  new_record:     { name: 'New Record!', desc: 'A personal best. Beat that.', mood: 6, workPerf: 1, walkSpeed: 1, minutes: 300, source: 'trait' },
  not_my_best:    { name: 'Not My Best', desc: 'It could have gone better. Next time.', mood: -2, workPerf: 0, walkSpeed: 1, minutes: 60, source: 'trait' },
  the_usual:      { name: 'The Usual', desc: 'They know your order here.', mood: 4, workPerf: 0, walkSpeed: 1, minutes: 180, source: 'trait' },
  lucky_find:     { name: 'Lucky Find', desc: 'Money on the pavement. Yours now.', mood: 3, workPerf: 0, walkSpeed: 1, minutes: 120, source: 'trait' },
};
