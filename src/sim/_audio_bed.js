// Private: the RECORDED city ambience (owner msgs 111-118, BIBLE "Direction update 24"). No noise, no generated sound: only the real
// recordings in docs/audio/game/ (cut by docs/audio/tools/make_library.py, listed in src/data/ambience_audio.js).
// This file has no game imports on purpose: the game (src/sim/audio.js), the owner's listening page (docs/audio/listen.html) and the
// offline render in tools/ambience_check.mjs all run this same code.
//
// How it avoids sounding like a loop:
//   - a SCENE (place + time of day + weather + indoors) is a few TRACKS; each track owns a POOL of stretches and one gain + low-pass;
//   - a track never sits on one stretch: every 40-90 s it crossfades (equal power, 4-8 s) to ANOTHER stretch of its pool, never the same
//     twice running, the least recently played first; a stretch is entered where it was left last time (plus a small random skip), so a
//     pool is used up end to end before any second of it comes again; the first entry is a random point;
//   - drifting tracks (gulls, birds, crowd, a trolley going by) fade in and out on their own long random timers;
//   - every track's level wanders by +-1.5 dB on a slow random timer, and every entry runs up to 3 % slower or faster.
//   - the end of a stretch is never a hard jump: every stretch is cut as a seamless cycle (see make_library.py), and on top of that the mixer
//     hands over to a fresh voice 0.12 s before the loop point with an 80 ms crossfade of the same material, so the small differences an MP3
//     decoder leaves between the two ends cannot tick.
//   - a scene change (walking into another district, through a door, night falling) keeps the tracks both scenes share (same id + pool:
//     the street you hear through the wall is the street you just left) and retunes their level / low-pass over ~2.5 s; the others
//     crossfade in / out over 2.5 s with equal power, so two full beds are never stacked and nothing is cut.
// Timing uses the AudioContext clock only (no setTimeout), so the same code renders in an OfflineAudioContext.
export const BED_ON = true;          // the single switch: false = no recorded bed at all
export const BED_GAIN = 1;           // overall trim of the bed bus (the stretches are matched at -23 LUFS)
const SCENE_FADE = 2.5, KEEP_SPARE = 1, WRAP = .12, WRAP_X = .08, RATE_JITTER = .03;   // each entry plays 0-3 % slower or faster (tape varispeed): the same stretch never comes back sample for sample
const dB = x => Math.pow(10, x / 20), mod = (x, L) => ((x % L) + L) % L;

/* pools of stretches (names from src/data/ambience_audio.js). rain / storm are EMPTY SLOTS: add docs/audio/game/rain_*.mp3 (and storm_*)
   through make_library.py and they are picked up here with no other change. */
export const POOLS = {
  busy: ['busy_a', 'busy_b', 'busy_c', 'busy_d'], light: ['light_a', 'light_b', 'light_c'], resid: ['resid_a', 'light_a'], far: ['resid_b'],
  birds: ['park_a', 'park_b', 'park_c'], waves: ['harbor_a'], gulls: ['gulls'], crowd: ['market_a'], crickets: ['crickets_a'], air: ['night_air'],
  airport: ['airport_a', 'airport_c'], trolley: ['light_c'], rain: [], storm: [],
};
// track makers. db = level against the -23 LUFS stretch; lp = low-pass in Hz (0 = open); on/off = [min, max] seconds (a drifting layer)
const T = (id, db, lp, pool) => ({ id, pool: pool || id, db, lp: lp || 0 });
const D = (id, db, on, off, lp, pool) => ({ id, pool: pool || id, db, lp: lp || 0, on, off });
/* place -> time of day -> tracks. Places: city (downtown), town (old town, arts), suburb, industrial, park, harbor, waterfront (boardwalk
   and pier), market (Market Square), airport. Night = crickets + the far-off city, low-passed and quiet. */
export const OUTDOOR = {
  city: {
    dawn: [T('busy', -7, 5000), T('birds', -6)],
    day: [T('busy', 0), D('trolley', -6, [18, 32], [70, 160])],
    evening: [T('busy', -3, 7000), D('trolley', -8, [18, 30], [120, 240])],
    night: [T('busy', -13, 1100), T('crickets', -9), T('far', -8)],
  },
  town: {
    dawn: [T('light', -6, 5000), T('birds', -5)],
    day: [T('light', 0), D('crowd', -11, [25, 50], [40, 110], 3500)],
    evening: [T('light', -3), D('crowd', -14, [20, 40], [80, 160], 3000)],
    night: [T('light', -14, 1200), T('crickets', -7), T('far', -8)],
  },
  suburb: {
    dawn: [T('birds', -2), T('resid', -8, 5000)],
    day: [T('resid', -1), D('birds', -8, [30, 70], [25, 70]), T('far', -9)],
    evening: [T('resid', -4), T('air', -12), D('crickets', -12, [40, 80], [20, 50])],
    night: [T('crickets', -5), T('far', -9), T('air', -13)],
  },
  industrial: {
    dawn: [T('busy', -8, 4000), T('far', -5)],
    day: [T('busy', -4, 4500), T('far', -5)],
    evening: [T('busy', -7, 4000), T('far', -5)],
    night: [T('far', -6), T('crickets', -12), T('busy', -16, 900)],
  },
  park: {
    dawn: [T('birds', 1.5), T('busy', -20, 900)],
    day: [T('birds', 0), T('busy', -17, 1000)],
    evening: [T('birds', -5), T('crickets', -12), T('busy', -18, 900)],
    night: [T('crickets', -3), T('far', -12)],
  },
  harbor: {
    dawn: [T('waves', -3), T('gulls', -6), T('light', -14, 2500)],
    day: [T('waves', -2), D('gulls', -6, [14, 34], [20, 55]), T('light', -11, 3000)],
    evening: [T('waves', -3), D('gulls', -10, [12, 25], [60, 140]), T('light', -13, 2500)],
    night: [T('waves', -5), T('far', -11)],
  },
  waterfront: {
    dawn: [T('waves', -1), T('gulls', -5)],
    day: [T('waves', 0), D('gulls', -4, [16, 36], [15, 40])],
    evening: [T('waves', -1), D('gulls', -9, [12, 25], [50, 120])],
    night: [T('waves', -3), T('far', -13)],
  },
  market: {
    dawn: [T('light', -6, 5000), T('birds', -5)],
    day: [T('crowd', -2, 5000), T('light', -7)],
    evening: [T('crowd', -7, 4000), T('light', -4)],
    night: [T('light', -14, 1200), T('crickets', -7), T('far', -8)],
  },
  airport: {
    dawn: [T('airport', -3), T('birds', -10)],
    day: [T('airport', 0)],
    evening: [T('airport', -2)],
    night: [T('airport', -7, 3500), T('crickets', -11)],
  },
};
/* indoors. wall = the street outside, muffled (dB added to every steady outdoor track, low-pass in Hz); crowd = the real market crowd as room murmur.
   Nothing at all: gym, office, library (thick walls; they keep their one-shot sounds). train / vehicle: the far-traffic rumble recording, low. */
export const INDOOR = {
  room: { wall: -15, lp: 420 }, store: { wall: -16, lp: 480 }, cafe: { wall: -18, lp: 420, crowd: -13, clp: 3000 }, restaurant: { crowd: -10, clp: 3200 },
  bar: { crowd: -7, clp: 3500 }, gym: {}, office: {}, library: {}, train: { far: -6, flp: 500 }, vehicle: { far: -10, flp: 400 }, silent: {},
};
export const WEATHER = { rain: .5, storm: .4, snow: .55, fog: .8 };   // the dry bed steps back in bad weather (no rain recording yet: see POOLS.rain)
export const PLACES = Object.keys(OUTDOOR), PHASES = ['dawn', 'day', 'evening', 'night'];

/** what should play: { key, master, tracks }. q = { place, phase, weather, indoor (kind or null) } */
export function sceneFor(q) {
  const place = OUTDOOR[q.place] ? q.place : 'city', phase = PHASES.includes(q.phase) ? q.phase : 'day', wx = WEATHER[q.weather] ? q.weather : null;
  const out = OUTDOOR[place][phase]; let tracks, master = wx ? WEATHER[wx] : 1;
  if (q.indoor) {
    const I = INDOOR[q.indoor] || INDOOR.room; tracks = [];
    if (I.wall !== undefined) for (const t of out) if (!t.on) tracks.push({ id: t.id, pool: t.pool, db: +(t.db + I.wall + 20 * Math.log10(master)).toFixed(1), lp: Math.min(t.lp || 1e5, I.lp) });   // bad weather lowers the street outside, not the room
    if (I.crowd !== undefined) tracks.push(T('crowd', I.crowd, I.clp));
    if (I.far !== undefined) tracks.push(T('far', I.far, I.flp));
    master = 1;
  } else tracks = out.slice();
  const wp = wx === 'storm' && POOLS.storm.length ? 'storm' : (wx === 'rain' || wx === 'storm') && POOLS.rain.length ? 'rain' : null;
  if (wp && (!q.indoor || (INDOOR[q.indoor] || INDOOR.room).wall !== undefined)) tracks.push({ id: 'rain', pool: wp, db: q.indoor ? -14 : 0, lp: q.indoor ? 600 : 0, raw: 1 });
  return { key: (q.indoor ? 'in:' + q.indoor + '@' : '') + place + '_' + phase + (wx ? '+' + wx : ''), master, tracks };
}

const CURVE_N = 33, CIN = new Float32Array(CURVE_N), COUT = new Float32Array(CURVE_N);
for (let i = 0; i < CURVE_N; i++) { const x = i / (CURVE_N - 1) * Math.PI / 2; CIN[i] = Math.sin(x); COUT[i] = Math.cos(x); }
/* an equal-power fade on a gain param. The browser moves a start time that is already past up to "now", so the hold event after the curve keeps a margin; nothing here may throw */
function curve(param, c, t, d, end) { try { param.setValueCurveAtTime(c, t, d); } catch (e) { try { param.setValueAtTime(1 - end, t); param.linearRampToValueAtTime(end, t + d); } catch (e2) { /* leave it */ } return; } try { param.setValueAtTime(end, t + d + .04); } catch (e) { /* the curve holds its last value anyway */ } }

/**
 * new BedMixer(ctx, out, load, stretches, opts?)
 *   load(name) -> Promise<AudioBuffer> (rejects / resolves null when the recording cannot be had: the mixer then plays without it)
 *   stretches: { name: { s, a, b } } from src/data/ambience_audio.js;  opts.rand: () => 0..1 (tests)
 * set(scene | null), tick(now), state(), force(scene | null), audition(name | null), idle() -> Promise (all pending decodes settled)
 */
export class BedMixer {
  constructor(ctx, out, load, stretches, opts = {}) {
    this.ctx = ctx; this.load = load; this.S = stretches || {}; this.rnd = opts.rand || Math.random;
    this.master = ctx.createGain(); this.master.gain.value = 1; this.master.connect(out);
    this.tracks = []; this.dying = []; this.leaving = []; this.leaveBy = 0; this.key = null; this.scene = null; this.wanted = null; this.forced = null;
    this.cache = new Map(); this.cursor = {}; this.played = {}; this.stats = { decodes: 0, failed: [], freed: 0, xfades: 0, started: 0, decodeMs: [], decodeLog: [], log: [] };   // log: every voice { id, name, t0, t1, pos, rate } (the last 300), for the checks
  }
  r(a, b) { return a + this.rnd() * (b - a); }
  pool(p) { return (typeof p === 'string' ? POOLS[p] || [p] : p).filter(n => this.S[n] && !this.stats.failed.includes(n)); }
  /* ---- buffers: decoded on first need, kept while a track uses or is about to use them, then dropped ---- */
  need(name) {
    let c = this.cache.get(name); if (c) { c.t = this.ctx.currentTime; return c; }
    c = { name, buf: null, t: this.ctx.currentTime, done: false }; this.cache.set(name, c); const t0 = typeof performance !== 'undefined' ? performance.now() : 0;
    c.p = Promise.resolve().then(() => this.load(name)).then(b => { c.buf = b || null; if (!b) throw new Error('no audio'); this.stats.decodes++; if (t0) { this.stats.decodeMs.push(Math.round(performance.now() - t0)); this.stats.decodeLog.push({ name, t0: Math.round(t0), t1: Math.round(performance.now()) }); if (this.stats.decodeLog.length > 300) this.stats.decodeLog.shift(); } })
      .catch(() => { if (!this.stats.failed.includes(name)) this.stats.failed.push(name); c.buf = null; }).then(() => { c.done = true; });
    return c;
  }
  idle() { const p = [...this.cache.values()].filter(c => !c.done).map(c => c.p); return p.length ? Promise.all(p).then(() => this.idle()) : Promise.resolve(); }
  sweep() {
    const used = new Set(); for (const tr of this.tracks.concat(this.dying, this.leaving)) { for (const v of tr.voices) used.add(v.name); if (tr.next) used.add(tr.next); if (tr.want) used.add(tr.want); }
    const spare = [...this.cache.values()].filter(c => c.done && !used.has(c.name)).sort((a, b) => b.t - a.t);
    for (const c of spare.slice(KEEP_SPARE)) { this.cache.delete(c.name); this.stats.freed++; }
    for (const c of spare) if (!c.buf) this.cache.delete(c.name);
  }
  /* ---- scenes ---- */
  set(scene) { this.wanted = scene || null; if (!this.forced) this.apply(this.wanted); }
  force(scene) { this.forced = scene || null; this.apply(this.forced || this.wanted); }
  audition(name) { this.force(name && this.S[name] ? { key: 'audition:' + name, master: 1, tracks: [{ id: 'audition:' + name, pool: [name], db: 0, lp: 0, raw: 1 }] } : null); }
  apply(scene) {
    const key = scene ? scene.key : null; if (key === this.key) return; this.key = key; this.scene = scene; const now = this.ctx.currentTime, first = !this.tracks.length && !this.dying.length; this.flush(now);
    const want = scene ? scene.tracks.filter(t => this.pool(t.pool).length) : [], keep = [];
    for (const tr of this.tracks) {
      const w = want.find(t => t.id === tr.id && this.pool(t.pool).join() === tr.names.join());
      if (w) { want.splice(want.indexOf(w), 1); this.retune(tr, w, now); keep.push(tr); } else this.leaving.push(tr);
    }
    /* the tracks that go wait (at most 2 s) until the first new recording is decoded, so old out and new in start together: no dip while a decode runs */
    if (this.leaving.length && want.some(w => !w.on)) { this.leaveBy = now + 2; for (const tr of this.leaving) tr.want = tr.next = null; } else this.flush(now);
    for (const w of want) keep.push(this.make(w, now, first ? 1.5 : SCENE_FADE));
    this.tracks = keep; this.master.gain.setTargetAtTime(scene ? scene.master : 1, now, .6);
  }
  make(spec, now, fade) {
    const c = this.ctx, g = c.createGain(), lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = .5; lp.frequency.value = spec.lp || 20000; g.gain.value = dB(spec.db); lp.connect(g); g.connect(this.master);
    const tr = { id: spec.id, spec, names: this.pool(spec.pool), g, lp, voices: [], cur: null, next: null, want: null, on: !spec.on, at: 0, switchAt: 0, driftAt: now + this.r(8, 20), drift: 0, fade, dead: false, last: null };
    if (spec.on) tr.at = now + this.r(spec.off[0] * .15, spec.off[1] * .6); else this.begin(tr, now, fade);
    return tr;
  }
  retune(tr, spec, now) {
    const was = tr.spec; tr.spec = spec; tr.g.gain.setTargetAtTime(dB(spec.db + tr.drift), now, SCENE_FADE / 3); tr.lp.frequency.setTargetAtTime(spec.lp || 20000, now, SCENE_FADE / 3);
    if (spec.on && !was.on) tr.at = now + this.r(spec.on[0], spec.on[1]);             // a steady track becomes a drifting one: let it play on a while, then start its timer
    if (!spec.on && was.on && !tr.on) { tr.on = true; this.begin(tr, now, SCENE_FADE); }   // a drifting track becomes steady: bring it in now
  }
  flush(now) { for (const tr of this.leaving) this.drop(tr, now, SCENE_FADE); this.leaving = []; }
  drop(tr, now, fade) { tr.dead = true; tr.want = tr.next = null; for (const v of tr.voices) this.out(v, now, fade); this.dying.push(tr); }
  /* ---- voices ---- */
  choose(tr) {
    const n = tr.names; if (n.length < 2) return n[0];
    const c = n.filter(x => x !== tr.last).sort((a, b) => (this.played[a] || -1e9) - (this.played[b] || -1e9)); return c[this.rnd() < .7 || c.length < 2 ? 0 : 1];
  }
  begin(tr, now, fade) { const name = this.choose(tr); if (!name) return; tr.want = name; tr.wantFade = fade; this.need(name); }
  voice(tr, name, buf, when, fade) {
    const c = this.ctx, m = this.S[name], L = Math.max(1, Math.min(m.b, buf.duration - .02) - m.a); let pos = this.cursor[name];
    if (pos === undefined) pos = this.rnd() * L; else if (tr.cur && tr.cur.name === name) pos = mod(tr.cur.pos0 + (when - tr.cur.t0) * tr.cur.rate + L * this.r(.35, .65), L); else pos = (pos + this.r(0, 6)) % L;
    const src = c.createBufferSource(), gi = c.createGain(), go = c.createGain(); const rate = 1 + this.r(-RATE_JITTER, RATE_JITTER); src.buffer = buf; src.playbackRate.value = rate; src.loop = true; src.loopStart = m.a; src.loopEnd = m.a + L;
    when = Math.max(when, c.currentTime) + .005; gi.gain.setValueAtTime(0, 0); src.connect(gi); gi.connect(go); go.connect(tr.lp); curve(gi.gain, CIN, when, fade, 1); src.start(when, m.a + pos);
    const dwell = Math.max(12, Math.min(this.r(40, 90), L / rate - 9));   // 40-90 s, but never past its own entry point (the stretches are 29-60 s long)
    const v = { name, src, gi, go, buf, t0: when, pos0: pos, L, rate, fade, end: 0 }; tr.voices.push(v); this.stats.log.push(v.rec = { id: tr.id, name, t0: +when.toFixed(2), t1: null, pos: +pos.toFixed(2), rate: +rate.toFixed(4), L: +L.toFixed(2) }); if (this.stats.log.length > 300) this.stats.log.shift(); tr.cur = v; tr.last = name; tr.switchAt = when + dwell; tr.next = null; this.played[name] = when; this.stats.started++;
    return v;
  }
  out(v, now, fade) {
    if (v.end) return; const t = Math.max(now, this.ctx.currentTime, v.t0) + .005; curve(v.go.gain, COUT, t, fade, 0); v.end = t + fade + .05; if (v.rec) v.rec.t1 = +(t + fade).toFixed(2); try { v.src.stop(v.end); } catch (e) { /* already stopped */ }
    this.cursor[v.name] = mod(v.pos0 + (t + fade * .5 - v.t0) * v.rate, v.L);
  }
  /* a voice about to reach its loop point hands over to a new voice of the same stretch, started in the pre-roll (the same material) */
  wrap(tr, now) {
    for (const v of tr.voices) {
      if (v.end || v.t0 > now) continue; const tw = v.t0 + (v.L - WRAP - v.pos0) / v.rate; if (tw - now > 1.1 || tw - now < .03) continue;
      const c = this.ctx, m = this.S[v.name], src = c.createBufferSource(), gi = c.createGain(), go = c.createGain(); src.buffer = v.buf; src.playbackRate.value = v.rate; src.loop = true; src.loopStart = m.a; src.loopEnd = m.a + v.L;
      try { gi.gain.setValueAtTime(0, 0); gi.gain.setValueAtTime(0, tw); gi.gain.linearRampToValueAtTime(1, tw + WRAP_X); v.go.gain.setValueAtTime(1, tw); v.go.gain.linearRampToValueAtTime(0, tw + WRAP_X); src.connect(gi); gi.connect(go); go.connect(tr.lp); src.start(tw, Math.max(0, m.a - WRAP)); v.src.stop(tw + WRAP_X + .02); } catch (e) { continue; }
      v.end = tw + WRAP_X + .02; if (v.rec) v.rec.t1 = +tw.toFixed(2);
      const nv = { name: v.name, src, gi, go, buf: v.buf, t0: tw, pos0: -WRAP, L: v.L, rate: v.rate, fade: 0, end: 0 }; tr.voices.push(nv); if (tr.cur === v) tr.cur = nv; this.stats.wraps = (this.stats.wraps || 0) + 1;
      this.stats.log.push(nv.rec = { id: tr.id, name: v.name, t0: +tw.toFixed(2), t1: null, pos: -WRAP, rate: +v.rate.toFixed(4), L: +v.L.toFixed(2) }); return;
    }
  }
  tick(now) {
    if (this.leaving.length && now >= this.leaveBy) this.flush(now);
    for (const tr of this.tracks) {
      const sp = tr.spec;
      // a decode that came back: start (or crossfade to) the stretch this track asked for
      if (tr.want) { const c = this.need(tr.want); if (c.done) { const name = tr.want; tr.want = null; if (c.buf) { const old = tr.cur, x = tr.wantFade; if (old && !old.end) { this.out(old, now, x); this.stats.xfades++; } this.voice(tr, name, c.buf, now, x); if (this.leaving.length) this.flush(now); } else { tr.names = tr.names.filter(n => n !== name); if (tr.names.length && tr.on) this.begin(tr, now, tr.wantFade); } } }
      // drifting layers come and go
      if (sp.on && now >= tr.at) {
        if (tr.on) { tr.on = false; tr.want = tr.next = null; if (tr.cur) this.out(tr.cur, now, this.r(6, 10)); tr.cur = null; tr.at = now + this.r(sp.off[0], sp.off[1]); }
        else { tr.on = true; tr.at = now + this.r(sp.on[0], sp.on[1]); this.begin(tr, now, this.r(5, 8)); }
      }
      // on to another stretch of the pool: decode it a little ahead, then crossfade
      if (tr.on && tr.cur && !tr.want) {
        if (!tr.next && now >= tr.switchAt - 12) { tr.next = this.choose(tr); this.need(tr.next); }
        if (tr.next && now >= tr.switchAt) { tr.want = tr.next; tr.wantFade = this.r(4, 8); }
      }
      if (now >= tr.driftAt) { tr.driftAt = now + this.r(14, 30); tr.drift = sp.raw ? 0 : this.r(-1.5, 1.5); tr.g.gain.setTargetAtTime(dB(sp.db + tr.drift), now, 5); }
      this.wrap(tr, now); this.reap(tr, now);
    }
    for (const tr of this.dying) this.reap(tr, now);
    const gone = this.dying.filter(tr => !tr.voices.length); for (const tr of gone) { try { tr.g.disconnect(); tr.lp.disconnect(); } catch (e) { /* gone */ } }
    if (gone.length) this.dying = this.dying.filter(tr => tr.voices.length);
    this.sweep();
  }
  reap(tr, now) { for (const v of tr.voices) if (v.end && now > v.end + .1) { try { v.src.disconnect(); v.gi.disconnect(); v.go.disconnect(); } catch (e) { /* gone */ } v.gone = true; } if (tr.voices.some(v => v.gone)) tr.voices = tr.voices.filter(v => !v.gone); }
  /** stop everything now (mute, bed switched off): short fade, buffers dropped */
  silence() { this.wanted = null; this.forced = null; this.apply(null); }
  state() {
    const now = this.ctx.currentTime, tr = t => ({ id: t.id, pool: t.names, on: t.on, db: +(t.spec.db + t.drift).toFixed(1), lp: t.spec.lp || 0, drifting: !!t.spec.on, dying: !!t.dead,
      voices: t.voices.map(v => ({ name: v.name, g: +(v.gi.gain.value * v.go.gain.value).toFixed(3), at: +mod(v.pos0 + (now - v.t0) * v.rate, v.L).toFixed(1), rate: +v.rate.toFixed(3), of: +v.L.toFixed(1), fadingOut: !!v.end, endsIn: v.end ? +(v.end - now).toFixed(1) : null })),
      gain: +t.g.gain.value.toFixed(4), next: t.dead ? null : t.spec.on ? { [t.on ? 'fadesOutIn' : 'fadesInIn']: +(t.at - now).toFixed(1) } : { stretch: t.next || t.want || '(not chosen yet)', in: +(t.switchAt - now).toFixed(1) } });
    return { scene: this.key, forced: !!this.forced, master: this.scene ? this.scene.master : 0, tracks: this.tracks.map(tr), fadingOut: this.dying.concat(this.leaving).map(tr),
      sources: this.tracks.concat(this.dying, this.leaving).reduce((n, t) => n + t.voices.length, 0), buffers: [...this.cache.values()].filter(c => c.buf).map(c => c.name), decoding: [...this.cache.values()].filter(c => !c.done).map(c => c.name),
      decodes: this.stats.decodes, decodeMs: this.stats.decodeMs.slice(-8), freed: this.stats.freed, crossfades: this.stats.xfades, wraps: this.stats.wraps || 0, failed: this.stats.failed.slice() };
  }
}
