// aquarium.js — venue records, stock, species, shows, quiz and calendar events for the Maple Bay Aquarium (rooms 'aquarium', 'aquarium:deep', 'aquarium:deck', 'aquarium:lab'; city door 'door:aquarium').
// Registered additively at import time (same pattern as museum.js): VENUE_BY_ID gets 'aquarium' (the place: hours), 'aquarium:shop' (Tide & Trinket) and 'aquarium:cafe' (The Galley);
// ITEMS / ITEM_BY_ID get the `aqua_*` items; MOODLETS gets 'sea_struck', 'jelly_calm', 'shark_sleeper'; calendar EVENTS gets the five aquarium dates below.
//   AQ_HOURS(weekday) -> [open, close]   AQ_TICKET   AQ_PASS   AQ_FEED   AQ_ADOPT   LATE { weekday, to }   SLEEPOVER { day, from, to }   AQ_VENUES { place, shop, cafe }
//   SHOWS [{ id, name, at: [hours], dur (h), room, where }]   ZONES { id: { name, need } }   SPECIES { id: { zone, name, fact, live? } }   TOUCH [{ id, name, feel }]
//   PENGUINS [name]   QUIZ [{ q, a: [..], ok }]   TURTLE_NAMES   NEW_ITEM_IDS
import './venues_extra.js';
import { VENUE_BY_ID } from './venues.js';
import { ITEMS, ITEM_BY_ID, DISHES, GIFTS, MISC } from './items.js';
import * as ALL from './items.js';
import { MOODLETS } from './needs.js';
import { EVENTS } from './calendar.js';

export const AQ_TICKET = 8, AQ_PASS = 45, AQ_FEED = 2, AQ_ADOPT = 25, CARE_DAYS = 3;
export const LATE = { weekday: 3, from: 19, to: 22 }, SLEEPOVER = { day: 13, from: 20, to: 31 };
export const AQ_HOURS = wd => (wd === LATE.weekday ? [9, LATE.to] : [9, 18]);
export const AQ_VENUES = { place: 'aquarium', shop: 'aquarium:shop', cafe: 'aquarium:cafe' };
const HRS = [0, 1, 2, 3, 4, 5, 6].map(AQ_HOURS);
const venue = (id, name, type, offers, blurb) => (VENUE_BY_ID[id] = VENUE_BY_ID[id] || { id, name, type, district: 'harbor', where: 'On the boardwalk at the river mouth', station: null, interior: true, hours: HRS, offers, priceMult: 1, jobId: null, delivers: false, blurb, showpiece: true });
venue(AQ_VENUES.place, 'Maple Bay Aquarium', 'leisure', { functions: [] }, 'A walk-through shark tunnel, a room of glowing jellyfish, penguins, sea otters and a touch pool, under a roof shaped like three waves.');
venue(AQ_VENUES.shop, 'Tide & Trinket', 'shop', { shop: ['gift', 'misc', 'book'], functions: ['till'] }, 'Plush otters, glow-in-the-dark jellyfish and good books about the sea: the aquarium gift shop.');
venue(AQ_VENUES.cafe, 'The Galley', 'food', { menu: true, functions: ['seat', 'till'] }, 'Chowder in a bread bowl and fish-shaped waffles, at a table beside the reef tank.');

const mood = (id, o) => { if (!MOODLETS[id]) MOODLETS[id] = Object.assign({ workPerf: 1, walkSpeed: 1, source: 'activity' }, o); };
mood('sea_struck', { name: 'Sea-Struck', desc: 'A shark went over your head and you have not stopped grinning. +10% logic xp.', mood: 7, minutes: 300, skillXpMult: { logic: 1.1 } });
mood('jelly_calm', { name: 'Jellyfish Calm', desc: 'You watched the jellies pulse until your own pulse slowed down to match.', mood: 6, minutes: 360 });
mood('shark_sleeper', { name: 'Slept with the Sharks', desc: 'A night in a sleeping bag under the tunnel. You dreamt in blue.', mood: 9, minutes: 600 });

export const SHOWS = [
  { id: 'penguin', name: 'Penguin Feeding', at: [11.5, 15.5], dur: .6, room: 'aquarium', where: 'Penguin Cove' },
  { id: 'rays', name: 'Ray Bay Feeding', at: [12.25], dur: .5, room: 'aquarium', where: 'Ray Bay, Tropical Reef' },
  { id: 'otter', name: 'Sea Otter Feeding & Keeper Talk', at: [13, 16.5], dur: .75, room: 'aquarium:deck', where: 'Harbor Deck' },
  { id: 'dive', name: 'Dive Show in the Big Blue', at: [14], dur: .6, room: 'aquarium', where: 'the Big Blue tank, main hall' },  { id: 'turtle', name: 'Turtle Feeding & Keeper Talk', at: [10.75, 15], dur: .75, room: 'aquarium:turtles', where: 'Turtle Lagoon' },
  { id: 'octo', name: 'Meet the Octopus', at: [12], dur: .6, room: 'aquarium:deep', where: 'the octopus den, the Abyss' },
];
export const ZONES = { local: { name: 'Local Waters', need: 6 }, reef: { name: 'Tropical Reef', need: 8 }, turtles: { name: 'Turtle Lagoon', need: 4 }, tunnel: { name: 'Ocean Tunnel', need: 6 }, jelly: { name: 'Jellyfish Gallery', need: 4 }, abyss: { name: 'The Abyss', need: 5 }, coast: { name: 'Coast & Cove', need: 2 } };
// the four residents of the Turtle Lagoon (sprite key = species id)
export const TURTLES = [{ id: 'moss', sp: 'turtle', name: 'Moss', kind: 'green sea turtle', note: 'Curious. Comes to the glass to look at you.' }, { id: 'biscotti', sp: 'logger', name: 'Biscotti', kind: 'loggerhead', note: 'Sleeps on the sand most of the afternoon.' }, { id: 'opal', sp: 'hawks', name: 'Opal', kind: 'hawksbill', note: 'Small and quick. Weaves through the coral.' }, { id: 'tom', sp: 'leather', name: 'Old Tom', kind: 'leatherback', note: 'Two metres long, sixty years old, never in a hurry.' }];
export const SPECIES = {
  seal: { zone: 'local', name: 'Harbor seal', fact: 'Harbor seals can hold their breath for half an hour and sleep underwater, bobbing up to breathe without waking. The pool above this window is on the Harbor Deck.' },
  rockfish: { zone: 'local', name: 'Copper rockfish', fact: 'A copper rockfish can live for fifty years and spend most of them within a few metres of the same rock.' },
  eel: { zone: 'local', name: 'Wolf eel', fact: 'Not an eel and not a wolf: a shy fish with a face like a boxing glove. Wolf eels pair for life and share one den.' },
  greenling: { zone: 'local', name: 'Kelp greenling', fact: 'Greenlings patrol the kelp like nervous shopkeepers. The males guard the eggs.' },
  perch: { zone: 'local', name: 'Shiner perch', fact: 'The silver flickers at the top of the kelp. Shiner perch give birth to live young, already able to swim.' },
  garibaldi: { zone: 'local', name: 'Garibaldi', fact: 'Bright orange and fearless. A garibaldi tends a garden of red algae and will charge a diver ten times its size to defend it.' },
  sunstar: { zone: 'local', name: 'Ochre sea star', fact: 'Touch-pool resident. A sea star has no brain and no blood: it pumps sea water through its body instead, and can regrow a lost arm.', touch: 1 },
  clown: { zone: 'reef', name: 'Clownfish', fact: 'Every clownfish is born male. The biggest in the anemone becomes the female; if she goes, the next in line changes to take her place.' },
  tang: { zone: 'reef', name: 'Blue tang', fact: 'Blue tangs have a scalpel-sharp spine at the base of the tail, which is why they are also called surgeonfish.' },
  ytang: { zone: 'reef', name: 'Yellow tang', fact: 'By day, sunshine yellow. At night a yellow tang fades and grows a white stripe, like putting on pyjamas.' },
  butterfly: { zone: 'reef', name: 'Butterflyfish', fact: 'The dark stripe hides the eye, so a hungry mouth cannot tell which end is the front.' },
  seahorse: { zone: 'reef', name: 'Seahorse', fact: 'The father carries the eggs in a pouch and gives birth to hundreds of young the size of an eyelash.' },
  ray: { zone: 'reef', name: 'Bat ray', fact: 'Ray Bay residents. Bat rays feel like wet velvet and find clams by flapping the sand away with their wings.' },
  urchin: { zone: 'local', name: 'Purple sea urchin', fact: 'Touch-pool resident. The spines are for walking as much as for defence: an urchin strolls about on them like stilts.', touch: 1 },
  anemone: { zone: 'local', name: 'Giant green anemone', fact: 'Touch-pool resident. An animal that looks like a flower and can live for a century on the same rock.', touch: 1 },
  crab: { zone: 'local', name: 'Hermit crab', fact: 'Touch-pool resident. It wears a borrowed snail shell and trades up when it grows, sometimes in a queue with its neighbours.', touch: 1 },
  lionfish: { zone: 'reef', name: 'Lionfish', fact: 'Every one of those lovely fan spines is venomous. It herds small fish into a corner with them, like a matador with eighteen capes.' },
  puffer: { zone: 'reef', name: 'Porcupine pufferfish', fact: 'When alarmed it gulps water until it is a spiky ball three times its size. Stand close to the glass and it may show you.' },
  moray: { zone: 'reef', name: 'Green moray eel', fact: 'It is not snarling: a moray has to open and close its mouth to breathe. It has a second set of jaws in its throat, which is less reassuring.' },
  shrimp: { zone: 'reef', name: 'Cleaner shrimp', fact: 'The moray lets these shrimp walk right into its mouth to pick its teeth clean. Nobody eats the dentist.' },
  gardeneel: { zone: 'reef', name: 'Spotted garden eel', fact: 'A whole lawn of them sways in the current, tails anchored in the sand. Walk up to the glass and watch the lawn disappear.' },
  cuttle: { zone: 'reef', name: 'Cuttlefish', fact: 'Colour-blind, and yet it can match any background in under a second. Watch it for a minute: it is never the same colour twice.' },
  parrot: { zone: 'reef', name: 'Parrotfish', fact: 'It bites off coral with a beak, grinds it up, and what comes out the other end is white sand. Most tropical beaches are parrotfish work.' },
  turtle: { zone: 'turtles', name: 'Green sea turtle', fact: 'Named for the colour of its fat, from a lifetime of eating seagrass. Green turtles come back to nest on the very beach where they hatched. Moss lives in the lagoon; another green swims the Ocean Tunnel.', live: 1 },
  logger: { zone: 'turtles', name: 'Loggerhead turtle', fact: 'The big head holds jaws that crack whelks and crabs like walnuts. Biscotti came to us with a boat-strike scar on her shell and has never left.', live: 1 },
  hawks: { zone: 'turtles', name: 'Hawksbill turtle', fact: 'The narrow beak picks sponges out of cracks in the reef. Hawksbills are the rarest turtle here: Opal is one of perhaps twenty thousand nesting females left.', live: 1 },
  leather: { zone: 'turtles', name: 'Leatherback turtle', fact: 'The largest turtle on Earth, with a shell like ridged rubber instead of plates. Leatherbacks dive deeper than a kilometre and eat almost nothing but jellyfish. Old Tom surfaces to breathe every few minutes.', live: 1 },
  hatchling: { zone: 'turtles', name: 'Turtle hatchlings', fact: 'Head-start hatchlings from a nest that was dug too close to the tide line. They paddle without stopping for their first days, as if the open sea were just ahead. In spring they go back to their beach.' },
  blacktip: { zone: 'tunnel', name: 'Blacktip reef shark', fact: 'The neat black fin tips are the giveaway. Blacktips are shy, fast, and patrol in pairs.', live: 1 },
  hammerhead: { zone: 'tunnel', name: 'Scalloped hammerhead', fact: 'The wide head spreads the eyes and the electric sense far apart, so it can find a ray buried under the sand.', live: 1 },
  manta: { zone: 'tunnel', name: 'Manta ray', fact: 'The largest brain of any fish, and no sting at all. It rolls up the two fins on its head to funnel plankton into its mouth.', live: 1 },
  mola: { zone: 'tunnel', name: 'Ocean sunfish (mola)', fact: 'The heaviest bony fish in the sea: a swimming head with a fin above and a fin below. It lies on its side at the surface to sunbathe.', live: 1 },
  sandtiger: { zone: 'tunnel', name: 'Sand tiger shark', fact: 'All those teeth and a gentle temper. Sand tigers gulp air at the surface to hover perfectly still in the water.', live: 1 },
  leopard: { zone: 'tunnel', name: 'Leopard shark', fact: 'Spotted like its namesake and harmless to people. Leopard sharks cruise the sand for crabs and worms.', live: 1 },
  ray3: { zone: 'tunnel', name: 'Spotted eagle ray', fact: 'Eagle rays fly rather than swim, and can leap clear of the water.', live: 'ray' },
  sardine: { zone: 'tunnel', name: 'Pacific sardine', fact: 'A school turns as one animal: each fish only watches its nearest neighbours.', live: 1 },
  bass: { zone: 'tunnel', name: 'Giant sea bass', fact: 'Bigger than the keeper who feeds it, and older too. Giant sea bass can reach seventy-five years.', live: 1 },
  moon: { zone: 'jelly', name: 'Moon jelly', fact: 'No brain, no heart, no bones: ninety-five percent water, and they have been doing it for five hundred million years.' },
  nettle: { zone: 'jelly', name: 'Pacific sea nettle', fact: 'The long frilly arms carry food to the mouth. The tank is round and has no corners so a jelly can never get stuck.' },
  comb: { zone: 'jelly', name: 'Comb jelly', fact: 'Not a true jellyfish. The rainbow running down its sides is light scattering off rows of tiny beating hairs.' },
  lion: { zone: 'jelly', name: "Lion's mane jelly", fact: 'The largest jelly known: the bell can be wider than a doorway, the tentacles longer than a blue whale.' },
  upside: { zone: 'jelly', name: 'Upside-down jelly', fact: 'It lies on its back on the bottom and farms algae in its arms, like a garden bed that pulses.' },
  crystal: { zone: 'jelly', name: 'Crystal jelly', fact: 'Almost invisible until the rim lights up green. The protein that makes that glow won a Nobel Prize.' },
  nautilus: { zone: 'abyss', name: 'Chambered nautilus', fact: 'A living fossil that bobs up and down by pumping gas between the chambers of its shell. Its design has not changed in 500 million years.' },
  spidercrab: { zone: 'abyss', name: 'Giant spider crab', fact: 'Leg to leg it is wider than a car is long. It walks the deep sea floor very slowly and can live for a century.' },
  firefly: { zone: 'abyss', name: 'Firefly squid', fact: 'Each squid is the length of a finger and covered in blue lights. In spring they rise by the million and the sea glows.' },
  angler: { zone: 'abyss', name: 'Anglerfish', fact: 'The light on the rod is made by glowing bacteria. In the dark a meal swims toward it of its own accord.' },
  isopod: { zone: 'abyss', name: 'Giant isopod', fact: 'A woodlouse the size of a cat. Ours once went five years without eating and did not seem to mind.' },
  vampire: { zone: 'abyss', name: 'Vampire squid', fact: 'Neither vampire nor squid. When alarmed it pulls its webbed arms over its head like a cloak.' },
  lantern: { zone: 'abyss', name: 'Lanternfish', fact: 'The most numerous fish on Earth. Every night they rise a kilometre to feed and sink again before dawn.' },
  octopus: { zone: 'abyss', name: 'Giant Pacific octopus', fact: 'Three hearts, blue blood and nine brains. Ours opens jars, and once dismantled the tank filter out of boredom.' },
  penguin: { zone: 'coast', name: 'Magellanic penguin', fact: 'They bray like donkeys and recognise their mate by voice. Each of ours wears a coloured wing band so the keepers can tell them apart.' },
  otter: { zone: 'coast', name: 'Sea otter', fact: 'A million hairs to the square inch, a favourite rock kept in a pocket of skin under the arm, and they hold paws while they sleep so they do not drift apart.' },
};
export const TOUCH = [
  { id: 'sunstar', name: 'ochre sea star', feel: 'Rough as a cat\'s tongue, and stronger than it looks: the arm grips your finger with a hundred tiny feet.' },
  { id: 'urchin', name: 'purple urchin', feel: 'The spines close gently around your fingertip, like a handshake from a hairbrush.' },
  { id: 'anemone', name: 'giant green anemone', feel: 'Sticky! The tentacles cling for a second, deciding whether you are food, and let go.' },
  { id: 'crab', name: 'hermit crab', feel: 'It tickles across your palm, changes its mind, and vanishes into its borrowed shell.' },
];
export const PENGUINS = ['Pebble', 'Skipper', 'Waddles', 'Olive', 'Pickles', 'Admiral'];
export const TURTLE_NAMES = ['Juniper', 'Biscuit', 'Captain'];
export const QUIZ = [
  { q: 'Which fish is every bit as orange as a traffic cone and guards its own garden?', a: ['Garibaldi', 'Yellow tang', 'Copper rockfish'], ok: 0 },
  { q: 'How does a sand tiger shark hover so still?', a: ['It holds on with its fins', 'It gulps air at the surface', 'It is asleep'], ok: 1 },
  { q: 'Who carries the eggs in a seahorse family?', a: ['The mother', 'The father', 'Neither: they are buried'], ok: 1 },
  { q: 'What makes the anglerfish\'s lure glow?', a: ['A tiny battery', 'Moonlight', 'Glowing bacteria'], ok: 2 },
  { q: 'Why do sea otters hold paws when they sleep?', a: ['So they do not drift apart', 'To keep warm', 'They are shy'], ok: 0 },
  { q: 'How much of a moon jelly is water?', a: ['About half', 'About 95 percent', 'None'], ok: 1 },
];

const SH = [AQ_VENUES.shop], CF = [AQ_VENUES.cafe];
const gift = (id, name, price, icon, relationship, giftTags) => ({ id, name, category: 'gift', price, icon, effects: {}, stack: 3, soldAt: SH, relationship, giftTags });
const dish = (id, name, price, effects, eatMinutes, course, icon) => ({ id, name, category: 'dish', price, icon, effects, stack: 1, soldAt: CF, venue: CF[0], eatMinutes, course, takeaway: false });
const book = (id, name, skill, price, xpTotal, icon) => ({ id, name, category: 'book', price, icon, effects: {}, stack: 1, soldAt: SH, kind: 'skill', skill, minLevel: 1, maxLevel: 6, xpTotal, readMinutes: xpTotal });
const misc = (id, name, icon, note, price = 0, soldAt = []) => ({ id, name, category: 'misc', price, icon, effects: {}, stack: 1, soldAt, note });
const NEW = [
  gift('aqua_plush_turtle', 'Plush Sea Turtle', 14, 'green soft turtle, patchwork shell', 7, ['cute']),
  gift('aqua_plush_octopus', 'Plush Octopus', 13, 'red soft octopus, curly arms', 6, ['cute', 'nerdy']),
  gift('aqua_plush_manta', 'Plush Manta Ray', 13, 'dark soft manta, white belly', 6, ['cute']),
  gift('aqua_plush_otter', 'Finn the Plush Otter', 15, 'brown soft otter holding a shell', 7, ['cute']),
  gift('aqua_plush_shark', 'Plush Sand Tiger', 14, 'grey soft shark, felt teeth', 6, ['cute', 'nerdy']),
  gift('aqua_plush_penguin', 'Plush Penguin', 13, 'black and white soft penguin', 6, ['cute']),
  gift('aqua_glow_jelly', 'Glow-in-the-Dark Jellyfish', 11, 'pale rubber jellyfish, glowing', 6, ['cute', 'arty']),
  gift('aqua_turtle_keyring', 'Sea Turtle Keyring', 6, 'small green enamel turtle', 4, ['cute']),
  gift('aqua_shell_necklace', 'Shell Necklace', 12, 'cord with a spiral shell', 7, ['fancy']),
  gift('aqua_postcards', 'Aquarium Postcard Set', 4, 'fan of blue postcards', 3, ['cute', 'arty']),
  gift('aqua_snowglobe', 'Shark Tunnel Snow Globe', 11, 'glass globe, tiny shark', 5, ['cute']),
  book('aqua_book_tidepools', 'Tide Pools of Maple Bay', 'logic', 18, 300, 'teal book, orange sea star'),
  book('aqua_book_sketch', 'Drawing the Kelp Forest', 'creativity', 18, 300, 'green book, kelp fronds'),
  misc('aqua_badge', 'Junior Marine Biologist Badge', 'round blue badge, white fish', 'For five out of six on the Fish Detective quiz. Not for sale.'),
  misc('aqua_certificate', 'Penguin Adoption Certificate', 'cream certificate, penguin stamp', 'Your penguin\'s name is on it, and yours is on the board at Penguin Cove.'),
  misc('aqua_release_photo', 'Photo: The Release', 'photo of a turtle on wet sand', 'The moment the turtle reached the water at Gull Point Beach. Yours to keep.'),
  misc('aqua_sleepover_patch', 'Slept with the Sharks Patch', 'navy patch, sleeping shark', 'Sewn-on proof of a night in the Ocean Tunnel.'),
  dish('aqua_kelp_latte', 'Kelp Forest Matcha Latte', 4.5, { energy: 12, fun: 3, caffeine: true }, 6, 'drink', 'green latte, leaf art'),
  dish('aqua_lagoon_soda', 'Blue Lagoon Soda', 3.5, { energy: 5, fun: 8 }, 5, 'drink', 'blue fizzy drink, paper fish'),
  dish('aqua_fish_waffle', 'Fish-Shaped Waffle', 4, { hunger: 14, fun: 8 }, 6, 'snack', 'golden fish-shaped waffle'),
  dish('aqua_chowder_bowl', 'Chowder in a Bread Bowl', 8.5, { hunger: 44, fun: 4 }, 14, 'main', 'round loaf full of cream soup'),
  dish('aqua_harbor_tacos', 'Harbor Veggie Tacos', 7.5, { hunger: 36, fun: 6 }, 12, 'main', 'two tacos, lime wedge'),
  dish('aqua_jelly_cup', 'Jellyfish Jelly Cup', 5, { hunger: 10, fun: 12 }, 7, 'dessert', 'wobbly blue jelly, cream cap'),
];
export const NEW_ITEM_IDS = NEW.map(i => i.id);
const LISTS = { gift: GIFTS, misc: MISC, dish: DISHES, book: ALL.BOOKS };
for (const it of NEW) { if (ITEM_BY_ID[it.id]) continue; ITEMS.push(it); ITEM_BY_ID[it.id] = it; if (Array.isArray(LISTS[it.category])) LISTS[it.category].push(it); }

if (!EVENTS.some(e => e.id === 'aqua_sleepover')) EVENTS.push(
  { id: 'aqua_sleepover', name: 'Sleep with the Sharks', kind: 'seasonal', when: { season: 'any', days: [SLEEPOVER.day] }, hours: [SLEEPOVER.from, SLEEPOVER.to], place: { venue: 'aquarium' }, blurb: 'Once a month the Maple Bay Aquarium stays open all night. Bring nothing: sleeping bags are laid out in the Ocean Tunnel, the lights go down to blue, and the sharks keep going round. Included with a ticket or an annual pass.', special: { crowdMult: 1.2 }, notify: 3 },
  { id: 'aqua_after_dark', name: 'Jellies After Dark', kind: 'weekly', when: { weekday: LATE.weekday }, hours: [LATE.from, LATE.to], place: { venue: 'aquarium' }, blurb: 'Thursday is the grown-ups\' evening: the aquarium stays open until ten, the hall lights go down, and the Jellyfish Gallery is at its best. The Galley serves late.', special: { crowdMult: 1.3 }, notify: 2 },
  { id: 'aqua_dive_show', name: 'Shark Dive Spectacular', kind: 'weekly', when: { weekday: 5 }, hours: [14, 14.5], place: { venue: 'aquarium' }, blurb: 'Saturday at two: Captain Kai dives the Big Blue tank in the main hall, hand-feeds the fish and waves back if you wave first. (A shorter dive show runs every day at 14:00.)', special: { crowdMult: 1.4 }, notify: 2 },
  { id: 'aqua_penguin_parade', name: 'Penguin Feeding & Parade', kind: 'weekly', when: { weekday: 6 }, hours: [11.5, 12], place: { venue: 'aquarium' }, blurb: 'Sunday at half past eleven at Penguin Cove: the bucket comes out and six penguins forget their manners. Ask the keeper and you may feed one yourself. (Feedings run every day at 11:30 and 15:30.)', special: { crowdMult: 1.3 }, notify: 2 },
  { id: 'aqua_toddler_tuesday', name: 'Toddler Tuesday at the Touch Pool', kind: 'weekly', when: { weekday: 1 }, hours: [10, 11.5], place: { venue: 'aquarium' }, blurb: 'Small hands, big sea stars. Tuesday mornings the touch pool in Local Waters belongs to the under-fives, and the otter talk on the Harbor Deck is told very slowly.', special: { crowdMult: 1.2 }, notify: 2 });
