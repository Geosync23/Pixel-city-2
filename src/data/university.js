// university.js — design data for Maple Bay University (rooms 'university', 'university:lecture', 'university:commons', 'university:library', 'university:workshop').
// Registered additively at import time (same pattern as observatory.js): VENUE_BY_ID gets 'university' (the place) and 'university:cafe' (The Quill & Kettle);
// ITEMS / ITEM_BY_ID get the `uni_*` items; MOODLETS gets 'uni_learned', 'uni_proud', 'uni_graduate', 'uni_revised'; calendar EVENTS gets the campus events.
//   UR room ids   UV venue ids   HOURS(weekday) -> [open, close]   TUNE   COURSES / COURSE_BY_ID   UNITS   SLOTS helpers   CLUBS   CERT_ITEM(courseId)
// Text content (lectures, readings, exam questions, cast and their lines) lives in src/story/university.js.
import './venues_extra.js';
import { VENUE_BY_ID } from './venues.js';
import { ITEMS, ITEM_BY_ID, DISHES, GIFTS, MISC } from './items.js';
import { MOODLETS } from './needs.js';
import { EVENTS } from './calendar.js';

export const NAME = 'Maple Bay University';
export const UR = { hall: 'university', lecture: 'university:lecture', commons: 'university:commons', library: 'university:library', workshop: 'university:workshop' };
export const UV = { place: 'university', cafe: 'university:cafe' };
/** building hours by weekday (0 = Mon). Sunday: the Commons and the Reading Room only, no classes and no office */
export const HOURS = wd => (wd === 6 ? [10, 18] : [8, 21.5]);
export const OFFICE = wd => (wd === 6 ? null : wd === 5 ? [9, 14] : [8.5, 17.5]);      /* the Registrar's window */
export const TUNE = {
  card: 10,            /* one-off student card */
  tuition: 80,         /* per course */
  bursaryUnder: 300,   /* a bank balance under this halves the tuition (the Ashby Bursary) */
  maxCourses: 2,       /* at once */
  classMin: 50,        /* game minutes a class takes */
  doors: 20,           /* you can take your seat this many minutes before */
  late: 20,            /* ... and this many after the start (after that the door is shut: missed) */
  readMin: 30, projectMin: 45, practiceXp: 30,   /* coursework */
  pass: 50, merit: 70, distinction: 85,
  resit: 15,           /* fee from the second resit on */
  weights: { part: 20, practical: 20, work: 20, final: 40 },
  xp: { lecture: 45, practical: 60, final: 70, reading: 20, project: 40, group: 15, open: 12, club: 25 },
  certXp: 1.1,         /* certified skill: xp multiplier, for good */
  certPay: 0.1,        /* a shift in a job that trains a certified skill pays this much extra */
  workStudy: 12,       /* tuition credit per shelving session in the Reading Room */
  groupBonus: 6,       /* marks added to the final after a study-group session (once per course) */
  examWeek: [12, 13, 14],   /* days of the 14-day season: exam sittings daily at 10:00 and 14:00 */
};
const D = { mt: [0, 3], tf: [1, 4], ws: [2, 5] };
/** COURSES. skill = what it teaches (xp + the certificate's skill), also = a little xp on the side. sections: [days, hour]. station = where the practical happens (room 'workshop', or 'pond').
 *  game = mini-game kit definition of the practical / the presentation. final: 'exam' (written paper in the lecture theatre) | 'present' (you perform: the kit game in front of the class). */
export const COURSES = [
  { id: 'cook', code: 'CUL 101', name: 'Kitchen Science', skill: 'cooking', also: null, prof: 'baptiste', color: '#c8683f', station: 'kitchen', sections: [[D.mt, 10], [D.mt, 18.5]], final: 'exam',
    blurb: 'Why onions go sweet, why bread rises and why your sauce split. Two lectures, one evening at the stoves, one paper.', perk: 'Three new recipes, and kitchens take you more seriously.', recipes: ['goulash', 'gumbo', 'pho'],
    game: { kind: 'timing', icon: 'skill.cooking', title: 'Sear, then rest', hint: 'Stop the marker in the green: pan hot, pan off, plate. Five moves.', o: { rounds: 5, zone: .26 }, verdicts: ['Smoke alarm', 'Edible', 'Properly cooked', 'Chef, yes chef!'] } },
  { id: 'art', code: 'ART 110', name: 'Drawing & Colour', skill: 'painting', also: 'creativity', prof: 'vandermeer', color: '#d94f7a', station: 'easel', sections: [[D.tf, 10], [D.tf, 18.5]], final: 'present',
    blurb: 'Seeing before drawing: line, shadow, and why blue goes back and orange comes forward. Bring nothing. Leave with a picture.', perk: 'A trained eye: paintings come out better and sell for it.',
    game: { kind: 'trace', icon: 'skill.painting', title: 'The still life', hint: 'Follow the dotted line from the ring. Slow hands, long strokes.', theme: { paper: '#fffdf4' }, verdicts: ['A brave start', 'Recognisably fruit', 'A good likeness', 'Frame it!'] } },
  { id: 'write', code: 'LIT 120', name: 'Creative Writing', skill: 'writing', also: 'creativity', prof: 'lowell', color: '#5a4a8a', station: 'desk', sections: [[D.ws, 10], [D.ws, 18.5]], final: 'present',
    blurb: 'How a story is built, and how to cut the bit you love most. You finish by reading a page of your own out loud.', perk: 'Stories come faster, and the Gazette pays attention.',
    game: { kind: 'quickdraw', icon: 'skill.writing', title: 'First draft', hint: 'Catch the bright ideas. Leave the grey clichés alone.', theme: { icon: 'sk.idea', bad: 'sk.cliche', paper: '#fffdf4' }, verdicts: ['A blank page', 'A rough draft', 'Good pages', 'Read it again!'] } },
  { id: 'code', code: 'CSC 101', name: 'Computing for Humans', skill: 'tech', also: 'logic', prof: 'varma', color: '#3b82d6', station: 'pc', sections: [[D.mt, 14], [D.tf, 16.5]], final: 'exam',
    blurb: 'What a program actually is, from a recipe card to a loop. No maths past counting. One small thing built by you.', perk: 'Offices and desks open up: counts toward Logic at work.', jobSkill: 'logic',
    game: { kind: 'memory', icon: 'skill.tech', title: 'Make the tests pass', hint: 'The run lights up the steps. Repeat them in order.', verdicts: ['Still red', 'Half green', 'All green', 'Ships first try!'] } },
  { id: 'music', code: 'MUS 105', name: 'Music Fundamentals', skill: 'music', also: null, prof: 'ekstrom', color: '#2f9a94', station: 'piano', sections: [[D.tf, 14], [D.ws, 16.5]], final: 'present',
    blurb: 'Pulse, pitch and why four chords carry half the songs you know. Ends with a very small recital.', perk: 'Steadier hands and a better hat when you busk.',
    game: { kind: 'rhythm', icon: 'skill.music', title: 'Four chords', hint: 'Hit each note as it crosses the line.', o: { lanes: 3, notes: 16, bpm: 92 }, verdicts: ['Wrong keys', 'Found the pulse', 'In time', 'Encore!'] } },
  { id: 'speak', code: 'RHE 130', name: 'Public Speaking', skill: 'charisma', also: 'comedy', prof: 'santangelo', color: '#e8843a', station: 'podium', sections: [[D.ws, 14], [D.mt, 16.5]], final: 'present',
    blurb: 'Breathe, pause, look up. How to say one thing clearly to forty people, and survive.', perk: 'People listen: counts toward Charisma at work.',
    game: { kind: 'timing', icon: 'skill.charisma', title: 'Land the line', hint: 'Pause... then tap in the green to land each line. Five lines.', o: { rounds: 5, style: 'ring', zone: .3 }, verdicts: ['You read the floor', 'A bit fast', 'Clear and warm', 'They stood up!'] } },
  { id: 'eco', code: 'BIO 140', name: 'Bay Ecology', skill: 'gardening', also: 'logic', prof: 'adeyemi', color: '#4fa860', station: 'pond', sections: [[D.tf, 11.5], [D.ws, 11.5]], final: 'exam',
    blurb: 'Who eats whom in Maple Bay, from the pond behind the quad to the kelp off Gull Point. One class is held with a net.', perk: 'Green fingers: beds grow faster and you know what you are looking at.',
    game: { kind: 'sort', icon: 'skill.gardening', title: 'Pond dipping', hint: 'What came up in the net? Tap where each one belongs.', theme: { icon: 'skill.gardening', color: '#4fa860' },
      o: { bins: ['Plant', 'Insect', 'Not from here'], items: [['Duckweed', 0], ['Water boatman', 1], ['Reed stem', 0], ['Dragonfly nymph', 1], ['Bottle cap', 2], ['Pond skater', 1], ['Hornwort', 0], ['Crisp packet', 2], ['Mayfly nymph', 1], ['Water lily leaf', 0], ['Goldfish (somebody\'s pet)', 2], ['Whirligig beetle', 1]] }, verdicts: ['Mostly mud', 'Some of it right', 'A tidy tray', 'Field notes worth keeping!'] } },
  { id: 'fix', code: 'ENG 150', name: 'Home Repair', skill: 'handiness', also: null, prof: 'kowal', color: '#7a8a9a', station: 'bench', sections: [[D.mt, 11.5], [D.tf, 16.5]], final: 'exam',
    blurb: 'Taps, fuses, hinges and the difference between a screw and a mistake. You will leave able to fix the thing that drips.', perk: 'Repairs go faster: counts toward Handiness at work.',
    game: { kind: 'balance', icon: 'skill.handiness', title: 'Seat the washer', hint: 'Hold to tighten, let go to ease off. Keep it in the green until it seals.', verdicts: ['It still drips', 'Hand tight', 'Sealed', 'Not a drop!'] } },
];
export const COURSE_BY_ID = Object.fromEntries(COURSES.map(c => [c.id, c]));
/** the four units of every course, in order */
export const UNITS = [{ k: 'lecture', name: 'Lecture 1' }, { k: 'practical', name: 'Practical' }, { k: 'lecture', name: 'Lecture 2' }, { k: 'final', name: 'Final' }];
export const DAYN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const hh = h => String(Math.floor(h)).padStart(2, '0') + ':' + String(Math.round((h % 1) * 60)).padStart(2, '0');
export const sectionText = s => s[0].map(d => DAYN[d]).join(' & ') + ' ' + hh(s[1]);
/** next class start (abs game minute) of a section strictly after t (a class that started less than `grace` minutes ago still counts) */
export function nextSlot(sec, t, grace = 0) { const d0 = Math.floor((t - grace) / 1440); for (let d = d0; d < d0 + 8; d++) { if (!sec[0].includes(((d % 7) + 7) % 7)) continue; const T = d * 1440 + sec[1] * 60; if (T + grace > t) return T; } return null; }
export const CLUBS = [
  { id: 'chess', name: 'Chess Club', skill: 'chess', line: 'Blitz on Thursdays. We keep score and we keep biscuits.' },
  { id: 'film', name: 'Film Society', skill: 'creativity', line: 'One projector, one sheet, forty opinions.' },
  { id: 'garden', name: 'Campus Gardeners', skill: 'gardening', line: 'We planted the yews. You can help with the tulips.' },
  { id: 'radio', name: 'Radio MBU', skill: 'music', line: 'Broadcasting to the quad and, on a clear night, the car park.' },
  { id: 'rowing', name: 'Rowing Club', skill: 'fitness', line: 'On the pond at dawn. It is a small pond. We turn a lot.' },
  { id: 'debate', name: 'Debating Society', skill: 'charisma', line: 'This house believes you should join. Any objections?' },
];
export const CLUB_NIGHT = { weekday: 3, hours: [19.5, 21] }, OPEN_LECTURE = { weekday: 2, hours: [19.5, 20.5] }, GROUP = { days: [1, 3], hours: [17, 18.5] }, FAIR = { dom: 2, hours: [11, 16] };
export const CERT_ITEM = id => 'uni_cert_' + id;

/* ---------- venues ---------- */
const WK = [0, 1, 2, 3, 4, 5, 6].map(d => HOURS(d));
const venue = (id, name, type, offers, blurb) => (VENUE_BY_ID[id] = VENUE_BY_ID[id] || { id, name, type, district: 'arts', where: 'Top of Riverside Drive, on Campus Drive beside Symphony Hall', station: null, interior: true, hours: WK, offers, priceMult: 1, jobId: null, delivers: false, blurb, showpiece: true });
venue(UV.place, NAME, 'leisure', { functions: [] }, 'A red-brick hall with a clock tower at the top of Riverside Drive. Enrol at the Registrar, sit in on a lecture, read by a green lamp, drink the strongest coffee in the Arts Quarter.');
venue(UV.cafe, 'The Quill & Kettle', 'food', { menu: true, functions: ['seat', 'till'] }, 'The Commons cafe. Coffee strong enough to mark essays by, and a toastie named after every Dean.');

/* ---------- moodlets ---------- */
const ML = { uni_learned: { name: 'Learned Something', desc: 'A good class. Your head feels pleasantly full.', mood: 5, workPerf: 1, walkSpeed: 1, minutes: 240, source: 'activity' },
  uni_proud: { name: 'Passed!', desc: 'A certificate with your name on it.', mood: 9, workPerf: 2, walkSpeed: 1, minutes: 600, source: 'activity' },
  uni_graduate: { name: 'Graduate', desc: 'Diploma of Maple Bay University. You threw the hat and everything.', mood: 12, workPerf: 2, walkSpeed: 1, minutes: 1440, source: 'activity' },
  uni_revised: { name: 'Well Revised', desc: 'The study group went through everything. Twice.', mood: 3, workPerf: 1, walkSpeed: 1, minutes: 480, source: 'activity' } };
for (const k in ML) if (!MOODLETS[k]) MOODLETS[k] = ML[k];

/* ---------- calendar ---------- */
const ev = e => { if (!EVENTS.some(x => x.id === e.id)) EVENTS.push(Object.assign({ place: { venue: UV.place }, special: {}, notify: 2 }, e)); };
ev({ id: 'uni_open_lecture', name: 'Open Lecture Night', kind: 'weekly', when: { weekday: OPEN_LECTURE.weekday }, hours: OPEN_LECTURE.hours, blurb: 'Wednesdays at half past seven a professor gives a short public talk in the Ashby Lecture Theatre. Free. Anyone may come; take any seat.' });
ev({ id: 'uni_club_night', name: 'Club Night in the Commons', kind: 'weekly', when: { weekday: CLUB_NIGHT.weekday }, hours: CLUB_NIGHT.hours, blurb: 'Thursday evening the clubs take over the Commons: chess, film, radio, debate. Members and the curious.' });
for (const [i, sn] of ['spring', 'summer', 'autumn', 'winter'].entries()) {
  ev({ id: 'uni_clubs_fair_' + sn, name: 'Clubs Fair on the Quad', kind: 'seasonal', when: { season: sn, days: [FAIR.dom] }, hours: FAIR.hours, place: { poi: 'lm:university', district: 'arts' }, blurb: 'Six striped stalls on the university quad, each one certain it is the best club. Join one; it is free.', special: { crowdMult: 1.2 }, notify: 3 });
  ev({ id: 'uni_exam_week_' + sn, name: 'Exam Week at the University', kind: 'seasonal', when: { season: sn, days: TUNE.examWeek }, hours: [9, 17], blurb: 'The last three days of term. Exam sittings at 10:00 and 14:00, a very quiet Reading Room and a very long queue for coffee.' });
  ev({ id: 'uni_graduation_' + sn, name: 'Graduation on the Quad', kind: 'seasonal', when: { season: sn, days: [14] }, hours: [16, 17.5], place: { poi: 'lm:university', district: 'arts' }, blurb: 'The Dean reads the names from the hall steps. Gowns, hats, and one person who always cries.' });
  void i;
}

/* ---------- items ---------- */
const CF = [UV.cafe];
const dish = (id, name, price, effects, eatMinutes, course, icon) => ({ id, name, category: 'dish', price, icon, effects, stack: 1, soldAt: CF, venue: CF[0], eatMinutes, course, takeaway: false });
const keep = (id, name, icon, note) => ({ id, name, category: 'misc', price: 0, icon, effects: {}, stack: 1, soldAt: [], note });
const gift = (id, name, price, icon, relationship, giftTags) => ({ id, name, category: 'gift', price, icon, effects: {}, stack: 3, soldAt: CF, relationship, giftTags });
const NEW = [
  keep('uni_card', 'Student Card', 'navy card with a gold crest and a small photo', 'Maple Bay University. A fifth off at the Quill & Kettle, and the Reading Room lets you stay.'),
  keep('uni_diploma', 'Diploma of Maple Bay University', 'cream scroll, navy ribbon, gold seal', 'Three certificates make a diploma. "Lux in portu": a light in the harbour.'),
  ...COURSES.map(c => keep(CERT_ITEM(c.id), 'Certificate: ' + c.name, 'cream certificate with a ' + c.color + ' ribbon', c.code + ', Maple Bay University. ' + c.perk)),
  dish('uni_coffee', "Dean's Roast", 2.5, { energy: 16, fun: 2, caffeine: true }, 5, 'drink', 'navy mug, steam'),
  dish('uni_tea', 'Library Tea', 2, { energy: 7, fun: 4 }, 5, 'drink', 'cup and saucer, lemon slice'),
  dish('uni_toastie', 'The Ashby Toastie', 5, { hunger: 34, fun: 3 }, 12, 'main', 'toasted sandwich cut in triangles'),
  dish('uni_soup', 'Thesis Soup', 4.5, { hunger: 28, energy: 3, fun: 2 }, 10, 'main', 'bowl of orange soup, bread roll'),
  dish('uni_flapjack', 'Revision Flapjack', 2.5, { hunger: 14, fun: 6, energy: 3 }, 4, 'snack', 'golden oat square'),
  dish('uni_crumble', 'All-Nighter Crumble', 4, { hunger: 20, fun: 9, moodlet: 'sweet_treat' }, 8, 'dessert', 'apple crumble in a dish, custard'),
  gift('uni_mug', 'University Mug', 7, 'navy mug with a gold crest', 5, ['cute']),
  gift('uni_pennant', 'MBU Pennant', 5, 'navy and gold felt pennant', 4, ['fun']),
];
export const NEW_ITEM_IDS = NEW.map(i => i.id);
const LISTS = { gift: GIFTS, misc: MISC, dish: DISHES };
for (const it of NEW) { if (ITEM_BY_ID[it.id]) continue; if (it.effects && it.effects.moodlet && !MOODLETS[it.effects.moodlet]) delete it.effects.moodlet; ITEMS.push(it); ITEM_BY_ID[it.id] = it; if (LISTS[it.category]) LISTS[it.category].push(it); }
