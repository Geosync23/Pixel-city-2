// Maple Bay Post — the General Post Office hall (room `post_main`, 26 x 18) and its Sorting Room gallery (room `post_sort`, 22 x 13) + the helpers and fixture handlers shared with the
// branch offices (post_branches.js). Gameplay lives in sim/post.js (G.post). City door `door:post_main` (runtime poi on the existing bld.civic.postoffice in Old Town).
// Exits (doormats with `to`, so the nav arrow can route): front doors -> city, "Sorting Room Gallery" -> int:post_sort and back.
// Hall: scene.hot = { sync(), call(win) (send the next waiting customer to a window), callers, sign (NOW SERVING board), windows, master (the Postmaster), fair (stamp-fair tables), trolley }, scene.life = { crowd, count() }.
// Sorting room: scene.hot = { sync(), sorters, bins, dock, van() (force a van cycle), throwOne() }, parcels fly from the belt into the district bins; a van backs up to the dock door and is loaded.
// Fixture tags handled here (only in rooms whose def has `post`): post_boxes, post_window, post_desk, post_pack, post_glass, post_stamps, post_slot, post_wall, post_ticket, post_wait, post_counter, post_telegraph,
//   post_bottle, post_keeper, post_cards, post_map, post_photo, post_tide, post_fair, post_dead, post_board, post_rocker.
import { G } from '../../core/game.js';
import { GT } from '../../engine/world.js';
import { defineRoom, registerFixture } from '../interior.js';
import { bubble } from '../../ui/kit.js';
import { crowd } from './_show_life.js';
import { specs } from './_airport_life.js';
import { registerInfo } from './unique_rooms.js';
import { O, setP, mk, step, go, softEnv, dress, seatsOf, propEnt } from './hotel.js';
import { PR, OFFICES, OFFICE_BY_ROOM, NAME, officeOpen, hoursText } from '../../data/post.js';

/* ---------------- shared helpers ---------------- */
export const PS = () => G.post, pick = a => a[Math.floor(Math.random() * a.length)];
export const only = fn => (fx, scene) => (scene.def && scene.def.post ? fn(fx, scene) : null);
export function kit() { const items = [], spots = [], fid = id => (id.includes('.') ? id : 'furn.postoffice.' + id);
  return { items, spots, H: (id, x, y, p, o) => { const it = Object.assign({ id: fid(id), x, y, p: p || {} }, o); items.push(it); return it; }, Wl: (id, wall, at, p, o) => { const it = Object.assign({ id: fid(id), wall, at, p: p || {} }, o); items.push(it); return it; }, S: (x, y, dir, o) => spots.push(Object.assign({ x, y, dir }, o)) }; }
export const by = (sc, k) => sc.world.objs.filter(o => o.data && o.data[k]);
export const fade = (c, out, dt) => { c.alpha = Math.max(0, Math.min(1, (c.alpha === undefined ? (out ? 1 : 0) : c.alpha) + (out ? -dt * 2.5 : dt * 2.5))); if (!out && c.alpha >= 1) c.alpha = undefined; return out ? c.alpha <= 0 : c.alpha === undefined; };
let UNI = null;
/** postal uniforms: clerk (counter), carrier (cap + bag), sorter (shirt sleeves) */
export function uniforms() { if (UNI) return UNI; const A = specs().adult, E = specs().elder, base = (s, o) => Object.assign({}, s, { outfit: null, bag: null, scarf: null, glasses: s.glasses, top: 'jacket', topColor: '#2756a8', bottom: 'slacks', bottomColor: '#22304e', shoes: '#2f2c3a', hat: null, accent: '#f2c230' }, o);
  UNI = { clerk: [3, 8, 13, 21, 27, 33].map(i => base(A[i % A.length], { top: 'cardigan', topColor: '#2756a8', innerColor: '#f4f0e8' })), carrier: [5, 11, 18, 24, 30, 36].map(i => base(A[i % A.length], { hat: 'cap', hatColor: '#2756a8', bag: 'messenger', bagColor: '#c9b78e' })), sorter: [2, 9, 16, 23].map(i => base(A[i % A.length], { top: 'polo', topColor: '#4a7ad0' })),
    master: base(E[1 % E.length], { top: 'suit', topColor: '#22304e', innerColor: '#f4f0e8', hat: 'cap', hatColor: '#22304e', beard: true, glasses: true }) }; return UNI; }
export const LINES = {
  wait: ['B12. They are on B09. I have counted the brass boxes twice. There are a hundred and eighty.', 'It is a jumper for my grandson. He will hate it. It is going anyway.', 'Window two has the scale. Window four has the stamps and the opinions.', 'I like a post office. Nobody is ever in here for a bad reason.', 'Thursdays they stay open till eight. That is when the parcels come out.', 'My mother had box 114 for fifty years. I could not give it up.', 'Somebody sent ME a postcard once. I still have it.'],
  clerk: ['Next, please. Anything fragile, liquid or alive?', 'Standard, express or overnight? Overnight means overnight, I promise.', 'Put it on the scale for me. Don\'t lean on it. Everybody leans on it.', 'First class to anywhere, one stamp. Pick a pretty one, it costs the same.'],
  writer: ['"Dear Margaret." No. "Margaret!" No. "MARGARET." There.', 'The pen is on a chain so that I do not steal it. I was going to steal it.', 'How do you spell "sincerely"? I have written it four ways now.', 'I write to my sister every week. She lives eleven streets away. It is not the same on the telephone.'],
  gallery: ['Watch the one on the left. She has not missed a bin all morning.', 'Is that MY parcel? It could be my parcel.', 'They throw them! I thought they would not throw them.', 'The van comes on the hour. You can set your watch by the beeping.', 'When I am big I am going to be the one who throws.'],
  sorter: ['Harbor! Old Town! Hillcrest! ...you get an arm for it.', 'Mind the yellow line. Past the line you need a cap.', 'We never lose one. We mislay them, briefly.'],
  fair: ['A 1954 Railway Post Office, lightly cancelled. I would not sell it. I am only showing you.', 'Tweezers, never fingers. I will say it at my own funeral.', 'The birds are the gateway. Then it is lighthouses, and then you need a bigger flat.'],
};

/* ---------------- the hall ---------------- */
const W = 26, D = 18, K = kit(), { items, spots, H, Wl, S } = K, WX = [7.6, 10.8, 14, 17.2];
export const WINDOWS = [{ n: 1, short: 'LETTERS', name: 'STAMPS', who: 'Clerk Ines Okoro' }, { n: 2, short: 'PARCELS', name: 'PARCELS', who: 'Clerk Bram Pallister', kg: 0 }, { n: 3, short: 'COLLECT', name: 'COLLECT', who: 'Clerk Sunita Rao' }, { n: 4, short: 'ANYTHING', name: 'ALL POST', who: 'Clerk Teodor Wren' }];
(function build() {
  Wl('boxwall', 'y', .5, { w: 6, rows: 5, mine: -1 }, { boxes: 1 }); Wl('clock', 'y', 6.7, {}, { clock: 1 }); Wl('sign', 'y', 11.2, { t: 'MAPLE BAY POST', t2: 'EST. 1898', w: 4.4 }, { mount: 3.5 }); Wl('furn.cityhall.nowserving', 'y', 20.6, { n: 9, win: 1 }, { sign: 1 });
  WINDOWS.forEach((w, i) => { H('window', WX[i], 1.2, Object.assign({ n: w.n, short: w.short, name: w.name }, w.kg !== undefined ? { kg: 0 } : null), { win: w.n, wname: w.who }); S(WX[i] + 1.5, .72, 1, { kind: 'staff', label: w.who, lines: LINES.clerk, win: w.n }); });
  for (const at of [7.2, 20.2]) Wl('furn.lobby.sconce', 'y', at, {});
  Wl('sortglass', 'x', 1, { w: 6, f: 0 }, { glass: 1 }); Wl('furn.hotel.doorway', 'x', 7.8, { name: 'SORTING ROOM', c: '#22304e', w: 3.6, lit: 1 }); Wl('photowall', 'x', 11.8, {}, { pwall: 1 }); Wl('furn.lobby.restroom', 'x', 15.3, { c: '#5a4030', dc: '#2756a8' }); Wl('furn.lobby.restroom', 'x', 16.5, { c: '#5a4030', dc: '#1a3a78' });
  H('stampcase', 21.4, 3.6, {}, { phil: 1 }); H('furn.hotel.carpet', 12, 9.8, { w: 2.2, d: 7.2, c: '#22304e' });
  for (const y of [5.4, 7]) for (const x of [7.4, 13.4]) H('furn.cityhall.waitrow', x, y, { n: 6, c: y === 7 ? '#8a5a34' : '#2756a8' }, { wait: 1, tags: ['post_wait'] });
  H('furn.cityhall.ticketmachine', 14.6, 13.4, {}, { tags: ['post_ticket'] }); H('desk', 3.4, 12.2, {}); H('desk', 6.6, 12.2, {}); H('packtable', 19.6, 8.6, {}); H('slots', 22.4, 13.4, {}); H('sacks', 24.2, 6.2, { seed: 3 }, { solid: false });
  H('fairtable', 2.6, 4.6, { seed: 3 }, { fair: 1 }); H('fairtable', 19.4, 12.2, { seed: 8, t: 'ALBUMS' }, { fair: 2 }); S(3.6, 4.15, 1, { fair: 1, label: 'Stamp dealer', lines: LINES.fair, age: 'elder' }); S(20.4, 11.75, 1, { fair: 1, label: 'Album dealer', lines: LINES.fair }); S(3.2, 6, 3, { fair: 1 }); S(4.4, 6.1, 3, { fair: 1, age: 'elder' }); S(20.2, 13.7, 3, { fair: 1 }); S(21.2, 13.6, 3, { fair: 1, age: 'kid' });
  H('furn.cityhall.planter', 1, 16.2, { k: 'tulips' }); H('furn.cityhall.planter', 23.4, 16.2, {}); H('furn.cityhall.bench', 9, 15.8, { w: 3 });
  S(4.6, 13.75, 3, { p: .7, anim: 'work', label: 'Letter writer', lines: LINES.writer }); S(7.8, 13.75, 3, { busy: 1, anim: 'work', label: 'Letter writer', lines: LINES.writer }); S(20.9, 10.2, 3, { p: .6, anim: 'work' }); S(2.2, 2.6, 2, { p: .5 }); S(4.2, 1.5, 3, { p: .6, anim: 'read' });
  S(23.1, 14.6, 3, { busy: 1 }); S(22.6, 5.2, 3, { p: .55 }); S(15.9, 14.6, 3, { busy: 1 }); S(2.6, 4.6, 2, { busy: 1, age: 'kid' });
})();

defineRoom({ id: PR.main, name: NAME, w: W, d: D, zoom: 0, music: 'quiet', noCrowd: true, post: 'main', showpiece: 'post', venue: PR.main, floor: GT.f_tile, bg: '#15161f', edge: '#4a4a52',
  wall: { color: '#efe6d0', trim: '#2756a8', h: 4.6, rail: 1.2 },
  exits: [{ x: 13, y: 17.4, label: 'Exit to Old Town', to: 'city' }, { x: 1.4, y: 9.6, label: 'Sorting Room Gallery', to: 'int:' + PR.sort, use: () => G.go('int:' + PR.sort, { x: O + 11, y: O + 11.2, dir: 3 }) }],
  spawn: { x: 13, y: 16.3, dir: 3 }, items, npcSpots: spots,
  setup(sc) {
    const Wd = sc.world, AP = specs(), U = uniforms(), sign = by(sc, 'sign')[0], wins = by(sc, 'win'), glass = by(sc, 'glass')[0], boxes = by(sc, 'boxes')[0], pwall = by(sc, 'pwall')[0], clock = by(sc, 'clock')[0], fairT = by(sc, 'fair');
    Wd.lights.push({ x: O + 12, y: O + 3.4, z: 0, r: 9, c: '#fff4dc' }, { x: O + 13, y: O + 9, z: 0, r: 8, c: '#fff4dc' }, { x: O + 22.5, y: O + 4, z: 0, r: 4.5, c: '#ffe9b0' }, { x: O + 5, y: O + 13, z: 0, r: 4.5, c: '#fff0d0' }, { x: O + 3, y: O + 4, z: 0, r: 5, c: '#cfe0ff' });
    const seats = seatsOf(sc, /cityhall\.waitrow/, { add: (f, i, n) => ({ busy: n % 2, wait: 1, anim: n % 5 === 0 ? 'read' : n % 7 === 0 ? 'phone' : undefined }) });
    const cr = crowd(sc, sc.def.npcSpots.concat(seats), { seed: 1898, fill: .5, lines: LINES.wait });
    dress(cr, (s, c) => (s.kind === 'staff' ? U.clerk[(s.win || 0) % U.clerk.length] : null));
    const master = mk(sc, U.master, 22.7, 3.1, 1, 'Postmaster Fairweather', c => PS() && PS().master(sc, c));
    const callers = [0, 1, 2].map(i => { const c = mk(sc, AP.adult[i * 5 + 2], 13, 9, 3, 'Customer', LINES.wait); c.hidden = true; c.speed = 1.7; c.job = null; return c; });
    // a postal worker wheels a trolley between the sorting-room door and the counters
    const pusher = mk(sc, U.sorter[1], 2.4, 9.6, 0, 'Postal worker', ['Coming through! Hot post!', 'Second delivery is on the trolley. Do not let window two tell you otherwise.', 'Forty years of trolleys and one squeaky wheel. Always the same wheel.']), troll = propEnt('furn.postoffice.trolley', { n: 2 }, sc); pusher.hidden = true; troll.hidden = true; pusher.job = null; let pushT = 14;
    let tick = 0, lastN = -1, open = null, lvl = -1, fairOn = null, gf = 0, gT = 0;
    function call(win) {
      const c = callers.find(q => !q.job); if (!c) return false; const from = pick(cr.list.filter(q => q.spot.wait && !q.hidden)) || null, wi = (win || 1) - 1, wx = WX[wi] + 1.5;
      c.setSpec(from ? from.spec : pick(AP.adult)); c.x = from ? from.x : O + 13; c.y = (from ? from.y : O + 9) + .7; c.hidden = false; c.alpha = 0; c.pose = null; if (from) { from.hidden = true; from._gone = 30; }
      c.poseOpts = Math.random() < .5 ? { item: 'box' } : null; c.job = { st: 0, t: 0, wx }; if (!go(c, Wd, wx, 2.75)) { c.x = O + wx; c.y = O + 2.75; } return true;
    }
    const sync = () => {
      const n = G.now(), P = PS(), op = officeOpen(OFFICES[0], n), q = P ? P.queue.state() : { serving: 9, win: 1 };
      if (op !== open) { open = op; wins.forEach(o => setP(o, { shut: op ? 0 : 1 })); master.hidden = !op; }
      setP(sign, { n: q.serving % 100, win: q.win }); if (q.serving !== lastN) { if (lastN >= 0 && op && !q.mine) call(q.win); lastN = q.serving; }
      setP(clock, { h: n.hour, m: Math.floor(n.minute / 5) * 5 });
      const look = P ? P.look() : {}; setP(boxes, { mine: look.box === undefined ? -1 : look.box, has: look.boxMail ? 1 : 0 }); setP(pwall, { me: look.wall ? 1 : 0 });
      const fo = !!(P && P.fairOn()); if (fo !== fairOn) { fairOn = fo; for (const o of fairT) { o.hidden = !fo; if (o.solid) { if (fo) Wd.block(o.B[0], o.B[1], o.B[3], o.B[4]); else Wd.free(o.B[0], o.B[1], o.B[3], o.B[4]); } } lvl = -1; }
      const h = n.hf, L = !op ? 0 : h < 9.5 ? .45 : h < 12.5 ? .75 : h < 14 ? .6 : h < 17 ? .7 : .5;
      if (L !== lvl) { lvl = L; for (const c of cr.list) { const s = c.spot; c.hidden = s.fair ? !fo || !op : s.kind === 'staff' ? !op : s.wait ? c.roll > L * (s.busy ? .5 : .75) : s.busy ? L < .7 || c.roll > .6 : c.roll > Math.min(s.p || .5, L + .1); c._gone = 0; } }
    };
    sc.hot = { sync, call, callers, sign, windows: wins, master, fair: fairT, trolley: troll, wx: WX, weigh(kg, on) { setP(wins.find(o => o.data.win === 2), { kg: kg || 0, parcel: on ? 1 : 0 }); } };
    sc.life = { crowd: cr, count: () => cr.count() + callers.filter(c => !c.hidden).length + 1 };
    sc.env = softEnv(Wd, .7, .35); sync();
    const u0 = sc.update; sc.update = (dt, gm) => {
      u0(dt, gm); cr.update(dt); if ((tick -= dt) <= 0) { tick = .6; sync(); for (const c of cr.list) if (c._gone > 0 && (c._gone -= .6) <= 0 && open) c.hidden = false; }
      if ((gT -= dt) <= 0) { gT = .28; gf = (gf + 1) % 8; setP(glass, { f: gf }); }
      master.t += dt; master.moving = false; if (master._hold > 0) master._hold -= dt; else { master.dir = 1; master.pose = Math.floor(G.time / 7) % 3 === 0 ? 'read' : null; }
      for (const c of callers) { const j = c.job; if (!j) continue; const mv = step(c, Wd, dt); j.t += dt;
        if (j.st === 0) { fade(c, false, dt); if (!mv) { j.st = 1; j.t = 0; c.dir = 3; c.pose = 'talk'; c.poseOpts = null; } }
        else if (j.st === 1) { if (j.t > 6) { j.st = 2; c.pose = null; if (!go(c, Wd, 13, 16.4)) j.st = 3; } }
        else if (j.st === 2) { if (!mv || j.t > 30) j.st = 3; }
        else if (fade(c, true, dt)) { c.hidden = true; c.alpha = undefined; c.job = null; } }
      // the trolley run
      if (open) { const j = pusher.job; if (!j) { if ((pushT -= dt) <= 0) { pushT = 38 + Math.random() * 30; pusher.hidden = false; pusher.alpha = 0; pusher.x = O + 2.2; pusher.y = O + 9.6; pusher.job = { st: 0, back: Math.random() < .5 }; go(pusher, Wd, 18.6, 3.2); } }
        else { const mv = step(pusher, Wd, dt); if (j.st === 0) { fade(pusher, false, dt); if (!mv) { j.st = 1; j.t = 0; pusher.pose = 'work'; } } else if (j.st === 1) { if ((j.t += dt) > 4) { j.st = 2; pusher.pose = null; troll.set({ n: 0 }); go(pusher, Wd, 2.2, 9.6); } } else if (j.st === 2) { if (!mv) j.st = 3; } else if (fade(pusher, true, dt)) { pusher.hidden = true; pusher.alpha = undefined; pusher.job = null; troll.set({ n: 2 }); } }
        troll.hidden = pusher.hidden; if (!pusher.hidden) { const dx = [1, 0, -1, 0][pusher.dir], dy = [0, 1, 0, -1][pusher.dir]; troll.flip = pusher.dir === 1 || pusher.dir === 3; troll.fit(); troll.x = pusher.x + dx * .75 - (troll.flip ? .3 : .5); troll.y = pusher.y + dy * .75 - (troll.flip ? .5 : .3); troll.alpha = pusher.alpha; } }
      else { pusher.hidden = true; troll.hidden = true; pusher.job = null; }
    };
    const e0 = sc.onEnter; sc.onEnter = (o, pv) => { e0(o, pv); lastN = -1; sync(); if (PS()) PS().arrived('main', sc, pv); };
  },
});

/* ---------------- the sorting room ---------------- */
const SK = kit(), SW = 22, SD = 13, BINS = ['OLD', 'HBR', 'HIL', 'MPL', 'DTN', 'AWY'];
(function build2() {
  const { H, Wl, S } = SK;
  H('pigeon', 1, .2, { w: 3, seed: 5 }); H('pigeon', 4.4, .2, { w: 3, seed: 9 }); H('pigeon', 7.8, .2, { w: 2.4, seed: 12 }); Wl('sign', 'y', 10.6, { t: 'SORTING FLOOR', w: 3.8 }, { mount: 2.9 }); Wl('dock', 'y', 15.4, { st: 0 }, { dock: 1 }); Wl('clock', 'y', 13.6, {}, { clock: 1 });
  H('conveyor', 2, 3.2, { w: 10, f: 0 }, { belt: 1 }); BINS.forEach((t, i) => H('bin', 2.4 + i * 1.6, 5.9, { t, n: i % 3 }, { bin: i })); H('sacks', 13.2, 1.2, { seed: 4 }); H('sacks', 19.6, 1, { seed: 7 }); H('trolley', 13.4, 4.4, { n: 2 }, { tro: 1 });
  for (let i = 0; i < 5; i++) H('rail', i * 4.4, 8.3, { w: 4.4 }); H('cabinet', 1.4, 9.2, {}, { dead: 1 }); H('furn.cityhall.bench', 15.6, 10.4, { w: 3 }); H('furn.cityhall.planter', 19.6, 11.2, {});
  Wl('furn.lobby.sconce', 'x', 2, {}); Wl('sign', 'x', 9.4, { t: 'GALLERY', w: 2.2, c: '#22304e' }, { mount: 2.2 });
  S(6.2, 9.1, 3, { p: .8, label: 'Visitor', lines: LINES.gallery }); S(8.8, 9.1, 3, { p: .6, age: 'kid', label: 'Kid', lines: LINES.gallery }); S(9.6, 9.15, 3, { p: .6, label: 'Visitor', lines: LINES.gallery }); S(13, 9.1, 3, { busy: 1, age: 'elder', label: 'Visitor', lines: LINES.gallery }); S(18.4, 9.1, 3, { p: .4, lines: LINES.gallery });
})();
defineRoom({ id: PR.sort, name: NAME + ' — the Sorting Room', w: SW, d: SD, zoom: 0, music: 'office', noCrowd: true, post: 'sort', showpiece: 'post', venue: PR.main, floor: GT.f_stone, floors: [{ x0: 0, y0: 8.6, x1: SW, y1: SD, floor: GT.f_wood }], bg: '#12141c', edge: '#3a3e48',
  wall: { color: '#c9d2dc', trim: '#2756a8', h: 4, rail: 1.2 },
  exits: [{ x: 11, y: 12.4, label: 'Back to the hall', to: 'int:' + PR.main, use: () => G.go('int:' + PR.main, { x: O + 2.6, y: O + 9.6, dir: 0 }) }],
  spawn: { x: 11, y: 11.2, dir: 3 }, items: SK.items, npcSpots: SK.spots,
  setup(sc) {
    const Wd = sc.world, U = uniforms(), belt = by(sc, 'belt')[0], dock = by(sc, 'dock')[0], bins = BINS.map((t, i) => sc.world.objs.find(o => o.data && o.data.bin === i)), clock = by(sc, 'clock')[0], dead = by(sc, 'dead')[0], tro = by(sc, 'tro')[0];
    Wd.lights.push({ x: O + 6, y: O + 4, z: 0, r: 8, c: '#f4f8ff' }, { x: O + 16, y: O + 4, z: 0, r: 7, c: '#f4f8ff' }, { x: O + 11, y: O + 10.5, z: 0, r: 7, c: '#ffe9b0' });
    Wd.block(O, O + 8.2, O + SW, O + 8.6);
    const cr = crowd(sc, sc.def.npcSpots, { seed: 77, fill: .6, lines: LINES.gallery });
    const sorters = [3.4, 6.6, 9.8].map((x, i) => { const c = mk(sc, U.sorter[i % U.sorter.length], x, 4.75, 3, 'Sorter', LINES.sorter); c.th = 1 + i * .8; c.home = x; return c; });
    const loader = mk(sc, U.carrier[2], 16.6, 3.2, 1, 'Van loader', ['Back her up! Back, back, back... WOAH.', 'Six bags for the harbor, two for the hill. The hill never writes.']); loader.hidden = true;
    const fly = [0, 1, 2, 3].map(() => { const e = propEnt('furn.postoffice.parcelbox', { k: 0 }, sc); e.hidden = true; e.on = 0; return e; });
    const counts = BINS.map((t, i) => i % 3); let bf = 0, bT = 0, tick = 0, open = null, dockT = 12, dst = 0;
    function throwOne(from) { const e = fly.find(q => !q.on); if (!e) return false; const s = from || pick(sorters), bi = Math.floor(Math.random() * BINS.length), b = bins[bi]; if (!b) return false; e.on = 1; e.t = 0; e.bi = bi; e.x0 = s.x - .2; e.y0 = s.y - .3; e.x1 = (b.B[0] + b.B[3]) / 2 - .2; e.y1 = (b.B[1] + b.B[4]) / 2 - .2; e.set({ k: Math.floor(Math.random() * 3) }); e.hidden = false; s.pose = 'lift'; s.dir = 1; s._thrown = .5; return true; }
    const setDock = st => { dst = st; setP(dock, { st }); loader.hidden = st !== 2 || !open; };
    const sync = () => { const n = G.now(), op = n.hf >= 5.5 && n.hf < 20 && n.weekday !== 6; if (op !== open) { open = op; for (const c of sorters) c.hidden = !op; for (const c of cr.list) c.hidden = !officeOpen(OFFICES[0], n) || c.roll > (c.spot.busy ? .45 : c.spot.p || .5); if (!op) setDock(0); }
      setP(clock, { h: n.hour, m: Math.floor(n.minute / 5) * 5 }); const P = PS(); setP(dead, { gone: P && P.chain().st >= 1 ? 1 : 0 }); };
    sc.hot = { sync, sorters, bins, dock, throwOne, van() { dockT = 0; setDock(0); }, counts };
    sc.life = { crowd: cr, count: () => cr.count() + sorters.filter(c => !c.hidden).length };
    sc.env = softEnv(Wd, .75, .3); sync();
    const u0 = sc.update; sc.update = (dt, gm) => {
      u0(dt, gm); cr.update(dt); if ((tick -= dt) <= 0) { tick = .7; sync(); }
      if (!open) return; if ((bT -= dt) <= 0) { bT = .16; bf = (bf + 1) % 4; setP(belt, { f: bf }); }
      for (const c of sorters) { c.t += dt; c.moving = false; if (c._hold > 0) { c._hold -= dt; continue; } if (c._thrown > 0) { if ((c._thrown -= dt) <= 0) { c.pose = 'work'; c.dir = 3; } continue; } c.pose = 'work'; c.dir = 3; if ((c.th -= dt) <= 0) { c.th = 1.6 + Math.random() * 2.2; throwOne(c); } }
      for (const e of fly) { if (!e.on) continue; e.t += dt * 1.7; const k = Math.min(1, e.t); e.x = e.x0 + (e.x1 - e.x0) * k; e.y = e.y0 + (e.y1 - e.y0) * k; e.z = 1 + Math.sin(k * Math.PI) * 1.3 - k * .15; if (k >= 1) { e.on = 0; e.hidden = true; counts[e.bi] = (counts[e.bi] + 1) % 4; setP(bins[e.bi], { n: counts[e.bi] }); } }
      if ((dockT -= dt) <= 0) { if (dst === 0) { setDock(1); dockT = 2.5; sc._next = 2; } else if (dst === 1) { if (sc._next === 2) { setDock(2); dockT = 16; loader.pose = 'lift'; setP(tro, { n: 0 }); } else { setDock(0); dockT = 26 + Math.random() * 20; setP(tro, { n: 2 }); } } else { setDock(1); dockT = 2.5; sc._next = 0; } }
      if (!loader.hidden) { loader.t += dt; if (loader._hold > 0) loader._hold -= dt; else loader.pose = Math.floor(G.time / 1.6) % 2 ? 'lift' : 'carry'; }
    };
    sc.interactables.push({ x: O + 11, y: O + 8.9, label: 'Watch the sorting floor', h: 1, hit: 20, range: 1.6, spot: { x: O + 11, y: O + 9.2 }, use: () => PS() && PS().watchSort(sc) });
    const e0 = sc.onEnter; sc.onEnter = (o, pv) => { e0(o, pv); sync(); if (PS()) PS().arrived('sort', sc, pv); };
  },
});

/* ---------------- fixture handlers (all rooms of the post) ---------------- */
export const order = 44;
export function init() {
  const R = (tag, label, fn, extra) => registerFixture(tag, only((fx, sc) => Object.assign({ label: typeof label === 'function' ? label(fx, sc) : label, use: () => { const P = PS(); if (P) fn(P, fx, sc); } }, extra)));
  R('post_boxes', 'P.O. boxes', (P, fx, sc) => P.poBox(sc)); R('post_window', (fx) => `Window ${fx.item.win}: ${WINDOWS[fx.item.win - 1].name === 'STAMPS' ? 'letters and stamps' : WINDOWS[fx.item.win - 1].short.toLowerCase()}`, (P, fx, sc) => P.window(fx.item.win, sc), { range: 1.6 });
  R('post_desk', 'Writing desk', (P, fx, sc) => P.desk(fx, sc)); R('post_pack', 'Packing table', (P, fx, sc) => P.pack(fx, sc)); R('post_glass', 'Look into the sorting room', (P, fx, sc) => P.glass(sc)); R('post_stamps', 'Philately counter', (P, fx, sc) => P.philately(sc));
  R('post_slot', 'Posting box', (P, fx, sc) => P.postLetters('slot')); R('post_wall', 'Friends of the Post', (P, fx, sc) => P.wall(sc)); R('post_ticket', 'Take a number', (P, fx, sc) => P.takeNumber(sc)); R('post_wait', 'Sit and wait for your number', (P, fx, sc) => P.wait(fx, sc));
  R('post_counter', (fx, sc) => 'Counter: ' + ((OFFICE_BY_ROOM[sc.roomId] || {}).master || 'the postmaster'), (P, fx, sc) => P.counter(sc, fx), { range: 1.6 }); R('post_telegraph', 'The telegraph key', (P, fx, sc) => P.telegram(sc, fx)); R('post_bottle', 'Bottle post', (P, fx, sc) => P.bottle(sc));
  R('post_keeper', 'Letters to the lighthouse keeper', (P, fx, sc) => P.keeper(sc)); R('post_cards', 'Postcard rack', (P, fx, sc) => P.cards(sc)); R('post_map', 'Map of Maple Bay', (P, fx, sc) => P.cityMap(sc)); R('post_photo', 'Photo postcard: "Greetings from Maple Bay"', (P, fx, sc) => P.photoCard(sc, fx));
  R('post_tide', 'Tide board', (P, fx, sc) => P.tide(sc)); R('post_fair', 'Stamp fair table', (P, fx, sc) => P.fair(sc), { visible: () => !!(PS() && PS().fairOn()) }); R('post_dead', 'The dead-letter cabinet', (P, fx, sc) => P.deadCabinet(sc)); R('post_board', 'Community notice board', (P, fx, sc) => P.board(sc));
  for (const o of OFFICES) registerInfo(o.name, { blurb: o.blurb, signature: o.key === 'main' ? 'Take a number, watch the board, and have a parcel weighed on the brass scale at window 2.' : o.key === 'hill' ? 'A telegram tapped out on the brass key while you wait.' : o.key === 'harbor' ? 'A message in a bottle, sent the slow way.' : o.key === 'down' ? 'A photo postcard with you on it.' : 'The line on pension day, and the notice board that knows everything.',
    tryThis: o.key === 'main' ? ['Write a letter home at the desk with the pens on chains', 'Pack and wrap a parcel, then have it weighed', 'Buy the bird stamps for your album', 'Watch the sorters throw parcels from the gallery', 'Rent a brass P.O. box'] : ['Join the line at the counter', 'Read the notice board', 'Post a letter in the box'], activities: ['seat'], kind: 'post office', hours: hoursText(o) });
}
