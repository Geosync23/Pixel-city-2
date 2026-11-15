// Maple Bay Fire Station No. 2: the fixtures of the engine bay and the watch room (room: src/scenes/rooms/job_fire.js). Ids `furn.job.fire.*`.
// Station tags used by the Firefighter job: fire_engine + call_scene (Engine 2), fire_gear_hooks (the turnout rack), fire_hose_rack, fire_kitchen, fire_bunk.
// Visitor tags: fire_pole, fire_tortoise, fire_board, fire_bell, seat (the mess table).
import { textY, textX, ball } from '../../engine/raster.js';
import { J, K, bx, tube, post, posts, frameY, frameX, frameZ, counter, plant, cup, plate, steam, lamp, discY, ringY, pix, label, sheet, board, clockY, INK, BRASS, CHROME, PAPER, box, qy, qx, qz, lw, fq, lit, glow, cyl, spx, dk, lt, hash2 } from './_lib.js';

const RED = '#c8322c', REDD = '#9a2420', GOLD = '#f2c230', TAN = '#c8a468', NAVY = '#2f3f72', TIRE = '#33303f';
const wheel = (cx, y, r) => { discY(cx, y, r, r, TIRE); discY(cx, y + .01, r, r * .58, '#b8bcc4'); discY(cx, y + .02, r, r * .26, RED); ringY(cx, y + .01, r, r * .58, '#7d858e'); };
/* a turnout coat on a hook: tan with a reflective band */
const coat = (x, y, z, c) => { qy(x, x + .34, y, z, z + .62, c); qy(x + .04, x + .3, y, z + .62, z + .7, dk(c, .12)); qy(x, x + .34, y, z + .1, z + .17, '#e8e04a'); qy(x, x + .34, y, z + .12, z + .15, '#d5dbe0'); qy(x, x + .34, y, z + .4, z + .46, '#e8e04a'); lw([x + .17, y, z], [x + .17, y, z + .62], dk(c, .3)); frameY(x, x + .34, y, z, z + .62, dk(c, .45)); };
const helmet = (x, y, z, c) => { bx(x - .02, y - .12, z, .34, .26, .04, dk(c, .2)); bx(x + .04, y - .1, z + .04, .22, .2, .14, c); spx(x + .15, y + .1, z + .1, 0, 0, GOLD); lw([x + .04, y + .1, z + .18], [x + .26, y + .1, z + .18], lt(c, .35)); };
const boots = (x, y, c) => { bx(x, y, 0, .13, .2, .2, TIRE); bx(x + .17, y, 0, .13, .2, .2, TIRE); bx(x - .02, y - .02, .16, .36, .24, .2, c); qy(x - .02, x + .34, y + .22, .22, .27, '#e8e04a'); lw([x + .04, y + .22, .36], [x + .04, y + .22, .62], '#b8342e'); lw([x + .28, y + .22, .36], [x + .28, y + .22, .62], '#b8342e'); };

export default [
  /* ---------------- Engine 2 ---------------- */
  J('fire.engine', ['fire_engine', 'call_scene', 'vehicle'], [6, 2.2, 2.6], p => {
    const y1 = 2.2;
    /* shadow + chassis */
    qz(.1, 6.05, .15, 2.3, .01, '#3a3640', '#4a4654'); bx(.2, .2, .32, 5.7, 1.8, .14, '#3a3f4c');
    /* rear body: compartments, pump panel, hose bed */
    box(.1, .1, .46, 3.9, 2, 1.34, RED, { t: '#b8bcc4' });
    for (let i = 0; i < 3; i++) { const a = .22 + i * .98, b = a + .86; qy(a, b, y1 - .1, .62, 1.36, (u, v) => (v % 2 ? '#c4cad0' : '#aab0b8')); frameY(a, b, y1 - .1, .62, 1.36, '#7d858e'); bx(a + .36, y1 - .1, .68, .14, .03, .03, INK); }
    qy(.1, 4, y1 - .1, 1.39, 1.47, GOLD); qy(.1, 4, y1 - .1, 1.41, 1.45, PAPER);
    /* pump panel */
    qy(3.18, 3.98, y1 - .1, .62, 1.36, '#4a4f5c'); frameY(3.18, 3.98, y1 - .1, .62, 1.36, INK);
    for (const [gx, gz, c] of [[3.34, 1.22, PAPER], [3.58, 1.22, PAPER], [3.82, 1.22, PAPER], [3.34, 1.02, PAPER], [3.58, 1.02, '#f2c230']]) { discY(gx, y1 - .09, gz, .08, c, 10); spx(gx, y1 - .08, gz, 0, 0, '#b8342e'); }
    for (const [cx, c] of [[3.34, '#d8a848'], [3.58, '#d8a848'], [3.82, '#b8342e']]) { discY(cx, y1 - .09, .8, .07, c, 8); bx(cx - .03, y1 - .1, .78, .06, .08, .05, dk(c, .2)); }
    lit(() => { spx(3.82, y1 - .08, 1.02, 0, 0, '#5af08a'); spx(3.82, y1 - .08, 1.02, 1, 0, '#5af08a'); });
    /* hose bed + ladder on top */
    bx(.25, .25, 1.8, 3.6, 1.2, .16, '#e8dcb8', { t: (x, y) => (Math.floor(y * 10) % 2 ? '#e8dcb8' : '#d0c090') }); bx(.25, 1.5, 1.8, 3.6, .5, .1, '#8a9098');
    for (const yy of [1.56, 1.92]) tube([.2, yy, 1.96], [4.1, yy, 1.96], CHROME); for (let x = .4; x < 4.1; x += .34) lw([x, 1.56, 1.96], [x, 1.92, 1.96], CHROME);
    /* rear step + tail lights */
    bx(0, .3, .3, .14, 1.6, .1, '#8a9098'); lit(() => { qy(.12, .24, y1 - .1, .5, .58, '#ff5040'); });
    /* cab */
    box(4, .1, .46, 1.9, 2, 1.62, RED, { t: PAPER });
    qy(4.12, 4.98, y1 - .1, 1.22, 1.9, '#9fd4e6', '#b8e2ee'); frameY(4.12, 4.98, y1 - .1, 1.22, 1.9, INK); qy(5.1, 5.72, y1 - .1, 1.22, 1.9, '#9fd4e6', '#b8e2ee'); frameY(5.1, 5.72, y1 - .1, 1.22, 1.9, INK);
    frameY(4.1, 5.0, y1 - .1, .56, 1.94, REDD); spx(4.9, y1 - .09, 1.08, 0, 0, CHROME); spx(4.9, y1 - .09, 1.08, 1, 0, CHROME);
    qy(4, 5.9, y1 - .1, 1.02, 1.12, GOLD); qy(4, 5.9, y1 - .1, 1.05, 1.09, PAPER);
    textY('2', 4.5, y1 - .09, .98, GOLD); textY('ENGINE 2', .9, y1 - .09, 1.8, GOLD);
    /* nose (+x face): windshield, grille, lamps, bumper */
    qx(5.9, .22, 1.98, 1.24, 1.92, '#9fd4e6', '#b8e2ee'); frameX(5.9, .22, 1.98, 1.24, 1.92, INK); lw([5.9, 1.1, 1.24], [5.9, 1.1, 1.92], INK);
    qx(5.9, .6, 1.6, .62, 1.02, '#c4cad0', '#8a9098'); frameX(5.9, .6, 1.6, .62, 1.02, '#7d858e'); textX('2', 5.91, 1.2, 1.18, GOLD);
    lit(() => { qx(5.91, .24, .5, .68, .92, '#fff2b0'); qx(5.91, 1.7, 1.96, .68, .92, '#fff2b0'); });
    box(5.85, .05, .3, .2, 2.1, .2, CHROME);
    /* light bar */
    bx(4.5, .4, 2.08, .9, 1.4, .06, INK); lit(() => { bx(4.55, .45, 2.14, .8, .5, .12, '#ff4030'); bx(4.55, 1.25, 2.14, .8, .5, .12, '#ff4030'); bx(4.55, .97, 2.14, .8, .26, .12, '#f4fbfc'); });
    glow(() => { qz(4.3, 5.5, .2, 2, 2.3, '#ff8070', 'glass'); });
    /* wheels on the +y side, wheel arches */
    for (const cx of [.95, 1.75, 5.05]) { qy(cx - .5, cx + .5, y1 - .1, .46, .96, '#3a2a30'); wheel(cx, y1 - .04, .42); }
    /* wheel chock */
    bx(2.3, 2.16, 0, .3, .14, .14, GOLD);
  }, { vb: [-.2, -.2, 0, 6.4, 2.6, 2.6], use: { x: 3.6, y: 2.75 }, variants: [{}] }),

  /* ---------------- the turnout rack: a bay per firefighter ---------------- */
  J('fire.gear', ['fire_gear_hooks', 'lockers'], p => [p.w || 4, .6, 2.2], p => {
    const w = p.w || 4, n = Math.round(w / .8), names = ['JO', 'DUT', 'TUL', 'YOU', '', ''], hc = ['#f4f0e8', '#f2c230', '#f2c230', '#f2c230', '#2a2733', '#2a2733'];
    box(0, 0, 0, w, .12, 2.2, '#8a3a34'); bx(0, 0, 2.1, w, .6, .1, '#7a2e2a'); bx(0, 0, 1.55, w, .6, .05, '#9a4a40');
    for (let i = 0; i <= n; i++) { const x = Math.min(w - .05, i * w / n); bx(x, 0, 0, .05, .6, 2.1, '#8a3a34'); }
    for (let i = 0; i < n; i++) { const x = i * w / n + .05, me = i === 3;
      qy(x, x + w / n - .05, .13, 0, 1.55, '#5a2a2c'); lw([x + .06, .14, 1.44], [x + w / n - .12, .14, 1.44], CHROME);
      if (i < 4) { coat(x + .1, .3, .72, i === 0 ? '#3a3f4c' : TAN); helmet(x + .1, .4, 1.6, hc[i]); boots(x + .12, .32, i === 0 ? '#3a3f4c' : TAN); }
      else { helmet(x + .1, .4, 1.6, hc[i]); bx(x + .1, .3, 0, .4, .22, .3, '#4a4f5c'); cyl(x + .3, .42, .3, .1, .46, '#f2c230', { ol: false }); }
      qy(x + .02, x + w / n - .08, .61, 1.86, 2.2, me ? GOLD : PAPER); if (names[i]) label(names[i], x + .04, x + w / n - .1, .62, 2.19, INK);
    }
  }, { use: p => ({ x: (p.w || 4) / 2 + .7, y: 1.05 }), variants: [{ w: 4 }, { w: 3.2 }] }),

  /* ---------------- the pole ---------------- */
  J('fire.pole', ['fire_pole'], [1, 1, 3], p => {
    cyl(.5, .5, 0, .46, .06, '#b8342e', { t: '#d8483b' }); cyl(.5, .5, .06, .3, .03, '#8a2a24', { ol: false });
    for (let k = 0; k < 2; k++) lw([.5 + k / 16, .5, .08], [.5 + k / 16, .5, 2.95], k ? '#b8882a' : BRASS); lw([.5, .5, .6], [.5, .5, 1.1], '#fff2b0');
    cyl(.5, .5, 2.86, .12, .1, BRASS, { ol: false, t: '#b8882a' });
    box(.0, .0, 0, .08, .08, .9, GOLD, { ol: false }); box(.92, .0, 0, .08, .08, .9, GOLD, { ol: false }); tube([.04, .04, .88], [.96, .04, .88], GOLD);
  }, { vb: [-.2, -.2, 0, 1.2, 1.2, 3.1], solid: true, use: { x: .5, y: 1.3 }, variants: [{}] }),

  /* ---------------- the hose rack ---------------- */
  J('fire.hoses', ['fire_hose_rack'], p => [p.w || 2.2, .6, 2], p => {
    const w = p.w || 2.2; posts(.03, .05, w - .06, .5, 0, 1.95, '#7d858e'); for (const z of [.05, .68, 1.31, 1.92]) bx(0, .02, z, w, .56, .04, '#8a9098');
    for (let r = 0; r < 3; r++) for (let i = 0; i < Math.floor(w / .62); i++) { if (r === 2 && i === 1) continue; const cx = .34 + i * .62, cz = .09 + r * .63 + .27, c = (i + r) % 3 === 1 ? '#d8483b' : (i + r) % 3 ? '#e8dcb8' : '#f2c230';
      discY(cx, .56, cz, .27, c); for (const rr of [.2, .13, .07]) ringY(cx, .57, cz, rr, dk(c, .28), 10); discY(cx, .58, cz, .04, BRASS, 6); bx(cx + .2, .5, cz - .27, .12, .08, .06, BRASS); }
    /* one being rolled on the floor */
    qz(w + .0, w + .9, .35, .5, .02, '#e8dcb8', '#d0c090'); discY(w + .1, .56, .2, .2, '#e8dcb8'); ringY(w + .1, .57, .2, .12, '#b8a878', 8);
    qy(.1, w - .1, .59, 1.75, 1.9, PAPER); lw([.2, .6, 1.82], [w - .2, .6, 1.82], '#b8342e');
  }, { vb: p => [-.2, -.2, 0, (p.w || 2.2) + 1.1, .9, 2.1], use: p => ({ x: (p.w || 2.2) / 2, y: 1.1 }), variants: [{}] }),

  /* ---------------- the kitchen: Dutch's stove ---------------- */
  J('fire.kitchen', ['fire_kitchen', 'kitchen'], p => [p.w || 3.6, .8, 2.3], p => {
    const w = p.w || 3.6, c = '#6f8a8a';
    counter(0, 0, w, .8, .95, c, '#d8d2c4');
    /* range in the middle */
    box(1.2, 0, 0, 1.2, .8, .96, '#b8bcc4'); qy(1.26, 2.34, .8, .16, .62, '#3a3f4c'); frameY(1.26, 2.34, .8, .16, .62, '#7d858e'); tube([1.3, .82, .68], [2.3, .82, .68], CHROME); for (let i = 0; i < 5; i++) discY(1.34 + i * .23, .81, .84, .04, INK, 6);
    qz(1.22, 2.38, .04, .76, .97, '#3a3f4c'); for (const [x, y] of [[1.5, .25], [2.1, .25], [1.5, .58], [2.1, .58]]) { cyl(x, y, .97, .13, .01, '#22202a', { ol: false }); }
    lit(() => { for (const [x, y] of [[1.5, .58], [2.1, .25]]) for (let a = 0; a < 6; a++) spx(x + Math.cos(a) * .1, y + Math.sin(a) * .1, .98, 0, 0, '#6fb6ff'); });
    /* the chili pot + a kettle */
    cyl(1.5, .56, .99, .2, .3, '#c8322c', { t: '#7a2a1a' }); cyl(1.5, .56, 1.27, .16, .02, '#9a3a1a', { ol: false, t: '#b84a20' }); spx(1.5, .56, 1.3, -2, 0, '#e8b83a'); spx(1.5, .56, 1.3, 2, -1, '#3f8a55'); steam(1.5, .56, 1.36, 5); bx(1.26, .52, 1.14, .06, .08, .03, INK); bx(1.7, .52, 1.14, .06, .08, .03, INK);
    cyl(2.1, .26, .99, .11, .14, '#d5dbe0', { ol: false }); tube([2.2, .26, 1.08], [2.28, .26, 1.14], '#d5dbe0'); tube([2.02, .26, 1.14], [2.18, .26, 1.14], INK);
    tube([1.72, .62, 1.26], [1.86, .7, 1.5], '#b07444');
    /* sink side + drying rack */
    qz(.25, .95, .2, .62, .96, '#8a9098', '#b8bcc4'); tube([.6, .14, .96], [.6, .14, 1.22], CHROME); tube([.6, .14, 1.22], [.6, .32, 1.22], CHROME);
    for (let i = 0; i < 4; i++) plate(2.68 + i * .2, .3, .97 + i * .02, PAPER); cup(3.2, .6, .96, '#3c64ad'); cup(3.36, .56, .96, '#f2c230'); cyl(2.7, .62, .96, .07, .22, '#b8342e', { ol: false }); cyl(2.86, .62, .96, .06, .18, '#3f8a55', { ol: false });
    /* shelf of named mugs, hanging pans, the rota */
    bx(0, 0, 1.62, w, .26, .05, '#b07444'); const mc = ['#f1ede4', '#c8322c', '#f2c230', '#3c64ad', '#3f8a55', '#f1ede4', '#e87aa0'];
    for (let i = 0; i < 7; i++) { cyl(.2 + i * .22, .14, 1.67, .06, .12, mc[i], { ol: false }); spx(.2 + i * .22, .2, 1.72, 2, 0, mc[i]); }
    tube([1.9, .2, 1.6], [3.5, .2, 1.6], '#3a3f4c'); for (const [x, r, c2] of [[2.1, .16, '#3a3f4c'], [2.5, .13, '#8a5a3a'], [2.86, .1, '#3a3f4c']]) { lw([x, .2, 1.6], [x, .2, 1.52], '#3a3f4c'); discY(x, .21, 1.52 - r - .06, r, c2, 10); lw([x, .21, 1.52], [x, .21, 1.46], dk(c2, .3)); }
    board(3.0, 3.52, .03, 1.76, 2.2, '#2f3f38'); for (let i = 0; i < 5; i++) lw([3.05, .04, 2.12 - i * .07], [3.25 + hash2(i, 3) * .22, .04, 2.12 - i * .07], i ? '#c8d0c8' : '#f2c230');
    qy(.1, 1.5, .03, 1.75, 2.2, PAPER); frameY(.1, 1.5, .03, 1.75, 2.2, '#b8342e'); label('CHILI', .1, 1.5, .04, 2.16, '#b8342e'); textY('SUN', .16, .04, 1.84, INK); pix(1.0, .04, 1.78, ['.rrr.', 'rrrrr', 'rrrrr', '.kkk.'], { r: '#c8322c', k: INK });
  }, { use: p => ({ x: 1.8, y: 1.25 }), staff: p => ({ x: 1.8, y: 1.25, dir: 3 }), variants: [{}] }),

  /* ---------------- the mess table: benches both sides ---------------- */
  J('fire.table', ['table', 'seating', 'seat', 'fire_table'], p => [3.2, 1.9, .82], p => {
    const c = '#b07444';
    for (const y of [.02, 1.5]) { posts(.3, y + .06, 2.6, .26, 0, .42, '#5a3a28'); bx(.2, y, .42, 2.8, .38, .06, '#8a5a3a'); }
    posts(.2, .56, 2.8, .78, 0, .72, '#5a3a28'); box(.05, .46, .72, 3.1, .98, .09, c, { t: (x, y) => (Math.floor(x * 5) % 2 ? '#c08454' : '#b07444') });
    /* bowls, a hot sauce, the paper, a tin of biscuits */
    for (const [x, y] of [[.5, .68], [1.3, .7], [2.5, .7], [.9, 1.2], [2.1, 1.22]]) { cyl(x, y, .81, .11, .06, PAPER, { ol: false, t: '#a84a20' }); }
    cyl(1.7, .95, .81, .05, .2, '#c8322c', { ol: false }); cyl(1.86, .92, .81, .05, .14, '#f1ede4', { ol: false }); qz(2.55, 3.0, 1.0, 1.32, .815, PAPER, '#e0dccf'); lw([2.6, 1.1, .82], [2.95, 1.1, .82], '#8a8698'); lw([2.6, 1.2, .82], [2.9, 1.2, .82], '#8a8698');
    cyl(.4, 1.05, .81, .13, .1, '#2f3f72', { t: '#f2c230' });
  }, { seats: [{ x: .7, y: .2, z: .48, dir: 1 }, { x: 1.6, y: .2, z: .48, dir: 1 }, { x: 2.5, y: .2, z: .48, dir: 1 }, { x: .7, y: 1.7, z: .48, dir: 3 }, { x: 1.6, y: 1.7, z: .48, dir: 3 }, { x: 2.5, y: 1.7, z: .48, dir: 3 }], use: { x: 1.6, y: 2.3 }, variants: [{}] }),

  /* ---------------- a bunk: boots in the pants, pants by the bunk ---------------- */
  J('fire.bunk', ['fire_bunk', 'bed'], p => [2.2, 1.1, 1.9], p => {
    const c = p.c || '#b8342e', fr = '#7d858e';
    posts(.04, .04, 2.12, 1.02, 0, 1.9, fr);
    for (const z of [.36, 1.26]) { bx(.04, .04, z, 2.12, 1.02, .08, fr); box(.08, .08, z + .08, 2.04, .94, .16, '#e8e2d4'); box(.55, .08, z + .2, 1.57, .94, .08, z > 1 ? '#2f3f72' : c, { t: z > 1 ? '#3b4f8a' : lt(c, .12) }); bx(.12, .2, z + .24, .36, .7, .08, PAPER); lw([.55, 1.02, z + .28], [2.12, 1.02, z + .28], lt(c, .3)); }
    tube([.04, 1.06, 1.5], [.04, 1.06, 1.9], fr); for (const z of [.6, .9, 1.2]) lw([2.16, .3, z], [2.16, .8, z], fr); lw([2.16, .3, .36], [2.16, .3, 1.34], fr); lw([2.16, .8, .36], [2.16, .8, 1.34], fr);
    boots(1.0, 1.12, TAN);
  }, { vb: [-.2, -.2, 0, 2.4, 1.5, 2], bed: { x: 1.2, y: .55, z: .62, dir: 0 }, pose: { x: 1.2, y: .55, z: .62, dir: 0, anim: 'sleep' }, use: { x: 1.2, y: 1.6 }, variants: [{}, { c: '#3f6a5a' }] }),

  /* ---------------- the watch desk: radio, logbook, the map ---------------- */
  J('fire.watch', ['fire_watch', 'desk'], p => [2, 1.5, 1.4], p => {
    const c = '#6a4428';
    /* the chair behind */
    posts(1.2, .18, .4, .36, 0, .44, '#3a3f4c'); bx(1.16, .14, .44, .48, .44, .07, '#2f3f72'); bx(1.16, .1, .5, .48, .07, .26, '#2f3f72');
    box(0, .7, 0, 2, .7, .82, c, { t: '#8a5a3a' }); frameY(.1, .9, 1.4, .1, .7, dk(c, .3)); frameY(1.1, 1.9, 1.4, .1, .7, dk(c, .3));
    /* base radio */
    box(.1, .74, .82, .7, .3, .36, '#3a3f4c'); lit(() => { qy(.16, .5, 1.04, .96, 1.1, '#9cf2b0'); spx(.6, 1.04, 1.04, 0, 0, '#ff5040'); spx(.68, 1.04, 1.04, 0, 0, '#f2c230'); }); for (let i = 0; i < 4; i++) discY(.2 + i * .12, 1.05, .9, .03, CHROME, 6);
    tube([.86, .8, .82], [.86, .8, 1.22], '#3a3f4c'); tube([.86, .8, 1.22], [.98, .94, 1.26], '#3a3f4c'); cyl(1.0, .96, 1.22, .05, .08, '#22202a', { ol: false });
    /* the logbook, open; cold tea; a lamp */
    bx(1.1, .92, .82, .75, .46, .02, '#7a2e2a'); qz(1.15, 1.8, .96, 1.34, .845, PAPER, '#ece6d6'); lw([1.47, .96, .85], [1.47, 1.34, .85], '#b8b2a2'); for (let i = 0; i < 4; i++) { lw([1.2, 1.02 + i * .08, .85], [1.42, 1.02 + i * .08, .85], '#6a6a80'); lw([1.52, 1.02 + i * .08, .85], [1.72 - (i % 2) * .1, 1.02 + i * .08, .85], '#6a6a80'); }
    cup(1.9, .86, .82, '#f1ede4'); lamp(.2, 1.26, .82, .5, '#3f8a55');
  }, { use: { x: 1, y: 1.9 }, staff: { x: 1.4, y: .4, dir: 1 }, seats: [{ x: 1.4, y: .4, z: .5, dir: 1, staff: true }], variants: [{}] }),

  /* ---------------- Sprinkler the tortoise: a low pen with a heat lamp ---------------- */
  J('fire.sprinkler', ['fire_tortoise', 'pet'], [1.4, 1, .9], p => {
    qz(.05, 1.35, .05, .95, .02, '#c8b078', '#b8a068'); for (const [a, b] of [[[0, 0], [1.4, 0]], [[0, 0], [0, 1]]]) bx(a[0], a[1], 0, b[0] - a[0] || .05, b[1] - a[1] || .05, .22, '#b07444');
    bx(0, .95, 0, 1.4, .05, .22, '#b07444'); bx(1.35, 0, 0, .05, 1, .22, '#b07444');
    /* the tortoise */
    cyl(.72, .55, .03, .2, .1, '#6f7a48', { t: '#8a9458' }); cyl(.72, .55, .13, .13, .05, '#8a9458', { ol: false, t: '#a0a868' }); spx(.72, .55, .19, 0, 0, GOLD); spx(.72, .55, .19, 1, 0, GOLD);
    bx(.92, .5, .05, .1, .08, .08, '#a8a868'); spx(1.0, .56, .12, 0, 0, INK); for (const [x, y] of [[.56, .4], [.86, .4], [.58, .7], [.86, .72]]) bx(x, y, .02, .06, .06, .05, '#a8a868');
    /* lettuce, a water dish, a tiny sign */
    ball(.3, .7, .08, .1, '#7ac85a', { ol: false }); cyl(.3, .28, .03, .1, .03, '#5ab0e0', { ol: false }); bx(1.08, .12, 0, .04, .04, .4, '#8a5a3a'); qy(.92, 1.28, .17, .3, .56, PAPER); frameY(.92, 1.28, .17, .3, .56, '#b8342e'); pix(1.0, .18, .34, ['.g.g.', 'ggggg', 'ggggg', '.g.g.'], { g: '#6f7a48' });
    tube([.1, .1, .22], [.1, .1, .8], '#7d858e'); tube([.1, .1, .8], [.4, .3, .8], '#7d858e'); cyl(.4, .3, .7, .1, .1, '#b8342e', { ol: false }); glow(() => { qz(.2, .75, .15, .7, .03, '#ffd070', 'glass'); });
  }, { solid: true, use: { x: .7, y: 1.4 }, variants: [{}] }),

  /* ---------------- floor markings of the bay ---------------- */
  J('fire.baymark', ['decal'], p => [p.w || 7, p.d || 3.2, .02], p => {
    const w = p.w || 7, d = p.d || 3.2, st = (x, y) => (Math.floor((x + y) * 4) % 2 ? '#f2c230' : '#3a3640');
    qz(0, w, 0, .14, .012, st); qz(0, w, d - .14, d, .012, st); qz(0, .14, 0, d, .012, st);
    qz(w * .44, w * .56, d * .46, d * .54, .012, '#5a5664'); frameZ(w * .44, w * .56, d * .46, d * .54, .013, '#3a3640');
    for (const [x, y] of [[w * .25, d * .3], [w * .7, d * .68]]) qz(x, x + .5, y, y + .3, .012, '#4a4654', '#5a5664');
  }, { solid: false, flat: true, variants: [{}] }),

  /* ---------------- wall pieces ---------------- */
  J('fire.bell', ['fire_bell'], [1.4, .2, 1.4], p => {
    /* the call bell, the red call box, the status lamps */
    bx(.1, 0, .9, .5, .1, .1, '#3a3f4c'); discY(.35, .12, .72, .26, BRASS); discY(.35, .13, .72, .16, '#b8882a'); discY(.35, .14, .72, .05, '#fff2b0', 6); lw([.35, .14, .46], [.35, .14, .34], INK); spx(.35, .14, .34, 0, 0, INK);
    box(.8, 0, .4, .46, .12, .6, '#c8322c'); qy(.86, 1.2, .13, .62, .92, '#9a2420'); lw([.9, .14, .84], [1.16, .14, .84], PAPER); lw([.9, .14, .76], [1.1, .14, .76], PAPER); discY(1.03, .14, .52, .05, '#f1ede4', 6);
    for (let i = 0; i < 3; i++) { const on = i === (p.on || 0); if (on) lit(() => discY(.92 + i * .12, .13, 1.14, .04, ['#5af08a', '#f2c230', '#ff5040'][i], 6)); else discY(.92 + i * .12, .13, 1.14, .04, dk(['#5af08a', '#f2c230', '#ff5040'][i], .5), 6); }
  }, { wall: true, mount: 1.1, solid: false, use: { x: .7, y: .7 }, variants: [{}, { on: 2 }] }),
  J('fire.board', ['fire_board', 'noticeboard'], p => [2.6, .1, 1.5], p => {
    board(.05, 2.55, .04, .05, 1.45, '#2f3f38'); textY('CALLS', .14, .05, 1.42, '#f2c230');
    const rows = [['TOAST', 7], ['CAT', 1], ['LIFT', 1]];
    rows.forEach((r, i) => { const z = 1.08 - i * .32; textY(r[0], .14, .05, z, '#c8d0c8'); for (let k = 0; k < r[1]; k++) { const xx = 1.56 + k * .1 + (k >= 5 ? .1 : 0); lw([xx, .05, z - .04], [xx, .05, z - .24], PAPER); } if (r[1] >= 5) lw([1.52, .05, z - .22], [2.0, .05, z - .06], PAPER); });
    lw([.1, .05, .14], [2.5, .05, .14], '#5a6a62');
  }, { wall: true, mount: 1.0, solid: false, use: { x: 1.3, y: .7 }, variants: [{}] }),
  J('fire.badge', ['decor'], [1.6, .1, 1.5], p => {
    const cx = .8, cz = .78; for (let a = 0; a < 4; a++) { const an = a * TAU4, dx = Math.cos(an), dz = Math.sin(an), px = -dz, pz = dx; fq([[cx + dx * .2 + px * .16, .04, cz + dz * .2 + pz * .16], [cx + dx * .68 + px * .3, .04, cz + dz * .68 + pz * .3], [cx + dx * .68 - px * .3, .04, cz + dz * .68 - pz * .3], [cx + dx * .2 - px * .16, .04, cz + dz * .2 - pz * .16]], '#c8322c'); }
    discY(cx, .05, cz, .36, GOLD); discY(cx, .06, cz, .29, '#c8322c'); textY('2', cx - .09, .07, cz + .16, GOLD);
  }, { wall: true, mount: 1.2, solid: false, variants: [{}] }),
  J('fire.tools', ['decor', 'fire_tools'], p => [2.2, .2, 1.6], p => {
    qy(0, 2.2, .03, .2, 1.5, '#c8b890'); frameY(0, 2.2, .03, .2, 1.5, '#8a5a3a'); for (let x = .1; x < 2.2; x += .15) for (let z = .3; z < 1.5; z += .15) spx(x, .04, z, 0, 0, '#a89868');
    /* axe, halligan, pike pole, two extinguishers, a coil of rope */
    tube([.3, .06, .4], [.3, .06, 1.3], '#b07444'); fq([[.2, .06, 1.2], [.46, .06, 1.34], [.46, .06, 1.12], [.3, .06, 1.1]], '#c8322c'); lw([.46, .06, 1.34], [.46, .06, 1.12], CHROME);
    tube([.7, .06, .4], [.7, .06, 1.36], '#3a3f4c'); tube([.62, .06, 1.36], [.8, .06, 1.36], '#3a3f4c'); tube([.7, .06, .4], [.78, .06, .46], '#3a3f4c');
    tube([1.05, .06, .3], [1.05, .06, 1.44], '#f2c230'); tube([1.05, .06, 1.36], [1.15, .06, 1.44], CHROME);
    ringY(1.5, .06, 1.1, .2, '#e8dcb8', 10); ringY(1.5, .06, 1.1, .15, '#d0c090', 10);
    for (const x of [1.4, 1.75]) { cyl(x + .1, .12, .26, .09, .44, '#c8322c'); bx(x + .06, .08, .7, .08, .08, .06, INK); tube([x + .14, .12, .74], [x + .22, .12, .5], INK); qy(x + .04, x + .16, .21, .4, .54, PAPER); }
  }, { wall: true, mount: .3, solid: false, variants: [{}] }),
  J('fire.map', ['decor'], [1.8, .1, 1.3], p => {
    qy(0, 1.8, .03, 0, 1.3, '#e8e2c8'); frameY(0, 1.8, .03, 0, 1.3, '#5a3a28'); fq([[1.2, .04, 0], [1.8, .04, 0], [1.8, .04, .7], [1.5, .04, .5]], '#9fd4e6');
    for (let i = 1; i < 6; i++) lw([i * .3, .04, .05], [i * .3, .04, 1.25], '#c8bca0'); for (let i = 1; i < 4; i++) lw([.05, .04, i * .32], [1.75, .04, i * .32], '#c8bca0');
    for (const [x, z, c] of [[.5, .8, '#c8322c'], [.9, .4, '#3c64ad'], [1.3, .96, '#3c64ad'], [.3, .3, '#3c64ad']]) { spx(x, .05, z, 0, 0, c); spx(x, .05, z, 1, 0, c); spx(x, .05, z, 0, -1, c); spx(x, .05, z, 1, -1, c); }
    ringY(.5, .05, .8, .22, '#c8322c', 10); 
  }, { wall: true, mount: 1.1, solid: false, variants: [{}] }),
];
const TAU4 = Math.PI / 2;
