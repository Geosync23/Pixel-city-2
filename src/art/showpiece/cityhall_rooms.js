// Maple Bay City Hall — permits & records hall, clerk's office + wedding room, mayor's office, archive, clock tower. ids furn.cityhall.* (see cityhall.js for the rotunda / chamber pieces).
//   ticketmachine   nowserving {n, win} (wall, lit)   window {n, short, name, shut} service counter with glass   waitrow {n, c, dir} beam seating   photobooth {flash}   formtable   lostshelf {key} (wall)
//   registrar (table)   mayordesk   keycase {has} (wall)   parapet {w}   shelves {w, kind: boxes|books|rolls, h, c}   mapcase {open}   microfilm {on}   photowall {k} (wall)   newsrack
//   clockworks {f 0-3}   bell {swing -1|0|1}   telescope   clockface {h, m} (wall, glows)   plaque {t, t2} (wall)   bigwindow {w, time, fixed} (wall; the plaza through the balcony doors)
import { R, box, qy, qx, qz, fq, lw, cyl, ball, dk, lt, lit, glow, MARBLE, MARBLE_D, BRASS, BRASS_D, BRASS_L, BURG, NAVY, GREEN, CREAM, LINEN, INK, WARM, marble, S2, dot, railX, bloom,
  OAK, OAK_D, OAK_L, CIVIC, CIVIC_D, BAIZE, STONE, STONE_D, SEALBLUE, MAPLE, PAPER, SLATE, STEEL, STEEL_D, FILM, ctext, plaque, counter, num7, bust, frame, leaf, shelfRow } from './_ch_lib.js';
const { signY, textY, PAT, rng, px, C, ellipse } = R;

function ticketmachine() {
  box(0, 0, 0, .7, .5, 1.25, '#a8342e'); qy(.08, .62, .501, .2, .5, dk('#a8342e', .3)); qy(.25, .45, .502, .3, .42, PAPER); lit(() => { qy(.12, .58, .502, .78, 1.08, '#1c2028'); textY('A', .2, .503, 1.02, '#ffd060'); dot(.5, .5, .64, '#6fe08a', 2); });
  lw([.35, .25, 1.25], [.35, .25, 1.7], STEEL_D); signY('TAKE A', -.35, 1.05, .27, 2.08, 2.44, '#a8342e', LINEN, { frame: false }); signY('NUMBER', -.35, 1.05, .27, 1.7, 2.08, '#a8342e', LINEN, { frame: false }); lw([-.35, .27, 1.7], [1.05, .27, 1.7], dk('#a8342e', .4));
}
function nowserving(p) { const W = 5, y = .15; qy(0, W, y, 0, 1.5, SLATE); qy(.08, W - .08, y + .001, .08, 1.42, '#10141c'); lit(() => { ctext('NOW SERVING', 0, 2.5, y + .002, 1.34, '#ffb040'); textY('A', .55, y + .002, .6, '#ffd060'); num7(String(p.n === undefined ? 41 : p.n).padStart(2, '0'), .95, y + .002, .2, '#ffd060', .28, .56); ctext('WINDOW', 2.5, W - .1, y + .002, 1.34, '#ffb040'); num7(p.win || 1, 3.6, y + .002, .2, '#6fe08a', .28, .56); }); }
function win(p) {
  const w = 3, n = p.n || 1, sh = !!p.shut;
  counter(w, .9, 1.05, OAK, MARBLE); signY(p.name || '', .12, w - .12, .91, .44, .82, sh ? '#6a6a70' : CIVIC, LINEN, { frame: false }); lw([.12, .91, .44], [w - .12, .91, .44], BRASS); lw([.12, .91, .82], [w - .12, .91, .82], BRASS);
  if (sh) { qy(.08, w - .08, .5, 1.13, 2.4, '#8a8f9a'); for (let z = 1.2; z < 2.4; z += .12) lw([.08, .5, z], [w - .08, .5, z], '#6a7078'); }
  else { for (const [a, b] of [[.3, 1.5], [2.5, 1.6]]) lw([a, .5, b], [a + .2, .5, b + .5], '#e4f4fa'); const s = S2(w / 2, .5, 1.62); ellipse(s[0], s[1], 3, 3, BRASS); px(s[0], s[1], C(INK)); px(s[0] - 1, s[1], C(INK)); px(s[0] + 1, s[1], C(INK)); qy(w / 2 - .3, w / 2 + .3, .5, 1.13, 1.2, BRASS_D); }
  for (const x of [.04, w - .04]) { lw([x, .5, 1.12], [x, .5, 2.4], BRASS_D); lw([x + .03, .5, 1.12], [x + .03, .5, 2.4], BRASS); }
  box(0, .42, 2.4, w, .16, .5, OAK_D); lit(() => { qy(.1, .55, .585, 2.46, 2.84, sh ? '#5a2a2a' : CIVIC_D); textY(String(n), .26, .59, 2.8, '#ffe9a0'); ctext(sh ? 'CLOSED' : (p.short || ''), .6, w - .05, .59, 2.8, sh ? '#ff8a7a' : '#f4f0e8'); });
  box(.3, .62, 1.12, .3, .2, .1, OAK_D, { ol: false }); lw([2.5, .7, 1.12], [2.42, .8, 1.3], BRASS); box(2.1, .6, 1.12, .28, .22, .03, PAPER, { ol: false });
}
function waitrow(p) { const n = p.n || 4, c = p.c || '#3a6a8a', w = n * .6; lw([.1, .3, 0], [.1, .3, .3], STEEL_D); lw([w - .1, .3, 0], [w - .1, .3, .3], STEEL_D); box(.05, .24, .28, w - .1, .12, .06, STEEL_D, { ol: false }); for (let i = 0; i < n; i++) { box(i * .6 + .06, .06, .34, .48, .5, .1, c); lw([i * .6 + .1, .56, .44], [i * .6 + .5, .56, .44], lt(c, .3)); } }
function photobooth(p) {
  const c = '#3b5b8a'; box(0, 0, 0, 1.6, 1.2, 2.1, c, { l: dk(c, .15) }); qy(.15, 1.0, 1.201, .1, 1.8, p.flash ? '#fffbe0' : '#1c2030'); if (p.flash) lit(() => qy(.15, 1.0, 1.202, .1, 1.8, '#fffbe0')); else { box(.4, 1.0, 0, .34, .2, .5, '#5a4030', { ol: false }); }
  qy(.15, .55, 1.203, .5, 1.8, BURG); for (const x of [.25, .35, .45]) lw([x, 1.203, .5], [x, 1.203, 1.8], dk(BURG, .25)); lw([.15, 1.203, 1.8], [1.0, 1.203, 1.8], BRASS);
  qy(1.1, 1.5, 1.201, .7, 1.7, LINEN); for (let i = 0; i < 4; i++) { qy(1.14, 1.46, 1.202, .74 + i * .24, .94 + i * .24, ['#e8b890', '#8a5a3a', '#f0c8a8', '#c88a60'][i]); } lit(() => signY('PHOTOS', .1, 1.5, 1.21, 1.86, 2.08, '#e8b63a', INK, { frame: false })); box(-.03, -.03, 2.1, 1.66, 1.26, .1, dk(c, .3));
}
function formtable() { for (const x of [.1, 2.1]) for (const y of [.1, .6]) lw([x, y, 0], [x, y, 1.0], STEEL_D); box(0, 0, 1.0, 2.2, .7, .07, OAK_L); box(0, 0, 1.07, 2.2, .18, .5, OAK, { ol: true }); for (let i = 0; i < 5; i++) { qy(.1 + i * .42, .44 + i * .42, .181, 1.12, 1.5, OAK_D); qy(.13 + i * .42, .41 + i * .42, .182, 1.14, 1.4 - (i % 2) * .08, ['#f6e2a8', '#cfe9f4', '#f6c8c0', PAPER, '#c8e8b0'][i]); } for (const x of [.5, 1.3]) { lw([x, .5, 1.07], [x + .1, .4, 1.3], BRASS_D); box(x - .3, .36, 1.07, .34, .26, .02, PAPER, { ol: false }); } signY('FORMS', .5, 1.7, .182, 1.6, 1.9, CIVIC, LINEN); }
function lostshelf(p) {
  const w = 3, y = .3; qy(0, w, y, 0, 2.2, dk(OAK, .3)); for (const z of [.02, .6, 1.2, 1.8]) box(0, 0, z, w, .3, .06, OAK, { ol: false }); for (const x of [0, w - .06]) qy(x, x + .06, y, 0, 2.2, OAK_D); ctext('LOST+FOUND', 0, w, y, 2.2, BRASS_L);
  // umbrellas, a teddy, one glove, a hat, a tuba, a boot, a box
  lw([.25, y, .66], [.4, y, 1.15], '#3b6fd0'); lw([.45, y, .66], [.55, y, 1.15], MAPLE); ball(1.0, .2, .82, .14, '#b8794a', { ol: false }); ball(1.0, .2, 1.02, .09, '#b8794a', { ol: false }); qy(1.5, 1.7, y, .66, .86, '#e8b63a'); qy(2.1, 2.5, y, .66, .74, INK); qy(2.2, 2.4, y, .74, .92, INK);
  ball(.5, .2, 1.45, .17, BRASS, { ol: false }); lw([.6, y, 1.4], [.9, y, 1.7], BRASS_L); qy(1.4, 1.75, y, 1.26, 1.5, '#8a5a3a'); qy(1.4, 1.52, y, 1.5, 1.7, '#8a5a3a'); box(2.2, .05, 1.26, .5, .2, .3, '#c8b088', { ol: false }); qy(.3, .9, y, .08, .4, '#8a9aa8'); qy(1.2, 1.9, y, .08, .34, '#b89a6a'); qy(2.2, 2.7, y, .08, .45, '#7a2030');
  if (p.key) lit(() => { const s = S2(2.0, y, 1.95); ellipse(s[0], s[1], 2.5, 2.5, BRASS_L); px(s[0], s[1], C(dk(OAK, .3))); R.line([s[0] + 3, s[1] + 1], [s[0] + 9, s[1] + 4], BRASS_L); px(s[0] + 8, s[1] + 5, C(BRASS_L)); px(s[0] + 6, s[1] + 4, C(BRASS_L)); });
}
function registrar() { box(0, 0, 0, 2, .8, .8, LINEN, { l: (u, v) => (u % 9 === 0 ? '#e0d8c8' : LINEN), r: dk(LINEN, .12) }); box(.6, .2, .8, .8, .45, .05, OAK_D, { ol: false }); qz(.64, 1.0, .24, .62, .86, PAPER); qz(1.0, 1.36, .24, .62, .86, LINEN); lw([1.0, .24, .865], [1.0, .62, .865], '#b8a888'); lw([1.5, .5, .8], [1.62, .36, 1.1], BRASS); cyl(.3, .4, .8, .07, .16, '#8fd0e0', { ol: false }); bloom(.3, .4, 1.1, .16, ['#f2a7c3', '#f8f4ea', '#8fb89a'], 4, 6); }
function mayordesk() {
  box(0, 0, 0, 3, 1.2, .8, OAK, { l: (u, v) => (u % 16 < 1 || v % 12 === 11 ? dk(OAK, .34) : dk(OAK, .16)), r: PAT.planks(dk(OAK, .34), 6) }); box(-.05, -.05, .8, 3.1, 1.3, .07, OAK_D, { t: BAIZE }); const s = S2(1.5, 1.2, .42); ellipse(s[0], s[1], 6, 6, BRASS); ellipse(s[0], s[1], 5, 5, SEALBLUE); leaf(s[0], s[1], 3, MAPLE);
  plaque('MAYOR', 1.0, 2.0, 1.0, .87, 1.17); lw([.4, .5, .87], [.4, .5, 1.3], BRASS); box(.2, .4, 1.28, .4, .2, .14, GREEN, { ol: false }); lit(() => qy(.22, .58, .6, 1.24, 1.28, '#fff0b0')); glow(() => { const q = S2(.4, .7, .9); ellipse(q[0], q[1], 9, 4, '#ffe9a0', 'glass'); });
  box(2.3, .35, .87, .5, .4, .04, PAPER, { ol: false }); box(2.34, .38, .91, .44, .34, .03, LINEN, { ol: false }); box(2.5, .85, .87, .3, .2, .1, MAPLE, { ol: false }); cyl(1.2, .45, .87, .16, .05, '#b9b4a8', { ol: false }); cyl(1.2, .45, .92, .04, .16, '#b9b4a8', { ol: false }); cyl(1.2, .45, 1.08, .09, .03, '#b9b4a8', { ol: false });
}
function keycase(p) { const y = .2; qy(0, 1.5, y, 0, 1.2, OAK_D); qy(.1, 1.4, y, .1, 1.1, '#5a1826'); lw([0, y, 1.2], [1.5, y, 1.2], OAK_L); const s = S2(.45, y, .62), c = p.has === 0 ? '#7a3040' : BRASS_L, d = () => { for (let a = 0; a < 16; a++) px(Math.round(s[0] + Math.cos(a * .39) * 4), Math.round(s[1] + Math.sin(a * .39) * 4), C(c)); for (let a = 0; a < 12; a++) px(Math.round(s[0] + Math.cos(a * .52) * 3), Math.round(s[1] + Math.sin(a * .52) * 3), C(c)); R.line([s[0] + 5, s[1] + 2], [s[0] + 18, s[1] + 9], c); R.line([s[0] + 5, s[1] + 3], [s[0] + 18, s[1] + 10], c); R.line([s[0] + 15, s[1] + 9], [s[0] + 15, s[1] + 13], c); R.line([s[0] + 18, s[1] + 10], [s[0] + 18, s[1] + 14], c); R.line([s[0] + 16, s[1] + 12], [s[0] + 17, s[1] + 12], c); }; if (p.has === 0) d(); else lit(d); for (const [a, b] of [[.2, .25], [1.0, .5]]) lw([a, y, b], [a + .25, y, b + .45], '#f0d0d8'); }
function parapet(p) { const w = p.w || 4; box(0, 0, 0, w, .3, .14, STONE_D, { ol: false }); for (let x = .2; x < w - .1; x += .34) { cyl(x, .15, .14, .06, .2, STONE, { ol: false }); cyl(x, .15, .34, .09, .22, STONE, { ol: false }); cyl(x, .15, .56, .06, .16, STONE, { ol: false }); } box(-.03, -.03, .72, w + .06, .36, .14, STONE, { l: dk(STONE, .14) }); if (p.snow) qz(0, w, 0, .3, .87, '#f4f8fb'); }
function shelves(p) {
  const w = p.w || 3, h = p.h || 2.3, k = p.kind || 'boxes', c = p.c || (k === 'books' ? OAK : STEEL_D), n = Math.floor((h - .1) / .52);
  box(0, 0, 0, w, .5, h, c, { l: dk(c, .5), r: dk(c, .3), t: dk(c, .1) }); for (let i = 0; i < n; i++) { const z = .08 + i * .52; qy(.06, w - .06, .5, z, z + .46, dk(c, .62)); shelfRow(.06, w - .06, .501, z, .46, k, (p.seed || 1) + i); lw([.06, .5, z], [w - .06, .5, z], lt(c, .15)); }
  if (p.label) { qy(w / 2 - .5, w / 2 + .5, .502, h - .34, h - .04, PAPER); ctext(p.label, w / 2 - .5, w / 2 + .5, .503, h - .08, INK); }
}
function mapcase(p) {
  box(0, 0, 0, 2.2, 1.3, 1.0, OAK, { r: PAT.planks(dk(OAK, .3), 8) }); for (let i = 0; i < 6; i++) { const z = .06 + i * .155; qy(.06, 2.14, 1.301, z, z + .13, i === 3 && p.open ? dk(OAK, .5) : dk(OAK, .12)); if (i !== 3 || !p.open) { for (const x of [.5, 1.7]) dot(x, 1.301, z + .06, BRASS, 2); qy(.95, 1.25, 1.302, z + .03, z + .1, PAPER); } }
  box(-.04, -.04, 1.0, 2.28, 1.38, .06, OAK_D); qz(.2, 1.9, .2, 1.1, 1.065, (x, y) => { const fx = (x * 3) % 1, fy = (y * 3) % 1; return fx < .08 || fy < .08 ? '#b89a6a' : Math.abs(x - 1 - .2 * Math.sin(y * 4)) < .05 ? '#5a8ab0' : PAPER; }); cyl(1.95, .3, 1.06, .06, .1, BRASS, { ol: false });
  if (p.open) { box(.08, 1.3, .52, 2.04, .62, .1, OAK_L); qz(.14, 2.06, 1.34, 1.88, .625, (x, y) => { const cx = 1.1, cy = 1.6, d = Math.hypot((x - cx), (y - cy) * 1.4); return Math.abs(d - .22) < .025 || Math.abs(d - .1) < .02 || (Math.abs(y - cy) < .02 && x > .3 && x < 1.9) || (Math.abs(x - .5) < .02) || (x > 1.5 && Math.floor(y * 16) % 3 === 0 && x < 1.95) ? '#e8f0ff' : '#2a4a8a'; }); }
}
function microfilm(p) {
  for (const [x, y] of [[.1, .1], [1.7, .1], [.1, .8], [1.7, .8]]) lw([x, y, 0], [x, y, .72], STEEL_D); box(0, 0, .72, 1.8, .9, .06, OAK_L);
  box(.35, .12, .78, 1.1, .62, .12, STEEL_D); box(.42, .1, .9, .96, .5, .72, '#4a5058'); const on = !!p.on, d = () => { qy(.5, 1.3, .601, .98, 1.54, on ? FILM : '#232a30'); if (on) { qy(.56, 1.24, .602, 1.36, 1.48, '#3a5a48'); for (let i = 0; i < 4; i++) lw([.58, .602, 1.3 - i * .08], [1.22 - (i % 2) * .2, .602, 1.3 - i * .08], '#3a5a48'); } }; if (on) lit(d); else d();
  if (on) glow(() => { const q = S2(.9, 1.0, .8); ellipse(q[0], q[1], 10, 5, FILM, 'glass'); });
  for (const x of [.2, 1.6]) { cyl(x, .45, .78, .13, .05, '#2a2733', { ol: false }); cyl(x, .45, .83, .04, .05, STEEL, { ol: false }); } lw([.2, .45, .86], [.5, .45, .92], '#3a3028'); lw([1.6, .45, .86], [1.3, .45, .92], '#3a3028'); cyl(1.62, .75, .78, .05, .08, BRASS, { ol: false });
  box(.1, .5, .78, .2, .3, .1, '#c8b088', { ol: false });
}
function photowall(p) { const y = .1, k = p.k || 0, SEP = ['#d8c8a8', '#b8a888', '#8a7a60', '#5a4a3a']; for (let i = 0; i < 3; i++) { const x = i * 1.05, j = (k + i) % 4; frame(x, x + .9, y, 0, 1.1, OAK_D, .06); qy(x + .08, x + .82, y, .08, 1.02, SEP[0]); qy(x + .08, x + .82, y, .08, .4, SEP[1]);
    if (j === 0) { qy(x + .3, x + .6, y, .4, .5, SEP[2]); qy(x + .42, x + .48, y, .5, .8, SEP[2]); qy(x + .36, x + .54, y, .66, .7, SEP[2]); for (const a of [.14, .22, .68, .74]) qy(x + a, x + a + .05, y, .32, .5, SEP[3]); }
    else if (j === 1) { qy(x + .15, x + .75, y, .36, .72, SEP[2]); for (let w = 0; w < 4; w++) qy(x + .2 + w * .14, x + .28 + w * .14, y, .5, .64, SEP[0]); lw([x + .1, y, .9], [x + .8, y, .86], SEP[3]); lw([x + .45, y, .72], [x + .45, y, .88], SEP[3]); }
    else if (j === 2) { for (let b = 0; b < 4; b++) qy(x + .12 + b * .17, x + .26 + b * .17, y, .4, .55 + (b % 2) * .25, SEP[2]); lw([x + .7, y, .4], [x + .7, y, .95], SEP[3]); lw([x + .7, y, .95], [x + .5, y, .8], SEP[3]); }
    else { bust(x + .3, y, .2, { skin: SEP[0], top: SEP[3], hair: SEP[3], hat: SEP[3] }); bust(x + .62, y, .16, { skin: SEP[0], top: SEP[2], hair: SEP[3] }); } } }
function newsrack() { for (const x of [.08, 1.52]) { lw([x, .1, 0], [x, .4, 0], OAK_D); lw([x, .25, 0], [x, .25, 1.5], OAK); } for (let i = 0; i < 4; i++) { const z = 1.4 - i * .32, y = .25; lw([.08, y, z], [1.52, y, z], OAK_D); qy(.16, 1.44, y + .02, z - .28, z, i % 2 ? '#e8dcc0' : PAPER); qy(.2, .9, y + .021, z - .1, z - .04, INK); lw([.2, y + .021, z - .16], [1.4, y + .021, z - .16], '#8a8478'); lw([.2, y + .021, z - .22], [1.3, y + .021, z - .22], '#8a8478'); } }
function gear(cx, y, cz, r, n, ph, c) { const s = S2(cx, y, cz), R0 = r * 16; ellipse(s[0], s[1], R0, R0, dk(c, .1)); ellipse(s[0], s[1], R0 - 2, R0 - 2, c); ellipse(s[0], s[1], R0 * .45, R0 * .45, dk(c, .35)); for (let i = 0; i < n; i++) { const a = ph + i * 6.283 / n, X = s[0] + Math.cos(a) * (R0 + 1.5), Y = s[1] + Math.sin(a) * (R0 + 1.5); px(X, Y, C(c)); px(X + 1, Y, C(c)); px(X, Y + 1, C(dk(c, .2))); } for (let i = 0; i < 3; i++) { const a = ph + i * 2.094; R.line([s[0], s[1]], [s[0] + Math.cos(a) * (R0 - 2), s[1] + Math.sin(a) * (R0 - 2)], lt(c, .3)); } px(s[0], s[1], C(INK)); }
function clockworks(p) {
  const f = (p.f || 0) % 4, ph = f * .26; for (const x of [0, 3]) { box(x, .2, 0, .2, .5, 2.6, '#3a4250'); } box(0, .2, 2.5, 3.2, .5, .16, '#3a4250'); box(0, .2, .1, 3.2, .5, .12, '#3a4250');
  gear(1.0, .75, 1.3, .62, 16, ph, BRASS); gear(1.95, .76, 1.75, .42, 12, -ph * 1.5 + .2, BRASS_D); gear(2.5, .77, 1.15, .3, 9, ph * 2, BRASS_L); gear(1.75, .77, .75, .24, 8, -ph * 2.6, STEEL);
  const a = [-.22, -.08, .22, .08][f]; lw([1.5, .8, 2.5], [1.5 + Math.sin(a) * 1.9, .8, 2.5 - Math.cos(a) * 1.9], STEEL); const b = S2(1.5 + Math.sin(a) * 1.9, .8, 2.5 - Math.cos(a) * 1.9); ellipse(b[0], b[1], 4, 4, BRASS_L); lw([.3, .8, 2.5], [.3, .8, .9 + f * .08], '#6a5a48'); box(.2, .7, .6 + f * .08, .22, .2, .3, STEEL_D, { ol: false });
}
function bell(p) { const s = p.swing || 0; for (const x of [.1, 1.7]) { lw([x - .1, .6, 0], [x, .6, 2.3], OAK_D); lw([x + .1, .6, 0], [x, .6, 2.3], OAK_D); lw([x, .6, 0], [x, .6, 2.3], OAK); } box(0, .5, 2.3, 1.8, .2, .16, OAK, { ol: true }); const x = .9 + s * .18, BZ = '#9a7a3a'; lw([.9, .6, 2.3], [x, .6, 2.05], '#3a3028'); ball(x, .6, 1.95, .2, BZ, { ol: false }); cyl(x, .6, 1.2, .42, .7, BZ, { t: dk(BZ, .4) }); cyl(x, .6, 1.08, .52, .14, lt(BZ, .15), { t: dk(BZ, .5) }); dot(x - s * .1, .6, 1.02, '#3a3028', 2); lw([x + .2, .9, 1.4], [x + .3, .9, 1.8], lt(BZ, .5)); }
function telescope() { for (const [a, b] of [[.1, .15], [.6, .15], [.35, .6]]) lw([a, b, 0], [.35, .3, 1.05], '#3a3028'); cyl(.35, .3, 1.02, .07, .08, BRASS_D, { ol: false }); fq([[.05, .3, 1.5], [.1, .3, 1.36], [.7, .3, 1.02], [.66, .3, 1.16]], BRASS); lw([.05, .3, 1.5], [.66, .3, 1.16], BRASS_L); dot(.72, .3, 1.07, INK, 2); }
function clockface(p) {
  const y = .15, cx = 1.6, cz = 1.6, r = 1.5, pts = n => { const o = []; for (let i = 0; i < n; i++) { const a = i * 6.283 / n; o.push([cx + Math.cos(a) * r, y, cz + Math.sin(a) * r]); } return o; }, P = pts(24);
  fq(pts(24).map(q => [cx + (q[0] - cx) * 1.08, y, cz + (q[2] - cz) * 1.08]), '#3a4250'); fq(P, '#f2ead0', '#ece2c4'); glow(() => fq(P, '#ffe9b0', '#ffdc90'));
  for (let i = 0; i < 12; i++) { const a = i * .5236; lw([cx + Math.cos(a) * r * .82, y, cz + Math.sin(a) * r * .82], [cx + Math.cos(a) * r * .95, y, cz + Math.sin(a) * r * .95], '#5a4a40'); }
  const hand = (a, l, c) => { lw([cx, y, cz], [cx - Math.sin(a) * l, y, cz + Math.cos(a) * l], c); lw([cx + .03, y, cz], [cx - Math.sin(a) * l + .03, y, cz + Math.cos(a) * l], c); }; const h = p.h === undefined ? 10 : p.h, m = p.m || 0; hand((h % 12 + m / 60) * .5236, r * .5, '#2a2733'); hand(m / 60 * 6.283, r * .78, '#4a4458'); dot(cx, y, cz, BRASS, 2);
}
function plaqueArt(p) { const y = .08; plaque(null, 0, 2.8, y, 0, p.t2 ? 1.0 : .56, BRASS); ctext(p.t || '', 0, 2.8, y, p.t2 ? .9 : .44, '#4a3418'); if (p.t2) ctext(p.t2, 0, 2.8, y, .44, '#4a3418'); for (const [a, b] of [[.08, .08], [2.72, .08]]) dot(a, y, b, BRASS_D); }
function bigwindow(p) {
  const w = p.w || 6, y = .12, t = p.time || 'day', sky = t === 'night' ? ['#0f1430', '#1a2350'] : t === 'dusk' ? ['#e88a70', '#ffd09a'] : ['#8fd0ee', '#bfe6f6'], pave = t === 'night' ? '#3a3e58' : t === 'dusk' ? '#b89a88' : '#d8ccb4';
  qy(0, w, y, 0, 3.4, OAK_D); const d = () => { qy(.15, w - .15, y + .001, .15, 3.25, (u, v, W, H) => { const fy = v / H, fx = u / W; if (fy > .62) { if (t === 'night' && R.hash2(u, v, 4) > .985) return '#fff4d0'; return fy > .82 ? sky[0] : sky[1]; }
      if (fy > .4) { const b = Math.floor(fx * 9), top = .46 + R.hash2(b, 3, 2) * .2; if (fy < top) { const win = u % 4 > 1 && v % 4 > 1; return t === 'day' ? (win ? '#9fcbe0' : ['#b8a890', '#a8b0c0', '#c8a888'][b % 3]) : (win && R.hash2(u >> 2, v >> 2, 6) > .5 ? '#ffd98a' : t === 'night' ? '#20284a' : '#6a5a78'); } return sky[1]; }
      const dx = (fx - .5) * 2.4, dy = (fy - .2) * 5, dd = Math.hypot(dx, dy); if (dd < .5) return dd < .12 ? '#b9b4a8' : dd > .42 ? '#a8a294' : p.fixed ? ((u + v) & 1 ? '#6ab8dc' : '#8fd0e8') : '#8a8478'; return (Math.floor(fx * 14) + Math.floor(fy * 22)) & 1 ? pave : dk(pave, .06); });
    if (p.fixed) { const s = S2(w / 2, y, .15 + 3.1 * .22); for (let j = 0; j < 12; j++) { px(s[0], s[1] - j, C('#ffffff')); px(s[0] - 1 - (j >> 2), s[1] - 10 + j, C('#c8ecf8')); px(s[0] + 1 + (j >> 2), s[1] - 10 + j, C('#c8ecf8')); } } };
  if (t === 'day') d(); else lit(d);
  for (let i = 1; i < 4; i++) { const x = .15 + (w - .3) * i / 4; lw([x, y + .002, .15], [x, y + .002, 3.25], OAK_D); lw([x + .04, y + .002, .15], [x + .04, y + .002, 3.25], OAK); } lw([.15, y + .002, 2.3], [w - .15, y + .002, 2.3], OAK_D); for (const x of [w / 2 - .12, w / 2 + .16]) dot(x, y + .003, 1.2, BRASS_L, 2);
}

const T = ['cityhall'];
const A = (id, tags, size, draw, x) => Object.assign({ id: 'furn.cityhall.' + id, kind: 'furniture', tags: T.concat(tags), size, draw, variants: [{}] }, x);
const WALL = { wall: true, mount: 0, solid: false };
export default [
  A('ticketmachine', ['ch_ticket'], [.7, .5, 1.25], ticketmachine, { vb: [-.5, -.1, 0, 1.2, .7, 2.6], use: { x: .35, y: 1.05 } }),
  A('nowserving', ['decor'], [5, .15, 1.5], nowserving, Object.assign({ variants: [{ n: 47, win: 3 }] }, WALL, { mount: 2.9 })),
  A('window', ['ch_window'], [3, .9, 1.12], win, { vb: [-.2, -.2, 0, 3.2, 1.1, 3.1], use: { x: 1.5, y: 1.45 }, staff: { x: 1.5, y: -.45, dir: 1 }, variants: [{ n: 1, short: 'CASHIER', name: 'PAY BILLS' }, { n: 5, short: 'FOUND', name: 'LOST+FOUND' }, { n: 2, shut: 1, name: 'ID + TAGS' }] }),
  A('waitrow', ['ch_wait'], p => [(p.n || 4) * .6, .6, .45], waitrow, { seats: p => Array.from({ length: p.n || 4 }, (_, i) => ({ x: i * .6 + .3, y: .3, z: .45, dir: p.dir === undefined ? 3 : p.dir })), variants: [{}, { n: 6, c: '#8a5a34' }] }),
  A('photobooth', ['ch_photo'], [1.6, 1.2, 2.2], photobooth, { vb: [-.1, -.1, 0, 1.8, 1.4, 2.4], use: { x: .6, y: 1.7 }, variants: [{}, { flash: 1 }] }),
  A('formtable', ['ch_forms'], [2.2, .7, 1.1], formtable, { vb: [-.1, -.1, 0, 2.3, .8, 2], use: { x: 1.1, y: 1.2 } }),
  A('lostshelf', ['decor'], [3, .3, 2.2], lostshelf, Object.assign({ vb: [0, 0, 0, 3, .4, 2.4], variants: [{}, { key: 1 }] }, WALL)),
  A('registrar', ['ch_registrar'], [2, .8, .85], registrar, { vb: [-.2, -.2, 0, 2.2, 1, 1.5], use: { x: 1, y: 1.3 }, staff: { x: 1, y: -.45, dir: 1 } }),
  A('mayordesk', ['ch_mayordesk'], [3, 1.2, .87], mayordesk, { vb: [-.2, -.2, 0, 3.2, 1.4, 1.6], use: { x: 1.5, y: 1.75 }, staff: { x: 1.5, y: -.45, dir: 1 } }),
  A('keycase', ['ch_keycase'], [1.5, .2, 1.2], keycase, Object.assign({ use: { x: .75, y: .8 }, variants: [{}, { has: 0 }] }, WALL, { mount: 1 })),
  A('parapet', ['decor'], p => [p.w || 4, .3, .86], parapet, { variants: [{}, { w: 8 }] }),
  A('shelves', ['ch_shelves'], p => [p.w || 3, .5, p.h || 2.3], shelves, { use: p => ({ x: (p.w || 3) / 2, y: 1 }), variants: [{}, { kind: 'books' }, { kind: 'rolls', w: 2 }, { kind: 'boxes', label: '1962' }] }),
  A('mapcase', ['ch_mapcase'], [2.2, 1.3, 1.06], mapcase, { vb: [-.1, -.1, 0, 2.4, 2.1, 1.3], use: { x: 1.1, y: 2.3 }, variants: [{}, { open: 1 }] }),
  A('microfilm', ['ch_microfilm'], [1.8, .9, .78], microfilm, { vb: [-.1, -.1, 0, 1.9, 1.2, 1.75], use: { x: .9, y: 1.4 }, variants: [{}, { on: 1 }] }),
  A('photowall', ['ch_photos'], [3, .1, 1.1], photowall, Object.assign({ use: { x: 1.5, y: .7 }, variants: [{}, { k: 2 }] }, WALL, { mount: 1.1 })),
  A('newsrack', ['ch_news'], [1.6, .5, 1.5], newsrack, { use: { x: .8, y: 1 } }),
  A('clockworks', ['ch_clockwork'], [3.2, .9, 2.66], clockworks, { vb: [-.2, 0, 0, 3.4, 1.1, 2.8], use: { x: 1.6, y: 1.4 }, variants: [0, 1, 2, 3].map(f => ({ f })) }),
  A('bell', ['ch_bell'], [1.8, 1.2, 2.5], bell, { vb: [-.2, 0, 0, 2, 1.4, 2.6], use: { x: .9, y: 1.7 }, variants: [{}, { swing: 1 }] }),
  A('telescope', ['ch_scope'], [.7, .6, 1.5], telescope, { use: { x: .35, y: 1.1 } }),
  A('clockface', ['decor'], [3.2, .15, 3.2], clockface, Object.assign({ vb: [-.2, 0, -.2, 3.4, .3, 3.4], variants: [{ h: 10, m: 10 }, { h: 3, m: 40 }] }, WALL, { mount: .5 })),
  A('plaque', ['ch_plaque'], p => [2.8, .08, p.t2 ? 1 : .56], plaqueArt, Object.assign({ use: { x: 1.4, y: .7 }, variants: [{ t: 'THE FOUNTAIN', t2: 'RUNS AGAIN' }] }, WALL, { mount: 1.2 })),
  A('bigwindow', ['window'], p => [p.w || 6, .12, 3.4], bigwindow, Object.assign({ variants: [{}, { time: 'dusk', fixed: 1 }, { time: 'night' }] }, WALL, { mount: .2 })),
];
