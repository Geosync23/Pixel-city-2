// Sprite cache: raster results -> canvases. Browser only.
// Perf (docs/reports/performance.md): besides the on-demand path (cached(): bake now, in one go), sprites can be baked AHEAD of need by the
// bake queue below: prebake*() queues a sprite that is about to come on screen, bakeTick(ms) (called once a frame by the renderer) spends a few
// milliseconds on the queue, drawing big sprites in row bands (raster.renderJob). If a queued sprite is needed before it is finished,
// cached() finishes it on the spot, so what is on screen never depends on the queue: same pixels, the work is only moved off the frame
// in which the thing first appears.
import * as R from './raster.js';
import { ASSETS, MODULES } from '../art/registry.js';

/* ---------- bake worker (perf) ----------
 * Object and character art cannot be drawn in bands (it plots pixel by pixel: a band costs as much as the whole sprite), and one big tree or
 * building takes 10-40 ms on a desktop core, 4x that on a phone: a visible stutter each time one is baked on the main thread. So queued
 * sprites that are plain data (a registry asset + params, or a character spec + pose) are drawn by a Web Worker: a second copy of this very
 * script (the single-file build's inline <script>, loaded from a Blob), in which only the art library and the rasteriser are used. The
 * worker returns the pixel buffers; the main thread only turns them into canvases. Same code, same inputs, same pixels (checked for every
 * object of the city by tools/perf.mjs --verify). If the worker cannot start (dev server, a sandbox that forbids blob: workers) or stops
 * answering, everything falls back to the main-thread queue below. BAKE.worker = false switches it off.
 */
const IN_WORKER = typeof document === 'undefined' && typeof self !== 'undefined' && typeof importScripts === 'function';
const WORKER_MARK = '/*maplebay-bake-worker*/';
if (IN_WORKER) {
  /* this copy only bakes: the game itself must not start here (src/main.js boots from a timer; nothing in a worker needs timers) */
  self.setTimeout = self.setInterval = () => 0;
  self.onmessage = ev => {
    const m = ev.data; let r = null;
    try {
      R.ENV.season = m.season;
      if (m.t === 'obj') { const a = ASSETS.get(m.a); if (a && typeof a.draw === 'function') r = R.render(R.screenBox(m.vb), () => a.draw(m.p), null, 3, m.flip); }
      else if (m.t === 'char') { const A = MODULES['./chars/char.js']; if (A && A.drawChar) r = R.render(m.sb, () => A.drawChar(m.spec, m.pose), null, 1); }
    } catch (e) { r = null; var err = String(e && e.message); }
    if (!r && !err) err = m.t === 'obj' ? (ASSETS.has(m.a) ? 'asset has no draw()' : 'no asset ' + m.a + ' (' + ASSETS.size + ' known)') : 'no character art';
    if (r) self.postMessage({ n: m.n, w: r.w, h: r.h, x: r.x, y: r.y, hasLight: r.hasLight, buf: r.buf.buffer, lb: r.hasLight ? r.lb.buffer : null }, r.hasLight ? [r.buf.buffer, r.lb.buffer] : [r.buf.buffer]);
    else self.postMessage({ n: m.n, fail: 1, err });
  };
  self.postMessage({ ready: 1 });
  /* Stop loading here. By now the art library is registered (src/main.js imports it first) and nothing after this module is needed for baking: the
   * simulation, the UI and the story data would only cost memory in this copy (measured: docs/reports/performance.md). The error is this worker's
   * own and is marked handled, so nothing is reported to the page. If the art is not there yet (an import order change), the rest loads as before. */
  if (ASSETS.size > 200 && MODULES['./chars/char.js']) { self.onerror = () => true; throw new Error('Maple Bay bake worker: art loaded; the rest of the game is skipped in this copy on purpose'); }
}
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
/** raster.render() result -> sprite {c: colour canvas, l: light canvas|null, x, y, w, h} (x,y = offset from the anchor in px) */
export function toSprite(r) {
  if (!r) return null; const n = r.w * r.h * 4;   // (buffers from the raster pool can be views into a larger ArrayBuffer)
  const c = mk(r.w, r.h); c.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(r.buf.buffer, r.buf.byteOffset, n), r.w, r.h), 0, 0);
  let l = null, lb = null; if (r.hasLight) { l = mk(r.w, r.h); l.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(r.lb.buffer, r.lb.byteOffset, n), r.w, r.h), 0, 0); lb = pixBox(r.lb, r.w, r.h); }
  return { c, l, x: r.x, y: r.y, w: r.w, h: r.h, bx: pixBox(r.buf, r.w, r.h), lb, im: 1 };   /* bx: the box around the sprite's own pixels, [x0, y0, x1, y1] in sprite px (sprites are painted with room to spare; the renderer's night passes only work on what is there).   /* im: a sprite of this cache: its canvases are never drawn on again (the night light keeps flat-colour copies of such sprites). lb: the box around the pixels that glow, [x0, y0, x1, y1] in sprite px (the renderer's night pass only cuts things out of the glow where there is glow) */
}
/* the box around the non-empty pixels of a layer */
function pixBox(d, w, h) {
  let y0 = 0, y1 = h - 1, x0 = w, x1 = -1, i = 0; const n = w * h;
  while (i < n && !d[i]) i++; if (i >= n) return [0, 0, 0, 0]; y0 = (i / w) | 0;
  i = n - 1; while (!d[i]) i--; y1 = (i / w) | 0;
  for (let y = y0; y <= y1; y++) { const o = y * w; let a = 0; while (a < x0 && !d[o + a]) a++; if (a < x0) x0 = a; let b = w - 1; while (b > x1 && !d[o + b]) b--; if (b > x1) x1 = b; }
  return [x0, y0, x1 + 1, y1 + 1];
}
/** toSprite for a result this module rendered itself with pooled buffers: the buffers go back to the raster pool */
export function toSpritePooled(r) { if (!r) return null; const s = toSprite(r); R.recycle(r); return s; }
const cache = new Map(); let total = 0; export const BUDGET = { px: 36e6 };
/* counters (Renderer.perf()): bakes = baked on demand (bakeMs) / pre = finished by the main-thread queue (preMs) / rushed = queued or sent to the worker but needed before they were ready / wk = drawn by the worker (wkMs = main-thread time to make their canvases) */
const STATS = { bakes: 0, bakeMs: 0, pre: 0, preMs: 0, slices: 0, rushed: 0, wk: 0, wkMs: 0, worker: '-', slow: [] };
const slow = (key, ms, how) => { if (ms > 6) { STATS.slow.push(how + ' ' + ms.toFixed(0) + 'ms ' + String(key).slice(0, 70)); if (STATS.slow.length > 40) STATS.slow.shift(); } };   // the last main-thread bakes over 6 ms (for tools/perf.mjs)
let tick = 0;   // advanced by bakeTick about once a second
function store(key, s) { cache.set(key, s); if (s) { total += s.w * s.h; s._t = tick; } if (total > BUDGET.px) for (const [k, v] of cache) { if (total <= BUDGET.px * .8 || k === key) break; cache.delete(k); if (v) total -= v.w * v.h; } }
/** LRU cache. key: string; make: () => sprite */
export function cached(key, make) {
  let s = cache.get(key);
  if (s !== undefined) { if (s === null || s._t !== tick) { cache.delete(key); cache.set(key, s); if (s) s._t = tick; } return s; }   // perf: "recently used" is refreshed at most once per LRU tick (~1 s), not on every hit of every frame
  const j = jobs.get(key);
  if (j) { STATS.rushed++; return finish(j, true); }   // queued and half-done: finish it now (still less work than starting over)
  if (flying.size && flying.delete(key)) STATS.rushed++;   // the worker is still drawing it: draw it here now (the worker's copy is ignored when it arrives)
  const t0 = performance.now(); s = make(); const ms = performance.now() - t0; STATS.bakes++; STATS.bakeMs += ms; slow(key, ms, 'now'); store(key, s);
  return s;
}
/** drop everything (call on season change) */
export function clearSprites() { cache.clear(); total = 0; jobs.clear(); queue.length = 0; epoch++; flying.clear(); landed.length = 0; }
export const spriteStats = () => ({ count: cache.size, px: total, queued: jobs.size, flying: flying.size, ...STATS });
const sw = b => [b[1], b[0], b[2], b[4], b[3], b[5]];
const objKey = ob => ob._key || (ob._key = ob.id + '|' + JSON.stringify(ob.p) + (ob.flip ? '|F' : ''));
/** sprite for a placed world object (see World.place). Anchor = WS(ob.x, ob.y, ob.z). */
export function objSprite(ob) {
  return cached(objKey(ob), () => { try { return toSpritePooled(R.render(R.screenBox(ob.vbl), () => ob.a.draw(ob.p), null, 3, ob.flip, true)); } catch (e) { console.warn('art error in ' + ob.id + ': ' + e.message); return null; } });
}
/**
 * seating (docs/reports/seating.md): the part of a placed object's sprite that lies on the camera side of the plane x >= v (ax 0) or
 * y >= v (ax 1), in the object's placed frame relative to (ob.x, ob.y): what must be drawn again over somebody sitting on it. The art is
 * drawn once more whole and once with a depth cut (raster.js setCut) on the main thread, on first use only; a pixel is kept when it is opaque and is the
 * pixel the whole sprite shows there, so drawing the overlay over the object changes nothing where nobody sits. Returns a sprite whose
 * x, y are offsets from the object's anchor (like objSprite), or null when nothing of the object is in front.
 */
export function frontSprite(ob, ax, v) {
  const base = objSprite(ob); if (!base) return null;
  return cached(objKey(ob) + '|cut' + ax + '|' + v, () => {
    /* both pictures are painted here (no read-back from the sprite's canvas, which would cost the browser its fast path for that canvas) */
    let r = null, full = null; const sb = R.screenBox(ob.vbl), draw = () => ob.a.draw(ob.p);
    try { full = R.render(sb, draw, null, 3, ob.flip, false); R.setCut({ ax, v }); r = R.render(sb, draw, null, 3, ob.flip, false); } catch (e) { r = null; } finally { R.setCut(null); }
    if (!r || !full || r.w !== base.w || r.h !== base.h) return null;
    const w = r.w, h = r.h, fb = r.buf, bb = full.buf; let x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let j = 0, q = 0; j < h; j++) for (let i = 0; i < w; i++, q++) { const c = fb[q]; if (c >>> 24 === 255 && c === bb[q]) { if (i < x0) x0 = i; if (i > x1) x1 = i; if (j < y0) y0 = j; if (j > y1) y1 = j; } else fb[q] = 0; }
    if (x1 < 0) return null;
    const cw = x1 - x0 + 1, ch = y1 - y0 + 1, out = new Uint32Array(cw * ch); for (let j = 0; j < ch; j++) out.set(fb.subarray((y0 + j) * w + x0, (y0 + j) * w + x0 + cw), j * cw);
    const c = mk(cw, ch); c.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(out.buffer), cw, ch), 0, 0); return { c, l: null, x: base.x + x0, y: base.y + y0, w: cw, h: ch };
  });
}
/** sprite for an asset drawn at the origin with params (vehicles etc). vb optional override. */
export function assetSprite(a, p, flip, key) {
  key = key || (a.id + '|' + JSON.stringify(p) + (flip ? '|F' : ''));
  return cached(key, () => { let vb = a.vb ? (typeof a.vb === 'function' ? a.vb(p) : a.vb) : null; if (!vb) { const s = typeof a.size === 'function' ? a.size(p) : a.size; vb = [-.3, -.3, 0, s[0] + .3, s[1] + .3, s[2] + .3]; } if (flip) vb = sw(vb); return toSpritePooled(R.render(R.screenBox(vb), () => a.draw(p), null, 3, flip, true)); });
}
/** sprite from a pixel-bounds draw function (characters): sb = [x0,y0,x1,y1] px around the anchor */
export function pixSprite(key, sb, draw) { return cached(key, () => toSpritePooled(R.render(sb, draw, null, 1, false, true))); }

/* ---------- bake queue (perf) ---------- */
// Tunables. msMax / msMin: the most / least the queue may spend per frame (bakeTick adapts in between: it backs off while frames come late and
// creeps back up while they are on time). small: banded jobs up to this many pixels are still drawn in one pass.
// ring / look / lookMax: how far around the screen the renderer looks for things to queue (px around the screen; frames of camera travel ahead; cap in px).
// entRing: extra px beyond the ring in which entities (citizens, vehicles) are asked to prebake. chunkLook / chunkLookMax: the same look-ahead for ground chunks (longer: they are big and painted on the main thread in slices). A wider ring bakes
// more sprites that are never seen (memory, and main-thread time to make their canvases); a narrower one leaves more to be finished on the spot.
// urgent: jobs nearer to the screen than this many px always get the full msMax.
// worker: use the bake worker when it can start. flying: sprites handed to the worker at a time. patience: ms without an answer before the worker is given up (and twice that for it to start).
// minMemGB: the worker (a second copy of the script: memory) is not started on devices that report less RAM than this (navigator.deviceMemory; browsers that do not report it get the worker).
export const BAKE = { on: true, msMax: 5, msMin: 1.2, small: 9000, maxQueue: 400, ring: 20, look: 80, lookMax: 240, entRing: 36, chunkLook: 150, chunkLookMax: 420, urgent: 56, worker: true, flying: 4, patience: 15000, minMemGB: 4 };
const jobs = new Map(), queue = [];   // key -> job; queue = the same jobs, most urgent first (the renderer re-sorts by distance to the screen)
/**
 * Queue a sprite for baking ahead of need. start() -> a raster.renderJob, or null for "nothing to draw" (called when the job first runs).
 * pri: smaller = sooner (px from the screen edge). warn: label for the console warning if the art throws (the sprite is then null, as in objSprite).
 * fin: optional (rasterResult|null) => void: the job is not a sprite of this cache (ground chunks); the caller stores the result itself.
 * bands: draw it a band of rows per slice. Only worth it for drawings made of fill()ed polygons (the ground): most object art plots pixel by
 * pixel (trees, tower facades), so a band costs as much as the whole sprite (measured: docs/reports/performance.md) and those are baked in one pass.
 */
export function prebake(key, start, pri = 0, warn = null, fin = null, bands = false, msg = null) {
  if (!BAKE.on || (!fin && cache.has(key)) || flying.has(key)) return false; const j = jobs.get(key); if (j) { if (pri < j.pri) j.pri = pri; return false; }
  if (queue.length >= BAKE.maxQueue) return false;
  const job = { key, start, pri, warn, fin, bands, msg, rj: null, rows: 0, ms: 0, last: 0 }; jobs.set(key, job); queue.push(job); return true;
}
/** queue a placed world object (same sprite as objSprite). Registry assets are drawn by the bake worker when there is one. */
export function prebakeObj(ob, pri) { const key = objKey(ob); if (cache.has(key) || flying.has(key)) return false; const j = jobs.get(key); if (j) { j.pri = pri; return false; } return prebake(key, () => R.renderJob(R.screenBox(ob.vbl), () => ob.a.draw(ob.p), null, 3, ob.flip), pri, ob.id, null, false, workerObj(ob)); }
/* What the worker needs to draw this object, or null if it must be drawn here. The sprite cache already assumes that a sprite with the standard key
 * (asset id | params | flip) depends on nothing else, so such an object can be drawn from the registry's asset in the worker. Dressed objects
 * (world/_dress.js: key = standard key + '|' + JSON of extra params, draw = the asset's draw with params + extra) are sent with the merged params.
 * Anything else with its own key, and custom drawables (World.placeCustom: closures), cannot be sent. tools/perf.mjs --verify compares every
 * object of the city, drawn both ways. */
export function workerObj(ob) {
  if (!ASSETS.has(ob.id)) return null; const key = objKey(ob), def = ob.id + '|' + JSON.stringify(ob.p) + (ob.flip ? '|F' : '');
  if (key === def) return { t: 'obj', a: ob.id, p: ob.p, flip: !!ob.flip, vb: ob.vbl };
  if (key.length > def.length + 2 && key.startsWith(def + '|{') && key.endsWith('}')) { try { const extra = JSON.parse(key.slice(def.length + 1)); let a = ob.a, n = 0; while (a && a !== ASSETS.get(ob.id) && n++ < 4) a = Object.getPrototypeOf(a); if (a === ASSETS.get(ob.id) && extra && typeof extra === 'object') return { t: 'obj', a: ob.id, p: Object.assign({}, ob.p, extra), flip: !!ob.flip, vb: ob.vbl }; } catch (e) { } }
  return null;
}
/** queue an asset sprite (same sprite and key as assetSprite(a, p, flip) for a registry asset: vehicles) */
export function prebakeAsset(a, p, flip, pri, key) {
  key = key || (a.id + '|' + JSON.stringify(p) + (flip ? '|F' : '')); if (cache.has(key)) return false;   // key: the same optional own key as assetSprite's 4th argument
  let vb = a.vb ? (typeof a.vb === 'function' ? a.vb(p) : a.vb) : null; if (!vb) { const s = typeof a.size === 'function' ? a.size(p) : a.size; vb = [-.3, -.3, 0, s[0] + .3, s[1] + .3, s[2] + .3]; } if (flip) vb = sw(vb);
  return prebake(key, () => R.renderJob(R.screenBox(vb), () => a.draw(p), null, 3, flip), pri, null, null, false, ASSETS.get(a.id) === a ? { t: 'obj', a: a.id, p, flip: !!flip, vb } : null);
}
/** queue a pixSprite (characters) */
export function prebakePix(key, sb, draw, pri) { return prebake(key, () => R.renderJob(sb, draw, null, 1), pri); }
/** queue a character sprite: the same picture as pixSprite(key, sb, () => drawChar(spec, pose)) with the game's character art; drawn by the bake worker when there is one */
export function prebakeChar(key, sb, spec, pose, pri) { const A = MODULES['./chars/char.js']; if (!A || !A.drawChar) return false; return prebake(key, () => R.renderJob(sb, () => A.drawChar(spec, pose), null, 1), pri, null, null, false, { t: 'char', sb, spec, pose }); }
export const isQueued = key => jobs.has(key);
/** forget a queued job (its work so far is thrown away) */
export function dropBake(key) { const j = jobs.get(key); if (!j) return; jobs.delete(key); const i = queue.indexOf(j); if (i >= 0) queue.splice(i, 1); }
/** finish a queued job right now (a `fin` job that is needed this frame). Returns false if it was not queued. */
export function rushBake(key) { const j = jobs.get(key); if (!j) return false; STATS.rushed++; finish(j, true); return true; }
/** re-order the queue (the renderer calls this after it has refreshed the priorities) */
export function sortBakes() { queue.sort((a, b) => a.pri - b.pri); }
/* switches for testing on a device: add ?nobakeworker (bake ahead on the main thread only) or ?nobake (the old behaviour: everything baked when it first appears) to the page address */
try { if (typeof location !== 'undefined' && location.search) { if (/[?&]nobakeworker\b/.test(location.search)) BAKE.worker = false; if (/[?&]nobake\b/.test(location.search)) BAKE.on = false; } } catch (e) { }
/** push every queued job back by d px (the renderer then resets the ones still in its ring) and forget the unstarted ones that drifted beyond `max` */
export function ageBakes(d, max) { for (let i = queue.length - 1; i >= 0; i--) { const j = queue[i]; j.pri += d; if (j.pri > max && !j.rj) { queue.splice(i, 1); jobs.delete(j.key); } } }
/** set a queued job's priority */
export function bakePri(key, pri) { const j = jobs.get(key); if (j) j.pri = pri; }
// one slice of a job: about `ms` milliseconds of rows (the row count adapts to what the last band cost). Returns true when the job is finished.
function slice(job, ms) {
  let rj = job.rj; const t0 = performance.now();
  try {
    if (!rj) { rj = job.rj = job.start(); if (!rj) { job.ms += performance.now() - t0; return true; } job.rows = !job.bands || rj.w * rj.h <= BAKE.small ? rj.h : Math.max(8, Math.ceil(6000 / rj.w)); }
    else job.rows = Math.max(4, Math.round(job.rows * Math.max(.5, Math.min(4, ms / Math.max(.05, job.last)))));
    const fin = R.renderStep(rj, ms === Infinity ? rj.h : job.rows); job.last = performance.now() - t0; job.ms += job.last; STATS.slices++;
    return fin;
  } catch (e) { if (job.warn) console.warn('art error in ' + job.warn + ': ' + e.message); job.rj = null; job.ms += performance.now() - t0; return true; }
}
function finish(job, now) {
  if (now) slice(job, Infinity);
  jobs.delete(job.key); const i = queue.indexOf(job); if (i >= 0) queue.splice(i, 1);
  const t0 = performance.now(), res = job.rj ? R.renderResult(job.rj) : null; let out;
  if (job.fin) job.fin(res); else { out = toSpritePooled(res); store(job.key, out); }
  STATS.pre++; STATS.preMs += job.ms + performance.now() - t0; if (!job.bands) slow(job.key, job.ms, now ? 'rushed' : 'queue'); return out;
}
/* ----- the worker's main-thread side ----- */
let worker = null, wstate = 0, epoch = 0, seq = 0, wlast = 0;   // wstate: 0 not tried, 1 starting, 2 ready, -1 unavailable
const flying = new Map(), landed = [];   // key -> { n, ep, job, t } sent to the worker; landed = results waiting to be turned into canvases
function workerOff(why) { if (wstate === -1) return; wstate = -1; STATS.worker = 'off: ' + why; try { worker && worker.terminate(); } catch (e) { } worker = null;
  for (const [key, f] of flying) if (f.ep === epoch && !cache.has(key) && !jobs.has(key)) { jobs.set(key, f.job); queue.push(f.job); } flying.clear(); landed.length = 0; }   // what it was drawing goes back to the main-thread queue
function workerStart() {
  wstate = 1; STATS.worker = 'starting';
  try {
    let src = null; for (const sc of document.scripts) if (!sc.src && sc.textContent.length > 100000 && sc.textContent.indexOf(WORKER_MARK) >= 0) { src = sc.textContent; break; }
    if (!src) return workerOff('no inline script (dev build)');
    const url = URL.createObjectURL(new Blob([src], { type: 'text/javascript' })); worker = new Worker(url); wlast = performance.now();
    worker.onerror = e => { if (e && e.preventDefault) e.preventDefault(); workerOff('error ' + ((e && e.message) || '')); };
    worker.onmessage = ev => { const m = ev.data; wlast = performance.now(); if (tests.has(m.n)) { tests.get(m.n)(m); tests.delete(m.n); return; } if (m.ready) { wstate = 2; STATS.worker = 'on'; try { URL.revokeObjectURL(url); } catch (e) { } return; } landed.push(m); };
  } catch (e) { workerOff('cannot start: ' + e.message); }
}
/* hand queued jobs to the worker (at most BAKE.flying at a time, most urgent first) and turn finished ones into canvases (inside the frame's allowance) */
function workerPump(t0, allow) {
  if (wstate === 0) { const mem = typeof navigator !== 'undefined' && navigator.deviceMemory; if (mem && mem < BAKE.minMemGB) { wstate = -1; STATS.worker = 'off: device reports ' + mem + ' GB of memory'; } else if (BAKE.worker && typeof Worker === 'function' && typeof Blob === 'function' && typeof document !== 'undefined') workerStart(); else wstate = -1; }
  if (wstate === 1 && performance.now() - wlast > BAKE.patience * 2) workerOff('did not start');
  if (wstate !== 2) return;
  if (!BAKE.worker) return workerOff('switched off');
  if (flying.size && performance.now() - wlast > BAKE.patience) return workerOff('stopped answering');
  while (landed.length && performance.now() - t0 < allow) {
    const m = landed.shift(); let key = null, f = null; for (const [k, v] of flying) if (v.n === m.n) { key = k; f = v; break; }
    if (!f) continue; flying.delete(key); if (f.ep !== epoch || cache.has(key)) continue;   // baked meanwhile on the main thread, or the season changed
    if (m.fail) { if (!jobs.has(key)) { f.job.msg = null; jobs.set(key, f.job); queue.push(f.job); } continue; }   // the worker could not draw it: main-thread queue
    const u0 = performance.now(); store(key, toSpritePooled({ w: m.w, h: m.h, x: m.x, y: m.y, hasLight: m.hasLight, buf: new Uint32Array(m.buf), lb: m.lb ? new Uint32Array(m.lb) : null })); STATS.wk++; STATS.wkMs += performance.now() - u0;
  }
  for (let i = 0; i < queue.length && flying.size < BAKE.flying; i++) {
    const job = queue[i]; if (!job.msg || job.rj) continue;
    const n = ++seq; try { worker.postMessage(Object.assign({ n, season: R.ENV.season }, job.msg)); } catch (e) { job.msg = null; continue; }   // params that cannot be copied to a worker: main-thread queue
    queue.splice(i--, 1); jobs.delete(job.key); flying.set(job.key, { n, ep: epoch, job }); if (flying.size === 1) wlast = performance.now();
  }
}
const tests = new Map();
/** test hook (tools/perf.mjs --verify): have the worker draw `msg` and compare with the main thread's own drawing `draw` (sb / pad / flip as for render). Resolves to the number of differing pixels (0 = identical), -1 for a different size, null if there is no worker or it could not draw it. */
export function workerTest(msg, sb, draw, pad, flip) {
  if (wstate === 0) workerStart(); if (wstate === -1) return Promise.resolve(null);
  return new Promise(res => { const go = () => { if (wstate === -1) return res(null); if (wstate !== 2) return setTimeout(go, 50); const n = ++seq; tests.set(n, m => { if (m.fail) return res(m.err ? 'worker: ' + m.err : null); const a = R.render(sb, draw, null, pad, flip), b = new Uint32Array(m.buf), l = m.lb ? new Uint32Array(m.lb) : null; if (a.w !== m.w || a.h !== m.h || a.x !== m.x || a.y !== m.y || a.hasLight !== m.hasLight) return res(-1); let d = 0; for (let i = 0; i < b.length; i++) if (a.buf[i] !== b[i] || (l && a.lb[i] !== l[i])) d++; res(d); }); try { worker.postMessage(Object.assign({ n, season: R.ENV.season }, msg)); } catch (e) { tests.delete(n); res('post: ' + e.message); } }; go(); });
}
/** test hook: a character (spec + pose) drawn by the worker vs. here; resolves like workerTest */
export function workerTestChar(spec, pose) { const A = MODULES['./chars/char.js']; if (!A || !A.drawChar) return Promise.resolve(null); return workerTest({ t: 'char', sb: A.CHAR_SB, spec, pose }, A.CHAR_SB, () => A.drawChar(spec, pose), 1, false); }
let allow = 3;   // the current per-frame allowance in ms (between BAKE.msMin and BAKE.msMax)
/**
 * Spend up to the frame's allowance on the queue. late: true if the last frame came late (the allowance then shrinks; it grows back while
 * frames are on time), so slow devices bake less per frame and keep their frame rate; whatever is not ready in time is finished on demand
 * exactly as before. Returns the milliseconds used.
 */
export function bakeTick(late) {
  tick = (performance.now() / 1000) | 0; if (!BAKE.on) return 0;
  if (wstate === 0) workerPump(0, 0);   // start the worker with the first frame, before there is anything to bake
  if (!queue.length && !flying.size) return 0;
  allow = late ? Math.max(BAKE.msMin, allow * .7) : Math.min(BAKE.msMax, allow + .15);
  const t0 = performance.now(); workerPump(t0, allow); let used = performance.now() - t0;
  const wk = wstate === 2 || wstate === 1;   // (while the worker is still starting, its jobs wait for it)
  for (let i = 0; i < queue.length;) {
    const job = queue[i]; if (wk && job.msg && !job.rj) { i++; continue; }   // waits for a free worker slot (or is drawn on the spot if it comes on screen first)
    /* a job that is about to scroll into view (pri = px from the screen) may use the full allowance even while frames are late: finishing it in slices is still cheaper than finishing it all at once when it appears */
    const lim = job.pri < BAKE.urgent ? Math.max(allow, BAKE.msMax) : allow; if (used >= lim) break;
    if (slice(job, lim - used)) finish(job, false);
    used = performance.now() - t0;
  }
  return used;
}

/** test hook (tools/perf.mjs --verify): draw one sprite both ways, in one go and in bands of `rows` rows, and return the number of differing pixels (must be 0) */
export function sliceTest(sb, draw, pad, flip, rows) {
  const a = R.render(sb, draw, null, pad, flip), j = R.renderJob(sb, draw, null, pad, flip); let k = 0; while (!R.renderStep(j, rows + (k++ % 3) * 7)); const b = R.renderResult(j);
  if (a.w !== b.w || a.h !== b.h || a.x !== b.x || a.y !== b.y || a.hasLight !== b.hasLight) return -1; let d = 0; for (let i = 0; i < a.buf.length; i++) if (a.buf[i] !== b.buf[i] || a.lb[i] !== b.lb[i]) d++; return d;
}
