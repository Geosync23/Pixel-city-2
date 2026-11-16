// Draw-order check (docs/reports/occlusion.md): runs the built game in headless Chromium, stages long vehicles and trains against trees, posts,
// people and each other, steps the game's own frame() with a synthetic 60 Hz clock, and looks at the ORDER the renderer drew things in.
//
//   node tools/occl_check.mjs [--html dist/index.html] [--out name] [--cases a,b,..|all|list] [--hour 12|22] [--w 1170 --h 900] [--zoom 3] [--query "?occl=old"] [--strips 1] [--watch seconds]
//
// What is checked, every frame, for every pair of drawn things of which at least one is a vehicle or a train car and whose painted boxes overlap on screen:
//   pops    the pair's order changed since the previous frame (one was in front, now the other is) although both were on screen and overlapping before and after:
//           that is what the eye sees as "the tree jumps in front of the bus". Each pop is listed with what, where, and a strip of frames around it.
//           Only counted when the two sprites really share pixels (4 or more); px = how many, added up.
//   wrong   the two ground footprints are cleanly apart (one is wholly nearer the camera along x or y, or wholly above) and the nearer one was NOT drawn later.
//   cycles  (builds with Renderer.sortCycles) groups of things that are each "behind" the next all the way round and include a vehicle or train: the sort must drop one link.
//   outside pixels of a long vehicle's picture that lie outside the outline the renderer compares it by (must be 0).
// A case also saves a strip of frames (every --every-th frame, cropped around the subject) to out/occl/<name>/<case>_<hour>.png for looking at.
// Cases: see CASES below (bus_x, bus_y, bus_corner, bus_stop, truck_trees, trains_central, trains_viaduct, train_over_road, watch_harbor, watch_plaza, watch_central).
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module'; import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = createRequire(ROOT + '/')('playwright');
const a = process.argv.slice(2), o = { html: path.join(ROOT, 'dist/index.html'), out: 'occl', cases: 'all', hour: 12, w: 1170, h: 900, zoom: 3, query: '', strips: 1, watch: 180, every: 0, jobs: 3 };
for (let i = 0; i < a.length; i++) { const k = a[i].slice(2); o[k] = ['html', 'out', 'cases', 'query'].includes(k) ? a[++i] : +a[++i]; }
const OUT = path.join(ROOT, 'out/occl', o.out); fs.mkdirSync(OUT, { recursive: true });
const HTML = fs.readFileSync(path.resolve(o.html));
const srv = http.createServer((q, r) => { r.writeHead(200, { 'content-type': 'text/html' }); r.end(HTML); }); await new Promise(r => srv.listen(0, r)); const URLB = `http://localhost:${srv.address().port}/`;

const INIT = () => { let s = 0x2545f491; Math.random = () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; }; };
/* ---------- in the page ---------- */
const HARNESS = () => {
  const U = 16, world = G.world, TR = G.traffic, g = TR.graph;
  let cbs = [], now = performance.now(), frames = 0;
  window.requestAnimationFrame = cb => { cbs.push(cb); return 0; };
  const draw0 = G.renderer.draw.bind(G.renderer); let drawOn = true; G.renderer.draw = (...x) => { if (drawOn) return draw0(...x); };
  try { G.state.tips && (G.state.tips.off = 1); } catch (e) { } try { G.dev.set(true); G.state.dev.needs = true; G.state.dev.money = true; } catch (e) { }
  const closeUi = () => { for (let i = 0; i < 6 && G.modal > 0; i++) { const s = document.querySelector('.say'); if (s) s.click(); const b = [...document.querySelectorAll('button')].find(b => /^(Got it|OK|Close|Later|Not now)$/.test(b.textContent.trim())); if (b) b.click(); const x = document.querySelector('.modal .x'); if (x) x.click(); if (!s && !b && !x) break; } };
  const tick = () => { now += 1000 / 60; const c = cbs; cbs = []; for (const f of c) f(now); frames++; if (G.modal > 0) closeUi(); };
  /* ---- order analysis ---- */
  const ids = new WeakMap(); let nid = 0; const idOf = o => { let i = ids.get(o); if (!i) ids.set(o, i = ++nid); return i; };
  const isLong = e => !!e && (e.isVehicle || e.isTrain);
  const nameOf = it => it.ob ? it.ob.id : it.e.isTrain ? 'train' + it.e.set.dir + '.' + it.e.set.train + '.' + it.e.k : it.e.isVehicle ? it.e.kind + '#' + it.e.uid : it.e.isPlayer ? 'player' : it.e.spec ? 'person' : 'ent';
  const prev = new Map(); let cur = new Map();
  const R = { frames: 0, pairs: 0, pops: [], wrong: [], popN: 0, popPx: 0, wrongN: 0, popKinds: {}, wrongKinds: {}, maxItems: 0, cycN: 0, cyc: [], outN: 0, out: [] };
  const RING = [], RN = 12; let saveQ = [];   // ring of frame copies (for strips around a pop)
  const strips = [];
  const kindKey = (p, q) => [p.replace(/[#\d.]+$/, '').replace(/^prop\.nature\.tree\..*/, 'tree'), q.replace(/[#\d.]+$/, '').replace(/^prop\.nature\.tree\..*/, 'tree')].join(' / ');
  function sepOrder(A, B) {   // -1: only B can cover A (A is behind for certain), 1: only A can cover B, 0: neither or both (seen from above-front, the one that covers is further along x, y AND z)
    const e = 1e-6, ab = A[3] > B[0] + e && A[4] > B[1] + e && A[5] > B[2] + e, ba = B[3] > A[0] + e && B[4] > A[1] + e && B[5] > A[2] + e;
    return ab === ba ? 0 : ab ? 1 : -1;
  }
  /* how many pixels do two drawn sprites really share? (only asked at a pop) */
  const PC = document.createElement('canvas'), PX = PC.getContext('2d', { willReadFrequently: true });
  function shared(A, B) {
    const ax = A.spr.x + A.ax, ay = A.spr.y + A.ay, bx = B.spr.x + B.ax, by = B.spr.y + B.ay, x0 = Math.max(ax, bx), y0 = Math.max(ay, by), x1 = Math.min(ax + A.spr.w, bx + B.spr.w), y1 = Math.min(ay + A.spr.h, by + B.spr.h), w = x1 - x0, h = y1 - y0; if (w <= 0 || h <= 0) return 0;
    PC.width = w; PC.height = h; PX.globalCompositeOperation = 'source-over'; PX.drawImage(A.spr.c, ax - x0, ay - y0); PX.globalCompositeOperation = 'destination-in'; PX.drawImage(B.spr.c, bx - x0, by - y0);
    const d = PX.getImageData(0, 0, w, h).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 128) n++; return n;
  }
  /* is a long entity's picture inside the outline the renderer uses for it? (once per sprite) -> number of its pixels outside */
  const outSeen = new WeakMap();
  function outside(it) {
    const h = it.h, sp = it.spr; if (!h || outSeen.has(sp)) return 0; outSeen.set(sp, 1); const c = document.createElement('canvas'); c.width = sp.w; c.height = sp.h; const x = c.getContext('2d'); x.drawImage(sp.c, 0, 0); const d = x.getImageData(0, 0, sp.w, sp.h).data, ox = sp.x + it.ax, oy = sp.y + it.ay; let n = 0;
    for (let y = 0; y < sp.h; y++) for (let xx = 0; xx < sp.w; xx++) { if (d[(y * sp.w + xx) * 4 + 3] < 128) continue; const X = ox + xx + .5, Y = oy + y + .5; if (X < h[0] || X > h[1] || Y + X / 2 < h[2] || Y + X / 2 > h[3] || Y - X / 2 < h[4] || Y - X / 2 > h[5]) n++; }
    return n;
  }
  function analyse() {
    const S = G.renderer._S, cam = G.cam, n = S.length; R.frames++; if (n > R.maxItems) R.maxItems = n; cur = new Map();
    if (G.renderer.resorts !== undefined) { if (R.rs0 === undefined) R.rs0 = G.renderer.resorts; R.resorts = G.renderer.resorts - R.rs0; }
    if (G.renderer.sortCycles) { const C = G.renderer.sortCycles(true); for (const g of C) { if (!g.some(it => isLong(it.e))) continue; R.cycN++; if (R.cyc.length < 30) R.cyc.push({ f: frames, n: g.length, items: g.slice(0, 8).map(nameOf), boxes: g.slice(0, 8).map(it => Array.from(it.B, v => +v.toFixed(2))) }); } }
    for (let i = 0; i < n; i++) if (S[i].h) { const o = outside(S[i]); if (o) { R.outN += o; if (R.out.length < 20) R.out.push(nameOf(S[i]) + ': ' + o + ' px outside its outline'); } }
    const bx = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) { const it = S[i], sp = it.spr, q = sp.bx, x = sp.x + it.ax - cam.x, y = sp.y + it.ay - cam.y; bx[i * 4] = q ? x + q[0] : x; bx[i * 4 + 1] = q ? y + q[1] : y; bx[i * 4 + 2] = q ? x + q[2] : x + sp.w; bx[i * 4 + 3] = q ? y + q[3] : y + sp.h; }
    for (let i = 0; i < n; i++) {
      const A = S[i]; if (!isLong(A.e)) continue; const a0 = bx[i * 4], a1 = bx[i * 4 + 1], a2 = bx[i * 4 + 2], a3 = bx[i * 4 + 3]; if (a2 < 0 || a3 < 0 || a0 > G.W || a1 > G.H) continue;
      for (let j = 0; j < n; j++) {
        if (j === i) continue; const B = S[j]; if (isLong(B.e) && j < i) continue;   // long-long pairs once
        if (B.ob && B.ob.size[2] > 12 && (B.ob.B[3] - B.ob.B[0]) * (B.ob.B[4] - B.ob.B[1]) > 30) continue;   // (buildings: not what this is about)
        const ox = Math.min(a2, bx[j * 4 + 2]) - Math.max(a0, bx[j * 4]), oy = Math.min(a3, bx[j * 4 + 3]) - Math.max(a1, bx[j * 4 + 1]); if (ox < 3 || oy < 3) continue;
        const ia = idOf(A.e), ib = idOf(B.e || B.ob), key = ia < ib ? ia * 1e6 + ib : ib * 1e6 + ia, front = (i > j) === (ia < ib) ? 1 : -1;   // 1: the lower id is drawn later (in front)
        R.pairs++; cur.set(key, front);
        const so = sepOrder(A.B, B.B); if (so && (so > 0) !== (i > j) && !(B.ob && B.ob._ov > .3) /* (a tree: by the side of the vehicle its trunk is on, see engine/render.js behindLong) */ && shared(A, B) >= 4) { R.wrongN++; const kk = kindKey(nameOf(A), nameOf(B)); R.wrongKinds[kk] = (R.wrongKinds[kk] || 0) + 1; if (R.wrong.length < 60) R.wrong.push({ f: frames, a: nameOf(A), b: nameOf(B), A: Array.from(A.B, v => +v.toFixed(2)), B: Array.from(B.B, v => +v.toFixed(2)), aDrawnLater: i > j }); }
        if (window.__softlog && G.renderer.sortWhy && B.ob && B.ob._ov > .3 && frames % 4 === 0 && (R.softlog || (R.softlog = [])).length < 40) { const first = i > j ? B : A, second = i > j ? A : B, w = G.renderer.sortWhy(first, second); if (/against/.test(w.link) && shared(A, B) > 20) R.softlog.push('f' + frames + ' ' + nameOf(first) + JSON.stringify(Array.from(first.B, v => +v.toFixed(1))) + ' drawn before ' + nameOf(second) + JSON.stringify(Array.from(second.B, v => +v.toFixed(1))) + ' ' + w.link + (w.path ? ' PATH ' + w.path.map(it => nameOf(it) + JSON.stringify(Array.from(it.B, v => +v.toFixed(1)))).join(' < ') : '')); }
        const pv = prev.get(key);
        if (pv !== undefined && pv !== front) { const px = shared(A, B); if (px < 4) continue; R.popN++; R.popPx += px; const kk = kindKey(nameOf(A), nameOf(B)); R.popKinds[kk] = (R.popKinds[kk] || 0) + 1;
          const rec = { f: frames, a: nameOf(A), b: nameOf(B), A: Array.from(A.B, v => +v.toFixed(2)), B: Array.from(B.B, v => +v.toFixed(2)), aNowDrawnLater: i > j, sep: so, px, hour: +G.now().hf.toFixed(2), box: [Math.max(a0, bx[j * 4]) | 0, Math.max(a1, bx[j * 4 + 1]) | 0, Math.min(a2, bx[j * 4 + 2]) | 0, Math.min(a3, bx[j * 4 + 3]) | 0] };
          if (G.renderer.sortWhy && R.pops.length < 60) { const first = i > j ? B : A, second = i > j ? A : B, w = G.renderer.sortWhy(first, second); rec.why = w.link + (w.path ? ': ' + w.path.map(it => nameOf(it) + JSON.stringify(Array.from(it.B, v => +v.toFixed(1)))).join(' < ') : ''); }
          if (R.pops.length < 200) R.pops.push(rec);
          if (window.__popStrips && strips.length + saveQ.length < window.__popStrips) { const cx = (rec.box[0] + rec.box[2]) / 2, cy = (rec.box[1] + rec.box[3]) / 2; saveQ.push({ rec, cx, cy, left: 4, fr: RING.slice(-4).map(r => r) }); } }
      }
    }
    prev.clear(); for (const [k, v] of cur) prev.set(k, v);
    /* frame ring */
    if (window.__popStrips) { let c = RING.length >= RN ? RING.shift() : document.createElement('canvas'); if (c.width !== G.W || c.height !== G.H) { c.width = G.W; c.height = G.H; } c.getContext('2d').drawImage(G.cv, 0, 0); c._f = frames; RING.push(c);
      for (const q of saveQ) { if (q.left === 4) { q.cv = document.createElement('canvas'); const CW = 150, CH = 120; q.cv.width = CW * 8; q.cv.height = CH; q.n = 0; q.CW = CW; q.CH = CH; const x = q.cv.getContext('2d'); for (const r of RING.slice(-5, -1)) { x.drawImage(r, q.cx - CW / 2, q.cy - CH / 2, CW, CH, q.n * CW, 0, CW, CH); q.n++; } }
        const x = q.cv.getContext('2d'); x.drawImage(G.cv, q.cx - q.CW / 2, q.cy - q.CH / 2, q.CW, q.CH, q.n * q.CW, 0, q.CW, q.CH); if (q.left === 4) { x.fillStyle = '#ff2a6d'; x.fillRect(q.n * q.CW, 0, q.CW, 2); } q.n++; q.left--; }
      for (let i = saveQ.length - 1; i >= 0; i--) if (saveQ[i].left <= 0 || saveQ[i].n >= 8) { const q = saveQ[i]; strips.push({ rec: q.rec, url: q.cv.toDataURL() }); saveQ.splice(i, 1); } }
  }
  /* ---- strips of a subject ---- */
  let cap = null;
  function capture() { if (!cap) return; if ((cap.i++ % cap.every) !== 0 || cap.n >= cap.max) return; const s = cap.subj(), wx = (s.x - s.y) * U - G.cam.x, wy = (s.x + s.y) * U / 2 - (s.z || 0) * U - G.cam.y, CW = cap.cw, CH = cap.ch, col = cap.n % cap.cols, row = (cap.n / cap.cols) | 0; const x = cap.cv.getContext('2d'); x.drawImage(G.cv, Math.round(wx - CW / 2), Math.round(wy - CH * .6), CW, CH, col * (CW + 2), row * (CH + 2), CW, CH); cap.n++; }
  const api = window.OC = {
    R, strips, frames: () => frames,
    run(n, opt = {}) { for (let i = 0; i < n; i++) { drawOn = !opt.fast; tick(); if (!opt.fast) { if (!opt.noCheck) analyse(); capture(); } if (opt.until && opt.until()) return i; } drawOn = true; return n; },
    reset() { R.frames = R.pairs = R.popN = R.popPx = R.wrongN = R.maxItems = R.cycN = 0; R.cyc.length = 0; R.rs0 = undefined; R.resorts = 0; R.pops.length = 0; R.wrong.length = 0; R.popKinds = {}; R.wrongKinds = {}; prev.clear(); strips.length = 0; saveQ = []; },
    startStrip(subj, { every = 4, max = 48, cols = 8, cw = 200, ch = 150 } = {}) { const cv = document.createElement('canvas'); cv.width = cols * (cw + 2); cv.height = Math.ceil(max / cols) * (ch + 2); const x = cv.getContext('2d'); x.fillStyle = '#ff2a6d'; x.fillRect(0, 0, cv.width, cv.height); cap = { subj, every, max, cols, cw, ch, cv, n: 0, i: 0 }; },
    endStrip() { const c = cap; cap = null; if (!c || !c.n) return null; const rows = Math.ceil(c.n / c.cols), cv = document.createElement('canvas'); cv.width = c.cv.width; cv.height = rows * (c.ch + 2); cv.getContext('2d').drawImage(c.cv, 0, 0); return cv.toDataURL(); },
    setHour(h) { const d = Math.floor(G.state.t / 1440); G.state.t = d * 1440 + h * 60; G.advance(1); },
    cam(x, y) { const z = world.heightAt(Math.round(x), Math.round(y)); G.camTarget = { x, y, z }; G.snapCam(); return G.camTarget; },
    /* ---- staging helpers ---- */
    trees(x0, y0, x1, y1) { return world.objs.filter(ob => ob.a && ob.a.tags && ob.a.tags.indexOf('tree') >= 0 && ob.x >= x0 && ob.x <= x1 && ob.y >= y0 && ob.y <= y1); },
    /* road edges ranked by how many trees / posts stand within `lat` of the lane on each side, for an axis and direction */
    treeEdges(axis, d, lat = 3.2) {
      const out = [];
      for (const e of g.edges) { if (e.axis !== axis || e.d !== d || e.closed || e.to.dead || e.from.dead) continue; const sp = g.span(e), lo = Math.min(sp[0], sp[1]), hi = Math.max(sp[0], sp[1]); if (hi - lo < 14) continue; const q = g.lanePos(e, 1, (lo + hi) / 2, {}), c = axis === 'x' ? q.y : q.x; let nearS = 0, farS = 0, posts = 0;
        for (const ob of world.objs) { const along = axis === 'x' ? ob.x : ob.y, across = (axis === 'x' ? ob.y : ob.x) - c; if (along < lo || along > hi || Math.abs(across) > lat + 2) continue; const tr = ob.a && ob.a.tags && ob.a.tags.indexOf('tree') >= 0; if (tr) { if (across > 0) nearS++; else farS++; } else if (ob.size[2] > 1.5 && ob.size[0] <= 1 && ob.size[1] <= 1) posts++; }
        out.push({ e, lo, hi, c, nearS, farS, posts, sc: Math.min(nearS, farS) * 3 + nearS + farS + posts * .3 }); }
      return out.sort((p, q) => q.sc - p.sc);
    },
    spawnOn(kind, e, off, s, opts) { const ref = g.lanePos(e, off, s, {}); const v = TR.spawn(kind, ref, Object.assign({ keep: true }, opts || {})); if (v) v.v = v.vmax * .8; return v; },
    info() { return { W: G.W, H: G.H, zoom: G.zoom, veh: TR.vehicles.length, hour: G.now().hf, items: G.renderer.stats.items }; },
  };
};

/* ---------- cases (run in the page; each returns { note, ... }) ---------- */
const CASES = {
  /* a bus down a street with trees on both sides, each axis and direction */
  bus_xp: `return await busRun('x', 1, 'bus')`, bus_xn: `return await busRun('x', -1, 'bus')`, bus_yp: `return await busRun('y', 1, 'bus')`, bus_yn: `return await busRun('y', -1, 'bus')`,
  truck_xp: `return await busRun('x', 1, 'truck')`, truck_yn: `return await busRun('y', -1, 'truck')`, fire_yp: `return await busRun('y', 1, 'fire')`,
  bus_corner: `return await cornerRun('bus')`,
  bus_stop: `return await stopRun()`,
  trains_central: `return await trainsMeet('central')`, trains_viaduct: `return await trainsMeet(null)`, train_over_road: `return await trainOverRoad()`,
  watch_harbor: `return await watch('harbor')`, watch_plaza: `return await watch('plaza')`, watch_central: `return await watch('central')`,
};
const LIB = () => {
  const TR = G.traffic, g = TR.graph, world = G.world, U = 16;
  const settle = () => { OC.run(40, { noCheck: true }); };
  window.busRun = async (axis, d, kind) => {
    const L = OC.treeEdges(axis, d), pick = L[0]; if (!pick) return { note: 'no edge' }; const e = pick.e, s0 = d > 0 ? pick.lo + 1 : pick.hi - 1, mid = (pick.lo + pick.hi) / 2;
    const t = OC.cam(axis === 'x' ? mid : pick.c, axis === 'x' ? pick.c : mid); OC.run(90, { fast: true }); settle();
    for (const v of TR.vehicles.slice()) { const al = axis === 'x' ? v.x : v.y, ac = axis === 'x' ? v.y : v.x; if (Math.abs(ac - pick.c) < 3 && al > pick.lo - 12 && al < pick.hi + 12) TR.release(v); }
    const v = OC.spawnOn(kind, e, 1, s0); if (!v) return { note: 'spawn failed', edge: [e.axis, e.d, pick.lo, pick.hi, pick.c] };
    G.camTarget = v; G.snapCam(); settle(); OC.reset(); OC.startStrip(() => v, { every: 5, max: 48, cols: 8, cw: 190, ch: 150 });
    const n = OC.run(700, { until: () => !v.active || v.e !== e || (d > 0 ? v.s > pick.hi - 1 : v.s < pick.lo + 1) });
    return { note: kind + ' on ' + axis + (d > 0 ? '+' : '-') + ' edge c=' + pick.c.toFixed(1) + ' ' + pick.lo.toFixed(0) + '..' + pick.hi.toFixed(0) + ' trees near/far ' + pick.nearS + '/' + pick.farS + ' posts ' + pick.posts, frames: n, strip: OC.endStrip() };
  };
  /* a bus through a turn: a route x edge -> y edge found on the graph */
  window.cornerRun = async kind => {
    let best = null; for (const e of g.edges) { if (e.closed || e.to.dead || e.from.dead || !e.to.out) continue; for (const ne of e.to.out) { if (ne.axis === e.axis || ne.to.dead || ne.closed) continue; const sp = g.span(e), sq = g.span(ne); if (Math.abs(sp[1] - sp[0]) < 12 || Math.abs(sq[1] - sq[0]) < 12) continue; let tr = 0; const nx = e.to.x, ny = e.to.y; for (const ob of world.objs) if (ob.a && ob.a.tags && ob.a.tags.indexOf('tree') >= 0 && Math.abs(ob.x - nx) < 9 && Math.abs(ob.y - ny) < 9) tr++; if (!best || tr > best.tr) best = { e, ne, tr }; } }
    if (!best) return { note: 'no corner found (edge.to.out missing?)' };
    const e = best.e, ne = best.ne, sp = g.span(e); OC.cam(e.to.x, e.to.y); OC.run(90, { fast: true }); settle();
    const res = []; let strip = null;
    for (const pair of [[e, ne]]) { const v = OC.spawnOn(kind, pair[0], 1, sp[1] - e.d * 10); if (!v) return { note: 'spawn failed' }; const r = g.route(g.lanePos(pair[0], 1, sp[1] - e.d * 10, {}), g.lanePos(pair[1], 1, (g.span(pair[1])[0] + g.span(pair[1])[1]) / 2, {})); if (r) TR.setPlan(v, r);
      G.camTarget = v; G.snapCam(); settle(); OC.reset(); OC.startStrip(() => v, { every: 4, max: 64, cols: 8, cw: 190, ch: 150 }); const n = OC.run(900, { until: () => !v.active || (v.e === pair[1] && Math.abs(v.s - g.span(pair[1])[0]) > 9) }); strip = OC.endStrip(); res.push(n + ' frames, ended on ' + (v.e === pair[1] ? 'the turn edge' : 'another edge')); }
    return { note: kind + ' turning ' + e.axis + (e.d > 0 ? '+' : '-') + ' -> ' + ne.axis + (ne.d > 0 ? '+' : '-') + ' at ' + e.to.x + ',' + e.to.y + ' trees ' + best.tr + '; ' + res.join(), strip };
  };
  /* a bus at a stop with a shelter and people: the first real bus that comes to the busiest stop near trees */
  window.stopRun = async () => {
    const stops = world.findPois('busstop'); let best = null; for (const p of stops) { let n = 0; for (const ob of world.objs) if (Math.abs(ob.x - p.x) < 7 && Math.abs(ob.y - p.y) < 7 && ob.size[2] > 1.2 && ob.size[0] <= 2.5 && ob.size[1] <= 2.5) n++; if (!best || n > best.n) best = { p, n }; }
    const p = best.p; OC.cam(p.x, p.y); OC.run(120, { fast: true }); settle(); OC.reset();
    let bus = null; const n0 = OC.run(60 * 150, { fast: true, until: () => { bus = TR.vehicles.find(v => v.bus && Math.hypot(v.x - p.x, v.y - p.y) < 16); return !!bus; } });
    if (!bus) return { note: 'no bus came to ' + (p.id || '') + ' in 150 s' };
    OC.reset(); OC.startStrip(() => ({ x: p.x, y: p.y, z: world.heightAt(Math.round(p.x), Math.round(p.y)) }), { every: 6, max: 64, cols: 8, cw: 220, ch: 160 }); const n = OC.run(60 * 22, { until: () => !bus.active || Math.hypot(bus.x - p.x, bus.y - p.y) > 22 });
    return { note: 'bus stop ' + (p.id || '') + ' at ' + p.x + ',' + p.y + ' (' + best.n + ' upright things around), bus after ' + n0 + ' frames, watched ' + n, strip: OC.endStrip() };
  };
  /* two trains passing: find a time (near the wanted hour) at which a Loop A and a Loop B train are close to each other at a station / away from one, set the clock a little before, watch */
  window.trainsMeet = async at => {
    const RL = G.rail, base = G.state.t, sts = RL.stations(), st = at ? RL.station(at) : null; let best = null;
    for (let dt = 2; dt < 100 && !best; dt += .05) { const t = base + dt; for (let i = 0; i < RL.NSETS && !best; i++) { const A = RL.trainState(0, i, t); if (st ? Math.hypot(A.x - st.x, A.y - st.y) > 14 : (A.dwell || sts.some(s => Math.hypot(A.x - s.x, A.y - s.y) < 34))) continue; for (let j = 0; j < RL.NSETS; j++) { const B = RL.trainState(1, j, t); if (Math.hypot(A.x - B.x, A.y - B.y) < 3.2 && (st || (A.v > 8 && B.v > 8)) && (!st || A.v > 1 || B.v > 1)) { best = { t, A, B }; break; } } } }
    if (!best) return { note: 'no meeting found' };
    const mx = (best.A.x + best.B.x) / 2, my = (best.A.y + best.B.y) / 2, z = world.rail.deckZ(mx, my); G.camTarget = { x: mx, y: my, z }; G.snapCam();
    G.state.t = best.t - 1.6; OC.run(30, { fast: true }); settle(); OC.reset(); const ct = G.camTarget;
    OC.startStrip(() => ct, { every: 6, max: 64, cols: 6, cw: 300, ch: 200 }); const n = OC.run(60 * 4);
    return { note: 'trains ' + best.A.train + ' (A) and ' + best.B.train + ' (B) meet at ' + mx.toFixed(0) + ',' + my.toFixed(0) + (at ? ' (' + at + ')' : ' (open line)') + ' z ' + z + ', game t +' + (best.t - base).toFixed(1) + ' min', strip: OC.endStrip() };
  };
  /* a train over a road with traffic: the viaduct segment that has the most road edges crossing or running under it */
  window.trainOverRoad = async () => {
    const RL = G.rail, P = world.rail.path; let best = null;
    for (const e of g.edges) { if (e.closed) continue; const sp = g.span(e), q = g.lanePos(e, 1, (sp[0] + sp[1]) / 2, {}); for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length], len = Math.hypot(b[0] - a[0], b[1] - a[1]), t = Math.max(0, Math.min(len, ((q.x - a[0]) * (b[0] - a[0]) + (q.y - a[1]) * (b[1] - a[1])) / len)), px = a[0] + (b[0] - a[0]) * t / len, py = a[1] + (b[1] - a[1]) * t / len, d = Math.hypot(px - q.x, py - q.y); if (d < 5 && world.rail.deckZ(px, py) - world.heightAt(Math.round(q.x), Math.round(q.y)) > 3) { const sc = (e.w || 1) * Math.abs(sp[1] - sp[0]); if (!best || sc > best.sc) best = { e, x: q.x, y: q.y, sc }; } } }
    if (!best) return { note: 'no road under the viaduct' };
    const base = G.state.t; let tt = null; for (let dt = 1; dt < 60 && tt === null; dt += .05) for (let d = 0; d < 2 && tt === null; d++) for (let i = 0; i < RL.NSETS; i++) { const A = RL.trainState(d, i, base + dt); if (Math.hypot(A.x - best.x, A.y - best.y) < 4 && A.v > 5) { tt = base + dt; break; } }
    const ct = OC.cam(best.x, best.y); OC.run(60 * 12, { fast: true }); if (tt !== null) G.state.t = tt - 1.2; OC.run(20, { fast: true }); settle(); OC.reset();
    OC.startStrip(() => ct, { every: 6, max: 60, cols: 6, cw: 300, ch: 230 }); const n = OC.run(60 * 5);
    return { note: 'road under the viaduct at ' + best.x.toFixed(0) + ',' + best.y.toFixed(0) + ' (' + best.e.axis + '), train ' + (tt === null ? 'not found' : 'passes'), strip: OC.endStrip() };
  };
  /* free-camera watch at a busy place: the camera drifts slowly round a small loop, the game runs for `seconds`, a strip frame every 3 s */
  window.watch = async (place, seconds) => {
    seconds = seconds || window.__watch || 180; const RL = G.rail; let c;
    if (place === 'central') { const s = RL.station('central'); c = [s.x, s.y + 6]; } else if (place === 'plaza') c = [222, 228];
    else { const s = RL.station('harbor'); c = [s.x + 10, s.y + 3]; }
    const ct = OC.cam(c[0], c[1]); OC.run(60 * 10, { fast: true }); settle(); OC.reset(); window.__popStrips = 10;
    OC.startStrip(() => ct, { every: 180, max: 60, cols: 6, cw: Math.min(G.W, 390), ch: Math.min(G.H, 300) });
    const F = seconds * 60; for (let f = 0; f < F; f += 30) { const a = f / F * Math.PI * 4; ct.x = c[0] + Math.cos(a) * 7; ct.y = c[1] + Math.sin(a) * 5; ct.z = world.heightAt(Math.round(ct.x), Math.round(ct.y)); OC.run(30); await new Promise(r => setTimeout(r, 0)); }
    window.__popStrips = 0;
    return { note: place + ' ' + c.join(',') + ' for ' + seconds + ' s, vehicles now ' + TR.vehicles.length, strip: OC.endStrip() };
  };
};

if (o.cases === 'list') { console.log(Object.keys(CASES).join(' ')); process.exit(0); }
const ids = o.cases === 'all' ? Object.keys(CASES) : o.cases.split(','); for (const id of ids) if (!CASES[id]) { console.log('unknown case ' + id); process.exit(1); }
const br = await chromium.launch({ args: ['--disable-background-timer-throttling', '--disable-renderer-backgrounding'] });
const results = {}; let pageErrors = 0;
async function runCase(id) {
  const ctx = await br.newContext({ viewport: { width: o.w, height: o.h }, deviceScaleFactor: 1 }); const pg = await ctx.newPage(); const errs = [];
  pg.on('pageerror', e => { errs.push('exception: ' + (e.stack || e.message).slice(0, 300)); }); pg.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 300)); });
  await pg.addInitScript(INIT); await pg.goto(URLB + (o.query || ''));
  await pg.waitForFunction(() => !document.getElementById('load') && window.G && window.G.scene, null, { timeout: 90000 });
  const t0 = Date.now(); let res;
  try {
    await pg.evaluate(async ([zoom, hour, watch]) => { window.__watch = watch; window.__softlog = /softlog/.test(location.search); await G.go('city', { x: 222, y: 228, fade: false }); await new Promise(r => setTimeout(r, 800)); G.setZoom(zoom); const d = Math.floor(G.state.t / 1440); G.state.t = d * 1440 + hour * 60; G.advance(1); try { G.weather && G.weather.setWeather && G.weather.setWeather('clear', 24); } catch (e) { } }, [o.zoom, o.hour, o.watch]);
    await pg.evaluate(HARNESS); await pg.evaluate(LIB);
    res = await pg.evaluate(`(async()=>{${CASES[id]}})()`);
    const R = await pg.evaluate(() => ({ R: OC.R, strips: OC.strips, info: OC.info() })); Object.assign(res, R);
  } catch (e) { res = { note: 'ERROR ' + e.message.slice(0, 400) }; errs.push('case error'); }
  const tag = id + '_' + (o.hour >= 19 || o.hour < 6 ? 'night' : 'day');
  if (res.strip && o.strips) fs.writeFileSync(path.join(OUT, tag + '.png'), Buffer.from(res.strip.split(',')[1], 'base64')); delete res.strip;
  (res.strips || []).forEach((s, i) => { fs.writeFileSync(path.join(OUT, tag + '_pop' + i + '.png'), Buffer.from(s.url.split(',')[1], 'base64')); s.file = tag + '_pop' + i + '.png'; delete s.url; });
  res.errors = errs; pageErrors += errs.length; res.secs = Math.round((Date.now() - t0) / 1000); results[tag] = res; await ctx.close();
  const R = res.R || {}; console.log(`${tag.padEnd(24)} frames ${String(R.frames || 0).padStart(5)}  pairs ${String(R.pairs || 0).padStart(7)}  POPS ${String(R.popN || 0).padStart(4)} (${String(R.popPx || 0).padStart(6)} px)  WRONG ${String(R.wrongN || 0).padStart(5)}  CYCLES ${String(R.cycN || 0).padStart(4)}  RESORT ${String(R.resorts || 0).padStart(4)}  OUTSIDE ${R.outN || 0}  errors ${errs.length}  ${res.secs}s  ${res.note}`);
  if (R.popN) console.log('    pops by kind: ' + JSON.stringify(R.popKinds)); if (R.wrongN) console.log('    wrong by kind: ' + JSON.stringify(R.wrongKinds)); for (const e of errs.slice(0, 3)) console.log('    ! ' + e);
}
const queue = ids.slice(); await Promise.all(Array.from({ length: Math.min(o.jobs, queue.length) }, async () => { while (queue.length) await runCase(queue.shift()); }));
fs.writeFileSync(path.join(OUT, 'result_' + (o.hour >= 19 || o.hour < 6 ? 'night' : 'day') + '.json'), JSON.stringify({ html: o.html, query: o.query, hour: o.hour, viewport: [o.w, o.h], zoom: o.zoom, results }, null, 1));
let pops = 0, wrong = 0; for (const k in results) { pops += (results[k].R || {}).popN || 0; wrong += (results[k].R || {}).wrongN || 0; }
console.log(`TOTAL pops ${pops}, wrong ${wrong}, page errors ${pageErrors} -> ${path.relative(ROOT, OUT)}`);
await br.close(); srv.close();
