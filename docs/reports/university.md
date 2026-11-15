# Maple Bay University (showpiece S10, Wave D) — worker report, condensed

Files (all new): `src/sim/university.js` (G.university, order 56.4), `src/sim/_uni_class.js` (class engine), `src/sim/_uni_city.js` (campus in the city), `src/data/university.js`,
`src/story/university.js` (cast, lectures, readings, exams, lines), `src/scenes/rooms/university.js` (five rooms), `src/ui/university_ui.js` + `src/ui/university.css` (class sheet),
`src/ui/phone_uni.js` (Campus app), art `src/art/showpiece/university.js` + `university_ext.js` + `university_icons.js` + `_uni_lib.js` + `_uni_figs.js`. No existing file was edited.

## Where it is (read this first: the brief's premise was wrong)
`bld.arts.unihall` existed as art but was NOT in the Arts Quarter: the generator only uses it as "Maplewood School" (308, 206). The Campus Green block (x 210-230, y 62-82) is filled by the
Public Library and a 7-unit lawn. So the campus is an ADD on unused wild land at the top of Riverside Drive, on Campus Drive beside Symphony Hall, placed at runtime by `_uni_city.js` (no world file touched):
- University Hall `bld.arts.unihall` (default sign "MAPLE BAY UNIVERSITY") at x 167-185, y 24-33; door poi `door:university` (176, 33.75), "200 Campus Dr", place id `university`.
- The Quad x 166-184, y 34-54: iron gate with the name board on Campus Drive, low wall + railings, central walk, cross walk, the Founder's statue, yew beds, flower beds, noticeboard, four banners
  (term / exam week / clubs fair / graduation), benches, lamps, bike rack, six clubs-fair stalls (hidden except on fair day), an A-board, the pond deck (164.5, 45.5) on the existing river-head pond.
- What changed in the city: + 1 building, + ~40 props, + 2 pois (`door:university`, landmark `lm:university` "The Quad"), 2 walkways (ambient pedestrians now stroll the quad), ground tiles in the quad
  set to park / plaza, and the wild trees / flowers inside x 164-186, y 22-55 removed (`campus().removed`). Nothing existing moved. The id `unihall` is not a lobby class and public_places skips it, so lobby / pub indices are unchanged.
- The existing Campus Green and Public Library are untouched and not used (owner decision 1).

## Rooms (doormat exits with `to`; `tools/navcheck.mjs --only graph` reports no university problems)
`university` Great Hall 24x15 (Registrar + Bursar counter, Founder's bust, crest, portraits, trophy case, gown rail, timetable + exam boards, porter, Dean at office hours);
`university:lecture` Ashby Lecture Theatre 18x13 (dais, lectern, 48 bench seats, a LIVE lecture screen on the wall: one canvas showing the board title, diagram and key words);
`university:commons` 22x14 (The Quill & Kettle cafe = venue `university:cafe`, fireplace, study-group table, clubs board, restrooms); `university:library` Reading Room 16x12 (8 green-lamp carrels,
shelves, librarian, returns cart); `university:workshop` Workshops & Studios 26x14 (easels + still life, teaching kitchen, lab benches, computers, piano, writing table, seminar podium, repair benches).
Hours Mon-Sat 08:00-21:30, Sun 10:00-18:00 (Commons + Reading Room only). Registrar weekdays 08:30-17:30, Sat 09:00-14:00. Closing walks you out.

## Courses (8), costs, schedule
Student card $10 once; $80 a course; max 2 at once. Help: Ashby Bursary (balance under $300 = half fees), work-study (shelve the returns cart once a day, a sort mini-game, up to $12 credit),
Dean's Scholarship (a Distinction makes the next course free). Refused with a clear line when you cannot pay.
| code | course | skill (+ side) | professor | day / evening section | practical (kit game) | final |
|---|---|---|---|---|---|---|
| CUL 101 | Kitchen Science | cooking | Prof. Odette Baptiste | Mon+Thu 10:00 / 18:30 | stove: timing | paper |
| ART 110 | Drawing & Colour | painting (creativity) | Prof. Ingrid Vandermeer | Tue+Fri 10:00 / 18:30 | easel: trace | critique (present) |
| LIT 120 | Creative Writing | writing (creativity) | Prof. Emeka Lowell | Wed+Sat 10:00 / 18:30 | writing table: quickdraw | reading (present) |
| CSC 101 | Computing for Humans | tech (logic; counts as Logic at work) | Dr. Anjali Varma | Mon+Thu 14:00 / Tue+Fri 16:30 | computer: memory | paper |
| MUS 105 | Music Fundamentals | music | Maestro Leopold Ekström | Tue+Fri 14:00 / Wed+Sat 16:30 | piano: rhythm | recital (present) |
| RHE 130 | Public Speaking | charisma (comedy) | Prof. Gloria Santangelo | Wed+Sat 14:00 / Mon+Thu 16:30 | podium: timing ring | talk (present) |
| BIO 140 | Bay Ecology | gardening (logic) | Dr. Nkem Adeyemi | Tue+Fri 11:30 / Wed+Sat 11:30 | pond deck on the quad: sort (lab tank when wet / winter) | paper |
| ENG 150 | Home Repair | handiness | Mr. Bernie Kowal | Mon+Thu 11:30 / Tue+Fri 16:30 | bench: balance | paper |
Units in order: Lecture 1 -> Practical -> Lecture 2 -> Final. The class you turn up to is always YOUR next unit, so a missed class costs days, never the course (a note from the professor, the Planner moves on).
A lecture = three boards (heading, 2-3 sentences, a diagram on the wall screen and in the sheet) + two questions from the professor; 50 game minutes. A practical = briefing, the kit mini-game at your
station with classmates beside you, verdict. Coursework: the set reading (any Reading Room desk: notes + one check question; after Lecture 1), a project (the kit game at your station, any time; after
the Practical), practice (the skill's own mini-games anywhere; optional). The final needs reading + project. Paper = 8 questions drawn from the lectures, the reading and two extras, no feedback
until the end. Presentation = walk to the dais, the kit game in front of the class, applause. Mark = participation 20 + practical 20 + coursework 20 + final 40; pass 50 (and 50% in the final),
Merit 70, Distinction 85. A failed final is resat at the next class (first resit free, then $15). Exam week (days 12-14 of each season): finals also at 10:00 and 14:00 daily, banners, quiet lines, an exam in progress in the theatre.
Certificate: the item `uni_cert_<id>`, +10% xp in that skill for good (G.skills.addXp is wrapped), +10% pay on shifts of jobs that train that skill (hook-free, on `job:shift:end`),
+1 level (+2 with Distinction) toward job skill requirements (NEEDS the jobs.js line below), Kitchen Science also teaches goulash / gumbo / pho. Three certificates = `uni_diploma`, flag `uni_grad`,
graduation with the Dean on the hall steps on day 14 of the season at 16:00.

## Campus life
Study group (Saoirse, Mateo, Agnes, Bao) in the Commons Tue + Thu 17:00-18:30 and daily in exam week: three flash-card questions, +6 marks on that course's final once, social, moodlet.
Open Lecture Night Wed 19:30 (free, six rotating talks, feeds Inspiration +12; an Opportunity is offered that afternoon). Clubs fair on the quad on day 2 of each season 11-16 (six stalls; join up to two clubs,
also from the Commons board); Club Night Thu 19:30. Classes, reading, projects and first looks feed Inspiration through G.needsExtra.inspire.
Planner: one appointment per course (always the next class, kind personal, place `university`), so the 30-minute reminder and the "Time to leave" alert work; missed classes re-book themselves.
Guide arrow: resolver `uni_class` (commit, 71): street -> door -> the right room -> a seat / your station / the pond deck; `uni_work` (default): Registrar, a reading desk, your project station, the study group.
Phone app Campus (`campus`): Courses (units, coursework chips, to-do, Take me there, lecture notes with the diagrams), Timetable, Record. Installed when you enrol; released on the first visit.
14 calendar events (uni_open_lecture, uni_club_night, uni_clubs_fair_<season>, uni_exam_week_<season>, uni_graduation_<season>); guide `place:university` + 6 stamps x:uni_*; registerInfo entry.

## Cast (20 named, each with a look and lines)
8 professors (above), Mrs. Hester Pym (Registrar), Dean Cordelia Ashby, Mr. Cyrus Mott (Librarian), Juno (cafe), Albie (porter), classmates Saoirse Flynn, Mateo Ruiz, Deshawn Pruitt, Mei-Lin Zhou,
Agnes Thackeray, Bao Tran, Tunde Bello. They are room characters (not story cast): rapport is counted in `G.state.uni.rel`, lines change with certificates / the diploma.

## Counts
Art: 19 furniture `furn.uni.*`, 10 props `prop.uni.*`, 18 item icons, 18 board diagrams, the crest. Reused: ~45 existing furniture ids. Text: 16 lectures (48 boards, 32 questions), 8 readings (24 notes, 24 questions),
8 practical briefs, 8 finals (8 extra questions), 6 open lectures, ~110 cast lines, ~45 campus lines, 6 portrait / look texts. 18 items, 4 moodlets, 2 venues.

## Lead: hooks wanted
1. `src/sim/jobs.js` line 37, so a certificate counts toward hiring, promotion and the skill part of pay:
   `const skill = k => (G.skills ? G.skills.level(k) : 1) + (G.university ? G.university.jobBonus(k) : 0), today = ...` (rest of the line unchanged).
2. `src/sim/apps.js`: the `campus` row is a `soon` teaser; `phone_uni.js` switches it on at import time. To make it official replace the row with:
   `{ id: 'campus', name: 'Campus', cat: 'life', tagline: 'What is my next class?', size: '8 MB', rating: 4.6, iconIds: ['skill.logic', 'ui.book', 'ui.star'], color: '#3b5bdb', release: { on: 'university:visit', text: 'your first visit to the university' }, desc: 'Maple Bay University in your pocket: your courses and what is left to do in each, this week\'s timetable, your certificates. Enrol in person at the Registrar.', does: ['Courses, units and coursework', 'This week\'s timetable', 'Certificates and grades', 'Take me to my class'] },`
3. Optional, `src/sim/planner.js` `atPlace`: sub-rooms of a building do not count as being at the place. I work round it (inside any university room the class appointment is marked present), other showpieces may want it.
4. Optional: an INTERFACES.md row for `G.university`.

## API, events, state, tuning
`G.university` (full list in the header of sim/university.js): isOpen, officeOpen, examWeek, fairOn, groupOn, clubNight, openLectureOn, hasCard, buyCard, courses, enrolled, course, price, enrol(id, sec), withdraw, setSection,
registrar, ready, todo, mark, next, current, timetable, sit, useStation, read, shelve, joinGroup, joinClub, clubs, certs, hasCert, diploma, jobBonus(skill), xpMult(skill), transcript, stats, campus, debug { pass, work, sync, want }.
Events `university:visit | card | enrol | withdraw | classstart | class | missed | reading | project | final | certificate | diploma | graduation | open | group | club | clubnight | shelved`.
State `G.state.uni` (old saves get the defaults). Tuning: `TUNE` in data/university.js (card 10, tuition 80, bursaryUnder 300, maxCourses 2, classMin 50, doors 20, late 20, pass 50 / 70 / 85, resit 15, weights, xp, certXp 1.1, certPay 0.1, workStudy 12, groupBonus 6).

## Verified by running (headless Chromium 390x844, dev build; scripts in the scratchpad `uni/`)
REAL pointer input (taps on the world and on the UI): city door -> Great Hall -> Registrar menu -> enrol in Kitchen Science (day section) -> lecture theatre -> take a seat -> a whole lecture answered to the result;
the reading at a carrel; the kitchen practical (mini-game played with the keyboard) ; the project at the stove; the final paper to a certificate (recipes learned, item in the bag, +1 job bonus, 1.1 xp);
a presentation final (walk to the dais, game, verdict) which failed and stayed resittable; the pond field class on the quad (sort game, real taps on the bins); study group; open lecture; shelving; cafe order window; club night menu.
By API / eval: bursary price, refusal with too little money, closed door at night, a missed class (count, note, Planner re-booked), fail then resit to a Distinction (scholarship voucher), clubs fair (6 stalls, banner,
A-board; the stall menu opened by `useInteractable`), graduation (Dean on the steps, moodlet), save + load in the middle of a lecture (class closed cleanly, zoom + camera restored, unit kept, can rejoin),
an old save without the slice, 16 days simulated with two courses never attended (Planner always held exactly two class entries, no errors), arrow from the street with a waypoint ("take a seat"), 60 fps in the
lecture theatre with a class, the Commons and the quad. `node src/data/validate.mjs` passes; dev and dist builds load with zero page errors in every run above. ~45 screenshots looked at.
NOT verified: touch events (mouse only); sound (none added); the jobs bonus at hiring (needs hook 1); the +10% shift pay on a real shift; rejoining after a load inside the window (code path only; the test waited too long);
club night to its end; the Opportunity rows being accepted; winter / rain versions of the pond class in play (the switch to the lab tank is code only); the exam-week ambient sitting in the theatre (not looked at).

## Known gaps
- In the city the arrow leads to the pond class only when a waypoint to the university is set (commit resolvers need "inside the building"); indoors it appears by itself.
- A "Starting now" Planner banner can still show when you are already standing at the pond deck.
- Classmates fade in at their seats instead of walking in; the professor does not walk. Students on the quad are static (the city's own pedestrians do walk through).
- From the south-east, Symphony Hall hides the east third of the quad (it fades when you stand behind it). Paths and activity are kept west of it.
- The student card gives no cafe discount (no shop hook). Certificates / diploma are bag keepsakes, not wall items.
- The dev-only `debug` helpers are left in G.university. The class camera uses one zoom step back in the lecture theatre only.

## Owner decisions
1. Site: the university stands on new land at the top of Riverside Drive, not on the Campus Green by the library. OK, or should the library block be tied in (e.g. reading at the Public Library too)?
2. Names: Founder Cornelius Ashby (1891), motto "Lux in portu", school colours navy and gold, the clock that runs two minutes fast, Kevin the goldfish.
3. Prices ($80 a course, $10 card) and pace (a course takes about two weeks at two classes a week; four classes in total).
