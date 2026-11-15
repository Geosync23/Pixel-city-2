// cityhall.js — rooms, hours, schedules, council business, ballots, archive lore, items, moodlets, venue records and calendar events for Maple Bay City Hall
// (the existing `bld.downtown.cityhall` on City Hall Plaza; city door 'door:cityhall', runtime poi). Registered additively at import time (same pattern as hotel.js / museum.js).
//   CR room ids   CV venue ids   NAME   OLD_LOBBY (the interim lobby room id this replaces)   PEOPLE (named staff)   FEES   TUNE
//   hallHours(n) -> [open, close] | null (n = G.now(); null = closed all day: Sundays + holidays)   hallOpen(n)   isHoliday(day)   recordsOpen(n)   archiveOpen(n)   towerOpen(n)
//   COUNCIL { days, hours, item (minutes per agenda item) }   councilOn(n)   councilNext(n) -> { day, from, to }   agenda(day) -> [motion x4]   MOTIONS   COUNCILLORS   tally(motion, day, boost) -> { a, n, v }
//   WEDDING { weekday, slots, len }   weddingAt(n) -> { slot, t0 } | null   COUPLES   TOUR { days, hours }   tourOn(n)
//   BALLOTS [{ id, q, opts: [{ id, name, ... }] }]   ballotOf(week)   WINDOWS [{ n, id, short, name, who }]   MODEL_D (district ids of the rotunda model)   MAYOR_PLAQUES   REEL (microfilm frames)   MAPS
//   homeHistory(home) -> { built, architect, owners: [..], oddity }   CH_VIS (merge into housing VIS)   NEW_ITEM_IDS   NOTICES
import './venues_extra.js';
import { VENUE_BY_ID } from './venues.js';
import { ITEMS, ITEM_BY_ID, GIFTS, MISC, HOMEGOODS } from './items.js';
import { MOODLETS } from './needs.js';
import { EVENTS, eventOnDay } from './calendar.js';

export const CR = { hall: 'cityhall', council: 'cityhall_council', records: 'cityhall_records', clerk: 'cityhall_clerk', mayor: 'cityhall_mayor', archive: 'cityhall_archive', tower: 'cityhall_tower' };
export const CV = { place: 'cityhall', shop: 'cityhall:shop', archive: 'cityhall:archive' };
export const NAME = 'Maple Bay City Hall', OLD_LOBBY = 'lobby:4', DOOR = 'door:cityhall', FOUNDED = 1887;
export const PEOPLE = { mayor: 'Mayor Winnie Castellanos', clerk: 'Mr. Ignatius Bell, City Clerk', info: 'Dot at Information', guard: 'Officer Ray', archivist: 'Hester Quill, the archivist', plumber: 'Marta Kowalski, plumber', keeper: 'Tobias Vane, clock keeper', janitor: 'Earl, with the floor polisher', sec: 'Priscilla, the mayor\'s secretary' };
export const FEES = { id: 5, dog: 12, bike: 8, busk: 15, stall: 25, marriage: 60, print: 0 };
export const TUNE = { QUEUE_MIN: 5, WATCH_MIN: 20, SPEAK_MIN: 6, FORM_MIN: 3, PHOTO_MIN: 2, REEL_MIN: 12, WIND_MIN: 6, BUSK_MIN: 30, STALL_MIN: 60, DISPUTE_DAYS: 7, FUND: 340, REWARD: 150, WALKOUT: 20 };

const DAY = 1440;
export const isHoliday = day => day >= 0 && EVENTS.some(e => e.kind === 'holiday' && e.hours && e.hours[0] === 0 && e.when && e.when.days && eventOnDay(e, day));
export const COUNCIL = { days: [1, 3], hours: [18.5, 20.5], item: 28 };
export const WEDDING = { weekday: 5, slots: [11, 13, 15], len: 40 };
export const TOUR = { days: [6], hours: [11, 12.5] };
/** opening hours of the building on the day of `n` */
export function hallHours(n) { if (n.weekday === 6 || isHoliday(n.day)) return null; if (n.weekday === 5) return [10, 16]; return [8.5, COUNCIL.days.includes(n.weekday) ? 21 : 17]; }
export const hallOpen = n => { const h = hallHours(n); return !!h && n.hf >= h[0] && n.hf < h[1]; };
export const recordsOpen = n => n.weekday < 5 && !isHoliday(n.day) && n.hf >= 9 && n.hf < 16.5;
export const archiveOpen = n => !isHoliday(n.day) && (n.weekday < 5 ? n.hf >= 10 && n.hf < 16 : n.weekday === 5 && n.hf >= 10 && n.hf < 14);
export const towerOpen = n => hallOpen(n) && (n.weekday === 5 || (n.hf >= 12 && n.hf < 14) || tourOn(n));
export const councilOn = n => COUNCIL.days.includes(n.weekday) && !isHoliday(n.day) && n.hf >= COUNCIL.hours[0] && n.hf < COUNCIL.hours[1];
export function councilNext(n) { for (let d = n.day; d < n.day + 8; d++) { const wd = ((d % 7) + 7) % 7; if (COUNCIL.days.includes(wd) && !isHoliday(d) && (d > n.day || n.hf < COUNCIL.hours[1])) return { day: d, weekday: wd, from: COUNCIL.hours[0], to: COUNCIL.hours[1] }; } return null; }
export function weddingAt(n) { if (n.weekday !== WEDDING.weekday || isHoliday(n.day)) return null; for (let i = 0; i < WEDDING.slots.length; i++) { const s = WEDDING.slots[i], m = (n.hf - s) * 60; if (m >= -10 && m < WEDDING.len) return { slot: i, hour: s, m }; } return null; }
export const tourOn = n => TOUR.days.includes(n.dayOfMonth) && n.hf >= TOUR.hours[0] && n.hf < TOUR.hours[1];

export const COUNCILLORS = [
  { name: 'Cllr. Imogen Achebe', ward: 'Downtown', quip: ['Downtown has waited long enough. Downtown always waits.', 'I move we stop moving things to committee.'] },
  { name: 'Cllr. Bart Nilsson', ward: 'The Harbor', quip: ['What does it cost, and who is holding the invoice?', 'In the harbor we fix a thing with rope the same afternoon.'] },
  { name: 'Cllr. Priyanka Rao', ward: 'Old Town', quip: ['My ward has opinions. I have brought all four hundred of them.', 'Seconded. Enthusiastically.'] },
  { name: 'Cllr. Ferris Haldane', ward: 'Hillcrest', quip: ['Hillcrest would like it noted that Hillcrest was not consulted.', 'Could we have that in writing, with a diagram?'] },
  { name: 'Cllr. Lucia Marchetti', ward: 'Maplewood', quip: ['The children of Maplewood asked me to say: yes. Loudly.', 'I brought biscuits. That is not a bribe, it is a tradition.'] },
  { name: 'Cllr. Theo Brandt', ward: 'Railyard', quip: ['If the 14 bus were here it would have missed this vote too.', 'I vote with whoever lets us go home before nine.'] },
  { name: 'Cllr. Soo-ah Kim', ward: 'Arts District', quip: ['Could it be more beautiful? Then I am for it.', 'I propose a mural of this exact debate.'] },
];
// agenda items: t = board text (max 26), ask = what the clerk reads, say = public comment lines, lean = 0..1 how well it usually does, tabled = always sent back
export const MOTIONS = [
  { id: 'bus14', t: 'ROUTE 14: BE ON TIME', ask: 'A motion asking the 14 bus to arrive when the timetable says it will.', say: ['I have aged at that stop. I have a favourite paving stone.', 'The timetable is a lovely piece of fiction. Fund the sequel.'], lean: .7 },
  { id: 'mural', t: 'MURAL FOR THE SHED 5 WALL', ask: 'A motion to commission a mural for the long wall of Shed 5.', say: ['Forty metres of grey. Give us a whale. Give us ANYTHING.', 'My nephew paints. He is twelve. He is cheaper than a whale.'], lean: .65 },
  { id: 'pigeons', t: 'PIGEON CENSUS FUNDING', ask: 'A motion to count the pigeons of City Hall Plaza, by name where possible.', say: ['There are forty-one. I know because I feed forty-one.', 'One of them is called Gerald and he should be counted twice.'], lean: .45 },
  { id: 'benches', t: 'MORE BENCHES, RIVER WALK', ask: 'A motion for six new benches along the River Walk.', say: ['My knees have asked me to speak on their behalf.', 'A city is as kind as its benches. I read that. On a bench.'], lean: .8 },
  { id: 'wheel', t: 'BAY WHEEL: WHY IT STOPS', ask: 'A motion to ask the Bay Wheel why it always stops at the top.', say: ['I proposed up there. Not by choice. We were there forty minutes.', 'It is the view. The wheel likes the view. Leave it alone.'], lean: .5 },
  { id: 'cat', t: 'LIGHTHOUSE CAT: OFFICIAL', ask: 'A motion to make the lighthouse keeper\'s cat an official employee of the city.', say: ['She has caught more than the harbour patrol.', 'Give her a hat. A small one. That is my whole speech.'], lean: .85 },
  { id: 'accordion', t: 'ACCORDION: QUIET HOURS', ask: 'A motion setting quiet hours for accordions on Lantern Row.', say: ['I love the accordion. Until eleven at night. Then I love silence.', 'He only knows one song. Fund a second song.'], lean: .4 },
  { id: 'crosswalk', t: 'CROSSWALK ON MARKET ST', ask: 'A motion for a new crosswalk on Market Street by the bakery.', say: ['People cross there anyway. They cross with croissants. It is chaos.', 'Paint is cheap. Ankles are not.'], lean: .75 },
  { id: 'library', t: 'LIBRARY FINES AMNESTY', ask: 'A motion forgiving all library fines older than ten years.', say: ['I have had "Birds of the Bay" since 1994. I would like to come home.', 'The book was good. I am sorry. That is all.'], lean: .7 },
  { id: 'sign', t: 'TOWN HALL SIGN: RENAME?', ask: 'A motion, first tabled in 1987, to change the words TOWN HALL over the door to CITY HALL.', say: ['We became a city in 1961. The sign has not been told.', 'Leave it. My grandmother carved the W.'], lean: .5, tabled: true },
  { id: 'dogpark', t: 'DOG PARK: SMALL DOG HOUR', ask: 'A motion for a small-dog hour at the dog park.', say: ['Biscuit weighs four pounds and has been sat on twice.', 'The big dogs are gentle. The big dogs are also enormous.'], lean: .6 },
  { id: 'clock', t: 'OLD TOWN CLOCK: 4 MIN FAST', ask: 'A motion to correct the Old Town clock, which is four minutes fast.', say: ['Nobody in Old Town has been late since 1970. Do NOT fix it.', 'I set my watch by it and then I subtract. It is a system.'], lean: .3 },
];
export const FOUNTAIN_MOTION = { id: 'fountain', t: 'FOUNTAIN: FUND THE REPAIR', ask: 'A motion to release $340 from the Small Works fund for work order 62-F: one plumber, one afternoon, the plaza fountain.', say: ['It has been "soon" since my daughter was in a pram. She drives now.', 'I threw a coin in for luck in 2019. It is still lying there, dry.'], lean: .42, fountain: true };
export const FOUNTAIN_STUDY = { id: 'study', t: 'FOUNTAIN: STUDY THE STUDY', ask: 'A motion to commission a review of the 2011 study into the 2004 report on the plaza fountain.', say: ['Could the study come with a bucket of water? As a show of faith?', 'Soon. You always say soon. Soon is not a date.'], lean: .9 };
export const FOUNTAIN_THANKS = { id: 'thanks', t: 'FOUNTAIN: VOTE OF THANKS', ask: 'A motion of thanks to everyone who got the plaza fountain running, and to the plumber.', say: ['My kids have been soaked every day this week. Thank you. I think.', 'I threw in a new coin. For luck. It seems to be working.'], lean: 1 };
const h32 = (a, b = 0) => { let h = (a * 374761393 + b * 668265263 + 1013904223) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
/** the four agenda items of the meeting on `day` (fixed = the fountain has been restored) */
export function agenda(day, fixed) { const out = [fixed ? FOUNTAIN_THANKS : FOUNTAIN_STUDY], used = new Set(); for (let i = 0; out.length < 4 && i < 40; i++) { const k = Math.floor(h32(day, i + 3) * MOTIONS.length); if (!used.has(k)) { used.add(k); out.push(MOTIONS[k]); } } const k = Math.floor(h32(day, 99) * 4); const f = out.splice(0, 1)[0]; out.splice(k, 0, f); return out; }
/** deterministic roll-call for a motion: boost adds ayes (the player spoke for it) */
export function tally(m, day, boost = 0) { const v = []; let a = 0; for (let i = 0; i < 7; i++) { const yes = !m.tabled && h32(day * 13 + i, m.id.length * 31 + m.id.charCodeAt(0)) < m.lean; v.push(yes ? 'A' : 'N'); if (yes) a++; } for (let i = 0; i < 7 && boost > 0; i++) if (v[i] === 'N') { v[i] = 'A'; a++; boost--; } return { a, n: 7 - a, v: v.join(''), carried: !m.tabled && a >= 4 }; }

export const COUPLES = [['Rosa', 'Emeka', 'They met on the 14 bus. It was late. They were not sorry.'], ['Hana', 'Jules', 'Twelve years, two cats and one very long engagement.'], ['Walt', 'Odette', 'He proposed at the top of the Bay Wheel. It stopped. He had forty minutes to hear the answer.'],
  ['Mina', 'Tomas', 'She runs the bakery queue; he was in it every morning for a year.'], ['Arjun', 'Beatrice', 'Rival accordion players of Lantern Row. Peace at last.'], ['Gwen', 'Sal', 'Second time around for both. This time with better shoes.']];
export const BALLOTS = [
  { id: 'bunting', q: 'What colour should the bunting on the City Hall steps be?', opts: [{ id: 'red', name: 'Maple red', c: '#c8402e' }, { id: 'teal', name: 'Harbour teal', c: '#2f8a8a' }, { id: 'gold', name: 'Sunflower gold', c: '#e8b63a' }] },
  { id: 'flowers', q: 'What should grow in the rotunda planters?', opts: [{ id: 'tulips', name: 'Tulips' }, { id: 'sunflowers', name: 'Sunflowers' }, { id: 'fern', name: 'Just the ferns, thank you' }] },
  { id: 'statue', q: 'The empty plinth in the rotunda has been "reserved" since 1934. What goes on it?', opts: [{ id: 'pigeon', name: 'A heroic bronze pigeon' }, { id: 'cat', name: 'The lighthouse keeper\'s cat' }, { id: 'leaf', name: 'A golden maple leaf' }] },
];
export const ballotOf = week => BALLOTS[((week % BALLOTS.length) + BALLOTS.length) % BALLOTS.length];
export const WINDOWS = [
  { n: 1, id: 'cashier', short: 'CASHIER', name: 'PAY BILLS', who: 'Cashier' }, { n: 2, id: 'id', short: 'ID CARDS', name: 'ID + TAGS', who: 'Licensing clerk' }, { n: 3, id: 'permits', short: 'PERMITS', name: 'BUSK+STALL', who: 'Permits clerk' },
  { n: 4, id: 'records', short: 'RECORDS', name: 'PROPERTY', who: 'Records clerk' }, { n: 5, id: 'lost', short: 'FOUND', name: 'LOST+FOUND', who: 'Lost property clerk' },
];
export const MODEL_D = [['hillcrest', 'Hillcrest', 'Big houses, long drives, and the radio mast that blinks all night.'], ['arts', 'The Arts District', 'The Orpheum, the museum, the arena. More posters than wall.'], ['airport', 'Maple Bay International', 'One runway, one very proud control tower.'],
  ['park', 'Riverside Park', 'The pond, the bandstand, and forty-one pigeons on loan from the plaza.'], ['downtown', 'Downtown', 'Glass towers, the Grand Maple, and you: the little brass pin is this building.'], ['maplewood', 'Maplewood', 'Front porches and a maple on every lawn. The city is named for this street.'],
  ['oldtown', 'Old Town', 'Terracotta roofs around a clock that is four minutes fast.'], ['harbor', 'The Harbor', 'Cranes called Faith, Hope and Gerald, and the lighthouse on the point.'], ['railyard', 'The Railyard', 'Ironside Foundry, Shed 5, and trains that rattle the cups at ten past.']];
export const MAYOR_PLAQUES = [
  ['Ezekiel Maple, 1887 to 1911', 'Founder. Insisted the city was named after the tree and not after him. Nobody believed him then either.'],
  ['Cornelius Voss, 1911 to 1934', 'Built the tram, the pier and this rotunda. Reserved the plinth "for a statue of someone deserving". Died before choosing.'],
  ['Agnes Whitcombe, 1934 to 1962', 'First to be elected by people who had actually met her. Kept bees on the roof. The honey was terrible.'],
  ['Leopold Okafor, 1962 to 1987', 'Opened the plaza fountain by turning a brass key in June 1962. Kept the key in his desk. Lost the desk.'],
  ['Dolores "Dee" Haldane, 1987 to 2009', 'Tabled the motion to rename the building. It is still on the table. So, some say, is her lunch.'],
  ['Winifred Castellanos, the present mayor', 'Elected on one promise: "The fountain. Soon." Painted smiling. The painter was asked to make it look like a plan.'],
];
// the microfilm reel of The Bay Courier: one front page per frame
export const REEL = [
  { y: 1887, d: '4 July 1887', h: 'TOWN OF MAPLE BAY INCORPORATED', t: 'Ninety-one votes to six. The six are understood to prefer the name "Port Gerald". A hall is to be built when a hall can be afforded.' },
  { y: 1903, d: '12 May 1903', h: 'LIGHTHOUSE LIT; SHIPS NOW MISS THE ROCKS ON PURPOSE', t: 'The lamp on the point was lit at dusk by the keeper, Mr. Quill, and his cat. The cat is not on the payroll. Yet.' },
  { y: 1911, d: '2 October 1911', h: 'NEW TOWN HALL OPENS: DOME "LARGER THAN NECESSARY"', t: 'Mayor Voss cut the ribbon under a painted dome showing the founding, the harbour, the first tram and, for reasons of budget, a great deal of sky.' },
  { y: 1924, d: '9 March 1924', h: 'ELECTRIC TRAM REACHES OLD TOWN', t: 'The Loop is complete. The first tram arrived four minutes early; the Old Town clock was at once set to match and has never been corrected.' },
  { y: 1934, d: '30 August 1934', h: 'PLINTH RESERVED: "STATUE TO FOLLOW"', t: 'The marble plinth in the rotunda has been reserved by order of council for "a person or creature deserving of the honour". Suggestions are invited.' },
  { y: 1947, d: '17 June 1947', h: 'BAY WHEEL TURNS; STOPS; TURNS AGAIN', t: 'The new observation wheel on the boardwalk carried four hundred riders on its first day and paused at the top eleven times. The engineer calls this "a feature".' },
  { y: 1961, d: '1 January 1961', h: 'MAPLE BAY IS A CITY! (SIGN TO BE CHANGED "SHORTLY")', t: 'By charter we are a city as of midnight. The words TOWN HALL over the door will be amended as soon as a stonemason can be found who is not on holiday.' },
  { y: 1962, d: '16 June 1962', h: 'PLAZA FOUNTAIN OPENS: MAYOR TURNS BRASS KEY', t: 'Before a crowd of two thousand, Mayor Okafor turned valve V-7 with a square brass key and the fountain rose twenty feet. Plans and work orders are filed in the hall basement, drawer 62-F. "It will run for a hundred years," said the mayor.', key: true },
  { y: 1974, d: '3 November 1974', h: 'ROUTE 14 BUS BEGINS SERVICE; RUNS LATE ON DAY ONE', t: 'The new cross-town service departed Central Station eleven minutes behind its first timetable. A spokesman promises this is "teething".' },
  { y: 1987, d: '22 April 1987', h: 'FOUNTAIN SWITCHED OFF "FOR THE WEEKEND"', t: 'The plaza fountain was shut down on Friday for cleaning. The valve key was signed out to a contractor and is expected back on Monday.', key: true },
  { y: 1998, d: '5 February 1998', h: 'HALL BASEMENT FLOODS; RECORDS "MOSTLY DRY"', t: 'A burst pipe (not the fountain, which has no water in it) soaked the lower archive. Loose items were boxed and sent up to Lost and Found until claimed.', key: true },
  { y: 2011, d: '14 September 2011', h: 'COUNCIL COMMISSIONS STUDY OF 2004 FOUNTAIN REPORT', t: 'By six votes to one, council has agreed to study the report. Asked when the fountain itself might run, the chair said: "Soon."' },
  { y: 2019, d: '8 August 2019', h: 'FOUNTAIN WRAPPED IN TARPAULIN "TEMPORARILY"', t: 'A blue tarpaulin and a board reading FIXED SOON have appeared on the plaza. The pigeons have adapted. The citizens have not.' },
];
export const MAPS = [
  { id: 'survey', name: 'Survey of Maple Bay, 1887', t: 'Ink on linen. Forty-one lots, one dock, a track marked "to the maples" and, where downtown is now, the single word: MUD.' },
  { id: 'tram', name: 'Tram map, 1924', t: 'The Loop in red: Central, Old Town, Boardwalk, Hillcrest. A pencil note in the margin: "clock 4 min fast, do NOT tell the public".' },
  { id: 'plaza', name: 'City Plaza plan, 1962', t: 'The plaza as it was meant to be: fountain, four planters, benches. Drawer reference 62-F is stamped in the corner.' },
];
export const NOTICES = ['COUNCIL MEETS Tuesday and Thursday, 18:30, in the Chamber. The public is welcome and may speak. Please do.', 'PLAZA FOUNTAIN: repairs will begin soon. (This notice was posted in 2019. A second notice thanks you for your patience with the first.)',
  'CIVIL WEDDINGS every Saturday at 11, 1 and 3 in the Wedding Room, second floor. Confetti is permitted. Rice upsets the pigeons.', 'LOST: one brass valve key, square, about so big. Missing since 1987. Sentimental and hydraulic value.',
  'CLOCK TOWER open lunchtimes 12 to 2 and all day Saturday. 112 steps. The view is free; the breath you will have to find yourself.', 'PUBLIC TOUR of City Hall on the first Saturday of every season, 11:00, meet at the seal.', 'RESIDENT CARDS at window 2. Bring your face.'];

const ARCH = ['H. P. Lathrop', 'the Voss Brothers', 'Agnes Whitcombe (before politics)', 'nobody; it "just went up"', 'Okafor & Daughter', 'a correspondence course'];
const OWNERS = ['a retired tram conductor', 'two sisters who did not speak to each other', 'a pianist and eleven canaries', 'the Maple Bay Kite Society', 'a sea captain, mostly absent', 'a dentist (three of them, in sequence)', 'a baker who paid the rent in bread', 'the lighthouse keeper\'s nephew', 'a magician; the deed vanished twice', 'a family of nine and one very patient dog'];
const ODD = ['A cat named Admiral is listed as co-owner from 1974 to 1981.', 'The cellar door is recorded as "sealed, do not ask" (1952).', 'Permit granted in 1966 for "one (1) rooftop beehive".', 'A 1938 complaint about accordion practice was withdrawn "after cake".', 'The boundary was moved eleven inches in 1949 to save a maple.', 'Noted in pencil: "roof leaks only when it rains".'];
/** the public record of a home (deterministic from its id) */
export function homeHistory(home) { const id = String(home.id || home), k = [...id].reduce((a, c) => a * 31 + c.charCodeAt(0) | 0, 7), r = i => h32(k, i); return { built: 1889 + Math.floor(r(1) * 100), architect: ARCH[Math.floor(r(2) * ARCH.length)], owners: [0, 1, 2].map(i => OWNERS[Math.floor(r(3 + i) * OWNERS.length)]).filter((v, i, a) => a.indexOf(v) === i), oddity: ODD[Math.floor(r(9) * ODD.length)] }; }

/* ---------- venues ---------- */
const hrs = f => [0, 1, 2, 3, 4, 5, 6].map(f);
const venue = (id, name, type, offers, hours, blurb) => (VENUE_BY_ID[id] = VENUE_BY_ID[id] || { id, name, type, district: 'downtown', where: 'City Hall Plaza, downtown, under the clock tower', station: null, interior: true, hours, offers, priceMult: 1, jobId: null, delivers: false, blurb, showpiece: true });
venue(CV.place, NAME, 'leisure', { functions: ['seat'] }, hrs(wd => (wd === 6 ? null : wd === 5 ? [10, 16] : [8.5, COUNCIL.days.includes(wd) ? 21 : 17])), 'The marble rotunda under the clock tower: the council chamber, permits and records, the clerk and the wedding room, the mayor, the archive in the basement.');
venue(CV.shop, 'The Civic Shop', 'shop', { shop: ['gift', 'misc', 'homegood'], functions: ['till'] }, hrs(wd => (wd === 6 ? null : wd === 5 ? [10, 16] : [8.5, 17])), 'Souvenir seals, the city flag, a toy gavel and a mug for people who love forms.');
venue(CV.archive, 'City Archive Print Desk', 'shop', { shop: ['homegood'], functions: ['till'] }, hrs(wd => (wd === 6 ? null : wd === 5 ? [10, 14] : [10, 16])), 'Framed prints from the city archive: the 1887 survey, the plaza in 1962, a front page of The Bay Courier.');

/* ---------- moodlets ---------- */
const mood = (id, o) => { if (!MOODLETS[id]) MOODLETS[id] = Object.assign({ workPerf: 1, walkSpeed: 1, source: 'activity' }, o); };
mood('ch_civic', { name: 'Civic Pride', desc: 'You sat through a council meeting and understood most of it.', mood: 5, minutes: 300 });
mood('ch_heard', { name: 'Heard at the Podium', desc: 'You stood up, said your piece, and seven councillors wrote it down.', mood: 8, workPerf: 2, minutes: 360 });
mood('ch_confetti', { name: 'Confetti in Your Hair', desc: 'Two strangers got married and you cried a little. It is the flowers.', mood: 6, minutes: 240 });
mood('ch_paperwork', { name: 'Paperwork Done', desc: 'Stamped, signed, filed. Nobody can touch you now.', mood: 4, minutes: 180 });
mood('ch_tower', { name: 'Top of the Clock Tower', desc: 'A hundred and twelve steps and the whole city under your feet.', mood: 6, minutes: 240 });
mood('ch_hero', { name: 'The One Who Fixed the Fountain', desc: 'It runs. After all those years of "soon", it runs, and the plaque has your name on it.', mood: 12, workPerf: 3, minutes: 2880 });

/* ---------- items ---------- */
const SH = [CV.shop], AR = [CV.archive];
const gift = (id, name, price, icon, relationship, giftTags) => ({ id, name, category: 'gift', price, icon, effects: {}, stack: 3, soldAt: SH, relationship, giftTags });
const misc = (id, name, price, icon, note, soldAt) => ({ id, name, category: 'misc', price, icon, effects: {}, stack: 1, soldAt: soldAt || [], note });
const print = (id, name, price, icon, soldAt) => ({ id, name, category: 'homegood', price, icon, effects: {}, stack: 1, soldAt: soldAt || AR, tag: 'decor', tier: 1, footprint: [2, 1], placement: 'wall', bonus: { mult: 1.1, ambience: 2 } });
const NEW = [
  misc('ch_resident_id', 'Maple Bay Resident Card', 0, 'green card, small photo, gold seal', 'Your face, your name, a number and a hologram of a maple leaf. Window 5 will not give a lost key to just anybody.'),
  misc('ch_dog_licence', 'Dog Licence Tag', 0, 'brass tag, bone shape, number', 'A brass tag numbered 0412, for the dog you have or the dog you intend. The clerk did not ask which.'),
  misc('ch_bike_licence', 'Bicycle Licence Plate', 0, 'small green plate, white number', 'A tiny enamel plate. Entirely voluntary since 1958. People still like them.'),
  misc('ch_busk_permit', 'Busking Permit', 0, 'cream paper, treble clef, red stamp', 'Entitles the bearer to make music on City Hall Plaza and keep what lands in the hat.'),
  misc('ch_stall_permit', 'Market Stall Permit', 0, 'cream paper, striped awning, red stamp', 'Entitles the bearer to one folding table on City Hall Plaza at weekends.'),
  misc('ch_confetti', 'Cone of Confetti', 2, 'paper cone, coloured dots', 'Paper, biodegradable, pigeon-approved. For weddings in the Wedding Room.', SH),
  misc('ch_workorder', 'Work Order 62-F', 0, 'yellowed form, clip, blue stamp', '"FOUNTAIN, PLAZA. Reopen valve V-7 (square key). Est. one afternoon." Dated 1987. Never countersigned.'),
  misc('ch_valve_key', 'Brass Valve Key V-7', 0, 'square brass key, paper tag', 'Heavy, square, green at the edges. The tag says: "V-7. DO NOT LOSE." in three different handwritings.'),
  misc('ch_city_key', 'Key to the City', 0, 'big gold key, green ribbon', 'It opens nothing. It was given to you on the plaza in front of everybody, which is the point.'),
  gift('ch_seal_pin', 'City Seal Lapel Pin', 6, 'round enamel pin, red maple leaf', 4, ['nerdy', 'fancy']),
  gift('ch_paperweight', 'Souvenir City Seal', 18, 'brass disc, maple leaf, on a base', 6, ['fancy', 'nerdy']),
  gift('ch_mug', '"I Brake for Bylaws" Mug', 9, 'white mug, green text, gavel', 5, ['nerdy', 'cozy']),
  gift('ch_gavel', 'Toy Gavel', 16, 'small wooden gavel and block', 6, ['nerdy', 'cute']),
  gift('ch_postcards', 'City Hall Postcards', 4, 'postcards, clock tower, blue sky', 3, ['cute', 'arty']),
  gift('ch_pigeon', 'Plaza Pigeon Plush', 14, 'grey plush pigeon, tiny sash', 7, ['cute']),
  print('ch_flag', 'Flag of Maple Bay (framed)', 22, 'green flag, red leaf on white disc', SH),
  print('ch_print_map', 'Print: Survey of 1887', 20, 'framed old map, grid, blue bay'),
  print('ch_print_plaza', 'Print: The Plaza, June 1962', 22, 'framed sepia photo, fountain, crowd'),
  print('ch_print_courier', 'Print: The Bay Courier Front Page', 18, 'framed newspaper, black headline'),
  print('ch_print_blueprint', 'Print: Fountain Blueprint 62-F', 24, 'framed blueprint, white lines on blue', []),
];
export const NEW_ITEM_IDS = NEW.map(i => i.id);
const LISTS = { gift: GIFTS, misc: MISC, homegood: HOMEGOODS };
for (const it of NEW) { if (ITEM_BY_ID[it.id]) continue; ITEMS.push(it); ITEM_BY_ID[it.id] = it; if (Array.isArray(LISTS[it.category])) LISTS[it.category].push(it); }
export const CH_VIS = { ch_flag: { a: 'wall.ch_print', p: { k: 'flag' } }, ch_print_map: { a: 'wall.ch_print', p: { k: 'map' } }, ch_print_plaza: { a: 'wall.ch_print', p: { k: 'plaza' } }, ch_print_courier: { a: 'wall.ch_print', p: { k: 'courier' } }, ch_print_blueprint: { a: 'wall.ch_print', p: { k: 'blueprint' } } };

/* ---------- calendar ---------- */
if (!EVENTS.some(e => e.id === 'ch_council_tue')) EVENTS.push(
  ...[['tue', 1], ['thu', 3]].map(([k, wd]) => ({ id: 'ch_council_' + k, name: 'City Council Meeting', kind: 'weekly', when: { weekday: wd }, hours: COUNCIL.hours, place: { venue: CV.place }, blurb: 'Tuesdays and Thursdays at half past six in the Council Chamber of City Hall. Four motions, a live vote board, and a podium anybody may use. Sign up at the clerk\'s table. Protesters on the steps from four.', special: { crowdMult: 1.3 }, notify: 2 })),
  { id: 'ch_weddings', name: 'Civil Weddings at City Hall', kind: 'weekly', when: { weekday: WEDDING.weekday }, hours: [WEDDING.slots[0], WEDDING.slots[WEDDING.slots.length - 1] + 1], place: { venue: CV.place }, blurb: 'Every Saturday at 11, 1 and 3 somebody gets married in the Wedding Room on the second floor of City Hall. Guests are welcome; so is confetti.', special: { crowdMult: 1.2 }, notify: 2 },
  { id: 'ch_tour', name: 'Public Tour of City Hall', kind: 'seasonal', when: { season: 'any', days: TOUR.days }, hours: TOUR.hours, place: { venue: CV.place }, blurb: 'The first Saturday of every season at eleven: the rotunda, the chamber, the archive and the 112 steps of the clock tower, with the archivist. Free. Meet at the seal.', special: {}, notify: 3 });
