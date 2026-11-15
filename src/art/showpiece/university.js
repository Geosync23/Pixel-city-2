// Maple Bay University — interior art for University Hall. ids furn.uni.*
//   lecrow {n, c}       lecture bench with a writing ledge (seats face the board)       chalk {w, k 0-3}   wall chalkboard with chalk work
//   screenframe {w}     the wall frame of the lecture screen (the picture is a live canvas drawn by the room)
//   counter {w, t, t2}  oak office counter with brass grilles (Registrar / Bursar)       crestwall         the big crest + motto
//   portrait {k 0-5}    past deans in gowns        trophy   glass cabinet of cups        bust             the Founder on a pedestal
//   carrel {c}          study desk with a green lamp (seat faces the wall)               labbench {k 0-2}  microscope / flasks / tank
//   stilllife           plinth with a bowl of fruit and a jug (the art class draws it)   workbench        vice, pegboard, tools
//   pinboard {k: 'time'|'clubs'|'work'|'exam', n}  wall board        cafesign {t}        window {night}    tall arched window        pennants {w}
//   gowns               rail of graduation gowns   stage {w, d}     low dais             demo              the teaching kitchen's demo counter with a mirror
import { R, NAVY, NAVY_D, NAVY_L, GOLD, GOLD_D, GOLD_L, BRICK, STONE, STONE_D, OAK, OAK_D, OAK_L, WALNUT, CREAM, PAPER, INK, CHALK, CHALK_D, CHALKW, GREEN, GREEN_L, LAMP, RED, IRON, BRONZE, BRONZE_L, STEEL, STEEL_D, POSTER, S2, dot, ctext, crestY, books, post, frameY, sheet, wallPut } from './_uni_lib.js';
const { box, qy, qx, qz, fq, lw, cyl, ball, cone, dk, lt, mix, glow, lit, px, C, PAT, rng, textY, textW, hash2 } = R;

function lecrow(p) {
  const n = p.n || 5, w = n * .7, c = p.c || OAK;
  /* writing ledge (toward the board) */
  box(0, .05, 0, w, .12, .72, dk(c, .12), { ol: false }); box(-.02, 0, .72, w + .04, .42, .07, lt(c, .08));
  for (let i = 0; i < n; i++) if ((i * 7 + n) % 3 !== 1) { const x = i * .7 + .2; qz(x, x + .3, .1, .32, .795, i % 2 ? PAPER : '#e8f0ff'); if (i % 4 === 0) dot(x + .36, .2, .8, RED, 0, 0); }
  /* bench */
  box(0, .62, 0, w, .42, .45, c, { t: lt(c, .12) });
  for (let i = 0; i <= n; i++) lw([i * .7, 1.04, .1], [i * .7, 1.04, .45], dk(c, .35));
  box(0, 1.0, .45, w, .08, .42, dk(c, .08), { t: lt(c, .1) });
}
const CH = (put, pts, c) => { for (let i = 0; i < pts.length - 1; i++) { const [a, b] = pts[i], [d, e] = pts[i + 1], n = Math.max(Math.abs(d - a), Math.abs(e - b), 1); for (let k = 0; k <= n; k++) put(Math.round(a + (d - a) * k / n), Math.round(b + (e - b) * k / n), c); } };
function chalk(p) {
  const w = p.w || 3, y = .12, k = p.k || 0, H = 1.7;
  qy(0, w, y, 0, H, OAK_D); qy(.08, w - .08, y + .005, .1, H - .08, CHALK); qy(.08, w - .08, y + .01, .1, .16, OAK_L);
  const put = wallPut(w - .16, y + .012, .18, .08), n = Math.round((w - .16) * 16), r = rng(k * 9 + 5);
  for (let i = 0; i < 26; i++) put(Math.floor(r() * n), Math.floor(r() * 22), CHALK_D);   /* old smears */
  if (k === 0) { CH(put, [[3, 4], [3, 20], [3, 4], [n - 4, 4]], CHALKW); CH(put, [[3, 5], [8, 9], [14, 15], [22, 19], [n - 6, 21]], GOLD_L); for (let i = 0; i < 4; i++) put(8 + i * 7, 3, CHALKW); }
  else if (k === 1) { for (let l = 0; l < 5; l++) CH(put, [[2, 6 + l * 3], [n - 3, 6 + l * 3]], CHALKW); for (const [x, v] of [[6, 9], [11, 12], [16, 15], [21, 12], [26, 18], [31, 9]]) if (x < n - 3) { put(x, v, GOLD_L); put(x + 1, v, GOLD_L); put(x, v + 1, GOLD_L); CH(put, [[x + 1, v], [x + 1, v + 6]], GOLD_L); } }
  else if (k === 2) { for (let l = 0; l < 6; l++) CH(put, [[3, 20 - l * 3], [3 + 6 + ((l * 13) % 17), 20 - l * 3]], l === 0 ? GOLD_L : CHALKW); CH(put, [[n - 14, 6], [n - 5, 6], [n - 5, 16], [n - 14, 16], [n - 14, 6]], '#f6b8c4'); CH(put, [[n - 14, 6], [n - 5, 16]], '#f6b8c4'); }
  else { CH(put, [[n >> 1, 4], [(n >> 1) - 8, 12], [(n >> 1) + 8, 12], [n >> 1, 4]], GOLD_L); CH(put, [[(n >> 1) - 8, 12], [(n >> 1) - 12, 20]], CHALKW); CH(put, [[(n >> 1) + 8, 12], [(n >> 1) + 12, 20]], CHALKW); CH(put, [[n >> 1, 12], [n >> 1, 20]], CHALKW); }
  box(.2, y, .02, w - .4, .1, .05, OAK_L, { ol: false }); dot(.5, y + .08, .09, CHALKW, 0, 0); dot(.56, y + .08, .09, CHALKW, 0, 0); box(w - .7, y + .02, .07, .22, .08, .06, '#6a5a48', { ol: false });
}
function screenframe(p) {
  const w = p.w || 8, H = p.h || 3.5, y = .1;
  qy(0, w, y, 0, H, WALNUT); qy(.12, w - .12, y + .004, .12, H - .12, '#1c2233');
  qy(-.1, w + .1, y, H, H + .22, OAK_D); lw([-.1, y, H + .22], [w + .1, y, H + .22], OAK_L);
  for (const x of [.5, w - .5]) { lw([x, y, H + .22], [x, y, H + .5], STEEL_D); }
}
function counter(p) {
  const w = p.w || 5, t = String(p.t || 'REGISTRAR').toUpperCase(), n = w >= 4 ? 2 : 1;
  box(0, 0, 0, w, .7, 1.05, OAK, { l: PAT.planks(OAK, 8), t: lt(OAK, .15) });
  for (let i = 0; i < n; i++) { const x0 = i * (w / n) + .25, x1 = (i + 1) * (w / n) - .25; qy(x0, x1, .701, .18, .86, dk(OAK, .14)); lw([x0, .701, .86], [x1, .701, .86], OAK_L); }
  /* brass grille frame above the counter */
  for (let i = 0; i <= n; i++) { const x = Math.min(w - .1, i * (w / n)); box(x, .25, 1.05, .1, .1, 1.35, GOLD_D, { ol: false, l: GOLD, r: dk(GOLD_D, .2) }); }
  box(0, .25, 2.4, w, .1, .42, NAVY, { ol: false, l: NAVY, t: NAVY_L }); lw([0, .35, 2.4], [w, .35, 2.4], GOLD); lw([0, .35, 2.82], [w, .35, 2.82], GOLD);
  for (let i = 0; i < n; i++) { const a = i * (w / n), b = (i + 1) * (w / n), s = i === 0 ? t : String(p.t2 || t).toUpperCase(); ctext(s, a, b, .36, 2.72, GOLD_L); for (let x = a + .3; x < b - .2; x += .22) lw([x, .3, 1.75], [x, .3, 2.4], GOLD_D); lw([a + .1, .3, 1.75], [b, .3, 1.75], GOLD); }
  /* on the desk: bell, stamp, forms, a pot of pens */
  qz(.3, .9, .1, .5, 1.055, PAPER); qz(.36, .96, .16, .56, 1.06, '#e8f0ff'); cyl(w - .5, .35, 1.05, .09, .1, GOLD, { ol: false }); dot(w - .5, .35, 1.2, GOLD_L);
  box(1.3, .2, 1.05, .16, .16, .2, '#3b6fd0', { ol: false }); for (let i = 0; i < 3; i++) lw([1.34 + i * .04, .28, 1.25], [1.32 + i * .06, .28, 1.42], [RED, INK, GOLD_D][i]);
}
function crestwall() {
  const W = 4, y = .1;
  qy(.2, W - .2, y, .2, 3.3, NAVY); qy(.2, W - .2, y, .2, .3, GOLD_D); qy(.2, W - .2, y, 3.2, 3.3, GOLD_D); lw([.2, y, .2], [.2, y, 3.3], GOLD_D); lw([W - .2, y, .2], [W - .2, y, 3.3], GOLD_D);
  crestY(W / 2, y + .01, 3.0, 3);
  qy(.35, W - .35, y + .01, .5, .86, CREAM);
  ctext('LUX IN PORTU', .35, W - .35, y + .02, .78, NAVY); ctext('1891', .6, W - .6, y + .02, 3.14, GOLD_L);
}
const FACES = [['#ecba90', '#e8e8ee', 0], ['#84502f', '#2b2433', 1], ['#f8d0aa', '#a9a9b4', 2], ['#c4875a', '#4a3022', 1], ['#ffe2c8', '#8f5a30', 0], ['#643c26', '#e8e8ee', 2]];
function portrait(p) {
  const k = (p.k || 0) % 6, [skin, hair, st] = FACES[k], y = .1, W = 1.2, H = 1.6, bg = ['#5a3a3a', '#3a4a5a', '#4a5a3a', '#5a4a6a', '#3a3a4a', '#6a4a3a'][k];
  qy(0, W, y, 0, H, GOLD_D); qy(.05, W - .05, y + .003, .05, H - .05, GOLD); qy(.12, W - .12, y + .006, .12, H - .12, bg);
  qy(.3, W - .3, y + .01, .12, .78, k % 2 ? '#22304e' : '#2a2733'); qy(.5, W - .5, y + .012, .5, .78, k % 3 ? GOLD : '#8a3848');   /* gown + hood */
  qy(.42, W - .42, y + .014, .78, 1.2, skin); qy(.4, W - .4, y + .016, 1.12, 1.3, hair); if (st === 1) qy(.4, .46, y + .016, .8, 1.14, hair); if (st === 2) qy(.44, W - .44, y + .016, .78, .9, hair);
  dot(.52, y + .02, 1.02, INK); dot(.68, y + .02, 1.02, INK); if (k % 2) { lw([.48, y + .02, 1.04], [.56, y + .02, 1.04], '#3a3a48'); lw([.64, y + .02, 1.04], [.72, y + .02, 1.04], '#3a3a48'); }
  qy(.3, W - .3, y + .003, -.02, .04, GOLD_L);
}
function trophy() {
  const W = 1.8;
  box(0, 0, 0, W, .5, .5, OAK, { l: PAT.planks(OAK, 6) }); box(0, 0, .5, W, .5, 1.5, '#cfe8f0', { l: '#dff0f6', l2: '#b8d8e4', r: '#b8d8e4', t: OAK_L });
  for (const z of [.5, 1.2]) qy(0, W, .501, z, z + .05, OAK_D);
  const cup = (x, z, s, c) => { box(x - .05 * s, .2, z, .1 * s, .1, .08, OAK_D, { ol: false }); qy(x - .02 * s, x + .02 * s, .3, z + .08, z + .2 * s, c); qy(x - .1 * s, x + .1 * s, .3, z + .2 * s, z + .42 * s, c); lw([x - .1 * s, .3, z + .42 * s], [x + .1 * s, .3, z + .42 * s], lt(c, .5)); };
  cup(.35, .56, 1, GOLD); cup(.9, .56, 1.3, GOLD); cup(1.45, .56, .9, '#c8ccd4'); cup(.5, 1.26, .9, '#c8884a'); cup(1.25, 1.26, 1.1, GOLD);
  qy(.8, 1.0, .3, 1.28, 1.5, NAVY); dot(.9, .3, 1.42, GOLD);
  for (const x of [0, W]) lw([x, .5, .5], [x, .5, 2], OAK_D); lw([0, .5, 2], [W, .5, 2], OAK_D);
}
function bust() {
  box(.1, .1, 0, .6, .6, 1.2, STONE, { l: PAT.stone(STONE), r: PAT.stone(dk(STONE, .16)) }); box(.04, .04, 1.2, .72, .72, .1, STONE); qy(.2, .6, .701, .7, .92, GOLD_D); textY('ASHBY', .22, .702, .88, INK);
  box(.2, .24, 1.3, .4, .3, .34, BRONZE, { l: BRONZE_L, t: BRONZE_L }); ball(.4, .4, 1.86, .2, BRONZE, { t: BRONZE_L }); box(.2, .22, 1.96, .4, .36, .07, dk(BRONZE, .2), { ol: false }); box(.28, .28, 2.03, .24, .22, .14, dk(BRONZE, .2), { ol: false });
}
function carrel(p) {
  const c = p.c || OAK;
  box(0, 0, 0, 1.2, .1, 1.3, dk(c, .1), { l: PAT.planks(dk(c, .1), 6) }); box(0, .1, 0, .08, .55, 1.3, dk(c, .16), { ol: false }); box(1.12, .1, 0, .08, .55, 1.3, dk(c, .16), { ol: false });
  box(0, .1, .7, 1.2, .5, .06, lt(c, .1)); for (const x of [.06, 1.14]) post(x, .56, 0, .7, dk(c, .3), .07);
  /* green banker's lamp */
  cyl(.28, .28, .76, .07, .03, GOLD_D, { ol: false }); lw([.28, .28, .79], [.28, .28, 1.0], GOLD_D); box(.14, .2, 1.0, .3, .14, .1, LAMP, { ol: false, t: lt(LAMP, .3) }); glow(() => { qz(.1, .7, .16, .56, .765, '#fff2c0', '#f6e2a0'); });
  qz(.6, .98, .2, .5, .765, PAPER); lw([.79, .2, .77], [.79, .5, .77], '#c8c0a8'); books(.84, 1.1, .12, .76, .26, 5);
  /* chair */
  box(.38, .68, 0, .44, .4, .45, WALNUT, { t: '#8a3848' }); box(.38, 1.04, .45, .44, .06, .45, WALNUT, { ol: false });
}
function labbench(p) {
  const k = p.k || 0, W = 2.4;
  box(0, 0, 0, W, .9, .9, '#e8e2d4', { l: PAT.planks('#d8d0bc', 10), t: '#3a3f4c' }); qy(.1, W - .1, .901, .5, .56, STEEL_D);
  if (k === 0) { /* microscope + slides + lamp */
    box(.4, .3, .9, .3, .3, .05, INK, { ol: false }); box(.5, .36, .95, .08, .1, .4, '#f4f0e8', { ol: false }); box(.46, .4, 1.3, .2, .08, .08, INK, { ol: false }); cyl(.5, .52, 1.14, .04, .16, STEEL, { ol: false }); cyl(.5, .52, 1.36, .035, .16, INK, { ol: false });
    for (let i = 0; i < 4; i++) qz(1.0 + i * .2, 1.14 + i * .2, .3, .6, .905, '#cfe8f0'); cyl(2.0, .4, .9, .12, .3, '#f4f0e8', { t: GREEN_L, ol: false });
  } else if (k === 1) { /* flasks on a stand, burner */
    const fl = (x, c, h) => { cone(x, .45, .9, .13, h, c); cyl(x, .45, .9 + h * .8, .03, .16, '#dff0f6', { ol: false }); };
    fl(.45, '#5ab0e0', .34); fl(.85, '#e0527a', .28); fl(1.25, '#9ac84a', .38); box(1.7, .3, .9, .4, .3, .04, STEEL_D, { ol: false }); cyl(1.9, .45, .94, .05, .12, STEEL, { ol: false }); lit(() => { dot(1.9, .45, 1.14, '#5ab0e0'); dot(1.9, .45, 1.14, '#cfe8ff', 0, -1); });
    for (let i = 0; i < 5; i++) cyl(.3 + i * .09, .14, .9, .025, .2, ['#f4f0e8', '#f6d878', '#f08ab0', '#8fd8f0', '#b8f0a0'][i], { ol: false });
  } else { /* pond tank + net + field notebook */
    box(.3, .2, .9, 1.2, .5, .6, '#8fd0e0', { l: '#7fc0d4', l2: '#a8e0ec', r: '#6ab0c4', t: '#cfeef4' }); for (const [x, z] of [[.5, 1.0], [.9, 1.2], [1.2, 1.05]]) { dot(x, .701, z, '#e8843a'); dot(x, .701, z, '#e8843a', 1, 0); } for (let i = 0; i < 4; i++) lw([.4 + i * .28, .701, .9], [.36 + i * .28, .701, 1.2 + (i % 2) * .15], GREEN);
    qz(1.7, 2.1, .3, .62, .905, PAPER); lw([1.72, .4, .91], [2.06, .4, .91], '#8a8478'); lw([1.72, .5, .91], [2.0, .5, .91], '#8a8478'); cyl(2.2, .2, .9, .06, .26, '#dff0f6', { ol: false });
  }
  for (const x of [.5, W - .5]) { cyl(x, 1.25, 0, .16, .5, STEEL_D, { t: '#3a3f4c' }); }
}
function stilllife() {
  box(.15, .15, 0, .7, .7, .9, CREAM, { l: PAT.stucco(CREAM) }); qz(.1, .9, .1, .9, .905, '#8a3848', '#7a2c3c'); fq([[.1, .9, .905], [.9, .9, .905], [.9, .9, .6], [.1, .9, .6]], '#8a3848');
  cyl(.42, .5, .9, .2, .1, '#e4d8b8'); ball(.36, .5, 1.06, .09, '#d9483b', { ol: false }); ball(.5, .46, 1.07, .09, '#e8b83a', { ol: false }); ball(.44, .58, 1.08, .08, '#9ac84a', { ol: false });
  cyl(.72, .36, .9, .08, .34, '#2f6a7a', { ol: false }); cyl(.72, .36, 1.24, .04, .1, '#2f6a7a', { ol: false }); for (const [dx, c] of [[-2, '#f08ab0'], [0, '#f6d878'], [2, '#f08ab0']]) dot(.72, .36, 1.5, c, dx, dx ? 1 : 0);
}
function workbench() {
  const W = 2.4;
  qy(0, W, .1, .9, 1.9, '#c9a070'); for (let x = .15; x < W; x += .15) for (let z = 1.0; z < 1.85; z += .15) dot(x, .1, z, '#a8804e');
  const tool = (x, z, h, c) => { lw([x, .11, z], [x, .11, z + h], c); lw([x + .01, .11, z], [x + .01, .11, z + h], c); };
  tool(.3, 1.2, .5, STEEL); dot(.3, .11, 1.72, STEEL, -1, 0); dot(.3, .11, 1.72, STEEL, 1, 0); tool(.6, 1.25, .45, RED); tool(.9, 1.3, .4, GOLD_D); qy(1.2, 1.5, .11, 1.4, 1.5, STEEL); qy(1.3, 1.36, .11, 1.1, 1.4, OAK_D); qy(1.75, 2.15, .11, 1.25, 1.6, STEEL_D); lw([1.75, .11, 1.25], [2.15, .11, 1.6], STEEL);
  box(0, .1, 0, W, .7, .86, OAK, { l: PAT.planks(OAK, 8), t: lt(OAK, .12) }); qy(.2, 1.0, .801, .2, .6, dk(OAK, .2)); qy(1.3, 2.2, .801, .2, .6, dk(OAK, .2)); dot(.6, .801, .42, GOLD); dot(1.75, .801, .42, GOLD);
  box(.2, .5, .86, .3, .28, .24, '#c8402f'); box(.28, .56, 1.1, .14, .16, .1, STEEL_D, { ol: false });       /* vice */
  box(1.2, .3, .86, .5, .3, .06, '#e4d8b8', { ol: false }); cyl(2.0, .45, .86, .14, .2, '#3b6fd0'); lw([1.9, .45, 1.0], [2.1, .5, 1.3], OAK_D);
}
const PIN = {
  time(put, n) { for (let c = 0; c < 6; c++) for (let r = 0; r < 5; r++) { const x = 4 + c * Math.floor((n - 8) / 6), y = 4 + r * 3, on = (c * 5 + r * 3) % 4 !== 0; for (let i = 0; i < Math.floor((n - 8) / 6) - 1; i++) put(x + i, y, on ? POSTER[(c + r * 2) % 8] : '#e4d8b8'); } },
  clubs(put, n) { const r = rng(4); for (let i = 0; i < 7; i++) { const x = 3 + Math.floor(r() * (n - 12)), y = 3 + Math.floor(r() * 12), c = POSTER[i % 9]; for (let a = 0; a < 6; a++) for (let b = 0; b < 7; b++) put(x + a, y + b, b === 1 || b === 3 ? dk(c, .3) : c); } },
  work(put, n, k) { for (let i = 0; i < Math.min(5, k || 3); i++) { const x = 3 + i * 7; if (x > n - 8) break; for (let a = 0; a < 6; a++) for (let b = 0; b < 8; b++) put(x + a, 5 + b + (i % 2) * 3, a === 0 || b === 0 || a === 5 || b === 7 ? OAK_D : ['#8fd0e0', '#f6d878', '#f08ab0', '#b8f0a0', '#e8f0ff'][(i + a * b) % 5]); } },
  exam(put, n) { for (let r = 0; r < 6; r++) for (let i = 0; i < n - 10; i++) if ((i + r) % 9 !== 8) put(5 + i, 5 + r * 3, r === 0 ? RED : INK); },
};
function pinboard(p) {
  const k = p.k || 'clubs', W = p.w || 2.4, H = 1.5, y = .1;
  qy(0, W, y, 0, H, OAK_D); qy(.08, W - .08, y + .004, .08, H - .26, k === 'time' || k === 'exam' ? PAPER : '#c9a070'); qy(.08, W - .08, y + .004, H - .26, H - .06, NAVY);
  ctext({ time: 'TIMETABLE', clubs: 'CLUBS', work: 'OUR WORK', exam: 'RESULTS' }[k] || 'NOTICES', 0, W, y + .01, H - .1, GOLD_L);
  const put = wallPut(W - .16, y + .01, .1, .08), n = Math.round((W - .16) * 16); (PIN[k] || PIN.clubs)((u, v, c) => put(u, 20 - v, c), n, p.n);
}
function cafesign(p) {
  const t = String(p.t || 'THE QUILL & KETTLE').toUpperCase(), W = Math.max(3, textW(t) / 16 + .8), y = .1;
  qy(0, W, y, 0, .7, '#3f6a5a'); qy(0, W, y, 0, .06, GOLD_D); qy(0, W, y, .64, .7, GOLD_D); lit(() => ctext(t, 0, W, y + .01, .5, CREAM));
}
function win(p) {
  const y = .1, W = 1.6, H = 3, n = !!p.night, g = n ? ['#1c2548', '#22305a'] : ['#a8d4ea', '#c4e4f2'];
  qy(0, W, y, 0, H, STONE_D); const put = wallPut(W - .3, y + .01, .2, .15), nn = Math.round((W - .3) * 16), hh = Math.round((H - .35) * 16);
  for (let v = 0; v < hh; v++) for (let u = 0; u < nn; u++) { const top = hh - v, cx = u - nn / 2 + .5, arch = top < nn / 2 ? Math.hypot(cx, nn / 2 - top) > nn / 2 : false; if (arch) continue; const lead = u % 5 === 0 || v % 6 === 0; put(u, v, lead ? '#4a4458' : (u * 3 + v * 7) % 23 === 0 && !n ? '#e8f6fb' : g[(u + v) & 1], !n && !lead ? false : false); }
  if (n) for (const [u, v] of [[5, 30], [14, 22], [9, 38], [17, 34]]) put(u, v, '#fff8d8', true);
  else { /* a branch of the maple outside */ for (let i = 0; i < 9; i++) put(2 + i, 12 + (i >> 1), '#7a5238'); for (const [u, v] of [[6, 16], [8, 18], [10, 15], [4, 13], [11, 19]]) { put(u, v, '#d9722e'); put(u + 1, v, '#e8943a'); } }
  qy(-.06, W + .06, y, 0, .12, STONE); glow(() => qz(.1, W - .1, .3, 1.6, .01, '#fff2c0', 'glass'));
}
function pennants(p) {
  const w = p.w || 6, y = .1; for (let i = 0; i <= 30; i++) { const t = i / 30; dot(t * w, y, .5 - Math.sin(t * Math.PI) * .22, IRON); }
  for (let x = .3, i = 0; x < w - .3; x += .5, i++) { const z = .5 - Math.sin(x / w * Math.PI) * .22; fq([[x - .16, y, z], [x + .16, y, z], [x, y, z - .38]], i % 2 ? GOLD : NAVY); }
}
function gowns() {
  post(.06, .25, 0, 1.8, IRON, .07); post(1.54, .25, 0, 1.8, IRON, .07); lw([.06, .25, 1.8], [1.54, .25, 1.8], STEEL);
  for (let i = 0; i < 6; i++) { const x = .16 + i * .22, c = i % 3 === 2 ? '#3a2a50' : '#22242e'; box(x, .1, .35, .18, .3, 1.38, c, { ol: false, l: lt(c, .08), r: dk(c, .2) }); qy(x + .04, x + .14, .401, 1.2, 1.7, i % 2 ? GOLD : '#8a3848'); }
  box(.2, .1, 1.86, .3, .3, .03, '#22242e', { ol: false }); box(.28, .18, 1.89, .14, .14, .08, '#22242e', { ol: false }); dot(.5, .4, 1.86, GOLD, 0, 1);
}
function stage(p) { const w = p.w || 6, d = p.d || 3; box(0, 0, 0, w, d, .22, OAK, { t: PAT.fboards(OAK_L, .4), l: dk(OAK, .1) }); lw([0, d, .22], [w, d, .22], GOLD_D); }
function demo() {
  const W = 3;
  box(0, 0, 0, W, .9, .95, '#f4f0e8', { l: PAT.ftile ? '#e8e2d4' : '#e8e2d4', t: STEEL }); qy(0, W, .901, .1, .2, STEEL_D);
  qz(.3, 1.1, .2, .7, .955, '#3a3f4c'); for (const [x, y] of [[.5, .35], [.9, .35], [.5, .58], [.9, .58]]) { dot(x, y, .96, '#6a7482'); dot(x, y, .96, '#6a7482', 1, 0); }
  cyl(.9, .5, .96, .16, .16, STEEL_D, { t: '#e8843a' }); lw([1.05, .5, 1.1], [1.4, .5, 1.1], INK);
  qz(1.6, 2.3, .2, .7, .955, OAK_L); ball(1.8, .4, 1.02, .07, '#d9483b', { ol: false }); ball(2.0, .5, 1.02, .07, '#9ac84a', { ol: false }); lw([2.1, .3, .97], [2.25, .6, .97], STEEL);
  cyl(2.7, .4, .95, .1, .22, '#f4f0e8', { ol: false }); for (let i = 0; i < 3; i++) lw([2.66 + i * .04, .4, 1.17], [2.62 + i * .07, .4, 1.4], OAK_D);
  /* the tilted demo mirror above */
  for (const x of [.1, W - .1]) post(x, .05, .95, 1.7, STEEL_D, .06); fq([[.1, .05, 2.65], [W - .1, .05, 2.65], [W - .1, .6, 2.3], [.1, .6, 2.3]], '#b8d8e4', '#cfe8f0'); lw([.1, .6, 2.3], [W - .1, .6, 2.3], STEEL_D); lw([.1, .05, 2.65], [W - .1, .05, 2.65], STEEL_D);
}

const A = (name, tags, size, draw, o) => Object.assign({ id: 'furn.uni.' + name, kind: 'furniture', tags: ['university'].concat(tags), size, draw }, o);
export default [
  A('lecrow', ['uni_seat'], p => [(p.n || 5) * .7, 1.1, .9], lecrow, { seats: p => Array.from({ length: p.n || 5 }, (_, i) => ({ x: i * .7 + .35, y: .8, z: .46, dir: 3 })), vb: p => [-.1, -.1, 0, (p.n || 5) * .7 + .1, 1.2, 1], variants: [{ n: 5 }, { n: 3, c: '#7a5238' }] }),
  A('chalk', ['decor'], p => [p.w || 3, .2, 1.7], chalk, { wall: true, mount: .9, solid: false, variants: [{ k: 0 }, { k: 1 }, { k: 2, w: 4 }, { k: 3 }] }),
  A('screenframe', ['decor'], p => [p.w || 8, .2, (p.h || 3.5) + .5], screenframe, { wall: true, mount: .9, solid: false, variants: [{ w: 8 }] }),
  A('counter', ['uni_counter'], p => [p.w || 5, .7, 2.82], counter, { use: p => ({ x: (p.w || 5) * .25, y: 1.25 }), staff: p => ({ x: (p.w || 5) * .25, y: -.45, dir: 1 }), vb: p => [-.1, -.1, 0, (p.w || 5) + .1, .9, 2.9], variants: [{ w: 5, t: 'REGISTRAR', t2: 'BURSAR' }, { w: 2, t: 'LIBRARY' }] }),
  A('crestwall', ['decor'], [4, .2, 3.4], crestwall, { wall: true, mount: .7, solid: false, variants: [{}] }),
  A('portrait', ['uni_portrait'], [1.2, .15, 1.6], portrait, { wall: true, mount: 1.2, solid: false, use: { x: .6, y: .8 }, variants: [0, 1, 2, 3, 4, 5].map(k => ({ k })) }),
  A('trophy', ['uni_trophy'], [1.8, .5, 2], trophy, { use: { x: .9, y: 1 }, variants: [{}] }),
  A('bust', ['uni_bust'], [.8, .8, 2.2], bust, { use: { x: .4, y: 1.3 }, variants: [{}] }),
  A('carrel', ['uni_carrel'], [1.2, 1.1, 1.3], carrel, { seats: [{ x: .6, y: .86, z: .46, dir: 3 }], use: { x: .6, y: 1.5 }, variants: [{}, { c: '#5a3626' }] }),
  A('labbench', ['uni_station'], [2.4, .9, 1.5], labbench, { use: { x: 1.2, y: 1.75 }, vb: [-.1, -.1, 0, 2.5, 1.5, 1.6], variants: [{ k: 0 }, { k: 1 }, { k: 2 }] }),
  A('stilllife', ['decor'], [1, 1, 1.6], stilllife, { variants: [{}] }),
  A('workbench', ['uni_station'], [2.4, .8, 1.9], workbench, { use: { x: 1.2, y: 1.3 }, variants: [{}] }),
  A('pinboard', ['uni_board'], p => [p.w || 2.4, .15, 1.5], pinboard, { wall: true, mount: 1, solid: false, use: p => ({ x: (p.w || 2.4) / 2, y: .8 }), variants: [{ k: 'time' }, { k: 'clubs' }, { k: 'work', n: 4 }, { k: 'exam' }] }),
  A('cafesign', ['decor'], p => [Math.max(3, textW(String(p.t || 'THE QUILL & KETTLE')) / 16 + .8), .15, .7], cafesign, { wall: true, mount: 2.9, solid: false, variants: [{}] }),
  A('window', ['decor'], [1.6, .2, 3], win, { wall: true, mount: .9, solid: false, variants: [{}, { night: 1 }] }),
  A('pennants', ['decor'], p => [p.w || 6, .1, .6], pennants, { wall: true, mount: 3.6, solid: false, vb: p => [0, 0, -.2, p.w || 6, .2, .7], variants: [{ w: 6 }] }),
  A('gowns', ['uni_gowns'], [1.6, .5, 1.95], gowns, { use: { x: .8, y: 1 }, variants: [{}] }),
  A('stage', ['decor'], p => [p.w || 6, p.d || 3, .22], stage, { solid: false, variants: [{ w: 4, d: 2 }] }),
  A('demo', ['uni_station'], [3, .9, 2.7], demo, { use: { x: 1.5, y: 1.4 }, staff: { x: 1.5, y: -.45, dir: 1 }, variants: [{}] }),
];
