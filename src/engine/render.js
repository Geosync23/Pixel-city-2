// Frame renderer: ground chunks -> depth-sorted sprites -> ambient light map -> night lights.
import { WS, U, screenBox, renderJob, renderStep, renderResult } from './raster.js';
import { renderChunk, chunkJob, CH, outskirtChunks } from './ground.js';
import { toSpritePooled, objSprite, frontSprite, assetSprite, prebake, prebakeObj, bakePri, ageBakes, rushBake, sortBakes, bakeTick, spriteStats, sliceTest, workerTest, workerTestChar, workerObj, BAKE } from './sprites.js';
import { outskirtTrees, fadeAt, hazeAt } from './terrainfx.js';
import { ASSETS } from '../art/registry.js';
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

function behind(A, B) {
  // separation along x and along y (-1: A is behind, 1: A is in front, 0: ranges overlap)
  const sx = A[3] <= B[0] + 1e-6 ? -1 : B[3] <= A[0] + 1e-6 ? 1 : 0, sy = A[4] <= B[1] + 1e-6 ? -1 : B[4] <= A[1] + 1e-6 ? 1 : 0;
  // separated on both axes in opposite senses: the solids cannot really overlap on screen, so use one consistent order (centre depth) to avoid cycles -> no flicker
  if (sx && sy && sx !== sy) return A[0] + A[3] + A[1] + A[4] < B[0] + B[3] + B[1] + B[4];
  if (sx) return sx < 0; if (sy) return sy < 0;
  if (A[5] <= B[2] + 1e-6) return true; if (B[5] <= A[2] + 1e-6) return false;
  return A[0] + A[3] + A[1] + A[4] + (A[2] + A[5]) * .01 < B[0] + B[3] + B[1] + B[4] + (B[2] + B[5]) * .01;
}
/** topological depth sort of items {B: world AABB, r: screen rect, k: sort hint}. n: only the first n items of L; out: array to fill (perf: the renderer reuses its lists; the scratch arrays below are reused too, so a frame allocates nothing here) */
let sDeps = [], sCnt = new Int32Array(256), sOrder = new Int32Array(256), sStack = new Int32Array(1024), sSt = new Uint8Array(256);
export function sortItems(L, n = L.length, out = []) {
  if (sCnt.length < n) { sCnt = new Int32Array(n * 2); sOrder = new Int32Array(n * 2); sSt = new Uint8Array(n * 2); sStack = new Int32Array(n * 8); }
  const deps = sDeps, cnt = sCnt, st = sSt, order = sOrder, stack = sStack; while (deps.length < n) deps.push([]);
  cnt.fill(0, 0, n); st.fill(0, 0, n);
  for (let i = 0; i < n; i++) { const a = L[i].r; for (let j = i + 1; j < n; j++) { const b = L[j].r; if (a[0] >= b[2] || b[0] >= a[2] || a[1] >= b[3] || b[1] >= a[3]) continue; if (behind(L[i].B, L[j].B)) deps[j][cnt[j]++] = i; else deps[i][cnt[i]++] = j; } }
  /* order = indices by sort hint k, stable (an insertion sort: the same order as the Array.sort((p, q) => L[p].k - L[q].k) it replaces, without its temporary arrays) */
  for (let i = 0; i < n; i++) { const k = L[i].k; let j = i - 1; while (j >= 0 && L[order[j]].k > k) { order[j + 1] = order[j]; j--; } order[j + 1] = i; }
  let sp = 0, m = 0;
  for (let o = 0; o < n; o++) { const root = order[o]; if (st[root]) continue; stack[sp++] = root; stack[sp++] = 0; st[root] = 1; while (sp) { const idx = stack[sp - 1], i = stack[sp - 2]; if (idx < cnt[i]) { stack[sp - 1]++; const c = deps[i][idx]; if (!st[c]) { st[c] = 1; stack[sp++] = c; stack[sp++] = 0; } } else { sp -= 2; out[m++] = L[i]; } } }
  if (out.length !== m) out.length = m;
  return out;
}

/* the depth sort as it was before the perf pass, kept word for word for the test hook Renderer.sortCheck (tools/perf.mjs --verify): both must give the same order */
function sortItemsRef(L) {
  const n = L.length, deps = new Array(n);
  for (let i = 0; i < n; i++) deps[i] = null;
  for (let i = 0; i < n; i++) { const a = L[i].r; for (let j = i + 1; j < n; j++) { const b = L[j].r; if (a[0] >= b[2] || b[0] >= a[2] || a[1] >= b[3] || b[1] >= a[3]) continue; if (behind(L[i].B, L[j].B)) (deps[j] || (deps[j] = [])).push(i); else (deps[i] || (deps[i] = [])).push(j); } }
  const out = [], st = new Uint8Array(n), order = new Array(n); for (let i = 0; i < n; i++) order[i] = i; order.sort((p, q) => L[p].k - L[q].k);
  const stack = [];
  for (const root of order) { if (st[root]) continue; stack.push(root, 0); st[root] = 1; while (stack.length) { const idx = stack[stack.length - 1], i = stack[stack.length - 2], d = deps[i]; if (d && idx < d.length) { stack[stack.length - 1]++; const c = d[idx]; if (!st[c]) { st[c] = 1; stack.push(c, 0); } } else { stack.length -= 2; out.push(L[i]); } } }
  return out;
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
 * pets, vehicles, loose props) is put into the mask as ONE flat colour: the light at its feet (the pools that reach it, summed, in a few
 * bands). The flat colours are painted into a layer E in draw order, sprite shape by sprite shape, and whatever stands in front of a
 * lit thing (a building, a tree, a lamp post, the front of the bench somebody sits on) is cut out of E again, so the pools still show on
 * those. E is then laid over the mask before the multiply. Nothing is drawn twice on the frame itself and the static world is untouched.
 */
const NLQ = typeof location !== 'undefined' ? /[?&]nightlight=(\w+)/.exec(location.search || '') : null;
/* mode: 'new' | 'old' (the mask over everything, as before; ?nightlight=old or G.renderer.nightLight('old')). step: one band = this much of a pool's full strength (the pool's own rings are 1 / .7 / .35 with dithered halves in between, so .175 = one ring).
 * max: most bands (pools add up). hyst: a band only changes when the light is this far (in bands) past the edge. rate: frames between two band steps (a change of several bands is walked through, never jumped).
 * big: an entity whose sprite is larger than this many px keeps the pattern like the static world (train cars, airliners, parade floats, stage screens); vehicles are always lit as a whole.
 * budget / slots: the cache of flat-colour sprite shapes: at most `budget` px in total (x4 bytes), at most `slots` colours per sprite. */
export const NL = { mode: NLQ && NLQ[1] === 'old' ? 'old' : 'new', step: .175, max: 8, hyst: .22, rate: 3, big: 26000, propFoot: 4.5, propBig: 14000, budget: 3e6, slots: 4 };
let LB = new Float32Array(7 * 64), nLB = 0; const LO = [];   /* LO[i] = the object the light belongs to (a lamp post is not lit by its own lamp), or null */   // the pools drawn into the mask this frame: centre x, y, half size x, y (canvas px), colour x strength
function addLight(cx, cy, c, a, owner) {
  if (!c._rgb || !(a > 0)) return; if ((nLB + 1) * 7 > LB.length) { const n = new Float32Array(LB.length * 2); n.set(LB); LB = n; }
  LO[nLB] = owner || null; const o = nLB++ * 7, q = c._rgb; LB[o] = cx; LB[o + 1] = cy; LB[o + 2] = c._rx; LB[o + 3] = c._ry; LB[o + 4] = q[0] * a; LB[o + 5] = q[1] * a; LB[o + 6] = q[2] * a;
}
/* what scene.lights(m, cam, pool) hooks draw on: passes everything on to the mask and notes the pools (headlights, stage lights) */
class LightTap {
  constructor() { this.m = null; }
  get globalAlpha() { return this.m.globalAlpha; } set globalAlpha(v) { this.m.globalAlpha = v; }
  get globalCompositeOperation() { return this.m.globalCompositeOperation; } set globalCompositeOperation(v) { this.m.globalCompositeOperation = v; }
  get fillStyle() { return this.m.fillStyle; } set fillStyle(v) { this.m.fillStyle = v; }
  get canvas() { return this.m.canvas; }
  save() { this.m.save(); } restore() { this.m.restore(); } fillRect(x, y, w, h) { this.m.fillRect(x, y, w, h); }
  drawImage(img, x, y, w, h, a, b, c, d) { const m = this.m; if (w === undefined) { m.drawImage(img, x, y); if (img._rgb) addLight(x + img._rx, y + img._ry, img, m.globalAlpha, null); } else if (a === undefined) m.drawImage(img, x, y, w, h); else m.drawImage(img, x, y, w, h, a, b, c, d); }
}
/* the light at a point (canvas px) = the pools that reach it, summed (sR, sG, sB); sT = some pool overlaps the rectangle x0..y1 (the sprite) at all.
 * A pool's strength falls off like the average of its dithered rings: 1 in the core, .7 at 65%, .35 at 90%, 0 at the rim. */
let sR = 0, sG = 0, sB = 0, sT = false;
function sample(px, py, x0, y0, x1, y1, skip) {
  sR = sG = sB = 0; sT = false;
  for (let i = 0, o = 0; i < nLB; i++, o += 7) {
    if (skip && LO[i] === skip) continue; const cx = LB[o], cy = LB[o + 1], rx = LB[o + 2], ry = LB[o + 3]; if (x0 >= cx + rx || x1 <= cx - rx || y0 >= cy + ry || y1 <= cy - ry) continue; sT = true;
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
  const k = b * NL.step * al * 255, r = Math.min(255, aR + e._nhr * k) | 0, g = Math.min(255, aG + e._nhg * k) | 0, bl = Math.min(255, aB + e._nhb * k) | 0, ci = r << 16 | g << 8 | bl;
  if (ci !== e._ni) { e._ni = ci; e._ns = '#' + (0x1000000 + ci).toString(16).slice(1); }
  return b;
}
/* is this entity lit as a whole? (the rest keeps the pattern, like the static world, and hides lit things behind it) */
function isWhole(e, sp) {
  const n = e.nl; if (n !== undefined) return n === 'whole';   // an entity can say so itself: nl = 'whole' | 'ground'
  if (sp.l === sp.c) return false;   // a picture that is all light (a screen, a tank)
  if ((e.bb || BB)[4] < .08) return false;   // lies flat on the ground (a shadow, a ripple)
  return !!e.isVehicle || sp.w * sp.h <= NL.big;
}
/* is this placed object lit as a whole? Things that stand on the ground at the scale of a person or a street prop: posts, trees, bins, benches, barrels, parked cars, furniture.
 * Buildings, walls and other large pieces keep the pools on them (a wall takes a pool like the ground does); so does anything flat. An asset or an object can say nl: 'whole' | 'ground'. Cached on the object. */
function wholeOb(ob, sp) {
  const n = ob.nl || (ob.a && ob.a.nl), B = ob.B; let w;
  if (n) w = n === 'whole'; else w = B[5] - B[2] > .12 && B[3] - B[0] <= NL.propFoot && B[4] - B[1] <= NL.propFoot && sp.w * sp.h <= NL.propBig && sp.l !== sp.c;
  return ob._nw = w;
}
/* flat-colour copies of sprite shapes. Sprites out of the sprite cache never change (sp.im), so their copies are kept: up to NL.slots colours per sprite, NL.budget px in all (least recently drawn go first). Anything else is tinted on a scratch canvas each time it is drawn. */
const SILS = []; let silPx = 0, scratch = null, scratchX = null;
function tintInto(x, sp, col) { x.globalCompositeOperation = 'copy'; x.drawImage(sp.c, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = col; x.fillRect(0, 0, sp.w, sp.h); }
function silFor(sp, col, ci, fr) {
  if (!sp.im) { if (!scratch || scratch.width < sp.w || scratch.height < sp.h) { scratch = mk(Math.max(sp.w, scratch ? scratch.width : 64), Math.max(sp.h, scratch ? scratch.height : 64)); scratchX = scratch.getContext('2d'); } tintInto(scratchX, sp, col); return scratch; }
  const L = sp._nl || (sp._nl = []); let old = null;
  for (let i = 0; i < L.length; i++) { const s = L[i]; if (s.ci === ci) { s.fr = fr; return s.c; } if (!old || s.fr < old.fr) old = s; }
  if (L.length < NL.slots) { const c = mk(sp.w, sp.h), s = { c, x: c.getContext('2d'), ci, fr, sp, px: sp.w * sp.h }; tintInto(s.x, sp, col); L.push(s); SILS.push(s); silPx += s.px; if (silPx > NL.budget) silTrim(fr); return c; }
  old.ci = ci; old.fr = fr; tintInto(old.x, sp, col); return old.c;
}
function silTrim(fr) {
  SILS.sort((a, b) => a.fr - b.fr); let n = 0;
  while (n < SILS.length && silPx > NL.budget * .7 && SILS[n].fr < fr) { const s = SILS[n++], L = s.sp._nl, i = L ? L.indexOf(s) : -1; if (i >= 0) L.splice(i, 1); silPx -= s.px; s.sp = null; }
  SILS.splice(0, n);
}
/* the rectangles of E that hold something this frame (a thing in front only has to be cut out where it overlaps one) */
let ER = new Float32Array(4 * 128), nER = 0, eX0 = 0, eY0 = 0, eX1 = 0, eY1 = 0;
function addE(x0, y0, x1, y1) { if ((nER + 1) * 4 > ER.length) { const n = new Float32Array(ER.length * 2); n.set(ER); ER = n; } const o = nER++ * 4; ER[o] = x0; ER[o + 1] = y0; ER[o + 2] = x1; ER[o + 3] = y1; if (nER === 1) { eX0 = x0; eY0 = y0; eX1 = x1; eY1 = y1; } else { if (x0 < eX0) eX0 = x0; if (y0 < eY0) eY0 = y0; if (x1 > eX1) eX1 = x1; if (y1 > eY1) eY1 = y1; } }
function hitE(x0, y0, x1, y1) { if (x0 >= eX1 || x1 <= eX0 || y0 >= eY1 || y1 <= eY0) return false; for (let i = 0, o = 0; i < nER; i++, o += 4) if (x0 < ER[o + 2] && x1 > ER[o] && y0 < ER[o + 3] && y1 > ER[o + 1]) return true; return false; }


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

export class Renderer {
  constructor(canvas) { this.cv = canvas; this.ctx = canvas.getContext('2d'); this.B = mk(8, 8); this.M = mk(8, 8); this.E = mk(8, 8); this.Ex = this.E.getContext('2d'); this._eb = [0, 0, 0, 0]; this._tap = new LightTap(); this.nl = NL;   /* night light: E = the 'lit as a whole' layer of the light mask, _eb = the part of it used last frame */ this.Bx = this.B.getContext('2d'); this.Mx = this.M.getContext('2d'); this.W = 8;   /* QA8: B / M are only ever resized, so their contexts are fetched once (getContext was called twice a frame) */ this.H = 8; this.stats = { items: 0, chunks: 0, chunkBakes: 0, chunkMs: 0, aheadMs: 0, frames: 0, tGround: 0, tUnder: 0, tItems: 0, tAmb: 0, tGlow: 0, tOver: 0, tNl: 0, nlSil: 0, nlCut: 0 };   /* t*: total ms per part of draw() (tools/perf.mjs divides by frames) */ this.maxNewChunks = 2; this.frameNo = 0; this._scan = 0; this._L = []; this._S = []; this._Q = []; this.bake = BAKE;   /* the bake-ahead tunables (engine/sprites.js), reachable as G.renderer.bake */ this.ahead = { world: null, cx: 0, cy: 0, vx: 0, vy: 0, last: 0, base: 16.7, q: [] }; }
  /** test hook (tools/perf.mjs --verify): paint objects [from, from + n) of the world and every chunk both ways (whole / in bands); returns { tested, bad: [ids...] }. Expect bad = []. */
  sliceCheck(world, from = 0, n = 1e9, rows = 23) {
    const bad = [], seen = new Set(); let tested = 0;
    for (let i = from; i < Math.min(world.objs.length, from + n); i++) { const ob = world.objs[i], k = ob.id + '|' + JSON.stringify(ob.p) + (ob.flip ? '|F' : ''); if (seen.has(k)) continue; seen.add(k); tested++; try { if (sliceTest(screenBox(ob.vbl), () => ob.a.draw(ob.p), 3, ob.flip, rows)) bad.push(k.slice(0, 80)); } catch (e) { bad.push('ERR ' + k.slice(0, 60) + ' ' + e.message); } }
    return { tested, bad };
  }
  /** test hook: is the draw order of the frame just drawn the same as the old depth sort gives? { items, same } */
  sortCheck() { const L = this._L.filter(it => it.spr), ref = sortItemsRef(L), S = this._S; let same = ref.length === S.length; for (let i = 0; same && i < ref.length; i++) if (ref[i] !== S[i]) same = false; return { items: S.length, same }; }
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
  perf() { return Object.assign({}, this.stats, spriteStats(), { nlPx: silPx, nlCount: SILS.length }); }
  /** dev switch for A / B pictures: nightLight('old') = the light mask over everything (as before), nightLight('new') = pools on the ground, people and things lit as a whole (default; also the URL flag ?nightlight=old). Returns the mode. */
  nightLight(mode) { if (mode === 'old' || mode === 'new') NL.mode = mode; return NL.mode; }
  resize(W, H) { this.W = W; this.H = H; this.cv.width = W; this.cv.height = H; this.B.width = W; this.B.height = H; this.M.width = W; this.M.height = H; this.E.width = W; this.E.height = H; this._eb[0] = this._eb[1] = this._eb[2] = this._eb[3] = 0; this.ctx.imageSmoothingEnabled = false; }
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
   * night light: paint E = for every thing that is lit as a whole, its shape in its flat mask colour, in draw order; things that keep the
   * pattern are cut out of E where they stand in front. Then E goes over the mask m. S = this frame's sorted items (as drawn), al = the
   * strength the pools were drawn with. Mirrors the item loop of draw() step by step (sitters, see-through objects, the focus ghost).
   */
  _nightE(S, cam, amb, al, m) {
    const x = this.Ex, fr = this.frameNo, eb = this._eb, ST = this.stats, W = this.W, H = this.H;
    x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1; if (eb[2] > eb[0]) x.clearRect(eb[0], eb[1], eb[2] - eb[0], eb[3] - eb[1]); nER = 0;
    if (amb !== AMB) { AMB = amb; const n = parseInt(amb.slice(1), 16); aR = n >> 16; aG = n >> 8 & 255; aB = n & 255; }
    for (let i = 0; i < S.length; i++) {
      const it = S[i], sp = it.spr, dx = sp.x + it.ax - cam.x, dy = sp.y + it.ay - cam.y, e = it.e, ob = it.ob, oa = ob ? ob._a : undefined;
      /* this item: lit as a whole (its light: under its feet / the middle of its footprint, never its own lamp), or part of the patterned world */
      let who = null, lit = false;
      if (e) { if (isWhole(e, sp)) { who = e; sample(it.ax - cam.x, it.ay - cam.y, dx, dy, dx + sp.w, dy + sp.h, null); } }
      else if (ob._nw !== undefined ? ob._nw : wholeOb(ob, sp)) { who = ob; const B = ob.B, mx = (B[0] + B[3]) / 2, my = (B[1] + B[4]) / 2; sample(Math.round((mx - my) * U) - cam.x, Math.round((mx + my) * U / 2 - B[2] * U) - cam.y, dx, dy, dx + sp.w, dy + sp.h, ob); }
      if (who) lit = band(who, fr, al) > 0 || sT;
      /* sitters: on a piece that is lit as a whole they take the piece's colour (one thing, no seam); on anything else each is lit by the light on the ground under it. Legs behind the piece first (as in draw()). */
      if (it.ns) for (let q = it.sit; q; q = q.next) {
        const qs = q.spr, qe = q.e, qx = qs.x + q.ax - cam.x, qy = qs.y + q.ay - cam.y;
        if (who === ob && ob) { qe._ni = ob._ni; qe._ns = ob._ns; qe._nb = ob._nb; qe._nf = fr; qe._nt = fr; qe._nhr = ob._nhr; qe._nhg = ob._nhg; qe._nhb = ob._nhb; q.lit = lit; }
        else { sample(q.ax - cam.x, Math.round((qe.x + qe.y) * U / 2 - (ob ? ob.z : qe.z) * U) - cam.y, qx, qy, qx + qs.w, qy + qs.h, null); q.lit = band(qe, fr, al) > 0 || sT; }
        if (qe.dir < 2) continue; const r0 = Math.min(qs.h, 1 - qs.y); if (r0 >= qs.h) continue;
        if (q.lit) { if (qe.alpha !== undefined) x.globalAlpha = qe.alpha; x.drawImage(silFor(qs, qe._ns, qe._ni, fr), 0, r0, qs.w, qs.h - r0, qx, qy + r0, qs.w, qs.h - r0); x.globalAlpha = 1; addE(qx, qy + r0, qx + qs.w, qy + qs.h); ST.nlSil++; }
        else if (nER && hitE(qx, qy + r0, qx + qs.w, qy + qs.h)) { x.globalCompositeOperation = 'destination-out'; if (qe.alpha !== undefined) x.globalAlpha = qe.alpha; x.drawImage(qs.c, 0, r0, qs.w, qs.h - r0, qx, qy + r0, qs.w, qs.h - r0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; ST.nlCut++; }
      }
      if (lit) { who._nd = fr; const a = e ? e.alpha : oa; if (a !== undefined) x.globalAlpha = a; x.drawImage(silFor(sp, who._ns, who._ni, fr), 0, 0, sp.w, sp.h, dx, dy, sp.w, sp.h); x.globalAlpha = 1; addE(dx, dy, dx + sp.w, dy + sp.h); ST.nlSil++; }
      else if (nER && hitE(dx, dy, dx + sp.w, dy + sp.h) && !(oa !== undefined && oa < .05)) { x.globalCompositeOperation = 'destination-out'; if (oa !== undefined) x.globalAlpha = oa; else if (e && e.alpha !== undefined) x.globalAlpha = e.alpha; x.drawImage(sp.c, dx, dy); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; ST.nlCut++; }
      /* the piece's sitters (far to near), each followed by the part of the piece in front of it */
      if (it.ns) for (let q = it.sit; q; q = q.next) {
        const qs = q.spr, qe = q.e, qx = qs.x + q.ax - cam.x, qy = qs.y + q.ay - cam.y, rows = qe.dir < 2 ? qs.h : Math.min(qs.h, 1 - qs.y);
        if (rows > 0) {
          if (q.lit) { if (qe.alpha !== undefined) x.globalAlpha = qe.alpha; x.drawImage(silFor(qs, qe._ns, qe._ni, fr), 0, 0, qs.w, rows, qx, qy, qs.w, rows); x.globalAlpha = 1; addE(qx, qy, qx + qs.w, qy + rows); ST.nlSil++; }
          else if (nER && hitE(qx, qy, qx + qs.w, qy + rows)) { x.globalCompositeOperation = 'destination-out'; if (qe.alpha !== undefined) x.globalAlpha = qe.alpha; x.drawImage(qs.c, 0, 0, qs.w, rows, qx, qy, qs.w, rows); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; ST.nlCut++; }
        }
        const ov = q.ov; if (ov && oa === undefined && nER && !(lit && who === ob)) { const ox = ov.x + it.ax - cam.x, oy = ov.y + it.ay - cam.y; if (hitE(ox, oy, ox + ov.w, oy + ov.h)) { x.globalCompositeOperation = 'destination-out'; x.drawImage(ov.c, ox, oy); x.globalCompositeOperation = 'source-over'; ST.nlCut++; } }
      }
    }
    if (!nER) { eb[0] = eb[1] = eb[2] = eb[3] = 0; return; }
    /* the focus entity shows through what stands in front of it at 30% (draw()): so does its light */
    for (let i = 0; i < S.length; i++) { const e = S[i].e; if (!e || !e.ghost || e._nd !== fr || (SEATING && isSitter(e))) continue; const sp = S[i].spr, dx = sp.x + S[i].ax - cam.x, dy = sp.y + S[i].ay - cam.y; x.globalAlpha = .3; x.drawImage(silFor(sp, e._ns, e._ni, fr), 0, 0, sp.w, sp.h, dx, dy, sp.w, sp.h); x.globalAlpha = 1; }
    const x0 = Math.max(0, Math.floor(eX0)), y0 = Math.max(0, Math.floor(eY0)), x1 = Math.min(W, Math.ceil(eX1)), y1 = Math.min(H, Math.ceil(eY1)); eb[0] = x0; eb[1] = y0; eb[2] = x1; eb[3] = y1;
    if (x1 > x0 && y1 > y0) { m.globalCompositeOperation = 'source-over'; m.globalAlpha = 1; m.drawImage(this.E, x0, y0, x1 - x0, y1 - y0, x0, y0, x1 - x0, y1 - y0); }
  }
  /**
   * world: World. cam: {x,y} top-left in world px (integers). ents: dynamic entities, each
   *   { x,y,z, bb:[dx0,dy0,dx1,dy1,h] (sort box rel. to position), sprite(): {c,l,x,y,w,h}, hidden?, ghost? }
   * env: { amb: '#rrggbb' multiply colour, dark: 0..1 strength of night lights, bg: '#hex' }
   * hooks: { under(ctx,cam) after ground, over(ctx,cam) after lighting (markers, bubbles, weather) }
   */
  draw(world, cam, ents, env, hooks = {}) {
    const ctx = this.ctx, W = this.W, H = this.H, ST = this.stats; this.frameNo++; ST.frames++; let tm = performance.now(), tn;
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.fillStyle = world.bg || env.bg || '#9fd6e8'; ctx.fillRect(0, 0, W, H);
    this._ground(world, cam, ctx); tn = performance.now(); ST.tGround += tn - tm; tm = tn;
    if (hooks.under) hooks.under(ctx, cam); tn = performance.now(); ST.tUnder += tn - tm; tm = tn;
    /* perf: the item list, its items and the object query are reused from frame to frame (they were ~15 KB of garbage per frame) */
    const fr = this.frameNo, SP = this._SP || (this._SP = []); let nsp = 0, gh = null;   /* seating: sitter records (reused) + the seated focus entity, if any */
    const L = this._L, vx0 = cam.x - 4, vy0 = cam.y - 4, vx1 = cam.x + W + 4, vy1 = cam.y + H + 4; let n = 0;
    const Q = this._Q; Q.length = 0; world.query(vx0, vy0, vx1, vy1, Q);
    for (let i = 0; i < Q.length; i++) { const ob = Q[i]; if (ob.hidden) continue; const spr = objSprite(ob); if (!spr) continue; const wx = (ob.x - ob.y) * U, wy = (ob.x + ob.y) * U / 2 - ob.z * U;   /* = WS(ob.x, ob.y, ob.z) */ if (ob.size[2] <= .06 && !spr.l) { ctx.drawImage(spr.c, spr.x + wx - cam.x, spr.y + wy - cam.y); continue; } const it = L[n] || (L[n] = { B: null, spr: null, ax: 0, ay: 0, r: null, k: 0, ob: null, e: null, _B: [0, 0, 0, 0, 0, 0], _r: [0, 0, 0, 0] }); n++; it.B = ob.B; it.spr = spr; it.ax = wx; it.ay = wy; it.r = ob.sb; it.k = ob.k; it.ob = ob; it.e = null; it.ns = 0; ob._fr = fr; ob._it = it; }
    for (let i = 0; i < ents.length; i++) {
      const e = ents[i]; if (e.hidden) continue; const spr = e.sprite(); if (!spr) continue; const ax = Math.round((e.x - e.y) * U), ay = Math.round((e.x + e.y) * U / 2 - e.z * U);
      const rx0 = spr.x + ax, ry0 = spr.y + ay, rx1 = rx0 + spr.w, ry1 = ry0 + spr.h; if (rx1 < vx0 || rx0 > vx1 || ry1 < vy0 || ry0 > vy1) continue;
      if (SEATING && isSitter(e)) { const so = seatObj(world, e); if (so && so._fr === fr) { const h = so._it, q = SP[nsp] || (SP[nsp] = { e: null, spr: null, ax: 0, ay: 0, d: 0, ov: null, next: null }); nsp++; q.e = e; q.spr = spr; q.ax = ax; q.ay = ay; q.d = e.x + e.y; q.ov = seatOverlay(so, h.spr, e);
        /* the piece's sitters as a list, far to near */ if (!h.ns || q.d < h.sit.d) { q.next = h.ns ? h.sit : null; h.sit = q; } else { let p = h.sit; while (p.next && p.next.d <= q.d) p = p.next; q.next = p.next; p.next = q; } h.ns++; if (e.ghost && !gh) gh = q, q.host = h; continue; } }
      const it = L[n] || (L[n] = { B: null, spr: null, ax: 0, ay: 0, r: null, k: 0, ob: null, e: null, _B: [0, 0, 0, 0, 0, 0], _r: [0, 0, 0, 0] }); n++; it.ns = 0;
      const b = e.bb || BB, B = it._B, r = it._r; B[0] = e.x + b[0]; B[1] = e.y + b[1]; B[2] = e.z; B[3] = e.x + b[2]; B[4] = e.y + b[3]; B[5] = e.z + b[4]; r[0] = rx0; r[1] = ry0; r[2] = rx1; r[3] = ry1;
      it.B = B; it.spr = spr; it.ax = ax; it.ay = ay; it.r = r; it.k = B[0] + B[3] + B[1] + B[4]; it.ob = null; it.e = e;
    }
    for (let i = n; i < L.length && L[i].spr; i++) { L[i].spr = null; L[i].ob = null; L[i].e = null; L[i].sit = null; L[i].ns = 0; }
    for (let i = nsp; i < SP.length && SP[i].e; i++) { SP[i].e = null; SP[i].spr = null; SP[i].next = null; SP[i].ov = null; SP[i].host = null; }   // do not keep last frame's sprites / entities alive
    const S = sortItems(L, n, this._S); this.stats.items = S.length;
    // see-through: tall static objects drawn in front of the focus entity (the player) fade out
    let fi = -1, fo = null; for (let i = 0; i < S.length; i++) if (S[i].e && S[i].e.ghost && !S[i].e.hidden) { fi = i; fo = S[i]; break; }
    if (fi < 0 && gh) { fi = S.indexOf(gh.host); fo = gh; }   /* seated on a piece of furniture: the focus is drawn with that piece */
    const fading = this.fading || (this.fading = new Set()); for (const ob of fading) ob._want = 1;
    if (fi >= 0) { const f = fo, fx = f.ax, fy = f.ay - 12; for (let i = fo === gh ? fi : fi + 1 /* a seated focus: the piece it sits on can itself be the tall thing in front (a gazebo, a booth) */; i < S.length; i++) { const it = S[i], ob = it.ob; if (!ob || ob.noFade /* never made see-through, e.g. an overlay that must keep covering what is under it */ || ob.B[5] - ob.B[2] < 2.4) continue; const r = it.r; if (fx < r[0] + 6 || fx > r[2] - 6 || fy < r[1] + 4 || fy > r[3] + 6) continue; if (ob.B[3] - ob.B[0] < 1.2 && ob.B[4] - ob.B[1] < 1.2) continue; ob._want = .28; if (ob._a === undefined) ob._a = 1; fading.add(ob); } }
    for (const ob of fading) { ob._a += (ob._want - ob._a) * .18; if (ob._want === 1 && ob._a > .97) { ob._a = undefined; fading.delete(ob); } }
    for (const it of S) { const sp = it.spr;
      /* seating: somebody who sits with the back to the camera has the legs on the far side of the piece: the sprite's rows below the seat line go under the piece, the rest over it */
      if (it.ns) for (let q = it.sit; q; q = q.next) { if (q.e.dir < 2) continue; const qs = q.spr, r0 = Math.min(qs.h, 1 - qs.y), ea = q.e.alpha; if (r0 >= qs.h) continue; if (ea !== undefined) ctx.globalAlpha = ea; ctx.drawImage(qs.c, 0, r0, qs.w, qs.h - r0, qs.x + q.ax - cam.x, qs.y + q.ay - cam.y + r0, qs.w, qs.h - r0); if (ea !== undefined) ctx.globalAlpha = 1; }
      if (it.ob && it.ob._a !== undefined) { ctx.globalAlpha = it.ob._a; ctx.drawImage(sp.c, sp.x + it.ax - cam.x, sp.y + it.ay - cam.y); ctx.globalAlpha = 1; } else if (it.e && it.e.alpha !== undefined) { ctx.globalAlpha = it.e.alpha; ctx.drawImage(sp.c, sp.x + it.ax - cam.x, sp.y + it.ay - cam.y); ctx.globalAlpha = 1; } else ctx.drawImage(sp.c, sp.x + it.ax - cam.x, sp.y + it.ay - cam.y);
      /* seating: the piece's sitters (far to near), each followed by the parts of the piece in front of it */
      if (it.ns) for (let q = it.sit; q; q = q.next) { const qs = q.spr, ea = q.e.alpha; if (ea !== undefined) ctx.globalAlpha = ea; if (q.e.dir < 2) ctx.drawImage(qs.c, qs.x + q.ax - cam.x, qs.y + q.ay - cam.y); else { const r0 = Math.min(qs.h, 1 - qs.y); ctx.drawImage(qs.c, 0, 0, qs.w, r0, qs.x + q.ax - cam.x, qs.y + q.ay - cam.y, qs.w, r0); } if (ea !== undefined) ctx.globalAlpha = 1; const ov = q.ov; if (ov && it.ob._a === undefined) ctx.drawImage(ov.c, ov.x + it.ax - cam.x, ov.y + it.ay - cam.y);   /* (not while the piece is see-through: its front would be drawn twice) */ } }
    for (const it of S) if (it.e && it.e.ghost && !(SEATING && isSitter(it.e))) { ctx.globalAlpha = .3; ctx.drawImage(it.spr.c, it.spr.x + it.ax - cam.x, it.spr.y + it.ay - cam.y); ctx.globalAlpha = 1; }
    const dark = env.dark || 0; tn = performance.now(); ST.tItems += tn - tm; tm = tn;
    if (env.amb && env.amb !== '#ffffff') {
      const m = this.Mx; m.globalCompositeOperation = 'source-over'; m.globalAlpha = 1; m.fillStyle = env.amb; m.fillRect(0, 0, W, H);
      const nlOn = NL.mode !== 'old' && dark > .05, al = Math.min(1, dark * .5); nLB = 0;
      if (dark > .05) { m.globalCompositeOperation = 'lighter'; m.globalAlpha = al; const LL = world.lights; for (let i = 0; i < LL.length; i++) { const l = LL[i], rx = Math.round(l.r * U * 1.2), ry = Math.round(rx / 2)   /* half size of its pool sprite (see poolSprite) */, x = Math.round((l.x - l.y) * U) - cam.x - rx, y = Math.round((l.x + l.y) * U / 2 - l.z * U) - cam.y - ry; if (x > W || y > H || x + rx * 2 + 1 < 0 || y + ry * 2 + 1 < 0) continue;   /* perf: off-screen lights are rejected before the pool sprite is looked up (every light of the city, every frame) */ const ps = poolSprite(l.r, l.c || '#ffd9a0'); m.drawImage(ps, x, y); if (nlOn) addLight(x + rx, y + ry, ps, al, l.ob); } if (hooks.lights) { if (nlOn) { const tap = this._tap; tap.m = m; hooks.lights(tap, cam, poolSprite); } else hooks.lights(m, cam, poolSprite); } }
      /* night light: the pools stay on the ground; whoever stands on it is put into the mask as one flat colour (see _nightE) */
      if (nlOn && nLB) { const t0 = performance.now(); this._nightE(S, cam, env.amb, al, m); ST.tNl += performance.now() - t0; }
      ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(this.M, 0, 0); ctx.globalCompositeOperation = 'source-over';
    }
    tn = performance.now(); ST.tAmb += tn - tm; tm = tn;
    if (dark > .02) {
      const b = this.Bx; b.globalCompositeOperation = 'source-over'; b.clearRect(0, 0, W, H); let any = false;
      /* perf: an item only has to be cut out of the light buffer where light has been drawn: lx0..ly1 = the box around all light sprites drawn so far (cutting elsewhere changed nothing, but was a draw call per item per frame) */
      let lx0 = 1e9, ly0 = 1e9, lx1 = -1e9, ly1 = -1e9;
      for (let i = 0; i < S.length; i++) { const it = S[i]; if (it.ob && it.ob._a !== undefined && it.ob._a < .6) continue; const sp = it.spr, x = sp.x + it.ax - cam.x, y = sp.y + it.ay - cam.y; if (any && x < lx1 && x + sp.w > lx0 && y < ly1 && y + sp.h > ly0) { b.globalCompositeOperation = 'destination-out'; b.drawImage(sp.c, x, y); } if (sp.l) { b.globalCompositeOperation = 'source-over'; b.drawImage(sp.l, x, y); any = true; if (x < lx0) lx0 = x; if (y < ly0) ly0 = y; if (x + sp.w > lx1) lx1 = x + sp.w; if (y + sp.h > ly1) ly1 = y + sp.h; }
        if (it.ns && any) { b.globalCompositeOperation = 'destination-out'; for (let q = it.sit; q; q = q.next) b.drawImage(q.spr.c, q.spr.x + q.ax - cam.x, q.spr.y + q.ay - cam.y); } }
      if (any) { ctx.globalCompositeOperation = 'lighten'; ctx.globalAlpha = Math.min(1, dark); ctx.drawImage(this.B, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; }
    }
    tn = performance.now(); ST.tGlow += tn - tm; tm = tn;
    if (hooks.over) hooks.over(ctx, cam); ST.tOver += performance.now() - tm;
    this._ahead(world, cam, ents);
    return S;
  }
}
const BB = [-.2, -.2, .2, .2, 1.4];
