// Private: the instruments of the background music (src/sim/_music_engine.js plays them; docs/audio/jukebox.html uses this same file).
// Everything is synthesised and CLEAN (owner msgs 111-118: nothing that reads as white noise or hiss):
//   - pitched voices are one or two oscillators with a custom PeriodicWave (a fixed harmonic recipe per instrument) and a gain envelope;
//   - the only noise is in the drum kit: one 0.25 s buffer, used for bursts of 15-130 ms (hat <= 35 ms, shaker 40 ms, brush 90 ms, snare 130 ms), all quiet.
//     There is no crackle, no wash, no riser, no looping noise source: tools/music_check.mjs measures every tune for it.
// No game imports: a Synth works on any (Offline)AudioContext.
export const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;

/* harmonic recipes (amplitude of harmonic 1, 2, 3 ...) */
const W = {
  ep: [1, .42, .12, .18, .04, .05, .02], pno: [1, .52, .3, .2, .12, .09, .06, .04, .03, .02], nyl: [1, .48, .3, .14, .09, .05, .03], stl: [1, .7, .5, .38, .28, .2, .14, .1, .07, .05],
  eg: [1, .6, .4, .24, .18, .1, .07, .04], ub: [1, .85, .5, .3, .15, .08, .04], eb: [1, .62, .45, .3, .2, .12, .08, .05], sb: [1, .5, .33, .25, .2, .16, .13, .11, .09],
  vib: [1, 0, 0, .3, 0, 0, 0, 0, 0, .06], mar: [1, .05, 0, .34, 0, 0, 0, 0, 0, .04], mb: [1, .04, .22, 0, .1, 0, 0, .05], cel: [1, .22, .08, .02, .04],
  brs: [1, .75, .58, .42, .3, .2, .13, .08, .05, .03], clr: [1, .03, .52, .03, .28, .02, .13, 0, .06], flt: [1, .42, .12, .06, .02], str: [1, .6, .42, .3, .22, .16, .12, .09, .06, .04],
  pad: [1, .3, .1, .04], org: [1, .8, .45, .38, 0, .22, 0, .16], acc: [1, .7, .58, .5, .42, .3, .24, .17, .11, .07], pan: [1, .6, .3, .16, .04, .05],
  chp: [1, 0, .33, 0, .2, 0, .14, 0, .1], pls: [1, .7, .33, 0, .2, .23, .14], ld: [1, .5, .33, .25, .2, .16, .13, .1], hrp: [1, .4, .2, .1, .05, .03], brt: [1, .8, .7, .6, .5, .4, .3, .2, .14, .1],
};
/* instruments. w wave, a attack s, d decay time (to the sustain level s), r release, v level, rg rings at least this long (mallets, plucks),
   det detuned twin (cents), vib [rate Hz, depth cents], x extra short layer { w, m freq multiple, v, d }, lp channel low-pass Hz, snd echo send, pan */
export const INST = {
  ep: { w: 'ep', a: .004, d: 1.6, s: .1, r: .16, v: .2, x: { w: 'sine', m: 4, v: .22, d: .14 }, snd: .12, pan: -.12, name: 'electric piano' },
  piano: { w: 'pno', a: .003, d: 1.5, s: .04, r: .14, v: .2, x: { w: 'brt', m: 1, v: .25, d: .05 }, snd: .08, pan: -.08, name: 'piano' },
  nylon: { w: 'nyl', a: .003, d: .9, s: 0, r: .1, v: .22, rg: .5, x: { w: 'brt', m: 1, v: .3, d: .045 }, snd: .1, pan: .15, name: 'nylon guitar' },
  steel: { w: 'stl', a: .003, d: 1.2, s: 0, r: .1, v: .15, rg: .6, snd: .1, pan: .15, name: 'steel-string guitar' },
  eguitar: { w: 'eg', a: .003, d: 1.1, s: .05, r: .1, v: .17, rg: .3, vib: [5.5, 7], snd: .45, pan: .12, name: 'clean electric guitar' },
  upright: { w: 'ub', a: .012, d: .55, s: .05, r: .08, v: .3, x: { w: 'brt', m: 1, v: .12, d: .03 }, ks: .1, name: 'upright bass' },
  ebass: { w: 'eb', a: .006, d: .8, s: .3, r: .07, v: .26, ks: .1, name: 'electric bass' },
  sbass: { w: 'sb', a: .008, d: .3, s: .55, r: .06, v: .2, lp: 1100, ks: .1, name: 'synth bass' },
  vibes: { w: 'vib', a: .003, d: 2.2, s: 0, r: .25, v: .22, rg: 1.1, snd: .22, pan: .1, name: 'vibraphone' },
  marimba: { w: 'mar', a: .002, d: .4, s: 0, r: .08, v: .26, rg: .3, x: { w: 'sine', m: 9.2, v: .1, d: .02 }, snd: .12, pan: .1, name: 'marimba' },
  musicbox: { w: 'mb', a: .002, d: 1.3, s: 0, r: .3, v: .17, rg: 1, x: { w: 'sine', m: 5.4, v: .16, d: .07 }, snd: .3, name: 'music box' },
  celesta: { w: 'cel', a: .002, d: .9, s: 0, r: .2, v: .2, rg: .7, snd: .25, pan: -.1, name: 'celesta' },
  brass: { w: 'brs', a: .045, d: .3, s: .8, r: .1, v: .1, det: 7, lp: 1900, vib: [5, 6], snd: .15, name: 'soft brass' },
  clarinet: { w: 'clr', a: .035, d: .3, s: .85, r: .08, v: .15, vib: [4.8, 6], snd: .2, name: 'clarinet' },
  flute: { w: 'flt', a: .05, d: .3, s: .85, r: .1, v: .2, vib: [5, 11], snd: .25, name: 'flute' },
  strings: { w: 'str', a: .22, d: .5, s: .9, r: .45, v: .055, det: 10, lp: 2100, ks: .15, name: 'strings' },
  pad: { w: 'pad', a: .5, d: .5, s: 1, r: .9, v: .085, det: 7, ks: .15, name: 'warm pad' },
  organ: { w: 'org', a: .012, d: .2, s: .95, r: .06, v: .075, vib: [6.2, 5], lp: 2600, ks: .2, name: 'organ' },
  accordion: { w: 'acc', a: .03, d: .3, s: .9, r: .07, v: .06, det: 13, lp: 2800, ks: .2, snd: .08, name: 'accordion' },
  steelpan: { w: 'pan', a: .003, d: .55, s: 0, r: .12, v: .24, rg: .45, x: { w: 'sine', m: 2, v: .2, d: .1 }, snd: .2, pan: .08, name: 'steel pan' },
  chip: { w: 'chp', a: .004, d: .25, s: .6, r: .05, v: .085, lp: 3200, snd: .15, name: 'soft square lead' },
  pulse: { w: 'pls', a: .004, d: .2, s: .5, r: .05, v: .07, lp: 3000, pan: -.1, name: 'pulse keys' },
  lead: { w: 'ld', a: .02, d: .4, s: .75, r: .1, v: .085, lp: 2300, vib: [5.2, 8], snd: .25, name: 'synth lead' },
  whistle: { w: 'sine', a: .04, d: .3, s: .9, r: .09, v: .17, vib: [5.5, 14], snd: .3, name: 'whistle' },
  harp: { w: 'hrp', a: .003, d: 1.4, s: 0, r: .25, v: .22, rg: .9, snd: .2, pan: .12, name: 'harp' },
};
const WAVES = new WeakMap(), NOISE = new WeakMap();
function wave(c, k) { let m = WAVES.get(c); if (!m) WAVES.set(c, m = {}); if (!m[k]) { const h = W[k], re = new Float32Array(h.length + 1), im = new Float32Array(h.length + 1); for (let i = 0; i < h.length; i++) im[i + 1] = h[i]; m[k] = c.createPeriodicWave(re, im); } return m[k]; }
function noiseBuf(c) { let b = NOISE.get(c); if (!b) { const n = (c.sampleRate * .25) | 0; b = c.createBuffer(1, n, c.sampleRate); const d = b.getChannelData(0); let s = 12345; for (let i = 0; i < n; i++) { s = (s * 1103515245 + 12345) & 0x7fffffff; d[i] = s / 0x3fffffff - 1; } NOISE.set(c, b); } return b; }

export class Synth {
  /** dest: where the dry sound goes; send: input of an echo (may be null) */
  constructor(ctx, dest, send) { this.c = ctx; this.dest = dest; this.send = send; this.ch = {}; this.nodes = 0; }
  chan(name) {
    let ch = this.ch[name]; if (ch) return ch; const c = this.c, I = INST[name] || {}, g = c.createGain(); let out = this.dest;
    if (I.pan && c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = I.pan; p.connect(out); out = p; }
    if (I.lp) { const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = I.lp; f.Q.value = .5; f.connect(out); out = f; }
    g.connect(out); if (I.snd && this.send) { const s = c.createGain(); s.gain.value = I.snd; g.connect(s); s.connect(this.send); }
    return this.ch[name] = g;
  }
  osc(w, f, t, end, dest, det) { const c = this.c, o = c.createOscillator(); if (W[w]) o.setPeriodicWave(wave(c, w)); else o.type = w; o.frequency.value = f; if (det) o.detune.value = det; o.connect(dest); o.start(t); o.stop(end); this.nodes++; return o; }
  /** one note: instrument key, start time, midi pitch, length in seconds, velocity 0..1.3 */
  note(name, t, m, dur, vel = 1) {
    const I = INST[name]; if (!I) return; const c = this.c, ch = this.chan(name), f = mtof(m), k = 262 / f;
    const v = I.v * vel * clamp(Math.pow(k, I.ks === undefined ? .3 : I.ks), .5, 1.7), a = Math.min(I.a, dur * .5 + .002), tau = I.d * clamp(Math.pow(k, .4), .45, 1.8) / 3, s = I.s || 0, r = I.r;
    const off = t + Math.max(dur, a + .01, I.rg ? Math.min(I.rg, dur + I.rg * .6) : 0), L = v * (s + (1 - s) * Math.exp(-(off - t - a) / tau)), end = off + r + .03, g = c.createGain(), p = g.gain;
    p.setValueAtTime(0, t); p.linearRampToValueAtTime(v, t + a); p.setTargetAtTime(v * s, t + a, tau); p.setValueAtTime(L, off); p.linearRampToValueAtTime(0, off + r); g.connect(ch);
    const o = this.osc(I.w, f, t, end, g, I.det ? -I.det / 2 : 0), os = [o]; if (I.det) os.push(this.osc(I.w, f, t, end, g, I.det / 2));
    if (I.vib && dur > .32) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = I.vib[0]; lg.gain.setValueAtTime(0, t + .12); lg.gain.linearRampToValueAtTime(I.vib[1], t + .4); l.connect(lg); for (const x of os) lg.connect(x.detune); l.start(t); l.stop(end); }
    if (I.x) { const X = I.x, g2 = c.createGain(); g2.gain.setValueAtTime(v * X.v, t); g2.gain.exponentialRampToValueAtTime(.0001, t + X.d); g2.connect(ch); this.osc(X.w, f * X.m, t, t + X.d + .02, g2); }
  }
  burst(t, ft, f, q, d, v, dest) { const c = this.c, s = c.createBufferSource(), b = c.createBiquadFilter(), g = c.createGain(); s.buffer = noiseBuf(c); b.type = ft; b.frequency.value = f; b.Q.value = q; s.connect(b); b.connect(g); g.connect(dest);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + .002); g.gain.exponentialRampToValueAtTime(.0001, t + d); s.start(t, (this.nodes++ * .0137) % .1); s.stop(t + d + .01); }
  ping(t, type, f, f2, d, v, dest, a = .002) { const c = this.c, o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d * .6); o.connect(g); g.connect(dest);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + a); g.gain.exponentialRampToValueAtTime(.0001, t + a + d); o.start(t); o.stop(t + a + d + .02); this.nodes++; }
  /** drum hit. k kick, s snare, r rim, b brush, h hat, m shaker, c clap, g ride "ting" (three sines, no noise), w woodblock, t / T low / high conga, o tom */
  drum(n, t, vel = 1) {
    const d = this.chan('kit');
    if (n === 'k') { this.ping(t, 'sine', 118, 46, .2, .5 * vel, d); this.ping(t, 'triangle', 170, 70, .07, .16 * vel, d); }
    else if (n === 's') { this.ping(t, 'triangle', 196, 160, .09, .16 * vel, d); this.burst(t, 'bandpass', 1900, .8, .13, .1 * vel, d); }
    else if (n === 'r') { this.ping(t, 'sine', 1680, 0, .028, .09 * vel, d); this.ping(t, 'triangle', 520, 0, .03, .07 * vel, d); this.burst(t, 'bandpass', 3000, 3, .02, .035 * vel, d); }
    else if (n === 'b') this.burst(t, 'bandpass', 2300, .6, .09, .045 * vel, d);
    else if (n === 'h') this.burst(t, 'highpass', 6500, .7, vel > .7 ? .035 : .022, .028 * vel, d);
    else if (n === 'm') this.burst(t, 'bandpass', 5200, 1.6, .04, .03 * vel, d);
    else if (n === 'c') { for (let i = 0; i < 3; i++) this.burst(t + i * .011, 'bandpass', 1500, 1.4, i === 2 ? .07 : .012, .07 * vel, d); }
    else if (n === 'g') { this.ping(t, 'sine', 3270, 0, .11, .014 * vel, d); this.ping(t, 'sine', 4890, 0, .08, .009 * vel, d); this.ping(t, 'sine', 5730, 0, .05, .006 * vel, d); }
    else if (n === 'w') { this.ping(t, 'sine', 1150, 0, .045, .1 * vel, d); this.ping(t, 'sine', 1720, 0, .03, .04 * vel, d); }
    else if (n === 't') this.ping(t, 'sine', 215, 185, .13, .22 * vel, d);
    else if (n === 'T') this.ping(t, 'sine', 330, 290, .1, .18 * vel, d);
    else if (n === 'o') this.ping(t, 'sine', 150, 95, .2, .3 * vel, d);
  }
}
/** the soft echo the lead voices are sent to (the game builds the same one on its music bus): returns the node to send into */
export function echo(ctx, dest) { const d = ctx.createDelay(1), fb = ctx.createGain(), wet = ctx.createBiquadFilter(), inp = ctx.createGain(); d.delayTime.value = .33; fb.gain.value = .28; wet.type = 'lowpass'; wet.frequency.value = 1800; inp.connect(d); d.connect(fb); fb.connect(d); d.connect(wet); wet.connect(dest); return inp; }
