// Road graph for traffic/transit (private helper of sim/traffic.js). Pure: no DOM, no G.
//   buildGraph(world) -> { nodes, edges, nearestLane(x, y), route(a, b), routePts(a, b), lanePos(e, off, s), span(e), laneCoord(e, off) }
//   node: { i, x, y, hx, hy (half size of the junction box along x / y), signal, dead (road end), out: [edge], gx, gy (signal 0 red, 1 amber, 2 green),
//           inn: [vehicles that hold the box], occ (= inn.length), ap: [vehicles approaching, rebuilt every frame], cl / clT / clS (who goes next: one claim per street, x and y; last refreshed; since), cf (cache: do two movements cross) }  (see _traffic_veh.js)
//   edge: directed lane bundle { id, from, to, axis 'x'|'y', d (+1|-1 along the axis), c (road centre, cross axis), half, ls (side of the centre the
//         lanes are on: lane line = c + ls * off, off 1 | 3), s0, s1 (node coordinates along the axis), len, lanes (1|2), rev, road, kind, w }
//   Right-hand traffic: +x drives at y = c+1(+3), -x at c-1, +y at x = c-1, -y at x = c+1  (matches world.busRoutes lane paths and stop/taxi `lane` points).
//   lane ref: { e, off, s, x, y, dist }   (s = absolute coordinate along the edge axis)
//   route(a, b): shortest path between two lane refs over directed edges (no U-turns except at dead ends)
//         -> { edges, offs, len, pts: [[x, y]...] lane-centre waypoints (start, each turn corner, end), from: a, to: b } | null
export function buildGraph(world) {
  const nodes = [], edges = [], nmap = new Map(), key = (x, y) => Math.round(x * 2) * 4096 + Math.round(y * 2);
  const mkNode = (x, y, dead) => { const n = { i: nodes.length, x, y, hx: 0, hy: 0, signal: false, dead, out: [], occ: 0, inn: [], ap: [], cl: [null, null], clT: [0, 0], clS: [0, 0], cf: new Map(), gx: 2, gy: 2, lights: [], pre: '', preT: 0, phase: 0 }; nodes.push(n); nmap.set(key(x, y), n); return n; };
  const rById = new Map(world.roads.map(r => [r.id, r]));
  for (const it of world.intersections) {
    const n = nmap.get(key(it.x, it.y)) || mkNode(it.x, it.y, false); n.signal = n.signal || !!it.signal;
    for (const id of it.roads) { const r = rById.get(id); if (!r) continue; if (r.axis === 'x') n.hy = Math.max(n.hy, r.half); else n.hx = Math.max(n.hx, r.half); }
  }
  for (const n of nodes) { n.hx = n.hx || 2; n.hy = n.hy || 2; n.phase = (n.x * 7 + n.y * 13) % 19.2; }
  const W = { arterial: 3, street: 2, airport: 2, residential: 1, hill: .8 };
  const mkEdge = (A, B, r) => {
    const ax = r.axis === 'x', s0 = ax ? A.x : A.y, s1 = ax ? B.x : B.y, d = s1 > s0 ? 1 : -1;
    const e = { id: edges.length, from: A, to: B, axis: r.axis, d, c: r.c, half: r.half, ls: ax ? d : -d, s0, s1, len: Math.abs(s1 - s0), lanes: r.half >= 4 ? 2 : 1, rev: null, road: r, kind: r.kind, w: W[r.kind] || 1 };
    edges.push(e); A.out.push(e); return e;
  };
  for (const r of world.roads) {
    const ax = r.axis === 'x', on = nodes.filter(n => !n.dead && (ax ? n.y === r.c && n.x >= r.a && n.x <= r.b : n.x === r.c && n.y >= r.a && n.y <= r.b)).sort((p, q) => ax ? p.x - q.x : p.y - q.y);
    if (!on.length) continue; const co = n => ax ? n.x : n.y;
    if (co(on[0]) > r.a + 5) on.unshift(ax ? mkNode(r.a, r.c, true) : mkNode(r.c, r.a, true));
    if (co(on[on.length - 1]) < r.b - 5) on.push(ax ? mkNode(r.b, r.c, true) : mkNode(r.c, r.b, true));
    for (let i = 0; i + 1 < on.length; i++) { const f = mkEdge(on[i], on[i + 1], r), b = mkEdge(on[i + 1], on[i], r); f.rev = b; b.rev = f; }
  }
  if (edges.length > 511) throw new Error('traffic graph: more than 511 lane edges (movement keys in _traffic_veh.js pack an edge id into 9 bits)');
  const E = edges.length, dist = new Float64Array(E), prev = new Int32Array(E), done = new Uint8Array(E);
  const ext = (n, axis) => n.dead ? 0 : axis === 'x' ? n.hx : n.hy;
  const laneCoord = (e, off) => e.c + e.ls * off;
  /** usable stretch of an edge (outside the junction boxes), in travel order */
  const span = e => { let a = e.s0 + e.d * (ext(e.from, e.axis) + 2.5), b = e.s1 - e.d * (ext(e.to, e.axis) + 3.5); if ((b - a) * e.d < 0) a = b = (e.s0 + e.s1) / 2; return [a, b]; };
  const lanePos = (e, off, s, out = {}) => { const l = laneCoord(e, off); out.e = e; out.off = off; out.s = s; if (e.axis === 'x') { out.x = s; out.y = l; } else { out.x = l; out.y = s; } return out; };
  function nearestLane(x, y) {
    let be = null, bo = 1, bs = 0, bd = 1e9;
    for (const e of edges) {
      const ax = e.axis === 'x', [a, b] = span(e), lo = Math.min(a, b), hi = Math.max(a, b), s = Math.max(lo, Math.min(hi, ax ? x : y)), da = Math.abs((ax ? x : y) - s);
      for (let off = 1; off <= (e.lanes > 1 ? 3 : 1); off += 2) { const dl = Math.abs((ax ? y : x) - laneCoord(e, off)), dd = da + dl; if (dd < bd - 1e-6) { bd = dd; be = e; bo = off; bs = s; } }
    }
    return be ? lanePos(be, bo, bs, { dist: bd }) : null;
  }
  function route(a, b) {
    if (!a || !b) return null; let list;
    if (a.e === b.e && (b.s - a.s) * a.e.d >= 0) list = [a.e];
    else {
      dist.fill(Infinity); done.fill(0); prev.fill(-1); dist[a.e.id] = (a.e.s1 - a.s) * a.e.d;
      for (; ;) {
        let u = -1, bd = Infinity; for (let i = 0; i < E; i++) if (!done[i] && dist[i] < bd) { bd = dist[i]; u = i; } if (u < 0) break; done[u] = 1;
        const e = edges[u]; for (const f of e.to.out) { if (f === e.rev && !e.to.dead) continue; const c = bd + f.len + (f.axis !== e.axis ? 5 : 0); if (c < dist[f.id]) { dist[f.id] = c; prev[f.id] = u; } }
      }
      let best = -1, bc = Infinity; for (const p of edges) { if (p.to !== b.e.from || (p === b.e.rev && !p.to.dead)) continue; if (dist[p.id] < bc) { bc = dist[p.id]; best = p.id; } }
      if (best < 0) return null; list = [b.e]; for (let u = best, g = 0; u >= 0 && g < E; u = prev[u], g++) list.push(edges[u]); list.reverse();
      if (list[0] !== a.e) return null;
    }
    const offs = list.map(() => 1); offs[0] = a.off || 1; offs[list.length - 1] = list.length === 1 ? (a.off || 1) : (b.off || 1);
    const pts = [[a.x, a.y]]; let len = 0, px = a.x, py = a.y;
    for (let i = 0; i + 1 < list.length; i++) {
      const e = list[i], f = list[i + 1]; let x, y;
      if (f.axis !== e.axis) { const le = laneCoord(e, offs[i]), lf = laneCoord(f, offs[i + 1]); if (e.axis === 'x') { x = lf; y = le; } else { x = le; y = lf; } }
      else if (e.axis === 'x') { x = e.to.x; y = laneCoord(f, offs[i + 1]); } else { x = laneCoord(f, offs[i + 1]); y = e.to.y; }
      len += Math.abs(x - px) + Math.abs(y - py); px = x; py = y; pts.push([x, y]);
    }
    const end = lanePos(b.e, offs[list.length - 1], b.s); len += Math.abs(end.x - px) + Math.abs(end.y - py); pts.push([end.x, end.y]);
    return { edges: list, offs, len, pts, from: a, to: end };
  }
  /** route between two free points (snapped to their nearest lanes) */
  const routePts = (p, q) => route(nearestLane(p.x, p.y), nearestLane(q.x, q.y));
  return { nodes, edges, nearestLane, route, routePts, lanePos, span, laneCoord, ext };
}
