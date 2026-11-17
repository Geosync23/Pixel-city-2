// The playground pieces that move with their rider (owner msg 218: "He isn't sitting on the seesaw right"; docs/reports/seesaw.md). City scene only.
//   SEESAW (prop.park.play.seesaw): while somebody sits on an end the plank rocks: its picture is stepped through five tilts (art/props/park.js, p.tilt -2..2) along a slow
//     sine, each rider is kept at the height of their end (the far end is up when the near end is down), and the player rides ASTRIDE (poseOpts.straddle, art/chars/char.js).
//     When the last rider gets up the plank swings on for a moment and settles back to how it always rested (tilt 2).
//   SWINGS (prop.park.play.swings): a seat with a rider swings out and back (p.s0 / p.s1 = the seat's offset along y, five steps), the rider moves with the seat.
// The same approach as sim/rocking.js (the rocking chair). Nothing is saved. Costs one distance test per piece a frame while the camera is far away.
// G.playground = { debug() -> [{ kind, tilt | sw, riders }] }
import { G } from '../core/game.js';
import { SEESAW_SEATS, seesawZ, swingRise } from '../art/props/park.js';
export const order = 141;
const SEE = 'prop.park.play.seesaw', SWG = 'prop.park.play.swings', NEAR = 46, PERIOD = 2.6, SW_PERIOD = 2.2, SW_SEATS = [1.3, 2.7], SW_Z = .55, SW_MAX = .5;
let world0 = null, list = [], scanT = 0;
const sitting = e => e && !e.hidden && e.active !== false && (e.seated || e.pose === 'sit' || (e.poseOpts && e.poseOpts.seated));
const setP = (ob, o) => { let ch = false; for (const k in o) if (ob.p[k] !== o[k]) { ch = true; break; } if (!ch) return; ob.p = Object.assign({}, ob.p, o); ob._key = null; };
/* the seats of a placed piece: base position (the seat at rest), and which way the seat's own x / y runs in the world (a flipped prop swaps them) */
const seatAt = (ob, x, y) => ob.flip ? { x: ob.x + y, y: ob.y + x } : { x: ob.x + x, y: ob.y + y };
function collect(world) {
  world0 = world; list = [];
  for (const ob of world.objs) {
    const id = ob.a && ob.a.id; if (id !== SEE && id !== SWG) continue;
    const seats = id === SEE ? SEESAW_SEATS.map(x => seatAt(ob, x, .5)) : SW_SEATS.map(x => seatAt(ob, x, 1));
    list.push({ ob, see: id === SEE, seats: seats.map(s => ({ x: s.x, y: s.y, who: null, amp: 0, ph: 0 })), cx: (ob.B[0] + ob.B[3]) / 2, cy: (ob.B[1] + ob.B[4]) / 2, v: 1, ph: 0, amp: 0 });
  }
}
/* who sits here: the player first, then city folk (only looked for four times a second) */
function find(s, r) {
  const p = G.player; if (sitting(p) && Math.hypot(p.x - s.x, p.y - s.y) < r) return p;
  const C = G.crowd && G.crowd.citizens ? G.crowd.citizens() : null; if (C) for (const c of C) if (sitting(c) && Math.hypot(c.x - s.x, c.y - s.y) < r) return c;
  return null;
}
const lift = (e, x, y, zAbs) => { const g = G.world.heightAt(x, y); e.x = x; e.y = y; if ('zoff' in e) e.zoff = Math.max(0, zAbs - g); e.z = zAbs; };
function update(dt) {
  const sc = G.scene; if (!sc || sc.id !== 'city' || !sc.world) return; if (sc.world !== world0) collect(sc.world); if (!list.length) return;
  const f = G.camTarget || G.player; scanT -= dt; const scan = scanT <= 0; if (scan) scanT = .25;
  for (const L of list) {
    if (Math.abs(L.cx - f.x) + Math.abs(L.cy - f.y) > NEAR) { if (L.amp > 0 || L.seats.some(s => s.amp > 0)) { L.amp = 0; L.v = 1; for (const s of L.seats) { s.who = null; s.amp = 0; } setP(L.ob, L.see ? { tilt: undefined } : { s0: undefined, s1: undefined }); } continue; }
    const ob = L.ob, oz = ob.z || 0; let any = false;
    for (const s of L.seats) { let e = s.who; if (e && !(sitting(e) && Math.hypot(e.x - s.x, e.y - s.y) < .9)) e = s.who = null; if (!e && scan) e = s.who = find(s, .25); if (e) any = true; }
    if (L.see) {
      if (any) L.amp += (1 - L.amp) * Math.min(1, dt * 1.4); else { if (L.amp <= 0) continue; L.amp -= dt * .5; if (L.amp <= 0) { L.amp = 0; L.v = 1; setP(ob, { tilt: undefined }); continue; } }
      /* the plank's position -1..1 (1 = the low-x end up, the resting picture): a sine while it is ridden, easing back to rest afterwards. A rider alone starts by going down. */
      L.ph += dt * 6.2832 / PERIOD; L.v = 1 - L.amp * (1 - Math.cos(L.ph + (L.seats[1].who && !L.seats[0].who ? Math.PI : 0)));
      const tilt = Math.round(L.v * 2); setP(ob, { tilt: tilt === 2 ? undefined : tilt });   /* 2 = the resting picture: no parameter, the sprite everybody already has */
      L.seats.forEach((s, i) => { const e = s.who; if (!e) return; lift(e, s.x, s.y, oz + seesawZ(tilt, SEESAW_SEATS[i])); if (e === G.player && e.pose === 'sit' && !(e.poseOpts && e.poseOpts.straddle)) e.poseOpts = Object.assign({ seated: true }, e.poseOpts, { straddle: 1 }); });
    } else {
      const o = {};
      L.seats.forEach((s, i) => {
        const e = s.who, k = i ? 's1' : 's0';
        if (e) s.amp += (1 - s.amp) * Math.min(1, dt * 1.2); else if (s.amp > 0) { s.amp -= dt * .4; if (s.amp <= 0) { s.amp = 0; s.ph = 0; } }
        if (s.amp <= 0) { o[k] = undefined; return; }
        s.ph += dt * 6.2832 / SW_PERIOD; const sw = Math.round(Math.sin(s.ph) * s.amp * 2) / 2 * SW_MAX; o[k] = sw;
        if (e) { const dx = ob.flip ? sw : 0, dy = ob.flip ? 0 : sw; lift(e, s.x + dx, s.y + dy, oz + SW_Z + swingRise(sw)); }
      });
      setP(ob, o);
    }
  }
}
export function init() {
  G.addSystem({ name: 'playground', update });
  G.playground = { debug: () => list.map(L => ({ kind: L.see ? 'seesaw' : 'swings', tilt: L.see ? (L.ob.p.tilt === undefined ? 2 : L.ob.p.tilt) : undefined, sw: L.see ? undefined : [L.ob.p.s0, L.ob.p.s1], riders: L.seats.map(s => s.who ? (s.who === G.player ? 'player' : 'npc') : null) })) };
}
