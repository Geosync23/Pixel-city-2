// Terrain finish for the chunk painter (engine/ground.js): shore distance fields, water with depth bands / wavelets / shore foam,
// soft pond banks, winter snow cover (drifts, kerb banks, trodden centres), frozen still water, and the "outskirts" beyond the map edge.
// Pure (no DOM). Everything here runs once per chunk render (chunks are cached canvases), never per frame.
import * as R from './raster.js';
import { GT } from './world.js';
const { hash2, dk, lt, mix, ENV } = R;

const isWet = t => t === GT.water || t === GT.deepwater;
const PAVED = new Set([GT.sidewalk, GT.plaza, GT.brickpave, GT.cobble, GT.concrete, GT.boardwalk]);
const SOFT = new Set([GT.grass, GT.lawn, GT.park, GT.sand, GT.dirt, GT.soil]);
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
/** ordered-dither threshold 0..1 for a world position on flat ground (screen pixel derived from the world coords) */
const bay = (x, y) => (BAYER[((Math.floor((x + y) * 8) & 3) << 2) | (Math.floor((x - y) * 16) & 3)] + .5) / 16;
/** smooth value noise 0..1 */
export function vnoise(x, y, s) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const a = hash2(ix, iy, s), b = hash2(ix + 1, iy, s), c = hash2(ix, iy + 1, s), d = hash2(ix + 1, iy + 1, s);
  return (a + (b - a) * u) * (1 - v) + (c + (d - c) * u) * v;
}

/* ---------- per-world fields (lazy, rebuilt when world.version changes) ---------- */
function chamfer(D, w, h) { // two-pass 1 / 1.414 chamfer distance transform, in tiles
  const S2 = 1.4142;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * w + x; let v = D[i]; if (x > 0 && D[i - 1] + 1 < v) v = D[i - 1] + 1; if (y > 0) { if (D[i - w] + 1 < v) v = D[i - w] + 1; if (x > 0 && D[i - w - 1] + S2 < v) v = D[i - w - 1] + S2; if (x < w - 1 && D[i - w + 1] + S2 < v) v = D[i - w + 1] + S2; } D[i] = v; }
  for (let y = h - 1; y >= 0; y--) for (let x = w - 1; x >= 0; x--) { const i = y * w + x; let v = D[i]; if (x < w - 1 && D[i + 1] + 1 < v) v = D[i + 1] + 1; if (y < h - 1) { if (D[i + w] + 1 < v) v = D[i + w] + 1; if (x < w - 1 && D[i + w + 1] + S2 < v) v = D[i + w + 1] + S2; if (x > 0 && D[i + w - 1] + S2 < v) v = D[i + w - 1] + S2; } D[i] = v; }
  return D;
}
/**
 * F = { shore: tiles to the nearest shore-land tile, surf: 1 where the water is open sea (foam), still: 1 where a water body is
 *       closed and small (freezes in winter), bank: per tile 0 none | 1 earth bank | 2 sand bank (soft shores of water),
 *       pave: tiles to the nearest non-paved tile or building, road: tiles to the nearest non-asphalt tile }
 */
export function fields(world) {
  let F = world._gfx; if (F && F.gt === world.gt && F.nobj === world.objs.length >> 6) return F; /* rebuilt only if the terrain array is replaced or the object count moves by 64+ (not on season changes) */
  const w = world.w, h = world.h, n = w * h, gt = world.gt, BIG = 99;
  const minH = (x, y) => Math.min(world.H(x, y), world.H(x + 1, y), world.H(x, y + 1), world.H(x + 1, y + 1));
  const shore = new Float32Array(n).fill(BIG), sea = new Float32Array(n).fill(BIG), bank = new Uint8Array(n), still = new Uint8Array(n);
  let anyWater = false;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x, t = gt[i];
    if (t === GT.deepwater) sea[i] = 0;
    if (isWet(t)) { anyWater = true; continue; } if (!t) continue;
    // land that touches the water at water level is shore (decks and bridges high above it are not)
    let near = false, mh = 0, first = true;
    for (let dy = -1; dy <= 1 && !near; dy++) for (let dx = -1; dx <= 1; dx++) { const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= w || Y >= h || !isWet(gt[Y * w + X])) continue; if (first) { mh = minH(x, y); first = false; } if (mh <= world.H(X, Y) + .6) { near = true; break; } }
    if (near) shore[i] = 0;
  }
  if (anyWater) {
    chamfer(shore, w, h); chamfer(sea, w, h);
    // soft banks: water tiles and soft land tiles that face each other across a flat shore
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x, t = gt[i]; if (!isWet(t) && !SOFT.has(t)) continue; let b = 0, hard = false;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dy) continue; const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= w || Y >= h) continue; const j = Y * w + X, u = gt[j];
        if (isWet(t)) { if (isWet(u) || !u || shore[j] !== 0) continue; if (SOFT.has(u)) b = Math.max(b, u === GT.sand ? 2 : 1); else if (dx === 0 || dy === 0) hard = true; }
        else if (isWet(u) && shore[i] === 0) b = t === GT.sand ? 2 : 1; }
      bank[i] = hard ? 0 : b;
    }
    // still water: closed bodies without deep water, small enough to freeze
    const seen = new Uint8Array(n), st = [], wm = new Uint8Array(n); // wm: water, plus bridges / decks with water close on both sides
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * w + x; if (isWet(gt[i])) { wm[i] = 1; continue; } if (shore[i] === 0) continue; let a = 0, b = 0, c = 0, d = 0; for (let k = 1; k <= 7; k++) { if (x - k >= 0 && isWet(gt[i - k])) a = 1; if (x + k < w && isWet(gt[i + k])) b = 1; if (y - k >= 0 && isWet(gt[i - k * w])) c = 1; if (y + k < h && isWet(gt[i + k * w])) d = 1; } if ((a && b) || (c && d)) wm[i] = 1; }
    const isWet2 = j => wm[j] === 1;
    for (let s0 = 0; s0 < n; s0++) { if (seen[s0] || !isWet(gt[s0])) continue; const body = []; let deep = false; st.push(s0); seen[s0] = 1;
      while (st.length) { const i = st.pop(); body.push(i); if (gt[i] === GT.deepwater) deep = true; const x = i % w, y = (i - x) / w; if (x > 0 && !seen[i - 1] && isWet2(i - 1)) { seen[i - 1] = 1; st.push(i - 1); } if (x < w - 1 && !seen[i + 1] && isWet2(i + 1)) { seen[i + 1] = 1; st.push(i + 1); } if (y > 0 && !seen[i - w] && isWet2(i - w)) { seen[i - w] = 1; st.push(i - w); } if (y < h - 1 && !seen[i + w] && isWet2(i + w)) { seen[i + w] = 1; st.push(i + w); } }
      if (!deep && body.length < 1500) for (const i of body) if (isWet(gt[i])) still[i] = 1; }
  }
  // snow fields: paved tiles -> distance to the kerb / verge / a building; road tiles -> distance to the kerb
  const bld = new Uint8Array(n);
  for (const ob of world.objs) { const B = ob.B; if (!ob.solid || B[3] - B[0] < 2 || B[4] - B[1] < 2 || B[5] - B[2] < 1.5) continue; for (let y = Math.max(0, Math.floor(B[1] + .2)); y < Math.min(h, Math.ceil(B[4] - .2)); y++) for (let x = Math.max(0, Math.floor(B[0] + .2)); x < Math.min(w, Math.ceil(B[3] - .2)); x++) bld[y * w + x] = 1; }
  const pave = new Float32Array(n), road = new Float32Array(n);
  for (let i = 0; i < n; i++) { pave[i] = PAVED.has(gt[i]) && !bld[i] ? BIG : 0; road[i] = gt[i] === GT.asphalt ? BIG : 0; }
  chamfer(pave, w, h); chamfer(road, w, h);
  F = world._gfx = { gt: world.gt, nobj: world.objs.length >> 6, w, h, shore, sea, bank, still, pave, road, anyWater };
  return F;
}
/** bilinear sample of a tile-centred field (indices clamp, so it also works outside the map) */
function dAt(D, w, h, x, y) {
  let u = x - .5, v = y - .5; let ix = Math.floor(u), iy = Math.floor(v), fx = u - ix, fy = v - iy;
  if (ix < 0) { ix = 0; fx = 0; } else if (ix >= w - 1) { ix = w - 2; fx = 1; } if (iy < 0) { iy = 0; fy = 0; } else if (iy >= h - 1) { iy = h - 2; fy = 1; }
  const i = iy * w + ix; return (D[i] * (1 - fx) + D[i + 1] * fx) * (1 - fy) + (D[i + w] * (1 - fx) + D[i + w + 1] * fx) * fy;
}
const cl = (v, a, b) => v < a ? a : v > b ? b : v;
const tIdx = (F, x, y) => cl(Math.floor(y), 0, F.h - 1) * F.w + cl(Math.floor(x), 0, F.w - 1);
/** true where the water under world position (x,y) is frozen right now (winter + still water) */
export function isFrozen(world, x, y) { if (ENV.season !== 3) return false; const F = fields(world); return F.anyWater && F.still[tIdx(F, x, y)] === 1; }

/* ---------- water ---------- */
const WCOL = { // [shallow, mid, deep, abyss] x [row a, row b], wavelet highlight per band
  0: [['#6cbde3', '#74c4e8'], ['#4f9fcf', '#57a8d8'], ['#4593c7', '#4b9acd'], ['#3d86b8', '#448dc0']],
  3: [['#7fb9d6', '#87c0db'], ['#5d9cc0', '#66a5c8'], ['#5290b6', '#5997bc'], ['#4884ab', '#4f8bb2']],
};
const WHI = { 0: ['#c4e8f7', '#a6d8f0', '#8ccbe8', '#7fc0e0'], 3: ['#dceef6', '#cfe6f2', '#b4d6e8', '#a3cae0'] };
const BANKC = { 1: ['#a4967a', '#93866b', '#b5a88c', '#7d7460'], 2: ['#d6c492', '#c9b683', '#e0d0a2', '#b3a070'] };
/** painter for water tiles: fn(wx, wy) -> hex */
export function waterPaint(world) {
  const F = fields(world), w = F.w, h = F.h, winter = ENV.season === 3, COL = WCOL[winter ? 3 : 0], HI = WHI[winter ? 3 : 0];
  const snowB = ['#eef3f6', '#e2eaf0', '#f6fafc', '#b9c8d6'];
  return (x, y) => {
    const PX = Math.floor((x - y) * 16), PY = Math.floor((x + y) * 8), i = tIdx(F, x, y);
    const d = dAt(F.shore, w, h, x, y), e = d - .5, n1 = vnoise(x * .37, y * .37, 5), bt = (BAYER[((PY & 3) << 2) | (PX & 3)] + .5) / 16, frozen = winter && F.still[i] === 1;
    const n2 = e < 1.1 || frozen ? vnoise(x * 1.9, y * 1.9, 8) : 0; /* fine noise is only used near the shore and on ice */
    const bk = F.bank[i];
    if (bk && e < .07) { // soft bank reaching into the water (rounds the staircase of ponds and beaches)
      const B = winter && bk === 1 ? snowB : BANKC[bk]; if (e > .0) return B[3]; const k = hash2(PX, PY, 17); return k < .1 ? B[1] : k > .9 ? B[2] : B[0];
    }
    if (frozen) { // frozen pond
      if (e < .2 + n2 * .22) return e < .12 + n2 * .1 || bt < .5 ? '#f2f7fa' : '#dfeaf1';
      const c1 = vnoise(x * .9 + 40, y * .9, 31), drift = vnoise(x * .55, y * .55, 33) + n2 * .25;
      if (drift > .86) return drift > .93 || bt < (drift - .86) / .07 ? '#f2f7fa' : '#dcebf3';
      // cracks: thin lines where two noise cells meet; skate scratches: short curved strokes
      const cr = Math.abs(vnoise(x * .45, y * .45, 35) - .5); if (cr < .012 && n2 > .3) return '#9dbfd3';
      const sx = Math.floor(PX / 28), sy = Math.floor(PY / 12), hs = hash2(sx, sy, 37); if (hs < .3) { const lx = PX - sx * 28 - Math.floor(hash2(sx, sy, 38) * 14), ly = PY - sy * 12 - Math.floor(hash2(sx, sy, 39) * 9); if (lx >= 0 && lx < 10 && ly === ((lx * lx) >> 5)) return '#e9f4f9'; }
      return c1 > .62 ? '#c4dcea' : c1 < .3 ? '#d6e8f1' : (PY & 1) ? '#cde2ee' : '#d1e5f0';
    }
    // shoreline
    if (e >= 1.1) { /* open water: no shore work */ } else if (dAt(F.sea, w, h, x, y) < 9) {
      if (e < .15 + n1 * .12) return n2 > .78 ? HI[0] : '#f4fbfe';
      if (e < .3 + n1 * .14) return bt < .55 ? '#f4fbfe' : HI[0];
      const sw = Math.abs(e - (.62 + n1 * .3)); if (sw < .06 && n2 > .38) return '#dff2fa';
    } else if (winter) { // ice shelf along inland shores
      if (e < .22 + n1 * .3) return e < .1 || n2 > .5 ? '#eaf3f8' : '#d3e5ef'; if (e < .3 + n1 * .3) return '#a9c8da';
    } else if (e < .1) return HI[0];
    // depth bands, dithered where they meet
    const dd = d + (n1 - .5) * 1.5; let b = dd < 1.35 ? 0 : dd < 3.7 ? 1 : dd < 7.6 ? 2 : 3;
    const edge = b === 0 ? 1.35 : b === 1 ? 3.7 : b === 2 ? 7.6 : 99, k = (edge - dd) / .55; if (k < 1 && bt > k * .5 + .5) b++;
    const k0 = b > 0 ? (dd - (b === 1 ? 1.35 : b === 2 ? 3.7 : 7.6)) / .55 : 9; if (k0 < 1 && bt > k0 * .5 + .5) b--;
    // wavelets: hashed, staggered cells; a short crest with a curl, fewer and dimmer in deep water
    const cy = Math.floor(PY / 9), qx = PX + (cy & 1) * 13 + Math.floor(hash2(cy, 3, 41) * 26), cx = Math.floor(qx / 26), hc = hash2(cx, cy, 6);
    if (hc < (b === 0 ? .62 : b === 1 ? .5 : .4)) {
      const len = 3 + Math.floor(hash2(cx, cy, 7) * 6), lx = qx - cx * 26 - Math.floor(hash2(cx, cy, 8) * (24 - len)), ly = PY - cy * 9 - Math.floor(hash2(cx, cy, 9) * 7);
      if (ly === 0 && lx >= 0 && lx < len) return HI[b]; if (ly === 1 && lx >= len - 1 && lx < len + 2) return HI[b];
      if (hc < .16 && ly === 2 && lx >= 1 && lx < len - 1) return dk(COL[b][0], .1);
    }
    return COL[b][PY & 1];
  };
}
/** wrap a soft land painter (grass, sand...) so tiles facing water get a bank strip along the smoothed shoreline */
export function bankWrap(world, f0, kind) {
  const F = fields(world), w = F.w, h = F.h, winter = ENV.season === 3, B = winter && kind === 1 ? ['#eef3f6', '#e2eaf0', '#f6fafc', '#b9c8d6'] : BANKC[kind];
  return (x, y) => {
    const d = dAt(F.shore, w, h, x, y); if (d < .2) return f0(x, y);
    const PX = Math.floor((x - y) * 16), PY = Math.floor((x + y) * 8);
    if (d < .29) return ((PX + PY) & 1) ? f0(x, y) : B[1];
    const k = hash2(PX, PY, 17); return k < .1 ? B[1] : k > .9 ? B[2] : B[0];
  };
}
/** does this tile need the bank wrapper? -> 0 | 1 | 2 */
export const bankOf = (world, tx, ty) => { const F = fields(world); return F.anyWater ? F.bank[ty * F.w + tx] : 0; };

/* ---------- winter cover ---------- */
const SN = ['#eef3f6', '#e4ecf2', '#c6d3df', '#f8fbfd']; // snow, snow tone 2, rim shade, sparkle
/**
 * Wrap a ground painter with snow for the winter. Paved ground: banked along kerbs, verges and walls, trodden clear in the middle.
 * Roads: ploughed, slush along the kerb. Loose ground: mostly covered, in drifts.
 */
export function snowWrap(world, t, f0) {
  const F = fields(world), w = F.w, h = F.h;
  let cov; // cov(x,y) -> coverage value; snow where > 0
  if (PAVED.has(t)) cov = (x, y) => { const d = dAt(F.pave, w, h, x, y); if (d < .55) return .65; const a = (1.28 - d) * .9 + (vnoise(x * .8, y * .8, 21) - .5) * .75 + (vnoise(x * 2.3, y * 2.3, 22) - .5) * .22 - (d > 1.3 ? .12 : 0); if (a > 0 || d < 1.6) return a; const o = vnoise(x * .42 + 9, y * .42, 19) + (vnoise(x * 2.1, y * 2.1, 22) - .5) * .12 - .8; return o > a ? o : a; };
  else if (t === GT.asphalt) cov = (x, y) => { const d = dAt(F.road, w, h, x, y); if (d > .9) return -1; return (.68 - d) * 1.6 + (vnoise(x * 1.1, y * 1.1, 23) - .5) * .28; };
  else if (t === GT.tarmac) cov = (x, y) => vnoise(x * .5, y * .5, 24) * .8 + vnoise(x * 1.9, y * 1.9, 25) * .25 - .78;
  else if (t === GT.rock || t === GT.ballast) cov = (x, y) => vnoise(x * .7, y * .7, 26) * .8 + vnoise(x * 2.1, y * 2.1, 27) * .3 - .56;
  else cov = (x, y) => vnoise(x * .6, y * .6, 28) * .8 + vnoise(x * 1.8, y * 1.8, 29) * .3 - .34;
  const road = t === GT.asphalt, wetc = new Map();
  const damp = hx => { let c = wetc.get(hx); if (!c) wetc.set(hx, c = mix(hx, '#5d6577', road ? .1 : .13)); return c; };
  return (x, y) => {
    const v = cov(x, y);
    if (v > 0) {
      if (v < .1 && bay(x, y) > v / .1 * .7 + .3) return damp(f0(x, y));
      if (road) return v < .22 || hash2(Math.floor((x - y) * 16), Math.floor((x + y) * 8), 30) < .12 ? '#b8c2cd' : '#dde5eb';
      if (v < .32 && cov(x + .11, y + .11) <= 0) return SN[2];
      return vnoise(x * .33, y * .33, 20) > .58 ? SN[1] : SN[0];
    }
    return damp(f0(x, y)); // cleared ground reads a little damp and darker
  };
}

/* ---------- outskirts: the land and water beyond the map edge, fading into haze ---------- */
export const OUT = 2;      // chunks of outskirts around the map
const FADE0 = 8, FADE1 = 21, HAZE = '#9fd6e8';
const TREES = ['prop.nature.tree.pine', 'prop.nature.tree.fir', 'prop.nature.tree.spruce', 'prop.nature.tree.oak', 'prop.nature.tree.maple', 'prop.nature.tree.birch'];
/** distance (tiles) of a point beyond the map rectangle */
export const beyond = (world, x, y) => Math.hypot(x < 0 ? -x : x > world.w ? x - world.w : 0, y < 0 ? -y : y > world.h ? y - world.h : 0);
/** dither drop + haze level for a distance beyond the edge: -> 0..1 (1 = gone) */
export const fadeAt = d => d <= FADE0 ? 0 : d >= FADE1 ? 1 : (d - FADE0) / (FADE1 - FADE0);
export const hazeAt = d => Math.min(.5, Math.max(0, (d - 3) / 16) * .5);
function landUse(world, x, y) { // patchwork cell -> 0 meadow, 1 forest, 2 wheat, 3 crop rows, 4 ploughed; -1 hedge line between fields
  const cx = Math.floor(x / 9), cy = Math.floor(y / 7), k = hash2(cx, cy, 51);
  const north = y < 0 || (x < 0 && y < 200), east = x >= world.w, airport = (y < 0 && x > 262) || (east && y < 140);
  if (airport) return k < .75 ? 0 : 1;
  let u; if (north) u = k < .62 ? 1 : k < .86 ? 0 : 2 + Math.floor(hash2(cx, cy, 52) * 3); else if (east) u = k < .2 ? 1 : k < .42 ? 0 : 2 + Math.floor(hash2(cx, cy, 52) * 3); else u = k < .4 ? 1 : k < .65 ? 0 : 2 + Math.floor(hash2(cx, cy, 52) * 3);
  if (u >= 2) { const fx = x - cx * 9, fy = y - cy * 7; if (fx < 1 || fy < 1) return -1; }
  return u;
}
/** ground type and height model outside the map */
export function outskirts(world) {
  const w = world.w, h = world.h, gt = world.gt;
  const edgeT = (tx, ty) => gt[cl(ty, 0, h - 1) * w + cl(tx, 0, w - 1)];
  const type = (tx, ty) => { // tile type outside the map
    const ox = tx < 0 || tx >= w, oy = ty < 0 || ty >= h, e = edgeT(tx, ty);
    if (isWet(e)) return e; if (ox && oy) return GT.grass;
    return e === GT.asphalt || e === GT.sidewalk ? e : GT.grass;
  };
  const flatNear = (ix, iy) => { // 0..1: how far (0 = on it) the nearest road / water continuation is, so hills leave them level
    let best = 5; const ox = ix <= 0 || ix >= w, oy = iy <= 0 || iy >= h;
    for (let k = -4; k <= 4; k++) { const t = ox && !oy ? edgeT(ix, iy + k) : !ox && oy ? edgeT(ix + k, iy) : edgeT(ix + k, iy + k); if (isWet(t) || t === GT.asphalt || t === GT.sidewalk) best = Math.min(best, Math.abs(k)); }
    return cl((best - 1) / 3, 0, 1);
  };
  const H = (ix, iy) => { // vertex height outside the map: the edge height carried outward, plus rolling hills on land
    const base = world.H(ix, iy), d = Math.hypot(ix < 0 ? -ix : ix > w ? ix - w : 0, iy < 0 ? -iy : iy > h ? iy - h : 0); if (d < 1) return base;
    const amp = (ix > w ? 1.3 : 2.6) * cl((d - 1) / 9, 0, 1) * flatNear(ix, iy); if (amp <= 0) return base;
    const hill = vnoise(ix * .09 + 7, iy * .09 + 3, 55) * .75 + vnoise(ix * .23, iy * .23, 56) * .25;
    return base + Math.round(Math.max(0, hill - .3) * amp * 8) / 8;
  };
  return { type, H, edgeT };
}
/** painters for the patchwork fields */
export function fieldPaint(u) {
  const s = ENV.season;
  if (s === 3) { const a = '#e6edf2', b = '#d8e2ea', c = '#c9d6e0'; return u === 4 ? (x, y) => (Math.floor(y * 4) & 1) ? a : c : (x, y) => (Math.floor(y * 2) & 1) ? a : b; }
  if (u === 2) { const a = s === 0 ? '#9fcf6a' : s === 1 ? '#e0c867' : '#cdb26a', b = s === 0 ? '#93c460' : s === 1 ? '#d3ba5a' : '#bfa35c'; return (x, y) => { const k = hash2(Math.floor(x * 16), Math.floor(y * 16), 61); return (Math.floor(y * 4) % 4 === 0) ? b : k > .93 ? lt(a, .2) : a; }; }
  if (u === 3) { const a = s === 2 ? '#8a9a52' : '#5f9f52', b = '#7a5b41'; return (x, y) => (Math.floor(y * 2) & 1) ? a : (Math.floor(x * 8 + y * 8) & 1) ? b : dk(a, .15); }
  if (u === 4) return (x, y) => (Math.floor(y * 4) & 1) ? '#6f4e37' : '#7b583f';
  return null; // meadow / forest floor use the grass painter
}
/**
 * Trees of one outskirts chunk: [{ id, v (variant index), seed, x, y, d }] sorted back to front. Deterministic.
 * (the renderer draws the cached tree sprites over the chunk and fades them with the same dither as the ground)
 */
export function outskirtTrees(world, cx, cy, CH) {
  const O = outskirts(world), out = [], w = world.w, h = world.h;
  for (let ty = cy * CH; ty < cy * CH + CH; ty++) for (let tx = cx * CH; tx < cx * CH + CH; tx++) {
    if (tx >= 0 && ty >= 0 && tx < w && ty < h) continue; if (O.type(tx, ty) !== GT.grass) continue;
    const d = beyond(world, tx + .5, ty + .5); if (d > FADE1 - 1) continue;
    const front = tx >= w || ty >= h; if (front ? d < 2.6 : d < .8) continue;
    const u = landUse(world, tx, ty), k = hash2(tx, ty, 71), p = u === 1 ? .34 : u === 0 ? .035 : u === -1 ? .3 : 0;
    if (k >= p) continue;
    // keep clear of continued roads and the shoreline
    let ok = true; for (let dy = -1; dy <= 1 && ok; dy++) for (let dx = -1; dx <= 1; dx++) if (O.type(tx + dx, ty + dy) !== GT.grass && !(tx + dx >= 0 && ty + dy >= 0 && tx + dx < w && ty + dy < h)) { ok = false; break; }
    if (!ok) continue;
    const k2 = hash2(tx, ty, 72), north = ty < 0 || tx < 0;
    const id = u === -1 ? TREES[3 + Math.floor(k2 * 3)] : TREES[Math.floor(k2 * k2 * (north ? 1 : .4) * 6 + (north ? 0 : 3)) % 6];
    out.push({ id, v: Math.floor(hash2(tx, ty, 73) * 8), seed: 1 + Math.floor(hash2(tx, ty, 74) * 4), x: tx + (hash2(tx, ty, 75) > .5 ? .5 : 0), y: ty + (hash2(tx, ty, 76) > .5 ? .5 : 0), d });
  }
  out.sort((a, b) => (a.x + a.y) - (b.x + b.y));
  return out;
}
/** wrap a painter so it tints toward the haze and dithers away with distance beyond the edge */
export function hazeWrap(world, f0) {
  const cache = new Map();
  return (x, y) => {
    const d = beyond(world, x, y), q = fadeAt(d); if (q > 0 && bay(x, y) < q) return null;
    const c = f0(x, y), hz = Math.floor(hazeAt(d) * 10 + bay(x + 3.3, y + 1.7)); if (!hz || !c) return c;
    const key = c + hz; let m = cache.get(key); if (!m) cache.set(key, m = mix(c, HAZE, hz / 10)); return m;
  };
}
export { landUse, HAZE };
