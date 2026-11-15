// Maple Bay Observatory — three rooms, entered by the city door `door:observatory` on the white dome on Hillcrest.
//   `observatory` (30 x 20, ground floor; (0,0) = back corner):
//       Rotunda (x10-20, y8-20: Foucault pendulum, ticket desk, exit)      Gallery (x0-10 + the back strip x10-20, y0-8: meteorites, scale of the planets, orrery,
//       gravity well, weight scale, rocket launcher, moon-phase wall, talk corner)      Star Shop + Comet Cocoa (x20-30, y9.5-20)      Theatre foyer (x20-30, y0-9.5:
//       planetarium doors, stairs to the dome).  The rotunda, shop, cocoa counter and foyer are free; the gallery, planetarium and roof need a day ticket.
//   `observatory:planetarium` (14 x 14): the Star Theatre. Both back walls are the dome: one live canvas (observatory2.js) wrapped round the corner. 36 reclining seats.
//       scene.star = { phase 'idle'|'doors'|'dim'|'show'|'applause'|'exit', prog, t, begin(progId?, force?), sit(seat), seats, audience(), state() }
//   `observatory:roof` (24 x 16): the Great Telescope under its dome (x0-9, y0-9; the slit opens on clear nights and the telescope slews) and the open terrace
//       (small telescopes, constellation finders, deckchairs, the city panorama; star-party guests on Saturday nights).
//   scene.obs (ground floor) = { sync(), zoneAt(x, y), spin(sec), launch(), coin(), docent, astro, talk, startTalk(force) }
//   scene.obs (roof) = { sync(), slew(az, alt) -> seconds, astro, guests, open() -> slit 0..1 }
// Fixture tags handled here (only inside these rooms): obs_pendulum, obs_orrery, obs_meteorite (item.i), obs_well, obs_scale, obs_rocket, obs_plaque (item.fact), obs_bench,
//   obs_stairs, obs_theatre, obs_board, obs_lectern, obs_gate, obs_scope, obs_tscope (item.n), obs_finder, obs_sketch, obs_deckchair, obs_partycocoa, obs_stairhead
//   + item tags obs_shop (item.venue), obs_ticket.  Gameplay lives in sim/observatory.js (G.observatory).
import { G } from '../../core/game.js';
import { GT } from '../../engine/world.js';
import { Char } from '../../core/char.js';
import { pixSprite } from '../../engine/sprites.js';
import * as R from '../../engine/raster.js';
import { ambient, ambientIndoor } from '../../core/clock.js';
import { defineRoom, registerFixture } from '../interior.js';
import { toast, bubble } from '../../ui/kit.js';
import { caption } from '../../ui/goals.js';
import { crowd, walkers } from './_show_life.js';
import { specs } from './_airport_life.js';
import { registerInfo } from './unique_rooms.js';
import { sfx, unlock } from '../../sim/_shows_audio.js';
import { rocketShape } from '../../art/showpiece/observatory.js';
import { phaseIdx, CONSTELLATIONS } from '../../art/showpiece/_obs_lib.js';
import { OBS_VENUES, OBS_HOURS, SHOW_TIMES, TALK_TIMES, PROGRAMMES, TALKS } from '../../data/observatory.js';
import { SKY_W, SKY_H, drawShow, drawIdle } from './observatory2.js';

const O = 1, pick = a => a[Math.floor(Math.random() * a.length)];
const OB = () => G.observatory;
const safe = fn => { try { return fn(); } catch (e) { return undefined; } };
const mk = () => { const items = [], spots = []; return { items, spots, A: (id, x, y, p, o) => { const it = Object.assign({ id: 'furn.' + id, x, y, p: p || {} }, o); items.push(it); return it; }, C(id, x, y, p, o) { return this.A('obs.' + id, x, y, p, o); }, WY(id, at, p, o) { const it = Object.assign({ id: 'furn.obs.' + id, wall: 'y', at, p: p || {} }, o); items.push(it); return it; }, WX(id, at, p, o) { const it = Object.assign({ id: 'furn.obs.' + id, wall: 'x', at, p: p || {} }, o); items.push(it); return it; }, S: (x, y, dir, o) => spots.push(Object.assign({ x, y, dir }, o)) }; };
const setP = (o, q) => { o.p = Object.assign({}, o.p, q); o._key = null; };
const by = (Wd, k) => Wd.objs.filter(o => o.data && o.data[k]);
const lp = (m, cam, pool, x, y, z, r, c, a) => { const s = R.WS(x, y, z), ps = pool(r, c); m.globalAlpha = Math.max(0, Math.min(1, a)); m.drawImage(ps, Math.round(s[0]) - cam.x - (ps.width >> 1), Math.round(s[1]) - cam.y - (ps.height >> 1)); };
const clock = h => String(Math.floor(h)).padStart(2, '0') + ':' + String(Math.round((h % 1) * 60)).padStart(2, '0');
const isOpenNow = () => { const h = G.now().hf; return h >= OBS_HOURS[0] && h < OBS_HOURS[1]; };

const LINES = {
  visitor: ['I came for the cocoa and stayed for Saturn.', 'They let you TOUCH the meteorite. I have touched space.', 'The pendulum knocked a peg over while I was watching. I clapped. On my own.', 'My grandmother brought me here when the planetarium still had the old projector.', 'Go up at night. The city looks like someone spilled a jewellery box.', 'Apparently I weigh nothing on the Moon. I knew it was the planet\'s fault.', 'Shh. Listen. You can hear the pendulum wire hum.', 'The show made me cry a little. The supernova one. Do not tell anyone.'],
  kid: ['My rocket went the HIGHEST!', 'Is the Sun really that big? REALLY?', 'I put a coin in the swirly thing and it went round FOREVER.', 'I want to be an astronaut AND a dinosaur.', 'Can we see the rings again? Pleeease?'],
  staff: ['Welcome to the observatory! A day ticket covers the gallery, every planetarium show and the telescopes upstairs.', 'Shows at two, four, six, eight and ten. The dome opens when it is dark and clear.', 'Star party every Saturday night on the terrace. Bring a coat.'],
  shop: ['The star wheel is the best eight dollars you will spend this year.', 'The pocket meteorites are real. Every one came from space, via a field in Arizona.', 'Plush Saturn is our bestseller. The ring comes off. Do not ask how I know.'],
  cocoa: ['Supernova has marshmallows, sprinkles and a sparkler. The sparkler is not edible.', 'Take your cocoa up to the terrace if you like. Everybody does.', 'Night Owl tea, for the ones staying till midnight.'],
  roof: ['Look. LOOK. You can see the rings with this little thing.', 'My eyes took ten minutes to adjust. Now I can see thousands.', 'That is the harbour down there. And the bright one above it is a planet.', 'Shooting star! Did you see it? Just there!', 'I come up whenever it is clear. It is cheaper than therapy.', 'The Moon looks close enough to lick.'],
  roofDay: ['You can see the whole bay from up here.', 'Come back after dark. That is when they open the big dome.', 'The little telescopes are pointed at the harbour in the daytime. I watched a ferry for ten minutes.'],
  guest: ['Have a look, it is on Saturn. Do not touch the tube, just the eyepiece.', 'This is my own telescope. I ground the mirror in my garage. It took a year.', 'Clear skies! That is what we say instead of goodbye.', 'I have got the double star in here. One gold, one blue. Go on.', 'Clouded out again. An astronomer is an expert in weather disappointment.'],
  aud: ['I hope it is the one with the planets.', 'The seats tilt back. Mind you do not fall asleep.', 'Shh, it is starting soon.'],
};

/* =================================================================== ground floor */
const W = 30, D = 20, M = mk();
export const ZONES = [
  { id: 'rotunda', name: 'Rotunda', x0: 10, y0: 8, x1: 20, y1: 20 }, { id: 'gallery', name: 'Exhibit Gallery', x0: 0, y0: 0, x1: 10, y1: 20 }, { id: 'gallery', name: 'Exhibit Gallery', x0: 10, y0: 0, x1: 20, y1: 8 },
  { id: 'shop', name: 'The Star Shop & Comet Cocoa', x0: 20, y0: 9.5, x1: 30, y1: 20 }, { id: 'foyer', name: 'Theatre Foyer', x0: 20, y0: 0, x1: 30, y1: 9.5 },
];
const inGallery = (x, y) => x < 10 || (x < 20 && y < 8);
const PC = { x: 15, y: 13.5 }; // pendulum centre
function buildMain() {
  const { A, S } = M, C = M.C.bind(M), WY = M.WY.bind(M), WX = M.WX.bind(M);
  // ---- walls
  WY('wallpanel', 0, { w: 10, kind: 'planets' }); WY('wallpanel', 10, { w: 2, kind: 'plain', seed: 5 }); WY('wallpanel', 12, { w: 8, kind: 'moonwall', phase: 4 }, { moon: 1 }); WY('wallpanel', 20, { w: 2, kind: 'poster', prog: 0 }, { poster: 1 });
  WY('wallpanel', 22, { w: 4, kind: 'plain', seed: 9 }); WY('wallpanel', 26, { w: 4, kind: 'plain', seed: 12 });
  WX('wallpanel', 0, { w: 4, kind: 'window', u0: 20 }, { sky: 1 }); WX('wallpanel', 4, { w: 4, kind: 'const', a: 'orion', b: 'ursa' }); WX('wallpanel', 8, { w: 4, kind: 'plain', seed: 3 }); WX('wallpanel', 12, { w: 4, kind: 'window', u0: 90 }, { sky: 1 }); WX('wallpanel', 16, { w: 4, kind: 'const', a: 'cygnus', b: 'leo' });
  // ---- rotunda
  C('pendulum', 13, 11.5, { down: 0 }, { pend: 1 }); C('plaque', 17.5, 15.6, {}, { fact: 'pendulum' });
  C('desk', 11, 17, { kind: 'ticket', w: 2.5 }, { tags: ['obs_ticket'] }); S(12.25, 16.55, 1, { kind: 'staff', label: 'Ticket desk', lines: LINES.staff });
  C('rail', 10, 8, { w: 3.5 }, { flip: true }); C('gate', 10, 11.5, { w: 3, name: 'GALLERY' }, { flip: true, gate: 1 }); C('rail', 10, 14.5, { w: 5.5 }, { flip: true });
  C('rail', 10.5, 8, { w: 3 }); C('gate', 13.5, 8, { w: 3, name: 'GALLERY' }, { gate: 1 }); C('rail', 16.5, 8, { w: 3.5 });
  for (const y of [9, 13.5, 18]) C('column', 20, y); C('lamp', 19.2, 19.2); C('bench', 16.8, 17.6);
  C('hang', 14.5, 17.5, { kind: 'comet' }, { z: 3.3, comet: 1 }); C('plaque', 13.8, 18.6, { c: '#b8862c' }, { comet: 1, fact: 'comet' });
  S(13.6, 16.3, 0, { p: .6 }); S(17.3, 12.2, 2, { p: .7 }); S(15, 10.9, 1, { p: .5, age: 'kid', lines: LINES.kid }); S(12.6, 13.6, 0, { busy: 1 }); S(16.2, 16.2, 3, { busy: 1, anim: 'phone' }); S(17.3, 17.92, 1, { seated: true, z: .46, p: .5 });
  // ---- gallery: left hall
  for (let i = 0; i < 3; i++) C('meteorite', .8, 1.2 + i * 2.2, { kind: i }, { flip: true, i });
  C('hang', 4.2, 3.6, { kind: 'jupiter', r: 11 }, { z: 3.1 }); C('hang', 7.6, 2.6, { kind: 'saturn', r: 7 }, { z: 3.3 }); C('hang', 6, 6.4, { kind: 'earth', r: 5 }, { z: 3 }); C('hang', 3, 7.6, { kind: 'mars', r: 4 }, { z: 2.9 });
  C('plaque', 4.5, 1, {}, { fact: 'planets' }); C('bench', 7, 4.6); C('lamp', 9, .8); C('lamp', .7, 8.6);
  C('board', .6, 9.4, { s: '' }, { flip: true, board: 1 });
  C('orrery', 4, 9.5, { a: 0 }, { orr: 1 }); C('plaque', 7.3, 11.4, {}, { fact: 'orrery' });
  C('gravitywell', 1, 14, {}); C('plaque', 3.3, 14.6, {}, { fact: 'well' });
  C('scale', 6.4, 15.4, {}, { scale: 1 }); C('plaque', 8.1, 15.8, {}, { fact: 'scale' });
  C('rocket', 1.5, 17.8, {}, { rocket: 1 }); C('plaque', 3.5, 18.2, {}, { fact: 'rocket' }); C('bench', 6.5, 18.6); C('lamp', 9, 19.2);
  S(2.3, 2.1, 2, { p: .6 }); S(2.3, 4.3, 2, { p: .5, age: 'kid', lines: LINES.kid }); S(5, 2, 3, { p: .6 }); S(6.4, 13.2, 2, { p: .6 }); S(3.6, 13.1, 3, { busy: 1 }); S(2.4, 16.5, 3, { p: .6, age: 'kid', lines: LINES.kid }); S(3.2, 16.6, 3, { busy: 1 });
  S(3.8, 19.3, 2, { age: 'kid', lines: LINES.kid, p: .7 }); S(4.6, 18.8, 2, { busy: 1, age: 'kid', lines: LINES.kid }); S(7.2, 17, 3, { busy: 1, anim: 'phone' }); S(7.45, 4.92, 1, { seated: true, z: .46, p: .5 }); S(7.95, 18.92, 1, { seated: true, z: .46, p: .4 }); S(2.2, 10.6, 2, { p: .4 });
  // ---- gallery: back strip (talk corner + moon wall)
  C('screen', 10.2, .6, { slide: 0 }, { screen: 1 }); C('lectern', 12.5, 1.3, {}, {});
  for (const [x, y] of [[10.5, 3.2], [12.6, 3.2], [10.5, 4.8], [12.6, 4.8]]) { C('bench', x, y, { rev: 1 }, { talkBench: 1 }); S(x + .45, y + .32, 3, { seated: true, z: .46, talk: 1, p: .9 }); S(x + 1.15, y + .32, 3, { seated: true, z: .46, talk: 1, p: .6 }); }
  C('plaque', 15.5, 1.2, {}, { fact: 'moonwall' }); C('globe', 18.6, .9, { kind: 'moon' }); C('lamp', 19.2, 6.8); C('scopecase', 15.5, 5.8); C('plaque', 17.4, 6.2, {}, { fact: 'scope' });
  S(14.6, 2.3, 3, { p: .6 }); S(17.6, 3.3, 3, { p: .5, anim: 'phone' }); S(16.2, 7, 3, { busy: 1 }); S(18.2, 4.6, 2, { busy: 1 });
  // ---- foyer
  C('theatredoor', 22.5, .1, { t: '' }, { tdoor: 1 }); C('rail', 21.5, 3, { w: 2 }); C('rail', 25, 3, { w: 1.5 }); C('hang', 24, 5.5, { kind: 'saturn', r: 9 }, { z: 3.4 }); C('stairs', 27, .6); C('lamp', 21.4, .8); C('lamp', 26.1, .8); C('bench', 21, 6); C('bench', 24.5, 7.4); C('globe', 29, 7.6, { kind: 'mars' });
  S(22.2, 3.6, 3, { busy: 1 }); S(25.6, 2.6, 2, { p: .5 }); S(21.45, 6.32, 1, { seated: true, z: .46, p: .5 }); S(25.65, 7.72, 1, { seated: true, z: .46, busy: 1 }); S(26.3, 4.6, 0, { p: .5, anim: 'phone' });
  // ---- Star Shop + Comet Cocoa
  C('shelf', 21.5, 9.5, { kind: 'shop', w: 3 }); C('desk', 21.5, 10.5, { kind: 'shop', w: 3 }, { tags: ['obs_shop'], venue: OBS_VENUES.shop, label: 'The Star Shop' }); S(23, 10.05, 1, { kind: 'staff', label: 'The Star Shop', lines: LINES.shop });
  C('shelf', 25.5, 9.5, { kind: 'cocoa', w: 4 }); C('desk', 26, 10.5, { kind: 'cocoa', w: 3 }, { tags: ['obs_shop'], venue: OBS_VENUES.cocoa, label: 'Comet Cocoa' }); S(27.5, 10.05, 1, { kind: 'staff', outfit: 'cook', label: 'Comet Cocoa', lines: LINES.cocoa });
  for (const [x, y] of [[22, 13.6], [25, 13.6], [28, 13.6], [23.5, 16.6], [26.5, 16.6]]) A('cafe.tableset', x, y, { c: '#2d3a6e', cc: '#f4d68a' }, { cafe: 1 });
  C('globe', 28.8, 18.4, { kind: 'earth' }); C('lamp', 29.2, 11.4); C('lamp', 21, 19.2);
  S(23, 11.75, 3, { p: .6 }); S(27.4, 11.75, 3, { p: .7 }); S(28.2, 11.9, 3, { busy: 1, anim: 'phone' }); S(21.2, 15.4, 0, { busy: 1 });
}
buildMain();

const DOC_SPOTS = [[2.4, 3.2, 2, 'meteor'], [5.6, 13.2, 3, 'orrery'], [3.6, 16.6, 3, 'well'], [7.6, 16.8, 2, 'scale'], [5.2, 2, 3, 'planets'], [16.4, 2.6, 3, 'moonwall'], [16.4, 9.6, 1, 'pendulum']];
function drawBob(bx, by) { // bob at local (0,0,0); the wire runs up to the apex above the pit centre
  const a = R.PW(-bx, -by, 6.6), b = R.PW(0, 0, .16); R.line(a, b, '#8a8a94'); R.ball(0, 0, .16, .15, '#d9a441', { t: '#f4d68a', d: '#a8762a' }); const s = R.PW(0, 0, 0); R.px(Math.round(s[0]), Math.round(s[1]), R.C('#5a4a2a')); R.px(Math.round(s[0]), Math.round(s[1]) - 1, R.C('#a8762a'));
}
defineRoom({ id: 'observatory', name: 'Maple Bay Observatory', w: W, d: D, zoom: 0, music: 'quiet', noCrowd: true, showpiece: 'observatory', venue: OBS_VENUES.place,
  floor: GT.f_stone, bg: '#0e1226', edge: '#3a3450', wall: { color: '#1c2548', trim: '#d9a441', h: 4.6 },
  exits: [{ x: 15, y: 19.5, label: 'Exit to Hillcrest', poi: 'door:observatory' }], spawn: { x: 15, y: 18.6, dir: 3 }, items: M.items, npcSpots: M.spots, zones: ZONES,
  setup(sc) {
    const Wd = sc.world; Wd.zmax = 8;
    const sky = by(Wd, 'sky'), gates = by(Wd, 'gate'), moon = by(Wd, 'moon')[0], poster = by(Wd, 'poster')[0], pend = by(Wd, 'pend')[0], orr = by(Wd, 'orr')[0], board = by(Wd, 'board')[0], scaleOb = by(Wd, 'scale')[0], rocketOb = by(Wd, 'rocket')[0], screen = by(Wd, 'screen')[0], tdoor = by(Wd, 'tdoor')[0], comet = by(Wd, 'comet');
    // ---- floors: one ground decal
    Wd.decal({ x0: O, y0: O, x1: O + W, y1: O + D, draw(Rr) { const h2 = Rr.hash2;
      const marble = (x, y) => { const dx = x - PC.x, dy = y - PC.y, d = Math.hypot(dx, dy), a = Math.atan2(dy, dx); if (d < 2.6) return '#bdb6a8'; if (d < 2.75) return '#d9a441'; if (d < 4.6) { const k = Math.floor((a + Math.PI) / (Math.PI / 8)); return Math.abs(((a + Math.PI) / (Math.PI / 8)) % 1 - .5) > .46 ? '#a8a294' : k & 1 ? '#2d3a6e' : '#e6e0d4'; } if (d < 4.75) return '#d9a441'; const fx = x - Math.floor(x), fy = y - Math.floor(y); if (fx < .05 || fy < .05) return '#c4bdb0'; return (Math.floor(x) + Math.floor(y)) & 1 ? '#e6e0d4' : '#dcd5c8'; };
      const carpet = (x, y) => { const k = h2(Math.floor(x * 16), Math.floor(y * 16), 7), fx = (x + .5) % 2, fy = (y + .5) % 2; if (Math.abs(fx - 1) + Math.abs(fy - 1) < .13) return '#d9a441'; return k < .08 ? '#1f2a56' : k > .93 ? '#2d3a6e' : '#252f60'; };
      const wood = (x, y) => { const r = Math.floor(y * 2), xx = x + (r & 1) * .9, fy = y * 2 - r; if (fy < .1 || (xx % 1.8) < .06) return '#5a3a26'; return h2(Math.floor(xx / 1.8), r, 9) > .6 ? '#8a5f40' : '#7a5236'; };
      const red = (x, y) => { const k = h2(Math.floor(x * 16), Math.floor(y * 16), 3); return (Math.abs(x - 20.25) < .12 || Math.abs(y - 9.2) < .1) ? '#d9a441' : k < .1 ? '#6a2030' : k > .92 ? '#8a3444' : '#7a2a3a'; };
      for (const [x0, y0, x1, y1, f] of [[10, 8, 20, 20, marble], [0, 0, 10, 20, carpet], [10, 0, 20, 8, carpet], [20, 9.5, 30, 20, wood], [20, 0, 30, 9.5, red]]) Rr.qz(O + x0, O + x1, O + y0, O + y1, 0, (x, y) => f(x - O, y - O)); } }); Wd.version++;
    for (const o of comet) Wd.free(o.B[0], o.B[1], o.B[3], o.B[4]);
    // ---- the pendulum bob, coins and the rocket (live entities)
    const bob = { x: O + PC.x, y: O + PC.y, z: .34, bb: [-.15, -.15, .15, .15, .4], k: 0, s: 0, th: 0, sprite() { return pixSprite('obsbob|' + this.s + '|' + this.k, [-40, -126, 40, 8], () => drawBob(this.dx, this.dy)); } }; sc.ents.push(bob);
    const coins = []; const well = sc.byTag('obs_well')[0];
    const dropCoin = () => { if (!well || coins.length > 5) return; const c = { a: Math.random() * 6.28, r: .9, x: well.x, y: well.y, z: 1.06, t: 0, bb: [-.05, -.05, .05, .05, .1], sprite() { const f = Math.floor(this.a * 2) & 1; return pixSprite('obscoin' + f, [-2, -2, 2, 2], () => { const s = R.PW(0, 0, 0); R.px(s[0], s[1], R.C(f ? '#ffe070' : '#d9a441')); R.px(s[0] + 1, s[1], R.C('#a8762a')); }); } }; coins.push(c); sc.ents.push(c); };
    const rk = { on: false, x: 0, y: 0, z: 0, v: 0, t: 0, hidden: true, bb: [-.1, -.1, .1, .1, .5], sprite: () => pixSprite('obsrocket', [-3, -11, 4, 2], () => rocketShape(0, 0, 0)) }; sc.ents.push(rk);
    const launch = (pow = 1) => { if (rk.on || !rocketOb) return 0; rk.on = true; rk.hidden = false; rk.x = rocketOb.x + 1.23; rk.y = rocketOb.y + .55; rk.z = .5; rk.v = 5.5 + pow * 3.2; rk.top = 0; rk.vx = (Math.random() - .5) * .5; setP(rocketOb, { away: 1 }); return rk.v * rk.v / 19.6 + .5; };
    // ---- life
    const seats = []; for (const f of sc.fixtures) if (/cafe\.tableset/.test(f.asset.id)) f.seats.forEach((s, i) => seats.push({ x: s.x - O, y: s.y - O, z: s.z, dir: s.dir === undefined ? 1 : s.dir, seated: true, p: .5, busy: (seats.length + i) % 3 === 2 ? 1 : 0 }));
    const cr = crowd(sc, sc.def.npcSpots.concat(seats), { seed: 71, fill: .7, lines: LINES.visitor });
    const N = { h0: [15, 18.6], r1: [12, 15.6], r2: [18.2, 15.4], r3: [18.4, 10.2], r4: [11.6, 10], ga: [9.2, 13], gb: [15, 7.2], l1: [3.4, 12.6], l2: [3.2, 8.6], l3: [2.6, 4.4], l4: [5.6, 2.2], l5: [8.6, 6.6], l6: [8, 13.4], l7: [5, 17], l8: [4.4, 19.2], l9: [8.6, 17.4], b1: [15, 5], b2: [14.8, 2.4], b3: [17.6, 2.6], b4: [18.6, 6.8], f1: [21, 8.6], f2: [24, 3], f3: [26.4, 5], f4: [21.4, 4], s0: [20.9, 11.6], s1: [23, 12], s2: [27.4, 12], s3: [24.6, 15.2], s4: [21.2, 17.6], s5: [28.8, 16] };
    const ROUTES = [['h0', 'r1', 'ga', 'l1*', 'l2', 'l3*', 'l4*', 'l5', 'l6', 'l7*', 'l8', 'l9', 'ga', 'r1', 'h0'], ['h0', 'r2', 'r3', 'gb', 'b1', 'b2*', 'b3*', 'b4', 'b1', 'gb', 'r4', 'r1*', 'h0'], ['h0', 'r2*', 's0', 's1*', 's2*', 's3', 's4', 'r2', 'h0'], ['h0', 'r2', 'r3', 'f1', 'f4', 'f2*', 'f3', 'f1', 'r3', 'r4*', 'r1', 'h0'], ['h0', 'r1', 'r4', 'gb', 'b1', 'l5', 'l4*', 'l3', 'l2', 'l1*', 'l6', 'l7*', 'l9', 'ga', 'r1', 'r2', 's0', 's1*', 's3', 's4', 'r2', 'h0'], ['h0', 'r2', 's0', 's2*', 's5', 's3', 'r2', 'r3*', 'r4', 'r1', 'h0']];
    const lane = () => { const r = pick(ROUTES), stay = r.map(k => k.endsWith('*')), keys = r.map(k => k.replace('*', '')); if (Math.random() < .3) { keys.reverse(); stay.reverse(); }
      return { pts: keys.map((k, i) => Object.assign({ x: N[k][0] + O + (Math.random() - .5) * .5, y: N[k][1] + O + (Math.random() - .5) * .4 }, stay[i] ? { wait: 5 + Math.random() * 6, pose: Math.random() < .3 ? 'phone' : null } : null)), kind: Math.random() < .5 ? 'stroll' : 'walk' }; };
    const wk = walkers(sc, { n: 12, route: lane, lines: LINES.visitor, label: 'Visitor' });
    sc.life = { crowd: cr, walkers: wk, count: () => cr.count() + wk.count(), level: -1 };
    // ---- docent + astronomer (by day she works at the moon wall; at night she is up at the telescope)
    const P = specs(), mkStaff = (spec, label, x, y) => { const c = new Char(spec, x + O, y + O); c.speed = 1.5; c.kind = 'staff'; c.label = label; sc.ents.push(c); return c; };
    const doc = mkStaff(Object.assign({}, P.staff[3], { topColor: '#2d3a6e', top: 'vest', hat: null }), 'Gus, docent', DOC_SPOTS[6][0], DOC_SPOTS[6][1]); let di = 6, dw = 6; doc.dir = 1;
    sc.interactables.push({ ent: doc, x: doc.x, y: doc.y, label: 'Gus, the docent', h: 1.3, hit: 8, range: 1.8, visible: () => !doc.hidden, use: () => { doc._hold = 5; if (!talk.on) doc.faceTo(G.player.x, G.player.y); if (OB()) OB().talkDocent(doc, DOC_SPOTS[di][3], talk); } });
    const astro = mkStaff(Object.assign({}, P.adult[17], { top: 'coat', topColor: '#f4f0e8', glasses: true }), 'Dr. Halvorsen, astronomer', 17, 1.9); astro.dir = 3; astro.pose = 'read';
    sc.interactables.push({ ent: astro, x: astro.x, y: astro.y, label: 'Dr. Halvorsen, astronomer', h: 1.3, hit: 8, range: 1.8, visible: () => !astro.hidden, use: () => { astro._hold = 6; astro.pose = null; astro.faceTo(G.player.x, G.player.y); if (OB()) OB().talkAstronomer(astro); } });
    // ---- the astronomy talk
    const talk = { on: false, t: 0, i: 0, n: 0, day: -1, hour: -1, joined: false, topic: null };
    const lect = { x: O + 12.9, y: O + .85 };
    const startTalk = force => { if (talk.on) return false; talk.on = true; talk.t = force ? -2 : -8; talk.i = 0; talk.topic = TALKS[(G.now().day + (talk.n++)) % TALKS.length]; doc.pose = null; if (!doc.goTo(Wd, lect.x, lect.y)) { doc.x = lect.x; doc.y = lect.y; } if (screen) setP(screen, { slide: 1 + (talk.n % 3) }); bubble(doc, 'Astronomy talk in the gallery, starting in a moment! Find a bench.'); G.emit('observatory:talkstart', talk.topic.title); sync(); return true; };
    const endTalk = () => { talk.on = false; if (screen) setP(screen, { slide: 0 }); doc.pose = null; dw = 2; if (talk.joined && OB()) OB().talkDone(talk); talk.joined = false; sync(); };
    // ---- sync with the clock / weather / tickets
    let view = null, wxv = null, tick = 0, gateOpen = null, ph = -1, pdown = -1, sk = null, hadComet = null, nextT = '', open = null, bz = null, oa = 0, ot = 0, spin = 0, wf = 0, wt = 0, ct = 4, okPos = null, lastT = 0, scT = 0, kt = 8;
    function sync() {
      const n = G.now(), h = n.hf, s = OB() ? OB().sky() : { time: 'day', wx: null, moon: .5 }, isOpen = h >= OBS_HOURS[0] && h < OBS_HOURS[1];
      if (s.time !== view || s.wx !== wxv) { view = s.time; wxv = s.wx; for (const o of sky) setP(o, { time: view, wx: wxv, frame: 0 }); Wd.bg = view === 'night' ? '#0a0e22' : '#141a34'; }
      const pi = phaseIdx(s.moon); if (pi !== ph && moon) { ph = pi; setP(moon, { phase: pi }); }
      const dn = Math.max(0, Math.min(24, Math.floor((h - OBS_HOURS[0]) / 11 * 24))); if (dn !== pdown && pend) { pdown = dn; setP(pend, { down: dn }); }
      const tk = !!(OB() && OB().hasTicket()), go = isOpen && tk; if (go !== gateOpen) { gateOpen = go; for (const o of gates) setP(o, { open: go ? 1 : 0 }); }
      const ms = OB() ? OB().moonSketches() : ''; if (ms !== sk && board) { sk = ms; setP(board, { s: ms }); }
      const hc = !!(OB() && OB().cometDone()); if (hc !== hadComet) { hadComet = hc; for (const o of comet) o.hidden = !hc; }
      const nx = OB() ? OB().shows.next() : null, nt = nx ? clock(nx.h) : ''; if (nt !== nextT && tdoor) { nextT = nt; setP(tdoor, { t: nt }); if (poster && nx) setP(poster, { prog: Math.max(0, PROGRAMMES.findIndex(p => p.id === nx.prog.id)) }); }
      const wkend = n.weekday >= 5, lvl = !isOpen ? 0 : (h < 14.5 ? .4 : h < 18 ? .62 : h < 22 ? .72 : .45) + (wkend ? .2 : 0), busy = isOpen && (wkend ? h >= 14 && h < 23 : h >= 18.5 && h < 22);
      if (lvl !== sc.life.level || busy !== bz || isOpen !== open || talk.on !== sc.life.talk) { sc.life.level = lvl; bz = busy; open = isOpen; sc.life.talk = talk.on;
        for (const c of cr.list) { const sp = c.spot; c.hidden = sp.kind === 'staff' ? false : !isOpen || (sp.talk ? !talk.on || c.roll > sp.p : sp.busy ? !busy || c.roll > lvl + .25 : c.roll > (sp.p !== undefined ? Math.min(sp.p, lvl + .1) + (lvl > .8 ? .2 : 0) : lvl)); }
        wk.setActive(!isOpen ? 0 : Math.round(3 + lvl * 10), !isOpen); doc.hidden = !isOpen; }
      astro.hidden = !isOpen || (s.time === 'night');
      if (isOpen && !talk.on) for (const th of TALK_TIMES) if (h >= th && h < th + .25 && (talk.day !== n.day || talk.hour !== th)) { talk.day = n.day; talk.hour = th; startTalk(false); }
      sc.life.open = isOpen;
    }
    sc.obs = { sync, zoneAt: (x, y) => { for (const z of ZONES) if (x >= z.x0 && x < z.x1 && y >= z.y0 && y < z.y1) return z; return null; }, spin(sec = 6) { spin = sec; }, launch, coin: dropCoin, docent: doc, astro, talk, startTalk, endTalk, bob, nodes: N, routes: ROUTES, scaleLit(i) { if (scaleOb) setP(scaleOb, { lit: i }); scT = i >= 0 ? 6 : 0; } };
    sc.env = t => { const b = ambientIndoor(t); return { amb: b.amb, dark: Math.min(.8, b.dark), bg: Wd.bg, night: b.night }; };
    sync();
    const u0 = sc.update; sc.update = (dt, gm) => {
      u0(dt, gm); cr.update(dt); wk.update(dt);
      if ((tick -= dt) <= 0) { tick = 1.5; sync(); }
      // pendulum: 4 s period; the swing plane turns half a circle over the opening hours
      { const h = G.now().hf, f = Math.max(0, Math.min(1, (h - OBS_HOURS[0]) / 11)), k = Math.round(f * 24), th = -Math.PI / 2 + k / 24 * Math.PI, s = Math.round(Math.sin(G.time * Math.PI / 2) * 6); bob.k = k; bob.s = s; bob.dx = Math.cos(th) * 1.38 * s / 6; bob.dy = Math.sin(th) * 1.38 * s / 6; bob.x = O + PC.x + bob.dx; bob.y = O + PC.y + bob.dy; }
      // orrery
      if ((ot += dt) > (spin > 0 ? .05 : .28)) { ot = 0; oa = (oa + 1) % 48; if (orr) setP(orr, { a: oa }); } if (spin > 0) spin -= dt;
      if (scT > 0 && (scT -= dt) <= 0 && scaleOb) setP(scaleOb, { lit: -1 });
      if (wxv && (wt += dt) > .3) { wt = 0; wf = (wf + 1) % 8; for (const o of sky) setP(o, { frame: wf }); }
      // coins circle the gravity well
      if (sc.life.open && (ct -= dt) <= 0) { ct = 9 + Math.random() * 16; if (sc.life.level > .3) dropCoin(); }
      if (sc.life.open && (kt -= dt) <= 0) { kt = 11 + Math.random() * 14; if (!rk.on && !G.busy && cr.list.some(c => !c.hidden && c.spot.age === 'kid' && c.spot.y > 17 && c.spot.x < 6)) launch(.2 + Math.random() * .7); }
      for (let i = coins.length - 1; i >= 0; i--) { const c = coins[i]; c.t += dt; c.r = Math.max(.05, .9 - c.t * .1 - c.t * c.t * .004); c.a += dt * (1.6 / Math.max(.12, c.r)) ; c.x = well.x + Math.cos(c.a) * c.r; c.y = well.y + Math.sin(c.a) * c.r; c.z = 1.02 - (.9 - c.r) * .08; if (c.r <= .07) { coins.splice(i, 1); const j = sc.ents.indexOf(c); if (j >= 0) sc.ents.splice(j, 1); } }
      // rocket
      if (rk.on) { rk.z += rk.v * dt; rk.v -= 9.8 * dt * (rk.v < 0 ? .35 : 1); rk.x += rk.vx * dt; rk.top = Math.max(rk.top, rk.z); if (rk.z <= .4 && rk.v < 0) { rk.on = false; rk.hidden = true; if (rocketOb) setP(rocketOb, { away: 0 }); } }
      // the ticket line
      const p = G.player, rx = p.x - O, ry = p.y - O;
      if (!gateOpen && inGallery(rx, ry) && !G.busy) { if (okPos) { p.x = okPos.x; p.y = okPos.y; } else { p.x = O + 15; p.y = O + 17; } p.stop(); G.target = null; G.pending = null; if (G.time - lastT > 3) { lastT = G.time; toast(sc.life.open ? '"Ticket, please!" The gallery needs a day ticket. The desk is by the door.' : 'The gallery is roped off for the night.', 'info', 3200); } }
      else if (!inGallery(rx, ry)) { if (!okPos) okPos = { x: p.x, y: p.y }; else { okPos.x = p.x; okPos.y = p.y; } }
      // docent: wanders the exhibits; gives the talk
      if (talk.on) {
        if (doc.path) { doc.move(Wd, dt); if (!doc.path) { doc.dir = 1; } }
        else { doc.t += dt; doc.moving = false; doc.dir = 1; talk.t += dt * (talk.fast || 1); const L = talk.topic.lines, at = talk.i * 7; if (talk.t >= at && talk.i < L.length) { doc.pose = 'talk'; bubble(doc, L[talk.i], 6200); talk.i++; } if (talk.t > L.length * 7 + 1) endTalk(); }
      } else if (doc._hold > 0) { doc._hold -= dt; doc.t += dt; doc.moving = false; }
      else if (doc.path) { doc.pose = null; doc.move(Wd, dt); if (!doc.path) { doc.dir = DOC_SPOTS[di][2]; dw = 8 + Math.random() * 8; } }
      else { doc.t += dt; doc.moving = false; if ((dw -= dt) <= 0) { di = (di + 1 + Math.floor(Math.random() * 3)) % DOC_SPOTS.length; if (!doc.goTo(Wd, DOC_SPOTS[di][0] + O, DOC_SPOTS[di][1] + O)) dw = 3; } }
      if (astro._hold > 0) { astro._hold -= dt; if (astro._hold <= 0) { astro.dir = 3; astro.pose = 'read'; } } astro.t += dt;
    };
    const e0 = sc.onEnter; sc.onEnter = (o, pv) => { e0(o, pv); view = null; okPos = null; sync(); if (OB()) OB().arrived(sc, pv); };
  },
});

/* =================================================================== the Star Theatre */
const PW_ = 14, PM = mk();
(function buildTheatre() {
  const C = PM.C.bind(PM);
  for (const y of [2.6, 4.2, 5.8]) C('recliner', 7.6, y, { n: 6 }, { row: 1 });
  for (const x of [2.6, 4.2, 5.8]) C('recliner', x, 7.6, { n: 6 }, { flip: true, row: 1 });
  C('projector', 3.3, 3.3, { a: 0 }, { proj: 1 }); C('console', 10.6, 10);
  for (const [x, y] of [[7, 2.4], [7, 5.6], [13.6, 2.4], [13.6, 5.6], [2.4, 7], [5.6, 7], [2.4, 13.6], [5.6, 13.6], [9, 9], [12.4, 12.4]]) C('steplight', x, y);
})();
const TU = { dim: 3, applause: 6.5, exitMax: 22, minDoors: 5, forceDoors: 7, speed: 2.3 };
defineRoom({ id: 'observatory:planetarium', name: 'The Star Theatre', w: PW_, d: PW_, zoom: 0, music: 'quiet', noCrowd: true, showpiece: 'observatory', venue: OBS_VENUES.place,
  floor: GT.f_carpet, bg: '#070916', edge: '#262a44', wall: { color: '#1a2040', trim: '#2d3a6e', h: 6 },
  exits: [{ x: 9.5, y: 13.5, label: 'Back to the foyer', use: () => G.go('int:observatory', { x: O + 24, y: O + 1.9, dir: 1 }) }], spawn: { x: 9.5, y: 12.9, dir: 3 }, items: PM.items, npcSpots: [],
  setup(sc) {
    const Wd = sc.world; Wd.zmax = 8; sc.house = 1; const proj = by(Wd, 'proj')[0], HWP = SKY_W / 2, Z0 = .55;
    // ---- the dome: one sky canvas, blitted sheared onto both back walls
    const skyC = document.createElement('canvas'); skyC.width = SKY_W; skyC.height = SKY_H; const sx = skyC.getContext('2d');
    const mkc = () => { const c = document.createElement('canvas'); c.width = HWP + 2; c.height = SKY_H + HWP / 2 + 2; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; return [c, x]; }, [cl, xl] = mkc(), [cR, xr] = mkc();
    const sprL = { c: cl, l: cl, x: -HWP, y: -SKY_H - 1, w: cl.width, h: cl.height }, sprR = { c: cR, l: cR, x: 0, y: -SKY_H - 1, w: cR.width, h: cR.height };
    const blit = () => { xl.setTransform(1, 0, 0, 1, 0, 0); xl.clearRect(0, 0, cl.width, cl.height); xl.setTransform(1, -.5, 0, 1, 0, HWP / 2 + 1); xl.drawImage(skyC, 0, 0, HWP, SKY_H, 0, 0, HWP, SKY_H); xr.setTransform(1, 0, 0, 1, 0, 0); xr.clearRect(0, 0, cR.width, cR.height); xr.setTransform(1, .5, 0, 1, 0, 1); xr.drawImage(skyC, HWP, 0, HWP, SKY_H, 0, 0, HWP, SKY_H); };
    sc.ents.push({ x: O + .05, y: O, z: Z0, bb: [0, 0, .06, PW_, SKY_H / 16], sprite: () => sprL }, { x: O, y: O + .05, z: Z0, bb: [0, 0, PW_, .06, SKY_H / 16], sprite: () => sprR });
    // ---- seats
    const seats = []; for (const fx of sc.byTag('obs_seat')) { const fl = !!fx.item.flip; for (const s of fx.seats) seats.push({ x: s.x, y: s.y, z: s.z, dir: s.dir, B: fl ? 1 : 0, fx: fl ? fx.ob.B[0] - .3 : s.x, fy: fl ? s.y : fx.ob.B[1] - .3, row: fl ? fx.ob.B[0] : fx.ob.B[1], taken: null }); }
    const entry = { x: O + 9.5, y: O + 12.7 };
    const route = s => (s.B ? [{ x: s.fx, y: O + 13.45 }, { x: s.fx, y: s.fy }, { x: s.x, y: s.y }] : [{ x: O + 13.5, y: O + 9.4 }, { x: O + 13.5, y: s.fy }, { x: s.fx, y: s.fy }, { x: s.x, y: s.y }]);
    const P = specs(), aud = []; for (let i = 0; i < 26; i++) { const c = new Char(i % 6 === 5 ? P.kid[i % P.kid.length] : i % 7 === 3 ? P.elder[i % P.elder.length] : P.adult[(i * 7 + 3) % P.adult.length], entry.x, entry.y); c.hidden = true; c.kind = 'customer'; c.st = 0; sc.ents.push(c); aud.push(c);
      sc.interactables.push({ ent: c, x: c.x, y: c.y, label: 'Visitor', h: 1.2, hit: 6, range: 1.7, visible: () => !c.hidden && star.phase !== 'show' && star.phase !== 'dim', use: () => bubble(c, pick(LINES.aud)) }); }
    const pres = new Char(Object.assign({}, P.staff[5], { topColor: '#2d3a6e' }), O + 11.4, O + 9.6); pres.dir = 1; pres.kind = 'staff'; sc.ents.push(pres);
    sc.interactables.push({ ent: pres, x: pres.x, y: pres.y, label: 'Stella, presenter', h: 1.3, hit: 8, range: 1.8, use: () => OB() && OB().talkPresenter(pres, star) });
    const star = sc.star = { phase: 'idle', prog: null, t: 0, slot: null, mine: null, watched: 0, seats, aud, col: '#3a4a9a', done: {}, speed: 1, log: [],
      audience: () => aud.filter(a => !a.hidden).length, state: () => ({ phase: star.phase, prog: star.prog && star.prog.id, t: Math.round(star.t * 10) / 10, audience: star.audience(), seated: aud.filter(a => a.st === 2).length, mine: !!star.mine, house: sc.house, watched: Math.round(star.watched) }) };
    const freeSeats = () => seats.filter(s => !s.taken);
    const seatAud = (n, instant, span) => { const fr = freeSeats().sort((a, b) => (Math.abs(a.row - (O + 4.2)) + Math.random() * 2.5) - (Math.abs(b.row - (O + 4.2)) + Math.random() * 2.5)); let k = 0;
      for (const c of aud) { if (k >= n || !fr.length) break; if (!c.hidden) continue; const s = fr.shift(); s.taken = c; c.seat = s; c.hidden = false; c.alpha = undefined; k++;
        if (instant) { c.x = s.x; c.y = s.y; c.z = s.z; c.dir = s.dir; c.pose = 'sit'; c.poseOpts = { seated: true }; c.st = 2; } else { c.x = entry.x + (Math.random() - .5) * .6; c.y = entry.y + .4; c.z = 0; c.pose = null; c.poseOpts = null; c.st = 0; c.at = Math.random() * span; c.pts = route(s); c.pi = 0; c.hidden = true; c.wait = true; } } };
    const idleLines = () => { const nx = OB() ? OB().shows.next() : null; return nx ? ['NEXT SHOW ' + clock(nx.h), nx.prog.title, 'INCLUDED WITH YOUR TICKET'] : ['NO MORE SHOWS TODAY', 'SHOWS AT 14 16 18 20 22', 'SIT BACK AND LOOK UP']; };
    star.begin = (progId, force, at) => { if (star.phase !== 'idle') return false; const nx = OB() ? OB().shows.next(true) : null, pr = PROGRAMMES.find(p => p.id === progId) || (nx && nx.prog) || PROGRAMMES[0]; safe(unlock);
      star.prog = pr; star.t = 0; star.watched = 0; star.force = !!force; star.log = [[0, 'doors']]; const n = force ? 5 + Math.floor(Math.random() * 5) : OB() ? OB().shows.crowd() : 12;
      if (at > 3) { seatAud(n, true); star.phase = 'show'; star.t = Math.min(pr.dur - 6, at); sc.house = 0; star.cap = pr.captions.findIndex(c => c[0] > star.t); if (star.cap < 0) star.cap = pr.captions.length; G.emit('observatory:showstart', pr.id); }
      else { star.phase = 'doors'; star.doors = force ? TU.forceDoors : null; seatAud(n, false, force ? 4.5 : 9); bubble(pres, `"${pr.title}" is about to begin. Please take a seat!`, 4200); G.emit('observatory:doors', pr.id); }
      if (star.mine && G.busy && G.busy._obsSeat) { G.busy.left = pr.dur + 40; G.busy.minutes = pr.dur + 40; G.busy.rate = 1; G.busy.label = 'Watching: ' + pr.title; }
      return true; };
    const finish = () => { star.phase = 'exit'; star.t = 0; for (const c of aud) if (!c.hidden && c.st === 2) { c.st = 3; c.at = .1 + Math.random() * 5; c.pose = null; } const pr = star.prog, frac = star.watched / Math.max(1, pr.dur), was = !!star.mine;
      if (star.mine && G.busy && G.busy._obsSeat) G.endActivity(true); if (OB()) OB().showDone(pr, was && frac >= .55, frac); };
    star.sit = seat => { if (G.busy || !seat || (seat.taken && seat.taken !== G.player)) return false; const p = G.player, live = star.phase !== 'idle' && star.phase !== 'exit'; seat.taken = p; star.mine = seat; p.poseOpts = { seated: true };
      const a = G.startActivity({ label: live ? 'Watching: ' + star.prog.title : 'Reclining under the dome', anim: 'sit', minutes: live ? Math.max(20, star.prog.dur + 40 - (star.phase === 'show' ? star.t : 0)) : 20, rate: live ? 1 : 2, at: { x: seat.x, y: seat.y, z: seat.z, dir: seat.dir },
        tick: gm => { if (star.phase === 'idle') safe(() => { G.needs.add('energy', gm * .2); G.needs.add('fun', gm * .15); }); },
        cancel: () => { p.poseOpts = null; seat.taken = null; star.mine = null; }, done: () => { p.poseOpts = null; seat.taken = null; star.mine = null; } }); a._obsSeat = true; return true; };
    for (const st of seats) sc.interactables.push({ x: st.x, y: st.y, z: st.z - .2, h: .5, hit: 5, label: 'Sit', spot: { x: st.fx, y: st.fy }, visible: () => !st.taken, use: () => star.sit(st) });
    // ---- lighting
    sc.env = t => { const b = ambientIndoor(t), L = sc.house; return { amb: R.mix('#2a2a48', b.amb, L), dark: b.dark + (1 - L) * (.93 - b.dark), bg: Wd.bg, night: b.night }; };
    sc.lights = (m, cam, pool) => { const L = 1 - sc.house; if (L < .03) return; const ga = m.globalAlpha, k = .5 + .06 * Math.sin(G.time * 9); try { lp(m, cam, pool, O + 9, O + 3.5, 0, 5, star.col, L * k); lp(m, cam, pool, O + 3.5, O + 9, 0, 5, star.col, L * k); lp(m, cam, pool, O + 4.5, O + 4.5, 0, 4, star.col, L * k * .8); lp(m, cam, pool, O + 10, O + 10, 0, 4, star.col, L * .3); } finally { m.globalAlpha = ga; } };
    let fr = -1, pa = 0, pt = 0, tick = 0, idleK = '';
    const idle = () => { const L = star.phase === 'doors' && star.prog ? ['DOORS OPEN', star.prog.title, 'PLEASE TAKE A SEAT'] : idleLines(), f = Math.floor(G.time * 4), k = L.join('|') + f; if (k === idleK) return; idleK = k; drawIdle(sx, G.time, L); blit(); star.col = '#3a4a9a'; };
    const check = () => { if (star.phase !== 'idle' || !OB() || !isOpenNow()) return; const cur = OB().shows.current();
      if (!cur || star.done[cur.key]) { // QA round 3: a clouded-out star party moves in here, and Stella runs the sky back to back until midnight
        if (OB().cloudyParty && OB().cloudyParty()) { if (!star.cpT) star.cpT = G.time + 8; else if (G.time > star.cpT) { star.cpT = 0; star.begin(null, true); } } return; }
      star.done[cur.key] = 1; star.slot = cur; star.begin(cur.prog.id, false, cur.at); };
    idle();
    const u0 = sc.update; sc.update = (dt, gm) => {
      u0(dt, gm); pres.t += dt; const sp = star.speed || 1, d = dt * sp;
      if ((tick -= dt) <= 0) { tick = 1; check(); }
      if ((pt += dt) > (star.phase === 'show' ? .16 : .5)) { pt = 0; pa = (pa + 1) % 8; if (proj) setP(proj, { a: pa }); }
      if (star.phase === 'idle') { idle(); sc.house = Math.min(1, sc.house + dt * .6); }
      else if (star.phase === 'doors') { idle(); star.t += d; const ready = star.doors ? star.t >= star.doors : (star.slot ? G.state.t >= star.slot.T && star.t >= TU.minDoors : star.t >= TU.forceDoors); if (ready && !aud.some(a => !a.hidden && a.st === 1) || star.t > 40) { star.phase = 'dim'; star.t = 0; star.log.push([0, 'dim']); safe(() => sfx('hush')); } }
      else if (star.phase === 'dim') { star.t += d; sc.house = Math.max(0, 1 - star.t / TU.dim); idle(); if (star.t >= TU.dim) { star.phase = 'show'; star.t = 0; star.cap = 0; fr = -1; G.emit('observatory:showstart', star.prog.id); } }
      else if (star.phase === 'show') { star.t += d; sc.house = 0; if (star.mine) star.watched += d; const pr = star.prog, f = Math.floor(star.t * 12);
        if (f !== fr) { fr = f; star.col = drawShow(sx, pr.id, star.t, OB() ? OB().showEnv() : {}); blit(); }
        while (star.cap < pr.captions.length && pr.captions[star.cap][0] <= star.t) { caption('Narrator', pr.captions[star.cap][1], 6500 / sp); star.cap++; }
        if (star.t >= pr.dur) { star.phase = 'applause'; star.t = 0; star.log.push([pr.dur, 'applause']); caption('', ''); safe(() => sfx('applause', 5)); for (const c of aud) if (!c.hidden && c.st === 2 && Math.random() < .7) { c.pose = 'cheer'; c.rt = 1.5 + Math.random() * 3; } } }
      else if (star.phase === 'applause') { star.t += d; sc.house = Math.min(1, star.t / 2.5); idle(); for (const c of aud) if (c.rt > 0 && (c.rt -= dt) <= 0) c.pose = 'sit'; if (star.t >= TU.applause) finish(); }
      else if (star.phase === 'exit') { star.t += d; sc.house = 1; idle(); if (!aud.some(a => !a.hidden) || star.t > TU.exitMax) { for (const c of aud) { c.hidden = true; if (c.seat) { c.seat.taken = null; c.seat = null; } c.st = 0; } star.phase = 'idle'; star.prog = null; star.slot = null; } }
      // audience movement
      for (let i = 0; i < aud.length; i++) { const c = aud[i]; if (c.hidden && !c.wait) continue; c.t += dt;
        if (c.wait) { if (star.phase !== 'doors' && star.phase !== 'dim') { c.wait = false; c.hidden = false; c.x = c.seat.x; c.y = c.seat.y; c.z = c.seat.z; c.dir = c.seat.dir; c.pose = 'sit'; c.poseOpts = { seated: true }; c.st = 2; } else if ((c.at -= d) <= 0) { c.wait = false; c.hidden = false; c.st = 1; } continue; }
        if (c.st === 1 || c.st === 3) { if (c.st === 3 && c.at > 0) { c.at -= d; if (c.at <= 0) { c.poseOpts = null; c.z = 0; c.pts = route(c.seat).slice(0, -1).reverse().concat([{ x: entry.x, y: entry.y + .5 }]); c.pi = 0; c.x = c.pts[0].x; c.y = c.pts[0].y; } continue; }
          const q = c.pts[c.pi]; if (!q) { if (c.st === 1) { c.st = 2; } else { c.hidden = true; c.seat.taken = null; c.seat = null; c.st = 0; } continue; }
          const dx = q.x - c.x, dy = q.y - c.y, dd = Math.hypot(dx, dy), stp = TU.speed * d * (c.pi === c.pts.length - 1 && c.st === 1 ? .6 : 1);
          if (dd <= stp) { c.x = q.x; c.y = q.y; c.pi++; if (c.st === 1 && c.pi >= c.pts.length) { c.moving = false; c.z = c.seat.z; c.dir = c.seat.dir; c.pose = 'sit'; c.poseOpts = { seated: true }; c.st = 2; } } else { c.x += dx / dd * stp; c.y += dy / dd * stp; c.face(dx, dy); c.moving = true; } }
      }
    };
    const e0 = sc.onEnter; sc.onEnter = (o, pv) => { e0(o, pv); idleK = ''; check(); if (OB() && OB().onTheatre) OB().onTheatre(sc); };
    const x0 = sc.onExit; sc.onExit = () => { x0(); caption('', ''); if (star.phase !== 'idle') { for (const c of aud) { c.hidden = true; c.wait = false; if (c.seat) { c.seat.taken = null; c.seat = null; } c.st = 0; } star.phase = 'idle'; star.prog = null; star.slot = null; sc.house = 1; } };
  },
});

/* =================================================================== roof: the Great Telescope + terrace */
const RW = 24, RD = 16, RM = mk();
(function buildRoof() {
  const { S } = RM, C = RM.C.bind(RM), WY = RM.WY.bind(RM), WX = RM.WX.bind(RM);
  WY('domeshell', 0, { w: 4.5 }, { shell: 1 }); WY('domeshell', 4.5, { w: 4.5, sx: 2.25, open: 0 }, { shell: 1, slit: 1 }); WX('domeshell', 0, { w: 4.5 }, { shell: 1 }); WX('domeshell', 4.5, { w: 4.5 }, { shell: 1 });
  WY('skywall', 9, { w: 5, u0: 336 }, { sky: 1, ci: 0 }); WY('skywall', 14, { w: 5, u0: 416 }, { sky: 1, moon: 1 }); WY('skywall', 19, { w: 5, u0: 496 }, { sky: 1, ci: 1, comet: 1 }); WX('skywall', 9, { w: 7, u0: 120, rev: 1 }, { sky: 1, ci: 2 });
  C('telescope', 3, 3, { park: 1 }, { scope: 1 }); C('domewall', 9, 0, { w: 4 }, { flip: true }); C('arch', 9, 4, { w: 2.5 }, { flip: true }); C('domewall', 9, 6.5, { w: 3 }, { flip: true });
  C('domewall', 0, 9, { w: 3.5 }); C('arch', 3.5, 9, { w: 2.5 }); C('domewall', 6, 9, { w: 3 }); C('plaque', 7.6, 7.2, {}, { fact: 'scope' }); C('bench', .8, 7.2, {}, { flip: true });
  C('notice', 10.2, 7.2, {}, { notice: 1, solid: false });
  // terrace
  C('smallscope', 11.5, 2.4, {}, { n: 0, tscope: 1 }); C('sketchstool', 12.9, 2.5, {}); C('smallscope', 15.5, 2.4, { kind: 'dob' }, { n: 1, tscope: 1 }); C('smallscope', 18.5, 2.4, { c: '#f4f0e8' }, { n: 2, tscope: 1 });
  C('finder', 13.4, 6.2); C('finder', 18.6, 6.6); for (const [x, c] of [[10.6, '#3b6fd0'], [12.1, '#c8402f'], [13.6, '#3b6fd0']]) C('deckchair', x, 10.6, { c });
  C('bench', 16.2, 11.4); C('bench', 19.2, 13.6); C('stairhead', 21.6, .5); C('planter', 22.6, 4.4, { seed: 3 }, { flip: true }); C('planter', 9.8, 14.6, { seed: 8 }); C('planter', 16.5, 14.8, { seed: 5 });
  for (const [x, y] of [[10, 1.4], [20.6, 2.2], [23, 8], [9.6, 13.2], [17, 8.6], [1, 14.6]]) C('lantern', x, y, { on: 1 }, { lan: 1 });
  // star-party extras
  C('partytable', 20, 9.6, {}, { party: 1 }); C('smallscope', 2, 11.4, { kind: 'dob' }, { party: 1, n: 3, tscope: 1 }); C('smallscope', 5.6, 12.6, { c: '#3b6fd0' }, { party: 1, n: 4, tscope: 1 }); C('smallscope', 21.6, 12.4, { c: '#e8b83a' }, { party: 1, n: 5, tscope: 1 });
  for (const [x, y] of [[3.6, 14.8], [7.6, 14.6], [14, 14.6], [22.8, 11], [19, 9]]) C('lantern', x, y, { on: 1 }, { lan: 1, party: 1 });
  // visitors
  S(12.4, 3.9, 3, { night: 1, p: .7 }); S(16.4, 3.9, 3, { night: 1, p: .7, age: 'kid', lines: LINES.kid }); S(16.7, 3.8, 3, { night: 1, busy: 1 }); S(19.6, 3.6, 3, { p: .6 }); S(14.6, 7.4, 3, { night: 1, p: .5 }); S(19.9, 7.7, 2, { night: 1, busy: 1, anim: 'phone' });
  S(11, 11.55, 3, { seated: true, z: .3, night: 1, p: .6 }); S(14, 11.55, 3, { seated: true, z: .3, night: 1, busy: 1 }); S(16.65, 11.72, 1, { seated: true, z: .46, p: .5 }); S(20.35, 13.92, 1, { seated: true, z: .46, busy: 1 });
  S(11.2, 5.4, 3, { p: .5, anim: 'phone' }); S(22.4, 7, 0, { p: .4 }); S(13, 13.4, 2, { busy: 1 }); S(6.6, 7.6, 2, { night: 1, p: .5 }); S(1.3, 7.65, 0, { seated: true, z: .46, night: 1, p: .4 });
  // star-party guests (amateur astronomers beside their own telescopes) + extra crowd
  S(3.3, 11.9, 2, { party: 1, guest: 3, label: 'Amateur astronomer', lines: LINES.guest }); S(6.9, 13.1, 2, { party: 1, guest: 4, label: 'Amateur astronomer', lines: LINES.guest }); S(22.9, 12.9, 2, { party: 1, guest: 5, label: 'Amateur astronomer', lines: LINES.guest });
  S(2.4, 13, 3, { party: 1 }); S(6, 14.2, 3, { party: 1, age: 'kid', lines: LINES.kid }); S(21, 14, 3, { party: 1 }); S(20.8, 11, 3, { party: 1, anim: 'drink' }); S(19.2, 10.9, 0, { party: 1, anim: 'drink' }); S(15, 9.6, 1, { party: 1, anim: 'talk' }); S(15.9, 9.7, 2, { party: 1, anim: 'talk' }); S(9.6, 10.4, 0, { party: 1 });
})();
function drawMeteor(f) { const s = R.PW(0, 0, 0); R.lit(() => { for (let i = 0; i < 4 + f * 3; i++) R.px(Math.round(s[0]) + i * 2, Math.round(s[1]) + i, R.C(i > 2 + f * 2 ? '#ffffff' : '#8aa8e8')); }); }
defineRoom({ id: 'observatory:roof', name: 'Observatory Dome & Terrace', w: RW, d: RD, zoom: 0, music: 'quiet', noCrowd: true, showpiece: 'observatory', venue: OBS_VENUES.place,
  floor: GT.f_stone, bg: '#0a0e22', edge: '#3a3450', wall: { color: '#c9c4b6', trim: '#8a8e9a', h: 1 },
  exits: [{ x: 22.6, y: 2.6, label: 'Stairs down', use: () => G.go('int:observatory', { x: O + 28.25, y: O + 3.9, dir: 1 }) }], spawn: { x: 22.6, y: 3.2, dir: 1 }, items: RM.items, npcSpots: RM.spots,
  setup(sc) {
    const Wd = sc.world; Wd.zmax = 9; const sky = by(Wd, 'sky'), shells = by(Wd, 'shell'), slit = by(Wd, 'slit')[0], scope = by(Wd, 'scope')[0], party = by(Wd, 'party'), tscopes = by(Wd, 'tscope'), lans = by(Wd, 'lan'), notice = by(Wd, 'notice')[0];
    Wd.decal({ x0: O, y0: O, x1: O + RW, y1: O + RD, draw(Rr) { const h2 = Rr.hash2;
      const dome = (x, y) => { const d = Math.hypot(x - 4.5, y - 4.5), r = Math.floor(y * 2), xx = x + (r & 1) * .9; if (d > 4.2 && d < 4.4) return '#8a8e9a'; if (d < 1.2) return '#6a6e7a'; if (y * 2 - r < .1 || (xx % 1.8) < .06) return '#4a3222'; return h2(Math.floor(xx / 1.8), r, 9) > .6 ? '#7a5236' : '#6a4630'; };
      const paver = (x, y) => { const r = Math.floor(y / 1.0), xx = x + (r & 1) * .75, fx = (xx % 1.5) / 1.5, fy = y - r; if (fx < .04 || fy < .06) return '#7a7868'; const k = h2(Math.floor(xx / 1.5), r, 3); return h2(Math.floor(x * 16), Math.floor(y * 16), 5) > .97 ? '#8a8878' : k > .66 ? '#b4b0a0' : k > .33 ? '#aaa696' : '#a09c8c'; };
      Rr.qz(O, O + RW, O, O + RD, 0, (x, y) => (x - O < 9 && y - O < 9 ? dome(x - O, y - O) : paver(x - O, y - O))); } }); Wd.version++;
    
    const cr = crowd(sc, sc.def.npcSpots, { seed: 44, fill: .7, lines: c => (sc._night ? LINES.roof : LINES.roofDay) });
    sc.life = { crowd: cr, count: () => cr.count(), level: -1 };
    const P = specs(), astro = new Char(Object.assign({}, P.adult[17], { top: 'coat', topColor: '#f4f0e8', glasses: true, scarf: '#c8402f' }), O + 5.6, O + 6.3); astro.dir = 2; astro.kind = 'staff'; astro.speed = 1.4; sc.ents.push(astro);
    sc.interactables.push({ ent: astro, x: astro.x, y: astro.y, label: 'Dr. Halvorsen, astronomer', h: 1.3, hit: 8, range: 1.8, visible: () => !astro.hidden, use: () => { astro._hold = 6; astro.faceTo(G.player.x, G.player.y); if (OB()) OB().talkAstronomer(astro); } });
    // party lantern lights are added / removed with the party
    const baseL = lans.filter(o => !o.data.party).map(o => ({ x: o.x + .25, y: o.y + .25, z: 0, r: 2.4, c: '#ff6a5a' })), partyL = lans.filter(o => o.data.party).map(o => ({ x: o.x + .25, y: o.y + .25, z: 0, r: 2.4, c: '#ff6a5a' })); for (const l of baseL) Wd.lights.push(l);
    Wd.lights.push({ x: O + 4.5, y: O + 6.6, z: 0, r: 3, c: '#c8402f' });
    const meteor = { x: 0, y: O + .3, z: 4, f: 0, t: 0, hidden: true, bb: [0, 0, .1, .1, .1], sprite() { return pixSprite('obsmet' + this.f, [-2, -2, 24, 12], () => drawMeteor(this.f)); } }; sc.ents.push(meteor);
    let view = null, wxv = null, seas = -1, mph = -1, pOn = null, com = null, openT = 0, openV = -1, az = 2, alt = 1, taz = 2, talt = 1, parked = true, st = 0, tick = 0, wf = 0, wt = 0, mt = 6, lvlK = '';
    function sync() {
      const n = G.now(), h = n.hf, s = OB() ? OB().sky() : { time: 'day', wx: null, moon: .5, season: 1, observing: false, party: false, moonUp: false }, isOpen = h >= OBS_HOURS[0] && h < OBS_HOURS[1], night = s.time === 'night'; sc._night = night;
      const mp = s.moonUp ? Math.round(s.moon * 28) / 28 : -1, hc = !!(OB() && OB().cometDone());
      if (s.time !== view || s.wx !== wxv || s.season !== seas || mp !== mph || hc !== com) { view = s.time; wxv = s.wx; seas = s.season; mph = mp; com = hc; const cs = CONSTELLATIONS.filter(c => c.season === s.season);
        for (const o of sky) setP(o, { time: view, wx: wxv, season: seas, frame: 0, moon: o.data.moon ? mp : -1, cons: o.data.ci !== undefined && cs[o.data.ci] ? cs[o.data.ci].id : null, comet: o.data.comet && hc ? 1 : 0 });
        for (const o of shells) setP(o, { time: view, wx: wxv }); Wd.bg = view === 'night' ? '#070a1c' : view === 'dusk' ? '#3a2c4c' : '#7fa8c8'; }
      openT = isOpen && s.observing ? 1 : 0; if (!s.observing && !parked) { parked = true; if (scope) setP(scope, { park: 1 }); } else if (isOpen && s.observing && parked) { parked = false; if (scope) setP(scope, { park: 0, az, alt }); }
      if (notice) { const show = isOpen && night && !s.observing; if (notice.hidden !== !show) notice.hidden = !show; if (show) { const b = s.wx === 'rain' ? 'RAIN' : 'CLOUD'; if (notice.p.b !== b) setP(notice, { a: 'CLOSED', b }); } }
      const po = isOpen && !!s.party && !s.wx;   // (QA round 3: a clouded-out party is in the planetarium, not up here) if (po !== pOn) { pOn = po; for (const o of party) { o.hidden = !po; if (o.solid) { if (po) Wd.block(o.B[0], o.B[1], o.B[3], o.B[4]); else Wd.free(o.B[0], o.B[1], o.B[3], o.B[4]); } } for (const l of partyL) { const i = Wd.lights.indexOf(l); if (po && i < 0) Wd.lights.push(l); if (!po && i >= 0) Wd.lights.splice(i, 1); } }
      const wet = s.wx === 'rain'; for (const o of tscopes) { const cov = wet || (night && !!s.wx) ? 1 : 0; if ((o.p.cover || 0) !== cov) setP(o, { cover: cov }); }
      const lvl = !isOpen || wet ? 0 : night ? (s.observing ? .75 : .3) + (n.weekday >= 5 ? .15 : 0) : .6, k = lvl + '|' + night + '|' + po + '|' + s.observing;
      if (k !== lvlK) { lvlK = k; sc.life.level = lvl; for (const c of cr.list) { const sp = c.spot; c.hidden = lvl <= 0 || (sp.party ? !po : (sp.night && !night) || (sp.busy ? lvl < .6 || c.roll > lvl + .2 : c.roll > Math.min(sp.p === undefined ? 1 : sp.p + .2, lvl + .15))); } }
      astro.hidden = !isOpen || !night; sc.life.open = isOpen; sc.life.party = po;
    }
    sc.obs = { sync, astro, open: () => openV, slew(a, b) { taz = Math.max(0, Math.min(4, a)); talt = Math.max(0, Math.min(2, b)); parked = false; if (scope) setP(scope, { park: 0, az, alt }); return (Math.abs(taz - az) + Math.abs(talt - alt)) * .35 + .4; }, scopeP: () => scope && scope.p, guests: () => cr.list.filter(c => c.spot.guest !== undefined && !c.hidden).length, meteor };
    sc.env = t => { const o = ambient(t, G.state.weather); return { amb: o.amb === '#ffffff' ? o.amb : R.mix(o.amb, '#ffffff', .12), dark: Math.min(.95, o.dark || 0), bg: Wd.bg, night: o.night }; };
    sync(); openV = openT; if (slit) setP(slit, { open: openV });
    const u0 = sc.update; sc.update = (dt, gm) => {
      u0(dt, gm); cr.update(dt); astro.t += dt; if (astro._hold > 0 && (astro._hold -= dt) <= 0) astro.dir = 2;
      if ((tick -= dt) <= 0) { tick = 1.2; sync(); }
      if (openV !== openT) { const nv = openV + Math.sign(openT - openV) * Math.min(Math.abs(openT - openV), dt * .25), q = Math.round(nv * 12), q0 = Math.round(openV * 12); openV = nv; if (q !== q0 && slit) setP(slit, { open: q / 12 }); }
      if (!parked && (az !== taz || alt !== talt) && (st += dt) > .35) { st = 0; if (az !== taz) az += Math.sign(taz - az); else alt += Math.sign(talt - alt); if (scope) setP(scope, { park: 0, az, alt }); }
      if (wxv && (wt += dt) > .3) { wt = 0; wf = (wf + 1) % 8; for (const o of sky) setP(o, { frame: wf }); }
      if (!meteor.hidden) { meteor.t += dt; meteor.f = Math.min(3, Math.floor(meteor.t * 9)); meteor.x += dt * 5; meteor.z -= dt * 2.6; if (meteor.t > .45) meteor.hidden = true; }
      else if (sc._night && !wxv && (mt -= dt) <= 0) { mt = 7 + Math.random() * 16; meteor.hidden = false; meteor.t = 0; meteor.f = 0; meteor.x = O + 10 + Math.random() * 10; meteor.z = 4.3 + Math.random() * .9; G.emit('observatory:meteor'); }
    };
    const e0 = sc.onEnter; sc.onEnter = (o, pv) => { e0(o, pv); view = null; lvlK = ''; sync(); openV = openT; if (slit) setP(slit, { open: openV }); if (OB()) OB().onRoof(sc); };
  },
});

registerInfo('Maple Bay Observatory', {
  blurb: 'The white dome on top of Hillcrest. Downstairs: a Foucault pendulum that knocks its pegs over as the Earth turns, a hands-on gallery and a planetarium with five shows a day. Upstairs: the Great Telescope and a terrace of small ones, with the whole city glittering below. Open 13:00 to midnight; the night is the main event.',
  signature: 'The 1894 Great Refractor swinging round under the open dome, and Saturn in the eyepiece.',
  tryThis: ['Catch a planetarium show (14:00, 16:00, 18:00, 20:00, 22:00): sit back, the lights go down', 'Look through the Great Telescope on a clear night and get the focus sharp', 'Trace a constellation at a finder on the terrace: twelve to collect, three each season', 'Sketch the Moon and pin it on the board downstairs', 'Touch all three meteorites', 'Send a coin round the gravity well, weigh yourself on Mars, stomp the rocket launcher', 'Turn the crank of the brass orrery', 'Listen to the astronomy talk at 15:00 or 17:00', 'Come to the Saturday star party: free cocoa and a row of amateur telescopes', 'Ask Dr. Halvorsen what she is looking for'],
  activities: ['obs_show', 'obs_telescope', 'obs_constellation', 'obs_sketch_moon', 'obs_meteorite', 'obs_gravity_well', 'obs_weigh', 'obs_rocket', 'obs_orrery', 'obs_talk', 'obs_stargaze', 'obs_star_party'],
});

const only = fn => (fx, scene) => (scene.def && scene.def.showpiece === 'observatory' ? fn(fx, scene) : null);
export function init() {
  const F = (tag, fn) => registerFixture(tag, only(fn));
  F('obs_pendulum', () => ({ label: 'The Foucault pendulum', hit: 26, range: 2.6, use: () => OB() && OB().watchPendulum() }));
  F('obs_orrery', (fx, sc) => ({ label: 'Turn the orrery crank', hit: 18, use: () => OB() && OB().crank(fx, sc) }));
  F('obs_meteorite', fx => ({ label: 'Touch the meteorite', hit: 12, use: () => OB() && OB().touch(fx.item.i || 0) }));
  F('obs_well', (fx, sc) => ({ label: 'Gravity well (25c)', hit: 16, use: () => OB() && OB().coin(fx, sc) }));
  F('obs_scale', (fx, sc) => ({ label: 'Your weight on other worlds', hit: 12, use: () => OB() && OB().weigh(fx, sc) }));
  F('obs_rocket', (fx, sc) => ({ label: 'Stomp the rocket launcher', hit: 14, use: () => OB() && OB().launch(fx, sc) }));
  F('obs_plaque', fx => (fx.item.fact ? { label: fx.item.fact === 'comet' ? 'Plaque: the comet' : 'Read the plaque', hit: 10, visible: () => !fx.ob.hidden, use: () => OB() && OB().readFact(fx.item.fact) } : null));
  F('obs_bench', (fx, sc) => ({ label: fx.item.talkBench ? 'Sit (astronomy talks here)' : 'Sit down', hit: 12, use: () => OB() && OB().sitBench(fx, sc) }));
  F('obs_stairs', () => ({ label: 'Stairs to the dome & terrace', hit: 22, use: () => OB() && OB().goRoof() }));
  F('obs_theatre', () => ({ label: 'Planetarium: the Star Theatre', hit: 22, use: () => OB() && OB().goTheatre() }));
  F('obs_board', () => ({ label: 'Moon sketches', hit: 12, use: () => OB() && OB().lookBoard() }));
  F('obs_lectern', (fx, sc) => ({ label: 'Astronomy talks', hit: 10, use: () => OB() && OB().talkInfo(sc) }));
  F('obs_gate', () => ({ label: 'Gallery gate', hit: 10, range: 1.6, use: () => { const c = OB(); toast(!c || !c.isOpen() ? 'Roped off. The observatory opens at 13:00.' : c.hasTicket() ? 'Your ticket is good all day. Go on through.' : 'A day ticket is $6 at the desk: gallery, planetarium shows and the telescopes upstairs.', 'info', 3600); } }));
  F('obs_ticket', () => ({ label: 'Tickets & showtimes', hit: 14, use: () => OB() && OB().desk() }));
  F('obs_shop', fx => ({ label: fx.item.label, hit: 14, shop: fx.item.venue, use: () => G.shop && G.shop.open(fx.item.venue, { checkHours: true }) }));
  F('obs_scope', (fx, sc) => ({ label: 'Look through the Great Telescope', hit: 30, use: () => OB() && OB().scope.look(null, fx, sc) }));
  F('obs_tscope', (fx, sc) => ({ label: fx.item.party ? 'Look through a guest telescope' : 'Look through the telescope', hit: 12, visible: () => !fx.ob.hidden, use: () => OB() && OB().smallScope(fx, sc) }));
  F('obs_finder', (fx, sc) => ({ label: 'Trace a constellation', hit: 12, use: () => OB() && OB().trace(fx, sc) }));
  F('obs_sketch', (fx, sc) => ({ label: 'Sketch the Moon', hit: 14, use: () => OB() && OB().sketchMoon(fx, sc) }));
  F('obs_deckchair', (fx, sc) => ({ label: 'Lie back and stargaze', hit: 14, use: () => OB() && OB().stargaze(fx, sc) }));
  F('obs_partycocoa', (fx, sc) => ({ label: 'Free cocoa', hit: 14, visible: () => !fx.ob.hidden, use: () => OB() && OB().partyCocoa() }));
  F('obs_stairhead', () => ({ label: 'Stairs down', hit: 20, use: () => G.go('int:observatory', { x: O + 28.25, y: O + 3.9, dir: 1 }) }));
}
