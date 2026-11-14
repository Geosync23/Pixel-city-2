// Tiny self-contained WebAudio sequencer for the performance venues (private helper of shows.js). Everything is synthesised; all calls are
// safe without an audio device (AU.dead) and before the first user gesture (unlock() is called from pointer/key events).
// A score is { dur (s), tracks: [{ inst, sec: [section keys], gain, notes: [[t, midi, dur, vel]] sorted by t }] } — see _shows_music.js.
export const AU = { ctx: null, out: null, noise: null, vol: .55, dead: false, live: [] };
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
export function unlock() {
  if (AU.dead) return null;
  try {
    if (!AU.ctx) {
      const C = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext); if (!C) { AU.dead = true; return null; }
      const c = AU.ctx = new C(), comp = c.createDynamicsCompressor(); AU.out = c.createGain(); AU.out.gain.value = AU.vol; AU.out.connect(comp); comp.connect(c.destination);
      const n = c.sampleRate, b = c.createBuffer(1, n, n), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; AU.noise = b;
    }
    if (AU.ctx.state === 'suspended') { const p = AU.ctx.resume(); if (p && p.catch) p.catch(() => { }); }
  } catch (e) { AU.dead = true; AU.ctx = null; }
  return AU.ctx;
}
export function setVolume(v) { AU.vol = v; try { if (AU.out) AU.out.gain.value = v; } catch (e) { } }
const INST = {
  str: { type: 'sawtooth', a: .07, r: .14, lp: 2300, vib: 3, v: .09 }, pizz: { type: 'triangle', a: .004, d: .28, v: .22 }, wind: { type: 'triangle', a: .04, r: .08, vib: 2, v: .15 },
  reed: { type: 'square', a: .03, r: .07, lp: 1700, v: .06 }, brass: { type: 'sawtooth', a: .04, r: .1, lp: 1400, v: .1 }, harp: { type: 'triangle', a: .003, d: .8, v: .16 },
  piano: { type: 'triangle', a: .003, d: 1, v: .18 }, bass: { type: 'triangle', a: .02, r: .1, lp: 700, v: .26 }, lead: { type: 'sine', a: .05, r: .12, vib: 5, v: .2 }, synth: { type: 'square', a: .008, d: .22, lp: 2000, v: .06 },
};
function burst(dest, t, o) { const c = AU.ctx, s = c.createBufferSource(), g = c.createGain(), f = c.createBiquadFilter(); s.buffer = AU.noise; s.loop = true; f.type = o.ft || 'bandpass'; f.frequency.value = o.f || 1500; f.Q.value = o.q || .8; s.connect(f); f.connect(g); g.connect(dest); g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(o.v, t + (o.a || .003)); g.gain.exponentialRampToValueAtTime(.0001, t + (o.a || .003) + o.d); s.start(t, Math.random() * .8); s.stop(t + (o.a || .003) + o.d + .05); }
/** one note. inst: key of INST | 'timp' | 'cym' | 'snare' */
export function note(inst, midi, t, dur, vel, dest) {
  const c = AU.ctx; if (!c) return; dest = dest || AU.out; vel = vel === undefined ? .8 : vel;
  try {
    if (inst === 'timp') { const o = c.createOscillator(), g = c.createGain(), f = mtof(midi); o.type = 'sine'; o.frequency.setValueAtTime(f * 1.5, t); o.frequency.exponentialRampToValueAtTime(f, t + .06); o.connect(g); g.connect(dest); g.gain.setValueAtTime(.5 * vel, t); g.gain.exponentialRampToValueAtTime(.0001, t + .7); o.start(t); o.stop(t + .75); burst(dest, t, { f: 300, v: .25 * vel, d: .08, ft: 'lowpass' }); return; }
    if (inst === 'cym') return burst(dest, t, { f: 7000, ft: 'highpass', v: .3 * vel, d: 1.6 });
    if (inst === 'snare') return burst(dest, t, { f: 2200, v: .22 * vel, d: .09 });
    const I = INST[inst] || INST.wind, o = c.createOscillator(), g = c.createGain(); o.type = I.type; o.frequency.value = mtof(midi); let out = dest;
    if (I.lp) { const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = I.lp; f.connect(dest); out = f; }
    o.connect(g); g.connect(out); const v = I.v * vel; let end;
    if (I.d) { g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(v, t + I.a); g.gain.exponentialRampToValueAtTime(.0001, t + I.a + Math.max(I.d, dur * .9)); end = t + I.a + Math.max(I.d, dur * .9) + .05; }
    else { g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(v, t + I.a); g.gain.setValueAtTime(v, t + Math.max(I.a, dur)); g.gain.linearRampToValueAtTime(.0001, t + Math.max(I.a, dur) + I.r); end = t + Math.max(I.a, dur) + I.r + .05; }
    if (I.vib && dur > .3) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = 5.5; lg.gain.value = I.vib; l.connect(lg); lg.connect(o.frequency); l.start(t + .15); l.stop(end); }
    o.start(t); o.stop(end);
  } catch (e) { }
}
/**
 * Start a score. Returns a handle driven by the show clock: call h.pump(t) every frame with the show time in seconds (notes are scheduled a
 * little ahead; activity is tracked even when there is no audio). h.sec[key] = { n: notes started so far, on: sounding now }. o: { rate, gain }
 */
export function play(score, o = {}) {
  const rate = o.rate || 1, mute = rate > 2.5; let g = null; try { if (AU.ctx && !mute) { g = AU.ctx.createGain(); g.gain.value = o.gain === undefined ? 1 : o.gain; g.connect(AU.out); } } catch (e) { g = null; }
  const cur = score.tracks.map(() => 0), sched = score.tracks.map(() => 0), until = score.tracks.map(() => 0), h = { score, sec: {}, done: false, t: 0,
    pump(t) {
      h.t = t; const c = g && AU.ctx && AU.ctx.state === 'running' ? AU.ctx : null, now = c ? c.currentTime : 0;
      for (const k in h.sec) h.sec[k].on = false;
      for (let i = 0; i < score.tracks.length; i++) {
        const tr = score.tracks[i], N = tr.notes;
        while (sched[i] < N.length && N[sched[i]][0] < t + .2) { const n = N[sched[i]++]; if (c && n[0] > t - .15) note(tr.inst, n[1], now + Math.max(0, (n[0] - t) / rate) + .02, n[2] / rate, (n[3] === undefined ? .8 : n[3]) * (tr.gain || 1), g); }
        let hit = 0; while (cur[i] < N.length && N[cur[i]][0] <= t) { const n = N[cur[i]++]; until[i] = Math.max(until[i], n[0] + Math.max(.18, n[2])); hit++; }
        for (const k of tr.sec || []) { const s = h.sec[k] || (h.sec[k] = { n: 0, on: false }); s.n += hit; if (t < until[i]) s.on = true; }
      }
      if (t >= score.dur) h.done = true;
    },
    stop(fade = .4) { h.done = true; try { if (g && AU.ctx) { g.gain.setValueAtTime(g.gain.value, AU.ctx.currentTime); g.gain.linearRampToValueAtTime(.0001, AU.ctx.currentTime + fade); setTimeout(() => { try { g.disconnect(); } catch (e) { } }, fade * 1000 + 300); } } catch (e) { } } };
  return h;
}
/** one-shot effects: applause (dur s), laugh, gasp, bell, tune (oboe A + swell), hush */
export function sfx(name, dur = 4, vel = 1) {
  const c = AU.ctx; if (!c || c.state !== 'running') return;
  try {
    const t = c.currentTime + .03, d = AU.out;
    if (name === 'applause') { const n = Math.floor(dur * 38); for (let i = 0; i < n; i++) { const u = Math.random(), tt = t + u * dur, env = Math.min(1, u * 6) * Math.min(1, (1 - u) * 2.5); burst(d, tt, { f: 900 + Math.random() * 1800, q: 1.2, v: .1 * env * vel, d: .035 }); } burst(d, t, { f: 1200, q: .4, v: .05 * vel, a: .4, d: dur }); }
    else if (name === 'laugh') { for (let i = 0; i < 14; i++) { const tt = t + Math.random() * .9 + (i % 4) * .13; burst(d, tt, { f: 500 + Math.random() * 600, q: 3, v: .09 * vel, d: .09 }); } }
    else if (name === 'gasp') burst(d, t, { f: 2600, q: .7, v: .12 * vel, a: .25, d: .5 });
    else if (name === 'hush') burst(d, t, { f: 5000, ft: 'highpass', v: .05 * vel, a: .2, d: .8 });
    else if (name === 'bell') { note('piano', 76, t, .6, .9); note('piano', 72, t + .45, .9, .9); }
    else if (name === 'tune') { note('reed', 69, t, 2.2, 1.1); [57, 64, 69, 62, 55, 76].forEach((m, i) => note('str', m, t + 1 + i * .32, 3.2 - i * .3, .6)); note('brass', 57, t + 2.4, 1.4, .4); note('wind', 81, t + 2, 1.6, .5); }
  } catch (e) { }
}
