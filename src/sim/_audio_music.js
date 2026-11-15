// Private: the short one-shot phrases (stingers) of src/sim/audio.js.
// The background music itself lives in _music_engine.js (player), _music_synth.js (instruments), _music_songs_*.js (the songbook) and _music_pools.js (what plays where).
// The old eight generated loops (and their vinyl-crackle option) are gone: owner msg 137 asked for a real songbook, and nothing in the music may read as hiss.
import { mtof, tone } from './_audio_lib.js';

// short one-shot phrases (scale steps relative to C major, 8th notes; null = rest)
export const STINGERS = {
  newday: { key: 72, notes: [0, 2, 4, 7, null, 9, 7], len: [1, 1, 1, 2, 1, 1, 4], bpm: 132 },
  arrive: { key: 67, notes: [0, 4, 7, 12], len: [1, 1, 1, 4], bpm: 120 },
  success: { key: 72, notes: [4, 7, 12, 11, 12], len: [1, 1, 1, 1, 4], bpm: 150 },
  fail: { key: 67, notes: [7, 6, 5, 4], len: [2, 2, 2, 5], bpm: 110 },
  goodnight: { key: 64, notes: [12, 9, 7, 4, 2, 0], len: [1, 1, 1, 1, 1, 5], bpm: 96 },
};

/** play a stinger phrase on dest at time t; returns its length in seconds */
export function stinger(name, dest, t) {
  const S = STINGERS[name]; if (!S) return 0; const d8 = 60 / S.bpm / 2; let tt = t;
  S.notes.forEach((n, k) => { const l = S.len[k] * d8; if (n !== null) { const m = S.key + n; tone(dest, tt, { type: 'triangle', f: mtof(m), a: .01, h: l * .5, d: .3 + l * .3, v: .1 }); tone(dest, tt, { f: mtof(m + 12), a: .01, d: .2 + l * .2, v: .03 }); } tt += l; });
  return tt - t;
}
