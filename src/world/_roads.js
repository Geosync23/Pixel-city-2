// Road network: definitions, intersections, height profiles, ground painting, markings, bridges.
import { GT, W, H, RIV, level, Z, zoneOf } from './_ctx.js';
import * as R from '../engine/raster.js';

const X = (name, c, a, b, half = 2, kind = 'street', o = {}) => Object.assign({ axis: 'x', name, c, a, b, half, kind }, o);
const Y = (name, c, a, b, half = 2, kind = 'street', o = {}) => Object.assign({ axis: 'y', name, c, a, b, half, kind }, o);
export const ROADS = [
  X('University Ave', 114, 24, 266, 4, 'arterial'), X('Airport Pkwy', 138, 178, 368, 2, 'arterial'),
  X('5th Ave', 170, 178, 266), X('Elm St', 170, 266, 338, 2, 'residential'),
  X('Park St', 200, 52, 266, 4, 'arterial'), X('Park St', 200, 266, 368, 2, 'residential'),
  X('Market St', 232, 52, 266), X('Oak St', 232, 266, 368, 2, 'residential'),
  X('Mill St', 264, 52, 138, 2, 'street', { endB: 'plaza' }), X('3rd Ave', 264, 178, 266), X('Birchwood Dr', 264, 302, 368, 2, 'residential'),
  X('Harbor Blvd', 296, 24, 368, 4, 'arterial', { endA: 'bulb' }), X('Dock St', 326, 52, 368, 2, 'street'),
  X('Vista Ter', 94, 24, 140, 2, 'hill'), X('Orchard Ter', 76, 24, 140, 2, 'hill'), X('Summit Dr', 58, 24, 140, 2, 'hill'), X('Skyline Dr', 40, 24, 140, 2, 'hill'),
  X('College St', 86, 178, 266), X('Campus Dr', 58, 178, 266),
  X('Arrivals Dr', 106, 302, 350, 2, 'airport'), X('Willow Ct', 152, 302, 324, 2, 'residential', { endB: 'bulb' }),
  Y('Western Ave', 52, 114, 326, 2, 'arterial'),
  Y('Crest Way', 24, 94, 114, 2, 'hill'), Y('Crest Way', 140, 76, 94, 2, 'hill'), Y('Crest Way', 24, 58, 76, 2, 'hill'), Y('Crest Way', 140, 40, 58, 2, 'hill'),
  Y('Cooper St', 82, 200, 326), Y('Chandler St', 112, 200, 326),
  Y('Riverside Dr', 178, 58, 326), Y('1st St', 206, 58, 326), Y('Main St', 234, 58, 326), Y('Maple Ave', 266, 58, 326, 4, 'arterial'),
  Y('Linden St', 302, 106, 326, 2, 'residential'), Y('Aspen St', 338, 138, 296, 2, 'residential'), Y('Birch Ln', 368, 138, 326, 2, 'residential'),
  Y('Terminal Rd', 350, 106, 138, 2, 'airport'),
  Y('Cedar Ct', 320, 180, 200, 2, 'residential', { endA: 'bulb' }), Y('Hazel Ct', 354, 232, 251, 2, 'residential', { endB: 'bulb' }),
];
export const WHITE = '#e9e7dc', YELLOW = '#e3bb3e';

export function buildRoads(c) {
  const w = c.world; const roads = c.roads = ROADS.map((r, i) => Object.assign({ id: 'r' + i }, r)); const nodes = c.nodes = [];
  for (const rx of roads) if (rx.axis === 'x') for (const ry of roads) if (ry.axis === 'y') {
    if (ry.c < rx.a || ry.c > rx.b || rx.c < ry.a || rx.c > ry.b) continue;
    const arms = { w: ry.c > rx.a, e: ry.c < rx.b, n: rx.c > ry.a, s: rx.c < ry.b }, n4 = arms.w + arms.e + arms.n + arms.s;
    const zn = zoneOf(ry.c, rx.c);
    nodes.push({ x: ry.c, y: rx.c, hx: ry.half, hy: rx.half, rx, ry, arms, roads: [rx.id, ry.id], z: level(ry.c, rx.c), signal: n4 >= 3 && (rx.half === 4 || ry.half === 4 || (n4 === 4 && (zn === Z.downtown || zn === Z.arts))) });
  }
  // height profile along each road
  for (const r of roads) {
    const ns = nodes.filter(n => (r.axis === 'x' ? n.rx : n.ry) === r).map(n => ({ t: r.axis === 'x' ? n.x : n.y, e: (r.axis === 'x' ? n.hx : n.hy) + 2, z: n.z })).sort((p, q) => p.t - q.t);
    const lv = t => r.axis === 'x' ? level(t, r.c) : level(r.c, t);
    if (!ns.length || ns[0].t > r.a) ns.unshift({ t: r.a, e: 0, z: lv(r.a) }); if (ns[ns.length - 1].t < r.b) ns.push({ t: r.b, e: 0, z: lv(r.b) });
    r.nodesT = ns;
    r.zAt = t => { if (t <= ns[0].t) return ns[0].z; for (let i = 0; i < ns.length - 1; i++) { const p = ns[i], q = ns[i + 1]; if (t > q.t) continue; const t0 = p.t + p.e, t1 = q.t - q.e; if (t <= t0) return p.z; if (t >= t1 || t1 <= t0) return q.z; return p.z + (q.z - p.z) * (t - t0) / (t1 - t0); } return ns[ns.length - 1].z; };
    r.ea = extEnd(r, nodes, 'a'); r.eb = extEnd(r, nodes, 'b');
  }
  // pin heights + paint
  const S = W + 1;
  const strip = (r, hw, fn) => { const t0 = r.a - (r.ea ? r.ea.h + 2 : 0), t1 = r.b + (r.eb ? r.eb.h + 2 : 0); if (r.axis === 'x') fn(t0, r.c - hw, t1, r.c + hw); else fn(r.c - hw, t0, r.c + hw, t1); };
  for (const r of roads) {
    const hw = r.half + 2, t0 = r.a - (r.ea ? r.ea.h + 2 : 0), t1 = r.b + (r.eb ? r.eb.h + 2 : 0);
    for (let t = t0; t <= t1; t++) { const z = r.zAt(t); for (let k = -hw; k <= hw; k++) { const x = r.axis === 'x' ? t : r.c + k, y = r.axis === 'x' ? r.c + k : t; if (x < 0 || y < 0 || x > W || y > H) continue; const i = y * S + x; w.hv[i] = z; c.fixed[i] = (x >= RIV.x0 - 1 && x <= RIV.x1 + 1 && y > RIV.y0) ? 2 : 1; } }
  }
  const swType = (x, y) => { const z = zoneOf(x, y); return z === Z.oldtown ? GT.brickpave : GT.sidewalk; };
  for (const r of roads) strip(r, r.half + 2, (x0, y0, x1, y1) => { for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { if (x < 0 || y < 0 || x >= W || y >= H) continue; w.gt[y * W + x] = swType(x, y); c.occ[y * W + x] = 2; } });
  for (const r of roads) { const t0 = r.a - (r.ea ? r.ea.h : 0), t1 = r.b + (r.eb ? r.eb.h : 0); const f = (x0, y0, x1, y1) => { w.ground(x0, y0, x1, y1, GT.asphalt); c.occSet(x0, y0, x1, y1, 1); }; if (r.axis === 'x') f(t0, r.c - r.half, t1, r.c + r.half); else f(r.c - r.half, t0, r.c + r.half, t1); }
  // cul-de-sac bulbs
  for (const r of roads) for (const [end, t] of [[r.endA, r.a], [r.endB, r.b]]) if (end === 'bulb') {
    const cx = r.axis === 'x' ? t : r.c, cy = r.axis === 'x' ? r.c : t, z = r.zAt(t);
    for (let y = cy - 7; y <= cy + 7; y++) for (let x = cx - 7; x <= cx + 7; x++) { if (Math.hypot(x - cx, y - cy) <= 7.3) { const i = y * S + x; w.hv[i] = z; c.fixed[i] = 1; } }
    for (let y = cy - 7; y < cy + 7; y++) for (let x = cx - 7; x < cx + 7; x++) { const d = Math.hypot(x + .5 - cx, y + .5 - cy); if (d < 4.6) { w.gt[y * W + x] = GT.asphalt; c.occ[y * W + x] = 1; } else if (d < 6.6 && c.occ[y * W + x] !== 1) { w.gt[y * W + x] = GT.sidewalk; c.occ[y * W + x] = 2; } }
  }
  w.roads = roads.map(r => ({ id: r.id, axis: r.axis, c: r.c, a: r.a, b: r.b, half: r.half, name: r.name, kind: r.kind }));
  w.intersections = nodes.map(n => ({ x: n.x, y: n.y, roads: n.roads, signal: n.signal, z: n.z, arms: n.arms }));
}
function extEnd(r, nodes, which) { const t = which === 'a' ? r.a : r.b; const n = nodes.find(n => (r.axis === 'x' ? n.rx === r && n.x === t : n.ry === r && n.y === t)); return n ? { h: r.axis === 'x' ? n.hx : n.hy } : null; }

/** lane markings, stop lines, crosswalks, bike lanes */
export function markRoads(c) {
  const M = c.mark;
  const along = (r, t0, t1, off, wd, col) => { if (t1 <= t0) return; if (r.axis === 'x') M(t0, r.c + off - wd / 2, t1, r.c + off + wd / 2, col); else M(r.c + off - wd / 2, t0, r.c + off + wd / 2, t1, col); };
  const across = (r, t, len, o0, o1, col) => { if (r.axis === 'x') M(t, r.c + o0, t + len, r.c + o1, col); else M(r.c + o0, t, r.c + o1, t + len, col); };
  for (const r of c.roads) {
    const ns = c.nodes.filter(n => (r.axis === 'x' ? n.rx : n.ry) === r).map(n => ({ n, t: r.axis === 'x' ? n.x : n.y, h: r.axis === 'x' ? n.hx : n.hy })).sort((p, q) => p.t - q.t);
    const cuts = [[r.a - 1e3, r.a + (r.endA === 'bulb' ? 5 : 0)], ...ns.map(k => [k.t - k.h - 2.4, k.t + k.h + 2.4]), [r.b - (r.endB === 'bulb' ? 5 : 0), r.b + 1e3]].sort((p, q) => p[0] - q[0]);
    for (let i = 0; i < cuts.length - 1; i++) {
      const t0 = Math.max(cuts[i][1], r.a), t1 = Math.min(cuts[i + 1][0], r.b); if (t1 - t0 < 1) continue;
      if (r.half === 4) { for (let t = t0; t < t1; t += 2) { along(r, t, Math.min(t1, t + 2), -.14, .12, YELLOW); along(r, t, Math.min(t1, t + 2), .14, .12, YELLOW); } for (let t = t0 + .5; t + 1.2 <= t1; t += 3) { along(r, t, t + 1.2, -2, .12, WHITE); along(r, t, t + 1.2, 2, .12, WHITE); } }
      else if (r.kind === 'residential' || r.kind === 'hill') { for (let t = t0 + .5; t + 1.2 <= t1; t += 3.5) along(r, t, t + 1.2, 0, .12, WHITE); }
      else for (let t = t0 + .5; t + 1.4 <= t1; t += 3) along(r, t, t + 1.4, 0, .12, YELLOW);
      if (r.bike) for (let t = t0; t < t1; t += 2) { along(r, t, Math.min(t1, t + 2), -r.half + .9, .1, '#7fc98a'); along(r, t, Math.min(t1, t + 2), r.half - .9, .1, '#7fc98a'); }
    }
    // stop lines + zebra crossings on each arm that continues past a node
    for (const k of ns) {
      const n = k.n, big = n.signal || r.kind !== 'residential';
      for (const s of [-1, 1]) {
        const has = r.axis === 'x' ? (s < 0 ? n.arms.w : n.arms.e) : (s < 0 ? n.arms.n : n.arms.s); if (!has) continue;
        const e0 = k.t + s * (k.h + .25), e1 = k.t + s * (k.h + 1.75), lo = Math.min(e0, e1);
        if (big) for (let o = -r.half + .25; o + .5 <= r.half; o += 1) across(r, lo, 1.5, o, o + .5, WHITE);
        // stop line for traffic approaching the node on this arm (right-hand traffic: approaching lanes are on the far side from the centre)
        const st = k.t + s * (k.h + 2.1), side = (r.axis === 'x' ? -s : s);  // x-road heading +x drives on +y side (c+1); y-road heading +y drives on -x side
        across(r, Math.min(st, st + s * .3), .3, side > 0 ? .15 : -r.half + .2, side > 0 ? r.half - .2 : -.15, WHITE);
      }
    }
  }
}
/** distribute the collected marking rects into per-chunk decals */
export function flushMarks(c) {
  const by = new Map();
  for (const m of c.marks) { const cx0 = Math.floor(m[0] / 16), cy0 = Math.floor(m[1] / 16), cx1 = Math.floor((m[2] - 1e-6) / 16), cy1 = Math.floor((m[3] - 1e-6) / 16); for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) { const k = cx + ',' + cy; let a = by.get(k); if (!a) by.set(k, a = { cx, cy, l: [] }); a.l.push([Math.max(m[0], cx * 16), Math.max(m[1], cy * 16), Math.min(m[2], cx * 16 + 16), Math.min(m[3], cy * 16 + 16), m[4]]); } }
  for (const a of by.values()) { const l = a.l; c.world.decal({ x0: a.cx * 16, y0: a.cy * 16, x1: a.cx * 16 + 16, y1: a.cy * 16 + 16, draw(Rr, zAt) { for (const m of l) Rr.qz(m[0], m[2], m[1], m[3], zAt((m[0] + m[2]) / 2, (m[1] + m[3]) / 2), m[4]); } }); }
  c.marks = [];
}

/* ---- small custom drawables shared by several modules ---- */
export const railing = (len, col = '#5b6670') => ({ key: 'railing' + len + col, size: [len, .25, 1], vb: [0, 0, 0, len, .3, 1.1], draw() { for (let x = 0; x <= len - .1; x += 1) R.box(Math.min(x, len - .12), .06, 0, .12, .12, 1, col, { ol: false }); R.box(0, .06, .9, len, .12, .1, R.lt(col, .15), { ol: false }); R.box(0, .08, .45, len, .08, .06, col, { ol: false }); } });
export function placeRailing(c, x0, y0, x1, y1, col) { // axis-aligned run, split into 4-unit pieces
  const w = c.world; if (y0 === y1) for (let x = x0; x < x1; x += 4) { const l = Math.min(4, x1 - x); w.placeCustom(railing(l, col), x, y0, {}); } else for (let y = y0; y < y1; y += 4) { const l = Math.min(4, y1 - y); w.placeCustom(railing(l, col), x0, y, { flip: true }); }
}
export function bridges(c) {
  const w = c.world;
  for (const r of c.roads) if (r.axis === 'x' && r.a < RIV.x0 && r.b > RIV.x1) {
    const y0 = r.c - r.half - 2, y1 = r.c + r.half + 2, zn = zoneOf(RIV.x0 - 3, r.c);
    w.ground(RIV.x0 - 1, y0, RIV.x1 + 1, y1, GT.concrete); w.ground(RIV.x0 - 1, r.c - r.half, RIV.x1 + 1, r.c + r.half, GT.asphalt);
    placeRailing(c, RIV.x0 - 2, y0, RIV.x1 + 2, y0, '#4f6f7f'); placeRailing(c, RIV.x0 - 2, y1 - .25, RIV.x1 + 2, y1 - .25, '#4f6f7f');
    const lamp = c.first('prop.street.lamp.double', 'prop.street.lamp.modern', 'ex.lamp');
    for (const x of [RIV.x0, RIV.x1 - .5]) { c.put(lamp, x, y0 + .3, { p: {} }); c.put(lamp, x, y1 - .9, { p: {} }); }
    (c.bridgeList = c.bridgeList || []).push({ y: r.c, y0, y1, road: r.id, name: r.name + ' Bridge' });
  }
}
