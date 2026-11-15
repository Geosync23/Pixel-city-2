// Real fixtures for the job stations that stood in on something else (J2's list in docs/reports/jobs_engine.md; JOBS.md "Fixtures in existing rooms").
// Ids `furn.job.fix.*`; each carries ONLY its job station tag (so no other system's fixture handler picks it up). Placed add-only by scenes/rooms/job_fixtures.js.
//   gullstove (gull_stove)  gullprep (gull_prep)  walkin (gull_walk_in, wall)  gulldoor (gull_back_door, wall: Gilbert is on the sill)
//   barbersink (barber_sink)   fishkitchen (aq_fish_kitchen)  waterlab (aq_water_lab)   flowercooler (flower_cooler)  floristbench (florist_bench)
//   announcer (announcer_booth)  lostprop (lost_property)   terracekit (obs_terrace)   guardchair (decor: Norm's chair by Marge's left foot)
import { textY, ball } from '../../engine/raster.js';
import { J, bx, tube, post, posts, frameY, frameX, frameZ, counter, cup, plate, steam, lamp, bottle, discY, ringY, pix, label, sheet, board, clockY, spines, INK, BRASS, CHROME, PAPER, box, qy, qx, qz, lw, fq, lit, glow, cyl, spx, dk, lt, hash2 } from './_lib.js';

const STEEL = '#b8bcc4', STEELD = '#7d858e', COPPER = '#c8743a', FLW = ['#e87aa0', '#f2c230', '#d63a3a', '#f1ede4', '#b07ad8', '#f28a30'];
const stems = (x, y, z, n, s) => { for (let i = 0; i < n; i++) { const dx = (hash2(i, s) - .5) * .3, h = .3 + hash2(i, s + 1) * .2; lw([x + dx * .3, y, z], [x + dx, y, z + h], '#3f8a55'); spx(x + dx, y, z + h, 0, 0, FLW[(i + s) % 6]); spx(x + dx, y, z + h, 1, 0, FLW[(i + s) % 6]); spx(x + dx, y, z + h, 0, -1, lt(FLW[(i + s) % 6], .3)); } };

export default [
  /* ---------------- The Gilded Gull: the stove line under a copper hood ---------------- */
  J('fix.gullstove', ['gull_stove'], [2.4, .9, 2.3], p => {
    box(0, 0, 0, 2.4, .9, .92, '#3a3f4c', { t: '#22202a' }); for (let i = 0; i < 2; i++) { qy(.1 + i * 1.15, 1.15 + i * 1.15, .9, .16, .66, '#2a2733'); frameY(.1 + i * 1.15, 1.15 + i * 1.15, .9, .16, .66, STEELD); tube([.2 + i * 1.15, .92, .72], [1.05 + i * 1.15, .92, .72], BRASS); }
    for (let i = 0; i < 8; i++) discY(.2 + i * .28, .91, .82, .04, BRASS, 6);
    for (const [x, y] of [[.4, .3], [1.0, .3], [1.6, .3], [2.1, .3], [.7, .65], [1.6, .65]]) cyl(x, y, .93, .12, .01, '#4a4658', { ol: false });
    lit(() => { for (const [x, y] of [[.4, .3], [1.6, .3], [.7, .65]]) for (let a = 0; a < 6; a++) spx(x + Math.cos(a) * .1, y + Math.sin(a) * .1, .94, 0, 0, '#6fb6ff'); });
    /* copper pans, a stockpot, a saute pan mid-toss */
    cyl(.4, .3, .95, .16, .2, COPPER, { t: '#8a4a20' }); steam(.4, .3, 1.2, 4); cyl(1.6, .3, .95, .13, .1, COPPER, { t: '#e8d8a0' }); tube([1.74, .3, 1.02], [1.98, .3, 1.08], '#3a3f4c'); cyl(.7, .65, .95, .14, .05, '#3a3f4c', { t: '#c8843a' }); tube([.84, .65, .98], [1.1, .7, 1.0], '#3a3f4c');
    /* the hood, a rail of ladles, the salamander's glow */
    box(-.05, 0, 1.75, 2.5, .7, .45, COPPER, { l: (u, v) => (v % 6 === 0 ? dk(COPPER, .2) : COPPER) }); bx(-.05, 0, 1.7, 2.5, .74, .06, dk(COPPER, .3)); for (let x = .2; x < 2.3; x += .5) spx(x, .71, 1.95, 0, 0, BRASS);
    tube([.1, .1, 1.5], [2.3, .1, 1.5], STEEL); for (let i = 0; i < 6; i++) { lw([.3 + i * .36, .1, 1.5], [.3 + i * .36, .1, 1.22], STEEL); spx(.3 + i * .36, .1, 1.2, 0, 0, i % 2 ? COPPER : STEEL); spx(.3 + i * .36, .1, 1.2, 1, 0, i % 2 ? COPPER : STEEL); }
    glow(() => { qz(.1, 2.3, .1, .8, .95, '#ffb060', 'glass'); });
  }, { use: { x: 1.2, y: 1.4 }, variants: [{}] }),
  J('fix.gullprep', ['gull_prep'], [1.5, .9, 1.2], p => {
    posts(.06, .06, 1.38, .78, 0, .86, STEELD); bx(.04, .04, .3, 1.42, .82, .04, STEEL); box(0, 0, .86, 1.5, .9, .06, '#e8e4dc', { t: '#f4f0e8' });
    /* mise en place: nine bowls in a grid, a board, a knife, a towel */
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) cyl(.18 + i * .22, .2 + j * .22, .92, .08, .05, STEEL, { ol: false, t: ['#3f8a55', '#d63a3a', '#f2c230', '#f1ede4', '#8a5a3a', '#e8843a'][i * 2 + j] });
    box(.82, .14, .92, .5, .36, .03, '#c08454'); lw([.9, .3, .955], [1.24, .34, .955], CHROME); ball(1.0, .24, .98, .05, '#3f8a55', { ol: false }); bx(.9, .6, .92, .4, .2, .03, PAPER); lw([.9, .7, .955], [1.3, .7, .955], '#3c64ad');
    for (let i = 0; i < 3; i++) bx(.2 + i * .4, .2, .34, .3, .4, .2, ['#c8a070', STEEL, '#c8a070'][i]);
  }, { use: { x: .75, y: 1.4 }, variants: [{}] }),
  J('fix.walkin', ['gull_walk_in'], [1.3, .14, 2.1], p => {
    qy(0, 1.3, .03, 0, 2.05, STEELD); qy(.08, 1.22, .05, 0, 1.96, STEEL); frameY(.08, 1.22, .05, 0, 1.96, '#5a6068'); for (let z = .3; z < 1.9; z += .4) lw([.1, .06, z], [1.2, .06, z], '#a8acb4');
    bx(1.0, .04, .9, .14, .08, .3, '#3a3f4c'); tube([1.07, .12, .92], [1.07, .12, 1.18], CHROME); for (const z of [.3, 1.6]) bx(.1, .04, z, .1, .06, .16, '#5a6068');
    qy(.3, .62, .06, 1.5, 1.72, '#22202a'); lit(() => textY('3C', .34, .07, 1.72, '#6fd0ff')); qy(.3, .9, .06, 1.1, 1.3, PAPER); lw([.34, .07, 1.24], [.84, .07, 1.24], '#3c64ad'); lw([.34, .07, 1.16], [.7, .07, 1.16], '#8a8698');
  }, { wall: true, mount: 0, solid: false, use: { x: .65, y: .6 }, variants: [{}] }),
  J('fix.gulldoor', ['gull_back_door'], [1, .3, 2.1], p => {
    /* a stable door, the top half open on the quay; Gilbert on the sill with his eye on the clock */
    qy(0, 1, .03, 0, 2.05, '#e8dcc0'); qy(.08, .92, .05, 0, 1.02, '#2f5a4a'); frameY(.08, .92, .05, 0, 1.02, '#1f3a30'); for (const x of [.3, .5, .7]) lw([x, .06, .06], [x, .06, .98], '#274a3c');
    qy(.08, .92, .05, 1.02, 1.96, '#9fd4e6', '#b8e2ee'); glow(() => qy(.08, .92, .05, 1.02, 1.96, '#1f2a52', '#2a3666')); fq([[.08, .05, 1.02], [.92, .05, 1.02], [.92, .05, 1.3], [.08, .05, 1.22]], '#5a9ab8'); for (let i = 0; i < 3; i++) lw([.14 + i * .26, .06, 1.12 + (i % 2) * .05], [.3 + i * .26, .06, 1.12 + (i % 2) * .05], '#bfe4f4');
    frameY(.08, .92, .05, 1.02, 1.96, '#1f3a30'); bx(.04, .03, .98, .92, .2, .06, '#2f5a4a');
    pix(.34, .22, 1.04, ['..ww.', '.wwwy', 'gwww.', 'ggww.', '.gg..', '.o.o.'], { w: '#f4f0e8', g: '#9aa0a8', y: '#f2c230', o: '#f28a30' }); spx(.52, .22, 1.3, 0, 0, INK);
    bx(.62, .08, 1.04, .22, .12, .05, '#c8ccd4'); spx(.7, .2, 1.08, 0, 0, '#5a9ab8'); qy(.2, .8, .06, .5, .7, BRASS); textY('4', .44, .07, .7, INK);
  }, { wall: true, mount: 0, solid: false, vb: [-.2, -.2, 0, 1.2, .6, 2.2], use: { x: .5, y: .7 }, variants: [{}] }),

  /* ---------------- Otis & Sons: the shampoo basin ---------------- */
  J('fix.barbersink', ['barber_sink'], [1.2, 1.5, 1.4], p => {
    /* the unit against the wall side, the porcelain basin with a neck notch, the reclined chair in front */
    box(0, 0, 0, 1.2, .5, .92, '#5a3a28', { t: '#d8d2c4' }); frameY(.08, .56, .5, .1, .8, '#3a2618'); frameY(.64, 1.12, .5, .1, .8, '#3a2618');
    cyl(.6, .3, .93, .26, .1, '#f4f0e8', { t: '#bfe4f4' }); bx(.5, .46, .93, .2, .08, .1, '#e8e4dc'); tube([.3, .1, .93], [.3, .1, 1.2], CHROME); tube([.3, .1, 1.2], [.46, .22, 1.16], CHROME); spx(.5, .26, 1.1, 0, 0, '#9fd4e6'); spx(.5, .28, 1.04, 0, 0, '#9fd4e6');
    bottle(.95, .14, .92, '#3c64ad', .16); bottle(1.06, .2, .92, '#e8843a', .12); for (let i = 0; i < 3; i++) bx(.06, .06, .92 + i * .05, .18, .3, .05, i % 2 ? '#f4f0e8' : '#c8322c');
    cyl(.6, 1.1, 0, .26, .05, STEELD); cyl(.6, 1.1, .05, .08, .3, CHROME, { ol: false }); box(.32, .86, .38, .56, .5, .14, '#a82a2a', { t: '#c03a3a' }); bx(.34, .62, .52, .52, .3, .1, '#a82a2a'); bx(.26, .9, .5, .08, .42, .16, CHROME); bx(.86, .9, .5, .08, .42, .16, CHROME);
  }, { vb: [-.2, -.2, 0, 1.4, 1.7, 1.5], use: { x: -.35, y: .9 }, seats: [{ x: .6, y: 1.1, z: .52, dir: 1 }], variants: [{}] }),

  /* ---------------- the Aquarium: the fish kitchen and the water bench ---------------- */
  J('fix.fishkitchen', ['aq_fish_kitchen'], [2.6, .8, 1.8], p => {
    posts(.06, .06, 2.48, .68, 0, .88, STEELD); bx(.04, .04, .3, 2.52, .72, .04, STEEL); box(0, 0, .88, 2.6, .8, .05, STEEL, { t: '#d5dbe0' });
    /* three diet trays, a scale, a board with a herring, the vitamin jar */
    for (let i = 0; i < 3; i++) { box(.1 + i * .5, .34, .93, .42, .34, .06, ['#5ab0e0', '#f2c230', '#3f8a55'][i], { t: '#e8eef2' }); for (let k = 0; k < 3; k++) pix(.14 + i * .5 + k * .1, .5, .99, ['ss.', 'sss'], { s: '#9aa8b8' }); }
    box(1.7, .36, .93, .34, .3, .08, '#e8e4dc'); cyl(1.87, .5, 1.01, .14, .02, STEEL, { ol: false }); lit(() => spx(1.87, .66, .98, 0, 0, '#5af08a'));
    box(2.1, .3, .93, .4, .36, .03, '#f1ede4'); pix(2.16, .5, .96, ['.sss.', 'sssss', '.sss.'], { s: '#8a9ab0' }); cyl(1.56, .2, .93, .06, .16, '#e8843a', { ol: false });
    /* buckets under the bench, a hose reel, the diet cards on a rail above */
    for (let i = 0; i < 3; i++) { cyl(.4 + i * .7, .4, .34, .2, .34, ['#d63a3a', '#3c64ad', '#f2c230'][i], { t: '#9aa8b8' }); }
    qy(0, 2.6, .03, 1.2, 1.78, '#e8eef2'); frameY(0, 2.6, .03, 1.2, 1.78, STEELD); tube([.1, .06, 1.66], [2.5, .06, 1.66], STEELD);
    for (let i = 0; i < 5; i++) { qy(.16 + i * .48, .5 + i * .48, .07, 1.3, 1.64, [PAPER, '#f8e8a0', '#bfe4f4', '#f8d0c0', PAPER][i]); lw([.2 + i * .48, .08, 1.56], [.44 + i * .48, .08, 1.56], INK); lw([.2 + i * .48, .08, 1.48], [.4 + i * .48, .08, 1.48], '#8a8698'); lw([.2 + i * .48, .08, 1.4], [.42 + i * .48, .08, 1.4], '#8a8698'); spx(.33 + i * .48, .08, 1.66, 0, 0, '#d63a3a'); }
  }, { use: { x: 1.3, y: 1.3 }, variants: [{}] }),
  J('fix.waterlab', ['aq_water_lab'], [1.8, .7, 1.8], p => {
    box(0, 0, 0, 1.8, .7, .9, '#e8eef2', { t: '#d5dbe0' }); frameY(.08, .86, .7, .1, .8, STEELD); frameY(.94, 1.72, .7, .1, .8, STEELD);
    /* a rack of vials in rising colours, a colour chart, a small sink, the log */
    bx(.1, .2, .9, .9, .2, .06, '#8a9098'); for (let i = 0; i < 7; i++) { cyl(.18 + i * .12, .3, .96, .04, .2, ['#f8e8a0', '#f2c230', '#f28a30', '#e87aa0', '#b07ad8', '#5ab0e0', '#3f8a55'][i], { ol: false }); }
    qz(1.2, 1.7, .16, .56, .905, '#8a9098', '#b8bcc4'); tube([1.45, .1, .9], [1.45, .1, 1.14], CHROME); tube([1.45, .1, 1.14], [1.45, .26, 1.14], CHROME);
    qz(.3, .8, .46, .66, .905, PAPER); lw([.34, .52, .91], [.74, .52, .91], '#3c64ad'); lw([.34, .6, .91], [.66, .6, .91], '#8a8698');
    qy(.1, 1.7, .03, 1.2, 1.76, PAPER); frameY(.1, 1.7, .03, 1.2, 1.76, STEELD); for (let i = 0; i < 7; i++) qy(.2 + i * .2, .36 + i * .2, .04, 1.44, 1.66, ['#f8e8a0', '#f2c230', '#f28a30', '#e87aa0', '#b07ad8', '#5ab0e0', '#3f8a55'][i]); lw([.2, .04, 1.34], [1.56, .04, 1.34], '#8a8698'); lw([.2, .04, 1.28], [1.2, .04, 1.28], '#8a8698');
  }, { use: { x: .9, y: 1.2 }, variants: [{}] }),

  /* ---------------- the Conservatory's flower room: the cooler and the bench ---------------- */
  J('fix.flowercooler', ['flower_cooler'], [1.7, .6, 2.1], p => {
    box(0, 0, 0, 1.7, .6, 2.06, '#e8eef2'); qy(.06, 1.64, .6, .14, 1.9, '#22323a'); lit(() => { qy(.08, 1.62, .6, 1.84, 1.9, '#dff4fa'); });
    for (let r = 0; r < 3; r++) { bx(.08, .1, .2 + r * .58, 1.54, .46, .03, '#c8d0d8'); for (let i = 0; i < 4; i++) { cyl(.26 + i * .38, .4, .23 + r * .58, .1, .16, ['#3a5a6a', '#5a7a8a'][i % 2], { ol: false }); stems(.26 + i * .38, .4, .39 + r * .58, 5, r * 4 + i); } }
    qy(.06, 1.64, .61, .14, 1.9, '#bfe4f4', 'glass'); lw([.85, .61, .14], [.85, .61, 1.9], '#c8d0d8'); frameY(.06, 1.64, .61, .14, 1.9, '#9aa8b0'); for (const x of [.78, .92]) tube([x, .62, .9], [x, .62, 1.2], CHROME);
  }, { use: { x: .85, y: 1.1 }, variants: [{}] }),
  J('fix.floristbench', ['florist_bench'], [2.2, .9, 1.7], p => {
    posts(.06, .06, 2.08, .78, 0, .84, '#5a3a28'); bx(.04, .04, .28, 2.12, .82, .04, '#8a5a3a'); box(0, 0, .84, 2.2, .9, .07, '#b07444', { t: (x, y) => (Math.floor(x * 4) % 2 ? '#c08454' : '#b07444') });
    /* a roll of brown paper on a bar, ribbon spools on pegs, a jar of stems, a half-made bouquet, secateurs */
    posts(.1, .08, .5, .2, .91, 1.3, '#5a3a28'); cyl(.35, .18, 1.14, .13, .2, '#c8a070', { ol: false }); qz(.16, .56, .28, .7, .915, '#c8a070', '#b89060');
    qy(.8, 2.1, .03, 1.1, 1.66, '#e8dcc0'); frameY(.8, 2.1, .03, 1.1, 1.66, '#5a3a28'); for (let i = 0; i < 6; i++) { discY(.94 + i * .2, .06, 1.48, .07, FLW[i], 8); lw([.94 + i * .2, .07, 1.4], [.94 + i * .2, .07, 1.22], FLW[i]); } lw([.86, .05, 1.16], [2.04, .05, 1.16], '#8a8698');
    cyl(1.0, .3, .91, .09, .2, '#9fd4e6', { ol: false }); stems(1.0, .3, 1.1, 7, 3); stems(1.5, .5, .93, 6, 9); qz(1.3, 1.76, .36, .7, .915, '#c8a070'); lw([1.9, .5, .92], [2.06, .64, .92], '#c8322c'); lw([1.9, .56, .92], [2.08, .5, .92], CHROME);
    for (let i = 0; i < 2; i++) cyl(.5 + i * 1.0, .45, .32, .2, .3, '#5a7a8a', { t: '#3a5a6a' });
  }, { use: { x: 1.1, y: 1.4 }, staff: { x: 1.1, y: 1.4, dir: 3 }, variants: [{}] }),

  /* ---------------- Central Station: the announcer's booth and the lost-property cupboard ---------------- */
  J('fix.announcer', ['announcer_booth'], [1.8, 1.3, 2.4], p => {
    const c = '#3f5a4a';
    box(0, 0, 0, 1.8, 1.3, .95, c); qy(.1, 1.7, 1.3, .12, .86, dk(c, .14)); frameY(.1, 1.7, 1.3, .12, .86, BRASS);
    posts(.03, .03, 1.74, 1.24, .95, 2.2, dk(c, .2)); qy(.03, 1.77, 1.3, .95, 2.2, '#bfe4f4', 'glass'); qx(1.8, .03, 1.27, .95, 2.2, '#a8d8ec', 'glass');
    box(-.04, -.04, 2.2, 1.88, 1.38, .16, c, { t: dk(c, .2) }); qy(.3, 1.5, 1.34, 2.22, 2.34, BRASS);
    /* inside: the desk microphone called Gladys, a timetable, a lamp */
    bx(.2, .5, .95, 1.4, .5, .04, '#8a5a3a'); cyl(.9, .8, .99, .07, .03, '#22202a', { ol: false }); post(.9, .8, 1.02, 1.3, CHROME); cyl(.9, .8, 1.26, .07, .14, CHROME, { ol: false, t: '#8a9098' });
    qz(.3, .7, .6, .9, .995, PAPER); lw([.34, .68, 1.0], [.66, .68, 1.0], INK); lw([.34, .78, 1.0], [.6, .78, 1.0], '#8a8698'); lit(() => { spx(1.4, .9, 1.02, 0, 0, '#ff5040'); spx(1.4, .9, 1.02, 1, 0, '#ff5040'); }); glow(() => { qz(.2, 1.6, .5, 1.0, 1.0, '#ffe2a0', 'glass'); });
  }, { vb: [-.2, -.2, 0, 2, 1.6, 2.5], use: { x: .9, y: 1.8 }, variants: [{}] }),
  J('fix.lostprop', ['lost_property'], [2.2, .7, 2.1], p => {
    const c = '#6a4428';
    box(0, 0, 0, 2.2, .7, 2.06, c); qy(.06, 2.14, .7, .08, 1.7, '#3a2618'); for (const z of [.7, 1.25]) bx(.06, .1, z, 2.08, .58, .04, c); lw([1.1, .7, .08], [1.1, .7, 1.7], c);
    /* umbrellas in a bin, a tuba, a teddy, a row of single gloves, hats, a suitcase with a tag */
    cyl(.3, .45, .08, .16, .4, '#5a5664', { t: '#22202a' }); for (let i = 0; i < 4; i++) tube([.26 + i * .03, .45, .2], [.2 + i * .06, .45, .66], ['#22202a', '#d63a3a', '#3c64ad', '#f2c230'][i]);
    box(.62, .2, .08, .42, .34, .5, '#8a5a3a'); qy(.74, .9, .55, .3, .4, PAPER); discY(1.6, .5, .4, .26, BRASS, 10); discY(1.6, .51, .4, .16, '#b8882a', 8); tube([1.44, .5, .3], [1.3, .5, .6], BRASS);
    pix(.2, .56, .74, ['b.b', 'bbb', 'bwb', 'bbb', 'b.b'], { b: '#b07444', w: '#f4e9cf' }); for (let i = 0; i < 5; i++) pix(.56 + i * .14, .56, .74, ['g.', 'gg', 'gg'], { g: ['#d63a3a', '#3c64ad', '#3f8a55', '#22202a', '#f2c230'][i] }); box(1.4, .2, .74, .5, .3, .3, '#3c64ad'); qy(1.5, 1.64, .51, .84, .94, PAPER);
    for (let i = 0; i < 4; i++) { box(.2 + i * .5, .22, 1.29, .34, .3, .12, ['#22202a', '#8a5a3a', '#d63a3a', '#c8a070'][i]); bx(.12 + i * .5, .16, 1.29, .5, .42, .03, ['#22202a', '#8a5a3a', '#d63a3a', '#c8a070'][i]); }
    qy(.3, 1.9, .71, 1.76, 2.0, '#f4e9cf'); textY('LOST', .64, .72, 2.0, INK);
  }, { use: { x: 1.1, y: 1.2 }, variants: [{}] }),

  /* ---------------- the Observatory: the terrace kit ---------------- */
  J('fix.terracekit', ['obs_terrace'], [1.3, .6, 1.9], p => {
    const c = '#2b2d42';
    box(0, 0, 0, 1.3, .6, 1.86, c); qy(.06, 1.24, .6, .08, 1.78, '#1b1c2a'); for (const z of [.64, 1.2]) bx(.06, .08, z, 1.18, .5, .04, c);
    /* red torches on hooks, rolled star charts, blankets, a thermos, the clear-sky flag */
    for (let i = 0; i < 4; i++) { bx(.16 + i * .28, .4, 1.3, .1, .1, .26, '#3a3f4c'); lit(() => { spx(.2 + i * .28, .5, 1.58, 0, 0, '#ff4030'); spx(.2 + i * .28, .5, 1.58, 1, 0, '#ff4030'); }); }
    for (let i = 0; i < 5; i++) cyl(.2 + i * .2, .4, .68, .07, .4, i % 2 ? PAPER : '#f4e9cf', { ol: false, t: '#8a8698' });
    for (let i = 0; i < 3; i++) bx(.12, .14, .1 + i * .15, .6, .4, .14, ['#7a2e3a', '#2f5a4a', '#c8a070'][i]); cyl(1.0, .36, .1, .09, .36, '#3f6a5a', { t: CHROME });
    glow(() => { qy(.06, 1.24, .61, 1.24, 1.78, '#ff5040', 'glass'); }); qy(.2, 1.1, .61, 1.8, 1.86, BRASS);
  }, { use: { x: .65, y: 1.1 }, variants: [{}] }),

  /* ---------------- the Museum: Norm's chair ---------------- */
  J('fix.guardchair', ['mus_guard_chair', 'seat'], [.7, .7, 1.1], p => {
    posts(.1, .1, .5, .5, 0, .46, '#5a3a28'); bx(.06, .06, .46, .58, .58, .07, '#7a2e3a'); bx(.06, .06, .53, .58, .08, .5, '#5a3a28'); qy(.12, .58, .15, .6, .96, '#7a2e3a');
    cyl(.9, .5, 0, .08, .34, '#3f6a5a', { ol: false, t: CHROME }); bx(.74, .2, 0, .2, .16, .06, '#22202a');
  }, { vb: [-.2, -.2, 0, 1.2, 1, 1.2], seats: [{ x: .35, y: .4, z: .5, dir: 1 }], use: { x: .35, y: 1.1 }, variants: [{}] }),
];
