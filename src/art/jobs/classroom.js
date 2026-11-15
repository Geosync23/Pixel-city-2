// Maplewood Elementary, Room 4: the classroom's fixtures (room: src/scenes/rooms/job_school.js). Ids `furn.job.school.*`.
// Station tags used by the Teacher job: class_board, class_carpet, class_desks, class_reading_corner, class_nature_table.
// Visitor tags: class_cubbies, class_townmap, class_art, seat.
import { textY, ball } from '../../engine/raster.js';
import { J, bx, tube, post, posts, frameY, frameX, frameZ, plant, cup, lamp, discY, ringY, pix, label, sheet, board, clockY, spines, INK, BRASS, PAPER, box, qy, qx, qz, lw, fq, lit, glow, cyl, spx, dk, lt, hash2 } from './_lib.js';

const KID = ['#e8483a', '#f2c230', '#3c9a5a', '#3b6fd0', '#e87aa0', '#f28a30', '#7a55c8', '#2fa3a0'];
const WOOD = '#d2a26a', WOODD = '#a87848';
/* a small chair (child scale): seat .28 high */
const kchair = (x, y, dir, c) => { const s = .3; posts(x + .03, y + .03, s - .06, s - .06, 0, .26, '#8a9098'); if (dir === 1) bx(x, y, .28, s, .05, .3, c); if (dir === 0) bx(x, y, .28, .05, s, .3, c); bx(x, y, .24, s, s, .05, c); if (dir === 3) bx(x, y + s - .05, .28, s, .05, .3, c); if (dir === 2) bx(x + s - .05, y, .28, .05, s, .3, c); };
const backpack = (x, y, z, c) => { bx(x, y, z, .22, .14, .26, c); bx(x + .04, y + .12, z + .04, .14, .04, .12, dk(c, .2)); lw([x + .04, y + .14, z + .22], [x + .18, y + .14, z + .22], lt(c, .35)); };
const painting = (x, y, z, k) => { const bg = ['#bfe4f4', '#f4e9cf', '#d8f0c8', '#f8d8e0'][k % 4]; qy(x, x + .36, y, z, z + .42, bg); frameY(x, x + .36, y, z, z + .42, '#b8b2a2');
  if (k % 4 === 0) { discY(x + .26, y + .01, z + .32, .06, '#f2c230', 8); qy(x, x + .36, y + .01, z, z + .1, '#3c9a5a'); pix(x + .06, y + .01, z + .1, ['.r.', 'rrr', 'bbb', 'bbb'], { r: '#e8483a', b: '#f4f0e8' }); }
  else if (k % 4 === 1) pix(x + .06, y + .01, z + .06, ['..oo..', '.oooo.', 'oooooo', '.o..o.'], { o: '#f28a30' });
  else if (k % 4 === 2) { for (let i = 0; i < 5; i++) spx(x + .06 + i * .06, y + .01, z + .12 + (i % 2) * .1, 0, 0, KID[i]); lw([x + .04, y + .01, z + .08], [x + .32, y + .01, z + .08], '#3b6fd0'); }
  else pix(x + .08, y + .01, z + .08, ['p.p', 'ppp', '.p.', '.g.', '.g.'], { p: '#e87aa0', g: '#3c9a5a' }); };

export default [
  /* ---------------- the board: today's lesson, the alphabet above ---------------- */
  J('school.board', ['class_board', 'chalkboard'], p => [p.w || 4.4, .2, 2.3], p => {
    const w = p.w || 4.4;
    /* alphabet frieze */
    for (let i = 0; i < Math.floor(w / .4); i++) { qy(.05 + i * .4, .41 + i * .4, .03, 1.9, 2.24, KID[i % 8]); textY('ABCDEFGHIJKLMNOP'[i], .15 + i * .4, .04, 2.2, PAPER); }
    board(.1, w - .1, .04, .5, 1.76, '#2f5a48', WOODD); bx(.1, .04, .42, w - .2, .12, .05, WOOD);
    textY('MON', .22, .05, 1.7, '#f4f0e8'); lw([.2, .05, 1.36], [w - .2, .05, 1.36], '#6a9a84');
    textY('3 + 4 = 7', .3, .05, 1.26, PAPER); textY('8 - 2 = ?', .3, .05, .9, '#f8e080');
    /* a chalk sun, a number line, the helper list */
    discY(w - .7, .05, 1.1, .16, '#f8e080', 10); for (let a = 0; a < 8; a++) lw([w - .7 + Math.cos(a * .785) * .22, .05, 1.1 + Math.sin(a * .785) * .22], [w - .7 + Math.cos(a * .785) * .3, .05, 1.1 + Math.sin(a * .785) * .3], '#f8e080');
    lw([w - 1.6, .05, .66], [w - .24, .05, .66], PAPER); for (let i = 0; i < 8; i++) lw([w - 1.6 + i * .19, .05, .62], [w - 1.6 + i * .19, .05, .7], PAPER);
    for (const [x, c] of [[.4, PAPER], [.56, '#f8a0b0'], [.7, '#a0d8f8']]) bx(x, .08, .47, .1, .03, .03, c); bx(w - .6, .06, .47, .3, .08, .08, '#8a8698');
  }, { wall: true, mount: 0, solid: false, use: p => ({ x: (p.w || 4.4) / 2, y: .85 }), staff: p => ({ x: (p.w || 4.4) / 2 - .9, y: .7, dir: 1 }), variants: [{}] }),

  /* ---------------- a table of four ---------------- */
  J('school.desks', ['class_desks', 'table', 'seat', 'seating'], p => [1.7, 1.5, .62], p => {
    const c = p.c || '#e8d8a8', k = p.seed || 0;
    kchair(.25, .0, 1, KID[k % 8]); kchair(1.15, .0, 1, KID[(k + 3) % 8]);
    posts(.14, .44, 1.42, .62, 0, .5, '#8a9098'); box(.08, .38, .5, 1.54, .74, .06, c, { t: lt(c, .1) }); lw([.85, .38, .565], [.85, 1.12, .565], dk(c, .25));
    /* worksheets, pencils, a pot of crayons */
    for (const [x, y, r] of [[.2, .46, 0], [1.0, .46, 1], [.24, .82, 2], [1.04, .8, 3]]) { qz(x, x + .34, y, y + .24, .565, PAPER, '#ece6d6'); lw([x + .04, y + .08, .57], [x + .26, y + .08, .57], '#8a8698'); lw([x + .04, y + .16, .57], [x + .2, y + .16, .57], '#8a8698'); if ((r + k) % 3 === 0) spx(x + .28, y + .2, .57, 0, 0, '#e8483a'); }
    cyl(.85, .74, .56, .07, .12, '#3b6fd0', { ol: false }); for (let i = 0; i < 4; i++) post(.82 + i * .02, .74, .68, .78, KID[(i + k) % 8]);
    kchair(.25, 1.2, 3, KID[(k + 5) % 8]); kchair(1.15, 1.2, 3, KID[(k + 6) % 8]);
  }, { seats: [{ x: .4, y: .17, z: .3, dir: 1 }, { x: 1.3, y: .17, z: .3, dir: 1 }, { x: .4, y: 1.33, z: .3, dir: 3 }, { x: 1.3, y: 1.33, z: .3, dir: 3 }], use: { x: 1.95, y: .75 }, variants: [{}, { seed: 3 }] }),

  /* ---------------- the teacher's desk ---------------- */
  J('school.tdesk', ['desk', 'class_tdesk'], [1.8, 1.4, 1.2], p => {
    const c = '#b07444';
    posts(.7, .12, .4, .36, 0, .44, '#5a3a28'); bx(.66, .08, .44, .48, .44, .06, '#3c9a5a'); bx(.66, .04, .5, .48, .06, .24, '#3c9a5a');
    box(0, .66, 0, 1.8, .7, .78, c, { t: lt(c, .18) }); frameY(.08, .84, 1.36, .1, .68, dk(c, .3)); frameY(.96, 1.72, 1.36, .1, .68, dk(c, .3)); spx(.46, 1.36, .4, 0, 0, BRASS); spx(1.34, 1.36, .4, 0, 0, BRASS);
    /* an apple, a stack of marking, a mug of pens, the bell, a globe */
    ball(.2, .86, .86, .07, '#e8483a', { ol: false }); spx(.2, .86, .94, 0, 0, '#3c9a5a');
    for (let i = 0; i < 4; i++) bx(.5 + i * .01, .8, .78 + i * .03, .4, .3, .03, i % 2 ? PAPER : '#ece6d6'); spx(.6, 1.0, .91, 0, 0, '#e8483a'); spx(.66, 1.0, .91, 0, 0, '#f2c230');
    cyl(1.1, .84, .78, .06, .13, '#f1ede4', { ol: false }); for (let i = 0; i < 3; i++) post(1.08 + i * .02, .84, .9, 1.02, ['#e8483a', '#3b6fd0', '#f2c230'][i]);
    cyl(1.5, .96, .78, .09, .03, '#5a3a28', { ol: false }); post(1.5, .96, .8, .9, BRASS); ball(1.5, .96, 1.02, .13, '#5ab0e0', { ol: false }); spx(1.5, .96, 1.04, -1, 0, '#3c9a5a'); spx(1.5, .96, 1.0, 1, 1, '#3c9a5a'); spx(1.5, .96, 1.06, 2, -1, '#3c9a5a');
    cyl(1.28, 1.16, .78, .05, .04, BRASS, { ol: false }); post(1.28, 1.16, .82, .9, '#5a3a28');
  }, { use: { x: .9, y: 1.85 }, variants: [{}] }),

  /* ---------------- the carpet: circle time ---------------- */
  J('school.carpet', ['class_carpet', 'rug'], p => [p.w || 3, p.d || 2.4, .03], p => {
    const w = p.w || 3, d = p.d || 2.4, n = 5, m = 4;
    qz(0, w, 0, d, .012, '#3b6fd0'); frameZ(0, w, 0, d, .013, '#2f4f9a');
    for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) { const x = .15 + i * (w - .3) / n, y = .15 + j * (d - .3) / m, c = KID[(i * 3 + j * 5) % 8]; qz(x + .03, x + (w - .3) / n - .03, y + .03, y + (d - .3) / m - .03, .014, c, lt(c, .12)); spx(x + (w - .3) / n / 2, y + (d - .3) / m / 2, .015, 0, 0, PAPER); spx(x + (w - .3) / n / 2, y + (d - .3) / m / 2, .015, 1, 0, PAPER); }
  }, { solid: false, flat: true, use: p => ({ x: (p.w || 3) / 2, y: (p.d || 2.4) / 2 }), seats: [{ x: .5, y: .6, z: 0, dir: 0 }, { x: 2.5, y: .6, z: 0, dir: 2 }, { x: .5, y: 1.8, z: 0, dir: 0 }, { x: 2.5, y: 1.8, z: 0, dir: 2 }, { x: 1.5, y: .35, z: 0, dir: 1 }], variants: [{}] }),

  /* ---------------- the reading corner: a tent, beanbags, a low shelf ---------------- */
  J('school.readnook', ['class_reading_corner', 'reading_nook', 'book_browse'], [2.6, 2.2, 2], p => {
    /* a low L of shelves along the back and the left */
    box(0, 0, 0, 2.6, .4, .74, WOOD, { l: (u, v) => null }); qy(.04, 2.56, .4, .06, .7, '#5a3a28'); bx(.04, .3, .36, 2.52, .1, .03, WOOD); spines(.08, 2.5, .41, .08, .34, KID, 4); spines(.08, 2.5, .41, .4, .68, KID, 9);
    /* face-out picture books on top */
    for (let i = 0; i < 4; i++) { qy(.2 + i * .6, .52 + i * .6, .2, .76, 1.12, KID[(i * 3 + 1) % 8]); frameY(.2 + i * .6, .52 + i * .6, .2, .76, 1.12, INK); pix(.28 + i * .6, .21, .84, [['.yy', 'yyo', 'yyy'], ['k..k', 'kkkk', 'kwkw'], ['.r.', 'rwr', 'r.r'], ['.g.', 'ggg', '.b.']][i], { y: '#f8e080', o: '#f28a30', k: '#3a3644', w: PAPER, r: PAPER, g: PAPER, b: '#8a5a3a' }); }
    /* the tent: a striped canopy on a pole */
    post(.5, .9, 0, 1.9, '#8a5a3a'); for (let k = 0; k < 6; k++) { const a = k * 1.047, b = (k + 1) * 1.047; fq([[.5, .9, 1.9], [.5 + Math.cos(a) * .9, .9 + Math.sin(a) * .7, 1.05], [.5 + Math.cos(b) * .9, .9 + Math.sin(b) * .7, 1.05]], k % 2 ? '#f4f0e8' : '#e8483a'); }
    glow(() => { for (let k = 0; k < 6; k++) spx(.5 + Math.cos(k * 1.047) * .9, .9 + Math.sin(k * 1.047) * .7, 1.02, 0, 0, '#ffe680'); });
    /* a round rug, two beanbags, a cushion, a soft toy */
    cyl(1.3, 1.4, .0, .9, .02, '#f2c230', { ol: false, t: '#f6d24a' }); ringY(1.3, 1.4, .02, .0, '#f2c230');
    ball(.7, 1.2, .2, .34, '#3c9a5a', { squash: .6 }); ball(1.9, 1.5, .2, .34, '#7a55c8', { squash: .6 }); bx(1.2, 1.9, 0, .4, .3, .1, '#e87aa0');
    pix(1.15, 1.1, .12, ['b.b', 'bbb', 'bwb', 'bbb'], { b: '#b07444', w: '#f4e9cf' });
  }, { vb: [-.6, -.3, 0, 2.9, 2.6, 2.1], solid: false, use: { x: 1.3, y: 1.4 }, seats: [{ x: .7, y: 1.2, z: .2, dir: 1 }, { x: 1.9, y: 1.5, z: .2, dir: 1 }], variants: [{}] }),

  /* ---------------- the nature table: Twiglet's tank ---------------- */
  J('school.nature', ['class_nature_table', 'nature_table'], [1.8, .7, 1.5], p => {
    posts(.06, .06, 1.68, .58, 0, .62, WOODD); box(0, 0, .62, 1.8, .7, .06, '#8ac86a', { t: '#9ad47a' });
    /* the tank: glass, a branch, bramble leaves, a twig that might be Twiglet */
    bx(.1, .14, .68, .8, .42, .04, '#5a3a28'); qy(.1, .9, .56, .72, 1.22, '#bfe4f4', 'glass'); qx(.9, .14, .56, .72, 1.22, '#a8d8ec', 'glass'); frameY(.1, .9, .56, .72, 1.22, '#8a9098'); qz(.1, .9, .14, .56, 1.22, '#6a7078', 'glass');
    tube([.2, .36, .72], [.5, .36, 1.1], '#8a5a3a'); tube([.5, .36, 1.1], [.78, .36, .96], '#8a5a3a'); for (const [x, z] of [[.3, 1.0], [.62, 1.14], [.76, .88], [.4, .84]]) { spx(x, .37, z, 0, 0, '#3c9a5a'); spx(x, .37, z, 1, 0, '#5fb84f'); spx(x, .37, z, 0, -1, '#5fb84f'); }
    lw([.56, .38, .92], [.66, .38, 1.04], '#c8a868'); spx(.66, .38, 1.04, 1, -1, '#c8a868'); spx(.56, .38, .92, -1, 0, '#c8a868');
    qy(.14, .6, .57, .62, .7, PAPER); textY('TWIG', .16, .58, .92 - .2, INK);
    /* a magnifier, pine cones, a jar of shells, sprouting beans */
    ringY(1.14, .4, .78, .08, INK, 8); lw([1.2, .4, .72], [1.28, .4, .68], '#8a5a3a'); for (const [x, y] of [[1.4, .22], [1.52, .3]]) cyl(x, y, .68, .05, .1, '#8a5a3a', { ol: false });
    cyl(1.62, .5, .68, .08, .2, '#bfe4f4', { ol: false, t: '#f4e9cf' }); for (let i = 0; i < 3; i++) { cyl(1.1 + i * .12, .16, .68, .04, .08, '#f1ede4', { ol: false }); post(1.1 + i * .12, .16, .76, .86 + i * .04, '#5fb84f'); }
  }, { use: { x: .9, y: 1.15 }, variants: [{}] }),

  /* ---------------- cubbies and coat pegs ---------------- */
  J('school.cubbies', ['class_cubbies', 'lockers'], p => [p.w || 3, .5, 1.7], p => {
    const w = p.w || 3, n = Math.round(w / .5), names = p.names || ['PIP', 'MILO', 'AYO', 'JUNE', 'COS', 'BEA'];
    box(0, 0, 0, w, .5, .9, WOOD); for (let i = 0; i < n; i++) for (let r = 0; r < 2; r++) { const x = i * .5; qy(x + .04, x + .46, .5, .06 + r * .42, .44 + r * .42, '#6a4428'); if ((i + r) % 3 !== 2) backpack(x + .12, .3, .08 + r * .42, KID[(i * 3 + r * 5) % 8]); else bx(x + .1, .32, .08 + r * .42, .28, .14, .1, KID[(i + 2) % 8]); }
    /* peg rail with coats and name cards */
    bx(0, .0, 1.3, w, .06, .1, WOODD); for (let i = 0; i < n; i++) { const x = i * .5 + .25; spx(x, .08, 1.32, 0, 0, BRASS); if (i % 4 !== 3) { qy(x - .14, x + .14, .1, .96, 1.3, KID[(i * 5 + 2) % 8]); lw([x, .1, .96], [x, .1, 1.24], dk(KID[(i * 5 + 2) % 8], .3)); qy(x - .1, x + .1, .1, 1.24, 1.3, dk(KID[(i * 5 + 2) % 8], .15)); }
      qy(x - .18, x + .18, .04, 1.44, 1.64, [PAPER, '#f8e8b0', '#d8f0e0'][i % 3]); lw([x - .12, .05, 1.56], [x + .1, .05, 1.56], KID[(i * 3) % 8]); }
  }, { use: p => ({ x: (p.w || 3) / 2, y: .95 }), variants: [{}] }),

  /* ---------------- wall pieces ---------------- */
  J('school.artline', ['class_art', 'decor'], p => [p.w || 3, .1, .7], p => {
    const w = p.w || 3; lw([0, .04, .62], [w, .04, .58], '#8a8698'); for (let i = 0; i < Math.floor(w / .5); i++) { painting(.08 + i * .5, .04, .1 + (i % 2) * .03, i + (p.seed || 0)); spx(.26 + i * .5, .05, .56, 0, 0, '#e8483a'); }
  }, { wall: true, mount: 1.5, solid: false, variants: [{}] }),
  J('school.townmap', ['class_townmap', 'decor'], [2.2, .1, 1.5], p => {
    qy(0, 2.2, .03, 0, 1.5, '#f4e9cf'); frameY(0, 2.2, .03, 0, 1.5, '#e8483a'); textY('OUR TOWN', .1, .04, 1.44, '#3b6fd0');
    fq([[1.4, .04, .05], [2.15, .04, .05], [2.15, .04, .7], [1.8, .04, .5]], '#9fd4e6'); lw([.1, .04, .5], [1.6, .04, .62], '#8a8698'); lw([.7, .04, .1], [.8, .04, 1.05], '#8a8698');
    for (const [x, z, c] of [[.2, .7, '#e8483a'], [.5, .3, '#f2c230'], [1.0, .8, '#3c9a5a'], [1.3, .26, '#7a55c8'], [1.7, .86, '#f28a30']]) { qy(x, x + .22, .05, z, z + .2, c); fq([[x - .03, .05, z + .2], [x + .25, .05, z + .2], [x + .11, .05, z + .32]], dk(c, .25)); }
    pix(1.9, .05, .2, ['w.', 'ww', 'kk'], { w: PAPER, k: '#8a5a3a' }); if (p.x) { lw([1.02, .06, .52], [1.14, .06, .64], '#e8483a'); lw([1.02, .06, .64], [1.14, .06, .52], '#e8483a'); }
  }, { wall: true, mount: 1.0, solid: false, use: { x: 1.1, y: .7 }, variants: [{}, { x: 1 }] }),
  J('school.sundoor', ['door', 'class_door'], [1.2, .14, 2.1], p => {
    const c = p.c || '#3b8a6a'; qy(0, 1.2, .04, 0, 2.05, '#e8dcc0'); qy(.1, 1.1, .06, 0, 1.96, c); frameY(.1, 1.1, .06, 0, 1.96, dk(c, .4)); qy(.3, .9, .07, 1.2, 1.76, '#bfe4f4', '#d0ecf8'); frameY(.3, .9, .07, 1.2, 1.76, dk(c, .4));
    if (p.sun !== false) { discY(.6, .08, .82, .2, '#f8d040', 10); for (let a = 0; a < 8; a++) lw([.6 + Math.cos(a * .785) * .24, .08, .82 + Math.sin(a * .785) * .24], [.6 + Math.cos(a * .785) * .33, .08, .82 + Math.sin(a * .785) * .33], '#f28a30'); spx(.56, .09, .86, 0, 0, INK); spx(.64, .09, .86, 0, 0, INK); lw([.55, .09, .76], [.65, .09, .76], INK); }
    else { qy(.34, .86, .08, .7, .96, PAPER); }
    qy(.36, .84, .08, 1.82, 1.94, PAPER); textY(p.n || '4', .54, .09, 1.95, INK); spx(1.0, .08, 1.0, 0, 0, BRASS); spx(1.0, .08, 1.0, 0, 1, BRASS);
  }, { wall: true, mount: 0, solid: false, use: { x: .6, y: .6 }, variants: [{}, { n: '5', sun: false, c: '#b8563a' }] }),
  J('school.window', ['window', 'decor'], p => [p.w || 2.4, .1, 1.5], p => {
    const w = p.w || 2.4; qy(0, w, .03, 0, 1.44, '#f1ede4'); qy(.08, w - .08, .04, .08, 1.36, '#9fd4e6', '#b8e2ee'); glow(() => qy(.08, w - .08, .04, .08, 1.36, '#2a3a6a', '#34447a'));
    fq([[.08, .04, .08], [w - .08, .04, .08], [w - .08, .04, .4], [.08, .04, .3]], '#7ac85a'); ball(w * .7, .05, .6, .3, '#5fb84f', { ol: false });
    for (let i = 1; i < 3; i++) lw([w * i / 3, .05, .08], [w * i / 3, .05, 1.36], '#f1ede4'); lw([.08, .05, .8], [w - .08, .05, .8], '#f1ede4'); frameY(.08, w - .08, .05, .08, 1.36, '#b8b2a2');
    /* paper leaves stuck to the glass */
    for (let i = 0; i < 5; i++) pix(.2 + i * (w - .5) / 4, .06, 1.0 + (i % 2) * .16, ['.x.', 'xxx', '.x.'], { x: KID[(i * 3) % 8] });
    bx(-.04, .03, -.06, w + .08, .12, .06, '#f1ede4');
  }, { wall: true, mount: .95, solid: false, variants: [{}] }),
  J('school.clock', ['decor', 'clock'], [.8, .1, .8], p => { clockY(.4, .05, .4, .3, { rim: '#3b6fd0' }); }, { wall: true, mount: 2.1, solid: false, variants: [{}] }),

  /* ---------------- the corridor: the glass partition, the caretaker's trolley, the fountain ---------------- */
  J('school.partition', ['partition'], p => [.2, p.d || 4, 2.3], p => {
    const d = p.d || 4, c = '#e8dcc0';
    box(0, 0, 0, .2, d, .95, c); qx(.2, 0, d, .95, 2.2, '#bfe4f4', 'glass'); for (let y = 0; y <= d + .01; y += d / Math.round(d / 1.0)) { bx(0, Math.min(d - .06, y), .95, .2, .06, 1.25, '#f1ede4'); }
    bx(0, 0, 2.2, .2, d, .1, '#f1ede4'); qx(.2, 0, d, .9, .96, '#8a5a3a'); qx(.2, 0, d, 0, .12, dk(c, .3));
    /* notices on the corridor side */
    for (let i = 0; i < Math.floor((d - (p.door ? 1.2 : 0)) / 1.2); i++) { qx(.21, .3 + i * 1.2, .7 + i * 1.2, .4, .8, [PAPER, '#f8e080', '#bfe4f4'][i % 3]); }
    if (p.door) { /* Room 4's door, open flat against the partition, with the paper sun on it */
      const y0 = d - 1.1, y1 = d - .1, c = '#3b8a6a'; qx(.26, y0, y1, 0, 2.0, c); frameX(.26, y0, y1, 0, 2.0, dk(c, .4)); qx(.27, y0 + .22, y1 - .22, 1.26, 1.8, '#bfe4f4', '#d0ecf8');
      const cy = (y0 + y1) / 2; fq(Array.from({ length: 10 }, (_, i) => [.28, cy + Math.cos(i * .628) * .22, .82 + Math.sin(i * .628) * .22]), '#f8d040'); for (let a = 0; a < 8; a++) lw([.28, cy + Math.cos(a * .785) * .26, .82 + Math.sin(a * .785) * .26], [.28, cy + Math.cos(a * .785) * .36, .82 + Math.sin(a * .785) * .36], '#f28a30'); }
  }, { vb: p => [-.2, -.2, 0, .5, (p.d || 4) + .2, 2.4], variants: [{}] }),
  J('school.trolley', ['class_trolley'], [1, .7, 1.5], p => {
    for (const [x, y] of [[.1, .1], [.9, .1], [.1, .6], [.9, .6]]) cyl(x, y, 0, .06, .08, '#3a3f4c', { ol: false });
    box(.05, .05, .1, .9, .6, .12, '#f2c230'); cyl(.3, .35, .22, .2, .36, '#3b6fd0', { t: '#5ab0e0' }); cyl(.7, .35, .22, .14, .3, '#e8483a', { t: '#22202a' });
    tube([.3, .35, .4], [.36, .35, 1.46], WOODD); bx(.24, .3, .36, .14, .1, .1, '#c8ccd4'); tube([.95, .35, .2], [.95, .35, 1.0], '#8a9098'); tube([.95, .1, 1.0], [.95, .6, 1.0], '#8a9098');
    /* mittens on a string, pegged along the handle */
    for (let i = 0; i < 3; i++) { lw([.96, .16 + i * .16, 1.0], [.96, .16 + i * .16, .9], '#8a8698'); pix(.96, .14 + i * .16, .8, ['mm.', 'mmm', 'mm.'], { m: KID[(i * 2 + 4) % 8] }); }
    discY(.6, .66, .6, .08, BRASS, 8); for (let i = 0; i < 3; i++) lw([.6, .66, .52], [.56 + i * .04, .66, .4], '#c8ccd4');
  }, { use: { x: .5, y: 1.15 }, variants: [{}] }),
  J('school.fountain', ['fountain', 'decor'], [.6, .4, 1], p => {
    box(.05, 0, .5, .5, .34, .22, '#c8ccd4', { t: '#9aa0a8' }); bx(.2, 0, 0, .2, .2, .5, '#8a9098'); tube([.3, .12, .72], [.3, .12, .84], '#d5dbe0'); tube([.3, .12, .84], [.3, .22, .84], '#d5dbe0'); spx(.3, .26, .8, 0, 0, '#9fd4e6'); spx(.3, .28, .76, 0, 0, '#9fd4e6');
  }, { use: { x: .3, y: .8 }, variants: [{}] }),
  J('school.notice', ['noticeboard', 'decor'], p => [p.w || 2, .1, 1.2], p => {
    const w = p.w || 2; board(.05, w - .05, .04, .05, 1.15, '#c8a070', '#8a5a3a');
    for (let i = 0; i < Math.floor(w / .46); i++) sheet(.12 + i * .46, .05, .2 + (i % 2) * .3, .34, .42 + (i % 3) * .08, { c: [PAPER, '#f8e080', '#bfe4f4', '#f8d8e0'][i % 4], head: KID[(i * 3) % 8], seed: i + 2, pin: '#e8483a' });
    textY(p.t || 'NEWS', .14, .05, 1.12, '#5a3a28');
  }, { wall: true, mount: 1.0, solid: false, use: p => ({ x: (p.w || 2) / 2, y: .7 }), variants: [{}] }),
];
