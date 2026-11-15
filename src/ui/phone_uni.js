// Phone app: CAMPUS (app id 'campus'; released through the app store on your first visit to the university). Data: G.university (sim/university.js).
// Tabs: Courses (what you are taking: units, coursework chips, what to do next, Take me there; the prospectus of the other courses) · Timetable (this week's classes,
//   open lecture, study group, club night) · Record (certificates, grades, the diploma, clubs, open lectures heard).
// Deep links: G.phone.open('campus', { tab: 'courses' | 'time' | 'record', course: id }).
// The catalogue row in sim/apps.js was a "coming soon" teaser; it is switched on here at import time (lead: please make the row in apps.js official, see docs/reports/university.md).
import { G } from '../core/game.js';
import { el, btn, section, empty, card, safe, money } from './phone_util.js';
import { regDef } from './phone_store.js';
import { CATALOG } from '../sim/apps.js';
import { figCanvas } from './university_ui.js';
import { COURSE_BY_ID, UNITS, DAYN, hh, TUNE, CLUBS, UV } from '../data/university.js';
import { CAST, LECTURES, OPEN } from '../story/university.js';
export const order = 124;

{ const a = CATALOG.find(c => c.id === 'campus'); if (a && a.soon) { delete a.soon; Object.assign(a, { tagline: 'What is my next class?', size: '8 MB', rating: 4.6, iconIds: ['skill.logic', 'ui.book', 'ui.star'], release: { on: 'university:visit', text: 'your first visit to the university' },
  desc: 'Maple Bay University in your pocket: your courses and what is left to do in each, this week\'s timetable, your certificates. Enrol in person at the Registrar.', does: ['Courses, units and coursework', 'This week\'s timetable', 'Certificates and grades', 'Take me to my class'] }); } }

const U = () => G.university; let tab = 'courses';
const DAY = 1440, whenT = T => { const d = Math.floor(T / DAY), n = Math.floor(G.state.t / DAY), h = hh((T % DAY) / 60); return (d === n ? 'Today ' : d === n + 1 ? 'Tomorrow ' : DAYN[((d % 7) + 7) % 7] + ' ') + h; };
const go = () => { safe(() => G.phone.routeTo(UV.place)); };
function courseCard(id, ctx) {
  const u = U(), c = u.course(id), cs = COURSE_BY_ID[id], n = u.next(id), td = u.todo(id);
  return el('div.cu-card', null,
    el('div.cu-head', null, el('span.cu-code', { text: cs.code, style: { background: cs.color } }), el('b', { text: cs.name })),
    el('small', { text: `${CAST[cs.prof].name} · ${n && n.T !== undefined ? 'next class ' + whenT(n.T) : 'no class booked'}` }),
    el('div.cu-steps', null, UNITS.map((un, i) => el('i' + (i < c.unit ? '.on' : i === c.unit ? '.nx' : ''), { text: i === 3 ? 'Final' : un.name.replace('Lecture ', 'Lec ') }))),
    el('div.cu-work', null, el('i' + (c.read ? '.on' : ''), { text: 'Reading' }), el('i' + (c.proj !== null && c.proj !== undefined ? '.on' : ''), { text: 'Project' }), el('i' + ((c.practice || 0) >= TUNE.practiceXp ? '.on' : ''), { text: 'Practice' }), c.group ? el('i.on', { text: 'Revised' }) : null),
    td.map(t => el('small', { text: '• ' + t })),
    el('div.cu-btns', null, btn('Take me there', go, 'pri', 'ui.pin'), btn('Lecture notes', () => ctx.push({ title: cs.name, render: b => notes(b, id) }))));
}
function notes(b, id) { const c = U().course(id), L = LECTURES[id], seen = c ? (c.unit >= 3 ? 2 : c.unit >= 1 ? 1 : 0) : 2; if (!seen) { b.append(empty('ui.book', 'No notes yet', 'Your notes from each lecture appear here after you have sat it.')); return; }
  for (let i = 0; i < seen; i++) { b.append(section(L[i].title)); for (const bd of L[i].boards) b.append(card(figCanvas(bd.fig), el('b', { text: bd.h }), el('p', { text: bd.t, style: { lineHeight: '1.35', margin: '2px 0 0' } }))); } }
function courses(b, ctx) {
  const u = U(), en = u.enrolled();
  if (en.length) { b.append(section('My courses')); const l = el('div.cu-list'); en.forEach(id => l.append(courseCard(id, ctx))); b.append(l); }
  else b.append(empty('ui.book', u.hasCard() ? 'Nothing on the go' : 'Not enrolled yet', 'Enrol in person: the Registrar\'s window is in University Hall, on the right as you come in.', btn('Take me there', go, 'pri', 'ui.pin')));
  const rest = u.courses().filter(c => !c.enrolled); b.append(section('Prospectus', el('small', { text: `${money(TUNE.tuition)} a course` })));
  const l = el('div.cu-list'); for (const c of rest) l.append(el('div.cu-card', null, el('div.cu-head', null, el('span.cu-code', { text: c.code, style: { background: c.color } }), el('b', { text: c.name }), c.cert ? el('span.cu-grade', { text: c.cert.grade }) : null), el('small', { text: c.blurb }), el('small', { text: `${c.prof} · ${c.sections.join(' or ')}` }), el('small', { text: 'You get: ' + c.perk }))); b.append(l);
}
function time(b) {
  const u = U(), tt = u.timetable(7); b.append(section('This week'));
  if (!tt.length) b.append(empty('ui.calendar', 'Nothing booked', 'Classes appear here, and on My Day, when you enrol.'));
  const l = el('div.ph-card'); for (const r of tt) l.append(el('div.cu-row', null, el('i', { text: r.T ? whenT(r.T).replace('Tomorrow', 'Tmrw') : 'Soon' }), el('div', null, el('b', { text: r.title }), el('div', { text: r.where })))); if (tt.length) b.append(l);
  b.append(section('Every week'), card(el('div.cu-row', null, el('i', { text: 'Tue Thu' }), el('div', null, el('b', { text: 'Study group, 17:00' }), el('div', { text: 'The Commons. Worth marks on your final.' }))), el('div.cu-row', null, el('i', { text: 'Wed' }), el('div', null, el('b', { text: 'Open lecture, 19:30' }), el('div', { text: 'Free. This week: ' + u.openTalk().title }))), el('div.cu-row', null, el('i', { text: 'Thu' }), el('div', null, el('b', { text: 'Club night, 19:30' }), el('div', { text: 'The Commons' })))),
    el('p.ph-note', { text: u.hoursText(), style: { margin: '8px 10px', lineHeight: '1.35' } }), btn('Take me there', go, 'pri wide', 'ui.pin'));
}
function record(b) {
  const u = U(), cs = u.certs(), ids = Object.keys(cs), s = u.stats();
  b.append(section('Certificates', el('small', { text: `${ids.length} of 8` })));
  if (!ids.length) b.append(empty('ui.star', 'A clean sheet', 'Pass a course and its certificate appears here. Three make the Diploma.'));
  else { const l = el('div.cu-list'); for (const id of ids) { const c = COURSE_BY_ID[id]; l.append(el('div.cu-card', null, el('div.cu-head', null, el('span.cu-code', { text: c.code, style: { background: c.color } }), el('b', { text: c.name }), el('span.cu-grade', { text: `${cs[id].grade} ${cs[id].mark}%` })), el('small', { text: c.perk }))); } b.append(l); }
  b.append(section('Diploma'), card(el('b', { text: u.diploma() ? 'Diploma of Maple Bay University' : `${Math.max(0, 3 - ids.length)} more certificate${3 - ids.length === 1 ? '' : 's'} to the Diploma` }), el('small', { text: u.diploma() ? 'Lux in portu. Graduation is on the quad, the last day of every season at 16:00.' : 'Any three courses. The Dean reads your name from the hall steps.' })));
  b.append(section('Campus life'), card(el('small', { text: `Clubs: ${u.clubs().map(k => CLUBS.find(c => c.id === k).name).join(', ') || 'none yet (clubs board in the Commons)'}` }), el('small', { text: `Open lectures heard: ${s.open} of ${OPEN.length}` }), el('small', { text: s.credit ? `Work-study credit: ${money(s.credit)}` : 'Work-study: shelve for Mr. Mott in the Reading Room for credit' }), s.voucher ? el('small', { text: "Dean's Scholarship: your next course is free" }) : null));
}
function render(b, ctx) {
  if (!U()) { b.append(empty('ui.book', 'Campus', 'The university is not open yet.')); return; }
  if (ctx.arg && ctx.arg.tab && !ctx._used) { tab = ctx.arg.tab; ctx._used = 1; }
  b.append(el('div.cu-tabs', null, [['courses', 'Courses'], ['time', 'Timetable'], ['record', 'Record']].map(([k, n]) => el('button' + (tab === k ? '.on' : ''), { text: n, onclick: () => { tab = k; ctx.refresh(); } }))));
  if (tab === 'time') time(b, ctx); else if (tab === 'record') record(b, ctx); else courses(b, ctx);
}
export function init() {
  if (!G.phone || !G.phone.registerApp) return;
  G.phone.registerApp(Object.assign(regDef('campus'), { render }));
}
