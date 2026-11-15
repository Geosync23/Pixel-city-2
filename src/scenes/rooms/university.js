// Maple Bay University — the five rooms of University Hall. Gameplay lives in sim/university.js (G.university); the class engine in sim/_uni_class.js drives what these rooms expose.
//   `university`           Great Hall 24 x 15: Registrar + Bursar counter, the Founder's bust, crest, portraits, trophy case, timetable + clubs boards, gown rail, Albie the porter.
//   `university:lecture`   Ashby Lecture Theatre 18 x 13: dais, lectern, a LIVE lecture screen (one canvas on the back wall), 48 bench seats.
//   `university:commons`   The Commons 22 x 14: The Quill & Kettle cafe, the fire, the study-group table, clubs corner.
//   `university:library`   The Reading Room 16 x 12: shelves, eight green-lamp carrels, Mr. Mott's desk, the returns cart (work-study).
//   `university:workshop`  Workshops & Studios 26 x 14: studio easels, teaching kitchen, lab benches, computers, piano, writing table, seminar podium, repair benches.
// Exits are doormats with `to`, so the guide arrow can route between the rooms. Every room has scene.uni:
//   { cast: { id: Char }, crowd, sync(), ... }   lecture: + { seats: [{ x, y, z, dir, spot, taken }], board: { show(spec) }, prof, mates: [Char], extras: [Char], speak: { x, y, dir } }
//   workshop: + { stations: { key: { x, y, z?, dir, anim, seated?, prof: { x, y, dir }, mates: [{ x, y, dir, anim, seated? }] } }, prof, mates }
//   commons: + { group: { seat, mates: [...] } }      library: + { carrels: [seat], cart }
// castSpec(id) -> the character spec of a named person (also used on the quad and in the phone app).
import { G } from '../../core/game.js';
import { GT } from '../../engine/world.js';
import * as R from '../../engine/raster.js';
import { Char, charArt } from '../../core/char.js';
import { defineRoom, registerFixture } from '../interior.js';
import { bubble } from '../../ui/kit.js';
import { crowd } from './_show_life.js';
import { specs } from './_airport_life.js';
import { registerInfo } from './unique_rooms.js';
import { O, mk, softEnv, dress, seatsOf } from './hotel.js';
import { UR, UV, NAME } from '../../data/university.js';
import { CAST, CLASSMATES, LINES } from '../../story/university.js';
import { glyphs, textW, crest, NAVY, NAVY_D, GOLD, GOLD_L } from '../../art/showpiece/_uni_lib.js';
import { fig } from '../../art/showpiece/_uni_figs.js';

const U = () => G.university, pick = a => a[Math.floor(Math.random() * a.length)];
const only = fn => (fx, scene) => (scene.def && scene.def.showpiece === 'university' ? fn(fx, scene) : null);
const SPEC = new Map();
/** the look of a named person */
export function castSpec(id) {
  if (SPEC.has(id)) return SPEC.get(id); const c = CAST[id]; if (!c) return specs().adult[0];
  const lk = Object.assign({}, c.look), seed = lk.seed; delete lk.seed; const s = Object.assign({}, charArt().randomSpec(R.rng(seed * 97 + 13), { age: lk.age || 'adult', season: 1, style: 'preppy' }), { outfit: null, bag: null, hat: null, scarf: null, glasses: false, beard: false }, lk);
  SPEC.set(id, s); return s;
}
let STU = null;
/** a pool of student looks (adults, bags, a few campus colours) */
export function students() {
  if (STU) return STU; const A = charArt(), r = R.rng(1891), ST = ['casual', 'street', 'hipster', 'preppy', 'athleisure'];
  STU = Array.from({ length: 28 }, (_, i) => { const s = Object.assign({}, A.randomSpec(r, { age: 'adult', season: 1, style: ST[i % ST.length] })); if (i % 6 === 0) { s.top = 'varsity'; s.topColor = NAVY; s.accent = GOLD; } if (i % 9 === 4) { s.top = 'hoodie'; s.topColor = NAVY; } return s; });
  return STU;
}
/** a named person in a room: tap -> G.university.talk */
function person(sc, id, x, y, dir, pose) {
  const c = mk(sc, castSpec(id), x, y, dir, `${CAST[id].name}, ${CAST[id].role}`, ch => { if (U()) U().talk(id, ch, sc); else bubble(ch, pick(CAST[id].lines)); }, id === 'juno' ? 'staff' : 'npc');
  c.uniId = id; c.npcId = 'uni:' + id; if (pose) c.pose = pose; (sc.uni.cast || (sc.uni.cast = {}))[id] = c; return c;
}
const studentCrowd = (sc, spots, o) => { const cr = crowd(sc, spots, o), P = students(); let i = (o.seed || 0) % P.length; dress(cr, (s, c) => (s.kind === 'staff' ? null : P[(i += 5) % P.length])); for (const c of cr.list) { c.carry = false; if (c.poseOpts && c.poseOpts.item) c.poseOpts = null; } return cr; };
const kit = () => { const items = [], spots = []; return { items, spots, H: (id, x, y, p, o) => { const it = Object.assign({ id: id.startsWith('prop.') ? id : id.includes('.') ? 'furn.' + id : 'furn.uni.' + id, x, y, p: p || {} }, o); items.push(it); return it; }, Wl: (id, wall, at, p, o) => { const it = Object.assign({ id: id.includes('.') ? 'furn.' + id : 'furn.uni.' + id, wall, at, p: p || {} }, o); items.push(it); return it; }, S: (x, y, dir, o) => spots.push(Object.assign({ x, y, dir }, o)) }; };
const by = (sc, k) => sc.world.objs.filter(o => o.data && o.data[k]);
const isNight = () => { const h = G.now().hf; return h < 6.5 || h >= 19; };
const windows = sc => { const ws = sc.world.objs.filter(o => o.id === 'furn.uni.window'); let last = null; return () => { const n = isNight() ? 1 : 0; if (n === last) return; last = n; for (const o of ws) { o.p = Object.assign({}, o.p, { night: n }); o._key = null; } }; };
const WALL = { color: '#efe4cc', trim: '#6a4428', h: 4.6, rail: 1.1 };
const strip = (sc, re) => { sc.interactables = sc.interactables.filter(it => !(it.fx && re.test(it.fx.asset.id) && !it.uni)); };

/* =================================================================== the Great Hall */
const HK = kit();
(function () {
  const { H, Wl, S } = HK;
  Wl('portrait', 'y', .7, { k: 0 }); Wl('portrait', 'y', 2.4, { k: 1 }); Wl('crestwall', 'y', 4.6, {}); Wl('hotel.doorway', 'y', 9.8, { name: 'LECTURE THEATRE', c: NAVY_D, w: 4.4, lit: 1 }); Wl('portrait', 'y', 15.1, { k: 2 }); Wl('pennants', 'y', 1, { w: 8 }); Wl('pennants', 'y', 15, { w: 8 });
  Wl('hotel.doorway', 'x', .8, { name: 'READING ROOM', c: '#3f6a48', w: 3.4, lit: 1 }); Wl('pinboard', 'x', 5, { k: 'time' }, { board: 'time' }); Wl('hotel.doorway', 'x', 8.2, { name: 'THE COMMONS', c: '#8a3848', w: 3.4, lit: 1 }); Wl('pinboard', 'x', 12.2, { k: 'exam' }, { board: 'exam' });
  H('counter', 17.4, 1.3, { w: 5, t: 'REGISTRAR', t2: 'BURSAR' }, { desk: 1 }); H('trophy', 14.9, .6, {}); H('gowns', 22.2, 4.4, {}, { flip: true });
  for (const [x, y] of [[7.4, 4], [16.1, 4], [7.4, 10.4], [16.1, 10.4]]) H('lobby.column', x, y, { kind: 'marble' }); H('lobby.chandelier', 11.5, 3.2, { kind: 'ring', m: 'brass' }, { z: 1.4 }); H('lobby.chandelier', 11.5, 10.6, { kind: 'ring', m: 'brass' }, { z: 1.4 }); H('cityhall.bench', 3.2, 4.2, { w: 3, c: '#f4ecd8', bow: 1 });
  H('lobby.inlay', 10.5, 5.6, { kind: 'compass', c: NAVY, c3: '#b8342e' }); H('bust', 11.6, 6.7, {}); H('hotel.carpet', 10.9, 9.2, { w: 2.2, d: 5.2, c: NAVY_D });
  H('cityhall.bench', 3.4, 12.4, { w: 3, c: '#f4ecd8', bow: 1 }); H('cityhall.bench', 17.6, 12.4, { w: 3, c: '#f4ecd8', bow: 1 }); H('cityhall.planter', 1, 13.6, { k: 'tulips' }); H('cityhall.planter', 21.4, 13.6, {});
  H('generic.plant', .7, 4.5, { kind: 'palm', s: 1.5, pot: '#f1ede4' }); H('generic.plant', 14.3, 3, { s: 1.6, leaf: '#3f7a48', pot: NAVY });
  H('prop.uni.lawnsign', 21.3, 11.9, { t: 'STUDIOS' }, { solid: false });
  /* people about */
  S(18.3, 3.3, 3, { p: .7, label: 'Student', lines: LINES.student }); S(19.1, 4.2, 3, { p: .45, anim: 'phone' }); S(21.2, 3.2, 3, { busy: 1, label: 'Student' });
  S(6.2, 2.2, 3, { p: .6, anim: 'read', label: 'Student' }); S(3.2, 6.4, 2, { p: .5 }); S(4, 7.1, 3, { p: .5, anim: 'talk' }); S(13.6, 6.2, 2, { p: .4, anim: 'phone' }); S(8.3, 10.6, 0, { busy: 1 }); S(15.2, 10.9, 2, { busy: 1, anim: 'talk' });
})();
defineRoom({ id: UR.hall, name: NAME, w: 24, d: 15, zoom: 0, music: 'quiet', noCrowd: true, showpiece: 'university', venue: UV.place, floor: GT.f_stone, bg: '#17161f', edge: '#4a3a30', wall: WALL,
  exits: [{ x: 12, y: 14.4, label: 'Exit to the quad', to: 'city' }, { x: 12, y: 1.25, label: 'Ashby Lecture Theatre', to: 'int:' + UR.lecture, use: () => U().door(UR.lecture) }, { x: 1.2, y: 2.5, label: 'Reading Room', to: 'int:' + UR.library, use: () => U().door(UR.library) },
    { x: 1.2, y: 9.9, label: 'The Commons', to: 'int:' + UR.commons, use: () => U().door(UR.commons) }, { x: 22.9, y: 11, label: 'Workshops & Studios', to: 'int:' + UR.workshop, use: () => U().door(UR.workshop) }],
  spawn: { x: 12, y: 13.4, dir: 3 }, items: HK.items, npcSpots: HK.spots,
  setup(sc) {
    const Wd = sc.world; sc.uni = { cast: {} }; sc.env = softEnv(Wd, .6, .45);
    Wd.lights.push({ x: O + 12, y: O + 4, z: 0, r: 9, c: '#fff0d0' }, { x: O + 12, y: O + 10, z: 0, r: 9, c: '#fff0d0' }, { x: O + 19.8, y: O + 2.6, z: 0, r: 5, c: '#ffe9b0' }, { x: O + 3, y: O + 6, z: 0, r: 6, c: '#fff4dc' });
    const seats = seatsOf(sc, /cityhall\.bench/, { add: (f, i, n) => ({ p: .45, anim: n % 2 ? 'read' : 'phone', label: 'Student', lines: LINES.student }) });
    const cr = sc.uni.crowd = studentCrowd(sc, sc.def.npcSpots.concat(seats), { seed: 11, fill: .55, lines: LINES.student });
    const pym = person(sc, 'pym', 18.65, .82, 1), albie = person(sc, 'albie', 13.9, 12.5, 3); pym.z = 0; const dean = person(sc, 'dean', 9.6, 5.4, 1);
    const wn = windows(sc); let tick = 0;
    sc.uni.sync = () => { const u = U(), open = !u || u.isOpen(), office = !u || u.officeOpen(), busy = !!u && u.busyNow(); cr.show(open, busy); pym.hidden = !office; albie.hidden = !open; dean.hidden = !(open && u && u.deanIn()); const ex = by(sc, 'board').find(o => o.data.board === 'exam'); if (ex) ex.hidden = !(u && u.examWeek()); wn(); };
    const up0 = sc.update; sc.update = (dt, gm) => { up0(dt, gm); cr.update(dt); for (const c of [pym, albie, dean]) { c.t += dt; if (c._hold > 0) c._hold -= dt; else if (c === pym) c.dir = 1; } if ((tick -= dt) <= 0) { tick = 2; sc.uni.sync(); } };
    const e0 = sc.onEnter; sc.onEnter = (o, pv) => { e0(o, pv); sc.uni.sync(); if (U()) U().arrived(sc, pv); };
  },
});

/* =================================================================== Ashby Lecture Theatre */
const LK = kit(), SW = 156, SH = 52, ROWS = [4.5, 6.3, 8.1, 9.9], BLK = [2.9, 10.9];
(function () {
  const { H, Wl } = LK;
  Wl('chalk', 'y', .5, { k: 0, w: 3 }); Wl('screenframe', 'y', 4, { w: 10, h: 3.4 }); Wl('chalk', 'y', 14.5, { k: 2, w: 3 });
  Wl('window', 'x', 1.4, {}); Wl('window', 'x', 5.2, {}); Wl('window', 'x', 9, {}); Wl('pennants', 'y', 4.5, { w: 9 }, { mount: 4.5 }); Wl('generic.clock', 'y', 3.6, { c: '#d8a848' });
  H('stage', 3, .6, { w: 12, d: 2.7 }); H('obs.lectern', 5.4, 2.3, {}, { z: .22, lect: 1 });
  for (const y of ROWS) for (const x of BLK) H('lecrow', x, y, { n: 6 }, { row: 1 });
  H('generic.plant', 16.8, .8, { kind: 'palm', s: 1.5, pot: NAVY });
})();
/** paint the lecture screen. spec: { mode: 'idle' | 'slide' | 'paper' | 'stage', title, sub, fig, n, of, lines: [..], color } */
function paintScreen(g, s, t) {
  const put = (x, y, c) => { if (!c || x < 0 || y < 0 || x >= SW || y >= SH) return; g.fillStyle = c; g.fillRect(x, y, 1, 1); };
  g.fillStyle = s.mode === 'idle' ? '#1c2540' : '#16302a'; g.fillRect(0, 0, SW, SH); g.fillStyle = s.color || GOLD; g.fillRect(0, 0, SW, 1); g.fillRect(0, SH - 1, SW, 1);
  const ctr = (str, y, c) => { str = String(str || '').toUpperCase(); const w = textW(str); if (w > SW - 6) str = str.slice(0, Math.floor((SW - 6) / 4)); glyphs(put, str, Math.round((SW - textW(str)) / 2), y, c); };
  if (s.mode === 'idle') { crest(put, 12, 12, 2); crest(put, SW - 34, 12, 2); ctr('ASHBY LECTURE THEATRE', 8, GOLD_L); ctr(s.title || 'MAPLE BAY UNIVERSITY', 20, '#f2f6ee'); ctr(s.sub || 'LUX IN PORTU', 30, '#8fd0f0'); if (s.lines && s.lines[0]) ctr(s.lines[0], 40, '#f6a8b8'); return; }
  ctr(s.title, 4, GOLD_L);
  if (s.mode === 'slide') {
    g.save(); g.translate(8, 13); fig(s.fig)((x, y, c) => { if (c && x >= 0 && y >= 0 && x < 72 && y < 36) { g.fillStyle = c; g.fillRect(x, y, 1, 1); } }, 72, 36); g.restore();
    (s.lines || []).slice(0, 4).forEach((l, i) => glyphs(put, String(l).slice(0, 17), 86, 15 + i * 8, i ? '#f2f6ee' : '#f6d878'));
    if (s.of) for (let i = 0; i < s.of; i++) { g.fillStyle = i < s.n ? GOLD : '#3a5a4e'; g.fillRect(SW - 8 - (s.of - i) * 5, SH - 6, 3, 3); }
  } else { (s.lines || []).slice(0, 5).forEach((l, i) => ctr(l, 14 + i * 8, i === 0 ? '#f6d878' : '#f2f6ee')); if (s.mode === 'paper') { const k = Math.floor(t * 2) % 2; g.fillStyle = k ? '#f6a8b8' : '#8a3848'; g.fillRect(SW - 8, 4, 3, 3); } }
}
defineRoom({ id: UR.lecture, name: 'Ashby Lecture Theatre', w: 18, d: 13, zoom: 0, music: 'quiet', noCrowd: true, showpiece: 'university', venue: UV.place, floor: GT.f_wood, bg: '#15141c', edge: '#4a3a30', wall: { color: '#e9dcc0', trim: '#5a3626', h: 4.8, rail: 1 },
  exits: [{ x: 9, y: 12.4, label: 'Back to the hall', to: 'int:' + UR.hall, use: () => G.go('int:' + UR.hall, { x: O + 12, y: O + 2.3, dir: 1 }) }], spawn: { x: 9, y: 11.6, dir: 3 }, items: LK.items, npcSpots: [],
  setup(sc) {
    const Wd = sc.world; Wd.zmax = 6; sc.env = softEnv(Wd, .55, .5); Wd.lights.push({ x: O + 9, y: O + 2.4, z: 0, r: 8, c: '#fff0d0' }, { x: O + 9, y: O + 8, z: 0, r: 9, c: '#fff4dc' });
    /* the live screen: one canvas, sheared onto the back wall */
    const cv = document.createElement('canvas'); cv.width = SW; cv.height = SH; const g = cv.getContext('2d'), sh = document.createElement('canvas'); sh.width = SW + 2; sh.height = SH + SW / 2 + 2; const gx = sh.getContext('2d'); gx.imageSmoothingEnabled = false;
    const spr = { c: sh, l: sh, x: 0, y: -SH - 1, w: sh.width, h: sh.height }; let spec = { mode: 'idle' }, key = '';
    const blit = () => { gx.setTransform(1, 0, 0, 1, 0, 0); gx.clearRect(0, 0, sh.width, sh.height); gx.setTransform(1, .5, 0, 1, 0, 1); gx.drawImage(cv, 0, 0); };
    sc.ents.push({ x: O + 4.125, y: O + .24, z: 1.03, bb: [0, 0, SW / 16, .06, SH / 16], sprite: () => spr }); for (const f of sc.fixtures) f._sit = true;
    const board = { show(s) { spec = s || { mode: 'idle' }; key = ''; }, spec: () => spec, canvas: cv };
    /* seats */
    const seats = []; for (const fx of sc.byTag('uni_seat')) fx.seats.forEach((s, i) => seats.push({ x: s.x, y: s.y, z: s.z, dir: 3, spot: { x: s.x, y: fx.ob.B[4] + .32 }, row: fx.ob.B[1], i, taken: null }));
    for (const st of seats) sc.interactables.push({ x: st.x, y: st.y, z: st.z - .2, h: .5, hit: 6, label: 'Take a seat', spot: st.spot, uni: 1, visible: () => !st.taken && (!U() || U().canSit()), use: () => U() && U().sit(st, sc) });
    const prof = new Char(castSpec('baptiste'), O + 5.8, O + 1.85); prof.dir = 1; prof.z = .22; prof.hidden = true; prof.kind = 'npc'; sc.ents.push(prof);
    sc.interactables.push({ ent: prof, x: prof.x, y: prof.y, label: 'Professor', h: 1.4, hit: 8, range: 2, uni: 1, visible: () => !prof.hidden, use: () => U() && U().talk(prof.uniId, prof, sc) });
    const mates = CLASSMATES.map(id => { const c = new Char(castSpec(id), O + 9, O + 11.5); c.hidden = true; c.uniId = id; c.kind = 'npc'; sc.ents.push(c); sc.interactables.push({ ent: c, x: c.x, y: c.y, label: CAST[id].name, h: 1.2, hit: 6, range: 1.8, uni: 1, visible: () => !c.hidden, use: () => U() && U().talk(id, c, sc) }); return c; });
    const P = students(), extras = Array.from({ length: 14 }, (_, i) => { const c = new Char(P[(i * 3 + 2) % P.length], O + 9, O + 11.5); c.hidden = true; c.kind = 'customer'; sc.ents.push(c); sc.interactables.push({ ent: c, x: c.x, y: c.y, label: 'Student', h: 1.2, hit: 6, range: 1.8, uni: 1, visible: () => !c.hidden, use: () => bubble(c, pick(U() && U().examWeek() ? LINES.exam : LINES.aside)) }); return c; });
    const wn = windows(sc);
    sc.uni = { cast: {}, seats, board, prof, mates, extras, speak: { x: O + 9.4, y: O + 2.2, z: .22, dir: 1 }, focus: { x: O + 9, y: O + .3, z: 2.4 }, lectern: { x: O + 5.8, y: O + 1.85 },
      /** seat n people (classmates first); instant or fading in */
      fill(n, withMates = true) { const free = seats.filter(s => !s.taken).sort((a, b) => (a.row + Math.random() * 3) - (b.row + Math.random() * 3)), list = (withMates ? mates : []).concat(extras); let k = 0;
        for (const c of list) { if (k >= n || !free.length) break; if (!c.hidden) { k++; continue; } const s = free.shift(); s.taken = c; c.seat = s; c.x = s.x; c.y = s.y; c.z = s.z; c.dir = 3; c.pose = 'sit'; c.poseOpts = { seated: true }; c.hidden = false; c.alpha = 0; c.fade = .2 + k * .25; k++; } },
      clear() { for (const c of mates.concat(extras)) { if (c.seat) c.seat.taken = null; c.seat = null; c.hidden = true; c.z = 0; c.pose = null; c.poseOpts = null; } prof.hidden = true; prof.pose = null; },
      setProf(id, at) { prof.setSpec(castSpec(id)); prof.uniId = id; prof.hidden = false; prof.x = at ? at.x : O + 5.8; prof.y = at ? at.y : O + 1.85; prof.z = .22; prof.dir = at && at.dir !== undefined ? at.dir : 1; prof.pose = null; },
      sync() { wn(); if (U()) U().roomSync(sc); } };
    let tick = 0, think = 2;
    const up0 = sc.update; sc.update = (dt, gm) => { up0(dt, gm);
      const k = JSON.stringify(spec) + (spec.mode === 'paper' ? Math.floor(G.time * 2) : ''); if (k !== key) { key = k; paintScreen(g, spec, G.time); blit(); }
      for (const c of mates.concat(extras)) { if (c.hidden) continue; c.t += dt; if (c.alpha !== undefined) { if (c.fade > 0) c.fade -= dt; else { c.alpha += dt * 2.5; if (c.alpha >= 1) c.alpha = undefined; } } }
      if (!prof.hidden) { prof.t += dt; if (prof._hold > 0) prof._hold -= dt; }
      if ((think -= dt) <= 0) { think = 3 + Math.random() * 5; const c = pick(mates.concat(extras).filter(q => !q.hidden)); if (c && !c.noFidget) c.pose = pick(['sit', 'sit', 'read', 'sit']); }
      if ((tick -= dt) <= 0) { tick = 1.5; sc.uni.sync(); } };
    const e0 = sc.onEnter; sc.onEnter = (o, pv) => { e0(o, pv); key = ''; sc.uni.sync(); }; const x0 = sc.onExit; sc.onExit = () => { x0(); if (U()) U().leftRoom(sc); };
  },
});

/* =================================================================== The Commons */
const CK = kit();
(function () {
  const { H, Wl, S } = CK;
  Wl('cafe.menu', 'y', 1, {}); Wl('cafesign', 'y', 3.3, {}); Wl('window', 'y', 9.6, {}); Wl('pinboard', 'y', 16.6, { k: 'clubs' }, { board: 'clubs' }); Wl('pennants', 'y', 15.6, { w: 6 }); Wl('generic.clock', 'y', 20, { c: '#d8a848' });
  Wl('window', 'x', 1.4, {}); Wl('window', 'x', 5, {}); Wl('pinboard', 'x', 8.2, { k: 'work', n: 3 }, { board: 'work' }); Wl('lobby.restroom', 'x', 11.4, { c: '#5a4030', dc: NAVY }); Wl('lobby.restroom', 'x', 12.6, { c: '#5a4030', dc: '#8a3848' });
  H('cafe.till', 1.4, 1.7, { c: '#3f6a5a', top: '#f1ede4' }, { cafe: 1 }); H('cafe.bar', 3.1, 1.7, { c: '#3f6a5a', mc: '#d5dbe0', top: '#f1ede4' }); H('cafe.pastrycase', 5.8, 1.7, { seed: 5, c: '#3f6a5a' }); H('cafe.condiments', 7.6, 1.2, {});
  H('home.fireplace', 12.6, .5, { tier: 2 }); H('cafe.armchair', 11.4, 2.4, { c: '#8a3848' }); H('cafe.armchair', 14.8, 2.4, { c: '#4a7a6a' }); H('cafe.lowtable', 13.1, 2.6, {}); H('generic.rug', 11.2, 2.2, { w: 5, d: 2, c: '#8a3848', c2: '#e8b83a' }, { solid: false });
  for (const [x, y] of [[1.6, 5], [4.8, 5], [1.6, 7.4], [4.8, 7.4], [1.6, 9.8]]) H('cafe.tableset', x, y, { c: '#8a5a3a', cc: '#e8c060' }, { tbl: 1 });
  H('library.table', 9.2, 6.2, { c: '#5a3a28', cc: '#3f6a5a', seed: 5 }, { grp: 1 }); H('library.table', 11.2, 6.2, { c: '#5a3a28', cc: '#3f6a5a', seed: 8 }, { grp: 2 });
  H('generic.sofa', 16.4, 5.2, { c: '#5a4a6a', w: 3 }); H('generic.sofa', 16.4, 8, { c: '#3a3f4c' }); H('cafe.lowtable', 17.2, 6.6, { c: '#f1ede4' }); H('generic.vending', 20.6, .6, { c: '#3c64ad', kind: 'snacks', seed: 5 });
  H('cafe.tableset', 16, 10.6, { sq: true, c: '#8a5a3a', cc: '#e8c060', empty: true }, { club: 1 }); H('cafe.tableset', 19, 10.6, { sq: true, c: '#8a5a3a', cc: '#e8c060', empty: true }, { club: 1 }); H('generic.plant', 21, 13, { kind: 'palm', s: 1.5, pot: '#f1ede4' }); H('generic.floorlamp', 15.9, 1.2, { c: '#c0563a', base: '#d8a848' });
  S(3.4, 2.9, 3, { p: .6, label: 'Student', lines: LINES.commons }); S(4.2, 3.4, 3, { busy: 1, anim: 'phone' }); S(6.4, 3, 3, { busy: 1 }); S(20.9, 2, 3, { p: .4 });
})();
defineRoom({ id: UR.commons, name: 'The Commons', w: 22, d: 14, zoom: 0, music: 'cafe', noCrowd: true, showpiece: 'university', venue: UV.cafe, floor: GT.f_wood, bg: '#17161f', edge: '#4a3a30', wall: { color: '#f0e2c4', trim: '#6a4428', h: 4.4, rail: 1 },
  exits: [{ x: 11, y: 13.4, label: 'Back to the hall', to: 'int:' + UR.hall, use: () => G.go('int:' + UR.hall, { x: O + 2.3, y: O + 9.9, dir: 0 }) }], spawn: { x: 11, y: 12.6, dir: 3 }, items: CK.items, npcSpots: CK.spots,
  setup(sc) {
    const Wd = sc.world; sc.uni = { cast: {} }; sc.env = softEnv(Wd, .5, .45); Wd.lights.push({ x: O + 4, y: O + 3, z: 0, r: 7, c: '#fff0d0' }, { x: O + 13.6, y: O + 2.4, z: 0, r: 6, c: '#ffb870' }, { x: O + 11, y: O + 8, z: 0, r: 9, c: '#fff4dc' }, { x: O + 18, y: O + 8, z: 0, r: 7, c: '#fff0d0' });
    const gt = by(sc, 'grp').map(o => sc.fixtures.find(f => f.ob === o)), gseats = []; for (const f of gt) { f._sit = true; f.seats.forEach(s => gseats.push({ x: s.x, y: s.y, z: s.z, dir: s.dir, fx: f })); }
    const seats = seatsOf(sc, /cafe\.(tableset|armchair)|generic\.sofa/, { add: (f, i, n) => ({ p: f.item.club ? 0 : .5, club: f.item.club ? 1 : 0, anim: n % 3 === 0 ? 'drink' : n % 3 === 1 ? 'read' : 'talk', label: 'Student', lines: LINES.commons }) });
    const cr = sc.uni.crowd = studentCrowd(sc, sc.def.npcSpots.concat(seats), { seed: 23, fill: .55, lines: LINES.commons });
    const juno = person(sc, 'juno', 1.9, 1.25, 1); juno.z = 0; strip(sc, /cafe\.(till|bar|pastrycase)/); const till = sc.fixtures.find(f => f.item.cafe); if (till) sc.interactables.push({ x: till.x, y: till.y, h: 1.2, hit: 12, label: 'Order at the Quill & Kettle', spot: till.use, uni: 1, use: () => U() && U().talk('juno', juno, sc) });
    /* the study group: four named classmates round the long table; one seat is kept for you */
    const order = [0, 1, 4, 5, 6, 2], my = gseats[7] || gseats[gseats.length - 1], gm = ['saoirse', 'mateo', 'agnes', 'bao'].map((id, i) => { const s = gseats[order[i]], c = person(sc, id, s.x - O, s.y - O, s.dir, 'sit'); c.z = s.z; c.poseOpts = { seated: true }; c.hidden = true; c.homeSeat = s; return c; });
    sc.uni.group = { seat: my, mates: gm }; if (my) sc.interactables.push({ x: my.x, y: my.y, z: my.z - .2, h: .5, hit: 7, label: 'Join the study group', spot: { x: my.x, y: my.y + .75 }, uni: 1, visible: () => !!U() && U().groupOn() && !G.busy, use: () => U().joinGroup(sc) });
    const wn = windows(sc); let tick = 0, gth = 2;
    sc.uni.sync = () => { const u = U(), open = !u || u.isOpen(), busy = !!u && (u.busyNow() || u.examWeek()), club = !!u && u.clubNight(), grp = !!u && u.groupOn(); cr.show(open, busy); for (const c of cr.list) if (c.spot.club) c.hidden = !club; juno.hidden = !open; for (const c of gm) c.hidden = !grp; wn(); };
    const up0 = sc.update; sc.update = (dt, gmn) => { up0(dt, gmn); cr.update(dt); juno.t += dt; if (juno._hold > 0) juno._hold -= dt; else juno.dir = 1; for (const c of gm) { c.t += dt; if (c._hold > 0) c._hold -= dt; } if ((gth -= dt) <= 0) { gth = 3 + Math.random() * 4; const c = pick(gm); if (!c.hidden && !c.noFidget) c.pose = pick(['read', 'talk', 'sit', 'read']); } if ((tick -= dt) <= 0) { tick = 2; sc.uni.sync(); } };
    const e0 = sc.onEnter; sc.onEnter = (o, pv) => { e0(o, pv); sc.uni.sync(); };
  },
});

/* =================================================================== The Reading Room */
const RK = kit();
(function () {
  const { H, Wl, S } = RK;
  [.6, 2.7, 4.8, 9.4, 11.5, 13.6].forEach((x, i) => H('books.shelf', x, .5, i % 2 ? { seed: 7 + i, c: '#5a3a28', label: true } : { seed: 1 + i, c: '#5a3a28' }, { shelf: 1 })); Wl('window', 'y', 7.2, {});
  Wl('window', 'x', 1.6, {}); Wl('portrait', 'x', 4.4, { k: 3 }); Wl('window', 'x', 6.4, {}); Wl('portrait', 'x', 9.2, { k: 5 });
  for (const y of [2.9, 5.6]) for (const x of [1.3, 2.7, 4.1, 5.5]) H('carrel', x, y, { c: y > 4 ? '#5a3626' : undefined }, { car: 1 });
  H('counter', 12.4, 3.4, { w: 2.6, t: 'LIBRARIAN' }, { desk: 1 }); H('library.cart', 14.6, 6.2, {}, { cart: 1 }); H('library.catalog', 9.6, 2.6, {}); H('library.globe', 8.3, 2.4, {});
  H('library.table', 8.6, 6, { c: '#5a3a28', cc: '#3f6a5a', seed: 5 }); H('library.table', 11.4, 6, { c: '#5a3a28', cc: '#3f6a5a', seed: 9 }); H('generic.rug', 8.2, 5.6, { w: 6, d: 3, c: '#3f6a48', c2: '#e8b83a' }, { solid: false });
  H('cafe.armchair', 1.4, 9, { c: '#4a7a6a' }); H('cafe.armchair', 3, 9, { c: '#c8a850' }); H('generic.floorlamp', 2.5, 8.4, {}); H('generic.plant', 14.9, 10.6, { s: 1.6, leaf: '#3f7a48', pot: '#f1ede4' });
  S(10.4, 1.6, 3, { p: .5, anim: 'read', label: 'Student', lines: LINES.library }); S(3.4, 1.7, 3, { busy: 1, anim: 'read' }); S(14.2, 1.7, 3, { p: .4, anim: 'read' });
})();
defineRoom({ id: UR.library, name: 'The Reading Room', w: 16, d: 12, zoom: 0, music: 'quiet', noCrowd: true, showpiece: 'university', venue: UV.place, floor: GT.f_darkwood, bg: '#15141c', edge: '#3a2a24', wall: { color: '#d8c8a8', trim: '#4a2f22', h: 4.4, rail: 1 },
  exits: [{ x: 8, y: 11.4, label: 'Back to the hall', to: 'int:' + UR.hall, use: () => G.go('int:' + UR.hall, { x: O + 2.3, y: O + 2.5, dir: 0 }) }], spawn: { x: 8, y: 10.6, dir: 3 }, items: RK.items, npcSpots: RK.spots,
  setup(sc) {
    const Wd = sc.world; sc.uni = { cast: {} }; sc.env = softEnv(Wd, .45, .55); Wd.lights.push({ x: O + 4, y: O + 4.6, z: 0, r: 6, c: '#ffe9b0' }, { x: O + 11, y: O + 6.6, z: 0, r: 7, c: '#fff0d0' }, { x: O + 13.6, y: O + 3, z: 0, r: 4, c: '#ffe9b0' });
    strip(sc, /library\.cart|books\.shelf|library\.table/);
    const carrels = []; for (const fx of sc.fixtures) if (fx.item.car) { fx._sit = true; fx.seats.forEach(s => carrels.push({ x: s.x, y: s.y, z: s.z, dir: 3, spot: { x: s.x, y: fx.ob.B[4] + .4 }, taken: null, fx })); }
    const cr = sc.uni.crowd = studentCrowd(sc, sc.def.npcSpots.concat(carrels.filter((c, i) => i !== 5 && i !== 2).map((c, i) => ({ x: c.x - O, y: c.y - O, z: c.z, dir: 3, seated: true, anim: 'read', p: .5, busy: i % 3 === 0 ? 1 : 0, label: 'Student', lines: LINES.library, car: c }))).concat(seatsOf(sc, /library\.table|cafe\.armchair/, { add: (f, i, n) => ({ p: .4, anim: 'read', label: 'Student', lines: LINES.library }) })), { seed: 37, fill: .5, lines: LINES.library });
    const mott = person(sc, 'mott', 13.7, 2.95, 1); mott.z = 0;
    for (const c of carrels) sc.interactables.push({ x: c.x, y: c.y, z: c.z - .2, h: .6, hit: 7, label: 'Read at this desk', spot: c.spot, uni: 1, visible: () => !c.taken && !cr.list.some(q => q.spot.car === c && !q.hidden), use: () => U() && U().read(c, sc) });
    const cart = sc.fixtures.find(f => f.item.cart); if (cart) sc.interactables.push({ x: cart.x, y: cart.y, h: 1.1, hit: 8, label: 'Returns cart', spot: cart.use, uni: 1, use: () => U() && U().shelve(cart, sc) });
    for (const fx of sc.fixtures) if (fx.item.shelf) sc.interactables.push({ x: fx.x, y: fx.y, h: 1.8, hit: 8, label: 'Browse the shelves', spot: fx.use, uni: 1, use: () => U() && U().browse(fx, sc) });
    sc.uni.carrels = carrels; sc.uni.cart = cart; const wn = windows(sc); let tick = 0;
    sc.uni.sync = () => { const u = U(), open = !u || u.isOpen(), busy = !!u && (u.busyNow() || u.examWeek()); cr.show(open, busy); mott.hidden = !open; wn(); };
    const up0 = sc.update; sc.update = (dt, gm) => { up0(dt, gm); cr.update(dt); mott.t += dt; if (mott._hold > 0) mott._hold -= dt; else mott.dir = 1; if ((tick -= dt) <= 0) { tick = 2; sc.uni.sync(); } };
    const e0 = sc.onEnter; sc.onEnter = (o, pv) => { e0(o, pv); sc.uni.sync(); };
  },
});

/* =================================================================== Workshops & Studios */
const WK = kit();
export const STATIONS = {
  easel: { x: 3.75, y: 7.15, dir: 3, anim: 'work', prof: { x: 5.4, y: 4.2, dir: 1 }, mates: [{ x: 2.15, y: 6.55, dir: 3, anim: 'work' }, { x: 5.35, y: 7.15, dir: 3, anim: 'work' }, { x: 6.75, y: 6.55, dir: 3, anim: 'work' }], label: 'Your easel' },
  kitchen: { x: 10.95, y: 6.15, dir: 3, anim: 'work', prof: { x: 10.5, y: .78, dir: 1 }, mates: [{ x: 8.95, y: 6.15, dir: 3, anim: 'work' }, { x: 12.95, y: 6.15, dir: 3, anim: 'work' }, { x: 9.6, y: 3, dir: 3, anim: 'stand' }], label: 'Your stove' },
  lab: { x: 15.4, y: 3.8, dir: 3, anim: 'work', prof: { x: 16.8, y: 7.6, dir: 3 }, mates: [{ x: 18.2, y: 3.8, dir: 3, anim: 'work' }, { x: 15.4, y: 6.85, dir: 3, anim: 'work' }, { x: 18.2, y: 6.85, dir: 3, anim: 'read' }], label: 'Your bench' },
  pc: { x: 22.3, y: 2.15, z: .45, dir: 3, anim: 'type', seated: true, prof: { x: 22.9, y: 4, dir: 3 }, mates: [{ x: 21.1, y: 2.15, z: .45, dir: 3, anim: 'type', seated: true }, { x: 23.5, y: 2.15, z: .45, dir: 3, anim: 'type', seated: true }, { x: 24.7, y: 2.15, z: .45, dir: 3, anim: 'type', seated: true }], label: 'Your computer' },
  piano: { x: 2.1, y: 11.25, z: .46, dir: 3, anim: 'type', seated: true, prof: { x: 4.6, y: 10.4, dir: 2 }, mates: [{ x: 4.4, y: 12, dir: 2, anim: 'stand' }, { x: 5.3, y: 11.3, dir: 2, anim: 'stand' }, { x: 5.2, y: 12.6, dir: 2, anim: 'read' }], label: 'The piano' },
  desk: { x: 7.9, y: 11.35, z: .45, dir: 3, anim: 'read', seated: true, prof: { x: 10.3, y: 10.6, dir: 2 }, mates: [{ x: 8.9, y: 11.35, z: .45, dir: 3, anim: 'read', seated: true }, { x: 7.9, y: 9.85, z: .45, dir: 1, anim: 'read', seated: true }, { x: 8.9, y: 9.85, z: .45, dir: 1, anim: 'work', seated: true }], label: 'Your place at the table' },
  podium: { x: 14.4, y: 9.6, z: .22, dir: 1, anim: 'talk', prof: { x: 17.2, y: 10.6, dir: 2 }, mates: [{ x: 12.95, y: 11.95, z: .45, dir: 3, seated: true, anim: 'sit' }, { x: 13.85, y: 11.95, z: .45, dir: 3, seated: true, anim: 'sit' }, { x: 15.15, y: 11.95, z: .45, dir: 3, seated: true, anim: 'sit' }], label: 'The podium' },
  bench: { x: 20.6, y: 10.35, dir: 3, anim: 'work', prof: { x: 22, y: 11.6, dir: 3 }, mates: [{ x: 23.4, y: 10.35, dir: 3, anim: 'work' }, { x: 24.4, y: 10.35, dir: 3, anim: 'work' }, { x: 19.6, y: 11.6, dir: 0, anim: 'stand' }], label: 'Your bench' },
};
(function () {
  const { H, Wl, S } = WK;
  Wl('pinboard', 'y', .8, { k: 'work', n: 5 }, { board: 'work' }); Wl('window', 'y', 4.4, {}); Wl('chalk', 'y', 14.6, { k: 3, w: 3.4 }); Wl('window', 'y', 18.4, {}); Wl('chalk', 'y', 21, { k: 2, w: 4 });
  Wl('window', 'x', 1.4, {}); Wl('chalk', 'x', 4.6, { k: 1, w: 3 }); Wl('window', 'x', 8.6, {});
  /* studio */
  H('stilllife', 3.4, 3.2, {}); H('home.easel', 1.65, 5.65, { tier: 1, art: 'sea', wip: true }, { st: 1 }); H('home.easel', 3.25, 6.25, { tier: 1 }, { st: 'easel' }); H('home.easel', 4.85, 6.25, { tier: 1, art: 'cat' }, { st: 1 }); H('home.easel', 6.25, 5.65, { tier: 2, art: 'abstract', seed: 5 }, { st: 1 }); H('pshop.art.canvases', .6, 2.2, {});
  /* teaching kitchen */
  H('demo', 9, 1.25, {}); for (const x of [8.2, 10.2, 12.2]) H('kitchen.range', x, 4.65, x === 10.2 ? {} : { soup: '#e8d8a0' }, { st: x === 10.2 ? 'kitchen' : 1 });
  /* lab */
  H('labbench', 14.2, 2.05, { k: 0 }, { st: 'lab' }); H('labbench', 17, 2.05, { k: 1 }, { st: 1 }); H('labbench', 14.2, 5.1, { k: 2 }, { st: 1 }); H('labbench', 17, 5.1, { k: 0 }, { st: 1 });
  /* computers */
  [20.6, 21.8, 23, 24.2].forEach((x, i) => H('library.computer', x, 1.4, i % 2 ? { scr: '#2a8a6a', cc: '#c0563a', seed: 5 } : {}, { st: i === 1 ? 'pc' : 1 }));
  /* music, writing, seminar, benches */
  H('perf.piano', 1.4, 9.4, {}, { st: 'piano' }); H('home.guitar', 4.2, 9.2, { tier: 1 }); H('library.table', 7.4, 9.6, { c: '#5a3a28', cc: '#3f6a5a', seed: 5 }, { st: 'desk' });
  H('stage', 12.4, 8.8, { w: 4.2, d: 2 }); H('perf.podium', 13.4, 9.3, {}, { z: .22, st: 'podium' }); H('mus.bench', 12.5, 11.6, {}); H('mus.bench', 14.7, 11.6, {});
  H('workbench', 19.4, 9, {}, { st: 'bench' }); H('workbench', 22.2, 9, {}, { st: 1 }); H('generic.plant', 25, 13, { s: 1.6, leaf: '#3f7a48', pot: '#f1ede4' });
  void S;
})();
defineRoom({ id: UR.workshop, name: 'Workshops & Studios', w: 26, d: 14, zoom: 0, music: 'quiet', noCrowd: true, showpiece: 'university', venue: UV.place, floor: GT.f_lino, floors: [{ x0: 0, y0: 0, x1: 7.6, y1: 8, floor: GT.f_wood }, { x0: 7.6, y0: 0, x1: 13.8, y1: 8, floor: GT.f_tile }, { x0: 0, y0: 8, x1: 6.4, y1: 14, floor: GT.f_darkwood }], bg: '#17161f', edge: '#4a3a30', wall: { color: '#e6e0d0', trim: '#5a5f6a', h: 4.4 },
  exits: [{ x: 13, y: 13.4, label: 'Up to the hall', to: 'int:' + UR.hall, use: () => G.go('int:' + UR.hall, { x: O + 21.8, y: O + 11, dir: 2 }) }], spawn: { x: 13, y: 12.7, dir: 3 }, items: WK.items, npcSpots: [],
  setup(sc) {
    const Wd = sc.world; sc.uni = { cast: {} }; sc.env = softEnv(Wd, .6, .45); for (const [x, y] of [[4, 5], [11, 4], [17, 4.5], [23, 3], [3, 11], [9, 11], [14.5, 10.5], [22, 11]]) Wd.lights.push({ x: O + x, y: O + y, z: 0, r: 6, c: '#fff4dc' });
    strip(sc, /kitchen\.range|library\.table|art\.canvases|perf\.piano|mus\.bench|home\.(easel|guitar)|library\.computer/); for (const f of sc.fixtures) f._sit = true;
    const stations = {}; for (const k in STATIONS) { const s = STATIONS[k]; stations[k] = Object.assign({}, s, { x: s.x + O, y: s.y + O, prof: { x: s.prof.x + O, y: s.prof.y + O, dir: s.prof.dir }, mates: s.mates.map(m => Object.assign({}, m, { x: m.x + O, y: m.y + O })) });
      const fx = sc.fixtures.find(f => f.item.st === k); sc.interactables.push({ x: fx ? fx.x : s.x + O, y: fx ? fx.y : s.y + O, h: 1.5, hit: 10, label: s.label, spot: s.seated ? undefined : { x: s.x + O, y: s.y + O }, range: s.seated ? 1.6 : undefined, uni: 1, station: k, visible: () => !!U() && U().stationOn(k), use: () => U().useStation(k, sc) }); }
    const prof = new Char(castSpec('kowal'), O + 13, O + 7); prof.hidden = true; prof.kind = 'npc'; sc.ents.push(prof); sc.interactables.push({ ent: prof, x: prof.x, y: prof.y, label: 'Professor', h: 1.4, hit: 8, range: 2, uni: 1, visible: () => !prof.hidden, use: () => U() && U().talk(prof.uniId, prof, sc) });
    const mates = CLASSMATES.map(id => { const c = new Char(castSpec(id), O + 13, O + 12); c.hidden = true; c.uniId = id; c.kind = 'npc'; sc.ents.push(c); sc.interactables.push({ ent: c, x: c.x, y: c.y, label: CAST[id].name, h: 1.2, hit: 6, range: 1.8, uni: 1, visible: () => !c.hidden, use: () => U() && U().talk(id, c, sc) }); return c; });
    /* open-studio regulars: a few students practising when no class is on */
    const P = students(), reg = [['easel', 0], ['pc', 2], ['lab', 1], ['bench', 0], ['desk', 1], ['kitchen', 1]].map(([k, i], n) => { const m = stations[k].mates[i], c = new Char(P[(n * 5 + 1) % P.length], m.x, m.y); c.z = m.z || 0; c.dir = m.dir; c.pose = m.anim === 'stand' ? null : m.anim; if (m.seated) c.poseOpts = { seated: true }; c.kind = 'customer'; c.roll = (n * .37) % 1; c.st = k; sc.ents.push(c); sc.interactables.push({ ent: c, x: c.x, y: c.y, label: 'Student', h: 1.2, hit: 6, range: 1.8, uni: 1, visible: () => !c.hidden, use: () => bubble(c, pick(LINES.student)) }); return c; });
    const wn = windows(sc);
    sc.uni = Object.assign(sc.uni, { stations, prof, mates, regulars: reg,
      place(k, profId, n = 3) { const s = stations[k]; prof.setSpec(castSpec(profId)); prof.uniId = profId; prof.x = s.prof.x; prof.y = s.prof.y; prof.dir = s.prof.dir; prof.z = k === 'kitchen' ? 0 : 0; prof.hidden = false; prof.pose = null; for (const c of reg) if (c.st === k) c.hidden = true;
        mates.forEach((c, i) => { const m = s.mates[i]; if (!m || i >= n) { c.hidden = true; return; } c.x = m.x; c.y = m.y; c.z = m.z || 0; c.dir = m.dir; c.pose = m.anim === 'stand' ? null : m.anim; c.poseOpts = m.seated ? { seated: true } : null; c.hidden = false; c.alpha = 0; }); },
      clear() { prof.hidden = true; for (const c of mates) { c.hidden = true; c.poseOpts = null; c.pose = null; } sc.uni.sync(); },
      sync() { const u = U(), open = !u || u.isOpen(), cls = !mates.every(c => c.hidden); for (const c of reg) c.hidden = !open || c.roll > .62 || (cls && !prof.hidden && stations[c.st] && Math.hypot(stations[c.st].x - prof.x, stations[c.st].y - prof.y) < 5); wn(); if (u) u.roomSync(sc); } });
    let tick = 0; const up0 = sc.update; sc.update = (dt, gm) => { up0(dt, gm); for (const c of mates.concat(reg)) { if (c.hidden) continue; c.t += dt; if (c.alpha !== undefined) { c.alpha += dt * 2; if (c.alpha >= 1) c.alpha = undefined; } } if (!prof.hidden) { prof.t += dt; if (prof._hold > 0) prof._hold -= dt; } if ((tick -= dt) <= 0) { tick = 1.5; sc.uni.sync(); } };
    const e0 = sc.onEnter; sc.onEnter = (o, pv) => { e0(o, pv); sc.uni.sync(); }; const x0 = sc.onExit; sc.onExit = () => { x0(); if (U()) U().leftRoom(sc); };
  },
});

registerInfo(NAME, { blurb: 'A red-brick hall with a clock tower at the top of Riverside Drive, on its own quad by the pond. Enrol at the Registrar for a course that fits round your week: two lectures, a practical with your hands, coursework, and a final. Certificates count at work. Open lecture every Wednesday night.',
  signature: 'The Ashby Lecture Theatre, where the screen follows the professor and Tunde always has one more question.',
  tryThis: ['Enrol at the Registrar: eight courses, a day or an evening section each', 'Take a seat ten minutes before your class and answer when the professor asks', 'Read by a green lamp in the Reading Room', 'Join the study group in the Commons, Tuesdays and Thursdays at five', 'Come to the free Open Lecture on Wednesday at 19:30'], activities: [] });

/* fixtures: boards, bust, trophies, portraits, gowns (only in the university's rooms) */
export function init() {
  const F = (tag, fn) => registerFixture(tag, only(fn));
  F('uni_counter', (fx, sc) => ({ label: fx.item.p.t === 'LIBRARIAN' ? 'Librarian\'s desk' : 'Registrar', hit: 12, uni: 1, use: () => U() && (fx.item.p.t === 'LIBRARIAN' ? U().talk('mott', sc.uni.cast.mott, sc) : U().registrar(sc)) }));
  F('uni_board', (fx, sc) => ({ label: { time: 'Timetable', clubs: 'Clubs & societies', work: 'Student work', exam: 'Exam results' }[fx.item.board || fx.item.p.k] || 'Noticeboard', hit: 10, uni: 1, visible: () => !fx.ob.hidden, use: () => U() && U().board(fx.item.board || fx.item.p.k, sc) }));
  F('uni_bust', () => ({ label: 'The Founder', hit: 10, uni: 1, use: () => U() && U().look('bust') }));
  F('uni_trophy', () => ({ label: 'Trophy cabinet', hit: 10, uni: 1, use: () => U() && U().look('trophy') }));
  F('uni_portrait', fx => ({ label: 'Portrait', hit: 8, uni: 1, use: () => U() && U().look('portrait', fx.item.p.k || 0) }));
  F('uni_gowns', () => ({ label: 'Gown rail', hit: 10, uni: 1, use: () => U() && U().look('gowns') }));
}
