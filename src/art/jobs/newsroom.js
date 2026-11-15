// The Maple Bay Gazette, newsroom: fixtures (room: src/scenes/rooms/job_news.js). Ids `furn.job.news.*`.
// Station tags used by the Reporter job: news_assign_board, news_own_desk, news_editor_desk, news_morgue, assignment_place (the stair door: out on a story).
// Visitor tags: news_counter (today's paper, the classifieds), news_layout, news_press, seat.
import { textY, ball } from '../../engine/raster.js';
import { J, bx, tube, post, posts, frameY, frameX, frameZ, plant, cup, lamp, counter, discY, ringY, pix, label, sheet, board, clockY, spines, INK, BRASS, CHROME, PAPER, CREAM, box, qy, qx, qz, lw, fq, lit, glow, cyl, spx, dk, lt, hash2 } from './_lib.js';

const OAK = '#8a5a3a', OAKD = '#5a3a28', GREEN = '#3f6a5a', NEWS = '#ece6d6';
const paperHeap = (x, y, z, n, s) => { for (let i = 0; i < n; i++) bx(x + hash2(i, s) * .04, y + hash2(i, s + 1) * .04, z + i * .025, .3, .22, .025, i % 2 ? PAPER : NEWS); };
const typewriter = (x, y, z, c) => { box(x, y, z, .42, .3, .12, c); bx(x + .04, y, z + .12, .34, .1, .1, dk(c, .15)); qy(x + .08, x + .34, y + .02, z + .22, z + .42, PAPER); for (let i = 0; i < 3; i++) lw([x + .06, y + .14 + i * .05, z + .125], [x + .36, y + .14 + i * .05, z + .125], '#d8dade'); tube([x - .02, y + .05, z + .2], [x + .44, y + .05, z + .2], CHROME); };
const phone = (x, y, z, c, dial) => { box(x, y, z, .24, .2, .08, c); tube([x + .02, y + .04, z + .12], [x + .22, y + .04, z + .12], c); bx(x, y + .02, z + .08, .06, .06, .05, c); bx(x + .18, y + .02, z + .08, .06, .06, .05, c); if (dial) { cyl(x + .12, y + .13, z + .08, .06, .01, PAPER, { ol: false }); spx(x + .12, y + .13, z + .1, 0, 0, INK); } };
const swivel = (x, y, c, lean) => { cyl(x + .22, y + .22, 0, .2, .04, '#3a3f4c', { ol: false }); post(x + .22, y + .22, .04, .4, '#7d858e'); bx(x, y, .4, .44, .44, .07, c); bx(x + (lean || 0), y - .02, .47, .44, .07, .26, c); };

export default [
  /* ---------------- the layout wall: tomorrow's pages ---------------- */
  J('news.layout', ['news_layout', 'noticeboard'], p => [p.w || 4.6, .12, 1.7], p => {
    const w = p.w || 4.6, n = Math.floor((w - .2) / .56);
    board(.05, w - .05, .04, .05, 1.65, '#c8a070', OAKD);
    for (let i = 0; i < n; i++) for (let r = 0; r < 2; r++) { const x = .14 + i * .56, z = .12 + r * .78, k = i + r * n, done = k < (p.done === undefined ? 2 * n - 1 : p.done);
      if (done) sheet(x, .05, z, .46, .66, { c: NEWS, head: k === 0 ? '#2a2733' : '#5a5668', pic: k % 3 === 0 ? ['#9fb8c8', '#c8b898', '#a8c8a0'][k % 3] : null, seed: k + 3, pin: '#b8342e' });
      else { qy(x, x + .46, .05, z, z + .66, '#b89060'); frameY(x, x + .46, .05, z, z + .66, '#a07848'); }
 }
    /* a red-pencil circle on page one and the masthead strip */
    ringY(.5, .06, .5, .12, '#d8342e', 10);
  }, { wall: true, mount: .9, solid: false, use: p => ({ x: (p.w || 4.6) / 2, y: .75 }), variants: [{}, { done: 5 }] }),

  /* ---------------- the assignment board: three slips ---------------- */
  J('news.assign', ['news_assign_board', 'noticeboard'], [1.8, .12, 1.4], p => {
    board(.05, 1.75, .04, .05, 1.35, '#3f6a5a', OAKD); textY('TODAY', .3, .05, 1.32, '#f4e9cf');
    for (let i = 0; i < 3; i++) { const x = .16 + i * .52; sheet(x, .05, .2 + (i % 2) * .08, .42, .56, { c: ['#f8e8a0', PAPER, '#f8d0c0'][i], seed: i + 11, pin: ['#b8342e', '#3c64ad', '#3f8a55'][i] }); }
    lw([.12, .05, .92], [1.68, .05, .92], '#8ab8a0');
  }, { wall: true, mount: 1.0, solid: false, use: { x: .9, y: .75 }, variants: [{}] }),

  /* ---------------- a row of clocks ---------------- */
  J('news.clocks', ['decor', 'clock'], [2.4, .1, .8], p => {
    for (let i = 0; i < 3; i++) { clockY(.4 + i * .8, .05, .5, .26, { h: 2.6 - i * .9, m: 1.2 + i * .5, rim: OAKD }); qy(.2 + i * .8, .6 + i * .8, .05, .02, .16, PAPER); }
    textY('MB', .28, .06, .17, INK); textY('NY', 1.08, .06, .17, INK); textY('LA', 1.88, .06, .17, INK);
  }, { wall: true, mount: 2.2, solid: false, variants: [{}] }),

  /* ---------------- a reporter's desk. kind: own | staff | edwina | photo ---------------- */
  J('news.desk', ['desk', 'news_desk'], [1.7, 1.5, 1.3], p => {
    const k = p.kind || 'staff', c = k === 'edwina' ? '#7a4a34' : OAK, own = k === 'own';
    swivel(.62, .1, own ? '#b8342e' : k === 'edwina' ? '#8a6a8a' : '#3a4a5a', own ? .05 : 0);
    box(0, .66, 0, 1.7, .76, .76, c, { t: lt(c, .14) }); qy(.06, .5, 1.42, .1, .68, dk(c, .14)); frameY(.06, .5, 1.42, .1, .68, dk(c, .4)); for (const z of [.3, .5]) lw([.1, 1.42, z], [.46, 1.42, z], dk(c, .4)); qy(.56, 1.64, 1.42, .1, .68, dk(c, .3));
    if (k === 'edwina') {
      /* the shoebox card index, the dial telephone, a magnifying glass, a lamp with a fringe, a vase */
      box(.12, .78, .76, .5, .3, .18, '#c8a070'); for (let i = 0; i < 9; i++) lw([.16 + i * .05, .8, .95], [.16 + i * .05, 1.04, .95], i % 3 ? PAPER : '#f8e080'); qy(.2, .5, 1.08, .8, .9, PAPER);
      phone(1.3, .8, .76, '#22202a', true); ringY(.84, 1.2, .8, .07, BRASS, 8); lw([.9, 1.2, .76], [.98, 1.2, .76], OAKD);
      lamp(1.5, 1.24, .76, .5, '#c8a8c8'); cyl(.74, .8, .76, .05, .14, '#9fd4e6', { ol: false }); ball(.74, .8, 1.0, .08, '#e87aa0', { ol: false }); qz(.76, 1.2, .98, 1.3, .765, PAPER, NEWS);
    } else if (k === 'photo') {
      /* contact sheets, two cameras, a loupe, a flask */
      for (let i = 0; i < 2; i++) { qz(.14 + i * .5, .56 + i * .5, .8, 1.14, .765, '#22202a'); for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) qz(.17 + i * .5 + a * .13, .27 + i * .5 + a * .13, .83 + b * .1, .9 + b * .1, .77, ['#c8ccd4', '#9aa0a8', '#e8e2d4'][(a + b + i) % 3]); }
      box(1.2, .78, .76, .26, .16, .16, '#22202a'); cyl(1.33, .96, .8, .07, .06, '#3a3f4c', { ol: false }); box(1.3, 1.1, .76, .22, .14, .13, '#3a3f4c'); cyl(.9, 1.26, .76, .05, .16, CHROME, { ol: false });
    } else {
      typewriter(.6, .76, .76, own ? '#3f6a5a' : '#4a4f5c'); phone(1.3, .8, .76, own ? '#b8342e' : '#22202a'); paperHeap(.1, .76, .76, own ? 3 : 6, p.seed || 1); paperHeap(.14, 1.1, .76, own ? 1 : 4, (p.seed || 1) + 5);
      cup(1.2, 1.2, .76, own ? '#f2c230' : PAPER); lamp(1.52, 1.22, .76, .46, GREEN); if (own) { qz(.66, 1.0, 1.12, 1.34, .765, '#f8e8a0'); post(1.1, 1.3, .76, .9, '#f2c230'); }
      else bx(.9, 1.12, .76, .3, .2, .05, '#3a3f4c');
    }
  }, { use: { x: .85, y: 1.9 }, staff: p => (p.kind === 'own' ? { x: .84, y: .32, dir: 1 } : null), seats: p => (p.kind === 'own' ? [{ x: .84, y: .32, z: .5, dir: 1, staff: true }] : []), variants: [{}, { kind: 'own' }, { kind: 'edwina' }, { kind: 'photo' }] }),

  /* ---------------- Max's desk ---------------- */
  J('news.editor', ['news_editor_desk', 'desk'], [2.4, 1.7, 1.4], p => {
    const c = '#5a3a28';
    swivel(.98, .12, '#22202a');
    box(0, .76, 0, 2.4, .86, .8, c, { t: '#3f6a5a' }); frameZ(.06, 2.34, .82, 1.56, .805, BRASS); for (let i = 0; i < 3; i++) { frameY(.08 + i * .78, .76 + i * .78, 1.62, .1, .72, dk(c, .35)); spx(.42 + i * .78, 1.62, .42, 0, 0, BRASS); }
    /* proofs, the spike, a mug of red pencils, DEADLINE mug, the in-tray, a brass lamp, the bell */
    for (let i = 0; i < 3; i++) { qz(.5 + i * .44, .9 + i * .44, 1.0, 1.5, .81, PAPER, NEWS); lw([.56 + i * .44, 1.1, .815], [.84 + i * .44, 1.1, .815], '#2a2733'); lw([.56 + i * .44, 1.2, .815], [.8 + i * .44, 1.2, .815], '#8a8698'); ringY(.7 + i * .44, 1.34, .82, .05, '#d8342e', 6); }
    cyl(.24, 1.0, .8, .07, .02, '#3a3f4c', { ol: false }); post(.24, 1.0, .82, 1.12, CHROME); for (let i = 0; i < 4; i++) bx(.14, .92, .84 + i * .04, .2, .16, .02, i % 2 ? PAPER : '#f8e8a0');
    cyl(2.1, .96, .8, .07, .13, '#f1ede4', { ol: false }); for (let i = 0; i < 4; i++) post(2.06 + i * .025, .96, .92, 1.06, '#d8342e'); cyl(1.9, 1.36, .8, .07, .12, '#2a2733', { ol: false, t: '#6a4a30' });
    box(.1, 1.24, .8, .34, .3, .1, '#8a5a3a'); qz(.12, .42, 1.26, 1.52, .9, PAPER); lamp(2.2, 1.44, .8, .56, GREEN, { base: BRASS });
  }, { use: { x: 1.2, y: 2.1 }, variants: [{}] }),

  /* ---------------- the morgue: cabinets of cuttings ---------------- */
  J('news.morgue', ['news_morgue', 'filing'], p => [p.w || 3, .7, 2], p => {
    const w = p.w || 3, n = Math.round(w / .6), c = '#6f8a7a';
    box(0, 0, 0, w, .7, 1.96, c);
    for (let i = 0; i < n; i++) for (let r = 0; r < 5; r++) { const x = i * .6, z = .06 + r * .38, open = i === 1 && r === 2;
      if (open) { bx(x + .03, .7, z, .54, .34, .34, dk(c, .08)); qz(x + .06, x + .54, .72, 1.0, z + .34, NEWS, PAPER); for (let k = 0; k < 6; k++) lw([x + .08, .74 + k * .04, z + .345], [x + .52, .74 + k * .04, z + .345], k % 2 ? '#f8e080' : '#b8b2a2'); }
      else { qy(x + .03, x + .57, .7, z, z + .34, dk(c, .06)); frameY(x + .03, x + .57, .7, z, z + .34, dk(c, .4)); qy(x + .2, x + .4, .71, z + .2, z + .28, PAPER); bx(x + .24, .7, z + .08, .12, .03, .03, CHROME); textY('ABCDEFGHIJKLMNOPQRSTUVWXYZ'[(i * 5 + r) % 26], x + .26, .72, z + .3, INK); } }
    /* a box of unfiled photographs on top */
    box(.2, .1, 1.96, .6, .4, .2, '#c8a070'); qz(.24, .76, .14, .46, 2.16, '#22202a', '#c8ccd4');
  }, { vb: p => [-.2, -.2, 0, (p.w || 3) + .2, 1.2, 2.3], use: p => ({ x: .9, y: 1.4 }), variants: [{}] }),

  /* ---------------- the darkroom door: a red light and a line of prints ---------------- */
  J('news.darkroom', ['news_darkroom', 'door'], [2.4, .14, 2.3], p => {
    qy(0, 1.1, .04, 0, 2.0, '#3a3640'); qy(.08, 1.02, .06, 0, 1.92, '#22202a'); frameY(.08, 1.02, .06, 0, 1.92, '#5a5664'); spx(.9, .07, .96, 0, 0, BRASS); spx(.9, .07, .96, 0, 1, BRASS);
    qy(.2, .9, .07, 1.36, 1.56, '#b8342e'); textY('DARK', .28, .08, 1.55, PAPER);
    lit(() => { bx(.42, .04, 2.04, .26, .1, .14, '#ff3020'); }); glow(() => { qy(.2, .9, .07, 1.92, 2.3, '#ff7060', 'glass'); });
    /* prints drying on a line */
    lw([1.2, .05, 1.72], [2.36, .05, 1.64], '#8a8698'); for (let i = 0; i < 4; i++) { const x = 1.26 + i * .28; qy(x, x + .22, .06, 1.34, 1.66, ['#c8ccd4', '#9aa0a8', '#e8e2d4', '#b8bcc4'][i]); qy(x + .03, x + .19, .07, 1.4, 1.6, ['#5a5668', '#3a3644', '#7a7888', '#4a4658'][i]); spx(x + .11, .07, 1.67, 0, 0, '#b07444'); }
  }, { wall: true, mount: 0, solid: false, use: { x: .55, y: .6 }, variants: [{}] }),

  /* ---------------- the proof press, the wire machine, bundles for the vans ---------------- */
  J('news.press', ['news_press', 'machine'], [2.4, 1.2, 1.5], p => {
    /* flatbed proof press */
    box(0, .1, 0, 1.5, .9, .7, '#3a4a4a', { t: '#5a6a6a' }); for (const x of [.1, 1.3]) bx(x, .06, .7, .1, .98, .34, '#2a3838'); cyl(.75, .55, .84, .2, .18, '#4a5a5a', { t: '#6a7a7a' }); tube([.2, .55, .93], [1.3, .55, .93], '#2a3838');
    qz(.2, 1.3, .2, .9, .705, '#22202a'); qz(.3, 1.2, .26, .84, .71, NEWS, PAPER); for (let i = 0; i < 5; i++) lw([.36, .32 + i * .1, .715], [1.1, .32 + i * .1, .715], '#8a8698');
    tube([1.44, .55, .9], [1.7, .55, 1.3], CHROME); spx(1.7, .55, 1.3, 0, -1, '#b8342e');
    discY(.3, 1.0, .36, .14, BRASS, 10); discY(.3, 1.01, .36, .06, '#3a4a4a', 6);
    /* the wire machine (a teletype on a stand) with a tongue of paper */
    box(1.72, .2, 0, .6, .5, .7, '#5a5664'); box(1.74, .22, .7, .56, .46, .3, '#8a9098'); qy(1.8, 2.24, .68, .78, .94, '#22202a'); lit(() => { spx(2.2, .68, .96, 0, 0, '#5af08a'); });
    qy(1.86, 2.2, .7, .3, .78, PAPER); for (let i = 0; i < 5; i++) lw([1.9, .71, .7 - i * .08], [2.1 + hash2(i, 7) * .08, .71, .7 - i * .08], '#8a8698');
  }, { vb: [-.2, -.2, 0, 2.6, 1.5, 1.6], use: { x: 1.2, y: 1.65 }, variants: [{}] }),
  J('news.bundles', ['decor', 'news_bundles'], p => [1, 1, .9], p => {
    const n = p.n || 5; for (let i = 0; i < n; i++) { const x = (i % 2) * .5, y = (i >> 1) % 2 * .46, z = Math.floor(i / 4) * .32; box(x + .03, y + .03, z, .44, .4, .3, i % 3 ? NEWS : PAPER, { l: (u, v) => (v % 2 ? '#d8d2c2' : NEWS) }); lw([x + .25, y + .03, z + .3], [x + .25, y + .43, z + .3], '#b07444'); lw([x + .03, y + .23, z + .3], [x + .47, y + .23, z + .3], '#b07444'); qz(x + .08, x + .42, y + .08, y + .16, z + .305, '#2a2733'); }
  }, { variants: [{}, { n: 7 }] }),

  /* ---------------- the front counter: today's paper, the classifieds ---------------- */
  J('news.counter', ['news_counter', 'counter'], p => [p.w || 2.6, .8, 1.3], p => {
    const w = p.w || 2.6; counter(0, 0, w, .8, 1.0, OAK, '#d8c8a0'); qy(.3, w - .3, .8, .5, .8, '#2a2733'); label('GAZETTE', .3, w - .3, .81, .8, '#f4e9cf');
    /* a brass bell, a stack of today's paper, the classifieds forms, a pen on a chain */
    cyl(.3, .5, 1.0, .08, .06, BRASS, { ol: false }); spx(.3, .5, 1.08, 0, 0, '#fff2b0');
    for (let i = 0; i < 5; i++) bx(.9, .3, 1.0 + i * .025, .5, .36, .025, i % 2 ? NEWS : PAPER); qz(.94, 1.36, .34, .44, 1.13, '#2a2733'); qz(.94, 1.14, .46, .62, 1.13, '#9fb8c8');
    bx(w - .7, .3, 1.0, .44, .34, .04, '#f8e8a0'); lw([w - .66, .4, 1.045], [w - .34, .4, 1.045], '#8a8698'); lw([w - .66, .5, 1.045], [w - .4, .5, 1.045], '#8a8698'); tube([w - .2, .5, 1.0], [w - .16, .6, 1.1], INK);
  }, { use: p => ({ x: (p.w || 2.6) / 2, y: 1.25 }), staff: p => ({ x: (p.w || 2.6) / 2, y: -.35, dir: 1 }), variants: [{}] }),

  /* ---------------- the stair door: out on a story (hooks, a press bag, an umbrella) ---------------- */
  J('news.stairdoor', ['assignment_place', 'door', 'news_stairs'], [2.2, .2, 2.2], p => {
    qy(0, 1.1, .04, 0, 2.0, '#e8dcc0'); qy(.08, 1.02, .06, 0, 1.92, GREEN); frameY(.08, 1.02, .06, 0, 1.92, dk(GREEN, .4)); qy(.26, .84, .07, 1.1, 1.7, '#d8e8e0', '#c8dcd4'); frameY(.26, .84, .07, 1.1, 1.7, dk(GREEN, .4)); textY('OUT', .36, .08, 1.5, dk(GREEN, .3));
    spx(.92, .08, .98, 0, 0, BRASS); spx(.92, .08, .98, 0, 1, BRASS); lit(() => { qy(.3, .8, .06, 1.98, 2.14, '#3f9a5a'); }); 
    /* coat hooks */
    bx(1.25, .02, 1.56, .9, .05, .08, OAKD); for (let i = 0; i < 3; i++) spx(1.4 + i * .3, .08, 1.58, 0, 0, BRASS);
    qy(1.26, 1.56, .1, .8, 1.56, '#c8a868'); lw([1.41, .1, .8], [1.41, .1, 1.5], dk('#c8a868', .3)); qy(1.3, 1.52, .1, 1.5, 1.58, dk('#c8a868', .15));
    box(1.62, .06, .98, .34, .12, .36, '#6a5a3a'); tube([1.66, .12, 1.34], [1.72, .1, 1.58], '#5a4a2a'); qy(1.68, 1.9, .19, 1.14, 1.24, PAPER); textY('P', 1.74, .2, 1.26, '#b8342e');
    tube([2.02, .12, .1], [2.02, .12, 1.0], '#2a2733'); tube([2.02, .12, 1.0], [2.08, .12, 1.06], OAKD);
  }, { wall: true, mount: 0, solid: false, use: { x: .55, y: .65 }, variants: [{}] }),

  /* ---------------- the big window: blinds, and downtown ---------------- */
  J('news.window', ['window', 'decor'], p => [p.w || 3, .1, 1.6], p => {
    const w = p.w || 3; qy(0, w, .03, 0, 1.54, '#5a3a28'); qy(.08, w - .08, .04, .08, 1.46, '#9fd4e6', '#b8e2ee'); glow(() => qy(.08, w - .08, .04, .08, 1.46, '#1f2a52', '#2a3666'));
    /* the skyline */
    for (let i = 0; i < Math.floor(w / .34); i++) { const h = .3 + hash2(i, 5) * .7, x = .1 + i * .34; qy(x, x + .3, .045, .08, .08 + h, ['#8a9ab0', '#9aa8b8', '#7a8aa0'][i % 3]); glow(() => { for (let k = 0; k < 4; k++) if (hash2(i, k, 2) > .4) spx(x + .08 + (k % 2) * .12, .05, .2 + Math.floor(k / 2) * .2 + hash2(i, k) * .2, 0, 0, '#ffe680'); }); }
    for (let z = 1.42; z > 1.0; z -= .1) lw([.08, .05, z], [w - .08, .05, z], '#e8e2d4'); for (let i = 1; i < Math.round(w); i++) lw([w * i / Math.round(w), .05, .08], [w * i / Math.round(w), .05, 1.46], '#5a3a28');
    frameY(.08, w - .08, .05, .08, 1.46, '#3a2a20'); bx(-.04, .03, -.06, w + .08, .12, .06, '#5a3a28');
  }, { wall: true, mount: .9, solid: false, variants: [{}] }),
  J('news.frontpage', ['decor', 'news_frontpage'], p => [1, .1, 1.3], p => {
    qy(.05, .95, .03, .05, 1.25, OAKD); sheet(.12, .04, .12, .76, 1.06, { c: p.c || '#e8dcb8', head: '#2a2733', pic: p.pic || '#9fb8c8', seed: p.seed || 2 });
  }, { wall: true, mount: 1.1, solid: false, variants: [{}, { seed: 7, pic: '#c8b898' }] }),
];
