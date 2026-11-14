// Bank / realtor fixtures.
import { box, qy, qx, qz, lw, fq, glow, lit, ball, cyl, dk, lt, mix, PAT, textY, signY, spx, hash2, rng } from '../../engine/raster.js';
import { F, K, bx, tube, post, posts, frameY, frameX, frameZ, table, chair, counter, till, monitor, goods, plant, compose, lamp, screenLines, keyboard, PX } from './_lib.js';
import generic from './generic.js';
import { atm } from './grocery.js';
const G = '#2f5a4a', GD = '#d8a848';
const house = (x, y, z, w, c, r) => { qy(x, x + w, y, z, z + w * .5, c); fq([[x - .02, y, z + w * .5], [x + w + .02, y, z + w * .5], [x + w / 2, y, z + w * .85]], r); qy(x + w * .4, x + w * .6, y, z, z + w * .3, dk(c, .4)); };
const bank = [
  F('bank.teller', ['till', 'bank', 'checkout', 'counter', 'teller'], p => [p.w || 3, .5, 2.2], p => {
    const w = p.w || 3, c = p.c || '#5a4030', n = Math.round(w / 1.5);
    counter(0, 0, w, .5, 1.05, c, '#e8e2d4', { pw: .75 }); qy(0, w, .5, .1, .2, GD);
    for (let i = 0; i < n; i++) { const x = i * 1.5; monitor(x + .2, .05, 1.05, .4, .28, { scr: '#2a6a5a' }); bx(x + .9, .12, 1.05, .3, .2, .04, '#3a3f4c'); qz(x + .92, x + 1.18, .14, .3, 1.091, '#b8e0a8'); }
    qy(0, w, .44, 1.05, 2.0, '#e4f6fa', 'glass'); for (let i = 0; i <= n; i++) { const x = Math.min(w, i * 1.5); post(Math.max(.02, x - .02), .44, 1.05, 2.0, GD); } tube([0, .44, 2.0], [w, .44, 2.0], GD);
    for (let i = 0; i < n; i++) { const x = i * 1.5 + .75; qy(x - .2, x + .2, .44, 1.05, 1.2, '#3a3f4c'); cyl(x, .45, 1.55, .08, 0, GD, { ol: false }); lw([x - .5, .44, 1.9], [x - .3, .44, 1.5], '#f8feff'); box(x - .25, .4, 2.02, .5, .08, .2, '#2a2733'); lit(() => { qy(x - .22, x + .22, .48, 2.04, 2.2, i === (p.closed || -1) ? '#d63a3a' : '#3fae6a'); spx(x, .48, 2.12, 0, 0, '#f4fbfc'); spx(x, .48, 2.12, 0, 1, '#f4fbfc'); spx(x, .48, 2.12, 0, -1, '#f4fbfc'); }); }
  }, { vb: p => [-.3, -.3, 0, (p.w || 3) + .3, .8, 2.4], use: { x: .75, y: 1 }, staff: { x: .75, y: -.5, dir: 1 }, uses: p => Array.from({ length: Math.round((p.w || 3) / 1.5) }, (_, i) => ({ x: .75 + i * 1.5, y: 1 })), variants: [{}, { w: 4.5, closed: 2 }, { w: 1.5, c: '#2e3440' }] }),

  F('bank.desk', ['bank', 'realtor', 'desk', 'seating'], [2, 2, 1.3], p => {
    const c = p.c || '#6a4028'; chair(.75, 0, 1, '#2a2733', { bh: 1.1 });
    box(.1, .6, 0, 1.8, .8, .7, c); qy(.1, 1.9, 1.4, 0, .08, dk(c, .5)); frameY(.2, .95, 1.4, .15, .6, dk(c, .35)); frameY(1.05, 1.8, 1.4, .15, .6, dk(c, .35)); box(.05, .56, .7, 1.9, .88, .06, lt(c, .12));
    monitor(1.3, .7, .76, .44, .32, { scr: '#3a6ea5' }); box(.3, .75, .76, .4, .3, .03, '#6fb858'); house(.36, .9, .79, .28, '#f1ede4', '#c0563a'); bx(.36, .8, .79, .28, .1, .14, '#f1ede4'); // model house
    bx(.85, .95, .76, .3, .22, .02, '#f8f4ea'); lw([.9, 1.17, .78], [1.1, 1.17, .78], '#3c64ad'); box(.7, 1.3, .76, .6, .06, .12, GD, { ol: false }); spx(1.6, 1.2, .78, 0, 0, GD); spx(1.62, 1.2, .78, 1, 0, GD);
    chair(.35, 1.5, 3, p.cc || G); chair(1.15, 1.5, 3, p.cc || G);
  }, { use: { x: 1, y: 2.1 }, staff: { x: 1, y: .25, dir: 1 }, seats: [{ x: 1, y: .25, z: .45, dir: 1, staff: true }, { x: .6, y: 1.75, z: .45, dir: 3 }, { x: 1.4, y: 1.75, z: .45, dir: 3 }], variants: [{}, { c: '#2e3440', cc: '#8a3a3a' }] }),

  F('bank.listings', ['bank', 'realtor', 'listings', 'decor'], [2, .1, 2.3], p => {
    box(0, 0, .9, 2, .05, 1.35, '#5a4030'); qy(.05, 1.95, .05, .95, 2.2, '#f1ede4'); qy(.05, 1.95, .05, 1.95, 2.2, G); textY(p.name || 'HOMES', .1 + (1.8 - (p.name || 'HOMES').length * .25) / 2, .05, 2.15, '#f6e8c8');
    const cs = [['#e8c8a0', '#c0563a'], ['#9fd0e8', '#3a3f4c'], ['#f1ede4', '#3f8a55'], ['#f4b8c8', '#7a4a3a'], ['#d8d2c0', '#3c64ad'], ['#f6e08a', '#8a3a3a'], ['#b8e0a8', '#5a4030'], ['#e8e2d4', '#c0563a']];
    for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) { const x = .12 + i * .46, z = 1.02 + j * .46, k = cs[(i + j * 4 + (p.seed || 0)) % 8]; qy(x, x + .4, .05, z, z + .4, '#bfe0f0'); qy(x, x + .4, .05, z, z + .1, '#8ac070'); house(x + .1, .05, z + .08, .2, k[0], k[1]); qy(x, x + .4, .05, z, z + .06, '#f8f4ea'); lw([x + .04, .05, z + .03], [x + .2, .05, z + .03], '#d63a3a'); frameY(x, x + .4, .05, z, z + .4, '#8a8478'); if ((i + j) % 3 === 0) qy(x + .24, x + .4, .05, z + .3, z + .4, '#d63a3a'); }
  }, { wall: true, mount: .9, solid: false, use: { x: 1, y: .7 }, variants: [{ seed: 0 }, { seed: 3, name: 'FOR SALE' }] }),

  F('bank.vault', ['bank', 'vault', 'decor'], [2.5, .3, 2.5], p => {
    qy(0, 2.5, .04, 0, 2.5, '#6a7078'); qy(.15, 2.35, .06, 0, 2.35, '#3a3f4c'); const c = '#b8c0c8';
    for (const [r, k] of [[1.02, '#8a9098'], [.95, c], [.8, '#aab2ba'], [.3, '#8a9098'], [.24, c]]) { const pts = []; for (let a = 0; a < 24; a++) pts.push([1.25 + Math.cos(a / 24 * 6.283) * r, .1, 1.2 + Math.sin(a / 24 * 6.283) * r]); fq(pts, k); }
    for (let a = 0; a < 12; a++) { const t = a / 12 * 6.283; spx(1.25 + Math.cos(t) * .88, .1, 1.2 + Math.sin(t) * .88, 0, 0, '#5a6272'); spx(1.25 + Math.cos(t) * .88, .1, 1.2 + Math.sin(t) * .88, 1, 0, '#e4e8ec'); }
    for (let a = 0; a < 4; a++) { const t = a / 4 * 3.1416 + .4; tube([1.25 - Math.cos(t) * .42, .14, 1.2 - Math.sin(t) * .42], [1.25 + Math.cos(t) * .42, .14, 1.2 + Math.sin(t) * .42], GD); } ball(1.25, .16, 1.2, .07, GD, { ol: false });
    box(.18, .06, .5, .14, .12, .3, '#5a6272'); box(.18, .06, 1.5, .14, .12, .3, '#5a6272'); lit(() => { qy(2.2, 2.32, .06, 1.2, 1.4, '#1e2028'); spx(2.26, .06, 1.34, 0, 0, '#5af08a'); spx(2.26, .06, 1.26, 0, 0, '#ff4a4a'); });
  }, { wall: true, mount: 0, solid: false, variants: [{}] }),

  F('bank.atm', ['bank', 'atm'], [.5, .5, 1.7], atm, { use: { x: .25, y: 1 }, variants: [{ c: G }, { c: '#3c64ad' }] }),

  F('bank.writing', ['bank', 'decor', 'desk'], [1, .5, 1.3], p => {
    const c = '#5a4030'; box(.1, .08, 0, .8, .34, 1.0, c); qy(.1, .9, .42, 0, .08, dk(c, .5)); frameY(.18, .82, .42, .15, .85, dk(c, .35)); fq([[0, 0, 1.12], [1, 0, 1.12], [1, .5, 1.0], [0, .5, 1.0]], '#e8e2d4'); fq([[1, 0, 1.0], [1, .5, 1.0], [1, 0, 1.12]], dk(c, .36)); lw([0, .5, 1.0], [1, .5, 1.0], GD);
    for (let i = 0; i < 3; i++) fq([[.1 + i * .3, .1, 1.1], [.3 + i * .3, .1, 1.1], [.3 + i * .3, .38, 1.035], [.1 + i * .3, .38, 1.035]], ['#f8f4ea', '#b8e0a8', '#f4b8c8'][i]); post(.9, .06, 1.12, 1.26, '#3a3f4c'); lw([.9, .06, 1.12], [.8, .3, 1.06], '#8a9098');
  }, { use: { x: .5, y: 1 } }),

  F('bank.safebox', ['bank', 'decor', 'vault'], [1.5, .2, 2.1], p => {
    box(0, 0, .3, 1.5, .15, 1.8, '#8a9098'); for (let i = 0; i < 6; i++) for (let j = 0; j < 7; j++) { const x = .05 + i * .235, z = .36 + j * .24; qy(x, x + .21, .15, z, z + .2, '#b8c0c8'); frameY(x, x + .21, .15, z, z + .2, '#5a6272'); spx(x + .06, .15, z + .1, 0, 0, GD); spx(x + .15, .15, z + .1, 0, 0, '#3a3f4c'); }
  }, { wall: true, mount: .3, solid: false, use: { x: .75, y: .7 } }),

  F('bank.brochures', ['bank', 'realtor', 'decor'], [.5, .5, 1.5], p => {
    cyl(.25, .25, 0, .18, .04, '#3a3f4c'); tube([.25, .25, .04], [.25, .25, 1.4], '#8a9098'); for (let i = 0; i < 4; i++) { const z = .35 + i * .27; box(.08, .2, z, .34, .08, .22, '#e4e8ec', { l: goods('mags', 1, { seed: i + (p.seed || 2), back: '#e4e8ec', board: '#8a9098', pal: ['#2f5a4a', '#3c64ad', '#f1ede4', '#d8a848', '#c0563a'] }), ol: false }); }
  }, { use: { x: .25, y: 1 }, variants: [{ seed: 2 }, { seed: 6 }] }),

  F('bank.ticket', ['bank', 'clinic', 'queue', 'decor'], [.5, .5, 1.3], p => {
    box(.1, .1, 0, .3, .3, .08, '#3a3f4c'); box(.19, .19, .08, .12, .12, .8, '#8a9098'); box(.08, .14, .88, .34, .22, .36, p.c || G); lit(() => { qy(.12, .38, .36, 1.06, 1.2, '#1e2028'); textY(String(p.n || 47), .15, .36, 1.2, '#ff8a40'); }); qy(.18, .32, .36, .92, .96, '#1e2028'); qy(.2, .3, .37, .86, .94, '#f8f4ea');
  }, { use: { x: .25, y: 1 }, variants: [{}, { c: '#4aa8a0', n: 12 }] }),
];
export default bank;
export const galleryItems = [
  compose([bank, generic], 'room.bank', 9, 7, 3, { floor: PAT.ftile('#e8e2d4', '#d8cdb5', 1), wall: '#e4dcc8', dado: 1, dadoc: '#2f5a4a' }, [
    ['bank.vault', .3, 0], ['bank.safebox', 3.1, 0], ['bank.listings', 5, 0], ['generic.clock', 7.4, 0], ['generic.window', 7.4 + 99, 0],
    ['bank.teller', .4, 2], ['dude', 1.2, 1.6, '#2f5a4a'], ['dude', 1.2, 3.1, '#e87aa0'], ['bank.desk', 5.4, 1.6], ['bank.atm', 8.3, .2], ['bank.atm', 8.3, .9, { c: '#3c64ad' }],
    ['generic.queuepost', .6, 3.8, { n: 3, kind: 'belt' }], ['bank.ticket', 4.4, 3.4], ['bank.writing', 4.6, 4.6], ['generic.sofa', .5, 5.4], ['generic.plant', 3, 5.6], ['bank.brochures', 8.2, 4.4], ['generic.rug', 5.4, 5 - .3, { w: 3, d: 2 }],
  ].filter(i => i[1] < 50)),
];
