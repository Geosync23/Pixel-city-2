// Private: turns a song from the songbook (_music_songs_*.js) into timed notes and plays them on a Synth (_music_synth.js).
// Used by src/sim/audio.js (the game), tools/music_check.mjs (offline renders) and docs/audio/jukebox.html. No game imports.
//
// A SONG (everything is written in C, major or minor, and moved to its key with `tr`):
//   { id, title, feel, bpm, tr, min?, bar (beats per bar, default 4), mt ('4/4' for the table), mo (midi of degree 1 of the tune, default 72),
//     style (key of STYLES: the accompaniment patterns), st? (overrides of that style), ins: { m lead, m2 second lead, h counter line, c chords, b bass, p pad },
//     P: { A: { c: 'C6 Am7 Dm7,G7 %', m: "5-35 '1-76 ...", h?: counter line, b?: written bass line }, ... }, form: 'I A A& B A~ ...', end?: 'C69', mix?: { m, h, c, b, p, d } }
// LINES (m, h, b): one word per bar; the bar is split evenly among its tokens (4 tokens in 4/4 = quarters, 8 = eighths, 12 = triplets, 16 = sixteenths).
//   token: scale degree 1-7 with optional prefixes ' (octave up) , (octave down) # b;  - holds the note before (also over the bar line);  . rest.
// CHORDS (c): one word per bar, commas split the bar evenly ("Dm7,G7"), % repeats the bar before. Names: C Cm C7 CM7 Cm7 C6 Cm6 C9 CM9 Cm9 Csus C7sus Cdim Co7 Cm7b5 C+ C7b9 C13 Cadd9 C69 C7#5 CmM7 ... with /E bass.
// FORM: section names with marks: -mhcbdp drop layers, =cb only these layers, & add the counter line, ~ second lead, + / _ lead an octave up / down, ! louder, ? softer, ^2 key up 2 semitones.
import { Synth, echo } from './_music_synth.js';

const MAJ = [0, 2, 4, 5, 7, 9, 11], MIN = [0, 2, 3, 5, 7, 8, 10], PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const Q = { '': [0, 4, 7], m: [0, 3, 7], 7: [0, 4, 7, 10], M7: [0, 4, 7, 11], m7: [0, 3, 7, 10], 6: [0, 4, 7, 9], m6: [0, 3, 7, 9], 9: [0, 4, 7, 10, 14], M9: [0, 4, 7, 11, 14], m9: [0, 3, 7, 10, 14],
  sus: [0, 5, 7], sus2: [0, 2, 7], '7sus': [0, 5, 7, 10], '9sus': [0, 5, 7, 10, 14], dim: [0, 3, 6], o7: [0, 3, 6, 9], m7b5: [0, 3, 6, 10], '+': [0, 4, 8], '7b9': [0, 4, 7, 10, 13], 13: [0, 4, 10, 14, 21], add9: [0, 4, 7, 14], 69: [0, 4, 7, 9, 14],
  '7#5': [0, 4, 8, 10], mM7: [0, 3, 7, 11], '7#9': [0, 4, 10, 15], m69: [0, 3, 7, 9, 14], madd9: [0, 3, 7, 14], 11: [0, 7, 10, 14, 17], 5: [0, 7] };
const mulberry = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const hash = s => { let h = 7; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; };

/* accompaniment patterns. n steps per bar; c chords: x X o stabs (normal / accent / ghost), s d strums, u upper voices, 1-6 single voices (arpeggio), - hold;
   b bass: R root, 3 5 6 7 chord tones, O octave, a approach to the next root, w a passing chord tone, - hold; d drums by piece (see Synth.drum): x hit, o soft; f: drums of a section's last bar.
   sw / s16: swing of the off-beat eighths / sixteenths (1 = triplet feel); cl: length of a stab in steps; cw / bl: lowest note of the chord voicing / of the bass. */
export const STYLES = {
  bossa: { n: 16, c: ['x..x..x...x.x...', '..x..x..x...x...'], cl: 1.6, b: 'R-----5.5-----R.', d: { r: 'x..x..x...x..x..', m: 'o.o.o.o.o.o.o.o.', k: 'x.....o.x.....o.' } },
  lofi: { n: 16, s16: .5, c: 'x------...x-----', b: 'R-----R...5.R---', d: { k: 'x.....x...x.....', s: '....x.......x...', h: 'o.o.o.o.o.o.o.o.' } },
  citypop: { n: 16, c: ['x..x..x-...x.x..', 'x..x..x-..x..x..'], cl: 1.2, b: ['R..R..O.R..5.3.a', 'R..R..O.R.5.O.5a'], d: { k: 'x.....x.x.......', s: '....x.......x...', h: 'x.o.x.o.x.o.x.o.' }, f: { o: '............x.xx' } },
  jwaltz: { bar: 3, n: 6, sw: .8, c: ['..x.x.', '..x..x'], cl: 1.2, b: ['R-..5.', 'R-.3.a'], d: { g: 'x.x.xo', b: '..o.o.', k: 'o.....' } },
  waltz: { bar: 3, n: 6, c: '..x.x.', cl: 1.5, b: 'R---..', d: {} },
  stride: { n: 8, sw: .6, c: '..u...u.', cl: 1.2, b: ['R-..5-..', 'R-..3-..'], bl: 33, d: { b: '..o...o.' } },
  box: { n: 8, c: '1.2.3.2.', cl: 4, b: '', d: {} },
  box3: { bar: 3, n: 6, c: '1.2.3.', cl: 4, b: '', d: {} },
  surf: { n: 16, c: 's...s.s.s...s.s.', cl: 1.5, b: 'R.R.5.5.O.O.5.5.', d: { k: 'x.....x.x.......', s: '....x.x.....x...', h: 'x.o.x.o.x.o.x.o.' }, f: { o: '........x.x.x.xx' } },
  march: { n: 16, c: '..x...x...x...x.', cl: 1.5, b: 'R...5...R...5...', d: { k: 'x.......x.......', r: 'x..xx.x.x..xx.x.', s: '....o.......o...' } },
  folk: { n: 8, c: ['..3.2.34', '..3.2.43'], cl: 3, b: 'R-5-R-5-', bl: 40, d: {} },
  bolero: { n: 16, c: '..2.3.4...2.3.4.', cl: 3, b: 'R-----5-R---5---', d: { m: 'o.o.o.o.o.o.o.o.', w: '..x...x...x.x...' } },
  blues: { n: 12, c: ['x-.x-.x-.x-.', '..x..x..x..x'], cl: 1.5, b: ['R-.3-.5-.6-a', 'O-.7-.5-.3-a'], d: { g: 'x.xx.xx.xx.x', s: '...o.....o..', k: 'x.....o.....' } },
  synthpop: { n: 16, c: '1.3.2.3.4.3.2.3.', cl: 1.6, b: 'R.R.R.R.R.R.R.R.', d: { k: 'x...x...x...x...', c: '....x.......x...', h: '..o...o...o...o.' }, f: { o: '..........x.x.xx' } },
  ambient: { n: 8, c: '1...3.2.', cl: 8, b: 'R-------', d: {} },
  shanty: { bar: 2, n: 6, c: ['x..x.x', 'x..x..'], cl: 1.4, b: 'R--5--', d: { k: 'x.....', r: '...x..', m: 'o.oo.o' } },
  lull: { bar: 2, n: 6, c: '123123', cl: 3, b: 'R-----', d: {} },
  polka: { bar: 2, n: 8, c: '..x...x.', cl: 1.3, b: ['R-..5-..', 'R-..3-..'], d: { k: 'x...x...', r: '..x...x.' }, f: { o: '....x.xx' } },
  swing: { n: 8, sw: .9, c: ['..x..x..', 'x....x..', '...x..x.', '.x...x..'], cl: 1.3, b: ['R.w.5.a.', 'R.3.5.a.', 'O.7.5.a.', 'R.5.3.a.'], d: { g: 'x.xox.xo', h: '..o...o.', k: 'o.......' } },
  rock: { n: 8, sw: .35, c: 'x.xxx.xx', cl: .9, b: ['R.3.5.6.', '7.6.5.3.'], d: { k: 'x...x...', s: '..x...x.', h: 'oooooooo' }, f: { o: '....x.xx' } },
  ballad: { n: 8, c: '12343234', cl: 3, b: 'R-----5-', d: { k: 'x...x...', r: '..x...x.', m: 'oooooooo' } },
  calypso: { n: 16, c: '..x...x...x...x.', cl: 1.4, b: 'R.....5.3...5...', d: { k: 'x.....x.x.....x.', r: '....x.......x...', m: 'o.oxo.oxo.oxo.ox', T: '..x..x....x..x..' } },
  disco: { n: 16, c: '..x.x..x..x.x..x', cl: 1, b: 'R.O.R.O.R.O.R.O.', d: { k: 'x...x...x...x...', c: '....x.......x...', h: '..x...x...x...x.' }, f: { o: '..........x.x.xx' } },
  five: { bar: 5, n: 10, sw: .7, c: 'x..x..x.x.', cl: 1.4, b: 'R--5--R-5-', d: { g: 'x.xx.xx.x.', k: 'o.....o...', b: '...o....o.' } },
  samba: { n: 16, c: 'x..x.x..x.x..x.x', cl: 1, b: 'R..5..R.R..5..R.', d: { k: 'x.......x.......', t: '....x..x....x..x', m: 'xoxoxoxoxoxoxoxo', w: 'x.x..x.x..x.x.x.' } },
  doowop: { n: 12, c: 'xooxooxooxoo', cl: .9, b: 'R-----5----a', d: { k: 'x.....x.....', s: '...x.....x..', h: 'o.oo.oo.oo.o' } },
  shuffle: { n: 8, sw: .7, c: '..x...x.', cl: 1.2, b: 'R-..5-..', d: { b: 'xoxoxoxo', k: 'x...x...' } },
  habanera: { n: 8, c: '..x.x.x.', cl: .9, b: 'R--5R-5-', d: { r: 'x..xx.x.' } },
  motorik: { n: 16, c: '1.2.3.2.4.2.3.2.', cl: 1.5, b: 'R.R.R.R.R.R.R.R.', d: { k: 'x...x...x...x...', s: '....o.......o...', h: 'o.o.o.o.o.o.o.o.' } },
  hymn: { n: 8, c: 'x---x---', b: 'R-------', d: {} },
  solo: { n: 8, c: '1.3.2.3.', cl: 3, b: 'R-------', bl: 40, d: {} },
};
const LG = { m: 1, h: .62, c: .55, b: .8, p: .5, d: .75 };

function chord(name) {
  const m = /^([A-G])([#b]?)([^/]*)(?:\/([A-G])([#b]?))?$/.exec(name), iv = m && Q[m[3]]; if (!iv) throw new Error('chord? ' + name);
  const acc = s => s === '#' ? 1 : s === 'b' ? -1 : 0, root = (PC[m[1]] + acc(m[2]) + 12) % 12;
  return { name, root, iv, bass: m[4] ? (PC[m[4]] + acc(m[5]) + 12) % 12 : root, minor: iv[1] === 3 };
}
/** 'C6 Am7,D7 %' -> per bar [{ ch, at, len }] (beats) */
function chords(str, bar) {
  const out = []; for (const w of str.trim().split(/\s+/)) { if (w === '%') { if (!out.length) throw new Error('% first'); out.push(out[out.length - 1]); continue; } const p = w.split(','); out.push(p.map((n, i) => ({ ch: chord(n), at: i * bar / p.length, len: bar / p.length }))); }
  return out;
}
/** a written line -> { notes: [[beat, midi, len]], bars, grids } */
function line(str, base, sc, bar) {
  const notes = []; let last = null, b0 = 0; const grids = new Set();
  for (const w of str.trim().split(/\s+/)) {
    const tk = w.match(/[',#b]*[1-7]|-|\./g); if (!tk || tk.join('') !== w) throw new Error('line? "' + w + '"'); const n = tk.length, st = bar / n; grids.add(n);
    tk.forEach((x, i) => {
      if (x === '-') { if (last) last[2] += st; return; } if (x === '.') { last = null; return; }
      let o = 0, a = 0; for (const c of x.slice(0, -1)) { if (c === "'") o++; else if (c === ',') o--; else if (c === '#') a++; else a--; }
      notes.push(last = [b0 + i * st, base + sc[+x.slice(-1) - 1] + 12 * o + a, st]);
    });
    b0 += bar;
  }
  return { notes, bars: b0 / bar, grids };
}
const inWin = (pc, lo) => lo + (((pc - lo) % 12) + 12) % 12;
function voicing(ch, tr, lo, rootless) {
  let iv = ch.iv.slice(); if ((rootless && iv.length >= 4) || iv.length >= 5) iv = iv.filter(x => x !== 0); if (iv.length > 4) iv = iv.filter(x => x !== 7);
  return [...new Set(iv.map(x => inWin(ch.root + x + tr, lo)))].sort((a, b) => a - b);
}
const pat = (p, i) => Array.isArray(p) ? p[i % p.length] : p;

/** song -> { ev: [[t, kind, a, b, c, d]], dur, bars, secs, info }; kind 0 note [t, 0, inst, midi, len, vel], kind 1 drum [t, 1, piece, vel]. Cached on the song. */
export function compile(S) {
  if (S._c) return S._c;
  const st = Object.assign({}, STYLES[S.style] || STYLES.ballad, S.st || {}), bar = S.bar || st.bar || 4, spb = 60 / S.bpm, sc = S.min ? MIN : MAJ, mo = S.mo || 72, n = st.n, sw = st.sw || 0, s16 = st.s16 || 0;
  const ins = S.ins || {}, mix = Object.assign({}, LG, S.mix || {}), rnd = mulberry(hash(S.id)), ev = [], secs = [], warn = [], stepB = bar / n;
  for (const k of ['c', 'b']) for (const p of [].concat(st[k] || [])) if (p && p.length !== n) throw new Error(S.id + ': style ' + k + ' pattern length ' + p.length + ' != ' + n);
  for (const k in st.d || {}) if (st.d[k].length !== n) throw new Error(S.id + ': drum ' + k + ' length'); for (const k in st.f || {}) if (st.f[k].length !== n) throw new Error(S.id + ': fill ' + k + ' length');
  const swing = b => { const f = b - Math.floor(b + 1e-6); if (sw && Math.abs(f - .5) < .02) return b + sw / 6; if (s16 && (Math.abs(f - .25) < .02 || Math.abs(f - .75) < .02)) return b + s16 / 12; return b; };
  const hum = () => (rnd() - .5) * .012, vel = () => .92 + rnd() * .16;
  const put = (b, inst, m, len, v, tight) => ev.push([Math.max(0, swing(b) * spb + (tight ? 0 : hum())), 0, inst, m, Math.max(.04, len * spb), v * vel()]);
  const parts = {}, part = name => { if (parts[name]) return parts[name]; const P = S.P[name]; if (!P) throw new Error(S.id + ': no part ' + name); const o = { ch: chords(P.c, bar) }; o.bars = o.ch.length;
    for (const k of ['m', 'h', 'b']) if (P[k]) { o[k] = line(P[k], 0, sc, bar); if (o[k].bars !== o.bars) throw new Error(S.id + ' part ' + name + ': line ' + k + ' has ' + o[k].bars + ' bars, chords ' + o.bars); }
    return parts[name] = o; };
  const form = S.form.trim().split(/\s+/).map(tok => { const m = /^([A-Za-z][A-Za-z0-9]*)(.*)$/.exec(tok); if (!m) throw new Error(S.id + ': form ' + tok); let mods = m[2], L = null, tr = 0;
    mods = mods.replace(/([=-])([mhcbdp]+)/, (x, s, l) => { L = [s, l]; return ''; }).replace(/\^(-?\d+)/, (x, v) => { tr = +v; return ''; }); if (/[^&~+_!?]/.test(mods)) throw new Error(S.id + ': form mark ' + tok);
    return { name: m[1], L, tr, h: mods.includes('&'), alt: mods.includes('~'), oct: mods.includes('+') ? 12 : mods.includes('_') ? -12 : 0, dyn: mods.includes('!') ? 1.18 : mods.includes('?') ? .78 : 1 }; });
  let b0 = 0; const cw = st.cw || 55, bl = st.bl || 36, allCh = new Set(), mel = [];
  form.forEach((F, fi) => {
    const P = part(F.name), tr = (S.tr || 0) + F.tr, on = k => F.L ? (F.L[0] === '=' ? F.L[1].includes(k) : !F.L[1].includes(k)) : true, dy = F.dyn, lastSec = fi === form.length - 1;
    const nextRoot = (i, s) => { const segs = P.ch[i]; if (s + 1 < segs.length) return segs[s + 1].ch.bass; const nb = P.ch[i + 1] || (form[fi + 1] ? part(form[fi + 1].name).ch[0] : P.ch[0]); return nb[0].ch.bass; };
    secs.push({ name: F.name, at: b0 * spb, bars: P.bars });
    for (let i = 0; i < P.bars; i++) {
      const segs = P.ch[i], bb = b0 + i * bar, segAt = k => { let s = 0; for (let j = 0; j < segs.length; j++) if (k * stepB >= segs[j].at - 1e-6) s = j; return s; }, fill = i === P.bars - 1 && P.bars >= 4 && !lastSec;
      segs.forEach(sg => allCh.add(sg.ch.name));
      /* pad */
      if (ins.p && on('p')) segs.forEach(sg => { for (const m of voicing(sg.ch, tr, cw, true)) put(bb + sg.at, ins.p, m, sg.len * 1.02, .5 * mix.p * dy, true); });
      /* chords */
      const cp = pat(st.c, i);
      if (ins.c && cp && on('c')) {
        const starts = new Set(); for (let k = 0; k < n; k++) if (cp[k] !== '.' && cp[k] !== '-') starts.add(segAt(k));
        const play = (k, tk, sgi, len) => { const sg = segs[sgi], v = voicing(sg.ch, tr, cw, st.rl !== false && !!ins.b), b = bb + k * stepB, g = mix.c * dy;
          if (/[1-6]/.test(tk)) { const j = +tk - 1; put(b, ins.c, v[j % v.length] + 12 * Math.floor(j / v.length), len, .85 * g); return; }
          const vs = tk === 'u' ? v.slice(-3) : v, a = tk === 'X' ? 1.15 : tk === 'o' ? .55 : .9, str = tk === 's' || tk === 'd' ? .016 / spb : 0;
          (tk === 'd' ? vs.slice().reverse() : vs).forEach((m, j) => put(b + j * str, ins.c, m, len, a * g / Math.sqrt(vs.length / 3), !str)); };
        for (let k = 0; k < n; k++) { const tk = cp[k]; if (tk === '.' || tk === '-') continue; let l = 1; while (cp[k + l] === '-') l++; play(k, tk, segAt(k), l > 1 ? l * stepB * .97 : (st.cl || 1) * stepB * .9); }
        segs.forEach((sg, j) => { if (!starts.has(j)) play(Math.round(sg.at / stepB), /[1-6]/.test(cp.replace(/[.-]/g, '')[0] || 'x') ? '1' : 'x', j, Math.min(sg.len, (st.cl || 1) * stepB) * .9); });
      }
      /* bass */
      if (ins.b && on('b') && !P.b) {
        let bp = pat(st.b, i); if (bp) {
          const a = bp.split(''); segs.forEach(sg => { const k = Math.round(sg.at / stepB); if (k > 0 && k < n) a[k] = 'R'; });
          for (let k = 0; k < n; k++) { const tk = a[k]; if (tk === '.' || tk === '-') continue; let l = 1; while (a[k + l] === '-') l++; const sgi = segAt(k), ch = segs[sgi].ch, r = inWin(ch.bass + tr, bl), third = ch.iv[1] <= 5 ? ch.iv[1] : 4, sev = ch.iv[3] && ch.iv[3] < 12 ? ch.iv[3] : 10;
            let m = r; if (tk === '5') m = r + (ch.iv.includes(6) ? 6 : ch.iv.includes(8) ? 8 : 7); else if (tk === '3') m = r + third; else if (tk === 'O') m = r + 12; else if (tk === '7') m = r + sev; else if (tk === '6') m = r + (ch.minor ? 10 : 9);
            else if (tk === 'w') m = r + [third, 7, third, sev - 12][(rnd() * 4) | 0]; else if (tk === 'a') { let nr = inWin(nextRoot(i, sgi) + tr, bl); if (nr - r > 6) nr -= 12; m = nr + (rnd() < .7 ? -1 : 1); if (m < bl - 5) m += 12; }
            if (ch.bass !== ch.root && tk !== 'R' && tk !== 'O') m = r; while (m > bl + 19) m -= 12;
            put(bb + k * stepB, ins.b, m, l * stepB * (l > 1 ? .95 : .85), (k === 0 ? 1 : .88) * mix.b * dy); }
        }
      }
      /* drums */
      if (on('d') && st.d) { const D = fill && st.f ? Object.assign({}, st.d, st.f) : st.d; for (const pc in D) { const p = D[pc]; for (let k = 0; k < n; k++) if (p[k] === 'x' || p[k] === 'o') ev.push([swing(bb + k * stepB) * spb, 1, pc, (p[k] === 'x' ? 1 : .5) * mix.d * dy * (.9 + rnd() * .2)]); } }
    }
    /* written lines */
    const lines = [['m', F.alt && ins.m2 ? ins.m2 : ins.m, mo + F.oct, mix.m, on('m')], ['h', ins.h || ins.m2 || 'strings', (S.ho || mo - 12), mix.h, F.h && on('h')], ['b', ins.b, S.bo || 36, mix.b, on('b')]];
    for (const [k, inst, base, g, ok] of lines) if (P[k] && ok && inst) for (const [b, m, len] of P[k].notes) { const pm = m + base + tr, f = b - Math.floor(b + 1e-6); put(b0 + b, inst, pm, len * (k === 'b' ? .9 : .95), (f < .02 ? 1 : .9) * g * dy); if (k === 'm') mel.push([b0 + b, pm, len]); }
    b0 += P.bars * bar;
  });
  /* the last chord */
  const E = chord(S.end || (S.min ? 'Cm' : 'C')), tr = (S.tr || 0) + form[form.length - 1].tr, hold = Math.max(bar, 2.6 / spb);
  if (ins.c) voicing(E, tr, cw, false).forEach((m, j) => put(b0 + j * .03 / spb, ins.c, m, hold, .8 * mix.c)); if (ins.b) put(b0, ins.b, inWin(E.bass + tr, bl), hold, .9 * mix.b); if (ins.p) for (const m of voicing(E, tr, cw, true)) put(b0, ins.p, m, hold, .5 * mix.p, true);
  if (ins.m) put(b0, ins.m, inWin(E.root + tr, mo - 5), hold * .8, .7 * mix.m);
  ev.sort((a, b) => a[0] - b[0]);
  const ps = mel.map(x => x[1]), names = [...new Set(form.map(f => f.name))];
  for (const k in parts) for (const l of ['m', 'h']) if (parts[k][l]) for (const g of parts[k][l].grids) if (!((bar * 12) % g === 0 || g % bar === 0)) warn.push('part ' + k + ' ' + l + ': bar of ' + g + ' tokens in a ' + bar + '-beat bar');
  if (ps.length && (Math.max(...ps) > 93 || Math.min(...ps) < 50)) warn.push('lead range ' + Math.min(...ps) + '..' + Math.max(...ps));
  const info = { bars: b0 / bar, sections: form.length, parts: names.length, chords: allCh.size, pitches: new Set(ps).size, lo: ps.length ? Math.min(...ps) : 0, hi: ps.length ? Math.max(...ps) : 0, notes: ev.length, mel: mel.slice(0, 400), warn,
    kit: Object.keys(st.d || {}).join(''), ins: [...new Set([ins.m, ins.m2, ins.h, ins.c, ins.b, ins.p].filter(Boolean))] };
  return S._c = { ev, dur: (b0 + hold) * spb + 1.6, body: b0 * spb, barS: bar * spb, secs, info };
}

/** One playing tune. schedule(until) is called often (the game: every frame) and creates the notes that start before `until` (context time). */
export class Player {
  constructor(ctx, song, dest, send, opts = {}) {
    this.ctx = ctx; this.song = song; this.id = song.id; this.c = compile(song); this.out = ctx.createGain(); this.out.gain.value = Math.pow(10, ((opts.db || 0)) / 20); this.out.connect(dest);
    this.syn = new Synth(ctx, this.out, send); this.t0 = (opts.at !== undefined ? opts.at : ctx.currentTime + .15); this.i = 0; this.done = false; this.cut = Infinity; this.next = this.t0 + this.c.dur; this.started = this.t0;
  }
  schedule(until) {
    const ev = this.c.ev, t0 = this.t0, s = this.syn; let n = 0;
    while (this.i < ev.length) { const e = ev[this.i], t = t0 + e[0]; if (t >= until) break; this.i++; if (t >= this.cut) continue; if (e[1] === 0) s.note(e[2], t, e[3], e[4], e[5]); else s.drum(e[2], t, e[3]); n++; }
    if (this.i >= ev.length || until >= this.cut) this.done = true; return n;
  }
  /** seconds played so far, and where that is */
  pos() { const t = this.ctx.currentTime - this.t0, S = this.c.secs; let sec = null; for (const s of S) if (t >= s.at) sec = s; return { t: Math.max(0, t), dur: this.c.dur, section: sec ? sec.name : null, bar: Math.max(0, Math.floor(t / this.c.barS)) + 1 }; }
  /** end musically: play to the end of the bar, then fade over `fade` seconds. Returns the time everything is silent. */
  wind(fade = 1.6) { const now = this.ctx.currentTime, el = now - this.t0, bs = this.c.barS; let tb = this.t0 + Math.ceil((el + .05) / bs) * bs; if (tb - now > 2.5 || el < 0) tb = now + .1; return this.stop(fade, tb); }
  stop(fade = 1.5, at) { const ctx = this.ctx, g = this.out.gain, t = Math.max(ctx.currentTime, at || 0); if (this.cut !== Infinity) return this.next; this.cut = t + fade; this.next = t + fade;
    try { g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(.0001, t + fade); } catch (e) { /* closed context */ }
    const out = this.out; if (typeof setTimeout !== 'undefined') setTimeout(() => { try { out.disconnect(); } catch (e) { /* gone */ } }, (t - ctx.currentTime + fade + 4) * 1000); return this.next; }
}
/** render a whole tune offline -> Promise<AudioBuffer> (stereo). OAC: the OfflineAudioContext constructor.
 *  The notes are created two seconds at a time (the context is paused at each step), as in the game: creating them all at once makes the render many times slower. */
export function renderSong(song, sr = 48000, db = 0, OAC = (typeof OfflineAudioContext !== 'undefined' ? OfflineAudioContext : webkitOfflineAudioContext)) {
  const c = compile(song), ctx = new OAC(2, Math.ceil((c.dur + .5) * sr), sr), p = new Player(ctx, song, ctx.destination, echo(ctx, ctx.destination), { db, at: .05 }), step = 2;
  if (!ctx.suspend) p.schedule(Infinity); else { p.schedule(step + .6); for (let t = step; t < c.dur + .5; t += step) ctx.suspend(t).then(() => { p.schedule(t + step + .6); ctx.resume(); }); }
  return ctx.startRendering();
}
