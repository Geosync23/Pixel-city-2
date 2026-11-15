// Vehicle entity + lane-following kinematics (private helper of sim/traffic.js).
// A vehicle sits on a directed edge `e` in lane `off` at coordinate `s` (along the edge axis) with lateral coordinate `lat`;
// `ne` is the edge it takes at the next node. Display position rounds perpendicular turns with a quarter arc.
import { U } from '../engine/raster.js';
import * as RA from '../engine/raster.js';
import { assetSprite, toSprite, prebakeAsset } from '../engine/sprites.js';
import { charArt } from '../core/char.js';
let RSEED = 97; const rnd = () => (RSEED = (RSEED * 16807) % 2147483647) / 2147483647;
const RIDERS = { 'veh.scooter': [.62, .52], 'veh.motorbike': [.8, .6], 'veh.bicycle': [.7, .62] }; // seat x (from the rear, local), seat height
import { ASSETS, assetSize } from '../art/registry.js';

/** shared sim context */
export const T = { list: [], peds: [], time: 0, lit: false, world: null, honkAt: 0, sfx: null };
const R = 1.3, HP = Math.PI / 2;

export class Veh {
  constructor() {
    this.x = 0; this.y = 0; this.z = 0; this.isVehicle = true; this.hidden = true; this.active = false; this.spr = new Array(8); this.bbX = [0, 0, 0, 0, 1]; this.bbY = [0, 0, 0, 0, 1]; this.bb = this.bbX;
    this.e = null; this.ne = null; this.reset();
  }
  reset() {
    this.v = 0; this.off = 1; this.noff = 1; this.s = 0; this.lat = 0; this.turnS = 0; this.inNode = null; this.cornerOn = false; this.cx = 0; this.cy = 0; this.cax = 'x'; this.cd = 1;
    this.plan = null; this.offs = null; this.planI = 0; this.cyclic = false; this.stop = null; this.onStop = null; this.halt = false; this.parked = false; this.curb = 0; this.keep = false; this.pre = false;
    this.stuck = 0; this.gho = 0; this.ghost = false; this.pedWait = 0; this.honk = 1; this.byPlayer = false; this.bus = null; this.stand = null; this.taxiFree = false; this.role = ''; this.acc = 1; this.gap = 1.3; this.age = 0; this.ride = false; this.leadFast = false;
  }
  /** kind: { id, asset, vmax }, params: art params (color, route, free...) */
  setKind(kind, params) {
    this.kind = kind.id; this.asset = ASSETS.get(kind.asset); this.params = params || {}; const sz = assetSize(this.asset, this.params); this.len = sz[0]; this.wid = sz[1]; this.h = sz[2]; this.vmax = kind.vmax; this.vbase = kind.vmax;
    const a = this.len / 2, b = this.wid / 2; this.bbX[0] = -a; this.bbX[1] = -b; this.bbX[2] = a; this.bbX[3] = b; this.bbX[4] = this.h; this.bbY[0] = -b; this.bbY[1] = -a; this.bbY[2] = b; this.bbY[3] = a; this.bbY[4] = this.h; this.spr.fill(undefined);
    this.gap = this.len > 5 ? 1.8 : 1.3; this.acc = this.len > 5 ? .7 : 1;
  }
  setParams(p) { this.params = Object.assign({}, this.params, p); this.spr.fill(undefined); }
  sprite() { const e = this.e; if (!e) return null; const i = (e.axis === 'y' ? 4 : 0) + (e.d < 0 ? 2 : 0) + (T.lit && !this.stand ? 1 : 0); let s = this.spr[i]; if (s === undefined) s = this.spr[i] = this.mk(i); return s; }
  /** perf: called by the renderer while this vehicle is just off screen: have its sprite baked ahead (same asset, params and key as mk() below; two-wheelers with a rider are drawn on demand as before) */
  prebake(pri, all) {
    const e = this.e; if (!e || !this.asset || (RIDERS[this.asset.id] && !this.stand)) return; const i0 = (e.axis === 'y' ? 4 : 0) + (e.d < 0 ? 2 : 0) + (T.lit && !this.stand ? 1 : 0);
    for (let q = 0; q < (all ? 4 : 1); q++) {   // all: the four headings too (a vehicle that turns in view), a little later than the one it shows now
      const i = q ? (i0 & 1) + q * 2 : i0; if ((q && i === i0) || this.spr[i] !== undefined) continue;
      const p = Object.assign({}, this.params, { dir: i & 2 ? -1 : 1, lights: !!(i & 1) }); if (!(i & 1)) p.beam = false; try { prebakeAsset(this.asset, p, i >= 4, q ? pri + 200 : pri); } catch (err) { }
    }
  }
  mk(i) {
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

export function leaveNode(v) { const n = v.inNode; if (n) { n.occ = Math.max(0, n.occ - 1); if (!n.occ) n.occX = false; v.inNode = null; } }

/** put a vehicle on a lane (resets turn state) */
export function place(v, e, off, s) {
  leaveNode(v); v.e = e; v.off = off; v.s = s; v.lat = e.c + e.ls * (off + v.curb); v.cornerOn = false; v.bb = e.axis === 'x' ? v.bbX : v.bbY;
  if (e.axis === 'x') { v.x = s; v.y = v.lat; } else { v.x = v.lat; v.y = s; } v.z = T.world.heightAt(v.x, v.y); chooseNext(v);
}
/** follow a route() result (or {edges, offs}) from index k */
export function setPlan(v, rt, k = 0, cyclic = false) { v.plan = rt ? rt.edges : null; v.offs = rt ? rt.offs : null; v.planI = k; v.cyclic = cyclic; if (v.e) chooseNext(v); }

export function chooseNext(v) {
  const e = v.e, n = e.to; let ne = null, off = 1;
  if (v.plan) { let k = v.planI + 1; if (k >= v.plan.length && v.cyclic) k = 0; if (k < v.plan.length) { ne = v.plan[k]; off = v.offs ? v.offs[k] : 1; } }
  else {
    let tw = 0; const o = n.out; for (let i = 0; i < o.length; i++) { const f = o[i]; if (f === e.rev || (f.to.dead && o.length > 2) || (f.closed && !e.closed) /* city events: a street closed for a parade is never entered (sim/cityevents.js) */) continue; const w = f.axis === e.axis ? 3 : 1; tw += w; if (Math.random() * tw < w) ne = f; }
    if (!ne) ne = e.rev; off = ne.lanes > 1 ? (ne.axis === e.axis ? v.off : Math.random() < .5 ? 1 : 3) : 1;
  }
  v.ne = ne; v.noff = off; v.turnS = !ne ? 0 : ne.axis !== e.axis ? ne.c + ne.ls * off : ne === e.rev ? e.s1 - e.d * 3 : e.s1;
}

function advance(v) {
  const e = v.e, ne = v.ne;
  if (ne.axis !== e.axis) { const ax = e.axis === 'x'; v.cx = ax ? v.turnS : v.lat; v.cy = ax ? v.lat : v.turnS; v.cax = e.axis; v.cd = e.d; v.cornerOn = true; const ns = v.lat; v.lat = v.turnS; v.s = ns; }
  v.e = ne; v.off = v.noff; if (v.plan) { v.planI++; if (v.planI >= v.plan.length) v.planI = v.cyclic ? 0 : v.plan.length - 1; }
  v.bb = ne.axis === 'x' ? v.bbX : v.bbY; chooseNext(v);
}

export function step(v, dt) {
  let e = v.e; const ax = e.axis === 'x', d = e.d, hl = v.len / 2, L = T.list;
  let adv = v.halt ? 0 : 60, dodge = 0, byPlayer = false; v.age += dt;
  for (let i = 0; i < L.length; i++) {
    const o = L[i]; if (o === v) continue; const rx = o.x - v.x, ry = o.y - v.y, al = (ax ? rx : ry) * d; if (al < -6 || al > 24) continue;
    const la = Math.abs(ax ? ry : rx); if (la > 2.4) continue; const ohl = o.e.axis === e.axis ? o.len / 2 : o.wid / 2;
    if (o.parked) { if (al > -hl - ohl - 1.5 && al < 10) dodge = 1; if (la < 1 && al > 0 && v.gho <= 0) adv = Math.min(adv, al - hl - ohl - .5); continue; }
    if (al <= .01 || la > 1.1 || v.gho > 0) continue;
    adv = Math.min(adv, al - hl - ohl - v.gap);
  }
  const P = T.peds;
  for (let i = 0; i < P.length; i++) {
    const p = P[i]; if (p.hidden) continue; const rx = p.x - v.x, ry = p.y - v.y, al = (ax ? rx : ry) * d; if (al <= 0 || al > hl + 6.5) continue; if (Math.abs(ax ? ry : rx) > .98) continue;
    if (p.isPlayer) byPlayer = true; else if (v.pedWait > 5) continue; adv = Math.min(adv, al - hl - 1.1);
  }
  const st = v.stop; let dStop = 1e9; if (st && st.e === e) { dStop = (st.s - v.s) * d; if (dStop < -1.5) dStop = 0; adv = Math.min(adv, dStop); }
  const n = e.to;
  if (!n.dead && v.inNode !== n) {
    const line = (e.s1 - d * ((ax ? n.hx : n.hy) + 1.4) - v.s) * d - hl;
    if (line <= -1) { leaveNode(v); if (!n.occ) n.occT = T.time; n.occ++; v.inNode = n; }
    else if (line < 16 && dStop >= line + hl) {
      if (v.pre && n.signal) { n.pre = e.axis; n.preT = T.time + 1.2; }
      const sg = !n.signal ? 2 : ax ? n.gx : n.gy, turn = !!v.ne && v.ne.axis !== e.axis;
      let go = sg === 2 || (sg === 1 && line < 1.2 && v.v > 3);
      if (go && !(n.occ === 0 || (!n.occX && !turn && n.occAx === e.axis))) go = v.gho > 0 || T.time - n.occT > 9;
      if (!go) adv = Math.min(adv, line - .3); else if (line < 1) { leaveNode(v); if (!n.occ) n.occT = T.time; n.occ++; n.occAx = e.axis; if (turn) n.occX = true; v.inNode = n; }
    }
  }
  let vm = v.vmax; if (v.cornerOn) vm = Math.min(vm, 5); else if (v.ne && v.ne.axis !== e.axis && (v.turnS - v.s) * d < 4) vm = Math.min(vm, 4.2);
  const tv = adv <= .02 ? 0 : Math.min(vm, Math.sqrt(14 * adv));
  if (tv > v.v) v.v = Math.min(tv, v.v + 4.5 * dt * v.acc); else v.v = Math.max(tv, v.v - 16 * dt);
  v.s += d * v.v * dt;
  if (v.v < .3) { v.stuck += dt; v.pedWait += dt; if (v.stuck > (v.pre ? 7 : 22) && !v.halt && !byPlayer) { v.gho = 4; v.stuck = 0; } } else { v.stuck = 0; if (v.gho > 0) v.gho -= dt; if (v.v > 2) v.pedWait = 0; }
  v.byPlayer = byPlayer;
  if (byPlayer && v.v < .3) { v.honk -= dt; if (v.honk <= 0 && T.time > T.honkAt) { v.honk = 3 + Math.random() * 4; T.honkAt = T.time + 2.5; if (T.sfx) T.sfx('honk'); } }
  if (st && st.e === e && dStop < .25 && v.v < .6) { v.v = 0; v.stop = null; const f = v.onStop; v.onStop = null; if (f) f(v); if (v.e !== e) return; }
  if (v.ne) { if ((v.turnS - v.s) * d <= 0) { advance(v); e = v.e; } }
  else if (!v.stop && !v.halt) { v.plan = null; chooseNext(v); }
  // lateral ease + display position
  const x2 = e.axis === 'x', d2 = e.d, lt = e.c + e.ls * (v.off + v.curb - dodge * .8), dl = lt - v.lat, ml = 2.2 * dt; v.lat += dl > ml ? ml : dl < -ml ? -ml : dl;
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
