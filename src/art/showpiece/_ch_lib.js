// Shared palette + helpers for the Maple Bay City Hall art (cityhall.js, cityhall_rooms.js, cityhall_ext.js). Not an asset module.
import * as R from '../../engine/raster.js';
import { MARBLE, MARBLE_D, BRASS, BRASS_D, BRASS_L, LINEN, INK, marble, S2, dot } from './_hotel_lib.js';
export * from './_hotel_lib.js';
const { box, qy, qx, qz, lw, cyl, dk, lt, PW, px, C, lit, glow, textY, textW, U } = R;
export const OAK = '#8a5a34', OAK_D = '#5e3a22', OAK_L = '#a8743f', CIVIC = '#2f6f5f', CIVIC_D = '#1f4a40', BAIZE = '#3a7a5a', STONE = '#e8dcc4', STONE_D = '#cdbf9f', SEALBLUE = '#2a4a7a', MAPLE = '#c8402e', PAPER = '#f2e8d0', SLATE = '#3a4250',
  STEEL = '#9aa4ae', STEEL_D = '#6a7480', FILM = '#bfe8c8';
/** centred 3x5 text on a +y plane between x0..x1, baseline top at z */
export const ctext = (s, x0, x1, y, z, c) => { s = String(s); textY(s, (x0 + x1) / 2 - textW(s) / 2 / U, y, z, c); };
/** brass plaque with dark text on a +y plane */
export const plaque = (s, x0, x1, y, z0, z1, bg = BRASS, fg = '#4a3418') => { qy(x0, x1, y, z0, z1, bg); lw([x0, y, z1], [x1, y, z1], lt(bg, .4)); lw([x0, y, z0], [x1, y, z0], dk(bg, .35)); if (s) ctext(s, x0, x1, y, (z0 + z1) / 2 + 3 / U, fg); };
/** oak counter body with a top slab; returns nothing */
export const counter = (w, d, h, c = OAK, top = MARBLE) => { box(0, 0, 0, w, d, h, c, { l: R.PAT.planks(dk(c, .1), 7), r: R.PAT.planks(dk(c, .3), 7) }); qy(0, w, d, 0, .1, dk(c, .45)); qx(w, 0, d, 0, .1, dk(c, .5)); box(-.05, -.05, h, w + .1, d + .1, .07, top, { ol: true }); };
/** seven-segment digit on a +y plane (w .22, h .42) */
const SEG = { 0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abfgcd', '-': 'g' };
export const seg7 = (d, x, y, z, c, w = .2, h = .4) => { const s = SEG[d] || '', L = (a, b) => { lw(a, b, c); lw([a[0], a[1], a[2] - 1 / U], [b[0], b[1], b[2] - 1 / U], c); }, m = z + h / 2;
  if (s.includes('a')) L([x, y, z + h], [x + w, y, z + h]); if (s.includes('g')) L([x, y, m], [x + w, y, m]); if (s.includes('d')) L([x, y, z + 1 / U], [x + w, y, z + 1 / U]);
  if (s.includes('f')) lw([x, y, m], [x, y, z + h], c); if (s.includes('e')) lw([x, y, z], [x, y, m], c); if (s.includes('b')) lw([x + w, y, m], [x + w, y, z + h], c); if (s.includes('c')) lw([x + w, y, z], [x + w, y, m], c); };
export const num7 = (n, x, y, z, c, w = .2, h = .4) => { String(n).split('').forEach((d, i) => seg7(d, x + i * (w + .12), y, z, c, w, h)); };
/** little person bust on a +y plane (portraits, photographs): centre x, base z */
export const bust = (x, y, z, o = {}) => { const sk = o.skin || '#e8b890', top = o.top || '#2a3550', hair = o.hair || '#4a3022';
  qy(x - .26, x + .26, y, z, z + .3, top); qy(x - .2, x + .2, y, z + .3, z + .38, top); qy(x - .05, x + .05, y, z + .12, z + .36, o.tie || LINEN); qy(x - .13, x + .13, y, z + .38, z + .68, sk); qy(x - .15, x + .15, y, z + .6, z + .74, hair);
  if (o.hat) { qy(x - .2, x + .2, y, z + .68, z + .73, o.hat); qy(x - .12, x + .12, y, z + .73, z + .9, o.hat); } if (o.beard) qy(x - .13, x + .13, y, z + .38, z + .5, o.beard); if (o.stache) lw([x - .08, y, z + .5], [x + .08, y, z + .5], o.stache);
  if (o.glasses) { lw([x - .1, y, z + .57], [x + .1, y, z + .57], INK); } const e = S2(x, y, z + .58); px(e[0] - 2, e[1], C(INK)); px(e[0] + 2, e[1] + 1, C(INK)); if (o.chain) { lw([x - .2, y, z + .3], [x, y, z + .14], BRASS_L); lw([x + .2, y, z + .3], [x, y, z + .14], BRASS_L); dot(x, y, z + .12, BRASS_L, 2); } };
/** gilt frame on a +y plane */
export const frame = (x0, x1, y, z0, z1, c = BRASS, t = .07) => { qy(x0, x1, y, z0, z1, dk(c, .1)); qy(x0 + t, x1 - t, y, z0 + t, z1 - t, INK); lw([x0, y, z1], [x1, y, z1], lt(c, .4)); lw([x0, y, z0], [x0, y, z1], lt(c, .2)); lw([x0, y, z0], [x1, y, z0], dk(c, .4)); };
/** maple leaf (screen-space, centre px, size s) */
export const leaf = (X, Y, s, c) => { const cc = C(c); for (let j = -s; j <= s; j++) for (let i = -s; i <= s; i++) { const a = Math.atan2(j, i), d = Math.hypot(i, j * 1.15), rr = s * (.55 + .45 * Math.abs(Math.cos(a * 2.5 + .6))); if (d <= rr && !(j > s * .2 && Math.abs(i) > s * .45)) px(X + i, Y + j, cc); } px(X, Y + s, cc); px(X, Y + s + 1, cc); };
/** row of archive boxes / book spines / rolled maps on a +y plane shelf */
export const shelfRow = (x0, x1, y, z, h, kind, seed = 1) => { const rr = R.rng(seed * 17 + 3); if (kind === 'books') { for (let x = x0 + .04; x < x1 - .1; ) { const w = .07 + rr() * .07, c = ['#7a2030', '#22304e', '#2f5a4a', '#8a5a34', '#b8862e', '#4a3a5a', '#a8342e'][Math.floor(rr() * 7)], hh = h * (.72 + rr() * .26); qy(x, x + w, y, z, z + hh, c); lw([x, y, z + hh * .8], [x + w, y, z + hh * .8], lt(c, .5)); x += w + .012; } }
  else if (kind === 'rolls') { for (let x = x0 + .12; x < x1 - .08; x += .2) { const zz = z + .09 + (Math.floor(rr() * 2)) * .16; const s = S2(x, y, zz); R.ellipse(s[0], s[1], 2.4, 2.4, PAPER); px(s[0], s[1], C('#b89a6a')); } }
  else { for (let x = x0 + .05; x < x1 - .3; x += .46) { const c = rr() < .25 ? '#8a9aa8' : rr() < .5 ? '#b89a6a' : '#c8b088'; qy(x, x + .4, y, z, z + h * .82, c); qy(x + .08, x + .32, y, z + h * .3, z + h * .55, PAPER); lw([x + .12, y, z + h * .43], [x + .28, y, z + h * .43], '#6a5a48'); lw([x, y, z + h * .82], [x + .4, y, z + h * .82], lt(c, .3)); } } };
