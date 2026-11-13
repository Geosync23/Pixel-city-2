// Private: the synthesised sound-effect library for src/sim/audio.js.
// Each entry: (out, t, p, o) => void   out = destination node, t = start time, p = pitch multiplier, o = caller opts.
// Keep them short, soft and warm: sines/triangles, lowpassed squares, filtered noise.
import { tone, noise, rand, pick } from './_audio_lib.js';

const N = (out, t, o) => noise(out, t, o), T = (out, t, o) => tone(out, t, o);
const bell = (out, t, f, v = .12, d = .9) => { T(out, t, { f, d, v }); T(out, t, { f: f * 2.76, d: d * .35, v: v * .25 }); T(out, t, { f: f * 5.4, d: d * .15, v: v * .1 }); };
const clap = (out, t, v = .1) => N(out, t, { ft: 'bandpass', f: rand(1100, 2400), q: 1.2, a: .001, d: rand(.03, .07), v });

export const SFX = {
  /* ---- UI ---- */
  click: (o, t, p) => { T(o, t, { type: 'triangle', f: 900 * p, f2: 520 * p, d: .045, v: .18 }); N(o, t, { ft: 'bandpass', f: 3500, q: 2, d: .012, v: .05 }); },
  open: (o, t, p) => { T(o, t, { type: 'triangle', f: 660 * p, d: .09, v: .14 }); T(o, t + .055, { type: 'triangle', f: 990 * p, d: .14, v: .14 }); },
  close: (o, t, p) => { T(o, t, { type: 'triangle', f: 880 * p, d: .08, v: .12 }); T(o, t + .05, { type: 'triangle', f: 587 * p, d: .14, v: .12 }); },
  toast: (o, t, p) => { bell(o, t, 1318 * p, .09, .5); bell(o, t + .08, 1976 * p, .05, .4); },
  alert: (o, t, p) => { T(o, t, { type: 'triangle', f: 784 * p, d: .18, v: .13 }); T(o, t + .16, { type: 'triangle', f: 622 * p, d: .3, v: .12 }); },
  error: (o, t, p) => { T(o, t, { type: 'square', f: 220 * p, h: .07, d: .06, v: .08, lp: 1100 }); T(o, t + .15, { type: 'square', f: 175 * p, h: .1, d: .08, v: .08, lp: 1000 }); },
  notify: (o, t, p) => { T(o, t, { f: 1046 * p, d: .25, v: .16 }); T(o, t, { type: 'triangle', f: 2093 * p, d: .08, v: .04 }); T(o, t + .1, { f: 1568 * p, d: .4, v: .16 }); T(o, t + .1, { type: 'triangle', f: 3136 * p, d: .1, v: .03 }); },
  buzz: (o, t, p) => { for (let i = 0; i < 2; i++) { const s = t + i * .32; T(o, s, { type: 'sawtooth', f: 150 * p, a: .01, h: .17, d: .03, v: .07, lp: 380, vib: [32, 12] }); } },
  send: (o, t, p) => { N(o, t, { ft: 'bandpass', f: 700, f2: 3200, q: 2, a: .03, d: .2, v: .1 }); T(o, t + .04, { f: 1100 * p, f2: 1760 * p, d: .12, v: .1 }); },
  page: (o, t, p) => { N(o, t, { ft: 'bandpass', f: 1800 * p, f2: 4200 * p, q: .9, a: .05, d: .16, v: .14 }); N(o, t + .17, { ft: 'highpass', f: 3000, d: .03, v: .05 }); },
  shutter: (o, t) => { N(o, t, { ft: 'bandpass', f: 3200, q: 1.5, d: .025, v: .3 }); T(o, t, { type: 'square', f: 140, d: .02, v: .06, lp: 800 }); N(o, t + .07, { ft: 'bandpass', f: 2200, q: 1.2, d: .045, v: .25 }); },
  typing: (o, t, p) => { let s = t; for (let i = 0; i < 6; i++) { N(o, s, { ft: 'bandpass', f: rand(2500, 4200), q: 3, d: .018, v: .14 }); T(o, s, { type: 'triangle', f: rand(260, 330), d: .02, v: .04 }); s += rand(.06, .15); } },

  /* ---- money ---- */
  coin: (o, t, p) => { T(o, t, { type: 'square', f: 988 * p, d: .06, v: .07, lp: 3500 }); T(o, t + .07, { type: 'square', f: 1319 * p, h: .05, d: .3, v: .07, lp: 3500 }); T(o, t + .07, { f: 2638 * p, d: .25, v: .03 }); },
  pay: (o, t, p) => { for (let i = 0; i < 4; i++) N(o, t + i * .025, { ft: 'bandpass', f: 2500, q: 2, d: .02, v: .1 }); bell(o, t + .11, 2093 * p, .1, .7); bell(o, t + .11, 3136 * p, .05, .5); },
  scan: (o, t, p) => { T(o, t, { type: 'square', f: 1760 * p, h: .07, d: .02, v: .06, lp: 3000 }); },

  /* ---- doors & places ---- */
  door_open: (o, t) => { N(o, t, { ft: 'bandpass', f: 2200, q: 3, d: .02, v: .16 }); T(o, t + .02, { f: 120, f2: 60, d: .12, v: .25 }); N(o, t + .05, { buf: 'pink', ft: 'lowpass', f: 700, a: .08, d: .3, v: .12 }); },
  door_close: (o, t) => { T(o, t, { f: 95, f2: 48, d: .2, v: .4 }); N(o, t, { buf: 'brown', ft: 'lowpass', f: 400, d: .12, v: .3 }); N(o, t + .05, { ft: 'bandpass', f: 2600, q: 3, d: .02, v: .12 }); },
  shop_bell: (o, t, p) => { const fs = [2637, 3520, 2960, 3322]; for (let i = 0; i < 4; i++) bell(o, t + i * .06 + rand(0, .02), fs[i] * p, .06, .7); },

  /* ---- footsteps ---- */
  step_out: (o, t, p) => { N(o, t, { buf: 'pink', ft: 'bandpass', f: rand(450, 700) * p, q: 1.1, a: .002, d: .055, v: .2 }); },
  step_grass: (o, t, p) => { N(o, t, { buf: 'pink', ft: 'bandpass', f: rand(900, 1400) * p, q: .8, a: .01, d: .07, v: .08 }); },
  step_in: (o, t, p) => { N(o, t, { ft: 'bandpass', f: rand(1200, 1700) * p, q: 2, d: .03, v: .07 }); T(o, t, { f: rand(160, 200) * p, f2: 90, d: .05, v: .1 }); },

  /* ---- life ---- */
  munch: (o, t, p) => { for (let i = 0; i < 3; i++) N(o, t + i * .13 + rand(0, .03), { buf: 'pink', ft: 'bandpass', f: rand(900, 1500) * p, q: 1.6, a: .005, d: .06, v: .22 }); },
  sip: (o, t, p) => { N(o, t, { ft: 'bandpass', f: 2600, f2: 1500, q: 2.5, a: .03, d: .14, v: .1 }); T(o, t + .22, { f: 380 * p, f2: 620 * p, d: .08, v: .12 }); },
  zzz: (o, t, p) => { [784, 659, 523].forEach((f, i) => { T(o, t + i * .28, { f: f * p, a: .02, d: .6, v: .1 }); T(o, t + i * .28, { type: 'triangle', f: f * 2 * p, d: .2, v: .02 }); }); },
  wake: (o, t, p) => { [523, 659, 784, 1046].forEach((f, i) => T(o, t + i * .09, { type: 'triangle', f: f * p, d: .35, v: .12 })); bell(o, t + .36, 2093 * p, .04, .8); },
  shower: (o, t, p, op) => { const h = Math.max(.5, (op.dur || 3) - .7); N(o, t, { ft: 'highpass', f: 2200, a: .3, h, d: .4, v: .09 }); N(o, t, { ft: 'bandpass', f: 6000, q: .6, a: .3, h, d: .4, v: .06 }); },
  sizzle: (o, t, p, op) => { const h = Math.max(.4, (op.dur || 2.4) - .5); N(o, t, { ft: 'highpass', f: 4500, a: .2, h, d: .3, v: .05 }); for (let i = 0; i < 10; i++) N(o, t + rand(0, h), { ft: 'highpass', f: 3000, d: .008, v: rand(.05, .12) }); },
  splash: (o, t, p) => { N(o, t, { ft: 'lowpass', f: 3500, f2: 600, a: .01, d: .55, v: .3 }); for (let i = 0; i < 5; i++) T(o, t + .1 + rand(0, .4), { f: rand(500, 1200) * p, f2: rand(1300, 2000) * p, d: .05, v: .04 }); },

  /* ---- progress ---- */
  levelup: (o, t, p) => {
    [523, 659, 784, 1046].forEach((f, i) => T(o, t + i * .08, { type: 'square', f: f * p, d: .12, v: .06, lp: 2600 }));
    [1046, 1318, 1568].forEach(f => { T(o, t + .34, { type: 'square', f: f * p, a: .01, h: .3, d: .5, v: .045, lp: 2600 }); T(o, t + .34, { type: 'triangle', f: f * p / 2, a: .01, h: .3, d: .5, v: .06 }); });
    bell(o, t + .34, 2093 * p, .05, 1.2);
  },
  skill: (o, t, p) => { [784, 988, 1319].forEach((f, i) => T(o, t + i * .07, { type: 'triangle', f: f * p, d: .3, v: .12 })); N(o, t + .2, { ft: 'highpass', f: 7000, a: .05, d: .4, v: .03 }); },
  friend_up: (o, t, p) => { T(o, t, { type: 'triangle', f: 659 * p, d: .25, v: .13 }); T(o, t + .13, { type: 'triangle', f: 880 * p, a: .01, h: .1, d: .45, v: .13 }); T(o, t + .13, { f: 1760 * p, d: .4, v: .04 }); },
  friend_down: (o, t, p) => { T(o, t, { type: 'triangle', f: 523 * p, d: .3, v: .11 }); T(o, t + .17, { type: 'triangle', f: 415 * p, d: .5, v: .11 }); },
  achievement: (o, t, p) => {
    [392, 523, 659, 784].forEach((f, i) => T(o, t + i * .09, { type: 'triangle', f: f * p, d: .25, v: .13 }));
    [523, 659, 784, 1046].forEach(f => T(o, t + .4, { type: 'triangle', f: f * p, a: .02, h: .4, d: .9, v: .07, vib: [5, 3] }));
    [2093, 2637, 3136].forEach((f, i) => bell(o, t + .4 + i * .07, f * p, .035, 1));
    N(o, t + .4, { ft: 'highpass', f: 8000, a: .1, d: 1, v: .03 });
  },

  /* ---- vehicles ---- */
  honk: (o, t, p) => { for (let i = 0; i < 2; i++) { const s = t + i * .22; T(o, s, { type: 'sawtooth', f: 370 * p, a: .01, h: .1, d: .05, v: .05, lp: 1600 }); T(o, s, { type: 'sawtooth', f: 466 * p, a: .01, h: .1, d: .05, v: .05, lp: 1600 }); } },
  horn_far: (o, t, p) => { T(o, t, { type: 'sawtooth', f: 330 * p, a: .02, h: .25, d: .1, v: .03, lp: 700 }); T(o, t, { type: 'sawtooth', f: 415 * p, a: .02, h: .25, d: .1, v: .03, lp: 700 }); },
  whoosh: (o, t) => { N(o, t, { buf: 'pink', ft: 'bandpass', pts: [[.6, 1100], [1.3, 300]], f: 350, q: .8, a: .6, d: .7, v: .22 }); N(o, t, { buf: 'brown', ft: 'lowpass', f: 160, a: .5, d: .8, v: .25 }); },
  bike_bell: (o, t, p) => { for (let i = 0; i < 2; i++) { const s = t + i * .16; T(o, s, { f: 2200 * p, d: .5, v: .07 }); T(o, s, { f: 3300 * p, d: .35, v: .05 }); T(o, s, { f: 5950 * p, d: .15, v: .02 }); } },
  bus_brake: (o, t) => { N(o, t, { ft: 'highpass', f: 2500, a: .02, h: .1, d: .9, v: .12 }); T(o, t, { type: 'triangle', f: 70, f2: 45, d: .3, v: .2 }); N(o, t, { buf: 'brown', ft: 'lowpass', f: 200, d: .5, v: .2 }); },
  bus_door: (o, t) => { N(o, t, { ft: 'bandpass', f: 1600, q: .7, a: .01, d: .35, v: .14 }); T(o, t + .32, { f: 160, f2: 80, d: .12, v: .25 }); N(o, t + .32, { ft: 'bandpass', f: 2000, q: 2, d: .03, v: .1 }); },
  train_chime: (o, t, p) => { [659, 523, 587, 392].forEach((f, i) => { const s = t + i * .38; T(o, s, { f: f * p, d: .9, v: .12 }); T(o, s, { type: 'triangle', f: f * 2 * p, d: .3, v: .03 }); }); },
  train_door: (o, t) => { for (let i = 0; i < 3; i++) T(o, t + i * .22, { type: 'square', f: 988, h: .08, d: .02, v: .05, lp: 2400 }); N(o, t + .75, { ft: 'bandpass', f: 1200, q: .6, a: .05, d: .45, v: .13 }); T(o, t + 1.15, { f: 110, f2: 60, d: .15, v: .25 }); },
  train_rumble: (o, t, p, op) => { const h = Math.max(.5, (op.dur || 3.5) - 1.6); N(o, t, { buf: 'brown', ft: 'lowpass', f: 160, a: .8, h, d: .8, v: .6 }); for (let s = t + .5; s < t + h + 1; s += 1.05) { SFX.clack(o, s, 1); } },
  clack: (o, t) => { N(o, t, { buf: 'pink', ft: 'lowpass', f: 900, d: .06, v: .25 }); T(o, t, { f: 90, f2: 55, d: .06, v: .15 }); N(o, t + .14, { buf: 'pink', ft: 'lowpass', f: 900, d: .06, v: .2 }); T(o, t + .14, { f: 90, f2: 55, d: .06, v: .12 }); },
  plane: (o, t, p, op) => {
    const L = op.dur || 7;
    N(o, t, { buf: 'pink', ft: 'bandpass', q: .7, f: 250, pts: [[L * .45, 950], [L, 180]], a: L * .45, d: L * .55, v: .5 });
    N(o, t, { buf: 'brown', ft: 'lowpass', f: 220, a: L * .4, d: L * .6, v: .55 });
    T(o, t, { type: 'sawtooth', f: 2100, f2: 1500, glide: L, a: L * .45, d: L * .5, v: .012, lp: 2400 });
  },

  /* ---- nature & animals ---- */
  chirp: (o, t, p) => { const n = 2 + (Math.random() * 3 | 0), b = rand(2600, 4200) * p; for (let i = 0; i < n; i++) T(o, t + i * rand(.08, .14), { f: b, f2: b * rand(1.2, 1.6), d: rand(.04, .08), v: .05 }); },
  cricket: (o, t, p) => { const f = rand(4300, 4900) * p; for (let i = 0; i < 4; i++) T(o, t + i * .045, { f, a: .004, d: .025, v: .025 }); },
  gull: (o, t, p) => { const n = 2 + (Math.random() * 2 | 0); for (let i = 0; i < n; i++) { const s = t + i * rand(.28, .36), f = rand(1250, 1500) * p; T(o, s, { type: 'sawtooth', pts: [[.05, f * 1.12], [.28, f * .62]], f, a: .02, d: .26, v: .045, lp: 2200, vib: [18, 25] }); } },
  bark: (o, t, p) => { const n = 1 + (Math.random() * 2 | 0); for (let i = 0; i < n; i++) { const s = t + i * .22, f = rand(330, 420) * p; T(o, s, { type: 'sawtooth', f, f2: f * .6, a: .005, d: .12, v: .08, lp: 1300 }); N(o, s, { ft: 'bandpass', f: 700, q: 1.5, d: .08, v: .12 }); } },
  meow: (o, t, p) => { const f = rand(480, 560) * p; T(o, t, { type: 'sawtooth', f, pts: [[.15, f * 1.6], [.5, f * .85]], a: .06, h: .15, d: .3, v: .045, lp: 1600, vib: [6, 8] }); },
  buoy: (o, t, p) => { const f = pick([392, 440, 330]) * p; T(o, t, { f, a: .005, d: 2.5, v: .08 }); T(o, t, { f: f * 2.4, d: 1.2, v: .03 }); T(o, t, { f: f * 4.1, d: .5, v: .015 }); },
  thunder: (o, t) => { N(o, t, { buf: 'pink', ft: 'lowpass', f: 2500, f2: 300, d: .4, v: .25 }); N(o, t + .05, { buf: 'brown', ft: 'lowpass', f: 260, f2: 90, a: .08, h: .5, d: 3.5, v: .9 }); N(o, t + rand(.6, 1.2), { buf: 'brown', ft: 'lowpass', f: 180, a: .2, d: 2.5, v: .6 }); },
  leaves: (o, t) => { N(o, t, { buf: 'pink', ft: 'highpass', f: 2500, a: .5, d: 1.2, v: .06 }); },

  /* ---- venues ---- */
  clank: (o, t, p) => { const f = rand(380, 460) * p; [1, 2.76, 5.4].forEach((m, i) => T(o, t, { f: f * m, d: .5 / (i + 1), v: .06 / (i + 1) })); N(o, t, { ft: 'bandpass', f: 2500, q: 1, d: .02, v: .15 }); T(o, t + .16, { f: f * .8, d: .25, v: .04 }); },
  cup: (o, t, p) => { const f = rand(2800, 3400) * p; T(o, t, { f, d: .18, v: .04 }); T(o, t, { f: f * 1.48, d: .12, v: .02 }); },
  cheer: (o, t) => {
    N(o, t, { buf: 'pink', ft: 'bandpass', f: 1100, q: .6, a: .25, h: .6, d: 1.4, v: .18 });
    N(o, t, { buf: 'pink', ft: 'bandpass', f: 2200, q: 1.5, a: .15, h: .3, d: .8, v: .06 });
    for (let i = 0; i < 40; i++) clap(o, t + rand(0, 2.2) * Math.sqrt(Math.random()), .09);
  },
};
SFX.applause = (o, t) => { for (let i = 0; i < 45; i++) clap(o, t + rand(0, 2.4), .08); };

/** default lengths in seconds (for throttling/ducking decisions) */
export const SFX_LEN = { plane: 7, thunder: 4, train_rumble: 3.5, shower: 3, sizzle: 2.4, cheer: 2.5, applause: 2.5 };
