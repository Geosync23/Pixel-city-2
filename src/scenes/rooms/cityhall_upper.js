// Maple Bay City Hall — upstairs: the City Clerk's office with the Wedding Room (room `cityhall_clerk`, 22 x 14), the Mayor's office with the balcony doors over City Hall Plaza (room `cityhall_mayor`, 16 x 12)
// and the clock room at the top of the tower (room `cityhall_tower`, 14 x 11).
// Weddings: data/cityhall.js WEDDING (Saturdays 11, 13, 15; 40 minutes: guests gather, the couple walk in, vows, the kiss + confetti, out down the aisle). The room shows it; G.cityhall.wedding is the API.
//   clerk scene.hot = { sync(), force(m | null) (tests: pin the ceremony minute), phase() -> 'gather'|'enter'|'vows'|'kiss'|'exit'|null, couple, registrar, clerk, sec, guests }
//   mayor scene.hot = { sync(), mayor, window }      tower scene.hot = { sync(), keeper, works, bell, face, ring() }
import { G } from '../../core/game.js';
import { GT } from '../../engine/world.js';
import { defineRoom } from '../interior.js';
import { bubble } from '../../ui/kit.js';
import { crowd } from './_show_life.js';
import { specs } from './_airport_life.js';
import { O, setP, mk, step, go, softEnv, dress, seatsOf, people, viewNow } from './hotel.js';
import { CH, pick, kit, by, fade, idle, goRoom } from './cityhall.js';
import { CR, CV, NAME, PEOPLE, COUPLES, WEDDING, hallOpen, councilOn, weddingAt, towerOpen } from '../../data/cityhall.js';

/* ---------------- clerk's office + wedding room ---------------- */
const K = kit(), W = 22, D = 14, AX = 16.2;
const LINES = {
  guest: ['I have known them both for years and I STILL did not see it coming.', 'Do you have confetti? You can get a cone in the shop downstairs.', 'Mr. Bell does a lovely ceremony. Brisk. No poems.', 'I am not crying. It is the tulips.', 'Three weddings a Saturday. He must know the words backwards.', 'Anybody can sit in. That is the law. Well, it is the custom.'],
  office: ['Births, marriages, dog licences, the minutes of every meeting since 1887. It is all in here somewhere.', 'Mr. Bell stamps everything twice. Once for the record and once for joy.', 'The mayor is through that door. Priscilla decides who goes in.'],
  vows: ['We are gathered here, on a Saturday, in a building with a broken fountain...', 'Do you take this person, their cat, and their opinions about the 14 bus?', 'I do.', 'I do. Obviously. I have done for ages.', 'Then by the power vested in me by the City of Maple Bay: you are married. Go on, then.'],
};
(function build() {
  const { H, Wl, S } = K;
  Wl('furn.hotel.doorway', 'y', 1, { name: 'THE MAYOR', c: '#7a2030', w: 3, lit: 1 }); H('desk', 4.6, 1.6, { kind: 'sec', w: 3 }); Wl('furn.lobby.stairs', 'y', 8.2, {}, { tower: 1 });
  Wl('furn.lobby.sconce', 'y', .3, {}); Wl('furn.lobby.sconce', 'y', 4.3, {}); Wl('furn.hotel.window', 'y', 11, { w: 2.4, c: '#7a2030' }, { win: 1 }); Wl('furn.hotel.window', 'y', 19.2, { w: 2.4, c: '#7a2030' }, { win: 1 }); Wl('bunting', 'y', 13.6, { w: 5.4, c: '#f2a7c3' });
  Wl('noticeboard', 'x', 2.6, {}); Wl('portrait', 'x', 6, { k: 0 }, { portrait: 0 }); Wl('furn.lobby.restroom', 'x', 8.4, { c: '#5a4030', dc: '#7a2030' }); Wl('furn.lobby.sconce', 'x', 10.4, {});
  H('desk', 1.6, 6, { kind: 'clerk', w: 3 }); H('desk', 5.4, 6, { kind: 'licence', w: 3 }); H('shelves', .3, 9.2, { w: 3, kind: 'books', seed: 21 }, { flip: true });
  H('furn.lobby.column', 9.8, 4, { c: '#efe8dc' }); H('furn.lobby.column', 9.8, 8.4, { c: '#efe8dc' }); H('railing', 9.9, .6, { w: 3.4 }, { flip: true }); H('railing', 9.9, 8.9, { w: 4.6 }, { flip: true });
  H('furn.hotel.arch', AX - 1.2, 1, {}); H('registrar', AX - 1, 1.9, {}); H('furn.hotel.carpet', AX - 1, 3.2, { w: 2, d: 8.4, c: '#7a2030' });
  for (const y of [6.2, 7.7, 9.2]) { H('bench', AX - 4.2, y, { w: 3, c: '#f4ecd8', bow: 1, dir: 3 }, { wed: 1 }); H('bench', AX + 1.2, y, { w: 3, c: '#f4ecd8', bow: 1, dir: 3 }, { wed: 1 }); }
  H('planter', 11, .8, { k: 'tulips', seed: 4 }); H('planter', 19.8, .8, { k: 'tulips', seed: 7 }); H('bench', 6.6, 11, { w: 3 });
  S(3.1, 5.55, 1, { kind: 'staff', label: 'Deputy clerk', lines: LINES.office, dep: 1 }); S(2.6, 8.2, 3, { p: .5 }); S(7.4, 8.1, 3, { p: .6, couple: 1, lines: ['We are here for the licence. Sixty dollars and a signature. Romance!', 'He forgot his ID. On THIS of all days.'] }); S(8.1, 8.2, 3, { p: .6, couple: 1, lines: ['I did not forget it. I mislaid it. Strategically.'] }); S(12, 11.6, 0, { busy: 1, anim: 'phone' }); S(20.4, 11.4, 2, { busy: 1 });
})();
defineRoom({ id: CR.clerk, name: NAME + " — City Clerk & Wedding Room", w: W, d: D, zoom: 0, music: 'quiet', noCrowd: true, showpiece: 'cityhall', venue: CV.place, floor: GT.f_wood, bg: '#15161f', edge: '#4a3a2a',
  wall: { color: '#f0e2d4', trim: '#8a5a44', h: 4.4, rail: 1.1 },
  exits: [{ x: 5, y: 13.2, label: 'Stairs down to the Rotunda', to: 'int:' + CR.hall, use: () => goRoom('hall', 'stairs') }, { x: 2.5, y: 1.3, label: "The Mayor's Office", to: 'int:' + CR.mayor, use: () => CH() && CH().toMayor() },
    { x: 8.95, y: 1.3, label: 'Stairs up to the Clock Tower (112 steps)', to: 'int:' + CR.tower, use: () => CH() && CH().toTower() }],
  spawn: { x: 5, y: 12.1, dir: 3 }, items: K.items, npcSpots: K.spots,
  setup(sc) {
    const Wd = sc.world, P = people(), AP = specs(), wins = by(sc, 'win');
    Wd.lights.push({ x: O + AX, y: O + 3.6, z: 0, r: 6, c: '#fff0d8' }, { x: O + AX, y: O + 8.4, z: 0, r: 6, c: '#ffe9c8' }, { x: O + 4.5, y: O + 4, z: 0, r: 5, c: '#ffe9b0' }, { x: O + 4.6, y: O + 9.6, z: 0, r: 5, c: '#ffe9b0' });
    const seats = seatsOf(sc, /cityhall\.bench/, { skip: f => !f.item.wed, add: () => ({ busy: 1, wed: 1, p: 1 }) });
    const cr = crowd(sc, sc.def.npcSpots.concat(seats), { seed: 1934, fill: .7, lines: LINES.guest }); dress(cr, (s, c) => (s.wed ? P.formal[Math.floor(c.roll * P.formal.length)] : s.kind === 'staff' ? P.concierge[0] : null));
    const clerk = mk(sc, P.concierge[2], 3.1, 5.55, 1, PEOPLE.clerk, c => CH() && CH().clerk(sc, c)), sec = mk(sc, P.maid[0], 6.1, 1.15, 1, PEOPLE.sec, c => CH() && CH().secretary(sc, c));
    const lic = mk(sc, AP.staff[4], 6.9, 5.55, 1, 'Licence clerk', c => CH() && CH().licence(sc, c));
    const a = mk(sc, P.bride, AX - .5, 11, 3, 'The bride', ['Is my veil straight? Do I have a veil? I cannot remember anything.', 'Best day. BEST day.']), b = mk(sc, P.groom, AX + .5, 11, 3, 'The groom', ['I practised "I do" in the lift. There is no lift. I practised on the stairs.', 'Have you seen the ring? I had it a minute ago. Joking. Mostly.']); a.hidden = b.hidden = true; a.speed = b.speed = 1.1;
    let tick = 0, forced = null, ph = null, vow = 0, vT = 0, cT = 0, lastSlot = -1;
    const regAt = [AX, 1.45], HOME = [3.1, 5.55];
    const cur = () => { if (forced !== null) return { slot: 0, hour: 11, m: forced }; return weddingAt(G.now()); };
    const phOf = w => (!w ? null : w.m < 0 ? 'gather' : w.m < 5 ? 'enter' : w.m < 24 ? 'vows' : w.m < 30 ? 'kiss' : 'exit');
    const sync = () => {
      const n = G.now(), w = cur(), p = phOf(w), open = hallOpen(n) || forced !== null, v = viewNow(); for (const o of wins) setP(o, { time: v });
      for (const c of cr.list) { const s = c.spot; c.hidden = s.wed ? !p || c.roll > .78 : s.kind === 'staff' ? true : s.couple ? !open || n.weekday === 5 || c.roll > .7 : s.busy ? !p : !open || c.roll > (s.p || .5); }
      sec.hidden = !open || n.weekday > 4; lic.hidden = !open; clerk.hidden = !open || (councilOn(n) && !p);
      if (p !== ph) { const was = ph; ph = p; const me = CH() && CH().wedding.mine && CH().wedding.mine();
        if (p && !was) { const cp = COUPLES[(n.day + (w ? w.slot : 0)) % COUPLES.length]; a.label = cp[0] + ', getting married'; b.label = cp[1] + ', getting married'; a.setSpec(Math.random() < .5 ? P.bride : pick(P.formal)); b.setSpec(Math.random() < .5 ? P.groom : pick(P.formal)); if (me && me.spec) a.setSpec(me.spec); sc.hot.story = cp[2]; }
        if (p) { clerk.x = O + regAt[0]; clerk.y = O + regAt[1]; clerk.dir = 1; clerk.path = null; } else { clerk.x = O + HOME[0]; clerk.y = O + HOME[1]; }
        if (p === 'gather') { a.hidden = b.hidden = true; }
        if (p === 'enter') { for (const [c, dx] of [[a, -.5], [b, .5]]) { c.hidden = !!(me && c === b); c.alpha = 0; c.x = O + AX + dx; c.y = O + 12.2; c.pose = null; go(c, Wd, AX + dx, 3.6); } bubble(clerk, 'Everybody up! Here they come.', 3600); for (const c of cr.list) if (c.spot.wed && !c.hidden) c._hold = 2; }
        if (p === 'vows') { for (const [c, dx] of [[a, -.5], [b, .5]]) { if (c.hidden && !(me && c === b)) { c.hidden = false; } c.path = null; c.x = O + AX + dx; c.y = O + 3.6; c.dir = dx < 0 ? 0 : 2; c.alpha = undefined; } vow = 0; vT = 1; }
        if (p === 'kiss') { for (const [c, dx] of [[a, -.5], [b, .5]]) { c.hidden = !!(me && c === b); c.path = null; c.x = O + AX + dx; c.y = O + 3.6; c.dir = 1; c.alpha = undefined; c.pose = 'cheer'; } bubble(clerk, LINES.vows[4], 5200); for (const c of cr.list) if (c.spot.wed && !c.hidden) { c.pose = 'cheer'; c._hold = 5; } cT = 0; if (CH()) CH().wedding.kiss(sc); }
        if (p === 'exit') { for (const [c, dx] of [[a, -.5], [b, .5]]) { c.pose = null; go(c, Wd, AX + dx, 12.4); } cT = 0; }
        if (!p) { a.hidden = b.hidden = true; if (was && CH()) CH().wedding.over(sc); } }
    };
    sc.hot = { sync, force(m) { forced = m === undefined ? null : m; sync(); }, phase: () => ph, couple: [a, b], registrar: clerk, clerk, sec, lic, guests: () => cr.list.filter(c => c.spot.wed && !c.hidden), aisle: [AX, 4.6], story: '' };
    sc.life = { crowd: cr, count: () => cr.count() + 3 + (a.hidden ? 0 : 2) };
    sc.env = softEnv(Wd, .62, .42); sync();
    const u0 = sc.update; sc.update = (dt, gm) => {
      u0(dt, gm); cr.update(dt); if ((tick -= dt) <= 0) { tick = .5; sync(); }
      for (const c of [clerk, sec, lic]) { idle(c, dt); if (!(c._hold > 0)) { c.dir = 1; c.pose = ph && c === clerk ? (ph === 'vows' ? 'talk' : null) : Math.floor(G.time / 6 + c.x) % 3 === 0 ? 'work' : null; } }
      for (const c of [a, b]) { if (c.hidden) continue; const mv = step(c, Wd, dt); if (ph === 'enter') fade(c, false, dt); if (ph === 'exit' && !mv) { if (fade(c, true, dt)) { c.hidden = true; c.alpha = undefined; } } }
      if (ph === 'vows' && (vT -= dt) <= 0 && vow < 4) { const who = vow === 0 || vow === 1 ? clerk : vow === 2 ? a : b; if (!who.hidden) bubble(who, LINES.vows[vow], 4600); vow++; vT = 5.5; }
      if ((ph === 'kiss' || ph === 'exit') && (cT -= dt) <= 0 && CH()) { cT = .45; const t = ph === 'kiss' ? [O + AX, O + 3.6] : [a.x + .5, a.y]; if (!a.hidden || ph === 'kiss') CH().confetti(t[0] + (Math.random() - .5) * 2, t[1] + (Math.random() - .5), 10); }
    };
    const e0 = sc.onEnter; sc.onEnter = (o, pv) => { e0(o, pv); sync(); if (CH()) CH().arrivedIn('clerk', sc); };
  },
});

/* ---------------- the mayor's office ---------------- */
const M = kit();
(function build() {
  const { H, Wl, S } = M;
  Wl('bigwindow', 'y', 5, { w: 6 }, { balcony: 1, bw: 1 }); Wl('keycase', 'y', 12.4, { has: 0 }, { keycase: 1 }); Wl('portrait', 'y', 2.4, { k: 5 }, { portrait: 5 }); Wl('furn.lobby.sconce', 'y', 1.2, {}); Wl('furn.lobby.sconce', 'y', 14.6, {});
  Wl('photowall', 'x', 6.4, { k: 1 }, { photos: 1 }); Wl('furn.lobby.sconce', 'x', 5.2, {});
  H('flagpole', 4, .5, {}); H('flagpole', 11.4, .5, { k: 'bay' }); H('furn.hotel.carpet', 4.6, 2.2, { w: 6.8, d: 5.6, c: '#22304e' });
  H('cchair', 7.7, 2.1, { tall: 1, c: '#2f5a4a' }, { mayor: 1 }); H('mayordesk', 6.5, 3.2, {}, { mdesk: 1 }); H('bench', 7, 5.8, { w: 2, dir: 3, c: '#7a2030' });
  H('shelves', .3, 1, { w: 4, kind: 'books', seed: 31, c: '#6a4430' }, { flip: true }); H('furn.lobby.settee', 12.2, 6.4, { c: '#2f5a4a', a: '#e8c06a' }); H('furn.cafe.lowtable', 12.6, 8, {}); H('planter', 13.6, 1, { seed: 9 }); H('planter', .8, 9.6, { seed: 12 });
})();
defineRoom({ id: CR.mayor, name: NAME + " — the Mayor's Office", w: 16, d: 12, zoom: 0, music: 'quiet', noCrowd: true, showpiece: 'cityhall', venue: CV.place, floor: GT.f_wood, bg: '#15161f', edge: '#4a3a2a',
  wall: { color: '#dcd2bc', trim: '#6a4430', h: 4.2, rail: 1.2, pattern: 'plain' },
  exits: [{ x: 8, y: 11.4, label: "Back to the Clerk's office", to: 'int:' + CR.clerk, use: () => goRoom('clerk', 'mayor') }],
  spawn: { x: 8, y: 10.3, dir: 3 }, items: M.items, npcSpots: M.spots,
  setup(sc) {
    const Wd = sc.world, win = by(sc, 'bw')[0], kc = by(sc, 'keycase')[0];
    Wd.lights.push({ x: O + 8, y: O + 4, z: 0, r: 6, c: '#ffe9b0' }, { x: O + 12.8, y: O + 7.6, z: 0, r: 4, c: '#ffe2a0' });
    const mayor = mk(sc, CH() && CH().mayorSpec ? CH().mayorSpec() : people().formal[0], 8, 2.75, 1, PEOPLE.mayor, c => CH() && CH().talkMayor(c, 'office')); let tick = 0;
    const sync = () => { const L = CH() && CH().look ? CH().look() : {}; setP(win, { time: viewNow(), fixed: L.fixed ? 1 : 0 }); setP(kc, { has: L.fixed ? 1 : 0 }); mayor.hidden = !(CH() && CH().mayorIn && CH().mayorIn()); };
    sc.hot = { sync, mayor, window: win }; sc.life = { count: () => (mayor.hidden ? 0 : 1) }; sc.env = softEnv(Wd, .6, .45); sync();
    const u0 = sc.update; sc.update = (dt, gm) => { u0(dt, gm); if ((tick -= dt) <= 0) { tick = 1; sync(); } idle(mayor, dt); if (!(mayor._hold > 0)) { mayor.dir = 1; mayor.pose = Math.floor(G.time / 7) % 2 ? 'work' : null; } };
    const e0 = sc.onEnter; sc.onEnter = (o, pv) => { e0(o, pv); sync(); if (CH()) CH().arrivedIn('mayor', sc); };
  },
});

/* ---------------- the clock tower ---------------- */
const T = kit();
(function build() {
  const { H, Wl, S } = T;
  Wl('clockface', 'y', 5.4, { h: 10, m: 10 }, { face: 1 }); Wl('furn.hotel.window', 'y', 1, { w: 3, view: 'bay' }, { win: 1, view: 'bay' }); Wl('furn.hotel.window', 'y', 10, { w: 3 }, { win: 1, view: 'city' });
  Wl('furn.hotel.window', 'x', 1.6, { w: 3, seed: 4 }, { win: 1, view: 'plaza' }); Wl('furn.hotel.window', 'x', 6.2, { w: 3, view: 'bay', seed: 7 }, { win: 1, view: 'hills' });
  H('clockworks', 5.4, 1.4, {}, { works: 1 }); H('bell', 10.6, 2.6, {}, { bell: 1 }); H('telescope', 1.6, 5, {}); H('bench', 9.6, 7.4, { w: 3, c: '#5a4636' }); H('shelves', 12.6, 5.6, { w: 2.5, kind: 'boxes', h: 1.8, seed: 41, c: '#6a4a34' }, { flip: true }); H('bench', 3.4, 8.2, { w: 2, c: '#5a4636' }); H('parapet', 1, 10.2, { w: 5 }); H('parapet', 8, 10.2, { w: 5 });
  S(11.6, 6.6, 3, { p: .6, lines: ['A hundred and twelve. I counted every one. I am never going down.', 'You can see the lighthouse AND the airport. And my house. I left the light on.', 'Wait for the hour. It goes right through you.'] }); S(3.2, 6.4, 2, { p: .5, anim: 'phone' }); S(4.4, 8.6, 1, { busy: 1, age: 'kid' });
})();
defineRoom({ id: CR.tower, name: NAME + ' — the Clock Tower', w: 14, d: 11, zoom: 0, music: 'quiet', noCrowd: true, showpiece: 'cityhall', venue: CV.place, floor: GT.f_wood, bg: '#15161f', edge: '#5a4a3a',
  wall: { color: '#c8b49a', trim: '#6a4a34', h: 4.6, pattern: 'brick' },
  exits: [{ x: 7, y: 10.2, label: 'Stairs down (112 steps)', to: 'int:' + CR.clerk, use: () => goRoom('clerk', 'tower') }],
  spawn: { x: 7, y: 9.2, dir: 3 }, items: T.items, npcSpots: T.spots,
  setup(sc) {
    const Wd = sc.world, AP = specs(), works = by(sc, 'works')[0], bell = by(sc, 'bell')[0], face = by(sc, 'face')[0], wins = by(sc, 'win');
    Wd.lights.push({ x: O + 7, y: O + 3.2, z: 0, r: 6, c: '#ffe9b0' }, { x: O + 7, y: O + 8, z: 0, r: 5, c: '#ffe2a0' });
    const cr = crowd(sc, sc.def.npcSpots, { seed: 112, fill: .6 });
    const keeper = mk(sc, Object.assign({}, AP.elder[0], { outfit: null, top: 'jacket', topColor: '#6a5a40', bottom: 'slacks', bottomColor: '#3a3028', hat: 'cap', hatColor: '#3a3028' }), 9.2, 3.4, 1, PEOPLE.keeper, c => CH() && CH().talkKeeper(c));
    let tick = 0, fT = 0, f = 0, ringT = 0, sw = 0, lastH = -1;
    const ring = () => { ringT = 4; };
    const sync = () => { const n = G.now(), op = towerOpen(n), v = viewNow(); setP(face, { h: Math.floor(n.hf), m: Math.floor((n.hf % 1) * 12) * 5 }); for (const o of wins) setP(o, { time: v }); keeper.hidden = !hallOpen(n); for (const c of cr.list) c.hidden = !op || c.roll > (c.spot.busy ? .5 : c.spot.p || .5);
      const hr = Math.floor(n.hf); if (hr !== lastH) { if (lastH >= 0 && (n.hf % 1) < .1) { ring(); if (CH()) CH().struck(hr, sc); } lastH = hr; } };
    sc.hot = { sync, keeper, works, bell, face, ring }; sc.life = { crowd: cr, count: () => cr.count() + 1 }; sc.env = softEnv(Wd, .5, .55); sync();
    const u0 = sc.update; sc.update = (dt, gm) => { u0(dt, gm); cr.update(dt); if ((tick -= dt) <= 0) { tick = 1; sync(); } if ((fT -= dt) <= 0) { fT = .3; f = (f + 1) % 4; setP(works, { f }); }
      if (ringT > 0) { ringT -= dt; const s = ringT <= 0 ? 0 : Math.floor(ringT * 3) % 2 ? 1 : -1; if (s !== sw) { sw = s; setP(bell, { swing: s }); if (s === 1) bubble({ x: O + 11.5, y: O + 3.2, z: 1.6 }, 'BONG', 900); } }
      idle(keeper, dt); if (!(keeper._hold > 0)) { keeper.dir = 3; keeper.pose = Math.floor(G.time / 5) % 3 ? 'work' : null; } };
    const e0 = sc.onEnter; sc.onEnter = (o, pv) => { e0(o, pv); sync(); if (CH()) CH().arrivedIn('tower', sc); };
  },
});
