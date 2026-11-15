// Sprite cache: raster results -> canvases. Browser only.
// Perf (docs/reports/performance.md): besides the on-demand path (cached(): bake now, in one go), sprites can be baked AHEAD of need by the
// bake queue below: prebake*() queues a sprite that is about to come on screen, bakeTick(ms) (called once a frame by the renderer) spends a few
// milliseconds on the queue, drawing big sprites in row bands (raster.renderJob). If a queued sprite is needed before it is finished,
// cached() finishes it on the spot, so what is on screen never depends on the queue: same pixels, the work is only moved off the frame
// in which the thing first appears.
import * as R from './raster.js';
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
/** raster.render() result -> sprite {c: colour canvas, l: light canvas|null, x, y, w, h} (x,y = offset from the anchor in px) */
export function toSprite(r) {
  if (!r) return null;
  const c = mk(r.w, r.h); c.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(r.buf.buffer), r.w, r.h), 0, 0);
  let l = null; if (r.hasLight) { l = mk(r.w, r.h); l.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(r.lb.buffer), r.w, r.h), 0, 0); }
  return { c, l, x: r.x, y: r.y, w: r.w, h: r.h };
}
const cache = new Map(); let total = 0; export const BUDGET = { px: 36e6 };
const STATS = { bakes: 0, bakeMs: 0, pre: 0, preMs: 0, slices: 0, rushed: 0 };   // on-demand bakes / pre-bakes finished by the queue / queued bakes that had to be finished on the spot
function store(key, s) { cache.set(key, s); if (s) total += s.w * s.h; if (total > BUDGET.px) for (const [k, v] of cache) { if (total <= BUDGET.px * .8 || k === key) break; cache.delete(k); if (v) total -= v.w * v.h; } }
/** LRU cache. key: string; make: () => sprite */
export function cached(key, make) {
  let s = cache.get(key);
  if (s !== undefined) { cache.delete(key); cache.set(key, s); return s; }
  const j = jobs.get(key);
  if (j) { STATS.rushed++; return finish(j, true); }   // queued and half-done: finish it now (still less work than starting over)
  const t0 = performance.now(); s = make(); STATS.bakes++; STATS.bakeMs += performance.now() - t0; store(key, s);
  return s;
}
/** drop everything (call on season change) */
export function clearSprites() { cache.clear(); total = 0; jobs.clear(); queue.length = 0; }
export const spriteStats = () => ({ count: cache.size, px: total, queued: jobs.size, ...STATS });
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
// creeps back up while they are on time). small: sprites up to this many pixels are baked in one pass (banding them would only repeat the art's set-up work).
export const BAKE = { on: true, msMax: 5, msMin: 1.2, small: 9000, maxQueue: 160 };
const jobs = new Map(), queue = [];   // key -> job; queue = the same jobs, most urgent first (the renderer re-sorts by distance to the screen)
/**
 * Queue a sprite for baking ahead of need. start() -> a raster.renderJob (called when the job first runs). pri: smaller = sooner (px from the screen edge).
 * warn: label for the console warning if the art throws (the sprite is then null, as in objSprite).
 */
export function prebake(key, start, pri = 0, warn = null) {
  if (!BAKE.on || cache.has(key)) return false; const j = jobs.get(key); if (j) { if (pri < j.pri) j.pri = pri; return false; }
  if (queue.length >= BAKE.maxQueue) return false;
  const job = { key, start, pri, warn, rj: null, rows: 0, ms: 0, done: null }; jobs.set(key, job); queue.push(job); return true;
}
/** queue a placed world object (same sprite as objSprite) */
export function prebakeObj(ob, pri) { return prebake(objKey(ob), () => R.renderJob(R.screenBox(ob.vbl), () => ob.a.draw(ob.p), null, 3, ob.flip), pri, ob.id); }
/** queue a pixSprite (characters) */
export function prebakePix(key, sb, draw, pri) { return prebake(key, () => R.renderJob(sb, draw, null, 1), pri); }
/** queue any job that is not a sprite of this cache (ground chunks): step(ms) -> true when finished; cancel() is called if the queue is cleared */
export function prebakeTask(key, step, pri = 0) { if (!BAKE.on || jobs.has(key) || queue.length >= BAKE.maxQueue) return false; const job = { key, pri, task: step }; jobs.set(key, job); queue.push(job); return true; }
export const isQueued = key => jobs.has(key);
export function dropBake(key) { const j = jobs.get(key); if (!j) return; jobs.delete(key); const i = queue.indexOf(j); if (i >= 0) queue.splice(i, 1); }
/** re-order the queue (the renderer calls this after it has refreshed the priorities) */
export function sortBakes() { queue.sort((a, b) => a.pri - b.pri); }
/** set a queued job's priority */
export function bakePri(key, pri) { const j = jobs.get(key); if (j) j.pri = pri; }
// one slice of a sprite job: about `ms` milliseconds of rows (the row count adapts to what the last band cost). Returns true when the job is finished.
function slice(job, ms) {
  let rj = job.rj; const t0 = performance.now();
  try {
    if (!rj) { rj = job.rj = job.start(); job.rows = rj.w * rj.h <= BAKE.small ? rj.h : Math.max(8, Math.ceil(6000 / rj.w)); }
    else job.rows = Math.max(4, Math.round(job.rows * Math.max(.5, Math.min(4, ms / Math.max(.05, job.last)))));
    const fin = R.renderStep(rj, ms === Infinity ? rj.h : job.rows); job.last = performance.now() - t0; job.ms += job.last; STATS.slices++;
    if (fin) { const u0 = performance.now(); job.done = toSprite(R.renderResult(rj)); job.ms += performance.now() - u0; }
    return fin;
  } catch (e) { if (job.warn) console.warn('art error in ' + job.warn + ': ' + e.message); job.done = null; job.ms += performance.now() - t0; return true; }
}
function finish(job, now) {
  if (now) { if (job.task) { while (!job.task(Infinity)); } else slice(job, Infinity); }
  jobs.delete(job.key); const i = queue.indexOf(job); if (i >= 0) queue.splice(i, 1);
  if (job.task) return undefined;
  STATS.pre++; STATS.preMs += job.ms; store(job.key, job.done); return job.done;
}
let allow = 3;   // the current per-frame allowance in ms (between BAKE.msMin and BAKE.msMax)
/**
 * Spend up to the frame's allowance on the queue. late: true if the last frame came late (the allowance then shrinks; it grows back while
 * frames are on time), so slow devices bake less per frame and keep their frame rate; whatever is not ready in time is finished on demand
 * exactly as before. Returns the milliseconds used.
 */
export function bakeTick(late) {
  if (!queue.length) return 0;
  allow = late ? Math.max(BAKE.msMin, allow * .7) : Math.min(BAKE.msMax, allow + .15);
  const t0 = performance.now(); let used = 0;
  while (queue.length && used < allow) {
    const job = queue[0], left = allow - used;
    if (job.task ? job.task(left) : slice(job, left)) finish(job, false);
    used = performance.now() - t0;
  }
  return used;
}
