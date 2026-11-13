// Game time + ambient light. Time is G.state.t = game minutes since Day 0 00:00.
export const DAY = 1440, WEEK = 7, MONTH_DAYS = 14, SEASONS = ['Spring', 'Summer', 'Autumn', 'Winter'], WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export function timeInfo(t) {
  const day = Math.floor(t / DAY), min = Math.floor(t - day * DAY), hour = Math.floor(min / 60), minute = min % 60;
  const season = Math.floor(day / MONTH_DAYS) % 4, year = Math.floor(day / (MONTH_DAYS * 4)) + 1;
  return { t, day, weekday: day % 7, weekdayName: WEEKDAYS[day % 7], hour, minute, hf: min / 60, dayOfMonth: day % MONTH_DAYS + 1, season, seasonName: SEASONS[season], year,
    clock: String(hour).padStart(2, '0') + ':' + String(minute).padStart(2, '0'), label: `${WEEKDAYS[day % 7]} ${day % MONTH_DAYS + 1} ${SEASONS[season]}` };
}
const lerp = (a, b, k) => a + (b - a) * k;
const hexmix = (h, h2, k) => { const a = parseInt(h.slice(1), 16), b = parseInt(h2.slice(1), 16); const c = i => Math.round(lerp(a >> i & 255, b >> i & 255, k)); return '#' + ((1 << 24) | c(16) << 16 | c(8) << 8 | c(0)).toString(16).slice(1); };
// [dawnStart, dayStart, duskStart, nightStart] in hours, per season
const SUN = [[5.5, 7.5, 18, 20], [4.75, 6.75, 19.25, 21.25], [6, 8, 17, 19], [7, 9, 15.75, 17.75]];
const NIGHT = '#46548c', DAWN = '#f0b8b0', DAYC = '#ffffff', GOLD = '#ffc79a', DUSK = '#a583b5';
/** Ambient for outdoor scenes. weather: 'clear'|'cloudy'|'rain'|'storm'|'snow'|'fog' */
export function ambient(t, weather = 'clear') {
  const ti = timeInfo(t), h = ti.hf, [d0, d1, k0, k1] = SUN[ti.season]; let amb, dark;
  if (h < d0 || h >= k1) { amb = NIGHT; dark = 1; }
  else if (h < d1) { const k = (h - d0) / (d1 - d0); amb = k < .5 ? hexmix(NIGHT, DAWN, k * 2) : hexmix(DAWN, DAYC, k * 2 - 1); dark = Math.max(0, 1 - k * 1.6); }
  else if (h < k0 - 1) { amb = DAYC; dark = 0; }
  else if (h < k0) { amb = hexmix(DAYC, GOLD, h - (k0 - 1)); dark = 0; }
  else { const k = (h - k0) / (k1 - k0); amb = k < .5 ? hexmix(GOLD, DUSK, k * 2) : hexmix(DUSK, NIGHT, k * 2 - 1); dark = Math.min(1, k * 1.5); }
  const dim = { clear: 0, cloudy: .12, rain: .22, storm: .35, snow: .1, fog: .15 }[weather] || 0;
  if (dim) { amb = hexmix(amb, weather === 'storm' ? '#5a6078' : '#8b93a6', dim * (1 - dark * .6) * 1.6); dark = Math.max(dark, dim * .8); }
  const bg = hexmix('#9fd6e8', '#0f1430', dark);
  return { amb, dark, bg, night: dark > .6 };
}
/** Ambient for interiors: bright by day, cosy lamp-lit at night */
export function ambientIndoor(t) { const o = ambient(t); return { amb: hexmix('#ffffff', '#c9b8a6', o.dark * .55), dark: .25 + o.dark * .6, bg: '#1b1a24', night: o.night }; }
