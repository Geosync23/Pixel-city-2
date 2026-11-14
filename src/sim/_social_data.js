// Private helpers for src/sim/social.js: cast look -> character art spec, the place table for routines, citizen names,
// small context line pools. Pure data + pure functions (no G).
import { charArt } from '../core/char.js';
import { VENUES, SPOTS, TRAITS, TOPICS } from '../story/cast.js';

export const hash = s => { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

/* ---------- appearance ---------- */
const SKIN = { light: 1, fair: 0, olive: 3, tan: 4, brown: 5, dark: 7, deep: 8 };
const HAIR = { fade: 'buzz', undercut: 'sidepart', braid: 'braids', wrapped: 'bun', beehive: 'bun', chignon: 'bun', fringe: 'sidepart', pixie: 'short', covered: 'hijab', shaggy: 'wavy', slick: 'sidepart', puffs: 'pigtails' };
const TOP = { tshirt: 'tee', vest: 'sweater', windbreaker: 'jacket', 'denim-jacket': 'jacket', shirt: 'long', uniform: 'dress', 'chef-jacket': 'long', jumpsuit: 'long', blazer: 'suit', blouse: 'long', scrubs: 'tee', waistcoat: 'suit', 'hi-vis': 'jacket', 'work-jacket': 'jacket', coveralls: 'long', hawaiian: 'graphic', peacoat: 'coat' };
const BOTTOM = { joggers: 'sweats', trousers: 'slacks', chinos: 'slacks', dress: 'longskirt', jumpsuit: 'slacks', scrubs: 'slacks', coveralls: 'cargo' };
const HAT = { 'cap-backwards': 'cap', headwrap: 'turban', 'paper-cap': 'cap', 'flat-cap': 'flatcap', headset: 'headband', 'conductor-cap': 'cap', 'captain-cap': 'cap', visor: 'cap', pompom: 'beanie', beret: 'beret', sunhat: 'sunhat' };
const BAG = { basket: 'grocery', 'paper-bag': 'grocery', 'guitar-case': 'backpack', 'cello-case': 'backpack', accordion: 'messenger', toolbox: 'briefcase', notebook: 'messenger' };
const OUTFIT = { barista: 'barista', grocer: 'grocer', courier: 'courier', chef: 'chef', trainer: 'trainer', librarian: 'librarian', nurse: 'nurse', bartender: 'bartender', dock: 'dockworker', office: 'office', diner: 'cook', pizza: 'cook', baker: 'cook', driver: 'taxidriver' };
const has = (list, v) => Array.isArray(list) && list.includes(v);
const isHex = v => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v);
/** cast member -> { base: art spec, work: art spec wearing the job outfit (or base) } */
export function buildSpecs(c) {
  const A = charArt(), s = c.spec || {}, h = hash(c.id);
  const skins = A.SKINS || ['#ecba90'];
  const base = {
    skin: isHex(s.skin) ? s.skin : skins[Math.min(skins.length - 1, SKIN[s.skin] !== undefined ? SKIN[s.skin] : 2 + h % 4)],
    hair: has(A.HAIRS, s.hair) ? s.hair : has(A.HAIRS, HAIR[s.hair]) ? HAIR[s.hair] : 'short',
    hairColor: isHex(s.hairColor) ? s.hairColor : '#2a1c14',
    top: has(A.TOPS, s.top) ? s.top : has(A.TOPS, TOP[s.top]) ? TOP[s.top] : 'tee',
    topColor: isHex(s.topColor) ? s.topColor : '#3b5bdb',
    bottom: has(A.BOTTOMS, s.bottom) ? s.bottom : has(A.BOTTOMS, BOTTOM[s.bottom]) ? BOTTOM[s.bottom] : 'jeans',
    bottomColor: isHex(s.bottomColor) ? s.bottomColor : '#3d405b',
    hat: has(A.HATS, s.hat) ? s.hat : has(A.HATS, HAT[s.hat]) ? HAT[s.hat] : null,
    hatColor: s.hat === 'hardhat' ? '#f2c230' : s.hat === 'captain-cap' ? '#f4f1de' : s.hat === 'paper-cap' ? '#ffffff' : isHex(s.hatColor) ? s.hatColor : undefined,
    glasses: !s.glasses || s.glasses === 'none' ? false : /aviator|sun/.test(s.glasses) ? 'sun' : true,
    bag: has(A.BAGS, s.bag) ? s.bag : has(A.BAGS, BAG[s.bag]) ? BAG[s.bag] : null,
    age: has(A.AGES, s.age) ? s.age : c.age < 14 ? 'kid' : c.age >= 65 ? 'elder' : 'adult',
    build: (A.BUILDS || ['avg'])[h % 3] || 'avg', height: c.age < 14 ? 'short' : (A.HEIGHTS || ['avg'])[(h >> 3) % 3] || 'avg',
  };
  if (/beard/.test(c.look || '')) base.beard = true;
  if (base.hat === undefined) base.hat = null;
  const o = OUTFIT[s.outfit]; let work = base;
  if (o && has(A.OUTFITS, o) && c.work && !String(c.work.venue).startsWith('spot:') && o !== 'office') work = Object.assign({}, base, { outfit: o, bag: null });
  return { base, work };
}

/* ---------- places ---------- */
/** outdoor places used by routines: city coordinates (snapped to a free cell at runtime) */
export const OUTDOOR = {
  park: { x: 124, y: 168, name: 'Central Park' }, pier: { x: 104, y: 358, name: 'Harborside Pier' }, lookout: { x: 86, y: 25, name: 'Hillcrest Lookout' }, airport: { x: 322, y: 104, name: 'Maple Bay Intl.' },
  'spot:school': { x: 313, y: 214, name: 'Maplewood Elementary' }, 'spot:community_garden': { x: 346, y: 213, name: 'the community garden' },
  'spot:lemonade_stand': { x: 129, y: 262, name: 'the lemonade stand' }, 'spot:chess_tables': { x: 132, y: 167, name: 'the chess tables' },
  'spot:pond': { x: 96, y: 172, name: 'the duck pond' }, 'spot:playground': { x: 66, y: 186, name: 'the playground' }, 'spot:riverside_path': { x: 168, y: 221, name: 'the River Walk' },
  'spot:fish_market': { x: 114, y: 336, name: 'the fish market' }, 'spot:lighthouse': { x: 37, y: 356, name: 'the lighthouse' }, 'spot:central_plaza': { x: 214, y: 318, name: 'Central Station plaza' },
  'spot:taxi_rank_central': { x: 221, y: 303, name: 'the Central taxi rank' }, 'spot:city_hall_steps': { x: 220, y: 224, name: 'City Hall steps' }, 'spot:market_street': { x: 98, y: 256, name: 'Market Square' },
  'spot:lantern_row': { x: 100, y: 281, name: 'Lantern Row' }, 'spot:arts_steps': { x: 220, y: 130, name: 'Arts Quarter station steps' }, 'spot:campus_green': { x: 220, y: 79, name: 'Campus Green' },
  'spot:mural_wall': { x: 234, y: 111, name: 'the mural wall' }, 'spot:tram_shed': { x: 270, y: 326, name: 'the old tram shed' }, 'spot:taxi_rank_airport': { x: 341, y: 104, name: 'the airport taxi rank' },
};
export const HOME_ROOM = { home_jules: 'home:sibling', home_nana: 'home:grandma', home_kit: 'home:friend' };
export const HOME_LABEL = { home_jules: "Jules' house", home_nana: "Nana's house", home_kit: "Kit's place" };
export const venueName = id => (VENUES[id] && VENUES[id].name) || (OUTDOOR[id] && OUTDOOR[id].name) || (SPOTS[String(id).replace('spot:', '')] ? OUTDOOR[id] && OUTDOOR[id].name : null) || id;
/** how hanging out works per venue: [anim, label, cost, needs] */
export const HANG = {
  cafe: ['drink', 'Coffee together', 4, { fun: 14, energy: 6 }], bakery: ['eat', 'Pastries together', 4, { hunger: 18, fun: 12 }], diner: ['eat', 'A meal together', 9, { hunger: 40, fun: 12 }],
  ramen: ['eat', 'Ramen together', 9, { hunger: 42, fun: 12 }], pizza: ['eat', 'Pizza together', 8, { hunger: 40, fun: 14 }], restaurant: ['eat', 'Dinner together', 22, { hunger: 45, fun: 20 }],
  bar: ['drink', 'Drinks together', 7, { fun: 22 }], cinema: ['sit', 'Watch the movie together', 8, { fun: 30 }], gym: ['lift', 'Work out together', 0, { fun: 8, energy: -14, hygiene: -10 }],
  library: ['read', 'Read together', 0, { fun: 12 }], bookstore: ['read', 'Browse together', 0, { fun: 14 }], clothing: ['talk', 'Shop together', 0, { fun: 16 }], homegoods: ['talk', 'Shop together', 0, { fun: 14 }], grocery: ['talk', 'Shop together', 0, { fun: 8 }],
  park: ['talk', 'Walk in the park together', 0, { fun: 18 }], pier: ['talk', 'Watch the water together', 0, { fun: 18 }], lookout: ['talk', 'Take in the view together', 0, { fun: 20 }],
  home: ['talk', 'Hang out', 0, { fun: 16 }],
};
/** hang-out venue menu for the player's invitation: [venueId, label] */
export const HANG_MENU = [['cafe', 'Coffee'], ['diner', 'A bite to eat'], ['ramen', 'Ramen'], ['pizza', 'Pizza'], ['bar', 'Drinks'], ['cinema', 'A movie'], ['gym', 'A workout'], ['park', 'A walk in the park'], ['pier', 'The pier'], ['bookstore', 'Bookshop browse']];

/* ---------- citizens ---------- */
export const FIRST = ['Aiko', 'Amara', 'Andre', 'Anika', 'Arjun', 'Ben', 'Bianca', 'Camila', 'Carlos', 'Chen', 'Chloe', 'Dara', 'Darius', 'Diego', 'Elena', 'Eli', 'Emeka', 'Esther', 'Fatima', 'Finn', 'Gabriela', 'Grace', 'Hana', 'Hassan', 'Hugo', 'Ibrahim', 'Imogen', 'Isla', 'Jamal', 'Jin', 'Joon', 'Kaito', 'Kofi', 'Lars', 'Leila', 'Liam', 'Lucia', 'Mai', 'Malik', 'Marta', 'Mateo', 'Mei', 'Nadia', 'Naveen', 'Nia', 'Olu', 'Omar', 'Paloma', 'Quinn', 'Rafael', 'Rosa', 'Sana', 'Sione', 'Sofia', 'Tariq', 'Tess', 'Uma', 'Viktor', 'Wren', 'Xavier', 'Yara', 'Yusuf', 'Zoe', 'Zuri'];
export const LAST = ['Abara', 'Alvarez', 'Bae', 'Bell', 'Castro', 'Cho', 'Diaz', 'Okafor', 'Fischer', 'Garcia', 'Haddad', 'Ito', 'Jensen', 'Kapoor', 'Kim', 'Lopez', 'Mbeki', 'Nakamura', 'Nguyen', 'Novak', 'Osei', 'Park', 'Reyes', 'Rossi', 'Santos', 'Shah', 'Silva', 'Tanaka', 'Tran', 'Walker', 'Yilmaz', 'Zhou'];
const ROLES = { downtown: 'Downtown regular', oldtown: 'Old Town local', harbor: 'Harborside local', hillcrest: 'Hillcrest resident', maplewood: 'Maplewood neighbor', arts: 'Arts Quarter regular', railyard: 'Railyard local', park: 'Park regular', airport: 'Frequent flyer' };
export const citizenName = seed => FIRST[seed % FIRST.length] + ' ' + LAST[(seed >>> 7) % LAST.length];
/** pseudo cast entry for a saved citizen record */
export function citizenInfo(z) {
  const h = hash(z.id + z.name), tr = [TRAITS[h % TRAITS.length], TRAITS[(h >>> 5) % TRAITS.length], TRAITS[(h >>> 11) % TRAITS.length]];
  const first = z.name.split(' ')[0];
  return { id: z.id, name: z.name, short: first, group: 'regular', citizen: true, role: ROLES[z.district] || 'Maple Bay local', district: z.district, home: null, work: null, age: z.kid ? 9 : 30,
    personality: tr, likes: { gifts: [], topics: [TOPICS[h % TOPICS.length], TOPICS[(h >>> 9) % TOPICS.length]] }, dislikes: { gifts: [], topics: [TOPICS[(h >>> 14) % TOPICS.length]] },
    flirtable: false, routine: [], bio: `You met ${first} out and about in Maple Bay.`,
    greetings: { low: ['Oh, hello again! We keep running into each other.', `Hi! ${first}. We met the other day, remember?`], mid: ['{name}! Good to see a friendly face.', 'Hey, you! I was hoping I would bump into you.'], high: ['{name}! My favorite coincidence.', 'There you are. The city is small when you have friends in it.'] } };
}

/* ---------- context lines (greeting add-ons) ---------- */
export const CTX = {
  intro: ["I'm {npc}, by the way. {role}.", "We haven't met. {npc}. {role}.", "New face! I'm {npc}. {role}, for my sins."],
  tired: ['You look exhausted. Sit down before you fall down.', 'When did you last sleep? Honest answer.', 'Those are some heroic eye bags. Get some rest, okay?'],
  hungry: ['Was that your stomach? Go and eat something.', 'You look like you skipped lunch. And breakfast.', 'Eat something, will you? You have gone a bit see-through.'],
  grubby: ['Rough morning? No judgment. A little judgment.', 'You have had a day, I can tell. A shower fixes most of it.'],
  lonely: ['You look like you needed a chat. Me too.', 'Good timing. You have the look of someone who has only talked to gulls today.'],
  happy: ['You are glowing today. What is your secret?', 'Somebody is in a good mood. It suits you.'],
  uniform: ['Look at you in the uniform! Very official.', 'On the clock? The uniform suits you.', "Ooh, working. I won't keep you. Much."],
  job: ['How is the new job treating you?', 'Heard you are working now. Proper Maple Bay citizen.'],
  rain: ['Can you believe this rain?', 'Lovely weather. For ducks.', 'You are dripping. It is fine. Everyone is dripping.'],
  snow: ['Mind the ice out there.', 'Snow! I love it for exactly one day.'],
  morning: ['You are up early.', 'Morning! The good bread is still warm somewhere.'],
  night: ['You are out late.', 'Late one tonight, hm?'],
  remember: ['I keep thinking about what you said last time. About {topic}.', 'Last time we got onto {topic}. I had more to say!', 'Still laughing about {topic} from the other day.'],
  birthday: ['It is my birthday today, you know. I am accepting compliments.', 'Guess whose birthday it is. Mine. It is mine.'],
  atWork: ['Welcome in. What can I get you?', 'Hello! Busy day, but I have a minute.'],
  staffKnown: ['{name}! The usual?', 'There is my favorite customer. Do not tell the others.', 'Hi {name}! Good to see you in here.'],
  hangArrive: ['There you are! I was about to order without you.', '{name}! You made it. Shall we?', 'Right on time. I like that in a person.'],
  hostWelcome: ['Come in, come in! Shoes wherever. Are you hungry?', 'You made it! Sit anywhere. Let me feed you.', 'Welcome! Ignore the mess. There is food.'],
  visitHere: ['So this is the place! I like it.', 'Look at this. A real home. Show me everything.'],
  wave: ['Hi, {name}!', 'Hey, {name}!', '{name}! Hello!', 'Oh, hi!'],
  mustGo: ['Anyway, I should get going. This was nice.', 'Look at the time. I had better run.', 'I will let you get on. Lovely talking.'],
  backToWork: ['Right, back to work for me.', 'I had better get back to it. Customers.', 'Duty calls. Come by again.'],
  furnishNice: ['Is that new? It really ties the room together.', 'Okay, this place is cozy. I may never leave.', 'I love what you have done in here.'],
  furnishBare: ['Minimalist! Very... echoey.', 'It has potential. And an echo.', 'You need a plant. Everyone needs a plant.'],
  fed: ['Oh, you did not have to. I am glad you did.', 'For me? You are a proper host.', 'This is delicious. You have been holding out on me.'],
  cooked: ['You cooked? For me? I am genuinely touched.', 'It smells amazing in here. Is that for us?'],
  phone: ['Hey! Good to hear your voice.', 'Oh, it is you! I was just thinking about you.', 'Hi! You caught me at a good time.'],
  citizenBye: ['Nice talking to you! See you around.', 'Take care now. Welcome to the Bay.', 'Well, I should get on. Lovely to meet you.'],
};
