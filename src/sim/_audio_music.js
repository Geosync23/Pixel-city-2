// Private: tiny step sequencer + original looping tunes for src/sim/audio.js.
// A tune = key, mode, tempo, swing, an 8-bar chord progression (scale degrees), bass/drum patterns and a
// seeded, motif-based lead melody (generated once, deterministic). Each session plays the loop 2-3 times with
// per-pass variations (lead on/off, drums on/off, arpeggiated pad, lead octave), then the controller leaves a gap.
import { A, mtof, mulberry, tone, noise, gain, filt, rand } from './_audio_lib.js';

const MAJOR = [0, 2, 4, 5, 7, 9, 11], MINOR = [0, 2, 3, 5, 7, 8, 10];
// drums: 16 steps; x = hit, o = soft. bass: 8 eighths; R root, 5 fifth, 3 third, O octave, '-' hold, '.' rest
export const TRACKS = {
  title: { bpm: 76, key: 60, mode: 'major', swing: .3, prog: [0, 2, 5, 3, 0, 2, 3, 4], seven: true, seed: 11, density: .42, lead: 'triangle', pad: 'sine', padV: .045, padLp: 1400, leadLp: 2600, leadV: .07,
    bass: 'R--.5-R-', drums: { k: 'x.......x.......', s: '', h: '..o...o...o...o.' }, kit: 'rim', drumV: .6, crackle: true },
  morning: { bpm: 92, key: 65, mode: 'major', swing: .25, prog: [0, 3, 0, 4, 5, 3, 1, 4], seven: false, seed: 23, density: .55, lead: 'triangle', pad: 'triangle', padV: .035, padLp: 1800, leadLp: 3200, leadV: .075,
    bass: 'R-5-O-5-', drums: { k: 'x.....x...x.....', s: '....o.......o...', h: 'o.o.o.o.o.o.o.o.' }, kit: 'rim', drumV: .7 },
  day: { bpm: 100, key: 67, mode: 'major', swing: .35, prog: [0, 4, 5, 3, 0, 4, 3, 4], seven: true, seed: 37, density: .6, lead: 'square', pad: 'triangle', padV: .035, padLp: 1600, leadLp: 1900, leadV: .05,
    bass: 'R-.R5-3-', drums: { k: 'x......xx.......', s: '....x.......x...', h: 'o.x.o.x.o.x.o.x.' }, kit: 'snare', drumV: .75 },
  evening: { bpm: 78, key: 63, mode: 'major', swing: .45, prog: [1, 4, 0, 5, 1, 4, 0, 0], seven: true, seed: 41, density: .45, lead: 'sine', pad: 'triangle', padV: .04, padLp: 1200, leadLp: 2400, leadV: .085,
    bass: 'R-.-5-.3', drums: { k: 'x.........x.....', s: '....x.......x...', h: '..o...o...o...oo' }, kit: 'snare', drumV: .6, crackle: true },
  night: { bpm: 68, key: 57, mode: 'minor', swing: .4, prog: [0, 5, 2, 6, 0, 5, 3, 4], seven: true, seed: 53, density: .3, lead: 'sine', pad: 'sine', padV: .05, padLp: 900, leadLp: 2000, leadV: .08,
    bass: 'R---5---', drums: { k: 'x...........x...', s: '........o.......', h: '' }, kit: 'rim', drumV: .45, crackle: true },
  rainy: { bpm: 72, key: 62, mode: 'minor', swing: .35, prog: [0, 3, 5, 2, 0, 3, 6, 4], seven: true, seed: 67, density: .36, lead: 'triangle', pad: 'sine', padV: .05, padLp: 1000, leadLp: 2200, leadV: .07,
    bass: 'R--.R-5-', drums: { k: 'x.......x.......', s: '....o.......o...', h: '..o...o...o...o.' }, kit: 'rim', drumV: .5, crackle: true },
  interior: { bpm: 104, key: 62, mode: 'major', swing: .2, prog: [0, 5, 1, 4, 0, 5, 1, 4], seven: true, seed: 79, density: .5, lead: 'square', pad: 'triangle', padV: .03, padLp: 1500, leadLp: 1700, leadV: .045,
    bass: 'R-.5O-.5', drums: { k: 'x..x..x.x..x..x.', s: '..o..o....o..o..', h: 'o.o.o.o.o.o.o.o.' }, kit: 'rim', drumV: .55 },
  train: { bpm: 116, key: 57, mode: 'major', swing: .15, prog: [0, 3, 5, 4, 0, 3, 1, 4], seven: false, seed: 97, density: .6, lead: 'square', pad: 'triangle', padV: .03, padLp: 1700, leadLp: 2000, leadV: .045,
    bass: 'RRO-RR5-', drums: { k: 'x...x...x...x...', s: '....x.......x..o', h: 'xoxoxoxoxoxoxoxo' }, kit: 'snare', drumV: .65 },
};
// short one-shot phrases (scale steps relative to C major, 8th notes; null = rest)
export const STINGERS = {
  newday: { key: 72, notes: [0, 2, 4, 7, null, 9, 7], len: [1, 1, 1, 2, 1, 1, 4], bpm: 132 },
  arrive: { key: 67, notes: [0, 4, 7, 12], len: [1, 1, 1, 4], bpm: 120 },
  success: { key: 72, notes: [4, 7, 12, 11, 12], len: [1, 1, 1, 1, 4], bpm: 150 },
  fail: { key: 67, notes: [7, 6, 5, 4], len: [2, 2, 2, 5], bpm: 110 },
  goodnight: { key: 64, notes: [12, 9, 7, 4, 2, 0], len: [1, 1, 1, 1, 1, 5], bpm: 96 },
};

const idx2 = (base, sc, i) => base + 12 * Math.floor(i / 7) + sc[((i % 7) + 7) % 7];

function compile(id) {
  const T = TRACKS[id]; if (T._c) return T._c; const r = mulberry(T.seed), sc = T.mode === 'minor' ? MINOR : MAJOR, bars = T.prog.length;
  const avoid = T.mode === 'minor' ? [1, 5] : [3, 6];
  // chords: pad voicing (midi), bass root (midi), chord tones as scale indices
  const chords = T.prog.map(d => {
    const tones = [d, d + 2, d + 4].concat(T.seven ? [d + 6] : []), pad = tones.map(i => { let m = idx2(T.key, sc, i); while (m > 71) m -= 12; while (m < 55) m += 12; return m; });
    let root = idx2(T.key - 24, sc, d); while (root > 50) root -= 12; while (root < 36) root += 12;
    return { d, pad, root, fifth: root + 7, third: idx2(T.key - 24, sc, d + 2) - idx2(T.key - 24, sc, d) + root };
  });
  // bass pattern -> per-eighth events
  const bass = []; for (let k = 0; k < 8; k++) { const ch = T.bass[k]; if (!ch || ch === '-' || ch === '.') { bass.push(null); continue; } let l = 1; while (T.bass[k + l] === '-') l++; bass.push({ ch, l }); }
  // lead melody: phrase structure A A' B A(end), 2 bars each, 8th-note grid
  const rhythm = () => { const on = []; for (let k = 0; k < 16; k++) { const p = k % 4 === 0 ? .8 : k % 2 === 0 ? T.density : T.density * .55; if (r() < p) on.push(k); } if (on.length < 3) on.push(0, 6, 12); return [...new Set(on)].sort((a, b) => a - b); };
  const contour = n => { const out = []; for (let i = 0; i < n; i++) { const x = r(); out.push(x < .3 ? -1 : x < .6 ? 1 : x < .72 ? 0 : x < .86 ? 2 : -2); } return out; };
  const rA = rhythm(), rB = rhythm(), cA = contour(rA.length), cB = contour(rB.length), cA2 = cA.slice(); cA2[cA2.length - 1] = -cA2[cA2.length - 1] || 1;
  const phrases = [[rA, cA], [rA, cA2], [rB, cB], [rA, cA, true]], lead = new Array(bars * 8).fill(null);
  let i = 9;
  phrases.forEach(([rh, co, end], ph) => {
    if (ph * 2 >= bars) return;
    rh.forEach((k, j) => {
      const s8 = ph * 16 + k, ch = chords[Math.min(bars - 1, s8 >> 3)]; i = Math.max(5, Math.min(14, i + co[j]));
      const last = end && j === rh.length - 1;
      if (k % 4 === 0 || last) { let best = i, bd = 99; for (let o = -14; o <= 21; o += 7) for (const ct of [ch.d, ch.d + 2, ch.d + 4]) { const c = ct + o, dd = Math.abs(c - i) + (last && ct !== ch.d ? 3 : 0); if (c >= 4 && c <= 15 && dd < bd) { bd = dd; best = c; } } i = best; }
      else if (avoid.includes(((i % 7) + 7) % 7)) i += (r() < .5 ? -1 : 1);
      const nk = rh[j + 1] !== undefined ? rh[j + 1] : 16, l = last ? 16 - k : Math.min(4, nk - k);
      lead[s8] = { n: idx2(T.key, sc, i), l };
    });
  });
  return T._c = { T, chords, bass, lead, bars, steps: bars * 16 };
}

/** One playing instance of a tune: owns its output gain + filters; schedule(until) is called by the lookahead timer. */
export class Session {
  constructor(id, dest, delaySend, opts = {}) {
    const c = compile(id), T = c.T, ctx = A.ctx; this.id = id; this.c = c; this.T = T;
    this.out = gain(dest, 0); this.fade = opts.fade || 3; this.out.gain.setValueAtTime(.0001, ctx.currentTime); this.out.gain.linearRampToValueAtTime(1, ctx.currentTime + this.fade);
    this.padF = filt(this.out, 'lowpass', T.padLp); this.leadF = filt(this.out, 'lowpass', T.leadLp, 1); this.bassF = filt(this.out, 'lowpass', 650); this.drumF = filt(gain(this.out, T.drumV), 'lowpass', 6500);
    this.send = gain(delaySend, .35); this.leadF.connect(this.send);
    this.dur16 = 60 / T.bpm / 4; this.step = 0; this.pass = 0; this.passes = opts.passes || (2 + (Math.random() < .5 ? 1 : 0)); this.next = ctx.currentTime + .15; this.done = false; this.started = ctx.currentTime;
    this.rollPass(true);
  }
  rollPass(first) { this.f = { lead: first ? Math.random() < .6 : Math.random() < .8, drums: first ? Math.random() < .5 : Math.random() < .8, arp: Math.random() < .35, oct: Math.random() < .2 ? 12 : 0 }; }
  schedule(until) {
    while (!this.done && this.next < until) { this.play(this.step, this.next); this.next += this.dur16; if (++this.step >= this.c.steps) { this.step = 0; if (++this.pass >= this.passes) this.done = true; else this.rollPass(false); } }
  }
  play(i, t0) {
    const c = this.c, T = this.T, bar = i >> 4, s = i & 15, d16 = this.dur16, ch = c.chords[bar], f = this.f;
    const t = t0 + (s % 4 === 2 ? T.swing * d16 * 1.3 : 0);
    if (s === 0) { // pad
      const barLen = d16 * 16;
      if (f.arp) ch.pad.forEach((m, k) => { for (let rep = 0; rep < 2; rep++) tone(this.padF, t + (k + rep * ch.pad.length) * d16 * 2, { type: T.pad, f: mtof(m + 12 * rep), a: .02, d: .7, v: T.padV * 1.2 }); });
      ch.pad.forEach(m => { const fq = mtof(m); tone(this.padF, t, { type: T.pad, f: fq, detune: -6, a: .35, h: barLen - .5, d: .9, v: T.padV * (f.arp ? .5 : 1) }); tone(this.padF, t, { type: T.pad, f: fq, detune: 7, a: .45, h: barLen - .6, d: .9, v: T.padV * (f.arp ? .4 : .8) }); });
    }
    if ((s & 1) === 0) {
      const k8 = s >> 1, b = c.bass[k8];
      if (b) { const m = b.ch === '5' ? ch.fifth : b.ch === 'O' ? ch.root + 12 : b.ch === '3' ? ch.third : ch.root; tone(this.bassF, t, { type: 'triangle', f: mtof(m), a: .01, h: b.l * d16 * 2 * .55, d: .18, v: .2 }); tone(this.bassF, t, { f: mtof(m - 12), a: .01, h: b.l * d16 * 2 * .5, d: .15, v: .12 }); }
      const L = f.lead && c.lead[bar * 8 + k8];
      if (L) { const ty = T.lead, lt = t + rand(-.006, .008); tone(this.leadF, lt, { type: ty, f: mtof(L.n + f.oct), a: ty === 'sine' ? .02 : .008, h: L.l * d16 * 2 * .5, d: .25 + L.l * .04, v: T.leadV * rand(.85, 1), vib: L.l >= 3 ? [5, 3] : null }); }
    }
    if (f.drums) {
      const D = T.drums, kk = D.k[s], ss = D.s[s], hh = D.h[s];
      if (kk && kk !== '.') tone(this.drumF, t, { f: 110, f2: 42, glide: .12, a: .002, d: .22, v: kk === 'x' ? .45 : .25 });
      if (ss && ss !== '.') { const v = ss === 'x' ? 1 : .55; if (T.kit === 'rim') { noise(this.drumF, t, { ft: 'bandpass', f: 3200, q: 3, d: .03, v: .16 * v }); tone(this.drumF, t, { f: 1650, d: .025, v: .05 * v }); } else { noise(this.drumF, t, { ft: 'bandpass', f: 1800, q: .7, d: .13, v: .13 * v }); tone(this.drumF, t, { type: 'triangle', f: 190, f2: 150, d: .06, v: .08 * v }); } }
      if (hh && hh !== '.') noise(this.drumF, t, { ft: 'highpass', f: 7500, d: hh === 'x' ? .035 : .02, v: hh === 'x' ? .05 : .03 });
    }
    if (T.crackle && Math.random() < .12) noise(this.out, t + Math.random() * d16, { ft: 'highpass', f: 2500, d: .004, v: rand(.008, .02) });
  }
  stop(fade = 3) { const ctx = A.ctx, g = this.out.gain, now = ctx.currentTime; this.done = true; try { g.cancelScheduledValues(now); g.setValueAtTime(g.value, now); g.linearRampToValueAtTime(.0001, now + fade); } catch (e) { } const out = this.out; setTimeout(() => { try { out.disconnect(); } catch (e) { } }, (fade + 6) * 1000); }
}

/** play a stinger phrase on dest at time t; returns its length in seconds */
export function stinger(name, dest, t) {
  const S = STINGERS[name]; if (!S) return 0; const d8 = 60 / S.bpm / 2; let tt = t;
  S.notes.forEach((n, k) => { const l = S.len[k] * d8; if (n !== null) { const m = S.key + n; tone(dest, tt, { type: 'triangle', f: mtof(m), a: .01, h: l * .5, d: .3 + l * .3, v: .1 }); tone(dest, tt, { f: mtof(m + 12), a: .01, d: .2 + l * .2, v: .03 }); } tt += l; });
  return tt - t;
}
