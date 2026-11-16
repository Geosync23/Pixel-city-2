// Central Station PLATFORMS 1 and 2 under the train shed (room id 'central_station:platforms', 20 x 31; art: src/art/rail_interior/platforms.js).
// Reached through the hall's fare gates (scenes/rooms/stations.js); the stairs at the front of the concourse lead back down to the hall.
//
// LAYOUT (room coordinates; world = room + 1). The tracks run along y and come out of two tunnel mouths in the back wall (y = 0); both end at buffer stops
// in front of the head concourse (y 26..31), so the two platforms are joined on the level:
//   x 0.5..3.5  track 2 (pit, not walkable)      x 3.5..10   PLATFORM 2 = Loop B (toward Railyard); its right edge is fenced (posters)
//   x 10.5..13.5 track 1 (pit)                   x 13.5..20  PLATFORM 1 = Loop A (toward Harborside); the stationmaster's office is on its back wall
//   A train stands with its nose at y 24.2: two cars inside the shed (doors at DOORS_Y), the rest of it in the tunnel.
// TRAINS follow the real timetable: per platform the room asks G.rail.timeTo(dir, set, 'central') every frame. A set within T_IN game minutes of its arrival
//   slides in out of the tunnel, stands for G.rail.DWELL (doors open), then backs out the way it came for T_OUT (Central is drawn as a terminus: both loops
//   reverse here). The cars are clipped at the wall plane, so a car is only ever seen through the tunnel mouth.
// BOARDING: every door mark is an interactable. With a destination (a Map trip, or one chosen in the panel) scene.platformBoard(dir, to, board, fail) walks the
//   player to the nearest door of the right platform, waits there for the train (an activity) and steps in; G.rail.ride() calls it for rides from Central.
// ARRIVING: G.rail.alight('central') enters with { arrive: dir }: the player stands at an open door of that platform.
// scene.navBoard(trip) -> { x, y, label } for the guide arrow ("Platform 1: Loop A to Harborside").   scene.plat = debug handle (state(), PL).
// The live boards (big board on the concourse wall, one indicator per platform) and the platform clocks are entities with their own small canvases, redrawn
// when their text changes (once per game minute at most). Perf: 4 car sprites per platform are baked ahead on entry.
import { G } from '../../core/game.js';
import { GT } from '../../engine/world.js';
import * as R from '../../engine/raster.js';
import { asset } from '../../art/registry.js';
import { assetSprite, prebakeAsset, pixSprite, toSpritePooled } from '../../engine/sprites.js';
import { Char, charArt } from '../../core/char.js';
import { room, V, WY, WX, S } from './venues_lib.js';
import { el, toast, bubble, modal } from '../../ui/kit.js';
import { getSpec } from '../../sim/_crowd_core.js';
import { UNIFORMS } from '../../sim/_jobstory_wear.js';

export const PLAT_ROOM = 'central_station:platforms';
const O = 1, W_ = 20, D_ = 31, H = 6, LEN = 26, YSTOP = 24.2, PITCH = 12.4, YC = O + .3, OFF = 27, T_IN = 1.7, T_OUT = 1.7;
const DOORS_Y = [2.1, 5.8, 9.5, 14.5, 18.2, 21.9];
const LINES = [{ n: 1, name: 'Loop A', color: '#d2412f', livery: 'line1', pit: 10.5, next: 'HARBOR' }, { n: 2, name: 'Loop B', color: '#2f8f96', livery: 'line2', pit: .5, next: 'RAILYD' }];
const SKYI = { sky: true };
const arch = (Wf, at, w) => Object.assign(Wf('station.arch', at, { w, h: H, seed: at + 3 }), SKYI);
const bench = (x, y, flip) => ({ id: 'prop.rail.bench', x, y, flip: !!flip, p: { color: '#34504f' }, n: 'seats' });
const col = (x, y, n) => V('cplat.column', x, y, { n, h: 5 });
const items = [
  /* back wall: tunnel mouth 2, two arched windows, tunnel mouth 1, the stationmaster's office; left wall: the arcade */
  Object.assign(WY('cplat.mouth', .5, { n: 2, line: 'LOOP B', color: LINES[1].color, h: H }), { k: 'mouth2' }), arch(WY, 3.5, 3.5), arch(WY, 7, 3.5),
  Object.assign(WY('cplat.mouth', 10.5, { n: 1, line: 'LOOP A', color: LINES[0].color, h: H }), { k: 'mouth1' }), Object.assign(WY('cplat.office', 13.5, { h: H }), { k: 'office' }),
  arch(WX, 0, 4), arch(WX, 4, 4), arch(WX, 8, 4), arch(WX, 12, 4), arch(WX, 16, 4), arch(WX, 20, 4), arch(WX, 24, 2),
  Object.assign(WX('cplat.bigboard', 26, { w: 5 }), { k: 'big' }),
  /* the roof */
  Object.assign(V('cplat.lunette', 0, 0, { w: W_ }, { z: H, solid: false }), SKYI),
  Object.assign(V('cplat.vault', 0, 0, { len: 10, off: 0 }, { z: H, solid: false }), SKYI), Object.assign(V('cplat.vault', 0, 10, { len: 10, off: 10 }, { z: H, solid: false }), SKYI), Object.assign(V('cplat.vault', 0, 20, { len: 12, off: 20, end: 1 }, { z: H, solid: false }), SKYI),
  /* the tracks (flat) + buffer stops */
  V('cplat.trackbed', .5, 0, { len: LEN, doors: DOORS_Y }, { solid: false }), V('cplat.trackbed', 10.5, 0, { len: LEN, doors: DOORS_Y }, { solid: false }),
  { id: 'prop.rail.buffer', x: .7, y: 24.7, flip: true, z: -.5 }, { id: 'prop.rail.buffer', x: 10.7, y: 24.7, flip: true, z: -.5 },
  ...[[4.5, 2], [14.6, 8], [5, 17.5], [14.4, 19]].map(q => V('station.shaft', q[0], q[1], null, { shaft: true })),
  /* platform 2 */
  { id: 'prop.rail.signal', x: 3.6, y: .4, p: { state: 'red', num: 'P2' }, k: 'sig2' }, { id: 'prop.rail.vending', x: 5.2, y: .5, p: { seed: 1 } }, { id: 'prop.rail.vending', x: 6.2, y: .5, p: { color: '#d2412f', seed: 4 } }, { id: 'prop.rail.bin', x: 7.4, y: .5 },
  V('cplat.fence', 10, 0, { len: 13, posters: [[1.6, 'lighthouse'], [7.2, 'skydeck']] }, { flip: true }), V('cplat.fence', 10, 13, { len: 13, posters: [[.8, 'coffee'], [5.4, 'orpheum'], [10.2, 'beach']] }, { flip: true }),
  col(9.3, 5.7, 2), col(9.3, 11.7, 2), col(9.3, 17.7, 2), col(9.3, 23.7, 2),
  bench(5.2, 7.6), bench(7.2, 7.6), V('cplat.shelter', 5.4, 12.6, null, { n: 'seats' }), bench(5.2, 20.4), bench(7.2, 20.4), { id: 'prop.rail.bin', x: 8.6, y: 15 },
  V('cplat.trolley', 6.6, 24.6, { kind: 'row' }), V('cplat.indicator', 4.9, 16.6, { n: 2, color: LINES[1].color }, { z: 2.9, solid: false, k: 'ind2' }),
  /* platform 1 */
  { id: 'prop.rail.signal', x: 13.6, y: .4, p: { state: 'red', num: 'P1' }, k: 'sig1' }, V('cplat.pa', 18.9, .5, null, { k: 'pa' }), V('cplat.trolley', 16.6, 1.0, { kind: 'mail' }),
  col(19.2, 5.7, 1), col(19.2, 11.7, 1), col(19.2, 17.7, 1), col(19.2, 23.7, 1),
  bench(17.4, 3.4, true), bench(17.4, 8.4, true), bench(17.4, 14, true), bench(17.4, 21, true), { id: 'prop.rail.bin', x: 17.5, y: 10.6 },
  V('cplat.dispatch', 14.9, 16.0, null, { k: 'dispatch' }), V('cplat.indicator', 14.9, 16.6, { n: 1, color: LINES[0].color }, { z: 2.9, solid: false, k: 'ind1' }),
  /* the head concourse */
  V('cplat.stairwell', 8.5, 28.5, null, { k: 'stairs' }), V('cplat.wayout', 8.4, 28.2, null, { solid: false }), V('cplat.validator', 7.6, 27.4, null, { k: 'val1' }), V('cplat.validator', 12, 27.4, null, { k: 'val2' }),
  V('cplat.helppoint', 15.6, 26.5, null, { k: 'help' }), V('cplat.trolley', 1.2, 27.2, { kind: 'bags' }), V('station.planter', 17.6, 28.9, { seed: 5 }), V('station.planter', 4.2, 28.9), { id: 'prop.rail.namesign', x: 13.2, y: 30.4, p: { name: 'CENTRAL' } },
  bench(14.2, 29.2), bench(5.9, 29.2),
];
const npc = [S(14.9, 3.2, 2), S(15.1, 6.4, 2, 'phone'), S(14.8, 11, 2), S(15.4, 12.2, 2, 'phone'), S(15, 16, 2), S(15.6, 23, 2, 'phone'), S(16.4, 18.3, 1, 'talk'), S(16.4, 19.3, 3, 'talk'),
  S(4.8, 3.6, 2, 'phone'), S(4.9, 10.4, 2), S(4.7, 17.4, 2), S(5.1, 23, 2, 'phone'), S(7.8, 3, 1), S(8.2, 18.6, 0, 'phone'),
  S(2.4, 28.2, 2), S(3.4, 29.6, 2, 'phone'), S(1.8, 29.8, 2), S(16.1, 27.7, 3), S(12.6, 29.6, 1, 'phone')];

/* an entity with its own small picture, redrawn when its key changes (boards, clocks) */
function dyn(x, y, z, vb, draw) {
  const e = { x, y, z: z + Math.min(0, vb[2]), bb: [vb[0], vb[1], vb[3], vb[4], vb[5] - Math.min(0, vb[2])], nl: 'ground', key: null, spr: null, sprite() { return e.spr; },
    set(k) { if (k === e.key) return; e.key = k; try { e.spr = toSpritePooled(R.render(R.screenBox(vb), () => draw(k), null, 2, false, true)); if (e.spr && vb[2] < 0) e.spr.y += Math.round(vb[2] * 16); } catch (err) { e.spr = null; } } };
  return e;
}
const mins = m => (m < .5 ? 'NOW' : Math.round(m) + 'M');
const pad = (s, n) => (s + '                ').slice(0, n), padL = (s, n) => ('      ' + s).slice(-n);

function setup(sc, G) {
  const W = sc.world, A = charArt(), carA = asset('veh.train.car'), fxk = k => sc.fixtures.find(f => f.item && f.item.k === k), obk = k => { const f = fxk(k); return f && f.ob; };
  const Rl = () => G.rail, now = () => G.state.t, sfx = n => { try { G.audio && G.audio.sfx && G.audio.sfx(n); } catch (e) { } };
  /* nobody on the tracks */
  for (const L of LINES) W.block(O + L.pit, O, O + L.pit + 3, O + LEN + .1); W.block(O, O, O + .5, O + LEN);

  /* ---------- trains ---------- */
  const clip = (e, s) => {
    const d = e.cut, c = e._c || (e._c = { c: document.createElement('canvas'), l: document.createElement('canvas'), x: 0, y: 0, w: 0, h: 0, bx: [0, 0, 0, 0], lb: null, src: null, d: -1 });
    if (c.src === s && c.d === d) return c; c.src = s; c.d = d; c.x = s.x; c.y = s.y; c.w = s.w; c.h = s.h; c.bx = [0, 0, s.w, s.h]; c.lb = s.l ? [0, 0, s.w, s.h] : null;
    const ZT = 2.7, x1 = (2.2 - d) * 16 - s.x, y1 = (2.2 + d) * 8 - ZT * 16 - s.y;
    for (const [dst, src] of [[c.c, s.c], [c.l, s.l]]) { if (dst.width !== s.w || dst.height !== s.h) { dst.width = s.w; dst.height = s.h; } const g = dst.getContext('2d'); g.clearRect(0, 0, s.w, s.h); if (!src) continue;
      g.save(); g.beginPath(); g.moveTo(-1, y1 - (x1 + 1) * .5); g.lineTo(x1, y1); g.lineTo(x1, s.h + 1); g.lineTo(-1, s.h + 1); g.closePath(); g.clip(); g.drawImage(src, 0, 0); g.restore(); }
    c.lsrc = s.l; return c;
  };
  const mkCar = (L, k) => ({ x: O + L.pit + .4, y: 0, z: -.5, bb: [0, 0, 2.2, 12, 2.6], isTrain: true, hidden: true, p: null, key: '', cut: 0, _c: null, L, k,
    sprite() { const s = assetSprite(carA, this.p, true, this.key); if (!s || this.cut <= 0) return s; const c = clip(this, s); return c.lsrc ? c : { c: c.c, l: null, x: c.x, y: c.y, w: c.w, h: c.h, bx: c.bx, lb: null }; } });
  const carP = (L, k, ph) => ({ head: k === 0 ? 'front' : 'mid', livery: L.livery, dir: ph === 'out' ? -1 : 1, dest: ph === 'in' ? 'CENTRAL' : L.next, line: L.n, seed: L.n * 7 + k + 1, panto: k === 0 });
  const carKey = (L, k, ph) => 'cplcar|' + L.n + k + (ph === 'out' ? 'o' : ph === 'in' ? 'i' : 'd');
  const doorSpr = q => pixSprite('cpldoor' + q, R.screenBox([0, 0, .4, .06, 1.34, 2.05]), () => { const w = .66 * q / 3, a = .67 - w, b = .67 + w; R.qx(.02, a, b, .51, 1.98, '#3a3440'); if (q > 1) { R.qx(.02, a + .05, b - .05, .56, 1.93, '#dccfa8', '#d0c097'); R.qx(.02, a + .05, b - .05, .56, .78, '#8f8474'); R.qx(.02, a + .12, b - .12, 1.2, 1.7, '#9fc3d6'); R.lw([.02, .67, .56], [.02, .67, 1.93], '#f2c230'); } R.glow(() => R.qx(.02, a + .05, b - .05, .56, 1.93, '#ffe6a8', '#f5d48a')); R.lit(() => R.qx(.02, a, b, .46, .52, '#f2c230')); });
  const PL = LINES.map((L, di) => {
    const P = { L, di, n: L.n, ex: O + L.pit + 3.25, wx: O + L.pit + 3.9, ph: null, u: 0, j: -1, door: 0, opened: false, cars: [mkCar(L, 0), mkCar(L, 1)], doors: [], sig: '' };
    for (let i = 0; i < 6; i++) { const d = { x: O + L.pit + 2.61, y: O + DOORS_Y[i] - .67, z: -.5, bb: [0, 0, .06, 1.34, 1.7], hidden: true, q: 0, sprite() { return doorSpr(this.q); } }; P.doors.push(d); sc.ents.push(d); }
    sc.ents.push(...P.cars); return P;
  });
  const prebake = () => { for (const P of PL) for (let k = 0; k < 2; k++) for (const ph of ['in', 'dwell', 'out']) try { prebakeAsset(carA, carP(P.L, k, ph), true, 2, carKey(P.L, k, ph)); } catch (e) { } };
  function trains(dt, snap) {
    const rl = Rl(); if (!rl) return; const T = rl.LOOP_MIN, DW = rl.DWELL;
    for (const P of PL) {
      let ph = null, u = 0, j = -1;
      for (let q = 0; q < rl.NSETS; q++) { const tt = rl.timeTo(P.di, q, 'central'), since = tt < 1e-6 ? 0 : T - tt; if (tt > 1e-6 && tt < T_IN) { ph = 'in'; u = tt; j = q; break; } if (since < DW) { ph = 'dwell'; u = since; j = q; break; } if (since < DW + T_OUT) { ph = 'out'; u = since - DW; j = q; break; } }
      if (ph !== P.ph) { const was = P.ph; P.ph = ph; if (!snap && G.scene === sc) { if (ph === 'dwell') arrived(P); else if (was === 'dwell') departed(P); else if (ph === 'in') coming(P); } if (ph !== 'dwell') P.opened = false; }
      P.u = u; P.j = j;
      const off = ph === 'in' ? OFF * Math.pow(u / T_IN, 1.7) : ph === 'out' ? OFF * Math.pow(u / T_OUT, 2) : 0, want = ph === 'dwell' && u > .35 && u < DW - .55 ? 1 : 0;
      P.door = snap ? want : Math.max(0, Math.min(1, P.door + Math.sign(want - P.door) * dt * 2.4));
      if (P.door > .9 && !P.opened && ph === 'dwell') { P.opened = true; if (!snap && G.scene === sc) doorsOpen(P); }
      for (let k = 0; k < 2; k++) { const c = P.cars[k]; if (!ph) { c.hidden = true; continue; } const y = O + YSTOP - off - 12 - k * PITCH, d = YC - y; c.hidden = d >= 11.9; if (c.hidden) continue; c.y = y; c.cut = Math.max(0, Math.round(d * 16) / 16); c.bb[1] = c.cut; const key = carKey(P.L, k, ph); if (c.key !== key) { c.key = key; c.p = carP(P.L, k, ph); } }
      const q = Math.round(P.door * 3); for (const d of P.doors) { d.q = q; d.hidden = !q || ph !== 'dwell'; }
      const sg = ph === 'in' ? 'amber' : ph === 'dwell' ? (u > DW - 1 ? 'green' : 'red') : ph === 'out' ? 'green' : 'red';
      if (sg !== P.sig) { P.sig = sg; const ob = obk('sig' + P.n); if (ob) { ob.p = Object.assign({}, ob.p, { state: sg }); ob._key = null; } }
    }
  }

  /* ---------- people: passengers getting off and on, the guard ---------- */
  const pax = [], stairs = { x: O + 10, y: O + 27.7 }, rnd = Math.random;
  const mkPax = (x, y) => { const c = new Char(getSpec('downtown'), x, y); c.speed = 2.3 + rnd() * .6; c.alpha = 0; c.fade = 1; c.z = 0; pax.push(c); sc.ents.push(c); return c; };
  const drop = c => { let i = pax.indexOf(c); if (i >= 0) pax.splice(i, 1); i = sc.ents.indexOf(c); if (i >= 0) sc.ents.splice(i, 1); };
  const paxN = () => { const h = G.now().hf; return (h >= 7 && h < 9.5) || (h >= 16.5 && h < 19) ? 4 : h >= 6 && h < 22 ? 3 : 1; };
  function doorsOpen(P) {
    const n = 1 + Math.floor(rnd() * paxN());
    for (let i = 0; i < n && pax.length < 14; i++) { const c = mkPax(P.ex + .1, O + DOORS_Y[Math.floor(rnd() * 6)] + (rnd() - .5) * .5); c.mode = 'out'; c.dir = 0; if (!c.goTo(W, stairs.x + (rnd() - .5) * 1.6, stairs.y - rnd() * .6, { snap: 4 })) drop(c); }
    for (const c of pax) if (c.mode === 'wait' && c.P === P) { c.mode = 'board'; c.pose = null; c.wt = 0; c.goTo(W, P.ex + .2, c.y, { snap: 4 }); }
  }
  function walker() {   // somebody comes up the stairs and waits at a door mark
    if (pax.filter(c => c.mode === 'in' || c.mode === 'wait').length >= 2 + paxN()) return; const P = PL[rnd() < .5 ? 0 : 1], c = mkPax(stairs.x + (rnd() - .5), stairs.y - .2); c.P = P; c.mode = 'in'; c.dir = 3;
    if (!c.goTo(W, P.wx + .2 + rnd() * .8, O + DOORS_Y[Math.floor(rnd() * 6)] + (rnd() - .5), { snap: 4 })) drop(c);
  }
  function people(dt) {
    for (let i = pax.length - 1; i >= 0; i--) {
      const c = pax[i]; if (c.fade) { c.alpha = (c.alpha === undefined ? 1 : c.alpha) + c.fade * dt * 3; if (c.alpha >= 1) { c.alpha = undefined; c.fade = 0; } else if (c.alpha <= 0) { drop(c); continue; } }
      if (c.mode === 'wait') { c.t += dt; if ((c.wt += dt) > 60) { c.mode = 'out'; c.pose = null; if (!c.goTo(W, stairs.x, stairs.y, { snap: 4 })) c.fade = -1; } continue; }
      c.move(W, dt); if (c.path) continue;
      if (c.mode === 'in') { c.mode = 'wait'; c.wt = 0; c.dir = 2; c.pose = rnd() < .45 ? 'phone' : null; if (c.P.ph === 'dwell' && c.P.door > .9) { c.mode = 'board'; c.pose = null; c.goTo(W, c.P.ex + .2, c.y, { snap: 4 }); } }
      else if (!c.fade) c.fade = -1;
    }
    if ((people.t = (people.t || 2) - dt) <= 0) { people.t = 2.5 + rnd() * 5; walker(); }
  }
  const gspec = (() => { try { return Object.assign({}, A.randomSpec(R.rng(41), { age: 'adult' }), UNIFORMS.job_station_agent); } catch (e) { return getSpec('downtown'); } })();
  const guard = new Char(gspec, O + 15.3, O + 24.3); guard.dir = 3; sc.ents.push(guard);
  const GUARD = ['Stand behind the yellow line, please.', 'Loop A from Platform 1, Loop B from Platform 2.', 'Mind the gap. It minds you.', 'The clock up there is four minutes fast. It always has been.', 'Both loops go all the way round. Pick the short way.'];
  function arrived(P) { sfx('train_chime'); if (P.n === 1 && rnd() < .5 && !G.modal) bubble(guard, P.L.name + ' is in. Let them off first, please.', 2400); }
  function departed(P) { if (P.n === 1) { guard.pose = null; } }
  function coming(P) { if (P.n === 1) { guard.pose = 'wave'; setTimeout(() => { guard.pose = null; }, 1600); } }

  /* ---------- birds in the roof ---------- */
  const PERCH = [[4, .32, H + .04], [8.6, .32, H + .04], [15.5, .32, H + .04], [9.9, 28.3, 3.06], [9.6, 6, 5.02], [19.5, 12, 5.02], [10.1, 20, 2.24], [18.4, .4, 5.4]];
  const birdSpr = f => pixSprite('cplbird' + f, [-5, -6, 5, 3], () => { const b = '#6f7780', d = '#4a505a';
    R.spx(0, 0, 0, -1, -1, b); R.spx(0, 0, 0, 0, -1, b); R.spx(0, 0, 0, 1, -1, b); R.spx(0, 0, 0, 2, -2, d); R.spx(0, 0, 0, -2, -1, d); R.spx(0, 0, 0, 0, -2, b); R.spx(0, 0, 0, 1, -2, b); R.spx(0, 0, 0, 3, -2, '#e8a030');
    if (f === 1) { R.spx(0, 0, 0, -1, -3, d); R.spx(0, 0, 0, 0, -3, d); R.spx(0, 0, 0, -2, -4, d); R.spx(0, 0, 0, 1, -4, d); } else if (f === 2) { R.spx(0, 0, 0, -1, 0, d); R.spx(0, 0, 0, 0, 0, d); R.spx(0, 0, 0, -2, 1, d); } });
  const birds = [0, 1, 2, 4].map((pi, i) => { const q = PERCH[pi], b = { x: O + q[0], y: O + q[1], z: q[2], bb: [-.1, -.1, .1, .1, .3], at: pi, to: -1, k: 0, t: 3 + i * 4.1, f: 0, nl: 'ground', sprite() { return birdSpr(this.f); } }; sc.ents.push(b); return b; });
  function flock(dt) {
    for (const b of birds) {
      if (b.to < 0) { if ((b.t -= dt) <= 0) { let n = Math.floor(rnd() * PERCH.length); if (n === b.at || birds.some(o => o !== b && (o.at === n || o.to === n))) { b.t = 1; continue; } b.to = n; b.k = 0; } continue; }
      const a = PERCH[b.at], q = PERCH[b.to]; b.k += dt / 1.5; const k = Math.min(1, b.k), e = k * k * (3 - 2 * k);
      b.x = O + a[0] + (q[0] - a[0]) * e; b.y = O + a[1] + (q[1] - a[1]) * e; b.z = a[2] + (q[2] - a[2]) * e + Math.sin(k * Math.PI) * 1.4; b.f = 1 + (Math.floor(G.time * 9) & 1);
      if (k >= 1) { b.at = b.to; b.to = -1; b.f = 0; b.t = 5 + rnd() * 14; }
    }
  }

  /* ---------- live boards + clocks ---------- */
  const next = di => { const rl = Rl(); return rl ? rl.nextTrains('central').filter(q => q.dir === di).slice(0, 3) : []; };
  const stName = id => { const s = Rl() && Rl().station(id); return (s ? s.name : id).toUpperCase(); };
  const inds = PL.map(P => { const it = fxk('ind' + P.n).item, e = dyn(O + it.x, O + it.y, 2.9, [.66, .24, 0, 4, .3, 1.5], k => { const r = k.split('|'); R.lit(() => { R.textY(r[0], .74, .25, 1.4, '#ffb347'); R.textY(r[1], .74, .25, .98, r[3] === '1' ? '#7ee08a' : '#ffffff'); R.textY(r[2], .74, .25, .56, '#8fb0e8'); }); }); sc.ents.push(e); return e; });
  const big = dyn(O + .3, O + 26, 2.3, [0, 0, 0, .06, 5, 3.1], k => { const r = k.split('|'); R.lit(() => { R.textX('DEPARTURES', .02, 4.82, 3.0, '#ffffff'); R.textX(r[0], .02, 1.5, 3.0, '#ffd98a'); R.textX('PL  TO         MIN', .02, 4.82, 2.56, '#8fb0e8');
    for (let i = 1; i < r.length; i++) { const z = 2.5 - i * .4, q = r[i]; R.textX(q.slice(0, 1), .02, 4.82, z, '#7ee08a'); R.textX(q.slice(2, 3), .02, 4.82 - .5, z, q[2] === 'A' ? '#ff8a76' : '#6fd6dc'); R.textX(q.slice(4, 14), .02, 4.82 - 1.0, z, '#ffb347'); R.textX(q.slice(15), .02, 4.82 - 3.75, z, /NOW/.test(q) ? '#7ee08a' : '#ffffff'); }
    R.textX('MAPLE BAY LIGHT RAIL', .02, 4.82, .28, '#6f7fa8'); }); });
  sc.ents.push(big);
  const hand = (X, Y, a, L, c) => R.line([X, Y], [X + Math.round(Math.sin(a) * L), Y + Math.round(Math.sin(a) * L * .5 - Math.cos(a) * L)], c);
  const clocks = [[16.5, 25.2], [6.4, 25.2]].map(q => { W.block(O + q[0] + .2, O + q[1], O + q[0] + .6, O + q[1] + .3); const e = dyn(O + q[0], O + q[1], 2.5, [-.1, -.1, -2.5, .9, .4, 1.3], k => {
    const m = +k; R.box(.28, .02, -2.5, .24, .22, .12, '#2f4f4c', { ol: false }); R.box(.34, .06, -2.38, .12, .12, 2.4, '#2f4f4c', { ol: false }); R.qy(.3, .5, .2, -1.3, -1.22, '#c9a24a'); R.box(0, 0, 0, .8, .24, .95, '#2f4f4c'); R.box(.3, .04, .95, .2, .16, .12, '#c9a24a', { ol: false }); R.lw([0, .24, .95], [.8, .24, .95], '#c9a24a'); R.lw([0, .24, 0], [.8, .24, 0], '#c9a24a');
    R.lit(() => { const s = R.PW(.4, .245, .48), X = Math.round(s[0]), Y = Math.round(s[1]); for (let j = -6; j <= 6; j++) for (let i = -5; i <= 5; i++) { const yy = j - i * .5, d = i * i * 1.3 + yy * yy; if (d <= 31) R.px(X + i, Y + j, R.C(d > 23 ? '#c9a24a' : '#fffbe8')); }
      hand(X, Y, (m % 720) / 720 * Math.PI * 2, 2.6, '#2a2733'); hand(X, Y, (m % 60) / 60 * Math.PI * 2, 4.2, '#2a2733'); R.px(X, Y, R.C('#e0453a')); }); }); sc.ents.push(e); return e; });
  let boardT = 0, lastMin = -1;
  function boards(force) {
    const rl = Rl(); if (!rl) return; const m = Math.floor(now()); if (!force && m === lastMin && (boardT -= 1) > 0) return; boardT = 20; lastMin = m;
    const all = [];
    for (const P of PL) { const nt = next(P.di), a = nt[0], to = a ? stName(a.towardId) : '-'; all.push(...nt.map(q => ({ P, q })));
      inds[P.di].set([pad(to, 12), pad(P.L.name.toUpperCase(), 7) + padL(a ? (a.boarding ? 'NOW' : Math.round(a.minutes) + ' MIN') : '', 6), nt.length > 1 ? 'THEN ' + nt.slice(1).map(q => Math.round(q.minutes)).join(',') + ' MIN' : '', a && a.boarding ? '1' : '0'].join('|')); }
    all.sort((a, b) => a.q.minutes - b.q.minutes);
    big.set([G.now().clock].concat(all.slice(0, 5).map(o => o.P.n + ' ' + (o.P.di ? 'B' : 'A') + ' ' + pad(stName(o.q.towardId), 10) + ' ' + padL(o.q.boarding ? 'NOW' : mins(o.q.minutes), 3))).join('|'));
    const cm = Math.floor((now() + 4) % 1440); for (const c of clocks) c.set(String(cm));   // the station's clocks run four minutes fast (the Station Agent's story)
  }

  /* ---------- sky ---------- */
  const skyObs = W.objs.filter(o => o.data && o.data.sky), shafts = W.objs.filter(o => o.data && o.data.shaft); let sky = -1, skyT = 0;
  const applySky = () => { const h = G.now().hf, s = h < 5.5 || h >= 20.5 ? 2 : h < 7 || h >= 18.5 ? 1 : 0; if (s === sky) return; sky = s; for (const o of skyObs) { o.p = Object.assign({}, o.p, { sky: s }); o._key = null; } for (const o of shafts) o.hidden = s !== 0; };

  /* ---------- boarding ---------- */
  let want = null, flow = null;
  const nearDoor = P => { const p = G.player; let b = DOORS_Y[3], bd = 1e9; for (const d of DOORS_Y) { const q = Math.abs(O + d - p.y) + (Math.abs(p.x - P.wx) > 4 ? Math.abs(O + d - (O + 22)) : 0); if (q < bd) { bd = q; b = d; } } return O + b; };
  const tripTo = () => { try { const t = G.nav && G.nav.trip && G.nav.trip(); return t && t.mode === 'train' && t.stage === 0 && /central/.test(String(t.from)) ? String(t.to).replace(/^station:|^st_/, '') : null; } catch (e) { return null; } };
  sc.platformBoard = (dir, to, board, fail) => {
    const P = PL[dir] || PL[0], p = G.player, y = nearDoor(P); want = { dir, to }; if (flow) { fail && fail(); return; }
    const end = () => { flow = null; if (G.cutscene === cs) G.cutscene = null; };
    const stepIn = () => { const tr = P.ph === 'dwell' ? P.j : undefined; flow = { st: 'in', t: 0 }; G.cutscene = cs; p.goTo(W, P.ex + .15, y, { snap: 4 }); cs.go = () => { end(); want = null; board(tr); }; };
    const wait = () => {
      if (P.ph === 'dwell' && P.door > .5 && Rl().DWELL - P.u > .7) return stepIn();
      const nt = next(dir).find(q => !q.boarding) || { minutes: 3 }, w = nt.minutes + .55; toast(P.L.name + ' leaves from Platform ' + P.n + ': ' + (nt.minutes < .6 ? 'coming in now.' : 'in ' + Math.max(1, Math.round(nt.minutes)) + ' min.'));
      p.dir = 2; G.startActivity({ label: 'Waiting for the train', anim: 'stand', minutes: w, rate: Math.max(1.3, w / 6), done: () => setTimeout(stepIn, 0), cancel: () => { want = null; fail && fail(); } });
    };
    const cs = { plat: 1, update(dt) { const f = flow; if (!f) { G.cutscene = null; return; } f.t += dt; p.move(W, dt * (f.st === 'in' ? .8 : 1.25));
      if (f.st === 'walk') { if (!p.path || f.t > 14) { if (Math.hypot(p.x - P.wx, p.y - y) > 1.2) { p.x = P.wx; p.y = y; } p.path = null; p.dir = 2; end(); wait(); } }
      else if (!p.path || f.t > 1.2) { const go = cs.go; cs.go = null; if (go) go(); } } };
    if (Math.hypot(p.x - P.wx, p.y - y) < .5) return wait();
    flow = { st: 'walk', t: 0 }; G.cutscene = cs; if (!p.goTo(W, P.wx, y, { snap: 4 })) { p.x = P.wx; p.y = y; }
  };
  const pick = P => {
    const rl = Rl(); if (!rl) return toast('No trains today.'); const to = tripTo() || (want && want.to);
    if (to && rl.station(to)) { const pl = rl.plan('central', to); if (pl && pl.dir !== P.di) toast('For ' + rl.station(to).name + ' the quicker way is ' + pl.line + ', Platform ' + (pl.dir + 1) + '.'); return rl.ride('central', to); }
    rl.openStation('central');
  };
  sc.navBoard = t => { const rl = Rl(), to = String(t.to || '').replace(/^station:|^st_/, ''), pl = rl && rl.plan('central', to); if (!pl) return null; const P = PL[pl.dir], s = rl.station(to);
    return { x: P.wx, y: nearDoor(P), label: 'Platform ' + P.n + ': ' + pl.line + ' to ' + (s ? s.name : to) + (P.ph === 'dwell' ? ' · boarding now' : '') }; };

  /* ---------- interactables ---------- */
  for (const P of PL) for (const d of DOORS_Y) sc.interactables.push({ x: P.wx - .3, y: O + d, h: .3, hit: 7, range: 1.3, spot: { x: P.wx, y: O + d }, get label() { return (P.ph === 'dwell' && P.door > .5 ? 'Board ' : 'Wait here: ') + P.L.name + ' toward ' + (P.di ? 'Railyard' : 'Harborside'); }, use: () => pick(P) });
  const add = (k, label, use) => { const f = fxk(k); if (!f) return; sc.interactables.push({ x: f.x, y: f.y, h: Math.min(1.6, f.ob.size[2]), hit: 14, spot: f.use || undefined, label, use, fx: f }); };
  add('big', 'Departures board', () => (Rl() ? Rl().openStation('central') : toast('No trains today.')));
  add('help', 'Help point', () => { const m = modal({ title: 'Maple Bay Light Rail', cls: 'rail-win' }); if (Rl()) m.body.append(Rl().diagram('central')); m.body.append(el('div.rail-note', { text: 'Platform 1: Loop A, clockwise, toward Harborside and Old Town. Platform 2: Loop B, the other way, toward Railyard and the Airport. Both loops call at every station.' })); });
  add('pa', 'The announcer\'s microphone', () => toast('A grey box, a gooseneck microphone and a label: GLADYS. Staff only.'));
  add('dispatch', 'Dispatch point', () => toast('A green flag, a white baton and a whistle on their hooks. The yellow square is where the dispatcher stands.'));
  const of = fxk('office'); if (of) { sc.interactables.push({ x: of.ob.x + 1.3, y: O + .3, h: 2, hit: 14, spot: { x: of.ob.x + 1.3, y: O + .9 }, label: 'Stationmaster\'s office', use: () => toast(G.now().hf >= 6 && G.now().hf < 20 ? 'A brass plate: A. NWOSU, STATIONMASTER. Through the glass, a kettle and a wall of timetables.' : 'The office is dark. A brass plate: A. NWOSU, STATIONMASTER.') });
    sc.interactables.push({ x: of.ob.x + 5.4, y: O + .3, h: 1.8, hit: 12, spot: of.use, label: 'Lost property', use: () => toast('One umbrella, three single gloves, a cello case and a novel with notes in the margin. Kept a year and a day.') }); }
  sc.interactables.push({ ent: guard, x: guard.x, y: guard.y, label: 'Platform guard', h: 1.3, range: 1.6, use: () => { guard.faceTo(G.player.x, G.player.y); const a = next(0)[0], b = next(1)[0]; bubble(guard, rnd() < .5 && a && b ? 'Platform 1 ' + (a.boarding ? 'is boarding now' : 'in ' + Math.max(1, Math.round(a.minutes)) + ' minutes') + ', Platform 2 ' + (b.boarding ? 'boarding now' : 'in ' + Math.max(1, Math.round(b.minutes))) + '.' : GUARD[Math.floor(rnd() * GUARD.length)], 3200); setTimeout(() => { guard.dir = 3; }, 3000); } });

  /* ---------- scene hooks ---------- */
  const sp0 = sc.spawn, e0 = sc.onEnter, x0 = sc.onExit, u0 = sc.update;
  sc.spawn = opts => (opts && opts.arrive !== undefined && PL[opts.arrive] ? { x: PL[opts.arrive].wx - .25, y: O + DOORS_Y[4], dir: 0 } : sp0);
  sc.onEnter = (opts, prev) => { e0(opts, prev); flow = null; if (!(opts && opts.keepWant)) want = null; applySky(); trains(0, true); boards(true); prebake(); for (const c of pax.slice()) drop(c); for (let i = 0; i < 3; i++) walker(); for (const c of pax) { c.move(W, 0); } };
  sc.onExit = to => { flow = null; if (G.cutscene && G.cutscene.plat) G.cutscene = null; x0(to); };
  sc.update = (dt, gm) => { u0(dt, gm); trains(dt, false); people(dt); flock(dt); boards(false); guard.t += dt; if ((skyT -= dt) <= 0) { skyT = 2; applySky(); } };
  sc.plat = { PL, pax, state: () => PL.map(P => ({ n: P.n, ph: P.ph, u: +P.u.toFixed(2), j: P.j, door: +P.door.toFixed(2), cars: P.cars.map(c => (c.hidden ? null : +(c.y - O).toFixed(1))) })), boards: () => ({ big: big.key, ind: inds.map(i => i.key), clock: clocks[0].key }), want: () => want };
}

room({ id: PLAT_ROOM, name: 'Central Station platforms', venue: 'central_station', w: W_, d: D_, zoom: 0, music: 'quiet', floor: GT.f_stone,
  floors: [{ x0: 0, y0: 26, x1: W_, y1: D_, floor: GT.f_tile }, { x0: 9, y0: 27.4, x1: 11, y1: 28.6, floor: GT.f_mat }],
  wall: { color: '#e6dfd0', trim: '#8a7f72', h: H }, items, npc,
  exits: [{ x: 10, y: 27.9, label: 'Stairs down to the hall', to: 'int:central_station', use: g => { g.state.flags.lastDoor = 'door:central_station'; return g.go('int:central_station', { x: 15, y: 4.6, dir: 1 }); } }],
  spawn: { x: 10, y: 27.2, dir: 3 }, setup });
