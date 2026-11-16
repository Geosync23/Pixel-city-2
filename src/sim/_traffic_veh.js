// Vehicle entity + lane-following kinematics (private helper of sim/traffic.js).
// A vehicle sits on a directed edge `e` in lane `off` at coordinate `s` (along the edge axis) with lateral coordinate `lat`;
// `ne` is the edge it takes at the next node. Display position rounds perpendicular turns with a quarter arc.
//
// DRIVING RULES (BIBLE direction update 27, owner msg 145: "smarter traffic, fewer jams, no decrease in density"; numbers in docs/reports/traffic2.md):
//   following     brake for whatever is in the swept path ahead (a vehicle across the path counts with its real length);
//   junctions     a junction box is RESERVED, never just driven into. A vehicle is let in at its stop line only if (1) its light is green (or there is
//                 none), (2) its path through the box does not cross the path of anyone who holds the box (paths are compared geometrically, per
//                 lane: conflict()), (3) there is room on the exit lane to clear the box and the crosswalk completely (roomFor(): "never enter a
//                 junction you cannot leave"), and (4) nobody with right of way is about to arrive (yield: straight > right turn > left turn, then the
//                 bigger road, then the lower id). Someone who has waited 4 s on a green gets a CLAIM: conflicting traffic lets him go next.
//   re-planning   an ambient vehicle whose exit stays full picks another exit (pickExit); a cab asks traffic.js for a new route (T.reroute);
//                 on a road with two lanes each way a vehicle behind something that is not moving changes lane (laneChange);
//                 on a street with one lane each way it overtakes a stationary obstacle through the oncoming lane when that is clear (canPass).
//   kerb          a bus pulls in to the kerb at its stop, a cab that waits or is told to halt pulls right over (curb), so others can get by.
//   people        a vehicle waits for anyone in its path; someone STANDING at the edge of the lane is driven round slowly instead of waited for forever.
//   last resort   T.stats counts every time a vehicle is allowed through others (ghost) or is flagged for removal out of sight (unstick): both should stay near 0.
import { U } from '../engine/raster.js';
import * as RA from '../engine/raster.js';
import { assetSprite, toSprite, prebakeAsset } from '../engine/sprites.js';
import { charArt } from '../core/char.js';
let RSEED = 97; const rnd = () => (RSEED = (RSEED * 16807) % 2147483647) / 2147483647;
const RIDERS = { 'veh.scooter': [.62, .52], 'veh.motorbike': [.8, .6], 'veh.bicycle': [.7, .62] }; // seat x (from the rear, local), seat height
import { ASSETS, assetSize } from '../art/registry.js';

/** shared sim context. stats: counters since the page loaded (tools/traffic_check.mjs reads them) */
export const T = { list: [], peds: [], time: 0, tick: 0, lit: false, world: null, honkAt: 0, sfx: null, edges: null, reroute: null, onScreen: null,
  stats: { ghost: 0, ghostPre: 0, unstick: 0, replan: 0, reroute: 0, laneChange: 0, pass: 0, claim: 0, squeeze: 0, busSkip: 0, despawn: 0, rightOnRed: 0 }, busSkip: null };
/** tunables (docs/reports/traffic2.md) */
export const TUNE = { claimAfter: 2.5, replanAfter: 3, rerouteAfter: 5, passAfter: 2.5, ghostPre: 8, ghostAfter: 60, unstickAfter: 40, clearBox: 1.6, yieldTime: 1.8, rightOnRed: true, busKerb: .3, cabKerb: .6 };
const R = 1.3, HP = Math.PI / 2;
let UID = 0;

export class Veh {
  constructor() {
    this.x = 0; this.y = 0; this.z = 0; this.isVehicle = true; this.hidden = true; this.active = false; this.spr = new Array(8); this.bbX = [0, 0, 0, 0, 1]; this.bbY = [0, 0, 0, 0, 1]; this.bb = this.bbX;
    this.e = null; this.ne = null; this.uid = ++UID; this.reset();
  }
  reset() {
    this.v = 0; this.off = 1; this.noff = 1; this.s = 0; this.lat = 0; this.turnS = 0; this.inNode = null; this.cornerOn = false; this.cx = 0; this.cy = 0; this.cax = 'x'; this.cd = 1;
    this.plan = null; this.offs = null; this.planI = 0; this.cyclic = false; this.stop = null; this.onStop = null; this.halt = false; this.parked = false; this.curb = 0; this.keep = false; this.pre = false;
    this.stuck = 0; this.gho = 0; this.ghost = false; this.pedWait = 0; this.honk = 1; this.byPlayer = false; this.bus = null; this.stand = null; this.taxiFree = false; this.role = ''; this.acc = 1; this.gap = 1.3; this.age = 0; this.ride = false; this.leadFast = false;
    this.mk = -1; this.nmk = -1; this.ln = 99; this.lw = 0; this.xw = 0; this.dg = 0; this.lcT = 0; this.pass = null; this.dest = null; this.unstick = false; this.why = 0; this.apN = null; this.far = false; this.ck = false;
  }
  /** kind: { id, asset, vmax }, params: art params (color, route, free...) */
  setKind(kind, params) {
    this.kind = kind.id; this.asset = ASSETS.get(kind.asset); this.params = params || {}; const sz = assetSize(this.asset, this.params); this.len = sz[0]; this.wid = sz[1]; this.h = sz[2]; this.vmax = kind.vmax; this.vbase = kind.vmax;
    const a = this.len / 2, b = this.wid / 2; this.bbX[0] = -a; this.bbX[1] = -b; this.bbX[2] = a; this.bbX[3] = b; this.bbX[4] = this.h; this.bbY[0] = -b; this.bbY[1] = -a; this.bbY[2] = b; this.bbY[3] = a; this.bbY[4] = this.h; this.spr.fill(undefined);
    this.gap = this.len > 5 ? 1.8 : 1.3; this.acc = this.len > 5 ? .7 : 1;
  }
  setParams(p) { this.params = Object.assign({}, this.params, p); this.spr.fill(undefined); }
  sprite() { const e = this.e; if (!e) return null; const i = (e.axis === 'y' ? 4 : 0) + (e.d < 0 ? 2 : 0) + (T.lit && !this.stand ? 1 : 0); let s = this.spr[i]; if (s === undefined) s = this.spr[i] = this.mk_(i); return s; }
  /** perf: called by the renderer while this vehicle is just off screen: have its sprite baked ahead (same asset, params and key as mk_() below; two-wheelers with a rider are drawn on demand as before) */
  prebake(pri, all) {
    const e = this.e; if (!e || !this.asset || (RIDERS[this.asset.id] && !this.stand)) return; const i0 = (e.axis === 'y' ? 4 : 0) + (e.d < 0 ? 2 : 0) + (T.lit && !this.stand ? 1 : 0);
    for (let q = 0; q < (all ? 4 : 1); q++) {   // all: the four headings too (a vehicle that turns in view), a little later than the one it shows now
      const i = q ? (i0 & 1) + q * 2 : i0; if ((q && i === i0) || this.spr[i] !== undefined) continue;
      const p = Object.assign({}, this.params, { dir: i & 2 ? -1 : 1, lights: !!(i & 1) }); if (!(i & 1)) p.beam = false; try { prebakeAsset(this.asset, p, i >= 4, q ? pri + 200 : pri); } catch (err) { }
    }
  }
  mk_(i) {
    const flip = i >= 4, p = Object.assign({}, this.params, { dir: i & 2 ? -1 : 1, lights: !!(i & 1) }); if (!(i & 1)) p.beam = false; let s = null;
    const rd = RIDERS[this.asset.id];
    try {
      if (rd && !this.stand) { // two-wheelers get a rider drawn on the seat
        if (!this.rider || this.riderKind !== this.kind) { this.rider = charArt().randomSpec(rnd, {}); this.rider.bag = null; if (rnd() < .7) { this.rider.hat = 'cap'; this.rider.hatColor = ['#d63a3a', '#2a2733', '#f2f2f2', '#3b5bdb', '#f2c230'][Math.floor(rnd() * 5)]; } this.riderKind = this.kind; }
        const a = this.asset, len = this.len, wid = this.wid, dirc = flip ? (p.dir > 0 ? 1 : 3) : (p.dir > 0 ? 0 : 2), sx = p.dir > 0 ? rd[0] : len - rd[0], spec = this.rider;
        let vb = [-3, -.6, 0, len + 3, wid + .6, 2.6]; if (flip) vb = [vb[1], vb[0], vb[2], vb[4], vb[3], vb[5]];
        s = toSprite(RA.render(RA.screenBox(vb), () => { a.draw(p); RA.at(sx, wid / 2, rd[1], () => charArt().drawChar(spec, { anim: 'sit', frame: 0, dir: dirc, seated: true, seatH: 5 })); }, null, 3, flip));
      } else s = assetSprite(this.asset, p, flip);
    } catch (err) { s = null; } if (!s) return null;
    const hx = (flip ? this.wid : this.len) / 2, hy = (flip ? this.len : this.wid) / 2;
    return { c: s.c, l: s.l, x: s.x - Math.round((hx - hy) * U), y: s.y - Math.round((hx + hy) * U / 2), w: s.w, h: s.h };
  }
}

/* ---------- junction boxes: who holds them, whose paths cross ---------- */
export function leaveNode(v) { const n = v.inNode; if (n) { const i = n.inn.indexOf(v); if (i >= 0) { n.inn[i] = n.inn[n.inn.length - 1]; n.inn.pop(); } n.occ = n.inn.length; v.inNode = null; v.nmk = -1; } }
function enterNode(v, n) { leaveNode(v); leaveAp(v); n.inn.push(v); n.occ = n.inn.length; v.inNode = n; v.nmk = v.mk; v.lw = 0; v.xw = 0; const a = v.e.axis === 'x' ? 0 : 1; if (n.cl[a] === v) n.cl[a] = null; }
/** movement key of a vehicle through its next node: entry edge + lane, exit edge + lane, long vehicle (bus / truck) or not */
const mkOf = (e, off, ne, noff, long) => ne ? (((e.id * 512 + ne.id) * 4) + (off === 3 ? 2 : 0) + (noff === 3 ? 1 : 0)) * 2 + (long ? 1 : 0) : -1;
const setMk = v => { v.mk = mkOf(v.e, v.off, v.ne, v.noff, v.len > 5); };
/** the ground a movement sweeps through node n, as lane centre lines from 1 before the box to 1 after it: [x0,y0, x1,y1] straight, or two legs [.., .., .., .., x2,y2, x3,y3] for a turn.
    A vehicle turns about its CENTRE (it is drawn along the old street until its centre reaches the new lane, then along the new one), so its nose overshoots the corner by half
    its length and its tail hangs back by as much: the legs are that much longer (h). null = U-turn (crosses everything). */
function pathOf(n, mk) {
  const E = T.edges, e = E[mk >>> 12], f = E[(mk >>> 3) & 511], le = e.c + e.ls * (mk & 4 ? 3 : 1), lf = f.c + f.ls * (mk & 2 ? 3 : 1), h = mk & 1 ? 4.1 : 1.9; if (f === e.rev) return null;
  if (e.axis === 'x') { const x0 = n.x - e.d * (n.hx + 1); return f.axis === 'x' ? [x0, le, n.x + e.d * (n.hx + 1), lf] : [x0, le, lf + e.d * h, le, lf, le - f.d * h, lf, n.y + f.d * (n.hy + 1)]; }
  const y0 = n.y - e.d * (n.hy + 1); return f.axis === 'y' ? [le, y0, lf, n.y + e.d * (n.hy + 1)] : [le, y0, le, lf + e.d * h, le - f.d * h, lf, n.x + f.d * (n.hx + 1), lf];
}
function ptSeg(px, py, ax, ay, bx, by) { const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy, t = l2 > 0 ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l2)) : 0; return Math.hypot(px - ax - t * dx, py - ay - t * dy); }
function segSeg(ax, ay, bx, by, cx, cy, dx, dy) {
  const o = (px, py, qx, qy, rx, ry) => (qx - px) * (ry - py) - (qy - py) * (rx - px), d1 = o(cx, cy, dx, dy, ax, ay), d2 = o(cx, cy, dx, dy, bx, by), d3 = o(ax, ay, bx, by, cx, cy), d4 = o(ax, ay, bx, by, dx, dy);
  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) return 0;
  return Math.min(ptSeg(ax, ay, cx, cy, dx, dy), ptSeg(bx, by, cx, cy, dx, dy), ptSeg(cx, cy, ax, ay, bx, by), ptSeg(dx, dy, ax, ay, bx, by));
}
/** do the sweeps of two movements through node n come closer than 1.5 (lanes are 2 apart)? Same entry lane = one queue, never a conflict (they follow each other). Cached per node. */
function conflict(n, a, b) {
  if (a === b || a < 0 || b < 0) return false; if ((a >>> 12) === (b >>> 12) && (a & 4) === (b & 4)) return false;
  const k = a < b ? a * 4194304 + b : b * 4194304 + a; let c = n.cf.get(k); if (c !== undefined) return c;
  const p = pathOf(n, a), q = pathOf(n, b); c = true;
  if (p && q) { let m = 1e9; for (let i = 0; i + 3 < p.length; i += 4) for (let j = 0; j + 3 < q.length; j += 4) m = Math.min(m, segSeg(p[i], p[i + 1], p[i + 2], p[i + 3], q[j], q[j + 1], q[j + 2], q[j + 3])); c = m < 1.5; }
  n.cf.set(k, c); return c;
}
/** right of way class of a movement: 3 straight, 2 right turn, 1 left turn, 0 U-turn (right-hand traffic: the right of +x is +y) */
function rank(e, f) { if (!f || f === e.rev) return 0; if (f.axis === e.axis) return 3; const cr = e.axis === 'x' ? e.d * f.d : -e.d * f.d; return cr > 0 ? 2 : 1; }
/** is there room on lane `foff` of exit edge f for v to clear node n (box + crosswalk) completely? Counts those already in the box heading for the same lane. */
function roomFor(v, n, f, foff) {
  const ax = f.axis === 'x', b0 = (ax ? n.x : n.y) + f.d * ((ax ? n.hx : n.hy) + TUNE.clearBox), lf = f.c + f.ls * foff, L = T.list; let free = 40, lv = 0, need = v.len + 1;   // lv: how far the last vehicle on that lane will still roll for sure
  for (let i = 0; i < L.length; i++) {
    const o = L[i]; if (o === v || o.e.axis !== f.axis) continue; const lo = ax ? o.y : o.x; if (Math.abs(lo - lf) > 1.2) continue; if (o.e !== f && o.e.d !== f.d) continue;
    if ((o.parked || o.halt) && o.curb >= .5 && o.v < .1) continue;   // at the kerb: driven round, does not fill the lane
    const al = ((ax ? o.x : o.y) - b0) * f.d - o.len / 2; if (al < -o.len - 3 || al > 40) continue; if (o.inNode === n && o.e !== f) continue;   // still on his way in: counted below
    if (al < free) { free = al; lv = (o.stop && o.stop.e === f) || o.halt || o.ln < 14 ? 0 : o.v; }   /* about to stop (its bus stop, its own stop line): no credit for its speed */
  }
  const I = n.inn; for (let i = 0; i < I.length; i++) { const o = I[i]; if (o !== v && o.e !== f && o.ne === f && o.noff === foff) need += o.len + o.gap; }
  return free + Math.min(lv, 6) * .6 >= need;
}
/** may v enter the box of n now? 0 yes, 1 the box is held by crossing traffic, 2 someone else's claim, 3 no room to leave it, 4 yield */
function canEnter(v, n, ror) {
  const I = n.inn, mk = v.mk; for (let i = 0; i < I.length; i++) { const o = I[i]; if (o !== v && conflict(n, mk, o.nmk)) return 1; }
  /* claims: one per street (x, y). Someone else's claim holds me back if his light is green and our paths cross; of two claims that cross each other the older one goes first */
  const ma = v.e.axis === 'x' ? 0 : 1, mine = n.cl[ma] === v;
  for (let a = 0; a < 2; a++) { const cl = n.cl[a]; if (!cl || cl === v) continue; if (T.time - n.clT[a] > .3 || !cl.active) { n.cl[a] = null; continue; }
    if (n.signal && (a === 0 ? n.gx : n.gy) !== 2) continue; if (mine && (n.clS[ma] < n.clS[a] || (n.clS[ma] === n.clS[a] && v.uid < cl.uid))) continue; if (conflict(n, mk, cl.mk)) return 2; }
  if (!roomFor(v, n, v.ne, v.noff)) {
    const f = v.ne; if (f.lanes > 1 && (!v.plan || v.bus) && !v.cornerOn && roomFor(v, n, f, 4 - v.noff) && !boxConflict(v, n, mkOf(v.e, v.off, f, 4 - v.noff, v.len > 5))) {   /* a bus too */ v.noff = 4 - v.noff; if (f.axis !== v.e.axis) v.turnS = f.c + f.ls * v.noff; setMk(v); return canEnter(v, n, ror); }   // the other lane of the exit has room: take that one
    return 3;
  }
  if (!ror && (mine || v.pre)) return 0;
  const A = n.ap, e = v.e, rk = rank(e, v.ne);
  for (let i = 0; i < A.length; i++) {
    const o = A[i]; if (o === v || o.e === e || o.inNode === n || !conflict(n, mk, o.mk)) continue;
    if (n.signal && (o.e.axis === 'x' ? n.gx : n.gy) !== 2) continue;   // he has a red (or amber) light
    if (ror) { if (o.ln < 4 + o.v * 2.6) return 4; continue; }   // turning right on red: give way to everyone who has a green and is near
    if (o.ln > 2 + o.v * TUNE.yieldTime || !(o.v > .8 || o.lw > v.lw + .5 || o.pre)) continue;   // not about to arrive / standing and has not waited longer than me
    const ro = o.pre ? 9 : rank(o.e, o.ne); if (ro > rk || (ro === rk && (o.e.w > e.w || (o.e.w === e.w && o.uid < v.uid)))) return 4;
  }
  return 0;
}
function boxConflict(v, n, mk) { const I = n.inn; for (let i = 0; i < I.length; i++) if (I[i] !== v && conflict(n, mk, I[i].nmk)) return true; return false; }

/* who is approaching which junction (node.ap): a vehicle joins the list of its next node when it is within 18 of the stop line and leaves it when it enters the box,
   halts, parks or is taken off the road (kept up to date as vehicles move: no pass over all vehicles every frame) */
export function leaveAp(v) { const n = v.apN; if (n) { const A = n.ap, i = A.indexOf(v); if (i >= 0) { A[i] = A[A.length - 1]; A.pop(); } v.apN = null; } }
/** take a vehicle out of every junction list (before it is released or put somewhere else) */
export function detach(v) { leaveNode(v); leaveAp(v); }

/** put a vehicle on a lane (resets turn state) */
export function place(v, e, off, s) {
  detach(v); v.e = e; v.off = off; v.s = s; v.lat = e.c + e.ls * (off + v.curb); v.cornerOn = false; v.bb = e.axis === 'x' ? v.bbX : v.bbY; v.pass = null; v.dg = 0; v.lw = 0; v.xw = 0;
  if (e.axis === 'x') { v.x = s; v.y = v.lat; } else { v.x = v.lat; v.y = s; } v.z = T.world.heightAt(v.x, v.y); chooseNext(v);
}
/** follow a route() result (or {edges, offs}) from index k. A route with an end (`to`) is remembered as the vehicle's destination, so it can be re-routed round a blocked street. */
export function setPlan(v, rt, k = 0, cyclic = false) { v.plan = rt ? rt.edges : null; v.offs = rt ? rt.offs : null; v.planI = k; v.cyclic = cyclic; v.dest = rt && rt.to && !cyclic ? rt.to : null; if (v.e) chooseNext(v); }

const usable = (f, e, n) => !(f === e.rev || (f.to.dead && n.out.length > 2) || (f.closed && !e.closed));   /* city events: a street closed for a parade is never entered (sim/cityevents.js) */
export function chooseNext(v) {
  const e = v.e, n = e.to; let ne = null, off = 1;
  if (v.plan) { let k = v.planI + 1; if (k >= v.plan.length && v.cyclic) k = 0; if (k < v.plan.length) { ne = v.plan[k]; off = v.offs ? v.offs[k] : 1; if (v.bus && v.off !== off && e.lanes > 1 && ne.lanes > 1 && ne.axis === e.axis) off = v.off; } }   /* a bus that is in the other lane stays in it straight on (no diagonal through the box); it moves over to the kerb lane on the street with its stop (step) */
  else {
    let tw = 0; const o = n.out; for (let i = 0; i < o.length; i++) { const f = o[i]; if (!usable(f, e, n)) continue; const w = f.axis === e.axis ? 3 : 1; tw += w; if (Math.random() * tw < w) ne = f; }
    if (!ne) ne = e.rev; off = ne.lanes > 1 ? (ne.axis === e.axis ? v.off : Math.random() < .5 ? 1 : 3) : 1;
  }
  setNext(v, ne, off);
}
function setNext(v, ne, off) { const e = v.e; v.ne = ne; v.noff = off; v.turnS = !ne ? 0 : ne.axis !== e.axis ? ne.c + ne.ls * off : ne === e.rev ? e.s1 - e.d * 3 : e.s1; setMk(v); }
/** an ambient vehicle standing at its line because its exit is full: take another exit that has room (re-plan round a blocked street) */
function pickExit(v, n) {
  const e = v.e, o = n.out; let best = null, bo = 1, tw = 0;
  for (let i = 0; i < o.length; i++) { const f = o[i]; if (f === v.ne || !usable(f, e, n)) continue; let off = f.lanes > 1 ? (f.axis === e.axis ? v.off : 1) : 1;
    if (!roomFor(v, n, f, off)) { if (f.lanes > 1 && roomFor(v, n, f, 4 - off)) off = 4 - off; else continue; }
    const w = f.axis === e.axis ? 3 : 1; tw += w; if (Math.random() * tw < w) { best = f; bo = off; } }
  if (!best) return false; setNext(v, best, bo); T.stats.replan++; return true;
}

function advance(v) {
  const e = v.e, ne = v.ne;
  if (ne.axis !== e.axis) { const ax = e.axis === 'x'; v.cx = ax ? v.turnS : v.lat; v.cy = ax ? v.lat : v.turnS; v.cax = e.axis; v.cd = e.d; v.cornerOn = true; const ns = v.lat; v.lat = v.turnS; v.s = ns; }
  v.e = ne; v.off = v.noff; if (v.plan) { v.planI++; if (v.planI >= v.plan.length) v.planI = v.cyclic ? 0 : v.plan.length - 1; }
  v.bb = ne.axis === 'x' ? v.bbX : v.bbY; v.pass = null; chooseNext(v);
}

/** two lanes each way: is the other lane free beside and behind v, and clearly better ahead than `adv`? */
function laneFree(v, off2, adv) {
  const e = v.e, ax = e.axis === 'x', d = e.d, lt = e.c + e.ls * off2, hl = v.len / 2, L = T.list; let ahead = 30;
  for (let i = 0; i < L.length; i++) {
    const o = L[i]; if (o === v) continue; const lo = ax ? o.y : o.x; if (Math.abs(lo - lt) > 1.3) continue; const al = ((ax ? o.x : o.y) - (ax ? v.x : v.y)) * d; if (al < -16 || al > 30) continue;
    const ohl = o.e.axis === e.axis ? o.len / 2 : o.wid / 2;
    if (al > -(hl + ohl + 1.2 + (o.parked ? 0 : o.v * .9)) && al < hl + ohl + 1.5) return false;
    if (al > 0 && al - hl - ohl < ahead) ahead = al - hl - ohl;
  }
  return ahead >= adv + 6;
}
/** one lane each way: may v overtake the stationary obstacle o through the oncoming lane? (clear oncoming lane for the whole manoeuvre, room to pull back in, not near the junction) */
function canPass(v, o, al) {
  const e = v.e, ax = e.axis === 'x', d = e.d, n = e.to, hl = v.len / 2, plen = al + o.len / 2 + hl + 3, tm = plen / 4 + 1, L = T.list, lr = e.c - e.ls, lm = e.c + e.ls;
  if ((e.s1 - d * ((ax ? n.hx : n.hy) + 6) - (v.s + d * plen)) * d < 0) return false;   // would end inside / at the junction
  for (let i = 0; i < n.inn.length; i++) if (n.inn[i].ne === e.rev) return false; for (let i = 0; i < n.ap.length; i++) if (n.ap[i].ne === e.rev && n.ap[i].ln < 8) return false;
  for (let i = 0; i < L.length; i++) {
    const u = L[i]; if (u === v || u === o) continue; const lo = ax ? u.y : u.x, au = ((ax ? u.x : u.y) - (ax ? v.x : v.y)) * d;
    if (Math.abs(lo - lr) < 1.5 && au > -5 && au < plen + (u.e === e.rev ? (u.v + 1.5) * tm : 0) + 5) return false;   // oncoming (or anything) in the other lane
    if (Math.abs(lo - lm) < 1.2 && au > al && au < al + o.len / 2 + v.len + 5) return false;   // no room to pull back in ahead of the obstacle
  }
  return true;
}

export function step(v, dt) {
  let e = v.e; const ax = e.axis === 'x', d = e.d, hl = v.len / 2, hw = v.wid / 2, L = T.list, multi = e.lanes > 1;
  let adv = v.halt ? 0 : 60, dodge = 0, byPlayer = false, lead = null, slowTo = 99; v.age += dt; if (v.lcT > 0) v.lcT -= dt;
  const ps = v.pass; if (ps && (!ps.active || ps.e.axis !== e.axis)) v.pass = null;
  const vx = v.x, vy = v.y, nL = L.length;
  for (let i = 0; i < nL; i++) {
    const o = L[i]; if (o === v) continue; const rx = o.x - vx, ry = o.y - vy, al = (ax ? rx : ry) * d; if (al < -6 || al > 26) continue;
    const la = Math.abs(ax ? ry : rx); if (la > 5.2) continue; const par = o.e.axis === e.axis; if (la > (par ? 2.4 : hw + o.len / 2 - .1)) continue; const ohl = par ? o.len / 2 : o.wid / 2;
    if (par && (o.parked || o.halt) && o.v < .1 && (o.curb >= .5 || o === v.pass)) {   // something standing at the kerb (a stand cab, a waiting cab), or the obstacle being overtaken: go round it
      /* on a road with two lanes each way the swerve takes part of the inside lane: only when nobody is beside or just behind there (else wait behind the parked car) */
      if (al > -hl - ohl - 1.5 && al < 10) { const need = o === v.pass ? 1.5 : .8; if (need > dodge && (!multi || v.off !== 3 || v.dg > .5 || laneFree(v, 1, -99))) dodge = need; } if (la < (o === v.pass ? 1.2 : 1) && al > 0 && v.gho <= 0) { const a2 = al - hl - ohl - .5; if (a2 < adv) adv = a2; } continue;
    }
    if (al <= .01 || v.gho > 0) continue; if (par && la > (o.dg > .5 && o.e.d === d ? 1.45 : 1.1)) continue;   /* someone swerving round a parked car ahead in the next lane is in my way too */
    const a2 = al - hl - ohl - v.gap; if (a2 < adv) { adv = a2; lead = o; }
  }
  /* blocked by something that is not going anywhere: change lane (two lanes each way) or overtake (one lane each way) */
  /* a bus that finds both berths of its stop taken (it is the third in line) does not queue for it: it skips that stop, unless the player is there (T.busSkip) */
  if (v.bus && lead && lead.bus && adv < 1 && lead.v < .5 && v.stuck > 1.2 && v.stop && v.stop.e === e && (v.stop.s - v.s) * d >= 12 && v.stop.id && (lead.bus.atStop === v.stop.id || (lead.stop && lead.stop.id === v.stop.id)) && T.busSkip) T.busSkip(v);
  if (lead && adv < 8 && !v.cornerOn && v.lcT <= 0 && lead.e.axis === e.axis && !(v.stop && v.stop.e === e) && (!v.bus || ((lead.parked || lead.halt) && lead.v < .1))) {
    const still = (lead.parked || lead.halt) && lead.v < .1, dead = still || (lead.v < .5 && lead.stuck > 1.5), slow = !dead && adv < 4 && lead.v < v.vmax * .55 && v.v <= lead.v + .6;
    if (multi) { if ((dead || slow) && v.inNode !== e.to && v.ln > 11 && (v.s - e.s0) * d > 8) { if (laneFree(v, 4 - v.off, adv)) { v.off = 4 - v.off; v.lcT = 2.5; if (v.ne && v.ne.axis === e.axis && v.ne.lanes > 1 && !v.plan) v.noff = v.off; setMk(v); T.stats.laneChange++; } else v.lcT = .35; } }
    else if (still && !v.pass && lead.stuck > TUNE.passAfter && adv < 3 && e.rev) { const al = ((ax ? lead.x - v.x : lead.y - v.y)) * d; if (canPass(v, lead, al)) { v.pass = lead; v.lcT = 1; T.stats.pass++; } else v.lcT = .35; }
  }
  if (v.pass && dodge < 1.5) { const o = v.pass, al = ((ax ? o.x - v.x : o.y - v.y)) * d; if (al < -(hl + o.len / 2 + .8) || al > 14) v.pass = null; else dodge = 1.5; }
  const P = T.peds;
  for (let i = 0, nP = P.length; i < nP; i++) {
    const p = P[i]; if (p.hidden) continue; const rx = p.x - vx, ry = p.y - vy, al = (ax ? rx : ry) * d; if (al <= 0 || al > hl + 6.5) continue; const lr = (ax ? ry : rx), la = lr < 0 ? -lr : lr; if (la > hw + .6) continue;
    /* someone STANDING at the kerb edge of the lane (waiting at a bus stop with their toes on the asphalt: QA round 14's bus pile-up): go round slowly instead of waiting for ever */
    if (!p.moving) { const side = ((ax ? p.y : p.x) - (e.c + e.ls * (v.off + v.curb))) * e.ls, need = hw + .4 - side; if (side >= .3 && need <= .8) { if (need > dodge) dodge = need; if (slowTo > 2.6) slowTo = 2.6; if (la >= hw + .28) continue; } }
    if (la > .98) continue;
    if (p.isPlayer) byPlayer = true; else if (v.pedWait > 5) continue; const a2 = al - hl - 1.1; if (a2 < adv) { adv = a2; lead = null; }
  }
  /* a bus in the other lane on the street with its stop moves over to the kerb lane as soon as there is a gap; if it cannot get in before the stop it leaves the stop out */
  if (v.bus && multi && v.stop && v.stop.e === e && v.plan && v.plan[v.planI] === e && v.offs && v.off !== v.offs[v.planI] && !v.cornerOn && v.inNode !== e.to) {
    const want = v.offs[v.planI]; if (v.lcT <= 0) { if (laneFree(v, want, -99)) { v.off = want; v.lcT = 1.5; setMk(v); T.stats.laneChange++; } else v.lcT = .25; }
    if (v.off !== want && (v.stop.s - v.s) * d < 5 && T.busSkip) T.busSkip(v);
  }
  /* lane discipline on a road with two lanes each way: get into the kerb lane to turn right and into the inside lane to turn left, so the two kinds of turn (and the
     traffic going straight on beside them) do not cross each other in the junction */
  else if (multi && !v.bus && v.ne && v.ne.axis !== e.axis && v.lcT <= 0 && !v.cornerOn && v.inNode !== e.to && v.ln > 5 && v.ln < 60 && !(v.stop && v.stop.e === e)) {
    const want = rank(e, v.ne) === 2 ? 3 : 1; if (v.off !== want) { if (laneFree(v, want, -99)) { v.off = want; v.lcT = 1.5; setMk(v); T.stats.laneChange++; } else v.lcT = .3; }
  }
  const st = v.stop; let dStop = 1e9; if (st && st.e === e) { dStop = (st.s - v.s) * d; if (dStop < -1.5) dStop = 0; if (dStop < adv) { adv = dStop; lead = null; } }
  /* the junction ahead: stop at the line unless the box can be taken (see the rules at the top) */
  const n = e.to;
  if (!n.dead && v.inNode !== n) {
    const line = (e.s1 - d * ((ax ? n.hx : n.hy) + 1.4) - v.s) * d - hl; v.ln = line;
    if (line <= -1) enterNode(v, n);
    else if (line < 16 && dStop >= line + hl) {
      if (v.pre && n.signal) { n.pre = e.axis; n.preT = T.time + 1.2; }
      const sg = !n.signal ? 2 : ax ? n.gx : n.gy; let go = sg === 2 || (sg === 1 && line < 1.2 && v.v > 3), why = 0;
      /* perf: the box is only asked for from where the vehicle has to decide (it can still stop from there), and a vehicle standing at the line that was refused asks again every other frame */
      if (go && v.gho <= 0 && line < 3 + v.v * v.v / 10) { why = v.v < .3 && v.why > 0 && v.why < 5 && (v.ck = !v.ck) ? v.why : canEnter(v, n, false); go = why === 0; }
      else if (sg === 0 && TUNE.rightOnRed && v.v < .3 && line < 1 && v.stuck > 1 && v.len < 5 && rank(e, v.ne) === 2 && v.gho <= 0) { go = canEnter(v, n, true) === 0; if (go && line < .5) T.stats.rightOnRed++; }   /* right turn on red, after a full stop, when nothing is coming */ v.why = go ? 0 : why || (sg === 2 ? 9 : 5);   // debug: why it is held at the line (1 box, 2 claim, 3 no exit room, 4 yield, 5 red light)
      if (!go) {
        if (line - .3 < adv) { adv = line - .3; lead = null; }
        const ca = ax ? 0 : 1; if (v.v < .3 && line < 2.5 && sg !== 2) { if (n.cl[ca] === v) n.clT[ca] = T.time; }   /* a claim is kept through the red: first in when the light changes */
        else if (v.v < .3 && line < 2.5) {
          if (why === 3) { v.xw += dt; if (n.cl[ca] === v) n.cl[ca] = null; if (v.bus && v.xw > 2 && v.stop && v.stop.e === v.ne && v.ne.lanes > 1 && T.busSkip && T.busSkip(v)) v.xw = 0;   /* its stop, just past the junction, is full: skip it and pass in the other lane */
            else if (v.xw > TUNE.replanAfter && !v.plan && !v.cornerOn) { if (pickExit(v, n)) v.xw = 0; else v.xw = TUNE.replanAfter - 1; } else if (v.xw > TUNE.rerouteAfter && v.dest && T.reroute) { v.xw = 0; T.reroute(v); } }
          else { v.lw += dt; if ((v.lw > TUNE.claimAfter || (v.stuck > 9 && v.lw > .4)) && (why === 1 || why === 4)) { if (!n.cl[ca]) { n.cl[ca] = v; n.clS[ca] = T.time; T.stats.claim++; } if (n.cl[ca] === v) n.clT[ca] = T.time; } }
        }
      } else if (line < .5 + v.v * v.v / 28) enterNode(v, n);
    }
  }
  if (n.dead || v.inNode === n) v.ln = 99; if (v.ln < 18 && !v.halt) { if (v.apN !== n) { leaveAp(v); n.ap.push(v); v.apN = n; } } else if (v.apN) leaveAp(v);
  let vm = v.vmax; if (v.cornerOn) vm = Math.min(vm, 5); else if (v.ne && v.ne.axis !== e.axis && (v.turnS - v.s) * d < 4) vm = Math.min(vm, 4.2); if (slowTo < vm) vm = slowTo; if (dodge > 1 && vm > 5) vm = 5;
  const tv = adv <= .02 ? 0 : Math.min(vm, Math.sqrt(14 * adv));
  if (tv > v.v) v.v = Math.min(tv, v.v + 4.5 * dt * v.acc); else v.v = Math.max(tv, v.v - 16 * dt);
  v.s += d * v.v * dt;
  if (v.v < .3) {
    v.stuck += dt; v.pedWait += dt;
    /* last resort (counted in T.stats; the rules above are meant to make it never fire): a ride / siren vehicle slips through after ghostPre s; anything else that has not
       moved for unstickAfter s is flagged for removal out of sight (traffic.js housekeeping), and only if it is still there in view after ghostAfter s is it let through */
    if (!v.halt && !byPlayer) {
      if (v.pre) { if (v.stuck > TUNE.ghostPre) { v.gho = 4; v.stuck = 0; T.stats.ghostPre++; } }
      else if (v.stuck > TUNE.unstickAfter) { v.unstick = true; if (v.stuck > TUNE.ghostAfter) { v.gho = 4; v.stuck = 0; T.stats.ghost++; } }
    }
  } else { v.stuck = 0; v.unstick = false; if (v.gho > 0) v.gho -= dt; if (v.v > 2) v.pedWait = 0; }
  v.byPlayer = byPlayer;
  if (byPlayer && v.v < .3) { v.honk -= dt; if (v.honk <= 0 && T.time > T.honkAt) { v.honk = 3 + Math.random() * 4; T.honkAt = T.time + 2.5; if (T.sfx) T.sfx('honk'); } }
  /* a bus that the player (standing in the road at the stop) keeps from reaching its stop point opens its doors where it is */
  /* ... and a bus that pulls up right behind a bus loading at the same stop loads there too (a second berth), instead of waiting its turn */
  if (st && st.e === e && (dStop < .25 || (v.bus && dStop < 12 && ((byPlayer && dStop < 9 && v.stuck > 1.5) || (lead && adv < .6 && lead.halt && lead.bus && st.id && lead.bus.atStop === st.id)))) && v.v < .6) { v.v = 0; v.stop = null; const f = v.onStop; v.onStop = null; if (f) f(v); if (v.e !== e) return; }
  if (v.ne) { if ((v.turnS - v.s) * d <= 0) { advance(v); e = v.e; } }
  else if (!v.stop && !v.halt) { v.plan = null; chooseNext(v); }
  /* kerb: a bus pulls in at its stop, a halted cab pulls right over (stand cabs keep the curb they were given) */
  if (!v.stand) { const kt = v.bus ? (v.halt || (st && dStop < 9) ? TUNE.busKerb : 0) : v.halt ? TUNE.cabKerb : 0, dk = kt - v.curb, mk = .9 * dt; v.curb += dk > mk ? mk : dk < -mk ? -mk : dk; }
  // lateral ease + display position
  v.dg = dodge; if (dodge > 0 && dodge < 1.5 && slowTo < 99) T.stats.squeeze += dt;
  const x2 = e.axis === 'x', d2 = e.d, lt = e.c + e.ls * (v.off + v.curb - dodge), dl = lt - v.lat, ml = 2.2 * dt; v.lat += dl > ml ? ml : dl < -ml ? -ml : dl;
  let x = x2 ? v.s : v.lat, y = x2 ? v.lat : v.s;
  if (v.cornerOn) {
    const df = (x2 ? x - v.cx : y - v.cy) * d2;
    if (df >= R) v.cornerOn = false;
    else { const th = (.5 + df / (2 * R)) * HP, ka = R * (Math.sin(th) - 1) * v.cd, kb = R * (1 - Math.cos(th)) * d2; x = v.cx; y = v.cy; if (v.cax === 'x') x += ka; else y += ka; if (x2) x += kb; else y += kb; }
  } else if (v.ne && v.ne.axis !== e.axis) {
    const dc = (v.turnS - v.s) * d2;
    if (dc < R) { const th = ((R - dc) / (2 * R)) * HP, ka = R * (Math.sin(th) - 1) * d2, kb = R * (1 - Math.cos(th)) * v.ne.d; x = x2 ? v.turnS : v.lat; y = x2 ? v.lat : v.turnS; if (x2) { x += ka; y += kb; } else { y += ka; x += kb; } }
  }
  v.x = x; v.y = y; v.z = T.world.heightAt(x, y);
  const m = v.inNode; if (m && m !== e.to) { const dn = Math.abs(x2 ? x - m.x : y - m.y); if (dn > (x2 ? m.hx : m.hy) + hl + .4) leaveNode(v); }
}
