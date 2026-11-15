// hotel.js — venue records, prices, hours, schedules, menus, items, moodlets and calendar events for The Grand Maple Hotel (downtown; city door 'door:hotel').
// Registered additively at import time (same pattern as museum.js / conservatory.js): VENUE_BY_ID gets 'hotel' (the place, open 24 h), 'hotel:gifts' (The Bellhop's Trunk boutique),
// 'hotel:bar' (The Weathervane rooftop bar), 'hotel:roomservice'; ITEMS / ITEM_BY_ID get the `hotel_*` items (+ outfit `outfit_hotel_robe`); MOODLETS gets hotel_rested, pampered, hotel_tea,
// well_dined, golden_hour, poolside; calendar EVENTS gets hotel_brunch, hotel_jazz_thu/fri/sat, hotel_dance_tue/thu, hotel_wedding, hotel_gala.
//   HR room ids   HV venue ids   TIERS [{ id, name, price, no, floor, sleep (energy / h), blurb }]   PRICE { ... }   HOURS { bar, spa, gifts, breakfast, brunch, tea, dinner }   CHECKOUT (hour)
//   PIANO_SETS [[from, to, name]]   PIECES [{ id, title, by, bpm, notes }]   JAZZ { nights, hours }   SUNSET[season] -> [from, to]   FLOWERS [{ name, c }] (one per week)
//   meal(now) -> 'breakfast' | 'brunch' | 'tea' | 'dinner' | null     ballEvent(now) -> { id, name, hours, ... } | null     ballNext(now) -> [{ id, name, day, from, to }] (next 7 days)
//   BUFFET [{ id, name, hunger, fun, energy?, brunch? }]   MENU { starter, main, dessert: [item ids] }   COCKTAILS [{ id, name, steps: [[ingredient, target 0..1]], shake }]
//   HOTEL_LOOKS (merge into wardrobe LOOKS)   NEW_ITEM_IDS
import './venues_extra.js';
import { VENUE_BY_ID } from './venues.js';
import { ITEMS, ITEM_BY_ID, DISHES, GIFTS, MISC, OUTFITS } from './items.js';
import { MOODLETS } from './needs.js';
import { EVENTS } from './calendar.js';

export const HR = { lobby: 'hotel', rest: 'hotel_restaurant', bar: 'hotel_bar', ball: 'hotel_ballroom', spa: 'hotel_spa', floor: 'hotel_floor', room: 'hotel_room' };
export const HV = { place: 'hotel', gifts: 'hotel:gifts', bar: 'hotel:bar', room: 'hotel:roomservice' };
export const NAME = 'The Grand Maple Hotel', REST_NAME = 'The Gilded Maple', BAR_NAME = 'The Weathervane', SPA_NAME = 'The Tidewater Spa', BALL_NAME = 'The Bay Ballroom', SHOP_NAME = "The Bellhop's Trunk";
export const TIERS = [
  { id: 'classic', name: 'Classic Room', price: 120, no: '704', sleep: 13, blurb: 'A proper bed, a deep armchair and a window over the avenue.' },
  { id: 'bay', name: 'Bay View Deluxe', price: 190, no: '709', sleep: 14.5, blurb: 'A corner room: king bed, a sofa and the whole bay in the window.' },
  { id: 'suite', name: 'The Maple Suite', price: 320, no: '710', sleep: 16, blurb: 'Sitting room, four-poster, claw-foot tub. The one the film stars ask for.' },
];
export const PRICE = { spa: 25, massage: 45, buffet: 14, brunch: 24, tea: 18, dinner3: 38, dinner5: 62, mix: 9, klass: 10, gala: 40, request: 2, late: 30 };
export const HOURS = { bar: [16, 25], spa: [7, 21], gifts: [8, 22], breakfast: [6.5, 10.5], brunch: [10.5, 14], tea: [14, 17], dinner: [18, 22.5] };
export const CHECKOUT = 11;
export const PIANO_SETS = [[12, 14, 'Luncheon set'], [17, 19, 'Cocktail hour'], [20.5, 22.5, 'Evening set']];
export const JAZZ = { nights: [3, 4, 5], hours: [20.5, 23.5], name: 'The Lowell Finch Trio' };
export const SUNSET = [[17, 19], [18.25, 20.25], [16, 18], [16, 17.25]];
export const FLOWERS = [
  { name: 'White lilies and eucalyptus', c: ['#f8f4ea', '#f0e8c8', '#8fb89a'] }, { name: 'Coral peonies', c: ['#f08a7a', '#f6b4a4', '#f8dcd0'] }, { name: 'Blue delphiniums and white stock', c: ['#5a7ad8', '#8aa8f0', '#f8f4ea'] },
  { name: 'Sunflowers and solidago', c: ['#f2c230', '#e89a2a', '#7a4a2a'] }, { name: 'Deep red roses', c: ['#b8242e', '#d8404a', '#7a1a26'] }, { name: 'Pink cherry branches', c: ['#f7c1d4', '#f2a7c3', '#fbe3ea'] },
  { name: 'Purple irises and tulips', c: ['#7a55c8', '#b07ad8', '#f6d24a'] }, { name: 'Orange dahlias and maple leaves', c: ['#e8742a', '#d9562b', '#e8b63a'] },
];
export const inH = (h, r) => (h >= r[0] && h < r[1]) || (r[1] > 24 && h < r[1] - 24);
/** which sitting The Gilded Maple is serving */
export function meal(n) { const h = n.hf; if (n.weekday === 6 && inH(h, HOURS.brunch)) return 'brunch'; if (inH(h, HOURS.breakfast)) return 'breakfast'; if (inH(h, HOURS.tea)) return 'tea'; if (inH(h, HOURS.dinner)) return 'dinner'; return null; }
export const BALL = [
  { id: 'class', name: 'Ballroom Dance Class', short: 'DANCE CLASS', on: n => n.weekday === 1 || n.weekday === 3, hours: [19, 20.5], blurb: 'Waltz and foxtrot with Madame Vasquez. Beginners very welcome; partners provided.' },
  { id: 'wedding', name: 'A Wedding Reception', short: 'WEDDING', on: n => n.weekday === 5, hours: [17, 23], blurb: 'Every Saturday somebody gets married at the Grand Maple. The doors are never quite shut and the couple never minds one more dancer.' },
  { id: 'gala', name: 'The Lighthouse Fund Charity Gala', short: 'CHARITY GALA', on: n => n.dayOfMonth === 12, hours: [19, 23], blurb: 'Black tie, a silent auction and a dance band, in aid of the old lighthouse. Tickets at the ballroom door.' },
];
const dayInfo = d => ({ day: d, weekday: ((d % 7) + 7) % 7, dayOfMonth: ((d % 14) + 14) % 14 + 1 });
export function ballEvent(n) { for (const e of BALL) if (e.id !== 'class' || !BALL[2].on(n)) { if (e.on(n) && inH(n.hf, e.hours)) return e; } return null; }
export function ballNext(n, days = 7) { const out = []; for (let d = n.day; d < n.day + days; d++) { const q = dayInfo(d); for (const e of BALL) if (e.on(q) && !(e.id === 'class' && BALL[2].on(q)) && (d > n.day || n.hf < e.hours[1])) out.push({ id: e.id, name: e.name, day: d, from: e.hours[0], to: e.hours[1], blurb: e.blurb }); } return out; }

const HRS24 = [0, 1, 2, 3, 4, 5, 6].map(() => [0, 24]), hrs = r => [0, 1, 2, 3, 4, 5, 6].map(() => r);
const venue = (id, name, type, offers, hours, blurb) => (VENUE_BY_ID[id] = VENUE_BY_ID[id] || { id, name, type, district: 'downtown', where: 'Harbor Boulevard, downtown, under the red canopy', station: null, interior: true, hours, offers, priceMult: 1, jobId: null, delivers: false, blurb, showpiece: true });
venue(HV.place, NAME, 'leisure', { functions: ['seat'] }, HRS24, 'Marble, brass and a pianist in the lounge. A restaurant, a rooftop bar, a ballroom, a spa with a pool, and rooms for the night.');
venue(HV.gifts, SHOP_NAME, 'shop', { shop: ['gift', 'misc', 'outfit'], functions: ['till'] }, hrs(HOURS.gifts), 'The hotel boutique: bathrobes, bath salts and a bear in a bellhop hat.');
venue(HV.bar, BAR_NAME, 'food', { menu: true, functions: ['seat', 'till', 'bar_stool'] }, hrs(HOURS.bar), 'The rooftop bar of the Grand Maple. Cocktails, the skyline, and jazz from Thursday to Saturday.');
venue(HV.room, 'Room Service', 'food', { menu: true, functions: [] }, HRS24, 'Dial 0. Silver domes at any hour.');

const mood = (id, o) => { if (!MOODLETS[id]) MOODLETS[id] = Object.assign({ workPerf: 1, walkSpeed: 1, source: 'activity' }, o); };
mood('hotel_rested', { name: 'Slept Like Royalty', desc: 'Pressed sheets, blackout curtains, nobody upstairs. The best sleep in months.', mood: 9, workPerf: 4, minutes: 600 });
mood('pampered', { name: 'Pampered', desc: 'Every knot in your shoulders has been found and politely asked to leave.', mood: 8, workPerf: 2, minutes: 360 });
mood('hotel_tea', { name: 'Afternoon Tea', desc: 'Three tiers, two scones, one very small sandwich at a time.', mood: 5, minutes: 240 });
mood('well_dined', { name: 'Wined and Dined', desc: 'Course after course under the chandeliers.', mood: 9, minutes: 360 });
mood('golden_hour', { name: 'Golden Hour', desc: 'You watched the sun go down over the bay with a glass in your hand.', mood: 6, minutes: 240 });
mood('poolside', { name: 'Poolside', desc: 'Chlorine, warm tiles, nowhere to be.', mood: 4, minutes: 180 });

const BAR = [HV.bar], SH = [HV.gifts], RS = [HV.room];
const drink = (id, name, price, effects, icon, x) => Object.assign({ id, name, category: 'dish', price, icon, effects, stack: 1, soldAt: BAR, venue: HV.bar, eatMinutes: 14, course: 'drink', takeaway: false }, x);
const dish = (id, name, price, effects, eatMinutes, course, icon, soldAt, v) => ({ id, name, category: 'dish', price, icon, effects, stack: 1, soldAt: soldAt || [], venue: v || HV.room, eatMinutes, course, takeaway: false });
const gift = (id, name, price, icon, relationship, giftTags) => ({ id, name, category: 'gift', price, icon, effects: {}, stack: 3, soldAt: SH, relationship, giftTags });
const NEW = [
  drink('hotel_ck_weathervane', 'The Weathervane', 11, { fun: 12, social: 3, alcohol: 1 }, 'coupe glass, pale green, rosemary sprig'),
  drink('hotel_ck_maple', 'Maple Old Fashioned', 12, { fun: 13, alcohol: 1 }, 'short glass, amber, orange peel'),
  drink('hotel_ck_fog', 'Harbour Fog', 10, { fun: 11, energy: 2, alcohol: 1 }, 'tall glass, pale blue, lemon wheel'),
  drink('hotel_ck_golden', 'Golden Hour', 10, { fun: 12, social: 4, alcohol: 1 }, 'wine glass, orange spritz, ice'),
  drink('hotel_ck_garden', 'Rooftop Garden (no alcohol)', 7, { fun: 8, energy: 4 }, 'tall glass, cucumber, mint'),
  drink('hotel_ck_house', 'The House Special', 9, { fun: 14, social: 5, alcohol: 1 }, 'coupe glass, ruby red, gold rim', { soldAt: [] }),
  dish('hotel_olives', 'Warm Olives & Almonds', 6, { hunger: 10, fun: 3 }, 8, 'snack', 'small bowl, green olives, almonds', BAR, HV.bar),
  dish('hotel_sliders', 'Crab Sliders', 13, { hunger: 30, fun: 6 }, 12, 'main', 'two small buns, crab, toothpicks', BAR, HV.bar),
  dish('hotel_d_chowder', 'Bay Chowder', 0, { hunger: 18, fun: 5 }, 14, 'starter', 'white bowl, cream soup, chives'),
  dish('hotel_d_beet', 'Roast Beet & Goat Cheese', 0, { hunger: 14, fun: 7 }, 14, 'starter', 'plate, red beet rounds, white cheese'),
  dish('hotel_d_halibut', 'Butter-Poached Halibut', 0, { hunger: 40, fun: 10 }, 20, 'main', 'white fish, green sauce, lemon'),
  dish('hotel_d_duck', 'Maple-Glazed Duck', 0, { hunger: 46, fun: 9 }, 20, 'main', 'sliced duck breast, dark glaze'),
  dish('hotel_d_risotto', 'Wild Mushroom Risotto', 0, { hunger: 42, fun: 8 }, 20, 'main', 'cream rice, brown mushrooms'),
  dish('hotel_d_tart', 'Maple Tart', 0, { hunger: 12, fun: 12 }, 12, 'dessert', 'golden tart, cream, maple leaf'),
  dish('hotel_d_souffle', 'Chocolate Souffle', 0, { hunger: 10, fun: 14 }, 12, 'dessert', 'white ramekin, risen chocolate'),
  dish('hotel_rs_club', 'Club Sandwich & Fries', 16, { hunger: 52, fun: 5 }, 16, 'main', 'stacked sandwich, fries, silver dome', RS),
  dish('hotel_rs_cocoa', 'Hot Chocolate & Cookies', 7, { hunger: 12, fun: 10, energy: 3 }, 9, 'drink', 'white mug, two cookies', RS),
  dish('hotel_rs_breakfast', 'Breakfast in Bed', 18, { hunger: 60, fun: 9, energy: 6 }, 18, 'main', 'tray, eggs, toast, orange juice', RS),
  gift('hotel_spa_salts', 'Tidewater Bath Salts', 14, 'glass jar, blue salts, cork', 7, ['fancy', 'cozy']),
  gift('hotel_spa_oil', 'Cedar Massage Oil', 16, 'amber bottle, green label', 6, ['fancy']),
  gift('hotel_spa_mask', 'Seaweed Face Mask', 9, 'green tube, white cap', 5, ['fancy', 'cute']),
  gift('hotel_keyfob', 'Brass Key Fob: Room 704', 8, 'brass tag, red tassel, old key', 4, ['nerdy', 'fancy']),
  gift('hotel_bear', 'Bellhop Bear', 15, 'brown bear, red pillbox hat', 8, ['cute']),
  gift('hotel_postcards', 'Grand Maple Postcards', 4, 'postcards, cream hotel, red canopy', 3, ['cute', 'arty']),
  gift('hotel_chocolates', 'Pillow Chocolates', 6, 'gold box, dark chocolates', 5, ['fancy', 'foodie']),
  { id: 'hotel_slippers', name: 'Hotel Slippers', category: 'misc', price: 9, icon: 'white terry slippers, gold maple leaf', effects: {}, stack: 1, soldAt: SH, note: 'They never look as good at home. You will wear them anyway.' },
  { id: 'hotel_tag', name: 'Burgundy Luggage Tag', category: 'misc', price: 0, icon: 'burgundy leather tag, brass buckle', effects: {}, stack: 1, soldAt: [], note: 'A keepsake from the affair of the three suitcases. Not for sale.' },
  { id: 'outfit_hotel_robe', name: 'Grand Maple Bathrobe', category: 'outfit', price: 65, icon: 'white bathrobe, gold maple leaf', effects: {}, stack: 1, soldAt: SH, outfit: 'hotel_robe', styles: ['cozy'], perk: { sleepMult: 1.05 }, note: 'Thick white terry with a gold maple leaf on the pocket.' },
];
export const NEW_ITEM_IDS = NEW.map(i => i.id);
const LISTS = { gift: GIFTS, misc: MISC, dish: DISHES, outfit: OUTFITS };
for (const it of NEW) { if (ITEM_BY_ID[it.id]) continue; ITEMS.push(it); ITEM_BY_ID[it.id] = it; if (Array.isArray(LISTS[it.category])) LISTS[it.category].push(it); }
export const HOTEL_LOOKS = { hotel_robe: { outfit: null, top: 'coat', topColor: '#f6f2ea', bottom: 'sweats', bottomColor: '#f6f2ea', shoes: '#f0ece4', hat: null, scarf: null, bag: null, accent: '#e8c06a' } };

export const MENU = { starter: ['hotel_d_chowder', 'hotel_d_beet'], main: ['hotel_d_halibut', 'hotel_d_duck', 'hotel_d_risotto'], dessert: ['hotel_d_tart', 'hotel_d_souffle'] };
export const EXTRA = { amuse: { name: 'Amuse-bouche: an oyster with apple ice', hunger: 4, fun: 6, min: 8 }, cheese: { name: 'Cheese from the trolley', hunger: 10, fun: 7, min: 12 } };
export const BUFFET = [
  { id: 'eggs', name: 'Scrambled eggs', hunger: 16, fun: 2 }, { id: 'bacon', name: 'Crisp bacon', hunger: 12, fun: 4 }, { id: 'pastry', name: 'Warm croissant', hunger: 12, fun: 5 }, { id: 'fruit', name: 'Cut fruit', hunger: 8, fun: 3, energy: 3 },
  { id: 'pancakes', name: 'Pancakes with maple syrup', hunger: 18, fun: 6 }, { id: 'juice', name: 'Orange juice', hunger: 4, fun: 3, energy: 5 }, { id: 'coffee', name: 'Coffee from the urn', hunger: 0, fun: 2, energy: 12, caffeine: true },
  { id: 'salmon', name: 'Smoked salmon & capers', hunger: 14, fun: 7, brunch: true }, { id: 'benedict', name: 'Eggs Benedict', hunger: 22, fun: 8, brunch: true }, { id: 'mimosa', name: 'A mimosa', hunger: 2, fun: 9, alcohol: 1, brunch: true },
];
export const COCKTAILS = [
  { id: 'hotel_ck_weathervane', steps: [['Gin', .55], ['Lemon juice', .3], ['Rosemary syrup', .2]], shake: 6 },
  { id: 'hotel_ck_maple', steps: [['Rye whiskey', .6], ['Maple syrup', .18], ['Bitters', .1]], shake: 0 },
  { id: 'hotel_ck_fog', steps: [['Vodka', .45], ['Earl Grey', .5], ['Lemon', .22]], shake: 8 },
  { id: 'hotel_ck_golden', steps: [['Aperitivo', .4], ['Sparkling wine', .65], ['Soda', .25]], shake: 0 },
  { id: 'hotel_ck_garden', steps: [['Cucumber juice', .5], ['Lime', .25], ['Tonic', .6]], shake: 5 },
  { id: 'hotel_ck_house', steps: [['Sloe gin', .5], ['Cherry', .3], ['Sparkling wine', .45]], shake: 6 },
];
// piano pieces: 'midi:beats' tokens, '-' = rest of one beat, chords with '+'. All arrangements are short original settings of public-domain tunes.
export const PIECES = [
  { id: 'gymno', title: 'Gymnopedie No. 1', by: 'Satie', bpm: 76, notes: '43+62+66:3 38+57+61:3 43+62+66:3 38+57+61:3 78:1 81:1 79:1 78:1 73:1 71:1 73:1 74:1 69:3 66:6 78:1 81:1 79:1 78:1 73:1 71:1 73:1 74:1 76:3 69:6' },
  { id: 'elise', title: 'Fur Elise', by: 'Beethoven', bpm: 132, notes: '76:.5 75:.5 76:.5 75:.5 76:.5 71:.5 74:.5 72:.5 45+69:1.5 60:.5 64:.5 69:.5 40+71:1.5 64:.5 68:.5 71:.5 45+72:1.5 64:.5 76:.5 75:.5 76:.5 75:.5 76:.5 71:.5 74:.5 72:.5 45+69:1.5 60:.5 64:.5 69:.5 40+71:1.5 64:.5 72:.5 71:.5 45+69:3' },
  { id: 'clair', title: 'Clair de Lune', by: 'Debussy', bpm: 66, notes: '65+68:2 77+80:1 73+77:3 72+75:1 73+77:1 72+75:3 70+73:1 72+75:1 70+73:2 68+72:1 70+73:1 68+72:3 49+56+65:3 61+68:3' },
  { id: 'entertainer', title: 'The Entertainer', by: 'Joplin', bpm: 150, notes: '74:.5 76:.5 72:.5 69:1 71:.5 67:1 43+55:.5 62:.5 64:.5 60:.5 57:1 59:.5 55:1 36+48:.5 50:.5 52:.5 48:.5 45:1 47:.5 45:.5 44:.5 43:1 -:.5 67+71+74:1 -:1 62:.5 63:.5 64:.5 72:1 64:.5 72:1 64:.5 72:2.5' },
  { id: 'maple', title: 'Maple Leaf Rag', by: 'Joplin', bpm: 144, notes: '44:.5 56+63:.5 44:.5 68:.5 72:.5 75:.5 68:.5 72:.5 75:1 44:.5 56+63:.5 44:.5 68:.5 72:.5 75:.5 68:.5 72:.5 75:1 80:.5 84:.5 87:.5 80:.5 84:.5 87:1 44+56:1 51+63+68:2' },
  { id: 'greensleeves', title: 'Greensleeves', by: 'Traditional', bpm: 96, notes: '69:1 45+72:2 74:1 43+76:1.5 77:.5 76:1 41+74:2 71:1 43+67:1.5 69:.5 71:1 45+72:2 69:1 69:1.5 68:.5 69:1 40+71:2 68:1 64:3' },
  { id: 'danube', title: 'The Blue Danube', by: 'Strauss II', bpm: 160, notes: '62:1 62:1 66:1 69:1 69:2 81+78:1 81+78:2 78+74:1 78+74:2 62:1 62:1 66:1 69:1 69:2 81+79:1 81+79:2 79+73:1 79+73:2 61:1 61:1 64:1 71:1 71:2 83+79:1 83+79:2 79+73:1 79+73:2' },
];

if (!EVENTS.some(e => e.id === 'hotel_brunch')) EVENTS.push(
  { id: 'hotel_brunch', name: 'Sunday Brunch at The Gilded Maple', kind: 'weekly', when: { weekday: 6 }, hours: HOURS.brunch, place: { venue: 'hotel' }, blurb: 'The Grand Maple\'s breakfast buffet grows up on Sundays: smoked salmon, eggs Benedict, mimosas, and the pianist plays through lunch. Fill your own plate.', special: { crowdMult: 1.3 }, notify: 2 },
  ...[['thu', 3], ['fri', 4], ['sat', 5]].map(([k, wd]) => ({ id: 'hotel_jazz_' + k, name: 'Rooftop Jazz at The Weathervane', kind: 'weekly', when: { weekday: wd }, hours: JAZZ.hours, place: { venue: 'hotel' }, blurb: 'The Lowell Finch Trio plays the roof of the Grand Maple, Thursday to Saturday. Take the lift to R. Heaters are lit when it is cold.', special: { crowdMult: 1.3, moodlet: 'great_night_out' }, notify: 3 })),
  ...[['tue', 1], ['thu', 3]].map(([k, wd]) => ({ id: 'hotel_dance_' + k, name: 'Ballroom Dance Class', kind: 'weekly', when: { weekday: wd }, hours: BALL[0].hours, place: { venue: 'hotel' }, blurb: 'Tuesdays and Thursdays at seven in the Bay Ballroom of the Grand Maple. ' + BALL[0].blurb + ' $' + PRICE.klass + ' at the door.', special: {}, notify: 2 })),
  { id: 'hotel_wedding', name: 'Wedding Reception at the Grand Maple', kind: 'weekly', when: { weekday: 5 }, hours: BALL[1].hours, place: { venue: 'hotel' }, blurb: BALL[1].blurb, special: { crowdMult: 1.4 }, notify: 2 },
  { id: 'hotel_gala', name: 'The Lighthouse Fund Charity Gala', kind: 'seasonal', when: { season: 'any', days: [12] }, hours: BALL[2].hours, place: { venue: 'hotel' }, blurb: BALL[2].blurb + ' $' + PRICE.gala + '.', special: { crowdMult: 1.5, moodlet: 'great_night_out' }, notify: 6 });
