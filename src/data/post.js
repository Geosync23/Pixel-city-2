// Maple Bay Post — design data for the post offices and the mail system (sim/post.js, scenes/rooms/post*.js, ui/phone_post.js, story/letters.js).
//   PR room ids   OFFICES [{ key, room, name, short, district, bld: { id, x?, y? } (the EXISTING building it lives in), master, blurb, hours: [Mon..Sun], line (standing line) | ticket (take a number) }]
//   officeHours(o, n) -> [open, close] | null    officeOpen(o, n)    isHoliday(day)    OFFICE_BY_ROOM
//   TUNE (queue, line, writing, wrapping, delivery hours)    PRICE (stamps, boxes, postage, P.O. box, telegram)    BOXES    SPEEDS    weightOf(item) kg    volOf(item)
//   postage(size, kg, speed, local) -> $    STAMPS [{ id, name, set, price, src }]    STAMP_SETS    POSTCARDS    LANDMARK_CHOICES (commemorative stamp)
//   Items (post_*), moodlets (post_*), venue records (room id = venue id) and calendar events are added to the shared tables at import.
import { ITEMS, ITEM_BY_ID, GIFTS, MISC, HOMEGOODS, PACKAGED_FOOD } from './items.js';
import { MOODLETS } from './needs.js';
import { VENUE_BY_ID } from './venues.js';
import { EVENTS, eventOnDay } from './calendar.js';

export const PR = { main: 'post_main', sort: 'post_sort', maple: 'post_maplewood', hill: 'post_hillcrest', harbor: 'post_harbor', down: 'post_downtown' };
export const NAME = 'Maple Bay General Post Office';
const WK = (a, b, sat, thu) => [0, 1, 2, 3, 4, 5, 6].map(d => (d === 6 ? null : d === 5 ? sat : d === 3 && thu ? [a, thu] : [a, b]));
export const OFFICES = [
  { key: 'main', room: PR.main, name: NAME, short: 'General Post Office', district: 'oldtown', bld: { id: 'bld.civic.postoffice' }, master: 'Postmaster Fairweather', ticket: true, hours: WK(8, 18, [9, 14], 20), sign: 'G.P.O.',
    where: 'Old Town, the cream building with the blue stripe by Market Square', blurb: 'The General Post Office of 1898: a hall of brass boxes, four counter windows with a queue that really moves, a parcel scale, a philately counter, writing desks with pens on chains and a sorting floor you can watch from a gallery.' },
  { key: 'maple', room: PR.maple, name: 'Maplewood Sub-Post Office', short: 'Maplewood Post', district: 'maplewood', bld: { id: 'bld.res.cottage', x: 285, y: 222 }, master: 'Mrs. Opal Greer', hours: WK(9, 17, [9, 12.5]), sign: 'POST',
    where: 'Maplewood, the cottage two doors from the corner', blurb: 'A post office in a cottage front room: a counter where the sideboard used to be, a line that reaches the door on pension day, and a notice board that knows everything first.' },
  { key: 'hill', room: PR.hill, name: 'Hillcrest Post & Telegraph', short: 'Hillcrest Post', district: 'hillcrest', bld: { id: 'bld.res.gablehouse', x: 85, y: 83 }, master: 'Mr. Leopold Vance', hours: WK(9, 17, [9, 12.5]), sign: 'POST',
    where: 'Hillcrest, the gabled house on the terrace', blurb: 'Polished wood, a brass telegraph key that still works and a postmaster who wears sleeve garters. Telegrams sent while you wait. The old street directories are behind the counter.' },
  { key: 'harbor', room: PR.harbor, name: 'Harbor Mail Boat Office', short: 'Harbor Post', district: 'harbor', bld: { id: 'bld.harbor.boathouse', x: 72, y: 331 }, master: 'Skipper Dolly Marsh', hours: WK(8, 16, [8, 12]), sign: 'MAIL BOAT',
    where: 'Harborside, the boathouse on the quay', blurb: 'The boathouse the mail boat sails from: post for the lighthouse, the boats and the far end of the pier. Rope, charts, a tide board, a box for letters to the lighthouse keeper and a rack of bottles for messages.' },
  { key: 'down', room: PR.down, name: 'Downtown Postcard Counter', short: 'Postcard Counter', district: 'downtown', bld: { id: 'bld.downtown.pavilion', x: 185, y: 245 }, master: 'Kenji Abe', hours: [0, 1, 2, 3, 4, 5, 6].map(d => (d === 6 ? null : [9, 18])), sign: 'POST',
    where: 'Downtown, inside the Visitor Info pavilion', blurb: 'The post counter in the Visitor Info pavilion: racks of postcards, a wall map of the city, and a photo postcard with you on it, written, stamped and posted in two minutes.' },
];
export const OFFICE_BY_ROOM = Object.fromEntries(OFFICES.map(o => [o.room, o])); OFFICE_BY_ROOM[PR.sort] = OFFICES[0];
export const OFFICE_BY_KEY = Object.fromEntries(OFFICES.map(o => [o.key, o]));
export const isHoliday = day => day >= 0 && EVENTS.some(e => e.kind === 'holiday' && e.hours && e.hours[0] === 0 && e.when && e.when.days && eventOnDay(e, day));
export const officeHours = (o, n) => (isHoliday(n.day) ? null : o.hours[n.weekday]);
export const officeOpen = (o, n) => { const h = officeHours(o, n); return !!h && n.hf >= h[0] && n.hf < h[1]; };
export const hoursText = o => (o.key === 'main' ? 'Monday to Friday 08:00 to 18:00 (Thursday until 20:00), Saturday 09:00 to 14:00. Closed Sundays and holidays.' : o.key === 'down' ? 'Monday to Saturday 09:00 to 18:00. Closed Sundays and holidays.' : o.key === 'harbor' ? 'Monday to Friday 08:00 to 16:00, Saturday 08:00 to 12:00. Closed Sundays and holidays.' : 'Monday to Friday 09:00 to 17:00, Saturday 09:00 to 12:30. Closed Sundays and holidays.');

export const TUNE = { QUEUE_MIN: 4, LINE_MIN: 3, WRITE_MIN: 12, CARD_MIN: 4, WRAP_MIN: 6, WEIGH_MIN: 2, ROUND: 9.5, PARCELS: 11, COLLECT: 17, WALKOUT: 15, HOLD_DAYS: 10, MAX_LETTERS_DAY: 2, JUNK_EVERY: 2, REPLY_DAYS: [1, 2], WATCH_MIN: 15, CARRIER_FROM: 7.5, CARRIER_TO: 11.5, REWARD: 120 };
export const PRICE = { stamp: 1, paper: 2, pobox: 20, poboxWeeks: 4, telegram: 3, photocard: 4, bottle: 2, cover: 3 };
export const BOXES = [{ id: 's', name: 'Small box', cap: 2, price: 2, base: 4 }, { id: 'm', name: 'Medium box', cap: 5, price: 3.5, base: 6 }, { id: 'l', name: 'Large box', cap: 9, price: 5, base: 9 }];
export const SPEEDS = [{ id: 'std', name: 'Standard', mult: 1, days: 3, local: 1 }, { id: 'exp', name: 'Express', mult: 1.6, days: 2, local: 0 }, { id: 'ovn', name: 'Overnight', mult: 2.4, days: 1, local: 0 }];
const KG = { ingredient: .4, snack: .2, drink: .5, dish: .5, meal: .6, ready_meal: .5, book: .6, gift: .4, misc: .15, outfit: .7, homegood: 2.5 };
export const weightOf = it => (it ? (it.kg || KG[it.category] || .3) : .3);
export const volOf = it => (it && it.category === 'homegood' ? 3 : it && it.category === 'outfit' ? 2 : 1);
export const postage = (size, kg, speed, local) => { const b = BOXES.find(x => x.id === size) || BOXES[0], s = SPEEDS.find(x => x.id === speed) || SPEEDS[0]; return Math.round((b.base + Math.ceil(kg) * 1.5) * s.mult * (local ? .6 : 1) * 4) / 4; };

/* ---------- stamps (the pictures are drawn in scenes/rooms/post_views.js by id) ---------- */
const st = (id, name, set, price, x) => Object.assign({ id, name, set, price }, x);
export const STAMP_SETS = [['def', 'The Maple Leaf definitives'], ['land', 'Landmarks of Maple Bay'], ['bird', 'Birds of the Bay'], ['sea', 'Lights & Ships'], ['season', 'The Four Seasons'], ['otter', 'Go Otters!'], ['transit', 'Getting Around'], ['special', 'Specials & rarities']];
export const STAMPS = [
  st('leaf_red', 'Maple Leaf, red', 'def', 1), st('leaf_green', 'Maple Leaf, green', 'def', 1), st('leaf_blue', 'Maple Leaf, blue', 'def', 1), st('leaf_gold', 'Maple Leaf, gold', 'def', 1),
  st('l_cityhall', 'City Hall clock tower', 'land', 1.5), st('l_light', 'Maple Bay Light', 'land', 1.5), st('l_hotel', 'The Grand Maple Hotel', 'land', 1.5), st('l_central', 'Central Station', 'land', 1.5), st('l_observ', 'The Observatory', 'land', 1.5), st('l_conserv', 'The Conservatory', 'land', 1.5),
  st('l_aquarium', 'The Aquarium', 'land', 1.5), st('l_arena', 'The Arena', 'land', 1.5), st('l_museum', 'The Museum', 'land', 1.5), st('l_skydeck', 'The SkyDeck tower', 'land', 1.5), st('l_fishhall', 'The Bay Fish Hall', 'land', 1.5), st('l_gpo', 'The General Post Office', 'land', 1.5),
  st('b_gull', 'Herring gull', 'bird', 1.5), st('b_heron', 'Blue heron', 'bird', 1.5), st('b_kingfisher', 'Kingfisher', 'bird', 1.5), st('b_owl', 'Barn owl', 'bird', 1.5), st('b_robin', 'Robin', 'bird', 1.5), st('b_cormorant', 'Cormorant', 'bird', 1.5), st('b_sandpiper', 'Sandpiper', 'bird', 1.5), st('b_puffin', 'Puffin', 'bird', 1.5),
  st('s_ferry', 'The harbor ferry', 'sea', 1.5), st('s_tug', 'Tugboat "Marigold"', 'sea', 1.5), st('s_sail', 'Regatta day', 'sea', 1.5), st('s_buoy', 'Bell buoy No. 3', 'sea', 1.5), st('s_mailboat', 'The mail boat', 'sea', 1.5), st('s_anchor', 'Anchor & rope', 'sea', 1.5),
  st('sp_blossom', 'Cherry blossom', 'season', 1.25, { season: 0 }), st('sp_tulip', 'Park tulips', 'season', 1.25, { season: 0 }), st('su_sun', 'Sunflower', 'season', 1.25, { season: 1 }), st('su_parasol', 'Boardwalk parasol', 'season', 1.25, { season: 1 }),
  st('au_leaf', 'Autumn maple', 'season', 1.25, { season: 2 }), st('au_pumpkin', 'Market pumpkin', 'season', 1.25, { season: 2 }), st('wi_snow', 'Snowflake', 'season', 1.25, { season: 3 }), st('wi_mitten', 'Red mitten', 'season', 1.25, { season: 3 }),
  st('o_face', 'Ollie the Otter', 'otter', 2), st('o_stick', 'Face-off', 'otter', 2), st('o_pennant', 'Go Otters! pennant', 'otter', 2), st('o_cup', 'The Bay Cup', 'otter', 2),
  st('t_rail', 'The light rail', 'transit', 1.25), st('t_bus', 'Bus No. 2', 'transit', 1.25), st('t_cab', 'MapleCab', 'transit', 1.25), st('t_bike', 'Bicycle', 'transit', 1.25),
  st('rpo54', 'Railway Post Office, 1954', 'special', 0, { src: 'Granddad Emmett' }), st('light58', 'Maple Bay Light, old blue issue', 'special', 0, { src: 'Miss Ada Lindqvist' }), st('lightnight', 'The Light at Night', 'special', 0, { src: 'the lighthouse keeper' }),
  st('fair', 'Stamp Fair overprint', 'special', 2, { src: 'the Stamp Fair' }), st('comm', 'Maple Bay commemorative', 'special', 2, { src: 'issued in your honour' }),
];
export const STAMP_BY_ID = Object.fromEntries(STAMPS.map(s => [s.id, s]));
export const LANDMARK_CHOICES = [['l_light', 'The lighthouse'], ['l_cityhall', 'City Hall and its clock'], ['l_gpo', 'The General Post Office'], ['l_central', 'Central Station'], ['l_fishhall', 'The Bay Fish Hall'], ['l_observ', 'The Observatory']];
export const COVERS = { post_stamp_fair: 'Stamp Fair first-day cover', founders_day: "Founders' Day first-day cover", gratitude_supper: 'Gratitude Supper first-day cover', midwinter_day: 'Midwinter first-day cover', new_years_eve: "New Year's first-day cover", post_lighthouse_letters: 'Letters to the Lighthouse cover' };

/* ---------- venue records (room id = venue id, so hours, the guide, map pins and the shop window work) ---------- */
for (const o of OFFICES) if (!VENUE_BY_ID[o.room]) VENUE_BY_ID[o.room] = { id: o.room, name: o.name, type: 'shop', district: o.district, where: o.where, station: null, interior: true, hours: o.hours, offers: { shop: ['gift', 'misc', 'homegood'], functions: [] }, priceMult: 1, jobId: null, delivers: false, blurb: o.blurb, showpiece: o.key === 'main' };

/* ---------- moodlets ---------- */
const mood = (id, o) => { if (!MOODLETS[id]) MOODLETS[id] = Object.assign({ workPerf: 1, walkSpeed: 1, source: 'activity' }, o); };
mood('post_wrote', { name: 'Put It in Writing', desc: 'You sat at a desk with a pen on a chain and said it properly.', mood: 5, minutes: 300 });
mood('post_sent', { name: 'Something in the Post', desc: 'It is out of your hands now, in a van, heading for somebody.', mood: 4, minutes: 300 });
mood('post_letter', { name: 'A Letter From Home', desc: 'Somebody sat down and wrote to you. With a stamp.', mood: 8, minutes: 480 });
mood('post_package', { name: 'Care Package', desc: 'A box came. Somebody far away put things in it, one at a time, thinking of you.', mood: 9, minutes: 600 });
mood('post_stampbug', { name: 'Stamp Fever', desc: 'You bought a tiny picture of a bird and now you want all the birds.', mood: 4, minutes: 240 });
mood('post_hero', { name: 'Delivered at Last', desc: 'Fifty-eight years late and exactly on time. You carried it the last mile.', mood: 12, workPerf: 3, minutes: 2880 });

/* ---------- items ---------- */
const ALL = OFFICES.map(o => o.room), MAIN = [PR.main], CARDS = [PR.main, PR.down, PR.harbor];
const misc = (id, name, price, icon, note, soldAt, x) => Object.assign({ id, name, category: 'misc', price, icon, effects: {}, stack: 1, soldAt: soldAt || [], note }, x);
const gift = (id, name, price, icon, relationship, giftTags, soldAt, x) => Object.assign({ id, name, category: 'gift', price, icon, effects: {}, stack: 3, soldAt: soldAt || MAIN, relationship, giftTags }, x);
const food = (id, name, icon, effects, note) => ({ id, name, category: 'snack', price: 4, icon, effects, stack: 6, soldAt: [], eatMinutes: 4, shelfLifeDays: null, needsFridge: false, heat: null, note });
const frame = (id, name, price, icon, soldAt) => ({ id, name, category: 'homegood', price, icon, effects: {}, stack: 1, soldAt: soldAt || [], tag: 'decor', tier: 1, footprint: [2, 1], placement: 'wall', bonus: { mult: 1.1, ambience: 2 } });
export const POSTCARDS = [['light', 'The Light at Dusk'], ['cityhall', 'City Hall Clock'], ['harbor', 'Boats at the Quay'], ['otters', 'Go Otters!'], ['market', 'Old Town Market'], ['park', 'The Pond in Central Park'], ['skyline', 'Downtown from the River'], ['tram', 'The Loop Line']];
const NEW = [
  misc('post_paper', 'Writing Paper & Envelopes', PRICE.paper, 'cream sheets, blue envelope', 'Five sheets and five envelopes, for writing letters at home. The desks at any post office are free.', ALL, { stack: 5, uses: 5 }),
  misc('post_letter', 'Sealed Letter', 0, 'white envelope, red stamp corner', 'Written, folded, sealed. It needs a stamp and a mailbox: any street box, any post office, the slot in a lobby, or the basket by your own door.', [], { stack: 9 }),
  misc('post_parcel', 'Wrapped Parcel', 0, 'brown paper parcel, string', 'Packed and wrapped by you. Take it to a post office counter to be weighed and sent.'),
  misc('post_slip', 'Collection Slip', 0, 'pink card, sorry we missed you', '"SORRY WE MISSED YOU." A parcel is waiting for you at the counter of the post office named on the card.', [], { stack: 5 }),
  misc('post_deadletter', 'The Undelivered Letter', 0, 'yellowed envelope, blue ink, old stamp', '"Miss Ada Lindqvist, The Blue Door, Tannery Steps, Maple Bay." Postmarked fifty-eight years ago. Stamped NO SUCH STREET. Never opened.'),
  misc('post_flower', 'Pressed Flower', 0, 'small flower on a card', 'Pressed flat between two sheets of blotting paper and sent a long way. It still has its colour.', [], { stack: 9 }),
  misc('post_pick', 'Wet Cement Guitar Pick', 0, 'green pick, bite mark', 'Official merchandise of a band with four chords and one drum. First one ever made.'),
  misc('post_bracelet', 'Friendship Bracelet', 0, 'green and white knotted thread', 'Otters colours, knotted by Robin. There is a second one, somewhere in Pinehollow.'),
  misc('post_bookmark', 'Compass-Rose Bookmark', 0, 'ribbon, tiny compass', 'From a 1971 atlas, plate 34. A small pencilled cross marks Maple Bay.'),
  misc('post_mixtape', 'Sam\'s Tape', 0, 'cassette, handwritten label', 'Side A: the week you left. Side B: the Rialto, five nights of projector, coughing and a whole cinema humming.'),
  gift('post_scarf', 'Aunt June\'s Scarf', 0, 'long red scarf, cream stripe', 6, ['cozy', 'cute'], [], { note: 'Six feet of maple-leaf red with a cream stripe. Knitted through a very dull sermon. Aunts know if you wear it.' }),
  food('post_jam', 'Aunt June\'s Plum Jam', 'jar, dark jam, gingham lid', { hunger: 14, fun: 6 }, 'The dark sort, from the tree by the garage. In this family, jam means something.'),
  food('post_biscuits', 'Oat Biscuits', 'tin, round biscuits', { hunger: 16, fun: 4 }, 'The ones you like. She remembered.'),
  food('post_cocoa', 'Tin of the Good Cocoa', 'red tin, cocoa', { hunger: 8, fun: 8, energy: 4 }, 'Not the ordinary cocoa. The good cocoa.'),
  ...POSTCARDS.map(([k, n], i) => gift('post_pc_' + k, 'Postcard: ' + n, 1.5, 'postcard, ' + n.toLowerCase(), 2, ['cute', 'arty'], CARDS, { stack: 5, postcard: n })),
  gift('post_loupe', 'Philatelist\'s Loupe', 9, 'brass magnifier, folding', 5, ['nerdy', 'fancy']),
  gift('post_pen', 'Postmaster Fountain Pen', 14, 'navy pen, gold nib', 6, ['fancy', 'arty']),
  gift('post_van', 'Toy Mail Van', 11, 'small blue van, gold horn', 6, ['cute']),
  gift('post_horn', 'Post Horn Pin', 5, 'gold horn enamel pin', 4, ['cute', 'fancy']),
  frame('post_photo', 'Photo: The Old Porch', 0, 'framed photo, porch, man in lawn chair'),
  frame('post_cover', 'Framed First-Day Cover', 12, 'framed envelope, stamps, postmark', MAIN),
  frame('post_sheet', 'Framed Stamp Sheet: Birds of the Bay', 16, 'framed sheet of bird stamps', MAIN),
];
export const NEW_ITEM_IDS = NEW.map(i => i.id);
const LISTS = { gift: GIFTS, misc: MISC, homegood: HOMEGOODS, snack: PACKAGED_FOOD };
for (const it of NEW) { if (ITEM_BY_ID[it.id]) continue; ITEMS.push(it); ITEM_BY_ID[it.id] = it; if (Array.isArray(LISTS[it.category])) LISTS[it.category].push(it); }
export const POST_VIS = { post_photo: { a: 'wall.post_frame', p: { k: 'porch' } }, post_cover: { a: 'wall.post_frame', p: { k: 'cover' } }, post_sheet: { a: 'wall.post_frame', p: { k: 'sheet' } } };
/** things from Maple Bay (the "send something back home" parcel wants at least one) */
export const isLocal = it => !!it && (/^(post_pc_|ch_|hotel_|gift_postcards|lh_|fish_|aqua_|arena_|mus_|obs_|cons_|nat_)/.test(it.id) || /maple bay|otter|lighthouse/i.test(it.name || ''));
export const isPostcard = it => !!it && (!!it.postcard || /postcard/i.test(it.name || ''));

/* ---------- calendar ---------- */
if (!EVENTS.some(e => e.id === 'post_stamp_fair')) EVENTS.push(
  { id: 'post_stamp_fair', name: 'Maple Bay Stamp Fair', kind: 'seasonal', when: { season: 'any', days: [13] }, hours: [10, 14], place: { venue: PR.main }, blurb: 'The second Saturday of every season the dealers set up their tables in the hall of the General Post Office: albums, tweezers, a one-day overprint and a first-day cover cancelled while you watch.', special: { crowdMult: 1.2 }, notify: 3 },
  { id: 'post_lighthouse_letters', name: 'Letters to the Lighthouse', kind: 'seasonal', when: { season: 'any', days: [3] }, hours: [14, 17], place: { venue: PR.harbor }, blurb: 'Kids\' day at the Harbor Mail Boat Office: write a letter to the lighthouse keeper, drop it in the red box, and it goes out on the mail boat. The keeper answers every one. Grown-ups may write too.', special: { crowdMult: 1.1 }, notify: 2 },
  { id: 'post_late_thu', name: 'Late Counter at the General Post Office', kind: 'weekly', when: { weekday: 3 }, hours: [18, 20], place: { venue: PR.main }, blurb: 'Thursdays the General Post Office keeps its windows open until eight for people with jobs and parcels.', special: {}, notify: 0 },
  ...[['founders', 'spring', 12, "Founders' Day"], ['gratitude', 'autumn', 8, 'Gratitude Supper'], ['midwinter', 'winter', 8, 'Midwinter']].map(([k, season, d, nm]) => ({ id: 'post_deadline_' + k, name: `Last Posting Day for ${nm}`, kind: 'seasonal', when: { season, days: [d] }, hours: [8, 18], place: { venue: PR.main }, blurb: `Anything posted by the close of the counters today reaches home in time for ${nm}. After that it is Express, or an apology.`, special: {}, notify: 2 })));
