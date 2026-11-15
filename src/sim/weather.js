// Weather: deterministic hourly forecast (from data/calendar.js odds), smooth transitions, visual FX, gameplay helpers.
//
// State slice G.state.weatherSim = { seed, days: [{day, k:[24 kinds], c:[24 tempC]} x4 (today + 3)], kind, int, override }
//   kind/int = the weather currently on screen and its intensity 0..1 (ramps ~20 game minutes when it changes).
//   G.state.weather (read by core/clock.js ambient light) is kept in step: during a ramp it steps through a milder kind.
//
// Events emitted:
//   'weather' (kind, intensity)   every game hour, whenever the on-screen kind changes, and when a ramp completes
//   'thunder' (loudness 0..1)     shortly after each lightning flash in storms (also while indoors, quieter) - sound cue
//
// Exports: KINDS, current(), forecast(dayOffset), daySummary(dayOffset), setWeather(kind, hours, smooth),
//          isWet(), isSnowing(), comfort(), outdoorFunMult(), crowdFactor(hour?), weatherCrowdMult(), walkSpeedMult(), taxiWaitMult(), lightning()
// URL: ?weather=rain|storm|snow|fog|cloudy|clear forces that weather for the session. Debug: window.G.weather = this module's API.
import { G } from '../core/game.js';
import { WEATHER_TYPES, DAY_PARTS, RUSH_HOURS } from '../data/calendar.js';
import { KINDS, genDay, toF, seasonOfDay } from './_weather_gen.js';
import { createFX } from './_weather_fx.js';
import { ENV } from '../engine/raster.js';

export { KINDS };
export const order = 40;
const DAYM = 1440, UP = 1 / 20, DOWN = 1 / 10; // intensity per game minute
const STEP = { storm: 'rain', rain: 'cloudy', snow: 'cloudy', fog: 'cloudy', cloudy: 'clear', clear: 'clear' };
const DIM = { clear: 0, snow: .1, cloudy: .12, fog: .15, rain: .22, storm: .35 };
const NAMES = { clear: 'Clear', cloudy: 'Cloudy', rain: 'Rain', storm: 'Storm', snow: 'Snow', fog: 'Fog' };
const TYPE = k => (WEATHER_TYPES && WEATHER_TYPES[k]) || {};

let S = null, urlKind = null, lastT = null, lastAmb = null, fx = null;
let wetness = 0; // 0..1 how wet the ground is: fills while it rains, dries slowly afterwards (visual only: puddles and sheen; not saved)
const fresh = () => ({ seed: 7, days: [], kind: 'clear', int: 1, override: null });

function today() { return Math.floor(G.state.t / DAYM); }
// the visual season can differ from the calendar one (debug ?season=N): then generate with the visual season
const effSeason = d => (ENV.season !== seasonOfDay(today()) ? ENV.season : undefined);
function ensureDays() {
  const d = today(), es = effSeason(); if (S.days.length === 4 && S.days[0].day === d && S.days[0].s === (es != null ? es : seasonOfDay(d))) return;
  const keep = new Map(S.days.map(x => [x.day, x])); S.days = [];
  for (let i = 0; i < 4; i++) { const o = keep.get(d + i); S.days.push(o && o.s === (es != null ? es : seasonOfDay(d + i)) ? o : genDay(S.seed, d + i, es)); }
}
function dayData(off) { ensureDays(); return off >= 0 && off < 4 ? S.days[off] : genDay(S.seed, today() + off, effSeason()); }
function overrideAt(t) {
  if (urlKind) return urlKind; const o = S.override; if (!o) return null;
  if (o.until != null && t >= o.until) { S.override = null; return null; } return o.kind;
}
/** the kind the simulation wants at game time t (absolute minutes) */
function targetAt(t) { const o = overrideAt(t); if (o) return o; const d = Math.floor(t / DAYM), h = Math.floor((t - d * DAYM) / 60), dd = d - today(); return dayData(dd).k[h]; }

function ambientKind() {
  if (S.int >= .5) return S.kind; const tgt = targetAt(G.state.t);
  if (tgt !== S.kind && DIM[tgt] > DIM[STEP[S.kind]]) return STEP[tgt]; // fading toward something gloomier
  return STEP[S.kind];
}
function publish(force) {
  const a = ambientKind(); G.state.weather = a;
  if (force || a !== lastAmb) { lastAmb = a; G.emit('weather', S.kind, S.int); }
}
function snap() { S.kind = targetAt(G.state.t); S.int = 1; if (S.kind === 'rain' || S.kind === 'storm') wetness = 1; publish(true); }

function step(gm) {
  const t = G.state.t;
  if (lastT === null || Math.abs(t - lastT) > 90 || gm > 45) { lastT = t; ensureDays(); return snap(); }
  lastT = t; ensureDays(); const tgt = targetAt(t), was = S.int, k0 = S.kind;
  if (S.kind === 'rain' || S.kind === 'storm') wetness = Math.min(1, wetness + gm * S.int / 12); else wetness = Math.max(0, wetness - gm / (S.kind === 'clear' ? 60 : 110));
  if (tgt !== S.kind) { S.int -= gm * DOWN; if (S.int <= 0) { S.kind = tgt; S.int = 0; } }
  else S.int = Math.min(1, S.int + gm * UP);
  if (S.kind !== k0) publish(true); else if (was < 1 && S.int >= 1) publish(true); else publish(false);
}

/* ---------------- public API ---------------- */
/** -> { kind, intensity, name, ambient, target, tempC, tempF, wet, indoor } */
export function current() {
  if (!S) return { kind: 'clear', intensity: 1, name: 'Clear', ambient: 'clear', target: 'clear', tempC: 18, tempF: 64, wet: false, indoor: false };
  const t = G.state.t, d = dayData(0), mf = (t - today() * DAYM) / 60, h = Math.floor(mf), f = mf - h, c1 = h < 23 ? d.c[h + 1] : dayData(1).c[0];
  const tempC = Math.round(d.c[h] + (c1 - d.c[h]) * f);
  return { kind: S.kind, intensity: S.int, name: NAMES[S.kind], ambient: G.state.weather, target: targetAt(t), tempC, tempF: toF(tempC), wet: isWet(), wetness, indoor: !!(G.scene && G.scene.indoor) };
}
/** hourly forecast for today + dayOffset -> [{hour, kind, tempC, tempF}] x 24 (debug overrides included) */
export function forecast(dayOffset = 0) {
  if (!S) return [];
  const d = dayData(dayOffset), base = (today() + dayOffset) * DAYM, out = [];
  for (let h = 0; h < 24; h++) { const o = overrideAt(base + h * 60 + 30), kind = o || d.k[h], c = d.c[h]; out.push({ hour: h, kind, tempC: c, tempF: toF(c) }); }
  return out;
}
/** one-line day summary for widgets -> { day, season, kind (worst weather of daytime 7-21h), name, hiC, loC, hiF, loF } */
export function daySummary(dayOffset = 0) {
  const f = forecast(dayOffset); if (!f.length) return null; const cnt = {}; let hi = -99, lo = 99;
  for (const e of f) { if (e.hour >= 7 && e.hour <= 21) cnt[e.kind] = (cnt[e.kind] || 0) + (e.kind === 'storm' ? 6 : e.kind === 'rain' || e.kind === 'snow' ? 2.5 : e.kind === 'fog' ? 1.2 : 1); hi = Math.max(hi, e.tempC); lo = Math.min(lo, e.tempC); }
  let kind = 'clear', best = -1; for (const k in cnt) if (cnt[k] > best) { best = cnt[k]; kind = k; }
  const day = today() + dayOffset; return { day, season: seasonOfDay(day), kind, name: NAMES[kind], hiC: hi, loC: lo, hiF: toF(hi), loF: toF(lo) };
}
/** debug: force weather for `hours` game hours (0/omitted = until cleared). kind null clears. smooth=false snaps immediately. */
export function setWeather(kind, hours = 0, smooth = false) {
  if (!S) return; urlKind = null;
  if (!kind) S.override = null; else { if (!KINDS.includes(kind)) throw new Error('weather kind? ' + kind); S.override = { kind, until: hours > 0 ? G.state.t + hours * 60 : null }; }
  if (!smooth) snap(); return current();
}
const outdoors = () => !!(G.scene && !G.scene.indoor);
const precip = () => S && (S.kind === 'rain' || S.kind === 'storm') ? S.int : 0;
/** raining (or storming) and the player is outdoors */
export function isWet() { return outdoors() && precip() > .3 && (S.int > .6 || /rain|storm/.test(targetAt(G.state.t))); }   // fading out toward a dry sky (setWeather('clear', 0, true), a passing shower): dry once the rain has thinned
export function isSnowing() { return !!S && S.kind === 'snow' && S.int > .3; }
/** blend a per-kind number by intensity toward the neutral 'cloudy' value */
const blend = (key, dflt) => { if (!S) return dflt; const a = TYPE(S.kind)[key], b = TYPE('cloudy')[key]; const va = a === undefined ? dflt : a, vb = b === undefined ? dflt : b; return vb + (va - vb) * S.int; };
/** calendar's outdoorFunMult for the current weather (1 = neutral) */
export function outdoorFunMult() { return blend('outdoorFunMult', 1); }
/**
 * Mood/fun modifier, roughly -1..+1 (0 neutral). Outdoors: from WEATHER_TYPES.outdoorFunMult (+ winter chill);
 * indoors: a small cosy bonus while it rains/storms/snows outside.
 */
export function comfort() {
  if (!S) return 0; const k = S.kind, i = S.int;
  if (!outdoors()) return (k === 'rain' || k === 'storm' || k === 'snow') ? .15 * i : 0;
  let c = (outdoorFunMult() - 1) * 2; const season = ENV.season;
  if (season === 3 && k !== 'snow') c -= .2; if (season === 1 && k === 'clear') c += .1;
  return Math.max(-1, Math.min(1, c));
}
/** weather-only crowd multiplier (calendar WEATHER_TYPES.npcDensity; clear > 1) */
export function weatherCrowdMult() { return blend('npcDensity', 1); }
export function walkSpeedMult() { return outdoors() ? blend('walkSpeedMult', 1) : 1; }
export function taxiWaitMult() { return blend('taxiWaitMult', 1); }
/** 0..1 ambient pedestrian density factor: day part x rush hour x weather (rain/snow/night = fewer people) */
export function crowdFactor(hour) {
  const ti = G.now(), h = hour === undefined ? ti.hf : hour; let m = 1;
  if (DAY_PARTS) { const p = DAY_PARTS.find(q => h >= q.from && h < q.to); if (p) m = p.npcDensity; }
  if (RUSH_HOURS && ti.weekday < 5) for (const r of RUSH_HOURS) if (h >= r.from && h < r.to) m *= r.npcDensity;
  return Math.max(0, Math.min(1, m * weatherCrowdMult() / 1.15));
}
/** debug: send a flock of birds across the screen now (fair weather, daytime) */
export function birds() { if (fx) fx.birds(); }
/** debug: trigger a lightning flash (+ thunder) now */
export function lightning() { if (fx) fx.lightning(); }

/* ---------------- init ---------------- */
export function init(g) {
  S = G.defineState('weatherSim', fresh);
  const q = G.query && G.query.get('weather'); if (q && KINDS.includes(q)) urlKind = q;
  G.on('load', () => { S = G.state.weatherSim || (G.state.weatherSim = fresh()); lastT = null; });
  G.on('hour', () => { if (!S) return; ensureDays(); publish(true); });
  G.on('day', () => { ensureDays(); });
  G.on('season', () => { if (S) { ensureDays(); lastT = null; } });
  G.addSystem({ name: 'weather', update(dt, gm) { step(gm); } });
  fx = createFX(G);
  const info = { kind: 'clear', int: 1, dark: 0, hf: 12, season: 0, indoor: false, wetness: 0 };
  let uT = 0;
  G.underlays.push((ctx, cam) => { if (!S || !G.scene || wetness <= .03) return; const dt = Math.min(.1, Math.max(0, G.time - uT)); uT = G.time; info.kind = S.kind; info.int = S.int; info.indoor = !!G.scene.indoor; info.wetness = ENV.season === 3 ? wetness * .5 : wetness; fx.under(ctx, cam, dt, info); });
  G.overlays.push((ctx, cam, dt) => {
    if (!S || !G.scene) return; if (lastT === null) step(0);
    const t = G.state.t, m = t - Math.floor(t / DAYM) * DAYM;
    info.kind = S.kind; info.int = S.int; info.dark = G.env ? G.env.dark || 0 : 0; info.hf = m / 60; info.season = ENV.season; info.indoor = !!G.scene.indoor;
    fx.draw(ctx, cam, dt, info);
  });
  G.weather = { current, forecast, daySummary, setWeather, isWet, isSnowing, comfort, crowdFactor, weatherCrowdMult, outdoorFunMult, walkSpeedMult, taxiWaitMult, lightning, birds, KINDS };
}
