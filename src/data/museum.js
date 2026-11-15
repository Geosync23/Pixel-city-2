// museum.js — venue records, stock, exhibits, audio guide, scavenger hunt and calendar events for the Museum of Maple Bay (room 'museum', city door 'door:museum').
// Registered additively at import time (same pattern as conservatory.js): VENUE_BY_ID gets 'museum' (the place: hours), 'museum:shop' (The Museum Shop) and 'museum:cafe' (Cafe Ammonite);
// ITEMS / ITEM_BY_ID get the `mus_*` items; MOODLETS gets 'cultured', 'mus_patron', 'mus_light'; calendar EVENTS gets 'mus_free_friday' and 'mus_curator_tour'.
//   MUS_HOURS(weekday) -> [open, close]   MUS_TICKET   MUS_MEMBER   MUS_AUDIO   FREE_EVE { weekday, from }   TOUR_TIMES   MUS_VENUES { place, shop, cafe }   MUS_VIS (merge into housing VIS)
//   WINGS { id: { name, need } }   EXHIBITS { id: { wing, name, text } } (paintings / photographs are added from the picture library as 'p:<id>')   AUDIO [{ n, ex, text }]   HUNT [{ id, clue, ex }]
//   FOSSILS [{ id, name, note }]   SPECIALS [{ title, blurb, side }]   NEW_ITEM_IDS
import './venues_extra.js';
import { VENUE_BY_ID } from './venues.js';
import { ITEMS, ITEM_BY_ID, DISHES, HOMEGOODS, GIFTS, MISC } from './items.js';
import * as ALL from './items.js';
import { MOODLETS } from './needs.js';
import { EVENTS } from './calendar.js';
import { PAINTINGS, PHOTOS } from '../art/showpiece/_mus_lib.js';

export const MUS_TICKET = 6, MUS_MEMBER = 40, MUS_AUDIO = 3, TOUR_TIMES = [11, 14, 16], FREE_EVE = { weekday: 4, from: 17 };
export const MUS_HOURS = wd => (wd === FREE_EVE.weekday ? [10, 21] : [10, 18]);
export const MUS_VENUES = { place: 'museum', shop: 'museum:shop', cafe: 'museum:cafe' };
const HRS = [0, 1, 2, 3, 4, 5, 6].map(MUS_HOURS);
const venue = (id, name, type, offers, blurb) => (VENUE_BY_ID[id] = VENUE_BY_ID[id] || { id, name, type, district: 'arts', where: 'Head of Maple Avenue, beside Campus Drive', station: null, interior: true, hours: HRS, offers, priceMult: 1, jobId: null, delivers: false, blurb, showpiece: true });
venue(MUS_VENUES.place, 'Museum of Maple Bay', 'leisure', { functions: [] }, 'Dinosaur bones, minerals, twenty-four paintings, the story of the city and a special exhibition that changes every season.');
venue(MUS_VENUES.shop, 'The Museum Shop', 'shop', { shop: ['homegood', 'gift', 'misc', 'book'], functions: ['till'] }, 'Prints, plush dinosaurs, geodes and good books, by the museum door.');
venue(MUS_VENUES.cafe, 'Cafe Ammonite', 'food', { menu: true, functions: ['seat', 'till'] }, 'Soup, toasted sandwiches and a shortbread shaped like a fossil.');

const mood = (id, o) => { if (!MOODLETS[id]) MOODLETS[id] = Object.assign({ workPerf: 1, walkSpeed: 1, source: 'activity' }, o); };
mood('cultured', { name: 'Cultured', desc: 'A head full of bones, paintings and old photographs. +10% logic and creativity xp.', mood: 6, minutes: 300, skillXpMult: { logic: 1.1, creativity: 1.1 } });
mood('mus_patron', { name: 'Patron of the Arts', desc: 'You put something in the box. It feels good to keep the lights on.', mood: 4, minutes: 240 });
mood('mus_light', { name: 'Hands Free', desc: 'Coat and bag are in the cloakroom. Shoulders down.', mood: 2, minutes: 180 });

const SH = [MUS_VENUES.shop], CF = [MUS_VENUES.cafe];
const print = (id, name, price, icon) => ({ id, name, category: 'homegood', price, icon, effects: {}, stack: 1, soldAt: SH, tag: 'decor', tier: 1, footprint: [2, 1], placement: 'wall', bonus: { mult: 1.1, ambience: 2 } });
const decor = (id, name, price, icon) => ({ id, name, category: 'homegood', price, icon, effects: {}, stack: 1, soldAt: SH, tag: 'decor', tier: 1, footprint: [1, 1], placement: 'floor', bonus: { mult: 1.1, ambience: 2 } });
const gift = (id, name, price, icon, relationship, giftTags) => ({ id, name, category: 'gift', price, icon, effects: {}, stack: 3, soldAt: SH, relationship, giftTags });
const dish = (id, name, price, effects, eatMinutes, course, icon) => ({ id, name, category: 'dish', price, icon, effects, stack: 1, soldAt: CF, venue: CF[0], eatMinutes, course, takeaway: false });
const book = (id, name, skill, price, xpTotal, icon) => ({ id, name, category: 'book', price, icon, effects: {}, stack: 1, soldAt: SH, kind: 'skill', skill, minLevel: 1, maxLevel: 6, xpTotal, readMinutes: xpTotal });
const NEW = [
  print('mus_print_dawn', 'Print: Harbour at Dawn', 24, 'framed print, pink dawn over masts'),
  print('mus_print_maple', 'Print: Maple No. 7', 20, 'framed print, one red maple leaf'),
  print('mus_print_tram', 'Print: Night Tram', 22, 'framed print, lit tram in the rain'),
  print('mus_print_koi', 'Print: Koi', 20, 'framed print, two fish in a circle'),
  decor('mus_dino_model', 'Marge: Desk Skeleton', 35, 'small dinosaur skeleton on a wooden base'),
  gift('mus_plush_rex', 'Plush Rex', 14, 'green soft dinosaur, tiny arms', 7, ['cute']),
  gift('mus_ammonite', 'Ammonite Replica', 9, 'spiral fossil, sandy brown', 6, ['fancy', 'nerdy']),
  gift('mus_geode', 'Amethyst Geode', 16, 'split grey stone, purple crystals', 8, ['fancy']),
  gift('mus_postcards', 'Gallery Postcard Set', 4, 'fan of art postcards', 3, ['cute', 'arty']),
  gift('mus_tin_robot', 'Wind-Up Tin Robot', 12, 'red tin robot, brass key', 6, ['cute', 'nerdy']),
  gift('mus_snowglobe', 'Maple Bay Snow Globe', 11, 'glass globe, tiny skyline', 5, ['cute']),
  book('mus_book_history', 'Maple Bay: A Short History', 'logic', 18, 300, 'navy book, gold lighthouse'),
  book('mus_book_looking', 'How to Look at Paintings', 'creativity', 18, 300, 'cream book, red square'),
  { id: 'mus_sketchkit', name: 'Gallery Sketching Kit', category: 'misc', price: 12, icon: 'grey sketchbook, three pencils', effects: {}, stack: 1, soldAt: SH, note: 'Sketching in the museum goes a quarter faster with proper pencils.' },
  { id: 'mus_badge', name: 'Junior Curator Badge', category: 'misc', price: 0, icon: 'round brass badge, tiny dinosaur', effects: {}, stack: 1, soldAt: [], note: 'For finishing the museum scavenger hunt. Not for sale.' },
  dish('mus_curator_coffee', "Curator's Coffee", 3.5, { energy: 12, fun: 2, caffeine: true }, 6, 'drink', 'white cup, dark coffee'),
  dish('mus_mammoth_cocoa', 'Mammoth Hot Chocolate', 4.5, { energy: 6, fun: 9 }, 7, 'drink', 'big mug, cream, cocoa tusks'),
  dish('mus_fossil_shortbread', 'Fossil Shortbread', 3, { hunger: 10, fun: 6 }, 5, 'snack', 'biscuit stamped with a spiral'),
  dish('mus_tomato_soup', 'Tomato Soup & Bread', 6.5, { hunger: 32, fun: 3 }, 12, 'main', 'red soup bowl, bread roll'),
  dish('mus_grilled_cheese', 'Gallery Grilled Cheese', 7.5, { hunger: 40, fun: 5 }, 14, 'main', 'golden toasted sandwich, cut in triangles'),
  dish('mus_lemon_dome', 'Lemon Dome', 5.5, { hunger: 14, fun: 11 }, 9, 'dessert', 'yellow dome cake, copper-green glaze'),
];
export const NEW_ITEM_IDS = NEW.map(i => i.id);
const LISTS = { homegood: HOMEGOODS, gift: GIFTS, misc: MISC, dish: DISHES, book: ALL.BOOKS };
for (const it of NEW) { if (ITEM_BY_ID[it.id]) continue; ITEMS.push(it); ITEM_BY_ID[it.id] = it; if (Array.isArray(LISTS[it.category])) LISTS[it.category].push(it); }
export const MUS_VIS = { mus_print_dawn: { a: 'wall.mus_print', p: { k: 'dawn' } }, mus_print_maple: { a: 'wall.mus_print', p: { k: 'maple7' } }, mus_print_tram: { a: 'wall.mus_print', p: { k: 'tram' } }, mus_print_koi: { a: 'wall.mus_print', p: { k: 'koi' } }, mus_dino_model: { a: 'mus_dino', p: {} } };

if (!EVENTS.some(e => e.id === 'mus_free_friday')) EVENTS.push(
  { id: 'mus_free_friday', name: 'Free Friday Evening at the Museum', kind: 'weekly', when: { weekday: FREE_EVE.weekday }, hours: [FREE_EVE.from, 21], place: { venue: 'museum' }, blurb: 'Every Friday the Museum of Maple Bay stays open until nine and nobody pays a cent after five. The cafe does a roaring trade in hot chocolate.', special: { crowdMult: 1.4 }, notify: 2 },
  { id: 'mus_curator_tour', name: "Curator's Highlights Tour", kind: 'weekly', when: { weekday: 5 }, hours: [14, 15], place: { venue: 'museum' }, blurb: 'Saturday at two: the long tour, from Marge the tyrannosaur to Harbour at Dawn. Free with a ticket; meet the docent at the info desk. (Shorter tours run every day at 11:00, 14:00 and 16:00.)', special: {}, notify: 2 });

export const WINGS = { nh: { name: 'Natural History', need: 6 }, art: { name: 'Art Wing', need: 10 }, hist: { name: 'City History', need: 6 }, special: { name: 'Special Exhibition', need: 3 } };
export const SPECIALS = [
  { title: 'Wings: The Art of Flight', side: 'eggs', blurb: 'Kites, feathers and the airmail biplane "Maple Leaf", which flew the first letters out of Bay Airfield in 1938.' },
  { title: 'Deep Blue: Giants of the Bay', side: 'helmet', blurb: 'A life-size young blue whale, a brass diving helmet and what really lives under the ferry route.' },
  { title: 'Tin & Clockwork: A Century of Toys', side: 'toys', blurb: 'Wind-up robots, tin cars and one jack-in-the-box that has frightened four generations of Maple Bay children.' },
  { title: 'Ice Age Maple Bay', side: 'skull', blurb: 'Twelve thousand years ago the harbour was a wall of ice. Meet the mammoth who walked where Market Square is now.' },
];
const E = (wing, name, text) => ({ wing, name, text });
export const EXHIBITS = {
  marge: E('hall', 'Marge the Tyrannosaur', 'Found in 1962 by a road crew cutting the Hillcrest terraces, and named after the foreman\'s mother. She is eleven metres long, sixty-six million years old, and about two-thirds real bone: the pale parts are plaster.'),
  whale: E('hall', 'The Harbour Whale', 'A young fin whale that washed into the bay in 1921. The cannery crew cleaned the bones and the whole town carried them up the hill, one rib each.'),
  dio0: E('nh', 'Diorama: Tide Pool', 'Everything here lives between the tides under the boardwalk: ochre sea stars, anemones, and a shore crab who has been about to pinch that gull since 1954.'),
  dio1: E('nh', 'Diorama: Maple Woods', 'The woods above Hillcrest in October. The white-tailed deer was modelled on one that walked into the museum cafe in 1988 and was politely shown out.'),
  dio2: E('nh', 'Diorama: Sea Cliff', 'Puffins nest in burrows on the lighthouse rock from April to August. They mate for life and return to the same hole every year, like commuters.'),
  strata: E('nh', 'The Wall of Time', 'Six layers of the ground under your feet. Maple Bay sits on old sea floor: dig a cellar in Old Town and you find shells.'),
  minerals: E('nh', 'Minerals of the Bay', 'Amethyst from the Hillcrest quarry, quartz, a cube of pyrite that fooled three prospectors, and malachite as green as the dome roof. Stand still and they glitter.'),
  fossils: E('nh', 'Fossils: Ammonite and Friends', 'The coiled one is an ammonite, a cousin of the squid that sailed these waters in a spiral shell. Beside it: a trilobite and half a very surprised fish.'),
  shells: E('nh', 'Shells of the Harbour', 'Collected on the town beach over forty years by Mr. Linus Abara, the lighthouse keeper, who labelled each one with the weather.'),
  ptero: E('nh', 'Pteranodon', 'Not a dinosaur and not a bird: a flying reptile with a six-metre wingspan and bones as hollow as drinking straws. It hangs where it would have glided.'),
  digpit: E('nh', 'The Dig Pit', 'A real fossil bed in miniature. Take a brush, work slowly, and never pull: the stone lets go when it is ready.'),
  timeline: E('hist', 'The Story of Maple Bay', 'Schooners in 1887, the cannery in 1911, the viaduct in 1931, the last tram in 1962 and the first jet in 2004. One town, five ways of making a living.'),
  model: E('hist', 'The City in Miniature', 'Every building in Maple Bay at 1:1500, made by the model railway club over nine winters. Press a button to light a district. Yes, your street is on it.'),
  ship: E('hist', 'Schooner "Adaeze B."', 'A model of the last sailing schooner to fish out of Maple Bay, built by her own deckhand from the wood of her wheelhouse.'),
  tins: E('hist', 'Maple Bay Cannery', 'Salmon tins with the red maple label went to forty countries. The steam whistle blew at six, noon and six, and the whole town set its clocks by it.'),
  tram: E('hist', 'The Number 4 Tram', 'Trams ran down Maple Avenue from 1924 to 1962. The light rail loop follows the old line, and Central Station stands on the tram depot.'),
  plane: E('hist', 'Bay Airfield', 'The grass strip beyond the fence became Maple Bay International. The first airmail flight carried 212 letters and one very calm chicken.'),
  found: E('hist', 'Found in Maple Bay', ''),
  sc0: E('art', 'Sculpture: "Tide"', 'Bronze, 1974, Hana Whitfield. A wave caught at the second it decides to break.'),
  sc1: E('art', 'Sculpture: "Seed"', 'Patinated copper, 1968, Ilse Varga. Look through the hole: she lined it up with the dome on purpose.'),
  sc2: E('art', 'Sculpture: "Cairn"', 'Beach stones from the town shore, 1999, Marisol Etxeberria. Nothing holds it together but balance. Please do not test this.'),
  sc3: E('art', 'Sculpture: "Gull"', 'Marble, 1936, Cornelius Pike. He carved it after one stole his lunch on the fish pier, "to get my own back".'),
  sc4: E('art', 'Sculpture: "Knot"', 'Polished brass, 1982, Suki Lindqvist. One ribbon, no ends. Children walk round it looking for the join.'),
  sc5: E('art', 'Sculpture: "The Listener"', 'Terracotta, 1951, Tomas Okonkwo-Reyes. A portrait of his grandmother hearing the cannery whistle for the last time.'),
  sp_centre: E('special', '', ''), sp_side: E('special', '', ''), sp_about: E('special', '', ''),
};
for (const p of PAINTINGS) EXHIBITS['p:' + p.id] = E(p.id === 'pears' || p.id === 'market' ? 'cafe' : 'art', `"${p.t}"`, `${p.by}, ${p.yr}. ${p.note}`);
for (const p of PHOTOS) EXHIBITS['p:' + p.id] = E(p.id === 'ph_market' || p.id === 'ph_pier' ? 'cafe' : 'hist', p.t, p.note);
export const SPECIAL_EX = [
  [['The Airmail Biplane "Maple Leaf"', 'Spruce, linen and a second-hand motorcycle engine. Pilot Josephine Achebe flew her to the coast and back every Tuesday for six years.'], ['Eggs and Feathers', 'A robin\'s egg, a gull\'s, a heron\'s; and four flight feathers. Hold your hand out flat in the wind: that is all a wing is.']],
  [['Blue Whale Calf (model)', 'Seven metres, and still a baby. An adult\'s heart is the size of a taxi; you could hear it beat from two miles away.'], ['Brass Diving Helmet', 'Worn by harbour diver Wen Castellanos to mend the ferry pier in 1949. It weighs as much as a nine-year-old.']],
  [['"Big Otto", Tin Robot', 'Built for the window of the Tin Robot Toys shop in 1957. His eyes still light and his key still turns, but nobody has dared wind him fully.'], ['Clockwork Toys', 'A jack-in-the-box, two tin racing cars and a marble that went round the world in a sailor\'s pocket.']],
  [['Woolly Mammoth', 'Her tusk was dredged out of the harbour in 1903 by a very confused fisherman. The fur is yak; the patience is her own.'], ['Sabre-Toothed Cat', 'The fangs were not for stabbing but for a single careful bite. The skull was found under what is now the bank.']],
];
export const AUDIO = [
  { n: 1, ex: 'marge', text: 'Stop one. Look up. Marge would have weighed as much as a bus and could not run, whatever the films say. She could, however, smell you from the other side of Central Park.' },
  { n: 2, ex: 'whale', text: 'Stop two. The whale above you has finger bones inside its flippers. Its ancestors walked on land, thought better of it, and went back.' },
  { n: 3, ex: 'minerals', text: 'Stop three. The purple is amethyst. It is only quartz with a little iron in it, which goes to show what a little iron can do.' },
  { n: 4, ex: 'digpit', text: 'Stop four. Real palaeontologists use a toothbrush and a dental pick, and take a month over what you are about to do in ten minutes. Enjoy it.' },
  { n: 5, ex: 'dio0', text: 'Stop five. Count the legs on the sea star. Now look away and look back. It has not moved. It is extremely good at this.' },
  { n: 6, ex: 'p:dawn', text: 'Stop six. Harbour at Dawn. Stand well back. Elspeth Marrow used eleven pinks for that sky, and gave her last tube of the good one to the sun.' },
  { n: 7, ex: 'sc0', text: 'Stop seven. Walk all the way round "Tide". A sculpture is the only kind of picture that has a back.' },
  { n: 8, ex: 'model', text: 'Stop eight. The model of the city. Find the museum: it is the tiny gold one at the top of Maple Avenue. Somewhere inside it is an even smaller you.' },
  { n: 9, ex: 'tins', text: 'Stop nine. In 1911 half the town worked at the cannery. The whistle is missing from this case; the curator would very much like to know where it went.' },
  { n: 10, ex: 'sp_centre', text: 'Stop ten, and the last. This room is new every season, so come back. Thank you for listening. Please return the headphones before you leave with them on, as most people do.' },
];
export const HUNT = [
  { id: 'coil', clue: 'A shell that coils like a sleeping cat', ex: 'fossils' }, { id: 'teeth', clue: 'Forty teeth on a brown plinth', ex: 'marge' }, { id: 'cloth', clue: 'A whole city you could cover with a tablecloth', ex: 'model' },
  { id: 'umbrella', clue: 'The only yellow umbrella in the building', ex: 'p:rain' }, { id: 'whistle', clue: 'It blew at six, noon and six', ex: 'tins' }, { id: 'stars', clue: 'Stones that keep their own stars', ex: 'minerals' },
  { id: 'cat', clue: 'A cat who sat for a portrait, then on it', ex: 'p:cat' }, { id: 'wings', clue: 'Six metres of wing that never flap', ex: 'ptero' },
];
export const FOSSILS = [
  { id: 'ammonite', name: 'Ammonite', note: 'A perfect spiral, ribbed like a ram\'s horn.' }, { id: 'trilobite', name: 'Trilobite', note: 'An armoured sea-bug with a hundred tiny lenses for eyes.' }, { id: 'fern', name: 'Fern Frond', note: 'A leaf pressed in stone before there were flowers.' },
  { id: 'fish', name: 'Herring-Fish', note: 'Every rib in place, down to the tail.' }, { id: 'tooth', name: 'Shark Tooth', note: 'Black, glossy and still sharp enough to mind.' }, { id: 'claw', name: 'Raptor Claw', note: 'Curved like a question mark. The rarest find in the pit.' },
];
