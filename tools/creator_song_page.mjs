// Builds docs/audio/creator_song.html: the listening page for the character creator's song (three candidates + Classic: Indoors for reference).
//   node tools/creator_song_page.mjs            build the page
//   node tools/creator_song_page.mjs --check    build, then check it in Chromium (Playwright, 390 x 844, touch) and measure every candidate offline:
//                                               page errors, sound from each button (AnalyserNode), Stop, no sideways scroll; loop length, tempo, key,
//                                               loudness (EBU R128 via ffmpeg, 4 seeds x 3 times round, energy mean) next to Classic: Indoors, peak and
//                                               true peak, clipping, the loop seam (level and sample jumps around the join). Prints the trims that would
//                                               put each candidate at Indoors' loudness (CREATOR_LEVELS in src/sim/_music_creator.js is set by hand from them).
// The page runs the GAME'S OWN code: src/sim/_audio_lib.js, src/sim/_music_classic.js and src/sim/_music_creator.js are copied in (imports / exports
// stripped), so what you hear is what the game plays; the mix is the game's at default sliders (compressor -> Master 0.8 -> Music 0.6 x 0.6 -> the tune).
// The page content only (no doctype / html / head / body): it is published as a claude.ai artifact.
import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module'; import { spawnSync } from 'node:child_process'; import { ROOT } from './artfiles.mjs';
const strip = s => s.replace(/^import .*$/gm, '').replace(/^export (const|function|class) /gm, '$1 ');
const src = f => strip(fs.readFileSync(path.join(ROOT, 'src/sim', f), 'utf8'));
const lv = fs.readFileSync(path.join(ROOT, 'src/sim/_music_levels.js'), 'utf8'), INDOORS_DB = +(/"classic_interior":(-?[\d.]+)/.exec(lv) || [0, 0])[1];
const CR = await import(path.join(ROOT, 'src/sim/_music_creator.js'));
const NOTE = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const desc = { creator_a: 'Bright and bouncy, the most "video game" of the three: a square-wave hook that climbs up and skips back down, rim clicks and an octave-hopping bass.',
  creator_b: 'Skipping and a little jazzy: a soft triangle tune with a swing, seventh chords like Daytime Streets, a fuller snare and a walking bass.',
  creator_c: 'The fastest and most excited: a short punchy hook with a jump up at the end of each bar, a steady light kick on every beat, a running bass.' };
const rows = CR.CREATOR_IDS.map((id, i) => { const T = CR.CREATOR_TUNES[id], L = 'ABC'[i]; return `<div class="row"><button data-k="${id}">${L}: ${T.title}</button><p>${desc[id]}</p><p class="m">${NOTE[T.key % 12]} major · ${T.bpm} bpm · ${Math.round(T.loop)} s a time round (8-bar hook + 8-bar B part), then it loops</p></div>`; }).join('\n');
const html = `<title>Creator Song</title>
<style>
:root { --bg: #f6f3ee; --card: #ffffff; --ink: #24212b; --dim: #6b6674; --acc: #2f6db3; --accInk: #ffffff; --line: #e2ddd5; --stop: #b8463c; --ref: #5b7a3a; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --bg: #17161b; --card: #222128; --ink: #ece9f1; --dim: #a29dab; --acc: #5d9be0; --accInk: #0d1520; --line: #34323b; --stop: #e0685d; --ref: #8fbf62; } }
:root[data-theme="dark"] { --bg: #17161b; --card: #222128; --ink: #ece9f1; --dim: #a29dab; --acc: #5d9be0; --accInk: #0d1520; --line: #34323b; --stop: #e0685d; --ref: #8fbf62; }
* { box-sizing: border-box; }
html, body { margin: 0; background: var(--bg); color: var(--ink); font: 16px/1.45 system-ui, -apple-system, "Segoe UI", sans-serif; overflow-x: hidden; }
main { max-width: 560px; margin: 0 auto; padding: 20px 16px 40px; }
h1 { font-size: 22px; margin: 0 0 4px; } p.lead { color: var(--dim); margin: 0 0 18px; font-size: 14px; }
.row { background: var(--card); border: 1px solid var(--line); border-radius: 12px; padding: 12px; margin: 0 0 10px; }
.row.b { border-style: dashed; }
button { font: inherit; font-weight: 600; width: 100%; min-height: 46px; border: 0; border-radius: 10px; background: var(--acc); color: var(--accInk); cursor: pointer; padding: 8px 12px; text-align: left; }
.row.b button { background: var(--ref); color: var(--accInk); }
button:active { filter: brightness(.9); } .row p { margin: 8px 2px 0; font-size: 14px; color: var(--dim); } .row p.m { font-size: 13px; margin-top: 4px; }
#stop { background: var(--stop); color: #fff; text-align: center; position: sticky; bottom: 12px; margin-top: 8px; }
h2 { font-size: 15px; color: var(--dim); margin: 22px 0 8px; font-weight: 600; }
#now { font-size: 13px; color: var(--dim); min-height: 1.4em; margin: 6px 2px 0; }
</style>
<main>
<h1>Creator Song</h1>
<p class="lead">Three candidates for the tune that plays while you make your character and pick your first home (instead of the city sounds). All three are written in the old engine of the eight Classics, with the same instruments, and play here through the game's own code at the game's music level. Each one loops until you tap Stop; the first time round always has the tune and the drums, later times round now and then drop the tune for a rippling chord, as the Classics do. Pick the one you like; it is a one-word change in the game.</p>
${rows}
<h2>For comparison</h2>
<div class="row b"><button data-k="classic_interior">Classic: Indoors</button><p>The original indoor loop, exactly as the game plays it (D major, 104 bpm). The candidates are set to the same loudness.</p></div>
<button id="stop">Stop</button>
<div id="now"></div>
</main>
<script>
(function () {
${src('_audio_lib.js')}
${src('_music_classic.js')}
${src('_music_creator.js')}
var INDOORS_DB = ${INDOORS_DB};
var ctx = null, music = null, send = null, ana = null, player = null, cur = null, timer = null, buf = null;
function unlock() {
  if (!ctx) { var C = window.AudioContext || window.webkitAudioContext; if (!C) return false; ctx = A.ctx = new C(); makeBuffers(ctx);
    var comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 4; comp.connect(ctx.destination);
    ana = ctx.createAnalyser(); ana.fftSize = 2048; comp.connect(ana); buf = new Float32Array(2048);
    var master = gain(comp, .8); music = gain(master, .6 * .6); send = creatorEcho(ctx, music); }
  if (ctx.state === 'suspended') ctx.resume(); return true;
}
function tick() { if (!player) return; player.schedule(ctx.currentTime + .45); var q = player.pos(); now.textContent = 'Playing: ' + (cur === 'classic_interior' ? 'Classic: Indoors' : player.song.title.replace('Creator: ', '')) + ' · ' + Math.floor(q.t / 60) + ':' + ('0' + Math.floor(q.t % 60)).slice(-2) + (q.section && cur !== 'classic_interior' ? ' · ' + q.section : ''); }
function stop(fast) { if (player) player.stop(fast ? .25 : .6); player = null; cur = null; }
function play(k) {
  if (!unlock()) { now.textContent = 'This browser has no Web Audio.'; return; } stop(true);
  player = k === 'classic_interior' ? new ClassicPlayer(ctx, k, music, send, { db: INDOORS_DB, fade: 1, passes: 1e6 }) : new CreatorPlayer(ctx, k, music, send, { fade: 1 });
  cur = k; tick(); if (!timer) timer = setInterval(tick, 90); window.__played = (window.__played || []).concat([k]);
}
var now = document.getElementById('now');
document.querySelectorAll('button[data-k]').forEach(function (b) { b.addEventListener('click', function () { play(b.getAttribute('data-k')); }); });
document.getElementById('stop').addEventListener('click', function () { stop(); now.textContent = 'Stopped.'; });
/* for tools/creator_song_page.mjs --check */
function level() { if (!ana) return -200; ana.getFloatTimeDomainData(buf); var e = 0; for (var i = 0; i < buf.length; i++) e += buf[i] * buf[i]; return e > 0 ? 10 * Math.log10(e / buf.length) : -200; }
function render(k, o) { o = o || {}; return (k === 'classic_interior' ? renderClassic(k, 48000, o.db === undefined ? INDOORS_DB : o.db, { passes: o.passes || 3, seed: o.seed }) : renderCreator(k, 48000, { passes: o.passes || 3, seed: o.seed, db: o.db })); }
window.__creator = { level: level, render: render, play: play, stop: stop, TUNES: CREATOR_TUNES, LEVELS: CREATOR_LEVELS, INDOORS_DB: INDOORS_DB, get ctx() { return ctx; } };
})();
</script>
`;
const out = path.join(ROOT, 'docs/audio/creator_song.html'); fs.writeFileSync(out, html); console.log(out, html.length, 'bytes');

if (process.argv.includes('--check')) await check();

async function check() {
  const require = createRequire(ROOT + '/'), { chromium } = require('playwright'), OUT = path.join(ROOT, 'out/creator_song'); fs.mkdirSync(OUT, { recursive: true });
  let fails = 0; const ok = (c, msg, det) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + msg + (det !== undefined ? ': ' + det : '')); };
  const br = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] }), cx = await br.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }), pg = await cx.newPage();
  const errs = [], reqs = []; pg.on('pageerror', e => errs.push(String(e))); pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); pg.on('request', r => { if (!r.url().startsWith('data:') && !r.url().startsWith('about:')) reqs.push(r.url()); });
  await pg.setContent('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>' + html + '</body></html>');
  const sw = await pg.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]); ok(sw[0] <= sw[1], 'no sideways scroll at 390 px', sw.join(' / '));
  for (const k of CR.CREATOR_IDS.concat(['classic_interior'])) {
    await pg.tap(`button[data-k="${k}"]`); await pg.waitForTimeout(2600); const lv = []; for (let i = 0; i < 6; i++) { lv.push(await pg.evaluate(() => window.__creator.level())); await pg.waitForTimeout(150); }
    const txt = await pg.textContent('#now'); ok(Math.max(...lv) > -50, 'button ' + k + ' makes sound (AnalyserNode after the mix)', 'loudest 43 ms block ' + Math.max(...lv).toFixed(1) + ' dBFS; "' + txt + '"');
  }
  await pg.tap('#stop'); await pg.waitForTimeout(3000); const after = await pg.evaluate(() => window.__creator.level()); ok(after < -55, 'Stop silences it (the 0.6 s fade, then only the last echo tail of the notes already sent)', after.toFixed(1) + ' dBFS 3 s later');
  await pg.screenshot({ path: path.join(OUT, 'page_390.png'), fullPage: true });
  /* offline: loudness of each (4 seeds x 3 times round) and the seam */
  const SR = 48000, res = {};
  const grab = (k, o) => pg.evaluate(async ([k, o]) => { const b = await window.__creator.render(k, o), L = b.getChannelData(0), R = b.getChannelData(1), n = L.length, a = new Int16Array(n * 2); let pk = 0;
    for (let i = 0; i < n; i++) { const l = L[i], r = R[i]; if (Math.abs(l) > pk) pk = Math.abs(l); if (Math.abs(r) > pk) pk = Math.abs(r); a[2 * i] = Math.max(-32768, Math.min(32767, Math.round(l * 32767))); a[2 * i + 1] = Math.max(-32768, Math.min(32767, Math.round(r * 32767))); }
    let s = ''; const u = new Uint8Array(a.buffer); for (let i = 0; i < u.length; i += 32768) s += String.fromCharCode.apply(null, u.subarray(i, i + 32768)); return { pcm: btoa(s), peak: pk, n }; }, [k, o]);
  const lufs = (pcm, name) => { const h = Buffer.alloc(44); h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVEfmt ', 8); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(2, 22); h.writeUInt32LE(SR, 24); h.writeUInt32LE(SR * 4, 28); h.writeUInt16LE(4, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
    const f = path.join(OUT, name + '.wav'); fs.writeFileSync(f, Buffer.concat([h, pcm])); const o = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', f, '-af', 'ebur128=peak=true', '-f', 'null', '-'], { encoding: 'utf8' }).stderr, sm = o.slice(o.lastIndexOf('Summary'));
    const o2 = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', f, '-af', 'highpass=f=200,highpass=f=200,ebur128', '-f', 'null', '-'], { encoding: 'utf8' }).stderr; if (!process.argv.includes('--keep')) fs.unlinkSync(f);
    return { I: +(/I:\s+(-?[\d.]+) LUFS/.exec(sm) || [])[1], TP: +(/Peak:\s+(-?[\d.]+) dBFS/.exec(sm) || [])[1], phone: +(/I:\s+(-?[\d.]+) LUFS/.exec(o2.slice(o2.lastIndexOf('Summary'))) || [])[1] }; };
  for (const k of ['classic_interior'].concat(CR.CREATOR_IDS)) {
    const m = []; for (const seed of [1, 2, 3, 4]) { const g = await grab(k, { seed, passes: 3 }), pcm = Buffer.from(g.pcm, 'base64'); m.push(Object.assign(lufs(pcm, k + '_' + seed), { peak: g.peak, secs: g.n / SR })); }
    const mean = a => 10 * Math.log10(a.reduce((s, x) => s + Math.pow(10, x / 10), 0) / a.length);
    res[k] = { I: +mean(m.map(x => x.I)).toFixed(1), Imin: Math.min(...m.map(x => x.I)), Imax: Math.max(...m.map(x => x.I)), TP: Math.max(...m.map(x => x.TP)), peak: +(20 * Math.log10(Math.max(...m.map(x => x.peak)))).toFixed(1), phone: +mean(m.map(x => x.phone)).toFixed(1), secs: +m[0].secs.toFixed(1) };
  }
  const ref = res.classic_interior; console.log('\nClassic: Indoors (trim ' + INDOORS_DB + ' dB): ' + ref.I + ' LUFS (' + ref.Imin + ' .. ' + ref.Imax + '), true peak ' + ref.TP + ' dBTP, sample peak ' + ref.peak + ' dBFS, phone speaker ' + ref.phone + ' LUFS');
  for (const k of CR.CREATOR_IDS) {
    const T = CR.CREATOR_TUNES[k], r = res[k], d = +(ref.I - r.I).toFixed(1);
    console.log(`${k} "${T.title}": ${NOTE[T.key % 12]} major, ${T.bpm} bpm, ${T.prog.length} bars = ${T.loop.toFixed(2)} s a time round; trim ${CR.CREATOR_LEVELS[k]} dB -> ${r.I} LUFS (${r.Imin} .. ${r.Imax}), true peak ${r.TP} dBTP, sample peak ${r.peak} dBFS, phone speaker ${r.phone} LUFS; suggested trim ${(CR.CREATOR_LEVELS[k] + d).toFixed(1)} dB`);
    ok(Math.abs(d) <= 1, k + ' within 1 LU of Classic: Indoors', (d >= 0 ? '+' : '') + d + ' LU'); ok(r.peak < 0 && r.TP <= -1, k + ' no clipping (sample peak < 0 dBFS, true peak <= -1 dBTP)', r.peak + ' / ' + r.TP);
    /* the seam: 2 times round, lead + drums held on by the seed-independent first pass? no: render with a seed, look at 20 ms RMS and the largest sample jump around the join vs. the rest */
    const g = await grab(k, { seed: 5, passes: 2 }), pcm = Buffer.from(g.pcm, 'base64'), n = pcm.length / 4, x = new Float32Array(n); for (let i = 0; i < n; i++) x[i] = (pcm.readInt16LE(i * 4) + pcm.readInt16LE(i * 4 + 2)) / 65536;
    const J = Math.round((.15 + T.loop) * SR), W = Math.round(.02 * SR), rms = (a) => { let e = 0; for (let i = a; i < a + W; i++) e += x[i] * x[i]; return 10 * Math.log10(e / W + 1e-12); };
    const all = []; for (let a = Math.round(.5 * SR); a + W < n - 4 * SR; a += W) all.push(rms(a)); all.sort((p, q) => p - q); const med = all[all.length >> 1];
    const near = [], nearB = []; for (let a = J - 10 * W; a < J + 10 * W; a += W) near.push(rms(a)); const jump = (a, b) => { let m = 0; for (let i = a + 1; i < b; i++) m = Math.max(m, Math.abs(x[i] - x[i - 1])); return m; };
    const jJ = jump(J - 2400, J + 2400), jAll = jump(Math.round(.5 * SR), n - 4 * SR), b9 = Math.round((.15 + T.loop / 2) * SR), jB9 = jump(b9 - 2400, b9 + 2400); for (let a = b9 - 10 * W; a < b9 + 10 * W; a += W) nearB.push(rms(a));
    console.log(`  seam at ${(J / SR).toFixed(2)} s: 20 ms levels around it ${Math.min(...near).toFixed(1)} .. ${Math.max(...near).toFixed(1)} dBFS (median of the whole ${med.toFixed(1)}; around the hook/B bar line ${Math.min(...nearB).toFixed(1)} .. ${Math.max(...nearB).toFixed(1)}: every downbeat is that loud); largest sample step within 50 ms of the join ${jJ.toFixed(4)}, at the hook/B join ${jB9.toFixed(4)}, anywhere ${jAll.toFixed(4)}`);
    ok(jJ <= jAll + 1e-6 && Math.max(...near) < Math.max(...nearB) + 3, k + ' loop seam: no click (no sample step bigger than elsewhere, no level spike above an ordinary bar line)', 'step ' + jJ.toFixed(4) + ' <= ' + jAll.toFixed(4) + ', loudest 20 ms ' + Math.max(...near).toFixed(1) + ' vs ' + Math.max(...nearB).toFixed(1) + ' dBFS');
  }
  ok(!errs.length, 'no page errors', errs.slice(0, 3).join(' | ') || 'none'); ok(!reqs.length, 'no external requests', reqs.slice(0, 3).join(' ') || 'none');
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(res, null, 1)); await br.close(); console.log(fails ? fails + ' FAILED' : 'all passed'); process.exitCode = fails ? 1 : 0;
}
