// Builds docs/audio/plane_sounds.html: a listening page for the three airport sounds (jet, tyre screech, seat-belt chime).
//   node tools/plane_sounds_page.mjs
// The page runs the GAME'S OWN code: src/sim/_audio_lib.js and src/sim/_audio_plane.js are copied in (imports / exports stripped), so what you hear
// is what the game plays. The landing is the game's own path (src/sim/planes.js: approach from x 474 at 24 tiles/s, touchdown at x 356, roll slowing
// 5 tiles/s per s to 9) with the game's distance model; the level matches the game's mix (Master 0.8 x Effects 0.8, the same compressor).
// The page content only (no doctype / html / head / body): it is published as a claude.ai artifact.
import fs from 'node:fs'; import path from 'node:path'; import { ROOT } from './artfiles.mjs';
const strip = s => s.replace(/^import .*$/gm, '').replace(/^export (const|function|class) /gm, '$1 ');
const lib = strip(fs.readFileSync(path.join(ROOT, 'src/sim/_audio_lib.js'), 'utf8')), snd = strip(fs.readFileSync(path.join(ROOT, 'src/sim/_audio_plane.js'), 'utf8'));
const B = [
  ['land', 'Jet: approach and landing', 'Standing by the runway, near the touchdown point: the airliner comes in (about 5 s), touches down, reverse thrust, then rolls out and fades. About 11 s. Jet only. This is the chosen jet (the turbine-whine take, owner msg 226).'],
  ['far', 'Jet: heard from downtown', 'The same landing at the game\'s volume for downtown (about 250 tiles away): a faint low rumble. Turn your volume up to hear it. About 11 s.'],
  ['screech', 'Tyre screech', 'The main wheels touching the runway: two quick chirps and a soft thump. About 0.3 s.'],
  ['both', 'Jet + screech together at touchdown', 'From 2 s before touchdown to 3 s after, by the runway: the screech lands exactly as the wheels touch, under the jet. About 5 s.'],
  ['chime', 'Seat-belt chime', 'The cabin "ding dong" when the scene cuts inside the plane: a high soft bell, then one a major third lower. About 0.9 s (the tail rings a little longer).'],
  ['landB', 'First take (not chosen): jet with less whine', 'The first version, kept for reference: the same landing with a lower, quieter turbine whine. The owner chose the brighter one above (msg 226). About 11 s.'],
  ['screechB', 'Variant B: softer, longer screech', 'One lower, smoother squeal instead of two quick chirps. About 0.4 s.'],
  ['chimeB', 'Variant B: lower, rounder chime', 'E then C instead of A then F: warmer, a little slower. About 1.1 s.'],
];
const html = `<title>Plane Sounds</title>
<style>
:root { --bg: #f6f3ee; --card: #ffffff; --ink: #24212b; --dim: #6b6674; --acc: #2f6db3; --accInk: #ffffff; --line: #e2ddd5; --stop: #b8463c; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --bg: #17161b; --card: #222128; --ink: #ece9f1; --dim: #a29dab; --acc: #5d9be0; --accInk: #0d1520; --line: #34323b; --stop: #e0685d; } }
:root[data-theme="dark"] { --bg: #17161b; --card: #222128; --ink: #ece9f1; --dim: #a29dab; --acc: #5d9be0; --accInk: #0d1520; --line: #34323b; --stop: #e0685d; }
* { box-sizing: border-box; }
html, body { margin: 0; background: var(--bg); color: var(--ink); font: 16px/1.45 system-ui, -apple-system, "Segoe UI", sans-serif; overflow-x: hidden; }
main { max-width: 560px; margin: 0 auto; padding: 20px 16px 40px; }
h1 { font-size: 22px; margin: 0 0 4px; } p.lead { color: var(--dim); margin: 0 0 18px; font-size: 14px; }
.row { background: var(--card); border: 1px solid var(--line); border-radius: 12px; padding: 12px; margin: 0 0 10px; }
.row.b { border-style: dashed; }
button { font: inherit; font-weight: 600; width: 100%; min-height: 46px; border: 0; border-radius: 10px; background: var(--acc); color: var(--accInk); cursor: pointer; padding: 8px 12px; text-align: left; }
button:active { filter: brightness(.9); } .row p { margin: 8px 2px 0; font-size: 14px; color: var(--dim); }
#stop { background: var(--stop); color: #fff; text-align: center; position: sticky; bottom: 12px; margin-top: 8px; }
h2 { font-size: 15px; color: var(--dim); margin: 22px 0 8px; font-weight: 600; }
#now { font-size: 13px; color: var(--dim); min-height: 1.4em; margin: 6px 2px 0; }
</style>
<main>
<h1>Plane Sounds</h1>
<p class="lead">The three new airport sounds, played by the game's own sound code. Nothing here is a recording: all of it is made on the spot from shaped noise and tones. Tap a button to listen; headphones help for the far-away one.</p>
${B.slice(0, 5).map(([k, l, d]) => `<div class="row"><button data-k="${k}">${l}</button><p>${d}</p></div>`).join('\n')}
<h2>Other takes to compare</h2>
${B.slice(5).map(([k, l, d]) => `<div class="row b"><button data-k="${k}">${l}</button><p>${d}</p></div>`).join('\n')}
<button id="stop">Stop</button>
<div id="now"></div>
</main>
<script>
(function () {
${lib}
${snd}
/* the game's landing (src/sim/planes.js + world/_airport.js): runway on y 28 from x 276 to 380, approach from x 474 at 24 tiles/s, touchdown at x 356 */
var TD = 356, FROM = 474, RA = 276, LEN = 6;
function path(dt) {
  var f = { kind: 'land', phase: 'air', cx: FROM, cy: 28, alt: 0, v: 24, t: 0, td: 0, fade: 1 }, out = [];
  for (var i = 0; i < 2000; i++) {
    f.t += dt;
    if (f.phase === 'air') { f.cx -= f.v * dt; var d = f.cx - TD; if (d <= 0) { f.alt = 0; f.phase = 'roll'; f.td = f.t; f.touch = 1; } else f.alt = d * .13 * (d < 14 ? .45 + .55 * d / 14 : 1); }
    else { f.v = Math.max(9, f.v - 5 * dt); f.cx -= f.v * dt; if (f.cx < RA + LEN / 2 + 4 + 12) { f.fade -= dt / 1.2; if (f.fade <= 0) break; } }
    out.push({ t: f.t, cx: f.cx, cy: f.cy, alt: f.alt, fade: f.fade, thrust: thrustOf(f), touch: f.touch }); f.touch = 0;
  }
  return out;
}
var ctx = null, bus = null, live = [];
function start() {
  if (!ctx) { var C = window.AudioContext || window.webkitAudioContext; ctx = A.ctx = new C(); makeBuffers(ctx); var comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 4; comp.connect(ctx.destination); ctx.comp = comp; }
  if (ctx.state === 'suspended') ctx.resume();
  stop(); bus = gain(ctx.comp, .64); return ctx.currentTime + .08;
}
function stop() { if (bus) { var b = bus; try { b.gain.setTargetAtTime(0, ctx.currentTime, .03); } catch (e) {} setTimeout(function () { try { b.disconnect(); } catch (e) {} }, 300); } bus = null; live.forEach(function (j) { try { j.stop(); } catch (e) {} }); live = []; }
/* a landing heard from (lx, ly): the jet steered 30 times a second, as the game does every frame; from / to: seconds around touchdown (null = all) */
function landing(t0, lx, ly, o, withScreech, from, to) {
  var P = path(1 / 30), j = new Jet(bus, o || {}); live.push(j); var tdT = 0; P.forEach(function (s) { if (s.touch) tdT = s.t; });
  var a = from == null ? 0 : tdT + from, b = to == null ? 1e9 : tdT + to;
  P.forEach(function (s) {
    if (s.t < a || s.t > b) return; var t = t0 + s.t - a, d = Math.hypot(s.cx - lx, s.cy - ly, s.alt);
    j.set(hear(d) * s.fade * .9, s.thrust, d, (s.cx - lx - (s.cy - ly)) / 60, t);
    if (s.touch && withScreech) screech(gain(bus, Math.min(1.5, hear(d) * 1.1)), t, 1);
  });
  var end = t0 + Math.min(b, P[P.length - 1].t) - a; j.set(0, .2, 50, 0, end); setTimeout(function () { try { j.stop(); } catch (e) {} }, (end - ctx.currentTime + .3) * 1000);
  return end - t0;
}
var PLAY = {
  land: function (t) { return landing(t, 350, 46, null, false); },
  far: function (t) { return landing(t, 212, 250, null, false); },
  screech: function (t) { screech(bus, t, 1); return .4; },
  both: function (t) { return landing(t, 350, 46, null, true, -2, 3); },
  chime: function (t) { seatbelt(bus, t, 1); return 1.2; },
  landB: function (t) { return landing(t, 350, 46, { whine: 1 / 2.4, pitch: 1 / 1.2 }, false); },
  screechB: function (t) { screechB(bus, t, 1); return .5; },
  chimeB: function (t) { seatbeltB(bus, t, 1); return 1.5; },
};
var now = document.getElementById('now');
document.querySelectorAll('button[data-k]').forEach(function (btn) { btn.addEventListener('click', function () { var t = start(), k = btn.getAttribute('data-k'), len = PLAY[k](t); now.textContent = 'Playing: ' + btn.textContent + ' (' + len.toFixed(1) + ' s)'; window.__played = (window.__played || []).concat([k]); }); });
document.getElementById('stop').addEventListener('click', function () { stop(); now.textContent = 'Stopped.'; });
/* for tools/plane_check.mjs: render one button offline (same chain: bus 0.64 -> compressor) and return the samples */
function render(k, secs) {
  var keep = [ctx, bus, A.white, A.pink, A.brown], oc = new OfflineAudioContext(1, Math.round(48000 * secs), 48000); ctx = A.ctx = oc; makeBuffers(oc);
  var comp = oc.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 4; comp.connect(oc.destination); bus = gain(comp, .64); live = [];
  var len = PLAY[k](.05); live = []; ctx = keep[0]; bus = keep[1]; A.ctx = ctx; A.white = keep[2]; A.pink = keep[3]; A.brown = keep[4];
  return oc.startRendering().then(function (b) { return { len: len, data: b.getChannelData(0) }; });
}
window.__plane = { render: render, PLAY: PLAY, path: path, start: start, stop: stop, get ctx() { return ctx; }, get bus() { return bus; }, A: A, makeBuffers: makeBuffers, gain: gain, Jet: Jet, hear: hear, landing: landing };
})();
</script>
`;
const out = path.join(ROOT, 'docs/audio/plane_sounds.html'); fs.writeFileSync(out, html); console.log(out, html.length, 'bytes');
