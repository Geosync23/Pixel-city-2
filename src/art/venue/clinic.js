// Clinic fixtures.
import { box, qy, qx, qz, lw, fq, glow, lit, ball, cyl, dk, lt, mix, PAT, textY, signY, spx, hash2, rng } from '../../engine/raster.js';
import { F, K, bx, tube, post, posts, frameY, frameX, frameZ, table, rtable, chair, stool, sofa, counter, till, monitor, goods, shelf, heap, heap2, carton, plant, compose, steam, plate, cup, bottle, lamp, candle, rug, pleat, screenY, screenLines, mirrorY, dude, keyboard, PX } from './_lib.js';
import generic from './generic.js';
const W = '#f1f3f0', T = '#4aa8a0', CH = '#c4c9ce';
const cross = (x, y, z, c) => { qy(x - .03, x + .03, y, z - .1, z + .1, c); qy(x - .1, x + .1, y, z - .03, z + .03, c); };
const wheel = (x, y) => { spx(x, y, 0, 0, -1, '#2a2733'); spx(x, y, 0, 1, -1, '#2a2733'); spx(x, y, 0, 0, -2, '#2a2733'); spx(x, y, 0, 1, -2, '#2a2733'); };
const clinic = [
  F('clinic.reception', ['clinic', 'reception', 'checkout', 'counter'], [2.5, .5, 1.2], p => {
    const a = p.a || T; counter(0, 0, 2.5, .5, 1.1, W, '#e4e8e4', { panels: false }); qy(0, 2.5, .5, .1, .3, a); qy(.2, .7, .5, .42, .92, a); cross(.45, .5, .67, '#f8fbf8'); signY('CLINIC', .8, 2.4, .5, .44, .9, W, a, { frame: false });
    monitor(.25, .08, 1.1, .42, .3, { scr: '#3a8a9a' }); bx(1.0, .15, 1.1, .22, .28, .03, '#8a5a3a'); qz(1.02, 1.2, .17, .4, 1.131, '#f8f4ea'); cyl(1.5, .25, 1.1, .05, .1, '#3a3f4c', { ol: false }); post(1.5, .25, 1.2, 1.3, '#3c64ad');
    box(1.8, .12, 1.1, .3, .2, .12, '#f8fbf8'); spx(1.95, .32, 1.18, 0, 0, a); bottle(2.3, .2, 1.1, '#9fd0e8', .12);
  }, { vb: [-.3, -.3, 0, 2.8, .8, 1.8], use: { x: 1.4, y: 1 }, staff: { x: .5, y: -.5, dir: 1 }, variants: [{}, { a: '#4a7ac0' }] }),

  F('clinic.chairs', ['waiting_room', 'clinic', 'bank', 'office', 'seating', 'waiting'], p => [(p.n || 3) * .5, .5, 1], p => {
    const n = p.n || 3, c = p.c || T; tube([.05, .2, .2], [n * .5 - .05, .2, .2], CH); post(.08, .1, 0, .2, CH); post(.08, .42, 0, .2, CH); post(n * .5 - .08, .42, 0, .2, CH); post(n * .5 - .08, .1, 0, .2, CH);
    for (let i = 0; i < n; i++) { const x = i * .5; bx(x + .05, .04, .45, .4, .07, .45, c); bx(x + .05, .04, .37, .4, .42, .08, lt(c, .08)); lw([x + .05, .46, .45], [x + .45, .46, .45], lt(c, .4)); }
  }, { seats: p => Array.from({ length: p.n || 3 }, (_, i) => ({ x: .25 + i * .5, y: .25, z: .45, dir: 1 })), variants: [{ n: 3 }, { n: 4, c: '#4a7ac0' }, { n: 2, c: '#e8843a' }] }),

  F('clinic.exambed', ['exam_room', 'clinic', 'exam', 'bed', 'nursestation'], [2, 1, 1], p => {
    const c = p.c || '#4a7ac0'; box(.1, .15, 0, 1.8, .7, .6, W); qy(.1, 1.9, .85, 0, .08, '#8a9098'); frameY(.2, .95, .85, .14, .52, '#aab2ba'); frameY(1.05, 1.8, .85, .14, .52, '#aab2ba');
    box(.05, .12, .6, 1.9, .76, .12, c, { t: lt(c, .12) }); fq([[.05, .12, .72], [.55, .12, .9], [.55, .88, .9], [.05, .88, .72]], lt(c, .2)); qz(.6, 1.95, .2, .8, .725, '#f8fbf8', '#e4eeee'); cyl(.1, .5, .86, .08, .02, '#f8fbf8', { ol: false });
    box(1.3, .95, 0, .5, .3 - .25, .2, CH, { ol: false }); 
  }, { use: { x: 1, y: 1.5 }, bed: { x: 1, y: .5, z: .72, dir: 0 }, variants: [{}, { c: '#3a3f4c' }, { c: T }] }),

  F('clinic.bed', ['exam_room', 'clinic', 'bed', 'ward', 'nursestation'], [2.5, 1.5, 2], p => {
    const cc = p.cc || '#9fd0c8';
    posts(.03, .03, 2.44, .0, 0, 1.95, CH); tube([.03, .03, 1.95], [2.47, .03, 1.95], CH); qy(.03, p.half ? 1.3 : 2.47, .05, .35, 1.9, pleat(cc)); for (let x = .1; x < (p.half ? 1.3 : 2.47); x += .2) spx(x, .05, 1.93, 0, 0, '#8a9098');
    box(.2, .35, 0, .08, .9, 1.0, W); posts(.3, .4, 1.9, .8, 0, .4, CH); box(.25, .35, .4, 2.05, .9, .14, '#e4e8ec'); box(.28, .38, .54, 2.0, .84, .1, '#f8fbf8');
    box(1.0, .36, .56, 1.28, .88, .1, p.b || '#8ac0d8', { t: lt(p.b || '#8ac0d8', .15) }); qz(1.0, 1.15, .36, 1.24, .665, '#f8fbf8'); bx(.38, .55, .64, .45, .5, .08, '#f8fbf8');
    box(2.3, .35, .2, .06, .9, .55, W); tube([.9, 1.26, .8], [1.9, 1.26, .8], CH); post(.9, 1.26, .5, .8, CH); post(1.9, 1.26, .5, .8, CH); post(1.4, 1.26, .5, .8, CH);
    for (const [a, b] of [[.3, 1.2], [2.2, 1.2], [2.2, .4]]) wheel(a, b); qy(2.3, 2.36 + .14, 1.25, .5, .7, '#f8f4ea');
  }, { use: { x: 1.3, y: 1.8 }, bed: { x: 1.3, y: .8, z: .66, dir: 0 }, variants: [{}, { cc: '#f4c8c0', b: '#f1ede4', half: true }, { cc: '#a8b8e0', b: '#9fd0c8' }] }),

  F('clinic.cabinet', ['supply_cabinet', 'clinic', 'medstation', 'shelf'], [1, .5, 2], p => {
    box(0, 0, 0, 1, .5, 1.95, W); qy(0, 1, .5, 0, .08, '#8a9098'); frameY(.06, .49, .5, .14, .78, '#aab2ba'); frameY(.51, .94, .5, .14, .78, '#aab2ba'); spx(.45, .5, .5, 0, 0, '#5a6272'); spx(.55, .5, .5, 0, 0, '#5a6272');
    qy(.06, .94, .5, .86, 1.88, goods('med', 4, { seed: p.seed || 2, back: '#dceef0', board: '#f8fbf8' })); qy(.06, .94, .5, .86, 1.88, '#e4f6fa', 'glass'); frameY(.06, .94, .5, .86, 1.88, '#8a9aa4'); lw([.5, .5, .86], [.5, .5, 1.88], '#8a9aa4'); cross(.5, .5, .46, '#d63a3a'); lw([.15, .5, 1.8], [.25, .5, 1.5], '#f8feff');
  }, { use: { x: .5, y: 1 }, variants: [{ seed: 2 }, { seed: 7 }] }),

  F('clinic.nurse', ['chart_desk', 'clinic', 'nursestation', 'computer', 'desk'], [2, 1, 1.4], p => {
    const a = p.a || T; box(0, 0, 0, 2, .12, 1.3, W); qy(0, 2, .12, 1.1, 1.3, a); for (let i = 0; i < 4; i++) { qy(1.05 + i * .22, 1.23 + i * .22, .12, .82, 1.06, ['#f6e08a', '#9fd0e8', '#f4b8c8', '#b8e0a8'][i]); qy(1.07 + i * .22, 1.21 + i * .22, .12, .96, 1.02, '#f8f4ea'); }
    table(0, .12, 2, .6, .78, '#e4e8e4', { leg: CH, inset: .04 }); box(1.5, .16, 0, .46, .5, .66, W); frameY(1.54, 1.92, .66, .08, .32, '#aab2ba'); frameY(1.54, 1.92, .66, .36, .62, '#aab2ba');
    monitor(.3, .2, .78, .5, .36, { scr: '#f4fbfc', ink: a, seed: p.seed || 2 }); keyboard(.36, .5, .781); bx(1.0, .3, .78, .22, .28, .03, '#8a5a3a'); qz(1.02, 1.2, .32, .56, .811, '#f8f4ea'); bx(1.55, .25, .78, .2, .2, .08, '#f1ede4'); lw([1.57, .45, .88], [1.73, .45, .88], '#5a6272');
    lit(() => { lw([.34, .25, 1.0], [.4, .25, 1.0], '#d63a3a'); lw([.4, .25, 1.0], [.44, .25, 1.08], '#d63a3a'); lw([.44, .25, 1.08], [.5, .25, .94], '#d63a3a'); lw([.5, .25, .94], [.56, .25, 1.0], '#d63a3a'); lw([.56, .25, 1.0], [.74, .25, 1.0], '#d63a3a'); });
    stool(.6, .88, .5, a, { r: .17 });
  }, { use: { x: .6, y: 1.3 }, staff: { x: .6, y: 1.3, dir: 3 }, seats: [{ x: .6, y: .88, z: .5, dir: 3 }], variants: [{}, { a: '#4a7ac0', seed: 6 }] }),

  F('clinic.iv', ['clinic', 'decor', 'iv'], [.5, .5, 1.9], p => {
    for (const [a, b] of [[-.16, 0], [.16, 0], [0, .16], [0, -.16]]) { lw([.25, .25, .06], [.25 + a, .25 + b, .03], CH); wheel(.25 + a, .25 + b); }
    tube([.25, .25, .05], [.25, .25, 1.85], CH); tube([.12, .25, 1.85], [.38, .25, 1.85], CH); box(.07, .22, 1.5, .14, .06, .3, '#e4f6fa', { l: '#c4e6f0' }); qy(.07, .21, .28, 1.5, 1.62, p.c || '#f6e08a'); lw([.14, .28, 1.5], [.2, .28, 1.0], '#e4f6fa'); bx(.2, .23, .95, .1, .08, .16, '#f1ede4'); lit(() => spx(.25, .31, 1.05, 0, 0, '#5af08a'));
  }, { variants: [{}, { c: '#e87a7a' }] }),

  F('clinic.scale', ['clinic', 'scale', 'exam'], [.5, .5, 1.9], p => {
    box(.05, .05, 0, .4, .4, .08, '#3a3f4c', { t: '#5a6272' }); tube([.25, .1, .08], [.25, .1, 1.3], CH); bx(.1, .06, 1.3, .3, .08, .1, W); lw([.12, .14, 1.36], [.38, .14, 1.36], '#3a3f4c'); spx(.3, .14, 1.36, 0, -1, '#d63a3a');
    post(.3, .1, 1.4, 1.85, CH); for (let z = 1.45; z < 1.85; z += .08) spx(.3, .1, z, 1, 0, '#3a3f4c'); lw([.3, .1, 1.7], [.3, .35, 1.7], CH);
  }, { use: { x: .25, y: .25 }, variants: [{}] }),

  F('clinic.eyechart', ['clinic', 'decor', 'chart'], [1, .1, 2.1], p => {
    if (p.kind === 'xray') { box(0, 0, 1.1, 1, .06, .9, '#3a3f4c'); lit(() => { qy(.05, .95, .06, 1.15, 1.95, '#dff0f8'); qy(.1, .48, .06, 1.2, 1.9, '#3a5a78', '#2a4a68'); qy(.52, .9, .06, 1.2, 1.9, '#3a5a78', '#2a4a68'); for (let i = 0; i < 5; i++) { lw([.16, .06, 1.75 - i * .1], [.42, .06, 1.78 - i * .1], '#c8e4f0'); } lw([.29, .06, 1.25], [.29, .06, 1.85], '#e4f6fa'); lw([.6, .06, 1.85], [.68, .06, 1.3], '#e4f6fa'); lw([.78, .06, 1.85], [.72, .06, 1.3], '#e4f6fa'); ball(.7, .07, 1.28, .05, '#e4f6fa', { ol: false }); }); return; }
    if (p.kind === 'body') { box(.1, 0, 1.0, .8, .04, 1.05, '#f8f4ea'); qy(.1, .9, .04, 1.9, 2.05, T); ball(.5, .05, 1.78, .07, '#e8a890', { ol: false }); qy(.4, .6, .04, 1.3, 1.68, '#e8a890'); qy(.44, .56, .04, 1.45, 1.6, '#d63a3a'); qy(.42, .49, .04, 1.05, 1.3, '#e8a890'); qy(.51, .58, .04, 1.05, 1.3, '#e8a890'); for (let i = 0; i < 3; i++) lw([.66, .04, 1.6 - i * .14], [.84, .04, 1.6 - i * .14], '#8a8478'); return; }
    box(.15, 0, 1.0, .7, .04, 1.05, '#f8f4ea'); textY('E', .44, .04, 1.98, '#2a2733'); textY('F P', .34, .04, 1.78, '#2a2733'); for (let r = 0; r < 5; r++) for (let i = 0; i < 3 + r; i++) spx(.5 - (3 + r) * .035 + i * .07, .04, 1.5 - r * .09, 0, 0, '#3a3f4c'); lw([.25, .04, 1.2], [.75, .04, 1.2], '#d63a3a'); lw([.25, .04, 1.29], [.75, .04, 1.29], '#3f8a55');
  }, { wall: true, mount: 1, solid: false, variants: [{}, { kind: 'body' }, { kind: 'xray' }] }),

  F('clinic.sink', ['clinic', 'sink', 'hygiene'], [1, .5, 1.9], p => {
    box(0, 0, 0, 1, .5, .85, W); qy(0, 1, .5, 0, .08, '#8a9098'); frameY(.06, .49, .5, .14, .76, '#aab2ba'); frameY(.51, .94, .5, .14, .76, '#aab2ba'); box(-.02, -.02, .85, 1.04, .54, .05, '#e4e8e4');
    qz(.2, .8, .1, .42, .901, '#aab2ba'); qz(.25, .75, .14, .38, .901, '#c4e6f0', '#e4f6fa'); tube([.5, .06, .9], [.5, .06, 1.1], CH); tube([.5, .06, 1.1], [.5, .2, 1.08], CH); cyl(.9, .12, .9, .05, .14, '#4a7ac0', { ol: false }); post(.9, .12, 1.04, 1.1, '#f1ede4');
    box(.15, 0, 1.25, .7, .04, .6, CH); mirrorY(.19, .81, .04, 1.29, 1.81, '#8a9098'); box(-.0, 0, 1.2, .12, .12, .3, '#f1ede4'); qy(.02, .1, .12, 1.14, 1.2, '#f8f4ea');
  }, { use: { x: .5, y: 1 }, variants: [{}] }),

  F('clinic.wheelchair', ['clinic', 'decor', 'wheelchair'], [1, 1, 1], p => {
    const c = p.c || '#3a5a8a';
    cyl(.5, .2, .27, .26, .0, '#2a2733', { ol: false }); box(.28, .22, .1, .06, .06, .0, '#2a2733');
    for (const y of [.18, .76]) { box(.2, y, .02, .5, .05, .5, '#3a3f4c', { l: (u, v) => { const a = u - 4, b = v - 4, d = a * a + b * b; return d > 17 ? null : d > 8 ? '#2a2733' : d < 2 ? '#8a9098' : (Math.abs(a) < 1 || Math.abs(b) < 1) ? '#aab2ba' : null; }, t: '#00000000', r: '#00000000', ol: false }); }
    box(.25, .25, .42, .5, .5, .06, c); box(.25, .25, .48, .06, .5, .45, c); tube([.25, .25, .93], [.14, .25, .96], CH); tube([.25, .75, .93], [.14, .75, .96], CH); tube([.3, .23, .62], [.7, .23, .62], CH); tube([.3, .78, .62], [.7, .78, .62], CH);
    lw([.75, .3, .42], [.9, .3, .1], CH); lw([.75, .7, .42], [.9, .7, .1], CH); bx(.84, .26, .08, .14, .12, .02, '#3a3f4c'); bx(.84, .62, .08, .14, .12, .02, '#3a3f4c'); wheel(.82, .3); wheel(.82, .72);
  }, { seats: [{ x: .5, y: .5, z: .48, dir: 0 }], variants: [{}, { c: '#8a2a2a' }] }),

  F('clinic.screen', ['clinic', 'decor', 'divider'], [1.5, .5, 1.8], p => {
    const c = p.c || '#9fd0c8'; for (let i = 0; i < 3; i++) { const x = i * .5, y = i % 2 ? .12 : .3; fq([[x, i % 2 ? .3 : .12, .2], [x + .5, y, .2], [x + .5, y, 1.7], [x, i % 2 ? .3 : .12, 1.7]], i % 2 ? dk(c, .12) : c); lw([x, i % 2 ? .3 : .12, 1.7], [x + .5, y, 1.7], CH); lw([x, i % 2 ? .3 : .12, .2], [x + .5, y, .2], CH); post(x, i % 2 ? .3 : .12, 0, 1.75, CH); }
    post(1.5, .12, 0, 1.75, CH); wheel(0, .12); wheel(1.5, .12);
  }, { variants: [{}, { c: '#f4c8c0' }] }),

  F('clinic.cart', ['clinic', 'medstation', 'cart'], [1, .5, 1.2], p => {
    const c = p.c || '#d63a3a'; box(.05, .04, .1, .9, .42, .85, c); for (let i = 0; i < 4; i++) { frameY(.1, .9, .46, .15 + i * .2, .31 + i * .2, dk(c, .4)); lw([.4, .46, .24 + i * .2], [.6, .46, .24 + i * .2], '#e4e8ec'); }
    box(.02, .02, .95, .96, .46, .04, '#e4e8ec'); box(.1, .1, .99, .3, .26, .14, '#f1ede4'); lit(() => { qy(.12, .38, .36, 1.03, 1.11, '#1e2028'); lw([.14, .36, 1.07], [.2, .36, 1.07], '#5af08a'); lw([.2, .36, 1.07], [.24, .36, 1.1], '#5af08a'); lw([.24, .36, 1.1], [.28, .36, 1.05], '#5af08a'); lw([.28, .36, 1.05], [.36, .36, 1.07], '#5af08a'); });
    bottle(.6, .2, .99, '#9fd0e8', .1); bx(.72, .14, .99, .16, .2, .08, '#f8fbf8'); for (const [a, b] of [[.1, .44], [.9, .44], [.9, .08]]) wheel(a, b);
  }, { use: { x: .5, y: 1 }, variants: [{}, { c: '#4a7ac0' }] }),

  F('clinic.magtable', ['clinic', 'bank', 'office', 'table', 'waiting'], [1, 1, .5], p => {
    table(.1, .1, .8, .8, .42, p.c || '#d2a26a', { thick: true }); bx(.2, .2, .42, .26, .34, .02, '#e87aa0'); bx(.3, .3, .44, .26, .34, .02, '#6fb6d8'); bx(.6, .55, .42, .22, .28, .02, '#f2c230'); plant(.72, .28, .42, .45, { flower: '#f1ede4' });
  }, { variants: [{}, { c: '#f1ede4' }] }),
];
export default clinic;
export const galleryItems = [
  compose([clinic, generic], 'room.clinic', 9, 7, 2.8, { floor: PAT.ftile('#dfe8e4', '#d0dcd8', 1), wall: '#eef2ec', dado: 1, dadoc: '#a8d4cc' }, [
    ['clinic.eyechart', .3, 0], ['clinic.cabinet', 1.6, .05], ['clinic.sink', 2.8, .05], ['clinic.eyechart', 4.1, 0, { kind: 'xray' }], ['clinic.eyechart', 5.3, 0, { kind: 'body' }], ['clinic.bed', 6.3, .3],
    ['clinic.exambed', .4, 1.6], ['clinic.scale', 2.8, 1.4], ['clinic.iv', 6, 1.2], ['clinic.cart', 3.8, 1.6], ['clinic.screen', 4.4, 2.6],
    ['clinic.nurse', 6.5, 2.8], ['dude', 7.1, 4.1, '#9fd0c8'], ['clinic.reception', .5, 4.4], ['dude', 1, 4.0, '#f1ede4'], ['clinic.chairs', 4, 5.2], ['clinic.chairs', .4, 6.2, { n: 4, c: '#4a7ac0' }], ['clinic.magtable', 5.8, 5.4], ['clinic.wheelchair', 7.4, 5.4], ['dude', 2, 5.6, '#e8843a'],
  ]),
];
