// fishmarket.js — venue records, stalls, the daily catch, auction lots, items, moodlets and calendar events for the Bay Fish Hall (harbor; converted in place from `bld.harbor.fishmarket`; city door 'door:fishmarket').
// Registered additively at import time (same pattern as hotel.js / museum.js): VENUE_BY_ID gets 'fishmarket' (the hall, 05:00-19:00) and one venue per stall ('fishmarket:<stall>');
// the seafood ingredients of the cookbook (fish, salmon, shrimp, mussels + lemon, nori) get the stall venues added to their `soldAt`; ITEMS / ITEM_BY_ID get the `fm_*` items;
// MOODLETS gets sea_air, market_bargain, nice_catch, shucker; calendar EVENTS gets fm_auction (daily 05:30-07:30) and fm_festival (Quayside Seafood Festival, the 8th of every season).
//   FM room / venue ids   NAME   HOURS { hall, auction, retail, food, festival }   STALLS [{ id, kind, name, keeper, sells: [{ id, catch? }], sp: [species shown], lines }]
//   CATCH [{ id, name, item?, sp }] what the boats can land   catchOf(day, wx) -> { boats, wx, of: { catchId: { level 0 none | 1 scarce | 2 fair | 3 plenty, mult, fresh } }, top (catch of the day), lines }
//   priceOf(itemId, stallId, day, wx, fest) -> dollars (25c steps)   weightOf(itemId) -> kg   lotsOf(day, wx) -> [{ n, name, sp, give: { itemId: qty }, retail, start, floor, rival }]
//   RECIPE_OF { catchId: recipeId } (the "catch of the day" recipe cards)   BOATS [{ name, c, skipper }]   NEW_ITEM_IDS
import './venues_extra.js';
import { VENUE_BY_ID } from './venues.js';
import { ITEMS, ITEM_BY_ID, DISHES, GIFTS, MISC } from './items.js';
import { MOODLETS } from './needs.js';
import { EVENTS } from './calendar.js';

export const FM = { room: 'fishmarket', place: 'fishmarket' }, NAME = 'Bay Fish Hall';
export const HOURS = { hall: [5, 19], auction: [5.5, 7.5], retail: [7.5, 19], food: [10, 19], festival: [11, 19], throwEvery: 9 };
export const BOATS = [{ name: 'MARGO', c: '#2f6f9f', skipper: 'Captain Ilse Brandt' }, { name: 'OSPREY', c: '#c8402e', skipper: 'Tomasz Wren' }, { name: 'LITTLE DIPPER', c: '#2f8a6a', skipper: 'Nan Okafor' }];
export const CATCH = [
  { id: 'cod', name: 'Cod', item: 'fish', sp: 'cod' }, { id: 'salmon', name: 'Salmon', item: 'salmon', sp: 'salmon' }, { id: 'mackerel', name: 'Mackerel', sp: 'mackerel' }, { id: 'shrimp', name: 'Shrimp', item: 'shrimp', sp: 'shrimp' },
  { id: 'mussels', name: 'Mussels', item: 'mussels', sp: 'mussel' }, { id: 'crab', name: 'Crab', sp: 'crab' }, { id: 'lobster', name: 'Lobster', sp: 'lobster' }, { id: 'oyster', name: 'Oysters', sp: 'oyster' }, { id: 'tuna', name: 'Tuna', sp: 'tuna' }, { id: 'squid', name: 'Squid', sp: 'squid' },
];
const LEVEL = [{ t: 'NONE', mult: 1.25, fresh: 0 }, { t: 'SCARCE', mult: 1.15, fresh: 0 }, { t: 'FAIR', mult: 1, fresh: 0 }, { t: 'PLENTY', mult: .7, fresh: 1 }];
const h3 = (a, b) => { let h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
/** what the boats brought in on a day. wx = the weather before dawn ('clear' | 'cloudy' | 'rain' | 'storm' | 'fog' | 'snow'): storms keep boats in, fog halves the fleet */
export function catchOf(day, wx = 'clear') {
  const boats = wx === 'storm' ? 0 : wx === 'fog' || wx === 'snow' ? 1 : wx === 'rain' ? 2 : 3, of = {}; let top = null, best = -1;
  CATCH.forEach((c, i) => { const k = h3(day * 7 + 3, i * 13 + 1), luck = k + (boats - 2) * .22; const level = boats === 0 ? (k > .8 ? 1 : 0) : luck > .68 ? 3 : luck > .3 ? 2 : luck > .08 ? 1 : 0; of[c.id] = Object.assign({ level }, LEVEL[level]); const sc = level * 10 + h3(day, i + 40); if (sc > best) { best = sc; top = c.id; } });
  if (boats > 0 && of[top].level < 3) of[top] = Object.assign({ level: 3 }, LEVEL[3]);
  const lines = CATCH.filter(c => of[c.id].level !== 2).sort((a, b) => of[b.id].level - of[a.id].level).slice(0, 5).map(c => `${c.name.toUpperCase()} ${of[c.id].t}`);
  return { boats, wx, of, top: boats > 0 ? top : null, lines: boats ? lines : ['NO BOATS OUT', 'STORM AT SEA', 'YESTERDAYS ICE'] };
}
export const RECIPE_OF = { cod: 'pan_fish', salmon: 'baked_salmon', mackerel: 'fish_cakes', shrimp: 'garlic_shrimp', mussels: 'mussels_broth', crab: 'harbor_chowder', lobster: 'fish_pie', oyster: 'harbor_chowder', tuna: 'poke_bowl', squid: 'fish_tacos' };

const S = (id, kind, name, keeper, sells, sp, lines) => ({ id, kind, name, keeper, sells, sp, lines, venue: 'fishmarket:' + id });
export const STALLS = [
  S('whole', 'whole', 'Kowalczyk Daughters', 'Basia Kowalczyk', [{ id: 'fish', catch: 'cod' }, { id: 'salmon', catch: 'salmon' }, { id: 'fm_mackerel', catch: 'mackerel' }], ['cod', 'salmon', 'snapper', 'bass', 'mackerel', 'trout'], ['Cod came in at five. It was swimming at four.', 'Eyes bright, gills red. That is all you ever need to know.', 'My mother sold fish on this spot. Her mother sold it off a barrow.', 'Watch your head when Dusty whistles. Something is about to fly.']),
  S('tuna', 'tuna', 'Big Blue', 'Kenji Mori', [{ id: 'fm_tuna_loin', catch: 'tuna' }, { id: 'fm_swordfish', catch: 'tuna' }, { id: 'fish', catch: 'cod' }], ['tuna', 'swordfish', 'halibut', 'monkfish'], ['One fish. Two hundred kilos. Four men to lift it.', 'You do not cut tuna. You negotiate with it.', 'The sword is real. Please do not test it.']),
  S('shell', 'shell', 'Claw & Order', 'Dolores Pike', [{ id: 'mussels', catch: 'mussels' }, { id: 'fm_crab', catch: 'crab' }, { id: 'fm_lobster_roll', catch: 'lobster' }], ['crab', 'lobster', 'mussel', 'clam', 'scallop'], ['Mussels by the scoop. If one will not close, leave it.', 'The crabs have names. Do not ask the names.', 'Lobsters from the tank are extra. They know what they are worth.']),
  S('squid', 'squid', 'Eight Arms', 'Luca Ferrante', [{ id: 'shrimp', catch: 'shrimp' }, { id: 'fm_calamari', catch: 'squid' }, { id: 'fm_urchin' }], ['octopus', 'squid', 'urchin', 'shrimp', 'eel'], ['Shrimp, pink as a sunburn. Heads on, for the stock.', 'Three hearts, the octopus. More than my ex-landlord.', 'Urchin on toast. Trust me once.']),
  S('oyster', 'oyster', 'The Shuck Stops Here', 'Marguerite Bell', [{ id: 'fm_oysters', catch: 'oyster' }, { id: 'fm_shrimp_cocktail', catch: 'shrimp' }], ['oyster'], ['Gull Point beds, pulled this morning. Lemon, nothing else.', 'I can shuck a dozen in forty seconds. On a slow day.', 'The Oyster Derby is always open. Bring your wrists.']),
  S('smoke', 'smoke', 'Halvorsen Smokery', 'Old Halvorsen', [{ id: 'fm_kipper' }, { id: 'fm_smoked_salmon', catch: 'salmon' }], ['kipper', 'herring', 'sardine'], ['Oak, salt and patience. Mostly patience.', 'Kippers for breakfast. Your neighbours will know. Let them.', 'My cousin runs the telescope up on the hill. I got the nose, she got the eyes.']),
  S('salt', 'salt', 'Salt of the Bay', 'Priya Nair', [{ id: 'fm_salt' }, { id: 'fm_spice' }, { id: 'lemon' }, { id: 'nori' }], [], ['Flaked from our own tide pans. The grey one is the good one.', 'Chowder spice: nine things. I will tell you seven.', 'Fish wants salt, lemon and to be left alone.']),
  S('knife', 'knife', 'Sharp Bros', 'Abel Sharp', [{ id: 'fm_knife' }, { id: 'fm_sharpen', service: true }], [], ['A dull knife is the dangerous one.', 'Twenty strokes a side. My brother says nineteen. We do not speak.', 'Bring me any blade in town. Scissors too.']),
  S('tackle', 'tackle', 'Hook Line & Sinker', 'Winnie Achebe', [{ id: 'fishing_rod' }, { id: 'fm_lure' }, { id: 'fm_float' }], [], ['Glass floats off the old herring nets. They hold the light.', 'The pier, an hour after dawn. That is all I am saying.', 'A lure is a lie told to a fish. I tie very honest lies.']),
  S('chowder', 'chowder', 'Chowder Pot', 'Gus Delacroix', [{ id: 'fm_chowder' }, { id: 'fm_bisque', catch: 'lobster' }], [], ['White or red. Do not say "both". ...Fine. Both.', 'The bread bowl is the spoon. That is the whole idea.', 'Forty litres since dawn. The chefs eat it standing up.']),
  S('sushi', 'sushi', 'Tide & Rice', 'Emi Tanaka', [{ id: 'fm_poke', catch: 'tuna' }, { id: 'fm_nigiri', catch: 'salmon' }], [], ['The fish walked thirty metres to get here. From that stall.', 'Poke with whatever Kenji cut this morning.', 'Rice first. Everything else is decoration.']),
  S('chips', 'chips', 'The Golden Fry', 'Mo Hadley', [{ id: 'fm_fishchips', catch: 'cod' }, { id: 'fm_calamari', catch: 'squid' }], [], ['Salt and vinegar? Say when. ...You did not say when.', 'Cod from across the aisle. Batter from my nan.', 'Mind the gulls on your way out. They know the paper.']),
];
export const STALL_BY_ID = Object.fromEntries(STALLS.map(s => [s.id, s]));

const hrs = r => [0, 1, 2, 3, 4, 5, 6].map(() => r);
const venue = (id, name, type, offers, hours, blurb) => (VENUE_BY_ID[id] = VENUE_BY_ID[id] || { id, name, type, district: 'harbor', where: 'On the boardwalk at the west end of the harbor, under the red roof', station: null, interior: true, hours, offers, priceMult: 1, jobId: null, delivers: false, blurb, showpiece: true });
venue(FM.place, NAME, 'shop', { shop: ['ingredient', 'snack', 'gift', 'misc'], menu: true, functions: ['seat', 'till'] }, hrs(HOURS.hall), 'The iron-and-glass fish market on the quay: a dawn auction, twelve stalls on ice, a lobster tank, chowder, and fishmongers who throw the salmon.');
for (const s of STALLS) venue(s.venue, s.name, /chowder|sushi|chips|oyster/.test(s.kind) ? 'food' : 'shop', { shop: ['ingredient', 'snack', 'gift', 'misc'], menu: true, functions: ['till'] }, hrs(/chowder|sushi|chips/.test(s.kind) ? HOURS.food : HOURS.retail), s.name + ', a stall in the ' + NAME + '.');

const mood = (id, o) => { if (!MOODLETS[id]) MOODLETS[id] = Object.assign({ workPerf: 1, walkSpeed: 1, source: 'activity' }, o); };
mood('sea_air', { name: 'Sea Air', desc: 'Salt, ice and diesel off the quay. Your lungs feel rinsed.', mood: 4, minutes: 180 });
mood('market_bargain', { name: 'Hammer Price', desc: 'You stopped the auction clock at exactly the right moment. A whole crate, for that.', mood: 7, minutes: 300 });
mood('nice_catch', { name: 'Nice Catch!', desc: 'A whole salmon came flying across the aisle and you caught it. The fish hall cheered.', mood: 8, minutes: 240 });
mood('shucker', { name: 'Fast Hands', desc: 'Oyster knife, twist, pop. Marguerite says you are a natural.', mood: 5, minutes: 180 });

const dish = (id, name, price, effects, eatMinutes, course, icon, stall) => ({ id, name, category: 'dish', price, icon, effects, stack: 1, soldAt: ['fishmarket:' + stall], venue: 'fishmarket:' + stall, eatMinutes, course, takeaway: true });
const snack = (id, name, price, effects, icon, stall, shelf, fridge) => ({ id, name, category: 'snack', price, icon, effects, stack: 5, soldAt: ['fishmarket:' + stall], eatMinutes: 6, shelfLifeDays: shelf, needsFridge: !!fridge, heat: null });
const gift = (id, name, price, icon, stall, relationship, giftTags) => ({ id, name, category: 'gift', price, icon, effects: {}, stack: 3, soldAt: ['fishmarket:' + stall], relationship, giftTags });
const NEW = [
  dish('fm_oysters', 'Half-Dozen Bay Oysters', 9, { hunger: 14, fun: 12 }, 8, 'snack', 'six oysters on ice, lemon', 'oyster'),
  dish('fm_shrimp_cocktail', 'Shrimp Cocktail', 7, { hunger: 18, fun: 8 }, 8, 'snack', 'glass, pink shrimp, red sauce', 'oyster'),
  dish('fm_chowder', 'Harbor Chowder in a Bread Bowl', 7, { hunger: 44, fun: 8, energy: 2 }, 14, 'main', 'bread bowl, cream soup', 'chowder'),
  dish('fm_bisque', 'Lobster Bisque Cup', 6, { hunger: 24, fun: 10 }, 9, 'snack', 'paper cup, orange soup', 'chowder'),
  dish('fm_poke', 'Tuna Poke Bowl', 10, { hunger: 44, fun: 9, energy: 3 }, 12, 'main', 'black bowl, red tuna, rice', 'sushi'),
  dish('fm_nigiri', 'Nigiri Box', 9, { hunger: 32, fun: 11 }, 10, 'main', 'tray, six nigiri', 'sushi'),
  dish('fm_fishchips', 'Fish & Chips in Paper', 8, { hunger: 55, fun: 8 }, 14, 'main', 'paper cone, battered fish, chips', 'chips'),
  dish('fm_calamari', 'Fried Calamari Cone', 6, { hunger: 26, fun: 9 }, 8, 'snack', 'paper cone, golden rings', 'chips'),
  dish('fm_lobster_roll', 'Lobster Roll', 13, { hunger: 46, fun: 14 }, 12, 'main', 'split bun, red lobster', 'shell'),
  dish('fm_crab', 'Cracked Dungeness Crab', 14, { hunger: 40, fun: 13 }, 16, 'main', 'orange crab, lemon, mallet', 'shell'),
  dish('fm_urchin', 'Sea Urchin on Toast', 9, { hunger: 14, fun: 13 }, 6, 'snack', 'toast, gold urchin', 'squid'),
  snack('fm_kipper', 'Oak-Smoked Kippers', 4, { hunger: 20, fun: 3 }, 'two golden split fish', 'smoke', 10, true),
  snack('fm_smoked_salmon', 'Smoked Salmon Slices', 7, { hunger: 18, fun: 7 }, 'orange slices, paper', 'smoke', 10, true),
  snack('fm_mackerel', 'Grilled Mackerel Fillet', 4, { hunger: 24, fun: 4 }, 'striped fish fillet', 'whole', 2, true),
  snack('fm_tuna_loin', 'Seared Tuna Loin', 12, { hunger: 34, fun: 10, energy: 3 }, 'red block, seared edge', 'tuna', 2, true),
  snack('fm_swordfish', 'Swordfish Steak', 10, { hunger: 36, fun: 7 }, 'white steak, grill marks', 'tuna', 2, true),
  gift('fm_salt', 'Bay Sea Salt', 6, 'jar, grey flakes, blue label', 'salt', 5, ['foodie', 'homemade']),
  gift('fm_spice', 'Chowder Spice Tin', 5, 'red tin, anchor', 'salt', 5, ['foodie']),
  gift('fm_lure', 'Hand-Tied Lure', 5, 'feather lure, hook', 'tackle', 4, ['outdoorsy', 'nerdy']),
  gift('fm_float', 'Glass Net Float', 12, 'green glass ball in rope', 'tackle', 7, ['arty', 'fancy']),
  { id: 'fm_knife', name: "Fishmonger's Fillet Knife", category: 'misc', price: 28, icon: 'long thin blade, wood handle', effects: {}, stack: 1, soldAt: ['fishmarket:knife'], note: 'Thin, flexible, frightening. Filleting lessons at the Bay Fish Hall go better with your own knife.' },
  { id: 'fm_stampbook', name: 'Fish Stamp Book', category: 'misc', price: 0, icon: 'blue booklet, fish stamp', effects: {}, stack: 1, soldAt: [], note: 'Species of the Bay: a stamp for every kind of seafood you have looked at on the ice of the Bay Fish Hall.' },
  { id: 'fm_tally', name: 'Brass Auction Tally No. 41', category: 'misc', price: 0, icon: 'round brass token, 41', effects: {}, stack: 1, soldAt: [], note: 'A buyer\'s tally from the dawn auction. Captain Brandt says it was her grandfather\'s. Not for sale.' },
];
export const NEW_ITEM_IDS = NEW.map(i => i.id);
const LISTS = { gift: GIFTS, misc: MISC, dish: DISHES };
for (const it of NEW) { if (ITEM_BY_ID[it.id]) continue; ITEMS.push(it); ITEM_BY_ID[it.id] = it; if (Array.isArray(LISTS[it.category])) LISTS[it.category].push(it); }
// the cookbook's seafood (and the lemon and nori that go with it) is sold on the ice here
for (const s of STALLS) for (const q of s.sells) { const it = ITEM_BY_ID[q.id]; if (it && Array.isArray(it.soldAt)) { if (!it.soldAt.includes(s.venue)) it.soldAt.push(s.venue); if (it.category === 'ingredient' && !it.soldAt.includes(FM.place)) it.soldAt.push(FM.place); } }

const KG = { fish: .8, salmon: .6, shrimp: .3, mussels: 1, lemon: .1, nori: .05, fm_crab: 1.1, fm_tuna_loin: .5, fm_swordfish: .45, fm_kipper: .35, fm_smoked_salmon: .2, fm_mackerel: .3, fm_oysters: .6, fm_salt: .25, fm_lobster_roll: .3 };
export const weightOf = id => KG[id] || .25;
const q25 = n => Math.max(.25, Math.round(n * 4) / 4);
/** today's price of an item at a stall: list price x what the boats landed (x 0.85 on festival day) */
export function priceOf(itemId, stallId, day, wx, fest) { const it = ITEM_BY_ID[itemId], st = STALL_BY_ID[stallId], q = st && st.sells.find(s => s.id === itemId); if (!it) return 0; let m = 1; if (q && q.catch) m = catchOf(day, wx).of[q.catch].mult; if (fest) m *= .85; return q25(it.price * m); }
/** the six lots of the dawn auction */
export function lotsOf(day, wx) {
  const c = catchOf(day, wx), pool = CATCH.filter(k => c.of[k.id].level >= 2), out = [], GIVE = { cod: { fish: 3 }, salmon: { salmon: 3 }, mackerel: { fm_mackerel: 3 }, shrimp: { shrimp: 3 }, mussels: { mussels: 3 }, crab: { fm_crab: 1, mussels: 1 }, lobster: { fm_lobster_roll: 1, shrimp: 1 }, oyster: { fm_oysters: 1, mussels: 2 }, tuna: { fm_tuna_loin: 2 }, squid: { fm_calamari: 1, shrimp: 2 } };
  const n = c.boats === 0 ? 0 : c.boats === 1 ? 3 : 6;
  for (let i = 0; i < n && pool.length; i++) { const a = pool[Math.floor(h3(day * 3 + i, 71) * pool.length)], b = pool[Math.floor(h3(day * 5 + i, 97) * pool.length)], give = {}; for (const k of [a, b]) for (const [id, q] of Object.entries(GIVE[k.id])) give[id] = (give[id] || 0) + q;
    let retail = 0; for (const [id, q] of Object.entries(give)) retail += (ITEM_BY_ID[id] ? ITEM_BY_ID[id].price : 4) * q; const boat = BOATS[i % Math.max(1, c.boats)];
    out.push({ n: i + 1, name: a === b ? `A crate of ${a.name.toLowerCase()}` : `Mixed crate: ${a.name.toLowerCase()} and ${b.name.toLowerCase()}`, sp: [a.sp, b.sp, a.sp], give, retail, start: Math.round(retail * 1.1), floor: Math.max(2, Math.round(retail * .3)), rival: Math.round(retail * (.42 + h3(day + i * 11, 5) * .3)), boat: boat.name }); }
  return out;
}

const ALL = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
if (!EVENTS.some(e => e.id === 'fm_auction')) EVENTS.push(
  { id: 'fm_auction', name: 'Dawn Fish Auction', kind: 'seasonal', when: { season: 'any', days: ALL }, hours: HOURS.auction, place: { venue: FM.place }, blurb: 'Every morning at half past five the boats unload at the Bay Fish Hall and the catch is sold by the falling clock: the price drops until somebody stops it. Chefs bid with a raised hand. So can you.', special: {} },
  { id: 'fm_festival', name: 'Quayside Seafood Festival', kind: 'seasonal', when: { season: 'any', days: [8] }, hours: HOURS.festival, place: { venue: FM.place, district: 'harbor' }, blurb: 'The 8th of every season: the whole Bay Fish Hall drops its prices, the chowder pots come out onto the floor, the Oyster Derby pays double and the lighthouse sweeps the bay in colour after dark.', special: { crowdMult: 1.5, moodlet: 'sea_air', discounts: STALLS.map(s => ({ venue: s.venue, mult: .85 })) }, notify: 4 });
export const isFestival = n => n.dayOfMonth === 8;
