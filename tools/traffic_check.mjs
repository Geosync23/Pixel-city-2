// Traffic health check: runs the REAL built game (dist/index.html or --html file) in headless Chromium and measures the street traffic.
// See docs/reports/traffic2.md for what the numbers mean and the before / after tables.
//
//   node tools/traffic_check.mjs [--plan base|quick|soak|survey|rides] [--html file] [--out name] [--hz 60] [--jobs 3] [--days N] [--sites a,b] [--shots] [--w 390 --h 844]
//
//   --plan     base   = survey + soak + rain + event + desktop (the full table; ~15-25 min)      quick = 4 sites, 1 game day each (a few minutes)
//              survey = every site, 1 game day, clear          soak = the 3 worst-known sites + the walking tour, 3 game days
//              rides  = a player cab ride and a bus ride (with Skip) driven through G.transit in real time
//   --html     the single-file build to measure (default dist/index.html; build first). --out names out/traffic/<name>.json + .md + out/shots/<name>_heat.png
//   --hz       simulated frames per second (default 60). --jobs pages run in parallel.
//
// HOW THE TIME IS RUN (honest fast-forward): the game's own frame() is driven, unmodified, with a synthetic clock: requestAnimationFrame is captured and the
// callback is called with timestamps 1000/hz ms apart, as fast as the machine allows. Everything frame() does runs (clock at game speed 1x = G.CLOCK game
// minutes per second, every system, the crowd, signals, housekeeping); only G.renderer.draw is replaced by a no-op while fast-forwarding (it is put back
// for screenshots). Nothing is skipped with G.advance: traffic lives in real seconds, so jumping the clock would not simulate it at all.
// Needs are frozen (dev mode) and any window that opens is closed, so the simulation never sits paused.
//
// WHAT IS MEASURED (per time-of-day band: am rush 7-9.5, midday 9.5-16, pm rush 16-19, evening 19-22, night 22-7):
//   veh / amb / moving     vehicles alive around the camera (all, ambient = not buses / stand cabs / service cabs, driving faster than 0.5): mean and peak
//   speed                  mean speed of the vehicles that are not parked (units per second)
//   stop20 / stop60        share of vehicle-time spent by vehicles that have been standing still for more than 20 s / 60 s (a red light is at most ~11 s)
//   stops>20 /h, clear     number of such stops per sim hour, and how long they lasted (p50 / p95 / max seconds) = time to clear
//   queues                 lines of >= 3 standing vehicles in one lane: mean number at a time, longest, and seconds a line stood with its head stuck > 20 s
//   box                    junction blockages: a vehicle standing still (> 3 s) with its centre inside a junction box: events per hour, seconds
//   gridlock               a cycle of vehicles each waiting on the next: episodes, longest, any still standing at the end (permanent)
//   ghost                  times the built-in unstick fired (a vehicle allowed to drive through others) per hour; despawn = vehicles removed while stuck
//   overlap / teleport     pairs of vehicles drawn inside each other (pair-seconds, on screen); position jumps of a living vehicle (on screen)
//   buses                  dwell time on screen, share of dwells that held up at least one vehicle behind, vehicle-seconds held; headway spread per route
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module'; import { fileURLToPath } from 'node:url';
import { encodePNG } from './png.mjs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = createRequire(ROOT + '/')('playwright');
const a = process.argv.slice(2), o = { plan: 'quick', html: path.join(ROOT, 'dist/index.html'), out: '', hz: 60, jobs: 3, days: 0, sites: '', shots: false, w: 390, h: 844 };
for (let i = 0; i < a.length; i++) { const k = a[i].slice(2); if (k === 'shots') o.shots = true; else o[k] = ['plan', 'html', 'out', 'sites'].includes(k) ? a[++i] : +a[++i]; }
const NAME = o.out || 'traffic_' + o.plan, OUT = path.join(ROOT, 'out/traffic'), SHOTS = path.join(ROOT, 'out/shots'); fs.mkdirSync(OUT, { recursive: true }); fs.mkdirSync(SHOTS, { recursive: true });
const HTML = fs.readFileSync(path.resolve(o.html));
const srv = http.createServer((q, r) => { r.writeHead(200, { 'content-type': 'text/html' }); r.end(HTML); }); await new Promise(r => srv.listen(0, r)); const URLB = `http://localhost:${srv.address().port}/`;

/* ---------- in the page ---------- */
const INIT = seed => { let s = seed | 0 || 0x2545f491; Math.random = () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; }; };
const HARNESS = () => {
  const TR = G.traffic, g = TR.graph, world = G.world, BANDS = ['am_rush', 'midday', 'pm_rush', 'evening', 'night'];
  const bandOf = h => h >= 7 && h < 9.5 ? 0 : h >= 9.5 && h < 16 ? 1 : h >= 16 && h < 19 ? 2 : h >= 19 && h < 22 ? 3 : 4;
  const mk = () => ({ t: 0, vehS: 0, ambS: 0, movS: 0, vehMax: 0, ambMax: 0, tgtS: 0, vt: 0, spS: 0, s20: 0, s60: 0, n20: 0, n60: 0, clear: [], maxStop: 0, qN: 0, qS: 0, qMax: 0, qLen: 0, qStuck: 0, boxN: 0, boxS: 0, glN: 0, glS: 0, glMax: 0,
    ghost: 0, despawn: 0, ovS: 0, ovN: 0, ovVisS: 0, tele: 0, teleVis: 0, cause: {}, busDw: [], busHeld: 0, busHeldS: 0, busDwN: 0 });
  const M = BANDS.map(mk), heat = new Float32Array(192 * 192), nodeBox = {}, ex = { tele: [], ov: [], gl: [], long: [] };
  const recs = new Map(), ovPairs = new Set(), busSt = new Map(), hw = {}; let cbs = [], now = performance.now(), sim = 0, frames = 0, paused = 0, glOn = 0, glStart = 0, qT = 0, oT = 0, vid = 0;
  const raf0 = window.requestAnimationFrame; window.requestAnimationFrame = cb => { cbs.push(cb); return 0; };
  const draw0 = G.renderer.draw.bind(G.renderer); let fast = true; G.renderer.draw = (...x) => { if (!fast) return draw0(...x); };
  try { G.state.tips && (G.state.tips.off = 1); } catch (e) { } try { G.dev.set(true); G.state.dev.needs = true; G.state.dev.money = true; } catch (e) { }
  const closeUi = () => { for (let i = 0; i < 6 && G.modal > 0; i++) { const s = document.querySelector('.say'); if (s) s.click(); const b = [...document.querySelectorAll('button')].find(b => /^(Got it|OK|Close|Later|Not now)$/.test(b.textContent.trim())); if (b) b.click(); const x = document.querySelector('.modal .x'); if (x) x.click(); if (!s && !b && !x) break; } };
  const halfAlong = (o, axis) => o.e.axis === axis ? o.len / 2 : o.wid / 2;
  /* who is `v` waiting on? -> a vehicle, or a string reason */
  function blocker(v, V) {
    const e = v.e, ax = e.axis === 'x', d = e.d, hl = v.len / 2; let best = null, ba = 1e9;
    for (let i = 0; i < V.length; i++) { const o = V[i]; if (o === v) continue; const rx = o.x - v.x, ry = o.y - v.y, al = (ax ? rx : ry) * d, la = Math.abs(ax ? ry : rx); if (al <= .01 || la > 1.15) continue; const gap = al - hl - halfAlong(o, e.axis); if (gap < v.gap + 1.2 && gap < ba) { ba = gap; best = o; } }
    if (best) return best;
    const n = e.to; if (!n.dead && v.inNode !== n) { const line = (e.s1 - d * ((ax ? n.hx : n.hy) + 1.4) - v.s) * d - hl; if (line < 3.5) { const sg = !n.signal ? 2 : ax ? n.gx : n.gy; if (sg !== 2) return 'signal'; if (v.why > 0 && v.why < 5) return ['', 'junction held by crossing traffic', 'giving way to a claim', 'no room on the exit', 'giving way'][v.why];   /* the new build says why it is held (v.why) */ for (let i = 0; i < V.length; i++) if (V[i] !== v && V[i].inNode === n) return V[i]; if (n.occ > 0) return 'junction'; return 'junction?'; } }
    const E = G.scene.ents; for (let i = 0; i < E.length; i++) { const p = E[i]; if (p.isVehicle || !p.spec || p.hidden) continue; const rx = p.x - v.x, ry = p.y - v.y, al = (ax ? rx : ry) * d; if (al > 0 && al < hl + 6.5 && Math.abs(ax ? ry : rx) < 1) return p.isPlayer ? 'player' : 'ped'; }
    return 'other';
  }
  function rootCause(v, V) { let c = v; for (let k = 0; k < 40; k++) { if (c.parked) return 'parked'; if (c.halt) return c.bus ? 'bus_dwell' : 'halted'; const b = blocker(c, V); if (typeof b === 'string') return b; if (b === v) return 'cycle'; c = b; } return 'cycle'; }
  function hasCycle(V) {
    const st = V.filter(v => !v.parked && !v.halt && v._m && v._m.st > 5), nx = new Map(); for (const v of st) { const b = blocker(v, V); if (typeof b !== 'string' && b._m && b._m.st > 5 && !b.parked && !b.halt) nx.set(v, b); }
    for (const v of st) { let x = v; const seen = new Set(); while (x && !seen.has(x)) { seen.add(x); x = nx.get(x); } if (x) { let n = 1, y = nx.get(x); while (y !== x && n < 60) { n++; y = nx.get(y); } return { n, x: x.x, y: x.y }; } } return null;
  }
  function sample(dt) {
    const V = TR.vehicles, m = M[bandOf(G.now().hf)], nV = V.length; let amb = 0, mov = 0; m.t += dt; sim += dt;
    for (let i = 0; i < nV; i++) {
      const v = V[i]; let r = v._m; if (!v.keep) amb++;
      if (!r || v.age < r.age || (r.age === 0 && v.age === 0 && Math.abs(v.x - r.x) + Math.abs(v.y - r.y) > 1)) { r = v._m = { id: ++vid, st: 0, jb: 0, age: v.age, x: v.x, y: v.y, gho: 0, stuck: 0, seen: 0 }; recs.set(r.id, v); }
      else if (v.age > 0 && r.age > 0) { const j = Math.abs(v.x - r.x) + Math.abs(v.y - r.y); if (j > .7 + v.v * dt * 2.5) { const vis = TR.onScreen(v.x, v.y, 0) || TR.onScreen(r.x, r.y, 0); m.tele++; if (vis) m.teleVis++; if (ex.tele.length < 40) ex.tele.push([Math.round(sim), v.kind, +r.x.toFixed(1), +r.y.toFixed(1), +v.x.toFixed(1), +v.y.toFixed(1), vis ? 'visible' : 'offscreen', v.role || '']); } }
      r.seen = frames; r.age = v.age; r.x = v.x; r.y = v.y; r.stuck = v.stuck; r.kind = v.kind;
      if (v.gho > 0 && r.gho <= 0) m.ghost++; r.gho = v.gho;
      if (v.parked) continue; if (v.v > .5) mov++;
      const dwell = v.halt; if (dwell) { r.st = 0; r.jb = 0; continue; }
      m.vt += dt; m.spS += v.v * dt;
      if (v.v < .3) {
        const p = r.st; r.st += dt; if (r.st > m.maxStop) m.maxStop = r.st;
        if (r.st > 20) { m.s20 += dt; const cx = v.x >> 1, cy = v.y >> 1; if (cx >= 0 && cy >= 0 && cx < 192 && cy < 192) heat[cy * 192 + cx] += dt; if (p <= 20) { m.n20++; const c = rootCause(v, V); m.cause[c] = (m.cause[c] || 0) + 1; r.cause = c; } }
        if (r.st > 60) { m.s60 += dt; if (p <= 60) { m.n60++; if (ex.long.length < 40) ex.long.push([Math.round(sim), v.kind, +v.x.toFixed(1), +v.y.toFixed(1), r.cause || '', G.now().clock]); } }
        const e = v.e; let nd = null; for (const n of [e.to, e.from, v.inNode]) if (n && !n.dead && Math.abs(v.x - n.x) <= n.hx && Math.abs(v.y - n.y) <= n.hy) nd = n;
        if (nd) { const q = r.jb; r.jb += dt; if (r.jb > 3) { m.boxS += dt; nodeBox[nd.i] = (nodeBox[nd.i] || 0) + dt; if (q <= 3) m.boxN++; } } else r.jb = 0;
      } else { if (r.st > 20) m.clear.push(+r.st.toFixed(1)); r.st = 0; r.jb = 0; }
    }
    for (const [id, v] of recs) { const r = v._m; if (!r || r.id !== id) { recs.delete(id); continue; } if (r.seen !== frames) { if (r.stuck > 11.5) m.despawn++; if (r.st > 20) m.clear.push(+r.st.toFixed(1)); recs.delete(id); v._m = null; } }
    m.vehS += nV * dt; m.ambS += amb * dt; m.movS += mov * dt; m.tgtS += TR.target * dt; if (nV > m.vehMax) m.vehMax = nV; if (amb > m.ambMax) m.ambMax = amb;
    /* overlaps, every 0.1 s */
    if ((oT -= dt) <= 0) { oT = .1; const cur = new Set();
      for (let i = 0; i < nV; i++) { const p = V[i], pax = p.e.axis === 'x', phx = (pax ? p.len : p.wid) / 2 - .22, phy = (pax ? p.wid : p.len) / 2 - .22;
        for (let j = i + 1; j < nV; j++) { const q = V[j]; if (p.parked && q.parked) continue; const dx = Math.abs(p.x - q.x), dy = Math.abs(p.y - q.y); if (dx > 8 || dy > 8) continue; const qax = q.e.axis === 'x', qhx = (qax ? q.len : q.wid) / 2 - .22, qhy = (qax ? q.wid : q.len) / 2 - .22;
          if (dx < phx + qhx && dy < phy + qhy) { const k = p._m.id * 100000 + q._m.id, vis = TR.onScreen(p.x, p.y, 0); cur.add(k); m.ovS += .1; if (vis) m.ovVisS += .1; if (!ovPairs.has(k)) { m.ovN++; if (ex.ov.length < 40) ex.ov.push([Math.round(sim), p.kind, q.kind, +p.x.toFixed(1), +p.y.toFixed(1), vis ? 'visible' : 'offscreen', (p.gho > 0 || q.gho > 0) ? 'ghost' : (p.ghost || q.ghost) ? 'ride' : (p.cornerOn || q.cornerOn) ? 'corner' : '']); } } } }
      ovPairs.clear(); for (const k of cur) ovPairs.add(k); }
    /* queues + gridlock, every 0.5 s */
    if ((qT -= dt) <= 0) { qT = .5; const by = new Map();
      for (let i = 0; i < nV; i++) { const v = V[i]; if (v.parked || v.v >= .3) continue; const k = v.e.id * 4 + v.off; let l = by.get(k); if (!l) by.set(k, l = []); l.push(v); }
      let nq = 0; for (const l of by.values()) { if (l.length < 3) continue; const d = l[0].e.d; l.sort((p, q) => (q.s - p.s) * d); let run = 1, head = l[0];
        const close = () => { if (run >= 3) { nq++; m.qLen += run; if (run > m.qMax) m.qMax = run; if (head._m && head._m.st > 20) m.qStuck += .5; } };
        for (let i = 1; i < l.length; i++) { const gap = (l[i - 1].s - l[i].s) * d - l[i - 1].len / 2 - l[i].len / 2; if (gap < 3) run++; else { close(); run = 1; head = l[i]; } } close(); }
      m.qN += nq; m.qS++;
      const cy = hasCycle(V); if (cy) { if (!glOn) { glOn = 1; glStart = sim; m.glN++; if (ex.gl.length < 40) ex.gl.push([Math.round(sim), cy.n, +cy.x.toFixed(1), +cy.y.toFixed(1), G.now().clock]); } m.glS += .5; if (sim - glStart > m.glMax) m.glMax = sim - glStart; } else glOn = 0; }
    /* buses */
    const B = TR.buses, tg = G.state.t;
    for (let i = 0; i < B.length; i++) { const b = B[i]; let s = busSt.get(b); if (!s) busSt.set(b, s = { at: b.atStop, t0: 0, real: false, held: 0, heldMax: 0 });
      if (b.atStop !== s.at) {
        if (b.atStop) { const k = b.route + '|' + b.atStop, h = hw[k] || (hw[k] = { last: -1, gaps: [] }); if (h.last >= 0) h.gaps.push(+(tg - h.last).toFixed(2)); h.last = tg; s.t0 = sim; s.real = !!b.veh; s.held = 0; s.heldMax = 0; }
        else if (s.real && b.veh) { m.busDwN++; m.busDw.push(+(sim - s.t0).toFixed(1)); if (s.heldMax > 0 && s.held > 1) { m.busHeld++; m.busHeldS += s.held; } }
        s.at = b.atStop; }
      if (b.atStop && b.veh && s.real) { const v = b.veh, ax = v.e.axis === 'x', d = v.e.d; let n = 0; for (let j = 0; j < nV; j++) { const q = V[j]; if (q === v || q.parked || q.v > .5) continue; const al = ((ax ? q.x - v.x : q.y - v.y)) * d, la = Math.abs(ax ? q.y - v.y : q.x - v.x); if (al < -1 && al > -16 && la < 1.15 && q._m && q._m.st > .5) n++; } s.held += n * dt; if (n > s.heldMax) s.heldMax = n; } else if (!b.veh) s.real = false;
    }
  }
  const H = window.__TC = {
    /** run `secs` simulated seconds at `hz`; opts.walk = [[x,y]...] moves the camera target along the points at 2.4 u/s; opts.stopJam = n stops early when n visible vehicles stand > 20 s */
    async run(secs, hz, opts = {}) {
      const step = 1000 / hz, N = Math.round(secs * hz), t0 = performance.now(); fast = true;
      for (let i = 0; i < N; i++) {
        if (G.modal > 0) { paused++; closeUi(); if (G.modal > 0 && paused % 600 === 0) { G.modal = 0; } }
        if (H.wx && frames % 600 === 0) { try { if (G.weather.current().kind !== H.wx) G.weather.setWeather(H.wx, 0); } catch (e) { } }
        if (H.walk) { const w = H.walk, c = G.camTarget, q = w.pts[w.i % w.pts.length], dx = q[0] - c.x, dy = q[1] - c.y, dd = Math.hypot(dx, dy), mv = 2.4 / hz; if (dd <= mv) { c.x = q[0]; c.y = q[1]; w.i++; } else { c.x += dx / dd * mv; c.y += dy / dd * mv; } c.z = world.heightAt(c.x, c.y); }
        const was = G.modal > 0; now += step; const L = cbs; cbs = []; for (const cb of L) { try { cb(now); } catch (e) { H.errs.push(String(e && e.stack || e).slice(0, 300)); } } frames++;
        if (!was && G.scene && G.scene.id === 'city') sample(1 / hz);
        if (opts.stopJam && frames % 30 === 0) { let n = 0; for (const v of TR.vehicles) if (v._m && v._m.st > 20 && TR.onScreen(v.x, v.y, -10)) n++; if (n >= opts.stopJam) break; }
        if (i % 3000 === 2999) await new Promise(r => setTimeout(r, 0));
      }
      return { sim: Math.round(sim), ms: Math.round(performance.now() - t0), clock: G.now().clock, day: G.now().day, veh: TR.count() };
    },
    /** draw real frames (for a screenshot) */
    async render(n = 3) { fast = false; for (let i = 0; i < n; i++) { now += 16.7; const L = cbs; cbs = []; for (const cb of L) cb(now); await new Promise(r => setTimeout(r, 30)); } fast = true; },
    focus(x, y) { G.camTarget = { x, y, z: world.heightAt(x, y) }; if (G.snapCam) G.snapCam(); },
    result() {
      const hs = []; for (let i = 0; i < heat.length; i++) if (heat[i] > 0) hs.push([i, +heat[i].toFixed(1)]);
      const hws = {}; for (const k in hw) hws[k] = hw[k].gaps;
      return { stats: TR.stats ? Object.assign({}, TR.stats) : null, bands: BANDS.map((b, i) => Object.assign({ band: b }, M[i])), heat: hs, nodeBox, ex, hw: hws, sim, frames, paused, errs: H.errs, district: world.districtAt((G.camTarget || G.player).x, (G.camTarget || G.player).y), W: G.W, Hh: G.H, simR: TR.simR };
    },
    stuckNow() { return TR.vehicles.filter(v => v._m && v._m.st > 20).map(v => [v.kind, +v.x.toFixed(1), +v.y.toFixed(1), Math.round(v._m.st), v._m.cause || '']); },
    errs: [], wx: null, walk: null,
  };
};

/* ---------- node side ---------- */
const br = await chromium.launch();
async function open(url, seed) {
  const ctx = await br.newContext({ viewport: { width: o.w, height: o.h }, deviceScaleFactor: 1 }), pg = await ctx.newPage(), errs = [];
  pg.on('pageerror', e => errs.push(e.message.slice(0, 300))); pg.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 200)); });
  await pg.addInitScript(INIT, seed); await pg.goto(URLB + url);
  await pg.waitForFunction(() => !document.getElementById('load') && window.G && window.G.scene && window.G.traffic, null, { timeout: 180000 }); await pg.waitForTimeout(1200);
  return { ctx, pg, errs };
}
/* sites: the junctions of the road graph, thinned so that neighbouring sites are >= 34 apart (the traffic ring around the camera is about +-26) */
async function listSites() {
  const { ctx, pg } = await open('?scene=city&x=206&y=232&t=8', 1);
  const r = await pg.evaluate(() => { const g = G.traffic.graph, w = G.world; return { nodes: g.nodes.filter(n => !n.dead).map(n => ({ i: n.i, x: n.x, y: n.y, hx: n.hx, hy: n.hy, sig: n.signal, deg: n.out.length, d: w.districtAt(n.x, n.y), w: n.out.reduce((s, e) => s + e.w, 0) })),
    roads: w.roads.map(r => ({ axis: r.axis, c: r.c, a: r.a, b: r.b, half: r.half })), stops: w.pois.filter(p => p.type === 'busstop').map(p => ({ id: p.id, x: p.x, y: p.y })), size: [w.w, w.h] }; });
  await ctx.close(); const picked = [];
  for (const n of r.nodes.slice().sort((p, q) => (q.w + (q.sig ? 3 : 0)) - (p.w + (p.sig ? 3 : 0)) || p.i - q.i)) if (!picked.some(p => Math.max(Math.abs(p.x - n.x), Math.abs(p.y - n.y)) < 34)) picked.push(n);
  r.sites = picked.map(n => ({ id: n.d + '_' + n.x + '_' + n.y, x: n.x, y: n.y, hx: n.hx, hy: n.hy, d: n.d })); return r;
}
const MAP = await listSites(), SITE = id => MAP.sites.find(s => s.id === id) || (() => { const m = /(\d+(?:\.\d+)?)[,_](\d+(?:\.\d+)?)$/.exec(id), x = +m[1], y = +m[2], n = MAP.nodes.find(n => n.x === x && n.y === y); return { id: (n ? n.d : 'at') + '_' + x + '_' + y, x, y, hx: n ? n.hx : 2, hy: n ? n.hy : 2, d: n ? n.d : '' }; })();
const DAY = 1440 / .85;   // real (simulated) seconds per game day at 1x
/* one run: { id, site | walk, t (start hour), secs, wx, event: [id, hour], seed, view: [w, h] } */
async function runOne(R) {
  const s = R.site, px = s.x + s.hx + 1.6, py = s.y + s.hy + 1.6, t0 = Date.now();
  const { ctx, pg, errs } = await open(`?scene=city&x=${px}&y=${py}&t=${R.t}`, R.seed || 7);
  if (R.view) await pg.setViewportSize({ width: R.view[0], height: R.view[1] });
  await pg.evaluate(HARNESS);
  await pg.evaluate(([x, y, wx, ev, walk]) => { const H = window.__TC; H.focus(x, y); if (wx) { H.wx = wx; G.weather.setWeather(wx, 0); } if (ev) G.cityEvents.debug.start(ev[0], ev[1]); if (walk) H.walk = { pts: walk, i: 0 }; }, [s.x, s.y, R.wx || null, R.event || null, R.walk || null]);
  let left = R.secs, shots = 0; const prog = [];
  while (left > 0) {
    const chunk = Math.min(left, R.shot ? 240 : 900), r = await pg.evaluate(([c, hz, sj]) => window.__TC.run(c, hz, sj ? { stopJam: sj } : {}), [chunk, o.hz, R.shot && shots < R.shot ? 3 : 0]); left -= chunk; prog.push(r.clock + ':' + r.veh);
    if (R.shot && shots < R.shot) { const st = await pg.evaluate(() => window.__TC.stuckNow()); if (st.length >= 3) { await pg.evaluate(() => window.__TC.render(4)); await pg.screenshot({ path: path.join(SHOTS, `${NAME}_${R.id}_${++shots}.png`) }); console.log('   shot', `${NAME}_${R.id}_${shots}.png`, 'at', r.clock, JSON.stringify(st)); } }
  }
  if (R.endShot) { await pg.evaluate(() => window.__TC.render(4)); await pg.screenshot({ path: path.join(SHOTS, `${NAME}_${R.id}_end.png`) }); }
  const res = await pg.evaluate(() => window.__TC.result()); res.id = R.id; res.run = { site: s.id, x: s.x, y: s.y, t: R.t, secs: R.secs, wx: R.wx || 'clear', event: R.event || null, walk: !!R.walk, view: R.view || [o.w, o.h] }; res.pageErrs = errs; res.wall = Math.round((Date.now() - t0) / 1000);
  await ctx.close(); console.log(`  ${R.id}: ${Math.round(res.sim)} sim s in ${res.wall} s, errs ${errs.length + res.errs.length}, paused frames ${res.paused}`); return res;
}

/* ---------- plans ---------- */
const WORST = (o.sites ? o.sites.split(',') : ['downtown_206_232', 'downtown_266_200', 'downtown_234_296']).map(SITE);
const _T = [[206, 232], [206, 200], [234, 200], [266, 200], [266, 232], [266, 264], [266, 296], [234, 296], [206, 296], [178, 296], [178, 264], [178, 232], [206, 232], [234, 232], [234, 170], [206, 170], [206, 138], [178, 138], [178, 200], [112, 200], [112, 264], [82, 264], [82, 296], [178, 296], [206, 296], [206, 232]];
const runs = []; const days = o.days || 0;
const survey = (list, d, tag = '') => { for (const s of list) runs.push({ id: 'sv_' + s.id + tag, kind: 'survey', site: s, t: 5, secs: d * DAY, seed: 11 + runs.length, shot: o.shots ? 2 : 0 }); };
if (o.plan === 'quick') survey(WORST.concat(MAP.sites.filter(s => !WORST.includes(s)).slice(0, 1)), days || 1);
if (o.plan === 'survey' || o.plan === 'base') survey(o.sites && o.plan === 'survey' ? WORST : MAP.sites, days || 1);
if (o.plan === 'soak' || o.plan === 'base') {
  for (const s of WORST) runs.push({ id: 'soak_' + s.id, kind: 'soak', site: s, t: 5, secs: (days || 3) * DAY, seed: 101 + runs.length });
  runs.push({ id: 'soak_tour', kind: 'soak', site: SITE('at_206_232'), walk: _T, t: 5, secs: (days || 3) * DAY, seed: 131 });
}
if (o.plan === 'base') {
  for (const s of WORST) runs.push({ id: 'rain_' + s.id, kind: 'rain', site: s, t: 5, secs: DAY, wx: 'rain', seed: 201 + runs.length });
  runs.push({ id: 'event_winter', kind: 'event', site: SITE('at_220_232'), t: 15, secs: 8 * 60 / .85, event: ['winter_parade', 15], seed: 301 });   // Market St closed 206-234, 15:30-21:00 (parade 17:00)
  runs.push({ id: 'event_blossom', kind: 'event', site: SITE('at_178_138'), t: 10.5, secs: 7 * 60 / .85, event: ['blossom_parade', 10.5], seed: 302 });   // Riverside Dr + Airport Pkwy closed 11-16
  for (const s of WORST) runs.push({ id: 'desk_' + s.id, kind: 'desktop', site: s, t: 5, secs: DAY, view: [1280, 800], seed: 401 + runs.length });
}
/* ---------- plan rides: the player's cab and bus rides, in REAL time (no fast-forward: the page runs as a player's would) ---------- */
if (o.plan === 'rides') {
  const out = []; const say = (k, v) => { out.push(`${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`); console.log('  ' + out[out.length - 1]); };
  const { ctx, pg, errs } = await open('?scene=city&x=209.6&y=247&t=8.2', 5);   // on the kerb by the stop "1st St & 3rd Ave" (bus:18, route 3), morning rush
  await pg.evaluate(() => { try { G.dev.set(true); G.state.dev.needs = true; G.state.dev.money = true; } catch (e) { } window.sleep = ms => new Promise(r => setTimeout(r, ms)); window.snap = () => ({ x: +G.player.x.toFixed(1), y: +G.player.y.toFixed(1), clock: G.now().clock, veh: G.traffic.count(), stats: G.traffic.stats ? Object.assign({}, G.traffic.stats) : null });
    window.watch = () => { const w = window.W = { maxStuck: 0, t0: performance.now(), stuckS: 0 }; w.iv = setInterval(() => { const r = G.transit.ride; if (r && r.vehicle) { if (r.vehicle.stuck > w.maxStuck) w.maxStuck = r.vehicle.stuck; if (r.vehicle.v < .3) w.stuckS += .1; } }, 100); return w; };
    window.unwatch = () => { const w = window.W; clearInterval(w.iv); return { seconds: +((performance.now() - w.t0) / 1000).toFixed(1), longestStandstill: +w.maxStuck.toFixed(1), standingSeconds: +w.stuckS.toFixed(1) }; }; });
  /* 1. bus: wait at the stop, ride one stop, get off */
  say('bus ride 1 (wait at bus:18, get off at the next stop)', await pg.evaluate(async () => { const s0 = snap(), t0 = performance.now(); const pr = G.transit.boardBus('bus3', 'bus:18'); let waited = null; for (let i = 0; i < 900 && !G.transit.ride; i++) await sleep(100); if (!G.transit.ride) return { failed: 'no bus boarded in 90 s', nb: G.transit.nextBuses('bus:18') }; waited = +((performance.now() - t0) / 1000).toFixed(1); watch();
    await sleep(1500); const b = [...document.querySelectorAll('.ride-btns button')].find(b => /Get off/.test(b.textContent)); if (b) b.click(); const ok = await Promise.race([pr, sleep(120000).then(() => 'timeout 120 s')]); return { waitedSeconds: waited, arrived: ok, ride: unwatch(), from: s0, to: snap() }; }));
  await pg.screenshot({ path: path.join(SHOTS, NAME + '_bus1.png') });
  /* 2. bus with Skip: board again where we got off, choose a stop 3 ahead, Skip ride */
  say('bus ride 2 (Choose stop + Skip ride)', await pg.evaluate(async () => { const s0 = snap(), p = G.player; let st = null, bd = 1e9; for (const q of G.transit.stops()) { const d = Math.hypot(q.x - p.x, q.y - p.y); if (d < bd) { bd = d; st = q; } }
    const rid = (st.routes || [])[0], loop = G.traffic.loops[rid], i = loop.stops.findIndex(s => s.id === st.id), dest = loop.stops[(i + 3) % loop.stops.length].id, t0 = performance.now(), pr = G.transit.boardBus(rid, st.id, dest); for (let k = 0; k < 900 && !G.transit.ride; k++) await sleep(100); if (!G.transit.ride) return { failed: 'no bus boarded in 90 s at ' + st.id };
    const waited = +((performance.now() - t0) / 1000).toFixed(1); await sleep(2500); const t1 = G.state.t; const b = [...document.querySelectorAll('.ride-btns button')].find(b => /Skip ride/.test(b.textContent)); if (!b) return { failed: 'no Skip button' }; b.click(); const ok = await Promise.race([pr, sleep(20000).then(() => 'timeout 20 s')]); await sleep(600);
    return { stop: st.id, dest, waitedSeconds: waited, arrived: ok, gameMinutesSkipped: +(G.state.t - t1).toFixed(1), from: s0, to: snap(), atDest: Math.hypot(G.player.x - G.world.pois.find(q => q.id === dest).x, G.player.y - G.world.pois.find(q => q.id === dest).y) < 9, modal: G.modal }; }));
  await pg.screenshot({ path: path.join(SHOTS, NAME + '_bus2.png') });
  /* 3. cab: call one to where we stand, ride it all the way across town at rush hour */
  const cab = async (dest, skipAfter) => pg.evaluate(async ([dest, skipAfter]) => { const s0 = snap(), t0 = performance.now(), g0 = G.state.t; let here = null; const off = G.on('taxi:here', () => { here = +((performance.now() - t0) / 1000).toFixed(1); });
    const pr = G.transit.callTaxi(dest, { silent: true }); for (let k = 0; k < 600 && !G.transit.ride; k++) { await sleep(100); const pd = G.transit.pending; if (pd && pd.state === 'waiting' && pd.cab && pd.cab._it && !G.transit.ride && Math.hypot(G.player.x - pd.cab.x, G.player.y - pd.cab.y) > 3.2) G.useInteractable(pd.cab._it); } off();
    if (!G.transit.ride) return { failed: 'cab not boarded in 60 s', pending: G.transit.pending && G.transit.pending.state, here }; const r = G.transit.ride, fare = r.fare, len = +r.total.toFixed(0); watch(); const g1 = G.state.t;
    if (skipAfter) { await sleep(skipAfter); const b = [...document.querySelectorAll('.ride-btns button')].find(b => /Skip ride/.test(b.textContent)); if (!b) return { failed: 'no Skip button' }; b.click(); }
    const ok = await Promise.race([pr, sleep(150000).then(() => 'timeout 150 s')]); await sleep(500); const pl = G.places.get(dest) || G.world.pois.find(q => q.id === dest || q.id === 'door:' + dest);
    return { dest, cabHereAfterSeconds: here, pickupGameMin: +(g1 - g0).toFixed(1), routeLength: len, fare, arrived: ok, ride: unwatch(), rideGameMin: +(G.state.t - g1).toFixed(1), metresFromDestination: pl ? Math.round(Math.hypot(G.player.x - pl.x, G.player.y - pl.y)) : null, from: s0, to: snap(), modal: G.modal, cutscene: !!G.cutscene }; }, [dest, skipAfter]);
  say('cab ride 1 (to the cinema, full ride)', await cab('cinema', 0)); await pg.screenshot({ path: path.join(SHOTS, NAME + '_cab1.png') });
  say('cab ride 2 (to the cafe, Skip ride after 4 s)', await cab('cafe', 4000)); await pg.screenshot({ path: path.join(SHOTS, NAME + '_cab2.png') });
  say('cab ride 3 (to the airport)', await cab('airport', 0));
  say('page errors', errs.length ? errs : 'none'); await ctx.close();
  fs.writeFileSync(path.join(OUT, NAME + '.md'), `# traffic_check ${NAME}: player rides, real time, build ${path.basename(o.html)}\n\n` + out.map(l => '- ' + l).join('\n') + '\n'); console.log(`-> out/traffic/${NAME}.md`); await br.close(); srv.close(); process.exit(errs.length ? 1 : 0);
}
/* ---------- plan shots: the three worst baseline spots at the morning rush, 390x844: the first moment (after 2.5 sim minutes, within 9) when two or more vehicles
   in view have stood for > 20 s, else the end of the 9 minutes. Speech bubbles and toasts are hidden for the picture (fast-forward piles them up). ---------- */
if (o.plan === 'shots') {
  const spots = (o.sites ? o.sites.split(',') : ['at_234_296', 'at_266_296', 'at_178_296']).map(SITE); let k = 0;
  for (const s of spots) { k++; const { ctx, pg, errs } = await open(`?scene=city&x=${s.x + s.hx + 1.6}&y=${s.y + s.hy + 1.6}&t=8`, 40 + k); await pg.evaluate(HARNESS); await pg.evaluate(([x, y]) => window.__TC.focus(x, y), [s.x, s.y]);
    await pg.evaluate(hz => window.__TC.run(150, hz), o.hz); const r = await pg.evaluate(hz => window.__TC.run(390, hz, { stopJam: 2 }), o.hz); const st = await pg.evaluate(() => window.__TC.stuckNow());
    await pg.addStyleTag({ content: '.bubble,.toast,.toasts,.say,.tip,.ph-banner,.banner{display:none!important}' }); await pg.evaluate(() => window.__TC.render(5)); await pg.screenshot({ path: path.join(SHOTS, `${NAME}_spot${k}.png`) });
    const res = await pg.evaluate(() => window.__TC.result()); console.log(`  spot ${k} ${s.id}: shot at ${r.clock} (${r.sim} sim s), ${r.veh} vehicles around, standing > 20 s in the whole area: ${JSON.stringify(st)}; overlap pair-s so far ${res.bands.reduce((a, b) => a + b.ovS, 0).toFixed(1)}; errors ${errs.length} -> out/shots/${NAME}_spot${k}.png`); await ctx.close(); }
  await br.close(); srv.close(); process.exit(0);
}
console.log(`traffic_check: plan ${o.plan}, ${runs.length} runs, ${MAP.sites.length} sites, build ${path.basename(o.html)}, ${o.hz} Hz`);
const results = []; { let k = 0; const worker = async () => { while (k < runs.length) { const R = runs[k++]; try { results.push(await runOne(R)); } catch (e) { console.log('  !! ' + R.id + ' failed: ' + e.message.slice(0, 200)); results.push({ id: R.id, failed: e.message, bands: [], heat: [], nodeBox: {}, ex: {}, hw: {}, run: { site: R.site.id }, pageErrs: [e.message], errs: [] }); } } }; await Promise.all(Array.from({ length: Math.min(o.jobs, runs.length) }, worker)); }
results.sort((p, q) => runs.findIndex(r => r.id === p.id) - runs.findIndex(r => r.id === q.id));

/* ---------- tables ---------- */
const pct = (a, b) => b > 0 ? (100 * a / b).toFixed(2) + '%' : '-', f1 = v => (+v).toFixed(1), f2 = v => (+v).toFixed(2), qt = (l, f) => l.length ? l.slice().sort((x, y) => x - y)[Math.min(l.length - 1, Math.floor(l.length * f))] : 0;
function merge(list) {
  const out = {}; for (const r of list) for (const b of r.bands) { const m = out[b.band] || (out[b.band] = { band: b.band, clear: [], busDw: [], cause: {}, vehMax: 0, ambMax: 0, maxStop: 0, qMax: 0, glMax: 0 });
    for (const k in b) { const v = b[k]; if (k === 'band') continue; if (Array.isArray(v)) m[k].push(...v); else if (k === 'cause') { for (const c in v) m.cause[c] = (m.cause[c] || 0) + v[c]; } else if (/Max$|^maxStop$/.test(k)) m[k] = Math.max(m[k] || 0, v); else m[k] = (m[k] || 0) + v; } }
  return ['am_rush', 'midday', 'pm_rush', 'evening', 'night'].map(k => out[k]).filter(Boolean);
}
const HEAD = '| band | sim h | veh mean / peak | ambient mean / peak | moving | target | speed | stop>20 s | stop>60 s | stops>20 /h | clear p50 / p95 / max s | queues mean / longest | stuck-queue s/h | box events/h, s/h | gridlock n, s, longest | ghost /h | stuck despawn /h | overlap pair-s/h (visible) | teleports (visible) |\n|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|';
const row = m => { const h = m.t / 3600 || 1e-9; return `| ${m.band} | ${f2(h)} | ${f1(m.vehS / m.t)} / ${m.vehMax} | ${f1(m.ambS / m.t)} / ${m.ambMax} | ${f1(m.movS / m.t)} | ${f1(m.tgtS / m.t)} | ${f2(m.spS / (m.vt || 1))} | ${pct(m.s20, m.vt)} | ${pct(m.s60, m.vt)} | ${f1(m.n20 / h)} | ${f1(qt(m.clear, .5))} / ${f1(qt(m.clear, .95))} / ${f1(m.maxStop)} | ${f2(m.qN / (m.qS || 1))} / ${m.qMax} | ${f1(m.qStuck / h)} | ${f1(m.boxN / h)}, ${f1(m.boxS / h)} | ${m.glN}, ${f1(m.glS)}, ${f1(m.glMax)} | ${f1(m.ghost / h)} | ${f1(m.despawn / h)} | ${f1(m.ovS / h)} (${f1(m.ovVisS / h)}) | ${m.tele} (${m.teleVis}) |`; };
const total = list => { const t = { band: 'ALL', clear: [], busDw: [], cause: {}, vehMax: 0, ambMax: 0, maxStop: 0, qMax: 0, glMax: 0 }; for (const b of list) for (const k in b) { const v = b[k]; if (k === 'band') continue; if (Array.isArray(v)) t[k].push(...v); else if (k === 'cause') { for (const c in v) t.cause[c] = (t.cause[c] || 0) + v[c]; } else if (/Max$|^maxStop$/.test(k)) t[k] = Math.max(t[k] || 0, v); else t[k] = (t[k] || 0) + v; } return t; };
let md = `# traffic_check ${NAME}: plan ${o.plan}, build ${path.basename(o.html)}, ${o.hz} Hz, viewport ${o.w}x${o.h}\n\n`;
const groups = {}; for (const r of results) { const k = runs.find(x => x.id === r.id).kind; (groups[k] = groups[k] || []).push(r); }
const summary = {};
for (const k in groups) { const mg = merge(groups[k]), tt = total(mg); summary[k] = { bands: mg, all: tt }; md += `## ${k} (${groups[k].length} runs: ${groups[k].map(r => r.id).join(', ')})\n\n${HEAD}\n${mg.map(row).join('\n')}\n${row(tt)}\n\n`;
  md += 'Causes of the stops > 20 s (what the head of the line was waiting on): ' + (Object.entries(tt.cause).sort((p, q) => q[1] - p[1]).map(([c, n]) => `${c} ${n}`).join(', ') || 'none') + '\n\n';
  md += `Buses on screen: ${tt.busDwN} dwells, mean ${f1(tt.busDw.reduce((s, v) => s + v, 0) / (tt.busDw.length || 1))} s (p95 ${f1(qt(tt.busDw, .95))}, max ${f1(qt(tt.busDw, 1))}); dwells that held up traffic behind: ${tt.busHeld} (${pct(tt.busHeld, tt.busDwN)}), ${f1(tt.busHeldS)} vehicle-seconds held\n\n`; }
/* per site / district density + jam ranking */
md += '## Per run\n\n| run | district | veh mean / peak | ambient mean | stop>20 s | stop>60 s | box s/h | ghost /h | gridlock n / longest s | max stop s | page errors |\n|---|---|---|---|---|---|---|---|---|---|---|\n';
for (const r of results) { if (r.failed) { md += `| ${r.id} | FAILED ${r.failed.slice(0, 80)} |\n`; continue; } const t = total(r.bands), h = t.t / 3600; md += `| ${r.id} | ${r.district} | ${f1(t.vehS / t.t)} / ${t.vehMax} | ${f1(t.ambS / t.t)} | ${pct(t.s20, t.vt)} | ${pct(t.s60, t.vt)} | ${f1(t.boxS / h)} | ${f1(t.ghost / h)} | ${t.glN} / ${f1(t.glMax)} | ${f1(t.maxStop)} | ${r.pageErrs.length + r.errs.length} |\n`; }
const dist = {}; for (const r of results) { if (r.failed || runs.find(x => x.id === r.id).kind !== 'survey') continue; const t = total(r.bands), d = dist[r.district] || (dist[r.district] = { t: 0, vehS: 0, ambS: 0, max: 0, s20: 0, vt: 0, n: 0 }); d.t += t.t; d.vehS += t.vehS; d.ambS += t.ambS; d.max = Math.max(d.max, t.vehMax); d.s20 += t.s20; d.vt += t.vt; d.n++; }
if (Object.keys(dist).length) { md += '\n## Density per district (survey runs)\n\n| district | sites | veh mean | ambient mean | peak | stop>20 s |\n|---|---|---|---|---|---|\n'; for (const k in dist) { const d = dist[k]; md += `| ${k} | ${d.n} | ${f1(d.vehS / d.t)} | ${f1(d.ambS / d.t)} | ${d.max} | ${pct(d.s20, d.vt)} |\n`; } }
/* bus headways: every arrival of a route at a stop, all runs (the buses run city-wide, on or off screen) */
const hwR = {}; for (const r of results) for (const k in r.hw || {}) { const rid = k.split('|')[0]; (hwR[rid] = hwR[rid] || []).push(...r.hw[k]); }
md += '\n## Bus headways (game minutes between buses of one route at a stop, all stops, all runs)\n\n| route | arrivals | mean | sd | cv | min | p5 | p95 | max | bunched (< 1/4 of the mean) |\n|---|---|---|---|---|---|---|---|---|---|\n';
for (const k in hwR) { const l = hwR[k], n = l.length, mean = l.reduce((s, v) => s + v, 0) / (n || 1), sd = Math.sqrt(l.reduce((s, v) => s + (v - mean) * (v - mean), 0) / (n || 1)); md += `| ${k} | ${n} | ${f1(mean)} | ${f1(sd)} | ${f2(sd / (mean || 1))} | ${f1(qt(l, 0))} | ${f1(qt(l, .05))} | ${f1(qt(l, .95))} | ${f1(qt(l, 1))} | ${pct(l.filter(v => v < mean / 4).length, n)} |\n`; summary['hw_' + k] = { n, mean, sd, cv: sd / (mean || 1) }; }
const exAll = { tele: [], ov: [], gl: [], long: [] }; for (const r of results) for (const k in exAll) for (const e of (r.ex && r.ex[k]) || []) if (exAll[k].length < 60) exAll[k].push([r.id, ...e]);
md += `\n## Examples\n\nStops > 60 s (run, sim s, kind, x, y, cause, clock): ${JSON.stringify(exAll.long.slice(0, 25))}\n\nGridlock cycles (run, sim s, vehicles in the cycle, x, y, clock): ${JSON.stringify(exAll.gl.slice(0, 25))}\n\nOverlaps (run, sim s, kinds, x, y, visible, note): ${JSON.stringify(exAll.ov.slice(0, 25))}\n\nTeleports (run, sim s, kind, from, to, visible, role): ${JSON.stringify(exAll.tele.slice(0, 25))}\n`;
{ const st = {}; let any = false; for (const r of results) if (r.stats) { any = true; for (const k in r.stats) st[k] = (st[k] || 0) + r.stats[k]; } const hrs = results.reduce((s, r) => s + (r.sim || 0), 0) / 3600;
  md += any ? `\n## The build's own counters (G.traffic.stats, all runs, ${f1(hrs)} sim h)\n\n${Object.entries(st).map(([k, v]) => `${k} ${f1(v)} (${f2(v / hrs)}/h)`).join(', ')}\n` : '\n(this build has no G.traffic.stats counters)\n'; summary.stats = any ? st : null; }
const nErr = results.reduce((s, r) => s + r.pageErrs.length + r.errs.length, 0); md += `\nPage errors over all runs: ${nErr}${nErr ? ' -> ' + JSON.stringify(results.flatMap(r => r.pageErrs.concat(r.errs)).slice(0, 8)) : ''}\n`;

/* ---------- heat map: stop>20 s seconds per 2x2 cell, all runs, on the road map ---------- */
{ const S = 3, Wp = MAP.size[0] * S, Hp = MAP.size[1] * S, px = new Uint8Array(Wp * Hp * 4), set = (x, y, r, g, b) => { if (x < 0 || y < 0 || x >= Wp || y >= Hp) return; const i = (y * Wp + x) * 4; px[i] = r; px[i + 1] = g; px[i + 2] = b; px[i + 3] = 255; }, rect = (x0, y0, x1, y1, r, g, b) => { for (let y = Math.round(y0 * S); y < Math.round(y1 * S); y++) for (let x = Math.round(x0 * S); x < Math.round(x1 * S); x++) set(x, y, r, g, b); };
  rect(0, 0, MAP.size[0], MAP.size[1], 24, 28, 34);
  for (const r of MAP.roads) { if (r.axis === 'x') rect(r.a, r.c - r.half, r.b, r.c + r.half, 70, 74, 84); else rect(r.c - r.half, r.a, r.c + r.half, r.b, 70, 74, 84); }
  for (const s of MAP.stops) rect(s.x - .7, s.y - .7, s.x + .7, s.y + .7, 60, 140, 220);
  const cell = new Float32Array(192 * 192), box = {}; for (const r of results) { for (const [i, v] of r.heat || []) cell[i] += v; for (const k in r.nodeBox || {}) box[k] = (box[k] || 0) + r.nodeBox[k]; }
  let mx = 0; for (const v of cell) if (v > mx) mx = v;
  for (let i = 0; i < cell.length; i++) { const v = cell[i]; if (v <= 0) continue; const k = Math.min(1, Math.log(1 + v) / Math.log(1 + Math.max(60, mx))), x = (i % 192) * 2, y = Math.floor(i / 192) * 2; rect(x, y, x + 2, y + 2, 255, Math.round(230 - 200 * k), Math.round(60 - 40 * k)); }
  for (const s of results) if (s.run && s.run.x !== undefined && !s.run.walk) { const x = Math.round(s.run.x * S), y = Math.round(s.run.y * S); for (let d = -3; d <= 3; d++) { set(x + d, y, 90, 255, 160); set(x, y + d, 90, 255, 160); } }
  fs.writeFileSync(path.join(SHOTS, NAME + '_heat.png'), encodePNG(Wp, Hp, px));
  const cells = []; for (let i = 0; i < cell.length; i++) if (cell[i] > 0) cells.push([(i % 192) * 2 + 1, Math.floor(i / 192) * 2 + 1, Math.round(cell[i])]); cells.sort((p, q) => q[2] - p[2]);
  md += `\n## Where the jams are\n\nHeat map: out/shots/${NAME}_heat.png (grey = roads, blue = bus stops, green cross = camera sites, yellow -> red = seconds of standing > 20 s, log scale; top-left is world 0,0).\n\nHottest cells (x, y, seconds standing > 20 s): ${JSON.stringify(cells.slice(0, 24))}\n\nJunction boxes blocked (node x,y: seconds): ${Object.entries(box).sort((p, q) => q[1] - p[1]).slice(0, 16).map(([i, v]) => { const n = MAP.nodes.find(n => n.i === +i); return (n ? n.x + ',' + n.y : i) + ': ' + Math.round(v); }).join('; ') || 'none'}\n`;
  summary.hot = cells.slice(0, 24); }
fs.writeFileSync(path.join(OUT, NAME + '.md'), md); fs.writeFileSync(path.join(OUT, NAME + '.json'), JSON.stringify({ name: NAME, opts: o, summary, results: results.map(r => Object.assign({}, r, { heat: undefined })) }));
console.log('\n' + md.split('\n## Per run')[0]); console.log(`-> out/traffic/${NAME}.md, out/traffic/${NAME}.json, out/shots/${NAME}_heat.png   page errors: ${nErr}`);
await br.close(); srv.close(); process.exit(nErr ? 1 : 0);
