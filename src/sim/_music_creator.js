// Private: THE CHARACTER CREATOR'S SONG (owner msgs 230, 232, 234; docs/reports/creator_song.md). From New Game until "Move in" (the creator, the traits,
// the home picker) the city's sounds are silent and this tune plays instead, looping for as long as the player stays there; it fades out on Move in.
// Written in the OLD music engine of the eight classics (src/sim/_music_classic.js: the same Session, pad / bass / drum voices, kits and echo), so it
// sounds like a ninth original. Two things differ from a classic, both kept out of _music_classic.js (whose code must stay e834cfe's):
//   - the lead is written out by hand (mel: 16 bars of 8 eighths) instead of the seeded motif generator, so the hook is the same every time;
//   - the per-pass variations are gentler: the first pass always has lead + drums, later passes drop the lead only now and then (arp pad instead).
// Three candidates (A, B, C) are here; the owner chooses by ear on docs/audio/creator_song.html (tools/creator_song_page.mjs builds it from this file).
import { A, mulberry, makeBuffers } from './_audio_lib.js';
import { TRACKS, Session } from './_music_classic.js';

/** THE SWITCH: which candidate the game plays in the creator. One word: 'creator_a' | 'creator_b' | 'creator_c'. */
export const CREATOR_SONG = 'creator_a';

const CMAJOR = [0, 2, 4, 5, 7, 9, 11];
/* trims (dB) that put each candidate at the loudness of Classic: Indoors as the game plays it (tools/creator_song_page.mjs --check measures them) */
export const CREATOR_LEVELS = { creator_a: -1.9, creator_b: -1.9, creator_c: -2.7 };
/* A classic's fields (see TRACKS in _music_classic.js) + title / feel + mel: one string per bar, 8 eighths each: a scale step (0 = the key note,
   7 = an octave up), '-' = the note before goes on, '.' = rest. prog: 16 bars = the 8-bar hook (A) and the 8-bar B section. */
export const CREATOR_TUNES = {
  creator_a: { title: 'Sunny Side Up', feel: 'C major, 120 bpm: a bouncy square-wave hook over I-V-vi-IV, rim-shot drums, octave-hopping bass',
    bpm: 120, key: 60, mode: 'major', swing: .2, prog: [0, 4, 5, 3, 0, 4, 3, 4, 3, 4, 2, 5, 1, 4, 0, 4], seven: false, seed: 101, density: .5, lead: 'square', pad: 'triangle', padV: .032, padLp: 1600, leadLp: 1900, leadV: .05,
    bass: 'R.5RO.5.', drums: { k: 'x.....x.x.......', s: '....o.......o...', h: 'o.o.o.o.o.o.o.o.' }, kit: 'rim', drumV: .55,
    mel: ['7 9 11 12 11 - 9 -', '8 - 11 - 8 7 8 -', '9 - 12 - 11 9 7 -', '10 - 9 - 7 - . .', '7 9 11 12 11 - 9 -', '8 - 11 - 13 - 11 -', '12 - 10 - 12 14 12 -', '11 - - - 8 - . .',
      '12 . 12 . 12 14 12 10', '11 . 11 . 11 13 11 8', '9 . 9 . 9 11 13 11', '12 - - - 9 - . .', '10 - 12 - 10 8 10 -', '11 - 13 - 11 - 8 -', '9 - 11 - 14 - 11 -', '13 - 12 - 11 - 8 .'] },
  creator_b: { title: 'Window Shopping', feel: 'F major, 112 bpm, shuffled: a skipping triangle tune, jazzy seventh chords, brushed snare, walking bass',
    bpm: 112, key: 65, mode: 'major', swing: .35, prog: [0, 3, 0, 4, 5, 3, 4, 0, 1, 4, 2, 5, 1, 4, 3, 4], seven: true, seed: 103, density: .5, lead: 'triangle', pad: 'triangle', padV: .034, padLp: 1600, leadLp: 3000, leadV: .075,
    bass: 'R.O.5.3.', drums: { k: 'x......xx.......', s: '....x.......x...', h: 'o.x.o.x.o.x.o.x.' }, kit: 'snare', drumV: .6,
    mel: ['4 . 2 4 . 2 4 5', '7 - 5 - 3 - . .', '4 . 2 4 . 2 4 5', '6 - 8 - 6 4 . .', '5 . 7 9 - 7 5 .', '3 . 5 7 - 5 3 .', '4 . 6 8 - 7 6 .', '7 - - - . . 4 5',
      '8 . 8 9 8 - 5 .', '6 . 6 7 6 - 4 .', '4 . 4 5 4 - 2 .', '5 - - - . . 4 5', '7 . 8 . 9 . 10 .', '11 - - - 9 . 8 .', '9 . 7 . 5 . 3 .', '6 - - - 4 . 5 .'] },
  creator_c: { title: 'First Day Fizz', feel: 'A major, 126 bpm, nearly straight: a bright syncopated square hook, light four-step kick, running bass',
    bpm: 126, key: 57, mode: 'major', swing: .1, prog: [0, 2, 3, 4, 0, 2, 3, 4, 5, 3, 0, 4, 5, 3, 1, 4], seven: false, seed: 107, density: .5, lead: 'square', pad: 'sine', padV: .045, padLp: 1500, leadLp: 2200, leadV: .045,
    bass: 'R.R5.RO.', drums: { k: 'x...x...x...x...', s: '....o.......o..o', h: '..o...o...o...o.' }, kit: 'rim', drumV: .5,
    mel: ['11 . 11 . 9 11 . 14', '13 - 11 - 9 - . .', '12 . 12 . 10 12 . 14', '13 - - - 11 - . .', '11 . 11 . 9 11 . 14', '15 - 13 - 11 - 9 .', '12 - 14 - 12 10 8 -', '8 - 9 - 10 - 11 -',
      '9 . 12 . 9 . 12 14', '14 - 12 - 10 - . .', '11 . 14 . 11 . 14 16', '15 - - - 13 - . .', '9 . 12 . 9 . 12 14', '14 - 12 - 10 - 12 -', '10 . 12 . 15 . 12 .', '13 - 12 - 11 - 8 .'] },
};
export const CREATOR_IDS = Object.keys(CREATOR_TUNES);
for (const k of CREATOR_IDS) { TRACKS[k] = CREATOR_TUNES[k]; const T = TRACKS[k]; T.loop = T.prog.length * 4 * 60 / T.bpm; }   /* the classic Session finds its tune in TRACKS */

/** the written-out melody -> the compiled tune's lead (per eighth: { n: midi, l: length in eighths }) */
function melody(T) {
  const tok = T.mel.join(' ').trim().split(/\s+/), lead = new Array(tok.length).fill(null);
  for (let k = 0; k < tok.length; k++) { const s = tok[k]; if (s === '-' || s === '.') continue; let l = 1; while (tok[k + l] === '-') l++; const i = +s; lead[k] = { n: T.key + 12 * Math.floor(i / 7) + CMAJOR[((i % 7) + 7) % 7], l }; }
  return lead;
}
/** a classic Session with the written lead and gentler per-pass variations; it loops until stopped */
class CreatorSession extends Session {
  constructor(id, dest, send, opts) { super(id, dest, send, opts); const c = this.c; if (!c.written) { c.lead = melody(this.T); c.written = 1; } }
  rollPass(first) { const lead = first || Math.random() < .85; this.f = { lead, drums: first || Math.random() < .9, arp: !lead || Math.random() < .3, oct: 0 }; }
}
/** the creator song in the songbook Player's clothes (schedule / wind / stop / pos / done / next / started / song), like ClassicPlayer:
    dest <- peak limiter <- trim (CREATOR_LEVELS) <- the Session (its own fade-in) */
export class CreatorPlayer {
  constructor(ctx, id, dest, send, opts = {}) {
    const T = CREATOR_TUNES[id]; if (!T) throw new Error('no creator tune ' + id); this.ctx = ctx; this.id = id;
    this.song = { id, title: 'Creator: ' + T.title, feel: T.feel, bpm: T.bpm, loop: T.loop };
    this.out = ctx.createGain(); this.out.gain.value = Math.pow(10, (opts.db === undefined ? CREATOR_LEVELS[id] || 0 : opts.db) / 20);
    let lim = null; try { lim = ctx.createDynamicsCompressor(); lim.threshold.value = -9; lim.knee.value = 6; lim.ratio.value = 6; lim.attack.value = .003; lim.release.value = .15; this.out.connect(lim); lim.connect(dest); } catch (e) { lim = null; this.out.connect(dest); } this.lim = lim;
    this.s = new CreatorSession(id, this.out, send, { fade: opts.fade || 1.5, passes: opts.passes || 1e6 });
    this.started = this.s.started; this.next = this.s.next; this.done = false; this.cut = Infinity; this.dur = this.s.passes * this.s.c.steps * this.s.dur16;
  }
  schedule(until) { const s = this.s; if (this.done) return; s.schedule(Math.min(until, this.cut)); if (s.done || s.next >= this.cut) { this.done = true; if (this.cut === Infinity) this.next = s.next + 2.5; } else this.next = s.next; }
  pos() { const s = this.s, t = Math.max(0, this.ctx.currentTime - this.started); return { t, dur: t + s.c.steps * s.dur16, section: 'time round ' + (s.pass + 1) + ((s.step >> 4) < 8 ? ', the hook' : ', the B part'), bar: (s.step >> 4) + 1 }; }
  wind(fade = 1.6) { const s = this.s, now = this.ctx.currentTime; let tb = s.next + ((16 - (s.step & 15)) & 15) * s.dur16; if (s.done || tb - now > 2.5 || tb < now) tb = now + .1; return this.stop(fade, tb); }
  stop(fade = 1.5, at) { const ctx = this.ctx, g = this.out.gain, t = Math.max(ctx.currentTime, at || 0); if (this.cut !== Infinity) return this.next; this.cut = t; this.next = t + fade;
    try { g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(.0001, t + fade); } catch (e) { /* closed context */ }
    const out = this.out, lim = this.lim, so = this.s.out; if (typeof setTimeout !== 'undefined') setTimeout(() => { try { so.disconnect(); out.disconnect(); if (lim) lim.disconnect(); } catch (e) { /* gone */ } }, (t - ctx.currentTime + fade + 4) * 1000); return this.next; }
}
/** render a candidate offline -> Promise<AudioBuffer> (for the listening page's checks): o = { passes (2), seed (fixes the per-pass variations), OAC, db, dest(ctx) -> node } */
export function renderCreator(id, sr = 48000, o = {}) {
  const T = CREATOR_TUNES[id], OAC = o.OAC || (typeof OfflineAudioContext !== 'undefined' ? OfflineAudioContext : webkitOfflineAudioContext), passes = o.passes || 2;
  const ctx = new OAC(2, Math.ceil((passes * T.loop + 4) * sr), sr), keep = [A.ctx, A.white, A.pink, A.brown], rnd = Math.random;
  try { A.ctx = ctx; makeBuffers(ctx); if (o.seed !== undefined) Math.random = mulberry(o.seed); const dest = o.dest ? o.dest(ctx) : ctx.destination, p = new CreatorPlayer(ctx, id, dest, creatorEcho(ctx, dest), { db: o.db, passes }); p.schedule(Infinity); }
  finally { [A.ctx, A.white, A.pink, A.brown] = keep; Math.random = rnd; }
  return ctx.startRendering();
}
/** the music bus echo of the game (delay .33 s, feedback .28, lowpass 1800 Hz), as audio.js builds it: returns its input */
export function creatorEcho(ctx, dest) { const d = ctx.createDelay(1), fb = ctx.createGain(), wet = ctx.createBiquadFilter(), inp = ctx.createGain(); d.delayTime.value = .33; fb.gain.value = .28; wet.type = 'lowpass'; wet.frequency.value = 1800; inp.connect(d); d.connect(fb); fb.connect(d); d.connect(wet); wet.connect(dest); return inp; }
