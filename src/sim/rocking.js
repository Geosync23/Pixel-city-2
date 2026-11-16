// Rocking chairs rock while somebody sits in them (owner msg 180: Nana's chair by the range). Works in any room that has a furn.home.rocker:
// the chair's picture is stepped through its five tilts (art/home/seating.js rocker, p.tilt -2..2) along a slow sine, the sitter is moved with the seat, and when
// the sitter gets up the chair rocks on for a moment and comes to rest. Costs nothing in rooms without one (one compare a frame).
import { G } from '../core/game.js';
import { ROCK_STEP } from '../art/home/seating.js';
export const order = 140;
const ID = 'furn.home.rocker', PERIOD = 2.3, BODY = .9;   // seconds per rock; how far above the floor the part of the sitter that is moved is (the sitter is not tilted, only shifted)
const DX = [1, 0, -1, 0], DY = [0, 1, 0, -1];
let sc0 = null, n0 = -1, list = [], scanT = 0;
const sitting = e => !e.hidden && (e.seated || e.pose === 'sit' || (e.poseOpts && e.poseOpts.seated));
const setTilt = (ob, t) => { if ((ob.p.tilt || 0) === t) return; ob.p = Object.assign({}, ob.p, { tilt: t }); ob._key = null; };
function update(dt) {
  const sc = G.scene; if (!sc || !sc.fixtures) return;
  if (sc !== sc0 || sc.fixtures.length !== n0) { for (const r of list) if (sc !== sc0) setTilt(r.ob, 0); sc0 = sc; n0 = sc.fixtures.length; list = sc.fixtures.filter(f => f.asset && f.asset.id === ID && f.ob && f.seats && f.seats[0]).map(f => ({ ob: f.ob, seat: f.seats[0], who: null, ph: 0, amp: 0 })); }
  if (!list.length) return; scanT -= dt; const scan = scanT <= 0; if (scan) scanT = .25;
  for (const r of list) {
    const s = r.seat; let e = r.who;
    if (e && !(sitting(e) && Math.hypot(e.x - s.x, e.y - s.y) < .3 && sc.ents.includes(e))) e = r.who = null;
    if (!e && scan) { const p = G.player; if (p && sitting(p) && Math.hypot(p.x - s.x, p.y - s.y) < .2) e = p; else for (const c of sc.ents) if (c !== p && sitting(c) && Math.hypot(c.x - s.x, c.y - s.y) < .2) { e = c; break; } if (e) { r.who = e; if (r.amp < .05) r.ph = 0; } }
    if (e) r.amp += (1 - r.amp) * Math.min(1, dt * 1.6); else { if (r.amp <= 0) continue; r.amp -= dt * .45; if (r.amp <= 0) { r.amp = 0; setTilt(r.ob, 0); continue; } }
    r.ph += dt * 6.2832 / PERIOD; const t = Math.round(Math.sin(r.ph) * 2 * r.amp); setTilt(r.ob, t);
    if (e) { const d = s.dir === undefined ? 1 : s.dir, k = -BODY * Math.sin(t * ROCK_STEP); e.x = s.x + DX[d] * k; e.y = s.y + DY[d] * k; }
  }
}
export function init() { G.addSystem({ update }); G.rocking = { debug: () => list.map(r => ({ tilt: r.ob.p.tilt || 0, amp: +r.amp.toFixed(2), who: r.who ? (r.who === G.player ? 'player' : 'npc') : null })) }; }
