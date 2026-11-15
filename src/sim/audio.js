// Audio: wires the synthesised libraries (_audio_lib / _audio_sfx / _audio_amb / _audio_music) into the game as G.audio.
// Everything is generated with Web Audio; there are no sound files.
//
// - Nothing is created until the first user gesture (pointer / key / touch): browsers do not allow sound before that.
// - Fails silently: no Web Audio, a context that cannot start, an unknown sound name -> calls simply do nothing (G.audio always exists).
// - Volumes: state slice G.state.audio = { master, music, sfx } (0..1), the same object the phone's Settings sliders write.
//   Ambience follows the Effects slider at a lower level.
// - Ambience follows the scene (indoors / district / day-night) and the weather; music picks a tune for the moment, plays it
//   two or three times, then leaves a quiet gap. Shows (sim/_shows_audio.js) have their own music: ours steps back while one plays.
//
// API (G.audio):
//   sfx(name, opts?)        play a sound from _audio_sfx.js SFX (plus the aliases below). opts: number volume | { v, pitch, pan }
//   setVolume(key, v)       key 'master' | 'music' | 'sfx'; stored in G.state.audio and applied at once
//   getVolume(key)
//   music(id | null)        force a tune from _audio_music.js TRACKS now (null = stop; the controller resumes on its own later)
//   stinger(name)           one-shot phrase from STINGERS
//   unlock()                try to start audio now (only works inside a user gesture)
//   info()                  { available, unlocked, state, sampleRate, sfxPlayed, sfxUnknown, profile, weather, layers, track, errors } for tests
// Events listened: 'thunder' (weather.js), 'scene', 'load', 'frame'. Events emitted: 'audio:unlock'.
import { G } from '../core/game.js';
import { A, makeBuffers, gain, filt, panner } from './_audio_lib.js';
import { SFX, SFX_LEN } from './_audio_sfx.js';
import { Ambience, PROFILES } from './_audio_amb.js';
import { TRACKS, Session, stinger as playStinger } from './_audio_music.js';
import { AU } from './_shows_audio.js';

export const order = 60;
const ALIAS = { confirm: 'click', tap: 'click', buy: 'pay', success: 'skill', place: 'clack', pickup: 'coin', cancel: 'close', back: 'close', bell: 'shop_bell', door: 'door_open' };
const vol = { master: .8, music: .6, sfx: .8 };
const clamp = v => Math.max(0, Math.min(1, +v || 0));
let S = null, dead = false, unlocked = false, buses = null, amb = null, session = null, forced = null;
let sfxPlayed = 0, errors = 0, lastErr = '', musicGap = 6, ambT = 0, track = null, trackKey = null;
const unknown = new Set(), lastAt = new Map();
const fail = e => { errors++; lastErr = String(e && e.message || e); };

function levels() { const s = S || vol; return { master: clamp(s.master === undefined ? vol.master : s.master), music: clamp(s.music === undefined ? vol.music : s.music), sfx: clamp(s.sfx === undefined ? vol.sfx : s.sfx) }; }
function applyVolumes(fast) {
  if (!buses) return; const L = levels(), t = A.ctx.currentTime, k = fast ? .02 : .08;
  try { buses.master.gain.setTargetAtTime(L.master, t, k); buses.music.gain.setTargetAtTime(L.music * .9, t, k); buses.sfx.gain.setTargetAtTime(L.sfx, t, k); buses.amb.gain.setTargetAtTime(L.sfx * .55, t, k); } catch (e) { fail(e); }
}
/** create the context and the mixer; only succeeds inside a user gesture. Safe to call again. */
function unlock() {
  if (dead) return false;
  try {
    if (!A.ctx) {
      const C = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext); if (!C) { dead = true; return false; }
      const c = A.ctx = new C(); makeBuffers(c);
      const comp = c.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 4; comp.connect(c.destination);
      const master = gain(comp, 0), music = gain(master, 0), sfx = gain(master, 0), ambBus = gain(master, 0);
      // a soft echo for the lead voices of the music
      const delay = c.createDelay(1); delay.delayTime.value = .33; const fb = gain(delay, .28); delay.connect(fb); const wet = filt(music, 'lowpass', 1800); delay.connect(wet); const send = gain(delay, 1);
      buses = { master, music, sfx, amb: ambBus, send };
      amb = new Ambience(ambBus, (name, v, pan) => { if (name !== 'thunder') play(name, { v, pan }, true); }); /* thunder comes from weather.js, in step with the flash */
      applyVolumes(true);
    }
    if (A.ctx.state === 'suspended') { const p = A.ctx.resume(); if (p && p.catch) p.catch(() => { }); }
    if (!unlocked) { unlocked = true; G.emit('audio:unlock'); }
    return true;
  } catch (e) { fail(e); dead = true; A.ctx = null; buses = null; amb = null; return false; }
}
function play(name, o, quiet) {
  if (!unlocked || dead || !buses) return false;
  try {
    const c = A.ctx; if (c.state !== 'running') return false;
    const key = SFX[name] ? name : ALIAS[name], fn = SFX[key]; if (!fn) { unknown.add(name); return false; }
    const now = c.currentTime, last = lastAt.get(key) || -1; if (now - last < .04) return false; lastAt.set(key, now); /* the same sound twice in one frame would only get louder */
    if (typeof o === 'number') o = { v: o }; o = o || {};
    const v = o.v === undefined ? 1 : Math.max(0, Math.min(1.5, o.v)); if (v <= 0) return false;
    const g = gain(o.pan ? panner(buses.sfx, o.pan) : buses.sfx, v);
    fn(g, now + .005, o.pitch || 1, o); if (!quiet) sfxPlayed++;
    setTimeout(() => { try { g.disconnect(); } catch (e) { /* gone */ } }, ((SFX_LEN[key] || 1.6) + .5) * 1000);
    return true;
  } catch (e) { fail(e); return false; }
}

/* ---------- what should be playing ---------- */
const INDOOR = [[/cafe|coffee|bakery|tea/, 'cafe'], [/restaurant|diner|ramen|pizza|taqueria|pho|bistro|food|noodle/, 'restaurant'], [/gym|dojo|natatorium|arena/, 'gym'], [/office|lobby|bank|cityhall|clinic|post/, 'office'], [/library|museum|bookstore|observatory|aquarium/, 'library'], [/bar|pub|club|karaoke/, 'bar'], [/store|shop|grocery|market|galleria|goods|deptstore/, 'store']];
const DISTRICT = { downtown: 'city', oldtown: 'city', arts: 'city', maplewood: 'suburb', hillcrest: 'suburb', railyard: 'industrial', park: 'park', harbor: 'harbor', airport: 'airport' };
function profile() {
  const sc = G.scene; if (!sc) return 'silent'; const id = String(sc.id || '');
  if (/train|tram/.test(id)) return 'train'; if (G.cutscene && G.cutscene.vehicle) return 'vehicle';
  if (sc.indoor) { for (const [re, p] of INDOOR) if (re.test(id)) return p; return 'room'; }
  const w = G.world, t = G.camTarget || G.player, d = w && w.districtAt && t ? w.districtAt(t.x, t.y) : null, base = DISTRICT[d] || 'city', night = !!(G.env && G.env.night);
  const p = base + (night ? '_night' : base === 'city' ? '_day' : ''); return PROFILES[p] ? p : night ? 'city_night' : 'city_day';
}
function weatherKind() { try { const c = G.weather && G.weather.current(); return c && c.intensity > .4 && c.kind !== 'clear' && c.kind !== 'cloudy' ? c.kind : null; } catch (e) { return null; } }
function wantTrack() {
  if (G.onTitle) return 'title'; const sc = G.scene, id = String(sc && sc.id || '');
  if (/train|tram/.test(id)) return 'train'; if (sc && sc.indoor) return 'interior';
  const wk = weatherKind(); if (wk === 'rain' || wk === 'storm') return 'rainy';
  const h = G.now().hf; return h >= 5 && h < 11 ? 'morning' : h < 17 ? 'day' : h < 21 ? 'evening' : 'night';
}
const group = k => k === 'title' || k === 'interior' || k === 'train' ? k : 'out';
function stopMusic(fade) { if (session) { try { session.stop(fade); } catch (e) { fail(e); } session = null; track = null; } }
function tick(dt) {
  if (!unlocked || dead || !buses) return; const c = A.ctx; if (!c || c.state !== 'running') return;
  try {
    ambT -= dt; if (ambT <= 0) { ambT = .5; const sc = G.scene; amb.set(profile(), weatherKind(), !!(sc && sc.indoor)); amb.tick(c.currentTime); }
    // music
    const showOn = AU.live && AU.live.length > 0, L = levels();
    if (showOn || L.music <= 0 || L.master <= 0) { if (session) { stopMusic(1.5); musicGap = 8; } return; }
    const want = forced || wantTrack();
    if (session) {
      session.schedule(c.currentTime + .45);
      if (group(want) !== group(trackKey) && !forced) { stopMusic(2.5); musicGap = 3 + Math.random() * 3; }
      else if (session.done && c.currentTime > session.next + 2.5) { stopMusic(4); forced = null; musicGap = group(want) === 'title' ? 6 : 45 + Math.random() * 60; }
    } else { musicGap -= dt; if (musicGap <= 0 && TRACKS[want]) { session = new Session(want, buses.music, buses.send, { fade: 3 }); track = want; trackKey = want; } }
  } catch (e) { fail(e); stopMusic(0); musicGap = 30; }
}

export function init() {
  S = G.defineState('audio', () => Object.assign({}, vol));
  const adopt = () => { // older saves kept the sliders under phone.settings.audio
    S = G.state.audio && typeof G.state.audio === 'object' ? G.state.audio : (G.state.audio = Object.assign({}, vol));
    try { const old = G.state.phone && G.state.phone.settings && G.state.phone.settings.audio; if (old && typeof old === 'object') { for (const k of ['master', 'music', 'sfx']) if (typeof old[k] === 'number') S[k] = clamp(old[k]); delete G.state.phone.settings.audio; } } catch (e) { /* no phone slice yet */ }
    for (const k of ['master', 'music', 'sfx']) { if (typeof S[k] !== 'number') S[k] = vol[k]; vol[k] = S[k]; }
    applyVolumes(true);
  };
  adopt(); G.on('load', adopt); G.on('ready', adopt);
  G.audio = {
    sfx: (name, o) => play(name, o),
    setVolume(k, v) { if (!(k in vol)) return; v = clamp(v); vol[k] = v; if (S) S[k] = v; applyVolumes(true); },
    getVolume: k => levels()[k],
    music(id) { if (id === null) { forced = null; stopMusic(2); musicGap = 20; } else if (TRACKS[id]) { forced = id; stopMusic(1); musicGap = .3; } },
    stinger(name) { if (!unlocked || dead || !buses || A.ctx.state !== 'running') return 0; try { return playStinger(name, buses.music, A.ctx.currentTime + .02); } catch (e) { fail(e); return 0; } },
    unlock,
    info: () => ({ available: !dead && typeof window !== 'undefined' && !!(window.AudioContext || window.webkitAudioContext), unlocked, state: A.ctx ? A.ctx.state : 'none', sampleRate: A.ctx ? A.ctx.sampleRate : 0, sfxPlayed, sfxUnknown: [...unknown], profile: amb ? amb.profile : null, weather: amb ? amb.weather : null, layers: amb ? Object.keys(amb.layers) : [], track, errors, lastError: lastErr, volumes: levels() }),
  };
  if (typeof window === 'undefined') return;
  const first = () => { if (unlock() && A.ctx && A.ctx.state === 'running') for (const ev of ['pointerdown', 'keydown', 'touchend']) window.removeEventListener(ev, first, true); };
  for (const ev of ['pointerdown', 'keydown', 'touchend']) window.addEventListener(ev, first, true);
  document.addEventListener('visibilitychange', () => { try { if (!A.ctx) return; if (document.hidden) A.ctx.suspend(); else if (unlocked) A.ctx.resume(); } catch (e) { fail(e); } });
  G.on('frame', tick);
  G.on('thunder', loud => play('thunder', { v: .35 + .65 * clamp(loud) }));
  G.on('scene', (s, prev) => { if (!prev || !s) return; if (s.indoor && !prev.indoor) play('door_open', { v: .7 }); else if (!s.indoor && prev.indoor) play('door_close', { v: .7 }); });
}
