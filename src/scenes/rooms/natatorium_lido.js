// Maple Bay Natatorium — the Lido (room `natatorium:lido`, 26 x 16, open air): a four-lane outdoor pool, sun loungers and parasols, a lawn, an ices kiosk and an outdoor shower.
//   Summer: everything out, busy. Spring from day 8 / autumn to day 7 ('mild'): open but quiet. Winter: the pool under its blue cover, loungers stacked, parasols furled, snow on the deck.
//   Exit: "Leisure Pool". scene.nat = { X0, X1, laneY(n, dir), me, swimmers, ahead, use, state: 'summer' | 'mild' | 'winter', sync() } (the same lane interface as the competition pool).
import { G } from '../../core/game.js';
import { GT } from '../../engine/world.js';
import * as R from '../../engine/raster.js';
import { defineRoom } from '../interior.js';
import { bubble } from '../../ui/kit.js';
import { crowd } from './_show_life.js';
import { LIDO, deck } from '../../art/showpiece/_nat_lib.js';
import { NR, HOURS, lidoState, inH } from '../../data/natatorium.js';
import { O, NS, pick, setP, showOb, mkItems, dress, by, hook, floorDecal, wireLife } from './natatorium.js';
import { waterLayer, PALS, look, swimPeople, sweep, person } from './natatorium_fx.js';
import { mkSwimmer } from './natatorium_pool.js';
import { stroll } from './natatorium_leisure.js';

{
  const W = 26, D = 16, { items, spots, H, Wl, S } = mkItems(), ly = n => LIDO.y0 + (n - .5) * LIDO.lw;
  for (let x = 0; x < 26; x += 4) Wl('hedge', 'y', x + .2, { w: 3.9 }); for (let y = 0; y < 16; y += 4) Wl('hedge', 'x', y + .2, { w: 3.9 });
  for (let i = 0; i < 9; i++) H('lounger', 4.2 + i * 1.75, 1.5, { c: ['#1fa3b8', '#f2c230', '#f28fb0'][i % 3], towel: i % 3 === 1 ? 1 : i % 4 === 2 ? 2 : 0 }, { lounger: 1, summer: 1 });
  for (let i = 0; i < 4; i++) H('parasol', 5.1 + i * 3.5 + .4, .5, { c: ['#f2c230', '#d8402e', '#1fa3b8', '#f28fb0'][i] }, { parasol: 1 });
  H('lounger', 21.6, 6, { c: '#f2c230' }, { lounger: 1, summer: 1 }); H('lounger', 22.8, 6, { c: '#1fa3b8', towel: 1 }, { lounger: 1, summer: 1 }); H('parasol', 23.6, 7.6, { c: '#d8402e' }, { parasol: 1 });
  H('kiosk', 21.6, .5, {}, { kiosk: 1 }); H('outshower', 1.4, 4.2, {}, { osh: 1 }); H('guardchair', 21.2, 10.6, {}, { guard: 1, flip: true, summer: 1 });
  H('cover', LIDO.x0, LIDO.y0, { w: LIDO.x1 - LIDO.x0, d: LIDO.y1 - LIDO.y0 }, { cover: 1 }); H('stack', 2.2, 1.4, {}, { winter: 1 }); H('stack', 3.2, 1.4, {}, { winter: 1 }); H('stack', 4.2, 1.4, {}, { winter: 1 });
  H('ladder', 4.6, LIDO.y1, {}); H('ladder', 18.9, LIDO.y1, {}); H('plant', 24.4, 14.4, { h: 1.6, seed: 4 }, { summer: 1 }); H('furn.generic.bin', 20.6, .6, {});
  Wl('sign', 'y', 9.5, { t: 'MAPLE BAY LIDO', w: 4, c: '#1f6fb8' }, { mount: 1.05 });
  S(22.9, 2.6, 1, { kind: 'staff', label: 'The ices kiosk', lines: ['Rocket lollies, two dollars. Slushies are inside at the cafe.'] });
  S(2, 9, 0, { p: .6, swim: 1, seated: true, z: .02, anim: 'eat', label: 'Picnic on the lawn' }); S(2.6, 10.2, 3, { p: .5, swim: 1, age: 'kid' }); S(1.6, 12.4, 0, { p: .5, swim: 1, seated: true, z: .02, anim: 'read' }); S(12, 11.2, 3, { p: .6, swim: 1, label: 'Dangling her feet' }); S(7, 11.3, 1, { p: .5, swim: 1, age: 'kid', anim: 'wave' }); S(17, 4.6, 1, { p: .5, swim: 1 });
  defineRoom({ id: NR.lido, name: 'The Lido', w: W, d: D, zoom: 0, music: 'quiet', noCrowd: true, showpiece: 'nat', outdoor: true, floor: GT.f_stone, floors: [{ x0: 0, y0: 7, x1: 3.6, y1: 16, floor: GT.lawn }, { x0: 21, y0: 12.4, x1: 26, y1: 16, floor: GT.lawn }], bg: '#9fd6e8', edge: '#8a7a64', wall: { color: '#d8cfc0', pattern: 'brick', trim: '#8a7a64', h: 1 },
    exits: [{ x: 1, y: 5.9, label: 'Leisure Pool', to: 'int:' + NR.leisure, use: () => NS() && NS().go('leisure', 'lido') }], spawn: { x: 2, y: 5.9, dir: 0 }, items, npcSpots: spots,
    setup(sc) {
      const Wd = sc.world, P = swimPeople(), X0 = O + LIDO.x0 + .55, X1 = O + LIDO.x1 - .55, LY = (n, dir) => O + ly(n) + (dir < 0 ? -.27 : .27), inP = (x, y) => x >= LIDO.x0 && x <= LIDO.x1 && y >= LIDO.y0 && y <= LIDO.y1;
      sc.indoor = false; Wd.bg = null;
      Wd.decal({ x0: O, y0: O, x1: O + W, y1: O + D, draw(Rr) { const snow = Rr.ENV.season === 3; Rr.qz(O, O + W, O, O + D, 0, (wx, wy) => { const x = wx - O, y = wy - O; if ((x < 3.6 && y >= 7) || (x >= 21 && y >= 12.4)) return snow ? (R.hash2(Math.floor(x * 4), Math.floor(y * 4), 2) > .2 ? '#eef3f6' : '#dfe8ee') : null; const e = Math.max(LIDO.x0 - x, x - LIDO.x1, LIDO.y0 - y, y - LIDO.y1); if (e < .3 && e > -.2) return e < .06 ? '#1f7fb0' : '#f4f6f2'; if (e <= -.2) return null; if (snow && R.hash2(Math.floor(x * 3), Math.floor(y * 3), 6) > .35) return '#f0f5f8'; return deck('#e8dcc4', '#decfb4', 1)(x, y); }); } }); Wd.version++;
      Wd.block(O + LIDO.x0, O + LIDO.y0, O + LIDO.x1, O + LIDO.y1);
      for (const o of by(Wd, 'cover')) { o.B = [o.B[0], o.B[1], -.05, o.B[3], o.B[4], .1]; }
      const water = waterLayer({ x0: O + LIDO.x0, y0: O + LIDO.y0, x1: O + LIDO.x1, y1: O + LIDO.y1, depth: (x, y) => (inP(x - O, y - O) ? .35 + .3 * (x - O - LIDO.x0) / 16 : -1), top: (x, y) => { const k = (y - O - LIDO.y0) / LIDO.lw, fr = Math.abs(k - Math.round(k)); return fr < .04 && Math.round(k) > 0 && Math.round(k) < 4 ? (Math.floor(x * 5) % 3 ? '#3b8fd8' : '#f4f8f8') : null; }, pal: PALS.out });
      const swimmers = []; for (let n = 1; n <= 4; n++) { const sp = P.adult[(n * 5 + 3) % P.adult.length], e = mkSwimmer(sc, look(sp), { lane: n, dir: n % 2 ? 1 : -1, v: .9 + n * .3, stroke: n === 1 ? 'breast' : n === 2 ? 'back' : 'free', x: X0 + n * 3, y: LY(n, n % 2 ? 1 : -1) }); e.base = e.v; e.rate = 3 + e.v * 1.4; swimmers.push(e); }
      const me = mkSwimmer(sc, look(G.state.player.spec), { lane: 2, v: 0 }); me.hidden = true; me.mine = true;
      const ahead = e => { let b = null, bd = 1e9; for (const s of swimmers.concat(me.hidden ? [] : [me])) { if (s === e || s.hidden || s.lane !== e.lane || s.dir !== e.dir) continue; const d = (s.x - e.x) * e.dir; if (d > 0 && d < bd) { bd = d; b = s; } } return b ? { s: b, d: bd } : null; };
      const extra = []; for (const f of sc.fixtures.filter(q => q.item.lounger)) if (Math.round(f.x * 2) % 3) extra.push({ x: f.seats[0].x - O, y: f.seats[0].y - O, z: f.seats[0].z, dir: 1, seated: true, swim: 1, p: .7, anim: Math.round(f.x) % 2 ? 'read' : 'sit', label: 'Sunbathing', lines: ['Factor fifty. Reapply. I am telling you as a friend.', 'This is the life. This, and then chips.', 'Wake me when the wave machine goes.'] });
      const cr = crowd(sc, sc.def.npcSpots.concat(extra), { seed: 58, fill: .7, lines: ['The water is colder than it looks. It always is.', 'They take the cover off on the first of summer. People queue.', 'A lolly and a lounger. I want for nothing.'] });
      dress(cr, (s, c) => (s.kind === 'staff' ? P.staff[1] : s.age === 'kid' ? P.kid[Math.floor(c.roll * 31) % P.kid.length] : P.adult[Math.floor(c.roll * 61) % P.adult.length]));
      const gf = sc.fixtures.find(f => f.item.guard), g = person(sc, P.guard[1], gf.seats[0].x, gf.seats[0].y, 0, { pose: 'sit', poseOpts: { seated: true } }); g.zoff = gf.seats[0].z; g.update = function (dt) { this.t += dt; this.z = this.zoff; };
      const F = (x, y) => [O + x, O + y], st = stroll(sc, P.adult.concat(P.kid.slice(0, 3)), [[F(2, 5.9), F(3.2, 4.4), F(20, 4.4)], [F(3, 11.4), F(20.6, 11.4), F(22, 9)], [F(2.6, 6.4), F(3.2, 11.6), F(12, 12.6)]], 5);
      let tick = 0, key = '';
      function sync() {
        const n = G.now(), stt = lidoState(n), wet = !!(G.weather && G.weather.isWet && G.weather.isWet()), op = stt !== 'winter' && inH(n.hf, HOURS.lido), L = !op ? 0 : stt === 'summer' ? (wet ? .15 : n.hf < 11 ? .6 : 1) : wet ? 0 : .3, k = stt + op + Math.round(L * 5);
        sc.nat.state = stt; sc.nat.open = op; if (k === key) return; key = k;
        for (const o of Wd.objs) { const d = o.data; if (!d) continue; if (d.cover || d.winter) showOb(Wd, o, stt === 'winter'); if (d.summer) showOb(Wd, o, stt !== 'winter'); if (d.parasol) setP(o, { open: stt === 'summer' && !wet ? 1 : 0 }); }
        sc.waters = stt === 'winter' ? [] : [water]; swimmers.forEach((e, i) => { e.hidden = i >= Math.round(L * 4); }); cr.show(L > 0, L > .8); for (const c of cr.list) if (!c.hidden && c.roll > L + .15 && c.spot.kind !== 'staff') c.hidden = true; st.setActive(Math.round(L * 5)); g.hidden = L <= 0;
      }
      sc.nat = { X0, X1, laneY: LY, me, swimmers, ahead, use: ['slow', 'med', 'med', 'fast'], lanes: 4, state: lidoState(G.now()), open: true, sync, deckSpot: n => ({ x: O + LIDO.x1 + .8, y: O + ly(n) }) };
      for (let n = 1; n <= 4; n++) sc.interactables.push({ x: O + LIDO.x1 + .2, y: O + ly(n), label: 'Outdoor lane ' + n, h: .4, hit: 9, range: 1.5, spot: { x: O + LIDO.x1 + .8, y: O + ly(n) }, visible: () => sc.nat.state !== 'winter', use: () => NS() && NS().lane(n) });
      hook(sc, 'lounger', 'Sun lounger', f => NS().lounger(f), { visible: () => sc.nat.state !== 'winter' }); hook(sc, 'kiosk', 'Ices kiosk', () => NS().kiosk()); hook(sc, 'osh', 'Outdoor shower', () => NS().shower(-1)); hook(sc, 'cover', 'The winter cover', () => NS().lookCover(), { visible: () => sc.nat.state === 'winter', spot: { x: O + 12, y: O + LIDO.y1 + .8 } });
      wireLife(sc, [cr, st, { count: () => swimmers.filter(e => !e.hidden).length }]); sync();
      const u0 = sc.update; sc.update = (dt, gm) => { u0(dt, gm); cr.update(dt); st.update(dt); sweep(sc); if ((tick -= dt) <= 0) { tick = 1.5; sync(); } for (const e of swimmers) { if (e.hidden) continue; let v = e.base; const a = ahead(e); if (a && a.d < 1.5) v = Math.min(v, a.s.mine ? Math.max(.4, a.s.v) : a.s.base * .98); e.x += e.dir * v * dt; if (e.dir < 0 && e.x <= X0) { e.x = X0; e.dir = 1; e.y = LY(e.lane, 1); } else if (e.dir > 0 && e.x >= X1) { e.x = X1; e.dir = -1; e.y = LY(e.lane, -1); } } };
      const e0 = sc.onEnter; sc.onEnter = (o, pv) => { e0(o, pv); key = ''; sync(); if (NS()) NS().arrived('lido', sc, pv); };
      const x0 = sc.onExit; sc.onExit = to => { x0(to); me.hidden = true; if (NS()) NS().left('lido', sc); };
      G.on('season', () => { key = ''; Wd.version++; });
    } });
}
