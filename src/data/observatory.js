// observatory.js — venue records, stock, show programmes, sky objects and texts for the Maple Bay Observatory (rooms 'observatory', 'observatory:planetarium', 'observatory:roof').
// Registered additively at import time (same pattern as conservatory.js): VENUE_BY_ID gets 'observatory' (the place: hours, blurb), 'observatory:shop' (The Star Shop)
// and 'observatory:cocoa' (Comet Cocoa); ITEMS / ITEM_BY_ID get the `obs_*` items; MOODLETS gets 'starstruck'; calendar EVENTS gets the weekly 'obs_star_party'.
//   OBS_HOURS [open, close]   OBS_TICKET ($)   OBS_VENUES { place, shop, cocoa }   SHOW_TIMES [hours]   TALK_TIMES [hours]   PARTY { weekday, hours }
//   PROGRAMMES [{ id, title, blurb, dur (s), captions: [[t, text]], bonus? }]   OBJECTS [{ id, name, kind, note, seasons?, ... }] (the telescope logbook)
//   METEORITES [{ title, text }]   TALKS [{ title, lines }]   FACTS { exhibitKey: text }   NEW_ITEM_IDS   (constellations: art/showpiece/_obs_lib.js)
import './venues_extra.js';
import { VENUE_BY_ID } from './venues.js';
import { ITEMS, ITEM_BY_ID, DISHES, GIFTS, MISC } from './items.js';
import { MOODLETS } from './needs.js';
import { EVENTS } from './calendar.js';

export const OBS_HOURS = [13, 24], OBS_TICKET = 6, SHOW_TIMES = [14, 16, 18, 20, 22], TALK_TIMES = [15, 17], PARTY = { weekday: 5, hours: [20, 24] };
export const OBS_VENUES = { place: 'observatory', shop: 'observatory:shop', cocoa: 'observatory:cocoa' };
const DAILY = (o, c) => [0, 1, 2, 3, 4, 5, 6].map(() => [o, c]);
const venue = (id, name, type, offers, blurb) => (VENUE_BY_ID[id] = VENUE_BY_ID[id] || { id, name, type, district: 'hillcrest', where: 'on top of Hillcrest, beside the lookout', station: null, interior: true, hours: DAILY(OBS_HOURS[0], OBS_HOURS[1]), offers, priceMult: 1, jobId: null, delivers: false, blurb, showpiece: true });
venue(OBS_VENUES.place, 'Maple Bay Observatory', 'leisure', { functions: [] }, 'The white dome on Hillcrest: a Foucault pendulum, a planetarium, a great brass telescope and the whole city glittering below the terrace.');
venue(OBS_VENUES.shop, 'The Star Shop', 'shop', { shop: ['gift', 'misc'], functions: ['till'] }, 'Star wheels, pocket meteorites and a plush Saturn by the observatory door.');
venue(OBS_VENUES.cocoa, 'Comet Cocoa', 'food', { menu: true, functions: ['seat', 'till'] }, 'Hot cocoa for cold nights at the eyepiece. The Supernova has too many marshmallows on purpose.');

if (!MOODLETS.starstruck) MOODLETS.starstruck = { name: 'Starstruck', desc: 'You looked up for a long time. Everything down here feels pleasantly small.', mood: 7, workPerf: 1, walkSpeed: 1, minutes: 300, source: 'activity' };
if (!EVENTS.some(e => e.id === 'obs_star_party')) EVENTS.push({ id: 'obs_star_party', name: 'Star Party at the Observatory', kind: 'weekly', when: { weekday: PARTY.weekday }, hours: PARTY.hours, place: { venue: OBS_VENUES.place },
  blurb: 'Every Saturday night the amateur astronomers of Maple Bay set up their telescopes on the observatory terrace. Look through all of them. Free cocoa. Clouded out? The party moves under the planetarium dome.', special: { crowdMult: 1.2 }, notify: 3 });

const SF = [OBS_VENUES.shop], CF = [OBS_VENUES.cocoa];
const gift = (id, name, price, icon, relationship, giftTags) => ({ id, name, category: 'gift', price, icon, effects: {}, stack: 3, soldAt: SF, relationship, giftTags });
const misc = (id, name, price, icon, note) => ({ id, name, category: 'misc', price, icon, effects: {}, stack: 1, soldAt: SF, note });
const dish = (id, name, price, effects, eatMinutes, course, icon) => ({ id, name, category: 'dish', price, icon, effects, stack: 1, soldAt: CF, venue: CF[0], eatMinutes, course, takeaway: false });
const NEW = [
  misc('obs_starwheel', 'Planisphere Star Wheel', 8, 'navy card disc, gold stars', 'Dial in the date and it shows the sky. Tracing constellations at the observatory shows you the lines.'),
  misc('obs_logbook', "Observer's Logbook", 6, 'navy notebook, gold moon', 'Sky notes kept properly: +25% logic from the telescopes and constellation finders.'),
  misc('obs_redtorch', 'Red Torch', 5, 'small red flashlight', 'Red light keeps your night vision. Moon sketches go a quarter faster.'),
  gift('obs_gift_postcards', 'Nebula Postcards', 3, 'fan of postcards, pink nebula', 3, ['cute']),
  gift('obs_gift_glowstars', 'Glow-in-the-Dark Stars', 5, 'pale green stars on a card', 5, ['cute', 'fun']),
  gift('obs_gift_saturn', 'Plush Saturn', 12, 'soft yellow planet with a felt ring', 7, ['cute']),
  gift('obs_gift_meteorite', 'Pocket Meteorite', 14, 'small dark iron stone in a tin', 8, ['fancy', 'rare']),
  gift('obs_gift_moonlamp', 'Little Moon Lamp', 16, 'glowing cratered ball on a stand', 8, ['fancy', 'cute']),
  gift('obs_gift_rocket', 'Tin Rocket', 9, 'red and white wind-up rocket', 6, ['cute', 'fun']),
  gift('obs_gift_icecream', 'Astronaut Ice Cream', 4, 'silver foil packet, pink block', 4, ['sweet', 'fun']),
  gift('obs_comet_print', 'Comet Discovery Print', 30, 'framed photo of a comet, brass plate', 12, ['fancy', 'rare']),
  dish('obs_cocoa', 'Comet Cocoa', 3.5, { fun: 7, energy: 5, hunger: 4 }, 6, 'drink', 'navy mug of cocoa, cream swirl'),
  dish('obs_supernova', 'Supernova Cocoa', 5, { fun: 12, energy: 6, hunger: 8, moodlet: 'sweet_treat' }, 8, 'drink', 'mug piled with marshmallows and sparks'),
  dish('obs_moon_pie', 'Moon Pie', 3, { hunger: 14, fun: 6 }, 5, 'snack', 'round chocolate sandwich biscuit'),
  dish('obs_galaxy_donut', 'Galaxy Doughnut', 3.5, { hunger: 16, fun: 8 }, 6, 'dessert', 'purple glazed ring with star sprinkles'),
  dish('obs_star_toastie', 'Starry Night Toastie', 6.5, { hunger: 34, fun: 3 }, 12, 'main', 'toasted sandwich, star cut-out'),
  dish('obs_orbit_soup', 'Orbit Tomato Soup', 5.5, { hunger: 26, fun: 3, energy: 3 }, 10, 'main', 'red soup, cream spiral'),
  dish('obs_night_tea', 'Night Owl Tea', 3, { energy: 10, fun: 3, caffeine: true }, 5, 'drink', 'glass mug of dark tea, lemon moon'),
];
NEW.find(i => i.id === 'obs_comet_print').soldAt = []; // a reward, never on the shelf
export const NEW_ITEM_IDS = NEW.map(i => i.id);
const LISTS = { gift: GIFTS, misc: MISC, dish: DISHES };
for (const it of NEW) { if (ITEM_BY_ID[it.id]) continue; if (it.effects && it.effects.moodlet && !MOODLETS[it.effects.moodlet]) delete it.effects.moodlet; ITEMS.push(it); ITEM_BY_ID[it.id] = it; if (LISTS[it.category]) LISTS[it.category].push(it); }

/* ---------- planetarium programmes (painters live in scenes/rooms/observatory2.js, keyed by id) ---------- */
export const PROGRAMMES = [
  { id: 'tonight', title: "Tonight's Sky over Maple Bay", dur: 72, blurb: 'The sun sets over the bay, the city lights fade, and the constellations of the season come out one by one.',
    captions: [[1, 'Good evening. This is the western sky from Hillcrest, a few minutes after sunset.'], [10, 'As the city lights dim, the first stars appear. The brightest are not stars at all: they are planets.'], [22, 'Join the dots and the old pictures appear. People have told stories about these shapes for five thousand years.'], [38, 'That soft band of light is the Milky Way: our own galaxy, seen edge-on, from the inside.'], [52, 'The Moon rises late tonight. Watch it climb.'], [64, 'All of this is above your head right now. Go up to the terrace and see for yourself.']] },
  { id: 'planets', title: 'Journey to the Planets', dur: 76, blurb: 'Leave Earth, skim the red deserts of Mars, fall past Jupiter\'s storm and sail through the rings of Saturn.',
    captions: [[1, 'We leave Earth behind. It takes light just over one second to get from here to the Moon.'], [13, 'Mars. A cold desert world, half the size of Earth, red with rust.'], [28, 'Jupiter, king of the planets. That red spot is a storm wider than our whole world.'], [44, 'Saturn. The rings are ice: billions of pieces, from snowflakes to houses.'], [60, 'Far out here the Sun is only the brightest star.'], [69, 'Time to turn around. Home is the pale blue dot.']] },
  { id: 'starbirth', title: 'Birth of a Star', dur: 70, blurb: 'A cold cloud of dust collapses, catches fire and shines for ten billion years, before going out with the biggest bang there is.',
    captions: [[1, 'Every star begins in the dark, inside a cloud of gas and dust called a nebula.'], [12, 'Gravity pulls the cloud together. As it shrinks, it spins, and it heats up.'], [24, 'At ten million degrees the centre ignites. A star is born.'], [38, 'For billions of years it burns steadily. Around it, the leftover dust gathers into planets.'], [52, 'A giant star does not fade quietly. It collapses, and then...'], [58, 'A supernova. For a few weeks it outshines its whole galaxy.'], [64, 'The iron in your blood was made in an explosion like that one.']] },
  { id: 'aurora', title: 'Northern Lights', dur: 68, blurb: 'A winter night far to the north. The sky begins to move: green curtains, then violet, rippling from horizon to horizon.',
    captions: [[1, 'A winter night, a long way north of Maple Bay. Snow, pines and no moon.'], [10, 'A faint green arch appears in the north. Wait for it.'], [20, 'Particles from the Sun are pouring down the Earth\'s magnetic field.'], [32, 'Where they strike the air, the air glows. Oxygen shines green; nitrogen, violet.'], [48, 'On a strong night the curtains fill the sky and move faster than you can turn your head.'], [60, 'And then, as quietly as it came, it fades.']] },
  { id: 'comet', title: 'The Maple Bay Comet', dur: 66, bonus: true, blurb: 'The comet found from this very dome: a snowball the size of a mountain, on its first visit in forty thousand years.',
    captions: [[1, 'This show is new. It is about a comet discovered from the dome above your heads.'], [10, 'A comet is a dirty snowball a few miles across. Far from the Sun it is dark and silent.'], [22, 'As it falls inward it warms. Ice turns straight to gas and streams away.'], [36, 'The tail always points away from the Sun, even when the comet is leaving.'], [48, 'It was found on three clear nights, by a staff astronomer and a patient friend with good eyes.'], [58, 'It will be back in about forty thousand years. Do come.']] },
];
export const PROG_BY_ID = Object.fromEntries(PROGRAMMES.map(p => [p.id, p]));

/* ---------- the telescope logbook ---------- */
// up(sky) decides whether the object can be seen: sky = { season, hf, moon (phase), moonUp }
export const OBJECTS = [
  { id: 'moon', name: 'The Moon', kind: 'moon', note: 'Craters, mountains and dark lava seas, sharp as a pin along the shadow line.' },
  { id: 'venus', name: 'Venus', kind: 'planet', seasons: [0, 1], before: 21.5, note: 'The evening star. Through the telescope it shows a phase, like a tiny brilliant moon.' },
  { id: 'mars', name: 'Mars', kind: 'planet', seasons: [3, 0], note: 'A small orange disc with one white polar cap. You are looking at a desert on another world.' },
  { id: 'jupiter', name: 'Jupiter', kind: 'planet', seasons: [2, 3, 0], note: 'Striped like a humbug, with four moons strung out in a line. They change places every night.' },
  { id: 'saturn', name: 'Saturn', kind: 'planet', seasons: [1, 2], note: 'The rings are really there. Everybody says "oh" the first time, out loud.' },
  { id: 'orion_nebula', name: 'The Orion Nebula', kind: 'nebula', seasons: [3], note: 'A glowing green-grey cloud in Orion\'s sword where stars are being born right now.' },
  { id: 'pleiades', name: 'The Pleiades', kind: 'cluster', seasons: [2, 3], note: 'The Seven Sisters: a tiny dipper of blue-white stars, wrapped in faint mist.' },
  { id: 'andromeda', name: 'The Andromeda Galaxy', kind: 'galaxy', seasons: [2], note: 'A soft oval smudge. The light left it two and a half million years ago.' },
  { id: 'ring_nebula', name: 'The Ring Nebula', kind: 'ring', seasons: [1], note: 'A grey smoke ring in Lyra: the last breath of a star like the Sun.' },
  { id: 'hercules', name: 'The Hercules Cluster', kind: 'globular', seasons: [0, 1], note: 'A ball of three hundred thousand stars, like sugar spilled on black velvet.' },
  { id: 'albireo', name: 'Albireo', kind: 'double', seasons: [1, 2], note: 'One star to the eye, two in the telescope: one gold, one sapphire blue.' },
  { id: 'whirlpool', name: 'The Whirlpool Galaxy', kind: 'spiral', seasons: [0], note: 'Two faint spiral arms, just at the edge of seeing. Look slightly to one side of it.' },
  { id: 'comet', name: 'Comet Halvorsen', kind: 'comet', bonus: true, note: 'A fuzzy head and a faint tail. Yours, in a way.' },
];
export const OBJ_BY_ID = Object.fromEntries(OBJECTS.map(o => [o.id, o]));

export const METEORITES = [
  { title: 'Iron Meteorite — "The Anvil"', text: 'Found by a farmer in 1911, who used it as a doorstop for nine years. It is the core of a shattered asteroid, four and a half billion years old, and the oldest thing you will ever touch. Please do. It is cold, and much heavier than it looks.' },
  { title: 'Stony Meteorite — a chondrite', text: 'Most meteorites look like this: a brown stone with a thin black crust, burned on in the ten seconds it spent falling through the air. Inside are tiny beads of rock that formed before the Earth did.' },
  { title: 'Pallasite — the gem from space', text: 'Honey-green olivine crystals set in shining metal. It formed at the boundary between the iron core and the rocky mantle of a small world that no longer exists.' },
];
export const FACTS = {
  pendulum: 'The pendulum swings in the same plane all day. It is the floor that turns: the whole Earth, rotating underneath it. One peg falls about every half hour.',
  orrery: 'Built by a Maple Bay clockmaker in 1894. One turn of the handle is one Earth year. Mercury takes 88 days; Saturn, at the edge, more than 29 years.',
  planets: 'If the Sun were this big, Earth would be a peppercorn and Jupiter a ping-pong ball. The distances would not fit in the building, or on the hill.',
  moonwall: 'The Moon makes no light of its own. Half of it is always lit by the Sun; the phases are just how much of the lit half we can see from here.',
  well: 'A coin circling the funnel is in orbit. As it loses energy to friction it falls inward and speeds up, exactly as a planet moves faster when it is close to the Sun.',
  scale: 'Your mass never changes, but weight is the pull of whatever world you stand on. The Moon pulls one sixth as hard as Earth; Jupiter, two and a half times harder.',
  rocket: 'Stomp the pad and the air has to go somewhere. Every rocket ever launched works the same way: throw something backwards, go forwards.',
  scope: 'The Great Refractor, 1894: a twelve-inch lens at the top of a tube fifteen feet long. It is balanced so well that one finger can move it.',
};
export const TALKS = [
  { title: 'Why is the night sky dark?', lines: ['If stars went on forever, every direction would end on a star, and the sky would blaze.', 'It does not. So the universe had a beginning: the light from far enough away has not arrived yet.', 'Every dark gap between the stars is a place where we are still waiting.'] },
  { title: 'How far is far?', lines: ['Light from the Moon is one second old. From the Sun, eight minutes.', 'From the nearest star, four years. From the far side of our galaxy, older than farming.', 'Looking out is looking back. A telescope is a time machine with one gear.'] },
  { title: 'Are we alone?', lines: ['There are more stars than grains of sand on every beach on Earth, and most of them have planets.', 'We have found thousands. A few are the right size, at the right distance.', 'Nobody knows the answer yet. I think that is the best kind of question.'] },
];
