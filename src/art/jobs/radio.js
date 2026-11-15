// Bay Radio 98.6, Studio B: fixtures (room: src/scenes/rooms/job_radio.js) + the two street doors of the job rooms that share a building with a lobby.
// Ids `furn.job.radio.*`, `prop.job.sidedoor`. Station tags used by the Radio Host job: radio_board, radio_phone, record_shelf, radio_kettle.
// Visitor tags: radio_guest (the guest sofa), radio_tally, radio_window.
import { textY, ball } from '../../engine/raster.js';
import { J, F, bx, tube, post, posts, frameY, frameX, frameZ, plant, cup, lamp, sofa, discY, ringY, pix, label, sheet, board, spines, INK, BRASS, CHROME, PAPER, box, qy, qx, qz, lw, fq, lit, glow, cyl, spx, dk, lt, hash2 } from './_lib.js';

const WAL = '#6a4428', WALD = '#4a2e1c', FELT = '#3a4a5a', SLEEVE = ['#d63a3a', '#f2c230', '#3c64ad', '#2a2733', '#f1ede4', '#e8843a', '#2f8f8a', '#7a55b0', '#e87aa0', '#3f8a55', '#8a5a3a', '#6fb6d8'];
const turntable = (x, y, z) => { box(x, y, z, .5, .44, .08, '#3a3640'); cyl(x + .22, y + .22, z + .08, .18, .02, '#22202a', { ol: false }); cyl(x + .22, y + .22, z + .1, .06, .01, '#d63a3a', { ol: false }); tube([x + .44, y + .08, z + .1], [x + .3, y + .3, z + .12], CHROME); };
const mic = (x, y, z, ax, ay) => { tube([ax, ay, z], [ax, ay, z + .5], '#3a3f4c'); tube([ax, ay, z + .5], [x, y, z + .42], '#3a3f4c'); cyl(x, y, z + .3, .05, .14, '#8a9098', { ol: false, t: '#c8ccd4' }); ringY(x, y, z + .37, .08, '#22202a', 8); };

export default [
  /* ---------------- the console: board, two turntables, the microphone ---------------- */
  J('radio.console', ['radio_board', 'desk'], [2.8, 1.8, 1.5], p => {
    /* the chair behind */
    cyl(1.4, .34, 0, .22, .04, '#3a3f4c', { ol: false }); post(1.4, .34, .04, .42, '#7d858e'); bx(1.16, .12, .42, .48, .46, .07, '#b8342e'); bx(1.16, .08, .49, .48, .07, .28, '#b8342e');
    /* a U of walnut */
    box(0, .8, 0, 2.8, .9, .78, WAL, { t: FELT }); frameZ(.04, 2.76, .84, 1.66, .785, WALD); qy(.1, 2.7, 1.7, .1, .7, WALD); for (let i = 0; i < 6; i++) lw([.2 + i * .46, 1.7, .14], [.2 + i * .46, 1.7, .66], dk(WALD, .2));
    /* the mixing board: a sloped panel of faders and two meters */
    box(.86, .98, .78, 1.1, .6, .06, '#22202a'); fq([[.86, .98, .98], [1.96, .98, .98], [1.96, 1.5, .84], [.86, 1.5, .84]], '#3a3640'); qy(.86, 1.96, .98, .84, .98, '#22202a');
    for (let i = 0; i < 8; i++) { const x = .94 + i * .125; lw([x, 1.06, .96], [x, 1.44, .86], '#5a5664'); const t = hash2(i, 4); spx(x, 1.1 + t * .3, .95 - t * .08, 0, 0, ['#f1ede4', '#f1ede4', '#f2c230', '#d63a3a'][i % 4]); spx(x, 1.1 + t * .3, .95 - t * .08, 0, -1, '#f1ede4'); }
    lit(() => { for (let i = 0; i < 2; i++) { qy(1.0 + i * .5, 1.36 + i * .5, .99, 1.0, 1.16, '#f8e8a0'); lw([1.18 + i * .5, 1.0, 1.01], [1.26 + i * .5 - i * .12, 1.0, 1.14], '#b8342e'); } for (let i = 0; i < 5; i++) spx(.96 + i * .06, 1.52, .84, 0, 0, i < 3 ? '#5af08a' : i < 4 ? '#f2c230' : '#ff5040'); });
    box(.98, .96, .98, .9, .04, .22, '#22202a', { ol: false });
    turntable(.1, 1.0, .78); turntable(2.2, 1.0, .78);
    /* the microphone on its arm, the headphones, the cue sheet, a mug */
    mic(1.4, .98, .78, .76, .92); lit(() => { spx(1.4, .98, 1.12, 0, 0, '#ff3020'); });
    tube([2.02, 1.52, .8], [2.14, 1.52, .9], '#22202a'); cyl(2.02, 1.52, .78, .06, .06, '#22202a', { ol: false }); cyl(2.16, 1.52, .78, .06, .06, '#22202a', { ol: false });
    qz(.66, .84, 1.36, 1.62, .79, PAPER, '#ece6d6'); lw([.68, 1.42, .795], [.82, 1.42, .795], '#8a8698'); lw([.68, 1.5, .795], [.8, 1.5, .795], '#8a8698'); cup(.74, .94, .78, '#f2c230');
  }, { vb: [-.2, -.2, 0, 3, 2, 1.6], use: { x: 1.4, y: 2.15 }, staff: { x: 1.4, y: .36, dir: 1 }, seats: [{ x: 1.4, y: .36, z: .5, dir: 1, staff: true }], pose: { x: 1.4, y: .36, z: .5, dir: 1, anim: 'sit' }, variants: [{}] }),

  /* ---------------- the record wall ---------------- */
  J('radio.records', ['record_shelf', 'record_wall', 'browse'], p => [p.w || 3.4, .5, 2.6], p => {
    const w = p.w || 3.4, rows = 5;
    box(0, 0, 0, w, .5, 2.56, WAL); qy(.05, w - .05, .5, .06, 2.5, '#2a1c14');
    for (let r = 0; r < rows; r++) { const z = .08 + r * .49; bx(.04, .1, z - .03, w - .08, .4, .03, WAL);
      const n = Math.round(w / 1.1); for (let k = 0; k < n; k++) { const a = .08 + k * (w - .1) / n, b = a + (w - .1) / n - .06; lw([b + .03, .5, z], [b + .03, .5, z + .44], WAL);
        if ((k + r) % 4 === 3) { /* a sleeve faced out */ spines(a, b - .42, .5, z, z + .4, SLEEVE, r * 7 + k, true); qy(b - .4, b, .5, z, z + .4, SLEEVE[(r * 5 + k * 3) % 12]); discY(b - .2, .51, z + .2, .12, SLEEVE[(r * 3 + k + 4) % 12], 8); frameY(b - .4, b, .5, z, z + .4, INK); }
        else spines(a, b, .5, z, z + .4 - hash2(k, r) * .04, SLEEVE, r * 7 + k, true); } }
    /* a rolling ladder and a crate of returns */
    tube([w - .7, .56, 0], [w - .5, .52, 2.2], '#b07444'); tube([w - .4, .56, 0], [w - .2, .52, 2.2], '#b07444'); for (let i = 1; i < 7; i++) lw([w - .7 + i * .028, .55, i * .3], [w - .4 + i * .028, .55, i * .3], '#b07444');
    box(.2, .56, 0, .5, .36, .3, '#c8a070'); spines(.24, .66, .92, .1, .38, SLEEVE, 3, true);
  }, { vb: p => [-.2, -.2, 0, (p.w || 3.4) + .2, 1.1, 2.7], use: p => ({ x: (p.w || 3.4) / 2, y: 1.15 }), variants: [{}] }),

  /* ---------------- the telephone: four lines ---------------- */
  J('radio.phone', ['radio_phone', 'phone'], [1, .7, 1.3], p => {
    posts(.08, .08, .84, .5, 0, .7, WALD); box(0, 0, .7, 1, .7, .06, WAL);
    box(.12, .14, .76, .56, .4, .12, '#22202a'); fq([[.12, .14, .98], [.68, .14, .98], [.68, .4, .88], [.12, .4, .88]], '#3a3640');
    for (let i = 0; i < 4; i++) { const on = (p.lit || 0) > i; if (on) lit(() => { bx(.18 + i * .12, .44, .88, .08, .06, .04, i === 2 ? '#ff5040' : '#f2c230'); }); else bx(.18 + i * .12, .44, .88, .08, .06, .04, '#5a5664'); }
    tube([.2, .2, 1.0], [.6, .2, 1.0], '#b8342e'); bx(.16, .16, .94, .1, .1, .08, '#b8342e'); bx(.54, .16, .94, .1, .1, .08, '#b8342e'); lw([.64, .3, .9], [.8, .5, .78], '#22202a');
    qz(.74, .96, .36, .62, .765, PAPER); lw([.78, .44, .77], [.92, .44, .77], '#8a8698'); post(.86, .2, .76, .88, '#f2c230');
  }, { use: { x: .5, y: 1.1 }, variants: [{}, { lit: 3 }] }),

  /* ---------------- the kettle corner ---------------- */
  J('radio.kettle', ['radio_kettle', 'coffee_station'], [1.4, .7, 1.7], p => {
    box(0, 0, 0, 1.4, .7, .86, '#8a9a8a', { t: '#d8d2c4' }); frameY(.08, .66, .7, .1, .76, '#5a6a5a'); frameY(.74, 1.32, .7, .1, .76, '#5a6a5a');
    cyl(.34, .36, .86, .12, .2, CHROME, { t: '#b8bcc4' }); tube([.44, .36, .98], [.54, .36, 1.06], CHROME); tube([.26, .36, 1.1], [.42, .36, 1.1], INK); lit(() => spx(.34, .48, .9, 0, 0, '#ff5040'));
    for (const [x, c] of [[.7, '#f1ede4'], [.86, '#b8342e'], [1.02, '#3c64ad']]) cup(x, .5, .86, c); cyl(1.2, .3, .86, .1, .14, '#2f8f8a', { t: '#f2c230' }); box(.66, .14, .86, .28, .18, .12, '#e8843a'); qy(.7, .9, .32, .9, .96, PAPER);
    bx(0, 0, 1.36, 1.4, .24, .04, WAL); for (let i = 0; i < 5; i++) cyl(.16 + i * .26, .12, 1.4, .07, .12 + (i % 2) * .04, ['#c8a070', '#8a5a3a', '#f1ede4', '#3f8a55', '#c8a070'][i], { ol: false });
  }, { use: { x: .7, y: 1.15 }, variants: [{}] }),

  /* ---------------- Hattie's bench: a soldering iron, a tape machine with its lid off ---------------- */
  J('radio.bench', ['radio_bench', 'workbench'], [2.2, .8, 1.8], p => {
    posts(.06, .06, 2.08, .68, 0, .8, '#5a5664'); box(0, 0, .8, 2.2, .8, .07, '#b07444'); bx(.1, .1, .3, 2, .6, .04, '#8a8698');
    /* open reel-to-reel */
    box(.14, .1, .87, .9, .46, .3, '#4a4f5c'); for (const cx of [.36, .82]) { discY(cx, .57, 1.02, .16, '#c8ccd4', 10); discY(cx, .58, 1.02, .1, '#8a5a3a', 8); discY(cx, .59, 1.02, .03, INK, 5); } lw([.4, .58, .9], [.78, .58, .9], '#8a5a3a');
    /* oscilloscope, soldering iron on a stand, a spool of solder, a tangle of wire */
    box(1.2, .1, .87, .5, .4, .4, '#6a7a6a'); lit(() => { qy(1.26, 1.52, .5, .98, 1.2, '#1b3a2a'); for (let i = 0; i < 8; i++) spx(1.28 + i * .03, .51, 1.09 + Math.sin(i * 1.2) * .06, 0, 0, '#5af08a'); }); for (let i = 0; i < 3; i++) discY(1.6, .51, .96 + i * .1, .03, INK, 5);
    cyl(1.9, .5, .87, .07, .03, '#8a9098', { ol: false }); tube([1.9, .5, .9], [2.06, .36, 1.1], '#f2c230'); tube([2.06, .36, 1.1], [2.12, .3, 1.18], CHROME); lit(() => spx(2.12, .3, 1.2, 0, 0, '#ff8040'));
    cyl(1.84, .22, .87, .06, .08, '#c8ccd4', { ol: false }); for (let i = 0; i < 5; i++) lw([1.0 + i * .03, .64, .875], [1.2 + i * .04, .7 - (i % 2) * .06, .875], ['#d63a3a', '#3c64ad', '#f2c230', '#3f8a55', '#2a2733'][i]);
    /* pegboard with spare tubes and a flashlight; a box of valves below */
    qy(0, 2.2, .03, 1.1, 1.76, '#c8b890'); frameY(0, 2.2, .03, 1.1, 1.76, WALD); for (let i = 0; i < 6; i++) { cyl(.2 + i * .3, .1, 1.3, .05, .16, '#bfe4f4', { ol: false, t: '#8a8698' }); } tube([1.9, .06, 1.24], [1.9, .06, 1.6], '#b8342e');
    box(.3, .14, .34, .5, .4, .26, '#c8a070'); box(1.2, .14, .34, .6, .44, .3, '#5a5664');
  }, { use: { x: 1.1, y: 1.25 }, staff: { x: 1.1, y: 1.2, dir: 3 }, variants: [{}] }),

  /* ---------------- the glass between the booth and the bench ---------------- */
  J('radio.glass', ['partition'], p => [p.w || 3, .2, 2.5], p => {
    const w = p.w || 3; box(0, 0, 0, w, .2, .9, '#4a3a44'); qy(0, w, .2, .9, 2.3, '#bfe4f4', 'glass'); for (let x = 0; x <= w + .01; x += w / Math.round(w / 1.5)) bx(Math.min(w - .08, x), 0, .9, .08, .2, 1.4, WAL);
    bx(0, 0, 2.3, w, .2, .12, WAL); qy(0, w, .2, .84, .92, WAL); for (let x = .15; x < w; x += .3) for (let z = .16; z < .8; z += .22) qy(x, x + .2, .2, z, z + .14, '#5a4a54');
  }, { vb: p => [-.2, -.2, 0, (p.w || 3) + .2, .5, 2.6], variants: [{}] }),

  /* ---------------- wall pieces ---------------- */
  J('radio.onair', ['radio_onair'], [2, .16, .6], p => {
    box(.05, 0, .08, 1.9, .1, .44, '#22202a'); if (p.on) { lit(() => { qy(.1, 1.9, .11, .12, .48, '#ff3020'); textY('ON AIR', .26, .12, .46, '#fff2d0'); }); glow(() => { qy(-.1, 2.1, .12, -.1, .7, '#ff7060', 'glass'); }); } else { qy(.1, 1.9, .11, .12, .48, '#5a2420'); textY('ON AIR', .26, .12, .46, '#8a4a44'); }
  }, { wall: true, mount: 2.3, solid: false, variants: [{}, { on: 1 }] }),
  J('radio.window', ['radio_window', 'window'], p => [p.w || 2.6, .1, 1.5], p => {
    const w = p.w || 2.6; qy(0, w, .03, 0, 1.44, WALD); qy(.08, w - .08, .04, .08, 1.36, '#9fc8e0', '#b0d4e8'); glow(() => qy(.08, w - .08, .04, .08, 1.36, '#141c3a', '#1c2648'));
    /* Hillcrest falling away to the bay; the lighthouse on the point */
    fq([[.08, .04, .08], [w - .08, .04, .08], [w - .08, .04, .34], [w * .5, .04, .6], [.08, .04, .46]], '#5a8a5a'); fq([[w * .5, .04, .08], [w - .08, .04, .08], [w - .08, .04, .3]], '#5a9ab8');
    for (let i = 0; i < 7; i++) { const x = .16 + i * (w - .5) / 7, z = .3 + hash2(i, 3) * .16; qy(x, x + .16, .045, z, z + .12, '#c8b898'); fq([[x - .02, .045, z + .12], [x + .18, .045, z + .12], [x + .08, .045, z + .2]], '#8a4a3a'); glow(() => { spx(x + .06, .05, z + .08, 0, 0, '#ffe680'); }); }
    bx(w - .34, .04, .26, .06, .02, .3, PAPER); lit(() => { spx(w - .31, .06, .6, 0, 0, '#fff2a0'); }); glow(() => { for (const [a, b] of [[-2, 0], [-1, 0], [1, 0], [2, 0], [0, -1], [0, 1]]) spx(w - .31, .06, .6, a, b, '#ffe680'); for (let i = 0; i < 9; i++) spx(.2 + hash2(i, 1) * (w - .4), .05, .8 + hash2(i, 2) * .5, 0, 0, '#f4fbfc'); });
    lw([w / 2, .05, .08], [w / 2, .05, 1.36], WALD); frameY(.08, w - .08, .05, .08, 1.36, '#2a1c14'); bx(-.04, .03, -.06, w + .08, .12, .06, WALD);
  }, { wall: true, mount: .95, solid: false, use: p => ({ x: (p.w || 2.6) / 2, y: .7 }), variants: [{}] }),
  J('radio.foam', ['decor'], p => [p.w || 2, .1, 1.2], p => {
    const w = p.w || 2, c = p.c || '#4a3a54'; qy(0, w, .03, 0, 1.2, dk(c, .2)); for (let i = 0; i < Math.round(w / .3); i++) for (let r = 0; r < 4; r++) { qy(i * .3 + .02, i * .3 + .28, .04, r * .3 + .02, r * .3 + .28, (i + r) % 2 ? c : lt(c, .1)); lw([i * .3 + .02, .05, r * .3 + .28], [i * .3 + .28, .05, r * .3 + .28], lt(c, .25)); }
  }, { wall: true, mount: 1.0, solid: false, variants: [{}] }),
  J('radio.tally', ['radio_tally', 'noticeboard'], [1.6, .1, 1.1], p => {
    board(.05, 1.55, .04, .05, 1.05, '#2f3f38', WALD); textY('TUNED', .14, .05, 1.02, '#c8d0c8'); textY(String(p.n || 41), .5, .05, .62, '#f8e080'); lw([.4, .05, .26], [1.2, .05, .26], '#f8e080');
  }, { wall: true, mount: 1.2, solid: false, use: { x: .8, y: .7 }, variants: [{}, { n: 600 }] }),
  J('radio.cards', ['decor', 'radio_cards'], p => [p.w || 1.6, .1, 1], p => {
    const w = p.w || 1.6; board(.05, w - .05, .04, .05, .95, '#c8a070', WALD); for (let i = 0; i < Math.floor(w / .3) * 2; i++) { const x = .1 + (i % Math.floor(w / .3)) * .3, z = .12 + Math.floor(i / Math.floor(w / .3)) * .4; qy(x, x + .24, .05, z, z + .3, ['#9fd4e6', '#f8e8a0', '#f8d0c0', '#c8e8c0', PAPER][i % 5]); qy(x + .02, x + .22, .06, z + .16, z + .28, ['#5a9ab8', '#e8843a', '#8a5a3a', '#3f8a55', '#3c64ad'][i % 5]); spx(x + .12, .06, z + .3, 0, 0, '#b8342e'); }
  }, { wall: true, mount: 1.2, solid: false, variants: [{}] }),
  J('radio.reel', ['decor', 'machine'], [.9, .7, 1.9], p => {
    box(0, 0, 0, .9, .7, 1.86, '#5a5664'); for (const [cx, cz] of [[.26, 1.5], [.64, 1.5]]) { discY(cx, .71, cz, .18, '#c8ccd4', 10); discY(cx, .72, cz, .11, '#8a5a3a', 8); discY(cx, .73, cz, .03, INK, 5); }
    qy(.1, .8, .71, .96, 1.2, '#22202a'); lit(() => { for (let i = 0; i < 2; i++) qy(.16 + i * .34, .4 + i * .34, .72, 1.0, 1.16, '#f8e8a0'); spx(.76, .72, .9, 0, 0, '#5af08a'); }); for (let i = 0; i < 5; i++) discY(.18 + i * .14, .72, .8, .04, CHROME, 5);
    qy(.08, .82, .71, .1, .66, '#4a4658'); for (let z = .16; z < .64; z += .08) lw([.12, .72, z], [.78, .72, z], '#3a3644');
  }, { use: { x: .45, y: 1.15 }, variants: [{}] }),
  J('radio.guest', ['radio_guest', 'seat', 'seating', 'sofa'], [2.2, 1, 1], p => {
    sofa(0, 0, 2.2, .95, p.c || '#8a3848'); bx(.3, .34, .52, .4, .3, .14, '#f2c230'); bx(1.5, .34, .52, .4, .3, .14, '#2f8f8a');
  }, { seats: [{ x: .6, y: .62, z: .52, dir: 1 }, { x: 1.6, y: .62, z: .52, dir: 1 }], use: { x: 1.1, y: 1.45 }, variants: [{}] }),

  /* ---------------- a street door set against a building's wall: the studio's and the Gazette's own entrances ---------------- */
  F('job.sidedoor', ['job', 'door', 'street'], [1.6, .36, 2.9], p => {
    const c = p.c || '#b8342e', t = p.name || '98.6';
    /* step, frame, door with a window, a lamp, a small hanging sign */
    box(.1, .1, 0, 1.4, .3, .1, '#b8b2a2'); qy(.2, 1.4, .12, .1, 2.1, dk(c, .35)); qy(.3, 1.3, .14, .1, 2.0, c); frameY(.3, 1.3, .14, .1, 2.0, dk(c, .45)); qy(.5, 1.1, .15, 1.2, 1.76, '#9fd4e6', '#b8e2ee'); glow(() => qy(.5, 1.1, .15, 1.2, 1.76, '#ffd880', '#ffe8a8')); frameY(.5, 1.1, .15, 1.2, 1.76, dk(c, .45));
    spx(1.2, .16, 1.04, 0, 0, BRASS); spx(1.2, .16, 1.04, 0, 1, BRASS); qy(.5, 1.1, .15, .5, .8, dk(c, .15));
    box(.1, .1, 2.14, 1.4, .26, .5, p.bg || '#22202a'); lit(() => label(t, .1, 1.5, .37, 2.56, p.fg || '#f8e8a0')); frameY(.1, 1.5, .36, 2.14, 2.64, p.fr || BRASS);
    tube([.12, .3, 1.7], [.12, .3, 2.0], '#3a3f4c'); lit(() => { bx(.06, .26, 1.56, .12, .1, .16, '#ffe680'); }); glow(() => { qz(.1, 1.5, .4, 1.3, .02, '#ffd880', 'glass'); });
  }, { kind: 'prop', id: 'prop.job.sidedoor', solid: false, vb: [-.3, -.3, 0, 1.9, 1.5, 3], variants: [{}, { name: 'NEWS', c: '#3f6a5a' }] }),
];
