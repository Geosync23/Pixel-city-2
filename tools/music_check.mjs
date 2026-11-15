// Background music: the checks nobody can do by ear.   node tools/music_check.mjs [--nobuild] [--write] [--only static|render|live] [--tunes id,id] [--keep]
//
//   STATIC  (node, the real modules) every tune compiles, has a title, a length of 1.5-3.5 min, a lead in range; every pool has tunes (outdoors: each
//           time of day x district x season has at least 3); distinct pitches / chords / sections per tune; melodic-contour similarity of every pair.
//   RENDER  every tune rendered offline by the SHIPPED code (dist/index.html, G.audio.debug.musicKit().renderSong, OfflineAudioContext in headless Chromium)
//           -> out/music/<id>.wav (deleted afterwards unless --keep), measured: duration, integrated loudness and true peak (EBU R128, ffmpeg), share of
//           energy above 6 kHz and spectral flatness for the whole tune and for its loudest second (0 = pure tones, ~0.56 = white noise in this measure).
//           --write: render without trims and write src/sim/_music_levels.js (the trim per tune that brings them all to TARGET LUFS). Without it: render
//           WITH the trims and assert every tune within +-1.5 LU of the target and no true peak above -1 dBTP.
//   LIVE    the game by touch: no AudioContext before the first touch; 20+ contexts -> the right pool plays; 200 picks without an immediate repeat and
//           with fair turns inside each pool; music stays off while a show / the TV is on; no frame over 100 ms when a tune starts; zero page errors.
// Results: printed, and out/music/report.json. Exit code 1 if an assertion fails.
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module'; import { execFileSync, spawnSync } from 'node:child_process';
import { ROOT } from './artfiles.mjs';
const require = createRequire(ROOT + '/'); const { chromium } = require('playwright');
const arg = k => process.argv.includes(k), opt = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const ONLY = opt('--only'), WRITE = arg('--write'), TUNES = opt('--tunes') ? opt('--tunes').split(',') : null, OUT = path.join(ROOT, 'out/music'), TARGET = -17, SR = 48000; fs.mkdirSync(OUT, { recursive: true });
const results = [], fails = []; const check = (name, ok, detail = '') => { results.push({ name, ok: !!ok, detail }); if (!ok) fails.push(name); console.log((ok ? '  ok   ' : '  FAIL ') + name + (detail ? '  [' + detail + ']' : '')); };
const report = { when: new Date().toISOString(), target: TARGET, checks: results, tunes: {}, live: {} };
const E = await import(path.join(ROOT, 'src/sim/_music_engine.js')), { SONGS, SONG } = await import(path.join(ROOT, 'src/sim/_music_songs.js')), PO = await import(path.join(ROOT, 'src/sim/_music_pools.js')), { INST } = await import(path.join(ROOT, 'src/sim/_music_synth.js'));
const KEYS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'], keyOf = S => KEYS[(((S.tr || 0) % 12) + 12) % 12] + (S.min ? ' minor' : ''), mmss = s => Math.floor(s / 60) + ':' + String(Math.round(s % 60)).padStart(2, '0');

/* ------------------------------------------------------------------ static */
function staticChecks() {
  console.log('\nSTATIC: the songbook (' + SONGS.length + ' tunes)');
  const bad = [], info = {}; let total = 0;
  for (const S of SONGS) { try { const c = E.compile(S); info[S.id] = c; total += c.dur; report.tunes[S.id] = { title: S.title, feel: S.feel, key: keyOf(S), bpm: S.bpm, metre: S.mt || '4/4', form: S.form, dur: +c.dur.toFixed(1), bars: c.info.bars, sections: c.info.sections, parts: c.info.parts, chords: c.info.chords, pitches: c.info.pitches, range: [c.info.lo, c.info.hi], notes: c.info.notes, instruments: c.info.ins.map(i => INST[i] ? INST[i].name : i), kit: c.info.kit, where: PO.whereOf(S.id), warn: c.info.warn }; if (c.info.warn.length) bad.push(S.id + ': ' + c.info.warn.join('; ')); for (const i of c.info.ins) if (!INST[i]) bad.push(S.id + ': no instrument ' + i); } catch (e) { bad.push(S.id + ': ' + e.message); } }
  check('every tune compiles without a warning', !bad.length, bad.join(' | ') || SONGS.length + ' tunes, ' + (total / 60).toFixed(0) + ' minutes of music in all');
  check('at least 48 tunes', SONGS.length >= 48, String(SONGS.length));
  const ids = SONGS.map(s => s.id), titles = SONGS.map(s => s.title); check('ids and titles are unique, every tune has a title and a feel', new Set(ids).size === ids.length && new Set(titles).size === titles.length && SONGS.every(s => s.title && s.feel));
  const short = SONGS.filter(s => info[s.id] && (info[s.id].dur < 90 || info[s.id].dur > 215)).map(s => s.id + ' ' + mmss(info[s.id].dur)); check('every tune lasts 1.5 to 3.5 minutes as played', !short.length, short.join(', ') || 'shortest ' + mmss(Math.min(...Object.values(info).map(c => c.dur))) + ', longest ' + mmss(Math.max(...Object.values(info).map(c => c.dur))));
  const thin = SONGS.filter(s => info[s.id] && (info[s.id].info.parts < 2 || info[s.id].info.chords < 5 || info[s.id].info.pitches < 7)).map(s => s.id); check('every tune has at least 2 different sections, 5 chords, 7 lead pitches', !thin.length, thin.join(', ') || 'median: ' + med(Object.values(info).map(c => c.info.parts)) + ' sections, ' + med(Object.values(info).map(c => c.info.chords)) + ' chords, ' + med(Object.values(info).map(c => c.info.pitches)) + ' lead pitches');
  const crackle = SONGS.filter(s => s.crackle || (s.st && s.st.crackle)); check('no crackle option anywhere', !crackle.length && !/crackle\s*:/.test(fs.readFileSync(path.join(ROOT, 'src/sim/_music_engine.js'), 'utf8') + fs.readFileSync(path.join(ROOT, 'src/sim/_music_synth.js'), 'utf8')));
  const var_ = { keys: new Set(SONGS.map(keyOf)).size, tempi: new Set(SONGS.map(s => s.bpm)).size, metres: [...new Set(SONGS.map(s => s.mt || '4/4'))], styles: new Set(SONGS.map(s => s.style)).size, feels: new Set(SONGS.map(s => s.feel)).size, lead: new Set(SONGS.map(s => s.ins.m)).size };
  check('variety: keys, tempi, metres, accompaniment styles', var_.keys >= 10 && var_.metres.length >= 4 && var_.styles >= 15, `${var_.keys} keys, ${var_.tempi} tempi (${Math.min(...SONGS.map(s => s.bpm))}-${Math.max(...SONGS.map(s => s.bpm))} bpm), metres ${var_.metres.join(' ')}, ${var_.styles} styles, ${var_.feels} feels, ${var_.lead} lead instruments`); report.variety = var_;
  /* pools */
  const thinOut = []; let minOut = 99; for (const t of PO.TIMES) for (const d of PO.DISTRICTS) for (let s = 0; s < 4; s++) { const exact = SONGS.filter(x => x.out && (x.sea === undefined || x.sea === s) && (x.out.split('|')[0] === '*' || x.out.split('|')[0].split(' ').includes(t)) && (x.out.split('|')[1] === '*' || x.out.split('|')[1].split(' ').includes(d))).length; minOut = Math.min(minOut, exact); if (exact < 3) thinOut.push(`${t}/${d}/${PO.SEASONS[s]}: ${exact}`); }
  check('outdoors: every time of day x district x season has at least 3 tunes of its own', !thinOut.length, thinOut.slice(0, 12).join(', ') + (thinOut.length > 12 ? ` ... (${thinOut.length})` : '') || 'smallest pool ' + minOut);
  const named = PO.namedPools().map(k => [k, SONGS.filter(s => (' ' + (s.pl || '') + ' ').includes(' ' + k + ' ')).length, PO.pool(k).length]); report.pools = Object.fromEntries(named.map(([k, own, n]) => [k, { own, plays: PO.pool(k) }]));
  check('every named pool has at least 2 tunes to draw from', named.every(x => x[2] >= 2), named.map(([k, own, n]) => k + ' ' + own + (n !== own ? '(' + n + ')' : '')).join(', '));
  const lone = SONGS.filter(s => !s.pl && !s.out).map(s => s.id); check('every tune is in a pool', !lone.length, lone.join(', '));
  /* contour similarity: the first 40 lead intervals + rhythm of each tune, longest common subsequence */
  const sig = {}; for (const S of SONGS) { const m = info[S.id] ? info[S.id].info.mel : [], a = []; for (let i = 1; i < Math.min(m.length, 41); i++) a.push(Math.max(-7, Math.min(7, m[i][1] - m[i - 1][1])) + ':' + Math.round(Math.log2((m[i][0] - m[i - 1][0]) / (m[1][0] - m[0][0] || 1)) * 2)); sig[S.id] = a; }
  const lcs = (a, b) => { const n = a.length, m = b.length, d = new Uint16Array((n + 1) * (m + 1)); for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) d[i * (m + 1) + j] = a[i - 1] === b[j - 1] ? d[(i - 1) * (m + 1) + j - 1] + 1 : Math.max(d[(i - 1) * (m + 1) + j], d[i * (m + 1) + j - 1]); return d[n * (m + 1) + m]; };
  const pairs = []; for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) { const a = sig[ids[i]], b = sig[ids[j]]; if (a.length < 8 || b.length < 8) continue; pairs.push([lcs(a, b) / Math.min(a.length, b.length), ids[i], ids[j]]); } pairs.sort((x, y) => y[0] - x[0]);
  report.similar = pairs.slice(0, 10).map(p => ({ a: p[1], b: p[2], sim: +p[0].toFixed(2) }));
  check('no two tunes share a melodic contour (interval + rhythm match of the opening 40 notes under 0.6)', !pairs.length || pairs[0][0] < .6, 'closest: ' + pairs.slice(0, 3).map(p => `${p[1]}~${p[2]} ${p[0].toFixed(2)}`).join(', ') + '; median ' + (pairs.length ? pairs[pairs.length >> 1][0].toFixed(2) : '-'));
}
const med = a => { const s = a.slice().sort((x, y) => x - y); return s[s.length >> 1]; };

/* ------------------------------------------------------------------ browser */
let srv = null, URL0 = '', SAVE = '';
async function serve() { const HTML = fs.readFileSync(path.join(ROOT, 'dist/index.html')); SAVE = fs.readFileSync(path.join(ROOT, 'tools/perf_save.json'), 'utf8'); srv = http.createServer((q, r) => { r.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' }); r.end(HTML); }); await new Promise(r => srv.listen(0, r)); URL0 = 'http://localhost:' + srv.address().port + '/'; }
const INIT = () => {
  const M = window.__mus = { ctxMade: 0, frames: [], rec: false, cur: -1 };
  for (const K of ['AudioContext', 'webkitAudioContext']) { const C = window[K]; if (C) window[K] = new Proxy(C, { construct(t, a) { M.ctxMade++; return new t(...a); } }); }
  const raf = window.requestAnimationFrame.bind(window); window.requestAnimationFrame = cb => raf(t => { if (t !== M.cur) { if (M.rec && M.cur >= 0) M.frames.push(+(t - M.cur).toFixed(1)); M.cur = t; } cb(t); });
};
const HELP = () => {
  window.sleep = ms => new Promise(r => setTimeout(r, ms));
  try { G.state.tips.off = 1; } catch (e) { } try { G.dev.set(true); G.state.dev.needs = true; G.state.dev.money = true; } catch (e) { }
  window.closeUi = async () => { for (let i = 0; i < 20; i++) { const s = document.querySelector('.say'); if (s) s.click(); const b = [...document.querySelectorAll('button')].find(b => /^Got it$/.test(b.textContent.trim()) && b.offsetParent); if (b) b.click(); const x = document.querySelector('.modal .x'); if (x) x.click(); if (!s && !b && !x) break; await sleep(80); } };
  window.setHour = h => { const d = Math.floor(G.state.t / 1440); G.state.t = d * 1440 + h * 60; G.advance(1); };
  window.toCity = async (x, y, hour, wx) => { if (hour !== undefined) setHour(hour); await G.go('city', { x, y, fade: false }); await sleep(250); try { G.weather.setWeather(wx || 'clear', 12); } catch (e) { } await closeUi(); };
  window.spots = () => { const W = G.sceneCache.get('city').world, o = {}, by = {}; for (const k of W.walkways) if (k.kind === 'sidewalk' && k.district) (by[k.district] = by[k.district] || []).push(k); const mid = k => [(k.x0 + k.x1) / 2, (k.y0 + k.y1) / 2];
    for (const d in by) { const L = by[d]; for (let i = 0; i < L.length; i++) { const p = mid(L[(i * 7 + (L.length >> 1)) % L.length]); if (W.isBlocked && W.isBlocked(p[0], p[1])) continue; if (W.districtAt(p[0], p[1]) !== d) continue; o[d] = p; break; } }
    const m = W.pois.find(p => p.type === 'stall' && /market/.test(p.venue || '')); if (m) o.market = [m.x + 1, m.y + 2]; return o; };
  /* ask for a fresh tune in the context of this moment and report what plays */
  window.tune = async () => { const K = G.audio.debug.musicKit(); G.audio.skip(); let d = null; for (let i = 0; i < 60; i++) { await sleep(100); d = G.audio.debug.music(); if (d.playing && d.playing.t < 3 && !d.playing.ending) break; } const want = K.ctx(); return { key: d.context && d.context.key, wantKey: want.key, g: want.g, id: d.playing && d.playing.id, pool: d.playing && d.playing.pool, inPool: !!(d.playing && K.pool(want.key).includes(d.playing.id)), n: K.pool(want.key).length, startMs: d.startMs, errors: G.audio.info().errors }; };
};
async function openGame(br) {
  const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true }), pg = await ctx.newPage(), errs = [];
  pg.on('pageerror', e => errs.push(e.message.slice(0, 300))); await pg.addInitScript(INIT);
  await pg.goto(URL0); await pg.evaluate(s => localStorage.setItem('maplebay.save.v1', s), SAVE);
  await pg.goto(URL0); await pg.waitForFunction(() => window.G && G.onTitle !== undefined && !document.getElementById('load'), null, { timeout: 180000 }); await pg.waitForTimeout(800);
  return { ctx, pg, errs };
}
async function startGame(g) { await g.pg.touchscreen.tap(195, 440); await g.pg.waitForFunction(() => !G.onTitle && G.scene, null, { timeout: 60000 }); await g.pg.waitForTimeout(1500); await g.pg.evaluate(HELP); await g.pg.evaluate(() => closeUi()); }

/* ------------------------------------------------------------------ render + measure */
function fft(re, im) { const n = re.length; for (let i = 1, j = 0; i < n; i++) { let b = n >> 1; for (; j & b; b >>= 1) j ^= b; j ^= b; if (i < j) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; } }
  for (let len = 2; len <= n; len <<= 1) { const a = -2 * Math.PI / len, wr = Math.cos(a), wi = Math.sin(a); for (let i = 0; i < n; i += len) { let cr = 1, ci = 0; for (let k = 0; k < len >> 1; k++) { const p = i + k, q = p + (len >> 1), xr = re[q] * cr - im[q] * ci, xi = re[q] * ci + im[q] * cr; re[q] = re[p] - xr; im[q] = im[p] - xi; re[p] += xr; im[p] += xi; const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t; } } } }
const NF = 4096, HANN = Float64Array.from({ length: NF }, (_, i) => .5 - .5 * Math.cos(2 * Math.PI * i / NF));
/** mono samples -> { hf: share of energy above 6 kHz, flat: mean spectral flatness per 85 ms frame (60 Hz - 12 kHz), of the frames that are not silent } */
function spectrum(x, a, b) {
  let hi = 0, all = 0, fl = 0, nf = 0; const re = new Float64Array(NF), im = new Float64Array(NF), k0 = Math.round(60 * NF / SR), k6 = Math.round(6000 * NF / SR), k12 = Math.round(12000 * NF / SR);
  for (let o = a; o + NF <= b; o += NF) { let e = 0; for (let i = 0; i < NF; i++) { re[i] = x[o + i] * HANN[i]; im[i] = 0; e += x[o + i] * x[o + i]; } if (e / NF < 1e-7) continue; fft(re, im);
    let ls = 0, s = 0; for (let k = k0; k < k12; k++) { const p = re[k] * re[k] + im[k] * im[k] + 1e-14; ls += Math.log(p); s += p; if (k >= k6) hi += p; } for (let k = k12; k < NF / 2; k++) { const p = re[k] * re[k] + im[k] * im[k]; hi += p; s += p; } all += s; fl += Math.exp(ls / (k12 - k0)) / ((s + 1e-14) / (k12 - k0)); nf++; }
  return { hf: all ? hi / all : 0, flat: nf ? fl / nf : 0 };
}
function measure(id, pcm) {
  const n = pcm.length / 4, x = new Float32Array(n); let pk = 0; for (let i = 0; i < n; i++) { const l = pcm.readInt16LE(i * 4) / 32768, r = pcm.readInt16LE(i * 4 + 2) / 32768; x[i] = (l + r) / 2; }
  const h = Buffer.alloc(44); h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVEfmt ', 8); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(2, 22); h.writeUInt32LE(SR, 24); h.writeUInt32LE(SR * 4, 28); h.writeUInt16LE(4, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
  const f = path.join(OUT, id + '.wav'); fs.writeFileSync(f, Buffer.concat([h, pcm]));
  const o = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', f, '-af', 'ebur128=peak=true', '-f', 'null', '-'], { encoding: 'utf8' }).stderr, sm = o.slice(o.lastIndexOf('Summary')), num = re => +((re.exec(sm) || [])[1]);
  if (!arg('--keep')) fs.unlinkSync(f);
  /* loudest second */
  const W = SR, hop = SR / 4; let best = 0, be = -1, acc = new Float64Array(Math.ceil(n / hop) + 1); for (let i = 0; i < n; i++) acc[(i / hop) | 0] += x[i] * x[i]; for (let k = 0; k + 4 <= acc.length; k++) { const e = acc[k] + acc[k + 1] + acc[k + 2] + acc[k + 3]; if (e > be) { be = e; best = k * hop; } }
  let last = n - 1; while (last > 0 && Math.abs(x[last]) < 1e-4) last--;
  const all = spectrum(x, 0, n), top = spectrum(x, best, Math.min(n, best + W));
  return { lufs: num(/I:\s+(-?[\d.]+) LUFS/), lra: num(/LRA:\s+(-?[\d.]+) LU/), peak: num(/Peak:\s+(-?[\d.]+) dBFS/), sounding: +(last / SR).toFixed(1), hf: +(all.hf * 100).toFixed(2), flat: +all.flat.toFixed(4), topAt: +(best / SR).toFixed(1), topHf: +(top.hf * 100).toFixed(2), topFlat: +top.flat.toFixed(4) };
}
async function render(br) {
  console.log('\nRENDER: every tune, offline, by the shipped code' + (WRITE ? ' (no trims: writing _music_levels.js)' : ' (with the trims)'));
  const list = SONGS.filter(s => !TUNES || TUNES.includes(s.id)), N = 3, pages = []; const t0 = Date.now(); const chunks = {};
  for (let i = 0; i < N; i++) { const g = await openGame(br); await g.pg.exposeFunction('saveChunk', (id, b64) => { (chunks[id] = chunks[id] || []).push(Buffer.from(b64, 'base64')); }); pages.push(g); }
  let next = 0; const M = {};
  await Promise.all(pages.map(async g => { while (next < list.length) { const S = list[next++];
    const r = await g.pg.evaluate(async ([id, raw, sr]) => { const K = G.audio.debug.musicKit(), t0 = performance.now(), b = await K.renderSong(K.SONG[id], sr, raw ? 0 : (K.LEVELS[id] || 0)), l = b.getChannelData(0), r = b.getChannelData(1), n = l.length, CH = 1 << 20;
      for (let o = 0; o < n; o += CH) { const m = Math.min(CH, n - o), u = new Int16Array(m * 2); for (let i = 0; i < m; i++) { u[2 * i] = Math.max(-1, Math.min(1, l[o + i])) * 32767; u[2 * i + 1] = Math.max(-1, Math.min(1, r[o + i])) * 32767; } let s = ''; const u8 = new Uint8Array(u.buffer); for (let i = 0; i < u8.length; i += 32768) s += String.fromCharCode.apply(null, u8.subarray(i, i + 32768)); await saveChunk(id, btoa(s)); }
      return { ms: Math.round(performance.now() - t0), dur: b.duration, trim: K.LEVELS[id] || 0 }; }, [S.id, WRITE, SR]);
    const m = measure(S.id, Buffer.concat(chunks[S.id])); delete chunks[S.id]; m.dur = +r.dur.toFixed(1); m.renderMs = r.ms; m.trim = WRITE ? 0 : r.trim; M[S.id] = m; Object.assign(report.tunes[S.id] || (report.tunes[S.id] = {}), { measured: m });
    console.log(`     ${S.id.padEnd(17)} ${mmss(m.sounding).padStart(5)}  ${m.lufs.toFixed(1).padStart(6)} LUFS  peak ${m.peak.toFixed(1).padStart(6)}  LRA ${String(m.lra).padStart(4)}  >6k ${String(m.hf).padStart(5)}%  flat ${m.flat.toFixed(3)}  | loudest s @${String(m.topAt).padStart(5)}: >6k ${String(m.topHf).padStart(5)}%  flat ${m.topFlat.toFixed(3)}  (${(r.ms / 1000).toFixed(1)} s)`); } }));
  const errs = pages.flatMap(g => g.errs); for (const g of pages) await g.ctx.close();
  const ids = Object.keys(M); console.log(`     ${ids.length} tunes rendered in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  check('rendering raised no page error', !errs.length, errs.slice(0, 3).join(' | '));
  if (WRITE) {
    const L = {}; for (const id of ids) { let t = TARGET - M[id].lufs; if (M[id].peak + t > -2) t = -2 - M[id].peak; L[id] = +t.toFixed(1); }
    const old = TUNES ? (await import(path.join(ROOT, 'src/sim/_music_levels.js'))).LEVELS : {}, all = Object.assign({}, old, L);
    fs.writeFileSync(path.join(ROOT, 'src/sim/_music_levels.js'), '// GENERATED by tools/music_check.mjs --write: the trim (dB) that brings each tune to the same integrated loudness (' + TARGET + ' LUFS at the music bus, before the Music slider). Do not edit by hand.\nexport const LEVELS = ' + JSON.stringify(all).replace(/,/g, ', ') + ';\n');
    console.log('     wrote src/sim/_music_levels.js: trims ' + Math.min(...Object.values(L)) + ' .. ' + Math.max(...Object.values(L)) + ' dB. Build and run again without --write.'); return;
  }
  const lu = ids.map(id => M[id].lufs), off = ids.filter(id => Math.abs(M[id].lufs - TARGET) > 1.5), hot = ids.filter(id => M[id].peak > -1);
  check(`integrated loudness of every tune within +-1.5 LU of ${TARGET} LUFS`, !off.length, off.map(id => id + ' ' + M[id].lufs).join(', ') || `${Math.min(...lu)} .. ${Math.max(...lu)} LUFS`);
  check('no clipping: true peak of every tune at or under -1 dBTP', !hot.length, hot.map(id => id + ' ' + M[id].peak).join(', ') || 'highest ' + Math.max(...ids.map(id => M[id].peak)) + ' dBTP');
  const worst = (k, n = 3) => ids.slice().sort((a, b) => M[b][k] - M[a][k]).slice(0, n).map(id => `${id} ${M[id][k]}`).join(', ');
  check('nothing hiss-like: share of energy above 6 kHz under 3 % in every tune, under 8 % in its loudest second', ids.every(id => M[id].hf < 3 && M[id].topHf < 8), 'worst whole tune: ' + worst('hf') + ' %; worst loudest second: ' + worst('topHf') + ' %');
  check('nothing noise-like: spectral flatness under 0.05 in every tune and in its loudest second (white noise measures 0.56, pink 0.2)', ids.every(id => M[id].flat < .05 && M[id].topFlat < .05), 'worst whole tune: ' + worst('flat') + '; worst loudest second: ' + worst('topFlat'));
  const len = ids.filter(id => M[id].sounding < 88 || M[id].sounding > 215); check('rendered length 1.5 to 3.5 minutes', !len.length, len.map(id => id + ' ' + M[id].sounding).join(', ') || `${mmss(Math.min(...ids.map(id => M[id].sounding)))} .. ${mmss(Math.max(...ids.map(id => M[id].sounding)))}`);
  report.worst = { hf: worst('hf'), topHf: worst('topHf'), flat: worst('flat'), topFlat: worst('topFlat') };
}

/* ------------------------------------------------------------------ live */
async function live(br) {
  console.log('\nLIVE: the game, by touch'); const g = await openGame(br), pg = g.pg, R = report.live;
  const pre = await pg.evaluate(() => ({ made: __mus.ctxMade, info: G.audio.info(), d: G.audio.debug.music() })); await pg.waitForTimeout(1200);
  check('no AudioContext and no music before the first touch', pre.made === 0 && pre.info.state === 'none' && !pre.d.playing, `contexts made ${pre.made}, state ${pre.info.state}`);
  /* the title screen: a tap that does not start the game (top edge) unlocks audio; the title pool plays */
  await pg.touchscreen.tap(8, 8); await pg.waitForTimeout(400);
  const onTitle = await pg.evaluate(() => G.onTitle);
  if (onTitle) { const t = await pg.evaluate(async () => { const K = G.audio.debug.musicKit(); let d = null; for (let i = 0; i < 90; i++) { await new Promise(r => setTimeout(r, 100)); d = G.audio.debug.music(); if (d.playing) break; } return { id: d.playing && d.playing.id, key: d.context && d.context.key, ok: !!(d.playing && K.pool('title').includes(d.playing.id)), state: G.audio.info().state }; }); check('context title screen -> pool title', t.ok && t.key === 'title', `${t.id} (audio ${t.state})`); }
  else check('context title screen -> pool title', false, 'the tap started the game');
  await startGame(g);
  const sp = await pg.evaluate(() => spots()); R.spots = sp;
  const C = []; const out = (name, d, h, wx, key) => C.push({ name, kind: 'city', at: sp[d], h, wx, key });
  out('downtown, 8:00', 'downtown', 8, null, 'out:morning:downtown'); out('old town, 12:30', 'oldtown', 12.5, null, 'out:midday:oldtown'); out('harbor, 15:00', 'harbor', 15, null, 'out:afternoon:harbor'); out('park, 18:00', 'park', 18, null, 'out:golden:park');
  out('suburb (Maplewood), 21:00', 'maplewood', 21, null, 'out:evening:suburb'); out('arts quarter, 1:00', 'arts', 1, null, 'out:late:arts'); out('market, 10:00', 'market', 10, null, 'out:morning:market'); out('airport, 5:30', 'airport', 5.5, null, 'out:dawn:airport');
  out('downtown in the rain', 'downtown', 13, 'rain', 'rain'); out('old town in a storm', 'oldtown', 16, 'storm', 'storm'); out('park in the snow', 'park', 11, 'snow', 'snow'); out('harbor in fog', 'harbor', 6, 'fog', 'fog');
  for (const [room, key, h] of [['cafe', 'cafe', 10], ['pizza', 'diner', 13], ['bar', 'bar', 21], ['grocery', 'shop', 15], ['gym', 'gym', 17], ['library', 'library', 11], ['museum', 'museum', 14], ['office', 'office', 10], ['central_station', 'train', 9], ['HOME', 'home', 14], ['HOME', 'home_am', 7], ['HOME', 'home_late', 23.5]]) C.push({ name: 'indoors: ' + room + (room === 'HOME' ? ' at ' + h + ' h' : ''), kind: 'room', room, h, key });
  C.push({ name: 'in a cab', kind: 'ride', ride: 'taxi', key: 'cab' }, { name: 'on the bus', kind: 'ride', ride: 'bus', key: 'bus' }, { name: 'on the train', kind: 'ride', ride: 'train', key: 'train' }, { name: 'a work shift', kind: 'work', key: 'work' }, { name: 'date night (mood)', kind: 'mood', mood: 'date', key: 'date' }, { name: 'with the family (mood)', kind: 'mood', mood: 'family', key: 'family' }, { name: 'festival day (mood)', kind: 'mood', mood: 'festival', key: 'festival' });
  let okN = 0; R.contexts = [];
  for (const c of C) {
    const r = await pg.evaluate(async c => { const home = G.state.housing && G.state.housing.id;
      try {
        if (c.kind === 'city') await toCity(c.at[0], c.at[1], c.h, c.wx); else { try { G.weather.setWeather('clear', 12); } catch (e) { } }
        if (c.kind === 'room') { setHour(c.h); await G.go(c.room === 'HOME' ? 'int:home:' + home : 'int:' + c.room, { fade: false }); await sleep(300); await closeUi(); }
        if (c.kind === 'ride') G.emit('ride:start', c.ride, null); if (c.kind === 'mood') G.audio.mood(c.mood, 600);
        let undo = null; if (c.kind === 'work') { const o = G.jobs.onShift; G.jobs.onShift = () => true; undo = () => { G.jobs.onShift = o; }; }
        await sleep(650); const r = await tune(); r.scene = G.scene && G.scene.id;
        if (c.kind === 'ride') G.emit('ride:end', c.ride, null); if (c.kind === 'mood') G.audio.mood(null); if (undo) undo(); return r;
      } catch (e) { return { err: String(e && e.message || e) }; } }, c);
    const ok = !r.err && r.inPool && String(r.key).startsWith(c.key) && (c.key.startsWith('out:') || r.key === c.key); if (ok) okN++; R.contexts.push(Object.assign({ name: c.name, want: c.key }, r));
    check(`context ${c.name} -> pool ${c.key}`, ok, r.err || `plays ${r.id} from ${r.key} (${r.n} tunes)${r.scene ? ', scene ' + r.scene : ''}`);
  }
  check('at least 20 contexts walked', C.length >= 20, C.length + ' contexts, ' + okN + ' right');
  /* the controller itself: 14 real starts in one place, never the same tune twice in a row */
  { const r = await pg.evaluate(async at => { await toCity(at[0], at[1], 12); await sleep(600); const seq = [], ms = []; __mus.frames = []; __mus.rec = true; for (let i = 0; i < 14; i++) { const t = await tune(); seq.push(t.id); ms.push(t.startMs); await sleep(500); } __mus.rec = false; const f = __mus.frames.slice(); return { seq, ms, maxFrame: Math.max(...f), over: f.filter(x => x > 100).length, frames: f.length, p99: f.slice().sort((a, b) => a - b)[Math.floor(f.length * .99)], errors: G.audio.info().errors, last: G.audio.info().lastError }; }, sp.downtown);
    const rep = r.seq.filter((x, i) => i && x === r.seq[i - 1]).length; R.starts = r;
    check('14 real starts downtown at noon: never the same tune twice in a row', rep === 0 && r.seq.every(Boolean), r.seq.join(' > '));
    check('starting a tune never costs a frame over 100 ms', r.over === 0, `longest frame ${r.maxFrame} ms, 99th percentile ${r.p99} ms over ${r.frames} frames; picking + first notes took ${Math.max(...r.ms)} ms at most`);
    check('the audio system logged no error', r.errors === 0, r.last || ''); }
  /* 200 picks through the bag, walking contexts like a day in the city */
  { const r = await pg.evaluate(() => { const K = G.audio.debug.musicKit(), st = { bags: {}, recent: [], last: null }, keys = ['out:morning:downtown:0', 'cafe', 'out:midday:oldtown:0', 'work', 'out:afternoon:market:0', 'shop', 'out:golden:harbor:0', 'home', 'out:evening:arts:0', 'bar', 'out:late:suburb:0', 'home_late', 'rain', 'train', 'cab'];
      const seq = [], per = {}; let k = 0; for (let i = 0; i < 200; i++) { if (i % 3 === 0) k = (k + 1 + ((i * 7) % 4)) % keys.length; const key = keys[k], id = K.draw(st, key); K.played(st, id); seq.push(id); (per[key] = per[key] || []).push(id); }
      let rep = 0, near = 0; for (let i = 1; i < seq.length; i++) { if (seq[i] === seq[i - 1]) rep++; if (i > 1 && seq[i] === seq[i - 2]) near++; }
      const unfair = []; for (const key in per) { const n = {}, ids = K.pool(key); for (const id of ids) n[id] = 0; for (const id of per[key]) n[id]++; const v = Object.values(n), d = Math.max(...v) - Math.min(...v); if (d > 2) unfair.push(key + ' ' + d); }
      return { rep, near, unfair, distinct: new Set(seq).size, pools: Object.keys(per).length }; });
    check('200 picks across 15 pools: no immediate repeat', r.rep === 0, `${r.distinct} different tunes heard, ${r.near} came back after only one other tune`);
    check('inside each pool every tune gets its turn before one comes again (plays differ by 2 at most)', !r.unfair.length, r.unfair.join(', ')); R.bag = r; }
  /* watching a show / the TV: the music stays out */
  { const r = await pg.evaluate(async at => { await toCity(at[0], at[1], 12); await tune(); await sleep(800); const before = !!G.audio.debug.music().playing; const K = G.audio.debug.musicKit();
      G.emit('show:start'); let during = 0; for (let i = 0; i < 40; i++) { await sleep(200); if (i > 12 && G.audio.debug.music().playing) during++; } G.emit('show:end');
      K.watch.tv = true; let tv = 0; for (let i = 0; i < 30; i++) { await sleep(200); if (G.audio.debug.music().playing) tv++; } K.watch.tv = false;
      let back = -1; const t0 = performance.now(); for (let i = 0; i < 150; i++) { await sleep(200); if (G.audio.debug.music().playing) { back = (performance.now() - t0) / 1000; break; } } return { before, during, tv, back }; }, sp.downtown);
    check('music stops while a show is on and stays off while the TV is on', r.before && r.during === 0 && r.tv === 0, `playing before: ${r.before}; samples with music during the show: ${r.during}, during TV: ${r.tv}`);
    check('music comes back after the show', r.back > 8 && r.back < 30, r.back.toFixed(1) + ' s after it ended'); R.watch = r; }
  /* mute */
  { const r = await pg.evaluate(async () => { await tune(); G.audio.setVolume('music', 0); await sleep(700); const off = !G.audio.debug.music().playing; G.audio.setVolume('music', .6); return { off }; }); check('Music volume 0 stops the tune', r.off); }
  check('zero page errors', !g.errs.length, g.errs.slice(0, 3).join(' | ')); await g.ctx.close();
}

if (!ONLY || ONLY === 'static') staticChecks();
if (!ONLY || ONLY !== 'static') {
  if (!arg('--nobuild')) execFileSync('node', [path.join(ROOT, 'tools/build.mjs')], { stdio: 'inherit' });
  await serve(); const br = await chromium.launch();
  try { if (!ONLY || ONLY === 'render') await render(br); if ((!ONLY || ONLY === 'live') && !WRITE) await live(br); } finally { await br.close(); srv.close(); }
}
report.size = { dist: fs.existsSync(path.join(ROOT, 'dist/index.html')) ? fs.statSync(path.join(ROOT, 'dist/index.html')).size : 0, source: fs.readdirSync(path.join(ROOT, 'src/sim')).filter(f => /^_music_|^_audio_music/.test(f)).reduce((a, f) => a + fs.statSync(path.join(ROOT, 'src/sim', f)).size, 0) };
fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 1));
console.log(`\n${results.length - fails.length} of ${results.length} checks passed` + (fails.length ? '; FAILED: ' + fails.join(' | ') : '') + `. Music source ${(report.size.source / 1024).toFixed(0)} KB, game file ${(report.size.dist / 1024).toFixed(0)} KB. Report: out/music/report.json`);
process.exit(fails.length ? 1 : 0);
