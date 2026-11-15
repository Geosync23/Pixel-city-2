// Maple Bay Post — interior pieces for the General Post Office, its sorting floor and the four branch offices. ids furn.postoffice.*
//   boxwall {w, rows, mine, has, name} (wall) brass P.O. boxes   window {n, short, name, shut, kg, parcel} service counter with grille (+ lit parcel scale)   desk writing desk, pens on chains
//   packtable   sortglass {w, f} (wall; the sorting floor through glass, 4 frames)   conveyor {w, f}   bin {t, n, c}   pigeon {w, seed}   dock {st 0 shut | 1 open | 2 van} (wall)   trolley {n}   sacks {seed}
//   stampcase   clock {h, m} (wall)   sign {t, t2, c, fg, w} (wall)   counter {w, c, name, cat, jars, kg} branch counter   slots posting pillar   photowall {me} (wall)   basket {n, slip} home mail basket
//   telegraph {on}   bottlerack   keeperbox   cardrack {seed}   citymap (wall)   backdrop (wall)   camera   tideboard (wall)   lifering (wall)   rocker   fairtable {seed}   cabinet {gone}   rail {w}
import { R, box, qy, qx, qz, fq, lw, cyl, ball, dk, lt, lit, glow, BRASS, BRASS_D, BRASS_L, LINEN, INK, PAPER, OAK, OAK_D, OAK_L, MARBLE, STEEL, STEEL_D, SLATE, S2, dot, ctext, plaque, counter, num7, bust, frame, railX, bloom,
  PBLUE, PBLUE_D, PBLUE_L, PRED, PYEL, CANVAS, CANVAS_D, KRAFT, KRAFT_D, PINK, horn, hornAt, envelope, parcel, clockY } from './_post_lib.js';
const { signY, textY, PAT, rng, px, C, ellipse, U } = R;

function boxwall(p) {
  const w = p.w || 6, y = .12, rows = p.rows || 5, n = Math.floor((w - .2) / .42), r = rng(p.seed || 3), top = .3 + rows * .4;
  qy(0, w, y, 0, top + .62, OAK_D); qy(0, w, y + .001, 0, .26, dk(OAK_D, .25)); plaque(p.name === undefined ? 'P.O. BOXES' : p.name, w / 2 - 1.45, w / 2 + 1.45, y + .002, top + .08, top + .54);
  for (let j = 0; j < rows; j++) for (let i = 0; i < n; i++) { const x0 = .1 + i * .42 + (w - .2 - n * .42) / 2, z0 = .3 + j * .4, k = j * n + i, mine = p.mine === k, c = mine ? BRASS_L : (i + j) % 2 ? BRASS : dk(BRASS, .08);
    qy(x0, x0 + .38, y + .002, z0, z0 + .36, c); lw([x0, y + .002, z0], [x0 + .38, y + .002, z0], BRASS_D); lw([x0 + .38, y + .002, z0], [x0 + .38, y + .002, z0 + .36], BRASS_D);
    qy(x0 + .06, x0 + .32, y + .003, z0 + .17, z0 + .31, '#3a3040'); if (r() < .45 || (mine && p.has)) lw([x0 + .09, y + .003, z0 + .2], [x0 + .29, y + .003, z0 + .27], mine && p.has ? '#ffffff' : '#cfc6b0');
    dot(x0 + .19, y + .003, z0 + .09, INK); if (mine) lit(() => { qy(x0 + .08, x0 + .3, y + .004, z0 + .02, z0 + .06, PRED); }); }
}
function win(p) {
  const w = 3, n = p.n || 1, sh = !!p.shut;
  counter(w, .9, 1.05, OAK, MARBLE); signY(p.name || '', .12, w - .12, .91, .44, .82, sh ? '#6a6a70' : PBLUE, LINEN, { frame: false }); lw([.12, .91, .44], [w - .12, .91, .44], BRASS); lw([.12, .91, .82], [w - .12, .91, .82], BRASS);
  if (sh) { qy(.08, w - .08, .5, 1.13, 2.4, '#8a8f9a'); for (let z = 1.2; z < 2.4; z += .12) lw([.08, .5, z], [w - .08, .5, z], '#6a7078'); }
  else { for (let x = .2; x < w - .1; x += .2) if (x < 1.1 || x > 1.9) lw([x, .5, 1.13], [x, .5, 2.4], x % .4 < .2 ? BRASS : BRASS_D); lw([.08, .5, 1.75], [1.1, .5, 1.75], BRASS); lw([1.9, .5, 1.75], [w - .08, .5, 1.75], BRASS); for (const x of [1.1, 1.9]) lw([x, .5, 1.13], [x, .5, 2.4], BRASS_L); lw([1.1, .5, 2.05], [1.9, .5, 2.05], BRASS_L); }
  for (const x of [.04, w - .04]) { lw([x, .5, 1.12], [x, .5, 2.4], BRASS_D); lw([x + .03, .5, 1.12], [x + .03, .5, 2.4], BRASS); }
  box(0, .42, 2.4, w, .16, .5, OAK_D); lit(() => { qy(.1, .55, .585, 2.46, 2.84, sh ? '#5a2a2a' : PBLUE_D); textY(String(n), .26, .59, 2.8, '#ffe9a0'); ctext(sh ? 'CLOSED' : (p.short || ''), .6, w - .05, .59, 2.8, sh ? '#ff8a7a' : '#f4f0e8'); });
  if (p.kg !== undefined) { // the parcel scale: a brass pan on a white base with a lit weight display
    box(2.1, .52, 1.12, .7, .34, .1, '#e8e4dc'); box(2.15, .55, 1.22, .6, .28, .04, BRASS, { ol: false }); lit(() => { qy(2.14, 2.76, .861, 1.13, 1.21, '#10141c'); const s = S2(2.2, .862, 1.2); const t = (p.kg || 0).toFixed(1); R.textS(t, s[0], s[1], '#6fe08a'); });
    if (p.parcel) parcel(2.22, .58, 1.26, .46, .22, .3); }
  else { box(.3, .62, 1.12, .3, .2, .1, OAK_D, { ol: false }); box(2.1, .6, 1.12, .28, .22, .03, PAPER, { ol: false }); }
}
function desk() {
  const W = 2.4; for (const x of [.08, W - .08]) for (const y of [.1, .8]) lw([x, y, 0], [x, y, .9], OAK_D); box(0, 0, .86, W, .95, .08, OAK, { ol: true }); qy(0, W, .95, .7, .86, dk(OAK, .3));
  box(0, 0, .94, W, .22, .62, OAK_D, { ol: true }); for (let i = 0; i < 6; i++) { qy(.08 + i * .38, .42 + i * .38, .221, 1.0, 1.5, dk(OAK_D, .3)); qy(.11 + i * .38, .39 + i * .38, .222, 1.02, 1.36 - (i % 3) * .07, ['#f6e2a8', LINEN, '#cfe9f4', LINEN, '#f6c8c0', LINEN][i]); }
  for (const x of [.55, 1.75]) { qz(x - .32, x + .32, .36, .82, .945, '#2f6a4a'); qz(x - .24, x + .2, .42, .76, .95, LINEN); lw([x - .2, .5, .951], [x + .12, .5, .951], '#6a7aa8'); lw([x - .2, .6, .951], [x + .16, .6, .951], '#6a7aa8'); lw([x - .2, .7, .951], [x, .7, .951], '#6a7aa8');
    lw([x + .4, .3, .94], [x + .4, .3, 1.3], BRASS_D); lw([x + .4, .3, 1.3], [x + .28, .5, 1.12], STEEL); lw([x + .28, .5, 1.12], [x + .22, .62, .97], STEEL); lw([x + .22, .62, .97], [x + .1, .7, .99], INK); }
  box(1.1, .4, .94, .2, .2, .1, INK, { ol: false }); dot(1.2, .5, 1.05, '#3a5aa8');
  lw([1.2, .12, 1.56], [1.2, .12, 1.86], BRASS); box(.9, .06, 1.84, .6, .2, .1, '#2f7a5a'); glow(() => qy(.92, 1.48, .261, 1.78, 1.84, '#fff0b0'));
}
function packtable() {
  const W = 2.6; for (const x of [.1, W - .1]) for (const y of [.1, 1]) lw([x, y, 0], [x, y, .9], STEEL_D); box(0, 0, .86, W, 1.1, .08, OAK_L, { ol: true }); qz(0, W, 0, 1.1, .3, dk(OAK, .2));
  for (let i = 0; i < 5; i++) box(.15, .1 + i * .02, .32 + i * .07, .9, .7, .06, i % 2 ? KRAFT : KRAFT_D, { ol: i === 4 });
  cyl(.3, .3, .94, .16, .5, KRAFT); cyl(.3, .3, 1.44, .05, .06, OAK_D); qz(.3, 1.2, .2, .8, .945, KRAFT, KRAFT_D); lw([1.2, .2, .946], [1.2, .8, .946], KRAFT_D);
  parcel(1.5, .3, .94, .55, .45, .36); box(2.2, .25, .94, .22, .3, .16, PRED); cyl(2.31, .66, .94, .1, .08, '#e8dcc0'); ball(2.31, .9, 1.02, .09, '#d8c8a0', { ol: false });
  lw([2.5, 1.05, .94], [2.5, 1.05, 1.5], BRASS_D); lw([2.5, 1.05, 1.5], [2.35, .8, 1.0], STEEL); signY('PACKING', .2, 2.4, -.01, 1.5, 1.86, PBLUE, LINEN); lw([.8, 0, .94], [.8, 0, 1.5], STEEL_D); lw([1.8, 0, .94], [1.8, 0, 1.5], STEEL_D);
}
function sortglass(p) {
  const w = p.w || 6, f = p.f || 0, y = .1, H = 2.2; qy(0, w, y, 0, H, OAK_D);
  lit(() => { qy(.12, w - .12, y + .001, .12, H - .12, '#2a3448'); qy(.12, w - .12, y + .002, .12, .5, '#3a4458');
    for (let x = .3; x < w - .5; x += 1.5) { qy(x, x + 1.2, y + .003, 1.05, 1.95, '#6a5440'); for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) { qy(x + .04 + i * .195, x + .2 + i * .195, y + .004, 1.09 + j * .215, 1.27 + j * .215, '#3a2c22'); if ((i * 7 + j * 3 + Math.round(x * 2)) % 3) lw([x + .07 + i * .195, y + .005, 1.12 + j * .215], [x + .17 + i * .195, y + .005, 1.2 + j * .215], '#f4f0e8'); } }
    qy(.12, w - .12, y + .004, .62, .78, '#22262e'); for (let x = .2 + (f % 4) * .1; x < w - .2; x += .4) lw([x, y + .005, .64], [x + .08, y + .005, .76], '#4a5060');
    for (let k = 0; k < Math.floor(w / 1.4); k++) { const x = .3 + ((k * 1.4 + f * .35) % (w - .9)), c = [KRAFT, '#f4f0e8', KRAFT_D, '#cfe9f4'][k % 4], hh = [.26, .1, .32, .14][k % 4]; qy(x, x + .34, y + .006, .78, .78 + hh, c); if (hh > .2) lw([x + .17, y + .007, .78], [x + .17, y + .007, .78 + hh], LINEN); }
    bust(1.3, y + .008, .3, { top: PBLUE, hat: PBLUE_D, skin: '#c88a60' }); if (w > 4) bust(w - 1.6, y + .008, .3, { top: PBLUE, hair: '#d8d8dc', skin: '#f0c8a8', glasses: 1 }); if (w > 5) bust(w / 2 + .2, y + .008, .28, { top: PBLUE_L, hat: PBLUE_D, skin: '#8a5a3a' });
    for (const x of [.5, w * .55]) lw([x, y + .009, .3], [x + .5, y + .009, 1.9], '#8fa8c8'); });
  for (let x = w / 3; x < w - .2; x += w / 3) qy(x - .04, x + .04, y + .01, .12, H - .12, OAK_D); qy(0, w, y + .01, 0, .12, OAK); qy(0, w, y + .01, H - .12, H, OAK); plaque('SORTING FLOOR', w / 2 - 1.8, w / 2 + 1.8, y + .012, H + .04, H + .5);
}
function conveyor(p) {
  const w = p.w || 8, f = p.f || 0; for (let x = .2; x < w; x += 1.2) { lw([x, .1, 0], [x, .1, .7], STEEL_D); lw([x, .8, 0], [x, .8, .7], STEEL_D); }
  box(0, 0, .66, w, .9, .12, STEEL_D, { ol: true }); qz(.04, w - .04, .08, .82, .785, '#2a2c34'); for (let x = .1 + (f % 4) * .15; x < w - .1; x += .6) { lw([x, .12, .786], [x + .12, .45, .786], '#4a4e5a'); lw([x + .12, .45, .786], [x, .78, .786], '#4a4e5a'); }
  lw([0, .9, .78], [w, .9, .78], PYEL); qy(0, w, .9, .66, .7, INK); for (let x = .1; x < w; x += .5) qy(x, x + .25, .901, .66, .7, PYEL);
}
function bin(p) {
  const c = p.c || CANVAS, n = p.n || 0; for (const [x, y] of [[.1, .1], [1.1, .1], [.1, .9], [1.1, .9]]) cyl(x, y, 0, .07, .12, INK, { ol: false });
  box(0, 0, .12, 1.2, 1, .8, c, { l: dk(c, .12), r: dk(c, .26) }); lw([0, 1, .92], [1.2, 1, .92], PBLUE); lw([1.2, 0, .92], [1.2, 1, .92], PBLUE_D); qz(.06, 1.14, .06, .94, .9, dk(c, .45));
  if (n > 0) parcel(.15, .5, .78, .5, .36, .22); if (n > 1) { qz(.7, 1.08, .3, .6, .93, LINEN); parcel(.62, .12, .8, .42, .3, .2, KRAFT_D); } if (n > 2) parcel(.3, .2, .92, .46, .34, .24);
  qy(.12, 1.08, 1.001, .34, .68, LINEN); ctext(p.t || 'BAY', .12, 1.08, 1.002, .64, PBLUE_D);
}
function pigeon(p) {
  const w = p.w || 3, r = rng(p.seed || 5); box(0, 0, 0, w, .5, 2.2, OAK_D, { ol: true }); qy(.06, w - .06, .501, .5, 2.14, dk(OAK_D, .35));
  for (let j = 0; j < 5; j++) for (let i = 0; i < Math.floor((w - .12) / .3); i++) { const x = .08 + i * .3, z = .54 + j * .32; qy(x, x + .27, .502, z, z + .28, '#3a2c24'); const k = Math.floor(r() * 4); for (let q = 0; q < k; q++) lw([x + .04, .503, z + .04 + q * .06], [x + .23, .503, z + .08 + q * .06], q % 2 ? '#e8e0cc' : '#ffffff'); }
  qy(.06, w - .06, .502, .08, .44, OAK); for (let x = .2; x < w - .3; x += .7) qy(x, x + .5, .503, .16, .36, BRASS_D);
}
function dock(p) {
  const st = p.st || 0, y = .1; qy(0, 4, y, 0, 3.1, '#6a6e78'); qy(.2, 3.8, y + .001, 0, 2.7, st ? '#9ac8e8' : '#8a8f9a');
  if (!st) { for (let z = .1; z < 2.7; z += .14) lw([.2, y + .002, z], [3.8, y + .002, z], '#6a7078'); lit(() => ctext('BAY 1', 1.2, 2.8, y + .003, 1.6, '#f4f0e8')); }
  else { lit(() => { qy(.2, 3.8, y + .002, 0, .7, '#8a8a90'); qy(.2, 3.8, y + .002, .7, .78, '#c8c4b8'); if (st === 1) { for (const [x, h] of [[.5, 1.2], [1.4, .8], [2.6, 1.5], [3.2, 1]]) qy(x, x + .5, y + .003, .78, .78 + h, '#b8a898'); }
    if (st === 2) { qy(.7, 3.3, y + .004, .3, 2.45, PBLUE); qy(.7, 3.3, y + .005, .3, .5, '#2a2c34'); lw([2, y + .006, .5], [2, y + .006, 2.45], PBLUE_D); qy(.85, 1.9, y + .006, 1.5, 2.3, PBLUE_D); qy(2.1, 3.15, y + .006, 1.5, 2.3, PBLUE_D); qy(.7, 3.3, y + .006, 1.2, 1.32, LINEN); hornAt(1.38, y + .007, 1.0, PYEL); hornAt(2.62, y + .007, 1.0, PYEL); qy(.74, .9, y + .007, .55, .75, '#ff5a4a'); qy(3.1, 3.26, y + .007, .55, .75, '#ff5a4a'); dot(1.9, y + .007, 1.3, BRASS); dot(2.1, y + .007, 1.3, BRASS); } });
    qy(.2, 3.8, y + .008, 2.45, 2.7, '#8a8f9a'); lw([.2, y + .009, 2.52], [3.8, y + .009, 2.52], '#6a7078'); }
  for (let x = 0; x < 4; x += .4) { qy(x, x + .2, y + .01, 2.7, 2.86, PYEL); qy(x + .2, x + .4, y + .01, 2.7, 2.86, INK); } for (const x of [0, 3.8]) for (let z = 0; z < 2.7; z += .4) { qy(x, x + .2, y + .01, z, z + .2, PYEL); qy(x, x + .2, y + .01, z + .2, z + .4, INK); }
  lit(() => { dot(2, y + .011, 3.0, st === 2 ? '#6fe08a' : st === 1 ? PYEL : '#ff5a4a', 2); });
}
function trolley(p) {
  const n = p.n === undefined ? 2 : p.n; for (const [x, y] of [[.12, .1], [.88, .1], [.12, .5], [.88, .5]]) cyl(x, y, 0, .08, .1, INK, { ol: false });
  box(.04, .04, .1, .92, .52, .06, PBLUE_D); box(.08, .06, .16, .84, .48, .56, CANVAS, { l: dk(CANVAS, .1), r: dk(CANVAS, .25) }); qz(.12, .88, .1, .5, .7, dk(CANVAS, .45)); qy(.2, .8, .541, .3, .56, PBLUE); hornAt(.5, .542, .44, PYEL);
  if (n > 0) for (let i = 0; i < 5; i++) envelope(.14 + i * .14, .3 + (i % 2) * .08, .64 + (i % 3) * .03, .2, .16, i % 2 ? LINEN : '#f6e2a8'); if (n > 1) parcel(.3, .12, .68, .4, .3, .22);
  lw([.04, .04, .16], [.04, .04, 1.05], STEEL); lw([.04, .56, .16], [.04, .56, 1.05], STEEL); lw([.04, .04, 1.05], [.04, .56, 1.05], STEEL_D);
}
function sacks(p) { const r = rng(p.seed || 2); for (const [x, y, z, s] of [[.05, .1, 0, .34], [.55, .05, 0, .36], [.3, .4, 0, .32], [.32, .12, .42, .3]]) { ball(x + s, y + s * .8, z + s * .8, s, CANVAS, { squash: .85, ol: true }); const q = S2(x + s, y + s * 1.6, z + s * .8); for (let i = -4; i <= 4; i++) px(q[0] + i, q[1] + (i >> 2), C(PBLUE)); cyl(x + s, y + s * .8, z + s * 1.55, .07, .12, CANVAS_D, { ol: false }); } if (r() < 2) hornAt(.9, .9, .4, PBLUE_D); }
function stampcase() {
  const W = 2.6; box(0, 0, 0, W, .9, .9, OAK, { l: PAT.planks(dk(OAK, .1), 7), r: PAT.planks(dk(OAK, .3), 7) }); box(-.03, -.03, .9, W + .06, .96, .06, BRASS_D); qz(.06, W - .06, .06, .84, .965, '#cfe9f4');
  const cols = ['#c8402e', '#2f8a6a', '#3b6fd0', '#e8b63a', '#8a5cc2', '#2f9a94', '#e0703a', '#5a7ad8']; for (let i = 0; i < 9; i++) for (let j = 0; j < 3; j++) qz(.14 + i * .26, .34 + i * .26, .14 + j * .24, .32 + j * .24, .967, cols[(i * 3 + j) % 8], LINEN);
  lw([.1, .86, .97], [W - .1, .86, .97], '#ffffff'); signY('STAMPS', .6, 2, .91, .3, .72, PBLUE, PYEL); lw([2.4, .2, .96], [2.4, .2, 1.5], BRASS); lw([2.4, .2, 1.5], [2.1, .5, 1.25], BRASS); { const q = S2(2.05, .55, 1.2); ellipse(q[0], q[1], 4, 4, BRASS); ellipse(q[0], q[1], 2, 2, '#cfe9f4'); }
  box(.2, .1, .96, .6, .4, .04, '#7a2030', { ol: true }); qz(.24, .76, .14, .46, 1.0, LINEN); for (let i = 0; i < 3; i++) qz(.28 + i * .16, .4 + i * .16, .2, .4, 1.002, cols[i + 2]);
}
function clock(p) { const y = .08; clockY(.5, y, .5, .44, p.h === undefined ? 10 : p.h, p.m === undefined ? 10 : p.m, BRASS); }
function sign(p) { const w = p.w || 2.4, c = p.c || PBLUE, fg = p.fg || LINEN, h = p.t2 ? .96 : .52, y = .08; qy(0, w, y, 0, h, c); lw([0, y, h], [w, y, h], lt(c, .35)); lw([0, y, 0], [w, y, 0], dk(c, .4)); lit(() => { ctext(p.t || 'POST', 0, w, y + .001, h - .1, fg); if (p.t2) ctext(p.t2, 0, w, y + .001, .4, p.fg2 || PYEL); }); }
function bcounter(p) {
  const w = p.w || 3, c = p.c || OAK; counter(w, .9, 1.05, c, p.top || MARBLE); signY(p.name || 'POST', .2, w - .2, .91, .4, .82, p.bg || PBLUE, p.ink || LINEN, { frame: false }); lw([.2, .91, .4], [w - .2, .91, .4], BRASS); lw([.2, .91, .82], [w - .2, .91, .82], BRASS);
  // brass grille at the left end, bell, scale at the right
  for (let x = .1; x < .95; x += .14) lw([x, .5, 1.12], [x, .5, 1.9], x % .28 < .14 ? BRASS : BRASS_D); lw([.08, .5, 1.9], [.98, .5, 1.9], BRASS_L); lw([.08, .5, 1.5], [.98, .5, 1.5], BRASS);
  { const q = S2(1.25, .62, 1.2); ellipse(q[0], q[1], 3, 2, BRASS); px(q[0], q[1] - 2, C(BRASS_L)); px(q[0], q[1] - 3, C(INK)); }
  box(w - .85, .5, 1.12, .7, .34, .1, '#e8e4dc'); box(w - .8, .53, 1.22, .6, .28, .04, BRASS, { ol: false }); lit(() => { qy(w - .82, w - .2, .841, 1.13, 1.21, '#10141c'); const s = S2(w - .76, .842, 1.2); R.textS((p.kg || 0).toFixed(1), s[0], s[1], '#6fe08a'); }); if (p.parcel) parcel(w - .73, .56, 1.26, .46, .22, .3);
  if (p.jars) for (let i = 0; i < 3; i++) { cyl(1.6 + i * .28, .3, 1.12, .1, .26, ['#f28fb0', '#f2c230', '#8fdcb4'][i], { ol: false }); cyl(1.6 + i * .28, .3, 1.38, .08, .05, PRED, { ol: false }); }
  if (p.cat) { ball(1.75, .7, 1.2, .16, '#d8924a', { squash: .7, ol: true }); ball(1.93, .72, 1.24, .1, '#d8924a', { ol: true }); const q = S2(1.97, .8, 1.3); px(q[0] - 2, q[1] - 3, C('#a86a2e')); px(q[0] + 2, q[1] - 2, C('#a86a2e')); lw([1.6, .78, 1.14], [1.5, .84, 1.16], '#a86a2e'); }
}
function slots() { const W = 1.5; box(0, 0, 0, W, .5, 1.5, PBLUE, { l: PBLUE, r: PBLUE_D }); box(-.04, -.04, 1.5, W + .08, .58, .08, PBLUE_D); for (let i = 0; i < 3; i++) { qy(.1, W - .1, .501, 1.02 - i * .44, 1.08 - i * .44, INK); lit(() => ctext(['LOCAL', 'AWAY', 'AIR'][i], 0, W, .502, 1.44 - i * .44, PYEL)); } hornAt(W / 2, .26, 1.6, PYEL); }
function photowall(p) {
  const y = .08, W = 3; qy(0, W, y, 0, 1.6, OAK_D); qy(.06, W - .06, y + .001, .06, 1.2, '#2f5a4a'); plaque('OUR FRIENDS', .1, W - .1, y + .002, 1.22, 1.58);
  const who = [{ skin: '#c88a60', top: PBLUE, hat: PBLUE_D }, { skin: '#f0c8a8', top: '#7a2030', hair: '#d8d8dc', glasses: 1 }, null, { skin: '#8a5a3a', top: '#2a2733', hair: '#2a2733' }, { skin: '#e8b890', top: '#b8862e', hair: '#a85a2a', hat: '#5a4030' }];
  who.forEach((o, i) => { const x = .34 + i * .58, me = i === 2; if (me && !p.me) { qy(x - .22, x + .22, y + .003, .2, 1.04, dk('#2f5a4a', .2)); ctext('?', x - .2, x + .2, y + .004, .78, '#7aa890'); return; }
    frame(x - .24, x + .24, y + .003, .16, 1.08, me ? BRASS_L : BRASS, .05); qy(x - .19, x + .19, y + .004, .21, 1.03, me ? '#cfe9f4' : '#d8c8a8'); bust(x, y + .005, .22, me ? Object.assign({ skin: '#e8b890', top: '#c8402e', hair: '#4a3022' }, p.look) : o); if (me) lit(() => dot(x + .2, y + .006, 1.04, PYEL, 2)); });
}
function basket(p) {
  const n = p.n || 0; box(0, 0, 0, .6, .4, .26, '#8a6a4a', { ol: true }); qz(.04, .56, .04, .36, .24, '#5a4030'); for (let x = .08; x < .6; x += .1) lw([x, .4, 0], [x, .4, .26], '#6a4e34');
  for (let i = 0; i < Math.min(4, n); i++) envelope(.06 + i * .11, .14 + (i % 2) * .1, .2 + (i % 2) * .05, .26, .2, ['#ffffff', '#f6e2a8', '#cfe9f4', '#ffffff'][i]); if (p.slip) qy(.3, .54, .34, .22, .4, PINK);
  if (n) lit(() => dot(.52, .4, .3, PRED, 2));
}
function telegraph(p) {
  for (const [x, y] of [[.06, .06], [.84, .06], [.06, .54], [.84, .54]]) lw([x, y, 0], [x, y, .8], OAK_D); box(0, 0, .78, .9, .6, .06, OAK, { ol: true }); box(.1, .15, .84, .5, .3, .04, '#2a2733', { ol: false }); lw([.2, .3, .88], [.5, .3, .94], BRASS_L); dot(.52, .3, .96, INK, 2); cyl(.25, .3, .88, .05, .08, BRASS, { ol: false });
  cyl(.74, .2, .84, .09, .2, '#8fc8d8', { ol: true }); cyl(.72, .46, .84, .1, .04, LINEN, { ol: false }); lw([.72, .46, .88], [.9, .56, .5], LINEN); lit(() => dot(.14, .44, .9, p.on ? '#6fe08a' : '#5a2a2a', 2));
}
function bottlerack() { box(0, 0, 0, 1.4, .4, .1, OAK_D); for (const z of [.1, .62]) { box(0, .05, z + .4, 1.4, .3, .05, OAK, { ol: false }); for (let i = 0; i < 5; i++) { const x = .16 + i * .27, c = ['#3f8a55', '#5aa0a8', '#3f8a55', '#8a6a3a', '#5aa0a8'][(i + (z > .3 ? 2 : 0)) % 5]; cyl(x, .2, z + (z > .3 ? .45 : 0), .08, .26, c, { ol: false }); cyl(x, .2, z + (z > .3 ? .45 : 0) + .26, .035, .1, c, { ol: false }); dot(x, .2, z + (z > .3 ? .45 : 0) + .38, '#c89a5a'); if (i % 2) qy(x - .04, x + .04, .281, z + (z > .3 ? .5 : .05), z + (z > .3 ? .62 : .17), LINEN); } }
  for (const x of [.03, 1.37]) lw([x, .2, 0], [x, .2, 1.35], OAK_D); signY('BOTTLES', -.3, 1.7, .2, 1.36, 1.72, '#2f6a7a', LINEN); }
function keeperbox() { box(0, 0, 0, .7, .5, 1.1, PRED, { l: PRED, r: dk(PRED, .25) }); box(-.04, -.04, 1.1, .78, .58, .1, dk(PRED, .3)); qy(.12, .58, .501, .82, .9, INK); qy(.1, .6, .501, .16, .7, LINEN); { const q = S2(.35, .502, .2); for (let j = 0; j < 7; j++) for (let i = -1 - (j > 4 ? 1 : 0); i <= 1 + (j > 4 ? 1 : 0); i++) px(q[0] + i, q[1] - j + (i >> 1), C(j % 2 ? PRED : '#f4f0e8')); px(q[0], q[1] - 7, C(PYEL)); px(q[0], q[1] - 8, C(PYEL)); } lit(() => { const q = S2(.35, .502, .7); px(q[0] - 3, q[1] - 1, C('#ffe9a0')); px(q[0] + 3, q[1] + 1, C('#ffe9a0')); }); signY('KEEPER', -.5, 1.2, .26, 1.3, 1.66, '#22304e', PYEL); lw([.35, .26, 1.2], [.35, .26, 1.3], STEEL_D); }
function cardrack(p) { const r = rng(p.seed || 4); cyl(.35, .35, 0, .3, .08, STEEL_D); lw([.35, .35, .08], [.35, .35, 1.7], STEEL); for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) { const c = ['#6fb3e0', '#f08a2c', '#2f9e44', '#e0608e', '#f2c230', '#8a5cc2', '#2fa3a0', '#e05a3a'][Math.floor(r() * 8)], x = .04 + i * .22, z = .3 + j * .28; qy(x, x + .2, .62, z, z + .24, c); qy(x, x + .2, .621, z, z + .08, lt(c, .5)); } for (let j = 0; j < 5; j++) { const z = .3 + j * .28; qx(.68, .12, .32, z, z + .24, ['#3b5bdb', '#e8b63a', '#2f9a94', '#c8402e', '#5fb84f'][j]); qx(.68, .36, .56, z, z + .24, ['#f28fb0', '#6fb3e0', '#f08a2c', '#8a5cc2', '#f2c230'][j]); } cyl(.35, .35, 1.7, .12, .06, PBLUE); }
function citymap() { const y = .08, W = 3.2, H = 2; qy(0, W, y, 0, H, OAK_D); lit(() => { qy(.08, W - .08, y + .001, .08, H - .08, '#e8dcc0'); qy(.08, 1.2, y + .002, .08, .7, '#8fc8e8'); qy(.08, W - .08, y + .002, .08, .3, '#8fc8e8'); qy(1.38, 1.5, y + .002, .3, H - .08, '#8fc8e8');
    for (const [x0, x1, z0, z1, c] of [[1.7, 2.5, .9, 1.5, '#c8cfe0'], [.5, 1.2, .9, 1.4, '#e0b8a0'], [.4, 1.25, 1.5, 1.86, '#d8c8e8'], [2.6, 3.05, .8, 1.5, '#c8e0b8'], [1.7, 2.4, 1.6, 1.86, '#f0d8a0'], [.6, 1.3, .4, .8, '#b8d8d8'], [1.7, 2.3, .4, .8, '#c8c0b0'], [.75, 1.3, 1.02, 1.32, '#a8d898']]) qy(x0, x1, y + .003, z0, z1, c);
    for (const z of [.86, 1.55]) lw([.4, y + .004, z], [W - .2, y + .004, z], '#ffffff'); for (const x of [1.6, 2.55]) lw([x, y + .004, .35], [x, y + .004, H - .15], '#ffffff'); lw([.3, y + .004, .36], [3, y + .004, .36], PRED); lw([.3, y + .004, 1.9], [3, y + .004, 1.9], PRED); lw([.3, y + .004, .36], [.3, y + .004, 1.9], PRED); lw([3, y + .004, .36], [3, y + .004, 1.9], PRED);
    dot(1.8, y + .005, 1.1, PRED, 2); }); plaque('MAPLE BAY', W / 2 - .9, W / 2 + .9, y + .006, H + .02, H + .44); }
function backdrop() { const y = .08, W = 3.8, H = 2.3; qy(0, W, y, 0, H, '#6fb3e0'); qy(0, W, y + .001, 0, .5, '#3a8ab8'); for (const [x, w, h, c] of [[.2, .3, .9, '#8a94a8'], [.55, .25, 1.3, '#a0a8b8'], [.85, .35, .7, '#787f94'], [1.3, .2, 1.1, '#8a94a8'], [2.0, .3, .8, '#a0a8b8'], [2.6, .4, 1.2, '#8a94a8'], [3.1, .3, .7, '#787f94']]) qy(x, x + w, y + .002, .5, .5 + h, c);
  qy(1.62, 1.78, y + .003, .5, 1.5, '#f4f0e8'); for (const z of [.7, 1.0, 1.3]) qy(1.62, 1.78, y + .004, z, z + .12, PRED); qy(1.58, 1.82, y + .004, 1.5, 1.62, INK); lit(() => { qy(1.64, 1.76, y + .005, 1.52, 1.6, '#ffe9a0'); ctext('GREETINGS FROM', 0, W, y + .005, 2.2, '#ffffff'); ctext('MAPLE BAY', 0, W, y + .005, 1.9, PYEL); }); for (const x of [0, W - .06]) qy(x, x + .06, y + .006, 0, H, OAK_D); }
function camera() { for (const [x, y] of [[.05, .1], [.45, .1], [.25, .45]]) lw([x, y, 0], [.25, .25, 1.1], STEEL_D); box(.08, .14, 1.1, .34, .24, .26, INK); cyl(.25, .42, 1.18, .08, .1, '#3a3a48', { ol: false }); { const q = S2(.25, .4, 1.24); ellipse(q[0], q[1] + 2, 3, 3, '#6a8ab8'); } lit(() => dot(.38, .38, 1.34, '#ff5a4a')); }
function tideboard() { const y = .08, W = 2.9, H = 1.5; qy(0, W, y, 0, H, '#22304e'); lw([0, y, H], [W, y, H], BRASS); lit(() => { ctext('TIDES', 0, W, y + .001, 1.42, PYEL); textY('HW 06:12', .12, y + .001, 1.06, '#f4f0e8'); textY('LW 12:40', .12, y + .001, .72, '#f4f0e8'); textY('BOAT 10:00', .12, y + .001, .38, '#8fe0e4'); }); }
function lifering() { const q = S2(.45, .08, .45); for (let j = -7; j <= 7; j++) for (let i = -7; i <= 7; i++) { const d = i * i + j * j; if (d <= 52 && d >= 14) px(q[0] + i, q[1] + j + (i >> 1), C((Math.atan2(j, i) + 3.2) % 1.57 < .5 ? PRED : '#f4f0e8')); } }
function rocker() { for (const y of [.12, .68]) { lw([.0, y, .04], [.9, y, .04], OAK_D); lw([.16, y, .04], [.16, y, .5], OAK); lw([.7, y, .04], [.7, y, 1.25], OAK); lw([.16, y, .5], [.7, y, .5], OAK); lw([.2, y, .72], [.7, y, .72], OAK_D); } box(.14, .12, .46, .58, .58, .08, '#c8402e'); box(.66, .14, .54, .08, .54, .68, OAK, { ol: true }); for (let z = .62; z < 1.2; z += .16) lw([.74, .16, z], [.74, .66, z], OAK_D); ball(.42, .4, .58, .13, '#f2c230', { ol: false }); }
function fairtable(p) { const r = rng(p.seed || 3); box(0, 0, 0, 2, .8, .8, '#2f5a4a', { l: '#2f5a4a', r: dk('#2f5a4a', .25) }); qz(0, 2, 0, .8, .8, '#3a6a58'); for (let i = 0; i < 4; i++) { const x = .1 + i * .48, c = ['#7a2030', '#22304e', '#8a5a34', '#4a3a5a'][i]; box(x, .15, .8, .38, .5, .05, c, { ol: false }); qz(x + .03, x + .35, .18, .62, .852, LINEN); for (let k = 0; k < 6; k++) qz(x + .05 + (k % 3) * .1, x + .13 + (k % 3) * .1, .22 + Math.floor(k / 3) * .2, .36 + Math.floor(k / 3) * .2, .854, ['#c8402e', '#3b6fd0', '#e8b63a', '#2f8a6a', '#8a5cc2', '#e0703a'][Math.floor(r() * 6)]); } signY(p.t || 'STAMPS', .4, 1.6, .801, .2, .58, PYEL, INK); }
function cabinet(p) { const W = 3.2; box(0, 0, 0, W, .5, 1.9, OAK, { l: PAT.planks(dk(OAK, .1), 7) }); qy(.1, W - .1, .501, .5, 1.5, '#cfe0e8'); qy(W / 2 - .02, W / 2 + .02, .502, .5, 1.5, OAK_D); for (let j = 0; j < 3; j++) for (let i = 0; i < 9; i++) { if (p.gone && j === 1 && i === 1) { qy(.2 + i * .33, .44 + i * .33, .503, .6 + j * .3, .78 + j * .3, '#9ab0b8'); continue; } envelope(.18 + i * .33, .503, .58 + j * .3, .28, .2, ['#f6e8c8', '#e8dcc0', '#f0e0b8'][(i + j) % 3]); }
  qy(.1, W - .1, .501, .1, .42, dk(OAK, .2)); dot(1.5, .502, .26, BRASS, 2); dot(1.7, .502, .26, BRASS, 2); plaque('DEAD LETTERS', .05, W - .05, .502, 1.52, 1.88); }
function rail(p) { const w = p.w || 4; railX(0, w, .1, 0, .85, BRASS); }

const T = ['postoffice'];
const A = (id, tags, size, draw, x) => Object.assign({ id: 'furn.postoffice.' + id, kind: 'furniture', tags: T.concat(tags), size, draw, variants: [{}] }, x);
const WALL = { wall: true, mount: 0, solid: false };
export default [
  A('boxwall', ['post_boxes'], p => [p.w || 6, .15, .3 + (p.rows || 5) * .4 + .62], boxwall, Object.assign({ use: p => ({ x: (p.w || 6) / 2, y: .7 }), variants: [{}, { w: 3, rows: 4, mine: 9, has: 1 }] }, WALL)),
  A('window', ['post_window'], [3, .9, 2.9], win, { vb: [-.1, -.1, 0, 3.1, 1, 3], use: { x: 1.5, y: 1.5 }, staff: { x: 1.5, y: -.45, dir: 1 }, variants: [{ n: 1, short: 'LETTERS', name: 'STAMPS' }, { n: 2, short: 'PARCELS', name: 'PARCELS', kg: 1.4, parcel: 1 }, { n: 3, short: 'COLLECT', name: 'COLLECT', shut: 1 }] }),
  A('desk', ['post_desk'], [2.4, .95, 1.6], desk, { vb: [-.1, -.1, 0, 2.5, 1.1, 2], use: { x: 1.2, y: 1.4 } }),
  A('packtable', ['post_pack'], [2.6, 1.1, .94], packtable, { vb: [-.1, -.2, 0, 2.7, 1.2, 1.95], use: { x: 1.3, y: 1.55 } }),
  A('sortglass', ['post_glass'], p => [p.w || 6, .15, 2.2], sortglass, Object.assign({ vb: p => [0, 0, 0, p.w || 6, .3, 2.8], use: p => ({ x: (p.w || 6) / 2, y: .8 }), variants: [{ f: 0 }, { f: 2, w: 4 }] }, WALL, { mount: .7 })),
  A('conveyor', ['decor'], p => [p.w || 8, .9, .8], conveyor, { variants: [{ f: 0 }, { f: 2, w: 5 }] }),
  A('bin', ['post_bin'], [1.2, 1, .95], bin, { vb: [-.05, -.05, 0, 1.3, 1.1, 1.3], variants: [{ t: 'HARBOR', n: 2 }, { t: 'OLD TOWN', n: 3 }, { t: 'AWAY', n: 0 }] }),
  A('pigeon', ['decor'], p => [p.w || 3, .5, 2.2], pigeon, { variants: [{}, { w: 2, seed: 9 }] }),
  A('dock', ['decor'], [4, .15, 3.1], dock, Object.assign({ variants: [{ st: 0 }, { st: 1 }, { st: 2 }] }, WALL)),
  A('trolley', ['decor'], [1, .6, 1.05], trolley, { vb: [-.1, -.1, 0, 1.1, .7, 1.2], solid: false, variants: [{}, { n: 0 }] }),
  A('sacks', ['decor'], [1.2, .9, .9], sacks, { vb: [-.1, -.1, 0, 1.4, 1.1, 1.1] }),
  A('stampcase', ['post_stamps'], [2.6, .9, .96], stampcase, { vb: [-.1, -.1, 0, 2.7, 1, 1.7], use: { x: 1.3, y: 1.45 }, staff: { x: 1.3, y: -.45, dir: 1 } }),
  A('clock', ['decor'], [1, .1, 1], clock, Object.assign({ vb: [-.1, 0, -.3, 1.2, .2, 1.2], variants: [{ h: 10, m: 10 }, { h: 3, m: 45 }] }, WALL, { mount: 2.4 })),
  A('sign', ['decor'], p => [p.w || 2.4, .1, p.t2 ? .96 : .52], sign, Object.assign({ variants: [{ t: 'POST' }, { t: 'MAPLE BAY POST', t2: 'EST. 1898', w: 4 }, { t: 'TELEGRAMS', c: '#2f5a4a', w: 3 }] }, WALL, { mount: 2.6 })),
  A('counter', ['post_counter'], p => [p.w || 3, .9, 1.9], bcounter, { vb: p => [-.1, -.1, 0, (p.w || 3) + .1, 1, 2], use: p => ({ x: (p.w || 3) / 2, y: 1.5 }), staff: p => ({ x: (p.w || 3) / 2, y: -.45, dir: 1 }), variants: [{}, { c: '#8a4a3a', name: 'MAPLEWOOD', cat: 1, jars: 1 }, { c: '#3a4a5a', name: 'MAIL BOAT', bg: '#22304e', kg: 2.3, parcel: 1 }] }),
  A('slots', ['post_slot'], [1.5, .5, 1.58], slots, { vb: [-.1, -.1, 0, 1.6, .7, 1.9], use: { x: .75, y: 1 } }),
  A('photowall', ['post_wall'], [3, .1, 1.6], photowall, Object.assign({ use: { x: 1.5, y: .7 }, variants: [{}, { me: 1 }] }, WALL, { mount: 1 })),
  A('basket', ['post_home'], [.6, .4, .3], basket, { vb: [-.1, -.1, 0, .7, .6, .6], solid: false, use: { x: .3, y: .8 }, variants: [{}, { n: 3, slip: 1 }] }),
  A('telegraph', ['post_telegraph'], [.9, .6, 1.1], telegraph, { vb: [-.1, -.1, 0, 1, .7, 1.2], use: { x: .45, y: 1.05 }, variants: [{}, { on: 1 }] }),
  A('bottlerack', ['post_bottle'], [1.4, .4, 1.4], bottlerack, { vb: [-.4, -.1, 0, 1.8, .5, 1.8], use: { x: .7, y: .9 } }),
  A('keeperbox', ['post_keeper'], [.7, .5, 1.2], keeperbox, { vb: [-.6, -.1, 0, 1.3, .7, 1.75], use: { x: .35, y: 1 } }),
  A('cardrack', ['post_cards'], [.7, .7, 1.76], cardrack, { use: { x: .35, y: 1.2 }, variants: [{}, { seed: 9 }] }),
  A('citymap', ['post_map'], [3.2, .1, 2.5], citymap, Object.assign({ use: { x: 1.6, y: .7 } }, WALL, { mount: .7 })),
  A('backdrop', ['post_photo'], [3.8, .1, 2.3], backdrop, Object.assign({ use: { x: 1.9, y: .9 } }, WALL, { mount: .2 })),
  A('camera', ['decor'], [.5, .5, 1.4], camera, { solid: false }),
  A('tideboard', ['post_tide'], [2.9, .1, 1.5], tideboard, Object.assign({ use: { x: 1.45, y: .7 } }, WALL, { mount: 1.1 })),
  A('lifering', ['decor'], [.9, .1, .9], lifering, Object.assign({ vb: [-.1, 0, -.3, 1.1, .2, 1.1] }, WALL, { mount: 1.5 })),
  A('rocker', ['seat'], [.9, .8, 1.25], rocker, { seats: [{ x: .42, y: .4, z: .54, dir: 2 }], use: { x: -.4, y: .4 } }),
  A('fairtable', ['post_fair'], [2, .8, .86], fairtable, { use: { x: 1, y: 1.3 }, staff: { x: 1, y: -.4, dir: 1 }, variants: [{}, { seed: 8, t: 'ALBUMS' }] }),
  A('cabinet', ['post_dead'], [3.2, .5, 1.9], cabinet, { use: { x: 1.6, y: 1 }, variants: [{}, { gone: 1 }] }),
  A('rail', ['decor'], p => [p.w || 4, .2, .9], rail, { variants: [{}] }),
  A('parcelbox', ['decor'], [.45, .4, .35], p => { const k = p.k || 0; if (k === 1) envelope(.05, .2, .1, .34, .24); else parcel(0, 0, 0, k === 2 ? .34 : .45, k === 2 ? .3 : .4, k === 2 ? .24 : .35, k === 2 ? KRAFT_D : KRAFT); }, { solid: false, vb: [-.1, -.1, 0, .6, .6, .5], variants: [{ k: 0 }, { k: 1 }, { k: 2 }] }),
];
