// Airport air traffic (ambient, city scene only): landings and take-offs on the runway of `world.airport`, plus occasional
// high flyovers that slide a shadow across the streets near the player. One or two aircraft at a time; when the airport is far
// away only a timer runs.
//
// G.planes
//   landNow(variant?, opts?) -> flight | null   variant: 'airliner' | 'turboprop' | 'bizjet' | 'cargo' (default random). Forces a landing now.
//   takeoffNow(variant?)     -> flight | null   roll, rotate, climb out over the city (heading -x, same as landings)
//   flyover(variant?)        -> flight | null   high pass over the player
//   count()                  -> active flights          flights() -> the live list
//   flight = { kind: 'land' | 'takeoff' | 'fly', id, cx, cy, alt, v, phase: 'air' | 'roll' | 'climb' | 'out', done, cam: {x, y, z} }
//        `cam` is a camera target (G.camTarget = flight.cam) at the aircraft's centre.
// Events: 'plane:flyover'(flight) once per flight when it passes low near the player (audio hook), 'plane:landed'(flight) at
//         touchdown, 'plane:gone'(flight) when it despawns.
// No state is saved. Entities: the aircraft (z = altitude, tall sort box -> draws over the city) and its flat '<id>.shadow' on the ground.
import { G } from '../core/game.js';
import { asset } from '../art/registry.js';
import { assetSprite } from '../engine/sprites.js';

const KINDS = ['airliner', 'turboprop', 'bizjet', 'cargo'], WEIGHT = ['airliner', 'airliner', 'turboprop', 'turboprop', 'bizjet', 'cargo'];
const flights = []; let C = null, AP = null, next = 3, flip = 0;
const rnd = (a, b) => a + Math.random() * (b - a);

class PlaneEnt {
  constructor(shadow) { this.shadow = shadow; this.x = 0; this.y = 0; this.z = 0; this.bb = [0, 0, 1, 1, 1]; this.hidden = true; this.alpha = 1; this.f = null; this.isPlane = true; }
  sprite() {
    const f = this.f; if (!f) return null;
    try {
      if (f.ay) { // turned onto the y axis (taxiing off the runway): the mirrored sprite, nose toward f.ay (+1 = +y)
        if (this.shadow) return assetSprite(f.sa, { dir: f.ay }, true, f.sa.id + '|Y' + f.ay);
        return assetSprite(f.a, Object.assign({}, f.pDown, { dir: f.ay }), true, f.a.id + '|' + f.vi + '|Y' + f.ay);
      }
      if (this.shadow) return assetSprite(f.sa, f.sp, false, f.sa.id + '|' + f.dir);
      return assetSprite(f.a, f.gear ? f.pDown : f.pUp, false, f.a.id + '|' + f.vi + '|' + f.dir + '|' + (f.gear ? 1 : 0));
    } catch (e) { return null; }
  }
}
const pool = [];
function ents() { let p = pool.find(q => !q.f); if (!p) { p = { e: new PlaneEnt(false), s: new PlaneEnt(true), f: null }; pool.push(p); C.ents.push(p.s, p.e); } return p; }
function city() { if (!C) { C = G.sceneCache.get('city') || null; AP = C && C.world && C.world.airport ? C.world.airport : null; } return C; }

function make(kind, variant, dir) {
  if (!city()) return null;
  const id = KINDS.includes(variant) ? variant : WEIGHT[Math.floor(Math.random() * WEIGHT.length)];
  let a, sa; try { a = asset('veh.airport.' + id); sa = asset('veh.airport.' + id + '.shadow'); } catch (e) { return null; }
  const vs = a.variants || [{}], vi = Math.floor(Math.random() * vs.length), v = vs[vi], size = typeof a.size === 'function' ? a.size(v) : a.size;
  const f = { kind, id, a, sa, vi, dir, gear: true, pDown: Object.assign({}, v, { dir, gear: true }), pUp: Object.assign({}, v, { dir, gear: false }), sp: { dir },
    L: size[0], span: size[1], h: size[2], cx: 0, cy: 0, alt: 0, gz: 0, v: 0, phase: 'air', t: 0, fade: 1, done: false, heard: false, cam: { x: 0, y: 0, z: 0 } };
  const p = ents(); p.f = f; f.pool = p; p.e.f = f; p.s.f = f; p.e.bb = [0, 0, f.L, f.span, f.h]; p.s.bb = [0, 0, f.L, f.span, .05];
  flights.push(f); return f;
}
function sync(f) {
  const e = f.pool.e, s = f.pool.s, x = f.cx - (f.ay ? f.span : f.L) / 2, y = f.cy - (f.ay ? f.L : f.span) / 2;
  e.x = x; e.y = y; e.z = f.gz + f.alt; e.hidden = false; e.alpha = f.fade;
  s.x = x; s.y = y; s.z = f.gz + .02; s.hidden = false; s.alpha = f.fade * Math.max(.22, Math.min(.8, .8 - f.alt / 50));
  f.cam.x = f.cx; f.cam.y = f.cy; f.cam.z = f.gz + f.alt * .6;
}
function free(f) { f.done = true; const p = f.pool; p.e.hidden = p.s.hidden = true; p.e.f = p.s.f = null; p.f = null; const i = flights.indexOf(f); if (i >= 0) flights.splice(i, 1); G.emit('plane:gone', f); }
const runwayBusy = () => flights.some(f => f.kind !== 'fly' && !(f.kind === 'takeoff' && f.alt > 6));

function landNow(variant) {
  if (!city() || !AP) return null; const A = AP.approach, f = make('land', variant, -1); if (!f) return null;
  f.cx = A.from; f.cy = A.c; f.gz = A.z; f.v = 24; f.phase = 'air'; step(f, 0); return f;
}
function takeoffNow(variant) {
  if (!city() || !AP) return null; const R = AP.runways[0], f = make('takeoff', variant, -1); if (!f) return null;
  f.cx = R.b - 14; f.cy = R.c; f.gz = R.z; f.v = 0; f.phase = 'roll'; f.fade = 0; step(f, 0); return f;
}
function flyover(variant) {
  if (!city()) return null; const p = G.player, dir = Math.random() < .5 ? 1 : -1, f = make('fly', variant || (Math.random() < .5 ? 'bizjet' : 'turboprop'), dir); if (!f) return null;
  f.cx = p.x - dir * 120; f.cy = p.y + rnd(-14, 14); f.alt = 30; f.v = 36; f.gear = false; f.x1 = p.x + dir * 120; f.fade = 0; step(f, 0); return f;
}
function groundZ(x, y) { const w = C.world; if (x < 1 || y < 1 || x > w.w - 2 || y > w.h - 2) return 0; const z = w.heightAt(x, y); return z > 0 ? z : 0; }

function step(f, dt) {
  f.t += dt;
  if (f.kind === 'land') {
    const A = AP.approach;
    if (f.phase === 'air') {
      f.cx -= f.v * dt; const d = f.cx - A.touchdown;
      if (d <= 0) { f.alt = 0; f.phase = 'roll'; G.emit('plane:landed', f); } else f.alt = d * .13 * (d < 14 ? .45 + .55 * d / 14 : 1);
    } else {
      // roll out to the END of the runway, stop, TURN 90 degrees toward the taxiway (swap to the y-axis sprite), then taxi off and fade
      const R = AP.runways[0], endX = R.a + f.L / 2 + 4, ty = (AP.taxiway && AP.taxiway.c) || A.c + 14, sy = Math.sign(ty - A.c) || 1;
      if (!f.ay) {
        const left = f.cx - endX; f.v = left > 9 ? Math.max(15, f.v - 6 * dt) : Math.max(left > .3 ? 5 : 0, f.v - 14 * dt); f.cx = Math.max(endX, f.cx - f.v * dt);
        if (f.cx <= endX + .01) { f.hold = (f.hold || 0) + dt; if (f.hold > .5) { f.ay = sy; f.turn = true; f.v = 0; } }
      } else { f.v = Math.min(4.5, f.v + 3 * dt); f.cy += f.ay * f.v * dt; if (Math.abs(f.cy - A.c) > 10) { f.fade -= dt / 1.2; if (f.fade <= 0) return free(f); } }
    }
  } else if (f.kind === 'takeoff') {
    if (f.fade < 1 && f.phase === 'roll') f.fade = Math.min(1, f.fade + dt * 1.5);
    f.v = Math.min(30, f.v + 7 * dt); f.cx -= f.v * dt;
    if (f.phase === 'roll' && f.v >= 22) f.phase = 'climb';
    if (f.phase === 'climb') { f.alt += f.v * .2 * dt; if (f.alt > 3) f.gear = false; if (f.alt > 30 || f.cx < 8) { f.phase = 'out'; } }
    if (f.phase === 'out') { f.alt += f.v * .2 * dt; f.fade -= dt / 1.5; if (f.fade <= 0) return free(f); }
    if (f.alt > 0 && f.cx < AP.runways[0].a) f.gz = groundZ(f.cx, f.cy);
  } else {
    f.cx += f.dir * f.v * dt; f.gz = groundZ(f.cx, f.cy); const left = (f.x1 - f.cx) * f.dir;
    f.fade = left < 20 ? Math.max(0, left / 20) : Math.min(1, f.fade + dt); if (left <= 0) return free(f);
  }
  if (!f.heard && f.alt > .5 && f.alt < 34) { const p = G.player; if (Math.abs(f.cx - p.x) < 16 && Math.abs(f.cy - p.y) < 34) { f.heard = true; G.emit('plane:flyover', f); } }
  sync(f);
}

export function init() {
  G.planes = { landNow, takeoffNow, flyover, count: () => flights.length, flights: () => flights, clear: () => { for (const f of flights.slice()) free(f); } }; // clear(): remove every active flight (the intro wants an empty runway)
  G.on('scene', (s) => { if (s && s.id !== 'city') for (const f of flights.slice()) free(f); });
  G.on('scene', (s) => { if (!s || s.id !== 'city' || s._acGrass) return; s._acGrass = true; const w = s.world; for (const ob of w.objs) { if (!/^veh\.airport\.(airliner|turboprop|bizjet|cargo|helicopter)/.test(ob.id)) continue; const t = w.tileType((ob.B[0] + ob.B[3]) / 2, (ob.B[1] + ob.B[4]) / 2); if (t === 1 || t === 16 || t === 20) ob.hidden = true; } });
  G.addSystem({ name: 'planes', update(dt, gm) {
    if (!G.scene || G.scene.id !== 'city' || !city()) return;
    for (let i = flights.length - 1; i >= 0; i--) step(flights[i], Math.min(dt, .1));
    next -= (typeof gm === 'number' && gm > 0 ? gm : dt); if (next > 0) return;
    next = rnd(5, 12); if (G.planes.quiet) return;
    const p = G.player, R = AP && AP.runways[0], near = R && Math.abs(p.x - (R.a + R.b) / 2) < 150 && Math.abs(p.y - R.c) < 130;
    if (near) { if (flights.length < 2 && !runwayBusy()) { if (flip++ % 3 === 2) takeoffNow(); else landNow(); } else next = 1.5; }
    else if (!flights.length && Math.random() < .4) flyover();
  } });
}
