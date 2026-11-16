// Performance benchmark: scripted scenes on a phone-sized, CPU-throttled headless Chromium. See docs/reports/performance.md.
//
//   node tools/perf.mjs [--scenes walk,night_rain,...|all] [--rate 4] [--dsf 2] [--runs 3] [--out name] [--profile] [--html file]
//                       [--soak minutes] [--save file] [--label text]
//
//   --scenes   comma list (default: all). Scenes: walk (three districts, day), night_rain (same walk, 21:30, rain), night_plaza (City Hall Plaza at 22:00), cab (taxi across town),
//              train (light rail ride), parade (Blossom Parade staged + marching), rooms (enter and leave five rooms), busy_room (the Galleria
//              and Central Station on foot), phone (phone open over the city), walk4x (city walk at game speed 4), snow (winter walk in snow).
//   --rate     CPU slow-down (Emulation.setCPUThrottlingRate), default 4. --dsf  devicePixelRatio (2 or 3), default 2. Viewport is 390x844, touch.
//   --runs     runs per scene (default 3); every run is a FRESH page (cold ground/sprite caches = a first visit). The table shows the median
//              and the min-max spread: other processes load this machine, so a difference inside the spread is noise.
//   --profile  also take a CPU profile per scene (uses an un-minified bundle so the functions have names; slower than without). Prints the top
//              self-time functions for the whole scene and for the long frames only (JS > 40 ms in one frame = "hitch profile").
//   --html     measure this single-file build instead of bundling the current tree; --html before.html,after.html compares builds with
//              interleaved runs (keep a copy of dist/index.html before a change to have a "before"); a query string can follow a file name
//              (after.html?nobakeworker, after.html?nobake: the engine's test switches).
//   --soak N   instead of the scenes: wander the city and rooms for N minutes, forcing a GC and reading the JS heap every 30 s (leak check).
//   --verify   instead of the scenes: the "same pixels" checks of the engine's test hooks, run in the page (takes ~2 minutes):
//              every object of the city and of six rooms, and every ground chunk, painted in one go vs. in bands (the bake queue) and vs.
//              by the bake worker; citizens' sprites worker vs. main thread; the draw order of 600 frames (city walk + parade) vs. the old
//              depth sort; a winter sample. Prints one line per check and exits with code 1 if anything differs.
//   --out      name of the result files: out/perf/<name>.json (everything) and out/perf/<name>.md (the table). Default: perf_<rate>x_dsf<dsf>.
//
// What is measured, per scene: rAF-to-rAF frame times (fps = frames / time, "1% low" = fps over the slowest 1% of frames, worst frame,
// frames over 50 / 100 ms), the JS time spent inside rAF callbacks per frame (p50 / p95 / worst: this is the game's own work, without the
// browser's paint), the JS heap after a forced GC at the start and the end of the scene, and page errors (must be zero).
// The start state is tools/perf_save.json (day 0, at home in Old Town) with Math.random replaced by a seeded generator, tips and needs off.
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module'; import { build } from 'esbuild';
import { ROOT } from './artfiles.mjs'; import { genModules } from './modules.mjs';
const require = createRequire(import.meta.url); const { chromium } = require('playwright');
const a = process.argv.slice(2), o = { scenes: 'all', rate: 4, dsf: 2, runs: 3, out: '', profile: false, html: '', soak: 0, save: path.join(ROOT, 'tools/perf_save.json'), label: '' };
for (let i = 0; i < a.length; i++) { const k = a[i].slice(2); if (k === 'profile') o.profile = true; else if (k === 'verify') o.verify = true; else o[k] = ['scenes', 'out', 'html', 'save', 'label'].includes(k) ? a[++i] : +a[++i]; }
const OUT = path.join(ROOT, 'out/perf'); fs.mkdirSync(OUT, { recursive: true });
const name = o.out || `perf_${o.rate}x_dsf${o.dsf}${o.soak ? '_soak' : o.verify ? '_verify' : ''}`;

/* ---------- the page under test ---------- */
/* the same steps as tools/build.mjs (kept in step with it by hand: if the build gains a step, add it here), without writing dist/ */
let audioPack = null; try { audioPack = await import('./audio_pack.mjs'); } catch (e) { }
async function bundle(minify) {
  genModules(); if (audioPack && audioPack.genManifestModule) audioPack.genManifestModule();
  const r = await build({ entryPoints: [path.join(ROOT, 'src/main.js')], bundle: true, format: 'iife', minify, write: false, target: 'es2020', legalComments: 'none' });
  const js = r.outputFiles[0].text.replace(/<\/script/g, '<\\/script');
  let css = fs.readFileSync(path.join(ROOT, 'src/ui/style.css'), 'utf8');
  for (const f of fs.readdirSync(path.join(ROOT, 'src/ui'))) if (f.endsWith('.css') && f !== 'style.css') css += '\n' + fs.readFileSync(path.join(ROOT, 'src/ui', f), 'utf8');
  let font = ''; const fp = path.join(ROOT, 'assets/font.woff2'); if (fs.existsSync(fp)) font = `@font-face{font-family:"Pixelify Sans";font-weight:400 700;src:url(data:font/woff2;base64,${fs.readFileSync(fp).toString('base64')}) format("woff2")}`;
  let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  html = html.replace(/<style>@font-face.*?<\/style>/, '').replace('<link rel="stylesheet" href="src/ui/style.css">', () => `<style>${font}${css}</style>`).replace('<script type="module" src="src/main.js"></script>', () => `<script>${js}</script>`);
  if (audioPack && audioPack.audioBlocks) { const amb = audioPack.audioBlocks(); if (amb && amb.html) html = html.replace('</body>', () => amb.html + '</body>'); }
  return html;
}
/* --html a.html,b.html compares builds: the runs are interleaved (a, b, a, b, ...) so that both see the same machine load */
const BUILDS = o.html ? o.html.split(',').map(f => { const [file, q] = f.split('?'); return { name: path.basename(file).replace(/\.html$/, '') + (q ? '?' + q : ''), q: q || '', html: fs.readFileSync(path.resolve(file), 'utf8') }; }) : [{ name: 'tree', q: '', html: await bundle(!o.profile) }];   // file.html?nobakeworker = the same build opened with that query string
const HTML = BUILDS[0].html;
if (o.profile && !o.html) fs.writeFileSync(path.join(OUT, 'bundle_dev.html'), HTML);   // the profile's line numbers (fn:line) are lines of this file
const srv = http.createServer((req, res) => { const i = +(req.url.split('?')[0].slice(1) || 0); res.writeHead(200, { 'content-type': 'text/html' }); res.end((BUILDS[i] || BUILDS[0]).html); });
await new Promise(r => srv.listen(0, r)); const URLB = `http://localhost:${srv.address().port}/`;
const SAVE = fs.readFileSync(o.save, 'utf8');

/* runs in the page before the game: seeded Math.random + frame recorder (rAF deltas and JS time inside rAF callbacks) */
const INIT = () => {
  let s = 0x2545f491; Math.random = () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; };
  const P = window.__perf = { rec: false, d: [], js: [], last: 0, cur: -1, acc: 0 };
  const raf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = cb => raf(function __perfRaf(t) {
    if (t !== P.cur) { if (P.rec && P.cur >= 0) { P.d.push(t - P.cur); P.js.push(P.acc); } P.cur = t; P.acc = 0; }
    const t0 = performance.now(); try { cb(t); } finally { P.acc += performance.now() - t0; }
  });
};
/* helpers defined in the page after the game has started */
const HELP = () => {
  window.sleep = ms => new Promise(r => setTimeout(r, ms));
  try { G.state.tips.off = 1; } catch (e) { } try { G.dev.set(true); G.state.dev.needs = true; G.state.dev.money = true; } catch (e) { }
  window.closeUi = async () => { for (let i = 0; i < 20; i++) { const s = document.querySelector('.say'); if (s) s.click(); const b = [...document.querySelectorAll('button')].find(b => /^Got it$/.test(b.textContent.trim()) && b.offsetParent); if (b) b.click(); const x = document.querySelector('.modal .x'); if (x) x.click(); if (!s && !b && !x) break; await sleep(80); } };
  /* walk through the points until `ms` real milliseconds have passed (stands still if it arrives early) */
  window.walkRoute = async (pts, ms) => { const p = G.player, t0 = performance.now(); let i = 0, ok = 0; while (performance.now() - t0 < ms) { if (!p.path && i < pts.length) { const q = pts[i++]; if (p.goTo(G.world, q[0], q[1], { snap: 8, limit: 60000 })) ok++; } if (G.modal && !(G.phone && G.phone.isOpen)) await closeUi(); await sleep(100); } p.stop(); return ok + '/' + pts.length + ' legs, at ' + Math.round(p.x) + ',' + Math.round(p.y); };
  window.toCity = async (x, y, hour) => { if (hour !== undefined) { const d = Math.floor(G.state.t / 1440); G.state.t = d * 1440 + hour * 60; G.advance(1); } await G.go('city', { x, y, fade: false }); await sleep(1200); await closeUi(); };
  window.ROUTE = [[100, 231], [130, 229], [150, 226], [176, 222], [200, 226], [222, 226], [246, 231]];   // Old Town -> the river park -> Downtown
};

/* ---------- scenes: prep() is not measured, run() is ---------- */
const SCENES = {
  walk: { title: 'city walk, three districts (day)', prep: async () => { await toCity(62, 231, 12); }, run: async () => walkRoute(ROUTE, 40000) },
  night_plaza: { title: 'City Hall Plaza and the streets around it, 22:00, clear (night light: many people, props and vehicles in pools)', prep: async () => { await toCity(222, 228, 22); }, run: async () => walkRoute([[232, 228], [232, 215], [212, 215], [212, 232], [222, 228], [236, 226], [222, 228]], 30000) },
  night_rain: { title: 'the same walk at night in rain', prep: async () => { await toCity(62, 231, 21.5); G.weather.setWeather('rain', 6); await sleep(1500); }, run: async () => walkRoute(ROUTE, 40000) },
  cab: { title: 'cab ride across town', prep: async () => { await toCity(100, 262, 12); },
    run: async () => { const off = G.on('taxi:here', c => setTimeout(() => { if (c && c._it && G.transit.pending) G.useInteractable(c._it); }, 50)); const pr = G.transit.callTaxi('cinema', { free: true, silent: true }); const r = await Promise.race([pr, sleep(60000).then(() => 'cap 60 s')]); off(); return 'arrived: ' + r + ' at ' + Math.round(G.player.x) + ',' + Math.round(G.player.y); } },
  train: { title: 'train ride (Old Town -> Central)', prep: async () => { await toCity(36, 248, 12); },
    run: async () => { const pr = G.transit.rideTrain('oldtown', 'central', { free: true, nowait: true }); const t0 = performance.now(); let off = false; while (performance.now() - t0 < 45000) { await sleep(200); const s = G.trainRide && G.scene.id === 'train' && G.trainRide.state(); if (s && s.ts && s.ride && s.ts.dwell && s.ts.at === s.ride.to && !off) { off = true; try { G.trainRide.getOff(); } catch (e) { } } if (off && G.scene.id !== 'train') break; } await sleep(1500); return G.scene.id + ' after ' + Math.round((performance.now() - t0) / 1000) + ' s'; } },
  parade: { title: 'Blossom Parade (staged, then marching)', prep: async () => { await toCity(189, 150, 12); },
    run: async () => { const ev = G.cityEvents.debug; await ev.start('blossom_parade'); await sleep(1500); try { ev.parade(); } catch (e) { } await closeUi(); const m = ev.moment && ev.moment(); await walkRoute([[189, 135], [189, 160], [189, 140]], 22000); return 'ents ' + G.scene.ents.length + (m ? ' moment ' + Math.round(m.x) + ',' + Math.round(m.y) : ''); } },
  rooms: { title: 'enter and leave five rooms', prep: async () => { await toCity(89, 231, 12); },
    run: async () => { const out = []; for (const id of ['cafe', 'bookstore', 'grocery', 'gym', 'cinema']) { try { await G.go('int:' + id); await sleep(1800); await closeUi(); out.push(id + ':' + G.scene.ents.length); const pl = G.places.get(id); await G.go('city', pl ? { x: pl.x, y: pl.y + 1 } : {}); await sleep(1800); } catch (e) { out.push(id + ' ERR ' + e.message.slice(0, 60)); } } return out.join(' '); } },
  busy_room: { title: 'busy rooms on foot (Galleria, Central Station)', prep: async () => { await toCity(246, 231, 12); },
    run: async () => { const out = []; for (const id of ['deptstore', 'central_station']) { await G.go('int:' + id); await sleep(1000); await closeUi(); const W = G.world, p = G.player, pts = [[W.w * .25, W.h * .3], [W.w * .75, W.h * .35], [W.w * .7, W.h * .75], [W.w * .3, W.h * .7], [p.x, p.y]]; out.push(id + ':' + G.scene.ents.length + ' ' + await walkRoute(pts, 14000)); } return out.join(' | '); } },
  phone: { title: 'phone open over the city', prep: async () => { await toCity(100, 255, 12); },
    run: async () => { G.phone.open(); await sleep(6000); try { G.phone.open('map'); } catch (e) { } await sleep(6000); G.phone.close(); await sleep(3000); return 'modal ' + G.modal; } },
  walk4x: { title: 'city walk at game speed 4x', prep: async () => { await toCity(62, 231, 12); },
    run: async () => { G.state.speed = 4; const r = await walkRoute(ROUTE.concat([[262, 262], [246, 290], [213, 300], [190, 262], [130, 262], [62, 231]]), 30000); G.state.speed = 1; return r; } },
  snow: { title: 'winter walk in snow', prep: async () => { G.state.t = (3 * 28 + 10) * 1440 + 12 * 60; G.advance(1); await sleep(500); await toCity(62, 231); G.weather.setWeather('snow', 6); await sleep(1500); }, run: async () => walkRoute(ROUTE, 30000) },
};

/* ---------- one fresh page ---------- */
async function openGame(br, bi = 0) {
  const URL0 = URLB + bi + (BUILDS[bi] && BUILDS[bi].q ? '?' + BUILDS[bi].q : '');
  const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: o.dsf, hasTouch: true }); const pg = await ctx.newPage();
  const errs = []; pg.on('pageerror', e => errs.push(e.message.slice(0, 300)));
  await pg.addInitScript(INIT);
  await pg.goto(URL0); await pg.evaluate(s => localStorage.setItem('maplebay.save.v1', s), SAVE);
  await pg.goto(URL0); await pg.waitForFunction(() => window.G && G.onTitle !== undefined && !document.getElementById('load'), null, { timeout: 180000 }); await pg.waitForTimeout(800);
  await pg.touchscreen.tap(195, 440); await pg.waitForFunction(() => !G.onTitle && G.scene, null, { timeout: 60000 }); await pg.waitForTimeout(2500);
  await pg.evaluate(HELP);
  const cdp = await ctx.newCDPSession(pg);
  const heap = async () => { await cdp.send('HeapProfiler.collectGarbage'); const h = await cdp.send('Runtime.getHeapUsage'); return +(h.usedSize / 1048576).toFixed(1); };
  return { ctx, pg, cdp, errs, heap };
}
const q = (s, f) => s[Math.min(s.length - 1, Math.floor(s.length * f))];
function stats(d, js) {
  const s = d.slice().sort((x, y) => x - y), j = js.slice().sort((x, y) => x - y); if (!s.length) return null; const sum = s.reduce((p, c) => p + c, 0);
  const n1 = Math.max(1, Math.round(s.length * .01)), low = s.slice(-n1).reduce((p, c) => p + c, 0) / n1;
  return { frames: s.length, fps: +(1000 * s.length / sum).toFixed(1), low1: +(1000 / low).toFixed(1), p95: +q(s, .95).toFixed(1), worst: +s[s.length - 1].toFixed(0), over50: s.filter(v => v > 50).length, over100: s.filter(v => v > 100).length,
    per10s50: +(s.filter(v => v > 50).length * 10000 / sum).toFixed(1), jsP50: +q(j, .5).toFixed(1), jsP95: +q(j, .95).toFixed(1), jsWorst: +j[j.length - 1].toFixed(0) };
}
/* CPU profile -> top self-time functions overall and inside long frames (a run of samples under the rAF wrapper that lasts > 40 ms) */
const CATS = [['renderChunk', 'ground chunk'], ['treeLayer', 'outskirt trees'], ['pixSprite', 'character bake'], ['objSprite', 'object bake'], ['assetSprite', 'asset bake'], ['cached', 'sprite bake (other)'], ['poolSprite', 'light pool bake'], ['sortItems', 'depth sort'], ['findPath', 'pathfinding'], ['save', 'save']];
function topFns(profile) {
  const byId = new Map(profile.nodes.map(n => [n.id, n])), parent = new Map(); for (const n of profile.nodes) for (const c of n.children || []) parent.set(c, n.id);
  const fnOf = id => byId.get(id).callFrame.functionName.replace(/\d+$/, '');
  const inRaf = new Map(), isRaf = id => { if (inRaf.has(id)) return inRaf.get(id); let x = id, r = false; while (x !== undefined) { if (byId.get(x).callFrame.functionName === '__perfRaf') { r = true; break; } x = parent.get(x); } inRaf.set(id, r); return r; };
  /* cause of a sample = the OUTERMOST frame on its stack that is one of CATS (objSprite > cached > render ...); else the function called directly by the game's frame() */
  const catC = new Map(), catOf = id => { if (catC.has(id)) return catC.get(id); let x = id, r = null; const st = []; while (x !== undefined) { const f = fnOf(x); if (f === '__perfRaf') break; st.push(f); for (const [fn, c] of CATS) if (f === fn) { r = c; break; } x = parent.get(x); } if (!r) { const top = st.length >= 2 ? st[st.length - 2] : st[0]; r = 'other: ' + (top || '?'); } catC.set(id, r); return r; };
  const key = n => { const cf = n.callFrame; return (cf.functionName || '(anon)') + (cf.url ? ':' + (cf.lineNumber + 1) : ''); };
  const nat = new Map(), natOf = id => { const n = byId.get(id), cf = n.callFrame; if (cf.url || !cf.functionName || cf.functionName.startsWith('(')) return null; const st = []; let x = parent.get(id); while (x !== undefined && st.length < 3) { const f = fnOf(x); if (f === '__perfRaf') break; st.push(f || '(anon)'); x = parent.get(x); } return cf.functionName + ' < ' + st.join(' < '); };   // browser calls (drawImage ...) by who calls them
  const all = new Map(), hit = new Map(), cats = new Map(), frames = []; let tot = 0, hitTot = 0, run = [], runT = 0, gap = 0;   // a run = one frame's JS: it ends at an idle sample or after >= 2 ms of (program) (the browser's own work between frames)
  const pathC = new Map(), pathOf = id => { if (pathC.has(id)) return pathC.get(id); const st = []; let x = id; while (x !== undefined) { const f = fnOf(x); if (f === '__perfRaf') break; st.push(f || '(anon)'); x = parent.get(x); } const r = st.reverse().slice(1, 8).join(' > '); pathC.set(id, r); return r; };
  const flush = () => { if (runT > 40000) { const fc = {}, fp = {}; for (const [k, v, c, id] of run) { hit.set(k, (hit.get(k) || 0) + v); hitTot += v; cats.set(c, (cats.get(c) || 0) + v); fc[c] = (fc[c] || 0) + v; if (id !== undefined) { const pk = pathOf(id); fp[pk] = (fp[pk] || 0) + v; } } frames.push([runT, fc, fp]); } run = []; runT = 0; };
  for (let i = 0; i < profile.samples.length; i++) { const id = profile.samples[i], n = byId.get(id), dt = profile.timeDeltas[i] || 0, k = key(n); if (/^\((idle)\)/.test(k)) { flush(); continue; } all.set(k, (all.get(k) || 0) + dt); tot += dt; { const nk = natOf(id); if (nk) nat.set(nk, (nat.get(nk) || 0) + dt); } if (k.startsWith('(garbage')) { run.push([k, dt, 'GC']); runT += dt; } else if (isRaf(id)) { gap = 0; run.push([k, dt, catOf(id), id]); runT += dt; } else if (k.startsWith('(program')) { gap += dt; if (gap >= 2000) flush(); } else flush(); }
  flush();
  const top = (m, t, n) => [...m.entries()].sort((x, y) => y[1] - x[1]).slice(0, n).map(([k, v]) => `${k} ${(100 * v / t).toFixed(1)}%`);
  frames.sort((x, y) => y[0] - x[0]);
  return { busyMs: Math.round(tot / 1000), top: top(all, tot, 25), natives: top(nat, tot, 16), hitchMs: Math.round(hitTot / 1000), hitchFrames: frames.length, hitchTop: top(hit, hitTot || 1, 18), hitchCats: top(cats, hitTot || 1, 16),
    worstFrames: frames.slice(0, 8).map(([t, fc, fp]) => Math.round(t / 1000) + ' ms: ' + Object.entries(fc).sort((x, y) => y[1] - x[1]).slice(0, 4).map(([c, v]) => c + ' ' + Math.round(v / 1000)).join(', ') + '\n      ' + Object.entries(fp).sort((x, y) => y[1] - x[1]).slice(0, 3).map(([c, v]) => Math.round(v / 1000) + ' ms in ' + c).join('\n      ')) };
}
async function runScene(br, id, bi = 0) {
  const sc = SCENES[id], g = await openGame(br, bi); let res = null;
  try {
    await g.pg.evaluate(sc.prep);
    await g.cdp.send('Emulation.setCPUThrottlingRate', { rate: o.rate }); await g.pg.waitForTimeout(500);
    const h0 = await g.heap();
    if (o.profile) { await g.cdp.send('Profiler.enable'); await g.cdp.send('Profiler.setSamplingInterval', { interval: 1000 }); await g.cdp.send('Profiler.start'); }
    await g.pg.evaluate(() => { const P = window.__perf; P.d = []; P.js = []; P.rec = true; try { const st = G.renderer.stats; P.st0 = Object.assign({}, st); } catch (e) { } });
    const note = await g.pg.evaluate(sc.run).catch(e => 'ERR ' + e.message.slice(0, 200));
    const fr = await g.pg.evaluate(() => { const P = window.__perf; P.rec = false; return { d: P.d, js: P.js }; });
    let prof = null; if (o.profile) { const { profile } = await g.cdp.send('Profiler.stop'); prof = topFns(profile); }
    const h1 = await g.heap(), eng = await g.pg.evaluate(() => { try { if (!G.renderer.perf) return null; const e = G.renderer.perf(), s0 = window.__perf.st0 || {}, n = (e.frames - (s0.frames || 0)) || 1; e.drawMsPerFrame = {}; for (const k of ['tGround', 'tUnder', 'tItems', 'tAmb', 'tGlow', 'tOver', 'aheadMs']) if (e[k] !== undefined) { e.drawMsPerFrame[k.replace(/^t/, '').replace('Ms', '').toLowerCase()] = +((e[k] - (s0[k] || 0)) / n).toFixed(2); delete e[k]; } return e; } catch (e) { return null; } });
    res = { ...stats(fr.d.slice(1), fr.js.slice(1)), heap0: h0, heap1: h1, note, errors: g.errs.slice(0, 5), prof, eng };
  } catch (e) { res = { error: e.message.slice(0, 300), errors: g.errs.slice(0, 5) }; }
  await g.ctx.close(); return res;
}
const med = v => { const s = v.filter(x => x !== undefined && x !== null).sort((x, y) => x - y); return s.length ? s[s.length >> 1] : null; };
const spread = (runs, k) => { const v = runs.map(r => r[k]).filter(x => typeof x === 'number'); return v.length ? `${med(v)} (${Math.min(...v)}-${Math.max(...v)})` : '-'; };

/* ---------- soak: wander for N minutes, heap after GC every 30 s ---------- */
async function soak(br) {
  const g = await openGame(br); await g.cdp.send('Emulation.setCPUThrottlingRate', { rate: o.rate }); const pts = [];
  await g.pg.evaluate(async () => { await toCity(62, 231, 9); window.__soak = (async () => { const rooms = ['cafe', 'bookstore', 'grocery', 'gym', 'deptstore', 'central_station', 'cinema']; let k = 0; while (!window.__soakStop) { try { await walkRoute(ROUTE, 50000); const id = rooms[k++ % rooms.length]; await G.go('int:' + id); await sleep(4000); await closeUi(); await G.go('city', { x: 62 + (k % 3) * 60, y: 231 }); await sleep(500); G.phone.open(); await sleep(2500); G.phone.close(); if (k % 3 === 0) { G.state.speed = 4; await walkRoute(ROUTE.slice().reverse(), 20000); G.state.speed = 1; } } catch (e) { window.__soakErr = String(e); await sleep(1000); } } })(); });
  const t0 = Date.now(); while (Date.now() - t0 < o.soak * 60000) { await g.pg.waitForTimeout(30000); const h = await g.heap(), st = await g.pg.evaluate(() => ({ scene: G.scene.id, ents: G.scene.ents.length, clock: G.now().clock, err: window.__soakErr || null })); pts.push({ s: Math.round((Date.now() - t0) / 1000), heapMB: h, ...st }); console.log(JSON.stringify(pts[pts.length - 1])); }
  await g.pg.evaluate(() => { window.__soakStop = true; }); const errors = g.errs.slice(0, 10); await g.ctx.close(); return { points: pts, errors };
}

/* ---------- verify: same pixels (engine test hooks) ---------- */
async function verify(br) {
  const g = await openGame(br); let ok = true; const line = (name, good, text) => { if (!good) ok = false; console.log((good ? 'ok   ' : 'FAIL ') + name.padEnd(34) + text); };
  const r = await g.pg.evaluate(async () => {
    const out = {}, R = G.renderer; await toCity(100, 231, 12); const w = G.world, N = w.objs.length;
    { let tested = 0, bad = []; for (let i = 0; i < N; i += 400) { const r = R.sliceCheck(w, i, 400); tested += r.tested; bad = bad.concat(r.bad); await sleep(0); } out.cityBands = { tested, bad }; }
    { let tested = 0, skipped = 0, bad = [], fell = []; for (let i = 0; i < N; i += 300) { const r = await R.workerCheck(w, i, 300); tested += r.tested; skipped += r.skipped; bad = bad.concat(r.bad); fell = fell.concat(r.fell); } out.cityWorker = { tested, skipped, bad, fell, worker: R.perf().worker }; }
    out.chunks = R.chunkCheck(w, -2, -2, 25, 25);
    out.chars = await R.charCheck(G.scene.ents);
    { let frames = 0, bad = 0, items = 0; const off = G.on('frame', () => { const c = R.sortCheck(); frames++; items += c.items; if (!c.same) bad++; }); await walkRoute(ROUTE, 6000); await toCity(189, 150, 12); try { await G.cityEvents.debug.start('blossom_parade'); await sleep(1200); G.cityEvents.debug.parade(); } catch (e) { } await closeUi(); await sleep(4000); off(); try { G.cityEvents.debug.stop(); } catch (e) { } out.sort = { frames, bad, avgItems: Math.round(items / Math.max(1, frames)) }; }
    out.rooms = {}; for (const id of ['cafe', 'deptstore', 'central_station', 'goods:fjord', 'museum', 'grocery']) { try { await G.go('int:' + id, { fade: false }); await sleep(300); const a = R.sliceCheck(G.world), c = R.chunkCheck(G.world, -1, -1, 6, 6), k = await R.workerCheck(G.world); out.rooms[id] = { tested: a.tested + c.tested + k.tested, bad: a.bad.concat(c.bad, k.bad) }; } catch (e) { out.rooms[id] = { tested: 0, bad: ['ERR ' + e.message] }; } }
    await G.go('city', { x: 100, y: 231, fade: false }); G.setSeason(3); await sleep(300); { const a = R.sliceCheck(G.world, 0, 1500), c = R.chunkCheck(G.world, 2, 10, 10, 18), k = await R.workerCheck(G.world, 0, 1500); out.winter = { tested: a.tested + c.tested + k.tested, bad: a.bad.concat(c.bad, k.bad) }; }
    return out; });
  line('city objects, bands vs whole', !r.cityBands.bad.length, `${r.cityBands.tested} sprites, ${r.cityBands.bad.length} differ ${r.cityBands.bad.slice(0, 3).join('; ')}`);
  line('city objects, worker vs main', !r.cityWorker.bad.length && r.cityWorker.worker === 'on', `${r.cityWorker.tested} sprites, ${r.cityWorker.bad.length} differ ${r.cityWorker.bad.slice(0, 3).join('; ')} (worker ${r.cityWorker.worker}; ${r.cityWorker.skipped} custom drawables stay on the main thread; ${r.cityWorker.fell.length} whose art throws fall back: ${r.cityWorker.fell.map(x => x.split('|')[0]).join(', ')})`);
  line('ground chunks, bands vs whole', !r.chunks.bad.length, `${r.chunks.tested} chunks, ${r.chunks.bad.length} differ`);
  line('citizen sprites, worker vs main', !r.chars.bad.length, `${r.chars.tested} sprites, ${r.chars.bad.length} differ`);
  line('draw order vs the old depth sort', !r.sort.bad, `${r.sort.frames} frames (about ${r.sort.avgItems} items each), ${r.sort.bad} differ`);
  for (const id in r.rooms) line('room ' + id, !r.rooms[id].bad.length, `${r.rooms[id].tested} checks, ${r.rooms[id].bad.length} differ ${r.rooms[id].bad.slice(0, 2).join('; ')}`);
  line('winter sample', !r.winter.bad.length, `${r.winter.tested} checks, ${r.winter.bad.length} differ`);
  line('page errors', !g.errs.length, String(g.errs.length) + ' ' + g.errs.slice(0, 3).join(' | '));
  await g.ctx.close(); return { ok, detail: r };
}

/* ---------- main ---------- */
const br = await chromium.launch(); const result = { when: new Date().toISOString(), rate: o.rate, dsf: o.dsf, runs: o.runs, label: o.label, html: o.html || '(current tree)', profile: o.profile, scenes: {} };
if (o.verify) {
  const v = await verify(br); result.verify = v; console.log(v.ok ? 'VERIFY OK: same pixels' : 'VERIFY FAILED'); if (!v.ok) process.exitCode = 1;
} else if (o.soak) {
  result.soak = await soak(br); const p = result.soak.points; console.log(`soak ${o.soak} min: heap ${p.map(x => x.heapMB).join(' ')} MB; page errors ${result.soak.errors.length}`, result.soak.errors);
} else {
  const ids = o.scenes === 'all' ? Object.keys(SCENES) : o.scenes.split(','); for (const id of ids) if (!SCENES[id]) { console.log('unknown scene ' + id + ' (have: ' + Object.keys(SCENES).join(', ') + ')'); process.exit(1); }
  for (const id of ids) { const runs = BUILDS.map(() => []); for (let i = 0; i < o.runs; i++) for (let bi = 0; bi < BUILDS.length; bi++) { const r = await runScene(br, id, bi); runs[bi].push(r); console.log(id, BUILDS.length > 1 ? BUILDS[bi].name : '', i + 1, JSON.stringify({ ...r, prof: undefined, eng: undefined })); if (r.eng) console.log('   engine:', JSON.stringify({ ...r.eng, slow: undefined }), r.eng.slow && r.eng.slow.length ? '\n   slow main-thread bakes: ' + r.eng.slow.slice(-10).join(' | ') : ''); }
    BUILDS.forEach((b, bi) => { result.scenes[BUILDS.length > 1 ? id + ' / ' + b.name : id] = { title: SCENES[id].title, build: b.name, runs: runs[bi] }; }); }
  const rows = ['| scene | fps | 1% low fps | worst ms | >50 ms /10 s | >100 ms | JS ms p50 / p95 / worst | heap MB start -> end | errors |', '|---|---|---|---|---|---|---|---|---|'];
  for (const id of Object.keys(result.scenes)) { const R = result.scenes[id].runs.filter(r => r && !r.error); if (!R.length) { rows.push(`| ${id} | FAILED: ${(result.scenes[id].runs[0] || {}).error} |`); continue; }
    rows.push(`| ${id} | ${spread(R, 'fps')} | ${spread(R, 'low1')} | ${spread(R, 'worst')} | ${spread(R, 'per10s50')} | ${spread(R, 'over100')} | ${med(R.map(r => r.jsP50))} / ${med(R.map(r => r.jsP95))} / ${spread(R, 'jsWorst')} | ${med(R.map(r => r.heap0))} -> ${med(R.map(r => r.heap1))} | ${R.reduce((n, r) => n + r.errors.length, 0)} |`); }
  const table = `Perf ${o.label || name}: CPU ${o.rate}x slower, dpr ${o.dsf}, 390x844, ${o.runs} run(s) per scene: median (min-max).\n\n` + rows.join('\n') + '\n';
  console.log('\n' + table); fs.writeFileSync(path.join(OUT, name + '.md'), table);
  if (o.profile) for (const id of Object.keys(result.scenes)) { const r = result.scenes[id].runs.find(r => r && r.prof); if (r) console.log(`\n== ${id}: busy ${r.prof.busyMs} ms; top self time ==\n` + r.prof.top.join('\n') + '\n-- browser calls by caller --\n' + r.prof.natives.join('\n') + `\n-- long frames only (JS > 40 ms; ${r.prof.hitchFrames} frames, ${r.prof.hitchMs} ms) --\n` + r.prof.hitchTop.join('\n') + '\n-- long frames by cause --\n' + r.prof.hitchCats.join('\n') + '\n-- worst frames --\n' + r.prof.worstFrames.join('\n')); }
}
fs.writeFileSync(path.join(OUT, name + '.json'), JSON.stringify(result, null, 1)); console.log('wrote out/perf/' + name + '.json');
await br.close(); srv.close();
