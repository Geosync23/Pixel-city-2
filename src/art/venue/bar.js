// Bar / club fixtures.
import { box, qy, qx, qz, lw, fq, glow, lit, ball, cyl, dk, lt, mix, PAT, textY, signY, spx, hash2, rng, textW } from '../../engine/raster.js';
import { F, K, bx, tube, post, posts, frameY, frameX, frameZ, table, rtable, chair, stool, sofa, counter, till, monitor, goods, shelf, heap, heap2, carton, plant, compose, steam, plate, cup, bottle, lamp, candle, rug, pleat, screenY, screenLines, mirrorY, dude, keyboard, PX } from './_lib.js';
import generic from './generic.js';
const NEON = ['#ff4a8a', '#4ad8f0', '#f6e04a', '#7af08a', '#b07af8', '#ff8a40'];
const amp = (x, y, z, w, h, c) => { box(x, y, z, w, .4, h, c || '#2a2733'); qy(x + .05, x + w - .05, y + .4, z + .05, z + h - .14, '#4a4038', '#3a3028'); frameY(x + .05, x + w - .05, y + .4, z + .05, z + h - .14, '#8a8478'); for (let i = 0; i < 4; i++) spx(x + .1 + i * .08, y + .4, z + h - .07, 0, 0, '#d5dbe0'); lit(() => spx(x + w - .1, y + .4, z + h - .07, 0, 0, '#ff5a4a')); };
const bar = [
  F('bar.counter', ['bar', 'barstation', 'counter', 'checkout'], p => [p.w || 3, .5, 1.2], p => {
    const w = p.w || 3, c = p.c || '#5a3020', a = p.a || '#ff4a8a';
    box(0, 0, 0, w, .5, 1.05, c, { l: PAT.planks(dk(c, .18), 6) }); qy(0, w, .5, 0, .1, '#2a1a18'); tube([0, .56, .22], [w, .56, .22], '#d8a848'); for (let x = .2; x < w; x += .8) lw([x, .5, .22], [x, .56, .22], '#d8a848');
    lit(() => lw([0, .5, .98], [w, .5, .98], a)); glow(() => lw([0, .5, .92], [w, .5, .92], dk(a, .3)));
    box(-.03, -.02, 1.05, w + .06, .58, .07, p.top || '#2a2028'); lw([-.03, .56, 1.12], [w + .03, .56, 1.12], '#8a6a5a');
    // taps
    box(.5, .1, 1.12, .5, .12, .1, '#d8a848'); for (let i = 0; i < 3; i++) { tube([.58 + i * .17, .16, 1.22], [.58 + i * .17, .16, 1.42], '#d5dbe0'); bx(.56 + i * .17, .14, 1.4, .05, .05, .12, ['#c0392b', '#f2c230', '#3f8a55'][i]); lw([.58 + i * .17, .16, 1.3], [.58 + i * .17, .26, 1.28], '#d5dbe0'); }
    cyl(.67, .32, 1.12, .05, .14, '#f2c860', { ol: false, t: '#f8f4ea' }); 
    till(w - .5, .08, 1.12); for (let i = 0; i < 3; i++) cyl(1.3 + i * .14, .2, 1.12, .04, .12, '#e4f6fa', { ol: false, t: '#c8e6f0' });
    if (w >= 3) { cyl(2.0, .3, 1.12, .06, .02, '#f1ede4', { ol: false }); cyl(2.0, .3, 1.14, .04, .1, '#e87aa0', { ol: false }); spx(2.0, .3, 1.28, 1, 0, '#9ccc4a'); bx(2.2, .12, 1.12, .2, .12, .06, '#2a2733'); spx(2.25, .2, 1.2, 0, 0, '#f6e04a'); spx(2.33, .2, 1.2, 0, 0, '#9ccc4a'); }
  }, { vb: p => [-.3, -.3, 0, (p.w || 3) + .3, .9, 1.8], use: { x: 1.5, y: 1 }, staff: { x: 1, y: -.5, dir: 1 }, variants: [{}, { w: 4, c: '#2e3440', a: '#4ad8f0', top: '#d2a26a' }, { w: 2, a: '#f6e04a' }] }),

  F('bar.backbar', ['bar', 'shelf', 'bottles', 'decor'], p => [p.w || 3, .5, 2.4], p => {
    const w = p.w || 3, c = p.c || '#3a2028', a = p.a || '#4ad8f0';
    box(0, 0, 0, w, .5, .95, c); for (let i = 0; i < w * 2; i++) frameY(i * .5 + .05, i * .5 + .45, .5, .12, .85, dk(c, .4)); box(-.02, -.02, .95, w + .04, .54, .05, '#2a2028');
    box(0, 0, 1.0, w, .3, 1.35, c); lit(() => { qy(.08, w - .08, .3, 1.08, 2.0, goods('liquor', 3, { seed: p.seed || 3, back: dk(a, .55), board: a })); }); mirrorY(w / 2 - .5, w / 2 + .5, .3, 1.4, 2.0, a);
    lit(() => { for (let i = 0; i < 7; i++) qy(w / 2 - .42 + i * .12, w / 2 - .36 + i * .12, .3, 1.4, 1.52 + (i % 3) * .06, ['#c8842a', '#5a8a4a', '#e8d8a0', '#8a3a2a', '#6fb6d8'][i % 5]); });
    lit(() => signY(p.name || 'COCKTAILS', .1, w - .1, .3, 2.02, 2.34, c, a, { frame: false }));
    for (let i = 0; i < 6; i++) bottle(.2 + i * (w - .4) / 5, .4, 1.0, ['#5a8a4a', '#c8842a', '#e4f6fa', '#8a3a2a', '#3a5a3a', '#d8d8e0'][i], .18);
  }, { variants: [{}, { w: 4, a: '#ff4a8a', name: 'THE NIGHT OWL', seed: 6 }, { w: 2, a: '#f6e04a', name: 'BAR', seed: 9 }] }),

  F('bar.stool', ['bar', 'seating', 'stool'], [.5, .5, .8], p => stool(.25, .25, .75, p.c || '#8a2a3a', { ring: true, leg: '#d8a848' }),
    { seats: [{ x: .25, y: .25, z: .75, dir: 3 }], variants: [{}, { c: '#2e3440' }, { c: '#3f6a5a' }] }),

  F('bar.hightable', ['bar', 'table', 'seating'], [1.5, .5, 1.2], p => {
    stool(.22, .25, .75, p.c || '#8a2a3a', { ring: true }); rtable(.75, .25, .3, 1.1, '#3a2a28', { leg: '#8a9098' });
    cyl(.68, .3, 1.1, .04, .12, '#f2c860', { ol: false, t: '#f8f4ea' }); cyl(.86, .22, 1.1, .04, .1, '#e87aa0', { ol: false }); candle(.75, .15, 1.1);
    stool(1.28, .25, .75, p.c || '#8a2a3a', { ring: true });
  }, { seats: [{ x: .22, y: .25, z: .75, dir: 0 }, { x: 1.28, y: .25, z: .75, dir: 2 }], variants: [{}, { c: '#2e3440' }] }),

  F('bar.stage', ['bar', 'stage', 'music'], p => [p.w || 4, 2, p.kit === false ? .3 : 2], p => {
    const w = p.w || 4, c = '#3a2a30';
    box(0, 0, 0, w, 2, .3, c, { t: PAT.fboards('#5a4038', .4), l: PAT.planks(dk(c, .18), 8) }); lit(() => { for (let x = .2; x < w; x += .4) spx(x, 2, .26, 0, 0, NEON[Math.round(x * 2.5) % 6]); });
    if (p.kit === false) return;
    // drums (back centre)
    const dx = w / 2, dy = .6; cyl(dx, dy + .1, .3, .3, .5, '#c0392b', { t: '#f1ede4' }); cyl(dx, dy + .1, .3, .32, .04, '#d5dbe0', { ol: false }); 
    cyl(dx - .45, dy + .2, .62, .17, .22, '#c0392b', { t: '#f1ede4' }); post(dx - .45, dy + .2, .3, .62, '#8a9098'); cyl(dx + .5, dy + .25, .52, .2, .3, '#c0392b', { t: '#f1ede4' }); post(dx + .5, dy + .25, .3, .52, '#8a9098');
    post(dx - .75, dy, .3, 1.25, '#8a9098'); cyl(dx - .75, dy, 1.25, .2, .02, '#e8c860'); post(dx + .8, dy - .1, .3, 1.35, '#8a9098'); cyl(dx + .8, dy - .1, 1.35, .24, .02, '#e8c860'); stool(dx, dy - .35, .5, '#2a2733', { r: .14 });
    // amps
    amp(.2, .3, .3, .8, .9); amp(.3, .3, 1.2, .6, .4, '#3a3f4c'); amp(w - 1, .3, .3, .8, .7, '#3a2a28');
    // guitar on stand
    tube([w - .5, 1.0, .3], [w - .5, .95, 1.4], '#8a5a3a'); ball(w - .5, 1.0, .58, .15, p.gc || '#e8843a', { squash: 1.2 }); spx(w - .5, 1.0, .58, 0, 0, '#2a2733');
    // mic + monitor wedges
    cyl(dx - .3, 1.6, .3, .12, .03, '#2a2733', { ol: false }); tube([dx - .3, 1.6, .33], [dx - .3, 1.6, 1.55], '#8a9098'); bx(dx - .34, 1.6, 1.52, .08, .14, .08, '#2a2733'); spx(dx - .3, 1.74, 1.58, 0, 0, '#d5dbe0');
    for (const x of [.9, w - 1.4]) { box(x, 1.55, .3, .5, .3, .22, '#2a2733'); qy(x + .05, x + .45, 1.85, .34, .48, '#4a4038', '#3a3028'); }
  }, { vb: p => [-.3, -.3, 0, (p.w || 4) + .3, 2.3, 2.2], pose: { x: 1.7, y: 1.7, z: .3, dir: 1, anim: 'sing' }, variants: [{}, { w: 5, gc: '#4ad8f0' }, { w: 3, kit: false }] }),

  F('bar.dj', ['bar', 'dj', 'music'], [2, 1, 1.5], p => {
    const c = '#1e1a28', a = p.a || '#b07af8';
    box(0, .3, 0, 2, .7, 1.05, c); lit(() => { for (let i = 0; i < 12; i++) { const h = .15 + hash2(i, p.seed || 1) * .6; qy(.1 + i * .15, .2 + i * .15, 1, .15, .15 + h, NEON[(i + (p.seed || 0)) % 6]); qy(.1 + i * .15, .2 + i * .15, 1, .15 + h * .6, .15 + h, lt(NEON[(i + (p.seed || 0)) % 6], .4)); } }); frameY(.05, 1.95, 1, .1, .95, a);
    box(-.03, .28, 1.05, 2.06, .76, .06, '#2a2733'); cyl(.4, .65, 1.11, .25, .03, '#2a2733', { t: '#3a3f4c' }); cyl(.4, .65, 1.14, .08, .01, a, { ol: false }); cyl(1.6, .65, 1.11, .25, .03, '#2a2733', { t: '#3a3f4c' }); cyl(1.6, .65, 1.14, .08, .01, '#f6e04a', { ol: false });
    box(.8, .45, 1.11, .4, .45, .05, '#3a3f4c'); lit(() => { for (let i = 0; i < 4; i++) { spx(.86 + i * .09, .9, 1.17, 0, 0, NEON[i]); } lw([.85, .5, 1.165], [1.15, .5, 1.165], '#5af08a'); });
    bx(.75, .32, 1.11, .5, .04, .32, '#2a2733'); lit(() => qy(.78, 1.22, .36, 1.14, 1.4, '#2a1f45', a)); box(0, 0, 0, .4, .4, 1.3, '#2a2733'); qy(.05, .35, .4, .1, 1.2, '#4a4038', '#3a3028'); box(1.6, 0, 0, .4, .4, 1.3, '#2a2733'); qy(1.65, 1.95, .4, .1, 1.2, '#4a4038', '#3a3028');
  }, { use: { x: 1, y: 1.5 }, staff: { x: 1, y: -.0 + .1, dir: 1 }, variants: [{ seed: 1 }, { seed: 4, a: '#4ad8f0' }] }),

  F('bar.dancetile', ['bar', 'dancefloor', 'decor'], p => [p.n || 2, p.n || 2, .05], p => {
    const n = p.n || 2, f = p.frame || 0, pl = p.pal || NEON;
    box(0, 0, 0, n, n, .04, '#1e1a28', { ol: false }); lit(() => { for (let i = 0; i < n * 2; i++) for (let j = 0; j < n * 2; j++) { const k = pl[Math.floor(hash2(i, j, f * 7 + (p.seed || 1)) * pl.length)], on = hash2(i, j, f * 13 + 2) > .25; qz(i * .5 + .03, i * .5 + .47, j * .5 + .03, j * .5 + .47, .041, on ? k : dk(k, .6), on ? lt(k, .25) : dk(k, .6)); } });
  }, { solid: false, flat: true, frames: 4, variants: [{ frame: 0 }, { frame: 1 }, { frame: 2, pal: ['#ff4a8a', '#b07af8', '#4ad8f0'] }, { n: 3, frame: 3, pal: ['#f6e04a', '#ff8a40', '#ff4a8a'] }] }),

  F('bar.booth', ['bar', 'seating', 'booth'], [2.5, 1.5, 1.2], p => {
    const c = p.c || '#6a2a4a';
    box(0, 0, 0, 2.5, .25, 1.15, c, { l: PAT.vstripes(dk(c, .18), dk(c, .26), 5) }); box(0, .25, 0, .25, 1.25, 1.15, c); box(.25, .25, 0, 2.25, .5, .42, dk(c, .1), { t: lt(c, .1) }); box(.25, .75, 0, .5, .75, .42, dk(c, .1), { t: lt(c, .1) });
    rtable(1.5, 1.1, .32, .7, '#2a2028', { leg: '#d8a848' }); candle(1.5, 1.1, .7); cyl(1.35, 1.2, .7, .04, .1, '#e87aa0', { ol: false }); cyl(1.65, 1.0, .7, .04, .12, '#f2c860', { ol: false });
    lit(() => lw([0, .25, 1.16], [2.5, .25, 1.16], p.a || '#ff4a8a'));
  }, { seats: [{ x: .9, y: .5, z: .42, dir: 1 }, { x: 1.6, y: .5, z: .42, dir: 1 }, { x: 2.2, y: .5, z: .42, dir: 1 }, { x: .5, y: 1.15, z: .42, dir: 0 }], variants: [{}, { c: '#2a3a5a', a: '#4ad8f0' }] }),

  F('bar.neon', ['bar', 'neon', 'decor', 'sign'], p => [p.kind === 'text' ? Math.max(1, Math.ceil((textW(p.text || 'BAR') + 4) / 8) / 2) : 1, .1, 2.4], p => {
    const a = p.c || '#ff4a8a', b = p.c2 || '#4ad8f0', k = p.kind || 'glass';
    if (k === 'text') { const t = p.text || 'BAR', w = Math.max(1, Math.ceil((textW(t) + 4) / 8) / 2); qy(0, w, .03, 1.6, 2.2, '#1e1a28'); lit(() => { frameY(.03, w - .03, .04, 1.63, 2.17, b); textY(t, (w * 16 - textW(t)) / 32, .04, 2.07, a); }); glow(() => qy(0, w, .03, 1.56, 1.6, dk(a, .4))); return; }
    qy(.1, .9, .03, 1.5, 2.3, '#1e1a28');
    lit(() => {
      if (k === 'glass') { lw([.25, .04, 2.2], [.75, .04, 2.2], a); lw([.25, .04, 2.2], [.5, .04, 1.9], a); lw([.75, .04, 2.2], [.5, .04, 1.9], a); lw([.5, .04, 1.9], [.5, .04, 1.62], a); lw([.36, .04, 1.6], [.64, .04, 1.6], a); lw([.6, .04, 2.26], [.7, .04, 2.1], b); ball(.62, .05, 2.08, .04, '#7af08a', { ol: false }); }
      else if (k === 'note') { lw([.4, .04, 1.7], [.4, .04, 2.2], a); lw([.7, .04, 1.8], [.7, .04, 2.25], a); tube([.4, .04, 2.2], [.7, .04, 2.25], a); ball(.33, .05, 1.7, .08, b, { ol: false }); ball(.63, .05, 1.8, .08, b, { ol: false }); }
      else if (k === 'heart') { const pts = [[.5, 1.62], [.22, 1.95], [.22, 2.1], [.34, 2.2], [.5, 2.08], [.66, 2.2], [.78, 2.1], [.78, 1.95]]; pts.forEach((q, i) => { const r = pts[(i + 1) % pts.length]; tube([q[0], .04, q[1]], [r[0], .04, r[1]], a); }); }
      else { lw([.2, .04, 1.65], [.8, .04, 1.65], b); lw([.3, .04, 1.65], [.24, .04, 2.1], a); lw([.7, .04, 1.65], [.76, .04, 2.1], a); lw([.24, .04, 2.1], [.76, .04, 2.1], a); lw([.26, .04, 1.95], [.74, .04, 1.95], '#f6e04a'); lw([.76, .04, 2.0], [.9, .04, 2.0], a); lw([.9, .04, 2.0], [.9, .04, 1.8], a); lw([.9, .04, 1.8], [.74, .04, 1.8], a); }
    });
  }, { wall: true, mount: 1.5, solid: false, light: { x: .5, y: .6, z: 0, r: 2 }, variants: [{ kind: 'glass' }, { kind: 'note', c: '#4ad8f0', c2: '#f6e04a' }, { kind: 'heart' }, { kind: 'beer', c: '#f6e04a', c2: '#ff8a40' }, { kind: 'text', text: 'OPEN', c: '#7af08a', c2: '#ff4a8a' }, { kind: 'text', text: 'LIVE MUSIC', c: '#f6e04a', c2: '#b07af8' }] }),

  F('bar.pool', ['bar', 'pool', 'fun'], [2.5, 1.5, 1], p => {
    const c = p.c || '#5a3020', f = p.felt || '#2f8a55';
    for (const [x, y] of [[.15, .15], [2.15, .15], [.15, 1.15], [2.15, 1.15]]) bx(x, y, 0, .2, .2, .6, dk(c, .2));
    box(0, 0, .55, 2.5, 1.5, .3, c); qz(.12, 2.38, .12, 1.38, .851, f, lt(f, .06)); frameZ(.12, 2.38, .12, 1.38, .851, dk(f, .4));
    for (const [x, y] of [[.14, .14], [1.25, .12], [2.36, .14], [.14, 1.36], [1.25, 1.38], [2.36, 1.36]]) { spx(x, y, .85, 0, 0, '#1e1a20'); spx(x, y, .85, 1, 0, '#1e1a20'); spx(x, y, .85, 0, -1, '#1e1a20'); spx(x, y, .85, 1, -1, '#1e1a20'); }
    [['#f1ede4', .6, .75], ['#c0392b', 1.6, .7], ['#f2c230', 1.72, .62], ['#3c64ad', 1.72, .8], ['#2a2733', 1.84, .72], ['#e8843a', 1.9, .5], ['#7a55b0', 1.5, 1.0]].forEach(([k, x, y]) => { spx(x, y, .86, 0, -1, k); spx(x, y, .86, 1, -1, k); spx(x, y, .86, 0, 0, dk(k, .25)); spx(x, y, .86, 1, 0, dk(k, .25)); });
    tube([.4, 1.2, .87], [1.5, 1.3, .87], '#d2a26a');
  }, { use: { x: 1.25, y: 2 }, variants: [{}, { felt: '#3c64ad', c: '#2e3440' }, { felt: '#a8322a' }] }),

  F('bar.dartboard', ['bar', 'darts', 'fun', 'decor'], [1, .1, 2.2], p => {
    box(.1, 0, 1.2, .8, .05, 1.0, '#5a3a28'); const R = [[.36, '#2a2733'], [.3, '#f1ede4'], [.24, '#2a2733'], [.17, '#c0392b'], [.11, '#3f8a55'], [.05, '#c0392b']];
    R.forEach(([r, c]) => { for (let a = 0; a < 40; a++) { const t = a / 40 * 6.283, t2 = (a + 1) / 40 * 6.283; fq([[.5, .05, 1.7], [.5 + Math.cos(t) * r, .05, 1.7 + Math.sin(t) * r], [.5 + Math.cos(t2) * r, .05, 1.7 + Math.sin(t2) * r]], (a >> 1) % 2 && r > .1 && r < .35 ? dk(c, .0) === '#f1ede4' ? '#e8dcc0' : c : c); } });
    lw([.55, .06, 1.78], [.7, .2, 1.84], '#f2c230'); lw([.4, .06, 1.6], [.3, .2, 1.56], '#4ad8f0'); qy(.75, .88, .05, 1.25, 1.6, '#2a2733'); lw([.78, .05, 1.52], [.85, .05, 1.52], '#f1ede4'); lw([.78, .05, 1.44], [.85, .05, 1.44], '#f1ede4');
  }, { wall: true, mount: 1.2, solid: false, use: { x: .5, y: 1.5 }, variants: [{}] }),

  F('bar.speaker', ['bar', 'cinema', 'music', 'decor'], [.5, .5, 1.6], p => { box(.03, .03, 0, .44, .44, 1.55, '#2a2733'); qy(.07, .43, .47, .08, 1.48, '#3a3438', '#2e282c'); for (const [z, r] of [[.42, .15], [.95, .13], [1.3, .07]]) { cyl(.25, .49, z, r, .0, '#5a5560', { ol: false, t: '#4a4550' }); } lit(() => spx(.38, .47, 1.5, 0, 0, '#5af08a')); },
    { variants: [{}] }),

  F('bar.discoball', ['bar', 'decor', 'overhead'], [.5, .5, 2.8], p => {
    post(.25, .25, 2.5, 2.8, '#8a9098'); ball(.25, .25, 2.28, .22, '#aab8c8', { t: '#f4fbfc', d: '#6a7890' }); lit(() => { for (let i = 0; i < 9; i++) spx(.25, .25, 2.28, Math.round((hash2(i, 1) - .5) * 9), Math.round((hash2(i, 2) - .5) * 8), ['#f4fbfc', '#ff4a8a', '#4ad8f0', '#f6e04a'][i % 4]); });
    glow(() => { for (let i = 0; i < 6; i++) { const a = i * 1.05; lw([.25, .25, 2.28], [.25 + Math.cos(a) * .6, .25 + Math.sin(a) * .6, 2.28 - .5], NEON[i]); } });
  }, { solid: false, overhead: true, vb: [-.5, -.5, 1.6, 1, 1, 2.9], light: { x: .25, y: .25, z: 0, r: 3 } }),
];
export default bar;
export const galleryItems = [
  compose([bar, generic], 'room.bar', 10, 7, 3, { floor: PAT.fboards('#4a3438'), wall: '#3a2a48', dado: 1, dadoc: '#2a1f38' }, [
    ['bar.backbar', .3, .05], ['bar.neon', 3.6, 0], ['bar.neon', 4.7, 0, { kind: 'text', text: 'LIVE MUSIC', c: '#f6e04a', c2: '#b07af8' }], ['bar.dartboard', 8.8, 0], ['bar.stage', 5.4 - .6, .3 + 99],
    ['bar.counter', .3, 1.6], ['dude', 1.5, 1.2, '#2a2733', 0, { apron: '#8a2a3a' }], ['bar.stool', .6, 2.3], ['bar.stool', 1.5, 2.3], ['bar.stool', 2.4, 2.3],
    ['bar.stage', 5.6, .6], ['bar.dancetile', 5.2, 3.2], ['bar.dancetile', 7.2, 3.2, { frame: 1 }], ['dude', 6.4, 4.2, '#ff8a40'], ['dude', 7.8, 3.8, '#4ad8f0'], ['bar.discoball', 6.9, 3.8],
    ['bar.booth', .3, 4.2], ['bar.hightable', 3.4, 3.6], ['bar.pool', 3.2, 5.2], ['bar.dj', 7.6, 5.6], ['bar.speaker', 9.3, 2.4],
  ].filter(i => i[2] < 50)),
];
