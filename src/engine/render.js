// Frame renderer: ground chunks -> depth-sorted sprites -> ambient light map -> night lights.
import { WS, U, screenBox, renderJob, renderStep, renderResult } from './raster.js';
import { renderChunk, chunkJob, CH, outskirtChunks } from './ground.js';
import { toSpritePooled, objSprite, objSpriteIf, frontSprite, assetSprite, prebake, prebakeObj, bakePri, ageBakes, rushBake, sortBakes, bakeTick, spriteStats, sliceTest, workerTest, workerTestChar, workerObj, BAKE } from './sprites.js';
import { outskirtTrees, fadeAt, hazeAt } from './terrainfx.js';
import { ASSETS } from '../art/registry.js';
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

/* test switch (tools/occl_check.mjs --query "?occl=old"): the draw order as it was before the occlusion pass */
const OCCL = !(typeof location !== 'undefined' && /[?&]occl=old\b/.test(location.search || ''));
/* SOFT: set by behind(): how much its last answer counts when links contradict each other (sortItems). 0 = a hard link: one box really covers the other. 1, 2 = the two boxes cannot cover each
 * other (beside each other on screen, or one above and beside), the order is for what hangs over the boxes only: 1 with somebody who moves in it, 2 between two placed objects (the weakest: an
 * order by centre depth). */
let SOFT = 0;
function behind(p, q, m) {
  const A = p.B, B = q.B; SOFT = 0;
  // separation along x and along y (-1: A is behind, 1: A is in front, 0: ranges overlap)
  const sx = A[3] <= B[0] + 1e-6 ? -1 : B[3] <= A[0] + 1e-6 ? 1 : 0, sy = A[4] <= B[1] + 1e-6 ? -1 : B[4] <= A[1] + 1e-6 ? 1 : 0;
  if (m === 2) return behindLong(p, q, sx, sy);
  // separated on both axes in opposite senses (A is beside B on screen): the footprints cannot cover each other, only what hangs over them can (a tree's crown, a person's arms).
  // Two placed objects: one consistent order (centre depth), as ever (m = 0: the static world is drawn exactly as before the occlusion pass).
  // With somebody who moves (m = 1): the axis with the LARGER gap decides (= compare the two corners that face each other). That is what is true for the parts that can overlap, and it goes over into
  // the one-axis rule below without a jump when one walks past the end of a long thing (a counter, a fence); the centre depth said "in front" until the middle of it and "behind" after.
  if (sx && sy && sx !== sy) { SOFT = OCCL ? 2 - m : 0; if (m === 1) { const gx = sx < 0 ? B[0] - A[3] : A[0] - B[3], gy = sy < 0 ? B[1] - A[4] : A[1] - B[4]; if (gx !== gy) return gx > gy ? sx < 0 : sy < 0; } return A[0] + A[3] + A[1] + A[4] < B[0] + B[3] + B[1] + B[4]; }
  if (sx) return sx < 0; if (sy) return sy < 0;
  if (A[5] <= B[2] + 1e-6) return true; if (B[5] <= A[2] + 1e-6) return false;
  if (m === 1) { const fa = A[5] - A[2] <= .1, fb = B[5] - B[2] <= .1; if (fa !== fb) return fa; }   // somebody flat on the ground (the shadow of a plane that drifts over the street): under whatever stands in it
  return A[0] + A[3] + A[1] + A[4] + (A[2] + A[5]) * .01 < B[0] + B[3] + B[1] + B[4] + (B[2] + B[5]) * .01;
}
/*
 * ---------- vehicles and train cars (docs/reports/occlusion.md; owner msg 206) ----------
 * A long box has no single depth. The old rules compared centres whenever two boxes were not cleanly one behind the other; for a bus that says "the tree is in front" for half of the pass and
 * "behind" for the other half (the tree popped over the bus), and it contradicts the clean cases around it (bus behind the tree, tree behind the man, man behind the bus): the sort then has to drop one
 * of the three links, and it dropped a different one from frame to frame. Every pair with a vehicle or a train car in it (m = 2) is decided here instead:
 * - a TREE (any placed object whose picture hangs well over its sort box: the crown over the trunk) and a vehicle: the SIDE of the vehicle the trunk stands on decides (near side: in front,
 *   far side: behind), all the way along the vehicle and past its ends until the crown (r) has cleared the end by more than the trunk's distance from the side; only then the end decides
 *   (ahead of the nose: in front). By then the two no longer touch, so nothing is seen to change. A trunk that the vehicle's box touches by a hair (a bus pulling in to the kerb) still counts
 *   for its side.
 * - two vehicles that lie the same way in different lanes: the one in the nearer lane is in front, whoever is further along (lanes are closer together than a car is wide, so the boxes
 *   of two cars that pass each other overlap sideways: "who is further along" flipped as they passed).
 * - cleanly apart on the ground along one axis, or along both in the same sense: the nearer one is in front, as before.
 * - BESIDE each other on screen (behind along x, in front along y, or the other way round): the larger gap decides = the two corners that face each other are compared. That is what is true for a
 *   thin upright thing (a person, a post), and it goes over into the one-axis rule without a jump.
 * - one wholly ABOVE the other and apart on the ground in the other sense (a train on its deck and the next deck slab; a car under the viaduct and the train over it): the lower one can never
 *   cover the upper one, so the upper one is drawn later, if it is clear of the lower one's box by ZM (pictures stand a little taller than their boxes: a head) or by more than the gap on the ground.
 *   The old order "x, then y, then height" made loops train -> next slab -> the other train -> train: cars of one train cut into the other.
 * - boxes that reach INTO each other (somebody at the kerb whose box touches the bus by a hair, a car under a canopy): the axis along which they are least far in decides, not the centres.
 *   Two train cars at a right angle (a corner of the line; the cars are straight, so their boxes cross there): where one arm of the corner runs towards the camera and the other away, a fixed order.
 */
const ZM = .5;
function ovOf(ob) { const v = ob.vbl, B = ob.B; if (!v) return ob._ov = 0; let r = B[0] - ob.x - v[0], t = ob.x + v[3] - B[3]; if (t > r) r = t; t = B[1] - ob.y - v[1]; if (t > r) r = t; t = ob.y + v[4] - B[4]; if (t > r) r = t; return ob._ov = r > 3 ? 3 : r > 0 ? r : 0; }   // how far a placed object's picture hangs over its sort box on the ground (a tree: its crown over the trunk)
function behindLong(p, q, sx, sy) {
  const A = p.B, B = q.B, sz = A[5] <= B[2] + 1e-6 ? -1 : B[5] <= A[2] + 1e-6 ? 1 : 0;
  if (!sz && p.m !== q.m) {   /* one vehicle and something that hangs over its box: by the side */
    const lp = p.m === 2, ob = lp ? q.ob : p.ob, r = ob === null ? 0 : ob._ov !== undefined ? ob._ov : ovOf(ob);
    if (r > .3) {
      const L = lp ? A : B, O = lp ? B : A, ax = L[3] - L[0] >= L[4] - L[1]   /* the vehicle lies along x */, c = ax ? (O[1] + O[4]) / 2 : (O[0] + O[3]) / 2, l0 = ax ? L[1] : L[0], l1 = ax ? L[4] : L[3];
      if (c <= l0 || c >= l1) {
        let of = c >= l1;   // the thing is in front (it stands on the near side)
        const a0 = ax ? O[0] : O[1], a1 = ax ? O[3] : O[4], m0 = ax ? L[0] : L[1], m1 = ax ? L[3] : L[4], ga = a0 >= m1 ? a0 - m1 : m0 >= a1 ? m0 - a1 : -1;
        if (ga >= 0 && (a0 >= m1) !== of) { SOFT = 1; const gc = of ? (ax ? O[1] : O[0]) - l1 : l0 - (ax ? O[4] : O[3]); if (ga - r > (gc > 0 ? gc : 0)) of = !of; }   // past the end, on the other side of it
        return lp ? of : !of;
      }
      if ((lp ? p.e : q.e).thru) return !lp;   // it stands in the path of something that runs above the street (e.thru: a train car; two trees of the city reach up through the viaduct): the car is drawn over it
    }
  }
  if (!sz && p.m === 2 && q.m === 2) {   /* two vehicles that lie the same way, in different lanes (their boxes overlap sideways by less than half a car, or not at all): by the lane, not by who is further along */
    const wa = A[3] - A[0], da = A[4] - A[1], wb = B[3] - B[0], db = B[4] - B[1], ax = wa >= da;
    if (ax === (wb >= db)) {
      if (ax) { if (!(sx && sx === sy) && (A[4] < B[4] ? A[4] : B[4]) - (A[1] > B[1] ? A[1] : B[1]) < .5 * (da < db ? da : db)) { SOFT = sx ? 1 : 0; return A[1] + A[4] < B[1] + B[4]; } }
      else if (!(sx && sx === sy) && (A[3] < B[3] ? A[3] : B[3]) - (A[0] > B[0] ? A[0] : B[0]) < .5 * (wa < wb ? wa : wb)) { SOFT = sy ? 1 : 0; return A[0] + A[3] < B[0] + B[3]; }
    }
  }
  if (sx || sy) {
    const gx = sx < 0 ? B[0] - A[3] : sx > 0 ? A[0] - B[3] : 0, gy = sy < 0 ? B[1] - A[4] : sy > 0 ? A[1] - B[4] : 0; let s, g;
    if (sx && sy && sx !== sy) { SOFT = 1; if (gx > gy) { s = sx; g = gx; } else { s = sy; g = gy; } }
    else if (sx && (!sy || gx >= gy)) { s = sx; g = gx; } else { s = sy; g = gy; }
    if (sz && sz !== s) { const gz = sz < 0 ? B[2] - A[5] : A[2] - B[5]; SOFT = 1; if (gz >= ZM || gz > g) return sz < 0; }
    return s < 0;
  }
  if (sz) return sz < 0;
  /* in each other */
  { const fa = A[5] - A[2] <= .1, fb = B[5] - B[2] <= .1; if (fa !== fb) return fa; }   // something flat on the ground (a shadow that drifts over the street): under whatever stands on it
  if (p.m === 2 && q.m === 2) { const wa = A[3] - A[0], da = A[4] - A[1], wb = B[3] - B[0], db = B[4] - B[1], ax = wa >= da;
    if (ax !== (wb >= db) && (ax ? wa : da) > 2.5 && (ax ? db : wb) > 2.5) {   // two long ones at a right angle (train cars at a corner of the line: the cars are straight, so their boxes cross there): X lies along x, Y along y
      const X = ax ? A : B, Y = ax ? B : A, ox = ((X[0] > Y[0] ? X[0] : Y[0]) + (X[3] < Y[3] ? X[3] : Y[3])) / 2, oy = ((X[1] > Y[1] ? X[1] : Y[1]) + (X[4] < Y[4] ? X[4] : Y[4])) / 2, dx = (X[0] + X[3]) / 2 > ox, dy = (Y[1] + Y[4]) / 2 > oy;
      if (dx !== dy) return ax ? !dx : dx;   // X runs towards the camera from the corner and Y away from it: X is in front; the other way round: Y. (Both towards it, or both away: as below.)
    } }
  const ax = B[0] - A[3], bx = A[0] - B[3], ay = B[1] - A[4], by = A[1] - B[4], az = B[2] - A[5] - ZM, bz = A[2] - B[5] - ZM, X = ax > bx ? ax : bx, Y = ay > by ? ay : by, Z = az > bz ? az : bz;   // least far in
  if (X > Y && X > Z) { if (ax !== bx) return ax > bx; } else if (Y > X && Y > Z) { if (ay !== by) return ay > by; } else if (Z > X && Z > Y) { if (az !== bz) return az > bz; }
  return A[0] + A[3] + A[1] + A[4] + (A[2] + A[5]) * .01 < B[0] + B[3] + B[1] + B[4] + (B[2] + B[5]) * .01;
}
/*
 * ---------- the outline of a long thing ----------
 * The sort only compares two things whose sprites' rectangles overlap. A long box seen from the camera is a slanted band: most of its rectangle is empty (for a 12-unit train car about three quarters),
 * so a long vehicle got an order with everything in those empty corners: a car under the viaduct "in front of" the train above it, a person two lanes away. None of those can be seen, but each is a
 * link in the sort, and three of them soon contradict each other (the train is over the deck, the deck is over the car, the car is "in front of" the train); the sort then has to drop one link, and it
 * dropped a different one from frame to frame: cars of one train cut into the other, a tree jumped over a bus.
 * So a long entity carries the six-sided OUTLINE of its box on screen (item.h, world px, 4 px of slack like the sprite's padding): [x0, x1 of screen x, lo, hi of (y + x / 2), lo, hi of (y - x / 2)],
 * and it is only compared with what reaches into that outline (pairMiss: against a placed object's own outline, or another long thing's; against the sprite rectangle of anything else, hexMiss).
 */
const HEXP = 4, hexOn = e => { const b = e.vb || e.bb; return b !== undefined && (b[2] - b[0] > 2.5 || b[3] - b[1] > 2.5); };
/* outline against outline: [x0, x1, lo, hi of (y + x / 2), lo, hi of (y - x / 2)] each (exact: the two six-sided shapes have the same three directions) */
function hexHex(h, g) { return g[0] >= h[1] || g[1] <= h[0] || g[2] >= h[3] || g[3] <= h[2] || g[4] >= h[5] || g[5] <= h[4]; }
/* the outline of a placed object (its painted box, ob.vbl), cached on it */
function obHex(ob) { const v = ob.vbl, x = ob.x, y = ob.y, z = ob.z; return ob._oh = [(x + v[0] - y - v[4]) * U - HEXP, (x + v[3] - y - v[1]) * U + HEXP, (x + v[0] - z - v[5]) * U - HEXP, (x + v[3] - z - v[2]) * U + HEXP, (y + v[1] - z - v[5]) * U - HEXP, (y + v[4] - z - v[2]) * U + HEXP]; }
/* can the two items not touch on screen? Each by its outline if it has one (p.h: a placed object, a long entity), else by the box of its sprite's own pixels (p.t).
 * (Glow that reaches out of a long entity's box, a train's headlight beam, is not part of this: what the beam falls on is not "in front of" or "behind" the train.) */
function pairMiss(p, q) { const hp = p.h, hq = q.h; return hp !== null ? (hq !== null ? hexHex(hp, hq) : hexMiss(hp, q.t)) : hexMiss(hq, p.t); }
function hexMiss(h, r) { return r[0] >= h[1] || r[2] <= h[0] || r[1] + r[0] * .5 >= h[3] || r[3] + r[2] * .5 <= h[2] || r[1] - r[2] * .5 >= h[5] || r[3] - r[0] * .5 <= h[4]; }
/** topological depth sort of items {B: world AABB, r: screen rect, k: sort hint}. n: only the first n items of L; out: array to fill (perf: the renderer reuses its lists; the scratch arrays below are reused too, so a frame allocates nothing here)
 * Links that contradict each other (A behind B behind C behind A): the walk below drops whichever link it meets last. Occlusion pass: links have a weight (SOFT, see behind()). If the walk dropped a
 * link that is not of the weakest kind, the frame is sorted again without the weakest links, starting from the order just found, and if that still drops a hard link, once more by the hard links alone
 * (resort): a weaker link never undoes a stronger one. Only for loops with somebody who moves in them; all other frames are sorted exactly as before. */
let sDeps = [], sCnt = new Int32Array(256), sOrder = new Int32Array(256), sStack = new Int32Array(1024), sSt = new Uint8Array(256), sPos = new Int32Array(256);
const SB = 1 << 24, SB2 = 1 << 25, SM = SB - 1; export const SORT = { resorts: 0 };   // a link = the index of the item behind (+ SB: soft 1, + SB2: soft 2)
export function sortItems(L, n = L.length, out = []) {
  if (sCnt.length < n) { sCnt = new Int32Array(n * 2); sOrder = new Int32Array(n * 2); sSt = new Uint8Array(n * 2); sStack = new Int32Array(n * 8); sPos = new Int32Array(n * 2); }
  const deps = sDeps, cnt = sCnt, st = sSt, order = sOrder, stack = sStack; while (deps.length < n) deps.push([]);
  cnt.fill(0, 0, n); st.fill(0, 0, n);
  for (let i = 0; i < n; i++) { const p = L[i], a = p.r, ma = p.m, ha = p.h; for (let j = i + 1; j < n; j++) { const b = L[j].r; if (a[0] >= b[2] || b[0] >= a[2] || a[1] >= b[3] || b[1] >= a[3]) continue; const q = L[j], mj = q.m; if ((ha !== null || q.h !== null) && pairMiss(p, q)) continue; if (behind(p, q, ma > mj ? ma : mj)) deps[j][cnt[j]++] = i + SOFT * SB; else deps[i][cnt[i]++] = j + SOFT * SB; } }
  /* order = indices by sort hint k, stable (an insertion sort: the same order as the Array.sort((p, q) => L[p].k - L[q].k) it replaces, without its temporary arrays) */
  for (let i = 0; i < n; i++) { const k = L[i].k; let j = i - 1; while (j >= 0 && L[order[j]].k > k) { order[j + 1] = order[j]; j--; } order[j + 1] = i; }
  let sp = 0, m = 0, bad = false;   // (st: 1 = being walked, 2 = drawn; bad: a link that is not of the weakest kind was dropped)
  for (let o = 0; o < n; o++) { const root = order[o]; if (st[root]) continue; stack[sp++] = root; stack[sp++] = 0; st[root] = 1; while (sp) { const idx = stack[sp - 1], i = stack[sp - 2]; if (idx < cnt[i]) { stack[sp - 1]++; const d = deps[i][idx], c = d & SM; if (!st[c]) { st[c] = 1; stack[sp++] = c; stack[sp++] = 0; } else if (st[c] === 1) { let k = sp - 2; for (; k >= 0; k -= 2) { const x = stack[k]; if (L[x].m) { if (d < SB2) bad = true; break; } if (x === c) break; }   /* (only a loop with somebody who moves in it: loops among placed objects alone are left as they always were) */
      if (k >= 0 && stack[k] === c) for (k = sp - 2; k >= 0; k -= 2) { const x = stack[k], q = L[x].ob; if (q) q._pd = q._pd || true; if (x === c) break; } }   /* night light (pools behind buildings): the placed objects of such a loop are noted. The link dropped here is one this walk happened to meet; another list with the same objects in it (a mask tile's) may drop another, so their light is laid in the frame's own order (ob._pd, see _occPrep). */ } else { sp -= 2; st[i] = 2; const it = L[i]; it._i = i; out[m++] = it; } } }
  if (bad) { SORT.resorts++; if (resort(L, n, out, SB2)) resort(L, n, out, SB); }
  if (out.length !== m) out.length = m;
  return out;
}
/* the next try: walk only the links below `lim` (SB2: without the weakest, SB: the hard ones alone), starting from the items in the order the last try drew them. That is the last order, mended
 * where it broke such a link. Returns true if a hard link was dropped again. */
function resort(L, n, out, lim) {
  const deps = sDeps, cnt = sCnt, st = sSt, stack = sStack, ord = sPos; let sp = 0, m = 0, bad = false;
  for (let o = 0; o < n; o++) ord[o] = out[o]._i;
  st.fill(0, 0, n);
  for (let o = 0; o < n; o++) { const root = ord[o]; if (st[root]) continue; stack[sp++] = root; stack[sp++] = 0; st[root] = 1; while (sp) { const idx = stack[sp - 1], i = stack[sp - 2]; if (idx < cnt[i]) { stack[sp - 1]++; const d = deps[i][idx]; if (d < lim) { const c = d & SM; if (!st[c]) { st[c] = 1; stack[sp++] = c; stack[sp++] = 0; } else if (st[c] === 1 && d < SB) bad = true; } } else { sp -= 2; st[i] = 2; out[m++] = L[i]; } } }
  return bad;
}

/* the depth sort in plain form, for the test hook Renderer.sortCheck (tools/perf.mjs --verify): both must give the same order. (Until the occlusion pass this was the sort as it was before the perf pass,
 * word for word; it now has the outline test and the further tries of sortItems, written out the slow way.) */
function sortItemsRef(L) {
  const n = L.length, deps = new Array(n), soft = new Array(n);
  for (let i = 0; i < n; i++) { deps[i] = []; soft[i] = []; }
  for (let i = 0; i < n; i++) { const a = L[i].r; for (let j = i + 1; j < n; j++) { const b = L[j].r; if (a[0] >= b[2] || b[0] >= a[2] || a[1] >= b[3] || b[1] >= a[3]) continue; if ((L[i].h || L[j].h) && pairMiss(L[i], L[j])) continue; if (behind(L[i], L[j], Math.max(L[i].m, L[j].m))) { deps[j].push(i); soft[j].push(SOFT); } else { deps[i].push(j); soft[i].push(SOFT); } } }
  const order = new Array(n); for (let i = 0; i < n; i++) order[i] = i; order.sort((p, q) => L[p].k - L[q].k);
  /* walk(lim): follow the links whose weight is below lim, drop a link that points back into the walk -> { out: indices in draw order, bad: a link of weight < lim - 1 was dropped, hard: a hard link was } */
  const walk = lim => { const out = [], st = new Uint8Array(n), stack = []; let bad = false, hard = false;
    for (const root of order) { if (st[root]) continue; stack.push(root, 0); st[root] = 1; while (stack.length) { const idx = stack[stack.length - 1], i = stack[stack.length - 2], d = deps[i]; if (idx < d.length) { stack[stack.length - 1]++; const c = d[idx], w = soft[i][idx]; if (w >= lim) continue; if (!st[c]) { st[c] = 1; stack.push(c, 0); } else if (st[c] === 1) { if (w < 2 && !bad) for (let k = stack.length - 2; k >= 0; k -= 2) { if (L[stack[k]].m) { bad = true; break; } if (stack[k] === c) break; } if (!w) hard = true; } } else { stack.length -= 2; st[i] = 2; out.push(i); } } }
    return { out, bad, hard }; };
  let w = walk(3);
  if (w.bad) { order.length = 0; for (const i of w.out) order.push(i); w = walk(2); if (w.hard) { order.length = 0; for (const i of w.out) order.push(i); w = walk(1); } }
  return w.out.map(i => L[i]);
}
let WID = 0;
const pools = new Map();
function poolSprite(r, col) { // banded, dithered ellipse of light
  const key = r + col; let c = pools.get(key); if (c) return c;
  const rx = Math.round(r * U * 1.2), ry = Math.round(rx / 2); c = mk(rx * 2 + 1, ry * 2 + 1); const x = c.getContext('2d'), id = x.createImageData(c.width, c.height), d = id.data;
  const n = parseInt(col.slice(1), 16), R0 = n >> 16, G0 = n >> 8 & 255, B0 = n & 255;
  for (let j = 0; j < c.height; j++) for (let i = 0; i < c.width; i++) { const a = (i - rx) / rx, b = (j - ry) / ry, q = Math.sqrt(a * a + b * b); if (q >= 1) continue; const odd = (i + j) & 1; let k = q < .35 ? 1 : q < .55 ? (odd ? 1 : .7) : q < .75 ? .7 : q < .9 ? (odd ? .7 : .35) : (odd ? .35 : 0); const o = (j * c.width + i) * 4; d[o] = R0 * k; d[o + 1] = G0 * k; d[o + 2] = B0 * k; d[o + 3] = 255; }
  x.putImageData(id, 0, 0); c._rx = rx; c._ry = ry; c._rgb = [R0, G0, B0];   /* night light: the pool's half size and colour, read back when it is drawn into the light mask */ pools.set(key, c); return c;
}

/*
 * ---------- night light (docs/reports/nightlight.md) ----------
 * The light mask (ambient colour + dithered pools) is multiplied over the finished frame. Until now that put the dither pattern across
 * everybody who stood in a pool. Now the pools stay what they are for the ground and the static world, and everything that moves (people,
 * pets, vehicles) and every upright thing at their scale (posts, trees, bins, benches, parked cars) is put into the mask as ONE flat colour:
 * the light at its feet (the pools that reach it, summed, in a few bands). Their shapes are put into the mask in draw order, and wherever
 * something that keeps the pattern stands in front (a building, a wall, the front of a big piece somebody sits on) the pattern is put
 * back, so the pools still show on those. Then the mask is multiplied over the frame as before. Nothing is drawn twice on the frame itself and the static world is untouched.
 */
const NLQ = typeof location !== 'undefined' ? /[?&]nightlight=(\w+)/.exec(location.search || '') : null;
/* mode: 'new' | 'old' (the mask over everything, as before; ?nightlight=old or G.renderer.nightLight('old')). props: placed objects can be lit as a whole too (false = only what moves; ?nightlight=noprops or G.renderer.nightLight('noprops' | 'props')); gen: counts changes of `props`. step: one band = this much of a pool's full strength (the pool's own rings are 1 / .7 / .35 with dithered halves in between, so .175 = one ring).
 * max: most bands (pools add up). hyst: a band only changes when the light is this far (in bands) past the edge. rate: frames between two band steps (a change of several bands is walked through, never jumped).
 * big: an entity whose sprite is larger than this many px keeps the pattern like the static world (train cars, airliners, parade floats, stage screens); vehicles are always lit as a whole.
 * tiles / tile / tileMax / tileWait: the mask tiles (Renderer._maskTiles; ?nightlight=notiles paints the mask directly every frame, as before).
 * occ / low / over / ramp: a building hides the pools behind it (see "pools behind buildings" below; ?nightlight=noocc or G.renderer.nl.occ = false: pools across everything, as before).
 * propFoot / propBig: which placed objects are lit as a whole (wholeOb below: footprint in tiles, painted box in px). promote / perFrame / slots / budget: the flat-colour copies (silGet below). */
export const NL = { mode: NLQ && NLQ[1] === 'old' ? 'old' : 'new', props: !(NLQ && NLQ[1] === 'noprops'), trees: !(NLQ && NLQ[1] === 'notrees'), gen: 1, tiles: !(NLQ && NLQ[1] === 'notiles'), occ: !(NLQ && NLQ[1] === 'noocc'), low: .5, over: 1.05, ramp: .75, tile: 256, tileMax: 24, tileWait: 20, step: .175, max: 8, hyst: .22, rate: 3, big: 26000, propFoot: 4.5, propBig: 7000, promote: 6, promoteBig: 3, perFrame: 2, slots: 4, budget: 2.5e6 };
let LB = new Float32Array(7 * 64), nLB = 0, nLBw = 0   /* the first nLBw are the world's own lights, the rest come from scene.lights hooks (headlights, stage lights) */, lX0 = 0, lY0 = 0, lX1 = 0, lY1 = 0; const LO = [];   /* LO[i] = the object the light belongs to (a lamp post is not lit by its own lamp), or null */   // the pools drawn into the mask this frame: centre x, y, half size x, y (canvas px), colour x strength
let LW = new Float32Array(3 * 64), LA = new Float32Array(64); const LS = [];   // per pool: where its light stands in the world (x, y, z in tiles), the strength it was drawn with, its sprite
function addLight(cx, cy, c, a, owner, wx, wy, wz) {
  if (!c._rgb || !(a > 0)) return; if ((nLB + 1) * 7 > LB.length) { let n = new Float32Array(LB.length * 2); n.set(LB); LB = n; n = new Float32Array(LW.length * 2); n.set(LW); LW = n; n = new Float32Array(LA.length * 2); n.set(LA); LA = n; }
  LS[nLB] = c; LA[nLB] = a; LW[nLB * 3] = wx; LW[nLB * 3 + 1] = wy; LW[nLB * 3 + 2] = wz;
  { const x0 = cx - c._rx, y0 = cy - c._ry, x1 = cx + c._rx, y1 = cy + c._ry; if (!nLB) { lX0 = x0; lY0 = y0; lX1 = x1; lY1 = y1; } else { if (x0 < lX0) lX0 = x0; if (y0 < lY0) lY0 = y0; if (x1 > lX1) lX1 = x1; if (y1 > lY1) lY1 = y1; } }   // lX0..lY1 = the box around all pools
  LO[nLB] = owner || null; const o = nLB++ * 7, q = c._rgb; LB[o] = cx; LB[o + 1] = cy; LB[o + 2] = c._rx; LB[o + 3] = c._ry; LB[o + 4] = q[0] * a; LB[o + 5] = q[1] * a; LB[o + 6] = q[2] * a;
}
const HP = []; let HN = new Float32Array(3 * 32), nHP = 0;   // the pools the hooks drew this frame: sprite, x, y, strength (Renderer._nightE needs to know where the mask is more than its tiles)
/* what scene.lights(m, cam, pool) hooks draw on: passes everything on to the mask and notes the pools (headlights, stage lights) */
class LightTap {
  constructor() { this.m = null; this.w = null; this.cx = 0; this.cy = 0; }   // w: the world, when the pools' places in it are wanted (pools behind buildings), cx / cy: the camera
  get globalAlpha() { return this.m.globalAlpha; } set globalAlpha(v) { this.m.globalAlpha = v; }
  get globalCompositeOperation() { return this.m.globalCompositeOperation; } set globalCompositeOperation(v) { this.m.globalCompositeOperation = v; }
  get fillStyle() { return this.m.fillStyle; } set fillStyle(v) { this.m.fillStyle = v; }
  get canvas() { return this.m.canvas; }
  save() { this.m.save(); } restore() { this.m.restore(); } fillRect(x, y, w, h) { this.m.fillRect(x, y, w, h); }
  drawImage(img, x, y, w, h, a, b, c, d) { const m = this.m; if (w === undefined) { m.drawImage(img, x, y); if (img._rgb) { const a = m.globalAlpha; if (this.w !== null) unWS(this.w, x + img._rx + this.cx, y + img._ry + this.cy); addLight(x + img._rx, y + img._ry, img, a, null, uwX, uwY, uwZ); if (a > 0) { HP[nHP] = img; if ((nHP + 1) * 3 > HN.length) { const n = new Float32Array(HN.length * 2); n.set(HN); HN = n; } HN[nHP * 3] = x; HN[nHP * 3 + 1] = y; HN[nHP * 3 + 2] = a; nHP++; } } } else if (a === undefined) m.drawImage(img, x, y, w, h); else m.drawImage(img, x, y, w, h, a, b, c, d); }
}
/* the point of the terrain that is drawn at world px (sx, sy) -> uwX, uwY, uwZ (a pool drawn by a hook comes without its place in the world) */
let uwX = 0, uwY = 0, uwZ = 0;
function unWS(world, sx, sy) { let z = 0, x = 0, y = 0; for (let k = 0; k < 3; k++) { const a = sx / U, b = (sy + z * U) / (U / 2); x = (a + b) / 2; y = (b - a) / 2; z = world.heightAt(x, y); } uwX = x; uwY = y; uwZ = z; }
/* the light at a point (canvas px) = the pools that reach it, summed (sR, sG, sB); sT = some pool overlaps the rectangle x0..y1 (the sprite) at all.
 * A pool's strength falls off like the average of its dithered rings: 1 in the core, .7 at 65%, .35 at 90%, 0 at the rim. */
let sR = 0, sG = 0, sB = 0, sT = false, tX0 = 0, tY0 = 0, tX1 = 0, tY1 = 0;   // (tX0..tY1 = the box around those pools)
function sample(px, py, x0, y0, x1, y1, skip) {
  sR = sG = sB = 0; sT = false; if (x0 >= lX1 || x1 <= lX0 || y0 >= lY1 || y1 <= lY0) return;
  for (let i = 0, o = 0; i < nLB; i++, o += 7) {
    if (skip && LO[i] === skip) continue; const cx = LB[o], cy = LB[o + 1], rx = LB[o + 2], ry = LB[o + 3]; if (x0 >= cx + rx || x1 <= cx - rx || y0 >= cy + ry || y1 <= cy - ry) continue;
    { const nx = cx < x0 ? x0 : cx > x1 ? x1 : cx, ny = cy < y0 ? y0 : cy > y1 ? y1 : cy, ex = (nx - cx) / rx, ey = (ny - cy) / ry; if (ex * ex + ey * ey >= 1) continue; }   // (the rectangle's nearest point is outside the ellipse)
    if (!sT) { sT = true; tX0 = cx - rx; tY0 = cy - ry; tX1 = cx + rx; tY1 = cy + ry; } else { if (cx - rx < tX0) tX0 = cx - rx; if (cy - ry < tY0) tY0 = cy - ry; if (cx + rx > tX1) tX1 = cx + rx; if (cy + ry > tY1) tY1 = cy + ry; }
    const dx = (px - cx) / rx, dy = (py - cy) / ry, q2 = dx * dx + dy * dy; if (q2 >= 1) continue;
    const q = Math.sqrt(q2), s = q < .3 ? 1 : q < .65 ? 1 - (q - .3) * (.3 / .35) : q < .9 ? .7 - (q - .65) * 1.4 : .35 - (q - .9) * 3.5;
    sR += LB[o + 4] * s; sG += LB[o + 5] * s; sB += LB[o + 6] * s;
  }
}
let AMB = '', aR = 0, aG = 0, aB = 0;
/* the band of entity (or sitter) e for the light just sampled, with hysteresis and one step at a time; then its flat mask colour e._ni (int) / e._ns (css) = ambient + light. Returns the band. */
function band(e, fr, al) {
  const mx = sR > sG ? (sR > sB ? sR : sB) : (sG > sB ? sG : sB), v = Math.min(NL.max, mx / (255 * al * NL.step)); let b = e._nb;
  if (b === undefined || e._nf !== fr - 1) { b = Math.floor(v + .4); e._nt = fr; }   // first seen (or back on screen): no fade-in
  else { const d = v - b; if ((d > .6 + NL.hyst || d < -.4 - NL.hyst) && fr - e._nt >= NL.rate) { b += d > 0 ? 1 : -1; e._nt = fr; } }
  e._nf = fr; e._nb = b;
  if (mx > 0) { const hr = sR / mx, hg = sG / mx, hb = sB / mx; if (e._nhr === undefined || Math.abs(hr - e._nhr) > .05 || Math.abs(hg - e._nhg) > .05 || Math.abs(hb - e._nhb) > .05 || b !== e._nhk) { e._nhr = hr; e._nhg = hg; e._nhb = hb; e._nhk = b; } }   // the light's colour, kept until it has clearly changed
  else if (e._nhr === undefined) e._nhr = e._nhg = e._nhb = 1;
  const k = b * NL.step * al * 255, r = Math.min(255, aR + e._nhr * k) & 252, g = Math.min(255, aG + e._nhg * k) & 252, bl = Math.min(255, aB + e._nhb * k) & 252, ci = r << 16 | g << 8 | bl;   // (6 bits a channel: the same colours come up again and again, which is what the flat-colour copies need)
  if (ci !== e._ni) { e._ni = ci; e._ns = '#' + (0x1000000 + ci).toString(16).slice(1); }
  return b;
}
/* the glow pass (Renderer.draw): the boxes that hold glow so far this frame */
let GR = new Float32Array(4 * 128), nGR = 0, gX0 = 0, gY0 = 0, gX1 = 0, gY1 = 0, vW = 0, vH = 0;   // (vW, vH = the canvas size this frame)
function addG(x0, y0, x1, y1) { if (x0 < 0) x0 = 0; if (y0 < 0) y0 = 0; if (x1 > vW) x1 = vW; if (y1 > vH) y1 = vH; if (x1 <= x0 || y1 <= y0) return;   /* (only what is on the canvas: cutting costs by the pixel, on or off it) */ if ((nGR + 1) * 4 > GR.length) { const n = new Float32Array(GR.length * 2); n.set(GR); GR = n; } const o = nGR++ * 4; GR[o] = x0; GR[o + 1] = y0; GR[o + 2] = x1; GR[o + 3] = y1; if (nGR === 1) { gX0 = x0; gY0 = y0; gX1 = x1; gY1 = y1; } else { if (x0 < gX0) gX0 = x0; if (y0 < gY0) gY0 = y0; if (x1 > gX1) gX1 = x1; if (y1 > gY1) gY1 = y1; } }
/* is this entity lit as a whole? (the rest keeps the pattern, like the static world, and hides lit things behind it) */
function isWhole(e, sp) {
  const n = e.nl; if (n !== undefined) return n === 'whole';   // an entity can say so itself: nl = 'whole' | 'ground'
  if (sp.l === sp.c) return false;   // a picture that is all light (a screen, a tank)
  if ((e.bb || BB)[4] < .08) return false;   // lies flat on the ground (a shadow, a ripple)
  return !!e.isVehicle || sp.w * sp.h <= NL.big;
}
/* is this placed object lit as a whole? Things that stand on the ground at the scale of a person or a street prop: posts, lamps, signs, bins, benches, barrels, planters, parked cars, furniture.
 * Buildings, walls, big trees and other large pieces keep the pools on them (a wall takes a pool like the ground does); so does anything flat. An asset or an object can say nl: 'whole' | 'ground'. Cached on the object. */
function wholeOb(ob, sp) {
  const n = ob.nl || (ob.a && ob.a.nl), B = ob.B; let w; ob._ng = NL.gen;
  if (n) w = n === 'whole'; else if (!NL.props) w = false; else if (ob.a && ob.a.tags && ob.a.tags.indexOf('tree') >= 0) w = !!NL.trees && sp.l !== sp.c;   /* (trees: lit as a whole too since owner msg 198, any size; NL.trees = false gives the old look: they keep the pattern) */ else { const q = sp.bx, px = q ? (q[2] - q[0]) * (q[3] - q[1]) : sp.w * sp.h; w = B[5] - B[2] > .12 && sp.l !== sp.c && B[3] - B[0] <= NL.propFoot && B[4] - B[1] <= NL.propFoot && (px <= NL.propBig || (typeof ob.id === 'string' && ob.id.startsWith('veh.'))); }   // (by the size of what is painted: the mask work costs by the pixel. A parked car counts like a moving one.)
  ob._no = n === 'ground' || !!(ob.a && ob.a.tags && ob.a.tags.indexOf('fountain') >= 0);   /* takes every pool, like the ground (nl: 'ground'; a fountain: a basin of water under the open sky) */
  return ob._nw = w;
}
/* How the flat colours get into the mask (see Renderer._nightE). The mask is opaque. For a thing that is lit as a whole, its sprite is punched out of the mask (destination-out) and the hole is
 * filled with its colour (a destination-over fill of its box only reaches the hole). For a thing that keeps the pattern and stands in front of lit things, its sprite is punched out the same way and the
 * hole is filled from a copy of the mask as it was before any of this (ambient + pools). Done in draw order, that is exactly "who is in front wins", with fades and see-through objects blending
 * for free, and needs no copy of any sprite.
 * Punching costs about three times a plain draw, so for a sprite that keeps being lit in the same colour (everything that stands still: props, trees, people waiting) a flat-colour copy of it
 * is made after NL.promote frames and from then on simply drawn into the mask (one plain draw; same pixels). See silGet.
 * The steps are collected first (OS / ON / OC) and then run in one go. What is put back comes from the mask tiles (Renderer._maskTiles) when the mask was drawn from them; a copy of the whole mask is only made when there are no tiles (dusk, dawn) or a moving light reaches one of the places.
 * ER = this frame's boxes of lit things (something in front is only put back where it overlaps one). */
let OS = [], OC = [], OX = [], ON = new Float32Array(8 * 128), nOP = 0, nlLit = 0, nlCut = 0, nlCopy = 0, nlOcc = 0;
/* one step: type 0 punch + fill with col / 1 punch + put back (from the mask tiles if they hold it, else as 3) / 2 draw a flat-colour copy / 3 punch + fill with the thing's own light (ambient + the pools it takes, occPut);
 / 4 punch + fill from its kept own-light copy (col; a see-through thing: the same arithmetic as 3);
 * src = sprite (0, 1, 3, 4) or canvas (2); the part sx, sy, sw, sh of it, drawn at dx, dy; a = alpha or undefined; it = the item it belongs to (1, 3; null: something that takes every pool) */
function pushOp(type, src, sx, sy, sw, sh, dx, dy, a, col, it) { OX[nOP] = it || null; if ((nOP + 1) * 8 > ON.length) { const n = new Float32Array(ON.length * 2); n.set(ON); ON = n; } const o = nOP * 8; OS[nOP] = src; OC[nOP] = col; nOP++; ON[o] = type; ON[o + 1] = sx; ON[o + 2] = sy; ON[o + 3] = sw; ON[o + 4] = sh; ON[o + 5] = dx; ON[o + 6] = dy; ON[o + 7] = a === undefined ? -1 : a; }
let ER = new Float32Array(4 * 128), EK = new Uint8Array(128), eSkip = false, nER = 0, eX0 = 0, eY0 = 0, eX1 = 0, eY1 = 0;   // (EK[i] = 1: the box of the own light of a thing that keeps the pattern (pools behind buildings), not of something lit as a whole. eSkip: leave those out: outside the pools such a box holds the ambient colour, which a thing in the dark and a kept own-light copy in front of it have there anyway)
function addE(x0, y0, x1, y1, k) { if (x0 < 0) x0 = 0; if (y0 < 0) y0 = 0; if (x1 > vW) x1 = vW; if (y1 > vH) y1 = vH; if (x1 <= x0 || y1 <= y0) return; if ((nER + 1) * 4 > ER.length) { const n = new Float32Array(ER.length * 2); n.set(ER); ER = n; const k = new Uint8Array(EK.length * 2); k.set(EK); EK = k; } EK[nER] = k | 0; const o = nER++ * 4; ER[o] = x0; ER[o + 1] = y0; ER[o + 2] = x1; ER[o + 3] = y1; if (nER === 1) { eX0 = x0; eY0 = y0; eX1 = x1; eY1 = y1; } else { if (x0 < eX0) eX0 = x0; if (y0 < eY0) eY0 = y0; if (x1 > eX1) eX1 = x1; if (y1 > eY1) eY1 = y1; } }
/* does the box x0..y1 overlap any of the n boxes in R? If so hX0..hY1 = the box around the overlaps (inside x0..y1): only that part has to be worked on */
let hX0 = 0, hY0 = 0, hX1 = 0, hY1 = 0, hN = 0, hA = 0, camX = 0, camY = 0;   // (hN = how many boxes overlap, hA = their overlaps' area added up)
/*
 * A placed object's sprite is the rectangle around its box seen from the camera: a six-sided outline, with empty corners (for a building: about half of the rectangle). Somebody who stands
 * beside a building is inside its rectangle but not behind it. hexOf(ob) = that outline in world px: [left, right, c1, c2, c3, c4, ax] with, for X = x - ax:
 * y <= min(c1 - X / 2, c2 + X / 2) (the two lower edges) and y >= max(c3 - X / 2, c4 + X / 2) (the two upper edges); 3 px of slack all round, like the sprite's own padding. Cached on the object.
 */
function hexOf(ob) {
  const v = ob.vbl, ax = (ob.x - ob.y) * U, ay = (ob.x + ob.y) * U / 2 - ob.z * U;
  return ob._hx = [ax + (v[0] - v[4]) * U - 3, ax + (v[3] - v[1]) * U + 3, ay + (v[3] - v[2]) * U + 3, ay + (v[4] - v[2]) * U + 3, ay + (v[0] - v[5]) * U - 3, ay + (v[1] - v[5]) * U - 3, ax];
}
function hitBox(R, n, x0, y0, x1, y1, hx) {
  let hit = false; hN = 0; hA = 0;
  for (let i = 0, o = 0; i < n; i++, o += 4) { const a = R[o], b = R[o + 1], c = R[o + 2], d = R[o + 3]; if (x0 >= c || x1 <= a || y0 >= d || y1 <= b || (eSkip && R === ER && EK[i] === 1)) continue;
    if (hx) { /* the box must also reach into the object's outline (see hexOf) */ const t0 = b + camY, t1 = d + camY, ax = hx[6]; let lo = a + camX - ax, hi = c + camX - ax, v; if ((v = hx[0] - ax) > lo) lo = v; if ((v = hx[1] - ax) < hi) hi = v; if ((v = 2 * (t0 - hx[3])) > lo) lo = v; if ((v = 2 * (hx[4] - t1)) > lo) lo = v; if ((v = 2 * (hx[2] - t0)) < hi) hi = v; if ((v = 2 * (t1 - hx[5])) < hi) hi = v; if (lo >= hi) continue; }
    const p = a > x0 ? a : x0, q = b > y0 ? b : y0, r = c < x1 ? c : x1, t = d < y1 ? d : y1; hN++; hA += (r - p) * (t - q); if (!hit) { hit = true; hX0 = p; hY0 = q; hX1 = r; hY1 = t; } else { if (p < hX0) hX0 = p; if (q < hY0) hY0 = q; if (r > hX1) hX1 = r; if (t > hY1) hY1 = t; } }
  return hit;
}
/* rows sy .. sy + sh of sprite sp (drawn at dx, dy; a = its alpha or undefined) are lit as a whole in colour col. Only the box of the sprite's own pixels is worked on (sp.bx), and of that,
 * when the thing stands in the dark (dim: its colour is the ambient colour) and nothing lit is behind it, only the part the pools reach (kx0..ky1, canvas px): the rest of the mask has that colour already. */
function litDraw(sp, sy, sh, dx, dy, ci, col, a, fr, dim, kx0, ky0, kx1, ky1) {
  const q = sp.bx; let x0 = q ? q[0] : 0, y0 = q ? q[1] : 0, x1 = q ? q[2] : sp.w, y1 = q ? q[3] : sp.h; if (y0 < sy) y0 = sy; if (y1 > sy + sh) y1 = sy + sh;
  if (dim) { eSkip = true; dim = !(nER && hitBox(ER, nER, dx + x0, dy + y0, dx + x1, dy + y1, null)); eSkip = false; }   /* (the own light of a thing behind it that keeps the pattern does not count: outside the pools that is the ambient colour too) */
  if (dim) { if (x0 < kx0 - dx) x0 = kx0 - dx; if (y0 < ky0 - dy) y0 = ky0 - dy; if (x1 > kx1 - dx) x1 = kx1 - dx; if (y1 > ky1 - dy) y1 = ky1 - dy; }   // (not when something lit stands behind it: that has to be covered whole)
  if (x1 <= x0 || y1 <= y0) return; nlLit++; const c = sp.im && q ? silGet(sp, ci, col, fr) : null;
  if (c) { nlSil++; pushOp(2, c, x0 - q[0], y0 - q[1], x1 - x0, y1 - y0, dx + x0, dy + y0, a, null); } else pushOp(0, sp, x0, y0, x1 - x0, y1 - y0, dx + x0, dy + y0, a, col);
  addE(dx + x0, dy + y0, dx + x1, dy + y1);
}
/* the same rows of a sprite that keeps the pattern and stands in front of lit things: the mask's own pattern is put back there (hx: the object's outline, see hexOf) */
function cutDraw(sp, sy, sh, dx, dy, a, hx, it) {
  const ty = it !== null && (it.e !== null || it.ob._pd) ? 3 : 1;   // (3: something the mask tiles do not hold: whatever moves, a thing whose picture keeps changing)
  const q = sp.bx; let x0 = dx + (q ? q[0] : 0), y0 = dy + (q ? q[1] : 0), x1 = dx + (q ? q[2] : sp.w), y1 = dy + (q ? q[3] : sp.h); if (y0 < dy + sy) y0 = dy + sy; if (y1 > dy + sy + sh) y1 = dy + sy + sh;
  if (!nER || x0 >= eX1 || x1 <= eX0 || y0 >= eY1 || y1 <= eY0 || !hitBox(ER, nER, x0, y0, x1, y1, hx)) return; nlCut++;
  /* only the part of it that overlaps lit things: the box around the overlaps, or, when that is much larger than the overlaps themselves (a tower in front of three people), each overlap on its own (a step costs about as much as 2000 px of punching) */
  if (hN > 1 && hN * 2000 + hA < (hX1 - hX0) * (hY1 - hY0)) { for (let i = 0, o = 0; i < nER; i++, o += 4) { if (x0 >= ER[o + 2] || x1 <= ER[o] || y0 >= ER[o + 3] || y1 <= ER[o + 1] || (eSkip && EK[i] === 1)) continue; const p = ER[o] > x0 ? ER[o] : x0, r = ER[o + 1] > y0 ? ER[o + 1] : y0, u = ER[o + 2] < x1 ? ER[o + 2] : x1, t = ER[o + 3] < y1 ? ER[o + 3] : y1; pushOp(ty, sp, p - dx, r - dy, u - p, t - r, p, r, a, null, it); } }
  else { pushOp(ty, sp, hX0 - dx, hY0 - dy, hX1 - hX0, hY1 - hY0, hX0, hY0, a, null, it); }
}
/*
 * ---------- pools behind buildings (docs/reports/pool_occlusion.md; owner msg 219) ----------
 * The mask is flat: a pool is an ellipse on the screen and used to lie across whatever stood in front of the lit ground (a circle of light on the wall of a tower whose lamp is on the far side).
 * Now every thing that keeps the pattern (a building, a wall, a deck, a big prop; a train car) takes only the pools of the lamps that can light the faces it shows:
 *   - a lamp on the camera side of one of its two near faces (x >= its far-x edge or y >= its far-y edge: beside or in front of it): yes, as before ("a wall takes a pool like the ground does");
 *   - its own lamp (a shop's door light), and a lamp within its footprint that is not far below it (under its roof, on its deck): yes, as before;
 *   - a lamp BEHIND it (nearer than both near faces in x and in y): no. The pool stays on the ground beside the thing and is gone from its silhouette;
 *   - a thing well overhead (its underside more than NL.over above the lamp: a viaduct deck over a street lamp): no;
 *   - a low thing (under NL.low high: a kerb, a flower bed, a step), a thing whose top is no higher than the foot of the lamp (the next piece of the platform the lamp stands on, the track bed
 *     beside it, a roof below a lamp up on a terrace), a fountain, anything marked nl: 'ground': every pool, like the ground. What one sees of them is their top, and that lies open to the lamp.
 * This depends on where things stand, never on the camera or on who walks where: nothing pops. A moving light (headlights: the pools scene.lights hooks draw) fades in over NL.ramp tiles as it
 * comes out from behind a thing. takes() is the rule.
 * How: in a thing's silhouette, where a pool it does not take reaches it, the mask is punched out and filled with the thing's own light: ambient + the pools it does take, added in the usual
 * order (occPut: exact at the silhouette, and with the thing's alpha when it is see-through, so the pool shows through a faded building in proportion, like the ground behind does).
 * In draw order, and whatever stands in front of such a place gets its own light back the same way. For the world's own lamps and placed objects this is done once, when a mask tile is
 * painted (_occBake), so a frame drawn from tiles has nothing to do for them. Left to the frame (ob._pd; the tiles are painted without them) are: things that are see-through, the members of a
 * ring (see sortItems) and things whose picture keeps changing: their own light is kept as a canvas (_occOwn) and drawn in the frame's order, one plain draw each, with the thing's alpha. The frame also
 * works on moving lights and on big entities (a train car), by occPut. When the mask is painted directly (dusk, dawn: its colours change) the same pass runs over the frame's own item list (_occPass).
 * Only in worlds with poolOcc (the city): in a room the lights are the room's, on everything.
 */
let uN = 0, uX0 = 0, uY0 = 0, uX1 = 0, uY1 = 0;
/* how much of pool j (of LB) a thing with box B takes on its faces: 0 none .. 1 like the ground. ob: the placed object, or null */
function takes(B, j, ob) {
  if (ob !== null && (LO[j] === ob || ob._no === true)) return 1;
  const o = j * 3, lx = LW[o], ly = LW[o + 1], lz = LW[o + 2];
  if (B[2] > lz + NL.over) return 0;
  if (B[5] - B[2] < NL.low || B[5] - lz < NL.low) return 1;
  if (j < nLBw) return lx >= B[3] || ly >= B[4] || (lx > B[0] && ly > B[1]) ? 1 : 0;
  /* a moving light: by its distance from the ground behind the thing (the two strips x < x0, y < y1 and x < x1, y < y0), so that it comes up evenly as the car drives out from behind */
  const ax = lx - B[0], ay = ly - B[4], bx = lx - B[3], by = ly - B[1], d1 = ax <= 0 ? (ay <= 0 ? 0 : ay) : ay <= 0 ? ax : Math.sqrt(ax * ax + ay * ay), d2 = bx <= 0 ? (by <= 0 ? 0 : by) : by <= 0 ? bx : Math.sqrt(bx * bx + by * by), d = d1 < d2 ? d1 : d2;
  return d >= NL.ramp ? 1 : d / NL.ramp;
}
/* does the box a..d (mask px) reach into a placed object's outline (hexOf)? */
function hexBox(hx, a, b, c, d) { const t0 = b + camY, t1 = d + camY, ax = hx[6]; let lo = a + camX - ax, hi = c + camX - ax, v; if ((v = hx[0] - ax) > lo) lo = v; if ((v = hx[1] - ax) < hi) hi = v; if ((v = 2 * (t0 - hx[3])) > lo) lo = v; if ((v = 2 * (hx[4] - t1)) > lo) lo = v; if ((v = 2 * (hx[2] - t0)) < hi) hi = v; if ((v = 2 * (t1 - hx[5])) < hi) hi = v; return lo < hi; }
/* the pools from..to (of LB) that reach the thing's own pixels x0..y1 (mask px; hx: its outline or null) and that it does not take in full (all: every pool that reaches it): how many; uX0..uY1 = the box around where they reach it */
function hidden(B, ob, hx, x0, y0, x1, y1, from, to, all) {
  uN = 0; if (to <= from || x0 >= lX1 + 1 || x1 <= lX0 || y0 >= lY1 + 1 || y1 <= lY0) return 0;
  for (let j = from, o = from * 7; j < to; j++, o += 7) {
    let a = LB[o] - LB[o + 2], b = LB[o + 1] - LB[o + 3], c = LB[o] + LB[o + 2] + 1, d = LB[o + 1] + LB[o + 3] + 1; if (x0 >= c || x1 <= a || y0 >= d || y1 <= b) continue;
    if (!all && takes(B, j, ob) >= 1) continue;
    if (a < x0) a = x0; if (b < y0) b = y0; if (c > x1) c = x1; if (d > y1) d = y1; if (hx !== null && !hexBox(hx, a, b, c, d)) continue;
    if (!uN++) { uX0 = a; uY0 = b; uX1 = c; uY1 = d; } else { if (a < uX0) uX0 = a; if (b < uY0) uY0 = b; if (c > uX1) uX1 = c; if (d > uY1) uY1 = d; }
  }
  return uN;
}
/* a thing's own light in the part x0..y1 (mask px): ambient + the pools it takes (B, ob: see takes; B null: every pool), added in the order the mask adds its pools, at 0, 0 of the canvas fc (fx).
 * Returns how many pools; with none nothing is drawn (the light is the ambient colour) unless `always`. */
function ownLight(fx, fc, x0, y0, x1, y1, B, ob, amb, always) {
  const w = x1 - x0, h = y1 - y0; let k = 0;
  for (let j = always ? -1 : 0, o = j * 7; j < nLB; j++, o += 7) {   // (j = -1: the ambient colour alone)
    let p = 0, q = 0, r = 0, t = 0, f = 1;
    if (j >= 0) { p = LB[o] - LB[o + 2]; q = LB[o + 1] - LB[o + 3]; r = p + 2 * LB[o + 2] + 1; t = q + 2 * LB[o + 3] + 1; if (x0 >= r || x1 <= p || y0 >= t || y1 <= q) continue; f = B === null ? 1 : takes(B, j, ob); if (f <= 0) continue; }
    if (!k++) { if (fc.width < w || fc.height < h) { fc.width = Math.max(fc.width, w); fc.height = Math.max(fc.height, h); } fx.globalCompositeOperation = 'source-over'; fx.globalAlpha = 1; fx.fillStyle = amb; fx.fillRect(0, 0, w, h); fx.globalCompositeOperation = 'lighter'; }
    if (j < 0) continue; const px = p, py = q; if (p < x0) p = x0; if (q < y0) q = y0; if (r > x1) r = x1; if (t > y1) t = y1; fx.globalAlpha = LA[j] * f; fx.drawImage(LS[j], p - px, q - py, r - p, t - q, p - x0, q - y0, r - p, t - q);
  }
  return always ? k - 1 : k;
}
/* in the part x0..y1 (mask px) of the mask m, give the sprite sp (drawn at ox, oy; a = its alpha) its own light: put together on the scratch canvas fc (ownLight), then the sprite is punched out of the
 * mask and the hole filled with it (exact at the silhouette; with the alpha of a see-through thing the pool behind shows through in proportion). */
function occPut(m, fx, fc, sp, ox, oy, x0, y0, x1, y1, a, B, ob, amb) {
  const w = x1 - x0, h = y1 - y0, k = ownLight(fx, fc, x0, y0, x1, y1, B, ob, amb, false);
  m.globalCompositeOperation = 'destination-out'; m.globalAlpha = a; m.drawImage(sp.c, x0 - ox, y0 - oy, w, h, x0, y0, w, h); m.globalAlpha = 1; m.globalCompositeOperation = 'destination-over';
  if (k) m.drawImage(fc, 0, 0, w, h, x0, y0, w, h); else { m.fillStyle = amb; m.fillRect(x0, y0, w, h); }
}
/* a placed object whose picture is not painted yet: may it be something that keeps the pattern? (wholeOb without the sprite: by the rectangle its picture is painted in, which is never smaller than the picture) */
function mayHide(ob) { if (ob._ng === NL.gen) return !ob._nw; const sb = ob.sb, w = wholeOb(ob, { l: 0, c: 1, w: sb[2] - sb[0], h: sb[3] - sb[1] }); ob._ng = 0; return !w; }   // (not remembered: the real picture decides)
/* the places a pass has worked on so far (_occPass): whatever stands in front of one gets its own light back */
let QR = new Float32Array(4 * 64), nQR = 0;
function addQ(x0, y0, x1, y1) { if ((nQR + 1) * 4 > QR.length) { const n = new Float32Array(QR.length * 2); n.set(QR); QR = n; } const o = nQR++ * 4; QR[o] = x0; QR[o + 1] = y0; QR[o + 2] = x1; QR[o + 3] = y1; }
/*
 * flat-colour copies of sprite shapes ("sils"). Only for sprites out of the sprite cache (sp.im: their canvases never change). A sprite remembers up to NL.slots colours it was lit in
 * (sp._nl: { ci colour, n frames asked, fr last frame, c the copy or null }); a colour asked for in NL.promote frames (NL.promoteBig for sprites over 2000 px: punching costs by the pixel) gets its copy, at most NL.perFrame new copies a frame (making one costs
 * about as much as twenty draws). All copies together stay under NL.budget px (x 4 bytes); the ones not drawn for longest go first.
 */
const SILS = []; let silPx = 0, silNew = 0, silMade = 0, nlSil = 0;
function silGet(sp, ci, col, fr) {
  const L = sp._nl || (sp._nl = []); let s = null, old = null;
  for (let i = 0; i < L.length; i++) { const q = L[i]; if (q.ci === ci) { s = q; break; } if (!old || q.fr < old.fr) old = q; }
  if (s) { if (s.c) { s.fr = fr; return s.c; } if (s.fr !== fr) { s.fr = fr; s.n++; } }
  else if (L.length < NL.slots) { const q = sp.bx; L.push({ ci, n: 1, fr, c: null, k: null, x: null, sp, px: (q[2] - q[0]) * (q[3] - q[1]) }); return null; }
  else { if (old.fr === fr) return null; s = old; if (s.c) { s.k = s.c; s.c = null; } s.ci = ci; s.n = 1; s.fr = fr; return null; }   // (the colour it is lit in has changed: the oldest slot starts counting for the new one; its canvas is kept for reuse and stays in the budget)
  if (s.n < (s.px > 2000 ? NL.promoteBig : NL.promote) || silNew >= NL.perFrame) return null;
  silNew++; silMade++; let c = s.k; s.k = null; const q = sp.bx, w = q[2] - q[0], h = q[3] - q[1]; if (!c) { c = mk(w, h); s.x = c.getContext('2d'); SILS.push(s); silPx += s.px; } const x = s.x;
  x.globalCompositeOperation = 'copy'; x.drawImage(sp.c, q[0], q[1], w, h, 0, 0, w, h); x.globalCompositeOperation = 'source-in'; x.fillStyle = col; x.fillRect(0, 0, w, h);   // (the copy is the size of the sprite's own pixels)
  s.c = c; if (silPx > NL.budget) silTrim(fr); return c;
}
/* every ~500 frames: copies that have not been drawn for 1800 frames (half a minute) go, day or night (they also keep their sprite alive after the sprite cache has let it go) */
function silAge(fr) { let w = 0; for (let i = 0; i < SILS.length; i++) { const s = SILS[i]; if (fr - s.fr > 1800) { const L = s.sp._nl, j = L ? L.indexOf(s) : -1; if (j >= 0) L.splice(j, 1); silPx -= s.px; s.c = s.k = s.x = null; } else SILS[w++] = s; } SILS.length = w; }
function silTrim(fr) {
  SILS.sort((a, b) => a.fr - b.fr); let n = 0;
  while (n < SILS.length && silPx > NL.budget * .7 && SILS[n].fr < fr) { const s = SILS[n++], L = s.sp._nl, i = L ? L.indexOf(s) : -1; if (i >= 0) L.splice(i, 1); silPx -= s.px; s.c = s.k = s.x = null; }
  SILS.splice(0, n);
}

const BAY4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
/** the trees of one outskirts chunk as one canvas {c, x, y} (world px), thinned by the same distance dither as the ground; null if none */
function treeLayer(world, cx, cy) {
  const L = outskirtTrees(world, cx, cy, CH); if (!L.length) return null;
  const its = []; let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
  for (const t of L) {
    const a = ASSETS.get(t.id); if (!a) continue; const vs = a.variants && a.variants.length ? a.variants : [{}], p = Object.assign({}, vs[t.v % vs.length], { seed: t.seed });
    let spr; try { spr = assetSprite(a, p, false); } catch (e) { spr = null; } if (!spr) continue;
    const s = WS(t.x, t.y, world.H(Math.round(t.x), Math.round(t.y))), x = Math.round(s[0]) + spr.x, y = Math.round(s[1]) + spr.y;
    its.push(spr, x, y, t.d); if (x < bx0) bx0 = x; if (y < by0) by0 = y; if (x + spr.w > bx1) bx1 = x + spr.w; if (y + spr.h > by1) by1 = y + spr.h;
  }
  if (!its.length) return null;
  const c = mk(bx1 - bx0, by1 - by0), g = c.getContext('2d');
  for (let i = 0; i < its.length; i += 4) g.drawImage(its[i].c, its[i + 1] - bx0, its[i + 2] - by0);
  // fade: drop pixels by ordered dither, per tree, by how far beyond the edge it stands
  const id = g.getImageData(0, 0, c.width, c.height), d = id.data, W = c.width; let touched = false;
  for (let i = 0; i < its.length; i += 4) {
    const q = fadeAt(its[i + 3] + 1.5), hz = hazeAt(its[i + 3] + 1.5); if (q <= 0 && hz <= 0) continue; touched = true; const sp = its[i], ox = its[i + 1] - bx0, oy = its[i + 2] - by0, sd = sp._px || (sp._px = sp.c.getContext('2d').getImageData(0, 0, sp.w, sp.h).data);
    /* only this tree's own pixels: tint toward the haze (#9fd6e8), then drop by ordered dither */
    for (let y = 0; y < sp.h; y++) for (let x = 0; x < sp.w; x++) { if (!sd[(y * sp.w + x) * 4 + 3]) continue; const X = ox + x, Y = oy + y, o = (Y * W + X) * 4; if ((BAY4[(((Y + by0) & 3) << 2) | ((X + bx0) & 3)] + .5) / 16 < q) { d[o + 3] = 0; continue; } d[o] = sd[(y * sp.w + x) * 4] * (1 - hz) + 159 * hz; d[o + 1] = sd[(y * sp.w + x) * 4 + 1] * (1 - hz) + 214 * hz; d[o + 2] = sd[(y * sp.w + x) * 4 + 2] * (1 - hz) + 232 * hz; }
  }
  if (touched) g.putImageData(id, 0, 0);
  return { c, x: bx0, y: by0 };
}

/*
 * ---------- seating (docs/reports/seating.md) ----------
 * A seated character is not sorted on its own: it is drawn as part of the piece of furniture it sits on, right after the piece, and then
 * the parts of the piece that stand between the sitter and the camera (backrest seen from behind, the bench in front of the legs, a table
 * edge, the next row) are
 * drawn again over the sitter. That part is the piece's art on the camera side of a plane through the sitter (seatOverlay below; the art
 * is painted once more with a depth cut, engine/sprites.js frontSprite), so the piece's own sprite, the bake pipeline and the depth sort
 * are untouched.
 */
/* test switch (tools/perf.mjs --html build.html,build.html?noseat): ?noseat draws sitters the old way, as separately sorted items */
const HOP_MS = 180, HOP_PX = 4;
const SEATING = !(typeof location !== 'undefined' && /[?&]noseat\b/.test(location.search || ''));
const isSitter = e => e.seated || e.pose === 'sit' || (e.poseOpts ? !!e.poseOpts.seated : e.pose === 'type' && e.z > .2);   // ('type' is drawn seated unless poseOpts.seated is false)
const SQ = [];
/** the object a seated entity sits on (cached on the entity until it moves), or null */
function seatObj(world, e) {
  if (e._sw === world && e._sx === e.x && e._sy === e.y && e._sv === world.version) { const o = e._so; return o && !o.hidden ? o : null; }
  e._sw = world; e._sx = e.x; e._sy = e.y; e._sv = world.version; e._so = null;
  const px = (e.x - e.y) * U, py = (e.x + e.y) * U / 2 - e.z * U; SQ.length = 0; world.query(px - 2, py - 2, px + 2, py + 20, SQ);
  let best = null, ba = 1e9;
  for (let i = 0; i < SQ.length; i++) {
    const ob = SQ[i], B = ob.B; if (ob.size[2] <= .06 || ob.noSit) continue; const a = ob.a, has = !!(a && (a.seats || a.seatsFor)), m = has ? .16 : 0;
    if (e.x < B[0] - m || e.x > B[3] + m || e.y < B[1] - m || e.y > B[4] + m) continue;
    const dz = e.z - B[2]; if (dz > B[5] - B[2] + .45 || dz < (has ? -.05 : .15)) continue;   // a piece without seat data only counts when the sitter is really up on it
    const ar = (B[3] - B[0]) * (B[4] - B[1]) + (has ? 0 : 1e3); if (ar < ba) { ba = ar; best = ob; }
  }
  SQ.length = 0; return e._so = best;
}
/**
 * the part of the piece that is drawn again over a sitter (a sprite like objSprite's, or null). The cut plane comes from the way the sitter
 * faces, in the piece's placed frame: facing away from the camera (dir 3 / 2) everything from just behind the sitter's back towards the
 * camera (backrest, the seat's front, the legs of the piece, the rows in front); facing the camera (dir 1 / 0) everything beyond the feet
 * (a table edge, the next row). An asset can override with seatCut(p, seat) -> { ax, v } | null (un-flipped local coords; null = nothing in front).
 * Cached on the sitter until it moves, turns, or the piece's sprite is baked again.
 */
function seatOverlay(ob, base, e) {
  if (e._ob === ob && e._od === e.dir && e._obs === base && e._ox === e.x && e._oy === e.y) return e._ov;
  e._ob = ob; e._od = e.dir; e._obs = base; e._ox = e.x; e._oy = e.y;
  const lx = e.x - ob.x, ly = e.y - ob.y, d = e.dir, fl = ob.flip, a = ob.a; let ax = d & 1, v = (d & 1 ? ly : lx) + (d >= 2 ? .15 : .5);
  if (a && a.seatCut) { let c; try { c = a.seatCut(ob.p || {}, fl ? { x: ly, y: lx, z: e.z - ob.z, dir: [1, 0, 3, 2][d] } : { x: lx, y: ly, z: e.z - ob.z, dir: d }); } catch (err) { c = undefined; } if (c === null) return e._ov = null; if (c) { ax = fl ? 1 - c.ax : c.ax; v = c.v; } }
  if (v >= (ax ? ob.vbl[4] : ob.vbl[3]) || base.w * base.h > 160000) return e._ov = null;   // (nothing of the piece is in front; or a piece too big to paint twice for one sitter)
  return e._ov = frontSprite(ob, ax, Math.round(v * 32) / 32);
}

/**
 * seating follow-ups: does this sprite (drawn at world px sx, sy) cover a seated character whose seat point is at (fx, fay)? The character's head and chest are a 7 x 15 px box above the seat point; the
 * answer is yes when the sprite's solid pixels fill half of the head (the top 8 rows) or 40% of the whole box (head = true: the head only, for the piece the character sits on, whose backrest rightly
 * covers the chest). Looked up once per object and place: the answer is kept on the object until its sprite or the offset changes, so a frame costs a few compares. The box is copied to a small canvas of
 * its own and read there (no read-back from the sprite's canvas, see frontSprite).
 */
let CVC = null, CVX = null;
function covers(ob, sp, sx, sy, fx, fay, head) {
  const rx = Math.round(fx - 3 - sx), ry = Math.round(fay - 15 - sy); if (ob._cs === sp && ob._cx === rx && ob._cy === ry && ob._ch === head) return ob._cv;
  ob._cs = sp; ob._cx = rx; ob._cy = ry; ob._ch = head; ob._cv = false;
  const x0 = Math.max(0, rx), y0 = Math.max(0, ry), x1 = Math.min(sp.w, rx + 7), y1 = Math.min(sp.h, ry + 15); if (x1 <= x0 || y1 <= y0) return false;
  try {
    if (!CVC) { CVC = mk(7, 15); CVX = CVC.getContext('2d', { willReadFrequently: true }); }
    CVX.clearRect(0, 0, 7, 15); CVX.drawImage(sp.c, x0, y0, x1 - x0, y1 - y0, x0 - rx, y0 - ry, x1 - x0, y1 - y0);
    const d = CVX.getImageData(0, 0, 7, 15).data; let hd = 0, all = 0; for (let i = 0, q = 3; i < 105; i++, q += 4) if (d[q] > 200) { all++; if (i < 56) hd++; }
    ob._cv = hd >= 28 || (!head && all >= 42);
  } catch (e) { }
  return ob._cv;
}

export class Renderer {
  constructor(canvas) { this.cv = canvas; this.ctx = canvas.getContext('2d'); this.B = mk(8, 8); this.M = mk(8, 8); this.F = mk(NL.tile, NL.tile); this.Fx = this.F.getContext('2d'); this._tap = new LightTap(); this.nl = NL;   /* night light: F = a scratch canvas on which a thing's own light is put together (occPut) */ this.Bx = this.B.getContext('2d'); this.Mx = this.M.getContext('2d'); this.W = 8;   /* QA8: B / M are only ever resized, so their contexts are fetched once (getContext was called twice a frame) */ this.H = 8; this.stats = { items: 0, chunks: 0, chunkBakes: 0, chunkMs: 0, aheadMs: 0, frames: 0, tGround: 0, tUnder: 0, tItems: 0, tAmb: 0, tGlow: 0, tOver: 0, tNl: 0 };   /* t*: total ms per part of draw() (tools/perf.mjs divides by frames) */ this.maxNewChunks = 2; this.frameNo = 0; this._scan = 0; this._L = []; this._S = []; this._Q = []; this.bake = BAKE;   /* the bake-ahead tunables (engine/sprites.js), reachable as G.renderer.bake */ this.ahead = { world: null, cx: 0, cy: 0, vx: 0, vy: 0, last: 0, base: 16.7, q: [] }; }
  /** test hook (tools/perf.mjs --verify): paint objects [from, from + n) of the world and every chunk both ways (whole / in bands); returns { tested, bad: [ids...] }. Expect bad = []. */
  sliceCheck(world, from = 0, n = 1e9, rows = 23) {
    const bad = [], seen = new Set(); let tested = 0;
    for (let i = from; i < Math.min(world.objs.length, from + n); i++) { const ob = world.objs[i], k = ob.id + '|' + JSON.stringify(ob.p) + (ob.flip ? '|F' : ''); if (seen.has(k)) continue; seen.add(k); tested++; try { if (sliceTest(screenBox(ob.vbl), () => ob.a.draw(ob.p), 3, ob.flip, rows)) bad.push(k.slice(0, 80)); } catch (e) { bad.push('ERR ' + k.slice(0, 60) + ' ' + e.message); } }
    return { tested, bad };
  }
  /** test hook: is the draw order of the frame just drawn the same as the old depth sort gives? { items, same } */
  sortCheck() { const L = this._L.filter(it => it.spr), ref = sortItemsRef(L), S = this._S; let same = ref.length === S.length; for (let i = 0; same && i < ref.length; i++) if (ref[i] !== S[i]) same = false; return { items: S.length, same }; }
  /** test hook (tools/occl_check.mjs): contradictions in the order of the frame just drawn = groups of items that are each "behind" the next all the way round (the sort has to drop a link of each).
   * hard: only the links where one box really covers the other (what the sort cannot settle by dropping a soft link). Returns [[item...]...]. */
  sortCycles(hard = true) {
    const L = this._L.filter(it => it.spr), n = L.length, adj = L.map(() => []), idx = new Int32Array(n).fill(-1), low = new Int32Array(n), on = new Uint8Array(n), st = [], out = []; let c = 0;
    for (let i = 0; i < n; i++) { const a = L[i].r; for (let j = i + 1; j < n; j++) { const b = L[j].r; if (a[0] >= b[2] || b[0] >= a[2] || a[1] >= b[3] || b[1] >= a[3]) continue; if ((L[i].h || L[j].h) && pairMiss(L[i], L[j])) continue; const bh = behind(L[i], L[j], Math.max(L[i].m, L[j].m)); if (hard && SOFT) continue; if (bh) adj[j].push(i); else adj[i].push(j); } }
    const go = v => { idx[v] = low[v] = c++; st.push(v); on[v] = 1; for (const w of adj[v]) { if (idx[w] < 0) { go(w); if (low[w] < low[v]) low[v] = low[w]; } else if (on[w] && idx[w] < low[v]) low[v] = idx[w]; } if (low[v] === idx[v]) { const g = []; let w; do { w = st.pop(); on[w] = 0; g.push(L[w]); } while (w !== v); if (g.length > 1) out.push(g); } };
    for (let i = 0; i < n; i++) if (idx[i] < 0) go(i);
    return out;
  }
  /** test hook: why is item a drawn before item b in the frame just drawn? -> { link: 'hard' | 'soft' | 'none' | 'against hard' | 'against soft' (their own link), path: the chain of hard links a -> .. -> b that forces it, if any } */
  sortWhy(a, b) {
    const L = this._L.filter(it => it.spr), n = L.length, ia = L.indexOf(a), ib = L.indexOf(b), nxt = L.map(() => []); let link = 'none';
    for (let i = 0; i < n; i++) { const p = L[i].r; for (let j = i + 1; j < n; j++) { const q = L[j].r; if (p[0] >= q[2] || q[0] >= p[2] || p[1] >= q[3] || q[1] >= p[3]) continue; if ((L[i].h || L[j].h) && pairMiss(L[i], L[j])) continue; const bh = behind(L[i], L[j], Math.max(L[i].m, L[j].m)), sf = SOFT, f = bh ? i : j, t = bh ? j : i; if ((f === ia && t === ib) || (f === ib && t === ia)) link = (f === ia ? '' : 'against ') + (sf ? 'soft' : 'hard'); if (!sf) nxt[f].push(t); } }
    const prev = new Int32Array(n).fill(-1), Q = [ia]; prev[ia] = ia; for (let h = 0; h < Q.length; h++) for (const t of nxt[Q[h]]) if (prev[t] < 0) { prev[t] = Q[h]; Q.push(t); }
    let path = null; if (ia >= 0 && ib >= 0 && prev[ib] >= 0) { path = []; for (let x = ib; x !== ia; x = prev[x]) path.unshift(L[x]); path.unshift(L[ia]); }
    return { link, path, order: [this._S.indexOf(a), this._S.indexOf(b)] };
  }
  /** how many frames had to be sorted a second time (sortItems) since the page loaded */
  get resorts() { return SORT.resorts; }
  /** test hook (async): citizens' sprites (every direction, two frames of stand / walk) drawn by the bake worker vs. here; { tested, bad } */
  async charCheck(ents, max = 12) {
    const bad = [], seen = new Set(); let tested = 0;
    for (const e of ents) { if (!e.isCitizen || !e.spec || seen.has(e.spec) || seen.size >= max) continue; seen.add(e.spec); for (const anim of ['stand', 'walk']) for (let dir = 0; dir < 4; dir++) for (let frame = 0; frame < 2; frame++) { const d = await workerTestChar(e.spec, { anim, frame, dir }); if (d === null) continue; tested++; if (d !== 0) bad.push(anim + frame + dir + ' -> ' + d); } }
    return { tested, bad };
  }
  /** test hook (async): objects [from, from + n) drawn by the bake worker vs. here; { tested, skipped (custom art / no worker), bad: [...] }. Expect bad = []. */
  async workerCheck(world, from = 0, n = 1e9) {
    const bad = [], fell = [], seen = new Set(); let tested = 0, skipped = 0;
    for (let i = from; i < Math.min(world.objs.length, from + n); i++) { const ob = world.objs[i], k = ob._key || (ob.id + '|' + JSON.stringify(ob.p) + (ob.flip ? '|F' : '')); if (seen.has(k)) continue; seen.add(k); const msg = workerObj(ob); if (!msg) { skipped++; continue; }
      let d = null; try { d = await workerTest(msg, screenBox(ob.vbl), () => ob.a.draw(ob.p), 3, ob.flip); } catch (e) { d = 'ERR ' + e.message; } if (d === null) skipped++; else if (typeof d === 'string' && d.startsWith('worker: ')) fell.push(k.slice(0, 60) + ' -> ' + d); else { tested++; if (d !== 0) bad.push(k.slice(0, 80) + ' -> ' + d); } }
    return { tested, skipped, bad, fell };   // fell = the art threw in the worker: such sprites fall back to the main thread (where world/_ctx.js safe() swallows the error)
  }
  /** test hook: cost of painting objects [from, from + n): [[ms in one go, ms for a quarter-height band, w, h, id]...] (a band that costs as much as the whole = art that plots pixel by pixel) */
  bakeCost(world, from = 0, n = 1e9) {
    const out = [], seen = new Set();
    for (let i = from; i < Math.min(world.objs.length, from + n); i++) { const ob = world.objs[i], k = ob.id + '|' + JSON.stringify(ob.p) + (ob.flip ? '|F' : ''); if (seen.has(k)) continue; seen.add(k);
      try { const sb = screenBox(ob.vbl), d = () => ob.a.draw(ob.p); let t0 = performance.now(); const j0 = renderJob(sb, d, null, 3, ob.flip); renderStep(j0, 1e9); const whole = performance.now() - t0; t0 = performance.now(); const j = renderJob(sb, d, null, 3, ob.flip); j.row = j.h >> 1; renderStep(j, Math.max(1, j.h >> 2)); out.push([+whole.toFixed(2), +(performance.now() - t0).toFixed(2), j.w, j.h, ob.id]); } catch (e) { } }
    return out;
  }
  chunkCheck(world, cx0, cy0, cx1, cy1, rows = 23) {
    const bad = []; let tested = 0;
    for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) { const a = renderChunk(world, cx, cy), j = chunkJob(world, cx, cy); if (!a || !j) { if (!!a !== !!j) bad.push(cx + ',' + cy + ' null'); continue; } tested++; let k = 0; while (!renderStep(j, rows + (k++ % 3) * 7)); const b = renderResult(j); let d = a.w !== b.w || a.h !== b.h || a.x !== b.x || a.y !== b.y ? 1 : 0; for (let i = 0; !d && i < a.buf.length; i++) if (a.buf[i] !== b.buf[i] || a.lb[i] !== b.lb[i]) d = 1; if (d) bad.push(cx + ',' + cy); }
    return { tested, bad };
  }
  /** perf counters: this renderer's + the sprite cache's (engine/sprites.js spriteStats) */
  perf() { return Object.assign({}, this.stats, spriteStats(), { nlLit, nlCut, nlCopy, nlOcc, nlSil, nlMade: silMade, nlPx: silPx, nlCount: SILS.length, nlTiles: this._mt ? this._mt.tiles.size : 0, nlTileBakes: this._mt ? this._mt.bakes : 0 }); }
  /** dev switch for A / B pictures: nightLight('old') = the light mask over everything (as before), nightLight('new') = pools on the ground, people and things lit as a whole (default; also the URL flag ?nightlight=old). nightLight('noprops' | 'props'): only what moves is lit as a whole / upright placed objects too (default). Returns the mode. */
  nightLight(mode) { if (mode === 'old' || mode === 'new') NL.mode = mode; else if (mode === 'props' || mode === 'noprops') { NL.props = mode === 'props'; NL.gen++; } return NL.mode; }
  resize(W, H) { this.W = W; this.H = H; this.cv.width = W; this.cv.height = H; this.B.width = W; this.B.height = H; this.M.width = W; this.M.height = H; this.F.width = Math.max(W, NL.tile); this.F.height = Math.max(H, NL.tile); this.ctx.imageSmoothingEnabled = false; }
  _chunk(world, cx, cy, budget) {
    const cache = world._chunks || (world._chunks = new Map()); const key = cx * 4096 + cy; let e = cache.get(key);
    if (e && e.ver === world.version) { e.t = this.frameNo; return e.spr; }
    if (budget.n <= 0) return e ? e.spr : undefined; budget.n--;
    /* perf: a chunk the bake queue has already started (see _ahead) is finished now instead of being painted again from scratch */
    if (rushBake(this._ck(world, key))) { e = cache.get(key); if (e && e.ver === world.version) { e.t = this.frameNo; return e.spr; } }
    const t0 = performance.now(), r = renderChunk(world, cx, cy, true); this.stats.chunkBakes++; this.stats.chunkMs += performance.now() - t0;
    return this._putChunk(world, cx, cy, r, world.version);
  }
  _ck(world, key) { return 'chunk|' + (world._wid || (world._wid = ++WID)) + '|' + key; }
  /* store a painted chunk (raster result or null). The cache keeps 140 chunks; the one that was drawn longest ago goes first (it used to be the oldest painted one, which could be a chunk still on screen). */
  _putChunk(world, cx, cy, r, ver) {
    const cache = world._chunks || (world._chunks = new Map()), key = cx * 4096 + cy;
    const spr = toSpritePooled(r); if (spr && (cx < 0 || cy < 0 || cx * CH >= world.w || cy * CH >= world.h)) spr.over = treeLayer(world, cx, cy); cache.delete(key); cache.set(key, { spr, ver, t: this.frameNo });
    if (cache.size > 140) { let k0, t0 = Infinity; for (const [k, v] of cache) if (v.t < t0) { t0 = v.t; k0 = k; } cache.delete(k0); }
    return spr;
  }
  /** make sure everything around the camera exists (call after teleports to avoid pop-in): the ground chunks and, perf, the sprites of the objects in view (so they are baked under the scene fade, not in the first frames after it) */
  warm(world, cam) { const m = this.maxNewChunks; this.maxNewChunks = 1e9; this._ground(world, cam, null); this.maxNewChunks = m; for (const ob of world.query(cam.x - 4, cam.y - 4, cam.x + this.W + 4, cam.y + this.H + 4)) if (!ob.hidden) objSprite(ob); this._scan = 0; }
  /**
   * perf: bake AHEAD of the camera. Every few frames, look at a ring around the screen (wider in the direction the camera moves) and queue
   * what is not painted yet: ground chunks, object sprites, and entities that offer prebake(pri) (citizens). bakeTick() then spends a few
   * milliseconds per frame on the queue (engine/sprites.js). Nothing on screen depends on it: whatever is not ready when it scrolls into
   * view is finished on the spot, as before.
   */
  _ahead(world, cam, ents) {
    const now = performance.now(), W = this.W, H = this.H, A = this.ahead;
    const late = A.last > 0 && now - A.last > A.base * 1.35 + 2; if (A.last > 0) { const d = now - A.last; A.base = d < A.base ? d : Math.min(d, A.base * 1.002 + .002); } A.last = now;   // base = this display's frame interval (a slowly rising minimum)
    if (!BAKE.on) { bakeTick(late); return; }
    if (A.world !== world) { A.world = world; A.cx = cam.x; A.cy = cam.y; A.vx = A.vy = 0; this._scan = 0; }
    A.vx += (cam.x - A.cx - A.vx) * .1; A.vy += (cam.y - A.cy - A.vy) * .1; A.cx = cam.x; A.cy = cam.y;   // camera speed in px per frame, smoothed
    if (--this._scan <= 0) {
      this._scan = 6;
      /* the ring: BAKE.ring px around the screen, stretched by BAKE.look frames of camera travel (at most BAKE.lookMax px) */
      const lx = Math.max(-BAKE.lookMax, Math.min(BAKE.lookMax, A.vx * BAKE.look)), ly = Math.max(-BAKE.lookMax, Math.min(BAKE.lookMax, A.vy * BAKE.look)), m = BAKE.ring;
      const rx0 = cam.x - m + Math.min(0, lx), ry0 = cam.y - m + Math.min(0, ly), rx1 = cam.x + W + m + Math.max(0, lx), ry1 = cam.y + H + m + Math.max(0, ly);
      /* priority = px between the thing and the screen (now, or where the screen will be in half the look-ahead: whichever is nearer) */
      const hx = lx * .5, hy = ly * .5, pri = (x0, y0, x1, y1) => { const a = Math.max(0, cam.x - x1, x0 - cam.x - W) + Math.max(0, cam.y - y1, y0 - cam.y - H), b = Math.max(0, cam.x + hx - x1, x0 - cam.x - hx - W) + Math.max(0, cam.y + hy - y1, y0 - cam.y - hy - H) + 24; return a < b ? a : b; };
      ageBakes(60, 1500); const Q = A.q; Q.length = 0; world.query(rx0, ry0, rx1, ry1, Q);
      for (let i = 0; i < Q.length; i++) { const ob = Q[i]; if (ob.hidden) continue; const sb = ob.sb, p = pri(sb[0], sb[1], sb[2], sb[3]); prebakeObj(ob, p); }
      /* ground chunks: their own, longer look-ahead (same chunk maths as _ground) */
      const zr = (world.zmax || 14) * U, oc = outskirtChunks(world), cache = world._chunks || (world._chunks = new Map());
      const clx = Math.max(-BAKE.chunkLookMax, Math.min(BAKE.chunkLookMax, A.vx * BAKE.chunkLook)), cly = Math.max(-BAKE.chunkLookMax, Math.min(BAKE.chunkLookMax, A.vy * BAKE.chunkLook)), gx0 = cam.x - m + Math.min(0, clx), gy0 = cam.y - m + Math.min(0, cly), gx1 = cam.x + W + m + Math.max(0, clx), gy1 = cam.y + H + m + Math.max(0, cly);
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (let i = 0; i < 4; i++) { const sx = i & 1 ? gx1 : gx0, sy = i & 2 ? gy1 + zr : gy0 - 64, a = sx / U, b = sy / (U / 2), x = (a + b) / 2, y = (b - a) / 2; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      const c0x = Math.max(-oc, Math.floor(x0 / CH)), c0y = Math.max(-oc, Math.floor(y0 / CH)), c1x = Math.min(Math.ceil(world.w / CH) - 1 + oc, Math.floor(x1 / CH)), c1y = Math.min(Math.ceil(world.h / CH) - 1 + oc, Math.floor(y1 / CH));
      for (let cy = c0y; cy <= c1y; cy++) for (let cx = c0x; cx <= c1x; cx++) {
        const sx = (cx - cy) * CH * U, sy = (cx + cy + 1) * CH * U / 2, bx0 = sx - CH * U, bx1 = sx + CH * U, by0 = sy - CH * U / 2 - zr, by1 = sy + CH * U / 2 + 64;   // the chunk's diamond on screen (world px), with the same slack for heights as _ground
        if (bx1 < gx0 || bx0 > gx1 || by1 < gy0 || by0 > gy1) continue;
        const key = cx * 4096 + cy, e = cache.get(key); if (e && e.ver === world.version) { if (e.t < this.frameNo - 30) e.t = this.frameNo - 30; continue; }   // a ring chunk counts as recently used
        const jk = this._ck(world, key), p = pri(bx0, by0, bx1, by1) - 8, ver = world.version;   // ground a little before the objects standing on it
        if (!prebake(jk, () => chunkJob(world, cx, cy), p, null, r => { if (ver === world.version) this._putChunk(world, cx, cy, r, ver); }, true)) bakePri(jk, p);
      }
      /* entities near the screen that can say what they will look like (crowd citizens) */
      for (let i = 0; i < ents.length; i++) { const e = ents[i]; if (e.hidden || !e.prebake) continue; const ex = (e.x - e.y) * U, ey = (e.x + e.y) * U / 2 - e.z * U; if (ex < rx0 - BAKE.entRing || ex > rx1 + BAKE.entRing || ey < ry0 - BAKE.entRing || ey > ry1 + BAKE.entRing) continue; e.prebake(pri(ex - 16, ey - 40, ex + 16, ey + 8)); }   // (they move: a little wider than the ring for the scenery; much wider and every animation frame of every citizen near the screen gets baked, seen or not)
      sortBakes();
    }
    this.stats.aheadMs += bakeTick(late);
  }
  _ground(world, cam, ctx) {
    const W = this.W, H = this.H, zr = (world.zmax || 14) * U;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (let i = 0; i < 4; i++) { const sx = i & 1 ? cam.x + W : cam.x, sy = i & 2 ? cam.y + H + zr : cam.y - 64   /* the four screen corners, with slack for heights */, a = sx / U, b = sy / (U / 2), x = (a + b) / 2, y = (b - a) / 2; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    const oc = outskirtChunks(world), c0x = Math.max(-oc, Math.floor(x0 / CH)), c0y = Math.max(-oc, Math.floor(y0 / CH)), c1x = Math.min(Math.ceil(world.w / CH) - 1 + oc, Math.floor(x1 / CH)), c1y = Math.min(Math.ceil(world.h / CH) - 1 + oc, Math.floor(y1 / CH));
    const budget = this._bud || (this._bud = { n: 0 }); budget.n = this.maxNewChunks; let n = 0, ov = this._ov || (this._ov = []); ov.length = 0;
    for (let s = c0x + c0y; s <= c1x + c1y; s++) for (let cx = Math.max(c0x, s - c1y); cx <= Math.min(c1x, s - c0y); cx++) {
      const cy = s - cx;
      // quick reject: chunk diamond centre vs screen
      const csx = (cx * CH + CH / 2 - (cy * CH + CH / 2)) * U, csy = (cx * CH + CH / 2 + cy * CH + CH / 2) * U / 2;   /* = WS(chunk centre, z 0) */ if (csx < cam.x - CH * U - 8 || csx > cam.x + W + CH * U + 8 || csy < cam.y - CH * U / 2 - 8 - 64 || csy > cam.y + H + CH * U / 2 + zr + 8) continue;
      const spr = this._chunk(world, cx, cy, budget); if (!spr) continue; n++;
      if (ctx) { ctx.drawImage(spr.c, spr.x - cam.x, spr.y - cam.y); if (spr.over) ov.push(spr.over); }
    }
    /* outskirt trees go over all the ground, back to front (the chunk order above) */
    if (ctx) for (let i = 0; i < ov.length; i++) ctx.drawImage(ov[i].c, ov[i].x - cam.x, ov[i].y - cam.y);
    this.stats.chunks = n;
  }
  /**
   * perf: the light mask of the world's own lights, in tiles. A tile (NL.tile px square, world px) holds exactly what the frame used to paint there every time: the ambient colour, then every pool of
   * world.lights that reaches it, added with the night's strength al: the same sprites at the same whole-pixel places in the same way, so the same pixels. The tiles are good while the ambient colour, al and
   * the lights stay as they are (a checksum over world.lights, every frame): all night outdoors, all day indoors. While they change (dusk, dawn, a lamp switched) the mask is painted directly, as before.
   * One tile is painted per frame (a frame with a tile still missing is painted directly); at most NL.tileMax are kept (least recently drawn first to go; 24 x 256 x 256 x 4 bytes = 6 MB).
   * Pools behind buildings (occ): a tile also holds the pools taken off the things that hide them (_occBake), so it is also good only while the placed objects in it are what they were: the world's
   * objects (world.orev, part of the key), and per tile the things worked on (t.o: one hidden -> repaint) and the things that mattered but could not be worked on (t.w: hidden, or their picture was
   * not painted yet; one of them ready -> repaint). A tile that needs repainting is used as it is until its turn (the things in question are at the edge of the screen or off it).
   * _maskKey: the key, K.gen counts its changes. _maskTiles returns true if the mask has been drawn from tiles (the caller then only adds the moving lights). Also notes the pools on screen for the night light (addLight).
   */
  _maskKey(world, amb, al, occ) {
    const LL = world.lights, fr = this.frameNo, K = this._mt || (this._mt = { world: null, amb: '', al: -1, sig: 0, since: 0, tiles: new Map(), spare: [], bakes: 0, gen: 1, occ: false, orev: 0, ng: 0 });
    /* checksum of the lights */
    let h = LL.length | 0;
    for (let i = 0; i < LL.length; i++) {
      const l = LL[i], c = l.c; h = Math.imul(h ^ ((l.x * 16) | 0), 16777619); h = Math.imul(h ^ ((l.y * 16) | 0), 16777619); h = Math.imul(h ^ ((l.z * 16 + l.r * 4096) | 0), 16777619);
      if (c) { if (l._cs !== c) { l._cs = c; let q = 0; for (let j = 0; j < c.length; j++) q = Math.imul(q ^ c.charCodeAt(j), 16777619); l._ch = q; } h = Math.imul(h ^ l._ch, 16777619); }
    }
    const orev = occ ? world.orev | 0 : 0, ng = occ ? NL.gen : 0;
    if (K.world !== world || K.amb !== amb || K.al !== al || K.sig !== h || K.occ !== occ || K.orev !== orev || K.ng !== ng) { K.world = world; K.amb = amb; K.al = al; K.sig = h; K.occ = occ; K.orev = orev; K.ng = ng; K.gen++; K.since = fr; for (const t of K.tiles.values()) K.spare.push(t.c); K.tiles.clear(); if (K.spare.length > NL.tileMax) K.spare.length = NL.tileMax;
      { const F = this._fpd; if (F) { let w = 0; for (let i = 0; i < F.length; i++) { const ob = F[i]; if (ob._pd !== 2) continue; if (ob._a === undefined) ob._pd = false; else F[w++] = ob; } F.length = w; } } }   // (things that were see-through go back into the tiles, now that all tiles are painted anew)
    return K;
  }
  /* does a tile (or a patch) have to be painted again? One of the things it could not work on is ready now, or one it worked on has been hidden */
  _tileStale(t) { const w = t.w, o = t.o; for (let i = 0; i < w.length; i++) if (!w[i].hidden && !w[i]._pd && objSpriteIf(w[i]) !== undefined) return true; for (let i = 0; i < o.length; i++) if (o[i].hidden) return true; return false; }
  _maskTiles(world, cam, amb, al, m, nlOn, occ, K) {
    const LL = world.lights, W = this.W, H = this.H, T = NL.tile, fr = this.frameNo;
    if (fr - K.since < NL.tileWait) return false;   // still changing (dusk): not worth painting tiles that are thrown away next frame
    const tx0 = Math.floor(cam.x / T), ty0 = Math.floor(cam.y / T), tx1 = Math.floor((cam.x + W - 1) / T), ty1 = Math.floor((cam.y + H - 1) / T); let miss = 0, baked = 0, old = null;
    if ((tx1 - tx0 + 1) * (ty1 - ty0 + 1) > NL.tileMax - 4) return false;   // (a canvas so large that the tiles in view would not fit the cache: paint directly)
    for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
      const key = tx * 65536 + ty; let t = K.tiles.get(key);
      if (t) { t.t = fr; if (occ && !t.stale && ((fr + tx) & 3) === 0 && (t.w.length || t.o.length) && this._tileStale(t)) t.stale = true;   /* (looked at every fourth frame) */ if (t.stale && old === null) old = t; continue; }
      if (baked) { miss++; continue; } baked = 1; K.bakes++;
      if (K.tiles.size >= NL.tileMax) { let k0 = 0, t0 = Infinity; for (const [k, v] of K.tiles) if (v.t < t0) { t0 = v.t; k0 = k; } K.spare.push(K.tiles.get(k0).c); K.tiles.delete(k0); }
      t = { c: K.spare.pop() || mk(T, T), t: fr, x: tx, y: ty, w: [], o: [], stale: false }; this._occBake(world, t.c.getContext('2d'), tx * T, ty * T, T, T, amb, al, occ ? t : null, K.gen);
      K.tiles.set(key, t);
    }
    if (!baked && old !== null) { K.bakes++; old.w.length = 0; old.o.length = 0; this._occBake(world, old.c.getContext('2d'), old.x * T, old.y * T, T, T, amb, al, occ ? old : null, K.gen); old.stale = false; }
    if (miss) return false;
    for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) m.drawImage(K.tiles.get(tx * 65536 + ty).c, tx * T - cam.x, ty * T - cam.y);
    if (nlOn) for (let i = 0; i < LL.length; i++) { const l = LL[i], rx = Math.round(l.r * U * 1.2), ry = Math.round(rx / 2), x = Math.round((l.x - l.y) * U) - cam.x - rx, y = Math.round((l.x + l.y) * U / 2 - l.z * U) - cam.y - ry; if (x > W || y > H || x + rx * 2 + 1 < 0 || y + ry * 2 + 1 < 0) continue; addLight(x + rx, y + ry, poolSprite(l.r, l.c || '#ffd9a0'), al, l.ob, l.x, l.y, l.z); }
    return true;
  }
  /**
   * pools behind buildings. Paint the light mask of the w x h px at world px (ox, oy) into x as a frame painted directly would: the ambient colour, the world's pools, and (rec) the pools taken off
   * the things that hide them, in draw order (the placed objects there are sorted like a frame's). rec = { w: [], o: [] } is filled: o = the things worked on, w = things that matter here and could
   * not be worked on (hidden, or their picture is not painted yet: nothing is painted for this). Things left to the frame (ob._pd) are not in it. gen: the tiles' K.gen (ob._pg / _ps: the picture a thing had when the tiles last saw it).
   */
  /* the world's pools that reach the w x h px at world px (ox, oy): drawn into x (if given; its state is set), noted in LB (if note) */
  _occLoad(world, x, ox, oy, w, h, al, note) {
    const LL = world.lights; nLB = 0;
    for (let i = 0; i < LL.length; i++) { const l = LL[i], rx = Math.round(l.r * U * 1.2), ry = Math.round(rx / 2), X = Math.round((l.x - l.y) * U) - ox - rx, Y = Math.round((l.x + l.y) * U / 2 - l.z * U) - oy - ry; if (X > w || Y > h || X + rx * 2 + 1 < 0 || Y + ry * 2 + 1 < 0) continue; const ps = poolSprite(l.r, l.c || '#ffd9a0'); if (x) x.drawImage(ps, X, Y); if (note) addLight(X + rx, Y + ry, ps, al, l.ob, l.x, l.y, l.z); }
    nLBw = nLB;
  }
  _occBake(world, x, ox, oy, w, h, amb, al, rec, gen) {
    x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1; x.fillStyle = amb; x.fillRect(0, 0, w, h); x.globalCompositeOperation = 'lighter'; x.globalAlpha = al; this._occLoad(world, x, ox, oy, w, h, al, !!rec);
    if (rec && nLB) {
      camX = ox; camY = oy;
      const Q = this._Q2 || (this._Q2 = []), L = this._OL || (this._OL = []), wait = this._OW || (this._OW = []); Q.length = 0; wait.length = 0; world.query(ox, oy, ox + w, oy + h, Q); let n = 0;
      for (let i = 0; i < Q.length; i++) {
        const ob = Q[i]; if (ob._pd) continue; if (ob.hidden) { ob._pg = 0; if (mayHide(ob)) wait.push(ob); continue; }
        const sp = objSpriteIf(ob); if (sp === undefined) { if (mayHide(ob)) wait.push(ob); continue; } if (sp === null || (ob.size[2] <= .06 && !sp.l)) continue;   // (no picture; drawn with the ground, as in draw())
        if (ob._ng === NL.gen ? ob._nw : wholeOb(ob, sp)) continue;
        const it = L[n] || (L[n] = { B: null, spr: null, ax: 0, ay: 0, r: null, k: 0, ob: null, e: null, h: null, t: null, m: 0, ns: 0, _i: 0 }); n++;
        it.B = ob.B; it.spr = sp; it.ax = (ob.x - ob.y) * U; it.ay = (ob.x + ob.y) * U / 2 - ob.z * U; it.r = ob.sb; it.k = ob.k; it.ob = ob; it.h = OCCL && ob.vbl ? ob._oh || obHex(ob) : null; it.t = ob.sb; ob._pg = gen; ob._ps = sp;
      }
      /* the list is sorted like a frame's. Where the sort met a ring (objects that are each "behind" the next all the way round: a station platform, its canopy and the deck beside them) it has
         noted the members (ob._pd, see sortItems): they are left to the frame, and the rest is sorted again without them. */
      let S = sortItems(L, n, this._OS || (this._OS = []));
      for (;;) { let m = 0; for (let i = 0; i < n; i++) { const it = L[i]; if (it.ob._pd) continue; if (m !== i) { L[i] = L[m]; L[m] = it; } m++; } if (m === n) break; for (let i = m; i < n; i++) { L[i].spr = null; L[i].ob = null; } n = m; S = sortItems(L, n, this._OS); }
      this._occPass(x, S, n, 0, 0, w, h, amb, rec.o);
      for (let i = 0; i < wait.length; i++) { const ob = wait[i], sb = ob.sb, x0 = sb[0] - ox < 0 ? 0 : sb[0] - ox, y0 = sb[1] - oy < 0 ? 0 : sb[1] - oy, x1 = sb[2] - ox > w ? w : sb[2] - ox, y1 = sb[3] - oy > h ? h : sb[3] - oy; if (x1 <= x0 || y1 <= y0) continue; const hx = ob.vbl ? ob._hx || hexOf(ob) : null; if (hidden(ob.B, ob, hx, x0, y0, x1, y1, 0, nLB) || (nQR && hitBox(QR, nQR, x0, y0, x1, y1, hx))) rec.w.push(ob); }
      for (let i = 0; i < n; i++) { L[i].spr = null; L[i].ob = null; S[i] = null; } wait.length = 0; Q.length = 0;
    }
    nLB = 0; nLBw = 0;
  }
  /* the pass itself: the first n items of L in draw order, on the mask m (its px x0..y1; camX / camY = its place in the world, LB = its pools). Every placed object that keeps the pattern gets its own
   * light (occPut) where a pool it does not take reaches it, and where something behind it was worked on. rec: the objects worked on are added to it. */
  _occPass(m, L, n, cx0, cy0, cx1, cy1, amb, rec) {
    const fx = this.Fx, fc = this.F; nQR = 0;
    for (let i = 0; i < n; i++) {
      const it = L[i], ob = it.ob; if (ob === null) continue; const sp = it.spr;
      if ((ob._ng === NL.gen ? ob._nw : wholeOb(ob, sp)) || ob._pd) continue;
      const dx = sp.x + it.ax - camX, dy = sp.y + it.ay - camY, q = sp.bx; let x0 = q ? dx + q[0] : dx, y0 = q ? dy + q[1] : dy, x1 = q ? dx + q[2] : dx + sp.w, y1 = q ? dy + q[3] : dy + sp.h;
      if (x0 < cx0) x0 = cx0; if (y0 < cy0) y0 = cy0; if (x1 > cx1) x1 = cx1; if (y1 > cy1) y1 = cy1; if (x1 <= x0 || y1 <= y0) continue;
      const hx = ob.vbl ? ob._hx || hexOf(ob) : null;
      let has = hidden(ob.B, ob, hx, x0, y0, x1, y1, 0, nLB) > 0, a0 = uX0, b0 = uY0, a1 = uX1, b1 = uY1;
      if (nQR && hitBox(QR, nQR, x0, y0, x1, y1, hx)) { if (!has) { has = true; a0 = hX0; b0 = hY0; a1 = hX1; b1 = hY1; } else { if (hX0 < a0) a0 = hX0; if (hY0 < b0) b0 = hY0; if (hX1 > a1) a1 = hX1; if (hY1 > b1) b1 = hY1; } }
      if (!has) continue;
      occPut(m, fx, fc, sp, dx, dy, a0, b0, a1, b1, 1, ob.B, ob, amb); addQ(a0, b0, a1, b1); if (rec) rec.push(ob);
    }
    m.globalCompositeOperation = 'source-over'; m.globalAlpha = 1;
  }
  /* before the mask is drawn, for the frame's things that keep the pattern: the ones left to the frame (ob._pd) get their own light ready (_occOwn). Left to the frame are: the members of a ring
   * (sortItems notes them); a thing that is see-through (from then until the tiles are next thrown away: ob._pd = 2; it is in the tiles as if solid, so its tiles are painted again without it); and a thing whose
   * picture keeps changing (not the one the tiles saw, three times with less than 600 frames between them: an animation; a change now and then only has its tiles painted again). */
  _occStale(K, ob) { const sb = ob.sb, T = NL.tile; for (let ty = Math.floor(sb[1] / T); ty * T < sb[3]; ty++) for (let tx = Math.floor(sb[0] / T); tx * T < sb[2]; tx++) { const t = K.tiles.get(tx * 65536 + ty); if (t) t.stale = true; } }   // the tiles a thing is in have to be painted again
  _occPrep(world, S, K, amb, al) {
    for (let i = 0; i < S.length; i++) {
      const it = S[i], ob = it.ob; if (ob === null) continue; const sp = it.spr; if (ob._ng === NL.gen ? ob._nw : wholeOb(ob, sp)) continue;
      if (!ob._pd) {
        if (ob._a !== undefined) { ob._pd = 2; (this._fpd || (this._fpd = [])).push(ob); }
        else { if (K === null || ob._pg !== K.gen || ob._ps === sp) continue; ob._ps = sp; const fr = this.frameNo; ob._pc = fr - (ob._pf | 0) < 600 ? (ob._pc | 0) + 1 : 1; ob._pf = fr; if (ob._pc > 2) ob._pd = true; }
        if (K !== null) this._occStale(K, ob);
        if (!ob._pd) continue;
      } else if (K !== null && ob._pg === K.gen) { ob._pg = 0; this._occStale(K, ob); }   // (a member of a ring found since its tiles were painted: they are painted again without it)
      if (K !== null) this._occOwn(world, it, K, amb, al);
    }
  }
  /* a thing that is left to the frame (ob._pd): its own light (ambient + the pools it takes) cut to its shape is kept as a canvas (ob._pl; none if no pool
   * reaches it; a0..b1 = the box around the pools that do). A frame then just draws the part it needs, like a flat-colour copy: one plain draw (the same pixels as occPut). Good while the mask's key (K.gen) and its picture stay; made in _occPrep. */
  _occOwn(world, it, K, amb, al) {
    const ob = it.ob, sp = it.spr, fr = this.frameNo; let pl = ob._pl;
    if (pl && pl.gen === K.gen && pl.sp === sp) { pl.t = fr; return; }
    if (!pl) { pl = ob._pl = { gen: 0, sp: null, c: null, cx: null, x: 0, y: 0, t: 0, a0: 0, b0: 0, a1: 0, b1: 0 }; (this._pls || (this._pls = [])).push(ob); }
    pl.gen = K.gen; pl.sp = sp; pl.t = fr;
    const q = sp.bx, qx = q ? q[0] : 0, qy = q ? q[1] : 0, X0 = sp.x + it.ax + qx, Y0 = sp.y + it.ay + qy, w = q ? q[2] - qx : sp.w, h = q ? q[3] - qy : sp.h, hx = ob.vbl ? ob._hx || hexOf(ob) : null; this._occLoad(world, null, X0, Y0, w, h, al, true); camX = X0; camY = Y0;
    if (!hidden(ob.B, ob, hx, 0, 0, w, h, 0, nLB, true)) { pl.c = pl.cx = null; nLB = nLBw = 0; return; }   // (uX0..uY1: the box around the pools that reach it)
    pl.a0 = uX0; pl.b0 = uY0; pl.a1 = uX1; pl.b1 = uY1;
    if (pl.c === null || pl.c.width !== w || pl.c.height !== h) { pl.c = mk(w, h); pl.cx = pl.c.getContext('2d'); } const x = pl.cx;
    ownLight(x, pl.c, 0, 0, w, h, ob.B, ob, amb, true); x.globalCompositeOperation = 'destination-in'; x.globalAlpha = 1; x.drawImage(sp.c, qx, qy, w, h, 0, 0, w, h);
    pl.x = X0; pl.y = Y0; nLB = nLBw = 0;
  }
  /**
   * night light: for every thing that is lit as a whole, put its shape into the mask m in its flat colour, in draw order; where a thing that
   * keeps the pattern stands in front, the mask's own pattern is put back. S = this frame's sorted items (as drawn), al = the strength the
   * pools were drawn with. Mirrors the item loop of draw() step by step (sitters, see-through objects, the focus ghost).
   */
  _nightE(S, cam, amb, al, m, tiled, occ, kg) {
    const fr = this.frameNo, W = this.W, H = this.H; nER = 0; nOP = 0; silNew = 0; camX = cam.x; camY = cam.y; vW = W; vH = H;
    if (amb !== AMB) { AMB = amb; const n = parseInt(amb.slice(1), 16); aR = n >> 16; aG = n >> 8 & 255; aB = n & 255; }
    for (let i = 0; i < S.length; i++) {
      const it = S[i], sp = it.spr, dx = sp.x + it.ax - cam.x, dy = sp.y + it.ay - cam.y, e = it.e, ob = it.ob, oa = ob ? ob._a : undefined;
      /* this item: lit as a whole (its light: under its feet / the middle of its footprint, never its own lamp), or part of the patterned world */
      let who = null, lit = false;
      const bq = sp.bx, bx0 = bq ? dx + bq[0] : dx, by0 = bq ? dy + bq[1] : dy, bx1 = bq ? dx + bq[2] : dx + sp.w, by1 = bq ? dy + bq[3] : dy + sp.h;   // the box of its own pixels
      if (e) { if (isWhole(e, sp)) { who = e; sample(it.ax - cam.x, it.ay - cam.y, bx0, by0, bx1, by1, null); } }
      else if (ob._ng === NL.gen ? ob._nw : wholeOb(ob, sp)) { who = ob; const B = ob.B, mx = (B[0] + B[3]) / 2, my = (B[1] + B[4]) / 2; sample(Math.round((mx - my) * U) - cam.x, Math.round((mx + my) * U / 2 - B[2] * U) - cam.y, bx0, by0, bx1, by1, ob); }
      let dim = false, kx0 = 0, ky0 = 0, kx1 = 0, ky1 = 0;
      if (who) { dim = band(who, fr, al) === 0; lit = !dim || sT; if (dim) { kx0 = tX0; ky0 = tY0; kx1 = tX1; ky1 = tY1; } }
      /* sitters: on a piece that is lit as a whole they take the piece's colour (one thing, no seam); on anything else each is lit by the light on the ground under it. Legs behind the piece first (as in draw()). */
      if (it.ns) for (let q = it.sit; q; q = q.next) {
        const qs = q.spr, qe = q.e, qx = qs.x + q.ax - cam.x, qy = qs.y + q.ay - cam.y;
        if (who === ob && ob) { qe._ni = ob._ni; qe._ns = ob._ns; qe._nb = ob._nb; qe._nf = fr; qe._nt = fr; qe._nhr = ob._nhr; qe._nhg = ob._nhg; qe._nhb = ob._nhb; q.lit = lit; }
        else { sample(q.ax - cam.x, Math.round((qe.x + qe.y) * U / 2 - (ob ? ob.z : qe.z) * U) - cam.y, qx, qy, qx + qs.w, qy + qs.h, null); q.lit = band(qe, fr, al) > 0 || sT; }
        if (qe.dir < 2) continue; const r0 = Math.min(qs.h, 1 - qs.y); if (r0 >= qs.h) continue;
        if (q.lit) litDraw(qs, r0, qs.h - r0, qx, qy, qe._ni, qe._ns, qe.alpha, fr, false, 0, 0, 0, 0); else cutDraw(qs, r0, qs.h - r0, qx, qy, qe.alpha, null, null);
      }
      if (lit) { who._nd = fr; litDraw(sp, 0, sp.h, dx, dy, who._ni, who._ns, e ? e.alpha : oa, fr, dim, kx0, ky0, kx1, ky1); }
      else if (!(oa !== undefined && oa < .05)) {
        const a = oa !== undefined ? oa : e ? e.alpha : undefined, hx = ob && ob.vbl ? ob._hx || hexOf(ob) : null, hides = ob ? true : e.nl !== 'ground' && it.B[5] - it.B[2] >= NL.low && sp.l !== sp.c, pit = hides ? it : null; let done = false;
        /* pools behind buildings: the pools this thing does not take and that the mask still has across it. For a placed object in the tiles: only the moving lights (headlights). For a see-through or
           animated object and for a big entity (a train car): the world's lamps too. There it gets its own light (pushOp 3), with its alpha; a see-through thing in one step for everything behind it as well
           (a blend must not be done twice). */
        if (occ && hides) {
          const from = ob && !ob._pd ? nLBw : 0, x0 = bx0 < 0 ? 0 : bx0, y0 = by0 < 0 ? 0 : by0, x1 = bx1 > W ? W : bx1, y1 = by1 > H ? H : by1, pl = ob && ob._pd ? ob._pl : null;
          if (pl && pl.gen === kg && pl.sp === sp) {
            /* left to the frame, with its own light kept (_occOwn): what is lit behind it is covered as usual, the kept copy is drawn, and where a moving light is on it its light is put together on the spot (after the copy: steps run in this order) */
            const c = pl.c; let r0 = 0, r1 = 0, r2 = 0, r3 = 0;   // r0..r3: the part of it this frame works on = where pools reach it + where something lit is behind it
            if (x1 > x0 && y1 > y0) {
              if (c !== null) { r0 = pl.x - cam.x + pl.a0; r1 = pl.y - cam.y + pl.b0; r2 = r0 + pl.a1 - pl.a0; r3 = r1 + pl.b1 - pl.b0; if (r0 < x0) r0 = x0; if (r1 < y0) r1 = y0; if (r2 > x1) r2 = x1; if (r3 > y1) r3 = y1; }
              if (nER) { eSkip = true; const hit = hitBox(ER, nER, x0, y0, x1, y1, hx); eSkip = false; if (hit) { if (r2 <= r0 || r3 <= r1) { r0 = hX0; r1 = hY0; r2 = hX1; r3 = hY1; } else { if (hX0 < r0) r0 = hX0; if (hY0 < r1) r1 = hY0; if (hX1 > r2) r2 = hX1; if (hY1 > r3) r3 = hY1; } } }
              if (r2 > r0 && r3 > r1) { if (c !== null) { if (a < 1) pushOp(4, sp, r0 - dx, r1 - dy, r2 - r0, r3 - r1, r0, r1, a, c, null); else pushOp(2, c, r0 - (pl.x - cam.x), r1 - (pl.y - cam.y), r2 - r0, r3 - r1, r0, r1, a, null, null); } else pushOp(0, sp, r0 - dx, r1 - dy, r2 - r0, r3 - r1, r0, r1, a, amb, null);   /* (no pool reaches it: its own light is the ambient colour) */ addE(r0, r1, r2, r3, 1); nlOcc++; }
              if (!(a < 1)) for (let j = nLBw, o = j * 7; j < nLB; j++, o += 7) { let p = LB[o] - LB[o + 2], q = LB[o + 1] - LB[o + 3], r = p + 2 * LB[o + 2] + 1, t = q + 2 * LB[o + 3] + 1; if (p < x0) p = x0; if (q < y0) q = y0; if (r > x1) r = x1; if (t > y1) t = y1; if (r <= p || t <= q || (hx !== null && !hexBox(hx, p, q, r, t))) continue;
                { const f = takes(it.B, j, ob), ins = p >= r0 && q >= r1 && r <= r2 && t <= r3, out = r2 <= r0 || r3 <= r1 || p >= r2 || r <= r0 || q >= r3 || t <= r1; if ((f <= 0 && ins) || (f >= 1 && out)) continue; }   // (the copy has taken it off there already / it is still on there, as it should be)
                pushOp(3, sp, p - dx, q - dy, r - p, t - q, p, q, a, null, it); addE(p, q, r, t, 1); }
            }
            done = true;
          } else if (from < nLB && x1 > x0 && y1 > y0 && hidden(it.B, ob, hx, x0, y0, x1, y1, from, nLB)) {
            let a0 = uX0, b0 = uY0, a1 = uX1, b1 = uY1;
            if (a !== undefined && a < 1) { if (nER && hitBox(ER, nER, x0, y0, x1, y1, hx)) { if (hX0 < a0) a0 = hX0; if (hY0 < b0) b0 = hY0; if (hX1 > a1) a1 = hX1; if (hY1 > b1) b1 = hY1; } }
            else cutDraw(sp, 0, sp.h, dx, dy, a, hx, it);
            pushOp(3, sp, a0 - dx, b0 - dy, a1 - a0, b1 - b0, a0, b0, a, null, it); addE(a0, b0, a1, b1, 1); nlOcc++; done = true;
          }
        }
        if (!done) cutDraw(sp, 0, sp.h, dx, dy, a, hx, pit);
      }
      /* the piece's sitters (far to near), each followed by the part of the piece in front of it */
      if (it.ns) for (let q = it.sit; q; q = q.next) {
        const qs = q.spr, qe = q.e, qx = qs.x + q.ax - cam.x, qy = qs.y + q.ay - cam.y, rows = qe.dir < 2 ? qs.h : Math.min(qs.h, 1 - qs.y);
        if (rows > 0) { if (q.lit) litDraw(qs, 0, rows, qx, qy, qe._ni, qe._ns, qe.alpha, fr, false, 0, 0, 0, 0); else cutDraw(qs, 0, rows, qx, qy, qe.alpha, null, null); }
        const ov = q.ov; if (ov && oa === undefined && nER && !(lit && who === ob)) { cutDraw(ov, 0, ov.h, ov.x + it.ax - cam.x, ov.y + it.ay - cam.y, undefined, null, it); }
      }
    }
    if (!nER) { for (let i = 0; i < nOP; i++) OS[i] = OX[i] = null; return; }
    /* the focus entity shows through what stands in front of it at 30% (draw()): so does its light */
    for (let i = 0; i < S.length; i++) { const e = S[i].e; if (!e || !e.ghost || e._nd !== fr || (SEATING && isSitter(e))) continue; const sp = S[i].spr; litDraw(sp, 0, sp.h, sp.x + S[i].ax - cam.x, sp.y + S[i].ay - cam.y, e._ni, e._ns, .3, fr, false, 0, 0, 0, 0); }
    { const g = this._gs; if (g && (g.lit === true || (g.lit === undefined && g.e._nd === fr))) { const sp = g.spr; litDraw(sp, 0, sp.h, sp.x + g.ax - cam.x, sp.y + g.ay - cam.y, g.e._ni, g.e._ns, .3, fr, false, 0, 0, 0, 0); } }
    /* run the steps */
    /* what has to be put back (1) comes from the mask tiles when the mask was drawn from them. The tiles do not have the moving lights the hooks drew on top (headlights): where one of those reaches a
     * place that is put back, or there are no tiles (dusk, dawn), the thing's own light is put together on the spot instead (occPut: ambient + the pools it takes, the same sum the tile holds). */
    const fx = this.Fx, fc = this.F, fromTiles = tiled && !NL.putCopy;   /* (NL.putCopy: a test switch, tools/nightcheck.mjs compares the two ways) */
    m.globalAlpha = 1; let op = -1;   // (op: the mask's composite operation as far as this loop knows, 0 source-over / 2 destination-over, -1 not known: the pools left it at 'lighter'. It is only set when it has to change.)
    for (let i = 0, o = 0; i < nOP; i++, o += 8) {
      const src = OS[i], it = OX[i], t = ON[o], sx = ON[o + 1], sy = ON[o + 2], sw = ON[o + 3], sh = ON[o + 4], dx = ON[o + 5], dy = ON[o + 6], a = ON[o + 7]; OS[i] = null; OX[i] = null;
      if (t === 2) { if (op !== 0) { m.globalCompositeOperation = 'source-over'; op = 0; } if (a >= 0) m.globalAlpha = a; m.drawImage(src, sx, sy, sw, sh, dx, dy, sw, sh); if (a >= 0) m.globalAlpha = 1; continue; }   // a flat-colour copy: just drawn
      if (t === 0 || t === 4) { m.globalCompositeOperation = 'destination-out'; if (a >= 0) m.globalAlpha = a; m.drawImage(src.c, sx, sy, sw, sh, dx, dy, sw, sh); if (a >= 0) m.globalAlpha = 1; m.globalCompositeOperation = 'destination-over'; op = 2; if (t === 0) { m.fillStyle = OC[i]; m.fillRect(dx, dy, sw, sh); } else { const q = src.bx; m.drawImage(OC[i], sx - (q ? q[0] : 0), sy - (q ? q[1] : 0), sw, sh, dx, dy, sw, sh); OC[i] = null; }   /* (4: the hole is filled from the thing's kept own-light copy) */ continue; }
      const x0 = dx < 0 ? 0 : dx, y0 = dy < 0 ? 0 : dy, x1 = dx + sw > W ? W : dx + sw, y1 = dy + sh > H ? H : dy + sh; if (x1 <= x0 || y1 <= y0) continue; op = 2;
      let tl = t === 1 && fromTiles;
      if (tl && nHP) for (let j = 0, q = 0; j < nHP; j++, q += 3) { const im = HP[j], rx = im._rx, ry = im._ry, cx = HN[q] + rx, cy = HN[q + 1] + ry; if (x0 >= cx + rx + 1 || x1 <= cx - rx || y0 >= cy + ry + 1 || y1 <= cy - ry) continue; tl = false; break; }
      if (!tl) { occPut(m, fx, fc, src, dx - sx, dy - sy, x0, y0, x1, y1, a >= 0 ? a : 1, occ && it !== null ? it.B : null, it !== null ? it.ob : null, amb); nlCopy++; continue; }   // (without pools-behind-buildings: every pool, the mask as it was)
      m.globalCompositeOperation = 'destination-out'; if (a >= 0) m.globalAlpha = a; m.drawImage(src.c, x0 - dx + sx, y0 - dy + sy, x1 - x0, y1 - y0, x0, y0, x1 - x0, y1 - y0); if (a >= 0) m.globalAlpha = 1; m.globalCompositeOperation = 'destination-over';
      const T = NL.tile, K = this._mt.tiles, wx0 = x0 + cam.x, wy0 = y0 + cam.y, wx1 = x1 + cam.x, wy1 = y1 + cam.y;   // from the tiles
      for (let ty = Math.floor(wy0 / T); ty * T < wy1; ty++) for (let tx = Math.floor(wx0 / T); tx * T < wx1; tx++) { const tl = K.get(tx * 65536 + ty); if (!tl) continue; const a0 = wx0 > tx * T ? wx0 : tx * T, b0 = wy0 > ty * T ? wy0 : ty * T, a1 = wx1 < tx * T + T ? wx1 : tx * T + T, b1 = wy1 < ty * T + T ? wy1 : ty * T + T; m.drawImage(tl.c, a0 - tx * T, b0 - ty * T, a1 - a0, b1 - b0, a0 - cam.x, b0 - cam.y, a1 - a0, b1 - b0); }
    }
    m.globalCompositeOperation = 'source-over';
  }
  /**
   * world: World. cam: {x,y} top-left in world px (integers). ents: dynamic entities, each
   *   { x,y,z, bb:[dx0,dy0,dx1,dy1,h] (sort box rel. to position), sprite(): {c,l,x,y,w,h}, hidden?, ghost? }
   * env: { amb: '#rrggbb' multiply colour, dark: 0..1 strength of night lights, bg: '#hex' }
   * hooks: { under(ctx,cam) after ground, over(ctx,cam) after lighting (markers, bubbles, weather) }
   */
  draw(world, cam, ents, env, hooks = {}) {
    const ctx = this.ctx, W = this.W, H = this.H, ST = this.stats; this.frameNo++; ST.frames++; if ((this.frameNo & 511) === 0) { if (SILS.length) silAge(this.frameNo); const P = this._pls; if (P) { let w = 0; for (let i = 0; i < P.length; i++) { if (this.frameNo - P[i]._pl.t > 1800) P[i]._pl = null; else P[w++] = P[i]; } P.length = w; } }   /* (kept own-light copies not used for half a minute go, _occOwn) */ let tm = performance.now(), tn;
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.fillStyle = world.bg || env.bg || '#9fd6e8'; ctx.fillRect(0, 0, W, H);
    this._ground(world, cam, ctx); tn = performance.now(); ST.tGround += tn - tm; tm = tn;
    if (hooks.under) hooks.under(ctx, cam); tn = performance.now(); ST.tUnder += tn - tm; tm = tn;
    /* perf: the item list, its items and the object query are reused from frame to frame (they were ~15 KB of garbage per frame) */
    const fr = this.frameNo, SP = this._SP || (this._SP = []); let nsp = 0, gh = null;   /* seating: sitter records (reused) + the seated focus entity, if any */
    const L = this._L, vx0 = cam.x - 4, vy0 = cam.y - 4, vx1 = cam.x + W + 4, vy1 = cam.y + H + 4; let n = 0;
    const Q = this._Q; Q.length = 0; world.query(vx0, vy0, vx1, vy1, Q);
    for (let i = 0; i < Q.length; i++) { const ob = Q[i]; if (ob.hidden) continue; const spr = objSprite(ob); if (!spr) continue; const wx = (ob.x - ob.y) * U, wy = (ob.x + ob.y) * U / 2 - ob.z * U;   /* = WS(ob.x, ob.y, ob.z) */ if (ob.size[2] <= .06 && !spr.l) { ctx.drawImage(spr.c, spr.x + wx - cam.x, spr.y + wy - cam.y); continue; } const it = L[n] || (L[n] = { B: null, spr: null, ax: 0, ay: 0, r: null, k: 0, ob: null, e: null, h: null, t: null, m: 0, _i: 0, _B: [0, 0, 0, 0, 0, 0], _r: [0, 0, 0, 0], _h: null, _t: null }); n++; it.B = ob.B; it.spr = spr; it.ax = wx; it.ay = wy; it.r = ob.sb; it.k = ob.k; it.ob = ob; it.e = null; it.h = OCCL && ob.vbl ? ob._oh || obHex(ob) : null; it.t = ob.sb; it.m = 0; it.ns = 0; ob._fr = fr; ob._it = it; }
    const hopNow = performance.now();
    for (let i = 0; i < ents.length; i++) {
      const e = ents[i]; if (e.hidden) continue; const spr = e.sprite(); if (!spr) continue; const ax = Math.round((e.x - e.y) * U); let ay = Math.round((e.x + e.y) * U / 2 - e.z * U);
      /* the little hop of sitting down / standing up (owner msg 180): e.hop = performance.now() at the moment; the sprite is lifted along a short arc and nothing else changes (position, sorting and the seat it is drawn with stay as they are) */
      if (e.hop) { const u = (hopNow - e.hop) / HOP_MS; if (u >= 1 || u < 0) e.hop = 0; else ay -= Math.round(HOP_PX * 4 * u * (1 - u)); }
      const rx0 = spr.x + ax, ry0 = spr.y + ay, rx1 = rx0 + spr.w, ry1 = ry0 + spr.h; if (rx1 < vx0 || rx0 > vx1 || ry1 < vy0 || ry0 > vy1) continue;
      if (SEATING && isSitter(e)) { const so = seatObj(world, e); if (so && so._fr === fr) { const h = so._it, q = SP[nsp] || (SP[nsp] = { e: null, spr: null, ax: 0, ay: 0, d: 0, ov: null, next: null }); nsp++; q.e = e; q.spr = spr; q.ax = ax; q.ay = ay; q.d = e.x + e.y; q.ov = seatOverlay(so, h.spr, e);
        /* the piece's sitters as a list, far to near */ if (!h.ns || q.d < h.sit.d) { q.next = h.ns ? h.sit : null; h.sit = q; } else { let p = h.sit; while (p.next && p.next.d <= q.d) p = p.next; q.next = p.next; p.next = q; } h.ns++; if (e.ghost && !gh) gh = q, q.host = h; continue; } }
      const it = L[n] || (L[n] = { B: null, spr: null, ax: 0, ay: 0, r: null, k: 0, ob: null, e: null, h: null, t: null, m: 0, _i: 0, _B: [0, 0, 0, 0, 0, 0], _r: [0, 0, 0, 0], _h: null, _t: null }); n++; it.ns = 0;
      const b = e.bb || BB, B = it._B, r = it._r; B[0] = e.x + b[0]; B[1] = e.y + b[1]; B[2] = e.z; B[3] = e.x + b[2]; B[4] = e.y + b[3]; B[5] = e.z + b[4]; r[0] = rx0; r[1] = ry0; r[2] = rx1; r[3] = ry1;
      it.B = B; it.spr = spr; it.ax = ax; it.ay = ay; it.r = r; it.k = B[0] + B[3] + B[1] + B[4]; it.ob = null; it.e = e;
      /* occlusion pass (see behindLong, pairMiss). m: which rules of behind() apply to its pairs (2 a vehicle or train car, 1 anybody else who moves). h: the outline of a long entity's box on screen;
         e.vb = [dx0, dy0, dx1, dy1, h, dz] is the box its picture is painted in, when the sort box e.bb is something else (train cars). t: the box of the sprite's own pixels. */
      if (OCCL) {
        const m = it.m = e.isVehicle || e.vb !== undefined ? 2 : 1, q = spr.bx;
        if (q) { const t = it._t || (it._t = [0, 0, 0, 0]); t[0] = rx0 + q[0]; t[1] = ry0 + q[1]; t[2] = rx0 + q[2]; t[3] = ry0 + q[3]; it.t = t; } else it.t = r;
        if (m === 2 && hexOn(e)) { const v = e.vb || b, h = it._h || (it._h = [0, 0, 0, 0, 0, 0]), x0 = e.x + v[0], y0 = e.y + v[1], x1 = e.x + v[2], y1 = e.y + v[3], z0 = e.z + (v[5] || 0), z1 = z0 + v[4]; h[0] = (x0 - y1) * U - HEXP; h[1] = (x1 - y0) * U + HEXP; h[2] = (x0 - z1) * U - HEXP; h[3] = (x1 - z0) * U + HEXP; h[4] = (y0 - z1) * U - HEXP; h[5] = (y1 - z0) * U + HEXP; it.h = h; } else it.h = null;
      } else { it.m = 0; it.h = null; it.t = r; }
    }
    for (let i = n; i < L.length && L[i].spr; i++) { L[i].spr = null; L[i].ob = null; L[i].e = null; L[i].sit = null; L[i].ns = 0; }
    for (let i = nsp; i < SP.length && SP[i].e; i++) { SP[i].e = null; SP[i].spr = null; SP[i].next = null; SP[i].ov = null; SP[i].host = null; }   // do not keep last frame's sprites / entities alive
    const S = sortItems(L, n, this._S); this.stats.items = S.length;
    // see-through: tall static objects drawn in front of the focus entity (the player) fade out
    let fi = -1, fo = null; for (let i = 0; i < S.length; i++) if (S[i].e && S[i].e.ghost && !S[i].e.hidden) { fi = i; fo = S[i]; break; }
    if (fi < 0 && gh) { fi = S.indexOf(gh.host); fo = gh; }   /* seated on a piece of furniture: the focus is drawn with that piece */
    const fading = this.fading || (this.fading = new Set()); for (const ob of fading) ob._want = 1;
    /* seating follow-ups (owner msg 180): a seated focus cannot step out from behind things and has no see-through copy, so for it the rule is 'what covers the head and chest fades', whatever its height
       (a hanging sign, shop shelving, a classroom partition, a lamp shade): see covers(). The piece it sits on fades only when it is tall and its own front part covers the head (a gazebo roof, a booth), no longer
       because it is tall (the grill table with its flue went see-through under its own guests). A big thing that is not a placed object (the arena's scoreboard faces, a bus) cannot fade: then the 30% copy is drawn after all. */
    const sf = fi >= 0 && SEATING && (fo === gh || isSitter(fo.e)); this._gs = null;
    if (fi >= 0) { const f = fo, fx = f.ax, fy = f.ay - 12; for (let i = fo === gh ? fi : fi + 1 /* a seated focus: the piece it sits on can itself be the tall thing in front (a gazebo, a booth) */; i < S.length; i++) { const it = S[i], ob = it.ob, r = it.r;
      if (!ob) { if (sf && !this._gs && it.e && it !== fo && it.spr.w * it.spr.h > 3000 && fx > r[0] + 4 && fx < r[2] - 4 && fy + 4 > r[1] + 4 && fy + 4 < r[3] - 4) this._gs = fo; continue; }
      if (ob.noFade /* never made see-through, e.g. an overlay that must keep covering what is under it */) continue;
      const tall = ob.B[5] - ob.B[2] >= 2.4 && !(fx < r[0] + 6 || fx > r[2] - 6 || fy < r[1] + 4 || fy > r[3] + 6) && !(ob.B[3] - ob.B[0] < 1.2 && ob.B[4] - ob.B[1] < 1.2);
      if (sf) { if (fo === gh && i === fi) { const ov = gh.ov; if (!tall || !ov || !covers(ob, ov, ov.x + it.ax, ov.y + it.ay, fx, f.ay, true)) continue; } else if (!tall && (fx + 4 < r[0] || fx - 4 > r[2] || f.ay < r[1] || f.ay - 16 > r[3] || !covers(ob, it.spr, it.spr.x + it.ax, it.spr.y + it.ay, fx, f.ay, false))) continue; }
      else if (!tall) continue;
      ob._want = .28; if (ob._a === undefined) ob._a = 1; fading.add(ob); } }
    for (const ob of fading) { ob._a += (ob._want - ob._a) * .18; if (ob._want === 1 && ob._a > .97) { ob._a = undefined; fading.delete(ob); } }
    for (const it of S) { const sp = it.spr;
      /* seating: somebody who sits with the back to the camera has the legs on the far side of the piece: the sprite's rows below the seat line go under the piece, the rest over it */
      if (it.ns) for (let q = it.sit; q; q = q.next) { if (q.e.dir < 2) continue; const qs = q.spr, r0 = Math.min(qs.h, 1 - qs.y), ea = q.e.alpha; if (r0 >= qs.h) continue; if (ea !== undefined) ctx.globalAlpha = ea; ctx.drawImage(qs.c, 0, r0, qs.w, qs.h - r0, qs.x + q.ax - cam.x, qs.y + q.ay - cam.y + r0, qs.w, qs.h - r0); if (ea !== undefined) ctx.globalAlpha = 1; }
      if (it.ob && it.ob._a !== undefined) { ctx.globalAlpha = it.ob._a; ctx.drawImage(sp.c, sp.x + it.ax - cam.x, sp.y + it.ay - cam.y); ctx.globalAlpha = 1; } else if (it.e && it.e.alpha !== undefined) { ctx.globalAlpha = it.e.alpha; ctx.drawImage(sp.c, sp.x + it.ax - cam.x, sp.y + it.ay - cam.y); ctx.globalAlpha = 1; } else ctx.drawImage(sp.c, sp.x + it.ax - cam.x, sp.y + it.ay - cam.y);
      /* seating: the piece's sitters (far to near), each followed by the parts of the piece in front of it */
      if (it.ns) for (let q = it.sit; q; q = q.next) { const qs = q.spr, ea = q.e.alpha; if (ea !== undefined) ctx.globalAlpha = ea; if (q.e.dir < 2) ctx.drawImage(qs.c, qs.x + q.ax - cam.x, qs.y + q.ay - cam.y); else { const r0 = Math.min(qs.h, 1 - qs.y); ctx.drawImage(qs.c, 0, 0, qs.w, r0, qs.x + q.ax - cam.x, qs.y + q.ay - cam.y, qs.w, r0); } if (ea !== undefined) ctx.globalAlpha = 1; const ov = q.ov; if (ov && it.ob._a === undefined) ctx.drawImage(ov.c, ov.x + it.ax - cam.x, ov.y + it.ay - cam.y);   /* (not while the piece is see-through: its front would be drawn twice) */ } }
    for (const it of S) if (it.e && it.e.ghost && !(SEATING && isSitter(it.e))) { ctx.globalAlpha = .3; ctx.drawImage(it.spr.c, it.spr.x + it.ax - cam.x, it.spr.y + it.ay - cam.y); ctx.globalAlpha = 1; }
    if (this._gs) { const g = this._gs, gs = g.spr; ctx.globalAlpha = .5; ctx.drawImage(gs.c, gs.x + g.ax - cam.x, gs.y + g.ay - cam.y); ctx.globalAlpha = 1; }   /* a seated focus behind something that cannot fade */
    const dark = env.dark || 0; tn = performance.now(); ST.tItems += tn - tm; tm = tn;
    if (env.amb && env.amb !== '#ffffff') {
      const m = this.Mx; m.globalCompositeOperation = 'source-over'; m.globalAlpha = 1;
      const nlOn = NL.mode !== 'old' && dark > .05, al = Math.min(1, dark * .5), occ = nlOn && NL.occ && world.poolOcc === true; nLB = 0; nHP = 0;   /* occ: a building hides the pools behind it (see "pools behind buildings") */
      /* perf: the mask of the world's own lights (ambient + every pool on screen: 20 to 40 draws a frame in town) is kept in tiles while nothing about it changes (all night; indoors all day): see _maskTiles. Same pixels. */
      const K = dark > .05 && NL.tiles ? this._maskKey(world, env.amb, al, occ) : null; if (occ) this._occPrep(world, S, K, env.amb, al);
      const tiled = K !== null && this._maskTiles(world, cam, env.amb, al, m, nlOn, occ, K); nLBw = nLB;
      if (!tiled) {
        m.fillStyle = env.amb; m.fillRect(0, 0, W, H);
        if (dark > .05) { m.globalCompositeOperation = 'lighter'; m.globalAlpha = al; const LL = world.lights; for (let i = 0; i < LL.length; i++) { const l = LL[i], rx = Math.round(l.r * U * 1.2), ry = Math.round(rx / 2)   /* half size of its pool sprite (see poolSprite) */, x = Math.round((l.x - l.y) * U) - cam.x - rx, y = Math.round((l.x + l.y) * U / 2 - l.z * U) - cam.y - ry; if (x > W || y > H || x + rx * 2 + 1 < 0 || y + ry * 2 + 1 < 0) continue;   /* perf: off-screen lights are rejected before the pool sprite is looked up (every light of the city, every frame) */ const ps = poolSprite(l.r, l.c || '#ffd9a0'); m.drawImage(ps, x, y); if (nlOn) addLight(x + rx, y + ry, ps, al, l.ob, l.x, l.y, l.z); } nLBw = nLB;
          if (occ && nLB) { camX = cam.x; camY = cam.y; this._occPass(m, S, S.length, 0, 0, W, H, env.amb, null); } }
      }
      if (dark > .05 && hooks.lights) { m.globalCompositeOperation = 'lighter'; m.globalAlpha = al; if (nlOn) { const tap = this._tap; tap.m = m; tap.w = occ ? world : null; tap.cx = cam.x; tap.cy = cam.y; hooks.lights(tap, cam, poolSprite); } else hooks.lights(m, cam, poolSprite); }
      /* night light: the pools stay on the ground; whoever stands on it is put into the mask as one flat colour (see _nightE) */
      if (nlOn && nLB) { const t0 = performance.now(); this._nightE(S, cam, env.amb, al, m, tiled, occ, K !== null ? K.gen : -1); ST.tNl += performance.now() - t0; }
      ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(this.M, 0, 0); ctx.globalCompositeOperation = 'source-over';
    }
    tn = performance.now(); ST.tAmb += tn - tm; tm = tn;
    if (dark > .02) {
      const b = this.Bx; b.globalCompositeOperation = 'source-over'; b.clearRect(0, 0, W, H); let any = false;
      /* perf: an item only has to be cut out of the light buffer where light has been drawn. The boxes around the glowing pixels of the sprites drawn so far are kept (GR; a sprite knows the box of its glow: sp.lb, engine/sprites.js),
       * and an item is only cut out where the box of its own pixels (sp.bx) overlaps one (for a placed object: where its six-sided outline does too, hexOf), and only that part of it. A light layer is drawn by its box as well. (It used to be one box around all light sprites, whole sprites: in a street that is soon the whole screen, and nearly every item was cut, one draw call each.) */
      nGR = 0; camX = cam.x; camY = cam.y; vW = W; vH = H;
      for (let i = 0; i < S.length; i++) { const it = S[i]; if (it.ob && it.ob._a !== undefined && it.ob._a < .6) continue; const sp = it.spr, x = sp.x + it.ax - cam.x, y = sp.y + it.ay - cam.y, q = sp.bx;
        if (nGR) { const x0 = q ? x + q[0] : x, y0 = q ? y + q[1] : y, x1 = q ? x + q[2] : x + sp.w, y1 = q ? y + q[3] : y + sp.h; if (x0 < gX1 && x1 > gX0 && y0 < gY1 && y1 > gY0 && hitBox(GR, nGR, x0, y0, x1, y1, it.ob && it.ob.vbl ? it.ob._hx || hexOf(it.ob) : null)) { b.globalCompositeOperation = 'destination-out'; b.drawImage(sp.c, hX0 - x, hY0 - y, hX1 - hX0, hY1 - hY0, hX0, hY0, hX1 - hX0, hY1 - hY0); } }
        if (sp.l) { b.globalCompositeOperation = 'source-over'; any = true; const g = sp.lb; if (g) { const w = g[2] - g[0], h = g[3] - g[1]; if (w > 0 && h > 0) { b.drawImage(sp.l, g[0], g[1], w, h, x + g[0], y + g[1], w, h); addG(x + g[0], y + g[1], x + g[2], y + g[3]); } } else { b.drawImage(sp.l, x, y); addG(x, y, x + sp.w, y + sp.h); } }
        if (it.ns && nGR) { for (let q = it.sit; q; q = q.next) { const qx = q.spr.x + q.ax - cam.x, qy = q.spr.y + q.ay - cam.y; if (hitBox(GR, nGR, qx, qy, qx + q.spr.w, qy + q.spr.h, null)) { b.globalCompositeOperation = 'destination-out'; b.drawImage(q.spr.c, hX0 - qx, hY0 - qy, hX1 - hX0, hY1 - hY0, hX0, hY0, hX1 - hX0, hY1 - hY0); } } } }
      if (any) { ctx.globalCompositeOperation = 'lighten'; ctx.globalAlpha = Math.min(1, dark); ctx.drawImage(this.B, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; }
    }
    tn = performance.now(); ST.tGlow += tn - tm; tm = tn;
    if (hooks.over) hooks.over(ctx, cam); ST.tOver += performance.now() - tm;
    this._ahead(world, cam, ents);
    return S;
  }
}
const BB = [-.2, -.2, .2, .2, 1.4];
