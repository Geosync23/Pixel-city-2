// skills_extra.js — CHARACTER DEPTH data: 15 more skills (21 in all), what every level gives, interests, the activities that carry
// a mini-game, coaches, skill books for the new skills, moodlets and guide / tips copy. Logic: src/sim/skillplay.js, src/sim/traits.js.
//
// IMPORT-TIME REGISTRATION (deliberate): this module is first imported by src/art/icons/skills_extra.js, i.e. while the art index loads and
// BEFORE src/sim/*.js evaluate, so the tables below are part of the shared data by the time the activity runner, the Wellness app, the guide
// and the shops build their own lookups. Nothing existing is changed or removed: rows are only appended.
//   data/needs.js       SKILLS += NEW_SKILLS (ids kept, existing six untouched),  MOODLETS += TRAIT_MOODLETS + SKILL_MOODLETS
//   data/activities.js  ACTIVITIES / ACTIVITY_BY_ID += NEW_ACTIVITIES,  FUNCTION_TAGS.world += 'chess', 'hoop', 'beach', 'market_trade'
//   data/items.js       BOOKS / ITEMS / ITEM_BY_ID += NEW_BOOKS (two skill books per new skill family, sold at the bookstore)
import { SKILLS, MOODLETS } from './needs.js';
import { ACTIVITIES, ACTIVITY_BY_ID, FUNCTION_TAGS } from './activities.js';
import { ITEMS, ITEM_BY_ID, BOOKS } from './items.js';
import { TRAIT_MOODLETS } from './traits.js';

/* ------------------------------------------------------------------ skills */
export const NEW_SKILLS = [
  { id: 'music', name: 'Music', icon: 'eighth note, teal', desc: 'Instruments and songs. Busk for tips once you know one.', trainedBy: ['practice_instrument', 'sk_busk', 'coach'] },
  { id: 'painting', name: 'Painting', icon: 'brush, red tip', desc: 'Easel work. Better pictures, finished sooner, sold for more.', trainedBy: ['paint', 'sketch_outdoors', 'coach'] },
  { id: 'writing', name: 'Writing', icon: 'fountain pen', desc: 'Poems, stories and one day a novel. Finished pieces pay.', trainedBy: ['computer_write'] },
  { id: 'photography', name: 'Photography', icon: 'camera', desc: 'Sharp photos for your album; sell prints at the market.', trainedBy: ['sk_photo', 'sk_snap', 'coach'] },
  { id: 'gardening', name: 'Gardening', icon: 'sprout', desc: 'Weeding and growing. Bigger harvests from the garden beds.', trainedBy: ['garden', 'tend_plants', 'coach'] },
  { id: 'dancing', name: 'Dancing', icon: 'dancer', desc: 'Moves for the club floor and the living room.', trainedBy: ['dance', 'sk_dance_home'] },
  { id: 'swimming', name: 'Swimming', icon: 'wave', desc: 'Lengths at the Natatorium and dips in the bay.', trainedBy: ['sk_bay_swim', 'natatorium'] },
  { id: 'fishing', name: 'Fishing', icon: 'fish on a hook', desc: 'Land bigger fish, more often. Cook them or sell them.', trainedBy: ['fish_pier', 'coach'] },
  { id: 'gaming', name: 'Gaming', icon: 'gamepad', desc: 'Arcade cabinets, consoles and computer games. High scores.', trainedBy: ['play_games', 'computer_games', 'play_arcade'] },
  { id: 'chess', name: 'Chess', icon: 'rook', desc: 'Tactics on the park boards and online. A rating to grow.', trainedBy: ['sk_chess_park', 'sk_chess_online', 'coach'] },
  { id: 'mixology', name: 'Mixology', icon: 'shaker', desc: 'Pour and mix drinks at home. Better drinks, new recipes.', trainedBy: ['sk_mix'] },
  { id: 'bartering', name: 'Bartering', icon: 'coins and handshake', desc: 'Haggle at the market: sell your work for more, spend a little less.', trainedBy: ['sk_sell', 'shopping at stalls'] },
  { id: 'style', name: 'Style', icon: 'hanger', desc: 'Put looks together. "Looking Sharp" lifts your mood.', trainedBy: ['sk_style', 'try_on'] },
  { id: 'tech', name: 'Tech', icon: 'code brackets', desc: 'Build small apps on a computer. Shipped apps pay out.', trainedBy: ['sk_code', 'sk_code_lib'] },
  { id: 'comedy', name: 'Comedy', icon: 'laughing mask', desc: 'Timing is everything. Street sets and the open mic.', trainedBy: ['sk_street_comedy', 'open_mic'] },
];

// Interest families: the player marks 3-5. Activities whose skill is in a marked family give more Fun (INTEREST.fun) and a little more xp.
export const FAMILIES = [
  { id: 'food', name: 'Food & Drink', icon: 'skill.cooking', skills: ['cooking', 'mixology'] },
  { id: 'sport', name: 'Sport', icon: 'skill.fitness', skills: ['fitness', 'swimming'] },
  { id: 'music', name: 'Music & Dance', icon: 'skill.music', skills: ['music', 'dancing'] },
  { id: 'art', name: 'Art', icon: 'skill.painting', skills: ['painting', 'creativity', 'photography'] },
  { id: 'words', name: 'Words & Stage', icon: 'skill.writing', skills: ['writing', 'comedy', 'charisma'] },
  { id: 'mind', name: 'Puzzles', icon: 'skill.chess', skills: ['logic', 'chess'] },
  { id: 'games', name: 'Gaming', icon: 'skill.gaming', skills: ['gaming'] },
  { id: 'nature', name: 'Nature', icon: 'skill.gardening', skills: ['gardening', 'fishing'] },
  { id: 'making', name: 'Making & Tech', icon: 'skill.handiness', skills: ['handiness', 'tech'] },
  { id: 'fashion', name: 'Fashion & Deals', icon: 'skill.style', skills: ['style', 'bartering'] },
];
export const FAMILY_OF = {}; for (const f of FAMILIES) for (const s of f.skills) FAMILY_OF[s] = f.id;
export const INTEREST = { min: 3, max: 5, fun: 0.35, xp: 1.1 };   // +35% of the Fun an activity gave, +10% xp

// Tuning (src/sim/skillplay.js)
export const TUNE = {
  firstPractice: 1.5,      // xp multiplier on the first xp of a game day in each skill ("daily first-practice bonus": covers that whole first session, 30 game minutes)
  firstMinutes: 30,
  playBonus: 0.6,          // playing a mini-game: bonus xp = base xp of the session * score * this (auto = no bonus, never a penalty)
  autoScore: 0.5,          // the baseline result an auto / skipped game counts as
  greatAt: 0.85, goodAt: 0.55,   // 3 stars / 2 stars
  coachMult: 2.5, coachXp: 60,   // a lesson: this much xp * (1 + score), once a day per coach
  slowSecs: 75,            // while a mini-game is open the activity bar creeps at minutes / slowSecs game minutes per second...
  whoosh: 1.2,             // ...and finishes in this many seconds once the game is over
  tuneDays: 5, tuneBonus: 0.15,  // a tuned-up appliance: +15% fun and xp from using it for 5 days
  cashPerLevel: 0.005,     // Bartering: fraction of every purchase saved per level above 1
  sharpMinutes: 180, sharpPerLevel: 20,
};

// LADDER — the named thing each level adds (level 1..10). The mini-games really use them: the piece you make / the opponent you meet / the
// fish that bites is drawn from the rungs you have reached.   PERK(level) -> the standing numeric benefit as text (implemented in skillplay.js).
const pct = n => Math.round(n) + '%';
export const LADDER = {
  cooking:     { what: 'Kitchen craft', rungs: ['Boil, fry, toast', 'Knife skills', 'Seasoning by taste', 'Two pans at once', 'Sauces from scratch', 'Oven timing', 'Plating', 'Wok hei', 'Your own recipes', 'Chef of the house'], perk: l => `Cooks ${pct(3 * (l - 1))} faster; a perfect "Flip it!" makes an extra serving` },
  fitness:     { what: 'Exercise', rungs: ['Push-ups', 'Squats', 'Lunges', 'Plank', 'Burpees', 'Pull-ups', 'Kettlebell swings', 'Box jumps', 'Muscle-ups', 'The full circuit'], perk: l => `Workouts cost ${pct(3 * (l - 1))} less Energy and build Fitness ${pct(5 * (l - 1))} faster` },
  charisma:    { what: 'Conversation', rungs: ['Hello', 'The weather', 'Asking about their day', 'Remembering names', 'A good story', 'Reading the room', 'The gentle tease', 'Making introductions', 'A toast', 'Everybody\'s friend'], perk: l => `Tips +${pct(5 * (l - 1))}; small talk fills ${pct(4 * (l - 1))} more Social` },
  logic:       { what: 'Study habit', rungs: ['Flash cards', 'Notes in the margin', 'Mind maps', 'Past papers', 'Teaching it back', 'Spaced repetition', 'Speed reading', 'First principles', 'Proofs', 'It just clicks'], perk: l => `Chess and Tech learn ${pct(2 * (l - 1))} faster` },
  creativity:  { what: 'Eye', rungs: ['Doodles', 'Shapes and shade', 'Perspective', 'Colour', 'Composition', 'Light', 'Mood', 'A style of your own', 'Themes', 'A body of work'], perk: l => `Paintings, sketches and prints sell for more with every level (prints and sketches +${pct(10 * (l - 1))})` },
  handiness:   { what: 'Repair', rungs: ['Tighten a screw', 'Change a fuse', 'Unclog a drain', 'Re-hang a door', 'Rewire a plug', 'Fix a dripping tap', 'Service an appliance', 'Patch plaster', 'Tune anything', 'Build it yourself'], perk: l => `Tune-ups last ${5 + Math.floor((l - 1) / 2)} days` },
  music:       { what: 'Song', rungs: ['Three Chords', 'Maple Leaf Waltz', 'Harbor Lights', 'The 14 Bus Blues', 'Lantern Row Rag', 'Gull Point Lullaby', 'Riverside Reel', 'Midnight on the Loop', 'Song for Agnes', 'Maple Bay Suite'], perk: l => `Busking tips +${pct(8 * (l - 1))}; each rung is a song in your repertoire` },
  painting:    { what: 'Subject', rungs: ['Apple on a Table', 'The Fern', 'Window Light', 'Duck Pond', 'Lantern Row at Dusk', 'The Lighthouse', 'Rain on the Viaduct', 'Portrait of a Stranger', 'The Whole Bay', 'Something Entirely New'], perk: l => `Paintings finish ${pct(5 * (l - 1))} sooner and sell for ${pct(8 * (l - 1))} more` },
  writing:     { what: 'Form', rungs: ['A haiku', 'A limerick', 'A poem', 'A blog post', 'A short story', 'A column for the Gazette', 'A one-act play', 'A novella', 'A collection', 'A novel'], perk: l => `Finished pieces pay ${pct(10 * (l - 1))} more` },
  photography: { what: 'Shot', rungs: ['Snapshots', 'Rule of thirds', 'Golden hour', 'Reflections', 'Street candids', 'Long shadows', 'Blue hour', 'Motion blur', 'The decisive moment', 'An exhibition'], perk: l => `Prints sell for ${pct(10 * (l - 1))} more` },
  gardening:   { what: 'Crop', rungs: ['Lettuce', 'Carrots', 'Onions', 'Potatoes', 'Tomatoes', 'Herbs', 'Strawberries', 'Peppers', 'Pumpkins', 'The prize marrow'], perk: l => `Harvests give ${1 + Math.floor(l / 3)} extra item${1 + Math.floor(l / 3) === 1 ? '' : 's'}; beds ripen faster` },
  dancing:     { what: 'Move', rungs: ['Two-step', 'The Shuffle', 'Body roll', 'Spin', 'The Slide', 'Moonwalk', 'The Drop', 'Floor work', 'Freeze', 'A whole routine'], perk: l => `Dancing is ${pct(4 * (l - 1))} more fun` },
  swimming:    { what: 'Stroke', rungs: ['Doggy paddle', 'Float', 'Front crawl', 'Breaststroke', 'Backstroke', 'Tumble turn', 'Bilateral breathing', 'Butterfly', 'Open water', 'Across the bay'], perk: l => `Bay swims build Fitness ${pct(5 * (l - 1))} faster and cost ${pct(3 * (l - 1))} less Energy` },
  fishing:     { what: 'Catch', rungs: ['Sprat', 'Mackerel', 'Perch', 'Sea bass', 'Flounder', 'Pollock', 'Bay trout', 'Cod', 'Conger eel', 'The Old One'], perk: l => `Fish run ${pct(6 * (l - 1))} bigger; a good fight lands a second fish from level 4` },
  gaming:      { what: 'Trick', rungs: ['Button mashing', 'Pattern memory', 'Frame timing', 'Combo chains', 'Speed tech', 'No-hit runs', 'Score routing', 'One-credit clears', 'World-record pace', 'Initials on every board'], perk: l => `Games are ${pct(3 * (l - 1))} more fun; arcade par scores rise with you` },
  chess:       { what: 'Opponent', rungs: ['The pigeons', 'A patient kid', 'Lunch-break players', 'The cafe regulars', 'Club night', 'The park hustler', 'A county player', 'The blitz crowd', 'A visiting master', 'Yourself'], perk: l => `Rating gains +${pct(5 * (l - 1))}; puzzles add harder pieces at levels 2, 3 and 5` },
  mixology:    { what: 'Drink', rungs: ['Garden Spritz', 'Lemon Fizz', 'Blue Heron', 'Harbor Mule', 'Maple Old Fashioned', 'Lantern Sour', 'Foghorn', 'Gull Point Negroni', 'The Viaduct', 'Your signature'], perk: l => `Drinks you mix are ${pct(4 * (l - 1))} better; cocktails from level 3` },
  bartering:   { what: 'Tactic', rungs: ['Asking nicely', 'The pause', 'Bundle deals', 'Walking away', 'Knowing the price', 'The friendly rival', 'End-of-day timing', 'Reading the seller', 'The long game', 'They thank you for it'], perk: l => `Sell for ${pct(4 * (l - 1))} more; quietly saves ${(0.5 * (l - 1)).toFixed(1)}% of everything you spend` },
  style:       { what: 'Look', rungs: ['Clean and simple', 'Colour matching', 'Layers', 'Smart casual', 'Statement piece', 'Vintage finds', 'Monochrome', 'Pattern mixing', 'Tailored', 'A signature look'], perk: l => `"Looking Sharp" lasts ${180 + 20 * (l - 1)} minutes` },
  tech:        { what: 'Project', rungs: ['Hello, Maple Bay', 'A to-do list', 'Tip calculator', 'Bus countdown widget', 'Recipe box', 'Pixel paint', 'Chess clock', 'Weather bot', 'A little game', 'An app people love'], perk: l => `Shipped apps pay ${pct(10 * (l - 1))} more` },
  comedy:      { what: 'Bit', rungs: ['Knock-knock', 'The pun', 'Observations', 'The callback', 'Crowd work', 'The long pause', 'A character', 'The shaggy-dog story', 'A tight five', 'A headline set'], perk: l => `Comedy tips +${pct(8 * (l - 1))}` },
};
// Activities gated by a level (shown as "New: ..." in the level list). Kept in step with NEW_ACTIVITIES.requires below.
export const GATES = { music: { 2: 'Busk at any busking spot', 5: 'Bandstand sets pay 50% more' }, comedy: { 2: 'Street comedy at busking spots' }, mixology: { 3: 'Cocktails (not just mocktails)' }, fishing: { 4: 'A second fish on a good fight' },
  chess: { 2: 'Rooks join the puzzles', 3: 'Bishops join the puzzles', 5: 'Queens join the puzzles', 7: 'Blitz clock: faster puzzles, bigger rating swings' }, painting: { 4: 'Sell at the Old Town Market for a premium' }, tech: { 4: 'Apps earn weekly downloads money' }, writing: { 5: 'Pieces can be sold to the Gazette' },
  gaming: { 3: 'Brick Bay at home', 5: 'Star Ferry at home', 7: 'Snack Snake at home' }, photography: { 3: 'Sell prints at the market' }, bartering: { 2: 'Sell fish and vegetables at the market', 6: 'Buyers start higher' }, swimming: { 2: 'Swim out past the buoy for a distance record' },
  gardening: { 5: 'Tomatoes in your bed' }, style: { 4: 'Looking Sharp also boosts Charisma xp' }, dancing: { 4: 'Four-lane routines' }, charisma: { 3: 'Take the open mic (bar, Wednesdays)' }, handiness: { 3: 'Tune up the TV and computer' }, fitness: { 4: 'Three-point line at the hoop' } };

/* ------------------------------------------------------------------ activities that carry the new skills */
// xp per game hour added to EXISTING activities (granted by skillplay.js when the activity ends, pro-rated; auto or played).
export const XP_MAP = {
  paint: { painting: 36 }, sketch_outdoors: { painting: 16 }, contemplate_art: { painting: 10 }, practice_instrument: { music: 36 }, listen_busker: { music: 6 }, watch_live_music: { music: 8 }, dig_crates: { music: 6 },
  computer_write: { writing: 36 }, test_pens: { writing: 8 }, garden: { gardening: 36 }, tend_plants: { gardening: 60 }, smell_flowers: { gardening: 8 }, dance: { dancing: 34 }, gym_yoga_class: { dancing: 6 },
  fish_pier: { fishing: 36 }, watch_fish: { fishing: 4 }, play_games: { gaming: 30 }, computer_games: { gaming: 30 }, play_arcade: { gaming: 40 }, play_pool: { gaming: 12 }, play_darts: { gaming: 12 }, play_display: { gaming: 10 },
  open_mic: { comedy: 45 }, try_on: { style: 30 }, change_outfit: { style: 10 }, computer_study: { tech: 12 }, library_computer: { tech: 12 }, computer_gig: { tech: 14 }, bar_hang_out: { mixology: 8 }, taste_samples: { mixology: 6 },
  browse_wares: { bartering: 10 }, enjoy_view: { photography: 6 }, stargaze: { photography: 4 },
};
const A = (id, name, tag, where, mins, o) => Object.assign({ id, name, tag, where, minutes: { min: mins, default: mins, max: mins } }, o);
const DRY = ['rain', 'storm', 'snow'];
export const NEW_ACTIVITIES = [
  A('sk_busk', 'Busk for Tips', 'busker', 'world', 30, { perHour: { fun: 14, social: 10, energy: -4 }, xpPerHour: { music: 30, charisma: 8 }, requires: { skill: { music: 2 }, notWeather: DRY, hours: [8, 23] }, outdoor: true, anim: 'dance', flavour: 'Case open. Deep breath. One, two...' }),
  A('sk_street_comedy', 'Try Out Jokes on Passers-by', 'busker', 'world', 20, { perHour: { fun: 16, social: 14, energy: -3 }, xpPerHour: { comedy: 34, charisma: 10 }, requires: { skill: { comedy: 2 }, notWeather: DRY, hours: [8, 23] }, outdoor: true, anim: 'talk', flavour: 'So a gull walks into a bakery...' }),
  A('sk_jokes_mirror', 'Practise Jokes in the Mirror', 'wardrobe', 'home', 15, { perHour: { fun: 10 }, xpPerHour: { comedy: 30 }, anim: 'talk', flavour: 'Tough crowd. It is you.' }),
  A('sk_photo', 'Photograph the View', 'viewpoint', 'world', 15, { perHour: { fun: 14, energy: -1 }, xpPerHour: { photography: 40, creativity: 8 }, outdoor: true, anim: 'phone', flavour: 'Hold still, horizon.' }),
  A('sk_snap', 'Photograph the Street', 'bench', 'world', 15, { perHour: { fun: 10, energy: -1 }, xpPerHour: { photography: 34, creativity: 6 }, outdoor: true, anim: 'phone', flavour: 'Wait for someone to walk into the frame.' }),
  A('sk_smalltalk', 'Strike Up a Conversation', 'bench', 'world', 15, { perHour: { social: 36, fun: 8 }, xpPerHour: { charisma: 36 }, outdoor: true, anim: 'talk', flavour: 'Lovely day for it. Whatever it is.' }),
  A('sk_chess_park', 'Play Chess', 'chess', 'world', 30, { perHour: { fun: 14, social: 8 }, xpPerHour: { chess: 36, logic: 12 }, requires: { notWeather: DRY, hours: [7, 22] }, outdoor: true, anim: 'sit', flavour: 'The clock is older than both of you.' }),
  A('sk_chess_online', 'Play Chess Online', 'computer', 'home', 20, { perHour: { fun: 12 }, xpPerHour: { chess: 30, logic: 10 }, anim: 'type', flavour: 'Opponent: SeagullGambit_42.' }),
  A('sk_code', 'Build an App', 'computer', 'home', 45, { perHour: { fun: 5, energy: -2 }, xpPerHour: { tech: 36, logic: 10 }, anim: 'type', flavour: 'It compiles. Suspicious.' }),
  A('sk_code_lib', 'Code on a Public Computer', 'public_computer', 'venue', 45, { venues: ['library'], perHour: { fun: 4, energy: -2 }, xpPerHour: { tech: 30, logic: 10 }, requires: { venueOpen: true }, anim: 'type', flavour: 'Quiet keys, please.' }),
  A('sk_mix', 'Mix a Drink', 'fridge', 'home', 10, { perHour: { fun: 18 }, xpPerHour: { mixology: 42 }, cost: { amount: 3, per: 'use' }, anim: 'work', flavour: 'Ice first. Always ice first.' }),
  A('sk_style', 'Put a Look Together', 'wardrobe', 'home', 15, { perHour: { fun: 14 }, xpPerHour: { style: 40 }, anim: 'stand', flavour: 'Belt? No belt. Belt.' }),
  A('sk_dance_home', 'Dance Along', 'music', 'home', 15, { perHour: { fun: 28, energy: -6 }, xpPerHour: { dancing: 36 }, fitnessPerHour: 4, anim: 'dance', flavour: 'Nobody is watching. Probably.' }),
  A('sk_tune_stove', 'Tune Up the Stove', 'stove', 'home', 20, { perHour: { fun: 4, energy: -3 }, xpPerHour: { handiness: 40 }, anim: 'work', flavour: 'Burner three has opinions.' }),
  A('sk_tune_shower', 'Fix the Shower Pressure', 'shower', 'home', 20, { perHour: { fun: 4, energy: -3 }, xpPerHour: { handiness: 40 }, anim: 'work', flavour: 'Lefty loosey. Probably.' }),
  A('sk_tune_tv', 'Tune Up the TV', 'tv', 'home', 20, { perHour: { fun: 4, energy: -3 }, xpPerHour: { handiness: 40 }, requires: { skill: { handiness: 3 } }, anim: 'work', flavour: 'The remote has been inside the sofa this whole time.' }),
  A('sk_tune_computer', 'Tune Up the Computer', 'computer', 'home', 20, { perHour: { fun: 4, energy: -3 }, xpPerHour: { handiness: 30, tech: 14 }, requires: { skill: { handiness: 3 } }, anim: 'work', flavour: 'So. Much. Dust.' }),
  A('sk_hoops', 'Shoot Hoops', 'hoop', 'world', 20, { perHour: { fun: 20, energy: -8, hygiene: -5 }, xpPerHour: { fitness: 34 }, fitnessPerHour: 8, requires: { notWeather: ['storm', 'snow'] }, outdoor: true, anim: 'lift', flavour: 'Nothing but net. In theory.' }),
  A('sk_bay_swim', 'Swim in the Bay', 'beach', 'world', 20, { perHour: { fun: 18, energy: -10, hygiene: 8 }, xpPerHour: { swimming: 36, fitness: 10 }, fitnessPerHour: 10, requires: { notWeather: ['storm', 'snow'], hours: [6, 21] }, outdoor: true, anim: 'stand', flavour: 'Cold. Cold cold cold. Lovely.' }),
  A('sk_sell', 'Sell at the Market', 'market_trade', 'world', 10, { perHour: { social: 20, fun: 10 }, xpPerHour: { bartering: 42, charisma: 8 }, requires: { hours: [8, 19] }, outdoor: true, anim: 'talk', flavour: 'Name a price. Then name a better one.' }),
];

// Which mini-game an activity opens (game keys are defined in src/sim/skillplay.js GAMES).
export const GAME_FOR = {
  cook: 'flip', prep_cold: 'flip', gym_weights: 'reps', exercise_home: 'reps', gym_treadmill: 'stride', jog: 'stride', gym_yoga_class: 'pose',
  library_study: 'study', computer_study: 'study', sketch_outdoors: 'sketch', assemble_furniture: 'fixit', sk_tune_stove: 'fixit', sk_tune_shower: 'fixit', sk_tune_tv: 'fixit', sk_tune_computer: 'fixit',
  practice_instrument: 'song', sk_busk: 'busk', paint: 'paint', computer_write: 'write', sk_photo: 'photo', sk_snap: 'photo', garden: 'weed', tend_plants: 'weed',
  dance: 'dance', sk_dance_home: 'dance', sk_bay_swim: 'swim', fish_pier: 'fish', play_games: 'arcade', computer_games: 'arcade', play_arcade: 'arcade',
  sk_chess_park: 'chess', sk_chess_online: 'chess', sk_mix: 'pour', sk_sell: 'haggle', sk_style: 'outfit', sk_code: 'debug', sk_code_lib: 'debug',
  open_mic: 'punchline', sk_street_comedy: 'punchline', sk_jokes_mirror: 'punchline', sk_smalltalk: 'smalltalk', sk_hoops: 'hoops', play_darts: 'darts',
};

/* ------------------------------------------------------------------ coaches */
// A coach stands at a real spot during `hours` on `days` (0 = Monday; absent = every day). A lesson costs `fee` — or a `favour` item from your bag —
// runs that skill's mini-game with the coach calling the shots and teaches TUNE.coachXp * (1 + score) xp (x TUNE.coachMult of a normal bonus). Once a day each.
//   at: how the spot is found in the city: { poi: kind | id } | { prop: asset id, n } | { xy: [x, y] };  off: [dx, dy] from it
export const COACHES = [
  { id: 'coach_chess', name: 'Marguerite "Blitz" Okafor', short: 'Blitz', role: 'Park chess hustler', skill: 'chess', game: 'chess', fee: 15, favour: 'canned_coffee', hours: [10, 18], at: { poi: 'chess' }, off: [1.2, 0.4],
    look: { age: 'elder', hat: 'flatcap' }, hello: 'Sit. White moves first. That is you.', bye: 'You see it faster every time. Same time tomorrow?', line: 'Five dollars says you miss the fork.' },
  { id: 'coach_music', name: 'Teo Marchetti', short: 'Teo', role: 'Busker who teaches chords', skill: 'music', game: 'song', fee: 18, favour: 'cafe_latte', hours: [12, 19], at: { poi: 'River Walk' }, off: [1.4, -0.6],
    look: { age: 'adult' }, hello: 'Three chords and the truth. Watch my hands.', bye: 'That was nearly a song! Come back, bring coffee.', line: 'Requests are a dollar. Lessons are more.' },
  { id: 'coach_fit', name: 'Coach Dana Reyes', short: 'Coach Dana', role: 'Gym trainer, courtside', skill: 'fitness', game: 'hoops', fee: 20, favour: 'sports_drink', hours: [7, 11], at: { prop: 'prop.park.hoop', n: 0 }, off: [5, -2.5],
    look: { age: 'adult', outfit: 'sport' }, hello: 'Knees bent, elbow in, follow through. Ten shots.', bye: 'Good work. Hydrate. See you at the gym.', line: 'Elbow in! ...Not you. Well. Also you.' },
  { id: 'coach_garden', name: 'Old Ben Whitlow', short: 'Old Ben', role: 'Garden volunteer (ask him about the Conservatory)', skill: 'gardening', game: 'weed', fee: 12, favour: 'tomato', hours: [8, 13], at: { poi: 'poi_community_garden' }, off: [-1.6, 1.0],
    look: { age: 'elder', hat: 'sunhat' }, hello: 'That one is a weed. That one is a carrot. Do not mix them up again.', bye: 'The beds look happier already.', line: 'Competitive tomatoes. That is what we grow here.' },
  { id: 'coach_fish', name: 'Winnie\'s uncle Abe', short: 'Abe', role: 'Pier old-timer', skill: 'fishing', game: 'fish', fee: 12, favour: 'fish', hours: [5, 10], at: { poi: 'poi_pier' }, off: [1.4, 0.8],
    look: { age: 'elder', hat: 'beanie' }, hello: 'Do not fight the fish. Dance with it.', bye: 'Now that is how you land one.', line: 'An hour after dawn. That is all I am saying.' },
  { id: 'coach_photo', name: 'Imani Castellanos', short: 'Imani', role: 'Photographer chasing the light', skill: 'photography', game: 'photo', fee: 18, favour: null, hours: [16, 20], at: { poi: 'poi_lookout' }, off: [1.5, -0.8],
    look: { age: 'adult', bag: 'satchel' }, hello: 'Breathe out. Then press. Not before.', bye: 'Keep that one. That one is a keeper.', line: 'Twenty more minutes and the whole bay goes gold.' },
];

/* ------------------------------------------------------------------ content for the games */
export const SMALLTALK = {   // sort game: read the mood, pick the right kind of reply
  bins: ['Joke', 'Listen', 'Compliment'],
  lines: [
    ['Ugh, what a Monday. Could do with a laugh.', 0], ['My bus is late and so am I. Cheer me up.', 0], ['Tell me something funny, I have had a day.', 0], ['The pigeons here are plotting something.', 0], ['I am not saying it is cold but I saw a gull in a scarf.', 0],
    ['Honestly? It has been a rough week.', 1], ['My daughter just moved away. Quiet house.', 1], ['I do not know why I am telling you this, but...', 1], ['I have a big decision to make.', 1], ['Do you ever feel like the city moves too fast?', 1], ['Long story. Got a minute?', 1],
    ['I baked this myself. First try!', 2], ['Just got my hair cut. Too short?', 2], ['I painted my front door yellow.', 2], ['New coat. Not sure about it.', 2], ['I ran to the lighthouse and back this morning.', 2], ['I finally fixed my bike myself.', 2],
  ],
};
export const OUTFIT = {   // sort game: which occasion is this piece for?
  bins: ['Work', 'Night out', 'Sport'],
  items: [['Crisp white shirt', 0], ['Blazer', 0], ['Leather satchel', 0], ['Sensible loafers', 0], ['Pencil skirt', 0], ['Tie clip', 0], ['Sequin top', 1], ['Dancing shoes', 1], ['Velvet jacket', 1], ['Statement earrings', 1], ['Silk scarf', 1], ['Little black dress', 1],
    ['Running tights', 2], ['Sweatband', 2], ['Trainers', 2], ['Team jersey', 2], ['Swim cap', 2], ['Windbreaker', 2]],
};
export const FIXIT = {   // sort game: which drawer does this part belong in?
  bins: ['Screws', 'Washers', 'Fuses'],
  items: [['Cross-head screw', 0, '#9aa4b0'], ['Long wood screw', 0, '#b8894a'], ['Tiny brass screw', 0, '#d8b23a'], ['Rubber washer', 1, '#3a3644'], ['Steel washer', 1, '#9aa4b0'], ['Fibre washer', 1, '#c05a3a'], ['3 amp fuse', 2, '#d8342e'], ['13 amp fuse', 2, '#8a5a2c'], ['Glass fuse', 2, '#8fd8f0']],
};
export const FISH_SIZE = [12, 24, 22, 40, 34, 50, 46, 70, 110, 160];   // cm at the rung (x 0.8..1.3 by how the fight went)
export const CROPS = ['lettuce', 'carrot', 'onion', 'potato', 'tomato', 'tomato', 'tomato', 'tomato', 'potato', 'potato'];   // item id harvested at the rung (existing ingredient ids only)
export const ARCADE = [
  { id: 'gull', name: 'Gull Run', par: 70, level: 1, hint: 'Tap to flap. Thread the gaps between the pier posts.' },
  { id: 'brick', name: 'Brick Bay', par: 50, level: 3, hint: 'Drag the paddle. Break every brick.' },
  { id: 'ferry', name: 'Star Ferry', par: 90, level: 5, hint: 'Drag to steer. You fire by yourself. Dodge the rocks.' },
  { id: 'snake', name: 'Snack Snake', par: 30, level: 7, hint: 'Swipe or tap a side to turn. Eat the snacks, not your tail.' },
];

/* ------------------------------------------------------------------ moodlets, books, guide, tips */
export const SKILL_MOODLETS = {
  looking_sharp: { name: 'Looking Sharp', desc: 'You put that look together yourself.', mood: 5, workPerf: 2, walkSpeed: 1, minutes: TUNE.sharpMinutes, source: 'activity' },
  proud_maker:   { name: 'Made It Myself', desc: 'A finished piece with your name on it.', mood: 5, workPerf: 0, walkSpeed: 1, minutes: 240, source: 'activity' },
  in_the_zone:   { name: 'In the Zone', desc: 'Three stars. Everything just flowed.', mood: 4, workPerf: 1, walkSpeed: 1, minutes: 120, source: 'activity', xpMult: 1.05 },
  lesson_learned:{ name: 'Good Lesson', desc: 'A coach showed you something new.', mood: 4, workPerf: 1, walkSpeed: 1, minutes: 240, source: 'activity' },
  sea_legs:      { name: 'Sea Legs', desc: 'Salt on your skin and a clear head.', mood: 5, workPerf: 1, walkSpeed: 1.03, minutes: 180, source: 'activity' },
};
const skillBook = (id, name, skill, minLevel, maxLevel, price, xpTotal, icon) => ({ id, name, category: 'book', price, icon, effects: {}, stack: 1, soldAt: ['bookstore'], kind: 'skill', skill, minLevel, maxLevel, xpTotal, readMinutes: xpTotal });
export const NEW_BOOKS = [
  skillBook('book_music_1', 'Three Chords and the Bus Home', 'music', 1, 4, 18, 240, 'teal book, guitar'), skillBook('book_painting_1', 'Mud Is a Colour Too', 'painting', 1, 4, 18, 240, 'red book, brush'),
  skillBook('book_writing_1', 'Sit Down. Write. Repeat.', 'writing', 1, 4, 18, 240, 'cream book, pen'), skillBook('book_photography_1', 'f/8 and Be There', 'photography', 1, 4, 18, 240, 'grey book, camera'),
  skillBook('book_gardening_1', 'The Balcony Farmer', 'gardening', 1, 4, 18, 240, 'green book, sprout'), skillBook('book_dancing_1', 'Two Left Feet, One Good Beat', 'dancing', 1, 4, 18, 240, 'pink book, shoe'),
  skillBook('book_fishing_1', 'Lies I Have Told Fish', 'fishing', 1, 4, 18, 240, 'blue book, fish'), skillBook('book_gaming_1', 'Insert Coin: A Field Guide', 'gaming', 1, 4, 18, 240, 'purple book, console'),
  skillBook('book_chess_1', 'Forks, Pins and Other Cutlery', 'chess', 1, 4, 18, 240, 'navy book, knight'), skillBook('book_chess_2', 'The Endgame at the Duck Pond', 'chess', 4, 8, 42, 480, 'navy book, crown'),
  skillBook('book_mixology_1', 'Ice First', 'mixology', 1, 4, 18, 240, 'blue book, cocktail'), skillBook('book_bartering_1', 'Never Pay Sticker', 'bartering', 1, 4, 18, 240, 'gold book, coin'),
  skillBook('book_style_1', 'Wear the Coat', 'style', 1, 4, 18, 240, 'black book, shirt'), skillBook('book_tech_1', 'Hello, World. Hello, Bay.', 'tech', 1, 4, 18, 240, 'grey book, laptop'), skillBook('book_tech_2', 'Ship It on Friday', 'tech', 4, 8, 42, 480, 'dark book, laptop'),
  skillBook('book_comedy_1', 'The Pause', 'comedy', 1, 4, 18, 240, 'yellow book, speech bubble'), skillBook('book_swimming_1', 'Breathe Out Underwater', 'swimming', 1, 4, 18, 240, 'aqua book, drop'),
];
export const GUIDE_X = [   // Wander "Things To Try" entries + stamps (group 'Skills & hobbies'); stamped by skillplay.js
  { id: 'x:sk_first', title: 'Play a Mini-Game', glyph: 'star', blurb: 'Most hobbies in Maple Bay have a little game in them. Cook, paint, fish, dance: play it or tap Auto.' },
  { id: 'x:sk_3star', title: 'Three Stars', glyph: 'star', blurb: 'Finish any mini-game with three stars.' },
  { id: 'x:sk_busk', title: 'Busk for Tips', glyph: 'note', blurb: 'Learn a song at home, then play it at a busking spot. City Hall sells permits that double the hat.' },
  { id: 'x:sk_chess', title: 'Win at the Park Boards', glyph: 'knight', blurb: 'The stone chess tables in Central Park. Solve the tactics and your rating climbs.' },
  { id: 'x:sk_fish', title: 'Land a Fish', glyph: 'fish', blurb: 'Keep the line tight, not too tight. Cook what you catch or sell it at the market.' },
  { id: 'x:sk_photo', title: 'Fill a Page of Your Album', glyph: 'camera', blurb: 'Photograph six views or streets. The album lives in the Me app.' },
  { id: 'x:sk_sell', title: 'Sell Something You Made', glyph: 'coin', blurb: 'Paintings, prints, fish and vegetables all sell at the Old Town Market. Haggle well.' },
  { id: 'x:sk_coach', title: 'Take a Lesson', glyph: 'whistle', blurb: 'Six people around town will teach you for a small fee or a favour. The Me app knows where they are.' },
  { id: 'x:sk_arcade', title: 'Beat a Par Score', glyph: 'star', blurb: 'Gull Run, Brick Bay, Star Ferry, Snack Snake. Any cabinet, console or computer.' },
  { id: 'x:sk_harvest', title: 'Harvest Your Garden Bed', glyph: 'sprout', blurb: 'Weed a bed at the community garden until it ripens, then take the vegetables home.' },
  { id: 'x:sk_level5', title: 'Reach Level 5 in a Skill', glyph: 'star', blurb: 'Halfway to mastery. The Me app lists what every level gives.' },
  { id: 'x:sk_hoops', title: 'Sink Three in a Row', glyph: 'dumbbell', blurb: 'The hoops in the park. Angle, then power.' },
];
export const TIPS_X = [
  { id: 'sk_me', topic: 'well', title: 'The Me app', text: 'Me shows your traits, all your skills with what each level gives, your interests, records and the things you have made. Interests can be changed any time.', go: { app: 'me' } },
  { id: 'sk_minis', topic: 'out', title: 'Mini-games (and Auto)', text: 'Cooking, painting, music, fishing, chess and more open a short game. Play it for bonus xp and a better result, or tap Auto for the usual result. You can switch them all off in Me.', go: { app: 'me' } },
  { id: 'sk_traits', topic: 'well', title: 'Traits', text: 'Pick three traits that fit you. Each has small perks. Habits can earn you more: wake early a few times and you become a Morning Person.', go: { app: 'me', arg: { tab: 'traits' } } },
  { id: 'sk_coaches', topic: 'out', title: 'Coaches', text: 'A chess hustler in the park, a busker on the River Walk, a trainer by the hoops, a gardener, a pier old-timer and a photographer at the lookout give lessons. One a day each.', go: { app: 'me', arg: { tab: 'skills' } } },
  { id: 'sk_first', topic: 'well', title: 'First practice of the day', text: 'The first half hour you spend on any skill each day earns 50% more xp. A little of everything beats a lot of one thing.' },
  { id: 'sk_sell', topic: 'work', title: 'Selling what you make', text: 'Paintings, photo prints, fish and vegetables sell at the Old Town Market trading post. A good haggle earns more, and Bartering makes everything a little cheaper.' },
];

/* ------------------------------------------------------------------ registration (append-only, idempotent) */
for (const s of NEW_SKILLS) if (!SKILLS.some(x => x.id === s.id)) SKILLS.push(Object.assign({ perLevel: {} }, s));
for (const [k, v] of Object.entries(Object.assign({}, TRAIT_MOODLETS, SKILL_MOODLETS))) if (!MOODLETS[k]) MOODLETS[k] = v;
for (const a of NEW_ACTIVITIES) if (!ACTIVITY_BY_ID[a.id]) { ACTIVITIES.push(a); ACTIVITY_BY_ID[a.id] = a; }
for (const t of ['chess', 'hoop', 'beach', 'market_trade']) if (!FUNCTION_TAGS.world.includes(t)) FUNCTION_TAGS.world.push(t);
for (const b of NEW_BOOKS) if (!ITEM_BY_ID[b.id]) { BOOKS.push(b); ITEMS.push(b); ITEM_BY_ID[b.id] = b; }
export const SKILL_IDS = SKILLS.map(s => s.id);
