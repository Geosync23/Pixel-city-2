// Shared helpers for the Maple Bay Observatory: art (observatory*.js), the room canvases (scenes/rooms/observatory2.js) and the sim (sim/observatory.js).
// Pure: no DOM. Painters take a `put(x, y, hex, lit?)` callback (y DOWN unless noted) so they work on raster targets and on 2D canvases alike.
//   moonPhase(day) -> 0..1 (0 new, .5 full; one lunation = one 14-day month, full moon mid-month)   phaseIdx(ph) -> 0..7   PHASE_NAMES
//   moonDisc(put, cx, cy, r, ph, o?)      the Moon with maria, lit part only (o.dark = colour of the unlit part, o.detail = craters)
//   skyPx(u, v, o) -> [hex, lit]           one pixel of the open sky (v UP from the horizon). o: { time: 'day'|'dusk'|'night', wx: null|'cloud'|'rain', season, frame }
//   CONSTELLATIONS [{ id, name, season, stars: [[x, y, mag]], lines: [[i, j]], note }]  (x, y in 0..1, y down)
//   drawFigure(put, c, x0, y0, w, h, o?)   stars (+ lines when o.lines) of a constellation into a box
import { mix, hash2 } from '../../engine/raster.js';

export const NAVY = '#1c2548', NAVY_D = '#131a36', NAVY_L = '#2d3a6e', BRASS = '#d9a441', BRASS_D = '#a8762a', BRASS_L = '#f4d68a', CREAM = '#f4ead0', MARBLE = '#e6e0d4', MARBLE_D = '#bdb6a8', WOOD = '#6a4630', WOOD_L = '#8a5f40', RED = '#c8402f', TEAL = '#2f8f8a', DARK = '#262a3a';
export const PHASE_NAMES = ['New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous', 'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'];
export const moonPhase = day => (((day + .5) % 14) + 14) % 14 / 14;
export const phaseIdx = ph => Math.round(ph * 8) % 8;

const MARIA = [[-.35, -.3, .3, .24], [.1, -.42, .26, .18], [.34, -.1, .2, .26], [-.1, .08, .34, .2], [-.5, .12, .16, .2], [.2, .34, .2, .14], [-.28, .5, .14, .1]];
const CRATERS = [[.42, .55, .09], [-.55, -.48, .07], [.6, .22, .06], [0, .7, .08], [-.66, .3, .05], [.05, -.72, .06]];
export function moonDisc(put, cx, cy, r, ph, o = {}) {
  const k = Math.cos(ph * Math.PI * 2), wax = ph <= .5, L = o.c || '#f4f0dc', M = o.c2 || '#c9c6b4', D = o.dark === undefined ? null : o.dark;
  for (let y = -Math.ceil(r); y <= Math.ceil(r); y++) for (let x = -Math.ceil(r); x <= Math.ceil(r); x++) {
    const xn = (x + (r % 1 ? 0 : .5) - .5) / r, yn = (y + (r % 1 ? 0 : .5) - .5) / r, d = xn * xn + yn * yn; if (d > 1) continue;
    const w = Math.sqrt(Math.max(0, 1 - yn * yn)), lit = ph > .02 && ph < .98 && (Math.abs(ph - .5) < .03 || (wax ? xn > k * w : xn < -k * w));
    if (!lit) { if (D) put(Math.round(cx + x), Math.round(cy + y), D, false); continue; }
    let c = L; for (const m of MARIA) { const a = (xn - m[0]) / m[2], b = (yn - m[1]) / m[3]; if (a * a + b * b < 1) { c = M; break; } }
    if (o.detail) { for (const q of CRATERS) { const dd = Math.hypot(xn - q[0], yn - q[1]); if (dd < q[2]) c = dd > q[2] * .62 ? (xn - q[0] + yn - q[1] > 0 ? '#fffbe8' : '#aaa894') : mix(c, '#b8b5a0', .5); }
      if (d > .86) c = mix(c, '#b0ad98', .45); const tx = wax ? xn - k * w : -k * w - xn; if (tx < .12) c = mix(c, '#6a6a78', .55 - tx * 3); }
    put(Math.round(cx + x), Math.round(cy + y), c, true);
  }
}

const SKY = { day: ['#bfe0f4', '#93caee', '#6cb3e6', '#4f9fdc'], dusk: ['#f9c26e', '#f0885a', '#7a4c8e', '#3b3a7a'], night: ['#212f5f', '#172150', '#0f1740', '#0a0f2e'] };
/** open sky above the horizon. v = px above the horizon line (0..), u = px along. Returns [hex, lit]. */
export function skyPx(u, v, o) {
  const T = o.time || 'night', K = SKY[T], odd = (u + v) & 1, b = v / 22, i = Math.min(3, Math.floor(b)), f = b - i;
  let c = f > .82 && i < 3 && odd ? K[i + 1] : K[i], lit = false;
  if (T === 'night') {
    const mw = Math.abs((v - 40) - (u % 240 - 120) * .32); // a soft diagonal Milky Way band
    if (mw < 9 && hash2(u, v, 21) > .9 - (9 - mw) * .012) { c = mw < 4 ? '#5a6aa8' : '#3a4a86'; }
    const h = hash2(u, v, 9); if (h > .9925) { c = h > .998 ? '#ffffff' : h > .996 ? '#ffe9b0' : '#b8c6f0'; lit = true; }
  }
  if (o.wx) { // cloud deck: drifting dithered bands that hide the stars
    const fr = (o.frame || 0) * 3, n = Math.sin((u + fr) / 37) * 6 + Math.sin((u + fr) / 13 + v / 9) * 4 + Math.sin(v / 6 + 1) * 5, dens = o.wx === 'rain' ? 6 : 1.5;
    if (n + dens > 2 || (n + dens > -3 && odd)) { c = T === 'night' ? (n > 5 ? '#3a4266' : '#2b3252') : T === 'dusk' ? (n > 5 ? '#c98a8e' : '#9a6a86') : (n > 5 ? '#f4f6f8' : '#c8d2dc'); lit = false; }
    if (o.wx === 'rain' && ((u * 3 + v + (o.frame || 0) * 7) % 23 === 0) && hash2(u, (v + (o.frame || 0) * 7) >> 2, 2) > .35) c = T === 'night' ? '#6a7aa8' : '#eaf6fb';
  }
  return [c, lit];
}

/* ---------- the twelve constellations of the logbook (three per season) ---------- */
const K = (id, name, season, stars, lines, note) => ({ id, name, season, stars, lines, note });
export const CONSTELLATIONS = [
  K('leo', 'Leo, the Lion', 0, [[.12, .62, 1], [.2, .42, 2], [.3, .3, 2], [.42, .32, 2], [.46, .48, 2], [.36, .62, 1], [.86, .56, 1], [.72, .44, 2], [.7, .66, 2]], [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [5, 8], [8, 6], [6, 7], [7, 4]], 'The backwards question mark is his mane. Regulus, the dot under it, is his heart.'),
  K('bootes', 'Boötes, the Herdsman', 0, [[.5, .9, 1], [.36, .6, 2], [.64, .58, 2], [.3, .32, 2], [.68, .3, 2], [.5, .12, 2]], [[0, 1], [0, 2], [1, 3], [2, 4], [3, 5], [4, 5]], 'A kite with orange Arcturus at the bottom. Follow the Dipper\'s handle and you "arc to Arcturus".'),
  K('ursa', 'The Big Dipper', 0, [[.06, .3, 2], [.22, .22, 2], [.36, .3, 2], [.5, .4, 2], [.52, .62, 2], [.78, .66, 1], [.82, .42, 1]], [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]], 'Seven stars of the Great Bear. The two at the end of the bowl point straight at the North Star.'),
  K('cygnus', 'Cygnus, the Swan', 1, [[.5, .1, 1], [.5, .4, 2], [.5, .9, 2], [.2, .34, 2], [.8, .5, 2], [.34, .37, 3], [.66, .44, 3]], [[0, 1], [1, 2], [3, 5], [5, 1], [1, 6], [6, 4]], 'A swan flying down the Milky Way. Some people see a cross. Deneb is the tail.'),
  K('lyra', 'Lyra, the Harp', 1, [[.5, .12, 1], [.4, .36, 3], [.62, .36, 3], [.34, .82, 2], [.58, .84, 2]], [[0, 1], [0, 2], [1, 2], [1, 3], [2, 4], [3, 4]], 'Small, neat and easy: brilliant Vega with a little parallelogram hanging underneath.'),
  K('scorpius', 'Scorpius, the Scorpion', 1, [[.1, .14, 2], [.14, .28, 2], [.1, .42, 2], [.3, .34, 1], [.42, .5, 2], [.48, .7, 2], [.6, .84, 2], [.76, .86, 2], [.88, .74, 2], [.86, .6, 1]], [[0, 1], [1, 2], [1, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9]], 'A fish-hook low in the south, with red Antares for a heart and a sting at the end of the tail.'),
  K('pegasus', 'Pegasus, the Winged Horse', 2, [[.3, .3, 2], [.66, .26, 2], [.7, .62, 2], [.32, .66, 2], [.12, .5, 3], [.06, .8, 2], [.86, .14, 3], [.94, .34, 3]], [[0, 1], [1, 2], [2, 3], [3, 0], [3, 4], [4, 5], [1, 6], [6, 7]], 'The Great Square: four stars and almost nothing inside them. The rest of the horse takes imagination.'),
  K('cassiopeia', 'Cassiopeia, the Queen', 2, [[.08, .3, 2], [.28, .66, 2], [.5, .4, 2], [.7, .72, 2], [.92, .34, 2]], [[0, 1], [1, 2], [2, 3], [3, 4]], 'A lopsided W (or M) of five stars, opposite the Dipper across the North Star.'),
  K('andromeda', 'Andromeda, the Princess', 2, [[.08, .76, 2], [.32, .6, 2], [.56, .44, 2], [.84, .24, 2], [.5, .62, 3], [.46, .8, 3]], [[0, 1], [1, 2], [2, 3], [2, 4], [4, 5]], 'A chain of stars off the corner of the Great Square. The smudge beside it is a whole other galaxy.'),
  K('orion', 'Orion, the Hunter', 3, [[.26, .12, 1], [.72, .16, 2], [.4, .48, 2], [.5, .5, 2], [.6, .52, 2], [.3, .88, 2], [.76, .86, 1], [.5, .68, 3]], [[0, 2], [1, 4], [2, 3], [3, 4], [2, 5], [4, 6], [0, 1], [5, 6], [3, 7]], 'Three stars in a row for a belt, red Betelgeuse at the shoulder, blue Rigel at the knee. His sword holds a nebula.'),
  K('taurus', 'Taurus, the Bull', 3, [[.5, .56, 1], [.42, .5, 3], [.34, .56, 3], [.4, .64, 3], [.16, .2, 2], [.2, .86, 2], [.78, .38, 3], [.84, .3, 3], [.8, .26, 3]], [[0, 1], [1, 2], [2, 3], [3, 0], [1, 4], [3, 5]], 'A V for the face with orange Aldebaran as the eye, and the Seven Sisters riding on his shoulder.'),
  K('gemini', 'Gemini, the Twins', 3, [[.3, .1, 1], [.56, .12, 1], [.26, .4, 3], [.6, .42, 3], [.2, .72, 2], [.34, .9, 2], [.62, .74, 3], [.76, .9, 2]], [[0, 1], [0, 2], [1, 3], [2, 4], [2, 5], [3, 6], [3, 7]], 'Two stick figures side by side. The bright heads are Castor and Pollux.'),
];
export const CONS_BY_ID = Object.fromEntries(CONSTELLATIONS.map(c => [c.id, c]));
export function drawFigure(put, c, x0, y0, w, h, o = {}) {
  const P = c.stars.map(s => [Math.round(x0 + s[0] * w), Math.round(y0 + s[1] * h), s[2]]);
  if (o.lines) for (const [a, b] of c.lines) { const A = P[a], B = P[b], n = Math.max(Math.abs(B[0] - A[0]), Math.abs(B[1] - A[1])); for (let i = 1; i < n; i++) if (!o.dash || i % 2) put(Math.round(A[0] + (B[0] - A[0]) * i / n), Math.round(A[1] + (B[1] - A[1]) * i / n), o.lineC || '#5a6ab0', false); }
  for (const s of P) { const c1 = o.starC || (s[2] === 1 ? '#ffffff' : s[2] === 2 ? '#e8ecff' : '#b8c6f0'); put(s[0], s[1], c1, true); if (s[2] <= (o.big || 1)) { put(s[0] + 1, s[1], c1, true); put(s[0] - 1, s[1], c1, true); put(s[0], s[1] + 1, c1, true); put(s[0], s[1] - 1, c1, true); } }
}

/* ---------- planets, for murals, models and eyepiece views ---------- */
export const PLANETS = [
  { id: 'mercury', name: 'Mercury', r: .38, c: '#a8a39a', c2: '#8a857c' }, { id: 'venus', name: 'Venus', r: .95, c: '#f0deb0', c2: '#e2c88a' }, { id: 'earth', name: 'Earth', r: 1, c: '#4a8ae8', c2: '#4fa858' }, { id: 'mars', name: 'Mars', r: .53, c: '#d9683a', c2: '#b04a2a' },
  { id: 'jupiter', name: 'Jupiter', r: 11.2, c: '#e8cfa0', c2: '#c08a5a' }, { id: 'saturn', name: 'Saturn', r: 9.4, c: '#ecd9a0', c2: '#cdb070' }, { id: 'uranus', name: 'Uranus', r: 4, c: '#a8e4e8', c2: '#8accd8' }, { id: 'neptune', name: 'Neptune', r: 3.9, c: '#4a6ae8', c2: '#3a52c0' },
];
/** a banded / shaded planet disc. kind = planet id. o: { t (rotation 0..1), ring (saturn ring half-width factor), detail } */
export function planetDisc(put, kind, cx, cy, r, o = {}) {
  const P = PLANETS.find(p => p.id === kind) || PLANETS[4], t = o.t || 0, R2 = r * r;
  const ringPx = (front) => { if (kind !== 'saturn') return; const a = r * 2.25, b = r * .62, a2 = r * 1.35, b2 = r * .36; for (let y = -Math.ceil(b); y <= Math.ceil(b); y++) for (let x = -Math.ceil(a); x <= Math.ceil(a); x++) { if (front !== (y > 0)) continue; const q = (x * x) / (a * a) + (y * y) / (b * b), q2 = (x * x) / (a2 * a2) + (y * y) / (b2 * b2); if (q > 1 || q2 < 1) continue; if (!front && x * x + y * y < R2) continue; const gap = q > .7 && q < .78; if (gap) continue; put(Math.round(cx + x), Math.round(cy + y), q > .78 ? '#b8a878' : '#e4d4a0', true); } };
  ringPx(false);
  for (let y = -Math.ceil(r); y <= Math.ceil(r); y++) for (let x = -Math.ceil(r); x <= Math.ceil(r); x++) {
    const d = x * x + y * y; if (d > R2 + r * .4) continue; const xn = x / r, yn = y / r; let c = P.c;
    if (kind === 'jupiter' || kind === 'saturn') { const band = Math.floor((yn + 1) * (kind === 'jupiter' ? 5.5 : 4) + Math.sin(xn * 3 + t * 6) * .25); c = band % 2 ? P.c2 : P.c; if (kind === 'jupiter') { if (band === 3 || band === 7) c = '#a86a4a'; const sx = ((.35 - t * 2) % 2 + 2) % 2 - 1; if (Math.hypot((xn - sx) / .24, (yn - .3) / .14) < 1) c = '#d9583a'; } }
    else if (kind === 'earth') { const n = Math.sin((xn + t * 2) * 5 + yn * 3) + Math.sin(yn * 7 - xn * 2 + 1); c = n > .5 ? P.c2 : P.c; if (Math.abs(yn) > .82) c = '#f4f8fb'; else if (hash2(Math.round(x + t * 40), y, 4) > .9) c = '#e8f2fb'; }
    else if (kind === 'mars') { const n = Math.sin((xn + t * 2) * 4 + yn * 2) + Math.sin(yn * 6 + xn * 3); c = n > .8 ? P.c2 : P.c; if (yn < -.8) c = '#f4f0e8'; }
    else if (kind === 'venus') { c = Math.sin(yn * 6 + xn * 2) > .5 ? P.c2 : P.c; if (o.phase !== undefined && xn < o.phase * 2 - 1 + Math.abs(yn) * .3) continue; }
    else if (kind === 'sun') { c = d > R2 * .7 ? '#f08a2a' : hash2(x, y, 3) > .8 ? '#ffe070' : '#ffc23a'; }
    else if (hash2(x, y, 6) > .8) c = P.c2;
    if (kind !== 'sun') { const sh = xn * .6 + yn * .7; if (sh > .55) c = mix(c, '#1a1630', .5); else if (sh > .2 && ((x + y) & 1)) c = mix(c, '#1a1630', .3); else if (sh < -.6) c = mix(c, '#ffffff', .25); }
    put(Math.round(cx + x), Math.round(cy + y), c, true);
  }
  ringPx(true);
}
