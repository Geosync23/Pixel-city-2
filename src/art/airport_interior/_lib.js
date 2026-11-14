// Shared palette + helpers for the airport interior art (furn.airport.*).
import { box, qy, qz, fq, lw, lit, glow, ball, dk, lt, textY, textW } from '../../engine/raster.js';

export const WH = '#eef1f3', GR = '#c9d0d6', STEEL = '#9aa5b0', DARK = '#2c3440', TEAL = '#2f8f96', WOOD = '#c79a64', YEL = '#f2c230', NAVY = '#22304a', RED = '#d2412f', GREEN = '#3fa45b';
export const BAGC = ['#c0392b', '#2f6fb0', '#3d4a54', '#3fa45b', '#8a5aa8', '#e08a2c', '#1f2630', '#d86a8f', '#7a4e2d', '#5fb7c9'];
export const GREENS = ['#3f8a55', '#4f9a45', '#5aa84f', '#357a4a', '#62b356'];
export const T = t => ['airport_interior', 'airport'].concat(t || []);
/** sky / apron colours for window views: s = 0 day, 1 dusk, 2 night */
export const SKY = s => s === 2 ? { top: '#141a33', lo: '#232c4d', gnd: '#2b3040', gnd2: '#343a4c', line: '#6a7288', body: '#aeb6c6', n: 1 }
  : s === 1 ? { top: '#e98a5a', lo: '#f6c27a', gnd: '#6d6a78', gnd2: '#7a7684', line: '#d8c9a0', body: '#f3e3d2', n: 0 }
    : { top: '#8fc9ea', lo: '#c5e6f5', gnd: '#8d949c', gnd2: '#9aa1a9', line: '#e9e4c8', body: '#f6f8fa', n: 0 };
/** polygon on a +y wall plane: pts = [[x, z], ...] */
export const wp = (y, pts, c, c2) => fq(pts.map(q => [q[0], y, q[1]]), c, c2);
/** ellipse on a +y wall plane */
export function we(y, cx, cz, rx, rz, c, c2) { const p = []; for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; p.push([cx + Math.cos(a) * rx, cz + Math.sin(a) * rz]); } wp(y, p, c, c2); }
/** lit text rows on a +y wall (screens): rows = [[text, colour]] */
export function rowsY(rows, x0, y, zTop, pitch = .4) { lit(() => rows.forEach((r, i) => textY(String(r[0]), x0, y, zTop - i * pitch, r[1] || '#ffd98a'))); }
/** dark screen with a lit face on a +y wall */
export function screenY(x0, x1, y, z0, z1, bg = '#18202c') { qy(x0 - .04, x1 + .04, y, z0 - .04, z1 + .04, '#1c222b'); lit(() => qy(x0, x1, y, z0, z1, bg)); }
/** small upright suitcase with its min corner at (x,y,z) */
export function suitcase(x, y, z, c, o = {}) {
  const w = o.w || .42, d = o.d || .24, h = o.h || .55;
  box(x, y, z + .04, w, d, h, c); qy(x + .03, x + w - .03, y + d, z + .04 + h * .45, z + .04 + h * .52, dk(c, .3)); lw([x + w * .3, y + d / 2, z + h + .04], [x + w * .3, y + d / 2, z + h + .22], '#5a6270'); lw([x + w * .7, y + d / 2, z + h + .04], [x + w * .7, y + d / 2, z + h + .22], '#5a6270'); lw([x + w * .3, y + d / 2, z + h + .22], [x + w * .7, y + d / 2, z + h + .22], '#3a4250');
  if (o.tag) lit(() => { qy(x + w * .55, x + w * .8, y + d + .01, z + h * .6, z + h * .85, o.tag); });
}
/** evergreen indoor foliage clump */
export function clump(x, y, z, r, seed = 0) { const g = GREENS[seed % GREENS.length]; ball(x, y, z, r, g); ball(x - r * .5, y + r * .3, z - r * .2, r * .6, dk(g, .1)); ball(x + r * .45, y - r * .1, z + r * .35, r * .55, lt(g, .12)); }
/** fern / grass fronds */
export function fronds(x, y, z, h, n, seed = 0) { for (let i = 0; i < n; i++) { const a = (i / n - .5) * 1.6, g = GREENS[(i + seed) % GREENS.length]; lw([x, y, z], [x + Math.sin(a) * h * .7, y + Math.cos(a * 2.1) * .1, z + h * (1 - Math.abs(a) * .35)], g); lw([x + .03, y, z], [x + .03 + Math.sin(a) * h * .6, y, z + h * (.9 - Math.abs(a) * .3)], dk(g, .15)); } }
/** counter body with a light top and a kick plate */
export function counter(x, y, w, d, h, c, top) { box(x, y, 0, w, d, h, c, { t: top || WH }); qy(x, x + w, y + d, 0, .1, dk(c, .35)); qy(x, x + w, y + d, h - .08, h, lt(c, .2)); }
export { textW, glow, qz };
