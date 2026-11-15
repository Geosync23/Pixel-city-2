// lighthouse.js — venue records, hours, ships, signal flags, shipwreck stories, items, moodlets and calendar events for Gull Point Lighthouse (harbor; converted in place from `bld.harbor.lighthouse`;
// city door 'door:lighthouse' at the keeper's cottage). Registered additively at import time: VENUE_BY_ID gets 'lighthouse' (the place, 08:00-23:00) and 'lighthouse:shelf' (the keeper's honesty shelf);
// ITEMS / ITEM_BY_ID get the `lh_*` items; MOODLETS gets top_of_the_light, lamp_lit, storm_watch, bay_sunset, brass_shine; calendar EVENTS gets lh_lamp_<season> (lamp lighting at dusk, daily).
//   LR room ids   LV venue ids   NAME   HOURS   LAMP[season] hour the lamp is lit   SUNSET[season] [from, to]   SUNRISE [from, to]   STEPS { stair1, stair2, ladder, total }
//   SHIPS [{ id, name, kind, c, from, to, on(now, wx) -> bool, note }]   shipsNow(now, wx) -> [{ ...ship, f 0..1 across the horizon }]
//   FLAG_COL(letter, u 0..1, v 0..1) -> hex (International Code of Signals)   WORDS { WORD: reply }   WRECKS [{ name, year, text }]   LOG_LINES (keeper's phrases)   RADIO helpers: beaufort(kind), seaState(kind)
import './venues_extra.js';
import { VENUE_BY_ID } from './venues.js';
import { ITEMS, ITEM_BY_ID, DISHES, GIFTS, MISC } from './items.js';
import { MOODLETS } from './needs.js';
import { EVENTS } from './calendar.js';

export const LR = { cottage: 'lighthouse', stair1: 'lighthouse_stair', stair2: 'lighthouse_stair2', watch: 'lighthouse_watch', lantern: 'lighthouse_lantern' };
export const LV = { place: 'lighthouse', shelf: 'lighthouse:shelf' }, NAME = 'Gull Point Lighthouse', KEEPER = 'Silas Marrow';
export const HOURS = [8, 23], LAMP = [18.5, 19.75, 17.5, 16.75], SUNSET = [[17.5, 19], [18.75, 20.25], [16.5, 18], [16, 17.25]], SUNRISE = [5.5, 7.5], DAWN_OFF = 6.5;
export const STEPS = { stair1: 44, stair2: 44, ladder: 9, total: 97 };
const any = () => true, wd = (...d) => n => d.includes(n.weekday);
export const SHIPS = [
  { id: 'petrel', name: 'Harbor Ferry "Petrel"', kind: 'ferry', c: '#f4f0e8', from: 8, to: 8.7, every: 2, on: any, note: 'Every two hours on the even hour, Gull Point to the fun pier and back. She toots at the light out of habit.' },
  { id: 'coral', name: 'MV "Coral Empress"', kind: 'freighter', c: '#b8502e', from: 9.5, to: 11, on: wd(0, 3), note: 'Container freighter, Mondays and Thursdays, for Faith, Hope and Gerald, the three cranes.' },
  { id: 'kittiwake', name: 'RV "Kittiwake"', kind: 'research', c: '#2f8a8a', from: 11, to: 13, on: wd(2), note: 'The university\'s research boat, out counting plankton every Wednesday.' },
  { id: 'bulldog', name: 'Tug "Bulldog"', kind: 'tug', c: '#2a2733', from: 12, to: 13, on: any, note: 'Harbor tug. Small, loud, never late.' },
  { id: 'wren', name: 'Sloop "Wren"', kind: 'sloop', c: '#f4f0e8', from: 13, to: 16, on: (n, wx) => wx === 'clear' || wx === 'cloudy', note: 'One red sail, one retired dentist. Fair weather only.' },
  { id: 'osprey', name: 'Trawler "Osprey"', kind: 'trawler', c: '#c8402e', from: 14.5, to: 15.5, on: (n, wx) => wx !== 'storm', note: 'Tomasz Wren\'s boat, heading out for the night grounds. Lands at the Fish Hall before dawn.' },
  { id: 'evening', name: 'Tall ship "Evening Star"', kind: 'tall', c: '#7a5a3a', from: 16, to: 18, on: wd(5, 6), note: 'Three masts under full sail on weekend afternoons. Sea cadets wave from the yards.' },
  { id: 'dipper', name: 'Trawler "Little Dipper"', kind: 'trawler', c: '#2f8a6a', from: 17, to: 18, on: (n, wx) => wx !== 'storm', note: 'Nan Okafor, last out and first home.' },
  { id: 'aurora', name: 'Liner "Aurora Borealis"', kind: 'liner', c: '#f4f0e8', from: 19, to: 21, on: n => n.dayOfMonth === 7 || n.dayOfMonth === 14, note: 'A cruise liner lit like a city block, twice a season, on the 7th and the 14th.' },
  { id: 'pilot', name: 'Pilot Boat No. 3', kind: 'pilot', c: '#e8a23a', from: 20, to: 21, on: any, note: 'Runs out to meet whatever is coming in after dark.' },
  { id: 'halcyon', name: 'Night Packet "Halcyon"', kind: 'packet', c: '#22405e', from: 21.5, to: 22.5, on: any, note: 'The overnight mail boat. Its lights are the last thing the keeper logs each night.' },
];
export function shipsNow(n, wx) { const out = []; for (const s of SHIPS) { if (!s.on(n, wx)) continue; if (s.every) { for (let h = s.from; h < 23; h += s.every) if (n.hf >= h && n.hf < h + (s.to - s.from)) out.push(Object.assign({ f: (n.hf - h) / (s.to - s.from) }, s)); } else if (n.hf >= s.from && n.hf < s.to) out.push(Object.assign({ f: (n.hf - s.from) / (s.to - s.from) }, s)); } return out; }
export function shipsToday(n, wx) { return SHIPS.filter(s => s.on(n, wx)); }

export { FLAG_COL } from '../art/showpiece/_lh_lib.js';
export const WORDS = {
  HELLO: 'The ferry Petrel gives two long toots. Somebody on deck waves a whole coat.', AHOY: 'Three boats answer with their horns. The gulls take it personally.', MARGO: 'A light flashes back from the fishing grounds: dash-dash, dash-dash. That is Ilse Brandt, saying good morning.',
  HOME: 'Nothing answers. But every skipper who sees it knows exactly what it means.', FISH: 'The harbour master radios up: "Gull Point, we know. We can smell them from here."', LOVE: 'A long pause. Then the tug Bulldog, of all boats, blows a kiss on her whistle.', STORM: 'Two trawlers turn for harbour at once. The keeper nods: "Good. Better early than brave."',
  BAY: 'The Bay Wheel across the water blinks its lights, once. Probably a coincidence.', SOS: 'The radio crackles instantly: "Gull Point, Gull Point, say again?!" The keeper takes the handset, apologises for eleven minutes, and gives you a look.',
};
export const WRECKS = [
  { name: 'The "Calliope"', year: 1871, text: 'Barque, out of Lisbon with cork and port wine. Struck Gull Rock in fog the winter before the light was built. All hands saved by the herring fleet; forty casks were not. Old Town still calls a good hangover "a touch of the Calliope".' },
  { name: 'The "Northern Belle"', year: 1889, text: 'Paddle steamer. Lost her rudder in a January gale and drove onto the point. Keeper Amos Tidy and his daughter Ruth rowed out four times and brought back thirty-one people and one extremely angry parrot.' },
  { name: 'The "Marigold"', year: 1903, text: 'Fishing smack, six men. The lamp failed for nine minutes that night: a cracked mantle. They found the beach by the sound of the keeper beating a frying pan on the gallery rail. The pan hangs in the cottage.' },
  { name: 'The "Ostrander"', year: 1926, text: 'Freighter, grounded on a flat calm morning with the light in plain sight. The inquiry found the mate had been "admiring the view". Nobody was hurt. Four hundred pianos were salvaged; some are still in tune.' },
  { name: 'The "Sea Thrift"', year: 1954, text: 'The last wreck on Gull Point. A yacht, dismasted. Keeper Edda Marrow talked the crew in by radio for two hours, reading them the shipping forecast between bearings to keep them calm. Her son Silas keeps the light now.' },
];
export const LOG_LINES = { clear: ['Wind light. Visibility to the horizon.', 'Fair. Glass steady.', 'Bright all day. Lens needed no attention.'], cloudy: ['Overcast, sea slight.', 'Grey and mild. Glass steady.'], rain: ['Rain from the south-west. Glass falling.', 'Wet. Gallery deck swabbed twice by the weather.'], storm: ['GALE. Spray over the gallery rail. Stood watch all night.', 'Storm. Counted the fleet home one by one.'], fog: ['Fog. Horn sounding since first light.', 'Thick fog. Could not see my own boots on the gallery.'], snow: ['Snow. Cleared the lantern glass every hour.', 'Snow on the rail. The cat refuses the gallery.'] };
export const beaufort = k => ({ clear: 'south-west 3', cloudy: 'west 4', rain: 'south-west 5 to 6', storm: 'north-west gale 8, perhaps severe gale 9', fog: 'variable 2', snow: 'north 5' }[k] || 'variable 3');
export const seaState = k => ({ clear: 'smooth', cloudy: 'slight', rain: 'moderate', storm: 'very rough', fog: 'calm', snow: 'moderate' }[k] || 'slight');
export const visib = k => ({ clear: 'good', cloudy: 'good', rain: 'moderate, occasionally poor', storm: 'poor', fog: 'very poor', snow: 'poor' }[k] || 'good');

const hrs = r => [0, 1, 2, 3, 4, 5, 6].map(() => r);
const venue = (id, name, type, offers, hours, blurb) => (VENUE_BY_ID[id] = VENUE_BY_ID[id] || { id, name, type, district: 'harbor', where: 'Gull Point, at the far west end of the beach', station: null, interior: true, hours, offers, priceMult: 1, jobId: null, delivers: false, blurb, showpiece: true });
venue(LV.place, NAME, 'leisure', { functions: ['seat', 'viewpoint'] }, hrs(HOURS), 'A working lighthouse you can climb: the keeper\'s cottage, ninety-seven steps, the watch room with its radio, flags and telescope, and the great lens turning in the lantern above the whole bay.');
venue(LV.shelf, "The Keeper's Shelf", 'shop', { shop: ['gift', 'misc', 'snack'], menu: true, functions: ['till'] }, hrs(HOURS), 'An honesty shelf in the keeper\'s cottage: postcards, tea, a model of the light.');

const mood = (id, o) => { if (!MOODLETS[id]) MOODLETS[id] = Object.assign({ workPerf: 1, walkSpeed: 1, source: 'activity' }, o); };
mood('top_of_the_light', { name: 'Top of the Light', desc: 'Ninety-seven steps, and then the whole bay at your feet.', mood: 7, minutes: 300 });
mood('lamp_lit', { name: 'Keeper of the Light', desc: 'You helped light the lamp. Somewhere out there a skipper just took a bearing on it.', mood: 10, workPerf: 2, minutes: 480 });
mood('storm_watch', { name: 'Storm Watch', desc: 'You stood in the lantern while the gale beat on the glass. You feel very small and very alive.', mood: 8, minutes: 360 });
mood('bay_sunset', { name: 'Sunset from the Gallery', desc: 'The sun went into the sea like a coin into a slot, and the lamp came on behind you.', mood: 7, minutes: 300 });
mood('brass_shine', { name: 'Brass and Glass', desc: 'An hour with a soft cloth and the lens throws rainbows. Honest work.', mood: 5, minutes: 240 });

const SH = [LV.shelf];
const gift = (id, name, price, icon, relationship, giftTags) => ({ id, name, category: 'gift', price, icon, effects: {}, stack: 3, soldAt: SH, relationship, giftTags });
const misc = (id, name, price, icon, note, soldAt) => ({ id, name, category: 'misc', price, icon, effects: {}, stack: 1, soldAt: soldAt || [], note });
const NEW = [
  gift('lh_postcards', 'Gull Point Postcards', 3, 'postcards, striped lighthouse', 3, ['cute', 'arty']),
  gift('lh_model', 'Model Lighthouse', 18, 'small striped tower, lamp', 8, ['cute', 'nerdy']),
  gift('lh_chart', 'Chart of Maple Bay', 14, 'rolled sea chart, compass rose', 7, ['nerdy', 'arty']),
  gift('lh_bell', 'Brass Ship\'s Bell', 22, 'brass bell, rope', 8, ['fancy', 'nerdy']),
  gift('lh_knots', 'Sailor\'s Knot Board', 12, 'board, six rope knots', 6, ['nerdy', 'outdoorsy']),
  gift('lh_bunting', 'Signal Flag Bunting', 9, 'string of coloured flags', 5, ['cute', 'arty']),
  gift('lh_lantern', 'Storm Lantern', 16, 'red lantern, glass, handle', 7, ['cozy', 'outdoorsy']),
  gift('lh_shell', 'Gull Point Conch', 6, 'pink spiral shell', 4, ['cute', 'outdoorsy']),
  { id: 'lh_shortbread', name: "Keeper's Shortbread", category: 'snack', price: 3, icon: 'tin, pale biscuits', effects: { hunger: 12, fun: 5 }, stack: 5, soldAt: SH, eatMinutes: 4, shelfLifeDays: 20, needsFridge: false, heat: null },
  { id: 'lh_tea', name: 'Lighthouse Blend Tea', category: 'snack', price: 5, icon: 'navy tea tin, white tower', effects: { energy: 10, fun: 4 }, stack: 5, soldAt: SH, eatMinutes: 6, shelfLifeDays: null, needsFridge: false, heat: null },
  { id: 'lh_mug', name: "Mug of Keeper's Tea", category: 'dish', price: 1, icon: 'enamel mug, steam', effects: { energy: 12, fun: 5, social: 3 }, stack: 1, soldAt: [], venue: LV.shelf, eatMinutes: 10, course: 'drink', takeaway: false },
  { id: 'lh_stew', name: "Bowl of the Keeper's Fish Stew", category: 'dish', price: 4, icon: 'bowl, red stew, bread', effects: { hunger: 46, fun: 7, energy: 2 }, stack: 1, soldAt: [], venue: LV.shelf, eatMinutes: 14, course: 'main', takeaway: false },
  misc('lh_brasso', 'Tin of Lens Polish', 4, 'yellow tin, cloth', 'A soft cloth and a tin of polish. The lens at Gull Point comes up brighter with your own.', SH),
  misc('lh_spyglass', 'Pocket Spyglass', 24, 'brass telescope, small', 'Three brass tubes. Ships are easier to hold steady in the watch-room telescope once you have practised with this.', SH),
  misc('lh_logbook', 'Blank Ship\'s Log', 7, 'navy book, anchor', 'Ruled for date, wind, sea and remarks. The keeper says everybody should keep one.', SH),
  misc('lh_herring', 'Barrel of Oak-Barrel Herring', 0, 'small barrel, fish mark', 'Captain Brandt\'s herring, owed to Old Halvorsen at the smokery in the Bay Fish Hall. It is heavier than it looks.'),
  misc('lh_mantle', 'Lamp Mantle Box', 0, 'old tin box, brass clasp', 'A tin of spare mantles for the Gull Point lamp, lent to the smokery in 1994 and used ever since as a kipper weight. Silas Marrow wants it back.'),
  misc('lh_badge', "Assistant Keeper's Badge", 0, 'brass badge, lighthouse', 'Gull Point Light, Assistant Keeper. It entitles you to light the lamp at dusk, and to free tea. Not for sale.'),
];
export const NEW_ITEM_IDS = NEW.map(i => i.id);
const LISTS = { gift: GIFTS, misc: MISC, dish: DISHES };
for (const it of NEW) { if (ITEM_BY_ID[it.id]) continue; ITEMS.push(it); ITEM_BY_ID[it.id] = it; if (Array.isArray(LISTS[it.category])) LISTS[it.category].push(it); }

const ALL = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14], SN = ['spring', 'summer', 'autumn', 'winter'];
if (!EVENTS.some(e => e.id === 'lh_lamp_spring')) EVENTS.push(...SN.map((s, i) => ({ id: 'lh_lamp_' + s, name: 'Lamp Lighting at Gull Point', kind: 'seasonal', when: { season: s, days: ALL }, hours: [LAMP[i] - .5, LAMP[i] + .5], place: { venue: LV.place }, blurb: 'Every evening at dusk the keeper climbs ninety-seven steps and lights the lamp. Be in the lantern room at the top of Gull Point Lighthouse and he will let you help.', special: {} })));
