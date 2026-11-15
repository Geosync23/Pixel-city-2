// Maple Bay City Hall — the Permits & Records hall (room `cityhall_records`, 26 x 16) and the basement Archive (room `cityhall_archive`, 22 x 14).
// Records: a take-a-number machine, a NOW SERVING board that really advances (G.cityhall.queue), five service windows (data/cityhall.js WINDOWS), rows of waiting seats, a photo booth, a forms table.
//   scene.hot = { sync(), call() (send the next citizen to a window now), callers, sign, windows, booth, flash() }
// Archive: shelving stacks, the map drawers (drawer 62-F), the microfilm reader, photographs, the newspaper rack and Hester Quill at the print desk.
//   scene.hot = { sync(), hester, reader, mapcase }
import { G } from '../../core/game.js';
import { GT } from '../../engine/world.js';
import { defineRoom } from '../interior.js';
import { bubble } from '../../ui/kit.js';
import { crowd } from './_show_life.js';
import { specs } from './_airport_life.js';
import { O, setP, mk, step, go, softEnv, dress, seatsOf, people } from './hotel.js';
import { CH, pick, kit, by, fade, idle, goRoom } from './cityhall.js';
import { CR, CV, NAME, PEOPLE, WINDOWS, hallOpen, recordsOpen, archiveOpen } from '../../data/cityhall.js';

/* ---------------- permits & records ---------------- */
const W = 26, D = 16, K = kit(), { items, spots, H, Wl, S } = K, WX = [2.5, 6, 9.5, 13, 16.5];
const LINES = {
  wait: ['A44. I am A44. They are on A41. I have read the fire notice twice.', 'Bring a book. Bring two books.', 'Window three is the fast one today.', 'I am only here for a bicycle plate. That was an hour ago. I do not own a bicycle any more.', 'Do NOT lose your ticket. They start you again. Ask me how I know.', 'The photo booth makes everybody look like a startled owl.', 'It is the pens on chains I admire. Somebody thought of that.'],
  clerk: ['Next, please. Ticket?', 'You want form 27B. Everybody wants form 27B.', 'Sign here, here, and initial there. No, THERE.', 'We close at half past four. The queue does not know that.'],
};
function build() {
  WINDOWS.forEach((w, i) => { H('window', WX[i], 1.2, { n: w.n, short: w.short, name: w.name }, { win: w.n, wname: w.who }); S(WX[i] + 1.5, .7, 1, { kind: 'staff', label: w.who, lines: LINES.clerk, win: w.n }); });
  H('shelves', 2.6, 0, { w: 4, kind: 'boxes', h: 2.1, seed: 2 }, { solid: false }); H('shelves', 7, 0, { w: 4, kind: 'boxes', h: 2.1, seed: 5 }, { solid: false }); H('shelves', 11.4, 0, { w: 4, kind: 'books', h: 2.1, seed: 3 }, { solid: false }); Wl('lostshelf', 'y', 16.4, {}, { lost: 1 });
  Wl('nowserving', 'y', 20.4, { n: 41, win: 1 }, { sign: 1 }); H('photobooth', 21, .5, {}, { booth: 1 }); H('formtable', 23.2, 3.6, {});
  for (const at of [.6, 19.8, 25.5]) Wl('furn.lobby.sconce', 'y', at, {}); Wl('noticeboard', 'x', 3.4, {}); Wl('furn.lobby.restroom', 'x', 7.4, { c: '#5a4030', dc: '#2f6f5f' }); Wl('furn.lobby.restroom', 'x', 8.6, { c: '#5a4030', dc: '#22304e' }); Wl('furn.lobby.sconce', 'x', 11, {}); Wl('portrait', 'x', 12.4, { k: 2 }, { portrait: 2 });
  H('ticketmachine', 14.6, 12, {}); H('furn.hotel.carpet', 11.9, 10.6, { w: 2.2, d: 4.6, c: '#22304e' });
  for (const y of [6, 7.6, 9.2]) for (const x of [4.2, 8.4, 14.4, 18.6]) H('waitrow', x, y, { n: 6, c: y === 7.6 ? '#8a5a34' : '#3a6a8a' }, { wait: 1 });
  H('planter', 1, 14.4, { seed: 2 }); H('planter', 23.4, 14.4, { seed: 6 }); H('bench', 2, 12.2, { w: 3 }, { flip: true });
  S(22.4, 2.7, 3, { p: .6 }); S(24.2, 5.2, 3, { p: .7, anim: 'work' }); S(23.4, 5.3, 3, { busy: 1, anim: 'work' }); S(15.9, 13.2, 3, { busy: 1 }); S(2.9, 5.4, 2, { p: .5 }); S(20.8, 11.6, 0, { busy: 1, anim: 'phone' });
}
build();
const AISLE = [13.2, 5.2];

defineRoom({ id: CR.records, name: NAME + ' — Permits & Records', w: W, d: D, zoom: 0, music: 'office', noCrowd: true, showpiece: 'cityhall', venue: CV.place, floor: GT.f_tile, bg: '#15161f', edge: '#4a4a52',
  wall: { color: '#dfe3dc', trim: '#5e6e62', h: 4.6, rail: 1.2 },
  exits: [{ x: 13, y: 15.4, label: 'Back to the Rotunda', to: 'int:' + CR.hall, use: () => goRoom('hall', 'records') }],
  spawn: { x: 13, y: 14.3, dir: 3 }, items, npcSpots: spots,
  setup(sc) {
    const Wd = sc.world, P = people(), AP = specs(), sign = by(sc, 'sign')[0], wins = by(sc, 'win'), booth = by(sc, 'booth')[0], lost = by(sc, 'lost')[0];
    Wd.lights.push({ x: O + 11, y: O + 3.4, z: 0, r: 8, c: '#f4f8ff' }, { x: O + 13, y: O + 8.4, z: 0, r: 8, c: '#f4f8ff' }, { x: O + 22.5, y: O + 3, z: 0, r: 4, c: '#ffe9b0' }, { x: O + 13, y: O + 13, z: 0, r: 4, c: '#fff0d0' });
    const seats = seatsOf(sc, /cityhall\.waitrow/, { add: (f, i, n) => ({ busy: n % 2, wait: 1, anim: n % 5 === 0 ? 'read' : n % 7 === 0 ? 'phone' : undefined }) });
    const cr = crowd(sc, sc.def.npcSpots.concat(seats), { seed: 1962, fill: .5, lines: LINES.wait });
    dress(cr, (s, c) => (s.kind === 'staff' ? AP.staff[Math.floor(c.roll * AP.staff.length)] : null));
    const callers = [0, 1, 2].map(i => { const c = mk(sc, AP.adult[i * 5 + 2], 13, 9, 3, 'Citizen', LINES.wait); c.hidden = true; c.speed = 1.7; c.job = null; return c; });
    let tick = 0, lastN = -1, flashT = 0, open = null, lvl = -1;
    function call(win) {
      const c = callers.find(q => !q.job); if (!c) return false; const from = pick(cr.list.filter(q => q.spot.wait && !q.hidden)) || null, wi = (win || 1) - 1, wx = WX[wi] + 1.5;
      c.setSpec(from ? from.spec : pick(AP.adult)); c.x = from ? from.x : O + 13; c.y = (from ? from.y : O + 9) + .7; c.hidden = false; c.alpha = 0; c.pose = null; if (from) { from.hidden = true; from._gone = 30; }
      c.job = { st: 0, t: 0, wx }; if (!go(c, Wd, wx, 2.75)) { c.x = O + wx; c.y = O + 2.75; } return true;
    }
    const sync = () => {
      const n = G.now(), op = recordsOpen(n), q = CH() && CH().queue ? CH().queue.state() : { serving: 41, win: 1 };
      if (op !== open) { open = op; wins.forEach(o => setP(o, { shut: op ? 0 : 1 })); }
      setP(sign, { n: q.serving % 100, win: q.win }); if (q.serving !== lastN) { if (lastN >= 0 && op && !q.mine) call(q.win); lastN = q.serving; }
      setP(lost, { key: CH() && CH().chain && CH().chain().st === 5 ? 1 : 0 });
      const h = n.hf, L = !op ? 0 : h < 10 ? .5 : h < 12.5 ? .8 : h < 14 ? .55 : .7;
      if (L !== lvl) { lvl = L; for (const c of cr.list) { const s = c.spot; c.hidden = s.kind === 'staff' ? !op : s.wait ? c.roll > L * (s.busy ? .5 : .75) : s.busy ? L < .7 || c.roll > .6 : c.roll > Math.min(s.p || .5, L + .1); c._gone = 0; } }
    };
    sc.hot = { sync, call, callers, sign, windows: wins, booth, flash() { flashT = .5; setP(booth, { flash: 1 }); }, wx: WX };
    sc.life = { crowd: cr, count: () => cr.count() + callers.filter(c => !c.hidden).length };
    sc.env = softEnv(Wd, .7, .35); sync();
    const u0 = sc.update; sc.update = (dt, gm) => {
      u0(dt, gm); cr.update(dt); if ((tick -= dt) <= 0) { tick = .6; sync(); for (const c of cr.list) if (c._gone > 0 && (c._gone -= .6) <= 0 && open) c.hidden = false; }
      if (flashT > 0 && (flashT -= dt) <= 0) setP(booth, { flash: 0 });
      for (const c of callers) { const j = c.job; if (!j) continue; const mv = step(c, Wd, dt); j.t += dt;
        if (j.st === 0) { fade(c, false, dt); if (!mv) { j.st = 1; j.t = 0; c.dir = 3; c.pose = 'talk'; } }
        else if (j.st === 1) { if (j.t > 6) { j.st = 2; c.pose = null; if (!go(c, Wd, 13, 14.6)) j.st = 3; } }
        else if (j.st === 2) { if (!mv || j.t > 30) j.st = 3; }
        else if (fade(c, true, dt)) { c.hidden = true; c.alpha = undefined; c.job = null; } }
    };
    const e0 = sc.onEnter; sc.onEnter = (o, pv) => { e0(o, pv); lastN = -1; sync(); if (CH()) CH().arrivedIn('records', sc); };
  },
});

/* ---------------- the archive ---------------- */
const A = kit(), AW = 22, AD = 14;
const ALINES = { reader: ['I am looking for my great-grandmother. She is in here somewhere, in a hat.', 'The 1924 tram map has a pencil note about the clock. Scandalous.', 'Shh. Well, not shh. But softly.', 'They flooded in ninety-eight. Half the loose things went up to Lost and Found.'] };
(function build2() {
  const { H, Wl, S } = A;
  H('shelves', 1, .2, { w: 4, kind: 'boxes', seed: 7, label: '1887' }); H('shelves', 5.2, .2, { w: 4, kind: 'boxes', seed: 9, label: '1962' }, { y62: 1 }); H('shelves', 9.4, .2, { w: 3, kind: 'rolls', seed: 4 });
  H('desk', 13.6, 2, { kind: 'archive', w: 3 }, { venue: CV.archive }); H('newsrack', 18.6, .8, {}); Wl('furn.lobby.sconce', 'y', 12.8, {}); Wl('furn.lobby.sconce', 'y', 17.4, {}); Wl('plaque', 'y', 19.4, { t: 'CITY ARCHIVE', t2: 'EST. 1911' }, { sign: 1 });
  Wl('photowall', 'x', 3, { k: 0 }, { photos: 0 }); Wl('photowall', 'x', 7, { k: 2 }, { photos: 2 }); Wl('furn.lobby.sconce', 'x', 1.4, {}); Wl('furn.lobby.sconce', 'x', 11, {});
  H('shelves', 2, 4.6, { w: 4, kind: 'boxes', seed: 11 }); H('shelves', 2, 7, { w: 4, kind: 'books', seed: 13 }); H('shelves', 2, 9.4, { w: 4, kind: 'boxes', seed: 15, label: '1998' });
  H('shelves', 7, 4.6, { w: 3, kind: 'books', seed: 17 }); H('shelves', 7, 7, { w: 3, kind: 'rolls', seed: 19 });
  H('mapcase', 11.6, 6.2, {}, { mapcase: 1 }); H('microfilm', 16.2, 6.4, {}, { reader: 1 }); H('microfilm', 18.6, 6.4, {}, { reader2: 1 }); H('bench', 15.2, 10, { w: 3, c: '#5a4636' });
  H('furn.hotel.carpet', 10.1, 9.4, { w: 2, d: 4, c: '#4a3a30' });
  S(19.5, 7.75, 3, { p: .7, anim: 'type', label: 'Researcher', lines: ALINES.reader }); S(4.4, 6, 3, { p: .5, anim: 'read' }); S(8, 8.6, 3, { busy: 1, anim: 'read' }); S(19.4, 2.2, 3, { p: .5, anim: 'read' });
})();
defineRoom({ id: CR.archive, name: NAME + ' — the City Archive', w: AW, d: AD, zoom: 0, music: 'quiet', noCrowd: true, showpiece: 'cityhall', venue: CV.place, floor: GT.f_stone, bg: '#101018', edge: '#3a3632',
  wall: { color: '#b8a48c', trim: '#5a4636', h: 3.4, pattern: 'brick' },
  exits: [{ x: 11, y: 13.2, label: 'Stairs up to the Rotunda', to: 'int:' + CR.hall, use: () => goRoom('hall', 'archive') }],
  spawn: { x: 11, y: 12.1, dir: 3 }, items: A.items, npcSpots: A.spots,
  setup(sc) {
    const Wd = sc.world, P = people(), AP = specs(), reader = by(sc, 'reader')[0], reader2 = by(sc, 'reader2')[0], mapcase = by(sc, 'mapcase')[0];
    Wd.lights.push({ x: O + 15, y: O + 3.4, z: 0, r: 5, c: '#ffd9a0' }, { x: O + 17.6, y: O + 7.6, z: 0, r: 4.5, c: '#d8ffe0' }, { x: O + 12.6, y: O + 8, z: 0, r: 4, c: '#ffe2a0' }, { x: O + 11, y: O + 12, z: 0, r: 3.5, c: '#ffe2a0' }, { x: O + 5, y: O + 3, z: 0, r: 4, c: '#ffd9a0' }, { x: O + 5, y: O + 8.6, z: 0, r: 4, c: '#ffd9a0' });
    const cr = crowd(sc, sc.def.npcSpots, { seed: 1924, fill: .6, lines: ALINES.reader });
    const hester = mk(sc, Object.assign({}, AP.elder[4], { outfit: 'librarian' }), 15.1, 1.55, 1, PEOPLE.archivist, c => CH() && CH().archivist(sc, c));
    let tick = 0, open = null;
    const sync = () => { const n = G.now(), op = archiveOpen(n); if (op !== open) { open = op; hester.hidden = !op; for (const c of cr.list) c.hidden = !op || c.roll > (c.spot.busy ? .4 : c.spot.p || .5); } setP(reader2, { on: op && !cr.list[0].hidden ? 1 : 0 }); setP(reader, { on: CH() && CH().reading && CH().reading() ? 1 : 0 }); setP(mapcase, { open: CH() && CH().chain && CH().chain().drawer ? 1 : 0 }); };
    sc.hot = { sync, hester, reader, mapcase }; sc.life = { crowd: cr, count: () => cr.count() + 1 };
    const env0 = softEnv(Wd, .35, .7); sc.env = t => { const e = env0(t); return { amb: e.amb === '#ffffff' ? '#d8cdbc' : e.amb, dark: Math.max(.34, e.dark), bg: e.bg, night: e.night }; }; sync();
    const u0 = sc.update; sc.update = (dt, gm) => { u0(dt, gm); cr.update(dt); if ((tick -= dt) <= 0) { tick = .7; sync(); } idle(hester, dt); if (!(hester._hold > 0)) { hester.dir = 1; hester.pose = Math.floor(G.time / 5) % 2 ? 'read' : null; } };
    const e0 = sc.onEnter; sc.onEnter = (o, pv) => { e0(o, pv); sync(); if (CH()) CH().arrivedIn('archive', sc); };
  },
});
