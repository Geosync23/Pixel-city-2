// Airport planes: is the motion smooth, and do the plane sounds fire when they should?   node tools/plane_check.mjs [--html path] [--nobuild] [--strip name] [--quick] [--sound]
//
// Headless Chromium on the built single file (dist/index.html, or --html for another build, e.g. a copy made before a change).
// LIVE (real time): starts landings / take-offs with G.planes (as the intro and the ambient schedule do), logs every animation frame
//   (on the game's own 'frame' event, i.e. after the frame was drawn): the flight (cx, alt), the entity position, the sprite anchor the renderer
//   draws at (renderer rounding: Math.round of WS), the camera (cam.x/y whole canvas px + cam.sx/sy, the CSS sub-pixel shift) and from those
//   the plane's ON-SCREEN position in CSS px. Cases: phone 390x844 (dpr 3) and 1280x720 ?debug (zoom 1, as the trailer), camera following
//   the plane (the intro) and camera still, game speed 1x / 2x / 4x.
//   Reported per case (frames while the plane moves): frames, mean frame ms, max frame ms, max on-screen jump per frame (CSS px), the number of
//   frames in which the plane did not move on screen ('still' frames: with a still camera; for a following camera: frames where the plane
//   jumped against the camera by 1+ canvas px and back = 'wobble'), and the RMS of the 2nd difference of the on-screen position (jerk;
//   a smooth glide is near 0).
// STRIP (--strip name): the game's clock is taken over (requestAnimationFrame driven by hand at exactly 60 fps) and the canvas around the plane
//   is grabbed every 2nd frame for 2 s around touchdown -> out/shots/<name>.png (rows of frames, left to right, top to bottom).
// SOUND (--sound): a landing in the page with sound unlocked: the game time of touchdown vs the time the screech fired, and the jet's gain over
//   the approach (G.planes.debug().jet); plus the three effects rendered offline (OfflineAudioContext with the game's own SFX functions):
//   duration, peak, RMS, spectral centroid, and the chime's two pitches. out/plane/report.json.
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module'; import { execFileSync } from 'node:child_process';
import { ROOT } from './artfiles.mjs'; import { encodePNG } from './png.mjs';
const require = createRequire(ROOT + '/'); const { chromium } = require('playwright');
const arg = k => process.argv.includes(k), opt = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
if (!arg('--nobuild') && !opt('--html')) execFileSync('node', [path.join(ROOT, 'tools/build.mjs')], { stdio: 'inherit' });
const HTML = fs.readFileSync(opt('--html') || path.join(ROOT, 'dist/index.html')), OUT = path.join(ROOT, 'out/plane'); fs.mkdirSync(OUT, { recursive: true });
const srv = http.createServer((q, r) => { r.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' }); r.end(HTML); }); await new Promise(r => srv.listen(0, r)); const URL0 = 'http://localhost:' + srv.address().port + '/';
const report = { when: new Date().toISOString(), html: opt('--html') || 'dist/index.html', cases: [] }; let errors = 0;

/* in the page before the game: requestAnimationFrame can be driven by hand (window.__man.step()) */
const INIT = () => {
  const raf = window.requestAnimationFrame.bind(window), M = window.__man = { on: false, q: [], t: 0 };
  window.requestAnimationFrame = cb => { if (M.on) { M.q.push(cb); return 0; } return raf(cb); };
  M.start = () => { M.on = true; M.t = performance.now(); };
  M.step = (ms = 1000 / 60) => { M.t += ms; const q = M.q; M.q = []; for (const cb of q) cb(M.t); };
};
const HELP = () => {
  window.sleep = ms => new Promise(r => setTimeout(r, ms));
  try { G.state.tips.off = 1; } catch (e) { }
  window.closeUi = async () => { for (let i = 0; i < 12; i++) { const s = document.querySelector('.say'); if (s) s.click(); const b = [...document.querySelectorAll('button')].find(b => /^(Got it|OK|Close)$/.test(b.textContent.trim()) && b.offsetParent); if (b) b.click(); await sleep(60); } };
  /* one frame's sample: everything the renderer uses to place the plane and its shadow */
  window.sampleOf = f => {
    const e = f.pool.e, s = f.pool.s, c = G.cam, k = G.cssScale, U = 16;
    const ax = Math.round((e.x - e.y) * U), ay = Math.round((e.x + e.y) * U / 2 - e.z * U), sx = Math.round((s.x - s.y) * U), sy = Math.round((s.x + s.y) * U / 2 - s.z * U);
    return { t: +G.time.toFixed(4), cx: +f.cx.toFixed(4), alt: +f.alt.toFixed(4), v: +f.v.toFixed(3), ph: f.phase, wx: +((e.x - e.y) * U).toFixed(3), wy: +((e.x + e.y) * U / 2 - e.z * U).toFixed(3), ax, ay, sx, sy,
      camx: c.x, camy: c.y, csx: c.sx || 0, csy: c.sy || 0, fx: +c.fx.toFixed(3), fy: +c.fy.toFixed(3),
      px: +((ax - c.x - (c.sx || 0)) * k).toFixed(3), py: +((ay - c.y - (c.sy || 0)) * k).toFixed(3), spx: +((sx - c.x - (c.sx || 0)) * k).toFixed(3), spy: +((sy - c.y - (c.sy || 0)) * k).toFixed(3), k, fade: +f.fade.toFixed(3) };
  };
  /* start a flight; cam: 'follow' (G.camTarget = the flight's camera target, as the intro) | 'still' (a fixed point at the touchdown) */
  window.startFlight = async (kind, cam, speed, zoom) => {
    G.planes.quiet = true; G.planes.clear(); G.state.speed = speed; G.cutscene = null;
    const AP = G.sceneCache.get('city').world.airport, A = AP.approach;
    if (zoom === 'min') G.setZoom(G.zmin);
    const f = kind === 'takeoff' ? G.planes.takeoffNow('airliner') : G.planes.landNow('airliner'); if (!f) return false;
    if (cam === 'follow') G.camTarget = f.cam; else G.camTarget = { x: kind === 'takeoff' ? AP.runways[0].b - 40 : A.touchdown + 6, y: A.c, z: A.z };
    G.player.hidden = true; G.snapCam(); window.__f = f; return true;
  };
};

async function page(vp) {
  const br = await chromium.launch(); const ctx = await br.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: vp.dpr, isMobile: !!vp.mobile, hasTouch: !!vp.mobile });
  const pg = await ctx.newPage(); pg.on('pageerror', e => { errors++; console.log('[page exception]', e.message); }); pg.on('console', m => { if (m.type() === 'error') { errors++; console.log('[page error]', m.text()); } });
  await pg.addInitScript(INIT); await pg.goto(URL0 + '?scene=city&x=330&y=60' + (vp.debug ? '&debug' : ''));
  await pg.waitForFunction(() => !document.getElementById('load') && window.G && G.scene && G.planes, null, { timeout: 60000 });
  await pg.evaluate(HELP); await pg.evaluate(() => closeUi()); await pg.evaluate(z => { if (z) G.setZoom(z); }, vp.zoom || 0);
  return { br, pg };
}


/* page-side: measure rendered samples. duration (above -40 dB of the peak), peak / RMS (dBFS), spectral centroid (FFT 4096, Hann), loudness over time (100 ms RMS),
   and the strongest pitch (300-2000 Hz, 1 Hz steps on a short window) at given times */
const MEASURE = () => {
  window.fft = (re, im) => { const n = re.length; for (let i = 1, j = 0; i < n; i++) { let b = n >> 1; for (; j & b; b >>= 1) j ^= b; j ^= b; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
    for (let len = 2; len <= n; len <<= 1) { const a = -2 * Math.PI / len, wr = Math.cos(a), wi = Math.sin(a); for (let i = 0; i < n; i += len) { let cr = 1, ci = 0; for (let k = 0; k < len / 2; k++) { const ur = re[i + k], ui = im[i + k], xr = re[i + k + len / 2] * cr - im[i + k + len / 2] * ci, xi = re[i + k + len / 2] * ci + im[i + k + len / 2] * cr; re[i + k] = ur + xr; im[i + k] = ui + xi; re[i + k + len / 2] = ur - xr; im[i + k + len / 2] = ui - xi; const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t; } } } };
  window.measure = (d, sr, pitchAt) => {
    let pk = 0, e = 0; for (let i = 0; i < d.length; i++) { const a = Math.abs(d[i]); if (a > pk) pk = a; e += d[i] * d[i]; }
    let first = -1, last = -1; for (let i = 0; i < d.length; i++) if (Math.abs(d[i]) > pk * .01) { if (first < 0) first = i; last = i; }
    const N = 4096, mag = new Float64Array(N / 2); for (let s = 0; s + N <= d.length; s += N / 2) { const re = new Float64Array(N), im = new Float64Array(N); for (let n = 0; n < N; n++) re[n] = d[s + n] * (.5 - .5 * Math.cos(2 * Math.PI * n / N)); fft(re, im); for (let k = 1; k < N / 2; k++) mag[k] += Math.hypot(re[k], im[k]); }
    let num = 0, den = 0; for (let k = 1; k < N / 2; k++) { num += k * sr / N * mag[k]; den += mag[k]; }
    const env = []; const W = Math.round(sr * .1); for (let s = 0; s + W <= d.length; s += W) { let q = 0; for (let i = s; i < s + W; i++) q += d[i] * d[i]; env.push(+(10 * Math.log10(q / W + 1e-12)).toFixed(1)); }
    const pitch = (a, b) => { const seg = d.subarray(Math.round(a * sr), Math.round(b * sr)); let bk = 0, bv = 0; for (let f = 300; f < 2000; f += 1) { let re = 0, im = 0; for (let n = 0; n < seg.length; n += 2) { const ph = 2 * Math.PI * f * n / sr; re += seg[n] * Math.cos(ph); im -= seg[n] * Math.sin(ph); } const v = re * re + im * im; if (v > bv) { bv = v; bk = f; } } return bk; };
    return { dur: first < 0 ? 0 : +((last - first) / sr).toFixed(3), start: +(first / sr).toFixed(3), peakDb: +(20 * Math.log10(pk || 1e-9)).toFixed(1), rmsDb: +(10 * Math.log10(e / d.length || 1e-12)).toFixed(1), clip: pk >= 1, centroidHz: den ? Math.round(num / den) : 0, env, pitches: pitchAt ? pitchAt.map(([a, b]) => pitch(a, b)) : undefined };
  };
};

/* -------- the listening page (docs/audio/plane_sounds.html) at 390x844: errors, sideways scroll, every button sounds, offline measurements -------- */
if (arg('--page')) {
  const PAGE = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>' + fs.readFileSync(path.join(ROOT, 'docs/audio/plane_sounds.html'), 'utf8') + '</body></html>';
  const s2 = http.createServer((q, r) => { r.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); r.end(PAGE); }); await new Promise(r => s2.listen(0, r));
  const br = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] }); const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }); const pg = await ctx.newPage();
  let perr = 0; pg.on('pageerror', e => { perr++; console.log('[page exception]', e.message); }); pg.on('console', m => { if (m.type() === 'error') { perr++; console.log('[page error]', m.text()); } });
  await pg.goto('http://localhost:' + s2.address().port + '/'); await pg.evaluate(MEASURE);
  const scroll = await pg.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  await pg.screenshot({ path: path.join(OUT, 'page_390.png'), fullPage: true });
  const keys = await pg.evaluate(() => [...document.querySelectorAll('button[data-k]')].map(b => b.getAttribute('data-k')));
  const liveRes = {};
  for (const k of keys) {
    await pg.tap(`button[data-k="${k}"]`);
    liveRes[k] = await pg.evaluate(async () => { const P = window.__plane, c = P.ctx, an = c.createAnalyser(); an.fftSize = 2048; P.bus.connect(an); const b = new Float32Array(2048); let pk = 0; for (let i = 0; i < 12; i++) { await new Promise(r => setTimeout(r, 50)); an.getFloatTimeDomainData(b); for (const x of b) pk = Math.max(pk, Math.abs(x)); } return { state: c.state, peakDb: +(20 * Math.log10(pk || 1e-9)).toFixed(1) }; });
  }
  await pg.tap('#stop');
  const SECS = { land: 12, far: 12, screech: 1, both: 5.5, chime: 2, landB: 12, screechB: 1, chimeB: 2.2 }, PIT = { chime: [[.03, .38], [.5, .9]], chimeB: [[.03, .44], [.56, 1]] }, off = {};
  for (const k of keys) off[k] = await pg.evaluate(async ([k, s, pa]) => { const r = await window.__plane.render(k, s); return Object.assign({ len: r.len }, measure(r.data, 48000, pa)); }, [k, SECS[k], PIT[k]]);
  // existing game effects for comparison: rendered with the same chain from the game's own SFX (the page does not have them: render the source here)
  console.log('listening page: sideways scroll', scroll.sw > scroll.cw ? 'YES (' + scroll.sw + ' > ' + scroll.cw + ')' : 'none', '| page errors', perr);
  for (const k of keys) { const o = off[k]; console.log('  ' + k.padEnd(9) + ' live ' + JSON.stringify(liveRes[k]) + ' | offline dur ' + o.dur + ' s, peak ' + o.peakDb + ' dBFS, rms ' + o.rmsDb + ', centroid ' + o.centroidHz + ' Hz' + (o.pitches ? ', pitches ' + o.pitches.join(' / ') + ' Hz' : '') + (o.clip ? ' CLIP' : '')); }
  for (const k of ['land', 'far', 'landB']) console.log('  ' + k + ' loudness every 0.5 s (dB): ' + off[k].env.filter((x, i) => i % 5 === 0).join(' '));
  report.page = { scroll, errors: perr, live: liveRes, offline: Object.fromEntries(Object.entries(off).map(([k, v]) => [k, Object.assign({}, v, { env: v.env.filter((x, i) => i % 5 === 0) })])) };
  errors += perr; await br.close(); s2.close();
}

/* -------- metrics -------- */
function metrics(S, cam) {
  const mv = []; for (let i = 1; i < S.length; i++) { const a = S[i - 1], b = S[i]; if (Math.abs(b.cx - a.cx) < 1e-6 || b.fade < 1 || a.fade < 1) continue; mv.push([a, b]); }
  const dts = mv.map(([a, b]) => (b.t - a.t) * 1000), jumps = [], still = [], d2 = [];
  let wob = 0;
  for (let i = 0; i < mv.length; i++) {
    const [a, b] = mv[i], dx = b.px - a.px, dy = b.py - a.py; jumps.push(Math.hypot(dx, dy));
    if (cam === 'still') { if (b.ax === a.ax && b.ay === a.ay) still.push(i); }
    if (i > 0) { const [p] = mv[i - 1]; const ddx = (b.px - a.px) - (a.px - p.px), ddy = (b.py - a.py) - (a.py - p.py); d2.push(ddx * ddx + ddy * ddy); if (cam === 'follow' && Math.hypot(ddx, ddy) >= a.k * .99 && Math.sign(b.px - a.px) !== Math.sign(a.px - p.px) && (b.px - a.px) !== 0 && (a.px - p.px) !== 0) wob++; }
  }
  const mean = a => a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0;
  // shadow vs plane: does the shadow keep its horizontal offset from the plane (no separate schedule)?
  let shadowSkew = 0; for (const [a, b] of mv) { const d = (b.spx - b.px) - (a.spx - a.px); if (Math.abs(d) > shadowSkew) shadowSkew = Math.abs(d); }
  return { frames: mv.length, frameMs: +mean(dts).toFixed(1), frameMsMax: +Math.max(0, ...dts).toFixed(1), slowFrames: dts.filter(d => d > 34).length, maxJumpPx: +Math.max(0, ...jumps).toFixed(2), meanJumpPx: +mean(jumps).toFixed(2), stillFrames: still.length, wobble: wob, jerkRms: +Math.sqrt(mean(d2)).toFixed(2), shadowSkewPx: +shadowSkew.toFixed(2) };
}

/* -------- LIVE -------- */
const VPS = [{ name: 'phone 390x844 dpr3', w: 390, h: 844, dpr: 3, mobile: true }, { name: 'desktop 1280x720 debug zoom1', w: 1280, h: 720, dpr: 1, debug: true, zoom: 1 }];
const CASES = arg('--quick') ? [['land', 'follow', 1], ['land', 'still', 1]] : [['land', 'follow', 1], ['land', 'still', 1], ['land', 'follow', 2], ['land', 'still', 4], ['takeoff', 'follow', 1], ['takeoff', 'still', 1]];
if (!arg('--noLive')) for (const vp of VPS) {
  const { br, pg } = await page(vp);
  for (const [kind, cam, speed] of CASES) {
    const ok = await pg.evaluate(a => startFlight(...a), [kind, cam, speed, vp.debug ? null : 'min']); if (!ok) { console.log('could not start', kind); continue; }
    const S = await pg.evaluate(async (lim) => { const out = []; const off = G.on('frame', () => { const f = window.__f; if (!f.done) out.push(sampleOf(f)); }); const t0 = performance.now(); while (!window.__f.done && performance.now() - t0 < lim) await sleep(100); off(); return out; }, kind === 'land' ? 16000 : 12000);
    const td = S.findIndex(s => s.ph === 'roll'); const m = metrics(S, cam), mApp = metrics(S.slice(0, Math.max(2, td)), cam), mRoll = metrics(S.slice(Math.max(0, td - 1)), cam);
    const row = { vp: vp.name, kind, cam, speed, all: m, air: kind === 'land' ? mApp : undefined, ground: kind === 'land' ? mRoll : undefined };
    report.cases.push(row); fs.writeFileSync(path.join(OUT, `frames_${vp.debug ? 'desk' : 'phone'}_${kind}_${cam}_${speed}x.json`), JSON.stringify(S));
    console.log(`${vp.name.padEnd(30)} ${kind.padEnd(7)} ${cam.padEnd(6)} ${speed}x  frames ${m.frames}  frame ${m.frameMs} ms (max ${m.frameMsMax}, >34ms: ${m.slowFrames})  jump max ${m.maxJumpPx} mean ${m.meanJumpPx} px  still ${m.stillFrames}  wobble ${m.wobble}  jerk ${m.jerkRms}  shadow skew ${m.shadowSkewPx}`);
  }
  await pg.evaluate(() => { G.state.speed = 1; G.camTarget = null; G.planes.clear(); });
  await br.close();
}

/* -------- STRIP: hand-driven frames at exactly 60 fps, the canvas around the plane every 2nd frame, 2 s around touchdown -------- */
const STRIP = opt('--strip');
if (STRIP) {
  const vp = VPS[0], { br, pg } = await page(vp);
  await pg.evaluate(() => startFlight('land', 'follow', 1, 'min'));
  await pg.evaluate(async () => { window.__man.start(); await sleep(150); window.__man.step(); });   // the frame already asked of the browser lands in the hand-driven queue
  // run to 1 s before touchdown
  const pre = await pg.evaluate(() => { const f = window.__f, A = G.sceneCache.get('city').world.airport.approach; let n = 0; while (f.cx - A.touchdown > f.v * 1.0 && n < 3000) { window.__man.step(); n++; } return n; });
  const shots = [], S = [];
  for (let i = 0; i < 120; i++) {
    const s = await pg.evaluate(() => { window.__man.step(); return sampleOf(window.__f); }); S.push(s);
    if (i % 2) continue;
    // the plane's screen box: around its anchor (CSS px), clipped to the viewport
    const cx = Math.round(s.px), cy = Math.round(s.py), w = 300, h = 170, x = Math.max(0, Math.min(vp.w - w, cx - w / 2)), y = Math.max(0, Math.min(vp.h - h, cy - 120));
    shots.push({ buf: await pg.screenshot({ clip: { x, y, width: w, height: h } }), x, y });
  }
  fs.writeFileSync(path.join(OUT, 'strip_' + STRIP + '.json'), JSON.stringify(S));
  // stitch: decode PNGs in the page (canvas) and lay them out 6 per row
  const data = await pg.evaluate(async (list) => {
    const imgs = await Promise.all(list.map(b64 => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = 'data:image/png;base64,' + b64; })));
    const w = imgs[0].width, h = imgs[0].height, per = 6, rows = Math.ceil(imgs.length / per), c = document.createElement('canvas'); c.width = w * per + (per - 1) * 4; c.height = h * rows + (rows - 1) * 4;
    const x = c.getContext('2d'); x.fillStyle = '#ff00ff'; x.fillRect(0, 0, c.width, c.height); imgs.forEach((im, i) => x.drawImage(im, (i % per) * (w + 4), Math.floor(i / per) * (h + 4)));
    return c.toDataURL('image/png').split(',')[1];
  }, shots.map(s => s.buf.toString('base64')));
  const dir = path.join(ROOT, 'out/shots'); fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, 'plane_' + STRIP + '_strip.png'), Buffer.from(data, 'base64'));
  const m = metrics(S, 'follow'); console.log('strip (hand-driven 60 fps, follow, phone):', JSON.stringify(m), '-> out/shots/plane_' + STRIP + '_strip.png', 'pre-steps', pre);
  report.strip = m;
  // the same hand-driven run with a still camera: the plane's anchor steps per frame
  await pg.evaluate(() => { startFlight('land', 'still', 1, 'min'); });
  const S2 = await pg.evaluate(() => { const out = []; for (let i = 0; i < 1200 && !window.__f.done; i++) { window.__man.step(); out.push(sampleOf(window.__f)); } return out; });
  const m2 = metrics(S2, 'still'); console.log('hand-driven 60 fps, still camera, phone:', JSON.stringify(m2)); report.stripStill = m2;
  const S3 = await pg.evaluate(() => { startFlight('land', 'follow', 1, 'min'); const out = []; for (let i = 0; i < 1200 && !window.__f.done; i++) { window.__man.step(); out.push(sampleOf(window.__f)); } return out; });
  const m3 = metrics(S3, 'follow'); console.log('hand-driven 60 fps, following camera, phone:', JSON.stringify(m3)); report.stripFollow = m3;
  fs.writeFileSync(path.join(OUT, 'hand_follow_' + STRIP + '.json'), JSON.stringify(S3)); fs.writeFileSync(path.join(OUT, 'hand_still_' + STRIP + '.json'), JSON.stringify(S2));
  await br.close();
}

/* -------- SOUND -------- */
if (arg('--sound')) {
  const vp = VPS[0], { br, pg } = await page(vp);
  await pg.touchscreen.tap(195, 400); await pg.waitForTimeout(400); await pg.evaluate(() => closeUi());
  await pg.evaluate(MEASURE);
  const live = await pg.evaluate(async () => {
    const info0 = G.audio.info(); if (!G.planes.debug) return { error: 'no G.planes.debug', info0 };
    const n0 = G.planes.debug().screech.length; await startFlight('land', 'follow', 1, 'min'); const f = window.__f, jet = []; let td = null;
    const off1 = G.on('plane:landed', fl => { if (fl === f) td = { t: +G.time.toFixed(4), flightT: +fl.t.toFixed(4) }; });
    const off2 = G.on('frame', () => { if (!f.done) jet.push({ t: +G.time.toFixed(3), cx: +f.cx.toFixed(1), alt: +f.alt.toFixed(2), ph: f.phase, g: f.jg === undefined ? null : +f.jg.toFixed(4) }); });
    const t0 = performance.now(); while (!f.done && performance.now() - t0 < 16000) await sleep(100); off1(); off2();
    // a still camera at the Arrivals curb (about 75 tiles away) and one downtown: the jet's level there
    const far = {}; for (const [nm, x, y] of [['curb', 321, 102.6], ['downtown', 212, 250]]) { G.planes.clear(); const g = G.planes.landNow('airliner'); G.camTarget = { x, y, z: 0 }; let mx = 0; const t1 = performance.now(); while (!g.done && performance.now() - t1 < 16000) { await sleep(50); mx = Math.max(mx, g.jg || 0); } far[nm] = +mx.toFixed(4); }
    G.camTarget = null;
    // pause: a landing with the game paused (G.modal) -> the jet level goes to 0
    G.planes.clear(); const p = G.planes.landNow('airliner'); G.camTarget = p.cam; await sleep(800); const before = p.jg; G.modal++; await sleep(300); const during = p.jg; G.modal--; G.planes.clear(); G.camTarget = null;
    return { info: G.audio.info(), td, screech: G.planes.debug().screech.slice(n0), jet, far, pause: { before, during } };
  });
  report.soundLive = Object.assign({}, live, { jet: live.jet && live.jet.filter((x, i) => i % 10 === 0) });
  console.log('live landing with sound: touchdown', JSON.stringify(live.td), '| screech', JSON.stringify(live.screech), '| sfxPlayed', live.info && live.info.sfxPlayed, 'audio errors', live.info && live.info.errors, live.info && live.info.lastError);
  if (live.jet) console.log('jet level, camera following (every 15th frame): ' + live.jet.filter((x, i) => i % 15 === 0).map(x => x.ph[0] + x.cx + ':' + x.g).join(' '));
  console.log('jet peak level heard from the Arrivals curb', live.far && live.far.curb, '| from downtown', live.far && live.far.downtown, '| pause: level before', live.pause && live.pause.before, 'while paused', live.pause && live.pause.during);
  // offline renders of the game's own effects (G.audio.debug.render: the SFX functions through bus 0.64 + the game's compressor)
  const off = await pg.evaluate(async () => {
    const out = {};
    for (const [name, dur] of [['tyre_screech', 1], ['seatbelt', 2], ['toast', 1.2], ['door_close', 1], ['train_chime', 2.6], ['notify', 1]]) {
      const c = new OfflineAudioContext(1, Math.round(48000 * dur), 48000); G.audio.debug.render(c, name); const b = await c.startRendering();
      out[name] = measure(b.getChannelData(0), 48000, name === 'seatbelt' ? [[.08, .43], [.55, .95]] : null); delete out[name].env;
    }
    return out;
  });
  report.soundOffline = off; console.log('offline renders (game code):'); for (const k in off) console.log('  ' + k.padEnd(13) + JSON.stringify(off[k]));
  await br.close();
}
fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 1));
console.log('page errors:', errors); srv.close(); process.exit(errors ? 1 : 0);
