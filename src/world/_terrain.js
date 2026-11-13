// Terrain: design levels -> smoothed height field, water, zones. Roads pin their own heights (see _roads.js) before relax().
import { GT, W, H, RIV, SEA, level, zoneOf, Z } from './_ctx.js';

export function baseTerrain(c) {
  const w = c.world, N = (W + 1) * (H + 1), a = new Float32Array(N), b = new Float32Array(N);
  for (let y = 0; y <= H; y++) for (let x = 0; x <= W; x++) a[y * (W + 1) + x] = level(x, y);
  const blur = (s, d, dx, dy, R) => { for (let y = 0; y <= H; y++) for (let x = 0; x <= W; x++) { let t = 0, n = 0; for (let k = -R; k <= R; k++) { const X = x + dx * k, Y = y + dy * k; if (X < 0 || Y < 0 || X > W || Y > H) continue; t += s[Y * (W + 1) + X]; n++; } d[y * (W + 1) + x] = t / n; } };
  blur(a, b, 1, 0, 5); blur(b, a, 0, 1, 5);
  c.fixed = new Uint8Array(N);
  for (let y = 0; y <= H; y++) for (let x = 0; x <= W; x++) {
    const i = y * (W + 1) + x; let z = a[i];
    if (x < 149 && y < 110) { z = level(x, y); c.fixed[i] = 1; }      // Hillcrest terraces stay sharp
    if (x >= 274 && y < 102) { z = 3; c.fixed[i] = 1; }               // airfield is dead flat
    w.hv[i] = z;
  }
  w.ground(0, 0, W, H, GT.grass);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) w.zone[y * W + x] = zoneOf(x + .5, y + .5);
}
/** harmonic relaxation of all vertices that are not pinned (roads, terraces): removes steps between roads and block interiors */
export function relax(c, iters = 30) {
  const w = c.world, v = w.hv, f = c.fixed, S = W + 1;
  for (let k = 0; k < iters; k++) for (let y = 1; y < H; y++) for (let x = 1; x < W; x++) { const i = y * S + x; if (f[i]) continue; v[i] = (v[i - 1] + v[i + 1] + v[i - S] + v[i + S]) / 4; }
  for (let i = 0; i < v.length; i++) if (!f[i]) v[i] = Math.round(v[i] * 16) / 16;
}
/** pin a flat pad (vertices) at z */
export function pad(c, x0, y0, x1, y1, z) { const w = c.world; x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1); for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { if (x < 0 || y < 0 || x > W || y > H) continue; const i = y * (W + 1) + x; w.hv[i] = z; c.fixed[i] = 1; } }

export function carveWater(c) {
  const w = c.world, S = W + 1;
  const wz = y => y <= RIV.weir ? 1.5 : -1;
  // river (bridges = pinned road vertices are kept)
  for (let y = RIV.y0; y <= H; y++) for (let x = RIV.x0; x <= RIV.x1; x++) { const i = y * S + x; if (c.fixed[i] === 2) continue; w.hv[i] = wz(y); c.fixed[i] = 3; }
  for (let y = RIV.y0; y < H; y++) for (let x = RIV.x0 - 1; x < RIV.x1 + 1; x++) { const o = c.occAt(x, y); if (o === 1 || o === 2) continue; const inner = x >= RIV.x0 && x < RIV.x1; w.gt[y * W + x] = inner ? GT.water : GT.rock; c.occ[y * W + x] = 4; if (inner) w.zone[y * W + x] = Z.park; }
  // spring pond at the head of the river
  for (let y = 40; y <= 52; y++) for (let x = 144; x <= 168; x++) { const d = Math.hypot((x - 156) / 12, (y - 48) / 7); if (d < 1) { w.hv[y * S + x] = 1.5; c.fixed[y * S + x] = 3; } }
  for (let y = 40; y < 52; y++) for (let x = 144; x < 168; x++) { const vs = [w.H(x, y), w.H(x + 1, y), w.H(x, y + 1), w.H(x + 1, y + 1)]; if (vs.every(v => v === 1.5) && c.occAt(x, y) !== 1) { w.gt[y * W + x] = GT.water; c.occ[y * W + x] = 4; } }
  // the bay
  for (let y = SEA; y <= H; y++) for (let x = 0; x <= W; x++) { const i = y * S + x; if (c.fixed[i] === 2) continue; w.hv[i] = -1; c.fixed[i] = 3; }
  for (let y = SEA - 1; y < H; y++) for (let x = 0; x < W; x++) { if (c.occAt(x, y) === 1 || c.occAt(x, y) === 2) continue; w.gt[y * W + x] = y === SEA - 1 ? GT.concrete : y < SEA + 6 ? GT.water : GT.deepwater; if (y >= SEA) c.occ[y * W + x] = 4; }
}
