// Maple Bay Natatorium — the Competition Pool hall with the diving well (room `natatorium:pool`, 44 x 22, under the glass roof).
//   Eight lanes along x (lane 1 at the back wall, blocks at the +x end), a three-row spectator stand behind a glass rail (reached from the Entrance Hall), the LED scoreboard and the pace clock on the left wall,
//   the diving well with 1 m / 3 m springboards and the 5 m platform, the judges' table, the podium, lifeguards on high chairs.
//   Exits: "Changing Village" and "Leisure Pool" (front edge), "Entrance Hall" (from the stand).
// scene.nat = { X0, X1 (world x of the swimming walls), laneY(n, dir) (world), me (your swimmer: mkSwimmer), swimmers, use (lane uses now), session, meet (meetAt now) , ahead(sw) -> swimmer in front | null,
//   myBoard (set by the sim: lines for the scoreboard while you swim), dive({ board, dive, look, q, onEnd }) -> controller { prog(), open(), T }, cards(scores | null), judges, walt, coach, rosa, guards,
//   seat() -> free stand seat { x, y, z }, drill { on, volunteer(cb) }, racer(i), sync(), inflatableOn(), blockSpot(n), deckSpot(n) }
// Exports for the other pools: mkSwimmer(sc, look, o), wader(sc, spec, x, y, cut, pose).
import { G } from '../../core/game.js';
import { GT } from '../../engine/world.js';
import * as R from '../../engine/raster.js';
import { defineRoom } from '../interior.js';
import { bubble } from '../../ui/kit.js';
import { crowd } from './_show_life.js';
import { POOL, DIVE, BOARD_AT, STAND, laneY, deck, TEAL } from '../../art/showpiece/_nat_lib.js';
import { NR, HOURS, LANES, BAND_NAME, CLUB, MEET, laneUse, sessionNow, sessionsOn, meetAt, racePos, fmtTime, STAFF, DIVES, BOARDS } from '../../data/natatorium.js';
import { O, NS, pick, setP, showOb, viewNow, mkItems, hallEnv, dress, by, hook, floorDecal, wireLife } from './natatorium.js';
import { waterLayer, PALS, swimSpr, wade, look, swimPeople, splash, sweep, board, paceClock, person, diverSpr, cardSpr, ent, txtW } from './natatorium_fx.js';

const W = 44, D = 22;
/** a lane swimmer entity. o = { x0, x1 (world walls), y, dir, v, stroke, cap } */
export function mkSwimmer(sc, L, o = {}) {
  const e = { x: o.x || 0, y: o.y || 0, z: -.12, dir: o.dir || -1, v: o.v || 1.4, stroke: o.stroke || 'free', L, cap: o.cap || null, t: Math.random() * 4, rate: 5, moving: true, hidden: false, bb: [-.5, -.2, .5, .2, .3], axis: o.axis || 'x', lane: o.lane || 0,
    sprite() { const f = this.moving ? Math.floor(this.t * this.rate) & 3 : 0, h = this.axis === 'x' ? (this.dir > 0 ? 0 : 2) : (this.dir > 0 ? 1 : 3); return swimSpr({ stroke: this.stroke, f, h, skin: this.L.skin, hair: this.L.hair, suit: this.L.suit, cap: this.cap, one: this.L.one, kid: this.L.kid, gog: this.gog }); }, update(dt) { this.t += dt; } };
  sc.ents.push(e); return e;
}
/** a character standing in water up to `cut` px (a Char that is not itself in the scene) */
export function wader(sc, spec, x, y, cut = 13, pose = null) {
  const ch = new (G.player.constructor)(spec, x, y); ch.pose = pose; ch.dir = 1;
  const e = { x, y, z: -.1, ch, cut, ph: Math.floor(Math.random() * 4), bob: 0, hidden: false, bb: [-.2, -.2, .2, .2, .8], sprite() { const s = wade(this.ch.sprite(), this.cut + this.bob, (Math.floor(G.time * 3) + this.ph) & 3); return s; }, update(dt) { this.ch.t += dt; } };
  sc.ents.push(e); return e;
}

{
  const { items, spots, H, Wl, S } = mkItems();
  STAND.rows.forEach((r, i) => H('bleacher', STAND.x0, r.y, { w: STAND.x1 - STAND.x0, h: r.z, c: i === 1 ? '#f2c230' : '#1f6fb8' }, { stand: i + 1 }));
  H('rail', 0, STAND.rail, { len: 27.5 }); H('rail', 27.5, 0, { len: 4.5 }, { flip: true });
  for (const x of [4.5, 11.5, 18.5]) Wl('glasswall', 'y', x, { w: 7, h: 2.2, seed: x }, { glass: 1, mount: 2.5 }); for (const x of [28.4, 33.4, 38.4]) Wl('glasswall', 'y', x, { w: 5, h: 3.6, seed: x + 3 }, { glass: 1, mount: .7 });
  Wl('glasswall', 'x', 16.4, { w: 5, h: 3.4, seed: 5 }, { glass: 1, mount: .7 }); Wl('doorway', 'y', 1.2, { t: 'EXIT', w: 1.9, c: '#1f6fb8' }); Wl('sign', 'x', 2.2, { t: 'NO RUNNING', w: 2.8, c: '#d8402e' }, { mount: 1.2 });
  for (let n = 1; n <= 8; n++) H('block', POOL.x1 + .15, laneY(n) - .35, { n }, { block: n });
  H('guardchair', 14.4, 5.2, {}, { guard: 1 }); H('guardchair', 42.4, 10.4, {}, { guard: 2, flip: true }); H('guardchair', 1.9, 12.6, {}, { guard: 3, flip: true });
  H('flags', 8.4, POOL.y0 - .3, { len: 10.2 }, { z: 1.9 }); H('flags', 21.6, POOL.y0 - .3, { len: 10.2 }, { z: 1.9 });
  H('divetower', 31.2, 4.2, {}, { tower: 1 }); H('judges', 28.5, 9.2, {}, { judges: 1 }); H('podium', 8.5, 18.3, {}, { podium: 1 });
  H('kit', 1.6, 17.6, { k: 'boards' }); H('kit', 30.5, 18.6, { k: 'reel' }); H('kit', 15.4, 17.3, { k: 'whiteboard' }, { wb: 1 }); H('kit', 27.4, 5.2, { k: 'firstaid' }); H('kit', 3.6, 18.9, { k: 'noodles' });
  H('bench', 1.1, 7.2, { w: 2.4 }, { flip: true, rosa: 1 }); H('bench', 19, 19.6, { w: 3, kit: 1 }); H('bench', 33.5, 17.4, { w: 3, kit: 2 }); H('bench', 37.5, 17.4, { w: 3 });
  H('ladder', 4.6, POOL.y1, {}); H('ladder', 24.4, POOL.y1, {}); H('ladder', 31.6, DIVE.y1, {}); H('ladder', 39.6, DIVE.y1, {});
  H('inflatable', 6, 12.1, { len: 18 }, { infl: 1, z: -.08 }); for (const [x, y] of [[6.5, 8.2], [23.5, 8.2], [23.5, 14.6], [6.5, 14.6]]) H('buoy', x - .25, y - .25, {}, { buoy: 1, z: -.12 });
  H('plant', 42.6, 17.2, { h: 2.2, seed: 6 }); H('plant', 28.2, 19.8, { h: 1.8, seed: 2 }); H('wetsign', 12, 20);
  defineRoom({ id: NR.pool, name: 'Competition Pool', w: W, d: D, zoom: -1, music: 'quiet', noCrowd: true, showpiece: 'nat', floor: GT.f_tile, bg: '#122028', edge: '#3a4a50', wall: { color: '#eaf0ee', pattern: 'tile', trim: TEAL, h: 5 },
    exits: [{ x: 6, y: 21.3, label: 'Changing Village', to: 'int:' + NR.change, use: () => NS() && NS().go('change', 'pool') }, { x: 20, y: 21.3, label: 'Leisure Pool', to: 'int:' + NR.leisure, use: () => NS() && NS().go('leisure', 'pool') }, { x: 2.2, y: 1.7, label: 'Entrance Hall', to: 'int:' + NR.hall, use: () => NS() && NS().go('hall', 'stand') }],
    spawn: { x: 6, y: 20.3, dir: 3 }, items, npcSpots: spots,
    setup(sc) {
      const Wd = sc.world, P = swimPeople(), r = R.rng(4242), X0 = O + POOL.x0 + .55, X1 = O + POOL.x1 - .55, glass = by(Wd, 'glass');
      floorDecal(sc, W, D, (x, y) => { if (y < STAND.rail && x < 27.5) return deck('#c8d2d6', '#bcc8cc', 1)(x, y); const e1 = Math.max(POOL.x0 - x, x - POOL.x1, POOL.y0 - y, y - POOL.y1), e2 = Math.max(DIVE.x0 - x, x - DIVE.x1, DIVE.y0 - y, y - DIVE.y1), e = Math.min(e1, e2); if (e < .3) return e < .08 ? '#1f8fb0' : ((Math.floor(x * 4) + Math.floor(y * 4)) & 1 ? '#f4f8f8' : '#e6f0f2'); if (e < .42) return '#1fa3b8'; return deck()(x, y); });
      Wd.block(O + POOL.x0, O + POOL.y0, O + POOL.x1, O + POOL.y1); Wd.block(O + DIVE.x0, O + DIVE.y0, O + DIVE.x1, O + DIVE.y1);
      { const t = by(Wd, 'tower')[0]; if (t) { t.B = [t.B[0], t.B[1], 0, t.B[0] + .2, t.B[1] + .2, 4.6]; t.k = t.B[0] + t.B[3] + t.B[1] + t.B[4]; } }
      for (const o of by(Wd, 'infl')) { o.B = [o.B[0], o.B[1], -.1, o.B[3], o.B[4], .3]; }
      Wd.lights.push({ x: O + 9, y: O + 11, z: 0, r: 8, c: '#a8f0f8' }, { x: O + 21, y: O + 11, z: 0, r: 8, c: '#a8f0f8' }, { x: O + 36, y: O + 11, z: 0, r: 7, c: '#a8f0f8' }, { x: O + 15, y: O + 3, z: 0, r: 7, c: '#ffe9b0' }, { x: O + 15, y: O + 19, z: 0, r: 7, c: '#fff0d0' }, { x: O + 34, y: O + 19, z: 0, r: 6, c: '#fff0d0' });
      /* ----- water ----- */
      const dep = (x, y) => { x -= O; y -= O; if (x >= POOL.x0 && x <= POOL.x1 && y >= POOL.y0 && y <= POOL.y1) return .32 + .42 * (x - POOL.x0) / (POOL.x1 - POOL.x0); return -1; };
      const rope = (x, y) => { x -= O; y -= O; const k = (y - POOL.y0) / POOL.lw, fr = Math.abs(k - Math.round(k)); if (fr > .05 || Math.round(k) < 1 || Math.round(k) > 7) return null; const m = Math.min(x - POOL.x0, POOL.x1 - x); return m < 4.4 ? (Math.floor(x * 5) & 1 ? '#e8483a' : '#c8302a') : (Math.round(k) === 1 || Math.round(k) === 2) && NS() && NS().chain().st >= 5 ? (Math.floor(x * 4) & 1 ? '#f2c230' : '#fff2a8') : Math.floor(x * 4) & 1 ? '#1c2f7a' : '#f4f8f8'; };
      const floorL = (x, y) => { x -= O; y -= O; const k = (y - POOL.y0) / POOL.lw - .5, fr = Math.abs(k - Math.round(k)) * POOL.lw; if (fr < .09 && x > POOL.x0 + 1.4 && x < POOL.x1 - 1.4) return '#2a6fa0'; if (fr < .32 && (Math.abs(x - POOL.x0 - 1.4) < .09 || Math.abs(x - POOL.x1 + 1.4) < .09)) return '#2a6fa0'; return null; };
      const mkPool = ropes => waterLayer({ x0: O + POOL.x0, y0: O + POOL.y0, x1: O + POOL.x1, y1: O + POOL.y1, depth: dep, top: ropes ? rope : null, floor: floorL, pal: PALS.lane });
      let wRope = mkPool(true), wOpen = null; const wDive = waterLayer({ x0: O + DIVE.x0, y0: O + DIVE.y0, x1: O + DIVE.x1, y1: O + DIVE.y1, depth: (x, y) => (x - O >= DIVE.x0 && x - O <= DIVE.x1 && y - O >= DIVE.y0 && y - O <= DIVE.y1 ? .95 : -1), floor: (x, y) => (Math.abs(x - O - 36) < .08 || Math.abs(y - O - 11.1) < .08 ? '#2a6fa0' : null), pal: PALS.lane });
      sc.waters = [wRope, wDive]; const ropes = on => { if (on) { sc.waters[0] = wRope; } else { wOpen = wOpen || mkPool(false); sc.waters[0] = wOpen; } };
      /* ----- boards ----- */
      const SB = board(sc, { axis: 'x', x: O + .03, y: O + 6.4, z: 1.25, w: 9, h: 58, lit: true, bg: '#10141c' }); paceClock(sc, O + .06, O + 5.2, 2.2);
      const RB = board(sc, { axis: 'y', x: O + 28.6, y: O + .05, z: 4.45, w: 9.6, h: 7, lit: true, bg: '#22304e' }); RB.clear(); RB.text('MAPLE BAY MARLINS  EST 1958', 6, 1, '#f2c230');
      /* ----- people ----- */
      const seats = []; STAND.rows.forEach((row, ri) => { for (let x = STAND.x0 + .38; x < STAND.x1 - .3; x += .7) seats.push({ x, y: row.y + .46, z: row.z + .08, dir: 1, seated: true, p: 0, row: ri, roll: r(), label: 'Spectator' }); });
      const LN = ['Go on, Marlins!', 'Lane four. Watch lane four.', 'I swam here in 1986. The tiles are the same tiles.', 'They always fade on the last length. Watch.', 'Is it hot in here or is it the humidity. It is the humidity.'];
      const cr = crowd(sc, seats, { seed: 77, fill: 1, lines: LN }); cr.list.forEach((c, i) => { c.setSpec(P.street[i % P.street.length]); c.hidden = true; });
      const deckSpots = [[29.8, 17.2, 3], [12, 19.2, 3], [3, 15, 0], [24, 18.6, 3], [40, 17.6, 3], [30, 7.6, 0], [17.5, 5.6, 1], [9, 5.7, 1]].map(([x, y, d], i) => ({ x, y, dir: d, p: .5, swim: 1, label: 'Swimmer', anim: i % 3 === 0 ? 'talk' : null }));
      const dk = crowd(sc, deckSpots, { seed: 12, fill: .6, lines: ['Two more sets. Then the sauna. That is the plan.', 'The fast lane is not for chatting. I learned that.', 'Tumble turns make me dizzy. I do them anyway.', 'Watch the pace clock: red hand on top, go.'] }); dress(dk, (s, c) => P.adult[Math.floor(c.roll * 53) % P.adult.length]);
      const seatAt = fx => { const s = fx.seats[0]; return s; }, gch = sc.fixtures.filter(f => f.item.guard).sort((a, b) => a.item.guard - b.item.guard);
      const mkGuard = (fx, i, label, use) => { const s = seatAt(fx), c = person(sc, P.guard[i], s.x, s.y, fx.item.flip ? 0 : 1, { pose: 'sit', poseOpts: { seated: true }, label }); c.z = s.z; c.zoff = s.z; sc.interactables.push({ ent: c, x: c.x, y: c.y, label, h: 2.6, hit: 12, range: 2.2, spot: fx.use || undefined, visible: () => !c.hidden, use: () => use(c) }); return c; };
      const g1 = mkGuard(gch[0], 0, 'Lifeguard', c => bubble(c, pick(['Shallow end is that way, deep end is this way.', 'Circle swim, please: down the left, back on the right.', 'Eyes on the water. Always on the water.']), 3200));
      const walt = mkGuard(gch[1], 1, STAFF.guard + ', lifeguard', c => NS() && NS().talkWalt(c)), g3 = mkGuard(gch[2], 2, 'Lifeguard', c => bubble(c, pick(['WALK, please.', 'Goggles on your forehead do not count as goggles.']), 2800));
      for (const g of [g1, walt, g3]) g.update = function (dt) { this.t += dt; this.z = this.zoff; };
      const coach = person(sc, Object.assign({}, P.staff[4], { top: 'jacket', topColor: '#22304e', accent: '#f2c230', bottom: 'shorts', bottomColor: '#22304e' }), O + 27.6, O + 17.4, 3, { label: STAFF.coach }); sc.interactables.push({ ent: coach, x: coach.x, y: coach.y, label: STAFF.coach, h: 1.4, hit: 9, range: 1.9, visible: () => !coach.hidden, use: () => { coach._hold = 5; coach.faceTo(G.player.x, G.player.y); NS() && NS().talkCoach(coach); } });
      const rb = sc.fixtures.find(f => f.item.rosa), rosa = person(sc, Object.assign({}, P.elder[1], { topColor: '#d8402e', hairColor: '#e8e8ee' }), rb.seats[1].x, rb.seats[1].y, 0, { pose: 'sit', poseOpts: { seated: true }, label: 'A swimmer resting at lane two' }); rosa.zoff = rb.seats[1].z; rosa.update = function (dt) { this.t += dt; this.z = this.zoff; };
      sc.interactables.push({ ent: rosa, x: rosa.x, y: rosa.y, label: 'A swimmer resting at lane two', h: 1.3, hit: 10, range: 1.9, visible: () => !rosa.hidden, use: () => NS() && NS().talkRosa(rosa) });
      const jf = sc.fixtures.find(f => f.item.judges), judges = jf.seats.map((s, i) => { const c = person(sc, P.staff[i + 1], s.x, s.y, 0, { pose: 'sit', poseOpts: { seated: true } }); c.zoff = s.z; c.update = function (dt) { this.t += dt; this.z = this.zoff; }; return c; }), cardE = judges.map(c => { const e = ent(sc, c.x + .2, c.y, 1.75, null, [-.1, -.1, .1, .1, .4]); e.hidden = true; e.sprite = () => e.spr; return e; });
      // runner + whistle
      const kid = person(sc, P.kid[2], O + 2, O + 18.6, 0, { hidden: true }); let kidT = 14, kidRun = false;
      /* ----- lane swimmers ----- */
      const swimmers = []; const LY = (n, dir) => O + laneY(n) + (dir < 0 ? -.27 : .27);
      for (let n = 1; n <= 8; n++) for (let k = 0; k < 2; k++) { const sp = P.adult[(n * 3 + k * 7) % P.adult.length], dir = k ? 1 : -1, v = LANES[n - 1].v[0] + r() * (LANES[n - 1].v[1] - LANES[n - 1].v[0]), e = mkSwimmer(sc, look(sp), { lane: n, dir, v, stroke: n <= 2 ? (k ? 'breast' : 'back') : n <= 5 ? (k ? 'free' : 'breast') : 'free', x: X0 + r() * (X1 - X0), y: LY(n, dir) }); e.base = v; e.k = k; e.hidden = true; e.rate = 3 + v * 1.4; swimmers.push(e); }
      const me = mkSwimmer(sc, look(G.state.player.spec), { lane: 4, dir: -1, v: 0, x: X1, y: LY(4, -1) }); me.hidden = true; me.mine = true;
      const ahead = e => { let b = null, bd = 1e9; for (const s of swimmers.concat(me.hidden ? [] : [me])) { if (s === e || s.hidden || s.lane !== e.lane || s.dir !== e.dir || s.axis !== 'x') continue; const d = (s.x - e.x) * e.dir; if (d > 0 && d < bd) { bd = d; b = s; } } return b ? { s: b, d: bd } : null; };
      const lap = (e, dt) => { let v = e.base; const a = ahead(e); if (a && a.d < 1.5) v = Math.min(v, a.s.mine ? Math.max(.4, a.s.v) : a.s.base * .98); e.v = v; e.x += e.dir * v * dt; if (e.dir < 0 && e.x <= X0) { e.x = X0; e.dir = 1; e.y = LY(e.lane, 1); } else if (e.dir > 0 && e.x >= X1) { e.x = X1; e.dir = -1; e.y = LY(e.lane, -1); } };
      // session extras: school line, aqua class, open-water pack, inflatable kids, warm-up
      const school = [0, 1, 2, 3, 4, 5, 6, 7].map(i => person(sc, P.kid[i % P.kid.length], O + 6.4 + i * .85, O + 5.9, 1, { hidden: true, pose: i % 3 === 1 ? 'wave' : null, label: 'Starfish class' })), teacher = person(sc, P.staff[5], O + 13.8, O + 5.75, 2, { hidden: true, pose: 'talk' });
      const schoolW = [0, 1, 2, 3].map(i => { const e = wader(sc, P.kid[(i + 4) % P.kid.length], O + 5.2 + i * 1.3, O + laneY(1 + (i % 3)), 9, i % 2 ? 'wave' : 'cheer'); e.hidden = true; return e; });
      const aquaW = [0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => { const e = wader(sc, (i % 3 ? P.elder : P.adult)[i % 6], O + 5.4 + (i % 3) * 1.7 + (Math.floor(i / 3) % 2) * .6, O + POOL.y0 + .7 + Math.floor(i / 3) * 1.15, 11, 'dance'); e.hidden = true; e.ch.dir = 3; return e; });
      const dolores = person(sc, Object.assign({}, P.staff[2], { top: 'tank', topColor: '#f28fb0', bottom: 'leggings', bottomColor: '#22304e' }), O + 8.4, O + 5.75, 1, { hidden: true, pose: 'dance', label: STAFF.aqua });
      sc.interactables.push({ ent: dolores, x: dolores.x, y: dolores.y, label: 'Join the aqua-aerobics', h: 1.4, hit: 12, range: 2.2, visible: () => !dolores.hidden, use: () => NS() && NS().aqua() });
      const pack = [0, 1, 2, 3, 4, 5, 6, 7].map(i => { const e = mkSwimmer(sc, look(P.club[i % P.club.length]), { v: 1.9 + (i % 3) * .1, cap: i % 2 ? '#f08a2c' : '#f2c230' }); e.hidden = true; e.s = i * 5.2; return e; });
      const loop = [[6.5, 8.2], [23.5, 8.2], [23.5, 14.6], [6.5, 14.6]], loopAt = s => { const per = 2 * (17 + 6.4); s = ((s % per) + per) % per; if (s < 17) return [6.5 + s, 7.7, 'x', 1]; if (s < 23.4) return [24, 8.2 + (s - 17), 'y', 1]; if (s < 40.4) return [23.5 - (s - 23.4), 15.1, 'x', -1]; return [6, 14.6 - (s - 40.4), 'y', -1]; };
      const funK = [0, 1, 2].map(i => person(sc, P.kid[(i * 3 + 1) % P.kid.length], O + 6.5, O + 13.2 + i * .6, 0, { hidden: true, pose: 'run' })); funK.forEach((c, i) => { c.s = i * 6; c.update = function (dt) { if (this.hidden) return; this.t += dt; this.s += dt * 2.4; if (this.s > 17.5) { splash(sc, this.x + .4, this.y, 1); this.s = 0; } this.x = O + 6.3 + this.s; this.z = .26 + Math.abs(Math.sin(this.s * 1.3)) * .25; }; });
      /* ----- meet actors ----- */
      const racers = Array.from({ length: 8 }, (_, i) => { const sw = mkSwimmer(sc, look(P.club[i]), { lane: i + 1, v: 2 }); sw.hidden = true; const ch = person(sc, P.club[i], O + 27.3, O + laneY(i + 1), 2, { hidden: true }); const wd = wader(sc, P.club[i], X1 - .1, O + laneY(i + 1), 17); wd.hidden = true; return { sw, ch, wd }; });
      const pf = sc.fixtures.find(f => f.item.podium), podSpots = [{ x: pf.ob.x + 1.35, y: pf.ob.y + .45, z: .75 }, { x: pf.ob.x + .45, y: pf.ob.y + .45, z: .5 }, { x: pf.ob.x + 2.25, y: pf.ob.y + .45, z: .32 }], podium = podSpots.map((s, i) => { const c = person(sc, P.club[i], s.x, s.y, 1, { hidden: true, pose: i ? 'wave' : 'cheer' }); c.zoff = s.z; c.update = function (dt) { this.t += dt; this.z = this.zoff; }; return c; });
      const medalE = podium.map((c, i) => { const e = ent(sc, c.x, c.y + .05, podSpots[i].z + .95, () => cardSpr(['1', '2', '3'][i], ['#f2c230', '#c2cad4', '#c8843a'][i]), [-.1, -.1, .1, .1, .3]); e.hidden = true; return e; });
      const specFor = (ln, ev, opp) => { const h = R.hash2(ln.name.length * 7 + ln.name.charCodeAt(0), ln.name.charCodeAt(ln.name.length - 1), 3), pool = ev.kid ? P.kid : P.adult, s = Object.assign({}, pool[Math.floor(h * pool.length)]); s.topColor = ln.club === 'M' ? '#22304e' : ln.club === 'V' ? opp.c : ['#d8402e', '#4fa860', '#8a5cc2', '#f08a2c'][Math.floor(h * 4)]; return s; };
      let mKey = '', mPh = '';
      /* ----- diving ----- */
      let diveCtl = null, npcDive = 6 + Math.random() * 6;
      function dive(o) {
        const B = BOARD_AT[o.board], dv = o.dive, L = o.look, spring = o.board !== 'p5', v0 = (spring ? 3.1 : 1.7) * (.75 + .25 * (o.q === undefined ? 1 : o.q)), g = 9.2, x = O + B.x, y0 = O + B.y - .25, z0 = B.z + .08, T = (v0 + Math.sqrt(v0 * v0 + 2 * g * (z0 + .1))) / g;
        const e = ent(sc, x, y0, z0, null, [-.25, -.25, .25, .25, 1.2]); let t = -1.1, done = false, openAt = null; const C = { T, ent: e, prog: () => Math.max(0, Math.min(1, t / T)), open() { if (openAt === null && t > 0) openAt = t / T; }, openAt: () => openAt, done: () => done, cancel() { e.hidden = true; e.dead = true; done = true; } };
        e.sprite = () => { if (t < 0) return diverSpr('straight', 0, L, t > -.45); const k = t / T, tot = dv.rot * 16, op = openAt === null ? (o.npc ? .78 : 1.2) : openAt, err = o.npc ? 0 : (op - .78) * 9; let a = Math.round(tot * Math.min(1, k / .86) + (k > .78 ? err * Math.min(1, (k - .78) / .2) : 0)); const shaped = dv.shape !== 'straight' && k > .12 && k < op; return diverSpr(shaped ? dv.shape : 'straight', ((a % 16) + 16) % 16, L, !shaped && !dv.feet && k > .5); };
        e.update = dt => { if (done) return; t += dt; if (t < 0) { e.z = z0 + (t > -.5 && spring ? Math.abs(Math.sin((t + .5) * 12.6)) * .16 * (1 + t * 2) : 0); return; } e.z = z0 + v0 * t - g * t * t / 2; e.y = y0 + .25 + t * (spring ? 1.15 : 1.5); if (e.z <= -.1) { done = true; e.hidden = true; e.dead = true; sc._fxn = (sc._fxn || 0) + 1; const op = openAt === null ? (o.npc ? .78 : 1.2) : openAt, rq = o.npc ? .7 + Math.random() * .3 : Math.max(0, 1 - Math.abs(op - .78) / .3); splash(sc, e.x, e.y, rq > .8 ? 0 : rq > .45 ? 1 : 2); if (rq <= .45) splash(sc, e.x + .3, e.y + .2, 1); if (o.onEnd) o.onEnd({ rot: rq, y: e.y, x: e.x }); } };
        return C;
      }
      const cards = sc0 => { cardE.forEach((e, i) => { if (!sc0) { e.hidden = true; return; } e.spr = cardSpr(sc0[i].toFixed(1)); e.hidden = false; judges[i].pose = 'cheer'; }); if (!sc0) judges.forEach(j => { j.pose = 'sit'; }); };
      /* ----- rescue drill ----- */
      const cas = wader(sc, P.guard[3], O + 36, O + 11.2, 19, 'wave'); cas.hidden = true; const resc = mkSwimmer(sc, look(P.guard[4]), { v: 2.2, cap: '#d8402e' }); resc.hidden = true; resc.axis = 'y';
      const torp = ent(sc, 0, 0, -.05, () => cardSpr(' ', '#e8483a'), [-.1, -.1, .1, .1, .1]); torp.hidden = true;
      const drill = { on: false, t: 0, vol: null, volunteer(cb) { if (!drill.on || drill.vol) return false; drill.vol = cb; drill.t = 0; return true; }, spot: { x: O + 36, y: O + 11.2 } };
      const drillTick = dt => { if (!drill.on) { cas.hidden = resc.hidden = torp.hidden = true; return; } drill.t += dt; const t = drill.t % 30, y0 = O + DIVE.y1 - .3, cy = O + 11.2; cas.hidden = t > 21; if (drill.vol) cas.hidden = true;
        if (t < 4) { resc.hidden = true; torp.hidden = t < 2; torp.x = O + 36; torp.y = y0 - (t - 2) * 1.6; if (Math.floor(t * 10) === 20) bubble(walt, 'Casualty in the water! GO!', 2000); }
        else if (t < 9) { resc.hidden = false; torp.hidden = true; resc.dir = -1; resc.moving = true; resc.x = O + 36.4; resc.y = y0 - (t - 4) / 5 * (y0 - cy - .5); }
        else if (t < 12) { resc.moving = false; }
        else if (t < 20) { resc.dir = 1; resc.moving = true; resc.stroke = 'back'; resc.y = cy + .5 + (t - 12) / 8 * (y0 - cy - .5); cas.y = resc.y - .55; if (drill.vol && drill.vol.at) drill.vol.at(O + 36, cas.y); }
        else if (t < 21) { cas.y = y0; } else { resc.hidden = true; resc.stroke = 'free'; cas.y = cy; if (drill.vol) { const cb = drill.vol; drill.vol = null; cb.done && cb.done(); } }
      };
      /* ----- scoreboard ----- */
      const C1 = '#ffd24a', C2 = '#f4f8f8', C3 = '#58e07a', C4 = '#ff6a4a', C5 = '#8fd0ff';
      function drawBoard() {
        const n = G.now(), m = sc.nat.meet, mb = sc.nat.myBoard; SB.clear('#10141c');
        if (mb) { SB.text('MAPLE BAY NATATORIUM', 4, 2, C5); mb.lines.forEach((l, i) => SB.text(l, 4, 11 + i * 8, i === 0 ? C1 : i === 2 ? C3 : C2)); return; }
        if (m && m.ph !== 'warm') { const M = m.M, i = Math.min(m.i, M.events.length - 1), sc0 = m.ph === 'after' ? M.final : (m.ph === 'podium' || m.ph === 'result' ? M.after[i] : i ? M.after[i - 1] : { m: 0, v: 0 });
          SB.text(m.ph === 'after' ? (M.final.won ? 'MARLINS WIN!' : M.opp.name.split(' ').pop().toUpperCase() + ' WIN') : (i + 1) + ' ' + m.ev.short, 3, 2, C1); SB.textR('MBM ' + sc0.m + ' ' + M.opp.short + ' ' + sc0.v, SB.w - 3, 2, C3);
          if (m.ph === 'after') { SB.text('FINAL SCORE', 3, 12, C2); SB.text('MAPLE BAY MARLINS  ' + M.final.m, 3, 22, C5); SB.text(M.opp.name.toUpperCase() + '  ' + M.final.v, 3, 30, C4); SB.text('THANK YOU FOR COMING', 3, 44, C2); return; }
          const ev = m.ev, tau = m.tau, mine = NS() && NS().myRace(m); for (let l = 1; l <= 8; l++) { const ln = ev.lanes.find(q => q.lane === l), v = 3 + l * 6; SB.text(String(l), 3, v, C5); if (!ln) { if (ev.open && l === 4) { SB.text(mine ? mine.name : '- OPEN LANE -', 11, v, mine ? C3 : '#5a6a7a'); if (mine && mine.time) { SB.textR(fmtTime(mine.time), SB.w - 12, v, C3); SB.textR(String(mine.place), SB.w - 3, v, C1); } } continue; }
            SB.text(ln.name.split(' ').pop().slice(0, 11), 11, v, ln.club === 'M' ? C2 : ln.club === 'V' ? '#ffb090' : C2); SB.text(ln.club === 'M' ? 'MBM' : ln.club === 'V' ? M.opp.short : 'NOV', 60, v, ln.club === 'M' ? C5 : C4);
            if (m.ph === 'marshal') continue; const fin = tau >= ln.time || m.ph !== 'race'; let sp = 0; for (let k = 1; k < ln.splits.length; k += 2) if (tau >= ln.splits[k]) sp = ln.splits[k]; if (fin) { SB.textR(fmtTime(ln.time), SB.w - 12, v, C1); const pl = mine && mine.time ? ln.place + (mine.time < ln.time ? 1 : 0) : ln.place; SB.textR(String(pl), SB.w - 3, v, pl < 4 ? C3 : C2); } else if (sp) SB.textR(fmtTime(sp), SB.w - 12, v, C2); }
          if (m.ph === 'race') SB.textR(fmtTime(Math.max(0, tau)), 104, 2, C2); return; }
        const ses = sc.nat.session, all = sessionsOn(n), nx = all.find(s => s.from > n.hf && (!ses || s.id !== ses.id));
        SB.text('MAPLE BAY NATATORIUM', 3, 2, C5); SB.textR(n.clock, SB.w - 3, 2, C1); SB.text('WATER 27.5 C   AIR 29 C', 3, 12, C2); SB.text(m ? 'WARM-UP: MEET AT ' + MEET.T0 + ':00' : ses ? 'NOW: ' + ses.name.toUpperCase().slice(0, 28) : 'NOW: PUBLIC LANE SWIMMING', 3, 22, C3);
        if (nx) SB.text('NEXT ' + String(Math.floor(nx.from)).padStart(2, '0') + ':' + (nx.from % 1 ? '30' : '00') + ' ' + nx.name.toUpperCase().slice(0, 22), 3, 30, C2); SB.text('LANES 1-2 SLOW  3-5 MEDIUM  6-8 FAST', 3, 40, '#8a9ab0'); SB.text('RECORD W 100 BACK 1:09.8  1974', 3, 48, C1);
      }
      /* ----- sync ----- */
      let tick = 0, view = null, bt = 0, useKey = '';
      function sync() {
        const n = G.now(), h = n.hf, op = h >= HOURS.open && h < HOURS.close, v = viewNow(); if (v !== view) { view = v; for (const o of glass) setP(o, { time: v }); }
        const use = laneUse(n), ses = sessionNow(n, 'pool'), dses = sessionNow(n, 'dive'), m = meetAt(G.state.t), id = ses ? ses.id : ''; sc.nat.use = use; sc.nat.session = ses; sc.nat.meet = m; sc.nat.open = op;
        const L = !op ? 0 : id === 'early' ? 1 : h < 9 ? .5 : h < 16 ? .7 : h < 20 ? 1 : .5, key = use.join() + '|' + Math.round(L * 4) + (m ? m.ph : '') + op;
        if (key !== useKey) { useKey = key; for (const e of swimmers) { const u = use[e.lane - 1], on = op && !(m && m.ph !== 'warm') && (u === 'slow' || u === 'med' || u === 'fast' || u === 'club' || (m && m.ph === 'warm')) && (e.k === 0 ? L > .3 : L > .8 || u === 'club' || !!m); if (on && e.hidden) { e.x = X0 + Math.random() * (X1 - X0); e.y = LY(e.lane, e.dir); } e.hidden = !on; e.cap = u === 'club' || m ? (e.k && m ? m.M.opp.c : '#1f6fb8') : (e.lane + e.k) % 3 === 0 ? '#f4f8f8' : null; if (u === 'club' || m) { e.base = 2.2 + (e.lane % 3) * .12; e.stroke = 'free'; } else e.base = LANES[e.lane - 1].v[0] + (e.k ? .15 : 0); e.rate = 3 + e.base * 1.4; }
          const sch = op && id === 'school', aq = op && id === 'aqua', ow = op && id === 'ow', fun = op && id === 'family'; school.forEach(c => { c.hidden = !sch; }); teacher.hidden = !sch; schoolW.forEach(e => { e.hidden = !sch; }); aquaW.forEach(e => { e.hidden = !aq; }); dolores.hidden = !aq; pack.forEach(e => { e.hidden = !ow; }); funK.forEach(c => { c.hidden = !fun; });
          for (const o of by(Wd, 'infl')) o.hidden = !fun; for (const o of by(Wd, 'buoy')) o.hidden = !ow; ropes(!ow); }
        const meetOn = !!m, fill = !op ? 0 : meetOn ? (m.ph === 'warm' ? .5 : m.ph === 'after' ? .55 : .86) : id === 'school' ? .12 : id === 'family' ? .2 : .06; for (const c of cr.list) c.hidden = c.spot.roll > fill || (c.mineSeat && true);
        dk.show(op && !(meetOn && m.ph !== 'warm' && m.ph !== 'after'), L > .8); for (const g of [g1, walt, g3]) g.hidden = !op; coach.hidden = !op || !(meetOn || id === 'club' || HOURS.coach.some(q => h >= q[0] && h < q[1])); rosa.hidden = !(op && h >= 6 && h < 8.25) || (NS() && NS().chain().st >= 5 && false);
        drill.on = op && !!dses && dses.id === 'drill'; if (!drill.on) drill.t = 0;
        // the meet's actors
        const k2 = m ? m.week + ':' + m.i : '', ph = m ? m.ph : '';
        if (k2 !== mKey || ph !== mPh) { mKey = k2; mPh = ph; const ev = m && m.ev; racers.forEach((q, i) => { const ln = ev && ev.lanes.find(z => z.lane === i + 1); q.ln = ln || null; q.sw.hidden = q.ch.hidden = q.wd.hidden = true; if (!ln) return; const sp = specFor(ln, ev, m.M.opp); q.ch.setSpec(sp); q.wd.ch.setSpec(sp); q.sw.L = look(sp); q.sw.cap = ln.club === 'M' ? '#1f6fb8' : ln.club === 'V' ? m.M.opp.c : '#f4f8f8'; q.sw.stroke = ev.stroke === 'im' ? 'fly' : ev.stroke; q.sw.rate = 7;
            if (ph === 'marshal') { q.ch.hidden = false; q.ch.pose = null; } else if (ph === 'race') q.sw.hidden = false; else if (ph === 'result') q.wd.hidden = false; });
          podium.forEach((c, i) => { const on = ph === 'podium' && ev && ev.res[i] && !(ev.open && NS() && NS().myRace(m) && NS().myRace(m).place <= i + 1 && false); c.hidden = !on; medalE[i].hidden = !on; if (on) c.setSpec(specFor(ev.res[i], ev, m.M.opp)); }); }
        sc.life.open = op;
      }
      sc.nat = { X0, X1, laneY: LY, me, swimmers, ahead, use: laneUse(G.now()), session: null, meet: null, myBoard: null, dive, cards, judges, walt, coach, rosa, guards: [g1, walt, g3], drill, racers, podSpots, sync, board: SB,
        seat() { const s = cr.list.filter(c => c.hidden && c.spot.row === 2).sort((a, b) => Math.abs(a.spot.x - (G.player.x - O)) - Math.abs(b.spot.x - (G.player.x - O)))[0]; return s ? { x: s.x, y: s.y, z: s.spot.z, c: s } : null; },
        blockSpot: n => ({ x: O + POOL.x1 + .55, y: O + laneY(n), z: .64 }), deckSpot: n => ({ x: O + POOL.x1 + 1.35, y: O + laneY(n) }), inflatableOn: () => by(Wd, 'infl').some(o => !o.hidden), cheer(n = 12) { for (let i = 0; i < n; i++) { const c = pick(cr.list); if (!c.hidden) { c.pose = 'cheer'; c._hold = 1.5 + Math.random() * 2; } } }, npcDiveHold(s) { npcDive = Math.max(npcDive, s); } };
      for (let n = 1; n <= 8; n++) sc.interactables.push({ x: O + POOL.x1 + .55, y: O + laneY(n), get label() { const u = sc.nat.use[n - 1], m = sc.nat.meet; return 'Lane ' + n + ' · ' + (m && m.ph !== 'warm' && m.ph !== 'after' ? (m.ev && m.ev.open && n === 4 ? 'Novice 50 m: your block' : 'Swim meet') : BAND_NAME[u] || u); }, h: .9, hit: 9, range: 1.5, spot: { x: O + POOL.x1 + 1.35, y: O + laneY(n) }, use: () => NS() && NS().lane(n) });
      for (const b of BOARDS) sc.interactables.push({ x: O + BOARD_AT[b.id].x, y: O + 4.2, label: b.name, h: 2, hit: 14, range: 1.6, spot: { x: O + BOARD_AT[b.id].x, y: O + 3.8 }, use: () => NS() && NS().dive(b.id) });
      sc.interactables.push({ x: O + 15, y: O + 3.2, label: 'Take a seat in the stand', h: 1, hit: 40, range: 30, visible: () => G.player.y - O < STAND.rail && G.player.x - O < 27.4 && !G.busy, get spot() { return { x: G.player.x, y: G.player.y }; }, use: () => NS() && NS().sitStand() });
      sc.interactables.push({ x: O + 5.2, y: O + 13.9, label: 'Run the inflatable course', h: 1, hit: 16, range: 1.8, spot: { x: O + 3.5, y: O + 13.9 }, visible: () => sc.nat.inflatableOn(), use: () => NS() && NS().inflatable() });
      sc.interactables.push({ x: O + 26.6, y: O + 17.2, label: 'Join the open-water pack', h: 1, hit: 14, range: 1.8, visible: () => !!(sc.nat.session && sc.nat.session.id === 'ow'), use: () => NS() && NS().openWater() });
      sc.interactables.push({ x: O + 36, y: O + DIVE.y1 + .2, label: 'Volunteer for the rescue drill', h: 1, hit: 18, range: 2, spot: { x: O + 36, y: O + DIVE.y1 + .9 }, visible: () => drill.on && !drill.vol, use: () => NS() && NS().drill() });
      sc.interactables.push({ x: O + .2, y: O + 10.5, label: 'The scoreboard', h: 3, hit: 26, range: 3, spot: { x: O + 1.6, y: O + 10.4 }, use: () => NS() && NS().lookBoard() });
      hook(sc, 'wb', 'Coach\'s whiteboard', () => NS().whiteboard());
      sc.env = hallEnv(Wd, .62, .5, '#dff4ff'); wireLife(sc, [cr, dk, { count: () => swimmers.filter(e => !e.hidden).length + racers.filter(q => !q.sw.hidden || !q.ch.hidden).length }]); sync(); drawBoard();
      const out = {}, u0 = sc.update; sc.update = (dt, gm) => {
        u0(dt, gm); cr.update(dt); dk.update(dt); sweep(sc);
        if ((tick -= dt) <= 0) { tick = 1; sync(); } if ((bt -= dt) <= 0) { bt = .2; if (sc.nat.meet && tick > .5) sc.nat.meet = meetAt(G.state.t); drawBoard(); }
        for (const e of swimmers) if (!e.hidden) lap(e, dt);
        const m = sc.nat.meet; if (sc.nat.raceHold) { } else if (m && m.ph === 'race') { const tau = (G.state.t - m.T0 - MEET.MARSHAL) * MEET.SEC; for (const q of racers) { if (!q.ln || q.sw.hidden) continue; const p = racePos(q.ln, tau, out); q.sw.x = X0 + p * (X1 - X0); q.sw.dir = out.dir; q.sw.y = O + laneY(q.ln.lane); q.sw.moving = !out.done; if (m.ev.stroke === 'im') q.sw.stroke = ['fly', 'back', 'breast', 'free'][out.k]; } if (Math.random() < dt * 3) sc.nat.cheer(4); }
        else if (m && m.ph === 'marshal') for (const q of racers) { if (!q.ln || q.ch.hidden) continue; const up = m.w > 1.8; q.ch.x = up ? O + POOL.x1 + .55 : O + POOL.x1 + 1.3; q.ch.z = up ? .64 : 0; q.ch.t += 0; }
        if (!pack[0].hidden) for (const e of pack) { e.s += e.v * dt; const q = loopAt(e.s); e.x = O + q[0]; e.y = O + q[1]; e.axis = q[2]; e.dir = q[3]; }
        if (drill.on || !cas.hidden) drillTick(dt);
        // NPC divers
        if (sc.nat.open && !drill.on && !(m && m.ph !== 'after') && (npcDive -= dt) <= 0 && !(diveCtl && !diveCtl.done())) { npcDive = 9 + Math.random() * 10; const b = pick(BOARDS), dv = pick(DIVES.filter(d => d.lvl <= b.lvl + 1)); diveCtl = dive({ board: b.id, dive: dv, look: look(pick(P.adult)), npc: true, q: .8 + Math.random() * .2 }); }
        // the running kid and the whistle
        if (sc.nat.open && !(m && m.ph !== 'after')) { if (kid.hidden) { if ((kidT -= dt) <= 0) { kid.hidden = false; kid.x = O + 5; kid.y = O + 17.4; kid.dir = 0; kid.pose = 'run'; kidRun = true; } } else { kid.t += dt; kid.x += (kidRun ? 4.2 : 1.5) * dt; if (kidRun && kid.x > O + 11) { kidRun = false; kid.pose = 'walk'; bubble(g3, 'PHWEEET! WALK, please!', 2400, 'shout'); G.emit('natatorium:whistle'); } if (kid.x > O + 25.5) { kid.hidden = true; kidT = 25 + Math.random() * 30; } } } else kid.hidden = true;
        if (!coach.hidden && sc.nat.session && sc.nat.session.id === 'club' && !(coach._hold > 0)) { coach.t += dt; const yy = O + 12 + Math.sin(G.time * .25) * 5; coach.moving = true; coach.face(0, yy - coach.y); coach.y = yy; coach.x = O + 27.7; } else { if (coach._hold > 0) coach._hold -= dt; coach.moving = false; coach.t += dt; }
      };
      const e0 = sc.onEnter; sc.onEnter = (o, pv) => { e0(o, pv); view = null; useKey = ''; mKey = '?'; sync(); if (NS()) NS().arrived('pool', sc, pv); };
      const x0 = sc.onExit; sc.onExit = to => { x0(to); me.hidden = true; sc.nat.myBoard = null; cards(null); if (NS()) NS().left('pool', sc); };
    } });
}
