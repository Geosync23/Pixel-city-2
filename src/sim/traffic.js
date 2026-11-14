// Traffic: road graph, traffic signals, ambient vehicles around the camera, the real buses on world.busRoutes, cabs waiting at taxi stands.
// Gameplay (taxi rides, bus stops, fares) lives in sim/transit.js. Kinematics in _traffic_veh.js, graph/routing in _traffic_graph.js.
//
// G.traffic
//   graph                       road graph (see _traffic_graph.js): nodes, edges, nearestLane(x,y), route(a,b), routePts(p,q), lanePos, span
//   vehicles                    active Veh entities (also in the city scene's ents; pooled, `isVehicle: true`)
//   spawn(kindId, laneRef, opts) -> Veh | null     kinds: sedan hatch suv sports beetle pickup van delivery icecream scooter motorbike taxi police ambulance truck garbage fire bus
//        opts are copied onto the vehicle (keep: never auto-despawn, role, parked, curb, pre: pre-empts signals, params: art params)
//   release(veh), place(veh, e, off, s), setPlan(veh, route), offscreenLane(nearRef, minD, maxD) -> laneRef for spawning out of view
//   buses: [{ id, route, loop, u, veh|null, atStop, dwell, hold, nsi }], loops: { busN: { route, edges, offs, L, stops:[{id, poi, k, s, u}] } }
//   nextBuses(stopId) -> [{ bus, route (id), num, name, color, minutes }] sorted;  busStopName(id);  BUS_SPEED
//   stands: [{ poi, ref, cabs }]   count() -> active vehicles   offroad() -> vehicles whose centre is not on asphalt (debug)   simR, target (debug)
// Events: 'bus:arrive'(bus, stopId) when a real (on-screen-range) bus starts its dwell, 'bus:depart'(bus, stopId).
// Exports: roadGraph() and route(fromPoint, toPoint) -> { edges, offs, len, pts } (DOM-free; usable by the train/minimap programmers).
import { G } from '../core/game.js';
import { U, ENV } from '../engine/raster.js';
import { GT } from '../engine/world.js';
import { ASSETS } from '../art/registry.js';
import { getCity } from '../world/_city.js';
import { buildGraph } from './_traffic_graph.js';
import { T, Veh, step, place, setPlan, leaveNode } from './_traffic_veh.js';

export const order = 60;
let graph = null, world = null, C = null, ready = false;
export function roadGraph() { if (!graph) { world = getCity(); graph = buildGraph(world); } return graph; }
/** lane waypoint route between two points {x,y}: { edges, offs, len, pts:[[x,y]..] } | null */
export function route(from, to) { return roadGraph().routePts(from, to); }

const CAP = 40, DWELL = 5;
export const BUS_SPEED = 6; // abstract (off-screen) bus speed, world units per game minute
const KD = { sedan: ['veh.car.sedan', 6.6, 1], hatch: ['veh.car.hatch', 6.4, 1], suv: ['veh.car.suv', 6.4, 1], sports: ['veh.car.sports', 7.6, 1], beetle: ['veh.car.beetle', 6, 1], pickup: ['veh.car.pickup', 6.2, 1],
  van: ['veh.van', 6, 1], delivery: ['veh.van.delivery', 6, 0], icecream: ['veh.van.icecream', 3.6, 0], scooter: ['veh.scooter', 5.4, 1], motorbike: ['veh.motorbike', 7.4, 1], taxi: ['veh.taxi', 6.8, 0],
  police: ['veh.police', 7, 0], ambulance: ['veh.ambulance', 7, 0], truck: ['veh.truck.box', 5.6, 0], garbage: ['veh.truck.garbage', 4, 0], fire: ['veh.truck.fire', 6.5, 0], bus: ['veh.bus', 6.4, 0] };
const KINDS = {}; for (const k in KD) KINDS[k] = { id: k, asset: KD[k][0], vmax: KD[k][1], color: !!KD[k][2] };
const COLORS = ['#c9382e', '#2f6fb5', '#e8e4d8', '#3a3d4a', '#8a8f98', '#2f8f6a', '#e0a030', '#7a4fa0', '#d8d8de', '#1f6f7f', '#b5562f', '#e9b8c4', '#4a5a8a', '#6b7f3a'];
const BASE = { sedan: 5, hatch: 4, suv: 3, sports: 1, beetle: 1.5, pickup: 1.5, van: 1, delivery: 1, scooter: .9, motorbike: .6, taxi: 1.7, truck: .6, police: .25, ambulance: .1, fire: .04 };
const DMUL = { downtown: { taxi: 3, sports: 2, truck: .5 }, railyard: { delivery: 3, truck: 5, pickup: 2, taxi: .4, sports: .3 }, harbor: { delivery: 2.5, truck: 3.5, pickup: 2 }, maplewood: { taxi: .4, truck: .2, suv: 1.6, beetle: 1.5 },
  hillcrest: { taxi: .5, truck: .1, sports: 2.5, suv: 2 }, airport: { taxi: 4, van: 2 }, arts: { scooter: 2.5, beetle: 2 }, oldtown: { scooter: 2, truck: .4 }, park: {} };
const DDENS = { downtown: 1, oldtown: .7, harbor: .6, hillcrest: .3, maplewood: .36, arts: .7, railyard: .6, park: .5, airport: .6 };
const timeF = h => h < 5 ? .07 : h < 7 ? .07 + (h - 5) * .4 : h < 9.5 ? 1 : h < 16 ? .62 : h < 19 ? 1 : h < 22 ? .5 : .2;

const all = [], free = [], near = []; let nearW = 0, simR = 40, target = 0, refill = true, fx = 0, fy = 0, lfx = -999, lfy = -999, tA = 0, tB = 0, tP = 0;
const buses = [], loops = {}, stands = [], sigNodes = [], SN = ['red', 'amber', 'green'], tmp = {};

function onScreen(x, y, m) { const sx = (x - y) * U - G.cam.x, sy = (x + y) * U / 2 - world.heightAt(x, y) * U - G.cam.y; return sx > -m && sx < G.W + m && sy > -m && sy < G.H + m + 30; }
function countKind(k) { let n = 0; for (const v of T.list) if (v.kind === k) n++; return n; }
function pickKind(dk, h, season) {
  const mul = DMUL[dk] || DMUL.park; let tw = 0, pick = 'sedan';
  for (const k in BASE) { const w = BASE[k] * (mul[k] === undefined ? 1 : mul[k]); tw += w; if (Math.random() * tw < w) pick = k; }
  if (h >= 6 && h < 9.5 && !countKind('garbage')) { tw += .6; if (Math.random() * tw < .6) pick = 'garbage'; }
  if (season === 1 && h >= 12.5 && h < 18 && (dk === 'maplewood' || dk === 'park') && !countKind('icecream')) { tw += 2.5; if (Math.random() * tw < 2.5) pick = 'icecream'; }
  return KINDS[pick].ok ? pick : 'sedan';
}
function spawn(kindId, ref, opts) {
  const k = KINDS[kindId]; if (!k || !k.ok || !ref || !C) return null; let v = free.pop(); if (!v) { v = new Veh(); all.push(v); C.ents.push(v); }
  v.reset(); const params = (opts && opts.params) || {}; if (k.color && !params.color) params.color = COLORS[Math.floor(Math.random() * COLORS.length)];
  v.setKind(k, params); if (opts) for (const key in opts) if (key !== 'params') v[key] = opts[key];
  v.active = true; v.hidden = false; place(v, ref.e, ref.off || 1, ref.s); T.list.push(v); return v;
}
function release(v) {
  const i = T.list.indexOf(v); if (i < 0) return; T.list[i] = T.list[T.list.length - 1]; T.list.pop(); leaveNode(v);
  if (v.stand) { const j = v.stand.cabs.indexOf(v); if (j >= 0) v.stand.cabs.splice(j, 1); } if (v.bus) v.bus.veh = null;
  v.reset(); v.active = false; v.hidden = true; free.push(v);
}
function clearLane(x, y, r) { for (const o of T.list) if (Math.abs(o.x - x) < r && Math.abs(o.y - y) < r) return false; return true; }
function trySpawn(prefill, h) {
  if (nearW <= 0) return false; const p = G.player;
  for (let t = 0; t < 8; t++) {
    let r = Math.random() * nearW, e = near[0]; for (let i = 0; i < near.length; i++) { e = near[i]; r -= e.w * Math.min(e.len, 60); if (r <= 0) break; }
    const sp = graph.span(e), s = sp[0] + (sp[1] - sp[0]) * Math.random(), off = e.lanes > 1 && Math.random() < .5 ? 3 : 1, q = graph.lanePos(e, off, s, tmp), dx = fx - q.x, dy = fy - q.y;
    if (dx * dx + dy * dy > simR * simR) continue;
    if (!prefill) { if (onScreen(q.x, q.y, 80)) continue; if ((e.axis === 'x' ? dx : dy) * e.d < 0 && Math.random() < .85) continue; }
    if (!p.hidden && Math.abs(p.x - q.x) < 8 && Math.abs(p.y - q.y) < 8) continue; if (!clearLane(q.x, q.y, 7)) continue;
    const kind = pickKind(world.districtAt(q.x, q.y), h, ENV.season), o = {};
    if (kind === 'taxi') { o.taxiFree = Math.random() < .65; o.params = { free: o.taxiFree }; }
    else if (kind === 'police') { const sr = Math.random() < .3; o.params = { siren: sr }; o.pre = sr; }
    else if (kind === 'ambulance') { const sr = Math.random() < .5; o.params = { siren: sr }; o.pre = sr; }
    const v = spawn(kind, q, o); if (!v) return false; if (v.pre) v.vmax = 9; v.v = v.vmax * (prefill ? .5 : .8); return true;
  }
  return false;
}

/* ---------- signals ---------- */
function setLight(ob, st) { const name = SN[st]; if (ob.p && ob.p.state === name) return; ob.p = Object.assign({}, ob.p, { state: name }); ob._key = undefined; }
function signals() {
  const t = T.time;
  for (let i = 0; i < sigNodes.length; i++) {
    const n = sigNodes[i]; let gx, gy;
    if (n.pre && n.preT > t) { gx = n.pre === 'x' ? 2 : 0; gy = 2 - gx; }
    else { n.pre = ''; const ph = (t + n.phase) % 19.2; if (ph < 8) { gx = 2; gy = 0; } else if (ph < 9.6) { gx = 1; gy = 0; } else if (ph < 17.6) { gx = 0; gy = 2; } else { gx = 0; gy = 1; } }
    if (gx !== n.gx || gy !== n.gy) { n.gx = gx; n.gy = gy; for (const ob of n.lights) setLight(ob, ob.flip ? gx : gy); }
  }
}

/* ---------- buses ---------- */
function buildLoops() {
  const pois = new Map(world.pois.map(p => [p.id, p]));
  for (const r of world.busRoutes || []) {
    const sp = r.stops.map(id => pois.get(id)).filter(p => p && p.lane), refs = sp.map(p => graph.nearestLane(p.lane.x, p.lane.y)), n = sp.length; if (n < 2) continue;
    const edges = [], stops = []; let ok = true;
    for (let i = 0; i < n && ok; i++) {
      const rt = graph.route(refs[i], refs[(i + 1) % n]); if (!rt) { ok = false; break; }
      if (!edges.length) edges.push(rt.edges[0]); stops.push({ id: sp[i].id, poi: sp[i], k: edges.length - 1, s: refs[i].s, u: 0 });
      for (let j = 1; j < rt.edges.length; j++) edges.push(rt.edges[j]);
    }
    if (!ok) continue; if (edges.length > 1 && edges[edges.length - 1] === edges[0]) edges.pop();
    const m = edges.length, offs = edges.map(e => e.lanes > 1 ? 3 : 1), sA = [], cum = []; let L = 0;
    for (let k = 0; k < m; k++) {
      const e = edges[k], pv = edges[(k + m - 1) % m], nx = edges[(k + 1) % m];
      const a = pv.axis !== e.axis ? graph.laneCoord(pv, offs[(k + m - 1) % m]) : e.s0, b = nx.axis !== e.axis ? graph.laneCoord(nx, offs[(k + 1) % m]) : e.s1;
      sA.push(a); cum.push(L); L += Math.max(.1, (b - a) * e.d);
    }
    for (const s of stops) s.u = cum[s.k] + Math.max(0, (s.s - sA[s.k]) * edges[s.k].d);
    const num = (r.name.match(/^\s*(\w+)/) || [0, r.id])[1], dest = r.name.replace(/^\s*\w+\s*/, '').split(' - ')[0].toUpperCase().slice(0, 12);
    const loop = loops[r.id] = { route: r, edges, offs, sA, cum, L, stops, num, dest };
    for (let b = 0; b < 2; b++) { const u = (L * (b / 2 + .13 * buses.length)) % L; let nsi = 0; while (nsi < stops.length && stops[nsi].u < u) nsi++; buses.push({ id: r.id + ':' + b, route: r.id, loop, u, veh: null, atStop: null, dwell: 0, hold: false, nsi: nsi % stops.length }); }
  }
}
function loopAt(loop, u, out) { let k = loop.cum.length - 1; while (k > 0 && loop.cum[k] > u) k--; const e = loop.edges[k]; return graph.lanePos(e, loop.offs[k], loop.sA[k] + e.d * (u - loop.cum[k]), out); }
function busU(b) { const v = b.veh, l = b.loop; if (!v) return b.u; const k = v.planI, e = l.edges[k]; if (v.e !== e) return b.u; const len = (k + 1 < l.cum.length ? l.cum[k + 1] : l.L) - l.cum[k]; return b.u = l.cum[k] + Math.max(0, Math.min(len, (v.s - l.sA[k]) * e.d)); }
function busTarget(b) { const s = b.loop.stops[b.nsi], v = b.veh; v.stop = { e: b.loop.edges[s.k], s: s.s }; v.onStop = busArrive; }
function busArrive(v) { const b = v.bus; if (!b) return; const s = b.loop.stops[b.nsi]; b.atStop = s.id; b.dwell = DWELL; v.halt = true; G.emit('bus:arrive', b, s.id); }
function busDepart(b) { const id = b.atStop; b.atStop = null; b.dwell = 0; b.nsi = (b.nsi + 1) % b.loop.stops.length; if (b.veh) { b.veh.halt = false; busTarget(b); } G.emit('bus:depart', b, id); }
function busAbstract(b, gm) {
  if (b.atStop) { if (!b.hold) b.dwell -= gm; if (b.dwell <= 0) busDepart(b); return; }
  const l = b.loop, s = l.stops[b.nsi], du = (s.u - b.u + l.L) % l.L, mv = BUS_SPEED * gm;
  if (mv >= du) { b.u = s.u; b.atStop = s.id; b.dwell = DWELL; } else b.u = (b.u + mv) % l.L;
}
function busReal(b) {
  const l = b.loop, q = loopAt(l, b.u, tmp), k = l.edges.indexOf(q.e) >= 0 ? (() => { let i = l.cum.length - 1; while (i > 0 && l.cum[i] > b.u) i--; return i; })() : 0;
  const v = spawn('bus', q, { keep: true, role: 'bus', bus: b, params: { route: l.num, dest: l.dest, color: l.route.color } }); if (!v) return;
  b.veh = v; setPlan(v, l, k, true); v.v = b.atStop ? 0 : v.vmax * .7; if (b.atStop) v.halt = true; else busTarget(b);
}
function nextBuses(stopId) {
  const out = [];
  for (const b of buses) {
    const l = b.loop, si = l.stops.findIndex(s => s.id === stopId); if (si < 0) continue; const u = busU(b); let min;
    if (b.atStop === stopId) min = 0; else { const du = (l.stops[si].u - u + l.L) % l.L; let between = 0; for (const s of l.stops) { const d2 = (s.u - u + l.L) % l.L; if (d2 < du - .5 && s.id !== b.atStop) between++; } min = du / BUS_SPEED + between * DWELL + (b.atStop ? Math.max(0, b.dwell) : 0); }
    out.push({ bus: b, route: b.route, num: l.num, name: l.route.name, color: l.route.color, minutes: Math.ceil(min) });
  }
  return out.sort((a, b) => a.minutes - b.minutes);
}

/* ---------- housekeeping (a few times per second) ---------- */
function rebuildNear() {
  near.length = 0; nearW = 0;
  for (const e of graph.edges) { const ax = e.axis === 'x', lo = Math.min(e.s0, e.s1), hi = Math.max(e.s0, e.s1), a = ax ? fx : fy, dA = a < lo ? lo - a : a > hi ? a - hi : 0, dC = Math.abs((ax ? fy : fx) - e.c); if (dA * dA + dC * dC < simR * simR) { near.push(e); nearW += e.w * Math.min(e.len, 60); } }
  const h = G.now().hf, cf = G.weather && G.weather.crowdFactor ? G.weather.crowdFactor() : undefined, dk = world.districtAt(fx, fy);
  target = Math.min(CAP, Math.round(26 * Math.pow(simR / 40, 1.4) * (DDENS[dk] || .5) * timeF(h) * (cf === undefined ? 1 : .5 + .6 * cf)));
  if (target < 1 && timeF(h) > .05 && Math.random() < .5) target = 1;
}
function housekeeping() {
  // despawn
  for (let i = T.list.length - 1; i >= 0; i--) {
    const v = T.list[i], dx = v.x - fx, dy = v.y - fy, d2 = dx * dx + dy * dy;
    if (v.bus) { if (d2 > (simR + 14) * (simR + 14) && v.role === 'bus') { busU(v.bus); release(v); } continue; }
    if (v.stand) { if (d2 > (simR + 12) * (simR + 12)) release(v); continue; }
    if (v.keep) continue;
    if (d2 > (simR + 8) * (simR + 8) || (v.stuck > 12 && !v.byPlayer && !onScreen(v.x, v.y, 60))) release(v);
  }
  // buses entering range
  for (const b of buses) { if (b.veh) continue; const q = loopAt(b.loop, b.u, tmp), dx = q.x - fx, dy = q.y - fy; if (dx * dx + dy * dy < (simR + 4) * (simR + 4) && T.list.length < CAP + 6 && (refill || !onScreen(q.x, q.y, 90)) && clearLane(q.x, q.y, 5)) busReal(b); }
  // taxi stands
  for (let i = 0; i < stands.length; i++) {
    const st = stands[i], dx = st.ref.x - fx, dy = st.ref.y - fy; if (dx * dx + dy * dy > simR * simR) continue; const want = 1 + (i % 2);
    while (st.cabs.length < want && (refill || !onScreen(st.ref.x, st.ref.y, 90))) {
      const e = st.ref.e, s = st.ref.s - e.d * 4.3 * st.cabs.length, v = spawn('taxi', graph.lanePos(e, st.ref.off, s, tmp), { keep: true, role: 'stand', stand: st, parked: true, curb: .55, taxiFree: true, params: { free: true } });
      if (!v) break; st.cabs.push(v);
    }
  }
}
function fill(dt) {
  let amb = 0; for (const v of T.list) if (!v.keep) amb++;
  const h = G.now().hf;
  if (refill) { for (let i = 0; i < 60 && amb < target * .85; i++) if (trySpawn(true, h)) amb++; refill = false; return; }
  if (amb < target && T.list.length < CAP + 6) trySpawn(false, h);
}

/* ---------- setup ---------- */
function ensure() {
  if (ready) return true; C = G.sceneCache.get('city'); if (!C || !C.world) return false;
  world = C.world; graph = graph && world === getCity() ? graph : buildGraph(world); T.world = world; T.sfx = n => G.audio && G.audio.sfx && G.audio.sfx(n);
  for (const k in KINDS) KINDS[k].ok = ASSETS.has(KINDS[k].asset);
  for (const n of graph.nodes) if (n.signal) sigNodes.push(n);
  const tpois = world.pois.filter(p => p.type === 'taxistand' && p.lane);
  for (const p of tpois) { const ref = graph.nearestLane(p.lane.x, p.lane.y); if (ref) stands.push({ poi: p, ref: Object.assign({}, ref), cabs: [] }); }
  for (const ob of world.objs) {
    if (typeof ob.id !== 'string') continue;
    if (ob.id.startsWith('prop.road.trafficlight')) { let b = null, bd = 9; for (const n of sigNodes) { const d = Math.max(Math.abs(ob.x - n.x) - n.hx, Math.abs(ob.y - n.y) - n.hy); if (d < bd) { bd = d; b = n; } } if (b && bd < 2.5) b.lights.push(ob); }
    else if (ob.id === 'veh.taxi' && ob.p && ob.p.parked && tpois.some(p => Math.abs(p.lane.x - ob.x) < 9 && Math.abs(p.lane.y - ob.y) < 4)) ob.hidden = true; // static stand cabs are replaced by live ones
  }
  try { buildLoops(); } catch (e) { console.warn('traffic: bus loops failed: ' + e.message); }
  const prevL = C.lights;
  C.lights = (m, cam, pool) => {
    if (prevL) prevL(m, cam, pool); if (!T.lit) return; const ps = pool(1.7, '#ffe6b0'), hw = ps.width >> 1, hh = ps.height >> 1;
    for (let i = 0; i < T.list.length; i++) { const v = T.list[i]; if (v.stand) continue; const e = v.e, f = (v.len / 2 + 1.7) * e.d, x = v.x + (e.axis === 'x' ? f : 0), y = v.y + (e.axis === 'x' ? 0 : f), sx = Math.round((x - y) * U) - cam.x - hw, sy = Math.round((x + y) * U / 2 - v.z * U) - cam.y - hh; if (sx > G.W || sy > G.H || sx + ps.width < 0 || sy + ps.height < 0) continue; m.drawImage(ps, sx, sy); }
  };
  ready = true; refill = true; return true;
}

function update(dt, gm) {
  if (!ready && !ensure()) return;
  for (let i = 0; i < buses.length; i++) if (!buses[i].veh) busAbstract(buses[i], gm);
  if (G.scene !== C) return;
  T.time += dt; T.lit = !!G.env && (G.env.dark || 0) > .35; signals();
  const f = G.camTarget || G.player; fx = f.x; fy = f.y; simR = Math.max(40, Math.min(70, Math.max(G.W / 32, G.H / 16) + 22));
  if (Math.abs(fx - lfx) + Math.abs(fy - lfy) > 30) { refill = true; for (let i = T.list.length - 1; i >= 0; i--) { const v = T.list[i]; if (!v.keep) release(v); } tB = 0; tA = 0; } lfx = fx; lfy = fy;
  if ((tP -= dt) <= 0) { tP = .15; const P = T.peds; P.length = 0; const E = C.ents, r2 = (simR + 6) * (simR + 6); for (let i = 0; i < E.length; i++) { const e = E[i]; if (e.isVehicle || !e.spec || e.hidden) continue; const dx = e.x - fx, dy = e.y - fy; if (dx * dx + dy * dy < r2) P.push(e); } }
  if ((tB -= dt) <= 0) { tB = 1; rebuildNear(); }
  if ((tA -= dt) <= 0) { tA = .22; housekeeping(); fill(dt); }
  const L = T.list;
  for (let i = 0; i < L.length; i++) { const v = L[i]; if (!v.parked) step(v, dt); }
  for (let i = 0; i < buses.length; i++) { const b = buses[i]; if (b.veh && b.atStop) { if (!b.hold) b.dwell -= dt; if (b.dwell <= 0) busDepart(b); } }
}

export function init() {
  G.traffic = {
    get graph() { return roadGraph(); }, vehicles: T.list, spawn: (k, ref, o) => (ensure(), spawn(k, ref, o)), release, place, setPlan, buses, loops, stands, nextBuses, BUS_SPEED, ensure,
    busStopName: id => { const p = world && world.pois.find(q => q.id === id); return p ? p.name : id; },
    /** a lane position out of view, `minD..maxD` units (straight line) from the lane ref `nearRef`, preferably heading toward it */
    offscreenLane(nearRef, minD = 24, maxD = 60) {
      let best = null, bs = 1e9; const mid = (minD + maxD) / 2 - 6;
      for (const e of graph.edges) { if (e.to.dead || e.from.dead) continue; const sp = graph.span(e), q = graph.lanePos(e, 1, (sp[0] + sp[1]) / 2, tmp), dx = nearRef.x - q.x, dy = nearRef.y - q.y, d = Math.hypot(dx, dy); if (d < minD || d > maxD || onScreen(q.x, q.y, 90) || !clearLane(q.x, q.y, 6)) continue; const sc = Math.abs(d - mid) + ((e.axis === 'x' ? dx : dy) * e.d < 0 ? 25 : 0) + Math.random() * 6; if (sc < bs) { bs = sc; best = Object.assign({}, q); } }
      return best;
    },
    count: () => T.list.length,
    offroad: () => T.list.filter(v => world.tileType(v.x, v.y) !== GT.asphalt).map(v => v.kind + '@' + v.x.toFixed(1) + ',' + v.y.toFixed(1)),
    get simR() { return simR; }, get target() { return target; }, onScreen,
  };
  G.addSystem({ name: 'traffic', update });
  G.on('scene', s => { if (s && s.id === 'city') { if (ensure()) { refill = true; lfx = -999; } } });
  G.on('season', () => { for (const v of all) v.spr.fill(undefined); });
  G.on('load', () => { lfx = -999; });
}
