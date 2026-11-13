// Shared icon-canvas helper for all DOM UI.
//   iconEl(id, scale = 2, category?) -> crisp <canvas class="pix ico"> (16x16 art, CSS-scaled)
//   iconCanvas(id, category?)        -> cached 16x16 source canvas (do not mutate)
// Ids: item ids ('apple', 'bed_t1'), 'need.hunger', 'skill.cooking', 'mood.good', 'moodlet.<id>', 'weather.rain', 'ui.coin', ...
// Uses src/art/icons/icons.js (drawIcon) when it exists; otherwise draws a tidy coloured placeholder tile.
import { MODULES } from '../art/registry.js';
import { render } from '../engine/raster.js';
import { toSprite } from '../engine/sprites.js';

const cache = new Map();
const CAT_COL = { ingredient: '#5fb84f', snack: '#f08a2c', drink: '#6fb3e0', ready_meal: '#e05a3a', dish: '#e05a3a', meal: '#f2c230', homegood: '#b8794a', outfit: '#8a5cc2', book: '#3b5bdb', gift: '#f28fb0', misc: '#9aa0aa' };
const PRE_COL = { need: '#f08a2c', skill: '#3b5bdb', mood: '#f6c945', moodlet: '#f6c945', weather: '#6fb3e0', ui: '#d9c9a6' };

function placeholder(id, category) {
  const c = document.createElement('canvas'); c.width = c.height = 16; const g = c.getContext('2d');
  const col = CAT_COL[category] || PRE_COL[String(id).split('.')[0]] || '#c9c2d8';
  g.fillStyle = '#2a2733'; g.fillRect(2, 1, 12, 14); g.fillRect(1, 2, 14, 12); g.fillStyle = col; g.fillRect(2, 2, 12, 12);
  g.fillStyle = '#ffffff55'; g.fillRect(2, 2, 12, 2); g.fillStyle = '#2a273340'; g.fillRect(2, 12, 12, 2);
  return c;
}
export function iconCanvas(id, category) {
  const key = id + '|' + (category || ''); let c = cache.get(key); if (c) return c;
  const m = MODULES['./icons/icons.js'];
  if (m && m.drawIcon && typeof document !== 'undefined') {
    try {
      const fb = m.hasIcon && !m.hasIcon(id) ? (m.resolveFallback ? m.resolveFallback(String(id), category) : null) : id;
      if (!fb || (fb === 'ui.unknown' && id !== 'ui.unknown')) c = null;
      else { const s = toSprite(render([0, 0, 16, 16], () => m.drawIcon(id, category), null, 0)); c = s && s.c; }
    } catch (e) { c = null; }
  }
  if (!c) c = placeholder(id, category);
  cache.set(key, c); return c;
}
/** is there real art for this id? */
export function hasIcon(id) { const m = MODULES['./icons/icons.js']; return !!(m && m.hasIcon && m.hasIcon(id)); }
export function iconEl(id, scale = 2, category) {
  const src = iconCanvas(id, category), c = document.createElement('canvas'); c.width = src.width; c.height = src.height;
  c.getContext('2d').drawImage(src, 0, 0); c.className = 'pix ico'; c.style.width = src.width * scale + 'px'; c.style.height = src.height * scale + 'px';
  c.style.imageRendering = 'pixelated'; c.style.flex = 'none'; return c;
}
/** icon id for a weather kind ('clear' | 'cloudy' | 'rain' | 'storm' | 'snow' | 'fog') */
export const weatherIcon = (kind, night) => 'weather.' + ({ clear: night ? 'moon' : 'sun', cloudy: 'cloud', rain: 'rain', storm: 'storm', snow: 'snow', fog: 'fog' }[kind] || 'partly');
const ML = { hungry: 'mood.hungry', starving: 'mood.hungry', tired: 'mood.tired', exhausted: 'mood.tired', groggy: 'mood.tired', grubby: 'mood.stinky', stinky: 'mood.stinky', bored: 'mood.bored', burnt_out: 'mood.stressed', a_bit_lonely: 'mood.lonely', lonely: 'mood.lonely',
  pumped: 'mood.pumped', caffeinated: 'mood.pumped', money_worries: 'mood.stressed', soaked: 'weather.rain', chilly: 'weather.snow', sunny_day: 'weather.sun', first_snow: 'weather.snow', homey: 'mood.cosy', cozy_home: 'mood.cosy', dream_home: 'mood.cosy', zen: 'mood.cosy',
  payday: 'ui.coin', fireworks_awe: 'ui.fireworks', promoted: 'ui.trophy', family_time: 'ui.heart', fresh_start: 'ui.sparkle', squeaky_clean: 'need.hygiene', fresh: 'need.hygiene', well_fed: 'need.hunger', rested: 'need.energy', connected: 'need.social', delighted: 'need.fun' };
/** icon id for a moodlet (dedicated 'moodlet.<id>' art when it exists, else a fitting face/glyph) */
export function moodletIcon(id, mood = 0) { return hasIcon('moodlet.' + id) ? 'moodlet.' + id : ML[id] || (mood < 0 ? 'mood.sad' : 'mood.happy'); }
