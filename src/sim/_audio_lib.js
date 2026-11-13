// Private synth helpers for src/sim/audio.js (Web Audio, everything synthesised; no assets).
// A.ctx is the shared AudioContext (null until unlocked / when audio is unavailable).
export const A = { ctx: null, white: null, pink: null, brown: null };

export const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
export const rand = (a, b) => a + Math.random() * (b - a);
export const pick = arr => arr[(Math.random() * arr.length) | 0];
/** small deterministic PRNG (music generation is seeded so tunes are stable) */
export function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

/** three looping noise buffers (white / pink / brown), 3 s each, created once */
export function makeBuffers(ctx) {
  const n = (ctx.sampleRate * 3) | 0, mk = () => ctx.createBuffer(1, n, ctx.sampleRate);
  const w = mk(), p = mk(), b = mk(), wd = w.getChannelData(0), pd = p.getChannelData(0), bd = b.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0;
  for (let i = 0; i < n; i++) {
    const x = Math.random() * 2 - 1; wd[i] = x;
    b0 = .99886 * b0 + x * .0555179; b1 = .99332 * b1 + x * .0750759; b2 = .969 * b2 + x * .153852; b3 = .8665 * b3 + x * .3104856; b4 = .55 * b4 + x * .5329522; b5 = -.7616 * b5 - x * .016898;
    pd[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + x * .5362) * .11; b6 = x * .115926;
    last = (last + .02 * x) / 1.02; bd[i] = last * 3.5;
  }
  // smooth the loop seam a little
  for (const d of [wd, pd, bd]) for (let i = 0; i < 256; i++) { const k = i / 256; d[n - 256 + i] = d[n - 256 + i] * (1 - k) + d[i] * k; }
  A.white = w; A.pink = p; A.brown = b;
}

export function gain(dest, v = 1) { const g = A.ctx.createGain(); g.gain.value = v; if (dest) g.connect(dest); return g; }
export function filt(dest, type, f, q = .7) { const b = A.ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; if (dest) b.connect(dest); return b; }
export function panner(dest, pan) { const c = A.ctx; if (!c.createStereoPanner) return dest; const p = c.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan)); p.connect(dest); return p; }

/** attack / hold / exponential decay on a gain param */
export function envelope(param, t, a, h, d, v) {
  param.setValueAtTime(.0001, t); param.linearRampToValueAtTime(v, t + a);
  if (h > 0) param.setValueAtTime(v, t + a + h);
  param.exponentialRampToValueAtTime(.0001, t + a + h + d);
}
/** frequency movement: f2 (exp glide) or pts [[dt, f], ...] (linear segments) */
function moveFreq(param, t, o, total) {
  if (o.pts) { for (const [dt, f] of o.pts) param.linearRampToValueAtTime(f, t + dt); }
  else if (o.f2) param.exponentialRampToValueAtTime(Math.max(1, o.f2), t + (o.glide || total));
}

/**
 * Oscillator voice. o: { type, f, f2|pts, glide, a, h, d, v, lp, q, detune, vib: [rate, depth Hz] }
 */
export function tone(dest, t, o) {
  const c = A.ctx, a = o.a ?? .005, h = o.h || 0, d = o.d ?? .2, osc = c.createOscillator(), g = c.createGain();
  osc.type = o.type || 'sine'; osc.frequency.setValueAtTime(o.f, t); moveFreq(osc.frequency, t, o, a + h + d);
  if (o.detune) osc.detune.value = o.detune;
  let out = dest; if (o.lp) out = filt(dest, 'lowpass', o.lp, o.q ?? .7);
  osc.connect(g); g.connect(out); envelope(g.gain, t, a, h, d, o.v ?? .3);
  const end = t + a + h + d + .05;
  if (o.vib) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = o.vib[0]; lg.gain.value = o.vib[1]; l.connect(lg); lg.connect(osc.frequency); l.start(t); l.stop(end); }
  osc.start(t); osc.stop(end);
  return osc;
}

/**
 * Filtered noise burst. o: { buf: 'white'|'pink'|'brown', ft: filter type, f, f2|pts, glide, q, a, h, d, v, rate }
 */
export function noise(dest, t, o) {
  const c = A.ctx, a = o.a ?? .003, h = o.h || 0, d = o.d ?? .1, s = c.createBufferSource(), g = c.createGain();
  s.buffer = A[o.buf || 'white']; s.loop = true; if (o.rate) s.playbackRate.value = o.rate;
  g.connect(dest); let node = g;
  if (o.ft) { const b = c.createBiquadFilter(); b.type = o.ft; b.frequency.setValueAtTime(o.f, t); moveFreq(b.frequency, t, o, a + h + d); b.Q.value = o.q ?? .7; b.connect(g); node = b; }
  s.connect(node); envelope(g.gain, t, a, h, d, o.v ?? .3);
  s.start(t, Math.random() * 2.5); s.stop(t + a + h + d + .05);
  return s;
}

/** looping noise source (for ambience beds), returns the source */
export function loopNoise(dest, buf, rate = 1) { const s = A.ctx.createBufferSource(); s.buffer = A[buf]; s.loop = true; s.playbackRate.value = rate; s.connect(dest); s.start(A.ctx.currentTime, Math.random() * 2.5); return s; }
/** slow LFO that wobbles a param: returns the oscillator */
export function lfo(param, rate, depth, type = 'sine') { const o = A.ctx.createOscillator(), g = A.ctx.createGain(); o.type = type; o.frequency.value = rate; g.gain.value = depth; o.connect(g); g.connect(param); o.start(); return o; }
