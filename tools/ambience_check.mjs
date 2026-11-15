// Recorded city ambience: the checks nobody can do by ear.   node tools/ambience_check.mjs [--nobuild] [--quick] [--only live|render|broken] [--scenes city:night,park:day:rain]   (--scenes: which scenes to render)
//
// Headless Chromium (phone viewport, touch) on the built single file (dist/index.html):
//   LIVE   walks the player through every place type, the times of day, weather, rooms; asserts: no AudioContext before the first touch, the
//          expected scene and exactly the expected recordings run, no long-lived noise-buffer source anywhere, scene changes are crossfades
//          (summed power stays near one bed), stretch-to-stretch crossfades happen, mute / the City sound slider stop the sources, the bus level
//          stays in range, frames while every stretch is being decoded are no slower than frames without decoding, zero page errors.
//   BROKEN the same page with every recording corrupted: the game must run, silent, with zero page errors.
//   RENDER the real mixer code (src/sim/_audio_bed.js, taken from the page) rendered offline for 3 minutes per scene with an
//          OfflineAudioContext -> out/ambience/<scene>.wav, then measured: loudness over time (EBU R128 via ffmpeg), true peak / clipping,
//          and whether any 10-second window comes again inside the 3 minutes (waveform cross-correlation, a tempo-tolerant envelope
//          correlation, and the mixer's own log of which second of which recording played when).
// Results: printed, and out/ambience/report.json. Exit code 1 if an assertion fails.
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module'; import { execFileSync, spawnSync } from 'node:child_process';
import { ROOT } from './artfiles.mjs';
const require = createRequire(ROOT + '/'); const { chromium } = require('playwright');
const arg = k => process.argv.includes(k), opt = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const QUICK = arg('--quick'), ONLY = opt('--only'), OUT = path.join(ROOT, 'out/ambience'); fs.mkdirSync(OUT, { recursive: true });
if (!arg('--nobuild')) execFileSync('node', [path.join(ROOT, 'tools/build.mjs')], { stdio: 'inherit' });
const HTML = fs.readFileSync(path.join(ROOT, 'dist/index.html')), SAVE = fs.readFileSync(path.join(ROOT, 'tools/perf_save.json'), 'utf8');
const srv = http.createServer((q, r) => { r.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' }); r.end(HTML); }); await new Promise(r => srv.listen(0, r)); const URL0 = 'http://localhost:' + srv.address().port + '/';
const results = [], fails = []; const check = (name, ok, detail = '') => { results.push({ name, ok: !!ok, detail }); if (!ok) fails.push(name); console.log((ok ? '  ok   ' : '  FAIL ') + name + (detail ? '  [' + detail + ']' : '')); };
const report = { when: new Date().toISOString(), checks: results, live: {}, render: {} };

/* in the page before the game: count AudioContexts, track every started buffer source, record frame times */
const INIT = () => {
  const M = window.__amb = { ctxMade: 0, srcs: new Set(), frames: [], rec: false, cur: -1 };
  for (const K of ['AudioContext', 'webkitAudioContext']) { const C = window[K]; if (C) window[K] = new Proxy(C, { construct(t, a) { M.ctxMade++; return new t(...a); } }); }
  const st = AudioBufferSourceNode.prototype.start;
  AudioBufferSourceNode.prototype.start = function (...a) { const r = { node: this, t: performance.now(), dur: this.buffer ? this.buffer.duration : 0 }; M.srcs.add(r); this.addEventListener('ended', () => M.srcs.delete(r)); return st.apply(this, a); };
  M.live = () => { const now = performance.now(); return [...M.srcs].map(r => ({ dur: +r.dur.toFixed(2), age: +((now - r.t) / 1000).toFixed(1), loop: r.node.loop })); };
  /* the game's noise buffers are exactly 3 s long (src/sim/_audio_lib.js makeBuffers); one-shot effects use them for a moment, a noise BED would hold one for long */
  M.noise = () => M.live().filter(s => Math.abs(s.dur - 3) < .05 && s.age > 5);
  const raf = window.requestAnimationFrame.bind(window); window.requestAnimationFrame = cb => raf(t => { if (t !== M.cur) { if (M.rec && M.cur >= 0) M.frames.push([Math.round(performance.now()), +(t - M.cur).toFixed(1)]); M.cur = t; } cb(t); });
};
const HELP = () => {
  window.sleep = ms => new Promise(r => setTimeout(r, ms));
  try { G.state.tips.off = 1; } catch (e) { } try { G.dev.set(true); G.state.dev.needs = true; G.state.dev.money = true; } catch (e) { }
  window.closeUi = async () => { for (let i = 0; i < 20; i++) { const s = document.querySelector('.say'); if (s) s.click(); const b = [...document.querySelectorAll('button')].find(b => /^Got it$/.test(b.textContent.trim()) && b.offsetParent); if (b) b.click(); const x = document.querySelector('.modal .x'); if (x) x.click(); if (!s && !b && !x) break; await sleep(80); } };
  window.setHour = h => { const d = Math.floor(G.state.t / 1440); G.state.t = d * 1440 + h * 60; G.advance(1); };
  window.toCity = async (x, y, hour) => { if (hour !== undefined) setHour(hour); await G.go('city', { x, y, fade: false }); await sleep(300); try { G.weather.setWeather('clear', 12); } catch (e) { } await closeUi(); };   /* the game's own weather (morning fog...) would change the scene under test */
  const D = () => G.audio.debug, K = () => G.audio.debug.kit();
  /* a standing spot per place type: the middle of a sidewalk of that district, the market stalls, the pier */
  window.spots = () => { const W = G.sceneCache.get('city').world, o = {}, by = {};
    for (const k of W.walkways) if (k.kind === 'sidewalk' && k.district) (by[k.district] = by[k.district] || []).push(k);
    const mid = k => [(k.x0 + k.x1) / 2, (k.y0 + k.y1) / 2];
    for (const [place, ds] of [['town', ['oldtown', 'arts']], ['city', ['downtown']], ['suburb', ['maplewood', 'hillcrest']], ['industrial', ['railyard']], ['park', ['park']], ['harbor', ['harbor']], ['airport', ['airport']]]) {
      const L = [].concat(...ds.map(d => by[d] || [])); for (let i = 0; i < L.length; i++) { const p = mid(L[(i * 7 + (L.length >> 1)) % L.length]); if (W.isBlocked && W.isBlocked(p[0], p[1])) continue; o[place] = p; break; }
      if (!o[place]) { let n = 0, sx = 0, sy = 0; for (let y = 2; y < W.h; y += 3) for (let x = 2; x < W.w; x += 3) if (ds.includes(W.districtAt(x, y)) && !W.isBlocked(x, y)) { n++; sx += x; sy += y; } if (n) { let best = null, bd = 1e9; for (let y = 2; y < W.h; y += 1) for (let x = 2; x < W.w; x += 1) if (ds.includes(W.districtAt(x, y)) && !W.isBlocked(x, y)) { const d = (x - sx / n) ** 2 + (y - sy / n) ** 2; if (d < bd) { bd = d; best = [x, y]; } } o[place] = best; } }
    }
    const m = W.pois.find(p => p.type === 'stall' && /market/.test(p.venue || '')); if (m) o.market = [m.x + 1, m.y + 2];
    const pier = W.walkways.find(k => k.kind === 'pier') || W.walkways.find(k => k.kind === 'boardwalk'); if (pier) o.waterfront = mid(pier);
    return o; };
  /* wait until the bed has settled on what it should play: nothing decoding, nothing fading out */
  window.settle = async (ms = 9000) => { const t0 = performance.now(); await sleep(1100); while (performance.now() - t0 < ms) { const s = D().ambience(); if (!s.decoding.length && !s.fadingOut.length && !s.tracks.some(t => t.voices.some(v => v.fadingOut)) && s.tracks.every(t => t.drifting || t.voices.length)) break; await sleep(150); } return snap(); };
  window.snap = () => { const s = D().ambience(), want = s.want ? K().sceneFor(s.want) : null; return { s, expect: want ? { key: want.key + (G.onTitle ? '~title' : ''), master: want.master, tracks: want.tracks.map(t => ({ id: t.id, pool: K().mixer.pool(t.pool), drifting: !!t.on, db: t.db, lp: t.lp })) } : null, noise: __amb.noise(), live: __amb.live(), layers: G.audio.info().layers, errors: G.audio.info().errors, lastError: G.audio.info().lastError }; };
  /* bus level over `ms`: mean and max of the 40 ms RMS, peak */
  window.level = async (ms = 2000) => { const r = []; let pk = -200; const t0 = performance.now(); while (performance.now() - t0 < ms) { const m = D().meter(); r.push(m.rms); pk = Math.max(pk, m.peak); await sleep(50); } const lin = r.map(x => Math.pow(10, x / 10)); return { mean: +(10 * Math.log10(lin.reduce((a, b) => a + b, 0) / lin.length + 1e-20)).toFixed(1), max: Math.max(...r), min: Math.min(...r), peak: pk }; };
  /* summed power of every voice (track gain x fades, squared), relative to one stretch at 0 dB */
  window.power = () => { const s = D().ambience(); let p = 0; for (const t of s.tracks.concat(s.fadingOut)) for (const v of t.voices) p += (t.gain * v.g) ** 2; return p * s.master * s.master; };
};

async function openGame(br, extraInit) {
  const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true }), pg = await ctx.newPage(), errs = [];
  pg.on('pageerror', e => errs.push(e.message.slice(0, 300))); await pg.addInitScript(INIT); if (extraInit) await pg.addInitScript(extraInit);
  await pg.goto(URL0); await pg.evaluate(s => localStorage.setItem('maplebay.save.v1', s), SAVE);
  const t0 = Date.now(); await pg.goto(URL0); await pg.waitForFunction(() => window.G && G.onTitle !== undefined && !document.getElementById('load'), null, { timeout: 180000 }); const loadMs = Date.now() - t0; await pg.waitForTimeout(800);
  return { ctx, pg, errs, loadMs };
}
async function startGame(g) { await g.pg.touchscreen.tap(195, 440); await g.pg.waitForFunction(() => !G.onTitle && G.scene, null, { timeout: 60000 }); await g.pg.waitForTimeout(1500); await g.pg.evaluate(HELP); await g.pg.evaluate(() => closeUi()); }

/* the scene checks shared by every stop */
function judge(label, r, want, indoors) {
  const s = r.s, e = r.expect, ids = e ? e.tracks.map(t => t.id) : [];
  check(label + ': scene', e && s.scene === e.key && (!want || s.scene === want), `${s.scene}${want && s.scene !== want ? ' (wanted ' + want + ')' : ''}`);
  let ok = !!e, detail = [];
  if (e) for (const t of e.tracks) { const live = s.tracks.find(x => x.id === t.id), n = live ? live.voices.filter(v => !v.fadingOut).length : -1;
    if (!live || (t.drifting ? n > 1 : n !== 1) || live.voices.some(v => !t.pool.includes(v.name))) ok = false; detail.push(t.id + '=' + (live ? live.voices.map(v => v.name).join('+') || (t.drifting ? '(resting)' : 'NONE') : 'MISSING')); }
  const extra = s.tracks.filter(t => !ids.includes(t.id)).map(t => t.id); if (extra.length || s.fadingOut.length) ok = false;
  const stretchSrc = r.live.filter(x => x.dur > 20).length;
  check(label + ': exactly the expected recordings run', ok && stretchSrc === s.sources, detail.join(' ') + (extra.length ? ' EXTRA ' + extra : '') + ` | ${s.sources} sources, ${stretchSrc} long buffer sources alive`);
  if (indoors) check(label + ': the old indoor tones are untouched', r.layers.length > 0 && r.s.sources === 0, `old layers [${r.layers}], recorded sources ${r.s.sources}`);
  else check(label + ': no noise-buffer source, no noise layer', r.noise.length === 0 && r.layers.length === 0, `noise sources ${r.noise.length}, legacy layers [${r.layers}]`);
  return ok;
}

async function live(br) {
  console.log('\nLIVE: the game, by touch'); const g = await openGame(br), pg = g.pg, R = report.live;
  const pre = await pg.evaluate(() => ({ made: __amb.ctxMade, info: G.audio.info(), blocks: document.querySelectorAll('script[id^="amb-"]').length })); await pg.waitForTimeout(1500);
  check('no AudioContext before the first touch', pre.made === 0 && pre.info.state === 'none' && !pre.info.unlocked, `contexts made ${pre.made}, state ${pre.info.state}`);
  check('the recordings are in the page as inert blocks', pre.blocks >= 15, pre.blocks + ' blocks, page load to title ' + g.loadMs + ' ms');
  await startGame(g);
  const st = await pg.evaluate(() => ({ made: __amb.ctxMade, info: G.audio.info() })); check('audio starts on the first touch', st.made >= 1 && st.info.unlocked && st.info.state === 'running', `contexts made ${st.made}, state ${st.info.state}, sample rate ${st.info.sampleRate}`);
  const spots = await pg.evaluate(() => spots()); R.spots = spots; R.places = {};
  const PL = ['town', 'city', 'suburb', 'industrial', 'park', 'harbor', 'waterfront', 'market', 'airport']; check('a standing spot for every place type', PL.every(p => spots[p]), PL.filter(p => !spots[p]).join(',') || PL.map(p => p + '@' + spots[p].map(Math.round)).join(' '));
  await pg.evaluate(async ([x, y]) => { await toCity(x, y, 12); await sleep(11500); }, spots.town);   /* the save starts at home: give the old room tone its 10 s to be let go */
  /* 1. every place by day */
  for (const p of PL) { if (!spots[p]) continue; const r = await pg.evaluate(async ([x, y]) => { await toCity(x, y, 12); const r = await settle(); r.level = await level(1500); return r; }, spots[p]); judge(p + ' day', r, p + '_day'); R.places[p + '_day'] = { tracks: r.s.tracks.map(t => ({ id: t.id, db: t.db, lp: t.lp, voices: t.voices.map(v => v.name) })), level: r.level, busGain: r.s.busGain, decodeMs: r.s.decodeMs }; }
  /* 2. times of day */
  for (const [p, h, ph] of QUICK ? [['city', 23.5, 'night']] : [['city', 6.5, 'dawn'], ['city', 17.8, 'evening'], ['city', 23.5, 'night'], ['suburb', 6.5, 'dawn'], ['suburb', 17.8, 'evening'], ['suburb', 23.5, 'night'], ['park', 17.8, 'evening'], ['park', 23.5, 'night'], ['harbor', 23.5, 'night'], ['town', 23.5, 'night'], ['airport', 23.5, 'night']]) {
    const r = await pg.evaluate(async ([x, y, h]) => { await toCity(x, y, h); const r = await settle(); r.level = await level(1500); return r; }, [...spots[p], h]); judge(p + ' ' + ph, r, p + '_' + ph); R.places[p + '_' + ph] = { tracks: r.s.tracks.map(t => ({ id: t.id, db: t.db, lp: t.lp, voices: t.voices.map(v => v.name) })), level: r.level }; }
  /* 3. weather: the dry bed steps back, nothing hisses */
  for (const [w, m] of [['rain', .5], ['storm', .4], ['snow', .55]]) { const r = await pg.evaluate(async ([x, y, w]) => { await toCity(x, y, 12); await sleep(400); G.weather.setWeather(w, 6); await sleep(2500); const r = await settle(); r.level = await level(1500); return r; }, [...spots.city, w]);
    judge('city day, ' + w, r, 'city_day+' + w); check('city day, ' + w + ': bed steps back', Math.abs(r.s.master - m) < .01, 'master x' + r.s.master + ', level ' + r.level.mean + ' dBFS'); R.places['city_day+' + w] = { level: r.level }; }
  await pg.evaluate(async () => { G.weather.setWeather('clear', 6); await sleep(1500); });
  /* 4. a scene change is a crossfade: town -> city, sampled every 100 ms. Power = sum over voices of (track gain x fade)^2 */
  { const r = await pg.evaluate(async ([a, b]) => { await toCity(a[0], a[1], 12); await settle(); const before = power(), l0 = await level(1500); const out = []; const pr = G.go('city', { x: b[0], y: b[1], fade: false }); const t0 = performance.now(); let maxSrc = 0; while (performance.now() - t0 < 4500) { const s = G.audio.debug.ambience(); maxSrc = Math.max(maxSrc, s.sources); out.push([Math.round(performance.now() - t0), +power().toFixed(3), G.audio.debug.meter().rms]); await sleep(100); } await pr; const end = await settle(); return { before, after: power(), l0, l1: await level(1500), out, maxSrc, end }; }, [spots.town, spots.city]);
    const ps = r.out.map(o => o[1]), top = Math.max(...ps), low = Math.min(...ps), ref = Math.max(r.before, r.after), silent = r.out.filter(o => o[2] < -90).length;
    judge('after walking town -> city', r.end, 'city_day');
    check('town -> city is a crossfade, never two full beds', top <= ref * 1.35 && low >= Math.min(r.before, r.after) * .45 && silent === 0, `power before ${r.before.toFixed(2)}, after ${r.after.toFixed(2)}, during ${low.toFixed(2)}..${top.toFixed(2)}; bus ${r.l0.mean} -> ${r.l1.mean} dBFS; most sources at once ${r.maxSrc}; silent samples ${silent}`); R.transition = { before: r.before, after: r.after, min: low, max: top, samples: r.out }; }
  /* 5. indoors */
  for (const [room, kind] of [['cafe', 'cafe'], ['grocery', 'store'], ['gym', 'gym'], ['bookstore', 'library']]) {
    const r = await pg.evaluate(async id => { await toCity(...spots().town, 12); await settle(); try { await G.go('int:' + id, { fade: false }); } catch (e) { return { err: String(e) }; } await sleep(600); await closeUi(); const r = await settle(); r.level = await level(1200); r.indoor = !!G.scene.indoor; r.prof = G.audio.info().profile; return r; }, room);
    if (r.err || !r.indoor) { check('indoors ' + room, false, r.err || 'not an interior'); continue; }
    judge('indoors ' + room + ' (' + r.prof + ')', r, null, true); check('indoors ' + room + ': room type ' + kind, r.s.scene.startsWith('in:' + kind + '@'), r.s.scene + ', level ' + r.level.mean + ' dBFS, tracks ' + r.s.tracks.map(t => t.id + ' ' + t.db + ' dB lp ' + t.lp).join('; ')); R.places['in:' + kind] = { scene: r.s.scene, level: r.level, tracks: r.s.tracks.map(t => ({ id: t.id, db: t.db, lp: t.lp })) };
  }
  { const r = await pg.evaluate(async () => { await toCity(...spots().town, 12); await settle(); const before = __amb.noise().length; await sleep(11500); return { noise: __amb.noise().length, before, s: G.audio.debug.ambience() }; }); check('back outdoors: the indoor tones stop, the recordings return', r.noise === 0 && r.s.sources >= 1 && r.s.scene === 'town_day', `noise sources ${r.noise}, scene ${r.s.scene}, ${r.s.sources} recorded sources`); }
  await pg.evaluate(async () => { await toCity(...spots().city, 12); await settle(); });
  /* 6. mute and the City sound slider */
  { const r = await pg.evaluate(async () => { const o = {}; G.audio.setVolume('master', 0); await sleep(4200); o.muted = { sources: G.audio.debug.ambience().sources, live: __amb.live().filter(x => x.dur > 20).length, m: G.audio.debug.meter() }; G.audio.setVolume('master', .8); o.back = (await settle()).s.sources; G.audio.setVolume('city', 0); await sleep(4200); o.city0 = { sources: G.audio.debug.ambience().sources, m: G.audio.debug.meter() }; G.audio.setVolume('city', .35); await settle(); const a = await level(1500); G.audio.setVolume('city', .7); await sleep(600); const b = await level(1500); o.half = a.mean; o.full = b.mean; o.saved = G.state.audio.city; return o; });
    check('mute stops the recordings', r.muted.sources === 0 && r.muted.live === 0 && r.muted.m.rms <= -150, `sources ${r.muted.sources}, bus ${r.muted.m.rms} dBFS; unmuted -> ${r.back} sources`);
    check('City sound slider at 0 stops them; it is saved with the game', r.city0.sources === 0 && r.city0.m.rms <= -150 && r.saved === .7, `at 0: ${r.city0.sources} sources; at 35 %: ${r.half} dBFS, at 70 %: ${r.full} dBFS; state.audio.city ${r.saved}`); R.slider = r; }
  /* 7. stretch-to-stretch crossfades while standing still (city, day) */
  { const secs = QUICK ? 50 : 100, r = await pg.evaluate(async secs => { const s0 = G.audio.debug.ambience(), seen = new Set(), out = []; let maxV = 0, pmax = 0, pmin = 9; const t0 = performance.now(); while (performance.now() - t0 < secs * 1000) { const s = G.audio.debug.ambience(), b = s.tracks.find(t => t.id === 'busy'); if (b) { for (const v of b.voices) seen.add(v.name); maxV = Math.max(maxV, b.voices.length); const p = b.voices.reduce((a, v) => a + v.g * v.g, 0), names = new Set(b.voices.map(v => v.name)); if (names.size > 1 && names.size === b.voices.length) { pmax = Math.max(pmax, p); pmin = Math.min(pmin, p); }   /* (a loop hand-over of the same stretch is a short linear fade of identical material: not counted here) */ } await sleep(200); } const s1 = G.audio.debug.ambience(); return { x0: s0.crossfades, x1: s1.crossfades, seen: [...seen], maxV, pmax, pmin, noise: __amb.noise().length, buffers: s1.buffers, freed: s1.freed, log: G.audio.debug.kit().mixer.stats.log.slice(-12), lvl: await level(3000) }; }, secs);
    check(`crossfades to another stretch happen (${secs} s standing downtown)`, r.x1 > r.x0 && r.seen.length >= 2 && r.maxV <= 3, `${r.x1 - r.x0} crossfades, stretches heard: ${r.seen.join(', ')}; at most ${r.maxV} voices on the track`);
    check('stretch crossfades are equal power', r.pmax <= 1.2 && r.pmin >= .8, `summed fade power during crossfades ${r.pmin.toFixed(2)}..${r.pmax.toFixed(2)} (1 = one stretch)`);
    check('buffers are let go', r.buffers.length <= 5, `held now: ${r.buffers.join(', ')}; freed so far: ${r.freed}`);
    check('bus level in range', r.lvl.mean > -50 && r.lvl.mean < -18 && r.lvl.peak < -6, `city day at default sliders: mean ${r.lvl.mean} dBFS, 40 ms RMS ${r.lvl.min}..${r.lvl.max}, peak ${r.lvl.peak} dBFS`); R.xfade = r; }
  /* 8. does decoding cost frames? Stand still. Three rounds of: 10 s without decoding, then every stretch auditioned 0.7 s apart (each a fresh unpack + decode) */
  { const r = await pg.evaluate(async () => { const names = G.audio.debug.stretches().map(s => s.name), M = __amb, mx = G.audio.debug.kit().mixer, rounds = [], heard = new Set(); let decodeMs = [];
      const q = (a, p) => { const s = a.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(s.length * p))]; }, sum = a => ({ n: a.length, p50: q(a, .5), p99: q(a, .99), max: Math.max(...a), over100: a.filter(x => x > 100).length });
      for (let k = 0; k < 3; k++) { await sleep(1500); M.frames = []; M.rec = true; await sleep(10000); M.rec = false; const base = M.frames.map(f => f[1]); const d0 = mx.stats.decodes; M.frames = []; M.rec = true; const tA = performance.now();
        for (const n of names) { G.audio.debug.audition(n); await sleep(700); const a = G.audio.debug.ambience(); if (a.tracks.some(t => t.voices.some(v => v.name === n && !v.fadingOut))) heard.add(n); } await sleep(1500); M.rec = false; const dec = M.frames.slice(), tB = performance.now(); G.audio.debug.release();
        const log = mx.stats.decodeLog.filter(d => d.t1 >= tA && d.t0 <= tB); decodeMs = decodeMs.concat(log.map(d => d.t1 - d.t0));
        rounds.push({ decodes: mx.stats.decodes - d0, base: sum(base), dec: sum(dec.map(f => f[1])), slowInDecode: dec.filter(f => f[1] > 100 && log.some(d => f[0] >= d.t0 && f[0] - f[1] <= d.t1)).map(f => f[1]) }); }
      return { names: names.length, heard: [...heard], failed: mx.stats.failed, decodeMs, unpackMs: G.audio.debug.ambience().unpackMs, rounds }; });
    const dm = r.decodeMs.slice().sort((a, b) => a - b), bad = r.rounds.filter(x => x.slowInDecode.length > x.base.over100).length;
    check('every stretch decodes and plays within 0.7 s of being asked for', r.heard.length === r.names && r.failed.length === 0, `${r.heard.length} of ${r.names} playing, ${r.decodeMs.length} fresh decodes in 3 rounds, failed [${r.failed}]; unpack + decode took ${dm[0]}..${dm[dm.length - 1]} ms each (median ${dm[dm.length >> 1]}), off the main thread; base64 unpack on the main thread ${Math.min(...r.unpackMs)}..${Math.max(...r.unpackMs)} ms`);
    check('no frame over 100 ms caused by decoding (at most one of three rounds may show one)', bad <= 1, r.rounds.map((x, i) => `round ${i + 1}: ${x.decodes} decodes, ${x.dec.n} frames, median ${x.dec.p50} ms, p99 ${x.dec.p99}, worst ${x.dec.max}, over 100 ms during a decode: ${x.slowInDecode.length} | no decoding: ${x.base.n} frames, p99 ${x.base.p99}, worst ${x.base.max}, over 100 ms: ${x.base.over100}`).join(' || ')); R.frames = r; }
  const end = await pg.evaluate(async () => { await sleep(3000); return { info: G.audio.info(), amb: G.audio.debug.ambience() }; });
  check('audio system reports no errors', end.info.errors === 0, `errors ${end.info.errors} ${end.info.lastError || ''}`);
  check('zero page errors (live)', g.errs.length === 0, g.errs.slice(0, 3).join(' | ')); await g.ctx.close();
}

async function broken(br) {
  console.log('\nBROKEN: every recording corrupted'); const g = await openGame(br, () => { document.addEventListener('DOMContentLoaded', () => { for (const n of document.querySelectorAll('script[id^="amb-"]')) n.textContent = n.id.endsWith('a') ? '!!not base64!!' : 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'; }); });
  await startGame(g); const r = await g.pg.evaluate(async () => { const s = spots(), f0 = __amb.cur; await toCity(...s.city, 12); await sleep(5000); await toCity(...s.park, 12); await sleep(4000); const a = G.audio.debug.ambience(); return { scene: a.scene, sources: a.sources, failed: a.failed, sfx: G.audio.sfx('click'), info: G.audio.info(), moved: __amb.cur !== f0 }; });
  check('a failed decode fails silent', r.sources === 0 && r.failed.length >= 3 && r.moved && r.info.errors === 0, `scene ${r.scene}, sources ${r.sources}, gave up on [${r.failed}], effects still play: ${r.sfx}`);
  check('zero page errors (broken recordings)', g.errs.length === 0, g.errs.slice(0, 3).join(' | ')); await g.ctx.close();
}

/* ---------- offline render + measurements ---------- */
function wav(file, f32, sr) { const n = f32.length, b = Buffer.alloc(44 + n * 2); b.write('RIFF', 0); b.writeUInt32LE(36 + n * 2, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(sr, 24); b.writeUInt32LE(sr * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(n * 2, 40); for (let i = 0; i < n; i++) b.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(f32[i] * 32767))), 44 + i * 2); fs.writeFileSync(file, b); }
function r128(file) { const r = spawnSync('ffmpeg', ['-nostdin', '-hide_banner', '-nostats', '-i', file, '-af', 'ebur128=peak=true', '-f', 'null', '-'], { encoding: 'utf8', maxBuffer: 1 << 28 }).stderr, st = [], mo = [];
  for (const m of r.matchAll(/t:\s*([\d.]+)\s+TARGET.*?M:\s*(-?[\d.]+)\s+S:\s*(-?[\d.]+)/g)) if (+m[1] >= 3.05) { st.push(+m[3]); mo.push(+m[2]); }
  const g = k => { const m = [...r.matchAll(new RegExp(k + ':\\s+(-?[\\d.]+)', 'g'))]; return m.length ? +m[m.length - 1][1] : null; }; return { I: g('I'), LRA: g('LRA'), truePeak: g('Peak'), stMin: Math.min(...st), stMax: Math.max(...st), mMax: Math.max(...mo), st }; }
function fft(re, im, inv) { const n = re.length; for (let i = 1, j = 0; i < n; i++) { let b = n >> 1; for (; j & b; b >>= 1) j ^= b; j ^= b; if (i < j) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; } }
  for (let len = 2; len <= n; len <<= 1) { const a = (inv ? 2 : -2) * Math.PI / len, wr = Math.cos(a), wi = Math.sin(a); for (let i = 0; i < n; i += len) { let cr = 1, ci = 0; for (let k = 0; k < len / 2; k++) { const x = i + k, y = x + len / 2, tr = re[y] * cr - im[y] * ci, ti = re[y] * ci + im[y] * cr; re[y] = re[x] - tr; im[y] = im[x] - ti; re[x] += tr; im[x] += ti; const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t; } } }
  if (inv) for (let i = 0; i < n; i++) { re[i] /= n; im[i] /= n; } }
/** for every window of `win` samples (step `hop`): the highest normalised correlation with any other place at least `guard` samples away. x: Float64Array (zero mean) */
function repeats(x, win, hop, guard) {
  const n = x.length; let N = 1; while (N < n + win) N <<= 1; const Xr = new Float64Array(N), Xi = new Float64Array(N); Xr.set(x); fft(Xr, Xi, false);
  const cum = new Float64Array(n + 1); for (let i = 0; i < n; i++) cum[i + 1] = cum[i] + x[i] * x[i]; let best = { r: 0 };
  for (let s = 0; s + win <= n; s += hop) { const Wr = new Float64Array(N), Wi = new Float64Array(N); for (let i = 0; i < win; i++) Wr[i] = x[s + i]; fft(Wr, Wi, false);
    for (let i = 0; i < N; i++) { const a = Xr[i], b = Xi[i], c = Wr[i], d = -Wi[i]; Wr[i] = a * c - b * d; Wi[i] = a * d + b * c; } fft(Wr, Wi, true);
    const ew = cum[s + win] - cum[s]; if (ew <= 0) continue;
    for (let l = 0; l + win <= n; l++) { if (Math.abs(l - s) < guard) continue; const e = cum[l + win] - cum[l]; if (e <= ew * 1e-3) continue; const r = Wr[l] / Math.sqrt(ew * e); if (r > best.r) best = { r, a: s, b: l }; } }
  return best;
}
async function render(br) {
  console.log('\nRENDER: the same mixer, offline, 3 minutes per scene'); const g = await openGame(br), pg = g.pg, SR = 24000, SECS = QUICK ? 60 : 180;
  const scenes = opt('--scenes') ? opt('--scenes').split(',').map(x => x.split(':')) : QUICK ? [['city', 'day']] : [['city', 'day'], ['town', 'day'], ['suburb', 'night'], ['harbor', 'day'], ['park', 'day'], ['city', 'day', 'rain'], ['suburb', 'evening', 'storm']];
  for (const [place, phase, wx] of scenes) {
    const r = await pg.evaluate(async ([place, phase, SR, SECS, wx]) => {
      const K = G.audio.debug.kit(), off = new OfflineAudioContext(1, SR * SECS, SR); let seed = 12345 + place.length * 977 + phase.length * 131; const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
      const mx = new K.BedMixer(off, off.destination, name => K.bytes(name).then(ab => off.decodeAudioData(ab)), K.STRETCHES, { rand }), sc = K.sceneFor({ place, phase, weather: wx || null, indoor: null });
      for (let i = 0; i < SECS * 2; i++) { const t = i / 2; off.suspend(t).then(async () => { if (i === 0) mx.set(sc); mx.tick(t); await mx.idle(); mx.tick(t); off.resume(); }); }
      const buf = await off.startRendering(), d = buf.getChannelData(0); let pk = 0; for (let i = 0; i < d.length; i++) { const a = d[i] < 0 ? -d[i] : d[i]; if (a > pk) pk = a; }
      const u8 = new Uint8Array(d.buffer, d.byteOffset, d.byteLength); let s = ''; for (let i = 0; i < u8.length; i += 32768) s += String.fromCharCode.apply(null, u8.subarray(i, i + 32768));
      return { key: sc.key, b64: btoa(s), peak: pk, log: mx.stats.log, xfades: mx.stats.xfades, decodes: mx.stats.decodes, failed: mx.stats.failed };
    }, [place, phase, SR, SECS, wx]);
    const raw = Buffer.from(r.b64, 'base64'), f = new Float32Array(raw.buffer, raw.byteOffset, raw.length / 4), file = path.join(OUT, r.key + '.wav'); wav(file, f, SR); const L = r128(file);
    /* waveform repeat: band-limit by averaging down to 3 kHz, 10 s windows every 5 s, guard 10 s */
    const dec = 8, n = Math.floor(f.length / dec), x = new Float64Array(n); let mean = 0; for (let i = 0; i < n; i++) { let a = 0; for (let k = 0; k < dec; k++) a += f[i * dec + k]; x[i] = a / dec; mean += x[i]; } mean /= n; for (let i = 0; i < n; i++) x[i] -= mean;
    const sr2 = SR / dec, wf = repeats(x, 10 * sr2, 5 * sr2, 10 * sr2);
    /* spectral-shape repeat (survives the 0-3 % speed change): 10 log bands 150 Hz - 9 kHz in 50 ms frames, each band minus its 10 s moving mean; 10 s windows every 5 s against every other place */
    const hop = SR / 20, m = Math.floor((f.length - 1024) / hop), NB = 10, ed = Array.from({ length: NB + 1 }, (_, i) => 150 * Math.pow(60, i / NB)), F = Array.from({ length: NB }, () => new Float64Array(m)), re = new Float64Array(1024), im = new Float64Array(1024);
    let ck = 0, all = 0; const cband = new Float64Array(m);
    for (let i = 0; i < m; i++) { for (let k = 0; k < 1024; k++) { re[k] = f[i * hop + k] * (.5 - .5 * Math.cos(2 * Math.PI * k / 1023)); im[k] = 0; } fft(re, im, false); { let c = 0, t = 0; for (let k = 3; k < 512; k++) { const p = re[k] * re[k] + im[k] * im[k]; t += p; if (k >= 2800 * 1024 / SR && k < 4500 * 1024 / SR) c += p; } ck += c; all += t; cband[i] = c; } for (let b = 0; b < NB; b++) { let a = 0; for (let k = Math.ceil(ed[b] * 1024 / SR); k < ed[b + 1] * 1024 / SR; k++) a += re[k] * re[k] + im[k] * im[k]; F[b][i] = 10 * Math.log10(a + 1e-12); } }
    for (const d of F) { const c = new Float64Array(m + 1); for (let i = 0; i < m; i++) c[i + 1] = c[i] + d[i]; const o = Float64Array.from(d); for (let i = 0; i < m; i++) { const a = Math.max(0, i - 100), z = Math.min(m, i + 100); d[i] = o[i] - (c[z] - c[a]) / (z - a); } }
    let ev = { r: 0 }; const en = l => { let e = 0; for (const d of F) for (let k = 0; k < 200; k++) e += d[l + k] * d[l + k]; return e; }, E = Array.from({ length: m - 200 }, (_, l) => en(l));
    for (let a = 0; a + 200 < m; a += 100) for (let l = 0; l + 200 < m; l++) { if (Math.abs(l - a) < 200) continue; let c = 0; for (const d of F) for (let k = 0; k < 200; k++) c += d[a + k] * d[l + k]; const r = c / Math.sqrt(E[a] * E[l] + 1e-9); if (r > ev.r) ev = { r, a, b: l }; }
    /* the mixer's own log: when was any second of any recording heard a second time? */
    let first = null; const seen = {}; for (const v of r.log) { const t1 = v.t1 === null ? SECS : Math.min(v.t1, SECS), o = seen[v.name] = seen[v.name] || []; for (let t = v.t0; t < t1; t += .5) { const pos = (v.pos + (t - v.t0) * v.rate) % v.L, hit = o.find(q => Math.abs(q[0] - pos) < .25 || Math.abs(q[0] - pos) > v.L - .25); if (hit && t - hit[1] > 1 && (!first || t < first.t)) first = { t: +t.toFixed(1), name: v.name, pos: +pos.toFixed(1), firstHeard: +hit[1].toFixed(1), track: v.id }; o.push([pos, t]); } }
    const heard = [...new Set(r.log.map(v => v.name))];
    /* the crickets' band (2.8-4.5 kHz, where 75 % of that recording's energy sits): its share of the whole mix, and how much of the time it is up (within 10 dB of its own loudest second) */
    const sec = []; for (let i = 0; i + 20 <= m; i += 20) { let a = 0; for (let k = 0; k < 20; k++) a += cband[i + k]; sec.push(a); } const top = Math.max(...sec), cricket = { share: +(10 * Math.log10(ck / all + 1e-12)).toFixed(1), level: +(L.I + 10 * Math.log10(ck / all + 1e-12)).toFixed(1), upShare: Math.round(100 * sec.filter(x => x > top / 10).length / sec.length) };
    report.render[r.key] = { seconds: SECS, sampleRate: SR, integrated: L.I, LRA: L.LRA, truePeak: L.truePeak, samplePeak: +(20 * Math.log10(r.peak)).toFixed(1), shortTermMin: L.stMin, shortTermMax: L.stMax, momentaryMax: L.mMax, cricketBand: cricket, waveformRepeat: wf, spectralRepeat: ev, firstReuse: first, voices: r.log.length, crossfades: r.xfades, stretches: heard, shortTerm: L.st.filter((_, i) => i % 50 === 0) };
    console.log(`  ${r.key}: ${SECS} s, ${r.log.length} voices of [${heard.join(', ')}], ${r.xfades} crossfades`);
    console.log(`     loudness: integrated ${L.I} LUFS, LRA ${L.LRA} LU, short-term (3 s) ${L.stMin} .. ${L.stMax} LUFS, loudest 400 ms ${L.mMax} LUFS, true peak ${L.truePeak} dBFS (sample peak ${(20 * Math.log10(r.peak)).toFixed(1)})`);
    console.log(`     2.8-4.5 kHz band (crickets live here): ${cricket.share} dB under the whole mix, about ${cricket.level} LUFS-equivalent; within 10 dB of its loudest second ${cricket.upShare} % of the time`);
    console.log(`     repeats: best waveform match of any 10 s window elsewhere r = ${wf.r.toFixed(3)}${wf.r > .3 ? ` (at ${(wf.a / sr2).toFixed(0)} s and ${(wf.b / sr2).toFixed(0)} s)` : ''}; best spectral-shape match r = ${ev.r.toFixed(2)}${ev.r > .5 ? ` (at ${(ev.a / 20).toFixed(0)} s and ${(ev.b / 20).toFixed(0)} s)` : ''}; first second of a recording heard twice: ${first ? `${first.name} @${first.pos} s, heard at ${first.firstHeard} s and again at ${first.t} s (track ${first.track})` : 'none in ' + SECS + ' s'}`);
    check(r.key + ' (offline): renders, decodes, crossfades', r.failed.length === 0 && r.xfades >= 1 && L.I !== null, `${r.decodes} decodes, ${r.xfades} crossfades`);
    check(r.key + ' (offline): no clipping', r.peak < .89 && L.truePeak < -1, `true peak ${L.truePeak} dBFS`);
    check(r.key + ' (offline): loudness steady', L.stMax - L.stMin < 14 && L.I > -36 && L.I < -17, `integrated ${L.I} LUFS, short-term ${L.stMin}..${L.stMax}`);
    const short = r.key.startsWith('harbor') || r.key.startsWith('waterfront');   /* known limit: there is one 29 s take of waves, so the same waves must come round several times in 3 minutes */
    check(r.key + ' (offline): no 10 s window comes again (waveform)' + (short ? ' [known limit: one 29 s wave take; reported, not failed]' : ''), wf.r < .5 || short, 'best r ' + wf.r.toFixed(3));
  }
  check('zero page errors (render)', g.errs.length === 0, g.errs.slice(0, 3).join(' | ')); await g.ctx.close();
}

const br = await chromium.launch({ args: ['--autoplay-policy=document-user-activation-required'] });
try {
  if (!ONLY || ONLY === 'live') await live(br);
  if (!ONLY || ONLY === 'broken') await broken(br);
  if (!ONLY || ONLY === 'render') await render(br);
} catch (e) { console.error(e); fails.push('the check itself crashed: ' + e.message); }
await br.close(); srv.close();
fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 1));
console.log(`\n${results.filter(r => r.ok).length} / ${results.length} checks passed` + (fails.length ? '\nFAILED: ' + fails.join('; ') : '') + '\nout/ambience/report.json');
process.exit(fails.length ? 1 : 0);
