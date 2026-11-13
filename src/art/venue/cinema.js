// Cinema fixtures.
import { box, qy, qx, qz, lw, fq, glow, lit, ball, cyl, dk, lt, mix, PAT, textY, signY, spx, hash2, rng, textW } from '../../engine/raster.js';
import { F, K, bx, tube, post, posts, frameY, frameX, frameZ, table, rtable, chair, stool, sofa, counter, till, monitor, goods, shelf, heap, heap2, carton, plant, compose, steam, plate, cup, bottle, lamp, candle, rug, pleat, screenY, screenLines, mirrorY, dude, keyboard, PX } from './_lib.js';
import generic from './generic.js';
const RED = '#a8242a', GOLD = '#e8b848';
const bulbs = (x0, x1, y, z, n) => lit(() => { for (let i = 0; i < n; i++) spx(x0 + (x1 - x0) * (i + .5) / n, y, z, 0, 0, i % 2 ? '#fff2c4' : '#ffb040'); });
/** film still / poster art on a y-plane. k = which */
function still(x0, x1, y, z0, z1, k) {
  const w = x1 - x0, h = z1 - z0, m = ((k % 4) + 4) % 4;
  if (m === 0) { qy(x0, x1, y, z0, z1, '#f2a040'); qy(x0, x1, y, z0 + h * .5, z1, '#e8643a'); qy(x0, x1, y, z0, z0 + h * .32, '#5a3a4a'); ball(x0 + w * .5, y + .01, z0 + h * .52, Math.min(w, h) * .2, '#f6e04a', { ol: false }); fq([[x0 + w * .15, y, z0 + h * .32], [x0 + w * .22, y, z0 + h * .62], [x0 + w * .29, y, z0 + h * .32]], '#2a1f35'); qy(x0 + w * .7, x0 + w * .76, y, z0 + h * .1, z0 + h * .3, '#2a1f35'); qy(x0 + w * .64, x0 + w * .82, y, z0 + h * .26, z0 + h * .3, '#2a1f35'); }
  else if (m === 1) { qy(x0, x1, y, z0, z1, '#141a33'); for (let i = 0; i < 14; i++) spx(x0 + w * hash2(i, 1), y, z0 + h * (.3 + .68 * hash2(i, 2)), 0, 0, '#f4fbfc'); ball(x0 + w * .72, y + .01, z0 + h * .7, Math.min(w, h) * .16, '#c8a8e8', { ol: false }); fq([[x0 + w * .2, y, z0 + h * .2], [x0 + w * .3, y, z0 + h * .62], [x0 + w * .4, y, z0 + h * .2]], '#d8dde2'); qy(x0 + w * .26, x0 + w * .34, y, z0 + h * .3, z0 + h * .42, '#4ad8f0'); qy(x0 + w * .24, x0 + w * .36, y, z0 + h * .08, z0 + h * .2, '#ff8a40', '#f6e04a'); }
  else if (m === 2) { qy(x0, x1, y, z0, z1, '#f4b8c8'); qy(x0, x1, y, z0, z0 + h * .3, '#e87aa0'); qy(x0 + w * .22, x0 + w * .42, y, z0, z0 + h * .5, '#3c64ad'); qy(x0 + w * .25, x0 + w * .39, y, z0 + h * .5, z0 + h * .72, '#f0c8a0'); qy(x0 + w * .24, x0 + w * .4, y, z0 + h * .68, z0 + h * .8, '#4a3028'); qy(x0 + w * .58, x0 + w * .78, y, z0, z0 + h * .46, '#d63a3a'); qy(x0 + w * .61, x0 + w * .75, y, z0 + h * .46, z0 + h * .68, '#e8b890'); qy(x0 + w * .58, x0 + w * .78, y, z0 + h * .6, z0 + h * .78, '#e8b040'); }
  else { qy(x0, x1, y, z0, z1, '#2f6f5f'); qy(x0, x1, y, z0, z0 + h * .25, '#1e3a34'); for (let i = 0; i < 5; i++) fq([[x0 + w * (.05 + i * .2), y, z0 + h * .2], [x0 + w * (.12 + i * .2), y, z0 + h * (.6 + (i % 2) * .2)], [x0 + w * (.19 + i * .2), y, z0 + h * .2]], i % 2 ? '#3f8a55' : '#2a5a45'); qy(x0 + w * .44, x0 + w * .56, y, z0 + h * .1, z0 + h * .34, '#f2c230'); ball(x0 + w * .5, y + .01, z0 + h * .42, Math.min(w, h) * .08, '#f0c8a0', { ol: false }); }
}
const seat = (x, y, c, face) => { const back = () => { box(x + .04, face ? y + .1 : y + .62, .15, .42, .14, .95, c, { t: lt(c, .15) }); }; if (face) back(); bx(x + .06, y + .22, .3, .38, .4, .14, dk(c, .1), { t: lt(c, .05) }); bx(x, y + .2, .2, .06, .46, .42, '#2a2028'); bx(x + .44, y + .2, .2, .06, .46, .42, '#2a2028'); if (!face) back(); };
const cinema = [
  F('cinema.ticket', ['cinema', 'checkout', 'ticket'], [2, 1, 2.4], p => {
    const c = p.c || RED;
    box(0, 0, 0, 2, 1, 1.0, c, { l: PAT.vstripes(dk(c, .18), dk(c, .28), 6) }); qy(0, 2, 1, 0, .1, '#2a1a20'); qy(0, 2, 1, .9, 1.0, GOLD); box(.6, 1, .92, .8, .12, .05, GOLD);
    qy(.1, 1.9, 0, 1.0, 1.9, '#3a2a30'); glow(() => qy(.1, 1.9, 1, 1.0, 1.9, '#ffe6a0', 'glass'));
    qy(.08, 1.92, 1, 1.0, 1.9, '#e4f6fa', 'glass'); qx(2, .08, .92, 1.0, 1.9, '#c4e2ea', 'glass'); frameY(.08, 1.92, 1, 1.0, 1.9, GOLD); frameX(2, 0, 1, 1.0, 1.9, dk(GOLD, .2)); cyl(1, 1.01, 1.4, .1, 0, '#8a8478', { ol: false }); lw([.2, 1, 1.8], [.4, 1, 1.4], '#f8feff');
    box(-.05, -.05, 1.9, 2.1, 1.1, .46, c); lit(() => signY('TICKETS', .1, 1.9, 1.05, 1.92, 2.34, '#2a1a20', '#ffd060', { frame: false })); bulbs(0, 2, 1.05, 1.91, 10); bulbs(0, 2, 1.05, 2.35, 10);
  }, { vb: [-.3, -.3, 0, 2.3, 1.4, 2.6], use: { x: 1, y: 1.5 }, staff: { x: 1, y: .45, dir: 1 }, light: { x: 1, y: 1.6, z: 0, r: 2.5 }, variants: [{}, { c: '#2a3a6a' }] }),

  F('cinema.concession', ['cinema', 'checkout', 'counter', 'snacks'], [3.5, .5, 2], p => {
    const c = p.c || RED;
    counter(0, 0, 3.5, .5, 1, c, '#f1ede4', { panels: false }); qy(0, 3.5, .5, .1, .92, PAT.vstripes('#f1ede4', c, 4)); lit(() => qy(1.3, 2.5, .5, .2, .8, goods('snacks', 2, { seed: 4, back: '#3a2a20', board: GOLD }))); qy(1.3, 2.5, .5, .2, .8, '#e4f6fa', 'glass'); frameY(1.3, 2.5, .5, .2, .8, GOLD);
    // popcorn machine
    box(.15, .05, 1, .9, .42, .12, c); lit(() => { qy(.18, 1.02, .08, 1.12, 1.8, '#fff2c4'); qz(.2, 1.0, .1, .44, 1.13, heap2(['#f6e8a0', '#f8f4d8', '#e8c860'], 10, 3)); box(.22, .1, 1.12, .76, .34, .22, '#f6e8a0', { ol: false, t: heap2(['#f6e8a0', '#f8f4d8', '#e8c860'], 10, 3), l: heap2(['#f6e8a0', '#f8f4d8', '#e8c860'], 10, 5) }); cyl(.6, .26, 1.55, .12, .14, '#d5dbe0', { ol: false }); });
    qy(.15, 1.05, .47, 1.12, 1.8, '#e4f6fa', 'glass'); frameY(.15, 1.05, .47, 1.12, 1.8, c); box(.12, .03, 1.8, .96, .46, .16, c); lit(() => { qy(.14, 1.06, .49, 1.82, 1.94, '#f6e04a'); lw([.2, .49, 1.88], [1.0, .49, 1.88], c); });
    // soda fountain + cups + till
    box(1.4, .08, 1, .6, .34, .5, '#3a3f4c'); for (let i = 0; i < 4; i++) { lit(() => qy(1.44 + i * .14, 1.54 + i * .14, .42, 1.3, 1.44, ['#d63a3a', '#f28a30', '#3fae6a', '#6fb6d8'][i])); lw([1.49 + i * .14, .42, 1.3], [1.49 + i * .14, .42, 1.2], '#d5dbe0'); }
    for (let i = 0; i < 3; i++) cyl(2.2 + i * .13, .22, 1, .05, .16 + i * .03, i % 2 ? '#f1ede4' : c, { ol: false, t: '#f1ede4' }); box(2.65, .12, 1, .24, .2, .26, '#f1ede4', { l: PAT.vstripes('#f1ede4', c, 2), t: heap2(['#f6e8a0', '#f8f4d8'], 10, 1) }); till(3.05, .08, 1);
  }, { vb: [-.3, -.3, 0, 3.8, .8, 2.2], use: { x: 2.8, y: 1 }, staff: { x: 2, y: -.5, dir: 1 }, light: { x: .6, y: 1, z: 0, r: 2 }, variants: [{}, { c: '#2a3a6a' }] }),

  F('cinema.poster', ['cinema', 'poster', 'decor'], [1, .1, 2.2], p => {
    const k = p.frame || 0; box(.05, 0, .6, .9, .06, 1.5, '#2a2028'); lit(() => { still(.12, .88, .06, .95, 2.02, k); qy(.12, .88, .06, .68, .95, ['#2a1f35', '#f4fbfc', '#f8f4ea', '#f6e04a'][k % 4]); lw([.2, .06, .86], [.8, .06, .86], ['#f6e04a', '#141a33', '#d63a3a', '#1e3a34'][k % 4]); lw([.3, .06, .78], [.7, .06, .78], ['#f6e04a', '#141a33', '#d63a3a', '#1e3a34'][k % 4]); }); frameY(.1, .9, .06, .66, 2.04, GOLD); bulbs(.1, .9, .06, 2.07, 5);
  }, { wall: true, mount: .6, solid: false, frames: 4, variants: [{ frame: 0 }, { frame: 1 }, { frame: 2 }, { frame: 3 }] }),

  F('cinema.seats', ['cinema', 'seating'], p => [(p.n || 4) * .5, 1, 1.1], p => { const n = p.n || 4; for (let i = 0; i < n; i++) seat(i * .5, 0, p.c || RED, p.face); if (!p.face) for (let i = 0; i < n; i++) { spx(i * .5 + .25, .76, .95, 0, 0, GOLD); } },
    { seats: p => Array.from({ length: p.n || 4 }, (_, i) => ({ x: .25 + i * .5, y: .42, z: .44, dir: p.face ? 1 : 3 })), variants: [{ n: 4 }, { n: 6 }, { n: 2, c: '#2a3a6a' }, { n: 4, face: true }] }),

  F('cinema.screen', ['cinema', 'screen'], p => [p.w || 6, .3, 3.3], p => {
    const w = p.w || 6, k = p.frame || 0;
    qy(0, w, .04, .5, 3.3, '#1e1a20'); lit(() => { still(.5, w - .5, .06, .75, 3.05, k); if (k % 3 === 2) { qy(.5, w - .5, .06, .75, .95, '#141a20'); qy(.5, w - .5, .06, 2.85, 3.05, '#141a20'); } });
    glow(() => qz(.3, w - .3, .1, 1.2, .01, ['#ffb060', '#8a9af0', '#f4a8c0'][k % 3], 'glass'));
    frameY(.5, w - .5, .06, .75, 3.05, '#3a3440'); qy(0, .5, .1, .5, 3.3, pleat(RED)); qy(w - .5, w, .1, .5, 3.3, pleat(RED)); qy(0, w, .12, 3.05, 3.3, pleat(dk(RED, .1))); lw([0, .12, 3.05], [w, .12, 3.05], GOLD); box(0, 0, 0, w, .3, .5, '#2a2028');
  }, { wall: true, mount: 0, solid: false, frames: 3, light: { x: 3, y: 1.5, z: 0, r: 5 }, variants: [{ frame: 0 }, { frame: 1 }, { frame: 2 }, { frame: 3, w: 4 }] }),

  F('cinema.popcorn', ['cinema', 'snacks', 'decor'], [1, .5, 1.9], p => {
    const c = RED; for (const [a, b] of [[.1, .42], [.9, .42], [.9, .08]]) { spx(a, b, 0, 0, -1, '#2a2733'); spx(a, b, 0, 1, -1, '#2a2733'); spx(a, b, 0, 0, -2, GOLD); }
    box(0, 0, .1, 1, .5, .75, c); qy(.1, .9, .5, .25, .7, '#f1ede4'); textY('POP', .28, .5, .58, c); lit(() => { qy(.08, .92, .08, .9, 1.55, '#fff2c4'); box(.1, .08, .88, .8, .34, .2, '#f6e8a0', { ol: false, t: heap2(['#f6e8a0', '#f8f4d8', '#e8c860'], 10, 3), l: heap2(['#f6e8a0', '#f8f4d8', '#e8c860'], 10, 5) }); cyl(.5, .25, 1.35, .1, .12, '#d5dbe0', { ol: false }); });
    qy(.05, .95, .47, .88, 1.58, '#e4f6fa', 'glass'); frameY(.05, .95, .47, .88, 1.58, GOLD); box(0, 0, 1.58, 1, .5, .2, c); bulbs(.05, .95, .5, 1.68, 6);
  }, { use: { x: .5, y: 1 }, light: { x: .5, y: 1, z: 0, r: 1.5 } }),

  F('cinema.standee', ['cinema', 'decor'], [1, .5, 1.9], p => {
    const k = p.frame || 1; bx(.1, .1, 0, .8, .3, .04, '#c8a068'); fq([[.5, .1, 0], [.5, .25, 0], [.5, .25, 1.2]], '#b8905a'); box(.1, .25, 0, .8, .04, 1.5, '#f8f4ea'); still(.14, .86, .29, .35, 1.46, k); qy(.14, .86, .29, .05, .35, '#2a1f35'); lw([.22, .29, .22], [.78, .29, .22], '#f6e04a'); lw([.3, .29, .13], [.7, .29, .13], '#f4fbfc');
    ball(.5, .27, 1.62, .14, ['#f6e04a', '#c8a8e8', '#e87aa0', '#3f8a55'][k % 4], { squash: 1 });
  }, { variants: [{ frame: 1 }, { frame: 3 }, { frame: 2 }] }),

  F('cinema.arcade', ['cinema', 'bar', 'arcade', 'fun'], [1, 1, 2], p => {
    const c = p.c || '#3a2a6a', a = p.a || '#f6e04a';
    box(.1, .1, 0, .8, .8, .9, c); qy(.1, .9, .9, 0, .1, '#1e1a28'); qy(.2, .8, .9, .2, .7, a); lw([.2, .9, .45], [.8, .9, .45], c); 
    box(.1, .1, .9, .8, .5, 1.05, c); fq([[.1, .6, .9], [.9, .6, .9], [.9, .95, .98], [.1, .95, .98]], '#2a2733'); fq([[.9, .6, .9], [.9, .95, .98], [.9, .6, .98]], '#1e1a28'); spx(.35, .8, .98, 0, -2, '#d63a3a'); spx(.35, .8, .98, 0, -1, '#8a9098'); spx(.6, .82, .98, 0, 0, '#4ad8f0'); spx(.7, .82, .98, 0, 0, '#f6e04a');
    lit(() => { qy(.18, .82, .6, 1.05, 1.6, '#141a33'); for (let i = 0; i < 5; i++) qy(.24 + i * .11, .31 + i * .11, .6, 1.44, 1.5, i % 2 ? '#5af08a' : '#ff4a8a'); qy(.46, .54, .6, 1.1, 1.16, '#4ad8f0'); spx(.5, .6, 1.28, 0, 0, '#f6e04a'); signY(p.name || 'ZAP', .15, .85, .6, 1.62, 1.94, a, c, { frame: false }); });
  }, { use: { x: .5, y: 1.5 }, variants: [{}, { c: '#a8242a', a: '#4ad8f0', name: 'RUN' }, { c: '#1e3a34', a: '#ff8a40', name: 'POW' }] }),

  F('cinema.curtain', ['cinema', 'decor'], p => [p.w || 1, .1, 2.8], p => { const w = p.w || 1, c = p.c || RED; qy(0, w, .04, .05, 2.6, pleat(c)); qy(0, w, .06, 2.5, 2.8, pleat(dk(c, .12))); lw([0, .06, 2.5], [w, .06, 2.5], GOLD); for (let x = .1; x < w; x += .25) spx(x, .06, 2.47, 0, 0, GOLD); },
    { wall: true, mount: 0, solid: false, variants: [{ w: 1 }, { w: 2 }, { w: 1, c: '#2a3a6a' }] }),

  F('cinema.projector', ['cinema', 'decor'], [1, 1, 1.6], p => {
    table(.15, .15, .7, .7, 1.0, '#3a3f4c', { leg: '#8a9098', thick: true }); box(.25, .3, 1.0, .5, .4, .3, '#5a6272'); cyl(.4, .5, 1.3, .14, .04, '#2a2733'); cyl(.68, .5, 1.3, .1, .04, '#2a2733'); lit(() => { qy(.42, .58, .7, 1.08, 1.22, '#fff2c4'); }); glow(() => fq([[.5, .7, 1.15], [.2, 1.3, 1.5], [.8, 1.3, 1.5]], '#fff2c4', 'glass'));
  }, { vb: [-.3, -.3, 0, 1.3, 1.5, 1.8] }),
];
export default cinema;
export const galleryItems = [
  compose([cinema, generic], 'room.cinema.lobby', 9, 6, 3, { floor: PAT.ftile('#7a2a3a', '#6a2434', 1), wall: '#3a2a40', dado: 1, dadoc: '#2a1f30' }, [
    ['cinema.poster', .4, 0], ['cinema.poster', 1.6, 0, { frame: 1 }], ['cinema.poster', 2.8, 0, { frame: 2 }], ['cinema.poster', 4, 0, { frame: 3 }], ['cinema.curtain', 5.6, 0, { w: 2 }], ['cinema.arcade', 7.9, .1],
    ['cinema.concession', .4, 1.8], ['dude', 2.4, 1.4, '#a8242a'], ['cinema.ticket', 5.4, 2.2], ['dude', 6.4, 3.8, '#6a8ad8'], ['cinema.standee', .5, 4.4], ['cinema.popcorn', 2.4, 4.6], ['cinema.arcade', 7.8, 4.6, { c: '#a8242a', a: '#4ad8f0', name: 'RUN' }], ['generic.queuepost', 4.4, 4.6],
  ]),
  compose([cinema, generic], 'room.cinema.hall', 8, 8, 3.6, { floor: PAT.ftile('#3a2a40', '#34263a', 1), wall: '#2a2030' }, [
    ['cinema.screen', 1, 0], ['cinema.seats', 1, 3, { n: 6 }], ['cinema.seats', 4.5, 3, { n: 6 }], ['cinema.seats', 1, 4.5, { n: 6 }], ['cinema.seats', 4.5, 4.5, { n: 6 }], ['cinema.seats', 1, 6, { n: 6 }], ['cinema.seats', 4.5, 6, { n: 6 }], ['dude', 4.1, 5.6, '#e8843a'], ['cinema.projector', 3.6, 7 + 99],
  ].filter(i => i[2] < 50)),
];
