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
    if (r) self.postMessage({ n: m.n, w: r.w, h: r.h, x: r.x, y: r.y, hasLight: r.hasLight, buf: r.buf.buffer, lb: r.hasLight ? r.lb.buffer : null }, r.hasLight ? [r.buf.buffer, r.lb.buffer] : [r.buf.buffer]);
    else self.postMessage({ n: m.n, fail: 1, err });
  };
  self.postMessage({ ready: 1 });
}
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
/** raster.render() result -> sprite {c: colour canvas, l: light canvas|null, x, y, w, h} (x,y = offset from the anchor in px) */
export function toSprite(r) {
  if (!r) return null;
  const c = mk(r.w, r.h); c.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(r.buf.buffer), r.w, r.h), 0, 0);
  let l = null; if (r.hasLight) { l = mk(r.w, r.h); l.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(r.lb.buffer), r.w, r.h), 0, 0); }
  return { c, l, x: r.x, y: r.y, w: r.w, h: r.h };
}
const cache = new Map(); let total = 0; export const BUDGET = { px: 36e6 };
const STATS = { bakes: 0, bakeMs: 0, pre: 0, preMs: 0, slices: 0, rushed: 0, wk: 0, wkMs: 0, worker: '-' };   // on-demand bakes / pre-bakes finished by the main-thread queue / queued bakes that had to be finished on the spot / sprites drawn by the worker (wkMs = main-thread time to make their canvases)
function store(key, s) { cache.set(key, s); if (s) total += s.w * s.h; if (total > BUDGET.px) for (const [k, v] of cache) { if (total <= BUDGET.px * .8 || k === key) break; cache.delete(k); if (v) total -= v.w * v.h; } }
/** LRU cache. key: string; make: () => sprite */
export function cached(key, make) {
  let s = cache.get(key);
  if (s !== undefined) { cache.delete(key); cache.set(key, s); return s; }
  const j = jobs.get(key);
  if (j) { STATS.rushed++; return finish(j, true); }   // queued and half-done: finish it now (still less work than starting over)
  if (flying.size && flying.delete(key)) STATS.rushed++;   // the worker is still drawing it: draw it here now (the worker's copy is ignored when it arrives)
  const t0 = performance.now(); s = make(); STATS.bakes++; STATS.bakeMs += performance.now() - t0; store(key, s);
  return s;
}
/** drop everything (call on season change) */
export function clearSprites() { cache.clear(); total = 0; jobs.clear(); queue.length = 0; epoch++; flying.clear(); landed.length = 0; }
export const spriteStats = () => ({ count: cache.size, px: total, queued: jobs.size, flying: flying.size, ...STATS });
const sw = b => [b[1], b[0], b[2], b[4], b[3], b[5]];
const objKey = ob => ob._key || (ob._key = ob.id + '|' + JSON.stringify(ob.p) + (ob.flip ? '|F' : ''));
/** sprite for a placed world object (see World.place). Anchor = WS(ob.x, ob.y, ob.z). */
export function objSprite(ob) {
  return cached(objKey(ob), () => { try { return toSprite(R.render(R.screenBox(ob.vbl), () => ob.a.draw(ob.p), null, 3, ob.flip)); } catch (e) { console.warn('art error in ' + ob.id + ': ' + e.message); return null; } });
}
/** sprite for an asset drawn at the origin with params (vehicles etc). vb optional override. */
export function assetSprite(a, p, flip, key) {
  key = key || (a.id + '|' + JSON.stringify(p) + (flip ? '|F' : ''));
  return cached(key, () => { let vb = a.vb ? (typeof a.vb === 'function' ? a.vb(p) : a.vb) : null; if (!vb) { const s = typeof a.size === 'function' ? a.size(p) : a.size; vb = [-.3, -.3, 0, s[0] + .3, s[1] + .3, s[2] + .3]; } if (flip) vb = sw(vb); return toSprite(R.render(R.screenBox(vb), () => a.draw(p), null, 3, flip)); });
}
/** sprite from a pixel-bounds draw function (characters): sb = [x0,y0,x1,y1] px around the anchor */
export function pixSprite(key, sb, draw) { return cached(key, () => toSprite(R.render(sb, draw, null, 1))); }

/* ---------- bake queue (perf) ---------- */
// Tunables. msMax / msMin: the most / least the queue may spend per frame (bakeTick adapts in between: it backs off while frames come late and
// creeps back up while they are on time). small: banded jobs up to this many pixels are still drawn in one pass.
// ring / look / lookMax: how far around the screen the renderer looks for things to queue (px around the screen; frames of camera travel ahead; cap in px).
// worker: use the bake worker when it can start. flying: sprites handed to the worker at a time.
export const BAKE = { on: true, msMax: 5, msMin: 1.2, small: 9000, maxQueue: 400, ring: 32, look: 150, lookMax: 300, worker: true, flying: 4 };
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
export function prebakeObj(ob, pri) { return prebake(objKey(ob), () => R.renderJob(R.screenBox(ob.vbl), () => ob.a.draw(ob.p), null, 3, ob.flip), pri, ob.id, null, false, ASSETS.get(ob.id) === ob.a ? { t: 'obj', a: ob.id, p: ob.p, flip: !!ob.flip, vb: ob.vbl } : null); }
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
  if (job.fin) job.fin(res); else { out = toSprite(res); store(job.key, out); }
  STATS.pre++; STATS.preMs += job.ms + performance.now() - t0; return out;
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
  if (wstate === 0) { if (BAKE.worker && typeof Worker === 'function' && typeof Blob === 'function' && typeof document !== 'undefined') workerStart(); else wstate = -1; }
  if (wstate === 1 && performance.now() - wlast > 30000) workerOff('did not start');
  if (wstate !== 2) return;
  if (!BAKE.worker) return workerOff('switched off');
  if (flying.size && performance.now() - wlast > 15000) return workerOff('stopped answering');
  while (landed.length && performance.now() - t0 < allow) {
    const m = landed.shift(); let key = null, f = null; for (const [k, v] of flying) if (v.n === m.n) { key = k; f = v; break; }
    if (!f) continue; flying.delete(key); if (f.ep !== epoch || cache.has(key)) continue;   // baked meanwhile on the main thread, or the season changed
    if (m.fail) { if (!jobs.has(key)) { f.job.msg = null; jobs.set(key, f.job); queue.push(f.job); } continue; }   // the worker could not draw it: main-thread queue
    const u0 = performance.now(); store(key, toSprite({ w: m.w, h: m.h, x: m.x, y: m.y, hasLight: m.hasLight, buf: new Uint32Array(m.buf), lb: m.lb ? new Uint32Array(m.lb) : null })); STATS.wk++; STATS.wkMs += performance.now() - u0;
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
let allow = 3;   // the current per-frame allowance in ms (between BAKE.msMin and BAKE.msMax)
/**
 * Spend up to the frame's allowance on the queue. late: true if the last frame came late (the allowance then shrinks; it grows back while
 * frames are on time), so slow devices bake less per frame and keep their frame rate; whatever is not ready in time is finished on demand
 * exactly as before. Returns the milliseconds used.
 */
export function bakeTick(late) {
  if (!queue.length && !flying.size) return 0;
  allow = late ? Math.max(BAKE.msMin, allow * .7) : Math.min(BAKE.msMax, allow + .15);
  const t0 = performance.now(); workerPump(t0, allow); let used = performance.now() - t0;
  const wk = wstate === 2;
  for (let i = 0; i < queue.length && used < allow;) {
    const job = queue[i]; if (wk && job.msg && !job.rj) { i++; continue; }   // waits for a free worker slot (or is drawn on the spot if it comes on screen first)
    if (slice(job, allow - used)) finish(job, false);
    used = performance.now() - t0;
  }
  return used;
}

/** test hook (tools/perf.mjs --verify): draw one sprite both ways, in one go and in bands of `rows` rows, and return the number of differing pixels (must be 0) */
export function sliceTest(sb, draw, pad, flip, rows) {
  const a = R.render(sb, draw, null, pad, flip), j = R.renderJob(sb, draw, null, pad, flip); let k = 0; while (!R.renderStep(j, rows + (k++ % 3) * 7)); const b = R.renderResult(j);
  if (a.w !== b.w || a.h !== b.h || a.x !== b.x || a.y !== b.y || a.hasLight !== b.hasLight) return -1; let d = 0; for (let i = 0; i < a.buf.length; i++) if (a.buf[i] !== b.buf[i] || a.lb[i] !== b.lb[i]) d++; return d;
}
