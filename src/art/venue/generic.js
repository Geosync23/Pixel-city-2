// Generic interior fixtures shared by all venues.
import { box, qy, qx, qz, lw, fq, glow, lit, ball, cyl, dk, lt, mix, PAT, textY, signY, spx, hash2, rng, winY } from '../../engine/raster.js';
import { F, K, bx, tube, post, posts, frameY, frameX, frameZ, plant, sofa, rug, lamp, table, goods, PX } from './_lib.js';
const generic = [
  F('generic.door', ['generic', 'door'], [1, .1, 1.8], p => {
    const c = p.c || '#5a4a3a';
    qy(0, 1, .04, 0, 1.75, dk(c, .1)); 
    if (p.kind === 'staff') { qy(.07, .93, .05, 0, 1.68, p.dc || '#8a9aa8'); frameY(.07, .93, .05, 0, 1.68, dk(p.dc || '#8a9aa8', .45)); qy(.3, .7, .05, 1.05, 1.45, '#3a4a5a', '#4a5a6a'); frameY(.3, .7, .05, 1.05, 1.45, '#3a3f4c'); qy(.3, .7, .05, .72, .86, '#f4f0e8'); lw([.35, .05, .79], [.65, .05, .79], '#3a3f4c'); spx(.84, .05, .85, 0, 0, '#f2c230'); spx(.84, .05, .85, 0, 1, '#f2c230'); qy(.07, .93, .05, 0, .14, '#6a7078'); }
    else { qy(.07, .93, .05, 0, 1.68, '#9fd4e6', '#b8e2ee'); glow(() => qy(.07, .93, .05, 0, 1.68, '#2a3a6a', '#34447a')); frameY(.07, .93, .05, 0, 1.68, dk(c, .3)); frameY(.13, .87, .05, .08, 1.62, lt(c, .1)); lw([.2, .05, 1.5], [.32, .05, 1.26], '#f4fbfc'); lw([.25, .05, 1.5], [.37, .05, 1.26], '#f4fbfc'); tube([.8, .06, .7], [.8, .06, 1.0], '#d8a848'); qy(.3, .7, .06, 1.08, 1.26, p.sc || '#d63a3a'); lw([.36, .06, 1.17], [.64, .06, 1.17], '#f4f0e8'); lw([.5, .06, 1.26], [.5, .06, 1.4], '#8a8478'); }
    lw([0, .04, 1.75], [1, .04, 1.75], dk(c, .5));
  }, { wall: true, mount: 0, solid: false, use: { x: .5, y: .5 }, variants: [{}, { kind: 'staff' }, { kind: 'staff', dc: '#a85a4a' }, { c: '#2f6f5f', sc: '#3f8a55' }] }),
];
export default generic;
generic.push(
  F('generic.lockers', ['generic', 'gym', 'courier', 'warehouse', 'office', 'lockers'], p => [p.w || 2, .5, 1.9], p => {
    const w = p.w || 2, c = p.c || '#4a7a9a', n = Math.round(w / .5), rows = p.rows || 2;
    box(0, 0, 0, w, .5, 1.9, c); qy(0, w, .5, 0, .1, dk(c, .5));
    for (let i = 0; i < n; i++) for (let r = 0; r < rows; r++) { const x = i * .5, z0 = .1 + r * 1.78 / rows, z1 = .1 + (r + 1) * 1.78 / rows; const k = p.multi ? ['#4a7a9a', '#c0563a', '#e8b840', '#4a9a6a'][(i + r) % 4] : c;
      qy(x + .04, x + .46, .5, z0 + .03, z1 - .03, dk(k, .1)); frameY(x + .04, x + .46, .5, z0 + .03, z1 - .03, dk(k, .42)); for (let v = 0; v < 3; v++) lw([x + .14, .5, z1 - .14 - v * .05], [x + .36, .5, z1 - .14 - v * .05], dk(k, .45));
      spx(x + .4, .5, (z0 + z1) / 2, 0, 0, '#e4e8ec'); spx(x + .4, .5, (z0 + z1) / 2, 0, 1, '#8a9098'); qy(x + .18, x + .32, .5, z1 - .38, z1 - .3, '#f1ede4'); }
    if (p.open) { qy(.04, .46, .5, .13, .96, '#2a2733'); bx(.1, .3, .16, .3, .16, .25, '#c0563a'); lw([.2, .5, .9], [.2, .5, .6], '#e8b840'); }
  }, { use: { x: .5, y: 1 }, variants: [{}, { c: '#c0563a', rows: 3 }, { multi: true, w: 1.5 }, { c: '#8a9098', open: true, w: 1 }] }),

  F('generic.cooler', ['generic', 'gym', 'office', 'clinic', 'watercooler'], [.5, .5, 1.5], p => {
    box(.05, .05, 0, .4, .4, 1.0, '#e4e8ec'); qy(.05, .45, .45, 0, .08, '#8a9098'); qy(.12, .38, .45, .55, .8, '#b8c0c8'); spx(.2, .45, .72, 0, 0, '#3c64ad'); spx(.3, .45, .72, 0, 0, '#c0392b'); qy(.14, .36, .45, .5, .54, '#6a7078');
    cyl(.25, .25, 1.0, .17, .38, '#8fd0ee', { t: '#b8e6f6', l: '#a4dcf2' }); cyl(.25, .25, 1.38, .09, .06, '#6fb6d8', { ol: false }); spx(.25, .25, 1.2, -2, 0, '#f4fbfc'); spx(.25, .25, 1.26, -2, 0, '#f4fbfc');
    bx(.46, .14, .6, .06, .1, .2, '#f1ede4');
  }, { use: { x: .25, y: 1 } }),
);
generic.push(
  F('generic.queuepost', ['generic', 'cinema', 'bank', 'queue'], p => [(p.n || 2) * 1.5 - 1, .5, 1], p => {
    const n = p.n || 2, belt = p.kind === 'belt', pc = belt ? '#3a3f4c' : '#d8a848', rc = p.c || (belt ? '#3c64ad' : '#a8242a');
    for (let i = 0; i < n; i++) { const x = .25 + i * 1.5; if (i) { const a = x - 1.5; if (belt) tube([a, .25, .9], [x, .25, .9], rc); else { lw([a, .25, .92], [a + .4, .25, .76], rc); tube([a + .4, .25, .75], [x - .4, .25, .75], rc); lw([x - .4, .25, .76], [x, .25, .92], rc); lw([a + .1, .25, .86], [a + .4, .25, .74], dk(rc, .3)); } } }
    for (let i = 0; i < n; i++) { const x = .25 + i * 1.5; cyl(x, .25, 0, .15, .04, pc); tube([x, .25, .04], [x, .25, .95], pc); if (belt) bx(x - .04, .21, .82, .08, .08, .14, pc); else ball(x, .25, .98, .06, pc, { ol: false }); }
  }, { variants: [{ n: 2 }, { n: 3 }, { n: 2, kind: 'belt' }, { n: 3, kind: 'belt', c: '#c0392b' }, { n: 1 }] }),
);

const sky = (x0, x1, y, z0, z1, seed) => { qy(x0, x1, y, z0, z1, '#9fd4ee'); qy(x0, x1, y, z0, z0 + (z1 - z0) * .35, '#b8e2f2'); const w = x1 - x0; for (let i = 0; i < Math.max(2, w * 3); i++) { const h = (.15 + hash2(i, seed, 3) * .4) * (z1 - z0), a = x0 + w * i / Math.max(2, w * 3); qy(a, Math.min(x1, a + w / Math.max(2, w * 3) + .01), y, z0, z0 + h, i % 2 ? '#8aa8c0' : '#7a98b4'); }
  qy(x0 + w * .55, Math.min(x1, x0 + w * .55 + .3), y, z0 + (z1 - z0) * .75, z0 + (z1 - z0) * .85, '#f4fbfc');
  glow(() => { qy(x0, x1, y, z0, z1, '#1e2a50'); for (let i = 0; i < w * 6; i++) spx(x0 + w * hash2(i, seed, 1), y, z0 + (z1 - z0) * (.05 + hash2(i, seed, 2) * .4), 0, 0, '#ffd98a'); }); };
generic.push(
  F('generic.doorway', ['generic', 'door', 'doorway'], p => [p.w || 1, .1, 1.9], p => { const w = p.w || 1, c = p.c || '#8a6a4a'; qy(0, w, .04, 0, 1.85, c); qy(.08, w - .08, .05, 0, 1.77, p.dark || '#3a3040'); qy(.08, w - .08, .05, 0, .3, lt(p.dark || '#3a3040', .12)); if (p.curtain) { for (let x = .1; x < w - .1; x += .1) qy(x, x + .07, .06, .5, 1.75, p.curtain); } frameY(.08, w - .08, .05, 0, 1.77, dk(c, .4)); },
    { wall: true, mount: 0, solid: false, use: { x: .5, y: .5 }, variants: [{}, { w: 2, c: '#aab2ba' }, { curtain: '#c0563a' }] }),
  F('generic.window', ['generic', 'window', 'decor'], p => [p.w || 2, .1, 2.2], p => {
    const w = p.w || 2, c = p.c || '#f1ede4', z0 = p.z0 || .9, z1 = p.z1 || 2.1; qy(0, w, .03, z0 - .06, z1 + .06, c); sky(.07, w - .07, .04, z0, z1, p.seed || 1);
    const n = Math.max(1, Math.round(w)); for (let i = 1; i < n; i++) lw([w * i / n, .04, z0], [w * i / n, .04, z1], c); if (p.cross !== false) lw([.07, .04, (z0 + z1) / 2 + .2], [w - .07, .04, (z0 + z1) / 2 + .2], c);
    if (p.blinds) { for (let z = z1 - .06; z > z1 - (z1 - z0) * p.blinds; z -= .12) lw([.07, .05, z], [w - .07, .05, z], '#e8e2d4'); } if (p.curtain) { qy(.03, .28, .06, z0 - .1, z1 + .1, (u, v) => u % 3 ? p.curtain : dk(p.curtain, .15)); qy(w - .28, w - .03, .06, z0 - .1, z1 + .1, (u, v) => u % 3 ? p.curtain : dk(p.curtain, .15)); }
    frameY(.07, w - .07, .04, z0, z1, dk(c, .3)); box(-.03, .03, z0 - .12, w + .06, .1, .06, c, { ol: false }); if (p.plant) plant(w * .75, .08, z0 - .06, .45, { flower: '#e87aa0' });
  }, { wall: true, mount: .8, solid: false, variants: [{}, { w: 3, blinds: .4 }, { w: 1, cross: false, plant: true }, { w: 2, curtain: '#c0563a', seed: 4 }, { w: 3, z0: .3, z1: 2.3, c: '#3a3f4c', seed: 7 }] }),
  F('generic.exit', ['generic', 'exit', 'sign'], [1, .1, 2.6], p => { box(.1, 0, 2.1, .8, .08, .44, '#e4e8ec'); lit(() => signY(p.t || 'EXIT', .1, .9, .08, 2.12, 2.52, p.c || '#2f9a5a', '#f4fbfc', { frame: false })); glow(() => qy(.1, .9, .08, 2.06, 2.1, '#5af08a')); },
    { wall: true, mount: 2.1, solid: false, variants: [{}, { c: '#d63a3a' }, { t: 'WC', c: '#3c64ad' }] }),
  F('generic.clock', ['generic', 'clock', 'decor'], [.5, .1, 2.3], p => { const c = p.c || '#3a3f4c', pts = [], pt2 = []; for (let a = 0; a < 16; a++) { pts.push([.25 + Math.cos(a / 16 * 6.283) * .24, .04, 2.0 + Math.sin(a / 16 * 6.283) * .24]); pt2.push([.25 + Math.cos(a / 16 * 6.283) * .19, .05, 2.0 + Math.sin(a / 16 * 6.283) * .19]); } fq(pts, c); fq(pt2, '#f8f4ea'); const h = (p.h === undefined ? 10 : p.h) / 12 * 6.283, m = (p.m || 10) / 60 * 6.283; lw([.25, .05, 2.0], [.25 + Math.sin(h) * .09, .05, 2.0 + Math.cos(h) * .09], '#2a2733'); lw([.25, .05, 2.0], [.25 + Math.sin(m) * .15, .05, 2.0 + Math.cos(m) * .15], '#d63a3a'); },
    { wall: true, mount: 1.75, solid: false, variants: [{}, { c: '#d8a848', h: 3, m: 40 }, { c: '#c0563a', h: 7, m: 25 }] }),
  F('generic.picture', ['generic', 'picture', 'decor'], p => [p.w || 1, .1, 2.1], p => { const w = p.w || 1, c = p.c || '#8a5a3a', k = p.kind || 0; box(.05, 0, 1.3, w - .1, .04, .7, c); const a = .1, b = w - .1;
    if (k === 0) { qy(a, b, .04, 1.35, 1.95, '#9fd4ee'); qy(a, b, .04, 1.35, 1.55, '#6fb858'); fq([[a, .04, 1.55], [(a + b) / 2, .04, 1.85], [b, .04, 1.55]], '#7a98b4'); } else if (k === 1) { qy(a, b, .04, 1.35, 1.95, '#f8f4ea'); qy(a + .08, a + .3, .04, 1.45, 1.85, '#d63a3a'); qy(a + .34, b - .08, .04, 1.6, 1.85, '#3c64ad'); qy(a + .34, b - .08, .04, 1.45, 1.56, '#f2c230'); } else if (k === 2) { qy(a, b, .04, 1.35, 1.95, '#f6e8c8'); ball((a + b) / 2, .05, 1.62, .16, '#e8843a', { ol: false }); lw([(a + b) / 2, .04, 1.78], [(a + b) / 2 + .05, .04, 1.88], '#3f8a55'); } else { qy(a, b, .04, 1.35, 1.95, '#2a3a5a'); qy(a, b, .04, 1.35, 1.5, '#3a6a8a'); ball(b - .2, .05, 1.8, .07, '#f6e8c8', { ol: false }); fq([[a + .2, .04, 1.5], [a + .3, .04, 1.72], [a + .4, .04, 1.5]], '#f1ede4'); }
    frameY(a, b, .04, 1.35, 1.95, dk(c, .4)); }, { wall: true, mount: 1.3, solid: false, variants: [{ kind: 0 }, { kind: 1, c: '#2a2733' }, { kind: 2, c: '#d8a848' }, { kind: 3, w: 1.5 }] }),
  F('generic.extinguisher', ['generic', 'safety', 'decor'], [.5, .2, 1.5], p => { qy(.1, .4, .03, .7, 1.4, '#f1ede4'); cyl(.25, .12, .75, .08, .4, '#d63a3a'); bx(.21, .08, 1.15, .08, .08, .08, '#3a3f4c'); lw([.29, .12, 1.2], [.36, .12, 1.0], '#2a2733'); qy(.19, .31, .2, .88, .98, '#f1ede4'); qy(.14, .36, .03, 1.28, 1.38, '#d63a3a'); },
    { wall: true, mount: .7, solid: false }),
  F('generic.plant', ['generic', 'plant', 'decor'], [.5, .5, 1.4], p => plant(.25, .25, 0, p.s || 1.3, p), { variants: [{}, { kind: 'palm', s: 1.5, pot: '#f1ede4' }, { kind: 'snake', s: 1.4, pot: '#3a3f4c' }, { flower: '#e87aa0', s: 1.1, pot: '#6fa8b8' }, { s: 1.6, leaf: '#3f7a48', pot: '#d8a848' }] }),
  F('generic.rug', ['generic', 'rug', 'decor'], p => [p.w || 2, p.d || 1.5, .02], p => rug(0, 0, p.w || 2, p.d || 1.5, p.c || '#a8323a', p.c2 || '#e8c878', { inner: p.inner, inner2: p.inner2 }),
    { solid: false, flat: true, variants: [{}, { w: 3, d: 2, c: '#3c5a8a', c2: '#e8e2d4', inner: '#4a6a9a' }, { w: 4, d: 1, c: '#a8323a', c2: '#d8a848' }, { w: 2, d: 2, c: '#3f6a5a', c2: '#f1ede4', inner: '#4f7a6a', inner2: '#3f6a5a' }, { w: 1, d: .5, c: '#5a4a3a', c2: '#3a3028' }] }),
  F('generic.wetfloor', ['generic', 'safety', 'decor'], [.5, .5, .7], p => { fq([[.1, .1, 0], [.4, .1, 0], [.25, .22, .65]], '#d8a820'); fq([[.1, .4, 0], [.4, .4, 0], [.25, .28, .65]], '#f2c230'); fq([[.4, .4, 0], [.4, .1, 0], [.25, .22, .65], [.25, .28, .65]], '#c89818'); spx(.25, .36, .3, 0, 0, '#2a2733'); spx(.25, .36, .3, 0, 1, '#2a2733'); spx(.25, .36, .3, 0, 3, '#2a2733'); lw([.16, .4, .08], [.34, .4, .08], '#2a2733'); }, {}),
  F('generic.bin', ['generic', 'bin', 'decor'], [.5, .5, .7], p => { const c = p.c || '#5a6272'; if (p.recycle) { for (let i = 0; i < 2; i++) { box(.02 + i * .24, .1, 0, .22, .3, .6, i ? '#3f8a55' : '#3c64ad', { t: '#2a2733' }); qy(.07 + i * .24, .19 + i * .24, .4, .3, .42, '#f4f0e8'); } return; } cyl(.25, .25, 0, .17, .55, c, { t: '#2a2733' }); cyl(.25, .25, .55, .19, .04, lt(c, .2), { ol: false, t: '#2a2733' }); },
    { variants: [{}, { c: '#d8a848' }, { recycle: true }] }),
  F('generic.sofa', ['generic', 'bank', 'office', 'clinic', 'seating', 'sofa', 'waiting'], p => [p.w || 2, 1, .95], p => sofa(0, 0, p.w || 2, .9, p.c || '#3f6a5a'),
    { seats: p => Array.from({ length: Math.round(p.w || 2) }, (_, i) => ({ x: .55 + i * (((p.w || 2) - 1.1) / Math.max(1, Math.round(p.w || 2) - 1)), y: .55, z: .42, dir: 1 })), variants: [{}, { c: '#5a4a6a', w: 3 }, { c: '#8a5a3a' }, { c: '#3a3f4c', w: 1 }] }),
  F('generic.bench', ['generic', 'seating', 'bench'], [1.5, .5, .5], p => { const c = p.c || '#b07444'; table(0, .04, 1.5, .42, .45, c, { thick: true, leg: '#3a3f4c' }); lw([0, .25, .45], [1.5, .25, .45], dk(c, .25)); },
    { seats: [{ x: .4, y: .25, z: .45, dir: 1 }, { x: 1.1, y: .25, z: .45, dir: 1 }], variants: [{}, { c: '#e8e2d4' }] }),
  F('generic.floorlamp', ['generic', 'lamp', 'decor'], [.5, .5, 1.7], p => lamp(.25, .25, 0, 1.65, p.c || '#f1e4c0', { r: .19, base: p.base || '#3a3f4c' }), { light: { x: .25, y: .25, z: 0, r: 2.5 }, variants: [{}, { c: '#c0563a', base: '#d8a848' }] }),
  F('generic.vending', ['generic', 'vending', 'snacks'], [1, .5, 2], p => {
    const c = p.c || '#c0392b'; box(0, 0, 0, 1, .5, 1.95, c); qy(0, 1, .5, 0, .1, '#2a2733'); lit(() => qy(.06, .68, .5, .55, 1.85, goods(p.kind || 'drinks', 4, { seed: p.seed || 2, back: '#e8f4f8', board: '#aab2ba' }))); qy(.06, .68, .5, .55, 1.85, '#e4f6fa', 'glass'); frameY(.06, .68, .5, .55, 1.85, '#2a2733');
    qy(.74, .94, .5, 1.0, 1.5, '#2a2733'); lit(() => { qy(.77, .91, .5, 1.36, 1.46, '#5af08a'); }); for (let i = 0; i < 6; i++) spx(.79 + (i % 2) * .08, .5, 1.28 - (i >> 1) * .07, 0, 0, '#d5dbe0'); qy(.78, .9, .5, 1.04, 1.08, '#8a9098'); qy(.1, .64, .5, .18, .42, '#2a2733'); lw([.1, .5, .42], [.64, .5, .42], '#8a9098');
  }, { use: { x: .5, y: 1 }, variants: [{}, { c: '#3c64ad', kind: 'snacks', seed: 5 }] }),
  F('generic.coatrack', ['generic', 'decor'], [.5, .5, 1.8], p => { cyl(.25, .25, 0, .17, .04, '#5a3a28'); tube([.25, .25, .04], [.25, .25, 1.75], '#8a5a3a'); for (const [a, b] of [[-.15, 0], [.15, 0], [0, .15]]) lw([.25, .25, 1.6], [.25 + a, .25 + b, 1.72], '#8a5a3a'); bx(.3, .2, .9, .14, .12, .75, p.c || '#3c64ad'); bx(.1, .3, 1.1, .12, .1, .55, '#c0a078'); cyl(.25, .25, 1.75, .12, .08, '#3a3f4c', { ol: false }); }, { variants: [{}, { c: '#c0392b' }] }),
  F('generic.pendant', ['generic', 'lamp', 'overhead', 'decor'], [.5, .5, 2.8], p => { const c = p.c || '#3a3f4c'; post(.25, .25, 2.3, 2.8, '#2a2733'); cyl(.25, .25, 2.1, .2, .2, c, { t: dk(c, .2) }); lit(() => cyl(.25, .25, 2.08, .14, .02, '#fff2c4', { ol: false })); glow(() => cyl(.25, .25, 2.0, .2, .06, '#ffe6a0', { ol: false })); },
    { solid: false, overhead: true, vb: [-.2, -.2, 1.8, .7, .7, 2.9], light: { x: .25, y: .25, z: 0, r: 3 }, variants: [{}, { c: '#d8a848' }, { c: '#c0563a' }] }),
);
