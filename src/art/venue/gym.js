// Gym fixtures.
import { box, qy, qx, qz, lw, fq, glow, lit, ball, cyl, dk, lt, mix, PAT, textY, signY, spx, hash2, rng } from '../../engine/raster.js';
import { F, K, bx, tube, post, posts, frameY, frameX, frameZ, table, counter, till, monitor, goods, plant, compose, mirrorY, screenY, screenLines, bottle, PX } from './_lib.js';
import generic from './generic.js';
const M = '#4a4f5c', MD = '#2e3440', CH = '#c4c9ce';
/** weight plate (disc facing along y) centred at x,z on plane y */
const plateY = (x, y, z, r, c) => { box(x - r, y, z - r, 2 * r, .06, 2 * r, c || MD); spx(x, y + .06, z, 0, 0, CH); };
const barbellY = (x, y0, y1, z, cols) => { tube([x, y0, z], [x, y1, z], CH); (cols || ['#c0392b', '#3c64ad']).forEach((c, i) => { plateY(x, y0 + .08 + i * .07, z, .2 - i * .04, c); }); (cols || ['#c0392b', '#3c64ad']).slice().reverse().forEach((c, i, a) => { plateY(x, y1 - .14 - (a.length - 1 - i) * .07, z, .2 - (a.length - 1 - i) * .04, c); }); };
const dumbbell = (x, y, z, c) => { bx(x, y, z, .08, .1, .1, c); bx(x + .16, y, z, .08, .1, .1, c); lw([x + .08, y + .1, z + .06], [x + .16, y + .1, z + .06], CH); };
const gym = [
  F('gym.treadmill', ['treadmill', 'gym', 'cardio', 'workout'], [2, 1, 1.5], p => {
    const c = p.c || '#3c64ad';
    box(.1, .15, 0, 1.8, .7, .18, MD); qz(.3, 1.85, .22, .78, .181, (x, y) => (Math.floor(x * 16) % 3 === 0) ? '#3a3a46' : '#25252e'); bx(.1, .15, .18, .25, .7, .1, c);
    post(.2, .2, .28, 1.2, CH); tube([.2, .2, 1.0], [.9, .2, .95], M);
    box(.08, .2, 1.15, .22, .6, .28, M); lit(() => { qx(.3, .28, .72, 1.2, 1.4, '#1b2630'); lw([.3, .68, 1.34], [.3, .5, 1.34], '#5af08a'); lw([.3, .68, 1.28], [.3, .4, 1.28], '#ff5a4a'); lw([.3, .44, 1.34], [.3, .32, 1.36], '#f6e04a'); });
    post(.2, .8, .28, 1.2, CH); tube([.2, .8, 1.0], [.9, .8, .95], M); post(.9, .8, .2, .95, M);
  }, { use: { x: 1.1, y: 1.5 }, pose: { x: 1.1, y: .5, z: .18, dir: 2, anim: 'run' }, variants: [{}, { c: '#c0392b' }] }),

  F('gym.bike', ['gym', 'cardio', 'workout'], [1.5, .5, 1.3], p => {
    const c = p.c || '#c0392b';
    bx(.05, .05, 0, .1, .4, .06, MD); bx(1.3, .05, 0, .1, .4, .06, MD); tube([.1, .25, .06], [1.35, .25, .06], M);
    box(.2, .17, .1, .5, .16, .5, c); cyl(.45, .34, .3, .14, .01, MD, { ol: false }); 
    tube([.45, .25, .6], [.3, .25, 1.15], M); bx(.2, .08, 1.12, .12, .34, .05, MD); bx(.2, .16, 1.17, .08, .18, .12, M); lit(() => qx(.28, .18, .32, 1.19, 1.27, '#5af08a'));
    tube([.7, .25, .3], [1.05, .25, .82], M); box(.92, .15, .82, .32, .2, .07, MD);
    lw([.6, .36, .3], [.75, .4, .16], CH); bx(.72, .36, .13, .1, .08, .03, MD);
  }, { use: { x: 1, y: 1 }, seats: [{ x: 1.05, y: .25, z: .88, dir: 2 }], pose: { x: 1.05, y: .25, z: .88, dir: 2, anim: 'cycle' }, variants: [{}, { c: '#f2c230' }, { c: '#2f8f8a' }] }),

  F('gym.rower', ['gym', 'cardio', 'workout'], [2.5, .5, 1], p => {
    const c = p.c || '#3a3f4c';
    bx(.05, .03, 0, .1, .44, .08, MD); bx(2.3, .1, 0, .1, .3, .2, MD); box(.5, .2, .2, 1.9, .1, .06, CH);
    box(.15, .08, .08, .5, .34, .6, c); cyl(.4, .43, .38, .2, .01, '#6a7078', { ol: false }); cyl(.4, .44, .38, .08, .01, CH, { ol: false });
    tube([.5, .25, .68], [.62, .25, .95], M); bx(.56, .16, .92, .06, .18, .12, MD); lit(() => qx(.62, .18, .32, .94, 1.02, '#6ad0f0'));
    box(1.5, .1, .28, .3, .3, .07, MD); lw([.65, .25, .5], [1.1, .25, .5], '#8a8478'); tube([1.1, .1, .5], [1.1, .4, .5], MD);
    bx(.8, .06, .1, .2, .12, .04, MD); bx(.8, .32, .1, .2, .12, .04, MD);
  }, { use: { x: 1.5, y: 1 }, seats: [{ x: 1.65, y: .25, z: .35, dir: 2 }], pose: { x: 1.65, y: .25, z: .35, dir: 2, anim: 'row' }, variants: [{}, { c: '#3c64ad' }] }),

  F('gym.bench', ['gym', 'weights', 'workout'], [2, 1.5, 1.3], p => {
    const c = p.c || '#2e3440';
    post(.35, .15, 0, 1.15, M); bx(.3, .1, 0, .12, .12, .05, MD);
    bx(.5, .68, 0, .08, .16, .4, M); bx(1.7, .68, 0, .08, .16, .4, M); box(.4, .55, .4, 1.5, .4, .1, c, { t: lt(c, .1) }); lw([.9, .95, .45], [.9, .55, .5], lt(c, .25));
    barbellY(.35, 0, 1.5, 1.12, p.plates);
    post(.35, 1.35, 0, 1.15, M); bx(.3, 1.3, 0, .12, .12, .05, MD);
  }, { vb: [-.3, -.3, 0, 2.3, 1.8, 1.6], use: { x: 1.2, y: 1.6 }, pose: { x: 1.2, y: .75, z: .5, dir: 2, anim: 'benchpress' }, variants: [{}, { plates: ['#3f8a55', '#f2c230', '#3a3f4c'], c: '#8a2a2a' }] }),

  F('gym.squatrack', ['gym', 'weights', 'workout'], [1.5, 1.5, 2.3], p => {
    const c = p.c || '#c0392b';
    qz(0, 1.5, 0, 1.5, .03, '#3a3f4c', '#33363f'); frameZ(0, 1.5, 0, 1.5, .03, MD);
    post(.1, .1, 0, 2.25, c); post(.1 + PX, .1, 0, 2.25, dk(c, .2)); post(1.4, .1, 0, 2.25, c); tube([.1, .1, 2.25], [1.4, .1, 2.25], c);
    for (let i = 0; i < 3; i++) plateY(1.4, .16, .5 + i * .45, .16 - i * .02, ['#3c64ad', '#f2c230', '#3f8a55'][i]);
    barbellY(.7, 0, 1.5, 1.45, p.plates);
    tube([.1, .1, 2.25], [.1, 1.4, 2.25], c); tube([1.4, .1, 2.25], [1.4, 1.4, 2.25], c);
    for (const x of [.1, 1.4]) { post(x, 1.4, 0, 2.25, c); post(x + PX, 1.4, 0, 2.25, dk(c, .2)); for (let z = .6; z < 2.1; z += .2) spx(x, 1.4, z, 0, 0, dk(c, .5)); }
    tube([.1, 1.4, 2.25], [1.4, 1.4, 2.25], c); tube([.3, 1.4, 2.1], [1.2, 1.4, 2.1], CH);
  }, { vb: [-.3, -.3, 0, 1.8, 1.8, 2.5], use: { x: .7, y: 1.8 }, pose: { x: .7, y: .75, z: .03, dir: 1, anim: 'squat' }, variants: [{}, { c: '#3a3f4c', plates: ['#c0392b', '#3a3f4c'] }] }),

  F('gym.dumbbells', ['gym', 'weights', 'workout', 'liftstation'], [2, .5, 1], p => {
    posts(.05, .08, 1.9, .36, 0, .9, M); const cols = ['#e87aa0', '#f2c230', '#3fae6a', '#4a90e8', '#c0392b', '#3a3f4c'];
    for (let t = 0; t < 2; t++) { const z = .3 + t * .42; box(0, .05 + (1 - t) * .08, z, 2, .34, .05, M); for (let i = 0; i < 6; i++) dumbbell(.1 + i * .31, .14 + (1 - t) * .08, z + .05, t ? cols[i] : MD); }
  }, { use: { x: 1, y: 1 }, pose: { x: 1, y: 1, z: 0, dir: 3, anim: 'curl' }, variants: [{}] }),

  F('gym.cable', ['gym', 'weights', 'workout'], [1, 1, 2.3], p => {
    const c = p.c || '#3a3f4c';
    box(0, 0, 0, 1, 1, .06, MD); box(.1, .05, .06, .8, .3, 2.14, c); qy(.25, .75, .35, .2, 1.5, '#1e2028'); for (let z = .26; z < 1.2; z += .12) { qy(.3, .7, .35, z, z + .09, '#7d858e'); } spx(.5, .35, .9, 0, 0, '#f2c230'); lw([.5, .35, 1.2], [.5, .35, 2.1], CH);
    box(.1, .05, 2.1, .8, .8, .1, c); lw([.5, .8, 2.1], [.5, .8, 1.35], '#2a2733'); tube([.3, .8, 1.3], [.7, .8, 1.3], CH); spx(.3, .8, 1.3, -1, 0, MD); spx(.7, .8, 1.3, 1, 0, MD);
    signY('GYM', .2, .8, .35, 1.6, 2.04, c, '#f2c230', { frame: false });
  }, { use: { x: .5, y: 1.5 }, pose: { x: .5, y: 1.2, z: 0, dir: 3, anim: 'pull' }, variants: [{}, { c: '#c0392b' }] }),

  F('gym.bag', ['gym', 'boxing', 'workout'], [1, 1, 2.4], p => {
    const c = p.c || '#c0392b';
    box(.1, .1, 0, .8, .3, .1, MD); bx(.1, .1, 0, .16, .8, .1, MD); bx(.74, .1, 0, .16, .8, .1, MD); post(.5, .22, .1, 2.3, M); post(.5 + PX, .22, .1, 2.3, MD); tube([.5, .22, 2.3], [.5, .7, 2.3], M); lw([.5, .22, 1.9], [.5, .45, 2.3], M);
    lw([.5, .7, 2.3], [.5, .7, 1.8], CH); cyl(.5, .7, .75, .2, 1.05, c, { t: dk(c, .2) }); lw([.36, .84, 1.5], [.64, .84, 1.5], '#f1ede4'); lw([.36, .84, 1.44], [.64, .84, 1.44], dk(c, .3)); lw([.36, .84, 1.0], [.64, .84, 1.0], dk(c, .3));
  }, { use: { x: .5, y: 1.5 }, pose: { x: .5, y: 1.4, z: 0, dir: 3, anim: 'punch' }, variants: [{}, { c: '#2e3440' }, { c: '#3c64ad' }] }),

  F('gym.mat', ['yoga_studio', 'gym', 'yoga', 'workout'], [2, 1, .1], p => {
    const c = p.c || '#7a55b0'; if (p.rolled) { for (let i = 0; i < 3; i++) { const k = [c, '#3fae6a', '#e8843a'][i]; box(.2, .1 + i * .28, 0, 1.4, .24, .22, k, { t: lt(k, .15) }); lw([1.6, .12 + i * .28, .12], [1.6, .3 + i * .28, .12], dk(k, .4)); } return; }
    box(.1, .15, 0, 1.8, .7, .03, c, { t: lt(c, .1) }); lw([.2, .25, .03], [1.8, .25, .03], lt(c, .35)); lw([.2, .75, .03], [1.8, .75, .03], lt(c, .35)); if (p.block) { bx(.3, .3, .03, .2, .14, .1, '#4a90e8'); cyl(1.6, .5, .03, .06, .2, '#e87aa0', { ol: false }); }
  }, { solid: false, flat: true, use: { x: 1, y: .5 }, pose: { x: 1, y: .5, z: .03, dir: 1, anim: 'yoga' }, variants: [{}, { c: '#2f8f8a', block: true }, { c: '#e87aa0' }, { rolled: true }] }),

  F('gym.mirror', ['gym', 'clothing', 'mirror', 'decor'], p => [p.w || 2, .1, 2.2], p => { const w = p.w || 2; qy(0, w, .03, .2, 2.2, '#8a9098'); mirrorY(.05, w - .05, .04, .25, 2.15, '#6a7078'); if (w > 1.5) lw([w / 2, .04, .25], [w / 2, .04, 2.15], '#8a9aa4'); tube([.1, .1, .95], [w - .1, .1, .95], p.bar === false ? '#8a9aa4' : '#d2a26a'); },
    { wall: true, mount: .2, solid: false, variants: [{ w: 2 }, { w: 3 }, { w: 1, bar: false }] }),

  F('gym.reception', ['front_desk', 'gym', 'checkout', 'reception'], [2.5, .5, 1.1], p => {
    const c = p.c || '#2e3440', a = p.a || '#f2c230';
    counter(0, 0, 2.5, .5, 1.05, c, '#d2a26a', { panels: false }); qy(0, 2.5, .5, .1, .2, a); signY(p.name || 'FIT CLUB', .2, 2.3, .5, .35, .85, c, a, { frame: false }); lit(() => lw([.2, .5, .32], [2.3, .5, .32], a));
    monitor(.3, .1, 1.05, .42, .3, { scr: '#3a6ea5' }); for (let i = 0; i < 4; i++) box(1.2, .1, 1.05 + i * .06, .34, .3, .06, i % 2 ? '#f1ede4' : '#9fd0e8', { ol: i === 3 });
    bx(1.75, .15, 1.05, .12, .2, .16, '#3a3f4c'); lit(() => spx(1.8, .35, 1.15, 0, 0, '#5af08a')); bottle(2.1, .2, 1.05, '#4a90e8', .14); bottle(2.25, .25, 1.05, '#e8843a', .14);
  }, { vb: [-.3, -.3, 0, 2.8, .8, 1.7], use: { x: 1.8, y: 1 }, staff: { x: .5, y: -.5, dir: 1 }, variants: [{}, { c: '#c0392b', a: '#f1ede4', name: 'IRON BAY' }] }),

  F('gym.whiteboard', ['gym', 'trainstation', 'whiteboard'], [1.5, .5, 1.9], p => {
    bx(.05, .05, 0, .08, .4, .05, M); bx(1.37, .05, 0, .08, .4, .05, M); post(.09, .25, 0, 1.85, CH); post(1.41, .25, 0, 1.85, CH);
    box(.05, .2, .7, 1.4, .08, 1.15, '#aab2ba'); qy(.1, 1.4, .28, .76, 1.8, '#f8f6f0');
    textY(p.name || 'TODAY', .16, .28, 1.74, '#c0392b'); for (let r = 0; r < 5; r++) { spx(.2, .28, 1.3 - r * .11, 0, 0, '#3c64ad'); lw([.26, .28, 1.3 - r * .11 + .0], [.5 + hash2(r, p.seed || 1) * .5, .28, 1.3 - r * .11], r % 2 ? '#3a3f4c' : '#3c64ad'); }
    lw([1.1, .28, 1.6], [1.2, .28, 1.4], '#3f8a55'); lw([1.2, .28, 1.4], [1.3, .28, 1.7], '#3f8a55'); bx(.3, .28, .7, .5, .06, .03, '#8a9098'); bx(.35, .29, .73, .1, .03, .03, '#c0392b'); bx(.5, .29, .73, .1, .03, .03, '#3c64ad');
  }, { use: { x: .75, y: 1 }, staff: { x: .75, y: 1, dir: 1 }, variants: [{}, { name: 'HIIT', seed: 5 }] }),

  F('gym.kettlebells', ['gym', 'weights', 'liftstation', 'workout'], [1, .5, .5], p => {
    bx(0, .05, 0, 1, .4, .04, MD); ['#e87aa0', '#f2c230', '#4a90e8', '#c0392b'].forEach((c, i) => { const x = .14 + i * .24, r = .09 + i * .012; ball(x, .25, .04 + r, r, c); lw([x - .04, .25, .04 + 2 * r + .04], [x + .04, .25, .04 + 2 * r + .04], MD); spx(x - .04, .25, .04 + 2 * r, 0, 0, MD); spx(x + .04, .25, .04 + 2 * r, 0, 0, MD); });
  }, { use: { x: .5, y: 1 }, pose: { x: .5, y: 1, z: 0, dir: 3, anim: 'curl' } }),

  F('gym.balls', ['gym', 'decor', 'yoga'], [1, 1, 1], p => {
    posts(.05, .05, .9, .9, 0, .5, CH); frameZ(.05, .95, .05, .95, .5, CH); ball(.35, .35, .38, .3, p.a || '#4a90e8'); ball(.68, .6, .34, .26, p.b || '#e87aa0'); ball(.45, .55, .82, .24, p.c || '#9ccc4a'); frameZ(.05, .95, .05, .95, .25, CH);
  }, { variants: [{}, { a: '#f2c230', b: '#7a55b0', c: '#c0392b' }] }),

  F('gym.towels', ['towel_station', 'gym', 'decor', 'shelf'], [1, .5, 1.5], p => {
    const c = '#d2a26a'; box(0, 0, 0, 1, .5, 1.45, c, { l: goods('folded', 3, { seed: p.seed || 2, back: dk(c, .5), board: lt(c, .2), pal: p.pal || ['#f1ede4', '#9fd0e8', '#f1ede4', '#6fb6d8'] }) }); qy(0, 1, .5, 0, .08, dk(c, .5));
    bottle(.2, .25, 1.45, '#4a90e8', .14); bottle(.35, .25, 1.45, '#9ccc4a', .14); plant(.75, .25, 1.45, .6);
  }, { use: { x: .5, y: 1 }, variants: [{}, { pal: ['#f2c230', '#f1ede4', '#3a3f4c'], seed: 5 }] }),
];
export default gym;
export const galleryItems = [
  compose([gym, generic], 'room.gym', 9, 7, 3, { floor: PAT.ftile('#5a606c', '#535966', 1), wall: '#d8d4c8', dado: .5, dadoc: '#c0392b' }, [
    ['gym.mirror', .5, 0, { w: 3 }], ['gym.mirror', 3.6, 0, { w: 2 }], ['gym.towels', 6, .05], ['gym.cable', 7.6, .1],
    ['gym.treadmill', .4, 1.2], ['gym.treadmill', .4, 2.4, { c: '#c0392b' }], ['dude', 1.5, 1.7, '#9ccc4a', .18], ['gym.bike', 3, 1.2], ['gym.bike', 3, 2.0, { c: '#f2c230' }], ['gym.rower', 5, 1.4],
    ['gym.bench', .5, 4.2], ['gym.squatrack', 3, 4], ['gym.dumbbells', 5.2, 3.2], ['gym.bag', 7.6, 2.4], ['gym.mat', 5.2, 4.6, { c: '#2f8f8a', block: true }], ['gym.mat', 5.2, 5.7, { c: '#e87aa0' }],
    ['gym.whiteboard', 7.3, 4.4], ['gym.kettlebells', 7.6, 6], ['gym.balls', .3, 5.9], ['dude', 6.2, 4.1, '#2e3440'], ['gym.reception', 1.8 + 99, 6.3],
  ].filter(i => i[1] < 50)),
];
