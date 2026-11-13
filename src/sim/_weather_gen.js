// Weather generation (pure, deterministic): day index + seed -> 24 hourly kinds + temperatures.
// Data from data/calendar.js (WEATHER_BY_SEASON, WEATHER_RULES, SEASONS.tempC, EVENTS.guaranteedWeather).
import { rng } from '../engine/raster.js';
import { WEATHER_BY_SEASON, WEATHER_RULES, SEASONS, EVENTS, eventOnDay } from '../data/calendar.js';

export const KINDS = ['clear', 'cloudy', 'rain', 'storm', 'snow', 'fog'];
const SEASON_IDS = ['spring', 'summer', 'autumn', 'winter'];
const RULES = Object.assign({ rollAtHour: 5, persistence: .35, fogBurnsOffAt: 10, stormMaxHours: 4, day0: 'clear' }, WEATHER_RULES || {});
const ODDS_DEFAULT = {
  spring: { clear: .4, cloudy: .25, rain: .22, storm: .03, snow: 0, fog: .1 },
  summer: { clear: .6, cloudy: .18, rain: .1, storm: .08, snow: 0, fog: .04 },
  autumn: { clear: .28, cloudy: .27, rain: .22, storm: .05, snow: .02, fog: .16 },
  winter: { clear: .27, cloudy: .25, rain: .06, storm: .02, snow: .32, fog: .08 },
};
const ODDS = WEATHER_BY_SEASON || ODDS_DEFAULT;
const TEMP = SEASON_IDS.map((id, i) => (SEASONS && SEASONS[i] && SEASONS[i].tempC) || [[9, 18], [17, 29], [7, 17], [-4, 5]][i]);
// extra chance of a foggy morning on an otherwise dry day (autumn harbour fog)
const FOG_MORNING = [.12, .04, .35, .2];

export const seasonOfDay = d => Math.floor(d / 14) % 4;
const dayRng = (seed, d, salt) => rng(((seed | 0) * 7919 + d * 104729 + salt * 31337) & 0x7fffffff);

function roll(season, d, r) {
  const o = ODDS[SEASON_IDS[season]] || ODDS_DEFAULT[SEASON_IDS[season]]; let x = r(), k = 'clear';
  for (const id of KINDS) { const p = o[id] || 0; if (x < p) { k = id; break; } x -= p; }
  // snow only in winter (and the last two days of autumn); otherwise it falls as rain
  if (k === 'snow' && season !== 3 && !(season === 2 && d % 14 >= 12)) k = 'rain';
  if (k !== 'snow' && season === 3 && k === 'rain' && r() < .4) k = 'snow';
  return k;
}
/** the day's main weather (rolled at 05:00); repeats yesterday with WEATHER_RULES.persistence */
export function mainKind(seed, d, depth = 0) {
  if (d <= 0) return RULES.day0 || 'clear';
  const r = dayRng(seed, d, 1), s = seasonOfDay(d);
  if (depth < 8 && r() < RULES.persistence && seasonOfDay(d - 1) === s) { const y = mainKind(seed, d - 1, depth + 1); if (y !== 'storm') return y; }
  return roll(s, d, r);
}
const tail = k => k === 'storm' ? 'rain' : k === 'fog' ? 'cloudy' : k;

/** -> { day, k: [24 kinds], c: [24 tempC] } */
export function genDay(seed, d) {
  const s = seasonOfDay(d), r = dayRng(seed, d, 2), main = mainKind(seed, d), k = new Array(24).fill(main), roll5 = RULES.rollAtHour | 0;
  const prev = d > 0 ? tail(mainKind(seed, d - 1)) : main;
  const bg = r() < .55 ? 'cloudy' : 'clear';
  const fill = (a, b, kind) => { for (let h = Math.max(0, a); h < Math.min(24, b); h++) k[h] = kind; };
  if (main === 'clear') { if (r() < .35) { const a = 11 + (r() * 4 | 0); fill(a, a + 2 + (r() * 3 | 0), 'cloudy'); } }
  else if (main === 'cloudy') { if (r() < .5) fill(roll5, roll5 + 2 + (r() * 3 | 0), 'clear'); if (r() < .4) fill(18 + (r() * 3 | 0), 24, 'clear'); }
  else if (main === 'rain') { // rain with 1-2 dry breaks
    const nb = 1 + (r() < .5 ? 1 : 0); for (let i = 0; i < nb; i++) { const a = roll5 + 2 + (r() * 15 | 0); fill(a, a + 1 + (r() * 2 | 0), 'cloudy'); }
  } else if (main === 'storm') { // a 2-4 h storm spell inside a rainy day, usually afternoon
    fill(0, 24, 'rain'); const len = 2 + (r() * Math.max(1, (RULES.stormMaxHours | 0) - 1) | 0), a = 13 + (r() * 6 | 0); fill(a, a + len, 'storm');
    if (r() < .5) fill(roll5, 11 + (r() * 2 | 0), 'cloudy');
  } else if (main === 'snow') { const a = roll5 + (r() * 10 | 0), len = 4 + (r() * 10 | 0); fill(0, 24, 'cloudy'); fill(a, a + len, 'snow'); }
  else if (main === 'fog') { const burn = (RULES.fogBurnsOffAt | 0) + (r() * 2 | 0); fill(burn, 24, r() < .6 ? 'clear' : 'cloudy'); }
  // dry day: chance of a misty morning
  if ((main === 'clear' || main === 'cloudy') && r() < FOG_MORNING[s]) fill(5, 8 + (r() * 3 | 0), 'fog');
  fill(0, roll5, prev === 'clear' && k[roll5] === 'fog' ? 'fog' : prev);
  // events with guaranteed weather override during their hours
  if (EVENTS) for (const e of EVENTS) { const gw = e.special && e.special.guaranteedWeather; if (!gw || !e.hours) continue; try { if (eventOnDay(e, d)) fill(Math.floor(e.hours[0]) - 1, Math.ceil(e.hours[1]), gw); } catch (err) { } }
  // temperatures: min at 05:00, max at 15:00
  const [lo, hi] = TEMP[s], off = (r() - .5) * 4, c = new Array(24);
  for (let h = 0; h < 24; h++) {
    const p = h < 5 ? (5 - h) / 10 : h <= 15 ? (h - 5) / 10 : 1 - (h - 15) / 14; // 0 at 05:00, 1 at 15:00
    let t = lo + (hi - lo) * (.5 - .5 * Math.cos(Math.PI * Math.max(0, Math.min(1, p)))) + off;
    const kk = k[h]; if (kk === 'rain') t -= 2; else if (kk === 'storm') t -= 3; else if (kk === 'cloudy' || kk === 'fog') t -= 1;
    if (kk === 'snow') t = Math.min(t, 0); c[h] = Math.round(t);
  }
  return { day: d, k, c };
}
export const toF = c => Math.round(c * 9 / 5 + 32);
