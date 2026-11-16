// Renders the trailer music: the game's own "Classic: Indoors" loop (TRACKS.interior, compile(), Session.play() of src/sim/_music_classic.js, unchanged)
// played bar by bar into an OfflineAudioContext with a trailer ARRANGEMENT: which of the 8 bars sounds, and which layers (lead / drums / arpeggio / bass) are on.
//   node tools/trailer/music.mjs  -> <scratch>/music_a.wav, music_b.wav (48 kHz stereo, 45.0 s) + prints the beat grid
// 104 bpm: beat .5769 s, bar 2.3077 s. Layout of both: 2 intro bars, the 8-bar loop twice, a final tonic chord at bar 19 (41.64 s) that rings out to 45 s.
// No vinyl crackle (the game removed it from the classics; this loop never had it).
import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module'; import { serve, CLEAN, SCRATCH } from './lib.mjs';
const require = createRequire(import.meta.url); const { chromium } = require('playwright');
export const BPM = 104, BEAT = 60 / BPM, BAR = BEAT * 4, T0 = 0.1, LEN = 45;
// one row per bar: p = bar of the loop (0-7: chords I vi ii V I vi ii V), then the layers
const L = (p, lead, drums, arp, bass = 1, oct = 0) => ({ p, lead, drums, arp, bass, oct });
export const ARR = {
  // A "The City Wakes Up": pad alone, the tune comes in quietly, drums arrive when the streets fill, second time round with everything
  a: [L(6, 0, 0, 1, 0), L(7, 0, 0, 1, 1),
    L(0, 1, 0, 0), L(1, 1, 0, 0), L(2, 1, 0, 1), L(3, 1, 0, 1), L(4, 1, 1, 0), L(5, 1, 1, 0), L(6, 1, 1, 1), L(7, 1, 1, 1),
    L(0, 1, 1, 0), L(1, 1, 1, 0), L(2, 1, 1, 1), L(3, 1, 1, 1), L(4, 1, 1, 1, 1, 12), L(5, 1, 1, 1, 1, 12), L(6, 1, 1, 1, 1, 12), L(7, 1, 1, 1, 1, 12)],
  // B the mix: drums from the first door, octave lead for the fast run of doors
  b: [L(6, 0, 0, 1, 1), L(7, 0, 1, 1, 1),
    L(0, 1, 1, 0), L(1, 1, 1, 0), L(2, 1, 1, 1), L(3, 1, 1, 1), L(4, 1, 1, 0), L(5, 1, 1, 0), L(6, 1, 1, 1), L(7, 1, 1, 1),
    L(0, 1, 1, 1, 1, 12), L(1, 1, 1, 1, 1, 12), L(2, 1, 1, 1, 1, 12), L(3, 1, 1, 1, 1, 12), L(4, 1, 1, 1), L(5, 1, 1, 1), L(6, 1, 1, 1), L(7, 1, 1, 1),
    /* round 3 (owner msg 212): four more bars, the second half of the loop once more with the tune an octave up, then the same final chord */
    L(4, 1, 1, 1, 1, 12), L(5, 1, 1, 1, 1, 12), L(6, 1, 1, 1, 1, 12), L(7, 1, 1, 1, 1, 12)],
};
export const LENS = { a: 45, b: 45 + 4 * BAR };
if (import.meta.url === `file://${process.argv[1]}`) {
  const srv = await serve(CLEAN); const port = srv.address().port; const br = await chromium.launch(); const page = await br.newPage();
  await page.route('**/trailer_blank.html', r => r.fulfill({ contentType: 'text/html', body: '<!doctype html><title>music</title>' }));
  await page.goto(`http://localhost:${port}/trailer_blank.html`);
  for (const k of Object.keys(ARR)) {
    const b64 = await page.evaluate(async ({ arr, BAR, T0, LEN }) => {
      const M = await import('/src/sim/_music_classic.js'), Lb = await import('/src/sim/_audio_lib.js'), LV = await import('/src/sim/_music_levels.js');
      const sr = 48000, ctx = new OfflineAudioContext(2, Math.ceil(LEN * sr), sr);
      Math.random = Lb.mulberry(4242);
      // the game's chain: Session -> trim (CLASSIC_LEVELS) -> the per-tune peak limiter -> out; echo send as in the game. +3 dB make-up so the trailer sits near -14 LUFS.
      const master = ctx.createGain(); master.gain.value = 1.41; master.connect(ctx.destination);
      const trim = ctx.createGain(); trim.gain.value = Math.pow(10, (LV.CLASSIC_LEVELS.classic_interior || 0) / 20);
      const lim = ctx.createDynamicsCompressor(); lim.threshold.value = -9; lim.knee.value = 6; lim.ratio.value = 6; lim.attack.value = .003; lim.release.value = .15; trim.connect(lim); lim.connect(master);
      const send = M.useContext(ctx, master);
      const s = new M.Session('interior', trim, send, { fade: .02, passes: 99 });
      const bassOn = s.bassF, bassOff = ctx.createBiquadFilter(); bassOff.connect(ctx.createGain());   // a bass that goes nowhere, for the first intro bar
      const d16 = s.dur16; let t = T0;
      for (const b of arr) { s.f = { lead: !!b.lead, drums: !!b.drums, arp: !!b.arp, oct: b.oct || 0 }; s.bassF = b.bass ? bassOn : bassOff; for (let i = 0; i < 16; i++) { s.play(b.p * 16 + i, t); t += d16; } }
      // the ending: the tonic chord (bar 0, beat 1) with the kick, left to ring, then a gentle fade to the end of the file
      s.bassF = bassOn; s.f = { lead: false, drums: true, arp: true, oct: 0 }; s.play(0, t);
      { const c = s.c.chords[0]; for (const m of c.pad) Lb.tone(s.padF, t, { type: 'triangle', f: Lb.mtof(m + 12), a: .01, h: 2.0, d: 1.6, v: .035 }); for (const m of c.pad) Lb.tone(s.padF, t, { type: 'triangle', f: Lb.mtof(m), a: .01, h: 2.2, d: 1.4, v: .04 }); Lb.tone(s.bassF, t, { type: 'triangle', f: Lb.mtof(c.root), a: .01, h: 1.2, d: 1.6, v: .2 }); Lb.tone(s.leadF, t, { type: 'square', f: Lb.mtof(74), a: .008, h: .5, d: 1.6, v: .04, vib: [5, 3] }); }
      master.gain.setValueAtTime(1.41, LEN - 1.6); master.gain.linearRampToValueAtTime(.0001, LEN - .05);
      const buf = await ctx.startRendering(), n = buf.length, a = buf.getChannelData(0), c = buf.getChannelData(1), out = new DataView(new ArrayBuffer(44 + n * 4));
      const W = (o, str) => { for (let i = 0; i < str.length; i++) out.setUint8(o + i, str.charCodeAt(i)); };
      W(0, 'RIFF'); out.setUint32(4, 36 + n * 4, true); W(8, 'WAVEfmt '); out.setUint32(16, 16, true); out.setUint16(20, 1, true); out.setUint16(22, 2, true); out.setUint32(24, sr, true); out.setUint32(28, sr * 4, true); out.setUint16(32, 4, true); out.setUint16(34, 16, true); W(36, 'data'); out.setUint32(40, n * 4, true);
      let pk = 0; for (let i = 0; i < n; i++) { pk = Math.max(pk, Math.abs(a[i]), Math.abs(c[i])); out.setInt16(44 + i * 4, Math.max(-1, Math.min(1, a[i])) * 32767, true); out.setInt16(46 + i * 4, Math.max(-1, Math.min(1, c[i])) * 32767, true); }
      let bin = ''; const u8 = new Uint8Array(out.buffer); for (let i = 0; i < u8.length; i += 32768) bin += String.fromCharCode.apply(null, u8.subarray(i, i + 32768));
      return { b64: btoa(bin), pk };
    }, { arr: ARR[k], BAR, T0, LEN: LENS[k] });
    const f = path.join(SCRATCH, `music_${k}.wav`); fs.writeFileSync(f, Buffer.from(b64.b64, 'base64')); console.log(f, 'peak', b64.pk.toFixed(3));
  }
  await br.close(); srv.close();
  console.log('beat', BEAT.toFixed(4), 'bar', BAR.toFixed(4), 'final chord at', (T0 + 18 * BAR).toFixed(3));
}
