// Audio: wires the synthesised libraries (_audio_lib / _audio_sfx / _audio_amb / _audio_music) and the RECORDED city ambience (_audio_bed) into the game as G.audio.
// Effects and music are generated with Web Audio. The city ambience is real recordings only (owner msgs 111-118): docs/audio/game/*.mp3, shipped inside the
// single HTML file as base64 blocks (tools/audio_pack.mjs), read and decoded one stretch at a time when first needed, never at start. docs/reports/ambience.md.
//
// - Nothing is created until the first user gesture (pointer / key / touch): browsers do not allow sound before that.
// - Fails silently: no Web Audio, a context that cannot start, an unknown sound name -> calls simply do nothing (G.audio always exists).
// - Volumes: state slice G.state.audio = { master, music, sfx, city } (0..1), the same object the phone's Settings sliders write.
//   The recorded city bed plays at Effects x City sound (so it follows the Effects slider like the old bed did, and has its own); Master 0 / Mute silences it.
// - Ambience follows the scene (indoors / district / day-night) and the weather; music draws a tune from the pool of the moment (a songbook of
//   hand-written pieces: _music_songs_*.js), plays it once start to finish, then leaves a quiet gap. Shows (sim/_shows_audio.js) have their own music: ours steps back while one plays.
//
// API (G.audio):
//   sfx(name, opts?)        play a sound from _audio_sfx.js SFX (plus the aliases below). opts: number volume | { v, pitch, pan }
//   setVolume(key, v)       key 'master' | 'music' | 'sfx' | 'city'; stored in G.state.audio and applied at once
//   getVolume(key)
//   music(id | null)        play one tune of the songbook now (id, pool name or an old track name; null = stop; the controller resumes on its own)
//   nowPlaying() / skip()   the tune that is sounding { id, title, feel, pool, where, t, dur } | null; end it and start the next
//   mood(name | null, min)  a special pool for a while ('date', 'family', 'festival')
//   debug.music()           what is playing, the context and its pool, the bag, the tune held for next;  debug.jukebox() dev chooser for any tune
//   stinger(name)           one-shot phrase from STINGERS
//   unlock()                try to start audio now (only works inside a user gesture)
//   info()                  { available, unlocked, state, sampleRate, sfxPlayed, sfxUnknown, profile, weather, layers, bed, track, errors } for tests
//   debug.ambience()        what the recorded bed is playing now: scene, tracks (stretch, position, level, low-pass, next change), buffers held, decode times
//   debug.menu()            dev menu: force any place / time / weather / room, audition any single stretch, or follow the game again
//   debug.force(place, phase, weather?, indoor?) / debug.audition(name) / debug.release() / debug.stretches() / debug.places()
// Events listened: 'thunder' (weather.js), 'scene', 'load', 'frame'. Events emitted: 'audio:unlock'.
import { G } from '../core/game.js';
import { A, makeBuffers, gain, filt, panner } from './_audio_lib.js';
import { SFX, SFX_LEN } from './_audio_sfx.js';
import { Ambience, PROFILES } from './_audio_amb.js';
import { ACTIVITY_BY_ID } from '../data/activities.js';
import { stinger as playStinger } from './_audio_music.js';
import { SONGS, SONG } from './_music_songs.js';
import { Player, compile, renderSong, STYLES } from './_music_engine.js';
import { INST } from './_music_synth.js';
import { pool as musicPool, draw as bagDraw, played as bagPlayed, putBack as bagPutBack, timeOf, whereOf, POOL_INFO, TIMES, DISTRICTS, SEASONS } from './_music_pools.js';
import { LEVELS } from './_music_levels.js';
import { BedMixer, sceneFor, BED_ON, BED_GAIN, PLACES, PHASES, INDOOR as BED_ROOMS } from './_audio_bed.js';
import { STRETCHES } from '../data/ambience_audio.js';
import { choose } from '../ui/kit.js';
import { AU } from './_shows_audio.js';

export const order = 60;
const ALIAS = { confirm: 'click', tap: 'click', buy: 'pay', success: 'skill', place: 'clack', pickup: 'coin', cancel: 'close', back: 'close', bell: 'shop_bell', door: 'door_open' };
const vol = { master: .8, music: .6, sfx: .8, city: .7 }, KEYS = Object.keys(vol);
const clamp = v => Math.max(0, Math.min(1, +v || 0));
let S = null, dead = false, unlocked = false, buses = null, amb = null, bed = null, bedQ = null, bedForce = null;
const watch = { show: false, tv: false }; let watchT = 0;
const safe = (f, d) => { try { return f(); } catch (e) { return d; } };
let sfxPlayed = 0, errors = 0, lastErr = '', musicGap = 4, ambT = 0, track = null;
const unknown = new Set(), lastAt = new Map();
const fail = e => { errors++; lastErr = String(e && e.message || e); };

function levels() { const s = S || vol, o = {}; for (const k of KEYS) o[k] = clamp(s[k] === undefined ? vol[k] : s[k]); return o; }
function applyVolumes(fast) {
  if (!buses) return; const L = levels(), t = A.ctx.currentTime, k = fast ? .02 : .08;
  try { buses.master.gain.setTargetAtTime(L.master, t, k); buses.music.gain.setTargetAtTime(L.music * .9, t, k); buses.sfx.gain.setTargetAtTime(L.sfx, t, k); buses.amb.gain.setTargetAtTime(L.sfx * .55, t, k); buses.bed.gain.setTargetAtTime(BED_ON ? L.sfx * L.city * BED_GAIN : 0, t, k); } catch (e) { fail(e); }
}
/** create the context and the mixer; only succeeds inside a user gesture. Safe to call again. */
function unlock() {
  if (dead) return false;
  try {
    if (!A.ctx) {
      const C = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext); if (!C) { dead = true; return false; }
      const c = A.ctx = new C(); makeBuffers(c);
      const comp = c.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 4; comp.connect(c.destination);
      const master = gain(comp, 0), music = gain(master, 0), sfx = gain(master, 0), ambBus = gain(master, 0), bedBus = gain(master, 0);
      // a soft echo for the lead voices of the music
      const delay = c.createDelay(1); delay.delayTime.value = .33; const fb = gain(delay, .28); delay.connect(fb); const wet = filt(music, 'lowpass', 1800); delay.connect(wet); const send = gain(delay, 1);
      buses = { master, music, sfx, amb: ambBus, bed: bedBus, send };
      bed = new BedMixer(c, bedBus, loadStretch, STRETCHES);
      amb = new Ambience(ambBus, (name, v, pan) => { if (name !== 'thunder') play(name, { v, pan }, true); }); /* thunder comes from weather.js, in step with the flash */
      applyVolumes(true);
    }
    if (A.ctx.state === 'suspended') { const p = A.ctx.resume(); if (p && p.catch) p.catch(() => { }); }
    if (!unlocked) { unlocked = true; G.emit('audio:unlock'); }
    return true;
  } catch (e) { fail(e); dead = true; A.ctx = null; buses = null; amb = null; bed = null; return false; }
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

/* ---------- the recorded bed: one stretch's bytes -> AudioBuffer, only when asked ---------- */
const unpackMs = []; let meterNode = null, meterBuf = null;
/** the MP3 of one stretch: from its base64 block in the built page (decoded in its own task, never inside a frame), or from the repo when run from source */
function stretchBytes(name) {
  const node = typeof document !== 'undefined' && document.getElementById('amb-' + name);
  if (!node) return fetch('docs/audio/game/' + name + '.mp3').then(r => r.ok ? r.arrayBuffer() : Promise.reject(new Error('no recording: ' + name)));
  return new Promise((res, rej) => setTimeout(() => { try { const t0 = performance.now(), b = atob(node.textContent), n = b.length, u = new Uint8Array(n); for (let i = 0; i < n; i++) u[i] = b.charCodeAt(i); unpackMs.push(+(performance.now() - t0).toFixed(1)); if (unpackMs.length > 40) unpackMs.shift(); res(u.buffer); } catch (e) { rej(e); } }, 0));
}
function loadStretch(name) {
  return stretchBytes(name).then(ab => new Promise((res, rej) => { const to = setTimeout(() => rej(new Error('decode timed out: ' + name)), 20000), ok = b => { clearTimeout(to); res(b); }, no = e => { clearTimeout(to); rej(e || new Error('decode failed: ' + name)); };
    try { const p = A.ctx.decodeAudioData(ab, ok, no); if (p && p.catch) p.catch(() => { }); } catch (e) { no(e); } }));   /* callback form: old Safari has no promise here */
}
const BED_PLACE = { downtown: 'city', oldtown: 'town', arts: 'town', maplewood: 'suburb', hillcrest: 'suburb', railyard: 'industrial', park: 'park', harbor: 'harbor', airport: 'airport' };
let lastPlace = 'town', fine = null, doorAt = { id: null, place: null };
/** place type at a city tile: the district, refined to 'market' around Market Square and 'waterfront' on the boardwalk and the pier */
function placeAt(w, x, y, was) {
  if (!fine || fine.w !== w) fine = { w, market: (w.pois || []).filter(p => (p.type === 'stall' && /market/.test(p.venue || '')) || (p.type === 'landmark' && /Market Square/.test(p.name || ''))), shore: (w.walkways || []).filter(k => k.kind === 'boardwalk' || k.kind === 'pier') };
  const rm = was === 'market' ? 13 : 10, ms = was === 'waterfront' ? 3 : 1.5;   /* a little stickiness so the edge does not flutter */
  for (const m of fine.market) if ((m.x - x) * (m.x - x) + (m.y - y) * (m.y - y) < rm * rm) return 'market';
  for (const k of fine.shore) if (x >= k.x0 - ms && x <= k.x1 + ms && y >= k.y0 - ms && y <= k.y1 + ms) return 'waterfront';
  return BED_PLACE[w.districtAt ? w.districtAt(x, y) : null] || 'city';
}
function dayPhase() { if (G.env && G.env.night) return 'night'; const h = G.now().hf; return h >= 4 && h < 8.5 ? 'dawn' : h >= 17.5 ? 'evening' : 'day'; }
/** { place, phase, weather, indoor } for the bed. Indoors the place is the street outside the door the player came in by. */
function bedQuery(prof) {
  const sc = G.scene; if (!sc) return null; const q = { place: lastPlace, phase: dayPhase(), weather: weatherKind(), indoor: null };
  try {
    if (sc.indoor || prof === 'train' || prof === 'vehicle') {
      q.indoor = BED_ROOMS[prof] ? prof : 'room';
      if (sc.indoor) { const id = G.state.flags && G.state.flags.lastDoor, key = id && typeof id === 'object' ? id.id : id; if (key && doorAt.id !== key) { const c = G.sceneCache && G.sceneCache.get('city'), w = c && c.world, p = w && w.pois.find(o => o.id === key); doorAt = { id: key, place: p ? placeAt(w, p.x, p.y) : null }; } if (key && doorAt.place) q.place = doorAt.place; }
    } else { const w = G.world, t = G.camTarget || G.player; if (w && w.districtAt && t) q.place = lastPlace = placeAt(w, t.x, t.y, lastPlace); }
  } catch (e) { fail(e); }
  return q;
}
function bedTick(prof, now) {
  if (!bed) return; const L = levels(); bedQ = bedQuery(prof);
  if (!BED_ON || L.master <= 0 || L.sfx <= 0 || L.city <= 0 || !bedQ) bed.set(null);   /* muted: nothing is decoded or played */
  else { const sc = sceneFor(bedQ); if (G.onTitle) { sc.master *= .5; sc.key += '~title'; } bed.set(sc); }   /* under the title music the bed sits 6 dB lower */
  bed.tick(now);
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
/* ---------- the background music: a songbook played from pools (owner msg 137). docs/reports/music.md ----------
   Each context (title, outdoors by time of day x district flavour x season, weather, the kind of room, a ride, a work shift, a mood) has a POOL of tunes
   (_music_pools.js). A shuffle bag saved in G.state.audio.mus picks: never the same tune twice in a row, no tune of a pool again before the others of that pool.
   A tune plays once, start to finish, then there is a quiet gap (20-50 s). When the kind of place changes (outdoors / a venue / a ride ...), the tune finishes
   its bar and fades (Player.wind); walking between districts or a change of weather does not cut a tune: the next pick follows the new place. */
const VENUE = [[/plane|cabin/, 'plane'], [/cafe|coffee|bakery|tea|cocoa|galley|ammonite/, 'cafe'], [/diner|pizza|ramen|taqueria|pho|burger|noodle|food|grill|fishmarket/, 'diner'], [/(^|[:_])(bar|pub|club|karaoke)($|[:_])|heron|lounge/, 'bar'],
  [/hotel|restaurant|bistro|skydeck|concerthall|playhouse|cinema|foyer/, 'hotel'], [/gym|dojo|natatorium|arena/, 'gym'], [/library|bookstore|university|school|classroom|records/, 'library'],
  [/museum|observatory|aquarium|conservatory|lighthouse|gallery/, 'museum'], [/store|shop|grocery|market|galleria|goods|deptstore|clothing|mall/, 'shop'], [/office|bank|cityhall|clinic|post|newsroom|studio|fire_station|depot|warehouse|courier/, 'office'], [/station/, 'train']];
const FLAVOUR = { downtown: 'downtown', oldtown: 'oldtown', arts: 'arts', maplewood: 'suburb', hillcrest: 'suburb', railyard: 'harbor', park: 'park', harbor: 'harbor', airport: 'airport' };
const OLD_TRACK = { title: 'title', morning: 'out:morning:downtown:0', day: 'out:midday:downtown:0', evening: 'out:evening:downtown:0', night: 'out:late:downtown:0', rainy: 'rain', interior: 'room', train: 'train' };
let player = null, cur = null, forced = null, held = null, mwant = null, mood = null, rideKind = null, wound = false, startMs = 0;
const mus = () => { const s = S || vol; return s.mus && typeof s.mus === 'object' ? s.mus : (s.mus = { bags: {}, recent: [], last: null }); };
/** { g: the kind of place (a change of it ends the tune), key: the pool } for this moment */
function musicCtx() {
  if (G.onTitle) return { g: 'title', key: 'title' };
  const sc = G.scene, id = String(sc && sc.id || ''), ti = G.now(), time = timeOf(ti.hf), wk = weatherKind();
  if (mood && G.state.t < mood.until) return { g: 'mood:' + mood.name, key: mood.name }; mood = null;
  if (rideKind === 'taxi') return { g: 'ride:cab', key: 'cab' }; if (rideKind === 'bus') return { g: 'ride:bus', key: 'bus' };
  if (/^(train|airtram)/.test(id) || rideKind === 'train' || rideKind === 'airtram') return { g: 'ride:train', key: 'train' };
  if (safe(() => G.rel.active(), false)) return { g: 'mood:date', key: 'date' };
  if (safe(() => G.jobs.onShift(), false)) return { g: 'work', key: 'work' };
  if (sc && sc.indoor) {
    const rid = id.replace(/^int:/, '');
    if (/^home:grandma/.test(rid)) return { g: 'in:family', key: 'family' };
    if (/^(home|rel_flat)(:|_|$)/.test(rid)) return { g: 'in:home', key: wk === 'rain' || wk === 'storm' ? 'home_rain' : ti.hf >= 5 && ti.hf < 10 ? 'home_am' : ti.hf >= 22 || ti.hf < 5 ? 'home_late' : 'home' };
    if (/^airport/.test(rid) && !/plane/.test(rid)) return { g: 'in:airport', key: 'out:' + time + ':airport:' + ti.season };
    for (const [re, k] of VENUE) if (re.test(rid)) return { g: 'in:' + k, key: k };
    return { g: 'keep', key: 'room' };   /* lobbies, stairwells: whatever is playing carries on */
  }
  const w = G.world, t = G.camTarget || G.player, d = w && w.districtAt && t ? w.districtAt(t.x, t.y) : null, fl = lastPlace === 'market' ? 'market' : lastPlace === 'waterfront' ? 'harbor' : FLAVOUR[d] || 'downtown';
  const ev = safe(() => G.cityEvents.live(), null); if (ev && ev.district && ev.district === d) return { g: 'out', key: 'festival' };
  if (wk === 'rain' || wk === 'storm' || wk === 'snow' || wk === 'fog') return { g: 'out', key: wk };
  if ((time === 'midday' || time === 'afternoon') && safe(() => G.weather.current().tempC, 0) >= 29) return { g: 'out', key: 'heat' };
  return { g: 'out', key: 'out:' + time + ':' + fl + ':' + ti.season };
}
/* giveBack: a tune that was cut off in its first 20 s (you walked through a door, a show began) has not had its turn: it goes back into its bag. A tune you Skip does not. */
function endTune(fade, musical, giveBack) { if (!player) return; try { if (giveBack && cur && !wound && A.ctx.currentTime - player.started < 20 && cur.key !== 'forced') bagPutBack(mus(), cur.key, cur.id); wound = true; if (musical) player.wind(fade); else player.stop(fade); } catch (e) { fail(e); } }
function stopMusic(fade, giveBack) { if (player) { endTune(fade, false, giveBack); player = null; cur = null; track = null; wound = false; } }
function unhold() { if (held) { bagPutBack(mus(), held.key, held.id); held = null; } }
function startTune(want) {
  const st = mus(), t0 = typeof performance !== 'undefined' ? performance.now() : 0; let id, key = want.key;
  if (forced) { id = forced; key = 'forced'; } else if (held && held.key === key) { id = held.id; held = null; } else { unhold(); id = bagDraw(st, key); }
  const song = SONG[id]; if (!song) { musicGap = 10; forced = null; return; }
  player = new Player(A.ctx, song, buses.music, buses.send, { db: LEVELS[id] || 0 }); player.schedule(A.ctx.currentTime + .3);
  cur = { g: forced ? 'forced' : want.g === 'keep' ? 'room' : want.g, key, id, pool: key }; track = id; wound = false; if (!forced) { bagPlayed(st, id); held = { key, id: bagDraw(st, key) }; }
  startMs = typeof performance !== 'undefined' ? +(performance.now() - t0).toFixed(1) : 0;
}
function musicTick(dt, c) {
  const want = mwant || (mwant = musicCtx());
  if (player) {
    player.schedule(c.currentTime + .45);
    if (!wound && !forced && want.g !== 'keep' && want.g !== cur.g) endTune(1.6, true, true);   /* another kind of place: finish the bar, fade */
    if (player.done && c.currentTime > player.next + .2) { const natural = !wound; player = null; cur = null; track = null; wound = false; forced = null; musicGap = natural ? (want.g === 'title' ? 5 : 20 + Math.random() * 30) : 2.5 + Math.random() * 2.5; }
  } else { musicGap -= dt; if (musicGap <= 0) startTune(want); else if (musicGap < 1.5 && !forced) { if (!held || held.key !== want.key) { unhold(); held = { key: want.key, id: bagDraw(mus(), want.key) }; } if (SONG[held.id]) compile(SONG[held.id]); } }
}
function nowPlaying() { if (!player || !cur) return null; const s = player.song, p = player.pos(); return { id: s.id, title: s.title, feel: s.feel, pool: cur.key, where: POOL_INFO[cur.key] || (cur.key === 'forced' ? 'Chosen by hand' : 'Outdoors'), t: +p.t.toFixed(1), dur: +p.dur.toFixed(1), section: p.section, bar: p.bar, ending: wound }; }
function musicDebug() { const st = mus(), w = unlocked ? (mwant || musicCtx()) : null, ids = w ? musicPool(w.key) : []; return { unlocked, playing: nowPlaying(), context: w, pool: ids, bag: w ? (st.bags[w.key] || []).filter(x => ids.includes(x)) : [], next: held ? held.id : null, last: st.last, recent: (st.recent || []).slice(), played: st.n || 0, gap: +musicGap.toFixed(1), forced, mood, startMs, tunes: SONGS.length }; }
async function jukebox() {
  const np = nowPlaying(), o = [{ label: 'Follow the game again', sub: np ? 'Now: ' + np.title + ' (' + np.where + ')' : 'Nothing is playing', value: 'auto' }, { label: 'Skip to the next tune', value: '>' }], seen = new Set();
  const add = (head, ids) => { for (const id of ids) { if (seen.has(id)) continue; seen.add(id); const s = SONG[id], c = compile(s); o.push({ label: head + ': ' + s.title, sub: s.feel + ', ' + Math.round(c.dur) + ' s. ' + whereOf(id), value: id }); } };
  for (const k in POOL_INFO) add(POOL_INFO[k], SONGS.filter(s => (' ' + (s.pl || '') + ' ').includes(' ' + k + ' ')).map(s => s.id)); add('Outdoors', SONGS.filter(s => s.out).map(s => s.id)); add('Other', SONGS.map(s => s.id));
  const v = await choose('Jukebox (' + SONGS.length + ' tunes)', o, { cls: 'dev-list' }); if (!v) return null;
  if (v === 'auto') G.audio.music(null); else if (v === '>') G.audio.skip(); else G.audio.music(v); return v;
}
function tick(dt) {
  if (!unlocked || dead || !buses) return; const c = A.ctx; if (!c || c.state !== 'running') return;
  try {
    ambT -= dt; if (ambT <= 0) { ambT = .5; const sc = G.scene, prof = profile(); amb.set(prof, weatherKind(), !!(sc && sc.indoor)); amb.tick(c.currentTime); bedTick(prof, c.currentTime); mwant = musicCtx(); }
    // music
    /* owner msg 135: while you WATCH something (a show or film in a venue, Reel on the phone or the TV, any TV activity) the game's own music stays out,
       for the whole of it and a little after: not only while the show's score happens to be sounding */
    const reel = safe(() => { const m = G.media && G.media.session && G.media.session(); return !!(m && m.app === 'reel'); }, false);
    if ((AU.live && AU.live.length > 0) || watch.show || watch.tv || reel) watchT = c.currentTime + 12;
    const showOn = c.currentTime < watchT, L = levels();
    if (showOn || L.music <= 0 || L.master <= 0) { if (player) { stopMusic(1.5, true); musicGap = 8; } return; }
    musicTick(dt, c);
  } catch (e) { fail(e); stopMusic(0); musicGap = 30; }
}

export function init() {
  S = G.defineState('audio', () => Object.assign({}, vol));
  const adopt = () => { // older saves kept the sliders under phone.settings.audio
    S = G.state.audio && typeof G.state.audio === 'object' ? G.state.audio : (G.state.audio = Object.assign({}, vol));
    try { const old = G.state.phone && G.state.phone.settings && G.state.phone.settings.audio; if (old && typeof old === 'object') { for (const k of KEYS) if (typeof old[k] === 'number') S[k] = clamp(old[k]); delete G.state.phone.settings.audio; } } catch (e) { /* no phone slice yet */ }
    for (const k of KEYS) { if (typeof S[k] !== 'number') S[k] = vol[k]; vol[k] = S[k]; }   /* saves from before the City sound slider get its default */
    applyVolumes(true);
  };
  adopt(); G.on('load', adopt); G.on('ready', adopt);
  G.audio = {
    sfx: (name, o) => play(name, o),
    setVolume(k, v) { if (!(k in vol)) return; v = clamp(v); vol[k] = v; if (S) S[k] = v; applyVolumes(true); },
    getVolume: k => levels()[k],
    /** play one tune now by its id (or a pool name, or one of the eight old track names: a tune of that pool); null = stop and let the controller carry on */
    music(id) { if (id === null) { forced = null; stopMusic(1.5); musicGap = 3; return; } let k = SONG[id] ? id : null; if (!k) { const p = OLD_TRACK[id] || (POOL_INFO[id] ? id : null); if (p) k = bagDraw(mus(), p); } if (!k) return; unhold(); forced = k; stopMusic(.8); musicGap = .9; },
    /** { id, title, feel, pool, where, t, dur, section, bar } of the tune that is sounding, or null in a gap */
    nowPlaying,
    /** end this tune (short fade) and start the next one of the pool */
    skip() { forced = null; if (player) stopMusic(.8); musicGap = 1; },
    /** a special pool for a while ('date', 'family', 'festival' ...): mood('date', 90) = for the next 90 game minutes; mood(null) ends it */
    mood(name, minutes = 120) { mood = name && POOL_INFO[name] ? { name, until: G.state.t + minutes } : null; mwant = null; },
    stinger(name) { if (!unlocked || dead || !buses || A.ctx.state !== 'running') return 0; try { return playStinger(name, buses.music, A.ctx.currentTime + .02); } catch (e) { fail(e); return 0; } },
    unlock,
    info: () => ({ available: !dead && typeof window !== 'undefined' && !!(window.AudioContext || window.webkitAudioContext), unlocked, state: A.ctx ? A.ctx.state : 'none', sampleRate: A.ctx ? A.ctx.sampleRate : 0, sfxPlayed, sfxUnknown: [...unknown], profile: amb ? amb.profile : null, weather: amb ? amb.weather : null, layers: amb ? Object.keys(amb.layers) : [], bed: bed ? bed.key : null, track, music: cur ? { id: cur.id, pool: cur.key } : null, errors, lastError: lastErr, volumes: levels() }),
    debug: {
      /** the music: what is playing, the context and its pool, what is left in the bag, the tune held for next */
      music: musicDebug,
      /** dev menu: audition any tune of the songbook */
      jukebox,
      /** for tools/music_check.mjs: the songbook and the real player / renderer */
      musicKit: () => ({ SONGS, SONG, STYLES, INST, LEVELS, POOL_INFO, TIMES, DISTRICTS, SEASONS, compile, renderSong, Player, pool: musicPool, draw: bagDraw, played: bagPlayed, whereOf, timeOf, ctx: musicCtx, state: mus, watch }),
      ambience: () => Object.assign({ unlocked, running: !!A.ctx && A.ctx.state === 'running', want: bedQ, legacyProfile: amb ? amb.profile : null, noiseLayers: amb ? Object.keys(amb.layers) : [], events: amb ? amb.events.map(e => e[0]) : [], volumes: levels(), busGain: buses ? +buses.bed.gain.value.toFixed(3) : 0, unpackMs: unpackMs.slice(-8) }, bed ? bed.state() : { scene: null, tracks: [], sources: 0 }),
      stretches: () => Object.keys(STRETCHES).map(n => Object.assign({ name: n }, STRETCHES[n])),
      places: () => ({ places: PLACES.slice(), phases: PHASES.slice(), rooms: Object.keys(BED_ROOMS), weather: ['rain', 'storm', 'snow', 'fog'] }),
      force(place, phase, weather, indoor) { bedForce = { place, phase: phase || 'day', weather: weather || null, indoor: indoor || null }; if (bed) bed.force(sceneFor(bedForce)); return bedForce; },
      audition(name) { bedForce = null; if (bed) bed.audition(name); return !!(bed && STRETCHES[name]); },
      release() { bedForce = null; if (bed) bed.force(null); },
      /** level of the bed bus right now (after the volume sliders): { rms, peak } in dBFS over the last ~40 ms; -200 = digital silence */
      meter() { if (!buses) return null; if (!meterNode) { meterNode = A.ctx.createAnalyser(); meterNode.fftSize = 2048; buses.bed.connect(meterNode); meterBuf = new Float32Array(2048); } meterNode.getFloatTimeDomainData(meterBuf); let e = 0, pk = 0; for (let i = 0; i < 2048; i++) { const x = meterBuf[i]; e += x * x; if (x > pk) pk = x; else if (-x > pk) pk = -x; } return { rms: e > 0 ? +(10 * Math.log10(e / 2048)).toFixed(1) : -200, peak: pk > 0 ? +(20 * Math.log10(pk)).toFixed(1) : -200 }; },
      /** for tools/ambience_check.mjs: the mixer class and the loader, to render the same mix offline */
      kit: () => ({ BedMixer, sceneFor, STRETCHES, bytes: stretchBytes, mixer: bed }),
      async menu() {
        const st = bed ? bed.state() : null, o = [{ label: 'Follow the game again', sub: st ? 'Now: ' + (st.scene || 'nothing') + (st.forced ? ' (forced)' : '') + ' | ' + st.tracks.map(t => t.id + ':' + t.voices.map(v => v.name).join('+')).join(', ') : 'Sound has not started: tap the game once', value: 'auto' }];
        for (const p of PLACES) for (const ph of PHASES) o.push({ label: 'Place: ' + p + ', ' + ph, value: 'p|' + p + '|' + ph });
        for (const w of ['rain', 'storm', 'snow', 'fog']) o.push({ label: 'Weather: city, day, ' + w, sub: w === 'rain' ? 'Rain recordings over the lowered street' : w === 'storm' ? 'Wind-driven rain, far thunder now and then' : 'The dry bed steps back', value: 'p|city|day|' + w });
        for (const r of Object.keys(BED_ROOMS)) o.push({ label: 'Indoors: ' + r + ' (town, day outside)', value: 'p|town|day||' + r });
        for (const n of Object.keys(STRETCHES)) o.push({ label: 'One recording: ' + n, sub: STRETCHES[n].desc + ' (' + Math.round(STRETCHES[n].s) + ' s)', value: 'a|' + n });
        const v = await choose('City ambience', o, { cls: 'dev-list' }); if (!v) return null; const a = String(v).split('|');
        if (a[0] === 'auto') G.audio.debug.release(); else if (a[0] === 'a') G.audio.debug.audition(a[1]); else G.audio.debug.force(a[1], a[2], a[3], a[4]);
        return v;
      },
    },
  };
  if (typeof window === 'undefined') return;
  const first = () => { if (unlock() && A.ctx && A.ctx.state === 'running') for (const ev of ['pointerdown', 'keydown', 'touchend']) window.removeEventListener(ev, first, true); };
  for (const ev of ['pointerdown', 'keydown', 'touchend']) window.addEventListener(ev, first, true);
  document.addEventListener('visibilitychange', () => { try { if (!A.ctx) return; if (document.hidden) A.ctx.suspend(); else if (unlocked) A.ctx.resume(); } catch (e) { fail(e); } });
  G.on('show:doors', () => { watch.show = true; }); G.on('show:start', () => { watch.show = true; }); G.on('show:end', () => { watch.show = false; });
  G.on('activity:start', id => { const d = ACTIVITY_BY_ID[id]; watch.tv = !!(d && d.tag === 'tv'); }); G.on('activity:done', () => { watch.tv = false; });
  G.on('scene', () => { watch.show = false; watch.tv = false; mwant = null; });
  G.on('ride:start', k => { rideKind = k; mwant = null; }); G.on('ride:end', () => { rideKind = null; mwant = null; }); G.on('load', () => { rideKind = null; mood = null; held = null; mwant = null; }); G.on('rel:date', () => { if (mood && mood.name === 'date') mood = null; });
  G.on('frame', tick);
  G.on('thunder', loud => play('thunder', { v: .35 + .65 * clamp(loud) }));
  G.on('scene', (s, prev) => { if (!prev || !s) return; if (s.indoor && !prev.indoor) play('door_open', { v: .7 }); else if (!s.indoor && prev.indoor) play('door_close', { v: .7 }); });
}
