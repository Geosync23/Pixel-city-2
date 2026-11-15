// Maple Bay University (showpiece S10) — enrolment, courses, the timetable in the Planner, classes, coursework, finals, certificates and the diploma, the study group,
// clubs fair, open lecture nights, exam week, graduation, campus life on the quad, guide + guide-arrow wiring.
// Rooms: scenes/rooms/university.js. Class engine: ./_uni_class.js. Campus in the city: ./_uni_city.js. Data: data/university.js. Words + cast: story/university.js.
// UI: ui/university_ui.js (class sheet), ui/phone_uni.js (Campus app). Art: art/showpiece/university*.js + _uni_*.js.
//
// HOW A COURSE RUNS: enrol at the Registrar (student card $10 once; $80 a course; the Ashby Bursary halves it when your balance is under $300; work-study credit from
//   shelving in the Reading Room; a Distinction earns the Dean's Scholarship = the next course free). Pick the day or the evening section: two fixed classes a week.
//   Units in order: Lecture 1 -> Practical -> Lecture 2 -> Final (a written paper, or a presentation in front of the class). Whatever class you turn up to is YOUR next
//   unit, so missing one costs a few days, never the course. Coursework: the set reading (any Reading Room desk, after Lecture 1), a project (your station in the
//   Workshops, after the Practical), and practice (the skill's own mini-games anywhere). The Final needs the reading and the project.
//   Mark = participation 20 + practical 20 + coursework 20 + final 40. Pass 50 (and 50% in the final), Merit 70, Distinction 85. A failed final is resat at the next class
//   (first resit free, then $15). In exam week (days 12-14 of the season) finals can also be sat daily at 10:00 and 14:00.
// A CERTIFICATE gives: the item, +10% xp in its skill for good, +1 level (+2 with Distinction) toward job skill requirements [needs the jobs.js hook], +10% pay on
//   shifts of jobs that train that skill, course extras (Kitchen Science teaches three recipes). Three certificates = the Diploma.
//
// G.university = {
//   isOpen(), officeOpen(), examWeek(), fairOn(), groupOn(), clubNight(), openLectureOn(), busyNow(), deanIn(), hoursText(),
//   hasCard(), courses() -> [{ id, code, name, skill, enrolled, cert, price, sections }], enrolled() -> [ids], course(id) -> progress row | null, price(id),
//   enrol(id, sec) -> bool, withdraw(id), setSection(id, sec), buyCard() -> bool, registrar(), ready(id) -> bool (may sit the final), todo(id) -> [text],
//   next(id?) -> { cid, unit, kind, T, room, station, why? } | null, current() -> session open right now | null, timetable(days = 7) -> [{ T, cid, unit, kind, title, where }],
//   sit(seat, scene), useStation(key, scene), read(carrel, scene), shelve(), browse(), joinGroup(scene), joinClub(id), clubs(), board(kind), look(kind), talk(id, char, scene),
//   certs() -> { id: { grade, mark, day } }, hasCert(id), diploma(), jobBonus(skill) -> 0|1|2, xpMult(skill), transcript() -> [text], stats(), door(roomId), arrived(), campus() }
// State G.state.uni = { v, card, visits, courses: { id: { sec, unit, part: [right, asked], prac, read, readOk, proj, practice, final, tries, missed, late, group, appt, miss } },
//   certs: { id: { grade, mark, day } }, diploma, walked, credit, voucher, clubs: [ids], clubWeek, open: { id: 1 }, groupDay, shelfDay, rel: { castId: n }, work: n, seen: { key: 1 } }
// Events: 'university:visit'(first), ':card', ':enrol'(id, sec), ':withdraw'(id), ':classstart'(id, unit, kind), ':class'(id, unit, kind, score), ':missed'(id, unit),
//   ':reading'(id), ':project'(id, score), ':final'(id, mark, passed), ':certificate'(id, grade), ':diploma', ':graduation', ':open'(talkId), ':group'(id), ':club'(id), ':clubnight'(id), ':shelved'.
// Guide stamps: x:uni_visit, x:uni_class, x:uni_open, x:uni_group, x:uni_cert, x:uni_diploma.
import { G } from '../core/game.js';
import { toast, bubble, say, choose } from '../ui/kit.js';
import { enterRoom, exitRoom } from '../scenes/interior.js';
import { getCity } from '../world/_city.js';
import { Char } from '../core/char.js';
import { play } from '../ui/minigame.js';
import { JOBS } from '../data/jobs.js';
import { ITEM_BY_ID } from '../data/items.js';
import { EVENTS, eventOnDay } from '../data/calendar.js';
import { CORE, CORE_BLURB, EXPERIENCES } from './_guide_data.js';
import { NAME, UR, UV, HOURS, OFFICE, TUNE, COURSES, COURSE_BY_ID, UNITS, DAYN, hh, sectionText, nextSlot, CLUBS, CLUB_NIGHT, OPEN_LECTURE, GROUP, FAIR, CERT_ITEM } from '../data/university.js';
import { CAST, CLASSMATES, PROFS, READING, PRACTICAL, FINAL, OPEN, LINES } from '../story/university.js';
import { buildCampus, showProp, setProp, CAMPUS, STALL_AT, DOOR } from './_uni_city.js';
import * as CL from './_uni_class.js';
import { current as curSheet } from '../ui/university_ui.js';
import { castSpec, students, STATIONS } from '../scenes/rooms/university.js';

export const order = 56.4;
CORE.university = ['arts', 'University', 'key', ['sights', 'shows']];
CORE_BLURB.university = 'A red-brick hall with a clock tower at the top of Riverside Drive, on its own quad beside the pond. Enrol at the Registrar for one of eight short courses with a day or an evening section, sit in the Ashby Lecture Theatre, work at an easel or a stove, and leave with a certificate that counts at work. Free open lecture every Wednesday at 19:30.';
for (const x of [
  { id: 'x:uni_visit', title: 'Walk the University Quad', group: 'Big days out', glyph: 'key', place: 'place:university', need: 'university', blurb: 'Under the iron gate, past the Founder, up the steps of University Hall.' },
  { id: 'x:uni_class', title: 'Sit Through a Class', group: 'Big days out', glyph: 'key', place: 'place:university', need: 'university', blurb: 'Enrol at the Registrar and take your seat in the Ashby Lecture Theatre. Answer when the professor asks.' },
  { id: 'x:uni_open', title: 'Go to an Open Lecture', group: 'Big days out', glyph: 'key', place: 'place:university', need: 'university', blurb: 'Wednesdays at 19:30, free: a professor explains one curious thing in half an hour.' },
  { id: 'x:uni_group', title: 'Revise with the Study Group', group: 'Big days out', glyph: 'key', place: 'place:university', need: 'university', blurb: 'Tuesdays and Thursdays at five in the Commons. Saoirse brings four hundred flash cards.' },
  { id: 'x:uni_cert', title: 'Earn a Certificate', group: 'Big days out', glyph: 'key', place: 'place:university', need: 'university', blurb: 'Two lectures, a practical, coursework and a final. Your name, in ink, with a ribbon.' },
  { id: 'x:uni_diploma', title: 'Graduate', group: 'Big days out', glyph: 'key', place: 'place:university', need: 'university', blurb: 'Three certificates make the Diploma of Maple Bay University. The Dean reads your name from the hall steps.' },
]) if (!EXPERIENCES.some(e => e.id === x.id)) EXPERIENCES.push(x);

let S = null, campus = null, cityScene = null, loading = false;
const DAY = 1440;
const DEF = () => ({ v: 1, card: 0, visits: 0, courses: {}, certs: {}, diploma: 0, walked: 0, credit: 0, voucher: 0, clubs: [], clubWeek: -1, open: {}, groupDay: -1, shelfDay: -1, rel: {}, work: 0, seen: {} });
const st = () => { S = G.state.uni || (G.state.uni = {}); const d = DEF(); for (const k in d) if (S[k] === undefined || S[k] === null) S[k] = d[k]; return S; };
const safe = (fn, fb) => { try { const v = fn(); return v === undefined ? fb : v; } catch (e) { return fb; } };
const pick = a => a[Math.floor(Math.random() * a.length)];
const fmt = n => safe(() => G.money.fmt(n), '$' + n);
const now = () => G.state.t, dayOf = t => Math.floor(t / DAY), today = () => dayOf(now()), wd = (d = today()) => ((d % 7) + 7) % 7, dom = (d = today()) => (((d % 14) + 14) % 14) + 1, hf = () => (now() - today() * DAY) / 60;
const lvl = k => safe(() => G.skills.level(k), 1);
const teach = (k, xp) => (k && xp > 0 ? safe(() => (G.skills.teach ? G.skills.teach(k, xp, 'class') : G.skills.addXp(k, xp)), 0) : 0);
const need = (k, n) => safe(() => G.needs.add(k, n)), moodlet = id => safe(() => G.needs.addMoodlet(id)), stamp = id => safe(() => G.guide.stamp(id));
const inspire = (n, why) => safe(() => (G.needsExtra ? G.needsExtra.inspire(n, why || 'class') : G.needs.add('inspiration', n)));
const note = (title, text, pri) => safe(() => G.phone.notify({ app: 'campus', title, text, icon: 'skill.logic', priority: pri || 'normal' }));
const C = id => COURSE_BY_ID[id];
const inside = () => !!(G.scene && G.scene.def && G.scene.def.showpiece === 'university');
const inRoom = rid => !!G.scene && G.scene.id === 'int:' + rid;
const X = { C, lvl, teach };
const playerName = () => (G.state.player && G.state.player.name) || 'Friend';

/* ---------- hours + calendar ---------- */
const isOpen = (t = now()) => { const d = dayOf(t), h = (t - d * DAY) / 60, H = HOURS(wd(d)); return h >= H[0] && h < H[1]; };
const officeOpen = () => { const o = OFFICE(wd()), h = hf(); return !!o && h >= o[0] && h < o[1] && isOpen(); };
const examWeek = (d = today()) => TUNE.examWeek.includes(dom(d));
const fairOn = () => dom() === FAIR.dom && hf() >= FAIR.hours[0] && hf() < FAIR.hours[1];
const gradDay = () => dom() === 14, gradOn = () => gradDay() && hf() >= 16 && hf() < 17.5;
const groupOn = () => (GROUP.days.includes(wd()) || examWeek()) && hf() >= GROUP.hours[0] && hf() < GROUP.hours[1] && isOpen();
const clubNight = () => wd() === CLUB_NIGHT.weekday && hf() >= CLUB_NIGHT.hours[0] && hf() < CLUB_NIGHT.hours[1];
const openT = (d = today()) => d * DAY + OPEN_LECTURE.hours[0] * 60;
const openLectureOn = () => wd() === OPEN_LECTURE.weekday && now() >= openT() - TUNE.doors && now() < openT() + TUNE.late;
const openTalk = (d = today()) => OPEN[Math.floor(d / 7) % OPEN.length];
const busyNow = () => { const h = hf(); return wd() < 6 && ((h >= 9.5 && h < 10.2) || (h >= 11 && h < 14.2) || (h >= 16 && h < 17) || (h >= 18 && h < 18.7)); };
const deanIn = () => (wd() < 5 && ((hf() >= 10 && hf() < 12) || (hf() >= 15 && hf() < 16.5))) && !gradOn();
const hoursText = () => 'Monday to Saturday 08:00 to 21:30, Sunday 10:00 to 18:00 (Commons and Reading Room). Registrar: weekdays 08:30 to 17:30, Saturday 09:00 to 14:00.';

/* ---------- courses + sessions ---------- */
const row = id => st().courses[id] || null;
const enrolled = () => Object.keys(st().courses);
const hasCert = id => !!st().certs[id];
const ready = id => { const c = row(id); return !!c && !!c.read && c.proj !== null && c.proj !== undefined; };
function price(id) { const S = st(); if (S.voucher) return { base: TUNE.tuition, pay: 0, why: "Dean's Scholarship: this one is free" }; let p = TUNE.tuition, why = ''; if (safe(() => G.money.get(), 999) < TUNE.bursaryUnder) { p = Math.round(p / 2); why = 'Ashby Bursary: half fees'; } const cr = Math.min(S.credit || 0, p); if (cr > 0) { p -= cr; why += (why ? ' · ' : '') + `${fmt(cr)} work-study credit`; } return { base: TUNE.tuition, pay: p, credit: cr, why }; }
/** the next class of a course: { cid, unit, kind, T, room, station } or { why } when the final is not open to you yet */
function nextOf(id, t = now()) {
  const c = row(id); if (!c || c.unit > 3) return null; const cs = C(id), sec = cs.sections[c.sec], u = c.unit, kind = u === 3 ? (cs.final === 'exam' ? 'paper' : 'present') : UNITS[u].k;
  if (u === 3 && !ready(id)) return { cid: id, unit: u, kind, why: !c.read && (c.proj === null || c.proj === undefined) ? 'Finish the set reading and your project to sit the final.' : !c.read ? 'Finish the set reading to sit the final.' : 'Finish your project to sit the final.' };
  let T = nextSlot(sec, t, TUNE.late);
  if (u === 3) for (let d = dayOf(t - TUNE.late); d <= dayOf(t) + 3; d++) if (examWeek(d) && wd(d) !== 6) for (const h of [10, 14]) { const e = d * DAY + h * 60; if (e + TUNE.late > t && (T === null || e < T)) T = e; }
  if (T === null) return null;
  const pond = kind === 'practical' && cs.station === 'pond';
  return { cid: id, unit: u, kind, T, room: kind === 'practical' ? (pond ? 'city' : UR.workshop) : UR.lecture, station: kind === 'practical' ? cs.station : null };
}
const wet = () => safe(() => G.weather.isWet(), false) || safe(() => G.now().season, 0) === 3;
/** where the practical of a session really happens right now (the pond class moves to the lab tank in the wet and in winter) */
const stationOf = ses => (ses.station === 'pond' && wet() ? 'lab' : ses.station);
const roomOf = ses => (ses.kind === 'practical' ? (stationOf(ses) === 'pond' ? 'city' : UR.workshop) : UR.lecture);
const next = id => { if (id) return nextOf(id); let b = null; for (const k of enrolled()) { const n = nextOf(k); if (n && n.T !== undefined && (!b || n.T < b.T)) b = n; } return b; };
const inWindow = (T, t = now()) => t >= T - TUNE.doors && t < T + TUNE.late;
/** the class whose doors are open right now */
function current() { let b = null; const t = now(); for (const k of enrolled()) { const c = row(k); let n = nextOf(k);
    /* a class you had already joined (a save loaded in the middle of it) can be rejoined until ten minutes before it ends */
    if (c.inClass && t >= c.inClass && t < c.inClass + TUNE.classMin - 10 && !(n && n.T === c.inClass)) { const m = nextOf(k, c.inClass); if (m && m.T === c.inClass) n = m; }
    if (n && n.T !== undefined && (inWindow(n.T, t) || (c.inClass === n.T && t < n.T + TUNE.classMin - 10 && t >= n.T)) && (!b || n.T < b.T)) b = n; } return b; }
function timetable(days = 7) {
  const out = [], t = now();
  for (const id of enrolled()) { const c = row(id), cs = C(id); let u = c.unit, tt = t; for (let k = 0; k < 4 && u <= 3; k++, u++) { if (u === 3 && k > 0) { out.push({ T: null, cid: id, unit: 3, kind: 'final', title: `${cs.name}: Final`, where: ready(id) && u === 3 ? 'at the class after Lecture 2' : 'after your reading and project' }); break; } const n = k === 0 ? nextOf(id, tt) : (() => { const T = nextSlot(cs.sections[c.sec], tt, 0); return T === null ? null : { T, kind: UNITS[u].k }; })(); if (!n) break; if (n.T === undefined) { out.push({ T: null, cid: id, unit: u, kind: n.kind, title: `${cs.name}: Final`, where: n.why }); break; } if (n.T > t + days * DAY) break;
      out.push({ T: n.T, cid: id, unit: u, kind: n.kind, title: `${cs.name}: ${UNITS[u].name}`, where: n.kind === 'practical' ? PRACTICAL[id].where : 'Ashby Lecture Theatre' }); tt = n.T + TUNE.late + 1; } }
  for (let d = today(); d < today() + days; d++) { if (wd(d) === OPEN_LECTURE.weekday && openT(d) + TUNE.late > t) out.push({ T: openT(d), open: 1, title: 'Open lecture: ' + openTalk(d).title, where: 'Ashby Lecture Theatre · free' }); }
  return out.sort((a, b) => (a.T === null ? 1e12 : a.T) - (b.T === null ? 1e12 : b.T));
}
const clash = (id, sec) => enrolled().some(k => { if (k === id) return false; const a = C(k).sections[row(k).sec], b = C(id).sections[sec]; return a[1] === b[1] && a[0].some(d => b[0].includes(d)); });
function todo(id) { const c = row(id), cs = C(id), out = []; if (!c) return out; const n = nextOf(id);
  if (n && n.T !== undefined) out.push(`${UNITS[c.unit].name}: ${DAYN[wd(dayOf(n.T))]} ${hh((n.T % DAY) / 60)}${dayOf(n.T) === today() ? ' today' : ''}, ${n.kind === 'practical' ? PRACTICAL[id].where : 'the lecture theatre'}`);
  if (c.unit >= 1 && !c.read) out.push(`Read "${READING[id].title}" at a desk in the Reading Room`);
  if (c.unit >= 2 && (c.proj === null || c.proj === undefined)) out.push(`Project: ${PRACTICAL[id].project.title} (${PRACTICAL[id].where}, any time outside class)`);
  if ((c.practice || 0) < TUNE.practiceXp) out.push(`Practise ${cs.skill} anywhere (optional, counts toward your mark)`);
  if (n && n.why) out.push(n.why); return out; }

/* ---------- planner ---------- */
const dropAppt = c => { if (c && c.appt !== null && c.appt !== undefined) { const a = safe(() => G.planner.get(c.appt), null); if (a && a.t + (a.dur || 0) > now() && a.s < 3) safe(() => G.planner.remove(c.appt)); c.appt = null; } };
function syncPlanner() {
  if (!G.planner) return; const S = st(), live = CL.running();
  for (const id of enrolled()) { if (live && live.ses && live.ses.cid === id) continue; const c = S.courses[id], n = nextOf(id), old = c.appt !== undefined && c.appt !== null ? safe(() => G.planner.get(c.appt), null) : null;
    if (!n || n.T === undefined) { if (old && old.s < 2) safe(() => G.planner.remove(c.appt)); c.appt = null; continue; }
    if (old && old.t === n.T && old.data && old.data.unit === n.unit && old.s < 3) continue;
    if (old && old.s < 2) safe(() => G.planner.remove(c.appt));
    c.appt = safe(() => G.planner.add({ title: `${C(id).name}: ${UNITS[n.unit].name}`, placeId: UV.place, t: n.T, dur: TUNE.classMin, kind: 'personal', data: { uni: id, unit: n.unit, blurb: n.kind === 'practical' ? 'Practical at ' + PRACTICAL[id].where : n.unit === 3 ? 'The final' : 'In the Ashby Lecture Theatre. Take a seat a few minutes early.' }, remind: 30 }), null); }
}
/** a class went by without you */
function checkMissed() { const t = now(); for (const id of enrolled()) { const c = row(id); if (c.unit > 3) continue; const cs = C(id), sec = cs.sections[c.sec]; if (c.unit === 3 && !ready(id)) continue;
    const prev = (() => { for (let d = dayOf(t); d > dayOf(t) - 8; d--) { if (!sec[0].includes(wd(d))) continue; const T = d * DAY + sec[1] * 60; if (T + TUNE.late <= t) return T; } return null; })();
    if (prev === null || prev <= (c.since || 0) || prev <= (c.miss || 0)) continue; if (CL.running() && CL.running().ses.cid === id) continue;
    c.miss = prev; c.missed = (c.missed || 0) + 1; G.emit('university:missed', id, c.unit);
    if (c.appt !== null && c.appt !== undefined) { const a = safe(() => G.planner.get(c.appt), null); if (a && a.t <= prev) { safe(() => G.planner.remove(c.appt)); c.appt = null; } }
    const n = nextOf(id); note(CAST[cs.prof].short, `${pick(LINES.missed)}${n && n.T ? ` Next: ${DAYN[wd(dayOf(n.T))]} ${hh((n.T % DAY) / 60)}.` : ''}`, 'low'); } syncPlanner(); }

/* ---------- enrolment ---------- */
function buyCard() { const S = st(); if (S.card) return true; if (safe(() => G.money.get(), TUNE.card) < TUNE.card) { toast(`The student card is ${fmt(TUNE.card)}.`, 'bad'); return false; } if (G.money && !G.money.pay(TUNE.card, 'Student card', { category: 'fun', venue: UV.place })) return false; S.card = 1; safe(() => G.inv.add('uni_card', 1)); G.emit('university:card'); toast('Student card: the Workshops and the returns cart in the Reading Room are open to you.', 'good', 4200); return true; }
function enrol(id, sec = 0) {
  const S = st(), cs = C(id); if (!cs || S.courses[id] || S.certs[id]) return false; if (enrolled().length >= TUNE.maxCourses) { toast(`Two courses at a time is the limit. Finish one first.`, 'info'); return false; } if (clash(id, sec)) { toast('That section clashes with a class you already have.', 'info'); return false; }
  const pr = price(id), cost = pr.pay + (S.card ? 0 : TUNE.card), have = safe(() => G.money.get(), cost);
  if (have < cost) { toast(`${cs.name} is ${fmt(cost)}${S.card ? '' : ' with the card'} and you have ${fmt(Math.max(0, have))}. ${pr.pay === TUNE.tuition ? '' : 'That is with the bursary. '}Shelving in the Reading Room earns credit toward it.`, 'bad', 5200); return false; }
  if (!buyCard()) return false; if (pr.pay > 0 && G.money && !G.money.pay(pr.pay, 'Tuition: ' + cs.name, { category: 'fun', venue: UV.place })) return false;
  if (S.voucher) S.voucher = 0; else if (pr.credit) S.credit -= pr.credit;
  S.courses[id] = { sec, unit: 0, part: [0, 0], prac: null, read: 0, readOk: 0, proj: null, practice: 0, final: null, tries: 0, missed: 0, late: 0, group: 0, appt: null, miss: 0, since: now() };
  syncPlanner(); G.emit('university:enrol', id, sec); const n = nextOf(id);
  note('Enrolled: ' + cs.name, `${cs.code} with ${CAST[cs.prof].name}. First class ${n && n.T ? DAYN[wd(dayOf(n.T))] + ' ' + hh((n.T % DAY) / 60) : 'soon'} in the Ashby Lecture Theatre. It is in your Planner.`); safe(() => { if (G.apps && !G.apps.isInstalled('campus')) { if (!G.apps.isReleased('campus')) G.apps.release('campus', true); G.apps.install('campus'); } }); return true;
}
function withdraw(id) { const S = st(), c = S.courses[id]; if (!c) return false; dropAppt(c); delete S.courses[id]; G.emit('university:withdraw', id); return true; }
function setSection(id, sec) { const c = row(id); if (!c || c.sec === sec || !C(id).sections[sec]) return false; if (clash(id, sec)) { toast('That section clashes with a class you already have.', 'info'); return false; } c.sec = sec; c.since = now(); syncPlanner(); return true; }
async function registrar() {
  if (G.busy) return; const S = st(), who = CAST.pym.name;
  if (!officeOpen()) { toast('The Registrar\'s window is shut. Weekdays 08:30 to 17:30, Saturday 09:00 to 14:00.', 'info', 3800); return; }
  for (;;) {
    const en = enrolled(), v = await choose('Registrar', [
      { label: 'Enrol in a course', sub: en.length >= TUNE.maxCourses ? 'You have two on the go. Finish one first.' : `${fmt(TUNE.tuition)} a course${S.card ? '' : `, plus ${fmt(TUNE.card)} for the student card`}${S.voucher ? " · Dean's Scholarship: next one free" : ''}`, value: 'e', disabled: en.length >= TUNE.maxCourses },
      en.length ? { label: 'My courses', sub: en.map(k => C(k).name).join(' · '), value: 'm' } : null,
      { label: 'My record', sub: Object.keys(S.certs).length ? `${Object.keys(S.certs).length} certificate${Object.keys(S.certs).length === 1 ? '' : 's'}${S.diploma ? ' · Diploma' : ''}` : 'Nothing yet. Everybody starts there.', value: 't' },
      { label: 'Fees and help with fees', value: 'f' }, { label: 'That is all, thank you', value: null }].filter(Boolean), { text: `"${S.card ? 'Yes, dear?' : 'New face. Black ink only, please.'}"` });
    if (v === null) return;
    if (v === 'f') { await say([{ who, text: `A course is ${fmt(TUNE.tuition)}: two lectures, a practical and the final. The card is ${fmt(TUNE.card)}, once.` }, { who, text: `If your balance is under ${fmt(TUNE.bursaryUnder)} the Ashby Bursary pays half. Shelving for Mr. Mott in the Reading Room earns ${fmt(TUNE.workStudy)} credit a session. And a Distinction earns the Dean's Scholarship: your next course free.` }]); continue; }
    if (v === 't') { const T = transcript(); await say(T.length ? T.map(t => ({ who: 'Your record', text: t })) : [{ who, text: 'A clean sheet. I do like a clean sheet. Shall we put something on it?' }]); continue; }
    if (v === 'm') { const k = en.length === 1 ? en[0] : await choose('My courses', en.map(q => ({ label: C(q).name, sub: todo(q)[0] || '', value: q })).concat({ label: 'Back', value: null })); if (!k) continue; const c = row(k), cs = C(k), o = 1 - c.sec;
      const a = await choose(cs.name, [{ label: 'What is left to do', value: 'w' }, { label: `Change to the ${o ? 'evening' : 'day'} section`, sub: sectionText(cs.sections[o]) + (clash(k, o) ? ' · clashes' : ''), value: 's', disabled: clash(k, o) }, { label: 'Withdraw', sub: 'No refund, and your progress is lost', value: 'x' }, { label: 'Back', value: null }], { text: `${cs.code} · ${CAST[cs.prof].name} · ${sectionText(cs.sections[c.sec])}` });
      if (a === 'w') await say(todo(k).map(t => ({ who: cs.name, text: t })));
      else if (a === 's') { if (setSection(k, o)) toast(`Moved to ${sectionText(cs.sections[o])}. Your Planner has the new time.`, 'good', 3600); }
      else if (a === 'x') { const y = await choose(`Withdraw from ${cs.name}?`, [{ label: 'Yes, withdraw', value: 1 }, { label: 'No, keep it', value: 0 }]); if (y) { withdraw(k); toast(`You have withdrawn from ${cs.name}.`, 'info'); } }
      continue; }
    const list = COURSES.filter(q => !S.courses[q.id] && !S.certs[q.id]); if (!list.length) { await say([{ who, text: 'You have taken everything we teach. I shall have to speak to the Dean about inventing something.' }]); continue; }
    const id = await choose('Enrol: choose a course', list.map(q => ({ label: `${q.name}`, sub: `${q.code} · ${q.skill[0].toUpperCase() + q.skill.slice(1)} · ${CAST[q.prof].short}`, value: q.id })).concat({ label: 'Back', value: null }), { text: 'Each course: two lectures, one practical, a little coursework and a final.' });
    if (!id) continue; const cs = C(id), pr = price(id), cost = pr.pay + (S.card ? 0 : TUNE.card);
    const sec = await choose(cs.name, cs.sections.map((s, i) => ({ label: `${i ? 'Evening' : 'Day'} section: ${sectionText(s)}`, sub: clash(id, i) ? 'Clashes with a class you have' : `${fmt(cost)}${pr.why ? ' · ' + pr.why : ''}${S.card ? '' : ' · includes the card'}`, value: i, disabled: clash(id, i) })).concat({ label: 'Not this one', value: null }), { text: `${cs.blurb} You get: ${cs.perk}` });
    if (sec === null) continue;
    if (enrol(id, sec)) { const n = nextOf(id); await say([{ who, text: `There. Stamped. ${cs.name}, ${sectionText(cs.sections[sec])}, with ${CAST[cs.prof].name}.` }, { who, text: `Your first class is ${n && n.T ? DAYN[wd(dayOf(n.T))] + ' at ' + hh((n.T % DAY) / 60) : 'this week'} in the lecture theatre, straight ahead. It is in your Planner. Do not be late; the clock is already two minutes fast.` }]); return; }
  }
}

/* ---------- finishing units ---------- */
const finalMark = c => { const W = TUNE.weights, part = c.part[1] ? c.part[0] / c.part[1] * 100 : 50, prac = (c.prac === null ? .4 : c.prac) * 100, work = Math.min(100, (c.read ? 30 + 10 * (c.readOk || 0) : 0) + (c.proj !== null && c.proj !== undefined ? 25 + c.proj * 20 : 0) + Math.min(15, (c.practice || 0) / TUNE.practiceXp * 15)); return { part, prac, work, total: Math.round((part * W.part + prac * W.practical + work * W.work + (c.final || 0) * W.final) / 100) }; };
const gradeOf = m => (m >= TUNE.distinction ? 'Distinction' : m >= TUNE.merit ? 'Merit' : 'Pass');
async function afterClass(ses, res) {
  const c = row(ses.cid), cs = C(ses.cid), sh = res.sheet, kind = ses.kind; if (!c) { sh && sh.close(); return; }
  if (c.appt !== null && c.appt !== undefined) safe(() => G.planner.done(c.appt)); c.since = now(); c.miss = now();
  need('fun', 5); need('social', 5); stamp('x:uni_class');
  if (kind === 'lecture') { c.part[0] += res.part[0]; c.part[1] += res.part[1]; c.unit++; const xp = Math.round(teach(cs.skill, TUNE.xp.lecture * (.7 + .3 * res.part[0] / Math.max(1, res.part[1])))); teach(cs.also, 8); inspire(8); moodlet('uni_learned'); G.emit('university:class', ses.cid, ses.unit, kind, res.part[0]);
    await sh.result({ title: `${UNITS[ses.unit].name} done`, lines: [`You answered ${res.part[0]} of ${res.part[1]} in class`, xp ? `+${xp} ${cs.skill} xp` : null, ses.unit === 0 ? `Homework: read "${READING[cs.id].title}" at a Reading Room desk` : ready(cs.id) ? 'Next class is your final. You are ready for it.' : 'Before the final: ' + (c.read ? '' : 'the reading') + (!c.read && c.proj === null ? ' and ' : '') + (c.proj === null ? 'your project' : '')], btn: 'Leave the theatre' }); }
  else if (kind === 'practical') { c.prac = res.score; c.unit++; const xp = Math.round(teach(cs.skill, TUNE.xp.practical * (.6 + .6 * res.score))); teach(cs.also, 10); inspire(6); moodlet('uni_learned'); G.emit('university:class', ses.cid, ses.unit, kind, res.score);
    await sh.result({ grade: res.score >= .85 ? 'A' : res.score >= .55 ? 'B' : 'C', title: 'Practical done', lines: [xp ? `+${xp} ${cs.skill} xp` : null, `Project set: ${PRACTICAL[cs.id].project.title}`, `Do it at ${PRACTICAL[cs.id].where}, any time outside class`], btn: 'Done' }); }
  else { /* the final */
    c.tries = (c.tries || 0) + 1; c.final = Math.min(100, res.score + (c.group ? TUNE.groupBonus : 0)); const M = finalMark(c), passed = c.final >= TUNE.pass && M.total >= TUNE.pass; G.emit('university:final', ses.cid, M.total, passed);
    if (!passed) { const n = nextOf(ses.cid); await sh.result({ grade: M.total + '%', title: 'Not this time', lines: [kind === 'paper' ? `${res.right} of ${res.of} on the paper` : 'The room was kind. The mark was fair.', `You need ${TUNE.pass}% in the final and overall.`, `Resit at your next class${n && n.T ? ': ' + DAYN[wd(dayOf(n.T))] + ' ' + hh((n.T % DAY) / 60) : ''}. ${c.tries >= 1 ? (c.tries >= 2 ? `Resits are ${fmt(TUNE.resit)} from now on.` : 'The first resit is free.') : ''}`, 'The study group in the Commons helps: Tuesdays and Thursdays at five.'], btn: 'Chin up' }); }
    else { const g = gradeOf(M.total), S = st(); teach(cs.skill, TUNE.xp.final); S.certs[cs.id] = { grade: g, mark: M.total, day: today() }; dropAppt(c); delete S.courses[cs.id];
      safe(() => G.inv.add(CERT_ITEM(cs.id), 1)); moodlet('uni_proud'); stamp('x:uni_cert'); inspire(14); const extra = [];
      if (cs.recipes) { const got = cs.recipes.filter(r => safe(() => !G.cooking.knows(r) && G.cooking.learn(r, 'class'), false)); if (got.length) extra.push(`New recipes: ${got.length} from Prof. Baptiste's own book`); }
      if (g === 'Distinction') { S.voucher = 1; extra.push("Dean's Scholarship: your next course is free"); }
      G.emit('university:certificate', cs.id, g); let dip = false; if (Object.keys(S.certs).length >= 3 && !S.diploma) { S.diploma = today(); dip = true; safe(() => G.inv.add('uni_diploma', 1)); G.state.flags.uni_grad = true; stamp('x:uni_diploma'); G.emit('university:diploma'); }
      note('Certificate: ' + cs.name, `${g}, ${M.total}%. ${cs.perk}`, 'high');
      await sh.result({ grade: M.total + '%', title: `${g}: ${cs.name}`, lines: [CAST[cs.prof].pass[0], `Participation ${Math.round(M.part)} · practical ${Math.round(M.prac)} · coursework ${Math.round(M.work)} · final ${c.final}`, 'Your certificate is in your bag.', cs.perk].concat(extra, dip ? ['THREE CERTIFICATES: you have earned the Diploma of Maple Bay University. Graduation is on the quad, the last day of the season at 16:00.'] : []), btn: 'Thank you' }); } }
  sh.close(); syncPlanner(); safe(() => G.scene.uni && G.scene.uni.sync && G.scene.uni.sync());
}

/* ---------- taking part ---------- */
const canSit = () => !G.busy;
function casualSit(seat, label = 'Sitting down', mins = 15, anim = 'sit') { const p = G.player; seat.taken = p; p.poseOpts = { seated: true }; G.startActivity({ label, anim, minutes: mins, rate: 2.5, at: { x: seat.x, y: seat.y, z: seat.z, dir: seat.dir }, tick: gm => need('energy', gm * .12), cancel: () => { p.poseOpts = null; seat.taken = null; }, done: () => { p.poseOpts = null; seat.taken = null; } }); }
async function sit(seat, sc) {
  if (G.busy || CL.running() || !seat || seat.taken) return false; const ses = current(), ol = openLectureOn() && !st().open['d' + today()];
  const mine = ses && roomOf(ses) === UR.lecture ? ses : null;
  if (!mine && !ol) { const n = next(); casualSit(seat); toast(n && n.T !== undefined && roomOf(n) === UR.lecture && n.T - now() < 180 ? `Your class is at ${hh((n.T % DAY) / 60)}. Doors open ${TUNE.doors} minutes before.` : 'An empty lecture theatre. It smells of chalk and floor polish.', 'info', 3400); return true; }
  seat.taken = G.player; const free = () => { if (seat.taken === G.player) seat.taken = null; };
  try {
    if (mine) { const T = mine.T, c = row(mine.cid); if (mine.unit === 3 && c.tries >= 2 && G.money && !G.money.pay(TUNE.resit, 'Resit fee: ' + C(mine.cid).name, { category: 'fun', venue: UV.place })) { free(); return false; }
      if (c.appt !== null && c.appt !== undefined) safe(() => G.planner.done(c.appt)); if (now() < T && !(await CL.waitUntil(T, 'Waiting for class to start', Object.assign({ seated: true }, seat)))) { free(); return false; }
      mine.late = now() > T + 6 && c.inClass !== T; if (mine.late) c.late = (c.late || 0) + 1; c.inClass = T; seat.taken = G.player; roomSync(sc, true);
      const res = mine.kind === 'lecture' ? await CL.lecture(X, mine, seat, sc) : mine.kind === 'paper' ? await CL.paper(X, mine, seat, sc) : await CL.present(X, mine, seat, sc);
      free(); if (res.left) { toast('You slip out. The unit will wait for your next class.', 'info', 3400); checkLeft(mine); return false; } await afterClass(mine, res); return true; }
    const T = openT(), talk = openTalk(); if (now() < T && !(await CL.waitUntil(T, 'Waiting for the open lecture', Object.assign({ seated: true }, seat)))) { free(); return false; }
    seat.taken = G.player; roomSync(sc, true); const res = await CL.openLecture(X, talk, seat, sc); free(); if (res.left) return false;
    const S = st(); S.open['d' + today()] = 1; const first = !S.open[talk.id]; S.open[talk.id] = 1; inspire(12, 'talk'); need('fun', 8); need('social', 4); const xp = Math.round(teach(C(PROFS.includes(talk.by) ? COURSES.find(q => q.prof === talk.by).id : 'code').skill, TUNE.xp.open)); stamp('x:uni_open'); G.emit('university:open', talk.id);
    await res.sheet.result({ title: talk.title, lines: ['A good half hour.', first ? 'A new one for your list of open lectures.' : null, xp ? `+${xp} xp` : null, 'Next Wednesday: a different professor, a different curious thing.'], btn: 'Out into the evening' }); res.sheet.close(); return true;
  } catch (e) { console.warn('university class', e); CL.abort(); free(); return false; }
}
/** leaving a class half way: it counts as not attended (no penalty beyond the wait) */
function checkLeft(ses) { const c = row(ses.cid); if (c) { c.miss = now(); c.since = ses.T + TUNE.late; if (!loading) c.inClass = 0; } syncPlanner(); }
const stationOn = k => isOpen();
async function useStation(k, sc, city) {
  if (G.busy || CL.running()) return false; const S = st(), stn = city ? null : sc.uni.stations[k], ses = current(), mine = ses && ses.kind === 'practical' && stationOf(ses) === k ? ses : null;
  const at = city ? { x: CAMPUS.pond.x, y: CAMPUS.pond.y, z: 0, dir: 2, anim: 'work' } : { x: stn.x, y: stn.y, z: stn.z || 0, dir: stn.dir, anim: stn.anim, seated: !!stn.seated };
  try {
    if (mine) { const T = mine.T, c0 = row(mine.cid); if (c0.appt !== null && c0.appt !== undefined) safe(() => G.planner.done(c0.appt)); if (now() < T && !(await CL.waitUntil(T, 'Waiting for the practical', at, at.seated ? at.anim : 'stand'))) return false; c0.inClass = T; roomSync(sc, true); if (city) pondSync(true);
      const res = await CL.practical(X, mine, at, city ? { uni: { prof: pond.prof, mates: pond.mates } } : sc, k); if (res.left) { toast('You step away. The practical will run again at your next class.', 'info', 3400); checkLeft(mine); return false; } await afterClass(mine, res); return true; }
    if (!S.card) { toast('The Workshops are for students. A card is ' + fmt(TUNE.card) + ' at the Registrar, in the hall.', 'info', 3800); return false; }
    /* project, or free practice */
    const due = enrolled().find(id => { const cs = C(id), c = row(id); return c.unit >= 2 && (c.proj === null || c.proj === undefined) && (cs.station === k || (cs.station === 'pond' && k === 'lab')); });
    const any = COURSES.find(q => q.station === k || (q.station === 'pond' && k === 'lab')); if (!any) return false; const cs = due ? C(due) : any;
    const v = await choose(city ? 'The pond deck' : STATIONS[k].label, [due ? { label: `Project: ${PRACTICAL[due].project.title}`, sub: PRACTICAL[due].project.text, value: 'p' } : null, { label: 'Practise', sub: `${cs.game.title}. About half an hour.`, value: 'f' }, { label: 'Not now', value: null }].filter(Boolean));
    if (!v) return false; const p = G.player; if (at.seated) p.poseOpts = { seated: true };
    const a = G.startActivity({ label: v === 'p' ? 'Project: ' + PRACTICAL[due].project.title : 'Practising', anim: at.anim, minutes: 9999, rate: .0001, at, cancel: () => { p.poseOpts = null; }, done: () => { p.poseOpts = null; } }); a._uni = true;
    let res = null; try { res = await play(Object.assign({ level: lvl(cs.skill), sub: v === 'p' ? `${cs.code} · project` : 'Open studio' }, cs.game, v === 'p' ? { title: PRACTICAL[due].project.title } : null)); } catch (e) { res = null; }
    if (!(G.busy && G.busy._uni)) return false; const score = res ? (res.auto ? .5 : res.score || 0) : .3; G.advance(v === 'p' ? TUNE.projectMin : 30); G.endActivity(true);
    if (v === 'p') { const c = row(due); c.proj = score; S.work++; teach(cs.skill, TUNE.xp.project * (.6 + .6 * score)); inspire(8); moodlet('uni_learned'); G.emit('university:project', due, score); syncPlanner();
      toast(`Project handed in: ${PRACTICAL[due].project.title}. ${score >= .8 ? 'It is going on the Student Work board.' : 'Done is better than perfect.'}${ready(due) ? ' You can sit the final now.' : ''}`, 'good', 5200); }
    else { teach(cs.skill, 22 * (.5 + score)); need('fun', 4); toast(`A good half hour of ${cs.skill}.`, 'good'); }
    return true;
  } catch (e) { console.warn('university station', e); CL.abort(); return false; }
}
async function read(car, sc) {
  if (G.busy || CL.running()) return false; const due = enrolled().filter(id => row(id).unit >= 1 && !row(id).read);
  const at = { x: car.x, y: car.y, z: car.z, dir: car.dir, seated: true };
  if (!due.length) { car.taken = G.player; const p = G.player; p.poseOpts = { seated: true }; G.startActivity({ label: 'Reading by the green lamp', anim: 'read', minutes: 40, rate: 3, at, tick: gm => { safe(() => G.skills.addXp('logic', gm * .35)); need('fun', gm * .05); }, cancel: () => { p.poseOpts = null; car.taken = null; }, done: () => { p.poseOpts = null; car.taken = null; inspire(6, 'book'); toast('Forty quiet minutes. The lamp hums a little.', 'good'); } }); return true; }
  const id = due.length === 1 ? due[0] : await choose('Which reading?', due.map(k => ({ label: READING[k].title, sub: C(k).name, value: k })).concat({ label: 'Not now', value: null })); if (!id) return false;
  car.taken = G.player; try { const res = await CL.reading(X, id, at, sc); car.taken = null; if (res.left) return false; const c = row(id); c.read = 1; c.readOk = res.ok; const xp = Math.round(teach(C(id).skill, TUNE.xp.reading)); inspire(8, 'book'); G.emit('university:reading', id); syncPlanner();
    await res.sheet.result({ title: 'Reading done', lines: [READING[id].title, xp ? `+${xp} ${C(id).skill} xp` : null, ready(id) ? 'Reading and project both in: you can sit the final.' : row(id).unit >= 2 ? 'Still to do: your project in the Workshops.' : 'What you read will be on the paper.'], btn: 'Close the book' }); res.sheet.close(); return true; } catch (e) { console.warn(e); CL.abort(); car.taken = null; return false; }
}
async function shelve(fx, sc) {
  if (G.busy) return false; const S = st(); if (!S.card) { toast('"The cart is for work-study students. See the Registrar about a card."', 'info', 3600); return false; } if (S.shelfDay === today()) { toast('"That is today\'s cart done. Come back tomorrow, the books always return."', 'info', 3600); return false; }
  const v = await choose('Returns cart', [{ label: 'Shelve the returns (work-study)', sub: `${fmt(TUNE.workStudy)} off your next course. About half an hour.`, value: 1 }, { label: 'Not now', value: null }]); if (!v) return false;
  const p = G.player, a = G.startActivity({ label: 'Shelving the returns', anim: 'carry', minutes: 9999, rate: .0001, cancel: () => { }, done: () => { } }); a._uni = true; void p;
  let res = null; try { res = await play({ kind: 'sort', icon: 'skill.logic', title: 'Shelve the returns', hint: 'Which shelf does each book go back to?', level: lvl('logic'), sub: 'Work-study', o: { bins: ['Science', 'Arts', 'Stories'], items: [['The Curious Pan', 0], ['Field Notes of Maple Bay', 0], ['Small Steps', 0], ['Looking', 1], ['The Listening Book', 1], ['Say It Plain', 1], ['The Night Ferry', 2], ['A Lighthouse Year', 2], ['The Householder\'s Handbook', 0], ['Colour for Beginners', 1], ['Harbour Ghost Stories', 2], ['Tides: A Life', 2]] }, verdicts: ['Mr. Mott winces', 'Mostly right', 'Tidy shelves', 'Not a spine out of place!'] }); } catch (e) { res = null; }
  if (!(G.busy && G.busy._uni)) return false; G.advance(30); G.endActivity(true); const score = res ? (res.auto ? .5 : res.score || 0) : .3, amt = Math.round(TUNE.workStudy * (.6 + .4 * score)); S.shelfDay = today(); S.credit = (S.credit || 0) + amt; safe(() => G.skills.addXp('logic', 12)); G.emit('university:shelved');
  const m = sc && sc.uni && sc.uni.cast && sc.uni.cast.mott; if (m && !m.hidden) bubble(m, score >= .8 ? 'Not a spine out of place. Thank you.' : 'Thank you. I will just... move that one.', 3200); toast(`Work-study: ${fmt(amt)} credit toward your next course (${fmt(S.credit)} saved).`, 'good', 4200); return true;
}
function browse() { if (G.busy) return; const S = st(), k = 'br' + today(); toast(pick(['"A Lighthouse Year". Somebody has pressed a flower in chapter six.', 'A shelf of bound theses. The oldest is from 1903: "On the Herring".', '"Tides: A Life". The margin notes argue with the author.', 'An atlas with Maple Bay drawn slightly too large. Local printing.', 'Every course text, in threes. The middle copy is always out.']), 'info', 3600); if (!S.seen[k]) { S.seen[k] = 1; inspire(3, 'book'); } }
async function joinGroup(sc) {
  if (G.busy || CL.running() || !groupOn()) return false; const S = st(), g = sc.uni.group, en = enrolled();
  if (!en.length) { casualSit(g.seat, 'Sitting with the study group', 20, 'read'); const c = g.mates[0]; bubble(c, 'You are not enrolled yet? Sit anyway. Mind the flash cards.', 3400); need('social', 6); return true; }
  const id = en.length === 1 ? en[0] : await choose('Revise which course?', en.map(k => ({ label: C(k).name, value: k })).concat({ label: 'Not now', value: null })); if (!id) return false;
  g.seat.taken = G.player; try { const res = await CL.quiz(X, id, g.seat, sc, g.mates); g.seat.taken = null; if (res.left) return false; const c = row(id), first = !c.group; c.group = 1; S.groupDay = today(); need('social', 14); need('fun', 6); const xp = Math.round(teach(C(id).skill, TUNE.xp.group)); moodlet('uni_revised'); stamp('x:uni_group'); for (const m of ['saoirse', 'mateo', 'agnes', 'bao']) S.rel[m] = (S.rel[m] || 0) + 1; G.emit('university:group', id);
    await res.sheet.result({ title: 'Study group', lines: [`${res.ok} of ${res.of} cards right`, xp ? `+${xp} ${C(id).skill} xp` : null, first ? `Revised: +${TUNE.groupBonus} marks on your ${C(id).name} final` : 'The cards are getting familiar.'], btn: 'See you Thursday' }); res.sheet.close(); return true; } catch (e) { console.warn(e); CL.abort(); g.seat.taken = null; return false; }
}
function joinClub(id) { const S = st(), cl = CLUBS.find(q => q.id === id); if (!cl || S.clubs.includes(id)) return false; if (S.clubs.length >= 2) { toast('Two clubs is plenty. Even Agnes only has three.', 'info'); return false; } S.clubs.push(id); teach(cl.skill, 15); need('social', 8); need('fun', 6); G.emit('university:club', id); toast(`You have joined the ${cl.name}. Club night is Thursday at 19:30 in the Commons.`, 'good', 4200); return true; }
async function clubMenu(only) { const S = st(), list = CLUBS.filter(q => !only || q.id === only);
  if (clubNight() && inRoom(UR.commons) && S.clubs.length && S.clubWeek !== Math.floor(today() / 7)) { const cl = CLUBS.find(q => q.id === S.clubs[0]), v = await choose('Club night', S.clubs.map(k => ({ label: 'Join in: ' + CLUBS.find(q => q.id === k).name, sub: 'About three quarters of an hour', value: k })).concat({ label: 'Just looking', value: null })); void cl;
    if (v) { const c = CLUBS.find(q => q.id === v); G.startActivity({ label: 'Club night: ' + c.name, anim: 'talk', minutes: 45, rate: 5, tick: gm => { need('fun', gm * .45); need('social', gm * .4); }, done: () => { S.clubWeek = Math.floor(today() / 7); teach(c.skill, TUNE.xp.club); inspire(5); G.emit('university:clubnight', v); toast(`A good club night. ${c.line}`, 'good', 4200); } }); return; } return; }
  const v = await choose(only ? list[0].name : 'Clubs & societies', list.map(q => ({ label: S.clubs.includes(q.id) ? q.name + ' (member)' : 'Join the ' + q.name, sub: q.line, value: q.id, disabled: S.clubs.includes(q.id) })).concat({ label: 'Maybe later', value: null }), { text: 'Free to join, two at most. Club night is Thursday at 19:30 in the Commons.' }); if (v) joinClub(v); }
function board(kind) { if (kind === 'time') { if (G.phone && enrolled().length) return G.phone.open('campus', { tab: 'time' }); const tt = timetable(7).slice(0, 4); return toast(tt.length ? 'This week: ' + tt.map(r => `${r.T ? DAYN[wd(dayOf(r.T))] + ' ' + hh((r.T % DAY) / 60) : ''} ${r.title}`).join(' · ') : 'Eight courses, a day and an evening section each. The Registrar has the forms.', 'info', 5200); }
  if (kind === 'clubs') return clubMenu(); if (kind === 'exam') { const T = transcript(); return toast(T.length ? T[T.length - 1] : 'Lists of numbers, and one name circled in red with "see me".', 'info', 4200); }
  const n = st().work; toast(n ? `Student work. Yours is pinned ${['top left', 'in the middle', 'bottom right'][n % 3]}, with a gold star somebody added in biro.` : 'Student work: four still lifes, a circuit that lights a bulb, a poem about the pond.', 'info', 4200); }
function look(kind, k) { const S = st(), key = 'lk:' + kind + (k || ''); const T = { bust: '"Cornelius Ashby, 1840 to 1912. He taught sailors to read by lantern in a net loft, and called it a university until it was one."', trophy: 'The Pond Regatta Cup (the pond is forty metres long), the Chess Varsity Shield, and a wooden spoon, engraved, for Debating.', gowns: 'Graduation gowns, navy with a gold hood. They smell of mothballs and other people\'s proud days.',
    portrait: ['Dean Ashby the First, painted looking at his pocket watch. It is two minutes fast.', 'Dean Okafor-Hale, who let women sit the examinations in 1904 and was nearly sacked for it.', 'Dean Pettifer, 1931. The dog was not supposed to be in the picture.', 'Dean Marchetti, who built the Commons and is the reason for the fireplace.', 'Dean Varga, who taught mathematics and never once wore matching socks.', 'Dean Oyelaran. She retired last spring. The portrait still looks surprised.'][k % 6] };
  toast(T[kind] || 'Old, polished and proud of it.', 'info', 4800); if (!S.seen[key]) { S.seen[key] = 1; inspire(2, 'detail'); } }
function transcript() { const S = st(); return Object.keys(S.certs).map(id => `${C(id).code} ${C(id).name}: ${S.certs[id].grade}, ${S.certs[id].mark}%`).concat(S.diploma ? ['Diploma of Maple Bay University'] : []); }
function talk(id, ch, sc) {
  const S = st(), P = CAST[id]; if (!P || !ch) return; ch._hold = 4; if (!(ch.poseOpts && ch.poseOpts.seated)) ch.faceTo(G.player.x, G.player.y); const sayB = t => bubble(ch, t, 3800);
  S.rel[id] = (S.rel[id] || 0) + (S.seen['tk' + id + today()] ? 0 : 1); if (!S.seen['tk' + id + today()]) { S.seen['tk' + id + today()] = 1; need('social', 3); }
  if (id === 'pym') return registrar(); if (id === 'juno') return safe(() => G.shop.open(UV.cafe)), sayB(pick(P.lines));
  if (id === 'mott') return sayB(enrolled().some(k => row(k).unit >= 1 && !row(k).read) ? 'Your set reading is on the reserve shelf. Any desk with a lamp, and take your time.' : S.card && S.shelfDay !== today() ? 'The returns cart is full again, if you want the work-study hours.' : pick(P.lines));
  if (id === 'dean') { if (S.diploma && !S.walked && gradOn()) return graduate(); return sayB(S.diploma ? (S.walked ? 'One of ours. It suits you.' : 'Your diploma is earned. Come to the quad on the last day of the season, four o\'clock, and I shall say your name aloud.') : Object.keys(S.certs).length ? `${Object.keys(S.certs).length} certificate${Object.keys(S.certs).length === 1 ? '' : 's'} already. Three make a diploma, you know.` : pick(P.lines)); }
  const ses = current();
  if (PROFS.includes(id)) { const cs = COURSES.find(q => q.prof === id); if (ses && ses.cid === cs.id && !CL.running()) return sayB(now() < ses.T ? `We begin at ${hh((ses.T % DAY) / 60)}. ${ses.kind === 'practical' ? 'Find your station.' : 'Take a seat, any seat.'}` : `We have started. ${ses.kind === 'practical' ? 'To your station, quickly.' : 'Sit, sit.'}`); if (hasCert(cs.id)) return sayB(pick(P.pass.concat(P.lines))); if (row(cs.id)) { const td = todo(cs.id); return sayB(td.length > 1 ? 'Do not forget: ' + td[1].toLowerCase() + '.' : pick(P.lines)); } return sayB(pick(P.lines)); }
  if (id === 'saoirse' && !groupOn() && Math.random() < .5) return sayB('Study group, Tuesday and Thursday at five, in the Commons. I will save you the seat by Agnes.');
  if (S.diploma && Math.random() < .35) return sayB(pick(['A whole diploma. Can I touch it? No. Fair.', 'You make it look possible. That is annoying and helpful.', 'Speech! No? Next time.']));
  sayB(pick(P.lines));
}
async function graduate() { const S = st(); if (S.walked || !S.diploma) return; S.walked = 1; await say([{ who: CAST.dean.name, text: `${playerName()}.` }, { who: CAST.dean.name, text: CAST.dean.grad[0] }, { who: CAST.dean.name, text: 'Lux in portu. Go and be a light somewhere.' }]); moodlet('uni_graduate'); need('fun', 25); need('social', 20); inspire(20); for (const c of quad.list) if (!c.hidden) c.pose = 'cheer'; safe(() => G.audio.sfx('cheer')); G.emit('university:graduation'); toast('The quad cheers. Somebody throws a hat. It is yours now.', 'good', 5200); }

/* ---------- rooms ---------- */
function door(rid) { if (!isOpen()) return; if ((rid === UR.lecture || rid === UR.workshop) && wd() === 6) { toast('Locked on Sundays. The Commons and the Reading Room are open.', 'info', 3400); return; } G.go('int:' + rid); }
function arrived(sc, pv) { if (pv && pv.def && pv.def.showpiece === 'university') return; const S = st(), first = !S.visits; S.visits++; safe(() => G.places.discover(UV.place, true)); stamp('x:uni_visit'); G.emit('university:visit', first); if (first) toast('Stone flags, a brass grille, and somewhere a class laughing at a professor\'s joke.', 'good', 4400); if (!S.seen['v' + today()]) { S.seen['v' + today()] = 1; inspire(4, 'visit'); } }
/** called by the lecture theatre and the workshops ~every 1.5 s: who is in the room, what is on the screen */
function roomSync(sc, force) {
  if (!sc || !sc.uni) return; const ses = current(), live = CL.running(), rid = sc.roomId;
  if (rid === UR.lecture) { const mine = ses && roomOf(ses) === UR.lecture ? ses : null, ol = openLectureOn() && !st().open['d' + today()], key = live ? sc._uk : mine ? mine.cid + ':' + mine.unit + ':' + mine.T : ol ? 'open' + today() : examHall() ? 'exam' + today() + (hf() < 12 ? 'a' : 'p') : ''; if (key === sc._uk && !force) return; if (live && !force) return; sc._uk = key;
    if (!key) { sc.uni.clear(); const n = next(); sc.uni.board.show({ mode: 'idle', title: n && n.T !== undefined && roomOf(n) === UR.lecture ? `NEXT: ${C(n.cid).name}` : 'OPEN LECTURE WEDNESDAY 19:30', sub: n && n.T !== undefined && roomOf(n) === UR.lecture ? `${DAYN[wd(dayOf(n.T))]} ${hh((n.T % DAY) / 60)}` : 'FREE. ALL WELCOME.', lines: [examWeek() ? 'EXAM WEEK: QUIET PLEASE' : ''] }); return; }
    if (mine) { const cs = C(mine.cid); sc.uni.setProf(cs.prof); sc.uni.fill(mine.kind === 'present' ? 9 : 13 + (mine.T % 5)); if (!live) sc.uni.board.show({ mode: 'stage', title: cs.code + ' ' + cs.name, color: cs.color, lines: [UNITS[mine.unit].name, now() < mine.T ? 'STARTS ' + hh((mine.T % DAY) / 60) : 'IN PROGRESS', 'TAKE A SEAT'] }); }
    else if (ol) { const tk = openTalk(); sc.uni.setProf(tk.by); sc.uni.fill(18); if (!live) sc.uni.board.show({ mode: 'stage', title: 'OPEN LECTURE NIGHT', lines: [tk.title, CAST[tk.by].short, 'STARTS ' + hh(OPEN_LECTURE.hours[0]), 'TAKE ANY SEAT'] }); }
    else { sc.uni.setProf('pym', { x: sc.uni.lectern.x + 3, y: sc.uni.lectern.y, dir: 1 }); sc.uni.fill(16, false); for (const c of sc.uni.extras) if (!c.hidden) { c.pose = 'read'; c.noFidget = true; } sc.uni.board.show({ mode: 'paper', title: 'EXAM WEEK', lines: ['EXAM IN PROGRESS', 'SILENCE PLEASE', 'SIT AT THE BACK'] }); } }
  else if (rid === UR.workshop) { const mine = ses && ses.kind === 'practical' && roomOf(ses) === UR.workshop ? ses : null, key = mine ? mine.cid + ':' + mine.T + ':' + stationOf(mine) : ''; if (key === sc._uk && !force) return; if (live && !force) return; sc._uk = key; if (!mine) { if (!sc.uni.prof.hidden) sc.uni.clear(); return; } sc.uni.place(stationOf(mine), C(mine.cid).prof, 3); }
}
const examHall = () => examWeek() && wd() !== 6 && ((hf() >= 9.8 && hf() < 11) || (hf() >= 13.8 && hf() < 15)) && !current();
function leftRoom(sc) { if (CL.running()) CL.abort(); if (sc) sc._uk = null; }

/* ---------- the city: door, quad life, fair, pond class ---------- */
const quad = { list: [], t: 0 }, pond = { prof: null, mates: [], on: false }, fair = { on: null, hosts: [] }; let deanC = null, lastBan = '';
const QSPOTS = [[172.2, 43.2, 1, 'sit'], [173.2, 43.2, 1, 'read'], [179, 43.2, 1, 'sit'], [169, 43.2, 1, 'phone'], [170.4, 38.4, 1, 'read'], [169.2, 38.9, 0, 'sit'], [181.2, 40.2, 2, 'talk'], [180.4, 40.8, 0, 'talk'], [171.5, 49, 1, 'read'], [172.6, 49.6, 2, 'sit'], [180.2, 48.6, 3, null], [176.6, 36.4, 1, 'talk'], [175.6, 36.8, 0, 'talk'], [177.6, 47.4, 2, 'phone'], [174.6, 47.8, 0, null], [168.6, 45.6, 2, null]];
function ensure(w) { campus = buildCampus(w); if (!campus) return; campus.door.onUse = () => { if (isOpen()) return false; toast(`${NAME}: closed. ${hoursText()}`, 'info', 4800); return true; }; }
function wire(s) {
  ensure(s.world); if (!campus) return; cityScene = s; const w = s.world, door = campus.door;
  if (!s.interactables.some(it => it.poi === door)) s.interactables.push({ x: door.x, y: door.y, label: NAME, h: 1.2, range: 1.3, poi: door, use: () => { if (door.onUse() !== true) enterRoom(UR.hall, DOOR); } });
  s.interactables.push({ x: CAMPUS.notice.x, y: CAMPUS.notice.y - .9, label: 'Campus noticeboard', h: 1.8, hit: 12, range: 1.8, spot: { x: CAMPUS.notice.x, y: CAMPUS.notice.y }, use: () => noticeboard() });
  s.interactables.push({ x: CAMPUS.statue.x, y: CAMPUS.statue.y, label: 'The Founder', h: 2.6, hit: 12, range: 2.2, use: () => look('bust') });
  s.interactables.push({ x: 166.4, y: 46.6, label: 'The pond deck', h: .8, hit: 14, range: 1.8, spot: { x: CAMPUS.pond.x, y: CAMPUS.pond.y }, use: () => { const ses = current(); if (st().card || (ses && ses.kind === 'practical' && stationOf(ses) === 'pond')) useStation('pond', s, true); else { need('fun', 2); toast(pick(['Water boatmen row about under the deck. A dragonfly sits on the net handle.', 'Something orange moves in the weed. Kevin, probably.', 'The pond is forty metres across and the Rowing Club insists on calling it "the water".']), 'info', 4200); } } });
  /* students on the quad */
  const P = students(), mkc = (spec, x, y, dir, pose) => { const c = new Char(spec, x, y); c.dir = dir; c.pose = pose || null; if (pose === 'sit' || pose === 'read') c.poseOpts = pose === 'sit' ? { seated: true } : null; c.kind = 'customer'; c.hidden = true; s.ents.push(c); return c; };
  QSPOTS.forEach(([x, y, dir, pose], i) => { if (w.isBlocked(x, y)) return; const c = mkc(P[(i * 7 + 3) % P.length], x, y, dir, pose === 'sit' ? null : pose); c.roll = (i * .618) % 1; c.home = pose; quad.list.push(c); s.interactables.push({ ent: c, x, y, label: 'Student', h: 1.2, hit: 6, range: 1.7, visible: () => !c.hidden, use: () => { c._hold = 3; bubble(c, pick(examWeek() ? LINES.exam : fairOn() ? LINES.fair : LINES.student)); need('social', 1); } }); });
  STALL_AT.forEach(([x, y], i) => { const c = mkc(P[(i * 3 + 11) % P.length], x + 1.2, y + .12, 1, null); c.z = 0; fair.hosts.push(c); s.interactables.push({ x: x + 1.2, y: y + .8, label: CLUBS[i].name, h: 1.6, hit: 14, range: 2, spot: { x: x + 1.2, y: y + 2.1 }, visible: () => fair.on === true, use: () => { bubble(c, CLUBS[i].line, 3600); clubMenu(CLUBS[i].id); } }); });
  pond.prof = mkc(castSpec('adeyemi'), CAMPUS.pond.x - .2, CAMPUS.pond.y - 1.4, 1, null); pond.prof.uniId = 'adeyemi'; s.interactables.push({ ent: pond.prof, x: 0, y: 0, label: CAST.adeyemi.name, h: 1.3, hit: 8, range: 2, visible: () => !pond.prof.hidden, use: () => talk('adeyemi', pond.prof) });
  pond.mates = [[168.6, 47.5, 2], [168.2, 48.4, 2], [169, 45.4, 2]].map(([x, y, d], i) => { const id = CLASSMATES[i * 2], c = mkc(castSpec(id), x, y, d, 'work'); c.uniId = id; s.interactables.push({ ent: c, x, y, label: CAST[id].name, h: 1.2, hit: 6, range: 1.8, visible: () => !c.hidden, use: () => talk(id, c) }); return c; });
  deanC = mkc(castSpec('dean'), CAMPUS.door.x - .2, CAMPUS.door.y + 1.6, 1, null); deanC.uniId = 'dean'; s.interactables.push({ ent: deanC, x: 0, y: 0, label: CAST.dean.name, h: 1.3, hit: 8, range: 2.2, visible: () => !deanC.hidden, use: () => talk('dean', deanC) });
  citySync(true);
}
function noticeboard() { const tt = timetable(7).filter(r => r.T).slice(0, 3), ev = []; if (wd() === OPEN_LECTURE.weekday) ev.push(`Tonight 19:30, open lecture: "${openTalk().title}". Free.`); else ev.push(`Open lecture Wednesday 19:30: "${openTalk(today() + ((OPEN_LECTURE.weekday - wd() + 7) % 7)).title}".`);
  if (examWeek()) ev.push('EXAM WEEK. Sittings 10:00 and 14:00. Quiet on the quad, please.'); else ev.push(`Clubs fair: day ${FAIR.dom} of every season, here on the quad.`); ev.push('Study group: Tue and Thu, 17:00, the Commons. Ask for Saoirse.');
  say([{ who: 'Campus noticeboard', text: ev[0] }, { who: 'Campus noticeboard', text: ev[1] + ' ' + ev[2] }].concat(tt.length ? [{ who: 'Your classes', text: tt.map(r => `${DAYN[wd(dayOf(r.T))]} ${hh((r.T % DAY) / 60)}: ${r.title}`).join(' · ') }] : [{ who: 'Campus noticeboard', text: 'ENROLLING NOW: eight short courses, day or evening. See the Registrar in University Hall.' }])); }
function pondSync(force) { const ses = current(), on = !!(ses && ses.kind === 'practical' && stationOf(ses) === 'pond'); if (on === pond.on && !force) return; pond.on = on; if (pond.prof) pond.prof.hidden = !on; for (const c of pond.mates) c.hidden = !on; }
function citySync(force) {
  if (!campus || !cityScene) return; const w = cityScene.world, h = hf(), open = isOpen(), f = fairOn(), ex = examWeek(), gd = gradDay(), ol = wd() === OPEN_LECTURE.weekday && h >= 12 && h < 20.5;
  const ban = f || dom() === FAIR.dom ? 'fair' : gd ? 'grad' : ex ? 'exam' : 'term'; if (ban !== lastBan || force) { lastBan = ban; for (const b of campus.banners) setProp(b, { k: ban }); }
  if (fair.on !== f || force) { fair.on = f; for (const s of campus.stalls) showProp(w, s, f); for (const c of fair.hosts) c.hidden = !f; }
  if (campus.aboard) { const on = ol || f; if (on) setProp(campus.aboard, f ? { a: 'CLUBS', b: 'FAIR', c: 'TODAY' } : { a: 'OPEN', b: 'LECTURE', c: '19:30' }); showProp(w, campus.aboard, on); }
  const wetNow = safe(() => G.weather.isWet(), false), dens = !open || h < 8 || h > 20.5 ? 0 : wetNow ? .15 : ex ? .3 : f || gradOn() ? 1 : h >= 11 && h < 17 ? .7 : .45;
  for (const c of quad.list) { c.hidden = c.roll > dens; if (!c.hidden && gradOn()) { c.pose = null; } else if (!c.hidden && c.pose === 'cheer') c.pose = c.home === 'sit' ? null : c.home; }
  if (deanC) deanC.hidden = !gradOn(); pondSync(force);
}

/* ---------- jobs + xp perks ---------- */
const certSkill = id => C(id).jobSkill || C(id).skill;
function jobBonus(skill) { const S = st(); let b = 0; for (const id in S.certs) { const cs = C(id); if (!cs) continue; if (certSkill(id) === skill || cs.skill === skill) b = Math.max(b, S.certs[id].grade === 'Distinction' ? 2 : 1); } return b; }
const xpMult = skill => { const S = st(); for (const id in S.certs) { const cs = C(id); if (cs && (cs.skill === skill || cs.jobSkill === skill)) return TUNE.certXp; } return 1; };
function wrapXp() { const K = G.skills; if (!K || !K.addXp || K._uniWrap) return; const base = K.addXp; K.addXp = (k, n, ...r) => base(k, n > 0 ? n * xpMult(k) : n, ...r); K._uniWrap = true; }
function shiftBonus(sum) { if (!sum || !(sum.pay > 0)) return; const job = JOBS.find(j => j.id === sum.jobId); if (!job || !job.trains) return; if (!(jobBonus(job.trains.primary) || (job.trains.secondary && jobBonus(job.trains.secondary)))) return; const amt = Math.max(1, Math.round(sum.pay * TUNE.certPay)); safe(() => G.money.add(amt, 'Certificate bonus')); toast(`Certificate bonus: ${fmt(amt)} on top of your shift.`, 'money', 3600); }

/* ---------- guide arrow ---------- */
function navReg() {
  const N = G.navGoals; if (!N || !N.define || N._uni) return; N._uni = true;
  N.define('uni_class', 'commit', 71, ctx => {
    if (ctx.root !== UV.place) return null; if (CL.running()) return null;   /* no `done`: a finished objective mutes its resolver until you leave the building, and the next class is in the same building */
    let ses = current(); if (!ses) { const n = next(); if (n && n.T !== undefined && n.T - now() < 75 && (ctx.attached || inside())) ses = n; }
    if (ses) { const cs = C(ses.cid), at = now() < ses.T ? ` at ${hh((ses.T % DAY) / 60)}` : ''; if (ses.kind !== 'practical') return { room: UR.lecture, find: { label: /^Take a seat$/ }, label: `${cs.name}${at}: take a seat (tap one)`, short: 'the lecture theatre' };
      const k = stationOf(ses); if (k === 'pond') return { room: 'city', find: { x: CAMPUS.pond.x - 1, y: CAMPUS.pond.y, h: 1.4 }, label: `${cs.name}${at}: the pond deck behind the quad`, short: 'the pond deck', far: 'The pond deck: tap it' }; return { room: UR.workshop, find: { label: new RegExp('^' + STATIONS[k].label + '$') }, label: `${cs.name}${at}: ${STATIONS[k].label.toLowerCase()} (tap it)`, short: 'the Workshops' }; }
    if (openLectureOn() && !st().open['d' + today()] && (ctx.attached || inRoom(UR.lecture))) return { room: UR.lecture, find: { label: /^Take a seat$/ }, label: 'Open lecture: take any seat', short: 'the lecture theatre' };
    return null; });
  N.define('uni_work', 'default', 6, ctx => {
    if (ctx.root !== UV.place) return null; const en = enrolled(); if (!en.length) return officeOpen() ? { room: UR.hall, find: { label: /^Registrar$/ }, label: 'Enrol at the Registrar', short: 'the Registrar' } : null;
    const rd = en.find(k => row(k).unit >= 1 && !row(k).read); if (rd) return { room: UR.library, find: { label: /^Read at this desk$/ }, label: `Set reading for ${C(rd).name}: any free desk`, short: 'the Reading Room' };
    const pj = en.find(k => row(k).unit >= 2 && (row(k).proj === null || row(k).proj === undefined)); if (pj) { const k = C(pj).station === 'pond' ? 'lab' : C(pj).station; return { room: UR.workshop, find: { label: new RegExp('^' + STATIONS[k].label + '$') }, label: `Project for ${C(pj).name}: ${STATIONS[k].label.toLowerCase()}`, short: 'the Workshops' }; }
    if (groupOn()) return { room: UR.commons, find: { label: /^Join the study group$/ }, label: 'Study group: the seat by Agnes', short: 'the Commons' }; return null; });
}

/* ---------- opportunities ---------- */
function offers() { if (!G.opps || !G.opps.offer || G.busy) return; const S = st(), h = hf();
  if (wd() === OPEN_LECTURE.weekday && h >= 15 && h < 18.5 && !S.seen['of' + today()]) { S.seen['of' + today()] = 1; const tk = openTalk(); safe(() => G.opps.offer({ id: 'uni_open_' + today(), src: 'event', title: 'An open lecture tonight', text: `"${tk.title}". ${CAST[tk.by].name} explains it in half an hour at the university, 19:30. Free, and you leave knowing something odd.`, at: UV.place, do: { type: 'ev', ev: 'university:open' }, reward: { needs: { inspiration: 8, fun: 6 } }, until: 20.4 }, { quiet: false })); }
  if (!S.card && !S.seen.ofEnrol && today() >= 3 && h >= 10 && h < 16 && wd() < 5) { S.seen.ofEnrol = 1; safe(() => G.opps.offer({ id: 'uni_enrol', src: 'place', title: 'The university is enrolling', text: 'Eight short courses, day or evening, at the red-brick hall with the clock tower. Two lectures, one practical, a certificate. The Registrar has the forms.', at: UV.place, do: { type: 'ev', ev: 'university:enrol' }, reward: { needs: { inspiration: 6 } }, ttl: 48, once: true })); } }

/* ---------- init ---------- */
function setup() { st(); syncPlanner(); wrapXp(); navReg(); }
export function init() {
  S = G.defineState('uni', DEF); safe(() => ensure(getCity()));
  G.university = {
    isOpen, officeOpen, examWeek, fairOn, groupOn, clubNight, openLectureOn, busyNow, deanIn, hoursText, gradOn,
    hasCard: () => !!st().card, buyCard, courses: () => COURSES.map(q => ({ id: q.id, code: q.code, name: q.name, skill: q.skill, color: q.color, prof: CAST[q.prof].name, blurb: q.blurb, perk: q.perk, enrolled: !!row(q.id), cert: st().certs[q.id] || null, price: price(q.id), sections: q.sections.map(sectionText) })),
    enrolled, course: id => row(id), price, enrol, withdraw, setSection, registrar, ready, todo, mark: id => (row(id) ? finalMark(row(id)) : null), next, current, timetable, canSit, sit, stationOn, useStation, read, shelve, browse, joinGroup, joinClub, clubs: () => st().clubs.slice(), clubMenu, board, look, talk,
    certs: () => Object.assign({}, st().certs), hasCert, diploma: () => !!st().diploma, jobBonus, xpMult, transcript, door, arrived, roomSync, leftRoom, campus: () => campus, running: () => CL.running(), openTalk, graduate,
    stats: () => { const S = st(); return { card: S.card, visits: S.visits, enrolled: enrolled(), certs: Object.keys(S.certs).length, diploma: !!S.diploma, credit: S.credit, voucher: S.voucher, clubs: S.clubs.length, open: Object.keys(S.open).filter(k => k[0] !== 'd').length, work: S.work }; },
    debug: { /* tests: finish the current unit of a course without playing it */ pass(id, score = .8) { const c = row(id); if (!c) return false; if (c.unit === 0 || c.unit === 2) { c.part[0] += 2; c.part[1] += 2; c.unit++; } else if (c.unit === 1) { c.prac = score; c.unit++; } c.since = now(); c.miss = now(); syncPlanner(); return c.unit; }, work(id, score = .8) { const c = row(id); if (!c) return false; c.read = 1; c.readOk = 1; c.proj = score; syncPlanner(); return true; }, sync: () => { syncPlanner(); citySync(true); }, class: CL, sheet: () => curSheet(), want: () => { const s = curSheet(); return s ? s.want() : null; } },
  };
  G.on('load', () => { loading = true; CL.abort(); setTimeout(() => { loading = false; }, 0); for (const sc of G.sceneCache.values()) if (sc && sc.uni) { for (const q of (sc.uni.seats || []).concat(sc.uni.carrels || [])) if (q.taken === G.player) q.taken = null; sc._uk = null; if (sc.uni.board) sc.uni.board.show(null); } setup(); lastBan = ''; safe(() => citySync(true)); });
  G.on('ready', setup); G.on('game:start', setup);
  G.on('room:build', sc => { if (sc && sc.def && sc.def.showpiece === 'university' && !campus) safe(() => ensure(getCity())); });
  G.on('scene', (s, prev) => { if (CL.running() && !(s && s.def && s.def.showpiece === 'university') && !(s && s.id === 'city')) CL.abort(); if (!s || s.id !== 'city' || !s.world) return; if (!s._university) { s._university = true; try { wire(s); } catch (e) { console.warn('university', e); } } citySync(true);
    const p = G.player, B = campus && campus.hall && campus.hall.B; if (B && p.x > B[0] && p.x < B[3] && p.y > B[1] && p.y < B[4]) { p.x = CAMPUS.door.x; p.y = CAMPUS.door.y + .5; } });
  let acc = 0, lastChk = -9; G.on('minutes', () => { if (inside()) for (const id of enrolled()) { const c = row(id), a = c.appt !== null && c.appt !== undefined ? safe(() => G.planner.get(c.appt), null) : null; if (a && a.s < 3) { a.lv = 1; a.here = 1; } }   /* the planner only knows the hall as 'the place': inside any of our rooms you are there */
    if (now() - lastChk >= 2 || now() < lastChk) { lastChk = now(); checkMissed(); safe(() => citySync()); } ++acc; if (acc % 20 === 0) offers();
    if (inside() && !isOpen() && !G.busy && !G.modal && !G.cutscene && !CL.running()) { const sc = G.scene; if (sc._closing) return; sc._closing = true; toast('"Closing up!" Albie jingles his keys and walks you to the door.', 'info', 4200); exitRoom({ poi: DOOR }).then(() => { sc._closing = false; }, () => { sc._closing = false; }); } });
  G.on('day', () => { const S = st(); for (const k in S.seen) if (/^(tk|v|br|of)\w*\d+$/.test(k) && !k.endsWith(String(today()))) delete S.seen[k]; for (const k in S.open) if (k[0] === 'd' && k !== 'd' + today()) delete S.open[k]; syncPlanner(); });
  G.on('minigame:done', r => { if (!r || !r.skill) return; for (const id of enrolled()) { const cs = C(id); if (cs.skill === r.skill || cs.also === r.skill) row(id).practice = (row(id).practice || 0) + 10 + 15 * (r.score || 0); } });
  G.on('job:shift:end', shiftBonus);
  G.on('university:classstart', () => safe(() => { const wp = G.phone.waypoint && G.phone.waypoint(); if (wp && (wp.id === UV.place || wp.roomId === UV.place)) G.phone.setWaypoint(null); }));
  G.addSystem({ name: 'university', update(dt) { if (!cityScene || G.scene !== cityScene) return; const p = G.player; if (Math.abs(p.x - 176) > 34 || Math.abs(p.y - 42) > 34) return; for (const c of quad.list) { if (c.hidden) continue; c.t += dt; if (c._hold > 0) c._hold -= dt; } for (const c of fair.hosts.concat(pond.mates, pond.prof ? [pond.prof] : [], deanC ? [deanC] : [])) if (!c.hidden) { c.t += dt; if (c._hold > 0) c._hold -= dt; } } });
}
