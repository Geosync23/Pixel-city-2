// Private: the airport sounds (owner msg 220, BIBLE Direction update 43): the JET (a continuous voice per aircraft, steered every frame by
// src/sim/planes.js), the TYRE SCREECH at touchdown and the SEAT-BELT CHIME in the cabin. All synthesised (no recordings): filtered noise + tones.
// The same code drives docs/audio/plane_sounds.html (tools/plane_sounds_page.mjs copies this file and _audio_lib.js into the page), so the
// listening page and the game cannot drift apart.
//   new Jet(dest, o?)   o: { pitch (turbine whine, 1 = airliner), whine (whine level, 1), rumble (1) }   (1 = the chosen jet: owner msg 226, variant B of the page)
//   jet.set(level, thrust, dist, pan, t)   level 0..1 (distance x fade x kind), thrust 0..1 (idle .2 .. full / reverse 1), dist tiles (muffles), pan -1..1, t = ctx time
//   jet.stop(t)        fade out and free the nodes
//   hear(d) -> 0..1    the distance model (tiles between the aircraft and the listener; altitude counts)
//   thrustOf(f)        engine setting for a planes.js flight
//   screech / seatbelt  one-shot effects in the _audio_sfx.js form (out, t, pitch)
import { A, gain, filt, tone, noise, loopNoise } from './_audio_lib.js';

/* distance model: near 1 at the runway side, -20 dB at 70 tiles (the Arrivals curb), a faint low rumble downtown (~250 tiles), nothing past 300 */
export const hear = d => 1 / (1 + (d / 22) * (d / 22)) + .012 * Math.max(0, 1 - d / 300);
/* far away a jet is a low rumble: the low-pass falls with distance */
const lpOf = d => 350 + 9000 / (1 + Math.pow(d / 30, 1.5));

export function thrustOf(f) {
  if (f.kind === 'land') {
    if (f.phase === 'air') return .5;
    const u = f.t - (f.td || 0);   // seconds since the main wheels touched: spool up to reverse thrust, hold, then back to idle as it slows
    return u < .7 ? .5 + .5 * u / .7 : u < 2.8 ? 1 : Math.max(.2, 1 - (u - 2.8) * .32);
  }
  if (f.kind === 'takeoff') return f.phase === 'roll' ? .6 + .4 * Math.min(1, f.t / 2.5) : f.phase === 'climb' ? 1 : .85;
  return .55;
}

export class Jet {
  constructor(dest, o = {}) {
    const c = this.c = A.ctx; this.o = o; this.p = 1.2 * (o.pitch || 1); this.wv = 2.4 * (o.whine || 1);   /* owner msg 226: the louder, higher turbine whine (page variant B) is the jet */ this.dead = false;
    const P = c.createStereoPanner ? c.createStereoPanner() : null; this.pan = P; if (P) P.connect(dest);
    this.out = gain(P || dest, 0); this.lp = filt(this.out, 'lowpass', 6000, .5);
    // rumble (brown noise, low-passed), roar (pink noise through a band that opens with thrust), air (pink, high band), turbine whine (two detuned saws in a narrow band)
    this.rG = gain(this.lp, 0); this.rF = filt(this.rG, 'lowpass', 180, .8); this.src = [loopNoise(this.rF, 'brown')];
    this.oG = gain(this.lp, 0); this.oF = filt(this.oG, 'bandpass', 500, .6); this.src.push(loopNoise(this.oF, 'pink'));
    this.aG = gain(this.lp, 0); this.src.push(loopNoise(filt(this.aG, 'highpass', 2800, .5), 'pink', 1.2));
    this.wG = gain(this.lp, 0); this.wF = filt(this.wG, 'bandpass', 2400, 7); this.w = [];
    for (const k of [1, 1.006, .5]) { const w = c.createOscillator(); w.type = k === .5 ? 'triangle' : 'sawtooth'; w.frequency.value = 2400 * k; w.connect(k === .5 ? this.wG : this.wF); w.start(); w.k = k; this.w.push(w); this.src.push(w); }
    for (const s of this.src) s._jet = 1;   /* tools/ambience_check.mjs tells these event sources from a noise bed */
  }
  set(level, thrust, dist, pan, t) {
    if (this.dead) return; const T = (p, v, k = .12) => p.setTargetAtTime(v, t, k), o = this.o, th = Math.max(0, Math.min(1, thrust));
    T(this.out.gain, 3.5 * Math.max(0, level));
    T(this.lp.frequency, lpOf(dist), .2); if (this.pan) T(this.pan.pan, Math.max(-1, Math.min(1, pan || 0)) * .7, .1);
    T(this.rG.gain, .5 * (o.rumble || 1) * (.45 + .55 * th)); T(this.rF.frequency, 140 + 120 * th);
    T(this.oG.gain, .42 * Math.pow(th, 1.3)); T(this.oF.frequency, 320 + 950 * th, .3);
    T(this.aG.gain, .06 * th * th);
    const wf = (1500 + 1700 * th) * this.p; T(this.wG.gain, .022 * this.wv * (.35 + .65 * th), .2); T(this.wF.frequency, wf, .4);
    for (const w of this.w) T(w.frequency, wf * w.k, .4);
  }
  stop(t) {
    if (this.dead) return; this.dead = true; t = t || this.c.currentTime;
    this.out.gain.cancelScheduledValues(t); this.out.gain.setTargetAtTime(0, t, .15);
    for (const s of this.src) try { s.stop(t + .9); } catch (e) { }
    setTimeout(() => { try { (this.pan || this.out).disconnect(); } catch (e) { } }, 1200);
  }
}

/* touchdown: the left and right main gear chirp a few ms apart (a high rubber squeal sliding down), a soft thump under them. ~0.3 s */
export function screech(o, t, p = 1) {
  noise(o, t, { buf: 'pink', ft: 'bandpass', f: 3300 * p, f2: 2200 * p, q: 7, a: .004, h: .12, d: .22, v: 1 });
  noise(o, t + .055, { buf: 'pink', ft: 'bandpass', f: 2900 * p, f2: 2000 * p, q: 7, a: .004, h: .1, d: .2, v: .75 });
  tone(o, t, { type: 'sawtooth', f: 1900 * p, f2: 1300 * p, a: .006, h: .08, d: .2, v: .03, lp: 3200 });
  noise(o, t, { buf: 'brown', ft: 'lowpass', f: 200, a: .006, d: .25, v: .6 });
}
/* variant B: one longer, softer, lower squeal (listening page only) */
export function screechB(o, t, p = 1) {
  noise(o, t, { buf: 'pink', ft: 'bandpass', f: 2500 * p, f2: 1600 * p, q: 5, a: .01, h: .14, d: .3, v: .9 });
  noise(o, t, { buf: 'brown', ft: 'lowpass', f: 160, a: .01, d: .3, v: .5 });
}

/* the cabin PA chime: a soft high bell, then a lower one a major third down ("ding ... dong"), ~0.9 s */
const ding = (o, t, f, v, d) => { tone(o, t, { f, a: .004, d, v }); tone(o, t, { f: f * 2, a: .003, d: d * .3, v: v * .16 }); tone(o, t, { f: f * 3, a: .002, d: d * .12, v: v * .05 }); };
export function seatbelt(o, t, p = 1) { ding(o, t, 880 * p, .15, .75); ding(o, t + .42, 698 * p, .15, 1.05); }
/* variant B: lower and rounder (E5 -> C5), a touch longer (listening page only) */
export function seatbeltB(o, t, p = 1) { ding(o, t, 659 * p, .16, .9); ding(o, t + .48, 523 * p, .16, 1.25); }
