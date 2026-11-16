// The four JOB ROOMS (docs/story/JOBS.md; engine: sim/jobstory.js). Each is a new room INSIDE a building that already stands on the map; nothing in the city is
// moved, redrawn or removed. What is added to the city (at init, in memory): four door pois and two small door props set against a wall.
//   fire_station      Maple Bay Fire Station No. 2     bld.civic.firestation (274, 252): the red personnel door left of the bay doors      door:fire_station
//   school_classroom  Maplewood Elementary, Room 4     the school (308, 206): its front door                                               door:school_classroom
//   gazette_newsroom  The Maple Bay Gazette            the OSTRANDER block (222, 241): its own street door beside the lobby entrance       door:gazette_newsroom
//   radio_studio      Bay Radio 98.6, Studio B         the MBTV Broadcast House (110, 12): the studio door round the side                 door:radio_studio
// Every fixture a job's work loop names carries that station tag (fire_engine, class_board, news_morgue, radio_board ...), so sim/_jobstory_stations.js maps
// each station to its own tag. The job's people who are not cast.js characters stand in the room as room characters (`c.jobFig = speaker id`): the job-story
// engine uses them as the speaking figures on a shift, and off shift a tap gives a line (G.jobStory.greet). Visitors: HOURS below; small things to do per room.
//
// JOB_ROOMS  { [roomId]: { name, job, door: { x, y, dir }, hours(n) -> bool, closed: text } }      jobRoomOpen(roomId) -> bool
// scene.job = { people: { [speakerId]: Char }, kids: [Char], sync() }
import { G } from '../../core/game.js';
import { GT } from '../../engine/world.js';
import { rng } from '../../engine/raster.js';
import { Char, charArt } from '../../core/char.js';
import { defineRoom, registerFixture, ROOMS } from '../interior.js';
import { toast, bubble } from '../../ui/kit.js';
import { registerInfo } from './unique_rooms.js';
import { getCity } from '../../world/_city.js';
import { who } from '../../sim/_jobstory_cast.js';

const O = 1, safe = (f, d) => { try { const v = f(); return v === undefined || v === null ? d : v; } catch (e) { return d; } };
const pick = a => a[Math.floor(Math.random() * a.length)];
const wk = n => n.weekday < 5;
export const JOB_ROOMS = {
  fire_station: { name: 'Maple Bay Fire Station No. 2', job: 'firefighter', building: /civic\.firestation/, door: { x: 275.2, y: 260.75, dir: 1 }, district: 'maplewood', hours: n => n.hf >= 8 && n.hf < 20, closed: 'The bay doors are down for the night. The watch is in; visitors are welcome from eight till eight.' },
  school_classroom: { name: 'Maplewood Elementary', job: 'teacher', building: /arts\.unihall/, at: [308, 206], door: { x: 317, y: 215.75, dir: 1 }, district: 'maplewood', hours: n => wk(n) && n.hf >= 7.5 && n.hf < 17, closed: 'Maplewood Elementary: the door is locked. School days, half past seven till five.' },
  gazette_newsroom: { name: 'The Maple Bay Gazette', job: 'reporter', building: /office\.brutalist/, at: [222, 241], door: { x: 230.8, y: 243, dir: 0 }, side: { x: 230, y: 242.2, p: { name: 'NEWS', c: '#3f6a5a', bg: '#22202a' } }, district: 'downtown', hours: n => n.weekday < 6 && n.hf >= 9 && n.hf < 19, closed: 'The Gazette: the front counter is shut. Monday to Saturday, nine till seven.' },
  radio_studio: { name: 'Bay Radio 98.6', job: 'radio_dj', building: /civic\.radiotower/, door: { x: 116.8, y: 14.2, dir: 0 }, side: { x: 116, y: 13.4, p: { name: '98.6', c: '#8a3848' } }, district: 'hillcrest', hours: n => n.hf >= 16 && n.hf < 21, closed: 'Bay Radio 98.6: a red light over the door. Visitors may sit in on the evening show, four till nine.' },
};
export const jobRoomOpen = id => { const r = JOB_ROOMS[id]; return !!r && r.hours(G.now()); };
const onShiftAs = job => !!safe(() => G.jobs.onShift() && G.jobs.current().id === job, false);
const worksAs = job => safe(() => G.jobs.current().id === job, false);
const add = (k, v) => safe(() => G.needs.add(k, v));
const said = {};
/** a small thing a visitor can do at a fixture: a line or two, a little of a need. Not shown while that fixture is today's work (the shift's own marker is). */
function look(tag, label, lines, fx, room) {
  registerFixture(tag, (f, sc) => (sc.def && sc.def.jobRoom && (!room || sc.def.id === room) ? { label: typeof label === 'function' ? label() : label, use: () => {
    const k = sc.def.id + tag, L = typeof lines === 'function' ? lines(sc) : lines, i = said[k] = ((said[k] === undefined ? -1 : said[k]) + 1) % L.length;
    toast(L[i], 'info', 2600 + L[i].length * 40); if (fx) for (const n in fx) add(n, fx[n]); G.emit('jobroom:look', sc.def.id, tag);
  } } : null));
}
/** a short sit-down (the existing activity machinery): label, minutes, anim, effects per minute */
function sit(tag, label, minutes, anim, fx, done, room) {
  registerFixture(tag, (f, sc) => (sc.def && sc.def.jobRoom && (!room || sc.def.id === room) ? { label, use: () => { if (G.busy) return; const s = f.seats && f.seats[0];
    G.startActivity({ label, anim, minutes, rate: minutes / 5, at: s ? { x: s.x, y: s.y, z: s.z || 0, dir: s.dir } : undefined, tick: m => { for (const n in fx) add(n, fx[n] * m); }, done: () => { if (done) toast(typeof done === 'function' ? done() : done, 'good', 3600); } }); } } : null));
}

/* ---------- people ---------- */
const KIDS = []; function kidSpec(i) { if (!KIDS[i]) { const s = charArt().randomSpec(rng(7001 + i * 37), { age: 'kid', season: 1 }); s.outfit = null; s.bag = null; s.hat = null; KIDS[i] = s; } return KIDS[i]; }
/** a named person of the job's cast in the room. o: { seat: {x,y,z,dir} room coords, when(n) -> bool, shift: { x, y, dir } where they stand while the PLAYER works (their seat may be the player's station) } */
function person(sc, id, x, y, dir, o = {}) {
  const w = who(id), spec = w.spec || kidSpec(3), c = new Char(spec, x + O, y + O); c.dir = dir; c.jobFig = id; c.named = true; c.label = w.short || w.name; c.kind = 'staff'; c.t = Math.random() * 4; c._home = { x: x + O, y: y + O, dir, seat: o.seat || null }; c._o = o;
  place(sc, c, false); sc.ents.push(c);
  c.update = dt => { c.t += dt; c.moving = false; if (c._hold > 0) { c._hold -= dt; return; } if (!c.poseOpts && Math.floor(c.t) % 6 === 0 && Math.hypot(G.player.x - c.x, G.player.y - c.y) < 3.5) c.faceTo(G.player.x, G.player.y); else if (!c.poseOpts && Math.floor(c.t) % 6 === 3) c.dir = c._dir; };
  sc.interactables.push({ ent: c, x: c.x, y: c.y, h: 1.4, hit: 10, range: 2.2, label: 'Talk to ' + c.label, npcJob: id, visible: () => !c.hidden, use: () => { c._hold = 4; if (!c.poseOpts) c.faceTo(G.player.x, G.player.y); const it = sc.interactables.find(q => q.ent === c); if (it) { it.x = c.x; it.y = c.y; }
    if (G.jobStory && G.jobStory.greet) G.jobStory.greet(id, c, sc.def.job); else bubble(c, 'Hello.', 2400); } });
  (sc.job.people || (sc.job.people = {}))[id] = c; return c;
}
function place(sc, c, working) {
  const h = c._home, o = c._o || {}, sh = working && o.shift;
  if (sh) { c.x = sh.x + O; c.y = sh.y + O; c.dir = c._dir = sh.dir; c.z = 0; c.zoff = 0; c.poseOpts = null; c.pose = sh.anim || null; }
  else if (h.seat) { c.x = h.seat.x + O; c.y = h.seat.y + O; c.zoff = h.seat.z || 0; c.z = c.zoff; c.dir = c._dir = h.seat.dir; c.poseOpts = c.zoff < .15 ? { seated: true, floor: 1 } /* on the carpet: cross-legged */ : { seated: true }; c.pose = 'sit'; }
  else { c.x = h.x; c.y = h.y; c.dir = c._dir = h.dir; c.z = 0; c.zoff = 0; c.poseOpts = null; c.pose = o.anim || null; }
  const it = sc.interactables.find(q => q.ent === c); if (it) { it.x = c.x; it.y = c.y; }
}
function kid(sc, i, seat, lines) {
  const c = new Char(kidSpec(i), seat.x, seat.y); c.zoff = seat.z || 0; c.z = c.zoff; c.dir = seat.dir === undefined ? 1 : seat.dir; c.poseOpts = c.zoff < .15 ? { seated: true, floor: 1 } /* on the carpet: cross-legged */ : { seated: true }; c.pose = 'sit'; c.kind = 'customer'; c.named = true; c.t = Math.random() * 5; c.label = 'A second-grader';
  c.update = dt => { c.t += dt; c.moving = false; if (Math.floor(c.t * .7) % 9 === i % 9) c.pose = pick(['sit', 'sit', 'read', 'talk']); };
  sc.ents.push(c); sc.job.kids.push(c);
  sc.interactables.push({ ent: c, x: c.x, y: c.y, h: 1, hit: 8, range: 2, label: c.label, visible: () => !c.hidden, use: () => bubble(c, pick(lines), 2800) });
  return c;
}
/** presence: who is in the room now. The job's people are always in when the player is working there. */
function ticker(sc, job, fn) {
  let acc = 9, last = null; const u = sc.update;
  sc.job.sync = () => { const n = G.now(), working = onShiftAs(job), key = working + ':' + Math.floor(n.hf * 2) + ':' + n.weekday; if (key === last) return; last = key; for (const id in sc.job.people || {}) { const c = sc.job.people[id], o = c._o || {}; c.hidden = !(working || !o.when || o.when(n)); place(sc, c, working); } if (fn) fn(n, working); };
  sc.update = (dt, gm) => { u(dt, gm); acc += dt; if (acc > 1.5) { acc = 0; sc.job.sync(); } };
  const en = sc.onEnter; sc.onEnter = (o, p) => { en(o, p); last = null; sc.job.sync(); };
}
const light = (sc, x, y, z, r, c) => sc.world.lights.push({ x: x + O, y: y + O, z, r, c: c || '#ffe2a8' });
const setP = (o, q) => { if (!o) return; for (const k in q) if (o.p[k] !== q[k]) { o.p = Object.assign({}, o.p, q); o._key = null; return; } };
const obOf = (sc, id) => sc.world.objs.find(o => o.id === id);
const full = id => (/^(generic|home|office|lobby)\./.test(id) ? 'furn.' + id : 'furn.job.' + id);
const H = (items, id, x, y, p, o) => { const it = Object.assign({ id: full(id), x, y, p: p || {} }, o); items.push(it); return it; };
const Wl = (items, id, wall, at, p, o) => { const it = Object.assign({ id: full(id), wall, at, p: p || {} }, o); items.push(it); return it; };

/* =================================================================== Fire Station No. 2 */
(function () {
  const it = [], h = (...a) => H(it, ...a), w = (...a) => Wl(it, ...a);
  /* the bay */
  h('fire.gear', .5, 0, { w: 4 }); h('fire.pole', 4.9, .3); w('fire.bell', 'y', 6.2, {}, { mount: 1.2 }); h('fire.hoses', 7.8, 0, { w: 2.2 }); w('fire.badge', 'y', 6.1, {}, { mount: 2.0 });
  w('fire.tools', 'x', 1.0, {}); w('fire.board', 'x', 3.9, {}); w('fire.map', 'x', 7.2, {}); w('generic.extinguisher', 'x', 9.6, {}, { mount: 0 });
  h('fire.baymark', 1.2, 3.6, { w: 7.8, d: 3.4 }); h('fire.engine', 2.2, 4.2);
  h('fire.watch', 9.5, 1.7); h('fire.sprinkler', 9.6, 5.3);
  h('generic.lockers', .3, 8.9, { w: 2, c: '#8a3a34' }, { flip: true });
  /* the watch room */
  h('fire.kitchen', 11.5, 0, { w: 3.6 }); h('home.kitchen.fridge', 15.3, .05, { tier: 1 }); w('generic.clock', 'y', 15.4, {}, { mount: 0 });
  h('fire.table', 11.9, 2.5); h('generic.sofa', 12.2, 5.6, { c: '#3f6a5a', w: 2.4 }); h('home.coffeetable', 12.7, 6.8, {}); h('home.bookshelf', 15.6, 4.2, { tier: 1 }, { flip: true });
  h('fire.bunk', 11.8, 8.6); h('fire.bunk', 14.4, 8.6, { c: '#3f6a5a' }); h('generic.plant', 16.2, 1.4, { kind: 'snake' }); h('generic.rug', 12.0, 6.6, { w: 3, d: 1.4, c: '#8a3a34' });
  defineRoom({ id: 'fire_station', name: JOB_ROOMS.fire_station.name, w: 17, d: 11, zoom: 0, jobRoom: true, job: 'firefighter', noCrowd: true, music: 'quiet', floor: GT.f_concrete, floors: [{ x0: 11, y0: 0, x1: 17, y1: 11, floor: GT.f_wood }, { x0: 11, y0: 0, x1: 17, y1: 2.2, floor: GT.f_tile }],
    bg: '#17161f', edge: '#4a3430', wall: { color: '#e4d8c0', pattern: 'brick', trim: '#8a3a34', h: 3.2, rail: 1.25 }, exits: [{ x: 1.6, y: 10.4, label: 'Exit to the street', to: 'city' }], spawn: { x: 1.6, y: 9.6, dir: 3 }, items: it,
    setup(sc) {
      sc.job = { people: {}, kids: [] };
      person(sc, 'jo', 10.9, 2.1, 1, { seat: { x: 10.9, y: 2.1, z: .5, dir: 1 } });
      person(sc, 'dutch', 13.3, 1.3, 3, { anim: 'work', when: n => n.hf >= 10 || n.hf < 1, shift: { x: 14.4, y: 1.5, dir: 2 } });
      person(sc, 'tully', 10.3, .9, 2, { shift: { x: 6.6, y: 2.2, dir: 1 } });
      ticker(sc, 'firefighter');
      for (const [x, y, z] of [[3, 3, 3], [7.5, 3, 3], [5, 8, 3]]) light(sc, x, y, z, 5, '#fff2d8'); light(sc, 13.3, 1.5, 2.2, 3.4, '#ffd89a'); light(sc, 13.4, 6.4, 2.2, 3.4, '#ffd89a'); light(sc, 10.4, 5.8, 1, 1.6, '#ffc880');
    } });
  look('fire_pole', 'Slide down the pole', ['You climb the stair, grip the brass and go. Two seconds of pure municipal joy.', 'Whoosh. Tully times you from the bench: "Four seconds. Feet first next time."', 'Down the pole again. Nobody says no.'], { fun: 9, energy: -1 }, 'fire_station');
  look('fire_tortoise', 'Say hello to Sprinkler', ['Sprinkler regards you across a lettuce leaf. She has a badge. She outranks you.', 'A tortoise does not hurry toward anybody. She moves an inch in your direction. Honored.', 'You scratch the shell where the badge is. A slow blink.'], { fun: 6, social: 2 }, 'fire_station');
  look('fire_board', 'Read the call board', ['CALLS THIS WEEK. Toast: seven. Cat: one. Lift: one. Underneath, in chalk: "9 IN 10. WE PRACTICE FOR THE TENTH."', 'A column of times in a neat hand. The newest boots in the house: fifty-one seconds.'], { fun: 2 }, 'fire_station');
  look('fire_bell', 'Look at the bell', ['Brass, polished by sleeves. The clapper is tied back with a bootlace so nobody rings it for fun.', 'Three lamps over the call box. Tonight the green one is on.'], { fun: 2 }, 'fire_station');
  look('fire_engine', 'Admire Engine 2', ['Engine 2. She shows every fingerprint, which is how they know you touched her.', 'A pump panel of brass caps and honest dials. On the hose bed, every fold is the same width.'], { fun: 4 }, 'fire_station');
  look('fire_gear_hooks', 'Look at the turnout rack', ['Coats on hooks, boots standing inside their pants: step in, pull up, go. The fourth plate is blank.', 'Helmets in a row. The white one is the Captain\'s.'], { fun: 2 }, 'fire_station');
  registerInfo(JOB_ROOMS.fire_station.name, { blurb: 'The engine bay and the watch room of Station 2: Engine 2, the brass pole, a pot that is always on and a tortoise with a badge. Visitors welcome till eight.', signature: 'The brass pole', tryThis: ['Slide down the pole', 'Say hello to Sprinkler', 'Read the call board'] });
})();

/* =================================================================== Maplewood Elementary, Room 4 */
(function () {
  const it = [], h = (...a) => H(it, ...a), w = (...a) => Wl(it, ...a);
  h('school.readnook', .2, .1); w('school.artline', 'y', .3, { w: 2.6 }, { mount: 2.2 }); w('school.board', 'y', 3.2, { w: 4.4 }); h('school.tdesk', 8.3, .3); w('school.clock', 'y', 8.8, {});
  w('school.window', 'x', 3, {}); w('school.townmap', 'x', 5.9, {}); w('school.artline', 'x', 8.4, { w: 2, seed: 2 }, { mount: 1.5 });
  h('school.desks', 2.3, 3.3, { seed: 0 }); h('school.desks', 5.0, 3.3, { seed: 3 }); h('school.desks', 2.3, 5.7, { seed: 5 }); h('school.desks', 5.0, 5.7, { seed: 6 });
  h('school.carpet', 7.7, 3.4, { w: 3, d: 2.4 }); h('school.nature', .4, 8.7); h('generic.plant', 10.4, 2.0, { s: 1.1 }); h('generic.bin', 10.3, 6.3, {});
  /* the corridor */
  h('school.partition', 11.2, 0, { d: 7, door: 1 }); h('school.partition', 11.2, 8.8, { d: 2.2 });
  h('school.cubbies', 11.5, .9, { w: 3 }, { flip: true }); h('school.fountain', 12.4, 0); w('school.sundoor', 'y', 13.2, { n: '5', sun: false, c: '#b8563a' }, { door5: 1 }); w('school.notice', 'y', 14.5, { w: 1.4 }, { mount: 1.0 });
  h('school.trolley', 13.9, 5.6); h('generic.plant', 15.2, .5, { kind: 'palm', s: 1.1 });
  defineRoom({ id: 'school_classroom', name: 'Maplewood Elementary, Room 4', w: 16, d: 11, zoom: 0, jobRoom: true, job: 'teacher', noCrowd: true, music: 'quiet', floor: GT.f_wood, floors: [{ x0: 11.4, y0: 0, x1: 16, y1: 11, floor: GT.f_lino }],
    bg: '#17161f', edge: '#5a4a30', wall: { color: '#f4e9cf', trim: '#8a5a3a', h: 3, rail: 1.0 }, exits: [{ x: 14, y: 10.4, label: 'Exit to the school yard', to: 'city' }], spawn: { x: 14, y: 9.6, dir: 3 }, items: it,
    setup(sc) {
      sc.job = { people: {}, kids: [] };
      const school = n => wk(n) && n.hf >= 8 && n.hf < 15;
      person(sc, 'calloway', 9.2, .64, 1, { when: school, seat: { x: 9.2, y: .64, z: .5, dir: 1 }, shift: { x: 7.9, y: 1.2, dir: 1 } });
      person(sc, 'whitlow', 13.2, 3.2, 1, { when: n => wk(n) && n.hf >= 7.5 && n.hf < 16 });
      person(sc, 'nguyen', 14.2, 6.9, 3, { when: n => (wk(n) && n.hf >= 7 && n.hf < 18) || (!wk(n) && n.hf >= 9 && n.hf < 12) });
      /* the children: three with names, the rest of the tables */
      const seats = []; for (const f of sc.byTag('class_desks')) for (const s of f.seats) seats.push(s);
      const named = [['cosmo', 5], ['juniper', 0], ['ayo', 10]];
      for (const [id, k] of named) { const s = seats[k]; if (!s) continue; const c = person(sc, id, s.x - O, s.y - O, s.dir, { when: school, seat: { x: s.x - O, y: s.y - O, z: s.z, dir: s.dir } }); c.kind = 'customer'; }
      const LINES = ['"Is it lunch?"', '"I lost a tooth. It is in an envelope."', '"Twiglet moved! He MOVED."', '"Can I be line leader?"', '"I know seven. Seven is my favorite."', '"My sister is in Room 5."', '(a drawing of a dog, or possibly a horse)'];
      [1, 2, 4, 6, 8, 9, 12, 13, 15].forEach((k, i) => { if (seats[k]) kid(sc, i, seats[k], LINES); });
      ticker(sc, 'teacher', n => { const on = school(n) || onShiftAs('teacher'); for (const c of sc.job.kids) c.hidden = !on; });
      for (const [x, y] of [[3, 3], [7, 3], [3, 7], [8, 7]]) light(sc, x, y, 2.8, 4.6, '#fff4d8'); light(sc, 13.5, 4, 2.8, 4, '#f4f0e0'); light(sc, 1.2, 1.1, 1.2, 2, '#ffd880');
    } });
  look('class_nature_table', 'Look for Twiglet', ['A tank, a branch, bramble leaves. One of the twigs is looking back at you. Probably.', 'You count the twigs. Then you count them again. One more than last time.', 'Twiglet waves a leg, slowly, like a small flag.'], { fun: 5 }, 'school_classroom');
  sit('class_reading_corner', 'Read a picture book', 15, 'read', { fun: .5, energy: .05 }, 'A duck, a truck, a happy ending. It holds up.', 'school_classroom');
  look('class_townmap', 'Look at "Our Town"', ['A paper map of Maple Bay by twenty-two hands. The lighthouse is the right size. The ice cream shop is larger than City Hall.', 'Somebody has drawn every desk in Room 4 in the corner, to scale, in pencil.'], { fun: 3 }, 'school_classroom');
  look('class_board', 'Read the board', ['Today: 3 + 4 = 7. Underneath, a question mark that somebody has turned into a snail.', 'Helpers of the day: line leader, door holder, Twiglet monitor.'], { fun: 1 }, 'school_classroom');
  look('class_cubbies', 'Look at the cubbies', ['Backpacks, lunch boxes, one mitten. The name cards are in careful capitals: PIP. MILO. AYO.', 'A coat peg per child. Somebody has hung up a drawing as if it were a coat.'], { fun: 2 }, 'school_classroom');
  look('class_trolley', 'Look at the trolley', ['Mr. Nguyen\'s trolley: a mop, a bucket, and three lost mittens pegged along the handle like bunting.'], { fun: 2 }, 'school_classroom');
  look('fountain', 'Drink from the fountain', ['It is exactly as low as you remember, and exactly as cold.'], { bladder: -2, energy: 1 }, 'school_classroom');
  registerFixture('class_door', (f, sc) => (f.item && f.item.door5 ? { label: 'Room 5', use: () => toast(safe(() => G.social.rel('nora'), 0) > 0 ? 'Room 5: Ms. Larkin\'s class. Through the glass, a sea of paper boats.' : 'Room 5. Through the glass: a class making paper boats, and a teacher counting them.', 'info', 3600) } : null));
  registerInfo('Maplewood Elementary', { blurb: 'Room 4, second grade: a paper sun on the door, four tables, a reading tent and a stick insect called Twiglet. Open on school days.', signature: 'The door with the paper sun', tryThis: ['Look for Twiglet', 'Read a picture book in the tent', 'Find the ice cream shop on "Our Town"'] });
})();

/* =================================================================== The Maple Bay Gazette */
(function () {
  const it = [], h = (...a) => H(it, ...a), w = (...a) => Wl(it, ...a);
  w('news.window', 'y', .4, { w: 3 }); w('news.layout', 'y', 3.8, { w: 4.6 }); w('news.assign', 'y', 8.8, {}); w('news.clocks', 'y', 8.5, {}, { mount: 2.35 }); w('news.stairdoor', 'y', 11.2, {});
  h('news.morgue', 0, 4.4, { w: 3 }, { flip: true }); w('news.darkroom', 'x', .4, {}); w('news.frontpage', 'x', 7.7, {}); w('news.frontpage', 'x', 8.8, { seed: 7, pic: '#c8b898' });
  h('news.editor', 4.8, 1.4);
  h('news.desk', 1.4, 1.2, { kind: 'edwina' }); h('news.desk', 1.9, 4.5, { kind: 'own' }, { tags: ['news_own_desk'] }); h('news.desk', 4.3, 4.7, { seed: 2 }); h('news.desk', 6.7, 4.5, { kind: 'photo' }); h('news.desk', 9.1, 4.7, { seed: 9 });
  h('news.desk', 1.9, 7.3, { seed: 5 }); h('news.desk', 4.3, 7.3, { seed: 8 });
  h('news.press', 11.8, 3.2); h('news.bundles', 13.4, 5.0, { n: 7 }); h('news.bundles', 12.2, 5.2, {}); h('news.counter', 10.6, 7.6, { w: 2.6 });
  h('generic.plant', 14.2, .5, { kind: 'palm', s: 1.2 }); h('generic.plant', 3.6, .3, { s: 1.1 }); h('generic.coatrack', 13.7, 1.0, {}); h('generic.bin', 8.3, 6.6, {});
  defineRoom({ id: 'gazette_newsroom', name: 'The Maple Bay Gazette, newsroom', w: 15, d: 10, zoom: 0, jobRoom: true, job: 'reporter', noCrowd: true, music: 'quiet', floor: GT.f_darkwood, floors: [{ x0: 7, y0: 8.6, x1: 15, y1: 10, floor: GT.f_lino }],
    bg: '#17161f', edge: '#3a3430', wall: { color: '#dfe6d8', trim: '#5a3a28', h: 3.2, rail: 1.0 }, exits: [{ x: 7.4, y: 9.4, label: 'Exit to the street', to: 'city' }], spawn: { x: 7.4, y: 8.7, dir: 3 }, items: it,
    setup(sc) {
      sc.job = { people: {}, kids: [] }; const open = n => n.weekday < 6 && n.hf >= 9 && n.hf < 19;
      const seatOf = (x, y, dx, dy) => ({ x: x + dx, y: y + dy, z: .5, dir: 1 });
      person(sc, 'max', 6.0, 1.76, 1, { when: open, seat: seatOf(4.8, 1.4, 1.2, .36) });
      person(sc, 'edwina', 2.24, 1.52, 1, { when: n => wk(n) && n.hf >= 9 && n.hf < 17, seat: seatOf(1.4, 1.2, .84, .32) });
      person(sc, 'lev', .9, 3.5, 1, { when: open, shift: { x: 7.54, y: 4.82, dir: 1 } });
      ticker(sc, 'reporter');
      for (const [x, y] of [[3, 3], [8, 3], [3, 7], [9, 7], [13, 4]]) light(sc, x, y, 2.9, 4.4, '#fff0d0'); light(sc, .8, 1.4, 2.1, 1.6, '#ff6050');
    } });
  const paper = () => { const h = safe(() => G.gazette && G.gazette.headline && G.gazette.headline(), null) || safe(() => G.cityEvents.headline(), null); return h ? `Today's Gazette. Page one: "${h}"` : pick(['Today\'s Gazette. Page one: the council, a crosswalk, and a very good photograph of a duck.', 'Today\'s Gazette. "Comings & Goings" runs to a full column: two births, a wedding, a ferry captain home.']); };
  look('news_counter', 'Read today\'s paper', () => [paper(), 'The classifieds: a piano, free to a good home; a lost glove (left); "wanted: someone who feeds cats".', 'You ring the brass bell. Somewhere a typewriter stops, considers you, and starts again.'], { fun: 5 }, 'gazette_newsroom');
  look('news_layout', 'Look at tomorrow\'s pages', ['Tomorrow, pinned up page by page. Page one has a red circle round one word and the note: "WHO CARES?"', 'Fourteen proofs. A space on page eleven is marked DUCK, in case.'], { fun: 3 }, 'gazette_newsroom');
  look('news_press', 'Watch the wire machine', ['The wire machine clears its throat and types a paragraph from far away. Nobody looks up.', 'The old proof press. A thumb of ink, a roll, a sheet: tomorrow, slightly early.'], { fun: 3 }, 'gazette_newsroom');
  look('news_morgue', 'Open a drawer of cuttings', ['The morgue: every story the Gazette ever ran, cut out and filed by a hand that did not trust computers. L is for Lighthouse. It is a thick folder.', 'A drawer marked F. Ferry timetables since 1961, and one pressed flower nobody has explained.'], { fun: 3 }, 'gazette_newsroom');
  look('news_darkroom', 'Knock at the darkroom', ['A red light. From inside: "One minute." It is never one minute.', 'A line of prints, drying: gulls, a crosswalk, somebody\'s hands.'], { fun: 2 }, 'gazette_newsroom');
  look('news_frontpage', 'Read an old front page', ['Framed: the day the ferry ran aground on a sandbar and everybody walked home across it.', 'Framed: "LIGHT STAYS ON", 1988. The photograph is all fog and one bright dot.'], { fun: 2 }, 'gazette_newsroom');
  registerInfo(JOB_ROOMS.gazette_newsroom.name, { blurb: 'The newsroom of the Maple Bay Gazette: tomorrow pinned to a wall, a wire machine, a morgue of cuttings and a front counter with a brass bell.', signature: 'The layout wall', tryThis: ['Read today\'s paper at the counter', 'Look at tomorrow\'s pages', 'Open a drawer in the morgue'] });
})();

/* =================================================================== Bay Radio 98.6, Studio B */
(function () {
  const it = [], h = (...a) => H(it, ...a), w = (...a) => Wl(it, ...a);
  h('radio.records', .3, 0, { w: 3.4 }); w('radio.window', 'y', 4.2, { w: 2.6 }); w('radio.onair', 'y', 4.5, {}, { mount: 2.5, onair: 1 }); w('radio.foam', 'y', 7.1, { w: .9 }, { mount: 1.0 });
  w('radio.foam', 'x', .7, { w: 2.1 }); w('radio.tally', 'x', 3.2, {}); w('radio.cards', 'x', 5.2, { w: 1.6 }); h('radio.kettle', 0, 6.9, {}, { flip: true });
  h('radio.console', 3.9, 2.3); h('radio.phone', 7.0, 3.0); h('radio.glass', 8.1, .2, { w: 3 }, { flip: true });
  h('radio.bench', 8.6, 0); h('radio.reel', 10.0, 2.6, {}); h('radio.guest', 1.2, 5.6); h('generic.plant', 7.5, .5, { kind: 'snake' }); h('generic.floorlamp', .5, 4.6, {}); h('generic.rug', 3.6, 5.2, { w: 3.4, d: 1.8, c: '#8a3848' });
  defineRoom({ id: 'radio_studio', name: 'Bay Radio 98.6, Studio B', w: 12, d: 9, zoom: 0, jobRoom: true, job: 'radio_dj', noCrowd: true, music: 'quiet', floor: GT.f_carpet, floors: [{ x0: 8.3, y0: 0, x1: 12, y1: 9, floor: GT.f_lino }],
    bg: '#14131c', edge: '#3a2a34', wall: { color: '#5a4458', trim: '#4a2e1c', h: 3.2, rail: 1.0 }, exits: [{ x: 5.6, y: 8.4, label: 'Exit to the street', to: 'city' }], spawn: { x: 5.6, y: 7.6, dir: 3 }, items: it,
    setup(sc) {
      sc.job = { people: {}, kids: [] };
      person(sc, 'sunny', 5.3, 2.66, 1, { when: n => n.hf >= 17 && n.hf < 21.2, seat: { x: 5.3, y: 2.66, z: .5, dir: 1 }, shift: { x: 3.4, y: 4.9, dir: 1 } });
      person(sc, 'hattie', 9.7, 1.25, 3, { anim: 'work', when: n => n.hf >= 15 || n.hf < 2 });
      const sign = sc.world.objs.find(o => o.data && o.data.onair), ph = obOf(sc, 'furn.job.radio.phone');
      ticker(sc, 'radio_dj', (n, working) => { const on = working || (n.hf >= 17 && n.hf < 21.2); setP(sign, { on: on ? 1 : 0 }); setP(ph, { lit: working ? 3 : on ? 1 : 0 }); });
      light(sc, 5.3, 3.2, 2.2, 3.6, '#ffd89a'); light(sc, 2, 1.4, 2.4, 3, '#ffe2b0'); light(sc, 9.7, 1.4, 2, 2.8, '#fff0d0'); light(sc, 1.2, 5.2, 1.6, 2.4, '#ffc880'); light(sc, 5.5, .8, 2.6, 1.8, '#ff5040');
    } });
  sit('radio_guest', 'Sit in on the show', 20, 'sit', { fun: .5, social: .1 }, () => { safe(() => G.skills.addXp('music', 4)); return 'Twenty minutes of somebody else\'s records. You leave knowing two songs you did not know.'; }, 'radio_studio');
  look('record_shelf', 'Flip through the records', ['Five shelves, filed by a system only Hattie understands. You find three you love and one you are embarrassed to love.', 'A sleeve with a coffee ring, 1974. On the back, in pencil: "side two, track one. Trust me."'], { fun: 5 }, 'radio_studio');
  look('radio_window', 'Look out over Hillcrest', ['Hillcrest going down to the water, porch lights coming on one by one. Out on the point, the lighthouse turns.', 'From up here the town looks like something a radio could reach.'], { fun: 4 }, 'radio_studio');
  look('radio_tally', 'Read the tally', () => [safe(() => G.state.flags['radio_arc_done'], 0) ? 'TUNED IN. The number has been rubbed out and written larger so many times the board is grey there.' : 'TUNED IN: 41. Chalked, underlined. Somebody has added, smaller: "that we know of."'], { fun: 2 }, 'radio_studio');
  look('radio_bench', 'Look at the workbench', ['A tape machine with its lid off, a soldering iron, a row of spare valves. Everything is labeled in the same square hand.'], { fun: 2 }, 'radio_studio');
  look('radio_kettle', 'Look at the kettle corner', ['A kettle, a biscuit tin, a box of tea with TWO BAGS written on it in marker.'], { fun: 1 }, 'radio_studio');
  registerInfo(JOB_ROOMS.radio_studio.name, { blurb: 'Studio B of Bay Radio 98.6, round the side of the Broadcast House: a walnut console, a wall of records and a window over Hillcrest. Sit in on the evening show.', signature: 'The ON AIR light', tryThis: ['Sit in on the show', 'Flip through the records', 'Look out over Hillcrest'] });
})();

/* =================================================================== the doors in the city (add-only: pois + two door props; see the header) */
function nearFree(w, x, y) { if (!w.isBlocked(x, y)) return { x, y }; for (const r of [.5, 1, 1.5, 2]) for (let k = 0; k < 8; k++) { const qx = x + Math.cos(k * .785) * r, qy = y + Math.sin(k * .785) * r; if (!w.isBlocked(qx, qy)) return { x: Math.round(qx * 4) / 4, y: Math.round(qy * 4) / 4 }; } return { x, y }; }
export function buildJobDoors(w) {
  if (!w || !Array.isArray(w.objs) || !Array.isArray(w.pois)) return null;
  safe(() => G.lobbies.list());   /* the lobbies claim door-less office buildings first, so a new door here never costs a building its lobby */
  const out = {};
  for (const id in JOB_ROOMS) {
    const R = JOB_ROOMS[id], pid = 'door:' + id; let p = w.pois.find(q => q.id === pid);
    if (!p) {
      const b = w.objs.find(o => o.a && o.a.kind === 'building' && R.building.test(o.id) && (!R.at || (o.x === R.at[0] && o.y === R.at[1]))); if (!b) continue;
      if (R.side && !w.objs.some(o => o.id === 'prop.job.sidedoor' && o.x === R.side.x && o.y === R.side.y)) safe(() => w.place('prop.job.sidedoor', R.side.x, R.side.y, { p: R.side.p, flip: true, solid: false }));
      const at = nearFree(w, R.door.x, R.door.y);
      p = w.poi({ type: 'door', id: pid, room: id, name: R.name, x: at.x, y: at.y, dir: R.door.dir, district: R.district, jobRoom: true });
    }
    if (!p.onUse) p.onUse = () => { if (jobRoomOpen(id) || worksAs(R.job) && safe(() => G.jobs.onShift(), false)) return false; toast(R.closed, 'info', 4600); return true; };
    out[id] = p;
  }
  return out;
}
export const order = 57.5;   /* after the lobbies (57), before places (58): the new doors flow into G.places, addresses, the map and the guide like any other */
export function init() {
  const run = () => safe(() => buildJobDoors(getCity()));
  run(); G.on('ready', run); G.on('load', run);
  G.jobRooms = { rooms: JOB_ROOMS, open: jobRoomOpen, doors: run };
}
export { ROOMS };
