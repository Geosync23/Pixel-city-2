// Grid pathfinding on World.nav (0.5-unit cells) + movement helpers.
let G = null, PAR = null, ST = null, CL = null, stamp = 0, cap = 0;
function ensure(n) { if (cap >= n) return; cap = n; G = new Float32Array(n); PAR = new Int32Array(n); ST = new Uint32Array(n); CL = new Uint8Array(n); stamp = 0; }
/** nearest unblocked nav cell to (gx,gy) within r cells, or null */
export function nearestFree(world, gx, gy, r = 12) {
  for (let k = 0; k <= r; k++) for (let dy = -k; dy <= k; dy++) for (let dx = -k; dx <= k; dx++) { if (Math.max(Math.abs(dx), Math.abs(dy)) !== k) continue; const x = gx + dx, y = gy + dy; if (x < 1 || y < 1 || x >= world.nw - 1 || y >= world.nh - 1) continue; if (!world.nav[y * world.nw + x]) return [x, y]; }
  return null;
}
/**
 * A* from world pos (sx,sy) to (tx,ty). Returns array of [x,y] waypoints (world units) or null.
 * opts.limit = max node expansions (default 60000). Blocked start/goal are snapped to the nearest free cell.
 */
export function findPath(world, sx, sy, tx, ty, opts = {}) {
  const W = world.nw, H = world.nh, nav = world.nav; ensure(W * H); const limit = opts.limit || 60000;
  let s = [Math.max(0, Math.min(W - 1, Math.floor(sx * 2))), Math.max(0, Math.min(H - 1, Math.floor(sy * 2)))], t = [Math.max(0, Math.min(W - 1, Math.floor(tx * 2))), Math.max(0, Math.min(H - 1, Math.floor(ty * 2)))];
  let exact = true;
  if (nav[s[1] * W + s[0]]) { s = nearestFree(world, s[0], s[1]); if (!s) return null; }
  if (nav[t[1] * W + t[0]]) { t = nearestFree(world, t[0], t[1], opts.snap || 12); exact = false; if (!t) return null; }
  const si = s[1] * W + s[0], ti = t[1] * W + t[0], gx = t[0], gy = t[1];
  if (++stamp > 4e9) { ST.fill(0); stamp = 1; }
  const heap = []; const hf = i => { const dx = Math.abs(i % W - gx), dy = Math.abs((i / W | 0) - gy); return Math.max(dx, dy) + .414 * Math.min(dx, dy); };
  const push = (f, i) => { heap.push(f, i); let k = heap.length / 2 - 1; while (k > 0) { const p = (k - 1) >> 1; if (heap[p * 2] <= heap[k * 2]) break; const a = heap[p * 2], b = heap[p * 2 + 1]; heap[p * 2] = heap[k * 2]; heap[p * 2 + 1] = heap[k * 2 + 1]; heap[k * 2] = a; heap[k * 2 + 1] = b; k = p; } };
  const pop = () => { const n = heap.length / 2 - 1, top = heap[1], lf = heap[n * 2], li = heap[n * 2 + 1]; heap.length = n * 2; if (n > 0) { heap[0] = lf; heap[1] = li; let k = 0; for (; ;) { const l = 2 * k + 1, r = l + 1; let m = k; if (l < n && heap[l * 2] < heap[m * 2]) m = l; if (r < n && heap[r * 2] < heap[m * 2]) m = r; if (m === k) break; const a = heap[m * 2], b = heap[m * 2 + 1]; heap[m * 2] = heap[k * 2]; heap[m * 2 + 1] = heap[k * 2 + 1]; heap[k * 2] = a; heap[k * 2 + 1] = b; k = m; } } return top; };
  ST[si] = stamp; G[si] = 0; PAR[si] = -1; CL[si] = 0; push(hf(si), si);
  let found = si === ti, n = 0;
  while (heap.length && !found) {
    const i = pop(); if (CL[i] && ST[i] === stamp) continue; if (i === ti) { found = true; break; } CL[i] = 1; if (++n > limit) break;
    const x = i % W, y = i / W | 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue; const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const j = ny * W + nx; if (nav[j]) continue;
      if (dx && dy && (nav[y * W + nx] || nav[ny * W + x])) continue;
      const ng = G[i] + (dx && dy ? 1.414 : 1);
      if (ST[j] !== stamp) { ST[j] = stamp; CL[j] = 0; G[j] = ng; PAR[j] = i; push(ng + hf(j), j); }
      else if (!CL[j] && ng < G[j]) { G[j] = ng; PAR[j] = i; push(ng + hf(j), j); }
    }
  }
  if (!found) return null;
  const out = []; for (let k = ti; k !== si && k >= 0; k = PAR[k]) out.push([(k % W + .5) / 2, ((k / W | 0) + .5) / 2]); out.reverse();
  // string-pull: drop waypoints that are collinear
  const sm = []; for (let i = 0; i < out.length; i++) { if (i > 0 && i < out.length - 1) { const a = out[i - 1], b = out[i], c = out[i + 1]; if (Math.abs((b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0])) < 1e-6) continue; } sm.push(out[i]); }
  if (exact && sm.length) sm[sm.length - 1] = [tx, ty];
  return sm;
}
/** Move mover {x,y} toward (tx,ty) by at most `dist`, sliding along obstacles. Returns distance moved. */
export function stepToward(world, m, tx, ty, dist) {
  const dx = tx - m.x, dy = ty - m.y, d = Math.hypot(dx, dy); if (d < .03) return 0;
  const st = Math.min(d, dist), nx = m.x + dx / d * st, ny = m.y + dy / d * st;
  if (!world.isBlocked(nx, ny)) { m.x = nx; m.y = ny; return st; }
  if (Math.abs(dx / d) > .15 && !world.isBlocked(nx, m.y)) { m.x = nx; return Math.abs(dx / d * st); }
  if (Math.abs(dy / d) > .15 && !world.isBlocked(m.x, ny)) { m.y = ny; return Math.abs(dy / d * st); }
  return 0;
}
/** follow a path array (mutated: reached waypoints are shifted off). Returns distance moved; path empties when done. */
export function followPath(world, m, path, dist) {
  let moved = 0, guard = 0;
  while (path.length && dist > 1e-4 && guard++ < 50) { const p = path[0]; if (Math.hypot(p[0] - m.x, p[1] - m.y) < .06) { path.shift(); continue; } const s = stepToward(world, m, p[0], p[1], dist); if (!s) { path.length = 0; break; } moved += s; dist -= s; }
  return moved;
}
