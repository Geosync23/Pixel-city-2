// Maple Bay Post — the four branch offices, each its own small room with a REAL standing line that moves up:
//   post_maplewood (11 x 9)  Mrs. Opal Greer's cottage parlour: sweet jars, a cat on the counter, a rocking chair, the notice board that knows everything
//   post_hillcrest (12 x 9)  Mr. Leopold Vance's Post & Telegraph: marble, a brass telegraph key that works, the old street directories
//   post_harbor   (12 x 10)  Skipper Dolly Marsh's Mail Boat Office: tide board, bottle post, the red box for letters to the lighthouse keeper
//   post_downtown (12 x 9)   Kenji Abe's Postcard Counter in the Visitor Info pavilion: card racks, a wall map, the "Greetings from Maple Bay" photo backdrop
// scene.hot = { key, master (Char), line: { count(), ahead() (people in front of you, -1 = not in line), join() -> Promise<bool> (true = you are at the counter), leave(), serve() (advance now), cust }, sync(), weigh(kg, on) }
// The line: up to four customers stand in front of the counter; every TUNE.LINE_MIN game minutes the clerk finishes with the front one, who leaves by the door, and everybody steps up. New people come in by the door.
import { G } from '../../core/game.js';
import { GT } from '../../engine/world.js';
import { defineRoom } from '../interior.js';
import { specs } from './_airport_life.js';
import { crowd } from './_show_life.js';
import { O, setP, mk, step, go, softEnv } from './hotel.js';
import { PR, OFFICE_BY_KEY, TUNE, officeOpen } from '../../data/post.js';
import { PS, kit, by, fade, uniforms, pick } from './post.js';

const TALK = {
  maple: { line: ['Pension day. We all know each other\'s business in this line, and we like it that way.', 'Opal weighs a parcel like she is guessing your age.', 'The cat is called Second Class. He does not hurry.', 'I only came for one stamp. That was before the news about the Hendersons.'], side: ['I am knitting. For whom? I have not decided who deserves it.', 'The board says there is a bake sale. The board is never wrong.'] },
  hill: { line: ['Mr. Vance still says "by return of post". I find it soothing.', 'One sends a telegram for weddings, funerals and winning horses.', 'I have had box 12 since before the terraces had railings.', 'He polishes that key every morning. You could shave in it.'], side: ['The directories go back to 1890. He lets you look, if your hands are clean.', 'From this hill the mail takes eleven minutes longer. We consider it a mark of distinction.'] },
  harbor: { line: ['Boat goes at ten. Miss it and your letter has a day ashore.', 'Dolly sorted mail in a force nine once. Did not spill her tea.', 'It is for my brother on the dredger. He only reads the football.', 'The keeper writes back, you know. Proper letters. In ink.'], side: ['A bottle I threw in sixty-one came back last spring. Same bottle. Somebody had added a postscript.', 'Smells of rope in here. Best smell there is.'] },
  down: { line: ['Just the one postcard. And the stamp. And could you post it for me. And where is the lighthouse?', 'We are here till Thursday. I have written "wish you were here" eleven times, and meant it twice.', 'Do you have one with the otter? My nephew will only accept the otter.', 'The photo one! Stand there, look happy, and it is in the post before you have blinked.'], side: ['I am choosing. Do not rush me. It is between the tram and the pond.', 'Is the map to scale? It feels bigger when you walk it.'] },
};
function lineLife(sc, key, spot) {
  const Wd = sc.world, AP = specs(), cust = [0, 1, 2, 3].map(i => { const c = mk(sc, AP.adult[(i * 7 + key.length * 3) % AP.adult.length], 0, 0, 3, 'In the line', TALK[key].line, 'customer'); c.hidden = true; c.speed = 1.6; c.st = 'out'; return c; });
  const Q = [], door = sc.def.exits[0], L = { me: -1, res: null, acc: 0, arr: 2 }, slot = i => spot(L.me >= 0 && i >= L.me ? i + 1 : i);
  const place = (c, i, snap) => { const s = slot(i); if (snap || !go(c, Wd, s.x, s.y)) { c.x = O + s.x; c.y = O + s.y; c.path = null; } c.st = 'wait'; };
  const enter = snap => { const c = cust.find(q => q.st === 'out'); if (!c || Q.length >= 4) return; c.setSpec(pick(Math.random() < .2 ? AP.elder : AP.adult)); c.hidden = false; c.alpha = snap ? undefined : 0; c.x = O + door.x; c.y = O + door.y - .5; c.pose = null; c.poseOpts = Math.random() < .45 ? { item: 'box' } : null; Q.push(c); place(c, Q.length - 1, snap); };
  const serve = () => { if (L.me === 0) { L.me = -1; const r = L.res; L.res = null; Q.forEach((c, i) => place(c, i)); if (r) r(true); return; }
    const c = Q.shift(); if (c) { c.st = 'leave'; c.pose = null; c.poseOpts = null; if (!go(c, Wd, door.x, door.y - .4)) c.st = 'fade'; } if (L.me > 0) L.me--; Q.forEach((q, i) => place(q, i)); if (L.me === 0 && L.res && !Q.length) { /* your turn comes with the next tick */ } };
  const api = { cust, count: () => Q.length, ahead: () => L.me, serve, slot: () => (L.me >= 0 ? spot(L.me) : null),
    join() { if (L.me >= 0) return Promise.resolve(false); L.me = Q.length; if (L.me === 0) { L.me = -1; return Promise.resolve(true); } L.acc = Math.min(L.acc, TUNE.LINE_MIN * .5); return new Promise(r => { L.res = r; }); },
    leave() { if (L.me < 0) return; L.me = -1; const r = L.res; L.res = null; Q.forEach((c, i) => place(c, i)); if (r) r(false); },
    reset(n) { for (const c of cust) { c.hidden = true; c.st = 'out'; c.alpha = undefined; } Q.length = 0; L.me = -1; L.res = null; for (let i = 0; i < n; i++) enter(true); },
    update(dt, gm, open, want) {
      for (const c of cust) { if (c.st === 'out') continue; const mv = step(c, Wd, dt); if (c.st === 'wait') { if (c.alpha !== undefined) fade(c, false, dt); if (!mv) { c.dir = 3; const i = Q.indexOf(c); c.pose = i === 0 && L.me !== 0 ? 'talk' : null; } } else if (c.st === 'leave') { if (!mv) c.st = 'fade'; } else if (fade(c, true, dt)) { c.hidden = true; c.alpha = undefined; c.st = 'out'; } }
      if (!open) { if (Q.length && (L.acc += gm) >= 1) { L.acc = 0; serve(); } return; }
      L.acc += gm; if (L.acc >= TUNE.LINE_MIN) { L.acc = 0; if (Q.length || L.me === 0) serve(); }
      if ((L.arr -= gm) <= 0) { L.arr = 2 + Math.random() * 5; if (Q.length < want) enter(false); }
    } };
  return api;
}
function branch(key, cfg) {
  const o = OFFICE_BY_KEY[key], K = kit(), cx = cfg.cx, lx = cx + 1.5;
  K.H('counter', cx, 1.3, cfg.counter, { ctr: 1 }); cfg.build(K);
  defineRoom({ id: o.room, name: o.name, w: cfg.w, d: cfg.d, zoom: 1, music: 'quiet', noCrowd: true, post: key, venue: o.room, floor: cfg.floor, floors: cfg.floors, bg: '#15161f', edge: '#4a4a52', wall: cfg.wall,
    exits: [{ x: cfg.ex, y: cfg.d - .6, label: 'Exit', to: 'city' }], spawn: { x: cfg.ex, y: cfg.d - 1.7, dir: 3 }, items: K.items, npcSpots: K.spots,
    setup(sc) {
      const Wd = sc.world, U = uniforms(), ctr = by(sc, 'ctr')[0];
      for (const l of cfg.lights || [[cx + 1.5, 3, 5, '#fff0d0'], [3, cfg.d - 3, 5, '#fff0d0']]) Wd.lights.push({ x: O + l[0], y: O + l[1], z: 0, r: l[2], c: l[3] });
      const master = mk(sc, Object.assign({}, cfg.spec(U)), cx + 1.5, .82, 1, o.master, c => PS() && PS().talkMaster(key, sc, c));
      const line = lineLife(sc, key, i => ({ x: lx, y: 2.95 + i * .85 })), cr = crowd(sc, sc.def.npcSpots, { seed: 40 + key.length * 13, fill: .6, lines: TALK[key].side });
      let open = null, tick = 0;
      const want = () => { const n = G.now(), h = n.hf; return Math.max(0, Math.round((h < 10 ? 2 : h < 12.5 ? 3 : h < 14 ? 1.4 : 2.4) * (cfg.busy || 1) + (PS() && PS().eventOn(key) ? 1 : 0))); };
      const sync = () => { const n = G.now(), op = officeOpen(o, n); if (op !== open) { open = op; master.hidden = !op; for (const c of cr.list) c.hidden = !op || c.roll > (c.spot.p || .6); if (op) line.reset(Math.min(3, want())); } if (cfg.sync) cfg.sync(sc, n); };
      sc.hot = { key, master, line, sync, weigh(kg, on) { setP(ctr, { kg: kg || 0, parcel: on ? 1 : 0 }); } }; sc.life = { crowd: cr, count: () => cr.count() + line.count() + 1 };
      sc.env = softEnv(Wd, .65, .4); sync();
      const u0 = sc.update; sc.update = (dt, gm) => { u0(dt, gm); cr.update(dt); if ((tick -= dt) <= 0) { tick = .8; sync(); } line.update(dt, gm || 0, open, want());
        master.t += dt; master.moving = false; if (master._hold > 0) master._hold -= dt; else { master.dir = 1; master.pose = line.count() || line.ahead() === 0 ? (Math.floor(G.time / 2.5) % 2 ? 'talk' : 'work') : Math.floor(G.time / 6) % 2 ? 'read' : null; } };
      const e0 = sc.onEnter; sc.onEnter = (op, pv) => { e0(op, pv); open = null; sync(); if (PS()) PS().arrived(key, sc, pv); };
      const x0 = sc.onExit; sc.onExit = () => { line.leave(); x0(); };
    } });
}
const board = (K, at, seed) => K.Wl('furn.lobby.board', 'x', at, { kind: 'cork', w: 2, seed }, { tags: ['post_board'] });

branch('maple', { w: 11, d: 9, cx: 6.4, ex: 5.6, floor: GT.f_wood, wall: { color: '#f2d8d8', pattern: 'stripes', color2: '#f8e8e4', trim: '#8a4a3a', h: 3 }, counter: { c: '#8a4a3a', name: 'MAPLEWOOD', cat: 1, jars: 1 }, busy: 1.2,
  spec: U => Object.assign({}, specs().elder[2], { outfit: null, top: 'cardigan', topColor: '#b05a7a', bottom: 'longskirt', bottomColor: '#4a3a5a', hair: 'bun', hairColor: '#d8d8dc', glasses: true, beard: false, hat: null, bag: null }),
  build({ H, Wl, S }) { Wl('boxwall', 'y', .4, { w: 3, rows: 4, mine: -1, name: 'BOXES' }, { boxes: 1 }); Wl('sign', 'y', 6.7, { t: 'POST OFFICE', w: 3 }, { mount: 2.3 }); Wl('clock', 'y', 4.4, {}, { mount: 1.9 }); board({ Wl }, .8, 3); Wl('furn.lobby.sconce', 'x', 3.6, {});
    H('rocker', 4.2, 5.2, {}); H('furn.cityhall.planter', 3.6, 1, { k: 'tulips' }); H('desk', .8, 3.4, {}); H('packtable', .6, 6.6, {}); H('slots', 8.9, 6.6, {}); H('furn.hotel.carpet', 7.2, 2.6, { w: 1.5, d: 5.4, c: '#8a4a3a' });
    S(4.62, 5.6, 2, { p: .7, seated: true, z: .54, age: 'elder', label: 'Knitter', anim: 'sit' }); S(2, 4.95, 3, { p: .5, anim: 'work', label: 'Letter writer' }); },
});
branch('hill', { w: 12, d: 9, cx: 7.2, ex: 8.7, floor: GT.f_tile, wall: { color: '#e8e0cc', trim: '#5a3a28', h: 3.2, rail: 1.1 }, counter: { c: '#5a3a28', name: 'HILLCREST' }, busy: .8,
  spec: U => Object.assign({}, specs().elder[4], { outfit: null, top: 'suit', topColor: '#3a4a3a', innerColor: '#f4f0e8', bottom: 'slacks', bottomColor: '#2a2733', hair: 'balding', hairColor: '#c8c8cc', glasses: true, beard: false, hat: null, bag: null, accent: '#e8c06a' }),
  build({ H, Wl, S }) { Wl('boxwall', 'y', .4, { w: 3.4, rows: 5, mine: -1, name: 'BOXES' }, { boxes: 1 }); Wl('clock', 'y', 4.8, {}, { mount: 2 }); Wl('sign', 'y', 7.3, { t: 'HILLCREST', t2: 'POST + TELEGRAPH', w: 4.2 }, { mount: 2.2 });
    Wl('sign', 'x', .8, { t: 'TELEGRAMS', c: '#2f5a4a', w: 2.6 }, { mount: 2.2 }); board({ Wl }, 4.2, 8); Wl('furn.lobby.sconce', 'x', 3.6, {}); Wl('furn.lobby.sconce', 'x', 7, {});
    H('telegraph', .7, 1.4, {}, { tel: 1 }); H('desk', 3.6, 4.6, {}); H('packtable', .6, 6.7, {}); H('slots', 4.6, 7.4, {}); H('furn.hotel.carpet', 8, 2.6, { w: 1.5, d: 5.6, c: '#2f5a4a' }); H('furn.cityhall.planter', 10.2, 7.6, {});
    S(4.8, 6.15, 3, { p: .6, anim: 'work', label: 'Letter writer' }); S(10.4, 5.2, 2, { p: .5, age: 'elder' }); },
  sync(sc) { setP(by(sc, 'tel')[0], { on: PS() && PS().teleOn() ? 1 : 0 }); },
});
branch('harbor', { w: 12, d: 10, cx: 7.4, ex: 7, floor: GT.f_wood, wall: { color: '#9fb4c4', pattern: 'planks', trim: '#22304e', h: 3 }, counter: { c: '#3a4a5a', name: 'MAIL BOAT', bg: '#22304e' }, busy: 1,
  spec: U => Object.assign({}, specs().adult[14], { outfit: null, top: 'sweater', topColor: '#22304e', bottom: 'slacks', bottomColor: '#3a4a5a', hat: 'cap', hatColor: '#22304e', hair: 'ponytail', hairColor: '#8a8a90', beard: false, glasses: false, bag: null, age: 'adult' }),
  build({ H, Wl, S }) { Wl('boxwall', 'y', .4, { w: 3, rows: 4, mine: -1, name: 'BOXES' }, { boxes: 1 }); Wl('lifering', 'y', 4.4, {}); Wl('sign', 'y', 7.5, { t: 'MAIL BOAT', t2: 'SAILS AT TEN', w: 3.6 }, { mount: 2.1 }); Wl('tideboard', 'x', .8, {}); board({ Wl }, 5.6, 5); Wl('lifering', 'x', 4.2, {});
    H('bottlerack', 3.8, 3.6, {}); H('keeperbox', 4.6, 6.4, {}, { keep: 1 }); H('sacks', 10.3, 4.6, { seed: 5 }); H('desk', 1.2, 4.2, {}); H('packtable', .8, 7.4, {}); H('slots', 9.6, 7.6, {});
    S(5.9, 7.4, 2, { p: .7, age: 'kid', label: 'Kid', lines: ['I am writing to the keeper. I have asked if the light ever gets tired.', 'Do you think the keeper has a cat? I am going to ask.'] }); S(2.4, 5.75, 3, { p: .5, anim: 'work', label: 'Letter writer' }); S(10.2, 6.4, 2, { p: .5, age: 'elder' }); },
});
branch('down', { w: 12, d: 9, cx: 7.4, ex: 7, floor: GT.f_tile, wall: { color: '#f4f0e8', trim: '#c8402e', h: 3.2 }, counter: { c: '#d8d4cc', name: 'POSTCARDS', bg: '#c8402e' }, busy: 1.4,
  spec: U => Object.assign({}, specs().adult[22], { outfit: null, top: 'polo', topColor: '#c8402e', bottom: 'slacks', bottomColor: '#22304e', hat: null, hair: 'short', hairColor: '#2a2733', beard: false, glasses: true, bag: null, age: 'adult' }),
  build({ H, Wl, S }) { Wl('backdrop', 'y', .4, {}, { bd: 1 }); Wl('sign', 'y', 7.4, { t: 'VISITOR INFO', t2: 'POST COUNTER', w: 3.8, c: '#c8402e', fg2: '#ffffff' }, { mount: 2.2 }); Wl('citymap', 'x', .8, {}); Wl('furn.lobby.restroom', 'x', 4.6, { c: '#d8d4cc', dc: '#c8402e' }); board({ Wl }, 6, 2);
    H('camera', 2.1, 2.9, {}); H('cardrack', 4.6, 4.4, {}); H('cardrack', 5.9, 5.9, { seed: 9 }); H('desk', 1.4, 4.4, {}); H('packtable', .8, 6.9, {}); H('slots', 9.6, 6.6, {});
    S(5, 5.55, 3, { p: .7, label: 'Tourist' }); S(6.3, 7.05, 3, { p: .5, label: 'Tourist' }); S(3.4, 3, 0, { p: .5, label: 'Tourist', anim: 'wave' }); S(2.6, 5.95, 3, { p: .4, anim: 'work', label: 'Postcard writer' }); },
});
