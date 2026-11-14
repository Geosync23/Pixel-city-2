// Scores for the performance venues (private helper of shows.js): 3 concert pieces, 4 film scores and the musical's song.
// Everything is written in a tiny notation ("e5:1 g5:.5 r:1 c4+e4:2", note:beats) and arranged in code; the result is the score format of
// _shows_audio.js. Orchestra section keys (track.sec): vln1 vln2 vla vc cb fl ob cl bsn hn tpt tbn tuba timp perc harp.
const PC = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
const N = s => { const m = /^([a-g])(#|b)?(\d)$/.exec(s); return m ? PC[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + 12 * (+m[3] + 1) : 60; };
/** chord name -> { r: root pitch class, t: [intervals] } */
const CH = s => { const m = /^([A-G])(#|b)?(m)?(7)?$/.exec(s), r = PC[m[1].toLowerCase()] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0), t = m[3] ? [0, 3, 7] : [0, 4, 7]; if (m[4]) t.push(10); return { r, t }; };
function mk(bpm, meter) {
  const spb = 60 / bpm, T = {};
  const tr = (key, inst, sec, gain = 1) => T[key] || (T[key] = { inst, sec, gain, notes: [] });
  const put = (t, beat, midi, len, vel = .8) => t.notes.push([beat * spb, midi, len * spb, vel]);
  const line = (t, bar, str, vel = .8, tp = 0) => { let b = bar * meter; for (const tok of str.split(/\s+/)) { if (!tok || tok === '|') continue; const [n, d] = tok.split(':'), len = +d; if (n !== 'r') for (const x of n.split('+')) put(t, b, N(x) + tp, len * .94, vel); b += len; } };
  const done = bars => ({ dur: bars * meter * spb, bpm, meter, spb, bars, tracks: Object.values(T).map(t => (t.notes.sort((a, b) => a[0] - b[0]), t)) });
  return { tr, put, line, done, spb, meter };
}
const tone = (c, i, oct) => 12 * (oct + 1) + c.r + c.t[i % c.t.length] + 12 * Math.floor(i / c.t.length);

/* ------------------------------------------------------------------ concert pieces */
function waltz() {
  const S = mk(160, 3), A = 'G G D7 D7 D7 D7 G G G G7 C C G D7 G G'.split(' '), B = 'Em Em Am Am D7 D7 G B7 Em Em Am Am C D7 G D7'.split(' '), ch = ['G', 'G', 'D7', 'D7', ...A, ...B, ...A, 'G', 'D7', 'G', 'G'];
  const mA = 'd5:2 b4:1 g4:2 b4:1 a4:2 c5:1 f#5:3 e5:2 c5:1 a4:2 c5:1 b4:2 d5:1 g5:3 d5:2 b4:1 g4:2 f5:1 e5:2 g5:1 c6:3 b5:1 a5:1 g5:1 f#5:2 a5:1 g5:3 g5:2 r:1';
  const mB = 'e5:1 g5:1 b5:1 b5:2 a5:1 a5:1 c6:1 e6:1 e6:2 d6:1 c6:1 a5:1 f#5:1 a5:2 c6:1 b5:2 g5:1 f#5:3 e5:1 g5:1 b5:1 b5:2 a5:1 c6:1 b5:1 a5:1 e5:3 g5:2 e5:1 f#5:2 a5:1 g5:3 a5:1 b5:1 c6:1';
  const coda = 'g5:1 b5:1 d6:1 f#6:2 d6:1 g6:3 g6:3';
  const v1 = S.tr('v1', 'str', ['vln1']), ww = S.tr('ww', 'wind', ['fl', 'ob', 'cl']), tp = S.tr('tp', 'brass', ['tpt'], .7), bs = S.tr('bs', 'pizz', ['vc', 'cb']), in2 = S.tr('in', 'pizz', ['vln2', 'vla'], .7),
    hn = S.tr('hn', 'brass', ['hn', 'tbn', 'bsn'], .5), tb = S.tr('tb', 'bass', ['tuba'], .8), ti = S.tr('ti', 'timp', ['timp']), cy = S.tr('cy', 'cym', ['perc']), hp = S.tr('hp', 'harp', ['harp'], .8);
  S.line(v1, 4, mA, .8); S.line(ww, 20, mB, .9); S.line(v1, 20, mB, .35, -12); S.line(v1, 36, mA, 1); S.line(ww, 36, mA, .7, 12); S.line(tp, 36, mA, .7); S.line(v1, 52, coda, 1); S.line(ww, 52, coda, .8); S.line(tp, 52, coda, .9);
  ch.forEach((n, i) => {
    const c = CH(n), b = i * 3, tutti = i >= 36, last = i >= 54;
    S.put(bs, b, tone(c, i % 2 && !last ? 2 : 0, 2), 1, .9); if (!last) { S.put(in2, b + 1, tone(c, 1, 4), .5); S.put(in2, b + 1, tone(c, 2, 4), .5); S.put(in2, b + 2, tone(c, 1, 4), .5); S.put(in2, b + 2, tone(c, 2, 4), .5); }
    if (i >= 20 && i < 36) for (let k = 0; k < 6; k++) S.put(hp, b + k * .5, tone(c, k < 4 ? k : 6 - k, 4), .5, .7);
    if (tutti) { S.put(hn, b, tone(c, 0, 3), 2.8); S.put(hn, b, tone(c, 1, 3), 2.8); S.put(tb, b, tone(c, 0, 1), 1); S.put(ti, b, tone(c, 0, 2), 1, i % 2 ? .5 : .9); }
    if (last) { S.put(in2, b, tone(c, 1, 4), 2.9); S.put(in2, b, tone(c, 2, 4), 2.9); for (let k = 0; k < 6; k++) S.put(ti, b + k * .5, 43, .4, .5 + k * .08); }
  });
  S.put(cy, 36 * 3, 60, 2, .7); S.put(cy, 54 * 3, 60, 3, 1);
  return S.done(56);
}
function adagio() {
  const S = mk(64, 4), ch = 'Dm Dm Gm A Dm Bb Gm A F C Dm Bb Gm A7 Dm Dm D D'.split(' ');
  const m1 = 'a4:3 d5:1 f5:2 e5:1 d5:1 d5:3 bb4:1 a4:2 c#5:2 d5:2 f5:1 a5:1 bb5:3 a5:1 g5:2 bb5:1 g5:1 e5:4', m2 = 'a5:3 c6:1 g5:2 e5:1 g5:1 f5:2 a5:1 d6:1 d6:3 bb5:1 bb5:2 a5:1 g5:1 a5:2 g5:1 e5:1 d5:4 d5:2 f5:1 a5:1 a5:4 a5:4';
  const ob = S.tr('ob', 'reed', ['ob']), v1 = S.tr('v1', 'str', ['vln1']), fl = S.tr('fl', 'wind', ['fl', 'cl'], .7), pad = S.tr('pad', 'str', ['vln2', 'vla'], .5), vc = S.tr('vc', 'str', ['vc', 'bsn'], .6), cb = S.tr('cb', 'bass', ['cb'], .8),
    hp = S.tr('hp', 'harp', ['harp'], .8), hn = S.tr('hn', 'brass', ['hn', 'tbn', 'tuba'], .4), ti = S.tr('ti', 'timp', ['timp']), cy = S.tr('cy', 'cym', ['perc']), tp = S.tr('tp', 'brass', ['tpt'], .4);
  S.line(ob, 0, m1, 1.2); S.line(v1, 8, m2, 1); S.line(fl, 8, m2, .8, 12); S.line(v1, 0, m1, .3, -12);
  ch.forEach((n, i) => {
    const c = CH(n), b = i * 4, fin = i >= 16;
    S.put(pad, b, tone(c, 1, 4), 3.9); S.put(pad, b, tone(c, 2, 3), 3.9); S.put(vc, b, tone(c, 0, 3), 3.9); S.put(cb, b, tone(c, 0, 2), 3.8);
    if (i >= 4 && !fin) for (let k = 0; k < 8; k++) S.put(hp, b + k * .5, tone(c, k < 5 ? k : 8 - k, 3), .5, .7); if (fin && i === 16) for (let k = 0; k < 8; k++) S.put(hp, b + k * .25, tone(c, k, 3), 2, .8);
    if (i >= 8) { S.put(hn, b, tone(c, 1, 3), 3.8); S.put(hn, b, tone(c, 0, 3), 3.8); } if (i === 13 || fin) for (let k = 0; k < 16; k++) S.put(ti, b + k * .25, tone(c, 0, 2), .2, .25 + (i === 13 ? k * .03 : .2 - k * .01));
    if (fin) S.put(tp, b, tone(c, 2, 4), 3.8);
  });
  S.put(cy, 14 * 4, 60, 2, .5);
  return S.done(18);
}
function overture() {
  const S = mk(144, 4), ch = [...'C C G G'.split(' '), ...'C F G C Am Dm G7 C'.split(' '), ...'C F G C Am Dm G7 C'.split(' '), ...'F C Dm Am F C G7 G7'.split(' '), ...'C F G C'.split(' '), ...'C G C C'.split(' ')];
  const fan = 'c5:1 c5:.5 c5:.5 e5:1 g5:1 c6:2 g5:2 d5:1 d5:.5 d5:.5 g5:1 b5:1 d6:2 r:2';
  const mA = 'e5:.5 g5:.5 c6:1 b5:.5 a5:.5 g5:1 a5:.5 c6:.5 f6:1 e6:.5 d6:.5 c6:1 b5:.5 d6:.5 g6:1 f6:.5 e6:.5 d6:1 e6:2 c6:2 c6:.5 b5:.5 a5:1 e5:1 a5:1 d6:.5 c6:.5 a5:1 f5:1 a5:1 g5:.5 a5:.5 b5:.5 c6:.5 d6:1 f6:1 e6:3 r:1';
  const mB = 'a5:2 c6:1 a5:1 g5:3 e5:1 f5:2 a5:1 d6:1 c6:3 a5:1 a5:1 c6:1 f6:2 e6:2 c6:2 d6:1 b5:1 g5:1 b5:1 d6:2 g6:2', mA4 = mA.split(' ').slice(0, 22).join(' '), coda = 'c6:1 e6:1 g6:1 e6:1 d6:1 g6:1 b6:1 g6:1 c7:4 c7:3 r:1';
  const v1 = S.tr('v1', 'str', ['vln1']), ww = S.tr('ww', 'wind', ['fl', 'ob', 'cl'], .8), br = S.tr('br', 'brass', ['tpt', 'hn'], .9), lo = S.tr('lo', 'brass', ['tbn', 'tuba', 'bsn'], .6), chug = S.tr('chug', 'str', ['vln2', 'vla'], .55),
    bs = S.tr('bs', 'bass', ['vc', 'cb'], .9), ti = S.tr('ti', 'timp', ['timp']), cy = S.tr('cy', 'cym', ['perc']), sn = S.tr('sn', 'snare', ['perc'], .6), hp = S.tr('hp', 'harp', ['harp'], .8);
  S.line(br, 0, fan, 1); S.line(v1, 4, mA, .9); S.line(v1, 12, mA, 1); S.line(ww, 12, mA, .8, 12); S.line(ww, 20, mB, 1); S.line(v1, 20, mB, .3, -12); S.line(v1, 28, mA4, 1); S.line(ww, 28, mA4, .8, 12); S.line(br, 28, mA4, .7, -12); S.line(v1, 32, coda, 1); S.line(ww, 32, coda, .8); S.line(br, 32, coda, 1, -12);
  ch.forEach((n, i) => {
    const c = CH(n), b = i * 4, intro = i < 4, lyr = i >= 20 && i < 28, tutti = (i >= 12 && i < 20) || i >= 28, fin = i >= 34;
    if (intro) { S.put(lo, b, tone(c, 0, 2), 3.5); S.put(lo, b, tone(c, 2, 2), 3.5); for (const k of [0, 1, 1.5, 2, 3]) S.put(ti, b + k, tone(c, 0, 2), .4, k ? .6 : 1); for (let k = 0; k < 8; k++) S.put(sn, b + 2 + k * .25, 60, .1, i % 2 ? .5 + k * .06 : 0); return; }
    if (fin) { for (const t of [v1, ww]) S.put(t, b, tone(c, 1, 5), 3.8, .6); S.put(lo, b, tone(c, 0, 2), 3.8); S.put(br, b, tone(c, 2, 4), 3.8, .8); S.put(bs, b, tone(c, 0, 2), 3.8); for (let k = 0; k < 16; k++) S.put(ti, b + k * .25, 36, .2, .5 + (i === 34 ? k * .03 : .3 - k * .02)); return; }
    if (lyr) { S.put(chug, b, tone(c, 1, 4), 3.9, .7); S.put(chug, b, tone(c, 2, 3), 3.9, .7); S.put(bs, b, tone(c, 0, 2), 1.5); S.put(bs, b + 2, tone(c, 2, 2), 1.5); for (let k = 0; k < 8; k++) S.put(hp, b + k * .5, tone(c, k < 5 ? k : 8 - k, 4), .5, .7); S.put(lo, b, tone(c, 0, 3), 3.8, .5); return; }
    for (let k = 0; k < 8; k++) S.put(chug, b + k * .5, tone(c, k % 2 ? 2 : 1, 4), .3, k % 4 ? .7 : 1); S.put(bs, b, tone(c, 0, 2), .9); S.put(bs, b + 2, tone(c, 2, 2), .9); S.put(bs, b + 3, tone(c, 1, 2), .9);
    if (tutti) { for (const k of [0, 2]) { S.put(lo, b + k, tone(c, 0, 2), .8); S.put(lo, b + k, tone(c, 2, 3), .8); S.put(ti, b + k, tone(c, 0, 2), .5, k ? .6 : .9); } S.put(sn, b + 1, 60, .1, .7); S.put(sn, b + 3, 60, .1, .7); S.put(sn, b + 3.5, 60, .1, .5); }
  });
  for (const b of [0, 12, 28, 34]) S.put(cy, b * 4, 60, 2, b === 34 ? 1 : .7);
  return S.done(36);
}

/* ------------------------------------------------------------------ film scores + the musical's song */
function loop(S, chords, bars, fn) { for (let i = 0; i < bars; i++) fn(CH(chords[i % chords.length]), i * S.meter, i); }
function noir() {
  const S = mk(76, 4), ld = S.tr('ld', 'lead', []), bs = S.tr('bs', 'pizz', []), pd = S.tr('pd', 'str', [], .35), br = S.tr('br', 'snare', [], .25);
  const x = 'a4:3 d5:1 f5:2 e5:1 d5:1 d5:2 bb4:2 a4:3 r:1', y = 'd5:1 f5:1 a5:2 g5:2 f5:1 e5:1 d5:3 c#5:1 d5:4';
  [x, y, x, y].forEach((m, k) => S.line(ld, 2 + k * 4, m, .9)); S.line(ld, 18, 'd5:4', .8);
  loop(S, ['Dm', 'Dm', 'Gm', 'A7'], 19, (c, b, i) => { [0, 1, 2, 1].forEach((k, j) => S.put(bs, b + j, tone(c, k, 2), .9, .8)); S.put(pd, b, tone(c, 1, 4), 3.9); S.put(pd, b, tone(c, 2, 4), 3.9); for (let j = 0; j < 4; j++) S.put(br, b + j + .5, 60, .1, .6); });
  return S.done(19);
}
function romance() {
  const S = mk(104, 3), ld = S.tr('ld', 'wind', []), pn = S.tr('pn', 'piano', [], .8), pd = S.tr('pd', 'str', [], .3), m = 'a5:2 c6:1 f5:3 d5:2 f5:1 e5:3 a5:2 c6:1 d6:2 c6:1 bb5:1 a5:1 g5:1 f5:3';
  for (let k = 0; k < 4; k++) S.line(ld, 2 + k * 8, m, k === 3 ? 1 : .8, k === 2 ? 12 : 0);
  loop(S, 'F Dm Bb C7 F Dm C7 F'.split(' '), 34, (c, b, i) => { S.put(pn, b, tone(c, 0, 2), 1); S.put(pn, b + 1, tone(c, 1, 3), .6, .6); S.put(pn, b + 1, tone(c, 2, 3), .6, .6); S.put(pn, b + 2, tone(c, 1, 3), .6, .6); S.put(pn, b + 2, tone(c, 2, 3), .6, .6); if (i >= 18) S.put(pd, b, tone(c, 1, 4), 2.9); });
  return S.done(35);
}
function comedy() {
  const S = mk(160, 4), ld = S.tr('ld', 'reed', [], 1.4), tb = S.tr('tb', 'bass', []), st = S.tr('st', 'pizz', [], .6), sn = S.tr('sn', 'snare', [], .5);
  const m = 'e5:.5 g5:.5 c6:1 g5:1 e5:1 e5:.5 g5:.5 c6:1 g5:2 d5:.5 f5:.5 b5:1 g5:1 d5:1 e5:1 c5:1 r:2 a5:.5 c6:.5 f6:1 c6:1 a5:1 g5:.5 c6:.5 e6:1 c6:2 b5:1 d6:1 f6:1 d6:1 c6:2 r:2';
  for (let k = 0; k < 5; k++) S.line(ld, k * 8, m, .9, k === 3 ? -12 : 0);
  loop(S, 'C C G7 C F C G7 C'.split(' '), 40, (c, b) => { S.put(tb, b, tone(c, 0, 2), .8); S.put(tb, b + 2, tone(c, 2, 1), .8); for (const k of [1, 3]) { S.put(st, b + k, tone(c, 1, 4), .3); S.put(st, b + k, tone(c, 2, 4), .3); S.put(sn, b + k, 60, .1); } });
  return S.done(40);
}
function scifi() {
  const S = mk(112, 4), ar = S.tr('ar', 'synth', []), pd = S.tr('pd', 'str', [], .4), bs = S.tr('bs', 'bass', []), ld = S.tr('ld', 'lead', []), m = 'e5:4 f5:2 a5:2 g5:4 d5:2 b4:2';
  for (let k = 0; k < 5; k++) S.line(ld, 8 + k * 4, m, .8, k >= 3 ? 12 : 0);
  loop(S, ['Am', 'F', 'C', 'G'], 28, (c, b, i) => { for (let k = 0; k < 8; k++) S.put(ar, b + k * .5, tone(c, [0, 1, 2, 3, 2, 1, 2, 1][k], i >= 12 && i < 20 ? 5 : 4), .3, k % 2 ? .6 : .9); S.put(pd, b, tone(c, 1, 3), 3.9); S.put(pd, b, tone(c, 2, 3), 3.9); S.put(bs, b, tone(c, 0, 1), 3.8); });
  return S.done(28);
}
function song() {
  const S = mk(120, 4), ld = S.tr('ld', 'lead', ['lead'], 1.2), pn = S.tr('pn', 'piano', [], .8), bs = S.tr('bs', 'bass', []), sn = S.tr('sn', 'snare', [], .5), br = S.tr('br', 'brass', [], .5);
  const v = 'e5:1 e5:1 g5:1 e5:1 c5:2 a4:2 a4:1 c5:1 f5:1 a5:1 g5:3 r:1 e5:1 e5:1 g5:1 c6:1 a5:2 e5:2 f5:1 e5:1 d5:1 c5:1 d5:3 r:1', c = 'a5:1.5 a5:.5 c6:1 a5:1 g5:2 b5:2 c6:2 g5:1 e5:1 e5:3 r:1 a5:1.5 a5:.5 c6:1 f6:1 d6:2 b5:2 c6:4 c6:2 r:2';
  S.line(ld, 2, v, .9); S.line(ld, 10, c, 1); S.line(ld, 18, c, 1); S.line(br, 18, c, .8, -12);
  const ch = ['C', 'G', ...'C Am F G C Am F G'.split(' '), ...'F G C Am F G C C'.split(' '), ...'F G C Am F G C C'.split(' '), 'F', 'C'];
  ch.forEach((n, i) => { const k = CH(n), b = i * 4; S.put(bs, b, tone(k, 0, 2), 1.4); S.put(bs, b + 2, tone(k, 2, 2), 1.4); for (let j = 0; j < 4; j++) { S.put(pn, b + j, tone(k, 1, 4), .5, j % 2 ? .8 : .5); S.put(pn, b + j, tone(k, 2, 4), .5, j % 2 ? .8 : .5); } if (i >= 2) { S.put(sn, b + 1, 60, .1); S.put(sn, b + 3, 60, .1); } });
  return S.done(28);
}

const MAKERS = { waltz, adagio, overture, noir, romance, comedy, scifi, song }, cache = {};
/** score by id (built once): waltz | adagio | overture | noir | romance | comedy | scifi | song */
export function score(id) { return cache[id] || (cache[id] = MAKERS[id]()); }
export const SCORE_IDS = Object.keys(MAKERS);

/** the concert programme: three original pieces */
export const PIECES = [
  { id: 'waltz', title: 'Harbour Lights Waltz', by: 'E. Marlowe', blurb: 'A swaying waltz for full orchestra. Harp, strings and a grand tutti finish.', poster: 'waltz', price: 24, minutes: 110, cues: [[.36, 'aww'], [.64, 'cheer']] },
  { id: 'adagio', title: 'Snow on Maple Street', by: 'I. Tanaka', blurb: 'A hushed adagio: one oboe, a bed of strings, and a slow sunrise in D major.', poster: 'adagio', price: 24, minutes: 120, cues: [[.45, 'aww'], [.9, 'aww']] },
  { id: 'overture', title: 'Overture to a Bright Morning', by: 'R. Okafor', blurb: 'Fanfares, racing violins and timpani. Sixty seconds of pure get-up-and-go.', poster: 'overture', price: 26, minutes: 105, cues: [[.33, 'cheer'], [.8, 'cheer']] },
];
