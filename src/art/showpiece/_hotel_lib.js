// Shared palette + helpers for the Grand Maple Hotel art (hotel.js, hotel_rooms.js). Not an asset module.
import * as R from '../../engine/raster.js';
const { box, qy, qx, qz, fq, lw, cyl, ball, dk, lt, hash2, PW, px, C, lit, glow } = R;
export const MARBLE = '#efe8dc', MARBLE_D = '#d8cfc0', VEIN = '#c2b8a6', BRASS = '#d8a848', BRASS_D = '#a87a2c', BRASS_L = '#f6d67a', BURG = '#7a2030', RED = '#a8342e', WALNUT = '#6a4430', WALNUT_D = '#4a2e22', WALNUT_L = '#8a5c3e',
  NAVY = '#22304e', GREEN = '#2f5a4a', CREAM = '#f4ecd8', LINEN = '#f8f4ea', INK = '#2a2733', GLASS = '#a8dcea', CEDAR = '#c8935a', TILE = '#cfe4e6', WATER = '#4ab8c8', WATER_L = '#8fe0e4', WATER_D = '#2f98b0', WARM = '#ffe2a0';
/** wall pattern: veined marble */
export const marble = (c = MARBLE, s = 1) => (u, v) => { const k = hash2(Math.floor((u + v * .6) / 9), Math.floor((v - u * .3) / 7), s), d = (u * 3 + v * 5 + Math.floor(k * 40)) % 23; return d === 0 || (d === 1 && k > .5) ? dk(c, .16) : k > .93 ? lt(c, .2) : c; };
/** floor pattern (world coords): veined marble slabs of size s with thin joints, two tones a / b in a checker */
export const marbleFloor = (a, b, s = 2, joint) => (x, y) => { const fx = x / s - Math.floor(x / s), fy = y / s - Math.floor(y / s), i = Math.floor(x / s), j = Math.floor(y / s), c = (i + j) & 1 ? a : b; if (fx < .03 || fy < .03) return joint || dk(c, .18); const k = hash2(Math.floor(x * 5 + y * 3), Math.floor(y * 5 - x * 2), i * 7 + j); return k > .955 ? dk(c, .1) : k < .03 ? lt(c, .25) : c; };
/** screen pixel of a local world point */
export const S2 = (x, y, z) => { const s = PW(x, y, z); return [Math.round(s[0]), Math.round(s[1])]; };
/** small dot (r px) at a world point */
export const dot = (x, y, z, c, r = 1) => { const s = S2(x, y, z), cc = C(c); for (let j = -r + 1; j < r; j++) for (let i = -r + 1; i < r; i++) px(s[0] + i, s[1] + j, cc); };
/** brass rail on posts along x (y fixed) or along y (x fixed) */
export const railX = (x0, x1, y, z0, h, c = BRASS, n) => { n = n || Math.max(2, Math.round((x1 - x0) / .5) + 1); for (let i = 0; i < n; i++) { const x = x0 + (x1 - x0) * i / (n - 1); lw([x, y, z0], [x, y, z0 + h], dk(c, .15)); } lw([x0, y, z0 + h], [x1, y, z0 + h], c); lw([x0, y, z0 + h + .06], [x1, y, z0 + h + .06], lt(c, .3)); lw([x0, y, z0 + h * .5], [x1, y, z0 + h * .5], dk(c, .1)); };
export const railY = (x, y0, y1, z0, h, c = BRASS, n) => { n = n || Math.max(2, Math.round((y1 - y0) / .5) + 1); for (let i = 0; i < n; i++) { const y = y0 + (y1 - y0) * i / (n - 1); lw([x, y, z0], [x, y, z0 + h], dk(c, .25)); } lw([x, y0, z0 + h], [x, y1, z0 + h], dk(c, .1)); lw([x, y0, z0 + h + .06], [x, y1, z0 + h + .06], lt(c, .2)); lw([x, y0, z0 + h * .5], [x, y1, z0 + h * .5], dk(c, .2)); };
/** flower / foliage blob cluster */
export const bloom = (x, y, z, r, cols, seed = 1, n = 9) => { const rr = R.rng(seed * 7 + 3); for (let i = 0; i < n; i++) { const a = rr() * 6.283, d = rr() * r, c = cols[Math.floor(rr() * cols.length)]; ball(x + Math.cos(a) * d, y + Math.sin(a) * d * .6, z + (rr() - .3) * r * .9, r * (.22 + rr() * .2), c, { ol: false }); } };
/** potted frond fan (palm-ish) */
export const fronds = (x, y, z, h, c = '#3f8a55', n = 7, seed = 2) => { const rr = R.rng(seed + 11); for (let i = 0; i < n; i++) { const a = (i / n) * 6.283 + rr(), l = h * (.6 + rr() * .4), ex = x + Math.cos(a) * l * .5, ey = y + Math.sin(a) * l * .5, ez = z + l * (.5 + rr() * .4); const m = [x + (ex - x) * .5, y + (ey - y) * .5, z + l * .75]; lw([x, y, z], m, dk(c, .2)); lw(m, [ex, ey, ez - l * .25], c); lw([m[0], m[1], m[2] + .06], [ex, ey, ez - l * .2], lt(c, .2)); } };
/** a row of bottles on a y-plane shelf */
export const bottles = (x0, x1, y, z, seed = 1, cols = ['#3f8a55', '#a8642e', '#e8c06a', '#7a2030', '#5a7ad8', '#f4ecd8', '#2f5a4a', '#c0563a']) => { const rr = R.rng(seed * 13 + 5); for (let x = x0 + .08; x < x1 - .05; x += .16) { const c = cols[Math.floor(rr() * cols.length)], h = .2 + rr() * .14; qy(x - .045, x + .045, y, z, z + h, c); qy(x - .02, x + .02, y, z + h, z + h + .08, dk(c, .2)); lw([x - .045, y, z + h * .5], [x + .045, y, z + h * .5], lt(c, .4)); } };
/** candle with a lit flame */
export const candle = (x, y, z, h = .16) => { lw([x, y, z], [x, y, z + h], LINEN); lit(() => dot(x, y, z + h + .05, '#ffd060')); glow(() => dot(x, y, z + h + .05, '#fff0b0', 2)); };
/** arc of world points on a y-plane */
export const arcY = (cx, y, cz, r, a0, a1, n = 12, ry) => { const o = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; o.push([cx + Math.cos(a) * r, y, cz + Math.sin(a) * (ry || r)]); } return o; };
/** skyline through a window: fn(u 0..1, v 0..1 from bottom) -> hex. time 'day'|'dusk'|'night', view 'city'|'bay' */
export function skyline(time, view, seed = 1) {
  const sky = time === 'night' ? ['#0f1430', '#18204a', '#243262'] : time === 'dusk' ? ['#5a5a9a', '#e88a70', '#ffd09a'] : ['#7fc8ec', '#a8dcf2', '#d4eef6'];
  const tw = []; const rr = R.rng(seed * 31 + 7); for (let i = 0; i < 14; i++) tw.push([rr(), .18 + rr() * (view === 'bay' ? .22 : .5), .04 + rr() * .06, rr()]);
  return (u, v) => {
    if (view === 'bay' && v < .3) { const w = (Math.floor(u * 60 + Math.sin(v * 40) * 2) + Math.floor(v * 50)) % 7 === 0; return time === 'night' ? (w ? '#3a4a8a' : '#141c40') : time === 'dusk' ? (w ? '#ffd09a' : '#6a5a8a') : (w ? '#c8ecf4' : '#3a8ab8'); }
    const base = view === 'bay' ? .3 : 0;
    for (const t of tw) if (Math.abs(u - t[0]) < t[2] && v < base + t[1]) { const wx = Math.floor((u - t[0] + t[2]) * 90), wy = Math.floor(v * 46), win = wx % 3 !== 0 && wy % 2 === 1, on = hash2(wx + Math.floor(t[3] * 99), wy, 3) > (time === 'night' ? .45 : .8);
      if (time === 'day') return win ? '#8fc0d8' : ['#8a94a8', '#a0a8b8', '#787f94'][Math.floor(t[3] * 3)]; return win && on ? '#ffd98a' : time === 'night' ? '#1a2244' : '#4a4670'; }
    if (time === 'night' && hash2(Math.floor(u * 140), Math.floor(v * 90), 5) > .992) return '#fff4d0';
    return v > .72 ? sky[0] : v > .5 ? sky[1] : sky[2];
  };
}
export { R, box, qy, qx, qz, fq, lw, cyl, ball, dk, lt, lit, glow, hash2 };
