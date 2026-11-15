// Maple Bay Aquarium — shared palette + raster helpers for the aquarium art files (private to this folder).
//   AQ palette · S2(x,y,z) rounded screen point · cylP(x,y,z,r,h, fn(k,v,hpx)->hex|null, o) patterned cylinder wall (k = -1..1 across, v = px above the base)
//   fishS(x,y,z, len, c, o) small side-view fish in screen space at a world anchor · kelpS / coralS / starS / bubbleS screen-space decorations
//   waterTop(x0,x1,y0,y1,z, deep?) rippled water surface · steel(x,y,z,w,d,h) white painted steel box
import * as R from '../../engine/raster.js';
const { PW, qz, box, dk, lt, mix, hash2, C, px, rect, ellipse } = R;
export const AQ = { white: '#eef3f2', frame: '#dfe8ea', steel: '#b9c6cc', navy: '#16324f', deep: '#0f2a48', sea: '#1f6f9a', blue: '#2f90c0', aqua: '#58c4dc', foam: '#e8fbff', sky: '#9fdcf0', teal: '#1f8f9a', tealD: '#17666f',
  coral: '#f0735a', orange: '#f29a3a', sand: '#e8d6a8', sandD: '#cdb888', rock: '#7d8792', rockD: '#59636e', kelp: '#5f8a3a', kelpD: '#3f6a2c', bronze: '#4a7a70', bronzeD: '#2f5a58', bronzeL: '#8fc0a8', ink: '#2a2733', wood: '#b8875a', woodD: '#8a6240', carpet: '#24406a' };
export const S2 = (x, y, z) => { const s = PW(x, y, z); return [Math.round(s[0]), Math.round(s[1])]; };
/** cylinder side with a pattern; top ellipse in o.t (hex) unless o.t === null */
export function cylP(x, y, z, r, h, fn, o = {}) {
  const b = PW(x, y, z), t = PW(x, y, z + h), rx = r * R.U * 1.414, ry = rx / 2, x0 = Math.ceil(b[0] - rx), x1 = Math.floor(b[0] + rx), hpx = Math.round(b[1] - t[1]);
  for (let X = x0; X <= x1; X++) { const k = (X - b[0]) / rx, e = ry * Math.sqrt(Math.max(0, 1 - k * k)), yb = Math.round(b[1] + e); for (let Y = Math.round(t[1] + (o.t === null ? -e : 0)); Y <= yb; Y++) { const c = fn(k, yb - Y, hpx); if (c) px(X, Y, C(c)); } }
  if (o.t) ellipse(t[0], t[1], rx, ry, o.t, o.t2);
  if (o.ol !== false) { const oc = C(o.olc || AQ.ink); for (let X = x0; X <= x1; X++) { const k = (X - b[0]) / rx, e = ry * Math.sqrt(Math.max(0, 1 - k * k)); px(X, Math.round(b[1] + e) + 1, oc); px(X, Math.round(t[1] - e) - 1, oc); } for (let Y = Math.round(t[1]); Y <= Math.round(b[1]); Y++) { px(x0 - 1, Y, oc); px(x1 + 1, Y, oc); } }
}
/** tiny side-view fish (screen space), heading right when o.dir >= 0 */
export function fishS(x, y, z, len, c, o = {}) {
  const s = S2(x, y, z), d = o.dir === -1 ? -1 : 1, hh = Math.max(1, Math.round(len * (o.fat || .32))), cc = C(c), c2 = C(o.c2 || dk(c, .25));
  for (let i = 0; i < len; i++) { const t = i / (len - 1 || 1), w = Math.max(0, Math.round(hh * Math.sin(Math.PI * Math.min(1, t * 1.15 + .05)))); for (let j = -w; j <= w; j++) px(s[0] + d * (i - (len >> 1)), s[1] + j, o.stripe && i % o.stripe === 1 ? c2 : cc); }
  const tx = s[0] - d * ((len >> 1) + 1); for (let j = -hh; j <= hh; j++) { px(tx, s[1] + j, c2); if (Math.abs(j) >= hh - 1 || len < 6) px(tx - d, s[1] + j, c2); }
  if (len > 5) px(s[0] + d * ((len >> 1) - 1), s[1] - (hh > 1 ? 1 : 0), C(AQ.ink));
}
export function kelpS(x, y, z, hpx, seed, c = AQ.kelp) { const s = S2(x, y, z), a = C(c), b = C(dk(c, .25)); for (let i = 0; i < hpx; i++) { const dx = Math.round(Math.sin(i / 5 + seed) * 2 + Math.sin(i / 11 + seed * 2) * 1.5); px(s[0] + dx, s[1] - i, i % 6 < 3 ? a : b); px(s[0] + dx + 1, s[1] - i, a); if (i % 7 === 3) { px(s[0] + dx - 1, s[1] - i, b); px(s[0] + dx - 2, s[1] - i - 1, b); } if (i % 7 === 6) { px(s[0] + dx + 2, s[1] - i, a); px(s[0] + dx + 3, s[1] - i - 1, a); } } }
export function coralS(x, y, z, k, seed = 1) {
  const s = S2(x, y, z), col = ['#f0735a', '#f29ac0', '#f2c24a', '#a070d0', '#58c4a0', '#f08a3a'][k % 6], d = dk(col, .28), l = lt(col, .3);
  if (k % 3 === 0) { for (let b = -2; b <= 2; b++) { const hgt = 5 + Math.round(hash2(b + 9, seed, 3) * 6); for (let i = 0; i < hgt; i++) { const X = s[0] + b * 2 + Math.round(b * i / 5); px(X, s[1] - i, C(i > hgt - 3 ? l : col)); px(X + 1, s[1] - i, C(d)); } } }
  else if (k % 3 === 1) { ellipse(s[0], s[1] - 4, 6, 4, col); ellipse(s[0] - 1, s[1] - 5, 3, 2, l); for (let i = -5; i <= 5; i += 2) px(s[0] + i, s[1] - 3 + (Math.abs(i) >> 2), C(d)); }
  else { for (let a = 0; a < 7; a++) { const an = -Math.PI * (a + .5) / 7, L = 5 + Math.round(hash2(a, seed, 5) * 4); for (let i = 0; i < L; i++) { px(s[0] + Math.round(Math.cos(an) * i), s[1] - 1 + Math.round(Math.sin(an) * i), C(i > L - 2 ? l : col)); } } rect(s[0] - 2, s[1] - 1, 5, 2, d); }
}
export function starS(x, y, z, c = '#f08a3a') { const s = S2(x, y, z), a = C(c), b = C(lt(c, .3)); rect(s[0] - 1, s[1] - 1, 3, 3, c); px(s[0], s[1] - 3, a); px(s[0], s[1] - 2, a); px(s[0] - 3, s[1] - 1, a); px(s[0] - 2, s[1] - 1, a); px(s[0] + 2, s[1] - 1, a); px(s[0] + 3, s[1] - 1, a); px(s[0] - 2, s[1] + 2, a); px(s[0] - 1, s[1] + 1, a); px(s[0] + 1, s[1] + 1, a); px(s[0] + 2, s[1] + 2, a); px(s[0], s[1], b); }
export function bubbleS(x, y, z, n, seed) { const s = S2(x, y, z); for (let i = 0; i < n; i++) { const X = s[0] + Math.round((hash2(i, seed, 1) - .5) * 6), Y = s[1] - Math.round(i * 5 + hash2(i, seed, 2) * 3); px(X, Y, C('#e8fbff')); if (i % 2) px(X + 1, Y, C('#bfeeff')); } }
/** rippled water surface */
export function waterTop(x0, x1, y0, y1, z, c = AQ.blue) { const a = lt(c, .18), b = dk(c, .12); qz(x0, x1, y0, y1, z, (x, y) => { const k = Math.sin(x * 5 + Math.sin(y * 3) * 1.5) + Math.sin(y * 7 + x); return k > 1.25 ? AQ.foam : k > .5 ? a : k < -1 ? b : c; }); }
export const steel = (x, y, z, w, d, h, c = AQ.white, o) => box(x, y, z, w, d, h, c, Object.assign({ l: dk(c, .08), r: dk(c, .2) }, o));
/** screen-space outline polygon fill helper in world points */
export const poly = (pts, c, c2) => R.fq(pts, c, c2);
export { mix };
